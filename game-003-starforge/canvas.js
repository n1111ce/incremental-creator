// canvas.js — procedural SVG/Canvas rendering + all new visual mechanics

var skyCanvas, constellationLayer, starLayer, particleLayer, flyingStarLayer;
var forgeSvg, anvilHit, hammerGroup, emberOuter, emberCore, emberHot;

// Twin anvil refs
var anvilHit2, hammerGroup2, emberOuter2, emberCore2, emberHot2;

// Shooting star, moon, chain-lightning layers
var shootingStarLayer, moonEl, chainLightningLayer, cometLayer;

// ============================================================
// Init
// ============================================================
function initCanvasRefs() {
  skyCanvas          = document.getElementById('sky-canvas');
  constellationLayer = document.getElementById('constellation-layer');
  starLayer          = document.getElementById('star-layer');
  particleLayer      = document.getElementById('particle-layer');
  flyingStarLayer    = document.getElementById('flying-star-layer');
  shootingStarLayer  = document.getElementById('shooting-star-layer');
  chainLightningLayer= document.getElementById('chain-lightning-layer');
  cometLayer         = document.getElementById('comet-layer');
  forgeSvg           = document.getElementById('forge-svg');
  anvilHit           = document.getElementById('anvil-hit');
  hammerGroup        = document.getElementById('hammer-group');
  emberOuter         = document.getElementById('ember-outer');
  emberCore          = document.getElementById('ember-core');
  emberHot           = document.getElementById('ember-hot');
}

function svgEl(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function initCanvas() {
  initCanvasRefs();
}

// ============================================================
// Ember — pulses with heat
// ============================================================
function updateEmber(heat) {
  if (!emberOuter) return;
  var r = 3 + heat / 10;
  var rOuter = r * 2.5;
  var opacity = 0.5 + heat / 200;
  emberOuter.setAttribute('r', String(rOuter));
  emberCore.setAttribute('r', String(r));
  emberHot.setAttribute('r', String(r * 0.5));
  emberOuter.setAttribute('opacity', String(Math.min(1, opacity)));
  var hue = 30 + (heat / 100) * 20;
  emberCore.setAttribute('fill', 'hsl(' + hue + ',100%,65%)');
}

function updateEmber2(heat) {
  if (!emberOuter2) return;
  var r = 3 + heat / 10;
  var rOuter = r * 2.5;
  var opacity = 0.5 + heat / 200;
  emberOuter2.setAttribute('r', String(rOuter));
  emberCore2.setAttribute('r', String(r));
  emberHot2.setAttribute('r', String(r * 0.5));
  emberOuter2.setAttribute('opacity', String(Math.min(1, opacity)));
  var hue = 30 + (heat / 100) * 20;
  emberCore2.setAttribute('fill', 'hsl(' + hue + ',100%,65%)');
}

// ============================================================
// Hammer swing
// ============================================================
var _hammerSwinging = false;
var _hammerSwinging2 = false;

function swingHammer(which) {
  if (which === 2) {
    if (_hammerSwinging2 || !hammerGroup2) return;
    _hammerSwinging2 = true;
    var hg = hammerGroup2;
    hg.style.transition = 'transform 120ms ease-in';
    hg.style.transform = 'rotate(15deg)';
    hg.style.transformOrigin = '195px 70px';
    setTimeout(function() {
      hg.style.transition = 'transform 200ms ease-out';
      hg.style.transform = 'rotate(-20deg)';
      setTimeout(function() {
        hg.style.transition = '';
        hg.style.transform = '';
        _hammerSwinging2 = false;
      }, 200);
    }, 120);
  } else {
    if (_hammerSwinging) return;
    _hammerSwinging = true;
    hammerGroup.style.transition = 'transform 120ms ease-in';
    hammerGroup.style.transform = 'rotate(15deg)';
    hammerGroup.style.transformOrigin = '195px 70px';
    setTimeout(function() {
      hammerGroup.style.transition = 'transform 200ms ease-out';
      hammerGroup.style.transform = 'rotate(-20deg)';
      setTimeout(function() {
        hammerGroup.style.transition = '';
        hammerGroup.style.transform = '';
        _hammerSwinging = false;
      }, 200);
    }, 120);
  }
}

// ============================================================
// Sparks on strike
// ============================================================
function spawnSparks(count, whichAnvil) {
  var svgRect;
  if (whichAnvil === 2 && forgeSvg2) {
    svgRect = forgeSvg2.getBoundingClientRect();
  } else {
    if (!forgeSvg) return;
    svgRect = forgeSvg.getBoundingClientRect();
  }
  var scaleX = svgRect.width / 240;
  var scaleY = svgRect.height / 180;
  var cx = svgRect.left + 120 * scaleX;
  var cy = svgRect.top + 80 * scaleY;

  for (var i = 0; i < count; i++) {
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    var speed = 60 + Math.random() * 90;
    var dx = Math.cos(angle) * speed;
    var dy = Math.sin(angle) * speed;
    var size = 3 + Math.random() * 4;
    spawnSparkAt(cx, cy, dx, dy, size);
  }
}

function spawnSparkAt(cx, cy, dx, dy, size) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;border-radius:50%;pointer-events:none;z-index:80;' +
    'width:' + (size*2) + 'px;height:' + (size*2) + 'px;' +
    'background:' + (Math.random() < 0.5 ? '#ffcc40' : '#ff8020') + ';' +
    'left:' + (cx - size) + 'px;top:' + (cy - size) + 'px;';
  document.body.appendChild(el);
  var start = performance.now();
  var dur = 500 + Math.random() * 300;
  (function animate(now) {
    var t = Math.min(1, (now - start) / dur);
    var ease = 1 - t * t;
    el.style.left = (cx - size + dx * t) + 'px';
    el.style.top  = (cy - size + dy * t + 80 * t * t) + 'px';
    el.style.opacity = String(ease * 0.9);
    el.style.transform = 'scale(' + (1 - t * 0.6) + ')';
    if (t < 1) requestAnimationFrame(animate);
    else if (el.parentNode) el.parentNode.removeChild(el);
  })(start);
}

// ============================================================
// Star SVG shape builder
// ============================================================
function makeStarPath(cx, cy, points, outerR, innerR) {
  var path = '';
  for (var i = 0; i < points * 2; i++) {
    var angle = (i * Math.PI / points) - Math.PI / 2;
    var r = i % 2 === 0 ? outerR : innerR;
    var x = cx + Math.cos(angle) * r;
    var y = cy + Math.sin(angle) * r;
    path += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  return path + 'Z';
}

function addSkyStarElement(starData, index) {
  var points = 5 + (index % 5);
  var outerR = starData.size;
  var innerR = outerR * 0.42;
  var twinkleDur = (starData.speed || 2) + 's';
  var twinkleDelay = (starData.phase || 0) + 's';

  var g = svgEl('g', { class: 'sky-star', 'data-idx': String(index) });
  var halo = svgEl('circle', {
    cx: String(starData.x), cy: String(starData.y),
    r: String(outerR * 1.8),
    fill: palette()[2],
    opacity: '0.18',
    filter: 'url(#star-glow)'
  });
  var path = svgEl('path', {
    d: makeStarPath(starData.x, starData.y, points, outerR, innerR),
    fill: '#fff8e0',
    filter: 'url(#star-glow)'
  });
  path.style.animation = 'star-twinkle ' + twinkleDur + ' ' + twinkleDelay + ' ease-in-out infinite';
  g.appendChild(halo);
  g.appendChild(path);
  starLayer.appendChild(g);
}

function rebuildAllStars() {
  starLayer.innerHTML = '';
  for (var i = 0; i < G.skyStars.length; i++) {
    addSkyStarElement(G.skyStars[i], i);
  }
}

// ============================================================
// Flying star animation (anvil → sky position)
// ============================================================
function animateFlyingStar(targetX, targetY, onComplete, whichAnvil) {
  var theSvg = (whichAnvil === 2 && forgeSvg2) ? forgeSvg2 : forgeSvg;
  var svgRect = theSvg.getBoundingClientRect();
  var scaleX = svgRect.width / 240;
  var scaleY = svgRect.height / 180;
  var startX = svgRect.left + 120 * scaleX;
  var startY = svgRect.top + 80 * scaleY;

  var skyRect = skyCanvas.getBoundingClientRect();
  var endX = skyRect.left + targetX;
  var endY = skyRect.top + targetY;

  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:90;' +
    'background:radial-gradient(circle,#fff8e0,#ffcc40,transparent);' +
    'box-shadow:0 0 8px 2px #ffcc40,0 0 16px 4px #ff8020;' +
    'left:' + (startX - 5) + 'px;top:' + (startY - 5) + 'px;';
  document.body.appendChild(el);

  var start = performance.now();
  var dur = 700 + Math.random() * 300;
  (function animate(now) {
    var t = Math.min(1, (now - start) / dur);
    var ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    var x = startX + (endX - startX) * ease;
    var y = startY + (endY - startY) * ease - Math.sin(t * Math.PI) * 80;
    el.style.left = (x - 5) + 'px';
    el.style.top  = (y - 5) + 'px';
    el.style.opacity = String(1 - t * 0.3);
    el.style.transform = 'scale(' + (1 + Math.sin(t * Math.PI) * 0.4) + ')';
    if (t < 1) requestAnimationFrame(animate);
    else {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (onComplete) onComplete();
    }
  })(start);
}

// ============================================================
// Constellation line draw-in
// ============================================================
function addConstellationLine(x1, y1, x2, y2) {
  var len = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  var pal = palette();
  var line = svgEl('line', {
    x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2),
    stroke: pal[2],
    'stroke-width': '0.8',
    'stroke-opacity': '0.45',
    'stroke-linecap': 'round',
    'stroke-dasharray': String(len),
    'stroke-dashoffset': String(len),
    filter: 'url(#star-glow)'
  });
  constellationLayer.appendChild(line);
  var start = performance.now();
  var dur = 1200;
  (function animate(now) {
    var t = Math.min(1, (now - start) / dur);
    var ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    line.setAttribute('stroke-dashoffset', String(len * (1 - ease)));
    if (t < 1) requestAnimationFrame(animate);
  })(start);
}

function rebuildAllConstellationLines() {
  constellationLayer.innerHTML = '';
  var lines = G.constellationLines;
  var pal = palette();
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var ll = svgEl('line', {
      x1: String(l.x1), y1: String(l.y1), x2: String(l.x2), y2: String(l.y2),
      stroke: pal[2], 'stroke-width': '0.8', 'stroke-opacity': '0.45',
      'stroke-linecap': 'round', filter: 'url(#star-glow)'
    });
    constellationLayer.appendChild(ll);
  }
}

// ============================================================
// Sky hue evolution
// ============================================================
function updateSkyHue(hue) {
  document.documentElement.style.setProperty('--sky-hue', String(hue));
  var skyBgRect = document.getElementById('sky-bg-rect');
  if (skyBgRect) {
    skyBgRect.style.filter = 'hue-rotate(' + (hue - 250) + 'deg)';
    skyBgRect.style.transition = 'filter 2s';
  }
}

// ============================================================
// Supernova mood flash
// ============================================================
function moodFlash() {
  var root = document.getElementById('game-root');
  root.style.transition = 'filter 0s';
  root.style.filter = 'saturate(3) brightness(1.5)';
  setTimeout(function() {
    root.style.transition = 'filter 600ms ease';
    root.style.filter = '';
    setTimeout(function() {
      root.style.transition = 'filter 2s';
      root.style.filter = 'hue-rotate(180deg)';
      setTimeout(function() {
        root.style.transition = 'filter 2s';
        root.style.filter = '';
      }, 2000);
    }, 700);
  }, 50);
}

function flashSkyZone() {
  var sky = document.getElementById('sky-canvas');
  sky.style.transition = 'filter 0s';
  sky.style.filter = 'brightness(2) saturate(2)';
  setTimeout(function() {
    sky.style.transition = 'filter 0.6s';
    sky.style.filter = '';
  }, 50);
}

// ============================================================
// Twin Anvil — build second anvil in forge area
// ============================================================
var forgeSvg2 = null;
var _twinAnvilBuilt = false;

function buildTwinAnvil() {
  if (_twinAnvilBuilt) return;
  _twinAnvilBuilt = true;

  var forgeArea = document.getElementById('forge-area');
  var heatWrap = document.getElementById('heat-bar-wrap');

  // Wrap existing forge SVG and add second
  var twinWrap = document.getElementById('twin-anvil-wrap');
  if (!twinWrap) {
    twinWrap = document.createElement('div');
    twinWrap.id = 'twin-anvil-wrap';
    twinWrap.className = 'twin-anvil-wrap';

    var existingSvg = document.getElementById('forge-svg');
    var existingHeat = document.getElementById('heat-bar-wrap');

    // Create container for forge 1
    var forge1Container = document.createElement('div');
    forge1Container.className = 'forge-container';

    // Move existing forge SVG into container
    existingSvg.parentNode.insertBefore(twinWrap, existingSvg);
    forge1Container.appendChild(existingSvg);

    // Heat bar 1 clone stays with forge 1
    var heat1Wrap = document.createElement('div');
    heat1Wrap.className = 'heat-bar-wrap-inline';
    heat1Wrap.innerHTML = existingHeat.innerHTML;
    // Re-wire IDs for forge 1 heat bar (the original keeps its ID for backward compat)
    forge1Container.appendChild(heat1Wrap);

    // Create forge 2
    var forge2Wrap = document.createElement('div');
    forge2Wrap.className = 'forge-container';

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg2 = document.createElementNS(svgNS, 'svg');
    svg2.setAttribute('id', 'forge-svg-2');
    svg2.setAttribute('xmlns', svgNS);
    svg2.setAttribute('viewBox', '0 0 240 180');
    svg2.className = 'forge-svg-2';
    svg2.style.touchAction = 'none';
    svg2.innerHTML = document.getElementById('forge-svg').innerHTML;

    // Remap IDs for svg2 elements
    svg2.querySelector('#anvil-hit').id = 'anvil-hit-2';
    svg2.querySelector('#hammer-group').id = 'hammer-group-2';
    svg2.querySelector('#ember-group').id = 'ember-group-2';
    svg2.querySelector('#ember-outer').id = 'ember-outer-2';
    svg2.querySelector('#ember-core').id = 'ember-core-2';
    svg2.querySelector('#ember-hot').id = 'ember-hot-2';
    svg2.querySelector('#anvil-hit-2').style.cursor = 'pointer';

    var heat2Wrap = document.createElement('div');
    heat2Wrap.className = 'heat-bar-wrap-inline';
    heat2Wrap.innerHTML = '<div id="heat-bar-fill-2" class="heat-bar-fill-2"></div><span class="heat-label-2">Heat</span>';

    forge2Wrap.appendChild(svg2);
    forge2Wrap.appendChild(heat2Wrap);

    twinWrap.appendChild(forge1Container);
    twinWrap.appendChild(forge2Wrap);

    // Hide original standalone heat bar (now replaced by inline ones)
    existingHeat.style.display = 'none';

    forgeSvg2 = svg2;

    // Wire refs for second anvil
    anvilHit2      = svg2.querySelector('#anvil-hit-2');
    hammerGroup2   = svg2.querySelector('#hammer-group-2');
    emberOuter2    = svg2.querySelector('#ember-outer-2');
    emberCore2     = svg2.querySelector('#ember-core-2');
    emberHot2      = svg2.querySelector('#ember-hot-2');

    // Wire pointer event for second anvil
    anvilHit2.addEventListener('pointerdown', function(e) {
      onAnvilClick(e, 2);
    });

    debugLog('twin anvil built');
  }
}

// ============================================================
// Combo counter floating UI
// ============================================================
var _comboDivTimeout = null;
var _comboDiv = null;

function showComboUI(combo, x, y) {
  if (!_comboDiv) {
    _comboDiv = document.createElement('div');
    _comboDiv.id = 'combo-counter';
    document.getElementById('game-root').appendChild(_comboDiv);
  }
  var mults = [1, 1.5, 2, 3, 5];
  var mult = mults[Math.min(combo - 1, 4)] || 1;
  _comboDiv.textContent = '×' + mult + ' COMBO ' + combo;
  _comboDiv.style.cssText = 'position:fixed;left:' + (x - 50) + 'px;top:' + (y - 60) + 'px;' +
    'color:#ffcc40;font-size:' + (13 + combo * 2) + 'px;font-weight:700;pointer-events:none;z-index:500;' +
    'text-shadow:0 0 8px #ff8020,0 0 20px #ffcc40;' +
    'animation:combo-pop 0.3s ease-out;';
  _comboDiv.style.opacity = '1';
  clearTimeout(_comboDivTimeout);
  _comboDivTimeout = setTimeout(function() {
    if (_comboDiv) _comboDiv.style.opacity = '0';
  }, getComboWindow() * 1000);
}

// ============================================================
// Chain Lightning (F8)
// ============================================================
function fireChainLightning() {
  if (!G.skyStars || G.skyStars.length < 2) return;

  var skyRect = skyCanvas.getBoundingClientRect();
  var stars = G.skyStars;
  // Pick up to 5 random stars
  var pool = stars.slice();
  // Shuffle first 5
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  var targets = pool.slice(0, Math.min(5, pool.length));

  if (targets.length < 1) return;

  // Build jagged lightning path between stars
  var pts = targets.map(function(s) {
    return { x: s.x, y: s.y };
  });

  for (var ti = 0; ti < pts.length - 1; ti++) {
    drawLightningArc(pts[ti].x, pts[ti].y, pts[ti+1].x, pts[ti+1].y);
  }

  var gained = targets.length;
  G.stars += gained;
  showToast('Chain ×' + gained);
  updateHUD();
  debugLog('chain lightning +' + gained);
}

function drawLightningArc(x1, y1, x2, y2) {
  // Build jagged path with midpoint displacement
  var segments = 6;
  var pts = [{x:x1,y:y1}];
  for (var i = 1; i < segments; i++) {
    var t = i / segments;
    var mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
    var my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
    pts.push({x:mx, y:my});
  }
  pts.push({x:x2,y:y2});

  var d = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
  for (var pi = 1; pi < pts.length; pi++) {
    d += 'L' + pts[pi].x.toFixed(1) + ',' + pts[pi].y.toFixed(1);
  }

  // Glow layer
  var glow = svgEl('path', {
    d: d, fill:'none', stroke:'#80c0ff',
    'stroke-width':'4', 'stroke-opacity':'0.4',
    'stroke-linecap':'round', filter:'url(#star-glow-strong)'
  });
  var bolt = svgEl('path', {
    d: d, fill:'none', stroke:'#e8f4ff',
    'stroke-width':'1.5', 'stroke-opacity':'0.95',
    'stroke-linecap':'round'
  });

  chainLightningLayer.appendChild(glow);
  chainLightningLayer.appendChild(bolt);

  // Fade out over 500ms
  var start = performance.now();
  (function fade(now) {
    var t = Math.min(1, (now - start) / 500);
    glow.setAttribute('stroke-opacity', String(0.4 * (1 - t)));
    bolt.setAttribute('stroke-opacity', String(0.95 * (1 - t)));
    if (t < 1) requestAnimationFrame(fade);
    else {
      if (glow.parentNode) glow.parentNode.removeChild(glow);
      if (bolt.parentNode) bolt.parentNode.removeChild(bolt);
    }
  })(start);
}

// ============================================================
// Shooting Stars (S4)
// ============================================================
var _activeShootingStars = [];

function spawnShootingStar() {
  if (!G.upgrades['S4']) return;
  var skyRect = skyCanvas.getBoundingClientRect();
  var w = skyRect.width;
  var h = skyRect.height;

  // Random start on left edge or top edge
  var fromLeft = Math.random() < 0.5;
  var sx, sy, ex, ey;
  if (fromLeft) {
    sx = 0; sy = Math.random() * h * 0.6;
    ex = w; ey = sy + (Math.random() * 0.5 + 0.1) * h;
  } else {
    sx = Math.random() * w * 0.6; sy = 0;
    ex = sx + (Math.random() * 0.5 + 0.2) * w; ey = h * (0.3 + Math.random() * 0.5);
  }
  ex = Math.min(ex, w); ey = Math.min(ey, h);

  var dur = 2000 + Math.random() * 1000; // 2–3s

  // SVG comet: bright head + fading tail
  var g = svgEl('g', { class: 'shooting-star' });
  var tailLen = 60 + Math.random() * 40;
  var angle = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;

  var tail = svgEl('line', {
    x1: String(-tailLen), y1: '0', x2: '0', y2: '0',
    stroke: 'url(#shooting-tail-grad)',
    'stroke-width': '2.5', 'stroke-linecap': 'round'
  });
  var head = svgEl('circle', {
    cx: '0', cy: '0', r: '4',
    fill: 'white',
    filter: 'url(#star-glow-strong)'
  });

  g.setAttribute('transform', 'translate(' + sx + ',' + sy + ') rotate(' + angle + ')');
  g.appendChild(tail);
  g.appendChild(head);

  // Ensure gradient def exists
  ensureShootingStarGradient();

  shootingStarLayer.appendChild(g);

  var ssObj = { el: g, sx:sx, sy:sy, ex:ex, ey:ey, dur:dur,
    start: performance.now(), alive: true, angle: angle };
  _activeShootingStars.push(ssObj);

  // Hit area div (absolutely positioned, follows the head)
  var hitEl = document.createElement('div');
  hitEl.style.cssText = 'position:fixed;width:50px;height:50px;border-radius:50%;pointer-events:all;z-index:85;cursor:pointer;touch-action:manipulation;';
  document.getElementById('game-root').appendChild(hitEl);
  ssObj.hitEl = hitEl;

  hitEl.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (!ssObj.alive) return;
    ssObj.alive = false;
    catchShootingStar(ssObj);
  });

  // Animate
  (function animSS(now) {
    if (!ssObj.alive) {
      if (g.parentNode) g.parentNode.removeChild(g);
      if (hitEl.parentNode) hitEl.parentNode.removeChild(hitEl);
      return;
    }
    var t = Math.min(1, (now - ssObj.start) / dur);
    var x = sx + (ex - sx) * t;
    var y = sy + (ey - sy) * t;
    g.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + angle + ')');
    // Sync hit div
    var skyRect2 = skyCanvas.getBoundingClientRect();
    hitEl.style.left = (skyRect2.left + x - 25) + 'px';
    hitEl.style.top  = (skyRect2.top  + y - 25) + 'px';
    // Fade near end
    if (t > 0.8) g.setAttribute('opacity', String((1 - t) / 0.2));
    if (t < 1) requestAnimationFrame(animSS);
    else {
      ssObj.alive = false;
      if (g.parentNode) g.parentNode.removeChild(g);
      if (hitEl.parentNode) hitEl.parentNode.removeChild(hitEl);
    }
  })(ssObj.start);
}

function catchShootingStar(ssObj) {
  var gained = Math.round(25 * getMoonMult() * getStarseerMult() * G.affinity);
  G.stars += gained;
  showToast('Caught! +' + fmt(gained) + ' Light');
  updateHUD();
  if (ssObj.el && ssObj.el.parentNode) ssObj.el.parentNode.removeChild(ssObj.el);
  if (ssObj.hitEl && ssObj.hitEl.parentNode) ssObj.hitEl.parentNode.removeChild(ssObj.hitEl);
  flashSkyZone();
  debugLog('shooting star caught +' + gained);
}

function ensureShootingStarGradient() {
  if (document.getElementById('shooting-tail-grad')) return;
  var defs = skyCanvas.querySelector('defs');
  var grad = svgEl('linearGradient', {
    id: 'shooting-tail-grad', x1: '0%', y1: '0%', x2: '100%', y2: '0%'
  });
  var s1 = svgEl('stop', { offset: '0%', 'stop-color': 'white', 'stop-opacity': '0' });
  var s2 = svgEl('stop', { offset: '100%', 'stop-color': 'white', 'stop-opacity': '0.9' });
  grad.appendChild(s1); grad.appendChild(s2);
  defs.appendChild(grad);
}

// ============================================================
// Moon Phase (S6)
// ============================================================
var _moonBuilt = false;
var _moonG = null;

function buildMoon() {
  if (_moonBuilt) return;
  _moonBuilt = true;

  var skyRect = skyCanvas.getBoundingClientRect();
  var w = skyRect.width;

  var g = svgEl('g', { id: 'moon-g', class: 'moon-group' });
  var cx = w - 80;
  var cy = 60;

  // Moon glow
  var glow = svgEl('circle', {
    cx: String(cx), cy: String(cy), r: '32',
    fill: '#e8e0c0', opacity: '0.07',
    filter: 'url(#star-glow-strong)'
  });
  // Moon disc
  var disc = svgEl('circle', {
    cx: String(cx), cy: String(cy), r: '22',
    fill: '#ddd8b0', id: 'moon-disc', opacity: '0.85'
  });
  // Dark crescent mask circle (moves to create phase)
  var shadow = svgEl('circle', {
    cx: String(cx), cy: String(cy), r: '22',
    fill: '#0d0d1e', id: 'moon-shadow', opacity: '0.9'
  });

  g.appendChild(glow);
  g.appendChild(disc);
  g.appendChild(shadow);

  // Phase label
  var label = svgEl('text', {
    x: String(cx), y: String(cy + 42),
    'text-anchor': 'middle', fill: '#8888aa',
    'font-size': '9', 'font-family': 'system-ui,sans-serif'
  });
  label.textContent = 'New Moon';
  label.id = 'moon-label';
  g.appendChild(label);

  skyCanvas.appendChild(g);
  _moonG = g;
}

function updateMoonPhase(phaseSeconds) {
  if (!G.upgrades['S6']) return;
  if (!_moonBuilt) buildMoon();

  var phase = phaseSeconds % 90;
  var shadow = document.getElementById('moon-shadow');
  var label = document.getElementById('moon-label');
  var disc = document.getElementById('moon-disc');
  if (!shadow || !label || !disc) return;

  var discRect = disc.getBoundingClientRect();
  var discCX = parseFloat(disc.getAttribute('cx'));
  var discCY = parseFloat(disc.getAttribute('cy'));
  var R = 22;

  var phaseName, offsetX;

  if (phase < 22.5) {
    // New moon
    phaseName = 'New Moon';
    offsetX = 0; // shadow fully covers
    shadow.setAttribute('opacity', '0.9');
    shadow.setAttribute('cx', String(discCX));
  } else if (phase < 45) {
    // Waxing — shadow slides right, revealing left half
    phaseName = 'Waxing';
    var t = (phase - 22.5) / 22.5;
    offsetX = t * R * 1.6;
    shadow.setAttribute('cx', String(discCX + offsetX));
    shadow.setAttribute('opacity', '0.9');
  } else if (phase < 75) {
    // Full moon — shadow slides far right (hidden)
    phaseName = 'Full Moon';
    shadow.setAttribute('opacity', '0');
  } else {
    // Waning — shadow slides back from right
    phaseName = 'Waning';
    var t2 = (phase - 75) / 15;
    offsetX = (1 - t2) * R * 1.6;
    shadow.setAttribute('cx', String(discCX + offsetX));
    shadow.setAttribute('opacity', '0.9');
  }

  label.textContent = phaseName;

  // Silver tint overlay for full moon
  var tintEl = document.getElementById('full-moon-tint');
  if (phaseName === 'Full Moon') {
    if (!tintEl) {
      tintEl = document.createElement('div');
      tintEl.id = 'full-moon-tint';
      tintEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;' +
        'background:rgba(200,220,255,0.04);transition:opacity 2s;';
      document.getElementById('game-root').appendChild(tintEl);
    }
    tintEl.style.opacity = '1';
  } else if (tintEl) {
    tintEl.style.opacity = '0';
  }
}

// ============================================================
// Nebula Drift (S8) — spawn free star from random sky position
// ============================================================
function spawnNebulaStar() {
  if (!G.upgrades['S8']) return;
  var stars = G.skyStars;
  if (stars.length >= getSkyCapacity()) return;

  var skyRect = skyCanvas.getBoundingClientRect();
  var skyW = skyRect.width;
  var skyH = skyRect.height;
  var pos = starPosition(stars.length + G.totalStarsEver, skyW, skyH);
  var rng = mulberry32(stars.length * 1337 + G.totalStarsEver + 999);
  var starData = {
    x: pos.x, y: pos.y,
    size: 4 + rng() * 3,
    phase: (rng() * 3).toFixed(2),
    speed: (2 + rng() * 2).toFixed(2),
    points: 5 + (stars.length % 5)
  };

  var worth = getEffectiveLightPerStar();
  G.stars += worth;
  G.totalStarsEver++;
  G.cometStarProgress = (G.cometStarProgress || 0) + 1;
  G.skyStars.push(starData);

  // Fade-in
  var idx = stars.length - 1;
  setTimeout(function() {
    addSkyStarElement(starData, idx);
    checkConstellations();
    checkCometTrigger();
    updateHUD();
  }, 100);

  showToast('Nebula drifts a new star.');
  debugLog('nebula drift star +' + worth.toFixed(1));
}

// ============================================================
// Comet Ritual (M6)
// ============================================================
var _activeCometEl = null;
var _activeCometHitEl = null;
var _cometAlive = false;

function spawnComet() {
  if (_cometAlive) return;
  _cometAlive = true;
  G.cometStarProgress = 0;

  var skyRect = skyCanvas.getBoundingClientRect();
  var w = skyRect.width;
  var h = skyRect.height;

  // Diagonal arc across full sky
  var sx = -40, sy = h * 0.1 + Math.random() * h * 0.3;
  var ex = w + 40, ey = h * 0.5 + Math.random() * h * 0.4;
  var dur = 5000;
  var angle = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;

  var g = svgEl('g', { class: 'comet' });
  var tailLen = 120;

  // Ensure gradient
  ensureShootingStarGradient();
  var cometTailGrad = document.getElementById('comet-tail-grad');
  if (!cometTailGrad) {
    var defs = skyCanvas.querySelector('defs');
    var grad = svgEl('linearGradient', {
      id: 'comet-tail-grad', x1: '0%', y1: '0%', x2: '100%', y2: '0%'
    });
    grad.appendChild(svgEl('stop', { offset:'0%', 'stop-color':'#ffd700','stop-opacity':'0' }));
    grad.appendChild(svgEl('stop', { offset:'100%', 'stop-color':'#ffd700','stop-opacity':'0.85' }));
    defs.appendChild(grad);
  }

  var tail = svgEl('line', {
    x1: String(-tailLen), y1: '0', x2: '0', y2: '0',
    stroke: 'url(#comet-tail-grad)', 'stroke-width': '6', 'stroke-linecap': 'round'
  });
  var coma = svgEl('circle', {
    cx: '0', cy: '0', r: '10',
    fill: '#ffd700', filter: 'url(#star-glow-strong)', opacity: '0.95'
  });
  var nucleus = svgEl('circle', { cx: '0', cy: '0', r: '4', fill: 'white' });

  g.setAttribute('transform', 'translate(' + sx + ',' + sy + ') rotate(' + angle + ')');
  g.appendChild(tail);
  g.appendChild(coma);
  g.appendChild(nucleus);
  cometLayer.appendChild(g);
  _activeCometEl = g;

  // Hit div
  var hitEl = document.createElement('div');
  hitEl.style.cssText = 'position:fixed;width:70px;height:70px;border-radius:50%;pointer-events:all;z-index:86;cursor:pointer;touch-action:manipulation;';
  document.getElementById('game-root').appendChild(hitEl);
  _activeCometHitEl = hitEl;

  hitEl.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
    if (!_cometAlive) return;
    _cometAlive = false;
    catchComet(sx + (ex - sx) * ((performance.now() - animStart) / dur));
  });

  var animStart = performance.now();
  (function animComet(now) {
    if (!_cometAlive && _activeCometEl) {
      if (_activeCometEl.parentNode) _activeCometEl.parentNode.removeChild(_activeCometEl);
      if (_activeCometHitEl && _activeCometHitEl.parentNode) _activeCometHitEl.parentNode.removeChild(_activeCometHitEl);
      _activeCometEl = null; _activeCometHitEl = null;
      return;
    }
    var t = Math.min(1, (now - animStart) / dur);
    var x = sx + (ex - sx) * t;
    var y = sy + (ey - sy) * t;
    g.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + angle + ')');
    var skyRect2 = skyCanvas.getBoundingClientRect();
    hitEl.style.left = (skyRect2.left + x - 35) + 'px';
    hitEl.style.top  = (skyRect2.top  + y - 35) + 'px';
    if (t < 1) requestAnimationFrame(animComet);
    else {
      _cometAlive = false;
      if (g.parentNode) g.parentNode.removeChild(g);
      if (hitEl.parentNode) hitEl.parentNode.removeChild(hitEl);
      _activeCometEl = null; _activeCometHitEl = null;
    }
  })(animStart);

  showToast('A comet appears — tap it!');
  debugLog('comet spawned');
}

function catchComet(x) {
  var bonus = Math.round(G.stars * 0.10);
  if (bonus < 1) bonus = 1;
  G.stars += bonus;
  showToast('Comet! +' + fmt(bonus) + ' Light');
  updateHUD();
  if (_activeCometEl && _activeCometEl.parentNode) _activeCometEl.parentNode.removeChild(_activeCometEl);
  if (_activeCometHitEl && _activeCometHitEl.parentNode) _activeCometHitEl.parentNode.removeChild(_activeCometHitEl);
  _activeCometEl = null; _activeCometHitEl = null;
  // Golden flash
  var root = document.getElementById('game-root');
  root.style.transition = 'filter 0s';
  root.style.filter = 'brightness(2) sepia(0.5)';
  setTimeout(function() {
    root.style.transition = 'filter 0.8s';
    root.style.filter = '';
  }, 50);
  debugLog('comet caught +' + bonus);
}

function checkCometTrigger() {
  if (!G.upgrades['M6']) return;
  if ((G.cometStarProgress || 0) >= 200) {
    spawnComet();
  }
}
