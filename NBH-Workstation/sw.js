/* sw.js: the workstation's offline copy (v21.43).

   What it does. The first time the workstation opens from the website, this worker saves its files on the device: the
   shell, the 44 forms, the picture library, the respondent page and its library, the PDF tools, the manifest and the
   icons (FILES below). From then on every one of those files is served from that copy at once, online or not, so the
   workstation opens and works without the internet. Nothing a person types ever passes through here: the copy holds
   the workstation's own files and nothing else, and the forms still save cases as files.

   What it never touches. A request that is not a GET, a request to another website, anything outside this folder (the
   writing help's relay at /ai, the other edition, the practice's site) and a request for a part of a file (Range) go to
   the network exactly as if there were no worker: the worker does not answer them at all. So does a request that
   carries nbh-online in its query (the page asks for the website itself with it: to sign in, to fetch a file for this
   worker past a password, after a reset), except a page load with nbh-online=reset, which deletes this copy and
   forgets the worker before it goes to the website (see below).

   Only the workstation's own files are kept. Every file is checked before it is saved: the website's answer must not
   be a redirect, must have the type the file has (a page is HTML, a script is not, an icon is a PNG), and must be the
   whole file: a page ends with </html> and carries the workstation's mark (the save block every page has; the shell
   also its list of forms and this part's script). A holding page ("account suspended"), a sign-in page, a redirect or
   a file cut short is refused, and nothing is saved from that look. The host's own markup (GoDaddy's cPanel puts a
   monitoring script before </head>, </body> or </html> of every page it serves: an inline script naming _trfq and a
   script from img1.wsimg.com) is cut out of each page before it is compared or saved, so a saved page never waits for
   that script and a snippet that changes between requests is not taken for a change.

   The release list. tools/pwa-sw.py writes release.json beside this file: every file of the release with its length
   and SHA-256, uploaded with the files. It guards a look made while an upload is under way: a file the list moved (its
   entry differs from the list the copy in use was checked against) must arrive exactly as listed, and while the website
   still has the old copy, or other bytes, the look takes nothing and the next one tries again. A file the list did not
   move is checked on its own as below, so an update of single files with release.json left as it was still arrives.
   The list also finds host markup of a shape not known here: an HTML page longer than its listed (or saved) copy is cut
   where hosts put their markup, before </head>, </body>, </html> or at the end, and taken only when the result is that
   copy byte for byte. Without release.json (an older upload) every file is checked on its own.

   Updates. The shell asks for a check when it starts, every few minutes while it is in front (at most every five
   minutes) and when Check for updates is pressed. A check asks the website about every saved file with a conditional
   request (If-None-Match with its ETag, or If-Modified-Since with its Last-Modified when the ETag never matches, as with
   an Apache that marks compressed copies -gzip), and about release.json the same way; an unchanged file costs a 304. A
   website that cannot answer "has this changed?" (every file comes back whole and the same) puts automatic checks on
   hourly, and those skip the files while release.json is unchanged. A changed file goes into a staging copy, a new set
   in a cache of its own, and only when every file has been looked at, the rest copied from the set in use, is the
   staging copy recorded as ready. It is not used yet: the set in use goes on serving everything, forms opened later
   included, so the open page never mixes old and new files. The shell then says a new version is ready; Reload swaps
   the sets, deletes the old one and loads the page again from the new set, but only while it is the one workstation
   window open (another window would go on with the old page and new files); the next start with no workstation window
   open takes it as well. A check that cannot finish (offline, the website's password, an error, a full disk, an answer
   that is not the workstation's file, an upload under way) changes nothing and is recorded for the shell to show.

   The website's password (cPanel Directory Privacy). Should the browser not hand its sign-in to this worker's own
   requests, a 401 is asked again through an open workstation window: the page fetches the file itself (its requests
   carry the sign-in), past this worker, and passes the bytes back; they are checked like any other answer. A 401 is
   never saved.

   Changing this file. The browser fetches sw.js itself on every start and every update check; a changed sw.js is a new
   worker, which saves a complete set of its own while the old one keeps serving (unchanged files are copied from the
   old set; only changed ones are downloaded), waits, and takes over when Reload is pressed (in the one window open).
   Its caches carry its VERSION in their names, and on taking over it deletes every cache of this folder but its own set
   and the small state cache. Both editions can live on one website: every cache name starts with this folder's
   address, and each worker talks only to its own folder's windows.

   Reset without the shell. A page load of this folder with ?nbh-online=reset in its address (for example
   https://newsomebh.com/workstation-rps/?nbh-online=reset typed into Safari) fetches the page from the website and,
   when that works, deletes this folder's copy and forgets the worker before handing the page over; offline it says so
   and keeps the copy.

   The state cache holds small JSON records: live (the set in use), staged (a set ready to take over), installing-<VERSION>
   (the set a worker of that version is filling) and info (the last check: when, what it found, whether the website
   answers conditional requests, the last swap). Each set holds its own index: per file its ETag, Last-Modified, length,
   SHA-256 and type, and whether the website lacked it; and the release list it was checked against (its hash,
   validators and entries). */
'use strict';

/* ---- written by tools/pwa-sw.py from index.html and the files it loads; run it again rather than editing this part ---- */
const VERSION = '4a56ac958d54';
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
  'manifest.json',
  'apple-touch-icon.png',
  'nbh-respond.js',
  'nbh-pictos.js',
  'pdf-lib.min.js',
  'nbh-pdf-tools.js',
  'nbh-dd1-narration.js',
  'nbh-tk1-video.js',
  'nbh-sm1-narration.js',
  'nbh-tk1-narration.js',
  'respond.html',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
];
/* ---- end of the part tools/pwa-sw.py writes ---- */

const SCOPE = self.registration.scope;                 // this folder, e.g. https://example.org/workstation/
const ROOT_PATH = new URL(SCOPE).pathname;
const PFX = 'nbh-offline:' + SCOPE + ':';
const STATE = PFX + 'state';
const SETS = PFX + 'v' + VERSION + ':set:';
const LIST = 'release.json';                            // the release list tools/pwa-sw.py writes beside this file
const THROTTLE = 5 * 60 * 1000;                         // automatic checks, at most this often
const SLOW = 60 * 60 * 1000;                            // ... or this often when every check has to download everything
const QUOTA_WAIT = 60 * 60 * 1000;                      // after "no room on this device", try again on its own after an hour
const POOL = 4;                                         // files asked about at once
const REC = name => SCOPE + '__nbh-offline__/' + name;  // the records' keys: inside the folder, never a real file
const INDEX = REC('index');
const SAVE_TAG = '<script id="nbh-pwa-save">';          // every page of the workstation but respond.html carries it

/* 'installing' while this worker saves its set, 'waiting' once saved with another still serving, then 'active' */
const STATES = {parsed: 'starting', installing: 'installing', installed: 'waiting', activating: 'active', activated: 'active'};
let phase = (self.serviceWorker && STATES[self.serviceWorker.state]) || 'starting';
let busy = null;                                        // {what:'install'|'check', done, total} while saving or checking;
                                                        // each run counts on its own object and clears only that one
let live = null;                                        // {name, cache} of the set in use, read once per start of the worker
let known = new Set(FILES);                             // the files answered from the copy (FILES and the set's own list)
let resetting = false;                                  // deleting its copy (?nbh-online=reset): everything to the network
let epoch = 0;                                          // counts resets, so that a check begun before one keeps nothing

/* ---------------------------------------------------------------- small helpers */
const json = v => new Response(JSON.stringify(v), {headers: {'Content-Type': 'application/json'}});
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isQuota = e => !!e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(String(e.message || '')));
function stop(kind, path, status) { const e = new Error(kind + (path ? ' at ' + path : '') + (status ? ' (' + status + ')' : '')); e.kind = kind; e.path = path || ''; e.status = status || 0; return e; }
const TYPES = {html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json', png: 'image/png',
  webp: 'image/webp', svg: 'image/svg+xml', css: 'text/css; charset=utf-8', txt: 'text/plain; charset=utf-8'};
const extOf = path => ((/\.([a-z0-9]+)$/i.exec(path) || [])[1] || '').toLowerCase();
const typeOf = path => TYPES[extOf(path)] || 'application/octet-stream';
const local = name => /^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]+$/.test(name || '');
async function sha(buf) {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
}
/* bytes as a string of one character per byte, so that markup can be found and cut without changing any other byte */
function bin(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return s;
}
function unbin(s) { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
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
  known = new Set(FILES);
  if (live.cache) { const idx = await indexOf(live.cache); if (idx && idx.files) for (const p of Object.keys(idx.files)) known.add(p); }
  return live;
}

/* FILES, and any form index.html's FORMS names that FILES does not (an index.html uploaded before this file was
   rebuilt) */
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

/* ---------------------------------------------------------------- the windows of this folder */
/* this folder's windows (not another edition's, not the frames inside a window), controlled or not */
async function windows() {
  try {
    return (await self.clients.matchAll({type: 'window', includeUncontrolled: true}))
      .filter(c => c.url.indexOf(SCOPE) === 0 && c.frameType !== 'nested');
  } catch (e) { return []; }
}
async function status() {
  const L = await rec('live'), S = await rec('staged'), I = await info();
  let files = 0, bytes = 0, total = 0, set = null, mode = '';
  const missing = [];
  if (L && await hasSet(L.name)) {
    set = L.name;
    const idx = (await indexOf(await caches.open(L.name))) || {files: {}};
    mode = idx.list ? 'list' : 'files';
    for (const [p, m] of Object.entries(idx.files)) { total++; if (m.missing) missing.push(p); else { files++; bytes += m.len || 0; } }
  }
  return {version: VERSION, scope: SCOPE, phase, live: !!set, set, files, total, bytes, missing, mode,
    staged: S && S.version === VERSION && S.verified ? {files: S.files || [], at: S.at} : null,
    busy: busy ? {what: busy.what, done: busy.done, total: busy.total} : null,
    checkedAt: I.checkedAt || 0, result: I.result || null, slow: !!I.slow, lastSwap: I.lastSwap || null};
}
async function broadcast() {
  try {
    const s = await status();
    for (const c of await windows()) c.postMessage({nbh: 'offline', type: 'status', status: s});
  } catch (e) {}
}
let soon = null;
function broadcastSoon() { if (!soon) soon = setTimeout(() => { soon = null; broadcast(); }, 150); }

/* ---------------------------------------------------------------- asking the website, past a password if need be */
/* run: {page: true once a window fetched for this worker (keep asking it), noPage: true once none could} */
async function net(path, init, run) {
  const url = SCOPE + path;
  if (run && run.page) { const r = await viaPage(url, init.headers, run); if (r) return r; }
  let res;
  try { res = await fetch(url, init); }
  catch (e) { throw stop(self.navigator && self.navigator.onLine === false ? 'offline' : 'network', path); }
  if (res.status !== 401 || !run || run.noPage) return res;
  /* the website asks for its password: the browser may not hand its sign-in to this worker; a window's own request does */
  const r = await viaPage(url, init.headers, run);
  if (r && r.status !== 401) run.page = true;
  return r || res;
}
/* the shell's windows (index.html) fetch for this worker: each says at once that it has the question (within 5 s),
   then answers when the file is in (within two minutes, a slow connection and the picture library allowed for) */
async function viaPage(url, headers, run) {
  const cs = (await windows()).filter(c => /^(index\.html)?$/.test(c.url.slice(SCOPE.length).split(/[?#]/)[0]));
  for (const c of cs) {
    const r = await new Promise(res => {
      const ch = new MessageChannel();
      let t = setTimeout(() => res(null), 5000);
      ch.port1.onmessage = e => {
        const d = e.data || {};
        if (d.ack) { clearTimeout(t); t = setTimeout(() => res(null), 120000); return; }
        clearTimeout(t);
        if (!d.ok) return res(null);
        res({status: d.status, redirected: !!d.redirected, type: 'basic', headers: new Headers(d.headers || {}),
          arrayBuffer: async () => d.body || new ArrayBuffer(0)});
      };
      try { c.postMessage({nbh: 'offline', type: 'fetch', url, headers: headers || {}}, [ch.port2]); } catch (e) { clearTimeout(t); res(null); }
    });
    if (r) return r;
  }
  if (run) run.noPage = true;
  return null;
}

/* ---------------------------------------------------------------- is it the workstation's file? */
/* GoDaddy's monitoring snippet: an inline script naming _trfq / _trfd and its loader from img1.wsimg.com. The pages of
   the workstation never name either (tools/pwa-sw.py checks), so cutting them can only take out the host's markup. */
const HOST = [
  /<script\b[^>]*>(?:(?!<\/script)[\s\S]){0,4000}?\b_trf[dq]\b(?:(?!<\/script)[\s\S]){0,4000}?<\/script\s*>/gi,
  /<script\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\/img\d*\.wsimg\.com\/[^>]*>\s*<\/script\s*>/gi
];
function cutHost(u8) {
  const s = bin(u8);
  let t = s;
  for (const re of HOST) t = t.replace(re, '');
  return t === s ? u8 : unbin(t);
}
/* markup of a shape not known above: the release list says how long the page is, so cut the extra bytes where hosts put
   them (just before the first </head>, </body> or </html>, or at the end, the same amount at each place chosen) and keep
   the result only when it is the page byte for byte */
async function cutUnknown(u8, want) {
  const extra = u8.length - want.len;
  if (extra <= 0 || extra > 65536) return null;
  const s = bin(u8), low = s.toLowerCase();
  const at = [low.indexOf('</head>'), low.indexOf('</body>'), low.indexOf('</html>'), s.length].filter((p, i, a) => p >= 0 && a.indexOf(p) === i);
  for (let mask = 1; mask < (1 << at.length); mask++) {
    const pick = at.filter((p, i) => mask & (1 << i));
    if (extra % pick.length) continue;
    const cut = extra / pick.length;
    if (pick.some(p => p < cut)) continue;
    let t = s;
    for (const p of pick.slice().sort((a, b) => b - a)) t = t.slice(0, p - cut) + t.slice(p);
    const out = unbin(t);
    if (await sha(out) === want.sha) return out;
  }
  return null;
}
/* '' when the bytes can be the file at path; else why not (type, end, mark) */
function sane(path, u8, ctype) {
  const ext = extOf(path), t = String(ctype || '').toLowerCase();
  if (ext === 'html') {
    if (t && !/html/.test(t)) return 'type';
    const s = bin(u8);
    if (!/<\/html>\s*(?:<script\b[^>]*>[\s\S]*?<\/script\s*>\s*)*$/i.test(s.slice(-8192))) return 'end';
    if (path !== 'respond.html' && s.indexOf(SAVE_TAG) < 0) return 'mark';
    if (path === 'index.html' && (s.indexOf('const FORMS=[') < 0 || s.indexOf('<script id="nbh-pwa">') < 0)) return 'mark';
    if (path === 'respond.html' && s.indexOf('nbh-respond.js') < 0) return 'mark';
    return '';
  }
  if (/html/.test(t)) return 'type';                    // a script, a list or a picture answered with a page
  if (ext === 'js') {
    const h = bin(u8.subarray(0, 1024)).replace(/^\xef\xbb\xbf/, '').replace(/^\s+/, '');
    if (!h || h[0] === '<') return 'mark';
    if (path === 'nbh-pictos.js' && h.indexOf('NBH_PICTOS') < 0) return 'mark';
    return '';
  }
  if (ext === 'png') return u8.length > 24 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47 ? '' : 'mark';
  if (ext === 'json') {
    try { const j = JSON.parse(new TextDecoder().decode(u8)); return j && typeof j === 'object' && (path !== 'manifest.json' || j.name) ? '' : 'mark'; }
    catch (e) { return 'mark'; }
  }
  return '';
}
function answer(res, path) {                            // the answers that are never a file: thrown
  if (res.type === 'opaqueredirect' || res.redirected || (res.status >= 300 && res.status < 400 && res.status !== 304)) throw stop('foreign', path, 'redirect');
  if (res.status === 401) throw stop('auth', path, 401);   // the folder's password (cPanel Directory Privacy)
}

/* ---------------------------------------------------------------- the release list */
/* release.json as the website has it now; prev: the list as the base set recorded it (with its ETag, Last-Modified and
   entries) or null. An answer that is not a release list (a file damaged in the upload) counts as no list: every file
   is then checked on its own, as below. A redirect or the password still stop the look (answer()). */
async function getList(prev, run) {
  const h = {};
  if (prev && prev.sha) {
    if (prev.etag && !prev.imsOnly) h['If-None-Match'] = prev.etag;
    else if (prev.lm) h['If-Modified-Since'] = prev.lm;
  }
  const res = await net(LIST, {cache: Object.keys(h).length ? 'no-store' : 'no-cache', credentials: 'same-origin', redirect: 'manual', headers: h}, run);
  answer(res, LIST);
  const vals = {etag: res.headers.get('ETag') || (prev && prev.etag) || '', lm: res.headers.get('Last-Modified') || (prev && prev.lm) || ''};
  if (res.status === 304 && prev) return {same: true, rec: Object.assign({}, prev, vals)};
  if (res.status === 403 || res.status === 404 || res.status === 410) return {none: true};   // not uploaded, or not served
  if (res.status !== 200) throw stop('server', LIST, res.status);
  let raw;
  try { raw = new Uint8Array(await res.arrayBuffer()); } catch (e) { throw stop('network', LIST); }
  const s = await sha(raw);
  if (prev && prev.sha === s) return {same: true, rec: Object.assign({}, prev, vals, {imsOnly: !!h['If-None-Match']})};
  let j = null;
  try { j = JSON.parse(new TextDecoder().decode(raw)); } catch (e) {}
  const files = j && j.nbh === 'release' && j.files && typeof j.files === 'object' ? j.files : null;
  if (!files || !Object.keys(files).length || Object.entries(files).some(([p, m]) => !local(p) || !m || !/^[0-9a-f]{64}$/.test(m.sha) || !(m.len >= 0)))
    return {none: true, bad: true};
  const keep = {};
  for (const [p, m] of Object.entries(files)) keep[p] = {len: m.len, sha: m.sha};
  return {rec: {sha: s, etag: res.headers.get('ETag') || '', lm: res.headers.get('Last-Modified') || '', release: String(j.release || ''), files: keep}};
}
/* the list's entry for a file, and whether the list moved it since the list the base set was checked against: a moved
   file must arrive as listed (expect), unless the base set's copy already is the listed one */
function wanted(list, baseList, path, prev) {
  const want = list && list.files && list.files[path] || null;
  if (!want) return {want: null, expect: false};
  const was = baseList && baseList.files && baseList.files[path];
  return {want, expect: !(was && was.sha === want.sha) && !(prev && prev.sha === want.sha)};
}

/* ---------------------------------------------------------------- asking the website about one file */
/* prev: what the base set holds about the file ({etag, lm, sha, len, imsOnly}) or null when it holds no copy; want: the
   release list's entry for it ({len, sha}) or null; expect: the list moved the file, so the website must now give the
   listed copy, and anything else (the old copy still, nothing, other bytes) means an upload under way: the whole look
   stops and nothing is taken. A file the list did not move is taken as the website gives it once it passes sane(), so
   a release.json left behind by an upload of single files never holds an update back. */
async function probe(path, prev, run, want, expect) {
  const h = {};
  if (prev && prev.sha) {
    if (prev.etag && !prev.imsOnly) h['If-None-Match'] = prev.etag;
    else if (prev.lm) h['If-Modified-Since'] = prev.lm;
  }
  const cond = Object.keys(h).length > 0;
  const res = await net(path, {cache: cond ? 'no-store' : 'no-cache', credentials: 'same-origin', redirect: 'manual', headers: h}, run);
  answer(res, path);
  if (res.status === 304 && prev) {
    if (expect) throw stop('mismatch', path, 'old');     // the list names a new copy; the website still has the old one
    return {same: true, meta: {etag: res.headers.get('ETag') || prev.etag || '', lm: res.headers.get('Last-Modified') || prev.lm || ''}};
  }
  if (res.status === 404 || res.status === 410) {
    if (expect) throw stop('mismatch', path, 404);       // listed, not on the website (yet)
    return {missing: true};
  }
  if (res.status !== 200) throw stop('server', path, res.status);
  let raw;
  try { raw = new Uint8Array(await res.arrayBuffer()); } catch (e) { throw stop('network', path); }
  const type = res.headers.get('Content-Type') || '';
  const html = extOf(path) === 'html';
  let u8 = html ? cutHost(raw) : raw;
  let s = await sha(u8);
  /* host markup of a shape not known above: cut where hosts put it, to the length of the copy it may be */
  if (html) {
    for (const t of expect ? [want] : [prev, want]) {
      if (!t || !t.sha || !t.len || t.sha === s) continue;
      const fixed = await cutUnknown(u8, t);
      if (fixed) { u8 = fixed; s = t.sha; break; }
    }
  }
  if (expect && s !== want.sha) {
    const bad = sane(path, u8, type);                   // not the listed file: something else, or another version of it
    throw bad ? stop('foreign', path, bad) : stop('mismatch', path);
  }
  if (!expect) { const bad = sane(path, u8, type); if (bad) throw stop('foreign', path, bad); }
  const meta = {etag: res.headers.get('ETag') || '', lm: res.headers.get('Last-Modified') || '',
    type: TYPES[extOf(path)] || type || typeOf(path), len: u8.byteLength, sha: s};
  if (prev && prev.sha === meta.sha) {
    /* the same bytes downloaded again: the website could not tell they had not changed from what was sent. An ETag
       that never matches (Apache's -gzip copies) leaves If-Modified-Since for next time; when that cannot tell either,
       or the website gives no ETag or Last-Modified at all, the download was wasted (enough of them and automatic
       checks slow down), and next time the ETag is tried again */
    if (h['If-None-Match']) meta.imsOnly = true;
    else { meta.imsOnly = false; meta.wasted = true; }
    return {same: true, meta, buf: u8};
  }
  return {same: false, meta, buf: u8};
}
async function put(cache, path, resp) {
  try { await cache.put(SCOPE + path, resp); } catch (e) { throw isQuota(e) ? stop('quota', path) : e; }
}
/* the files of a set but index.html: this worker's FILES, the forms the set's index.html lists, the base set's own and
   the release list's names */
async function namesOf(cache, idx, list) {
  const all = new Set(await listFrom(cache));
  for (const p of Object.keys((idx && idx.files) || {})) all.add(p);
  if (list && list.files) for (const p of Object.keys(list.files)) all.add(p);
  all.delete('index.html');
  return Array.from(all);
}

/* ---------------------------------------------------------------- filling a whole set (the first copy, a new sw.js) */
/* Every file into the set named target, each one asked about with a conditional request: kept when the set already
   holds it unchanged (a fill that was interrupted and is now resumed), copied from the set named source when that copy
   is unchanged, downloaded otherwise; a file the website does not have is noted as missing while the rest go on. A new
   sw.js filling beside the set in use waits, as a check does, for files the release list moved since that set; the
   very first copy takes the website as it is (there is nothing yet to keep it from). The set is marked complete only
   when every file has been through. */
async function fill(targetName, sourceName, what) {
  const target = await caches.open(targetName);
  const tidx = (await indexOf(target)) || {version: VERSION, created: Date.now(), files: {}};
  tidx.complete = false;
  const source = sourceName && sourceName !== targetName && await hasSet(sourceName) ? await caches.open(sourceName) : null;
  const sidx = (source && await indexOf(source)) || {files: {}};
  const b = busy = {what, done: 0, total: FILES.length}, run = {};
  broadcast();
  try {
    const Lr = await getList(source ? sidx.list || null : null, run);
    const list = Lr.none ? null : Lr.rec, baseList = source ? sidx.list || null : null;
    const done = {};
    const one = async path => {
      const mine = tidx.files[path], theirs = sidx.files[path];
      const from = mine && mine.sha && !mine.missing && await target.match(SCOPE + path) ? 'target'
        : theirs && theirs.sha && !theirs.missing && source && await source.match(SCOPE + path) ? 'source' : '';
      const prev = from === 'target' ? mine : from === 'source' ? theirs : null;
      const w = wanted(list, baseList, path, prev);
      const r = await probe(path, prev, run, w.want, !!source && w.expect);
      if (r.missing && !prev) tidx.files[path] = {missing: true};
      else if (r.missing || r.same) {                   // unchanged, or gone from the website: keep the copy there is
        if (from === 'source') await put(target, path, r.buf ? respOf(r.buf, Object.assign({}, prev, r.meta)) : await source.match(SCOPE + path));
        tidx.files[path] = Object.assign({}, prev, r.meta || {});
        delete tidx.files[path].wasted;
      } else {
        await put(target, path, respOf(r.buf, r.meta));
        tidx.files[path] = r.meta;
      }
      done[path] = true;
      b.done++;
      broadcastSoon();
    };
    await one('index.html');
    const names = await namesOf(target, null, list);
    b.total = names.length + 1;
    await pool(names, one);
    for (const p of Object.keys(tidx.files)) if (!done[p]) delete tidx.files[p];   // left over from an earlier fill
    tidx.list = list;
    tidx.complete = true;
    await target.put(INDEX, json(tidx));
    await info({result: {kind: 'ok', at: Date.now()}, checkedAt: Date.now(), quotaAt: 0, slow: false});
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
  if (phase === 'installing' || resetting) return;
  const I = await info(), now = Date.now();
  if (!force) {
    if (I.checkedAt && now - I.checkedAt < (I.slow ? SLOW : THROTTLE)) return;
    if (I.quotaAt && now - I.quotaAt < QUOTA_WAIT) return;
  }
  const L = await rec('live');
  if (!L || !(await hasSet(L.name))) return finishFirst();
  const S = await rec('staged');
  const baseName = S && S.version === VERSION && S.verified && await hasSet(S.name) ? S.name : L.name;
  const b = busy = {what: 'check', done: 0, total: FILES.length};
  broadcast();
  let r;
  try { r = await compare(baseName, b, {}, !!force); }
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
  await info({checkedAt: now, result: {kind: r.changed.length || (S && S.verified) ? 'staged' : 'ok', at: now, changed: r.changed.length},
    slow: r.skipped ? !!I.slow : r.wasted >= 3, quotaAt: 0});
}
/* the first copy was not finished (offline half way, a full disk, the page closed): go on with it */
async function finishFirst() {
  const ep = epoch;
  const key = 'installing-' + VERSION, mine = await rec(key);
  const name = mine && await hasSet(mine.name) ? mine.name : SETS + stamp();
  await setRec(key, {name, version: VERSION});
  const r = await fill(name, null, 'install');
  if (!r.complete) return;
  await lock(async () => {
    if (ep !== epoch) { try { await caches.delete(name); } catch (e) {} return; }   // reset meanwhile
    if (await rec('live')) return;
    await setRec('live', {name, version: VERSION, at: Date.now()});
    await setRec(key, null);
    live = null;
  });
}
/* Every file of the set named baseName (the staged one when there is one, else the one in use) against the website,
   each with a conditional request, and the release list with one too (see probe() for how the list is used). A website
   that cannot answer "has this changed?" (every file comes back whole, the same) puts automatic checks on hourly, and
   while its release list is unchanged those then skip the files (full: Check for updates, which asks about every one). */
async function compare(baseName, b, run, full) {
  const ep = epoch;
  const base = await caches.open(baseName);
  const bidx = (await indexOf(base)) || {files: {}};
  const I = await info();
  const Lr = await getList(bidx.list || null, run);
  const list = Lr.none ? null : Lr.rec, baseList = bidx.list || null;
  if (I.slow && !full && Lr.same) { b.done = b.total; return {changed: [], wasted: 0, skipped: true}; }
  const nidx = {version: VERSION, created: Date.now(), files: {}, complete: false, list};
  const changed = [];
  let target = null, tname = null, made = null, wasted = 0;
  const into = async (path, resp) => {                  // the staging copy is made at the first change, once
    if (!made) made = (async () => { tname = SETS + stamp(); target = await caches.open(tname); return target; })();
    await put(await made, path, resp);
  };
  try {
    const one = async path => {
      const p0 = bidx.files[path];
      const prev = p0 && p0.sha && !p0.missing && await base.match(SCOPE + path) ? p0 : null;
      const w = wanted(list, baseList, path, prev);
      const r = await probe(path, prev, run, w.want, w.expect);
      if (r.missing) nidx.files[path] = prev || {missing: true};          // gone from the website: the copy there is stays
      else if (r.same) { const m = Object.assign({}, prev, r.meta); if (m.wasted) wasted++; delete m.wasted; nidx.files[path] = m; }
      else { await into(path, respOf(r.buf, r.meta)); nidx.files[path] = r.meta; changed.push(path); }
      b.done++;
      broadcastSoon();
    };
    await one('index.html');
    const names = await namesOf(changed.includes('index.html') ? await made : base, bidx, list);
    b.total = names.length + 1;
    await pool(names, one);
    if (!changed.length) {
      /* nothing new; keep what the website said (a touched file, the switch to If-Modified-Since, the list now checked) */
      if (JSON.stringify(nidx.files) !== JSON.stringify(bidx.files) || JSON.stringify(nidx.list) !== JSON.stringify(bidx.list || null)) {
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
      if (r) await into(path, r); else throw stop('error', path, 'lost');
    }
    nidx.complete = true;
    await target.put(INDEX, json(nidx));
  } catch (e) {
    if (tname) { try { await caches.delete(tname); } catch (x) {} }
    throw e;
  }
  await lock(async () => {
    if (ep !== epoch) { try { await caches.delete(tname); } catch (e) {} return; }   // reset meanwhile: nothing to stage on
    const S = await rec('staged'), Lv = await rec('live');
    const before = S && S.name === baseName ? S.files || [] : [];
    /* verified: every file in it passed the checks above (and arrived as listed where the release list moved it) */
    await setRec('staged', {name: tname, version: VERSION, at: Date.now(), verified: true, files: Array.from(new Set(before.concat(changed)))});
    if (S && S.name !== tname && !(Lv && Lv.name === S.name)) { try { await caches.delete(S.name); } catch (e) {} }
  });
  return {changed, wasted};
}

/* ---------------------------------------------------------------- the swap */
/* from: the window that asked (a Client id). The swap changes what every window of this folder is served, so it goes
   ahead only when that window is the only one open; otherwise the answer names the others and nothing changes. */
function apply(from) {
  return lock(async () => {
    const S = await rec('staged');
    if (!S) return {applied: false};
    if (S.version !== VERSION || !S.verified || !(await hasSet(S.name))) { await setRec('staged', null); return {applied: false}; }
    if (from !== undefined) {
      const others = (await windows()).filter(c => c.id !== from).map(c => c.url);
      if (others.length) return {applied: false, others};
    }
    const was = await rec('live');
    await setRec('live', {name: S.name, version: VERSION, at: Date.now()});
    await setRec('staged', null);
    live = null;
    if (was && was.name && was.name !== S.name) { try { await caches.delete(was.name); } catch (e) {} }
    const i = Object.assign((await rec('info')) || {}, {lastSwap: {at: Date.now(), files: S.files || []}});
    await setRec('info', i);
    return {applied: true};
  }).then(r => { if (r.applied) broadcast(); return r; });
}
/* a start with no workstation window open takes a ready update first: nothing is open to mix it with */
async function coldStart() {
  const S = await rec('staged');
  if (!S || S.version !== VERSION || !S.verified) return;
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
  const nav = req.mode === 'navigate';
  if (url.searchParams.has('nbh-online')) {               // the page asked for the website itself
    if (nav && url.searchParams.get('nbh-online') === 'reset' && !resetting) ev.respondWith(resetThen(req));
    return;
  }
  if (resetting) return;
  if (req.headers.has('range')) return;
  let path;
  try { path = decodeURIComponent(url.pathname.slice(ROOT_PATH.length)); } catch (e) { return; }
  if (path === '') path = 'index.html';
  if (!nav && !known.has(path)) return;                   // not one of the saved files: as if there were no worker
  ev.respondWith(serve(req, path, nav));
});
async function serve(req, path, nav) {
  if (nav && req.destination === 'document') { try { await coldStart(); } catch (e) {} }
  let L = {cache: null};
  try { L = await liveSet(); } catch (e) {}
  if (L.cache) {
    try { const hit = await L.cache.match(SCOPE + path); if (hit) return hit; } catch (e) {}
  }
  let res;
  try { res = await fetch(req); }
  catch (e) { if (nav) return offlinePage(!!L.cache); throw e; }
  /* a page not saved here, behind the website's password: the browser may not ask for the password on a page load this
     worker passed on, so the page offers a load that does not come through the worker, which the browser answers */
  if (nav && res.status === 401) return signInPage(req.url);
  return res;
}
/* ?nbh-online=reset: the page from the website first; only when the website answers with the workstation (or asks for
   its password), this copy goes and the worker with it, and a small page loads the workstation again: that load no
   longer comes through this worker (a registration being removed answers nothing), so the page registers a fresh one.
   Offline, or when the website shows something else (a holding page), the copy is kept and the page says so. A browser
   that keeps this registration anyway (re-registered while a page it answered is open) keeps this worker, which then
   has no copy and saves a fresh one, as on a first visit. */
async function resetThen(req) {
  let res;
  try { res = await fetch(req); }
  catch (e) { return offlinePage(true, true); }
  if (res.status !== 401) {
    let ok = res.status === 200 && !res.redirected && res.type !== 'opaqueredirect';
    if (ok) { try { ok = !sane('index.html', cutHost(new Uint8Array(await res.clone().arrayBuffer())), res.headers.get('Content-Type') || ''); } catch (e) { ok = false; } }
    if (!ok) return keptPage();
  }
  resetting = true;
  epoch++;
  try {
    live = {name: null, cache: null};
    known = new Set();
    try { for (const k of await caches.keys()) if (k.indexOf(PFX) === 0) await caches.delete(k); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
  } finally {
    resetting = false;
    live = null;
    known = new Set(FILES);
  }
  if (res.status === 401) return signInPage(SCOPE, true);
  const home = esc(SCOPE);
  return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta http-equiv="refresh" content="0;url=' + home + '"><title>Reset · FBA and BIP Workstation</title><style>' + PAGE_CSS + '</style></head><body><main>' +
    '<h1>The offline copy was reset</h1><p>The copy saved on this device is deleted. The workstation loads again from the website and saves a fresh copy.</p>' +
    '<a href="' + home + '">Open the workstation</a></main><script>location.replace(' + JSON.stringify(SCOPE) + ');<\/script></body></html>',
    {status: 200, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}
function keptPage() {
  const home = esc(SCOPE);
  return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Not reset · FBA and BIP Workstation</title><style>' + PAGE_CSS + '</style></head><body><main>' +
    '<h1>The offline copy was not reset</h1><p>The website did not answer with the workstation just now (it may be showing a holding page), ' +
    'so the copy saved on this device is kept and goes on working. Try again when the website is back.</p>' +
    '<a href="' + home + '">Open the workstation</a></main></body></html>',
    {status: 503, statusText: 'Not reset', headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}
/* the same address with nbh-online=signin in its query (before any #...), which this worker never answers */
function signInPage(url, wasReset) {
  let to = SCOPE;
  try { const u = new URL(url); u.searchParams.set('nbh-online', 'signin'); to = u.href; } catch (e) {}
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Sign in · FBA and BIP Workstation</title><style>' + PAGE_CSS + '</style></head><body><main>' +
    '<h1>' + (wasReset ? 'The offline copy was reset' : 'This page needs the website’s password') + '</h1>' +
    '<p>' + (wasReset ? 'The copy saved on this device is deleted. The website asks for its password before it loads the workstation again.'
      : 'The website asked for its password, and this page is not saved on this device.') + '</p>' +
    '<a href="' + esc(to) + '">Sign in</a></main></body></html>';
  return new Response(html, {status: 401, statusText: 'Unauthorized', headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}
/* the small pages this worker makes itself, in the shell's colours */
const PAGE_CSS = 'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#f1f4f3;color:#1a2933;font:15px/1.55 "Segoe UI","Helvetica Neue",Arial,system-ui,sans-serif;padding:24px;box-sizing:border-box}' +
  'main{max-width:520px;background:#fff;border:1px solid #cfdad8;border-radius:12px;padding:28px 30px}h1{font:600 21px/1.3 "Iowan Old Style",' +
  '"Palatino Linotype",Palatino,Georgia,serif;color:#182e43;margin:0 0 10px}p{margin:8px 0;color:#54676f}a{display:inline-block;margin-top:12px;' +
  'background:#182e43;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:6px}';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function offlinePage(haveCopy, reset) {
  const home = esc(SCOPE);
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Offline · FBA and BIP Workstation</title><style>' + PAGE_CSS + '</style></head><body><main>' +
    (reset ? '<h1>The offline copy was not reset</h1><p>Resetting needs the internet: it loads the workstation again from the website. ' +
      'This device is offline, so the copy saved here is kept as it is.</p><a href="' + home + '">Open the workstation</a>'
      : '<h1>This page is not saved on this device</h1><p>The device is offline, and this page has not been saved for offline use here.</p>' +
      (haveCopy ? '<p>The workstation itself is saved and opens without the internet.</p><a href="' + home + '">Open the workstation</a>'
        : '<p>Open the workstation once while online: it saves its files on the device, and from then on it opens without the internet.</p>')) +
    '</main></body></html>';
  return new Response(html, {status: 503, statusText: 'Offline', headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
}

/* ---------------------------------------------------------------- the shell's questions */
self.addEventListener('message', ev => {
  const d = ev.data || {};
  if (d.nbh !== 'offline') return;
  const port = ev.ports && ev.ports[0];
  const from = ev.source && ev.source.id;
  const reply = async extra => {
    const m = Object.assign({nbh: 'offline', type: 'status', status: await status()}, extra || {});
    try { if (port) port.postMessage(m); else if (ev.source) ev.source.postMessage(m); } catch (e) {}
  };
  let job;
  if (d.cmd === 'status') job = reply();
  else if (d.cmd === 'check') job = check(!!d.force).then(() => reply());
  else if (d.cmd === 'apply') job = apply(from).then(r => reply(r));
  else if (d.cmd === 'others') job = windows().then(cs => reply({others: cs.filter(c => c.id !== from).map(c => c.url)}));
  else if (d.cmd === 'skip-waiting') job = windows().then(cs => {
    const others = cs.filter(c => c.id !== from).map(c => c.url);
    if (others.length) return reply({skipped: false, others});
    return self.skipWaiting().then(() => reply({skipped: true}));
  });
  else return;
  ev.waitUntil(Promise.resolve(job).catch(() => {}));
});
