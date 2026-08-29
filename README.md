# Draftboard // 2026 PPR

A no-build, mobile-first fantasy football draft board for this league shape:

- 10 teams
- Full PPR
- 1 QB, 2 RB, 2 WR, 1 TE, 2 FLEX, 1 K, 1 DEF, 6 bench spots (16 rounds / 160 total picks)

## Use it

Open `index.html` locally or publish the repository with GitHub Pages. Everything is static; there is no server or API key.

On draft day:

1. Set the current overall pick and choose `Balanced`, `WR-first`, or `RB-first`.
2. Type other managers' picks into `Log a pick` and press Enter.
3. Use `I took` when you make your own selection so roster pressure updates.
4. Use `Injure` if news breaks. This local tag immediately drops that player in the model and persists on the device.
5. Use `Export CSV` if you want a spreadsheet snapshot. Import that CSV into Google Sheets on iOS.

The recommendation card is tag-first: it shows the player's role, system fit, team style, QB environment, target-shape signal, bye-week relationship to your roster, roster need, strategy lens, and health status. The context tags are modest score modifiers, so projection, ADP, and recent production remain the foundation.

The app saves draft state in the browser's local storage. `Reset` clears the draft tracker and manual tags.

## Publish with GitHub Pages

Push the repository to GitHub, then choose **Settings → Pages → Deploy from a branch → main / root**. GitHub Pages serves the root `index.html` directly.

## Data notes

The included player data is an Aug. 29, 2026 static snapshot of current ADP/rankings, 2024–25 production, and preseason injury context. The board contains 186 players to provide six-bench depth and contingency options for a 160-pick draft. Review the live links in [SOURCES.md](SOURCES.md) immediately before the draft; the app is intentionally designed so new injury news can be applied manually in seconds.
