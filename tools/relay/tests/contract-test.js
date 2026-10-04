/* The forms' panel and the relay must agree on the wire. This takes the panel's own functions that read the
   relay's answers (errCode, waitText, errText, readAnswer, expiryOf, canonCode... from tools/blocks/nbh-wording.js,
   unchanged) and runs them on answers the relay really gave in relay-test.php (recorded in contract.json), then
   checks what the person would be told. If the panel's wording or its reading of the codes changes, this says
   which answer no longer reads right.

   usage: node tests/contract-test.js <contract.json> <tools/blocks/nbh-wording.js> */
'use strict';
const fs = require('fs'), vm = require('vm');
const [contractFile, clientFile] = process.argv.slice(2);
if (!contractFile || !clientFile) { console.error('usage: node contract-test.js <contract.json> <nbh-wording.js>'); process.exit(2); }
const src = fs.readFileSync(clientFile, 'utf8');
const C = JSON.parse(fs.readFileSync(contractFile, 'utf8'));

let pass = 0, fail = 0; const fails = [];
/* returns whether it held, so a check that needs a recorded answer can be skipped when there is none (as written
   before v21.43 it returned nothing, so every check behind "if (!ok(...)) continue" was skipped) */
function ok(cond, name, detail) {
  if (cond) { pass++; console.log('  ok    ' + name); }
  else { fail++; const d = detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400); fails.push(name + d); console.log('  FAIL  ' + name + d); }
  return !!cond;
}

/* a top-level function (balanced braces) or a one-line const, as written in the panel's file */
function grab(name) {
  const at = src.indexOf('\nfunction ' + name + '(');
  if (at < 0) {
    const m = new RegExp('\\nconst ' + name + ' = [^\\n]*;').exec(src);
    if (!m) throw new Error('the panel has no ' + name);
    return m[0];
  }
  for (let k = src.indexOf('{', at), depth = 0; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(at, k + 1);
  }
  throw new Error('could not read ' + name);
}
const names = ['str', 'KEPT', 'clean', 'errCode', 'waitText', 'errText', 'itemText', 'readAnswer', 'expiryOf', 'canonCode'];
let api;
try {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(names.map(grab).join('\n') + '\nthis.api = {errCode, waitText, errText, readAnswer, expiryOf, canonCode};', ctx);
  api = ctx.api;
  ok(true, 'the panel\'s answer-reading functions load: ' + names.join(', '));
} catch (e) {
  ok(false, 'the panel\'s answer-reading functions load', String(e));
  console.log('\ncontract-test: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(1);
}

/* what the panel's post() hands to errText/readAnswer */
const asPanel = e => ({ok: e.status >= 200 && e.status < 300, status: e.status, body: e.body, retry: e.retry});
const told = (e, kind) => api.errText(asPanel(e), kind);
const by = {};
C.entries.forEach(e => { by[e.name] = e; });

const errors = {
  redeem_used: ['redeem', /That passcode was not accepted\./],
  redeem_origin: ['redeem', /refused this copy of the forms/],
  redeem_paused: ['redeem', /Too many passcode tries\. Wait about 15 minutes/],
  setup_required: ['rewrite', /The rewrite service is not set up yet\..*still work without it\./],
  rewrite_refusal: ['rewrite', /could not rewrite this text/],
  rewrite_max_tokens: ['rewrite', /could not rewrite this text/],
  rewrite_bad_json: ['rewrite', /not working right now/],
  rewrite_429_every_time: ['rewrite', /Too many rewrites in a short time\. Wait about a minute/],
  rewrite_429_asking_for_2_minutes: ['rewrite', /Too many rewrites in a short time\. Wait about 2 minutes/],
  rewrite_529_overloaded: ['rewrite', /not working right now/],
  rewrite_500_every_time: ['rewrite', /not working right now/],
  rewrite_400_invalid_request: ['rewrite', /not working right now/],
  rewrite_timeout: ['rewrite', /not working right now/],
  rewrite_no_token: ['rewrite', /session has ended\. Enter a new passcode/],
  rewrite_expired: ['rewrite', /session has ended\. Enter a new passcode/],
  rewrite_bad_style: ['rewrite', /could not use this request \(error 400\)/],
  rewrite_too_long: ['rewrite', /too long to send in one go/],
  rewrite_session_cap: ['rewrite', /used all of its rewrites\. Ask your BCBA for a new passcode/],
  rewrite_burst: ['rewrite', /Too many rewrites in a short time\. Wait about a minute/],
  rewrite_origin: ['rewrite', /refused this copy of the forms/],
};
console.log('\n== what the person is told, for each answer the relay gave');
for (const [name, [kind, re]] of Object.entries(errors)) {
  const e = by[name];
  if (!ok(!!e, name + ': recorded')) continue;
  const msg = told(e, kind === 'redeem' ? 'redeem' : undefined);
  ok(re.test(msg), name + ' (' + e.status + ' ' + (e.body && e.body.error) + '): "' + msg.slice(0, 90) + '"', msg);
  if (kind === 'rewrite' && !/refused this copy/.test(msg)) ok(/Your text is still here\./.test(msg), name + ': the text is kept', msg);
}

console.log('\n== the check the panel makes as its Rewrite with Claude tab opens (GET /api/health)');
const hs = by.health_setup, hk = by.health_ok;
if (ok(!!hs, 'health_setup: recorded')) {
  const msg = api.errText(asPanel(hs), 'reach', 'newsomebh.com');
  ok(/^The rewrite service on newsomebh\.com is not set up yet\. Check wording and the iPad\u2019s Writing Tools still work without it\.$/.test(msg), 'health_setup (' + hs.status + ' ' + (hs.body && hs.body.error) + '): "' + msg + '"', msg);
}
if (ok(!!hk, 'health_ok: recorded')) ok(hk.status === 200 && !!hk.body && hk.body.ok === true, 'health_ok: {ok:true}, which the panel takes as the service being there', hk.body);
/* the relay not on the website at all: what the website itself answers (its own 404 page), or nothing */
const there = [['a 404 page from the website', {ok:false, status:404, body:null}], ['a 200 page that is not the relay', {ok:true, status:200, body:null}],
  ['a 405 from the website', {ok:false, status:405, body:null}], ['no answer (not reachable)', {ok:false, status:0, body:null}]];
for (const [what, r] of there) {
  for (const kind of ['reach', 'redeem', 'rewrite']) {
    const msg = api.errText(r, kind, 'newsomebh.com');
    ok(/^The rewrite service on newsomebh\.com is not reachable, or it is not set up yet\./.test(msg) && /Check wording and the iPad\u2019s Writing Tools still work without it\.$/.test(msg) && (kind === 'reach' || /Your text is still here\./.test(msg)),
       kind + ', ' + what + ': "' + msg.slice(0, 120) + '"', msg);
  }
}

console.log('\n== answers the panel uses');
const r = by.redeem_ok;
if (ok(!!r, 'redeem_ok: recorded')) {
  ok(typeof r.body.token === 'string' && r.body.token.length >= 16 && r.body.token.length <= 1024, 'the token is one the panel keeps (16 to 1024 characters)');
  const exp = api.expiryOf(r.body.expires), want = (C.now + 8 * 3600) * 1000;
  ok(Math.abs(exp - want) < 10 * 60 * 1000, 'the panel reads the session end as about 8 hours on', {expires: r.body.expires, read: exp, want});
}
for (const name of ['rewrite_ok', 'rewrite_thinking', 'rewrite_fallback', 'rewrite_429_once_then_ok', 'rewrite_500_once_then_ok']) {
  const e = by[name];
  if (!ok(!!e && e.status === 200, name + ': recorded, 200')) continue;
  const a = api.readAnswer(e.body, e.style);
  ok(!!a && typeof a.text === 'string' && /\[Student\]/.test(a.text), name + ': the panel reads the rewrite', a);
  ok(!!a && Array.isArray(a.changes) && Array.isArray(a.cautions), name + ': and its changes and cautions', a);
}
const ans = by.rewrite_ok && api.readAnswer(by.rewrite_ok.body, 'objective');
ok(!!ans && ans.changes.length === 1 && ans.cautions.length === 1 && /\[number\]/.test(ans.cautions[0]), 'rewrite_ok: one change, one caution, as sent', ans);

console.log('\n== passcodes as the admin page shows them');
ok(api.canonCode(C.code) === C.code, 'the panel keeps a code as the admin page prints it (' + C.code + ')');
ok(api.canonCode(' ' + C.code.toLowerCase().replace(/-/g, ' ') + ' ') === C.code, 'and reads it typed in lower case with spaces');
ok(api.canonCode(C.code.replace(/-/g, '–')) === C.code, 'or with long dashes (what an iPad keyboard may put in)');

console.log('\ncontract-test: ' + pass + ' passed, ' + fail + ' failed');
fails.forEach(f => console.log('  - ' + f));
process.exit(fail ? 1 : 0);
