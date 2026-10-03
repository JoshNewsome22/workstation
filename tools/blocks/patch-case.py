#!/usr/bin/env python3
"""Give every form the case verbs (facts? and facts) in its workstation bridge and the shared
nbh-case block (toolbar group, picker, generic fill). Idempotent.

usage: patch-forms.py <block.html> <form.html>..."""
import sys, re
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
    if changed:
        open(path, 'w', encoding='utf-8').write(src)
    n_ok += 1
    print(('patched ' if changed else 'already ') + path)
print(n_ok, 'forms')
