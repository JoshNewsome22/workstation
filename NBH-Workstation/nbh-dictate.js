/* nbh-dictate.js (v21.94): dictation into a text box, on the device.
   The same speech recogniser Form TV-1 uses to follow a script (sherpa-onnx, Apache License 2.0, with a small streaming
   English model, in nbh-asr/ beside the forms: 57 MB, downloaded once from the workstation's website after a confirm, each
   part checked against its SHA-256, and kept on the device in Cache Storage under the name TV-1 keeps it, so one download
   serves both). It runs in a worker on the device: what the microphone hears is not recorded, kept or sent anywhere.
   Words land in the text box that had the cursor, at the cursor, with a capital after a full stop; "period", "comma",
   "question mark", "new line" and "new paragraph" are written as punctuation. The forms' toolbar Dictate switch and the
   workstation's Log it now sheet load this file when first pressed. A page opened from a file (the one-file edition) cannot
   fetch the recogniser and says so. */
(function(){
  'use strict';
  var W = window, D = document;
  var CACHE = 'tv1-voice-model', BASE = 'nbh-asr/';
  var E = { w: null, ready: false, loading: false, p: null };
  var S = { on: false, el: null, ctx: null, src: null, proc: null, stream: null, acc: [], accN: 0, n: 0, inflight: 0, partial: '', note: '', level: 0, box: null, onstate: null, starting: false };

  function why(){
    if (location.protocol === 'file:') return 'Dictation needs the workstation from its website: the speech recogniser is a download beside the forms.';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'This browser gives the page no microphone.';
    if (!W.caches || !W.crypto || !crypto.subtle || !W.Worker) return 'This browser cannot keep the speech recogniser on the device.';
    return '';
  }
  async function sha(b){ var h = await crypto.subtle.digest('SHA-256', b); return Array.prototype.map.call(new Uint8Array(h), function(x){ return x.toString(16).padStart(2, '0'); }).join(''); }
  async function kept(cache, name, type){
    var t = null;
    try { var r = await fetch(BASE + name, { cache: 'no-cache' }); if (r.ok) { t = await r.text(); try { await cache.put(BASE + name, new Response(t, { headers: { 'Content-Type': type } })); } catch (e) {} } } catch (e) { t = null; }
    if (t == null) { var c = await cache.match(BASE + name); if (c) t = await c.text(); }
    if (t == null) throw new Error(name + ' is not on this device yet (go online once)');
    return t;
  }
  async function libs(){
    var cache = await caches.open(CACHE), js = 'text/javascript', url = function(t){ return URL.createObjectURL(new Blob([t], { type: js })); };
    var L = await Promise.all(['asr-worker.js', 'sherpa-onnx-asr.js', 'sherpa-onnx-wasm-main-asr.js'].map(function(n){ return kept(cache, n, js); }));
    return { worker: url(L[0]), libs: [url(L[1]), url(L[2])] };
  }
  async function files(prog){
    var cache = await caches.open(CACHE), man = JSON.parse(await kept(cache, 'manifest.json', 'application/json')), all = new Uint8Array(man.size), o = 0;
    for (var k = 0; k < man.parts.length; k++) {
      var p = man.parts[k], b = null;
      try { var r = await cache.match(BASE + p.name); if (r) { b = await r.arrayBuffer(); if (b.byteLength !== p.size || await sha(b) !== p.sha256) b = null; } } catch (e) { b = null; }
      if (!b) {
        var res = await fetch(BASE + p.name, { cache: 'no-store' }); if (!res.ok) throw new Error('part ' + p.name + ': ' + res.status);
        b = await res.arrayBuffer(); if (b.byteLength !== p.size || await sha(b) !== p.sha256) throw new Error('part ' + p.name + ' did not arrive whole');
        try { await cache.put(BASE + p.name, new Response(b.slice(0), { headers: { 'Content-Type': 'application/octet-stream' } })); } catch (e) {}
      }
      all.set(new Uint8Array(b), o); o += b.byteLength; if (prog) prog(o / man.size);
    }
    return { wasm: all.slice(man.wasm[0], man.wasm[1]).buffer, data: all.slice(man.data[0], man.data[1]).buffer };
  }
  async function have(){ try { var c = await caches.open(CACHE); return (await c.keys()).length > 0; } catch (e) { return false; } }
  function ensure(prog){
    if (E.ready) return Promise.resolve(true);
    if (E.p) return E.p;
    E.loading = true;
    E.p = (async function(){
      var f = await files(prog), L = await libs();
      await new Promise(function(res, rej){
        var w = new Worker(L.worker); E.w = w;
        w.onmessage = function(e){ var d = e.data || {};
          if (d.t === 'ready') { E.ready = true; E.loading = false; res(true); }
          else if (d.t === 'res') onRes(d);
          else if (d.t === 'error') { E.loading = false; rej(new Error(d.m || 'the recogniser failed')); } };
        w.onerror = function(e){ E.loading = false; rej(new Error(String(e && e.message || 'the recogniser failed'))); };
        w.postMessage({ t: 'init', wasm: f.wasm, data: f.data, libs: L.libs }, [f.wasm, f.data]);
      });
      return true;
    })().catch(function(e){ E.p = null; E.loading = false; try { if (E.w) E.w.terminate(); } catch (x) {} E.w = null; throw e; });
    return E.p;
  }

  /* ---- the words: punctuation said aloud, capitals, and where they land ---- */
  var PUNCT = [[/\b(?:full stop|period)\b/g, '.'], [/\bcomma\b/g, ','], [/\bquestion mark\b/g, '?'], [/\bexclamation (?:mark|point)\b/g, '!'],
    [/\bsemicolon\b/g, ';'], [/\bcolon\b/g, ':'], [/\bnew paragraph\b/g, '\n\n'], [/\bnew line\b/g, '\n'], [/\bopen quote\b/g, '“'], [/\bclose quote\b/g, '”']];
  function tidy(t){
    t = String(t || '').toLowerCase().replace(/\s+/g, ' ').trim(); if (!t) return '';   /* the recogniser writes in capitals */
    PUNCT.forEach(function(p){ t = t.replace(p[0], p[1]); });
    t = t.replace(/\s+([.,?!:;])/g, '$1').replace(/([.,?!:;])(?=[A-Za-z“])/g, '$1 ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/ {2,}/g, ' ').replace(/^[.,?!:;\s]+/, '').trim();
    t = t.replace(/(\w)'(\w)/g, '$1’$2');   /* the apostrophe of a contraction as the forms write it */
    t = t.replace(/(^|[.?!]\s+|\n)([a-z])/g, function(m, a, b){ return a + b.toUpperCase(); }).replace(/\bi\b/g, 'I').replace(/\bi’(m|ve|ll|d)\b/g, function(m, x){ return 'I’' + x; });
    return t;
  }
  function insert(el, text){
    if (!el || !text) return;
    var v = el.value || '', a = el.selectionStart == null ? v.length : el.selectionStart, b = el.selectionEnd == null ? a : el.selectionEnd;
    var before = v.slice(0, a), after = v.slice(b);
    if ((!before.trim() || /[.?!]\s*$/.test(before) || /\n\s*$/.test(before)) && /^[a-z]/.test(text)) text = text.charAt(0).toUpperCase() + text.slice(1);
    var sep = before && !/\s$/.test(before) && !/^[.,?!:;]/.test(text) ? ' ' : '';
    var tail = after && !/^\s/.test(after) && !/^[.,?!:;]/.test(after) && !/\n$/.test(text) ? ' ' : '';
    var ins = sep + text;
    try { el.focus({ preventScroll: true }); } catch (e) {}
    var done = false;
    try { if (D.activeElement === el && typeof el.setRangeText === 'function') { el.setSelectionRange(a, b); el.setRangeText(ins + tail, a, b, 'end'); done = true; } } catch (e) { done = false; }
    if (!done) { el.value = before + ins + tail + after; var pos = (before + ins).length; try { el.setSelectionRange(pos, pos); } catch (e) {} }
    else { var p2 = a + ins.length; try { el.setSelectionRange(p2, p2); } catch (e) {} }
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  /* ---- the microphone, resampled to 16 kHz for the recogniser ---- */
  function audio(x){
    if (!S.on || !E.ready || !S.ctx) return;
    var e = 0, j; for (j = 0; j < x.length; j++) e += x[j] * x[j]; S.level = Math.sqrt(e / Math.max(1, x.length));
    var sr = S.ctx.sampleRate, f = sr / 16000, n = Math.floor(x.length / f), y = new Float32Array(n);
    for (j = 0; j < n; j++) { var a = Math.floor(j * f), b = Math.min(x.length, Math.floor((j + 1) * f)), s = 0; for (var q = a; q < b; q++) s += x[q]; y[j] = s / Math.max(1, b - a); }
    S.acc.push(y); S.accN += n;
    if (S.accN >= 1600 && S.inflight < 4) {
      var all = new Float32Array(S.accN), o = 0; S.acc.forEach(function(c){ all.set(c, o); o += c.length; }); S.acc = []; S.accN = 0; S.inflight++;
      try { E.w.postMessage({ t: 'audio', s: all, n: ++S.n }, [all.buffer]); } catch (err) { S.inflight--; }
    }
    paint();
  }
  function onRes(d){
    S.inflight = Math.max(0, S.inflight - 1);
    if (!S.on) return;
    var text = String(d.text || '').trim();
    if (d.end) { if (text) insert(S.el, tidy(text)); S.partial = ''; }
    else S.partial = text;
    paint();
  }
  async function listen(){
    var stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    if (!S.on) { stream.getTracks().forEach(function(t){ t.stop(); }); return; }
    S.stream = stream;
    S.src = S.ctx.createMediaStreamSource(stream); S.proc = S.ctx.createScriptProcessor(2048, 1, 1);
    var mute = S.ctx.createGain(); mute.gain.value = 0; S.src.connect(S.proc); S.proc.connect(mute); mute.connect(S.ctx.destination);
    S.proc.onaudioprocess = function(e){ audio(e.inputBuffer.getChannelData(0)); };
    try { await S.ctx.resume(); } catch (e) {}
  }

  /* ---- what is shown while listening: a small strip at the foot of the window with the words so far and Stop ---- */
  var CSS = '#nbhDict{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;max-width:min(92vw,560px);display:flex;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:999px;background:#182e43;color:#fff;font:14px/1.35 Inter,"Segoe UI",system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}' +
    '#nbhDict .dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:#f3c94f;transition:transform .08s}' +
    '#nbhDict .tx{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#nbhDict .tx i{font-style:normal;opacity:.75}' +
    '#nbhDict button{flex:0 0 auto;min-width:44px;min-height:36px;padding:0 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:transparent;color:#fff;font:inherit;font-weight:600;cursor:pointer}' +
    '#nbhDict button:hover{background:rgba(255,255,255,.12)}' +
    '@media print{#nbhDict{display:none}}';
  function box(){
    if (S.box) return S.box;
    var st = D.createElement('style'); st.id = 'nbh-dict-css'; st.setAttribute('data-nbh-screen', ''); st.textContent = CSS; (D.head || D.documentElement).appendChild(st);
    var b = D.createElement('div'); b.id = 'nbhDict'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); b.hidden = true;
    b.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="tx"></span><button type="button">Stop</button>';
    b.querySelector('button').addEventListener('mousedown', function(e){ e.preventDefault(); });
    b.querySelector('button').addEventListener('click', function(){ stop(); });
    D.body.appendChild(b); S.box = b; return b;
  }
  var lastPaint = 0;
  function paint(note){
    if (note !== undefined) S.note = note;
    var b = box(), now = Date.now();
    if (!S.on) { b.hidden = true; return; }
    if (note === undefined && now - lastPaint < 90) return; lastPaint = now;
    b.hidden = false;
    var dot = b.querySelector('.dot'); dot.style.transform = 'scale(' + (1 + Math.min(1.4, S.level * 30)).toFixed(2) + ')';
    var label = fieldName(S.el);
    b.querySelector('.tx').innerHTML = S.note ? esc(S.note) : (S.partial ? esc(S.partial) : '<i>Listening' + (label ? ' for ' + esc(label) : '') + '…</i>');
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fieldName(el){
    if (!el) return '';
    try {
      var lab = el.id ? D.querySelector('label[for="' + el.id.replace(/"/g, '\\"') + '"]') : null;
      if (!lab) lab = el.closest('label');
      var t = lab ? (lab.querySelector('span') && lab.children.length ? (lab.querySelector('span').textContent || lab.textContent) : lab.textContent) : (el.getAttribute('aria-label') || '');
      t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 40 ? '' : t;
    } catch (e) { return ''; }
  }
  function say(t, kind){ try { if (W.nbhUI && W.nbhUI.toast) { W.nbhUI.toast(t, { kind: kind || '' }); return; } } catch (e) {} try { if (W.wsUI && W.wsUI.toast) { W.wsUI.toast(t, { kind: kind || '' }); return; } } catch (e) {} try { alert(t); } catch (e) {} }

  /* ---- start and stop ---- */
  async function start(el, opt){
    opt = opt || {};
    if (S.on) { stop(); return false; }
    var w = why(); if (w) { say(w, 'warn'); return false; }
    if (!el || !/^(TEXTAREA|INPUT)$/.test(el.tagName) || (el.tagName === 'INPUT' && !/^(text|search|url|email|)$/.test(el.type || '')) || el.readOnly || el.disabled) { say('Tap into the text box first, then Dictate.', 'warn'); return false; }
    S.el = el; S.on = true; S.partial = ''; S.acc = []; S.accN = 0; S.inflight = 0; S.level = 0;
    var AC = W.AudioContext || W.webkitAudioContext;
    try { S.ctx = new AC(); } catch (e) { S.on = false; say('This browser gives the page no sound input.', 'warn'); return false; }
    if (S.onstate) S.onstate(true);
    paint('Starting the microphone…');
    try { await listen(); } catch (e) { stop(); say('The microphone was not allowed. Allow it for this site to dictate.', 'warn'); return false; }
    if (!S.on) return false;
    if (!E.ready) {
      if (!(await have())) {
        var okd = true;
        if (opt.confirm) { try { okd = await opt.confirm('Dictate: download the speech recogniser?\nIt is about 57 MB, from this workstation’s website, once; it stays on this device afterwards (Form TV-1 uses the same one). It runs on the device: what the microphone hears is not recorded and never leaves it.'); } catch (e) { okd = false; } }
        if (!okd) { stop(); return false; }
        if (!S.on) return false;
      }
      paint('Getting the speech recogniser…');
      try { await ensure(function(p){ paint('Getting the speech recogniser: ' + Math.round(p * 100) + '%'); }); }
      catch (e) { stop(); say('The speech recogniser could not be fetched (' + String(e && e.message || e) + ').', 'warn'); return false; }
      if (!S.on) return false;
    }
    try { E.w.postMessage({ t: 'reset' }); } catch (e) {}
    paint(''); return true;
  }
  function stop(){
    if (!S.on) return;
    S.on = false;
    if (S.proc) S.proc.onaudioprocess = null;
    try { if (S.src) S.src.disconnect(); if (S.proc) S.proc.disconnect(); } catch (e) {}
    if (S.stream) S.stream.getTracks().forEach(function(t){ t.stop(); });
    if (S.ctx) { try { S.ctx.close().catch(function(){}); } catch (e) {} }
    S.stream = S.ctx = S.src = S.proc = null; S.acc = []; S.accN = 0; S.inflight = 0;
    if (S.partial) { var t = tidy(S.partial); S.partial = ''; if (t) insert(S.el, t); }   /* what was heard and not yet ended lands too */
    try { if (E.w) E.w.postMessage({ t: 'reset' }); } catch (e) {}
    S.note = ''; paint(''); if (S.onstate) S.onstate(false);
  }
  D.addEventListener('keydown', function(e){ if (e.key === 'Escape' && S.on) { stop(); } }, true);
  W.addEventListener('pagehide', function(){ if (S.on) stop(); });

  W.nbhDictate = { start: start, stop: stop, active: function(){ return S.on; }, why: why, have: have, tidy: tidy, insert: insert, onstate: function(fn){ S.onstate = fn; }, ready: function(){ return E.ready; } };
})();
