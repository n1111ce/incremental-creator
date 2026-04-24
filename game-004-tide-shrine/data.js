// data.js — skill tree definition, balance constants, save schema

// ---------------------------------------------------------------------------
// Visual identity — claymation preset (seed 99) adapted for beach/sea
// ---------------------------------------------------------------------------
var IDENTITY = {
  seed: 99,
  preset: 'claymation',
  wobble: 3,
  grainAmount: 0.12,
  shadowSoftness: 12,
  glow: 7,
  strokeWidth: 2.5,
  cornerRadius: 8,
  hueBase: 200,           // teal/sea base
  hueScheme: 'analogous',
  saturation: 62,
  lightness: 52,
  bgTone: 'dark',
};

// ---------------------------------------------------------------------------
// Balance constants
// ---------------------------------------------------------------------------
var BALANCE = {
  BASE_SHELLS_PER_PULL: 1,
  AUTO_PULLER_INTERVAL: 8,      // seconds between auto-pulls (base)
  MOON_CYCLE_DURATION: 45,      // seconds per full moon cycle
  FULL_MOON_MULTIPLIER: 3,
  FULL_MOON_DURATION: 10,       // seconds
  DIVER_MIN_INTERVAL: 30,       // seconds
  DIVER_MAX_INTERVAL: 60,
  DIVER_SHELL_BONUS: 40,
  LIGHTHOUSE_COMBO_MAX: 10,     // clicks to fill combo bar
  LIGHTHOUSE_BOOST_MULT: 3,
  LIGHTHOUSE_BOOST_DURATION: 8, // seconds
  SHRINE2_PULL_RATE: 4,         // seconds between shrine2 auto-pulls
  SEAGULL_INTERVAL: 18,         // seconds between seagulls
  SHELL_PILE_CAP: 30,
};

// ---------------------------------------------------------------------------
// Skill tree — 5 branches, ~25 nodes total
// Layout: node positions specified as [col, row] grid coords
// Each branch has 2–3 numeric nodes gating a mechanic-unlock node
// ---------------------------------------------------------------------------

// Node types: 'numeric' (stat boost), 'mechanic' (new feature unlocked)
// Branch ids: 'rope', 'sky', 'depths', 'twin', 'beacon'

var SKILL_NODES = [

  // ── ROPE BRANCH ──────────────────────────────────────────────────────────
  {
    id: 'rope1',
    branch: 'rope',
    type: 'numeric',
    label: 'Heavy Rope',
    flavor: 'the rope thickens',
    cost: 15,
    effect: { shellsPerPull: 2 },   // +2 base shells per pull
    requires: [],
    col: 1, row: 0,
  },
  {
    id: 'rope2',
    branch: 'rope',
    type: 'numeric',
    label: 'Braided Cord',
    flavor: 'barnacles cling to every knot',
    cost: 60,
    effect: { shellsPerPull: 4 },
    requires: ['rope1'],
    col: 1, row: 1,
  },
  {
    id: 'rope3',
    branch: 'rope',
    type: 'numeric',
    label: 'Ancient Weave',
    flavor: 'the rope hums with tide memory',
    cost: 200,
    effect: { shellsPerPull: 8 },
    requires: ['rope2'],
    col: 1, row: 2,
  },
  {
    id: 'rope_unlock',
    branch: 'rope',
    type: 'mechanic',
    label: 'Auto-Puller',
    flavor: 'the shrine breathes on its own',
    cost: 500,
    effect: { unlockAutoPuller: true },
    requires: ['rope3'],
    col: 1, row: 3,
  },

  // ── SKY BRANCH ───────────────────────────────────────────────────────────
  {
    id: 'sky1',
    branch: 'sky',
    type: 'numeric',
    label: 'Star Reader',
    flavor: 'clouds part above the shrine',
    cost: 20,
    effect: { ambientPct: 1 },  // +1% passive gain per second
    requires: [],
    col: 2, row: 0,
  },
  {
    id: 'sky2',
    branch: 'sky',
    type: 'numeric',
    label: 'Moon Watcher',
    flavor: 'the tide answers the moon',
    cost: 80,
    effect: { ambientPct: 2 },
    requires: ['sky1'],
    col: 2, row: 1,
  },
  {
    id: 'sky3',
    branch: 'sky',
    type: 'numeric',
    label: 'Night Vigil',
    flavor: 'dawn is just another tide',
    cost: 280,
    effect: { ambientPct: 3 },
    requires: ['sky2'],
    col: 2, row: 2,
  },
  {
    id: 'sky_unlock',
    branch: 'sky',
    type: 'mechanic',
    label: 'Moon Phases',
    flavor: 'the full moon wakes the deep',
    cost: 700,
    effect: { unlockMoonPhases: true },
    requires: ['sky3'],
    col: 2, row: 3,
  },

  // ── DEPTHS BRANCH ────────────────────────────────────────────────────────
  {
    id: 'depths1',
    branch: 'depths',
    type: 'numeric',
    label: 'Shallow Waters',
    flavor: 'sand stirs underfoot',
    cost: 25,
    effect: { dropChancePct: 5 },  // +5% chance of bonus shells per pull
    requires: [],
    col: 3, row: 0,
  },
  {
    id: 'depths2',
    branch: 'depths',
    type: 'numeric',
    label: 'Reef Currents',
    flavor: 'the reef offers its bounty',
    cost: 100,
    effect: { dropChancePct: 10 },
    requires: ['depths1'],
    col: 3, row: 1,
  },
  {
    id: 'depths3',
    branch: 'depths',
    type: 'numeric',
    label: 'Abyssal Pull',
    flavor: 'something ancient stirs below',
    cost: 350,
    effect: { dropChancePct: 15 },
    requires: ['depths2'],
    col: 3, row: 2,
  },
  {
    id: 'depths_unlock',
    branch: 'depths',
    type: 'mechanic',
    label: 'Pearl Diver',
    flavor: 'a shadow crosses the sea floor',
    cost: 900,
    effect: { unlockPearlDiver: true },
    requires: ['depths3'],
    col: 3, row: 3,
  },

  // ── TWIN SHRINE BRANCH ───────────────────────────────────────────────────
  {
    id: 'twin1',
    branch: 'twin',
    type: 'numeric',
    label: 'Wider Shore',
    flavor: 'waves spread across the sand',
    cost: 30,
    effect: { waveSize: 1.2 },  // wave size multiplier
    requires: [],
    col: 4, row: 0,
  },
  {
    id: 'twin2',
    branch: 'twin',
    type: 'numeric',
    label: 'Strong Current',
    flavor: 'the tide surges with purpose',
    cost: 130,
    effect: { waveSize: 1.5 },
    requires: ['twin1'],
    col: 4, row: 1,
  },
  {
    id: 'twin3',
    branch: 'twin',
    type: 'numeric',
    label: 'Tidal Surge',
    flavor: 'the sea remembers old paths',
    cost: 450,
    effect: { waveSize: 2.0 },
    requires: ['twin2'],
    col: 4, row: 2,
  },
  {
    id: 'twin_unlock',
    branch: 'twin',
    type: 'mechanic',
    label: 'Second Shrine',
    flavor: 'an echo answers from the east',
    cost: 1200,
    effect: { unlockSecondShrine: true },
    requires: ['twin3'],
    col: 4, row: 3,
  },

  // ── BEACON BRANCH ────────────────────────────────────────────────────────
  {
    id: 'beacon1',
    branch: 'beacon',
    type: 'numeric',
    label: 'First Light',
    flavor: 'a flame holds against the dark',
    cost: 40,
    effect: { multiplierFloor: 1.1 },  // minimum multiplier
    requires: [],
    col: 5, row: 0,
  },
  {
    id: 'beacon2',
    branch: 'beacon',
    type: 'numeric',
    label: 'Steady Flame',
    flavor: 'the keeper\'s vigil never wavers',
    cost: 160,
    effect: { multiplierFloor: 1.25 },
    requires: ['beacon1'],
    col: 5, row: 1,
  },
  {
    id: 'beacon3',
    branch: 'beacon',
    type: 'numeric',
    label: 'Blinding Blaze',
    flavor: 'ships turn from a day\'s voyage away',
    cost: 550,
    effect: { multiplierFloor: 1.5 },
    requires: ['beacon2'],
    col: 5, row: 2,
  },
  {
    id: 'beacon_unlock',
    branch: 'beacon',
    type: 'mechanic',
    label: 'Lighthouse',
    flavor: 'the beam sweeps the horizon clean',
    cost: 1500,
    effect: { unlockLighthouse: true },
    requires: ['beacon3'],
    col: 5, row: 3,
  },

];

// Quick lookup by id
var SKILL_BY_ID = {};
SKILL_NODES.forEach(function(n) { SKILL_BY_ID[n.id] = n; });

// Branch color theme
var BRANCH_COLORS = {
  rope:   { stroke: '#c8943a', fill: '#7a5020', glow: '#f0c060' },
  sky:    { stroke: '#6ab0d8', fill: '#1a4a6a', glow: '#a0d8f8' },
  depths: { stroke: '#4a9a8a', fill: '#0a3a30', glow: '#80d8c0' },
  twin:   { stroke: '#a07860', fill: '#4a2810', glow: '#e0a878' },
  beacon: { stroke: '#d4a030', fill: '#5a3800', glow: '#f0d060' },
};

// ---------------------------------------------------------------------------
// Default save state
// ---------------------------------------------------------------------------
function makeDefaultG() {
  return {
    version: 1,

    // Currency
    shells: 0,
    totalShellsEver: 0,
    pearls: 0,

    // Pull stats
    totalPulls: 0,
    lastPullTime: 0,

    // Skill tree
    ownedSkills: [],          // array of skill ids

    // Derived (recalculated from ownedSkills)
    shellsPerPull: 1,
    ambientPct: 0,            // total ambient %
    dropChancePct: 0,         // total bonus drop %
    waveSizeMult: 1.0,
    multiplierFloor: 1.0,

    // Feature unlock flags
    autoPullerActive: false,
    moonPhasesActive: false,
    pearlDiverActive: false,
    secondShrineActive: false,
    lighthouseActive: false,

    // Moon phase state
    moonPhase: 0,             // 0=new, 1=crescent, 2=half, 3=full
    moonCycleTimer: 0,        // seconds elapsed in current cycle
    fullMoonTimer: 0,         // seconds remaining in full moon boost

    // Pearl diver state
    diverTimer: 0,            // seconds until diver appears
    diverVisible: false,

    // Lighthouse combo state
    comboCharge: 0,           // 0..BALANCE.LIGHTHOUSE_COMBO_MAX
    lighthouseBoostTimer: 0,  // seconds remaining in boost

    // Shrine2 auto-pull timer
    shrine2Timer: 0,

    // Visual state
    shellsOnSand: 0,          // decorative shells on beach (capped at BALANCE.SHELL_PILE_CAP)
    skyHue: 0,                // drift 0..1

    // Intro state
    introComplete: false,
    firstPullDone: false,
    skillsButtonFlashed: false,

    // Session timer (for visual evolution)
    sessionTime: 0,
  };
}

// ---------------------------------------------------------------------------
// Mulberry32 PRNG (from ASSETS.md)
// ---------------------------------------------------------------------------
function mulberry32(s) {
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------
function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

function fmtDec(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}
