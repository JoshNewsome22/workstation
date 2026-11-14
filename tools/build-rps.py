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
import os, re, sys, shutil, base64, json
import importlib.util
SRC, OUT, LOCKUP, FAVICON = sys.argv[1:5]
# v26.28 the same build makes a customer's copy: tools/build-customer.py passes the edition in the WS_EDITION environment
# variable (JSON: name, tag, short, folder, licence, link_videos, leave_out, badge). With none, this is the school edition.
CONF = json.loads(os.environ.get('WS_EDITION') or '{}')
CUSTOMER = bool(CONF)
NAME = CONF.get('name', 'Royal Palm School').replace("'", '\u2019')   # a customer's name goes into scripts too: its apostrophe is the typographic one
TAG = CONF.get('tag', 'rps')                      # the edition's tag: its settings, autosave and Drive folder are kept under it
SHORT = CONF.get('short', 'RPS Workstation')      # the name under the installed app's icon
FOLDER = CONF.get('folder', 'workstation-rps')    # the folder HOSTING.md names
LIC_SHIPPED = '<script type="application/json" id="ws-licence">{"required":false,"keys":[],"contact":""}</script>'
if CUSTOMER:
    if not re.fullmatch(r'[a-z][a-z0-9]{1,11}', TAG) or TAG in ('nbh', 'rps'):
        sys.exit('the edition tag must be 2 to 12 lowercase letters or digits, and not nbh or rps')
    if not NAME.strip() or re.search(r'[<>"&\\{}]', NAME) or re.search(r'[<>"&\\{}]', SHORT):
        sys.exit('the edition name and short name must not hold < > " & \\ { or }')
def _tool(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(os.path.dirname(os.path.abspath(__file__)), name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod
# v21.43: the practice's own offline copy must be current before the school's is made from it (sw.js's list of files and
# release.json, the hashes devices check every download against): a stale list would stop every device's updates
if _tool('pwa-sw').main(['--check', SRC]) != 0:
    sys.exit('run python3 tools/pwa-sw.py ' + SRC + ' first (after any change to a form, the shell or a file they load), then build again')
def _cp(a, b):
    # a customer's copy on a small build machine: the procedure videos (about 775 MB, the same bytes in every edition) are
    # linked, not copied; no step here writes to them
    if CONF.get('link_videos') and os.path.basename(a).startswith('nbh-td1-video-'):
        try:
            os.link(a, b); return b
        except OSError:
            pass
    return shutil.copy2(a, b)
shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(SRC, OUT, copy_function=_cp, ignore=shutil.ignore_patterns(*CONF.get('leave_out', [])) if CONF.get('leave_out') else None)
idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
old_logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
old_fav = re.search(r'<link rel="icon" type="image/png" href="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
new_logo = 'data:image/webp;base64,' + base64.b64encode(open(LOCKUP, 'rb').read()).decode()
new_fav = 'data:image/png;base64,' + base64.b64encode(open(FAVICON, 'rb').read()).decode()

# (old, new, how many times it must be replaced across all files)
EXPECT = [
  (old_logo, new_logo, 2),     # v21.84: once in nbh-logo.js (every form loads it; until v21.83 a copy in each of the 46 forms) and once in index.html
  (old_fav, new_fav, 1),
  ('alt="Newsome Behavioral Health"', f'alt="{NAME}"', 177),   # the masthead and print-head images of the 49 forms (ME-1 added two in v25.78; FD-1 two in v25.66; IC-1's family copy and school file one more in v25.68) (several print more than one head; IA-1 gained a WEFA sheet head in v21.41 and a Send-outs sheet head in v21.64; MS-1 a rater brief's head in v23.08) + the index + the packet cover
  ('@top-left{content:"Newsome Behavioral Health"', f'@top-left{{content:"{NAME}"', 50),   # v25.66 FD-1 is the 48th form; v25.78 ME-1 the 49th
  (' · Newsome Behavioral Health</title>', f' · {NAME}</title>', 51),   # the 49 forms, index.html and respond.html (v21.39)
  ('in the Newsome Behavioral Health packet', f'in the {NAME} packet', 1),
  ('Form IDs refer to the Newsome Behavioral Health FBA/BIP form set.', f'Form IDs refer to the {NAME} FBA/BIP form set.', 1),
  ("const DRV_ED='nbh';", f"const DRV_ED='{TAG}';", 1),
  # v22.07 Rewrite with Claude is off in the school edition (the user's decision): the writing help shows no Rewrite tab and
  # asks nothing of a website; only Check wording (on the device) and the iPad's own Writing Tools remain
  ('{"relay":"https://newsomebh.com/ai"}', '{"relay":"","rewrite":false}', 1),
  ("  if(DRV_ED!=='rps')rows.push(['Rewrite with Claude (the writing help, only after a passcode)','The text in its preview, with the student\\u2019s name and ID already replaced, through the practice\\u2019s relay to Anthropic','The relay keeps no text']);\n", '', 1),   # v22.07 and Help's data table has no Rewrite row (the line is only for the practice edition)   # v22.00 each edition its own Drive settings and folder (review F501)
  ("const AUTO={key:'nbh.ws.autosave.v1',pref:'nbh.ws.autosave.on'", f"const AUTO={{key:'{TAG}.ws.autosave.v1',pref:'{TAG}.ws.autosave.on'", 1),
  # v21.43: the name under the icon of the installed app (index.html's head), the same as the manifest's short_name below
  ('<meta name="apple-mobile-web-app-title" content="NBH Workstation">', f'<meta name="apple-mobile-web-app-title" content="{SHORT}">', 1),
]
if CUSTOMER:
    EXPECT += [
      # the data map's row on the writing-help relay is for the practice's edition only (the relay is off here, as in the school's)
      ("if(DRV_ED!=='rps')site.push(", f"if(DRV_ED!=='{TAG}')site.push(", 1),
      # the licence: required in a customer's copy, checked against the publisher's public key or keys (nbh-shell-licence.js)
      (LIC_SHIPPED, '<script type="application/json" id="ws-licence">' + json.dumps(CONF.get('licence') or {'required': True, 'keys': [], 'contact': ''}).replace('<', '\\u003c') + '</script>', 1),
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
if CUSTOMER:
    # v26.28 examples in the pages that name the practice's website (placeholders of address boxes, one line of Help) name a
    # neutral one, and the calendar file's product name is the edition's; sw.js is the same file in every edition and is left
    # The forms' examples (placeholders, a default, the simulated students' school, one line of guidance) name the school the
    # forms were first written for: they name the customer instead. Five mentions are SOURCES, not examples, and stay as
    # they are: Form ABC-1's coded sheet and Form SM-1's interlocking-schedule session sheet come from that school's own
    # unpublished material, and the forms say so.
    KEEP = ['the Royal Palm ABC coded sheet', 'The starting point was the Royal Palm form.', '(Royal Palm School manual, pp. 64&ndash;70)',
            'Royal Palm School. (n.d.). <em>Self-monitoring with interlocking schedule of reinforcement</em>', 'The Royal Palm self-monitoring session sheet']
    swaps = [('https://newsomebh.com', 'https://your-website.example'), ('RPS Workstation', SHORT), ('NBH Workstation', SHORT), ('Royal Palm School', NAME)]
    ex_n = 0; kept = [0] * len(KEEP)
    for fn in sorted(os.listdir(OUT)):
        if not (fn.endswith('.html') or fn.endswith('.js')) or fn == 'sw.js' or fn.startswith('nbh-td1-video-'): continue
        p = os.path.join(OUT, fn); s = open(p, encoding='utf-8').read(); t = s
        for i, k in enumerate(KEEP):
            kept[i] += t.count(k); t = t.replace(k, '@@WS-KEEP-%d@@' % i)
        for a, b in swaps:
            ex_n += t.count(a); t = t.replace(a, b)
        for i, k in enumerate(KEEP):
            t = t.replace('@@WS-KEEP-%d@@' % i, k)
        if t != s: open(p, 'w', encoding='utf-8').write(t)
    if ex_n < 20:
        sys.exit(f'the examples naming the practice\'s website or the first school: replaced {ex_n}, expected at least 20 - the source changed; check before shipping')
    if kept != [1] * len(KEEP):
        sys.exit('the five source mentions that stay as they are were not each found once: ' + ', '.join(f'{KEEP[i][:30]}... {kept[i]}x' for i in range(len(KEEP)) if kept[i] != 1))
    still = []
    for fn in sorted(os.listdir(OUT)):
        if (fn.endswith('.html') or fn.endswith('.js')) and fn != 'sw.js' and not fn.startswith('nbh-td1-video-'):
            t = open(os.path.join(OUT, fn), encoding='utf-8').read()
            for k in KEEP: t = t.replace(k, '')
            for m in re.finditer(r'.{0,40}(?:newsomebh\.com|Royal Palm|workstation-rps|rps\.ws\.|RPS Workstation|NBH Workstation).{0,40}', t):
                still.append((fn, m.group(0)))
    if still:
        sys.exit('the practice\'s website or the school edition is still named in the customer\'s copy:\n' + '\n'.join(f'  {f}: {t}' for f, t in still[:20]))
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
_tool('pwa-assets').write(OUT, lockup=LOCKUP, badge=CONF.get('badge', True) if CUSTOMER else True)   # v21.44 the badge icon (chosen for the school edition)
if 'Newsome Behavioral Health' in open(os.path.join(OUT, 'manifest.json'), encoding='utf-8').read():
    sys.exit('the school edition\'s manifest.json still names the practice')
_pwa = _tool('pwa-sw')
if _pwa.main([OUT]) != 0 or _pwa.main(['--check', OUT]) != 0:
    sys.exit('the school edition\'s offline copy could not be listed')
if open(os.path.join(OUT, 'sw.js'), 'rb').read() != open(os.path.join(SRC, 'sw.js'), 'rb').read():
    sys.exit('sw.js would differ between the editions (the school edition loads other files): run python3 tools/pwa-sw.py ' + SRC + ' and build again')

# the documents that travel with it
rd = os.path.join(OUT, 'README.txt'); s = open(rd, encoding='utf-8').read()
_head = 'FBA/BIP Workstation - ' + NAME
s = s.replace('NBH FBA/BIP Workstation\n=======================',
  _head + '\n' + '=' * len(_head) + '\n\n' +
  (f'This is the {NAME} edition of the workstation.' if CUSTOMER else
  'This is the Royal Palm School edition. It is the same workstation and the same 49\n'
  'forms as the Newsome Behavioral Health edition; only the logo and name differ, and\n'
  'it keeps its own autosave, so both can be used in one browser without mixing.'), 1)
# v22.11: Rewrite with Claude is off in this edition (v22.07); its README says nothing of it
for a, b in [('checks the wording on this device and suggests observable words (Check\n    wording; nothing is sent). In the forms opened from the website it can\n    also rewrite the text through the practice\'s relay, once a single-use\n    passcode from the BCBA unlocks the tab (Rewrite with Claude; the\n    student\'s name and ID are replaced before anything is sent, and the\n    panel shows exactly what will be). On an iPad with Apple Intelligence,\n    Writing Tools work in every box as well. The relay is set up once on the\n    website: see HOSTING.md.\n',
              'checks the wording on this device and suggests observable words (Check\n    wording; nothing is sent). On an iPad with Apple Intelligence, Writing\n    Tools work in every box as well.\n'),
             (' The writing help\'s Rewrite with Claude works only from\nthe website, through its relay (public_html/ai, uploaded once from\nnbh-relay-upload.zip; HOSTING.md says how).\n', '\n')]:
    if s.count(a) != 1: raise SystemExit('README.txt: the Rewrite with Claude text was not found once: ' + a[:60])
    s = s.replace(a, b)
if CUSTOMER:
    a_ = 'One file instead of a folder: NBH-Workstation.html (RPS-Workstation.html for\nthe school edition) is the whole workstation in a single file'
    if s.count(a_) != 1: raise SystemExit('README.txt: the one-file sentence was not found once')
    s = s.replace(a_, 'One file instead of a folder: the one-file edition, where you were given it,\nis the whole workstation in a single file')
    if re.search(r'Newsome|newsomebh|Royal Palm|RPS', s): raise SystemExit('README.txt still names the practice or the school edition')
open(rd, 'w', encoding='utf-8').write(s)
hd = os.path.join(OUT, 'HOSTING.md'); s = open(hd, encoding='utf-8').read()
s = re.sub(r'`workstation`', '`' + FOLDER + '`', s)
s = re.sub(r'public_html/workstation(?![-\w])', 'public_html/' + FOLDER, s)
s = re.sub(r'/workstation/', '/' + FOLDER + '/', s)
s = s.replace('# Putting the workstation on a website\n', '# Putting the workstation on a website\n\n' +
  (f'*{NAME} edition.* It lives in its own folder, `{FOLDER}`, on your own website, with its own password.\n' if CUSTOMER else
  '*Royal Palm School edition.* It lives in its own folder, `workstation-rps`, beside the\n'
  'Newsome Behavioral Health one in `workstation`, with its own password; its autosave is\n'
  'kept apart from the other edition\'s, and so (since v22.00) are its Google Drive setting, its sign-in and its\n'
  'Drive folder. Each folder needs its own `.htaccess` (step 4).\n'), 1)
if CUSTOMER:
    # v26.28 a customer's guide leaves out the two sections about the practice's own website (its public page, and the
    # writing-help relay, which is off in this copy), and its examples name a neutral website
    for h2 in ('## The public page at newsomebh.com', '## The writing-help relay'):
        a = s.find('\n' + h2)
        if a < 0: sys.exit('HOSTING.md has no section ' + h2)
        b = s.find('\n## ', a + 1); s = s[:a] + (s[b:] if b > 0 else '\n')
    s = s.replace('newsomebh.com', 'your-website.example')
    if s.count('`RPS-Workstation_speech.zip`') != 1: sys.exit('HOSTING.md: the speech zip\'s name was not found once')
    s = s.replace('`RPS-Workstation_speech.zip`', '`Workstation_speech.zip`')
    if re.search(r'Newsome|newsomebh|Royal Palm|RPS', s): sys.exit('HOSTING.md still names the practice or the school edition')
open(hd, 'w', encoding='utf-8').write(s)
print('built', OUT, '-', ', '.join(f'{n}x' for n in done))
