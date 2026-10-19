#!/usr/bin/env python3
"""Build the Royal Palm School edition of the workstation from the Newsome Behavioral Health one.

Same forms, same code. Changed: the logo (2 places since v21.84: nbh-logo.js, which every form loads, and the index), the tab icon, the organisation name where it
is printed or shown, and the autosave keys - both editions live on one website, and a browser keeps
one localStorage per website, so without its own keys each would offer to restore the other's work. Since v21.43 also the
installed app's Home Screen name, manifest.json and icons (from the lockup) and its release list (release.json, the
hashes of its own files); sw.js is shared, its caches named after its folder.

usage: build-rps.py <NBH folder> <output folder> <lockup .webp> <favicon .png>

The lockup and favicon travel inside the previous school edition's index.html; tools/rps-assets.py
recovers them.
"""
import os, re, sys, shutil, base64
import importlib.util
SRC, OUT, LOCKUP, FAVICON = sys.argv[1:5]
NAME = 'Royal Palm School'
def _tool(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(os.path.dirname(os.path.abspath(__file__)), name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod
# v21.43: the practice's own offline copy must be current before the school's is made from it (sw.js's list of files and
# release.json, the hashes devices check every download against): a stale list would stop every device's updates
if _tool('pwa-sw').main(['--check', SRC]) != 0:
    sys.exit('run python3 tools/pwa-sw.py ' + SRC + ' first (after any change to a form, the shell or a file they load), then build again')
shutil.rmtree(OUT, ignore_errors=True); shutil.copytree(SRC, OUT)
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
old_logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
old_fav = re.search(r'<link rel="icon" type="image/png" href="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
new_logo = 'data:image/webp;base64,' + base64.b64encode(open(LOCKUP, 'rb').read()).decode()
new_fav = 'data:image/png;base64,' + base64.b64encode(open(FAVICON, 'rb').read()).decode()

# (old, new, how many times it must be replaced across all files)
EXPECT = [
  (old_logo, new_logo, 2),     # v21.84: once in nbh-logo.js (every form loads it; until v21.83 a copy in each of the 46 forms) and once in index.html
  (old_fav, new_fav, 1),
  ('alt="Newsome Behavioral Health"', f'alt="{NAME}"', 171),   # the masthead and print-head images of the 47 forms (several print more than one head; IA-1 gained a WEFA sheet head in v21.41 and a Send-outs sheet head in v21.64; MS-1 a rater brief's head in v23.08) + the index + the packet cover
  ('@top-left{content:"Newsome Behavioral Health"', f'@top-left{{content:"{NAME}"', 48),
  (' · Newsome Behavioral Health</title>', f' · {NAME}</title>', 49),   # the 47 forms, index.html and respond.html (v21.39)
  ('in the Newsome Behavioral Health packet', f'in the {NAME} packet', 1),
  ('Form IDs refer to the Newsome Behavioral Health FBA/BIP form set.', f'Form IDs refer to the {NAME} FBA/BIP form set.', 1),
  ("const DRV_ED='nbh';", "const DRV_ED='rps';", 1),
  # v22.07 Rewrite with Claude is off in the school edition (the user's decision): the writing help shows no Rewrite tab and
  # asks nothing of a website; only Check wording (on the device) and the iPad's own Writing Tools remain
  ('{"relay":"https://newsomebh.com/ai"}', '{"relay":"","rewrite":false}', 1),
  ("  if(DRV_ED!=='rps')rows.push(['Rewrite with Claude (the writing help, only after a passcode)','The text in its preview, with the student\\u2019s name and ID already replaced, through the practice\\u2019s relay to Anthropic','The relay keeps no text']);\n", '', 1),   # v22.07 and Help's data table has no Rewrite row (the line is only for the practice edition)   # v22.00 each edition its own Drive settings and folder (review F501)
  ("const AUTO={key:'nbh.ws.autosave.v1',pref:'nbh.ws.autosave.on'", "const AUTO={key:'rps.ws.autosave.v1',pref:'rps.ws.autosave.on'", 1),
  # v21.43: the name under the icon of the installed app (index.html's head), the same as the manifest's short_name below
  ('<meta name="apple-mobile-web-app-title" content="NBH Workstation">', '<meta name="apple-mobile-web-app-title" content="RPS Workstation">', 1),
]
done = [0] * len(EXPECT)
# v21.84 the scripts every form loads from one file beside it (the letterhead, the writing help, ...) are part of the pages
_sj = importlib.util.spec_from_file_location('shared_js', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blocks', 'shared_js.py'))
_SJ = importlib.util.module_from_spec(_sj); _sj.loader.exec_module(_SJ)
SHARED_JS = _SJ.FILES   # tools/blocks/shared_js.py
for f in SHARED_JS:
    if not os.path.isfile(os.path.join(OUT, f)):
        sys.exit(f'{f} is not in {SRC}: every form loads it')
for fn in sorted(os.listdir(OUT)):
    if not (fn.endswith('.html') or fn in SHARED_JS): continue
    p = os.path.join(OUT, fn); s = open(p, encoding='utf-8').read()
    for i, (a, b, _) in enumerate(EXPECT):
        n = s.count(a); done[i] += n; s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
# v22.07 the forms' guide paragraph on the writing help loses its Rewrite with Claude sentences (40 forms carry it; RS-1 since v22.28)
RW_RE = re.compile(r' <(b|strong)>Rewrite with Claude</\1> works only.*?agency&rsquo;s approval\.', re.S)
rw_n = 0
for fn in sorted(os.listdir(OUT)):
    if not fn.endswith('.html'): continue
    p = os.path.join(OUT, fn); s = open(p, encoding='utf-8').read()
    s, k = RW_RE.subn('', s); rw_n += k
    if k: open(p, 'w', encoding='utf-8').write(s)
if rw_n != 40:
    sys.exit(f'the Rewrite with Claude sentences in the forms\' guide: removed {rw_n}, expected 40 - the source changed; check before shipping')
left_rw = [fn for fn in sorted(os.listdir(OUT)) if fn.endswith('.html') and 'Rewrite with Claude' in open(os.path.join(OUT, fn), encoding='utf-8').read()]
if left_rw:
    sys.exit('Rewrite with Claude still named in the school edition: ' + ', '.join(left_rw))
bad = [(EXPECT[i][0][:60], done[i], EXPECT[i][2]) for i in range(len(EXPECT)) if done[i] != EXPECT[i][2]]
if bad:
    sys.exit('replacement counts differ from what was expected - the source changed; check before shipping:\n' +
             '\n'.join(f'  {a!r}: replaced {n}, expected {e}' for a, n, e in bad))

# anything still naming the practice in a way a user sees
left = []
for fn in sorted(os.listdir(OUT)):
    if fn.endswith('.html') or fn in SHARED_JS:
        for m in re.finditer(r'.{0,40}Newsome Behavioral Health.{0,40}', open(os.path.join(OUT, fn), encoding='utf-8').read()):
            if 'shared form system' not in m.group(0): left.append((fn, m.group(0)))
if left:
    sys.exit('practice name still visible:\n' + '\n'.join(f'  {f}: {t}' for f, t in left))

# v21.43: the installable app. The copied manifest.json and icons are the practice's: write the school's, from the same
# lockup the pages now carry (its mark, left of the words) and from the school edition's index.html (name, colours).
# sw.js is the same file in both editions (its caches are named after the folder it serves); release.json, the release
# list, is each edition's own (the school's pages and icons differ), so it is written here, after every page is final.
_tool('pwa-assets').write(OUT, lockup=LOCKUP, badge=True)   # v21.44 the badge icon (chosen for the school edition)
if 'Newsome Behavioral Health' in open(os.path.join(OUT, 'manifest.json'), encoding='utf-8').read():
    sys.exit('the school edition\'s manifest.json still names the practice')
_pwa = _tool('pwa-sw')
if _pwa.main([OUT]) != 0 or _pwa.main(['--check', OUT]) != 0:
    sys.exit('the school edition\'s offline copy could not be listed')
if open(os.path.join(OUT, 'sw.js'), 'rb').read() != open(os.path.join(SRC, 'sw.js'), 'rb').read():
    sys.exit('sw.js would differ between the editions (the school edition loads other files): run python3 tools/pwa-sw.py ' + SRC + ' and build again')

# the documents that travel with it
rd = os.path.join(OUT, 'README.txt'); s = open(rd, encoding='utf-8').read()
s = s.replace('NBH FBA/BIP Workstation\n=======================',
  'FBA/BIP Workstation - Royal Palm School\n=======================================\n\n'
  'This is the Royal Palm School edition. It is the same workstation and the same 47\n'
  'forms as the Newsome Behavioral Health edition; only the logo and name differ, and\n'
  'it keeps its own autosave, so both can be used in one browser without mixing.', 1)
# v22.11: Rewrite with Claude is off in this edition (v22.07); its README says nothing of it
for a, b in [('checks the wording on this device and suggests observable words (Check\n    wording; nothing is sent). In the forms opened from the website it can\n    also rewrite the text through the practice\'s relay, once a single-use\n    passcode from the BCBA unlocks the tab (Rewrite with Claude; the\n    student\'s name and ID are replaced before anything is sent, and the\n    panel shows exactly what will be). On an iPad with Apple Intelligence,\n    Writing Tools work in every box as well. The relay is set up once on the\n    website: see HOSTING.md.\n',
              'checks the wording on this device and suggests observable words (Check\n    wording; nothing is sent). On an iPad with Apple Intelligence, Writing\n    Tools work in every box as well.\n'),
             (' The writing help\'s Rewrite with Claude works only from\nthe website, through its relay (public_html/ai, uploaded once from\nnbh-relay-upload.zip; HOSTING.md says how).\n', '\n')]:
    if s.count(a) != 1: raise SystemExit('README.txt: the Rewrite with Claude text was not found once: ' + a[:60])
    s = s.replace(a, b)
open(rd, 'w', encoding='utf-8').write(s)
hd = os.path.join(OUT, 'HOSTING.md'); s = open(hd, encoding='utf-8').read()
s = re.sub(r'`workstation`', '`workstation-rps`', s)
s = re.sub(r'public_html/workstation(?![-\w])', 'public_html/workstation-rps', s)
s = re.sub(r'/workstation/', '/workstation-rps/', s)
s = s.replace('# Putting the workstation on a website\n', '# Putting the workstation on a website\n\n'
  '*Royal Palm School edition.* It lives in its own folder, `workstation-rps`, beside the\n'
  'Newsome Behavioral Health one in `workstation`, with its own password; its autosave is\n'
  'kept apart from the other edition\'s, and so (since v22.00) are its Google Drive setting, its sign-in and its\n'
  'Drive folder. Each folder needs its own `.htaccess` (step 4).\n', 1)
open(hd, 'w', encoding='utf-8').write(s)
print('built', OUT, '-', ', '.join(f'{n}x' for n in done))
