// ui.js — HUD, Upgrade Modal, Prestige UI, Export/Import, Onboarding
// All functions on window.*

(function() {
  'use strict';

  // ======================================================
  // HUD UPDATE
  // ======================================================
  window.updateHUD = function() {
    var gemsEl = document.getElementById('hud-gems-val');
    var lightEl = document.getElementById('hud-light-val');
    var lightPsEl = document.getElementById('hud-light-ps');
    var vaultBarEl = document.getElementById('vault-bar-fill');
    var vaultPctEl = document.getElementById('hud-vault-pct');
    var shardsEl = document.getElementById('hud-shards-val');
    var prestigeBtn = document.getElementById('btn-prestige');

    if (gemsEl) gemsEl.textContent = _fmt(G.gems);
    if (lightEl) lightEl.textContent = _fmt(Math.floor(G.light));
    if (lightPsEl) lightPsEl.textContent = '(+' + _fmt(Math.round(G.lightPerSec * 10) / 10) + '/s)';
    if (shardsEl) shardsEl.textContent = G.vaultShards || 0;

    var pct = Math.min(100, G.vaultCompletion || 0);
    if (vaultBarEl) vaultBarEl.style.width = pct.toFixed(1) + '%';
    if (vaultPctEl) vaultPctEl.textContent = Math.floor(pct) + '%';

    if (prestigeBtn) {
      if (pct >= 100) {
        prestigeBtn.classList.remove('hidden');
        prestigeBtn.classList.add('pulsing');
      } else {
        prestigeBtn.classList.add('hidden');
        prestigeBtn.classList.remove('pulsing');
      }
    }
  };

  function _fmt(n) {
    if (n === undefined || n === null) return '0';
    n = Math.floor(n);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // ======================================================
  // UPGRADE TREE MODAL
  // ======================================================
  var _upgradeOpen = false;

  window.renderUpgradeTree = function() {
    var svg = document.getElementById('upgrade-tree-svg');
    if (!svg) return;

    var COLS = 3;
    var ROWS = 5;
    var CELL_W = 160;
    var CELL_H = 110;
    var PAD_X = 50;
    var PAD_Y = 40;
    var totalW = COLS * CELL_W + PAD_X * 2;
    var totalH = ROWS * CELL_H + PAD_Y * 2;

    svg.setAttribute('width', totalW);
    svg.setAttribute('height', totalH);
    svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
    svg.innerHTML = '';

    var ns = 'http://www.w3.org/2000/svg';

    function nodeCenter(row, col) {
      return {
        x: PAD_X + col * CELL_W + CELL_W / 2,
        y: PAD_Y + row * CELL_H + CELL_H / 2
      };
    }

    // Draw prerequisite lines first
    Object.keys(UPGRADES).forEach(function(id) {
      var upg = UPGRADES[id];
      if (!upg.requires) return;
      var from = null;
      Object.keys(UPGRADES).forEach(function(id2) {
        if (id2 === upg.requires) from = UPGRADES[id2];
      });
      if (!from) return;
      var p1 = nodeCenter(from.row, from.col);
      var p2 = nodeCenter(upg.row, upg.col);
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);

      var fromLvl = G.upgrades[upg.requires] || 0;
      var fromMax = from.maxLevel;
      line.setAttribute('stroke', fromLvl >= fromMax ? 'rgba(75,200,240,0.35)' : 'rgba(100,100,150,0.2)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', fromLvl >= fromMax ? '' : '5 4');
      svg.appendChild(line);
    });

    // Draw nodes
    Object.keys(UPGRADES).forEach(function(id) {
      var upg = UPGRADES[id];
      var lvl = G.upgrades[id] || 0;
      var maxed = lvl >= upg.maxLevel;
      var cost = upg.cost[lvl] || null;
      var canAfford = !maxed && cost !== null && G.light >= cost;

      // Check prereqs
      var prereqMet = true;
      if (upg.requires) {
        var reqLvl = G.upgrades[upg.requires] || 0;
        var reqMax = UPGRADES[upg.requires] ? UPGRADES[upg.requires].maxLevel : 1;
        if (reqLvl < reqMax) prereqMet = false;
      }
      // Gate: only show if gem count >= gate
      if (upg.gate && G.gems < upg.gate) prereqMet = false;

      var center = nodeCenter(upg.row, upg.col);
      var isDiamond = upg.shape === 'diamond';
      var SZ = isDiamond ? 28 : 20;

      // Node shape
      var shape;
      if (isDiamond) {
        shape = document.createElementNS(ns, 'polygon');
        shape.setAttribute('points',
          '0,' + (-SZ) + ' ' + SZ + ',0 0,' + SZ + ' ' + (-SZ) + ',0'
        );
      } else {
        shape = document.createElementNS(ns, 'rect');
        shape.setAttribute('x', -SZ); shape.setAttribute('y', -SZ);
        shape.setAttribute('width', SZ * 2); shape.setAttribute('height', SZ * 2);
        shape.setAttribute('rx', '4');
      }

      // Colour coding
      var fillColor, strokeColor, strokeW;
      if (maxed) {
        fillColor = isDiamond ? 'rgba(200,168,75,0.6)' : 'rgba(75,200,240,0.35)';
        strokeColor = isDiamond ? '#c8a84b' : '#4bc8f0';
        strokeW = '2';
      } else if (!prereqMet) {
        fillColor = 'rgba(30,30,50,0.6)';
        strokeColor = 'rgba(80,80,120,0.4)';
        strokeW = '1';
      } else if (canAfford) {
        fillColor = isDiamond ? 'rgba(200,168,75,0.2)' : 'rgba(75,200,240,0.15)';
        strokeColor = isDiamond ? '#c8a84b' : '#4bc8f0';
        strokeW = '2';
      } else {
        fillColor = 'rgba(20,20,40,0.7)';
        strokeColor = isDiamond ? 'rgba(200,168,75,0.4)' : 'rgba(75,200,200,0.25)';
        strokeW = '1.5';
      }

      shape.setAttribute('fill', fillColor);
      shape.setAttribute('stroke', strokeColor);
      shape.setAttribute('stroke-width', strokeW);

      // Gold glow for diamond mechanic unlocks visible even when locked
      if (isDiamond) {
        shape.setAttribute('filter', 'url(#upg-glow)');
      }

      // Pulse animation for affordable nodes
      if (canAfford && !maxed) {
        shape.setAttribute('class', 'upg-node-pulse');
      }

      var g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', 'translate(' + center.x + ',' + center.y + ')');
      g.setAttribute('cursor', 'pointer');
      g.appendChild(shape);

      // Label
      var lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', '0');
      lbl.setAttribute('y', SZ + 14);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-size', '9');
      lbl.setAttribute('font-family', 'system-ui,sans-serif');
      lbl.setAttribute('fill', prereqMet ? (isDiamond ? '#c8a84b' : '#4bc8f0') : '#505080');
      lbl.textContent = upg.label;
      g.appendChild(lbl);

      // Level indicator
      if (!isDiamond && upg.maxLevel > 1) {
        var lvlText = document.createElementNS(ns, 'text');
        lvlText.setAttribute('x', '0'); lvlText.setAttribute('y', '5');
        lvlText.setAttribute('text-anchor', 'middle');
        lvlText.setAttribute('font-size', '11');
        lvlText.setAttribute('font-weight', 'bold');
        lvlText.setAttribute('font-family', 'system-ui,sans-serif');
        lvlText.setAttribute('fill', '#e8f4ff');
        lvlText.textContent = maxed ? '✓' : (lvl + '/' + upg.maxLevel);
        g.appendChild(lvlText);
      } else if (maxed) {
        var checkText = document.createElementNS(ns, 'text');
        checkText.setAttribute('x', '0'); checkText.setAttribute('y', '6');
        checkText.setAttribute('text-anchor', 'middle');
        checkText.setAttribute('font-size', isDiamond ? '14' : '12');
        checkText.setAttribute('font-family', 'system-ui,sans-serif');
        checkText.setAttribute('fill', '#e8f4ff');
        checkText.textContent = '✓';
        g.appendChild(checkText);
      }

      // Cost label below
      if (!maxed && cost !== null) {
        var costLabel = document.createElementNS(ns, 'text');
        costLabel.setAttribute('x', '0');
        costLabel.setAttribute('y', SZ + 26);
        costLabel.setAttribute('text-anchor', 'middle');
        costLabel.setAttribute('font-size', '8');
        costLabel.setAttribute('font-family', 'system-ui,sans-serif');
        costLabel.setAttribute('fill', canAfford ? '#e8d050' : '#505070');
        costLabel.textContent = '✨' + _fmt(cost);
        g.appendChild(costLabel);
      }

      // Click handler
      g.setAttribute('data-upg-id', id);
      g.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        window.purchaseUpgrade(id);
      });

      svg.appendChild(g);
    });

    // Inject inline styles for upgrade tree
    var style = document.createElementNS(ns, 'style');
    style.textContent = [
      '@keyframes upg-pulse { 0%,100%{opacity:0.85} 50%{opacity:1} }',
      '.upg-node-pulse { animation: upg-pulse 1.2s ease-in-out infinite; }'
    ].join('');
    svg.insertBefore(style, svg.firstChild);

    // Filter for diamond glow
    var defs = document.createElementNS(ns, 'defs');
    var flt = document.createElementNS(ns, 'filter');
    flt.setAttribute('id', 'upg-glow');
    flt.setAttribute('x', '-60%'); flt.setAttribute('y', '-60%');
    flt.setAttribute('width', '320%'); flt.setAttribute('height', '320%');
    var blur = document.createElementNS(ns, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic'); blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'b');
    var merge = document.createElementNS(ns, 'feMerge');
    var mn1 = document.createElementNS(ns, 'feMergeNode'); mn1.setAttribute('in', 'b');
    var mn2 = document.createElementNS(ns, 'feMergeNode'); mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1); merge.appendChild(mn2);
    flt.appendChild(blur); flt.appendChild(merge);
    defs.appendChild(flt);
    svg.insertBefore(defs, svg.firstChild);
  };

  // ======================================================
  // UPGRADE MODAL OPEN / CLOSE
  // ======================================================
  window.openUpgradeModal = function() {
    _upgradeOpen = true;
    window.renderUpgradeTree();
    document.getElementById('upgrade-modal').classList.remove('hidden');
  };

  window.closeUpgradeModal = function() {
    _upgradeOpen = false;
    document.getElementById('upgrade-modal').classList.add('hidden');
  };

  // ======================================================
  // PRESTIGE MODAL
  // ======================================================
  window.showPrestigeModal = function() {
    var toGain = 1 + (G.vaultShards || 0);
    var msg =
      '<div style="font-size:22px;color:#c8a84b;font-weight:300;letter-spacing:2px;margin-bottom:14px">✦ RESTORE THE VAULT ✦</div>' +
      '<p style="color:#aaa;font-size:13px;margin-bottom:12px">The Chromatic Vault glows with ' + Math.floor(G.gems) + ' forged gems.</p>' +
      '<div style="background:rgba(200,168,75,0.08);border:1px solid rgba(200,168,75,0.3);border-radius:8px;padding:12px 20px;margin-bottom:16px">' +
        '<div style="color:#c8a84b;font-size:13px;margin-bottom:6px">You will gain: <strong>+1 Vault Shard</strong></div>' +
        '<div style="color:#aaa;font-size:11px">Total shards after prestige: ' + toGain + '</div>' +
        '<div style="color:#aaa;font-size:11px;margin-top:4px">Each shard boosts all gem values +10%</div>' +
      '</div>' +
      '<div style="font-size:11px;color:#505080;margin-bottom:16px">Resets: Light, Gems, Orbs, Vats<br>Keeps: Unlocks, Upgrades, Shards</div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
        '<button id="prestige-confirm-btn" style="background:rgba(200,168,75,0.2);border:1px solid #c8a84b;color:#c8a84b;border-radius:8px;padding:10px 22px;cursor:pointer;font-size:14px;touch-action:manipulation">Restore Vault ✦</button>' +
        '<button id="prestige-cancel-btn" style="background:rgba(80,80,120,0.2);border:1px solid #505080;color:#aaa;border-radius:8px;padding:10px 22px;cursor:pointer;font-size:14px;touch-action:manipulation">Cancel</button>' +
      '</div>';

    _showInfoModal('PRESTIGE', msg, true);

    setTimeout(function() {
      var cfm = document.getElementById('prestige-confirm-btn');
      var cnl = document.getElementById('prestige-cancel-btn');
      if (cfm) cfm.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        _closeInfoModal();
        setTimeout(function() { window.doPrestige(); }, 50);
      });
      if (cnl) cnl.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        _closeInfoModal();
      });
    }, 100);
  };

  // ======================================================
  // PRESTIGE FLASH ANIMATION
  // ======================================================
  window.playPrestigeFlash = function(cb) {
    var flash = document.getElementById('prestige-flash');
    var msg   = document.getElementById('prestige-msg');
    if (!flash) { if (cb) cb(); return; }
    msg.textContent = '✦ THE VAULT IS RESTORED ✦';
    flash.classList.remove('hidden');
    setTimeout(function() {
      flash.classList.add('hidden');
      if (cb) cb();
    }, 2200);
  };

  // ======================================================
  // EXPORT / IMPORT / RESET SAVE
  // ======================================================
  window.openExportModal = function() {
    var saveData = window.getSaveState();
    var encoded = btoa(JSON.stringify(saveData));
    document.getElementById('save-modal-title').textContent = 'Export Save';
    document.getElementById('save-modal-desc').textContent = 'Copy this code to transfer your save:';
    var ta = document.getElementById('save-textarea');
    ta.value = encoded;
    ta.readOnly = true;
    document.getElementById('save-copy-btn').classList.remove('hidden');
    document.getElementById('save-import-btn').classList.add('hidden');
    document.getElementById('save-modal').classList.remove('hidden');
  };

  window.openImportModal = function() {
    document.getElementById('save-modal-title').textContent = 'Import Save';
    document.getElementById('save-modal-desc').textContent = 'Paste your save code below:';
    var ta = document.getElementById('save-textarea');
    ta.value = '';
    ta.readOnly = false;
    document.getElementById('save-copy-btn').classList.add('hidden');
    document.getElementById('save-import-btn').classList.remove('hidden');
    document.getElementById('save-modal').classList.remove('hidden');
  };

  window.closeSaveModal = function() {
    document.getElementById('save-modal').classList.add('hidden');
  };

  window.doImportSave = function() {
    var ta = document.getElementById('save-textarea');
    try {
      var decoded = JSON.parse(atob(ta.value.trim()));
      window.loadSaveState(decoded);
      window.closeSaveModal();
      if (window.recomputeMultipliers) window.recomputeMultipliers();
      if (window.updateHUD) window.updateHUD();
      if (window.renderUpgradeTree) window.renderUpgradeTree();
    } catch(e) {
      alert('Invalid save code. Please check and try again.');
    }
  };

  // ======================================================
  // ONBOARDING
  // ======================================================
  window.checkOnboarding = function() {
    if (G.onboarding === 0) {
      // Show overlay — already visible in HTML; arrow points to center
      var overlay = document.getElementById('onboard-overlay');
      if (overlay) overlay.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        _dismissOnboard0();
      }, { once: true });
    } else if (G.onboarding >= 3) {
      _clearOnboard();
    }
  };

  window.advanceOnboarding = function(step) {
    if (G.onboarding >= 3) return;
    if (step === 1 && G.onboarding < 1) {
      G.onboarding = 1;
      _dismissOnboard0();
      setTimeout(function() {
        var hint = document.getElementById('hint-vat');
        if (hint) {
          hint.classList.remove('hidden');
          setTimeout(function() { hint.classList.add('hidden'); }, 5000);
        }
      }, 1000);
    } else if (step === 2 && G.onboarding < 2) {
      G.onboarding = 2;
      setTimeout(function() {
        var hint = document.getElementById('hint-upgrade');
        if (hint) {
          hint.classList.remove('hidden');
          setTimeout(function() { hint.classList.add('hidden'); }, 6000);
        }
      }, 500);
    } else if (step === 3 && G.onboarding < 3) {
      G.onboarding = 3;
    }
  };

  function _dismissOnboard0() {
    var overlay = document.getElementById('onboard-overlay');
    if (!overlay || overlay.classList.contains('gone')) return;
    overlay.classList.add('fading');
    setTimeout(function() {
      overlay.classList.add('gone');
    }, 600);
    if (G.onboarding < 1) G.onboarding = 1;
  }

  function _clearOnboard() {
    var overlay = document.getElementById('onboard-overlay');
    if (overlay) overlay.classList.add('gone');
  }

  // ======================================================
  // INFO MODAL (generic reusable)
  // ======================================================
  var _infoModal = null;

  function _showInfoModal(title, htmlContent, rawHtml) {
    if (_infoModal) _closeInfoModal();

    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:250',
      'background:rgba(0,0,0,0.75)', 'display:flex',
      'align-items:center', 'justify-content:center',
      'backdrop-filter:blur(4px)'
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
      'background:#0c0c22',
      'border:1px solid rgba(75,200,240,0.3)',
      'border-radius:14px',
      'padding:28px 32px',
      'max-width:460px',
      'width:90vw',
      'text-align:center',
      'box-shadow:0 0 40px rgba(75,200,240,0.15)'
    ].join(';');

    if (rawHtml) {
      box.innerHTML = htmlContent;
    } else {
      box.innerHTML =
        '<div style="font-size:18px;color:#4bc8f0;margin-bottom:12px">' + title + '</div>' +
        '<div style="font-size:13px;color:#aaa">' + htmlContent + '</div>';
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    _infoModal = overlay;

    overlay.addEventListener('pointerdown', function(e) {
      if (e.target === overlay) _closeInfoModal();
    });
  }

  function _closeInfoModal() {
    if (_infoModal && _infoModal.parentNode) {
      _infoModal.parentNode.removeChild(_infoModal);
    }
    _infoModal = null;
  }

  // ======================================================
  // STORM RESULT BANNER
  // ======================================================
  window.showStormResult = function(caught, total) {
    var el = document.getElementById('storm-result');
    if (!el) return;
    el.textContent = caught + ' of ' + total + ' sparks caught! +' + (caught * 3) + ' gems';
    el.classList.remove('hidden');
    setTimeout(function() { el.classList.add('hidden'); }, 3000);
  };

  // ======================================================
  // WIRE UP STATIC BUTTONS
  // ======================================================
  document.addEventListener('DOMContentLoaded', function() {
    var btnUpgrades = document.getElementById('btn-upgrades');
    var btnExport   = document.getElementById('btn-export');
    var btnImport   = document.getElementById('btn-import');
    var btnPrestige = document.getElementById('btn-prestige');
    var upgradeClose= document.getElementById('upgrade-close');
    var saveClose   = document.getElementById('save-close');
    var saveCopyBtn = document.getElementById('save-copy-btn');
    var saveImportBtn = document.getElementById('save-import-btn');
    var upgradeModal  = document.getElementById('upgrade-modal');

    if (btnUpgrades) btnUpgrades.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      if (_upgradeOpen) window.closeUpgradeModal();
      else window.openUpgradeModal();
    });

    if (btnExport) btnExport.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      window.openExportModal();
    });

    if (btnImport) btnImport.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      window.openImportModal();
    });

    if (btnPrestige) btnPrestige.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      if (G.vaultCompletion >= 100) window.showPrestigeModal();
    });

    if (upgradeClose) upgradeClose.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      window.closeUpgradeModal();
    });

    if (saveClose) saveClose.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      window.closeSaveModal();
    });

    if (saveCopyBtn) saveCopyBtn.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      var ta = document.getElementById('save-textarea');
      if (ta) {
        ta.select();
        try { document.execCommand('copy'); } catch(ex) {}
        navigator.clipboard && navigator.clipboard.writeText(ta.value).catch(function(){});
        saveCopyBtn.textContent = 'Copied!';
        setTimeout(function() { saveCopyBtn.textContent = 'Copy to Clipboard'; }, 2000);
      }
    });

    if (saveImportBtn) saveImportBtn.addEventListener('pointerdown', function(e) {
      e.stopPropagation();
      window.doImportSave();
    });

    // Close upgrade modal on backdrop tap
    if (upgradeModal) upgradeModal.addEventListener('pointerdown', function(e) {
      if (e.target === upgradeModal) window.closeUpgradeModal();
    });
  });

})();
