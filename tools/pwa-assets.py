#!/usr/bin/env python3
"""v21.43 The installable workstation: manifest.json and the icons beside index.html.

The icons are the edition's own mark, taken from a lockup that already exists: the logo image index.html carries
(<img id="logo">), or a lockup file (the school edition's tools/rps-assets/rps-lockup.webp). The mark is the picture
left of the words, found by the first clear gap between them and trimmed of its white margin, then set on a white
square (the shell's heading is white). Four files:
  icon-192.png, icon-512.png    the mark within the middle 84 percent (purpose "any")
  icon-512-maskable.png         the mark within the circle, 80 percent across, that a launcher may crop to ("maskable")
  apple-touch-icon.png          180 x 180, opaque, for the iPad and iPhone Home Screen (iOS rounds the corners itself)
manifest.json names the edition from index.html's title ("FBA and BIP Workstation · <organisation>"; the short name is
the organisation's initials and "Workstation", as the apple-mobile-web-app-title tag in index.html says), opens ./ in a
window of its own (display standalone, start_url and scope ./) and takes its colours from the shell: theme_color the
white heading, background_color the page (--paper). It has no "id": two editions on one website then stay two apps.
The output is deterministic: the same lockup and index.html give the same bytes.

usage: python3 tools/pwa-assets.py <edition folder> [--lockup FILE] [--check]
  --lockup FILE  take the mark from this lockup instead of the edition's index.html
  --check        change nothing; exit 1 unless the folder's manifest and icons are the ones this would write
"""
import base64, io, json, math, os, re, sys

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit('pwa-assets.py needs Pillow (pip install pillow)')

ICONS = [  # file, size, fraction of the square the mark may fill, maskable
    ('icon-192.png', 192, 0.84, False),
    ('icon-512.png', 512, 0.84, False),
    ('icon-512-maskable.png', 512, 0.76, True),
    ('apple-touch-icon.png', 180, 0.78, False),
]


def fail(msg):
    sys.exit('pwa-assets.py: ' + msg)


def shell_facts(folder):
    """The edition's name and colours, read from its index.html."""
    p = os.path.join(folder, 'index.html')
    if not os.path.isfile(p):
        fail('no index.html in ' + folder)
    s = open(p, encoding='utf-8').read()
    t = re.search(r'<title>([^<]+)</title>', s)
    if not t or ' · ' not in t.group(1):
        fail('index.html has no title of the form "FBA and BIP Workstation · <organisation>"')
    title = t.group(1).strip()
    org = title.split(' · ')[-1].strip()
    short = ''.join(w[0] for w in org.split() if w[:1].isalpha()).upper() + ' Workstation'
    paper = re.search(r'--paper:\s*(#[0-9a-fA-F]{6})', s)
    head = re.search(r'header\.top\{background:(#[0-9a-fA-F]{3,6})', s)
    if not paper or not head:
        fail('index.html no longer defines --paper and the heading background where this looks for them')
    theme = head.group(1).lower()
    if len(theme) == 4:
        theme = '#' + ''.join(c * 2 for c in theme[1:])
    logo = re.search(r'<img id="logo" alt="[^"]*" src="data:image/[a-z]+;base64,([A-Za-z0-9+/=]+)"', s)
    return {'title': title, 'org': org, 'short': short, 'paper': paper.group(1).lower(), 'theme': theme,
            'logo': base64.b64decode(logo.group(1)) if logo else None, 'html': s}


def find_mark(img):
    """The picture at the left of a lockup: from the first coloured column to the first clear gap, trimmed."""
    rgb = img.convert('RGB')
    w, h = rgb.size
    r, g, b = rgb.split()
    ink = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v < 235 else 0)
    used = [ink.crop((x, 0, x + 1, h)).getbbox() is not None for x in range(w)]
    if not any(used):
        fail('the lockup is blank')
    start = used.index(True)
    gap, end, run = max(12, w // 80), w, 0
    for x in range(start, w):
        if used[x]:
            run = 0
            continue
        run += 1
        if run >= gap:
            end = x - run + 1
            break
    box = ink.crop((start, 0, end, h)).getbbox()
    mark = rgb.crop((start + box[0], box[1], start + box[2], box[3]))
    if mark.size[0] < 48 or mark.size[1] < 48:
        fail('the mark found in the lockup is only %dx%d pixels' % mark.size)
    return mark


def icon(mark, size, frac, maskable):
    mw, mh = mark.size
    scale = frac * size / (math.hypot(mw, mh) if maskable else max(mw, mh))
    tw, th = max(1, round(mw * scale)), max(1, round(mh * scale))
    canvas = Image.new('RGB', (size, size), (255, 255, 255))
    canvas.paste(mark.resize((tw, th), Image.LANCZOS), ((size - tw) // 2, (size - th) // 2))
    out = io.BytesIO()
    canvas.save(out, 'PNG', optimize=True)
    return out.getvalue()


def manifest(f):
    m = {
        'name': f['title'],
        'short_name': f['short'],
        'description': 'The FBA and BIP forms of ' + f['org'] + ', on this device. Nothing typed is sent to the '
                       'website; cases are saved as files.',
        'lang': 'en',
        'dir': 'ltr',
        'start_url': './',
        'scope': './',
        'display': 'standalone',
        'orientation': 'any',
        'theme_color': f['theme'],
        'background_color': f['paper'],
        'categories': ['education', 'medical', 'productivity'],
        'icons': [
            {'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icon-512-maskable.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    return (json.dumps(m, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def build(folder, lockup=None):
    """{file name: bytes} for the folder."""
    f = shell_facts(folder)
    if lockup:
        img = Image.open(lockup)
    elif f['logo']:
        img = Image.open(io.BytesIO(f['logo']))
    else:
        fail('index.html carries no <img id="logo"> to take the mark from; pass --lockup')
    mark = find_mark(img)
    out = {name: icon(mark, size, frac, mask) for name, size, frac, mask in ICONS}
    out['manifest.json'] = manifest(f)
    want = '<meta name="apple-mobile-web-app-title" content="%s">' % f['short']
    if want not in f['html']:
        fail('index.html should carry ' + want + ' (the Home Screen name, the same as the manifest\'s short_name)')
    return out


def write(folder, lockup=None):
    files = build(folder, lockup)
    for name, data in files.items():
        with open(os.path.join(folder, name), 'wb') as fh:
            fh.write(data)
    return sorted(files)


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__)
        return 0
    folder, lockup, check = None, None, False
    it = iter(argv)
    for a in it:
        if a == '--lockup':
            lockup = next(it, None)
            if not lockup or not os.path.isfile(lockup):
                fail('--lockup needs an image file')
        elif a == '--check':
            check = True
        elif a.startswith('-'):
            fail('unknown option ' + a)
        elif folder is None:
            folder = a
        else:
            fail('one edition folder at a time')
    if not folder or not os.path.isdir(folder):
        fail('name the edition folder, e.g. NBH-Workstation')
    if check:
        stale = [n for n, d in build(folder, lockup).items()
                 if not os.path.isfile(os.path.join(folder, n)) or open(os.path.join(folder, n), 'rb').read() != d]
        if stale:
            print('pwa-assets.py --check: not current in %s: %s' % (folder, ', '.join(sorted(stale))))
            return 1
        print('pwa-assets.py --check: %s current' % folder)
        return 0
    print('wrote', ', '.join(write(folder, lockup)), 'in', folder)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
