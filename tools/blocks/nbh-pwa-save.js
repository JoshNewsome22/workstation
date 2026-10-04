/* nbh-pwa-save (v21.43): saving a file from the workstation installed on an iPad or iPhone.
   Opened from the Home Screen, the workstation runs in a window of its own, without Safari around it, and a download
   does not land where it does in Safari. There, and only there, a file this page saves (Save data, Save case, Save
   packet, a CSV, a spreadsheet, a graph as a picture, a finished PDF) goes to the share sheet instead, where Save to
   Files keeps it on the device and Mail or AirDrop send it on. Everywhere else nothing changes: in a Safari tab, on a
   computer, installed on a Mac or with Chrome or Edge, or on a device that cannot share files, the file downloads
   exactly as before, because this block then stops at its first test and touches nothing.
   Every save in the forms and the shell is a link with a download name, clicked from script, so the link's click is
   the one place to catch: the file is the Blob the link's blob: address was made from (remembered as the address is
   made) or the data: address itself. The share sheet needs the tap that asked for it. When the file took longer to
   prepare than the browser allows after a tap (a case gathered from many forms), a small notice asks for one more tap
   and opens the sheet from that. Closing the sheet without choosing anything says the file was not saved, and the
   shell hears of it ('nbh-share-save' on window, detail {name, how}) so its unsaved-work dot comes back. Nothing is
   stored or sent anywhere. Written by tools/blocks/patch-pwa.py from tools/blocks/nbh-pwa-save.js; edit that file. */
(function () {
  'use strict';
  if (window.nbhShareSave) return;
  var W = window;
  try { if (window.top && window.top.matchMedia) W = window.top; } catch (e) {}
  function standalone() {
    try {
      if (W.navigator.standalone === true) return true;
      return W.matchMedia('(display-mode: standalone)').matches || W.matchMedia('(display-mode: fullscreen)').matches;
    } catch (e) { return false; }
  }
  /* iPad and iPhone; an iPad asking for desktop sites calls itself a Mac, and its touch points give it away */
  function appleTouch() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  }
  var on = standalone() && appleTouch() && typeof navigator.share === 'function' &&
           typeof navigator.canShare === 'function' && typeof File === 'function' && typeof Blob === 'function';
  window.nbhShareSave = { on: on };
  if (!on) return;

  var blobs = new Map(), mk = URL.createObjectURL, rv = URL.revokeObjectURL, ck = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = function (o) {
    var u = mk.apply(URL, arguments);
    try { if (o instanceof Blob) blobs.set(u, o); } catch (e) {}
    return u;
  };
  URL.revokeObjectURL = function (u) { blobs.delete(u); return rv.apply(URL, arguments); };

  var TYPES = { json: 'application/json', csv: 'text/csv', html: 'text/html', htm: 'text/html', txt: 'text/plain',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  function typeFor(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return (m && TYPES[m[1].toLowerCase()]) || 'application/octet-stream'; }
  function fromData(u) {
    var i = u.indexOf(','); if (i < 0) return null;
    var head = u.slice(5, i), body = u.slice(i + 1), b64 = /;base64$/i.test(head);
    var type = head.replace(/;base64$/i, '').split(';')[0] || 'text/plain';
    try {
      if (!b64) return new Blob([decodeURIComponent(body)], { type: type });
      var bin = atob(body), n = bin.length, a = new Uint8Array(n);
      for (var k = 0; k < n; k++) a[k] = bin.charCodeAt(k);
      return new Blob([a], { type: type });
    } catch (e) { return null; }
  }
  /* the file behind a download link, or null when the link is not one this block can hand to the share sheet */
  function fileOf(a) {
    var href = a.href || '', name = a.getAttribute('download') || '';
    var blob = blobs.get(href) || (href.slice(0, 5) === 'data:' ? fromData(href) : null);
    if (!blob) return null;
    var file;
    try { file = new File([blob], name || 'file', { type: blob.type || typeFor(name) }); } catch (e) { return null; }
    try { if (!navigator.canShare({ files: [file] })) return null; } catch (e) { return null; }
    return file;
  }
  function tell(file, how) {
    try { window.dispatchEvent(new CustomEvent('nbh-share-save', { detail: { name: file.name, how: how } })); } catch (e) {}
    if (how !== 'cancelled') return;
    var msg = 'Not saved: ' + file.name + '. Save again and choose Save to Files to keep it on this device.';
    /* a form's own notices (nbhUI), or the shell's (wsUI, a name in the page's script, not a property of window) */
    var ui = window.nbhUI || (typeof wsUI !== 'undefined' ? wsUI : null);
    if (ui && typeof ui.toast === 'function') { try { ui.toast(msg, { kind: 'warn' }); return; } catch (e) {} }
    toast(msg);
  }
  function toast(msg) {
    if (!document.body) return;
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9100;max-width:min(560px,calc(100% - 32px));' +
      'background:#7a2e1a;color:#f1f6f5;font:13.5px/1.45 system-ui,sans-serif;padding:10px 16px;border-radius:8px;box-shadow:0 12px 30px -12px rgba(22,36,46,.6)';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 7000);
  }
  /* the download as it was, for the rare failure of the share sheet itself */
  function download(file) {
    var u = mk.call(URL, file), a = document.createElement('a');
    a.href = u; a.download = file.name; a.__nbhPlain = true;
    (document.body || document.documentElement).appendChild(a);
    ck.call(a);
    a.remove();
    setTimeout(function () { rv.call(URL, u); }, 60000);
  }
  function share(file) {
    var act = navigator.userActivation;
    if (act && act.isActive === false) { later(file); return; }
    var p;
    try { p = navigator.share({ files: [file] }); } catch (e) { later(file); return; }
    Promise.resolve(p).then(function () { tell(file, 'shared'); }, function (e) {
      var n = e && e.name;
      if (n === 'AbortError') tell(file, 'cancelled');
      else if (n === 'NotAllowedError' || n === 'InvalidStateError') later(file);
      else { download(file); tell(file, 'downloaded'); }
    });
  }
  /* one more tap: the notice's Save button opens the share sheet from its own click */
  var dlg = null;
  function later(file) {
    if (!document.body) { download(file); return; }
    if (dlg) dlg.nbhClose('cancelled');   /* a second file while the first still waits: the first was not saved */
    var d = document.createElement('dialog'), done = false;
    d.id = 'nbhShareDlg';
    d.setAttribute('aria-labelledby', 'nbhShareDlgT');
    d.style.cssText = 'border:1px solid #c9d4d2;border-radius:8px;padding:0;max-width:440px;width:calc(100% - 32px);color:#16242e;' +
      'background:#fff;box-shadow:0 30px 70px -24px rgba(24,46,67,.55);font:14px/1.5 system-ui,-apple-system,sans-serif';
    var h = document.createElement('div');
    h.id = 'nbhShareDlgT';
    h.style.cssText = 'padding:14px 18px 6px;font:600 15.5px/1.35 Georgia,serif;color:#182e43;word-break:break-word';
    h.textContent = 'Save ' + file.name;
    var b = document.createElement('div');
    b.style.cssText = 'padding:0 18px 14px;color:#2b3a44';
    b.textContent = 'The file is ready. Tap Save, then choose Save to Files to keep it on this device, or Mail or AirDrop to send it.';
    var f = document.createElement('div');
    f.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding:10px 18px;border-top:1px solid #e3eae8;background:#f7f9f8;border-radius:0 0 8px 8px';
    var no = document.createElement('button'), ok = document.createElement('button');
    no.type = ok.type = 'button';
    no.textContent = 'Cancel'; ok.textContent = 'Save…';
    no.style.cssText = ok.style.cssText = 'font:inherit;font-size:14px;padding:8px 16px;min-height:44px;border:1px solid #c9d4d2;border-radius:4px;background:#fff;color:#16242e;cursor:pointer';
    ok.style.background = '#182e43'; ok.style.color = '#fff'; ok.style.borderColor = '#182e43'; ok.style.fontWeight = '600';
    var st = document.createElement('style');
    st.textContent = '#nbhShareDlg::backdrop{background:rgba(22,36,46,.38)}@media print{#nbhShareDlg{display:none!important}}';
    f.appendChild(no); f.appendChild(ok); d.appendChild(st); d.appendChild(h); d.appendChild(b); d.appendChild(f);
    var close = function (how) {
      if (done) return; done = true;
      try { d.close(); } catch (e) {}
      if (d.parentNode) d.parentNode.removeChild(d);
      if (dlg === d) dlg = null;
      if (how) tell(file, how);
    };
    ok.addEventListener('click', function () { close(''); share(file); });
    no.addEventListener('click', function () { close('cancelled'); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); close('cancelled'); });
    d.nbhClose = close;
    dlg = d;
    /* shown a moment later, so it sits above any notice the page puts up right after its save */
    setTimeout(function () {
      if (done) return;
      document.body.appendChild(d);
      try { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); } catch (e) { d.setAttribute('open', ''); }
      try { ok.focus(); } catch (e) {}
    }, 40);
  }
  function offer(a) {
    if (!a || a.__nbhPlain || !a.hasAttribute('download')) return false;
    var file = fileOf(a);
    if (!file) return false;
    share(file);
    return true;
  }
  HTMLAnchorElement.prototype.click = function () {
    if (offer(this)) return;
    return ck.apply(this, arguments);
  };
  /* a download link a person taps in the page itself */
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if (a && offer(a)) e.preventDefault();
  }, true);
})();
