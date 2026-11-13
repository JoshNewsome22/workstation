/* v26.06 the Device check page (check.html): a page that runs on the device and gives a one-screen report.
   A  by itself, at an iPad's size: the run finishes; every check has ended in pass, attention, check, note or not run;
      none is in attention; the version it reads is the start page's; the banks' counts are the banks'; a whole video
      opened; the report fits one screen (no scrolling at 1180 by 820) and is not wider than the screen;
   B  the report as text names the version, the device and every check, and Copy puts it on the clipboard;
   C  it leaves nothing behind: no key of its own in the browser's storage and no database of its own;
   D  Run again runs the checks anew;
   E  at a phone's width nothing is wider than the screen;
   F  after the start page has set up the offline copy and the page is opened again, the offline copy line passes
      (skipped with a note when this server's copy cannot finish in the time allowed);
   G  in the workstation: the command list has "Device check", it opens in the viewer the videos use, framed, with a
      Close that closes the viewer; the page shows no error anywhere;
   H  the build keeps it: the offline list (release.json) names check.html.
   usage: node qa/v2606-check-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), ED = process.env.WS_EDITION || 'NBH-Workstation', DIR = path.join(ROOT, ED);
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = p => p.waitForFunction(() => document.documentElement.dataset.dcDone === '1', null, { timeout: 150000 });
const rowsOf = p => p.evaluate(() => [...document.querySelectorAll('#dcRows li:not(.dc-group)')].map(li => ({ id: li.id.slice(3), state: li.dataset.state, text: li.textContent })));
(async () => {
  const idx = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8'), rel = (/const WS_REL='(v[0-9.]+)'/.exec(idx) || [])[1];
  const count = (f, v, k) => { const t = fs.readFileSync(path.join(DIR, f), 'utf8'), i = t.indexOf('const ' + v + '='); return JSON.parse(t.slice(i + v.length + 7, t.lastIndexOf('};') + 1))[k].length; };
  const cards = count('nbh-td1-bank.js', 'TD1_BANK', 'protocols'), goals = count('nbh-gb1-bank.js', 'GB1_BANK', 'entries');
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); } catch (e) {}
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('check: ' + e));
  await p.goto(B + 'check.html'); await done(p);
  const rows = await rowsOf(p), by = {}; rows.forEach(r => { by[r.id] = r; });
  const size = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, ih: innerHeight, iw: innerWidth }));
  const want = ['version', 'opened', 'forms', 'bank', 'offline', 'settings', 'store', 'space', 'save', 'frames', 'video', 'screen', 'layout', 'reading', 'scenes', 'extras'];
  ok('A by itself at 1180 by 820: the run finishes with ' + want.length + ' checks, each ended, none in attention; the version is the start page\'s (' + rel + '); the banks hold ' + cards + ' cards and ' + goals + ' goals; a whole video opened; the report fits the screen',
    rows.length === want.length && want.every(k => by[k]) && rows.every(r => ['pass', 'warn', 'note', 'skip'].includes(r.state)) && by.version.state === 'pass' && by.version.text.includes(rel) &&
    by.bank.state === 'pass' && by.bank.text.includes(cards.toLocaleString('en-US')) && by.bank.text.includes(goals + ' goals') && by.video.state === 'pass' && by.forms.state === 'pass' && by.frames.state === 'pass' && by.settings.state === 'pass' && by.store.state === 'pass' &&
    size.h <= size.ih && size.w <= size.iw, { rows: rows.filter(r => r.state !== 'pass').map(r => r.state + ' ' + r.text.slice(0, 120)), size });
  const txt = await p.inputValue('#dcText'); await p.click('#dcCopy'); await sleep(300);
  let clip = ''; try { clip = await p.evaluate(() => navigator.clipboard.readText()); } catch (e) { clip = 'unread'; }
  ok('B the report as text names the version, the device and every check; Copy the report puts it on the clipboard and says so',
    txt.includes('Workstation ' + rel) && /Device: \S/.test(txt) && want.length === (txt.match(/^(PASS|ATTENTION|CHECK|NOTE|NOT RUN) {2}/gm) || []).length && (clip === txt || clip === 'unread') && /Copied|copy it/.test(await p.textContent('#dcSaid')), { said: await p.textContent('#dcSaid'), lines: (txt.match(/^(PASS|ATTENTION|CHECK|NOTE|NOT RUN) {2}/gm) || []).length });
  const left = await p.evaluate(async () => ({ keys: Object.keys(localStorage).filter(k => /devicecheck/.test(k)), dbs: indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).filter(x => /devicecheck/.test(x)) : [] }));
  ok('C it leaves nothing of its own in the browser: no test key and no test database', !left.keys.length && !left.dbs.length, left);
  await p.evaluate(() => { document.documentElement.dataset.dcDone = ''; }); await p.click('#dcAgain'); await done(p);
  ok('D Run again runs the checks anew and ends the same way', (await rowsOf(p)).map(r => r.id + r.state).join() === rows.map(r => r.id + r.state).join(), (await rowsOf(p)).map(r => r.id + ':' + r.state));
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); await q.goto(B + 'check.html'); await done(q);
  const pw = await q.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth, small: [...document.querySelectorAll('button:not([hidden])')].filter(b => b.getBoundingClientRect().height < 44).length }));
  ok('E at a phone\'s width (390) nothing is wider than the screen and every button is 44 px tall or more', pw.w <= pw.iw && pw.small === 0, pw); await ph.close();
  /* F the offline copy line, once the start page has set the copy up */
  const x = await ctx.newPage(); x.on('pageerror', e => errs.push('shell: ' + e));
  await x.goto(B + 'index.html'); await sleep(2500);
  let st = null; for (let k = 0; k < 60; k++) { st = await x.evaluate(async () => { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return null; return await new Promise(res => { const ch = new MessageChannel(); ch.port1.onmessage = e => res(e.data && e.data.status); c.postMessage({ nbh: 'offline', cmd: 'status' }, [ch.port2]); setTimeout(() => res(null), 3000); }); }).catch(() => null); if (st && st.live && st.files === st.total && !(st.missing || []).length) break; await sleep(2000); if (k === 4 && !st) await x.reload(); }
  if (st && st.live && st.files === st.total) { await p.goto(B + 'check.html'); await done(p); const o = (await rowsOf(p)).find(r => r.id === 'offline');
    ok('F with the offline copy saved (' + st.files + ' files), the offline copy line passes and says how many', o.state === 'pass' && o.text.includes(st.files + ' files'), o); }
  else ok('F (the offline copy did not finish on this server in two minutes: the line is not judged; it says so itself)', ['warn', 'pass'].includes(by.offline.state) && by.offline.text.length > 30, by.offline);
  /* G in the workstation */
  const g = {}; g.cmd = await x.evaluate(() => typeof CMDS !== 'undefined' ? CMDS.filter(c => /^Device check: /.test(c.n)).length : null);
  await x.evaluate(() => window.__wsVideos.open('page:check')); for (let k = 0; k < 80 && !x.frames().some(f => /check\.html/.test(f.url())); k++) await sleep(100);
  const cf = x.frames().find(f => /check\.html/.test(f.url()));
  if (cf) { await cf.waitForFunction(() => document.documentElement.dataset.dcDone === '1', null, { timeout: 150000 }); g.open = await x.evaluate(() => window.__wsVideos.isOpen());
    g.framed = await cf.evaluate(() => document.documentElement.classList.contains('nbh-framed') && !document.getElementById('dcClose').hidden && !document.getElementById('dcAlone').hidden && document.getElementById('dcBack').hidden);
    g.line = await cf.textContent('#dcLine'); g.fail = (await cf.evaluate(() => [...document.querySelectorAll('#dcRows li[data-state=fail]')].map(l => l.textContent))); await cf.click('#dcClose'); await sleep(400); g.closed = await x.evaluate(() => window.__wsVideos.isOpen()); }
  ok('G in the workstation: the command list has "Device check"; it opens in the viewer, framed, with Close and "Open this page by itself"; no check is in attention there; Close closes the viewer; no page error anywhere',
    g.cmd === 1 && !!cf && g.open === true && g.framed === true && /in the viewer/.test(g.line || '') && g.fail.length === 0 && g.closed === false && !errs.length, { g, errs });
  let files = {}; try { files = JSON.parse(fs.readFileSync(path.join(DIR, 'release.json'), 'utf8')).files || {}; } catch (e) {}
  ok('H the build keeps the page in the offline copy: release.json names check.html with its length', !!files['check.html'] && files['check.html'].len === fs.statSync(path.join(DIR, 'check.html')).size, files['check.html']);
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
