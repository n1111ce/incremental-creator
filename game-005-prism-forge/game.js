// game.js — Prism Forge core game logic
// G object, game loop, input, mechanics, save/load, god mode

// ======================================================
// GLOBAL STATE
// ======================================================
var G = {
  light: 0,
  lightTap: 1,
  lightPerSec: 0,
  gems: 0,
  gemColors: { red:0, orange:0, yellow:0, green:0, blue:0, violet:0 },
  vaultShards: 0,
  prestigeCount: 0,
  vaultCompletion: 0,

  unlocks: {
    mirrorArray: false,
    spectralGolem: false,
    stormCrystal: false,
    voidPrism: false
  },

  upgrades: {},

  // canvas objects
  lightNodes: [],
  prisms: [],
  colorOrbs: [],
  vatFill: [0, 0, 0],
  moldPhase: 0,
  moldGreenWidth: 60,
  moldSpeed: 1.5,
  moldLastTap: 0,
  mirrors: [],
  golem: null,
  stormActive: false,
  stormTimer: 0,
  stormSparks: [],
  stormSparkCount: 8,
  mirrorsAligned: false,
  voidConversions: 0,

  paused: false,
  tick: 0,
  lastSave: 0,
  firstLoad: true,
  onboarding: 0,

  // computed multipliers
  nodeRespawnMs: 4000,
  orbSpawnInterval: 3000,
  maxOrbs: 3,
  vaultSpeedMult: 1,
  voidBonusMultiplier: 1
};

// ======================================================
// COMPUTED MULTIPLIERS
// ======================================================
window.recomputeMultipliers = function() {
  G.lightTap           = 1 * (1 + 0.5 * (G.upgrades['A1'] || 0));
  G.nodeRespawnMs      = 4000 * Math.pow(0.75, G.upgrades['A2'] || 0);
  G.orbSpawnInterval   = 3000 * Math.pow(0.7, G.upgrades['B1'] || 0);
  G.maxOrbs            = 3 + (G.upgrades['B2'] || 0);
  G.stormSparkCount    = Math.floor(8 * (1 + 0.2 * (G.upgrades['C1'] || 0)));
  G.moldGreenWidth     = 60 * (1 + 0.15 * (G.upgrades['C2'] || 0));
  G.voidBonusMultiplier= 1 + 0.5 * (G.upgrades['D1'] || 0);
  G.vaultSpeedMult     = 1 + 0.2 * (G.upgrades['E1'] || 0);

  // Passive light/s: mirror beam + golem aura
  var passive = 0;
  if (G.unlocks.mirrorArray && G.mirrorsAligned) passive += 5;
  if (G.unlocks.spectralGolem && G.golem && G.golem.visible) passive += 2;
  G.lightPerSec = passive;
};

// ======================================================
// UPGRADE PURCHASE
// ======================================================
window.purchaseUpgrade = function(id) {
  var upg = UPGRADES[id];
  if (!upg) return;
  var lvl = G.upgrades[id] || 0;
  if (lvl >= upg.maxLevel) return;

  // Prereq check
  if (upg.requires) {
    var reqLvl = G.upgrades[upg.requires] || 0;
    var reqMax = UPGRADES[upg.requires] ? UPGRADES[upg.requires].maxLevel : 1;
    if (reqLvl < reqMax) return;
  }
  // Gate check
  if (upg.gate && G.gems < upg.gate) return;

  var cost = upg.cost[lvl];
  if (cost === undefined) return;
  if (G.light < cost) return;

  G.light -= cost;
  G.upgrades[id] = lvl + 1;

  // Trigger mechanic unlock
  if (upg.unlock && G.upgrades[id] >= upg.maxLevel) {
    G.unlocks[upg.unlock] = true;
    window.applyUnlock(upg.unlock);
  }

  window.recomputeMultipliers();
  window.renderUpgradeTree();
  window.updateHUD();
  window.floatText && window.floatText(
    window.innerWidth / 2,
    window.innerHeight / 2,
    upg.label + ' upgraded!',
    '#4bc8f0'
  );
  window.saveGame();
};

// ======================================================
// MECHANIC UNLOCKS
// ======================================================
window.applyUnlock = function(key) {
  if (key === 'mirrorArray' && G.unlocks.mirrorArray) {
    window.initMirrors();
    window.recomputeMultipliers();
  }
  if (key === 'spectralGolem' && G.unlocks.spectralGolem) {
    window.spawnGolem();
    window.recomputeMultipliers();
  }
  if (key === 'stormCrystal' && G.unlocks.stormCrystal) {
    // Storm timer starts; nothing visual until first storm
    G.stormTimer = 0;
  }
  if (key === 'voidPrism' && G.unlocks.voidPrism) {
    window.initVoidPrism();
  }
};

// ======================================================
// ORB SPAWNING
// ======================================================
var _orbTimer = 0;

function _maybeSpawnOrb(dt) {
  if (G.colorOrbs.length >= G.maxOrbs) return;
  _orbTimer += dt;
  if (_orbTimer >= G.orbSpawnInterval) {
    _orbTimer = 0;
    window.spawnOrb();
  }
}

// ======================================================
// LIGHT NODE TAP
// ======================================================
function tapLightNode(node) {
  if (!node.active) return;
  var gain = G.lightTap * (1 + G.vaultShards * 0.1);
  G.light += gain;
  window.dimLightNode(node);
  node.respawnTimer = G.nodeRespawnMs;
  window.burstParticles(node.x, node.y, '#4bc8f0');
  window.floatText(node.x, node.y - 40, '+' + Math.round(gain), '#4bc8f0');

  // Onboarding
  if (G.onboarding <= 0) window.advanceOnboarding(1);
}

function _tickNodes(dt) {
  G.lightNodes.forEach(function(node) {
    if (!node.active) {
      node.respawnTimer -= dt;
      if (node.respawnTimer <= 0) {
        window.relightNode(node);
      }
    }
  });
}

// ======================================================
// PRISM INTERACTION (color-select via drag)
// ======================================================
var _prismHold = null;
var _prismHoldX = 0;
var _prismAccum = 0;

function startPrismHold(prism, e) {
  _prismHold = prism;
  _prismHoldX = e.clientX;
  _prismAccum = 0;
  window.showPrismWheel(prism);
}

function rotatePrism(e) {
  if (!_prismHold) return;
  var dx = e.clientX - _prismHoldX;
  _prismAccum += dx;
  _prismHoldX = e.clientX;
  if (Math.abs(_prismAccum) >= 35) {
    var dir = _prismAccum > 0 ? 1 : -1;
    _prismHold.colorIdx = (_prismHold.colorIdx + dir + PRISM_CYCLE.length) % PRISM_CYCLE.length;
    _prismAccum = 0;
    window.updatePrismColor(_prismHold);
  }
}

function releasePrism() {
  if (!_prismHold) return;
  window.hidePrismWheel(_prismHold);
  _prismHold = null;
}

// ======================================================
// ORB DRAG
// ======================================================
var _dragOrb = null;
var _dragOffX = 0, _dragOffY = 0;

function startOrbDrag(orb, e) {
  _dragOrb = orb;
  orb.dragging = true;
  _dragOffX = e.clientX - orb.x;
  _dragOffY = e.clientY - orb.y - _canvasTop();
  window.bringOrbToFront(orb);
}

function moveOrb(e) {
  if (!_dragOrb) return;
  _dragOrb.x = e.clientX - _dragOffX;
  _dragOrb.y = e.clientY - _dragOffY - _canvasTop();
  window.updateOrbPosition(_dragOrb);
}

function dropOrb(e) {
  if (!_dragOrb) return;
  var orb = _dragOrb;
  orb.dragging = false;
  _dragOrb = null;

  // Check void prism first
  if (G.unlocks.voidPrism && !orb.isVoid && window.pointInVoidPrism(orb.x, orb.y)) {
    window.makeOrbVoid(orb);
    G.voidConversions++;
    window.floatText(orb.x, orb.y - 30, 'VOID!', '#9b50e0');
    window.checkVoidGem && window.checkVoidGem();
    return;
  }

  // Void orb dropped on any vat → light bonus
  if (orb.isVoid) {
    for (var vi = 0; vi < 3; vi++) {
      if (window.pointInVat(vi, orb.x, orb.y)) {
        var bonus = Math.round(10 * G.voidBonusMultiplier);
        G.light += bonus;
        window.floatText(orb.x, orb.y - 30, '+' + bonus + ' light!', '#9b50e0');
        window.removeOrb(orb);
        window.updateHUD();
        return;
      }
    }
    // Not on vat — let it float
    return;
  }

  // Normal orb — check vats
  for (var i = 0; i < 3; i++) {
    if (window.pointInVat(i, orb.x, orb.y)) {
      var accepts = VAT_COLORS[i];
      if (accepts.indexOf(orb.color) !== -1) {
        G.vatFill[i] = (G.vatFill[i] || 0) + 1;
        window.updateVatDisplay(i);
        window.removeOrb(orb);
        window.floatText(orb.x, orb.y - 20, orb.color + '!', COLOR_MAP[orb.color] || '#fff');
        // Onboarding
        if (G.onboarding < 2) window.advanceOnboarding(2);
        if (G.vatFill[i] >= 3) {
          setTimeout(function() { window.forgeGem(i); }, 100);
        }
        return;
      } else {
        // Wrong vat — bounce back
        orb.vy = -(0.5 + Math.random() * 0.3);
        window.floatText(orb.x, orb.y - 20, 'Wrong vat!', '#e05050');
        return;
      }
    }
  }
}

// ======================================================
// FORGE GEM (vat fills up)
// ======================================================
window.forgeGem = function(vatIdx) {
  if (vatIdx === undefined) {
    // called without index: check all
    for (var i = 0; i < 3; i++) {
      if (G.vatFill[i] >= 3) window.forgeGem(i);
    }
    return;
  }
  var accepts = VAT_COLORS[vatIdx];
  var color = accepts[Math.floor(Math.random() * accepts.length)];
  var gain = Math.round(1 * (1 + G.vaultShards * 0.1));
  G.gems += gain;
  G.gemColors[color] = (G.gemColors[color] || 0) + gain;
  G.vatFill[vatIdx] = 0;
  window.updateVatDisplay(vatIdx);
  window.flashVat(vatIdx);

  var ve_x = vatIdx === 0 ? window.innerWidth * 0.25 :
             vatIdx === 1 ? window.innerWidth * 0.5  :
                            window.innerWidth * 0.75;
  var ve_y = window.innerHeight * 0.7;
  window.floatText(ve_x, ve_y, '💎 +' + gain, '#e8d050');

  if (G.onboarding <= 1) window.advanceOnboarding(2);
  window.updateHUD();
};

// ======================================================
// GEM MOLD (rhythm mini-game)
// ======================================================
function tapMold() {
  var now = Date.now();
  if (now - G.moldLastTap < 200) return; // debounce
  G.moldLastTap = now;

  // Check if needle is in green zone (phase near 270)
  var half = G.moldGreenWidth / 2;
  var phase = G.moldPhase;
  var diff = Math.abs(phase - 270);
  if (diff > 180) diff = 360 - diff;

  if (diff <= half) {
    // HIT
    var bonus = Math.round(2 * (1 + G.vaultShards * 0.1));
    G.gems += bonus;
    G.gemColors.blue = (G.gemColors.blue || 0) + bonus;
    window.flashMoldSuccess();
    window.floatText(window.innerWidth * 0.5, window.innerHeight * 0.78, '💎 +' + bonus + ' BONUS!', '#50c878');
    if (G.onboarding <= 1) window.advanceOnboarding(2);
  } else {
    // MISS
    G.gems += 1;
    G.gemColors.red = (G.gemColors.red || 0) + 1;
    window.flashMoldMiss();
    window.floatText(window.innerWidth * 0.5, window.innerHeight * 0.78, '💎 +1', '#aaa');
  }
  window.updateHUD();
}

// ======================================================
// GOLEM
// ======================================================
function tapGolem() {
  if (!G.golem || !G.golem.visible) return;
  var gain = Math.round(30 * (1 + G.vaultShards * 0.1));
  G.light += gain;
  window.flashGolem();
  window.floatText(G.golem.x, G.golem.y - 40, '+' + gain + ' light', '#9b50e0');
  window.spawnOrb(); // bonus orb
  window.hideGolem();
  G.golem.timer = 15000; // respawn in 15s
  window.updateHUD();
}

function _tickGolemRespawn(dt) {
  if (!G.golem || G.golem.visible) return;
  G.golem.timer -= dt;
  if (G.golem.timer <= 0) {
    G.golem.x = window.innerWidth * 0.3 + Math.random() * window.innerWidth * 0.4;
    G.golem.y = window.innerHeight * 0.25 + Math.random() * window.innerHeight * 0.15;
    window.showGolem();
    window.recomputeMultipliers();
  }
}

// ======================================================
// STORM
// ======================================================
var _stormCooldown = 45000; // 45s between storms
var _stormTimerAcc = 0;
var _stormSparksTotal = 0;
var _stormSparksCaught = 0;

window.startStorm = function() {
  if (G.stormActive) return;
  G.stormActive = true;
  _stormSparksTotal = G.stormSparkCount;
  _stormSparksCaught = 0;
  _stormTimerAcc = 0;
  window.spawnStormSparks();
  window.floatText(window.innerWidth * 0.5, window.innerHeight * 0.35, '⚡ STORM!', '#e8d050');
};

function _tickStorm(dt) {
  if (!G.unlocks.stormCrystal) return;
  if (G.stormActive) {
    // Storm ends when all sparks gone or timer exceeds 12s
    _stormTimerAcc += dt;
    if (_stormTimerAcc > 12000 || G.stormSparks.length === 0) {
      G.stormActive = false;
      window.showStormResult(_stormSparksCaught, _stormSparksTotal);
      _stormTimerAcc = 0;
    }
  } else {
    G.stormTimer += dt;
    if (G.stormTimer >= _stormCooldown) {
      G.stormTimer = 0;
      window.startStorm();
    }
  }
}

function tapSpark(spark) {
  var gemGain = 3;
  G.gems += gemGain;
  G.gemColors.yellow = (G.gemColors.yellow || 0) + gemGain;
  _stormSparksCaught++;
  window.floatText(spark.x, spark.y - 20, '⚡ +' + gemGain, '#e8d050');
  window.removeSpark(spark);
  window.updateHUD();
}

// ======================================================
// VOID GEM CHECK
// ======================================================
window.checkVoidGem = function() {
  if (G.voidConversions > 0 && G.voidConversions % 5 === 0) {
    var darkGain = 10;
    G.gems += darkGain;
    G.gemColors.violet = (G.gemColors.violet || 0) + darkGain;
    window.floatText(window.innerWidth * 0.88, window.innerHeight * 0.25, '✦ DARK GEM +' + darkGain, '#9b50e0');
    window.updateHUD();
  }
};

// ======================================================
// MIRROR INTERACTION
// ======================================================
var _mirrorDrag = null;

function startMirrorDrag(mirror, e) {
  _mirrorDrag = mirror;
}

function moveMirror(e) {
  if (!_mirrorDrag) return;
  var cy = _canvasTop();
  window.moveMirrorTo(_mirrorDrag, e.clientX, e.clientY - cy);
}

function releaseMirror() {
  if (_mirrorDrag) {
    window.recomputeMultipliers(); // alignment may have changed
    _mirrorDrag = null;
  }
}

// ======================================================
// INPUT HANDLING
// ======================================================
var _activePointerId = null;
var _dragMode = null; // 'orb' | 'prism' | 'mirror' | null

function _canvasTop() {
  var cv = document.getElementById('game-canvas');
  return cv ? cv.getBoundingClientRect().top : 52;
}

function _clientToCanvas(e) {
  return {
    x: e.clientX,
    y: e.clientY - _canvasTop()
  };
}

function _onPointerDown(e) {
  if (_activePointerId !== null) return;
  _activePointerId = e.pointerId;
  var pos = _clientToCanvas(e);
  var px = pos.x, py = pos.y;

  // Upgrade modal open — ignore canvas events
  if (!document.getElementById('upgrade-modal').classList.contains('hidden')) return;

  // Onboarding step 0 click-through
  if (G.onboarding === 0) {
    window.advanceOnboarding(1);
  }

  // Storm sparks (highest priority — they disappear fast)
  if (G.stormActive) {
    var spark = window.getSparkAtPoint(px, py);
    if (spark) { tapSpark(spark); e.preventDefault(); return; }
  }

  // Golem
  if (G.unlocks.spectralGolem) {
    var golem = window.getGolemAtPoint(px, py);
    if (golem) { tapGolem(); e.preventDefault(); return; }
  }

  // Mirrors
  if (G.unlocks.mirrorArray) {
    var mirror = window.getMirrorAtPoint(px, py);
    if (mirror) { startMirrorDrag(mirror, e); _dragMode = 'mirror'; e.preventDefault(); return; }
  }

  // Orbs
  var orb = window.getOrbAtPoint(px, py);
  if (orb) { startOrbDrag(orb, e); _dragMode = 'orb'; e.preventDefault(); return; }

  // Light nodes
  var node = window.getNodeAtPoint(px, py);
  if (node) { tapLightNode(node); e.preventDefault(); return; }

  // Gem mold
  if (window.pointInMold(px, py)) { tapMold(); e.preventDefault(); return; }

  // Prisms (hold to rotate color)
  var prism = window.getPrismAtPoint(px, py);
  if (prism) { startPrismHold(prism, e); _dragMode = 'prism'; e.preventDefault(); return; }
}

function _onPointerMove(e) {
  if (e.pointerId !== _activePointerId) return;
  if (_dragMode === 'orb') moveOrb(e);
  else if (_dragMode === 'prism') rotatePrism(e);
  else if (_dragMode === 'mirror') moveMirror(e);
}

function _onPointerUp(e) {
  if (e.pointerId !== _activePointerId) return;
  _activePointerId = null;
  if (_dragMode === 'orb') dropOrb(e);
  else if (_dragMode === 'prism') releasePrism();
  else if (_dragMode === 'mirror') releaseMirror();
  _dragMode = null;
}

// ======================================================
// PRESTIGE
// ======================================================
window.doPrestige = function() {
  G.vaultShards = (G.vaultShards || 0) + 1;
  G.prestigeCount = (G.prestigeCount || 0) + 1;

  // Reset
  G.light = 0;
  G.gems = 0;
  G.gemColors = { red:0, orange:0, yellow:0, green:0, blue:0, violet:0 };
  G.vatFill = [0, 0, 0];
  G.vaultCompletion = 0;
  G.voidConversions = 0;
  G.colorOrbs.forEach(function(o) { window.removeOrb && window.removeOrb(o); });
  G.colorOrbs = [];
  G.stormActive = false;
  G.stormSparks = [];
  window.clearAllSparks && window.clearAllSparks();

  window.recomputeMultipliers();
  window.updateHUD();
  window.renderUpgradeTree && window.renderUpgradeTree();
  window.saveGame();

  window.playPrestigeFlash(function() {
    // After flash — re-announce
  });
};

// ======================================================
// SAVE / LOAD
// ======================================================
var SAVE_KEY = 'prismforge_save';

window.getSaveState = function() {
  return {
    light: G.light,
    gems: G.gems,
    gemColors: G.gemColors,
    vaultShards: G.vaultShards,
    prestigeCount: G.prestigeCount,
    vaultCompletion: G.vaultCompletion,
    unlocks: G.unlocks,
    upgrades: G.upgrades,
    vatFill: G.vatFill,
    voidConversions: G.voidConversions,
    onboarding: G.onboarding,
    stormTimer: G.stormTimer
  };
};

window.loadSaveState = function(data) {
  if (!data) return;
  G.light          = data.light || 0;
  G.gems           = data.gems || 0;
  G.gemColors      = data.gemColors || { red:0, orange:0, yellow:0, green:0, blue:0, violet:0 };
  G.vaultShards    = data.vaultShards || 0;
  G.prestigeCount  = data.prestigeCount || 0;
  G.vaultCompletion= data.vaultCompletion || 0;
  G.unlocks        = data.unlocks || { mirrorArray:false, spectralGolem:false, stormCrystal:false, voidPrism:false };
  G.upgrades       = data.upgrades || {};
  G.vatFill        = data.vatFill || [0, 0, 0];
  G.voidConversions= data.voidConversions || 0;
  G.onboarding     = data.onboarding || 0;
  G.stormTimer     = data.stormTimer || 0;
};

window.saveGame = function() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(window.getSaveState()));
  } catch(e) {}
};

function _loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      window.loadSaveState(JSON.parse(raw));
      G.firstLoad = false;
    }
  } catch(e) {}
}

// ======================================================
// GAME LOOP
// ======================================================
var TICK_MS = 50;

window.gameTick = function() {
  if (G.paused) return;
  G.tick++;
  var dt = TICK_MS;

  // Passive light income
  G.light += G.lightPerSec * (dt / 1000);

  // Vault completion
  var gemsNeeded = 500 / G.vaultSpeedMult;
  G.vaultCompletion = Math.min(100, (G.gems / gemsNeeded) * 100);

  // Node respawn
  _tickNodes(dt);

  // Orb spawning
  _maybeSpawnOrb(dt);

  // Mold needle rotation
  G.moldPhase = (G.moldPhase + G.moldSpeed) % 360;

  // Storm
  _tickStorm(dt);

  // Golem respawn
  if (G.unlocks.spectralGolem) _tickGolemRespawn(dt);

  // Auto-save every 10s (200 ticks at 50ms)
  if (G.tick % 200 === 0) {
    window.saveGame();
    window.recomputeMultipliers(); // recompute periodically for passive income
  }

  // Canvas
  window.tickCanvas(dt);

  // HUD
  window.updateHUD();
};

// ======================================================
// INIT
// ======================================================
document.addEventListener('DOMContentLoaded', function() {
  _loadGame();

  window.initCanvas();

  // Apply saved unlocks
  Object.keys(G.unlocks).forEach(function(k) {
    if (G.unlocks[k]) window.applyUnlock(k);
  });

  // Restore vat display
  for (var i = 0; i < 3; i++) window.updateVatDisplay(i);

  window.recomputeMultipliers();
  window.updateHUD();
  window.checkOnboarding();

  // Wire canvas input
  var canvas = document.getElementById('game-canvas');
  canvas.addEventListener('pointerdown', _onPointerDown);
  canvas.addEventListener('pointermove', _onPointerMove);
  canvas.addEventListener('pointerup', _onPointerUp);
  canvas.addEventListener('pointercancel', _onPointerUp);

  // Start game loop
  setInterval(window.gameTick, TICK_MS);
});

// ======================================================
// GOD MODE — registered after debug.js loads
// ======================================================
document.addEventListener('DOMContentLoaded', function() {
  if (typeof registerDebugAction !== 'function') return;

  // currency
  registerDebugAction('+500 Light', function() { G.light += 500; updateHUD(); }, 'currency');
  registerDebugAction('+10k Light', function() { G.light += 10000; updateHUD(); }, 'currency');
  registerDebugAction('Max Light', function() { G.light += 1000000; updateHUD(); }, 'currency');
  registerDebugAction('+50 Gems', function() { G.gems += 50; G.gemColors.red += 50; updateHUD(); }, 'currency');
  registerDebugAction('+500 Gems', function() { G.gems += 500; G.gemColors.blue += 500; updateHUD(); }, 'currency');
  registerDebugAction('Fill All Vats', function() {
    G.vatFill = [3, 3, 3];
    window.forgeGem(0); window.forgeGem(1); window.forgeGem(2);
    updateHUD();
  }, 'currency');

  // mechanics
  registerDebugAction('Unlock Mirrors', function() {
    G.unlocks.mirrorArray = true; window.applyUnlock('mirrorArray');
  }, 'mechanics');
  registerDebugAction('Unlock Golem', function() {
    G.unlocks.spectralGolem = true; window.applyUnlock('spectralGolem');
  }, 'mechanics');
  registerDebugAction('Unlock Storm', function() {
    G.unlocks.stormCrystal = true; window.applyUnlock('stormCrystal');
  }, 'mechanics');
  registerDebugAction('Unlock Void', function() {
    G.unlocks.voidPrism = true; window.applyUnlock('voidPrism');
  }, 'mechanics');
  registerDebugAction('Unlock All', function() {
    Object.keys(G.unlocks).forEach(function(k) {
      G.unlocks[k] = true; window.applyUnlock(k);
    });
  }, 'mechanics');
  registerDebugAction('Trigger Storm', function() { window.startStorm(); }, 'mechanics');
  registerDebugAction('Spawn Golem', function() { window.spawnGolem(); }, 'mechanics');
  registerDebugAction('+5 Void Conv', function() {
    G.voidConversions += 5; window.checkVoidGem(); updateHUD();
  }, 'mechanics');

  // time
  registerDebugAction('Simulate 30s', function() {
    for (var i = 0; i < 600; i++) window.gameTick();
  }, 'time');
  registerDebugAction('Simulate 5min', function() {
    for (var i = 0; i < 6000; i++) window.gameTick();
  }, 'time');
  registerDebugAction('Pause/Resume', function() { G.paused = !G.paused; }, 'time');

  // prestige
  registerDebugAction('Vault to 100%', function() {
    G.gems = Math.max(G.gems, 500); G.vaultCompletion = 100; updateHUD();
  }, 'prestige');
  registerDebugAction('Prestige Now', function() { window.doPrestige(); }, 'prestige');
  registerDebugAction('+1 Vault Shard', function() { G.vaultShards++; updateHUD(); }, 'prestige');
  registerDebugAction('Unlock All Upgrades', function() {
    Object.keys(UPGRADES).forEach(function(id) {
      G.upgrades[id] = UPGRADES[id].maxLevel;
    });
    window.recomputeMultipliers();
    window.renderUpgradeTree();
    updateHUD();
  }, 'prestige');
});
