/* sw.js: the workstation's offline copy (v21.43).

   What it does. The first time the workstation opens from the website, this worker saves its files on the device: the
   shell, the 44 forms, the picture library, the respondent page and its library, the PDF tools, the manifest and the
   icons (FILES below). From then on every one of those files is served from that copy at once, online or not, so the
   workstation opens and works without the internet. Nothing a person types ever passes through here: the copy holds
   the workstation's own files and nothing else, and the forms still save cases as files.

   What it never touches. A request that is not a GET, a request to another website, anything outside this folder (the
   writing help's relay at /ai, the other edition, the practice's site) and a request for a part of a file (Range) go to
   the network exactly as if there were no worker: the worker does not answer them at all. So does a request that
   carries nbh-online in its query (the page asks for the website itself with it, to sign in or after a reset).

   Updates. The shell asks for a check when it starts, every few minutes while it is in front (at most every five
   minutes; every hour when the website cannot answer "has this changed?") and when Check for updates is pressed.
   A check asks the website about every saved file with a conditional request (If-None-Match with the file's ETag, or
   If-Modified-Since with its Last-Modified when the ETag never matches, as with an Apache that marks compressed copies
   -gzip); 304 means unchanged, and a 200 whose bytes hash the same as the saved copy is unchanged too. A changed file
   goes into a staging copy, a new set in a cache of its own, and only when every file has been looked at, the rest
   copied from the set in use, is the staging copy recorded as ready. It is not used yet: the set in use goes on
   serving everything, forms opened later included, so the open page never mixes old and new files. The shell then
   says a new version is ready; Reload (or the next start with no workstation window open) swaps the sets, deletes the
   old one and loads the page again from the new set. A check that cannot finish (offline, the website's password, an
   error, a full disk) changes nothing and is recorded for the shell to show.

   Changing this file. The browser fetches sw.js itself on every start and every update check; a changed sw.js is a new
   worker, which saves a complete set of its own while the old one keeps serving (unchanged files are copied from the
   old set after a 304; only changed ones are downloaded), waits, and takes over when Reload is pressed. Its caches carry
   its VERSION in their names, and on taking over it deletes every cache of this folder but its own set and the small
   state cache. Both editions can live on one website: every cache name starts with this folder's address.

   The state cache holds small JSON records: live (the set in use), staged (a set ready to take over), installing-<VERSION>
   (the set a worker of that version is filling) and info (the last check: when, what it found, whether the website
   answers conditional requests, the last swap). Each set holds its own index: per file its ETag, Last-Modified, length,
   SHA-256 and type, and whether the website lacked it. */
'use strict';

/* ---- written by tools/pwa-sw.py from index.html and the files it loads; run it again rather than editing this part ---- */
const VERSION = '0610947ff911';
const FILES = [
  'index.html',
  'DM-1_Student-Demographics-and-Profile_v2026-09.html',
  'IC-1_Informed-Consent-FBA-BIP_v2026-09.html',
  'RR-1_Records-Review_v2026-09.html',
  'TB-1_Target-Behavior-Development_v2026-09.html',
  'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html',
  'IN-1_Stakeholder-Interview-Record_v2026-09.html',
  'SI-1_Student-Interview-and-Assent_v2026-10.html',
  'OB-1_Direct-Observation-Record_v2026-09.html',
  'ABC_Recording_Conditional_Probability_Analysis.html',
  'Scatterplot_Pattern_Analysis.html',
  'Daily_Behavior_Data_and_Visual_Analysis.html',
  'MT-1_Discontinuous-Measurement_v2026-09.html',
  'PA-1_Preference-Assessment-Protocol_v2026-09.html',
  'Reinforcer_Assessment_Protocol.html',
  'DA-1_Demand-Assessment_v2026-10.html',
  'EA-1_Experimental-Analysis-Protocol_v2026-09.html',
  'Variable_Isolation_Protocol.html',
  'FS-1_FBA-Summary-Report_v2026-09.html',
  'TD-1_Function-Based-Treatment-Developer_v2026-09.html',
  'GB-1_Goal-and-Objective-Builder_v2026-09.html',
  'SA-1_Skill-Acquisition-Data_v2026-10.html',
  'CF-1_Contextual-Fit-Assessment_v2026-09.html',
  'SV-1_Social-Validity_v2026-09.html',
  'ST-1_Behavior-Skills-Training_v2026-09.html',
  'TI-1_Treatment-Integrity-Observation_v2026-09.html',
  'PD-1_Performance-Diagnostic-Checklist_v2026-09.html',
  'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html',
  'SR-1_Schedules-of-Reinforcement_v2026-10.html',
  'GC-1_Group-Contingencies_v2026-10.html',
  'VS-1_Visual-Supports_v2026-10.html',
  'TK-1_Token-Board-Book_v2026-10.html',
  'RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html',
  'PR-1_Periodic-Plan-Review_v2026-09.html',
  'CN-1_Consultation-Notes_v2026-10.html',
  'CR-1_Crisis-Intervention-Plan_v2026-09.html',
  'CT-1_Caregiver-Training_v2026-09.html',
  'HD-1_Home-Data-Sheets_v2026-10.html',
  'EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html',
  'Delay-Tolerance-Protocol-Toolkit.html',
  'AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html',
  'TE-1_Token-Economy-Designer_v2026-09.html',
  'BC-1_Behavioral-Contrast_v2026-09.html',
  'MS-1_Medication-Side-Effect-Monitoring_v2026-09.html',
  'IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html',
  'nbh-respond.js',
  'nbh-pictos.js',
  'pdf-lib.min.js',
  'nbh-pdf-tools.js',
  'respond.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
];
/* ---- end of the part tools/pwa-sw.py writes ---- */

const SCOPE = self.registration.scope;                 // this folder, e.g. https://example.org/workstation/
const ROOT_PATH = new URL(SCOPE).pathname;
const PFX = 'nbh-offline:' + SCOPE + ':';
const STATE = PFX + 'state';
const SETS = PFX + 'v' + VERSION + ':set:';
const KNOWN = new Set(FILES);
const THROTTLE = 5 * 60 * 1000;                         // automatic checks, at most this often
const SLOW = 60 * 60 * 1000;                            // ... or this often when every check has to download everything
const QUOTA_WAIT = 24 * 60 * 60 * 1000;                 // after "no room on this device", try again on its own after a day
const POOL = 4;                                         // files asked about at once
const REC = name => SCOPE + '__nbh-offline__/' + name;  // the records' keys: inside the folder, never a real file
const INDEX = REC('index');

/* 'installing' while this worker saves its set, 'waiting' once saved with another still serving, then 'active' */
const STATES = {parsed: 'starting', installing: 'installing', installed: 'waiting', activating: 'active', activated: 'active'};
let phase = (self.serviceWorker && STATES[self.serviceWorker.state]) || 'starting';
let busy = null;                                        // {what:'install'|'check', done, total} while saving or checking;
                                                        // each run counts on its own object and clears only that one
let live = null;                                        // {name, cache} of the set in use, read once per start of the worker

/* ---------------------------------------------------------------- small helpers */
const json = v => new Response(JSON.stringify(v), {headers: {'Content-Type': 'application/json'}});
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isQuota = e => !!e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(String(e.message || '')));
function stop(kind, path, status) { const e = new Error(kind + (path ? ' at ' + path : '') + (status ? ' (' + status + ')' : '')); e.kind = kind; e.path = path || ''; e.status = status || 0; return e; }
const TYPES = {html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json', png: 'image/png',
  webp: 'image/webp', svg: 'image/svg+xml', css: 'text/css; charset=utf-8', txt: 'text/plain; charset=utf-8'};
const typeOf = path => TYPES[(/\.([a-z0-9]+)$/i.exec(path) || [])[1]] || 'application/octet-stream';
async function sha(buf) {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
}
function respOf(buf, meta) {
  const h = {'Content-Type': meta.type || 'application/octet-stream'};
  if (meta.lm) h['Last-Modified'] = meta.lm;
  if (meta.etag) h['ETag'] = meta.etag;
  return new Response(buf, {status: 200, statusText: 'OK', headers: h});
}
let chain = Promise.resolve();
function lock(fn) { const p = chain.then(fn); chain = p.catch(() => {}); return p; }   // the records change one at a time

async function rec(name) {
  try { const r = await (await caches.open(STATE)).match(REC(name)); return r ? await r.json() : null; } catch (e) { return null; }
}
async function setRec(name, v) {
  const c = await caches.open(STATE);
  if (v == null) await c.delete(REC(name)); else await c.put(REC(name), json(v));
}
async function indexOf(cache) {
  try { const r = await cache.match(INDEX); return r ? await r.json() : null; } catch (e) { return null; }
}
async function hasSet(name) { try { return !!name && await caches.has(name); } catch (e) { return false; } }
async function info(patch) {                            // read the info record, or merge a patch into it
  if (!patch) return (await rec('info')) || {};
  return lock(async () => { const i = Object.assign((await rec('info')) || {}, patch); await setRec('info', i); return i; });
}
async function liveSet() {
  if (live) return live;
  const r = await rec('live');
  live = r && await hasSet(r.name) ? {name: r.name, cache: await caches.open(r.name)} : {name: null, cache: null};
  return live;
}

/* the files a set holds: FILES, and any form index.html's FORMS names that FILES does not (an index.html uploaded
   before this file was rebuilt) */
async function listFrom(cache) {
  const all = new Set(FILES);
  try {
    const r = cache && await cache.match(SCOPE + 'index.html');
    const m = r && /const FORMS=(\[[\s\S]*?\n\]);/.exec(await r.text());
    if (m) for (const x of m[1].matchAll(/\['[A-Z]+-1','[^']*','([^'\/]+\.html)'\]/g)) all.add(x[1]);
  } catch (e) {}
  return Array.from(all);
}
async function pool(items, fn) {
  let i = 0, err = null;
  const run = async () => { while (!err && i < items.length) { const it = items[i++]; try { await fn(it); } catch (e) { err = err || e; } } };
  await Promise.all(Array.from({length: Math.min(POOL, items.length)}, run));
  if (err) throw err;
}

/* ---------------------------------------------------------------- telling the pages */
async function status() {
  const L = await rec('live'), S = await rec('staged'), I = await info();
  let files = 0, bytes = 0, total = 0, set = null;
  const missing = [];
  if (L && await hasSet(L.name)) {
    set = L.name;
    const idx = (await indexOf(await caches.open(L.name))) || {files: {}};
    for (const [p, m] of Object.entries(idx.files)) { total++; if (m.missing) missing.push(p); else { files++; bytes += m.len || 0; } }
  }
  return {version: VERSION, scope: SCOPE, phase, live: !!set, set, files, total, bytes, missing,
    staged: S && S.version === VERSION ? {files: S.files || [], at: S.at} : null,
    busy: busy ? {what: busy.what, done: busy.done, total: busy.total} : null,
    checkedAt: I.checkedAt || 0, result: I.result || null, slow: !!I.slow, lastSwap: I.lastSwap || null};
}
async function broadcast() {
  try {
    const s = await status();
    for (const c of await self.clients.matchAll({type: 'window', includeUncontrolled: true})) c.postMessage({nbh: 'offline', type: 'status', status: s});
  } catch (e) {}
}
let soon = null;
function broadcastSoon() { if (!soon) soon = setTimeout(() => { soon = null; broadcast(); }, 150); }

/* ---------------------------------------------------------------- asking the website about one file */
/* prev: what the set holds about the file ({etag, lm, sha, imsOnly}) or null when it holds no copy */
async function probe(path, prev) {
  const h = {};
  if (prev && prev.sha) {
    if (prev.etag && !prev.imsOnly) h['If-None-Match'] = prev.etag;
    else if (prev.lm) h['If-Modified-Since'] = prev.lm;
  }
  const cond = Object.keys(h).length > 0;
  let res;
  try { res = await fetch(SCOPE + path, {cache: cond ? 'no-store' : 'no-cache', credentials: 'same-origin', redirect: 'follow', headers: h}); }
  catch (e) { throw stop(self.navigator && self.navigator.onLine === false ? 'offline' : 'network', path); }
  if (res.status === 304 && prev) return {same: true, meta: {etag: res.headers.get('ETag') || prev.etag || '', lm: res.headers.get('Last-Modified') || prev.lm || ''}};
  if (res.status === 404 || res.status === 410) return {missing: true};
  if (res.status === 401) throw stop('auth', path, res.status);         // the folder's password (cPanel Directory Privacy)
  if (res.status !== 200) throw stop('server', path, res.status);
  let buf;
  try { buf = await res.arrayBuffer(); } catch (e) { throw stop('network', path); }
  const meta = {etag: res.headers.get('ETag') || '', lm: res.headers.get('Last-Modified') || '',
    type: res.headers.get('Content-Type') || typeOf(path), len: buf.byteLength, sha: await sha(buf)};
  if (prev && prev.sha === meta.sha) {
    /* the same bytes downloaded again: the website could not tell they had not changed. An ETag that never matches
       (Apache's -gzip copies) is left for If-Modified-Since from now on; when that cannot tell either, or the website
       gives no ETag or Last-Modified at all, the download was wasted (enough of them and automatic checks slow down) */
    if (h['If-None-Match']) meta.imsOnly = true;
    else { meta.imsOnly = !!prev.imsOnly; meta.wasted = true; }
    return {same: true, meta, buf};
  }
  return {same: false, meta, buf};
}
async function put(cache, path, resp) {
  try { await cache.put(SCOPE + path, resp); } catch (e) { throw isQuota(e) ? stop('quota', path) : e; }
}

/* ---------------------------------------------------------------- filling a whole set (the first copy, a new sw.js) */
/* Every file into the set named target: kept when the set already holds it and the website says it is unchanged (a fill
   that was interrupted and is now resumed), copied from the set named source when the website says that copy is
   unchanged, downloaded otherwise. A file the website does not have is noted as missing and the rest go on. The set is
   marked complete only when every file has been through. */
async function fill(targetName, sourceName, what) {
  const target = await caches.open(targetName);
  const tidx = (await indexOf(target)) || {version: VERSION, created: Date.now(), files: {}};
  tidx.complete = false;
  const source = sourceName && sourceName !== targetName && await hasSet(sourceName) ? await caches.open(sourceName) : null;
  const sidx = (source && await indexOf(source)) || {files: {}};
  const b = busy = {what, done: 0, total: FILES.length};
  broadcast();
  const one = async path => {
    const mine = tidx.files[path], theirs = sidx.files[path];
    const from = mine && mine.sha && await target.match(SCOPE + path) ? 'target'
      : theirs && theirs.sha && source && await source.match(SCOPE + path) ? 'source' : '';
    const prev = from === 'target' ? mine : from === 'source' ? theirs : null;
    const r = await probe(path, prev);
    if (r.missing && !prev) tidx.files[path] = {missing: true};
    else if (r.missing || r.same) {                     // unchanged, or gone from the website: keep the copy there is
      if (from === 'source') await put(target, path, r.buf ? respOf(r.buf, Object.assign({}, prev, r.meta)) : await source.match(SCOPE + path));
      tidx.files[path] = Object.assign({}, prev, r.meta || {});
      delete tidx.files[path].wasted;
    } else {
      await put(target, path, respOf(r.buf, r.meta));
      tidx.files[path] = r.meta;
    }
    b.done++;
    broadcastSoon();
  };
  try {
    await one('index.html');
    const list = (await listFrom(target)).filter(p => p !== 'index.html');
    b.total = list.length + 1;
    await pool(list, one);
    tidx.complete = true;
    await target.put(INDEX, json(tidx));
    await info({result: {kind: 'ok', at: Date.now()}, checkedAt: Date.now(), quotaAt: 0});
    return {complete: true};
  } catch (e) {
    const kind = e.kind || (isQuota(e) ? 'quota' : 'error');
    if (kind === 'quota') { try { await caches.delete(targetName); } catch (x) {} }    // what fitted is no use alone: free it
    else { try { await target.put(INDEX, json(tidx)); } catch (x) {} }                // kept, to go on from next time
    await info({result: {kind, at: Date.now(), path: e.path || '', status: e.status || 0, msg: e.kind ? '' : String(e && e.message || e).slice(0, 200)},
      checkedAt: Date.now(), quotaAt: kind === 'quota' ? Date.now() : 0});
    return {complete: false, why: kind};
  } finally {
    if (busy === b) busy = null;
    broadcast();
  }
}

/* ---------------------------------------------------------------- install and activate */
self.addEventListener('install', ev => { phase = 'installing'; ev.waitUntil(install()); });
async function install() {
  const first = !self.registration.active;
  const key = 'installing-' + VERSION, mine = await rec(key);
  const name = mine && await hasSet(mine.name) ? mine.name : SETS + stamp();
  await setRec(key, {name, version: VERSION});
  const L = await rec('live');
  const r = await fill(name, L && L.name, 'install');
  /* replacing a worker that already serves a complete copy: take over only with a complete one of its own; the browser
     tries again at the next start. The very first worker goes ahead and a later check finishes its set. */
  if (!r.complete && !first) throw new Error('the offline copy could not be completed (' + r.why + ')');
}
self.addEventListener('activate', ev => { ev.waitUntil(activate()); });
async function activate() {
  await lock(async () => {
    const key = 'installing-' + VERSION, mine = await rec(key);
    const done = mine && await hasSet(mine.name) && ((await indexOf(await caches.open(mine.name))) || {}).complete;
    if (done) {
      await setRec('live', {name: mine.name, version: VERSION, at: Date.now()});
      await setRec(key, null);
    } else {
      /* only the very first worker of this folder can get here with its set unfinished (a replacement does not take
         over without a whole set), so any set still named is a leftover of an earlier registration: not served */
      await setRec('live', null);
    }
    await setRec('staged', null);
    live = null;
    /* every other cache of this folder goes, except a set a newer worker may be filling right now */
    const keep = new Set([STATE]);
    const L = await rec('live');
    if (L && L.name) keep.add(L.name);
    const m2 = await rec(key);
    if (m2 && m2.name) keep.add(m2.name);
    const newer = !!(self.registration.installing || self.registration.waiting);
    for (const k of await caches.keys()) {
      if (k.indexOf(PFX) !== 0 || keep.has(k)) continue;
      if (newer && k.indexOf(SETS) !== 0) continue;
      await caches.delete(k);
    }
    if (!newer) {
      const st = await caches.open(STATE);
      for (const r of await st.keys()) if (r.url.indexOf(REC('installing-')) === 0 && r.url !== REC(key)) await st.delete(r);
    }
    phase = 'active';
  });
  await self.clients.claim();
  broadcast();
}

/* ---------------------------------------------------------------- checking for a new version */
let checking = null;
function check(force) {
  if (!checking) checking = runCheck(force).catch(() => {}).finally(() => { checking = null; broadcast(); });
  return checking;
}
async function runCheck(force) {
  if (phase === 'installing') return;
  const I = await info(), now = Date.now();
  if (!force) {
    if (I.checkedAt && now - I.checkedAt < (I.slow ? SLOW : THROTTLE)) return;
    if (I.quotaAt && now - I.quotaAt < QUOTA_WAIT) return;
  }
  const L = await rec('live');
  if (!L || !(await hasSet(L.name))) return finishFirst();
  const S = await rec('staged');
  const baseName = S && S.version === VERSION && await hasSet(S.name) ? S.name : L.name;
  const b = busy = {what: 'check', done: 0, total: FILES.length};
  broadcast();
  let r;
  try { r = await compare(baseName, b); }
  catch (e) {
    const kind = e.kind || (isQuota(e) ? 'quota' : 'error');
    /* offline or unreachable: not counted as a check, so coming back online asks again at once */
    const patch = {result: {kind, at: now, path: e.path || '', status: e.status || 0, msg: e.kind ? '' : String(e && e.message || e).slice(0, 200)},
      quotaAt: kind === 'quota' ? now : I.quotaAt || 0};
    if (kind !== 'offline' && kind !== 'network') patch.checkedAt = now;
    await info(patch);
    return;
  } finally {
    if (busy === b) busy = null;
  }
  await info({checkedAt: now, result: {kind: r.changed.length ? 'staged' : (S ? 'staged' : 'ok'), at: now, changed: r.changed.length},
    slow: r.wasted >= 3, quotaAt: 0});
}
/* the first copy was not finished (offline half way, a full disk, the page closed): go on with it */
async function finishFirst() {
  const key = 'installing-' + VERSION, mine = await rec(key);
  const name = mine && await hasSet(mine.name) ? mine.name : SETS + stamp();
  await setRec(key, {name, version: VERSION});
  const r = await fill(name, null, 'install');
  if (!r.complete) return;
  await lock(async () => {
    if (await rec('live')) return;
    await setRec('live', {name, version: VERSION, at: Date.now()});
    await setRec(key, null);
    live = null;
  });
}
/* every file of the set named baseName (the staged one when there is one, else the one in use) against the website */
async function compare(baseName, b) {
  const base = await caches.open(baseName);
  const bidx = (await indexOf(base)) || {files: {}};
  const nidx = {version: VERSION, created: Date.now(), files: {}, complete: false};
  const changed = [];
  let target = null, tname = null, made = null, wasted = 0;
  const into = async (path, resp) => {                  // the staging copy is made at the first change, once
    if (!made) made = (async () => { tname = SETS + stamp(); target = await caches.open(tname); return target; })();
    await put(await made, path, resp);
  };
  const one = async path => {
    const prev = bidx.files[path];
    const have = prev && prev.sha && !prev.missing && await base.match(SCOPE + path) ? prev : null;
    const r = await probe(path, have);
    if (r.missing) nidx.files[path] = have || {missing: true};          // gone from the website: the copy there is stays
    else if (r.same) { const m = Object.assign({}, have, r.meta); if (m.wasted) wasted++; delete m.wasted; nidx.files[path] = m; }
    else { await into(path, respOf(r.buf, r.meta)); nidx.files[path] = r.meta; changed.push(path); }
    b.done++;
    broadcastSoon();
  };
  try {
    await one('index.html');
    const list = (await listFrom(changed.includes('index.html') ? await made : base)).filter(p => p !== 'index.html');
    b.total = list.length + 1;
    await pool(list, one);
    if (!changed.length) {
      /* nothing new; keep what the website said about each file (a touched file, the switch to If-Modified-Since) */
      if (JSON.stringify(nidx.files) !== JSON.stringify(bidx.files)) {
        nidx.complete = bidx.complete !== false;
        nidx.created = bidx.created || nidx.created;
        try { await base.put(INDEX, json(nidx)); } catch (e) {}
      }
      return {changed, wasted};
    }
    /* the rest of the set, unchanged, from the base: the staging copy is a whole set */
    for (const path of Object.keys(nidx.files)) {
      if (changed.includes(path) || nidx.files[path].missing) continue;
      const r = await base.match(SCOPE + path);
      if (r) await into(path, r); else delete nidx.files[path];
    }
    nidx.complete = true;
    await target.put(INDEX, json(nidx));
  } catch (e) {
    if (tname) { try { await caches.delete(tname); } catch (x) {} }
    throw e;
  }
  await lock(async () => {
    const S = await rec('staged'), L = await rec('live');
    const before = S && S.name === baseName ? S.files || [] : [];
    await setRec('staged', {name: tname, version: VERSION, at: Date.now(), files: Array.from(new Set(before.concat(changed)))});
    if (S && S.name !== tname && !(L && L.name === S.name)) { try { await caches.delete(S.name); } catch (e) {} }
  });
  return {changed, wasted};
}

/* ---------------------------------------------------------------- the swap */
function apply() {
  return lock(async () => {
    const S = await rec('staged');
    if (!S) return false;
    if (S.version !== VERSION || !(await hasSet(S.name))) { await setRec('staged', null); return false; }
    const was = await rec('live');
    await setRec('live', {name: S.name, version: VERSION, at: Date.now()});
    await setRec('staged', null);
    live = null;
    if (was && was.name && was.name !== S.name) { try { await caches.delete(was.name); } catch (e) {} }
    const i = Object.assign((await rec('info')) || {}, {lastSwap: {at: Date.now(), files: S.files || []}});
    await setRec('info', i);
    return true;
  }).then(ok => { if (ok) broadcast(); return ok; });
}
/* a start with no workstation window open takes a ready update first: nothing is open to mix it with */
async function coldStart() {
  const S = await rec('staged');
  if (!S || S.version !== VERSION) return;
  if ((await self.clients.matchAll({type: 'window'})).length) return;
  await apply();
}

/* ---------------------------------------------------------------- the pages' requests */
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;                       // the relay's posts, HEAD: the network, untouched
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;        // another website: untouched
  if (url.href.indexOf(SCOPE) !== 0) return;              // outside this folder (the relay at /ai, the site): untouched
  if (url.pathname === '/ai' || url.pathname.indexOf('/ai/') === 0) return;
  if (url.searchParams.has('nbh-online')) return;         // the page asked for the website itself
  if (req.headers.has('range')) return;
  let path;
  try { path = decodeURIComponent(url.pathname.slice(ROOT_PATH.length)); } catch (e) { return; }
  if (path === '') path = 'index.html';
  const nav = req.mode === 'navigate';
  if (!nav && !KNOWN.has(path)) return;                   // not one of the saved files: as if there were no worker
  ev.respondWith(serve(req, path, nav));
});
async function serve(req, path, nav) {
  if (nav && req.destination === 'document') { try { await coldStart(); } catch (e) {} }
  let L = {cache: null};
  try { L = await liveSet(); } catch (e) {}
  if (L.cache) {
    try { const hit = await L.cache.match(SCOPE + path); if (hit) return hit; } catch (e) {}
  }
  try { return await fetch(req); }
  catch (e) { if (nav) return offlinePage(!!L.cache); throw e; }
}
function offlinePage(haveCopy) {
  const home = SCOPE;
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Offline · FBA and BIP Workstation</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#f1f4f3;color:#1a2933;font:15px/1.55 "Segoe UI","Helvetica Neue",Arial,system-ui,sans-serif;padding:24px;box-sizing:border-box}' +
    'main{max-width:520px;background:#fff;border:1px solid #cfdad8;border-radius:12px;padding:28px 30px}h1{font:600 21px/1.3 "Iowan Old Style",' +
    '"Palatino Linotype",Palatino,Georgia,serif;color:#182e43;margin:0 0 10px}p{margin:8px 0;color:#54676f}a{display:inline-block;margin-top:12px;' +
    'background:#182e43;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:6px}</style></head><body><main>' +
    '<h1>This page is not saved on this device</h1><p>The device is offline, and this page has not been saved for offline use here.</p>' +
    (haveCopy ? '<p>The workstation itself is saved and opens without the internet.</p><a href="' + home + '">Open the workstation</a>'
      : '<p>Open the workstation once while online: it saves its files on the device, and from then on it opens without the internet.</p>') +
    '</main></body></html>';
  return new Response(html, {status: 503, statusText: 'Offline', headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}

/* ---------------------------------------------------------------- the shell's questions */
self.addEventListener('message', ev => {
  const d = ev.data || {};
  if (d.nbh !== 'offline') return;
  const port = ev.ports && ev.ports[0];
  const reply = async extra => {
    const m = Object.assign({nbh: 'offline', type: 'status', status: await status()}, extra || {});
    try { if (port) port.postMessage(m); else if (ev.source) ev.source.postMessage(m); } catch (e) {}
  };
  let job;
  if (d.cmd === 'status') job = reply();
  else if (d.cmd === 'check') job = check(!!d.force).then(() => reply());
  else if (d.cmd === 'apply') job = apply().then(ok => reply({applied: ok}));
  else if (d.cmd === 'skip-waiting') job = self.skipWaiting();
  else return;
  ev.waitUntil(Promise.resolve(job).catch(() => {}));
});
