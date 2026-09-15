/* DarkAnalytica site: entrance reveals, work filter, and four explanatory diagrams.
   Each diagram exposes render(t) (t in seconds). Animation runs only while visible;
   with prefers-reduced-motion a single representative frame is drawn. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = { page:'#F5F7FA', line:'#D8DEE6', ink:'#0E1726', ink2:'#3D4A5C', ink3:'#5F6B7C',
    navy:'#0B2545', steel:'#3E5C76', brass:'#8A6A1F', warn:'#B7791F', warnText:'#80550F', teal:'#2F6F73', tealText:'#2F6F73', brassText:'#74581A',
    tNavy:'#EDF1F6', tSteel:'#EEF2F5', tBrass:'#F4EFE2', tWarn:'#F8F0E1', tTeal:'#E9F2F2' };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function set(e, attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); }
  var clamp = function (x, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, x)); };
  var ease = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
  function lerp(a, b, u) { return a + (b - a) * u; }
  function txt(parent, x, y, s, o) {
    o = o || {};
    return el('text', { x:x, y:y, 'font-size':o.size || 12, fill:o.fill || C.ink2, 'text-anchor':o.anchor || 'start',
      'font-weight':o.weight || 400, 'class':o.mono ? 'mono' : '', 'letter-spacing':o.ls || 0 }, parent, s);
  }
  function node(parent, x, y, w, h, title, sub, stroke) {
    var g = el('g', {}, parent);
    var r = el('rect', { x:x, y:y, width:w, height:h, rx:4, fill:'#fff', stroke:stroke || C.line, 'stroke-width':1.5 }, g);
    var t = txt(g, x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 4), title, { anchor:'middle', fill:C.ink, weight:600, size:13 });
    var s = sub ? txt(g, x + w / 2, y + h / 2 + 14, sub, { anchor:'middle', fill:C.ink3, size:11, mono:true }) : null;
    return { g:g, r:r, t:t, s:s };
  }
  function setLabel(id, s) { var e = document.getElementById(id); if (e && e.textContent !== s) e.textContent = s; }

  /* ---------------- Figure 1: sensor-to-decision chain ---------------- */
  function chain(svg) {
    var P = 9; // loop seconds
    el('rect', { x:0, y:0, width:560, height:372, fill:'#fff' }, svg);
    // airspace strip
    el('rect', { x:20, y:16, width:520, height:78, rx:4, fill:C.tSteel }, svg);
    txt(svg, 30, 32, 'AIRSPACE', { mono:true, size:11, fill:C.ink3, ls:'.08em' });
    var trackPath = el('path', { d:'M40 70 C140 40 220 78 300 52 S460 44 520 60', fill:'none', stroke:C.steel, 'stroke-width':1.2, 'stroke-dasharray':'2 5', opacity:.7 }, svg);
    var L = trackPath.getTotalLength();
    var drone = el('g', {}, svg);
    el('path', { d:'M-9 0 H9 M0 -5 V5', stroke:C.ink, 'stroke-width':1.75, 'stroke-linecap':'round' }, drone);
    el('circle', { cx:0, cy:0, r:2.4, fill:C.ink }, drone);
    var trackRing = el('circle', { r:13, fill:'none', stroke:C.brass, 'stroke-width':1.5, opacity:0 }, drone);

    // sensors
    var sensors = [
      { name:'Radar', sub:'range, bearing', y:108, hit:1.2 },
      { name:'Passive RF', sub:'emitter bearing', y:164, hit:2.1 },
      { name:'EO / IR', sub:'visual ident.', y:220, hit:3.0 }
    ];
    var fx = 222, fy = 128, fw = 104, fh = 76;
    sensors.forEach(function (s) {
      s.n = node(svg, 20, s.y, 118, 46, s.name, s.sub);
      s.path = el('path', { d:'M138 ' + (s.y + 23) + ' C180 ' + (s.y + 23) + ' 180 ' + (fy + fh / 2) + ' ' + fx + ' ' + (fy + fh / 2), fill:'none', stroke:C.line, 'stroke-width':1.5 }, svg);
      s.len = s.path.getTotalLength();
      s.dot = el('circle', { r:4, fill:C.navy, opacity:0 }, svg);
      s.beam = el('path', { d:'', stroke:C.steel, 'stroke-width':1, 'stroke-dasharray':'3 3', opacity:0 }, svg);
    });
    var fusion = node(svg, fx, fy, fw, fh, 'Fusion', 'track 014');
    var fState = txt(svg, fx + fw / 2, fy + fh + 18, 'tentative', { anchor:'middle', mono:true, size:11, fill:C.ink3 });
    var c2 = node(svg, 360, 136, 82, 60, 'C2', 'picture');
    var dec = node(svg, 462, 136, 80, 60, 'Decision', 'operator');
    var e1 = el('path', { d:'M326 166 H360', stroke:C.line, 'stroke-width':1.5 }, svg);
    var e2 = el('path', { d:'M442 166 H462', stroke:C.line, 'stroke-width':1.5 }, svg);
    var hand = el('circle', { r:4.5, fill:C.brass, opacity:0 }, svg);
    var decMark = el('path', { d:'M490 214 l6 6 l12 -13', fill:'none', stroke:C.teal, 'stroke-width':2.2, 'stroke-linecap':'round', opacity:0 }, svg);

    // latency timeline
    var ty = 318, tx0 = 30, tx1 = 530;
    txt(svg, tx0, ty - 14, 'LATENCY, DETECTION TO DECISION', { mono:true, size:11, fill:C.ink3, ls:'.08em' });
    el('rect', { x:tx0, y:ty, width:tx1 - tx0, height:12, rx:2, fill:C.tSteel }, svg);
    var stages = [ ['Detect', 0.6, 3.3, C.steel], ['Fuse', 3.3, 4.2, C.navy], ['C2', 4.2, 5.4, C.brass], ['Decide', 5.4, 6.4, C.teal] ];
    var sx = function (s) { return tx0 + (s - 0.6) / (6.4 - 0.6) * (tx1 - tx0); };
    stages.forEach(function (s) {
      s.bar = el('rect', { x:sx(s[1]), y:ty, width:0, height:12, fill:s[3], opacity:.85 }, svg);
      s.lab = txt(svg, (sx(s[1]) + sx(s[2])) / 2, ty + 30, s[0], { anchor:'middle', size:11, mono:true, fill:C.ink3 });
    });

    return function render(t) {
      t = t % P;
      var fade = 1 - seg(t, 8.3, 9);
      // drone travel
      var u = ease(seg(t, 0, 7.6)) * 0.98 + 0.01;
      var p = trackPath.getPointAtLength(u * L);
      set(drone, { transform:'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')', opacity:fade });
      var hits = 0;
      sensors.forEach(function (s) {
        var k = seg(t, s.hit, s.hit + 0.9);
        var active = t >= s.hit && t < s.hit + 0.9;
        set(s.beam, { d:'M79 ' + s.y + ' L' + p.x.toFixed(1) + ' ' + (p.y + 8).toFixed(1), opacity:(active ? 0.8 * (1 - k) : 0) * fade });
        if (t >= s.hit + 0.9) hits++;
        var q = s.path.getPointAtLength(ease(k) * s.len);
        set(s.dot, { cx:q.x, cy:q.y, opacity:(t >= s.hit && k < 1 ? 1 : 0) * fade });
        set(s.n.r, { stroke:(t >= s.hit && t < 8.3) ? C.navy : C.line });
        set(s.path, { stroke:(t >= s.hit && t < 8.3) ? C.steel : C.line });
      });
      var confirmed = hits >= 2 && t < 8.3;
      set(fusion.r, { stroke:confirmed ? C.teal : (hits ? C.navy : C.line), 'stroke-width':confirmed ? 2 : 1.5 });
      fState.textContent = confirmed ? 'confirmed · ' + hits + ' of 3 sensors' : (hits ? 'tentative · 1 of 3' : 'searching');
      set(fState, { fill:confirmed ? C.tealText : C.ink3 });
      set(trackRing, { opacity:confirmed ? 0.9 * fade : 0 });
      setLabel('f1state', confirmed ? 'Track: confirmed' : (hits ? 'Track: tentative' : 'Track: searching'));
      // hand-off fusion -> C2 -> decision
      var h1 = seg(t, 3.5, 4.2), h2 = seg(t, 4.6, 5.4);
      var hx = t < 4.4 ? lerp(326, 360, ease(h1)) : lerp(442, 462, ease(h2));
      set(hand, { cx:hx, cy:166, opacity:((t > 3.5 && t < 4.3) || (t > 4.6 && t < 5.5) ? 1 : 0) * fade });
      set(e1, { stroke:t > 3.5 && t < 8.3 ? C.brass : C.line });
      set(e2, { stroke:t > 4.6 && t < 8.3 ? C.brass : C.line });
      set(c2.r, { stroke:t > 4.2 && t < 8.3 ? C.navy : C.line });
      set(dec.r, { stroke:t > 5.4 && t < 8.3 ? C.navy : C.line });
      set(decMark, { opacity:ease(seg(t, 5.8, 6.4)) * fade });
      stages.forEach(function (s) {
        var w = (sx(s[2]) - sx(s[1])) * ease(seg(t, s[1], s[2]));
        set(s.bar, { width:Math.max(0, w).toFixed(1), opacity:.85 * fade });
        set(s.lab, { fill:t >= s[1] && t < 8.3 ? C.ink2 : C.ink3 });
      });
    };
  }

  /* ---------------- Figure 2: layered detection rings + dead zone ---------------- */
  function rings(svg) {
    var P = 10;
    el('rect', { x:0, y:0, width:520, height:360, fill:'#fff' }, svg);
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id:'hatch', width:6, height:6, patternUnits:'userSpaceOnUse', patternTransform:'rotate(45)' }, defs);
    el('rect', { width:6, height:6, fill:C.tWarn }, pat);
    el('path', { d:'M0 0V6', stroke:C.warn, 'stroke-width':1, opacity:.55 }, pat);

    var site = { x:250, y:196 };
    var S = [
      { id:'Radar', x:250, y:196, r:150, col:C.navy, dash:'6 5' },
      { id:'RF', x:330, y:238, r:105, col:C.steel, dash:'2 4', sector:[-150, -20] },
      { id:'EO', x:196, y:226, r:70, col:C.teal, dash:'' }
    ];
    // obstacle and radar shadow
    var ob = { x:300, y:118, w:34, h:26 };
    var corners = [[ob.x, ob.y], [ob.x + ob.w, ob.y], [ob.x + ob.w, ob.y + ob.h], [ob.x, ob.y + ob.h]];
    function ang(pt) { return Math.atan2(pt[1] - site.y, pt[0] - site.x); }
    var angs = corners.map(ang), amin = Math.min.apply(null, angs), amax = Math.max.apply(null, angs);
    var R = 150;
    var near = function (a) { // nearest corner along that edge ray
      var best = null, bd = 1e9;
      corners.forEach(function (c) { var d = Math.hypot(c[0] - site.x, c[1] - site.y); if (Math.abs(ang(c) - a) < 1e-6 && d < bd) { bd = d; best = c; } });
      return best;
    };
    var cMin = near(amin), cMax = near(amax);
    var shadow = [cMin, [site.x + R * Math.cos(amin), site.y + R * Math.sin(amin)], [site.x + R * Math.cos(amax), site.y + R * Math.sin(amax)], cMax, [ob.x, ob.y + ob.h]];
    // polygon along the arc for drawing
    var arc = 'M' + cMin[0] + ' ' + cMin[1] + ' L' + (site.x + R * Math.cos(amin)).toFixed(1) + ' ' + (site.y + R * Math.sin(amin)).toFixed(1) +
      ' A' + R + ' ' + R + ' 0 0 1 ' + (site.x + R * Math.cos(amax)).toFixed(1) + ' ' + (site.y + R * Math.sin(amax)).toFixed(1) +
      ' L' + cMax[0] + ' ' + cMax[1] + ' Z';

    S.forEach(function (s) {
      if (s.sector) {
        var a0 = s.sector[0] * Math.PI / 180, a1 = s.sector[1] * Math.PI / 180;
        el('path', { d:'M' + s.x + ' ' + s.y + ' L' + (s.x + s.r * Math.cos(a0)).toFixed(1) + ' ' + (s.y + s.r * Math.sin(a0)).toFixed(1) +
          ' A' + s.r + ' ' + s.r + ' 0 0 1 ' + (s.x + s.r * Math.cos(a1)).toFixed(1) + ' ' + (s.y + s.r * Math.sin(a1)).toFixed(1) + ' Z',
          fill:C.tSteel, 'fill-opacity':.7, stroke:s.col, 'stroke-width':1.5, 'stroke-dasharray':s.dash }, svg);
      } else {
        el('circle', { cx:s.x, cy:s.y, r:s.r, fill:s.id === 'Radar' ? C.tNavy : C.tTeal, 'fill-opacity':s.id === 'Radar' ? .5 : .55, stroke:s.col, 'stroke-width':1.5, 'stroke-dasharray':s.dash }, svg);
      }
    });
    var sh = el('path', { d:arc, fill:'url(#hatch)', stroke:C.warn, 'stroke-width':1.2, 'stroke-dasharray':'3 3' }, svg);
    el('rect', { x:ob.x, y:ob.y, width:ob.w, height:ob.h, rx:2, fill:'#fff', stroke:C.ink2, 'stroke-width':1.5 }, svg);
    txt(svg, ob.x + ob.w / 2, ob.y + ob.h + 14, 'building', { anchor:'middle', size:11, fill:C.ink2 });
    txt(svg, 388, 108, 'LOS shadow', { size:11, mono:true, fill:C.warnText });
    txt(svg, 388, 122, '(radar dead zone)', { size:11, mono:true, fill:C.warnText });
    // site
    el('rect', { x:site.x - 9, y:site.y - 9, width:18, height:18, fill:'#fff', stroke:C.ink, 'stroke-width':1.75 }, svg);
    el('circle', { cx:site.x, cy:site.y, r:3, fill:C.navy }, svg);
    txt(svg, site.x - 22, site.y + 30, 'site / radar', { size:11, fill:C.ink2 });
    el('circle', { cx:S[1].x, cy:S[1].y, r:4, fill:C.steel }, svg);
    el('circle', { cx:S[2].x, cy:S[2].y, r:4, fill:C.teal }, svg);
    // legend
    var lg = el('g', { transform:'translate(18 22)' }, svg);
    [['Radar', C.navy, '6 5'], ['Passive RF sector', C.steel, '2 4'], ['EO / IR', C.teal, '']].forEach(function (l, i) {
      el('path', { d:'M0 ' + (i * 18) + ' H22', stroke:l[1], 'stroke-width':2, 'stroke-dasharray':l[2] }, lg);
      txt(lg, 30, i * 18 + 4, l[0], { size:11, fill:C.ink2 });
    });

    var trk = el('path', { d:'M500 22 C440 60 400 64 350 84 C300 106 280 150 262 186', fill:'none', stroke:C.steel, 'stroke-width':1.2, 'stroke-dasharray':'2 5' }, svg);
    var TL = trk.getTotalLength();
    var trail = el('path', { d:'', fill:'none', stroke:C.brass, 'stroke-width':2 }, svg);
    var dr = el('circle', { r:5, fill:C.brass, stroke:'#fff', 'stroke-width':1.5 }, svg);
    var badge = el('g', {}, svg);
    var bRect = el('rect', { x:0, y:-12, width:98, height:22, rx:3, fill:'#fff', stroke:C.line }, badge);
    var bTxt = txt(badge, 8, 3, '', { size:11, mono:true, fill:C.ink });

    function inPoly(pt, poly) {
      var c = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    }
    function covered(pt) {
      var n = 0;
      S.forEach(function (s) {
        var d = Math.hypot(pt[0] - s.x, pt[1] - s.y);
        if (d > s.r) return;
        if (s.sector) {
          var a = Math.atan2(pt[1] - s.y, pt[0] - s.x) * 180 / Math.PI;
          if (a < s.sector[0] || a > s.sector[1]) return;
        }
        if (s.id === 'Radar' && inPoly(pt, shadow)) return;
        n++;
      });
      return n;
    }
    // build a colour-coded trail from samples once
    var samples = [];
    for (var i = 0; i <= 120; i++) { var q = trk.getPointAtLength(TL * i / 120); samples.push([q.x, q.y, covered([q.x, q.y])]); }

    return function render(t) {
      t = t % P;
      var u = ease(seg(t, 0.3, 8.6));
      var fade = 1 - seg(t, 9.2, 10);
      var q = trk.getPointAtLength(u * TL);
      var n = covered([q.x, q.y]);
      var k = Math.floor(u * 120), d = '';
      for (var i = 0; i <= k; i++) d += (i ? 'L' : 'M') + samples[i][0].toFixed(1) + ' ' + samples[i][1].toFixed(1);
      set(trail, { d:d, opacity:.55 * fade });
      set(dr, { cx:q.x, cy:q.y, fill:n === 0 ? C.warn : C.brass, opacity:fade });
      var bx = Math.min(q.x + 12, 412), by = Math.max(q.y - 14, 24);
      set(badge, { transform:'translate(' + bx.toFixed(1) + ' ' + by.toFixed(1) + ')', opacity:fade });
      var inside = Math.hypot(q.x - S[0].x, q.y - S[0].y) <= S[0].r;
      var label = n === 0 ? (inside ? 'dead zone · 0' : 'outside · 0') : 'sensors · ' + n;
      bTxt.textContent = label;
      set(bTxt, { fill:n === 0 ? C.warnText : C.ink });
      set(bRect, { stroke:n === 0 ? C.warn : C.line, fill:n === 0 ? C.tWarn : '#fff' });
      set(sh, { 'stroke-width':n === 0 && inside ? 2 : 1.2 });
      setLabel('f2state', 'Sensors on target: ' + n);
    };
  }

  /* ---------------- Figure 3: fused navigation with innovation gate ---------------- */
  function nav(svg) {
    var P = 12;
    el('rect', { x:0, y:0, width:520, height:360, fill:'#fff' }, svg);
    var X0 = 36, X1 = 488;
    var yTrue = function (x) { return 150 + 42 * Math.sin((x - X0) / 80) + 14 * Math.sin((x - X0) / 31); };
    var spoof = [0.40, 0.66]; // fraction of path where GNSS is spoofed
    // spoof band
    el('rect', { x:lerp(X0, X1, spoof[0]), y:24, width:(X1 - X0) * (spoof[1] - spoof[0]), height:236, fill:C.tBrass, opacity:.8 }, svg);
    txt(svg, lerp(X0, X1, spoof[0]) + 8, 40, 'GNSS SPOOFED', { mono:true, size:11, fill:C.brassText, ls:'.06em' });
    var d = '';
    for (var x = X0; x <= X1; x += 4) d += (x === X0 ? 'M' : 'L') + x + ' ' + yTrue(x).toFixed(1);
    el('path', { d:d, fill:'none', stroke:C.ink3, 'stroke-width':1.2, 'stroke-dasharray':'3 4' }, svg);
    // legend
    var lg = el('g', { transform:'translate(24 290)' }, svg);
    var items = [['true path', C.ink3, 'line'], ['fused estimate', C.navy, 'line2'], ['GNSS accepted', C.teal, 'dot'], ['GNSS rejected', C.brass, 'x'], ['innovation gate', C.steel, 'ring']];
    items.forEach(function (it, i) {
      var gx = (i % 3) * 160, gy = Math.floor(i / 3) * 22;
      var g = el('g', { transform:'translate(' + gx + ' ' + gy + ')' }, lg);
      if (it[2] === 'line') el('path', { d:'M0 0H22', stroke:it[1], 'stroke-width':1.2, 'stroke-dasharray':'3 4' }, g);
      if (it[2] === 'line2') el('path', { d:'M0 0H22', stroke:it[1], 'stroke-width':2.2 }, g);
      if (it[2] === 'dot') el('circle', { cx:11, cy:0, r:3.5, fill:it[1] }, g);
      if (it[2] === 'x') el('path', { d:'M7 -4 L15 4 M15 -4 L7 4', stroke:it[1], 'stroke-width':1.8 }, g);
      if (it[2] === 'ring') el('circle', { cx:11, cy:0, r:7, fill:'none', stroke:it[1], 'stroke-width':1.2, 'stroke-dasharray':'3 2' }, g);
      txt(g, 30, 4, it[0], { size:11, fill:C.ink2 });
    });

    var est = el('path', { d:'', fill:'none', stroke:C.navy, 'stroke-width':2.2 }, svg);
    var fixes = el('g', {}, svg);
    var ell = el('ellipse', { rx:8, ry:6, fill:C.tNavy, 'fill-opacity':.6, stroke:C.navy, 'stroke-width':1.2 }, svg);
    var gate = el('circle', { r:20, fill:'none', stroke:C.steel, 'stroke-width':1.2, 'stroke-dasharray':'3 2' }, svg);
    var innov = el('path', { d:'', stroke:C.brass, 'stroke-width':1.2, 'stroke-dasharray':'2 2' }, svg);
    var veh = el('circle', { r:4.5, fill:C.navy, stroke:'#fff', 'stroke-width':1.5 }, svg);
    var sigmaT = txt(svg, 24, 272, '', { mono:true, size:11, fill:C.ink2 });

    // deterministic noise
    var nz = function (i, s) { var v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
    var N = 34;
    var fixNodes = [];
    for (var i = 0; i < N; i++) fixNodes.push(el('g', { opacity:0 }, fixes));

    function state(u) {
      // returns estimate offset (drift) and sigma at fraction u
      var sigma = 6, drift = 0;
      if (u > spoof[0]) {
        var inS = Math.min(u, spoof[1]) - spoof[0];
        sigma = 6 + inS * 90; drift = inS * 70;
      }
      if (u > spoof[1]) { var rec = seg(u, spoof[1], spoof[1] + 0.08); sigma = lerp(6 + (spoof[1] - spoof[0]) * 90, 6, ease(rec)); drift = lerp((spoof[1] - spoof[0]) * 70, 0, ease(rec)); }
      return { sigma:sigma, drift:drift };
    }

    return function render(t) {
      t = t % P;
      var u = seg(t, 0.2, 11);
      var fade = 1 - seg(t, 11.3, 12);
      var xNow = lerp(X0, X1, u);
      var dd = '';
      for (var x = X0; x <= xNow; x += 4) { var s = state((x - X0) / (X1 - X0)); dd += (x === X0 ? 'M' : 'L') + x + ' ' + (yTrue(x) - s.drift * 0.35).toFixed(1); }
      set(est, { d:dd, opacity:fade });
      var st = state(u), yE = yTrue(xNow) - st.drift * 0.35;
      set(veh, { cx:xNow, cy:yE, opacity:fade });
      set(ell, { cx:xNow, cy:yE, rx:(st.sigma * 1.3).toFixed(1), ry:st.sigma.toFixed(1), opacity:fade });
      var gr = 16 + st.sigma * 1.2;
      set(gate, { cx:xNow, cy:yE, r:gr.toFixed(1), opacity:fade });
      sigmaT.textContent = 'position uncertainty (1σ, illustrative): ' + (st.sigma / 3).toFixed(1) + ' m';
      var latestRejected = false, latest = null;
      for (var i = 0; i < N; i++) {
        var fu = (i + 0.5) / N;
        var g = fixNodes[i];
        if (fu > u) { set(g, { opacity:0 }); continue; }
        var fx = lerp(X0, X1, fu);
        var spoofed = fu > spoof[0] && fu < spoof[1];
        var pull = spoofed ? 22 + (fu - spoof[0]) * 260 : 0;
        var fy = yTrue(fx) + nz(i, 1) * 7 + pull;
        var sE = state(fu), yP = yTrue(fx) - sE.drift * 0.35;
        var rej = Math.abs(fy - yP) > 16 + sE.sigma * 1.2;
        if (!g.firstChild) {
          el('circle', { cx:0, cy:0, r:3.5 }, g);
          el('path', { d:'M-4 -4 L4 4 M4 -4 L-4 4', 'stroke-width':1.8 }, g);
        }
        set(g, { transform:'translate(' + fx.toFixed(1) + ' ' + Math.min(fy, 256).toFixed(1) + ')', opacity:(u - fu < 0.25 ? 1 : 0.45) * fade });
        set(g.firstChild, { fill:C.teal, opacity:rej ? 0 : 1 });
        set(g.lastChild, { stroke:C.brass, opacity:rej ? 1 : 0 });
        latest = { x:fx, y:Math.min(fy, 256), yP:yP }; latestRejected = rej;
      }
      if (latest && u - (latest.x - X0) / (X1 - X0) < 0.05) {
        set(innov, { d:'M' + latest.x.toFixed(1) + ' ' + latest.yP.toFixed(1) + ' L' + latest.x.toFixed(1) + ' ' + latest.y.toFixed(1), opacity:latestRejected ? fade : 0 });
      } else set(innov, { opacity:0 });
      set(gate, { stroke:latestRejected ? C.brass : C.steel });
      setLabel('f3state', latestRejected ? 'GNSS: rejected, outside gate' : 'GNSS: accepted');
    };
  }

  /* ---------------- Figure 4: evidence to assessment ---------------- */
  function method(svg) {
    var P = 10;
    el('rect', { x:0, y:0, width:560, height:340, fill:'#fff' }, svg);
    txt(svg, 20, 28, 'EVIDENCE', { mono:true, size:11, fill:C.ink3, ls:'.08em' });
    txt(svg, 236, 28, 'ANALYSIS', { mono:true, size:11, fill:C.ink3, ls:'.08em' });
    txt(svg, 412, 28, 'ASSESSMENT', { mono:true, size:11, fill:C.ink3, ls:'.08em' });
    var ev = [
      { t:'Official document', g:'A2', y:44, ok:true, at:0.6 },
      { t:'Open dataset', g:'B2', y:106, ok:true, at:2.0 },
      { t:'Satellite imagery', g:'B3', y:168, ok:true, at:3.4 },
      { t:'Unsourced claim', g:'F5', y:230, ok:false, at:4.8 }
    ];
    var ax = 208, ay = 70, aw = 184, ah = 176;
    el('rect', { x:ax, y:ay, width:aw, height:ah, rx:4, fill:'#fff', stroke:C.line, 'stroke-width':1.5 }, svg);
    el('path', { d:'M' + ax + ' ' + (ay + 2) + ' H' + (ax + aw), stroke:C.navy, 'stroke-width':2 }, svg);
    txt(svg, ax + 14, ay + 26, 'Assumptions', { weight:600, size:13, fill:C.ink });
    ['A1  sources independent', 'A2  imagery date correct', 'A3  no deception'].forEach(function (s, i) {
      txt(svg, ax + 14, ay + 48 + i * 18, s, { mono:true, size:11, fill:C.ink2 });
    });
    el('path', { d:'M' + (ax + 14) + ' ' + (ay + 106) + ' H' + (ax + aw - 14), stroke:C.line }, svg);
    txt(svg, ax + 14, ay + 128, 'Corroboration', { weight:600, size:13, fill:C.ink });
    var ticks = [];
    for (var i = 0; i < 3; i++) ticks.push(el('rect', { x:ax + 14 + i * 26, y:ay + 140, width:20, height:12, rx:2, fill:C.tSteel, stroke:C.line }, svg));
    var flag = txt(svg, ax + 98, ay + 151, '', { mono:true, size:11, fill:C.warnText });

    ev.forEach(function (e) {
      e.n = el('rect', { x:20, y:e.y, width:170, height:44, rx:4, fill:'#fff', stroke:C.line, 'stroke-width':1.5 }, svg);
      txt(svg, 32, e.y + 27, e.t, { size:13, fill:C.ink });
      e.chip = el('rect', { x:152, y:e.y + 13, width:28, height:18, rx:3, fill:e.ok ? C.tNavy : C.tWarn }, svg);
      txt(svg, 166, e.y + 26, e.g, { anchor:'middle', mono:true, size:11, fill:e.ok ? C.navy : C.warnText, weight:500 });
      e.p = el('path', { d:'M190 ' + (e.y + 22) + ' C206 ' + (e.y + 22) + ' 206 ' + (ay + ah / 2) + ' ' + ax + ' ' + (ay + ah / 2), fill:'none', stroke:C.line, 'stroke-width':1.5 }, svg);
      e.L = e.p.getTotalLength();
      e.dot = el('circle', { r:4, fill:e.ok ? C.navy : C.warn, opacity:0 }, svg);
    });
    txt(svg, 20, 296, 'Grades: source reliability A-F, information credibility 1-6', { size:11, fill:C.ink3 });

    // output
    var ox = 404, oy = 70, ow = 146, oh = 176;
    var out = el('rect', { x:ox, y:oy, width:ow, height:oh, rx:4, fill:'#fff', stroke:C.line, 'stroke-width':1.5 }, svg);
    el('path', { d:'M' + (ax + aw) + ' ' + (ay + ah / 2) + ' H' + ox, stroke:C.line, 'stroke-width':1.5 }, svg);
    var odot = el('circle', { r:4.5, fill:C.brass, opacity:0 }, svg);
    txt(svg, ox + 14, oy + 26, 'Judgement', { weight:600, size:13, fill:C.ink });
    txt(svg, ox + 14, oy + 46, 'Confidence', { mono:true, size:11, fill:C.ink3 });
    var levels = [['LOW', C.warn], ['MODERATE', C.steel], ['HIGH', C.teal]];
    var meterX = ox + 14, meterW = ow - 28;
    el('rect', { x:meterX, y:oy + 56, width:meterW, height:8, rx:2, fill:C.tSteel }, svg);
    var meter = el('rect', { x:meterX, y:oy + 56, width:0, height:8, rx:2, fill:C.warn }, svg);
    var confT = txt(svg, ox + 14, oy + 84, 'LOW', { mono:true, size:12, weight:500, fill:C.warnText });
    el('path', { d:'M' + (ox + 14) + ' ' + (oy + 100) + ' H' + (ox + ow - 14), stroke:C.line }, svg);
    txt(svg, ox + 14, oy + 120, 'Limits stated', { weight:600, size:13, fill:C.ink });
    var lim1 = txt(svg, ox + 14, oy + 140, 'L1  no ground truth', { mono:true, size:11, fill:C.ink2 });
    var lim2 = txt(svg, ox + 14, oy + 158, 'L2  1 claim open', { mono:true, size:11, fill:C.warnText });

    return function render(t) {
      t = t % P;
      var fade = 1 - seg(t, 9.2, 10), live = t < 9.2;
      var corrob = 0, conflict = false;
      ev.forEach(function (e) {
        var k = seg(t, e.at, e.at + 1.0);
        var q = e.p.getPointAtLength(ease(k) * e.L);
        set(e.dot, { cx:q.x, cy:q.y, opacity:(t > e.at && k < 1 ? 1 : 0) * fade });
        var arrived = t >= e.at + 1.0 && live;
        set(e.n, { stroke:t > e.at && live ? (e.ok ? C.navy : C.warn) : C.line });
        set(e.p, { stroke:t > e.at && live ? (e.ok ? C.steel : C.warn) : C.line, 'stroke-dasharray':e.ok ? '' : '4 3' });
        if (arrived) { if (e.ok) corrob++; else conflict = true; }
      });
      ticks.forEach(function (r, i) { set(r, { fill:i < corrob ? C.tTeal : C.tSteel, stroke:i < corrob ? C.teal : C.line }); });
      flag.textContent = conflict ? '+1 conflict' : '';
      var lvl = corrob >= 3 ? 1 : 0; // three corroborating sources with stated assumptions: moderate, never high
      var target = [0.28, 0.62][lvl] * (corrob ? 1 : 0.5);
      var mw = meterW * target;
      set(meter, { width:(mw * fade).toFixed(1), fill:levels[lvl][1] });
      confT.textContent = levels[lvl][0];
      set(confT, { fill:lvl ? C.steel : C.warnText });
      set(out, { stroke:t > 6.2 && live ? C.navy : C.line, 'stroke-width':t > 6.2 && live ? 2 : 1.5 });
      var k = seg(t, 5.8, 6.3);
      set(odot, { cx:lerp(ax + aw, ox, ease(k)), cy:ay + ah / 2, opacity:(t > 5.8 && k < 1 ? 1 : 0) * fade });
      set(lim2, { opacity:conflict ? 1 : 0.25 });
      set(lim1, { opacity:t > 6.3 && live ? 1 : 0.25 });
      setLabel('f4state', 'Confidence: ' + levels[lvl][0].toLowerCase());
    };
  }

  /* ---------------- runner ---------------- */
  var defs = [ ['dia-chain', chain, 7.2], ['dia-rings', rings, 5.4], ['dia-nav', nav, 6.6], ['dia-method', method, 8.0] ];
  var runners = [];
  defs.forEach(function (d) {
    var svg = document.getElementById(d[0]);
    if (!svg) return;
    var render = d[1](svg);
    var r = { svg:svg, render:render, still:d[2], visible:false, t0:null, acc:0 };
    render(d[2]);
    runners.push(r);
  });
  window.__diagrams = runners; // for QA frame capture

  if (!reduce && runners.length) {
    var last = performance.now();
    var tick = function (now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      runners.forEach(function (r) { if (r.visible && !document.hidden) { r.acc += dt; r.render(r.acc); } });
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { runners.forEach(function (r) { if (r.svg === en.target) r.visible = en.isIntersecting; }); });
      }, { threshold:0.2 });
      runners.forEach(function (r) { io.observe(r.svg); });
    } else runners.forEach(function (r) { r.visible = true; });
    requestAnimationFrame(tick);
  }

  /* ---------------- reveals ---------------- */
  var rev = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    rev.forEach(function (e) { e.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sib = Array.prototype.indexOf.call(en.target.parentNode.children, en.target);
        en.target.style.transitionDelay = Math.min(sib, 6) * 0.06 + 's';
        en.target.classList.add('in');
        ro.unobserve(en.target);
      });
    }, { threshold:0.08, rootMargin:'0px 0px -40px 0px' });
    rev.forEach(function (e) { ro.observe(e); });
  }

  /* ---------------- work filter ---------------- */
  var btns = document.querySelectorAll('.filters button');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.querySelectorAll('.work .card').forEach(function (c) {
        var cat = c.getAttribute('data-cat'); c.hidden = !(f === 'all' || cat === 'all' || cat === f);
        if (!c.hidden) c.classList.add('in');
      });
    });
  });
})();
