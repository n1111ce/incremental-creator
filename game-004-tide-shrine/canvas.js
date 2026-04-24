// canvas.js — SVG scene construction, wave animation, creatures, moon/sky drift

// ---------------------------------------------------------------------------
// SVG namespace helper
// ---------------------------------------------------------------------------
var SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  var el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      el.setAttribute(k, attrs[k]);
    });
  }
  return el;
}

// ---------------------------------------------------------------------------
// Canvas dimensions (refreshed on resize)
// ---------------------------------------------------------------------------
var CW = 0, CH = 0;      // canvas width/height in px
var SKY_H = 0;           // pixel height of sky zone
var SEA_H = 0;           // pixel height of sea zone
var BEACH_H = 0;         // pixel height of beach zone
var SEA_TOP = 0;         // y where sea starts
var BEACH_TOP = 0;       // y where beach starts

// Shrine position
var SHRINE_CX = 0;       // center x of main shrine
var SHRINE_BASE_Y = 0;   // y of shrine base bottom
var BELL_CX = 0;         // bell center x
var BELL_CY = 0;         // bell center y
var ROPE_TOP_Y = 0;      // y where rope attaches to bell
var ROPE_BOT_Y = 0;      // y of rope knot (tap zone)
var ROPE_X = 0;          // x of rope

// Shrine2 position
var SHRINE2_CX = 0;
var SHRINE2_BELL_CX = 0;
var SHRINE2_BELL_CY = 0;
var SHRINE2_ROPE_TOP_Y = 0;
var SHRINE2_ROPE_BOT_Y = 0;

// ---------------------------------------------------------------------------
// Layout calculation
// ---------------------------------------------------------------------------
function calcLayout() {
  var canvas = document.getElementById('main-canvas');
  var rect = canvas.getBoundingClientRect();
  CW = rect.width;
  CH = rect.height;

  SKY_H    = CH * 0.40;
  SEA_H    = CH * 0.20;
  BEACH_H  = CH * 0.40;
  SEA_TOP  = SKY_H;
  BEACH_TOP = SKY_H + SEA_H;

  SHRINE_CX = CW * 0.30;
  var shrineW = Math.min(CW * 0.18, 120);
  SHRINE_BASE_Y = CH - 8;
  BELL_CX = SHRINE_CX;
  BELL_CY = BEACH_TOP - shrineW * 1.4;
  ROPE_TOP_Y = BELL_CY + shrineW * 0.28;
  ROPE_X = SHRINE_CX;
  ROPE_BOT_Y = BEACH_TOP + BEACH_H * 0.35;

  SHRINE2_CX = CW * 0.72;
  SHRINE2_BELL_CX = SHRINE2_CX;
  SHRINE2_BELL_CY = BELL_CY;
  SHRINE2_ROPE_TOP_Y = ROPE_TOP_Y;
  SHRINE2_ROPE_BOT_Y = ROPE_BOT_Y;
}

// ---------------------------------------------------------------------------
// Build / update all scene elements
// ---------------------------------------------------------------------------
function buildScene() {
  calcLayout();
  positionSkyRects();
  positionShrine();
  positionRope();
  positionMoon();
  positionSecondShrine();
  positionLighthouse();
  buildNightStars();
}

function positionSkyRects() {
  var skyRect = document.getElementById('sky-rect');
  skyRect.setAttribute('height', SKY_H);

  var seaRect = document.getElementById('sea-rect');
  seaRect.setAttribute('y', SEA_TOP);
  seaRect.setAttribute('width', CW);
  seaRect.setAttribute('height', SEA_H + 4); // slight overlap

  var sandRect = document.getElementById('sand-rect');
  sandRect.setAttribute('y', BEACH_TOP);
  sandRect.setAttribute('height', BEACH_H + 20);

  // Initial wave paths (flat)
  updateWavePaths(0);
}

function positionShrine() {
  var shrineW = Math.min(CW * 0.18, 120);
  var pillarH = shrineW * 1.6;
  var baseY = BEACH_TOP;

  var cx = SHRINE_CX;

  // Base steps
  setRect('shrine-base-3', cx - shrineW*0.6, baseY + BEACH_H*0.7, shrineW*1.2, 18);
  setRect('shrine-base-2', cx - shrineW*0.52, baseY + BEACH_H*0.7 - 10, shrineW*1.04, 14);
  setRect('shrine-base-1', cx - shrineW*0.44, baseY + BEACH_H*0.7 - 18, shrineW*0.88, 12);

  var pillarTop = baseY + BEACH_H*0.7 - 18 - pillarH;
  var pillarW = shrineW * 0.15;

  // Left pillar
  setRect('shrine-pillar-l', cx - shrineW*0.4, pillarTop, pillarW, pillarH);
  // Right pillar
  setRect('shrine-pillar-r', cx + shrineW*0.25, pillarTop, pillarW, pillarH);

  // Lintel
  var lintelTop = pillarTop - shrineW*0.12;
  setRect('shrine-lintel', cx - shrineW*0.5, lintelTop, shrineW, shrineW*0.12);

  // Roof polygon
  var rl = cx - shrineW*0.56;
  var rr = cx + shrineW*0.56;
  var rb = lintelTop;
  var rt = rb - shrineW*0.35;
  document.getElementById('shrine-roof').setAttribute('points',
    (cx)+','+(rt) + ' ' + rl+','+rb + ' ' + rr+','+rb
  );

  // Bell arch ellipse (decorative center opening)
  var archCX = cx;
  var archCY = lintelTop + shrineW*0.2;
  setEllipse('bell-arch', archCX, archCY, shrineW*0.18, shrineW*0.22);

  // Bell pivot group — positioned with transform ATTRIBUTE (not CSS)
  BELL_CX = cx;
  BELL_CY = lintelTop - shrineW*0.15;
  ROPE_TOP_Y = BELL_CY + shrineW*0.22;

  var bellPivot = document.getElementById('bell-pivot');
  bellPivot.setAttribute('transform', 'translate(' + BELL_CX + ',' + BELL_CY + ')');

  var bellR = shrineW * 0.20;
  // Bell body (ellipse, local coords)
  setEllipse('bell-body', 0, 0, bellR, bellR*1.1);
  setEllipse('bell-mouth', 0, bellR*0.9, bellR*1.0, bellR*0.22);
  setEllipse('bell-highlight', -bellR*0.25, -bellR*0.3, bellR*0.22, bellR*0.15);
  setRect('bell-clapper', -3, bellR*0.8, 6, bellR*0.35);
}

function positionRope() {
  ROPE_BOT_Y = BEACH_TOP + BEACH_H * 0.38;

  // Hit zone rectangle
  var hitW = 80;
  var hitH = ROPE_BOT_Y - ROPE_TOP_Y + 40;
  var hitEl = document.getElementById('rope-hit');
  hitEl.setAttribute('x', ROPE_X - hitW/2);
  hitEl.setAttribute('y', ROPE_TOP_Y - 10);
  hitEl.setAttribute('width', hitW);
  hitEl.setAttribute('height', hitH);

  // Rope knot
  var knot = document.getElementById('rope-knot');
  knot.setAttribute('cx', ROPE_X);
  knot.setAttribute('cy', ROPE_BOT_Y);
  knot.setAttribute('r', 18);

  // Pulsing onboarding ring around knot
  var ring = document.getElementById('rope-knot-ring');
  if (ring) {
    ring.setAttribute('cx', ROPE_X);
    ring.setAttribute('cy', ROPE_BOT_Y);
    ring.setAttribute('r', 26);
    ring.setAttribute('class', 'knot-pulse');
  }

  // Rope paths (natural drape)
  updateRopePaths(0);

  // Onboarding arrow — below knot
  var arrowText = document.getElementById('rope-arrow-text');
  arrowText.setAttribute('x', ROPE_X);
  arrowText.setAttribute('y', ROPE_BOT_Y + 50);
}

function updateRopePaths(swayOffset) {
  var ctrl1X = ROPE_X + 8 + swayOffset;
  var ctrl1Y = ROPE_TOP_Y + (ROPE_BOT_Y - ROPE_TOP_Y) * 0.33;
  var ctrl2X = ROPE_X - 8 + swayOffset;
  var ctrl2Y = ROPE_TOP_Y + (ROPE_BOT_Y - ROPE_TOP_Y) * 0.66;

  var d = 'M ' + ROPE_X + ' ' + ROPE_TOP_Y +
          ' C ' + ctrl1X + ' ' + ctrl1Y + ', ' +
                  ctrl2X + ' ' + ctrl2Y + ', ' +
                  ROPE_X + ' ' + ROPE_BOT_Y;

  document.getElementById('rope-path-1').setAttribute('d', d);
  document.getElementById('rope-path-2').setAttribute('d', d);
}

function positionMoon() {
  // Moon positioned in sky — will drift via updateMoon()
  var moonGroup = document.getElementById('moon-group');
  updateMoon(G ? G.moonPhase : 0, G ? G.moonCycleTimer : 0);
}

function positionSecondShrine() {
  if (!G || !G.secondShrineActive) return;

  var shrineW = Math.min(CW * 0.14, 96);
  var pillarH = shrineW * 1.6;
  var baseY = BEACH_TOP;
  var cx = SHRINE2_CX;

  var shrine2Group = document.getElementById('shrine2-group');
  shrine2Group.style.display = '';

  // Position rope
  SHRINE2_BELL_CX = cx;
  SHRINE2_BELL_CY = BELL_CY;
  SHRINE2_ROPE_TOP_Y = ROPE_TOP_Y;
  SHRINE2_ROPE_BOT_Y = ROPE_BOT_Y;

  var hitW = 80;
  var hitH = SHRINE2_ROPE_BOT_Y - SHRINE2_ROPE_TOP_Y + 40;
  var h2 = document.getElementById('shrine2-rope-hit');
  h2.setAttribute('x', cx - hitW/2);
  h2.setAttribute('y', SHRINE2_ROPE_TOP_Y - 10);
  h2.setAttribute('width', hitW);
  h2.setAttribute('height', hitH);

  updateShrine2Rope(0);

  var knot2 = document.getElementById('shrine2-rope-knot');
  knot2.setAttribute('cx', cx);
  knot2.setAttribute('cy', SHRINE2_ROPE_BOT_Y);
  knot2.setAttribute('r', 12);

  // Bell2
  var bellR = shrineW * 0.18;
  var bell2Pivot = document.getElementById('shrine2-bell-pivot');
  bell2Pivot.setAttribute('transform', 'translate(' + cx + ',' + SHRINE2_BELL_CY + ')');
  setEllipse('shrine2-bell-body', 0, 0, bellR, bellR*1.1);
  setEllipse('shrine2-bell-mouth', 0, bellR*0.9, bellR*1.0, bellR*0.22);
}

function updateShrine2Rope(swayOffset) {
  var cx = SHRINE2_CX;
  var ctrl1X = cx + 8 + swayOffset;
  var ctrl1Y = SHRINE2_ROPE_TOP_Y + (SHRINE2_ROPE_BOT_Y - SHRINE2_ROPE_TOP_Y) * 0.33;
  var ctrl2X = cx - 8 + swayOffset;
  var ctrl2Y = SHRINE2_ROPE_TOP_Y + (SHRINE2_ROPE_BOT_Y - SHRINE2_ROPE_TOP_Y) * 0.66;
  var d = 'M ' + cx + ' ' + SHRINE2_ROPE_TOP_Y +
          ' C ' + ctrl1X + ' ' + ctrl1Y + ', ' +
                  ctrl2X + ' ' + ctrl2Y + ', ' +
                  cx + ' ' + SHRINE2_ROPE_BOT_Y;
  document.getElementById('shrine2-rope-path').setAttribute('d', d);
}

function positionLighthouse() {
  if (!G || !G.lighthouseActive) return;

  var lhGroup = document.getElementById('lighthouse-group');
  lhGroup.style.display = '';

  // Lighthouse on far right of beach
  var lhX = CW * 0.88;
  var lhW = Math.min(CW * 0.06, 40);
  var lhH = lhW * 3.5;
  var lhY = BEACH_TOP - lhH + BEACH_H * 0.1;

  setRect('lh-body', lhX - lhW/2, lhY, lhW, lhH);
  setRect('lh-stripe1', lhX - lhW/2, lhY + lhH*0.25, lhW, lhH*0.12);
  setRect('lh-stripe2', lhX - lhW/2, lhY + lhH*0.55, lhW, lhH*0.12);
  setEllipse('lh-top', lhX, lhY, lhW*0.65, lhH*0.08);

  var lhLightEl = document.getElementById('lh-light');
  lhLightEl.setAttribute('cx', lhX);
  lhLightEl.setAttribute('cy', lhY + lhH*0.02);
  lhLightEl.setAttribute('r', lhW*0.4);
}

// ---------------------------------------------------------------------------
// Wave animation
// ---------------------------------------------------------------------------
var waveProgress = 0;  // 0 = flat, 1 = peaked, fades back
var waveRng = mulberry32(12345);

function triggerWave() {
  waveProgress = 1.0;
}

function updateWavePaths(progress) {
  // Wave path 1 — main wave, morphs upward based on progress
  var seaLineY = SEA_TOP + SEA_H;
  var peak = progress * Math.min(SEA_H * 0.9, 80);
  var w = CW;

  // Control points jitter for organic feel
  var r = waveRng;
  var jitter = progress * 6;

  // Main crest shape — bezier sweep across canvas
  var crestX = CW * 0.5;
  var crestY = seaLineY - peak;

  var d1 = 'M 0 ' + (seaLineY + 4) +
            ' C ' + (w*0.15) + ' ' + (seaLineY - peak*0.4 - jitter) + ',' +
                    (w*0.35) + ' ' + (crestY - peak*0.15) + ',' +
                    crestX + ' ' + crestY +
            ' C ' + (w*0.65) + ' ' + (crestY + peak*0.08) + ',' +
                    (w*0.82) + ' ' + (seaLineY - peak*0.35 + jitter) + ',' +
                    w + ' ' + (seaLineY + 4) +
            ' L ' + w + ' ' + (SEA_TOP + SEA_H + BEACH_H + 20) +
            ' L 0 ' + (SEA_TOP + SEA_H + BEACH_H + 20) + ' Z';

  document.getElementById('wave-path').setAttribute('d', d1);

  // Wave 2 — secondary, smaller, offset
  var peak2 = peak * 0.55;
  var crestX2 = CW * 0.38;
  var crestY2 = seaLineY - peak2;

  var d2 = 'M 0 ' + (seaLineY + 8) +
            ' C ' + (w*0.18) + ' ' + (seaLineY - peak2*0.3) + ',' +
                    (w*0.30) + ' ' + (crestY2) + ',' +
                    crestX2 + ' ' + crestY2 +
            ' C ' + (w*0.48) + ' ' + (crestY2 + peak2*0.2) + ',' +
                    (w*0.70) + ' ' + (seaLineY - peak2*0.5) + ',' +
                    w + ' ' + (seaLineY + 6) +
            ' L ' + w + ' ' + (SEA_TOP + SEA_H + BEACH_H + 20) +
            ' L 0 ' + (SEA_TOP + SEA_H + BEACH_H + 20) + ' Z';

  document.getElementById('wave-path-2').setAttribute('d', d2);
}

// ---------------------------------------------------------------------------
// Bell swing animation
// ---------------------------------------------------------------------------
var bellSwingAngle = 0;
var bellSwingVelocity = 0;
var bell2SwingAngle = 0;
var bell2SwingVelocity = 0;

function triggerBellSwing(which) {
  if (which === 2) {
    bell2SwingVelocity = 22;
  } else {
    bellSwingVelocity = 22;
  }
}

function updateBells(dt) {
  // Damped pendulum
  bellSwingVelocity -= bellSwingAngle * 8 * dt;
  bellSwingVelocity *= Math.pow(0.92, dt * 60);
  bellSwingAngle += bellSwingVelocity * dt;

  var bellSwing = document.getElementById('bell-swing');
  bellSwing.setAttribute('transform', 'rotate(' + bellSwingAngle.toFixed(2) + ',0,0)');

  if (G && G.secondShrineActive) {
    bell2SwingVelocity -= bell2SwingAngle * 8 * dt;
    bell2SwingVelocity *= Math.pow(0.92, dt * 60);
    bell2SwingAngle += bell2SwingVelocity * dt;

    var bell2Swing = document.getElementById('shrine2-bell-swing');
    bell2Swing.setAttribute('transform', 'rotate(' + bell2SwingAngle.toFixed(2) + ',0,0)');
  }
}

// ---------------------------------------------------------------------------
// Moon + sky drift
// ---------------------------------------------------------------------------
var MOON_PHASES = [
  { icon: '🌑', label: 'New Moon',       shadowX: -28 },
  { icon: '🌒', label: 'Waxing Crescent', shadowX: -14 },
  { icon: '🌓', label: 'Half Moon',       shadowX: 0  },
  { icon: '🌕', label: 'Full Moon',       shadowX: 28 },
];

var SKY_COLORS = [
  // Dawn-to-dusk cycle based on sessionTime
  { top: '#1a2a4a', mid: '#3d6a8a', bot: '#7ab4c8' },  // night
  { top: '#2a1a3a', mid: '#6a3a5a', bot: '#c8805a' },  // sunset
  { top: '#0a1826', mid: '#1a3a5a', bot: '#4a8aaa' },  // deep night
];

function updateMoon(phase, cycleTimer) {
  // Moon x drifts slowly across sky
  var moonX = CW * (0.15 + 0.70 * (cycleTimer / (BALANCE.MOON_CYCLE_DURATION * 4)) % 1.0);
  var moonY = SKY_H * 0.20;

  var moonCircle = document.getElementById('moon-circle');
  var moonShadow = document.getElementById('moon-shadow');
  var moonR = Math.min(CW * 0.035, 28);

  moonCircle.setAttribute('cx', moonX);
  moonCircle.setAttribute('cy', moonY);
  moonCircle.setAttribute('r', moonR);

  moonShadow.setAttribute('cx', moonX + MOON_PHASES[phase].shadowX * (moonR/28));
  moonShadow.setAttribute('cy', moonY);
  moonShadow.setAttribute('r', moonR);

  if (phase === 0) {
    // New moon — nearly invisible
    moonCircle.setAttribute('fill', '#2a3a5a');
    moonShadow.setAttribute('fill', '#0a1828');
    moonShadow.setAttribute('fill-opacity', '0.9');
  } else if (phase === 3) {
    // Full moon — glowing
    moonCircle.setAttribute('fill', '#f0e8c0');
    moonShadow.setAttribute('fill', 'transparent');
    moonCircle.setAttribute('filter', 'url(#fx-glow)');
    moonGroup_fullGlow(true);
  } else {
    moonCircle.setAttribute('fill', '#e8ddb0');
    moonShadow.setAttribute('fill', '#0a1828');
    moonShadow.setAttribute('fill-opacity', '0.7');
    moonCircle.setAttribute('filter', 'url(#fx-glow)');
    moonGroup_fullGlow(false);
  }
}

function moonGroup_fullGlow(active) {
  var mc = document.getElementById('moon-circle');
  if (active) {
    mc.setAttribute('class', 'moon-full-glow');
  } else {
    mc.setAttribute('class', '');
  }
}

function updateSkyColors(sessionTime) {
  // Slowly cycle sky hue — full cycle ~120s
  var t = (sessionTime % 120) / 120;
  // Night → slight dawn warmth → night
  var warmth = Math.max(0, Math.sin(t * Math.PI * 2));

  var topH = Math.round(210 + warmth * 30);
  var midH = Math.round(195 + warmth * 15);
  var botH = Math.round(185 + warmth * 40);
  var topL = Math.round(14 + warmth * 8);
  var midL = Math.round(28 + warmth * 12);
  var botL = Math.round(50 + warmth * 20);

  var topS = Math.round(40 + warmth * 20);

  document.getElementById('sky-stop-top').setAttribute('stop-color',
    'hsl(' + topH + ',' + topS + '%,' + topL + '%)');
  document.getElementById('sky-stop-mid').setAttribute('stop-color',
    'hsl(' + midH + ',50%,' + midL + '%)');
  document.getElementById('sky-stop-bot').setAttribute('stop-color',
    'hsl(' + botH + ',60%,' + botL + '%)');
}

// ---------------------------------------------------------------------------
// Night stars layer
// ---------------------------------------------------------------------------
function buildNightStars() {
  var layer = document.getElementById('stars-layer');
  layer.innerHTML = '';
  var rng = mulberry32(7777);
  var count = 45;
  for (var i = 0; i < count; i++) {
    var x = rng() * CW;
    var y = rng() * SKY_H * 0.85;
    var r = 0.8 + rng() * 1.4;
    var op = 0.3 + rng() * 0.6;
    var star = svgEl('circle', {
      cx: x, cy: y, r: r,
      fill: '#e8e8f0',
      opacity: op,
    });
    layer.appendChild(star);
  }
}

// ---------------------------------------------------------------------------
// Seashells on beach (decorative accumulation)
// ---------------------------------------------------------------------------
var shellSandPositions = []; // pre-seeded positions

function initShellPositions() {
  var rng = mulberry32(54321);
  shellSandPositions = [];
  for (var i = 0; i < BALANCE.SHELL_PILE_CAP; i++) {
    shellSandPositions.push({
      x: CW * (0.05 + rng() * 0.90),
      y: BEACH_TOP + BEACH_H * (0.08 + rng() * 0.55),
      r: 5 + rng() * 7,
      rx: 1 + rng() * 3,
      hue: 30 + Math.floor(rng() * 40),
      rotate: Math.floor(rng() * 360),
    });
  }
}

function syncShellsOnSand(count) {
  if (!shellSandPositions.length) initShellPositions();

  var layer = document.getElementById('shells-layer');
  var existing = layer.children.length;
  var target = Math.min(count, BALANCE.SHELL_PILE_CAP);

  // Add new shells up to target
  for (var i = existing; i < target; i++) {
    var p = shellSandPositions[i];
    var g = svgEl('g', {
      transform: 'translate(' + p.x + ',' + p.y + ') rotate(' + p.rotate + ')',
    });
    // Shell body (ellipse)
    var body = svgEl('ellipse', {
      cx: 0, cy: 0, rx: p.r, ry: p.r * 0.6,
      fill: 'hsl(' + p.hue + ',60%,72%)',
      stroke: 'hsl(' + p.hue + ',40%,55%)',
      'stroke-width': 1,
    });
    // Shell ridge lines
    var ridge = svgEl('path', {
      d: 'M -' + (p.r*0.6) + ' 0 Q 0 -' + (p.r*0.3) + ' ' + (p.r*0.6) + ' 0',
      stroke: 'hsl(' + p.hue + ',40%,55%)',
      'stroke-width': 0.8,
      fill: 'none',
      opacity: '0.7',
    });
    g.appendChild(body);
    g.appendChild(ridge);
    layer.appendChild(g);
  }
}

// ---------------------------------------------------------------------------
// Shell pickup popup ("+N shells" floating text)
// ---------------------------------------------------------------------------
function spawnShellPopup(x, y, amount, isPearl) {
  var layer = document.getElementById('particle-layer');
  var text = svgEl('text', {
    x: x,
    y: y,
    'text-anchor': 'middle',
    'font-family': 'Georgia, serif',
    'font-size': isPearl ? '20' : '17',
    'font-weight': 'bold',
    fill: isPearl ? '#d0a8f8' : '#f0e890',
    'pointer-events': 'none',
  });
  text.textContent = isPearl ? '+1 🔮 pearl!' : '+' + fmt(amount);

  layer.appendChild(text);

  // Animate upward and fade
  var startY = y;
  var startTime = performance.now();
  var dur = 1200;

  function step(now) {
    var elapsed = now - startTime;
    var t = elapsed / dur;
    if (t >= 1) {
      if (text.parentNode) text.parentNode.removeChild(text);
      return;
    }
    var yt = startY - 40 * easeOut(t);
    var op = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    text.setAttribute('y', yt.toFixed(1));
    text.setAttribute('opacity', op.toFixed(2));
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

// ---------------------------------------------------------------------------
// Wave ripple particles (small circles emanating from waterline)
// ---------------------------------------------------------------------------
function spawnWaveParticles() {
  var layer = document.getElementById('particle-layer');
  var rng = mulberry32(Date.now() & 0xFFFF);
  for (var i = 0; i < 5; i++) {
    (function(idx) {
      var px = CW * (0.1 + rng() * 0.8);
      var py = SEA_TOP + SEA_H - 6;
      var r = 3 + rng() * 5;
      var c = svgEl('circle', {
        cx: px, cy: py, r: r,
        fill: 'none',
        stroke: '#80c8e0',
        'stroke-width': 1.5,
        opacity: '0.7',
      });
      layer.appendChild(c);

      var t0 = performance.now();
      var dur = 600 + idx * 120;

      (function tick(now) {
        var t = (now - t0) / dur;
        if (t >= 1) { if (c.parentNode) c.parentNode.removeChild(c); return; }
        c.setAttribute('r', (r + t * 16).toFixed(1));
        c.setAttribute('opacity', (0.7 * (1 - t)).toFixed(2));
        requestAnimationFrame(tick);
      })(performance.now());
    })(i);
  }
}

// ---------------------------------------------------------------------------
// Pearl Diver creature
// ---------------------------------------------------------------------------
var diverAnimating = false;

function showDiver() {
  if (diverAnimating) return;
  diverAnimating = true;

  var diverGroup = document.getElementById('diver-group');
  diverGroup.style.display = '';

  // Force reflow before measuring
  void diverGroup.getBoundingClientRect();

  var bodyW = Math.min(CW * 0.07, 52);
  var bodyH = bodyW * 0.5;
  var swimY = SEA_TOP + SEA_H * 0.5;

  // Build diver shape
  setEllipse('diver-body', 0, 0, bodyW, bodyH);
  setEllipse('diver-head', bodyW * 0.8, -bodyH * 0.1, bodyH * 0.55, bodyH * 0.55);
  setEllipse('diver-mask', bodyW * 0.85, -bodyH * 0.1, bodyH * 0.32, bodyH * 0.32);
  document.getElementById('diver-eye').setAttribute('cx', bodyW * 0.88);
  document.getElementById('diver-eye').setAttribute('cy', -bodyH * 0.12);
  document.getElementById('diver-eye').setAttribute('r', bodyH * 0.08);
  document.getElementById('diver-fin').setAttribute('d',
    'M -' + bodyW + ' ' + bodyH*0.3 +
    ' Q -' + (bodyW*1.2) + ' 0 -' + bodyW + ' -' + bodyH*0.3 +
    ' L -' + (bodyW*0.8) + ' 0 Z'
  );
  setEllipse('diver-bubble', bodyW * 1.0, -bodyH * 0.5, bodyH * 0.18, bodyH * 0.18);

  // Swim from right to left
  var startX = CW + bodyW * 2;
  var endX = -bodyW * 3;

  var t0 = performance.now();
  var dur = 5500;

  // Position outer group via transform ATTRIBUTE
  diverGroup.setAttribute('transform', 'translate(' + startX + ',' + swimY + ')');

  // Set up pointer handler for clicking diver
  diverGroup.setAttribute('class', '');

  function tick(now) {
    var elapsed = now - t0;
    var progress = elapsed / dur;

    if (progress >= 1) {
      diverGroup.style.display = 'none';
      diverAnimating = false;
      if (G) G.diverVisible = false;
      return;
    }

    var x = startX + (endX - startX) * easeOut(Math.min(progress, 1));
    // Gentle sine bob
    var bobY = swimY + Math.sin(progress * Math.PI * 6) * 5;
    diverGroup.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + bobY.toFixed(1) + ')');

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function hideDiver() {
  var diverGroup = document.getElementById('diver-group');
  diverGroup.style.display = 'none';
  diverAnimating = false;
}

// ---------------------------------------------------------------------------
// Seagull flyby
// ---------------------------------------------------------------------------
var gullRng = mulberry32(99999);

function spawnSeagull() {
  var layer = document.getElementById('seagull-layer');
  var yPos = SKY_H * (0.15 + gullRng() * 0.55);
  var goLeft = gullRng() < 0.5;
  var startX = goLeft ? CW + 30 : -30;
  var endX = goLeft ? -50 : CW + 50;
  var scale = 0.7 + gullRng() * 0.6;

  // Seagull SVG: two arc-wings
  var g = svgEl('g');
  var ws = 14 * scale;
  // Left wing
  var lw = svgEl('path', {
    d: 'M 0 0 Q -' + ws + ' -' + (ws*0.5) + ' -' + (ws*2) + ' 0',
    stroke: '#c8d0d8',
    'stroke-width': 2 * scale,
    fill: 'none',
    'stroke-linecap': 'round',
  });
  // Right wing
  var rw = svgEl('path', {
    d: 'M 0 0 Q ' + ws + ' -' + (ws*0.5) + ' ' + (ws*2) + ' 0',
    stroke: '#c8d0d8',
    'stroke-width': 2 * scale,
    fill: 'none',
    'stroke-linecap': 'round',
  });
  // Body dot
  var bd = svgEl('circle', { cx: 0, cy: 0, r: 2 * scale, fill: '#b8c0c8' });
  g.appendChild(lw);
  g.appendChild(rw);
  g.appendChild(bd);
  layer.appendChild(g);

  var t0 = performance.now();
  var dur = 5000 + gullRng() * 3000;

  function tick(now) {
    var t = (now - t0) / dur;
    if (t >= 1) { if (g.parentNode) g.parentNode.removeChild(g); return; }
    var x = startX + (endX - startX) * t;
    var y = yPos + Math.sin(t * Math.PI * 4) * 8;
    // Flapping via scaleY on INNER element — outer uses translate ATTRIBUTE
    var flapY = 1 - Math.abs(Math.sin(now / 250)) * 0.4;
    g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(1,' + flapY.toFixed(2) + ')');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Lighthouse beam sweep
// ---------------------------------------------------------------------------
var beamAngle = 0;

function triggerLighthouseBeam() {
  var beam = document.getElementById('lh-beam');
  beam.setAttribute('opacity', '0.18');

  var lhX = CW * 0.88;
  var lhY_top = BEACH_TOP - Math.min(CW * 0.06, 40) * 3.5 + BEACH_H * 0.1;

  var t0 = performance.now();
  var dur = 8000;

  function tick(now) {
    var t = (now - t0) / dur;
    if (t >= 1) {
      beam.setAttribute('opacity', '0');
      return;
    }
    var angle = t * 360 * 1.5; // 1.5 full sweeps
    var rad = (angle * Math.PI) / 180;
    var bx = lhX + Math.cos(rad) * CW * 0.5;
    var by = lhY_top + Math.sin(rad) * CH * 0.5;
    var beamLen = 80;
    beam.setAttribute('d',
      'M ' + lhX + ' ' + lhY_top +
      ' L ' + (lhX + Math.cos(rad - 0.08) * beamLen * 10) + ' ' + (lhY_top + Math.sin(rad - 0.08) * beamLen * 10) +
      ' L ' + (lhX + Math.cos(rad + 0.08) * beamLen * 10) + ' ' + (lhY_top + Math.sin(rad + 0.08) * beamLen * 10) +
      ' Z'
    );
    var lhLight = document.getElementById('lh-light');
    lhLight.setAttribute('opacity', (0.5 + Math.sin(now / 100) * 0.3).toFixed(2));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Helper setters (avoid repeated attribute boilerplate)
// ---------------------------------------------------------------------------
function setRect(id, x, y, w, h) {
  var el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('x', x.toFixed(1));
  el.setAttribute('y', y.toFixed(1));
  el.setAttribute('width', w.toFixed(1));
  el.setAttribute('height', h.toFixed(1));
}

function setEllipse(id, cx, cy, rx, ry) {
  var el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('cx', cx.toFixed(1));
  el.setAttribute('cy', cy.toFixed(1));
  el.setAttribute('rx', rx.toFixed(1));
  el.setAttribute('ry', ry.toFixed(1));
}

// ---------------------------------------------------------------------------
// Handle canvas resize
// ---------------------------------------------------------------------------
function onCanvasResize() {
  calcLayout();
  positionSkyRects();
  positionShrine();
  positionRope();
  positionMoon();
  initShellPositions();
  buildNightStars();
  // Re-sync shell visuals
  var shellLayer = document.getElementById('shells-layer');
  shellLayer.innerHTML = '';
  if (G) syncShellsOnSand(G.shellsOnSand);
  if (G && G.secondShrineActive) positionSecondShrine();
  if (G && G.lighthouseActive) positionLighthouse();
}
