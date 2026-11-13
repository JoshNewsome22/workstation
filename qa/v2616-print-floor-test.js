/* v26.16 the smallest type on paper (the BCBA, 11/13: "Yes. Raise them."). Forms IA-1, PA-1, RA-1, TD-1, DM-1, TB-1 and RS-1
   printed most of their text under 9 point. Each is opened with its simulation and read as the browser prints it (print
   media, the beforeprint handlers run). Simulated data only.
   A  in each of the seven, no text prints under 9 point and no heading (h1 to h4) under 10, outside a drawing, a
      superscript and a table scaled to the page; the form is marked while it prints;
   B  a table too wide for the page at the new size is scaled alone (Form RA-1's 23-column table), so the form does not
      run past the page's width (the browser would shrink every page to fit it); what is scaled stays at 7.5 point or more;
   C  after printing nothing is left on the screen: no raised size, no mark, no tightened table;
   D  a form outside the list is not touched (Form FS-1);
   E  Form RS-1's year summary, longer than a page at 9 point, takes its closing block along: its closing lines may not
      start a page (3 pages);
   F  the packet does the same for the seven forms and for no other: a packet of Forms DM-1, TB-1 and FS-1.
   usage: node qa/v2616-print-floor-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const L = require(__dirname + '/lib.js');
const { sleep } = L;
const ED = process.env.WS_EDITION || 'NBH-Workstation';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1500))); };
const pagesOf = buf => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const SEVEN = ['IA-1', 'PA-1', 'RA-1', 'TD-1', 'DM-1', 'TB-1', 'RS-1'];
/* the text of a root as it prints: [under 9 pt outside a scaled table, headings under 10 pt, the smallest inside a scaled block, how many pieces] */
const READ = `(function (root) {
  var small = [], heads = [], least = 99, count = 0, XH = 'http://www.w3.org/1999/xhtml';
  (function walk(el, z, scaled) { var kids = el.children; for (var i = 0; i < kids.length; i++) { var c = kids[i]; if (c.namespaceURI !== XH || /^(SCRIPT|STYLE|TEMPLATE|SUP|SUB|OPTION)$/.test(c.tagName)) continue;
      var cs = getComputedStyle(c); if (cs.display === 'none' || cs.visibility === 'hidden') continue; var zo = parseFloat(cs.zoom) || 1, zc = z * zo, sc = scaled || zo < 0.999;
      var own = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(c.tagName) && c.type !== 'hidden' && c.type !== 'checkbox' && c.type !== 'radio';
      if (!own) for (var t = c.firstChild; t; t = t.nextSibling) if (t.nodeType === 3 && /\\S/.test(t.nodeValue)) { own = true; break; }
      if (own && c.getClientRects().length) { var pt = parseFloat(cs.fontSize) * zc * 0.75; count++;
        if (sc) least = Math.min(least, pt);
        else if (/^H[1-4]$/.test(c.tagName)) { if (pt < 9.95) heads.push(c.tagName + ' ' + pt.toFixed(2) + ' ' + c.textContent.trim().slice(0, 24)); }
        else if (pt < 8.95) small.push(c.tagName + '.' + String(c.className).slice(0, 18) + ' ' + pt.toFixed(2) + ' ' + (c.textContent || c.value || '').trim().slice(0, 24)); }
      walk(c, zc, sc); } })(root, 1, false);
  return { small: small.slice(0, 6), nSmall: small.length, heads: heads.slice(0, 4), least: least === 99 ? null : +least.toFixed(2), count: count };
})`;
(async () => {
  const browser = await L.chromium.launch(), errs = [];
  const open = async (id, sim) => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.addInitScript(() => { window.print = function () {}; window.confirm = () => true; });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(id + ': ' + String(e).slice(0, 160))); const f = L.forms(ED).find(x => x.id === id);
    await page.goto(`${L.BASE}/${ED}/${f.file}`, { waitUntil: 'load' }); await sleep(900); if (sim) { try { await L.loadSim(page); } catch (e) {} await sleep(1800); } return page; };
  const marks = () => ({ sized: [...document.querySelectorAll('body *')].filter(e => e.style && e.style.getPropertyPriority('font-size') === 'important').length, floor: document.documentElement.getAttribute('data-nbh-floor'), tight: document.querySelectorAll('[data-nbh-tight]').length });

  const res = {}; let rsPages = 0;
  for (const id of SEVEN) {
    const p = await open(id, true); await p.emulateMedia({ media: 'print' }); await sleep(300);
    const before = await p.evaluate(marks);
    await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    const during = await p.evaluate(marks);
    const read = await p.evaluate(READ + '(document.body)');
    /* the width the page gives it, as the browser lays it out for paper */
    await p.setViewportSize({ width: 730, height: 900 }); await sleep(250);
    const wide = await p.evaluate(() => ({ w: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, scaled: [...document.querySelectorAll('table')].filter(t => t.style.zoom && parseFloat(t.style.zoom) < 1 && t.getClientRects().length).length }));
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await sleep(150);
    const after = await p.evaluate(marks);
    if (id === 'RS-1') { const cssOk = await p.evaluate(() => { const e = document.querySelector('.rs-paper .p-inner > .p-foot'); return e ? getComputedStyle(e).breakBefore : 'none'; }); rsPages = pagesOf(await p.pdf({ preferCSSPageSize: true, printBackground: true })); res.rsBreak = cssOk; }
    res[id] = { before, during, read, wide, after }; await p.context().close();
  }
  const A = SEVEN.filter(id => { const r = res[id]; return !(r.during.floor === '9' && r.during.sized > 20 && r.read.nSmall === 0 && r.read.heads.length === 0 && r.read.count > 100); });
  ok('A in Forms ' + SEVEN.join(', ') + ' no text prints under 9 point and no heading under 10 (outside a drawing and a table scaled to the page); ' + SEVEN.map(id => id + ' ' + res[id].during.sized + ' raised').join(', '), A.length === 0, A.map(id => ({ id, during: res[id].during, read: res[id].read })));
  const B = SEVEN.filter(id => res[id].wide.sw > res[id].wide.w + 2 || (res[id].read.least !== null && res[id].read.least < 7.5));
  ok('B none of the seven runs past the page at the new size (a table too wide is scaled alone: Form RA-1 has ' + res['RA-1'].wide.scaled + ' scaled, its smallest type ' + res['RA-1'].read.least + ' pt), and nothing scaled falls under 7.5 point', B.length === 0 && res['RA-1'].wide.scaled >= 1, B.map(id => ({ id, wide: res[id].wide, least: res[id].read.least })));
  const C = SEVEN.filter(id => { const r = res[id]; return !(r.after.sized === r.before.sized && r.after.floor === null && r.after.tight === 0); });
  ok('C after printing the screen is as it was in all seven: no raised size, no mark, no tightened table', C.length === 0, C.map(id => ({ id, before: res[id].before, after: res[id].after })));

  const fs1 = await open('FS-1', true); await fs1.emulateMedia({ media: 'print' }); await sleep(300);
  const d0 = await fs1.evaluate(marks); await fs1.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); const d1 = await fs1.evaluate(marks); await fs1.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await fs1.context().close();
  ok('D Form FS-1, outside the list, is not touched: no mark and no raised size while it prints', d1.floor === null && d1.sized === d0.sized && d1.tight === 0, { d0, d1 });
  ok('E Form RS-1 prints 3 pages at 9 point, and its closing lines may not start a page (they take the block above them along)', rsPages === 3 && res.rsBreak === 'avoid', { rsPages, rsBreak: res.rsBreak });

  /* F: a packet of three forms, built from their simulations as qa/v2196-packet-test.js builds it */
  const FORMS = ['DM-1', 'TB-1', 'FS-1'];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' }); const page = await ctx.newPage(); page.on('pageerror', e => errs.push('shell: ' + String(e).slice(0, 160)));
  await page.goto(`${L.BASE}/${ED}/index.html`); await sleep(1200);
  await page.evaluate(() => { wsUI.confirm = async () => true; wsUI.alert = async () => {}; window.alert = () => {}; const set = (q, v) => { const e = document.querySelector(q); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('#pClient', 'Mateo Rivera'); set('#pSid', '4471823'); try { localStorage.removeItem('nbh.packet'); } catch (e) {} });
  const files = await page.evaluate(ids => ids.map(id => ALL.find(f => f[0] === id)[2]), FORMS);
  const frameOf = file => page.frames().find(f => f.url().indexOf(encodeURI(file)) >= 0 || f.url().indexOf(file) >= 0);
  for (let i = 0; i < FORMS.length; i++) { const id = FORMS[i]; await page.evaluate(id => openForm(id), id); await page.waitForFunction(id => !!state.status[id], id, { timeout: 40000 }).catch(() => {}); await sleep(600);
    const fr = frameOf(files[i]); if (!fr) continue; await fr.evaluate(() => { try { nbhUI.confirm = async () => true; } catch (e) {} window.confirm = () => true; }); try { await L.loadSim(fr); } catch (e) {} await sleep(1500); }
  await page.evaluate(() => gatherFacts(true)); await sleep(1500);
  const html = await page.evaluate(async ids => { let doc = ''; const wo = window.open; window.open = () => ({ document: { open() {}, write(h) { doc += h; }, close() {} }, focus() {}, print() {}, close() {}, closed: false });
    try { await masterRun(ALL.filter(f => ids.includes(f[0])), {}); } finally { window.open = wo; } const i = doc.lastIndexOf('<!DOCTYPE html>'); return i >= 0 ? doc.slice(i) : doc; }, FORMS);
  const pp = await ctx.newPage(); pp.on('pageerror', e => errs.push('packet: ' + String(e).slice(0, 160))); await pp.setViewportSize({ width: 730, height: 900 });
  await pp.setContent(html, { waitUntil: 'load' }); await sleep(2500); await pp.emulateMedia({ media: 'print' }); await sleep(400);
  const pk = await pp.evaluate(`(function () { var R = ${READ}; var o = { floor: window.__nbhFloor, sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth, secs: {} };
    ['DM-1', 'TB-1', 'FS-1'].forEach(function (id) { var s = document.getElementById('sec-' + id); o.secs[id] = s ? { mark: s.getAttribute('data-mp-floor'), read: R(s), sized: [].filter.call(s.querySelectorAll('*'), function (e) { return e.style && e.style.getPropertyPriority('font-size') === 'important'; }).length } : null; }); return o; })()`);
  const f = pk.secs;
  ok('F in a packet of Forms DM-1, TB-1 and FS-1 the first two print nothing under 9 point (' + (f['DM-1'] ? f['DM-1'].sized : '?') + ' and ' + (f['TB-1'] ? f['TB-1'].sized : '?') + ' pieces raised) and Form FS-1 is left as it is',
    !!f['DM-1'] && !!f['TB-1'] && !!f['FS-1'] && f['DM-1'].mark === '9' && f['TB-1'].mark === '9' && f['FS-1'].mark === null && f['DM-1'].read.nSmall === 0 && f['TB-1'].read.nSmall === 0 && f['DM-1'].read.heads.length === 0 && f['TB-1'].read.heads.length === 0 && f['DM-1'].sized > 20 && f['TB-1'].sized > 20 && f['FS-1'].sized === 0 && pk.floor > 40, pk);
  ok('G no page error in any form or in the packet', !errs.length, errs);
  await browser.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
