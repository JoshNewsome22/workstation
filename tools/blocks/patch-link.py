#!/usr/bin/env python3
"""v21.43 Put the shared link core (tools/blocks/nbh-link.js) into the forms that carry it outside a build script,
as <script id="nbh-link">. Unlike patch-case.py it REPLACES an existing copy every time, so re-run it whenever
nbh-link.js changes; TK-1 gets the same file through tools/forms/TK-1/build.sh. The script's text is the core,
byte for byte. A new copy goes before the form's first <script> after </main>.
usage: python3 tools/blocks/patch-link.py"""
import os, re, sys
if sys.argv[1:]:
    if sys.argv[1:] in (['-h'], ['--help']):
        print(__doc__); sys.exit(0)
    sys.exit('patch-link.py takes no arguments (it got ' + ' '.join(sys.argv[1:]) + '); see --help')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CORE = os.path.join(ROOT, 'tools', 'blocks', 'nbh-link.js')
FORMS = ['NBH-Workstation/TE-1_Token-Economy-Designer_v2026-09.html']
OPEN, CLOSE = '<script id="nbh-link">', '</script>'
TAG = '\n' + OPEN   # the element itself starts a line; the words in a comment do not count
core = open(CORE, encoding='utf-8').read()
for bad in ('</script', 'CF-1', 'Newsome Behavioral Health'):
    assert bad.lower() not in core.lower(), ('nbh-link.js must not contain', bad)
block = OPEN + core + CLOSE
for rel in FORMS:
    path = os.path.join(ROOT, rel)
    s = open(path, encoding='utf-8').read()
    n = s.count(TAG)
    assert n <= 1, (rel, n, 'copies of the link core')
    if n:
        a = s.index(TAG) + 1; b = s.index(CLOSE, a) + len(CLOSE)
        s = s[:a] + block + s[b:]; did = 'replaced'
    else:
        m = re.compile(r'</main>\s*').search(s)
        assert m, (rel, 'no </main>')
        a = s.index('<script>', m.end() - 1)
        s = s[:a] + block + '\n\n' + s[a:]; did = 'inserted'
    assert s.count(TAG) == 1 and s.count(block) == 1 and s.count('nbh-link (v21.43)') == 1, (rel, 'exactly one copy')
    open(path, 'w', encoding='utf-8').write(s)
    print(did, rel)
print(len(FORMS), 'form' + ('' if len(FORMS) == 1 else 's'))
