#!/usr/bin/env python3
"""v21.84 Move the shared script blocks out of the forms: each inline <script id="..."> that every form carries the same
is written once beside the forms as its own file and replaced in each form by its loader (see tools/blocks/shared_js.py
for the list, the reasons, and what is not moved). Idempotent: a form that already holds the loader is left as it is.

It is the tool that writes nbh-field-care.js (the field care block, which no other tool writes: edit
NBH-Workstation/nbh-field-care.js itself, and run this to check). The other blocks are written by their own tools, which
since v21.84 leave the loader in the form and write the file: tools/blocks/patch-case.py (nbh-case-flow.js),
patch-ui.py (nbh-ui.js), patch-autosave.py (nbh-autosave.js), tools/apply-polish.py (nbh-polish.js), patch-wording.py
(nbh-wording.js), tools/dedupe-logo.py (nbh-logo.js). Run this on forms from before v21.84 (or a form a tool of before
v21.84 wrote) to move every inline copy out; every form's copy of a block must be the same, and the same as a file
already beside them, or nothing is written.

usage: python3 tools/blocks/patch-shared.py [--check] FORM.html [FORM.html ...]
  --check   change nothing; exit 1 unless every form named loads every shared file once and holds no inline copy"""
import importlib.util, os, sys
_spec = importlib.util.spec_from_file_location('shared_js', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shared_js.py'))
SJ = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(SJ)


def fail(msg):
    sys.exit('patch-shared.py: ' + msg)


def main(argv):
    check = '--check' in argv
    forms = [a for a in argv if not a.startswith('-')]
    if any(a in ('-h', '--help') for a in argv):
        print(__doc__); return 0
    if not forms:
        fail('name the forms, e.g. NBH-Workstation/[A-Z]*.html; see --help')
    texts = {}
    for rel in forms:
        base = os.path.basename(rel)
        if not base.endswith('.html') or base in ('index.html', 'respond.html'):
            fail(rel + ': not a form')
        texts[rel] = SJ.read(rel)
    # every form's inline copy of a block must be the same (and a file already there the same), before anything is written
    for sid, f, _ in SJ.SHARED:
        bodies = {}
        for rel, s in texts.items():
            try:
                b = SJ.body_of(s, sid)
            except SJ.Problem as e:
                fail(rel + ': ' + str(e))
            if b is not None:
                bodies.setdefault(b, []).append(rel)
        if len(bodies) > 1:
            fail('the forms hold %d different copies of <script id="%s">: run %s first' % (len(bodies), sid, dict((i, t) for i, _, t in SJ.SHARED)[sid]))
    stale, out = [], {}
    for rel, s in texts.items():
        folder = os.path.dirname(os.path.abspath(rel))
        t = s
        for sid, f, _ in SJ.SHARED:
            try:
                t, did = SJ.move_out(t, sid, folder, overwrite=False, check=check)
            except SJ.Problem as e:
                fail(rel + ': ' + str(e))
            if did in ('written', 'stale'):
                print(('wrote ' if did == 'written' else 'STALE ') + os.path.relpath(os.path.join(folder, f)))
        why = SJ.check_form(t)
        if why:
            fail(rel + ' ' + why)
        if t != s:
            stale.append(rel)
            if not check:
                SJ.write(os.path.abspath(rel), t)
        print(('moved out ' if t != s else 'current   ') + rel + ('' if t == s else ' (%d KB -> %d KB)' % (len(s.encode()) // 1024, len(t.encode()) // 1024)))
    if check and stale:
        print('%d form(s) hold an inline copy' % len(stale)); return 1
    print('%d forms; the shared files: %s' % (len(forms), ', '.join(SJ.FILES)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
