#!/usr/bin/env python3
"""v21.86 the leave guard (nbh-guard) counts a file as "just opened, so saved" only when it was chosen after Open data.
Until now ANY file chosen in a form (a student's photo, a picture, another form's file read in, a sheet) marked the form
saved 0.9 s later, so work typed before it lost its unsaved mark and, opened on its own, the form no longer warned
before the tab closed. Now the guard notes a press of the form's Open data (#loadBtn, #btnLoad, #up-json or a button
reading "Open data"); the next file chosen is the form's own file; a press of any other button outside a dialog cancels
the note (a confirm after Open data does not). Exact changes, each in place once or already made; anything else stops the
script before a file is written. Into tools/blocks/nbh-guard.html (the source) and every form given.
usage: patch-guard-open.py tools/blocks/nbh-guard.html NBH-Workstation/<form>.html ..."""
import sys
CH = [
    ("  var dirty = false;\n  function isField(t)",
     "  var dirty = false, opening = false;   /* opening: Open data was the last button pressed (v21.86) */\n  function isField(t)"),
    ("    if (e.target && e.target.type === 'file') { setTimeout(function(){ dirty = false; saved(); paint(); }, 900); return; }   /* a file just opened is the saved state */",
     "    if (e.target && e.target.type === 'file') { if (opening) { opening = false; setTimeout(function(){ dirty = false; saved(); paint(); }, 900); } return; }   /* a file opened with Open data is the saved state; a photo, a picture or another form's file read in is a change (v21.86) */"),
    ("    if (b.id === 'nbhSaveQuick') return;\n    if (b.matches('#saveBtn,#btnSave,#dl-json')",
     "    if (b.id === 'nbhSaveQuick') return;\n    if (b.matches('#loadBtn,#btnLoad,#up-json') || /^\\s*open data\\s*$/i.test(b.textContent)) opening = true; else if (!b.closest('dialog')) opening = false;\n    if (b.matches('#saveBtn,#btnSave,#dl-json')"),
]
out = {}
for path in sys.argv[1:]:
    s = open(path, encoding='utf-8', newline='').read()
    for old, new in CH:
        if s.count(new) == 1 and s.count(old) == 0: continue
        if s.count(old) != 1: sys.exit(f'{path}: expected the guard line once, found {s.count(old)}: {old[:60]!r}')
        s = s.replace(old, new)
    out[path] = s
for path, s in out.items(): open(path, 'w', encoding='utf-8', newline='').write(s)
print(len(out), 'files')
