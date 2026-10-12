/* The full sweep: every form in the workstation's list driven the same way on an iPad-sized touch screen, and what breaks.
   Simulated data only (each form's own simulation: Mateo Rivera, ID 4471823, Royal Palm School).

   PART alone (each form on its own; a fresh browser context per step, touch on, the iPad's user agent):
     layout    at 1180x820 and 820x1180: the simulation loaded, then every view the toolbar offers (and every inner tab a
               view shows), tapped. On each: page errors and console errors (a request to another site is not counted),
               the page scrolling sideways, an element cut off at the right edge, text cut off inside a box (overflow
               hidden), a button's text spilling out of it, a control covered by another control or by other content
               (elementFromPoint at its centre, the control scrolled into the middle of the window), a control left under
               a fixed bar at the end of the page, and controls under 44 px on touch (grouped). Also noted, not failed:
               a select or text box whose text does not fit, a text area that needs scrolling, text cut with an ellipsis.
     buttons   landscape: every visible, enabled button on every view tapped (a real touch tap; a DOM click when the tap
               cannot land, which is itself reported), except those whose label or id says clear, delete, remove, reset,
               discard, new, close, stop, sign, share, send, email or mail (listed). The toolbar's buttons once; at most
               two of the buttons that share a label in one block (rows of a table). After each: page errors, an error
               thrown, the questions asked (confirm/choose/prompt answered with the first option that is not destructive),
               a dialog left open (closed with Escape, else its own Close/Cancel/OK, else reported as stuck), downloads,
               windows opened, prints, file pickers, a navigation away, and whether the page changed at all.
     roundtrip the simulation loaded afresh; the form's own Save data (the downloaded file); a fresh context; the form's
               own Open data with that file (its file picker); every input, select, textarea and checkbox compared on
               every view; Save data again: the two files must hold the same, apart from the time of saving.
     print     the form as the simulation left it, in print media, laid out at the width of its paper (its @page size and
               margins): elements past the page edge, boxes that cut their content, text areas and fields whose text does
               not fit; then a PDF (its @page size), read back for pages, text and words drawn off the page.
   PART shell (NBH-Workstation/index.html): per form openForm, its simulation inside the frame, grab(id,'snapshot'),
     Save case (the downloaded case file), clearCase(), openCaseText(file), the form opened again: its snapshot compared
     with the first (and with the one the file holds); page errors in the shell and in the frames.
   PART single (deliver/NBH-Workstation.html): each form opened, its simulation loaded, page errors (a lighter pass).

   usage: node qa/sweep-test.js          (WS_URL as for every check, e.g. WS_URL=http://127.0.0.1:8160)
          PART=summary node qa/sweep-test.js   rebuilds qa/out/sweep/summary.md from the results already there
   env:   ONLY=DM-1,TD-1   some forms           PART=alone|shell|single|all (default all; a comma list works)
          JOBS=2           forms at once         STEPS=layout,buttons,roundtrip,print (the steps of PART alone)
          PRESS_VIEW=40, PRESS_FORM=240          the most buttons pressed on one view (the toolbar's not counted) / in a form
   output: a PASS, WARN or FAIL line per form and part, then a DONE line; everything found in qa/out/sweep/<part>/<FORM>.json;
           qa/out/sweep/summary.md, rebuilt from every result there, so parts run apart add up; the PDFs in
           qa/out/sweep/pdf/, the saved files in qa/out/sweep/files/, the case files in qa/out/sweep/case/, screenshots of
           views with a layout problem in qa/out/sweep/shots/ */
'use strict';
const {chromium, fs, path, BASE, forms, loadSim, sleep} = require(__dirname + '/lib.js');
const {execFileSync} = require('child_process');
const OUT = path.join(__dirname, 'out', 'sweep');
const ONLY = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const PARTS = (process.env.PART || 'all') === 'all' ? ['alone', 'shell', 'single'] : process.env.PART.split(',').map(s => s.trim());
const JOBS = Math.max(1, +(process.env.JOBS || 2));
const STEPS = (process.env.STEPS || 'layout,buttons,roundtrip,print').split(',').map(s => s.trim());
const PRESS_VIEW = +(process.env.PRESS_VIEW || 40), PRESS_FORM = +(process.env.PRESS_FORM || 240);
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const LAND = {width: 1180, height: 820}, PORT = {width: 820, height: 1180};
const ORIGIN = new URL(BASE).origin;
const SKIP = /\b(clear|delete|del|remove|reset|discard|new|close|stop|sign|share|send|e-?mail|mail)\b/i;
const T0 = Date.now();
for (const d of ['alone', 'shell', 'single', 'pdf', 'files', 'shots', 'case']) fs.mkdirSync(path.join(OUT, d), {recursive: true});
const J = JSON.stringify;
const isLocal = u => { const s = String(u); return s.startsWith(ORIGIN) || /^(blob|data|about):/.test(s); };
const words = s => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ');
const firstLine = e => { const s = String(e && e.message || e).replace(/\x1b\[\d+m/g, ''); const ls = s.split('\n').map(l => l.trim()).filter(Boolean); const why = ls.find(l => /intercepts pointer events|not visible|outside of the viewport|not stable|not enabled|detached/.test(l)) || (ls.length > 2 ? ls[ls.length - 1] : '');
  return (ls[0] + (why && why !== ls[0] ? ' | ' + why : '')).slice(0, 300); };
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timed out after ' + Math.round(ms / 1000) + ' s: ' + what)), ms))]);

/* ======================= in every page and frame (an init script) ======================= */
function swHelpers() {
  if (window.__sw) return;
  const S = window.__sw = {errs: [], asks: [], msgs: [], prints: 0, mode: 'accept', mut: 0, watching: false};
  try { window.print = function () { S.prints++; }; } catch (e) {}
  addEventListener('error', function (e) {
    const t = e.target;
    if (t && t !== window && t.tagName) { const u = t.currentSrc || t.src || t.href || ''; if (u && u.indexOf(location.origin) === 0) S.errs.push('resource did not load: ' + t.tagName.toLowerCase() + ' ' + u.slice(0, 160)); return; }
    /* the browser's own notice that a resize observer had more to deliver in one frame: no script failed (Safari and
       Chromium both send it as an error event); kept apart */
    if (/^ResizeObserver loop/.test(String(e.message || ''))) { S.notes = (S.notes || 0) + 1; return; }
    S.errs.push(String(e.message || 'error').slice(0, 300) + (e.filename ? ' (' + String(e.filename).split('/').pop().slice(0, 70) + ':' + e.lineno + ')' : ''));
  }, true);
  addEventListener('unhandledrejection', function (e) { const r = e.reason; S.errs.push('unhandled rejection: ' + String(r && (r.message || r.name) || r).slice(0, 300)); });
  const BAD = /\b(delete|remove|discard|erase|clear|reset|replace|overwrite|lose|start over|anyway|without saving)\b/i;
  /* the questions answered: 'accept' (loading the simulation, opening a file) says yes to everything; 'safe' (pressing
     buttons) takes the first option that is not destructive */
  S.stub = function () {
    if (!S.watching && document.documentElement) { S.watching = true; try { new MutationObserver(function (m) { S.mut += m.length; }).observe(document.documentElement, {subtree: true, childList: true, attributes: true, characterData: true}); } catch (e) {} }
    window.confirm = function (t) { S.asks.push({k: 'confirm()', t: String(t).slice(0, 160), a: true}); return true; };
    window.prompt = function (t, d) { const a = d != null && d !== '' ? String(d) : 'Sweep (simulated)'; S.asks.push({k: 'prompt()', t: String(t).slice(0, 160), a}); return a; };
    window.alert = function (t) { S.msgs.push(String(t).slice(0, 300)); };
    const wrap = function (U) {
      if (!U || U.__sw) return; U.__sw = true;
      U.confirm = function (t, o) { o = o || {}; const a = S.mode === 'accept' ? true : !(o.danger || BAD.test(o.ok || '')); S.asks.push({k: 'confirm', t: String(t).slice(0, 160), ok: o.ok || 'OK', danger: !!o.danger, a}); return Promise.resolve(a); };
      U.alert = function (t) { S.msgs.push(String(t).slice(0, 300)); return Promise.resolve(); };
      if (typeof U.choose === 'function') U.choose = function (t, btns) { const L = btns || [], real = L.filter(b => b && b.v !== '' && b.v != null);
        const c = S.mode === 'accept' ? real[0] : real.find(b => b.kind !== 'danger' && !BAD.test(b.label || '')); const a = c ? c.v : '';
        S.asks.push({k: 'choose', t: String(t).slice(0, 160), opts: L.map(b => b.label), a}); return Promise.resolve(a); };
      if (typeof U.prompt === 'function') U.prompt = function (t, o) { const d = o && typeof o === 'object' ? (o.value != null ? o.value : o.def) : o; const a = d != null && d !== '' ? String(d) : 'Sweep (simulated)'; S.asks.push({k: 'prompt', t: String(t).slice(0, 160), a}); return Promise.resolve(a); };
      if (typeof U.toast === 'function') { const t0 = U.toast; U.toast = function (t) { S.msgs.push('toast: ' + String(t).slice(0, 200)); return t0.apply(this, arguments); }; }
    };
    try { wrap(window.nbhUI); } catch (e) {}
    try { if (typeof wsUI !== 'undefined') wrap(wsUI); } catch (e) {}   /* the shell's: a name in its script, not on window */
  };
  const CT = 'button,input:not([type=hidden]),select,textarea,a[href],[role=button],[role=tab],[role=checkbox],[role=radio],[role=switch],summary';
  const BTN = 'button,input[type=button],input[type=submit],input[type=reset],[role=button]';
  const UI = '#nbhToasts,#wsToasts,.nbh-toast,.ws-toast,#nbh-wording-ui,.nbh-as-ui';
  const DLG = 'dialog[open],[aria-modal="true"],[role=dialog],[role=alertdialog]';
  /* frames that crop what they draw on purpose: the walkthrough's stage, TV-1's video graphics (.gx, a ticker that
     crawls) and its teleprompter screen; and anything aria-hidden */
  const DRAWN = '[aria-hidden="true"],#wkStage,.wk-stage,.gx,.tp-screen,#tpScreen';
  S.vis = function (e) {
    if (!e || !e.isConnected || !e.getClientRects().length) return false;
    if (e.checkVisibility && !e.checkVisibility({opacityProperty: true, visibilityProperty: true})) return false;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let d = e.parentElement && e.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) if (!d.open && !e.closest('summary')) return false;
    return true;
  };
  const vis = S.vis;
  const lab = function (e) {
    if (!e || !e.getAttribute) return '';
    let s = e.getAttribute('aria-label') || '';
    if (!s && /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) s = (e.labels && e.labels[0] && e.labels[0].innerText) || e.placeholder || e.name || e.id || '';
    if (!s) s = e.innerText || e.textContent || e.value || e.title || '';
    return String(s).replace(/\s+/g, ' ').trim();
  };
  const desc = function (e) {
    if (!e || !e.tagName) return String(e);
    const c = (e.getAttribute('class') || '').trim().split(/\s+/)[0], l = lab(e);
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (c ? '.' + c : '') + (l ? ' "' + l.slice(0, 40) + '"' : '');
  };
  S.desc = desc;
  /* where a field is, in words: the heading above it and its column */
  const where = function (e) {
    let h = '', th = '';
    const td = e.closest('td'); if (td) { const tr = td.parentElement, tb = td.closest('table'); const i = Array.prototype.indexOf.call(tr.children, td); const hr = tb && tb.querySelector('thead tr') || (tb && tb.rows[0]); if (hr && hr !== tr && hr.children[i]) th = hr.children[i].textContent.replace(/\s+/g, ' ').trim().slice(0, 30); }
    const all = document.querySelectorAll('h1,h2,h3,h4,.nbh-band'); for (const x of all) { if (x.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) { if (x.checkVisibility && x.checkVisibility()) h = x.textContent.replace(/\s+/g, ' ').trim().slice(0, 50); } else break; }
    return (h ? 'under "' + h + '"' : '') + (th ? ', column "' + th + '"' : '');
  };
  S.views = () => Array.prototype.map.call(document.querySelectorAll('#viewSeg button[data-view]'), b => ({v: b.dataset.view, label: lab(b).slice(0, 40)}));
  S.cur = () => { const b = document.querySelector('#viewSeg button[aria-pressed="true"]'); return b ? b.dataset.view : null; };
  S.keyOf = function (e, sel) {
    sel = sel || BTN; const l = lab(e).slice(0, 50);
    if (e.id && document.querySelectorAll('[id="' + e.id.replace(/["\\]/g, '\\$&') + '"]').length === 1) return {key: '#' + e.id, group: '#' + e.id};
    const anc = e.parentElement && e.parentElement.closest('[id]'), a = anc ? anc.id : '';
    const same = Array.prototype.filter.call((anc || document).querySelectorAll(sel), x => lab(x).slice(0, 50) === l);
    return {key: JSON.stringify([a, l, same.indexOf(e), sel === BTN ? 0 : 1]), group: JSON.stringify([a, l])};
  };
  S.find = function (key) {
    if (key.charAt(0) === '#') return document.getElementById(key.slice(1));
    const k = JSON.parse(key), anc = k[0] ? document.getElementById(k[0]) : document;
    if (!anc) return null;
    const same = Array.prototype.filter.call(anc.querySelectorAll(k[3] ? '[role=tab]' : BTN), x => lab(x).slice(0, 50) === k[1]);
    return same[k[2]] || null;
  };
  S.buttons = function () {
    const out = [];
    for (const e of document.querySelectorAll(BTN)) {
      if (e.closest('#viewSeg') || e.closest(UI) || e.closest('dialog') || e.matches('[role=tab]')) continue;
      if (!vis(e) || e.disabled || e.getAttribute('aria-disabled') === 'true' || e.closest('[inert],fieldset[disabled]')) continue;
      const k = S.keyOf(e);
      out.push({key: k.key, group: k.group, label: lab(e).slice(0, 60), id: e.id || '', global: !!e.closest('.toolbar,.nbh-pagenav,.nbh-mast,.nbh-tabs')});
    }
    return out;
  };
  S.innerTabs = function () {
    const out = [];
    for (const e of document.querySelectorAll('[role=tab]')) {
      if (e.closest('#viewSeg') || e.closest('dialog') || e.closest(UI) || !vis(e) || e.disabled) continue;
      const k = S.keyOf(e, '[role=tab]'); out.push({key: k.key, label: lab(e).slice(0, 30)});
    }
    return out;
  };
  S.dialogs = function () {
    return Array.prototype.filter.call(document.querySelectorAll(DLG), d => {
      if (d.closest(UI)) return false;
      if (d.tagName === 'DIALOG' && d.open && d.matches(':modal') && !vis(d)) return true;   /* modal, so the page is inert, yet not shown */
      if (!vis(d)) return false;
      if (d.tagName === 'DIALOG' || d.getAttribute('aria-modal') === 'true') return true;
      return getComputedStyle(d).position === 'fixed';   /* a role=dialog panel in the page's flow is not something to close */
    }).map(d => ({id: d.id || '', cls: String(d.getAttribute('class') || '').slice(0, 40), head: ((d.querySelector('h1,h2,h3,h4,.u-h,legend,header') || d).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90), modal: d.matches(':modal'), invisible: !vis(d)}));
  };
  S.dismiss = function () {
    const list = Array.prototype.filter.call(document.querySelectorAll(DLG), d => (vis(d) || (d.open && d.matches(':modal'))) && !d.closest(UI));
    const d = list[list.length - 1]; if (!d) return 'none';
    if (!vis(d)) return 'not shown, so nothing in it can be pressed';
    const b = Array.prototype.find.call(d.querySelectorAll('button,[role=button],a'), x => vis(x) && (/^(close|cancel|done|ok|okay|got it|not now|later|back|dismiss|no|no thanks|exit|×|✕|x)$/i.test(lab(x)) || /close|dismiss/i.test(x.getAttribute('aria-label') || '')));
    if (b) { b.click(); return 'pressed ' + desc(b); }
    return 'no close button';
  };
  /* the page as a person sees it: its text, its values, how many elements, where it is scrolled, the view and the
     classes on html and body (not the focus: a tap moves it to the button) */
  S.sig = function () {
    const b = document.body, t = b ? b.innerText : ''; let h = 0, v = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    for (const e of document.querySelectorAll('input,select,textarea')) { const x = (e.type === 'checkbox' || e.type === 'radio') ? (e.checked ? '1' : '0') : String(e.value); for (let i = 0; i < x.length; i++) v = (v * 31 + x.charCodeAt(i)) | 0; v = (v * 31 + 7) | 0; }
    /* the state a control shows by its class or aria (a chosen option in a row of buttons), and what is opened or hidden */
    let c = 0; const all = document.body ? document.body.getElementsByTagName('*') : [];
    for (let i = 0; i < all.length; i++) { const e = all[i]; const x = (e.getAttribute('class') || '') + '|' + (e.getAttribute('aria-pressed') || '') + (e.getAttribute('aria-checked') || '') + (e.getAttribute('aria-selected') || '') + (e.getAttribute('aria-expanded') || '') + (e.hidden ? 'h' : '') + (e.open ? 'o' : ''); for (let j = 0; j < x.length; j++) c = (c * 31 + x.charCodeAt(j)) | 0; c = (c * 31 + 3) | 0; }
    return [document.getElementsByTagName('*').length, t.length, h, v, c, Math.round(scrollY), S.cur(), document.documentElement.className, b ? b.className : '', !!document.fullscreenElement].join('~');
  };
  /* something fixed over (nearly) the whole window that is not a dialog: a player's full screen, an overlay */
  S.cover = function () {
    if (document.fullscreenElement) return 'fullscreen ' + desc(document.fullscreenElement);
    const W = innerWidth, H = innerHeight; let el = null;
    for (const [x, y] of [[W / 2, H / 2], [W * 0.15, H * 0.2], [W * 0.85, H * 0.8]]) {
      let got = null;
      for (let n = document.elementFromPoint(x, y); n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        if (getComputedStyle(n).position === 'fixed') { const r = n.getBoundingClientRect(); if (r.width >= W * 0.9 && r.height >= H * 0.85) got = n; break; }
      }
      if (!got || (el && got !== el)) return null; el = got;
    }
    return el && !el.closest(UI) && !el.matches(DLG) ? desc(el) : null;
  };
  /* leave it as a person would: its own exit / close / full screen button */
  S.uncover = async function () {
    if (document.fullscreenElement && document.exitFullscreen) { await document.exitFullscreen().catch(() => {}); return 'exitFullscreen'; }
    const W = innerWidth, H = innerHeight; let c = document.elementFromPoint(W / 2, H / 2);
    for (; c && c !== document.body; c = c.parentElement) if (getComputedStyle(c).position === 'fixed') break;
    if (!c || c === document.body) c = document.body;
    const bs = Array.prototype.filter.call(c.querySelectorAll('button,[role=button]'), x => vis(x) && !x.disabled), txt = x => lab(x) + ' ' + (x.getAttribute('aria-label') || '') + ' ' + (x.title || '');
    const b = bs.find(x => /^(leave|exit|close)\b/i.test(lab(x)) || /^(close|exit)/i.test(x.getAttribute('aria-label') || ''));
    if (b) { b.click(); return 'pressed ' + desc(b); }
    /* a screen locked for a student on purpose (SM-1's student screen): the adult's press and hold */
    const h = bs.find(x => /press and hold/i.test(txt(x)));
    if (h) { const r = h.getBoundingClientRect(); return {hold: [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)], what: desc(h)}; }
    const b2 = bs.find(x => /^(done|back( to .*)?|×|✕|full ?screen|exit full ?screen)$/i.test(lab(x)) || /^(full ?screen|exit full)/i.test(x.getAttribute('aria-label') || ''));
    if (b2) { b2.click(); return 'pressed ' + desc(b2); }
    return 'no exit button';
  };
  S.forceClose = function () {
    Array.prototype.forEach.call(document.querySelectorAll(DLG), d => { if (d.closest(UI) || !(vis(d) || d.open)) return; try { if (d.close) d.close(); } catch (e) {} d.removeAttribute('open'); if (d.tagName !== 'DIALOG' && getComputedStyle(d).position === 'fixed') d.style.display = 'none'; });
  };
  /* the values of every input, select and textarea (hidden ones too), keyed as the forms' own snapshot keys them */
  S.values = function () {
    const list = Array.prototype.filter.call(document.querySelectorAll('input,select,textarea'), e => !/^(file|button|submit|reset|image)$/.test(e.type) && !e.closest(UI));
    const seen = {}, out = {};
    list.forEach(function (e, i) {
      const base = e.id ? '#' + e.id : (e.name ? '@' + e.name : ''); let k;
      if (!base) k = '~' + e.tagName.toLowerCase() + i; else { seen[base] = (seen[base] || 0) + 1; k = seen[base] > 1 ? base + '~' + seen[base] : base; }
      const v = (e.type === 'checkbox' || e.type === 'radio') ? (e.checked ? 'checked' : 'unchecked') : e.multiple ? Array.prototype.map.call(e.selectedOptions, o => o.value).join('|') : e.value;
      out[k] = {v: String(v), s: e.type === 'hidden' ? 2 : vis(e) ? 1 : 0, w: (e.closest('.toolbar') ? 'toolbar ' : '') + (e.closest('dialog,[role=dialog]') ? 'dialog ' : '') + (e.type === 'hidden' ? 'hidden ' : '') + lab(e).slice(0, 40)};
    });
    return out;
  };
  /* ---- layout ---- */
  function fixedAnc(e) { for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return n; } return null; }
  /* inside a box that clips or scrolls sideways and itself ends within the window (any such ancestor, not only the
     nearest: a cell that clips sits inside a table wrapper that scrolls) */
  function contained(e, W) { for (let n = e.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) { const c = getComputedStyle(n); if (c.overflowX !== 'visible' && n.getBoundingClientRect().right <= W + 1) return true; } return false; }
  function outsideScroller(e, x, y) {
    for (let n = e.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const c = getComputedStyle(n); if (c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const q = n.getBoundingClientRect(); if (x < q.left || x > q.right || y < q.top || y > q.bottom) return true;
    }
    return false;
  }
  function textOut(E) {   /* a piece of text inside E drawn past E's edges, or null */
    const r = E.getBoundingClientRect(), w = document.createTreeWalker(E, NodeFilter.SHOW_TEXT); let n, k = 0;
    while ((n = w.nextNode()) && k < 400) {
      if (!/\S/.test(n.nodeValue)) continue; k++;
      const pe = n.parentElement; if (!pe || /^(SCRIPT|STYLE|OPTION|TEMPLATE|NOSCRIPT|TEXTAREA)$/.test(pe.tagName) || !vis(pe)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) {
        if (q.width < 1 || q.height < 1) continue;
        const over = Math.max(q.right - r.right, r.left - q.left, q.bottom - r.bottom, r.top - q.top);
        if (over > 2) return {text: n.nodeValue.replace(/\s+/g, ' ').trim().slice(0, 50), over: Math.round(over)};
      }
    }
    return null;
  }
  function related(e, hit) {
    if (hit === e || e.contains(hit) || hit.contains(e)) return true;
    const L = hit.closest('label'); if (L && (L.control === e || L.contains(e))) return true;
    if (e.labels) for (const l of e.labels) if (l.contains(hit)) return true;
    return false;
  }
  /* what is cut off or runs past the edge; paper: a box that scrolls cuts its content too, and a field's text must fit */
  function scan(paper) {
    const de = document.documentElement, W = de.clientWidth;
    const R = {w: W, scrollW: de.scrollWidth, hscroll: de.scrollWidth > W + 1, wide: [], offRight: 0, clip: [], spill: [], inputCut: [], selectCut: [], taCut: []};
    const all = document.body ? document.body.getElementsByTagName('*') : [], cand = [];
    for (let i = 0; i < all.length; i++) { const e = all[i]; const r = e.getBoundingClientRect(); if (r.right > W + 1 && r.width >= 1 && r.height >= 1) cand.push(e); }
    const set = new Set();
    for (const e of cand) {
      if (e.closest(UI) || !vis(e)) continue;
      if (paper && fixedAnc(e)) continue;
      if (contained(e, W)) continue;
      set.add(e);
    }
    for (const e of set) {
      if (e.parentElement && set.has(e.parentElement)) continue;   /* the outermost only */
      const r = e.getBoundingClientRect();
      if (r.left >= W - 1) { R.offRight++; continue; }
      if (R.wide.length < 12) R.wide.push({el: desc(e), at: where(e), left: Math.round(r.left), right: Math.round(r.right), y: Math.round(r.top + scrollY)});
    }
    for (let i = 0; i < all.length; i++) {
      const e = all[i];
      if (e instanceof SVGElement || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|OPTION|IFRAME|CANVAS|VIDEO|IMG|SELECT|INPUT|TEXTAREA|svg)$/.test(e.tagName)) continue;
      if (e.scrollWidth <= e.clientWidth + 2 && e.scrollHeight <= e.clientHeight + 2) continue;
      const cs = getComputedStyle(e);
      const cut = v => v === 'hidden' || v === 'clip' || (paper && (v === 'auto' || v === 'scroll'));
      const hx = cut(cs.overflowX) && e.scrollWidth > e.clientWidth + 2, hy = cut(cs.overflowY) && e.scrollHeight > e.clientHeight + 2;
      if (!hx && !hy) {
        if ((e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && e.scrollWidth > e.clientWidth + 2 && vis(e) && !e.closest(UI)) { const t = textOut(e); if (t && R.spill.length < 20) R.spill.push({el: desc(e), text: t.text, by: t.over, y: Math.round(e.getBoundingClientRect().top + scrollY)}); }
        continue;
      }
      /* a drawing (the walkthrough's stage, aria-hidden) keeps its scenes off its edges until they play: not cut text */
      if (e.closest(UI) || e.closest(DRAWN) || !vis(e)) continue;
      const r = e.getBoundingClientRect(); if (r.width < 6 || r.height < 6) continue;
      const t = textOut(e);
      if (t && R.clip.length < 30) R.clip.push({el: desc(e), at: where(e), text: t.text, by: t.over, ellipsis: cs.textOverflow === 'ellipsis', clamp: !!(cs.webkitLineClamp && cs.webkitLineClamp !== 'none'), overflow: cs.overflowX + '/' + cs.overflowY, y: Math.round(r.top + scrollY)});
    }
    /* a chart's label drawn past the edge of its svg (an svg clips what is outside it) */
    for (const t of document.querySelectorAll('svg text')) {
      if (R.clip.length >= 40 || !/\S/.test(t.textContent) || t.closest(DRAWN) || !vis(t)) continue;
      const sv = t.ownerSVGElement; if (!sv || getComputedStyle(sv).overflow === 'visible') continue;
      const q = t.getBoundingClientRect(), s = sv.getBoundingClientRect();
      const over = Math.max(q.right - s.right, s.left - q.left, q.bottom - s.bottom, s.top - q.top);
      if (over > 1.5) R.clip.push({el: 'svg text in ' + desc(sv.parentElement || sv), text: t.textContent.trim().slice(0, 50), by: Math.round(over), svg: true, y: Math.round(q.top + scrollY)});
    }
    const cv = S._cv || (S._cv = document.createElement('canvas')), cx = cv.getContext('2d');
    for (const e of document.querySelectorAll('input,select,textarea')) {
      if (e.closest(UI) || !vis(e)) continue;
      if (e.tagName === 'TEXTAREA') {
        if (e.value && e.scrollHeight > e.clientHeight + 2 && (paper || getComputedStyle(e).overflowY !== 'visible') && R.taCut.length < 20) R.taCut.push({el: desc(e), at: where(e), text: e.value.slice(0, 40), need: e.scrollHeight, has: e.clientHeight});
      } else if (e.tagName === 'SELECT') {
        if (e.multiple || e.size > 1) continue; const o = e.options[e.selectedIndex]; if (!o || !o.text.trim()) continue;
        const cs = getComputedStyle(e); cx.font = cs.font; const tw = cx.measureText(o.text.trim()).width;
        const avail = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (cs.appearance === 'none' ? 0 : 16);
        if (tw > avail + 2 && R.selectCut.length < 20) R.selectCut.push({el: desc(e), at: where(e), text: o.text.trim().slice(0, 50), need: Math.round(tw), has: Math.round(avail)});
      } else if (/^(text|search|email|tel|url|number)$/.test(e.type)) {
        if (e.value && e.scrollWidth > e.clientWidth + 2 && R.inputCut.length < 20) R.inputCut.push({el: desc(e), at: where(e), text: e.value.slice(0, 50), need: e.scrollWidth, has: e.clientWidth});
      }
    }
    return R;
  }
  S.layout = function () {
    const de = document.documentElement, H = innerHeight, sx = scrollX, sy = scrollY;
    window.scrollTo({left: 0, top: 0, behavior: 'instant'});
    const R = scan(false);
    R.covered = []; R.underBars = []; R.small = {}; R.ctrls = 0; R.offscreen = 0;
    const ctrls = [];
    for (const e of document.querySelectorAll(CT)) { if (e.closest(UI) || (e.tagName === 'INPUT' && e.type === 'file') || !vis(e)) continue; ctrls.push(e); }
    R.ctrls = ctrls.length;
    for (const e of ctrls) {   /* touch size: a box or a radio counts its label, and the cell it is alone in (tapped there since v21.78) */
      const r = e.getBoundingClientRect(); let w = r.width, h = r.height;
      if (e.type === 'checkbox' || e.type === 'radio') {
        const L = e.closest('label') || (e.labels && e.labels[0]); if (L) { const q = L.getBoundingClientRect(); w = Math.max(w, q.width); h = Math.max(h, q.height); }
        const td = e.closest('td,th'); if (td && td.querySelectorAll('input,select,textarea,button,a').length === 1) { const q = td.getBoundingClientRect(); w = Math.max(w, q.width); h = Math.max(h, q.height); }
      }
      const dim = Math.min(w, h); if (dim >= 44) continue;
      const kind = e.tagName.toLowerCase() + (e.tagName === 'INPUT' ? '[' + (e.type || 'text') + ']' : '') + (e.closest('.toolbar') ? ' in the toolbar' : e.closest('table') ? ' in a table' : '');
      const band = dim < 24 ? 'under 24 px' : dim < 32 ? '24-31 px' : dim < 40 ? '32-39 px' : '40-43 px';
      const g = kind + ', ' + band, s = R.small[g] || (R.small[g] = {n: 0, ex: []}); s.n++; if (s.ex.length < 3) s.ex.push(desc(e) + ' ' + Math.round(w) + 'x' + Math.round(h));
    }
    const maxY = Math.max(0, de.scrollHeight - H);
    const items = ctrls.filter(e => !fixedAnc(e)).map(e => { const r = e.getBoundingClientRect(); return {e, y: r.top + r.height / 2 + scrollY}; }).sort((a, b) => a.y - b.y);
    let cur = scrollY;
    for (const it of items) {
      const vy = it.y - cur;
      if (vy < H * 0.22 || vy > H * 0.78) { window.scrollTo({left: 0, top: Math.max(0, Math.min(maxY, it.y - H / 2)), behavior: 'instant'}); cur = scrollY; }
      const r = it.e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { R.offscreen++; continue; }
      if (outsideScroller(it.e, x, y)) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit || related(it.e, hit) || hit.closest(UI)) continue;
      const hc = hit.closest(CT);
      /* a region drawn inside another in one picture (IM-1's eye inside the eye area, the nose on the face) or a marker
         placed on a region: the outer one is reached around the inner one */
      if (it.e instanceof SVGElement && hit instanceof SVGElement && it.e.ownerSVGElement && it.e.ownerSVGElement === (hit.ownerSVGElement || hit)) continue;
      const rec = {el: desc(it.e), by: desc(hit), byCtrl: !!(hc && !related(it.e, hc)), y: Math.round(it.y)};
      if (fixedAnc(hit)) { if (cur >= maxY - 1 && y > H / 2 && R.underBars.length < 10) { rec.atEnd = true; R.underBars.push(rec); } continue; }
      if (R.covered.length < 30) R.covered.push(rec);
    }
    window.scrollTo({left: sx, top: sy, behavior: 'instant'});
    return R;
  };
  S.pageBox = function () {
    let size = ''; const m = {};
    const px = v => { const s = String(v || '').trim(), n = parseFloat(s); if (!s || isNaN(n)) return null; if (/in$/.test(s)) return n * 96; if (/cm$/.test(s)) return n * 96 / 2.54; if (/mm$/.test(s)) return n * 96 / 25.4; if (/pt$/.test(s)) return n * 4 / 3; return n; };
    const visit = (list, ok) => { for (const r of list) {
      if (r.type === CSSRule.PAGE_RULE) { if (!ok || r.selectorText) continue; if (r.style.size) size = r.style.size; ['Top', 'Right', 'Bottom', 'Left'].forEach(k => { const v = px(r.style['margin' + k]); if (v != null) m[k] = v; }); }
      else if (r.type === CSSRule.MEDIA_RULE) visit(r.cssRules, ok && !/^\s*screen/.test(r.conditionText)); } };
    for (const s of document.styleSheets) { let rules; try { rules = s.cssRules; } catch (e) { continue; } visit(rules, true); }
    const land = /landscape/.test(size), a4 = /a4/i.test(size), pw = a4 ? 793.7 : 816, ph = a4 ? 1122.5 : 1056, W = land ? ph : pw, Hh = land ? pw : ph, d = 0.4 * 96;
    const g = k => m[k] != null ? m[k] : d;
    return {size: size || '(none)', landscape: land, cw: W - g('Left') - g('Right'), ch: Hh - g('Top') - g('Bottom'), margins: ['Top', 'Right', 'Bottom', 'Left'].map(k => Math.round(g(k)))};
  };
  S.printCheck = function () { window.scrollTo({left: 0, top: 0, behavior: 'instant'}); return scan(true); };
}

/* ======================= the test's side ======================= */
async function newCtx(browser, vp) {
  const ctx = await browser.newContext({viewport: vp, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: 'block', userAgent: IPAD, acceptDownloads: true});
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: ORIGIN}); } catch (e) {}
  await ctx.route(u => !isLocal(u.href), r => r.abort().catch(() => {}));   /* other sites: not reached (and not counted) */
  await ctx.addInitScript(swHelpers);
  return ctx;
}
/* what a page says and does, as it happens; where.at names the step */
function watch(page, log, where) {
  const ev = {downloads: [], popups: [], choosers: 0, navs: 0};
  page.on('pageerror', e => log.push({t: 'pageerror', at: where.at, text: String(e && e.message || e).slice(0, 400)}));
  page.on('console', m => { if (m.type() !== 'error') return; const u = (m.location() || {}).url || '', tx = m.text();
    if (/Failed to load resource|net::ERR_/.test(tx) && !u.startsWith(ORIGIN)) return;
    log.push({t: 'console', at: where.at, text: tx.slice(0, 400), url: u.slice(0, 120)}); });
  page.on('requestfailed', r => { const u = r.url(); if (u.startsWith(ORIGIN) && !/ERR_ABORTED/.test((r.failure() || {}).errorText || '')) log.push({t: 'requestfailed', at: where.at, text: u.slice(0, 160) + ' ' + ((r.failure() || {}).errorText || '')}); });
  page.on('response', r => { if (r.url().startsWith(ORIGIN) && r.status() >= 400) log.push({t: 'http', at: where.at, text: r.status() + ' ' + r.url().slice(0, 160)}); });
  page.on('dialog', d => { log.push({t: 'nativedialog', at: where.at, text: d.type() + ': ' + d.message().slice(0, 200)}); (d.type() === 'prompt' ? d.accept(d.defaultValue() || 'Sweep (simulated)') : d.accept()).catch(() => {}); });
  page.on('download', d => ev.downloads.push({name: d.suggestedFilename(), d}));
  page.on('popup', p => { ev.popups.push(p.url()); setTimeout(() => p.close().catch(() => {}), 1500); });
  page.on('filechooser', () => { ev.choosers++; });
  page.on('framenavigated', fr => { if (fr === page.mainFrame()) ev.navs++; });
  return ev;
}
const stub = (fr, mode) => fr.evaluate(m => { __sw.mode = m; __sw.stub(); }, mode).catch(() => {});
const errsOf = log => log.filter(l => l.t !== 'nativedialog');
async function closeDialogs(page) {
  const steps = [];
  for (let i = 0; i < 4; i++) {
    const open = await page.evaluate(() => __sw.dialogs()).catch(() => []);
    if (!open.length) return {open: steps.length ? steps[0].open : [], how: steps.map(s => s.how).join(', ') || 'none', stuck: false};
    let how;
    if (i === 0) { await page.keyboard.press('Escape').catch(() => {}); how = 'Escape'; }
    else how = await page.evaluate(() => __sw.dismiss()).catch(e => 'dismiss failed ' + firstLine(e));
    steps.push({open, how}); await sleep(350);
  }
  const still = await page.evaluate(() => __sw.dialogs()).catch(() => []);
  if (!still.length) return {open: steps[0].open, how: steps.map(s => s.how).join(', '), stuck: false};
  await page.evaluate(() => __sw.forceClose()).catch(() => {});
  return {open: steps[0].open, how: steps.map(s => s.how).join(', '), stuck: true, still};
}
async function openAlone(page, f, where) {
  where.at = 'load';
  await page.goto(BASE + '/NBH-Workstation/' + f.file, {waitUntil: 'load', timeout: 60000});
  await sleep(900);
  await stub(page, 'accept');
  where.at = 'simulation';
  const how = await loadSim(page);
  await sleep(2200);
  await closeDialogs(page);
  /* opened again in the same browser (after a press that left the page): its safety copy is offered; Not now, as a
     person starting afresh would (the panel itself is checked by its own proof) */
  if (await page.evaluate(() => { const b = document.querySelector('#nbhAsDlg button[data-as="x"]'); if (b) b.click(); return !!b; }).catch(() => false)) { where.asked = (where.asked || 0) + 1; await sleep(300); }
  await stub(page, 'safe');
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return how;
}
const views = fr => fr.evaluate(() => __sw.views()).catch(() => []);
const curView = fr => fr.evaluate(() => __sw.cur()).catch(() => null);
async function goView(page, v, tap) {
  const h = await page.evaluateHandle(v => document.querySelector('#viewSeg button[data-view="' + CSS.escape(v) + '"]'), v);
  const el = h.asElement(); let err = null;
  if (!el) return 'no button';
  if (tap) { try { await el.tap({timeout: 2500}); } catch (e) { err = firstLine(e); await el.evaluate(b => b.click()).catch(() => {}); } }
  else await el.evaluate(b => b.click()).catch(() => {});
  await sleep(450);
  const on = await curView(page);
  return err ? 'tap failed: ' + err : (on === v ? 'ok' : 'not shown (the pressed view is ' + on + ')');
}
async function shot(page, name, y) {
  try { if (y != null) await page.evaluate(y => window.scrollTo({left: 0, top: Math.max(0, y - 250), behavior: 'instant'}), y); await page.screenshot({path: path.join(OUT, 'shots', name + '.jpg'), type: 'jpeg', quality: 45}); return 'qa/out/sweep/shots/' + name + '.jpg'; }
  catch (e) { return null; }
}
const layoutBad = L => !!L && (L.hscroll || L.wide.length || L.covered.length || L.underBars.length || L.clip.some(c => !c.ellipsis && !c.clamp) || L.spill.length);

/* ---- step 1: every view (and inner tab), at one size ---- */
async function walk(page, f, R, where, orient) {
  const out = R.layout[orient] = {views: {}};
  for (const v of await views(page)) {
    where.at = orient + ' view ' + v.v;
    const st = await goView(page, v.v, true);
    const L = await page.evaluate(() => __sw.layout()).catch(e => ({err: firstLine(e)}));
    const rec = out.views[v.v] = {label: v.label, shown: st, layout: L};
    if (layoutBad(L)) { const y = (L.covered[0] || L.wide[0] || L.clip.find(c => !c.ellipsis) || L.spill[0] || L.underBars[0] || {}).y; rec.shot = await shot(page, f.id + '-' + orient + '-' + v.v, y); await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {}); }
    const tabs = (await page.evaluate(() => __sw.innerTabs()).catch(() => [])).slice(0, 10);
    if (tabs.length > 1) {
      rec.tabs = {};
      for (const t of tabs) {
        where.at = orient + ' view ' + v.v + ' tab ' + t.label;
        const h = await page.evaluateHandle(k => __sw.find(k), t.key); const el = h.asElement(); if (!el) continue;
        let tapErr = null; try { await el.tap({timeout: 2500}); } catch (e) { tapErr = firstLine(e); await el.evaluate(x => x.click()).catch(() => {}); }
        await sleep(350);
        const T = await page.evaluate(() => __sw.layout()).catch(e => ({err: firstLine(e)}));
        rec.tabs[t.label] = {tapErr, layout: T};
        if (layoutBad(T)) rec.tabs[t.label].shot = await shot(page, f.id + '-' + orient + '-' + v.v + '-' + t.label.replace(/\W+/g, '_').slice(0, 20), (T.covered[0] || T.wide[0] || T.clip[0] || T.spill[0] || {}).y);
      }
      const h0 = await page.evaluateHandle(k => __sw.find(k), tabs[0].key); if (h0.asElement()) { await h0.asElement().evaluate(x => x.click()).catch(() => {}); await sleep(250); }
    }
    await closeDialogs(page);
  }
}

/* ---- step 2: every button ---- */
async function press(page, f, view, b, where, ev, log) {
  where.at = 'press [' + view + '] ' + (b.id ? '#' + b.id : b.label).slice(0, 50);
  const rec = {view, label: b.label, id: b.id};
  const before = await page.evaluate(() => ({e: __sw.errs.length, a: __sw.asks.length, m: __sw.msgs.length, p: __sw.prints, mut: __sw.mut, sig: __sw.sig()})).catch(() => ({e: 0, a: 0, m: 0, p: 0, mut: 0, sig: ''}));
  const l0 = log.length, d0 = ev.downloads.length, p0 = ev.popups.length, c0 = ev.choosers, n0 = ev.navs;
  const h = await page.evaluateHandle(k => __sw.find(k), b.key).catch(() => null);
  const el = h && h.asElement();
  if (!el) { rec.gone = true; return rec; }
  /* a tap is Playwright's touchstart, then its own scroll to the button: the toolbar's fold (nbh-ui.js, v21.83) reads that as
     a person's swipe and folds, so a button that moved under the tap is tapped once more when the bar has settled */
  const tapIt = async () => { try { await el.tap({timeout: 2500}); } catch (e) { if (!/not stable/.test(String(e && e.message))) throw e; await sleep(900); await el.tap({timeout: 2500}); } };
  try { await tapIt(); rec.how = 'tap'; }
  catch (e) {
    /* v21.89 a button that went out of sight before the tap (the folded toolbar's Tools button once the bar has unfolded)
       is not there for a person to tap either: gone, not a missed tap */
    if (/element is not visible/.test(String(e && e.message)) && !(await el.isVisible().catch(() => false))) { rec.gone = true; return rec; }
    rec.tapFailed = firstLine(e);
    /* a region of a drawing with another drawn over its middle: Playwright taps the middle; a person taps beside it */
    if (await el.evaluate(x => x instanceof SVGElement).catch(() => false) && /<(path|circle|ellipse|rect|polygon|g|line|text)\b[^>]*>.*intercepts pointer events/.test(String(e && e.message || e).replace(/\x1b\[\d+m/g, ''))) rec.tapNested = true;
    try { await el.evaluate(x => { if (typeof x.click === "function") x.click(); else x.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, view: window})); }); rec.how = 'dom click'; } catch (e2) { rec.thrown = firstLine(e2); } }
  await sleep(450);
  /* nothing yet: a second longer, for what answers late (the clipboard, a file read) */
  const quiet = await page.evaluate(b => __sw.sig() === b.sig && __sw.asks.length === b.a && __sw.msgs.length === b.m && __sw.prints === b.p && !__sw.dialogs().length, before).catch(() => false);
  if (quiet && ev.downloads.length === d0 && ev.popups.length === p0 && ev.choosers === c0) await sleep(1000);
  if (ev.navs !== n0) {
    rec.navigated = page.url().slice(0, 160);
    rec.errors = errsOf(log.slice(l0)).map(x => x.t + ': ' + x.text);
    try { await openAlone(page, f, where); await goView(page, view, false); } catch (e) { rec.reopenFailed = firstLine(e); }
    return rec;
  }
  const after = await page.evaluate(() => ({e: __sw.errs.slice(), a: __sw.asks.slice(), m: __sw.msgs.slice(), p: __sw.prints, mut: __sw.mut, sig: __sw.sig()})).catch(e => ({gone: firstLine(e)}));
  if (after.gone) { rec.pageGone = after.gone; return rec; }
  const errs = errsOf(log.slice(l0)).map(x => x.t + ': ' + x.text).concat(after.e.slice(before.e));
  if (errs.length) rec.errors = [...new Set(errs)];
  const asked = after.a.slice(before.a).map(x => x.k + ' "' + x.t.slice(0, 90) + '"' + (x.opts ? ' [' + x.opts.join(' | ') + ']' : '') + ' -> ' + x.a);
  if (asked.length) rec.asked = asked;
  const told = after.m.slice(before.m).map(s => s.slice(0, 140)); if (told.length) rec.told = told;
  if (after.p - before.p) rec.prints = after.p - before.p;
  if (ev.downloads.length > d0) rec.downloads = ev.downloads.slice(d0).map(x => x.name);
  if (ev.popups.length > p0) rec.popups = ev.popups.slice(p0);
  if (ev.choosers > c0) rec.filePicker = true;
  rec.mutations = after.mut - before.mut;
  rec.changed = after.sig !== before.sig;
  /* v21.92 the Focus switch (v21.91) is a mode for the whole page: with it on, the parts not open are folded away, so the
     buttons in them cannot be tapped (SP-1's behavior bar, in the sweep of v21.91). It is pressed like any button and its
     effect recorded, then the page is put back before the next press; Focus itself is checked by qa/v2191-focus-test.js. */
  if (rec.id === 'nbhFocusBtn') { await page.evaluate(() => { try { nbhUI.focus.set(false); } catch (e) {} }).catch(() => {}); await sleep(600); }
  const dl = await closeDialogs(page);
  if (dl.open.length) rec.dialog = {open: dl.open.map(d => (d.id ? "#" + d.id + " " : "") + d.head), closedBy: dl.how, stuck: dl.stuck, invisible: dl.open.some(d => d.invisible)};
  /* a press that leaves something over the whole window (a player's full screen): left with Escape, else its own exit */
  const cov = await page.evaluate(() => __sw.cover()).catch(() => null);
  if (cov) {
    rec.covers = {what: cov, left: []};
    await page.keyboard.press('Escape').catch(() => {}); await sleep(400); rec.covers.left.push('Escape');
    for (let i = 0; i < 3 && await page.evaluate(() => __sw.cover()).catch(() => null); i++) {
      const how = await page.evaluate(() => __sw.uncover()).catch(e => firstLine(e));
      if (how && how.hold) { await page.mouse.move(how.hold[0], how.hold[1]); await page.mouse.down(); await sleep(2600); await page.mouse.up(); rec.covers.left.push('press and hold ' + how.what); }
      else rec.covers.left.push(how);
      await sleep(500);
    }
    rec.covers.stuck = !!(await page.evaluate(() => __sw.cover()).catch(() => null));
    if (rec.covers.stuck) { try { await openAlone(page, f, where); await goView(page, view, false); rec.covers.reopened = true; } catch (e) { rec.reopenFailed = firstLine(e); } }
  }
  rec.effect = !!(rec.changed || rec.prints || rec.downloads || rec.popups || rec.filePicker || rec.asked || rec.told || rec.dialog || rec.covers);
  return rec;
}
async function pressAll(page, f, R, where, ev, log) {
  R.presses = []; R.skipped = {};
  const globalDone = new Set(); let total = 0;
  for (const v of await views(page)) {
    if (total >= PRESS_FORM) { R.pressCapped = true; break; }
    await goView(page, v.v, false);
    const done = new Set(), groups = {}; let n = 0;
    for (let guard = 0; guard < PRESS_VIEW * 4 && total < PRESS_FORM; guard++) {
      if ((await curView(page)) !== v.v) await goView(page, v.v, false);
      const list = await page.evaluate(() => __sw.buttons()).catch(() => []);
      let pick = null;
      for (const b of list) {
        if (done.has(b.key) || (b.global && globalDone.has(b.key))) continue;
        const why = SKIP.exec(b.label + ' ' + words(b.id));
        if (why) { R.skipped[(b.label || b.id).slice(0, 40)] = why[0].toLowerCase(); done.add(b.key); if (b.global) globalDone.add(b.key); continue; }
        if ((groups[b.group] || 0) >= 2) { done.add(b.key); continue; }
        if (!b.global && n >= PRESS_VIEW) { done.add(b.key); R.pressCapped = true; continue; }
        pick = b; break;
      }
      if (!pick) break;
      done.add(pick.key); if (pick.global) globalDone.add(pick.key); groups[pick.group] = (groups[pick.group] || 0) + 1;
      if (!pick.global) n++;
      total++;
      R.presses.push(await press(page, f, v.v, pick, where, ev, log));
    }
  }
}

/* ---- step 3: Save data, Open data, Save data ---- */
async function reveal(page, sel) {
  const shown = await page.evaluate(s => { const b = document.querySelector(s); return !!(b && __sw.vis(b)); }, sel).catch(() => false);
  if (!shown && await page.$('#nbhMoreBtn')) { await page.tap('#nbhMoreBtn', {timeout: 3000}).catch(() => page.evaluate(() => document.querySelector('#nbhMoreBtn').click())); await sleep(450); }
}
async function ownSave(page, label) {
  const sel = await page.evaluate(() => { const b = document.querySelector('#saveBtn,#btnSave,#dl-json') || [...document.querySelectorAll('button')].find(x => /^\s*save data\s*$/i.test(x.textContent)); if (!b) return null; if (!b.id) b.id = '__swSave'; return '#' + b.id; });
  if (!sel) return {err: 'no Save data button'};
  await reveal(page, sel);
  let how = 'tap';
  const dlP = page.waitForEvent('download', {timeout: 15000}).catch(() => null);
  try { await page.tap(sel, {timeout: 3000}); } catch (e) { how = 'dom click (' + firstLine(e) + ')'; await page.evaluate(s => document.querySelector(s).click(), sel); }
  const dl = await dlP;
  if (!dl) return {err: 'Save data gave no file', how};
  const file = path.join(OUT, 'files', label + '.json'); await dl.saveAs(file);
  return {file, name: dl.suggestedFilename(), text: fs.readFileSync(file, 'utf8'), how};
}
async function ownOpen(page, file) {
  const sel = await page.evaluate(() => { const b = document.querySelector('#loadBtn,#btnLoad,#up-json') || [...document.querySelectorAll('button')].find(x => /^\s*open data\s*$/i.test(x.textContent)); if (!b) return null; if (!b.id) b.id = '__swOpen'; return '#' + b.id; });
  if (!sel) return 'no Open data button';
  await reveal(page, sel);
  let how = 'Open data, its file picker';
  try { const [fc] = await Promise.all([page.waitForEvent('filechooser', {timeout: 6000}), page.tap(sel, {timeout: 3000})]); await fc.setFiles(file); }
  catch (e) { how = 'the file input (Open data: ' + firstLine(e) + ')'; const inp = await page.$('#fileIn,#fileImport,#file-input'); if (!inp) return 'no file input'; await inp.setInputFiles(file); }
  await sleep(2800);
  await closeDialogs(page);
  return how;
}
async function valuesByView(page) {
  const out = {};
  for (const v of await views(page)) { await goView(page, v.v, false); out[v.v] = await page.evaluate(() => __sw.values()); }
  if (!Object.keys(out).length) out.page = await page.evaluate(() => __sw.values());
  return out;
}
/* what a person sees: on each view, the fields shown there (and the hidden inputs that carry data); a field of another
   view that differs while it is not shown is kept apart (a form may refresh a panel only when its view opens: EA-1's
   session runner) and counts only if it still differs on its own view */
function cmpValues(A, B) {
  const seen = new Set(), diffs = [], unshown = [], shownSame = new Set();
  for (const v of Object.keys(A)) { const a = A[v] || {}, b = B[v] || {}; for (const k of Object.keys(a)) if (a[k].s === 1 && b[k] && b[k].s === 1 && a[k].v === b[k].v) shownSame.add(k); }
  for (const v of Object.keys(A)) {
    const a = A[v] || {}, b = B[v] || {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[k], y = b[k];
      if (x && y && x.v === y.v) continue;
      const d = {key: k, before: x ? x.v.slice(0, 100) : '(no such field)', after: y ? y.v.slice(0, 100) : '(no such field)', what: (x || y).w};
      const sig = J([d.key, d.before, d.after]); if (seen.has(sig)) continue; seen.add(sig);
      d.view = v;
      if ((x && x.s) || (y && y.s)) diffs.push(d); else if (!shownSame.has(k)) unshown.push(d);
    }
  }
  return {diffs, unshown};
}
/* differences between two saved files: 'save time' (a time stamp of the save itself), 'empty' ('' or null against nothing),
   or 'value' */
function saveTime(x) {
  if (typeof x === 'number') return x > T0 - 120000 && x < Date.now() + 120000;
  if (typeof x !== 'string' || x.length > 40) return false;
  if (!/\d{4}-\d\d-\d\d[T ]\d\d:\d\d|\d\d?:\d\d/.test(x)) return false;
  const t = Date.parse(x); return !isNaN(t) && t > T0 - 120000 && t < Date.now() + 120000;
}
function fileDiff(a, b) {
  const out = [];
  let A, B; try { A = JSON.parse(a); B = JSON.parse(b); } catch (e) { return a === b ? [] : [{path: '(not JSON)', kind: 'value'}]; }
  const empty = v => v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length) || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
  const w = (x, y, p) => {
    if (out.length > 200) return;
    if (x && y && typeof x === 'object' && typeof y === 'object' && Array.isArray(x) === Array.isArray(y)) {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) w(x[k], y[k], p + (Array.isArray(x) ? '[' + k + ']' : '.' + k));
      return;
    }
    if (J(x) === J(y)) return;
    /* added: a setting the first file did not have and the form's Open filled with its default (SP-1's chart type) */
    const kind = (saveTime(x) && saveTime(y)) || /\.(saved|savedAt|exported|exportedAt|savedOn|lastSaved)$/.test(p) ? 'save time' : (empty(x) && empty(y)) ? 'empty' : x === undefined ? 'added' : 'value';
    out.push({path: p, kind, a: J(x) === undefined ? '(missing)' : J(x).slice(0, 100), b: J(y) === undefined ? '(missing)' : J(y).slice(0, 100)});
  };
  w(A, B, '');
  return out;
}
async function roundtrip(browser, f, R, where, log) {
  const ctxA = await newCtx(browser, LAND), pA = await ctxA.newPage(); watch(pA, log, where);
  const RT = R.roundtrip = {};
  try {
    RT.sim = await openAlone(pA, f, where);
    await stub(pA, 'accept');
    where.at = 'roundtrip: Save data';
    const A = await ownSave(pA, f.id + '-A');
    RT.saveA = A.err || A.how + ', ' + A.name + ', ' + A.text.length + ' B';
    if (A.err) return;
    where.at = 'roundtrip: the values';
    const VA = await valuesByView(pA);
    RT.fields = Object.values(VA).reduce((n, o) => Math.max(n, Object.keys(o).length), 0);
    if (STEPS.includes('print')) await printStep(pA, f, R, where);
    const ctxB = await newCtx(browser, LAND), pB = await ctxB.newPage(); watch(pB, log, where);
    try {
      where.at = 'roundtrip: fresh load';
      await pB.goto(BASE + '/NBH-Workstation/' + f.file, {waitUntil: 'load', timeout: 60000}); await sleep(1200);
      await stub(pB, 'accept');
      where.at = 'roundtrip: Open data';
      RT.open = await ownOpen(pB, A.file);
      where.at = 'roundtrip: the values after Open data';
      const VB = await valuesByView(pB);
      const cv = cmpValues(VA, VB); RT.fieldDiffs = cv.diffs; RT.unshownDiffs = cv.unshown;
      where.at = 'roundtrip: Save data again';
      const B = await ownSave(pB, f.id + '-B');
      RT.saveB = B.err || B.how + ', ' + B.text.length + ' B';
      if (!B.err) RT.fileDiffs = fileDiff(A.text, B.text);
      RT.asked = await pB.evaluate(() => __sw.asks.map(x => x.k + ' "' + x.t.slice(0, 80) + '" -> ' + x.a)).catch(() => []);
    } finally { await ctxB.close(); }
  } finally { await ctxA.close(); }
}

/* ---- step 4: print ---- */
function pdfInfo(file) {
  const py = [
    'import sys, json', 'import pymupdf as fitz', 'd = fitz.open(sys.argv[1])', "o = {'pages': d.page_count, 'chars': 0, 'noText': [], 'offPage': []}",
    'for i, p in enumerate(d):', '    t = p.get_text().strip()', "    o['chars'] += len(t)", "    if not t and not p.get_images(): o['noText'].append(i + 1)",
    '    W, H = p.rect.width, p.rect.height', "    ws = p.get_text('words', clip=fitz.INFINITE_RECT())",
    '    off = [w[4] for w in ws if w[2] > W + 1 or w[0] < -1 or w[3] > H + 1]', "    if off: o['offPage'].append({'page': i + 1, 'words': len(off), 'sample': ' '.join(off[:8])[:80]})",
    'print(json.dumps(o))'].join('\n');
  try { return JSON.parse(execFileSync('python3', ['-I', '-c', py, file], {encoding: 'utf8', timeout: 60000})); } catch (e) { return {err: firstLine(e)}; }
}
async function printStep(page, f, R, where) {
  where.at = 'print';
  const P = R.print = {};
  const vp = page.viewportSize();
  try {
    const box = P.box = await page.evaluate(() => __sw.pageBox());
    await page.emulateMedia({media: 'print'});
    await page.setViewportSize({width: Math.round(box.cw), height: Math.round(box.ch)});
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await sleep(900);
    P.layout = await page.evaluate(() => __sw.printCheck());
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await sleep(300);
    await page.setViewportSize(vp);
    const file = path.join(OUT, 'pdf', f.id + '.pdf');
    await page.pdf({path: file, format: 'Letter', printBackground: true, preferCSSPageSize: true});
    P.pdf = pdfInfo(file); P.file = 'qa/out/sweep/pdf/' + f.id + '.pdf';
  } catch (e) { P.err = firstLine(e); }
  finally { await page.emulateMedia({media: 'screen'}).catch(() => {}); await page.setViewportSize(vp).catch(() => {}); }
}

/* ---- PART alone ---- */
async function alone(browser, f) {
  const R = {id: f.id, file: f.file, part: 'alone', layout: {}, errors: []}, t0 = Date.now();
  const log = [];
  /* each in a context of its own: a form opened again in the same browser offers its safety copy (Autosave), which is
     not what is being tested here */
  const runs = [];
  if (STEPS.includes('layout')) runs.push(['landscape', LAND, 'layout'], ['portrait', PORT, 'layout']);
  if (STEPS.includes('buttons')) runs.push(['buttons', LAND, 'buttons']);
  for (const [name, vp, what] of runs) {
    const where = {at: ''}, ctx = await newCtx(browser, vp), page = await ctx.newPage(), ev = watch(page, log, where);
    try {
      R['sim_' + name] = await openAlone(page, f, where);
      if (what === 'layout') await walk(page, f, R, where, name);
      else await pressAll(page, f, R, where, ev, log);
      R.errors.push(...(await page.evaluate(() => __sw.errs.slice()).catch(() => [])).map(t => ({t: 'in page', at: name, text: t})));
    } catch (e) { R['stopped_' + name] = firstLine(e); }
    finally { await ctx.close().catch(() => {}); }
  }
  if (STEPS.includes('roundtrip') || STEPS.includes('print')) {
    const where = {at: ''};
    try { await roundtrip(browser, f, R, where, log); } catch (e) { R.roundtripStopped = firstLine(e); }
  }
  R.errors.push(...errsOf(log));
  R.secs = Math.round((Date.now() - t0) / 1000);
  return R;
}

/* ---- PART shell ---- */
async function frameOf(sh, id) {
  for (let i = 0; i < 40; i++) {
    const h = await sh.evaluateHandle(id => state.frames[id] || null, id).catch(() => null);
    const el = h && h.asElement(); const fr = el ? await el.contentFrame() : null;
    if (fr && !fr.isDetached() && await fr.evaluate(() => !!window.__sw && document.readyState !== 'loading').catch(() => false)) return fr;
    await sleep(250);
  }
  return null;
}
const snapOf = (sh, id) => sh.evaluate(async id => { const r = await grab(id, 'snapshot', null, 20000); return r && r.snap ? r.snap : null; }, id);
/* every view of the form in the frame shown once, as a person looking through it would, and back to the one it was on:
   a panel a form refreshes when its view opens is then read as it is shown */
async function lookThrough(fr) {
  const was = await curView(fr);
  for (const v of await views(fr)) { await fr.evaluate(v => { const b = document.querySelector('#viewSeg button[data-view="' + CSS.escape(v) + '"]'); if (b) b.click(); }, v.v).catch(() => {}); await sleep(300); }
  if (was) { await fr.evaluate(v => { const b = document.querySelector('#viewSeg button[data-view="' + CSS.escape(v) + '"]'); if (b) b.click(); }, was).catch(() => {}); await sleep(300); }
}
function snapDiff(A, B) {
  const out = {fields: [], own: []};
  if (!A || !B) return {missing: !A ? 'first' : 'second'};
  out.total = A.total === B.total ? A.total : A.total + ' -> ' + B.total;
  for (const k of new Set([...Object.keys(A.data || {}), ...Object.keys(B.data || {})])) {
    const x = (A.data || {})[k], y = (B.data || {})[k];
    if (J(x) === J(y)) continue;
    out.fields.push({key: k, before: x === undefined ? '(no such field)' : J(x).slice(0, 100), after: y === undefined ? '(no such field)' : J(y).slice(0, 100)});
  }
  if ((A.own || '') !== (B.own || '')) out.own = A.own && B.own ? fileDiff(A.own, B.own) : [{path: '(own file)', kind: 'value', a: A.own ? 'present' : '(none)', b: B.own ? 'present' : '(none)'}];
  return out;
}
async function shellPart(sh, f, log, where) {
  const R = {id: f.id, file: f.file, part: 'shell', errors: []}, t0 = Date.now(), l0 = log.length;
  try {
    where.at = 'shell: openForm';
    await sh.evaluate(id => openForm(id), f.id);
    const ok = await sh.waitForFunction(id => !!state.status[id] && !!state.frames[id], f.id, {timeout: 40000}).then(() => true).catch(() => false);
    if (!ok) { R.opened = false; return R; }
    R.opened = true;
    let fr = await frameOf(sh, f.id);
    if (!fr) { R.frame = 'no frame'; return R; }
    await stub(fr, 'accept');
    where.at = 'shell: the simulation';
    R.sim = await loadSim(fr); await sleep(2600);
    await closeDialogs(fr).catch(() => {});
    await lookThrough(fr);
    const A = await snapOf(sh, f.id);
    R.snapA = A ? {total: A.total, own: A.own ? A.own.length : 0} : null;
    where.at = 'shell: Save case';
    const dlP = sh.waitForEvent('download', {timeout: 60000}).catch(() => null);
    R.saveCase = await sh.evaluate(async () => { try { return await saveCase(); } catch (e) { return 'threw ' + (e && e.message); } });
    const dl = await dlP;
    if (!dl) { R.caseFile = 'no file'; return R; }
    const cf = path.join(OUT, 'case', f.id + '.case.json'); await dl.saveAs(cf);
    const text = fs.readFileSync(cf, 'utf8'); let C = null;
    try { const d = JSON.parse(text); C = d.forms && d.forms[f.id] && d.forms[f.id].snap; R.caseFile = Object.keys(d.forms || {}).join(',') + ', ' + text.length + ' B'; } catch (e) { R.caseFile = 'unreadable: ' + firstLine(e); }
    R.frameErrorsA = await fr.evaluate(() => __sw.errs.slice()).catch(() => []);
    where.at = 'shell: clearCase';
    await sh.evaluate(() => clearCase()); await sleep(700);
    R.clearedFrames = await sh.evaluate(() => Object.keys(state.frames).length + Object.keys(state.pending).length);
    where.at = 'shell: openCaseText';
    await sh.evaluate(t => openCaseText(t, null), text); await sleep(900);
    await sh.evaluate(id => { if (state.cur !== id || !state.frames[id]) openForm(id); }, f.id);
    const ok2 = await sh.waitForFunction(id => !!state.frames[id] && !!state.status[id] && !state.pending[id], f.id, {timeout: 40000}).then(() => true).catch(() => false);
    R.reopened = ok2;
    await sh.evaluate(id => settled(id, 20000), f.id).catch(() => {});
    await sleep(1800);
    fr = await frameOf(sh, f.id);
    if (fr) await stub(fr, 'accept');
    const B0 = await snapOf(sh, f.id);
    if (fr) await lookThrough(fr);
    const B = await snapOf(sh, f.id);
    R.diff = snapDiff(A, B);
    const d0 = snapDiff(A, B0); R.diffBeforeLooking = d0.fields ? d0.fields.slice(0, 20) : d0;   /* as it opened, before its views were shown */
    R.diffFile = C ? snapDiff(C, B) : 'no snapshot in the case file';
    R.diffSaved = C ? snapDiff(A, C) : null;
    R.frameErrorsB = fr ? await fr.evaluate(() => __sw.errs.slice()).catch(() => []) : [];
    R.asked = await sh.evaluate(() => __sw.asks.slice(-6).map(x => x.k + ' "' + x.t.slice(0, 80) + '" -> ' + x.a)).catch(() => []);
  } catch (e) { R.stopped = firstLine(e); }
  finally {
    where.at = 'shell: clearCase after';
    await sh.evaluate(() => clearCase()).catch(() => {}); await sleep(500);
    R.errors = errsOf(log.slice(l0)).concat((R.frameErrorsA || []).concat(R.frameErrorsB || []).map(t => ({t: 'in frame', text: t})));
    R.secs = Math.round((Date.now() - t0) / 1000);
  }
  return R;
}
async function shellPage(browser, file, log, where) {
  const ctx = await newCtx(browser, LAND), sh = await ctx.newPage(); watch(sh, log, where);
  where.at = 'shell: load';
  await sh.goto(BASE + file, {waitUntil: 'load', timeout: 120000});
  await sh.waitForFunction(() => typeof openForm === 'function' && typeof state === 'object', null, {timeout: 120000});
  await sleep(1200);
  await stub(sh, 'accept');
  return sh;
}

/* ---- PART single ---- */
async function singlePart(sh, f, log, where) {
  const R = {id: f.id, file: f.file, part: 'single', errors: []}, t0 = Date.now(), l0 = log.length;
  try {
    where.at = 'single: openForm ' + f.id;
    await sh.evaluate(id => openForm(id), f.id);
    R.opened = await sh.waitForFunction(id => !!state.status[id] && !!state.frames[id], f.id, {timeout: 60000}).then(() => true).catch(() => false);
    const fr = R.opened ? await frameOf(sh, f.id) : null;
    if (fr) {
      await stub(fr, 'accept');
      where.at = 'single: the simulation ' + f.id;
      R.sim = await loadSim(fr); await sleep(2200);
      R.views = (await views(fr)).length;
      R.frameErrors = await fr.evaluate(() => __sw.errs.slice()).catch(() => []);
      R.filled = await sh.evaluate(id => (state.status[id] || {}).filled, f.id);
    } else R.frame = 'no frame';
  } catch (e) { R.stopped = firstLine(e); }
  finally {
    await sh.evaluate(() => clearCase()).catch(() => {}); await sleep(400);
    R.errors = errsOf(log.slice(l0)).concat((R.frameErrors || []).map(t => ({t: 'in frame', text: t})));
    R.secs = Math.round((Date.now() - t0) / 1000);
  }
  return R;
}

/* ======================= verdicts ======================= */
const uniq = a => [...new Set(a)];
function verdict(R) {
  const fail = [], warn = [];
  const errs = uniq((R.errors || []).filter(e => !/^ResizeObserver loop/.test(e.text || '')).map(e => (e.t || '') + ': ' + e.text));
  if (errs.length) fail.push(errs.length + ' error' + (errs.length > 1 ? 's' : '') + ' (' + errs[0].slice(0, 90) + ')');
  if (R.part === 'alone') {
    if (R.stopped_buttons) fail.push('buttons stopped: ' + R.stopped_buttons);
    for (const o of ['landscape', 'portrait']) {
      if (R['stopped_' + o]) fail.push(o + ' stopped: ' + R['stopped_' + o]);
      const V = R.layout && R.layout[o]; if (!V) continue;
      const all = [];
      for (const [v, x] of Object.entries(V.views)) { all.push([v, x.layout, x.shown]); for (const [t, y] of Object.entries(x.tabs || {})) all.push([v + '>' + t, y.layout, y.tapErr ? 'tap failed' : 'ok']); }
      const cnt = k => all.filter(([, L]) => L && L[k] && (Array.isArray(L[k]) ? L[k].length : L[k])).map(([v]) => v);
      const notShown = all.filter(([, , s]) => s && s !== 'ok').map(([v, , s]) => v + ': ' + s); if (notShown.length) fail.push(o + ' view not shown/tapped: ' + notShown.slice(0, 3).join('; '));
      const hs = cnt('hscroll'); if (hs.length) fail.push(o + ' sideways scroll on ' + hs.join(','));
      const wd = cnt('wide'); if (wd.length) fail.push(o + ' cut at the right edge on ' + wd.join(','));
      const cv = all.filter(([, L]) => L && L.covered && L.covered.length).map(([v, L]) => v + '(' + L.covered.length + (L.covered.some(c => c.byCtrl) ? ', by a control' : '') + ')'); if (cv.length) fail.push(o + ' covered controls on ' + cv.join(','));
      const ub = cnt('underBars'); if (ub.length) fail.push(o + ' a control under a fixed bar at the page end on ' + ub.join(','));
      const cl = all.filter(([, L]) => L && L.clip && L.clip.some(c => !c.ellipsis && !c.clamp)).map(([v]) => v); if (cl.length) fail.push(o + ' text cut off in a box on ' + cl.join(','));
      const sp = cnt('spill'); if (sp.length) fail.push(o + ' button text spills out on ' + sp.join(','));
      const sm = {}; all.forEach(([, L]) => L && L.small && Object.entries(L.small).forEach(([g, s]) => { sm[g] = Math.max(sm[g] || 0, s.n); }));
      const smn = Object.values(sm).reduce((a, b) => a + b, 0); if (smn) warn.push(o + ' ' + smn + ' controls under 44 px');
      const sc = cnt('selectCut').length + cnt('inputCut').length + cnt('taCut').length; if (sc) warn.push(o + ' field text not fitting on ' + sc + ' views');
    }
    if (R.presses) {
      const bad = R.presses.filter(p => p.errors || p.thrown || p.pageGone || (p.dialog && (p.dialog.stuck || p.dialog.invisible)) || (p.covers && p.covers.stuck) || (p.tapFailed && !p.tapNested) || p.navigated);
      if (bad.length) fail.push(bad.length + ' button press problem' + (bad.length > 1 ? 's' : '') + ' (' + bad.slice(0, 3).map(p => (p.id ? '#' + p.id : '"' + p.label.slice(0, 24) + '"') + ': ' + (p.errors ? 'error' : p.thrown ? 'threw' : p.pageGone ? 'page gone' : p.dialog && p.dialog.invisible ? 'an unseen modal dialog left the page inert' : p.dialog && p.dialog.stuck ? 'dialog stuck' : p.covers && p.covers.stuck ? 'left the screen covered' : p.navigated ? 'navigated' : 'tap did not land')).join('; ') + ')');
      const none = R.presses.filter(p => !p.gone && p.effect === false); if (none.length) warn.push(none.length + ' buttons with no visible effect');
    }
    const RT = R.roundtrip;
    if (R.roundtripStopped) fail.push('roundtrip stopped: ' + R.roundtripStopped);
    if (RT) {
      if (/^no |gave no/.test(RT.saveA || '')) fail.push('Save data: ' + RT.saveA);
      if (RT.fieldDiffs && RT.fieldDiffs.length) { const real = RT.fieldDiffs.filter(d => !/^toolbar/.test(d.what)); if (real.length) fail.push('roundtrip: ' + real.length + ' field' + (real.length > 1 ? 's' : '') + ' differ (' + real[0].key + ': ' + J(real[0].before).slice(0, 30) + ' -> ' + J(real[0].after).slice(0, 30) + ')'); if (real.length < RT.fieldDiffs.length) warn.push('roundtrip: ' + (RT.fieldDiffs.length - real.length) + ' toolbar fields differ'); }
      if (RT.unshownDiffs && RT.unshownDiffs.length) warn.push('roundtrip: ' + RT.unshownDiffs.length + ' fields differ only while their view is not shown');
      if (RT.fileDiffs) { const v = RT.fileDiffs.filter(d => d.kind === 'value'), e = RT.fileDiffs.filter(d => d.kind === 'empty'), a = RT.fileDiffs.filter(d => d.kind === 'added'); if (v.length) fail.push('roundtrip: the second file differs in ' + v.length + ' place' + (v.length > 1 ? 's' : '') + ' (' + v[0].path + ')'); if (e.length) warn.push('roundtrip: ' + e.length + ' empty values written differently'); if (a.length) warn.push('roundtrip: the second file adds ' + a.map(d => d.path + '=' + d.b).join(', ').slice(0, 80) + ' (a default)'); }
      if (/^no |gave no/.test(RT.saveB || '')) fail.push('Save data after Open data: ' + RT.saveB);
    }
    const P = R.print;
    if (P) {
      if (P.err) fail.push('print: ' + P.err);
      if (P.pdf && (P.pdf.err || !P.pdf.pages || P.pdf.chars < 100)) fail.push('print: ' + (P.pdf.err || 'empty PDF (' + P.pdf.pages + ' pages, ' + P.pdf.chars + ' characters)'));
      if (P.pdf && P.pdf.offPage && P.pdf.offPage.length) fail.push('print: words off the page on ' + P.pdf.offPage.length + ' pages');
      if (P.layout && (P.layout.wide.length || P.layout.hscroll)) fail.push('print: ' + (P.layout.wide.length || 'content') + ' element(s) wider than the page (' + ((P.layout.wide[0] || {}).el || 'page ' + P.layout.scrollW + ' > ' + P.layout.w) + ')');
      if (P.layout && P.layout.clip.some(c => !c.ellipsis)) fail.push('print: ' + P.layout.clip.filter(c => !c.ellipsis).length + ' boxes or chart labels cut their text on paper (' + P.layout.clip.find(c => !c.ellipsis).text + ')');
      if (P.layout && (P.layout.taCut.length || P.layout.inputCut.length || P.layout.selectCut.length)) { const c = P.layout.taCut.concat(P.layout.inputCut, P.layout.selectCut); fail.push('print: ' + c.length + ' fields whose text is cut on paper (' + J(c[0].text) + ' ' + (c[0].at || '') + ')'); }
      if (P.pdf && P.pdf.noText && P.pdf.noText.length) warn.push('print: pages without text ' + P.pdf.noText.join(','));
    }
  }
  if (R.part === 'shell') {
    if (R.stopped) fail.push('stopped: ' + R.stopped);
    if (R.opened === false) fail.push('the form did not open');
    if (R.frame) fail.push(R.frame);
    if (R.caseFile && /^no file|^unreadable/.test(R.caseFile)) fail.push('Save case: ' + R.caseFile);
    if (R.reopened === false) fail.push('the form did not open from the case');
    const d = R.diff;
    if (d && d.missing) fail.push('no snapshot (' + d.missing + ')');
    if (d && d.fields && d.fields.length) fail.push(d.fields.length + ' field' + (d.fields.length > 1 ? 's' : '') + ' differ after the case round trip (' + d.fields[0].key + ': ' + d.fields[0].before.slice(0, 30) + ' -> ' + d.fields[0].after.slice(0, 30) + ')');
    if (d && d.own && d.own.filter(x => x.kind === 'value').length) fail.push('the form\'s own file differs after the case round trip in ' + d.own.filter(x => x.kind === 'value').length + ' places (' + d.own.find(x => x.kind === 'value').path + ')');
    if (d && d.own && d.own.filter(x => x.kind === 'added').length) warn.push('the form\'s own file adds ' + d.own.filter(x => x.kind === 'added').map(x => x.path + '=' + x.b).join(', ').slice(0, 80) + ' (a default)');
    if (Array.isArray(R.diffBeforeLooking) && R.diffBeforeLooking.length && d && d.fields && !d.fields.length) warn.push(R.diffBeforeLooking.length + ' fields differ until their view is shown (' + R.diffBeforeLooking[0].key + ')');
    if (d && d.total && /->/.test(String(d.total))) fail.push('field count ' + d.total);
  }
  if (R.part === 'single') {
    if (R.stopped) fail.push('stopped: ' + R.stopped);
    if (!R.opened) fail.push('the form did not open');
    if (R.frame) fail.push(R.frame);
  }
  return {status: fail.length ? 'FAIL' : warn.length ? 'WARN' : 'PASS', fail, warn};
}
function summary() {
  const lines = ['# Sweep results', '', 'Rebuilt from every result in qa/out/sweep/<part>/ (' + new Date().toISOString() + '). FAIL: an error, broken layout, a button that breaks, data that changes; WARN: touch sizes, text that does not fit, buttons with no visible effect.', ''];
  for (const part of ['alone', 'shell', 'single']) {
    const dir = path.join(OUT, part); const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => /\.json$/.test(x)) : [];
    if (!files.length) continue;
    const order = forms().map(f => f.id);
    const rs = files.map(x => { try { return JSON.parse(fs.readFileSync(path.join(dir, x), 'utf8')); } catch (e) { return null; } }).filter(Boolean).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const vs = rs.map(r => [r, verdict(r)]);
    lines.push('## ' + part + ' (' + vs.filter(([, v]) => v.status !== 'FAIL').length + ' of ' + vs.length + ' without a failure)', '', '| Form | Result | Failures | Warnings | s |', '|---|---|---|---|---|');
    vs.forEach(([r, v]) => lines.push('| ' + r.id + ' | ' + v.status + ' | ' + (v.fail.join('; ').replace(/\|/g, '/') || '') + ' | ' + (v.warn.join('; ').replace(/\|/g, '/') || '') + ' | ' + (r.secs || '') + ' |'));
    lines.push('');
  }
  fs.writeFileSync(path.join(OUT, 'summary.md'), lines.join('\n') + '\n');
}

/* ======================= run ======================= */
(async () => {
  if (process.env.PART === 'summary') { summary(); console.log('summary: qa/out/sweep/summary.md'); console.log('DONE summary'); process.exit(0); }   /* rebuilt from the results there */
  const list = forms('NBH-Workstation').filter(f => !ONLY.length || ONLY.includes(f.id));
  if (!list.length) { console.log('no forms match ONLY=' + ONLY.join(',')); console.log('DONE'); process.exit(2); }
  const browser = await chromium.launch({args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']});
  const tally = {};
  const say = (part, R) => {
    const v = verdict(R); (tally[part] = tally[part] || {PASS: 0, WARN: 0, FAIL: 0})[v.status]++;
    fs.writeFileSync(path.join(OUT, part, R.id + '.json'), J(R, null, 1));
    console.log(v.status.padEnd(4) + ' ' + part.padEnd(6) + ' ' + R.id.padEnd(6) + ' ' + (v.fail.length ? v.fail.join('; ') : v.warn.join('; ')).slice(0, 600) + '  (' + (R.secs || 0) + ' s)');
  };
  for (const part of PARTS) {
    let next = 0;
    const worker = async () => {
      let sh = null; const log = [], where = {at: ''};
      try {
        if (part === 'shell') sh = await shellPage(browser, '/NBH-Workstation/index.html', log, where);
        if (part === 'single') sh = await shellPage(browser, '/deliver/NBH-Workstation.html', log, where);
      } catch (e) { console.log('FAIL ' + part + ' the workstation page did not load: ' + firstLine(e)); return; }
      while (next < list.length) {
        const f = list[next++]; let R;
        try {
          if (part === 'alone') R = await withTimeout(alone(browser, f), 20 * 60000, f.id + ' alone');
          else if (part === 'shell') R = await withTimeout(shellPart(sh, f, log, where), 4 * 60000, f.id + ' shell');
          else if (part === 'single') R = await withTimeout(singlePart(sh, f, log, where), 3 * 60000, f.id + ' single');
          else { console.log('unknown PART ' + part); break; }
        } catch (e) { R = {id: f.id, file: f.file, part, stopped: firstLine(e), errors: []}; if (part === 'alone') R['stopped_landscape'] = R.stopped; }
        say(part, R);
      }
      if (sh) await sh.context().close().catch(() => {});
    };
    await Promise.all(Array.from({length: Math.min(part === 'alone' ? JOBS : Math.min(JOBS, 2), list.length)}, worker));
  }
  await browser.close();
  summary();
  console.log('summary: qa/out/sweep/summary.md');
  console.log('DONE ' + Object.entries(tally).map(([p, t]) => p + ' ' + t.PASS + ' pass, ' + t.WARN + ' warn, ' + t.FAIL + ' fail').join('; ') + ' in ' + Math.round((Date.now() - T0) / 1000) + ' s');
  process.exit(0);
})();
