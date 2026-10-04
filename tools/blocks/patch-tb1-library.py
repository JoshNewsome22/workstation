#!/usr/bin/env python3
"""v21.43 Put the TB-1 behavior library (tools/blocks/tb1-behavior-library.json) into Form TB-1 as
<script id="tb1-lib">const TB1_LIB=...;</script>. It REPLACES an existing copy every time, so re-run it whenever
the library changes. A new copy goes just before the form's main script (the first plain <script> in the body).

Before anything is written the library is checked: it must parse, hold no "</script" and no "Newsome Behavioral Health"
(the school edition is built from this one by name), and every entry's type, definition style and dimension must be an
option of the form's own selects, with its category one of the fourteen. The form must end with exactly one copy.
The JSON is written compact, with every "<" as \\u003c and U+2028/U+2029 escaped, so it can never close or confuse
the script element and it parses as JavaScript in every browser.
usage: python3 tools/blocks/patch-tb1-library.py"""
import json, os, re, sys
if sys.argv[1:]:
    if sys.argv[1:] in (['-h'], ['--help']):
        print(__doc__); sys.exit(0)
    sys.exit('patch-tb1-library.py takes no arguments (it got ' + ' '.join(sys.argv[1:]) + '); see --help')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LIB = os.path.join(ROOT, 'tools', 'blocks', 'tb1-behavior-library.json')
FORM = os.path.join(ROOT, 'NBH-Workstation', 'TB-1_Target-Behavior-Development_v2026-09.html')
OPEN, CLOSE = '<script id="tb1-lib">', '</script>'
TAG = '\n' + OPEN   # the element itself starts a line; the words in a comment do not count
CATS = ["Aggression toward others", "Verbal aggression and threats", "Self-injurious behavior", "Property destruction",
        "Elopement and safety", "Tantrums and vocal disruption", "Noncompliance and task avoidance", "Classroom disruption",
        "Peer and social behavior", "Stereotypy and repetitive behavior", "Feeding and health-related",
        "Body, privacy and hygiene", "Home and sleep", "Precursors"]
REQUIRED = ['id', 'cat', 'lab', 'type', 'style', 'dim', 'unit', 'def', 'ex', 'nex', 'on', 'off', 'border', 'excl']
TEXT = REQUIRED + ['fdef', 'tops', 'note']

raw = open(LIB, encoding='utf-8').read()
for bad in ('</script', 'Newsome Behavioral Health'):
    if bad.lower() in raw.lower():
        sys.exit('refused: tb1-behavior-library.json contains ' + repr(bad))
try:
    lib = json.loads(raw)
except ValueError as e:
    sys.exit('refused: tb1-behavior-library.json does not parse: ' + str(e))
if not isinstance(lib, dict) or not isinstance(lib.get('entries'), list) or not lib['entries']:
    sys.exit('refused: the library must be {"version":..., "note":..., "entries":[...]}')

s = open(FORM, encoding='utf-8').read()
# the vocabularies are the options of the form's own selects, read from its main script
def options(const):
    m = re.search(r"const " + const + r"='([^']*)';", s)
    if not m:
        sys.exit('the form has no const ' + const + ' (its select options); has the main script changed?')
    return [o for o in re.findall(r'<option>([^<]*)</option>', m.group(1))]
VOC = {'type': options('TYPE'), 'style': options('STYLE'), 'dim': options('DIM'), 'cat': CATS}

errs, seen = [], set()
for i, e in enumerate(lib['entries']):
    where = '#%d %s' % (i, e.get('id', '?'))
    for k in REQUIRED:
        if not isinstance(e.get(k), str) or not e[k].strip():
            errs.append(where + ': missing ' + k)
    for k in TEXT:
        if k in e and not isinstance(e[k], str):
            errs.append(where + ': ' + k + ' is not text')
    if 'aka' in e and not (isinstance(e['aka'], list) and all(isinstance(a, str) for a in e['aka'])):
        errs.append(where + ': aka must be a list of words')
    for k, allowed in VOC.items():
        if e.get(k) not in allowed:
            errs.append(where + ': ' + k + ' ' + repr(e.get(k)) + ' is not one of the form\'s options')
    if e.get('id') in seen:
        errs.append(where + ': duplicate id')
    seen.add(e.get('id'))
    if e.get('type') == 'Replacement / alternative behavior':
        errs.append(where + ': the library holds reduction targets only')
if errs:
    sys.exit('refused: %d problem%s in the library\n  ' % (len(errs), '' if len(errs) == 1 else 's') + '\n  '.join(errs[:40]))

js = json.dumps(lib, ensure_ascii=False, separators=(',', ':'))
js = js.replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
assert '</script' not in js.lower() and json.loads(js) == lib
block = OPEN + 'const TB1_LIB=' + js + ';' + CLOSE

n = s.count(TAG)
assert n <= 1, (n, 'copies of the library in the form')
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
assert s.count(TAG) == 1 and s.count(OPEN) == 1 and s.count(block) == 1 and s.count('const TB1_LIB=') == 1, 'exactly one copy'
assert s.index(OPEN) < s.index('function tgtCard('), 'the library must come before the main script'
open(FORM, 'w', encoding='utf-8').write(s)
print('%s the library in %s: %d entries, %s bytes in the script element' % (
    did, os.path.relpath(FORM, ROOT), len(lib['entries']), format(len(block.encode('utf-8')), ',')))
