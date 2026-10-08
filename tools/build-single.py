#!/usr/bin/env python3
"""Pack a workstation folder into one file: index.html with the 45 forms, the two PDF-tool
scripts and the pictogram library inside it, gzip-compressed and base64-encoded in text blocks at the top of the body.

The shared logo is kept once (every form carries it several times), the forms as JSON with the
logo cut out, the PDF scripts as JSON, and a copy of index.html itself - which Save case uses to
write a case file that is the workstation again with the case inside it. index.html knows to read
these blocks when they are present and does nothing different when they are not.

v21.43: every form carries the writing help (<script id="nbh-wording">, tools/blocks/patch-wording.py), the same
240 KB in each. The packer's gzip cannot share it between forms (deflate looks back 32 KB, the copies are 300 KB and
more apart), so 45 copies would cost about 4 MB here: like the logo, it is cut out of every form (@@NBH-WORDING@@)
and kept once, in a block of its own, which index.html puts back as it opens a form. A form with none or with two
copies, or with a copy unlike the others' (a form not re-patched), stops the build, and the packed forms are
unpacked again, the writing help and the logo put back, and checked against the files before anything is written.

usage: build-single.py <folder> <out.html>
"""
import os, re, sys, json, gzip, base64
SRC, OUT = sys.argv[1:3]
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
# v21.43: the block that makes the folder edition an app to install (manifest, icons, the iPad's tags) points at files
# beside index.html, and the offline worker it goes with is the folder's; the one-file edition has neither, so its page,
# and the copy of it that Save case writes into a case file, leave the block out. (The shell registers no worker here.)
PWA = re.compile(r'<!-- nbh-pwa-head[\s\S]*?<!-- /nbh-pwa-head -->\n')
if len(PWA.findall(idx)) > 1:
    sys.exit('index.html holds more than one nbh-pwa-head block')
idx = PWA.sub('', idx)
if re.search(r'<link rel="(manifest|apple-touch-icon)"', idx):
    sys.exit('index.html links the manifest or the touch icon outside its nbh-pwa-head block')
logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', idx)
files = re.findall(r"\['[A-Z]+-1','[^']*','([^']+\.html)'\]", m.group(1))
if len(files) != 45:
    sys.exit(f'expected 45 forms in index.html, found {len(files)}')
WTAG = '\n<script id="nbh-wording">'
WHOLE = '@@NBH-WORDING@@'
forms, files_in, wording = {}, {}, None
for fn in files:
    s = open(os.path.join(SRC, fn), encoding='utf-8').read()
    files_in[fn] = s
    if logo not in s:
        sys.exit(f'{fn} does not carry the logo index.html carries')
    if s.count(WTAG) != 1:
        sys.exit(f'{fn} holds {s.count(WTAG)} copies of the writing help (<script id="nbh-wording">), not one: '
                 f'run python3 tools/blocks/patch-wording.py on it')
    if WHOLE in s:
        sys.exit(f'{fn} already holds {WHOLE}')
    a = s.index(WTAG) + len(WTAG); b = s.index('</script>', a)
    if wording is None:
        wording = s[a:b]
    elif s[a:b] != wording:
        sys.exit(f'{fn} holds another copy of the writing help than the forms before it: run python3 tools/blocks/patch-wording.py on every form')
    if logo in wording:
        sys.exit('the writing help holds the logo')
    forms[fn] = (s[:a] + WHOLE + s[b:]).replace(logo, '@@NBH-LOGO@@')
pdf = {fn: open(os.path.join(SRC, fn), encoding='utf-8').read() for fn in ('pdf-lib.min.js', 'nbh-pdf-tools.js')}
# v21.31: the pictogram library (Forms SM-1, VS-1 and TK-1 load it by <script src>) travels once, as its own block
pictos = open(os.path.join(SRC, 'nbh-pictos.js'), encoding='utf-8').read()
# v21.62: My pictures (Forms VS-1, SM-1, TK-1 and TV-1 load nbh-pictures.js by <script src>) travels once too
pictures = open(os.path.join(SRC, 'nbh-pictures.js'), encoding='utf-8').read()
# v21.39: the respondent-page library (Form IA-1 loads it by <script src>) travels once too
respond = open(os.path.join(SRC, 'nbh-respond.js'), encoding='utf-8').read()
# v21.44: Form TK-1's recorded narration (its <script src defer>) travels once too
narration = open(os.path.join(SRC, 'nbh-tk1-narration.js'), encoding='utf-8').read()
video = open(os.path.join(SRC, 'nbh-tk1-video.js'), encoding='utf-8').read()
# v21.45: Form SM-1's recorded narration, the same way (its walkthrough uses TK-1's Save as video)
narration_sm1 = open(os.path.join(SRC, 'nbh-sm1-narration.js'), encoding='utf-8').read()
# v21.47: Form DD-1's recorded narration, the same way
narration_dd1 = open(os.path.join(SRC, 'nbh-dd1-narration.js'), encoding='utf-8').read()
# v21.49: Form TK-1's bus ride narration, its own file beside the form, the same way
narration_tk1bus = open(os.path.join(SRC, 'nbh-tk1-bus-narration.js'), encoding='utf-8').read()
# v21.56: Form IA-1's FAST walkthrough narration, the same way
narration_ia1 = open(os.path.join(SRC, 'nbh-ia1-narration.js'), encoding='utf-8').read()
# v21.60: Form RA-1's reinforcer assessment walkthrough narration, the same way
narration_ra1 = open(os.path.join(SRC, 'nbh-ra1-narration.js'), encoding='utf-8').read()
def pack(text):
    return base64.b64encode(gzip.compress(text.encode('utf-8'), compresslevel=9, mtime=0)).decode('ascii')
def block(bid, text):
    return f'<script type="text/plain" id="{bid}">{text}</script>\n'
packed = pack(json.dumps(forms, ensure_ascii=False))
pwording = pack(wording)
back = json.loads(gzip.decompress(base64.b64decode(packed)).decode('utf-8'))
wback = gzip.decompress(base64.b64decode(pwording)).decode('utf-8')
# as index.html's EMBED.form() opens a form: the logo back, then the writing help back
if back != forms or wback != wording or any('@@NBH-LOGO@@' not in back[fn] or back[fn].count(WHOLE) != 1 or
                                             back[fn].replace('@@NBH-LOGO@@', logo).replace(WHOLE, wback) != files_in[fn] for fn in files):
    sys.exit('the packed forms do not unpack to the files, each with its one copy of the writing help')
blocks = (block('nbh-embed-logo', logo) + block('nbh-embed-forms', packed) + block('nbh-embed-wording', pwording) +
          block('nbh-embed-pdf', pack(json.dumps(pdf, ensure_ascii=False))) + block('nbh-embed-pictos', pack(pictos)) + block('nbh-embed-pictures', pack(pictures)) + block('nbh-embed-respond', pack(respond)) + block('nbh-embed-narration', pack(narration)) + block('nbh-embed-video', pack(video)) + block('nbh-embed-narration-sm1', pack(narration_sm1)) + block('nbh-embed-narration-dd1', pack(narration_dd1)) + block('nbh-embed-narration-tk1bus', pack(narration_tk1bus)) + block('nbh-embed-narration-ia1', pack(narration_ia1)) + block('nbh-embed-narration-ra1', pack(narration_ra1)) + block('nbh-embed-shell', pack(idx)))
at = idx.index('<body>\n')
out = idx[:at + 7] + blocks + idx[at + 7:]
open(OUT, 'w', encoding='utf-8').write(out)
print('wrote', OUT, f'{os.path.getsize(OUT)/1e6:.1f} MB, {len(forms)} forms; the writing help once ({len(wording)/1e3:.0f} KB), put back into each form as it opens')
