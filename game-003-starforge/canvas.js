// canvas.js — procedural SVG/Canvas rendering

var skyCanvas, constellationLayer, starLayer, particleLayer, flyingStarLayer;
var forgeSvg, anvilHit, hammerGroup, emberOuter, emberCore, emberHot;

function initCanvasRefs() {
  skyCanvas          = document.getElementById('sky-canvas');
  constellationLayer = document.getElementById('constellation-layer');
  starLayer          = document.getElementById('star-layer');
  particleLayer      = document.getElementById('particle-layer');
  flyingStarLayer    = document.getElementById('flying-star-layer');
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

// ---------------------------------------------------------------------------
// Ember — pulses with heat
// ---------------------------------------------------------------------------
function updateEmber(heat) {
  var r = 3 + heat / 10;
  var rOuter = r * 2.5;
  var opacity = 0.5 + heat / 200;
  emberOuter.setAttribute('r', String(rOuter));
  emberCore.setAttribute('r', String(r));
  emberHot.setAttribute('r', String(r * 0.5));
  emberOuter.setAttribute('opacity', String(Math.min(1, opacity)));

  // Color shifts hotter with heat
  var hue = 30 + (heat / 100) * 20;
  emberCore.setAttribute('fill', 'hsl(' + hue + ',100%,65%)');
}

// ---------------------------------------------------------------------------
// Hammer swing animation
// ---------------------------------------------------------------------------
var _hammerSwinging = false;

function swingHammer() {
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

// ---------------------------------------------------------------------------
// Sparks on strike
// ---------------------------------------------------------------------------
function spawnSparks(count) {
  var fRect = document.getElementById('forge-area').getBoundingClientRect();
  // Anvil top in SVG viewBox coords: x=120,y=88 — map to screen
  var svgRect = forgeSvg.getBoundingClientRect();
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

    var spark = svgEl('circle', {
      cx: String(cx - svgRect.left + (Math.random()-0.5)*20),
      cy: String(cy - svgRect.top),
      r: String(size),
      fill: Math.random() < 0.5 ? '#ffcc40' : '#ff8020',
      opacity: '0.95'
    });
    // Use absolute screen coords via a separate overlay SVG — use particleLayer instead
    var px = cx;
    var py = cy;
    spawnSparkAt(px, py, dx, dy, size);
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

// ---------------------------------------------------------------------------
// Star SVG shape builder
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Add a persistent star to the sky
// ---------------------------------------------------------------------------
function addSkyStarElement(starData, index) {
  var points = 5 + (index % 5);
  var outerR = starData.size;
  var innerR = outerR * 0.42;
  var twinkleDur = (starData.speed || 2) + 's';
  var twinkleDelay = (starData.phase || 0) + 's';

  var g = svgEl('g', { class: 'sky-star', 'data-idx': String(index) });

  // Glow halo
  var halo = svgEl('circle', {
    cx: String(starData.x), cy: String(starData.y),
    r: String(outerR * 1.8),
    fill: palette()[2],
    opacity: '0.18',
    filter: 'url(#star-glow)'
  });

  // Star shape
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

// ---------------------------------------------------------------------------
// Flying star animation (anvil → sky position)
// ---------------------------------------------------------------------------
function animateFlyingStar(targetX, targetY, onComplete) {
  var svgRect = forgeSvg.getBoundingClientRect();
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

// ---------------------------------------------------------------------------
// Constellation line draw-in
// ---------------------------------------------------------------------------
function addConstellationLine(x1, y1, x2, y2) {
  var len = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  var pal = palette();
  var line = svgEl('line', {
    x1: String(x1), y1: String(y1),
    x2: String(x2), y2: String(y2),
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
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var pal = palette();
    var ll = svgEl('line', {
      x1: String(l.x1), y1: String(l.y1),
      x2: String(l.x2), y2: String(l.y2),
      stroke: pal[2],
      'stroke-width': '0.8',
      'stroke-opacity': '0.45',
      'stroke-linecap': 'round',
      filter: 'url(#star-glow)'
    });
    constellationLayer.appendChild(ll);
  }
}

// ---------------------------------------------------------------------------
// Sky hue evolution
// ---------------------------------------------------------------------------
function updateSkyHue(hue) {
  document.documentElement.style.setProperty('--sky-hue', String(hue));
  // Update sky-bg-rect stop colors via filter hue-rotate
  var skyBgRect = document.getElementById('sky-bg-rect');
  if (skyBgRect) {
    skyBgRect.style.filter = 'hue-rotate(' + (hue - 250) + 'deg)';
    skyBgRect.style.transition = 'filter 2s';
  }
}

// ---------------------------------------------------------------------------
// Supernova mood flash
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function initCanvas() {
  initCanvasRefs();
}
