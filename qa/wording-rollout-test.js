/* The writing help in every form (tools/blocks/patch-wording.py; tools/apply-polish.py puts it into a rebuilt form),
   form by form, against the same form before the rollout: the pre-rollout folder, unpacked from git into
   qa/out/wording-rollout/base/NBH-Workstation (made here when missing, from WR_COMMIT) and served by the same server.
   For each of the 44 forms in index.html's FORMS:
     load    the form loads, takes its simulation and goes through its views with no console error, and the writing
             help starts (its rules compile; from this server the built-in relay address is another site, so nothing
             is asked of it)
     buttons on each view, every shown narrative field with text has its Improve wording button over it, a field
             takes one while it has the focus, and there is no other button: none on hidden fields, fields in the
             toolbar or a dialog, boxes with spelling check off (paste boxes, item lists) or the learner's particulars
     save    Save data writes the same file before and after the panel is opened (all three tabs) and closed unused
     snap    the workstation's snapshot of the form (field count, keys, values, the form's own file) is the
             pre-rollout form's, both before the panel has been opened and after
     print   blank and with the simulation (a field focused, its button on screen), the printed PDF is the
             pre-rollout form's: the same pages, read and rasterised the same (qa/compare-print.py)
     390     at 390 px wide, with a button showing and with the panel open, nothing runs past the screen's edge
   Random numbers are seeded and the clock is fixed, so both copies take the same simulation.
   usage: node qa/wording-rollout-test.js [FORM-ID ...]     (the server on :8123 serving the repository, as for every check)
   env: WR_COMMIT (the commit before the rollout, default e39901f), WR_JOBS (forms at once, default 3),
        WR_OUT (folder for the results, default qa/out/wording-rollout) */
const {chromium, fs, path, ROOT, BASE, forms, loadSim, wire, sleep} = require(__dirname + '/lib.js');
const {execFileSync} = require('child_process');
const OUT = process.env.WR_OUT || path.join(__dirname, 'out', 'wording-rollout');
const COMMIT = process.env.WR_COMMIT || 'e39901f';
const JOBS = +(process.env.WR_JOBS || 3);
const BASEDIR = path.join(__dirname, 'out', 'wording-rollout', 'base');
const NEWURL = BASE + '/NBH-Workstation/', OLDURL = BASE + '/qa/out/wording-rollout/base/NBH-Workstation/';
const PDF = {old: path.join(OUT, 'pdf-before'), new: path.join(OUT, 'pdf-after')};
const J = JSON.stringify;
const FIXED = new Date('2026-10-05T10:00:00');

if (!fs.existsSync(path.join(BASEDIR, 'NBH-Workstation', 'index.html'))) {
  fs.mkdirSync(BASEDIR, {recursive:true});
  execFileSync('sh', ['-c', 'git -C "$0" archive "$1" NBH-Workstation | tar -x -C "$2"', ROOT, COMMIT, BASEDIR]);
  console.log('unpacked NBH-Workstation at ' + COMMIT + ' into ' + BASEDIR);
}
for (const d of Object.values(PDF)) { fs.rmSync(d, {recursive:true, force:true}); fs.mkdirSync(d, {recursive:true}); }

/* in the page: what the writing help draws (in its shadow root) and what the rule says should have a button */
const HELPERS = `window.__w = {
  root(){ const h = document.getElementById('nbh-wording-ui'); return h && h.shadowRoot; },
  pills(){ const r = this.root(); return r ? [...r.querySelectorAll('.iw')].filter(b => !b.classList.contains('away') && b.getClientRects().length).map(b => {
    const q = b.querySelector('.pl').getBoundingClientRect(); return {b, x:q.left + q.width / 2, y:q.top + q.height / 2}; }) : []; },
  vis(t){ if (!t.getClientRects().length) return false; const cs = getComputedStyle(t); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (t.checkVisibility && !t.checkVisibility()) return false;
    for (let d = t.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) if (!d.open && !t.closest('summary')) return false;
    const r = t.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    for (let n = t.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const c = getComputedStyle(n); if (c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const q = n.getBoundingClientRect(); if (r.right <= q.left || r.left >= q.right || r.bottom <= q.top || r.top >= q.bottom) return false; }
    return true; },
  why(t){ /* why a textarea has no button, or '' when it should have one */
    if (t.disabled) return 'disabled'; if (t.readOnly) return 'readonly';
    if (t.closest('.toolbar')) return 'toolbar'; if (t.closest('dialog,.nbh-pm')) return 'dialog'; if (t.closest('[data-nbh-nowording]')) return 'opted out';
    if (t.getAttribute('spellcheck') === 'false') return 'spellcheck off';
    const M = window.__nbhPacketMap || {}, sels = ['client','sid','dob','grade','site','bcba','first','last'].reduce((a, k) => a.concat(M[k] || []), []);
    if (sels.some(s => { try { return t.matches(s); } catch (e) { return false; } })) return 'particular';
    if (!this.vis(t)) return 'hidden';
    return ''; },
  over(t){ const r = t.getBoundingClientRect(); return this.pills().filter(p => p.x >= r.left - 1 && p.x <= r.right + 1 && p.y >= r.top - 1 && p.y <= r.bottom + 1)[0] || null; },
  label(t){ return (t.getAttribute('aria-label') || t.getAttribute('placeholder') || t.name || t.id || '').replace(/\\s+/g, ' ').slice(0, 50); },
  census(){ const all = [...document.querySelectorAll('textarea')], by = {}, want = [], miss = [], used = new Set();
    all.forEach(t => { const w = this.why(t); if (w) { by[w] = (by[w] || 0) + 1; return; } if (!/\\S/.test(t.value)) { by.empty = (by.empty || 0) + 1; return; } want.push(t); });
    want.forEach(t => { const p = this.over(t); if (p) used.add(p.b); else miss.push(this.label(t)); });
    const pills = this.pills(), stray = pills.filter(p => !used.has(p.b)).map(p => { const e = document.elementFromPoint(p.x, p.y); return e ? e.tagName + (e.className ? '.' + String(e.className).split(' ')[0] : '') : '?'; });
    return {all: all.length, want: want.length, pills: pills.length, miss, stray, by}; },
  firstField(empty){ return [...document.querySelectorAll('textarea')].find(t => !this.why(t) && (empty ? !/\\S/.test(t.value) : /\\S/.test(t.value))) || null; },
  overflow(){ const d = document.documentElement, out = [];
    if (d.scrollWidth > d.clientWidth + 1) out.push('page ' + d.scrollWidth + ' > ' + d.clientWidth);
    const r = this.root(); const dl = r && r.querySelector('dialog.pn');
    if (dl && dl.open) { const q = dl.getBoundingClientRect(); if (q.left < -1 || q.right > innerWidth + 1) out.push('panel ' + Math.round(q.left) + '..' + Math.round(q.right) + ' in ' + innerWidth);
      [...r.querySelectorAll('dialog.pn, .pb, .ce, .ct, .tp, .pf')].forEach(e => { if (e.getClientRects().length && e.scrollWidth > e.clientWidth + 1) out.push((e.className || e.tagName) + ' ' + e.scrollWidth + ' > ' + e.clientWidth); }); }
    return out; }
};`;

async function context(browser, vp){
  const ctx = await browser.newContext({viewport: vp || {width:1180, height:820}, acceptDownloads:true});
  await ctx.clock.setFixedTime(FIXED);
  await ctx.addInitScript({content: HELPERS});
  await ctx.addInitScript(() => { window.print = function(){}; let x = 20261004; Math.random = () => { x = (x * 48271) % 2147483647; return (x - 1) / 2147483646; }; });
  return ctx;
}
/* the forms ask before loading their simulation over what is there; the answer here is yes */
const sim = async target => { await target.evaluate(() => { window.confirm = () => true; }); const s = await loadSim(target); await sleep(1400); return s; };
const errs = (log, from) => log.slice(from || 0).filter(l => l.type === 'pageerror' || l.type === 'error').map(l => l.text);
async function views(target){
  return target.evaluate(() => {
    let b = [...document.querySelectorAll('#viewSeg button[data-view]')];
    if (!b.length) b = [...document.querySelectorAll('[role="tab"]')].filter(x => !x.closest('dialog,.nbh-pm,.toolbar'));
    return b.map((x, i) => i);
  });
}
async function view(target, i){
  await target.evaluate(i => {
    let b = [...document.querySelectorAll('#viewSeg button[data-view]')];
    if (!b.length) b = [...document.querySelectorAll('[role="tab"]')].filter(x => !x.closest('dialog,.nbh-pm,.toolbar'));
    if (b[i]) b[i].click();
  }, i);
  await sleep(450);
}
async function viewName(target, i){
  return target.evaluate(i => {
    let b = [...document.querySelectorAll('#viewSeg button[data-view]')];
    if (!b.length) b = [...document.querySelectorAll('[role="tab"]')].filter(x => !x.closest('dialog,.nbh-pm,.toolbar'));
    return b[i] ? (b[i].dataset.view || b[i].dataset.p || b[i].dataset.tab || b[i].id || b[i].textContent.trim()).slice(0, 20) : '';
  }, i);
}
/* the first view with a narrative field: one with text if there is one, else an empty one; failing both, a field
   in a closed <details> (Form SR-1's catalogue entries), opened */
async function seekField(target){
  for (const withText of [true, false]) {
    const has = () => target.evaluate(w => !!__w.firstField(!w), withText);
    if (await has()) return true;
    for (const i of await views(target)) { await view(target, i); if (await has()) return true; }
  }
  for (const i of [-1].concat(await views(target))) {
    if (i >= 0) await view(target, i);
    const opened = await target.evaluate(() => { const d = [...document.querySelectorAll('details:not([open])')].find(x => x.querySelector('textarea') && x.getClientRects().length);
      if (!d) return false; d.open = true; return true; });
    if (opened) { await sleep(400); if (await target.evaluate(() => !!(__w.firstField(false) || __w.firstField(true)))) return true; }
  }
  return false;
}
async function save(page){
  const sel = await page.evaluate(() => ['#saveBtn', '#dl-json', '#btnSave'].find(s => document.querySelector(s)) || '');
  if (!sel) return null;
  try {
    const [dl] = await Promise.all([page.waitForEvent('download', {timeout:10000}), page.evaluate(s => document.querySelector(s).click(), sel)]);
    return fs.readFileSync(await dl.path(), 'utf8');
  } catch (e) { return null; }
}
const norm = s => s == null ? null : s.replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g, 'T');
/* the panel, opened from a field's button as a person would (a tap in the field, then on its button), through its three
   tabs, and closed unused */
async function panelRound(target, page, frameEl){
  const c = await target.evaluate(() => { const t = __w.firstField(false) || __w.firstField(true); if (!t) return null; t.scrollIntoView({block:'center'});
    /* a point inside the part of the field on the screen (a field taller than the window is centred past both edges) */
    const r = t.getBoundingClientRect(), top = Math.max(r.top, 0), bottom = Math.min(r.bottom, innerHeight);
    return {x: r.left + Math.min(40, r.width / 4), y: top + Math.min(12, (bottom - top) / 2)}; });
  if (!c) return 'no field';
  await sleep(300);
  /* scrolling the field into view can scroll the workstation too: where the form's frame is, after that */
  const fb = frameEl ? await frameEl.boundingBox() : null, ox = fb ? fb.x : 0, oy = fb ? fb.y : 0;
  await page.mouse.click(ox + c.x, oy + c.y); await sleep(450);
  const p = await target.evaluate(() => { const t = document.activeElement; const q = t && t.tagName === 'TEXTAREA' && __w.over(t); return q ? {x:q.x, y:q.y} : null; });
  let how = 'button';
  /* and again: the focus can scroll the workstation to show the field */
  const fb2 = frameEl ? await frameEl.boundingBox() : null;
  if (p) await page.mouse.click((fb2 ? fb2.x : 0) + p.x, (fb2 ? fb2.y : 0) + p.y);
  else { how = 'api'; await target.evaluate(() => nbhWording.open(__w.firstField(false) || __w.firstField(true))); }
  await sleep(450);
  const open = await target.evaluate(() => { const d = __w.root() && __w.root().querySelector('dialog.pn'); return !!(d && d.open); });
  if (!open) return 'did not open';
  for (const t of ['#tb2', '#tb3', '#tb1']) { await target.evaluate(s => __w.root().querySelector(s).click(), t); await sleep(150); }
  const t2 = await target.evaluate(() => __w.root().querySelector('#tp2').innerText);
  await target.evaluate(() => __w.root().querySelector('#cancel').click()); await sleep(300);
  const closed = await target.evaluate(() => { const d = __w.root().querySelector('dialog.pn'); return !d.open; });
  await target.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
  return closed ? 'ok (' + how + ')' + (/set up for the forms on newsomebh\.com/.test(t2) ? '' : ' tab 2: ' + t2.slice(0, 60)) : 'did not close';
}
async function printTo(page, file, focus){
  if (focus) await page.evaluate(() => { const t = __w.firstField(false); if (t) { t.scrollIntoView({block:'center'}); t.focus(); } });
  await sleep(250);
  /* the forms size their fields for paper when the print media starts (and the writing help steps aside then too):
     the PDF is taken once that has settled, as a browser's own print waits for it */
  await page.emulateMedia({media:'print'}); await sleep(600);
  await page.pdf({path:file, format:'Letter', printBackground:true});
  await page.emulateMedia({media:'screen'});
  await sleep(150);
}

/* every view in turn, an empty narrative field focused and left on each (both copies get the same steps, since a
   form may size a field when it is focused, and that reaches the print); "census": count the buttons there too */
async function exercise(page, census){
  const nv = await views(page), ex = {byView: [], want: 0, pills: 0, miss: [], stray: [], all: 0, by: {}, focusOk: 0, focusTried: 0};
  for (const i of (nv.length ? nv : [-1])) {
    if (i >= 0) await view(page, i);
    if (census) {
      const c = await page.evaluate(() => __w.census());
      const name = i >= 0 ? await viewName(page, i) : 'page';
      ex.byView.push(name + ' ' + c.pills + '/' + c.want);
      ex.want += c.want; ex.pills += c.pills; ex.all = Math.max(ex.all, c.all);
      c.miss.forEach(m => ex.miss.push(name + ': ' + m)); c.stray.forEach(x => ex.stray.push(name + ': ' + x));
      Object.keys(c.by).forEach(k => { ex.by[k] = Math.max(ex.by[k] || 0, c.by[k]); });
    }
    /* an empty field takes its button while it has the focus */
    const fe = await page.evaluate(() => { const t = __w.firstField(true); if (!t) return null; t.scrollIntoView({block:'center'}); t.focus(); return true; });
    if (fe) {
      await sleep(350);
      if (census) { ex.focusTried++; if (await page.evaluate(() => !!__w.over(document.activeElement))) ex.focusOk++; }
      await page.evaluate(() => document.activeElement.blur()); await sleep(200);
    }
  }
  if (nv.length) await view(page, 0);
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(150);
  return ex;
}
async function standalone(browser, f, R){
  /* the form after the rollout */
  const log = [], ctx = await context(browser), page = await ctx.newPage(); wire(page, log);
  await page.goto(NEWURL + f.file); await sleep(900);
  const st = await page.evaluate(() => window.nbhWording ? nbhWording.status() : null);
  R.load = st && st.rules > 0 && st.badRules === 0 && st.relay === 'site' ? 'ok' : 'writing help: ' + J(st);
  await printTo(page, path.join(PDF.new, f.id + '-blank.pdf'), false);
  R.sim = await sim(page);
  const ex = await exercise(page, true);
  await printTo(page, path.join(PDF.new, f.id + '-sim.pdf'), true);
  R.views = ex.byView.join(', ');
  R.fields = {textareas: ex.all, want: ex.want, pills: ex.pills, focus: ex.focusTried ? ex.focusOk + '/' + ex.focusTried : '-', excluded: ex.by};
  R.buttons = !ex.miss.length && !ex.stray.length && ex.pills === ex.want && ex.focusOk === ex.focusTried ? 'ok' : 'FAIL ' + J({miss: ex.miss.slice(0, 6), stray: ex.stray.slice(0, 6), pills: ex.pills, want: ex.want, focus: ex.focusOk + '/' + ex.focusTried});
  /* Save data: twice, then once more after the panel has been opened and closed */
  const s1 = await save(page), s2 = await save(page);
  R.panel = await seekField(page) ? await panelRound(page, page, null) : 'no field';
  const s3 = await save(page);
  R.save = s2 == null ? 'no save button' : norm(s2) === norm(s3) ? 'same' + (norm(s1) === norm(s2) ? '' : ' (the first save differs from the second, as without the panel)') + ' ' + s3.length + ' B' : 'DIFFERS';
  R.errors = errs(log);
  await ctx.close();
  /* the same form before the rollout, the same steps */
  const lb = [], cb = await context(browser), pb = await cb.newPage(); wire(pb, lb);
  await pb.goto(OLDURL + f.file); await sleep(900);
  await printTo(pb, path.join(PDF.old, f.id + '-blank.pdf'), false);
  await sim(pb);
  await exercise(pb, false);
  await printTo(pb, path.join(PDF.old, f.id + '-sim.pdf'), true);
  R.errorsBefore = errs(lb);
  await cb.close();
}

async function narrow(browser, f, R){
  const out = {};
  for (const [k, url] of [['before', OLDURL], ['after', NEWURL]]) {
    const log = [], ctx = await context(browser, {width:390, height:844}), page = await ctx.newPage(); wire(page, log);
    await page.goto(url + f.file); await sleep(900); await sim(page);
    /* both copies on the same view: the first one with a narrative field */
    const has = await seekField(page);
    out[k] = {page: await page.evaluate(() => __w.overflow())};
    if (k === 'after' && has) {
      await page.evaluate(() => { const t = __w.firstField(false) || __w.firstField(true); t.scrollIntoView({block:'center'}); t.focus(); });
      await sleep(400);
      out[k].button = await page.evaluate(() => __w.overflow());
      out[k].shown = await page.evaluate(() => !!__w.over(document.activeElement));
      await page.evaluate(() => nbhWording.open(document.activeElement)); await sleep(500);
      out[k].opened = await page.evaluate(() => { const d = __w.root() && __w.root().querySelector('dialog.pn'); return !!(d && d.open); });
      if (out[k].opened) {
        out[k].panel = await page.evaluate(() => __w.overflow());
        for (const t of ['#tb2', '#tb3']) { await page.evaluate(s => __w.root().querySelector(s).click(), t); await sleep(200); out[k].panel = out[k].panel.concat(await page.evaluate(() => __w.overflow())); }
        await page.evaluate(() => nbhWording.close()); await sleep(250);
      }
    }
    if (k === 'after') R.errors390 = errs(log);
    await ctx.close();
  }
  const a = out.after, b = out.before;
  /* the page running past the edge before the rollout too (a wide table) is the form's, not the writing help's: what
     counts is anything new, with a button showing or with the panel open */
  const had = new Set(b.page), extra = [].concat(a.page, a.button || [], a.panel || []).filter(x => !had.has(x));
  R.w390 = (extra.length ? 'FAIL ' + J(extra.slice(0, 4)) : 'ok' + (a.button ? '' : ' (no field)')) + (b.page.length ? '; the page itself runs past the edge, as before the rollout: ' + b.page.join(', ') : '');
  if (a.button && !a.shown) R.w390 = 'FAIL the button not shown at 390 px';
  if (a.button && !a.opened) R.w390 = 'FAIL the panel did not open at 390 px';
}

/* In the workstation. A simulation gives a form random data (OB-1 marks intervals at random), so the two copies are
   compared on the SAME data: the pre-rollout form's snapshot of its simulation (A) is restored into a fresh copy of
   each (the old case opened in the new forms), and the two copies' snapshots must then be the same, before and after
   the panel has been opened and closed; the new form's own simulation must give the same field count and keys as A. */
async function openIn(pg, f){
  await pg.evaluate(i => openForm(i), f.id);
  const ok = await pg.waitForFunction(i => !!state.status[i] && !!state.frames[i], f.id, {timeout:30000}).then(() => true).catch(() => false);
  let fr = null;
  for (let i = 0; i < 20 && !fr; i++) { fr = pg.frames().find(x => x.url().includes(f.file) && !x.isDetached()) || null; if (!fr) await sleep(150); }
  return ok && fr ? fr : null;
}
/* closed, and gone: the discard question answered, and the frame removed */
async function closeIn(pg, f){
  await pg.evaluate(() => $('#closeForm').click());
  await pg.waitForFunction(() => !!document.querySelector('#cfFoot button.danger') || !Object.keys(state.frames).length, null, {timeout:3000}).catch(() => {});
  await pg.evaluate(() => { const b = document.querySelector('#cfFoot button.danger'); if (b) b.click(); });
  await pg.waitForFunction(i => !state.frames[i], f.id, {timeout:5000}).catch(() => {});
  await sleep(250);
}
const snapOf = (pg, f) => pg.evaluate(async i => { const r = await grab(i, 'snapshot', null, 10000); return r && r.snap; }, f.id);
const restoreInto = (pg, f, snap) => pg.evaluate(async ([i, s]) => { const r = await grab(i, 'restore', {snap: s}, 15000); return r && r.report; }, [f.id, snap]);
async function shell(browser, f, R, pages){
  const keys = s => J(Object.keys(s.data)), shape = (x, y) => !!x && !!y && x.total === y.total && keys(x) === keys(y);
  const vals = (x, y) => J(x.data) === J(y.data) && (x.own || '') === (y.own || '');
  const where = (x, y) => { const dk = Object.keys(x.data).filter(k => J(x.data[k]) !== J(y.data[k])); const oa = x.own || '', ob = y.own || '';
    let at = 0; while (at < oa.length && oa[at] === ob[at]) at++;
    return {fields: dk.slice(0, 6), own: oa === ob ? 'same' : {at, before: oa.slice(Math.max(0, at - 60), at + 60), after: ob.slice(Math.max(0, at - 60), at + 60)}}; };
  /* before the rollout */
  let fr = await openIn(pages.old, f);
  if (!fr) { R.snap = 'FAIL the pre-rollout form did not open'; return; }
  await sim(fr); const A = await snapOf(pages.old, f); await closeIn(pages.old, f);
  fr = await openIn(pages.old, f); await sleep(300);
  if (!fr) { R.snap = 'FAIL the pre-rollout form did not open again'; return; }
  const repA = await restoreInto(pages.old, f, A); await sleep(800);
  const A2 = await snapOf(pages.old, f); await closeIn(pages.old, f);
  /* after */
  fr = await openIn(pages.new, f);
  if (!fr) { R.snap = 'FAIL the form did not open'; return; }
  await sim(fr); const B1 = await snapOf(pages.new, f); await closeIn(pages.new, f);
  fr = await openIn(pages.new, f); await sleep(300);
  if (!fr) { R.snap = 'FAIL the form did not open again'; return; }
  const repB = await restoreInto(pages.new, f, A); await sleep(800);
  const B2 = await snapOf(pages.new, f);
  R.shellPanel = await seekField(fr) ? await panelRound(fr, pages.new, await fr.frameElement()) : 'no field';
  const B3 = await snapOf(pages.new, f); await closeIn(pages.new, f);
  if (!A || !A2 || !B1 || !B2 || !B3) { R.snap = 'FAIL no snapshot ' + J({A: !!A, A2: !!A2, B1: !!B1, B2: !!B2, B3: !!B3}); return; }
  const pos = Object.keys(A.data).filter(k => k[0] === '~').length;
  R.snapInfo = A.total + ' controls, ' + pos + ' keyed by place';
  R.restore = {before: repA, after: repB};
  if (!shape(A, B1)) R.snap = 'FAIL the simulation gives other keys ' + J({before: A.total, after: B1.total});
  else if (!shape(A2, B2) || !shape(B2, B3)) R.snap = 'FAIL keys after restoring ' + J({before: A2.total, after: B2.total, afterPanel: B3.total});
  else if (!vals(A2, B2)) { R.snap = 'FAIL the old case reads differently'; R.snapDiff = where(A2, B2); }
  else if (!vals(B2, B3)) { R.snap = 'FAIL the panel changed the values'; R.snapDiff = where(B2, B3); }
  else R.snap = 'same' + (vals(A, B1) ? '' : ' (keys; the two simulations differ in their random data, so values are compared on the old case restored)');
}

(async () => {
  const want = process.argv.slice(2);
  const list = forms().filter(f => !want.length || want.includes(f.id));
  const browser = await chromium.launch();
  const results = [];
  let next = 0;
  async function worker(w){
    const pages = {};
    const mk = async url => { const ctx = await context(browser, {width:1180, height:820}); const pg = await ctx.newPage(); const lg = []; wire(pg, lg);
      await pg.goto(url + 'index.html'); await pg.waitForFunction(() => typeof openForm === 'function'); await sleep(600); return pg; };
    pages.old = await mk(OLDURL); pages.new = await mk(NEWURL);
    while (next < list.length) {
      const f = list[next++], R = {id: f.id, file: f.file};
      const t0 = Date.now();
      try { await standalone(browser, f, R); } catch (e) { R.standalone = 'STOPPED ' + String(e && e.message || e).slice(0, 160); }
      try { await narrow(browser, f, R); } catch (e) { R.w390 = 'STOPPED ' + String(e && e.message || e).slice(0, 160); }
      try { await shell(browser, f, R, pages); } catch (e) { R.snap = 'STOPPED ' + String(e && e.message || e).slice(0, 160); }
      R.secs = Math.round((Date.now() - t0) / 1000);
      results.push(R);
      console.log([f.id.padEnd(6), 'load ' + R.load, 'buttons ' + R.buttons, 'panel ' + R.panel + ' / in the shell ' + R.shellPanel, 'save ' + R.save, 'snap ' + R.snap, '390 ' + R.w390, 'errors ' + (R.errors || []).length, R.secs + ' s'].join(' | '));
    }
    await pages.old.context().close(); await pages.new.context().close();
  }
  await Promise.all(Array.from({length: Math.min(JOBS, list.length)}, (_, i) => worker(i)));
  await browser.close();
  /* the prints, compared page by page */
  let cmp = '';
  try { cmp = execFileSync('python3', [path.join(__dirname, 'compare-print.py'), PDF.old, PDF.new], {encoding:'utf8'}); } catch (e) { cmp = 'ERR ' + (e.stdout || e.message); }
  const lines = cmp.split('\n');
  results.forEach(R => {
    const mine = lines.filter(l => new RegExp('^\\s+' + R.id.replace('-', '\\-') + '-(blank|sim)\\.pdf').test(l));
    R.print = mine.length === 0 ? 'same' : mine.every(l => /every page renders and reads the same/.test(l)) ? 'same (bytes differ, pages render and read the same)' : 'DIFFERS ' + mine.map(l => l.trim()).join('; ');
  });
  results.sort((a, b) => list.findIndex(f => f.id === a.id) - list.findIndex(f => f.id === b.id));
  fs.writeFileSync(path.join(OUT, 'results.json'), J(results, null, 1));
  const ok = R => R.load === 'ok' && R.buttons === 'ok' && /^same|^no save button/.test(R.save) && /^ok \(button\)$|^no field$/.test(R.panel || '') && /^ok \(button\)$|^no field$/.test(R.shellPanel || '') &&
    /^same/.test(R.snap) && /^same/.test(R.print) && /^ok/.test(R.w390) && !(R.errors || []).length && !(R.errors390 || []).length;
  const md = ['| Form | Load | Buttons (shown/fields with text, by view) | Focus | Excluded | Save | Snapshot | Print | 390 px | Errors |', '|---|---|---|---|---|---|---|---|---|---|'];
  results.forEach(R => md.push('| ' + [R.id, R.load, (R.buttons === 'ok' ? 'ok ' : R.buttons + ' ') + (R.views || ''), R.fields ? R.fields.focus : '', R.fields ? Object.entries(R.fields.excluded).map(([k, v]) => k + ' ' + v).join(', ') : '',
    R.save, R.snap + (R.snapInfo ? ', ' + R.snapInfo : ''), R.print, R.w390, (R.errors || []).length + (R.errors390 || []).length].join(' | ') + ' |'));
  fs.writeFileSync(path.join(OUT, 'results.md'), md.join('\n') + '\n');
  console.log('\n' + cmp.split('\n')[0]);
  const bad = results.filter(R => !ok(R));
  console.log('\n' + (results.length - bad.length) + ' of ' + results.length + ' forms pass every check' + (bad.length ? '; not: ' + bad.map(R => R.id).join(', ') : ''));
  console.log('results: ' + path.join(OUT, 'results.md'));
  process.exit(bad.length ? 1 : 0);
})();
