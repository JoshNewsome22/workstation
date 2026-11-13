/* v26.08 Check yourself, on each video's page of the video library (videos.html), and its score in the Learning record.
   A  the questions, for every video with a step list: three or more numbered steps to put in order; every caption asked is
      shown under the step it is keyed to, is not that step's title, and does not name another step; at most four;
   B  on a video's page at an iPad's size: the panel, Start the check, the steps in an order that is not the video's, the
      arrows move a step and say where it went; with every step in place and every caption matched, the score is the whole,
      every row says "Right place", and the score is kept with what was watched (nbh.videos.v1, q) and nothing else is new;
   C  it will not score with a question unanswered; with wrong answers the score is lower, a wrong row names the step the video
      shows, a wrong caption names its step and offers "Play that moment"; the count of times goes up; "Last time" shows
      after the page is opened again;
   D  at a phone's width nothing is wider than the screen and every control is 44 px or more;
   E  in Learning: the video's row in a unit says "Checked N of M"; the record a learner sends carries the checks; the
      trainer's reading of a record keeps a well-formed check and drops a malformed one and a video it does not know;
   F  no page error anywhere.
   usage: node qa/v2608-videocheck-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), ED = process.env.WS_EDITION || 'NBH-Workstation', DIR = path.join(ROOT, ED);
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KEY = 'dro_resetting';
(async () => {
  const src = fs.readFileSync(path.join(DIR, 'videos.html'), 'utf8'), fn = src.slice(src.indexOf('function chkData('), src.indexOf('function chkShuffle('));
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('videos: ' + e));
  await p.goto(B + 'videos.html#video=' + KEY); await p.waitForSelector('#vlChkGo', { timeout: 30000 });
  /* A */
  const all = await p.evaluate(f => { (0, eval)(f.replace('function chkData', 'window.__chk=function')); const norm = x => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(), out = [];
    Object.keys(NBH_VIDEO_STEPS).forEach(k => { const x = NBH_VIDEO_STEPS[k], S = { steps: x.steps.map(s => ({ n: s[0], t: s[1], title: s[2], where: s[3] || '' })), caps: x.caps };
      [0, 1, 2].forEach(tr => { const d = window.__chk(S, tr), by = {}; d.steps.forEach(s => { by[s.n] = s; });
        const badq = d.qs.filter(q => !by[q.n] || !S.caps.some(c => c[0] === q.t && c[1] === q.cap && c[2] === q.n) || norm(q.cap) === norm(by[q.n].title) || d.steps.some(o => o.n !== q.n && norm(q.cap).indexOf(norm(o.title)) >= 0));
        out.push({ k, tr, steps: d.steps.length, sorted: d.steps.every((s, i) => !i || s.n > d.steps[i - 1].n), qs: d.qs.length, badq: badq.length, dup: new Set(d.qs.map(q => q.n)).size !== d.qs.length }); }); });
    return out; }, fn);
  const vids = new Set(all.map(x => x.k)).size, off = all.filter(x => x.steps < 3 || !x.sorted || x.qs > 4 || x.badq || x.dup), noq = all.filter(x => x.tr === 0 && x.qs === 0).map(x => x.k);
  ok('A the questions of all ' + vids + ' videos with a step list (three draws each): three or more steps in the video\'s order; each caption asked is shown under its step, is not its title and names no other step; at most four, no step twice; every video has at least one caption to ask',
    vids >= 44 && !off.length && !noq.length, { vids, off: off.slice(0, 4), noq });
  /* B */
  const steps = await p.evaluate(k => NBH_VIDEO_STEPS[k].steps.filter(s => s[0] >= 1).map(s => ({ n: s[0], title: s[2] })).sort((a, b) => a.n - b.n), KEY);
  const before = await p.evaluate(() => Object.keys(localStorage).sort());
  await p.click('#vlChkGo'); await p.waitForSelector('#vlChkOrd li');
  const ord = () => p.evaluate(() => [...document.querySelectorAll('#vlChkOrd li')].map(li => +li.dataset.n));
  const o0 = await ord(); const goHidden = await p.evaluate(() => getComputedStyle(document.getElementById('vlChkGo')).display === 'none');
  /* one move, and what the page says of it */
  await p.click('#vlChkOrd .vl-chkdn[data-i="0"]'); const o1 = await ord(), said = await p.textContent('#vlChkRes');
  /* put every step in place with the arrows */
  for (let i = 0; i < steps.length; i++) { let cur = await ord(), j = cur.indexOf(steps[i].n); while (j > i) { await p.click('#vlChkOrd .vl-chkup[data-i="' + j + '"]'); j--; } }
  const o2 = await ord();
  const qs = await p.evaluate(() => [...document.querySelectorAll('.vl-chkq')].map(f => ({ cap: f.querySelector('legend').textContent, opts: [...f.querySelectorAll('input')].map(x => +x.value) })));
  const key = await p.evaluate(([k, caps]) => caps.map(c => { const m = /^The video says: “(.*)”$/.exec(c); const hit = NBH_VIDEO_STEPS[k].caps.find(x => x[1] === (m && m[1])); return hit ? hit[2] : null; }), [KEY, qs.map(q => q.cap)]);
  for (let i = 0; i < qs.length; i++) await p.check('.vl-chkq[data-i="' + i + '"] input[value="' + key[i] + '"]');
  await p.click('#vlChkDone'); await sleep(200);
  const res = await p.textContent('#vlChkRes'), marks = await p.evaluate(() => [...document.querySelectorAll('#vlChkOrd li')].map(li => li.className + ':' + li.querySelector('.vl-chkmk').textContent));
  const st = await p.evaluate(k => JSON.parse(localStorage.getItem('nbh.videos.v1')).items[k], KEY), after = await p.evaluate(() => Object.keys(localStorage).sort());
  const tot = steps.length + qs.length;
  ok('B at 1180 by 820: Start the check gives the ' + steps.length + ' steps out of order and hides the button; an arrow moves a step and the page says its new place; with every step in place and the ' + qs.length + ' captions matched the score is ' + tot + ' of ' + tot + ', every row says "Right place", and the score is kept with what was watched, in no new place',
    goHidden && o0.join() !== steps.map(s => s.n).join() && o0.slice().sort((a, b) => a - b).join() === steps.map(s => s.n).join() && o1[1] === o0[0] && o1[0] === o0[1] && /now in place 2 of/.test(said) && o2.join() === steps.map(s => s.n).join() &&
    qs.length >= 1 && qs.length <= 4 && key.every(x => x >= 1) && res.startsWith(tot + ' of ' + tot + '.') && /Every answer is as the video shows it/.test(res) && marks.every(m => m === 'ok:Right place') &&
    st && st.q && st.q.s === tot && st.q.of === tot && st.q.n === 1 && after.join() === [...new Set(before.concat(['nbh.videos.v1']))].sort().join(), { goHidden, o0, o1, said, o2, key, res, marks: marks.slice(0, 2), st, after, before });
  /* C */
  await p.click('#vlChkAgain'); await p.waitForSelector('#vlChkDone'); const o3 = await ord();
  await p.click('#vlChkDone'); const need = await p.textContent('#vlChkRes');
  const qs2 = await p.evaluate(() => [...document.querySelectorAll('.vl-chkq')].map(f => ({ cap: f.querySelector('legend').textContent, opts: [...f.querySelectorAll('input')].map(x => +x.value) })));
  const key2 = await p.evaluate(([k, caps]) => caps.map(c => { const m = /^The video says: “(.*)”$/.exec(c); const hit = NBH_VIDEO_STEPS[k].caps.find(x => x[1] === (m && m[1])); return hit ? hit[2] : null; }), [KEY, qs2.map(q => q.cap)]);
  for (let i = 0; i < qs2.length; i++) await p.check('.vl-chkq[data-i="' + i + '"] input[value="' + qs2[i].opts.find(v => v !== key2[i]) + '"]');
  await p.click('#vlChkDone'); await sleep(200);
  const res2 = await p.textContent('#vlChkRes'), wrongRow = await p.evaluate(() => { const li = document.querySelector('#vlChkOrd li.no'); return li ? li.dataset.n + '|' + li.querySelector('.vl-chkmk').textContent : ''; });
  const fb = await p.evaluate(() => [...document.querySelectorAll('.vl-chkq')].map(f => ({ cls: f.className, t: f.querySelector('.vl-chkfb').textContent, play: !!f.querySelector('.vl-chkfb button[data-play]'), dis: [...f.querySelectorAll('input')].every(x => x.disabled) })));
  const st2 = await p.evaluate(k => JSON.parse(localStorage.getItem('nbh.videos.v1')).items[k], KEY);
  const rightPlaces = o3.filter((x, i) => x === steps[i].n).length;
  await p.reload(); await p.waitForSelector('#vlChkGo'); const lastLine = await p.textContent('#vlChkLast'), goText = await p.textContent('#vlChkGo');
  ok('C it will not score with a question unanswered; with every caption wrong and the steps as dealt the score is ' + rightPlaces + ' of ' + tot + '; a wrong row names the step the video shows; each wrong caption names its step and offers Play that moment; it is the second time; "Last time" shows when the page is opened again',
    /Answer every question first: \d+ left\./.test(need) && o3.join() !== steps.map(s => s.n).join() && res2.startsWith(rightPlaces + ' of ' + tot + '.') && /^\d+\|The video shows this as step \d+$/.test(wrongRow) && wrongRow.split('|')[0] === wrongRow.replace(/.*step /, '') &&
    fb.length === qs2.length && fb.every((f, i) => /no/.test(f.cls) && f.t.startsWith('It is step ' + key2[i] + ': ') && f.play && f.dis) && st2.q.s === rightPlaces && st2.q.n === 2 && lastLine.startsWith('Last time: ' + rightPlaces + ' of ' + tot + ', on ') && goText === 'Check again', { need, o3, res2, wrongRow, fb: fb.slice(0, 2), st2, lastLine, goText });
  /* D */
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); await q.goto(B + 'videos.html#video=' + KEY); await q.waitForSelector('#vlChkGo'); await q.click('#vlChkGo'); await q.waitForSelector('#vlChkOrd li');
  const pw = await q.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth, small: [...document.querySelectorAll('#vlChk button:not([hidden]), #vlChk label')].filter(b => { const r = b.getBoundingClientRect(); return r.height && r.height < 44; }).length }));
  ok('D at a phone\'s width (390) the check is not wider than the screen and every button and choice is 44 px tall or more', pw.w <= pw.iw && pw.small === 0, pw); await ph.close();
  /* E */
  const LJ = fs.readFileSync(path.join(DIR, 'nbh-learn.js'), 'utf8'), LEARN = new Function('window', LJ + ';return window.NBH_LEARN;')({});
  let unit = ''; LEARN.rbt.sections.forEach(sc => sc.units.forEach(u => { if (!unit && (u.v || []).includes(KEY)) unit = u.id; }));
  const l = await ctx.newPage(); l.on('pageerror', e => errs.push('learn: ' + e)); await l.goto(B + 'learn.html#rbt/' + unit + '/watch'); await l.waitForSelector('.ln-vid', { timeout: 20000 });
  const pill = await l.evaluate(k => { const b = document.querySelector('.ln-vid [data-open="videos.html#video=' + k + '"]'), li = b && b.closest('.ln-vid'); return li ? [...li.querySelectorAll('.ln-pill')].map(x => x.textContent + '|' + x.className) : null; }, KEY);
  await l.evaluate(() => { location.hash = '#record'; }); await l.waitForSelector('#lnSend'); await l.fill('#lnName', 'Marisol Vance'); await l.fill('#lnBacb', 'RBT-26-0001');
  const [dn] = await Promise.all([l.waitForEvent('download'), l.click('#lnSend')]); const rec = JSON.parse(fs.readFileSync(await dn.path(), 'utf8'));
  const dirty = JSON.parse(JSON.stringify(rec)); dirty.vc.no_such_video = { s: 3, of: 3, at: '2026-11-13', n: 1 }; dirty.vc.ncr_attention = { s: 'x', of: 0 }; dirty.vc.fct_thinning_mult = { s: 99, of: 8, at: 'tomorrow', n: 1 };
  const recPath = path.join(require('os').tmpdir(), 'nbh-vc-rec-' + process.pid + '.json'); fs.writeFileSync(recPath, JSON.stringify(dirty));
  await l.evaluate(() => { location.hash = '#trainer'; }); await l.waitForSelector('#tName'); await l.fill('#tName', 'Dr. Imogen Hartwell'); await l.fill('#tCert', '1-00-00000');
  await l.fill('#nName', 'Marisol Vance'); await l.fill('#nBacb', 'RBT-26-0001'); await l.fill('#nStart', '2026-11-09'); await l.click('#nAdd'); await sleep(200);
  const tid = await l.$eval('#tList [data-tid]', c => c.dataset.tid);
  const [fc] = await Promise.all([l.waitForEvent('filechooser'), l.click('[data-rec="' + tid + '"]')]); await fc.setFiles(recPath); await sleep(400); const took = await l.textContent('#tKeepNote');
  await l.evaluate(t => { location.hash = '#trainer/' + t; }, tid); await sleep(400);
  const rows = await l.evaluate(() => { const t = document.getElementById('rVc'); return t ? [...t.tBodies[0].rows].map(r => [...r.cells].map(c => c.textContent)) : null; });
  fs.unlinkSync(recPath);
  const title = await l.evaluate(k => (window.NBH_VIDEOS.list.find(v => v.key === k) || {}).title, KEY), title2 = await l.evaluate(() => (window.NBH_VIDEOS.list.find(v => v.key === 'fct_thinning_mult') || {}).title);
  ok('E in Learning: the video\'s row in unit ' + unit + ' says "Checked ' + rightPlaces + ' of ' + tot + '"; the record a learner sends carries the check (right, out of, day, times); the trainer\'s page lists a well-formed check, caps a score at its total, and leaves out a malformed one and a video it does not know',
    !!unit && pill && pill.some(x => x.startsWith('Checked ' + rightPlaces + ' of ' + tot + '|')) && rec.vc && rec.vc[KEY] && rec.vc[KEY].s === rightPlaces && rec.vc[KEY].of === tot && rec.vc[KEY].n === 2 && /^\d{4}-\d\d-\d\d$/.test(rec.vc[KEY].at) && Object.keys(rec.vc).length === 1 &&
    rows && rows.length === 2 && rows.some(r => r[0] === title && r[1] === rightPlaces + ' of ' + tot && r[2] === '2') && rows.some(r => r[0] === title2 && r[1] === '8 of 8' && r[3] === ''), { unit, pill, vc: rec.vc, took, rows });
  ok('F no page error in the library, on the phone or in Learning', !errs.length, errs);
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
