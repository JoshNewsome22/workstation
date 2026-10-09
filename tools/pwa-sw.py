#!/usr/bin/env python3
"""v21.43 Write into sw.js the list of files the offline copy saves and the copy's VERSION, and write release.json, the
release list: every one of those files with its length and SHA-256.

The list is every file the workstation loads from its own folder, in this order: index.html; the 45 forms its FORMS
list names; every file of the folder a page loads (respond.html and the 45 pages are scanned for src= and href= on
script, link, img, iframe, source, video, audio, embed and object tags, url(...) in styles, and fetch('...') and
loadScript('...') in scripts: the picture library nbh-pictos.js, the respondent pages' nbh-respond.js, the PDF tools
pdf-lib.min.js and nbh-pdf-tools.js); respond.html; manifest.json, the icons it names and the apple-touch-icon index.html
names. A link a person follows (<a href>) is not a file a page loads. Every one must be in the folder.

VERSION is a hash of sw.js with that part left out and of the list, so any change to the worker's code or to the list
makes a new version (whose caches are new, the old ones deleted when it takes over), and a change to a form alone does
not: devices find that by asking the website about each file. Upload release.json with the files (the whole folder
holds it): a file whose entry changed must reach a device exactly as listed, so a look in the middle of an upload, or
at a file cut short, takes nothing and tries again later. A file uploaded on its own, with release.json left as it
was, still reaches the devices (checked like any file the list does not name).

The pages are checked too, so that the worker's own checks never refuse a release: every page but respond.html carries
the save block (<script id="nbh-pwa-save">, tools/blocks/patch-pwa.py) once, index.html also its FORMS list, the
<script id="nbh-pwa"> part and the manifest link with crossorigin="use-credentials"; respond.html names nbh-respond.js;
each page holds exactly one </head>, </body> and </html> and ends with </html>, and none names _trfq, _trfd or
wsimg.com (the worker cuts GoDaddy's injected monitoring snippet, which does, out of every page it saves).

It writes only the part of sw.js between the two marker comments, and release.json. Run it after any change to any of
the files (a form, the shell, the picture library), after adding, renaming or removing a form or a file a page loads,
and after changing sw.js; build-rps.py checks the practice's edition with --check and writes the school's own list.

usage: python3 tools/pwa-sw.py [--check] [FOLDER]      FOLDER defaults to NBH-Workstation
  --check   change nothing; exit 1 unless sw.js already carries this list and VERSION and release.json is current"""
import hashlib, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
A = '/* ---- written by tools/pwa-sw.py'
B = '/* ---- end of the part tools/pwa-sw.py writes ---- */'
HEAD = ('/* ---- written by tools/pwa-sw.py from index.html and the files it loads; run it again rather than editing '
        'this part ---- */\n')
RELEASE = 'release.json'
SAVE_TAG = '<script id="nbh-pwa-save">'
MANIFEST_LINK = '<link rel="manifest" href="manifest.json" crossorigin="use-credentials">'
LOADING_TAGS = r'(?:script|link|img|iframe|source|video|audio|embed|object|track)'


def fail(msg):
    sys.exit('pwa-sw.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def local(ref):
    """a file name in this folder (not an address elsewhere, not the pattern a script writes to find a tag)"""
    return bool(re.match(r'^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]+$', ref or ''))


def local_path(ref):
    """v21.67 a file in a folder of this folder (nbh-doc/pdf.min.mjs), as the nbh-offline meta names the readers"""
    return bool(re.match(r'^[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)+\.[A-Za-z0-9]+$', ref or ''))


def loads(text):
    """the same-folder files a page loads, in the order they appear"""
    out = []
    for tag in re.finditer(r'<' + LOADING_TAGS + r'\b[^>]*>', text, re.I):
        for m in re.finditer(r'\b(?:src|href|data|poster)\s*=\s*(["\'])([^"\']*)\1', tag.group(0), re.I):
            out.append(m.group(2))
    out += [m.group(2) for m in re.finditer(r'url\(\s*(["\']?)([^"\')\s]+)\1\s*\)', text)]
    out += [m.group(2) for m in re.finditer(r'\b(?:fetch|loadScript)\(\s*(["\'])([^"\']+)\1', text)]
    seen, keep = set(), []
    for x in out:
        x = x.split('?')[0].split('#')[0]
        if local(x) and x not in seen:
            seen.add(x)
            keep.append(x)
    return keep


def check_page(name, s):
    low = s.lower()
    # v21.44 a page of 2 MB or more can reach a browser cut short (Form TK-1 did, on an iPad, from GoDaddy): keep each under
    # 1.9 MB and put large parts in a file of their own beside the forms, as nbh-pictos.js and nbh-tk1-narration.js are
    if len(s.encode('utf-8')) >= 1900000:
        fail('%s is %d bytes: keep every page under 1.9 MB (move a large part into its own file beside the forms)' % (name, len(s.encode('utf-8'))))
    for tag in ('</head>', '</body>', '</html>'):
        if low.count(tag) != 1:
            fail('%s holds %d %s, not one: the host injects its snippet before the first one, which must be the real tag'
                 % (name, low.count(tag), tag))
    if not re.search(r'</html>\s*$', s, re.I):
        fail(name + ' does not end with </html>')
    for word in ('_trfq', '_trfd', 'wsimg.com'):
        if word in s:
            fail('%s names %s: the worker cuts the host\'s snippet by that name, so no page of the workstation may' % (name, word))
    if name != 'respond.html' and s.count(SAVE_TAG) != 1:
        fail('%s holds %d copies of %s, not one: run python3 tools/blocks/patch-pwa.py on the folder'
             % (name, s.count(SAVE_TAG), SAVE_TAG))


def files_of(folder):
    idx = read(os.path.join(folder, 'index.html'))
    m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', idx)
    if not m:
        fail('index.html has no FORMS list')
    forms = re.findall(r"\['[A-Z]+-1','[^']*','([^']+\.html)'\]", m.group(1))
    if len(forms) != 45:
        fail('expected 45 forms in index.html, found %d' % len(forms))
    if MANIFEST_LINK not in idx:
        fail('index.html does not link manifest.json as ' + MANIFEST_LINK)
    if '<script id="nbh-pwa">' not in idx:
        fail('index.html has no <script id="nbh-pwa"> part')
    out = ['index.html'] + forms
    pages = ['index.html'] + forms + (['respond.html'] if os.path.isfile(os.path.join(folder, 'respond.html')) else [])
    for p in pages:
        s = read(os.path.join(folder, p))
        check_page(p, s)
        for x in loads(s):
            if x.endswith('.html') or x in out:
                continue
            out.append(x)
    if 'respond.html' in pages:
        if 'nbh-respond.js' not in read(os.path.join(folder, 'respond.html')):
            fail('respond.html does not name nbh-respond.js')
        out.append('respond.html')
    try:
        man = json.loads(read(os.path.join(folder, 'manifest.json')))
    except (OSError, ValueError) as e:
        fail('manifest.json: ' + str(e))
    if 'manifest.json' not in out:
        out.append('manifest.json')
    # v21.67 files a page loads only when asked for (the document reader's PDF.js, the OCR engine): named in index.html as
    # <meta name="nbh-offline" content="path path ...">, so they are saved for offline use with the rest
    for m in re.finditer(r'<meta name="nbh-offline" content="([^"]*)"', idx):
        out += [x for x in m.group(1).split() if (local(x) or local_path(x)) and x not in out]
    out += [i['src'] for i in man.get('icons', []) if local(i.get('src', '')) and i['src'] not in out]
    out += [x for x in re.findall(r'<link rel="apple-touch-icon" href="([^"]+)"', idx) if local(x) and x not in out]
    missing = [f for f in out if not os.path.isfile(os.path.join(folder, f))]
    if missing:
        fail('files the workstation loads but the folder does not have: ' + ', '.join(missing))
    return out


def region(files, version):
    return (HEAD + "const VERSION = '%s';\nconst FILES = [\n" % version +
            ''.join("  '%s',\n" % f for f in files) + '];\n' + B)


def render(sw, files):
    a = sw.find(A)
    b = sw.find(B)
    if a < 0 or b < a or sw.count(A) != 1 or sw.count(B) != 1:
        fail('sw.js does not hold the two marker comments once each')
    bare = sw[:a] + sw[b + len(B):]
    version = hashlib.sha256((bare + '\n'.join(files)).encode('utf-8')).hexdigest()[:12]
    return sw[:a] + region(files, version) + sw[b + len(B):], version


def release(folder, files, version):
    """release.json's bytes: each file's length and SHA-256, as the website serves them before any host markup"""
    entries = {}
    for f in files:
        with open(os.path.join(folder, f), 'rb') as fh:
            data = fh.read()
        entries[f] = {'len': len(data), 'sha': hashlib.sha256(data).hexdigest()}
    rid = hashlib.sha256(json.dumps(entries, sort_keys=True).encode('utf-8')).hexdigest()[:12]
    doc = {'nbh': 'release', 'release': rid, 'worker': version,
           'about': 'The files of this release of the workstation, for its offline copy (sw.js). Written by tools/pwa-sw.py.',
           'files': entries}
    return (json.dumps(doc, indent=1) + '\n').encode('utf-8'), rid


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
    path = os.path.join(folder, 'sw.js')
    if not os.path.isfile(path):
        fail('no sw.js in ' + folder)
    sw = read(path)
    files = files_of(folder)
    out, version = render(sw, files)
    rel, rid = release(folder, files, version)
    rpath = os.path.join(folder, RELEASE)
    old_rel = open(rpath, 'rb').read() if os.path.isfile(rpath) else None
    if check:
        stale = []
        if out != sw:
            stale.append('sw.js')
        if old_rel != rel:
            stale.append(RELEASE)
        if stale:
            print('pwa-sw.py --check: %s in %s not current (run python3 tools/pwa-sw.py %s)'
                  % (' and '.join(stale), folder, os.path.relpath(folder, ROOT)))
            return 1
        print('pwa-sw.py --check: sw.js and release.json current, %d files, version %s, release %s' % (len(files), version, rid))
        return 0
    if out != sw:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(out)
    if old_rel != rel:
        with open(rpath, 'wb') as f:
            f.write(rel)
    print('sw.js: %d files, version %s%s; release.json: release %s%s' % (
        len(files), version, '' if out != sw else ' (unchanged)', rid, '' if old_rel != rel else ' (unchanged)'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
