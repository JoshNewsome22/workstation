#!/usr/bin/env python3
"""Put the shared screen polish, and the writing help, into every form of a workstation folder.

Each form gets, just before </body>, a <style id="nbh-polish-css" data-nbh-screen> block and a
<script id="nbh-polish"> block from tools/polish/. Run again after editing those files: an existing
block is replaced, so the result is the same however many times this runs. index.html (the shell)
and respond.html (the respondent page) are not forms and are left alone.

v21.43: each form also gets the writing help, the <script id="nbh-wording"> block that
tools/blocks/patch-wording.py makes from tools/blocks/nbh-wording.js, nbh-wording-rules.json and
nbh-wording-config.json (the Improve wording button and panel), put in or replaced the same way.
This is the one place a rebuilt form gets it: tools/polish-one.py runs this after every rebuild of a
form built from parts (tools/new-form.py, TK-1's build.sh), so no rebuild can leave it out.

The bridge inside each form hands every <style> to the master print; the polish is screen-only
and is kept out of the packet, so the one line that collects styles is taught to skip it.

usage: apply-polish.py <workstation folder>
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('patch_wording', os.path.join(HERE, 'blocks', 'patch-wording.py'))
WORDING = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(WORDING)
NOT_FORMS = ('index.html', 'respond.html')
CSS = open(os.path.join(HERE, 'polish', 'nbh-polish.css'), encoding='utf-8').read().rstrip('\n')
JS = open(os.path.join(HERE, 'polish', 'nbh-polish.js'), encoding='utf-8').read().rstrip('\n')
BLOCK = ('<style id="nbh-polish-css" data-nbh-screen>\n' + CSS + '\n</style>\n'
         '<script id="nbh-polish">\n' + JS + '\n</script>\n')
STYLE_RE = re.compile(r'<style id="nbh-polish-css"[^>]*>.*?</style>\n', re.S)
SCRIPT_RE = re.compile(r'<script id="nbh-polish">.*?</script>\n', re.S)
OLD_COLLECT = "return Array.prototype.map.call(document.querySelectorAll('style'),"
NEW_COLLECT = "return Array.prototype.map.call(document.querySelectorAll('style:not([data-nbh-screen])'),"
# the packet reads the form with the phone text size stepped aside (see nbh-polish.js, plain)
BRANCH = "    } else if (d.nbh === 'collect') {\n"
PLAIN_ON = "      if (window.nbhPolish && window.nbhPolish.plain) window.nbhPolish.plain(true);   /* nbh-polish */\n"
PLAIN_OFF = "      if (window.nbhPolish && window.nbhPolish.plain) window.nbhPolish.plain(false);  /* nbh-polish */\n"
REPLY_RE = re.compile(r"( +css: styles\(\), html: [^\n]*who: who\(\) \}\);\n)")

def main(folder):
    done = 0
    W = WORDING.load()   # the writing help's sources, checked once; stops before anything is written if one is wrong
    for fn in sorted(os.listdir(folder)):
        if not fn.endswith('.html') or fn in NOT_FORMS:
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
        s = s.replace(PLAIN_ON, '').replace(PLAIN_OFF, '')
        if s.count(BRANCH) != 1 or len(REPLY_RE.findall(s)) != 1:
            sys.exit(f'{fn}: the bridge does not answer collect the way this script expects')
        s = s.replace(BRANCH, BRANCH + PLAIN_ON)
        s = REPLY_RE.sub(lambda m: m.group(1) + PLAIN_OFF, s)
        s = s.replace('</body>', BLOCK + '</body>', 1)
        s, _ = WORDING.put(s, fn, W)
        open(p, 'w', encoding='utf-8').write(s)
        done += 1
    print(f'polished {done} forms in {folder}, each with the writing help')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
