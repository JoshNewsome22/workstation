/* nbh-pod-player.js (v25.73, the BCBA, 11/10): the one player of The Research Behind the Plan, the study podcast, for the video
   library (videos.html) and Form TD-1 (Listen on a bank card). A bar at the bottom of the screen: back 15 s, play and pause,
   forward 15 s, the time, the speed, Transcript, Close, and a position line along its top edge to drag; every control 44 px.
   Its Transcript is the episode's page in the library (the page says how) or, in Form TD-1, a sheet over the form (a panel at
   the right on an iPad, from the bottom on a phone), drawn by nbh-transcript.js: the speaker of each turn, the line heard
   marked and kept in view while Follow is on, a line tapped plays from it, a search.
   One sound at a time: a video that starts pauses the episode, and an episode that starts pauses any video of the page.
   The bar puts itself away (paused) when its page is put away (a form hidden in the workstation).
   What it keeps on this device (localStorage nbh.pod.v1): the speed, and per episode the second it stopped at, its length,
   heard to the end once, when; nothing about a student, nothing typed. Lock-screen controls through the Media Session API
   where the browser has it.
   NBHPod.play(key, {from, transcript, at})   key: an episode of window.NBH_VIDEOS.podcasts; from: the control to give the focus
     back to on Close; transcript: a function the bar's Transcript calls (default: the sheet); at: a second to start from.
   NBHPod.pause(), .close(), .sheet(on), .seek(t), .audio(), .current(), .state(), .on(fn), .trButton(on)
   The episode's audio is a file beside the forms (base64 in a script, as the videos are), loaded only when it is played, so the
   offline copy saves it whole. Nothing here is about a student. */
(function () {
'use strict';
if (window.NBHPod) return;
var KEY = 'nbh.pod.v1', RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
var SILENT = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
var WEB = /^https?:$/.test(location.protocol);
var EPS = {};
function eps() { ((window.NBH_VIDEOS || {}).podcasts || []).forEach(function (p) { EPS[p.key] = p; }); return EPS; }
eps();
/* ---------- what is kept on this device: {v:1, rate, items:{key:{t,d,w,at}}} ---------- */
function store() { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && typeof o === 'object' && o.items && typeof o.items === 'object') return o; } catch (e) {} return { v: 1, rate: 1, items: {} }; }
function put(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
function prog(k) { var it = store().items[k]; return it && typeof it === 'object' ? it : null; }
function keep(k, t, d, ended) {
  if (!EPS[k] || !(d > 0)) return; var s = store(), p = s.items[k] && typeof s.items[k] === 'object' ? s.items[k] : {};
  s.items[k] = { t: ended || t >= d - 2 ? 0 : Math.max(0, Math.floor(t)), d: Math.round(d), w: !!p.w || !!ended || t >= d * 0.95, at: Date.now() }; put(s); }
function rate() { var r = +store().rate; return RATES.indexOf(r) >= 0 ? r : 1; }
function setRate(r) { var s = store(); s.rate = r; put(s); }
var mmss = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; };
var spoken = function (s) { s = Math.floor(s || 0); var m = Math.floor(s / 60), x = s % 60; return (m ? m + ' minute' + (m > 1 ? 's' : '') : '') + (m && x ? ' ' : '') + (x || !m ? x + ' second' + (x === 1 ? '' : 's') : ''); };
var rateTxt = function (r) { return String(r).replace(/^0\./, '.') + '×'; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = function () { s.remove(); res(); }; s.onerror = function () { s.remove(); rej(new Error(src)); }; document.head.appendChild(s); }); }

var I = {
  head: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4" height="6.5" rx="1.6"/></svg>',
  play: '<svg class="np-i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  pause: '<svg class="np-i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.6h3.6"/></svg><span class="np-n" aria-hidden="true">15</span>',
  fwd: '<span class="np-n" aria-hidden="true">15</span><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v3.6h-3.6"/></svg>',
  lines: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};
var CSS = '' +
'.np{--np-ink:#1F2D36;--np-navy:#1D3A52;--np-muted:#55656C;--np-paper:#fff;--np-wash:#F2F6F5;--np-rule:#D9E2E0;--np-box:#B9C7C4;--np-tile:#3b4852;--np-focus:#2f7fa8;--np-ai-ink:#7a4f00;--np-ai-bg:#fff4dc;--np-ai-rule:#e7c27a;' +
  'font-family:"Inter","Helvetica Neue","Segoe UI",Arial,system-ui,sans-serif;color:var(--np-ink);-webkit-text-size-adjust:100%}' +
'.np[hidden],.np [hidden]{display:none!important}' +
'.np *,.np *::before,.np *::after{box-sizing:border-box}' +
'.np-bar{position:fixed;left:0;right:0;bottom:0;z-index:8992;background:var(--np-wash);border-top:1px solid var(--np-rule);box-shadow:0 -6px 20px rgba(16,36,48,.10);padding:6px max(16px,env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}' +
'.np-row{display:flex;align-items:center;gap:10px;min-height:56px}' +
'.np-tile{flex:0 0 auto;width:48px;height:48px;border-radius:10px;background:var(--np-tile);color:#fff;display:grid;place-items:center}.np-tile svg{width:26px;height:26px}' +
'.np-meta{flex:1 1 auto;min-width:0}' +
'.np-t{margin:0;font:700 16px/1.25 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:var(--np-navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.np-s{margin:3px 0 0;display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;font-size:14px;line-height:1.3;color:var(--np-muted);min-width:0}' +
'.np-sub{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'.np-ai{display:inline-block;font-size:13px;font-weight:700;color:var(--np-ai-ink);background:var(--np-ai-bg);border:1px solid var(--np-ai-rule);border-radius:999px;padding:1px 10px;white-space:nowrap;line-height:1.5}' +
'.np-msg{margin:3px 0 0;font-size:13px;line-height:1.3;color:var(--np-ink)}.np-msg:empty{display:none}.np-msg.np-err{color:#8a1c12;font-weight:600}' +
'.np-ctl{display:flex;align-items:center;gap:8px;flex:0 0 auto}' +
'.np-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:44px;min-height:44px;height:44px;padding:0 10px;border:1px solid var(--np-box);border-radius:10px;background:var(--np-paper);color:var(--np-navy);font-family:inherit;font-weight:600;font-size:15px;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
'.np-b svg{width:24px;height:24px;flex:0 0 auto}' +
'.np-back,.np-fwd{gap:2px;padding:0 8px}.np-back svg,.np-fwd svg{width:22px;height:22px}.np-n{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}' +
'.np-b.np-play{width:56px;background:var(--np-navy);border-color:var(--np-navy);color:#fff}' +
'.np-play .np-i-pause,.np-play.np-on .np-i-play{display:none}.np-play.np-on .np-i-pause{display:block}' +
'.np-b.np-close{border-color:transparent;background:none;width:44px;padding:0}' +
'.np-b:disabled{opacity:.55;cursor:default}' +
'.np-b:focus-visible,.np-seek:focus-visible,.np-x:focus-visible{outline:3px solid var(--np-focus);outline-offset:2px}' +
'@media (hover:hover){.np-b:not(.np-play):not(:disabled):hover{background:#eef3f5}}' +
'.np-time{font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--np-ink);min-width:6.8em;text-align:center}' +
'.np-time2{font-variant-numeric:tabular-nums;white-space:nowrap}' +
'.np-rate{min-width:56px;font-variant-numeric:tabular-nums}' +
/* the position line: a 44 px target along the top edge, the track 4 px */
'.np-seek{position:absolute;left:0;right:0;top:-22px;width:100%;height:44px;margin:0;background:transparent;-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:none}' +
'.np-seek::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(to right,var(--np-navy) var(--np-p,0%),#b3c2c6 var(--np-p,0%))}' +
'.np-seek::-moz-range-track{height:4px;border-radius:2px;background:#b3c2c6}.np-seek::-moz-range-progress{height:4px;background:var(--np-navy)}' +
'.np-seek::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;margin-top:-8px;border-radius:50%;background:var(--np-navy);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35)}' +
'.np-seek::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--np-navy);border:2px solid #fff}' +
'.np-only-phone{display:none}' +
'@media (max-width:959px){.np-s{flex-wrap:nowrap}.np-sub{display:none}}' +
/* a phone: two rows (the title, the time and Close; then the buttons) */
'@media (max-width:699px){.np-bar{padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right))}' +
  '.np-row{flex-wrap:wrap;gap:8px 8px}.np-meta{flex:1 1 0}.np-ctl{order:3;flex:1 1 100%;gap:8px}.np-close{order:2}' +
  '.np-time,.np-sub{display:none}.np-only-phone{display:inline}.np-t{font-size:15px}' +
  '.np-ctl{gap:6px}.np-ctl .np-b{height:48px;min-height:48px}.np-b.np-play{width:56px}.np-back,.np-fwd{padding:0 6px}.np-rate{min-width:48px;padding:0 6px}' +
  '.np-tr{flex:1 1 auto;min-width:0}.np-tr[hidden]+*,.np-ctl .np-rate:last-child{margin-left:auto}.np-ctl:has(.np-tr[hidden]) .np-rate{margin-left:auto}}' +
'@media (max-width:359px){.np-tr .np-trl{display:none}}' +
/* the transcript sheet (Form TD-1): a panel at the right on an iPad, from the bottom on a phone */
'.np-scrim{position:fixed;inset:0;z-index:8990;background:rgba(15,26,34,.42)}' +
'.np-sheet{position:fixed;z-index:8991;right:12px;top:12px;bottom:calc(var(--nbh-pod-h,72px) + 12px);width:min(460px,calc(100vw - 24px));display:flex;flex-direction:column;background:var(--np-paper);border-radius:16px;box-shadow:0 18px 50px -12px rgba(16,36,48,.45);overflow:hidden}' +
'.np-sh{display:flex;align-items:center;gap:10px;padding:10px 10px 10px 18px;border-bottom:1px solid var(--np-rule)}' +
'.np-sh h2{margin:0;flex:1 1 auto;font:700 19px/1.25 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:var(--np-navy)}' +
'.np-sh small{display:block;font-family:inherit;font-weight:400;font-size:13px;line-height:1.3;color:var(--np-muted)}' +
'.np-x{width:44px;height:44px;border:0;background:none;border-radius:10px;color:var(--np-navy);display:grid;place-items:center;cursor:pointer}.np-x svg{width:24px;height:24px}' +
'.np-sb{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;padding:10px 12px 0}' +
'.np-sb .nt{flex:1 1 auto;min-height:0}.np-sb .nt-list{max-height:none;flex:1 1 auto}' +
'.np-load{padding:14px 6px;color:var(--np-muted)}' +
'@media (max-width:699px){.np-sheet{left:0;right:0;width:auto;top:max(48px,8vh);bottom:var(--nbh-pod-h,120px);border-radius:16px 16px 0 0}}' +
'html.nbh-pod-on body{padding-bottom:calc(var(--nbh-pod-h,72px) + 8px)!important}' +
'html.nbh-hc .np{--np-ink:#000;--np-muted:#263238;--np-rule:#3f5654;--np-box:#3f5654;--np-focus:#0a4f75}html.nbh-hc .np-bar{border-top:2px solid #000}html.nbh-hc .np-b{border-width:2px}' +
'@media (prefers-reduced-motion:reduce){.np *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}' +
'@media print{.np{display:none!important}html.nbh-pod-on body{padding-bottom:0!important}}';

var root, bar, audio, sheetEl, scrim, tr = null, trFor = '', cur = null, url = null, loads = {}, opener = null, opts = {}, fns = [], saveT = 0, seekTo = null, dragging = false, held = [], sheetFrom = null, msgT = 0, wantPlay = false;
var $ = function (c) { return root.querySelector(c); };
function emit(type) { fns.forEach(function (f) { try { f(type, cur); } catch (e) {} }); }
function build() {
  if (root) return;
  var st = document.createElement('style'); st.id = 'nbh-pod-css'; st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div'); root.id = 'nbhPod'; root.className = 'np'; root.hidden = true;
  root.innerHTML = '<div class="np-scrim" hidden></div>' +
    '<section class="np-sheet" role="dialog" aria-modal="true" aria-labelledby="npSheetH" hidden><div class="np-sh"><h2 id="npSheetH">Transcript<small>Tap a line to play from it</small></h2>' +
      '<button type="button" class="np-x" aria-label="Close the transcript">' + I.x + '</button></div><div class="np-sb"></div></section>' +
    '<div class="np-bar" role="region" aria-label="Player"><input type="range" class="np-seek" min="0" max="1" step="1" value="0" aria-label="Position in the episode">' +
      '<div class="np-row"><span class="np-tile" aria-hidden="true">' + I.head + '</span>' +
        '<div class="np-meta"><p class="np-t"></p><p class="np-s"><span class="np-time2 np-only-phone"></span><span class="np-sub"></span><span class="np-ai">AI voices</span></p><p class="np-msg" role="status" aria-live="polite"></p></div>' +
        '<div class="np-ctl"><button type="button" class="np-b np-back" aria-label="Back 15 seconds">' + I.back + '</button>' +
          '<button type="button" class="np-b np-play" aria-label="Play">' + I.play + I.pause + '</button>' +
          '<button type="button" class="np-b np-fwd" aria-label="Forward 15 seconds">' + I.fwd + '</button>' +
          '<span class="np-time" aria-hidden="true">0:00 / 0:00</span>' +
          '<button type="button" class="np-b np-rate" aria-label="Speed, 1 times. Tap to change">1×</button>' +
          '<button type="button" class="np-b np-tr" aria-label="Transcript">' + I.lines + '<span class="np-trl">Transcript</span></button></div>' +
        '<button type="button" class="np-b np-close" aria-label="Close the player">' + I.x + '</button></div></div>';
  document.body.appendChild(root);
  bar = $('.np-bar'); sheetEl = $('.np-sheet'); scrim = $('.np-scrim');
  /* an <audio> element made in the tap that asked for it (Form TD-1 makes one before it loads this file) is used, so the
     browser lets it play once its sound has loaded */
  audio = window.__nbhPodAudio || document.createElement('audio'); window.__nbhPodAudio = audio;
  audio.preload = 'auto'; audio.setAttribute('playsinline', ''); audio.className = 'np-audio'; root.appendChild(audio);
  $('.np-play').addEventListener('click', toggle);
  $('.np-back').addEventListener('click', function () { skip(-15); });
  $('.np-fwd').addEventListener('click', function () { skip(15); });
  $('.np-rate').addEventListener('click', function () { var r = RATES[(RATES.indexOf(rate()) + 1) % RATES.length]; setRate(r); audio.playbackRate = r; paint(); say('Speed ' + rateTxt(r)); });
  $('.np-tr').addEventListener('click', function () { if (typeof opts.transcript === 'function') opts.transcript(cur); else sheet(sheetEl.hidden); });
  $('.np-close').addEventListener('click', function () { close(); });
  $('.np-x').addEventListener('click', function () { sheet(false); });
  scrim.addEventListener('click', function () { sheet(false); });
  var sk = $('.np-seek');
  sk.addEventListener('input', function () { dragging = true; var d = dur(); if (d > 0) { try { audio.currentTime = Math.min(d, +sk.value); } catch (e) {} } paint(); });
  sk.addEventListener('change', function () { dragging = false; paint(); });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'seeked', 'ratechange', 'ended', 'durationchange'].forEach(function (n) { audio.addEventListener(n, paint); });
  audio.addEventListener('timeupdate', function () { save(false); if (!dragging) pos(); });
  audio.addEventListener('pause', function () { save(true); emit('pause'); });
  audio.addEventListener('seeked', function () { save(true); pos(); });
  audio.addEventListener('ended', function () { save(true, true); emit('ended'); });
  audio.addEventListener('play', function () { if (audio.getAttribute('src') === SILENT) return; emit('play'); });   /* other sound is paused when the episode is started (go), not here: a video started a moment later keeps playing */
  audio.addEventListener('loadedmetadata', function () {
    if (!cur || audio.getAttribute('src') === SILENT) return; audio.playbackRate = rate();
    var p = prog(cur), t = seekTo;
    if (t == null && p && p.t >= 5 && p.t < audio.duration - 2) { t = p.t; say('Picks up where it stopped on this device, at ' + mmss(p.t) + '.'); }
    if (t != null) { try { audio.currentTime = t; } catch (e) {} } seekTo = null; paint(); });
  /* one sound at a time: a video (or other sound) of the page that starts pauses the episode */
  document.addEventListener('play', function (e) { var m = e.target; if (m !== audio && m && /^(VIDEO|AUDIO)$/.test(m.tagName) && !audio.paused) audio.pause(); }, true);
  /* Escape closes the sheet; Tab stays inside the sheet and the bar while the sheet is open */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheetEl.hidden) { e.preventDefault(); e.stopPropagation(); sheet(false); return; }
    if (e.key !== 'Tab' || sheetEl.hidden) return;
    var f = [].filter.call(root.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && x.getClientRects().length; });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } });
  /* the room the bar takes, for the page under it */
  var h = function () { if (!root.hidden) document.documentElement.style.setProperty('--nbh-pod-h', Math.ceil(bar.getBoundingClientRect().height) + 'px'); };
  try { new ResizeObserver(h).observe(bar); } catch (e) { addEventListener('resize', h); }
  /* the page put away (a form hidden in the workstation): the episode pauses where it is */
  try { new IntersectionObserver(function (es) { es.forEach(function (x) { if (!x.isIntersecting && !root.hidden && !audio.paused) { audio.pause(); say('Paused.'); } }); }).observe(bar); } catch (e) {}
  addEventListener('pagehide', function () { save(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(true); });
}
function dur() { var d = audio && audio.duration; return d > 0 && isFinite(d) ? d : ((EPS[cur] || {}).dur || 0); }
function save(force, ended) { if (!cur || !audio || audio.getAttribute('src') === SILENT || !(audio.duration > 0)) return; var now = Date.now(); if (!force && now - saveT < 2000) return; saveT = now; keep(cur, audio.currentTime, audio.duration, ended); }
function say(t, err) { var m = $('.np-msg'); m.textContent = t || ''; m.classList.toggle('np-err', !!err); clearTimeout(msgT); if (t && !err) msgT = setTimeout(function () { if (m.textContent === t) m.textContent = ''; }, 6000); }
function quiet() { [].forEach.call(document.querySelectorAll('video,audio'), function (m) { if (m !== audio && !m.paused) { try { m.pause(); } catch (e) {} } }); }
function paint() {
  if (!root || !cur) return; var d = dur(), t = audio.currentTime || 0, on = !audio.paused && audio.getAttribute('src') !== SILENT, r = rate();
  var pb = $('.np-play'); pb.classList.toggle('np-on', on); pb.setAttribute('aria-label', on ? 'Pause' : 'Play');
  $('.np-time').textContent = mmss(t) + ' / ' + mmss(d); $('.np-time2').textContent = mmss(t) + ' of ' + mmss(d);
  var rb = $('.np-rate'); rb.textContent = rateTxt(r); rb.setAttribute('aria-label', 'Speed, ' + String(r) + ' times. Tap to change');
  var sk = $('.np-seek'); sk.max = String(Math.max(1, Math.floor(d))); if (!dragging) sk.value = String(Math.floor(t));
  sk.setAttribute('aria-valuetext', spoken(t) + ' of ' + spoken(d)); sk.style.setProperty('--np-p', (d > 0 ? Math.min(100, t / d * 100) : 0).toFixed(2) + '%');
  emit('time'); }
function pos() { try { var ms = navigator.mediaSession; if (ms && ms.setPositionState && audio.duration > 0 && isFinite(audio.duration)) ms.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.duration, audio.currentTime || 0) }); } catch (e) {} }
function media(ep) {
  var ms = navigator.mediaSession; if (!ms) return;
  try { ms.metadata = window.MediaMetadata ? new MediaMetadata({ title: ep.title, artist: 'Nora and Sam (AI voices)', album: ep.series }) : null; } catch (e) {}
  var set = function (a, f) { try { ms.setActionHandler(a, f); } catch (e) {} };
  set('play', function () { go(); }); set('pause', function () { audio.pause(); });
  set('seekbackward', function (d) { skip(-((d && d.seekOffset) || 15)); }); set('seekforward', function (d) { skip((d && d.seekOffset) || 15); });
  set('seekto', function (d) { if (d && d.seekTime != null) { try { audio.currentTime = d.seekTime; } catch (e) {} pos(); } });
  set('stop', function () { close(); }); }
function unmedia() { var ms = navigator.mediaSession; if (!ms) return; try { ms.metadata = null; } catch (e) {} ['play', 'pause', 'seekbackward', 'seekforward', 'seekto', 'stop'].forEach(function (a) { try { ms.setActionHandler(a, null); } catch (e) {} }); }
/* the episode's sound: read from the file beside the forms (from the website as a stream, so its progress shows), made a
   blob the player plays; the text copy is let go once decoded */
function fetchText(file, L) { return fetch(file).then(function (r) { if (!r.ok) throw new Error(r.status); L.total = +r.headers.get('content-length') || 0;
  if (!r.body || !r.body.getReader) return r.text(); var rd = r.body.getReader(), parts = [], got = 0;
  function step() { return rd.read().then(function (x) { if (x.done) return; parts.push(x.value); got += x.value.length; L.loaded = got; L.tick(); return step(); }); }
  return step().then(function () { var all = new Uint8Array(got), o = 0; parts.forEach(function (p) { all.set(p, o); o += p.length; }); parts = null; return new TextDecoder().decode(all); }); }); }
function source(ep) {
  if (loads[ep.key]) return loads[ep.key].p;
  var L = loads[ep.key] = { loaded: 0, total: 0, tick: function () { if (cur === ep.key && L.total) say('Loading the episode… ' + Math.min(100, Math.round(L.loaded / L.total * 100)) + '%'); } };
  var have = function () { return window.NBH_POD_AUDIO && window.NBH_POD_AUDIO[ep.key]; };
  var data = have() ? Promise.resolve(have()) : WEB && window.fetch && window.TextDecoder ? fetchText(ep.file, L).then(function (t) { var m = /=\s*'([A-Za-z0-9+\/=]+)'/.exec(t); t = null; if (!m) throw new Error('no audio'); return m[1]; })
    : loadScript(ep.file).then(function () { return have(); });
  L.p = data.then(function (b64) { if (!b64) throw new Error('no audio'); try { delete window.NBH_POD_AUDIO[ep.key]; } catch (e) {}
    var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); b64 = null;
    return URL.createObjectURL(new Blob([u], { type: 'audio/mp4' })); });
  L.p.then(function () { delete loads[ep.key]; }, function () { delete loads[ep.key]; });
  return L.p; }
function go() { if (!cur) return; if (!url) { load(); return; } if (audio.getAttribute('src') !== url) { audio.src = url; }
  quiet(); var p = audio.play(); if (p && p.catch) p.catch(function () { paint(); say('Tap play to listen.'); }); }
function load() {
  var ep = EPS[cur], key = cur; if (!ep) return;
  /* in the tap: the element is let play (a moment of silence) so the browser allows the sound once it is loaded */
  if (!url && audio.paused && (!audio.getAttribute('src') || audio.getAttribute('src') === SILENT)) { audio.src = SILENT; var q = audio.play(); if (q && q.catch) q.catch(function () {}); }
  say('Loading the episode…'); $('.np-play').disabled = false;
  source(ep).then(function (u) { if (cur !== key) { try { URL.revokeObjectURL(u); } catch (e) {} return; } url = u; say(''); audio.src = u; if (wantPlay) go(); paint(); },
    function () { if (cur !== key) return; if (audio.getAttribute('src') === SILENT) audio.removeAttribute('src');
      say('This episode is not saved on this device. Connect to the internet, then tap play to try again.', true); paint(); }); }
function release() { save(true); try { audio.pause(); } catch (e) {} audio.removeAttribute('src'); try { audio.load(); } catch (e) {} if (url) { try { URL.revokeObjectURL(url); } catch (e) {} } url = null; }
function show() { if (!root.hidden) return; root.hidden = false; document.documentElement.classList.add('nbh-pod-on');
  document.documentElement.style.setProperty('--nbh-pod-h', Math.ceil(bar.getBoundingClientRect().height) + 'px'); emit('open'); }
/* ---------- the API ---------- */
function play(key, o) {
  eps(); var ep = EPS[key]; if (!ep) return false; o = o || {}; build();
  if (o.from) opener = o.from; if ('transcript' in o) opts.transcript = o.transcript;
  if (cur !== key) { if (cur) release(); if (tr) { tr.destroy(); tr = null; trFor = ''; } cur = key; seekTo = null;
    $('.np-t').textContent = ep.title; $('.np-sub').textContent = ep.series + ' · ' + ep.after; bar.setAttribute('aria-label', 'Player: ' + ep.title); media(ep); }
  if (o.at != null) { if (url && audio.readyState >= 1) { try { audio.currentTime = o.at; } catch (e) {} } else seekTo = o.at; }
  show(); wantPlay = o.autoplay !== false; if (wantPlay) go(); else if (!url) load(); paint(); return true; }
function toggle() { if (!cur) return; if (audio.paused || audio.getAttribute('src') === SILENT) { wantPlay = true; go(); } else audio.pause(); }
function skip(s) { if (!url || !(audio.duration > 0)) return; try { audio.currentTime = Math.max(0, Math.min(audio.duration - 0.1, audio.currentTime + s)); } catch (e) {} paint(); }
function seek(t) { if (!cur) return; if (url && audio.readyState >= 1) { try { audio.currentTime = t; } catch (e) {} wantPlay = true; go(); } else { seekTo = t; wantPlay = true; go(); } }
function close() { if (!root || root.hidden) return; sheet(false, true); release(); unmedia(); if (tr) { tr.destroy(); tr = null; trFor = ''; }
  var k = cur; cur = null; root.hidden = true; document.documentElement.classList.remove('nbh-pod-on'); say('');
  var t = opener && opener.isConnected && opener.getClientRects().length ? opener : null; opener = null; if (t) { try { t.focus({ preventScroll: true }); } catch (e) {} } emit('close'); return k; }
/* the sheet: the transcript over the page; the page behind takes no taps and no focus meanwhile */
function hold(on) { if (on) { held = [].filter.call(document.body.children, function (e) { return e !== root && !e.inert && !/^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(e.tagName); }); held.forEach(function (e) { e.inert = true; }); }
  else { held.forEach(function (e) { e.inert = false; }); held = []; } }
function sheet(on, quietly) {
  if (!root || !cur) return; if (!on) { if (sheetEl.hidden) return; sheetEl.hidden = true; scrim.hidden = true; hold(false); $('.np-tr').setAttribute('aria-expanded', 'false');
    if (!quietly) { var b = sheetFrom && sheetFrom.isConnected ? sheetFrom : $('.np-tr'); try { b.focus({ preventScroll: true }); } catch (e) {} } sheetFrom = null; emit('sheet'); return; }
  sheetFrom = document.activeElement; sheetEl.hidden = false; scrim.hidden = false; hold(true); $('.np-tr').setAttribute('aria-expanded', 'true');
  var body = $('.np-sb'), key = cur, ep = EPS[cur];
  var draw = function () { if (cur !== key || trFor === key) return; var L = (window.NBH_POD_TRANSCRIPTS || {})[key];
    if (!L || !window.NBHTranscript) { body.innerHTML = '<p class="np-load">The transcript could not be loaded here. Open the workstation from its folder or from the website.</p>'; return; }
    body.innerHTML = ''; tr = window.NBHTranscript.create({ media: audio, name: 'Transcript of ' + ep.title, note: 'Nora and Sam are AI voices. The episode is based on the published article.',
      lines: L.map(function (l) { return { t: l[0], who: l[1], text: l[2] }; }), seek: seek }); trFor = key; body.appendChild(tr.el); tr.update(audio.currentTime || 0); tr.follow(true); };
  if (trFor !== key) { body.innerHTML = '<p class="np-load">Loading the transcript…</p>';
    var need = []; if (!window.NBHTranscript) need.push(loadScript('nbh-transcript.js')); if (!(window.NBH_POD_TRANSCRIPTS || {})[key]) need.push(loadScript('nbh-pod-transcripts.js'));
    Promise.all(need).then(draw, draw); } else if (tr) { tr.follow(true); tr.update(audio.currentTime || 0); }
  setTimeout(function () { try { $('.np-x').focus({ preventScroll: true }); } catch (e) {} }, 30); emit('sheet'); }
window.NBHPod = {
  play: play, pause: function () { if (audio && !audio.paused) audio.pause(); }, toggle: toggle, close: close, sheet: function (on) { sheet(on !== false); }, seek: seek, skip: skip,
  audio: function () { build(); return audio; }, current: function () { return cur; }, episodes: function () { return eps(); },
  on: function (f) { fns.push(f); }, trButton: function (on) { build(); $('.np-tr').hidden = !on; },
  state: function () { return { key: cur, open: !!root && !root.hidden, t: audio ? audio.currentTime || 0 : 0, d: audio ? dur() : 0, paused: !audio || audio.paused || audio.getAttribute('src') === SILENT, rate: rate(), sheet: !!sheetEl && !sheetEl.hidden, loaded: !!url }; },
  store: function () { return store(); }, progress: prog
};
})();
