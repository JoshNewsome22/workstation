/* autosave-test.js [scenario,...]   (v21.44 Autosave that holds up on an iPad)
   Each scenario reproduces one problem the read-only audit of 2026-10-04 found and shows it fixed. Every scenario runs
   in a fresh browser context (its own storage), against WS_URL (default http://127.0.0.1:8123).
     taps     taps in MT-1, PA-1 and SP-1 inside the workstation count as changes (the forms' unsaved mark, the shell's
              dot), reach the safety copy and survive a reload and Restore                               (problems 1, 6)
     mark     an autosave does not clear a form's unsaved mark or its quick-Save highlight, and downloads nothing (6)
     slow     Save case waits for a slow form (asked again with a longer limit); a form that never answers is named,
              the case is not marked saved and the safety copy is kept                                    (2)
     ipad     on an iPad (its user agent) Save case says to check Files and keeps the copy, marked as saved to a file (2)
     offer    a restore offer closed without an answer is not written over by the next session            (3)
     two      two tabs on two students keep two copies                                                    (3)
     photo    a photo in TK-1 is kept in the copy (as a Blob) and comes back on Restore                   (4)
     quota    a full store: the copy is kept without pictures, then without the largest form, with a warning;
              Autosave stays on and the restore names the form whose picture was not kept                (5)
     owntab   Own tab opens the form with the work in it; the shell's copy marks it as carried on there   (7)
     alone    a form opened on its own keeps a copy and offers it when it opens again; Restore brings it back (10)
     hidden   visibilitychange to hidden writes the copy at once, in the workstation and in a form on its own (10)
     migrate  the old single localStorage slot is read once, kept as a copy, and removed
     rt       all 44 forms: Save data and Open give the same file back, and so does the safety copy of a form on its
              own after a reload and Restore (RT_FORMS=MT-1,SP-1 limits it to those forms)
   usage: node qa/autosave-test.js            (every scenario; rt takes about ten minutes)
          node qa/autosave-test.js taps,slow  (those only)
   Output: one PASS or FAIL line per check, a summary, and qa/out/autosave/result.json. */
const L = require('./lib');
const { chromium, fs, path, BASE, sleep } = L;
const ED = process.env.ED || 'NBH-Workstation';
const FORMS = L.forms(ED), F = Object.fromEntries(FORMS.map(f => [f.id, f]));
const OUT = path.join(__dirname, 'out', 'autosave'); fs.mkdirSync(OUT, { recursive: true });
const IMG = path.join(L.ROOT, 'crops_te1', 'reshot_d0_now.png');
const RES = []; const SAY = (pass, name, detail) => { RES.push({ pass: !!pass, name, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail === undefined ? '' : '  ' + JSON.stringify(detail).slice(0, 400))); };
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

async function ctxOf(br, opt) { return br.newContext(Object.assign({ viewport: { width: 1180, height: 820 }, acceptDownloads: true }, opt || {})); }
function wire(page, log) {
  page.on('dialog', d => { log.push(d.type() + ': ' + d.message().slice(0, 300)); d.accept().catch(() => {}); });
  page.on('pageerror', e => log.push('pageerror: ' + String(e.message).slice(0, 200)));
}
/* the shell's notices (alert is routed to a styled notice or a toast, which the browser's dialog event never sees) */
async function hook(page) {
  await page.evaluate(() => { if (window.__msgs) return; window.__msgs = []; const a = wsUI.alert, t = wsUI.toast;
    wsUI.alert = m => { __msgs.push(String(m)); return a(m); }; wsUI.toast = (m, o) => { __msgs.push(String(m)); return t(m, o); }; });
}
const msgs = page => page.evaluate(() => (window.__msgs || []).join('\n---\n'));
async function reload(page) { await page.reload(); await sleep(2000); await hook(page); }
async function shell(ctx, log) {
  const page = await ctx.newPage(); wire(page, log || []);
  await page.goto(BASE + '/' + ED + '/index.html'); await sleep(1200); await hook(page);
  return page;
}
const frameOf = (page, id) => page.frames().find(f => f.url().includes(F[id].file));
async function open(page, id, sim) {
  await page.evaluate(id => openForm(id), id);
  await page.waitForFunction(id => !!state.status[id], id, { timeout: 20000 }).catch(() => {});
  await sleep(900);
  const fr = frameOf(page, id);
  if (sim && fr) {
    await fr.evaluate(() => { window.confirm = () => true; });
    await L.loadSim(fr); await sleep(1800);
    await fr.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] button')].find(b => /ok|load|yes|replace|continue/i.test(b.textContent)); if (b) b.click(); }).catch(() => {});
    await sleep(500);
  }
  return fr;
}
/* the form's own file, as Save data would write it, without its time stamp */
/* compared as data, without the time stamp: a field the form's own Open fills with "" where it was missing is the same record */
const ownText = t => t.evaluate(async () => { await nbhState.now(); const x = nbhState.text() || '';
  try { const o = JSON.parse(x); if (o && typeof o === 'object') ['saved', 'exported', 'savedAt', 'exportedAt'].forEach(k => delete o[k]);
    return JSON.stringify(o, (k, v) => (v === '' || v === null) ? undefined : v); } catch (e) { return x; } });
/* the places where a value of a is not in b (b may hold defaults the form's own Open adds, such as a chart type) */
function lost(a, b) {
  const out = [];
  try { const A = JSON.parse(a), B = JSON.parse(b);
    const w = (x, y, p) => { if (out.length > 40) return; if (x && typeof x === 'object') { if (!y || typeof y !== 'object' || Array.isArray(x) !== Array.isArray(y) || (Array.isArray(x) && x.length !== y.length)) { out.push(p); return; } Object.keys(x).forEach(k => w(x[k], y[k], p + '.' + k)); return; } if (JSON.stringify(x) !== JSON.stringify(y)) out.push(p); };
    w(A, B, ''); } catch (e) { if (a !== b) out.push('(unparsed)'); }
  return out;
}
const within = (a, b) => !lost(a, b).length;
/* found by this test and the same at 44a871b, before v21.44: the form's own Open drops these (reported, not hidden) */
const KNOWN = { 'SA-1': [/^\.S\.sess\.\d+\.dl$/, 'SA-1\'s own Open drops each session\'s "Delay (s) or level" (S.sess[].dl)'] };
const general = p => p.replace(/\.\d+(?=\.|$)/g, '.#');
async function copies(page) {
  return page.evaluate(async () => (await nbhCopies.list()).map(r => ({ key: r.key, kind: r.kind, tab: r.tab, student: r.student, saved: r.saved, fileAt: r.fileAt || null,
    forms: Object.keys(r.forms), dropped: r.dropped || [], pics: Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, (v.pics || []).length])),
    blobs: Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, (v.pics || []).filter(p => p instanceof Blob).length + (v.own instanceof Blob ? 'o' : '')])),
    lost: Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, v.picsLost || 0])),
    continued: Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, v.continued || null])) })));
}
/* wait until the shell has written a copy that is current (after `since`) */
async function waitAuto(page, since, ms) {
  return page.waitForFunction(t => state.auto.at && state.auto.at.getTime() > t && state.autoSig === caseSig() && !state.auto.busy, since, { timeout: ms || 45000 }).then(() => true, () => false);
}
async function offerText(page) { return page.evaluate(() => { const d = document.querySelector('#dlg'); return d && d.open ? d.innerText : null; }); }
async function clickRow(page, text, how) {
  return page.evaluate(([text, how]) => {
    const li = [...document.querySelectorAll('#dlg .as-list li')].find(l => l.innerText.includes(text));
    const b = li && li.querySelector('button[data-as="' + how + '"]'); if (b) b.click(); return !!b;
  }, [text, how]);
}
async function okStyled(page) { await page.evaluate(() => { const d = document.querySelector('#cfDlg'); if (d && d.open) { const b = d.querySelector('#cfFoot button.primary,#cfFoot button.danger'); if (b) b.click(); } }); }
async function waitFrames(page, n) { await page.waitForFunction(n => Object.keys(state.frames).length >= n && !state.restoring, n, { timeout: 90000 }).catch(() => {}); await sleep(3000); }
/* taps that change what a form saves, by form */
const TAP = {
  'MT-1': () => { const bs = [...document.querySelectorAll('td button')].filter(b => b.textContent.trim() === '+'); bs.slice(0, 6).forEach(b => b.click()); return bs.length; },
  'PA-1': () => { const bs = [...document.querySelectorAll('.pq')]; bs.slice(0, 6).forEach(b => b.click()); return bs.length; },
  'SP-1': () => { const bs = [...document.querySelectorAll('.cell')]; bs.slice(0, 6).forEach(b => b.click()); return bs.length; },
};

const S = {};
S.taps = async br => {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  const ids = ['MT-1', 'PA-1', 'SP-1'], before = {};
  for (const id of ids) await open(page, id, false);
  await sleep(1500);
  const t0 = Date.now();
  for (const id of ids) {
    const fr = frameOf(page, id), a = await ownText(fr);
    const n = await fr.evaluate(TAP[id]); await sleep(900);
    const b = await ownText(fr); before[id] = b;
    SAY(n > 0 && a !== b, id + ': taps change what Save data writes', { targets: n });
    SAY(await fr.evaluate(() => nbhGuard.isDirty()), id + ': taps set the form\'s unsaved mark (nbhGuard.isDirty)');
  }
  await sleep(4500);
  SAY(await page.evaluate(() => caseDirty()), 'shell: taps show the unsaved dot (caseDirty)');
  SAY(await waitAuto(page, t0), 'shell: the taps reach a safety copy by themselves', await page.evaluate(() => $('#autoChip').textContent));
  for (const id of ids) SAY(await frameOf(page, id).evaluate(() => nbhGuard.isDirty()), id + ': still marked unsaved after the autosave');
  await reload(page);
  const txt = await offerText(page);
  SAY(txt && /Unsaved work found/.test(txt) && ids.every(id => txt.includes(id)), 'reload: the offer lists the copy with MT-1, PA-1, SP-1', (txt || '').slice(0, 200));
  await clickRow(page, 'MT-1', 'r'); await waitFrames(page, 3);
  for (const id of ids) { const fr = frameOf(page, id); const after = fr ? await ownText(fr) : null; SAY(after === before[id], id + ': taps came back after reload and Restore', { len: [before[id].length, after && after.length] }); }
  SAY(!log.some(l => /pageerror/.test(l)), 'taps: no script errors', log.filter(l => /pageerror/.test(l)));
  await ctx.close();
};
S.mark = async br => {
  const ctx = await ctxOf(br, { viewport: { width: 820, height: 1180 } }), log = [], page = await shell(ctx, log);
  let downloads = 0; page.on('download', () => downloads++);
  const fr = await open(page, 'DM-1', false);
  await fr.evaluate(() => { const t = document.querySelector('textarea'); t.value = 'typed note'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(2500);
  const q = () => { const e = document.querySelector('#nbhSaveQuick'); return { dirty: nbhGuard.isDirty(), quick: e ? e.classList.contains('dirty') : null }; };
  const a = await fr.evaluate(q);
  const t0 = Date.now() - 4000;
  const wrote = await waitAuto(page, t0);
  await sleep(2500);
  const b = await fr.evaluate(q);
  SAY(wrote, 'an autosave ran', await page.evaluate(() => $('#autoChip').textContent));
  SAY(a.dirty && b.dirty, 'the form is still marked unsaved after the autosave', { before: a, after: b });
  SAY(a.quick === null ? b.quick === null : (a.quick && b.quick), 'the quick-Save highlight stays on' + (a.quick === null ? ' (not shown in this layout)' : ''), { before: a.quick, after: b.quick });
  SAY(downloads === 0, 'the autosave downloaded nothing', { downloads });
  await ctx.close();
};
async function slowCase(br, delay, opt) {
  const ctx = await ctxOf(br, opt), log = [], page = await shell(ctx, log);
  await page.evaluate(() => { $('#pClient').value = 'Sample Student'; $('#pClient').dispatchEvent(new Event('input', { bubbles: true })); });
  await open(page, 'DM-1', true); await open(page, 'TB-1', true); const slow = await open(page, 'PA-1', true);
  await sleep(1000);
  await page.waitForFunction(() => state.auto.at, null, { timeout: 40000 }).catch(() => {});
  /* PA-1 is busy (a heavy form on an iPad): its file is read only after `delay` ms */
  await slow.evaluate(ms => { const o = FileReader.prototype.readAsText; FileReader.prototype.readAsText = function (b) { const me = this; setTimeout(() => o.call(me, b), ms); }; }, delay);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('#saveCase')]);
  const fp = path.join(OUT, 'slow-' + delay + '.json'); await dl.saveAs(fp);
  await sleep(1500);
  const forms = Object.keys(JSON.parse(fs.readFileSync(fp, 'utf8')).forms);
  const saved = await page.evaluate(() => state.lastSig === caseSig());
  const said = await msgs(page);
  const mine = (await copies(page)).filter(r => r.key.startsWith('s-'));
  await ctx.close();
  return { forms, saved, log, said, copies: mine };
}
S.slow = async br => {
  let r = await slowCase(br, 6000);
  SAY(r.forms.length === 3 && r.forms.includes('PA-1'), 'a form slow by 6 s is waited for and is in the case file', r.forms);
  SAY(r.saved && !/NOT IN THIS FILE/.test(r.said), 'with every form in it, the case is marked saved', r.said.slice(-160));
  r = await slowCase(br, 40000);
  SAY(r.forms.length === 2 && !r.forms.includes('PA-1'), 'a form that never answers is not in the file', r.forms);
  SAY(/NOT IN THIS FILE: Form PA-1/.test(r.said), 'the notice names the missing form', r.said.slice(-260));
  SAY(!r.saved, 'the case is not marked saved');
  SAY(r.copies.length >= 1, 'the safety copy is kept', r.copies.map(c => c.key + ' ' + c.forms));
};
S.ipad = async br => {
  const ctx = await ctxOf(br, { userAgent: IPAD, viewport: { width: 820, height: 1180 }, hasTouch: true }), log = [], page = await shell(ctx, log);
  await page.evaluate(() => { $('#pClient').value = 'Ipad Student'; $('#pClient').dispatchEvent(new Event('input', { bubbles: true })); });
  await open(page, 'DM-1', true);
  await page.waitForFunction(() => state.auto.at, null, { timeout: 40000 }).catch(() => {});
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#saveCase')]);
  await sleep(1500);
  const said = await msgs(page);
  SAY(/Check that the file is in Files/.test(said), 'iPad: the notice asks to check that the file is in Files', said.slice(-200));
  const cs = await copies(page);
  SAY(cs.length === 1 && cs[0].fileAt, 'iPad: the safety copy is kept, marked as saved to a file', cs);
  SAY(await page.evaluate(() => !caseDirty()), 'iPad: the unsaved dot clears (every form is in the file)');
  await ctx.close();
};
S.offer = async br => {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  /* an earlier session's copy for Student A */
  await page.evaluate(() => nbhCopies.put({ key: 's-old-0', kind: 'shell', tab: 'oldtab', student: 'Student A', saved: new Date(Date.now() - 3600e3).toISOString(),
    packet: { client: 'Student A' }, forms: { 'DM-1': { title: 'DM-1', total: 1, data: { '#sFirst': 'Alice' }, own: '' } } }));
  await reload(page);
  const t = await offerText(page);
  SAY(t && t.includes('Student A'), 'the offer names Student A', (t || '').slice(0, 160));
  await page.evaluate(() => document.querySelector('#dlg').close());   /* "Closing this box does neither" */
  const fr = await open(page, 'TB-1', true);
  await fr.evaluate(() => { const t = document.querySelector('textarea'); t.value += ' more'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  const t0 = Date.now() - 6000; await waitAuto(page, t0); await sleep(26000);
  const cs = await copies(page), old = cs.find(c => c.key === 's-old-0');
  SAY(old && old.student === 'Student A' && old.forms.join() === 'DM-1', 'Student A\'s copy is still there, unchanged, 25 s on', old);
  SAY(cs.some(c => c.key !== 's-old-0' && c.forms.includes('TB-1')), 'the new session keeps a copy of its own', cs.map(c => c.key + ':' + c.forms));
  await reload(page);
  const t2 = await offerText(page);
  SAY(t2 && t2.includes('Student A') && t2.includes('TB-1'), 'next time both are offered', (t2 || '').slice(0, 200));
  await ctx.close();
};
S.two = async br => {
  const ctx = await ctxOf(br), log = [];
  const p1 = await shell(ctx, log), p2 = await shell(ctx, log);
  for (const [p, nm, id] of [[p1, 'Alice Able', 'DM-1'], [p2, 'Ben Best', 'TB-1']]) {
    await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d && d.open) d.close(); });
    await p.evaluate(nm => { $('#pClient').value = nm; $('#pClient').dispatchEvent(new Event('input', { bubbles: true })); }, nm);
    await open(p, id, true);
  }
  await Promise.all([waitAuto(p1, 0), waitAuto(p2, 0)]);
  const cs = await copies(p1);
  const a = cs.find(c => c.student === 'Alice Able'), b = cs.find(c => c.student === 'Ben Best');
  SAY(a && b && a.key !== b.key && a.forms.join() === 'DM-1' && b.forms.join() === 'TB-1', 'two tabs on two students keep two copies', cs.map(c => c.student + ':' + c.forms));
  const p3 = await shell(ctx, log);
  const t = await offerText(p3);
  SAY(t && t.includes('Alice Able') && t.includes('Ben Best'), 'a third tab is offered both', (t || '').slice(0, 220));
  await ctx.close();
};
async function photoSession(br, inject) {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  if (inject) await page.evaluate(inject);
  const fr = await open(page, 'TK-1', true);
  await fr.setInputFiles('#photoIn', IMG); await sleep(3000);
  const before = await fr.evaluate(() => S.photos.map(p => (p.src || p.url || p.d || JSON.stringify(p)).length));
  const text = await ownText(fr);
  const t0 = Date.now() - 6000;
  const wrote = await waitAuto(page, t0);
  return { ctx, page, log, before, text, wrote };
}
S.photo = async br => {
  const s = await photoSession(br);
  const cs = await copies(s.page);
  SAY(s.before.length && s.before[0] > 2000, 'a photo was added to TK-1', s.before);
  SAY(cs[0] && cs[0].pics['TK-1'] >= 1 && /^[1-9]/.test(String(cs[0].blobs['TK-1'])), 'the copy keeps it as a Blob', cs[0] && { pics: cs[0].pics, blobs: cs[0].blobs });
  await reload(s.page);
  await clickRow(s.page, 'TK-1', 'r'); await waitFrames(s.page, 1);
  const fr = frameOf(s.page, 'TK-1');
  const after = fr ? await fr.evaluate(() => S.photos.map(p => (p.src || p.url || p.d || JSON.stringify(p)).length)) : null;
  SAY(JSON.stringify(after) === JSON.stringify(s.before), 'the photo comes back on Restore', { before: s.before, after });
  SAY(fr && (await ownText(fr)) === s.text, 'TK-1 is exactly as it was');
  await s.ctx.close();
};
S.quota = async br => {
  /* the store refuses any record that holds a picture */
  const s = await photoSession(br, () => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (v) { if (v && v.forms && Object.values(v.forms).some(f => f.pics && f.pics.length)) throw new DOMException('full', 'QuotaExceededError'); return put.apply(this, arguments); };
  });
  const cs = await copies(s.page), chip = await s.page.evaluate(() => ({ t: $('#autoChip').textContent, c: $('#autoChip').className, pref: localStorage.getItem(AUTO.pref) }));
  SAY(s.wrote && cs[0] && cs[0].forms.includes('TK-1') && cs[0].lost['TK-1'] >= 1, 'a full store: the copy is kept without the picture', cs[0]);
  SAY(/no pictures/.test(chip.t) && /warn/.test(chip.c) && chip.pref !== 'off', 'Autosave stays on with a warning', chip);
  SAY(!/switched off/.test(await msgs(s.page)), 'nothing says Autosave was switched off');
  await reload(s.page);
  SAY(await s.page.evaluate(() => $('#autoChip').textContent !== 'Autosave off'), 'next session: Autosave is not off', await s.page.evaluate(() => $('#autoChip').textContent));
  await clickRow(s.page, 'TK-1', 'r'); await waitFrames(s.page, 1);
  const said = await msgs(s.page);
  SAY(/Form TK-1: 1 picture could not be kept/.test(said), 'the restore names the form whose picture was not kept', said.slice(-220));
  await s.ctx.close();
  /* a store that refuses anything bigger than a small form: the largest form is left out, the others kept */
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (v) { if (v && v.forms && Object.keys(v.forms).includes('IA-1')) throw new DOMException('full', 'QuotaExceededError'); return put.apply(this, arguments); };
  });
  await open(page, 'GB-1', true); await open(page, 'IA-1', true);
  await waitAuto(page, 0);
  const c2 = await copies(page), ch2 = await page.evaluate(() => ({ t: $('#autoChip').textContent, w: state.auto.warn }));
  SAY(c2[0] && c2[0].forms.join() === 'GB-1' && c2[0].dropped.join() === 'IA-1', 'the largest form is left out and the rest kept', c2[0]);
  SAY(/part only/.test(ch2.t) && /IA-1/.test(ch2.w), 'the warning names the form left out', ch2);
  await page.evaluate(() => { IDBObjectStore.prototype.put = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
  await frameOf(page, 'GB-1').evaluate(() => { const t = document.querySelector('textarea,input[type=text]'); t.value += ' x'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => /storage full/.test($('#autoChip').textContent), null, { timeout: 40000 }).catch(() => {});
  const ch3 = await page.evaluate(() => ({ t: $('#autoChip').textContent, pref: localStorage.getItem(AUTO.pref), on: autoOn() }));
  SAY(/storage full/.test(ch3.t) && ch3.on && ch3.pref !== 'off', 'a store that takes nothing: a warning, and Autosave stays on', ch3);
  await ctx.close();
};
S.owntab = async br => {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  const fr = await open(page, 'DM-1', true);
  const count = () => [...document.querySelectorAll('input,textarea,select')].filter(e => e.type !== 'checkbox' && e.type !== 'radio' && e.type !== 'file' && String(e.value).trim()).length;
  const inShell = await fr.evaluate(count), text = await ownText(fr);
  const [pop] = await Promise.all([ctx.waitForEvent('page'), page.click('#popOut')]);
  wire(pop, log);
  await pop.waitForLoadState('load');
  await pop.waitForFunction(() => /^nbh-tab\|/.test(window.name), null, { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  const inTab = await pop.evaluate(count), tabText = await ownText(pop);
  SAY(inTab === inShell && tabText === text, 'Own tab opens the form with the work in it', { inShell, inTab });
  SAY(!(await pop.evaluate(() => !!document.querySelector('#nbhAsDlg'))), 'the new tab is not offered an old copy over the work it was handed');
  await page.waitForFunction(() => Object.keys(state.auto.continued).length && state.auto.written, null, { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  const cs = await copies(page);
  const sh = cs.find(c => c.kind === 'shell'), own = cs.find(c => c.kind === 'form' && c.forms.includes('DM-1'));
  SAY(sh && sh.continued['DM-1'], 'the workstation\'s copy marks DM-1 as carried on in its own tab', sh && sh.continued);
  await pop.evaluate(() => { const t = document.querySelector('textarea'); t.value += ' in the tab'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(4000);
  const cs2 = await copies(page);
  SAY(cs2.some(c => c.kind === 'form' && c.forms.includes('DM-1')), 'the tab keeps a copy of its own', cs2.map(c => c.kind + ':' + c.forms));
  await ctx.close();
};
S.alone = async br => {
  const ctx = await ctxOf(br), log = [];
  const page = await ctx.newPage(); wire(page, log);
  await page.goto(BASE + '/' + ED + '/' + F['MT-1'].file); await sleep(1500);
  const n = await page.evaluate(TAP['MT-1']); await sleep(3500);
  const text = await ownText(page);
  const cs = await copies(page);
  SAY(n > 0 && cs.length === 1 && cs[0].kind === 'form' && cs[0].forms.join() === 'MT-1', 'MT-1 on its own keeps a copy of the taps', cs);
  SAY(await page.evaluate(() => nbhGuard.isDirty()), 'MT-1 on its own: the taps mark it unsaved (leave warning)');
  await page.reload(); await sleep(2500);
  const dlg = await page.evaluate(() => { const d = document.querySelector('#nbhAsDlg'); return d ? d.innerText : null; });
  SAY(dlg && /Unsaved work found/.test(dlg), 'opening it again offers the copy', (dlg || '').slice(0, 160));
  await page.evaluate(() => document.querySelector('#nbhAsDlg button[data-as="r"]').click());
  await sleep(2500);
  SAY((await ownText(page)) === text, 'Restore brings the taps back');
  SAY(await page.evaluate(() => nbhGuard.isDirty()), 'the restored work is marked unsaved until Save data');
  /* a pristine form makes no copy */
  const p2 = await ctx.newPage(); wire(p2, log);
  await p2.goto(BASE + '/' + ED + '/' + F['CF-1'].file); await sleep(3000);
  SAY(!(await copies(p2)).some(c => c.forms.includes('CF-1')), 'a form opened and left alone keeps no copy');
  SAY(!log.some(l => /pageerror/.test(l)), 'alone: no script errors', log.filter(l => /pageerror/.test(l)));
  await ctx.close();
};
const HIDE = () => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); };
S.hidden = async br => {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  const fr = await open(page, 'DM-1', false);
  await page.evaluate(() => { state.auto.last = Date.now(); });   // as if a copy had just been written
  await fr.evaluate(() => { const t = document.querySelector('textarea'); t.value = 'just before the tab went away'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(700);
  const t0 = Date.now();
  await page.evaluate(HIDE);
  let found = null;
  for (let i = 0; i < 30 && !found; i++) { await sleep(100); const cs = await page.evaluate(async () => { const rows = await nbhCopies.list(); for (const r of rows) { const f = r.forms['DM-1']; if (!f) continue; const t = typeof f.own === 'string' ? f.own : await f.own.text(); if (t.includes('just before the tab went away')) return r.saved; } return null; }); if (cs) found = Date.now() - t0; }
  SAY(found !== null && found < 2500, 'workstation: hidden writes the copy at once', { ms: found });
  const p2 = await ctx.newPage(); wire(p2, log);
  await p2.goto(BASE + '/' + ED + '/' + F['TB-1'].file); await sleep(1500);
  await p2.evaluate(() => { const t = document.querySelector('textarea'); t.value = 'typed then switched away'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(150);
  const t1 = Date.now(); await p2.evaluate(HIDE);
  let f2 = null;
  for (let i = 0; i < 30 && f2 === null; i++) { await sleep(100); const ok = await p2.evaluate(async () => { const rows = await nbhCopies.list(); for (const r of rows) { const f = r.forms['TB-1']; if (!f) continue; const t = typeof f.own === 'string' ? f.own : await f.own.text(); if (t.includes('typed then switched away')) return true; } return false; }); if (ok) f2 = Date.now() - t1; }
  SAY(f2 !== null && f2 < 1200, 'a form on its own: hidden writes the copy at once (before the 1.2 s pause)', { ms: f2 });
  await ctx.close();
};
S.migrate = async br => {
  const ctx = await ctxOf(br), log = [], page = await shell(ctx, log);
  await page.evaluate(() => localStorage.setItem(AUTO.key, JSON.stringify({ v: 1, saved: new Date(Date.now() - 7200e3).toISOString(), packet: { client: 'Old Slot Student' }, who: null,
    forms: { 'DM-1': { title: 'DM-1', snap: { total: 1, data: { '#sFirst': 'Olga' } } } } })));
  await page.reload(); await sleep(2500);
  const t = await offerText(page);
  SAY(t && t.includes('Old Slot Student'), 'the old slot is offered as a copy', (t || '').slice(0, 160));
  SAY(await page.evaluate(() => localStorage.getItem(AUTO.key) === null), 'and removed from localStorage');
  await ctx.close();
};
S.rt = async br => {
  const res = {}; let bad = 0;
  const RTF = FORMS.filter(f => !process.env.RT_FORMS || process.env.RT_FORMS.split(',').includes(f.id));   /* RT_FORMS=MT-1,SP-1 for a few */
  for (const f of RTF) {
    const ctx = await ctxOf(br), log = [], r = res[f.id] = {};
    try {
      const page = await ctx.newPage(); wire(page, log);
      await page.goto(BASE + '/' + ED + '/' + f.file); await sleep(900);
      await page.evaluate(() => { window.confirm = () => true; });
      await L.loadSim(page); await sleep(2200);
      await page.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] button')].find(b => /ok|load|yes|replace|continue/i.test(b.textContent)); if (b) b.click(); }).catch(() => {});
      await sleep(600);
      const A = await ownText(page);
      /* 1. Save data, then Open in a fresh page */
      const btn = await page.$('#saveBtn,#btnSave,#dl-json') || (await page.$$('button').then(async bs => { for (const b of bs) if (/^\s*save data\s*$/i.test(await b.textContent())) return b; return null; }));
      const dlP = page.waitForEvent('download', { timeout: 9000 }).catch(() => null);
      await btn.evaluate(b => b.click()); const dl = await dlP;
      const fp = path.join(OUT, 'rt-' + f.id + '.json'); if (dl) await dl.saveAs(fp);
      r.dirtyAfterSave = await page.evaluate(() => nbhGuard.isDirty());
      const p2 = await ctx.newPage(); wire(p2, log);
      await p2.goto(BASE + '/' + ED + '/' + f.file); await sleep(1200);
      await (await p2.$('#fileIn,#fileImport,#file-input')).setInputFiles(fp); await sleep(2500);
      await p2.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] button')].find(b => /ok|open|load|yes|replace|continue/i.test(b.textContent)); if (b) b.click(); }).catch(() => {});
      await sleep(800);
      const B = await ownText(p2);
      r.fileLost = lost(A, B); r.file = !r.fileLost.length || (KNOWN[f.id] && r.fileLost.every(x => KNOWN[f.id][0].test(x)));
      r.dirtyAfterOpen = await p2.evaluate(() => nbhGuard.isDirty());
      /* 2. the safety copy of the form on its own (page 1 has been working: the copy holds the simulation) */
      await page.evaluate(() => { const t = document.querySelector('textarea,input[type=text]'); if (t) { t.value += ' '; t.dispatchEvent(new Event('input', { bubbles: true })); } });
      await sleep(3200);
      const A2 = await ownText(page);
      await page.close(); await p2.close();
      const p3 = await ctx.newPage(); wire(p3, log);
      await p3.goto(BASE + '/' + ED + '/' + f.file); await sleep(2600);
      const hasDlg = await p3.evaluate(() => !!document.querySelector('#nbhAsDlg button[data-as="r"]'));
      if (hasDlg) { await p3.evaluate(() => document.querySelector('#nbhAsDlg button[data-as="r"]').click()); await sleep(2800); }
      const C = await ownText(p3);
      /* the copy brings back everything the form's own Save data and Open would (no less) */
      const fileKinds = new Set(r.fileLost.map(general));
      r.copyLost = lost(A2, C); r.copy = hasDlg && r.copyLost.every(x => fileKinds.has(general(x)));
      if (!r.file || !r.copy) {
        const d = (x, y) => { try { const X = JSON.parse(x), Y = JSON.parse(y), out = []; const w = (a, b, p) => { if (out.length > 4) return; if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) w(a[k], b[k], p + '.' + k); return; } if (JSON.stringify(a) !== JSON.stringify(b)) out.push(p + ': ' + String(JSON.stringify(a)).slice(0, 60) + ' -> ' + String(JSON.stringify(b)).slice(0, 60)); }; w(X, Y, ''); return out; } catch (e) { return ['unparsed']; } };
        if (!r.file) r.fileDiff = d(A, B);
        if (!r.copy) r.copyDiff = hasDlg ? d(A2, C) : ['no offer'];
      }
      r.errors = log.filter(l => /pageerror/.test(l)).slice(0, 3);
    } catch (e) { r.err = String(e.message || e).slice(0, 200); }
    await ctx.close();
    if (!r.file || !r.copy || r.err || (r.errors && r.errors.length)) bad++;
    process.stderr.write(f.id + (r.file && r.copy ? '' : '!') + ' ');
  }
  process.stderr.write('\n');
  fs.writeFileSync(path.join(OUT, 'rt.json'), JSON.stringify(res, null, 1));
  const failed = Object.entries(res).filter(([k, r]) => !r.file || !r.copy || r.err || (r.errors && r.errors.length));
  SAY(Object.values(res).filter(r => r.file).length === RTF.length, 'all ' + RTF.length + ' forms: Save data and Open give the same file back', failed.filter(([k, r]) => !r.file).map(([k, r]) => k + ' ' + JSON.stringify(r.fileDiff || r.err)));
  SAY(Object.values(res).filter(r => r.copy).length === RTF.length, 'all ' + RTF.length + ' forms: the safety copy comes back the same after a reload', failed.filter(([k, r]) => !r.copy).map(([k, r]) => k + ' ' + JSON.stringify(r.copyDiff || r.err)));
  SAY(Object.values(res).every(r => !r.dirtyAfterOpen), 'all forms: a file just opened is not marked unsaved', Object.entries(res).filter(([k, r]) => r.dirtyAfterOpen).map(([k]) => k));
  Object.entries(res).forEach(([k, r]) => { if (r.fileLost && r.fileLost.length && KNOWN[k]) console.log('NOTE ' + k + ': ' + KNOWN[k][1] + ' (' + r.fileLost.length + ' values; the same before v21.44)'); });
  SAY(Object.values(res).every(r => !(r.errors && r.errors.length)), 'all forms: no script errors', failed.filter(([k, r]) => r.errors && r.errors.length).map(([k, r]) => k + ' ' + r.errors[0]));
};

(async () => {
  const want = process.argv[2] ? process.argv[2].split(',') : Object.keys(S);
  const br = await chromium.launch();
  for (const k of want) {
    if (!S[k]) { console.log('unknown scenario ' + k); continue; }
    console.log('--- ' + k);
    try { await S[k](br); } catch (e) { SAY(false, k + ': ran to the end', String(e && e.stack || e).slice(0, 300)); }
  }
  await br.close();
  const n = RES.filter(r => r.pass).length;
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(RES, null, 1));
  console.log(`\n${n} of ${RES.length} checks passed` + (n === RES.length ? '' : '; failed: ' + RES.filter(r => !r.pass).map(r => r.name).join(' | ')));
  process.exit(n === RES.length ? 0 : 1);
})();
