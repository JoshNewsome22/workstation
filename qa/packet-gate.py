#!/usr/bin/env python3
"""v22.77 (review I242) the packet print gate's reader: reads the master print's PDF page by page with PyMuPDF and reports,
as JSON on stdout, what qa/packet-gate-test.js checks. Called as: python3 -I qa/packet-gate.py PACKET.pdf META.json

META (written by the test from the packet's own page): the sections in order ({k, id, short}), the practice, the running
head's student line, the FERPA foot, the cover notice's first and last words, the page box (0.62 in top and bottom,
0.45 in each side, as the shell's @page sets it) and the small-print floor.

What the shell's print CSS makes Chromium emit (read from a packet before any check was written): every page is
612 x 792 pt; four margin boxes sit about 0.24 in from the top and bottom edges (practice at the top left, the student
and ID at the top right, the FERPA line at the bottom left, "Page N of M" at the bottom right); a form's pages add the
section's number and name at the top centre; the cover's pages have no centre head. The 3 px white labels Finish PDF reads
(NBHPKT, NBHSEC, NBHTOC, NBHEDGE) and the gate's own signature labels (GSA, GSZ) are white text: they are read for
position only and count as nothing printed. A rotated line (a DRAFT watermark) is listed, not held to the margins."""
import sys, json, re
import pymupdf

pdf, meta = sys.argv[1], json.load(open(sys.argv[2], encoding='utf8'))
IN = 72.0
TOP, SIDE = meta.get('top', 0.62) * IN, meta.get('side', 0.45) * IN
EDGE = meta.get('edge', 0.2) * IN          # nothing printed nearer an edge than this
TOL = 3.0                                   # a glyph box may stand a little proud of its line
FLOOR = float(meta.get('floor', 6))
norm = lambda s: re.sub(r'\s+', ' ', s or '').strip()
secs = {s['k']: s for s in meta['sections']}
doc = pymupdf.open(pdf)
N = len(doc)
out = {'pages': N, 'odd': [], 'heads': [], 'margins': [], 'rotated': [], 'blank': [], 'heading': [], 'stray': [],
       'perSec': {}, 'cover': {}, 'sig': {}, 'order': [], 'tocMarks': [], 'forbid': []}
FORBID = [re.compile(x) for x in meta.get('forbid', [])]
seq = []
for pn in range(N):
    page = doc[pn]; W, H = page.rect.width, page.rect.height; no = pn + 1
    if abs(W - 612) > 1 or abs(H - 792) > 1: out['odd'].append([no, round(W), round(H)])
    D = page.get_text('dict')
    slots = {'tl': [], 'tc': [], 'tr': [], 'bl': [], 'br': []}
    body, imgs, marks, heads, turned = [], 0, [], [], []
    for b in D['blocks']:
        if b['type'] != 0:
            imgs += 1; x0, y0, x1, y1 = b['bbox']
            if x0 < SIDE - TOL or x1 > W - SIDE + TOL or y0 < TOP - TOL or y1 > H - TOP + TOL:
                out['margins'].append([no, 'picture', [round(v) for v in b['bbox']]])
            continue
        for l in b['lines']:
            rot = abs(l['dir'][1]) > 0.01
            for s in l['spans']:
                t = s['text'].strip()
                if not t: continue
                x0, y0, x1, y1 = s['bbox']
                if s['color'] == 0xffffff: marks.append((t, y0)); continue
                if rot: out['rotated'].append([no, t[:40]]); turned.append(s); continue
                if y1 <= TOP - 1 or y0 >= H - TOP + 1:
                    row = 't' if y1 <= TOP - 1 else 'b'
                    col = 'l' if x0 < W * 0.25 else ('r' if x1 > W * 0.75 else 'c')
                    if row + col in slots: slots[row + col].append(s); heads.append(s); continue
                body.append(s)
    # the running heads: in place, and nearer no edge than EDGE
    got = {k: norm(' '.join(s['text'] for s in v)) for k, v in slots.items()}
    m = re.match(r'^(\d+) · (.*)$', got['tc'])
    k = int(m.group(1)) if m else 0
    seq.append(k)
    want = {'tl': norm(meta['practice']), 'tr': norm(meta['runHead']), 'bl': norm(meta['ferpaFoot']),
            'br': 'Page %d of %d' % (no, N)}
    if k: want['tc'] = '%d · %s' % (k, norm(secs[k]['short'])) if k in secs else '?'
    miss = [s for s in want if got[s] != want[s]]
    if not k and got['tc']: miss.append('tc')
    if miss: out['heads'].append([no, {s: got[s] for s in miss}])
    for s in heads:
        x0, y0, x1, y1 = s['bbox']
        if y0 < EDGE or y1 > H - EDGE or x0 < SIDE - TOL or x1 > W - SIDE + TOL:
            out['margins'].append([no, 'head', [round(v, 1) for v in s['bbox']], s['text'].strip()[:40]])
    for s in body:
        x0, y0, x1, y1 = s['bbox']
        if x0 < SIDE - TOL or x1 > W - SIDE + TOL or y0 < TOP - TOL or y1 > H - TOP + TOL:
            out['margins'].append([no, 'text', [round(v, 1) for v in s['bbox']], s['text'].strip()[:40]])
    # what the page holds (a turned line is content too: TK-1's book printed sideways on an upright iPad)
    chars = sum(len(s['text'].strip()) for s in body + turned)
    lines = len({round(s['bbox'][3] / 3) for s in body}) + len(turned)
    draws = len(page.get_drawings()) if imgs == 0 and chars < 200 else 99
    band = lambda t: re.match(r'^(SECTION \d+ OF \d+|FORM [A-Z]{2,3}-\d)$', t) or re.match(r'^Form [A-Z]{2,3}-\d · ', t)
    headish = lambda s: (s['flags'] & 16) or s['size'] >= 12 or band(s['text'].strip())
    sec = secs.get(k, {}).get('id', 'cover' if not k else '?')
    rec = out['perSec'].setdefault(sec, {'k': k, 'pages': 0, 'first': no, 'minPt': None, 'minText': '', 'minPage': 0, 'small': 0})
    rec['pages'] += 1
    sample = ' | '.join(s['text'].strip() for s in body)[:90]
    whole = norm(' '.join(s['text'] for s in body))
    for rx in FORBID:
        g = rx.search(whole)
        if g and not (sec in ('REFS', 'cover') and 'References' in rx.pattern): out['forbid'].append([no, sec, whole[max(0, g.start() - 30):g.end() + 30]])
    if not body and not turned and imgs == 0: out['blank'].append([no, sec, draws])
    elif imgs == 0 and draws <= 12 and chars < 200 and not turned and all(headish(s) for s in body): out['heading'].append([no, sec, sample])
    elif imgs == 0 and draws <= 12 and lines <= 1 and chars < 60: out['stray'].append([no, sec, sample])
    # the smallest print a form puts on paper (a span with a letter or a figure in it)
    for s in body:
        if not re.search(r'\w', s['text']): continue
        if rec['minPt'] is None or s['size'] < rec['minPt']:
            rec['minPt'], rec['minText'], rec['minPage'] = round(s['size'], 2), s['text'].strip()[:40], no
        if s['size'] < FLOOR: rec['small'] += 1
    # the gate's signature labels and the contents labels
    for t, y in marks:
        for g in re.finditer(r'GS([AZ])(\d+);', t):
            out['sig'].setdefault(g.group(2), {})[g.group(1)] = no
        for g in re.finditer(r'NBHTOC:([A-Z0-9-]+);', t):
            out['tocMarks'].append([g.group(1), no])
    if pn == 0:
        txt = norm(page.get_text())
        a, z = norm(meta['conf'][0]), norm(meta['conf'][1])
        out['cover'] = {'notice': a in txt and z in txt, 'beforeContents': 0 <= txt.find(a) < txt.find('Contents'),
                        'student': norm(meta['student']) in txt}
# the sections run in order, each on pages of its own
runs = []
for k in seq:
    if not runs or runs[-1] != k: runs.append(k)
out['order'] = runs
out['coverPages'] = seq.index(next((k for k in seq if k), 0)) if any(seq) else N
print(json.dumps(out))
