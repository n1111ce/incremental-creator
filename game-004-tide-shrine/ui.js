// ui.js — skill tree modal, HUD updates, intro sequence, export/import/reset

// ---------------------------------------------------------------------------
// HUD update
// ---------------------------------------------------------------------------
function updateHUD() {
  document.getElementById('shells-disp').textContent = fmt(G.shells);
  document.getElementById('pearls-disp').textContent = G.pearls;
  document.getElementById('modal-shell-count').textContent = fmt(G.shells) + ' 🐚';

  // Show pearls row once pearls exist
  if (G.pearls > 0 || G.pearlDiverActive) {
    document.getElementById('pearls-row').style.display = '';
  }

  // Shells-per-second readout
  var sps = calcShellsPerSec();
  if (sps > 0) {
    document.getElementById('sps-disp').textContent = fmtDec(sps) + ' /sec';
  } else {
    document.getElementById('sps-disp').textContent = '';
  }

  // Moon phase HUD
  if (G.moonPhasesActive) {
    document.getElementById('moon-phase-hud').style.display = '';
    var phaseData = MOON_PHASES[G.moonPhase];
    document.getElementById('moon-phase-icon').textContent = phaseData.icon;
    var label = phaseData.label;
    if (G.fullMoonTimer > 0) label += ' ✦ 3×!';
    document.getElementById('moon-phase-label').textContent = label;
  }

  // Combo bar
  if (G.lighthouseActive) {
    document.getElementById('combo-wrap').style.display = '';
    var pct = (G.comboCharge / BALANCE.LIGHTHOUSE_COMBO_MAX) * 100;
    document.getElementById('combo-bar-fill').style.width = pct + '%';
    if (G.lighthouseBoostTimer > 0) {
      document.getElementById('combo-label').textContent =
        'BEAM ACTIVE! ' + G.lighthouseBoostTimer.toFixed(1) + 's';
    } else {
      document.getElementById('combo-label').textContent = 'Beacon Charge';
    }
  }
}

function calcShellsPerSec() {
  var sps = 0;
  if (G.autoPullerActive) {
    var interval = BALANCE.AUTO_PULLER_INTERVAL;
    sps += calcPullYield() / interval;
  }
  if (G.secondShrineActive) {
    sps += calcPullYield() * 0.5 / BALANCE.SHRINE2_PULL_RATE;
  }
  // Ambient gain
  sps += calcAmbientPerSec();
  return sps;
}

// ---------------------------------------------------------------------------
// Intro sequence — blocks all interaction until complete
// ---------------------------------------------------------------------------
var introPhase = 0; // 0=not started, 1=typing, 2=arrow shown, 3=done

var INTRO_LINES = [
  "The shrine has been silent for a hundred tides.",
  "You are its last keeper.",
  "Pull the rope. Wake the sea.",
];

function startIntro() {
  if (G.introComplete) {
    endIntro();
    return;
  }

  var overlay = document.getElementById('intro-overlay');
  overlay.style.display = 'flex';
  introPhase = 1;

  // Type in lines one by one
  var delay = 0;
  INTRO_LINES.forEach(function(line, idx) {
    var lineEl = document.getElementById('il-' + (idx + 1));
    lineEl.textContent = line;

    setTimeout(function() {
      lineEl.style.opacity = '1';
    }, delay);

    delay += 1800;
  });

  // Show arrow after all lines
  setTimeout(function() {
    var arrow = document.getElementById('intro-arrow');
    arrow.style.opacity = '1';
    introPhase = 2;
  }, delay + 400);
}

function endIntro() {
  var overlay = document.getElementById('intro-overlay');
  overlay.style.transition = 'opacity 0.6s ease';
  overlay.style.opacity = '0';
  setTimeout(function() {
    overlay.style.display = 'none';
    overlay.style.opacity = '';
  }, 620);

  // Show the rope arrow
  var ropeArrow = document.getElementById('rope-arrow');
  if (ropeArrow) ropeArrow.style.display = '';

  introPhase = 3;
  G.introComplete = true;
}

function hideRopeArrow() {
  var ropeArrow = document.getElementById('rope-arrow');
  if (ropeArrow) ropeArrow.style.display = 'none';
  var ring = document.getElementById('rope-knot-ring');
  if (ring) ring.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Skill tree modal rendering
// ---------------------------------------------------------------------------
var TREE_NODE_SIZE = 36;    // half-width of diamond
var TREE_COL_W = 140;       // px per column
var TREE_ROW_H = 120;       // px per row
var TREE_MARGIN_X = 60;
var TREE_MARGIN_Y = 40;

function openSkillModal() {
  document.getElementById('skill-modal').classList.add('open');
  renderSkillTree();
  document.getElementById('modal-shell-count').textContent = fmt(G.shells) + ' 🐚';
}

function closeSkillModal() {
  document.getElementById('skill-modal').classList.remove('open');
}

function renderSkillTree() {
  var svg = document.getElementById('skill-tree-svg');
  svg.innerHTML = '';

  var totalCols = 6; // cols 1–5 for branches + padding
  var totalRows = 4; // rows 0–3
  var svgW = totalCols * TREE_COL_W + TREE_MARGIN_X * 2;
  var svgH = totalRows * TREE_ROW_H + TREE_MARGIN_Y * 2;

  svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);

  // Draw edges first (behind nodes)
  SKILL_NODES.forEach(function(node) {
    if (!node.requires || !node.requires.length) return;
    node.requires.forEach(function(parentId) {
      var parent = SKILL_BY_ID[parentId];
      if (!parent) return;
      var x1 = nodeX(parent);
      var y1 = nodeY(parent);
      var x2 = nodeX(node);
      var y2 = nodeY(node);

      var col = BRANCH_COLORS[node.branch];
      var owned = G.ownedSkills.indexOf(parentId) >= 0;

      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', owned ? col.stroke : 'rgba(100,120,140,0.35)');
      line.setAttribute('stroke-width', owned ? 2.5 : 1.5);
      line.setAttribute('stroke-dasharray', owned ? 'none' : '4,3');
      svg.appendChild(line);
    });
  });

  // Branch labels at top of each column
  ['Rope','Sky','Depths','Twin','Beacon'].forEach(function(name, idx) {
    var col = idx + 1;
    var bx = nodeColX(col);
    var by = TREE_MARGIN_Y * 0.6;
    var branch = name.toLowerCase();
    var col_color = BRANCH_COLORS[branch];

    var t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', bx);
    t.setAttribute('y', by);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'Georgia, serif');
    t.setAttribute('font-size', '12');
    t.setAttribute('fill', col_color.glow);
    t.setAttribute('opacity', '0.75');
    t.setAttribute('letter-spacing', '0.08em');
    t.textContent = name.toUpperCase();
    svg.appendChild(t);
  });

  // Draw nodes
  SKILL_NODES.forEach(function(node) {
    drawSkillNode(svg, node);
  });
}

function nodeColX(col) {
  return TREE_MARGIN_X + (col - 0.5) * TREE_COL_W;
}

function nodeX(node) {
  return TREE_MARGIN_X + (node.col - 0.5) * TREE_COL_W;
}

function nodeY(node) {
  return TREE_MARGIN_Y + node.row * TREE_ROW_H + TREE_ROW_H * 0.55;
}

function drawSkillNode(svg, node) {
  var owned = G.ownedSkills.indexOf(node.id) >= 0;
  var affordable = !owned && canAfford(node);
  var unlocked = !owned && isUnlocked(node);
  var col = BRANCH_COLORS[node.branch];
  var x = nodeX(node);
  var y = nodeY(node);
  var s = node.type === 'mechanic' ? TREE_NODE_SIZE * 1.15 : TREE_NODE_SIZE;

  var g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'skill-node');
  g.setAttribute('data-id', node.id);
  g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
  // Pointer events handled here
  g.setAttribute('style', 'cursor:' + (affordable && unlocked ? 'pointer' : 'default') + ';touch-action:manipulation');
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', node.label + ' — ' + node.cost + ' shells');

  // Diamond shape
  var diamond = document.createElementNS(SVG_NS, 'polygon');
  var pts = [
    '0,-' + s,
    s + ',0',
    '0,' + s,
    '-' + s + ',0',
  ].join(' ');
  diamond.setAttribute('points', pts);

  var bgClass = 'skill-node-bg';
  if (owned) {
    diamond.setAttribute('fill', col.fill);
    diamond.setAttribute('stroke', col.stroke);
    diamond.setAttribute('stroke-width', '2.5');
    bgClass += ' owned';
  } else if (!unlocked) {
    // Not yet reachable
    diamond.setAttribute('fill', '#0d1e2e');
    diamond.setAttribute('stroke', 'rgba(80,100,120,0.3)');
    diamond.setAttribute('stroke-width', '1.5');
    if (node.type === 'mechanic') bgClass += ' locked-special';
  } else if (affordable) {
    diamond.setAttribute('fill', '#0d2535');
    diamond.setAttribute('stroke', col.glow);
    diamond.setAttribute('stroke-width', '2.5');
    bgClass += ' affordable';
  } else {
    diamond.setAttribute('fill', '#0d1e2e');
    diamond.setAttribute('stroke', col.stroke);
    diamond.setAttribute('stroke-width', '1.8');
    diamond.setAttribute('stroke-opacity', '0.6');
  }
  diamond.setAttribute('class', bgClass);
  g.appendChild(diamond);

  // Mechanic-unlock special inner ring
  if (node.type === 'mechanic') {
    var inner = document.createElementNS(SVG_NS, 'polygon');
    var si = s * 0.72;
    inner.setAttribute('points', [
      '0,-' + si, si + ',0', '0,' + si, '-' + si + ',0',
    ].join(' '));
    inner.setAttribute('fill', 'none');
    inner.setAttribute('stroke', owned ? col.glow : (unlocked ? col.glow : 'rgba(160,140,80,0.35)'));
    inner.setAttribute('stroke-width', '1.2');
    inner.setAttribute('stroke-dasharray', owned ? 'none' : '3,2');
    g.appendChild(inner);
  }

  // Owned checkmark
  if (owned) {
    var check = document.createElementNS(SVG_NS, 'text');
    check.setAttribute('x', '0');
    check.setAttribute('y', '5');
    check.setAttribute('text-anchor', 'middle');
    check.setAttribute('font-size', node.type === 'mechanic' ? '20' : '16');
    check.setAttribute('fill', col.glow);
    check.setAttribute('pointer-events', 'none');
    check.textContent = '✓';
    g.appendChild(check);
  }

  // Label below diamond
  var label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('x', '0');
  label.setAttribute('y', (s + 16).toString());
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-family', 'Georgia, serif');
  label.setAttribute('font-size', '11');
  label.setAttribute('fill', owned ? col.glow : (unlocked ? '#c0d8e0' : 'rgba(100,120,130,0.6)'));
  label.setAttribute('class', 'skill-label');
  label.setAttribute('pointer-events', 'none');
  label.textContent = node.label;
  g.appendChild(label);

  // Cost label
  if (!owned) {
    var cost = document.createElementNS(SVG_NS, 'text');
    cost.setAttribute('x', '0');
    cost.setAttribute('y', (s + 29).toString());
    cost.setAttribute('text-anchor', 'middle');
    cost.setAttribute('font-family', 'Georgia, serif');
    cost.setAttribute('font-size', '10');
    cost.setAttribute('fill', affordable ? '#f0e890' : 'rgba(140,150,100,0.5)');
    cost.setAttribute('class', 'skill-label');
    cost.setAttribute('pointer-events', 'none');
    cost.textContent = fmt(node.cost) + ' 🐚';
    g.appendChild(cost);
  }

  // Flavor text on row 3 unlock nodes (smaller, italic)
  if (node.type === 'mechanic' && node.flavor) {
    var flavor = document.createElementNS(SVG_NS, 'text');
    flavor.setAttribute('x', '0');
    flavor.setAttribute('y', (-s - 10).toString());
    flavor.setAttribute('text-anchor', 'middle');
    flavor.setAttribute('font-family', 'Georgia, serif');
    flavor.setAttribute('font-size', '9');
    flavor.setAttribute('font-style', 'italic');
    flavor.setAttribute('fill', 'rgba(160,180,190,0.55)');
    flavor.setAttribute('class', 'skill-label');
    flavor.setAttribute('pointer-events', 'none');
    flavor.textContent = node.flavor;
    g.appendChild(flavor);
  } else if (node.flavor) {
    var flavorN = document.createElementNS(SVG_NS, 'text');
    flavorN.setAttribute('x', '0');
    flavorN.setAttribute('y', (-s - 6).toString());
    flavorN.setAttribute('text-anchor', 'middle');
    flavorN.setAttribute('font-family', 'Georgia, serif');
    flavorN.setAttribute('font-size', '8.5');
    flavorN.setAttribute('font-style', 'italic');
    flavorN.setAttribute('fill', 'rgba(140,160,170,0.45)');
    flavorN.setAttribute('class', 'skill-label');
    flavorN.setAttribute('pointer-events', 'none');
    flavorN.textContent = node.flavor;
    g.appendChild(flavorN);
  }

  // Click handler on node
  g.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    tryPurchaseSkill(node.id);
  });

  svg.appendChild(g);
}

function canAfford(node) {
  return G.shells >= node.cost;
}

function isUnlocked(node) {
  if (!node.requires || node.requires.length === 0) return true;
  return node.requires.every(function(reqId) {
    return G.ownedSkills.indexOf(reqId) >= 0;
  });
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
function showToast(msg, isPearl) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast' + (isPearl ? ' pearl-toast' : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

// ---------------------------------------------------------------------------
// Flash overlay (lighthouse beam / prestige)
// ---------------------------------------------------------------------------
function flashScreen(color, duration) {
  var overlay = document.getElementById('flash-overlay');
  overlay.style.background = color || 'rgba(240,240,180,0.35)';
  overlay.style.transition = 'none';
  requestAnimationFrame(function() {
    overlay.style.transition = 'background ' + (duration || 600) + 'ms ease';
    overlay.style.background = 'rgba(240,240,180,0)';
  });
}

// ---------------------------------------------------------------------------
// Export / Import / Reset
// ---------------------------------------------------------------------------
function exportSave() {
  try {
    var json = JSON.stringify(G);
    var b64 = btoa(json);
    // Copy to clipboard if available, otherwise show in a text area
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(b64).then(function() {
        showToast('Save copied to clipboard!');
      }).catch(function() {
        promptCopyText(b64);
      });
    } else {
      promptCopyText(b64);
    }
  } catch(e) {
    showToast('Export failed — try again.');
  }
}

function promptCopyText(text) {
  // Fallback: show in import textarea for manual copy
  document.getElementById('import-ta').value = text;
  document.getElementById('import-modal').classList.add('open');
  document.getElementById('import-ta').select();
  showToast('Save string shown below — copy it manually.');
}

function openImportModal() {
  document.getElementById('import-ta').value = '';
  document.getElementById('import-modal').classList.add('open');
}

function closeImportModal() {
  document.getElementById('import-modal').classList.remove('open');
}

function doImport() {
  var b64 = document.getElementById('import-ta').value.trim();
  try {
    var json = atob(b64);
    var loaded = JSON.parse(json);
    Object.assign(G, loaded);
    recalcDerived();
    saveGame();
    closeImportModal();
    showToast('Save imported!');
    updateHUD();
    renderSkillTree();
    rebuildUnlockedFeatures();
  } catch(e) {
    showToast('Invalid save string — check and retry.');
  }
}

function doReset() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  localStorage.removeItem('tideShrine_save');
  G = makeDefaultG();
  recalcDerived();
  // Rebuild scene fresh
  buildScene();
  syncShellsOnSand(0);
  document.getElementById('shells-layer').innerHTML = '';
  // Hide unlocked features
  document.getElementById('shrine2-group').style.display = 'none';
  document.getElementById('lighthouse-group').style.display = 'none';
  document.getElementById('moon-phase-hud').style.display = 'none';
  document.getElementById('combo-wrap').style.display = 'none';
  document.getElementById('pearls-row').style.display = 'none';
  document.getElementById('settings-menu').style.display = 'none';
  startIntro();
  updateHUD();
  debugLog('game reset');
}

// ---------------------------------------------------------------------------
// Wire up all UI events
// ---------------------------------------------------------------------------
function initUI() {
  // Skills button
  document.getElementById('skills-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    openSkillModal();
  });

  // Modal close — click box backdrop or close button
  document.getElementById('skill-modal').addEventListener('pointerdown', function(e) {
    if (e.target === this) closeSkillModal();
  });
  document.getElementById('modal-close-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    closeSkillModal();
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var menu = document.getElementById('settings-menu');
    menu.style.display = menu.style.display === 'none' ? '' : 'none';
  });

  // Settings menu buttons
  document.getElementById('export-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    exportSave();
  });
  document.getElementById('import-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    openImportModal();
  });
  document.getElementById('reset-btn').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    doReset();
  });
  document.getElementById('settings-close').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    document.getElementById('settings-menu').style.display = 'none';
  });

  // Import modal
  document.getElementById('import-confirm').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    doImport();
  });
  document.getElementById('import-cancel').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    closeImportModal();
  });

  // Diver click
  document.getElementById('diver-group').addEventListener('pointerdown', function(e) {
    e.preventDefault();
    if (G.diverVisible) onDiverClick(e);
  });

  // Intro overlay: tapping anywhere after arrow shows triggers the first pull
  document.getElementById('intro-overlay').addEventListener('pointerdown', function(e) {
    if (introPhase < 2) return;
    e.preventDefault();
    onRopeClick(e);
  });

  // Resize
  window.addEventListener('resize', function() {
    onCanvasResize();
  });

  // Close settings menu on outside click
  document.addEventListener('pointerdown', function(e) {
    var menu = document.getElementById('settings-menu');
    var btn = document.getElementById('settings-btn');
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

// ---------------------------------------------------------------------------
// Flash Skills button (onboarding, after 3rd pull)
// ---------------------------------------------------------------------------
function pulseSkillsButton() {
  if (G.skillsButtonFlashed) return;
  G.skillsButtonFlashed = true;
  var btn = document.getElementById('skills-btn');
  btn.classList.add('pulse-once');
  setTimeout(function() {
    btn.classList.remove('pulse-once');
  }, 2000);
}
