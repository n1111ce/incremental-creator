var DEBUG_LOGS = [];

function debugLog(msg) {
  var ts = new Date().toLocaleTimeString();
  DEBUG_LOGS.unshift('[' + ts + '] ' + msg);
  if (DEBUG_LOGS.length > 80) DEBUG_LOGS.length = 80;
  var el = document.getElementById('dbg-log');
  if (el) el.textContent = DEBUG_LOGS.join('\n');
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
    '#dbg-header h2{font-size:13px;color:#eee;font-weight:600;letter-spacing:1px}' +
    '#dbg-header-btns{display:flex;gap:8px}' +
    '#dbg-reset{background:#5a1a1a;border:1px solid #a03030;color:#ff8080;' +
    'border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;font-family:monospace}' +
    '#dbg-reset:hover{background:#7a2020}' +
    '#dbg-close{background:#222;border:1px solid #444;color:#aaa;' +
    'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-family:monospace}' +
    '#dbg-close:hover{color:#eee}' +
    '#dbg-body{display:flex;flex:1;overflow:hidden;gap:0}' +
    '#dbg-state-wrap,#dbg-log-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;' +
    'border-right:1px solid #222}' +
    '#dbg-log-wrap{border-right:none}' +
    '#dbg-section-title{padding:8px 14px 4px;color:#888;font-size:10px;letter-spacing:1px;' +
    'text-transform:uppercase;flex-shrink:0;border-bottom:1px solid #1a1a1a}' +
    '#dbg-state,#dbg-log{flex:1;overflow-y:auto;padding:10px 14px;white-space:pre;' +
    'color:#b0e0b0;line-height:1.5;font-size:11px}' +
    '#dbg-log{color:#a0c8e0}' +
    '#dbg-state::-webkit-scrollbar,#dbg-log::-webkit-scrollbar{width:4px}' +
    '#dbg-state::-webkit-scrollbar-thumb,#dbg-log::-webkit-scrollbar-thumb{background:#333}';
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
    });

    document.getElementById('dbg-close').addEventListener('click', function() {
      panel.classList.remove('open');
    });

    document.getElementById('dbg-reset').addEventListener('click', debugHardReset);
  });
})();
