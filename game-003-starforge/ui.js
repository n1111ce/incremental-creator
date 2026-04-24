// ui.js — DOM panels, skill tree drawer, intro overlay, toasts, export/import modal

// ---------------------------------------------------------------------------
// Toast system
// ---------------------------------------------------------------------------
function showToast(msg) {
  var container = document.getElementById('toast-container');
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function() { t.classList.add('toast-show'); }, 10);
  setTimeout(function() {
    t.classList.remove('toast-show');
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 500);
  }, 2500);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
  document.getElementById('stars-disp').textContent = fmt(G.stars);
  document.getElementById('affinity-disp').textContent = '×' + G.affinity.toFixed(2);

  var supernovaWrap = document.getElementById('supernova-btn-wrap');
  supernovaWrap.style.display = canPrestige() ? 'flex' : 'none';

  document.getElementById('heat-bar-fill').style.width = Math.min(100, G.heat) + '%';
  var heatBar = document.getElementById('heat-bar-fill');
  if (G.heat >= 90) {
    heatBar.classList.add('heat-pulse');
  } else {
    heatBar.classList.remove('heat-pulse');
  }
}

// ---------------------------------------------------------------------------
// Skill drawer
// ---------------------------------------------------------------------------
var _drawerOpen = false;

function renderDrawer() {
  var body = document.getElementById('drawer-body');
  body.innerHTML = '';

  var branches = ['FLAME', 'SKY', 'MYTH'];
  var branchNames = { FLAME: '🔥 Flame', SKY: '🌌 Sky', MYTH: '✦ Myth' };

  branches.forEach(function(branch) {
    var section = document.createElement('div');
    section.className = 'branch-section';

    var header = document.createElement('div');
    header.className = 'branch-header';
    header.textContent = branchNames[branch];
    section.appendChild(header);

    var nodes = UPGRADES.filter(function(u) { return u.branch === branch; });
    nodes.forEach(function(upg) {
      var owned = !!G.upgrades[upg.id];
      var affordable = G.stars >= upg.cost;
      var meetsTotal = !upg.requires_total || G.totalStarsEver >= upg.requires_total;

      var div = document.createElement('div');
      div.className = 'skill-node' +
        (owned ? ' owned' : '') +
        (!owned && affordable && meetsTotal ? ' available' : '') +
        (!owned && (!affordable || !meetsTotal) ? ' locked' : '');
      div.id = 'sn-' + upg.id;

      var reqNote = (upg.requires_total && !meetsTotal)
        ? '<div class="sn-req">Requires ' + upg.requires_total + ' total stars forged</div>' : '';
      var costNote = (!owned && upg.cost > 0)
        ? '<div class="sn-cost">' + fmt(upg.cost) + ' Light</div>' : '';
      var freeNote = (!owned && upg.cost === 0 && meetsTotal)
        ? '<div class="sn-cost">Free</div>' : '';

      div.innerHTML =
        '<div class="sn-name">' + upg.name + '</div>' +
        '<div class="sn-lore">' + upg.lore + '</div>' +
        '<div class="sn-effect">' + upg.effect + '</div>' +
        reqNote + costNote + freeNote;

      if (!owned && affordable && meetsTotal) {
        div.style.cursor = 'pointer';
        (function(u) {
          div.addEventListener('pointerdown', function(e) {
            e.stopPropagation();
            buyUpgrade(u);
          });
        })(upg);
      }
      section.appendChild(div);
    });
    body.appendChild(section);
  });
}

function openDrawer() {
  _drawerOpen = true;
  document.getElementById('skills-drawer').classList.add('open');
  renderDrawer();
}

function closeDrawer() {
  _drawerOpen = false;
  document.getElementById('skills-drawer').classList.remove('open');
}

// ---------------------------------------------------------------------------
// Settings menu
// ---------------------------------------------------------------------------
var _settingsOpen = false;

function openSettings() {
  _settingsOpen = true;
  document.getElementById('settings-menu').classList.add('open');
}

function closeSettings() {
  _settingsOpen = false;
  document.getElementById('settings-menu').classList.remove('open');
}

// ---------------------------------------------------------------------------
// Export / Import modal
// ---------------------------------------------------------------------------
function showExportModal() {
  var str = exportSave();
  var ta = document.createElement('textarea');
  ta.readOnly = true;
  ta.value = str;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px;';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  ta.remove();
  showToast('Save copied to clipboard');
}

function showImportModal() {
  document.getElementById('import-modal').style.display = 'flex';
  document.getElementById('import-ta').value = '';
  closeSettings();
}

function hideImportModal() {
  document.getElementById('import-modal').style.display = 'none';
}

// ---------------------------------------------------------------------------
// Intro overlay
// ---------------------------------------------------------------------------
function runIntro(onComplete) {
  var overlay = document.getElementById('intro-overlay');
  overlay.style.display = 'flex';

  var lines = ['il-1', 'il-2', 'il-3'];
  var delays = [400, 1600, 2800];

  lines.forEach(function(id, i) {
    setTimeout(function() {
      var el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, delays[i]);
  });

  // Show hint ring after last line
  setTimeout(function() {
    var hint = document.getElementById('intro-anvil-hint');
    hint.style.transition = 'opacity 0.8s';
    hint.style.opacity = '1';
  }, 4000);

  // Make overlay pointer-events transparent so anvil click works
  setTimeout(function() {
    overlay.style.pointerEvents = 'none';
    if (onComplete) onComplete();
  }, 4200);
}

function dismissIntro() {
  var overlay = document.getElementById('intro-overlay');
  overlay.style.transition = 'opacity 0.5s';
  overlay.style.opacity = '0';
  setTimeout(function() {
    overlay.style.display = 'none';
  }, 500);
}

// ---------------------------------------------------------------------------
// Supernova confirm modal
// ---------------------------------------------------------------------------
function showSupernovaConfirm(onConfirm) {
  var modal = document.getElementById('confirm-modal');
  var gain = (G.affinity + Math.sqrt(G.totalStarsEver / 5000) - G.affinity).toFixed(2);
  document.getElementById('confirm-msg').textContent =
    'The sky will go dark. Affinity +' + gain + ' carries over. All else resets.';
  modal.style.display = 'flex';

  document.getElementById('confirm-yes').onclick = function() {
    modal.style.display = 'none';
    onConfirm();
  };
  document.getElementById('confirm-no').onclick = function() {
    modal.style.display = 'none';
  };
}

// ---------------------------------------------------------------------------
// Skill node flash feedback
// ---------------------------------------------------------------------------
function flashNode(id) {
  var el = document.getElementById('sn-' + id);
  if (el) {
    el.classList.add('flash-node');
    setTimeout(function() { el.classList.remove('flash-node'); }, 400);
  }
}

// ---------------------------------------------------------------------------
// Wire up all static UI events
// ---------------------------------------------------------------------------
function initUI() {
  document.getElementById('skills-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (_drawerOpen) closeDrawer(); else openDrawer();
  });

  document.getElementById('drawer-close').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    closeDrawer();
  });

  document.getElementById('settings-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (_settingsOpen) closeSettings(); else openSettings();
  });

  document.getElementById('settings-close').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    closeSettings();
  });

  document.getElementById('export-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    showExportModal();
    closeSettings();
  });

  document.getElementById('import-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    showImportModal();
  });

  document.getElementById('reset-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (confirm('Reset all progress? This cannot be undone.')) {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
    closeSettings();
  });

  document.getElementById('import-confirm').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    var str = document.getElementById('import-ta').value;
    importSave(str);
    hideImportModal();
  });

  document.getElementById('import-cancel').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    hideImportModal();
  });

  document.getElementById('supernova-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (!canPrestige()) return;
    showSupernovaConfirm(doPrestige);
  });

  // Close drawer/settings when clicking outside
  document.addEventListener('pointerdown', function(e) {
    var drawer = document.getElementById('skills-drawer');
    var settings = document.getElementById('settings-menu');
    if (_drawerOpen && !drawer.contains(e.target) && e.target.id !== 'skills-btn') closeDrawer();
    if (_settingsOpen && !settings.contains(e.target) && e.target.id !== 'settings-btn') closeSettings();
  });
}
