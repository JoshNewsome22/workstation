#!/usr/bin/env python3
"""Give every form the nbh-guard block (unload guard, quick Save, spell-check). Idempotent; refreshes an
existing copy. usage: patch-guard.py <block.html> <form.html>...

v22.12: retired. It replaces everything from nbh-guard-css up to nbh-toolbar-width, which on the shipped forms takes the
nbh-ui block with it (see patch-autosave.py, note 3), so it stops unless --force is given. The guard in each form is kept
current by tools/blocks/patch-autosave.py; tools/check-build.py does not run this script."""
import sys
if '--force' not in sys.argv:
    sys.exit('patch-guard.py is retired (v22.12): on the shipped forms it would remove the nbh-ui block. The guard is kept by '
             'tools/blocks/patch-autosave.py. Pass --force only on a form that has no nbh-ui block.')
sys.argv.remove('--force')
block = open(sys.argv[1], encoding='utf-8').read().rstrip('\n')
MARK = '<style id="nbh-toolbar-width">'
START = '<style id="nbh-guard-css">'
n = 0
for path in sys.argv[2:]:
    s = open(path, encoding='utf-8').read()
    if START in s:
        a = s.index(START); b = s.index('\n\n' + MARK)
        s = s[:a] + block + s[b:]
    else:
        assert s.count(MARK) == 1, (path, 'marker')
        s = s.replace(MARK, block + '\n\n' + MARK)
    open(path, 'w', encoding='utf-8').write(s); n += 1
print(n, 'forms')
