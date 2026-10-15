/* v21.84 helper O: the writing help and the letterhead are ONE file each beside the forms (NBH-Workstation/nbh-wording.js,
   NBH-Workstation/nbh-logo.js), loaded by every form with a classic <script src> where its inline copy was.
   Checks, for the 47 forms: the files and loaders (no inline copy left), sw.js and release.json listing both, the school
   edition carrying both (its own logo), the one-file editions holding every form with both put back inline; then every
   form opened on its own from the website and from file:// (no page error, the writing help started with its rules and
   finds wording on a field, its button over a field, the letterhead filled), a few in the shell, in an Own tab, in the
   one-file edition (srcdoc and its Own tab, a blob) and in the school edition.
   usage: WS_URL=http://127.0.0.1:8144 node qa/v2184-o-test.js */
const {chromium, fs, path, ROOT, BASE, forms, wire, sleep} = require(__dirname + '/lib.js');
const zlib = require('zlib');
const {execFileSync} = require('child_process');
let fails = 0;
const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond || info === undefined ? '' : '  ' + JSON.stringify(info).slice(0, 400))); if (!cond) fails++; };
const NBH = path.join(ROOT, 'NBH-Workstation'), RPS = path.join(ROOT, 'RPS-Workstation');
const LW = '<script id="nbh-wording" src="nbh-wording.js"></script>', LL = '<script id="nbh-logo" src="nbh-logo.js"></script>';
const F = forms();
const PROBE = 'The student was angry and upset during reading.';

/* in a form: the writing help, the letterhead, and the button over a field with text */
async function probe(target){
  return target.evaluate(async t => {
    const w = window.nbhWording, st = w ? w.status() : null, found = w ? w.check(t).length : -1;
    const imgs = [...document.querySelectorAll('img[data-nbh-logo]')];
    /* the first few shown fields, each given wording to check, until one has the button over it (a field for the
       learner's particulars, or one the form opts out, takes none, before v21.84 too) */
    const cands = [...document.querySelectorAll('textarea')].filter(x => x.getClientRects().length && !x.disabled && !x.readOnly && x.getAttribute('spellcheck') !== 'false' && !x.closest('.toolbar,dialog,[data-nbh-nowording]')).slice(0, 8);
    let pill = null;
    for (const x of cands) { const was = x.value; x.scrollIntoView({block:'center'}); x.focus(); x.value = t; x.dispatchEvent(new Event('input', {bubbles:true}));
      await new Promise(r => setTimeout(r, 400));
      const h = document.getElementById('nbh-wording-ui'), r = h && h.shadowRoot;
      pill = r ? [...r.querySelectorAll('.iw')].filter(b => !b.classList.contains('away') && b.getClientRects().length).length : 0;
      x.value = was; x.dispatchEvent(new Event('input', {bubbles:true})); x.blur();
      if (pill > 0) break; }
    return {st, found, logo: (window.NBH_LOGO || '').slice(0, 22), imgs: imgs.length, filled: imgs.filter(i => /^data:image\//.test(i.getAttribute('src') || '')).length, ta: cands.length, pill,
      inline: !!document.querySelector('script#nbh-wording:not([src])'), libs: ['nbhFieldCare', 'nbhPolish', 'nbhCopies', 'nbhUI', 'nbhCase'].filter(k => !window[k]).join(' '), src: (document.querySelector('script#nbh-wording') || {}).src || ''};
  }, PROBE);
}
const good = (r, logo, id) => r && r.st && r.st.rules > 0 && r.st.badRules === 0 && r.found > 0 && r.logo.startsWith(logo || 'data:image/png;base64,') && r.filled === r.imgs && !r.libs && (!r.ta || r.pill > 0 || NOPILL.includes(id));
/* SR-1's first view shows only its intro boxes, which take no button (the same before v21.84) */
const NOPILL = ['SR-1'];

(async () => {
  /* ---- 1. the files */
  const W = fs.readFileSync(path.join(NBH, 'nbh-wording.js'), 'utf8'), L = fs.readFileSync(path.join(NBH, 'nbh-logo.js'), 'utf8');
  /* v22.07 the school edition's writing help has Rewrite with Claude off (tools/build-rps.py); otherwise the same file */
  const WR = W.replace('{"relay":"https://newsomebh.com/ai"}', '{"relay":"","rewrite":false}');
  const client = fs.readFileSync(path.join(ROOT, 'tools/blocks/nbh-wording.js'), 'utf8'), rules = fs.readFileSync(path.join(ROOT, 'tools/blocks/nbh-wording-rules.json'), 'utf8');
  ok('1 nbh-wording.js holds the rules and the client byte for byte', W.includes('window.nbhWordingRules=\n' + rules + '\n;') && W.endsWith(client));
  ok('1 nbh-logo.js holds the letterhead and sets NBH_LOGO', /^\/\*[^]*var L="data:image\/png;base64,/.test(L) && L.includes('window.NBH_LOGO=L'));
  ok('1 neither holds </script or <!-- (the one-file edition puts them back inline)', !/<\/script|<!--/i.test(W + L));
  let bad = [];
  for (const f of F) { const s = fs.readFileSync(path.join(NBH, f.file), 'utf8');
    if (s.split(LW).length !== 2 || s.split(LL).length !== 2 || s.split('<script id="nbh-wording"').length !== 2 || s.split('<script id="nbh-logo"').length !== 2 || s.includes('window.nbhWordingRules=') || /data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAHZ/.test(s)) bad.push(f.id); }
  ok('1 each of the 47 forms loads both once and holds no inline copy', F.length === 47 && !bad.length, bad);
  const pos = F.map(f => { const s = fs.readFileSync(path.join(NBH, f.file), 'utf8'); return s.indexOf(LL) < s.indexOf('</head>') && s.indexOf(LW) > s.indexOf('<body') && s.indexOf(LW) < s.lastIndexOf('<script>'); });
  ok('1 the logo loader is in the head; the writing help\'s after the markup, before the form\'s own script', pos.every(Boolean), F.filter((f, i) => !pos[i]).map(f => f.id));
  const out = execFileSync('python3', [path.join(ROOT, 'tools/blocks/patch-wording.py'), '--check'].concat(F.map(f => path.join(NBH, f.file))), {encoding:'utf8'});
  ok('1 patch-wording.py --check: every form and nbh-wording.js current', /already current .*nbh-wording\.js/.test(out) && !/STALE/.test(out));
  execFileSync('python3', [path.join(ROOT, 'tools/pwa-sw.py'), '--check', NBH]);
  const sw = fs.readFileSync(path.join(NBH, 'sw.js'), 'utf8'), rel = JSON.parse(fs.readFileSync(path.join(NBH, 'release.json'), 'utf8'));
  ok('1 sw.js lists both; release.json has their length and hash; pwa-sw.py --check passes', sw.includes("  'nbh-wording.js',\n") && sw.includes("  'nbh-logo.js',\n") &&
     rel.files['nbh-wording.js'].len === Buffer.byteLength(W) && rel.files['nbh-logo.js'].len === Buffer.byteLength(L));
  if (fs.existsSync(path.join(RPS, 'nbh-logo.js'))) {
    const RL = fs.readFileSync(path.join(RPS, 'nbh-logo.js'), 'utf8');
    ok('1 the school edition has both, its logo its own', /var L="data:image\/webp;base64,/.test(RL) && !RL.includes(L.slice(120, 400)) &&
       fs.readFileSync(path.join(RPS, 'nbh-wording.js'), 'utf8') === WR && WR !== W && JSON.parse(fs.readFileSync(path.join(RPS, 'release.json'), 'utf8')).files['nbh-logo.js'].len === Buffer.byteLength(RL));
  }
  /* every shared script tools/blocks/shared_js.py names (the two above and, once moved, the others): one file, loaded by
     every form once where its inline copy was, listed for the offline copy, copied to the school edition, inline again in
     the one-file editions */
  const SH = [...fs.readFileSync(path.join(ROOT, 'tools/blocks/shared_js.py'), 'utf8').matchAll(/\('(nbh-[a-z-]+)', '(nbh-[a-z-]+\.js)', '/g)].map(m => ({id: m[1], file: m[2]}));
  const moved = SH.filter(x => fs.existsSync(path.join(NBH, x.file)));
  console.log('      shared files beside the forms: ' + moved.map(x => x.file + ' ' + Math.round(fs.statSync(path.join(NBH, x.file)).size / 1024) + ' KB').join(', '));
  bad = [];
  for (const f of F) { const s = fs.readFileSync(path.join(NBH, f.file), 'utf8');
    for (const x of moved) { const tag = '<script id="' + x.id + '" src="' + x.file + '"></script>';
      if (s.split(tag).length !== 2 || s.split('<script id="' + x.id + '"').length !== 2) bad.push(f.id + ' ' + x.id); } }
  ok('1 each form loads every shared file once (' + moved.length + ') and holds no inline copy', moved.length >= 2 && !bad.length, bad.slice(0, 6));
  ok('1 no shared file holds </script or <!--, and each is listed for the offline copy and in the school edition', moved.every(x => { const t = fs.readFileSync(path.join(NBH, x.file), 'utf8');
    return !/<\/script|<!--/i.test(t) && sw.includes("  '" + x.file + "',\n") && rel.files[x.file] && rel.files[x.file].len === Buffer.byteLength(t) && (!fs.existsSync(RPS) || fs.existsSync(path.join(RPS, x.file))); }));
  ok('1 patch-shared.py --check: no form holds an inline copy', /^\d+ forms; the shared files/m.test(execFileSync('python3', [path.join(ROOT, 'tools/blocks/patch-shared.py'), '--check'].concat(F.map(f => path.join(NBH, f.file))), {encoding:'utf8'})));
  for (const [ed, dl] of [['NBH', 'deliver/NBH-Workstation.html'], ['RPS', 'deliver/RPS-Workstation.html']]) {
    const t = fs.readFileSync(path.join(ROOT, dl), 'utf8'), blk0 = id => (new RegExp('<script type="text/plain" id="' + id + '">([^<]*)</script>').exec(t) || [])[1] || '';
    const packed = JSON.parse(zlib.gunzipSync(Buffer.from(blk0('nbh-embed-forms'), 'base64')).toString('utf8')), edDir = ed === 'NBH' ? NBH : RPS;
    const miss = [];
    for (const k of Object.keys(packed)) for (const x of moved.filter(x => x.id !== 'nbh-wording' && x.id !== 'nbh-logo')) {
      const body = fs.readFileSync(path.join(edDir, x.file), 'utf8');
      if (!packed[k].includes('<script id="' + x.id + '">' + body + '</script>') || packed[k].includes(' src="' + x.file + '"')) miss.push(k.slice(0, 5) + ' ' + x.id); }
    ok('1 ' + dl + ': every packed form carries the other shared scripts inline, byte for byte', !miss.length, miss.slice(0, 6));
  }
  for (const [ed, dl] of [['NBH', 'deliver/NBH-Workstation.html'], ['RPS', 'deliver/RPS-Workstation.html']]) {
    const t = fs.readFileSync(path.join(ROOT, dl), 'utf8'), blk = id => (new RegExp('<script type="text/plain" id="' + id + '">([^<]*)</script>').exec(t) || [])[1] || '';
    const packed = JSON.parse(zlib.gunzipSync(Buffer.from(blk('nbh-embed-forms'), 'base64')).toString('utf8')), wd = zlib.gunzipSync(Buffer.from(blk('nbh-embed-wording'), 'base64')).toString('utf8');
    const miss = Object.keys(packed).filter(k => !packed[k].includes('<script id="nbh-wording">@@NBH-WORDING@@</script>') || !packed[k].includes('<script id="nbh-logo">/* the letterhead') || !packed[k].includes('var L="@@NBH-LOGO@@"') || packed[k].includes(' src="nbh-wording.js"') || packed[k].includes(' src="nbh-logo.js"'));
    ok('1 ' + dl + ': the 47 forms carry both inline again, the writing help once', Object.keys(packed).length === 47 && !miss.length && wd === (ed === 'RPS' ? WR : W), miss);
  }

  const browser = await chromium.launch();
  const ctxOf = async () => { const c = await browser.newContext({viewport:{width:1180, height:820}}); await c.addInitScript(() => { window.print = function(){}; }); return c; };
  /* ---- 2. every form on its own: from the website and from file:// */
  for (const [where, url] of [['website', f => BASE + '/NBH-Workstation/' + f.file], ['file://', f => 'file://' + path.join(NBH, f.file)]]) {
    const ctx = await ctxOf(), badF = [], errs = [];
    for (const f of F) {
      const log = [], page = await ctx.newPage(); wire(page, log);
      const failed = []; page.on('requestfailed', r => failed.push(r.url().split('/').pop())); page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().split('/').pop()); });
      await page.goto(url(f)); await sleep(500);
      const r = await probe(page), pe = log.filter(l => l.type === 'pageerror');
      if (!good(r, null, f.id) || r.inline) badF.push(f.id + ' ' + JSON.stringify(r));
      if (pe.length || failed.some(x => /nbh-(wording|logo)\.js/.test(x))) errs.push(f.id + ' ' + JSON.stringify(pe.concat(failed)).slice(0, 200));
      await page.close();
    }
    ok('2 ' + where + ': all 47 forms on their own start the writing help (rules, a finding, its button over a field) and fill the letterhead', !badF.length, badF.map(x => x.slice(0, 260)));
    ok('2 ' + where + ': no page error, both files load', !errs.length, errs.slice(0, 4));
    await ctx.close();
  }
  /* ---- 3. in the shell, and in an Own tab */
  {
    const ctx = await ctxOf(), log = [], page = await ctx.newPage(); wire(page, log);
    await page.goto(BASE + '/NBH-Workstation/index.html'); await sleep(900);
    const ids = ['OB-1', 'TD-1', 'CF-1', 'TK-1', 'IA-1', 'SV-1'], badS = [];
    for (const id of ids) {
      await page.evaluate(i => openForm(i), id); await page.waitForFunction(i => !!state.status[i], id, {timeout:30000}); await sleep(400);
      const eh = await page.evaluateHandle(i => state.frames[i], id), fr = eh && await eh.asElement().contentFrame();
      const r = fr ? await probe(fr) : null; if (!good(r)) badS.push(id + ' ' + JSON.stringify(r));
    }
    ok('3 the shell: ' + ids.join(', ') + ' open with the writing help and the letterhead', !badS.length, badS);
    await page.evaluate(i => openForm(i), 'OB-1'); await sleep(400);
    const [pop] = await Promise.all([ctx.waitForEvent('page'), page.evaluate(() => document.getElementById('popOut').click())]);
    const plog = []; wire(pop, plog); await pop.waitForLoadState('load'); await sleep(700);
    const r = await probe(pop);
    ok('3 Own tab (the folder edition): OB-1 with the writing help and the letterhead', good(r) && /nbh-wording\.js$/.test(r.src), r);
    ok('3 no page error in the shell or the Own tab', !log.concat(plog).some(l => l.type === 'pageerror'), log.concat(plog).filter(l => l.type === 'pageerror'));
    await ctx.close();
  }
  /* ---- 4. the one-file editions, from a double-click: srcdoc frames and the Own tab (a blob) */
  for (const [dl, logo] of [['deliver/NBH-Workstation.html', 'data:image/png;base64,'], ['deliver/RPS-Workstation.html', 'data:image/webp;base64']]) {
    const ctx = await ctxOf(), log = [], page = await ctx.newPage(); wire(page, log);
    await page.goto('file://' + path.join(ROOT, dl)); await page.waitForFunction(() => typeof openForm === 'function', null, {timeout:30000}); await sleep(800);
    const ids = ['OB-1', 'TD-1', 'TK-1', 'DD-1'], badS = [];
    for (const id of ids) {
      await page.evaluate(i => openForm(i), id); await page.waitForFunction(i => !!state.status[i], id, {timeout:40000}); await sleep(500);
      const eh = await page.evaluateHandle(i => state.frames[i], id), fr = eh && await eh.asElement().contentFrame();
      const r = fr ? await probe(fr) : null; if (!good(r, logo) || !r.inline) badS.push(id + ' ' + JSON.stringify(r));
    }
    ok('4 ' + dl + ': ' + ids.join(', ') + ' open (srcdoc) with the writing help inline and the letterhead', !badS.length, badS);
    await page.evaluate(i => openForm(i), 'OB-1'); await sleep(400);
    const [pop] = await Promise.all([ctx.waitForEvent('page'), page.evaluate(() => document.getElementById('popOut').click())]);
    const plog = []; wire(pop, plog); await pop.waitForLoadState('load'); await sleep(800);
    const r = await probe(pop);
    ok('4 ' + dl + ': Own tab (a blob) with the writing help inline and the letterhead', good(r, logo) && r.inline, r);
    ok('4 ' + dl + ': no page error', !log.concat(plog).some(l => l.type === 'pageerror'), log.concat(plog).filter(l => l.type === 'pageerror').slice(0, 3));
    await ctx.close();
  }
  /* ---- 5. the school edition's forms on their own */
  if (fs.existsSync(path.join(RPS, 'nbh-logo.js'))) {
    const ctx = await ctxOf(), badR = [];
    for (const f of F.filter((x, i) => i % 5 === 0)) {
      const log = [], page = await ctx.newPage(); wire(page, log);
      await page.goto(BASE + '/RPS-Workstation/' + f.file); await sleep(500);
      const r = await probe(page); if (!good(r, 'data:image/webp;base64') || log.some(l => l.type === 'pageerror')) badR.push(f.id + ' ' + JSON.stringify(r));
      await page.close();
    }
    ok('5 the school edition: forms on their own load both files, with the school\'s letterhead', !badR.length, badR.slice(0, 3));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? 'RESULT: ' + fails + ' failure(s)' : 'RESULT: all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
