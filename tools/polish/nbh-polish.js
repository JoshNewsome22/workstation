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
    if (t && b && l && r && (seen('Top') || seen('Bottom') || seen('Left'))) kind = 'nbh-box';
    else if (b && !t && !l && !r && seen('Bottom')) kind = 'nbh-ul';
    else kind = 'nbh-bare';
    if (e.classList.contains(kind) && e.classList.contains('nbh-fld')) return;
    e.classList.remove('nbh-box', 'nbh-ul', 'nbh-bare');
    e.classList.add('nbh-fld', kind);
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
     that reads as a narrow column on a wide screen. On screen the cap is lifted
     to what the sheet allows (about 140 characters at most); paper keeps its own.
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
      if (!/px$/.test(mw)) continue;
      var px = parseFloat(mw);
      if (!(px >= 160 && px <= 1400)) continue;
      el.classList.add('nbh-wide');
    }
  }
  function run(root) { try { fields(root); zebra(root); prose(root); if (!root) sheets(); } catch (e) {} }
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
  window.nbhPolish = { run: run, plain: plain };
})();
