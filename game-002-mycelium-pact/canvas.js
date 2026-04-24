// canvas.js — all SVG/canvas rendering

// ---------------------------------------------------------------------------
// SVG layer references (populated after DOMContentLoaded)
// ---------------------------------------------------------------------------
var svgCanvas, orbGroup, stumpLayer, myceliumLayer, mushroomLayer, saplingLayer, particleLayer, hintLayer;

function initCanvasRefs() {
  svgCanvas     = document.getElementById('game-canvas');
  orbGroup      = document.getElementById('orb-group');
  stumpLayer    = document.getElementById('stump-layer');
  myceliumLayer = document.getElementById('mycelium-layer');
  mushroomLayer = document.getElementById('mushroom-layer');
  saplingLayer  = document.getElementById('sapling-layer');
  particleLayer = document.getElementById('particle-layer');
  hintLayer     = document.getElementById('hint-layer');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function svgEl(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

// Compute stump pixel positions from ratios — always uses current window size
function stumpPos(def) {
  return {
    x: def.rx * window.innerWidth,
    y: def.ry * window.innerHeight
  };
}

// ---------------------------------------------------------------------------
// Orb
// ---------------------------------------------------------------------------
function renderOrb() {
  orbGroup.innerHTML = '';
  var cx = window.innerWidth * 0.5;
  var cy = window.innerHeight * 0.18;

  var rays = svgEl('g', {});
  for (var i = 0; i < 8; i++) {
    var angle = (i / 8) * Math.PI * 2;
    var x1 = cx + Math.cos(angle) * 18, y1 = cy + Math.sin(angle) * 18;
    var x2 = cx + Math.cos(angle) * 55, y2 = cy + Math.sin(angle) * 55;
    var ray = svgEl('line', {x1:x1, y1:y1, x2:x2, y2:y2, stroke:'#c8f5d0', 'stroke-width':'1', 'stroke-opacity':'0.4', 'stroke-linecap':'round'});
    ray.style.transformOrigin = cx + 'px ' + cy + 'px';
    rays.appendChild(ray);
  }
  rays.style.transformOrigin = cx + 'px ' + cy + 'px';
  rays.style.animation = 'orb-spin 8s linear infinite';
  orbGroup.appendChild(rays);

  var glow1 = svgEl('circle', {cx:cx, cy:cy, r:'52', fill:'url(#orbGlow)', filter:'url(#glow-strong)'});
  var c2    = svgEl('circle', {cx:cx, cy:cy, r:'28', fill:'#c8f5d0', opacity:'0.6', filter:'url(#glow-soft)'});
  var c3    = svgEl('circle', {cx:cx, cy:cy, r:'14', fill:'white', opacity:'0.88'});
  orbGroup.appendChild(glow1);
  orbGroup.appendChild(c2);
  orbGroup.appendChild(c3);

  orbGroup.style.animation = 'orb-breathe 3s ease-in-out infinite';
  orbGroup.style.transformOrigin = cx + 'px ' + cy + 'px';
}

// ---------------------------------------------------------------------------
// Stumps
// ---------------------------------------------------------------------------
function renderStumps() {
  stumpLayer.innerHTML = '';
  for (var i = 0; i < STUMP_DEFS.length; i++) {
    var def = STUMP_DEFS[i];
    var pos = stumpPos(def);
    var cx = pos.x, cy = pos.y;

    // outer: positioning only via SVG attribute — no CSS transform ever touches this
    var outer = svgEl('g', {id:'stump-' + def.id, cursor:'pointer'});
    outer.setAttribute('transform', 'translate(' + cx + ',' + cy + ')');

    // inner: pulse animation only — origin is local (0,0) which is the stump center
    var inner = svgEl('g', {});
    inner.style.transformOrigin = '0px 0px';
    inner.style.animation = 'stump-pulse 2s ' + (Math.random() * 2) + 's ease-in-out infinite';

    var root1 = svgEl('path', {d:'M-10,-5 Q-28,12 -32,30', stroke:'#3d2b1f', 'stroke-width':'5', fill:'none', 'stroke-linecap':'round'});
    var root2 = svgEl('path', {d:'M10,-5 Q28,12 32,30',  stroke:'#3d2b1f', 'stroke-width':'5', fill:'none', 'stroke-linecap':'round'});
    var trunk = svgEl('rect',    {x:'-18', y:'-32', width:'36', height:'32', rx:'6', fill:'#3d2b1f'});
    var top   = svgEl('ellipse', {cx:'0',  cy:'-32', rx:'18', ry:'6', fill:'#5a3e2b'});
    var ring1 = svgEl('circle',  {cx:'0',  cy:'-32', r:'10', fill:'none', stroke:'#6b4c35', 'stroke-width':'1.5'});
    var ring2 = svgEl('circle',  {cx:'0',  cy:'-32', r:'5',  fill:'none', stroke:'#7a5a40', 'stroke-width':'1'});

    inner.appendChild(root1); inner.appendChild(root2);
    inner.appendChild(trunk); inner.appendChild(top);
    inner.appendChild(ring1); inner.appendChild(ring2);
    outer.appendChild(inner);

    (function(capDef, capOuter, capInner) {
      capOuter.addEventListener('click', function(e) {
        onStumpClick(e, capDef, capOuter, capInner);
      });
    })(def, outer, inner);

    stumpLayer.appendChild(outer);
  }
}

// ---------------------------------------------------------------------------
// Spore particles
// ---------------------------------------------------------------------------
function spawnSpores(cx, cy, count) {
  count = count || 5;
  for (var i = 0; i < count; i++) {
    var angle = (Math.random() - 0.5) * Math.PI * 1.4 - Math.PI / 2;
    var speed = 40 + Math.random() * 60;
    var dx = Math.cos(angle) * speed;
    var dy = Math.sin(angle) * speed - 40;
    var size = 4 + Math.random() * 5;
    var g = svgEl('g', {transform:'translate(' + cx + ',' + cy + ')'});
    var c   = svgEl('ellipse', {cx:'0', cy:'0', rx:String(size * 0.55), ry:String(size * 0.8), fill:'#5cba6e', opacity:'0.9'});
    var tip = svgEl('polygon', {points:'0,' + (size*0.8+size*0.4) + ' ' + (size*0.3) + ',' + (size*0.8) + ' ' + (-size*0.3) + ',' + (size*0.8), fill:'#5cba6e', opacity:'0.7'});
    g.appendChild(c);
    g.appendChild(tip);
    particleLayer.appendChild(g);

    (function(pg, pdx, pdy, pcx, pcy) {
      var start = performance.now();
      var dur = 1100 + Math.random() * 400;
      function animate(now) {
        var t = Math.min(1, (now - start) / dur);
        var ease = 1 - t;
        pg.setAttribute('transform', 'translate(' + (pcx + pdx*t) + ',' + (pcy + pdy*t + (30*t*t)) + ') scale(' + (1 - t*0.6) + ')');
        pg.setAttribute('opacity', String(ease * 0.9));
        if (t < 1) requestAnimationFrame(animate);
        else if (pg.parentNode) pg.parentNode.removeChild(pg);
      }
      requestAnimationFrame(animate);
    })(g, dx, dy, cx, cy);
  }
}

function spawnOrbBurst() {
  var cx = window.innerWidth * 0.5;
  var cy = window.innerHeight * 0.18 + 14;
  spawnSpores(cx, cy, 8);
}

// ---------------------------------------------------------------------------
// Mycelium threads
// ---------------------------------------------------------------------------
var myceliumPaths = 0;

function addMyceliumThread() {
  var cx = window.innerWidth * 0.5;
  var cy = window.innerHeight * 0.18;
  var angle = (myceliumPaths / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
  var len = 100 + Math.random() * 160;
  var mx = cx + Math.cos(angle) * (len * 0.5) + (Math.random() - 0.5) * 60;
  var my = cy + Math.sin(angle) * (len * 0.5) + Math.random() * 80;
  var ex = cx + Math.cos(angle) * len + (Math.random() - 0.5) * 100;
  var ey = cy + Math.sin(angle) * len + Math.random() * 120;
  var fork1 = svgEl('path', {
    d:'M'+cx+','+cy+' Q'+mx+','+my+' '+ex+','+ey,
    stroke:'#3a7d44', 'stroke-width':'1.2', fill:'none', opacity:'0.35', 'stroke-linecap':'round'
  });
  var fx = ex + (Math.random() - 0.5) * 60;
  var fy = ey + 20 + Math.random() * 40;
  var fork2 = svgEl('path', {
    d:'M'+ex+','+ey+' Q'+((ex+fx)/2+(Math.random()-0.5)*20)+','+((ey+fy)/2)+' '+fx+','+fy,
    stroke:'#3a7d44', 'stroke-width':'0.7', fill:'none', opacity:'0.25', 'stroke-linecap':'round'
  });
  myceliumLayer.appendChild(fork1);
  myceliumLayer.appendChild(fork2);
  myceliumPaths++;
}

// ---------------------------------------------------------------------------
// Mushrooms
// ---------------------------------------------------------------------------
function buildMushroom(x, y, scale) {
  scale = scale || 1;
  var outer = svgEl('g', {transform:'translate('+x+','+y+')'});
  var inner = svgEl('g', {transform:'scale('+scale+')'});
  var stem = svgEl('rect', {x:'-5', y:'-20', width:'10', height:'22', rx:'3', fill:'#d4b896'});
  var cap  = svgEl('path', {d:'M-18,0 Q-22,-28 0,-30 Q22,-28 18,0 Z', fill:'#8b4513'});
  var capSh= svgEl('path', {d:'M-18,0 Q-16,-6 0,-8 Q16,-6 18,0 Z', fill:'#a05a2c', opacity:'0.7'});
  var s1   = svgEl('circle', {cx:'-8', cy:'-20', r:'2.5', fill:'white', opacity:'0.8'});
  var s2   = svgEl('circle', {cx:'5',  cy:'-24', r:'2',   fill:'white', opacity:'0.8'});
  var s3   = svgEl('circle', {cx:'-1', cy:'-14', r:'1.5', fill:'white', opacity:'0.6'});
  inner.appendChild(stem); inner.appendChild(cap); inner.appendChild(capSh);
  inner.appendChild(s1);   inner.appendChild(s2);  inner.appendChild(s3);
  inner.style.transformOrigin = '0px 0px';
  inner.style.animation = 'sapling-sway 3.5s ' + (Math.random() * 2) + 's ease-in-out infinite';
  outer.appendChild(inner);
  return outer;
}

function spawnMushrooms() {
  if (mushroomLayer.children.length > 0) return;
  var positions = [
    {x: window.innerWidth*0.25+30, y: window.innerHeight*0.68},
    {x: window.innerWidth*0.62-20, y: window.innerHeight*0.72},
    {x: window.innerWidth*0.79+20, y: window.innerHeight*0.66}
  ];
  for (var i = 0; i < positions.length; i++) {
    var p = positions[i];
    mushroomLayer.appendChild(buildMushroom(p.x, p.y, 0.9 + Math.random() * 0.3));
  }
}

// ---------------------------------------------------------------------------
// Saplings
// ---------------------------------------------------------------------------
function buildSapling(x, y) {
  var outer = svgEl('g', {transform:'translate('+x+','+y+')'});
  var inner = svgEl('g', {});
  var trunk = svgEl('rect', {x:'-4', y:'-40', width:'8', height:'42', rx:'3', fill:'#5a3e2b'});
  var leaves = [
    {cx:-10, cy:-42, rx:12, ry:7,  rot:-25},
    {cx:12,  cy:-46, rx:14, ry:8,  rot:20},
    {cx:0,   cy:-54, rx:13, ry:9,  rot:0},
  ];
  inner.appendChild(trunk);
  for (var i = 0; i < leaves.length; i++) {
    var l = leaves[i];
    var e = svgEl('ellipse', {
      cx:String(l.cx), cy:String(l.cy), rx:String(l.rx), ry:String(l.ry),
      fill:'#3a7d44', opacity:'0.9',
      transform:'rotate('+l.rot+','+l.cx+','+l.cy+')'
    });
    inner.appendChild(e);
  }
  inner.style.transformOrigin = '0px 0px';
  inner.style.animation = 'sapling-sway 3s ' + (Math.random() * 1.5) + 's ease-in-out infinite';
  outer.appendChild(inner);
  return outer;
}

function spawnSaplings() {
  if (saplingLayer.children.length > 0) return;
  var positions = [
    {x: window.innerWidth*0.35, y: window.innerHeight*0.6},
    {x: window.innerWidth*0.55, y: window.innerHeight*0.55},
    {x: window.innerWidth*0.72, y: window.innerHeight*0.62}
  ];
  for (var i = 0; i < positions.length; i++) {
    var p = positions[i];
    saplingLayer.appendChild(buildSapling(p.x, p.y));
  }
}

// ---------------------------------------------------------------------------
// Hint ring (called from ui.js)
// ---------------------------------------------------------------------------
function drawHintAt(stumpDef) {
  hintLayer.innerHTML = '';
  var pos = stumpPos(stumpDef);
  var cx = pos.x, cy = pos.y;

  var ring = svgEl('circle', {cx:String(cx), cy:String(cy-10), r:'44', fill:'none', stroke:'#5cba6e', 'stroke-width':'2.5', opacity:'0.8'});
  ring.style.animation = 'hint-ring 0.8s ease-in-out infinite alternate';
  hintLayer.appendChild(ring);

  var arrowY = cy - 70;
  var arrow = svgEl('path', {
    d:'M'+cx+','+arrowY+' L'+(cx-8)+','+(arrowY-16)+' M'+cx+','+arrowY+' L'+(cx+8)+','+(arrowY-16),
    stroke:'#5cba6e', 'stroke-width':'2.5', fill:'none', 'stroke-linecap':'round'
  });
  arrow.style.animation = 'hint-ring 0.8s ease-in-out infinite alternate';
  hintLayer.appendChild(arrow);

  var line2 = svgEl('line', {x1:String(cx), y1:String(arrowY-16), x2:String(cx), y2:String(arrowY-36), stroke:'#5cba6e', 'stroke-width':'2', 'stroke-linecap':'round'});
  line2.style.animation = 'hint-ring 0.8s ease-in-out infinite alternate';
  hintLayer.appendChild(line2);

  var hintText = svgEl('text', {x:String(cx), y:String(arrowY-44), 'text-anchor':'middle', fill:'#a8d8a8', 'font-size':'13', 'font-style':'italic', 'font-family':'system-ui,sans-serif'});
  hintText.textContent = 'Click the stump to begin.';
  hintLayer.appendChild(hintText);

  setTimeout(function() { hintLayer.innerHTML = ''; }, 3500);
}

// ---------------------------------------------------------------------------
// initCanvas — call once after DOMContentLoaded
// ---------------------------------------------------------------------------
function initCanvas() {
  initCanvasRefs();
  renderOrb();
  renderStumps();
}
