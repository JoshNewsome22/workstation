/* v26.13 Guide me: the start screen asks "What do you need to do today?", asks one to four questions chosen by the answers
   before them, and then takes the steps one at a time in a strip at the foot of the work area.
   A  the start screen opens with the question and a button for each of the 13 kinds of work, 44 px tall; nothing is in
      hand at first; the search finds "Guide me", the Tools menu has it, and so has the phone's More list;
   B  the content, every answer path of every kind of work: each gives at least one step; every form named is a form of
      the workstation and every one of the workstation's forms is reached by some path; no step twice in a list; each
      step says why; no dash used as punctuation;
   C  the questions are conditional: a question is asked only when the answers before it call for it; Back asks the last
      one again; "Not yet" to "Is the function known?" sends to the assessment first, and can be overruled;
   D  the steps: the list names the answers; Start closes the dialog, shows step 1 in the strip and opens its form;
      "Done: next step" opens the next form; Skip moves on without opening anything, and the Open button is then the
      filled one; Back goes back; "All steps" shows the list with the done and the skipped marked;
   E  what the open case already says is not asked: with consent on file the consent question is passed over and named
      as taken from the case, a step's form shows what is on file, and the first screen proposes the kind of work the
      case needs next (facts set by the test: the forms that would give them are not filled here);
   F  the guide is kept for the tab only, and holds nothing about a student: after a reload the strip is back at the same
      step; the last step ends with what often comes next and clears the guide; the X ends it;
   G  at a phone's width the start screen shows one button that opens the list of 13 (its length is budgeted there);
      the strip and the dialog fit and their buttons are 44 px tall; the strip is a named region whose
      step is announced; no page error.
   usage: node qa/v2613-guide-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path');
const ED = process.env.WS_EDITION || 'NBH-Workstation';
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1200))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(B + 'index.html'); await sleep(3000);
  const ans = async v => { await p.click('#dlgBody .gd [data-gd="ans"][data-v="' + v + '"]'); await sleep(350); };
  const scr = () => p.evaluate(() => { const g = document.querySelector('#dlgBody .gd'); return g && document.getElementById('dlg').open ? { s: g.dataset.gdscreen, title: document.getElementById('dlgTitle').textContent, q: (g.querySelector('.gd-q') || {}).textContent || '', opts: [...g.querySelectorAll('[data-gd="ans"]')].map(b => b.dataset.v), text: g.textContent.replace(/\s+/g, ' ') } : null; });
  const strip = () => p.evaluate(() => { const b = document.getElementById('gdBar'); if (!b || b.hidden) return null; const vis = x => !!x && !x.hidden && x.offsetParent !== null; const tx = x => [...x.childNodes].filter(c => c.nodeType === 3 || getComputedStyle(c).display !== 'none').map(c => c.textContent).join('');
    return { count: tx(document.getElementById('gdCount')), t: document.getElementById('gdT').firstChild.textContent, form: (document.querySelector('#gdT span') || {}).textContent || '', why: document.getElementById('gdWhy').textContent, go: vis(document.getElementById('gdGo')) ? tx(document.getElementById('gdGo')) : '', goP: document.getElementById('gdGo').classList.contains('primary'), next: tx(document.getElementById('gdNext')), nextP: document.getElementById('gdNext').classList.contains('primary'), skip: vis(document.getElementById('gdSkip')), backOff: document.getElementById('gdBack').disabled, cur: state.cur || '' }; });
  /* A */
  const a = await p.evaluate(() => { const x = document.getElementById('gdStart'), bs = [...x.querySelectorAll('.gd-pills button')].filter(b => b.offsetParent !== null), card = document.querySelector('#blank .card');
    return { h: x.querySelector('h2').textContent, first: ([...card.querySelectorAll('h2')].find(h => h.offsetParent !== null).closest('#gdStart') || {}).id || '', n: bs.length, minH: Math.min(...bs.map(b => b.getBoundingClientRect().height)), resume: bs.some(b => b.dataset.gdopen === 'resume'), bar: document.getElementById('gdBar').hidden, top: x.getBoundingClientRect().top >= 0, tasks: window.__wsGuide.tasks().length, cmd: palList('guide me').some(r => /^Guide me/.test(r.n)), more: PH_MORE.find(g => g[0] === 'The workstation')[1].some(i => i[0] === 'wsGuideBtn') && !document.getElementById('wsGuideBtn').hidden }; });
  await p.evaluate(() => window.__wsNav.open('tools')); await sleep(250);
  const tools = await p.evaluate(() => [...document.querySelectorAll('#wsNavMenu button')].filter(b => b.offsetParent).map(b => b.textContent)[0]);
  await p.click('#wsNavMenu button'); await sleep(500); const viaTools = await scr();
  ok('A the start screen opens with "What do you need to do today?" and a button for each of the 13 kinds of work, 44 px tall or more, with nothing in hand; the search finds "Guide me"; the Tools menu opens it; the phone\'s More list has it',
    a.h === 'What do you need to do today?' && a.first === 'gdStart' && a.n === 13 && a.tasks === 13 && a.minH >= 44 && !a.resume && a.bar && a.top && a.cmd && a.more && tools === 'Guide me' && !!viaTools && viaTools.s === 'tasks' && viaTools.title === 'What do you need to do today?', { a, tools, viaTools });
  await p.click('#dlgClose'); await sleep(200);
  /* B */
  const all = await p.evaluate(() => window.__wsGuide.all()), forms = await p.evaluate(() => ALL.map(x => x[0]));
  const used = new Set(), faults = []; all.forEach(x => { if (!x.steps.length) faults.push('empty ' + x.task + JSON.stringify(x.a)); const ks = x.steps.map(s => s.k); if (new Set(ks).size !== ks.length) faults.push('twice ' + x.task);
    x.steps.forEach(s => { if (s.form) { used.add(s.form); if (!forms.includes(s.form)) faults.push('form ' + s.form); } else if (s.cmd && !s.k.startsWith('c:')) faults.push('key ' + s.k); if (/[—–]/.test(s.t + s.why)) faults.push('dash ' + s.k); if (s.why.length < 25 || !s.t) faults.push('why ' + s.k); }); });
  const byTask = all.reduce((m, x) => (m[x.task] = (m[x.task] || 0) + 1, m), {}), notReached = forms.filter(f => !used.has(f));
  ok('B all ' + all.length + ' answer paths of the 13 kinds of work give steps (1 to ' + Math.max(...all.map(x => x.steps.length)) + '); every form named exists and all ' + forms.length + ' forms are reached by some path; no step twice in a list; each says why; no dash as punctuation',
    all.length >= 120 && Object.keys(byTask).length === 13 && !faults.length && !notReached.length && Math.max(...all.map(x => x.steps.length)) <= 12, { faults: faults.slice(0, 8), notReached, byTask });
  /* C */
  await p.click('#gdStart [data-gdopen="why"]'); await sleep(500); const c1 = await scr(); await ans('yes'); const c2 = await scr(); await ans('no'); const c3 = await scr(); await ans('have');
  const c4 = await scr();   /* stage "have": neither "when" nor "lead" is asked, and with no danger "sib" is no question of this task: the list comes */
  await p.click('#dlgBody .gd [data-gd="redo"]'); await sleep(400); await ans('yes'); await ans('no'); await ans('start'); const c5 = await scr();
  await p.click('#dlgBody .gd [data-gd="back"]'); await sleep(400); const c6 = await scr(); await ans('unclear'); const c7 = await scr();
  await p.evaluate(() => window.__wsGuide.begin('plan')); await sleep(400); const c8 = await scr(); await ans('no'); const c9 = await scr();
  await p.click('#dlgBody .gd [data-gd="anyway"]'); await sleep(400); const c10 = await scr();
  await p.evaluate(() => window.__wsGuide.begin('new')); await sleep(400); await ans('yes'); await ans('no'); await ans('no'); const c11 = await scr();   /* no danger: the self-injury question is not asked */
  await p.evaluate(() => window.__wsGuide.begin('new')); await sleep(400); await ans('yes'); await ans('no'); await ans('yes'); const c12 = await scr();
  ok('C the questions follow the answers: consent, then danger, then how far; "done" goes straight to the steps; "just starting" asks when it happens and Back asks "how far" again; "unclear" asks what the behavior gets; "Is the function known? Not yet" sends to the assessment first and can be overruled; the self-injury question comes only after "it can hurt someone"',
    c1.s === 'q' && /consent/.test(c1.q) && c1.opts.join() === 'yes,no,unsure' && /hurt/.test(c2.q) && /How far/.test(c3.q) && c4.s === 'plan' && /Is it known when/.test(c5.q) && c5.opts.join() === 'known,meals,all' && /How far/.test(c6.q) && /seem to get/.test(c7.q) &&
    /function of the behavior known/.test(c8.q) && c9.s === 'go' && /Find out why a behavior happens comes first/.test(c9.text) && /new plan, or a change/.test(c10.q) && c11.s === 'plan' && c12.s === 'q' && /their own body/.test(c12.q), { c1: c1.q, c4: c4.s, c5: c5.q, c6: c6.q, c7: c7.q, c9: c9.text.slice(0, 160), c10: c10.q, c11: c11.s, c12: c12.q });
  /* D */
  await p.evaluate(() => window.__wsGuide.begin('why')); await sleep(400); for (const v of ['no', 'yes', 'unclear', 'escape']) await ans(v);
  const d0 = await p.evaluate(() => { const g = document.querySelector('#dlgBody .gd'); return { said: [...g.querySelectorAll('.gd-said li')].map(li => li.textContent), steps: [...g.querySelectorAll('.gd-steps li')].map(li => li.querySelector('b').textContent + '|' + ((li.querySelector('.gd-id') || {}).textContent || '')), start: g.querySelector('[data-gd="start"]').textContent, focus: document.activeElement.dataset.gd }; });
  await p.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500); const d1 = await strip(), dlgOpen = await p.evaluate(() => document.getElementById('dlg').open);
  await p.click('#gdNext'); await sleep(2500); const d2 = await strip();
  await p.click('#gdSkip'); await sleep(600); const d3 = await strip();
  await p.click('#gdGo'); await sleep(2500); const d4 = await strip();
  await p.click('#gdBack'); await sleep(400); const d5 = await strip();
  await p.click('#gdAll'); await sleep(400);
  const d6 = await p.evaluate(() => [...document.querySelectorAll('#dlgBody .gd-steps li')].map(li => (li.classList.contains('gd-d') ? 'd' : li.classList.contains('gd-s') ? 's' : '-') + (li.classList.contains('gd-cur') ? '*' : '')).join(' '));
  const d7 = await p.evaluate(() => document.querySelector('#dlgBody [data-gd="start"]').textContent); await p.click('#dlgBody [data-gd="jump"][data-i="3"]'); await sleep(2500); const d8 = await strip();
  ok('D the list names the four answers and five steps (IC-1, CR-1, DA-1, EA-1, FS-1); Start closes the dialog, shows step 1 of 5 and opens Form IC-1; "Done: next step" opens CR-1; Skip shows DA-1 without opening it, with Open filled; Open opens it and Done is filled; Back returns; "All steps" marks done, skipped and the one in hand; a step in the list can be gone to',
    d0.said.length === 4 && /Not yet$/.test(d0.said[0]) && d0.steps.map(s => s.split('|')[1]).join() === 'Form IC-1,Form CR-1,Form DA-1,Form EA-1,Form FS-1' && d0.start === 'Start with step 1' && d0.focus === 'start' &&
    !dlgOpen && !!d1 && d1.count === 'Why a behavior happens: step 1 of 5' && d1.form === 'Form IC-1' && d1.cur === 'IC-1' && d1.nextP && !d1.goP && d1.backOff && d1.next === 'Done: next step' && d1.go === 'Open Form IC-1' && d1.why.length > 40 &&
    d2.cur === 'CR-1' && /step 2 of 5/.test(d2.count) && d3.form === 'Form DA-1' && d3.cur === 'CR-1' && d3.goP && !d3.nextP && d4.cur === 'DA-1' && d4.nextP && !d4.goP && /step 2 of 5/.test(d5.count) && d5.cur === 'DA-1' &&
    d6 === 'd s* - - -' && d7 === 'Carry on with step 2' && /step 4 of 5/.test(d8.count) && d8.cur === 'EA-1' && /second trained adult/.test(d8.why), { d0, dlgOpen, d1, d2: d2.cur, d3, d4, d5: d5.count, d6, d7, d8 });
  /* E: the facts of an open case, set here by hand (gathering them from forms is the shell's own work, tested elsewhere) */
  await p.evaluate(() => { window.__wsGuide.end(); gatherFacts = async () => {}; const i = document.getElementById('pClient'); i.value = 'SIMULATED Rivera, Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
    state.facts = { consent: { on: true, state: 'Current', obtained: '2026-11-02' }, behaviors: [{ label: 'Calling out', type: 'Target', def: 'Speaks without raising a hand' }] }; }); await sleep(300);
  await p.evaluate(() => window.__wsGuide.open()); await sleep(600); const e1 = await scr();
  await p.click('#dlgBody .gd [data-gd="task"][data-gdfocus]'); await sleep(500); const e2 = await scr(); await ans('no'); await ans('start'); await ans('known');
  const e3 = await p.evaluate(() => { const g = document.querySelector('#dlgBody .gd'); return { said: [...g.querySelectorAll('.gd-said li')].map(li => li.textContent), forms: [...g.querySelectorAll('.gd-steps .gd-id')].map(x => x.textContent.replace('Form ', '')), tb: ([...g.querySelectorAll('.gd-steps li')].find(li => /TB-1/.test(li.textContent)).querySelector('.gd-chip') || {}).textContent || '', stored: sessionStorage.getItem('nbh.guide.v1') }; });
  ok('E with a case open the first screen proposes what the case needs next ("Find out why a behavior happens": the behavior is defined, no function on file); consent on file is not asked and is named as taken from the case; no consent step is in the list; Form TB-1 shows "1 target behavior defined"',
    /For the case that is open: Find out why a behavior happens\. In this case, the behavior is defined, and no function is on file yet\./.test(e1.text) && e2.title === 'Find out why a behavior happens' && /hurt/.test(e2.q) && e3.said[0] === 'Taken from the case: Consent is on file (Form IC-1).' && !e3.forms.includes('IC-1') && e3.forms[0] === 'RR-1' && e3.forms.includes('FS-1') && e3.tb === '1 target behavior defined', { e1: e1.text.slice(0, 200), e2: e2.q, e3 });
  /* F */
  const kept = JSON.parse(e3.stored || '{}'), keys = Object.keys(kept).sort().join(), flat = JSON.stringify(kept);
  await p.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500); await p.click('#gdNext'); await sleep(2500); const f1 = await strip();
  await p.reload(); await sleep(3000); const f2 = await strip(), f2pill = await p.evaluate(() => { const b = document.querySelector('#gdStart [data-gdopen="resume"]'); return !!b && !b.hidden; });
  await p.evaluate(() => window.__wsGuide.begin('learn')); await sleep(400); await ans('bank'); await p.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500); const f3 = await strip();
  await p.click('#gdNext'); await sleep(500); const f4 = await scr(), f5 = await p.evaluate(() => ({ st: window.__wsGuide.state(), bar: document.getElementById('gdBar').hidden, kept: sessionStorage.getItem('nbh.guide.v1') }));
  await p.evaluate(() => window.__wsGuide.begin('review')); await sleep(400); await ans('better'); await p.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500); await p.click('#gdNext'); await sleep(2000); await p.click('#gdNext'); await sleep(2000);
  await p.click('#dlgBody .gd [data-gd="shut"]').catch(() => {}); const f6 = await strip(); await p.click('#gdEnd'); await sleep(300); const f7 = await p.evaluate(() => ({ bar: document.getElementById('gdBar').hidden, kept: sessionStorage.getItem('nbh.guide.v1') }));
  ok('F what is kept is the kind of work, the answers and the place (task, a, au, keys, i, mark, went, run), nothing of the student; after a reload the strip is back at step 2 and the start screen offers "Carry on"; a one-step guide ends with "Done: finish", then "That was the last step", and clears; the X ends a guide in hand',
    keys === 'a,au,i,keys,mark,run,task,went' && !/Rivera|Ana|Calling/.test(flat) && /step 2 of 9/.test(f1.count) && !!f2 && f2.count === f1.count && f2.t === f1.t && f2pill && f3.next === 'Done: finish' && !f3.skip && f3.cur === 'TD-1' && f4.s === 'end' && /That was the last step/.test(f4.text) && f5.st === null && f5.bar && f5.kept === null && !!f6 && /step 3 of 7/.test(f6.count) && f7.bar && f7.kept === null,
    { keys, f1: f1.count, f2, f2pill, f3, f4: f4 && f4.text.slice(0, 120), f5, f6: f6 && f6.count, f7 });
  /* G */
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); q.on('dialog', d => d.accept()); await q.goto(B + 'index.html'); await sleep(3000);
  const g0 = await q.evaluate(() => { const x = document.getElementById('gdStart'), vis = [...x.querySelectorAll('button')].filter(b => b.offsetParent); return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide: vis.filter(b => b.getBoundingClientRect().right > innerWidth + 1).length, btns: vis.map(b => b.textContent), h: vis[0] ? vis[0].getBoundingClientRect().height : 0 }; });
  await q.click('#gdStart [data-gdopen="list"]'); await sleep(500); const g0b = await q.evaluate(() => { const g = document.querySelector('#dlgBody .gd'); return !!g && g.dataset.gdscreen === 'tasks' && g.querySelectorAll('[data-gd="task"]').length; });
  await q.evaluate(() => window.__wsGuide.begin('plan')); await sleep(500);
  const g1 = await q.evaluate(() => { const d = document.getElementById('dlg').getBoundingClientRect(); return { fits: d.left >= 0 && d.right <= innerWidth + 1, small: [...document.querySelectorAll('#dlgBody .gd button')].filter(b => b.getBoundingClientRect().height < 44).length }; });
  for (const v of ['yes', 'new', 'no']) { await q.click('#dlgBody .gd [data-gd="ans"][data-v="' + v + '"]'); await sleep(350); } await q.click('#dlgBody .gd [data-gd="start"]'); await sleep(2500);
  const g2 = await q.evaluate(() => { const b = document.getElementById('gdBar'), r = b.getBoundingClientRect(), bs = [...b.querySelectorAll('.gd-btns button')].filter(x => x.offsetParent !== null), e = document.elementFromPoint(r.left + r.width / 2, r.top + 12);
    return { role: b.getAttribute('role'), label: b.getAttribute('aria-label'), live: !!b.querySelector('[aria-live="polite"] #gdT'), h: r.height, inside: bs.every(x => { const c = x.getBoundingClientRect(); return c.left >= -1 && c.right <= innerWidth + 1; }), small: bs.filter(x => x.getBoundingClientRect().height < 44).length, sw: document.documentElement.scrollWidth, iw: innerWidth, onTop: !!(e && e.closest('#gdBar')), whyHidden: getComputedStyle(document.getElementById('gdWhy')).display === 'none', count: document.querySelector('#gdCount .gd-s').textContent }; });
  await q.click('#gdWhyBtn'); await sleep(200); const g3 = await q.evaluate(() => ({ shown: getComputedStyle(document.getElementById('gdWhy')).display !== 'none', exp: document.getElementById('gdWhyBtn').getAttribute('aria-expanded') })); await ph.close();
  ok('G at a phone\'s width (390) the start screen shows one button that opens the list of 13; the dialog and the strip fit, and their buttons are 44 px tall; the strip is a named region whose step is announced, no taller than 150 px, and not under the phone\'s own bar; the reason folds away behind "Why this step"; no page error',
    g0.sw <= g0.iw && g0.wide === 0 && g0.btns.join() === 'Show the 13 kinds of work' && g0.h >= 44 && g0b === 13 && g1.fits && g1.small === 0 && g2.role === 'region' && /^Guide/.test(g2.label) && g2.live && g2.h <= 150 && g2.inside && g2.small === 0 && g2.sw <= g2.iw && g2.onTop && g2.whyHidden && g2.count === 'Step 1 of 9' && g3.shown && g3.exp === 'true' && !errs.length, { g0, g0b, g1, g2, g3, errs });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
