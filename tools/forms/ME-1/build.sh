#!/bin/bash
# Rebuild Form ME-1 from its parts (v25.78): the shared head and tail from CF-1, the polish and the writing help, the shared
# blocks, then the two things the built file carries that the parts do not: its settings for the shared layout
# (<script id="fx2-cfg">) and its own revision date. Run from the repository root:  bash tools/forms/ME-1/build.sh
set -e
F=NBH-Workstation/ME-1_Medical-Event-Record_v2026-11.html; B=tools/blocks
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html tools/forms/ME-1 "$F"
python3 tools/polish-one.py "$F" > /dev/null
python3 $B/patch-ui.py $B/nbh-ui.html "$F" > /dev/null
python3 $B/patch-case.py $B/nbh-case.html "$F" > /dev/null
python3 $B/patch-csv.py "$F" > /dev/null
python3 $B/patch-names.py "$F" > /dev/null
python3 tools/dedupe-logo.py "$F" > /dev/null
python3 $B/patch-autosave.py "$F" > /dev/null
python3 $B/patch-shared.py "$F" > /dev/null
python3 $B/patch-narration.py "$F" > /dev/null
python3 $B/patch-fx2.py "$F" > /dev/null
python3 - "$F" <<'PY'
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
a = "<script>document.documentElement.classList.add('fx2');document.documentElement.setAttribute('data-fx2','ME-1');addEventListener('beforeprint',function(){if(window.fx2Layout)fx2Layout.paper(true)})</script>\n"
assert s.count(a) == 1, 'the fx2 switch'
s = s.replace(a, a + """<script id="fx2-cfg">
/* v25.78 fx2: ME-1's settings for the shared layout (tools/blocks/fx2.html; the list is at the top of its script).
   Tables: the list of events and an event's follow-up (each row is one thing, read across). The event's own parts are
   grids of fields. */
window.FX2_CFG = { fields: '.fieldgrid, .meAtt-f', noseg: '#meList, #meTasks', cards: '' };
</script>
""")
for a, b in (('<span>Revised September 2026</span><span>Confidential student record</span>', '<span>Revised November 2026</span><span>Confidential student record</span>'),
             ('Form ME-1 &middot; Revised September 2026', 'Form ME-1 &middot; Revised November 2026')):
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
PY
python3 $B/patch-fx2.py --check "$F" > /dev/null
echo "built $F"
