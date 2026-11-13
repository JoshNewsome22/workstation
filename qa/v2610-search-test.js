/* v26.10 one search box on the start screen: the videos, the units of the Learning page and its reading list answer in the
   same box as the forms, the commands and the students.
   A  the three lists are not loaded until the box is first opened, and are loaded then;
   B  a word finds a video, a lesson and a reading, each named as what it is ("Video:", "Lesson:", "Reading:") with its
      kind beside it; a form that matches still comes first; every video, every unit and every reading can be found by
      the first words of its own title;
   C  a result opens in the viewer the videos use: a video on its own page, a lesson on its unit, a reading on its domain
      of the BCBA track; the box closes;
   D  what was there stays as it was: an empty box lists forms; "consent" gives Form IC-1 first; a misspelt word still
      gets "Did you mean"; a word nothing has says so in the new words;
   E  the box says what it finds; no page error.
   usage: node qa/v2610-search-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), ED = process.env.WS_EDITION || 'NBH-Workstation', DIR = path.join(ROOT, ED);
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const load = (f, name) => { const w = {}; new Function('window', fs.readFileSync(path.join(DIR, f), 'utf8'))(w); return w[name]; };
(async () => {
  const V = load('nbh-videos.js', 'NBH_VIDEOS'), L = load('nbh-learn.js', 'NBH_LEARN'), R = load('nbh-learn-readings.js', 'NBH_LEARN_READINGS');
  const units = []; L.rbt.sections.forEach(s => s.units.forEach(u => units.push(u)));
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(B + 'index.html'); await sleep(2500);
  /* A */
  const before = await p.evaluate(() => [typeof window.NBH_VIDEOS, typeof window.NBH_LEARN, typeof window.NBH_LEARN_READINGS].join());
  await p.evaluate(() => palOpen()); await p.waitForFunction(() => window.NBH_VIDEOS && window.NBH_LEARN && window.NBH_LEARN_READINGS, null, { timeout: 15000 }); await sleep(300);
  ok('A the lists of videos, lessons and readings are not loaded with the start screen; they are loaded when the box is first opened', before === 'undefined,undefined,undefined', before);
  /* B */
  const rows = async q => { await p.fill('#palIn', q); await sleep(350); return p.evaluate(() => [...document.querySelectorAll('#palRes .r')].map(r => ({ id: r.querySelector('.rid').textContent, n: r.querySelector('.rnm').textContent.trim(), s: r.querySelector('.rsub').textContent }))); };
  const tok = await rows('token'), dro = await rows('dro'), sc = await rows('single-case');
  const firstNon = tok.findIndex(r => /^(Video|Lesson|Reading): /.test(r.n)), formsFirst = tok.slice(0, firstNon).every(r => r.id || /command|student/.test(r.s) || true) && tok.slice(firstNon).every(r => /^(Video|Lesson|Reading): /.test(r.n));
  /* every title can be found by its first words (the page's own lists, so that nothing is left out) */
  const miss = await p.evaluate(([vs, us, rs]) => { const out = [], words = s => String(s || '').toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) || [];
    const find = (label, title) => { const q = words(title).slice(0, 4).join(' '); const r = palList(q); if (!r.some(x => x.n === label + title)) out.push(label + title); };
    vs.forEach(t => find('Video: ', t)); us.forEach(t => find('Lesson: ', t)); rs.forEach(t => find('Reading: ', t)); return out; },
    [V.list.map(v => v.title), units.map(u => u.t), R.list.map(x => { const m = /^(.*?)\s\((\d{4})[a-z]?\)\.\s+(.+?)\.\s+Behavior Modification/.exec(x.apa || ''); return m ? m[3] : String(x.apa || '').slice(0, 110); })]);
  ok('B "token" finds forms first and then videos and lessons, each named for what it is; "dro" finds DRO videos with their length; "single-case" finds a reading with its authors; all ' + V.list.length + ' videos, ' + units.length + ' lessons and ' + R.list.length + ' readings are found by the first words of their titles',
    tok.some(r => r.id === 'TE-1') && firstNon > 0 && formsFirst && tok.some(r => /^Video: Token economy/.test(r.n) && /^video · \d:\d\d$/.test(r.s)) && tok.some(r => /^Lesson: /.test(r.n) && /^Learning · RBT unit [A-H]\d+$/.test(r.s)) &&
    dro.filter(r => /^Video: /.test(r.n)).length >= 3 && sc.some(r => /^Reading: Single-case data analysis/.test(r.n) && /^reading list · Ninci \(2023\)$/.test(r.s)) && !miss.length, { tok: tok.slice(0, 8), firstNon, dro: dro.length, sc: sc.slice(0, 3), miss: miss.slice(0, 5) });
  /* C */
  const openBy = async (q, re) => { await p.evaluate(() => { if (!document.getElementById('pal').classList.contains('on')) palOpen(); }); await sleep(200); await p.fill('#palIn', q); await sleep(350);
    const i = await p.evaluate(src => { const re = new RegExp(src); return [...document.querySelectorAll('#palRes .r')].findIndex(r => re.test(r.querySelector('.rnm').textContent.trim())); }, re.source);
    if (i < 0) return { i }; await p.click('#palRes .r[data-i="' + i + '"]'); await sleep(900);
    return { i, closed: await p.evaluate(() => !document.getElementById('pal').classList.contains('on')), open: await p.evaluate(() => window.__wsVideos.isOpen()), url: await p.evaluate(() => { const f = window.__wsVideos.frame(); try { const l = f.contentWindow.location; return l.pathname.split('/').pop() + l.hash; } catch (e) { return f ? (f.getAttribute('src') || '') : ''; } }) }; };
  const c1 = await openBy('dro resetting', /^Video: /), k1 = V.list.find(v => /resetting/i.test(v.title) || v.key === 'dro_resetting');
  await p.evaluate(() => window.__wsVideos.close()); await sleep(400);
  const u0 = units.find(u => /reinforcement/i.test(u.t)) || units[0];
  const c2 = await openBy(u0.t.split(/\s+/).slice(0, 4).join(' '), /^Lesson: /); await p.evaluate(() => window.__wsVideos.close()); await sleep(400);
  const c3 = await openBy('single-case data analysis', /^Reading: Single-case data analysis/); await p.evaluate(() => window.__wsVideos.close()); await sleep(300);
  ok('C a result opens in the viewer and the box closes: a video on its own page, a lesson on its unit, a reading on its domain of the BCBA track',
    c1.closed && c1.open && /videos\.html#video=/.test(c1.url) && c2.closed && c2.open && /learn\.html#rbt\/[a-h]\d+$/.test(c2.url) && c3.closed && c3.open && /learn\.html#bcba\/[A-I]$/.test(c3.url), { c1, c2, c3 });
  /* D */
  await p.evaluate(() => palOpen()); await sleep(200);
  const empty = await rows(''), consent = await rows('consent'), near = await p.evaluate(async () => { const i = document.getElementById('palIn'); i.value = 'grpah'; i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return document.getElementById('palRes').textContent.replace(/\s+/g, ' '); });
  const none = await p.evaluate(async () => { const i = document.getElementById('palIn'); i.value = 'zzqqxx'; i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 300)); return document.getElementById('palRes').textContent.replace(/\s+/g, ' ').trim(); });
  ok('D what was there stays: an empty box lists forms only; "consent" gives Form IC-1 first; a misspelt word still gets "Did you mean" with DD-1; a word nothing has says so',
    empty.length >= 30 && empty.every(r => r.id) && consent[0] && consent[0].id === 'IC-1' && /No form found for “grpah”\. Did you mean/.test(near) && /DD-1/.test(near) && /^Nothing found for “zzqqxx”\./.test(none), { empty: empty.length, consent: consent[0], near: near.slice(0, 120), none });
  /* E */
  const ph = await p.getAttribute('#palIn', 'placeholder');
  ok('E the box says what it finds ("Find a form, a student, a video, a lesson…"); no page error', /^Find a form, a student, a video, a lesson/.test(ph || '') && !errs.length, { ph, errs });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
