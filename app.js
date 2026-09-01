(() => {
  const { players, asOf } = window.FANTASY_BOARD;
  const fantasyContext = window.FANTASY_CONTEXT || { systems: {}, roles: {} };
  const LEAGUE = { teams: 10, starterSlots: 10, bench: 6 };
  const QB_RECENT_PRODUCTION_WEIGHT = 0.5;
  const STORAGE_KEY = "draftboard-2026-state-v1";
  const makeInitialState = () => ({
    strategy: "balanced",
    pick: 1,
    drafted: [],
    myRoster: [],
    manualInjured: {},
    view: "board",
    posFilter: "ALL",
    adpPosFilter: "ALL",
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

  function systemFor(p) {
    return fantasyContext.systems[p.team] || {
      style: "BALANCED",
      qb: "NEUTRAL",
      shape: "UNSPECIFIED",
      fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "NEUTRAL", K: "NEUTRAL", DEF: "NEUTRAL" }
    };
  }

  function roleFor(p) {
    const explicit = fantasyContext.roles[p.id] || p.depthRole;
    if (explicit) {
      const upper = explicit.toUpperCase();
      const starter = ["LEAD", "RB1", "RB2", "WR1", "WR2", "TE1", "ELITE QB", "STARTER QB", "STARTER K", "STARTER UNIT"].some((term) => upper.includes(term));
      const contingency = ["HANDCUFF", "CONTINGENCY", "ROTATION"].some((term) => upper.includes(term));
      return {
        label: explicit,
        tone: upper.includes("INJURY RISK") || upper.includes("HANDCUFF") ? "risk" : starter ? "good" : "neutral",
        multiplier: starter ? 1.06 : contingency ? 0.96 : 1.01
      };
    }
    if (p.pos === "QB") return { label: "STARTER QB", tone: "good", multiplier: 1.03 };
    if (["K", "DEF"].includes(p.pos)) return { label: "STARTER UNIT", tone: "good", multiplier: 1.02 };
    if (p.rank <= 90) return { label: "STARTER / ROTATION", tone: "neutral", multiplier: 1.01 };
    if (p.rank <= 140) return { label: "ROTATION", tone: "neutral", multiplier: 0.98 };
    return { label: "CONTINGENCY", tone: "risk", multiplier: 0.93 };
  }

  function byeFor(p) {
    const rosterPlayers = state.myRoster.map(getPlayer).filter(Boolean);
    const sameBye = rosterPlayers.filter((rosterPlayer) => rosterPlayer.bye === p.bye);
    const samePosition = sameBye.filter((rosterPlayer) => rosterPlayer.pos === p.pos);
    const flexEligible = ["RB", "WR", "TE"].includes(p.pos);
    const flexCluster = flexEligible && sameBye.some((rosterPlayer) => ["RB", "WR", "TE"].includes(rosterPlayer.pos));
    if (samePosition.length) return { label: `BYE ${p.bye} · CLASH`, tone: "risk", multiplier: 0.95 };
    if (flexCluster) return { label: `BYE ${p.bye} · CLUSTER`, tone: "risk", multiplier: 0.98 };
    return { label: `BYE ${p.bye} · OPEN`, tone: "good", multiplier: 1.01 };
  }

  function fitFor(p, system) {
    const label = system.fit[p.pos] || "NEUTRAL";
    return {
      label,
      tone: label === "STRONG" || label === "ELITE" ? "good" : label === "WEAK" ? "risk" : "neutral",
      multiplier: label === "STRONG" || label === "ELITE" ? 1.045 : label === "WEAK" ? 0.935 : 1
    };
  }

  function contextFor(p) {
    const system = systemFor(p);
    return { system, role: roleFor(p), fit: fitFor(p, system), bye: byeFor(p) };
  }

  function needTags(p) {
    const c = counts();
    const tags = [];
    if (p.pos === "QB" && c.QB === 0) tags.push({ label: "NEED QB", tone: "neutral" });
    if (p.pos === "RB" && c.RB < 2) tags.push({ label: "NEED RB", tone: "neutral" });
    if (p.pos === "WR" && c.WR < 2) tags.push({ label: "NEED WR", tone: "neutral" });
    if (p.pos === "TE" && c.TE < 1) tags.push({ label: "NEED TE", tone: "neutral" });
    if (["RB", "WR", "TE"].includes(p.pos) && flexesFilled(c) < 2) tags.push({ label: "NEED FLEX", tone: "neutral" });
    if (benchFilled(c) < LEAGUE.bench && starterSlotsFilled(c) >= LEAGUE.starterSlots && ["RB", "WR", "TE"].includes(p.pos)) tags.push({ label: "BENCH UPSIDE", tone: "neutral" });
    return tags;
  }

  function recommendationSignals(p, metrics) {
    const context = metrics.context;
    const status = displayStatus(p);
    const tags = [
      { label: context.role.label, tone: context.role.tone },
      { label: `FIT ${context.fit.label}`, tone: context.fit.tone },
      { label: context.system.style, tone: "neutral" },
      { label: `QB ${context.system.qb}`, tone: context.system.qb === "ELITE" || context.system.qb === "STRONG" ? "good" : context.system.qb === "WEAK" || context.system.qb === "VOLATILE" ? "risk" : "neutral" },
      { label: `TARGET ${context.system.shape}`, tone: context.system.shape === "SPREAD" ? "risk" : "neutral" },
      { label: context.bye.label, tone: context.bye.tone },
      ...needTags(p)
    ];
    if (status.className === "out" || status.className === "manual") tags.push({ label: "HEALTH OUT", tone: "risk" });
    else if (status.className === "questionable") tags.push({ label: "HEALTH Q", tone: "risk" });
    if (state.strategy === "wr-first" && p.pos === "WR") tags.push({ label: "WR-FIRST", tone: "good" });
    if (state.strategy === "rb-first" && p.pos === "RB") tags.push({ label: "RB-FIRST", tone: "good" });
    return tags;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const fresh = makeInitialState();
      if (!saved) return fresh;
      const migrated = { ...fresh, ...saved, history: [] };
      if (migrated.view === "shortlists") migrated.view = "adp";
      return migrated;
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
    return Math.min(2, Math.max(0, rosterCounts.RB - 2) + Math.max(0, rosterCounts.WR - 2) + Math.max(0, rosterCounts.TE - 1));
  }

  function starterSlotsFilled(rosterCounts = counts()) {
    return Math.min(1, rosterCounts.QB) + Math.min(2, rosterCounts.RB) + Math.min(2, rosterCounts.WR) + Math.min(1, rosterCounts.TE) + flexesFilled(rosterCounts) + Math.min(1, rosterCounts.K) + Math.min(1, rosterCounts.DEF);
  }

  function benchFilled(rosterCounts = counts()) {
    return Math.min(LEAGUE.bench, Math.max(0, state.myRoster.length - starterSlotsFilled(rosterCounts)));
  }

  function currentPick() {
    return Math.max(1, Number(state.pick) || state.drafted.length + 1);
  }

  function scorePlayer(p) {
    const c = counts();
    const pick = currentPick();
    const averageRecent = [p.fpg25, p.fpg24].filter((value) => Number.isFinite(value));
    const recent = averageRecent.length ? averageRecent.reduce((a, b) => a + b, 0) / averageRecent.length : null;
    const scoringRecentValues = p.pos === "QB"
      ? [Number.isFinite(p.fpg25) ? p.fpg25 * QB_RECENT_PRODUCTION_WEIGHT : null, p.fpg24].filter((value) => Number.isFinite(value))
      : averageRecent;
    const scoringRecent = scoringRecentValues.length ? scoringRecentValues.reduce((a, b) => a + b, 0) / scoringRecentValues.length : null;
    const projectionScore = p.proj ? Math.min(100, (p.proj / 24) * 100) : scoringRecent ? Math.min(100, (scoringRecent / 20) * 100) : 46;
    const marketScore = Math.max(12, 100 - (p.adp / 2.05));
    const statScore = scoringRecent ? Math.min(100, (scoringRecent / 20) * 100) : projectionScore * 0.88;
    let score = (projectionScore * 0.48) + (marketScore * 0.27) + (statScore * 0.25);
    const context = contextFor(p);
    score *= context.role.multiplier * context.fit.multiplier * context.bye.multiplier;

    let need = 1;
    if (p.pos === "RB" && c.RB < 2) need *= 1.16;
    if (p.pos === "WR" && c.WR < 2) need *= 1.16;
    if (p.pos === "TE" && c.TE < 1) need *= 1.12;
    if (p.pos === "TE" && flexesFilled(c) < 2) need *= 1.03;
    if (["RB", "WR", "TE"].includes(p.pos) && flexesFilled(c) < 2) need *= 1.04;
    if (p.pos === "QB") {
      if (c.QB > 0) need *= 0.42;
      else if (p.id === "josh-allen" && pick <= 40) need *= 1.20;
      else if (pick < 110) need *= 0.42;
      else if (pick < 140) need *= 0.58;
      else if (pick < 160) need *= 0.78;
    }
    if (p.pos === "K") need *= c.K === 0 && pick >= 105 ? 1.18 : 0.22;
    if (p.pos === "DEF") need *= c.DEF === 0 && pick >= 105 ? 1.18 : 0.22;
    if (benchFilled(c) < LEAGUE.bench && starterSlotsFilled(c) >= LEAGUE.starterSlots && ["RB", "WR", "TE"].includes(p.pos)) need *= 1.08;

    const early = pick <= 70;
    if (state.strategy === "wr-first" && p.pos === "WR" && early) need *= 1.10;
    if (state.strategy === "rb-first" && p.pos === "RB" && early) need *= 1.10;
    if (["K", "DEF"].includes(p.pos) && pick < 105) need *= 0.28;

    const status = displayStatus(p);
    const health = status.className === "out" || status.className === "manual" ? 0.08 : status.className === "questionable" ? 0.84 : 1;
    score *= need * health;

    return {
      score,
      recent,
      need,
      health,
      context,
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

  function renderRecommendation() {
    const recommendations = topRecommendations(4);
    const container = $("#recommendation-content");
    if (!recommendations.length) {
      container.innerHTML = `<div class="recommendation-main"><div><div class="rec-name">Board cleared</div><div class="rec-meta">Reset the tracker to start another draft.</div></div></div>`;
      return;
    }
    container.innerHTML = `<div class="recommendation-grid" aria-label="Recommended players">${recommendations.map(renderRecommendationOption).join("")}</div>`;
  }

  function renderRecommendationOption({ p, metrics }) {
    const status = displayStatus(p);
    const statusText = status.label ? ` · ${status.label}` : "";
    return `<article class="recommendation-option">
      <div class="recommendation-option-head">
        <div class="recommendation-option-identity">
          <div class="rec-rank">#${p.rank}</div>
          <div class="recommendation-option-name">${escapeHtml(p.name)}</div>
          <div class="rec-meta">${p.pos} · ${p.team} · ADP ${p.adp.toFixed(1)}${statusText}</div>
        </div>
        <div class="recommendation-score"><div class="rec-score">${Math.round(metrics.score)}</div><div class="rec-score-label">score</div></div>
      </div>
      <div class="recommendation-signals" aria-label="${escapeHtml(p.name)} signals">
        ${recommendationSignals(p, metrics).map((tag) => `<span class="signal-tag ${tag.tone}">${escapeHtml(tag.label)}</span>`).join("")}
      </div>
      <div class="recommendation-option-actions">
        <button class="row-action take" data-recommendation-take="${p.id}" type="button">I took</button>
        <button class="row-action" data-recommendation-draft="${p.id}" type="button">Drafted</button>
        <button class="row-action injury" data-recommendation-injure="${p.id}" type="button">${state.manualInjured[p.id] ? "Clear tag" : "Injure"}</button>
      </div>
    </article>`;
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
    $("#pick-count").textContent = `${state.drafted.length} logged · pick ${currentPick()}`;
    if (state.feedback) {
      container.insertAdjacentHTML("afterbegin", `<div class="muted-small" style="width:100%;color:var(--red)">${escapeHtml(state.feedback)}</div>`);
    }
  }

  function renderDatalist() {
    $("#player-suggestions").innerHTML = players
      .filter((p) => !state.drafted.includes(p.id))
      .sort((a, b) => a.adp - b.adp)
      .map((p) => `<option value="${escapeHtml(p.name)}">`)
      .join("");
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

  function renderAdpRow({ p, metrics }, index) {
    const status = displayStatus(p);
    const statusBadge = status.label ? `<span class="status-badge ${status.className}">${status.label}</span>` : "";
    const manual = Boolean(state.manualInjured[p.id]);
    return `<div class="adp-row ${manual ? "is-manual-injured" : ""}">
      <div class="adp-rank">${index + 1}</div>
      <div class="player-identity">
        <div class="player-name-line"><span class="position-badge">${p.pos}</span><span class="player-name">${escapeHtml(p.name)}</span>${statusBadge}</div>
        <div class="player-subline">${p.team} · bye ${p.bye}${status.note ? ` · ${escapeHtml(status.note)}` : ""}</div>
      </div>
      <div class="adp-number">${p.adp.toFixed(1)}<span>ADP</span></div>
      <div class="adp-actions">
        <button class="row-action take" data-adp-take="${p.id}" type="button">I took</button>
        <button class="row-action" data-adp-draft="${p.id}" type="button">Drafted</button>
        <button class="row-action injury" data-adp-injure="${p.id}" type="button">${manual ? "Clear tag" : "Injure"}</button>
      </div>
    </div>`;
  }

  function renderAdp() {
    const posOptions = ["ALL", "RB", "WR", "QB", "TE", "K", "DEF"];
    const available = players
      .filter((p) => !state.drafted.includes(p.id))
      .filter((p) => state.adpPosFilter === "ALL" || p.pos === state.adpPosFilter)
      .map((p) => ({ p, metrics: scorePlayer(p) }))
      .sort((a, b) => a.p.adp - b.p.adp || a.p.name.localeCompare(b.p.name));
    $("#adp-view").innerHTML = `
      <div class="adp-toolbar">
        <div><div class="card-kicker">Sleeper-style PPR order</div><p class="muted-small">${available.length} available of ${players.length} players · remove names by marking them drafted</p></div>
        <div class="filter-pills">${posOptions.map((pos) => `<button class="filter-pill ${state.adpPosFilter === pos ? "active" : ""}" data-adp-position-filter="${pos}" type="button">${pos === "ALL" ? "All" : pos}</button>`).join("")}</div>
      </div>
      <div class="adp-list">${available.length ? available.map(renderAdpRow).join("") : `<div class="empty-state">No available players match this view.</div>`}</div>`;
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
    ["board", "adp", "injuries"].forEach((view) => {
      $(`#${view}-view`).classList.toggle("hidden", state.view !== view);
    });
  }

  function renderAll() {
    $("#current-pick").textContent = currentPick();
    $$(".seg-btn").forEach((button) => button.classList.toggle("active", button.dataset.strategy === state.strategy));
    renderRecommendation();
    renderRecentPicks();
    renderDatalist();
    renderBoard();
    renderAdp();
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

    $("#adp-view").addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.adpPositionFilter) state.adpPosFilter = target.dataset.adpPositionFilter;
      if (target.dataset.adpTake) draftPlayer(target.dataset.adpTake, true);
      if (target.dataset.adpDraft) draftPlayer(target.dataset.adpDraft, false);
      if (target.dataset.adpInjure) toggleManualInjury(target.dataset.adpInjure);
      saveState();
      renderAll();
    });
    $("#injuries-view").addEventListener("click", (event) => {
      const target = event.target.closest("button[data-injure-player]");
      if (target) toggleManualInjury(target.dataset.injurePlayer);
    });

    $("#recommendation-content").addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.recommendationTake) draftPlayer(target.dataset.recommendationTake, true);
      if (target.dataset.recommendationDraft) draftPlayer(target.dataset.recommendationDraft, false);
      if (target.dataset.recommendationInjure) toggleManualInjury(target.dataset.recommendationInjure);
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

  renderDatalist();
  bindEvents();
  renderAll();
})();
