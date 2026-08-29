(() => {
  const { players, asOf } = window.FANTASY_BOARD;
  const STORAGE_KEY = "draftboard-2026-state-v1";
  const makeInitialState = () => ({
    strategy: "balanced",
    pick: 1,
    drafted: [],
    myRoster: [],
    manualInjured: {},
    view: "board",
    posFilter: "ALL",
    search: "",
    sort: "score",
    availableOnly: true,
    history: [],
    feedback: ""
  });
  let state = loadState();

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const playerById = new Map(players.map((p) => [p.id, p]));

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const fresh = makeInitialState();
      return saved ? { ...fresh, ...saved, history: [] } : fresh;
    } catch (_) {
      return makeInitialState();
    }
  }

  function saveState() {
    const { history, feedback, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }

  function snapshot() {
    return {
      pick: state.pick,
      drafted: [...state.drafted],
      myRoster: [...state.myRoster],
      manualInjured: { ...state.manualInjured }
    };
  }

  function commit(change) {
    state.history.push(snapshot());
    change();
    state.feedback = "";
    saveState();
    renderAll();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function getPlayer(id) {
    return playerById.get(id);
  }

  function officialStatus(p) {
    if (p.status === "O") return { label: "OUT", className: "out" };
    if (p.status === "Q") return { label: "Q", className: "questionable" };
    return { label: "", className: "" };
  }

  function displayStatus(p) {
    if (state.manualInjured[p.id]) return { label: "INJ", className: "manual", note: "Manual injury tag" };
    const status = officialStatus(p);
    return { ...status, note: p.injury };
  }

  function counts() {
    const result = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    state.myRoster.forEach((id) => {
      const p = getPlayer(id);
      if (p && result[p.pos] !== undefined) result[p.pos] += 1;
    });
    return result;
  }

  function flexesFilled(rosterCounts = counts()) {
    return Math.min(2, Math.max(0, rosterCounts.RB - 2) + Math.max(0, rosterCounts.WR - 2) + rosterCounts.TE);
  }

  function currentPick() {
    return Math.max(1, Number(state.pick) || state.drafted.length + 1);
  }

  function scorePlayer(p) {
    const c = counts();
    const pick = currentPick();
    const averageRecent = [p.fpg25, p.fpg24].filter((value) => Number.isFinite(value));
    const recent = averageRecent.length ? averageRecent.reduce((a, b) => a + b, 0) / averageRecent.length : null;
    const projectionScore = p.proj ? Math.min(100, (p.proj / 24) * 100) : recent ? Math.min(100, (recent / 20) * 100) : 46;
    const marketScore = Math.max(12, 100 - (p.adp / 2.05));
    const statScore = recent ? Math.min(100, (recent / 20) * 100) : projectionScore * 0.88;
    let score = (projectionScore * 0.48) + (marketScore * 0.27) + (statScore * 0.25);

    let need = 1;
    if (p.pos === "RB" && c.RB < 2) need *= 1.16;
    if (p.pos === "WR" && c.WR < 2) need *= 1.16;
    if (p.pos === "TE" && flexesFilled(c) < 2) need *= 1.03;
    if (["RB", "WR", "TE"].includes(p.pos) && flexesFilled(c) < 2) need *= 1.04;
    if (p.pos === "QB") need *= c.QB === 0 ? 1.05 : 0.42;
    if (p.pos === "K") need *= c.K === 0 && pick >= 105 ? 1.18 : 0.22;
    if (p.pos === "DEF") need *= c.DEF === 0 && pick >= 105 ? 1.18 : 0.22;

    const early = pick <= 70;
    if (state.strategy === "wr-first" && p.pos === "WR" && early) need *= 1.10;
    if (state.strategy === "rb-first" && p.pos === "RB" && early) need *= 1.10;
    if (p.pos === "QB" && pick < 36 && p.proj < 22) need *= 0.82;
    if (["K", "DEF"].includes(p.pos) && pick < 105) need *= 0.28;

    const status = displayStatus(p);
    const health = status.className === "out" || status.className === "manual" ? 0.08 : status.className === "questionable" ? 0.84 : 1;
    score *= need * health;

    return {
      score,
      recent,
      need,
      health,
      value: p.adp - p.rank
    };
  }

  function availablePlayers() {
    const search = normalize(state.search);
    return players
      .filter((p) => !state.availableOnly || !state.drafted.includes(p.id))
      .filter((p) => state.posFilter === "ALL" || p.pos === state.posFilter)
      .filter((p) => !search || normalize(`${p.name}${p.team}${p.pos}`).includes(search))
      .map((p) => ({ p, metrics: scorePlayer(p) }))
      .sort((a, b) => {
        if (state.sort === "adp") return a.p.adp - b.p.adp;
        if (state.sort === "projection") return (b.p.proj || 0) - (a.p.proj || 0);
        if (state.sort === "recent") return (b.metrics.recent || 0) - (a.metrics.recent || 0);
        if (state.sort === "value") return b.metrics.value - a.metrics.value;
        return b.metrics.score - a.metrics.score;
      });
  }

  function topRecommendations(limit = 4) {
    return players
      .filter((p) => !state.drafted.includes(p.id))
      .map((p) => ({ p, metrics: scorePlayer(p) }))
      .sort((a, b) => b.metrics.score - a.metrics.score)
      .slice(0, limit);
  }

  function recommendationReason(p, metrics) {
    const c = counts();
    const status = displayStatus(p);
    if (status.className === "out" || status.className === "manual") return "This player is tagged out. The engine is showing the next-best available pivot instead.";
    if (status.className === "questionable") return `${p.injury || "Questionable status"}. The engine applies a health discount, so only take this price if you are comfortable with the risk.`;
    const needs = [];
    if (c.RB < 2 && p.pos === "RB") needs.push(`${2 - c.RB} RB slot${c.RB === 1 ? "" : "s"}`);
    if (c.WR < 2 && p.pos === "WR") needs.push(`${2 - c.WR} WR slot${c.WR === 1 ? "" : "s"}`);
    if (flexesFilled(c) < 2 && ["RB", "WR", "TE"].includes(p.pos)) needs.push("FLEX depth");
    const strategy = state.strategy === "wr-first" && p.pos === "WR" ? " WR-first gets a small boost here." : state.strategy === "rb-first" && p.pos === "RB" ? " RB-first gets a small boost here." : "";
    const needText = needs.length ? `Fills ${needs.join(" + ")}.` : "Fits the best remaining value on your roster.",
      recent = metrics.recent ? `Recent form: ${metrics.recent.toFixed(1)} PPR FPG.` : "Projection-led profile; recent stat coverage is limited.";
    return `${needText} ADP ${p.adp.toFixed(1)} · projection ${p.proj ? `${p.proj.toFixed(1)} PPR FPG` : "not listed"}. ${recent}${strategy}`;
  }

  function renderRecommendation() {
    const [best, ...alternatives] = topRecommendations(4);
    const container = $("#recommendation-content");
    if (!best) {
      container.innerHTML = `<div class="recommendation-main"><div><div class="rec-name">Board cleared</div><div class="rec-meta">Reset the tracker to start another draft.</div></div></div>`;
      return;
    }
    const status = displayStatus(best.p);
    const statusText = status.label ? ` · ${status.label}` : "";
    container.innerHTML = `
      <div class="recommendation-main">
        <div class="recommendation-player">
          <div class="rec-rank">#${best.p.rank}</div>
          <div>
            <div class="rec-name">${escapeHtml(best.p.name)}</div>
            <div class="rec-meta">${best.p.pos} · ${best.p.team} · ADP ${best.p.adp.toFixed(1)}${statusText}</div>
          </div>
        </div>
        <div class="recommendation-score"><div class="rec-score">${Math.round(best.metrics.score)}</div><div class="rec-score-label">draft score</div></div>
      </div>
      <div class="recommendation-reason">${escapeHtml(recommendationReason(best.p, best.metrics))}</div>
      <div class="rec-alternatives" aria-label="Alternative picks">
        ${alternatives.map(({ p, metrics }) => `<button class="rec-alt" data-recommendation-take="${p.id}" type="button">${escapeHtml(p.name)} · ${Math.round(metrics.score)}</button>`).join("")}
      </div>`;
  }

  function renderRoster() {
    const c = counts();
    const slots = [
      ["QB", 1], ["RB", 2], ["WR", 2], ["FLEX", 2], ["K", 1], ["DEF", 1]
    ];
    $("#roster-slots").innerHTML = slots.map(([label, max]) => {
      const count = label === "FLEX" ? flexesFilled(c) : c[label];
      return `<div class="slot"><div class="slot-label">${label}</div><div class="slot-count ${count >= max ? "complete" : ""}">${count}/${max}</div></div>`;
    }).join("");
    $("#pick-count").textContent = `${state.myRoster.length} roster pick${state.myRoster.length === 1 ? "" : "s"}`;
  }

  function renderRecentPicks() {
    const recent = state.drafted.slice(-8).reverse();
    const container = $("#recent-picks");
    if (!recent.length) {
      container.innerHTML = `<div class="muted-small">Nothing logged yet. During the draft, type names here and press Enter.</div>`;
    } else {
      container.innerHTML = recent.map((id) => {
        const p = getPlayer(id);
        const mine = state.myRoster.includes(id);
        return `<span class="recent-pick" title="${mine ? "Your pick" : "League pick"}">${mine ? "You · " : ""}${escapeHtml(p.name)} <button data-remove-pick="${p.id}" type="button" aria-label="Remove ${escapeHtml(p.name)}">×</button></span>`;
      }).join("");
    }
    const undo = $("#undo-button");
    undo.disabled = !state.history.length;
    if (state.feedback) {
      container.insertAdjacentHTML("afterbegin", `<div class="muted-small" style="width:100%;color:var(--red)">${escapeHtml(state.feedback)}</div>`);
    }
  }

  function renderDatalist() {
    $("#player-suggestions").innerHTML = players.map((p) => `<option value="${escapeHtml(p.name)}">`).join("");
  }

  function renderBoard() {
    const rows = availablePlayers();
    const posOptions = ["ALL", "RB", "WR", "QB", "TE", "K", "DEF"];
    $("#board-view").innerHTML = `
      <div class="board-toolbar">
        <input id="board-search" value="${escapeHtml(state.search)}" placeholder="Search player, team, or position" aria-label="Search board" />
        <select id="board-sort" aria-label="Sort board">
          <option value="score" ${state.sort === "score" ? "selected" : ""}>Draft score</option>
          <option value="adp" ${state.sort === "adp" ? "selected" : ""}>ADP</option>
          <option value="projection" ${state.sort === "projection" ? "selected" : ""}>Projection</option>
          <option value="recent" ${state.sort === "recent" ? "selected" : ""}>Recent FPG</option>
          <option value="value" ${state.sort === "value" ? "selected" : ""}>Value vs rank</option>
        </select>
        <label class="available-toggle"><input id="available-only" type="checkbox" ${state.availableOnly ? "checked" : ""} /> Available only</label>
        <div class="filter-pills">${posOptions.map((pos) => `<button class="filter-pill ${state.posFilter === pos ? "active" : ""}" data-position-filter="${pos}" type="button">${pos === "ALL" ? "All" : pos}</button>`).join("")}</div>
      </div>
      <div class="table-head"><div>#</div><div>Player</div><div>ADP</div><div>Proj</div><div>2025 FPG</div><div>Score</div><div></div></div>
      <div class="player-list">${rows.length ? rows.map(renderPlayerRow).join("") : `<div class="empty-state">No players match this view.</div>`}</div>`;
  }

  function renderPlayerRow({ p, metrics }) {
    const status = displayStatus(p);
    const statusBadge = status.label ? `<span class="status-badge ${status.className}">${status.label}</span>` : "";
    const drafted = state.drafted.includes(p.id);
    const manual = Boolean(state.manualInjured[p.id]);
    return `<div class="player-row ${drafted ? "is-drafted" : ""} ${manual ? "is-manual-injured" : ""}">
      <div class="player-rank">${p.rank}</div>
      <div class="player-identity">
        <div class="player-name-line"><span class="position-badge">${p.pos}</span><span class="player-name">${escapeHtml(p.name)}</span>${statusBadge}</div>
        <div class="player-subline">${p.team} · bye ${p.bye}${status.note ? ` · ${escapeHtml(status.note)}` : ""}</div>
      </div>
      <div class="stat-cell">${p.adp.toFixed(1)}<span>ADP</span></div>
      <div class="stat-cell">${p.proj ? p.proj.toFixed(1) : "—"}<span>proj</span></div>
      <div class="stat-cell">${p.fpg25 ? p.fpg25.toFixed(1) : "—"}<span>2025 FPG</span></div>
      <div class="draft-score">${Math.round(metrics.score)}</div>
      <div class="row-actions">
        <button class="row-action take" data-take-player="${p.id}" type="button">I took</button>
        <button class="row-action" data-draft-player="${p.id}" type="button">Drafted</button>
        <button class="row-action injury" data-injure-player="${p.id}" type="button">${manual ? "Clear tag" : "Injure"}</button>
      </div>
    </div>`;
  }

  function shortlistCard(title, kicker, description, list) {
    return `<div class="shortlist-card"><div class="card-kicker">${kicker}</div><h4>${title}</h4><p>${description}</p>${list.map(({ p, metrics }) => `<div class="shortlist-item"><div class="shortlist-item-name">${escapeHtml(p.name)}<small>${p.pos} · ADP ${p.adp.toFixed(1)}${displayStatus(p).label ? ` · ${displayStatus(p).label}` : ""}</small></div><div class="shortlist-item-score">${Math.round(metrics.score)}</div></div>`).join("")}</div>`;
  }

  function renderShortlists() {
    const available = players.filter((p) => !state.drafted.includes(p.id)).map((p) => ({ p, metrics: scorePlayer(p) }));
    const byScore = (list) => list.sort((a, b) => b.metrics.score - a.metrics.score);
    const anchors = byScore(available.filter(({ p }) => p.rank <= 24)).slice(0, 7);
    const middle = byScore(available.filter(({ p }) => p.rank > 24 && p.rank <= 80)).slice(0, 8);
    const late = byScore(available.filter(({ p }) => p.rank > 80 && !["K", "DEF"].includes(p.pos))).slice(0, 8);
    $("#shortlists-view").innerHTML = `<div class="shortlist-grid">
      ${shortlistCard("First two rounds", "Anchor list", "A compact tier of players to feel good about from any draft slot. Let the position fall to you.", anchors)}
      ${shortlistCard("Middle-round targets", "Build list", "The best intersection of current market, projection, recent output, and roster pressure.", middle)}
      ${shortlistCard("Late-round upside", "Bench list", "Prioritize workload paths and FLEX-eligible swings before chasing a kicker or defense.", late)}
    </div>`;
  }

  function renderInjuries() {
    const flagged = players.filter((p) => p.status !== "healthy" || state.manualInjured[p.id]).sort((a, b) => a.rank - b.rank);
    $("#injuries-view").innerHTML = flagged.length ? `<div class="injury-list">${flagged.map((p) => {
      const status = displayStatus(p);
      return `<div class="injury-card"><div class="injury-title">${escapeHtml(p.name)} <small>${p.pos} · ${p.team} · ${escapeHtml(status.note || p.injury || "Manual tag")}</small></div><div class="injury-status ${status.className}">${status.label || "INJ"}</div><button class="text-button" data-injure-player="${p.id}" type="button">${state.manualInjured[p.id] ? "Clear manual tag" : "Add manual tag"}</button></div>`;
    }).join("")}</div>` : `<div class="empty-state">No injury flags in the current board.</div>`;
  }

  function renderViewState() {
    $$(".view-tab").forEach((button) => {
      const active = button.dataset.view === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    ["board", "shortlists", "injuries"].forEach((view) => {
      $(`#${view}-view`).classList.toggle("hidden", state.view !== view);
    });
  }

  function renderAll() {
    $("#pick-number").value = currentPick();
    $$(".seg-btn").forEach((button) => button.classList.toggle("active", button.dataset.strategy === state.strategy));
    renderRecommendation();
    renderRoster();
    renderRecentPicks();
    renderBoard();
    renderShortlists();
    renderInjuries();
    renderViewState();
    $("#board-subtitle").textContent = state.view === "board" ? `${state.sort === "score" ? "Sorted by draft score" : `Sorted by ${state.sort}`} · injury adjusted · ${players.length} players` : `Seeded ${asOf} · local changes save on this device`;
  }

  function resolvePlayer(value) {
    const query = normalize(value);
    if (!query) return null;
    const exact = players.find((p) => normalize(p.name) === query);
    if (exact) return exact;
    const matches = players.filter((p) => normalize(p.name).includes(query));
    return matches.length === 1 ? matches[0] : null;
  }

  function draftPlayer(id, mine = false) {
    const p = getPlayer(id);
    if (!p || state.drafted.includes(id)) return;
    commit(() => {
      state.drafted.push(id);
      if (mine) state.myRoster.push(id);
      state.pick = currentPick() + 1;
    });
  }

  function removePick(id) {
    if (!state.drafted.includes(id)) return;
    commit(() => {
      state.drafted = state.drafted.filter((draftedId) => draftedId !== id);
      state.myRoster = state.myRoster.filter((rosterId) => rosterId !== id);
      state.pick = Math.max(1, currentPick() - 1);
    });
  }

  function toggleManualInjury(id) {
    commit(() => {
      if (state.manualInjured[id]) delete state.manualInjured[id];
      else state.manualInjured[id] = true;
    });
  }

  function bindEvents() {
    $("#pick-number").addEventListener("change", (event) => {
      state.pick = Math.max(1, Number(event.target.value) || 1);
      saveState();
      renderAll();
    });

    $$(".seg-btn").forEach((button) => button.addEventListener("click", () => {
      state.strategy = button.dataset.strategy;
      saveState();
      renderAll();
    }));

    $$(".view-tab").forEach((button) => button.addEventListener("click", () => {
      state.view = button.dataset.view;
      saveState();
      renderAll();
    }));

    $("#quick-add-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#player-input");
      const p = resolvePlayer(input.value);
      if (!p) {
        state.feedback = "Pick one exact player name from the suggestions.";
        renderRecentPicks();
        return;
      }
      if (state.drafted.includes(p.id)) {
        state.feedback = `${p.name} is already logged.`;
        renderRecentPicks();
        return;
      }
      draftPlayer(p.id, false);
      input.value = "";
      input.focus();
    });

    $("#undo-button").addEventListener("click", () => {
      const previous = state.history.pop();
      if (!previous) return;
      state.pick = previous.pick;
      state.drafted = previous.drafted;
      state.myRoster = previous.myRoster;
      state.manualInjured = previous.manualInjured;
      saveState();
      renderAll();
    });

    $("#export-button").addEventListener("click", exportCsv);

    $("#reset-button").addEventListener("click", () => {
      if (!window.confirm("Clear the draft tracker and manual injury tags?")) return;
      state = makeInitialState();
      saveState();
      renderAll();
    });

    $("#board-view").addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.positionFilter) state.posFilter = target.dataset.positionFilter;
      if (target.dataset.takePlayer) draftPlayer(target.dataset.takePlayer, true);
      if (target.dataset.draftPlayer) draftPlayer(target.dataset.draftPlayer, false);
      if (target.dataset.injurePlayer) toggleManualInjury(target.dataset.injurePlayer);
      saveState();
      renderAll();
    });

    $("#shortlists-view").addEventListener("click", () => {});
    $("#injuries-view").addEventListener("click", (event) => {
      const target = event.target.closest("button[data-injure-player]");
      if (target) toggleManualInjury(target.dataset.injurePlayer);
    });

    $("#recommendation-content").addEventListener("click", (event) => {
      const target = event.target.closest("button[data-recommendation-take]");
      if (target) draftPlayer(target.dataset.recommendationTake, true);
    });

    $("#recent-picks").addEventListener("click", (event) => {
      const target = event.target.closest("button[data-remove-pick]");
      if (target) removePick(target.dataset.removePick);
    });

    $("#board-view").addEventListener("input", (event) => {
      if (event.target.id === "board-search") {
        state.search = event.target.value;
        renderBoard();
        renderViewState();
        const search = $("#board-search");
        search.focus();
        search.setSelectionRange(search.value.length, search.value.length);
      }
    });

    $("#board-view").addEventListener("change", (event) => {
      if (event.target.id === "board-sort") state.sort = event.target.value;
      if (event.target.id === "available-only") state.availableOnly = event.target.checked;
      saveState();
      renderAll();
    });
  }

  function csvCell(value) {
    const string = String(value ?? "");
    return `"${string.replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const header = ["Rank", "Player", "Position", "Team", "Bye", "ADP", "Projection PPR FPG", "2025 PPR FPG", "2024 PPR FPG", "Tier", "Official Status", "Manual Injury Tag", "Available", "Draft Score", "Injury / context"];
    const rows = players.map((p) => {
      const metrics = scorePlayer(p);
      const status = displayStatus(p);
      return [p.rank, p.name, p.pos, p.team, p.bye, p.adp, p.proj || "", p.fpg25 || "", p.fpg24 || "", p.tier, status.label || "Healthy", state.manualInjured[p.id] ? "Yes" : "No", state.drafted.includes(p.id) ? "No" : "Yes", Math.round(metrics.score), p.injury];
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "draftboard-2026-ppr.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  renderDatalist();
  bindEvents();
  renderAll();
})();
