# game-002 — Mycelium Pact

You are the last forest spirit, woken by a dying god's whisper. The forest burned three winters ago. You drift beneath the ash, threading mycelium through cold roots, coaxing dormant life back. Each organism you reawaken adds its voice to the Pact — a living covenant between spirit and forest. The god will not last much longer. Hurry.

## Core loop (5s)
Click glowing stumps on the canvas → spores arc toward your spirit orb → accumulate **Spores** → spend on the Skill Tree.

## Meta loop (few min)
- Spore income/click grows via tree upgrades
- Auto-spread unlocks early (roots grow themselves)
- New organism types unlock (fungi → moss → saplings → creatures) adding passive income
- Each tier mutates the canvas: new SVG layers appear, palette shifts warmer

## Prestige / Rebirth
At **Canopy Complete** (all 20 nodes bought), the god dissolves into light. The forest resets — ash returns — but a **Seed of Memory** carries over: +20% base spores/click per rebirth, plus a permanent hue-drift on the identity roll. The skill tree is re-locked but one random node starts pre-unlocked each run.

## First-minute hook
- t=0s: dark ash canvas, one dim stump pulses gently, text: *"Something stirs beneath the ash. Click."*
- t=3s: first spores float up, spirit orb brightens, first skill node illuminates
- t=15s: buy first node ("Shallow Roots") — lore line appears, canvas changes slightly
- t=40s: auto-spread available, spores trickle in passively
- t=60s: second tier of tree visible (dim), player can see where they're headed

## Reward schedule
| Time | Unlock |
|---|---|
| 0s | Manual click, spores, spirit orb |
| ~15s | Shallow Roots (auto-spread unlock path visible) |
| ~30s | Fungal Web — first passive income |
| ~45s | Auto-spread: roots grow on their own |
| ~90s | Tier 2 opens: Moss Bloom, Mycelium Burst |
| ~3m | First creature awakens (SVG critter appears on canvas) |
| ~5m | Tier 3: Sapling tier, hue shift on canvas |
| ~8m | Tier 4: Canopy nodes visible, prestige in sight |
| ~12m | Canopy Complete → Rebirth available |

## Skill tree layout (20 nodes, tree shape)
```
ROOT (always unlocked — the spirit itself)
  └── Shallow Roots         "The first thread finds a sleeping seed."
        ├── Fungal Web       "Pale threads catch what the wind forgets."
        │     ├── Spore Burst       "A held breath, then release."
        │     └── Deep Mycelium     "Older roots remember older names."
        └── Tender Shoots    "Green is the color of defiance."
              ├── Moss Bloom        "The soft things outlast the hard."
              │     ├── Rain Sense        "You taste the clouds before they break."
              │     └── Stone Lichen      "Even granite yields, given centuries."
              └── First Sapling    "It does not know it was dead."
                    ├── Canopy Reach      "Your fingers brush the sky."
                    │     ├── Sunlight Draw     "The god's warmth, borrowed."
                    │     └── Wind Pact         "The air carries spores now."
                    └── Root Network     "All forests are one forest."
                          ├── Heartwood         "The god smiles, briefly."
                          │     ├── Ancient Sap       "Time slows near the old things."
                          │     └── Spirit Bloom      "You remember what you were."
                          └── Canopy Crown    "The forest breathes again." ← prestige unlock
```

## Visual identity
- **Generators:** spirit orb (radial glow, breathing scale), stumps (SVG rounded rect + rings), spore particles (small blobs drifting upward), mycelium threads (SVG path lines spreading across canvas), creature silhouettes (simple blob animals per ASSETS.md)
- **Dial roll:** seed `42` → custom mossy-dark preset (dark bg, green-brown hues, analogous, wobble 3, grain 0.15, glow 6)
- **Filter stack:** soft glow on spirit orb, feTurbulence wobble on mycelium threads, grain overlay on canvas bg
- **Mood transitions:** node unlock = green flash 400ms; prestige/Rebirth = full-screen brightness(2) + hue-rotate(120deg) over 1s; low-spores drift toward desaturation
- **Identity evolution:** each rebirth nudges hueBase +30 and adds one new generator piece (first rebirth: creature silhouettes; second: bioluminescent particle trails)
