# Starforge

You are the last Starsmith. The heavens have gone dark, and only you remain to forge light from fallen embers. Tap your glowing anvil to build heat, then let it surge past 100 to birth a star that rises into the deep sky. Stars cluster into constellations as you grow your collection. Every branch of the skill tree leads to a mechanic-unlock node — a moment where a whole new system appears: a combo multiplier, a second anvil, chain lightning, shooting stars, a moon phase buff, nebula drift, or a comet crossing the sky. When the stars number in the thousands, a Supernova awaits.

## Loops

**Core loop** (every 5 seconds): Tap anvil → heat climbs (combo multiplier applies) → heat hits 100 → star spawns + flies into sky → Light earned.

**Meta loop** (every few minutes): Accumulate Light → spend in Skill Tree modal → FLAME = click power + combo system + twin anvil + chain lightning. SKY = auto-heat + shooting stars + moon phase + nebula drift. MYTH = star worth multipliers + constellation power + comet ritual + Supernova.

**Prestige loop**: After forging 5000+ total stars and owning M7 Supernova node: trigger Supernova → gain permanent Affinity = sqrt(totalStarsEver/5000) → everything resets except Affinity.

## First-minute hook

Three story lines fade in over 4 seconds. First click triggers spark burst and begins the forge. First star erupts, arcs into the dark sky. Enough Light for Heavier Hammer (F1) in under 30 seconds — the tree is already visible in full from day one.

## Reward schedule — v2 tree (24 nodes, 7 mechanic unlocks)

| Time    | What unlocks / happens |
|---------|------------------------|
| 0s      | Intro sequence + first anvil tap |
| ~10s    | First star — toast |
| ~30s    | F1 Heavier Hammer (10 Light) |
| ~60s    | F2 Stoked Coals (50) or S1 Apprentice Bellows (75) — first auto-heat |
| ~2m     | F3 Slow Burn (120) — heat decay halved |
| ~3m     | M1 Silver Stars (200) — stars worth ×2 |
| ~4m     | S2 Wider Sky (200), S3 Journeyman Bellows (500) |
| ~6m     | **F4 Combo Forge (400)** — MECHANIC: rapid-strike multiplier up to ×5 |
| ~8m     | **S4 Shooting Stars (800)** — MECHANIC: tap-to-catch comets every 15–30s |
| ~10m    | M2 Starseer (600) — +5% all Light, locked tooltips revealed |
| ~12m    | F5 Combo Memory (900) — wider combo window |
| ~14m    | M3 Golden Stars (1500) — stars worth ×5 stacked |
| ~18m    | **M4 Constellation Power (2500)** — MECHANIC: each constellation = +5% all Light |
| ~20m    | S5 Shower Density (1800) — shooting stars 2× |
| ~24m    | **F6 Twin Anvil (2500)** — MECHANIC: second full anvil, independent heat |
| ~30m    | **S6 Moon Phase (3500)** — MECHANIC: 90s cycle, full moon = ×3 all Light |
| ~40m    | F7 Forged in Myth (5000), S7 Master Bellows (6000) |
| ~50m    | M5 Mythic Stars (8000) — stars worth ×15 stacked |
| ~60m    | **F8 Strike Chain (12000)** — MECHANIC: every 10th strike sends chain-arc through 5 stars |
| ~70m    | **S8 Nebula Drift (15000)** — MECHANIC: free star spawns every 30s |
| ~90m    | **M6 Comet Ritual (20000)** — MECHANIC: every 200 stars, comet = +10% Light bonus |
| ~120m+  | **M7 Supernova (0 cost, 5000 total stars)** — PRESTIGE |

## Visual identity

- **Generator set**: anvil (SVG trapezoid+horn+pedestal), star (multi-point path + glow), constellation lines (dash-offset animation), shooting star (gradient tail SVG), moon (disc+shadow overlay), chain lightning (jagged polyline), comet (gold tail gradient)
- **Seed**: 0x57A4 — custom-ember-indigo: hueBase=48 (warm ember), complementary, bgTone=dark, glow=7
- Sky hue drifts ±5° every 10 total stars (CSS var --sky-hue, 2s transition)
- Full moon phase: silver tint overlay on game root for ~15s per 90s cycle
- Prestige: saturate(3) brightness(1.5) flash + 2s hue-rotate
