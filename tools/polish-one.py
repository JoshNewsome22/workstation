#!/usr/bin/env python3
"""Run apply-polish.py on one form without touching its neighbours: the form is copied to a temporary
folder, polished there (the polish layer and the writing help, see apply-polish.py), and copied back.
Used after new-form.py rebuilds a parts-built form. If the polish fails (a block's source that does not
pass its checks, a form of an unexpected shape), the form is not copied back and this exits with the
reason, so a build that runs it (TK-1's build.sh) stops there instead of going on without the blocks.
usage: polish-one.py <form.html>"""
import subprocess, shutil, os, tempfile, sys
f = sys.argv[1]; d = tempfile.mkdtemp(); shutil.copy(f, d)
here = os.path.dirname(os.path.abspath(__file__))
r = subprocess.run([sys.executable, os.path.join(here, 'apply-polish.py'), d], capture_output=True, text=True)
print(r.stdout.strip())
if r.returncode != 0:
    shutil.rmtree(d, ignore_errors=True)
    sys.exit((r.stderr.strip() or 'apply-polish.py failed') + '\npolish-one.py: ' + f + ' was not polished')
shutil.copy(os.path.join(d, os.path.basename(f)), f)
shutil.rmtree(d, ignore_errors=True)
