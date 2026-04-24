# Starforge

You are the last Starsmith. The heavens have gone dark, and only you remain to forge light from fallen embers. Tap your glowing anvil to build heat, then let it surge past 100 to birth a star that rises into the deep sky. Stars cluster into constellations as you grow your collection, and every upgrade — from heavier hammers to auto-bellows to mythic star worth — pulls you deeper into the rhythm of forge, release, ascend. When the stars number in the thousands, a Supernova awaits: a prestige reset that carries Affinity forward, multiplying every future forge.

## Loops

**Core loop** (every 5 seconds): Tap anvil → heat climbs → heat hits 100 → star spawns + flies into sky.

**Meta loop** (every few minutes): Accumulate Light (stars as currency) → spend in skill tree → FLAME branch = click power, SKY branch = auto-heat + wider sky, MYTH branch = star worth multiplier. Unlock Supernova at top of MYTH.

**Prestige loop**: After forging 5000+ total stars and unlocking Supernova node: trigger Supernova → gain permanent Affinity multiplier = sqrt(totalStarsEver/5000) → sky resets, upgrades reset, Affinity carries forward.

## First-minute hook

On first load, three story lines fade in sequentially over 4 seconds. A pulsing ring appears near the anvil. The first click triggers a spark burst and the forge begins. Heat fills, the first star erupts from the anvil and arcs upward into a dark indigo sky. The onboarding is visceral and immediate.

## Reward schedule

| Time | What unlocks / happens |
|------|------------------------|
| 0s   | Intro sequence + first anvil tap |
| ~10s | First star forged — toast "You forged the first light." |
| ~30s | Enough Light for Heavier Hammer (10 Light) |
| ~60s | Stoked Coals (50) or Slow Burn (100) in reach |
| ~2m  | Apprentice Bellows (75) — first auto-heat, game enters idle mode |
| ~4m  | 10th star — toast "The sky remembers." |
| ~5m  | First constellation line drawn (every 5 stars) |
| ~8m  | Wider Sky (250) + Silver Stars (200) become viable |
| ~15m | Journeyman Bellows (400) — meaningful idle speed |
| ~25m | Golden Stars (1500) — economy jump |
| ~40m | Master Bellows (2000), Mythic Stars (8000) horizon visible |
| ~60m+ | Supernova threshold (5000 total stars) — first prestige |

## Visual identity

- **Generator set**: anvil (procedural SVG trapezoid+horn+pedestal), star (multi-point SVG path + radial glow), constellation (animated stroke-dashoffset lines)
- **Seed**: 0x57A4
- **Preset**: custom-ember-indigo — forced hueBase=48 (warm ember), complementary scheme, bgTone=dark, sky gradient indigo/near-black, glow=7
- Sky hue drifts ±5° every 10 total stars forged (CSS var --sky-hue animated over 2s)
- Prestige triggers saturate(3) brightness(1.5) flash + 2s hue-rotate on game root
