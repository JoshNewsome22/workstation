#!/usr/bin/env python3
"""Pack a workstation folder into one file: index.html with the 35 forms and the two PDF-tool
scripts inside it, gzip-compressed and base64-encoded in text blocks at the top of the body.

The shared logo is kept once (every form carries it several times), the forms as JSON with the
logo cut out, the PDF scripts as JSON, and a copy of index.html itself - which Save case uses to
write a case file that is the workstation again with the case inside it. index.html knows to read
these blocks when they are present and does nothing different when they are not.

usage: build-single.py <folder> <out.html>
"""
import os, re, sys, json, gzip, base64
SRC, OUT = sys.argv[1:3]
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', idx)
files = re.findall(r"\['[A-Z]+-1','[^']*','([^']+\.html)'\]", m.group(1))
if len(files) != 35:
    sys.exit(f'expected 35 forms in index.html, found {len(files)}')
forms = {}
for fn in files:
    s = open(os.path.join(SRC, fn), encoding='utf-8').read()
    if logo not in s:
        sys.exit(f'{fn} does not carry the logo index.html carries')
    forms[fn] = s.replace(logo, '@@NBH-LOGO@@')
pdf = {fn: open(os.path.join(SRC, fn), encoding='utf-8').read() for fn in ('pdf-lib.min.js', 'nbh-pdf-tools.js')}
def pack(text):
    return base64.b64encode(gzip.compress(text.encode('utf-8'), compresslevel=9, mtime=0)).decode('ascii')
def block(bid, text):
    return f'<script type="text/plain" id="{bid}">{text}</script>\n'
blocks = (block('nbh-embed-logo', logo) + block('nbh-embed-forms', pack(json.dumps(forms, ensure_ascii=False))) +
          block('nbh-embed-pdf', pack(json.dumps(pdf, ensure_ascii=False))) + block('nbh-embed-shell', pack(idx)))
at = idx.index('<body>\n')
out = idx[:at + 7] + blocks + idx[at + 7:]
open(OUT, 'w', encoding='utf-8').write(out)
print('wrote', OUT, f'{os.path.getsize(OUT)/1e6:.1f} MB, {len(forms)} forms')
