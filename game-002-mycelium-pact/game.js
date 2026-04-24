// game.js — global state G, save/load, tick loop, click handlers, prestige logic

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------
var G = {
  spores:    0,
  seeds:     0,
  rebirths:  0,
  unlocked:  ['root'],
  spcBase:   1,
  spsBase:   0,
  spcMult:   1,
  spsMult:   1,
  allMult:   1,
  _firstClicked: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

function getSporesPerClick() {
  return (G.spcBase * G.spcMult * G.allMult) * (1 + G.seeds * 0.2);
}

function getSporesPerSec() {
  return G.spsBase * G.spsMult * G.allMult;
}

// ---------------------------------------------------------------------------
// Save / Load
// ---------------------------------------------------------------------------
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); debugLog('saved'); } catch(e) {}
}

function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) G[k] = s[k]; }
      debugLog('loaded save — spores:' + Math.floor(G.spores) + ' unlocked:' + G.unlocked.length);
    } else {
      debugLog('no save found — fresh start');
    }
  } catch(e) { debugLog('load error: ' + e); }
}

// ---------------------------------------------------------------------------
// Stump click
// ---------------------------------------------------------------------------
function onStumpClick(e, def, outer, inner) {
  var gained = getSporesPerClick();
  G.spores += gained;

  var pos = stumpPos(def);
  spawnSpores(pos.x, pos.y - 32, 5);

  // Bounce on inner only — outer keeps its translate untouched
  inner.style.animation = 'none';
  inner.style.transform = 'scale(0.9)';
  inner.style.transformOrigin = '0px 0px';
  setTimeout(function() {
    inner.style.transform = 'scale(1.1)';
    setTimeout(function() {
      inner.style.transform = '';
      inner.style.animation = 'stump-pulse 2s ease-in-out infinite';
    }, 120);
  }, 80);

  if (!G._firstClicked) {
    G._firstClicked = true;
    showStory('Something stirs. The roots remember your name.');
  }
  updateHUD();
}

// ---------------------------------------------------------------------------
// Buy / unlock a skill node
// ---------------------------------------------------------------------------
function buyNode(node) {
  if (G.unlocked.indexOf(node.id) !== -1) return;
  if (node.parent && G.unlocked.indexOf(node.parent) === -1) return;
  if (node.cost > 0 && G.spores < node.cost) {
    showStory('Not enough spores yet...');
    return;
  }
  G.spores -= node.cost;
  G.unlocked.push(node.id);
  debugLog('unlocked: ' + node.id + ' | spc:' + getSporesPerClick().toFixed(1) + ' sps:' + getSporesPerSec().toFixed(1));
  if (node.spc) G.spcBase += node.spc;
  if (node.sps) G.spsBase += node.sps;
  if (node.mult) {
    if (node.mult.type === 'spc') G.spcMult *= node.mult.val;
    else if (node.mult.type === 'sps') G.spsMult *= node.mult.val;
    else if (node.mult.type === 'all') G.allMult *= node.mult.val;
  }
  if (node.id === 'fungal_web')   spawnMushrooms();
  if (node.id === 'first_sapling') spawnSaplings();
  addMyceliumThread();
  spawnOrbBurst();
  showStory(node.lore);
  var el = document.getElementById('sn-' + node.id);
  if (el) {
    el.classList.add('flash-node');
    setTimeout(function() { el.classList.remove('flash-node'); }, 400);
  }
  renderDrawer();
  updateHUD();
}

// ---------------------------------------------------------------------------
// Prestige / rebirth
// ---------------------------------------------------------------------------
function prestige() {
  var flash = document.getElementById('flash-overlay');
  flash.style.transition = 'opacity 0.3s';
  flash.style.opacity = '0.7';
  flash.style.filter = 'hue-rotate(90deg)';
  setTimeout(function() {
    flash.style.opacity = '0';
    G.spores = 0;
    G.seeds += 1;
    G.rebirths += 1;
    debugLog('rebirth #' + G.rebirths + ' — seeds of memory: ' + G.seeds);
    G.unlocked  = ['root'];
    G.spcBase = 1; G.spsBase = 0;
    G.spcMult = 1; G.spsMult = 1; G.allMult = 1;
    mushroomLayer.innerHTML = '';
    saplingLayer.innerHTML  = '';
    var bonusPool = TREE.filter(function(n) { return n.id !== 'root'; });
    var pick = bonusPool[Math.floor(Math.random() * bonusPool.length)];
    if (pick) {
      G.unlocked.push(pick.id);
      if (pick.spc) G.spcBase += pick.spc;
      if (pick.sps) G.spsBase += pick.sps;
      if (pick.mult) {
        if (pick.mult.type === 'spc') G.spcMult *= pick.mult.val;
        else if (pick.mult.type === 'sps') G.spsMult *= pick.mult.val;
        else if (pick.mult.type === 'all') G.allMult *= pick.mult.val;
      }
    }
    renderDrawer();
    updateHUD();
    addMyceliumThread();
    showStory('You dissolve and reform. The roots remember everything. Seed #' + G.seeds + ' carried.');
  }, 800);
}

// ---------------------------------------------------------------------------
// Tick loop
// ---------------------------------------------------------------------------
var _lastSave = Date.now();

function tick() {
  var sps = getSporesPerSec();
  G.spores += sps / 10;
  updateHUD();

  var now = Date.now();
  if (now - _lastSave > 10000) {
    saveGame();
    _lastSave = now;
  }

  // Keep drawer in sync if open
  var drawer = document.getElementById('drawer');
  if (drawer && drawer.classList.contains('open')) {
    renderDrawer();
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  loadGame();
  initCanvas();   // canvas.js: sets up SVG refs, draws orb + stumps
  initUI();       // ui.js: wires up buttons

  // Restore visual state from save
  for (var i = 0; i < G.unlocked.length - 1; i++) addMyceliumThread();
  if (G.unlocked.indexOf('fungal_web')    !== -1) spawnMushrooms();
  if (G.unlocked.indexOf('first_sapling') !== -1) spawnSaplings();

  if (localStorage.getItem(SAVE_KEY + '_seen')) {
    var ob = document.getElementById('onboarding');
    if (ob) ob.style.display = 'none';
  }

  updateHUD();
  setInterval(tick, 100);

  // Re-render on resize — recomputes all ratio-based positions
  window.addEventListener('resize', function() {
    renderOrb();
    renderStumps();
  });
}

document.addEventListener('DOMContentLoaded', init);
