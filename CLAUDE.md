# Incremental Game Creator — Master Rules

This folder is dedicated to building **incremental games**. Each game lives in its own subfolder. The point of this setup is to stop restarting from scratch: lessons from every playtest get distilled into `LESSONS.md` so future games start smarter.

## Workflow (every new game)

1. **Before coding**, read `LESSONS.md` in full. It is short by design — every line matters.
2. Pick the next game number by checking existing `game-XXX-*` folders. Propose a **suggested name** tied to the theme/mechanic (e.g. `game-003-bakery-empire`).
3. Create folder `game-NNN-suggested-name/` with:
   - `index.html` — structure only (`<link>` + `<script>` tags); always include `<script src="../debug.js"></script>` as the **last** script tag
   - `README.md` — one-paragraph pitch + core loop + dopamine schedule (see below)
4. **Before telling the user to playtest, push to GitHub** (see Hosting section). The game must be live at its Pages URL before the playtest request — the user plays on a tablet and needs the URL.
5. Tell the user: *"Live at `https://n1111ce.github.io/incremental-creator/game-NNN-xxx/` — playtest on laptop or tablet. Tell me what felt good and what didn't."*
6. After they give feedback, append raw notes to `FEEDBACK_LOG.md`, then **distill** into `LESSONS.md` (update existing lines when possible, don't just append). Commit + push the doc updates too.

## Tech constraints

- **Modular file structure.** Each game folder has: `index.html` (structure only), `style.css`, and split JS files (`data.js`, `canvas.js`, `ui.js`, `game.js`). All loaded via plain `<script src="...">` tags — no ES modules (they break on `file://`), no build steps, no npm. Double-click `index.html` to play.
- **Debug panel:** every game includes `<script src="../debug.js"></script>` (shared root file). Provides a `⚙ debug` button (bottom-left) with live state dump, event log, and hard reset. Use `debugLog('msg')` in game code to emit events. Never remove this from shipped games.
- Vanilla JS only — global variables shared between script files, no frameworks, no import/export.
- Save state to `localStorage` so progress persists across playtests.
- Assets: **procedural** (SVG/Canvas generators + style packs + filter stacks). See `ASSETS.md` — read it when building. No external files, no CDN calls.
- Must work offline. No fetches, no telemetry, no analytics.
- **Bug fixes go to the relevant file only** — not the whole project. This is the point of modular structure.

## Debug God Mode (required on every game)

The shared `debug.js` exposes a registry API: `registerDebugAction(label, fn, category)`. Buttons appear in a "God Mode" column of the debug panel so playtesting a feature never requires clicking a trillion times to reach it.

**Every new game MUST register cheats covering:**
- **currency** — at least 3 tiers: +small / +huge / +max for each primary resource
- **skills** — "Unlock All" + one button per branch + "Refund All" (flips state, recomputes derived effects, re-renders any tree/panel)
- **mechanics** — one button per mechanic-unlock node (spawn the event / force the buff state / fill the meter / bypass its gate). This is the point — you should be able to demo every unlock in seconds without grinding toward it.
- **time** — Simulate 30s, Simulate 5 min, Pause/Resume (toggles a flag the tick loop reads)
- **prestige** — "Make Prestige Available", "Trigger Prestige Now", "+1 prestige currency"

**Implementation rules:**
- Register inside a `DOMContentLoaded` listener at the bottom of `game.js`, guarded by `if (typeof registerDebugAction !== 'function') return;` — debug.js loads after game.js, so defer.
- Every cheat must call the REAL existing functions (HUD refresh, save, recompute, re-render). Do not duplicate game logic inside the cheat. If a needed function is scoped inside an IIFE, hoist it to `window.X` — minimal surgery, not a refactor.
- When a mechanic has a gate (`if (!G.upgrades['X']) return;`), the cheat that spawns it should temporarily grant the upgrade, call the function, then restore — so the button works even before the player has unlocked the mechanic.
- Labels are short (≤ 20 chars). Categories are lowercase.

A new game is not shipped until God Mode lets you hit every feature from a cold save in under 30 seconds.

## Cross-device compatibility (required — not optional)

Games are played on **two devices**: a Helios 300 laptop (Windows, mouse+keyboard) and a **Samsung Galaxy Tab S8+** (Android, touchscreen + Bluetooth keyboard + Bluetooth mouse, usually landscape). Every game must work on both without detection-based code paths — treat mouse/touch/pen as one unified input.

- **Viewport meta tag mandatory**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- **Pointer Events only** (`pointerdown/pointermove/pointerup`). Never plain `mousedown/touchstart` — they fragment input handling. One handler covers mouse, touch, pen, and BT mouse on the tablet.
- **Tap targets ≥ 44×44 px.** Finger-sized. Never rely on 20px icons as the only hit area.
- **No hover-only affordances.** If a tooltip, preview, or reveal only appears on `:hover`, touch users lose it. Either mirror on tap/long-press, or make it decorative.
- **Keyboard is optional.** Shortcuts are nice-to-have; the game must be 100% playable with only touch/mouse. Never put a critical action behind a keyboard-only input.
- **Responsive from ~700 px to ~2800 px wide.** Use CSS Grid/Flex, `vw/vh/dvh`, `clamp()`. No fixed-pixel layout containers. Test mentally at both ends before shipping.
- **Disable double-tap zoom on interactive surfaces**: `touch-action: manipulation` on buttons, `touch-action: none` on game canvases that handle their own gestures.
- **Prevent text selection on taps**: `user-select: none` on the game UI (keep it enabled in menus/readable text).
- **Save portability**: localStorage does NOT sync across devices. Every game must include **Export Save** and **Import Save** buttons that serialize state to a base64 string for manual copy-paste between devices.
- Landscape is the expected tablet orientation but the layout must not *break* in portrait — degrade gracefully.

## Hosting (online play) — automated

This folder **is already** a Git repo linked to `https://github.com/n1111ce/incremental-creator` with GitHub Pages enabled on `main` branch root. Every push auto-deploys within ~1 minute. No user action required.

**Claude pushes, not the user.** The user only clicks GUIs. Claude runs the commit+push via Bash at two points in the workflow:

1. **After shipping a new game** (before asking for playtest):
   ```
   git add game-NNN-xxx/
   git commit -m "Add game NNN: <name>"
   git push
   ```
   Then announce the Pages URL: `https://n1111ce.github.io/incremental-creator/game-NNN-xxx/`
2. **After distilling feedback into LESSONS.md / FEEDBACK_LOG.md**:
   ```
   git add LESSONS.md FEEDBACK_LOG.md ASSETS.md CLAUDE.md
   git commit -m "Lessons from game NNN playtest"
   git push
   ```

Never require the user to open GitHub Desktop or type commands. The GUI-only rule applies to *the user*, not to Claude.

Code implication: **all asset paths must be relative** (`./style.css`, `../debug.js`) so the game works identically at `file://` on the laptop and under the Pages subpath on the tablet. Never use absolute paths starting with `/`.

If `git push` fails (auth/network), surface the error to the user plainly — don't silently skip. Don't use `--force` unless the user explicitly asks.

Alternative for throwaway previews: **Netlify Drop** (drag folder → temporary URL). Rarely needed now that Pages is set up.

## Incremental game design — the core skill

Incrementals look simple but the craft is **dopamine pacing**. A bad incremental feels like a spreadsheet; a good one feels like you *can't stop*. Every design decision should answer: *when is the next hit of reward, and does it arrive before the player gets bored?*

Reference framework for every game's `README.md`:
- **Core loop** (what the player does every 5 seconds)
- **Meta loop** (what unlocks every few minutes)
- **Prestige/reset loop** (what carries over after a reset, if any)
- **First-minute hook** (what happens in the first 60 seconds to sell the game)
- **Reward schedule** (rough: when do new mechanics, numbers, upgrades unlock on the timeline)
- **Visual identity** — declare `generator + style pack + filter stack` (see `ASSETS.md`)

## File layout

```
/CLAUDE.md              ← this file (always loaded)
/LESSONS.md             ← distilled do/don't (READ before every new game)
/FEEDBACK_LOG.md        ← raw playtest notes (read only when distilling)
/game-001-xxx/          ← each game self-contained
/game-002-xxx/
```

## Model routing (token economy + quality)

Route work to the right model. The main session (Opus) handles thinking; Sonnet does the typing.

- **Opus** — planning, design discussion, dopamine-schedule reasoning, proposing game concepts, and **authoring/updating `LESSONS.md`, `CLAUDE.md`, `ASSETS.md`, `FEEDBACK_LOG.md` distillation, and per-game `README.md`**. These docs are load-bearing; quality matters more than tokens.
- **Sonnet** — implementation and simple bug fixes. Writing `index.html`/`style.css`/split JS, wiring generators, coding the game loop, balancing numbers, one-shot bug fixes. Spawn via the `Agent` tool with `subagent_type: "general-purpose"` and `model: "sonnet"`, passing a self-contained brief.
- **Haiku** — trivial lookups only (file existence checks, simple greps). Rare here.

**Escalation rule:** if Sonnet fails the same task **twice in a row** (wrong fix, reintroduced bug, misread the architecture, loops on the same error), stop retrying with Sonnet. Escalate to Opus — either take over in the main session, or spawn a new `Agent` with `model: "opus"` and hand it the full failure trace plus the original brief. Repeated Sonnet retries on a stuck problem burn more tokens than one correct Opus pass.

**Rule:** never burn Opus tokens on straightforward coding once the design is locked. Never let Sonnet write the docs that shape future sessions — those stay with Opus. When in doubt, Opus plans → hands Sonnet a brief → Opus reviews + writes the lessons afterward.

## Privacy

No logging filenames, paths, or content. No external calls. All local.

## One rule above all

**Do not start a new game without reading `LESSONS.md` first.** That file is the entire reason this folder exists.
