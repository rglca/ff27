/*
 * DOM-free scoring engine for Draftboard.
 * The browser loads this as a global; Node tests load the same file via require.
 */
(function attachScoring(root, factory) {
  const scoring = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = scoring;
  else root.FANTASY_SCORING = scoring;
})(typeof window !== "undefined" ? window : globalThis, () => {
  "use strict";

  const WEIGHTS = Object.freeze({ projection: 0.48, market: 0.27, recent: 0.25 });
  const POSITION_ORDER = ["QB", "RB", "WR", "TE"];
  const FLEX_POSITIONS = ["RB", "WR", "TE"];
  const STARTER_SLOTS = Object.freeze({ QB: 1, RB: 2, WR: 2, TE: 1 });
  const ROLE_MULTIPLIERS = Object.freeze({
    starter: 1.06,
    injuryRisk: 1.02,
    rotation: 1.01,
    backup: 0.96,
    neutral: 1.01,
    fallbackQB: 1.03,
    fallbackUnit: 1.02,
    fallbackStarter: 1.01,
    fallbackRotation: 0.98,
    fallbackContingency: 0.93
  });

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeRoleParts(label) {
    return String(label || "")
      .toUpperCase()
      .replace(/\s+/g, " ")
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function roleFor(player, roles = {}) {
    const explicit = roles[player.id] || player.depthRole;
    if (explicit) {
      const parts = normalizeRoleParts(explicit);
      const has = (value) => parts.includes(value);
      const isBackup = has("HANDCUFF") || has("CONTINGENCY");
      const isRotation = has("ROTATION");
      const isInjuryRisk = has("INJURY RISK");
      const isStarter = [
        "LEAD RB", "RB1", "RB2", "WR1", "WR2", "TE1", "ELITE QB", "STARTER QB", "STARTER K", "STARTER UNIT"
      ].some(has);

      // Precedence matters: a rotational or contingency label must not receive
      // a starter bonus merely because its composite label contains RB1/WR1.
      let multiplier = ROLE_MULTIPLIERS.neutral;
      let tone = "neutral";
      if (isBackup) {
        multiplier = ROLE_MULTIPLIERS.backup;
        tone = "risk";
      } else if (isRotation) {
        multiplier = ROLE_MULTIPLIERS.rotation;
        tone = isInjuryRisk ? "risk" : "neutral";
      } else if (isInjuryRisk && isStarter) {
        multiplier = ROLE_MULTIPLIERS.injuryRisk;
        tone = "risk";
      } else if (isStarter) {
        multiplier = ROLE_MULTIPLIERS.starter;
        tone = "good";
      } else if (isInjuryRisk) {
        multiplier = ROLE_MULTIPLIERS.injuryRisk;
        tone = "risk";
      }
      return { label: explicit, tone, multiplier };
    }

    if (player.pos === "QB") return { label: "STARTER QB", tone: "good", multiplier: ROLE_MULTIPLIERS.fallbackQB };
    if (["K", "DEF"].includes(player.pos)) return { label: "STARTER UNIT", tone: "good", multiplier: ROLE_MULTIPLIERS.fallbackUnit };
    if (player.rank <= 90) return { label: "STARTER / ROTATION", tone: "neutral", multiplier: ROLE_MULTIPLIERS.fallbackStarter };
    if (player.rank <= 140) return { label: "ROTATION", tone: "neutral", multiplier: ROLE_MULTIPLIERS.fallbackRotation };
    return { label: "CONTINGENCY", tone: "risk", multiplier: ROLE_MULTIPLIERS.fallbackContingency };
  }

  function weightedMean(components) {
    const available = (components || []).filter((component) => isFiniteNumber(component.value) && component.weight > 0);
    const totalWeight = available.reduce((sum, component) => sum + component.weight, 0);
    if (!totalWeight) return null;
    return available.reduce((sum, component) => sum + Number(component.value) * component.weight, 0) / totalWeight;
  }

  function marketScore(adp) {
    if (!isFiniteNumber(adp)) return null;
    return clamp(100 - (Number(adp) / 2.05), 12, 100);
  }

  function sortByProjection(a, b) {
    return Number(b.proj) - Number(a.proj) || Number(a.rank || 9999) - Number(b.rank || 9999) || String(a.id).localeCompare(String(b.id));
  }

  function buildReplacementLevels(players, league = {}) {
    const teams = Number(league.teams) || 10;
    const fixedSlots = {
      QB: teams * STARTER_SLOTS.QB,
      RB: teams * STARTER_SLOTS.RB,
      WR: teams * STARTER_SLOTS.WR,
      TE: teams * STARTER_SLOTS.TE
    };
    const selectedIds = new Set();
    const allocation = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: teams * 2 };

    POSITION_ORDER.forEach((position) => {
      players
        .filter((player) => player.pos === position && isFiniteNumber(player.proj))
        .sort(sortByProjection)
        .slice(0, fixedSlots[position])
        .forEach((player) => {
          selectedIds.add(player.id);
          allocation[position] += 1;
        });
    });

    players
      .filter((player) => FLEX_POSITIONS.includes(player.pos) && isFiniteNumber(player.proj) && !selectedIds.has(player.id))
      .sort(sortByProjection)
      .slice(0, allocation.FLEX)
      .forEach((player) => {
        selectedIds.add(player.id);
        allocation[player.pos] += 1;
      });

    const baselines = {};
    POSITION_ORDER.forEach((position) => {
      const bestUnselected = players
        .filter((player) => player.pos === position && isFiniteNumber(player.proj) && !selectedIds.has(player.id))
        .sort(sortByProjection)[0];
      baselines[position] = bestUnselected ? Number(bestUnselected.proj) : null;
    });

    const vorValues = players
      .filter((player) => isFiniteNumber(player.proj) && isFiniteNumber(baselines[player.pos]))
      .map((player) => Number(player.proj) - baselines[player.pos]);
    const positiveScale = Math.max(1, ...vorValues.filter((value) => value > 0), 1);
    const negativeScale = Math.max(1, ...vorValues.filter((value) => value < 0).map((value) => Math.abs(value)), 1);

    return {
      baselines,
      replacement: baselines,
      vorScales: { positive: positiveScale, negative: negativeScale },
      selectedIds: [...selectedIds],
      allocation,
      fixedSlots,
      flexSlots: allocation.FLEX
    };
  }

  function normalizeVOR(vor, levels) {
    if (!isFiniteNumber(vor)) return null;
    const scales = levels && levels.vorScales ? levels.vorScales : { positive: 1, negative: 1 };
    if (Number(vor) >= 0) return clamp(50 + (Number(vor) / Math.max(1, scales.positive)) * 50, 0, 100);
    return clamp(50 - (Math.abs(Number(vor)) / Math.max(1, scales.negative)) * 50, 0, 100);
  }

  function projectionWeight(player) {
    if (!isFiniteNumber(player.proj)) return 0;
    const quality = player.projectionQuality || "estimated";
    if (quality === "adp-derived" && isFiniteNumber(player.adp)) return 0;
    if (quality === "estimated") return WEIGHTS.projection * 0.5;
    return WEIGHTS.projection;
  }

  function recentValues(player) {
    return [player.fpg25, player.fpg24].filter(isFiniteNumber).map(Number);
  }

  function componentInputs(player, levels) {
    const baseline = levels && levels.baselines ? levels.baselines[player.pos] : null;
    const projectedVOR = isFiniteNumber(player.proj) && isFiniteNumber(baseline) ? Number(player.proj) - baseline : null;
    const values = recentValues(player);
    const recent = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const recentVOR = isFiniteNumber(recent) && isFiniteNumber(baseline) ? recent - baseline : null;
    const components = [];
    const projectedWeight = projectionWeight(player);

    if (projectedWeight > 0 && isFiniteNumber(projectedVOR)) {
      components.push({ key: "projection", value: normalizeVOR(projectedVOR, levels), weight: projectedWeight });
    }
    const market = marketScore(player.adp);
    if (isFiniteNumber(market)) components.push({ key: "market", value: market, weight: WEIGHTS.market });
    if (isFiniteNumber(recentVOR)) {
      components.push({ key: "recent", value: normalizeVOR(recentVOR, levels), weight: WEIGHTS.recent });
    }

    return {
      components,
      baseline: isFiniteNumber(baseline) ? baseline : null,
      projectedVOR,
      recent,
      recentVOR,
      projectedWeight
    };
  }

  function flexesFilled(counts) {
    return Math.min(2, Math.max(0, (counts.RB || 0) - 2) + Math.max(0, (counts.WR || 0) - 2) + Math.max(0, (counts.TE || 0) - 1));
  }

  function starterSlotsFilled(counts) {
    return Math.min(1, counts.QB || 0) + Math.min(2, counts.RB || 0) + Math.min(2, counts.WR || 0) + Math.min(1, counts.TE || 0) + flexesFilled(counts) + Math.min(1, counts.K || 0) + Math.min(1, counts.DEF || 0);
  }

  function needMultiplier(player, options) {
    const counts = options.rosterCounts || {};
    const league = options.league || { bench: 6 };
    const pick = Number(options.pick) || 1;
    let need = 1;
    if (player.pos === "RB" && (counts.RB || 0) < 2) need *= 1.16;
    if (player.pos === "WR" && (counts.WR || 0) < 2) need *= 1.16;
    if (player.pos === "TE" && (counts.TE || 0) < 1) need *= 1.12;
    if (player.pos === "TE" && flexesFilled(counts) < 2) need *= 1.03;
    if (FLEX_POSITIONS.includes(player.pos) && flexesFilled(counts) < 2) need *= 1.04;
    if (player.pos === "QB" && (counts.QB || 0) > 0) need *= 0.42;
    if (player.pos === "K") need *= (counts.K || 0) === 0 && pick >= 105 ? 1.18 : 0.22;
    if (player.pos === "DEF") need *= (counts.DEF || 0) === 0 && pick >= 105 ? 1.18 : 0.22;

    const starterCount = options.starterSlotsFilled ?? starterSlotsFilled(counts);
    const benchCount = options.benchFilled ?? Math.min(Number(league.bench) || 6, Math.max(0, (options.rosterLength ?? 0) - starterCount));
    if (benchCount < (Number(league.bench) || 6) && starterCount >= 10 && FLEX_POSITIONS.includes(player.pos)) need *= 1.08;

    const early = pick <= 70;
    if (options.strategy === "wr-first" && player.pos === "WR" && early) need *= 1.10;
    if (options.strategy === "rb-first" && player.pos === "RB" && early) need *= 1.10;
    if (["K", "DEF"].includes(player.pos) && pick < 105) need *= 0.28;
    return need;
  }

  function healthMultiplier(status) {
    const className = typeof status === "string" ? status : status && status.className;
    if (className === "out" || className === "manual") return 0.08;
    if (className === "questionable") return 0.84;
    return 1;
  }

  function confidenceFor(player, details) {
    const projectionQuality = player.projectionQuality || "missing";
    const recentQuality = player.recentQuality || (details.recent === null ? "missing" : "one-season");
    if (details.components.length <= 1 || projectionQuality === "adp-derived" || recentQuality === "missing") return "LOW";
    if (projectionQuality === "estimated" || recentQuality === "one-season" || player.adpQuality === "estimated") return "MEDIUM";
    return "HIGH";
  }

  function scorePlayer(player, options = {}) {
    const levels = options.replacementLevels || buildReplacementLevels([player], options.league);
    const details = componentInputs(player, levels);
    const baseScore = weightedMean(details.components) ?? 50;
    const context = options.context || { role: roleFor(player, options.roles || {}), fit: { multiplier: 1 }, bye: { multiplier: 1 } };
    const roleMultiplier = context.role && isFiniteNumber(context.role.multiplier) ? Number(context.role.multiplier) : 1;
    const fitMultiplier = context.fit && isFiniteNumber(context.fit.multiplier) ? Number(context.fit.multiplier) : 1;
    const byeMultiplier = context.bye && isFiniteNumber(context.bye.multiplier) ? Number(context.bye.multiplier) : 1;
    let score = baseScore * roleMultiplier * fitMultiplier * byeMultiplier;
    const need = needMultiplier(player, options);
    const health = healthMultiplier(options.status);
    score *= need * health;

    return {
      score,
      baseScore,
      recent: details.recent,
      recentVOR: details.recentVOR,
      projectedVOR: details.projectedVOR,
      replacementPPG: details.baseline,
      need,
      health,
      confidence: confidenceFor(player, details),
      components: details.components,
      context,
      value: isFiniteNumber(player.adp) && isFiniteNumber(player.rank) ? Number(player.adp) - Number(player.rank) : 0
    };
  }

  return {
    WEIGHTS,
    STARTER_SLOTS,
    FLEX_POSITIONS,
    roleFor,
    weightedMean,
    marketScore,
    buildReplacementLevels,
    normalizeVOR,
    projectionWeight,
    componentInputs,
    scorePlayer,
    healthMultiplier
  };
});
