/* v26.15 the print review: what a printed form no longer carries, and the pages it no longer leaves nearly empty.
   Each form is printed to PDF as the browser prints it (its own beforeprint handlers run), with its simulation where
   it has one. Simulated data only.
   A  a text box prints without the corner grip (resize: none on paper) and an example in grey is not printed;
   B  a date left empty prints empty (Form GB-1): the box is marked when printing starts and the mark is taken off after;
   C  a sign-off that closes a sheet is not alone at the top of a page: Form RM-1's "Sign-off" heading and table are one
      block with the short table above them (it was alone on the last page);
   D  a part with nothing but its heading is left off: Form GB-1 with no objectives prints no page holding only
      "Goal Sheet" (it printed 4 pages; it prints 3);
   E  a run of one page and a few lines is brought back onto the page: Form SM-1's setup (2 pages to 1), Form EB-1's
      brief (3 to 2); nothing is scaled below 92%. (Form RS-1 was the third until v26.16: it now prints at 9 point, is
      not scaled, and takes 3 pages; qa/v2616-print-floor-test.js reads it. Since v26.17 Form SM-1, floored like every
      form, is tightened instead: its boxes and gaps take a scale of 88% at the least and its type stays at 9 point;
      qa/v2617-print-ink-test.js reads the type.)
   F  after printing, the form on screen is as it was: no mark, no scale, no wrapper left behind;
   G  the forms with paper of their own are left alone: Form SP-1's scatter plot sheet and Form IC-1 print the pages
      they printed before; no page error anywhere.
   usage: node qa/v2615-print-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const L = require(__dirname + '/lib.js');
const { sleep } = L;
const ED = process.env.WS_EDITION || 'NBH-Workstation';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1300))); };
/* the pages of a PDF, each with its lines of text (top to bottom) */
async function pagesOf(browser, buf) {
  const s = buf.toString('latin1'); return (s.match(/\/Type\s*\/Page[^s]/g) || []).length; }
(async () => {
  const browser = await L.chromium.launch(), errs = [];
  const open = async (id, sim) => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.addInitScript(() => { window.print = function () {}; window.confirm = () => true; });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(id + ': ' + String(e).slice(0, 160))); const f = L.forms(ED).find(x => x.id === id);
    await page.goto(`${L.BASE}/${ED}/${f.file}`, { waitUntil: 'load' }); await sleep(900); if (sim) { await L.loadSim(page); await sleep(1800); } return page; };
  const pdf = async page => { await page.emulateMedia({ media: 'print' }); await sleep(400); const b = await page.pdf({ preferCSSPageSize: true, printBackground: true }); await page.emulateMedia({ media: null }); await sleep(200); return b; };
  /* what holds while the page is being printed: the beforeprint handlers have run, the afterprint ones have not */
  const during = (page, fn, arg) => page.evaluate(([src, a]) => { window.dispatchEvent(new Event('beforeprint')); let r; try { r = (new Function('a', 'return (' + src + ')(a)'))(a); } finally { window.dispatchEvent(new Event('afterprint')); } return r; }, [fn.toString(), arg]);

  /* A, B: Form FS-1, blank (text boxes, empty dates) */
  const fs1 = await open('FS-1', false); await fs1.emulateMedia({ media: 'print' }); await sleep(300);
  const a = await during(fs1, () => { const ta = [...document.querySelectorAll('textarea')].filter(t => t.getClientRects().length), d = [...document.querySelectorAll('input[type=date]')].filter(t => t.getClientRects().length && !t.value);
    const ph = [...document.querySelectorAll('input[placeholder],textarea[placeholder]')].filter(t => t.getClientRects().length && !t.value)[0];
    return { ta: ta.length, grips: ta.filter(t => getComputedStyle(t).resize !== 'none').length, dates: d.length, marked: d.filter(x => x.classList.contains('nbh-pr-nodate')).length, ink: d.filter(x => getComputedStyle(x).color !== 'rgba(0, 0, 0, 0)').length, ph: ph ? getComputedStyle(ph, '::placeholder').color : 'none' }; });
  const after = await fs1.evaluate(() => ({ marked: document.querySelectorAll('.nbh-pr-nodate').length, keep: document.querySelectorAll('.nbh-keep').length, bare: document.querySelectorAll('[data-nbh-bare]').length, fit: document.querySelectorAll('[data-nbh-fit]').length, split: document.querySelectorAll('[data-nbh-split]').length }));
  ok('A on paper none of Form FS-1\'s ' + a.ta + ' text boxes carries the corner grip, and a box\'s grey example is not printed', a.ta >= 10 && a.grips === 0 && (a.ph === 'none' || a.ph === 'rgba(0, 0, 0, 0)'), a);
  await fs1.context().close();

  /* C: Form RM-1 with its simulation */
  const rm = await open('RM-1', true); await rm.emulateMedia({ media: 'print' }); await sleep(300);
  const c = await during(rm, () => { const h3 = [...document.querySelectorAll('h3')].filter(h => /^Sign-off$/.test(h.textContent.trim()) && h.getClientRects().length).pop(); if (!h3) return null; const box = h3.closest('.nbh-keep');
    return { kept: !!box, parts: box ? [...box.children].filter(x => x.getClientRects().length).map(x => x.tagName).join() : '', h: box ? Math.round(box.getBoundingClientRect().height) : 0, inline: box ? getComputedStyle(box).display : '', boxBefore: box ? getComputedStyle(box).breakBefore : '' }; });
  const rmBuf = await pdf(rm), rmPages = await pagesOf(browser, rmBuf); const rmLeft = await rm.evaluate(() => document.querySelectorAll('.nbh-keep,[data-nbh-keep="2"]').length); await rm.context().close();
  ok('C Form RM-1\'s closing "Sign-off" goes to paper with what is above it: the short table above it, the heading and the table of names and dates are one block a page cannot cut (about 4 inches with its margins, at the most), which may not start a page; undone after printing', !!c && c.kept && /TABLE,H3,TABLE$/.test(c.parts) && c.h >= 200 && c.h <= 400 && c.inline === 'inline-block' && c.boxBefore === 'avoid' && rmLeft === 0 && rmPages >= 5, { c, rmPages, rmLeft });

  /* D: Form GB-1, blank */
  const gb = await open('GB-1', false); await gb.emulateMedia({ media: 'print' }); await sleep(300);
  const d = await during(gb, () => { const bare = [...document.querySelectorAll('[data-nbh-bare]')]; return { n: bare.length, heads: bare.map(b => (b.querySelector('h2,h3,.nbh-band') || {}).textContent || '').map(t => t.trim()), shown: bare.filter(b => getComputedStyle(b).display !== 'none').length, others: [...document.querySelectorAll('.sheet .pane')].filter(p => p.getClientRects().length).length }; });
  const b = await during(gb, () => { const d = [...document.querySelectorAll('input[type=date]')].filter(t => t.getClientRects().length && !t.value); return { dates: d.length, marked: d.filter(x => x.classList.contains('nbh-pr-nodate')).length, ink: d.filter(x => getComputedStyle(x).color !== 'rgba(0, 0, 0, 0)').length }; });
  const gbPages = await pagesOf(browser, await pdf(gb)); const bLeft = await gb.evaluate(() => document.querySelectorAll('.nbh-pr-nodate').length); await gb.context().close();
  ok('B Form GB-1\'s empty dates print empty, not as "mm/dd/yyyy": each is marked while printing (' + b.marked + ' of ' + b.dates + ', none with ink) and no mark is left after', b.dates >= 3 && b.marked === b.dates && b.ink === 0 && bLeft === 0, { b, bLeft });
  ok('D Form GB-1 with no objectives leaves its "Goal Sheet" part off the paper (nothing but the heading would print) and keeps the other parts: 3 pages, where it printed 4', d.n === 1 && /^Goal Sheet/.test(d.heads[0]) && d.shown === 0 && d.others >= 3 && gbPages === 3, { d, gbPages });

  /* E: one page and a few lines */
  const fitOf = async (id, sim) => { const p = await open(id, sim); await p.emulateMedia({ media: 'print' }); await sleep(300);
    const z = await during(p, () => [...document.querySelectorAll('[data-nbh-fit]')].map(e => parseFloat(e.style.zoom))); const pages = await pagesOf(browser, await pdf(p)); const left = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.style && e.style.zoom && e.hasAttribute('data-nbh-fit')).length); await p.context().close(); return { z, pages, left }; };
  const e1 = await fitOf('SM-1', false), e2 = await fitOf('EB-1', true);
  const zs = e1.z.concat(e2.z);
  ok('E a run of one page and a few lines is brought back onto its page: Form SM-1 prints 1 page (was 2; tightened to 88% at the least, type kept), Form EB-1 2 (was 3; nothing scaled below 92%), and no scale is left on the screen',
    e1.pages === 1 && e2.pages === 2 && zs.length >= 2 && Math.min(...e2.z) >= 0.92 && Math.min(...e1.z) >= 0.88 && Math.max(...zs) < 1 && e1.left + e2.left === 0, { e1, e2 });

  /* F */
  ok('F after printing Form FS-1 the screen holds no mark, wrapper, scale or left-off part', after.keep === 0 && after.bare === 0 && after.fit === 0 && after.split === 0, after);

  /* G: forms with paper of their own */
  const sp = await open('SP-1', true); const spPages = await pagesOf(browser, await pdf(sp)); const spTouched = await during(sp, () => document.querySelectorAll('[data-nbh-fit],[data-nbh-bare],.nbh-keep').length); await sp.context().close();
  const ic = await open('IC-1', true); const icPages = await pagesOf(browser, await pdf(ic)); await ic.context().close();
  ok('G Form SP-1\'s scatter plot sheet prints as before (1 page, nothing fitted or left off) and Form IC-1 prints its 11 pages; no page error in any form printed here', spPages === 1 && spTouched === 0 && icPages === 11 && !errs.length, { spPages, spTouched, icPages, errs });
  await browser.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
