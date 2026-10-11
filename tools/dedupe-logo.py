#!/usr/bin/env python3
"""v21.36: one copy of the letterhead image per form. Every <img class="nbh-logo"> and <img class="nbh-print-logo">
carried the same 54 KB data URI (up to fourteen copies in one form). The image sat once in a <script id="nbh-logo">
in the head, which fills those images at load and again before printing.

v21.84: one copy for the whole folder. That script is the file nbh-logo.js beside the forms, and each form carries only
its loader, <script id="nbh-logo" src="nbh-logo.js"></script>, a classic synchronous script in the same place in the
head, so window.NBH_LOGO is set at the same moment as before. (46 inline copies were 2.5 MB of the folder.) The one-file
edition puts the script back inline in every form (tools/build-single.py); the school edition's build swaps the image in
nbh-logo.js (tools/build-rps.py). A form with the v21.36 inline block has it moved out (every form's must be the same);
a form with the image still in its <img> tags is deduped and given the loader. tools/new-form.py copies the loader from
CF-1's head into a new form. Idempotent; nbh-logo.js is written beside the forms, and never changed when it holds
another image than the forms (the build stops instead).
usage: dedupe-logo.py <form.html>..."""
import os, re, sys
URI = re.compile(r'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAHZ[A-Za-z0-9+/=]+')
FILE = 'nbh-logo.js'
LOADER = '<script id="nbh-logo" src="' + FILE + '"></script>'
OPEN, CLOSE = '<script id="nbh-logo">', '</script>'
BODY = ('/* the letterhead image, once; the logo images below are filled from it */\n'
        '(function(){var L="%s";window.NBH_LOGO=L;function fill(){var a=document.querySelectorAll(\'img[data-nbh-logo]\');'
        'for(var i=0;i<a.length;i++)if(!a[i].getAttribute("src"))a[i].setAttribute("src",L);}'
        'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill);else fill();'
        'window.addEventListener("beforeprint",fill);})();')
bodies = {}   # folder -> the text of its nbh-logo.js


def keep(path, body):
    d = os.path.dirname(os.path.abspath(path))
    if bodies.setdefault(d, body) != body:
        sys.exit('dedupe-logo.py: %s holds another logo script than the forms before it' % path)


for path in sys.argv[1:]:
    s = open(path, encoding='utf-8', newline='').read()
    if s.count(LOADER) == 1 and OPEN not in s:
        print('already', path); continue
    if OPEN in s:   # v21.36 inline block: move it out
        assert s.count(OPEN) == 1, (path, 'more than one nbh-logo block')
        a = s.index(OPEN); b = s.index(CLOSE, a)
        body = s[a + len(OPEN):b]
        assert len(set(URI.findall(body))) == 1 and '</script' not in body.lower(), (path, 'the logo block is not the expected one')
        keep(path, body)
        s2 = s[:a] + LOADER + s[b + len(CLOSE):]
        assert not URI.findall(s2), (path, 'a copy of the logo outside the block')
        open(path, 'w', encoding='utf-8', newline='').write(s2)
        print('moved out', path, '(%d KB -> %d KB)' % (len(s) // 1024, len(s2) // 1024))
        continue
    uris = URI.findall(s)
    assert uris and len(set(uris)) == 1, (path, len(set(uris)))
    L = uris[0]
    s2 = re.sub(r'(<img class="nbh-(?:print-)?logo") src="' + re.escape(L) + '"( alt="[^"]*">)()', lambda m: m.group(1) + ' data-nbh-logo="1"' + m.group(2), s)
    left = URI.findall(s2)
    assert not left, (path, 'data URI left outside a logo image', len(left))
    k = s2.count('data-nbh-logo="1"')
    assert k == len(uris), (path, k, len(uris))
    keep(path, BODY % L)
    t = s2.index('</title>') + len('</title>')
    s2 = s2[:t] + '\n' + LOADER + s2[t:]
    open(path, 'w', encoding='utf-8', newline='').write(s2)
    print('deduped', path, len(uris), 'copies ->', 0, '(%d KB -> %d KB)' % (len(s) // 1024, len(s2) // 1024))
for d, body in bodies.items():
    p = os.path.join(d, FILE)
    old = open(p, encoding='utf-8', newline='').read() if os.path.isfile(p) else None
    if old is not None and old != body:
        sys.exit('dedupe-logo.py: %s holds another logo than these forms; check which is right before writing it' % p)
    if old is None:
        open(p, 'w', encoding='utf-8', newline='').write(body)
    print(('wrote ' if old is None else 'already ') + p)
