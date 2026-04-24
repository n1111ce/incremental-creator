// game.js — global state G, main loop, click handling, prestige logic

var G = makeDefaultG();

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------
function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

// ---------------------------------------------------------------------------
// Star spawning
// ---------------------------------------------------------------------------
function spawnStar() {
  var skyRect = skyCanvas.getBoundingClientRect();
  var skyW = skyRect.width;
  var skyH = skyRect.height;

  var idx = G.skyStars.length;
  var pos = starPosition(idx + G.totalStarsEver, skyW, skyH);
  var rng = mulberry32(idx * 1337 + G.totalStarsEver);
  var starData = {
    x: pos.x,
    y: pos.y,
    size: 5 + rng() * 4,
    phase: (rng() * 3).toFixed(2),
    speed: (2 + rng() * 2).toFixed(2),
    points: 5 + (idx % 5)
  };

  var worth = getStarWorth();
  G.stars += worth;
  G.totalStarsEver++;
  G.heat = 0;
  G.skyStars.push(starData);

  debugLog('star spawned #' + G.totalStarsEver + ' (+' + worth + ' Light)');

  // Fly animation then add to sky
  animateFlyingStar(pos.x, pos.y, function() {
    addSkyStarElement(starData, idx);
    checkConstellations();
    checkMilestoneToasts();
    updateSkyHue(G.skyHue);
  });

  spawnSparks(8);
  swingHammer();
}

// ---------------------------------------------------------------------------
// Constellation logic
// ---------------------------------------------------------------------------
function checkConstellations() {
  var stars = G.skyStars;
  var n = stars.length;
  if (n < 2) return;
  // Every 5 stars: connect newest to nearest existing
  if (n % 5 !== 0) return;

  var newest = stars[n - 1];
  var bestDist = Infinity, bestIdx = -1;
  for (var i = 0; i < n - 1; i++) {
    var dx = stars[i].x - newest.x;
    var dy = stars[i].y - newest.y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  }
  if (bestIdx < 0) return;

  var other = stars[bestIdx];
  G.constellationLines.push({ x1: newest.x, y1: newest.y, x2: other.x, y2: other.y });
  addConstellationLine(newest.x, newest.y, other.x, other.y);
  debugLog('constellation line drawn');
}

// ---------------------------------------------------------------------------
// Milestone toasts
// ---------------------------------------------------------------------------
function checkMilestoneToasts() {
  if (G.totalStarsEver === 1 && !G._firstStarToasted) {
    G._firstStarToasted = true;
    showToast('You forged the first light.');
  }
  if (G.totalStarsEver === 10 && !G._tenthStarToasted) {
    G._tenthStarToasted = true;
    showToast('The sky remembers.');
  }
  if (G.constellationLines.length === 1 && !G._firstConstellationToasted) {
    G._firstConstellationToasted = true;
    showToast('A constellation wakes.');
  }
}

// ---------------------------------------------------------------------------
// Anvil click
// ---------------------------------------------------------------------------
var _introEnded = false;

function onAnvilClick(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!_introEnded) {
    _introEnded = true;
    G._introSeen = true;
    dismissIntro();
    // Ember burst on first click
    spawnSparks(14);
    debugLog('intro dismissed');
  }

  var gained = getClickPower() * G.affinity;
  G.heat = Math.min(100, G.heat + gained);
  swingHammer();
  spawnSparks(4);
  updateEmber(G.heat);

  if (G.heat >= 100) {
    spawnStar();
    // First time heat hits 100 in this session: sky flash toast
    if (!G._firstSessionHeat100) {
      G._firstSessionHeat100 = true;
      flashSkyZone();
      showToast('A star!');
    }
  }
  updateHUD();
}

function flashSkyZone() {
  var sky = document.getElementById('sky-canvas');
  sky.style.transition = 'filter 0s';
  sky.style.filter = 'brightness(2) saturate(2)';
  setTimeout(function() {
    sky.style.transition = 'filter 0.6s';
    sky.style.filter = '';
  }, 50);
}

// ---------------------------------------------------------------------------
// Upgrade purchase
// ---------------------------------------------------------------------------
function buyUpgrade(upg) {
  if (G.upgrades[upg.id]) return;
  if (upg.cost > 0 && G.stars < upg.cost) { showToast('Not enough Light'); return; }
  if (upg.requires_total && G.totalStarsEver < upg.requires_total) {
    showToast('Need ' + upg.requires_total + ' total stars first');
    return;
  }
  G.stars -= upg.cost;
  G.upgrades[upg.id] = true;
  debugLog('bought: ' + upg.id);
  flashNode(upg.id);
  showToast(upg.name + ' unlocked.');
  renderDrawer();
  updateHUD();
}

// ---------------------------------------------------------------------------
// Prestige
// ---------------------------------------------------------------------------
function doPrestige() {
  var gain = Math.sqrt(G.totalStarsEver / 5000);
  G.affinity += gain;
  G.supernovaCount++;

  // Reset
  G.stars = 0;
  G.heat = 0;
  G.upgrades = {};
  G.skyStars = [];
  G.constellationLines = [];
  G._firstStarToasted = false;
  G._tenthStarToasted = false;
  G._firstConstellationToasted = false;
  G._firstSessionHeat100 = false;
  G.skyHue = 250;

  // Visual reset
  starLayer.innerHTML = '';
  constellationLayer.innerHTML = '';

  moodFlash();
  showToast('Supernova. The cycle begins again.');
  debugLog('supernova #' + G.supernovaCount + ' affinity now ' + G.affinity.toFixed(2));

  renderDrawer();
  updateHUD();
  saveGame();
}

// ---------------------------------------------------------------------------
// Sky hue drift every 10 total stars
// ---------------------------------------------------------------------------
var _lastSkyDriftAt = 0;

function checkSkyDrift() {
  var threshold = Math.floor(G.totalStarsEver / 10);
  if (threshold > _lastSkyDriftAt) {
    _lastSkyDriftAt = threshold;
    G.skyHue += (Math.random() < 0.5 ? 5 : -5);
    G.skyHue = Math.max(200, Math.min(300, G.skyHue));
    updateSkyHue(G.skyHue);
  }
}

// ---------------------------------------------------------------------------
// Tick loop (~10x/sec)
// ---------------------------------------------------------------------------
var _lastTick = Date.now();
var _lastSave = Date.now();
var _lastDrawerRefresh = Date.now();

function tick() {
  var now = Date.now();
  var dt = Math.min((now - _lastTick) / 1000, 0.2);
  _lastTick = now;

  // Auto heat
  var auto = getAutoHeat();
  if (auto > 0) {
    G.heat = Math.min(100, G.heat + auto * dt);
    if (G.heat >= 100) {
      spawnStar();
      if (!G._firstSessionHeat100) {
        G._firstSessionHeat100 = true;
        flashSkyZone();
        showToast('A star!');
      }
    }
  }

  // Heat decay
  if (G.heat > 0) {
    G.heat = Math.max(0, G.heat - getDecayRate() * dt);
  }

  updateEmber(G.heat);
  updateHUD();
  checkSkyDrift();

  // Autosave every 5s
  if (now - _lastSave > 5000) {
    saveGame();
    _lastSave = now;
  }

  // Sync open drawer every 2s
  if (_drawerOpen && now - _lastDrawerRefresh > 2000) {
    renderDrawer();
    _lastDrawerRefresh = now;
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  G = makeDefaultG();
  loadGame();
  initCanvas();
  initUI();

  // Wire anvil click — POINTER EVENTS ONLY
  document.getElementById('anvil-hit').addEventListener('pointerdown', onAnvilClick);

  // Restore visual state
  rebuildAllStars();
  rebuildAllConstellationLines();
  updateSkyHue(G.skyHue);
  updateEmber(G.heat);
  updateHUD();

  // Intro
  if (!G._introSeen && !hasSave()) {
    runIntro(function() {
      // After intro, next anvil click is the first click — handled in onAnvilClick
    });
  } else {
    _introEnded = true;
    document.getElementById('intro-overlay').style.display = 'none';
  }

  // Autosave on tab hide
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) saveGame();
  });

  setInterval(tick, 100);

  debugLog('starforge init — totalStarsEver:' + G.totalStarsEver);
}

document.addEventListener('DOMContentLoaded', init);
