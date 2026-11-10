/* nbh-transcript.js (v25.72): a transcript that follows a video or a recording, for the video library (videos.html) and,
   later, the podcasts. Real text: the speaker of each turn, the line being heard marked (aria-current) and kept in view
   while Follow is on, a line tapped to play from it, a search. Nothing here is about a student.
   NBHTranscript.create({
     lines:    [{t: seconds, who: 'Narrator' | a role | 'On screen' | 'Note', text}],   in time order
     heads:    [{t, label, num, note, own}]   optional headings (a video's steps), in the order shown; a heading with
               own:false has no moment of its own (a step only on a card): it is listed, never marked
     media:    the <video> or <audio> it follows
     seek:     function(t), optional: how a tapped line or heading plays from t (default: media.currentTime = t, play)
     name:     a name for the list, for screen readers ("Transcript")
     note:     optional plain text shown above the lines, in a box (v25.73: the podcast's "Nora and Sam are AI voices. ...")
   }) -> {el, update(t), follow(on), search(q), destroy()}
   v25.73 the study podcast (nbh-pod-player.js and the library's episode page) uses it as it is, with note; the
   screen-reader text of its lines is hidden by its own style, so a page without the library's styles (Form TD-1) reads well.
   The page gives the list its height (CSS variable --nt-h on el, default 60vh). Styles are the page's tokens with fallbacks. */
(function () {
'use strict';
var CSS = '' +
'.nt{display:flex;flex-direction:column;min-height:0}' +
'.nt-bar{display:flex;align-items:center;gap:8px;padding:0 0 8px}' +
'.nt-q{position:relative;flex:1 1 auto;min-width:0}' +
'.nt-q input{width:100%;box-sizing:border-box;min-height:44px;border:1px solid var(--box,#B9C7C4);border-radius:10px;padding:0 10px 0 38px;font:inherit;font-size:1rem;color:var(--ink,#1F2D36);background:var(--paper,#fff)}' +
'.nt-q input::placeholder{color:var(--muted,#55656C)}' +
'.nt-q svg{position:absolute;left:11px;top:12px;width:20px;height:20px;color:var(--muted,#55656C);pointer-events:none}' +
'.nt-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;min-width:44px;padding:0 12px;border:1px solid var(--box,#B9C7C4);border-radius:10px;background:var(--paper,#fff);color:var(--navy,#1D3A52);font:inherit;font-size:.9375rem;font-weight:600;cursor:pointer;flex:0 0 auto}' +
'.nt-btn svg{width:18px;height:18px}' +
'.nt-btn[aria-pressed=true]{background:var(--navy,#1D3A52);border-color:var(--navy,#1D3A52);color:#fff}' +
'.nt-btn:focus-visible,.nt-ln:focus-visible,.nt-h:focus-visible,.nt-q input:focus-visible{outline:3px solid var(--focus,#2f7fa8);outline-offset:2px}' +
'.nt-find{display:flex;align-items:center;gap:6px;margin:0 0 8px;font-size:.875rem;color:var(--muted,#55656C)}' +
'.nt-find[hidden]{display:none}.nt-find span{flex:1 1 auto}' +
'.nt-key{margin:0 0 8px;font-size:.8125rem;line-height:1.4;color:var(--muted,#55656C)}' +
'.nt-list{list-style:none;margin:0;padding:0 2px 8px 0;overflow:auto;max-height:var(--nt-h,60vh);border-top:1px solid var(--rule,#D9E2E0);overscroll-behavior:contain}' +
'.nt-list li{margin:0}' +
'.nt-h{display:grid;grid-template-columns:3.1em 26px minmax(0,1fr);gap:8px;align-items:center;width:100%;min-height:44px;margin-top:8px;padding:6px 8px;border:0;background:none;border-radius:8px;text-align:left;font:inherit;font-weight:700;font-size:.9375rem;line-height:1.3;color:var(--ink,#1F2D36);cursor:pointer}' +
'.nt-h .nt-tm{font-weight:500}' +
'.nt-h small{display:block;font-weight:500;font-size:.8125rem;color:var(--muted,#55656C)}' +
'.nt-h.nt-off{font-weight:600;color:var(--muted,#55656C);margin-top:0}' +
'.nt-h.nt-sec{grid-template-columns:3.1em minmax(0,1fr)}' +
'.nt-tm{font-variant-numeric:tabular-nums;color:var(--muted,#55656C);font-size:.875rem}' +
'.nt-n{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--box,#B9C7C4);display:grid;place-items:center;font-size:.75rem;font-weight:700;color:var(--muted,#55656C);background:var(--paper,#fff)}' +
'.nt-n.nt-n0{border-color:transparent;background:none}' +
'.nt-h.nt-on{color:var(--navy,#1D3A52)}.nt-h.nt-on .nt-n{background:var(--navy,#1D3A52);border-color:var(--navy,#1D3A52);color:#fff}' +
'.nt-ln{display:block;width:100%;box-sizing:border-box;min-height:44px;text-align:left;background:none;border:0;border-radius:8px;padding:7px 10px 7px 12px;font:inherit;color:var(--ink,#1F2D36);cursor:pointer}' +
'.nt-ln b{display:block;font-weight:600;font-size:.8125rem;line-height:1.3;color:var(--muted,#55656C);margin-bottom:2px}' +
'.nt-ln span{display:block;font-size:1rem;line-height:1.5}' +
'.nt-see span{font-style:italic;color:var(--see,#34444b)}' +
'.nt-ln[aria-current]{background:var(--on,#e8f1f6);box-shadow:inset 3px 0 0 var(--navy,#1D3A52)}.nt-ln[aria-current] b{color:var(--navy,#1D3A52)}' +
'.nt-ln mark{background:#ffe08a;color:inherit;border-radius:2px}.nt-ln.nt-hit-on{outline:2px solid #c99a00;outline-offset:-2px}' +
'@media (hover:hover){.nt-ln:hover,.nt-h:hover{background:rgba(29,58,82,.06)}}' +
'html.nbh-hc .nt-see span{color:#000}' +
'.nt-note{margin:0 0 8px;padding:8px 12px;border:1px solid var(--ai-rule,#e7c27a);border-radius:10px;background:var(--ai-bg,#fff4dc);color:var(--ai-ink,#7a4f00);font-size:.9375rem;line-height:1.4}' +
'.nt .nt-q input{padding:0 10px 0 38px!important;min-height:44px!important;height:auto!important;font-size:1rem!important}' +
'.nt .vl-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;margin:-1px;padding:0;border:0}';
var done = false;
function css() { if (done) return; done = true; var s = document.createElement('style'); s.id = 'nbh-transcript-css'; s.textContent = CSS; document.head.appendChild(s); }
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var mmss = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; };
var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'"); };
var REDUCE = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
var ICO_Q = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
var ICO_OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
var ICO_UP = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
var ICO_DN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
var uid = 0;
function create(o) {
  css(); var id = 'nt' + (++uid), media = o.media, lines = o.lines || [], heads = o.heads || [];
  var el = document.createElement('div'); el.className = 'nt';
  var h = '<div class="nt-bar"><div class="nt-q">' + ICO_Q + '<input type="search" id="' + id + 'q" placeholder="Search the transcript" aria-label="Search the transcript" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></div>' +
    '<button type="button" class="nt-btn nt-follow" aria-pressed="true" title="Keep the line being heard in view">' + ICO_OK + 'Follow</button></div>' +
    '<div class="nt-find" hidden><span role="status" aria-live="polite"></span><button type="button" class="nt-btn nt-prev" aria-label="Previous match">' + ICO_UP + '</button><button type="button" class="nt-btn nt-next" aria-label="Next match">' + ICO_DN + '</button></div>' +
    (o.note ? '<p class="nt-note">' + esc(o.note) + '</p>' : '') +
    (o.key ? '<p class="nt-key">' + o.key + '</p>' : '') +
    '<ol class="nt-list" aria-label="' + esc(o.name || 'Transcript') + '">';
  /* the lines under their headings, in the order the page lists the headings: each heading with a moment of its own
     takes the lines from its start to the next such heading's; one with none (a step only on a card) holds no lines */
  var own = heads.filter(function (x) { return x.own !== false; }), li = 0, rows = [];
  var pushLines = function (until) { while (li < lines.length && (until == null || lines[li].t < until - 0.05)) { rows.push({ line: li }); li++; } };
  if (own.length && lines.length && lines[0].t < own[0].t - 0.05) { if (o.lead) rows.push({ sec: o.lead }); pushLines(own[0].t); }
  heads.forEach(function (x, i) {
    rows.push({ head: i }); if (x.own === false) return;
    var nx = null; for (var j = i + 1; j < heads.length; j++) if (heads[j].own !== false) { nx = heads[j]; break; }
    pushLines(nx ? Math.max(nx.t, x.t) : null);
  });
  pushLines(null);
  rows.forEach(function (r) {
    if (r.sec) { h += '<li><button type="button" class="nt-h nt-sec" data-t="0"><span class="nt-tm">' + mmss(0) + '</span><span>' + esc(r.sec) + '</span></button></li>'; return; }
    if (r.head != null) { var x = heads[r.head];
      h += '<li><button type="button" class="nt-h' + (x.own === false ? ' nt-off' : '') + '" data-head="' + r.head + '" data-t="' + x.t + '"' + (x.num != null ? ' data-step="' + x.num + '"' : '') + '>' +
        '<span class="nt-tm">' + mmss(x.t) + '</span><span class="nt-n' + (x.num ? '' : ' nt-n0') + '" aria-hidden="true">' + (x.num || '') + '</span><span>' + (x.num ? '<span class="vl-sr">Step ' + x.num + ': </span>' : '') + esc(x.label) + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</span></button></li>'; return; }
    var l = lines[r.line], see = l.who === 'On screen' || l.who === 'Note';   /* v25.75 'Note': what happens, for a video whose picture no longer carries the words */
    h += '<li><button type="button" class="nt-ln' + (see ? ' nt-see' : '') + '" data-i="' + r.line + '" data-t="' + l.t + '"><b>' + esc(l.who) + '<span class="vl-sr">, ' + mmss(l.t) + ':</span></b><span class="nt-x">' + esc(l.text) + '</span></button></li>';
  });
  el.innerHTML = h + '</ol>';
  var list = el.querySelector('.nt-list'), q = el.querySelector('input'), fb = el.querySelector('.nt-follow'), find = el.querySelector('.nt-find');
  var btns = [].slice.call(list.querySelectorAll('.nt-ln')), hbtns = [].slice.call(list.querySelectorAll('.nt-h[data-head]'));
  var following = true, cur = -1, curH = -1, auto = 0;
  var spoken = lines.map(function (l, i) { return l.who === 'On screen' || l.who === 'Note' ? -1 : i; }).filter(function (i) { return i >= 0; });
  function lineAtT(t) { var c = -1; for (var i = 0; i < spoken.length; i++) { if (lines[spoken[i]].t <= t + 0.05) c = spoken[i]; else break; } return c; }
  function headAtT(t) { var c = -1; heads.forEach(function (x, i) { if (x.own !== false && x.t <= t + 0.05 && (c < 0 || x.t >= heads[c].t)) c = i; }); return c; }
  function inView(b) {
    var lr = list.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (br.top >= lr.top && br.bottom <= lr.bottom) return;
    auto = Date.now(); var y = list.scrollTop + (br.top - lr.top) - Math.round(list.clientHeight * 0.25);
    try { list.scrollTo({ top: y, behavior: REDUCE() ? 'auto' : 'smooth' }); } catch (e) { list.scrollTop = y; }
  }
  function update(t) {
    var c = lineAtT(t), hh = headAtT(t);
    if (hh !== curH) { hbtns.forEach(function (b) { var on = +b.dataset.head === hh; b.classList.toggle('nt-on', on); if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); curH = hh; }
    if (c === cur) return; cur = c;
    btns.forEach(function (b) { if (+b.dataset.i === c) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    if (following && c >= 0) { var b = list.querySelector('.nt-ln[data-i="' + c + '"]'); if (b) inView(b); }
  }
  function follow(on) { following = !!on; fb.setAttribute('aria-pressed', String(following)); if (following && cur >= 0) { var b = list.querySelector('.nt-ln[data-i="' + cur + '"]'); if (b) inView(b); } }
  var seek = o.seek || function (t) { try { media.currentTime = t; } catch (e) {} var p = media.play && media.play(); if (p && p.catch) p.catch(function () {}); };
  list.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; var t = +b.dataset.t; follow(true); seek(t); update(t); });
  fb.addEventListener('click', function () { follow(!following); });
  /* scrolling the list by hand stops following (the list's own scrolls, made to keep the line in view, do not) */
  var byHand = function () { if (Date.now() - auto > 900 && following) follow(false); };
  list.addEventListener('wheel', byHand, { passive: true }); list.addEventListener('touchmove', byHand, { passive: true });
  list.addEventListener('keydown', function (e) { if (/^(PageUp|PageDown|Home|End)$/.test(e.key)) byHand(); });
  /* the search: every match marked, the count, the previous and next match (the list moves to it; Follow goes off) */
  var hits = [], hi = -1;
  function search(s) {
    var w = norm(s).trim(); hits = []; hi = -1;
    btns.forEach(function (b) { var l = lines[+b.dataset.i], x = b.querySelector('.nt-x'), n = norm(l.text);
      b.classList.remove('nt-hit-on');
      if (!w || n.indexOf(w) < 0) { x.textContent = l.text; return; }
      var out = '', p = 0, i; while ((i = n.indexOf(w, p)) >= 0) { out += esc(l.text.slice(p, i)) + '<mark>' + esc(l.text.slice(i, i + w.length)) + '</mark>'; p = i + w.length; }
      x.innerHTML = out + esc(l.text.slice(p)); hits.push(b); });
    find.hidden = !w; find.querySelector('span').textContent = !w ? '' : hits.length ? hits.length + ' line' + (hits.length > 1 ? 's' : '') + ' with “' + s.trim() + '”' : 'No line with “' + s.trim() + '”';
    find.querySelector('.nt-prev').disabled = find.querySelector('.nt-next').disabled = hits.length < 1;
    if (hits.length) go(0);
    return hits.length;
  }
  function go(i) { if (!hits.length) return; follow(false); hits.forEach(function (b) { b.classList.remove('nt-hit-on'); }); hi = (i + hits.length) % hits.length; var b = hits[hi]; b.classList.add('nt-hit-on'); inView(b);
    find.querySelector('span').textContent = (hi + 1) + ' of ' + hits.length + ' lines with “' + q.value.trim() + '”'; }
  var qt = null; q.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { search(q.value); }, 150); });
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(qt); if (hits.length && norm(q.value).trim()) go(hi + (e.shiftKey ? -1 : 1)); else search(q.value); } });
  find.querySelector('.nt-prev').addEventListener('click', function () { go(hi - 1); });
  find.querySelector('.nt-next').addEventListener('click', function () { go(hi + 1); });
  var tick = function () { update(media.currentTime || 0); };
  if (media) { media.addEventListener('timeupdate', tick); media.addEventListener('seeked', tick); }
  update(media ? media.currentTime || 0 : 0);
  return { el: el, update: update, follow: follow, search: search, following: function () { return following; },
    destroy: function () { if (media) { media.removeEventListener('timeupdate', tick); media.removeEventListener('seeked', tick); } if (el.parentNode) el.parentNode.removeChild(el); } };
}
window.NBHTranscript = { create: create };
})();
