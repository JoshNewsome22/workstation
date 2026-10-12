
/* ===================== the form's own messages, touch targets and view progress (v21.34) =====================
   Until now every notice was the browser's alert() and every question its confirm(): unstyled, "this site
   says", and on an iPad a stop to the whole screen. This block gives each form:
     nbhUI.toast(text, {kind:'ok'|'warn'|'', ms})   a short message at the foot of the window
     nbhUI.alert(text)                              a toast for a short message, a styled notice for a long one
     nbhUI.confirm(text, {ok, cancel, danger})      a styled question; resolves true or false
   window.alert is routed through nbhUI.alert, so existing calls change on their own. window.confirm stays
   the browser's, because a synchronous answer cannot be styled; the forms' own code calls
   nbhUI.confirm instead (await it). A test that replaces window.confirm with its own function is
   honoured: nbhUI.confirm then returns that function's answer at once, so checks that auto-accept keep
   working. The block also marks each view button with a dot (empty, partly filled, filled) from the
   fields that view shows, and grows the small controls on a touch screen (the CSS above). */
(function(){
  var U = {}, nativeConfirm = window.confirm, nativeAlert = window.alert;
  function q(s){ return document.querySelector(s); }
  function host(){ var h = q('#nbhToasts'); if (!h) { h = document.createElement('div'); h.id = 'nbhToasts'; h.setAttribute('role', 'status'); h.setAttribute('aria-live', 'polite'); document.body.appendChild(h); } return h; }
  U.toast = function(text, opt){
    if (window.__nbhSilent) return null;   /* v21.36: the shell reads a CSV without the form's messages */
    opt = opt || {}; var h = host(), t = document.createElement('div');
    t.className = 'nbh-toast' + (opt.kind ? ' ' + opt.kind : '');
    var s = document.createElement('span'); s.textContent = String(text); t.appendChild(s);
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.innerHTML = '&times;'; t.appendChild(x);
    var gone = function(){ if (t.parentNode) t.parentNode.removeChild(t); };
    x.addEventListener('click', gone);
    h.appendChild(t);
    while (h.children.length > 3) h.removeChild(h.firstChild);
    setTimeout(gone, opt.ms || Math.min(12000, 3500 + String(text).length * 35));
    return t;
  };
  function dlg(){
    var d = q('#nbhUiDlg');
    if (d) return d;
    d = document.createElement('dialog'); d.id = 'nbhUiDlg'; d.className = 'noprint'; d.setAttribute('aria-labelledby', 'nbhUiH'); d.setAttribute('aria-describedby', 'nbhUiB');
    d.innerHTML = '<div class="u-h" id="nbhUiH"></div><div class="u-b" id="nbhUiB"></div><div class="u-f" id="nbhUiF"></div>';
    document.body.appendChild(d);
    return d;
  }
  function split(text){
    var s = String(text == null ? '' : text).trim(), i = s.indexOf('\n');
    var first = i >= 0 ? s.slice(0, i).trim() : s, rest = i >= 0 ? s.slice(i + 1).trim() : '';
    if (first.length > 120 && i < 0) { var j = first.indexOf('. '); if (j > 20 && j < 110) { rest = first.slice(j + 2); first = first.slice(0, j + 1); } }
    return { head: first, body: rest };
  }
  function ask(text, opt, question){
    opt = opt || {};
    return new Promise(function(res){
      var d = dlg(), p = split(text);
      q('#nbhUiH').textContent = p.head; q('#nbhUiB').textContent = p.body; q('#nbhUiB').style.display = p.body ? '' : 'none';
      var f = q('#nbhUiF'); f.innerHTML = '';
      var done = function(v){ try { d.close(); } catch (e) {} res(v); };
      if (question) { var c = document.createElement('button'); c.type = 'button'; c.textContent = opt.cancel || 'Cancel'; c.addEventListener('click', function(){ done(false); }); f.appendChild(c); }
      var ok = document.createElement('button'); ok.type = 'button'; ok.className = opt.danger ? 'danger' : 'primary'; ok.textContent = opt.ok || (question ? 'OK' : 'OK');
      ok.addEventListener('click', function(){ done(true); }); f.appendChild(ok);
      d.oncancel = function(ev){ ev.preventDefault(); done(false); };
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      ok.focus();
    });
  }
  U.alert = function(text){
    if (window.__nbhSilent) return Promise.resolve();
    var s = String(text == null ? '' : text);
    if (s.length <= 160 && s.indexOf('\n') < 0) { U.toast(s); return Promise.resolve(); }
    return ask(s, { ok: 'OK' }, false);
  };
  U.confirm = function(text, opt){
    if (window.confirm !== nativeConfirm) { var v; try { v = !!window.confirm(String(text)); } catch (e) { v = false; } return Promise.resolve(v); }
    return ask(text, opt || {}, true);
  };
  U.native = { alert: nativeAlert, confirm: nativeConfirm };
  window.alert = function(m){ U.alert(m); };

  /* ---- view progress ---- */
  var MAP = null, timer = null;
  function fields(root){
    var out = [], list = root.querySelectorAll('input,select,textarea');
    for (var i = 0; i < list.length; i++) { var e = list[i]; if (e.type === 'file' || e.type === 'hidden' || e.type === 'button' || e.type === 'submit' || e.closest('.toolbar,#nbhCaseDlg,#nbhUiDlg,.nbh-pagenav,.obr')) continue; out.push(e); }
    return out;
  }
  function vis(e){ return !!(e.offsetParent || (e.getClientRects && e.getClientRects().length)); }
  function buildMap(){
    var btns = Array.prototype.slice.call(document.querySelectorAll('#viewSeg button[data-view]'));
    if (!btns.length) return null;
    var m = {}, keys = btns.map(function(b){ return b.dataset.view; });
    var direct = keys.every(function(k){ return document.querySelector('section.only-' + k + ',#panel-' + k + ',[data-panel="' + k + '"]'); });
    if (direct) {
      keys.forEach(function(k){ var out = []; document.querySelectorAll('section.only-' + k + ',#panel-' + k + ',[data-panel="' + k + '"]').forEach(function(s){ out = out.concat(fields(s)); }); m[k] = out; });
      return m;
    }
    /* measure: each view's class on the body, in turn, and the fields it shows; fields shown by every view are shared and left out */
    var body = document.body, was = body.className, seen = {}, fx = U.fxHold ? U.fxHold() : null;   /* v21.91 Focus's folded parts are measured open */
    keys.forEach(function(k){
      var cls = was.split(/\s+/).filter(function(c){ return c && !/^view-/.test(c); }); cls.push('view-' + k); body.className = cls.join(' ');
      var out = fields(document).filter(vis);
      out.forEach(function(e){ seen[e.__nbhId || (e.__nbhId = Math.random().toString(36).slice(2))] = (seen[e.__nbhId] || 0) + 1; });
      m[k] = out;
    });
    body.className = was;
    if (fx) fx();
    keys.forEach(function(k){ m[k] = m[k].filter(function(e){ return seen[e.__nbhId] < keys.length; }); });
    return m;
  }
  function filled(e){ return (e.type === 'checkbox' || e.type === 'radio') ? e.checked : !!String(e.value || '').trim(); }
  U.progress = function(){
    /* (v21.43) a form that draws its rows again (the same number of fields, so the count below does not change) leaves
       the old ones out of the page: the map is made again, or the dots would count only what was not redrawn */
    if (MAP && Object.keys(MAP).some(function(k){ return MAP[k].some(function(e){ return !e.isConnected; }); })) MAP = null;
    if (!MAP) MAP = buildMap();
    if (!MAP) return null;
    var out = {}, own = typeof window.__nbhViewFill === 'function' ? window.__nbhViewFill : null;
    Object.keys(MAP).forEach(function(k){
      var list = MAP[k].filter(function(e){ return e.isConnected; }), n = 0;
      list.forEach(function(e){ if (filled(e)) n++; });
      /* a form can count a view itself (Form TK-1: a card with a picture is filled; its label is optional) */
      var o = null; if (own) { try { o = own(k); } catch (e) { o = null; } }
      if (o && typeof o.total === 'number' && typeof o.filled === 'number') { n = o.filled; list = { length: o.total }; }
      out[k] = { filled: n, total: list.length };
      var b = document.querySelector('#viewSeg button[data-view="' + k + '"]');
      if (b) {
        var st = !list.length ? 'none' : n === 0 ? 'empty' : n >= Math.max(1, Math.round(list.length * 0.8)) ? 'done' : 'part';
        if (b.dataset.nbhFill !== st) b.dataset.nbhFill = st;
        var tip = list.length ? n + ' of ' + list.length + ' fields filled' : '';
        if (b.title !== tip) b.title = tip;
      }
    });
    return out;
  };
  U.remap = function(){ MAP = null; U.progress(); };
  function soon(ms){ clearTimeout(timer); timer = setTimeout(function(){ try { U.progress(); } catch (e) {} }, ms || 400); }
  document.addEventListener('input', function(){ soon(500); }, true);
  document.addEventListener('change', function(){ soon(300); }, true);
  var remapTimer = null, lastCount = -1;
  function maybeRemap(){
    clearTimeout(remapTimer);
    remapTimer = setTimeout(function(){ var n = document.querySelectorAll('input,select,textarea').length; if (n !== lastCount) { lastCount = n; MAP = null; } try { U.progress(); } catch (e) {} }, 900);
  }
  try { new MutationObserver(maybeRemap).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  window.addEventListener('load', function(){ setTimeout(function(){ try { lastCount = document.querySelectorAll('input,select,textarea').length; U.progress(); } catch (e) {} }, 400); });
  /* v21.78 on a touch screen a table cell holding one checkbox or radio (and nothing else to press) is its target: a tap
     anywhere in the cell ticks it, as if the box were the size of the cell */
  try { if (window.matchMedia && matchMedia('(pointer:coarse)').matches) document.addEventListener('click', function(e){
    var t = e.target; if (!t || !t.closest || t.closest('input,label,button,select,textarea,a,summary')) return;
    var td = t.closest('td,th'); if (!td) return; var c = td.querySelectorAll('input,select,textarea,button,a');
    if (c.length !== 1) return; var i = c[0]; if ((i.type !== 'checkbox' && i.type !== 'radio') || i.disabled) return; i.click();
  }, false); } catch (e) {}
  /* v21.81 iPad in portrait: mark the elements whose own words the form sets under 12 px (not drawings, not fields, not a
     size a script set on the element, not the walkthrough's drawn stage) so the screen-only rule above shows them at
     13 px. A marked parent can bring an em-sized child up, so it looks again (three rounds at most); rows the form draws
     later are looked at when added. All the sizes are read before any mark is written, to keep it quick. A data
     attribute, so a form setting className keeps the mark. */
  try { if (window.matchMedia) (function(){
    var mq = matchMedia('screen and (max-width:834px)'), HTML = 'http://www.w3.org/1999/xhtml', SKIP = /^(SCRIPT|STYLE|INPUT|SELECT|TEXTAREA|OPTION|TEMPLATE|NOSCRIPT)$/, STAGE = '#wkStage,.wk-stage', pend = [], timer = 0;
    function words(e){ for (var n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true; return false; }
    function scan(roots){
      if (!mq.matches) return;
      for (var round = 0; round < 3; round++) {
        var pick = [];
        roots.forEach(function(r){
          if (!r || r.nodeType !== 1 || !r.isConnected) return;
          var list = [r].concat(Array.prototype.slice.call(r.getElementsByTagName('*')));
          for (var i = 0; i < list.length; i++) { var e = list[i];
            if (e.namespaceURI !== HTML || SKIP.test(e.tagName) || e.hasAttribute('data-nbh-fs') || (e.style && e.style.fontSize) || !words(e)) continue;
            var fs = parseFloat(getComputedStyle(e).fontSize); if (fs > 0 && fs < 11.95 && !e.closest(STAGE)) pick.push(e); }
        });
        if (!pick.length) break;
        pick.forEach(function(e){ e.setAttribute('data-nbh-fs', ''); });
      }
    }
    function all(){ if (document.body) scan([document.body]); }
    function later(){ timer = 0; var r = pend; pend = []; try { var set = new Set(r); scan(r.filter(function(n){ for (var p = n.parentNode; p; p = p.parentNode) if (set.has(p)) return false; return true; })); } catch (e) {} }
    try { new MutationObserver(function(recs){
      if (!mq.matches) return;
      recs.forEach(function(m){ for (var i = 0; i < m.addedNodes.length; i++) if (m.addedNodes[i].nodeType === 1) pend.push(m.addedNodes[i]); });
      if (pend.length && !timer) timer = setTimeout(later, 500);
    }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    if (mq.addEventListener) mq.addEventListener('change', all); else if (mq.addListener) mq.addListener(all);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
    window.addEventListener('load', function(){ setTimeout(all, 300); });
  })(); } catch (e) {}
  /* v21.83 the pinned toolbar folds on an iPad. On a touch screen, or in a window 1194 px wide or less, a swipe down the form
     (more than 40 px) folds the toolbar to its view buttons on one line plus a "Tools" button (the CSS above, html.nbh-fold);
     a swipe up, the top of the form, a tap on the strip or on Tools unfold it. A tap in a text field, text area or list on a
     touch screen folds it while the keyboard is up, and leaving the field unfolds it. Only a person's own swipe, wheel or
     key scroll folds it, and only a tap focuses into the fold (a script's scroll or focus does not), so nothing a script
     clicks in the toolbar is ever hidden from it. The height the bar gives up is added below it, so the page does not
     move; a fold waits until the form is far enough down for that space to be out of sight (a field tapped near the top
     folds the bar once the page has come up under it, as the keyboard opens or the user scrolls). Another pinned bar
     sitting under the toolbar (MT-1's timer) moves up with it. Printing unfolds it; the fold rules are screen only. On a
     desktop with a mouse in a window wider than 1194 px (the workstation's window, whatever the form's frame) it never folds. */
  try { if (window.matchMedia) (function(){
    var R = document.documentElement, mq = matchMedia('(pointer:coarse), (max-width:1194px)'), touch = matchMedia('(pointer:coarse)');
    var FIELD = 'textarea,select,input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=range]):not([type=color]):not([type=file]):not([type=hidden]):not([type=image]),[contenteditable=""],[contenteditable="true"]';
    var tb = null, seg = null, btn = null, st = 0, T = 0, D = 0, S = 0, need = 0, lastY = 0, acc = 0, gest = 0, tapT = 0, pend = 0, raf = 0, ut = 0, W = window.innerWidth, moved = [];
    /* the window's width, not the form's frame: a form in the workstation on a wide desktop sits in a narrower frame */
    function wide(){ var w = window.innerWidth; try { if (window.top !== window) w = Math.max(w, window.top.innerWidth || 0); } catch (e) { w = Math.max(w, window.outerWidth || 0); } return w; }
    function on(){ return !window.__nbhNoFold && (touch.matches || (mq.matches && wide() <= 1194)); }
    function field(e){ return !!(e && e.nodeType === 1 && e.matches && e.matches(FIELD) && !e.closest('.toolbar') && !e.disabled && !e.readOnly); }
    function find(){
      if (tb && tb.isConnected && seg && seg.isConnected && btn && btn.isConnected) return tb;
      tb = null; seg = document.getElementById('viewSeg') || document.querySelector('.toolbar [role="tablist"],.nbh-toolbar [role="tablist"]');
      var t = seg && seg.closest('.toolbar'); if (!t) return null;
      btn = document.getElementById('nbhFoldBtn');
      if (!btn) {
        btn = document.createElement('button'); btn.type = 'button'; btn.id = 'nbhFoldBtn'; btn.className = 'noprint'; btn.textContent = 'Tools';
        btn.title = 'Show the whole toolbar'; btn.setAttribute('aria-expanded', 'true');
        btn.addEventListener('click', function(ev){ ev.stopPropagation(); open(true); });
        t.addEventListener('click', function(ev){ if (st && !ev.target.closest('button,a,input,select,textarea,label,[role="tab"]')) open(true); });
      }
      if (btn.parentNode !== t) t.appendChild(btn);
      return tb = t;
    }
    function mark(){ seg.classList.add('nbh-fseg'); for (var e = seg.parentElement; e && e !== tb; e = e.parentElement) e.classList.add('nbh-fk'); }
    function nextIn(t){ for (var e = t.nextElementSibling; e; e = e.nextElementSibling) { var c = getComputedStyle(e); if (c.display !== 'none' && (c.position === 'static' || c.position === 'relative')) return e; } return null; }
    function under(t, full){
      /* other pinned bars whose top is the toolbar's full height */
      var out = [], all = document.body.getElementsByTagName('*');
      for (var i = 0; i < all.length; i++) { var e = all[i]; if (e === t || t.contains(e)) continue; var c = getComputedStyle(e);
        if (c.position === 'sticky' && Math.abs(parseFloat(c.top) - full) <= 2) out.push(e); }
      return out;
    }
    function fold(why){
      var t = find(); if (!t || st || !on()) return false;
      var cs = getComputedStyle(t), pos = cs.position; if (pos !== 'sticky' && pos !== 'fixed') return false;
      var y = window.scrollY || 0, full = t.offsetHeight, mb0 = parseFloat(cs.marginBottom) || 0;
      S = parseFloat(cs.top) || 0;
      if (pos === 'sticky') { var sp = t.style.position; t.style.position = 'relative'; T = t.getBoundingClientRect().top + y; t.style.position = sp; }
      /* a page too short to scroll the bar's spare height out of sight: a field tapped there folds the bar at once and the
         page comes up to the strip (more of the form above the keyboard); elsewhere a fold waits until it is out of sight */
      var my = Math.max(0, (document.scrollingElement || R).scrollHeight - window.innerHeight), shortP = why === 'focus' && pos === 'sticky' && need && my + S < T + need;
      if (pos === 'sticky' && need && y + S < T + need && !shortP) { if (why === 'focus') pend = 1; return false; }
      var nx = pos === 'sticky' ? nextIn(t) : null, n0 = nx ? nx.getBoundingClientRect().top + y : 0, bars = pos === 'sticky' ? under(t, full) : [];
      mark(); R.classList.add('nbh-fold');
      var h = t.offsetHeight; D = full - h; need = D;
      shortP = why === 'focus' && pos === 'sticky' && my + S < T + D;
      if (D < 8 || (pos === 'sticky' && y + S < T + D && !shortP)) { R.classList.remove('nbh-fold'); if (why === 'focus' && D >= 8) pend = 1; return false; }
      if (pos === 'sticky') {
        /* the space given up stays below the bar (out of sight above the screen), so the page under the finger stays put;
           measured on the page, not the screen (Safari does not hold the scroll still when the page above it changes),
           and corrected for a margin the next block shared with the bar */
        var keep = shortP ? Math.max(0, Math.min(D, y + S - T)) : D, want = n0 - (D - keep), g = mb0 + keep;
        R.style.setProperty('--nbh-fold-gap', g + 'px');
        for (var i = 0; nx && i < 2; i++) { var d = nx.getBoundingClientRect().top + (window.scrollY || 0) - want; if (Math.abs(d) < 0.5) break; g = Math.max(0, g - d); R.style.setProperty('--nbh-fold-gap', g + 'px'); }
      }
      moved = bars.map(function(e){ var w = e.style.getPropertyValue('top'), p = e.style.getPropertyPriority('top'); e.style.setProperty('top', (S + h) + 'px', 'important'); return [e, w, p]; });
      R.style.setProperty('--nbh-fold-d', D + 'px');
      st = why === 'focus' ? 2 : 1; acc = 0; pend = 0; btn.setAttribute('aria-expanded', 'false');
      /* the view that is open stays in sight on the strip */
      var a = seg.querySelector('[aria-pressed="true"],[aria-selected="true"],.active,.on');
      if (a && seg.scrollWidth > seg.clientWidth) seg.scrollLeft = Math.max(0, a.offsetLeft - seg.offsetLeft - (seg.clientWidth - a.offsetWidth) / 2);
      return true;
    }
    function open(manual){
      if (!st) return; st = 0; acc = 0;
      R.classList.remove('nbh-fold'); R.style.removeProperty('--nbh-fold-gap');
      moved.forEach(function(m){ if (m[1]) m[0].style.setProperty('top', m[1], m[2]); else m[0].style.removeProperty('top'); }); moved = [];
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (tb && tb.isConnected) { R.classList.remove('nbh-unfolding'); void tb.offsetWidth; R.classList.add('nbh-unfolding'); clearTimeout(ut); ut = setTimeout(function(){ R.classList.remove('nbh-unfolding'); }, 260); }
      if (manual && tb) { var f = tb.querySelector('button:not(#nbhFoldBtn):not([disabled])'); if (manual === true && btn === document.activeElement && f) try { f.focus({ preventScroll: true }); } catch (e) {} }
    }
    function tick(){
      raf = 0; var y = window.scrollY || 0, dy = y - lastY; lastY = y;
      if (!on()) { if (st) open(); return; }
      if (st === 2) return;
      if (pend) { if (field(document.activeElement) && touch.matches) { if (y + S >= T + need) fold('focus'); } else pend = 0; return; }
      if (st === 1) {
        if (y + S < T + D + 1) { open(); return; }
        acc = dy < 0 ? Math.min(acc, 0) + dy : 0;
        if (acc < -30) open();
        return;
      }
      acc = dy > 0 ? Math.max(acc, 0) + dy : 0;
      if (acc > 40 && Date.now() - gest < 1500) fold('scroll');
    }
    window.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    var now = function(){ gest = Date.now(); };
    document.addEventListener('touchstart', function(){ tapT = gest = Date.now(); }, { passive: true, capture: true });
    document.addEventListener('touchmove', now, { passive: true, capture: true });
    document.addEventListener('wheel', now, { passive: true, capture: true });
    document.addEventListener('keydown', function(e){ if (/^(PageDown|PageUp|ArrowDown|ArrowUp|End|Home| )$/.test(e.key) && !field(e.target)) now(); }, { passive: true, capture: true });
    document.addEventListener('focusin', function(e){
      if (!touch.matches || !on() || !field(e.target) || Date.now() - tapT > 1200) return;
      if (st === 1) st = 2; else if (!st) fold('focus');
    }, true);
    document.addEventListener('focusout', function(){ setTimeout(function(){ if (!field(document.activeElement)) { pend = 0; if (st === 2) open(); } }, 80); }, true);
    window.addEventListener('resize', function(){ if (window.innerWidth !== W) { W = window.innerWidth; need = 0; open(); } }, { passive: true });
    window.addEventListener('beforeprint', function(){ open(); });
    var ch = function(){ need = 0; if (!on()) open(); };
    if (mq.addEventListener) mq.addEventListener('change', ch); else if (mq.addListener) mq.addListener(ch);
    U.fold = function(on){ return on === false ? (open(), false) : on === true ? fold('focus') : st; };
  })(); } catch (e) {}
  window.nbhUI = U;
})();

/* ===================== v21.91 focus mode: one part of a form at a time =====================
   Asked for by the BCBA: one part of a form shown large so she can give it her whole attention; once it is filled in it
   gets smaller and the next part opens. A switch turns it on for every form on this device (localStorage nbh.focus =
   "on"): the workstation's Focus button (it tells each open form by message, and a form opened later reads the setting),
   or, on a form opened on its own, the Focus button this block puts in the form's toolbar.
   The view on screen is cut into parts: a heading (h1 to h3, an .nbh-band, a card's header) and what follows it up to the
   next heading, a box with headings inside cut the same way (a per-form table below where a form needs it). The open part
   is a size larger and ringed and is brought to the top; the parts before it fold to one line (their title, a tick when
   anything is entered, the first values entered), the parts after it to their title. A part with nothing to fill in (a
   guide, a note, the evidence) folds to its title and Next steps over it. A bar at the foot steps Back and Next (at the end
   of a page, on to the next page); a tap on a folded part opens it; Enter in a one-line field goes to the next field, and
   from the last one to the next part. Tables, grids, data sheets and drawings stay whole inside their part.
   Nothing in the page is moved or wrapped: the parts are marked with data-nbh-fx* attributes and folded by screen-only CSS,
   so the form's own code, its :first-child rules and everything that reads its fields see the page as it was; the bar and
   the ring are the only elements added, outside the sheet and marked noprint, with the rules in a style block the master
   print leaves out (data-nbh-screen). Paper never sees any of it: the rules are for the screen and step
   aside while a print or the master print lays the form out (html.nbh-plain, or a print), and any copy of the page (the
   master print's) is made without the marks. Turning it off takes every mark away. */
(function(){
  var U = window.nbhUI || (window.nbhUI = {}), D = document, R = D.documentElement, W = window, KEY = 'nbh.focus';
  var framed = false; try { framed = W.top !== W.self; } catch (e) { framed = true; }
  var ON = false, units = [], cur = -1, vk = null, memo = {}, pend = '', marked = [], boxes = [], held = 0, printing = false;
  var bar = null, ring = null, css = null, tbtn = null, mo = null, tick = 0, slow = 0, sumT = 0, rq = 0, lastW = 0, lastBox = '', nowF = 0, hadStyle = false, builds = 0;
  var SKIP = '.toolbar,.nbh-mast,dialog,#nbhToasts,.nbh-pagenav,nav.nbh-tabs,#nbhFxBar,#nbhFxRing,#nbhFoldBtn,script,style,template,link,noscript';
  /* never cut inside: tables, drawings, lists, a walkthrough player (its slides carry headings of their own) */
  var WHOLE = 'table,svg,canvas,details,video,audio,iframe,img,picture,figure,ul,ol,dl,select,textarea,input,button,[data-nbh-fx-whole],.wk-player,.wk-stage,.wk-frame,[class*="player"],[class*="stage"]';
  var FLD = 'input,select,textarea', HT = /^H[1-3]$/, HSEL = 'h1,h2,h3,.nbh-band';
  var LINE = /^(text|search|email|tel|url|number|date|time|month|week|datetime-local|password|)$/i;
  var ATTRS = ['data-nbh-fx', 'data-nbh-fx-u', 'data-nbh-fx-sum', 'data-nbh-fx-done', 'data-nbh-fx-nf', 'data-nbh-fx-z'];
  /* forms whose page is better read whole, or whose headings say more than the rule above can see
     one: a box whose children make one part (nothing in it folds, and it keeps its own size); head: more headings; nohead:
     headings that start no part;
     pin: elements that stay in sight and belong to no part */
  var OVR = {
    'SP-1': { one: '#sheet' }
  };
  function fid(){ try { if (W.nbhBridge && W.nbhBridge.formId) return String(W.nbhBridge.formId()); } catch (e) {} var e = D.querySelector('.nbh-formid'); return e ? e.textContent.replace(/^Form\s*/i, '').trim() : ''; }
  function ovr(){ return OVR[fid()] || {}; }
  function vis(e){ return !!(e.getClientRects && e.getClientRects().length); }
  function txt(e){ return String(e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function is(e, s){ try { return !!(s && e.matches(s)); } catch (x) { return false; } }
  function store(v){ try { if (v === undefined) return W.localStorage.getItem(KEY) === 'on'; if (v) W.localStorage.setItem(KEY, 'on'); else W.localStorage.removeItem(KEY); } catch (e) {} return !!v; }

  /* ---- the folds step aside: while the page is measured, printed or copied (the scroll stays where it was) ---- */
  var hx = 0, hy = 0, hon = false;
  function hold(){ if (held++) return; hon = R.hasAttribute('data-nbh-fx'); if (hon) { hx = W.scrollX; hy = W.scrollY; R.removeAttribute('data-nbh-fx'); } }
  function release(){
    if (!held || --held) return;
    if (hon && ON) { R.setAttribute('data-nbh-fx', 'on'); if (Math.abs(W.scrollY - hy) > 0.5 || Math.abs(W.scrollX - hx) > 0.5) W.scrollTo(hx, hy); }
    hon = false;
  }
  /* the folds come down while something outside this block measures the page (nbh-ui's view progress); call what it returns to put them back */
  U.fxHold = function(){ if (!ON) return null; hold(); var done = false; return function(){ if (!done) { done = true; release(); } }; };

  /* ---- the parts of the view on screen ---- */
  function headish(e, o){
    if (is(e, o.nohead)) return false;
    if (HT.test(e.tagName) || e.classList.contains('nbh-band') || is(e, o.head)) return true;
    if (is(e, WHOLE) || e.querySelector('input,select,textarea,table,canvas,svg,img,video,iframe')) return false;
    var t = shortText(e, 140); if (!t) return false;
    var f = e.firstElementChild;
    if (f && (HT.test(f.tagName) || f.classList.contains('nbh-band'))) return true;
    return /(^|[\s_-])(chd|hd|hdr|head|header|heading|title|ttl)(?=$|[\s_-])/i.test(e.getAttribute('class') || '');
  }
  /* an element's words when there are few of them (a title), or '' (read no further than that: a long guide is not a title) */
  function shortText(e, max){
    var w = D.createTreeWalker(e, 4), n, t = '';
    while ((n = w.nextNode())) { t += n.nodeValue; if (t.length > max * 3 && t.replace(/\s+/g, ' ').trim().length > max) return ''; }
    t = t.replace(/\s+/g, ' ').trim(); return t.length > max ? '' : t;
  }
  function inWhole(x, top){ for (var p = x.parentElement; p && p !== top; p = p.parentElement) if (is(p, WHOLE)) return true; return false; }
  function hasHeads(e, o){
    var l = e.querySelectorAll(HSEL + (o.head ? ',' + o.head : ''));
    for (var i = 0; i < l.length; i++) if (!is(l[i], o.nohead) && !l[i].closest(SKIP) && vis(l[i]) && !inWhole(l[i], e)) return true;
    for (var c = e.firstElementChild; c; c = c.nextElementSibling) if (!is(c, SKIP) && vis(c) && headish(c, o)) return true;
    return false;
  }
  function kids(box, out){
    for (var c = box.firstElementChild; c; c = c.nextElementSibling) {
      if (is(c, SKIP)) continue;
      if (!vis(c)) { if (getComputedStyle(c).display === 'contents') kids(c, out); continue; }
      out.push(c);
    }
    return out;
  }
  function part(box, o, out){
    var run = null, flush = function(){ if (run) { out.push(run); run = null; } };
    if (boxes.indexOf(box) < 0) boxes.push(box);
    if (is(box, o.one)) { var all = kids(box, []); if (all.length) { var h = all.filter(function(k){ return headish(k, o); })[0] || null; out.push({ head: h, els: all, whole: true }); } return; }
    kids(box, []).forEach(function(k){
      var p = getComputedStyle(k).position;
      if (p === 'fixed' || p === 'sticky' || is(k, o.pin)) return;   /* pinned: it stays in sight */
      if (headish(k, o)) { flush(); run = { head: k, els: [k] }; return; }
      if (!is(k, WHOLE) && hasHeads(k, o)) { flush(); part(k, o, out); return; }
      if (!run) run = { head: null, els: [] };
      run.els.push(k);
    });
    flush();
  }
  function roots(){
    var o = ovr(), l = [].slice.call(D.querySelectorAll(o.roots || 'main.sheet,.sheet:not(table),main')).filter(function(e){ return !e.closest(SKIP) && vis(e); });
    l = l.filter(function(e){ return !l.some(function(x){ return x !== e && x.contains(e); }); });
    /* a block of its own beside the sheets that holds fields (Form OB-1's live recorder) is a root too */
    if (D.body && !o.roots) for (var c = D.body.firstElementChild; c; c = c.nextElementSibling) {
      if (is(c, SKIP) || l.some(function(x){ return x === c || x.contains(c) || c.contains(x); }) || !vis(c)) continue;
      var p = getComputedStyle(c).position; if (p === 'fixed' || p === 'sticky' || p === 'absolute') continue;
      if (fieldsOf([c]).some(live)) l.push(c);
    }
    l.sort(function(a, b){ return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    return l.length ? l : (D.body ? [D.body] : []);
  }

  function isField(e){ return /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) && !/^(hidden|file|button|submit|reset|image)$/i.test(e.type || ''); }
  function live(f){ return !f.disabled && !f.readOnly && vis(f) && !f.closest('.toolbar,dialog'); }
  function fieldsOf(els){ var out = []; els.forEach(function(e){ if (isField(e)) out.push(e); else { var l = e.querySelectorAll(FLD); for (var i = 0; i < l.length; i++) if (isField(l[i])) out.push(l[i]); } }); return out; }
  function viewBtns(){ return [].slice.call(D.querySelectorAll('#viewSeg button[data-view]')).filter(function(b){ return !b.disabled && !b.hidden && vis(b); }); }
  function pressed(){ var b = D.querySelector('#viewSeg button[aria-pressed="true"],#viewSeg button[aria-selected="true"]'); return b; }
  function label(b){ var t = ''; if (!b) return ''; for (var n = b.firstChild; n; n = n.nextSibling) { var s = n.textContent || ''; if (n.nodeType === 1 && /^\s*\d+\s*$/.test(s)) continue; t += s; } return t.replace(/\s+/g, ' ').trim(); }
  /* an element's words, spaced (the parts of a title, the cell beside a tick box); seen: only what is on screen (a title is
     read while the page is open; a folded part's words are read whatever shows) */
  function words(e, seen){
    var out = [];
    (function walk(n){ for (var c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { var t = c.nodeValue.replace(/\s+/g, ' ').trim(); if (t) out.push(t); }
      else if (c.nodeType === 1 && !/^(BUTTON|SCRIPT|STYLE|SELECT|TEXTAREA|INPUT|OPTION|svg)$/i.test(c.tagName) && (!seen || c.getClientRects().length)) walk(c);
    } })(e);
    return out.join(' ').replace(/\s+([,.;:])/g, '$1');
  }
  function titleOf(u){
    var h = u.head, t = '';
    if (h) { var inner = HT.test(h.tagName) ? null : h.querySelector('h1,h2,h3,h4,.chdt,[class*="title"],[class*="ttl"]'); t = words(inner && vis(inner) ? inner : h, true); }
    t = t || label(pressed()) || 'This page';
    return t.length > 90 ? t.slice(0, 88).replace(/\s+\S*$/, '') + '\u2026' : t;
  }
  function cut(){
    var o = ovr(), runs = [], out = [], i;
    boxes = [];
    roots().forEach(function(r){ part(r, o, runs); });
    for (i = 0; i < runs.length; i++) {
      var r = runs[i], n = runs[i + 1], content = r.els.filter(function(e){ return e !== r.head && (r.sup || []).indexOf(e) < 0; });
      /* a heading with nothing under it is the title over the part that follows (a band over its first sub-part) */
      if (r.head && !content.length && n) { n.sup = (r.sup || []).concat([r.head], n.sup || []); n.els = r.els.concat(n.els); continue; }
      /* words or fields before the first heading of a box belong to the part that follows; after the last, to the one before */
      if (!r.head && n) { n.els = r.els.concat(n.els); continue; }
      if (!r.head && out.length) { out[out.length - 1].els = out[out.length - 1].els.concat(r.els); continue; }
      out.push(r);
    }
    out.forEach(function(u){ u.fields = fieldsOf(u.els); u.n0 = u.fields.length; u.live = u.fields.filter(live).length; u.nf = !u.live; u.title = titleOf(u); u.sup = u.sup || []; });
    return out;
  }

  /* ---- what a folded part says: the first values entered ---- */
  /* a tick box's words: in a table, the first other cell of its row (Record review); else its label, its accessible name */
  function lab(f){
    var t = '', i, tr = f.closest('tr'), l;
    if (tr) for (i = 0; i < tr.cells.length; i++) if (!tr.cells[i].contains(f)) { t = words(tr.cells[i]); if (t) break; }
    if (!t) { l = f.closest('label') || (f.id && D.querySelector('label[for="' + (W.CSS && CSS.escape ? CSS.escape(f.id) : f.id) + '"]')); if (l) t = words(l); }
    if (!t) t = f.getAttribute('aria-label') || '';
    if (!t && f.nextSibling && f.nextSibling.nodeType === 3) t = f.nextSibling.nodeValue;
    return String(t || '').replace(/\s+/g, ' ').trim();
  }
  function shown(f){
    if (f.type === 'checkbox' || f.type === 'radio') return f.checked ? (lab(f) || '\u2713') : '';
    /* whatever is in it: a form that draws its rows again writes their values into the page, so "as first drawn" says nothing */
    if (f.tagName === 'SELECT') return f.value && f.selectedIndex >= 0 ? txt(f.options[f.selectedIndex]) : '';
    var v = String(f.value || '').trim(); if (!v) return '';
    var m = f.type === 'date' && /^(\d{4})-(\d\d)-(\d\d)$/.exec(v); if (m) return (+m[2]) + '/' + (+m[3]) + '/' + m[1];
    return v.replace(/\s+/g, ' ');
  }
  /* a part's fields, read again when the form has drawn some of them anew (the boxes are the form's, not this block's) */
  function flds(u){ if (u.fields.some(function(f){ return !f.isConnected; })) u.fields = fieldsOf(u.els); return u.fields; }
  function sumOf(u){
    var vals = [], n = 0;
    flds(u).forEach(function(f){ var v = shown(f); if (!v) return; n++; if (vals.length < 4) vals.push(v.length > 42 ? v.slice(0, 40).replace(/\s+\S*$/, '') + '\u2026' : v); });
    return { n: n, text: vals.join(' \u00b7 ') + (n > vals.length ? ' \u00b7 \u2026' : '') };
  }

  /* ---- marks ---- */
  function set(e, a, v){ if (v === null || v === undefined || v === false) { if (e.hasAttribute(a)) e.removeAttribute(a); } else if (e.getAttribute(a) !== String(v)) e.setAttribute(a, String(v)); }
  function unmark(e){ ATTRS.forEach(function(a){ if (e.hasAttribute(a)) e.removeAttribute(a); }); }
  function paintSums(){
    /* every line worked out first, then written, so the page is laid out once, not once a part */
    var all = units.map(function(u){ return u.head ? sumOf(u) : null; });
    units.forEach(function(u, i){
      var s = all[i], fold = i !== cur; if (!s) return;
      set(u.head, 'data-nbh-fx-done', fold && s.n ? '1' : null);
      set(u.head, 'data-nbh-fx-sum', fold && i < cur && s.text ? s.text : null);
      set(u.head, 'data-nbh-fx-nf', u.nf ? '1' : null);
    });
  }
  function apply(){
    var now = [];
    units.forEach(function(u, i){
      var st = i === cur ? 'c' : 'f';
      u.els.forEach(function(e){
        set(e, 'data-nbh-fx', e === u.head ? 'h' + st : u.sup.indexOf(e) >= 0 ? 's' : st);
        set(e, 'data-nbh-fx-u', i); now.push(e);
      });
    });
    marked.forEach(function(e){ if (now.indexOf(e) < 0) unmark(e); });
    marked = now;
    paintSums(); zoomCheck(); paintBar(); place();
    grow();
  }
  /* the open part a size larger, unless that would push the page wider than the window (a wide grid stays its size) */
  function zoomCheck(){
    var u = units[cur]; if (!u) return;
    u.els.forEach(function(e){ set(e, 'data-nbh-fx-z', u.whole || wide(e) ? '0' : null); });   /* a page kept whole keeps its size */
    var vw = R.clientWidth, over = function(){ return R.scrollWidth > vw + 1; };
    if (!over()) return;
    u.els.forEach(function(e){ var r = e.getBoundingClientRect(); if (r.right > vw + 1 || e.scrollWidth > e.clientWidth + 1) set(e, 'data-nbh-fx-z', '0'); });
    if (over()) u.els.forEach(function(e){ set(e, 'data-nbh-fx-z', '0'); });
  }
  /* kept at its own size: a table six or more columns wide, and a player, a drawing surface or a video, which size themselves
     to the room they have (a walkthrough player scaled with its part measured itself again and again) */
  var KEEP = 'canvas,video,iframe,.wk-player,.wk-stage,.wk-frame,[class*="player"],[class*="stage"]';
  function wide(e){ var l = e.tagName === 'TABLE' ? [e] : [].slice.call(e.querySelectorAll('table')); return l.some(function(t){ return t.rows && t.rows[0] && t.rows[0].cells.length >= 6; }) || is(e, KEEP) || !!e.querySelector(KEEP); }
  function grow(){ clearTimeout(grow.t); grow.t = setTimeout(function(){ try { if (W.nbhFieldCare && W.nbhFieldCare.grow) W.nbhFieldCare.grow(); } catch (e) {} place(); }, 30); }

  /* ---- build: the parts again, the open one kept by its heading ---- */
  /* the view on screen: the form's view class on the body and its pressed view button (other classes the body takes do not count) */
  function viewKey(){ var b = pressed(), c = D.body ? (D.body.className.match(/(^|\s)view-\S+/g) || []).join('') : ''; return c + '|' + (b ? b.getAttribute('data-view') || label(b) : ''); }
  function build(how){
    if (!ON || !D.body || printing) return;
    builds++;
    var was = units[cur], wasHead = was ? (was.head || was.els[0]) : null, key = viewKey(), changed = key !== vk;
    if (changed && vk !== null && was) memo[vk] = wasHead;
    hold();
    try {
      units = cut();
      if (how === 'here') {
        var tb = tbBottom();
        var sq = seq();
        for (var i = 0; i < sq.length; i++) { var r = box(units[sq[i]]); if (r && r.bottom > tb + 40) { pend = sq[i]; break; } }
      }
    } finally { release(); }
    vk = key;
    var at = -1, want = changed ? memo[key] : wasHead, p = pend;
    if (typeof p === 'number') at = p;
    else if (p === 'first' || p === 'last') at = changed ? pick() : -1;
    if (at < 0 && want) units.forEach(function(u, i){ if (at < 0 && (u.head === want || u.els.indexOf(want) >= 0)) at = i; });
    if (at < 0 && !changed && was && cur < units.length) at = cur;
    if (at < 0) at = pick();
    if (typeof p === 'number' || changed) pend = '';
    cur = Math.min(at, units.length - 1);
    apply();
    if ((changed && (p === 'first' || p === 'last')) || how === 'here') bring(false);
  }
  /* the parts Next steps through: those with something to fill in; on a page that is nearly all reading (a guide, a
     walkthrough with one box in it, fewer than three fields in all), every part */
  function seq(){
    var o = [], n = 0; units.forEach(function(u, i){ n += u.live; if (!u.nf) o.push(i); });
    return n < 3 ? units.map(function(u, i){ return i; }) : o;
  }
  function pick(){
    var f = seq(); if (!units.length) return -1; if (!f.length) return 0;
    return pend === 'last' ? f[f.length - 1] : f[0];
  }


  /* ---- where things are: the toolbar pinned at the top, the open part, the ring around it ---- */
  function tbBottom(){ var t = D.querySelector('.toolbar'); if (!t) return 0; var c = getComputedStyle(t); if (c.position !== 'sticky' && c.position !== 'fixed') return 0; var r = t.getBoundingClientRect(); return Math.max(0, r.bottom); }
  function box(u){
    var t = Infinity, b = -Infinity, l = Infinity, r = -Infinity;
    u.els.forEach(function(e){ if (!vis(e)) return; var q = e.getBoundingClientRect(); if (!q.width && !q.height) return; t = Math.min(t, q.top); b = Math.max(b, q.bottom); l = Math.min(l, q.left); r = Math.max(r, q.right); });
    return t === Infinity ? null : { top: t, bottom: b, left: l, right: r };
  }
  function place(){
    if (rq) return;
    rq = (W.requestAnimationFrame || setTimeout)(function(){
      rq = 0; var u = units[cur];
      if (!ON || !ring || !u) { if (ring) ring.style.display = 'none'; return; }
      var q = box(u); if (!q) { ring.style.display = 'none'; return; }
      var vw = R.clientWidth, sx = W.scrollX, sy = W.scrollY, pad = vw < 600 ? 6 : 12;
      var L = Math.max(2, q.left - pad), Rt = Math.min(vw - 2, q.right + pad);
      var k = [Math.round(L + sx), Math.round(Math.max(0, Rt - L)), Math.round(q.top - 8 + sy), Math.round(q.bottom - q.top + 16)].join(',');
      if (k === lastBox && ring.style.display === 'block') return;
      lastBox = k; k = k.split(',');
      ring.style.display = 'block';
      ring.style.left = k[0] + 'px'; ring.style.width = k[1] + 'px'; ring.style.top = k[2] + 'px'; ring.style.height = k[3] + 'px';
    });
  }
  /* the open part to the top of the window, just under the pinned toolbar */
  function bring(smooth){
    var u = units[cur]; if (!u) return;
    var q = box(u); if (!q) return;
    var y = W.scrollY + q.top - tbBottom() - 14;
    if (Math.abs(y - W.scrollY) < 4) return;
    var reduce = W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { W.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce ? 'smooth' : 'auto' }); } catch (e) { W.scrollTo(0, Math.max(0, y)); }
  }

  /* ---- moving: a part, the next or the one before, the next page ---- */
  function go(i, smooth){
    if (i < 0 || i >= units.length) return false;
    cur = i; memo[vk] = units[i].head || units[i].els[0]; apply(); bring(smooth !== false);
    return true;
  }
  function step(d){
    if (!units.length) return false;
    var f = seq(), i = -1, k;
    if (d > 0) { for (k = 0; k < f.length; k++) if (f[k] > cur) { i = f[k]; break; } }
    else { for (k = f.length - 1; k >= 0; k--) if (f[k] < cur) { i = f[k]; break; } }
    if (i >= 0) return go(i, true);
    /* past the last part: the next page (or before the first: the page before, at its last part) */
    var b = viewBtns(), v = b.indexOf(pressed()), t = b[v + d];
    if (v < 0 || !t) return false;
    pend = d > 0 ? 'first' : 'last'; t.click();
    setTimeout(function(){ if (typeof pend === 'string') pend = ''; }, 1500);
    return true;
  }
  function focusIn(f){ try { f.focus({ preventScroll: true }); } catch (e) { try { f.focus(); } catch (x) {} } }
  function firstField(u){ return u ? fieldsOf(u.els).filter(live)[0] : null; }

  /* ---- the bar at the foot ---- */
  var IC = {
    back: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>',
    all: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2.5h10M3 5.5h10M3 8.5h10M3 11.5h10M3 14h6"/></svg>',
    focus: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2.5h10M3 13.5h10"/><rect x="1.5" y="5" width="13" height="6" rx="1.5"/></svg>'
  };
  function mkBar(){
    if (bar) return;
    bar = D.createElement('div'); bar.id = 'nbhFxBar'; bar.className = 'noprint'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Focus: one part of the form at a time');
    bar.innerHTML = '<button type="button" class="nbh-fx-back">' + IC.back + '<span class="t">Back</span></button>' +
      '<div class="nbh-fx-where" aria-live="polite"><b></b><span></span></div>' +
      '<button type="button" class="nbh-fx-next"><span class="t">Next</span>' + IC.next + '</button>' +
      '<button type="button" class="nbh-fx-off" title="Focus off: show the whole page">' + IC.all + '<span class="t">Whole page</span></button>';
    bar.querySelector('.nbh-fx-back').addEventListener('click', function(){ step(-1); });
    bar.querySelector('.nbh-fx-next').addEventListener('click', function(){ step(1); });
    bar.querySelector('.nbh-fx-off').addEventListener('click', function(){ choose(false); });
    ring = D.createElement('div'); ring.id = 'nbhFxRing'; ring.className = 'noprint'; ring.setAttribute('aria-hidden', 'true');
  }
  function paintBar(){
    if (!bar) return;
    var u = units[cur], f = seq(), k = f.indexOf(cur), b = viewBtns(), vi = b.indexOf(pressed());
    bar.hidden = !u;
    if (!u) return;
    var prevU = f.some(function(i){ return i < cur; }), nextU = f.some(function(i){ return i > cur; });
    var pb = bar.querySelector('.nbh-fx-back'), nb = bar.querySelector('.nbh-fx-next'), nextPage = !nextU && vi >= 0 && b[vi + 1];
    pb.disabled = !prevU && !(vi > 0); nb.disabled = !nextU && !nextPage;
    pb.title = prevU ? 'The part before' : vi > 0 ? 'Back to ' + label(b[vi - 1]) : '';
    nb.querySelector('.t').textContent = nextPage ? 'Next page' : 'Next';
    nb.title = nextU ? 'The next part' : nextPage ? 'On to ' + label(b[vi + 1]) : 'This is the last part';
    bar.querySelector('.nbh-fx-where b').textContent = (u.nf ? 'To read' : 'Part') + (k >= 0 ? ' ' + (k + 1) + ' of ' + f.length : '');
    bar.querySelector('.nbh-fx-where span').textContent = u.title;
  }

  /* ---- styles: screen only, and out of the way while a print or the master print lays the form out ---- */
  var X = 'html[data-nbh-fx]:not(.nbh-plain)';
  var CSS = '@media screen{' +
    X + '{overflow-anchor:none;overflow-y:scroll}' +
    X + ' [data-nbh-fx="f"]{display:none!important}' +
    X + ' [data-nbh-fx="c"]:not([data-nbh-fx-z="0"]),' + X + ' [data-nbh-fx="hc"]{zoom:var(--nbh-fx-zoom,1.1)}' +
    X + ' [data-nbh-fx="hf"]{cursor:pointer;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;min-height:calc(44px / var(--nbh-fx-sz,1));box-sizing:border-box;margin-top:5px!important;margin-bottom:0!important;line-height:1.35!important;padding-top:calc(9px / var(--nbh-fx-sz,1))!important;padding-bottom:calc(9px / var(--nbh-fx-sz,1))!important;-webkit-tap-highlight-color:rgba(37,70,87,.12)}' +
    X + ' [data-nbh-fx="hf"]:hover{filter:brightness(.97)}' +
    /* a folded title says it opens: a chevron at its right, and a light row under a plain heading */
    X + ' [data-nbh-fx="hf"]{background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27none%27 stroke=%27%23254657%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M4 6l4 4 4-4%27/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 10px center!important;background-size:16px 16px!important;padding-right:34px!important}' +
    X + ' [data-nbh-fx="hf"]:not(.nbh-band):not(.bar){background-color:var(--nbh-shade,#f5f8f7)!important;border-radius:6px;padding-left:10px!important;border-bottom:1px solid var(--nbh-rule,#cfdad8)}' +
    X + ' .nbh-pagenav{display:none!important}' +
    X + ' [data-nbh-fx="hc"]:not(:first-child){margin-top:16px!important}' + X + ' :is([data-nbh-fx="c"],[data-nbh-fx="hc"]) + [data-nbh-fx="hf"]{margin-top:18px!important}' +
    X + ' [data-nbh-fx="hf"] :is(button,input,select,textarea){display:none!important}' +
    X + ' [data-nbh-fx="hf"][data-nbh-fx-nf]{opacity:.72}' +
    X + ' [data-nbh-fx="hf"][data-nbh-fx-done]::before{content:"\\2713";display:inline-block;margin-right:.5em;color:#1f7a4d;font-weight:700;font-family:var(--nbh-sans,system-ui,sans-serif)}' +
    X + ' [data-nbh-fx="hf"][data-nbh-fx-sum]::after{content:attr(data-nbh-fx-sum);margin-left:.9em;font:400 13px/1.35 var(--nbh-sans,system-ui,sans-serif);letter-spacing:0;text-transform:none;color:var(--nbh-muted,#54676f);opacity:1}' +
    X + ' [data-nbh-fx="hf"].nbh-band[data-nbh-fx-sum]::after,' + X + ' [data-nbh-fx="hf"].bar[data-nbh-fx-sum]::after{color:inherit;opacity:.82}' +
    X + ' body::after{content:"";display:block;height:92px}' +
    X + ' #nbhToasts{bottom:92px}' +
    '#nbhFxBar,#nbhFxRing{display:none}' +
    X + ' #nbhFxRing{display:block;position:absolute;pointer-events:none;z-index:3;border:2px solid var(--nbh-slate,#254657);border-radius:10px;box-shadow:0 0 0 5px rgba(118,162,163,.22),0 14px 34px -22px rgba(24,46,67,.55);box-sizing:border-box}' +
    X + ' #nbhFxBar{display:flex;align-items:center;gap:8px;position:fixed;z-index:60;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));width:min(760px,calc(100% - 20px));box-sizing:border-box;padding:6px;background:#fff;color:var(--nbh-navy,#182e43);border:1px solid var(--nbh-rule,#cfdad8);border-radius:14px;box-shadow:0 16px 40px -16px rgba(24,46,67,.5);font:14px/1.3 var(--nbh-sans,system-ui,sans-serif)}' +
    X + ' #nbhFxBar[hidden]{display:none}' +
    X + ' #nbhFxBar button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;min-width:44px;padding:0 14px;margin:0;border:1px solid var(--nbh-rule2,#93aead);border-radius:10px;background:#fff;color:var(--nbh-navy,#182e43);font:600 14px/1 var(--nbh-sans,system-ui,sans-serif);cursor:pointer;white-space:nowrap;flex:0 0 auto}' +
    X + ' #nbhFxBar button svg{width:16px;height:16px;flex:0 0 auto}' +
    X + ' #nbhFxBar .nbh-fx-next{background:var(--nbh-navy,#182e43);border-color:var(--nbh-navy,#182e43);color:#fff;padding:0 18px}' +
    X + ' #nbhFxBar .nbh-fx-off{border-color:transparent;color:var(--nbh-slate,#254657)}' +
    X + ' #nbhFxBar button:disabled{opacity:.4;cursor:default}' +
    X + ' #nbhFxBar button:focus-visible{outline:2px solid var(--nbh-slate,#254657);outline-offset:2px}' +
    X + ' #nbhFxBar .nbh-fx-where{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 4px;line-height:1.25}' +
    X + ' #nbhFxBar .nbh-fx-where b{font-size:11.5px;font-weight:600;color:var(--nbh-muted,#54676f);text-transform:uppercase;letter-spacing:.04em}' +
    X + ' #nbhFxBar .nbh-fx-where span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}' +
    '@media (max-width:640px){' + X + ' #nbhFxBar{gap:6px;width:calc(100% - 16px);bottom:calc(8px + env(safe-area-inset-bottom,0px))}' + X + ' #nbhFxBar .nbh-fx-back .t,' + X + ' #nbhFxBar .nbh-fx-off .t{display:none}' + X + ' #nbhFxBar .nbh-fx-back,' + X + ' #nbhFxBar .nbh-fx-off{padding:0 10px}' +
      X + ' [data-nbh-fx="hf"]{white-space:normal!important}' + X + ' [data-nbh-fx="hf"][data-nbh-fx-sum]::after{display:block;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + X + '{--nbh-fx-zoom:1.06}}' +
    '}' +
    '@media print{#nbhFxBar,#nbhFxRing{display:none!important}}';
  /* the toolbar's switch has a rule of its own, there with the button whether Focus is on or off */
  var BTNCSS = '@media screen{#nbhFocusBtn[aria-pressed="true"]{background:var(--nbh-mint,#bcd9d4)!important;color:var(--nbh-navy,#182e43)!important;border-color:var(--nbh-mint,#bcd9d4)!important}' +
    '#nbhFocusBtn svg{width:14px;height:14px;vertical-align:-2px;margin-right:5px}}';
  function mkCss(){ if (css && css.isConnected) return; css = D.createElement('style'); css.id = 'nbh-fx-css'; css.setAttribute('data-nbh-screen', ''); css.textContent = CSS; (D.head || R).appendChild(css); }
  /* the sheet's own scale (nbh-fit-screen zooms the sheet to the window): a folded title stays 44 px tall on screen */
  function scale(){ var s = D.querySelector('main.sheet,.sheet:not(table)'), z = s ? parseFloat(getComputedStyle(s).zoom) || 1 : 1; R.style.setProperty('--nbh-fx-sz', String(z)); }

  /* ---- on and off ---- */
  function on(how){
    if (ON) { build(how); return; }
    if (!D.body) return;
    ON = true; mkCss(); mkBar(); hadStyle = R.hasAttribute('style'); scale();
    D.body.appendChild(ring); D.body.appendChild(bar);
    if (held) hon = true; else R.setAttribute('data-nbh-fx', 'on');
    vk = null; units = []; cur = -1;
    build(how || '');
    watch(true);
    paintBtn();
  }
  function off(){
    if (!ON) return;
    var u = units[cur], q = u ? box(u) : null;
    ON = false; watch(false);
    marked.forEach(unmark); marked = []; units = []; cur = -1; vk = null; memo = {};
    R.removeAttribute('data-nbh-fx'); R.style.removeProperty('--nbh-fx-sz'); if (!hadStyle && !R.getAttribute('style')) R.removeAttribute('style');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    if (ring && ring.parentNode) ring.parentNode.removeChild(ring);
    if (css && css.parentNode) css.parentNode.removeChild(css);
    /* the part that was open stays where it was on the screen */
    if (u && q) { var n = box(u); if (n) W.scrollTo(W.scrollX, Math.max(0, W.scrollY + n.top - q.top)); }
    try { if (W.nbhFieldCare && W.nbhFieldCare.grow) W.nbhFieldCare.grow(); } catch (e) {}
    /* what a form fitted to the room it had while Focus was on (a walkthrough's picture, a board) is fitted again */
    try { W.dispatchEvent(new Event('resize')); } catch (e) {}
    paintBtn();
  }
  /* the user's own choice: kept on this device, and the workstation is told so its button and the other forms follow */
  function choose(v){
    v = !!v; store(v);
    if (framed) { try { W.parent.postMessage({ nbh: 'focus-set', on: v }, '*'); } catch (e) {} }
    if (v) on('here'); else off();
  }
  function paintBtn(){ if (tbtn) { tbtn.setAttribute('aria-pressed', String(ON)); tbtn.title = ON ? 'Focus is on: one part at a time. Press to show the whole page.' : 'Focus: one part of the form at a time, the next part opening as you finish one'; } }
  /* a form opened on its own: the switch in its toolbar, beside the view buttons */
  function mkBtn(){
    if (framed || tbtn) return;
    var seg = D.getElementById('viewSeg'), row = seg && seg.parentElement;
    if (!row || !row.closest('.toolbar')) return;
    tbtn = D.createElement('button'); tbtn.type = 'button'; tbtn.id = 'nbhFocusBtn'; tbtn.className = 'noprint';
    tbtn.innerHTML = IC.focus + 'Focus';
    tbtn.addEventListener('click', function(){ choose(!ON); });
    row.insertBefore(tbtn, seg.nextSibling);
    var st = D.createElement('style'); st.id = 'nbh-fx-btn'; st.setAttribute('data-nbh-screen', ''); st.textContent = BTNCSS; (D.head || R).appendChild(st);
    paintBtn();
  }

  /* ---- keeping up with the form: a view changed, a part drawn again, rows added ---- */
  function own(n){ return n === bar || n === ring || (bar && bar.contains(n)) || n === css; }
  function onMut(recs){
    if (!ON || printing) return;
    var now = false, later = false, sums = false;
    if (viewKey() !== vk) now = true;
    for (var i = 0; i < recs.length && !now; i++) {
      var m = recs[i], t = m.target;
      if (own(t) || (t.nodeType === 1 && t.closest && t.closest('#nbhFxBar'))) continue;
      if (m.type === 'childList') {
        var j, n;
        for (j = 0; j < m.removedNodes.length; j++) { n = m.removedNodes[j]; if (n.nodeType === 1 && (marked.indexOf(n) >= 0 || (n.querySelector && n.querySelector('[data-nbh-fx]')))) { now = true; break; } }
        if (now) break;
        sums = true;
        /* inside a table, a list or a player (rows drawn again, a slide changing) the parts stay as they are */
        if (t.nodeType !== 1 || (t.closest && t.closest(WHOLE))) continue;
        if (boxes.indexOf(t) >= 0) { for (j = 0; j < m.addedNodes.length; j++) { n = m.addedNodes[j]; if (n.nodeType === 1 && !own(n) && !is(n, SKIP + ',.nbh-pm')) { now = true; break; } } }
        if (now) break;
        for (j = 0; j < m.addedNodes.length; j++) { n = m.addedNodes[j]; if (n.nodeType === 1 && !own(n) && (HT.test(n.tagName) || (n.querySelector && n.querySelector(HSEL)))) later = true; }
      } else if (m.type === 'attributes') {
        if (t === D.body || /^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(t.tagName)) continue;
        if (m.attributeName === 'style') { var a = String(m.oldValue || ''), b = String(t.getAttribute('style') || ''); if (!/display|visibility/.test(a + b)) continue; }
        /* only a change in what shows: a block of a box appearing, or a block of the open part going out of sight */
        var mk = marked.indexOf(t) >= 0, bx = boxes.indexOf(t) >= 0;
        if (!mk && !bx) { if (boxes.indexOf(t.parentElement) >= 0 && !own(t) && !is(t, SKIP) && vis(t)) later = true; continue; }
        if (t.closest('[data-nbh-fx="f"]')) continue;
        if (!vis(t)) later = true;
      }
    }
    if (now) { clearTimeout(slow); mo.takeRecords(); if (!nowF) nowF = (W.requestAnimationFrame || setTimeout)(function(){ nowF = 0; build(); }); return; }
    if (later) { clearTimeout(slow); slow = setTimeout(function(){ build(); }, 120); }
    if (sums) soon();
  }
  function soon(){ clearTimeout(sumT); sumT = setTimeout(function(){ if (!ON) return; if (units.some(function(u){ return u.els.some(function(e){ return !e.isConnected; }) || fieldsOf(u.els).length !== u.n0; })) { build(); return; } paintSums(); place(); }, 250); }
  function watch(v){
    if (v) {
      if (!mo) mo = new MutationObserver(onMut);
      mo.observe(D.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'hidden', 'style', 'open', 'aria-pressed', 'aria-selected'] });
      /* the ring follows the open part as the page settles (a picture loading, a box growing); a look twice a second, not a
         ResizeObserver, which a walkthrough player resizing itself inside the part would set looping */
      var n = 0; clearInterval(tick); tick = setInterval(function(){ if (D.hidden || held) return; place(); if (++n % 3 === 0) paintSums(); }, 500);   /* and the folded lines catch up with values a form set without telling anyone */
    } else { if (mo) mo.disconnect(); clearInterval(tick); clearTimeout(slow); clearTimeout(sumT); }
  }
  D.addEventListener('input', function(){ if (ON) soon(); }, true);
  D.addEventListener('change', function(){ if (ON) soon(); }, true);
  W.addEventListener('resize', function(){ if (!ON) return; scale(); if (R.clientWidth !== lastW) { lastW = R.clientWidth; clearTimeout(slow); slow = setTimeout(function(){ build(); }, 150); } else place(); });
  W.addEventListener('load', function(){ if (ON) { scale(); build(); } });

  /* a tap on a folded part opens it */
  D.addEventListener('click', function(e){
    if (!ON || e.defaultPrevented) return;
    var h = e.target && e.target.closest && e.target.closest('[data-nbh-fx="hf"],[data-nbh-fx="s"]');
    if (!h) return;
    var i = +h.getAttribute('data-nbh-fx-u');
    if (h.getAttribute('data-nbh-fx') === 's' && i === cur) return;
    if (i >= 0 && i < units.length && i !== cur) go(i, true);
  });
  /* Enter in a one-line field: the next field of the part, and from the last field the next part */
  D.addEventListener('keydown', function(e){
    if (!ON || e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target; if (!t || t.tagName !== 'INPUT' || !LINE.test(t.type || '')) return;
    var u = units[cur]; if (!u) return;
    var list = fieldsOf(u.els).filter(live), k = list.indexOf(t); if (k < 0) return;   /* read now: a list the form drew since counts */
    e.preventDefault();
    if (k < list.length - 1) { focusIn(list[k + 1]); return; }
    var was = cur;
    if (step(1) && cur !== was) { var f = firstField(units[cur]); if (f) focusIn(f); }
  });
  /* a form or the workstation that puts the cursor in a field of a folded part (a check that names a missing field) opens
     that part first, so the field is there to be seen */
  (function(){
    var P = W.HTMLElement && HTMLElement.prototype, F = P && P.focus, S = W.Element && Element.prototype.scrollIntoView;
    function open(el){ try { if (!ON || !el || !el.closest) return; var h = el.closest('[data-nbh-fx="f"],[data-nbh-fx="hf"]'); if (!h) return; var i = +h.getAttribute('data-nbh-fx-u'); if (i >= 0 && i !== cur && i < units.length) { cur = i; memo[vk] = units[i].head || units[i].els[0]; apply(); } } catch (e) {} }
    if (F) P.focus = function(){ open(this); return F.apply(this, arguments); };
    if (S) Element.prototype.scrollIntoView = function(){ open(this); return S.apply(this, arguments); };
  })();
  /* a print: the folds step aside while the page is laid out for paper (the rules are for the screen in any case, and
     field-care then measures every box open) and come back after */
  function pr(v){ if (v === printing || (v && !ON)) return; printing = v; if (v) hold(); else { release(); if (ON) setTimeout(build, 0); } }
  W.addEventListener('beforeprint', function(){ pr(true); });
  W.addEventListener('afterprint', function(){ pr(false); });
  try { var pq = matchMedia('print'), ph = function(e){ pr(!!e.matches); }; if (pq.addEventListener) pq.addEventListener('change', ph); else if (pq.addListener) pq.addListener(ph); } catch (e) {}
  /* a copy of the page carries no mark: the master print copies the sheet (the form's bridge clones it while the page is laid
     out plain, html.nbh-plain, where none of these rules apply), and a form that copies a part of itself (a row from a row)
     must not copy a fold with it. Every copy made while Focus is on has the marks taken off the copy; the page keeps them. */
  (function(){
    var C = W.Node && Node.prototype.cloneNode, SEL = '[' + ATTRS.join('],[') + ']';
    if (!C) return;
    Node.prototype.cloneNode = function(){
      var c = C.apply(this, arguments);
      if (ON && marked.length && c && c.nodeType === 1) { try { unmark(c); if (c.querySelectorAll) { var l = c.querySelectorAll(SEL); for (var i = 0; i < l.length; i++) unmark(l[i]); } } catch (e) {} }
      return c;
    };
  })();
  W.addEventListener('message', function(ev){
    var d = ev.data; if (!d || typeof d !== 'object') return;
    if (d.nbh === 'focus' && ev.source === W.parent && framed) { if (d.on) on(d.here ? 'here' : ''); else off(); }
  });
  /* another tab of this device turned it on or off (a form inside the workstation hears it from the workstation instead) */
  W.addEventListener('storage', function(e){ if (e.key === KEY && !framed) { if (e.newValue === 'on') on(); else off(); } });

  /* for the checks (qa/v2191-focus-test.js) and the workstation */
  U.focus = {
    on: function(){ return ON; }, set: function(v){ choose(v); },
    units: function(){ var sq = seq(); return units.map(function(u, i){ return { i: i, title: u.title, fields: u.fields.length, live: u.live, nf: u.nf, step: sq.indexOf(i) >= 0, els: u.els.length, head: u.head ? u.head.tagName.toLowerCase() + (u.head.className ? '.' + String(u.head.getAttribute('class')).trim().split(/\s+/).join('.') : '') : '', sup: u.sup.length, cur: i === cur }; }); },
    cur: function(){ return cur; }, go: function(i){ return go(i, false); }, next: function(){ return step(1); }, back: function(){ return step(-1); },
    build: function(){ build(); }, roots: roots, builds: function(){ return builds; }
  };
  function start(){ mkBtn(); if (store()) on(); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})();
/* v21.92 the view tabs on a touch screen are one row that scrolls sideways (the CSS above): the open tab is brought into
   view when it is chosen, when the window turns and when the form opens, and a fade at an edge (data-nbh-more) says there is
   more that way. Nothing here runs with a mouse, and nothing prints. */
try { if (window.matchMedia) (function(){
  var seg = null, coarse = matchMedia('(pointer:coarse)');
  function find(){ if (seg && seg.isConnected) return seg; seg = document.getElementById('viewSeg'); return seg; }
  function edges(){ var s = find(); if (!s) return; var more = '';
    if (s.scrollWidth > s.clientWidth + 2) { if (s.scrollLeft > 2) more = 'l'; if (s.scrollLeft + s.clientWidth < s.scrollWidth - 2) more = (more ? more + ' ' : '') + 'r'; }
    if (more) s.setAttribute('data-nbh-more', more); else s.removeAttribute('data-nbh-more'); }
  function show(){ var s = find(); if (!s || !coarse.matches) return; var a = s.querySelector('[aria-pressed="true"],[aria-selected="true"]');
    if (a && s.scrollWidth > s.clientWidth + 2) { var l = a.offsetLeft - s.offsetLeft, r = l + a.offsetWidth;
      if (l < s.scrollLeft + 24) s.scrollLeft = Math.max(0, l - 24); else if (r > s.scrollLeft + s.clientWidth - 24) s.scrollLeft = r - s.clientWidth + 24; }
    edges(); }
  document.addEventListener('click', function(e){ var s = find(); if (s && e.target && s.contains(e.target)) setTimeout(show, 30); }, true);
  document.addEventListener('scroll', function(e){ var s = find(); if (s && e.target === s) edges(); }, true);
  window.addEventListener('resize', function(){ setTimeout(show, 120); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(show, 200); }); else setTimeout(show, 200);
  window.addEventListener('load', function(){ setTimeout(show, 400); });
})(); } catch (e) {}
