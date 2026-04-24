# Assets Toolkit — Parametric Procedural Visuals

Generate visual identity from a **seed + dials**, not a fixed menu. Every new game rolls its own look — effectively infinite combos, while staying coherent. Named "presets" still exist as convenient starting points, but they're just frozen dial values.

Every game's `README.md` declares: **generator set + dial roll (seed) + preset name (if any)**.

---

## 1. The roll — how a game picks its identity

At game start, pick a seed, derive every visual dial from it:

```js
const mulberry32 = (s) => () => {
  s |= 0; s = s + 0x6D2B79F5 | 0;
  let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

function rollIdentity(seed) {
  const r = mulberry32(seed);
  return {
    // shape dials
    strokeWidth: 0.5 + r() * 4,          // 0.5 – 4.5 px
    cornerRadius: r() * 24,              // 0 – 24 px
    symmetry: r() < 0.7,                 // mostly symmetric, sometimes not
    density: 0.3 + r() * 0.7,            // how much stuff fills the silhouette
    jitter: r() * 6,                     // vertex wobble (px)
    // palette dials
    hueBase: r() * 360,
    hueScheme: ['mono','analogous','complementary','triadic','tetradic'][Math.floor(r()*5)],
    saturation: 20 + r() * 80,           // 20 – 100
    lightness: 35 + r() * 40,            // 35 – 75
    bgTone: r() < 0.5 ? 'light' : 'dark',
    // surface dials
    shadowSoftness: r() * 20,
    grainAmount: r() * 0.3,
    wobble: r() * 5,                     // SVG turbulence displacement
    glow: r() * 10,                      // drop-shadow blur radius
    scanlines: r() < 0.15,               // rare CRT overlay
    pixelate: r() < 0.2,                 // rare pixel mode
    // mood
    moodFilter: pickMood(r),             // built from filter primitives below
  };
}
```

Dump this `identity` object into the game's `README.md` so playtests can cite *"game 007 with seed 48293 felt amazing"* and we can replay or mutate that roll.

---

## 2. Palette generator (infinite, coherent)

```js
function palette(id, n = 5) {
  const { hueBase, hueScheme, saturation, lightness } = id;
  const offsets = {
    mono:        [0, 0, 0, 0, 0],
    analogous:   [-30, -15, 0, 15, 30],
    complementary: [0, 15, 180, 195, 210],
    triadic:     [0, 120, 240, 60, 180],
    tetradic:    [0, 90, 180, 270, 45],
  }[hueScheme];
  return offsets.slice(0, n).map((o, i) => {
    const h = (hueBase + o + 360) % 360;
    const l = lightness + (i - 2) * 6; // spread lightness
    return `hsl(${h} ${saturation}% ${l}%)`;
  });
}
```

Every palette is harmonically coherent yet unique. Use index 0 for primary, 2 for accent, last for bg if dark-on-dark needed.

---

## 3. Composable filter primitives

Instead of 6 fixed style packs, **build** the SVG `<filter>` at runtime from the dial roll. Each primitive is optional.

```js
function buildFilter(id) {
  const parts = [];
  if (id.wobble > 1.5) parts.push(`
    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="${id.seed||1}"/>
    <feDisplacementMap in="SourceGraphic" scale="${id.wobble}"/>
  `);
  if (id.grainAmount > 0.1) parts.push(`
    <feTurbulence baseFrequency="0.9" numOctaves="1"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${id.grainAmount} 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  `);
  if (id.shadowSoftness > 5) parts.push(`
    <feGaussianBlur stdDeviation="${id.shadowSoftness * 0.3}"/>
    <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -6"/>
  `); // claymation/goo
  return `<filter id="fx">${parts.join('')}</filter>`;
}
```

Stack as many as the dials say. This alone gives *millions* of visual signatures.

CSS filter stack for the whole game container (cheap, animatable):
```js
function cssFilter(id) {
  const f = [];
  if (id.glow > 3) f.push(`drop-shadow(0 0 ${id.glow}px ${palette(id)[1]})`);
  f.push(`saturate(${0.8 + id.saturation/100})`);
  f.push(`contrast(${0.95 + Math.random()*0.2})`);
  return f.join(' ');
}
```

---

## 4. Generator mutation (exponential variety from one generator)

Every generator takes `(id, tier, localSeed)` and **toggles features** based on bits of the seed. One creature generator with 10 toggles = 1024 silhouettes.

```js
function makeCreature(id, tier, s) {
  const r = mulberry32(s);
  const features = {
    legs: r() < 0.7 ? Math.floor(r()*6)+2 : 0,
    antennae: r() < 0.4,
    segments: Math.floor(r()*4)+1,
    eyes: [1,2,2,2,3,4][Math.floor(r()*6)],
    tail: r() < 0.5,
    wings: r() < 0.3,
    horns: r() < 0.25,
    symmetric: id.symmetry,
    spots: r() < 0.4,
    fuzzy: r() < 0.3,
  };
  // build SVG from features, scale detail by tier
  return svgFromFeatures(features, tier, id);
}
```

**Rule: tier must change silhouette, not just color.** Player needs to see progress at a glance.

Generator archetypes to build on (each with its own feature set):
- creature/blob · building/factory · plant/tree · gem/crystal · machine/gears · vehicle · orb/artifact · glyph/rune · food/dish · landscape-tile

---

## 5. Presets (frozen dial rolls — use as fallback or starting point)

Still useful when you want a known vibe. These are just named seeds:

| Preset | Seed | Vibe |
|---|---|---|
| `neon-night` | 1337 | dark bg, high glow, complementary palette |
| `pastel-soft` | 420 | light bg, low saturation, rounded corners |
| `handdrawn-paper` | 7 | high wobble, grain, warm off-white bg |
| `crt-arcade` | 1984 | scanlines, pixelate, triadic saturated |
| `claymation` | 99 | heavy goo filter, big shadow, pastel |
| `flat-bold` | 2020 | zero surface effects, tetradic, thick strokes |

You can always override the roll with one of these, or start from a preset and mutate 1–2 dials.

---

## 6. Mood transitions (events that bend the filter stack)

Animate the CSS filter stack for juice:
- **Prestige flash**: saturate(3) brightness(1.5) for 600ms, ease back
- **Boss/phase shift**: hue-rotate over 2s to a new identity
- **Low resource**: slowly drift toward grayscale + vignette
- **Combo chain**: pulse glow radius with each tick

Mood changes are a huge dopamine lever — use them to mark milestones.

---

## 7. Noise (textures, organic shapes, terrain)

```js
const noise2d = (x, y, seed=0) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
};
```

For real simplex, paste a ~50-line vanilla snippet when needed (no npm).

---

## 8. Animation primitives

- `requestAnimationFrame` tick loop
- CSS `@keyframes` for juice (number popups, button bounces, unlock flashes)
- SVG `<animate>` / `<animateTransform>` for living visuals (breathing, spinning, drifting)
- Easing: `t<.5 ? 2*t*t : -1+(4-2*t)*t` (easeInOutQuad) — covers 90% of cases

---

## 9. Rule of thumb

**Visuals must evolve every ~30 seconds of play.** Something has to change — new generator piece, filter dial drift, palette shift, mood flash. Static visuals kill incrementals faster than static numbers.

Corollary: **never ship a game with only one identity roll.** Prestige / milestones should at minimum nudge a dial (hue drift, new generator feature unlocks, filter primitive added). The identity should feel *earned and evolving*, not assigned.

---

## 10. Iteration log

Update when a playtest reveals a dial range, feature toggle, or mood transition that worked great (or terrible). Be specific — dial values, not vibes.

*(empty — fill from playtests)*
