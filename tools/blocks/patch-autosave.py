#!/usr/bin/env python3
"""v21.44 Autosave that holds up on an iPad: put it into the forms and the workstation. Idempotent; run it again after any
change to tools/blocks/nbh-copies.js or nbh-autosave.js, and on a merged tree.

Into every form named (default: the 44 forms, NBH-Workstation/[A-Z]*.html):
  1. <script id="nbh-autosave">: the store (tools/blocks/nbh-copies.js) and the form's part (tools/blocks/nbh-autosave.js),
     each byte for byte, before the polish layer at the end of the body (tools/apply-polish.py puts the polish back at the
     end of the body, so a rebuilt form keeps the same order and a rebuild from parts stays byte for byte). An existing
     copy is replaced.
  2. Four small changes in the workstation bridge: the status a form reports carries the hash of its whole state
     (window.nbhState, so taps count), the parts the form's own safety copy needs are named on window.nbhBridge, the
     answer to a snapshot says beside it whether the form has been changed since it was opened and which state the
     file holds, and a tap or key during a restore ends the quiet that answers the form's own confirms.
  3. Five small changes in the leave guard (nbh-guard): the bridge's silent save (the workstation's Autosave) is not the
     user's Save and clears nothing, and the unsaved mark, the leave warning and the quick Save follow the whole state.
     The same changes are made in tools/blocks/nbh-guard.html, the guard's source, so tools/blocks/patch-guard.py writes
     the same guard. (Note: patch-guard.py replaces everything from nbh-guard-css up to nbh-toolbar-width, which takes
     the nbh-ui block with it; do not run it on the shipped forms without fixing that first.)
Into NBH-Workstation/index.html: the store again, between the two "nbh-copies core" markers in the autosave section.
The forms built from parts (tools/forms/<ID>/) take all of this from Form CF-1, the template, when they are rebuilt.

Each change is checked: what it replaces must be there exactly once, or the change must already be in place; anything
else stops the script before a file is written. The sources may not contain "</script", "<!--", the practice's name or a
model ID. Files are read and written without newline translation.

usage: python3 tools/blocks/patch-autosave.py [--check] [FORM.html ...]
  --check   change nothing; exit 1 unless every file already carries the current copy"""
import glob, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BLOCKS = os.path.join(ROOT, 'tools', 'blocks')
OPEN, CLOSE = '<script id="nbh-autosave">', '</script>'
TAG = '\n' + OPEN
HEAD = ('/* nbh-autosave (v21.44): written by tools/blocks/patch-autosave.py from tools/blocks/nbh-copies.js and\n'
        '   nbh-autosave.js, each copied byte for byte; change those files and run it again rather than editing this copy. */\n')
CORE_A = '/* nbh-copies core: begin (tools/blocks/nbh-copies.js, put here by tools/blocks/patch-autosave.py; edit that file, not this copy) */\n'
CORE_B = '/* nbh-copies core: end */'

BRIDGE = [
    ("    return { filled: n, total: t, sig: s };\n",
     "    var st = { filled: n, total: t, sig: s };\n"
     "    /* v21.44 the form's whole state (nbh-autosave: a hash of what Save data writes), so a tap counts as a change */\n"
     "    try { if (window.nbhState) st = window.nbhState.status(st); } catch (err) {}\n"
     "    return st;\n"),
    ("  window.addEventListener('message', function(ev){\n    var d = ev.data || {};\n    if (!d || !d.nbh) return;\n",
     "  /* v21.44 what nbh-autosave needs for a form opened on its own: its safety copy and the restore of one */\n"
     "  window.nbhBridge = { formId: formId, formTitle: formTitle, who: who, snapshot: snapshot, restoreData: restoreData,\n"
     "    ownSave: ownSave, ownOpen: ownOpen, valueSig: valueSig };\n"
     "  window.addEventListener('message', function(ev){\n    var d = ev.data || {};\n    if (!d || !d.nbh) return;\n"),
    (("        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap });\n",
      # the first v21.44 text (autosave-v2 before the review), brought up to date
      "        /* v21.44 edited: whether this file differs from the form as it was opened (the workstation keeps no copy of a\n"
      "           form only opened); it travels beside the snapshot, never in it, so a case file is unchanged */\n"
      "        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap,\n"
      "                edited: !!(window.nbhState && window.nbhState.differs(own)) });\n"),
     "        /* v21.44 edited: whether this file differs from the form as it was opened (the workstation keeps no copy of a\n"
     "           form only opened); status: the form's state as this file holds it, so Save case marks saved exactly what\n"
     "           is in the file. Both travel beside the snapshot, never in it, so a case file is unchanged */\n"
     "        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap,\n"
     "                edited: !!(window.nbhState && window.nbhState.differs(own)), status: filled() });\n"),
    ("      /* the form reads the file with a FileReader and redraws; give it that time */\n"
     "      setTimeout(function(){ quiet(false); res(true); }, 1200);\n",
     "      /* the form reads the file with a FileReader and redraws; give it that time. v21.44: a tap or key of the user's\n"
     "         ends the quiet at once, so a Clear all pressed just after a restore is asked as usual */\n"
     "      var gest = function(){ quiet(false); };\n"
     "      document.addEventListener('pointerdown', gest, true); document.addEventListener('keydown', gest, true);\n"
     "      setTimeout(function(){\n"
     "        document.removeEventListener('pointerdown', gest, true); document.removeEventListener('keydown', gest, true);\n"
     "        quiet(false); res(true);\n"
     "      }, 1200);\n"),
]
GUARD = [
    ("   toolbar (More controls folded) shows a Save button of its own, so saving on an iPad is one tap. */\n",
     "   toolbar (More controls folded) shows a Save button of its own, so saving on an iPad is one tap.\n"
     "   v21.44: the unsaved mark also follows the form's whole state (window.nbhState, the nbh-autosave block), so a tap that\n"
     "   changes the record counts as typing does, and the bridge's silent save (the workstation's Autosave, a case save) is\n"
     "   not the user's Save, so it never clears the mark. An iPad ignores the leave warning; the safety copy covers it there. */\n"),
    ("    if (e.target && e.target.type === 'file') { setTimeout(function(){ dirty = false; paint(); }, 900); return; }",
     "    if (e.target && e.target.type === 'file') { setTimeout(function(){ dirty = false; saved(); paint(); }, 900); return; }"),
    ("  document.addEventListener('click', function(e){\n    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b) return;\n"
     "    if (b.id === 'nbhSaveQuick') return;\n"
     "    if (b.matches('#saveBtn,#btnSave,#dl-json') || /^\\s*save data\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; paint(); }, 300); }\n"
     "    else if (b.id === 'clearBtn' || /^\\s*clear all\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; paint(); }, 300); }\n",
     "  document.addEventListener('click', function(e){\n"
     "    if (window.__nbhQuiet) return;   /* v21.44 the bridge pressing Save for the workstation, not the user */\n"
     "    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b) return;\n"
     "    if (b.id === 'nbhSaveQuick') return;\n"
     "    if (b.matches('#saveBtn,#btnSave,#dl-json') || /^\\s*save data\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; saved(); paint(); }, 300); }\n"
     "    else if (b.id === 'clearBtn' || /^\\s*clear all\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; saved(); paint(); }, 300); }\n"),
    ("    if (window.parent !== window) return;\n    if (!dirty) return;\n",
     "    if (window.parent !== window) return;\n    if (!isDirty()) return;\n"),
    ("  function paint(){ var q = document.getElementById('nbhSaveQuick'); if (q) q.classList.toggle('dirty', dirty); }\n"
     "  setInterval(paint, 2000);\n"
     "  window.nbhGuard = { isDirty: function(){ return dirty; }, clean: function(){ dirty = false; paint(); } };\n",
     "  function isDirty(){ return dirty || !!(window.nbhState && window.nbhState.unsaved()); }\n"
     "  function saved(){ if (window.nbhState) window.nbhState.markSaved(); }\n"
     "  function paint(){ var q = document.getElementById('nbhSaveQuick'); if (q) q.classList.toggle('dirty', isDirty()); }\n"
     "  setInterval(paint, 2000);\n"
     "  window.nbhGuard = { isDirty: isDirty, clean: function(){ dirty = false; saved(); paint(); } };\n"),
]


def fail(msg):
    sys.exit('patch-autosave.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def source(name):
    t = read(os.path.join(BLOCKS, name))
    low = t.lower()
    for bad in ('</script', '<!--', 'newsome behavioral health', 'cf-1'):
        if bad in low:
            fail(name + ' must not contain ' + repr(bad))
    fam = '|'.join(w[::-1] for w in ('supo', 'tennos', 'ukiah'))   # the families, spelled backwards so this file names none
    m = re.search('cl' + 'aude-[a-z]+-\\d|\\b(' + fam + ')\\b', t, re.I)
    if m:
        fail(name + ' must not carry a model name (' + repr(m.group(0)) + ')')
    return t


def pairs(text, region, plist, what, rel):
    """apply (old, new) pairs inside text[region]; each must be done already or be there exactly once. old may be a
    tuple: the original text and earlier versions of the change, any one of which is replaced"""
    a, b = region
    part = text[a:b]
    for old, new in plist:
        if new in part:
            continue
        olds = old if isinstance(old, tuple) else (old,)
        found = [o for o in olds if part.count(o) == 1]
        if len(found) != 1:
            fail(f'{rel}: {what}: expected the text to change exactly once, found it {[part.count(o) for o in olds]} times: {olds[0][:70]!r}')
        part = part.replace(found[0], new)
    return text[:a] + part + text[b:]


def region(text, start, rel, what):
    i = text.find(start)
    if i < 0:
        fail(f'{rel}: no {what}')
    j = text.find('</script>', i)
    return i, j


def patch_form(s, rel, block):
    i, j = region(s, '/* ============ workstation bridge ============', rel, 'workstation bridge')
    s = pairs(s, (i, j), BRIDGE, 'bridge', rel)
    i, j = region(s, '<script id="nbh-guard">', rel, 'nbh-guard block')
    s = pairs(s, (i, j), GUARD, 'guard', rel)
    n = s.count(TAG)
    if n > 1:
        fail(f'{rel}: {n} copies of the nbh-autosave block')
    if n:
        a = s.index(TAG) + 1; b = s.index(CLOSE, a) + len(CLOSE)
        s = s[:a] + block + s[b:]
    else:
        at = s.find('\n<style id="nbh-polish-css"')
        if at < 0:
            at = s.rfind('\n</body>')
        if at < 0 or s.count('</body>') != 1:
            fail(f'{rel}: expected one </body>')
        s = s[:at] + '\n' + block + s[at:]
    if s.count(TAG) != 1 or s.count(block) != 1:
        fail(f'{rel}: not exactly one copy of the block after patching')
    return s


def main(argv):
    check = False; files = []
    for a in argv:
        if a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        elif a == '--check':
            check = True
        elif a.startswith('-'):
            fail('unknown option ' + a + '; see --help')
        else:
            files.append(a)
    core = source('nbh-copies.js'); part = source('nbh-autosave.js')
    block = OPEN + '\n' + HEAD + core.rstrip('\n') + '\n' + part.rstrip('\n') + '\n' + CLOSE
    if not files:
        files = sorted(glob.glob(os.path.join(ROOT, 'NBH-Workstation', '[A-Z]*.html')))
        if len(files) != 44:
            fail(f'expected the 44 forms in NBH-Workstation, found {len(files)}')
    stale = []; done = 0
    for f in files:
        path = os.path.abspath(f); rel = os.path.relpath(path, ROOT)
        s = read(path); t = patch_form(s, rel, block)
        if t != s:
            stale.append(rel)
            if not check:
                write(path, t)
        done += 1
    # the guard's source
    gpath = os.path.join(BLOCKS, 'nbh-guard.html'); g = read(gpath)
    i, j = region(g, '<script id="nbh-guard">', 'tools/blocks/nbh-guard.html', 'nbh-guard script')
    g2 = pairs(g, (i, j), GUARD, 'guard', 'tools/blocks/nbh-guard.html')
    if g2 != g:
        stale.append('tools/blocks/nbh-guard.html')
        if not check:
            write(gpath, g2)
    # the workstation's copy of the store
    ipath = os.path.join(ROOT, 'NBH-Workstation', 'index.html'); s = read(ipath)
    if s.count(CORE_A) != 1 or s.count(CORE_B) != 1 or s.index(CORE_A) > s.index(CORE_B):
        fail('NBH-Workstation/index.html: the autosave section has no "nbh-copies core" markers (it predates v21.44)')
    a = s.index(CORE_A) + len(CORE_A); b = s.index(CORE_B)
    t = s[:a] + core.rstrip('\n') + '\n' + s[b:]
    if t != s:
        stale.append('NBH-Workstation/index.html')
        if not check:
            write(ipath, t)
    if check:
        if stale:
            print('not current:\n  ' + '\n  '.join(stale)); sys.exit(1)
        print(f'current: {done} forms, the guard source and index.html')
    else:
        print(f'{len(stale)} file(s) patched, {done} forms checked' + ((':\n  ' + '\n  '.join(stale)) if stale else ''))


if __name__ == '__main__':
    main(sys.argv[1:])
