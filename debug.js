var DEBUG_LOGS = [];
var DEBUG_ACTIONS = [];

function debugLog(msg) {
  var ts = new Date().toLocaleTimeString();
  DEBUG_LOGS.unshift('[' + ts + '] ' + msg);
  if (DEBUG_LOGS.length > 80) DEBUG_LOGS.length = 80;
  var el = document.getElementById('dbg-log');
  if (el) el.textContent = DEBUG_LOGS.join('\n');
}

function registerDebugAction(label, fn, category) {
  DEBUG_ACTIONS.push({ label: label, fn: fn, category: category || 'misc' });
  var wrap = document.getElementById('dbg-god-wrap');
  if (wrap) renderDebugActions();
}

function renderDebugActions() {
  var wrap = document.getElementById('dbg-god-body');
  if (!wrap) return;
  wrap.innerHTML = '';
  var groups = {};
  DEBUG_ACTIONS.forEach(function(a) {
    if (!groups[a.category]) groups[a.category] = [];
    groups[a.category].push(a);
  });
  var order = ['currency', 'skills', 'mechanics', 'time', 'prestige', 'misc'];
  Object.keys(groups).sort(function(a, b) {
    var ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia < 0) ia = 99; if (ib < 0) ib = 99;
    return ia - ib;
  }).forEach(function(cat) {
    var g = document.createElement('div');
    g.className = 'dbg-god-group';
    var h = document.createElement('div');
    h.className = 'dbg-god-cat';
    h.textContent = cat;
    g.appendChild(h);
    var row = document.createElement('div');
    row.className = 'dbg-god-row';
    groups[cat].forEach(function(a) {
      var b = document.createElement('button');
      b.className = 'dbg-god-btn';
      b.textContent = a.label;
      b.addEventListener('click', function() {
        try {
          a.fn();
          debugLog('GOD: ' + a.label);
          var state = document.getElementById('dbg-state');
          if (state) state.textContent = debugDumpState();
        } catch (e) {
          debugLog('GOD ERROR: ' + a.label + ' — ' + e.message);
        }
      });
      row.appendChild(b);
    });
    g.appendChild(row);
    wrap.appendChild(g);
  });
  if (DEBUG_ACTIONS.length === 0) {
    wrap.innerHTML = '<div class="dbg-god-empty">No god-mode actions registered for this game.</div>';
  }
}

function debugHardReset() {
  if (!confirm('Hard reset? All progress will be lost.')) return;
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (typeof SAVE_KEY !== 'undefined' && k && k.indexOf(SAVE_KEY) === 0) {
        localStorage.removeItem(k);
      }
    }
  } catch(e) {}
  location.reload();
}

function debugDumpState() {
  if (typeof G === 'undefined') return '(no global G found)';
  try { return JSON.stringify(G, null, 2); } catch(e) { return String(e); }
}

(function() {
  var style = document.createElement('style');
  style.textContent =
    '#dbg-btn{position:fixed;bottom:20px;left:20px;z-index:9000;background:rgba(0,0,0,0.55);' +
    'border:1px solid #444;border-radius:8px;color:#888;font-size:11px;padding:5px 10px;' +
    'cursor:pointer;font-family:monospace;letter-spacing:0.5px;transition:color 0.2s}' +
    '#dbg-btn:hover{color:#ccc}' +
    '#dbg-panel{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);' +
    'display:none;flex-direction:column;font-family:monospace;font-size:12px;color:#c8c8c8}' +
    '#dbg-panel.open{display:flex}' +
    '#dbg-header{display:flex;align-items:center;justify-content:space-between;' +
    'padding:10px 16px;border-bottom:1px solid #333;flex-shrink:0}' +
    '#dbg-header h2{font-size:13px;color:#eee;font-weight:600;letter-spacing:1px;margin:0}' +
    '#dbg-header-btns{display:flex;gap:8px}' +
    '#dbg-reset{background:#5a1a1a;border:1px solid #a03030;color:#ff8080;' +
    'border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;font-family:monospace}' +
    '#dbg-reset:hover{background:#7a2020}' +
    '#dbg-close{background:#222;border:1px solid #444;color:#aaa;' +
    'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-family:monospace}' +
    '#dbg-close:hover{color:#eee}' +
    '#dbg-body{display:flex;flex:1;overflow:hidden;gap:0}' +
    '#dbg-god-wrap{flex:0 0 34%;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid #222;min-width:260px}' +
    '#dbg-state-wrap,#dbg-log-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;' +
    'border-right:1px solid #222}' +
    '#dbg-log-wrap{border-right:none}' +
    '#dbg-section-title{padding:8px 14px 4px;color:#888;font-size:10px;letter-spacing:1px;' +
    'text-transform:uppercase;flex-shrink:0;border-bottom:1px solid #1a1a1a}' +
    '.dbg-god-banner{padding:4px 14px 8px;color:#f5c26b;font-size:9px;letter-spacing:1px}' +
    '#dbg-god-body{flex:1;overflow-y:auto;padding:6px 10px 14px}' +
    '.dbg-god-group{margin-top:10px}' +
    '.dbg-god-cat{color:#888;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;padding:4px 4px 6px}' +
    '.dbg-god-row{display:flex;flex-wrap:wrap;gap:6px}' +
    '.dbg-god-btn{background:#1d1a10;border:1px solid #5a4820;color:#f5c26b;border-radius:6px;' +
    'padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;letter-spacing:0.3px;' +
    'transition:all 0.15s;touch-action:manipulation}' +
    '.dbg-god-btn:hover{background:#2d2718;border-color:#8a6c30;color:#ffd88a}' +
    '.dbg-god-btn:active{transform:scale(0.96)}' +
    '.dbg-god-empty{color:#666;font-size:11px;padding:12px 14px;font-style:italic}' +
    '#dbg-state,#dbg-log{flex:1;overflow-y:auto;padding:10px 14px;white-space:pre;' +
    'color:#b0e0b0;line-height:1.5;font-size:11px}' +
    '#dbg-log{color:#a0c8e0}' +
    '#dbg-state::-webkit-scrollbar,#dbg-log::-webkit-scrollbar,#dbg-god-body::-webkit-scrollbar{width:4px}' +
    '#dbg-state::-webkit-scrollbar-thumb,#dbg-log::-webkit-scrollbar-thumb,#dbg-god-body::-webkit-scrollbar-thumb{background:#333}' +
    '@media (max-width: 900px){#dbg-body{flex-direction:column}#dbg-god-wrap,#dbg-state-wrap,#dbg-log-wrap{flex:1 1 auto;border-right:none;border-bottom:1px solid #222;min-height:30%}}';
  document.head.appendChild(style);

  window.addEventListener('DOMContentLoaded', function() {
    var btn = document.createElement('button');
    btn.id = 'dbg-btn';
    btn.textContent = '⚙ debug';
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.innerHTML =
      '<div id="dbg-header">' +
        '<h2>DEBUG</h2>' +
        '<div id="dbg-header-btns">' +
          '<button id="dbg-reset">⚠ Hard Reset</button>' +
          '<button id="dbg-close">✕ Close</button>' +
        '</div>' +
      '</div>' +
      '<div id="dbg-body">' +
        '<div id="dbg-god-wrap">' +
          '<div id="dbg-section-title">God Mode</div>' +
          '<div class="dbg-god-banner">test faster — no clicking a trillion times</div>' +
          '<div id="dbg-god-body"></div>' +
        '</div>' +
        '<div id="dbg-state-wrap">' +
          '<div id="dbg-section-title">Game State (G)</div>' +
          '<pre id="dbg-state"></pre>' +
        '</div>' +
        '<div id="dbg-log-wrap">' +
          '<div id="dbg-section-title">Event Log</div>' +
          '<pre id="dbg-log"></pre>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    btn.addEventListener('click', function() {
      panel.classList.add('open');
      document.getElementById('dbg-state').textContent = debugDumpState();
      document.getElementById('dbg-log').textContent = DEBUG_LOGS.join('\n');
      renderDebugActions();
    });

    document.getElementById('dbg-close').addEventListener('click', function() {
      panel.classList.remove('open');
    });

    document.getElementById('dbg-reset').addEventListener('click', debugHardReset);

    renderDebugActions();
  });
})();
