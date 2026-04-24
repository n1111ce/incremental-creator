# Lessons — Distilled From Playtests

Rules for building incremental games that *feel good*. Updated after every playtest. Keep each line tight — this file is read before every new game, so bloat is expensive.

Format: one-line rule, then optional **Why:** if non-obvious. Merge duplicates. Delete contradictions.

---

## Dopamine & pacing

- **Give the player a reason to care, not just a number to grow.** A one-paragraph story framing ("you are X, doing Y, to achieve Z") transforms grinding into purpose. Even 3 sentences of lore beats zero.
- Skill trees create anticipation: the player sees where they're going before they get there — that forward-visibility is itself a dopamine lever.

## Core loop

- Keep the number of menus minimal — one panel, straight path. Confirmed: players noticed and liked it. Don't add tabs or sub-screens unless absolutely necessary.

## UI & feel

- **The upgrade/skill panel must NOT occupy permanent screen space.** It should be a collapsible overlay, drawer, or toggle — the game canvas (the thing you interact with) must fill the screen by default.
- **Onboarding is mandatory.** The player must be told what to click and why in the first 10 seconds — not discovered. A clear arrow, highlight, or instruction overlay is required. Never assume the player will figure it out.
- **The intro sequence must be unmissable.** If the story beat plays while the player is looking elsewhere, it fails. Block interaction until the intro lands, or make the intro part of the first click.
- Skill trees should be **visible even when locked** — greyed-out future nodes are motivational. Hidden options that unlock later rob the player of anticipation.
- Story beats can be tiny: a one-line flavour text on each upgrade or milestone does the job without a dialogue system.

## Assets & visuals

- **Squares and lines are not visuals.** Every clickable element needs a recognisable silhouette — a tree shape, a mushroom, a glowing orb — not a rounded rectangle. Invest in procedural SVG shapes that read as *things*.
- Procedural SVGs can be rich without being complex: a tree is a trunk rect + a few layered ellipses; a mushroom is a cap arc + a stem. 10 lines of SVG beats 0.
- **Visuals must evolve every ~30 seconds of play.** Something has to change — new generator piece, filter dial drift, palette shift, mood flash. Static visuals kill incrementals faster than static numbers.

## Numbers & balance

*(empty)*

## Anti-patterns (things that killed fun)

- Purposeless clicking — if the player can't articulate *why* they're clicking, the loop feels hollow. Always answer "what am I working toward?" at every stage.
- Permanent split-screen layouts where the upgrade panel eats half the view — kills immersion and makes the world feel small.

---

*Updated after game-002-mycelium-pact playtest (2026-04-24).*
