/* v26.09 Spanish captions in the video library (videos.html; nbh-video-transcripts-es.js).
   A  the file: every video of the English transcripts has its Spanish, one line for each spoken line (the narrator's and
      the people's, not the on-screen ones), none empty; each line carries the digits its English line carries; no dash
      used as punctuation; the names the forms use (TD-1, DRO, DRA, FCT) are kept where the English line has them;
   B  on a video's page: "Captions in" offers English and Español; nothing shows until CC is on; English is the first choice;
   C  choosing Español turns the captions on in Spanish: the Spanish track shows and the English one does not; its lines
      start when the English lines start; the first line is the file's first line; a person's line is marked with the
      role in Spanish; the choice is kept on the device and holds after the page is opened again and on another video;
   D  choosing English shows the English track again; CC off hides both;
   E  at a phone's width the choice is 44 px tall and nothing is wider than the screen; the offline list holds the file;
      no page error.
   usage: node qa/v2609-captions-es-test.js   (WS_URL, WS_ROOT and WS_EDITION as in qa/lib.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = process.env.WS_ROOT || path.resolve(__dirname, '..'), ED = process.env.WS_EDITION || 'NBH-Workstation', DIR = path.join(ROOT, ED);
const B = (process.env.WS_URL || 'http://127.0.0.1:8124') + '/' + ED + '/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 900))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const load = (f, name) => { const w = {}; new Function('window', fs.readFileSync(path.join(DIR, f), 'utf8'))(w); return w[name]; };
const KEY = 'dro_resetting';
(async () => {
  /* A */
  const EN = load('nbh-video-transcripts.js', 'NBH_VIDEO_TRANSCRIPTS'), ES = load('nbh-video-transcripts-es.js', 'NBH_VIDEO_TRANSCRIPTS_ES');
  const dg = s => (s.match(/\d+/g) || []).sort().join(','), faults = []; let lines = 0;
  Object.keys(EN).forEach(k => { const sp = EN[k].filter(l => l[1] !== 'O'), es = ES[k]; if (!Array.isArray(es) || es.length !== sp.length) { faults.push(k + ': ' + (es ? es.length : 'none') + ' for ' + sp.length); return; }
    es.forEach((t, i) => { lines++; if (typeof t !== 'string' || !t.trim()) faults.push(k + ' ' + i + ' empty'); else { if (dg(t) !== dg(sp[i][2])) faults.push(k + ' ' + i + ' digits'); if (/[—–]/.test(t)) faults.push(k + ' ' + i + ' dash');
      ['TD-1', 'DRO', 'DRA', 'FCT'].forEach(w => { if (new RegExp('\\b' + w + '\\b').test(sp[i][2]) && !t.includes(w)) faults.push(k + ' ' + i + ' ' + w); }); } }); });
  const extra = Object.keys(ES).filter(k => !EN[k]);
  ok('A the Spanish file: all ' + Object.keys(EN).length + ' videos, ' + lines + ' lines, one for each spoken English line, none empty, the same digits, no dash as punctuation, the forms\' own names kept; no video the English does not have',
    Object.keys(EN).length >= 46 && lines >= 650 && !faults.length && !extra.length, { faults: faults.slice(0, 8), extra });
  /* B */
  const br = await chromium.launch(), errs = [];
  const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(B + 'videos.html#video=' + KEY); await p.waitForSelector('#vlCcLang', { state: 'attached', timeout: 30000 }); await sleep(500);
  const tracks = () => p.evaluate(() => { const v = document.getElementById('vlVideo'); return [...v.textTracks].map(t => ({ lang: t.language, label: t.label, mode: t.mode, cues: t.cues ? t.cues.length : -1, first: t.cues && t.cues[0] ? t.cues[0].text : '', starts: t.cues ? [...t.cues].map(c => Math.round(c.startTime * 10) / 10) : [], texts: t.cues ? [...t.cues].map(c => c.text) : [] })); });
  const b = { vis: await p.evaluate(() => !document.getElementById('vlCcLangL').hidden && getComputedStyle(document.getElementById('vlCcLangL')).display !== 'none'), opts: await p.$$eval('#vlCcLang option', o => o.map(x => x.value + ':' + x.textContent)), val: await p.inputValue('#vlCcLang'), cc: await p.getAttribute('#vlCC', 'aria-pressed'), t: (await tracks()).map(t => t.lang + ':' + t.mode) };
  ok('B on a video\'s page "Captions in" offers English and Español, English first; with CC off neither track shows', b.vis && b.opts.join() === 'en:English,es:Español' && b.val === 'en' && b.cc === 'false' && b.t.join() === 'en:hidden,es:hidden', b);
  /* C */
  await p.selectOption('#vlCcLang', 'es'); await p.waitForFunction(() => { const t = [...document.getElementById('vlVideo').textTracks].find(x => x.language === 'es'); return t && t.cues && t.cues.length > 0; }, null, { timeout: 15000 });
  /* the English track's cues, to compare the times: shown for a moment, then back */
  const t1 = await tracks(), es = t1.find(t => t.lang === 'es'), en0 = t1.find(t => t.lang === 'en');
  const sp = EN[KEY].filter(l => l[1] !== 'O'), lineStarts = sp.map(l => Math.round(l[0] * 10) / 10);
  const teacherIdx = sp.findIndex(l => l[1] === 'Teacher'), roleCue = es.texts.find(x => x.startsWith('[Docente] '));
  const pref1 = await p.evaluate(() => JSON.parse(localStorage.getItem('nbh.videos.pref') || '{}'));
  await p.reload(); await p.waitForSelector('#vlCcLang', { state: 'attached' }); await sleep(600); const again = { val: await p.inputValue('#vlCcLang'), cc: await p.getAttribute('#vlCC', 'aria-pressed'), t: (await tracks()).map(t => t.lang + ':' + t.mode) };
  await p.goto(B + 'videos.html#video=calm_plan'); await p.reload(); await p.waitForSelector('#vlCcLang', { state: 'attached' }); await sleep(600); const other = { val: await p.inputValue('#vlCcLang'), t: (await tracks()).map(t => t.lang + ':' + t.mode) };
  ok('C Español turns the captions on in Spanish: the Spanish track shows, the English does not; every spoken line\'s start is a caption\'s start; the first caption is the file\'s first line; a teacher\'s line is marked [Docente]; the choice is kept (cc and ccl) and holds when the page is opened again and on another video',
    es.mode === 'showing' && en0.mode === 'hidden' && es.cues >= sp.length && lineStarts.every(x => es.starts.includes(x)) && ES[KEY][0].startsWith(es.first.replace(/\s+$/, '')) && es.first.length > 20 && teacherIdx >= 0 && !!roleCue && roleCue === '[Docente] ' + ES[KEY][teacherIdx] &&
    pref1.cc === true && pref1.ccl === 'es' && again.val === 'es' && again.cc === 'true' && again.t.join() === 'en:hidden,es:showing' && other.val === 'es' && other.t.join() === 'en:hidden,es:showing', { es: { mode: es.mode, cues: es.cues, first: es.first }, en: en0.mode, roleCue, pref1, again, other, missing: lineStarts.filter(x => !es.starts.includes(x)).slice(0, 5) });
  /* D */
  await p.selectOption('#vlCcLang', 'en'); await sleep(300); const d1 = (await tracks()).map(t => t.lang + ':' + t.mode); await p.click('#vlCC'); await sleep(200); const d2 = (await tracks()).map(t => t.lang + ':' + t.mode), cc2 = await p.getAttribute('#vlCC', 'aria-pressed');
  await p.click('#vlCC'); await sleep(200); const d3 = (await tracks()).map(t => t.lang + ':' + t.mode);
  ok('D English shows the English track again; CC off hides both; CC on again shows the language chosen', d1.join() === 'en:showing,es:hidden' && d2.join() === 'en:hidden,es:hidden' && cc2 === 'false' && d3.join() === 'en:showing,es:hidden', { d1, d2, cc2, d3 });
  /* E */
  const ph = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const q = await ph.newPage(); q.on('pageerror', e => errs.push('phone: ' + e)); await q.goto(B + 'videos.html#video=' + KEY); await q.waitForSelector('#vlCcLang', { state: 'attached' }); await sleep(500);
  const pw = await q.evaluate(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth, h: document.getElementById('vlCcLang').getBoundingClientRect().height })); await ph.close();
  let files = {}; try { files = JSON.parse(fs.readFileSync(path.join(DIR, 'release.json'), 'utf8')).files || {}; } catch (e) {}
  ok('E at a phone\'s width the choice is 44 px tall or more and nothing is wider than the screen; the offline list holds the Spanish file; no page error',
    pw.w <= pw.iw && pw.h >= 44 && !!files['nbh-video-transcripts-es.js'] && !errs.length, { pw, listed: !!files['nbh-video-transcripts-es.js'], errs });
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
