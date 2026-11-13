/* v26.14 Read aloud in the guide: an option that reads the question, its choices and each step to you as you go.
   What the page asks the device to say is caught here (speechSynthesis.speak and cancel are watched); no sound is made
   or needed.
   A  off at first: the guide's screens have "Read aloud", not pressed, 44 px tall; "Say it again" is not shown; going
      through a question says nothing;
   B  turned on at a question, it reads that question at once (the question, its help, "The choices are" and each
      choice) and the choice is kept on the device; the next question is read when it comes, and what was being read is
      stopped first; "Say it again" reads it again;
   C  the list of steps is read in short (how many, and the first); Start reads step 1 (its number, name, form and
      reason); "Done: next step" reads the next; a form opening or the strip drawn anew does not read it twice; the
      strip's own "Read aloud" shows it is on and its "Say it again" reads the step; the first screen reads its 13 choices;
   D  turned off in the strip, the reading stops, nothing more is read, and the dialog's button shows off;
   E  after the page is opened again with Read aloud on and a guide in hand, nothing is read until a step changes; the
      strip shows it on; the next step is read;
   F  a device with no speech: no Read aloud button anywhere, and the guide works as before;
   G  at a phone's width the strip with its two more links stays within 150 px and the screen's width; no page error.
   usage: node qa/v2614-guide-voice-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const ED = process.env.WS_EDITION || 'NBH-Workstation';
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1400))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* the watch: every text given to speak (the silent one that opens speech on an iPad is left out), and every cancel */
const WATCH = () => { if (window.top !== window) return; window.__said = []; try { const ss = window.speechSynthesis; if (!ss) return; const sp = ss.speak.bind(ss), ca = ss.cancel.bind(ss);
  ss.speak = u => { if (u && u.volume !== 0 && String(u.text).trim()) window.__said.push({ t: u.text, lang: u.lang }); else if (u) window.__said.push({ prime: 1 }); try { ca(); } catch (e) {} };
  ss.cancel = () => { window.__said.push({ cancel: 1 }); try { ca(); } catch (e) {} }; } catch (e) {} };
(async () => {
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true }); await ctx.addInitScript(WATCH);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(B + 'index.html'); await sleep(3000);
  const said = () => p.evaluate(() => window.__said.filter(x => x.t).map(x => x.t)), log = () => p.evaluate(() => window.__said.map(x => x.t ? 'S' : x.cancel ? 'c' : 'p').join(''));
  const ans = async v => { await p.click('#dlgBody .gd [data-gd="ans"][data-v="' + v + '"]'); await sleep(400); };
  const vb = () => p.evaluate(() => { const b = document.querySelector('#dlgBody .gd [data-gd="voice"]'), a = document.querySelector('#dlgBody .gd [data-gd="again"]'); return b ? { pressed: b.getAttribute('aria-pressed'), h: b.getBoundingClientRect().height, name: b.textContent.trim(), again: !!a && !a.hidden && a.offsetParent !== null } : null; });
  /* A */
  await p.click('#gdStart [data-gdopen="why"]'); await sleep(500); const a1 = await vb(); await ans('yes'); const a2 = await said(), a3 = await p.evaluate(() => document.activeElement.dataset.gd);
  ok('A off at first: "Read aloud" is on the guide\'s screen, not pressed, 44 px tall; "Say it again" is not shown; a question answered says nothing; the focus is on the first choice, not on the button',
    !!a1 && a1.pressed === 'false' && a1.h >= 44 && a1.name === 'Read aloud' && !a1.again && a2.length === 0 && a3 === 'ans', { a1, a2, a3 });
  /* B */
  await p.click('#dlgBody .gd [data-gd="voice"]'); await sleep(300); const b1 = await said(), b1v = await vb(), pref = await p.evaluate(() => localStorage.getItem('nbh.guide.voice')), lang = await p.evaluate(() => (window.__said.find(x => x.t) || {}).lang);
  await ans('yes'); const b2 = await said(), b2log = await log();
  await p.click('#dlgBody .gd [data-gd="again"]'); await sleep(200); const b3 = await said();
  ok('B turned on at "Can the behavior hurt…?" it reads that question, its help and its two choices at once, in English, and the choice is kept (nbh.guide.voice = 1); the next question ("How far is the assessment?") is read when it comes, the earlier reading stopped first; "Say it again" reads it again',
    b1.length === 1 && b1[0] === 'Can the behavior hurt the student or someone else? Hitting, biting, self-injury, running from the building, throwing furniture and the like. The choices are: Yes. No.' && b1v.pressed === 'true' && b1v.again && pref === '1' && lang === 'en-US' &&
    b2.length === 2 && /^How far is the assessment\? The choices are: Just starting\. Interviews and observations are done\. The results disagree, or the function is still unclear\.$/.test(b2[1]) && /cS$/.test(b2log) && b3.length === 3 && b3[2] === b3[1], { b1, b1v, pref, lang, b2, b2log, b3: b3.length });
  /* C */
  await ans('unclear'); await ans('escape'); const c1 = await said();
  await p.click('#dlgBody .gd [data-gd="start"]'); await sleep(2800); const c2 = await said();
  await p.click('#gdNext'); await sleep(2800); const c3 = await said();
  await p.evaluate(() => { openForm('TB-1'); }); await sleep(2500); await p.evaluate(() => { openForm('DA-1'); }); await sleep(1500); const c4 = await said();
  const c5 = await p.evaluate(() => { const v = document.getElementById('gdVoice'), a = document.getElementById('gdAgain'); return { pressed: v.getAttribute('aria-pressed'), again: !a.hidden && a.offsetParent !== null }; });
  await p.click('#gdAgain'); await sleep(200); const c6 = await said();
  await p.click('#gdAll'); await sleep(400); await p.click('#dlgBody .gd [data-gd="tasks"]'); await sleep(600); const c7 = await said();
  await p.click('#dlgBody .gd [data-gd="resume"]'); await sleep(300);
  ok('C the list of steps is read in short ("4 steps, one at a time. The first is: Crisis Plan and Debriefing."); Start reads step 1 with its number, name, form and reason; "Done: next step" reads step 2; a form opening does not read it again; the strip shows Read aloud on and its "Say it again" reads the step; the first screen reads what is in hand and the 13 choices',
    c1[c1.length - 1] === 'Find out why a behavior happens. 4 steps, one at a time. The first is: Crisis Plan and Debriefing.' && c2.length === c1.length + 1 && /^Step 1 of 4\. Crisis Plan and Debriefing, Form C R 1\. Safety comes first\./.test(c2[c2.length - 1]) &&
    c3.length === c2.length + 1 && /^Step 2 of 4\. Demand Assessment, Form D A 1\. Find which demands/.test(c3[c3.length - 1]) && c4.length === c3.length && c5.pressed === 'true' && c5.again && c6.length === c4.length + 1 && c6[c6.length - 1] === c3[c3.length - 1] &&
    /^What do you need to do today\? In hand: Find out why a behavior happens, step 2\. The choices are: Start with a new student\. /.test(c7[c7.length - 1]) && /Hand over or close a case\.$/.test(c7[c7.length - 1]), { c1: c1.slice(-1), c2: c2.slice(-1), c3: c3.slice(-1), n: [c1.length, c2.length, c3.length, c4.length, c6.length], c5, c7: c7.slice(-1) });
  /* D */
  const before = (await said()).length; await p.click('#gdVoice'); await sleep(200); const d1 = await log(), d1p = await p.evaluate(() => ({ pressed: document.getElementById('gdVoice').getAttribute('aria-pressed'), again: document.getElementById('gdAgain').hidden, pref: localStorage.getItem('nbh.guide.voice') }));
  await p.click('#gdNext'); await sleep(2500); await p.click('#gdAll'); await sleep(400); const d2 = (await said()).length, d2v = await vb(); await p.click('#dlgClose'); await sleep(200);
  ok('D turned off in the strip: the reading is stopped, the choice is kept as off, the next step and the list say nothing, and the dialog\'s button shows off', /c$/.test(d1) && d1p.pressed === 'false' && d1p.again && d1p.pref === '0' && d2 === before && d2v.pressed === 'false' && !d2v.again, { d1: d1.slice(-6), d1p, before, d2, d2v });
  /* E */
  await p.click('#gdVoice'); await sleep(200); const e0 = (await said()).slice(-1)[0]; await p.reload(); await sleep(3000);
  const e1 = await said(), e1v = await p.evaluate(() => ({ pressed: document.getElementById('gdVoice').getAttribute('aria-pressed'), count: document.querySelector('#gdCount .gd-w').textContent }));
  await p.click('#gdNext'); await sleep(2500); const e2 = await said();
  ok('E turned on again it reads the step in hand; after the page is opened again nothing is read, the strip is at the same step with Read aloud on; the next step is then read',
    /^Step 3 of 4\. Experimental Analysis, Form E A 1\./.test(e0) && e1.length === 0 && e1v.pressed === 'true' && /step 3 of 4/.test(e1v.count) && e2.length === 1 && /^Step 4 of 4\. FBA Summary Report, Form F S 1\./.test(e2[0]), { e0, e1, e1v, e2 });
  await p.evaluate(() => { window.__wsGuide.end(); localStorage.removeItem('nbh.guide.voice'); });
  /* F */
  const c2x = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 }); await c2x.addInitScript(() => { try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } catch (e) {} });
  const r = await c2x.newPage(); r.on('pageerror', e => errs.push('no speech: ' + e)); await r.goto(B + 'index.html'); await sleep(3000);
  const has = await r.evaluate(() => typeof window.speechSynthesis);
  await r.click('#gdStart [data-gdopen="check"]'); await sleep(500); const f1 = await r.evaluate(() => !!document.querySelector('#dlgBody .gd [data-gd="voice"], #dlgBody .gd-vrow'));
  await r.click('#dlgBody .gd [data-gd="ans"][data-v="first"]'); await sleep(400); await r.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500);
  const f2 = await r.evaluate(() => ({ voice: !!document.getElementById('gdVoice'), count: document.querySelector('#gdCount .gd-w').textContent, cur: state.cur })); await c2x.close();
  ok('F a device with no speech (speechSynthesis taken away): no Read aloud button in the dialog or the strip, and the guide runs: step 1 of 3 with Form ST-1 open', has === 'undefined' && !f1 && !f2.voice && /step 1 of 3/.test(f2.count) && f2.cur === 'ST-1', { has, f1, f2 });
  /* G */
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await ph.addInitScript(WATCH);
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); q.on('dialog', d => d.accept()); await q.goto(B + 'index.html'); await sleep(3000);
  await q.evaluate(() => window.__wsGuide.begin('check')); await sleep(500); await q.click('#dlgBody .gd [data-gd="voice"]'); await sleep(200);
  const g1 = await q.evaluate(() => { const d = document.getElementById('dlg').getBoundingClientRect(), row = [...document.querySelectorAll('#dlgBody .gd-vrow button')].filter(b => b.offsetParent !== null); return { fits: row.every(b => { const c = b.getBoundingClientRect(); return c.left >= d.left && c.right <= d.right + 1 && c.height >= 44; }), n: row.length }; });
  await q.click('#dlgBody .gd [data-gd="ans"][data-v="first"]'); await sleep(400); await q.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500);
  const g2 = await q.evaluate(() => { const b = document.getElementById('gdBar'), r = b.getBoundingClientRect(); return { h: r.height, sw: document.documentElement.scrollWidth, iw: innerWidth, links: [...b.querySelectorAll('.gd-link')].filter(x => x.offsetParent !== null).map(x => [x.textContent, Math.round(x.getBoundingClientRect().height), x.getBoundingClientRect().right <= innerWidth + 1]), last: window.__said.filter(x => x.t).slice(-1)[0].t }; }); await ph.close();
  ok('G at a phone\'s width (390) the dialog\'s two buttons fit at 44 px; the strip with "Read aloud" and "Say it again" is 150 px tall or less, inside the screen, its links 24 px tall or more; the step is read; no page error',
    g1.fits && g1.n === 2 && g2.h <= 150 && g2.sw <= g2.iw && g2.links.length === 4 && g2.links.every(l => l[1] >= 24 && l[2]) && /^Step 1 of 3\. Staff Training and Competency, Form S T 1\./.test(g2.last) && !errs.length, { g1, g2, errs });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
