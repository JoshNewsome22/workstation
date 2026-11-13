/* v26.17 type and ink on paper for every form (the BCBA, 11/13: "Make all these improvements", after the prints were measured
   beside Pearson's and PAR's sample reports). Each form is opened with its simulation and read as the browser prints it
   (print media, the beforeprint handlers run). Simulated data only.
   A  ink: in Form FS-1 no grey text is left on paper (it prints near black) and most of the text is near black; before
      printing the form does hold grey text, and after printing the screen has it back;
   B  rules: no light grey rule is left on a table cell or a box to write in (they print a mid grey);
   C  measure: no paragraph of running text outside a table prints wider than about 5.5 inches (Forms FS-1 and AD-1; read
      at the window's width, where a list item the page holds under the limit can stand a little over it: 6.25 inches is the test's line);
   D  the floor is for every form but the designed sheets: Forms FS-1, GB-1, OB-1, PR-1 and AD-1 print nothing under 9
      point outside a drawing, a scaled table and what the guards kept at its own size;
   E  the designed sheets are left as they are: Form SP-1 takes no mark at all; Form IC-1 takes the ink and keeps its sizes
      (11 pages); Form EB-1 keeps its sizes and its one-page fit (2 pages); Form DD-1, fitted to its pages, takes the ink
      and keeps its sizes;
   F  a kept block never stands directly under a hint that may not be parted from it and from its heading (they join it,
      or the block is not made): Forms CR-1, AD-1, CT-1, SM-1; Form SM-1's setup is back on one page with its type at 9 point;
   G  Form RS-1's papers carry the shared look: the title as the tinted band, headings in the serif face in sentence case;
   H  no page error; nothing left on the screen after printing in any form read here.
   usage: node qa/v2617-print-ink-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const L = require(__dirname + '/lib.js');
const { sleep } = L;
const ED = process.env.WS_EDITION || 'NBH-Workstation';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1500))); };
const pagesOf = buf => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
/* what the page holds as it prints: grey text, near-black share, light rules, wide paragraphs, small type, marks */
const READ = `(function () {
  var XH = 'http://www.w3.org/1999/xhtml', o = { text: 0, black: 0, grey: [], rules: 0, cells: 0, wide: [], small: [], least: 99 };
  function rgb(v) { var m = /rgba?\\(\\s*([\\d.]+)[,\\s]+([\\d.]+)[,\\s]+([\\d.]+)(?:[,\\s/]+([\\d.]+))?/.exec(v || ''); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; } function chr(c) { return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]); }
  (function walk(el, z, inTable, scaled) { var kids = el.children; for (var i = 0; i < kids.length; i++) { var c = kids[i]; if (c.namespaceURI !== XH || /^(SCRIPT|STYLE|TEMPLATE|OPTION)$/.test(c.tagName)) continue;
      var cs = getComputedStyle(c); if (cs.display === 'none' || cs.visibility === 'hidden') continue; var zo = parseFloat(cs.zoom) || 1, zc = z * zo, sc = scaled || (zo < 0.999 && !c.hasAttribute('data-nbh-fit')) || c.hasAttribute('data-nbh-asis');
      var field = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(c.tagName) && c.type !== 'hidden' && c.type !== 'checkbox' && c.type !== 'radio', own = field, len = 0;
      for (var t = c.firstChild; t; t = t.nextSibling) if (t.nodeType === 3 && /\\S/.test(t.nodeValue)) { own = true; len += t.nodeValue.length; }
      var shows = c.getClientRects().length > 0;
      if (own && shows) { o.text++; var col = rgb(cs.color); if (col && col[3] > 0.5) { var l = lum(col); if (l <= 0.16) o.black++; if (chr(col) <= 48 && l > 0.16 && l < 0.72) o.grey.push(c.tagName + '.' + String(c.className).slice(0, 14) + ' ' + cs.color); }
        if (!/^(SUP|SUB)$/.test(c.tagName)) { var pt = parseFloat(cs.fontSize) * zc * 0.75; if (sc) o.least = Math.min(o.least, pt); else if (pt < (/^H[1-4]$/.test(c.tagName) ? 9.95 : 8.95)) o.small.push(c.tagName + '.' + String(c.className).slice(0, 14) + ' ' + pt.toFixed(2)); }
        if (!inTable && !field && len >= 180 && /^(P|DIV|LI|DD|BLOCKQUOTE|SMALL|SECTION)$/.test(c.tagName) && /^(block|list-item|flow-root)$/.test(cs.display) && c.offsetWidth * zc > 600) { var plain = true; for (var e = c.firstElementChild; e; e = e.nextElementSibling) if (!/^(B|I|EM|STRONG|SPAN|A|CODE|SUP|SUB|BR|U|SMALL|MARK|ABBR|CITE|Q|KBD|VAR|WBR)$/.test(e.tagName)) { plain = false; break; } if (plain) o.wide.push(c.tagName + '.' + String(c.className).slice(0, 14) + ' ' + Math.round(c.offsetWidth * zc)); } }
      if (shows && /^(TD|TH|INPUT|TEXTAREA|SELECT)$/.test(c.tagName)) { o.cells++; ['Top', 'Right', 'Bottom', 'Left'].forEach(function (s) { var w = parseFloat(cs['border' + s + 'Width']) || 0, st = cs['border' + s + 'Style']; if (!w || st === 'none' || st === 'hidden') return; var bc = rgb(cs['border' + s + 'Color']); if (bc && bc[3] > 0.5 && chr(bc) <= 48 && lum(bc) > 0.55 && lum(bc) < 0.95) o.rules++; }); }
      walk(c, zc, inTable || c.tagName === 'TABLE', sc); } })(document.body, 1, false, false);
  var de = document.documentElement;
  return { text: o.text, black: o.black, nGrey: o.grey.length, grey: o.grey.slice(0, 5), rules: o.rules, cells: o.cells, nWide: o.wide.length, wide: o.wide.slice(0, 4), nSmall: o.small.length, small: o.small.slice(0, 5), least: o.least === 99 ? null : +o.least.toFixed(2),
    floor: de.getAttribute('data-nbh-floor'), ink: de.getAttribute('data-nbh-ink'), inl: [].filter.call(document.querySelectorAll('body *'), function (e) { return e.style && (e.style.getPropertyPriority('color') === 'important' || e.style.getPropertyPriority('font-size') === 'important' || e.style.getPropertyPriority('max-width') === 'important'); }).length };
})()`;
(async () => {
  const browser = await L.chromium.launch(), errs = [];
  const open = async (id, sim) => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.addInitScript(() => { window.print = function () {}; window.confirm = () => true; });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(id + ': ' + String(e).slice(0, 160))); const f = L.forms(ED).find(x => x.id === id);
    await page.goto(`${L.BASE}/${ED}/${f.file}`, { waitUntil: 'load' }); await sleep(900); if (sim) { try { await L.loadSim(page); } catch (e) {} await sleep(1800); } return page; };
  const read = async (id, sim, extra) => { const p = await open(id, sim); await p.emulateMedia({ media: 'print' }); await sleep(300);
    const before = await p.evaluate(READ); await p.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); const during = await p.evaluate(READ);
    const more = extra ? await p.evaluate(extra) : null;
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await sleep(150); const after = await p.evaluate(READ);
    const pages = pagesOf(await p.pdf({ preferCSSPageSize: true, printBackground: true })); await p.context().close(); return { before, during, after, pages, more }; };
  const KEEPS = `(function () { var bad = []; [].forEach.call(document.querySelectorAll('.nbh-keep'), function (k) { var p = k.previousElementSibling; while (p && p.getBoundingClientRect().height < 2) p = p.previousElementSibling;
      if (p && /\\b(hint|method|lede)\\b/.test(p.className || '')) bad.push(p.tagName + '.' + String(p.className).slice(0, 16)); });
    return { keeps: document.querySelectorAll('.nbh-keep').length, bad: bad, fit: [].map.call(document.querySelectorAll('[data-nbh-fit]'), function (e) { return e.getAttribute('data-nbh-fit') + ' ' + e.style.zoom; }) }; })()`;

  const fs1 = await read('FS-1', true), ad1 = await read('AD-1', true, KEEPS), gb1 = await read('GB-1', true), ob1 = await read('OB-1', true), dd1 = await read('DD-1', true), pr1 = await read('PR-1', true);
  ok('A ink: Form FS-1 holds ' + fs1.before.nGrey + ' pieces of grey text on screen and none on paper; ' + fs1.during.black + ' of ' + fs1.during.text + ' pieces print near black',
    fs1.before.nGrey > 20 && fs1.during.nGrey === 0 && fs1.during.black >= fs1.during.text * 0.8, { before: fs1.before.nGrey, during: fs1.during });
  ok('B rules: of the light grey rules Form FS-1 shows on its cells and boxes (' + fs1.before.rules + ' sides) none is left on paper',
    fs1.before.rules > 50 && fs1.during.rules === 0, { before: fs1.before.rules, during: fs1.during.rules, cells: fs1.during.cells });
  ok('C measure: no paragraph of running text outside a table prints wider than about 5.5 inches (Form FS-1 had ' + fs1.before.nWide + ', Form AD-1 ' + ad1.before.nWide + ')',
    fs1.before.nWide + ad1.before.nWide >= 5 && fs1.during.nWide === 0 && ad1.during.nWide === 0, { fs1: fs1.during.wide, ad1: ad1.during.wide });
  const D = { 'FS-1': fs1, 'GB-1': gb1, 'OB-1': ob1, 'PR-1': pr1, 'AD-1': ad1 }, dBad = Object.keys(D).filter(k => !(D[k].during.floor === '9' && D[k].during.nSmall === 0 && (D[k].during.least === null || D[k].during.least >= 7.5)));
  ok('D the floor is for every form: Forms FS-1, GB-1, OB-1, PR-1 and AD-1 print nothing under 9 point outside a drawing and a scaled table (on screen: ' + Object.keys(D).map(k => k + ' ' + D[k].before.nSmall).join(', ') + ' pieces)',
    dBad.length === 0 && gb1.before.nSmall > 10, dBad.map(k => ({ k, floor: D[k].during.floor, small: D[k].during.small, least: D[k].during.least })));

  const sp1 = await read('SP-1', true), ic1 = await read('IC-1', true), eb1 = await read('EB-1', true);
  ok('E the designed sheets: Form SP-1 takes no mark (' + sp1.pages + ' page); Form IC-1 takes the ink and keeps its sizes (' + ic1.pages + ' pages); Form EB-1 keeps its sizes and its fit (' + eb1.pages + ' pages)',
    sp1.during.floor === null && sp1.during.ink === null && sp1.during.inl === sp1.before.inl && sp1.pages === 1 && ic1.during.floor === null && ic1.during.ink !== null && ic1.during.nGrey === 0 && ic1.pages === 11 && eb1.during.floor === null && eb1.pages === 2 && dd1.during.floor === null && dd1.during.ink !== null && dd1.during.nGrey === 0,
    { sp1: { f: sp1.during.floor, i: sp1.during.ink, p: sp1.pages }, ic1: { f: ic1.during.floor, i: ic1.during.ink, g: ic1.during.grey, p: ic1.pages }, eb1: { f: eb1.during.floor, p: eb1.pages } });

  const cr1 = await read('CR-1', false, KEEPS), ct1 = await read('CT-1', false, KEEPS), sm1 = await read('SM-1', false, KEEPS);
  const kb = [['CR-1', cr1], ['AD-1', ad1], ['CT-1', ct1], ['SM-1', sm1]].filter(x => x[1].more.bad.length);
  ok('F a kept block never stands directly under a hint that hangs on a heading (Forms CR-1, AD-1, CT-1, SM-1: ' + [cr1, ad1, ct1, sm1].map(x => x.more.keeps).join(', ') + ' kept blocks); Form SM-1\'s setup prints on one page, tightened (' + sm1.more.fit.join('; ') + '), its type at 9 point or more',
    kb.length === 0 && cr1.more.keeps >= 1 && sm1.pages === 1 && sm1.more.fit.length >= 1 && /^tight/.test(sm1.more.fit[0]) && sm1.during.nSmall === 0, { kb: kb.map(x => [x[0], x[1].more.bad]), sm1: { pages: sm1.pages, fit: sm1.more.fit, small: sm1.during.small } });

  const rs = await open('RS-1', false); await rs.emulateMedia({ media: 'print' }); await sleep(300);
  const g = await rs.evaluate(() => { const t = document.querySelector('.rs-paper .p-title'), h = document.querySelector('.rs-paper h4'); if (!t || !h) return null; const ct = getComputedStyle(t), ch = getComputedStyle(h);
    return { bg: ct.backgroundColor, bl: ct.borderLeftWidth, tf: ct.fontFamily.slice(0, 30), tr: ch.textTransform, hf: ch.fontFamily.slice(0, 30), hpt: parseFloat(ch.fontSize) * 0.75 }; }); await rs.context().close();
  ok('G Form RS-1\'s papers carry the shared look: the title is the tinted band, the headings are in the serif face in sentence case at 10 point or more',
    !!g && g.bg === 'rgb(234, 242, 240)' && parseFloat(g.bl) >= 3 && g.tr === 'none' && /Iowan|Palatino|Georgia|serif/i.test(g.hf) && g.hpt >= 9.95, g);

  const all = { fs1, ad1, gb1, ob1, dd1, pr1, sp1, ic1, eb1, cr1, ct1, sm1 }, left = Object.keys(all).filter(k => all[k].after.inl !== all[k].before.inl || all[k].after.floor !== null || all[k].after.ink !== null);
  ok('H after printing the screen is as it was in all ' + Object.keys(all).length + ' forms read here, and no page error', left.length === 0 && !errs.length, { left: left.map(k => [k, all[k].before.inl, all[k].after.inl, all[k].after.floor, all[k].after.ink]), errs });
  await browser.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
