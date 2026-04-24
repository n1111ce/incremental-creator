# Game 004 — Tide Shrine

## Pitch

You are the last keeper of an ancient shore shrine. The sea has been silent for a hundred tides. Pull the bell-rope, ring the shrine bell, and watch the waves roll up the beach carrying gifts from the deep. As you tend the shrine, unlock five branches of forgotten knowledge — from auto-pulling mechanisms to moon-phase blessings, pearl divers, a second shrine, and a lighthouse whose beam triples your gains.

## Core loop (every ~5s)
Tap the bell-rope → bell swings → SVG wave path animates up the sand → shells auto-collect → "+N" popup rises.

## Meta loop (every few minutes)
Spend shells in the Skill Tree modal (5 branches × 4 nodes = 20 nodes). Each branch's 3 numeric tiers gate a mechanic-unlock node: auto-puller, moon phases, pearl diver, second shrine, lighthouse beam.

## First-minute hook
Blocked intro fades in three lines of lore, one after another. A glowing arrow points at the rope. First pull rings the bell and triggers a wave. After 3 pulls the Skills button pulses once. The player sees the full skill tree immediately, including locked "glowing frame" mechanic nodes on the horizon.

## Reward schedule (approximate)
| Time | Event |
|------|-------|
| 0:00 | Lore intro, first pull, shells appear |
| 0:30 | ~15 shells — first skill affordable (Rope branch) |
| 1:30 | Auto-Puller unlocked (~500 shells) |
| 3:00 | Moon Phases unlocked — sky/moon visibly shift |
| 5:00 | Pearl Diver creature swims across sea |
| 8:00 | Second Shrine appears on right |
| 12:00 | Lighthouse built, combo charge mechanic active |
| Ongoing | Full moon 3× bursts, lighthouse beam sweeps, pearls accumulate |

## Visual identity
- **Generator:** claymation preset (seed 99) adapted for beach/sea palette
- **Dials:** wobble 3, grainAmount 0.12, shadowSoftness 12, glow 7, strokeWidth 2.5
- **Palette:** teal/deep-blue sea, warm sand (#d4b882), deep navy sky, warm gold bell
- **Composition:** sky 40% / sea 20% / beach 40%. Shrine silhouette center-left, bell visible at shrine top, thick rope hangs into tap zone
- **Living visuals:** sky hue cycles every 120s, moon drifts across sky, seagulls fly every ~18s, seashells accumulate on sand (up to 30), wave path morphs on each pull
- **Filters:** goo filter on shrine/pillars, glow on bell and moon, grain overlay on full canvas

## File structure
```
index.html   — structure only; script load order: data → canvas → ui → game → ../debug.js
style.css    — layout, HUD, modals, intro, animations
data.js      — SKILL_NODES (20 nodes, 5 branches), BALANCE constants, makeDefaultG(), mulberry32()
canvas.js    — SVG scene build, wave animation, bell swing, moon/sky, seagulls, diver, lighthouse
ui.js        — skill tree modal render, HUD, intro sequence, export/import/reset
game.js      — G state, tick loop, pull handler, skill purchase, save/load
```

## Identity roll dump (ASSETS.md format)
```js
IDENTITY = {
  seed: 99, preset: 'claymation',
  wobble: 3, grainAmount: 0.12, shadowSoftness: 12, glow: 7,
  strokeWidth: 2.5, cornerRadius: 8,
  hueBase: 200, hueScheme: 'analogous', saturation: 62, lightness: 52,
  bgTone: 'dark',
}
```
