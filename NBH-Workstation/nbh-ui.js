
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
/* v22.47 (review I259) one local-date helper for the forms, the workstation and the respondent pages: the day as this
   device's calendar has it, never the world clock's (after 8 pm in Florida the world clock is already on tomorrow).
     nbhDay.iso(date)   'YYYY-MM-DD' of that date, on this device's calendar
     nbhDay.today()     today's, the same way */
window.nbhDay=window.nbhDay||{iso:function(d){d=d instanceof Date?d:new Date(d==null?Date.now():d);if(isNaN(d))return '';
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');},today:function(){return this.iso(new Date());}};
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
    /* v23.55 (review F473) a field drawn again under the same name takes its old one's place; the map of every view is
       made again (a page-wide measure) only when a field cannot be found that way */
    if (MAP && !Object.keys(MAP).every(function(k){ return MAP[k].every(function(e, i){ if (e.isConnected) return true; var n = e.name || e.id, sel = e.name ? '[name="' + e.name + '"]' : e.id ? '#' + e.id : '';
      var x = null; try { x = sel && document.querySelector(e.tagName.toLowerCase() + sel); } catch (er) { x = null; } if (!x || !n) return false; MAP[k][i] = x; return true; }); })) MAP = null;
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
  /* v23.55 (review F473) the dots are counted once typing pauses: their count can redraw the map of every view, which
     held a keystroke up to half a second in IA-1 and PA-1; a key in the last 1.1 s puts it off again */
  var typed = 0;
  function quiet(f){ var w = 1100 - (Date.now() - typed); if (w > 0) { setTimeout(function(){ quiet(f); }, w); return; } f(); }
  function soon(ms){ clearTimeout(timer); timer = setTimeout(function(){ quiet(function(){ try { U.progress(); } catch (e) {} }); }, ms || 400); }
  document.addEventListener('input', function(){ typed = Date.now(); soon(500); }, true);
  document.addEventListener('keydown', function(){ typed = Date.now(); }, true);
  document.addEventListener('change', function(){ soon(300); }, true);
  var remapTimer = null, lastCount = -1;
  function maybeRemap(){
    clearTimeout(remapTimer);
    remapTimer = setTimeout(function(){ quiet(function(){ var n = document.querySelectorAll('input,select,textarea').length; if (n !== lastCount) { lastCount = n; MAP = null; } try { U.progress(); } catch (e) {} }); }, 900);
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
        /* v22.48 four passes, not two: on a long form (QS-1's Setup) two left the page 2 px off; each pass stops once it holds */
        for (var i = 0; nx && i < 4; i++) { var d = nx.getBoundingClientRect().top + (window.scrollY || 0) - want; if (Math.abs(d) < 0.5) break; g = Math.max(0, g - d); R.style.setProperty('--nbh-fold-gap', g + 'px'); }
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
    X + ' #nbhFxBar .nbh-fx-where b{font-size:12px;font-weight:600;color:var(--nbh-muted,#54676f)}' +   /* v21.92 sentence case, like the tags */
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
  /* v22.31 the change eases in: the page (and the bar and the ring) fade up from part-way over a fifth of a second, so the
     page does not jump from one look to the other. An animation of opacity only (nothing is moved, nothing marked, nothing
     left behind), on the form in view only, and none for a reader who asks the system for less motion */
  function ease(was){
    if (ON === was || !D.body || printing || !R.clientHeight) return;
    try { if (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { return; }
    var l = roots().filter(vis); if (ON) { if (bar) l.push(bar); if (ring) l.push(ring); }
    l.forEach(function(e){ try { if (e.animate) e.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); } catch (x) {} });
  }
  function choose(v){
    v = !!v; store(v);
    if (framed) { try { W.parent.postMessage({ nbh: 'focus-set', on: v }, '*'); } catch (e) {} }
    var was = ON; if (v) on('here'); else off(); ease(was);
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
    if (d.nbh === 'focus' && ev.source === W.parent && framed) { var was = ON; if (d.on) on(d.here ? 'here' : ''); else off(); if (d.here) ease(was); }
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
  /* v23.36 and whenever the strip's own width changes (Fit or Actual size, the toolbar wrapping, Focus, Side by side), so the
     open tab is not left half under its edge */
  if (window.ResizeObserver) { var ro = null, watch = function(){ var s = find(); if (!s || ro) return; ro = new ResizeObserver(function(){ setTimeout(show, 30); }); ro.observe(s); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch(); window.addEventListener('load', watch); }
})(); } catch (e) {}
/* v21.94 Dictate: a switch in the toolbar, beside the view buttons, that writes what you say into the text box you are in.
   The words are heard on the device by the speech recogniser Form TV-1 uses (nbh-dictate.js, loaded when first pressed;
   57 MB downloaded once after a confirm, then kept on the device): nothing is recorded or sent. The box that last had the
   cursor takes the words; with none, the switch says so. Nothing prints, and a page opened from a file says it cannot. */
try { (function(){
  var D = document, W = window, btn = null, last = null, M = null;
  var MIC = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5"/><path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2M5.5 14.5h5"/></svg>';
  var CSS = '@media screen{#nbhDictBtn{flex:0 0 auto}#nbhDictBtn[aria-pressed="true"]{background:#f3c94f!important;color:#182e43!important;border-color:#f3c94f!important}#nbhDictBtn svg{width:14px;height:14px;vertical-align:-2px;margin-right:5px}}';
  function field(el){ return !!(el && /^(TEXTAREA|INPUT)$/.test(el.tagName) && !(el.tagName === 'INPUT' && !/^(text|search|url|email|)$/.test(el.type || '')) && !el.readOnly && !el.disabled && !el.closest('.toolbar,dialog,#nbhDict')); }
  D.addEventListener('focusin', function(e){ if (field(e.target)) last = e.target; }, true);
  function load(){ return new Promise(function(res, rej){ if (W.nbhDictate) return res(W.nbhDictate);
    var s = D.createElement('script'); s.src = 'nbh-dictate.js'; s.onload = function(){ W.nbhDictate ? res(W.nbhDictate) : rej(new Error('nbh-dictate.js did not load')); }; s.onerror = function(){ rej(new Error('Dictation could not start: nbh-dictate.js did not load (offline before it was ever used, or the file is not beside this form).')); }; D.head.appendChild(s); }); }
  function paint(on){ if (!btn) return; btn.setAttribute('aria-pressed', String(!!on)); btn.title = on ? 'Dictating into the text box: press to stop (Escape stops too).' : 'Dictate into the text box you are in, on this device: nothing is recorded. Say period, comma, question mark, new line.'; }
  async function toggle(){
    if (location.protocol === 'file:') { if (W.nbhUI) W.nbhUI.toast('Dictation needs the workstation from its website: the speech recogniser is a download beside the forms.', { kind: 'warn' }); return; }
    try { M = await load(); } catch (e) { if (W.nbhUI) W.nbhUI.toast(String(e.message || e), { kind: 'warn' }); return; }
    M.onstate(paint);
    if (M.active()) { M.stop(); return; }
    var el = D.activeElement && field(D.activeElement) ? D.activeElement : (last && last.isConnected && field(last) && last.offsetParent ? last : null);
    if (!el) { if (W.nbhUI) W.nbhUI.toast('Tap into the text box first, then Dictate.', { kind: 'warn' }); return; }
    try { el.focus({ preventScroll: true }); } catch (e) {}
    await M.start(el, { confirm: function(t){ return W.nbhUI && W.nbhUI.confirm ? W.nbhUI.confirm(t, { ok: 'Download' }) : Promise.resolve(W.confirm(t)); } });
  }
  function mk(){
    if (btn) return;
    var seg = D.getElementById('viewSeg'), row = seg && seg.parentElement;
    if (!row || !row.closest('.toolbar')) return;
    btn = D.createElement('button'); btn.type = 'button'; btn.id = 'nbhDictBtn'; btn.className = 'noprint'; btn.innerHTML = MIC + 'Dictate';
    btn.addEventListener('mousedown', function(e){ e.preventDefault(); });   /* the text box keeps its cursor */
    btn.addEventListener('click', function(){ toggle(); });
    var after = D.getElementById('nbhFocusBtn') || seg;
    row.insertBefore(btn, after.nextSibling);
    var st = D.createElement('style'); st.id = 'nbh-dict-btn'; st.setAttribute('data-nbh-screen', ''); st.textContent = CSS; (D.head || D.documentElement).appendChild(st);
    paint(false);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ setTimeout(mk, 0); }); else setTimeout(mk, 0);
  W.nbhDictateUI = { toggle: toggle, button: function(){ return btn; } };
})(); } catch (e) {}
/* v22.35 the staff directory: the school staff the forms go to (name, role, email, phone, school, a note), typed once for
   the whole caseload and offered in the boxes where a staff member is named. Tap such a box (or type a few letters) and pick:
   the person's role, email and phone fill the boxes beside the name where the row has them. A name and email typed into such
   a row that the directory does not hold are offered to it (Save to directory). Staff only: no student and no family member
   goes in it, and nothing of it is sent anywhere. It is kept on this device as the workstation keeps the Google key: in
   Safari's settings (localStorage, nbh.people) and the workstation's own store (IndexedDB nbh-settings), read from the
   first that holds it. The workstation's Staff directory edits it and, with Google Drive on, keeps it in the school Drive. */
try { (function(){
  var D = document, W = window, K = 'nbh.people', F = ['name', 'role', 'group', 'email', 'phone', 'site', 'note'];
  var EM = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[A-Za-z]{2,}$/;
  /* where a staff member is named: the box (sel), what it holds (field), and the boxes of the same row (sib: the field's
     name with its last part replaced, e.g. inf[2].name -> inf[2].email); need: the row box that must be there, so a box of
     the same name in another form (a target's t[0].name) is not taken for one */
  /* the partner boxes of a row: in the same table row (data-f), by id (rb-n-3 -> rb-r-3), by a data attribute of the form */
  function rowF(f){ return function(el){ var r = el.closest('tr'); return r ? r.querySelector('[data-f="' + f + '"]') : null; }; }
  function byId(a, b){ return function(el){ return D.getElementById(el.id.replace(a, b)); }; }
  function dat(attr, v){ return function(el){ for (var a = el.parentElement; a; a = a.parentElement) { var t = a.querySelector('[' + attr + '="' + v + '"]'); if (t) return t; } return null; }; }   /* the nearest: an administration's own */
  function dk(a, b){ return function(el){ return D.querySelector('[data-k="' + String(el.getAttribute('data-k') || '').replace(a, b) + '"]'); }; }
  var FORM = (/^Form\s+(\S+)/.exec(D.title || '') || [])[1] || '';
  var BIND = [
    /* Form IA-1: the informants (the respondent pages go to their emails), each a row of name, role and email */
    { sel: 'input[name^="inf["][name$="].name"]', field: 'name', sib: { role: 'role', email: 'email' }, need: 'email' },
    { sel: 'input[name^="inf["][name$="].email"]', field: 'email', sib: { name: 'name', role: 'role' }, need: 'name' },
    /* Form DM-1: the team, each a row of role (a list), name and one box for phone and email */
    { sel: 'input[name^="t["][name$="].name"]', field: 'name', sib: { role: 'role', contact: 'contact' }, need: 'contact' }
    ,
    /* the email boxes of the respondent pages (nbh-respond.js): Email it, the Mail app, the reply box's send list */
    { sel: '#nbhInvTo,#nbhMailTo', field: 'email' },
    { sel: 'input[id^="rb-n-"]', field: 'name', sib: { role: byId('rb-n-', 'rb-r-'), email: byId('rb-n-', 'rb-e-') } },
    { sel: 'input[id^="rb-e-"]', field: 'email', sib: { name: byId('rb-e-', 'rb-n-'), role: byId('rb-e-', 'rb-r-') } },
    /* the respondents of CF-1, SV-1 and IN-1 (a role list, or a role box, beside the name; IN-1 also its position) */
    { form: 'CF-1 SV-1', sel: '#rTbl input[data-f="name"]', sib: { role: rowF('role') } },
    { form: 'IN-1', sel: '#respTbl input[data-f="n"]', sib: { role: rowF('role'), role2: rowF('rel') } },
    { form: 'IN-1', sel: '#respTbl input[data-f="by"]' },
    { form: 'IA-1', sel: 'input[name^="int["][name$="].by"]' },
    /* teams and who to call */
    { form: 'CR-1', sel: '#teamTbl input[data-f="n"]', sib: { role: rowF('r') } },
    { form: 'CR-1', sel: 'input[data-m="rpBy"]', field: 'namerole' },
    { form: 'CR-1', sel: 'input[data-m="dbBy"]' },
    { form: 'QS-1', sel: 'input[data-k^="calls."][data-k$=".name"]', sib: { role: dk(/name$/, 'role') } },
    { form: 'EB-1', sel: 'input[name="e.cname"]', sib: { role: 'crole', phone: 'cphone' } },
    { form: 'EB-1', sel: 'input[name="e.ackby"]' },
    { form: 'IC-1', sel: 'input[name="c.ese"],input[name="a.by"]' },
    { form: 'IC-1', sel: 'input[name="s.st.name"]', field: 'namerole' },
    { form: 'MS-1', sel: 'input[name="m.nurse"],input[name="e.rater"]' },
    { form: 'MS-1', sel: 'input[name="m.doc"]', sib: { phone: 'docfax' } },
    { form: 'TV-1', sel: 'input[name="m.pname"]' },
    { form: 'TV-1', sel: 'input[name="m.contact"]', field: 'contact' },
    /* observers, implementers, trainers and the staff a form is about */
    { sel: 'input[name="ti_obs"],input[name="s_imp"],input[name="ss_imp"],input[name="ti_imp"]' },
    { form: 'OB-1 SP-1', sel: '#mObserver', sib: { role: byId('mObserver', 'mRole') } },
    { form: 'OB-1', sel: '#mTeacher,input[id$="secondObs"]' },
    { form: 'ABC-1', sel: '#h-observer', field: 'namerole' },
    { form: 'DD-1', sel: '#m_observer,#incBy,#stWho' },
    { form: 'CT-1 ST-1', sel: 'input[data-m="trainer"]' },
    { form: 'ST-1', sel: 'input[data-m="trainee"]', sib: { role: dat('data-m', 'pos') } },
    { form: 'TI-1', sel: 'input[data-m="int"]', sib: { role: dat('data-m', 'pos') } },
    { form: 'TI-1 MT-1', sel: 'input[data-m="obs"]' },
    { form: 'MT-1', sel: 'input[data-m="obs2"]' },
    { form: 'DA-1', sel: 'input[data-m="runner"]' },
    { form: 'GC-1', sel: 'input[data-m="teacher"],input[data-m="b_who"],input[data-m="f_who"]' },
    { form: 'IM-1', sel: 'input[data-m="examiner"],input[data-m="nurse"],input[data-a="examiner"]' },
    { form: 'IM-1', sel: 'input[data-m="second"]', sib: { role: dat('data-m', 'secondRole') } },
    { form: 'IM-1', sel: 'input[data-a="second"]', sib: { role: dat('data-a', 'secondRole') } },
    { form: 'PD-1', sel: 'input[data-m="staff"]', sib: { role: dat('data-m', 'role') } },
    { form: 'PD-1', sel: 'input[data-m="sup"]' },
    { form: 'SI-1', sel: 'input[data-m="asker"]', sib: { role: dat('data-m', 'role') } },
    { form: 'SI-1', sel: 'input[data-m="a_who"]' },
    { form: 'SV-1', sel: 'input[data-m="collector"]' },
    { form: 'SM-1', sel: 'input[data-m="rater"],input[data-m="bc_teacher"]' },
    { form: 'EA-1', sel: '#tImpl' },
    { form: 'TD-1', sel: 'input[name^="tr["][name$="].who"]' },
    { form: 'RR-1', sel: 'input[name^="f["][name$="].by"]' },
    { form: 'TB-1', sel: 'input[name^="cand["][name$="].by"]' },
    { form: 'RS-1', sel: '#sName,input[data-sup][data-f="name"]' }
  ];
  function key(s){ return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clean(p){ var o = {}; F.forEach(function(f){ o[f] = String(p && p[f] || '').replace(/\s+/g, ' ').trim().slice(0, f === 'note' ? 300 : 120); }); return o; }
  function blank(){ return { nbh: 'people', v: 1, list: [], gone: {}, drv: null }; }
  function parse(s){ try { var j = typeof s === 'string' ? JSON.parse(s) : s; if (j && j.nbh === 'people' && Array.isArray(j.list)) { j.gone = j.gone || {}; return j; } } catch (e) {} return null; }
  function same(a, b){ return a.email && b.email ? key(a.email) === key(b.email) : !!a.name && key(a.name) === key(b.name); }
  function idb(){ return new Promise(function(res){ var r, done = false, fin = function(v){ if (!done) { done = true; res(v); } };
    try { if (!W.indexedDB) return fin(null); r = indexedDB.open('nbh-settings', 1); } catch (e) { return fin(null); }
    setTimeout(function(){ fin(null); }, 4000);
    r.onupgradeneeded = function(){ try { var db = r.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' }); } catch (e) {} };
    r.onsuccess = function(){ fin(r.result); }; r.onerror = function(){ fin(null); }; r.onblocked = function(){ fin(null); }; }); }
  function load(){ var s = null; try { s = localStorage.getItem(K); } catch (e) {}
    var j = s ? parse(s) : null; if (j) return Promise.resolve(j);
    return idb().then(function(db){ if (!db) return blank(); return new Promise(function(res){ try { var g = db.transaction('kv', 'readonly').objectStore('kv').get(K);
      g.onsuccess = function(){ res(g.result && parse(g.result.v) || blank()); }; g.onerror = function(){ res(blank()); }; } catch (e) { res(blank()); } }); }); }
  function save(j){ j.drv = Object.assign({}, j.drv || {}, { dirty: true }); j.at = Date.now();
    var v = JSON.stringify(j), kept = false; try { localStorage.setItem(K, v); kept = localStorage.getItem(K) === v; } catch (e) {}
    if (!kept) try { localStorage.removeItem(K); } catch (e) {}
    return idb().then(function(db){ if (!db) return kept; return new Promise(function(res){ try { var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put({ k: K, v: v });
      t.oncomplete = function(){ res(true); }; t.onerror = function(){ res(kept); }; } catch (e) { res(kept); } }); })
      .then(function(ok){ try { if (W.parent && W.parent !== W) W.parent.postMessage({ nbh: 'people-changed' }, '*'); } catch (e) {} return ok; }); }
  /* one person into the directory: one already there (the same email, or the same name with no email) is completed, not added */
  function add(p){ p = clean(p); if (!p.name && !p.email) return Promise.resolve(null);
    return load().then(function(j){ var hit = j.list.filter(function(x){ return same(x, p); })[0];
      if (hit) { var ch = false; F.forEach(function(f){ if (p[f] && !hit[f]) { hit[f] = p[f]; ch = true; } }); if (!ch) return hit; hit.upd = Date.now(); }
      else { p.id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); p.upd = Date.now(); j.list.push(p); hit = p; }
      return save(j).then(function(){ return hit; }); }); }
  function inShell(){ try { return W.parent !== W && !!W.parent.document.getElementById('caseloadBtn'); } catch (e) { return false; } }
  function dirOpen(){ try { W.parent.postMessage({ nbh: 'people-open' }, '*'); } catch (e) {} }
  var CSS = '@media screen{#nbhPpl{position:fixed;z-index:9500;background:#fff;border:1px solid #b7c8c5;border-radius:8px;box-shadow:0 14px 34px -14px rgba(22,36,46,.45);max-height:min(340px,46vh);overflow:auto;-webkit-overflow-scrolling:touch;font:13.5px/1.35 var(--nbh-sans,system-ui,sans-serif);color:#16242e;padding:4px 0;box-sizing:border-box}' +
    '#nbhPpl[hidden]{display:none}#nbhPpl .pp-h{padding:6px 12px 3px;font-size:11.5px;color:#5b6b73}#nbhPpl .pp-hint{padding:4px 12px 8px;font-size:12.5px;color:#2b3a44;line-height:1.45}' +
    '#nbhPpl button{display:block;width:100%;text-align:left;border:0;border-radius:0;background:transparent;padding:7px 12px;font:inherit;color:inherit;cursor:pointer;min-height:0;box-shadow:none}' +
    '#nbhPpl button[aria-selected="true"],#nbhPpl button:hover{background:#eef4f3}#nbhPpl .pp-n{font-weight:600}#nbhPpl .pp-r{color:#3a4a52}' +
    '#nbhPpl .pp-m{display:block;font-size:12px;color:#5b6b73;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#nbhPpl .pp-f{border-top:1px solid #e3eae8;margin-top:4px;color:#1f5b7a;font-size:12.5px}' +
    '.nbh-toast .pp-save{border:1px solid #cfe0dd!important;border-radius:4px!important;padding:4px 10px!important;margin:0 0 0 12px!important;font-weight:600;white-space:nowrap;color:#fff!important;min-width:0!important;min-height:0!important}}' +
    '@media screen and (pointer:coarse){#nbhPpl button{min-height:44px;padding:9px 14px}.nbh-toast .pp-save{min-height:36px!important;padding:6px 12px!important}}@media print{#nbhPpl{display:none!important}}';
  function css(){ if (D.getElementById('nbhPplCss')) return; var s = D.createElement('style'); s.id = 'nbhPplCss'; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }
  function bindOf(el){ if (!el || el.tagName !== 'INPUT' || el.readOnly || el.disabled || !/^(text|email|search|)$/.test(el.type || '')) return null;
    for (var i = 0; i < BIND.length; i++) { var b = BIND[i]; if (b.form && (' ' + b.form + ' ').indexOf(' ' + FORM + ' ') < 0) continue;
      try { if (el.matches(b.sel) && (!b.need || sibs(el, b)[b.need])) return b; } catch (e) {} } return null; }
  function sibs(el, b){ var out = {}; if (!b.sib) return out;
    Object.keys(b.sib).forEach(function(f){ var s = b.sib[f], t = null;
      try { if (typeof s === 'function') t = s(el); else if (el.name) { var nm = el.name.replace(/[^.\[\]]+$/, s); t = D.querySelector('[name="' + nm.replace(/(["\\])/g, '\\$1') + '"]'); } } catch (e) {}
      if (t && t !== el) out[f] = t; });
    return out; }
  function personOf(el, b){ var p = {}; p[b.field || 'name'] = el.value; var s = sibs(el, b);
    Object.keys(s).forEach(function(f){ var v = s[f].value; if (!v) return;
      if (f === 'contact') { var m = v.match(/[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[A-Za-z]{2,}/), ph = v.replace(m ? m[0] : '', '').replace(/^[\s,;\/]+|[\s,;\/]+$/g, ''); if (m) p.email = m[0]; if (/\d{3}/.test(ph)) p.phone = ph; return; }
      if (s[f].tagName === 'SELECT' && /^other$/i.test(v)) return; p[f] = v; });
    return clean(p); }
  var box = null, cur = null, curB = null, items = [], act = -1, all = null, busy = false, offered = {}, hideT = 0;
  function hide(){ clearTimeout(hideT); if (box) box.hidden = true; if (cur) cur.removeAttribute('aria-expanded'); act = -1; }
  function place(){ if (!box || box.hidden || !cur || !cur.isConnected) return; if (curB && curB.mention) { mplace(); return; } var r = cur.getBoundingClientRect(), vw = W.innerWidth, vh = W.innerHeight;
    if (r.bottom < 0 || r.top > vh) { hide(); return; }
    var w = Math.min(vw - 16, Math.max(r.width, 300)); box.style.width = w + 'px'; box.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
    var below = vh - r.bottom - 8, above = r.top - 8;
    if (below < 180 && above > below) { box.style.top = ''; box.style.bottom = (vh - r.top + 4) + 'px'; box.style.maxHeight = Math.min(340, above - 4) + 'px'; }
    else { box.style.bottom = ''; box.style.top = (r.bottom + 4) + 'px'; box.style.maxHeight = Math.min(340, Math.max(120, below - 4)) + 'px'; } }
  function match(q){ var L = ((all && all.list) || []).slice().sort(function(a, b){ return (a.name || a.email).localeCompare(b.name || b.email); }); q = key(q);
    if (!q) return L.slice(0, 60);
    var words = q.split(' ');
    /* each word typed starts a word of the person's name, role, member of, email, phone or school ("dan" finds Dana, not Jordan) */
    return L.filter(function(p){ var t = key(F.filter(function(f){ return f !== 'note'; }).map(function(f){ return p[f]; }).join(' ')).split(/[\s.@_\-(),\/]+/);
      return words.every(function(w){ return t.some(function(x){ return x.indexOf(w) === 0; }); }); }).slice(0, 60); }
  function mk(){ if (box) return; css(); box = D.createElement('div'); box.id = 'nbhPpl'; box.className = 'noprint'; box.setAttribute('role', 'listbox'); box.setAttribute('aria-label', 'Staff directory'); box.hidden = true; D.body.appendChild(box);
    box.addEventListener('mousedown', function(e){ e.preventDefault(); });   /* the box under the cursor keeps the cursor where it is */
    box.addEventListener('click', function(e){ var t = e.target.closest && e.target.closest('button'); if (!t) return;
      if (t.getAttribute('data-pp') === 'dir') { hide(); dirOpen(); return; } choose(items[+t.getAttribute('data-pp')]); }); }
  var HINT = 'nbh.ppl.hint';
  function paint(){ if (!cur) return; if (curB && curB.mention) { mpaint(); return; }   /* the list is made only when it has something to show: a form whose directory is empty gets nothing added */
    var L = match(cur.value), f = curB.field || 'name';
    if (fresh && !L.length && cur.value) L = match('');   /* a box holding someone the directory does not have (an address typed last time): the whole list, on the tap */
    items = L;
    if (!all || !all.list.length) {   /* an empty directory says where it is, once a session, in the workstation */
      var seen = false; try { seen = sessionStorage.getItem(HINT) === '1'; } catch (e) { seen = true; }
      if (seen || !inShell() || cur.value) { hide(); return; }
      try { sessionStorage.setItem(HINT, '1'); } catch (e) {}
      mk();
      box.innerHTML = '<div class="pp-h">Staff directory</div><div class="pp-hint">Type the staff you send forms to once, in the workstation\u2019s Staff directory, and pick them here.</div><button type="button" class="pp-f" data-pp="dir">Open the staff directory\u2026</button>';
      box.hidden = false; place(); return; }
    if (!L.length || (L.length === 1 && key(val(L[0], f)) === key(cur.value))) { hide(); return; }
    if (act >= L.length) act = L.length - 1; mk();
    box.innerHTML = '<div class="pp-h">Staff directory' + (cur.value ? '' : ': pick, or type to narrow') + '</div>' + L.map(function(p, i){
      return '<button type="button" role="option" data-pp="' + i + '" aria-selected="' + (i === act) + '"><span class="pp-n">' + esc(p.name || p.email) + '</span>' + (p.role ? ' <span class="pp-r">\u00b7 ' + esc(p.role) + '</span>' : '') +
        '<span class="pp-m">' + esc([p.group, p.email, p.phone, p.site].filter(Boolean).join(' \u00b7 ') || '\u00a0') + '</span></button>'; }).join('') +
      (inShell() ? '<button type="button" class="pp-f" data-pp="dir">Edit the staff directory\u2026</button>' : '');
    var host = cur.closest('dialog[open]') || D.body; if (box.parentNode !== host) host.appendChild(box);   /* inside a dialog (Email it) the list is in the dialog's layer */
    box.hidden = false; cur.setAttribute('aria-expanded', 'true'); place();
    var a = box.querySelector('[aria-selected="true"]'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' }); }
  /* a choice box (a role list) takes the choice nearest the person's role: the same words, else the most words shared
     ("4th grade teacher" -> Classroom teacher); none shared, it is left as it was */
  var FAMILY = /\b(parent|guardian|mother|father|mom|dad|grand\w*|foster|step\w*|sibling|brother|sister|aunt|uncle|relative|family)\b/i;
  var STOP = { school: 1, and: 1, of: 1, the: 1, a: 1, or: 1 };
  function nearest(t, v){ var kv = key(v), best = null, bs = 0, ws = kv.split(/[^a-z0-9]+/).filter(function(w){ return w && !STOP[w]; });
    Array.prototype.forEach.call(t.options, function(o){ var ko = key(o.value || o.text); if (!ko) return; if (ko === kv) { best = o.value; bs = 99; return; }
      var n = ko.split(/[^a-z0-9]+/).filter(function(w){ return w && !STOP[w] && ws.indexOf(w) >= 0; }).length; if (n > bs) { bs = n; best = o.value; } });
    return bs > 0 ? best : null; }
  /* what a person gives a box: a box for phone and email together (Form DM-1's team) takes both */
  function val(p, f){ f = String(f).replace(/\d+$/, '');
    return f === 'contact' ? [p.email, p.phone].filter(Boolean).join(', ') : f === 'namerole' ? [p.name, p.role].filter(Boolean).join(', ') : p[f]; }
  function set(t, v){ if (!t || v == null) return;
    if (t.tagName === 'SELECT') { v = nearest(t, v); if (v == null) return; }
    if (t.value === v) return;
    t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); }
  function choose(p){ if (!p || !cur) return; if (curB && curB.mention) { mchoose(p); return; } var el = cur, b = curB, s = sibs(el, b); busy = true;
    try { set(el, val(p, b.field || 'name') || ''); Object.keys(s).forEach(function(f){ var v = val(p, f); if (v) set(s[f], v); }); } finally { busy = false; }
    offered[key(p.name) + '|' + key(p.email)] = 1; hide(); try { el.focus({ preventScroll: true }); } catch (e) {} hide(); }
  var fresh = false;
  function open(el, b){ cur = el; curB = b; act = -1; fresh = true; load().then(function(j){ all = j; if (cur === el && D.activeElement === el) paint(); }); }
  D.addEventListener('focusin', function(e){ var b = bindOf(e.target); if (b) { clearTimeout(hideT); open(e.target, b); } else if (box && !box.contains(e.target)) { hide(); cur = null; } }, true);
  D.addEventListener('input', function(e){ if (e.target === cur && !busy && !(curB && curB.mention)) { act = -1; fresh = false; paint(); } }, true);
  D.addEventListener('focusout', function(e){ if (e.target === cur) { var el = cur; hideT = setTimeout(function(){ if (D.activeElement !== el) hide(); }, 300); } }, true);
  D.addEventListener('keydown', function(e){ if (e.target !== cur || !box || box.hidden || !items.length || (curB && curB.mention)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = e.key === 'ArrowDown' ? Math.min(items.length - 1, act + 1) : Math.max(0, act - 1); paint(); }
    else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); choose(items[act]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); } }, true);
  W.addEventListener('scroll', function(){ if (box && !box.hidden) place(); }, true);
  W.addEventListener('resize', function(){ if (box && !box.hidden) place(); });
  /* a person typed by hand into a row the directory does not hold: offered to it, once */
  D.addEventListener('change', function(e){ if (busy || !e.isTrusted) return; var b = bindOf(e.target); if (!b) return;
    var p = personOf(e.target, b), hasMail = b.field === 'email' || !!(b.sib && (b.sib.email || b.sib.contact));
    if (!hasMail || !p.name || !p.email || !EM.test(p.email)) return;   /* a name alone is not offered: the directory is for sending */
    if (FAMILY.test(p.role)) return;   /* a parent or relative in a team row is never offered: the directory is staff only */
    var k = key(p.name) + '|' + key(p.email); if (offered[k]) return; offered[k] = 1;
    load().then(function(j){ if (j.list.some(function(x){ return same(x, p); })) return;
      var U = W.nbhUI, t = U && U.toast ? U.toast(p.name + (p.email ? ' (' + p.email + ')' : '') + ' is not in your staff directory.', { ms: 14000 }) : null; if (!t) return;
      var bt = D.createElement('button'); bt.type = 'button'; bt.className = 'pp-save'; bt.textContent = 'Save to directory'; css();
      bt.addEventListener('click', function(){ add(p).then(function(){ if (t.parentNode) t.parentNode.removeChild(t); if (U.toast) U.toast(p.name + ' is in your staff directory now.', { kind: 'ok' }); }); });
      t.insertBefore(bt, t.lastChild); }); }, true);
  /* v23.37 @ names a staff member in any text box that is not a name box (a description, a note): @ and the first letters of
     a name, or of a role (@couns), list the directory beside the cursor; a tap, Enter or Tab writes the name in place of the @
     and the letters. An @ inside a word (an email address) is not one; Escape closes the list until the next @. */
  var AT = { mention: true, field: 'name' }, atNo = null, mir = null;
  function canAt(el){ return !!el && !el.readOnly && !el.disabled && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|)$/.test(el.type || ''))) &&
    !bindOf(el) && !(el.closest && el.closest('#nbhPpl,[data-nbh-no-at]')); }
  /* the @ word the cursor is at the end of: where its @ is and the letters typed after it (a first name and a last, at most) */
  function atq(el){ var c = el.selectionStart; if (c == null || c !== el.selectionEnd) return null;
    var v = el.value, i = v.lastIndexOf('@', c - 1); if (i < 0 || c - i > 41) return null;
    if (i > 0 && !/[\s(\[{"'“‘\/]/.test(v.charAt(i - 1))) return null;
    var q = v.slice(i + 1, c); if (/^\s|[\n@]/.test(q) || (q.match(/ /g) || []).length > 2) return null;
    return { at: i, q: q }; }
  /* where the cursor is drawn: a copy of the box, unseen (in its own shadow, so no form watching the page sees it change), holds the
     text before the cursor and a mark */
  function caret(el, i){ var cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!mir || !mir.isConnected) { var h = D.createElement('div'); h.className = 'noprint'; h.setAttribute('aria-hidden', 'true');
      h.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;visibility:hidden'; D.body.appendChild(h);
      mir = D.createElement('div'); (h.attachShadow ? h.attachShadow({ mode: 'open' }) : h).appendChild(mir); }
    var s = mir.style; ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize', 'wordBreak'].forEach(function(p){ s[p] = cs[p]; });
    s.borderStyle = 'solid'; s.position = 'absolute'; s.left = '0'; s.top = '0'; s.height = 'auto'; s.whiteSpace = el.tagName === 'TEXTAREA' ? 'pre-wrap' : 'pre'; s.overflowWrap = 'break-word';
    mir.textContent = el.value.slice(0, i); var k = D.createElement('span'); k.textContent = '​'; mir.appendChild(k);
    var z = el.offsetWidth ? r.width / el.offsetWidth : 1; if (!(z > 0.3 && z < 4)) z = 1;   /* the sheet's own scale (Fit) */
    var lh = parseFloat(cs.lineHeight); if (!(lh > 0)) lh = (parseFloat(cs.fontSize) || 14) * 1.25;
    var x = r.left + ((parseFloat(cs.borderLeftWidth) || 0) + k.offsetLeft - el.scrollLeft) * z, y = r.top + ((parseFloat(cs.borderTopWidth) || 0) + k.offsetTop - el.scrollTop) * z;
    mir.textContent = '';
    return { x: Math.max(r.left, Math.min(x, r.right - 8)), y: Math.max(r.top, Math.min(y, r.bottom - lh * z)), h: lh * z }; }
  function mplace(){ var el = cur, m = el && atq(el); if (!m) { hide(); return; }
    var c = caret(el, m.at), vv = W.visualViewport, top0 = vv ? vv.offsetTop : 0, bot = vv ? vv.offsetTop + vv.height : W.innerHeight, vw = W.innerWidth;
    if (c.y + c.h < top0 || c.y > bot) { hide(); return; }
    var w = Math.min(vw - 16, 320), below = bot - (c.y + c.h) - 8, above = c.y - top0 - 8, up = below < 170 && above > below;
    box.style.width = w + 'px'; box.style.left = Math.max(8, Math.min(c.x - 10, vw - w - 8)) + 'px'; box.style.bottom = '';
    box.style.maxHeight = Math.max(110, Math.min(300, (up ? above : below) - 4)) + 'px';
    box.style.top = (up ? Math.max(top0 + 4, c.y - 4 - box.offsetHeight) : c.y + c.h + 4) + 'px'; }
  function mpaint(){ var el = cur, m = el && atq(el); if (!m) { hide(); return; }
    var L = match(m.q), shell = inShell(), foot = shell ? '<button type="button" class="pp-f" data-pp="dir">Edit the staff directory…</button>' : '';
    items = [];
    if (!all || !all.list.length) {   /* an empty directory says where it is, once a session, in the workstation */
      var seen = false; try { seen = sessionStorage.getItem(HINT) === '1'; } catch (e) { seen = true; }
      if (seen || !shell) { hide(); return; }
      try { sessionStorage.setItem(HINT, '1'); } catch (e) {}
      mk(); box.innerHTML = '<div class="pp-h">Staff directory</div><div class="pp-hint">Type the staff you send forms to once, in the workstation’s Staff directory, and @ names them here.</div><button type="button" class="pp-f" data-pp="dir">Open the staff directory…</button>';
    } else if (!L.length) {   /* letters that start no one's name: said while they are one word, then the list keeps out of the way */
      if (/ /.test(m.q)) { hide(); return; }
      mk(); box.innerHTML = '<div class="pp-h">Staff directory</div><div class="pp-hint">No one in your staff directory has a name or role starting “' + esc(m.q) + '”.</div>' + foot;
    } else {
      items = L; if (act < 0 || act >= L.length) act = 0; mk();
      box.innerHTML = '<div class="pp-h">Staff directory: ' + (m.q ? 'tap a name to write it' : 'type the first letters of a name, or tap one') + '</div>' + L.map(function(p, i){
        return '<button type="button" role="option" data-pp="' + i + '" aria-selected="' + (i === act) + '"><span class="pp-n">' + esc(p.name || p.email) + '</span>' + (p.role ? ' <span class="pp-r">· ' + esc(p.role) + '</span>' : '') +
          '<span class="pp-m">' + esc([p.group, p.email, p.site].filter(Boolean).join(' · ') || ' ') + '</span></button>'; }).join('') + foot; }
    var host = el.closest('dialog[open]') || D.body; if (box.parentNode !== host) host.appendChild(box);
    box.hidden = false; el.setAttribute('aria-expanded', 'true'); mplace();
    var a = box.querySelector('[aria-selected="true"]'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' }); }
  /* the name in place of the @ and the letters, a space after it where the text goes on with a word */
  function mchoose(p){ var el = cur, m = el && atq(el); if (!m) { hide(); return; }
    var nm = p.name || p.email || '', c = el.selectionStart, nx = el.value.charAt(c), sp = nx && /[\s.,;:!?)\]}'"’”]/.test(nx) ? '' : ' ', pos = m.at + nm.length + sp.length;
    busy = true;
    try { if (el.setRangeText) el.setRangeText(nm + sp, m.at, c, 'end'); else el.value = el.value.slice(0, m.at) + nm + sp + el.value.slice(c);
      try { el.setSelectionRange(pos, pos); } catch (e) {}
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } finally { busy = false; }
    hide(); try { el.focus({ preventScroll: true }); } catch (e) {} }
  D.addEventListener('input', function(e){ var el = e.target; if (busy || e.isComposing || !canAt(el)) return;
    var m = atq(el), on = cur === el && curB === AT;
    if (!m) atNo = null;   /* the @ is gone: the next one opens the list again */
    if (!m || (atNo && atNo.el === el && atNo.at === m.at)) { if (on) hide(); return; }
    if (!on) act = 0; cur = el; curB = AT;
    if (on && all) { mpaint(); return; }
    load().then(function(j){ all = j; if (cur === el && curB === AT && D.activeElement === el) mpaint(); }); }, true);
  /* the cursor moved off the @ word (a tap elsewhere in the box, the arrow keys) */
  D.addEventListener('selectionchange', function(){ if (curB === AT && cur && box && !box.hidden && D.activeElement === cur && !atq(cur)) hide(); });
  /* on the window, so the list's keys come before the form's own (Enter to the next field in Focus) */
  W.addEventListener('keydown', function(e){ if (curB !== AT || e.target !== cur || !box || box.hidden || e.isComposing) return;
    var k = e.key, plain = !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey;
    if (k === 'Escape') { var m = atq(cur); if (m) atNo = { el: cur, at: m.at }; hide(); }
    else if (!items.length) return;
    else if (k === 'ArrowDown' || k === 'ArrowUp') { act = k === 'ArrowDown' ? Math.min(items.length - 1, act + 1) : Math.max(0, act - 1); mpaint(); }
    else if ((k === 'Enter' || k === 'Tab') && plain) choose(items[act < 0 ? 0 : act]);
    else return;
    e.preventDefault(); e.stopPropagation(); }, true);
  var U = W.nbhUI || (W.nbhUI = {});
  U.people = { load: load, add: add, list: function(){ return load().then(function(j){ return j.list.slice(); }); }, bind: BIND, bindOf: bindOf };
})(); } catch (e) {}
/* v23.59 (review I247, F486) the names a screen reader announces, for every control of the form: moved here from
   the 47 forms, each of which carried its own copy, so a fix is made once; with ABC-1's naming of charts */
try { (function(){
  /* ---- accessible names (WCAG 2.1 AA, 1.3.1 / 4.1.2) ----
     Every control needs a name a screen reader can announce. These forms put the
     name next to the field visually without ever tying the two together, so it
     was read out as an unlabelled box. Derive it from what is actually on screen
     and attach it; nothing visible changes. */
  function nbhHasName(el){
    if ((el.getAttribute('aria-label') || '').trim()) return true;
    var lb = el.getAttribute('aria-labelledby');
    if (lb && document.getElementById(lb.split(/\s+/)[0])) return true;
    if (el.id) { try { if (document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id) + '"]')) return true; } catch (e) {} }
    if (el.closest && el.closest('label')) return true;
    if (el.tagName === 'BUTTON' && (el.textContent || '').trim()) return true;
    if ((el.getAttribute('title') || '').trim()) return true;
    return false;
  }
  function nbhClean(s){ return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 90); }
  function nbhOwnText(node){
    /* v22.09 an element's own words, without the choices of a list or the text of a field inside it */
    if (!node) return '';
    if (node.nodeType === 3) return nbhClean(node.textContent);
    if (node.nodeType !== 1 || /^(INPUT|SELECT|TEXTAREA|BUTTON|OPTION|SCRIPT|STYLE)$/.test(node.tagName)) return '';
    var c = node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('input,select,textarea,button,option,script,style'), function(x){ x.remove(); });
    return nbhClean(c.textContent);
  }
  function nbhNearbyText(el){
    /* the text just before the control is what reads as its label (v22.09: never the words of another field, and
       never from outside the table cell the control is in) */
    var n = el.previousSibling, out = '';
    while (n && !out) { out = nbhOwnText(n); n = n.previousSibling; }
    if (out) return out;
    var p = el.parentElement;
    if (p && !(p.matches && p.matches('tr,table,tbody,thead'))) { out = nbhOwnText(p); if (out) return out; }
    /* These forms wrap the control in a plain .row and put its caption on a
       sibling of that wrapper, so the label is an uncle rather than a sibling.
       Climb a couple of levels looking for the nearest preceding caption. */
    var up = el.parentElement, hops = 0;
    while (up && hops++ < 3) {
      if (up.matches && up.matches('td,th,tr,table,tbody,thead')) break;
      var s = up.previousSibling;
      while (s) {
        var txt = nbhOwnText(s);
        if (txt) return txt;
        s = s.previousSibling;
      }
      up = up.parentElement;
    }
    return '';
  }
  function nbhCellName(el){
    /* a control in a table cell is named by its row and column, the way a
       sighted user locates it (v22.09: the heading over its own column, colspans counted; the first cell's own words,
       or "Row n" when it holds only fields) */
    var td = el.closest ? el.closest('td,th') : null;
    if (!td) return '';
    var tr = td.parentElement, table = td.closest('table');
    if (!tr || !table) return '';
    var col = 0, k;
    for (k = 0; k < tr.children.length && tr.children[k] !== td; k++) col += tr.children[k].colSpan || 1;
    var headRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : table.rows[0];
    var colHead = '', rowHead = '';
    if (headRow && headRow !== tr) {
      for (var j = 0, x = 0; j < headRow.children.length; j++) {
        var hc = headRow.children[j], span = hc.colSpan || 1;
        if (col >= x && col < x + span) { colHead = nbhOwnText(hc); break; }
        x += span;
      }
    }
    var first = tr.children[0];
    if (first && first !== td) rowHead = nbhOwnText(first);
    if (!rowHead) {
      var sec = tr.parentElement, rows = sec ? Array.prototype.filter.call(sec.children, function(r){ return r.tagName === 'TR'; }) : [];
      var at = rows.indexOf(tr);
      if (at >= 0 && rows.length > 1) rowHead = 'Row ' + (at + 1);
    }
    return [rowHead, colHead].filter(Boolean).join(', ');
  }
  function nbhNameControls(){
    var list = document.querySelectorAll('input,select,textarea,button');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.type === 'hidden') continue;
      if (nbhHasName(el)) continue;
      var inCell = el.closest && el.closest('td,th');   /* v22.09 in a table: its row and column first (review F486) */
      var t = inCell ? (nbhCellName(el) || nbhNearbyText(el) || nbhClean(el.getAttribute('placeholder')))
        : (nbhClean(el.getAttribute('placeholder')) || nbhNearbyText(el));
      if (!t && el.tagName === 'BUTTON') t = 'Option';
      if (t) el.setAttribute('aria-label', t);
    }
    /* a chart is marked as an image, so it needs a name too: the heading of the
       card it sits in says what it shows */
    var charts = document.querySelectorAll('svg[role="img"]');
    for (var k = 0; k < charts.length; k++) {
      var sv = charts[k];
      if ((sv.getAttribute('aria-label') || '').trim() || sv.querySelector('title')) continue;
      var card = sv.closest ? sv.closest('.card') : null;
      var hd = card ? card.querySelector('h2,h3') : null;
      var cap = nbhClean(hd ? hd.textContent : '');
      sv.setAttribute('aria-label', cap ? cap + ' chart' : 'Chart');
    }
    /* a cell given an explicit grid role needs the row and grid roles above it,
       or the role is invalid and the whole grid is announced wrongly */
    var cells = document.querySelectorAll('[role="gridcell"]');
    for (var j = 0; j < cells.length; j++) {
      var cell = cells[j];
      var tr = cell.closest('tr');
      if (tr && !tr.getAttribute('role')) tr.setAttribute('role', 'row');
      var tb = cell.closest('table');
      if (tb && !tb.getAttribute('role')) tb.setAttribute('role', 'grid');
      /* The cell here is a button inside a <td>, and inside a grid a <td> is
         already a cell, so the row ends up holding a cell inside a cell. Marking
         the <td> presentational makes the row the button's parent, which is what
         the grid pattern requires. */
      var host = cell.parentElement;
      if (host && /^(TD|TH)$/.test(host.tagName) && host.children.length === 1 && !host.getAttribute('role'))
        host.setAttribute('role', 'presentation');
    }
  }
  var nbhA11yTimer = null;
  function nbhA11ySoon(){ clearTimeout(nbhA11yTimer); nbhA11yTimer = setTimeout(nbhNameControls, 350); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nbhA11ySoon);
  else nbhA11ySoon();
  /* grids and rows are built by script, so newly added controls are named too.
     Only childList is watched, so setting a name cannot retrigger this. */
  try {
    new MutationObserver(nbhA11ySoon).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}


})(); } catch (e) {}
/* v23.63 (review I249) text size and contrast, on screen only: the workstation's choice (localStorage nbh.view, which a
   form opened on its own reads too), told to the form as it loads and when it changes */
try { (function(){
  var R = document.documentElement, KEY = 'nbh.view';
  function apply(v){ v = v || {}; R.classList.toggle('nbh-tx-1', v.t === 1); R.classList.toggle('nbh-tx-2', v.t === 2); R.classList.toggle('nbh-hc', !!v.hc); R.classList.toggle('nbh-dark', !!v.dark); }
  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  apply(read());
  window.addEventListener('storage', function(e){ if (e.key === KEY) apply(read()); });
  window.addEventListener('message', function(e){ var d = e.data; if (d && d.nbh === 'view' && e.source === window.parent) apply(d.v); });
  (window.nbhUI || (window.nbhUI = {})).view = { apply: apply, read: read };
})(); } catch (e) {}
