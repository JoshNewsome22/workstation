#!/usr/bin/env python3
"""Give every form the nbh-ui block (toasts, styled confirm, touch targets, view progress). Idempotent;
refreshes an existing copy. usage: patch-ui.py <block.html> <form.html>..."""
import sys
block = open(sys.argv[1], encoding='utf-8').read().rstrip('\n')
MARK = '<style id="nbh-toolbar-width">'
START = '<style id="nbh-ui-css">'
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
