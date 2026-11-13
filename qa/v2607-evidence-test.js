/* v26.07 the evidence line in Form TD-1's protocol bank.
   A  the bank: every card carries three letters (ev: design c n u t, students 0 to 3, setting s e a n t); they are the letters
      tools/banks/grade-evidence.py gives today (the tool's own check); a card marked "not tested" is so in all three places;
      the corrections file names only cards of the bank;
   B  the reading, on cards whose note states the evidence in plain words (the test carries its own expectations): one adult
      in a hospital, three students in a school with a reversal, a tutorial with no data, six preschoolers, a case example;
   C  in TD-1 at an iPad's size: every row of the list says "Evidence N of 8" or "Not tested", and N is the sum the letters
      give; the open card shows the line with its four parts and their points, and "How the points are counted";
   D  the order: "As the bank lists them" leaves the list as it was; "Most evidence first" orders each group by the points,
      highest first, ties in the bank's order, and the count line says so; with a plan function set, the cards for that
      function still come before the others; back to the bank's order restores it;
   E  a card described but not tested says so and shows no points; the control is 44 px tall; nothing of it is saved in the
      form's data; no page error.
   usage: node qa/v2607-evidence-test.js   (WS_URL, WS_ROOT as in the other tests; the workstation edition only) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), DIR = path.join(ROOT, 'NBH-Workstation');
const URL = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/NBH-Workstation/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const src = fs.readFileSync(path.join(DIR, 'nbh-td1-bank.js'), 'utf8'), B = new Function(src + ';return TD1_BANK;')(), P = B.protocols, by = {}; P.forEach(p => { by[p.id] = p; });
const pts = p => { const e = p.ev, k = (p.src || []).length, ks = k <= 1 ? 0 : k === 2 ? 1 : 2; if (e[0] === 't') return ks; return ({ c: 2, n: 1 }[e[0]] || 0) + ({ 3: 2, 2: 1 }[e[1]] || 0) + ({ s: 2, e: 1, n: 1 }[e[2]] || 0) + ks; };
(async () => {
  /* A */
  const form = P.filter(p => !/^[cnut][0-3][seant]$/.test(p.ev || '')), half = P.filter(p => (p.ev || '')[0] === 't' ? p.ev !== 't0t' : (p.ev || '')[2] === 't');
  let tool = { status: 1, out: '' }; try { tool.out = cp.execFileSync('python3', [path.join(ROOT, 'tools', 'banks', 'grade-evidence.py'), ROOT, '--check'], { encoding: 'utf8' }); tool.status = 0; } catch (e) { tool.out = String(e.stdout || e); }
  const over = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'banks', 'evidence-overrides.json'), 'utf8')).cards;
  ok('A the bank: all ' + P.length + ' cards carry the three letters; they are the ones the tool gives today; "not tested" is whole; the corrections name only cards of the bank',
    !form.length && !half.length && tool.status === 0 && Object.keys(over).every(k => by[k] && /^[cnut][0-3][seant]$/.test(over[k])), { form: form.slice(0, 5).map(p => p.id + ':' + p.ev), half: half.slice(0, 5).map(p => p.id + ':' + p.ev), tool: tool.out.slice(0, 300) });
  /* B */
  const want = { 'dra-on-topic-speech-attention': 'c1a', 'nce-fixed-time-breaks-notes': 'c2s', 'curr-same-as-frame': 't0t', 'fct-requests-waiting-new-teachers': /^.3.$/, 'df-reduce-then-raise-work': /^u/, 'mand_net-incidental-position-words': 'c2s', 'ncr-dense-to-thin-ext': 'c2a', 'curr-letter-identity-matching-consequences': /^.1e$/, 'peer-interteaching-vs-lecture': 'c3a' };
  const off = Object.keys(want).filter(k => !by[k] || !(want[k] instanceof RegExp ? want[k].test(by[k].ev) : by[k].ev === want[k]));
  ok('B the reading on nine cards whose note says it plainly (one adult in a hospital with a reversal; two students in a class with a reversal; a tutorial; six preschoolers; an uncontrolled case; three boys at a day program; three adults; one child at home; 31 college students)', !off.length, off.map(k => k + ':' + (by[k] && by[k].ev)));
  /* C to E in the form */
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL + fs.readdirSync(DIR).find(f => f.startsWith('TD-1_')));
  await p.waitForFunction(() => window.__tdBank && document.getElementById('tdBankHost') && document.getElementById('tdBankHost').shadowRoot && document.getElementById('tdBankHost').shadowRoot.querySelector('.list .it'), null, { timeout: 60000 });
  const R = 'document.getElementById("tdBankHost").shadowRoot';
  await p.evaluate(() => { const b = document.querySelector('#viewSeg button[data-view="build"]'); if (b) b.click(); }); await sleep(300);
  await p.evaluate(R + '.querySelector("details.pan").open=true');
  const setSel = (cls, v) => p.evaluate(([c, x]) => { const s = document.getElementById('tdBankHost').shadowRoot.querySelector(c); s.value = x; s.dispatchEvent(new Event('change', { bubbles: true })); }, [cls, v]);
  await setSel('.fn', ''); await setSel('.age', ''); await sleep(200);
  const rows = () => p.evaluate(() => [...document.getElementById('tdBankHost').shadowRoot.querySelectorAll('.list .grp')].map(g => [g.getAttribute('aria-label'), [...g.querySelectorAll('.it')].map(b => [b.dataset.id, b.querySelector('.m').textContent])]));
  const r0 = await rows(), flat0 = [].concat(...r0.map(g => g[1]));
  const wrongTag = flat0.filter(([id, m]) => { const q = by[id]; return q.ev[0] === 't' ? !/ · Not tested$/.test(m) : !m.endsWith(' · Evidence ' + pts(q) + ' of 8'); });
  await p.evaluate(() => window.__tdBank.show('nce-fixed-time-breaks-notes')); await sleep(200);
  const line = await p.evaluate(() => { const d = document.getElementById('tdBankHost').shadowRoot.querySelector('.detail'), e = d.querySelector('.evl'); return e ? { t: e.querySelector('p').textContent, how: e.querySelector('.evhow summary').textContent, howText: e.querySelector('.evhow p').textContent.length, before: !!(d.querySelector('.dm') && d.querySelector('.dm').nextElementSibling === e) } : null; });
  ok('C at 1180 by 820: all ' + flat0.length + ' rows say "Evidence N of 8" (N the sum of the letters) or "Not tested"; the open card (two students, a class, a reversal) shows 5 of 8 with the four parts and their points, under the card\'s first line, and "How the points are counted"',
    flat0.length === P.length && !wrongTag.length && !!line && line.t === 'Evidence on this card: 5 of 8 points. A comparison that shows the effect (2), 2 to 5 students (1), in a school (2), one study (0).' && line.how === 'How the points are counted' && line.howText > 300 && line.before, { rows: flat0.length, wrongTag: wrongTag.slice(0, 3), line });
  /* D */
  const cnt = () => p.evaluate(() => document.getElementById('tdBankHost').shadowRoot.querySelector('.cnt').textContent);
  const c0 = await cnt(); await setSel('.ord', 'ev'); await sleep(250); const r1 = await rows(), c1 = await cnt();
  const sorted = r1.every((g, i) => { const ids = g[1].map(x => x[0]), base = r0[i][1].map(x => x[0]); const exp = base.map((id, k) => [id, pts(by[id]) - (by[id].ev[0] === 't' ? 0 : 0), k]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0]); return g[0] === r0[i][0] && ids.join() === exp.join(); });
  await setSel('.fn', 'attention'); await sleep(250); const r2 = await rows(), flat2 = [].concat(...r2.map(g => g[1].map(x => x[0])));
  const fnOk = flat2.length > 100 && flat2.every(id => !by[id].fn || !by[id].fn.length || by[id].fn.includes('attention'));
  await setSel('.fn', ''); await setSel('.ord', ''); await sleep(250); const r3 = await rows();
  ok('D the order: the bank\'s own order is unchanged by default; "Most evidence first" orders every group by the points, ties in the bank\'s order, and the count line says so; a function filter still holds under it; the bank\'s order comes back',
    !/most evidence/.test(c0) && sorted && /the cards with the most evidence first/.test(c1) && fnOk && JSON.stringify(r3) === JSON.stringify(r0), { c0, c1, sorted, fnOk, back: JSON.stringify(r3) === JSON.stringify(r0) });
  /* E */
  await p.evaluate(() => window.__tdBank.show('curr-same-as-frame')); await sleep(200);
  const nt = await p.evaluate(() => { const R = document.getElementById('tdBankHost').shadowRoot, e = R.querySelector('.detail .evl p'); const s = R.querySelector('.ord'), l = R.querySelector('.ordl'); return { t: e && e.textContent, h: s.getBoundingClientRect().height, lab: l.textContent.trim().slice(0, 17), wide: document.documentElement.scrollWidth <= innerWidth }; });
  const saved = await p.evaluate(() => { try { return JSON.stringify(typeof collect === 'function' ? collect() : {}); } catch (e) { return 'x' + e; } });
  ok('E a card described but not tested says so and shows no points; the order control is 44 px tall and labeled; nothing of it is in the form\'s saved data; the page is not wider than the screen; no page error',
    nt.t === 'Evidence on this card: described, not tested. The source reports no data for this procedure.' && nt.h >= 44 && nt.lab === 'Order of the list' && nt.wide && !/"ord"|ordBy|evidence first/i.test(saved) && !errs.length, { nt, errs, saved: saved.slice(0, 120) });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
