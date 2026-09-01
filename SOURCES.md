# Draftboard sources and methodology

Data was refreshed on **August 31, 2026** for a 2026 full-PPR redraft board. The app is a static snapshot: it does not silently scrape live injury data after deployment. Before the draft, open the live source links below, then use the `Injuries` tab's search and `Add manual tag` action for any new news.

## Current market and expert opinion

- [FantasyPros 2026 PPR Expert Consensus Rankings](https://www.fantasypros.com/nfl/fantasy-football-rankings/ppr-overall.php) — the current consensus page shows a fresh three-expert consensus with Derek Brown, Andrew Erickson, and Pat Fitzmaurice, updated Aug. 29, 2026. This anchors the expert rank order.
- [FantasyPros 2026 PPR ADP composite](https://www.fantasypros.com/nfl/adp/ppr-overall.php?export=xls) — composite ADP across ESPN, CBS Sports, RTSports, Fantrax, and Sleeper. The page states the composite uses five sources; the visible source dates are Aug. 27–28, 2026.
- [FantasyPros 2026 PPR VBD rankings](https://www.fantasypros.com/nfl/rankings/ppr-vbd.php) — a value-based cross-check that exposes VBD/VORP and ADP, useful for identifying players the market may be over- or under-valuing.
- [NFLFantasyEdge 2026 PPR top 100](https://nflfantasyedge.com/rankings-2026/) — current top-100 board with ADP, projected PPR points per game, and tiers; last updated Aug. 29, 2026. This is the primary static board seed because the table is easy to export into a no-build web app.
- [FantasyDraft.io current PPR ADP](https://fantasydraft.io/nfl/adp/ppr) — Aug. 31, 2026 Sleeper-primary market snapshot with a 250-player PPR order. This is the ADP tab's current-market ordering where the player is present.
- [ESPN 2026 PPR draft kit PDF](https://g.espncdn.com/s/ffldraftkit/26/NFL26_CS_PPR300.pdf?adddata=2026CS_PPR300) — a 300-player PPR cheat sheet. ESPN describes its default as a 10-team, one-QB format, which is close to this league's setup, though its published roster includes a TE slot and only one FLEX.
- [STACKED 2026 kicker rankings](https://www.stackedfantasy.com/nfl/draft-guide/k) and [DST rankings](https://www.stackedfantasy.com/nfl/draft-guide/dst) — Aug. 31 kicker and defense draft-guide order used to fill every team unit through the endgame.

## Team systems, roles, and bye-week context

- [Pro Football Network 2026 NFL depth charts](https://nfl-hq.profootballnetwork.com/nfl-hq/depth-charts) — current depth-chart order used to label likely starters, rotations, handcuffs, and contingency players.
- [PFF 2026 fantasy depth charts](https://www.pff.com/news/fantasy-football-2026-depth-charts-for-all-32-nfl-teams) — fantasy-oriented role and target-share cross-check across all 32 teams.
- [2025 NFL team run/pass ratios](https://www.gofootballanalytics.com/seasonstats/run-pass-ratio/all/2025/all.php) — baseline for the team-style tags (pass-heavy, pass-leaning, balanced, or run-leaning).

The recommendation card uses these sources plus `TEAMS.md` to show transparent tags rather than a prose explanation: role, position/system fit, team style, QB environment, concentration/spread shape, bye-week relationship to the current roster, roster need, health, input provenance, confidence, projected value over replacement, and the positional replacement baseline. The team/context tags are directional modifiers, not independent projections.

## Recent production

- [FantasyPros 2025 RB stats](https://www.fantasypros.com/nfl/stats/rb.php?year=2025)
- [FantasyPros 2024 RB stats](https://www.fantasypros.com/nfl/stats/rb.php?year=2024)
- [FantasyPros 2025 WR stats](https://www.fantasypros.com/nfl/stats/wr.php?year=2025)
- [FantasyPros 2024 WR stats](https://www.fantasypros.com/nfl/stats/wr.php?year=2024)
- [FantasyPros 2025 QB stats](https://www.fantasypros.com/nfl/stats/qb.php?year=2025)
- [FantasyPros 2025 TE stats](https://www.fantasypros.com/nfl/stats/te.php?year=2025)
- [FantasyPros 2024 TE stats](https://www.fantasypros.com/nfl/stats/te.php?year=2024)
- [NFL 2025 receiving stats](https://fantasy-www.nfl.com/stats/player-stats/category/receiving/2025/REG/all/receivingyards/DESC) — official NFL receiving table used as a cross-check for the 2025 receiver data.

## Latest injury refresh

- [CBS Sports 2026 NFL injuries](https://www.cbssports.com/nfl/injuries/) — current team-by-team injury and Week 1 status table checked Aug. 31, 2026.
- [PFF 2026 fantasy depth charts](https://www.pff.com/news/fantasy-football-2026-depth-charts-for-all-32-nfl-teams) — Aug. 31 post-preseason/roster-cutdown role update, including Dallas' Malik Davis backup role and Kansas City's Emmett Johnson backup role.
- [PFN fantasy injury update](https://www.profootballnetwork.com/fantasy-football/preseason-fantasy-football-injury-update-2026/) — Aug. 29 fantasy-focused context for Mahomes, Jacobs, Charbonnet, Skattebo, Nabers, Kittle, and other high-impact players.
- [PFN injury report](https://www.profootballnetwork.com/fantasy-hq/injury-report) — cross-check for questionable players and contingency value.

The app stores recent fantasy points per game (`2025 FPG` and `2024 FPG`) where the source tables exposed the player row. Missing history is omitted from the score rather than replaced with a projection, so the remaining components are renormalized. For rookies and players with limited accessible rows, the current projection and market rank carry more weight and the recommendation exposes lower confidence.

## Injury and availability context

- [RotoWire NFL injury report](https://www.rotowire.com/football/injury-report.php) — live injury report and status definitions; the page describes continuous updates and fantasy-specific context.
- [RotoWire NFL fantasy news feed](https://www.rotowire.com/football/news.php) — current player news and injury headlines used for the seeded notes.
- [RotoWire RB news](https://www.rotowire.com/football/news.php?pos=RB) — source for the Aug. 25, 2026 reports on Ashton Jeanty's ankle sprain and TreVeyon Henderson's ankle issue.
- [RotoWire WR news](https://www.rotowire.com/football/news.php?pos=WR) — source for current Puka Nacua, Mike Evans, Ja'Marr Chase, Zay Flowers, Brian Thomas Jr., Josh Downs, and other receiver reports.
- [RotoWire current player page: Puka Nacua](https://www.rotowire.com/football/player/puka-nacua-16790) — current groin/questionable tag and recent production context.
- [RotoWire current player page: Christian McCaffrey](https://www.rotowire.com/football/headlines/christian-mccaffrey-injury-stays-out-of-team-drills-634586) — camp tightness / managed participation context.
- [RotoWire 2026 depth charts](https://www.rotowire.com/football/nfl-depth-charts/) and [PFN 2026 depth charts](https://www.profootballnetwork.com/nfl-hq/depth-charts) — current depth-chart and designation cross-checks.
- [ESPN help: IR designations](https://support.espn.com/hc/en-us/articles/115003849911-Players-on-Injured-Reserve-IR) — explains official injury/inactive status handling in fantasy platforms.

## How the draft model works

Each available player receives a draft score based on:

1. **Replacement level** — the engine selects 10 QBs, 20 RBs, 20 WRs, and 10 TEs by projection, then allocates the 20 league FLEX slots to the best remaining RB/WR/TE options. The best unselected player at each position becomes that position's replacement baseline.
2. **VOR projection component** — current projected PPR points per game minus positional replacement PPG, normalized across positions with replacement anchored at 50.
3. **Market component** — current ADP, with earlier ADP rewarded.
4. **VOR recent-production component** — the available 2024/2025 FPG history relative to the same positional replacement baseline. Missing history is omitted and the available 48/27/25 weights are renormalized.
5. **Provenance-aware weighting** — sourced projections receive the full projection weight; manually estimated projections receive half weight; ADP-derived projections receive zero projection weight when ADP is present to prevent circular weighting. The ADP tab's refreshed observations are marked `market`; supplemental estimates are marked `estimated`.
6. **Roster pressure** — boosts RB/WR/TE while required slots are still empty, boosts FLEX-eligible players while FLEX spots are open, adds pressure for the six bench spots after the ten starters are filled, and suppresses an additional QB after the roster slot is filled. K and DEF retain explicit late-round timing suppression because they are commonly streamed.
7. **Strategy and health** — adds the small early WR-first/RB-first lens and applies moderate `Q` or severe `O`/manual-injury discounts. There are no QB-specific production weights or pick-110/140/160 cliffs.

Players carry `adpQuality`, `projectionQuality`, and `recentQuality` metadata. The recommendation tags expose those fields as `ADP MARKET`, `ADP EST`, `PROJ SOURCED`, `PROJ ADP-DERIVED`, `HISTORY 1Y`, and confidence levels.

The board now includes a complete 2026 pool for every offensive position, all 32 kickers, and all 32 team defenses. Players added beyond the current ADP market layer are intentionally late-board players, handcuffs, and team units; their late ADPs are conservative estimates rather than direct composite-market observations.

The score is a decision aid, not a projection or a guarantee. A status tag is only as current as the snapshot and any manual update you enter.
