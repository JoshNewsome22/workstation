/* nbh-pdf-make (v25.89, v26.21): a form's printed pages made into a PDF by the page itself, for the workstation installed on an
   iPad or iPhone, where the device offers no print options to an installed app.
   How: the page is drawn as it would print (its own print rules switched on in a copy, at the paper's width), cut into
   pages where a cut harms nothing (never through a line of words, a table row, a picture, or a block the form keeps
   whole; a new page where the form asks for one), each page drawn to a picture, and the pictures put into a PDF.
   The words in the PDF are a picture of the words: they print as they look, and cannot be searched or selected.
   Needs nbh-html2canvas.js (html2canvas-pro, MIT), loaded by the caller. Nothing is stored or sent anywhere.
   window.nbhPdfMake(win, {progress(page, pages), scale, quality}) -> Promise<{blob, pages, name}> */
(function () {
  'use strict';
  if (window.nbhPdfMake) return;
  var IN = 96;
  function len(v, dflt) {   /* a CSS length to px */
    var m = /^(-?[\d.]+)(in|pt|mm|cm|px)?$/.exec(String(v || '').trim());
    if (!m) return dflt;
    var n = parseFloat(m[1]), u = m[2] || 'px';
    return u === 'in' ? n * IN : u === 'pt' ? n * IN / 72 : u === 'mm' ? n * IN / 25.4 : u === 'cm' ? n * IN / 2.54 : n;
  }
  function eachRule(doc, fn) {
    var walk = function (rules) {
      for (var i = 0; rules && i < rules.length; i++) { var r = rules[i]; fn(r); var sub = null; try { sub = r.cssRules; } catch (e) {} if (sub && sub.length && !(r.selectorText && !r.media && !r.conditionText && r.type === 1)) walk(sub); }
    };
    for (var s = 0; s < doc.styleSheets.length; s++) { var rules = null; try { rules = doc.styleSheets[s].cssRules; } catch (e) {} walk(rules); }
  }
  /* the paper: letter, the margins and the turn of the form's own @page rule (the last one without a name wins) */
  function paper(doc) {
    var P = { w: 8.5 * IN, h: 11 * IN, m: [0.5 * IN, 0.5 * IN, 0.5 * IN, 0.5 * IN] };
    eachRule(doc, function (r) {
      if (r.type !== 6 || (r.selectorText && r.selectorText.trim())) return;
      var st = r.style; if (!st) return;
      var mg = (st.margin || '').trim().split(/\s+/).filter(Boolean);
      if (mg.length) { var a = mg.map(function (x) { return len(x, 0.5 * IN); }); P.m = [a[0], a.length > 1 ? a[1] : a[0], a.length > 2 ? a[2] : a[0], a.length > 3 ? a[3] : (a.length > 1 ? a[1] : a[0])]; }
      ['Top', 'Right', 'Bottom', 'Left'].forEach(function (k, i) { var v = st['margin' + k]; if (v && !mg.length) P.m[i] = len(v, P.m[i]); });
      var size = String(st.size || '').toLowerCase();
      if (/landscape/.test(size)) { P.w = 11 * IN; P.h = 8.5 * IN; } else if (/portrait|letter/.test(size)) { P.w = 8.5 * IN; P.h = 11 * IN; }
      if (/\ba4\b/.test(size)) { var aw = 210 / 25.4 * IN, ah = 297 / 25.4 * IN; P.w = /landscape/.test(size) ? ah : aw; P.h = /landscape/.test(size) ? aw : ah; }
    });
    P.cw = Math.floor(P.w - P.m[1] - P.m[3]); P.ch = Math.floor(P.h - P.m[0] - P.m[2]);
    return P;
  }
  /* the copy is told it is being printed: its print rules apply, its screen rules do not */
  function flip(q) {
    return String(q || '').split(',').map(function (x) {
      var t = x.trim();
      if (/\bprint\b/i.test(t)) return /\bnot\s+print\b/i.test(t) ? 'not all' : t.replace(/\b(only\s+)?print\b/i, 'all');
      if (/\bscreen\b/i.test(t)) return /\bnot\s+screen\b/i.test(t) ? t.replace(/\bnot\s+screen\b/i, 'all') : 'not all';
      return t;
    }).join(', ');
  }
  /* v26.21 the drawing copies onto every SVG picture the styles it has on the screen (it must: a picture is drawn on its
     own, away from the page's style sheets), and with them the box the screen gave it: its width, its height, whether it may
     shrink beside its neighbours. On paper that box is the form's print rules' to give. Form SP-1's square code under the grid
     (50 px by its print rule) was drawn 33 px wide beside its line of words, and the scan, which takes the sheet's scale from
     the code, could not find the grid's corner squares. The outermost SVG of each picture gets its box back: the copied
     box is taken off, and what the form itself wrote on the picture is put back. */
  var BOX = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'inline-size', 'block-size', 'min-inline-size', 'min-block-size',
    'max-inline-size', 'max-block-size', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'justify-self', 'place-self', 'order',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-inline', 'margin-inline-start', 'margin-inline-end',
    'margin-block', 'margin-block-start', 'margin-block-end', 'display', 'visibility', 'position', 'top', 'right', 'bottom', 'left', 'inset',
    'inset-block', 'inset-inline', 'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end', 'float', 'aspect-ratio'];
  function stampPictures(doc) {
    var all = doc.querySelectorAll('svg'), done = [];
    for (var i = 0; i < all.length; i++) { var p = all[i].parentNode; if (p && p.namespaceURI === 'http://www.w3.org/2000/svg') continue; all[i].setAttribute('data-nbh-svg', String(done.length)); done.push(all[i]); }
    return { list: done, off: function () { for (var k = 0; k < done.length; k++) done[k].removeAttribute('data-nbh-svg'); } };
  }
  function paperBoxes(doc, live) {
    var all = doc.querySelectorAll('svg[data-nbh-svg]');
    for (var i = 0; i < all.length; i++) {
      var c = all[i], l = live && live[+c.getAttribute('data-nbh-svg')], k;
      if (!c.style) continue;
      for (k = 0; k < BOX.length; k++) c.style.removeProperty(BOX[k]);
      if (l && l.style) for (k = 0; k < BOX.length; k++) { var v = l.style.getPropertyValue(BOX[k]); if (v) c.style.setProperty(BOX[k], v, l.style.getPropertyPriority(BOX[k])); }
    }
  }
  function asPrinted(doc, P, live) {
    try { paperBoxes(doc, live); } catch (e) {}
    eachRule(doc, function (r) { if (r.media && r.type === 4) { var t = r.media.mediaText, n = flip(t); if (n !== t) { try { r.media.mediaText = n; } catch (e) {} } } });
    var els = doc.querySelectorAll('style[media],link[media]');
    for (var i = 0; i < els.length; i++) { var m = els[i].getAttribute('media'); els[i].setAttribute('media', flip(m)); }
    var st = doc.createElement('style');
    st.textContent = 'html{width:' + P.cw + 'px!important;min-width:0!important;max-width:none!important;height:auto!important;overflow:visible!important;background:#fff!important}' +
      'body{overflow:visible!important;height:auto!important;min-height:0!important}*{animation:none!important;transition:none!important}';
    (doc.head || doc.documentElement).appendChild(st);
    doc.documentElement.setAttribute('data-nbh-pdf', '1');
    /* a box's grey example words are not printed */
    var ph = doc.querySelectorAll('[placeholder]'); for (i = 0; i < ph.length; i++) ph[i].removeAttribute('placeholder');
    /* a form that shrinks a wide table to the page does it with zoom, which the drawing does not know: the same size as a
       scale from the top left corner, with the room the smaller table leaves given back */
    var zs = doc.querySelectorAll('[style*="zoom"]'), win = doc.defaultView;
    for (i = 0; i < zs.length; i++) {
      var el = zs[i], z = parseFloat(el.style.zoom);
      if (!z || Math.abs(z - 1) < 0.004 || z > 4) continue;
      /* v26.21 the screen's own enlargement of a sheet (the Fit button: an inline zoom above 1 on the sheet) is not part
         of the paper. A form that adds sheets while the PDF is made (Form SP-1's print copy) had it put back on them by
         the page, on an iPad held on its side: those pages were drawn a third larger and cut off. */
      if (z > 1 && el.matches && el.matches('main, .sheet')) { el.style.zoom = ''; continue; }
      el.style.zoom = '1';
      var w0 = el.offsetWidth, h0 = el.offsetHeight, cs = win.getComputedStyle(el);
      if (cs.transform && cs.transform !== 'none') continue;
      el.style.transformOrigin = '0 0'; el.style.transform = 'scale(' + z + ')';
      el.style.marginBottom = ((parseFloat(cs.marginBottom) || 0) - h0 * (1 - z)) + 'px';
      el.style.marginRight = ((parseFloat(cs.marginRight) || 0) - w0 * (1 - z)) + 'px';
    }
  }
  /* what the form does not print is not copied for each page: found once in the page itself, with its print rules on for
     a moment (no picture is drawn in between), and marked for the drawing to leave out */
  function markUnprinted(doc) {
    var changed = [], marked = [], win = doc.defaultView;
    eachRule(doc, function (r) { if (r.media && r.type === 4) { var t = r.media.mediaText, n = flip(t); if (n !== t) { try { r.media.mediaText = n; changed.push([r, t]); } catch (e) {} } } });
    try {
      var tw = doc.createTreeWalker(doc.body, 1, null), n = tw.nextNode();
      while (n) {
        /* a style sheet in the page's body shows nothing either, and must stay: the copy is laid out by it */
        var hide = false, tg = n.tagName; try { hide = tg !== 'STYLE' && tg !== 'LINK' && win.getComputedStyle(n).display === 'none'; } catch (e) {}
        if (hide && !n.hasAttribute('data-html2canvas-ignore')) { n.setAttribute('data-html2canvas-ignore', 'true'); marked.push(n); }
        if (hide) { var nx = n; n = null; while (nx && nx !== doc.body) { if (nx.nextElementSibling) { n = nx.nextElementSibling; break; } nx = nx.parentElement; } if (n) tw.currentNode = n; }
        else n = tw.nextNode();
      }
    } finally { for (var i = 0; i < changed.length; i++) { try { changed[i][0].media.mediaText = changed[i][1]; } catch (e) {} } }
    return function () { for (var k = 0; k < marked.length; k++) marked[k].removeAttribute('data-html2canvas-ignore'); };
  }
  /* the words the form sets in the page's margins (its @page rule: the practice, the form, a line at the foot, the page
     number), read from the style text since not every browser keeps them; a form with none gets "Page 1 of 3" at the foot */
  function marginWords(doc) {
    var B = {}, txt = '', st = doc.querySelectorAll('style');
    for (var i = 0; i < st.length; i++) txt += st[i].textContent + '\n';
    var re = /@page\s*([^{]*)\{((?:[^{}]|\{[^{}]*\})*)\}/g, m;
    while ((m = re.exec(txt))) {
      if (m[1].trim() || /\$\{/.test(m[2])) continue;
      var rb = /@(top|bottom)-(left|center|right)\s*\{([^{}]*)\}/g, q;
      while ((q = rb.exec(m[2]))) {
        var c = /content\s*:\s*([^;]+)/.exec(q[3]); if (!c) continue;
        var fs = /font-size\s*:\s*([\d.]+)(pt|px)/.exec(q[3]), col = /[^-]color\s*:\s*(#[0-9a-fA-F]{3,8})/.exec(' ' + q[3]);
        B[q[1] + '-' + q[2]] = { c: c[1].trim(), px: fs ? (fs[2] === 'pt' ? parseFloat(fs[1]) * IN / 72 : parseFloat(fs[1])) : 10.5, col: col ? col[1] : '#54676f' };
      }
    }
    if (!Object.keys(B).length) B['bottom-right'] = { c: '"Page " counter(page) " of " counter(pages)', px: 10.5, col: '#54676f' };
    var root = doc.defaultView.getComputedStyle(doc.documentElement);
    var words = function (c, n, N) {
      var out = '', re2 = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|counter\(\s*(pages?)\s*\)|var\(\s*(--[\w-]+)\s*(?:,\s*("[^"]*"|'[^']*'))?\)/g, t;
      while ((t = re2.exec(c))) {
        if (t[1] != null || t[2] != null) out += (t[1] != null ? t[1] : t[2]).replace(/\\(["'\\])/g, '$1');
        else if (t[3]) out += t[3] === 'page' ? n : N;
        else if (t[4]) { var v = root.getPropertyValue(t[4]).trim() || (t[5] || ''); out += v.replace(/^["']|["']$/g, ''); }
      }
      return out;
    };
    return { boxes: B, words: words };
  }
  /* where the pages end */
  function paginate(doc, P) {
    var win = doc.defaultView, body = doc.body, CH = P.ch;
    var atoms = [], forced = [], keep = [], texts = [], bottom = 0;
    var WHOLE = { TR: 1, IMG: 1, SVG: 1, CANVAS: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, VIDEO: 1, LI: 0 };
    var tw = doc.createTreeWalker(body, 5 /* elements and text */, null), n, range = doc.createRange();
    var skipUnder = null;
    while ((n = tw.nextNode())) {
      if (skipUnder) { if (skipUnder.contains(n)) continue; skipUnder = null; }
      if (n.nodeType === 3) {
        if (!/\S/.test(n.nodeValue)) continue;
        range.selectNodeContents(n); var b = range.getBoundingClientRect();
        if (b.height > 0 && b.width > 0) { texts.push({ n: n, t: b.top, b: b.bottom }); if (b.bottom > bottom) bottom = b.bottom; }
        continue;
      }
      var cs = win.getComputedStyle(n);
      if (cs.display === 'none') { skipUnder = n; continue; }
      if (cs.position === 'fixed') { skipUnder = n; continue; }
      var r = n.getBoundingClientRect(); if (!r.height && !r.width) continue;
      var tag = n.tagName.toUpperCase(), vis = cs.visibility !== 'hidden';
      /* both names of each rule are read: a browser may keep the answer under the old one only */
      var bb = (cs.breakBefore || '') + ' ' + (cs.pageBreakBefore || ''), ba = (cs.breakAfter || '') + ' ' + (cs.pageBreakAfter || ''), bi = (cs.breakInside || '') + ' ' + (cs.pageBreakInside || '');
      if (/\b(page|always|left|right|recto|verso)\b/.test(bb)) forced.push(r.top);
      if (/\b(page|always|left|right|recto|verso)\b/.test(ba)) forced.push(r.bottom);
      if (/^H[1-6]$/.test(tag) || /\bavoid/.test(ba) || tag === 'THEAD' || tag === 'LEGEND' || tag === 'CAPTION') keep.push({ t: r.top, b: r.bottom });
      var whole = WHOLE[tag] === 1 || /\bavoid/.test(bi);
      if (whole && r.height > 0 && r.height <= CH * 0.92) atoms.push({ t: r.top, b: r.bottom });
      if (vis && r.height > 0 && (tag === 'IMG' || tag === 'SVG' || tag === 'CANVAS' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (cs.borderBottomWidth !== '0px' && cs.borderBottomStyle !== 'none') || (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) && tag !== 'BODY' && tag !== 'HTML'))) { if (r.bottom > bottom) bottom = r.bottom; }
      if (tag === 'SVG') skipUnder = n;
    }
    bottom = Math.ceil(bottom + 1);
    var lineCut = function (cut, y) {   /* a line of words the cut would go through: its top */
      var best = null;
      for (var i = 0; i < texts.length; i++) { var t = texts[i]; if (t.t >= cut - 0.5 || t.b <= cut + 0.5) continue;
        range.selectNodeContents(t.n); var rs = range.getClientRects();
        for (var k = 0; k < rs.length; k++) { var q = rs[k]; if (q.top < cut - 0.5 && q.bottom > cut + 0.5 && q.top > y + 1 && q.height < CH * 0.5) { if (best === null || q.top < best) best = q.top; } } }
      return best;
    };
    var begins = function (a, b) {   /* does a line of words or a whole block begin between a and b? */
      for (var i = 0; i < texts.length; i++) { if (texts[i].t >= a - 1 && texts[i].t < b - 3) return true; }
      for (i = 0; i < atoms.length; i++) { if (atoms[i].t >= a - 1 && atoms[i].t < b - 3 && atoms[i].b > atoms[i].t + 6) return true; }
      return false;
    };
    var pages = [], y = 0, guard = 0;
    forced.sort(function (a, b) { return a - b; });
    while (y < bottom - 1 && guard++ < 400) {
      var lim = y + CH, f = null;
      for (var i = 0; i < forced.length; i++) { if (forced[i] > y + 2 && forced[i] <= lim) { f = forced[i]; break; } }
      var cut;
      if (f !== null) cut = f;
      else if (lim >= bottom) cut = bottom;
      else {
        cut = lim;
        for (var it = 0; it < 60; it++) {
          var moved = false;
          for (var a = 0; a < atoms.length; a++) { var A = atoms[a]; if (A.t < cut - 0.5 && A.b > cut + 0.5 && A.t > y + 1) { cut = A.t; moved = true; } }
          var lc = lineCut(cut, y); if (lc !== null) { cut = lc; moved = true; }
          for (var k = 0; k < keep.length; k++) { var K = keep[k]; if (K.t > y + 1 && K.b <= cut + 0.5 && cut - K.b < 56 && !begins(K.b, cut)) { cut = K.t; moved = true; } }
          if (!moved) break;
        }
        if (cut < y + CH * 0.25) cut = lim;   /* nothing sensible: a plain cut rather than a nearly empty page */
      }
      cut = Math.floor(cut);
      if (cut <= y) cut = Math.min(bottom, y + CH);
      pages.push([y, cut]); y = cut;
    }
    return pages;
  }
  /* ---- a PDF of JPEG pages */
  function hex16(s) { var o = 'FEFF'; for (var i = 0; i < s.length; i++) { var h = s.charCodeAt(i).toString(16).toUpperCase(); o += ('0000' + h).slice(-4); } return '<' + o + '>'; }
  function pdfOf(imgs, P, title) {   /* imgs: [{bytes:Uint8Array, w, h, cssH}] */
    var parts = [], off = 0, xref = [], enc = new TextEncoder();
    var put = function (x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); off += b.length; };
    var obj = function (n, head, stream) { xref[n] = off; put(n + ' 0 obj\n' + head + '\n'); if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); } put('endobj\n'); };
    var PT = 72 / IN, pw = P.w * PT, ph = P.h * PT, np = imgs.length, kids = [];
    put('%PDF-1.4\n%âãÏÓ\n');
    for (var i = 0; i < np; i++) kids.push((4 + i * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Count ' + np + ' /Kids [' + kids.join(' ') + '] >>');
    obj(3, '<< /Title ' + hex16(title || 'Form') + ' /Producer ' + hex16('Workstation, pages drawn on the device') + ' >>');
    for (i = 0; i < np; i++) {
      var im = imgs[i], pg = 4 + i * 3, w = pw, h = ph, x = 0, yb = 0;
      var c = enc.encode('q ' + w.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' + x.toFixed(2) + ' ' + yb.toFixed(2) + ' cm /Im0 Do Q');
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw.toFixed(2) + ' ' + ph.toFixed(2) + '] /Resources << /XObject << /Im0 ' + (pg + 2) + ' 0 R >> >> /Contents ' + (pg + 1) + ' 0 R >>');
      obj(pg + 1, '<< /Length ' + c.length + ' >>', c);
      obj(pg + 2, '<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>', im.bytes);
    }
    var n = 4 + np * 3, start = off, x = 'xref\n0 ' + n + '\n0000000000 65535 f \n';
    for (i = 1; i < n; i++) x += ('0000000000' + xref[i]).slice(-10) + ' 00000 n \n';
    put(x + 'trailer\n<< /Size ' + n + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + start + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }
  function jpeg(canvas, q) {
    return new Promise(function (res, rej) {
      canvas.toBlob(function (b) { if (!b) { rej(new Error('no picture')); return; } var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.onerror = function () { rej(fr.error); }; fr.readAsArrayBuffer(b); }, 'image/jpeg', q);
    });
  }
  function fire(win, name) { try { var ev = new win.Event(name); ev.nbhPdf = true; win.dispatchEvent(ev); } catch (e) {} }   /* marked: not the device's own print */

  window.nbhPdfMake = function (win, opt) {
    win = win || window; opt = opt || {};
    var h2c = opt.html2canvas || win.html2canvas || window.html2canvas;
    if (typeof h2c !== 'function') return Promise.reject(new Error('nbh-html2canvas.js is missing'));
    var doc = win.document, root = doc.documentElement, P = paper(doc), scale = opt.scale || 2, quality = opt.quality || 0.9;   /* 192 dots to the inch; 144 past 60 pages */
    var base = { backgroundColor: '#ffffff', scale: scale, useCORS: false, allowTaint: false, logging: false, scrollX: 0, scrollY: 0, windowWidth: P.cw, windowHeight: P.ch, imageTimeout: 8000,
      ignoreElements: function (el) { return el.tagName === 'SCRIPT' || el.tagName === 'NOSCRIPT' || el.tagName === 'IFRAME' || (el.hasAttribute && el.hasAttribute('data-nbh-nopdf')); } };
    var with_ = function (o) { var r = {}, k; for (k in base) r[k] = base[k]; for (k in o) r[k] = o[k]; return r; };
    var pages = null, imgs = [], unmark = function () {}, MW = null, pics = { list: [], off: function () {} };
    fire(win, 'beforeprint');
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    return wait(60).then(function () {
      try { unmark = markUnprinted(doc); } catch (e) {}
      try { pics = stampPictures(doc); } catch (e) {}
      try { MW = marginWords(doc); } catch (e) { MW = null; }
      /* a first pass finds where the pages end */
      /* v26.21 a form that sizes its sheet to the page (Form SP-1's grid rows) is shown the copy as it lies on paper, once,
         before the pages are cut: window.nbhPdfFit(copy, paper) changes the copy and the page alike, so the pages drawn
         afterwards are the same */
      return h2c(root, with_({ x: 0, y: 0, width: 2, height: 2, scale: 1, onclone: function (d) { asPrinted(d, P, pics.list); if (typeof win.nbhPdfFit === 'function') { try { win.nbhPdfFit(d, P); } catch (e) {} } pages = paginate(d, P); } }));
    }).then(function () {
      if (!pages || !pages.length) throw new Error('nothing to print');
      if (!opt.scale && pages.length > 60) { scale = 1.5; base.scale = 1.5; }
      var i = 0;
      var next = function () {
        if (i >= pages.length) return null;
        var pg = pages[i], hh = Math.max(1, pg[1] - pg[0]);
        if (opt.progress) { try { opt.progress(i + 1, pages.length); } catch (e) {} }
        return h2c(root, with_({ x: 0, y: pg[0], width: P.cw, height: hh, onclone: function (d) { asPrinted(d, P, pics.list); } })).then(function (cv) {
          var pc = doc.createElement('canvas'); pc.width = Math.round(P.w * scale); pc.height = Math.round(P.h * scale);
          var g = pc.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, pc.width, pc.height);
          g.drawImage(cv, Math.round(P.m[3] * scale), Math.round(P.m[0] * scale));
          cv.width = cv.height = 0;
          if (MW) { for (var key in MW.boxes) { var bx = MW.boxes[key], t = MW.words(bx.c, i + 1, pages.length); if (!t) continue;
            var top = /^top/.test(key), side = key.split('-')[1];
            g.font = (bx.px * scale) + 'px Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif'; g.fillStyle = bx.col; g.textBaseline = 'middle';
            g.textAlign = side === 'center' ? 'center' : side; var tx = side === 'left' ? P.m[3] : side === 'right' ? P.w - P.m[1] : P.w / 2, ty = top ? P.m[0] * 0.56 : P.h - P.m[2] * 0.56;
            g.fillText(t, tx * scale, ty * scale, (P.cw * (side === 'center' ? 0.5 : 0.48)) * scale); } }
          return jpeg(pc, quality).then(function (bytes) { imgs.push({ bytes: bytes, w: pc.width, h: pc.height }); pc.width = pc.height = 0; i++; return wait(0).then(next); });
        });
      };
      return next();
    }).then(function () {
      unmark(); pics.off(); fire(win, 'afterprint');
      var title = (doc.title || 'Form').trim(), name = title.replace(/[^\w .()\-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Form';
      return { blob: pdfOf(imgs, P, title), pages: imgs.length, name: name + '.pdf', paper: P, cuts: pages };
    }, function (e) { unmark(); pics.off(); fire(win, 'afterprint'); throw e; });
  };
  window.nbhPdfMake.paper = paper; window.nbhPdfMake.flip = flip; window.nbhPdfMake.marginWords = marginWords; window.nbhPdfMake.asPrinted = asPrinted; window.nbhPdfMake.paginate = paginate;
})();
