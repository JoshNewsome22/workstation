/* v26.12 Share view in Daily data (Form DD-1): one graph alone on the whole screen, with the student's initials in place
   of the name, for a shared screen in a meeting.
   A  with the simulated student, every behavior's graph has one "Share view" button, 44 px tall, and still exactly one
      after the graphs are drawn again;
   B  it opens that graph alone: a dialog over the whole window, headed by the initials and the behavior, the graph at 80%
      of the width or more, the sentence that reads the graph under it; the student's name is nowhere on it; the focus is
      on Close and the page behind does not scroll;
   C  Escape closes it and the focus goes back to the button; Close closes it; Tab stays between its buttons; nothing of
      it is left in the page;
   D  the initials: "Rivera, Ana Lucia" gives A.L.R.; with no name the heading is the behavior alone;
   E  at a phone's width it fits and its buttons are 44 px; the start screen's sidebar names the wider search; no page
      error.
   usage: node qa/v2612-share-view-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), ED = process.env.WS_EDITION || 'NBH-Workstation', DIR = path.join(ROOT, ED);
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FORM = 'Daily_Behavior_Data_and_Visual_Analysis.html';
const sim = async p => { p.on('dialog', d => d.accept()); await p.goto(B + FORM); await sleep(2000);
  await p.evaluate(() => { [...document.querySelectorAll('button')].find(x => /Load simulation/.test(x.textContent)).click(); }); await sleep(800);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Load'); if (b) b.click(); }); await sleep(2500);
  await p.evaluate(() => { [...document.querySelectorAll('button,a')].find(b => /Graphs & analysis/.test(b.textContent)).click(); }); await p.waitForSelector('.dd-graphsave [data-share]', { timeout: 20000 }); await sleep(800); };
(async () => {
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); await sim(p);
  const count = () => p.evaluate(() => { const reps = [...document.querySelectorAll('#resultsOut .behavior-report')].filter(r => r.querySelector('.chartbox svg.graph') && r.querySelector('.dd-graphsave')); return { reps: reps.length, one: reps.every(r => r.querySelectorAll('.dd-graphsave [data-share]').length === 1), all: document.querySelectorAll('.dd-graphsave [data-share]').length, h: Math.min(...[...document.querySelectorAll('.dd-graphsave [data-share]')].map(b => b.getBoundingClientRect().height)), text: [...new Set([...document.querySelectorAll('.dd-graphsave [data-share]')].map(b => b.textContent))].join() }; });
  const a1 = await count();
  /* draw the graphs again: a display option changed */
  await p.evaluate(() => { const c = [...document.querySelectorAll('#results input[type=checkbox], input[type=checkbox]')].find(x => /Show value labels on points/.test((x.closest('label') || {}).textContent || '')); if (c) c.click(); }); await sleep(1200);
  const a2 = await count();
  ok('A every behavior\'s graph (' + a1.reps + ') has one "Share view" button, 44 px tall or more, and exactly one again after the graphs are drawn anew', a1.reps >= 3 && a1.one && a1.all === a1.reps && a1.h >= 44 && a1.text === 'Share view' && a2.reps === a1.reps && a2.one && a2.all === a2.reps, { a1, a2 });
  /* B */
  const want = await p.evaluate(() => { const b = document.querySelector('.dd-graphsave [data-share]'), rep = b.closest('.behavior-report'), svg = rep.querySelector('.chartbox svg.graph'); return { beh: rep.querySelector('.sec-title h3').textContent.trim(), label: svg.getAttribute('aria-label'), name: document.getElementById('m_client').value }; });
  await p.click('.dd-graphsave [data-share]'); await sleep(300);
  const b = await p.evaluate(() => { const o = document.getElementById('ddShare'); if (!o) return null; const r = o.getBoundingClientRect(), s = o.querySelector('svg').getBoundingClientRect(), t = o.querySelector('.ddsh-who'); return { role: o.getAttribute('role'), modal: o.getAttribute('aria-modal'), aria: o.getAttribute('aria-label'), covers: r.left <= 0 && r.top <= 0 && r.width >= innerWidth && r.height >= innerHeight, head: t.firstChild.textContent, sub: (t.querySelector('small') || {}).textContent || '', svgW: s.width / innerWidth, svgH: s.height, cap: (o.querySelector('.ddsh-cap') || {}).textContent || '', all: o.textContent, focus: document.activeElement.id, noScroll: getComputedStyle(document.body).overflow === 'hidden', top: document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest('#ddShare') !== null }; });
  const nameWords = want.name.replace(/^\s*SIMULATED\b\s*[–—-]?\s*/i, '').trim();
  ok('B it opens that graph alone: a dialog over the whole window headed "S.S." and the behavior, the graph at 80% of the width or more, the sentence that reads the graph under it; the name "' + nameWords + '" is nowhere on it; the focus is on Close and the page behind does not scroll',
    !!b && b.role === 'dialog' && b.modal === 'true' && b.covers && b.top && b.head === 'S.S.  ' + want.beh && b.aria === 'Share view: S.S. ' + want.beh && b.svgW >= 0.8 && b.svgH > 300 && b.cap.length > 30 && want.label.endsWith(b.cap) && nameWords.length > 5 && !b.all.includes(nameWords) && !/SIMULATED/.test(b.all) && b.focus === 'ddShareClose' && b.noScroll, { b, want });
  /* C */
  await p.keyboard.press('Tab'); const t1 = await p.evaluate(() => document.activeElement.id); await p.keyboard.press('Tab'); const t2 = await p.evaluate(() => document.activeElement.id);
  await p.keyboard.press('Escape'); await sleep(200);
  const c1 = await p.evaluate(() => ({ gone: !document.getElementById('ddShare'), back: document.activeElement.matches('.dd-graphsave [data-share]'), scroll: !document.body.classList.contains('dd-sharing') }));
  await p.evaluate(() => window.__ddShare.open(1)); await sleep(200); const second = await p.evaluate(() => document.querySelector('#ddShare .ddsh-who').firstChild.textContent); await p.click('#ddShareClose'); await sleep(200);
  const c2 = await p.evaluate(() => ({ gone: !document.getElementById('ddShare'), n: document.querySelectorAll('#ddShare').length }));
  ok('C Tab stays between its buttons; Escape closes it and the focus goes back to the button; the second graph opens under its own behavior; Close closes it; nothing of it is left in the page',
    ['ddShareFull', 'ddShareClose'].includes(t1) && ['ddShareFull', 'ddShareClose'].includes(t2) && c1.gone && c1.back && c1.scroll && second.startsWith('S.S.  ') && second !== b.head && c2.gone && c2.n === 0, { t1, t2, c1, second, c2 });
  /* D */
  const ini = async v => { await p.evaluate(x => { const el = document.getElementById('m_client'); el.value = x; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v); await sleep(200); await p.evaluate(() => window.__ddShare.open(0)); await sleep(200);
    const r = await p.evaluate(() => ({ head: document.querySelector('#ddShare .ddsh-who').firstChild.textContent, all: document.getElementById('ddShare').textContent })); await p.evaluate(() => window.__ddShare.close()); return r; };
  const d1 = await ini('Rivera, Ana Lucia'), d2 = await ini('');
  ok('D the initials: "Rivera, Ana Lucia" gives A.L.R. and the name is not shown; with no name the heading is the behavior alone', d1.head === 'A.L.R.  ' + want.beh && !/Rivera|Ana Lucia/.test(d1.all) && d2.head === want.beh, { d1: d1.head, d2: d2.head });
  /* E */
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); await sim(q); await q.evaluate(() => window.__ddShare.open(0)); await sleep(300);
  const e = await q.evaluate(() => { const o = document.getElementById('ddShare'), r = o.getBoundingClientRect(); return { w: r.width, iw: innerWidth, inside: [...o.querySelectorAll('button:not([hidden]),svg,p')].every(x => { const b = x.getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1; }), small: [...o.querySelectorAll('button:not([hidden])')].filter(x => x.getBoundingClientRect().height < 44).length }; }); await ph.close();
  const idx = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  ok('E at a phone\'s width (390) the view fits and its buttons are 44 px tall; the start screen\'s sidebar reads "Find a form, a video, a lesson"; no page error', e.w <= e.iw && e.inside && e.small === 0 && /<span>Find a form, a video, a lesson&hellip;<\/span>/.test(idx) && !errs.length, { e, errs });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
