# Lessons — Distilled From Playtests

Rules for building incremental games that *feel good*. Updated after every playtest. Keep each line tight — this file is read before every new game, so bloat is expensive.

Format: one-line rule, then optional **Why:** if non-obvious. Merge duplicates. Delete contradictions.

---

## Dopamine & pacing

- **Give the player a reason to care, not just a number to grow.** A one-paragraph story framing ("you are X, doing Y, to achieve Z") transforms grinding into purpose. Even 3 sentences of lore beats zero.
- Skill trees create anticipation: the player sees where they're going before they get there — that forward-visibility is itself a dopamine lever.

## Core loop

- Keep the number of menus minimal — one panel, straight path. Confirmed: players noticed and liked it. Don't add tabs or sub-screens unless absolutely necessary.
- **Save portability controls are a feature, not plumbing.** An Export / Import / Reset menu earned unprompted praise — keep it visible (but not intrusive) in every game.

## Skill trees & upgrades

- **Upgrades must be a visual graph, not a list.** Small square/diamond nodes connected by lines that branch. A flat list reads as "boring, one by one" even when the content is good. The visible topology IS the dopamine — the player plans a path before they can afford it.
- **Present the tree as a large centered popup/modal**, not a side drawer. The drawer felt cramped even when collapsible. Modal: tap outside or an X to close, covers most of the screen so nodes breathe.
- **Numeric upgrades must lead to mechanic unlocks.** Every branch needs 2–3 "boring" numeric nodes (+click, faster auto, bigger multiplier) that *gate* a node which unlocks a brand-new game mechanic (combo system, falling-stars minigame, second interactable, moon phase buff, passive generator, etc.). The payoff after the grind is what makes grinding feel good.
- **Many mechanics, not just many numbers.** Aim for 4–6 mechanic-unlock nodes per game. The "whoa, a whole new thing just appeared" moment is the strongest dopamine lever — stack several of them.
- **Show the tree's full shape from day one** — locked mechanic-unlock nodes should look special (glowing frame, distinct icon) even when unaffordable, so the player sees the game-breakers on the horizon and plans toward them.

## UI & feel

- **The upgrade/skill panel must NOT occupy permanent screen space.** It should be a collapsible overlay, drawer, or toggle — the game canvas (the thing you interact with) must fill the screen by default.
- **Onboarding is mandatory.** The player must be told what to click and why in the first 10 seconds — not discovered. A clear arrow, highlight, or instruction overlay is required. Never assume the player will figure it out.
- **The intro sequence must be unmissable.** If the story beat plays while the player is looking elsewhere, it fails. Block interaction until the intro lands, or make the intro part of the first click.
- Skill trees should be **visible even when locked** — greyed-out future nodes are motivational. Hidden options that unlock later rob the player of anticipation.
- Story beats can be tiny: a one-line flavour text on each upgrade or milestone does the job without a dialogue system.

## Positioning & SVG (the "flies from top-left" bug family)

This family of bugs has now burned iterations across TWO games (trunks in game-002, twin anvil in game-003). Root cause each time: a broken contract between CSS, SVG attributes, and CSS transforms. Rules to prevent it forever:

- **On SVG elements, NEVER use `.className = 'foo'` — it silently fails.** `.className` on SVG is a read-only `SVGAnimatedString` object. Assigning a string to it does not set the `class` attribute, the CSS rule never applies, and the element renders at broken size/position. Always use `setAttribute('class', 'foo')` or `classList.add('foo')` for SVG. (Plain `.className =` is fine on HTML elements — but the moment you touch an SVG, switch.)
- **Position SVG groups via the `transform` ATTRIBUTE, not CSS `transform`.** Use `outer.setAttribute('transform', 'translate(x,y)')` on the positioning group. If you ALSO want a CSS-animated transform (pulse, spin, bounce), put it on a SEPARATE INNER group. Mixing CSS transform onto the positioning group will stomp the translate and snap the thing to (0,0).
- **Never compute a flight path from an element's `getBoundingClientRect()` until you have proof it's laid out at its final size/position.** If the element was just created, reparented, or its stylesheet class was just set, force a reflow first (read `el.offsetWidth`) before measuring — otherwise you may measure a 0×0 box and animate from its top-left corner.
- **When reparenting an existing SVG into a new container mid-game (e.g. for a "second anvil" unlock), re-verify any cached `getBoundingClientRect()`-dependent animation the next frame.** Reparenting invalidates layout; animations keyed on the old position will start at the wrong origin.

**If a new object "appears at or flies from the top-left corner," this family is the first suspect** — grep for `\.className\s*=` on SVG nodes and for CSS transforms on SVG positioning groups before debugging anything else.

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

*Updated after game-003-starforge playtest (2026-04-24).*
