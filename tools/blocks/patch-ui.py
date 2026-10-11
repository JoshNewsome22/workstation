#!/usr/bin/env python3
"""Give every form the nbh-ui block (toasts, styled confirm, touch targets, view progress). Idempotent;
refreshes an existing copy. v21.84: the block's script goes beside the forms as nbh-ui.js (written from the block
here), and the form keeps its style and the loader <script id="nbh-ui" src="nbh-ui.js"></script> (tools/blocks/shared_js.py).
usage: patch-ui.py <block.html> <form.html>..."""
import os, sys
import importlib.util as _ilu
_sj = _ilu.spec_from_file_location('shared_js', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shared_js.py'))
SJ = _ilu.module_from_spec(_sj); _sj.loader.exec_module(SJ)   # v21.84 the scripts every form loads from one file beside it
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
    s, _ = SJ.move_out(s, 'nbh-ui', os.path.dirname(os.path.abspath(path)))   # v21.84
    open(path, 'w', encoding='utf-8').write(s); n += 1
print(n, 'forms')
