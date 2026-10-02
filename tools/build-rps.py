#!/usr/bin/env python3
"""Build the Royal Palm School edition of the workstation from the Newsome Behavioral Health one.

Same forms, same code. Changed: the logo (143 places), the tab icon, the organisation name where it
is printed or shown, and the autosave keys - both editions live on one website, and a browser keeps
one localStorage per website, so without its own keys each would offer to restore the other's work.

usage: build-rps.py <NBH folder> <output folder> <lockup .webp> <favicon .png>

The lockup and favicon travel inside the previous school edition's index.html; tools/rps-assets.py
recovers them.
"""
import os, re, sys, shutil, base64
SRC, OUT, LOCKUP, FAVICON = sys.argv[1:5]
NAME = 'Royal Palm School'
shutil.rmtree(OUT, ignore_errors=True); shutil.copytree(SRC, OUT)
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
old_logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
old_fav = re.search(r'<link rel="icon" type="image/png" href="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
new_logo = 'data:image/webp;base64,' + base64.b64encode(open(LOCKUP, 'rb').read()).decode()
new_fav = 'data:image/png;base64,' + base64.b64encode(open(FAVICON, 'rb').read()).decode()

# (old, new, how many times it must be replaced across all files)
EXPECT = [
  (old_logo, new_logo, 143),
  (old_fav, new_fav, 1),
  ('alt="Newsome Behavioral Health"', f'alt="{NAME}"', 144),   # 143 logos + the packet cover's
  ('@top-left{content:"Newsome Behavioral Health"', f'@top-left{{content:"{NAME}"', 36),
  (' · Newsome Behavioral Health</title>', f' · {NAME}</title>', 36),
  ('in the Newsome Behavioral Health packet', f'in the {NAME} packet', 1),
  ('Form IDs refer to the Newsome Behavioral Health FBA/BIP form set.', f'Form IDs refer to the {NAME} FBA/BIP form set.', 1),
  ("const AUTO={key:'nbh.ws.autosave.v1',pref:'nbh.ws.autosave.on'", "const AUTO={key:'rps.ws.autosave.v1',pref:'rps.ws.autosave.on'", 1),
]
done = [0] * len(EXPECT)
for fn in sorted(os.listdir(OUT)):
    if not fn.endswith('.html'): continue
    p = os.path.join(OUT, fn); s = open(p, encoding='utf-8').read()
    for i, (a, b, _) in enumerate(EXPECT):
        n = s.count(a); done[i] += n; s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
bad = [(EXPECT[i][0][:60], done[i], EXPECT[i][2]) for i in range(len(EXPECT)) if done[i] != EXPECT[i][2]]
if bad:
    sys.exit('replacement counts differ from what was expected - the source changed; check before shipping:\n' +
             '\n'.join(f'  {a!r}: replaced {n}, expected {e}' for a, n, e in bad))

# anything still naming the practice in a way a user sees
left = []
for fn in sorted(os.listdir(OUT)):
    if fn.endswith('.html'):
        for m in re.finditer(r'.{0,40}Newsome Behavioral Health.{0,40}', open(os.path.join(OUT, fn), encoding='utf-8').read()):
            if 'shared form system' not in m.group(0): left.append((fn, m.group(0)))
if left:
    sys.exit('practice name still visible:\n' + '\n'.join(f'  {f}: {t}' for f, t in left))

# the documents that travel with it
rd = os.path.join(OUT, 'README.txt'); s = open(rd, encoding='utf-8').read()
s = s.replace('NBH FBA/BIP Workstation\n=======================',
  'FBA/BIP Workstation - Royal Palm School\n=======================================\n\n'
  'This is the Royal Palm School edition. It is the same workstation and the same 31\n'
  'forms as the Newsome Behavioral Health edition; only the logo and name differ, and\n'
  'it keeps its own autosave, so both can be used in one browser without mixing.', 1)
open(rd, 'w', encoding='utf-8').write(s)
hd = os.path.join(OUT, 'HOSTING.md'); s = open(hd, encoding='utf-8').read()
s = re.sub(r'`workstation`', '`workstation-rps`', s)
s = re.sub(r'public_html/workstation(?![-\w])', 'public_html/workstation-rps', s)
s = re.sub(r'/workstation/', '/workstation-rps/', s)
s = s.replace('# Putting the workstation on a website\n', '# Putting the workstation on a website\n\n'
  '*Royal Palm School edition.* It lives in its own folder, `workstation-rps`, beside the\n'
  'Newsome Behavioral Health one in `workstation`, with its own password; its autosave is\n'
  'kept apart from the other edition\'s. Each folder needs its own `.htaccess` (step 4).\n', 1)
open(hd, 'w', encoding='utf-8').write(s)
print('built', OUT, '-', ', '.join(f'{n}x' for n in done))
