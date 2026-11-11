/* nbh-scene.js (v25.78): a drawn classroom scene for the pages that show a procedure in drawing, not in video: the
   explainers (explain.html), the counting practice (practice.html) and the drawn procedure videos. Everything is drawn by
   this code as SVG: two simulated people at a table (an adult on the left, a student on the right) and the things a
   procedure uses (a timer, a signal card, a request card, a token board, a worksheet, the adult's papers, an item).
   Nothing here is about a student, and no picture is loaded.

   The picture is a function of a state: NBHScene.create(host, options) returns {set(state), el, parts}. set() draws the
   state it is given and keeps nothing between calls, so a page can show any moment of a procedure, in any order (play,
   scrub, step back). An object moves only when the state says so; an object that is held is drawn at the hand that
   holds it. Each thing a person can ask about carries data-part="<name>" and can be tapped or reached with the keyboard.

   state (every key optional; what is left out keeps its resting value):
     adult / student: { l:[x,y], r:[x,y]      the left and right hand, in the picture's units (1600 x 900)
                        look:[dx,dy]          where the eyes point, each -1..1
                        mouth:'rest'|'smile'|'talk'|'open'|'flat', talk:0..1 (how open, while talking)
                        say:'words'           a speech bubble
                        up:0..1               (student) out of the seat: 0 seated, 1 standing beside the chair
                        lean:-1..1            leaning to the picture's left or right
                        brow:-1..1 }          brows lowered (-1) or raised (1)
     timer:  { show, left, total, label, ring:0..1, flash:0..1 }
     signal: { show, color:'green'|'red'|'off', label }
     card:   { show, at:[x,y]|'student.l'|'student.r'|'adult.l'|'adult.r', lift:0..1, label, away:0..1 }
     tokens: { show, n, of, pop:0..1 }
     sheet:  { show, marks:0..1 }             the student's work
     papers: { show }                         the adult's papers
     item:   { show, at:[x,y]|'student.l'|..., kind:'tablet'|'ball'|'book' }
     note:   { show, text }                   a small sign on the wall (the rule in force)
     dim:    0..1                             the whole picture dimmed (a closing card over it) */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1600, H = 900;
  var C = { ink: '#16242e', navy: '#1D3A52', teal: '#76a2a3', wash: '#eaf2f0', wall: '#EEF3F1', wall2: '#E2EBE8', floor: '#D9E3DF',
    wood: '#E8D8BD', wood2: '#D3BE9C', wood3: '#BFA57E', paper: '#FFFFFF', red: '#C7533B', green: '#3E8E5A', blue: '#3B7FC7',
    gold: '#E2A93B', line: '#B9C7C3' };
  var CAST = {
    adult: { cx: 420, sy: 452, sw: 118, head: [420, 300, 84, 96], skin: '#C99267', skin2: '#B07C53', hair: '#2B2320', shirt: '#2F6F73', shirt2: '#285f63', k: 1.12, hairStyle: 'bob' },
    student: { cx: 1190, sy: 478, sw: 92, head: [1190, 352, 74, 82], skin: '#F0C7A2', skin2: '#DDAF87', hair: '#6A4226', shirt: '#E2A93B', shirt2: '#C8922B', k: 0.94, hairStyle: 'short' }
  };
  var REST = {
    adult: { l: [290, 690], r: [550, 690] },
    student: { l: [1075, 700], r: [1305, 700] }
  };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mix(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  /* a value that goes from a to b between t0 and t1, eased, and holds outside */
  function tween(t, t0, t1, a, b) { if (t <= t0) return a; if (t >= t1) return b; return mix(a, b, ease((t - t0) / (t1 - t0))); }
  function tweenP(t, t0, t1, p, q) { return [tween(t, t0, t1, p[0], q[0]), tween(t, t0, t1, p[1], q[1])]; }
  /* a point through a list of [time, [x,y]] keys */
  function path(t, keys) {
    if (t <= keys[0][0]) return keys[0][1].slice();
    for (var i = 1; i < keys.length; i++) if (t <= keys[i][0]) return tweenP(t, keys[i - 1][0], keys[i][0], keys[i - 1][1], keys[i][1]);
    return keys[keys.length - 1][1].slice();
  }
  function num(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (t <= keys[i][0]) return tween(t, keys[i - 1][0], keys[i][0], keys[i - 1][1], keys[i][1]);
    return keys[keys.length - 1][1];
  }
  function clock(s) { s = Math.max(0, Math.ceil(s - 1e-6)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function wrap(text, n) {
    var words = String(text || '').split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { if ((cur + ' ' + w).trim().length > n && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    return lines;
  }

  function create(host, opt) {
    opt = opt || {};
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || 'A drawn scene: an adult and a student at a table', class: 'nbh-scene', preserveAspectRatio: 'xMidYMid meet' });
    svg.style.cssText = 'display:block;width:100%;height:auto;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation';
    var defs = el('defs', null, svg);
    var cp = el('clipPath', { id: 'nsBody' + (create.n = (create.n || 0) + 1) }, defs); el('rect', { x: 0, y: 0, width: W, height: 640 }, cp);
    var clipId = cp.id;
    var parts = {};
    function part(name, label, parent) {
      var g = el('g', { 'data-part': name, class: 'ns-part' }, parent);
      if (opt.tap !== false) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', label); g.style.cursor = 'pointer'; g.style.outline = 'none'; }
      parts[name] = g; return g;
    }
    /* ---- the room ---- */
    var room = el('g', null, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: C.wall }, room);
    el('rect', { x: 0, y: 560, width: W, height: 340, fill: C.floor }, room);
    el('rect', { x: 0, y: 548, width: W, height: 14, fill: C.wall2 }, room);
    /* a board and a shelf, plain, so the wall is a classroom's and nothing on it asks to be read */
    el('rect', { x: 96, y: 78, width: 250, height: 170, rx: 8, fill: '#fff', stroke: C.line, 'stroke-width': 4 }, room);
    [0, 1, 2].forEach(function (i) { el('rect', { x: 122, y: 108 + i * 40, width: 150 - i * 34, height: 12, rx: 6, fill: C.wall2 }, room); });
    el('rect', { x: 1270, y: 150, width: 240, height: 14, rx: 4, fill: C.wood2 }, room);
    [[1290, 92, 30, 58, C.teal], [1326, 104, 26, 46, C.gold], [1358, 86, 34, 64, C.navy], [1400, 110, 60, 40, C.red]].forEach(function (b) { el('rect', { x: b[0], y: b[1], width: b[2], height: b[3], rx: 4, fill: b[4], opacity: .55 }, room); });
    var note = part('note', 'The sign on the wall', svg);
    var noteBox = el('rect', { x: 640, y: 66, width: 320, height: 104, rx: 10, fill: '#fff', stroke: C.navy, 'stroke-width': 4 }, note);
    var noteT = el('text', { x: 800, y: 112, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 700, fill: C.navy }, note);

    /* ---- the people: body (behind the table), then the table, then arms and hands (over the table) ---- */
    var bodies = el('g', null, svg);
    var chairs = el('g', null, bodies);
    function person(key, label) {
      var p = CAST[key], g = part(key, label, bodies), k = p.k, hx = p.head[0], hy = p.head[1], rx = p.head[2], ry = p.head[3];
      var o = { key: key, p: p, g: g };
      o.move = el('g', null, g);
      /* torso: shoulders to below the table edge */
      o.torso = el('path', { fill: p.shirt }, o.move);
      o.collar = el('path', { fill: p.shirt2 }, o.move);
      o.neck = el('rect', { x: hx - 22 * k, y: hy + ry - 16, width: 44 * k, height: 44 * k, rx: 14, fill: p.skin2 }, o.move);
      o.headG = el('g', null, o.move);
      o.hairBack = el('path', { fill: p.hair }, o.headG);
      el('ellipse', { cx: hx - rx + 4, cy: hy + 8, rx: 12 * k, ry: 18 * k, fill: p.skin2 }, o.headG);
      el('ellipse', { cx: hx + rx - 4, cy: hy + 8, rx: 12 * k, ry: 18 * k, fill: p.skin2 }, o.headG);
      el('ellipse', { cx: hx, cy: hy, rx: rx, ry: ry, fill: p.skin }, o.headG);
      o.hair = el('path', { fill: p.hair }, o.headG);
      o.face = el('g', null, o.headG);
      o.eyeL = el('ellipse', { rx: 7.5 * k, ry: 9 * k, fill: C.ink }, o.face);
      o.eyeR = el('ellipse', { rx: 7.5 * k, ry: 9 * k, fill: C.ink }, o.face);
      o.browL = el('path', { fill: 'none', stroke: p.hair, 'stroke-width': 6 * k, 'stroke-linecap': 'round' }, o.face);
      o.browR = el('path', { fill: 'none', stroke: p.hair, 'stroke-width': 6 * k, 'stroke-linecap': 'round' }, o.face);
      o.mouth = el('path', { fill: 'none', stroke: '#7A3B2E', 'stroke-width': 6 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, o.face);
      el('path', { d: 'M' + (hx - 3) + ' ' + (hy + 6) + ' q -7 16 4 20', fill: 'none', stroke: p.skin2, 'stroke-width': 5 * k, 'stroke-linecap': 'round' }, o.face);
      return o;
    }
    /* the chairs stay where they are when a person stands */
    function chair(key) { var p = CAST[key]; el('rect', { x: p.cx - 104 * p.k, y: p.sy - 26, width: 208 * p.k, height: 230, rx: 26, fill: C.wood3, opacity: .9 }, chairs); el('rect', { x: p.cx - 86 * p.k, y: p.sy - 8, width: 172 * p.k, height: 200, rx: 18, fill: C.wood2 }, chairs); }
    chair('adult'); chair('student');
    var A = person('adult', 'The adult'), S = person('student', 'The student');
    var PP = { adult: A, student: S };

    /* the things that stand behind the table edge: the signal and the timer */
    var stand = el('g', null, svg);
    var signal = part('signal', 'The signal card', stand); var signalG = el('g', null, signal); signal = signalG; parts.signal = signalG.parentNode;
    el('rect', { x: 792, y: 560, width: 16, height: 60, fill: C.wood3 }, signal);
    var sigCard = el('rect', { x: 715, y: 380, width: 170, height: 196, rx: 16, stroke: '#fff', 'stroke-width': 8 }, signal);
    var sigIcon = el('g', null, signal);
    var sigT = el('text', { x: 800, y: 548, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, fill: '#fff' }, signal);
    var timer = part('timer', 'The timer', stand);
    var tx = 800, ty = 470;
    var timerG = el('g', null, timer);
    el('rect', { x: tx - 96, y: ty - 78, width: 192, height: 168, rx: 26, fill: '#fff', stroke: C.navy, 'stroke-width': 6 }, timerG);
    el('rect', { x: tx - 60, y: ty + 84, width: 120, height: 26, rx: 8, fill: C.navy }, timerG);
    var timerRingBg = el('circle', { cx: tx, cy: ty - 4, r: 52, fill: 'none', stroke: C.wash, 'stroke-width': 14 }, timerG);
    var timerRing = el('circle', { cx: tx, cy: ty - 4, r: 52, fill: 'none', stroke: C.teal, 'stroke-width': 14, 'stroke-linecap': 'butt', transform: 'rotate(-90 ' + tx + ' ' + (ty - 4) + ')' }, timerG);
    var timerT = el('text', { x: tx, y: ty + 10, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 700, fill: C.navy, style: 'font-variant-numeric:tabular-nums' }, timerG);
    var timerL = el('text', { x: tx, y: ty + 76, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 600, fill: C.navy }, timerG);

    /* ---- the table ---- */
    var table = el('g', null, svg);
    el('path', { d: 'M150 618 L1450 618 L1560 800 L40 800 Z', fill: C.wood }, table);
    el('path', { d: 'M40 800 L1560 800 L1560 846 L40 846 Z', fill: C.wood2 }, table);
    el('rect', { x: 110, y: 846, width: 46, height: 54, fill: C.wood3 }, table); el('rect', { x: 1444, y: 846, width: 46, height: 54, fill: C.wood3 }, table);

    /* ---- the things on the table ---- */
    var things = el('g', null, svg);
    var papers = part('papers', 'The adult’s papers', things); papers.setAttribute('transform', 'translate(-50 0)');
    el('path', { d: 'M318 664 L560 660 L582 760 L300 766 Z', fill: '#fff', stroke: C.line, 'stroke-width': 3 }, papers);
    el('path', { d: 'M338 650 L580 652 L596 748 L326 752 Z', fill: '#fff', stroke: C.line, 'stroke-width': 3 }, papers);
    [0, 1, 2, 3].forEach(function (i) { el('rect', { x: 366 + i * 3, y: 672 + i * 17, width: 170 - i * 22, height: 7, rx: 3.5, fill: C.wall2 }, papers); });
    var sheet = part('sheet', 'The student’s work', things); sheet.setAttribute('transform', 'translate(70 0)');
    el('path', { d: 'M1010 668 L1262 668 L1290 778 L990 778 Z', fill: '#fff', stroke: C.line, 'stroke-width': 3 }, sheet);
    var sheetMarks = el('g', null, sheet);
    var MARKS = [[1040, 694, 96, C.red], [1150, 690, 70, C.blue], [1036, 720, 130, C.green], [1180, 716, 66, C.gold], [1030, 746, 80, C.blue], [1124, 744, 120, C.red]];
    MARKS.forEach(function (m) { el('rect', { x: m[0], y: m[1], width: m[2], height: 12, rx: 6, fill: m[3], opacity: .8 }, sheetMarks); });
    var tokens = part('tokens', 'The token board', things);
    var tokenG = el('g', null, tokens);
    var card = part('card', 'The request card', things);
    var cardG = el('g', null, card);
    el('rect', { x: -58, y: -40, width: 116, height: 80, rx: 12, fill: '#fff', stroke: C.navy, 'stroke-width': 5 }, cardG);
    var cardIcon = el('g', null, cardG);
    /* two heads side by side: the card that asks for time with the adult */
    el('circle', { cx: -18, cy: -8, r: 13, fill: C.teal }, cardIcon); el('path', { d: 'M-38 26 q20 -30 40 0 Z', fill: C.teal }, cardIcon);
    el('circle', { cx: 20, cy: -4, r: 10, fill: C.gold }, cardIcon); el('path', { d: 'M4 26 q16 -24 32 0 Z', fill: C.gold }, cardIcon);
    var cardT = el('text', { x: 0, y: 66, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: C.navy, stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, cardG);
    var item = part('item', 'The item', things);
    var itemG = el('g', null, item);

    /* ---- arms and hands, over the table ---- */
    var arms = el('g', null, svg);
    function arm(o, side) {
      var a = { path: el('path', { fill: 'none', stroke: o.p.shirt, 'stroke-width': 54 * o.p.k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, arms) };
      a.cuff = el('circle', { r: 27 * o.p.k, fill: o.p.shirt2 }, arms);
      a.hand = el('circle', { r: 25 * o.p.k, fill: o.p.skin }, arms);
      o[side] = a;
    }
    arm(A, 'l'); arm(A, 'r'); arm(S, 'l'); arm(S, 'r');
    /* things in a hand are drawn over the hand's arm but under the fingers: a second layer, then the thumbs again */
    var held = el('g', null, svg);
    var bubbles = el('g', { 'aria-hidden': 'true' }, svg);
    var dimR = el('rect', { x: 0, y: 0, width: W, height: H, fill: '#0f1e2b', opacity: 0, 'pointer-events': 'none' }, svg);

    function hairPath(o) {
      var h = o.p.head, x = h[0], y = h[1], rx = h[2], ry = h[3];
      if (o.p.hairStyle === 'bob') {
        o.hairBack.setAttribute('d', 'M' + (x - rx - 12) + ' ' + (y - 10) + ' Q' + (x - rx - 22) + ' ' + (y + ry + 40) + ' ' + (x - rx + 26) + ' ' + (y + ry + 34) + ' L' + (x + rx - 26) + ' ' + (y + ry + 34) + ' Q' + (x + rx + 22) + ' ' + (y + ry + 40) + ' ' + (x + rx + 12) + ' ' + (y - 10) + ' Z');
        o.hair.setAttribute('d', 'M' + (x - rx - 8) + ' ' + (y + 12) + ' Q' + (x - rx - 12) + ' ' + (y - ry - 26) + ' ' + x + ' ' + (y - ry - 18) + ' Q' + (x + rx + 12) + ' ' + (y - ry - 26) + ' ' + (x + rx + 8) + ' ' + (y + 12) + ' Q' + (x + rx - 10) + ' ' + (y - ry + 46) + ' ' + (x + 16) + ' ' + (y - ry + 34) + ' Q' + (x - 30) + ' ' + (y - ry + 62) + ' ' + (x - rx - 8) + ' ' + (y + 12) + ' Z');
      } else {
        o.hairBack.setAttribute('d', '');
        o.hair.setAttribute('d', 'M' + (x - rx - 4) + ' ' + (y - 4) + ' Q' + (x - rx - 10) + ' ' + (y - ry - 22) + ' ' + x + ' ' + (y - ry - 16) + ' Q' + (x + rx + 10) + ' ' + (y - ry - 22) + ' ' + (x + rx + 4) + ' ' + (y - 4) + ' Q' + (x + rx - 14) + ' ' + (y - ry + 30) + ' ' + (x + 20) + ' ' + (y - ry + 30) + ' Q' + (x - 26) + ' ' + (y - ry + 46) + ' ' + (x - rx - 4) + ' ' + (y - 4) + ' Z');
      }
    }
    hairPath(A); hairPath(S);

    function drawPerson(o, st, rest) {
      var p = o.p, k = p.k, h = p.head, up = clamp(st.up || 0, 0, 1), lean = clamp(st.lean || 0, -1, 1);
      var dx = lean * 26 + (o.key === 'student' ? up * 150 : 0), dy = -up * 150;
      o.dx = dx; o.dy = dy;
      o.move.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')');
      var sx = p.cx, sy = p.sy, sw = p.sw, bottom = 660 + up * 150 + 40;
      o.torso.setAttribute('d', 'M' + (sx - sw - 26) + ' ' + (sy + 26) + ' Q' + (sx - sw - 24) + ' ' + (sy - 30) + ' ' + (sx - 30) + ' ' + (sy - 40) + ' L' + (sx + 30) + ' ' + (sy - 40) + ' Q' + (sx + sw + 24) + ' ' + (sy - 30) + ' ' + (sx + sw + 26) + ' ' + (sy + 26) + ' L' + (sx + sw + 18) + ' ' + bottom + ' L' + (sx - sw - 18) + ' ' + bottom + ' Z');
      o.collar.setAttribute('d', 'M' + (sx - 34) + ' ' + (sy - 40) + ' Q' + sx + ' ' + (sy - 6) + ' ' + (sx + 34) + ' ' + (sy - 40) + ' Q' + sx + ' ' + (sy - 24) + ' ' + (sx - 34) + ' ' + (sy - 40) + ' Z');
      var look = st.look || [0, 0], lx = clamp(look[0], -1, 1) * 9 * k, ly = clamp(look[1], -1, 1) * 7 * k;
      var ex = 30 * k, ey = h[1] - 6;
      o.eyeL.setAttribute('cx', h[0] - ex + lx); o.eyeL.setAttribute('cy', ey + ly);
      o.eyeR.setAttribute('cx', h[0] + ex + lx); o.eyeR.setAttribute('cy', ey + ly);
      var blink = st.blink ? 1.5 : 9 * k; o.eyeL.setAttribute('ry', blink); o.eyeR.setAttribute('ry', blink);
      var br = clamp(st.brow || 0, -1, 1), by = ey - 26 * k - br * 7;
      o.browL.setAttribute('d', 'M' + (h[0] - ex - 15 * k + lx) + ' ' + (by + br * -4) + ' q' + 15 * k + ' ' + (-7 * k) + ' ' + 30 * k + ' ' + (br * -3));
      o.browR.setAttribute('d', 'M' + (h[0] + ex - 15 * k + lx) + ' ' + (by + br * -1) + ' q' + 15 * k + ' ' + (-7 * k) + ' ' + 30 * k + ' ' + (br * 3 - 2));
      var mx = h[0] + lx * .5, my = h[1] + 42 * k, m = st.mouth || 'rest', d, fill = 'none';
      if (m === 'smile') d = 'M' + (mx - 24 * k) + ' ' + (my - 3) + ' Q' + mx + ' ' + (my + 20 * k) + ' ' + (mx + 24 * k) + ' ' + (my - 3);
      else if (m === 'talk' || m === 'open') { var op = (m === 'open' ? 1 : clamp(st.talk === undefined ? .6 : st.talk, 0, 1)) * 15 * k + 3; d = 'M' + (mx - 17 * k) + ' ' + my + ' Q' + mx + ' ' + (my - op * .5) + ' ' + (mx + 17 * k) + ' ' + my + ' Q' + mx + ' ' + (my + op * 1.7) + ' ' + (mx - 17 * k) + ' ' + my + ' Z'; fill = '#7A3B2E'; }
      else if (m === 'flat') d = 'M' + (mx - 18 * k) + ' ' + (my + 3) + ' L' + (mx + 18 * k) + ' ' + (my + 3);
      else d = 'M' + (mx - 18 * k) + ' ' + my + ' Q' + mx + ' ' + (my + 8 * k) + ' ' + (mx + 18 * k) + ' ' + my;
      o.mouth.setAttribute('d', d); o.mouth.setAttribute('fill', fill);
      /* arms: from the shoulder (which moves with the body) to the hand; the elbow hangs outward and down */
      ['l', 'r'].forEach(function (side) {
        var sgn = side === 'l' ? -1 : 1, a = o[side], hand = st[side] || rest[side];
        var shx = sx + sgn * (sw - 4) + dx, shy = sy + 4 + dy, hxp = hand[0], hyp = hand[1];
        var midx = (shx + hxp) / 2, midy = (shy + hyp) / 2, dist = Math.hypot(hxp - shx, hyp - shy), reach = 300 * k;
        var bend = Math.max(0, reach - dist) * .42 + 12;
        var raised = hyp < shy;   /* a raised hand: the elbow goes out to the side, not down */
        var exx = midx + sgn * bend * (raised ? 1.1 : .75), eyy = midy + (raised ? bend * .25 : bend * .7);
        a.path.setAttribute('d', 'M' + shx.toFixed(1) + ' ' + shy.toFixed(1) + ' Q' + exx.toFixed(1) + ' ' + eyy.toFixed(1) + ' ' + hxp.toFixed(1) + ' ' + hyp.toFixed(1));
        var ux = hxp - exx, uy = hyp - eyy, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        a.cuff.setAttribute('cx', (hxp - ux * 20 * k).toFixed(1)); a.cuff.setAttribute('cy', (hyp - uy * 20 * k).toFixed(1));
        a.hand.setAttribute('cx', (hxp + ux * 8 * k).toFixed(1)); a.hand.setAttribute('cy', (hyp + uy * 8 * k).toFixed(1));
        a.pos = [hxp + ux * 8 * k, hyp + uy * 8 * k];
      });
    }
    function at(spec, fallback) {
      if (Array.isArray(spec)) return spec;
      var m = /^(adult|student)\.(l|r)$/.exec(spec || '');
      if (m && PP[m[1]][m[2]].pos) { var q = PP[m[1]][m[2]].pos; return [q[0], q[1] - 6]; }
      return fallback;
    }
    function bubble(o, text) {
      if (!text) return;
      var h = o.p.head, lines = wrap(text, 22), fs = 30, lh = 38, w = Math.max.apply(null, lines.map(function (l) { return l.length; })) * fs * .54 + 52, hh = lines.length * lh + 34;
      var left = o.key === 'adult', bx = h[0] + (o.dx || 0) + (left ? -w / 2 - 20 : -w / 2 + 20), by = h[1] + (o.dy || 0) - h[3] - hh - 40;
      bx = clamp(bx, 16, W - w - 16); by = Math.max(12, by);
      var g = el('g', null, bubbles), tipx = h[0] + (o.dx || 0) + (left ? 30 : -30);
      el('path', { d: 'M' + (tipx - 22) + ' ' + (by + hh - 4) + ' L' + tipx + ' ' + (by + hh + 30) + ' L' + (tipx + 22) + ' ' + (by + hh - 4) + ' Z', fill: '#fff', stroke: C.navy, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
      el('rect', { x: bx, y: by, width: w, height: hh, rx: 22, fill: '#fff', stroke: C.navy, 'stroke-width': 4 }, g);
      el('rect', { x: tipx - 19, y: by + hh - 8, width: 38, height: 8, fill: '#fff' }, g);
      lines.forEach(function (l, i) { el('text', { x: bx + w / 2, y: by + 24 + lh * (i + .68), 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 600, fill: C.ink }, g).textContent = l; });
    }
    function show(g, on) { g.style.display = on ? '' : 'none'; }

    function set(st) {
      st = st || {};
      var a = st.adult || {}, s = st.student || {};
      drawPerson(A, a, REST.adult); drawPerson(S, s, REST.student);
      /* the sign */
      var n = st.note || {}; show(note, !!n.show && !!n.text); noteT.textContent = n.text || '';
      if (n.text) { var nw = Math.max(200, String(n.text).length * 17 + 60); noteBox.setAttribute('x', 800 - nw / 2); noteBox.setAttribute('width', nw); }
      /* the signal */
      var sg = st.signal || {}, tmShow = !!(st.timer && st.timer.show); show(parts.signal, !!sg.show); signal.setAttribute('transform', 'translate(' + (tmShow ? -110 : 0) + ' 0)');
      if (sg.show) {
        var col = sg.color === 'green' ? C.green : sg.color === 'red' ? C.red : '#9AA8A4';
        sigCard.setAttribute('fill', col); sigT.textContent = sg.label || (sg.color === 'green' ? 'Ask now' : sg.color === 'red' ? 'Not now' : '');
        while (sigIcon.firstChild) sigIcon.removeChild(sigIcon.firstChild);
        /* a shape as well as a color: a circle for green, a bar for red */
        if (sg.color === 'green') el('circle', { cx: 800, cy: 456, r: 44, fill: 'none', stroke: '#fff', 'stroke-width': 14 }, sigIcon);
        else if (sg.color === 'red') el('rect', { x: 752, y: 444, width: 96, height: 24, rx: 8, fill: '#fff' }, sigIcon);
      }
      /* the timer (beside the signal when both show) */
      var tm = st.timer || {}; show(timer, !!tm.show);
      if (tm.show) {
        timerG.setAttribute('transform', 'translate(' + (sg.show ? 105 : 0) + ' 0)');
        var total = Math.max(.001, +tm.total || 1), left = clamp(tm.left === undefined ? total : +tm.left, 0, total), frac = tm.ring === undefined ? left / total : clamp(tm.ring, 0, 1);
        var circ = 2 * Math.PI * 52; timerRing.setAttribute('stroke-dasharray', (circ * frac).toFixed(1) + ' ' + circ.toFixed(1));
        timerRing.setAttribute('stroke', tm.flash ? C.gold : C.teal); timerRingBg.setAttribute('stroke', tm.flash ? '#F6E7C4' : C.wash);
        timerT.textContent = tm.text || clock(left); timerL.textContent = tm.label || '';
      }
      show(papers, !st.papers || st.papers.show !== false);
      var sh = st.sheet || {}; show(sheet, sh.show !== false);
      var mk = sh.marks === undefined ? .5 : clamp(sh.marks, 0, 1), nm = Math.round(mk * MARKS.length);
      [].forEach.call(sheetMarks.childNodes, function (r, i) { r.style.display = i < nm ? '' : 'none'; });
      /* the token board */
      var tk = st.tokens || {}; show(tokens, !!tk.show);
      while (tokenG.firstChild) tokenG.removeChild(tokenG.firstChild);
      if (tk.show) {
        var of = clamp(Math.round(tk.of || 5), 1, 10), have = clamp(tk.n || 0, 0, of), cw = 70, bw = of * cw + 36, x0 = 800 - bw / 2;
        el('path', { d: 'M' + (x0 + 8) + ' 706 L' + (x0 + bw - 8) + ' 706 L' + (x0 + bw + 10) + ' 790 L' + (x0 - 10) + ' 790 Z', fill: '#fff', stroke: C.navy, 'stroke-width': 5, 'stroke-linejoin': 'round' }, tokenG);
        for (var i = 0; i < of; i++) {
          var cx = x0 + 18 + cw * (i + .5), cy = 748, full = i < Math.floor(have), popping = i === Math.floor(have) - 1 && tk.pop;
          el('ellipse', { cx: cx, cy: cy, rx: 26, ry: 22, fill: full ? C.gold : C.wash, stroke: full ? '#B8851E' : C.line, 'stroke-width': 4, transform: popping ? 'translate(' + cx + ' ' + cy + ') scale(' + (1 + .35 * Math.sin(Math.PI * clamp(tk.pop, 0, 1))) + ') translate(' + -cx + ' ' + -cy + ')' : null }, tokenG);
          if (full) el('path', { d: star(cx, cy, 13, 6), fill: '#fff', opacity: .9 }, tokenG);
        }
      }
      /* the request card and the item: on the table, or in a hand */
      var cd = st.card || {}; show(card, !!cd.show);
      if (cd.show) {
        var cpos = at(cd.at, [985, 722]), lift = clamp(cd.lift || 0, 0, 1), away = clamp(cd.away || 0, 0, 1);
        cardG.setAttribute('transform', 'translate(' + cpos[0].toFixed(1) + ' ' + (cpos[1] - lift * 26).toFixed(1) + ') rotate(' + (-6 + lift * 6) + ') scale(' + (1 + lift * .12) + ')');
        cardG.setAttribute('opacity', 1 - away); cardT.textContent = cd.label || '';
      }
      var it = st.item || {}; show(item, !!it.show);
      while (itemG.firstChild) itemG.removeChild(itemG.firstChild);
      if (it.show) {
        var ip = at(it.at, [700, 724]);
        if (it.kind === 'ball') { el('circle', { cx: ip[0], cy: ip[1] - 18, r: 40, fill: C.blue }, itemG); el('path', { d: 'M' + (ip[0] - 40) + ' ' + (ip[1] - 18) + ' q40 -22 80 0', fill: 'none', stroke: '#fff', 'stroke-width': 7 }, itemG); }
        else if (it.kind === 'book') { el('path', { d: 'M' + (ip[0] - 70) + ' ' + (ip[1] - 34) + ' h140 l12 62 h-164 Z', fill: C.red }, itemG); el('rect', { x: ip[0] - 44, y: ip[1] - 20, width: 88, height: 10, rx: 5, fill: '#fff', opacity: .8 }, itemG); }
        else { el('path', { d: 'M' + (ip[0] - 74) + ' ' + (ip[1] - 44) + ' h148 l14 78 h-176 Z', fill: C.navy }, itemG); el('path', { d: 'M' + (ip[0] - 62) + ' ' + (ip[1] - 34) + ' h124 l10 58 h-144 Z', fill: '#8FD0EE' }, itemG); el('path', { d: 'M' + (ip[0] - 12) + ' ' + (ip[1] - 18) + ' l30 16 l-30 16 Z', fill: '#fff' }, itemG); }
      }
      /* a thing in a hand goes over the arms, and the thumb over the thing */
      [card, item].forEach(function (g, i) { var spec = (i ? it : cd).at, inHand = typeof spec === 'string'; if (inHand) { if (g.parentNode !== held) held.appendChild(g); } else if (g.parentNode !== things) things.appendChild(g); });
      while (bubbles.firstChild) bubbles.removeChild(bubbles.firstChild);
      bubble(A, a.say); bubble(S, s.say);
      dimR.setAttribute('opacity', clamp(st.dim || 0, 0, 1) * .72);
    }
    function star(cx, cy, R, r) { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q).toFixed(1) + ' ' + (cy + Math.sin(a) * q).toFixed(1); } return d + 'Z'; }

    host.appendChild(svg);
    set({});
    return { el: svg, set: set, parts: parts };
  }
  window.NBHScene = { create: create, REST: REST, CAST: CAST, W: W, H: H, mix: mix, ease: ease, clamp: clamp, tween: tween, tweenP: tweenP, path: path, num: num, clock: clock };
})();
