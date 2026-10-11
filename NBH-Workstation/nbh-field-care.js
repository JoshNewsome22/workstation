
/* ---- field care: shared by every form ----------------------------------------
   Three faults turned up when every field in the set was typed into and printed:

   1. Several forms redraw a table on every keystroke, which replaces the field
      being typed in. The first letter was kept and the cursor thrown out, so a
      name went in one letter per click. The form's own record of the text is
      right; only the cursor was lost. Put it back where it was.
   2. A textarea stayed the height it was drawn at, so a longer answer hid its
      first lines behind a scroll bar on screen - and on paper, where a textarea
      prints only the rows it shows, the rest was simply cut off.
   3. A single-line field printed only the part of a long entry that fitted its
      box. The master print already turns every field into text; printing one
      form on its own now does the same for anything that would be cut off.
   4. A wide table - a scoring grid with many rounds, a plan with eight columns -
      ran past the right edge of the page, and the browser cut its last columns
      off. Before printing, the page is laid out as it will be on paper and
      anything wider than the page is scaled down just enough to fit. */
(function () {
  var SKIP = '.toolbar,.nbh-mast,.noprint,dialog,.nbh-tabs';
  function isField(e) { return e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT'); }
  function texty(e) {
    if (!e) return false;
    if (e.tagName === 'TEXTAREA') return true;
    if (e.tagName !== 'INPUT') return false;
    return /^(text|search|email|tel|url|)$/.test((e.getAttribute('type') || '').toLowerCase());
  }

  /* ---------- 1. keep the cursor through a redraw ---------- */
  function sig(e) {
    var p = [e.tagName, e.getAttribute('name') || '', e.id || '', e.getAttribute('type') || ''];
    for (var i = 0; i < e.attributes.length; i++) {
      var a = e.attributes[i];
      if (a.name.indexOf('data-') === 0 && a.name !== 'data-filled') p.push(a.name + '=' + a.value);
    }
    return p.join('|');
  }
  var memo = null;
  function remember(ev) {
    var t = ev.target;
    if (!isField(t) || t.closest(SKIP)) return;
    var s = sig(t), all = document.getElementsByTagName(t.tagName), idx = 0, n = 0;
    for (var i = 0; i < all.length; i++) if (sig(all[i]) === s) { if (all[i] === t) idx = n; n++; }
    var ss = null, se = null, sd = null;
    try { ss = t.selectionStart; se = t.selectionEnd; sd = t.selectionDirection; } catch (e) {}
    memo = { el: t, sig: s, idx: idx, tag: t.tagName, ss: ss, se: se, sd: sd };
  }
  ['focusin', 'input', 'keyup', 'mouseup'].forEach(function (t) { document.addEventListener(t, remember, true); });
  function restore() {
    if (!memo || memo.el.isConnected) return;
    var a = document.activeElement;
    if (a && a !== document.body && a !== document.documentElement) return;   // focus went somewhere on purpose
    var all = document.getElementsByTagName(memo.tag), k = 0, hit = null;
    for (var i = 0; i < all.length; i++) if (sig(all[i]) === memo.sig) { if (k === memo.idx) { hit = all[i]; break; } k++; }
    if (!hit) return;
    /* read the caret before focusing: focus() fires focusin, which records the
       new field's own caret - at the start - over the one being restored, and
       the rest of the word then went in backwards */
    var ss = memo.ss, se = memo.se, sd = memo.sd;
    memo.el = hit;
    try { hit.focus({ preventScroll: true }); } catch (e) { hit.focus(); }
    try { if (ss !== null && hit.setSelectionRange) hit.setSelectionRange(ss, se, sd || 'none'); } catch (e) {}
    memo.ss = ss; memo.se = se; memo.sd = sd;
  }

  /* ---------- 2. a textarea is as tall as what is in it ---------- */
  function grow(t) {
    if (!t || t.tagName !== 'TEXTAREA' || !t.offsetParent) return;
    var cs = getComputedStyle(t);
    var y = window.scrollY;
    t.style.height = 'auto';
    var h = t.scrollHeight;
    if (cs.boxSizing === 'border-box') h += (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    else h -= (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    t.style.height = Math.ceil(h) + 'px';
    if (window.scrollY !== y) window.scrollTo(window.scrollX, y);
  }
  function growAll() { var t = document.getElementsByTagName('textarea'); for (var i = 0; i < t.length; i++) grow(t[i]); }
  var gt = null;
  function growSoon(ms) { clearTimeout(gt); gt = setTimeout(growAll, ms || 60); }
  document.addEventListener('input', function (e) { if (e.target.tagName === 'TEXTAREA') grow(e.target); });
  document.addEventListener('focusin', function (e) { if (e.target.tagName === 'TEXTAREA') grow(e.target); });
  /* a view switch, a simulation, a file opened or a case restored all change what
     is showing without typing, so look again shortly after any of them */
  document.addEventListener('click', function () { growSoon(60); setTimeout(growAll, 450); });
  document.addEventListener('change', function () { growSoon(80); setTimeout(growAll, 900); });
  window.addEventListener('load', function () { setTimeout(growAll, 150); });
  window.addEventListener('resize', function () { growSoon(150); });

  try {
    new MutationObserver(function () { restore(); growSoon(80); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  /* ---------- 3. print the whole entry ---------- */
  var COPY = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'color', 'textAlign',
              'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'letterSpacing'];
  var BOX = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderRadius', 'backgroundColor',
             'marginTop', 'marginBottom'];
  function clearMirrors() {
    var m = document.querySelectorAll('.nbh-pm');
    for (var i = m.length - 1; i >= 0; i--) m[i].parentNode.removeChild(m[i]);
    var s = document.querySelectorAll('.nbh-pm-src');
    for (var j = 0; j < s.length; j++) s[j].classList.remove('nbh-pm-src');
  }
  /* In a row of label and field, the printed text takes the field's place and
     the rest of the row, never the label's: sized by its own length it squeezed
     "Student" down to "Stude" and printed over it. Start from nothing, grow
     into the room left, and keep at least the width the field had. */
  function inRow(m, el, pcs) {
    if (!pcs || !/flex/.test(pcs.display)) return false;
    if (/column/.test(pcs.flexDirection)) return true;     // a stacked field: the block fills the width
    var w = Math.round(el.offsetWidth || 0);
    m.style.flex = '1 1 0%';
    m.style.minWidth = w ? 'min(' + w + 'px, 100%)' : '0';
    return true;
  }
  function mirror(el) {
    var ta = el.tagName === 'TEXTAREA', cs = getComputedStyle(el), par = el.parentElement;
    var m = document.createElement(ta ? 'div' : 'span');
    m.className = 'nbh-pm';
    m.textContent = el.value;
    COPY.forEach(function (k) { m.style[k] = cs[k]; });
    if (ta) BOX.forEach(function (k) { m.style[k] = cs[k]; });
    else m.style.borderBottom = cs.borderBottom;
    var pcs = par ? getComputedStyle(par) : null;
    if (!ta) {
      if (inRow(m, el, pcs)) { /* sized above */ }
      else if (par && /^(TD|TH)$/.test(par.tagName)) { /* block fills the cell */ }
      else m.classList.add('nbh-pm-inl');
    }
    el.classList.add('nbh-pm-src');
    el.parentNode.insertBefore(m, el.nextSibling);
  }
  var ctx = null;
  function selectCut(sel) {
    var o = sel.options[sel.selectedIndex];
    var txt = o ? (o.text || '').replace(/\s+/g, ' ').trim() : '';
    if (!txt || !sel.offsetWidth) return '';
    var cs = getComputedStyle(sel);
    try { ctx = ctx || document.createElement('canvas').getContext('2d'); } catch (e) { return ''; }
    if (!ctx) return '';
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var arrow = (cs.webkitAppearance === 'none' || cs.appearance === 'none') ? 0 : 20;
    var room = sel.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - arrow;
    return ctx.measureText(txt).width > room + 1 ? txt : '';
  }
  function mirrorSelect(sel, txt) {
    var cs = getComputedStyle(sel), par = sel.parentElement;
    var m = document.createElement('span');
    m.className = 'nbh-pm';
    m.textContent = txt;
    COPY.forEach(function (k) { m.style[k] = cs[k]; });
    BOX.forEach(function (k) { m.style[k] = cs[k]; });
    var pcs = par ? getComputedStyle(par) : null;
    if (inRow(m, sel, pcs)) { /* sized in inRow */ }
    else if (!(par && /^(TD|TH)$/.test(par.tagName))) { m.classList.add('nbh-pm-inl'); m.style.maxWidth = '100%'; }
    sel.classList.add('nbh-pm-src');
    sel.parentNode.insertBefore(m, sel.nextSibling);
  }
  function buildMirrors() {
    clearMirrors();
    var all = document.querySelectorAll('input,textarea');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!texty(el) || !el.value || el.closest(SKIP)) continue;
      if (el.tagName === 'TEXTAREA') { mirror(el); continue; }
      /* a short entry prints fine in its own box; a long one, or one already
         running past the edge on screen, is printed as text so it can wrap */
      var over = el.offsetWidth && el.scrollWidth > el.clientWidth + 1;
      if (over || el.value.length >= 18) mirror(el);
    }
    var sels = document.getElementsByTagName('select'), cut = [];
    for (var k = 0; k < sels.length; k++) {
      if (sels[k].multiple || sels[k].closest(SKIP)) continue;
      var t = selectCut(sels[k]);
      if (t) cut.push([sels[k], t]);
    }
    cut.forEach(function (c) { mirrorSelect(c[0], c[1]); });
  }
  /* ---------- 4. nothing runs off the right edge of the page ---------- */
  var root = document.documentElement;
  var UNIT = { px: 1, 'in': 96, cm: 96 / 2.54, mm: 96 / 25.4, pt: 96 / 72, pc: 16, em: 16, rem: 16 };
  function px(n, u) { return parseFloat(n) * (UNIT[(u || 'px').toLowerCase()] || 1); }
  function pxOf(s) { var m = /^\s*(-?[\d.]+)\s*([a-z]*)\s*$/i.exec(s || ''); return m ? px(m[1], m[2] || 'px') : null; }
  /* would this media query hold on a page W pixels wide? */
  function onPaper(text, W) {
    text = (text || '').trim().toLowerCase();
    if (!text || text === 'all') return true;
    return text.split(',').some(function (q) {
      q = q.trim();
      var neg = /^not\s/.test(q);
      q = q.replace(/^(not|only)\s+/, '');
      var ok = q.split(/\s+and\s+/).every(function (part) {
        part = part.trim();
        if (!part || part === 'print' || part === 'all') return true;
        if (/^(screen|speech|tv|projection|handheld|braille|embossed|aural|tty)$/.test(part)) return false;
        var m = /^\(\s*(min|max)-width\s*:\s*([\d.]+)\s*([a-z]*)\s*\)$/.exec(part);
        if (m) { var v = px(m[2], m[3] || 'px'); return m[1] === 'max' ? W <= v : W >= v; }
        try { return window.matchMedia(part).matches; } catch (e) { return true; }
      });
      return neg ? !ok : ok;
    });
  }
  function eachRule(fn) {
    function walk(rules) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        fn(r);
        if (r.cssRules && r.type !== 6) { try { walk(r.cssRules); } catch (e) {} }
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      var rules = null;
      try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
      if (rules) walk(rules);
    }
  }
  /* the width the page gives the content: paper less the margins the form asks for */
  function pageWidth() {
    var pw = 8.5 * 96, ph = 11 * 96, land = false, ml = 0.4 * 96, mr = 0.4 * 96, W0 = 7.6 * 96;
    eachRule(function (r) {
      if (r.type !== 6 || (r.selectorText || '').trim()) return;
      var p = r.parentRule;
      while (p) { if (p.media && !onPaper(p.media.mediaText, W0)) return; p = p.parentRule; }
      var size = (r.style.getPropertyValue('size') || '').toLowerCase();
      if (size) {
        if (/legal/.test(size)) { pw = 8.5 * 96; ph = 14 * 96; }
        else if (/a4/.test(size)) { pw = px(210, 'mm'); ph = px(297, 'mm'); }
        else if (/letter/.test(size)) { pw = 8.5 * 96; ph = 11 * 96; }
        var dims = size.match(/[\d.]+\s*[a-z]+/g);
        if (dims && dims.length) { pw = pxOf(dims[0]); ph = pxOf(dims[1] || dims[0]); }
        land = /landscape/.test(size) ? true : /portrait/.test(size) ? false : land;
      }
      var a = pxOf(r.style.marginLeft), b = pxOf(r.style.marginRight);
      if (a !== null) ml = a;
      if (b !== null) mr = b;
    });
    var w = land ? Math.max(pw, ph) : Math.min(pw, ph);
    return w - ml - mr;
  }
  var fitted = [];
  function unfitPrint() {
    for (var i = 0; i < fitted.length; i++) fitted[i].el.style.zoom = fitted[i].prev;
    fitted = [];
  }
  /* Anything wider than the room it has: the page, or a box that clips what
     spills out of it (a card with rounded corners hides its overflow, so a
     table too wide for it lost its last column without running off the page). */
  function tooWide(W) {
    var left = root.getBoundingClientRect().left, page = left + W + 1.5, out = [];
    var room = new Map(), over = new Set();
    var all = document.body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.ownerSVGElement) continue;             // a drawing is fitted whole, as its <svg>
      var p = el.parentElement, L = page;
      if (p && p !== document.body) {
        L = room.get(p);
        if (L === undefined) {
          L = page;
          for (var a = p; a && a !== document.body; a = a.parentElement) {
            var known = room.get(a);
            if (known !== undefined && a !== p) { L = Math.min(L, known); break; }
            var acs = getComputedStyle(a);
            if (acs.overflowX !== 'visible' && acs.display !== 'contents') {
              var ar = a.getBoundingClientRect();
              if (ar.width < 8) { L = Infinity; break; }   // a visually hidden box: leave it alone
              L = Math.min(L, ar.right - (parseFloat(acs.borderRightWidth) || 0) + 1.5);
            }
          }
          room.set(p, L);
        }
      }
      var r = el.getBoundingClientRect();
      if (r.right <= L || (!r.width && !r.height)) continue;
      if (r.left >= L - 2) continue;                // parked out of the way on purpose
      over.add(el);
      if (p && over.has(p)) continue;               // its container is the one being fitted
      out.push({ el: el, ratio: (L - 1.5 - r.left) / r.width });
    }
    return out;
  }
  /* Lay the page out as it will be on paper, do the work, put the screen back.
     Mirrors are built here too, so a field is judged by the width it will have
     on the page rather than on the monitor. */
  function preparePrint() {
    clearMirrors();
    unfitPrint();
    var W = pageWidth();
    if (!(W > 200)) { buildMirrors(); return; }
    var rules = [], texts = [];
    eachRule(function (r) { if (r.type === 4 && r.media) rules.push(r); });
    var st = root.style;
    var was = [st.getPropertyValue('width'), st.getPropertyPriority('width'),
               st.getPropertyValue('min-width'), st.getPropertyValue('max-width')];
    try {
      /* lay the page out as it will be on paper: print rules on, screen rules
         off, and the width of the page rather than of the window */
      for (var i = 0; i < rules.length; i++) {
        texts[i] = rules[i].media.mediaText;
        rules[i].media.mediaText = onPaper(texts[i], W) ? 'all' : 'not all';
      }
      st.setProperty('width', W + 'px', 'important');
      st.setProperty('min-width', '0px', 'important');
      st.setProperty('max-width', 'none', 'important');
      buildMirrors();
      for (var pass = 0; pass < 4; pass++) {
        var wide = tooWide(W);
        if (!wide.length) break;
        for (var k = 0; k < wide.length; k++) {
          var el = wide[k].el, cur = parseFloat(el.style.zoom) || 1, known = false;
          for (var j = 0; j < fitted.length; j++) if (fitted[j].el === el) { known = true; break; }
          if (!known) fitted.push({ el: el, prev: el.style.zoom });
          el.style.zoom = Math.max(0.4, cur * Math.min(0.995, wide[k].ratio)).toFixed(3);
        }
      }
    } catch (e) {
      try { if (!document.querySelector('.nbh-pm')) buildMirrors(); } catch (e2) {}
    } finally {
      for (var n = 0; n < texts.length; n++) {
        if (texts[n] !== undefined) try { rules[n].media.mediaText = texts[n]; } catch (e) {}
      }
      st.removeProperty('width'); st.removeProperty('min-width'); st.removeProperty('max-width');
      if (was[0]) st.setProperty('width', was[0], was[1]);
      if (was[2]) st.setProperty('min-width', was[2]);
      if (was[3]) st.setProperty('max-width', was[3]);
    }
  }

  window.addEventListener('beforeprint', function () { growAll(); preparePrint(); });
  window.addEventListener('afterprint', function () { clearMirrors(); unfitPrint(); });
  try {
    var mq = window.matchMedia('print');
    var h = function (e) { if (!e.matches) { clearMirrors(); unfitPrint(); } };
    if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h);
  } catch (e) {}
  window.nbhFieldCare = { grow: growAll, mirrors: buildMirrors, clear: clearMirrors,
    prepare: preparePrint, unfit: unfitPrint, pageWidth: pageWidth,
    fitted: function () { return fitted.map(function (f) {
      var e = f.el; return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
        (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') +
        ' @' + e.style.zoom; }); } };
})();
