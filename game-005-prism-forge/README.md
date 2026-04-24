# game-005 — Prism Forge

> *The Chromatic Vault has been dark for a century. You alone know the old art of prismatic forging — channeling raw light through crystal chambers to create gemstones of pure color. The Vault must shine again.*

---

## Core loop
Tap glowing crystal nodes to collect raw light. Two prisms in the center of the Vault split that light into colored beams — hold and drag a prism to rotate its color. Colored orbs drift downward from the prisms; drag them into the matching vat (warm / cool / arcane). When a vat fills (3 orbs), it forges a gem. The gem mold at the right edge rewards a timing-tap — hit the green zone for a bonus.

## Meta loop
Spend accumulated light in the Upgrade tree. Four branches each lead to a mechanic-unlock node that adds a brand-new interactive object to the Vault:
1. **Mirror Array** — two draggable mirrors redirect a bouncing rainbow beam; aligning them grants +5 light/s passively
2. **Spectral Golem** — a wandering ghost creature; tap it to harvest a light bundle and a free orb
3. **Storm Crystal** — every 45 s a lightning storm erupts; tap sparks rapidly before they scatter for bonus gems
4. **Void Prism** — drag any color orb onto the dark prism to convert it into a void orb worth instant light; every 5 conversions yields a rare dark gem

## Prestige / reset loop
The **Vault Completion** bar (top HUD) fills as gems are forged (500 gems = 100%). When full the *Ascend* button pulses gold. Ascending resets light and gems but keeps all unlocks and upgrades, and grants **+1 Vault Shard** — each shard adds a 10% bonus to all light and gem gains permanently. The second run plays dramatically faster; the prestige tree is stubbed and will expand in future runs.

## First-minute hook
- **0 s** — Onboarding overlay blocks the canvas with a single instruction: "Tap a glowing crystal to begin."
- **5 s** — First light node tap plays a particle burst and float-text; intro dismisses.
- **15 s** — First orb appears drifting down; hint bubble guides player to drag it into a vat.
- **40 s** — First gem forged; hint bubble points to the Upgrade button.
- **90 s** — First upgrade purchased (A1 Brighter Nodes, cost 50 light); upgrade tree graph visible with gold mechanic-unlock diamonds glowing on the horizon.

## Reward schedule (rough)
| Time  | Event |
|-------|-------|
| 0–2 min | First upgrades (A1, B1); light income established |
| 3–5 min | Mirror Array unlocked; passive income begins; scene gains new interactive objects |
| 6–9 min | Spectral Golem appears; storm timer active; 3+ clickables on screen |
| 10–15 min | Void Prism unlocked; all 4 mechanics active; 6 concurrent clickable types |
| 15–25 min | Vault fills toward 100%; prestige triggers |
| 25 min+ | Second run with Vault Shards multiplier; numbers escalate sharply |

## Visual identity
- **Seed:** 2025
- **Generator set:** crystal/gem + orb/artifact
- **Style:** dark bg (#0a0a1a), deep blue + cyan (#4bc8f0) + gold (#c8a84b), complementary palette
- **Filter stack:** strong glow (`feGaussianBlur` stdDeviation=4+9), faint grain overlay, no wobble (sharp crystal aesthetic)
- **Mood transitions:** prestige flash (saturate×3 + brightness 1.5, 600 ms), storm spark pulse, dark-gem violet burst
- **Visual evolution:** gem mold needle constant motion; orbs spawning/drifting; prism beams update color in real time; golem wanders; storm disrupts the scene every 45 s
