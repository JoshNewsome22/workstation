#!/usr/bin/env python3
"""Insert a form's case hooks at the end of its own script (just before the packet block). Idempotent.
usage: patch-hook.py <form.html> <hook.js>"""
import sys, re
path, hook = sys.argv[1:3]
src = open(path, encoding='utf-8').read()
js = open(hook, encoding='utf-8').read().rstrip('\n')
if 'v21.31 the case: hooks' in src:
    print('already', path); sys.exit(0)
m = re.search(r'\n</script>\n\n<script>\n/\* =+ NBH student packet', src)
assert m, 'own-script end not found in ' + path
src = src[:m.start()] + '\n\n' + js + src[m.start():]
open(path, 'w', encoding='utf-8').write(src)
print('hooked', path)
