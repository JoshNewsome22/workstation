#!/usr/bin/env python3
"""v21.36: one copy of the letterhead image per form. Every <img class="nbh-logo"> and <img class="nbh-print-logo">
carried the same 54 KB data URI (up to fourteen copies in one form). The image now sits once in a <script id="nbh-logo">
in the head, which fills those images at load and again before printing. Idempotent.
usage: dedupe.py <form.html>..."""
import sys, re
URI = re.compile(r'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAHZ[A-Za-z0-9+/=]+')
SCRIPT = ('<script id="nbh-logo">/* the letterhead image, once; the logo images below are filled from it */\n'
          '(function(){var L="%s";window.NBH_LOGO=L;function fill(){var a=document.querySelectorAll(\'img[data-nbh-logo]\');'
          'for(var i=0;i<a.length;i++)if(!a[i].getAttribute("src"))a[i].setAttribute("src",L);}'
          'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill);else fill();'
          'window.addEventListener("beforeprint",fill);})();</script>')
for path in sys.argv[1:]:
    s = open(path, encoding='utf-8').read()
    if 'id="nbh-logo"' in s:
        print('already', path); continue
    uris = URI.findall(s)
    assert uris and len(set(uris)) == 1, (path, len(set(uris)))
    L = uris[0]
    n = [0]
    def img(m):
        n[0] += 1
        return m.group(1) + ' data-nbh-logo="1"' + m.group(3)
    s2 = re.sub(r'(<img class="nbh-(?:print-)?logo") src="' + re.escape(L) + '"( alt="[^"]*">)()', lambda m: m.group(1) + ' data-nbh-logo="1"' + m.group(2), s)
    left = URI.findall(s2)
    assert not left, (path, 'data URI left outside a logo image', len(left))
    k = s2.count('data-nbh-logo="1"')
    assert k == len(uris), (path, k, len(uris))
    t = s2.index('</title>') + len('</title>')
    s2 = s2[:t] + '\n' + (SCRIPT % L) + s2[t:]
    open(path, 'w', encoding='utf-8').write(s2)
    print('deduped', path, len(uris), 'copies ->', 1, '(%d KB -> %d KB)' % (len(s)//1024, len(s2)//1024))
