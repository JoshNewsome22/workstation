#!/usr/bin/env python3
"""v25.67 Put the TB-1 replacement-behavior library (tools/blocks/tb1-replacement-library.json) into Form TB-1 as
<script id="tb1-rlib">const TB1_RLIB=...;</script>. It REPLACES an existing copy every time, so re-run it whenever the
library changes. A new copy goes just before the form's main script (the first plain <script> in the body), after the
problem-behavior library (tb1-lib) when that is there.

Before anything is written the library is checked: it must parse as {"version":..., "note":..., "entries":[...]}, hold
no "</script" and no "Newsome Behavioral Health" (the school edition is built from this one by name), and every entry
must have an id (unique, "r-" and lower-case words), a category (one of CATS below), a label, other names (aka, a list),
the functions it suits (fn: escape, attention, tangible, automatic, or any), the problem behaviors it replaces (pairs:
ids of tools/blocks/tb1-behavior-library.json, at least one), a definition, at least 3 examples and 3 non-examples (one
per line), how to count it (measure), how it is taught (teach, which says there is no physical guidance beyond what the
student allows), a mastery criterion (crit) and a note naming its studies ("Definition after ..."). A per-response
criterion with a percentage is 100% (the workstation's standard); an interval, time-sample or duration criterion keeps
its own level. No text may write an adult holding, gripping or restraining a part of the student's body.
The JSON is written compact, with every "<" as \\u003c and U+2028/U+2029 escaped, so it can never close or confuse the
script element and it parses as JavaScript in every browser. The form must end with exactly one copy.

usage: python3 tools/blocks/patch-tb1-rlib.py            write (or refresh) the copy in the form
       python3 tools/blocks/patch-tb1-rlib.py --check    change nothing; exit 1 when the form's copy is missing,
                                                          doubled, or not what the library would write now"""
import json, os, re, sys

args = sys.argv[1:]
if args in (['-h'], ['--help']):
    print(__doc__); sys.exit(0)
if args not in ([], ['--check']):
    sys.exit('patch-tb1-rlib.py takes no arguments or --check (it got ' + ' '.join(args) + '); see --help')
CHECK = args == ['--check']
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RLIB = os.path.join(ROOT, 'tools', 'blocks', 'tb1-replacement-library.json')
PLIB = os.path.join(ROOT, 'tools', 'blocks', 'tb1-behavior-library.json')
FORM = os.path.join(ROOT, 'NBH-Workstation', 'TB-1_Target-Behavior-Development_v2026-09.html')
OPEN, CLOSE = '<script id="tb1-rlib">', '</script>'
TAG = '\n' + OPEN   # the element itself starts a line; the words in a comment do not count
CATS = ['Communication', 'Tolerance and waiting', 'Safety skills', 'Social and classroom', 'Self-management and coping',
        'Daily living and feeding', 'Matched and leisure alternatives']
FNS = ['escape', 'attention', 'tangible', 'automatic', 'any']
TEXT = ['id', 'cat', 'lab', 'def', 'ex', 'nex', 'measure', 'teach', 'crit', 'note']
KEYS = set(TEXT + ['aka', 'fn', 'pairs'])
HOLD = re.compile(r"\b(?:hold|holds|holding|held|grip|grips|gripping|gripped|restrain\w*|grasp\w*)\b[^.;\n]{0,40}?"
                  r"\b(?:hand|hands|arm|arms|wrist|wrists|head|leg|legs|shoulder|shoulders|body)\b", re.I)
TIMED = re.compile(r'\b(?:interval|time.sampl|duration|of the walk|of the time|samples?)\b', re.I)


def fail(msg):
    sys.exit('refused: ' + msg)


raw = open(RLIB, encoding='utf-8').read()
for bad in ('</script', 'Newsome Behavioral Health'):
    if bad.lower() in raw.lower():
        fail('tb1-replacement-library.json contains ' + repr(bad))
try:
    lib = json.loads(raw)
except ValueError as e:
    fail('tb1-replacement-library.json does not parse: ' + str(e))
if not isinstance(lib, dict) or set(lib) != {'version', 'note', 'entries'} or not isinstance(lib['entries'], list) or not lib['entries']:
    fail('the library must be {"version":..., "note":..., "entries":[...]} and nothing else')
if not (isinstance(lib['version'], str) and re.fullmatch(r'\d{4}-\d{2}', lib['version'])) or not (isinstance(lib['note'], str) and lib['note'].strip()):
    fail('the library needs a version (YYYY-MM) and a note')
try:
    pids = {e['id'] for e in json.load(open(PLIB, encoding='utf-8'))['entries']}
except (ValueError, KeyError, TypeError) as e:
    fail('tb1-behavior-library.json (the problem behaviors pairs name) does not read: ' + str(e))

errs, seen = [], set()
for i, e in enumerate(lib['entries']):
    where = '#%d %s' % (i, e.get('id', '?') if isinstance(e, dict) else '?')
    if not isinstance(e, dict):
        errs.append(where + ': not an object'); continue
    for k in set(e) - KEYS:
        errs.append(where + ': unknown field ' + k)
    for k in TEXT:
        if not isinstance(e.get(k), str) or not e[k].strip():
            errs.append(where + ': missing ' + k)
    if not re.fullmatch(r'r-[a-z0-9]+(?:-[a-z0-9]+)*', str(e.get('id', ''))):
        errs.append(where + ': the id must be "r-" and lower-case words')
    if e.get('id') in seen:
        errs.append(where + ': duplicate id')
    seen.add(e.get('id'))
    if e.get('cat') not in CATS:
        errs.append(where + ': category ' + repr(e.get('cat')) + ' is not one of ' + ', '.join(CATS))
    if not (isinstance(e.get('aka'), list) and e['aka'] and all(isinstance(a, str) and a.strip() for a in e['aka'])):
        errs.append(where + ': aka must be a list of other names')
    fn = e.get('fn')
    if not (isinstance(fn, list) and fn and all(f in FNS for f in fn) and len(set(fn)) == len(fn)) or ('any' in (fn or []) and len(fn) > 1):
        errs.append(where + ': fn must list functions from ' + ', '.join(FNS) + ' ("any" alone)')
    pr = e.get('pairs')
    if not (isinstance(pr, list) and pr and all(isinstance(p, str) for p in pr) and len(set(pr)) == len(pr)):
        errs.append(where + ': pairs must list problem-behavior ids')
    else:
        for p in pr:
            if p not in pids:
                errs.append(where + ': pairs names ' + repr(p) + ', which is not in tb1-behavior-library.json')
    for k in ('ex', 'nex'):
        if isinstance(e.get(k), str) and len([x for x in e[k].split('\n') if x.strip()]) < 3:
            errs.append(where + ': ' + k + ' has fewer than 3 lines')
    if isinstance(e.get('note'), str) and not e['note'].startswith('Definition after '):
        errs.append(where + ': the note must begin "Definition after " and name the studies')
    if isinstance(e.get('teach'), str) and 'no physical guidance beyond what the student allows' not in e['teach']:
        errs.append(where + ': teach must say there is no physical guidance beyond what the student allows')
    if isinstance(e.get('crit'), str):
        pcts = [float(x) for x in re.findall(r'(\d+(?:\.\d+)?)\s*%', e['crit'])]
        if pcts and not TIMED.search(e['crit']) and min(pcts) < 100:
            errs.append(where + ': a per-response criterion is 100% (the workstation\'s standard); an interval one says so')
        if 'consecutive' not in e['crit']:
            errs.append(where + ': the criterion says across how many consecutive sessions')
    for k in TEXT + ['aka']:
        v = e.get(k)
        for t in (v if isinstance(v, list) else [v]):
            if isinstance(t, str) and HOLD.search(t):
                errs.append(where + ': ' + k + ' writes holding a part of the body: ' + repr(HOLD.search(t).group(0)))
if errs:
    fail('%d problem%s in the library\n  ' % (len(errs), '' if len(errs) == 1 else 's') + '\n  '.join(errs[:40]))

js = json.dumps(lib, ensure_ascii=False, separators=(',', ':'))
js = js.replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
assert '</script' not in js.lower() and json.loads(js) == lib
block = OPEN + 'const TB1_RLIB=' + js + ';' + CLOSE

s = open(FORM, encoding='utf-8').read()
n = s.count(TAG)
if CHECK:
    probs = []
    if n != 1 or s.count(OPEN) != 1 or s.count('const TB1_RLIB=') != 1:
        probs.append('the form holds %d copies of the replacement library (one is right)' % s.count(OPEN))
    elif block not in s:
        probs.append('the form\'s copy is not what the library would write now: run python3 tools/blocks/patch-tb1-rlib.py')
    elif s.index(OPEN) > s.index('function tgtCard('):
        probs.append('the replacement library comes after the form\'s main script')
    if probs:
        print('\n'.join(probs)); sys.exit(1)
    print('current: the replacement library in %s (%d entries)' % (os.path.relpath(FORM, ROOT), len(lib['entries'])))
    sys.exit(0)

assert n <= 1, (n, 'copies of the replacement library in the form')
if n:
    a = s.index(TAG) + 1
    b = s.index(CLOSE, a) + len(CLOSE)
    s = s[:a] + block + s[b:]
    did = 'replaced'
else:
    a = s.index('\n<script>\n', s.index('<body')) + 1      # the form's main script: the first plain <script> in the body
    assert 'function tgtCard(' in s[a:s.index(CLOSE, a)], 'the first plain <script> in the body is not the form\'s main script'
    s = s[:a] + block + '\n\n' + s[a:]
    did = 'inserted'
assert s.count(TAG) == 1 and s.count(OPEN) == 1 and s.count(block) == 1 and s.count('const TB1_RLIB=') == 1, 'exactly one copy'
assert s.index(OPEN) < s.index('function tgtCard('), 'the replacement library must come before the main script'
open(FORM, 'w', encoding='utf-8').write(s)
print('%s the replacement library in %s: %d entries, %s bytes in the script element' % (
    did, os.path.relpath(FORM, ROOT), len(lib['entries']), format(len(block.encode('utf-8')), ',')))
