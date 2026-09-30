#!/usr/bin/env python3
"""Put the shared screen polish into every form of a workstation folder.

Each form gets, just before </body>, a <style id="nbh-polish-css" data-nbh-screen> block and a
<script id="nbh-polish"> block from tools/polish/. Run again after editing those files: an existing
block is replaced, so the result is the same however many times this runs. index.html is not a
form and is left alone.

The bridge inside each form hands every <style> to the master print; the polish is screen-only
and is kept out of the packet, so the one line that collects styles is taught to skip it.

usage: apply-polish.py <workstation folder>
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CSS = open(os.path.join(HERE, 'polish', 'nbh-polish.css'), encoding='utf-8').read().rstrip('\n')
JS = open(os.path.join(HERE, 'polish', 'nbh-polish.js'), encoding='utf-8').read().rstrip('\n')
BLOCK = ('<style id="nbh-polish-css" data-nbh-screen>\n' + CSS + '\n</style>\n'
         '<script id="nbh-polish">\n' + JS + '\n</script>\n')
STYLE_RE = re.compile(r'<style id="nbh-polish-css"[^>]*>.*?</style>\n', re.S)
SCRIPT_RE = re.compile(r'<script id="nbh-polish">.*?</script>\n', re.S)
OLD_COLLECT = "return Array.prototype.map.call(document.querySelectorAll('style'),"
NEW_COLLECT = "return Array.prototype.map.call(document.querySelectorAll('style:not([data-nbh-screen])'),"

def main(folder):
    done = 0
    for fn in sorted(os.listdir(folder)):
        if not fn.endswith('.html') or fn == 'index.html':
            continue
        p = os.path.join(folder, fn)
        s = open(p, encoding='utf-8').read()
        if s.count('</body>') != 1:
            sys.exit(f'{fn}: expected exactly one </body>, found {s.count("</body>")}')
        s = STYLE_RE.sub('', s)
        s = SCRIPT_RE.sub('', s)
        if OLD_COLLECT in s:
            s = s.replace(OLD_COLLECT, NEW_COLLECT)
        if NEW_COLLECT not in s:
            sys.exit(f'{fn}: the bridge does not collect styles the way this script expects')
        s = s.replace('</body>', BLOCK + '</body>', 1)
        open(p, 'w', encoding='utf-8').write(s)
        done += 1
    print(f'polished {done} forms in {folder}')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
