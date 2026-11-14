#!/usr/bin/env python3
"""v25.69 The procedure videos' one list, NBH-Workstation/nbh-videos.js (Form TD-1's videos and the video library,
videos.html), kept current in two places:

1. The part of nbh-videos.js between its two markers (GEN): from the protocol bank (nbh-td1-bank.js) each card a video
   names (src and open: its code, its words, its functions and its study); each video's functions (those its cards name;
   for a video whose cards name none, each function that at least half of the bank's cards of the same code name, so a
   high-p video reads as escape); from index.html the file of Form TD-1 (the library opens a card there); from each
   video's MP4 its length in seconds (to a tenth). v25.73 the same for the study podcast's episodes (PODS, after the part it
   writes): each card an episode names, the episode's functions (pfn, those its cards name) and its length (pdur, from the
   audio's MP4). --check allows a length one second off (a video's sound redone can move its
   end by a frame or two).
2. Form TD-1's copy of the whole file: <script id="nbh-videos"> on the line before <script id="td1-video">, so the form
   needs no second file to show its videos (its one-file edition has the list too).

The source may not hold "</script" or "<!--" (either would end or confuse the script element in the form) or the
practice's name (the school edition's build refuses any copy of it). Files are read and written without newline
translation. After running it, run python3 tools/pwa-sw.py on the folder (TD-1 changed).

usage: python3 tools/blocks/patch-videos.py [--check] [FOLDER]      FOLDER defaults to NBH-Workstation
  --check   change nothing; exit 1 unless both are current"""
import base64, json, os, re, struct, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = '/* ---- written by tools/blocks/patch-videos.py; run it again rather than editing this part ---- */\n'
B = '/* ---- end of the part tools/blocks/patch-videos.py writes ---- */'
OPEN, CLOSE = '<script id="nbh-videos">', '</script>\n'
BEFORE = '<script id="td1-video">'
FNS = ('escape', 'attention', 'tangible', 'automatic')


def fail(msg):
    sys.exit('patch-videos.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def entries(src):
    """each entry of LIST: its key, its video file and the cards it names (src and open)"""
    out = []
    body = src[src.index('var LIST = ['):src.index(A)]
    for m in re.finditer(r"\n \{key:'([^']+)'(.*)", body):
        key, rest = m.group(1), m.group(2)
        fm = re.search(r"file:'(nbh-td1-video-[a-z0-9-]+\.js)'", rest)
        if not fm:
            fail('the entry %s names no video file' % key)
        cards = []
        sm = re.search(r"src:(?:'([^']+)'|\[([^\]]*)\])", rest)
        if sm:
            cards += [sm.group(1)] if sm.group(1) else re.findall(r"'([^']+)'", sm.group(2))
        om = re.search(r"open:\[([^\]]*)\]", rest)
        if om:
            cards += re.findall(r"'([^']+)'", om.group(1))
        if not cards:
            fail('the entry %s names no card (src or open)' % key)
        out.append((key, fm.group(1), cards))
    if not out:
        fail('nbh-videos.js holds no entries')
    return out


def pod_entries(src):
    """v25.73 each episode of PODS: its key, its audio file and the cards it names"""
    if 'var PODS = [' not in src:
        return []
    out = []
    body = src[src.index('var PODS = ['):]
    body = body[:body.index('\n];')]
    for m in re.finditer(r"\n \{key:'([^']+)'(.*)", body):
        key, rest = m.group(1), m.group(2)
        fm = re.search(r"file:'(nbh-pod-[a-z0-9-]+\.js)'", rest)
        cm = re.search(r"cards:\[([^\]]*)\]", rest)
        if not fm or not cm or not re.findall(r"'([^']+)'", cm.group(1)):
            fail('the episode %s names no audio file or no card' % key)
        out.append((key, fm.group(1), re.findall(r"'([^']+)'", cm.group(1))))
    return out


def mp4_seconds(path):
    """the length of the MP4 the video (or v25.73 episode) file carries as base64: its movie header (mvhd)"""
    s = read(path)
    m = re.search(r"NBH_(?:TD1_VIDEO|POD_AUDIO)\['[^']+'\]\s*=\s*'([A-Za-z0-9+/=]+)'", s)
    if not m:
        fail(os.path.basename(path) + ' holds no video')
    b = base64.b64decode(m.group(1))
    i = b.find(b'mvhd')
    if i < 0:
        fail(os.path.basename(path) + ': no movie header in its MP4')
    v = b[i + 4]
    if v == 1:
        scale, dur = struct.unpack('>IQ', b[i + 24:i + 36])
    else:
        scale, dur = struct.unpack('>II', b[i + 16:i + 24])
    return dur / float(scale)


def js(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':'), sort_keys=True)


def gen(folder, src):
    bs = read(os.path.join(folder, 'nbh-td1-bank.js'))
    i = bs.index('const TD1_BANK=') + len('const TD1_BANK=')
    bank = json.loads(bs[i:bs.rindex(';')])
    by = {p['id']: p for p in bank['protocols']}
    refs = bank.get('refs', {})
    idx = read(os.path.join(folder, 'index.html'))
    fm = re.search(r"\['TD-1','[^']*','([^']+\.html)'\]", idx)
    if not fm:
        fail('index.html names no Form TD-1')
    cards, fn, dur = {}, {}, {}
    for key, file, ids in entries(src):
        f = set()
        for cid in ids:
            p = by.get(cid)
            if not p:
                fail('the video %s names the card %s, which the protocol bank does not hold' % (key, cid))
            cite = '; '.join(refs[r]['cite'] for r in (p.get('src') or []) if r in refs and refs[r].get('cite'))
            cards[cid] = {'code': p['code'], 'lab': p['lab'], 'fn': [x for x in (p.get('fn') or []) if x in FNS], 'cite': cite}
            f.update(cards[cid]['fn'])
        if not f:
            code = by[ids[0]]['code']
            same = [p for p in bank['protocols'] if p['code'] == code and p.get('fn')]
            f = {x for x in FNS if same and sum(1 for p in same if x in p['fn']) * 2 >= len(same)}
            # v26.26: DRO in class stays under Any only. Its cards name no function, and at v26.25 one more DRO card brought the
            # bank to an exact tie (30 of 60 DRO cards name automatic), which would file a classroom video under Automatic.
            if key == 'dro_class': f = set()
        fn[key] = [x for x in FNS if x in f]
        path = os.path.join(folder, file)
        if not os.path.isfile(path):
            fail('the video file %s is not in %s' % (file, folder))
        dur[key] = round(mp4_seconds(path), 1)
    pfn, pdur = {}, {}
    for key, file, ids in pod_entries(src):
        f = set()
        for cid in ids:
            p = by.get(cid)
            if not p:
                fail('the episode %s names the card %s, which the protocol bank does not hold' % (key, cid))
            cite = '; '.join(refs[r]['cite'] for r in (p.get('src') or []) if r in refs and refs[r].get('cite'))
            cards[cid] = {'code': p['code'], 'lab': p['lab'], 'fn': [x for x in (p.get('fn') or []) if x in FNS], 'cite': cite}
            f.update(cards[cid]['fn'])
        pfn[key] = [x for x in FNS if x in f]
        path = os.path.join(folder, file)
        if not os.path.isfile(path):
            fail('the episode file %s is not in %s' % (file, folder))
        pdur[key] = round(mp4_seconds(path), 1)
    g = {'form': fm.group(1), 'cards': cards, 'fn': fn, 'dur': dur}
    if pdur:
        g['pfn'], g['pdur'] = pfn, pdur
    return g


def render(src, g):
    a, b = src.find(A), src.find(B)
    if a < 0 or b < a or src.count(A) != 1 or src.count(B) != 1:
        fail('nbh-videos.js does not hold the two marker comments once each')
    return src[:a + len(A)] + 'var GEN = ' + js(g) + ';\n' + src[b:]


def current_gen(src):
    a, b = src.find(A), src.find(B)
    m = re.match(r'var GEN = (\{.*\});\n$', src[a + len(A):b], re.S)
    try:
        return json.loads(m.group(1)) if m else None
    except ValueError:
        return None


def main(argv):
    check, folder = False, None
    for x in argv:
        if x in ('-h', '--help'):
            print(__doc__); return 0
        if x == '--check':
            check = True
        elif x.startswith('-'):
            fail('unknown option ' + x)
        elif folder is None:
            folder = x
        else:
            fail('one folder at a time')
    folder = os.path.abspath(folder or os.path.join(ROOT, 'NBH-Workstation'))
    vpath = os.path.join(folder, 'nbh-videos.js')
    src = read(vpath)
    low = src.lower()
    for bad in ('</script', '<!--', 'newsome behavioral health'):
        if bad in low:
            fail('nbh-videos.js holds %r' % bad)
    g = gen(folder, src)
    stale = []
    have = current_gen(src)
    if check and have is not None:
        # a length one second off is current (see the top)
        ok = (have.get('form') == g['form'] and have.get('cards') == g['cards'] and have.get('fn') == g['fn'] and
              set(have.get('dur', {})) == set(g['dur']) and all(abs(have['dur'][k] - g['dur'][k]) <= 1 for k in g['dur']) and
              have.get('pfn') == g.get('pfn') and set(have.get('pdur', {})) == set(g.get('pdur', {})) and
              all(abs(have['pdur'][k] - g['pdur'][k]) <= 1 for k in g.get('pdur', {})))
        out = src if ok else render(src, g)
    else:
        out = render(src, g)
    if out != src:
        stale.append('nbh-videos.js')
    tds = [f for f in os.listdir(folder) if f.startswith('TD-1_') and f.endswith('.html')]
    if len(tds) != 1:
        fail('expected one Form TD-1 in %s, found %d' % (folder, len(tds)))
    tpath = os.path.join(folder, tds[0])
    t = read(tpath)
    if t.count(BEFORE) != 1:
        fail('%s holds %d copies of %s, not one' % (tds[0], t.count(BEFORE), BEFORE))
    block = OPEN + out.rstrip('\n') + '\n' + CLOSE
    n = t.count(OPEN)
    if n > 1:
        fail('%s holds %d copies of %s' % (tds[0], n, OPEN))
    if n == 1:
        i = t.index(OPEN)
        j = t.index(CLOSE, i) + len(CLOSE)
        t2 = t[:i] + block + t[j:]
    else:
        k = t.index(BEFORE)
        t2 = t[:k] + block + t[k:]
    if t2.count(BEFORE) != 1 or t2.index(OPEN) > t2.index(BEFORE):
        fail('the copy would not sit before ' + BEFORE)
    if t2 != t:
        stale.append(tds[0])
    if check:
        if stale:
            print('patch-videos.py --check: not current: %s (run python3 tools/blocks/patch-videos.py)' % ', '.join(stale))
            return 1
        print('patch-videos.py --check: nbh-videos.js and Form TD-1\'s copy current (%d videos)' % len(g['dur']))
        return 0
    if out != src:
        write(vpath, out)
    if t2 != t:
        write(tpath, t2)
    print('patch-videos.py: %d videos, %d episodes; %s' % (len(g['dur']), len(g.get('pdur', {})), ', '.join(stale) + ' written' if stale else 'nothing to change'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
