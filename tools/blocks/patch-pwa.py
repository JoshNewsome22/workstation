#!/usr/bin/env python3
"""v21.43 Put the installed-app save (tools/blocks/nbh-pwa-save.js) into the 44 forms and the shell, as ONE
<script id="nbh-pwa-save"> on the line after each page's <title>, the script's text copied byte for byte. Like
patch-wording.py it REPLACES an existing copy every time, so run it again whenever nbh-pwa-save.js changes, or on a tree
whose forms were rebuilt or merged; it refuses a page that already holds more than one copy, and never adds a second.
Every page is worked out before any is written, so a refusal leaves the folder as it was.

The pages are index.html and the 44 forms its FORMS list names (respond.html, the informants' page, is left alone).
Nothing else in a page changes. The block is a script in the head that wraps nothing and stops at its first test unless
the page runs as the workstation installed on an iPad or iPhone (see the comment at its top), so a page in a browser tab,
on paper or inside the one-file edition behaves exactly as before.

The source is checked first and nothing is written if it is wrong: it may not contain "</script" or "<!--" (either
would end or confuse the script element), "</head>", "</body>" or "</html>" (the tags a host's injector looks for: a
snippet put inside the block would break it), the practice's name (the school edition build refuses any copy of it) or
a model ID. Files are read and written without newline translation. After running it, run python3 tools/pwa-sw.py on
the folder: the release list (release.json) holds every page's hash.

usage: python3 tools/blocks/patch-pwa.py [--check] [FOLDER]      FOLDER defaults to NBH-Workstation
  --check   change nothing; exit 1 unless every page already carries the current copy"""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'tools', 'blocks', 'nbh-pwa-save.js')
OPEN, CLOSE = '<script id="nbh-pwa-save">', '</script>'
TAG = '\n' + OPEN          # the element itself starts a line; the words in a comment do not count


def fail(msg):
    sys.exit('patch-pwa.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def pages(folder):
    idx = os.path.join(folder, 'index.html')
    if not os.path.isfile(idx):
        fail('no index.html in ' + folder)
    m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', read(idx))
    if not m:
        fail('index.html has no FORMS list')
    files = re.findall(r"\['[A-Z]+-1','[^']*','([^']+\.html)'\]", m.group(1))
    if len(files) != 44:
        fail('expected 44 forms in index.html, found %d' % len(files))
    missing = [f for f in files if not os.path.isfile(os.path.join(folder, f))]
    if missing:
        fail('forms named in index.html but not in the folder: ' + ', '.join(missing))
    return ['index.html'] + files


def main(argv):
    check, folder = False, None
    for a in argv:
        if a in ('-h', '--help'):
            print(__doc__); return 0
        if a == '--check':
            check = True
        elif a.startswith('-'):
            fail('unknown option ' + a + '; see --help')
        elif folder is None:
            folder = a
        else:
            fail('one folder at a time; see --help')
    folder = os.path.abspath(folder or os.path.join(ROOT, 'NBH-Workstation'))
    src = read(SRC)
    low = src.lower()
    # '</script' or '<!--' would end or confuse the script element; '</head>', '</body>' and '</html>' are what GoDaddy's
    # injector looks for (it puts its snippet before the first of each), so the block may not hold them either
    for bad in ('</script', '<!--', '</head>', '</body>', '</html>', 'newsome behavioral health'):
        if bad in low:
            fail('nbh-pwa-save.js must not contain ' + repr(bad))
    mid = re.search(r'claude-[a-z]+-\d', src, re.I)
    if mid:
        fail('nbh-pwa-save.js must not carry a model ID (' + repr(mid.group(0)) + ')')
    if 'window.nbhShareSave' not in src:
        fail('nbh-pwa-save.js does not look like the save block')
    block = OPEN + src + CLOSE
    stale, counts, outs = [], {'inserted': 0, 'replaced': 0, 'already current': 0}, []
    for name in pages(folder):          # every page is worked out first; nothing is written if one of them is wrong
        path = os.path.join(folder, name)
        s = read(path)
        n = s.count(TAG)
        if n > 1:
            fail('%s: %d copies of the block; remove all but one first' % (name, n))
        if n:
            a = s.index(TAG) + 1
            b = s.index(CLOSE, a) + len(CLOSE)
            out = s[:a] + block + s[b:]
            did = 'replaced' if s[a:b] != block else 'already current'
        else:
            head = re.search(r'<head>[\s\S]*?</head>', s)
            t = re.compile(r'</title>\n').search(s, head.start(), head.end()) if head else None
            if not t:
                fail(name + ': no <title> line in the head to put the block after')
            out = s[:t.end()] + block + '\n' + s[t.end():]
            did = 'inserted'
        if out.count(TAG) != 1 or out.count(block) != 1:
            fail(name + ': would not hold exactly one copy')
        if did != 'already current':
            stale.append(name)
        counts[did] += 1
        outs.append((name, path, out, did))
    if not check:
        for name, path, out, did in outs:
            if did != 'already current':
                write(path, out)
            print(did.ljust(16), name)
    if check:
        if stale:
            print('patch-pwa.py --check: %d of %d pages need the current block: %s' % (len(stale), sum(counts.values()), ', '.join(stale)))
            return 1
        print('patch-pwa.py --check: all %d pages carry the current block' % sum(counts.values()))
        return 0
    print('%d pages: %s' % (sum(counts.values()), ', '.join('%d %s' % (v, k) for k, v in counts.items() if v)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
