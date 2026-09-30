#!/usr/bin/env python3
"""Recover the Royal Palm School lockup and tab icon from a school-edition index.html.

usage: rps-assets.py <RPS index.html> <out folder>   -> writes rps-lockup.webp and rps-favicon.png
"""
import re, base64, os, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'rps-lockup.webp'), 'wb').write(base64.b64decode(re.search(
    r'id="logo" alt="[^"]*" src="data:image/webp;base64,([^"]+)"', s).group(1)))
open(os.path.join(out, 'rps-favicon.png'), 'wb').write(base64.b64decode(re.search(
    r'rel="icon" type="image/png" href="data:image/png;base64,([^"]+)"', s).group(1)))
print('wrote', out)
