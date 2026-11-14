#!/usr/bin/env python3
"""v26.23 one-shot (the BCBA's screen recording of 11/13: Form EA-1, step by step, on the iPad; the page jumped as it was
scrolled): in every form's <script id="nbh-fit-screen">, the sheets are re-fitted only when the page's WIDTH changed.

Before, any resize ran fit() 150 ms later. On an iPad inside the workstation, a scroll down folds the workstation's bars
and the form's frame grows taller: a resize of height alone. fit() begins by setting the sheets back to actual size, so
for an instant the page was shorter than the frame, the browser dropped its scroll position to the top, and with the form
at its top the bars came straight back: fold, jump, return, at every scroll down on a short page (a step-by-step sheet).
The fit depends on the width only, so a change of height (the bars, the on-screen keyboard) no longer runs it.

Run once from the repository's root; a second run changes nothing. usage: python3 tools/history/v2623-fit-resize.py [FOLDER]"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
folder = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else 'NBH-Workstation')
OLD = "  var t = null;\n  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 150); });\n"
NEW = ("  /* v26.23 only a change of WIDTH re-fits the sheets. A change of height alone (the workstation's bars folding above\n"
       "     the form on an iPad, the on-screen keyboard) used to run fit() too: it sets the sheets to actual size for an\n"
       "     instant, the shorter page lost its scroll position, and the form jumped to its top as it was scrolled. */\n"
       "  var t = null, fitW = root.clientWidth;\n"
       "  window.addEventListener('resize', function () { if (root.clientWidth === fitW) return; clearTimeout(t); t = setTimeout(function () { fit(); fitW = root.clientWidth; }, 150); });\n")
done = same = 0
for path in sorted(glob.glob(os.path.join(folder, '*.html'))):
    s = open(path, encoding='utf-8', newline='').read()
    m = re.search(r'<script id="nbh-fit-screen">.*?</script>', s, re.S)
    if not m: continue
    block = m.group(0)
    if NEW in block: same += 1; continue
    if block.count(OLD) != 1 or 'root.clientWidth' not in block: sys.exit('v2623-fit-resize: unexpected block in ' + os.path.basename(path))
    s = s[:m.start()] + block.replace(OLD, NEW) + s[m.end():]
    open(path, 'w', encoding='utf-8', newline='').write(s); done += 1
print('v2623-fit-resize: %d forms changed, %d already current' % (done, same))
