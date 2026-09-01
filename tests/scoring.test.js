const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scoring = require("../scoring.js");

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

function scoreOptions(player, levels, pick = 1) {
  return {
    context: neutralContext(player),
    replacementLevels: levels,
    rosterCounts: { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 },
    rosterLength: 0,
    starterSlotsFilled: 0,
    benchFilled: 0,
    league: { teams: 10, starterSlots: 10, bench: 6 },
    pick,
    strategy: "balanced",
    status: { className: "" }
  };
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

test("replacement levels allocate fixed positions and flex spots", () => {
  const players = [];
  ["QB", "RB", "WR", "TE"].forEach((pos) => {
    const count = pos === "QB" ? 15 : pos === "TE" ? 25 : 45;
    for (let index = 0; index < count; index += 1) {
      players.push({ id: `${pos}-${index}`, pos, rank: index, proj: 40 - index * 0.1 });
    }
  });
  const levels = scoring.buildReplacementLevels(players, { teams: 10 });
  assert.deepEqual(levels.fixedSlots, { QB: 10, RB: 20, WR: 20, TE: 10 });
  assert.equal(levels.flexSlots, 20);
  assert.equal(levels.allocation.QB, 10);
  assert.equal(levels.allocation.FLEX, 20);
  for (const position of ["QB", "RB", "WR", "TE"]) {
    const bestUnselected = players.filter((player) => player.pos === position && !levels.selectedIds.includes(player.id)).sort((a, b) => b.proj - a.proj)[0];
    assert.equal(levels.baselines[position], bestUnselected.proj);
    assert.equal(scoring.normalizeVOR(bestUnselected.proj - levels.baselines[position], levels), 50);
  }
});

test("every board player has provenance and a finite deterministic score", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, { teams: 10 });
  const allowed = {
    adpQuality: new Set(["market", "estimated"]),
    projectionQuality: new Set(["sourced", "estimated", "adp-derived", "missing"]),
    recentQuality: new Set(["two-season", "one-season", "missing"])
  };
  assert.equal(board.players.length, 323);
  for (const player of board.players) {
    for (const field of Object.keys(allowed)) assert.ok(allowed[field].has(player[field]), `${player.id} missing valid ${field}`);
    const first = scoring.scorePlayer(player, scoreOptions(player, levels));
    const second = scoring.scorePlayer(player, scoreOptions(player, levels));
    assert.ok(Number.isFinite(first.score), `${player.id} score is not finite`);
    assert.deepEqual(first, second);
  }
});

test("QB scores have no former pick-110, 140, or 160 cliffs", () => {
  const board = loadBoard();
  const levels = scoring.buildReplacementLevels(board.players, { teams: 10 });
  const qb = board.players.find((player) => player.id === "josh-allen");
  const scores = [109, 110, 139, 140, 159, 160].map((pick) => scoring.scorePlayer(qb, scoreOptions(qb, levels, pick)).score);
  assert.equal(new Set(scores).size, 1);
});
