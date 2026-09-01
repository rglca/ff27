const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scoring = require("../scoring.js");

const LEAGUE = { teams: 10, starterSlots: 10, bench: 6 };
const EMPTY_COUNTS = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };

function loadBoard() {
  const context = { window: {} };
  vm.createContext(context);
  ["data/players.js", "data/pool.js", "data/context.js", "data/updates.js"].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file });
  });
  return context.window.FANTASY_BOARD;
}

function neutralContext(player) {
  return {
    role: scoring.roleFor(player, {}),
    fit: { multiplier: 1 },
    bye: { multiplier: 1 }
  };
}

function scoreOptions(player, levels, overrides = {}) {
  return {
    context: neutralContext(player),
    replacementLevels: levels,
    rosterCounts: { ...EMPTY_COUNTS },
    rosterLength: 0,
    starterSlotsFilled: 0,
    benchFilled: 0,
    league: LEAGUE,
    pick: 1,
    strategy: "balanced",
    status: { className: "" },
    ...overrides
  };
}

function fixturePlayers() {
  const players = [];
  ["QB", "RB", "WR", "TE", "K", "DEF"].forEach((pos) => {
    const count = pos === "QB" ? 15 : pos === "TE" ? 25 : pos === "K" || pos === "DEF" ? 15 : 45;
    for (let index = 0; index < count; index += 1) {
      players.push({
        id: `${pos}-${index}`,
        name: `${pos} ${index}`,
        pos,
        rank: index,
        proj: 40 - index * 0.1,
        projectionQuality: "sourced"
      });
    }
  });
  return players;
}

test("role precedence protects backups, rotation players, and injury-risk starters", () => {
  const role = (label, pos = "RB") => scoring.roleFor({ id: label, pos, rank: 1, depthRole: label }, {});
  assert.equal(role("LEAD RB").multiplier, 1.06);
  assert.equal(role("RB2 / ROTATION").multiplier, 1.01);
  assert.equal(role("WR1 / ROTATION", "WR").multiplier, 1.01);
  assert.equal(role("HANDCUFF").multiplier, 0.96);
  assert.equal(role("LEAD RB / INJURY RISK").multiplier, 1.02);
  assert.equal(role("STARTER QB / INJURY RISK", "QB").multiplier, 1.02);
});

test("weighted means renormalize when a component is unavailable", () => {
  assert.equal(scoring.weightedMean([{ value: 100, weight: 0.48 }, { value: 0, weight: 0.27 }]), 64);
  assert.equal(scoring.weightedMean([{ value: 100, weight: 0.48 }]), 100);
  assert.equal(scoring.weightedMean([{ value: 100, weight: 0 }]), null);
});

test("ADP-derived projections do not receive a second projection signal", () => {
  const levels = { baselines: { RB: 10 }, vorScales: { positive: 10, negative: 10 } };
  const player = { id: "derived", pos: "RB", proj: 18, adp: 40, projectionQuality: "adp-derived", adpQuality: "estimated", fpg25: 14, fpg24: null };
  const details = scoring.componentInputs(player, levels);
  assert.equal(details.projectedWeight, 0);
  assert.deepEqual(details.components.map((component) => component.key), ["market", "recent"]);
  assert.equal(scoring.projectionWeight({ proj: 18, adp: 40, projectionQuality: "estimated" }), 0.24);
  assert.equal(scoring.projectionWeight({ proj: 18, adp: 40, projectionQuality: "sourced" }), 0.48);
});

test("insufficient independent projections leave a missing baseline", () => {
  const player = {
    id: "only-qb",
    name: "Only QB",
    pos: "QB",
    rank: 1,
    adp: 80,
    adpQuality: "market",
    proj: 18,
    projectionQuality: "sourced",
    fpg25: 18,
    fpg24: 17,
    recentQuality: "two-season"
  };
  const levels = scoring.buildReplacementLevels([player], LEAGUE);
  assert.equal(levels.baselines.QB, null);
  assert.equal(levels.replacementPlayerIds.QB, null);
  const details = scoring.componentInputs(player, levels);
  assert.equal(details.projectedVOR, null);
  assert.equal(details.recentVOR, null);
  assert.deepEqual(details.components.map((component) => component.key), ["market"]);
  assert.equal(scoring.scorePlayer(player, scoreOptions(player, levels)).confidence, "LOW");
});

test("replacement levels allocate fixed positions, K/DEF, and flex spots", () => {
  const players = fixturePlayers();
  const levels = scoring.buildReplacementLevels(players, LEAGUE);
  assert.deepEqual(levels.fixedSlots, { QB: 10, RB: 20, WR: 20, TE: 10, K: 10, DEF: 10 });
  assert.equal(levels.flexSlots, 20);
  assert.equal(levels.allocation.QB, 10);
  assert.equal(levels.allocation.K, 10);
  assert.equal(levels.allocation.DEF, 10);
  assert.equal(levels.allocation.FLEX, 20);
  for (const position of ["QB", "RB", "WR", "TE", "K", "DEF"]) {
    const bestUnselected = players.filter((player) => player.pos === position && !levels.selectedIds.includes(player.id)).sort((a, b) => b.proj - a.proj)[0];
    assert.equal(levels.baselines[position], bestUnselected.proj);
    assert.equal(levels.replacementPlayers[position].id, bestUnselected.id);
    assert.equal(levels.replacementProjectionQuality[position], "sourced");
    assert.equal(scoring.normalizeVOR(bestUnselected.proj - levels.baselines[position], levels), 50);
  }
});

test("real replacement players are independent and activate a 50 VOR component", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  for (const position of ["QB", "RB", "WR", "TE", "K", "DEF"]) {
    const replacement = levels.replacementPlayers[position];
    assert.ok(replacement, `${position} should have a replacement player`);
    assert.ok(["sourced", "estimated"].includes(replacement.projectionQuality));
    assert.ok(!levels.selectedIds.includes(replacement.id));
    const player = board.players.find((candidate) => candidate.id === replacement.id);
    const details = scoring.componentInputs(player, levels);
    assert.equal(details.projectedVOR, 0);
    assert.equal(details.components.find((component) => component.key === "projection").value, 50);
  }
});

test("circular fallback projections cannot change independent replacement math or scores", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  const originalIndependent = board.players.find((player) => player.projectionQuality === "sourced" && player.pos === "RB");
  const originalScore = scoring.scorePlayer(originalIndependent, scoreOptions(originalIndependent, levels)).score;
  const mutated = board.players.map((player) => player.projectionQuality === "adp-derived" ? { ...player, proj: player.proj + 10000 } : { ...player });
  const mutatedLevels = scoring.buildReplacementLevels(mutated, LEAGUE);
  assert.deepEqual(mutatedLevels.baselines, levels.baselines);
  assert.deepEqual(mutatedLevels.vorScales, levels.vorScales);
  assert.deepEqual(mutatedLevels.replacementPlayerIds, levels.replacementPlayerIds);
  const mutatedIndependent = mutated.find((player) => player.id === originalIndependent.id);
  assert.equal(scoring.scorePlayer(mutatedIndependent, scoreOptions(mutatedIndependent, mutatedLevels)).score, originalScore);
  assert.ok(levels.selectedIds.every((id) => board.players.find((player) => player.id === id).projectionQuality !== "adp-derived"));
  assert.ok(Object.values(levels.replacementPlayers).every((player) => player && player.projectionQuality !== "adp-derived"));
});

test("confidence tags cannot contradict missing or circular projections", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  const fallback = board.players.find((player) => player.projectionQuality === "adp-derived");
  assert.ok(fallback);
  assert.equal(scoring.projectionWeight(fallback), 0);
  for (const id of ["michael-pittman-jr", "kyle-pitts"]) {
    const player = board.players.find((candidate) => candidate.id === id);
    const metrics = scoring.scorePlayer(player, scoreOptions(player, levels));
    const tags = scoring.provenanceTags(player, metrics).map((tag) => tag.label);
    assert.notEqual(metrics.confidence, "HIGH");
    assert.ok(tags.includes("PROJ MISSING"));
    assert.ok(!tags.includes("CONFIDENCE HIGH"));
  }
  const derived = board.players.find((player) => player.projectionQuality === "adp-derived");
  const derivedMetrics = scoring.scorePlayer(derived, scoreOptions(derived, levels));
  assert.notEqual(derivedMetrics.confidence, "HIGH");
  assert.ok(scoring.provenanceTags(derived, derivedMetrics).some((tag) => tag.label === "PROJ ADP-DERIVED"));
});

test("K and DEF receive VOR projection value but retain late-round timing", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  for (const position of ["K", "DEF"]) {
    const player = board.players.find((candidate) => candidate.pos === position && candidate.projectionQuality === "estimated");
    const details = scoring.componentInputs(player, levels);
    assert.equal(details.projectedWeight, 0.24);
    assert.ok(details.components.some((component) => component.key === "projection"));
    const early = scoring.scorePlayer(player, scoreOptions(player, levels, { pick: 104 }));
    const release = scoring.scorePlayer(player, scoreOptions(player, levels, { pick: 105 }));
    const late = scoring.scorePlayer(player, scoreOptions(player, levels, { pick: 106 }));
    const filled = scoring.scorePlayer(player, scoreOptions(player, levels, { pick: 105, rosterCounts: { ...EMPTY_COUNTS, [position]: 1 } }));
    assert.ok(early.score < release.score);
    assert.equal(release.need, 1.18);
    assert.equal(late.need, 1.18);
    assert.equal(filled.need, 0.22);
  }
});

test("every real board player remains finite and deterministic across draft states", () => {
  const board = loadBoard();
  assert.equal(board.players.length, 323);
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  const states = [
    { pick: 1, rosterCounts: EMPTY_COUNTS, rosterLength: 0, strategy: "balanced", status: { className: "" } },
    { pick: 80, rosterCounts: { QB: 0, RB: 2, WR: 3, TE: 1, K: 0, DEF: 0 }, rosterLength: 6, strategy: "balanced", status: { className: "" } },
    { pick: 100, rosterCounts: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 }, rosterLength: 10, strategy: "balanced", status: { className: "" } },
    { pick: 120, rosterCounts: { QB: 2, RB: 3, WR: 3, TE: 1, K: 1, DEF: 1 }, rosterLength: 11, strategy: "balanced", status: { className: "" } },
    { pick: 40, rosterCounts: EMPTY_COUNTS, rosterLength: 0, strategy: "wr-first", status: { className: "" } },
    { pick: 40, rosterCounts: EMPTY_COUNTS, rosterLength: 0, strategy: "rb-first", status: { className: "" } },
    { pick: 40, rosterCounts: EMPTY_COUNTS, rosterLength: 0, strategy: "balanced", status: { className: "manual" } }
  ];
  for (const state of states) {
    for (const player of board.players) {
      const options = scoreOptions(player, levels, state);
      const first = scoring.scorePlayer(player, options);
      const second = scoring.scorePlayer(player, options);
      assert.ok(Number.isFinite(first.score), `${player.id} score is not finite`);
      assert.deepEqual(first, second);
    }
  }
});

test("QB scores have no former pick-110, 140, or 160 cliffs", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, LEAGUE);
  const qb = board.players.find((player) => player.id === "josh-allen");
  const scores = [109, 110, 139, 140, 159, 160].map((pick) => scoring.scorePlayer(qb, scoreOptions(qb, levels, { pick })).score);
  assert.equal(new Set(scores).size, 1);
});
