"""v22.12 (review I258, F507): the shipped forms are exactly what the tools make.

Copies NBH-Workstation and tools/ to a scratch folder, runs every patcher that keeps the forms current (the polish and
writing help, the shared blocks, the case flow, the bridge's csv verb, the field names, the letterhead, the TB-1
library, the TK-1/TE-1 link and the per-form hooks), plus the --check of the ones that have one, and compares the
result with the folder, byte for byte. A form or shared file the tools would change means something was edited by hand
where a tool will undo it, or a tool's source was changed without running it: the release is not reproducible, and
every device would download the file again at the next rebuild. Exit 0 when nothing would change.

Not run: patch-guard.py (retired at v22.12: the guard in each form is kept by patch-autosave.py) and the one-shot
scripts in tools/history/.

usage: python3 tools/check-build.py [FOLDER]      FOLDER defaults to NBH-Workstation
"""
import filecmp, glob, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
folder = sys.argv[1] if len(sys.argv) > 1 else 'NBH-Workstation'
src = os.path.join(ROOT, folder)
tmp = tempfile.mkdtemp(prefix='nbh-check-build-')
try:
    shutil.copytree(src, os.path.join(tmp, 'NBH-Workstation'))
    shutil.copytree(os.path.join(ROOT, 'tools'), os.path.join(tmp, 'tools'), ignore=shutil.ignore_patterns('__pycache__'))
    os.chdir(tmp)
    forms = sorted(f for f in glob.glob('NBH-Workstation/[A-Z]*.html'))
    if len(forms) != 46:
        sys.exit(f'check-build: expected 46 forms, found {len(forms)}')
    B = 'tools/blocks/'
    steps = [
        ['python3', 'tools/apply-polish.py', 'NBH-Workstation'],
        ['python3', B + 'patch-ui.py', B + 'nbh-ui.html', *forms],
        ['python3', B + 'patch-case.py', B + 'nbh-case.html', *forms],
        ['python3', B + 'patch-csv.py', *forms],
        ['python3', B + 'patch-names.py', *forms],
        ['python3', 'tools/dedupe-logo.py', *forms],
        ['python3', B + 'patch-tb1-library.py'],
        ['python3', B + 'patch-link.py'],
        ['python3', B + 'patch-autosave.py', '--check'],
        ['python3', B + 'patch-pwa.py', '--check', 'NBH-Workstation'],
        ['python3', B + 'patch-shared.py', '--check', *forms],
        ['python3', B + 'patch-narration.py', '--check', *forms],
    ]
    by_id = {}
    for f in forms:
        by_id[os.path.basename(f).split('_')[0]] = f
    by_id.setdefault('DD-1', 'NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html')
    for h in sorted(glob.glob(B + 'hooks/*.js')):
        fid = os.path.basename(h)[:-3]
        if fid not in by_id:
            sys.exit(f'check-build: no form for the hook {h}')
        steps.append(['python3', B + 'patch-hook.py', by_id[fid], h])
    failed = []
    for cmd in steps:
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            failed.append(f'{" ".join(cmd[:3])}: exit {r.returncode}: {(r.stderr or r.stdout).strip()[-300:]}')
    changed = []
    for dirpath, _, files in os.walk('NBH-Workstation'):
        for n in files:
            p = os.path.join(dirpath, n)
            o = os.path.join(src, os.path.relpath(p, 'NBH-Workstation'))
            if not os.path.exists(o):
                changed.append('new: ' + os.path.relpath(p, 'NBH-Workstation'))
            elif not filecmp.cmp(p, o, shallow=False):
                changed.append('changed: ' + os.path.relpath(p, 'NBH-Workstation'))
    for line in failed + changed:
        print(line)
    if failed or changed:
        sys.exit(f'check-build: {len(changed)} file(s) the tools would change, {len(failed)} step(s) failed')
    print(f'check-build: the tools reproduce {folder} exactly ({len(steps)} steps, {len(forms)} forms)')
finally:
    shutil.rmtree(tmp, ignore_errors=True)
