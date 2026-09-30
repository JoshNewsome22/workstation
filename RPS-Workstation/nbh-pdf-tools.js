/* NBH PDF tools: a bookmark sidebar and contents page numbers for a packet
 * saved as PDF.
 *
 * Build master print gives every section an id (sec-DM-1, sec-IC-1, ...) and
 * links the contents list to them. When Chrome or Edge saves the packet as a
 * PDF, each linked id becomes a named destination in the file, pointing at the
 * page where that section starts, and each contents entry becomes a link
 * annotation whose rectangle says where the entry sits on the page. So the
 * finished PDF already says, by form id, where every form begins and where its
 * line in the contents is. This reads those and:
 *
 *   - writes a standard PDF outline (the bookmark panel), one entry per form;
 *   - writes each form's page number at the right of its contents entry, with a
 *     dotted leader, in the space the master print keeps clear for it.
 *
 * Nothing already on a page is redrawn or removed. The outline is added beside
 * the pages; the numbers are drawn on the contents page over the reserved
 * space. The result is re-read and checked before it is handed back.
 *
 * Runs in the browser, from a file:// folder, with no network. Needs pdf-lib
 * (pdf-lib.min.js, loaded first, which defines window.PDFLib). Also loads in
 * node for the tests: require('./nbh-pdf-tools.js')(require('./pdf-lib.min.js')).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.NBHPdf = factory(root.PDFLib);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';
  if (!P) throw new Error('pdf-lib is not loaded');

  var PDFName = P.PDFName, PDFArray = P.PDFArray, PDFDict = P.PDFDict,
      PDFRef = P.PDFRef, PDFNumber = P.PDFNumber, PDFHexString = P.PDFHexString,
      PDFString = P.PDFString, PDFDocument = P.PDFDocument,
      StandardFonts = P.StandardFonts, rgb = P.rgb;

  /* The contents page, as Build master print lays it out: the list sits inside
     0.45in page margins and 46px of cover padding, in 13px type. The numbers go
     in the gutter the list keeps clear at its right (see .mp-cover ol). */
  var LAYOUT = {
    rightEdge: 0.45 * 72 + 46 * 0.75,   // from the page's right edge to the list's, in points
    fontSize: 13 * 0.75,                // the entries' size, in points
    leader: rgb(0.624, 0.702, 0.682),   // #9fb3ae, the entries' own dotted underline
    ink: rgb(0, 0, 0)                   // the entries print in black
  };

  var SECTION = /^sec-(.+)$/;          // Build master print: <section id="sec-DM-1">
  var CONTENTS = 'mp-contents';         // Build master print: <h2 id="mp-contents">

  function load(bytes) {
    return PDFDocument.load(bytes, { updateMetadata: false }).catch(function (e) {
      var why = /encrypt/i.test(e && e.message) ? 'It is password-protected or encrypted.' :
        'It is damaged, or not a PDF.';
      throw new Error('This file could not be read. ' + why);
    });
  }

  function text(obj) {
    if (!obj) return '';
    if (obj instanceof PDFString || obj instanceof PDFHexString) return obj.decodeText();
    if (obj instanceof PDFName) return obj.decodeText ? obj.decodeText() : obj.asString().replace(/^\//, '');
    return '';
  }

  /* Every named destination in the file, name -> destination array.
     Chrome writes the PDF 1.1 form (a /Dests dictionary in the catalog);
     other producers use the /Names /Dests tree, so both are read. */
  function namedDests(doc) {
    var ctx = doc.context, out = Object.create(null);
    function put(name, value) {
      var v = ctx.lookup(value);
      if (v instanceof PDFDict) v = ctx.lookup(v.get(PDFName.of('D')));   // << /D [...] >>
      if (v instanceof PDFArray && name) out[name] = v;
    }
    var dests = doc.catalog.lookupMaybe(PDFName.of('Dests'), PDFDict);
    if (dests) dests.entries().forEach(function (e) { put(text(e[0]), e[1]); });

    var names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    var tree = names && names.lookupMaybe(PDFName.of('Dests'), PDFDict);
    (function walk(node, depth) {
      if (!node || depth > 32) return;
      var pairs = node.lookupMaybe(PDFName.of('Names'), PDFArray);
      for (var i = 0; pairs && i + 1 < pairs.size(); i += 2) put(text(pairs.lookup(i)), pairs.get(i + 1));
      var kids = node.lookupMaybe(PDFName.of('Kids'), PDFArray);
      for (var k = 0; kids && k < kids.size(); k++) walk(kids.lookupMaybe(k, PDFDict), depth + 1);
    })(tree, 0);
    return out;
  }

  function pageIndexer(doc) {
    var map = Object.create(null);
    doc.getPages().forEach(function (p, i) { map[p.ref.tag] = i; });
    return function (dest) {
      var first = dest && dest.get(0);
      if (first instanceof PDFRef) { var i = map[first.tag]; return i === undefined ? -1 : i; }
      if (first instanceof PDFNumber) return first.asNumber();    // a remote-style page number
      return -1;
    };
  }

  /* What the file holds: its title, page count, where the contents and each
     form start. sections are in page order, with the page range each covers. */
  function inspectDoc(doc) {
    var pages = doc.getPageCount();
    var dests = namedDests(doc);
    var at = pageIndexer(doc);
    var sections = [], contents = null;

    Object.keys(dests).forEach(function (name) {
      var page = at(dests[name]);
      if (page < 0 || page >= pages) return;
      if (name === CONTENTS) { contents = { page: page, dest: dests[name] }; return; }
      var m = SECTION.exec(name);
      if (m) sections.push({ id: m[1], page: page, dest: dests[name] });
    });
    sections.sort(function (a, b) { return a.page - b.page; });
    sections.forEach(function (s, i) {
      s.last = i + 1 < sections.length ? Math.max(s.page, sections[i + 1].page - 1) : pages - 1;
    });
    /* The cover and contents are whatever comes before the first form. A packet
       whose contents heading was itself a link target names it in the file as
       well; one that does not still has the pages. */
    if (!contents && sections.length && sections[0].page > 0) contents = { page: 0, dest: null };
    if (contents) contents.last = sections.length ? Math.max(contents.page, sections[0].page - 1) : contents.page;

    var title = '';
    try { title = doc.getTitle() || ''; } catch (e) {}
    return {
      title: title,
      pages: pages,
      contents: contents,
      sections: sections,
      hadOutline: !!doc.catalog.get(PDFName.of('Outlines'))
    };
  }

  function inspect(bytes) {
    return load(bytes).then(inspectDoc);
  }

  function copyDest(ctx, dest) {
    var a = PDFArray.withContext(ctx);
    for (var i = 0; i < dest.size(); i++) a.push(dest.get(i));
    return a;
  }

  function writeOutline(doc, items) {
    var ctx = doc.context;
    var rootRef = ctx.nextRef();
    var refs = items.map(function () { return ctx.nextRef(); });
    items.forEach(function (it, i) {
      var d = PDFDict.withContext(ctx);
      d.set(PDFName.of('Title'), PDFHexString.fromText(it.title));
      d.set(PDFName.of('Parent'), rootRef);
      if (i > 0) d.set(PDFName.of('Prev'), refs[i - 1]);
      if (i < items.length - 1) d.set(PDFName.of('Next'), refs[i + 1]);
      d.set(PDFName.of('Dest'), copyDest(ctx, it.dest));
      ctx.assign(refs[i], d);
    });
    var o = PDFDict.withContext(ctx);
    o.set(PDFName.of('Type'), PDFName.of('Outlines'));
    o.set(PDFName.of('First'), refs[0]);
    o.set(PDFName.of('Last'), refs[refs.length - 1]);
    o.set(PDFName.of('Count'), PDFNumber.of(items.length));
    ctx.assign(rootRef, o);
    doc.catalog.set(PDFName.of('Outlines'), rootRef);
    doc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));   // open with the panel showing
  }

  /* Read the outline back: [{ title, page }] in order. */
  function readOutline(doc) {
    var ctx = doc.context, at = pageIndexer(doc), out = [];
    var root = doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict);
    var ref = root && root.get(PDFName.of('First'));
    var seen = Object.create(null);
    while (ref && !seen[ref.tag] && out.length < 10000) {
      seen[ref.tag] = true;
      var it = ctx.lookup(ref, PDFDict);
      var dest = ctx.lookup(it.get(PDFName.of('Dest')));
      out.push({ title: text(it.get(PDFName.of('Title'))), page: dest instanceof PDFArray ? at(dest) : -1 });
      ref = it.get(PDFName.of('Next'));
    }
    return out;
  }

  /* Where each form's entry sits in the contents: the link annotations on the
     contents pages, grouped by the section they point at. A wrapped entry has
     one rectangle per line. */
  function contentsEntries(doc, info) {
    var pages = doc.getPages(), ctx = doc.context, out = Object.create(null);
    var last = info.contents ? info.contents.last : -1;
    for (var i = 0; i <= last && i < pages.length; i++) {
      var annots = pages[i].node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (!annots) continue;
      for (var a = 0; a < annots.size(); a++) {
        var an = annots.lookupMaybe(a, PDFDict);
        if (!an) continue;
        var sub = an.get(PDFName.of('Subtype'));
        if (!sub || sub.asString() !== '/Link') continue;
        var dest = an.get(PDFName.of('Dest'));
        if (!dest) { var act = an.lookupMaybe(PDFName.of('A'), PDFDict); dest = act && act.get(PDFName.of('D')); }
        var name = text(dest), m = SECTION.exec(name || '');
        if (!m) continue;
        var rect = an.lookupMaybe(PDFName.of('Rect'), PDFArray);
        if (!rect || rect.size() < 4) continue;
        var x1 = rect.lookup(0).asNumber(), y1 = rect.lookup(1).asNumber(), x2 = rect.lookup(2).asNumber(), y2 = rect.lookup(3).asNumber();
        (out[m[1]] = out[m[1]] || []).push({ page: i, x1: Math.min(x1, x2), x2: Math.max(x1, x2), y1: Math.min(y1, y2), y2: Math.max(y1, y2) });
      }
    }
    return out;
  }

  /* The page number of each form, at the right of its contents entry on the
     entry's last line, joined to it by a dotted leader. Returns what was done,
     or why it was not: a packet built before the list kept a gutter clear has
     nothing safe to write into, so it is left alone rather than written over. */
  function stampNumbers(doc, info, font) {
    var entries = contentsEntries(doc, info), ids = Object.keys(entries);
    if (!info.contents || !ids.length) return { numbered: 0, skipped: 'no contents entries were found' };
    var pages = doc.getPages();
    var page0 = pages[info.contents.page], width = page0.getWidth();
    var right = width - LAYOUT.rightEdge, size = LAYOUT.fontSize;
    var byId = Object.create(null);
    info.sections.forEach(function (s) { byId[s.id] = s; });
    /* each number goes on the last line of its entry: the lowest rectangle on
       the entry's last page. Every one of those lines has to leave room for it,
       or none is written: a contents page with some numbers is worse than one
       with none. */
    var plan = [];
    ids.forEach(function (id) {
      var sec = byId[id];
      if (!sec) return;
      var lastLine = entries[id].reduce(function (best, r) {
        return (!best || r.page > best.page || (r.page === best.page && r.y1 < best.y1)) ? r : best; }, null);
      var label = String(sec.page + 1), w = font.widthOfTextAtSize(label, size);
      plan.push({ line: lastLine, label: label, w: w });
    });
    if (!plan.length) return { numbered: 0, skipped: 'no entry matched a form' };
    var cramped = plan.some(function (e) { return e.line.x2 > right - e.w - 6; });
    if (cramped) {
      return { numbered: 0, skipped: 'the contents list runs into the space the numbers need, so this packet ' +
        'was built by an earlier version; build it again and the numbers will fit' };
    }
    var n = 0;
    plan.forEach(function (e) {
      var lastLine = e.line, page = pages[lastLine.page], label = e.label, w = e.w;
      /* the link rectangle is the line box; the entry's baseline sits 0.308 of the
         type size above its foot (measured against Chrome's output) */
      var baseline = lastLine.y1 + size * 0.308;
      page.drawText(label, { x: right - w, y: baseline, size: size, font: font, color: LAYOUT.ink });
      var from = lastLine.x2 + 5, to = right - w - 5;
      if (to - from > 8) {
        page.drawLine({ start: { x: from, y: lastLine.y1 + 0.9 }, end: { x: to, y: lastLine.y1 + 0.9 },
          thickness: 0.8, color: LAYOUT.leader, dashArray: [0.8, 2.4] });
      }
      n++;
    });
    return { numbered: n, skipped: '' };
  }

  function contentLengths(doc) {
    return doc.getPages().map(function (p) {
      var c = doc.context.lookup(p.node.get(PDFName.of('Contents')));
      var list = c instanceof PDFArray ? c.asArray().map(function (r) { return doc.context.lookup(r); }) : [c];
      return list.map(function (s) { return s && s.contents ? s.contents.length : -1; }).join('+');
    });
  }

  /* Add the outline. titleFor(id) names each form; the contents page, if the
     packet has one, is bookmarked first. Resolves to { bytes, info, outline }. */
  function bookmark(bytes, titleFor, opts) {
    opts = opts || {};
    titleFor = titleFor || function (id) { return 'Form ' + id; };
    var before;
    return load(bytes).then(function (doc) {
      var info = inspectDoc(doc);
      if (!info.sections.length) {
        throw new Error('No form sections were found in this PDF. It has to be a packet from ' +
          'Build master print, saved as PDF from the print window in Chrome or Edge.');
      }
      before = contentLengths(doc);
      var items = [];
      if (info.contents) {
        /* the first bookmark opens the packet at its cover, top of the page */
        var top = PDFArray.withContext(doc.context);
        top.push(doc.getPages()[info.contents.page].ref); top.push(PDFName.of('XYZ'));
        top.push(PDFNumber.of(0)); top.push(PDFNumber.of(doc.getPages()[info.contents.page].getHeight())); top.push(PDFNumber.of(0));
        items.push({ title: opts.contentsTitle || 'Cover and contents', dest: top, page: info.contents.page });
      }
      info.sections.forEach(function (s) {
        items.push({ title: String(titleFor(s.id) || 'Form ' + s.id), dest: s.dest, page: s.page });
      });
      writeOutline(doc, items);
      var numbers = { numbered: 0, skipped: 'not asked for' };
      var fontReady = opts.numbers === false ? Promise.resolve(null) : doc.embedFont(StandardFonts.Helvetica);
      return fontReady.then(function (font) {
        if (font) numbers = stampNumbers(doc, info, font);
        return doc.save({ useObjectStreams: false, updateFieldAppearances: false });
      }).then(function (out) {
        return { out: out, info: info, items: items, numbers: numbers };
      });
    }).then(function (r) {
      /* Check the written file rather than trusting it: same pages, same page
         contents, and every bookmark landing where its form starts. */
      return load(r.out).then(function (check) {
        if (check.getPageCount() !== r.info.pages)
          throw new Error('The copy has ' + check.getPageCount() + ' pages, not ' + r.info.pages + '. Nothing was saved.');
        /* Every page's original content is still there. A contents page that
           took numbers has the same streams it had, plus the ones drawn on it;
           any other page is exactly as it was. */
        var after = contentLengths(check);
        for (var i = 0; i < after.length; i++) {
          var numbered = r.numbers.numbered && r.info.contents && i >= r.info.contents.page && i <= r.info.contents.last;
          var ok = numbered ? after[i].split('+').join('+').indexOf(before[i]) >= 0 : after[i] === before[i];
          if (!ok) throw new Error('Page ' + (i + 1) + ' changed while the copy was written. Nothing was saved.');
        }
        var outline = readOutline(check);
        if (outline.length !== r.items.length)
          throw new Error('The copy has ' + outline.length + ' bookmarks, not ' + r.items.length + '. Nothing was saved.');
        outline.forEach(function (o, i) {
          if (o.page !== r.items[i].page || o.title !== r.items[i].title)
            throw new Error('Bookmark ' + (i + 1) + ' (' + r.items[i].title + ') does not land on page ' +
              (r.items[i].page + 1) + '. Nothing was saved.');
        });
        return { bytes: r.out, info: r.info, outline: outline, numbers: r.numbers };
      });
    });
  }

  return { inspect: inspect, bookmark: bookmark,
    readOutline: function (bytes) { return load(bytes).then(readOutline); },
    contentsEntries: function (bytes) { return load(bytes).then(function (d) { return contentsEntries(d, inspectDoc(d)); }); } };
});
