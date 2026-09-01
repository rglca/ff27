# Draftboard // 2026 PPR

A no-build, mobile-first fantasy football draft board for this league shape:

- 10 teams
- Full PPR
- 1 QB, 2 RB, 2 WR, 1 TE, 2 FLEX, 1 K, 1 DEF, 6 bench spots (16 rounds / 160 total picks)

## Use it

Open `index.html` locally or publish the repository with GitHub Pages. Everything is static; there is no server or API key.

On draft day:

1. Choose `Balanced`, `WR-first`, or `RB-first`.
2. Type other managers' picks into `Log a pick` and press Enter.
3. Use `I took` when you make your own selection so roster pressure updates.
4. Open the `Injuries` tab and search any player to add a manual injury tag. Manual tags immediately drop that player in the model, persist on the device, and sort to the top for quick removal.
5. Use the `ADP` tab for a compact, current-market order. Mark players `Drafted` or `I took` directly from that list; drafted players disappear from the ADP list and typeahead suggestions.

The recommendation card is tag-first: it shows the player's role, system fit, team style, QB environment, target-shape signal, bye-week relationship to your roster, roster need, strategy lens, health status, data provenance, confidence, projected VOR, and positional replacement baseline.

The Big Board sort menu is intentionally simple: `Draft score` uses the full recommendation model; `ADP` orders by market draft position; `Projection` orders by projected PPR points per game; `Recent FPG` orders by the available 2024–25 fantasy-points-per-game history; and `Value vs rank` orders by `ADP - board rank`, so positive values indicate a player the market is leaving later than the board rank.

The app saves draft state in the browser's local storage. `Reset` clears the draft tracker and manual tags.

## Scoring tests

Run `npm test` with Node 20+ to verify the DOM-free scoring engine plus the headless-browser/localStorage smoke test. Playwright is a development-only dependency.

## Publish with GitHub Pages

Push the repository to GitHub, then choose **Settings → Pages → Deploy from a branch → main / root**. GitHub Pages serves the root `index.html` directly.

## Data notes

The included player data is an Aug. 31, 2026 static snapshot of current ADP/rankings, 2024–25 production, preseason injury context, and current depth-chart changes. The board contains the original projection board plus a full position-player, kicker, and defense pool (including late-round contingencies) so every mock pick is legal through 160 selections. Review the live links in [SOURCES.md](SOURCES.md) immediately before the draft; the app is intentionally designed so new injury news can be applied manually in seconds.
