#!/usr/bin/env python3
"""v21.43 Put the writing help into the forms named on the command line, as ONE <script id="nbh-wording"> that holds,
each copied byte for byte: the checker's rules (tools/blocks/nbh-wording-rules.json), the relay's address
(tools/blocks/nbh-wording-config.json) and the client (tools/blocks/nbh-wording.js: the Improve wording button and
panel, the offline checker and the Rewrite with Claude client). Like patch-link.py it REPLACES an existing copy every
time, so run it again whenever one of the three files changes (a new rule, the relay going live). A new copy goes
before the form's first <script> after </main>; a form with no </main> (OB-1 is a run of .sheet pages) takes it before
its first <script> after <body>, which is the same place: after the markup, before the form's own scripts.

Every form carries it. tools/apply-polish.py puts it in (load() and put() below) with the polish layer, so
tools/polish-one.py, which runs after every rebuild of a form built from parts (tools/new-form.py, TK-1's build.sh),
puts it back into a rebuilt form; tools/build-single.py refuses a form that does not hold exactly one copy. To refresh
all 44 after a change to one of the three files: python3 tools/blocks/patch-wording.py NBH-Workstation/[A-Z]*.html

The sources are checked first and nothing is written if one is wrong: none may contain "</script" or "<!--" (either
would end or confuse the script element), the practice's name (the school edition build refuses any copy of it) or a
model ID (only the relay carries one); the rules must have the documented shape, and every rule's pattern must compile
in JavaScript and run quickly on long text (checked with node when it is installed); the relay address must be empty or
an https URL. Files are read and written without newline translation, so the copy is byte for byte on any system.

usage: python3 tools/blocks/patch-wording.py [--check] [--rules FILE] [--config FILE] FORM.html [FORM.html ...]
  --check   change nothing; exit 1 unless every form named already carries the current copy
  --rules / --config   read another rules or config file (a test fixture) instead of the ones in tools/blocks/"""
import json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BLOCKS = os.path.join(ROOT, 'tools', 'blocks')
OPEN, CLOSE = '<script id="nbh-wording">', '</script>'
TAG = '\n' + OPEN          # the element itself starts a line; the words in a comment do not count
HEAD = ('/* nbh-wording (v21.43): the writing help for the narrative fields, its wording rules and the relay address.\n'
        '   Written by tools/blocks/patch-wording.py from tools/blocks/nbh-wording-rules.json, nbh-wording-config.json and\n'
        '   nbh-wording.js, each copied byte for byte; change those files and run it again rather than editing this copy. */\n')


def fail(msg):
    sys.exit('patch-wording.py: ' + msg)


def args(argv):
    opt = {'check': False, 'rules': os.path.join(BLOCKS, 'nbh-wording-rules.json'),
           'config': os.path.join(BLOCKS, 'nbh-wording-config.json'), 'forms': []}
    it = iter(argv)
    for a in it:
        if a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        elif a == '--check':
            opt['check'] = True
        elif a in ('--rules', '--config'):
            v = next(it, None)
            if not v:
                fail(a + ' needs a file')
            opt[a[2:]] = os.path.abspath(v)
        elif a.startswith('-'):
            fail('unknown option ' + a + '; see --help')
        else:
            opt['forms'].append(a)
    if not opt['forms']:
        fail('name the form files to patch, e.g. NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html; see --help')
    return opt


def read(path, what):
    if not os.path.isfile(path):
        fail(what + ' not found: ' + os.path.relpath(path, ROOT))
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def guard(text, name):
    low = text.lower()
    for bad in ('</script', '<!--', 'newsome behavioral health'):
        if bad in low:
            fail(name + ' must not contain ' + repr(bad))
    m = re.search(r'claude-[a-z]+-\d', text, re.I)
    if m:
        fail(name + ' must not carry a model ID (' + repr(m.group(0)) + '); only the relay code does')


def check_rules(text, name):
    try:
        d = json.loads(text)
    except ValueError as e:
        fail(name + ' is not JSON: ' + str(e))
    if not isinstance(d, dict) or not isinstance(d.get('version'), str) or not isinstance(d.get('rules'), list):
        fail(name + ' must be {"version": "...", "rules": [...]}')
    seen = set()
    for i, r in enumerate(d['rules']):
        where = '%s rule %d' % (name, i + 1)
        if not isinstance(r, dict):
            fail(where + ' is not an object')
        for k in ('id', 'cat', 're', 'why', 'suggest'):
            if not isinstance(r.get(k), str) or not r[k].strip():
                fail(where + ' needs a non-empty string "' + k + '"')
        for k in ('flags', 'replace'):
            if k in r and not isinstance(r[k], str):
                fail(where + ' "' + k + '" must be a string')
        if re.search(r'[^imsu]', r.get('flags', '')):
            fail(where + ' "flags" may hold only i, m, s and u')
        extra = set(r) - {'id', 'cat', 're', 'flags', 'why', 'suggest', 'replace'}
        if extra:   # the panel reads only the keys above; others travel along unused
            print('note: %s (%s) has keys the panel does not use: %s' % (where, r['id'], ', '.join(sorted(extra))))
        if r['id'] in seen:
            fail(where + ' repeats the id ' + repr(r['id']))
        seen.add(r['id'])
    return d


def check_config(text, name):
    try:
        d = json.loads(text)
    except ValueError as e:
        fail(name + ' is not JSON: ' + str(e))
    if not isinstance(d, dict) or set(d) != {'relay'} or not isinstance(d['relay'], str):
        fail(name + ' must be {"relay": ""} or {"relay": "https://..."}, with nothing else')
    relay = d['relay'].strip()
    if relay and not (re.match(r'^https://[A-Za-z0-9.-]+(?::\d+)?(?:/[^\s?#]*)?$', relay) or
                      re.match(r'^http://(?:localhost|127\.0\.0\.1)(?::\d+)?(?:/[^\s?#]*)?$', relay)):
        fail(name + ': the relay must be empty or an https address such as https://newsomebh.com/ai, not ' + repr(relay))
    return d


NODE_CHECK = r'''
/* each pattern runs on long text inside a vm with a time limit, which stops even a pattern that backtracks without end */
const fs = require('fs'), vm = require('vm'), rules = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).rules, bad = [];
const longs = ['a '.repeat(2000), 'very '.repeat(800), 'x'.repeat(4000), ('was upset and angry, ' + '"quoted" ').repeat(140),
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'.repeat(60), ('tried to ' + 'really '.repeat(30)).repeat(15)];
const RUN = 'let w = 0; for (const s of longs) { const t = Date.now(); re.lastIndex = 0; let m, n = 0;' +
  ' while ((m = re.exec(s)) && n++ < 2000) { if (!m[0]) re.lastIndex++; } w = Math.max(w, Date.now() - t); } w';
for (const r of rules) {
  let fl = 'gi'; for (const f of (r.flags || '').replace(/[^msu]/g, '')) if (!fl.includes(f)) fl += f;
  let re; try { re = new RegExp(r.re, fl); } catch (e) { bad.push(r.id + ': does not compile (' + e.message + ')'); continue; }
  if (re.test('')) { bad.push(r.id + ': matches an empty string'); continue; }
  let worst = 0;
  try { worst = vm.runInNewContext(RUN, {re, longs, Date}, {timeout: 250}); }
  catch (e) { bad.push(r.id + ': runs for over 250 ms on long text (a pattern that backtracks)'); continue; }
  if (worst > 100) bad.push(r.id + ': takes ' + worst + ' ms on long text (a pattern that backtracks)');
}
process.stdout.write(JSON.stringify({n: rules.length, bad}));
'''


def node_check(rules_path):
    node = shutil.which('node')
    if not node:
        print('note: node is not installed, so the rules\' patterns were not compiled here (the panel skips one that fails)')
        return
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(NODE_CHECK)
        js = f.name
    try:
        out = subprocess.run([node, js, rules_path], capture_output=True, text=True, timeout=300)
    except subprocess.TimeoutExpired:
        fail('the node check of the rules did not finish in 5 minutes')
    finally:
        os.unlink(js)
    if out.returncode != 0:
        fail('the node check of the rules failed: ' + (out.stderr or out.stdout)[:400])
    res = json.loads(out.stdout)
    if res['bad']:
        fail('rules that would not work in the panel:\n  ' + '\n  '.join(res['bad']))
    print('rules: %d patterns compile and run quickly' % res['n'])


def insert_at(s, rel):
    b = re.search(r'<body[\s>]', s)
    if not b:
        fail(rel + ': no <body>')
    m = re.compile(r'</main>\s*').search(s, b.end())
    start = m.end() - 1 if m else b.end()
    t = re.compile(r'(?m)^<script(?:\s[^>]*)?>').search(s, start)
    if not t:
        fail(rel + ': no <script> after the markup')
    return t.start()


def load(rules_path=None, config_path=None):
    """Read and check the three sources once; the block every form gets, with what went into it. Stops (sys.exit)
    with the reason when a source is wrong, before anything is written. Used by main() and by tools/apply-polish.py."""
    rules_path = rules_path or os.path.join(BLOCKS, 'nbh-wording-rules.json')
    config_path = config_path or os.path.join(BLOCKS, 'nbh-wording-config.json')
    rules = read(rules_path, 'the rules file')
    config = read(config_path, 'the config file')
    client = read(os.path.join(BLOCKS, 'nbh-wording.js'), 'the client')
    for text, name in ((rules, 'the rules file'), (config, 'the config file'), (client, 'nbh-wording.js'), (HEAD, 'the header')):
        guard(text, name)
    d = check_rules(rules, 'the rules file')
    check_config(config, 'the config file')
    if 'window.nbhWording' not in client or 'nbhWordingRules' not in client:
        fail('nbh-wording.js does not look like the client')
    node_check(rules_path)
    block = (OPEN + HEAD + 'window.nbhWordingRules=\n' + rules + '\n;\nwindow.nbhWordingConfig=\n' + config + '\n;\n' + client + CLOSE)
    return {'block': block, 'client': client, 'rules': d, 'relay': json.loads(config)['relay']}


def put(s, rel, W):
    """The text of form "rel" with the current block in it, once: (text, 'inserted' | 'replaced' | 'already current')."""
    base = os.path.basename(rel)
    if not base.endswith('.html') or base in ('index.html', 'respond.html'):
        fail(rel + ': not a form (the shell and the respondent page do not take the panel)')
    block, client = W['block'], W['client']
    n = s.count(TAG)
    if n > 1:
        fail('%s: %d copies of the block; remove all but one first' % (rel, n))
    if n:
        a = s.index(TAG) + 1
        b = s.index(CLOSE, a) + len(CLOSE)
        out = s[:a] + block + s[b:]
        did = 'replaced' if s[a:b] != block else 'already current'
    else:
        a = insert_at(s, rel)
        out = s[:a] + block + '\n\n' + s[a:]
        did = 'inserted'
    if not (out.count(TAG) == 1 and out.count(block) == 1 and out.count(client) == 1):
        fail(rel + ': the result would not hold exactly one copy')
    return out, did


def main():
    opt = args(sys.argv[1:])
    W = load(opt['rules'], opt['config'])
    stale = 0
    for rel in opt['forms']:
        path = os.path.abspath(rel)
        out, did = put(read(path, 'the form'), rel, W)
        if opt['check']:
            if did != 'already current':
                stale += 1
            print(('current ' if did == 'already current' else 'STALE   ') + rel)
            continue
        if did != 'already current':
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(out)
        print(did, rel)
    print('%d form%s, %d rules (version %s), relay %s' % (len(opt['forms']), '' if len(opt['forms']) == 1 else 's',
          len(W['rules']['rules']), W['rules']['version'], W['relay'] or 'not set'))
    if stale:
        sys.exit(1)


if __name__ == '__main__':
    main()
