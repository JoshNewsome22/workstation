/* nbh-media.js: sounds and pictures kept once on this device, by id, out of the case file (v22.56).
   A form keeps a short reference where it kept the data URL: nbh-media:<id>:<mime>:<size>. The bytes live in IndexedDB
   (database nbh-media, store blobs), shared by the workstation and every form on the same origin (the forms load as srcdoc).
   Where IndexedDB is refused (a private window, an old browser), the store is a memory map and the data stays inline in the
   case, as before.
     nbhMedia.put(src, {kind, mime})   src: a Blob, an ArrayBuffer or a data URL; resolves the ref (the same bytes -> one copy),
                                       or the data URL itself where this browser has no store (refOnly: the ref regardless)
     nbhMedia.get(ref)                 the Blob, or null
     nbhMedia.url(ref)                 an object URL for this page (cached; revoked when the page unloads)
     nbhMedia.src(ref, el)             sets el.src when the bytes are read (a data URL or a plain URL is set at once)
     nbhMedia.dataUrl(ref)             the data URL (for anything handed on)
     nbhMedia.isRef(s), parse(s), has(ref), remove(ref), list(), stat()
     nbhMedia.inlineText(text)         every ref in a JSON text replaced by its data URL (a file handed on)
     nbhMedia.absorbText(text, min)    every data:image or data:audio of min+ characters replaced by a ref, the bytes stored
     nbhMedia.refsIn(text)             the refs a text carries
     nbhMedia.sweep(keep)              removes every stored id not in keep (an array or Set of refs or ids) */
(function (W) {
  'use strict';
  var PREFIX = 'nbh-media:', DB = 'nbh-media', STORE = 'blobs';
  var mem = new Map(), urls = new Map(), dbp = null, mode = 'idb';
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      var idb = W.indexedDB; if (!idb) { mode = 'memory'; return res(null); }
      var r; try { r = idb.open(DB, 1); } catch (e) { mode = 'memory'; return res(null); }
      r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { mode = 'memory'; res(null); };
      r.onblocked = function () { mode = 'memory'; res(null); };
    });
    return dbp;
  }
  function tx(db, m, fn) {
    return new Promise(function (res, rej) {
      var t = db.transaction(STORE, m), s = t.objectStore(STORE), out = fn(s);
      t.oncomplete = function () { res(out && typeof out === 'object' && 'result' in out && typeof out.onsuccess !== 'undefined' ? out.result : out); };   /* a request's result (undefined for a key not there), else what fn returned */
      t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error || new Error('aborted')); };
    });
  }
  function isRef(s) { return typeof s === 'string' && s.slice(0, PREFIX.length) === PREFIX; }
  function parse(s) { if (!isRef(s)) return null; var p = s.slice(PREFIX.length).split(':'); return { id: p[0], mime: p[1] || '', size: +p[2] || 0 }; }
  function makeRef(id, mime, size) { return PREFIX + id + ':' + mime + ':' + size; }
  function kindOf(mime) { return /^audio\//.test(mime) ? 'audio' : /^video\//.test(mime) ? 'video' : 'image'; }
  function dataUrlToBlob(u) {
    var m = /^data:([^;,]+)?((?:;[^;,]+)*?)(;base64)?,(.*)$/s.exec(u); if (!m) return null;
    var mime = m[1] || 'application/octet-stream', b64 = !!m[3], body = m[4], bytes;
    if (b64) { var bin = atob(body); bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); }
    else { bytes = new TextEncoder().encode(decodeURIComponent(body)); }
    return new Blob([bytes], { type: mime });
  }
  function blobToDataUrl(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = function () { rej(r.error); }; r.readAsDataURL(b); }); }
  function hashOf(buf) {
    if (W.crypto && W.crypto.subtle && W.crypto.subtle.digest) return W.crypto.subtle.digest('SHA-256', buf).then(function (h) {
      var a = new Uint8Array(h), s = ''; for (var i = 0; i < 12; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16); return s; });
    /* no subtle crypto (an insecure origin): FNV-1a over the bytes, twice with different seeds */
    var a = new Uint8Array(buf), h1 = 0x811c9dc5, h2 = 0x01000193; for (var i = 0; i < a.length; i++) { h1 = Math.imul(h1 ^ a[i], 16777619) >>> 0; h2 = Math.imul(h2 ^ a[i], 2166136261) >>> 0; }
    return Promise.resolve(('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8) + ('00000000' + (a.length >>> 0).toString(16)).slice(-8));
  }
  function toBlob(src, o) {
    if (src instanceof Blob) return Promise.resolve(o && o.mime && src.type !== o.mime ? new Blob([src], { type: o.mime }) : src);
    if (src instanceof ArrayBuffer || ArrayBuffer.isView(src)) return Promise.resolve(new Blob([src], { type: (o && o.mime) || 'application/octet-stream' }));
    if (typeof src === 'string' && /^data:/.test(src)) { var b = dataUrlToBlob(src); return b ? Promise.resolve(b) : Promise.reject(new Error('not a data URL')); }
    return Promise.reject(new Error('nbhMedia.put: a Blob, an ArrayBuffer or a data URL'));
  }
  async function put(src, o) {
    var blob = await toBlob(src, o), mime = blob.type || (o && o.mime) || 'application/octet-stream';
    var id = 'm' + (await hashOf(await blob.arrayBuffer())) + '-' + blob.size, ref = makeRef(id, mime, blob.size);
    var rec = { id: id, kind: (o && o.kind) || kindOf(mime), mime: mime, size: blob.size, blob: blob, added: Date.now(), seen: Date.now() };
    var db = await open();
    if (db) { try { var had = await tx(db, 'readonly', function (s) { return s.get(id); }); if (!had) await tx(db, 'readwrite', function (s) { s.put(rec); }); return ref; }
      catch (e) { mode = 'memory'; } }
    /* no store in this browser: the caller gets the data URL, and the bytes stay inside the case as before */
    mem.set(id, rec); return (o && o.refOnly) ? ref : blobToDataUrl(blob);
  }
  async function getRec(ref) {
    var p = parse(ref); if (!p) return null;
    if (mem.has(p.id)) return mem.get(p.id);
    var db = await open(); if (!db) return null;
    try { var r = await tx(db, 'readonly', function (s) { return s.get(p.id); }); return r || null; } catch (e) { return null; }
  }
  async function get(ref) { var r = await getRec(ref); return r ? r.blob : null; }
  async function url(ref) {
    var p = parse(ref); if (!p) return isRef(ref) ? '' : ref;
    if (urls.has(p.id)) return urls.get(p.id);
    var b = await get(ref); if (!b) return '';
    var u = URL.createObjectURL(b); urls.set(p.id, u); return u;
  }
  function src(ref, el) {
    if (!isRef(ref)) { if (el) el.src = ref || ''; return Promise.resolve(ref || ''); }
    return url(ref).then(function (u) { if (el) { if (u) el.src = u; else el.removeAttribute('src'); } return u; });
  }
  async function dataUrl(ref) { if (!isRef(ref)) return ref; var b = await get(ref); return b ? blobToDataUrl(b) : ''; }
  async function has(ref) { return !!(await getRec(ref)); }
  async function remove(ref) {
    var p = parse(ref); if (!p) return false; mem.delete(p.id);
    if (urls.has(p.id)) { try { URL.revokeObjectURL(urls.get(p.id)); } catch (e) {} urls.delete(p.id); }
    var db = await open(); if (!db) return true; try { await tx(db, 'readwrite', function (s) { s.delete(p.id); }); } catch (e) {} return true;
  }
  async function list() {
    var out = []; mem.forEach(function (r) { out.push({ id: r.id, kind: r.kind, mime: r.mime, size: r.size, added: r.added }); });
    var db = await open(); if (!db) return out;
    try { var all = await tx(db, 'readonly', function (s) { return s.getAll(); }); (all || []).forEach(function (r) { out.push({ id: r.id, kind: r.kind, mime: r.mime, size: r.size, added: r.added }); }); } catch (e) {}
    return out;
  }
  async function stat() { var l = await list(), b = 0; l.forEach(function (r) { b += r.size || 0; }); return { count: l.length, bytes: b, mode: mode }; }
  var REF_RE = /nbh-media:(m[0-9a-f]+-\d+):([^:"'\\\s]*):(\d+)/g;
  function refsIn(text) { var out = [], m; REF_RE.lastIndex = 0; while ((m = REF_RE.exec(String(text)))) out.push(makeRef(m[1], m[2], +m[3])); return out; }
  /* a data URL inside a JSON text: the escaped form is what the text holds (a data URL has no quotes or backslashes) */
  var DATA_RE = /data:(image|audio|video)\/[a-zA-Z0-9.+-]+(?:;[^;,"'\\\s]+)*?;base64,[A-Za-z0-9+\/=]+/g;
  async function absorbText(text, min) {
    min = min || 4000; var s = String(text), found = {}, m, n = 0, bytes = 0;
    DATA_RE.lastIndex = 0;
    while ((m = DATA_RE.exec(s))) { if (m[0].length >= min) found[m[0]] = true; }
    var keys = Object.keys(found); if (!keys.length) return { text: s, n: 0, bytes: 0 };
    for (var i = 0; i < keys.length; i++) {
      var u = keys[i], ref; try { ref = await put(u, { refOnly: true }); } catch (e) { continue; }
      if (mode === 'memory' || !isRef(ref)) continue;   /* no store here: the data stays inline */
      s = s.split(u).join(ref); n++; bytes += (parse(ref) || {}).size || 0;
    }
    return { text: s, n: n, bytes: bytes };
  }
  async function inlineText(text) {
    var s = String(text), refs = refsIn(s), seen = {}, missing = [];
    for (var i = 0; i < refs.length; i++) { var r = refs[i]; if (seen[r]) continue; seen[r] = true;
      var d = await dataUrl(r); if (d) s = s.split(r).join(d); else missing.push(r); }
    return { text: s, missing: missing };
  }
  async function sweep(keep) {
    var ids = new Set(); (keep instanceof Set ? Array.from(keep) : (keep || [])).forEach(function (x) { var p = parse(x); ids.add(p ? p.id : String(x)); });
    var l = await list(), gone = 0; for (var i = 0; i < l.length; i++) if (!ids.has(l[i].id)) { await remove(makeRef(l[i].id, l[i].mime, l[i].size)); gone++; }
    return gone;
  }
  W.addEventListener('pagehide', function () { urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); urls.clear(); });
  W.nbhMedia = { PREFIX: PREFIX, put: put, get: get, url: url, src: src, dataUrl: dataUrl, isRef: isRef, parse: parse, has: has, remove: remove,
    list: list, stat: stat, refsIn: refsIn, absorbText: absorbText, inlineText: inlineText, sweep: sweep, ready: open, mode: function () { return mode; } };
})(window);
