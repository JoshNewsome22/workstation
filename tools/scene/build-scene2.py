#!/usr/bin/env python3
"""Assemble the v2 scene engine for a form and splice it over the form's old engine.
usage: build-scene2.py <form.html> <boards.js> [ext.js|-] [out.html]
boards.js: the form's own board/ladder code (functions used by BOARD and LADDER below);
ext.js: the form's extension module (defines EXT), or - for none."""
import re, sys
form, boards = sys.argv[1], sys.argv[2]
ext = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
out = sys.argv[4] if len(sys.argv) > 4 else form
core = open(__file__.rsplit('/', 1)[0] + '/scene2-core.js', encoding='utf-8').read()
bsrc = open(boards, encoding='utf-8').read()
hooks = "\nconst BOARD=k=>(typeof raBoard==='function'&&raBoard(k))||(typeof eaBoard==='function'&&eaBoard(k))||'';\nconst LADDER=L=>typeof raLadder==='function'?raLadder(L):'';\n"
assert core.count('/*BOARDS*/') == 1
esrc = open(ext, encoding='utf-8').read() if ext else ''
engine = 'window.NBHScene=(()=>{\n' + core.replace('/*BOARDS*/', bsrc + hooks).replace('/*EXT*/', esrc) + '\n})();'
src = open(form, encoding='utf-8').read()
L = src.split('\n')
start = next(i for i, l in enumerate(L) if l.startswith('window.NBHScene=(()=>{'))
def _prev(i):
    j = i - 1
    while j > 0 and not L[j].strip(): j -= 1
    return L[j]
end = next(i for i in range(start, len(L)) if L[i] == '})();' and _prev(i).startswith('return ') and 'make' in _prev(i))
L[start:end + 1] = engine.split('\n')
doc = '\n'.join(L)
# the story player waits for the choreography before it moves on
doc = re.sub(r"setTimeout\(play,RM\?(\d+):(\d+)\)", lambda m: "setTimeout(play,RM?%s:%d)" % (m.group(1), max(int(m.group(2)), 3600)), doc)
open(out, 'w', encoding='utf-8').write(doc)
print('spliced v2 engine into', out, 'replacing lines', start + 1, '-', end + 1, '(', end - start + 1, 'lines ) with', len(engine.split('\n')))
