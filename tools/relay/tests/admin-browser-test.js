/* The relay's admin page in Chromium (Playwright, found the way qa/lib.js finds it), against the relay that
   tests/run.sh started and relay-test.php left set up: sign in, make a passcode whose label is an HTML/script
   injection attempt, see it shown as plain text, use the code as the forms would, end the session, sign out.
   Also: the page at 390, 820 and 1180 px wide without sideways scrolling, every field labelled, no console
   errors (a Content-Security-Policy violation would be one).

   With --home (the extracted upload tests/run.sh serves), also: 10 minutes after the password was typed,
   Create passcode asks for it again (the sign-in time is moved back in relay.sqlite with php).

   usage: node tests/admin-browser-test.js --relay http://127.0.0.1:P [--home <folder>] [--shots <folder>] [--pages <folder>] [--password <pw>] */
'use strict';
const path = require('path'), fs = require('fs'), {execFileSync} = require('child_process');
const {chromium} = require(path.join(__dirname, '..', '..', '..', 'qa', 'lib.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const RELAY = arg('--relay', ''), SHOTS = arg('--shots', ''), PAGES = arg('--pages', ''), PW = arg('--password', 'correct horse battery staple'), HOME = arg('--home', '');
if (!RELAY) { console.error('usage: node admin-browser-test.js --relay http://127.0.0.1:P'); process.exit(2); }
if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});

let pass = 0, fail = 0; const fails = [];
function ok(cond, name, detail) {
  if (cond) { pass++; console.log('  ok    ' + name); }
  else { fail++; const d = detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400); fails.push(name + d); console.log('  FAIL  ' + name + d); }
  return cond;
}
const XSS = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>"\'&amp; Ms. R';

(async () => {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({viewport: {width: 820, height: 1180}});
    const page = await ctx.newPage();
    const errors = [], dialogs = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('dialog', d => { dialogs.push(d.message()); d.accept().catch(() => {}); });

    await page.goto(RELAY + '/ai/admin');
    ok(await page.isVisible('#f-signin'), 'the sign-in page');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'pw'), 'the password field has the focus');
    await page.fill('#pw', 'not the password at all');
    await page.press('#pw', 'Enter');
    await page.waitForFunction(() => /not the admin password/.test(document.getElementById('signin-msg').textContent), null, {timeout: 10000});
    ok(true, 'a wrong password is said plainly (in a live region)');
    ok(await page.getAttribute('#signin-msg', 'role') === 'status', '... role=status');
    await page.fill('#pw', PW);
    await page.click('#f-signin button[type=submit]');
    await page.waitForSelector('#f-code', {timeout: 10000});
    ok(true, 'the right password opens the admin page');
    const cookies = await ctx.cookies();
    const c = cookies.find(k => k.name === '__Secure-nbh_admin');
    ok(!!c && c.httpOnly && c.secure && c.sameSite === 'Strict' && c.path === '/ai/', 'the browser keeps the sign-in cookie: HttpOnly, Secure, SameSite=Strict, /ai/ only', c);
    ok(await page.evaluate(() => !document.cookie.includes('nbh_admin')), 'the page\'s script cannot read it');
    await page.waitForFunction(() => document.getElementById('status').children.length > 0);
    ok(/API key: set\./.test(await page.textContent('#status')), 'Status: the API key is set');

    ok(await page.getAttribute('#code-label', 'maxlength') === '60', 'the label field takes at most 60 characters (as the relay does)');
    await page.fill('#code-label', XSS.slice(0, 60));
    await page.selectOption('#code-hours', '4');
    await page.click('#f-code button[type=submit]');
    await page.waitForSelector('#newcode:not([hidden])', {timeout: 10000});
    const code = (await page.textContent('#nc-code')).trim();
    ok(/^[2-9A-HJ-NP-Z]{3}(-[2-9A-HJ-NP-Z]{3}){3}$/.test(code), 'a new passcode is shown: ' + code);
    ok(await page.textContent('#nc-for') === ' for ' + XSS.slice(0, 60), 'with its label, as text');
    ok(/Shown only now\. It works once, until/.test(await page.textContent('#nc-note')), 'and says it is shown once and works once');
    await page.waitForFunction(() => document.querySelectorAll('#codes li').length > 0);
    const shown = await page.$$eval('#codes .who', els => els.map(e => e.textContent));
    ok(shown.includes(XSS.slice(0, 60)), 'the unused list shows the label exactly as typed', shown);
    const injected = await page.evaluate(() => ({xss: window.__xss, imgs: document.querySelectorAll('main img').length, scripts: document.querySelectorAll('main script').length}));
    ok(injected.xss === undefined && injected.imgs === 0 && injected.scripts === 0, 'nothing in the label became markup or ran', injected);

    for (const w of [390, 820, 1180]) {
      await page.setViewportSize({width: w, height: 1000});
      await page.waitForTimeout(150);
      const m = await page.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
      ok(m.sw <= m.cw, w + ' px: no sideways scrolling', m);
      const small = await page.$$eval('button:not([hidden])', bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).map(b => b.textContent));
      ok(small.length === 0, w + ' px: every button is at least 44 px tall', small);
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'admin-' + w + '.png'), fullPage: true});
    }
    const unlabelled = await page.$$eval('input, select, textarea', els => els.filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label')).map(e => e.id));
    ok(unlabelled.length === 0, 'every field has a label', unlabelled);

    const red = await page.evaluate(async c => {
      const r = await fetch('/ai/api/redeem', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code: c.toLowerCase()}), credentials: 'omit', cache: 'no-store'});
      return {status: r.status, body: await r.json()};
    }, code);
    ok(red.status === 200 && typeof red.body.token === 'string', 'the code unlocks a tab, called the way the forms call it (same site, no cookies)', red);
    await page.click('#nc-done');
    ok(await page.isHidden('#newcode') && (await page.textContent('#nc-code')) === '', 'Done hides the code');
    ok(await page.isHidden('#code-pw-row'), 'just signed in, Create passcode does not ask for the password again');
    if (HOME) {
      execFileSync('php', ['-r', '$p = new PDO("sqlite:" . $argv[1] . "/nbh-relay/data/relay.sqlite"); $p->exec("UPDATE admin_sessions SET auth_at = " . (time() - 660));', HOME]);
      await page.fill('#code-label', 'asked again');
      await page.click('#f-code button[type=submit]');
      await page.waitForSelector('#code-pw-row:not([hidden])', {timeout: 10000});
      ok(/Enter the admin password again/.test(await page.textContent('#code-msg')) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'code-pw'),
        '10 minutes after the password was typed, Create passcode asks for it again, with the focus in its field');
      await page.fill('#code-pw', PW);
      await page.click('#f-code button[type=submit]');
      await page.waitForFunction(() => /^[2-9A-HJ-NP-Z]{3}(-[2-9A-HJ-NP-Z]{3}){3}$/.test(document.getElementById('nc-code').textContent), null, {timeout: 10000});
      ok(await page.isHidden('#code-pw-row') && (await page.inputValue('#code-pw')) === '', 'with it the passcode is made, and the password field is emptied and put away');
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'admin-asked-again.png'), fullPage: true});
      await page.click('#nc-done');
    }
    await page.click('#refresh');
    await page.waitForFunction(() => document.querySelectorAll('#sessions li').length > 0);
    const sess = await page.textContent('#sessions');
    ok(sess.includes(XSS.slice(0, 60)) && /Rewrites: 0 of 300/.test(sess), 'the session is listed with the code\'s label and its rewrite count');
    ok(!(await page.$$eval('#codes .who', els => els.map(e => e.textContent))).includes(XSS.slice(0, 60)), 'the used code is gone from the unused list');
    await page.click('#sessions li button.danger');
    await page.waitForFunction(() => document.querySelectorAll('#sessions li').length === 0);
    ok(dialogs.some(d => /End this session/.test(d)), 'ending a session asks first');
    const after = await page.evaluate(async t => (await fetch('/ai/api/rewrite', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token: t, text: 'x', style: 'concise'}), credentials: 'omit'})).status, red.body.token);
    ok(after === 401, 'the ended session\'s token no longer works', after);
    await page.click('#signout');
    await page.waitForSelector('#f-signin', {timeout: 10000});
    ok(true, 'Sign out returns to the sign-in page');
    ok(!(await ctx.cookies()).some(k => k.name === '__Secure-nbh_admin' && k.value), 'and the cookie is gone');
    // the wrong password and the ended session answered 401 on purpose, the passcode that needed the password 403;
    // the browser notes each such answer
    const unexpected = errors.filter(e => !/Failed to load resource: the server responded with a status of 40[13]/.test(e));
    ok(unexpected.length === 0, 'no other console errors (no Content-Security-Policy violations)', unexpected);
    /* the setup and sign-in pages as relay-test.php saved them (this test's relay is already set up) */
    if (PAGES && fs.existsSync(PAGES)) {
      for (const f of fs.readdirSync(PAGES).filter(n => n.endsWith('.html')).sort()) {
        for (const w of [390, 1180]) {
          const p2 = await ctx.newPage();
          await p2.setViewportSize({width: w, height: 900});
          await p2.goto('file://' + path.join(PAGES, f));
          const m = await p2.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth}));
          ok(m.sw <= m.cw, f + ' at ' + w + ' px: no sideways scrolling', m);
          if (SHOTS) await p2.screenshot({path: path.join(SHOTS, f.replace(/\.html$/, '') + '-' + w + '.png'), fullPage: true});
          await p2.close();
        }
      }
    }
  } catch (e) {
    ok(false, 'the browser steps ran to the end', String(e && e.stack || e));
  } finally {
    await browser.close();
  }
  console.log('\nadmin-browser-test: ' + pass + ' passed, ' + fail + ' failed');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(fail ? 1 : 0);
})();
