/* ---- polish: the one part that needs script -----------------------------------
   Thirty-one forms draw their fields three ways: as a bordered box, as a line to
   write on, or as a bare control inside a grid cell or a bordered row. A single
   style forced on all three would break the grids and double the borders, so
   each field is read from the form's own stylesheet and marked for the polish
   that fits it. Tables with enough rows to lose one's place in get a class for
   light row shading; a table that colours its own cells is left alone. Inside
   the workstation, Escape and the fullscreen key are passed up to it.
   Nothing here touches what prints: the marks are classes the print styles
   never mention. */
/* v23.55 (review F488) zoom: the forms no longer stop it; an iPad or iPhone only keeps Safari from zooming into a
   tapped field (pinch zoom works there anyway) */
(function(){try{var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(!ios)return;var m=document.querySelector('meta[name=viewport]');if(m&&!/maximum-scale/.test(m.content))m.content+=', maximum-scale=1';}catch(e){}})();
(function () {
  var SKIP = '.toolbar,.nbh-mast,.nbh-tabs,nav.tabs,dialog,.nbh-pm';
  function alpha(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return c === 'transparent' ? 0 : 1; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; }
  function isField(e) {
    if (!e || !e.tagName) return false;
    if (e.tagName === 'SELECT' || e.tagName === 'TEXTAREA') return true;
    if (e.tagName !== 'INPUT') return false;
    return !/^(hidden|checkbox|radio|file|button|submit|reset|image|range|color)$/i.test(e.type || '');
  }
  function classify(e) {
    if (e.closest(SKIP)) { e.classList.add('nbh-skip'); return; }
    var cs = getComputedStyle(e);
    var t = parseFloat(cs.borderTopWidth) || 0, b = parseFloat(cs.borderBottomWidth) || 0,
        l = parseFloat(cs.borderLeftWidth) || 0, r = parseFloat(cs.borderRightWidth) || 0;
    var seen = function (side) { return alpha(cs['border' + side + 'Color']) > 0.05; };
    var kind;
    var ul = false;
    if (t && b && l && r && (seen('Top') || seen('Bottom') || seen('Left'))) kind = 'nbh-box';
    else if (b && !t && !l && !r && seen('Bottom')) { kind = 'nbh-box'; ul = true; }   /* v21.93 one look: a line to write on is drawn as the box the newer forms use (screen only; paper keeps its line) */
    else kind = 'nbh-bare';
    if (e.classList.contains(kind) && e.classList.contains('nbh-fld')) return;
    e.classList.remove('nbh-box', 'nbh-ul', 'nbh-bare', 'nbh-was-ul');
    e.classList.add('nbh-fld', kind);
    if (ul) e.classList.add('nbh-was-ul');
    if (e.closest('td,th')) e.classList.add('nbh-intd');
  }
  function fields(root) {
    var list = (root || document).querySelectorAll('input:not(.nbh-fld):not(.nbh-skip),select:not(.nbh-fld):not(.nbh-skip),textarea:not(.nbh-fld):not(.nbh-skip)');
    for (var i = 0; i < list.length; i++) if (isField(list[i])) classify(list[i]);
  }
  /* light shading on every other row, only where the table does not colour its own */
  function zebra(root) {
    var tables = (root || document).querySelectorAll('table:not([data-nbh-z])');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      t.setAttribute('data-nbh-z', '1');
      if (t.rows.length < 5) { t.removeAttribute('data-nbh-z'); continue; }   /* looked at again once rows are added */
      if (t.closest(SKIP) || t.closest('table table')) continue;
      if (/\b(scatter|iv|grid|heat|matrix|cal)\b/i.test(t.className)) continue;
      /* a painted row, or a painted cell other than a row's label cell, means the table colours its own */
      var painted = false, cells = t.querySelectorAll('td'), rows = t.rows, k;
      for (k = 0; k < rows.length && !painted; k++) if (alpha(getComputedStyle(rows[k]).backgroundColor) > 0.05) painted = true;
      for (k = 0; k < cells.length && k < 120 && !painted; k++) {
        if (cells[k].cellIndex === 0) continue;
        if (alpha(getComputedStyle(cells[k]).backgroundColor) > 0.05) painted = true;
      }
      if (!painted) t.classList.add('nbh-zebra');
    }
  }
  /* a sheet with no padding of its own is a frame around cards, not a page: no rounded corner on it */
  function sheets() {
    var s = document.querySelectorAll('.sheet:not(table)');
    for (var i = 0; i < s.length; i++) {
      if (!s[i].classList.contains('nbh-flush') && (parseFloat(getComputedStyle(s[i]).paddingTop) || 0) < 8) s[i].classList.add('nbh-flush');
    }
  }
  /* The forms cap their instruction text at 60 to 80 characters, a print measure
     that reads as a narrow column on a wide screen. On screen the cap was lifted
     to what the sheet allows (about 140 characters); since v21.93 (the design
     review) a reading line is about 80 characters at most, so a paragraph the
     form left uncapped is marked too. Paper keeps the form's own measure.
     Only leaf text blocks are marked: a wrapper with blocks inside keeps its width. */
  var INLINE = /^(A|B|I|EM|STRONG|SPAN|KBD|CODE|BR|SMALL|SUB|SUP|ABBR|MARK|U|S|Q|CITE|TIME|WBR|SVG|INPUT|SELECT|BUTTON|LABEL)$/;
  function prose(root) {
    var list = (root || document).querySelectorAll('p:not(.nbh-wide),li:not(.nbh-wide),dd:not(.nbh-wide),dt:not(.nbh-wide),div:not(.nbh-wide),figcaption:not(.nbh-wide),blockquote:not(.nbh-wide),small:not(.nbh-wide),h1:not(.nbh-wide),h2:not(.nbh-wide),h3:not(.nbh-wide),h4:not(.nbh-wide)');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest('.toolbar,dialog,table,svg,.nbh-pm') || !(el.textContent || '').trim()) continue;
      var leaf = true;
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (!INLINE.test(c.tagName)) { leaf = false; break; }
      if (!leaf) continue;
      var mw = getComputedStyle(el).maxWidth;
      if (/px$/.test(mw)) { var px = parseFloat(mw); if (!(px >= 160 && px <= 1400)) continue; }
      else if (!(mw === 'none' && /^(P|LI|DD|BLOCKQUOTE|FIGCAPTION)$/.test(el.tagName) && (el.textContent || '').trim().length > 90)) continue;   /* v21.93 a long paragraph the form left uncapped */
      el.classList.add('nbh-wide');
    }
  }
  /* v21.93 one size for the labels that name a field: a form's label under 12 px (11.5, 11, 10.5) reads at 12 on screen;
     the labels in a table, the toolbar, a dialog and a check box's own label are left as they are */
  function labels(root) {
    var list = (root || document).querySelectorAll('label:not(.nbh-lab):not(.nbh-lab-no)');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest('.toolbar,dialog,table,svg,.nbh-pm,.nbh-tabs,nav') || !(el.textContent || '').trim()) { el.classList.add('nbh-lab-no'); continue; }
      if (el.querySelector('input,select,textarea,div,p')) { el.classList.add('nbh-lab-no'); continue; }
      var fs = parseFloat(getComputedStyle(el).fontSize);
      el.classList.add(fs >= 10 && fs < 11.95 ? 'nbh-lab' : 'nbh-lab-no');
    }
  }
  function run(root) { try { fields(root); zebra(root); prose(root); labels(root); if (!root) sheets(); } catch (e) {} if (!root) { try { prInject(); } catch (e) {} xsLater(200); } }
  /* v24.36 (review R-033, E-06) sideways scrolling, shown. Every box that scrolls sideways (a table wider than the screen)
     gets a fade at the edge with more to see and, above it, a line with the words and two arrows that move it a screen at a
     time; both go when the table fits. A box with a fade of its own (ABC-1's matrix, SP-1's grid) keeps it and gets the bar. */
  var XS_SEL = '.nbh-tscroll,.gridwrap,.grid-wrap,.nbh-scrollx,.sheet-wrap,.matrix-wrap,.logwrap,[data-nbh-xs]';
  function xsBar(w) {
    var bar = w.previousElementSibling;
    if (bar && bar.classList.contains('nbh-xs-bar')) return bar;
    bar = document.createElement('div'); bar.className = 'nbh-xs-bar noprint'; bar.setAttribute('data-nbh-screen', '');
    bar.innerHTML = '<span>More columns to the side: swipe, or use the arrows</span><button type="button" data-xs="-1" aria-label="Show the columns to the left">‹</button><button type="button" data-xs="1" aria-label="Show the columns to the right">›</button>';
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-xs]'); if (!b) return; var d = +b.getAttribute('data-xs') * Math.max(120, Math.round(w.clientWidth * 0.6)); try { w.scrollBy({ left: d, behavior: 'smooth' }); } catch (x) { w.scrollLeft += d; } setTimeout(function () { xsState(w); }, 400); });
    w.parentNode.insertBefore(bar, w);
    w.addEventListener('scroll', function () { xsState(w); }, { passive: true });
    if (getComputedStyle(w).maskImage && getComputedStyle(w).maskImage !== 'none') w.classList.add('nbh-xs-own');
    return bar;
  }
  function xsState(w) {
    var can = w.scrollWidth > w.clientWidth + 4, bar = w.previousElementSibling;
    if (!(bar && bar.classList.contains('nbh-xs-bar'))) bar = null;
    if (!can) { w.classList.remove('nbh-xs', 'nbh-xs-l', 'nbh-xs-r'); if (bar) bar.hidden = true; return; }
    if (!bar) bar = xsBar(w);
    var l = w.scrollLeft > 4, r = w.scrollLeft + w.clientWidth < w.scrollWidth - 4;
    w.classList.add('nbh-xs'); w.classList.toggle('nbh-xs-l', l); w.classList.toggle('nbh-xs-r', r);
    bar.hidden = false; bar.querySelector('[data-xs="-1"]').disabled = !l; bar.querySelector('[data-xs="1"]').disabled = !r;
  }
  function xscroll() {
    if (document.documentElement.classList.contains('nbh-plain') || (window.matchMedia && window.matchMedia('print').matches)) return;
    var seen = [];
    function one(w) { if (!w || seen.indexOf(w) >= 0) return; seen.push(w); if (!w.offsetParent) { var hb = w.previousElementSibling; if (hb && hb.classList.contains('nbh-xs-bar')) hb.hidden = true; return; } var o = getComputedStyle(w).overflowX; if (o !== 'auto' && o !== 'scroll') return; xsState(w); }
    Array.prototype.forEach.call(document.querySelectorAll(XS_SEL), one);
    /* every table that scrolls sideways, in its own box or as a block of its own (DD-1's results tables) */
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) { if (t.closest('.nbh-xs-bar,.nbh-tb,.toolbar,[role="toolbar"]')) return; one(t); var pw = t.parentElement; if (pw && pw.tagName !== 'TD' && pw.tagName !== 'TH' && !pw.closest('.nbh-tb,.toolbar,[role="toolbar"]')) one(pw); });
  }
  var xsT = 0; function xsLater(ms) { clearTimeout(xsT); xsT = setTimeout(function () { try { xscroll(); } catch (e) {} }, ms || 250); }
  document.addEventListener('click', function () { xsLater(350); }, true);
  window.addEventListener('resize', function () { xsLater(300); });
  window.addEventListener('load', function () { xsLater(700); });
  window.addEventListener('afterprint', function () { xsLater(300); });
  setTimeout(function () { xsLater(50); }, 1400);

  /* v22.15 (review F479): on a phone, a table wider than the sheet it sits in (PA-1's MSWO sheet, AD-1, RA-1, EA-1 ...) made the
     whole page, toolbar and all, slide sideways. Such a table is put in a box of its own that scrolls; checked after load,
     after each tap (a view or a row may have changed) and on a turn of the screen. Screen only: print sees no box. */
  var phone = window.matchMedia ? window.matchMedia('screen and (max-width:600px)') : null, tsT = 0;
  function tscroll() {
    if (!phone || !phone.matches || document.documentElement.classList.contains('nbh-plain')) return;
    var vw = document.documentElement.clientWidth;
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
      if (!t.offsetParent || t.closest('.nbh-tscroll')) return;
      var p = t.parentElement; if (!p) return;
      var box = t.getBoundingClientRect(); if (box.right <= vw + 1 && t.scrollWidth <= p.clientWidth + 1) return;
      for (var a = p; a && a !== document.body; a = a.parentElement) { var o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return; }
      var w = document.createElement('div'); w.className = 'nbh-tscroll'; p.insertBefore(w, t); w.appendChild(t);
    });
  }
  function tsLater(ms) { clearTimeout(tsT); tsT = setTimeout(function () { try { tscroll(); xsLater(120); } catch (e) {} }, ms || 250); }
  document.addEventListener('click', function () { tsLater(300); }, true);
  window.addEventListener('resize', function () { tsLater(300); });
  window.addEventListener('load', function () { tsLater(600); });
  setTimeout(function () { tsLater(50); }, 1200);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { run(); });
  else run();
  window.addEventListener('load', function () { run(); });
  /* rows, respondents and sessions are added by script; a new field is marked at
     once, so it never shows the form's own style for a moment, and the tables
     are looked at again shortly after */
  var t = null;
  try {
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var added = recs[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          try { if (isField(n) && !n.classList.contains('nbh-fld') && !n.classList.contains('nbh-skip')) classify(n); else fields(n); } catch (e) {}
        }
      }
      clearTimeout(t); t = setTimeout(function () { run(); }, 80);
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  /* While a print is taken, or the master print reads the form, the phone text
     size steps aside and every textarea is measured again by the field-care
     script, so the heights it keeps inline are the ones the paper had before. */
  function plain(on) {
    document.documentElement.classList.toggle('nbh-plain', !!on);
    try { pnPlain(!!on); } catch (e) {}
    try { if (window.nbhFieldCare && window.nbhFieldCare.grow) window.nbhFieldCare.grow(); } catch (e) {}
  }
  window.addEventListener('beforeprint', function () { plain(true); });
  window.addEventListener('afterprint', function () { plain(false); });
  try {
    var mq = window.matchMedia('print');
    var mh = function (e) { plain(!!e.matches); };
    if (mq.addEventListener) mq.addEventListener('change', mh); else if (mq.addListener) mq.addListener(mh);
  } catch (e) {}
  /* inside the workstation: Escape leaves its fullscreen view, and the fullscreen key toggles it */
  var framed = false;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (framed) {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (document.querySelector('dialog[open]')) return;
        try { window.parent.postMessage({ nbh: 'key', key: 'Escape' }, '*'); } catch (x) {}
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && String(e.key || '').toLowerCase() === 'f') {
        e.preventDefault();
        try { window.parent.postMessage({ nbh: 'key', key: 'F', mod: true, shift: true }, '*'); } catch (x) {}
      }
    });
  }
  /* Previous and Next at the foot of the page. A form's pages are the buttons of
     its view control (#viewSeg) or its tab row ([role=tab]); the bar below the
     sheet steps through them so the next page is a click away without a scroll
     back to the top. Screen only: the bar is taken out of the document while a
     print or the packet reads it, and never reaches paper. */
  var pn = null, pnHome = null;
  function pnButtons() {
    var seg = document.querySelector('#viewSeg');
    var b = seg ? seg.querySelectorAll('button[data-view]') : document.querySelectorAll('[role=tab]');
    var out = [];
    for (var i = 0; i < b.length; i++) if (!b[i].disabled && !b[i].hidden) out.push(b[i]);
    return out;
  }
  function pnCurrent(b) {
    for (var i = 0; i < b.length; i++) if (b[i].getAttribute('aria-pressed') === 'true' || b[i].getAttribute('aria-selected') === 'true') return i;
    return -1;
  }
  function pnLabel(b) {
    var t = '';
    for (var n = b.firstChild; n; n = n.nextSibling) {
      var s = n.textContent || '';
      if (n.nodeType === 1 && /^\s*\d+\s*$/.test(s)) continue; /* a step number badge */
      t += s;
    }
    return t.replace(/\s+/g, ' ').trim();
  }
  /* the pages themselves: the sheets, or the main element, or the tab panels */
  function pnPages() {
    var s = document.querySelectorAll('.sheet:not(table)');
    if (!s.length) s = document.querySelectorAll('main');
    if (!s.length) s = document.querySelectorAll('[role=tabpanel]');
    return s;
  }
  function pnUpdate() {
    if (!pn) return;
    var b = pnButtons(), i = pnCurrent(b);
    var prev = pn.querySelector('.nbh-pn-prev'), next = pn.querySelector('.nbh-pn-next'), where = pn.querySelector('.nbh-pn-where');
    if (b.length < 2 || i < 0) { pn.hidden = true; return; }
    pn.hidden = false;
    prev.disabled = i <= 0; next.disabled = i >= b.length - 1;
    prev.innerHTML = i > 0 ? '<span aria-hidden="true">&larr;</span> ' + esc(pnLabel(b[i - 1])) : '';
    next.innerHTML = i < b.length - 1 ? 'Next: ' + esc(pnLabel(b[i + 1])) + ' <span aria-hidden="true">&rarr;</span>' : '';
    where.textContent = 'Page ' + (i + 1) + ' of ' + b.length + ' · ' + pnLabel(b[i]);
    var s = pnPages(), last = null;
    for (var k = s.length - 1; k >= 0; k--) if (s[k].offsetParent !== null) { last = s[k]; break; }
    if (last) {
      var r = last.getBoundingClientRect(), vw = document.documentElement.clientWidth || r.width;
      /* a page with no sheet of its own (its main element spans the window) keeps a gutter */
      if (r.width > 200) pn.style.width = (r.width >= vw - 2 && vw > 700 ? r.width - 40 : r.width) + 'px';
    }
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pnGo(d) {
    var b = pnButtons(), i = pnCurrent(b), t = b[i + d];
    if (!t) return;
    t.click();
    setTimeout(function () { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); } pnUpdate(); }, 0);
  }
  function pagenav() {
    if (pn || pnButtons().length < 2) return;
    var s = pnPages(), last = s[s.length - 1];
    if (!last || !last.parentNode) return;
    pn = document.createElement('nav');
    pn.className = 'nbh-pagenav noprint';
    pn.setAttribute('aria-label', 'Form pages');
    pn.setAttribute('data-nbh-screen', '');
    pn.innerHTML = '<button type="button" class="nbh-pn-prev"></button><span class="nbh-pn-where" aria-live="polite"></span><button type="button" class="nbh-pn-next"></button>';
    pn.querySelector('.nbh-pn-prev').addEventListener('click', function () { pnGo(-1); });
    pn.querySelector('.nbh-pn-next').addEventListener('click', function () { pnGo(1); });
    pnHome = last;
    last.parentNode.insertBefore(pn, last.nextSibling);
    var seg = document.querySelector('#viewSeg') || document.querySelector('[role=tablist]') || document.body;
    try { new MutationObserver(function () { pnUpdate(); }).observe(seg, { attributes: true, subtree: true, attributeFilter: ['aria-pressed', 'aria-selected', 'disabled', 'hidden'] }); } catch (e) {}
    window.addEventListener('resize', function () { pnUpdate(); });
    pnUpdate();
  }
  function pnPlain(on) {
    if (!pn) return;
    if (on) { if (pn.parentNode) pn.parentNode.removeChild(pn); }
    else if (!pn.parentNode && pnHome && pnHome.parentNode) { pnHome.parentNode.insertBefore(pn, pnHome.nextSibling); pnUpdate(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { pagenav(); });
  else pagenav();
  window.addEventListener('load', function () { pagenav(); pnUpdate(); });
  /* v21.91 Search the caseload: the workstation opens a student's form at a place the search found there and asks the
     form ({nbh:'find', words, key}) to show it. The first field that holds every word (the saved field's own key
     first, then any box, text area, list's chosen option or editable text; for a place the form draws, a table cell or a
     list item) is brought into view on the page of the form that holds it, and outlined for a moment. It is never
     focused, so the iPad's keyboard stays down. The words are matched as the workstation matches them: whole words from
     their start, capitals and accents aside, a date also by its month's name. Screen only: the outline's style is one
     the print and the packet never read. */
  var FD_AL = (function () { try { return new RegExp('[\\p{L}\\p{N}]', 'u'); } catch (e) { return /[a-z0-9]/; } })();
  var FD_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  function fdFold(s) {
    s = String(s == null ? '' : s);
    try { s = s.normalize('NFD'); } catch (e) {}
    return s.replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"');
  }
  function fdHay(v) {
    var t = String(v == null ? '' : v), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());
    if (m && +m[2] >= 1 && +m[2] <= 12) t += ' ' + FD_MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ' ' + m[1];
    return fdFold(t).replace(/\s+/g, ' ');
  }
  function fdAt(h, w) { var i = h.indexOf(w); while (i >= 0) { if (i === 0 || !FD_AL.test(h.charAt(i - 1))) return i; i = h.indexOf(w, i + 1); } return -1; }
  function fdHolds(v, words) { var h = fdHay(v); for (var i = 0; i < words.length; i++) if (fdAt(h, words[i]) < 0) return false; return words.length > 0; }
  function fdValue(e) {
    if (e.tagName === 'SELECT') { var o = e.options[e.selectedIndex]; return (o ? o.text + ' ' : '') + (e.value || ''); }
    if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA') return e.value;
    return e.textContent;
  }
  function fdUsable(e) {
    if (!e || (e.closest && e.closest('dialog:not([open]),template,.nbh-pagenav,script,style'))) return false;
    if (e.tagName === 'INPUT') return !/^(hidden|checkbox|radio|file|button|submit|reset|image|range|color)$/i.test(e.type || '');
    return true;
  }
  /* the control the snapshot keyed as #id, @name or ~position (the bridge's own keys) */
  function fdKeyed(key) {
    if (!key) return null;
    var list = Array.prototype.filter.call(document.querySelectorAll('input,select,textarea'), function (e) { return e.type !== 'file' && e.type !== 'hidden'; });
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var e = list[i], base = e.id ? '#' + e.id : (e.name ? '@' + e.name : ''), k;
      if (!base) k = '~' + i; else { seen[base] = (seen[base] || 0) + 1; k = seen[base] > 1 ? base + '~' + seen[base] : base; }
      if (k === key) return e;
    }
    return null;
  }
  function fdShown(e) { return !!(e && e.isConnected !== false && (e.offsetWidth || e.offsetHeight || e.getClientRects().length)); }
  function fdFields(words, key) {
    var out = [], k = fdKeyed(key);
    if (k && fdUsable(k) && fdHolds(fdValue(k), words)) out.push(k);
    var c = document.querySelectorAll('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
    for (var i = 0; i < c.length; i++) if (c[i] !== k && fdUsable(c[i]) && fdHolds(fdValue(c[i]), words)) out.push(c[i]);
    return out;
  }
  /* a place the form draws from its own record: the innermost cell or item holding every word */
  function fdTexts(words) {
    var c = document.querySelectorAll('td,th,li,dd,dt,output,summary'), out = [];
    for (var i = 0; i < c.length; i++) {
      var e = c[i];
      if (!fdUsable(e) || (e.closest && e.closest('.toolbar,.nbh-mast,nav')) || !fdHolds(e.textContent, words)) continue;
      var inner = e.querySelectorAll('td,th,li,dd,dt,output,summary'), deeper = false;
      for (var j = 0; j < inner.length && !deeper; j++) if (fdHolds(inner[j].textContent, words)) deeper = true;
      if (!deeper) out.push(e);
    }
    return out;
  }
  function fdPick(how, words, key) { var p = how === 'text' ? fdTexts(words) : fdFields(words, key); for (var i = 0; i < p.length; i++) if (fdShown(p[i])) return p[i]; return null; }
  /* on the page in view; else inside a folded section; else on another of the form's pages (the page shown before stays
     shown when none holds it) */
  function fdLocate(how, words, key) {
    var el = fdPick(how, words, key), i;
    if (el) return el;
    var p = how === 'text' ? fdTexts(words) : fdFields(words, key);
    for (i = 0; i < p.length; i++) { var d = p[i].closest && p[i].closest('details:not([open])'); if (d) { d.open = true; if (fdShown(p[i])) return p[i]; } }
    var b = pnButtons(), cur = pnCurrent(b);
    for (i = 0; i < b.length; i++) {
      if (i === cur) continue;
      try { b[i].click(); } catch (e) {}
      el = fdPick(how, words, key);
      if (el) return el;
    }
    if (cur >= 0 && b[cur]) { try { b[cur].click(); } catch (e) {} }
    return null;
  }
  function fdStyle() {
    if (document.getElementById('nbh-find-css')) return;
    var s = document.createElement('style');
    s.id = 'nbh-find-css'; s.setAttribute('data-nbh-screen', '');
    s.textContent = '@media screen{.nbh-found{outline:3px solid #d99a00!important;outline-offset:2px!important;box-shadow:0 0 0 7px rgba(217,154,0,.22)!important;border-radius:3px}}@media print{.nbh-found{outline:0!important;box-shadow:none!important}}';
    (document.head || document.documentElement).appendChild(s);
  }
  /* scrolled by the form itself, inside its own page only (scrollIntoView would move the workstation around it too) */
  function fdBring(e) {
    var p = e.parentElement, r, pr, cs;
    while (p && p !== document.body && p !== document.documentElement) {
      cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY + ' ' + cs.overflowX)) {
        r = e.getBoundingClientRect(); pr = p.getBoundingClientRect();
        if (p.scrollHeight > p.clientHeight + 1) p.scrollTop += (r.top + r.height / 2) - (pr.top + pr.height / 2);
        if (p.scrollWidth > p.clientWidth + 1) p.scrollLeft += (r.left + r.width / 2) - (pr.left + pr.width / 2);
      }
      p = p.parentElement;
    }
    r = e.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 600, tb = document.querySelector('.toolbar'), off = 0;
    try { if (tb && /sticky|fixed/.test(getComputedStyle(tb).position)) off = tb.getBoundingClientRect().height; } catch (x) {}
    var top = (window.pageYOffset || document.documentElement.scrollTop || 0) + r.top - (r.height > (vh - off) * 0.6 ? off + 16 : (vh + off) / 2 - r.height / 2);
    top = Math.max(0, Math.round(top));
    try { window.scrollTo({ top: top, behavior: 'smooth' }); } catch (x) { window.scrollTo(0, top); }
  }
  function fdFlash(e) {
    fdStyle();
    e.classList.add('nbh-found');
    clearTimeout(e.__nbhFound);
    e.__nbhFound = setTimeout(function () { e.classList.remove('nbh-found'); }, 2600);
  }
  function fdView() { var b = pnButtons(), i = pnCurrent(b); return i >= 0 ? pnLabel(b[i]) : ''; }
  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.nbh !== 'find' || !framed || ev.source !== window.parent) return;
    var words = [];
    for (var i = 0; i < (d.words || []).length && i < 12; i++) { var w = fdFold(d.words[i]).trim(); if (w) words.push(w); }
    var reply = function (m) {
      m.nbh = 'found';
      try { m.id = window.nbhBridge && window.nbhBridge.formId ? window.nbhBridge.formId() : ''; } catch (x) { m.id = ''; }
      try { ev.source.postMessage(m, '*'); } catch (x) {}
    };
    if (!words.length) { reply({ found: false }); return; }
    var how = 'field', el = null;
    try {
      el = fdLocate('field', words, d.key || '');
      if (!el) { how = 'text'; el = fdLocate('text', words, ''); }
    } catch (x) { el = null; }
    if (!el) { reply({ found: false }); return; }
    /* a page that draws itself a moment after it is chosen: brought into view once it has */
    setTimeout(function () {
      var e = el;
      if (!fdShown(e)) { try { e = fdPick(how, words, how === 'field' ? d.key || '' : ''); } catch (x) { e = null; } }
      if (!e) { reply({ found: false }); return; }
      try { fdBring(e); fdFlash(e); } catch (x) {}
      reply({ found: true, how: how, view: fdView(), tag: e.tagName.toLowerCase(), key: e.id ? '#' + e.id : (e.name ? '@' + e.name : '') });
    }, 60);
  });
  /* v22.07 (review F490) a field reached with Tab or Shift+Tab is never left under the pinned toolbar: the page keeps a
     scroll margin the toolbar's height (scroll-padding-top, measured, as it folds or the window changes), and a field the
     browser left underneath it is brought into view. Screen only; print has no pinned toolbar. */
  function tbH() { var tb = document.querySelector('.toolbar'); try { if (tb && /sticky|fixed/.test(getComputedStyle(tb).position)) return Math.round(tb.getBoundingClientRect().height); } catch (x) {} return 0; }
  /* v22.15: and the bars a form pins under its toolbar while data is taken (MT-1's timer, ABC-1's observation bar, the live
     status lines of CT-1, ST-1 and TI-1): a field brought into view was left under MT-1's timer */
  var UNDER = '.obs-bar, .tmr, .rr-live.rr-mode-all > .rr-status, .ti-run-live.ti-mode-all > .ti-run-status';
  function barsH() { var h = tbH(); if (!h) return 0;
    try { Array.prototype.forEach.call(document.querySelectorAll(UNDER), function (b) { if (b.offsetParent && getComputedStyle(b).position === 'sticky') h += Math.round(b.getBoundingClientRect().height); }); } catch (x) {}
    return h; }
  function padTop() { var h = barsH(); document.documentElement.style.scrollPaddingTop = h ? (h + 8) + 'px' : ''; }
  padTop(); window.addEventListener('resize', padTop); window.addEventListener('load', padTop); setTimeout(padTop, 1200);
  document.addEventListener('click', function () { setTimeout(padTop, 300); }, true);
  try { var tbo = document.querySelector('.toolbar'); if (tbo && window.ResizeObserver) new ResizeObserver(padTop).observe(tbo); } catch (x) {}
  /* v22.15: not the field just tapped or clicked, which is where the finger is (the page stays put); a field the form moves
     the cursor to after a tap (Next, Add a row) is still brought into view */
  var ptrAt = 0, ptrEl = null, ptrX = 0, ptrY = 0;
  document.addEventListener('pointerdown', function (e) { ptrAt = Date.now(); ptrEl = e.target; ptrX = e.clientX; ptrY = e.clientY; }, true);
  function underFinger(t) { if (!ptrEl || Date.now() - ptrAt > 800) return false; if (t === ptrEl || (t.contains && t.contains(ptrEl))) return true;
    var r = t.getBoundingClientRect(); return ptrX >= r.left && ptrX <= r.right && ptrY >= r.top && ptrY <= r.bottom; }   /* a form that draws the tapped control again focuses the new one, in the same place */
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!t || !t.getBoundingClientRect || (t.closest && t.closest('.toolbar,dialog'))) return;
    if (underFinger(t)) return;
    var h = barsH(); if (!h) return;
    setTimeout(function () { var r = t.getBoundingClientRect(); if (r.top < h + 4 && r.bottom > 0) window.scrollBy(0, r.top - h - 8); }, 0);
  }, true);
  /* v22.09 (review F477) a form printed on its own names the student on every page, in the running head's middle, and its
     pages say "Page N of M", as the master print does: a page that comes loose can be tied to its student, and a missing
     page shows. Written for the print only (Chrome and Edge print these page margins; Safari prints none, and Finish PDF
     adds them there). */
  var PS = { client: '[data-m="client"],[name="m.client"],[name="s_name"],[data-meta="client"],#m_client,#mClient,[name="h-client"],[name="h.client"],[name="c.client"],[name="student"],[name="s.student"],#h-client,#hClient,#cClient,#sClient,[name="c.student"]',
             sid: '[data-m="sid"],[name="m.sid"],[name="s_id"],[data-meta="sid"],#m_id,#mId,#sId,[name="s.sid"],[name="h.sid"],[name="c.sid"],#hId,#cId,#h-id,[name="s.id"]' };
  function pval(sel) { var l = document.querySelectorAll(sel); for (var i = 0; i < l.length; i++) { var v = String(l[i].value || l[i].textContent || '').replace(/\s+/g, ' ').trim(); if (v) return v.slice(0, 60); } return ''; }
  function cssStr(t) { return '"' + String(t).replace(/[\\"]/g, '\\$&').replace(/[\r\n]+/g, ' ') + '"'; }
  /* v22.23 not on the materials a student uses or a classroom shows: Form TK-1's token boards and cards and Form VS-1's
     visual supports print as they are, edge to edge in their own area, with no name and no page number on them */
  var NO_HEAD = /^Form (TK-1|VS-1|RS-1) /;   /* v22.28 RS-1 is a staff member's record: its pages carry the client code, not the case's student */
  function printHead() {
    var old = document.getElementById('nbh-print-head'); if (old) old.remove();
    if (NO_HEAD.test(document.title || '')) return;
    var nm = pval(PS.client) || [pval('#sFirst,[name="s.first"]'), pval('#sLast,[name="s.last"]')].filter(Boolean).join(' ');
    var who = [nm, pval(PS.sid) ? 'ID ' + pval(PS.sid) : ''].filter(Boolean).join('  \u00b7  ');
    var st = document.createElement('style'); st.id = 'nbh-print-head';
    st.textContent = '@page{' + (who ? '@top-center{content:' + cssStr(who) + ';font-family:"Inter","Segoe UI",Arial,sans-serif;font-size:8pt;color:#254657}' : '') +
      '@bottom-right{content:"Page " counter(page) " of " counter(pages)}}';
    document.head.appendChild(st);
  }
  window.addEventListener('beforeprint', printHead);
  window.addEventListener('afterprint', function () { var o = document.getElementById('nbh-print-head'); if (o) o.remove(); });
  /* v24.31 (review R-031, E-01, with R-029, R-030, R-037, R-042, R-057, R-067, R-075, R-079, R-098, R-102) one print policy
     for the set. The record prints first; the Guide and the References print only when "Include the guide and references" is
     ticked, and then after the record; a log or an assessment sheet with nothing entered prints only when "Include blank
     sheets" is ticked; a sheet's closing lines (a citation, a method note, a signature block) stay with the block above them,
     since the browser moves a page break only to the nearest allowed point; headings keep what follows them; a long table
     runs across pages a row at a time with its header repeated. The two choices are kept on this device for every form. */
  var PRK = { g: 'nbh.print.guide', b: 'nbh.print.blank' };
  function prGet(k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
  function prSet(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} }
  function prGuideEls() { return document.querySelectorAll('#guide,#refs,section.only-guide,[data-nbh-guide]'); }
  function prOwn() { return document.getElementById('printGuide'); }
  function prGuideOn() { var g = document.getElementById('nbhPrintGuide') || prOwn(); return g ? !!g.checked : prGet(PRK.g); }
  function prBlankOn() { var b = document.getElementById('nbhPrintBlank'); return b ? !!b.checked : prGet(PRK.b); }
  function prScreen() { document.documentElement.classList.toggle('nbh-pr-noguide', !prGuideOn()); }
  function prStyle() {
    if (document.getElementById('nbh-print-policy')) return;
    var st = document.createElement('style'); st.id = 'nbh-print-policy';
    st.textContent = '.nbh-print-opts{display:inline-flex;gap:4px 12px;align-items:center;flex-wrap:wrap;font-size:12px;margin-left:4px}' +
      '.nbh-print-opts label{display:inline-flex;align-items:center;gap:5px;cursor:pointer;min-height:36px;margin:0;font-weight:400;white-space:nowrap}' +
      '.nbh-print-opts input{margin:0;width:16px;height:16px}' +
      'html.nbh-pr-measure .sheet,html.nbh-pr-measure section[class*="only-"]{display:block!important;width:7.3in!important;max-width:7.3in!important;min-width:0!important;box-sizing:border-box}' +
      '@media print{.nbh-print-opts{display:none!important}' +
      'html.nbh-pr-noguide #guide,html.nbh-pr-noguide #refs,html.nbh-pr-noguide section.only-guide,html.nbh-pr-noguide [data-nbh-guide]{display:none!important}' +
      '.nbh-pr-blank{display:none!important}' +
      '[data-nbh-keep]{break-inside:avoid!important;page-break-inside:avoid!important}' +
      '[data-nbh-keep="2"]{break-before:avoid!important;page-break-before:avoid!important}' +
      '[data-nbh-keep="1"]{break-before:auto!important;page-break-before:auto!important}' +
      '.nbh-keep{display:inline-block;width:100%;vertical-align:top;box-sizing:border-box;break-before:avoid;page-break-before:avoid}' +
      'h1,h2,h3,h4,.bar,.sumhead{break-after:avoid;page-break-after:avoid}' +
      '.sheet > h3 + p,.sheet > h3 + .method,.sheet > h3 + .hint,.sheet > .bar + p,.sheet > .bar + .method{break-after:avoid;page-break-after:avoid}' +
      '.sheet table.rank,.sheet table.grid{break-inside:auto!important;page-break-inside:auto!important}' +
      '.sheet table.rank tr,.sheet table.grid tr{break-inside:avoid;page-break-inside:avoid}' +
      '.sheet table.rank thead,.sheet table.grid thead{display:table-header-group}' +
      'p,li,.method,.cite{orphans:3;widows:3}' +
      '.sig,.sigcite,.signatures,.sigrow,.sign{break-inside:avoid;page-break-inside:avoid}}';
    document.head.appendChild(st);
  }
  /* the two choices are made once, in the workstation's Packet options (a form's own toolbar stays as it is, so no toolbar
     grows a row on an iPad); TD-1's own checkbox is the same guide choice */
  function prInject() {
    prStyle();
    var own = prOwn();
    if (own && !own.dataset.nbhAdopted) { own.dataset.nbhAdopted = '1'; var want = prGet(PRK.g); if (own.checked !== want) { own.checked = want; try { own.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
      own.addEventListener('change', function () { prSet(PRK.g, own.checked); prScreen(); }); }
    prScreen();
  }
  function prSetChoice(which, on) { var k = which === 'blank' ? PRK.b : PRK.g; prSet(k, !!on); var own = prOwn(); if (k === PRK.g && own && own.checked !== !!on) { own.checked = !!on; try { own.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} } prScreen(); }
  var prUndo = [];
  function prHasData(list) {
    for (var i = 0; i < list.length; i++) { var e = list[i];
      var f = e.querySelectorAll('input,select,textarea');
      for (var j = 0; j < f.length; j++) { var x = f[j]; if (x.closest && x.closest('.noprint')) continue;
        if (x.type === 'checkbox' || x.type === 'radio') { if (x.checked) return true; }
        else if (x.tagName === 'SELECT') { if (x.selectedIndex > 0 && String(x.value).trim()) return true; }
        else if (String(x.value || '').trim()) return true; }
      /* a results table the form rendered (no fields in it) with a number in a cell; a figure with its labels drawn */
      var tbs = e.tagName === 'TABLE' ? [e] : e.querySelectorAll('table');
      for (var k = 0; k < tbs.length; k++) { if (tbs[k].querySelector('input,select,textarea')) continue;
        var td = tbs[k].querySelectorAll('tbody td'); for (var t = 0; t < td.length; t++) if (/\d/.test(td[t].textContent || '')) return true; }
      if (e.querySelector('svg text,canvas')) return true; }
    return false;
  }
  /* the last blocks of a sheet stay together, up to about a third of a page, measured on a paper-wide layout; a long block
     above them stays breakable, and when it is a table its last rows join the chain */
  var PR_NEED = 340, PR_LONG = 560, PR_MAX = 560;   /* px on paper (a Letter page holds about 980): enough; too long to add whole; the most a chain may hold, so the page it leaves is never emptier than it fills */
  function prTails() {
    var TAIL = /\b(cite|method|foot|note|hint|sig|sigcite|src|cap)\b/, HIDE = /\bnoprint\b|\bnbh-pr-blank\b/;
    var sheets = document.querySelectorAll('.sheet,section[class*="only-"]'), html = document.documentElement, wraps = [];
    /* a form's own print modes (a packet, one sheet, one tab) arrange their own paper */
    if (/\bprint-|-only\b|-printing\b|\bsp-printall\b|\bprint\b/.test(document.body.className + ' ' + html.className)) return;
    html.classList.add('nbh-pr-measure');
    try {
      for (var i = 0; i < sheets.length; i++) { var sh = sheets[i];
        if (sh.classList.contains('nbh-pr-blank') || sh.closest('.nbh-pr-blank')) continue;
        if ((sh.id === 'guide' || sh.id === 'refs' || sh.classList.contains('only-guide')) && !prGuideOn()) continue;
        var kids = []; for (var c = sh.lastElementChild; c; c = c.previousElementSibling) { if (c.hidden || HIDE.test(c.className || '') || getComputedStyle(c).display === 'none') continue; kids.push(c); }
        if (!kids.length) continue; var last = kids[0];
        if (!(TAIL.test(last.className || '') || last.tagName === 'P' || last.tagName === 'SMALL')) continue;
        var acc = 0, chain = [];
        for (var k = 0; k < kids.length; k++) { var el = kids[k], h = el.getBoundingClientRect().height;
          if (chain.length && (h > PR_LONG || acc + h > PR_MAX)) break;   /* a long block above the tail stays breakable */
          chain.push(el); acc += h; if (acc >= PR_NEED) break; }
        if (!chain.length) continue;
        chain.reverse(); wraps.push(chain); }
    } finally { html.classList.remove('nbh-pr-measure'); }
    /* the chain goes into one inline block: the browser never splits an inline block, and it moves whole to the next page when
       it does not fit (a block wrapper marked break-inside: avoid was split anyway); the wrapper is undone after printing */
    for (var w = 0; w < wraps.length; w++) (function (list) {
      var box = document.createElement('div'); box.className = 'nbh-keep'; list[0].parentNode.insertBefore(box, list[0]);
      for (var i = 0; i < list.length; i++) box.appendChild(list[i]);
      prUndo.push(function () { if (!box.parentNode) return; while (box.firstChild) box.parentNode.insertBefore(box.firstChild, box); box.remove(); });
    })(wraps[w]);
  }
  function prBefore() {
    try {
      prScreen();
      var g = document.getElementById('guide'), r = document.getElementById('refs');
      if (prGuideOn() && g && g.classList.contains('sheet') && g.parentNode) {
        var par = g.parentNode, next = g.nextSibling, all = par.querySelectorAll(':scope > .sheet'), last = all[all.length - 1];
        var placed = last === g || (r && r.parentNode === par && r === last && g.nextElementSibling === r);
        if (last && !placed) { if (r && r.parentNode === par && r === last) par.insertBefore(g, r); else par.insertBefore(g, last.nextSibling); prUndo.push(function () { par.insertBefore(g, next); }); }
      }
      if (!prBlankOn()) {
        var groups = {}, els = document.querySelectorAll('[data-nbh-blank]');
        for (var i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-nbh-blank'); (groups[k] = groups[k] || []).push(els[i]); }
        for (var key in groups) if (!prHasData(groups[key])) (function (list) { list.forEach(function (e) { e.classList.add('nbh-pr-blank'); }); prUndo.push(function () { list.forEach(function (e) { e.classList.remove('nbh-pr-blank'); }); }); })(groups[key]);
      }
      prTails();
    } catch (e) {}
  }
  function prAfter() { while (prUndo.length) { try { prUndo.pop()(); } catch (e) {} } }
  /* registered once the form's own scripts have run, so the policy sees what they render for paper */
  function prArm() { window.addEventListener('beforeprint', prBefore); window.addEventListener('afterprint', prAfter); }
  if (document.readyState === 'complete') prArm(); else window.addEventListener('load', prArm);
  window.nbhPrint = { before: prBefore, after: prAfter, guideOn: prGuideOn, blankOn: prBlankOn, inject: prInject, set: prSetChoice };
  window.nbhPolish = { run: run, plain: plain, printHead: printHead, tscroll: tscroll, xscroll: xscroll, print: window.nbhPrint };
})();
