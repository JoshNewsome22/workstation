#!/usr/bin/env python3
"""Assemble a new form from the shared parts of an existing one (CF-1) and the new form's own parts.

usage: new-form.py <template form .html> <parts folder> <out .html>

The parts folder holds: meta.json {id, title, sub, file}, own.css, body.html (the sections inside
<main class="sheet">, after the print head), script.js (the form's own script). Everything else -
the generic stylesheet, the brand system, the masthead and toolbar shell, the packet map, the
workstation bridge and the shared tail blocks - is copied from the template, with its form id and
titles replaced. Run tools/apply-polish.py on the folder afterwards.
"""
import json, re, sys
tpl, parts, out = sys.argv[1:4]
src = open(tpl, encoding='utf-8').read()
meta = json.load(open(f'{parts}/meta.json', encoding='utf-8'))
own_css = open(f'{parts}/own.css', encoding='utf-8').read()
body = open(f'{parts}/body.html', encoding='utf-8').read()
script = open(f'{parts}/script.js', encoding='utf-8').read()
toolbar = open(f'{parts}/toolbar.html', encoding='utf-8').read()
L = src.split('\n')
def line_of(pat, start=0):
    for i in range(start, len(L)):
        if re.search(pat, L[i]): return i
    raise SystemExit('marker not found: ' + pat)
i_css0 = line_of(r'^<style>$')                                   # generic stylesheet starts
i_own = line_of(r'^/\* -+ CF-1 \*/$')                            # template's own rules start
i_sys = line_of(r'shared form system')                           # brand system starts
i_css1 = line_of(r'^</style>$', i_sys)                           # first stylesheet ends
i_body = line_of(r'^<body class=')
i_tool = line_of(r'^<div class="toolbar noprint">')
i_main = line_of(r'^<main class="sheet">')
i_head_end = line_of(r'^  </div>$', i_main)                      # end of the print head
i_script = line_of(r'^<script>$', i_head_end)                    # the form's own script
i_packet = line_of(r'NBH student packet', i_script) - 1          # <script> of the packet map
assert L[i_packet].strip() == '<script>'
head = '\n'.join(L[:i_css0]).replace('Form CF-1 · Contextual Fit Assessment and Enhancement', f"Form {meta['id']} · {meta['title']}")
generic = '\n'.join(L[i_css0:i_own])
system = '\n'.join(L[i_sys:i_css1 + 1]).replace('content:"Form CF-1"', f'content:"Form {meta["id"]}"')
mast = '\n'.join(L[i_body:i_tool])
mast = mast.replace('Form CF-1', f'Form {meta["id"]}').replace('<body class="view-setup">', f'<body class="view-{meta["firstView"]}">')
mast = re.sub(r'<h1>.*?</h1>', '<h1>' + meta['title'] + '</h1>', mast, count=1)
mast = re.sub(r'<p class="nbh-sub">.*?</p>', '<p class="nbh-sub">' + meta['sub'] + '</p>', mast, count=1, flags=re.S)
printhead = '\n'.join(L[i_main:i_head_end + 1]).replace('Contextual Fit Assessment and Enhancement', meta['title']).replace('Form CF-1', f'Form {meta["id"]}')
tail = '\n'.join(L[i_packet:])
doc = (head + '\n' + generic + '\n' + own_css.rstrip('\n') + '\n\n' + system + '\n</head>\n' + mast + '\n' + toolbar.rstrip('\n') + '\n\n' +
       printhead + '\n\n' + body.rstrip('\n') + '\n</main>\n\n<script>\n' + script.rstrip('\n') + '\n</script>\n\n' + tail)
if not doc.endswith('\n'): doc += '\n'
for must in (f'Form {meta["id"]}', 'nbh-polish', 'workstation bridge', 'NBH student packet'):
    assert must in doc, must
assert 'CF-1' not in doc.replace('Form CF-1 produces one', '').replace('Form CF-1)', '').replace('(Form CF-1', ''), 'template id left behind'
open(out, 'w', encoding='utf-8').write(doc)
print('wrote', out, len(doc.splitlines()), 'lines')
