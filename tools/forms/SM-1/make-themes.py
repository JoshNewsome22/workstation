#!/usr/bin/env python3
"""v21.45 Form SM-1, the interest themes' pictures: tools/forms/SM-1/sm-themes.js from the OpenMoji package (CC BY-SA 4.0,
https://openmoji.org, the same source as the shared pictogram library). Three or four pictures per theme for the header and
the corners of the sheet; each is the emoji's colour SVG body in its 72 x 72 box, ids removed (they collide once inlined).
usage: python3 tools/forms/SM-1/make-themes.py <openmoji package dir>"""
import json, os, re, sys
pkg = sys.argv[1]
THEMES = {
    'sports': ['26BD', '1F3C6', '1F3C0', '1F3C8'],
    'space': ['1F680', '1FA90', '2B50', '1F6F8'],
    'animals': ['1F436', '1F431', '1F43E', '1F98A'],
    'dinos': ['1F996', '1F995', '1F30B', '1F95A'],
    'art': ['1F3A8', '1F58C', '1F58D', '1F308'],
    'music': ['1F3B5', '1F3B8', '1F941', '1F3B9'],
    'vehicles': ['1F697', '1F682', '2708', '1F69C'],
}
def inner(h):
    s = open(os.path.join(pkg, 'color', 'svg', h + '.svg'), encoding='utf-8').read()
    s = re.sub(r'<\?xml[^>]*\?>', '', s); s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    body = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1)
    body = re.sub(r'\s+id="[^"]*"', '', body)
    body = re.sub(r'<g[^>]*>\s*</g>', '', body)
    return re.sub(r'\s+', ' ', body).replace('> <', '><').strip()
art = {k: [inner(h) for h in v] for k, v in THEMES.items()}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sm-themes.js')
open(out, 'w', encoding='utf-8').write(
    '/* Form SM-1, the interest themes\' pictures: OpenMoji (https://openmoji.org), CC BY-SA 4.0. Made by\n'
    '   tools/forms/SM-1/make-themes.py; do not edit by hand. */\n'
    'const SM_THEME_ART=' + json.dumps(art, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('wrote', out, os.path.getsize(out), 'bytes')
