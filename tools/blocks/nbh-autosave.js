/* nbh-autosave (v21.44): what a form changed, and its safety copy when it is opened on its own.
   - window.nbhState: a short hash of what Save data would write (the bridge's silent save, the time stamp left out), so a
     tap that changes the record (a scored interval, a ranked item, a mark on a grid) counts as a change exactly as typing
     does. The bridge adds it to the status every form reports to the workstation (its unsaved dot and its Autosave), and
     the leave guard and the quick Save use it for this form's own unsaved mark. It is worked out again shortly after a
     tap, a key or a message from the workstation, and every few seconds while the page is changing on its own.
   - Opened on its own (its own tab, a direct link, not inside the workstation): the form keeps a safety copy of its work
     in this browser (window.nbhCopies, the same store the workstation uses) a moment after each change and at once when
     the tab is hidden or closed, and on opening offers back any copy holding this form. A tab the workstation opened
     with Own tab is handed the work by the workstation and is not offered anything until it has had the chance.
   - A paragraph in the form's Guide says where the copies are kept and what they are for.
   Nothing here makes a network request, changes the saved file, or shows anything while nothing is pending; it prints
   nothing (its parts carry noprint and are hidden on paper). */
(function () {
  'use strict';
  if (window.nbhState) return;
  var W = window, D = document, C = W.nbhCopies;
  function B() { return W.nbhBridge || null; }
  var framed = (function () { try { return W.parent !== W; } catch (e) { return true; } })();

  /* ---- the form's whole state ---- */
  var H = { own: '', text: null, base: null, saved: null, busy: null, again: false, t: 0, first: 0, frozen: false, saveNext: false, noMark: 0, mut: false, gap: 4000, last: 0, rebase: 0 };
  var subs = [];
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + '-' + s.length.toString(36); }
  function norm(t) { return String(t).replace(/"(saved|exported|savedAt|exportedAt)"\s*:\s*"[^"]*"/g, ''); }
  function compute() {
    var b = B();
    if (!b || !b.ownSave) return Promise.resolve(H.own);
    if (H.busy) { H.again = true; return H.busy; }
    clearTimeout(H.t); H.first = 0;
    var p = b.ownSave().then(function (text) {
      var s = took(text, b);
      H.busy = null;
      if (H.again) { H.again = false; soon(60); }
      return s;
    }, function () { H.busy = null; return H.own; });
    H.busy = p;
    return p;
  }
  /* a fresh copy of the file (worked out here, or by the bridge for the workstation) brings the hash up to date */
  function took(text, b) {
    var s = text ? hash(norm(text)) : ('v' + (b && b.valueSig ? b.valueSig() : ''));
    var was = H.own;
    H.text = text || null; H.own = s;
    if (!H.frozen || H.base === null || Date.now() < H.rebase) H.base = s;   /* rebase: a case file just opened, not a change */
    if (!H.frozen || H.saved === null || H.saveNext || Date.now() < H.rebase) { H.saved = s; H.saveNext = false; }
    if (s !== was) for (var i = 0; i < subs.length; i++) { try { subs[i](s); } catch (e) {} }
    return s;
  }
  function soon(ms) { clearTimeout(H.t); H.t = setTimeout(compute, ms); }
  function touch(e) {
    if (W.__nbhQuiet || W.__nbhSilent) return;   /* the bridge's own silent save, or the CSV read */
    var t = e && e.target;
    if (t && t.closest && t.closest('.nbh-as-ui')) return;
    if (!H.frozen && H.base !== null) H.frozen = true;   /* from the first tap or key on, a change is the user's */
    H.rebase = 0;
    H.gap = 4000;
    var now = Date.now();
    if (!H.first) H.first = now;
    soon(now - H.first > 2500 ? 0 : 450);
  }
  ['input', 'change', 'click', 'keyup', 'drop', 'paste', 'cut'].forEach(function (t) { D.addEventListener(t, touch, true); });
  try {
    new MutationObserver(function () { if (!H.busy && !W.__nbhQuiet) H.mut = true; })
      .observe(D.documentElement, { childList: true, subtree: true, characterData: true });
  } catch (e) {}
  /* a page that keeps changing on its own (a timer, a walkthrough playing) is looked at less and less often while what
     Save data would write stays the same: every 4 s at first, then up to every 32 s; a tap or a key starts again at 4 s */
  setInterval(function () {
    if (!H.mut || D.hidden || Date.now() - H.last < H.gap) return;
    H.mut = false; H.last = Date.now(); var was = H.own;
    compute().then(function (s) { H.gap = s === was ? Math.min(H.gap * 2, 32000) : 4000; });
  }, 4000);
  W.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (!d || !d.nbh) return;
    /* a safety copy put back is work not in a file; a case file opened is where the form now starts (it is in a file), so
       the workstation keeps no copy of it until something is changed */
    if (d.nbh === 'restore' && d.snap) { H.frozen = true; if (d.copy) H.noMark = Date.now() + 5000; else H.rebase = Date.now() + 3600; soon(1600); setTimeout(compute, 3200); }
    else if (d.nbh === 'facts' || d.nbh === 'packet' || d.nbh === 'plan') soon(1000);
  });
  /* what Save data would write, at once: a page being closed cannot wait for the bridge's FileReader, so the text is
     taken from the Blob as the form makes it. null when the form builds its file some other way (the last hash stands) */
  function syncText() {
    var btn = D.querySelector('#saveBtn,#btnSave,#dl-json') || Array.prototype.filter.call(D.querySelectorAll('button'), function (x) { return /^\s*save data\s*$/i.test(x.textContent); })[0];
    if (!btn || !W.Blob) return null;
    var RB = W.Blob, mk = URL.createObjectURL, clk = HTMLAnchorElement.prototype.click, al = W.alert, cf = W.confirm, pr = W.prompt, q = W.__nbhQuiet, parts = null;
    try {
      W.Blob = function (ps, o) { if (!parts && ps && /json/i.test((o && o.type) || 'json')) parts = Array.prototype.slice.call(ps); return new RB(ps, o); };
      W.Blob.prototype = RB.prototype;
      URL.createObjectURL = function () { return 'blob:nbh-held'; };
      HTMLAnchorElement.prototype.click = function () { if (this.getAttribute('href') === 'blob:nbh-held' || this.hasAttribute('download')) return; return clk.apply(this, arguments); };
      W.alert = function () {}; W.confirm = function () { return true; }; W.prompt = function () { return ''; };
      W.__nbhQuiet = true;
      btn.click();
    } catch (e) { parts = null; }
    finally { W.Blob = RB; URL.createObjectURL = mk; HTMLAnchorElement.prototype.click = clk; W.alert = al; W.confirm = cf; W.prompt = pr; W.__nbhQuiet = q; }
    if (!parts) return null;
    for (var i = 0; i < parts.length; i++) if (typeof parts[i] !== 'string') return null;
    var t = parts.join('');
    return t.length > 2 ? t : null;
  }
  /* the form as it is this instant, for the workstation's last word when its tab closes (called from the workstation) */
  function last() {
    var b = B(); if (!b) return null;
    var t = null; try { t = syncText(); } catch (e) {}
    if (t) took(t, b);
    if (!H.text) return null;
    var sn = b.snapshot();
    return { title: b.formTitle(), total: sn.total, data: sn.data, own: H.text, edited: edited() };
  }
  function edited() { return H.base !== null && H.own !== H.base; }
  function unsaved() { return H.saved !== null && H.own !== H.saved && H.own !== H.base; }
  W.nbhState = {
    sig: function () { return H.own; },
    status: function (st) { st.sig = (st.sig || '') + '.' + H.own; st.edited = edited(); return st; },
    edited: edited,
    unsaved: unsaved,
    markSaved: function () { if (Date.now() < H.noMark) return; H.saveNext = true; compute(); },
    differs: function (text) { if (text && H.base !== null) took(text, B()); return H.base !== null && H.own !== H.base; },
    now: compute,
    last: last,
    text: function () { return H.text; },
    on: function (f) { subs.push(f); }
  };
  function start() { setTimeout(compute, 250); setTimeout(compute, 1400); guide(); css(); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();

  /* ---- words in the Guide, and the look of the offer ---- */
  function css() {
    if (D.getElementById('nbh-autosave-css')) return;
    var s = D.createElement('style'); s.id = 'nbh-autosave-css'; s.setAttribute('data-nbh-screen', '');
    s.textContent = '@media print{.nbh-as-ui,.nbh-as-guide{display:none!important}}' +
      '.nbh-as-dlg{position:fixed;right:16px;bottom:16px;z-index:2147483000;max-width:480px;width:calc(100% - 32px);box-sizing:border-box;max-height:70vh;overflow:auto;border:1px solid #c9d3da;border-radius:6px;padding:14px 16px;color:#16242e;background:#fff;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.18)}' +
      '.nbh-as-dlg h2{font-size:17px;margin:0 0 8px}.nbh-as-dlg ul{list-style:none;padding:0;margin:10px 0}' +
      '.nbh-as-dlg li{border-top:1px solid #e3e8ec;padding:9px 0;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}' +
      '.nbh-as-dlg li span{flex:1 1 260px}.nbh-as-dlg small{color:#4a5a66;display:block}' +
      '.nbh-as-dlg button{font:inherit;min-height:36px;padding:4px 12px;border:1px solid #9fb0bc;border-radius:4px;background:#fff;color:#16242e;cursor:pointer}' +
      '.nbh-as-dlg button.pri{background:#16242e;color:#fff;border-color:#16242e}.nbh-as-dlg .nbh-as-note{font-size:12.5px;color:#4a5a66;margin:8px 0 12px}';
    (D.head || D.documentElement).appendChild(s);
  }
  var WORDS = '<b>Autosave.</b> While you work, a safety copy of this form is kept in this browser on this device, also when the form is opened on its own, and offered back if the page closes or reloads before you save. Copies never leave the device. They are protected by the iPad’s passcode, not by the form: on a shared iPad, delete them or turn Autosave off (the Autosave button in the workstation). The installed app and Safari keep separate copies, and Safari may clear a site’s storage after 7 days without a visit. A copy is a safety net; the file Save data writes is the record.';
  function guide() {
    var g = D.querySelector('#guide, section.only-guide, [data-pane="guide"], #ddlGuide');
    if (!g || g.querySelector('.nbh-as-guide')) return;
    var p = D.createElement('p'); p.className = 'nbh-as-guide noprint'; p.innerHTML = WORDS;
    g.appendChild(p);
  }

  /* ---- a form opened on its own keeps its own safety copy ---- */
  if (framed || !C) return;
  var tab = C.tabId(), seq = 0, key = 'f-' + tab, student = '', lastSig = '', timer = 0, warned = '', handed = false, asked = false, replaces = '', overTold = false;
  var ownTab = /^nbh-own\|/.test(String(W.name || ''));
  var IOS = /iP(ad|hone|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  C.hold(tab);
  function on() { return !!C.mode() && !C.isOff(); }
  function tell(msg, warn) {
    try { if (W.nbhUI && W.nbhUI.toast) { W.nbhUI.toast(msg, { kind: warn ? 'warn' : '' }); return; } } catch (e) {}
  }
  function record() {
    var b = B();
    if (!b || !on() || !unsaved() || !H.text) return null;   /* only work not yet in a file */
    var id = b.formId(), who = String(b.who() || '').trim();
    if (student && who && !C.same(student, who)) { seq++; key = 'f-' + tab + '-' + seq; }   /* another student: a copy of its own */
    if (who) student = who;
    var sn = b.snapshot(), forms = {};
    forms[id] = { title: b.formTitle(), total: sn.total, data: sn.data, own: H.text };
    return { key: key, kind: 'form', tab: tab, form: id, student: student, saved: new Date().toISOString(), forms: forms };
  }
  function write() {
    if (H.own === lastSig) return Promise.resolve(false);
    var sig = H.own, rec = record();
    if (!rec) return Promise.resolve(false);
    return C.put(rec).then(function (r) {
      if (r.ok) {
        lastSig = sig;
        if (replaces && replaces !== rec.key) { C.del(replaces); replaces = ''; }   /* the copy restored here now lives in this one */
        C.over().then(function (n) { if (n > 0 && !overTold) { overTold = true; tell('Autosave keeps ' + (n + C.KEEP) + ' safety copies in this browser. Delete the ones you no longer need (the Autosave button in the workstation); none is deleted without asking, except after ' + C.DAYS + ' days.', true); } });
        var w = Object.keys(r.picsLost || {}).length ? 'pics' : '';
        if (w && warned !== w) { warned = w; tell('Autosave: this browser is short of room, so the safety copy of this form was kept without its pictures. Save data keeps everything.', true); }
        if (!w) warned = '';
      } else if (r.why === 'quota' && warned !== 'full') {
        warned = 'full'; tell('Autosave could not keep a copy: this browser’s storage is full. Autosave stays on and tries again; Save data keeps your work in a file.', true);
      }
      return r.ok;
    }, function () { return false; });
  }
  W.nbhState.on(function () { clearTimeout(timer); timer = setTimeout(write, 1200); });
  function flush() { clearTimeout(timer); write(); }
  /* closing or reloading: the store's write would not finish, so the latest text is stashed at once as well */
  function lastWord() {
    try { if (!on()) return; var t = syncText(); if (t) took(t, B()); if (H.own === lastSig) return; var rec = record(); if (rec) C.stash(rec); } catch (e) {}
  }
  D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') { flush(); compute().then(write); } });
  W.addEventListener('pagehide', function () { lastWord(); flush(); });
  /* the form's own Save data: the copy is no longer needed (on an iPad, where the download cannot be confirmed, it is
     kept and marked); Open or Clear all: the copy stays as it was and later work goes into a new one */
  D.addEventListener('click', function (e) {
    if (W.__nbhQuiet || W.__nbhSilent) return;
    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b || b.closest('.nbh-as-ui')) return;
    var save = b.matches('#saveBtn,#btnSave,#dl-json') || /^\s*save data\s*$/i.test(b.textContent);
    var clear = b.id === 'clearBtn' || /^\s*clear all\s*$/i.test(b.textContent);
    if (save) setTimeout(function () { clearTimeout(timer); lastSig = H.own; if (IOS) C.patch(key, { fileAt: new Date().toISOString() }); else C.del(key); }, 700);
    else if (clear) setTimeout(seal, 700);
  }, true);
  function seal() { clearTimeout(timer); seq++; key = 'f-' + tab + '-' + seq; lastSig = ''; replaces = ''; }
  D.addEventListener('change', function (e) {
    var t = e.target; if (W.__nbhQuiet || !t || t.type !== 'file' || !t.matches('#fileIn,#fileImport,#file-input')) return;
    lastWord(); flush(); seal();
  }, true);

  /* the workstation's Own tab: it asks whether this tab is ready, then hands over the work */
  W.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (!d || (d.nbh !== 'as-hello' && d.nbh !== 'as-take')) return;
    if (!W.opener || ev.source !== W.opener) return;
    var b = B(); if (!b) return;
    var reply = function (m) { try { ev.source.postMessage(m, '*'); } catch (e) {} };
    if (d.nbh === 'as-hello') { reply({ nbh: 'as-here', id: b.formId() }); return; }
    if (handed || !d.snap) return;
    handed = true;
    H.frozen = true; H.noMark = Date.now() + 5000;
    var done = function (ok) {
      try { W.name = 'nbh-tab|' + encodeURIComponent(C.scope()) + '|'; } catch (e) {}
      lastSig = ''; soon(300); setTimeout(compute, 1700);
      reply({ nbh: 'as-taken', id: b.formId(), ok: ok });
    };
    if (d.snap.own && b.ownOpen) b.ownOpen(d.snap.own).then(function (ok) { if (!ok) b.restoreData(d.snap); done(true); });
    else { b.restoreData(d.snap); done(true); }
  });

  function ago(iso) {
    var t = new Date(iso).getTime(), m = Math.round((Date.now() - t) / 60000);
    if (isNaN(t)) return '';
    return m < 1 ? 'just now' : m < 60 ? m + ' minute' + (m === 1 ? '' : 's') + ' ago' : m < 1440 ? Math.round(m / 60) + ' hour' + (Math.round(m / 60) === 1 ? '' : 's') + ' ago' : C.when(iso);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function offer() {
    if (asked || handed || !on()) return;
    asked = true;
    var b = B(); if (!b) return;
    var id = b.formId();
    Promise.all([C.list(), C.live()]).then(function (x) {
      var rows = x[0], alive = x[1];
      /* a copy a tab still open is keeping is that tab's work in progress, not earlier work */
      var mine = rows.filter(function (r) { return r.tab !== tab && !alive[r.tab] && r.forms && r.forms[id]; });
      if (!mine.length || handed) return;
      show(mine, id);
    });
  }
  function show(rows, id) {
    var old = D.getElementById('nbhAsDlg'); if (old) old.remove();
    /* a panel in the corner, not a modal box: it takes no focus and blocks nothing, so a key pressed for the form can
       never restore an old copy by accident, and the form can be used while the question waits */
    var dl = D.createElement('aside'); dl.id = 'nbhAsDlg'; dl.className = 'nbh-as-ui nbh-as-dlg noprint';
    dl.setAttribute('role', 'region'); dl.setAttribute('aria-labelledby', 'nbhAsH');
    var items = rows.map(function (r, i) {
      var n = Object.keys(r.forms).length, where = r.kind === 'form' ? 'this form on its own' : 'the workstation' + (n > 1 ? ', with ' + (n - 1) + ' other form' + (n === 2 ? '' : 's') : '');
      var note = r.fileAt ? '<small>Also saved to a file at ' + esc(C.when(r.fileAt)) + '.</small>' : '';
      var canDel = r.kind === 'form' || n === 1;
      return '<li><span><b>' + esc(r.student || 'Student not named') + '</b> · ' + esc(ago(r.saved)) + '<small>From ' + esc(where) + '.</small>' + note +
        (canDel ? '' : '<small>Delete it from the Autosave box in the workstation.</small>') + '</span>' +
        '<button type="button" class="pri" data-as="r" data-i="' + i + '">Restore</button>' +
        (canDel ? '<button type="button" data-as="d" data-i="' + i + '">Delete</button>' : '') + '</li>';
    }).join('');
    dl.innerHTML = '<h2 id="nbhAsH" style="font-size:16px;margin:0 0 6px">Unsaved work found in this browser</h2>' +
      '<p>A safety copy of this form from an earlier session is still on this device.</p><ul>' + items + '</ul>' +
      '<p class="nbh-as-note">Not now keeps the copies; they are offered again next time. Copies stay in this browser on this device and never leave it; they are deleted after ' + C.DAYS + ' days. They are protected by the iPad’s passcode, not by the form: on a shared iPad, delete them. In a private window they end when the window closes. A copy is a safety net; Save data writes the record.</p>' +
      '<p><button type="button" data-as="x">Not now</button></p>';
    dl.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button[data-as]') : null; if (!t) return;
      var r = rows[+t.getAttribute('data-i')], how = t.getAttribute('data-as');
      if (how === 'x') { close(); return; }
      if (how === 'd') { C.del(r.key).then(function () { rows.splice(rows.indexOf(r), 1); if (rows.length) show(rows, id); else close(); }); return; }
      var go = function () { close(); restore(r, id); };
      /* work done on the form since it opened is replaced by the copy: ask first */
      if (unsaved() && W.nbhUI && W.nbhUI.confirm) W.nbhUI.confirm('Restore the safety copy?\nWhat is on this form now is replaced by it.', { ok: 'Restore' }).then(function (y) { if (y) go(); });
      else go();
    });
    function close() { dl.remove(); }
    D.body.appendChild(dl);
  }
  function restore(r, id) {
    var b = B(); if (!b) return;
    C.unpackForm(r.forms[id]).then(function (f) {
      H.frozen = true; H.noMark = Date.now() + 5000;
      var fin = function () {
        /* carry on in a copy of this tab's own (two tabs never share one); a form's own copy restored here is removed
           once this tab has written it again */
        seal(); student = r.student || ''; if (r.kind === 'form') replaces = r.key;
        lastSig = ''; soon(300); setTimeout(compute, 1700);
        var msg = 'Restored the safety copy from ' + ago(r.saved) + '.';
        if (f.picsLost) msg += ' ' + f.picsLost + (f.picsLost === 1 ? ' picture' : ' pictures') + ' could not be kept in the copy (no room in this browser); add ' + (f.picsLost === 1 ? 'it' : 'them') + ' again.';
        if (f.continued) msg += ' This form was carried on in its own tab at ' + C.when(f.continued) + '; the copy that tab made may be newer.';
        msg += ' Save data keeps it in a file.';
        try { if (W.nbhUI && W.nbhUI.alert) W.nbhUI.alert(msg); } catch (e) {}
      };
      if (f.snap.own && b.ownOpen) b.ownOpen(f.snap.own).then(function (ok) { if (!ok) b.restoreData(f.snap); fin(); });
      else { b.restoreData(f.snap); fin(); }
    });
  }
  C.ready().then(function () {
    if (ownTab && W.opener) setTimeout(offer, 6000);   /* the workstation hands over the work first */
    else setTimeout(offer, 1200);
  });
})();
