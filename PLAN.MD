# Revision 1

The highest-value medium-lift option is replacing raw PPG with league-specific value over replacement, because it fixes the engine's largest structural weakness: comparing positions on incompatible scarcity curves.

## Implementation plan

1. **Extract testable scoring logic:** Move role parsing, component weighting, replacement-level calculation, and score normalization from `app.js` into a DOM-free `scoring.js`, while keeping the app static and no-build.

2. **Add data provenance:** Extend each player with `adpQuality`, `projectionQuality`, and `recentQuality` fields using values such as `market`, `estimated`, `sourced`, `adp-derived`, `two-season`, `one-season`, and `missing`.

3. **Populate provenance automatically:** Mark core projections in `data/players.js` as sourced, fallback projections in `data/pool.js` as ADP-derived, supplemental ADPs as estimated, and ADPs refreshed by `data/updates.js` as market observations.

4. **Fix role parsing:** Replace substring-based starter detection with explicit precedence so `HANDCUFF` and `CONTINGENCY` score as backups, `ROTATION` caps the role multiplier near neutral, and `INJURY RISK` cannot receive the full starter bonus.

5. **Test role combinations:** Cover at least `LEAD RB`, `RB2 / ROTATION`, `WR1 / ROTATION`, `HANDCUFF`, `LEAD RB / INJURY RISK`, and `STARTER QB / INJURY RISK`.

6. **Stop duplicating missing inputs:** Remove the current projection-based substitute for missing recent production and omit unavailable components instead.

7. **Renormalize available weights:** Calculate the base score as a weighted mean of only the available independent components, preserving the intended 48/27/25 proportions among those components.

8. **Prevent circular weighting:** Give an ADP-derived projection zero projection weight whenever ADP is already present, and give manually estimated projections reduced weight rather than treating them as sourced forecasts.

9. **Calculate replacement levels:** For the ten-team format, select 10 QBs, 20 RBs, 20 WRs, and 10 TEs by projection, allocate the 20 FLEX positions to the best remaining RB/WR/TE options, and use the best unselected player at each position as that position's replacement baseline.

10. **Use VOR in scoring:** Replace projection PPG with `projected PPG - positional replacement PPG`, and express recent production relative to the same positional replacement baseline.

11. **Normalize VOR consistently:** Map VOR to a 0-100 component score with replacement value anchored at 50, positive values extending toward 100, and negative values extending toward zero using shared cross-position scaling.

12. **Remove obsolete QB corrections:** Delete `QB_RECENT_PRODUCTION_WEIGHT` and the pick-110/140/160 QB cliffs, rely on VOR to represent one-QB scarcity, and retain only the penalty for drafting an additional QB after filling the roster slot.

13. **Retain explicit K/DEF timing:** Keep the existing late-round K/DEF suppression because streaming and roster strategy are not adequately captured by season-long VOR.

14. **Expose confidence in the UI:** Add concise recommendation tags such as `PROJ SOURCED`, `PROJ ADP-DERIVED`, `ADP EST`, `HISTORY 1Y`, and `CONFIDENCE LOW`.

15. **Expose the value calculation:** Show each recommended player's projected VOR and positional replacement baseline so ranking changes remain explainable.

16. **Update documentation:** Revise `README.md` and `SOURCES.md` to document replacement-level selection, missing-component renormalization, provenance rules, and the removal of hard QB timing adjustments.

17. **Add automated tests:** Use Node's built-in test runner to verify role precedence, weight renormalization, exclusion of circular projections, replacement-level allocation, finite scores for all players, and the absence of QB score jumps at picks 110, 140, and 160.

18. **Acceptance criteria:** Every player must have provenance metadata, no signal may receive weight twice, all 323 players must produce finite deterministic scores, replacement-level players must receive a VOR score of 50, and the existing offline draft workflow and saved-state behavior must remain intact.

# Revision 1.1

Revision 1.1 closes the correctness and verification gaps found in the review of Revision 1 without changing the app's static, no-build runtime architecture.

## Implementation plan

1. **Remove ADP-derived projections from global VOR construction:** Update `buildReplacementLevels` so only `sourced` and `estimated` projections may participate in fixed-slot selection, FLEX allocation, positional replacement baselines, or positive/negative VOR scales.

2. **Do not silently fall back to circular data:** If a position lacks enough independent projections to construct its required starters and replacement player, return a missing baseline for that position, omit its projection and recent-VOR components, and lower confidence instead of reintroducing an ADP-derived projection.

3. **Expose replacement provenance:** Return the replacement player's ID and projection quality for each position from `buildReplacementLevels` so scoring, tests, and debugging can verify that every active baseline is independent of ADP.

4. **Correct the shipped replacement pool:** Verify that no selected starter, FLEX allocation, replacement player, or VOR-scale input has `projectionQuality: "adp-derived"`; in particular, the RB replacement must no longer be the ADP-derived Mike Washington projection.

5. **Restore projection value for K and DEF:** Add one K and one DEF starter per team to fixed-slot replacement construction, calculate their positional VOR without making them FLEX-eligible, and retain the existing late-round timing suppression and pick-105 release.

6. **Correct supplemental projection provenance:** Change `data/pool.js` so a supplied `proj` defaults to `projectionQuality: "estimated"`, while only a projection actually produced by `fallbackProjection` defaults to `projectionQuality: "adp-derived"`; continue allowing an explicit quality override.

7. **Verify estimated-projection weighting is exercised:** Confirm that supplied supplemental K/DEF projections receive the intended half projection weight and that ADP-derived projections receive zero projection weight whenever ADP is present.

8. **Make confidence classifications internally consistent:** Define `HIGH` as requiring a sourced projection, market ADP, and two-season history; define `MEDIUM` for at least two independent signals with one missing or reduced-quality input; and use `LOW` for only one independent signal, ADP-derived-only support, or an unavailable replacement baseline.

9. **Prevent contradictory recommendation tags:** Add assertions ensuring a player with `PROJ MISSING` or `PROJ ADP-DERIVED` cannot display `CONFIDENCE HIGH`, including regression cases for Michael Pittman Jr. and Kyle Pitts.

10. **Strengthen circularity tests:** Build replacement levels from the real board, assert that all selected and replacement projections are independent, then mutate every ADP-derived fallback projection and verify that replacement levels, VOR scales, and independently projected players' scores do not change.

11. **Strengthen replacement-value tests:** Identify each real replacement player independently of `selectedIds`, verify that its raw VOR is zero, verify that its active projection component equals 50, and cover QB, RB, WR, TE, K, and DEF.

12. **Add K/DEF regression tests:** Verify that K and DEF each receive a projection component, remain suppressed before pick 105, release at pick 105, and remain suppressed after their roster slot is filled.

13. **Expand scoring-state coverage:** Score all 323 players across representative empty-roster, mid-draft, starter-filled, second-QB, injured-player, and WR-first/RB-first states, asserting finite deterministic results and the absence of the former QB cliffs.

14. **Add a browser and persistence smoke test:** Load `index.html` in a headless browser, confirm `window.FANTASY_SCORING` initializes before `app.js`, log a player to the user's roster, reload and verify localStorage restoration, then reset and verify the saved state is cleared; any browser tooling must remain a development-only dependency.

15. **Correct the documentation:** Update `README.md` and `SOURCES.md` to describe independent replacement construction, K/DEF VOR plus timing, the confidence matrix, and the exact fallback behavior without claiming circularity is prevented unless the new invariance test passes.

16. **Acceptance criteria:** No ADP-derived projection may influence another component through selection, replacement baselines, or normalization; every supplied projection must have truthful provenance; missing projections must never produce `CONFIDENCE HIGH`; K/DEF must retain both projection differentiation and late-round timing; all 323 players must remain finite and deterministic across representative draft states; every real replacement player must have an active VOR component of 50; all unit tests and the browser/localStorage smoke test must pass; and the offline draft workflow must remain unchanged.
