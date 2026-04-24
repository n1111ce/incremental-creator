// ui.js — DOM panels, skill tree modal (SVG graph), intro overlay, toasts, export/import

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
  if (G.heat >= 90) heatBar.classList.add('heat-pulse');
  else heatBar.classList.remove('heat-pulse');

  // Also update the modal light count if open
  var lightCount = document.getElementById('modal-light-count');
  if (lightCount) lightCount.textContent = fmt(G.stars) + ' Light';
}

// ---------------------------------------------------------------------------
// Skill Modal — SVG tree
// ---------------------------------------------------------------------------
var _modalOpen = false;
var _activeTooltip = null;

// Branch visual config
var BRANCH_CONFIG = {
  flame: { label: 'FLAME', color: '#ff7a30', dimColor: '#5a2a10', col: 0 },
  sky:   { label: 'SKY',   color: '#8080ff', dimColor: '#20205a', col: 1 },
  myth:  { label: 'MYTH',  color: '#ffd700', dimColor: '#5a4a00', col: 2 },
};

// Layout constants for the SVG tree
var TREE = {
  colW: 180,       // px per column
  rowH: 110,       // px per row
  padX: 50,        // left padding to first column center
  padY: 70,        // top padding to row 0
  nodeSize: 64,    // regular node side
  mechSize: 76,    // mechanic node "size" (diamond diagonal)
};

function getNodePos(upg) {
  var col = { flame:0, sky:1, myth:2 }[upg.branch];
  var x = TREE.padX + col * TREE.colW;
  var y = TREE.padY + upg.row * TREE.rowH;
  return { x: x, y: y };
}

function getTotalRows() {
  var max = 0;
  for (var i = 0; i < UPGRADES.length; i++) {
    if (UPGRADES[i].row > max) max = UPGRADES[i].row;
  }
  return max + 1;
}

function svgModalEl(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function getNodeState(upg) {
  var owned = !!G.upgrades[upg.id];
  var parentOwned = isParentOwned(upg);
  var canAfford = G.stars >= upg.cost;
  var meetsTotal = !upg.requiresTotal || G.totalStarsEver >= upg.requiresTotal;

  if (owned) return 'owned';
  if (!parentOwned || !meetsTotal) return 'locked';
  if (canAfford) return 'available';
  return 'unaffordable';
}

function openSkillModal() {
  _modalOpen = true;
  document.getElementById('skill-modal').classList.add('open');
  renderSkillModal();
}

function closeSkillModal() {
  _modalOpen = false;
  document.getElementById('skill-modal').classList.remove('open');
  hideNodeTooltip();
}

function renderSkillModal() {
  // Update light count
  var lightCount = document.getElementById('modal-light-count');
  if (lightCount) lightCount.textContent = fmt(G.stars) + ' Light';

  var container = document.getElementById('skill-tree-container');
  if (!container) return;

  // Build SVG
  var totalRows = getTotalRows();
  var svgW = TREE.padX * 2 + 2 * TREE.colW;
  var svgH = TREE.padY + (totalRows - 1) * TREE.rowH + TREE.padY + 20;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'skill-tree-svg');
  svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.cssText = 'width:100%;height:auto;display:block;overflow:visible;';

  // Defs for glow filter
  var defs = svgModalEl('defs', {});
  defs.innerHTML =
    '<filter id="node-glow"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>' +
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<filter id="mech-glow"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>' +
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<animate id="glow-anim"/>';
  svg.appendChild(defs);

  // Column headers
  var branches = ['flame','sky','myth'];
  for (var bi = 0; bi < branches.length; bi++) {
    var bc = BRANCH_CONFIG[branches[bi]];
    var hx = TREE.padX + bi * TREE.colW;
    var headerBg = svgModalEl('rect', {
      x: String(hx - 56), y: '10', width: '112', height: '30',
      rx: '8', fill: bc.color, opacity: '0.12'
    });
    var headerText = svgModalEl('text', {
      x: String(hx), y: '30',
      'text-anchor': 'middle', fill: bc.color,
      'font-size': '11', 'font-weight': '700',
      'font-family': 'system-ui,sans-serif',
      'letter-spacing': '2'
    });
    headerText.textContent = bc.label;
    svg.appendChild(headerBg);
    svg.appendChild(headerText);
  }

  // Connection lines (parent → child)
  for (var ui = 0; ui < UPGRADES.length; ui++) {
    var upg = UPGRADES[ui];
    if (!upg.parent) continue;
    var parentUpg = null;
    for (var pi = 0; pi < UPGRADES.length; pi++) {
      if (UPGRADES[pi].id === upg.parent) { parentUpg = UPGRADES[pi]; break; }
    }
    if (!parentUpg) continue;

    var p1 = getNodePos(parentUpg);
    var p2 = getNodePos(upg);
    var ownedPath = !!G.upgrades[parentUpg.id] && !!G.upgrades[upg.id];
    var activePath = !!G.upgrades[parentUpg.id];
    var bc2 = BRANCH_CONFIG[upg.branch];

    // Curved quadratic path
    var mx = (p1.x + p2.x) / 2;
    var my = (p1.y + p2.y) / 2;
    var pathD = 'M' + p1.x + ',' + (p1.y + TREE.nodeSize/2) +
                ' Q' + mx + ',' + my +
                ' ' + p2.x + ',' + (p2.y - TREE.nodeSize/2);

    // Highlight line between last numeric before mechanic
    var isPreMechanic = upg.type === 'mechanic';

    var line = svgModalEl('path', {
      d: pathD,
      fill: 'none',
      stroke: activePath ? bc2.color : bc2.dimColor,
      'stroke-width': isPreMechanic ? '2.5' : '1.5',
      'stroke-opacity': activePath ? '0.7' : '0.25',
      'stroke-linecap': 'round'
    });
    if (isPreMechanic && activePath) {
      line.setAttribute('filter', 'url(#node-glow)');
      line.setAttribute('stroke-dasharray', '4 3');
    }
    svg.appendChild(line);
  }

  // Nodes
  for (var ni = 0; ni < UPGRADES.length; ni++) {
    (function(upg) {
      var pos = getNodePos(upg);
      var state = getNodeState(upg);
      var bc3 = BRANCH_CONFIG[upg.branch];
      var isMechanic = upg.type === 'mechanic';
      var color = state === 'locked' ? bc3.dimColor :
                  state === 'owned'  ? bc3.color :
                  state === 'available' ? bc3.color : '#888';

      var nodeG = svgModalEl('g', {
        'data-id': upg.id,
        class: 'tree-node',
        style: 'cursor:pointer'
      });

      if (isMechanic) {
        // Diamond shape
        var hs = TREE.mechSize / 2;
        var diamondPts = [
          pos.x + ',' + (pos.y - hs),
          (pos.x + hs) + ',' + pos.y,
          pos.x + ',' + (pos.y + hs),
          (pos.x - hs) + ',' + pos.y
        ].join(' ');

        // Glow layer (animated pulse via CSS)
        var glowPoly = svgModalEl('polygon', {
          points: diamondPts,
          fill: 'none',
          stroke: color,
          'stroke-width': '3',
          opacity: state === 'locked' ? '0.15' : '0.5',
          filter: state !== 'locked' ? 'url(#mech-glow)' : ''
        });
        if (state !== 'locked' && state !== 'owned') {
          glowPoly.style.animation = 'mech-pulse 2s ease-in-out infinite';
        }

        var poly = svgModalEl('polygon', {
          points: diamondPts,
          fill: state === 'owned' ? color + '33' : '#0a0a1e',
          stroke: color,
          'stroke-width': '2',
          opacity: state === 'locked' ? '0.25' : '1'
        });
        nodeG.appendChild(glowPoly);
        nodeG.appendChild(poly);
      } else {
        // Rounded square
        var hs2 = TREE.nodeSize / 2;
        var bgRect = svgModalEl('rect', {
          x: String(pos.x - hs2), y: String(pos.y - hs2),
          width: String(TREE.nodeSize), height: String(TREE.nodeSize),
          rx: '10',
          fill: state === 'owned' ? color + '22' : '#0a0a1e',
          stroke: color,
          'stroke-width': state === 'available' ? '2' : '1.5',
          opacity: state === 'locked' ? '0.25' : '1'
        });
        if (state === 'available') bgRect.style.animation = 'avail-pulse 2s ease-in-out infinite';
        nodeG.appendChild(bgRect);
      }

      // Owned checkmark
      if (state === 'owned') {
        var check = svgModalEl('text', {
          x: String(pos.x), y: String(pos.y - 8),
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: color, 'font-size': '16', opacity: '0.9'
        });
        check.textContent = '✓';
        nodeG.appendChild(check);
      }

      // Node name (short)
      var nameWords = upg.name.split(' ');
      var line1 = nameWords.slice(0, Math.ceil(nameWords.length / 2)).join(' ');
      var line2 = nameWords.length > 1 ? nameWords.slice(Math.ceil(nameWords.length / 2)).join(' ') : '';

      var nameEl = svgModalEl('text', {
        x: String(pos.x), y: String(state === 'owned' ? pos.y + 10 : pos.y - 4),
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: state === 'locked' ? '#333355' : '#d0d0f0',
        'font-size': '8.5', 'font-family': 'system-ui,sans-serif', 'font-weight': '600'
      });
      nameEl.textContent = line1;
      nodeG.appendChild(nameEl);

      if (line2 && state !== 'owned') {
        var nameEl2 = svgModalEl('text', {
          x: String(pos.x), y: String(pos.y + 8),
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: state === 'locked' ? '#333355' : '#d0d0f0',
          'font-size': '8.5', 'font-family': 'system-ui,sans-serif', 'font-weight': '600'
        });
        nameEl2.textContent = line2;
        nodeG.appendChild(nameEl2);
      }

      // Cost label below node
      if (state !== 'owned') {
        var costEl = svgModalEl('text', {
          x: String(pos.x), y: String(pos.y + (isMechanic ? TREE.mechSize/2 : TREE.nodeSize/2) + 14),
          'text-anchor': 'middle',
          fill: state === 'available' ? '#ffcc60' :
                state === 'unaffordable' ? '#886622' : '#333355',
          'font-size': '8', 'font-family': 'system-ui,sans-serif'
        });
        costEl.textContent = upg.cost > 0 ? fmt(upg.cost) + ' ✦' : 'Prestige';
        nodeG.appendChild(costEl);
      }

      // Hit area (transparent, padded to ≥64px)
      var hitSize = Math.max(64, isMechanic ? TREE.mechSize : TREE.nodeSize);
      var hitRect = svgModalEl('rect', {
        x: String(pos.x - hitSize/2), y: String(pos.y - hitSize/2),
        width: String(hitSize), height: String(hitSize),
        fill: 'transparent',
        style: 'touch-action:manipulation'
      });
      nodeG.appendChild(hitRect);

      nodeG.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        showNodeTooltip(upg, pos, state, e);
      });

      nodeG.id = 'sn-' + upg.id;
      svg.appendChild(nodeG);
    })(UPGRADES[ni]);
  }

  // Replace previous SVG
  container.innerHTML = '';
  container.appendChild(svg);
}

// ---------------------------------------------------------------------------
// Node Tooltip Card
// ---------------------------------------------------------------------------
function showNodeTooltip(upg, pos, state, evt) {
  hideNodeTooltip();

  var modal = document.getElementById('skill-modal');
  var container = document.getElementById('skill-tree-container');
  var svgEl2 = document.getElementById('skill-tree-svg');

  // Get SVG rect for coordinate mapping
  var svgRect = svgEl2 ? svgEl2.getBoundingClientRect() : modal.getBoundingClientRect();
  var svgVW = svgEl2 ? parseFloat(svgEl2.getAttribute('viewBox').split(' ')[2]) : 540;
  var scaleX = svgRect.width / svgVW;

  // Tooltip position: next to node, inside modal
  var nodeScreenX = svgRect.left + pos.x * scaleX;
  var nodeScreenY = svgRect.top + pos.y * (svgRect.height / parseFloat(svgEl2.getAttribute('viewBox').split(' ')[3]));

  var bc = BRANCH_CONFIG[upg.branch];
  var parentUpg = null;
  if (upg.parent) {
    for (var i = 0; i < UPGRADES.length; i++) {
      if (UPGRADES[i].id === upg.parent) { parentUpg = UPGRADES[i]; break; }
    }
  }

  var tip = document.createElement('div');
  tip.id = 'node-tooltip';
  tip.className = 'node-tooltip';

  var effectText = '';
  var eff = upg.effect;
  if (eff) {
    if (eff.type === 'clickPower') effectText = '+' + eff.value + ' click power';
    else if (eff.type === 'heatDecayMult') effectText = 'Heat decays ' + (eff.value * 100) + '% as fast';
    else if (eff.type === 'autoHeat') effectText = '+' + eff.value + ' heat/sec (auto)';
    else if (eff.type === 'skyCapacity') effectText = '+' + eff.value + ' star capacity';
    else if (eff.type === 'lightPerStar') effectText = 'Stars worth ×' + eff.value + ' more Light';
    else if (eff.type === 'starseer') effectText = '+5% all Light gains. Unlocks locked tooltips.';
    else if (eff.type === 'shootingStarRate') effectText = 'Shooting stars spawn 2× faster';
    else if (eff.type === 'comboWindow') effectText = 'Combo window +' + eff.value + 's';
    else if (eff.type === 'unlock_combo') effectText = 'Rapid strikes build a combo ×1 → ×5 multiplier';
    else if (eff.type === 'unlock_twin_anvil') effectText = 'A second anvil appears — forge two streams at once';
    else if (eff.type === 'unlock_strike_chain') effectText = 'Every 10th strike chains lightning through 5 stars (+1 Light each)';
    else if (eff.type === 'unlock_shooting_stars') effectText = 'Shooting stars cross the sky — tap to catch (+25 Light)';
    else if (eff.type === 'unlock_moon_phase') effectText = 'Moon cycles overhead — FULL MOON gives ×3 all Light';
    else if (eff.type === 'unlock_nebula_drift') effectText = 'Every 30s, a free star drifts into the sky';
    else if (eff.type === 'unlock_constellation_power') effectText = 'Each constellation completed: +5% to all Light gains (stacking)';
    else if (eff.type === 'unlock_comet_ritual') effectText = 'Every 200 stars, a comet crosses the sky — tap for +10% Light bonus';
    else if (eff.type === 'supernova') effectText = 'Prestige: reset everything, gain permanent Affinity';
    else effectText = eff.type;
  }

  var canSeeDetails = state !== 'locked' || G.upgrades['M2'];
  var requiresNote = '';
  if (state === 'locked') {
    if (!isParentOwned(upg) && parentUpg) requiresNote = 'Requires: ' + parentUpg.name;
    else if (upg.requiresTotal && G.totalStarsEver < upg.requiresTotal) requiresNote = 'Requires ' + upg.requiresTotal + ' total stars';
    else requiresNote = 'Locked';
  }

  tip.innerHTML =
    '<div class="tip-name" style="color:' + bc.color + '">' + upg.name + '</div>' +
    (canSeeDetails ? '<div class="tip-flavor">' + upg.flavor + '</div>' : '') +
    (canSeeDetails ? '<div class="tip-effect">' + effectText + '</div>' : '') +
    (requiresNote ? '<div class="tip-req">' + requiresNote + '</div>' : '') +
    (upg.cost > 0 && state !== 'owned' && canSeeDetails ?
      '<div class="tip-cost">' + fmt(upg.cost) + ' Light</div>' : '') +
    (state === 'available' ?
      '<button class="tip-forge-btn" id="tip-forge-btn" style="touch-action:manipulation">Forge</button>' : '') +
    (state === 'owned' ? '<div class="tip-owned">✓ Owned</div>' : '');

  // Position tooltip
  var modalRect = document.getElementById('skill-modal').getBoundingClientRect();
  var tipLeft = nodeScreenX - modalRect.left + 50;
  var tipTop  = nodeScreenY - modalRect.top  - 60;
  // Clamp inside modal
  var tipW = 180;
  if (tipLeft + tipW > modalRect.width - 10) tipLeft = nodeScreenX - modalRect.left - tipW - 50;
  if (tipLeft < 8) tipLeft = 8;
  if (tipTop < 8) tipTop = 8;

  tip.style.cssText += ';left:' + tipLeft + 'px;top:' + tipTop + 'px;';

  document.getElementById('skill-modal').appendChild(tip);
  _activeTooltip = tip;

  // Wire forge button
  var forgeBtn = document.getElementById('tip-forge-btn');
  if (forgeBtn) {
    forgeBtn.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      buyUpgrade(upg);
      hideNodeTooltip();
    });
  }
}

function hideNodeTooltip() {
  var existing = document.getElementById('node-tooltip');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  _activeTooltip = null;
}

// ---------------------------------------------------------------------------
// Flash node in modal
// ---------------------------------------------------------------------------
function flashNodeModal(id) {
  var el = document.getElementById('sn-' + id);
  if (el) {
    el.classList.add('flash-node');
    setTimeout(function() { el.classList.remove('flash-node'); }, 400);
  }
}

// Keep old name for compatibility
function flashNode(id) { flashNodeModal(id); }

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

  setTimeout(function() {
    var hint = document.getElementById('intro-anvil-hint');
    hint.style.transition = 'opacity 0.8s';
    hint.style.opacity = '1';
  }, 4000);

  setTimeout(function() {
    overlay.style.pointerEvents = 'none';
    if (onComplete) onComplete();
  }, 4200);
}

function dismissIntro() {
  var overlay = document.getElementById('intro-overlay');
  overlay.style.transition = 'opacity 0.5s';
  overlay.style.opacity = '0';
  setTimeout(function() { overlay.style.display = 'none'; }, 500);
}

// ---------------------------------------------------------------------------
// Supernova confirm modal
// ---------------------------------------------------------------------------
function showSupernovaConfirm(onConfirm) {
  var modal = document.getElementById('confirm-modal');
  var gain = Math.sqrt(G.totalStarsEver / 5000).toFixed(2);
  document.getElementById('confirm-msg').textContent =
    'The sky will go dark. Affinity +' + gain + ' carries over. All else resets.';
  modal.style.display = 'flex';

  var yesBtn = document.getElementById('confirm-yes');
  var noBtn  = document.getElementById('confirm-no');
  var yesClone = yesBtn.cloneNode(true);
  var noClone  = noBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(yesClone, yesBtn);
  noBtn.parentNode.replaceChild(noClone, noBtn);
  yesClone.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    modal.style.display = 'none';
    onConfirm();
  });
  noClone.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    modal.style.display = 'none';
  });
}

// ---------------------------------------------------------------------------
// Wire up all static UI events
// ---------------------------------------------------------------------------
function initUI() {
  document.getElementById('skills-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (_modalOpen) closeSkillModal(); else openSkillModal();
  });

  document.getElementById('modal-close-btn').addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    closeSkillModal();
  });

  // Backdrop tap closes modal
  document.getElementById('skill-modal').addEventListener('pointerdown', function(e) {
    if (e.target === document.getElementById('skill-modal')) {
      closeSkillModal();
    }
  });

  // Tap on modal body (not node, not tooltip) hides tooltip
  document.getElementById('skill-modal-box').addEventListener('pointerdown', function(e) {
    if (!e.target.closest('.tree-node') && !e.target.closest('#node-tooltip')) {
      hideNodeTooltip();
    }
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
      localStorage.removeItem(SAVE_KEY_V1);
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

  // Close settings when clicking outside
  document.addEventListener('pointerdown', function(e) {
    var settings = document.getElementById('settings-menu');
    if (_settingsOpen && !settings.contains(e.target) && e.target.id !== 'settings-btn') closeSettings();
  });
}
