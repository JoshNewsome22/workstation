/* v26.28 A customer's copy (the BCBA, 11/14: "start building all the pieces that I will need for ABA companies and
   districts"): tools/build-customer.py makes the workstation with a customer's name, logo, edition tag and a licence
   required. Simulated data only: the customer is invented, and the signing key is made here for the run.
   The test builds a copy into qa/out/customer (about 130 MB; the videos are links) and opens it from the test server.
   A. the tool refuses what it must: no name, a tag of another edition, a private key in the file.
   B. the build: it runs, with a name that has an apostrophe; what it wrote is what the offline list says (pwa-sw --check).
   C. the files of the copy: the publisher's release notes are not in it; nothing in its pages, scripts, guides or
      manifest names the practice's website or the school edition; the five source credits are each there once; the
      edition tag, the autosave keys, the licence block, the app's names; the procedure videos are the same files (links).
   D. in the browser: the start page with the customer's name and logo and the strip; a licence signed with the run's key
      is accepted, one for another edition is refused, one for this edition is accepted and kept under the copy's own tag;
      Help's data map has no relay row; the forms' examples name the customer.
   E. each of the 49 forms opens by itself with no page error and the customer's name on its letterhead.
   usage: node qa/v2628-customer-test.js   (WS_URL as in qa/lib.js) */
const { chromium } = require('playwright');
const { webcrypto } = require('crypto');
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'qa', 'out', 'customer'), CONF = path.join(ROOT, 'qa', 'out', 'customer-test.json');
const URL0 = (process.env.WS_URL || 'http://127.0.0.1:8124'), B = URL0 + '/qa/out/customer/';
let n = 0, bad = 0; const ok = (t, c, d) => { n++; if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + t + (c ? '' : ' ' + JSON.stringify(d === undefined ? '' : d).slice(0, 1200))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64u = u => Buffer.from(u).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const NAME = 'St. Mary\'s County Schools', SHOWN = 'St. Mary’s County Schools', TAG = 'smc';
const build = conf => { fs.writeFileSync(CONF, JSON.stringify(conf)); return spawnSync('python3', [path.join(ROOT, 'tools', 'build-customer.py'), CONF, OUT], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }); };
(async () => {
  const kp = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await webcrypto.subtle.exportKey('jwk', kp.publicKey), priv = await webcrypto.subtle.exportKey('jwk', kp.privateKey);
  const sign = async lic => { const head = 'WSL1.' + b64u(Buffer.from(JSON.stringify(lic), 'utf8')); return head + '.' + b64u(new Uint8Array(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, Buffer.from(head)))); };
  const LIC = o => Object.assign({ v: 1, id: '2026-0001', to: NAME, kind: 'district', seats: 0, from: '2026-01-01', until: '2099-12-31' }, o || {});
  const licence = { required: true, keys: [{ x: jwk.x, y: jwk.y }], contact: 'the publisher (an invented address)' };

  /* ---- A. refusals ---- */
  const r1 = build({ tag: TAG, licence }), r2 = build({ name: NAME, tag: 'rps', licence }), r3 = build({ name: NAME, tag: TAG, licence: { required: true, keys: [{ x: jwk.x, y: jwk.y, d: priv.d }] } }), r4 = build({ name: 'A <b>name</b>', tag: TAG, licence });
  ok('A the tool refuses a file with no name, the tag of another edition, a private key among the keys, and a name with markup in it, each with the reason',
    r1.status !== 0 && /needs "name" and "tag"/.test(r1.stderr) && r2.status !== 0 && /not nbh or rps/.test(r2.stderr + r2.stdout) && r3.status !== 0 && /private key/.test(r3.stderr) && r4.status !== 0 && /must not hold/.test(r4.stderr + r4.stdout),
    [r1.stderr.slice(-200), (r2.stderr + r2.stdout).slice(-200), r3.stderr.slice(-200), (r4.stderr + r4.stdout).slice(-200)]);

  /* ---- B. the build ---- */
  const r = build({ name: NAME, tag: TAG, licence });
  ok('B the copy is built (a name with an apostrophe; no logo given, so a plain one is drawn)', r.status === 0 && /customer copy: .*tag smc, app name "SMCS Workstation" \| licence required, 1 public key/.test(r.stdout), (r.stderr + r.stdout).slice(-600));
  if (r.status !== 0) { console.log('RESULT: ' + (bad + 1) + ' failed'); process.exit(1); }
  const chk = spawnSync('python3', [path.join(ROOT, 'tools', 'pwa-sw.py'), '--check', OUT], { cwd: ROOT, encoding: 'utf8' });
  ok('B the copy\'s offline list is current: every file is the one its release list names', chk.status === 0, (chk.stdout + chk.stderr).slice(-300));

  /* ---- C. the files ---- */
  {
    const rd = f => fs.readFileSync(path.join(OUT, f), 'utf8'), all = fs.readdirSync(OUT);
    const pages = all.filter(f => (/\.(html|js)$/.test(f) && f !== 'sw.js' && !/^nbh-td1-video-/.test(f)) || /^(README\.txt|HOSTING\.md|START-HERE\.md|manifest\.json)$/.test(f));
    const KEEP = ['the Royal Palm ABC coded sheet', 'The starting point was the Royal Palm form.', '(Royal Palm School manual, pp. 64&ndash;70)', 'Royal Palm School. (n.d.). <em>Self-monitoring with interlocking schedule of reinforcement</em>', 'The Royal Palm self-monitoring session sheet'];
    const left = [], kept = KEEP.map(() => 0);
    for (const f of pages) { let t = rd(f); KEEP.forEach((k, i) => { kept[i] += t.split(k).length - 1; t = t.split(k).join(''); });
      const m = t.match(/.{0,30}(newsomebh\.com|Royal Palm|RPS Workstation|RPS-Workstation|workstation-rps|rps\.ws\.|NBH Workstation).{0,30}/g); if (m) left.push([f, m.slice(0, 3)]); }
    ok('C SETUP.md (the publisher\'s release notes) is not in the copy; the hosting guide, the first-steps guide and the readme are', !all.includes('SETUP.md') && ['HOSTING.md', 'START-HERE.md', 'README.txt'].every(f => all.includes(f)));
    ok('C nothing in the copy\'s ' + pages.length + ' pages, scripts, guides and manifest names the practice\'s website, the school edition or its app', left.length === 0 && pages.length > 100, left.slice(0, 6));
    ok('C the five source credits (Form ABC-1\'s coded sheet, Form SM-1\'s session sheet) are each there once, unchanged', kept.every(k => k === 1), kept);
    const idx = rd('index.html'), man = JSON.parse(rd('manifest.json'));
    ok('C the start page: the edition tag, the autosave keys under it, the licence block (required, the public key, the contact), the app name, the title',
      idx.includes("const DRV_ED='smc';") && idx.includes("const AUTO={key:'smc.ws.autosave.v1',pref:'smc.ws.autosave.on'") && idx.includes('<script type="application/json" id="ws-licence">' + JSON.stringify(licence).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\{ "/g, '{"') + '</script>') || /id="ws-licence">\{"required": true, "keys": \[\{"x": "[A-Za-z0-9_-]{43}", "y": "[A-Za-z0-9_-]{43}"\}\], "contact": "the publisher \(an invented address\)"\}<\/script>/.test(idx) && idx.includes('<meta name="apple-mobile-web-app-title" content="SMCS Workstation">') && idx.includes(' · ' + SHOWN + '</title>'),
      (idx.match(/id="ws-licence">[^<]*/) || [''])[0].slice(0, 200));
    ok('C no private key is in the copy', !new RegExp(priv.d.replace(/[-_]/g, '.')).test(idx) && !/"d"\s*:/.test((idx.match(/id="ws-licence">[^<]*/) || [''])[0]));
    ok('C the installed app is named for the customer', man.short_name === 'SMCS Workstation' && man.name.includes(SHOWN), [man.short_name, man.name]);
    const vids = all.filter(f => /^nbh-td1-video-/.test(f)), src = path.join(ROOT, 'NBH-Workstation');
    const same = vids.filter(f => { const a = fs.statSync(path.join(OUT, f)), b = fs.statSync(path.join(src, f)); return a.size === b.size && (a.ino === b.ino || a.nlink === 1); });
    ok('C the ' + vids.length + ' procedure videos are the practice edition\'s files (linked or copied whole)', vids.length >= 55 && same.length === vids.length && vids.length === fs.readdirSync(src).filter(f => /^nbh-td1-video-/.test(f)).length, [vids.length, same.length]);
    ok('C Rewrite with Claude is off, as in the school edition (the writing help has no relay)', rd('nbh-wording.js').includes('{"relay":"","rewrite":false}') && !pages.some(f => rd(f).includes('newsomebh.com/ai')));
  }

  /* ---- D. in the browser ---- */
  const br = await chromium.launch(), errs = [];
  {
    const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, serviceWorkers: 'block' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('start: ' + e)); p.on('dialog', d => d.accept());
    await p.goto(B + 'index.html'); await p.waitForFunction(() => window.__wsLicence, null, { timeout: 30000 }); await p.evaluate(() => window.__wsLicence.ready()); await sleep(1500);
    const s0 = await p.evaluate(() => { const b = document.querySelector('#licBar'), l = document.querySelector('#logo'); return [document.title, l && l.alt, l && l.naturalWidth > 0, b && !b.hidden && b.textContent, window.__wsLicence.state().limited]; });
    ok('D the start page carries the customer\'s name in its title and on its logo (which loads), and the strip says no licence is entered', s0[0].endsWith(' · ' + SHOWN) && s0[1] === SHOWN && s0[2] && /No licence has been entered for this copy\. To get a licence, write to the publisher/.test(s0[3]) && s0[4] === true, s0);
    const enter = async tok => { await p.evaluate(() => window.__wsLicence.open()); await p.fill('#dlgBody #licText', tok); await p.click('#dlgBody #licSave'); await sleep(700); const m = await p.textContent('#dlgBody #licMsg'); await p.evaluate(() => document.querySelector('#dlg').close()); return m; };
    const m1 = await enter(await sign(LIC({ ed: 'nbh' })));
    const m2 = await enter(await sign(LIC({ ed: TAG })));
    const st = await p.evaluate(() => [window.__wsLicence.state(), !!kvGet('nbh.licence@smc'), !kvGet('nbh.licence@nbh'), !(document.querySelector('#licBar') && !document.querySelector('#licBar').hidden)]);
    ok('D a licence for another edition is refused; one for this edition, signed with the run\'s key, is accepted, kept under the copy\'s own tag, and the strip goes', /another edition/.test(m1) && /^Kept\./.test(m2) && st[0].state === 'ok' && st[0].lic.to === NAME && st[1] && st[2] && st[3], [m1, m2, st]);
    await p.click('#help'); await sleep(400);
    const help = await p.evaluate(() => { const t = document.querySelector('#dlgBody').textContent; return [/Rewrite with Claude/.test(t), /your-website\.example/.test(t) || true, !!document.querySelector('#dlgBody #hpLic')]; }); await p.evaluate(() => document.querySelector('#dlg').close());
    ok('D Help has the Licence section and says nothing of Rewrite with Claude', help[2] && !help[0], help);
    await p.evaluate(() => openForm('DM-1')); await p.waitForFunction(() => Object.keys(state.frames).includes('DM-1') && state.frames['DM-1'].contentDocument && state.frames['DM-1'].contentDocument.querySelector('#sSchool'), null, { timeout: 30000 }); await sleep(1500);
    const dm = await p.evaluate(() => { const d = state.frames['DM-1'].contentDocument; return [...d.querySelectorAll('img')].filter(i => i.alt).map(i => i.alt)[0]; });
    ok('D Form DM-1 opened in the workstation carries the customer\'s name on its letterhead', dm === SHOWN, dm);
    await ctx.close();
  }

  /* ---- E. each form by itself ---- */
  {
    const ctx = await br.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const idx = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8'), forms = [...idx.match(/const FORMS=(\[[\s\S]*?\n\]);/)[1].matchAll(/\['[A-Z]+-1','[^']*','([^']+\.html)'\]/g)].map(m => m[1]);
    const badForms = [], fe = [];
    for (const f of forms) { const p = await ctx.newPage(); const mine = []; p.on('pageerror', e => mine.push(String(e))); p.on('dialog', d => d.accept());
      await p.goto(B + f, { waitUntil: 'load' }); await sleep(700);
      const t = await p.evaluate(() => [document.title, [...document.querySelectorAll('img')].filter(i => i.alt && i.alt.length > 3).map(i => i.alt)[0] || '']);
      if (mine.length) fe.push([f, mine[0]]); if (!t[0].endsWith(' · St. Mary’s County Schools') || t[1] !== 'St. Mary’s County Schools') badForms.push([f, t]);
      await p.close(); }
    ok('E the ' + forms.length + ' forms each open by themselves with no page error', forms.length === 49 && fe.length === 0, fe.slice(0, 5));
    ok('E and each carries the customer\'s name in its title and on its letterhead', badForms.length === 0, badForms.slice(0, 5));
    const vi = await ctx.newPage(); vi.on('pageerror', e => errs.push('VI: ' + e)); await vi.goto(B + 'Variable_Isolation_Protocol.html'); await sleep(800);
    ok('E the one form with the school as a default value (the Variable Isolation Protocol\'s site) starts with the customer\'s name', (await vi.evaluate(() => document.querySelector('input[name=s_site]').value)) === SHOWN);
    ok('E Form DM-1\'s School box gives the customer\'s name as its example (in the file; the form\'s own script may show it another way)', fs.readFileSync(path.join(OUT, 'DM-1_Student-Demographics-and-Profile_v2026-09.html'), 'utf8').includes('id="sSchool" name="s.school" placeholder="' + SHOWN + '"'));
    await ctx.close();
  }
  ok('no page error on the start page', errs.length === 0, errs.slice(0, 5));
  await br.close();
  try { fs.unlinkSync(CONF); } catch (e) {}
  console.log('RESULT: ' + (bad ? bad + ' failed' : 'all passed')); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
