/* v26.27 The licence (the BCBA, 11/13: "Add that [a licence-key system] to the list"; 11/14: "Yes").
   Simulated data only: the signing key is made here for the run, the customer and the student are invented.
   The test copy of the page: the browser's answer for index.html has its licence block rewritten (the run's public key,
   "required" on or off), so nothing in the folder is a way round the check. The date is the test browser's clock.
   A. the files: the script beside the page, loaded once; the block as shipped (no licence required, no key); the offline
      list names the script and not the issuer; the issuer page is in neither folder (tools/licence/, copied to deliver/);
      each one-file edition carries the script inline.
   B. the signature check: the browser's own and the one written out (for a page opened where the browser offers none)
      agree on 30 licences signed here, on each with one character changed, and on each signed with another key.
   C. the copy as shipped: no strip, no Licence in Help, the student's boxes take typing.
   D. the practice's own copy with a key (not required): Help has Licence; a key is checked, kept, shown, removed; no strip.
   E. a customer's copy with no licence: the strip; New student, the student's boxes and a form from the list ask for the
      licence; a wrong key says why; a good one is kept, the strip goes, the boxes take typing; kept across a reload.
   F. the dates: 31 days before the last day nothing shows; 30 days before, a strip that can be put away for the day; the
      last day; the day after and 30 days after, the strip and everything works; 31 days after, new students ask for the
      licence while the student kept on the device still opens with its form; a licence that has not started.
   G. licence.key in the folder: read, in force, and kept on the device; the longer of two wins; a page of HTML at that
      address is ignored.
   H. the issuer: makes a signing key (its file comes down locked; no key in it readable), shows the public key; a licence
      made there is accepted by a copy that carries that public key and refused by one that carries another; the key
      file opens with its passphrase and not with another; Check a licence reads it; the list holds it.
   I. sizes: the strip's buttons 44 px; a phone 390 px wide has nothing wider than the screen; no page error anywhere.
   usage: node qa/v2627-licence-test.js   (WS_URL as in qa/lib.js; WS_EDITION is not used: the school edition is checked in A) */
const { chromium } = require('playwright');
const { webcrypto } = require('crypto');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const URL0 = (process.env.WS_URL || 'http://127.0.0.1:8124');
const B = URL0 + '/NBH-Workstation/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1200))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64u = u => Buffer.from(u).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SHIPPED = '{"required":false,"keys":[],"contact":""}';
async function maker() {
  const kp = await webcrypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
  const pub = await webcrypto.subtle.exportKey('jwk', kp.publicKey);
  const sign = async lic => { const head = 'WSL1.' + b64u(Buffer.from(JSON.stringify(lic), 'utf8')); return head + '.' + b64u(new Uint8Array(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, Buffer.from(head)))); };
  return { pub: { x: pub.x, y: pub.y }, sign };
}
const LIC = (o) => Object.assign({ v: 1, id: '2027-0001', to: 'Sample County Schools', kind: 'district', seats: 0, from: '2026-07-01', until: '2027-06-30' }, o || {});
(async () => {
  const br = await chromium.launch(), errs = [];
  const M = await maker(), OTHER = await maker();
  /* a browser whose index.html carries the licence block given */
  const copy = async (conf, at, vp, extra) => {
    const ctx = await br.newContext(Object.assign({ viewport: vp || { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, serviceWorkers: 'block', acceptDownloads: true }, extra || {}));
    await ctx.route('**/NBH-Workstation/index.html', async r => { const res = await r.fetch(); let t = await res.text(); if (!t.includes(SHIPPED)) throw new Error('the licence block is not as shipped'); if (conf) t = t.replace(SHIPPED, JSON.stringify(conf)); await r.fulfill({ response: res, body: t }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('dialog', d => d.accept());
    if (at) await p.clock.setFixedTime(new Date(at + 'T10:00:00'));
    p.go = async () => { await p.goto(B + 'index.html'); await p.waitForFunction(() => window.__wsLicence && typeof kvLoad !== 'undefined', null, { timeout: 30000 }); await p.evaluate(() => window.__wsLicence.ready()); await sleep(1500); };
    p.at = async day => { await p.clock.setFixedTime(new Date(day + 'T10:00:00')); await p.go(); };
    p.st = () => p.evaluate(() => window.__wsLicence.state());
    p.strip = () => p.evaluate(() => { const b = document.querySelector('#licBar'); return b && !b.hidden && b.offsetParent ? { lim: b.classList.contains('lim'), text: b.textContent, x: !!b.querySelector('.lic-x') } : null; });
    p.dlg = () => p.evaluate(() => { const d = document.querySelector('#dlg'); return d.open ? document.querySelector('#dlgTitle').textContent : ''; });
    p.shut = async () => { await p.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close(); }); };
    p.enter = async tok => { if ((await p.dlg()) !== 'Licence') await p.evaluate(() => window.__wsLicence.open()); await p.fill('#dlgBody #licText', tok); await p.click('#dlgBody #licSave'); await sleep(700); return p.evaluate(() => { const m = document.querySelector('#dlgBody #licMsg'); return { msg: m ? m.textContent : '', cls: m ? m.className : '', line: document.querySelector('#dlgBody #licLine').textContent }; }); };
    return p;
  };

  /* ---- A. the files ---- */
  {
    const idx = fs.readFileSync(path.join(ROOT, 'NBH-Workstation', 'index.html'), 'utf8'), rps = fs.readFileSync(path.join(ROOT, 'RPS-Workstation', 'index.html'), 'utf8');
    const rel = JSON.parse(fs.readFileSync(path.join(ROOT, 'NBH-Workstation', 'release.json'), 'utf8')), relR = JSON.parse(fs.readFileSync(path.join(ROOT, 'RPS-Workstation', 'release.json'), 'utf8'));
    const tag = '<script id="nbh-licence" src="nbh-shell-licence.js"></script>', blk = '<script type="application/json" id="ws-licence">' + SHIPPED + '</script>';
    const src = fs.readFileSync(path.join(ROOT, 'NBH-Workstation', 'nbh-shell-licence.js'), 'utf8');
    ok('A the page loads nbh-shell-licence.js once and carries the licence block as shipped (no licence required, no key), in both editions; the script is the same file in both',
      idx.split(tag).length === 2 && idx.split(blk).length === 2 && rps.split(tag).length === 2 && rps.split(blk).length === 2 && fs.readFileSync(path.join(ROOT, 'RPS-Workstation', 'nbh-shell-licence.js'), 'utf8') === src,
      [idx.split(tag).length, idx.split(blk).length, rps.split(tag).length, rps.split(blk).length]);
    ok('A the offline list of each edition names the script, and neither names the issuer page', !!rel.files['nbh-shell-licence.js'] && !!relR.files['nbh-shell-licence.js'] && !rel.files['licence-issuer.html'] && !relR.files['licence-issuer.html']);
    ok('A the issuer page is in neither edition\'s folder: it is tools/licence/licence-issuer.html, and deliver/ holds the same file', !fs.existsSync(path.join(ROOT, 'NBH-Workstation', 'licence-issuer.html')) && !fs.existsSync(path.join(ROOT, 'RPS-Workstation', 'licence-issuer.html')) && fs.readFileSync(path.join(ROOT, 'tools', 'licence', 'licence-issuer.html'), 'utf8') === fs.readFileSync(path.join(ROOT, 'deliver', 'licence-issuer.html'), 'utf8'));
    const one = ['NBH-Workstation.html', 'RPS-Workstation.html'].map(f => { const t = fs.readFileSync(path.join(ROOT, 'deliver', f), 'utf8'); return [t.includes('<script id="nbh-licence">\n/* v26.27 The licence'), t.includes(tag), t.includes(blk)]; });
    ok('A each one-file edition carries the script inline (no loader left) and the block as shipped', one.every(x => x[0] && !x[1] && x[2]), one);
    ok('A the script has no way to set the date or skip the check from outside (no test hook)', !/_today|L\.now|__skip|bypass/i.test(src));
  }

  /* ---- B. the signature check, both ways ---- */
  {
    const p = await copy({ required: false, keys: [M.pub], contact: '' }, '2027-01-15'); await p.go();
    const toks = [];
    for (let i = 0; i < 30; i++) toks.push(await M.sign(LIC({ id: '2027-' + String(i + 1).padStart(4, '0'), to: ['Sample County Schools', 'Río Verde Unified, Distrito 9', 'Example ABA Partners LLC', 'North “Lakes” Academy'][i % 4] + ' ' + 'x'.repeat(i * 7), seats: i % 3 ? i * 5 : 0, kind: ['district', 'practice', 'individual', 'trial'][i % 4], note: i % 2 ? 'note ' + i : '' })));
    const other = []; for (let i = 0; i < 30; i++) other.push(await OTHER.sign(LIC({ id: 'O-' + i })));
    const r = await p.evaluate(async ({ toks, other }) => {
      const R = window.__wsLicence.read, out = { good: 0, same: 0, flip: 0, sig: 0, other: 0, to: [] };
      for (const t of toks) {
        const a = await R(t, 'browser'), b = await R(t, 'plain'); if (a.ok && b.ok) out.good++; if (JSON.stringify(a) === JSON.stringify(b)) out.same++; out.to.push(a.lic && a.lic.to);
        const parts = t.split('.'); const k = 5 + (t.length % 20), ch = parts[1][k] === 'A' ? 'B' : 'A';
        const t2 = parts[0] + '.' + parts[1].slice(0, k) + ch + parts[1].slice(k + 1) + '.' + parts[2];
        const c = await R(t2, 'browser'), d = await R(t2, 'plain'); if (!c.ok && !d.ok) out.flip++;
        const s = parts[2], j = 10 + (t.length % 40), t3 = parts[0] + '.' + parts[1] + '.' + s.slice(0, j) + (s[j] === 'A' ? 'B' : 'A') + s.slice(j + 1);
        const e = await R(t3, 'browser'), f = await R(t3, 'plain'); if (!e.ok && !f.ok) out.sig++;
      }
      for (const t of other) { const a = await R(t, 'browser'), b = await R(t, 'plain'); if (!a.ok && !b.ok && /not signed by the publisher/.test(a.why) && a.why === b.why) out.other++; }
      return out;
    }, { toks, other });
    ok('B 30 licences signed here are accepted by the browser\'s own check and by the written-out one, with the same reading (names with accents and quotes kept)', r.good === 30 && r.same === 30 && r.to[1].indexOf('Río Verde Unified, Distrito 9') === 0 && r.to[3].indexOf('North “Lakes” Academy') === 0, r);
    ok('B each of them with one character of its text changed, and each with one character of its signature changed, is refused by both checks', r.flip === 30 && r.sig === 30, r);
    ok('B 30 licences signed with another key are refused by both, with the reason', r.other === 30, r);
    const odd = await p.evaluate(async t => { const R = window.__wsLicence.read; return [(await R('hello')).why, (await R('WSL1.abc.def')).why, (await R(t.replace(/^WSL1\.[A-Za-z0-9_-]{12}/, m => m.slice(0, -4) + '!!!!'))).why, (await R(t.slice(0, t.length - 30))).why, (await R('  ' + t.replace(/(.{40})/g, '$1\n') + '  ')).ok]; }, toks[0]);
    ok('B text that is not a licence, a damaged one and a cut one each say so; a licence broken over lines with spaces round it is still read', /not a licence key/.test(odd[0]) && /not a licence key/.test(odd[1]) && /not a licence key/.test(odd[2]) && /not a licence key/.test(odd[3]) && odd[4] === true, odd);
    const wrongEd = await p.evaluate(async ts => { const R = window.__wsLicence.read; return [(await R(ts[0])).why, (await R(ts[1])).ok, (await R(ts[2])).ok, (await R(ts[3])).why]; },
      [await M.sign(LIC({ ed: 'zzz' })), await M.sign(LIC({ ed: '*' })), await M.sign(LIC({ ed: 'nbh' })), await M.sign({ v: 1, id: 'x', to: 'Sample County Schools', from: '2026-07-01' })]);
    ok('B a licence for another edition is refused with the reason; one for any edition and one for this edition are read; one without its last day is not read', /another edition/.test(wrongEd[0]) && wrongEd[1] === true && wrongEd[2] === true && /not one this version can read/.test(wrongEd[3]), wrongEd);
    await p.context().close();
  }

  /* ---- C. the copy as shipped ---- */
  {
    const p = await copy(null, '2027-01-15'); await p.go();
    const st = await p.st(); await p.click('#help'); await sleep(400);
    const help = await p.evaluate(() => !!document.querySelector('#dlgBody #hpLic')); await p.shut();
    await p.click('#pClient'); await p.keyboard.type('Dana Example'); await sleep(300);
    ok('C as shipped: no licence is required, no strip shows, Help has no Licence section, and the student\'s Name box takes typing', st.required === false && st.limited === false && !(await p.strip()) && !help && (await p.inputValue('#pClient')) === 'Dana Example' && (await p.dlg()) === '', [st, help]);
    await p.context().close();
  }

  /* ---- D. the practice's own copy, with a key ---- */
  {
    const p = await copy({ required: false, keys: [M.pub], contact: '' }, '2027-01-15'); await p.go();
    await p.click('#help'); await sleep(500);
    const sec = await p.evaluate(() => { const d = document.querySelector('#dlgBody #hpLic'); return d ? [d.querySelector('summary').textContent, d.querySelector('#licLine').textContent, !!d.querySelector('#licDrop')] : null; });
    ok('D with a key and no licence required: Help has a Licence section that says none is needed and none is entered', !!sec && sec[0] === 'Licence' && /needs no licence\. None is entered/.test(sec[1]) && sec[2] === false, sec);
    await p.evaluate(() => { document.querySelector('#dlgBody #hpLic').open = true; });
    await p.fill('#dlgBody #hpLic #licText', await M.sign(LIC({ seats: 40, kind: 'practice', to: 'Example ABA Partners LLC' }))); await p.click('#dlgBody #hpLic #licSave'); await sleep(700);
    const after = await p.evaluate(() => { const d = document.querySelector('#dlgBody #hpLic'); return [d.querySelector('#licLine').textContent, d.querySelector('#licMsg').textContent, !!d.querySelector('#licDrop'), d.querySelector('.hint').textContent]; });
    ok('D a key pasted there is checked and kept: who it is for, the kind, the staff, the number and the last day are shown, and where it came from', /Licensed to Example ABA Partners LLC \(practice licence, for 40 staff\), number 2027-0001, until June 30, 2027\./.test(after[0]) && /^Kept\./.test(after[1]) && after[2] && /entered on this/.test(after[3]), after);
    ok('D no strip in a copy that needs no licence', !(await p.strip()) && (await p.st()).state === 'ok');
    await p.click('#dlgBody #hpLic #licDrop'); await sleep(600);
    ok('D Remove the licence takes it off the device', (await p.st()).state === 'none' && await p.evaluate(() => !kvGet('nbh.licence@nbh') && /None is entered/.test(document.querySelector('#dlgBody #hpLic #licLine').textContent)));
    await p.context().close();
  }

  /* ---- E. a customer's copy with no licence ---- */
  const CUST = { required: true, keys: [M.pub], contact: 'the publisher (an invented address)' };
  {
    const p = await copy(CUST, '2027-01-15'); await p.go();
    const s0 = await p.strip(), st0 = await p.st();
    ok('E no licence: the strip says so, says how to get one and what still works, with Enter a licence and no way to put it away', st0.state === 'none' && st0.limited && !!s0 && s0.lim && !s0.x && /No licence has been entered for this copy\. To get a licence, write to the publisher \(an invented address\)\. The students kept on this computer open, print and save as before\. A new student needs a current licence\.Enter a licence$/.test(s0.text), [st0, s0]);
    await p.click('#pClient'); await sleep(400);
    const d1 = await p.dlg(), v1 = await p.evaluate(() => document.activeElement && document.activeElement.id); await p.keyboard.type('Dana'); const nm = await p.inputValue('#pClient'); await p.shut();
    ok('E a tap in the student\'s Name box opens Licence instead, and nothing is typed into the box', d1 === 'Licence' && nm === '' && v1 !== 'pClient', [d1, nm, v1]);
    await p.evaluate(() => { document.querySelector('#rail .item[data-id="DM-1"] button.open').click(); }); await sleep(500);
    const d2 = await p.dlg(), fr = await p.evaluate(() => Object.keys(state.frames).length); await p.shut();
    ok('E a form chosen from the list with no case open opens Licence instead of the form', d2 === 'Licence' && fr === 0, [d2, fr]);
    const hasNew = await p.evaluate(() => { const b = document.querySelector('.gd-start button, #gdStart button'); return [...document.querySelectorAll('button')].filter(x => x.textContent.trim() === 'New student' && x.offsetParent).map(x => x.id || x.className); });
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'New student' && x.offsetParent); if (b) b.click(); }); await sleep(1500);
    const afterNew = await p.evaluate(() => [document.querySelector('#pClient').value, Object.keys(state.frames).length, document.activeElement && document.activeElement.id]);
    ok('E New student on the start screen leads to no student and no form: the Name box is not left with the cursor in it', hasNew.length > 0 && afterNew[0] === '' && afterNew[1] === 0 && afterNew[2] !== 'pClient', [hasNew, afterNew, await p.dlg()]);
    await p.shut(); try { await p.evaluate(() => { try { window.__wsGuide && window.__wsGuide.stop && window.__wsGuide.stop(); } catch (e) {} }); } catch (e) {}
    const w1 = await p.enter(await OTHER.sign(LIC()));
    ok('E a licence signed with another key is refused with the reason, and nothing is kept', /not signed by the publisher/.test(w1.msg) && /no/.test(w1.cls) && (await p.st()).state === 'none' && await p.evaluate(() => !kvGet('nbh.licence@nbh')), w1);
    const w2 = await p.enter('   ');
    ok('E an empty box asks for the key', /Paste the licence key first/.test(w2.msg), w2);
    const g = await p.enter(await M.sign(LIC()));
    const st1 = await p.st();
    ok('E a good licence is kept: the dialog names the customer and the last day, the strip goes, the copy is no longer limited', /^Kept\./.test(g.msg) && /Licensed to Sample County Schools \(district licence, for every member of staff \(a site licence\)\), number 2027-0001, until June 30, 2027\./.test(g.line) && st1.state === 'ok' && !st1.limited && !(await p.strip()), [g, st1]);
    await p.shut(); await p.click('#pClient'); await p.keyboard.type('Dana Example'); await sleep(300);
    ok('E and the Name box takes typing again', (await p.inputValue('#pClient')) === 'Dana Example' && (await p.dlg()) === '');
    await p.keyboard.press('Tab'); await p.evaluate(() => openForm('DM-1')); await p.waitForFunction(() => Object.keys(state.frames).includes('DM-1'), null, { timeout: 20000 }); await sleep(4000);
    await p.evaluate(() => document.querySelector('#saveCase').click()); await sleep(4000); await p.shut();
    const keptRec = await p.evaluate(async () => { const L = await clList() || []; return L.map(r => r.client); });
    ok('E the student entered under the licence, and saved with Save case, is kept in the caseload on the device', keptRec.includes('Dana Example'), keptRec);
    await p.go();
    ok('E the licence is still in force after the page is loaded again', (await p.st()).state === 'ok' && (await p.st()).src === 'device' && !(await p.strip()));

    /* ---- F. the dates (the same device: the licence ends on June 30, 2027; the student Dana Example is kept) ---- */
    const clear = async () => { for (let i = 0; i < 4; i++) { const t = await p.dlg(); if (!t) break; await p.evaluate(() => { const b = [...document.querySelectorAll('#dlg button')].find(x => /Not now|Start fresh|Later|Close|No/.test(x.textContent)); if (b) b.click(); else document.querySelector('#dlg').close(); }); await sleep(400); } };
    await p.at('2027-05-30'); let st = await p.st();
    ok('F 31 days before the last day: in force, nothing shows', st.state === 'ok' && st.left === 31 && !(await p.strip()), st);
    await p.at('2027-05-31'); st = await p.st(); let s = await p.strip();
    ok('F 30 days before: a strip names the last day and the days left and how to renew, and can be put away', st.state === 'soon' && st.left === 30 && !st.limited && !!s && !s.lim && s.x && /The licence ends on June 30, 2027, in 30 days\. To renew, write to the publisher/.test(s.text), [st, s]);
    await p.click('#licBar .lic-x'); await sleep(200); const gone = !(await p.strip()); await p.go();
    ok('F put away, it stays away for the day, also when the page is loaded again', gone && !(await p.strip()) && (await p.st()).state === 'soon');
    await p.at('2027-06-01'); s = await p.strip();
    ok('F the next day it shows again', !!s && /in 29 days/.test(s.text), s);
    await p.at('2027-06-29'); s = await p.strip(); const tmr = s && /, tomorrow\./.test(s.text);
    await p.at('2027-06-30'); s = await p.strip(); st = await p.st();
    ok('F the day before it says tomorrow; on the last day it says today, and the licence is still in force', tmr && st.state === 'soon' && st.left === 0 && /June 30, 2027, today\./.test(s.text), [st, s]);
    await p.at('2027-07-01'); st = await p.st(); s = await p.strip(); await clear();
    /* with a student kept, the start screen puts the student's boxes away and offers New student */
    const newStudent = async () => { const had = await p.evaluate(() => { const b = [...document.querySelectorAll('#blNew,#blTopNew,#blPhNew')].find(x => x.offsetParent); if (b) b.click(); return b ? b.id : ''; }); await sleep(600); return had; };
    const nb = await newStudent(); const typed = (await p.dlg()) !== 'Licence' && await p.evaluate(() => { const i = document.querySelector('#pClient'); return !!i.offsetParent && document.activeElement === i; });
    ok('F the day after: the strip says it ended and until when the workstation works as before; New student still starts one (the Name box, with the cursor in it)', st.state === 'grace' && st.left === 29 && !st.limited && !!s && !s.lim && /number 2027-0001, ended on June 30, 2027\. The workstation works as before until July 30, 2027\./.test(s.text) && !!nb && typed, [st, s, nb, typed]);
    await p.at('2027-07-30'); st = await p.st();
    ok('F 30 days after: the last day of working as before', st.state === 'grace' && st.left === 0 && !st.limited, st);
    await p.at('2027-07-31'); st = await p.st(); s = await p.strip(); await clear();
    ok('F 31 days after: the strip says the licence ended and what still works, with no way to put it away', st.state === 'ended' && st.limited && !!s && s.lim && !s.x && /The licence of Sample County Schools .* ended on June 30, 2027\. To renew, write to .*The students kept on this computer open, print and save as before\. A new student needs a current licence\.Licence$/.test(s.text), [st, s]);
    const nb2 = await newStudent(); const blocked = !!nb2 && (await p.dlg()) === 'Licence'; await p.shut();
    const key = await p.evaluate(async () => { const L = await clList() || []; const r = L.find(x => x.client === 'Dana Example'); return r ? r.key : ''; });
    await p.evaluate(k => caseloadGo(k, 'DM-1'), key);
    let opened = false; try { await p.waitForFunction(() => document.querySelector('#pClient').value === 'Dana Example' && Object.keys(state.frames).includes('DM-1'), null, { timeout: 30000 }); opened = true; } catch (e) {}
    ok('F then a new student asks for the licence, while the student kept on the device opens as before, with the form', blocked && !!key && opened && (await p.dlg()) !== 'Licence', [blocked, key, opened, await p.dlg()]);
    if (process.env.LIC_SHOT) await p.screenshot({ path: process.env.LIC_SHOT });
    await p.click('#barEdit'); await sleep(400); await p.click('#pSid', { timeout: 5000 }); await p.keyboard.type('S-000123'); await sleep(300);
    ok('F and the open student\'s boxes take typing (the record is not locked)', (await p.inputValue('#pSid')).includes('S-000123') && (await p.dlg()) !== 'Licence');
    const renew = await p.enter(await M.sign(LIC({ id: '2027-0002', from: '2027-07-01', until: '2028-06-30' })));
    ok('F a renewal entered then is in force at once and the strip goes', /^Kept\./.test(renew.msg) && (await p.st()).state === 'ok' && (await p.st()).lic.id === '2027-0002' && !(await p.strip()), renew);
    await p.at('2027-06-20'); st = await p.st();
    ok('F a licence whose first day has not come is not in force yet, and says when it starts', st.state === 'early' && st.limited && /starts on July 1, 2027/.test((await p.strip()).text), st);
    await p.context().close();
  }

  /* ---- G. licence.key in the folder ---- */
  {
    const p = await copy(CUST, '2027-01-15');
    let body = await M.sign(LIC({ id: '2027-0003' })), type = 'text/plain', hits = 0;
    await p.context().route('**/NBH-Workstation/licence.key', r => { hits++; return body === null ? r.fulfill({ status: 404, body: 'Not found' }) : r.fulfill({ status: 200, contentType: type, body }); });
    await p.go(); let st = await p.st();
    ok('G the file licence.key in the folder is read and in force, and kept on the device for when it is offline', hits > 0 && st.state === 'ok' && st.src === 'folder' && st.lic.id === '2027-0003' && await p.evaluate(t => kvGet('nbh.licence@nbh') === t.trim(), body), [hits, st]);
    await p.click('#help'); await sleep(400); const from = await p.evaluate(() => document.querySelector('#dlgBody #hpLic .hint').textContent); await p.shut();
    ok('G Help says it was read from the file in the folder', /read from the file licence\.key in the workstation.s folder/.test(from), from);
    body = null; await p.go(); st = await p.st();
    ok('G with the file gone from the folder, the copy kept on the device is in force', st.state === 'ok' && st.src === 'device' && st.lic.id === '2027-0003', st);
    body = await M.sign(LIC({ id: '2027-0004', until: '2028-06-30' })); await p.go(); st = await p.st();
    ok('G a file that lasts longer than the one on the device takes over', st.lic.id === '2027-0004' && st.src === 'folder', st);
    body = await M.sign(LIC({ id: '2027-0005', until: '2027-03-31' })); await p.go(); st = await p.st();
    ok('G a file that ends sooner does not: the longer one on the device stays in use', st.lic.id === '2027-0004' && st.src === 'device', st);
    await p.evaluate(() => kvDel('nbh.licence@nbh')); body = '<!DOCTYPE html><html><body>Sign in</body></html>'; type = 'text/html'; await p.go(); st = await p.st();
    ok('G a page of HTML at that address (a sign-in page) is ignored: no licence, and not called a bad one', st.state === 'none' && st.bad === '', st);
    body = await OTHER.sign(LIC()); type = 'text/plain'; await p.go(); st = await p.st();
    ok('G a file signed with another key is not in force, and the strip says why', st.state === 'bad' && st.limited && /cannot be used: The licence key was not signed by the publisher/.test((await p.strip()).text), st);
    await p.context().close();
  }

  /* ---- H. the issuer ---- */
  {
    const ctx = await br.newContext({ viewport: { width: 1024, height: 900 }, acceptDownloads: true, serviceWorkers: 'block' });
    const q = await ctx.newPage(); q.on('pageerror', e => errs.push('issuer: ' + e)); q.on('dialog', d => d.accept());
    await q.goto(URL0 + '/deliver/licence-issuer.html'); await sleep(500);
    const first = await q.evaluate(() => [document.querySelector('#keyState').textContent, document.querySelector('#make').disabled, document.querySelector('#pubBox').hidden, document.querySelector('#from').value, document.querySelector('#lid').value]);
    ok('H the issuer opens with no key, Make the licence off, today as the first day and a number ready', /No signing key is open/.test(first[0]) && first[1] && first[2] && /^\d{4}-\d{2}-\d{2}$/.test(first[3]) && /^\d{4}-0001$/.test(first[4]), first);
    await q.click('#keyNew'); await q.fill('#pass1', 'short'); await q.fill('#pass2', 'short'); await q.click('#keyNew'); const m1 = await q.textContent('#keyMsg');
    await q.fill('#pass1', 'a long invented passphrase'); await q.fill('#pass2', 'a long invented passphrasf'); await q.click('#keyNew'); const m2 = await q.textContent('#keyMsg');
    ok('H a short passphrase and two that differ are refused', /at least 12/.test(m1) && /not the same/.test(m2), [m1, m2]);
    await q.fill('#pass2', 'a long invented passphrase');
    const [dl] = await Promise.all([q.waitForEvent('download', { timeout: 30000 }), q.click('#keyNew')]);
    const kf = path.join(require('os').tmpdir(), 'lic-test-' + process.pid + '-key.json'); await dl.saveAs(kf);
    const file = JSON.parse(fs.readFileSync(kf, 'utf8')); await sleep(300);
    const pubShown = JSON.parse(await q.inputValue('#pub'));
    ok('H Make a new signing key saves the key file (locked: it holds no readable private key), opens the key and shows the public key', dl.suggestedFilename() === 'workstation-signing-key.json' && file.v === 1 && file.kdf === 'PBKDF2-SHA256' && file.iter >= 600000 && !('d' in file) && !/"d"\s*:/.test(JSON.stringify(file)) && b64len(file.key) > 100 && pubShown.x === file.pub.x && pubShown.y === file.pub.y && /A signing key is open/.test(await q.textContent('#keyState')) && !(await q.isDisabled('#make')) && (await q.inputValue('#pass1')) === '', [dl.suggestedFilename(), Object.keys(file)]);
    await q.click('#make'); const m3 = await q.textContent('#makeMsg');
    await q.fill('#to', 'Sample County Schools'); await q.fill('#from', '2026-07-01'); await q.fill('#until', '2026-06-30'); await q.click('#make'); const m4 = await q.textContent('#makeMsg');
    ok('H a licence with no name, and one whose last day is before its first, are refused', /who the licence is for/.test(m3) && /before the first day/.test(m4), [m3, m4]);
    await q.fill('#until', '2027-06-30'); await q.fill('#seats', '0'); await q.click('#make'); await sleep(400);
    const tok = await q.inputValue('#out'), m5 = await q.textContent('#makeMsg');
    ok('H Make the licence gives a key that starts with WSL1, and says who and when', /^WSL1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{86}$/.test(tok) && /Sample County Schools is made: number \d{4}-0001, 2026-07-01 to 2027-06-30/.test(m5), [tok.slice(0, 30), m5]);
    const [dl2] = await Promise.all([q.waitForEvent('download', { timeout: 30000 }), q.click('#outSave')]); const lf = kf.replace('-key.json', '-licence.key'); await dl2.saveAs(lf);
    ok('H Save it as the file licence.key writes the same key', dl2.suggestedFilename() === 'licence.key' && fs.readFileSync(lf, 'utf8').trim() === tok);
    const list = await q.evaluate(() => [document.querySelector('#list').textContent, document.querySelector('#lid').value]);
    ok('H the list on the device holds it, and the next number is ready', /Sample County Schools/.test(list[0]) && /-0002$/.test(list[1]), list);
    /* the workstation with the issuer's public key accepts it; one with another key refuses it */
    {
      const p = await copy({ required: true, keys: [pubShown], contact: '' }, '2027-01-15'); await p.go(); const g = await p.enter(tok); const st = await p.st();
      const p2 = await copy({ required: true, keys: [M.pub], contact: '' }, '2027-01-15'); await p2.go(); const w = await p2.enter(tok);
      ok('H the licence made in the issuer is accepted by a workstation that carries the issuer\'s public key, and refused by one that carries another', /^Kept\./.test(g.msg) && st.state === 'ok' && st.lic.to === 'Sample County Schools' && /not signed by the publisher/.test(w.msg), [g, st, w]);
      /* the same licence from a file, through Open a licence file */
      await p.evaluate(() => kvDel('nbh.licence@nbh')); await p.go(); await p.evaluate(() => window.__wsLicence.open());
      await p.setInputFiles('#dlgBody #licIn', lf); await sleep(900);
      ok('H Open a licence file reads the saved file the same way', (await p.st()).state === 'ok' && /^Kept\./.test(await p.textContent('#dlgBody #licMsg')));
      await p.context().close(); await p2.context().close();
    }
    await q.fill('#chk', tok); await q.click('#chkGo'); await sleep(300); const c1 = await q.textContent('#chkOut');
    await q.fill('#chk', await M.sign(LIC())); await q.click('#chkGo'); await sleep(300); const c2 = await q.textContent('#chkOut');
    ok('H Check a licence reads it and says whether the open key signed it', /Signed with the key that is open\./.test(c1) && /Sample County Schools/.test(c1) && /2027-06-30/.test(c1) && /NOT signed with the key that is open/.test(c2), [c1.slice(0, 80), c2.slice(0, 80)]);
    await q.click('#keyClose'); const closed = await q.isDisabled('#make');
    await q.fill('#pass1', 'another invented passphrase'); await q.setInputFiles('#keyIn', kf); await sleep(1500); const o1 = await q.textContent('#keyMsg'), still = await q.isDisabled('#make');
    await q.fill('#pass1', 'a long invented passphrase'); await q.setInputFiles('#keyIn', kf); await sleep(1500); const o2 = await q.textContent('#keyMsg');
    ok('H Close the key turns Make the licence off; the key file does not open with another passphrase and opens with its own', closed && /did not open/.test(o1) && still && /The key is open/.test(o2) && !(await q.isDisabled('#make')), [closed, o1, still, o2]);
    await q.fill('#to', 'Example ABA Partners LLC'); await q.selectOption('#kind', 'trial'); await q.click('#make'); await sleep(400);
    const tok2 = await q.inputValue('#out'), lic2 = JSON.parse(Buffer.from(tok2.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    ok('H a trial made after the key file was opened again: 30 days from its first day, signed with the same key', lic2.kind === 'trial' && lic2.until === '2026-07-30' && await q.evaluate(async t => { document.querySelector('#chk').value = t; document.querySelector('#chkGo').click(); await new Promise(r => setTimeout(r, 300)); return /Signed with the key that is open\./.test(document.querySelector('#chkOut').textContent); }, tok2), lic2);
    const sent = await q.evaluate(() => performance.getEntriesByType('resource').map(r => r.name).filter(u => !u.startsWith(location.origin)));
    ok('H the issuer asked nothing of any other website', sent.length === 0, sent);
    const small = await q.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).map(b => b.id));
    await q.setViewportSize({ width: 390, height: 844 }); await sleep(300);
    ok('H its buttons are 44 px tall, its boxes 16 px, and on a phone nothing is wider than the screen', small.length === 0 && await q.evaluate(() => document.documentElement.scrollWidth <= 390 && [...document.querySelectorAll('input,select,textarea')].every(e => parseFloat(getComputedStyle(e).fontSize) >= 16)), small);
    try { fs.unlinkSync(kf); fs.unlinkSync(lf); } catch (e) {}
    await ctx.close();
  }

  /* ---- I. sizes ---- */
  {
    const p = await copy(CUST, '2027-01-15', { width: 390, height: 844 }, { isMobile: true, deviceScaleFactor: 2 }); await p.go();
    const r = await p.evaluate(() => { const b = document.querySelector('#licBar'), g = b.querySelector('.lic-go').getBoundingClientRect(); return [document.documentElement.scrollWidth, Math.round(g.height), Math.round(b.getBoundingClientRect().width)]; });
    await p.evaluate(() => window.__wsLicence.open()); await sleep(400);
    const d = await p.evaluate(() => { const db = document.querySelector('#dlgBody'); return [db.scrollWidth <= db.clientWidth + 1, [...db.querySelectorAll('.lic-box button')].every(b => b.getBoundingClientRect().height >= 44), parseFloat(getComputedStyle(db.querySelector('#licText')).fontSize)]; });
    ok('I on a phone 390 px wide: the strip fits, its button is 44 px tall, and the Licence dialog fits with 44 px buttons and a 16 px box', r[0] <= 390 && r[1] >= 44 && d[0] && d[1] && d[2] >= 16, [r, d]);
    await p.context().close();
    const w = await copy(Object.assign({}, CUST), '2027-06-15'); await w.go(); await w.enter(await M.sign(LIC())); await w.shut(); await sleep(300);
    const x = await w.evaluate(() => { const b = document.querySelector('#licBar'); return [...b.querySelectorAll('button')].map(e => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }); });
    ok('I the strip\'s two buttons (Licence, and the cross that puts it away) are 44 px', x.length === 2 && x.every(v => v[0] >= 44 && v[1] >= 44), x);
    await w.emulateMedia({ media: 'print' }); const pr = await w.evaluate(() => getComputedStyle(document.querySelector('#licBar')).display); await w.emulateMedia({ media: 'screen' });
    ok('I the strip does not print', pr === 'none', pr);
    await w.context().close();
  }
  ok('no page error in any of it', errs.length === 0, errs.slice(0, 5));
  await br.close();
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
function b64len(s) { return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').length; }
