#!/usr/bin/env python3
"""v21.43 Write into sw.js the list of files the offline copy saves, and the copy's VERSION.

The list is every file the workstation loads from its own folder, in this order: index.html; the 44 forms its FORMS
list names; the scripts (and any stylesheets) a page loads by <script src> or <link rel="stylesheet"> from the folder
(the picture library nbh-pictos.js, the respondent pages' nbh-respond.js); the scripts the shell loads when asked (loadScript: pdf-lib.min.js and
nbh-pdf-tools.js, for Finish PDF); respond.html; manifest.json, the icons it names and the apple-touch-icon index.html
names. Every one must be in the folder. VERSION is a hash of sw.js with that part left out and of the list, so any change
to the worker's code or to the list makes a new version (whose caches are new, the old ones deleted when it takes over),
and a change to a form alone does not (the update check finds that).

It writes only the part of sw.js between the two marker comments. Run it after adding, renaming or removing a form or
a file a page loads, and after changing sw.js; build-rps.py checks the school edition's copy with --check.

usage: python3 tools/pwa-sw.py [--check] [FOLDER]      FOLDER defaults to NBH-Workstation
  --check   change nothing; exit 1 unless sw.js already carries this list and VERSION"""
import hashlib, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
A = '/* ---- written by tools/pwa-sw.py'
B = '/* ---- end of the part tools/pwa-sw.py writes ---- */'
HEAD = ('/* ---- written by tools/pwa-sw.py from index.html and the files it loads; run it again rather than editing '
        'this part ---- */\n')


def fail(msg):
    sys.exit('pwa-sw.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def local(ref):
    """a file name in this folder (not an address elsewhere, not the pattern a script writes to find a tag)"""
    return bool(re.match(r'^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]+$', ref or ''))


def files_of(folder):
    idx = read(os.path.join(folder, 'index.html'))
    m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', idx)
    if not m:
        fail('index.html has no FORMS list')
    forms = re.findall(r"\['[A-Z]+-1','[^']*','([^']+\.html)'\]", m.group(1))
    if len(forms) != 44:
        fail('expected 44 forms in index.html, found %d' % len(forms))
    out = ['index.html'] + forms
    pages = ['index.html'] + forms + (['respond.html'] if os.path.isfile(os.path.join(folder, 'respond.html')) else [])
    scripts = []
    for p in pages:
        s = read(os.path.join(folder, p))
        scripts += [x for x in re.findall(r'<script src="([^"]+)"', s) if local(x)]
        scripts += [x for x in re.findall(r'<link rel="stylesheet" href="([^"]+)"', s) if local(x)]
    scripts += re.findall(r"loadScript\('([^']+\.js)'\)", idx)
    for x in scripts:
        if x not in out:
            out.append(x)
    if 'respond.html' in pages:
        out.append('respond.html')
    if not re.search(r'<link rel="manifest" href="manifest\.json">', idx):
        fail('index.html does not link manifest.json')
    try:
        man = json.loads(read(os.path.join(folder, 'manifest.json')))
    except (OSError, ValueError) as e:
        fail('manifest.json: ' + str(e))
    out.append('manifest.json')
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
    if check:
        if out != sw:
            print('pwa-sw.py --check: sw.js in %s is not current (run python3 tools/pwa-sw.py %s)' % (folder, os.path.relpath(folder, ROOT)))
            return 1
        print('pwa-sw.py --check: sw.js current, %d files, version %s' % (len(files), version))
        return 0
    if out != sw:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(out)
    print('sw.js: %d files, version %s%s' % (len(files), version, '' if out != sw else ' (unchanged)'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
