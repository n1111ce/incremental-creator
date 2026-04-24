// data.js — constants, upgrade defs, skill tree, save/load, visual identity

var SAVE_KEY = 'starforge-save-v1';

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
    hueBase: 48,          // warm ember — forced per design spec
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
  r(); r(); r(); r(); r(); // consume remaining rolls to match spec positions
  return id;
}

var IDENTITY = rollIdentity();

function palette(n) {
  n = n || 5;
  var id = IDENTITY;
  var offsets = [0, 15, 180, 195, 210]; // complementary
  return offsets.slice(0, n).map(function(o, i) {
    var h = (id.hueBase + o + 360) % 360;
    var l = id.lightness + (i - 2) * 6;
    return 'hsl(' + h + ',' + id.saturation + '%,' + l + '%)';
  });
}

// Skill tree branches
var UPGRADES = [
  // FLAME branch
  { id:'heavier_hammer',   branch:'FLAME', name:'Heavier Hammer',    lore:'Iron remembers the weight of stars.',         effect:'+5 click power',        cost:10,   type:'click', val:5 },
  { id:'stoked_coals',     branch:'FLAME', name:'Stoked Coals',      lore:'Feed the hunger. The fire grows teeth.',      effect:'+10 click power',       cost:50,   type:'click', val:10 },
  { id:'meteor_strike',    branch:'FLAME', name:'Meteor Strike',     lore:'The sky lends you its oldest rage.',          effect:'+50 click power',       cost:500,  type:'click', val:50 },
  { id:'slow_burn',        branch:'FLAME', name:'Slow Burn',         lore:'Patience is the forge\'s oldest tool.',       effect:'Heat decays half as fast', cost:100, type:'decay_half', val:1 },

  // SKY branch
  { id:'apprentice_bellows', branch:'SKY', name:'Apprentice Bellows', lore:'The first breath warms a cold anvil.',       effect:'Auto +1 heat/sec',      cost:75,   type:'auto', val:1 },
  { id:'journeyman_bellows', branch:'SKY', name:'Journeyman Bellows', lore:'A rhythm found. The bellows pulse.',        effect:'Auto +5 heat/sec',      cost:400,  type:'auto', val:5 },
  { id:'master_bellows',     branch:'SKY', name:'Master Bellows',    lore:'The forge breathes on its own now.',         effect:'Auto +20 heat/sec',     cost:2000, type:'auto', val:20 },
  { id:'wider_sky',          branch:'SKY', name:'Wider Sky',         lore:'The heavens expand for your ambition.',      effect:'Larger sky, more constellations', cost:250, type:'wider_sky', val:1 },

  // MYTH branch
  { id:'silver_stars',    branch:'MYTH', name:'Silver Stars',       lore:'Each light is worth its weight in memory.',   effect:'Each star = 2 Light',   cost:200,  type:'star_worth', val:2 },
  { id:'golden_stars',    branch:'MYTH', name:'Golden Stars',       lore:'The ancients traded stories for gold light.', effect:'Each star = 5 Light',   cost:1500, type:'star_worth', val:5 },
  { id:'mythic_stars',    branch:'MYTH', name:'Mythic Stars',       lore:'A name carved into the turning sky.',        effect:'Each star = 15 Light',  cost:8000, type:'star_worth', val:15 },
  { id:'supernova_unlock', branch:'MYTH', name:'Supernova',         lore:'End the age. Begin the next.',               effect:'Unlocks Supernova prestige', cost:0, type:'supernova', val:1, requires_total:5000 },
];

// Low-discrepancy scatter (Halton sequence) for star placement
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

// Default G state
var G_DEFAULTS = {
  heat: 0,
  stars: 0,
  totalStarsEver: 0,
  affinity: 1.0,
  supernovaCount: 0,
  upgrades: {},
  skyHue: 250,
  _introSeen: false,
  _firstStarToasted: false,
  _tenthStarToasted: false,
  _firstConstellationToasted: false,
  _firstSessionHeat100: false,
  skyStars: [],      // [{x,y,points,size,phase,speed}]
  constellationLines: [], // [{x1,y1,x2,y2}]
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
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      for (var k in s) {
        if (Object.prototype.hasOwnProperty.call(s, k)) G[k] = s[k];
      }
      debugLog('loaded save — stars:' + G.stars + ' affinity:' + G.affinity.toFixed(2));
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
  if (G.upgrades['heavier_hammer'])  base += 5;
  if (G.upgrades['stoked_coals'])    base += 10;
  if (G.upgrades['meteor_strike'])   base += 50;
  return base;
}

function getAutoHeat() {
  var h = 0;
  if (G.upgrades['apprentice_bellows'])  h += 1;
  if (G.upgrades['journeyman_bellows'])  h += 5;
  if (G.upgrades['master_bellows'])      h += 20;
  return h;
}

function getDecayRate() {
  return G.upgrades['slow_burn'] ? 0.25 : 0.5;
}

function getStarWorth() {
  if (G.upgrades['mythic_stars'])  return 15;
  if (G.upgrades['golden_stars'])  return 5;
  if (G.upgrades['silver_stars'])  return 2;
  return 1;
}

function canPrestige() {
  return G.upgrades['supernova_unlock'] && G.totalStarsEver >= 5000;
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}
