/* v22.24 the safety copy after Open case, when a form is slow to answer. Open case starts a new copy that holds nothing yet;
   if the first edit's copy asked the form for its work and the form did not answer within its 2.5 s (a busy iPad), there
   was nothing to write, and the next try came only at Autosave's next turn, 20 s later. Now an edited form that did not
   answer is asked again 1.5 s later (up to three times), so the copy holds the edit within seconds. Seen in
   qa/autosave-test.js ("names", about one run in three under load). Simulated students only.
   usage: node qa/v2224-autosave-retry-test.js */
const L = require(__dirname + '/lib.js'), { sleep, fs, path } = L;
const OUT = path.join(__dirname, 'out', 'v2224'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined && !c ? '  ' + JSON.stringify(i).slice(0, 600) : '')); if (!c) fails++; };
const DM = L.forms().find(f => f.id === 'DM-1');
const type = (fr, t) => fr.evaluate(t => { const el = [...document.querySelectorAll('textarea')].find(e => e.offsetParent !== null);
  el.focus(); el.value = (el.value || '') + t; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, t);
const holds = (page, mark) => page.evaluate(async m => { for (const r of await nbhCopies.list()) { const u = await nbhCopies.unpack(r);
  if (Object.values(u.forms).some(f => ((f.snap.own || '') + JSON.stringify(f.snap.data || {})).includes(m))) return r.student; } return null; }, mark);
(async () => {
  const br = await L.chromium.launch(); const errs = [];
  try {
    const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, acceptDownloads: true, serviceWorkers: 'block' });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
    await page.goto(L.BASE + '/NBH-Workstation/index.html'); await sleep(1300);
    await page.evaluate(() => { wsUI.confirm = async () => true; wsUI.alert = async () => {}; const i = $('#pClient'); i.value = 'Mateo Rivera'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.evaluate(() => openForm('DM-1')); await page.waitForFunction(() => !!state.status['DM-1'], null, { timeout: 30000 }); await sleep(1200);
    const fr = () => page.frames().find(f => f.url().includes(encodeURI(DM.file)) || f.url().includes(DM.file));
    await type(fr(), ' CASE-FILE-TEXT'); await sleep(1500);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#saveCase')]);
    const fp = path.join(OUT, 'case.json'); await dl.saveAs(fp);
    /* the next student's case, opened over it */
    const d = JSON.parse(fs.readFileSync(fp, 'utf8')); d.packet.client = 'SIMULATED – Sample Student'; d.packet.sid = 'SIM-0002';
    await page.evaluate(t => openCaseText(t, null, { asked: true }), JSON.stringify(d)); await sleep(9000);
    /* the form is slow: the next request for its work goes unanswered (as when it does not answer within 2.5 s) */
    await page.evaluate(() => { const g = window.grab; let n = 0; window.__missed = 0;
      window.grab = function (id, verb) { if (verb === 'snapshot' && n++ === 0) { window.__missed++; return new Promise(r => setTimeout(() => r(null), 2500)); } return g.apply(this, arguments); }; });
    await type(fr(), ' AFTER-OPEN'); await sleep(300);
    const t0 = Date.now(); await page.evaluate(() => autoSave(true));
    let who = null; while (!who && Date.now() - t0 < 9000) { await sleep(400); who = await holds(page, 'AFTER-OPEN'); }
    const secs = Math.round((Date.now() - t0) / 100) / 10, missed = await page.evaluate(() => window.__missed);
    ok('1 the form did not answer the first time (' + missed + ' request unanswered), and the copy holds the edit ' + secs + ' s later, under the opened case\'s student', missed === 1 && who === 'SIMULATED – Sample Student' && secs <= 7, { who, secs, missed });
    const st = await page.evaluate(() => ({ retry: state.auto.retry || 0, sig: state.autoSig === caseSig(), busy: state.auto.busy }));
    ok('2 once written, Autosave stops asking again and the case\'s state is the copy\'s', st.retry === 0 && st.sig && !st.busy, st);
    ok('3 no page errors', !errs.length, errs.slice(0, 3));
  } catch (e) { ok('crashed', false, String(e.stack || e)); }
  await br.close(); console.log(fails ? 'RESULT: ' + fails + ' failed' : 'RESULT: all passed'); process.exit(fails ? 1 : 0);
})();
