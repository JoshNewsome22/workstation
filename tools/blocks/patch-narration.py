"""v22.21 (review F474): a form's recorded walkthrough narration is read when its Walkthrough is first opened, not every
time the form opens.

Five forms keep their narration beside them as a script (nbh-ia1-narration.js 3 MB, nbh-tk1-narration.js and
nbh-tk1-bus-narration.js 2.1 MB, nbh-sm1-narration.js 1.6 MB, nbh-ra1-narration.js 1.5 MB, nbh-dd1-narration.js 0.9 MB)
and loaded it with <script src=... defer> on every open, so a BCBA scoring a FAST carried the walkthrough's audio in the
iPad's memory. This turns each such tag into an inert one,

    <script type="text/x-nbh-narration" data-src="nbh-ia1-narration.js"></script>

and adds one small loader after the last of them: the first time the form's body takes the class view-walk (any form's own way
of opening its Walkthrough), it loads the files in order and builds the Walkthrough again (TKWALK.build), so it has the
recorded voice. The one-file edition puts the narration inside the form as before (index.html's EMBED matches
both forms of the tag). A form without a narration tag is left alone. Run again, it changes nothing.

usage: python3 tools/blocks/patch-narration.py FORM.html [...]      (--check: change nothing, exit 1 if a form would change)
"""
import re, sys

TAG = re.compile(r'<script src="(nbh-[a-z0-9-]+-narration\.js)" defer></script>')
LAZY = '<script type="text/x-nbh-narration" data-src="{}"></script>'
LOADER_ID = 'nbh-narration-loader'
LOADER = ('<script id="' + LOADER_ID + '">\n'
          '/* v22.21 (review F474) the walkthrough\'s recorded narration is read the first time the Walkthrough is opened, not\n'
          '   every time the form opens (tools/blocks/patch-narration.py) */\n'
          '(function () {\n'
          '  var tags = [].slice.call(document.querySelectorAll(\'script[type="text/x-nbh-narration"][data-src]\'));\n'
          '  if (!tags.length) return;\n'
          '  var p = null;\n'
          '  function one(src) { return new Promise(function (res) { var s = document.createElement(\'script\'); s.src = src;\n'
          '    s.onload = function () { res(true); }; s.onerror = function () { res(false); }; document.head.appendChild(s); }); }\n'
          '  function load() { if (!p) p = tags.reduce(function (q, t) { return q.then(function () { return one(t.getAttribute(\'data-src\')); }); },\n'
          '    Promise.resolve()).then(function () { window.nbhNarration.loaded = true; }); return p; }\n'
          '  window.nbhNarration = { load: load, loaded: false };\n'
          '  function again() { /* build the open Walkthrough again, now with the recorded voice (the form builds it each time it\n'
          '     is opened after this) */\n'
          '    if (!document.body.classList.contains(\'view-walk\')) return;\n'
          '    if (window.TKWALK && typeof TKWALK.build === \'function\') { try { TKWALK.build(); } catch (e) {} return; }\n'
          '    var b = document.querySelector(\'#viewSeg button[data-view="walk"]\'); if (b) b.click(); }\n'
          '  function look() { if (p || !document.body || !document.body.classList.contains(\'view-walk\')) return; load().then(again); }\n'
          '  try { new MutationObserver(look).observe(document.body, { attributes: true, attributeFilter: [\'class\'] }); } catch (e) {}\n'
          '  look();\n'
          '})();\n'
          '</script>\n')


def patch(s):
    if TAG.search(s):
        s = TAG.sub(lambda m: LAZY.format(m.group(1)), s)
    if 'type="text/x-nbh-narration"' not in s:
        return s
    i = s.find('<script id="' + LOADER_ID + '">')
    if i >= 0:
        j = s.index('</script>\n', i) + len('</script>\n')
        s = s[:i] + s[j:]
    # right after the last narration tag, where the tools that rebuild the end of the form (apply-polish.py) leave it
    last = list(re.finditer(r'<script type="text/x-nbh-narration" data-src="[^"]+"></script>\n?', s))[-1]
    k = last.end() if last.group(0).endswith('\n') else last.end()
    pre = '' if last.group(0).endswith('\n') else '\n'
    return s[:k] + pre + LOADER + s[k:]


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if a != '--check']
    if not files:
        sys.exit(__doc__)
    bad = []
    for f in files:
        s = open(f, encoding='utf-8').read()
        t = patch(s)
        if t != s:
            if check:
                bad.append(f)
            else:
                open(f, 'w', encoding='utf-8').write(t)
                print('lazy narration:', f)
    if bad:
        print('would change:', *bad, sep='\n  ')
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
