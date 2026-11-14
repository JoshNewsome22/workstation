#!/usr/bin/env python3
"""v26.28 Build a customer's copy of the workstation: their name, their logo, their own settings on a device, and a licence
required. It is the school edition's build (tools/build-rps.py) with the customer's values, so the copy is made the same
way and checked the same way.

usage: python3 tools/build-customer.py CUSTOMER.json OUT_FOLDER [--one-file FILE.html]

CUSTOMER.json (only "name" and "tag" are required):
  {
   "name":    "Sample County Schools",        the name on every form's letterhead, in the title and under Help; the installed
                                              app is named by its initials ("SCS Workstation"), as tools/pwa-assets.py does
   "tag":     "scs",                          2 to 12 lowercase letters or digits: the copy's settings, autosave and
                                              Drive folder are kept under it, apart from any other edition on a device
   "folder":  "workstation",                  the folder name the hosting guide uses (default: workstation)
   "lockup":  "logo.png",                     the logo: a mark on the left, the words on the right, on white (PNG or WebP);
                                              without one, a plain logo is drawn from the name
   "favicon": "icon.png",                     a small square icon (PNG); without one, it is cut from the logo
   "badge":   false,                          true: the app icon on a navy square with a gold ring, as the school edition's
   "licence": {"required": true,              true: the copy asks for a licence (see SETUP.md, v26.27)
               "keys": [{"x": "...", "y": "..."}],   the publisher's public key or keys, from the licence issuer
               "contact": "name@example.org"}        who to write to for a licence
  }
Paths in the file are relative to the file. OUT_FOLDER is replaced.

What the copy is: the 49 forms and the start page with the customer's name and logo; its own autosave, settings and Drive
folder (the tag); the writing help's Rewrite with Claude off (it goes through the practice's relay); the licence block
set; the examples that name the practice's website replaced; SETUP.md (the publisher's release notes) left out; the
procedure videos the same files as every edition's (linked, not copied, so a copy takes about 130 MB of disk here).
Nothing in the copy sends anything to the publisher: questionnaire links, the reply box and the staff phone page use
the website the copy is opened from, which is the customer's own.

The signing key is never needed here: only the public key goes into the copy.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)


def fail(msg):
    sys.exit('build-customer.py: ' + msg)


def initials(name):
    """The first letter of each word, as tools/pwa-assets.py names the installed app."""
    return ''.join(w[0] for w in name.split() if w[:1].isalpha()).upper() or 'WS'


def draw_lockup(name, out_png):
    """A plain logo for a customer that sends none: the initials in a dark rounded square, the name beside it, on white."""
    from PIL import Image, ImageDraw, ImageFont
    def font(size, bold=True):
        for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
                  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
            if os.path.isfile(f): return ImageFont.truetype(f, size)
        return ImageFont.load_default()
    H, M = 355, 40; ink = (22, 48, 66)
    words = name.split(); lines = [name]
    if len(name) > 18 and len(words) > 1:   # two lines, split nearest the middle
        best = min(range(1, len(words)), key=lambda i: abs(len(' '.join(words[:i])) - len(' '.join(words[i:]))))
        lines = [' '.join(words[:best]), ' '.join(words[best:])]
    probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    size = 78
    while size > 30 and max(probe.textlength(l, font=font(size)) for l in lines) > 1100: size -= 4
    f = font(size); tw = int(max(probe.textlength(l, font=f) for l in lines))
    box = H - 2 * M; gap = 70
    im = Image.new('RGB', (M + box + gap + tw + M, H), 'white'); d = ImageDraw.Draw(im)
    d.rounded_rectangle((M, M, M + box, M + box), radius=44, fill=ink)
    ini = initials(name)[:4]; fi = font(150 if len(ini) <= 2 else 110 if len(ini) == 3 else 84)
    bb = d.textbbox((0, 0), ini, font=fi); d.text((M + box / 2 - (bb[0] + bb[2]) / 2, M + box / 2 - (bb[1] + bb[3]) / 2), ini, font=fi, fill='white')
    lh = int(size * 1.25); y = (H - lh * len(lines)) // 2
    for l in lines:
        d.text((M + box + gap, y), l, font=f, fill=ink); y += lh
    im.save(out_png)
    return im.crop((M, M, M + box, M + box))


def main(argv):
    if len(argv) < 2: fail('usage: build-customer.py CUSTOMER.json OUT_FOLDER [--one-file FILE.html]')
    conf_path, out = os.path.abspath(argv[0]), os.path.abspath(argv[1])
    one = os.path.abspath(argv[argv.index('--one-file') + 1]) if '--one-file' in argv else None
    try: c = json.load(open(conf_path, encoding='utf-8'))
    except Exception as e: fail('cannot read %s: %s' % (conf_path, e))
    name, tag = str(c.get('name') or '').strip(), str(c.get('tag') or '').strip()
    if not name or not tag: fail('CUSTOMER.json needs "name" and "tag"')
    for bad in (os.path.join(ROOT, 'NBH-Workstation'), os.path.join(ROOT, 'RPS-Workstation'), ROOT, HERE):
        if os.path.normpath(out) == os.path.normpath(bad): fail('OUT_FOLDER must not be ' + bad)
    lic = c.get('licence') or {}
    lic = {'required': lic.get('required', True) is True, 'keys': [{'x': k['x'], 'y': k['y']} for k in (lic.get('keys') or []) if isinstance(k, dict) and k.get('x') and k.get('y')], 'contact': str(lic.get('contact') or '')}
    for k in lic['keys']:
        if not all(re.fullmatch(r'[A-Za-z0-9_-]{43}', k[v]) for v in ('x', 'y')): fail('a licence key in "keys" is not a public key from the issuer (x and y, 43 characters each)')
    if any(isinstance(k, dict) and 'd' in k for k in ((c.get('licence') or {}).get('keys') or [])):
        fail('"keys" holds a private key (a "d" value). Only the public key (x and y) goes into a copy. Take the private key out of the file.')
    work = out.rstrip(os.sep) + '.assets'; os.makedirs(work, exist_ok=True)
    base = os.path.dirname(conf_path)
    from PIL import Image
    if c.get('lockup'):
        lockup = os.path.join(base, c['lockup'])
        if not os.path.isfile(lockup): fail('the logo file is not there: ' + lockup)
        im = Image.open(lockup).convert('RGB'); lk = os.path.join(work, 'lockup.webp'); im.save(lk, 'WEBP', quality=92, method=6); mark = None
    else:
        png = os.path.join(work, 'lockup.png'); mark = draw_lockup(name, png)
        lk = os.path.join(work, 'lockup.webp'); Image.open(png).save(lk, 'WEBP', quality=92, method=6)
    fav = os.path.join(work, 'favicon.png')
    if c.get('favicon'):
        f = os.path.join(base, c['favicon'])
        if not os.path.isfile(f): fail('the icon file is not there: ' + f)
        Image.open(f).convert('RGB').resize((64, 64), Image.LANCZOS).save(fav)
    elif mark is not None:
        mark.resize((64, 64), Image.LANCZOS).save(fav)
    else:   # cut from the customer's logo: the square at its left
        im = Image.open(lk); s = min(im.size); im.crop((0, 0, s, s)).resize((64, 64), Image.LANCZOS).save(fav)
    ed = {'name': name, 'tag': tag, 'short': initials(name) + ' Workstation', 'folder': str(c.get('folder') or 'workstation'),
          'licence': lic, 'link_videos': True, 'leave_out': ['SETUP.md'], 'badge': c.get('badge') is True}
    env = dict(os.environ, WS_EDITION=json.dumps(ed))
    r = subprocess.run([sys.executable, os.path.join(HERE, 'build-rps.py'), os.path.join(ROOT, 'NBH-Workstation'), out, lk, fav], env=env, cwd=ROOT)
    if r.returncode != 0: fail('the copy was not built (the message above says why)')
    if one:
        r = subprocess.run([sys.executable, os.path.join(HERE, 'build-single.py'), out, one], cwd=ROOT)
        if r.returncode != 0: fail('the one-file edition was not built')
    print('customer copy: %s | name "%s", tag %s, app name "%s" | licence %s, %d public key(s)%s'
          % (out, name, tag, ed['short'], 'required' if lic['required'] else 'not required', len(lic['keys']), '' if lic['keys'] or not lic['required'] else ' - WITHOUT A KEY NO LICENCE CAN BE ENTERED IN THIS COPY'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
