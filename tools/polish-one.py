#!/usr/bin/env python3
"""Run apply-polish.py on one form without touching its neighbours: the form is copied to a temporary
folder, polished there, and copied back. Used after new-form.py rebuilds a parts-built form.
usage: polish-one.py <form.html>"""
import subprocess, shutil, os, tempfile, sys
f = sys.argv[1]; d = tempfile.mkdtemp(); shutil.copy(f, d)
here = os.path.dirname(os.path.abspath(__file__))
print(subprocess.run(['python3', os.path.join(here, 'apply-polish.py'), d], capture_output=True, text=True).stdout.strip())
shutil.copy(os.path.join(d, os.path.basename(f)), f)
