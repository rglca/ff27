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
