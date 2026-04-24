// ui.js — drawer, HUD updates, story text, onboarding overlay, skill node rendering

// ---------------------------------------------------------------------------
// Story text
// ---------------------------------------------------------------------------
var storyTimer = null;

function showStory(text) {
  var storyEl = document.getElementById('story-text');
  clearTimeout(storyTimer);
  storyEl.textContent = text;
  storyEl.style.opacity = '1';
  storyTimer = setTimeout(function() { storyEl.style.opacity = '0'; }, 4500);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
  document.getElementById('spore-disp').textContent = fmt(G.spores);
  document.getElementById('sps-disp').textContent   = '+' + getSporesPerSec().toFixed(1) + '/s';
  document.getElementById('seeds-disp').textContent  = G.seeds;
  var count = G.unlocked.length;
  document.getElementById('skill-count-badge').textContent = '(' + count + ')';
  document.getElementById('drawer-progress').textContent   = count + ' / ' + TREE.length + ' awakened';
  document.getElementById('rebirth-btn').style.display = G.unlocked.indexOf('canopy_crown') !== -1 ? 'block' : 'none';
}

// ---------------------------------------------------------------------------
// Skill drawer
// ---------------------------------------------------------------------------
function renderDrawer() {
  var body = document.getElementById('drawer-body');
  body.innerHTML = '';

  function renderNode(node, container) {
    var unlocked  = G.unlocked.indexOf(node.id) !== -1;
    var prereqMet = node.parent === null || G.unlocked.indexOf(node.parent) !== -1;
    var div = document.createElement('div');
    div.className = 'skill-node ' + (unlocked ? 'unlocked' : prereqMet ? 'available' : 'locked');
    div.id = 'sn-' + node.id;
    div.innerHTML =
      '<div class="sn-name">' + node.name + '</div>' +
      '<div class="sn-lore">' + node.lore + '</div>' +
      (node.effect ? '<div class="sn-effect">' + node.effect + '</div>' : '') +
      (!unlocked && node.cost > 0 ? '<div class="sn-cost">Cost: ' + fmt(node.cost) + ' spores</div>' : '');

    if (prereqMet && !unlocked) {
      div.style.cursor = 'pointer';
      (function(n) {
        div.addEventListener('click', function() { buyNode(n); });
      })(node);
    }
    container.appendChild(div);

    var children = TREE.filter(function(n) { return n.parent === node.id; });
    if (children.length) {
      var sub = document.createElement('div');
      sub.className = 'tree-connector';
      for (var i = 0; i < children.length; i++) renderNode(children[i], sub);
      container.appendChild(sub);
    }
  }

  var root = TREE.find(function(n) { return n.parent === null; });
  renderNode(root, body);
}

// ---------------------------------------------------------------------------
// Onboarding overlay
// ---------------------------------------------------------------------------
function showOnboarding() {
  var el = document.getElementById('onboarding');
  el.style.display = 'flex';
  el.style.opacity = '1';
}

function hideOnboarding() {
  localStorage.setItem(SAVE_KEY + '_seen', '1');
  var el = document.getElementById('onboarding');
  el.style.transition = 'opacity 0.6s';
  el.style.opacity = '0';
  setTimeout(function() {
    el.style.display = 'none';
    showStumpHint();
  }, 600);
}

// ---------------------------------------------------------------------------
// Stump hint
// ---------------------------------------------------------------------------
function showStumpHint() {
  drawHintAt(STUMP_DEFS[0]);
}

// ---------------------------------------------------------------------------
// Wire up static UI events (call once after DOMContentLoaded)
// ---------------------------------------------------------------------------
function initUI() {
  var drawerEl = document.getElementById('drawer');

  document.getElementById('skills-toggle').addEventListener('click', function() {
    var open = drawerEl.classList.toggle('open');
    if (open) renderDrawer();
  });

  document.getElementById('drawer-close').addEventListener('click', function() {
    drawerEl.classList.remove('open');
  });

  document.getElementById('rebirth-btn').addEventListener('click', prestige);

  document.getElementById('ob-continue').addEventListener('click', hideOnboarding);
}
