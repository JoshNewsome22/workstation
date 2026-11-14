/* v26.23 (the BCBA's screen recording of 11/13: Form EA-1, step by step, in the workstation on the iPad; the page jumped
   and the bars came and went as it was scrolled). On a short page (one step-by-step sheet) a scroll down folds the
   workstation's bars; the form's frame grows taller; the form's Fit code took that for a resize, set the sheets to actual
   size for an instant, and the page lost its place and jumped to its top, where the bars come back.
   A  iPad landscape (touch), Form EA-1, step by step, sheet 2: after a finger scroll down the bars fold once and stay
      folded; the form is never thrown back to its top; the line being read is where it was once the bars are away;
   B  a change of the frame's HEIGHT alone does not touch the sheets' zoom (Fit does not run);
   C  a change of WIDTH still re-fits the sheets (Fit runs, the zoom is set again);
   D  every form's Fit block has the width test (49 forms).
   An empty form: no student, nothing typed. usage: node qa/v2623-bars-short-page-test.js   (WS_URL, WS_EDITION as in qa/lib.js) */
const { chromium, BASE, sleep } = require(__dirname + '/lib.js');
const fs = require('fs'), path = require('path');
const ED = process.env.WS_EDITION || 'NBH-Workstation';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d || '').slice(0, 900))); };
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1376, height: 1032 }, hasTouch: true, userAgent: IPAD, serviceWorkers: 'block' }); ctx.on('dialog', d => d.accept().catch(() => {}));
  const w = await ctx.newPage(); const errs = []; w.on('pageerror', e => errs.push(e.message));
  await w.goto(BASE + '/' + ED + '/index.html'); await sleep(900);
  await w.evaluate(() => { try { localStorage.removeItem('nbh.ws.pinbars'); } catch (e) {} });
  await w.evaluate(() => openForm('EA-1')); await w.waitForFunction(() => !!state.status['EA-1']); await sleep(1800);
  const fr = w.frames().find(f => f !== w.mainFrame() && /EA-1/.test(f.url()));
  const click = txt => fr.evaluate(t => { const el = [...document.querySelectorAll('button, [role=radio], label, a')].find(e => (e.textContent || '').trim() === t && e.offsetParent); if (el) { el.click(); return true; } return false; }, txt);
  const sbs = await click('Step by step'); await sleep(700); const nx = await click('Next'); await sleep(900);
  const info = () => w.evaluate(() => { const f = state.frames[state.cur], d = f.contentDocument.documentElement, cw = f.contentWindow; return { st: __wsBars.state(), y: Math.round(cw.scrollY), max: d.scrollHeight - cw.innerHeight, vh: cw.innerHeight }; });
  const s0 = await info();
  ok('A0 the form is open step by step on its second sheet, a short page (it scrolls, by less than a screen), with the bars in place', sbs && nx && s0.st === 'shown' && s0.max > 150 && s0.max < s0.vh, s0);
  /* the sheets' zoom, watched: every change of a sheet's zoom is counted, record by record (Fit sets it to nothing, then to the fit: two changes, even when the fit is the same) */
  await fr.evaluate(() => { window.__z = 0; const zo = v => { const m = /(?:^|;)\s*zoom:\s*([^;]+)/.exec(v || ''); return m ? m[1].trim() : ''; };
    document.querySelectorAll('main.sheet, .sheet:not(table)').forEach(s => { new MutationObserver(recs => { recs.forEach((r, k) => { const before = zo(r.oldValue), after = k + 1 < recs.length ? zo(recs[k + 1].oldValue) : (s.style.zoom || ''); if (before !== after) window.__z++; }); }).observe(s, { attributes: true, attributeFilter: ['style'], attributeOldValue: true }); }); });
  const zoom = () => fr.evaluate(() => { const s = document.querySelector('main.sheet, .sheet:not(table)'); return s ? (s.style.zoom || '1') : ''; });
  const z0 = await zoom();
  /* A a finger scroll down: 60 px every 50 ms for a second, then rest; then once more */
  const log = [];
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 20; i++) { await fr.evaluate(() => window.scrollBy(0, 60)); await sleep(50); if (i % 2 === 1) log.push(await info()); }
    for (let i = 0; i < 20; i++) { await sleep(100); log.push(await info()); }
  }
  const s1 = await info(); let prev = '', changes = []; log.forEach(r => { if (r.st !== prev) { prev = r.st; changes.push(r.st); } });
  const after = log.slice(4), minY = Math.min(...after.map(r => r.y));
  ok('A1 a scroll down folds the bars once, and they stay folded (no fold, return, fold)', s1.st === 'folded' && changes.join() === 'shown,folded', { changes, s1 });
  ok('A2 the form is never thrown back to its top: once scrolled, its scroll stays 100 px or more from the top (it fell to 0 before)', minY >= 100, { minY, ys: after.slice(0, 12).map(r => r.y) });
  ok('A3 with the bars away the frame is taller and the page is at its end, where the finger left it', s1.vh > s0.vh + 60 && s1.y === s1.max, { s0, s1 });
  const zA = await fr.evaluate(() => window.__z);
  ok('A4 the fold (a change of the frame\'s height) did not touch the sheets\' zoom: Fit did not run', zA === 0 && (await zoom()) === z0, { zA, z0 });
  /* B a change of height alone: the whole window shorter */
  await w.setViewportSize({ width: 1376, height: 900 }); await sleep(500);
  const zB = await fr.evaluate(() => window.__z);
  ok('B a shorter window (height alone) does not touch the sheets\' zoom', zB === 0 && (await zoom()) === z0, { zB });
  /* C a change of width: Fit runs */
  await w.setViewportSize({ width: 1032, height: 1376 }); await sleep(700);
  const zC = await fr.evaluate(() => window.__z), z1 = await zoom();
  ok('C a change of width re-fits the sheets (their zoom is set again)', zC > 0, { zC, z0, z1 });
  ok('no script error in the workstation', !errs.length, errs.slice(0, 3));
  await b.close();
  /* D the files */
  const dir = path.join(__dirname, '..', ED), forms = fs.readdirSync(dir).filter(f => /\.html$/.test(f)).map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')]).filter(([f, s]) => s.includes('<script id="nbh-fit-screen">'));
  const old = forms.filter(([f, s]) => !/if \(root\.clientWidth === fitW\) return;/.test(s) || /\{ clearTimeout\(t\); t = setTimeout\(fit, 150\); \}/.test(s)).map(x => x[0]);
  ok('D every form with the Fit block (' + forms.length + ') re-fits on a change of width only', forms.length >= 49 && !old.length, { n: forms.length, old: old.slice(0, 5) });
  console.log(bad ? 'RESULT: ' + bad + ' of ' + n + ' failed' : 'RESULT: all passed'); process.exit(bad ? 1 : 0);
})();
