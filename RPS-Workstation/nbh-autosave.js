
/* nbh-autosave (v21.44): written by tools/blocks/patch-autosave.py from tools/blocks/nbh-copies.js and
   nbh-autosave.js, each copied byte for byte; change those files and run it again rather than editing this copy. */
/* nbh-copies (v21.44): where Autosave keeps its safety copies. One store for the workstation and for every form opened
   on its own: IndexedDB on this site (localStorage only when IndexedDB cannot be opened), in this browser on this device.
   Nothing here makes a network request. A copy is one record: a case (the student) as one tab saw it, with each form's own
   saved file and its pictures kept as Blobs. Records are scoped to the folder the page was opened from, so two editions on
   one website never offer each other's work. Copies older than 14 days are dropped when the list is read; no other copy is
   ever deleted without the user (over five, the user is asked to delete some). A full store is answered step by step
   (without pictures, then without the largest forms), never by turning Autosave off; what was left out is written into
   the record so the restore can say so. A page being hidden or closed cannot wait for IndexedDB: its last word goes into
   a small slot in localStorage at once (stash) and is folded into the store when a page of this folder next opens. A tab
   holds a lock (and a heartbeat) named after it while it lives, so another tab never offers its copy as earlier work.
   The same text is in every form (tools/blocks/patch-autosave.py) and inside the workstation's autosave section. */
(function () {
  'use strict';
  if (window.nbhCopies) return;
  var DBN = 'nbh-copies', ST = 'copies', DAYS = 14, KEEP = 5, LSP = 'nbh.copies.v2|', OFF = 'nbh.copies.off|';
  var PIC = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]{2000,}/gi;
  var mode = null, blobsOK = true, dbP = null, gen = 0, asked = false;
  var PEND = 'nbh.copies.pend|', HB = 'nbh.copies.hb|', held = {};

  function scope() {
    try { var m = /^nbh-(?:own|tab)\|([^|]*)\|/.exec(String(window.name || '')); if (m && m[1]) return decodeURIComponent(m[1]); } catch (e) {}
    var h = String(location.href).split('#')[0].split('?')[0];
    if (/^about:/.test(h)) { try { h = String(parent.location.href).split('#')[0].split('?')[0]; } catch (e) { return 'about:'; } }
    return h.slice(0, h.lastIndexOf('/') + 1);
  }
  function ls() { try { var s = window.localStorage; s.setItem('nbh.copies.t', '1'); s.removeItem('nbh.copies.t'); return s; } catch (e) { return null; } }
  function openDb() {
    if (dbP) return dbP;
    dbP = new Promise(function (res) {
      var r, done = false, fin = function (v) { if (!done) { done = true; res(v); } };
      try { if (!window.indexedDB) return fin(null); r = indexedDB.open(DBN, 1); } catch (e) { return fin(null); }
      setTimeout(function () { fin(null); }, 5000);   /* a browser that never answers counts as no store */
      r.onupgradeneeded = function () { try { var db = r.result; if (!db.objectStoreNames.contains(ST)) db.createObjectStore(ST, { keyPath: 'key' }); } catch (e) {} };
      r.onsuccess = function () { var db = r.result; try { db.onversionchange = function () { db.close(); dbP = null; }; } catch (e) {} fin(db); };
      r.onerror = function () { fin(null); };
    });
    return dbP;
  }
  /* 'idb', 'ls' or null (nothing can be kept here: Autosave is then silently off) */
  var readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = openDb().then(function (db) {
      if (db) { mode = 'idb'; return mode; }
      mode = ls() ? 'ls' : null; return mode;
    }, function () { mode = ls() ? 'ls' : null; return mode; });
    return readyP;
  }
  function quotaErr(e) {
    var n = e && (e.name || ''), c = e && e.code;
    return n === 'QuotaExceededError' || n === 'NS_ERROR_DOM_QUOTA_REACHED' || c === 22 || c === 1014;
  }
  function tx(kind, fn) {
    return openDb().then(function (db) {
      if (!db) throw new Error('no store');
      return new Promise(function (res, rej) {
        var t, out;
        try { t = db.transaction(ST, kind); out = fn(t.objectStore(ST)); }
        catch (e) { return rej(e); }
        t.oncomplete = function () { res(out && 'result' in out ? out.result : out); };
        t.onerror = function () { rej(t.error || (out && out.error) || new Error('store error')); };
        t.onabort = function () { rej(t.error || (out && out.error) || new Error('store aborted')); };
      });
    });
  }
  function lsKeys() {
    var s = ls(), out = [], p = LSP + scope();
    if (!s) return out;
    for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(p) === 0) out.push(k); }
    return out;
  }

  /* ---- pictures out of the text and back ---- */
  function toBlob(u) {
    var i = u.indexOf(','), type = u.slice(5, i).split(';')[0], bin = atob(u.slice(i + 1)), a = new Uint8Array(bin.length);
    for (var j = 0; j < bin.length; j++) a[j] = bin.charCodeAt(j);
    return new Blob([a], { type: type });
  }
  function readAs(b, how) {
    if (how === 'text' && b && typeof b.text === 'function') return b.text();
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(fr.result); }; fr.onerror = function () { rej(fr.error); };
      if (how === 'text') fr.readAsText(b); else fr.readAsDataURL(b);
    });
  }
  /* f: {title, total, data, own (the form's own file, text), continued}; opt: {pics: keep pictures, blobs: as Blobs} */
  function packForm(f, opt) {
    var out = { title: f.title || '', total: f.total, data: f.data || {}, pics: [], picsLost: f.picsLost || 0, continued: f.continued || null };
    var own = typeof f.own === 'string' ? f.own : '', pics = [];
    if (own) {
      own = own.replace(PIC, function (m) { pics.push(m); return 'nbh-pic:' + (pics.length - 1) + ':'; });
      if (opt.pics) out.pics = pics.map(function (u) { if (!opt.blobs) return u; try { return toBlob(u); } catch (e) { return u; } });
      else out.picsLost += pics.length;
      out.own = opt.blobs ? new Blob([own], { type: 'application/json' }) : own;
    } else out.own = null;
    out.size = own.length + pics.reduce(function (n, u) { return n + u.length; }, 0);
    return out;
  }
  function unpackForm(f) {
    var own = f.own, pics = f.pics || [];
    return Promise.resolve(own && typeof own !== 'string' ? readAs(own, 'text') : own).then(function (text) {
      return Promise.all(pics.map(function (p) { return typeof p === 'string' ? p : readAs(p, 'url').catch(function () { return null; }); }))
        .then(function (urls) {
          var lost = f.picsLost || 0;
          if (text) text = text.replace(/nbh-pic:(\d+):/g, function (m, i) { var u = urls[+i]; if (u == null) { if (!(+i < pics.length)) return ''; lost++; return ''; } return u; });
          var snap = { total: f.total, data: f.data || {} };
          if (text) snap.own = text;
          return { title: f.title || '', snap: snap, picsLost: lost, continued: f.continued || null };
        });
    });
  }
  /* the whole record back as the workstation's case shape: {packet, facts, forms:{id:{title,snap}}, notes:[...]} */
  function unpack(rec) {
    var ids = Object.keys(rec.forms || {}), out = { packet: rec.packet || null, facts: rec.facts || null, forms: {}, notes: [], picsLost: {}, continued: {} };
    return Promise.all(ids.map(function (id) { return unpackForm(rec.forms[id]).then(function (f) { out.forms[id] = { title: f.title, snap: f.snap }; if (f.picsLost) out.picsLost[id] = f.picsLost; if (f.continued) out.continued[id] = f.continued; }); }))
      .then(function () {
        Object.keys(out.picsLost).forEach(function (id) { var n = out.picsLost[id]; out.notes.push('Form ' + id + ': ' + n + (n === 1 ? ' picture' : ' pictures') + ' could not be kept in the safety copy (no room in this browser); add ' + (n === 1 ? 'it' : 'them') + ' again.'); });
        (rec.dropped || []).forEach(function (id) { out.notes.push('Form ' + id + ' was left out of the safety copy for lack of room; its work is not in it.'); });
        Object.keys(out.continued).forEach(function (id) { out.notes.push('Form ' + id + ' was carried on in its own tab at ' + when(out.continued[id]) + '; if you kept working there, the copy that tab made may be newer.'); });
        return out;
      });
  }
  function when(iso) { var t = new Date(iso); return isNaN(t) ? '' : t.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }

  /* ---- write: the whole record, then without pictures, then without the largest forms ---- */
  function write(rec) {
    if (mode === 'idb') return tx('readwrite', function (st) { return st.put(rec); }).then(function () { return true; });
    var s = ls(); if (!s) return Promise.reject(new Error('no store'));
    try { s.setItem(LSP + rec.scope + '|' + rec.key, JSON.stringify(rec)); return Promise.resolve(true); }
    catch (e) { return Promise.reject(e); }
  }
  function put(rec) {
    var g = gen;
    return ready().then(function (m) {
      if (!m) return { ok: false, why: 'none' };
      if (g !== gen) return { ok: false, why: 'cleared' };   /* started before Delete all: not written */
      var ids = Object.keys(rec.forms || {});
      var hasPics = ids.some(function (id) { var o = rec.forms[id].own; return typeof o === 'string' && (PIC.lastIndex = 0, PIC.test(o)); });
      PIC.lastIndex = 0;
      var bySize = ids.slice().sort(function (a, b) { return String(rec.forms[b].own || '').length - String(rec.forms[a].own || '').length; });
      var keepPics = true, dropped = [], blobs = m === 'idb' && blobsOK, step = 0;
      function attempt() {
        var forms = {}, lost = {};
        ids.forEach(function (id) {
          if (dropped.indexOf(id) >= 0) return;
          var p = packForm(rec.forms[id], { pics: keepPics, blobs: blobs });
          if (p.picsLost) lost[id] = p.picsLost; delete p.size; forms[id] = p;
        });
        if (!Object.keys(forms).length) return Promise.resolve({ ok: false, why: 'quota', dropped: dropped });
        var r = {};
        for (var k in rec) if (k !== 'forms') r[k] = rec[k];
        r.v = 2; r.scope = scope(); r.forms = forms; r.dropped = dropped.slice();
        if (g !== gen) return Promise.resolve({ ok: false, why: 'cleared' });
        return write(r).then(function () {
          if (!asked) { asked = true; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {} }
          return { ok: true, full: !dropped.length && !Object.keys(lost).length, picsLost: lost, dropped: dropped.slice(), step: step };
        }, function (e) {
          step++;
          if (blobs && e && (e.name === 'DataCloneError' || e.name === 'UnknownError') && step < 3) { blobs = false; blobsOK = false; return attempt(); }
          /* not a full store (the store closed under the page, say): open it afresh next time */
          if (!quotaErr(e)) { dbP = null; readyP = null; return { ok: false, why: 'error', error: String(e && (e.name || e.message) || e) }; }
          if (keepPics && hasPics) { keepPics = false; return attempt(); }
          keepPics = false;
          var next = bySize.filter(function (id) { return dropped.indexOf(id) < 0; })[0];
          if (!next || dropped.length >= ids.length - 1) return { ok: false, why: 'quota', dropped: dropped };
          dropped.push(next); return attempt();
        });
      }
      return attempt();
    });
  }
  function all() {
    return ready().then(function (m) {
      if (m === 'idb') return tx('readonly', function (st) { return st.getAll ? st.getAll() : st.openCursor(); }).then(function (v) { return Array.isArray(v) ? v : []; });
      if (m === 'ls') { var s = ls(); return lsKeys().map(function (k) { try { return JSON.parse(s.getItem(k)); } catch (e) { return null; } }).filter(Boolean); }
      return [];
    }).catch(function () { return []; });
  }
  /* a time stamp from a clock that was set ahead counts as now, so it neither stays "newest" nor escapes expiry */
  function ts(r) { var t = new Date(r && r.saved).getTime(); return isNaN(t) ? NaN : Math.min(t, Date.now()); }
  function age(r) { var t = ts(r); return isNaN(t) ? Infinity : (Date.now() - t) / 86400000; }
  /* this folder's copies, newest first; expired ones are removed on the way */
  var folded = null;
  function list() {
    var sc = scope();
    folded = folded || fold();
    return folded.then(all).then(function (rows) {
      var mine = rows.filter(function (r) { return r && r.scope === sc && r.forms; }), keep = [];
      mine.forEach(function (r) { if (age(r) > DAYS) del(r.key); else keep.push(r); });
      return keep.sort(function (a, b) { return (ts(b) || 0) - (ts(a) || 0); });
    });
  }
  function del(key) {
    return ready().then(function (m) {
      if (m === 'idb') return tx('readwrite', function (st) { return st.delete(key); });
      if (m === 'ls') { var s = ls(); if (s) s.removeItem(LSP + scope() + '|' + key); }
    }).then(function () { return true; }, function () { return false; });
  }
  /* Delete all: a write already on its way is dropped (gen), and this folder's stashed slots go too */
  function clear() {
    gen++;
    var s = ls(), p = PEND + scope() + '|', ks = [];
    if (s) { for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(p) === 0) ks.push(k); } ks.forEach(function (k) { s.removeItem(k); }); }
    return list().then(function (rows) { return Promise.all(rows.map(function (r) { return del(r.key); })); });
  }
  /* how many copies over KEEP: nothing is deleted to make room (an unanswered copy, or one whose file was never
     confirmed, may be the only place some work is); the pages ask the user to delete what is no longer needed */
  function over() { return list().then(function (rows) { return Math.max(0, rows.length - KEEP); }, function () { return 0; }); }
  /* the last word of a page being hidden or closed: the whole record as text, at once */
  function stash(rec) {
    var s = ls(); if (!s || !rec || !rec.key || mode === null) return false;
    var r = {}; for (var k in rec) r[k] = rec[k];
    r.v = 2; r.scope = scope(); r.stashed = true;
    try { s.setItem(PEND + r.scope + '|' + r.key, JSON.stringify(r)); return true; } catch (e) { return false; }
  }
  /* stashed slots into the store (once per page, before the first list): a slot newer than the copy replaces it */
  function fold() {
    var s = ls(); if (!s) return Promise.resolve(0);
    var p = PEND + scope() + '|', ks = [];
    for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(p) === 0) ks.push(k); }
    if (!ks.length) return Promise.resolve(0);
    return all().then(function (rows) {
      var have = {}; rows.forEach(function (r) { if (r && r.key) have[r.key] = r; });
      return ks.reduce(function (pr, k) {
        return pr.then(function (n) {
          var d = null; try { d = JSON.parse(s.getItem(k) || 'null'); } catch (e) {}
          if (!d || !d.key || !d.forms || age(d) > DAYS) { s.removeItem(k); return n; }
          var h = have[d.key];
          if (h && !((ts(d) || 0) > (ts(h) || 0))) { s.removeItem(k); return n; }   /* the store already holds this or newer */
          delete d.stashed;
          return put(d).then(function (r) { if (r.ok) s.removeItem(k); return n + (r.ok ? 1 : 0); });
        });
      }, Promise.resolve(0));
    }).catch(function () { return 0; });
  }
  /* which tabs are open now: each holds a lock named after it for as long as it lives (a tab in the background keeps
     it, one the browser has thrown away does not), and a heartbeat in localStorage where locks are missing */
  function hold(tab) {
    if (!tab || held[tab]) return; held[tab] = 1;
    try { if (navigator.locks && navigator.locks.request) navigator.locks.request('nbh-tab|' + tab, function () { return new Promise(function () {}); }).catch(function () {}); } catch (e) {}
    var beat = function () { var s = ls(); try { if (s) s.setItem(HB + tab, String(Date.now())); } catch (e) {} };
    beat(); setInterval(beat, 5000);
    window.addEventListener('pagehide', function () { var s = ls(); try { if (s) s.removeItem(HB + tab); } catch (e) {} });
    window.addEventListener('pageshow', function (e) { if (e.persisted) beat(); });
  }
  function live() {
    var out = {}, s = ls(), now = Date.now(), old = [];
    if (s) for (var i = 0; i < s.length; i++) {
      var k = s.key(i); if (!k || k.indexOf(HB) !== 0) continue;
      var t = +s.getItem(k) || 0;
      if (now - t < 20000) out[k.slice(HB.length)] = 1; else if (now - t > 86400000) old.push(k);
    }
    old.forEach(function (k) { try { s.removeItem(k); } catch (e) {} });
    var q = null;
    try { if (navigator.locks && navigator.locks.query) q = navigator.locks.query(); } catch (e) {}
    return Promise.resolve(q).then(function (r) {
      ((r && r.held) || []).forEach(function (l) { var n = String(l.name || ''); if (n.indexOf('nbh-tab|') === 0) out[n.slice(8)] = 1; });
      return out;
    }, function () { return out; });
  }
  function patch(key, fields) {
    return ready().then(function (m) {
      if (m === 'idb') return tx('readwrite', function (st) {
        var g = st.get(key);
        g.onsuccess = function () { var r = g.result; if (!r) return; for (var k in fields) r[k] = fields[k]; st.put(r); };
        return g;
      });
      if (m === 'ls') { var s = ls(), k2 = LSP + scope() + '|' + key, r = null; try { r = JSON.parse(s.getItem(k2)); } catch (e) {} if (r) { for (var k in fields) r[k] = fields[k]; s.setItem(k2, JSON.stringify(r)); } }
    }).then(function () { return true; }, function () { return false; });
  }
  /* the workstation's single slot of earlier versions (localStorage, `oldKey` and `oldKey.<case id>`): read once, kept as
     a copy here, then removed */
  function migrate(oldKey) {
    var s = ls(); if (!s || !oldKey) return Promise.resolve(0);
    var keys = [];
    for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k === oldKey || (k && k.indexOf(oldKey + '.') === 0)) keys.push(k); }
    return keys.reduce(function (p, k, n) {
      return p.then(function (done) {
        var d = null; try { d = JSON.parse(s.getItem(k) || 'null'); } catch (e) {}
        if (!d || !d.forms || !Object.keys(d.forms).length || age(d) > DAYS) { s.removeItem(k); return done; }
        var forms = {};
        Object.keys(d.forms).forEach(function (id) { var f = d.forms[id] || {}, sn = f.snap || {}; forms[id] = { title: f.title || id, total: sn.total, data: sn.data || {}, own: sn.own || '' }; });
        var who = (d.packet && d.packet.client) || (d.who && d.who.name) || '';
        var rec = { key: 'old-' + Date.now().toString(36) + '-' + n, kind: 'shell', tab: 'earlier', student: who, who: d.who || null, saved: d.saved,
          packet: d.packet || null, facts: d.facts || null, caseId: /\.c[a-z0-9]+$/.test(k) ? k.slice(k.lastIndexOf('.') + 1) : null, forms: forms };
        return put(rec).then(function (r) { if (r.ok) s.removeItem(k); return done + (r.ok ? 1 : 0); });
      });
    }, Promise.resolve(0));
  }
  function isOff() { var s = ls(); return !!(s && s.getItem(OFF + scope()) === '1'); }
  function setOff(off) { var s = ls(); if (!s) return; if (off) s.setItem(OFF + scope(), '1'); else s.removeItem(OFF + scope()); }
  function tabId() { return Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8); }
  function same(a, b) {
    a = String(a || '').toLowerCase().replace(/[^a-z]/g, ''); b = String(b || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!a || !b || a === b) return true;
    return a.indexOf(b) === 0 || b.indexOf(a) === 0;   /* a name still being typed; "Myra" is not "Mary" */
  }
  window.nbhCopies = { ready: ready, mode: function () { return mode; }, scope: scope, put: put, list: list, del: del, clear: clear, over: over,
    patch: patch, unpack: unpack, unpackForm: unpackForm, migrate: migrate, isOff: isOff, setOff: setOff, tabId: tabId, same: same, when: when,
    stash: stash, hold: hold, live: live, DAYS: DAYS, KEEP: KEEP };
})();
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
      /* v21.87 room under the page while the offer is shown, so the end of every view (its Next button) can scroll above it */
      '@media screen{html.nbh-as-room body{padding-bottom:var(--nbh-as-room,0px)!important}}' +
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
    function room() { var h = D.documentElement; try { if (dl.isConnected) { h.style.setProperty('--nbh-as-room', (dl.offsetHeight + 32) + 'px'); h.classList.add('nbh-as-room'); } } catch (e) {} }
    function close() { dl.remove(); if (!D.getElementById('nbhAsDlg')) D.documentElement.classList.remove('nbh-as-room'); }
    D.body.appendChild(dl); room();
    try { W.addEventListener('resize', room); } catch (e) {}
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
