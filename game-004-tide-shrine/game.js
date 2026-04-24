// game.js — state machine, save/load, tick loop, pull handler, skill purchases

// ---------------------------------------------------------------------------
// Global state — initialize immediately so canvas.js / ui.js guards work
// ---------------------------------------------------------------------------
var G = makeDefaultG();

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', function() {
  loadGame();
  buildScene();
  initShellPositions();
  syncShellsOnSand(G.shellsOnSand);
  initUI();

  // Rope pointerdown — main click target
  document.getElementById('rope-group').addEventListener('pointerdown', onRopeClick);
  document.getElementById('shrine2-rope-group').addEventListener('pointerdown', onShrine2RopeClick);

  startIntro();
  updateHUD();

  // Rebuild any features that were active on save
  rebuildUnlockedFeatures();

  // Start tick loop
  requestAnimationFrame(tick);

  // Auto-save every 15s
  setInterval(saveGame, 15000);
});

// ---------------------------------------------------------------------------
// Main tick loop
// ---------------------------------------------------------------------------
var lastTime = null;
var seagullTimer = 0;

function tick(now) {
  if (lastTime === null) lastTime = now;
  var dt = Math.min((now - lastTime) / 1000, 0.2); // cap dt at 200ms
  lastTime = now;

  if (G.introComplete) {
    updateGameLogic(dt);
  }

  updateAnimations(dt);
  updateHUD();
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Game logic tick (runs only after intro is done)
// ---------------------------------------------------------------------------
function updateGameLogic(dt) {
  G.sessionTime += dt;

  // Ambient shells per second
  var ambient = calcAmbientPerSec();
  if (ambient > 0) {
    addShells(ambient * dt);
  }

  // Auto-puller
  if (G.autoPullerActive) {
    G.lastPullTime = (G.lastPullTime || 0) + dt;
    if (G.lastPullTime >= BALANCE.AUTO_PULLER_INTERVAL) {
      G.lastPullTime = 0;
      executePull(false, 1);
    }
  }

  // Moon phase cycle
  if (G.moonPhasesActive) {
    G.moonCycleTimer += dt;
    if (G.moonCycleTimer >= BALANCE.MOON_CYCLE_DURATION) {
      G.moonCycleTimer = 0;
      G.moonPhase = (G.moonPhase + 1) % 4;
      debugLog('moon phase: ' + MOON_PHASES[G.moonPhase].label);
      updateMoon(G.moonPhase, G.moonCycleTimer);
      if (G.moonPhase === 3) {
        // Full moon!
        G.fullMoonTimer = BALANCE.FULL_MOON_DURATION;
        showToast('🌕 Full Moon! 3× shells for ' + BALANCE.FULL_MOON_DURATION + 's!');
        flashScreen('rgba(240,240,180,0.25)', 1500);
        debugLog('full moon activated');
      }
    }

    if (G.fullMoonTimer > 0) {
      G.fullMoonTimer = Math.max(0, G.fullMoonTimer - dt);
    }

    updateMoon(G.moonPhase, G.moonCycleTimer);
  }

  // Pearl diver timer
  if (G.pearlDiverActive) {
    if (!G.diverVisible) {
      G.diverTimer -= dt;
      if (G.diverTimer <= 0) {
        spawnDiver();
      }
    }
  }

  // Second shrine auto-pull
  if (G.secondShrineActive) {
    G.shrine2Timer -= dt;
    if (G.shrine2Timer <= 0) {
      G.shrine2Timer = BALANCE.SHRINE2_PULL_RATE;
      executePull(false, 2);
      triggerBellSwing(2);
      updateShrine2Rope(-4);
      setTimeout(function() { updateShrine2Rope(0); }, 300);
    }
  }

  // Lighthouse boost timer
  if (G.lighthouseActive && G.lighthouseBoostTimer > 0) {
    G.lighthouseBoostTimer = Math.max(0, G.lighthouseBoostTimer - dt);
    if (G.lighthouseBoostTimer === 0) {
      showToast('Beacon fades...');
      debugLog('lighthouse boost ended');
    }
  }

  // Sky color drift
  updateSkyColors(G.sessionTime);

  // Seagull spawning
  seagullTimer -= dt;
  if (seagullTimer <= 0) {
    seagullTimer = BALANCE.SEAGULL_INTERVAL + Math.random() * 10;
    spawnSeagull();
  }
}

// ---------------------------------------------------------------------------
// Animation tick (runs always, including during intro)
// ---------------------------------------------------------------------------
function updateAnimations(dt) {
  // Wave decay
  if (waveProgress > 0) {
    waveProgress = Math.max(0, waveProgress - dt * 1.8);
    updateWavePaths(waveProgress);
  }

  // Bell physics
  updateBells(dt);

  // Rope gentle idle sway
  var sway = Math.sin(Date.now() / 2200) * 2;
  updateRopePaths(sway);

  // Lighthouse light pulse when active
  if (G && G.lighthouseActive) {
    var lhLight = document.getElementById('lh-light');
    if (lhLight && G.lighthouseBoostTimer > 0) {
      var pulse = 0.4 + Math.sin(Date.now() / 100) * 0.3;
      lhLight.setAttribute('opacity', pulse.toFixed(2));
    }
  }
}

// ---------------------------------------------------------------------------
// Pull logic
// ---------------------------------------------------------------------------
function onRopeClick(e) {
  e.preventDefault();

  // During intro: clicking the rope before arrow shows does nothing
  if (!G.introComplete && introPhase < 2) return;

  // First real rope pull: end intro, then fall through to execute the pull
  if (!G.introComplete && introPhase >= 2) {
    endIntro();
    // introComplete is now true — fall through to execute pull below
  }

  var rect = document.getElementById('main-canvas').getBoundingClientRect();
  var cx = e.clientX - rect.left;
  var cy = e.clientY - rect.top;

  executePull(true, 1);
  triggerBellSwing(1);
  triggerWave();
  spawnWaveParticles();

  // Popup at click position, clamped to canvas
  var popX = cx || ROPE_X;
  var popY = cy || ROPE_BOT_Y - 20;
  var yield_ = calcPullYield();
  spawnShellPopup(popX, popY - 30, yield_, false);

  // Hide rope arrow after first pull
  if (!G.firstPullDone) {
    G.firstPullDone = true;
    hideRopeArrow();
    debugLog('first pull done');
  }

  // Pulse skills button after 3 pulls
  if (G.totalPulls === 3) {
    pulseSkillsButton();
  }
}

function onShrine2RopeClick(e) {
  e.preventDefault();
  if (!G.secondShrineActive) return;
  executePull(true, 2);
  triggerBellSwing(2);
  triggerWave();
  spawnWaveParticles();
  var rect = document.getElementById('main-canvas').getBoundingClientRect();
  var cx = e.clientX - rect.left;
  var cy = e.clientY - rect.top;
  spawnShellPopup(cx || SHRINE2_CX, cy || ROPE_BOT_Y - 20, calcPullYield(), false);
}

function executePull(isPlayerClick, shrine) {
  var yield_ = calcPullYield();

  // Check drop chance for bonus
  if (Math.random() * 100 < G.dropChancePct) {
    yield_ *= 2;
  }

  addShells(yield_);
  G.totalPulls++;

  // Shell accumulates on beach visually
  G.shellsOnSand = Math.min(G.shellsOnSand + 1, BALANCE.SHELL_PILE_CAP);
  syncShellsOnSand(G.shellsOnSand);

  // Lighthouse combo
  if (G.lighthouseActive && isPlayerClick) {
    G.comboCharge++;
    if (G.comboCharge >= BALANCE.LIGHTHOUSE_COMBO_MAX) {
      G.comboCharge = 0;
      triggerLighthouseBeamBoost();
    }
  }

  debugLog('pull #' + G.totalPulls + ' (' + shrine + ') +' + yield_.toFixed(1) + ' shells');
}

function calcPullYield() {
  var base = G.shellsPerPull;
  var mult = G.multiplierFloor;

  // Full moon bonus
  if (G.moonPhasesActive && G.fullMoonTimer > 0) {
    mult *= BALANCE.FULL_MOON_MULTIPLIER;
  }

  // Lighthouse boost
  if (G.lighthouseActive && G.lighthouseBoostTimer > 0) {
    mult *= BALANCE.LIGHTHOUSE_BOOST_MULT;
  }

  // Wave size multiplier
  mult *= G.waveSizeMult;

  return Math.max(1, base * mult);
}

function calcAmbientPerSec() {
  if (G.ambientPct <= 0) return 0;
  // Ambient = percentage of current shells/second yield
  return G.shellsPerPull * (G.ambientPct / 100) * G.multiplierFloor * G.waveSizeMult;
}

function addShells(amount) {
  G.shells += amount;
  G.totalShellsEver += amount;
}

// ---------------------------------------------------------------------------
// Skill purchase
// ---------------------------------------------------------------------------
function tryPurchaseSkill(id) {
  var node = SKILL_BY_ID[id];
  if (!node) return;
  if (G.ownedSkills.indexOf(id) >= 0) return;
  if (!isUnlocked(node)) {
    showToast('Unlock the previous tier first.');
    return;
  }
  if (G.shells < node.cost) {
    showToast('Need ' + fmt(node.cost) + ' 🐚 (have ' + fmt(G.shells) + ')');
    return;
  }

  G.shells -= node.cost;
  G.ownedSkills.push(id);
  recalcDerived();
  activateSkillEffect(node);

  showToast('Unlocked: ' + node.label + '!');
  debugLog('skill purchased: ' + id);
  flashScreen('rgba(100,220,180,0.2)', 400);

  // Refresh tree
  renderSkillTree();
  updateHUD();
  saveGame();
}

function activateSkillEffect(node) {
  var e = node.effect;

  if (e.unlockAutoPuller) {
    G.autoPullerActive = true;
    G.lastPullTime = 0;
    showToast('Auto-Puller active! Pulling every ' + BALANCE.AUTO_PULLER_INTERVAL + 's');
    debugLog('auto-puller unlocked');
  }

  if (e.unlockMoonPhases) {
    G.moonPhasesActive = true;
    G.moonPhase = 0;
    G.moonCycleTimer = 0;
    G.fullMoonTimer = 0;
    document.getElementById('moon-phase-hud').style.display = '';
    showToast('Moon Phases active! Watch the sky...');
    debugLog('moon phases unlocked');
  }

  if (e.unlockPearlDiver) {
    G.pearlDiverActive = true;
    G.diverTimer = BALANCE.DIVER_MIN_INTERVAL;
    G.diverVisible = false;
    document.getElementById('pearls-row').style.display = '';
    showToast('Pearl Diver awakens! Watch the sea for a swimmer...');
    debugLog('pearl diver unlocked');
  }

  if (e.unlockSecondShrine) {
    G.secondShrineActive = true;
    G.shrine2Timer = BALANCE.SHRINE2_PULL_RATE;
    // Build shrine2 after layout settled
    void document.getElementById('main-canvas').offsetWidth;
    positionSecondShrine();
    document.getElementById('shrine2-group').style.display = '';
    showToast('Second Shrine rises from the east!');
    debugLog('second shrine unlocked');
  }

  if (e.unlockLighthouse) {
    G.lighthouseActive = true;
    G.comboCharge = 0;
    G.lighthouseBoostTimer = 0;
    void document.getElementById('main-canvas').offsetWidth;
    positionLighthouse();
    document.getElementById('lighthouse-group').style.display = '';
    document.getElementById('combo-wrap').style.display = '';
    showToast('Lighthouse built! Click ' + BALANCE.LIGHTHOUSE_COMBO_MAX + 'x to charge the beam!');
    debugLog('lighthouse unlocked');
  }
}

function recalcDerived() {
  // Reset to base
  G.shellsPerPull = BALANCE.BASE_SHELLS_PER_PULL;
  G.ambientPct = 0;
  G.dropChancePct = 0;
  G.waveSizeMult = 1.0;
  G.multiplierFloor = 1.0;

  G.ownedSkills.forEach(function(id) {
    var node = SKILL_BY_ID[id];
    if (!node) return;
    var e = node.effect;

    if (e.shellsPerPull)    G.shellsPerPull += e.shellsPerPull;
    if (e.ambientPct)       G.ambientPct += e.ambientPct;
    if (e.dropChancePct)    G.dropChancePct += e.dropChancePct;
    if (e.waveSize)         G.waveSizeMult = Math.max(G.waveSizeMult, e.waveSize);
    if (e.multiplierFloor)  G.multiplierFloor = Math.max(G.multiplierFloor, e.multiplierFloor);
  });
}

function rebuildUnlockedFeatures() {
  // Re-apply visual state for features active at load time

  if (G.autoPullerActive) {
    // Nothing visual, just ensure timer is reset if needed
    G.lastPullTime = G.lastPullTime || 0;
  }

  if (G.moonPhasesActive) {
    document.getElementById('moon-phase-hud').style.display = '';
    updateMoon(G.moonPhase, G.moonCycleTimer);
  }

  if (G.pearlDiverActive) {
    document.getElementById('pearls-row').style.display = '';
    if (!G.diverTimer || G.diverTimer <= 0) {
      G.diverTimer = BALANCE.DIVER_MIN_INTERVAL;
    }
  }

  if (G.secondShrineActive) {
    void document.getElementById('main-canvas').offsetWidth;
    positionSecondShrine();
    document.getElementById('shrine2-group').style.display = '';
  }

  if (G.lighthouseActive) {
    void document.getElementById('main-canvas').offsetWidth;
    positionLighthouse();
    document.getElementById('lighthouse-group').style.display = '';
    document.getElementById('combo-wrap').style.display = '';
  }

  syncShellsOnSand(G.shellsOnSand);
}

// ---------------------------------------------------------------------------
// Pearl Diver
// ---------------------------------------------------------------------------
function spawnDiver() {
  G.diverVisible = true;
  G.diverTimer = BALANCE.DIVER_MIN_INTERVAL +
    Math.random() * (BALANCE.DIVER_MAX_INTERVAL - BALANCE.DIVER_MIN_INTERVAL);
  showDiver();
  debugLog('pearl diver appeared');
}

function onDiverClick(e) {
  if (!G.diverVisible) return;
  G.diverVisible = false;
  hideDiver();

  var shellBonus = BALANCE.DIVER_SHELL_BONUS * G.multiplierFloor;
  addShells(shellBonus);

  // Rare pearl chance (~20%)
  if (Math.random() < 0.20) {
    G.pearls++;
    showToast('🔮 Rare pearl found! (' + G.pearls + ' total)', true);
    spawnShellPopup(SHRINE_CX, SEA_TOP + SEA_H * 0.5, 0, true);
    debugLog('pearl found! total: ' + G.pearls);
  } else {
    showToast('Shell haul! +' + fmt(shellBonus) + ' 🐚');
    spawnShellPopup(SHRINE_CX, SEA_TOP + SEA_H * 0.5, shellBonus, false);
  }

  debugLog('diver clicked: +' + shellBonus.toFixed(1) + ' shells');
}

// ---------------------------------------------------------------------------
// Lighthouse beam boost
// ---------------------------------------------------------------------------
function triggerLighthouseBeamBoost() {
  G.lighthouseBoostTimer = BALANCE.LIGHTHOUSE_BOOST_DURATION;
  triggerLighthouseBeam();
  showToast('🔆 Beacon Beam! 3× shells for ' + BALANCE.LIGHTHOUSE_BOOST_DURATION + 's!');
  flashScreen('rgba(255,240,120,0.35)', 1000);
  debugLog('lighthouse beam triggered');
}

// ---------------------------------------------------------------------------
// Save / Load
// ---------------------------------------------------------------------------
var SAVE_KEY = 'tideShrine_save';

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch(e) {
    // Silent fail — private browsing / storage full
  }
}

function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    var loaded = JSON.parse(raw);
    // Merge loaded into default (handles missing new fields gracefully)
    G = makeDefaultG();
    Object.keys(loaded).forEach(function(k) {
      G[k] = loaded[k];
    });
    recalcDerived();
    debugLog('save loaded');
  } catch(e) {
    // Corrupt save — start fresh
    G = makeDefaultG();
    debugLog('save corrupt, reset');
  }
}
