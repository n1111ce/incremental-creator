// canvas.js — SVG game object management for Prism Forge
// All functions exposed on window.*
// CRITICAL rules:
//   - Never .className= on SVG elements. Use setAttribute('class','...') or classList.add/remove
//   - Position via setAttribute('transform','translate(x,y)') on outer group
//   - CSS animations go on a separate INNER group, never on positioning group
//   - Pointer Events only (pointerdown/pointermove/pointerup)

(function() {
  'use strict';

  var svg = null;
  var W = 0, H = 0;

  // SVG namespace helper
  function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  // ---- Layer refs ----
  var layerBg, layerVats, layerMold, layerPrisms, layerMirrors,
      layerBeams, layerNodes, layerOrbs, layerGolem, layerStorm, layerParticles;

  // ---- Internal IDs ----
  var _nextId = 1;
  function uid() { return 'o' + (_nextId++); }

  // ======================================================
  // INIT
  // ======================================================
  window.initCanvas = function() {
    svg = document.getElementById('game-canvas');
    W = svg.clientWidth;
    H = svg.clientHeight;

    layerBg       = document.getElementById('layer-bg');
    layerVats     = document.getElementById('layer-vats');
    layerMold     = document.getElementById('layer-mold');
    layerPrisms   = document.getElementById('layer-prisms');
    layerMirrors  = document.getElementById('layer-mirrors');
    layerBeams    = document.getElementById('layer-beams');
    layerNodes    = document.getElementById('layer-nodes');
    layerOrbs     = document.getElementById('layer-orbs');
    layerGolem    = document.getElementById('layer-golem');
    layerStorm    = document.getElementById('layer-storm');
    layerParticles= document.getElementById('layer-particles');

    _buildDefs();
    _buildBgStars();
    _buildVats();
    _buildMold();
    _buildPrisms();
    _buildLightNodes();
    _buildVoidZone();

    window.addEventListener('resize', function() {
      W = svg.clientWidth;
      H = svg.clientHeight;
      _repositionAll();
    });
  };

  // ======================================================
  // SVG DEFS (filters, gradients)
  // ======================================================
  function _buildDefs() {
    var defs = document.getElementById('svg-defs');
    defs.innerHTML = '';

    // Glow filter
    var fGlow = svgEl('filter');
    fGlow.setAttribute('id', 'glow');
    fGlow.setAttribute('x', '-50%'); fGlow.setAttribute('y', '-50%');
    fGlow.setAttribute('width', '200%'); fGlow.setAttribute('height', '200%');
    var blur = svgEl('feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '4');
    blur.setAttribute('result', 'blurred');
    var comp = svgEl('feComposite');
    comp.setAttribute('in', 'blurred'); comp.setAttribute('in2', 'SourceGraphic');
    comp.setAttribute('operator', 'over');
    fGlow.appendChild(blur); fGlow.appendChild(comp);
    defs.appendChild(fGlow);

    // Strong glow filter
    var fGlow2 = svgEl('filter');
    fGlow2.setAttribute('id', 'glow-strong');
    fGlow2.setAttribute('x', '-80%'); fGlow2.setAttribute('y', '-80%');
    fGlow2.setAttribute('width', '360%'); fGlow2.setAttribute('height', '360%');
    var blur2 = svgEl('feGaussianBlur');
    blur2.setAttribute('in', 'SourceGraphic');
    blur2.setAttribute('stdDeviation', '9');
    blur2.setAttribute('result', 'blurred2');
    var merge2 = svgEl('feMerge');
    var mn1 = svgEl('feMergeNode'); mn1.setAttribute('in', 'blurred2');
    var mn2 = svgEl('feMergeNode'); mn2.setAttribute('in', 'SourceGraphic');
    merge2.appendChild(mn1); merge2.appendChild(mn2);
    fGlow2.appendChild(blur2); fGlow2.appendChild(merge2);
    defs.appendChild(fGlow2);

    // Void gradient
    var vg = svgEl('linearGradient');
    vg.setAttribute('id', 'voidGrad');
    vg.setAttribute('x1','0%'); vg.setAttribute('y1','0%');
    vg.setAttribute('x2','100%'); vg.setAttribute('y2','100%');
    var vs1 = svgEl('stop'); vs1.setAttribute('offset','0%'); vs1.setAttribute('stop-color','#1a0030');
    var vs2 = svgEl('stop'); vs2.setAttribute('offset','100%'); vs2.setAttribute('stop-color','#0a0020');
    vg.appendChild(vs1); vg.appendChild(vs2);
    defs.appendChild(vg);

    // Prism gradient
    var pg = svgEl('linearGradient');
    pg.setAttribute('id', 'prismGrad');
    pg.setAttribute('x1','0%'); pg.setAttribute('y1','0%');
    pg.setAttribute('x2','100%'); pg.setAttribute('y2','100%');
    var ps1 = svgEl('stop'); ps1.setAttribute('offset','0%'); ps1.setAttribute('stop-color','#1a2a6a');
    var ps2 = svgEl('stop'); ps2.setAttribute('offset','100%'); ps2.setAttribute('stop-color','#4bc8f0');
    pg.appendChild(ps1); pg.appendChild(ps2);
    defs.appendChild(pg);
  }

  // ======================================================
  // BACKGROUND STARS
  // ======================================================
  function _buildBgStars() {
    layerBg.innerHTML = '';
    for (var i = 0; i < 60; i++) {
      var c = svgEl('circle');
      c.setAttribute('cx', Math.random() * 2000);
      c.setAttribute('cy', Math.random() * 1200);
      c.setAttribute('r', Math.random() * 1.5 + 0.3);
      c.setAttribute('fill', 'rgba(200,220,255,' + (Math.random() * 0.4 + 0.1) + ')');
      layerBg.appendChild(c);
    }
  }

  // ======================================================
  // LIGHT NODES (3 six-pointed star shapes)
  // ======================================================
  function _starPolygon(cx, cy, r1, r2, points) {
    var pts = [];
    var n = points * 2;
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI / points) * i - Math.PI / 2;
      var r = (i % 2 === 0) ? r1 : r2;
      pts.push((cx + Math.cos(angle) * r) + ',' + (cy + Math.sin(angle) * r));
    }
    return pts.join(' ');
  }

  function _buildLightNodes() {
    G.lightNodes = [];
    var positions = [
      { x: 0.18, y: 0.12 },
      { x: 0.50, y: 0.08 },
      { x: 0.82, y: 0.14 }
    ];
    positions.forEach(function(pos, i) {
      var x = pos.x * W;
      var y = pos.y * H + 60;
      var node = _createLightNode(i, x, y);
      G.lightNodes.push(node);
    });
  }

  function _createLightNode(id, x, y) {
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-node', id);

    // Glow halo behind star
    var halo = svgEl('circle');
    halo.setAttribute('cx', '0'); halo.setAttribute('cy', '0');
    halo.setAttribute('r', '38');
    halo.setAttribute('fill', 'rgba(75,200,240,0.07)');
    halo.setAttribute('filter', 'url(#glow)');
    outer.appendChild(halo);

    // Inner group for CSS animation
    var inner = svgEl('g');
    inner.setAttribute('class', 'node-pulse');

    // Six-pointed star
    var star = svgEl('polygon');
    var pts = _starPolygon(0, 0, 28, 13, 6);
    star.setAttribute('points', pts);
    star.setAttribute('fill', '#4bc8f0');
    star.setAttribute('filter', 'url(#glow-strong)');
    inner.appendChild(star);

    // Center gem
    var gem = svgEl('circle');
    gem.setAttribute('cx', '0'); gem.setAttribute('cy', '0'); gem.setAttribute('r', '8');
    gem.setAttribute('fill', '#e8f4ff');
    gem.setAttribute('filter', 'url(#glow)');
    inner.appendChild(gem);

    outer.appendChild(inner);
    layerNodes.appendChild(outer);

    return {
      id: id,
      x: x, y: y,
      active: true,
      respawnTimer: 0,
      el: outer,
      innerEl: inner,
      halo: halo
    };
  }

  window.dimLightNode = function(node) {
    node.active = false;
    node.innerEl.setAttribute('class', '');
    node.innerEl.style.opacity = '0.2';
    node.halo.setAttribute('fill', 'rgba(75,200,240,0.01)');
  };

  window.relightNode = function(node) {
    node.active = true;
    node.innerEl.setAttribute('class', 'node-spawning');
    node.innerEl.style.opacity = '1';
    node.halo.setAttribute('fill', 'rgba(75,200,240,0.07)');
    // switch back to pulse after spawn anim
    setTimeout(function() {
      if (node.innerEl) node.innerEl.setAttribute('class', 'node-pulse');
    }, 500);
  };

  // ======================================================
  // PRISMS (2 triangles, color-selectable via drag)
  // ======================================================
  var PRISM_POSITIONS = [
    { x: 0.30, y: 0.40 },
    { x: 0.68, y: 0.38 }
  ];

  function _buildPrisms() {
    G.prisms = [];
    PRISM_POSITIONS.forEach(function(pos, i) {
      var x = pos.x * W;
      var y = pos.y * H + 30;
      var prism = _createPrism(i, x, y);
      G.prisms.push(prism);
    });
  }

  function _createPrism(id, x, y) {
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-prism', id);

    // Triangle body
    var tri = svgEl('polygon');
    tri.setAttribute('points', '0,-40 35,25 -35,25');
    tri.setAttribute('fill', 'url(#prismGrad)');
    tri.setAttribute('stroke', '#4bc8f0');
    tri.setAttribute('stroke-width', '1.5');
    tri.setAttribute('filter', 'url(#glow)');
    outer.appendChild(tri);

    // Color beam extending from prism
    var beam = svgEl('line');
    beam.setAttribute('x1', '0'); beam.setAttribute('y1', '25');
    beam.setAttribute('x2', '0'); beam.setAttribute('y2', '90');
    beam.setAttribute('stroke', '#e8f4ff');
    beam.setAttribute('stroke-width', '2.5');
    beam.setAttribute('stroke-linecap', 'round');
    beam.setAttribute('opacity', '0.7');
    beam.setAttribute('filter', 'url(#glow)');
    outer.appendChild(beam);

    // Color wheel ring (hidden by default)
    var wheel = svgEl('circle');
    wheel.setAttribute('cx', '0'); wheel.setAttribute('cy', '0'); wheel.setAttribute('r', '52');
    wheel.setAttribute('fill', 'none');
    wheel.setAttribute('stroke', 'rgba(200,200,255,0.25)');
    wheel.setAttribute('stroke-width', '2');
    wheel.setAttribute('stroke-dasharray', '6 4');
    wheel.setAttribute('visibility', 'hidden');
    outer.appendChild(wheel);

    // Color label
    var label = svgEl('text');
    label.setAttribute('x', '0'); label.setAttribute('y', '48');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#e8f4ff');
    label.setAttribute('font-size', '10');
    label.setAttribute('opacity', '0.7');
    label.textContent = 'white';
    outer.appendChild(label);

    layerPrisms.appendChild(outer);

    return {
      id: id,
      x: x, y: y,
      colorIdx: 0, // index into PRISM_CYCLE
      el: outer,
      beam: beam,
      wheel: wheel,
      label: label,
      holding: false,
      holdStartX: 0
    };
  }

  window.updatePrismColor = function(prism) {
    var color = PRISM_CYCLE[prism.colorIdx];
    var hex = COLOR_MAP[color] || '#e8f4ff';
    prism.beam.setAttribute('stroke', hex);
    prism.label.textContent = color;
    prism.label.setAttribute('fill', hex);
  };

  window.showPrismWheel = function(prism) {
    prism.wheel.setAttribute('visibility', 'visible');
    prism.holding = true;
  };

  window.hidePrismWheel = function(prism) {
    prism.wheel.setAttribute('visibility', 'hidden');
    prism.holding = false;
  };

  // ======================================================
  // COLOR VATS (3 trapezoids at bottom)
  // ======================================================
  var vatEls = []; // { bg, liquid, label, fillText, el }
  var VAT_DISPLAY_COLORS = ['#e05050', '#4bc8f0', '#9b50e0'];
  var VAT_LABEL_NAMES    = ['Warm Vat', 'Cool Vat', 'Arcane Vat'];

  function _vatX(i) {
    var spacing = W / 4;
    return spacing * (i + 1);
  }
  function _vatY() { return H * 0.80; }

  function _buildVats() {
    vatEls = [];
    for (var i = 0; i < 3; i++) {
      var x = _vatX(i);
      var y = _vatY();
      var ve = _createVat(i, x, y);
      vatEls.push(ve);
    }
  }

  function _vatTrapezoid(bw, tw, h) {
    // bottom-left, bottom-right, top-right, top-left
    var bx = bw / 2, tx = tw / 2;
    return (-bx) + ',' + h + ' ' + bx + ',' + h + ' ' + tx + ',0 ' + (-tx) + ',0';
  }

  function _createVat(id, x, y) {
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-vat', id);

    var BW = 80, TW = 100, VH = 70;
    var col = VAT_DISPLAY_COLORS[id];

    // Outer shell
    var shell = svgEl('polygon');
    shell.setAttribute('points', _vatTrapezoid(BW, TW, VH));
    shell.setAttribute('fill', 'rgba(0,0,10,0.7)');
    shell.setAttribute('stroke', col);
    shell.setAttribute('stroke-width', '1.5');
    shell.setAttribute('opacity', '0.9');
    outer.appendChild(shell);

    // Liquid fill (clipped to trapezoid via rect inside)
    var liquidClip = svgEl('clipPath');
    var clipId = 'vat-clip-' + id;
    liquidClip.setAttribute('id', clipId);
    var clipPoly = svgEl('polygon');
    clipPoly.setAttribute('points', _vatTrapezoid(BW - 4, TW - 4, VH - 2));
    liquidClip.appendChild(clipPoly);
    document.getElementById('svg-defs').appendChild(liquidClip);

    var liquidG = svgEl('g');
    liquidG.setAttribute('clip-path', 'url(#' + clipId + ')');

    var liquid = svgEl('rect');
    liquid.setAttribute('x', -(TW / 2 + 2)); liquid.setAttribute('y', '0');
    liquid.setAttribute('width', TW + 4); liquid.setAttribute('height', VH);
    liquid.setAttribute('fill', col);
    liquid.setAttribute('opacity', '0');
    liquid.setAttribute('filter', 'url(#glow)');
    liquidG.appendChild(liquid);
    outer.appendChild(liquidG);

    // Vat label
    var label = svgEl('text');
    label.setAttribute('x', '0'); label.setAttribute('y', VH + 16);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', col);
    label.setAttribute('font-size', '10');
    label.setAttribute('opacity', '0.75');
    label.setAttribute('font-family', 'system-ui, sans-serif');
    label.textContent = VAT_LABEL_NAMES[id];
    outer.appendChild(label);

    // Fill count text
    var fillText = svgEl('text');
    fillText.setAttribute('x', '0'); fillText.setAttribute('y', VH / 2 + 5);
    fillText.setAttribute('text-anchor', 'middle');
    fillText.setAttribute('fill', '#fff');
    fillText.setAttribute('font-size', '16');
    fillText.setAttribute('font-weight', 'bold');
    fillText.setAttribute('opacity', '0.85');
    fillText.setAttribute('font-family', 'system-ui, sans-serif');
    fillText.textContent = '0/3';
    outer.appendChild(fillText);

    layerVats.appendChild(outer);
    return { id: id, el: outer, liquid: liquid, fillText: fillText, shell: shell, x: x, y: y, BW: BW, TW: TW, VH: VH };
  }

  window.updateVatDisplay = function(i) {
    var ve = vatEls[i];
    if (!ve) return;
    var fill = G.vatFill[i];
    var frac = fill / 3;
    ve.liquid.setAttribute('opacity', (frac * 0.6 + 0.05).toString());
    var VH = ve.VH;
    var liqH = Math.max(0, frac * (VH - 4));
    ve.liquid.setAttribute('y', (VH - liqH).toString());
    ve.liquid.setAttribute('height', liqH.toString());
    ve.fillText.textContent = fill + '/3';
  };

  window.flashVat = function(i) {
    var ve = vatEls[i];
    if (!ve) return;
    var origStroke = ve.shell.getAttribute('stroke');
    ve.shell.setAttribute('stroke', '#ffffff');
    ve.shell.setAttribute('stroke-width', '3');
    setTimeout(function() {
      ve.shell.setAttribute('stroke', origStroke);
      ve.shell.setAttribute('stroke-width', '1.5');
    }, 300);
  };

  // returns true if point (px,py) in canvas coords is within vat i
  window.pointInVat = function(i, px, py) {
    var ve = vatEls[i];
    if (!ve) return false;
    var dx = px - ve.x;
    var dy = py - ve.y;
    return dx > -(ve.TW / 2 + 12) && dx < (ve.TW / 2 + 12) &&
           dy > -10 && dy < ve.VH + 10;
  };

  // ======================================================
  // GEM MOLD (rhythm-tap target, bottom-center)
  // ======================================================
  var moldEl = null; // { outer, needle, greenArc, flashCircle }

  function _buildMold() {
    var x = W * 0.5;
    var y = H * 0.83;
    moldEl = _createMold(x, y);
  }

  function _createMold(x, y) {
    var R = 36;
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-mold', '1');

    // Outer ring
    var ring = svgEl('circle');
    ring.setAttribute('cx', '0'); ring.setAttribute('cy', '0'); ring.setAttribute('r', R.toString());
    ring.setAttribute('fill', 'rgba(0,0,10,0.8)');
    ring.setAttribute('stroke', '#4bc8f0');
    ring.setAttribute('stroke-width', '1.5');
    outer.appendChild(ring);

    // Green zone arc — drawn as arc path
    var greenArc = svgEl('path');
    greenArc.setAttribute('fill', 'none');
    greenArc.setAttribute('stroke', '#50c878');
    greenArc.setAttribute('stroke-width', '6');
    greenArc.setAttribute('stroke-linecap', 'round');
    greenArc.setAttribute('opacity', '0.7');
    outer.appendChild(greenArc);

    // Rotating needle
    var needle = svgEl('line');
    needle.setAttribute('x1', '0'); needle.setAttribute('y1', '0');
    needle.setAttribute('x2', '0'); needle.setAttribute('y2', -R + 4 + '');
    needle.setAttribute('stroke', '#e8f4ff');
    needle.setAttribute('stroke-width', '2');
    needle.setAttribute('stroke-linecap', 'round');
    outer.appendChild(needle);

    // Center dot
    var dot = svgEl('circle');
    dot.setAttribute('cx', '0'); dot.setAttribute('cy', '0'); dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#4bc8f0');
    outer.appendChild(dot);

    // Mold label
    var lbl = svgEl('text');
    lbl.setAttribute('x', '0'); lbl.setAttribute('y', R + 16);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', '#4bc8f0');
    lbl.setAttribute('font-size', '9');
    lbl.setAttribute('font-family', 'system-ui, sans-serif');
    lbl.textContent = 'GEM MOLD';
    outer.appendChild(lbl);

    // Flash circle (hidden)
    var flashCircle = svgEl('circle');
    flashCircle.setAttribute('cx', '0'); flashCircle.setAttribute('cy', '0'); flashCircle.setAttribute('r', R.toString());
    flashCircle.setAttribute('fill', 'rgba(80,200,120,0)');
    flashCircle.setAttribute('pointer-events', 'none');
    outer.appendChild(flashCircle);

    layerMold.appendChild(outer);
    return { outer: outer, needle: needle, greenArc: greenArc, flashCircle: flashCircle, x: x, y: y, R: R };
  }

  function _arcPath(cx, cy, r, startDeg, endDeg) {
    var s = (startDeg - 90) * Math.PI / 180;
    var e = (endDeg - 90) * Math.PI / 180;
    var x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    var x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    var large = (endDeg - startDeg) > 180 ? 1 : 0;
    return 'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2;
  }

  window.updateMoldNeedle = function() {
    if (!moldEl) return;
    var phase = G.moldPhase;
    var rad = (phase - 90) * Math.PI / 180;
    var R = moldEl.R;
    var nx = Math.cos(rad) * (R - 4);
    var ny = Math.sin(rad) * (R - 4);
    moldEl.needle.setAttribute('x2', nx.toString());
    moldEl.needle.setAttribute('y2', ny.toString());

    // Green arc
    var half = (G.moldGreenWidth || 60) / 2;
    var gStart = 270 - half; // degrees, 0=top
    var gEnd   = 270 + half;
    var path = _arcPath(0, 0, R - 3, gStart, gEnd);
    moldEl.greenArc.setAttribute('d', path);
  };

  window.flashMoldSuccess = function() {
    if (!moldEl) return;
    moldEl.flashCircle.setAttribute('fill', 'rgba(80,200,120,0.5)');
    setTimeout(function() {
      moldEl.flashCircle.setAttribute('fill', 'rgba(80,200,120,0)');
    }, 300);
  };

  window.flashMoldMiss = function() {
    if (!moldEl) return;
    moldEl.flashCircle.setAttribute('fill', 'rgba(220,80,80,0.4)');
    setTimeout(function() {
      moldEl.flashCircle.setAttribute('fill', 'rgba(80,200,120,0)');
    }, 250);
  };

  window.pointInMold = function(px, py) {
    if (!moldEl) return false;
    var dx = px - moldEl.x;
    var dy = py - moldEl.y;
    return Math.sqrt(dx * dx + dy * dy) < moldEl.R + 8;
  };

  // ======================================================
  // COLOR ORBS (spawn, float, drag, deposit)
  // ======================================================
  window.spawnOrb = function(color) {
    if (!color) {
      var prism = G.prisms[Math.floor(Math.random() * G.prisms.length)];
      color = PRISM_CYCLE[prism.colorIdx];
    }
    if (color === 'white') color = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];

    var id = uid();
    var x = G.prisms[0] ? G.prisms[Math.floor(Math.random() * G.prisms.length)].x : W * 0.5;
    var y = H * 0.55;
    var hex = COLOR_MAP[color] || '#e8f4ff';

    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-orb', id);

    var inner = svgEl('g');

    // Teardrop: circle + small triangle pointing down
    var circle = svgEl('circle');
    circle.setAttribute('cx', '0'); circle.setAttribute('cy', '-6'); circle.setAttribute('r', '16');
    circle.setAttribute('fill', hex);
    circle.setAttribute('filter', 'url(#glow)');
    inner.appendChild(circle);

    var tip = svgEl('polygon');
    tip.setAttribute('points', '-7,-4 7,-4 0,12');
    tip.setAttribute('fill', hex);
    tip.setAttribute('filter', 'url(#glow)');
    inner.appendChild(tip);

    // Color label dot inside
    var dot = svgEl('circle');
    dot.setAttribute('cx', '0'); dot.setAttribute('cy', '-6'); dot.setAttribute('r', '5');
    dot.setAttribute('fill', 'rgba(255,255,255,0.35)');
    inner.appendChild(dot);

    outer.appendChild(inner);
    layerOrbs.appendChild(outer);

    var orb = {
      id: id,
      x: x, y: y,
      color: color,
      vy: -(0.4 + Math.random() * 0.4),
      dragging: false,
      el: outer,
      innerEl: inner,
      age: 0,
      isVoid: false
    };
    G.colorOrbs.push(orb);
    return orb;
  };

  window.removeOrb = function(orb) {
    if (orb.el && orb.el.parentNode) orb.el.parentNode.removeChild(orb.el);
    G.colorOrbs = G.colorOrbs.filter(function(o) { return o.id !== orb.id; });
  };

  window.updateOrbPosition = function(orb) {
    orb.el.setAttribute('transform', 'translate(' + orb.x + ',' + orb.y + ')');
  };

  window.makeOrbVoid = function(orb) {
    orb.isVoid = true;
    orb.color = 'void';
    var hex = COLOR_MAP['void'];
    var circle = orb.innerEl.querySelector('circle');
    var tip = orb.innerEl.querySelector('polygon');
    if (circle) { circle.setAttribute('fill', hex); }
    if (tip) { tip.setAttribute('fill', hex); }
    orb.innerEl.setAttribute('class', 'void-pulsing');
  };

  window.bringOrbToFront = function(orb) {
    layerOrbs.appendChild(orb.el); // moves to end = top z-order
  };

  // ======================================================
  // PARTICLE BURST (on node tap)
  // ======================================================
  window.burstParticles = function(x, y, color) {
    var col = color || '#4bc8f0';
    for (var i = 0; i < 6; i++) {
      (function(idx) {
        var angle = (Math.PI * 2 / 6) * idx;
        var dist = 30 + Math.random() * 20;
        var ex = x + Math.cos(angle) * dist;
        var ey = y + Math.sin(angle) * dist;

        var c = svgEl('circle');
        c.setAttribute('cx', x.toString()); c.setAttribute('cy', y.toString());
        c.setAttribute('r', '4');
        c.setAttribute('fill', col);
        c.setAttribute('opacity', '1');
        layerParticles.appendChild(c);

        var start = performance.now();
        function step(t) {
          var elapsed = t - start;
          var frac = elapsed / 600;
          if (frac >= 1) { if (c.parentNode) c.parentNode.removeChild(c); return; }
          var cx2 = x + (ex - x) * frac;
          var cy2 = y + (ey - y) * frac;
          c.setAttribute('cx', cx2.toString()); c.setAttribute('cy', cy2.toString());
          c.setAttribute('opacity', (1 - frac).toString());
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      })(i);
    }
  };

  // Float text label (+N)
  window.floatText = function(x, y, text, color) {
    var t = svgEl('text');
    t.setAttribute('x', x.toString()); t.setAttribute('y', y.toString());
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', color || '#e8f4ff');
    t.setAttribute('font-size', '14');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('font-family', 'system-ui, sans-serif');
    t.setAttribute('pointer-events', 'none');
    t.setAttribute('class', 'float-text-anim');
    t.textContent = text;
    layerParticles.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 1200);
  };

  // ======================================================
  // MIRROR ARRAY (after unlock)
  // ======================================================
  var beamLine1 = null, beamLine2 = null, beamCollector = null;

  window.initMirrors = function() {
    // Create 2 mirrors
    G.mirrors = [];
    var positions = [
      { x: W * 0.20, y: H * 0.50 },
      { x: W * 0.75, y: H * 0.45 }
    ];
    positions.forEach(function(pos, i) {
      var m = _createMirror(i, pos.x, pos.y);
      G.mirrors.push(m);
    });

    // Rainbow beam starting from left edge
    beamLine1 = svgEl('line');
    beamLine1.setAttribute('stroke', 'url(#rainbowBeam)');
    beamLine1.setAttribute('stroke-width', '3');
    beamLine1.setAttribute('opacity', '0.6');
    beamLine1.setAttribute('stroke-linecap', 'round');
    layerBeams.insertBefore(beamLine1, layerBeams.firstChild);

    beamLine2 = svgEl('line');
    beamLine2.setAttribute('stroke', 'url(#rainbowBeam)');
    beamLine2.setAttribute('stroke-width', '3');
    beamLine2.setAttribute('opacity', '0.6');
    beamLine2.setAttribute('stroke-linecap', 'round');
    layerBeams.insertBefore(beamLine2, layerBeams.firstChild);

    // Add rainbow gradient to defs
    var rg = svgEl('linearGradient');
    rg.setAttribute('id', 'rainbowBeam');
    rg.setAttribute('x1', '0%'); rg.setAttribute('y1', '0%');
    rg.setAttribute('x2', '100%'); rg.setAttribute('y2', '0%');
    var cols = ['#e05050','#e09050','#e8d050','#50c878','#4bc8f0','#9b50e0'];
    cols.forEach(function(c, idx) {
      var s = svgEl('stop');
      s.setAttribute('offset', (idx / (cols.length - 1) * 100) + '%');
      s.setAttribute('stop-color', c);
      rg.appendChild(s);
    });
    document.getElementById('svg-defs').appendChild(rg);

    // Collector star (right side)
    beamCollector = svgEl('g');
    beamCollector.setAttribute('transform', 'translate(' + (W * 0.92) + ',' + (H * 0.42) + ')');
    var cstar = svgEl('polygon');
    cstar.setAttribute('points', _starPolygon(0, 0, 14, 6, 5));
    cstar.setAttribute('fill', '#c8a84b');
    cstar.setAttribute('opacity', '0.4');
    cstar.setAttribute('filter', 'url(#glow)');
    beamCollector.appendChild(cstar);
    layerBeams.appendChild(beamCollector);

    window.updateMirrorBeam();
  };

  function _createMirror(id, x, y) {
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-mirror', id);

    var rect = svgEl('rect');
    rect.setAttribute('x', '-10'); rect.setAttribute('y', '-40');
    rect.setAttribute('width', '20'); rect.setAttribute('height', '80');
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', 'rgba(180,230,255,0.15)');
    rect.setAttribute('stroke', '#4bc8f0');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('filter', 'url(#glow)');
    outer.appendChild(rect);

    layerMirrors.appendChild(outer);
    return { id: id, x: x, y: y, el: outer };
  }

  window.updateMirrorBeam = function() {
    if (!beamLine1 || !G.mirrors.length) return;
    var m0 = G.mirrors[0], m1 = G.mirrors[1];
    var startX = 0, startY = m0.y;

    // Beam: left edge → mirror0 → mirror1 → collector
    beamLine1.setAttribute('x1', startX.toString()); beamLine1.setAttribute('y1', startY.toString());
    beamLine1.setAttribute('x2', m0.x.toString()); beamLine1.setAttribute('y2', m0.y.toString());

    beamLine2.setAttribute('x1', m0.x.toString()); beamLine2.setAttribute('y1', m0.y.toString());
    beamLine2.setAttribute('x2', m1.x.toString()); beamLine2.setAttribute('y2', m1.y.toString());

    // Check alignment: is collector near the beam's projected end?
    var collX = W * 0.92, collY = H * 0.42;
    var aligned = Math.abs(m1.y - collY) < 50;

    if (beamCollector) {
      var cstar = beamCollector.querySelector('polygon');
      if (cstar) cstar.setAttribute('opacity', aligned ? '1' : '0.25');
      beamCollector.setAttribute('transform', 'translate(' + collX + ',' + collY + ')');
    }

    G.mirrorsAligned = aligned;
  };

  window.moveMirrorTo = function(mirror, x, y) {
    mirror.x = x; mirror.y = y;
    mirror.el.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    window.updateMirrorBeam();
  };

  // ======================================================
  // SPECTRAL GOLEM
  // ======================================================
  window.spawnGolem = function() {
    if (G.golem && G.golem.el) {
      layerGolem.innerHTML = '';
      G.golem = null;
    }
    var x = W * 0.55 + (Math.random() - 0.5) * W * 0.2;
    var y = H * 0.28 + (Math.random() - 0.5) * H * 0.1;

    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-golem', '1');

    var inner = svgEl('g');
    inner.setAttribute('class', 'golem-bob');

    // Body ellipse
    var body = svgEl('ellipse');
    body.setAttribute('cx', '0'); body.setAttribute('cy', '0');
    body.setAttribute('rx', '22'); body.setAttribute('ry', '28');
    body.setAttribute('fill', 'rgba(155,80,224,0.25)');
    body.setAttribute('stroke', '#9b50e0');
    body.setAttribute('stroke-width', '1.5');
    body.setAttribute('filter', 'url(#glow-strong)');
    inner.appendChild(body);

    // Eyes
    var eye1 = svgEl('circle');
    eye1.setAttribute('cx', '-7'); eye1.setAttribute('cy', '-6');
    eye1.setAttribute('r', '4'); eye1.setAttribute('fill', '#e8f4ff');
    eye1.setAttribute('filter', 'url(#glow)');
    inner.appendChild(eye1);

    var eye2 = svgEl('circle');
    eye2.setAttribute('cx', '7'); eye2.setAttribute('cy', '-6');
    eye2.setAttribute('r', '4'); eye2.setAttribute('fill', '#e8f4ff');
    eye2.setAttribute('filter', 'url(#glow)');
    inner.appendChild(eye2);

    // Wavy tentacles
    for (var t = 0; t < 3; t++) {
      var tx = (t - 1) * 12;
      var path = svgEl('path');
      path.setAttribute('d', 'M' + tx + ',22 Q' + (tx + 8) + ',38 ' + tx + ',52');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#9b50e0');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('opacity', '0.6');
      inner.appendChild(path);
    }

    outer.appendChild(inner);
    layerGolem.appendChild(outer);

    G.golem = {
      x: x, y: y,
      el: outer,
      visible: true,
      timer: 0,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.3
    };
  };

  window.hideGolem = function() {
    if (G.golem && G.golem.el) {
      G.golem.el.setAttribute('visibility', 'hidden');
      G.golem.visible = false;
    }
  };

  window.showGolem = function() {
    if (G.golem && G.golem.el) {
      G.golem.el.setAttribute('visibility', 'visible');
      G.golem.visible = true;
    }
  };

  window.updateGolemPosition = function() {
    if (!G.golem || !G.golem.visible) return;
    G.golem.el.setAttribute('transform', 'translate(' + G.golem.x + ',' + G.golem.y + ')');
  };

  window.flashGolem = function() {
    if (!G.golem || !G.golem.el) return;
    var body = G.golem.el.querySelector('ellipse');
    if (body) {
      body.setAttribute('fill', 'rgba(232,244,255,0.6)');
      setTimeout(function() {
        if (body) body.setAttribute('fill', 'rgba(155,80,224,0.25)');
      }, 300);
    }
  };

  // ======================================================
  // STORM SPARKS
  // ======================================================
  window.spawnStormSparks = function() {
    // Clear old sparks
    G.stormSparks.forEach(function(sp) {
      if (sp.el && sp.el.parentNode) sp.el.parentNode.removeChild(sp.el);
    });
    G.stormSparks = [];

    var count = G.stormSparkCount || 8;
    for (var i = 0; i < count; i++) {
      var x = W * 0.1 + Math.random() * W * 0.8;
      var y = H * 0.12 + Math.random() * H * 0.5;
      var sp = _createSpark(uid(), x, y);
      G.stormSparks.push(sp);
    }
  };

  function _jagged(r) {
    // 8-pointed jagged star
    var pts = [];
    for (var i = 0; i < 16; i++) {
      var angle = (Math.PI * 2 / 16) * i - Math.PI / 2;
      var rad = i % 2 === 0 ? r : r * 0.45;
      pts.push(Math.cos(angle) * rad + ',' + Math.sin(angle) * rad);
    }
    return pts.join(' ');
  }

  function _createSpark(id, x, y) {
    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-spark', id);

    var inner = svgEl('g');
    inner.setAttribute('class', 'node-pulse');

    var star = svgEl('polygon');
    star.setAttribute('points', _jagged(16));
    star.setAttribute('fill', '#e8d050');
    star.setAttribute('filter', 'url(#glow-strong)');
    inner.appendChild(star);

    var core = svgEl('circle');
    core.setAttribute('cx', '0'); core.setAttribute('cy', '0'); core.setAttribute('r', '5');
    core.setAttribute('fill', '#fff');
    inner.appendChild(core);

    outer.appendChild(inner);
    layerStorm.appendChild(outer);

    return { id: id, x: x, y: y, el: outer, alive: true, age: 0 };
  }

  window.removeSpark = function(spark) {
    if (spark.el && spark.el.parentNode) spark.el.parentNode.removeChild(spark.el);
    G.stormSparks = G.stormSparks.filter(function(s) { return s.id !== spark.id; });
  };

  window.clearAllSparks = function() {
    G.stormSparks.forEach(function(s) {
      if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
    });
    G.stormSparks = [];
  };

  // ======================================================
  // VOID PRISM (upper right, unlocked)
  // ======================================================
  var voidPrismEl = null;

  function _buildVoidZone() {
    // Built but hidden until unlocked
  }

  window.initVoidPrism = function() {
    if (voidPrismEl) return;
    var x = W * 0.88, y = H * 0.15;

    var outer = svgEl('g');
    outer.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    outer.setAttribute('data-voidprism', '1');

    var inner = svgEl('g');
    inner.setAttribute('class', 'void-pulsing');

    // Inverted triangle
    var tri = svgEl('polygon');
    tri.setAttribute('points', '0,38 -32,-18 32,-18');
    tri.setAttribute('fill', 'url(#voidGrad)');
    tri.setAttribute('stroke', '#9b50e0');
    tri.setAttribute('stroke-width', '1.5');
    tri.setAttribute('filter', 'url(#glow-strong)');
    inner.appendChild(tri);

    // Dark eye
    var eye = svgEl('ellipse');
    eye.setAttribute('cx', '0'); eye.setAttribute('cy', '6');
    eye.setAttribute('rx', '10'); eye.setAttribute('ry', '7');
    eye.setAttribute('fill', 'rgba(60,0,80,0.9)');
    eye.setAttribute('stroke', '#9b50e0');
    eye.setAttribute('stroke-width', '1');
    inner.appendChild(eye);

    // Label
    var lbl = svgEl('text');
    lbl.setAttribute('x', '0'); lbl.setAttribute('y', '54');
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', '#9b50e0');
    lbl.setAttribute('font-size', '9');
    lbl.setAttribute('font-family', 'system-ui, sans-serif');
    lbl.textContent = 'VOID PRISM';
    inner.appendChild(lbl);

    outer.appendChild(inner);
    layerPrisms.appendChild(outer);

    voidPrismEl = { outer: outer, x: x, y: y };
  };

  window.pointInVoidPrism = function(px, py) {
    if (!voidPrismEl) return false;
    var dx = px - voidPrismEl.x;
    var dy = py - voidPrismEl.y;
    return Math.abs(dx) < 38 && dy > -22 && dy < 42;
  };

  // ======================================================
  // CANVAS TICK (called each frame from game.js)
  // ======================================================
  window.tickCanvas = function(dt) {
    _tickOrbs(dt);
    _tickGolem(dt);
    _tickSparks(dt);
    window.updateMoldNeedle();
  };

  function _tickOrbs(dt) {
    var toRemove = [];
    G.colorOrbs.forEach(function(orb) {
      orb.age += dt;
      if (!orb.dragging) {
        orb.y += orb.vy;
        // Bounce gently at top
        if (orb.y < 80) orb.vy = Math.abs(orb.vy) * 0.5;
        updateOrbPosition(orb);
      }
      // Fade approaching expiry (8s)
      var lifespan = 8000;
      var fadeStart = lifespan * 0.7;
      if (orb.age > fadeStart) {
        var opacity = 1 - (orb.age - fadeStart) / (lifespan - fadeStart);
        orb.el.setAttribute('opacity', Math.max(0, opacity).toString());
      }
      if (orb.age >= lifespan) toRemove.push(orb);
    });
    toRemove.forEach(function(orb) { window.removeOrb(orb); });
  }

  function _tickGolem(dt) {
    if (!G.golem || !G.golem.visible) return;
    // Random walk
    G.golem.x += G.golem.vx;
    G.golem.y += G.golem.vy;
    // Bounds
    if (G.golem.x < W * 0.1 || G.golem.x > W * 0.9) G.golem.vx *= -1;
    if (G.golem.y < 80 || G.golem.y > H * 0.55) G.golem.vy *= -1;
    // Occasionally change direction
    if (Math.random() < 0.005) G.golem.vx = (Math.random() - 0.5) * 0.6;
    if (Math.random() < 0.005) G.golem.vy = (Math.random() - 0.5) * 0.3;
    updateGolemPosition();
  }

  function _tickSparks(dt) {
    var toRemove = [];
    G.stormSparks.forEach(function(sp) {
      sp.age += dt;
      if (sp.age > 6000) toRemove.push(sp);
      else if (sp.age > 4000) {
        var op = 1 - (sp.age - 4000) / 2000;
        sp.el.setAttribute('opacity', Math.max(0, op).toString());
      }
    });
    toRemove.forEach(function(sp) { window.removeSpark(sp); });
    if (toRemove.length > 0 && G.stormSparks.length === 0) {
      G.stormActive = false;
    }
  }

  // ======================================================
  // REPOSITION on resize
  // ======================================================
  function _repositionAll() {
    // Reposition light nodes
    var positions = [
      { x: 0.18, y: 0.12 },
      { x: 0.50, y: 0.08 },
      { x: 0.82, y: 0.14 }
    ];
    G.lightNodes.forEach(function(node, i) {
      node.x = positions[i].x * W;
      node.y = positions[i].y * H + 60;
      node.el.setAttribute('transform', 'translate(' + node.x + ',' + node.y + ')');
    });

    // Reposition prisms
    G.prisms.forEach(function(prism, i) {
      prism.x = PRISM_POSITIONS[i].x * W;
      prism.y = PRISM_POSITIONS[i].y * H + 30;
      prism.el.setAttribute('transform', 'translate(' + prism.x + ',' + prism.y + ')');
    });

    // Reposition vats
    for (var i = 0; i < 3; i++) {
      vatEls[i].x = _vatX(i);
      vatEls[i].y = _vatY();
      vatEls[i].el.setAttribute('transform', 'translate(' + vatEls[i].x + ',' + vatEls[i].y + ')');
    }

    // Reposition mold
    if (moldEl) {
      var mx = W * 0.5, my = H * 0.83;
      moldEl.x = mx; moldEl.y = my;
      moldEl.outer.setAttribute('transform', 'translate(' + mx + ',' + my + ')');
    }

    // Update beams
    if (G.unlocks && G.unlocks.mirrorArray) window.updateMirrorBeam();
  }

  // Hit-test helpers used by game.js
  window.getNodeAtPoint = function(px, py) {
    return G.lightNodes.find(function(n) {
      if (!n.active) return false;
      var dx = px - n.x, dy = py - n.y;
      return Math.sqrt(dx*dx + dy*dy) < 34;
    }) || null;
  };

  window.getPrismAtPoint = function(px, py) {
    return G.prisms.find(function(p) {
      var dx = px - p.x, dy = py - p.y;
      return Math.abs(dx) < 38 && Math.abs(dy) < 46;
    }) || null;
  };

  window.getOrbAtPoint = function(px, py) {
    // Walk in reverse z-order (last drawn = front)
    for (var i = G.colorOrbs.length - 1; i >= 0; i--) {
      var orb = G.colorOrbs[i];
      var dx = px - orb.x, dy = py - (orb.y - 6);
      if (Math.sqrt(dx*dx + dy*dy) < 22) return orb;
    }
    return null;
  };

  window.getMirrorAtPoint = function(px, py) {
    if (!G.unlocks || !G.unlocks.mirrorArray) return null;
    return G.mirrors.find(function(m) {
      var dx = px - m.x, dy = py - m.y;
      return Math.abs(dx) < 16 && Math.abs(dy) < 44;
    }) || null;
  };

  window.getSparkAtPoint = function(px, py) {
    return G.stormSparks.find(function(sp) {
      var dx = px - sp.x, dy = py - sp.y;
      return Math.sqrt(dx*dx + dy*dy) < 22;
    }) || null;
  };

  window.getGolemAtPoint = function(px, py) {
    if (!G.golem || !G.golem.visible) return null;
    var dx = px - G.golem.x, dy = py - G.golem.y;
    return Math.sqrt(dx*dx + dy*dy) < 34 ? G.golem : null;
  };

})();
