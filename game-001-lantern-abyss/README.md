# game-001 — Lantern Abyss

A single glowing orb drifts in dark water. You pulse light; motes appear from the gloom and are drawn in. Absorbing them grows the lantern and feeds upgrades. Every milestone pushes you deeper — the palette cools, new shapes drift past, new lantern parts unlock.

## Core loop (5s)
Click the orb → pulse ripple expands → nearby motes accelerate inward → motes absorbed = **essence**. Spend essence on upgrades in the side panel.

## Meta loop (few min)
Essence buys: stronger pulses → auto-pulse → orbital mini-lanterns (passive pulses) → attraction radius → depth descent (new biome: new palette + new mote shapes).

## Prestige (implosion)
At depth threshold, trigger **Implosion**: collapse lantern into a denser core. Keep a % of total essence as **gravity** — permanent multiplier to attraction radius + pulse strength. Next run descends faster.

## First-minute hook
- t=0s: dark screen, one dim orb, text "click the lantern"
- t=3s: first pulse, motes drift in — immediate number-go-up
- t=20s: first upgrade (pulse power) visibly changes the ripple
- t=45s: unlock auto-pulse → game plays itself, player earns while thinking about next buy
- t=60s: counter is non-trivial, first orbital lantern in reach

## Reward schedule
| Time | Unlock |
|---|---|
| 0s | manual pulse |
| ~30s | pulse power upgrade chain |
| ~45s | auto-pulse |
| ~90s | orbital lantern #1 |
| ~3m | attraction radius upgrade |
| ~5m | depth descent (biome shift) |
| ~8m | implosion available |

## Visual identity
- **Generators:** orb (concentric rings + glow), mote (blob creature w/ 2–3 features), ripple (expanding SVG circle), depth-particles (drifting dots with parallax).
- **Dial roll:** seeded per run (stored in localStorage). First run seed: `1337` (neon-night preset) for a known-good starting vibe; re-rolls on implosion.
- **Filter stack:** glow drop-shadow on orb, subtle grain on bg, slow hue drift over minutes.
- **Mood transitions:** implosion = saturate(3) + brightness(1.5) flash 800ms; biome descent = hue-rotate 2s.
