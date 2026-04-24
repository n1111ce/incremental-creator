// data.js — constants, upgrade defs, skill tree, save/load, visual identity

var SAVE_KEY = 'starforge-save-v2';
var SAVE_KEY_V1 = 'starforge-save-v1';

// mulberry32 PRNG from ASSETS.md
var mulberry32 = function(s) {
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

var IDENTITY_SEED = 0x57A4;

function rollIdentity() {
  var r = mulberry32(IDENTITY_SEED);
  var id = {
    seed: IDENTITY_SEED,
    strokeWidth: 0.5 + r() * 4,
    cornerRadius: r() * 24,
    symmetry: r() < 0.7,
    density: 0.3 + r() * 0.7,
    jitter: r() * 6,
    hueBase: 48,
    hueScheme: 'complementary',
    saturation: 75,
    lightness: 55,
    bgTone: 'dark',
    shadowSoftness: r() * 20,
    grainAmount: r() * 0.3,
    wobble: r() * 5,
    glow: 7,
    scanlines: false,
    pixelate: false,
  };
  r(); r(); r(); r(); r();
  return id;
}

var IDENTITY = rollIdentity();

function palette(n) {
  n = n || 5;
  var id = IDENTITY;
  var offsets = [0, 15, 180, 195, 210];
  return offsets.slice(0, n).map(function(o, i) {
    var h = (id.hueBase + o + 360) % 360;
    var l = id.lightness + (i - 2) * 6;
    return 'hsl(' + h + ',' + id.saturation + '%,' + l + '%)';
  });
}

// ---------------------------------------------------------------------------
// Skill tree — UPGRADES v2
// Node schema: { id, branch, row, parent, type, name, flavor, cost, effect }
// ---------------------------------------------------------------------------
var UPGRADES = [
  // FLAME branch
  { id:'F1', branch:'flame', row:0, parent:null,  type:'numeric',  name:'Heavier Hammer',  flavor:'Swing meets bone.',                              cost:10,    effect:{type:'clickPower', value:5} },
  { id:'F2', branch:'flame', row:1, parent:'F1',  type:'numeric',  name:'Stoked Coals',    flavor:'The forge breathes hotter.',                    cost:50,    effect:{type:'clickPower', value:15} },
  { id:'F3', branch:'flame', row:2, parent:'F2',  type:'numeric',  name:'Slow Burn',       flavor:'Heat clings to the stone.',                     cost:120,   effect:{type:'heatDecayMult', value:0.5} },
  { id:'F4', branch:'flame', row:3, parent:'F3',  type:'mechanic', name:'Combo Forge',     flavor:'Strike faster than the ember can dim.',          cost:400,   effect:{type:'unlock_combo'} },
  { id:'F5', branch:'flame', row:4, parent:'F4',  type:'numeric',  name:'Combo Memory',    flavor:'The rhythm remembers you.',                     cost:900,   effect:{type:'comboWindow', value:1.0} },
  { id:'F6', branch:'flame', row:5, parent:'F5',  type:'mechanic', name:'Twin Anvil',      flavor:'A sibling fire wakes beside you.',               cost:2500,  effect:{type:'unlock_twin_anvil'} },
  { id:'F7', branch:'flame', row:6, parent:'F6',  type:'numeric',  name:'Forged in Myth',  flavor:'Every blow is a legend now.',                   cost:5000,  effect:{type:'clickPower', value:200} },
  { id:'F8', branch:'flame', row:7, parent:'F7',  type:'mechanic', name:'Strike Chain',    flavor:'Lightning remembers every star it made.',        cost:12000, effect:{type:'unlock_strike_chain'} },

  // SKY branch
  { id:'S1', branch:'sky',   row:0, parent:null,  type:'numeric',  name:'Apprentice Bellows', flavor:'First breath of the forge.',                 cost:75,    effect:{type:'autoHeat', value:1} },
  { id:'S2', branch:'sky',   row:1, parent:'S1',  type:'numeric',  name:'Wider Sky',          flavor:'The heavens make room.',                     cost:200,   effect:{type:'skyCapacity', value:20} },
  { id:'S3', branch:'sky',   row:2, parent:'S2',  type:'numeric',  name:'Journeyman Bellows', flavor:'Hands that learned by fire.',                cost:500,   effect:{type:'autoHeat', value:4} },
  { id:'S4', branch:'sky',   row:3, parent:'S3',  type:'mechanic', name:'Shooting Stars',     flavor:'Not all stars are forged — some fall.',       cost:800,   effect:{type:'unlock_shooting_stars'} },
  { id:'S5', branch:'sky',   row:4, parent:'S4',  type:'numeric',  name:'Shower Density',     flavor:'The sky forgets its silence.',                cost:1800,  effect:{type:'shootingStarRate', value:2} },
  { id:'S6', branch:'sky',   row:5, parent:'S5',  type:'mechanic', name:'Moon Phase',         flavor:'A pale witness rises above the forge.',       cost:3500,  effect:{type:'unlock_moon_phase'} },
  { id:'S7', branch:'sky',   row:6, parent:'S6',  type:'numeric',  name:'Master Bellows',     flavor:'The forge breathes without you.',             cost:6000,  effect:{type:'autoHeat', value:15} },
  { id:'S8', branch:'sky',   row:7, parent:'S7',  type:'mechanic', name:'Nebula Drift',       flavor:'Dust becomes light becomes memory.',          cost:15000, effect:{type:'unlock_nebula_drift'} },

  // MYTH branch
  { id:'M1', branch:'myth',  row:0, parent:null,  type:'numeric',  name:'Silver Stars',       flavor:'Worth is a choice of metal.',                cost:200,   effect:{type:'lightPerStar', value:2} },
  { id:'M2', branch:'myth',  row:1, parent:'M1',  type:'numeric',  name:'Starseer',           flavor:'Read the sky, know the road.',               cost:600,   effect:{type:'starseer'} },
  { id:'M3', branch:'myth',  row:2, parent:'M2',  type:'numeric',  name:'Golden Stars',       flavor:'Warmth poured into permanence.',             cost:1500,  effect:{type:'lightPerStar', value:2.5} },
  { id:'M4', branch:'myth',  row:3, parent:'M3',  type:'mechanic', name:'Constellation Power',flavor:'Shapes in the dark remember their makers.',   cost:2500,  effect:{type:'unlock_constellation_power'} },
  { id:'M5', branch:'myth',  row:4, parent:'M4',  type:'numeric',  name:'Mythic Stars',       flavor:'These ones have names.',                      cost:8000,  effect:{type:'lightPerStar', value:3} },
  { id:'M6', branch:'myth',  row:5, parent:'M5',  type:'mechanic', name:'Comet Ritual',       flavor:'The wanderer returns with tribute.',          cost:20000, effect:{type:'unlock_comet_ritual'} },
  { id:'M7', branch:'myth',  row:6, parent:'M6',  type:'mechanic', name:'Supernova',          flavor:'End the sky. Begin it greater.',              cost:0,     effect:{type:'supernova'}, requiresTotal:5000 },
];

// ---------------------------------------------------------------------------
// Low-discrepancy scatter (Halton sequence) for star placement
// ---------------------------------------------------------------------------
function halton(index, base) {
  var result = 0, f = 1;
  while (index > 0) {
    f = f / base;
    result += f * (index % base);
    index = Math.floor(index / base);
  }
  return result;
}

function starPosition(index, skyW, skyH) {
  var jitter = mulberry32(index * 997 + 1337);
  var bx = halton(index + 1, 2);
  var by = halton(index + 1, 3);
  var j = jitter();
  var x = skyW * (0.06 + bx * 0.88) + (j - 0.5) * 40;
  var y = skyH * (0.06 + by * 0.88) + (j * jitter() - 0.25) * 30;
  x = Math.max(20, Math.min(skyW - 20, x));
  y = Math.max(20, Math.min(skyH - 20, y));
  return { x: x, y: y };
}

// ---------------------------------------------------------------------------
// Default G state (v2)
// ---------------------------------------------------------------------------
var G_DEFAULTS = {
  heat: 0,
  twinHeat: 0,              // second anvil heat (F6)
  stars: 0,
  totalStarsEver: 0,
  affinity: 1.0,
  supernovaCount: 0,
  upgrades: {},
  skyHue: 250,
  skyCapacity: 60,

  // Combo system (F4/F5)
  comboCount: 0,
  comboLastStrike: 0,

  // Strike chain (F8)
  strikesSinceChain: 0,

  // Shooting stars (S4/S5)
  shootingStarNextAt: 0,    // timestamp ms

  // Moon phase (S6)
  moonPhaseTime: 0,         // seconds elapsed in current cycle

  // Nebula drift (S8)
  nebulaDriftNextAt: 0,     // timestamp ms

  // Constellation power (M4)
  constellationsCompleted: 0,

  // Comet ritual (M6)
  cometStarProgress: 0,     // stars since last comet
  cometActive: false,

  // Milestone flags
  _introSeen: false,
  _firstStarToasted: false,
  _tenthStarToasted: false,
  _firstConstellationToasted: false,
  _firstSessionHeat100: false,

  skyStars: [],
  constellationLines: [],
};

function makeDefaultG() {
  var g = {};
  for (var k in G_DEFAULTS) {
    var v = G_DEFAULTS[k];
    if (Array.isArray(v)) g[k] = [];
    else if (v !== null && typeof v === 'object') { g[k] = {}; for (var kk in v) g[k][kk] = v[kk]; }
    else g[k] = v;
  }
  return g;
}

// ---------------------------------------------------------------------------
// Save / Load / Export / Import
// ---------------------------------------------------------------------------
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
    debugLog('saved');
  } catch(e) {}
}

function loadGame() {
  try {
    // Try v2 first
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      for (var k in s) {
        if (Object.prototype.hasOwnProperty.call(s, k)) G[k] = s[k];
      }
      // Ensure new fields default if missing
      for (var dk in G_DEFAULTS) {
        if (G[dk] === undefined) {
          var dv = G_DEFAULTS[dk];
          G[dk] = Array.isArray(dv) ? [] : dv;
        }
      }
      debugLog('loaded v2 save — stars:' + G.stars);
      return;
    }

    // Migrate v1 → v2
    var rawV1 = localStorage.getItem(SAVE_KEY_V1);
    if (rawV1) {
      var s1 = JSON.parse(rawV1);
      // Carry over safe fields
      var carry = ['stars','totalStarsEver','affinity','supernovaCount','skyHue',
                   '_introSeen','_firstStarToasted','_tenthStarToasted',
                   '_firstConstellationToasted','_firstSessionHeat100',
                   'skyStars','constellationLines'];
      for (var ci = 0; ci < carry.length; ci++) {
        var ck = carry[ci];
        if (s1[ck] !== undefined) G[ck] = s1[ck];
      }
      // Map v1 upgrade ids to v2
      var idMap = {
        'heavier_hammer':    'F1',
        'stoked_coals':      'F2',
        'slow_burn':         'F3',
        'apprentice_bellows':'S1',
        'wider_sky':         'S2',
        'journeyman_bellows':'S3',
        'master_bellows':    'S7',
        'silver_stars':      'M1',
        'golden_stars':      'M3',
        'mythic_stars':      'M5',
      };
      if (s1.upgrades) {
        for (var oldId in idMap) {
          if (s1.upgrades[oldId]) G.upgrades[idMap[oldId]] = true;
        }
      }
      G.skyCapacity = s1.upgrades && s1.upgrades['wider_sky'] ? 80 : 60;
      debugLog('migrated v1 save');
    } else {
      debugLog('no save — fresh start');
    }
  } catch(e) { debugLog('load error: ' + e); }
}

function exportSave() {
  try {
    var json = JSON.stringify(G);
    return btoa(unescape(encodeURIComponent(json)));
  } catch(e) { return ''; }
}

function importSave(str) {
  try {
    var json = decodeURIComponent(escape(atob(str.trim())));
    var s = JSON.parse(json);
    for (var k in s) {
      if (Object.prototype.hasOwnProperty.call(s, k)) G[k] = s[k];
    }
    saveGame();
    location.reload();
  } catch(e) {
    showToast('Invalid save');
    debugLog('import error');
  }
}

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------
function getClickPower() {
  var base = 5;
  if (G.upgrades['F1']) base += 5;
  if (G.upgrades['F2']) base += 15;
  if (G.upgrades['F7']) base += 200;
  return base;
}

function getAutoHeat() {
  var h = 0;
  if (G.upgrades['S1']) h += 1;
  if (G.upgrades['S3']) h += 4;
  if (G.upgrades['S7']) h += 15;
  return h;
}

function getDecayRate() {
  return G.upgrades['F3'] ? 0.25 : 0.5;
}

// Effective Light per star = lightPerStar * starseerMult * constellationMult * moonMult
function getLightPerStar() {
  var base = 1;
  if (G.upgrades['M1']) base *= 2;
  if (G.upgrades['M3']) base *= 2.5;
  if (G.upgrades['M5']) base *= 3;
  return base;
}

function getStarseerMult() {
  return G.upgrades['M2'] ? 1.05 : 1.0;
}

function getConstellationMult() {
  if (!G.upgrades['M4']) return 1.0;
  return 1 + 0.05 * (G.constellationsCompleted || 0);
}

function getMoonMult() {
  if (!G.upgrades['S6']) return 1.0;
  // Full moon phase is ~[60,75] seconds in 90s cycle
  var phase = (G.moonPhaseTime || 0) % 90;
  return (phase >= 60 && phase < 75) ? 3.0 : 1.0;
}

function getEffectiveLightPerStar() {
  return getLightPerStar() * getStarseerMult() * getConstellationMult() * getMoonMult() * G.affinity;
}

function getComboMult() {
  if (!G.upgrades['F4']) return 1.0;
  var combo = G.comboCount || 0;
  var mults = [1, 1.5, 2, 3, 5];
  var idx = Math.min(combo - 1, 4);
  return idx < 0 ? 1 : mults[idx];
}

function getComboWindow() {
  var w = 1.0;
  if (G.upgrades['F5']) w += 1.0;
  return w;
}

function getSkyCapacity() {
  return G.skyCapacity || 60;
}

function canPrestige() {
  return G.upgrades['M7'] && G.totalStarsEver >= 5000;
}

function isParentOwned(upg) {
  if (!upg.parent) return true;
  return !!G.upgrades[upg.parent];
}

function hasSave() {
  return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_KEY_V1));
}
