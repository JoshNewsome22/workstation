/* nbh-pwa-save (v21.43): the workstation installed on an iPad or iPhone: saving a file, a window it opens, printing.
   Opened from the Home Screen, the workstation runs in a window of its own, without Safari around it. There, and only
   there, three things a page does are handled here, because they do not behave as they do in Safari:
   - Saving. A file this page saves (Save data, Save case, Save packet, a CSV, a spreadsheet, a graph as a picture, a
     finished PDF) goes to the share sheet, where Save to Files keeps it on the device and Mail or AirDrop send it on.
   - A window the page opens for a page of its own making (the master print, the respondent page's preview, the pop-up
     test): the app cannot show a second window, so it opens inside the app, over the page, with Print and Close.
   - Printing. When the print options have not appeared a few seconds after Print, the page offers to make a PDF of its
     printed pages itself (v25.89), which the share sheet prints, keeps or sends.
   Everywhere else nothing changes: in a Safari tab, on a computer, installed on a Mac or with Chrome or Edge, this block
   stops at its first test and touches nothing; on an iPad that cannot share files only the saving part stays off.
   Every save in the forms and the shell is a link with a download name, clicked from script, so the link's click is
   the one place to catch: the file is the Blob the link's blob: address was made from (remembered as the address is
   made) or the data: address itself. The share sheet needs the tap that asked for it. When the file took longer to
   prepare than the browser allows after a tap (a case gathered from many forms), a small notice asks for one more tap
   and opens the sheet from that. Closing the sheet without choosing anything says the file was not saved, and the
   shell hears of it ('nbh-share-save' on window, detail {name, how}; and window.nbhShareSave.last, whose done promise
   gives how: shared, cancelled or downloaded), so the case is not counted as saved. Nothing is stored or sent anywhere.
   Written by tools/blocks/patch-pwa.py from tools/blocks/nbh-pwa-save.js; edit that file. */
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
  var inApp = standalone() && appleTouch();
  var on = inApp && typeof navigator.share === 'function' &&
           typeof navigator.canShare === 'function' && typeof File === 'function' && typeof Blob === 'function';
  var NS = window.nbhShareSave = { on: on, inApp: inApp, last: null };
  if (!inApp) return;

  /* ---------------- notices: a form's own (nbhUI), the shell's (wsUI, a name in its script), or a small one here */
  function toast(msg, kind) {
    var ui = window.nbhUI || (typeof wsUI !== 'undefined' ? wsUI : null);
    if (ui && typeof ui.toast === 'function') { try { ui.toast(msg, { kind: kind || 'warn', ms: 12000 }); return; } catch (e) {} }
    if (!document.body) return;
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483100;max-width:min(560px,calc(100% - 32px));' +
      'background:#7a2e1a;color:#f1f6f5;font:13.5px/1.45 system-ui,sans-serif;padding:10px 16px;border-radius:8px;box-shadow:0 12px 30px -12px rgba(22,36,46,.6)';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 9000);
  }
  function button(label, primary) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.style.cssText = 'font:inherit;font-size:14px;padding:8px 16px;min-height:44px;border:1px solid #c9d4d2;border-radius:4px;background:#fff;color:#16242e;cursor:pointer';
    if (primary) { b.style.background = '#182e43'; b.style.color = '#fff'; b.style.borderColor = '#182e43'; b.style.fontWeight = '600'; }
    return b;
  }

  /* ---------------- printing: the print options should appear within moments of Print */
  var NOPRINT = 'If no print options appeared, this iPad does not print from the installed app. Save the case (or the ' +
    'form’s data), open the workstation in Safari, open the file there and print from Safari, or print on a computer.';
  /* v25.89 (the BCBA, 11/11: "it is not allowing me to select print") Where the print options do not appear, the page
     offers to make a PDF of its printed pages itself (nbh-pdf-make.js, with nbh-html2canvas.js, both beside the forms and
     loaded only when asked for): the PDF goes to the share sheet, which prints it, keeps it in Files or sends it. That
     the device gave no print options is remembered on the device (localStorage nbh.noprint, no student), so the next
     Print goes straight to the offer; "Try Print again" asks the device once more, and forgets it when the options come. */
  var NOKEY = 'nbh.noprint';
  function noPrint() { try { return W.localStorage.getItem(NOKEY) === '1'; } catch (e) { return false; } }
  function setNoPrint(v) { try { if (v) W.localStorage.setItem(NOKEY, '1'); else W.localStorage.removeItem(NOKEY); } catch (e) {} }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src;
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error(src + ' did not load')); };
      (document.head || document.documentElement).appendChild(s);
    });
  }
  function pdfReady() {
    return (typeof window.html2canvas === 'function' ? Promise.resolve() : loadScript('nbh-html2canvas.js'))
      .then(function () { return typeof window.nbhPdfMake === 'function' ? null : loadScript('nbh-pdf-make.js'); });
  }
  var pdfBox = null;   /* the offer's window while it is open (the name offer is the saving part's) */
  function offerPdf(win, said, native) {
    if (pdfBox) return;
    if (!document.body) { (said || toast)(NOPRINT, 'warn'); return; }
    var modal = typeof HTMLDialogElement === 'function', before = document.activeElement, file = null, busy = false;
    var box = pdfBox = document.createElement(modal ? 'dialog' : 'div');
    box.id = 'nbhPdfOffer'; box.setAttribute('data-html2canvas-ignore', 'true'); box.setAttribute('aria-labelledby', 'nbhPdfOfferT');
    if (!modal) { box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); }
    box.style.cssText = 'position:fixed;left:50%;right:auto;top:auto;bottom:18px;transform:translateX(-50%);z-index:2147483200;box-sizing:border-box;' +
      'width:min(580px,calc(100% - 28px));max-height:calc(100% - 36px);overflow:auto;margin:0;padding:16px 18px 14px;border:1px solid #c9d4d2;border-radius:10px;' +
      'background:#fff;color:#16242e;font:15px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 18px 44px -14px rgba(22,36,46,.55)';
    var el = function (tag, text, css) { var x = document.createElement(tag); if (text) x.textContent = text; if (css) x.style.cssText = css; return x; };
    var t = el('b', 'Print or save these pages', 'display:block;margin:0 0 6px;color:#182e43;font:600 17px/1.3 Georgia,serif'); t.id = 'nbhPdfOfferT';
    var p1 = el('p', 'This iPad does not show print options inside the installed app. The workstation can make a PDF of these pages. From the PDF you can print, save to Files or send it.', 'margin:0 0 6px');
    var p2 = el('p', 'The PDF is a picture of each page: it prints as it looks, and its words cannot be searched.', 'margin:0 0 10px;color:#54676f;font-size:13.5px');
    var st = el('p', '', 'margin:0 0 10px;min-height:1.45em;color:#182e43;font-weight:600'); st.setAttribute('role', 'status');
    var row = el('div', '', 'display:flex;flex-wrap:wrap;gap:8px');
    var mk = button('Make the PDF', true), again = native ? button('Try Print again') : null, cl = button('Close');
    row.appendChild(mk); if (again) row.appendChild(again); row.appendChild(cl);
    var ps = el('style', '@media print{#nbhPdfOffer{display:none!important}}');   /* never on paper */
    box.appendChild(ps); box.appendChild(t); box.appendChild(p1); box.appendChild(p2); box.appendChild(st); box.appendChild(row);
    document.body.appendChild(box);
    if (modal) { try { box.showModal(); } catch (e) { box.setAttribute('open', ''); } }
    function close() {
      if (busy || !pdfBox) return; pdfBox = null;
      try { if (modal && box.open) box.close(); } catch (e) {}
      if (box.parentNode) box.parentNode.removeChild(box);
      try { if (before && before.focus) before.focus(); } catch (e) {}
    }
    function lock(v) { busy = v; mk.disabled = v; cl.disabled = v; if (again) again.disabled = v; mk.style.opacity = v ? '.55' : ''; }
    function share() {
      var can = false; try { can = typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }); } catch (e) {}
      if (!can) {   /* no share sheet for files here: the PDF as a file the browser saves or shows */
        try { var u = URL.createObjectURL(file), a = document.createElement('a'); a.href = u; a.download = file.name; a.target = '_blank'; document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); st.textContent = 'The PDF was handed to the device.'; }
        catch (e) { st.textContent = 'This iPad could not take the PDF. ' + NOPRINT; }
        return;
      }
      navigator.share({ files: [file] }).then(function () { st.textContent = 'Done. Tap the button to print or share it again, or Close.'; },
        function (e) { st.textContent = e && e.name === 'AbortError' ? 'Nothing was chosen. The PDF is still here.' : 'The share sheet did not open. Tap the button once more.'; });
    }
    mk.addEventListener('click', function () {
      if (busy) return;
      if (file) { share(); return; }
      lock(true); st.textContent = 'Getting ready\u2026';
      pdfReady().then(function () {
        return window.nbhPdfMake(win, { progress: function (i, n) { st.textContent = 'Drawing page ' + i + ' of ' + n + '\u2026'; } });
      }).then(function (r) {
        try { file = new File([r.blob], r.name, { type: 'application/pdf' }); } catch (e) { file = r.blob; file.name = r.name; }
        NS.pdf = { name: r.name, pages: r.pages, bytes: r.blob.size, at: Date.now() };
        lock(false); st.textContent = 'The PDF is ready: ' + r.pages + (r.pages === 1 ? ' page.' : ' pages.'); mk.textContent = 'Print or share the PDF';
        try { mk.focus(); } catch (e) {}
      }, function (e) {
        lock(false); st.textContent = 'The PDF could not be made' + (e && e.message ? ' (' + String(e.message).slice(0, 80) + ')' : '') + '. ' + NOPRINT;
      });
    });
    if (again) again.addEventListener('click', function () { if (busy) return; close(); try { native(); } catch (e) {} });
    cl.addEventListener('click', close);
    box.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    try { mk.focus(); } catch (e) {}
  }
  NS.offerPdf = offerPdf;
  function watchPrint(win, said) {
    var fired = false, mark = function (e) { if (!e || !e.nbhPdf) fired = true; };   /* the PDF maker's own beforeprint is not the device's */
    try { win.addEventListener('beforeprint', mark); } catch (e) {}
    try { if (W !== win) W.addEventListener('beforeprint', mark); } catch (e) {}
    setTimeout(function () {
      try { win.removeEventListener('beforeprint', mark); } catch (e) {}
      try { if (W !== win) W.removeEventListener('beforeprint', mark); } catch (e) {}
      if (fired) { setNoPrint(false); return; }
      setNoPrint(true);
      offerPdf(win, said, null);
    }, 3500);
  }
  var wprint = window.print;
  window.print = function () {
    if (noPrint()) { offerPdf(window, null, function () { watchPrint(window); wprint.call(window); }); return; }
    watchPrint(window); return wprint.apply(window, arguments);
  };

  /* ---------------- a window for a page of the page's own making: opened inside the app, over the page */
  var wopen = window.open, seq = 0;
  window.open = function (url) {
    var u = url == null ? '' : String(url);
    if (u === '' || u === 'about:blank' || /^blob:/i.test(u)) { var w = inside(u); if (w) return w; }
    return wopen.apply(window, arguments);
  };
  function inside(u) {
    if (!document.body) return null;
    var before = document.activeElement, id = 'nbhInApp' + (++seq), gone = false;
    /* a modal dialog where there is one, so that it shows above a notice the page has open (Diagnostics' pop-up test) */
    var modal = typeof HTMLDialogElement === 'function';
    var box = document.createElement(modal ? 'dialog' : 'div');
    box.id = id;
    if (!modal) { box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); }
    box.setAttribute('aria-labelledby', id + 'T');
    box.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;display:flex;flex-direction:column;' +
      'margin:0;padding:0;border:0;width:100%;height:100%;max-width:none;max-height:none;box-sizing:border-box;' +
      'background:#fff;color:#16242e;font:14px/1.4 system-ui,-apple-system,sans-serif';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:8px 12px;border-bottom:1px solid #c9d4d2;background:#f7f9f8;flex:0 0 auto';
    var t = document.createElement('b');
    t.id = id + 'T';
    t.style.cssText = 'flex:1 1 200px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#182e43;font:600 15px/1.3 Georgia,serif';
    t.textContent = 'Opening…';
    var note = document.createElement('span');
    note.setAttribute('role', 'status');
    note.style.cssText = 'flex:1 1 100%;order:3;color:#7a2e1a;font-size:12.5px';
    var pr = button('Print', true), cl = button('Close');
    var ifr = document.createElement('iframe');
    ifr.title = 'Page opened inside the app';
    ifr.style.cssText = 'flex:1 1 auto;width:100%;min-height:0;border:0;background:#fff';
    if (u) ifr.src = u;
    var st = document.createElement('style');
    st.textContent = '@media print{#' + id + '{display:none!important}}';
    bar.appendChild(t); bar.appendChild(pr); bar.appendChild(cl); bar.appendChild(note);
    box.appendChild(st); box.appendChild(bar); box.appendChild(ifr);
    document.body.appendChild(box);
    if (modal) { try { box.showModal(); } catch (e) { box.setAttribute('open', ''); } }
    var said = function (msg) { note.textContent = msg; };
    function close() {
      if (gone) return; gone = true; clearInterval(tick);
      try { if (modal && box.open) box.close(); } catch (e) {}
      if (box.parentNode) box.parentNode.removeChild(box);
      try { if (before && before.focus) before.focus(); } catch (e) {}
    }
    function nprint(w) { return w.__nbhPrint || w.print; }
    function doPrint() {
      var w = ifr.contentWindow; if (!w) return;
      note.textContent = '';
      var go = function () { watchPrint(w, said); try { w.focus(); nprint(w).call(w); } catch (e) { offerPdf(w, said, null); } };
      if (noPrint()) offerPdf(w, said, go); else go();
    }
    /* the page that opened it may call close() and print() on the window it was given: keep both pointing here */
    function patch() {
      var w = ifr.contentWindow;
      if (!w || w.__nbhInApp === close) return;
      try { w.__nbhPrint = w.print; w.print = doPrint; w.close = close; w.__nbhInApp = close; } catch (e) {}
    }
    var tick = setInterval(function () {
      patch();
      try {
        var d = ifr.contentDocument;
        if (d && d.title) t.textContent = d.title;
        else if (d && d.readyState === 'complete' && d.body && d.body.firstChild) t.textContent = 'Opened inside the app';
      } catch (e) {}
    }, 300);
    patch();
    pr.addEventListener('click', doPrint);
    cl.addEventListener('click', close);
    box.addEventListener('cancel', function (e) { e.preventDefault(); close(); });   /* Escape on a modal dialog */
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    try { cl.focus(); } catch (e) {}
    return ifr.contentWindow;
  }

  if (!on) return;

  /* ---------------- saving: the share sheet instead of a download */
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
  /* each file handed to the share sheet has a record: window.nbhShareSave.last, whose done says how it ended */
  function track(file) {
    var r = { name: file.name, at: Date.now(), how: '' };
    r.done = new Promise(function (res) { r.end = res; });
    file.__nbhRec = r; NS.last = r;
    return r;
  }
  function tell(file, how) {
    var r = file.__nbhRec;
    if (r && !r.how) { r.how = how; r.end(how); }
    try { window.dispatchEvent(new CustomEvent('nbh-share-save', { detail: { name: file.name, how: how } })); } catch (e) {}
    if (how === 'cancelled') toast('Not saved: ' + file.name + '. Save again and choose Save to Files to keep it on this device.', 'warn');
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
    if (!document.body) { download(file); tell(file, 'downloaded'); return; }
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
    var no = button('Cancel'), ok = button('Save…', true);
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
    track(file);
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
