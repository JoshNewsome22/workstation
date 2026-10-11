#!/usr/bin/env python3
"""Give every form the case verbs (facts? and facts) in its workstation bridge and the shared
nbh-case block (toolbar group, picker, generic fill). Idempotent.

v21.84: the block's script goes beside the forms as nbh-case-flow.js, and the form keeps its style and the loader
<script id="nbh-case-flow" src="nbh-case-flow.js"></script> (tools/blocks/shared_js.py); a form that already has the
block (inline or its loader) is left as it is, as before.
usage: patch-case.py <block.html> <form.html>..."""
import os, sys, re
import importlib.util as _ilu
_sj = _ilu.spec_from_file_location('shared_js', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shared_js.py'))
SJ = _ilu.module_from_spec(_sj); _sj.loader.exec_module(SJ)   # v21.84 the scripts every form loads from one file beside it
block = open(sys.argv[1], encoding='utf-8').read().rstrip('\n')
VERBS = """    } else if (d.nbh === 'facts?') {
      /* v21.31 the case: this form's part of the case, when it holds one (see the nbh-case block) */
      reply({ nbh:'facts-out', id: formId(), facts: (window.nbhCase && window.nbhCase.out()) || null });
    } else if (d.nbh === 'facts' && d.facts) {
      /* v21.31 the case: the facts read from the other forms, placed into this form's empty fields */
      var frep = window.nbhCase ? window.nbhCase.apply(d.facts) : null;
      reply({ nbh:'facts-applied', id: formId(), report: frep });
    } else if (d.nbh === 'packet' && d.packet) {"""
ANCHOR = "    } else if (d.nbh === 'packet' && d.packet) {"
MARK = '<style id="nbh-toolbar-width">'
n_ok = 0
for path in sys.argv[2:]:
    src = open(path, encoding='utf-8').read()
    changed = False
    if "d.nbh === 'facts?'" not in src:
        assert src.count(ANCHOR) == 1, (path, 'listener anchor')
        src = src.replace(ANCHOR, VERBS); changed = True
    if 'id="nbh-case-flow"' not in src:
        assert src.count(MARK) == 1, (path, 'style marker')
        src = src.replace(MARK, block + '\n\n' + MARK); changed = True
        src, _ = SJ.move_out(src, 'nbh-case-flow', os.path.dirname(os.path.abspath(path)))   # v21.84
    if changed:
        open(path, 'w', encoding='utf-8').write(src)
    n_ok += 1
    print(('patched ' if changed else 'already ') + path)
print(n_ok, 'forms')
