/* The writing help (tools/blocks/nbh-wording.js) in the pilot form OB-1: the Improve wording button on the narrative
   fields, the offline checker, Use this text, and the Rewrite with Claude client against a local stand-in for the relay
   (qa/wording-mock-relay.js, started here). It also checks what the panel must never do: change the form's saved file
   or the workstation's snapshot (positional keys included), leak the session token into either, let typing in the panel
   reach the form's own shortcuts, run past the edge of a 390, 820 or 1180 px screen, or print.
   The checker's own assertions use the small rule set below (injected into the page), so they hold whatever the rules
   file holds; the rules file itself gets a smoke check. The relay address is injected the same way (the built-in one,
   https://newsomebh.com/ai, is another site from the test server: "set up for the forms on newsomebh.com").
   usage: node qa/wording-client-test.js       (a server on :8123 serving the repository, as for every check here)
   env: WS_URL (default http://localhost:8123; the mock answers CORS for that origin), WORDING_SHOTS (screenshots, default
   qa/out/wording-client), MOCK_PORT (default: any free port), AXE_DIR (a node_modules holding axe-core, for the accessibility
   pass), WORDING_ONLY (a comma list of sections to run, e.g. 10,11)
   sections: 0 the block, 1 the buttons, 2 the saved file and the snapshot, 3 Check wording, the keyboard and the Live
   Recorder, 4 Rewrite with Claude, 5 where it cannot work, 6 the three widths, 7 print, 8 accessibility, 9 the one-file
   edition, 10 de-identification and putting names back, 11 Check wording with the rules as built, 12 the button in a
   two-row field, 13 the rewrite service not there yet (not uploaded, not set up, not reachable) */
const {chromium, fs, path, ROOT, sleep, wire} = require(__dirname + '/lib.js');
const {spawn, execFileSync} = require('child_process');
const os = require('os');
const BASE = process.env.WS_URL || 'http://localhost:8123';
const ORIGIN = new URL(BASE).origin;
const MPORT = process.env.MOCK_PORT || '0';   /* 0: any free port, read from the mock's first line */
let RELAY = '';
const SHOTS = process.env.WORDING_SHOTS || path.join(__dirname, 'out', 'wording-client');
fs.mkdirSync(SHOTS, {recursive:true});
const FILE = 'OB-1_Direct-Observation-Record_v2026-09.html';
const FORM_PATH = path.join(ROOT, 'NBH-Workstation', FILE);
const FORM_URL = BASE + '/NBH-Workstation/' + FILE;
const CODE = '7KQ-M4P-2XD-V9H';
const FIXTURE = JSON.stringify({version:'qa-fixture', rules:[
  {id:'emo-angry', cat:'internal', re:'(?:was |got |became )?(?:angry|mad)', flags:'i', why:'Anger is a feeling the observer infers.', suggest:'Describe what was seen and heard.'},
  {id:'emo-upset', cat:'internal', re:'(?:was |got |became )?upset(?! (?:the|a|his|her|their) )', flags:'i', why:'Upset names a feeling, not a behavior.', suggest:'Name what the learner did.', replace:'[describe what you saw]'},
  {id:'lab-tantrum', cat:'label', re:'(?:had a |a )?(?:tantrum|meltdown)s?', flags:'i', why:'A label summarises many behaviors.', suggest:'List the behaviors and how long they lasted.'},
  {id:'freq-alot', cat:'frequency', re:'a lot', flags:'i', why:'A lot does not say how many times.', suggest:'Give the count.', replace:'[number] times'},
  {id:'int-very', cat:'intensity', re:'(very|really) (\\w+)', flags:'i', why:'Very adds emphasis without a measure.', suggest:'Drop the intensifier.', replace:'$2'}
]});

let failed = 0, passed = 0;
function ok(cond, msg, extra){ if (cond) passed++; else failed++; console.log((cond ? 'PASS ' : 'FAIL ') + msg + (!cond && extra !== undefined ? '  -- ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 400) : '')); }
const J = JSON.stringify;
/* one section failing (a timeout, a missing element) is reported and the next one still runs */
async function section(name, fn){
  if (process.env.WORDING_ONLY && process.env.WORDING_ONLY.split(',').indexOf(name) < 0) return;   /* WORDING_ONLY=10,11: those sections only */
  try { await fn(); } catch (e) { ok(false, name + ' stopped: ' + String(e && e.stack || e).split('\n').slice(0, 4).join(' | ')); }
}
/* the network errors a failing relay call logs on purpose (a 401, a 429, offline) are expected in the error steps */
const EXPECTED = /Failed to load resource: (the server responded with a status of (401|403|413|429|503)|net::ERR_INTERNET_DISCONNECTED)/;
function errorsIn(log, from){ return log.slice(from || 0).filter(l => !(l.type === 'error' && EXPECTED.test(l.text))); }

/* helpers inside the page */
const HELPERS = `window.__w = {
  root(){ const h = document.getElementById('nbh-wording-ui'); return h && h.shadowRoot; },
  pills(){ const r = this.root(); return r ? [...r.querySelectorAll('.iw')].filter(b => !b.classList.contains('away')).map(b => {
    const q = b.querySelector('.pl').getBoundingClientRect(); return {b, x:q.left + q.width / 2, y:q.top + q.height / 2, q}; }) : []; },
  vis(t){ return !!t.getClientRects().length && getComputedStyle(t).visibility !== 'hidden'; },
  over(t){ const r = t.getBoundingClientRect(); return this.pills().filter(p => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom)[0] || null; },
  at(sel){ const p = this.over(document.querySelector(sel)); return p ? {x:p.x, y:p.y, label:p.b.getAttribute('aria-label'), at:p.b.getAttribute('data-at'), n:p.b.querySelector('.bd').textContent} : null; },
  dlg(){ const r = this.root(); return r && r.querySelector('dialog.pn'); },
  q(sel){ const r = this.root(); return r && r.querySelector(sel); },
  qa(sel){ const r = this.root(); return r ? [...r.querySelectorAll(sel)] : []; },
  text(sel){ const e = this.q(sel); return e ? e.textContent : null; },
  tab2(){ const e = this.q('#tp2'); return e ? e.innerText : ''; },
  cards(){ return this.qa('#fds li').map(li => ({cat:li.querySelector('.cat').textContent, mark:li.querySelector('mark').textContent,
    btns:[...li.querySelectorAll('button')].map(b => b.textContent)})); },
  click(sel, text){ const l = this.qa(sel).filter(b => text === undefined || b.textContent.trim() === text || (b.getAttribute('aria-label') || '') === text);
    if (!l.length) throw new Error('no ' + sel + ' ' + (text || '')); l[0].click(); return true; },
  answer(){ const d = this.q('div.ans'); if (!d) return null; const c = d.cloneNode(true); c.querySelectorAll('del').forEach(x => x.remove()); return c.textContent; },
  caret(t){ const cs = getComputedStyle(t), m = document.createElement('div'), s = m.style;
    ['boxSizing','width','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderStyle','paddingTop','paddingRight','paddingBottom','paddingLeft',
     'fontStyle','fontVariant','fontWeight','fontStretch','fontSize','fontFamily','lineHeight','letterSpacing','wordSpacing','textTransform','textIndent','tabSize'].forEach(k => { s[k] = cs[k]; });
    s.position = 'fixed'; s.left = '-9000px'; s.top = '0'; s.visibility = 'hidden'; s.whiteSpace = 'pre-wrap'; s.overflowWrap = 'break-word'; s.height = 'auto';
    m.textContent = t.value.slice(0, t.selectionEnd); const sp = document.createElement('span'); sp.textContent = t.value.slice(t.selectionEnd) || '.'; m.appendChild(sp);
    document.documentElement.appendChild(m);
    const r = t.getBoundingClientRect(), z = r.width / t.offsetWidth, lh = parseFloat(cs.lineHeight) || 18;
    const x = r.left + (sp.offsetLeft + parseFloat(cs.borderLeftWidth) - t.scrollLeft) * z, y = r.top + (sp.offsetTop + parseFloat(cs.borderTopWidth) - t.scrollTop) * z;
    m.remove(); return {left:x - 1, right:x + 2, top:y, bottom:y + lh * z}; },
  overflow(){ const d = document.documentElement, out = [];
    if (d.scrollWidth > d.clientWidth + 1) out.push('page ' + d.scrollWidth + ' > ' + d.clientWidth);
    this.qa('dialog.pn, .pb, .ce, .ct, .tp, .fd, .sty, pre.sent, div.ans, .pf').forEach(e => { if (e.getClientRects().length && e.scrollWidth > e.clientWidth + 1) out.push((e.className || e.tagName) + ' ' + e.scrollWidth + ' > ' + e.clientWidth); });
    const dl = this.dlg(); if (dl && dl.open) { const r = dl.getBoundingClientRect(); if (r.left < -1 || r.right > innerWidth + 1) out.push('dialog ' + Math.round(r.left) + '..' + Math.round(r.right) + ' in ' + innerWidth); }
    return out; }
};`;

async function startMock(){
  const child = spawn(process.execPath, [path.join(__dirname, 'wording-mock-relay.js'), '--port', String(MPORT), '--origin', ORIGIN], {stdio:['ignore', 'pipe', 'inherit']});
  let line = '';
  child.stdout.on('data', d => { line += d; const m = /on (http:\/\/localhost:\d+)/.exec(line); if (m && !RELAY) RELAY = m[1]; });
  for (let i = 0; i < 50; i++) { if (RELAY) { try { const r = await fetch(RELAY + '/__ping'); if (r.ok) { console.log('      mock relay at ' + RELAY); return child; } } catch (e) {} } await sleep(100); }
  child.kill(); throw new Error('the mock relay did not start');
}
const mock = async (route, body) => (await fetch(RELAY + route, {method: body ? 'POST' : 'GET', headers:{'Content-Type':'application/json'}, body: body ? J(body) : undefined})).json();

/* the form as served, with the relay address and/or the rule set swapped in; or with the block cut back out */
function variant(html, opt){
  if (opt.without) return html.replace(/\n<script id="nbh-wording">[\s\S]*?<\/script>\n\n/, '\n');
  if (opt.relay !== undefined) html = html.replace(/window\.nbhWordingConfig=\n\{[^\n]*\}/, () => 'window.nbhWordingConfig=\n' + J({relay:opt.relay}));
  if (opt.rules) html = html.replace(/window\.nbhWordingRules=\n[\s\S]*?\n;\nwindow\.nbhWordingConfig=/, () => 'window.nbhWordingRules=\n' + opt.rules + '\n;\nwindow.nbhWordingConfig=');
  return html;
}
/* The relay address and the rule set are injected as read-only globals before any script runs, so the block's own
   assignments to them (sloppy-mode script, outside the client) leave them as set. (A page served through
   route.fulfill has no network address, and Chromium then refuses its calls to localhost: the mock could not be
   reached that way.) Math.random is seeded, since OB-1's simulation marks intervals at random and two loads of it
   must save the same file. */
async function context(browser, opt, vp){
  const ctx = await browser.newContext({viewport: vp || {width:1180, height:820}, acceptDownloads:true});
  await ctx.addInitScript({content: HELPERS});
  await ctx.addInitScript(() => { window.print = function(){}; let x = 20261004; Math.random = () => { x = (x * 48271) % 2147483647; return (x - 1) / 2147483646; }; });
  if (opt && (opt.relay !== undefined || opt.rules)) {
    await ctx.addInitScript(o => {
      if (o.relay !== undefined) Object.defineProperty(window, 'nbhWordingConfig', {value: Object.freeze({relay:o.relay}), writable:false, configurable:false});
      if (o.rules) Object.defineProperty(window, 'nbhWordingRules', {value: JSON.parse(o.rules), writable:false, configurable:false});
    }, {relay: opt.relay, rules: opt.rules || null});
  }
  if (opt && opt.without) {
    await ctx.route(u => u.pathname.endsWith('/' + FILE), async route => {
      const resp = await route.fetch(); const body = variant(await resp.text(), opt);
      await route.fulfill({response: resp, body, headers: Object.assign({}, resp.headers(), {'content-type':'text/html; charset=utf-8', 'content-length': String(Buffer.byteLength(body))})});
    });
  }
  return ctx;
}
async function openForm(ctx, log, url){
  const page = await ctx.newPage(); wire(page, log);
  await page.goto(url || FORM_URL); await sleep(600);
  await page.evaluate(() => { window.confirm = () => true; });
  return page;
}
async function sim(target){ await target.evaluate(() => { window.confirm = () => true; document.getElementById('simBtn').click(); }); await sleep(1300); }
async function view(target, v){ await target.evaluate(x => document.querySelector('#viewSeg button[data-view="' + x + '"]').click(), v); await sleep(350); }
async function saved(page){
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => document.getElementById('saveBtn').click())]);
  return fs.readFileSync(await dl.path(), 'utf8');
}
async function typeInto(page, sel, text){
  await page.evaluate(s => { const t = document.querySelector(s); t.scrollIntoView({block:'center'}); }, sel); await sleep(150);
  await page.click(sel); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('Backspace');
  await page.keyboard.type(text, {delay:2}); await sleep(250);
}
async function clickButtonOf(page, sel){
  await page.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); await sleep(250);
  const c = await page.evaluate(s => __w.at(s), sel);
  if (!c) throw new Error('no Improve wording button over ' + sel);
  await page.mouse.click(c.x, c.y); await sleep(350);
  return c;
}
const isOpen = page => page.evaluate(() => { const d = __w.dlg(); return !!(d && d.open); });
const editor = page => page.evaluate(() => __w.q('#ed').value);
async function tab(page, i){ await page.evaluate(n => __w.q('#tb' + n).click(), i); await sleep(200); }
async function shot(page, name){ await page.screenshot({path: path.join(SHOTS, name)}); console.log('      shot ' + name); }
async function waitTab2(page, re, ms){ const t0 = Date.now(); while (Date.now() - t0 < (ms || 8000)) { const t = await page.evaluate(() => __w.tab2()); if (re.test(t)) return t; await sleep(100); } return page.evaluate(() => __w.tab2()); }

(async () => {
  const html = fs.readFileSync(FORM_PATH, 'utf8');
  const client = fs.readFileSync(path.join(ROOT, 'tools/blocks/nbh-wording.js'), 'utf8');
  const config = fs.readFileSync(path.join(ROOT, 'tools/blocks/nbh-wording-config.json'), 'utf8');
  const rulesPath = path.join(ROOT, 'tools/blocks/nbh-wording-rules.json');
  const rules = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : null;

  /* ---- 0. the block in the form */
  const nBlocks = (html.match(/\n<script id="nbh-wording">/g) || []).length;
  ok(nBlocks === 1, '0 OB-1 holds exactly one <script id="nbh-wording">', nBlocks);
  const block = (html.match(/<script id="nbh-wording">([\s\S]*?)<\/script>/) || [])[1] || '';
  ok(block.includes(client) && html.split(client).length === 2, '0 the client in OB-1 is nbh-wording.js byte for byte, once');
  ok(block.includes('window.nbhWordingConfig=\n' + config + '\n;'), '0 the config in OB-1 is nbh-wording-config.json byte for byte');
  if (rules) ok(block.includes('window.nbhWordingRules=\n' + rules + '\n;'), '0 the rules in OB-1 are nbh-wording-rules.json byte for byte');
  else console.log('note  the rules file is not there yet: OB-1 was built with a fixture');
  ok(html.indexOf('<script id="nbh-wording">') < html.indexOf('<script>\n"use strict";'), '0 the block sits before the form\'s own script');
  ok(!/claude-[a-z]+-\d/i.test(client + config + (rules || '')), '0 no model ID in the client, the config or the rules');

  const child = await startMock();
  const browser = await chromium.launch();
  const log = [];
  try {
    /* ---- 1. the buttons, with the rules as built */
    await section('1', async () => {
      const ctx = await context(browser, null), page = await openForm(ctx, log);
      const st = await page.evaluate(() => nbhWording.status());
      const builtIn = JSON.parse(config).relay, wantPlan = !builtIn ? 'unset' : new URL(builtIn).hostname.replace(/^www\./, '') === new URL(BASE).hostname.replace(/^www\./, '') ? 'ready' : 'site';
      ok(st.relay === wantPlan && st.rules > 0 && st.badRules === 0, '1 status: rules compiled, the built-in relay address (' + (builtIn || 'none') + ') reads as "' + wantPlan + '" from ' + BASE, st);
      const rulesInfo = await page.evaluate(() => nbhWording.rules());
      console.log('      rules as built: ' + rulesInfo.count + ' (version ' + rulesInfo.version + ')');
      const smoke = await page.evaluate(() => nbhWording.check('He was very angry and had a tantrum a lot. She said "I am so angry" and upset the cup.'));
      ok(smoke.length >= 1, '1 the rules as built flag a plainly subjective sentence (' + smoke.map(f => f.text).join(' | ') + ')');
      ok(!smoke.some(f => /so angry/i.test(f.text) && f.start > 40 && f.start < 70), '1 the rules as built leave quoted speech alone');
      ok((await page.evaluate(() => __w.pills().length)) === 0, '1 an empty form shows no button');
      await sim(page); await view(page, 'obs');
      const geo = await page.evaluate(() => {
        const tas = [...document.querySelectorAll('textarea')].filter(t => __w.vis(t) && /\S/.test(t.value) && !t.closest('[data-nbh-nowording],.toolbar'));
        const pills = __w.pills(), used = new Set();
        const miss = tas.filter(t => { const p = __w.over(t); if (p) used.add(p.b); return !p; }).map(t => t.getAttribute('aria-label') || t.dataset.field);
        const hidden = [...document.querySelectorAll('textarea')].filter(t => !__w.vis(t)).length;
        const tb = document.querySelector('.toolbar').getBoundingClientRect();
        const inBar = pills.filter(p => p.y >= tb.top && p.y <= tb.bottom && p.x >= tb.left && p.x <= tb.right && getComputedStyle(document.querySelector('.toolbar')).position !== 'sticky').length;
        return {tas:tas.length, pills:pills.length, miss, stray:pills.filter(p => !used.has(p.b)).length, hidden, inBar};
      });
      ok(geo.tas > 10 && geo.miss.length === 0, '1 every visible narrative field with text has its button (' + geo.tas + ')', geo);
      ok(geo.pills === geo.tas && geo.stray === 0, '1 no button without a visible field under it (' + geo.hidden + ' hidden fields have none)', geo);
      /* a hidden field: the Setup fields are hidden on this view, and come back with their buttons on Setup */
      await view(page, 'setup');
      const setup = await page.evaluate(() => ({def: !!__w.over(document.querySelector('textarea[data-meta="definition"]')), obs: [...document.querySelectorAll('#obsPages textarea')].some(t => __w.vis(t))}));
      ok(setup.def && !setup.obs, '1 switching views: the Setup fields get buttons, the hidden sheets none', setup);
      /* opting out */
      await page.evaluate(() => document.querySelector('textarea[data-meta="definition"]').setAttribute('data-nbh-nowording', '')); await sleep(250);
      ok(!(await page.evaluate(() => !!__w.over(document.querySelector('textarea[data-meta="definition"]')))), '1 a field marked data-nbh-nowording has no button');
      await page.evaluate(() => document.querySelector('textarea[data-meta="definition"]').removeAttribute('data-nbh-nowording'));
      /* focus or text: an empty field shows it only while focused */
      await view(page, 'obs');
      await page.evaluate(() => document.querySelector('#obsPages button.addRow').click()); await sleep(300);
      const emptySel = '#obsPages textarea[data-obs="0"][data-row="6"]';
      ok(!(await page.evaluate(s => !!__w.over(document.querySelector(s)), emptySel)), '1 an empty field without focus has no button');
      await page.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), emptySel); await page.click(emptySel); await sleep(250);
      const foc = await page.evaluate(s => __w.at(s), emptySel);
      ok(!!foc && /Improve wording/.test(foc.label), '1 the empty field shows its button while it has focus', foc);
      const tb = await page.evaluate(s => { const t = document.querySelector(s).getBoundingClientRect(), p = __w.over(document.querySelector(s)).q; return {inside: p.left >= t.left && p.right <= t.right + 1 && p.top >= t.top && p.bottom <= t.bottom + 1, h: Math.round(p.height), wide: p.width > 100}; }, emptySel);
      ok(tb.inside && tb.wide, '1 the focused field\'s button sits inside its corner with its label', tb);
      const hit = await page.evaluate(s => { const p = __w.over(document.querySelector(s)); const r = p.b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }, emptySel);
      ok(hit[0] >= 44 && hit[1] >= 44, '1 the touch target is at least 44 x 44 px', hit);
      /* the caret: word by word, the button never covers it; it moves to the top corner, or out of the way */
      const words = 'Student pushes the worksheet to the edge of the desk and puts his head down on his arms; the paraprofessional waits beside him and no adult speaks to him for the next minute or so, then he lifts his head and picks up the pencil'.split(' ');
      let cover = 0, moved = 0, steps = 0;
      for (const w of words) {
        await page.keyboard.type(w + ' ', {delay:1}); await sleep(70); steps++;
        const g = await page.evaluate(s => { const t = document.querySelector(s), c = __w.caret(t); const b = __w.root().querySelector('.iw:not(.away)'); const p = b && __w.over(t);
          const q = p && p.q; const hitp = !!q && !(c.right < q.left || c.left > q.right || c.bottom < q.top || c.top > q.bottom);
          return {hitp, at: p ? p.b.getAttribute('data-at') : 'away'}; }, emptySel);
        if (g.hitp) cover++; if (g.at !== 'br') moved++;
      }
      ok(cover === 0, '1 typing ' + steps + ' words into a field, the button never covers the caret', {cover});
      ok(moved > 0, '1 ... it moved out of the caret\'s way ' + moved + ' times', {moved});
      await page.keyboard.press('Enter'); await sleep(300);
      const a2 = await page.evaluate(s => __w.at(s), emptySel);
      ok(!!a2 && a2.at === 'br', '1 with the caret on a fresh line, the button is back at the bottom corner', a2);
      /* one-line field: the caret at its end hides the button rather than covering it */
      await view(page, 'setup');
      await typeInto(page, 'textarea[data-meta="peerBy"]', 'classroom teacher');
      await page.keyboard.press('Home'); await sleep(200);
      const one = await page.evaluate(() => { const p = __w.over(document.querySelector('textarea[data-meta="peerBy"]')); return p ? p.b.getAttribute('data-at') : 'none'; });
      ok(one === 'br' || one === 'tr', '1 a one-line field: the button shows while the caret is away from the corner', one);
      ok(errorsIn(log).length === 0, '1 no console errors', errorsIn(log));
      await ctx.close();
    });

    /* ---- 2. the saved file and the workstation's snapshot are the same shape with the panel (and as without it) */
    await section('2', async () => {
      const lg = [];
      const grabAll = async (ctx) => {
        const page = await ctx.newPage(); wire(page, lg);
        await page.goto(BASE + '/NBH-Workstation/index.html'); await page.waitForFunction(() => typeof openForm === 'function'); await sleep(500);
        await page.evaluate(() => openForm('OB-1')); await page.waitForFunction(() => !!state.status['OB-1'], null, {timeout:20000}); await sleep(500);
        const fr = page.frames().find(f => f.url().includes(FILE));
        await sim(fr); await view(fr, 'obs');
        return {page, fr};
      };
      const snap = page => page.evaluate(async () => { const r = await grab('OB-1', 'snapshot', null, 8000); return r && r.snap; });
      const ctxA = await context(browser, {without:true}), A = await grabAll(ctxA);
      const sA = await snap(A.page);
      const ctxB = await context(browser, null), Bv = await grabAll(ctxB);
      const has = await Bv.fr.evaluate(() => !!window.nbhWording);
      ok(has && !(await A.fr.evaluate(() => !!window.nbhWording)), '2 the baseline frame runs without the block, the other with it');
      const s1 = await snap(Bv.page);
      const keysA = Object.keys(sA.data), keys1 = Object.keys(s1.data);
      const posA = keysA.filter(k => k[0] === '~').length;
      ok(sA.total === s1.total && J(keysA) === J(keys1), '2 the snapshot has the same controls and keys as OB-1 without the block (' + s1.total + ' controls, ' + posA + ' positional)', {a:sA.total, b:s1.total});
      const strip = s => J(Object.assign({}, s, {own: s.own && JSON.parse(s.own)}));
      ok(J(sA.data) === J(s1.data) && sA.own === s1.own, '2 ... and the same values and the same saved file');
      /* the panel open, then closed without using it */
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const c = await Bv.fr.evaluate(s => { document.querySelector(s).scrollIntoView({block:'center'}); return null; }, sel); await sleep(300);
      const pos = await Bv.fr.evaluate(s => __w.at(s), sel);
      const box = await (await Bv.fr.frameElement()).boundingBox();
      await Bv.page.mouse.click(box.x + pos.x, box.y + pos.y); await sleep(400);
      ok(await Bv.fr.evaluate(() => __w.dlg().open), '2 the panel opens inside the workstation\'s frame');
      await Bv.fr.evaluate(() => { const e = __w.q('#ed'); e.value = e.value + ' and was very upset'; e.dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(300);
      const s2 = await snap(Bv.page);
      ok(strip(s2) === strip(s1), '2 the snapshot while the panel is open (text edited in it) is unchanged');
      await Bv.fr.evaluate(() => __w.click('#cancel')); await sleep(300);
      const s3 = await snap(Bv.page);
      ok(strip(s3) === strip(s1), '2 the snapshot after Cancel is unchanged');
      const statusOf = async pg => { await pg.evaluate(() => { state.status['OB-1'] = null; ask(state.frames['OB-1'], 'status'); }); await pg.waitForFunction(() => !!state.status['OB-1'], null, {timeout:5000}); return pg.evaluate(() => state.status['OB-1']); };
      const stA = await statusOf(A.page), stB = await statusOf(Bv.page);
      ok(stA.total === stB.total && stA.filled === stB.filled && stA.sig === stB.sig, '2 the workstation\'s field count and value fingerprint are the same as without the block (' + stB.filled + ' of ' + stB.total + ', ' + stB.sig + ')', {stA, stB});
      /* Escape in the panel closes the panel only; the workstation stays in its fullscreen view */
      await Bv.page.evaluate(() => setFull(true)); await sleep(200);
      const pos2 = await Bv.fr.evaluate(s => { document.querySelector(s).scrollIntoView({block:'center'}); return null; }, sel); await sleep(300);
      const p2 = await Bv.fr.evaluate(s => __w.at(s), sel), box2 = await (await Bv.fr.frameElement()).boundingBox();
      await Bv.page.mouse.click(box2.x + p2.x, box2.y + p2.y); await sleep(350);
      await Bv.fr.evaluate(() => __w.q('#ed').focus()); await Bv.page.keyboard.press('Escape'); await sleep(350);
      ok(!(await Bv.fr.evaluate(() => __w.dlg().open)) && await Bv.page.evaluate(() => fullOn()), '2 Escape in the panel closes it and leaves the workstation in fullscreen');
      await Bv.fr.evaluate(s => document.querySelector(s).focus(), sel); await Bv.page.keyboard.press('Escape'); await sleep(350);
      ok(!(await Bv.page.evaluate(() => fullOn())), '2 ... and Escape in the form itself still leaves fullscreen, as before');
      /* three forms side by side: the panel fills OB-1's narrow pane */
      for (const id of ['MT-1', 'ABC-1']) { await Bv.page.evaluate(i => openForm(i), id); await Bv.page.waitForFunction(i => !!state.status[i], id, {timeout:20000}).catch(() => {}); }
      await Bv.page.evaluate(() => setSplit(['OB-1', 'MT-1', 'ABC-1'])); await sleep(1500);
      ok((await Bv.page.evaluate(() => state.split.length)) === 3, '2 three forms are side by side');
      await Bv.fr.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); await sleep(400);
      const p3 = await Bv.fr.evaluate(s => __w.at(s), sel), box3 = await (await Bv.fr.frameElement()).boundingBox();
      ok(!!p3 && box3.width < 450, '2 side by side (a ' + Math.round(box3.width) + ' px pane): the button is at the field');
      if (p3) { await Bv.page.mouse.click(box3.x + p3.x, box3.y + p3.y); await sleep(400); }
      const o3 = await Bv.fr.evaluate(() => __w.overflow());
      ok(p3 && await Bv.fr.evaluate(() => __w.dlg().open) && o3.length === 0, '2 ... and the panel opens in the pane without running past its edge', o3);
      await shot(Bv.page, 'shell-split-1180x820.png');
      await Bv.fr.evaluate(() => __w.click('#cancel')); await sleep(250);
      await Bv.page.evaluate(() => setSplit([])); await sleep(600);
      /* the shell's packet names the learner too */
      await Bv.page.evaluate(() => { document.getElementById('pClient').value = 'Casey Morgan'; document.getElementById('pSid').value = 'P-77012'; pushPacketTo(state.frames['OB-1']); }); await sleep(400);
      const pk = await Bv.fr.evaluate(() => nbhWording.deidentify('Casey and SIMULATED Student met; P-77012.').text);
      ok(!/Casey|P-77012/.test(pk), '2 a name and ID from the workstation\'s packet are hidden too (' + pk + ')');
      ok(errorsIn(lg).length === 0, '2 no console errors', errorsIn(lg));
      await ctxA.close(); await ctxB.close();
      /* the saved file, standalone: the same with the block as without it, and before and after the panel */
      const ctxC = await context(browser, {without:true}), pc = await openForm(ctxC, lg); await sim(pc);
      const fA = await saved(pc);
      const ctxD = await context(browser, null), pd = await openForm(ctxD, lg); await sim(pd); await view(pd, 'obs');
      const f1 = await saved(pd);
      ok(fA === f1, '2 Save data writes the same file with the block as without it (' + f1.length + ' bytes)');
      await clickButtonOf(pd, sel); await pd.evaluate(() => __w.click('#tb2')); await sleep(200); await pd.evaluate(() => __w.click('#tb3'));
      await pd.evaluate(() => __w.click('#pnX')); await sleep(300);
      const f2 = await saved(pd);
      ok(f2 === f1, '2 Save data after opening and closing the panel writes the same file');
      await ctxC.close(); await ctxD.close();
    });

    /* ---- 3. Check wording, Apply, Use this text (fixture rules) */
    await section('3', async () => {
      const lg = [], ctx = await context(browser, {rules:FIXTURE, relay:''}), page = await openForm(ctx, lg);
      await sim(page); await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const TXT = 'Student was very upset and had a tantrum a lot. He said "I am angry" and was mad.';
      await typeInto(page, sel, TXT);
      await page.click('#obsPages textarea[data-obs="0"][data-row="0"]'); await sleep(250);
      const badge = await page.evaluate(s => __w.at(s), sel);
      ok(badge && badge.n === '5', '3 the button counts the phrases to look at (' + (badge && badge.n) + ')', badge);
      await clickButtonOf(page, sel);
      ok(await isOpen(page), '3 the button opens the panel');
      ok((await editor(page)) === TXT, '3 the panel holds the field\'s text');
      const sub = await page.evaluate(() => __w.text('#pnS'));
      ok(/Observation 1 of 3/.test(sub) && /What happened, entry 2/.test(sub), '3 the panel names the field (' + sub + ')');
      const cards = await page.evaluate(() => __w.cards());
      ok(cards.length === 5 && cards.map(c => c.mark).join('|') === 'very upset|upset|had a tantrum|a lot|was mad', '3 five findings, highlighted, in order', cards.map(c => c.mark));
      ok(!cards.some(c => /I am angry/.test(c.mark)), '3 the quoted words are not flagged');
      ok(cards[3].btns.some(b => b === 'Replace with “[number] times”') && cards[2].btns.indexOf('Ignore') >= 0, '3 a direct replacement offers Apply; every finding offers Ignore', cards[3].btns);
      await page.evaluate(() => __w.click('#fds li:nth-child(4) button', 'Replace with “[number] times”')); await sleep(300);
      const e1 = await editor(page);
      ok(e1 === TXT.replace('a lot', '[number] times'), '3 Apply edits the panel\'s text', e1);
      ok((await page.evaluate(() => __w.cards())).some(c => c.cat === 'Blank to fill in' && c.mark === '[number]'), '3 the blank left by the template is flagged to fill in');
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === TXT, '3 the field is not touched by Apply');
      await page.evaluate(() => __w.click('#undo')); await sleep(250);
      ok((await editor(page)) === TXT, '3 Undo puts the panel\'s text back');
      await page.evaluate(() => __w.click('#fds li:nth-child(4) button', 'Replace with “[number] times”')); await sleep(250);
      await page.evaluate(() => __w.click('#fds li:nth-child(1) button', 'Replace with “upset”')); await sleep(250);
      const e2 = await editor(page);
      ok(e2 === 'Student was upset and had a tantrum [number] times. He said "I am angry" and was mad.', '3 a $2 replacement keeps the word it names', e2);
      await page.evaluate(() => __w.click('#fds button', 'Ignore “had a tantrum”')); await sleep(250);
      ok(!(await page.evaluate(() => __w.cards())).some(c => c.mark === 'had a tantrum'), '3 Ignore takes a finding off the list');
      await shot(page, 'qa-check-1180x820.png');
      await page.evaluate(() => __w.click('#use')); await sleep(300);
      ok(await isOpen(page) && /Still to fill in: \[number\]/.test(await page.evaluate(() => __w.text('#fm'))), '3 Use this text with a blank left in it names the blank first', await page.evaluate(() => __w.text('#fm')));
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === TXT, '3 ... and leaves the field as it was');
      await page.evaluate(() => __w.click('#use')); await sleep(400);
      ok(!(await isOpen(page)), '3 pressed again, Use this text closes the panel');
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === e2, '3 Use this text writes the panel\'s text into the field');
      const sv = JSON.parse(await saved(page));
      ok(sv.obs[0].narrative[1].w === e2, '3 the form recorded it: Save data holds the new wording (input and change fired)', sv.obs[0].narrative[1].w);
      ok(await page.evaluate(() => window.nbhGuard && window.nbhGuard.isDirty()), '3 the form counts it as an unsaved change');
      ok(/new wording/.test(await page.evaluate(() => __w.text('.tst') || '')), '3 a message offers Undo');
      await page.evaluate(() => __w.click('.tst button', 'Undo')); await sleep(300);
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === TXT && JSON.parse(await saved(page)).obs[0].narrative[1].w === TXT, '3 Undo in the message puts the field and the record back');
      /* the selected part only */
      await page.evaluate(s => { const t = document.querySelector(s); t.scrollIntoView({block:'center'}); t.focus(); const i = t.value.indexOf('had a tantrum a lot'); t.setSelectionRange(i, i + 'had a tantrum a lot'.length); }, sel); await sleep(250);
      await clickButtonOf(page, sel);
      ok((await editor(page)) === 'had a tantrum a lot', '3 with words selected, the panel holds only those');
      ok(/the part you selected/.test(await page.evaluate(() => __w.text('#pnS'))), '3 ... and says so');
      await page.evaluate(() => { const e = __w.q('#ed'); e.value = 'screamed and dropped to the floor 3 times in 10 minutes'; e.dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(300);
      await page.evaluate(() => __w.click('#use')); await sleep(350);
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === TXT.replace('had a tantrum a lot', 'screamed and dropped to the floor 3 times in 10 minutes'), '3 Use this text replaces only the selected part');
      /* Cancel keeps the field; the edits wait for the next time */
      const before = await page.evaluate(s => document.querySelector(s).value, sel);
      await page.click('#obsPages textarea[data-obs="0"][data-row="0"]'); await sleep(200);
      await clickButtonOf(page, sel);
      await page.evaluate(() => { const e = __w.q('#ed'); e.value = 'an edit to keep for later'; e.dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(300);
      await page.evaluate(() => __w.click('#cancel')); await sleep(300);
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === before, '3 Cancel leaves the field as it was');
      await clickButtonOf(page, sel);
      ok(!(await page.evaluate(() => __w.q('#edDraft').hidden)), '3 reopened, the panel offers the edits left there');
      await page.evaluate(() => __w.click('#drB')); await sleep(200);
      ok((await editor(page)) === 'an edit to keep for later', '3 Bring them back restores them');
      await page.keyboard.press('Escape'); await sleep(300);
      ok(!(await isOpen(page)) && (await page.evaluate(s => document.querySelector(s).value, sel)) === before, '3 Escape closes like Cancel');
      /* the keyboard: Tab is the form's, as without the block; Alt+Enter in the field opens the panel */
      await page.click(sel); await sleep(150); await page.keyboard.press('End');
      await page.keyboard.press('Tab'); await sleep(150);
      ok(await page.evaluate(s => { const a = document.activeElement; return !!a && a.matches('button.delRow') && a.dataset.row === '1'; }, sel), '3 Tab from the field goes on to the control after it, as without the block (the button is not a stop)',
        await page.evaluate(() => { const a = document.activeElement; return a ? a.outerHTML.slice(0, 80) : ''; }));
      await page.keyboard.press('Shift+Tab'); await sleep(150);
      ok(await page.evaluate(s => document.activeElement === document.querySelector(s), sel), '3 Shift+Tab goes back to the field');
      const bt = await page.evaluate(() => { const b = __w.qa('.iw').filter(x => !x.classList.contains('away'))[0]; return b ? (b.getAttribute('title') || '') + '|' + (b.getAttribute('aria-label') || '') : ''; });
      ok(/Alt\+Enter/.test(bt), '3 the button names the key that opens it from the field', bt);
      await page.keyboard.press('Alt+Enter'); await sleep(350);
      ok(await isOpen(page) && (await page.evaluate(() => __w.root().activeElement && __w.root().activeElement.id)) === 'pnT', '3 Alt+Enter in the field opens the panel with the focus on its title');
      await page.keyboard.press('Escape'); await sleep(300);
      ok(!(await isOpen(page)) && await page.evaluate(s => document.activeElement === document.querySelector(s), sel), '3 closed from the keyboard, the focus is back in the field');
      await clickButtonOf(page, sel); await page.evaluate(() => __w.click('#cancel')); await sleep(300);
      ok(await page.evaluate(() => { const a = __w.root().activeElement; return !!a && /^iw/.test(a.className); }), '3 closed after a tap, the focus is on the field\'s button (an iPad keyboard stays down)');
      await page.keyboard.press('Tab'); await sleep(150);
      ok(await page.evaluate(s => { const a = document.activeElement; return !!a && a.matches('button.delRow') && a.dataset.row === '1'; }, sel), '3 Tab from the button goes on to the control after the field');
      /* typing through the form with Tab fills one field after another, as before */
      await view(page, 'setup');
      await page.click('textarea[data-meta="behavior"]'); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type('Hits', {delay:3});
      await page.keyboard.press('Tab'); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type('Open hand strike', {delay:3}); await sleep(250);
      const tt = await page.evaluate(() => [document.querySelector('textarea[data-meta="behavior"]').value, document.querySelector('textarea[data-meta="definition"]').value]);
      ok(tt[0] === 'Hits' && tt[1] === 'Open hand strike' && !(await isOpen(page)), '3 type, Tab, type fills the next field (and opens nothing)', tt);
      await view(page, 'obs');
      /* typing in the panel never reaches the Live Recorder's keys; keys on a field's button do, as on any button */
      await page.evaluate(() => document.getElementById('obrStart').click()); await sleep(300);
      ok((await page.evaluate(() => obRecorder.state())) === 'run', '3 the Live Recorder is running');
      await page.evaluate(s => { const t = document.querySelector(s); t.scrollIntoView({block:'center'}); t.focus(); t.setSelectionRange(8, 8); }, sel); await sleep(250);
      await page.keyboard.press('Tab'); await sleep(150);
      const r0 = await page.evaluate(() => obRecorder.counts().s);
      await page.keyboard.press('Digit1'); await page.keyboard.press('Digit1'); await sleep(200);
      ok((await page.evaluate(() => obRecorder.counts().s)) === r0 + 2, '3 recording: Tab out of a narrative line (caret mid-text), then 1 twice, counts twice', [r0, await page.evaluate(() => obRecorder.counts())]);
      await clickButtonOf(page, sel); await page.evaluate(() => __w.click('#cancel')); await sleep(300);
      const r1 = await page.evaluate(() => obRecorder.counts().s);
      await page.keyboard.press('Digit1'); await sleep(150);
      ok((await page.evaluate(() => obRecorder.counts().s)) === r1 + 1 && await page.evaluate(() => { const a = __w.root().activeElement; return !!a && /^iw/.test(a.className); }), '3 with the field\'s button focused, 1 is counted');
      await page.keyboard.press('Space'); await sleep(250);
      ok((await page.evaluate(() => obRecorder.state())) !== 'run' && !(await isOpen(page)), '3 ... and Space pauses the recorder (the panel does not open)', await page.evaluate(() => obRecorder.state()));
      await page.keyboard.press('Space'); await sleep(250);
      ok((await page.evaluate(() => obRecorder.state())) === 'run', '3 ... and Space again goes on recording');
      const cBefore = await page.evaluate(() => obRecorder.counts());
      await clickButtonOf(page, sel);
      await page.evaluate(() => __w.q('#ed').focus()); await page.keyboard.type(' 1111 2 3 4 z x', {delay:5}); await page.keyboard.press('Shift+Digit1'); await page.keyboard.press('Space'); await sleep(200);
      const rc = await page.evaluate(() => ({c: obRecorder.counts(), s: obRecorder.state()}));
      ok(rc.c.s === cBefore.s && rc.c.p === cBefore.p && rc.s === 'run', '3 digits, Space and Shift+1 typed in the panel are not counted by the recorder', {cBefore, rc});
      await page.evaluate(() => __w.click('#cancel')); await sleep(200);
      await page.evaluate(() => { document.getElementById('obrEnd').click(); }); await sleep(200);
      await page.evaluate(() => { document.getElementById('obrDiscard').click(); }); await sleep(300);
      /* option 3 with no relay */
      await clickButtonOf(page, sel); await tab(page, 2);
      const t2 = await page.evaluate(() => __w.tab2());
      ok(/Not set up for this copy of the forms\./.test(t2), '3 Rewrite with Claude, no relay: "Not set up for this copy of the forms."', t2);
      await tab(page, 3);
      ok(/Proofread, Rewrite, Professional or Concise/.test(await page.evaluate(() => __w.q('#tp3').innerText)), '3 iPad Writing Tools explains Writing Tools');
      ok(errorsIn(lg).length === 0, '3 no console errors', errorsIn(lg));
      /* print: nothing of it */
      await tab(page, 1);
      await page.emulateMedia({media:'print'}); await sleep(200);
      const pr = await page.evaluate(() => ({host:getComputedStyle(document.getElementById('nbh-wording-ui')).display, dlg:getComputedStyle(__w.dlg()).display,
        pills: __w.qa('.iw').map(b => getComputedStyle(b).display === 'none' || b.getClientRects().length === 0 || getComputedStyle(b.parentNode).display === 'none')}));
      ok(pr.host === 'none' && pr.dlg === 'none', '3 in print, the panel and the buttons are not drawn', pr);
      await page.emulateMedia({media:'screen'});
      const pdf = path.join(os.tmpdir(), 'wording-open.pdf');
      await page.pdf({path:pdf, format:'Letter'});
      let txt = '';
      try { txt = execFileSync('python3', ['-c', 'import sys,pymupdf;d=pymupdf.open(sys.argv[1]);print("".join(p.get_text() for p in d))', pdf], {encoding:'utf8'}); } catch (e) { txt = 'ERR ' + e.message; }
      ok(txt.length > 500 && !/Improve wording|Check wording|Use this text|Rewrite with Claude/.test(txt), '3 a PDF printed with the panel open holds none of it (' + txt.length + ' characters of text)');
      fs.rmSync(pdf, {force:true});
      await ctx.close();
    });

    /* ---- 4. Rewrite with Claude, against the mock relay */
    await section('4', async () => {
      await mock('/__reset', {codes:[CODE, 'ABC-DEF-GHJ-KMN']});
      const lg = [], ctx = await context(browser, {relay:RELAY, rules:FIXTURE}), page = await openForm(ctx, lg);
      await sim(page);
      ok((await page.evaluate(() => nbhWording.status().relay)) === 'ready', '4 the relay address is set for this test');
      await view(page, 'setup');
      await typeInto(page, '#mClient', 'Jordan Ellis'); await typeInto(page, '#mSid', 'S-48213');
      await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const TXT = 'Jordan Ellis was very upset when Ms. Rivera took the worksheet; Jordan (ID S-48213) pushed Marcus a lot.';
      await typeInto(page, sel, TXT);
      await clickButtonOf(page, sel); await tab(page, 2);
      let t = await page.evaluate(() => __w.tab2());
      ok(/Enter the passcode from your BCBA/.test(t) && await page.evaluate(() => !!__w.q('#pc')), '4 not unlocked: a passcode box', t.slice(0, 120));
      ok(/in this tab until the session\u2019s time is up or the tab is closed/.test(t), '4 the panel says how long the session lasts, and where', t.slice(0, 400));
      await page.evaluate(() => { const i = __w.q('#pc'); i.value = 'AAA-BBB-CCC-DDD'; __w.q('form.pc').requestSubmit(); });
      t = await waitTab2(page, /not accepted/);
      ok(/That passcode was not accepted/.test(t), '4 a wrong passcode is refused, plainly', t.slice(0, 200));
      ok((await page.evaluate(() => __w.q('#pc').value)) === 'AAA-BBB-CCC-DDD', '4 ... and stays in the box, to be corrected rather than typed again');
      ok(!(await page.evaluate(() => sessionStorage.getItem('nbh.wording.session'))), '4 ... and nothing is kept');
      await page.evaluate(c => { const i = __w.q('#pc'); i.value = c; __w.q('form.pc').requestSubmit(); }, '7kq m4p 2xd v9h');
      t = await waitTab2(page, /Unlocked/);
      ok(/Unlocked in this tab until/.test(t), '4 the right passcode (typed in lower case with spaces) unlocks this tab', t.slice(0, 160));
      ok(/ends then, or when this tab is closed/.test(t) && /On a shared iPad, press Lock/.test(t) && !/Choose how the text should be rewritten/.test(t), '4 ... with one note on how long it lasts (and Lock), and no second box saying so', t.slice(0, 400));
      ok((await page.evaluate(() => __w.q('#pc'))) === null, '4 the passcode box is gone');
      const ss = await page.evaluate(() => sessionStorage.getItem('nbh.wording.session'));
      const token = ss ? JSON.parse(ss).token : '';
      ok(token.length >= 32, '4 the session token is in sessionStorage');
      ok(!(await page.evaluate(tk => Object.keys(localStorage).some(k => (localStorage.getItem(k) || '').includes(tk)) || document.cookie.includes(tk), token)), '4 ... and not in localStorage or a cookie');
      const again = await fetch(RELAY + '/api/redeem', {method:'POST', headers:{'Content-Type':'application/json', Origin:ORIGIN}, body:J({code:CODE})});
      ok(again.status === 401, '4 the passcode worked once only (a second try is refused)', again.status);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(300);
      t = await page.evaluate(() => __w.tab2());
      ok(/Check what will be sent \(Objective and observable\)/.test(t), '4 a style leads to the privacy step');
      let sent = await page.evaluate(() => __w.text('pre.sent'));
      ok(sent === '[Student] was very upset when Ms. Rivera took the worksheet; [Student] (ID [ID]) pushed Marcus a lot.', '4 the learner\'s name, first name and ID are replaced', sent);
      const maybe = await page.evaluate(() => __w.qa('.sugg .b').map(b => b.textContent));
      ok(maybe.indexOf('+ Rivera') >= 0 && maybe.indexOf('+ Marcus') >= 0, '4 names still in the text are pointed out (' + maybe.join(', ') + ')');
      await page.evaluate(() => { const i = __w.q('#also'); i.value = 'Ms. Rivera'; i.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); }); await sleep(250);
      await page.evaluate(() => __w.click('.sugg .b', '+ Marcus')); await sleep(250);
      sent = await page.evaluate(() => __w.text('pre.sent'));
      ok(sent === '[Student] was very upset when [Name 1] took the worksheet; [Student] (ID [ID]) pushed [Name 2] a lot.', '4 Also hide replaces the names added, as [Name 1], [Name 2]', sent);
      ok(!/Jordan|Ellis|48213|Rivera|Marcus/.test(sent), '4 the preview holds no name');
      const alone = await page.evaluate(() => nbhWording.deidentify('Rivera said no; Ms. Rivera left. Ana Lopez and Lopez came in.', ['Ms. Rivera', 'Ana Lopez']).text);
      ok(alone === '[Name 1] said no; [Name 1] left. [Name 2] and [Name 2] came in.', '4 a name added with a title or a first name is hidden on its own too (' + alone + ')');
      const hid = await page.evaluate(() => __w.text('.hid'));
      ok(/\[Student\] for Jordan Ellis, Jordan/.test(hid) && /\[ID\] for S-48213/.test(hid), '4 the panel lists what it hid (' + hid + ')');
      await shot(page, 'qa-preview-1180x820.png');
      const n0 = (await mock('/__log')).rewrite.length;
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send'));
      t = await waitTab2(page, /Suggested/);
      const L = await mock('/__log'), body = L.rewrite[L.rewrite.length - 1];
      ok(L.rewrite.length === n0 + 1 && body.text === sent, '4 the relay received exactly the text the preview showed', body && body.text);
      ok(body.style === 'objective' && body.token === token && Object.keys(body).sort().join() === 'style,text,token', '4 ... with the style and the token, and nothing else', Object.keys(body));
      ok(!/Jordan|Ellis|48213|Rivera|Marcus/.test(J(L)), '4 nothing the relay received holds a name or the ID');
      ok(L.cookies.length === 0 && L.origins.every(o => o === ORIGIN), '4 no cookie was sent (credentials omitted)', L.cookies);
      const ans = await page.evaluate(() => __w.answer());
      ok(await page.evaluate(() => __w.q('#use').hidden), '4 while the suggestion shows, the footer\'s Use this text steps aside (one Use on screen)');
      ok(/Jordan/.test(ans) && /Ms\. Rivera/.test(ans) && /Marcus/.test(ans) && !/\[Student\]|\[Name \d\]|\[ID\]/.test(ans), '4 the answer has the placeholders put back', ans);
      ok(/Jordan’s head/.test(ans), '4 a placeholder the rewrite moved is put back too ("[Student]’s")', ans);
      ok(/What changed/.test(t) && /Check before you use it/.test(t), '4 the answer lists what changed and what to check');
      ok(await page.evaluate(() => __w.qa('div.ans del').length > 0 && __w.qa('div.ans ins').length > 0), '4 the answer shows what it took out and put in, next to the original');
      await shot(page, 'qa-answer-1180x820.png');
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Use and keep editing')); await sleep(300);
      const ed = await editor(page);
      ok(ed === ans, '4 Use and keep editing puts the answer into the panel\'s text', ed);
      ok((await page.evaluate(() => __w.q('#tb1').getAttribute('aria-selected'))) === 'true', '4 ... and goes back to Check wording');
      await page.evaluate(() => __w.click('#use')); await sleep(250);
      ok(/Still to fill in/.test(await page.evaluate(() => __w.text('#fm'))), '4 the answer\'s blanks are named before it reaches the record');
      await page.evaluate(() => __w.click('#use')); await sleep(350);
      ok((await page.evaluate(s => document.querySelector(s).value, sel)) === ans, '4 Use this text (again) writes it into the field');
      const file = await saved(page);
      ok(file.includes('Jordan') && !file.includes(token), '4 the saved file holds the wording but not the token');
      ok(!(await page.evaluate(tk => document.documentElement.outerHTML.includes(tk), token)), '4 the token is nowhere in the page');
      /* "Use this" straight from an answer */
      await clickButtonOf(page, sel); await tab(page, 2);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(250);
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/);
      const ans2 = await page.evaluate(() => __w.answer());
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Use this')); await sleep(250);
      ok(/press Use this again/.test(await page.evaluate(() => __w.text('#fm'))), '4 Use this with blanks in the answer names the blanks, and the button pressed', await page.evaluate(() => __w.text('#fm')));
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Use this')); await sleep(350);
      ok(!(await isOpen(page)) && (await page.evaluate(s => document.querySelector(s).value, sel)) === ans2, '4 Use this (and again past its blanks) writes the answer into the field and closes');
      /* a suggestion not used is not thrown away without a word */
      await clickButtonOf(page, sel); await tab(page, 2);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(250);
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/);
      await tab(page, 1);
      ok(!(await page.evaluate(() => __w.q('#use').hidden)), '4 on Check wording the footer\'s Use this text is back');
      await page.evaluate(() => __w.click('#use')); await sleep(250);
      ok(await isOpen(page) && /has not been used/.test(await page.evaluate(() => __w.text('#fm'))), '4 with a suggestion waiting, Use this text asks first', await page.evaluate(() => __w.text('#fm')));
      await page.evaluate(() => __w.click('#cancel')); await sleep(300);
      /* Keep mine */
      await clickButtonOf(page, sel); await tab(page, 2);
      const mine = await editor(page);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(250);
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/);
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Keep mine')); await sleep(250);
      ok((await editor(page)) === mine && /Kept your text/.test(await page.evaluate(() => __w.tab2())), '4 Keep mine leaves the text as it was');
      /* the errors, each plainly, with the text kept */
      const errStep = async (setup, re, label, after) => {
        const from = lg.length;
        await setup();
        await page.evaluate(() => __w.click('.sty .b')); await sleep(200);
        const before = await page.evaluate(() => __w.text('pre.sent'));
        await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send'));
        const tt = await waitTab2(page, re, 6000);
        ok(re.test(tt), '4 ' + label, tt.slice(0, 260));
        ok((await editor(page)) === mine && (!before || (await page.evaluate(() => __w.text('pre.sent'))) === before || !(await page.evaluate(() => __w.q('pre.sent')))), '4 ... the text is kept');
        if (after) await after();
        const bad = errorsIn(lg, from);
        ok(bad.length === 0, '4 ... and no console error but the expected network one', bad);
        await page.evaluate(() => { const c = __w.qa('#tp2 .acts .b').filter(b => b.textContent === 'Back to styles')[0]; if (c) c.click(); }); await sleep(200);
      };
      await errStep(async () => { await ctx.setOffline(true); }, /offline, so nothing was sent/, 'offline: said so, nothing sent', async () => { await ctx.setOffline(false); });
      await errStep(async () => { await mock('/__mode', {mode:'ratelimit'}); }, /Too many rewrites in a short time\. Wait about a minute/, 'rate limited: said so, with how long to wait');
      await errStep(async () => { await mock('/__mode', {mode:'down'}); }, /not working right now/, 'the relay down: said so');
      await mock('/__mode', {mode:'expire'});
      await page.evaluate(() => __w.click('.sty .b')); await sleep(200);
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send'));
      t = await waitTab2(page, /session has ended/);
      ok(/This tab’s session has ended/.test(t) && await page.evaluate(() => !!__w.q('#pc')), '4 an expired session: said so, with the passcode box', t.slice(0, 200));
      ok(!(await page.evaluate(() => sessionStorage.getItem('nbh.wording.session'))), '4 ... and the ended session is dropped');
      await mock('/__mode', {mode:'ok'});
      await page.evaluate(() => { const i = __w.q('#pc'); i.value = 'ABC-DEF-GHJ-KMN'; __w.q('form.pc').requestSubmit(); });
      t = await waitTab2(page, /Unlocked again/);
      ok(/Unlocked again/.test(t) && await page.evaluate(() => !!__w.q('pre.sent')), '4 a new passcode goes straight back to the text waiting to be sent');
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send'));
      t = await waitTab2(page, /Suggested/);
      ok(/Suggested/.test(t), '4 ... and Send works again');
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Keep mine')); await sleep(200);
      /* too many wrong passcodes */
      await page.evaluate(() => __w.click('#tp2 .st .lk', 'Lock')); await sleep(200);
      for (let i = 0; i < 5; i++) { await page.evaluate(() => { const x = __w.q('#pc'); x.value = 'ZZZ-ZZZ-ZZZ-ZZ' + 'Z'; __w.q('form.pc').requestSubmit(); }); await waitTab2(page, /not accepted|Too many/); await sleep(100); }
      await page.evaluate(() => { const x = __w.q('#pc'); x.value = 'YYY-YYY-YYY-YYY'; __w.q('form.pc').requestSubmit(); });
      t = await waitTab2(page, /Too many passcode tries/);
      ok(/Too many passcode tries\. Wait about 15 minutes/.test(t), '4 too many wrong passcodes: said so, with how long to wait', t.slice(0, 200));
      ok(errorsIn(lg).length === 0, '4 no console errors (besides the expected network ones)', errorsIn(lg));
      await ctx.close();
    });

    /* ---- 5. where option 3 cannot work: another site, a file */
    await section('5', async () => {
      const lg = [], ctx = await context(browser, {relay:RELAY});
      const page = await openForm(ctx, lg, FORM_URL.replace('localhost', '127.0.0.1'));
      await sim(page); await view(page, 'obs');
      await clickButtonOf(page, '#obsPages textarea[data-obs="0"][data-row="1"]'); await tab(page, 2);
      const t = await page.evaluate(() => __w.tab2());
      ok(/set up for the forms on localhost\. This copy opens from 127\.0\.0\.1/.test(t), '5 a copy on another site is told so before anything is tried', t.slice(0, 200));
      await ctx.close();
      const tmp = path.join(os.tmpdir(), 'wording-file-' + process.pid + '.html');
      fs.writeFileSync(tmp, variant(fs.readFileSync(FORM_PATH, 'utf8'), {relay:'https://newsomebh.com/ai'}));
      const c2 = await context(browser, null), p2 = await c2.newPage(); wire(p2, lg);
      await p2.goto('file://' + tmp); await sleep(700); await p2.evaluate(() => { window.confirm = () => true; });
      await sim(p2); await view(p2, 'obs');
      await clickButtonOf(p2, '#obsPages textarea[data-obs="0"][data-row="1"]'); await tab(p2, 2);
      const t2 = await p2.evaluate(() => __w.tab2());
      ok(/opened from a file on this device/.test(t2) && /newsomebh\.com/.test(t2), '5 a copy opened from a file (the one-file edition on a disk) is told so', t2.slice(0, 200));
      ok(errorsIn(lg).length === 0, '5 no console errors', errorsIn(lg));
      await c2.close(); fs.unlinkSync(tmp);
    });

    /* ---- 6. no running past the edge, at the three widths; the screenshots */
    await section('6', async () => { for (const [w, hgt] of [[390, 844], [820, 1180], [1180, 820]]) {
      await mock('/__reset', {codes:[CODE]});
      const lg = [], ctx = await context(browser, {relay:RELAY}, {width:w, height:hgt}), page = await openForm(ctx, lg);   /* the rules as built */
      await sim(page); await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="2"]';
      await page.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); await sleep(300);
      let o = await page.evaluate(() => __w.overflow());
      ok(o.length === 0, '6 ' + w + ' px: the form with its buttons runs past no edge', o);
      if (w !== 1180) await shot(page, 'fields-' + w + 'x' + hgt + '.png');
      await page.evaluate(s => { const t = document.querySelector(s); t.value = t.value + ' He was very upset and had a tantrum a lot; he was really mad.'; t.dispatchEvent(new Event('input', {bubbles:true})); }, sel);
      await clickButtonOf(page, sel);
      o = await page.evaluate(() => __w.overflow());
      ok(o.length === 0, '6 ' + w + ' px: the panel (Check wording) runs past no edge', o);
      await shot(page, 'panel-check-' + w + 'x' + hgt + '.png');
      await tab(page, 2);
      o = await page.evaluate(() => __w.overflow());
      ok(o.length === 0, '6 ' + w + ' px: the passcode step runs past no edge', o);
      await shot(page, 'panel-passcode-' + w + 'x' + hgt + '.png');
      await page.evaluate(c => { const i = __w.q('#pc'); i.value = c; __w.q('form.pc').requestSubmit(); }, CODE); await waitTab2(page, /Unlocked/);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(300);
      await page.evaluate(() => { const i = __w.q('#also'); i.value = 'Ms. Rivera, Marcus'; i.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); }); await sleep(250);
      o = await page.evaluate(() => __w.overflow());
      ok(o.length === 0, '6 ' + w + ' px: the privacy step runs past no edge', o);
      await shot(page, 'panel-preview-' + w + 'x' + hgt + '.png');
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/);
      o = await page.evaluate(() => __w.overflow());
      ok(o.length === 0, '6 ' + w + ' px: the answer runs past no edge', o);
      await shot(page, 'panel-answer-' + w + 'x' + hgt + '.png');
      await tab(page, 3); await shot(page, 'panel-tools-' + w + 'x' + hgt + '.png');
      ok(errorsIn(lg).length === 0, '6 ' + w + ' px: no console errors', errorsIn(lg));
      await ctx.close();
    } });

    /* ---- 7. print: the form prints the same with the block as without it */
    await section('7', async () => {
      const out = {}, dirs = {}, after = {};
      for (const k of ['without', 'with']) {
        const ctx = await context(browser, k === 'without' ? {without:true} : null), page = await openForm(ctx, log);
        await sim(page);
        for (const v of ['setup', 'obs', 'summary']) {
          await view(page, v);
          await page.evaluate(() => { const t = document.querySelector('#obsPages textarea[data-obs="0"][data-row="0"]'); if (t && t.offsetParent) t.focus(); });
          await sleep(200);
          dirs[k] = dirs[k] || fs.mkdtempSync(path.join(os.tmpdir(), 'wording-print-' + k + '-'));
          await page.emulateMedia({media:'print'});
          await page.pdf({path: path.join(dirs[k], 'OB-1-' + v + '.pdf'), format:'Letter', printBackground:true});
          await page.emulateMedia({media:'screen'}); await sleep(250);
          /* back on screen, the sheet is fitted as before: the overlay must not make the page read as too wide */
          (after[k] = after[k] || []).push(await page.evaluate(() => ({zoom: document.querySelector('.sheet').style.zoom, h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth <= document.documentElement.clientWidth})));
        }
        await ctx.close();
      }
      let res = '';
      try { res = execFileSync('python3', [path.join(__dirname, 'compare-print.py'), dirs.without, dirs.with], {encoding:'utf8'}); } catch (e) { res = 'ERR ' + (e.stdout || e.message); }
      Object.values(dirs).forEach(d => fs.rmSync(d, {recursive:true, force:true}));
      ok(J(after.with) === J(after.without), '7 after each print the screen fit (zoom ' + after.with.map(x => x.zoom || 1).join(', ') + ') and the page are as without the block', after);
      ok(/identical: 3 of 3/.test(res) || (/identical: 3 of 3|every page renders and reads the same/.test(res) && !/differs on/.test(res)), '7 the printed OB-1 is the same with the block as without it (' + res.trim().split('\n')[0] + ')', res);
    });

    /* ---- 8. accessibility of the panel (axe-core, when it can be found) */
    await section('8', async () => {
      let axe = null;
      try { axe = fs.readFileSync(require.resolve('axe-core/axe.min.js', {paths:[__dirname, process.env.AXE_DIR || __dirname].filter(Boolean)}), 'utf8'); } catch (e) {}
      if (!axe) console.log('note  axe-core not found (set AXE_DIR to a node_modules holding it): accessibility pass skipped');
      else {
        await mock('/__reset', {codes:[CODE]});
        const lg = [], ctx = await context(browser, {relay:RELAY}), page = await openForm(ctx, lg);
        await sim(page); await view(page, 'obs');
        const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
        await typeInto(page, sel, 'He was very upset and had a tantrum a lot.');
        await page.click('#obsPages textarea[data-obs="0"][data-row="0"]');
        await page.addScriptTag({content: axe});
        const run = () => page.evaluate(async () => { const r = await axe.run({include:[['#nbh-wording-ui']]}, {runOnly:{type:'tag', values:['wcag2a', 'wcag2aa']}});
          return r.violations.map(v => v.id + ': ' + v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')); });
        let v = await run();
        ok(v.length === 0, '8 axe (WCAG 2 A/AA): the buttons at the fields', v);
        await clickButtonOf(page, sel); v = await run();
        ok(v.length === 0, '8 axe: the panel, Check wording', v);
        await tab(page, 2); v = await run();
        ok(v.length === 0, '8 axe: the passcode step', v);
        await page.evaluate(c => { const i = __w.q('#pc'); i.value = c; __w.q('form.pc').requestSubmit(); }, CODE); await waitTab2(page, /Unlocked/);
        await page.evaluate(() => __w.click('.sty .b')); await sleep(250); v = await run();
        ok(v.length === 0, '8 axe: the privacy step', v);
        await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/); v = await run();
        ok(v.length === 0, '8 axe: the answer', v);
        await ctx.close();
      }
    });
    /* ---- 9. the one-file edition, opened from a file: OB-1 in a srcdoc frame */
    await section('9', async () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wording-one-'));
      const src = path.join(tmp, 'src'); fs.mkdirSync(src);
      for (const f of fs.readdirSync(path.join(ROOT, 'NBH-Workstation'))) {
        const from = path.join(ROOT, 'NBH-Workstation', f);
        if (f === FILE) fs.writeFileSync(path.join(src, f), variant(fs.readFileSync(from, 'utf8'), {relay:'https://newsomebh.com/ai'}));
        else fs.symlinkSync(from, path.join(src, f));
      }
      execFileSync('python3', [path.join(ROOT, 'tools', 'build-single.py'), src, path.join(tmp, 'one.html')], {stdio:'ignore'});
      const lg = [], ctx = await context(browser, null), page = await ctx.newPage(); wire(page, lg);
      await page.goto('file://' + path.join(tmp, 'one.html')); await page.waitForFunction(() => typeof openForm === 'function', null, {timeout:30000}); await sleep(600);
      await page.evaluate(() => openForm('OB-1')); await page.waitForFunction(() => !!state.status['OB-1'], null, {timeout:30000}); await sleep(500);
      const fr = page.frames().find(f => f !== page.mainFrame() && f.url() === 'about:srcdoc');
      ok(!!fr && await fr.evaluate(() => !!window.nbhWording), '9 the one-file edition opens OB-1 (in a srcdoc frame) with the writing help');
      await sim(fr); await view(fr, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      await fr.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); await sleep(300);
      const pos = await fr.evaluate(s => __w.at(s), sel), box = await (await fr.frameElement()).boundingBox();
      ok(!!pos, '9 ... the button is at the field');
      await page.mouse.click(box.x + pos.x, box.y + pos.y); await sleep(400);
      await fr.evaluate(() => __w.q('#tb2').click()); await sleep(200);
      const t = await fr.evaluate(() => __w.tab2());
      ok(/opened from a file on this device/.test(t), '9 ... and Rewrite with Claude says a file cannot reach the relay', t.slice(0, 160));
      const snap = await page.evaluate(async () => { const r = await grab('OB-1', 'snapshot', null, 8000); return r && r.snap && r.snap.total; });
      ok(snap === 169, '9 ... the snapshot there has the same 169 controls', snap);
      ok(errorsIn(lg).length === 0, '9 no console errors', errorsIn(lg));
      await ctx.close(); fs.rmSync(tmp, {recursive:true, force:true});
    });
    /* ---- 10. de-identification: who is hidden, how, and how it is put back */
    await section('10', async () => {
      await mock('/__reset', {codes:[CODE]});
      const lg = [], ctx = await context(browser, {relay:RELAY}), page = await openForm(ctx, lg);
      await sim(page);
      const meta = (c, id) => page.evaluate(([c, id]) => { for (const [k, v] of [['mClient', c], ['mSid', id]]) { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); } }, [c, id]);
      const dei = (t, extra) => page.evaluate(([t, e]) => nbhWording.deidentify(t, e || []).text, [t, extra || null]);
      await meta('Mateo Alvarez-Rios', '2026-0417');
      let t = await dei('Mateo’s dad, Mr. Alvarez-Rios, came at 9:30. Mrs. Rios called. The Alvarez family asked for a meeting. Rios cried. Observed on 10/2/2026 (2026-0417).');
      ok(t === '[Student]’s dad, Mr. [Family name], came at 9:30. Mrs. [Family name] called. The [Family name] family asked for a meeting. [Student] cried. Observed on 10/2/2026 ([ID]).',
        '10 a parent named by the family name is [Family name], each half of a double surname is hidden, and the year in a date is not taken for the ID', t);
      await meta('Ana Lopez', '');
      t = await dei('Ms. Lopez (mom) arrived. Ana Lopez sat down; Lopez cried.');
      ok(t === 'Ms. [Family name] (mom) arrived. [Student] sat down; [Student] cried.', '10 "Ms. Lopez (mom)" is not the student', t);
      await meta('Hunter Brooks', '');
      ok((await dei('hunter hit a peer. Hunter cried.')) === 'hunter hit a peer. [Student] cried.', '10 an everyday-word name in lower case is not hidden on its own');
      ok((await dei('hunter hit a peer. Hunter cried.', [{v:'hunter', student:true}])) === '[Student] hit a peer. [Student] cried.', '10 ... but is once marked as the student');
      ok((await dei('Alex threw it. Alex sat. Liam laughed.', [{v:'Alex', student:true}, 'Liam'])) === '[Student] threw it. [Student] sat. [Name 1] laughed.', '10 a nickname marked as the student is [Student]');
      ok((await dei('Liam laughed; Ms. Okafor came.', ['Okafor', 'Ms. Okafor', 'Liam'])) === '[Name 1] laughed; [Name 2] came.', '10 [Name n] is numbered by first use in the text, with no gap');
      /* the panel: what may still be a name, the form's people, the student's other forms; put back one by one */
      await view(page, 'setup');
      await meta('Mateo Alvarez-Rios', 'S-48213');
      await page.evaluate(() => { const e = document.querySelector('[data-meta="teacher"]'); e.value = 'Ms. Okafor'; e.dispatchEvent(new Event('input', {bubbles:true})); });
      await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const TXT = 'Mateo’s dad, Mr. Alvarez-Rios, came at 9:30. Liam took his pencil. Teo then ran to the door and Ms. Okafor blocked it. Mateo Alvarez-Rios was very upset; Mateo sat. M.A. left.';
      await page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); }, [sel, TXT]); await sleep(300);
      await clickButtonOf(page, sel); await tab(page, 2);
      await page.evaluate(c => { const i = __w.q('#pc'); i.value = c; __w.q('form.pc').requestSubmit(); }, CODE); await waitTab2(page, /Unlocked/);
      await page.evaluate(() => [...__w.qa('.sty .b')].filter(x => /spelling/.test(x.textContent))[0].click()); await sleep(300);
      ok((await page.evaluate(() => __w.text('pre.sent'))) === '[Student]’s dad, Mr. [Family name], came at 9:30. Liam took his pencil. Teo then ran to the door and Ms. Okafor blocked it. [Student] was very upset; [Student] sat. M.A. left.', '10 the preview', await page.evaluate(() => __w.text('pre.sent')));
      const sugg = await page.evaluate(() => __w.qa('.sugg .b').map(b => b.textContent));
      ok(sugg.includes('+ Liam') && sugg.includes('+ Teo'), '10 a name that starts a sentence is offered too (Liam, Teo)', sugg);
      ok(sugg.includes('+ Ms. Okafor') && !sugg.includes('+ Okafor'), '10 the teacher is offered once, as the form names her', sugg);
      ok(sugg.includes('+ M.A.'), '10 the student’s initials are offered, as the student', sugg);
      const fn = await page.evaluate(() => [...document.querySelectorAll('input[data-field="secondObs"], [data-meta="school"], [data-meta="observer"]')].map(e => e.value).filter(Boolean));
      ok(fn.length > 0 && fn.every(v => sugg.includes('+ ' + v)), '10 the observers and the school on the form are offered too', {fn, sugg});
      ok(/Not hidden yet: .*Liam.*Teo/.test(await page.evaluate(() => __w.tab2())), '10 next to Send: what is not hidden yet');
      for (const n of ['+ Teo', '+ Liam', '+ Ms. Okafor', '+ M.A.']) { await page.evaluate(n => __w.click('.sugg .b', n), n); await sleep(200); }
      await page.evaluate(() => { const li = __w.qa('ul.chips li').filter(x => x.firstChild.textContent === 'Teo')[0]; li.querySelector('.tg').click(); }); await sleep(250);
      const sent = await page.evaluate(() => __w.text('pre.sent'));
      ok(sent === '[Student]’s dad, Mr. [Family name], came at 9:30. [Name 1] took his pencil. [Student] then ran to the door and [Name 2] blocked it. [Student] was very upset; [Student] sat. [Student] left.', '10 Teo marked Student, the initials, the others numbered in order', sent);
      ok(!/Not hidden yet/.test(await page.evaluate(() => __w.tab2())), '10 ... and nothing is left to point out');
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await waitTab2(page, /Suggested/);
      const ans = await page.evaluate(() => __w.answer());
      ok(ans === TXT, '10 a grammar fix keeps the placeholders in order, so each is put back as it was written ("Mr. Alvarez-Rios", "Mateo Alvarez-Rios", "Mateo", "M.A.")', ans);
      ok(/each where it was/.test(await page.evaluate(() => __w.tab2())), '10 ... and the panel says so');
      /* an answer that moves the names: each placeholder as the form most used, and a warning where that was a choice */
      await page.evaluate(() => __w.click('#tp2 .acts .b', 'Keep mine')); await sleep(200);
      await page.evaluate(() => __w.click('.sty .b')); await sleep(250);
      await page.evaluate(() => __w.click('#tp2 .acts .b.pri', 'Send')); await sleep(200);
      const t2 = await waitTab2(page, /Suggested/);
      ok(/\[Student\] stood for/.test(t2) && /Check each name/.test(t2), '10 when the answer does not keep the order, the panel says which placeholder stood for more than one name', t2.slice(0, 600));
      ok(errorsIn(lg).length === 0, '10 no console errors', errorsIn(lg));
      await ctx.close();
    });

    /* ---- 11. Check wording with the rules as built: one card per rule, headings, the learner's own words */
    await section('11', async () => {
      const lg = [], ctx = await context(browser, null), page = await openForm(ctx, lg);
      await sim(page); await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const TXT = 'He was very loud, very close to peers and very upset. He probably wanted the iPad and cried all day. He said no and refused to write. He said he was angry. Mom said he was angry.';
      await page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); }, [sel, TXT]); await sleep(300);
      await clickButtonOf(page, sel);
      const cards = await page.evaluate(() => __w.cards());
      const v = cards.filter(c => /^Vague intensity/.test(c.cat));
      ok(v.length === 1 && /3 times/.test(v[0].cat) && v[0].btns.indexOf('Take out all 3') >= 0, '11 three "very" are one card, with Take out all 3', v);
      ok(cards.some(c => c.cat.indexOf('Opinion or judgment') === 0 && c.mark === 'probably'), '11 "probably" is headed Opinion or judgment', cards.map(c => c.cat + ':' + c.mark));
      const allDay = cards.filter(c => c.mark === 'all day')[0];
      ok(allDay && /^Vague time/.test(allDay.cat) && !allDay.btns.some(b => /^Replace/.test(b)), '11 "all day" is a vague time, with no one-tap replacement', allDay);
      ok(cards.some(c => c.mark === 'refused'), '11 "refused" is marked without the "and" before it', cards.map(c => c.mark));
      const angry = await page.evaluate(() => nbhWording.check('He said he was angry. Mom said he was angry.').filter(f => f.id === 'int-angry').map(f => f.start));
      ok(angry.length === 1 && angry[0] > 20, '11 the learner’s own words about a feeling are not flagged; someone else’s are', angry);
      await page.evaluate(() => __w.click('#fds li button', 'Take out all 3')); await sleep(250);
      ok((await editor(page)).indexOf('very') < 0 && (await editor(page)).indexOf('He was loud, close to peers and upset.') === 0, '11 Take out all 3 takes out all three', await editor(page));
      await page.evaluate(() => __w.click('#undo')); await sleep(200);
      ok((await editor(page)) === TXT, '11 one Undo puts all three back');
      await page.evaluate(() => __w.click('#cancel')); await sleep(250);
      const lim = await page.evaluate(() => { const t = document.querySelector('textarea[data-obs="0"][data-field="notes"]'); return nbhWording.check(t ? t.getAttribute('placeholder') || '' : '').map(f => f.id + ':' + f.text); });
      ok(lim.length === 0, '11 the limits field’s own example ("student knew I was watching") is not flagged', lim);
      ok(errorsIn(lg).length === 0, '11 no console errors', errorsIn(lg));
      await ctx.close();
    });

    /* ---- 12. the button in a two-row field on an upright iPad: small while words are there, never hidden by a selection */
    await section('12', async () => {
      const lg = [], ctx = await context(browser, null, {width:820, height:1180}), page = await openForm(ctx, lg);
      await sim(page); await view(page, 'obs');
      const sel = '#obsPages textarea[data-obs="0"][data-row="2"]';
      await page.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({block:'center'}); e.value = 'He sat down at 9:02. He was very upset and had a meltdown for a while. He returned to work at 9:20.'; e.dispatchEvent(new Event('input', {bubbles:true})); }, sel);
      await sleep(300); await page.click(sel); await sleep(300);
      await page.evaluate(s => { const e = document.querySelector(s), i = e.value.indexOf('He was'); e.setSelectionRange(i, e.value.indexOf(' He returned')); }, sel); await sleep(400);
      const a = await page.evaluate(s => __w.at(s), sel);
      ok(!!a, '12 with the middle sentence selected, the button stays (it is not hidden)', a);
      await page.evaluate(s => { const e = document.querySelector(s); e.setSelectionRange(e.value.length, e.value.length); }, sel); await sleep(200);
      await page.keyboard.type(' He sat at his desk', {delay:20}); await sleep(450);
      const g = await page.evaluate(s => { const p = __w.over(document.querySelector(s)); return p ? {h: Math.round(p.q.height), wide: p.b.classList.contains('wide'), over: p.b.classList.contains('over'), op: getComputedStyle(p.b.querySelector('.pl')).opacity} : null; }, sel);
      ok(g && !g.wide && g.h <= 26, '12 typing in a two-row field: the small button, without its label', g);
      let cover = 0;
      for (const w of 'and wrote two words then put the pencil down and looked out of the window for a while'.split(' ')) {
        await page.keyboard.type(' ' + w, {delay:1}); await sleep(60);
        const hit = await page.evaluate(s => { const t = document.querySelector(s), c = __w.caret(t), p = __w.over(t); const q = p && p.q; return !!q && !(c.right < q.left || c.left > q.right || c.bottom < q.top || c.top > q.bottom); }, sel);
        if (hit) cover++;
      }
      ok(cover === 0, '12 ... and it never covers the caret', cover);
      await page.click('#obsPages textarea[data-obs="0"][data-row="0"]'); await sleep(400);
      const q = await page.evaluate(s => { const p = __w.over(document.querySelector(s)); return p ? {over: p.b.classList.contains('over'), op: +getComputedStyle(p.b.querySelector('.pl')).opacity} : null; }, sel);
      ok(q && (!q.over || q.op < 0.7), '12 over words, a button is see-through', q);
      await shot(page, 'two-row-820x1180.png');
      ok(errorsIn(lg).length === 0, '12 no console errors', errorsIn(lg));
      await ctx.close();
    });

    /* ---- 13. the rewrite service not there yet: the forms carry its address before the relay is on the website */
    await section('13', async () => {
      const lg = [], sel = '#obsPages textarea[data-obs="0"][data-row="1"]';
      const NET = /Failed to load resource: (the server responded with a status of (404|503)|net::ERR_CONNECTION_REFUSED)/;
      const bad = from => errorsIn(lg, from).filter(l => !(l.type === 'error' && NET.test(l.text)));
      const STILL = /Check wording and the iPad’s Writing Tools still work without it\./;
      const open2 = async (relay) => {
        const ctx = await context(browser, relay === undefined ? null : {relay}), page = await openForm(ctx, lg);
        await sim(page); await view(page, 'obs');
        await clickButtonOf(page, sel); await tab(page, 2);
        return {ctx, page};
      };
      const tryCode = async page => { await page.evaluate(c => { const i = __w.q('#pc'); i.value = c; __w.q('form.pc').requestSubmit(); }, CODE); };
      /* the built-in address, from this test server (another site): said before anything is tried, and nothing is asked */
      let from = lg.length, {ctx, page} = await open2();
      const host = new URL(JSON.parse(config).relay || 'https://x.invalid').hostname;
      let t = await page.evaluate(() => __w.tab2());
      ok(t.indexOf('set up for the forms on ' + host) >= 0 && /Writing Tools work without it/.test(t), '13 the built-in address (' + host + ') opened from another site: said so, with what works without it', t.slice(0, 260));
      ok((await page.evaluate(() => nbhWording.status().reach)) === '', '13 ... and the relay is not asked anything from another site');
      await ctx.close();
      /* the relay not uploaded yet: the website answers with its own "not found" page */
      await mock('/__reset', {codes:[CODE]}); await mock('/__mode', {site:'absent'});
      from = lg.length; ({ctx, page} = await open2(RELAY));
      t = await waitTab2(page, /not reachable/);
      ok(/The rewrite service on localhost is not reachable, or it is not set up yet\./.test(t) && STILL.test(t), '13 not uploaded yet (the website’s 404 page): said plainly as the tab opens, with what still works', t.slice(0, 300));
      ok(await page.evaluate(() => !!__w.q('#pc')), '13 ... and the passcode box is still there');
      await page.evaluate(() => { __w.q('#pc').focus(); __w.q('#pc').value = 'ZZZ'; });
      await tryCode(page);
      t = await waitTab2(page, /not reachable|not accepted/);
      ok(/is not reachable, or it is not set up yet\. Your text is still here\./.test(t) && STILL.test(t) && !/not accepted/.test(t), '13 ... a passcode tried then is not called "not accepted": the same plain words', t.slice(0, 300));
      ok(bad(from).length === 0, '13 ... no console error but the expected 404s', bad(from));
      await ctx.close();
      /* the relay uploaded, not set up yet (no API key or admin password in config.php) */
      await mock('/__reset', {codes:[CODE]}); await mock('/__mode', {site:'setup'});
      from = lg.length; ({ctx, page} = await open2(RELAY));
      t = await waitTab2(page, /not set up yet/);
      ok(/The rewrite service on localhost is not set up yet\./.test(t) && STILL.test(t), '13 uploaded but not set up: said so, with what still works', t.slice(0, 300));
      await tryCode(page);
      t = await waitTab2(page, /not set up yet\. Your text/);
      ok(/is not set up yet\. Your text is still here\./.test(t) && STILL.test(t), '13 ... and a passcode tried then says the same', t.slice(0, 300));
      ok(bad(from).length === 0, '13 ... no console error but the expected 503s', bad(from));
      await ctx.close();
      /* nothing listening at the address */
      const port = await new Promise(res => { const srv = require('net').createServer(); srv.listen(0, () => { const p = srv.address().port; srv.close(() => res(p)); }); });
      from = lg.length; ({ctx, page} = await open2('http://localhost:' + port));
      t = await waitTab2(page, /not reachable/);
      ok(/is not reachable, or it is not set up yet\./.test(t) && STILL.test(t), '13 nothing at the address: not reachable, with what still works', t.slice(0, 300));
      ok(bad(from).length === 0, '13 ... no console error but the refused connection', bad(from));
      await ctx.close();
      /* the relay there and set up: no word about it, and it is asked once only */
      await mock('/__reset', {codes:[CODE]});
      from = lg.length; ({ctx, page} = await open2(RELAY));
      await sleep(500);
      t = await page.evaluate(() => __w.tab2());
      ok(!/not reachable|not set up/.test(t) && /Enter the passcode from your BCBA/.test(t) && (await page.evaluate(() => nbhWording.status().reach)) === 'ok', '13 the relay there: just the passcode box', t.slice(0, 200));
      await page.evaluate(() => __w.click('#cancel')); await sleep(250);
      await clickButtonOf(page, sel); await tab(page, 2); await sleep(300);
      ok((await mock('/__log')).health === 1, '13 ... and it was asked once, not each time the tab opens', (await mock('/__log')).health);
      ok(bad(from).length === 0, '13 ... no console errors', bad(from));
      await ctx.close();
      await mock('/__reset', {codes:[CODE]});
    });
  } catch (e) {
    ok(false, 'the run stopped: ' + (e && e.stack || e));
  } finally {
    await browser.close(); child.kill();
  }
  ok(errorsIn(log).length === 0, 'no console errors anywhere', errorsIn(log));
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
