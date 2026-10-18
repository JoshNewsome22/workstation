/* v22.24 QS-1's staff quick start on paper (review F482): no word under 7.5 pt (its labels, notes and figure words printed
   at 6-6.8 pt). v22.26 the body larger, as approved from the preview: about 10 pt on paper (it was 7.9), the handout's
   sections running on over five pages, then the flow sheet as it was; each page's last line clear of its foot, and one
   footer a page (the confidentiality line and "Page N of 6"), not the handout's own as well; v22.48 the reading check is a
   seventh page. Simulated student only.
   usage: node qa/v2224-qs1-print-test.js */
const L = require(__dirname + '/lib.js'); const { execFileSync } = require('child_process');
const OUT = __dirname + '/out/v2224'; L.fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined && !c ? '  ' + JSON.stringify(i).slice(0, 600) : '')); if (!c) fails++; };
const info = file => JSON.parse(execFileSync('python3', ['-I', '-c', `import sys,json,pymupdf as f
d=f.open(sys.argv[1]);out=[]
for p in d:
  sz=[s['size'] for b in p.get_text('dict')['blocks'] for l in b.get('lines',[]) for s in l['spans'] if s['text'].strip()]
  low=max([b[3] for b in p.get_text('blocks') if b[3]<p.rect.height-30] or [0])
  t=p.get_text();import re;pg=re.findall(r'Page \\d+ of \\d+',t)
  out.append([min(sz) if sz else 99, max(set(sz),key=sz.count) if sz else 0, low, p.rect.height, t.count('Confidential student record'), pg[0] if len(pg)==1 else str(pg)])
print(json.dumps(out))`, file], { encoding: 'utf8' }));
(async () => {
  const br = await L.chromium.launch(); const errs = [];
  try {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
    p.on('dialog', d => d.accept().catch(() => {})); p.on('pageerror', e => errs.push(e.message));
    const f = L.forms().find(x => x.id === 'QS-1'); await p.goto(L.BASE + '/NBH-Workstation/' + encodeURI(f.file)); await L.sleep(1500); await L.loadSim(p); await L.sleep(2500);
    await p.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await p.emulateMedia({ media: 'print' });
    const file = OUT + '/qs1.pdf'; L.fs.writeFileSync(file, await p.pdf({ preferCSSPageSize: true, printBackground: true }));
    const P = info(file), small = Math.min(...P.map(x => x[0])), body = P.map(x => Math.round(x[1] * 10) / 10);
    ok('1 the staff quick start prints on seven pages (five for the handout, then the flow sheet, then the reading check)', P.length === 7, P.length);
    ok('2 no word on them under 7.5 pt (smallest ' + small.toFixed(1) + ' pt)', small >= 7.45, P.map(x => x[0].toFixed(1)));
    ok('3 the handout\'s body prints at about 10 pt (' + body.slice(0, 5).join(', ') + ' pt) and each page\'s last line stays clear of its foot', body.slice(0, 5).every(b => b >= 9.2 && b <= 10.4) && P.every(x => x[2] < x[3] - 36), { body, low: P.map(x => Math.round(x[2])) });
    ok('3b one footer a page: the confidentiality line once and "Page N of 7"', P.every((x, i) => x[4] === 1 && x[5] === 'Page ' + (i + 1) + ' of 7'), P.map(x => [x[4], x[5]]));
    await p.emulateMedia({ media: 'screen' });
    const scr = await p.evaluate(() => { const e = document.querySelector('.qs-kick,.qs-lab'); return e ? getComputedStyle(e).fontSize : ''; });
    ok('4 on screen the labels keep their screen size (' + scr + ', the screen polish\'s; the rule is for paper)', scr === '11px', scr);
    ok('5 no page errors', !errs.length, errs.slice(0, 3));
  } catch (e) { ok('crashed', false, String(e.stack || e)); }
  await br.close(); console.log(fails ? 'RESULT: ' + fails + ' failed' : 'RESULT: all passed'); process.exit(fails ? 1 : 0);
})();
