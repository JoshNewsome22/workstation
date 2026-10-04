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
