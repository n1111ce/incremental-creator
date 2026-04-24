# Incremental Creator

A workshop for building browser-based incremental games. Each game lives in its own `game-NNN-name/` folder and is playable directly from GitHub Pages.

Games are single-purpose experiments — every playtest distills lessons into `LESSONS.md` so future games start smarter instead of repeating past mistakes.

## Play

Open any game at: `https://n1111ce.github.io/incremental-creator/game-NNN-xxx/`

Works on desktop (mouse + keyboard) and tablet (touch + optional Bluetooth mouse/keyboard). Save progress is per-device — use **Export Save** / **Import Save** inside each game to move progress across devices.

## Structure

- `CLAUDE.md` — master rules for building games here
- `LESSONS.md` — distilled design lessons from playtests
- `ASSETS.md` — parametric procedural-visuals toolkit
- `FEEDBACK_LOG.md` — raw playtest notes
- `debug.js` — shared in-game debug panel
- `game-NNN-xxx/` — each game, self-contained
