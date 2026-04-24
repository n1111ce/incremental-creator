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
function spawnStar(whichAnvil) {
  var skyRect = skyCanvas.getBoundingClientRect();
  var skyW = skyRect.width;
  var skyH = skyRect.height;

  var idx = G.skyStars.length;
  var pos = starPosition(idx + G.totalStarsEver, skyW, skyH);
  var rng = mulberry32(idx * 1337 + G.totalStarsEver);
  var starData = {
    x: pos.x, y: pos.y,
    size: 5 + rng() * 4,
    phase: (rng() * 3).toFixed(2),
    speed: (2 + rng() * 2).toFixed(2),
    points: 5 + (idx % 5)
  };

  var worth = getEffectiveLightPerStar();
  G.stars += worth;
  G.totalStarsEver++;
  G.cometStarProgress = (G.cometStarProgress || 0) + 1;

  if (whichAnvil === 2) G.twinHeat = 0;
  else G.heat = 0;

  G.skyStars.push(starData);

  debugLog('star spawned #' + G.totalStarsEver + ' (+' + worth.toFixed(1) + ' Light)');

  animateFlyingStar(pos.x, pos.y, function() {
    addSkyStarElement(starData, idx);
    checkConstellations();
    checkCometTrigger();
    checkMilestoneToasts();
    updateSkyHue(G.skyHue);
  }, whichAnvil);

  spawnSparks(8, whichAnvil);
  swingHammer(whichAnvil);
}

// ---------------------------------------------------------------------------
// Constellation logic
// ---------------------------------------------------------------------------
function checkConstellations() {
  var stars = G.skyStars;
  var n = stars.length;
  if (n < 2) return;
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

  // Constellation Power (M4) — increment on each group
  if (G.upgrades['M4']) {
    G.constellationsCompleted = (G.constellationsCompleted || 0) + 1;
    showToast('Constellation! Bonus ×' + getConstellationMult().toFixed(2));
  }

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

function onAnvilClick(e, whichAnvil) {
  e.preventDefault();
  e.stopPropagation();
  whichAnvil = whichAnvil || 1;

  if (!_introEnded) {
    _introEnded = true;
    G._introSeen = true;
    dismissIntro();
    spawnSparks(14, 1);
    debugLog('intro dismissed');
  }

  // Combo tracking (F4)
  var now = Date.now();
  if (G.upgrades['F4']) {
    var window_ = getComboWindow() * 1000; // ms
    if (G.comboLastStrike && (now - G.comboLastStrike) < window_) {
      G.comboCount = Math.min(5, (G.comboCount || 0) + 1);
    } else {
      G.comboCount = 1;
    }
    G.comboLastStrike = now;
    // Show combo UI near anvil
    var hitEl = (whichAnvil === 2 && anvilHit2) ? anvilHit2 : anvilHit;
    var rect = hitEl.closest('svg').getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height * 0.4;
    showComboUI(G.comboCount, cx, cy);
  }

  var heatGained = getClickPower() * getComboMult() * G.affinity;

  if (whichAnvil === 2) {
    G.twinHeat = Math.min(100, (G.twinHeat || 0) + heatGained);
    swingHammer(2);
    spawnSparks(4, 2);
    updateEmber2(G.twinHeat);
    if (G.twinHeat >= 100) {
      spawnStar(2);
      if (!G._firstSessionHeat100) { G._firstSessionHeat100 = true; flashSkyZone(); showToast('A star!'); }
    }
  } else {
    G.heat = Math.min(100, G.heat + heatGained);
    swingHammer(1);
    spawnSparks(4, 1);
    updateEmber(G.heat);
    if (G.heat >= 100) {
      spawnStar(1);
      if (!G._firstSessionHeat100) { G._firstSessionHeat100 = true; flashSkyZone(); showToast('A star!'); }
    }
  }

  // Strike chain (F8)
  if (G.upgrades['F8']) {
    G.strikesSinceChain = (G.strikesSinceChain || 0) + 1;
    if (G.strikesSinceChain >= 10) {
      G.strikesSinceChain = 0;
      fireChainLightning();
    }
  }

  updateHUD();
}

// ---------------------------------------------------------------------------
// Upgrade purchase
// ---------------------------------------------------------------------------
function buyUpgrade(upg) {
  if (G.upgrades[upg.id]) return;
  if (!isParentOwned(upg)) { showToast('Requires ' + upg.parent); return; }
  if (upg.cost > 0 && G.stars < upg.cost) { showToast('Not enough Light'); return; }
  if (upg.requiresTotal && G.totalStarsEver < upg.requiresTotal) {
    showToast('Need ' + upg.requiresTotal + ' total stars first');
    return;
  }
  G.stars -= upg.cost;
  G.upgrades[upg.id] = true;
  debugLog('bought: ' + upg.id);
  applyUpgradeEffect(upg);
  flashNodeModal(upg.id);
  showToast(upg.name + ' unlocked.');
  renderSkillModal();
  updateHUD();
}

function applyUpgradeEffect(upg) {
  var eff = upg.effect;
  if (!eff) return;
  if (eff.type === 'skyCapacity') {
    G.skyCapacity = (G.skyCapacity || 60) + eff.value;
  }
  if (eff.type === 'unlock_twin_anvil') {
    buildTwinAnvil();
  }
  if (eff.type === 'unlock_moon_phase') {
    buildMoon();
  }
}

// ---------------------------------------------------------------------------
// Prestige
// ---------------------------------------------------------------------------
function doPrestige() {
  var gain = Math.sqrt(G.totalStarsEver / 5000);
  G.affinity += gain;
  G.supernovaCount++;

  G.stars = 0;
  G.heat = 0;
  G.twinHeat = 0;
  G.upgrades = {};
  G.skyStars = [];
  G.constellationLines = [];
  G.comboCount = 0; G.comboLastStrike = 0;
  G.strikesSinceChain = 0;
  G.shootingStarNextAt = 0;
  G.moonPhaseTime = 0;
  G.nebulaDriftNextAt = 0;
  G.constellationsCompleted = 0;
  G.cometStarProgress = 0;
  G.cometActive = false;
  G._firstStarToasted = false;
  G._tenthStarToasted = false;
  G._firstConstellationToasted = false;
  G._firstSessionHeat100 = false;
  G.skyHue = 250;

  starLayer.innerHTML = '';
  constellationLayer.innerHTML = '';

  moodFlash();
  showToast('Supernova. The cycle begins again.');
  debugLog('supernova #' + G.supernovaCount + ' affinity now ' + G.affinity.toFixed(2));

  renderSkillModal();
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
var _lastModalRefresh = Date.now();

var _dbgTimePaused = false;

function tick() {
  if (_dbgTimePaused) return;
  var now = Date.now();
  var dt = Math.min((now - _lastTick) / 1000, 0.2);
  _lastTick = now;

  // Auto heat (primary anvil)
  var auto = getAutoHeat();
  if (auto > 0) {
    G.heat = Math.min(100, G.heat + auto * dt);
    if (G.heat >= 100) {
      spawnStar(1);
      if (!G._firstSessionHeat100) { G._firstSessionHeat100 = true; flashSkyZone(); showToast('A star!'); }
    }
    // Twin anvil also gets auto heat if built
    if (G.upgrades['F6']) {
      G.twinHeat = Math.min(100, (G.twinHeat || 0) + auto * dt);
      if (G.twinHeat >= 100) {
        spawnStar(2);
      }
      updateEmber2(G.twinHeat);
      var fill2 = document.getElementById('heat-bar-fill-2');
      if (fill2) fill2.style.width = Math.min(100, G.twinHeat) + '%';
    }
  }

  // Heat decay
  if (G.heat > 0) G.heat = Math.max(0, G.heat - getDecayRate() * dt);
  if (G.upgrades['F6'] && G.twinHeat > 0) G.twinHeat = Math.max(0, G.twinHeat - getDecayRate() * dt);

  updateEmber(G.heat);
  updateHUD();
  checkSkyDrift();

  // Moon phase update (S6)
  if (G.upgrades['S6']) {
    G.moonPhaseTime = (G.moonPhaseTime || 0) + dt;
    updateMoonPhase(G.moonPhaseTime);
  }

  // Shooting star scheduling (S4)
  if (G.upgrades['S4']) {
    if (!G.shootingStarNextAt || G.shootingStarNextAt === 0) {
      G.shootingStarNextAt = now + (15000 + Math.random() * 15000);
    }
    if (now >= G.shootingStarNextAt) {
      spawnShootingStar();
      var interval = G.upgrades['S5'] ? 7500 + Math.random() * 7500 : 15000 + Math.random() * 15000;
      G.shootingStarNextAt = now + interval;
    }
  }

  // Nebula drift (S8)
  if (G.upgrades['S8']) {
    if (!G.nebulaDriftNextAt || G.nebulaDriftNextAt === 0) {
      G.nebulaDriftNextAt = now + 30000;
    }
    if (now >= G.nebulaDriftNextAt) {
      spawnNebulaStar();
      G.nebulaDriftNextAt = now + 30000;
    }
  }

  // Autosave every 5s
  if (now - _lastSave > 5000) {
    saveGame();
    _lastSave = now;
  }

  // Sync open modal every 2s
  if (_modalOpen && now - _lastModalRefresh > 2000) {
    renderSkillModal();
    _lastModalRefresh = now;
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

  document.getElementById('anvil-hit').addEventListener('pointerdown', function(e) {
    onAnvilClick(e, 1);
  });

  // Rebuild visual state from save
  rebuildAllStars();
  rebuildAllConstellationLines();
  updateSkyHue(G.skyHue);
  updateEmber(G.heat);
  updateHUD();

  // Restore mechanics from save
  if (G.upgrades['F6']) {
    buildTwinAnvil();
    setTimeout(function() { updateEmber2(G.twinHeat || 0); }, 100);
  }
  if (G.upgrades['S6']) {
    buildMoon();
    updateMoonPhase(G.moonPhaseTime || 0);
  }

  // Intro
  if (!G._introSeen && !hasSave()) {
    runIntro(function() {});
  } else {
    _introEnded = true;
    document.getElementById('intro-overlay').style.display = 'none';
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) saveGame();
  });

  setInterval(tick, 100);

  debugLog('starforge v2 init — totalStarsEver:' + G.totalStarsEver);
}

document.addEventListener('DOMContentLoaded', init);

// ---------------------------------------------------------------------------
// God Mode — debug action registrations
// Deferred so debug.js (loaded after game.js) has already run and
// registerDebugAction is available on the global scope.
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', function() {
  if (typeof registerDebugAction !== 'function') return;

  // ---- currency ----
  registerDebugAction('+1k Light', function() {
    G.stars += 1000;
    updateHUD(); saveGame();
  }, 'currency');

  registerDebugAction('+100k Light', function() {
    G.stars += 100000;
    updateHUD(); saveGame();
  }, 'currency');

  registerDebugAction('+10M Light', function() {
    G.stars += 10000000;
    updateHUD(); saveGame();
  }, 'currency');

  registerDebugAction('Max Light (1e12)', function() {
    G.stars = 1e12;
    updateHUD(); saveGame();
  }, 'currency');

  // ---- skills ----
  registerDebugAction('Unlock All Skills', function() {
    for (var i = 0; i < UPGRADES.length; i++) {
      G.upgrades[UPGRADES[i].id] = true;
    }
    // Apply side-effects that applyUpgradeEffect normally handles
    G.skyCapacity = 60 + 20; // S2 adds 20
    if (!_twinAnvilBuilt) buildTwinAnvil();
    if (!_moonBuilt) buildMoon();
    renderSkillModal(); updateHUD(); saveGame();
  }, 'skills');

  registerDebugAction('Unlock Flame Branch', function() {
    var flame = ['F1','F2','F3','F4','F5','F6','F7','F8'];
    for (var i = 0; i < flame.length; i++) G.upgrades[flame[i]] = true;
    if (!_twinAnvilBuilt) buildTwinAnvil();
    renderSkillModal(); updateHUD(); saveGame();
  }, 'skills');

  registerDebugAction('Unlock Sky Branch', function() {
    var sky = ['S1','S2','S3','S4','S5','S6','S7','S8'];
    for (var i = 0; i < sky.length; i++) G.upgrades[sky[i]] = true;
    G.skyCapacity = 60 + 20;
    if (!_moonBuilt) buildMoon();
    renderSkillModal(); updateHUD(); saveGame();
  }, 'skills');

  registerDebugAction('Unlock Myth Branch', function() {
    var myth = ['M1','M2','M3','M4','M5','M6','M7'];
    for (var i = 0; i < myth.length; i++) G.upgrades[myth[i]] = true;
    renderSkillModal(); updateHUD(); saveGame();
  }, 'skills');

  registerDebugAction('Refund All Skills', function() {
    G.upgrades = {};
    renderSkillModal(); updateHUD(); saveGame();
  }, 'skills');

  // ---- mechanics ----
  registerDebugAction('Spawn Shooting Star', function() {
    // Bypass the S4 gate check inside spawnShootingStar by temporarily granting S4
    var had = G.upgrades['S4'];
    G.upgrades['S4'] = true;
    ensureShootingStarGradient();
    spawnShootingStar();
    if (!had) G.upgrades['S4'] = had;
  }, 'mechanics');

  registerDebugAction('Spawn Comet', function() {
    _cometAlive = false; // reset if one is stuck
    spawnComet();
  }, 'mechanics');

  registerDebugAction('Fire Chain Lightning', function() {
    fireChainLightning();
    saveGame();
  }, 'mechanics');

  registerDebugAction('Force Full Moon (15s)', function() {
    var had = G.upgrades['S6'];
    G.upgrades['S6'] = true;
    if (!_moonBuilt) buildMoon();
    // Set phase to 62s — solidly inside the [60,75) full moon window
    G.moonPhaseTime = 62;
    updateMoonPhase(G.moonPhaseTime);
    if (!had) G.upgrades['S6'] = had;
    updateHUD(); saveGame();
  }, 'mechanics');

  registerDebugAction('Fill Heat (both anvils)', function() {
    G.heat = 100;
    G.twinHeat = 100;
    updateEmber(G.heat);
    if (typeof updateEmber2 === 'function') updateEmber2(G.twinHeat);
    updateHUD(); saveGame();
  }, 'mechanics');

  registerDebugAction('Spawn 10 Stars', function() {
    for (var i = 0; i < 10; i++) {
      var skyRect = skyCanvas.getBoundingClientRect();
      var idx = G.skyStars.length;
      var pos = starPosition(idx + G.totalStarsEver, skyRect.width, skyRect.height);
      var rng = mulberry32(idx * 1337 + G.totalStarsEver);
      var sd = { x:pos.x, y:pos.y, size:5+rng()*4,
        phase:(rng()*3).toFixed(2), speed:(2+rng()*2).toFixed(2),
        points:5+(idx%5) };
      var worth = getEffectiveLightPerStar();
      G.stars += worth;
      G.totalStarsEver++;
      G.cometStarProgress = (G.cometStarProgress||0)+1;
      G.skyStars.push(sd);
      addSkyStarElement(sd, idx);
    }
    checkConstellations();
    updateHUD(); saveGame();
  }, 'mechanics');

  registerDebugAction('Spawn 100 Stars', function() {
    for (var i = 0; i < 100; i++) {
      var skyRect = skyCanvas.getBoundingClientRect();
      var idx = G.skyStars.length;
      var pos = starPosition(idx + G.totalStarsEver, skyRect.width, skyRect.height);
      var rng = mulberry32(idx * 1337 + G.totalStarsEver);
      var sd = { x:pos.x, y:pos.y, size:5+rng()*4,
        phase:(rng()*3).toFixed(2), speed:(2+rng()*2).toFixed(2),
        points:5+(idx%5) };
      var worth = getEffectiveLightPerStar();
      G.stars += worth;
      G.totalStarsEver++;
      G.cometStarProgress = (G.cometStarProgress||0)+1;
      G.skyStars.push(sd);
      addSkyStarElement(sd, idx);
    }
    checkConstellations();
    updateHUD(); saveGame();
  }, 'mechanics');

  registerDebugAction('Complete 5 Constellations', function() {
    var had = G.upgrades['M4'];
    G.upgrades['M4'] = true;
    G.constellationsCompleted = (G.constellationsCompleted || 0) + 5;
    if (!had) G.upgrades['M4'] = had;
    updateHUD(); saveGame();
  }, 'mechanics');

  // ---- time ----
  registerDebugAction('Pause / Resume Time', function() {
    _dbgTimePaused = !_dbgTimePaused;
    debugLog('time ' + (_dbgTimePaused ? 'paused' : 'resumed'));
  }, 'time');

  function _simTicks(n) {
    var wasPaused = _dbgTimePaused;
    _dbgTimePaused = false;
    for (var i = 0; i < n; i++) {
      _lastTick = Date.now() - 1000; // forces dt=1s on next tick call
      tick();
    }
    _dbgTimePaused = wasPaused;
    updateHUD(); saveGame();
  }

  registerDebugAction('Simulate 30s', function() {
    _simTicks(30);
  }, 'time');

  registerDebugAction('Simulate 5 min', function() {
    _simTicks(300);
  }, 'time');

  // ---- prestige ----
  registerDebugAction('Make Prestige Available', function() {
    if (G.totalStarsEver < 5000) G.totalStarsEver = 5000;
    G.upgrades['M6'] = true; // parent of M7
    G.upgrades['M7'] = true; // Supernova node — enables canPrestige()
    updateHUD(); saveGame();
  }, 'prestige');

  registerDebugAction('Trigger Prestige Now', function() {
    doPrestige();
  }, 'prestige');

  registerDebugAction('+1 Affinity', function() {
    G.affinity += 1;
    updateHUD(); saveGame();
  }, 'prestige');
});
