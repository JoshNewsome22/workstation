#!/usr/bin/env python3
"""v25.67 fx2: put the shared screen layout (tools/blocks/fx2.html) into the forms named, or refresh it.

The layout the BCBA approved on DM-1, IC-1 and RR-1 (v24.92), TB-1, IA-1 and IN-1 (v24.93, v24.95) was a copy inside each
form, with the forms' own settings inside the script. tools/blocks/fx2.html is now the one source: a <style
id="fx2-v2492"> and a <script id="fx2-v2492-js">. This tool puts them into a form, or replaces the copy a form holds,
byte for byte:

  ...the form's own styles...
  <style id="fx2-v2492">...</style>            the shared style, at the end of the <head>        (this tool)
  <style id="fx2-own">...</style>              the form's own screen rules, optional                (the form's)
  <script>document.documentElement.classList.add('fx2');...setAttribute('data-fx2','<ID>');...</script>
                                               the switch, set before the page draws, as the six forms set it (this tool)
  <script id="fx2-cfg">window.FX2_CFG={...}</script>
                                               the form's settings, optional (see the top of the script) (the form's)
  </head>
  ...the form's markup and scripts...
  <script id="fx2-v2492-js">...</script>       the shared script, after every script of the form    (this tool)
  <style id="nbh-polish-css" data-nbh-screen>  the polish layer, which stays last: apply-polish.py takes it out and
  <script id="nbh-polish" src=...></script>    puts it back before </body>, so the fx2 script must sit just above it
  </body>

A copy already in a form is replaced where it stands; a form without one gets the style and the switch just before
</head> and the script just above the polish block. The form's own blocks (fx2-own, fx2-cfg) are never changed or
moved; the tool refuses a form where they stand out of that order (fx2-own before the shared style, fx2-cfg after the
shared script), or that holds two copies of anything. Every form named is worked out before any is written, so a
refusal leaves the folder as it was. Files are read and written without newline translation. v25.70 fx2: TD-1 takes the
layout too (the TD-1 alignment pass, approved 11/8); its own v24.89 layout (html.td9: the selectors' questions beside the
Recommended margin, the Build cards, Not sure) stays in its own blocks, and its fx2-own and fx2-cfg keep the two apart.
A form listed in REFUSE (none now) is refused.

usage: python3 tools/blocks/patch-fx2.py [--check] FORM...
  FORM      a form's id (SI-1) or its file (NBH-Workstation/SI-1_..._v2026-10.html); ids are looked up in the FORMS list
            of NBH-Workstation/index.html (or of the folder the files are in)
  --check   change nothing; exit 1 if a form that carries the layout (any of its blocks) holds a copy that differs from
            tools/blocks/fx2.html, lacks a part, has its switch set to another id or its blocks out of order. A form
            named that carries none of it is passed over (tools/check-build.py names every form).
After a change, run python3 tools/pwa-sw.py NBH-Workstation as for any change to a form."""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'tools', 'blocks', 'fx2.html')
STYLE_RE = re.compile(r'<style id="fx2-v2492">.*?</style>', re.S)
SCRIPT_RE = re.compile(r'<script id="fx2-v2492-js">.*?</script>', re.S)
OWN_RE = re.compile(r'<style id="fx2-own">.*?</style>', re.S)
CFG_RE = re.compile(r'<script id="fx2-cfg">.*?</script>', re.S)
SWITCH_RE = re.compile(r"<script>document\.documentElement\.classList\.add\('fx2'\);document\.documentElement\.setAttribute\('data-fx2','([A-Z0-9]+-\d+)'\);addEventListener\('beforeprint',function\(\)\{if\(window\.fx2Layout\)fx2Layout\.paper\(true\)\}\)</script>")
POLISH = '<style id="nbh-polish-css"'
REFUSE = ()   # v25.70 fx2: TD-1 was refused until its alignment pass (its own v24.89 layout now sits beside the shared one)


def switch(fid):
    return ("<script>document.documentElement.classList.add('fx2');document.documentElement.setAttribute('data-fx2','" + fid +
            "');addEventListener('beforeprint',function(){if(window.fx2Layout)fx2Layout.paper(true)})</script>")


def fail(msg):
    sys.exit('patch-fx2.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def source():
    s = read(SRC)
    st, sc = STYLE_RE.findall(s), SCRIPT_RE.findall(s)
    if len(st) != 1 or len(sc) != 1:
        fail('tools/blocks/fx2.html must hold one <style id="fx2-v2492"> and one <script id="fx2-v2492-js">')
    body = st[0] + sc[0]
    # the blocks go into every form and both editions: nothing that would end the element early, nothing a host's
    # injector looks for, no form's settings (they are the form's own), not the practice's name (the school edition)
    low = body.lower()
    for bad in ('</head>', '</body>', '</html>', '<!--', 'newsome behavioral health'):
        if bad in low:
            fail('tools/blocks/fx2.html: the blocks may not contain ' + repr(bad))
    # a tag in a comment would end the element early, or be taken for a form's own block
    if body.count('</script') != 1 or body.count('</style') != 1 or body.count('<script') != 1 or body.count('<style') != 1:
        fail('tools/blocks/fx2.html: a block holds a second opening or closing tag (write fx2-own, fx2-cfg without the tags)')
    if 'data-fx2="' in st[0] or "data-fx2='" in sc[0] or "FORM ===" in sc[0]:
        fail('tools/blocks/fx2.html: a rule or a branch for one form belongs in that form\'s fx2-own or fx2-cfg block')
    return st[0], sc[0]


def form_ids(folder):
    idx = os.path.join(folder, 'index.html')
    if not os.path.isfile(idx):
        return {}
    m = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', read(idx))
    if not m:
        return {}
    return {f: i for i, f in re.findall(r"\['([A-Z0-9]+-\d+)','[^']*','([^']+\.html)'\]", m.group(1))}


def resolve(args):
    """each argument to (path, form id)"""
    out, ids = [], {}
    default = os.path.join(ROOT, 'NBH-Workstation')
    for a in args:
        if os.path.isfile(a):
            p = os.path.abspath(a)
            folder = os.path.dirname(p)
            ids.setdefault(folder, form_ids(folder))
            fid = ids[folder].get(os.path.basename(p)) or os.path.basename(p).split('_')[0]
        elif re.fullmatch(r'[A-Z0-9]+-\d+', a):
            ids.setdefault(default, form_ids(default))
            files = [f for f, i in ids[default].items() if i == a]
            if len(files) != 1:
                fail('no form ' + a + ' in the FORMS list of NBH-Workstation/index.html')
            p, fid = os.path.join(default, files[0]), a
        else:
            fail('not a form id or a file: ' + a)
        if not re.fullmatch(r'[A-Z0-9]+-\d+', fid):
            fail(os.path.basename(p) + ': cannot tell its form id (it is not in the FORMS list)')
        out.append((p, fid))
    return out


def one(m_list, what, name):
    if len(m_list) > 1:
        fail(name + ': holds ' + str(len(m_list)) + ' copies of ' + what)
    return m_list[0] if m_list else None


def parts(s, name):
    st = one(list(STYLE_RE.finditer(s)), 'the fx2 style', name)
    sc = one(list(SCRIPT_RE.finditer(s)), 'the fx2 script', name)
    sw = one(list(SWITCH_RE.finditer(s)), 'the fx2 switch', name)
    own = one(list(OWN_RE.finditer(s)), 'fx2-own', name)
    cfg = one(list(CFG_RE.finditer(s)), 'fx2-cfg', name)
    return st, sc, sw, own, cfg


def order(s, name):
    """the places the blocks must keep; returns a list of what is wrong"""
    st, sc, sw, own, cfg = parts(s, name)
    head = s.find('</head>')
    pol = s.find(POLISH)
    bad = []
    if st and st.start() > head:
        bad.append('the style is not in the <head>')
    if sw and sw.start() > head:
        bad.append('the switch is not in the <head>')
    if st and sw and sw.start() < st.start():
        bad.append('the switch comes before the style')
    if own and (not st or own.start() < st.end()):
        bad.append('fx2-own does not follow the shared style')
    if own and own.start() > head:
        bad.append('fx2-own is not in the <head>')
    if cfg and (not sc or cfg.start() > sc.start()):
        bad.append('fx2-cfg does not come before the shared script')
    if sc and (pol < 0 or s[sc.end():pol].strip() != ''):
        bad.append('the script is not just above the polish block')
    return bad


def patch(s, name, fid, style, script):
    if s.count('</head>') != 1:
        fail(name + ': expected one </head>, found ' + str(s.count('</head>')))
    if s.count(POLISH) != 1:
        fail(name + ': expected one polish block (' + POLISH + '), found ' + str(s.count(POLISH)) + '; run tools/apply-polish.py first')
    st, sc, sw, own, cfg = parts(s, name)
    # the style and the switch: replaced where they stand, or put in at the end of the head (before fx2-own and fx2-cfg
    # when the form already has them)
    if st:
        s = s[:st.start()] + style + s[st.end():]
    else:
        at = own.start() if own else (sw.start() if sw else (cfg.start() if cfg and cfg.start() < s.find('</head>') else s.find('</head>')))
        s = s[:at] + style + '\n' + s[at:]
    st, sc, sw, own, cfg = parts(s, name)
    if sw:
        s = s[:sw.start()] + switch(fid) + s[sw.end():]
    else:
        at = own.end() if own else st.end()
        s = s[:at] + '\n' + switch(fid) + s[at:]
    st, sc, sw, own, cfg = parts(s, name)
    if sc:
        s = s[:sc.start()] + script + s[sc.end():]
    else:
        at = s.find(POLISH)
        s = s[:at] + script + '\n' + s[at:]
    bad = order(s, name)
    if bad:
        fail(name + ': ' + '; '.join(bad))
    return s


def main(argv):
    check = False
    args = []
    for a in argv:
        if a in ('-h', '--help'):
            print(__doc__); return 0
        if a == '--check':
            check = True
        elif a.startswith('-'):
            fail('unknown option ' + a + '; see --help')
        else:
            args.append(a)
    if not args:
        fail('name the forms (ids or files); see --help')
    style, script = source()
    todo, stale = [], []
    for p, fid in resolve(args):
        name = os.path.basename(p)
        s = read(p)
        st, sc, sw, own, cfg = parts(s, name)
        carries = any((st, sc, sw, own, cfg))
        if check:
            if not carries:
                continue
            why = []
            if fid in REFUSE:
                why.append('the form keeps its own layout (REFUSE)')
            if not st or st.group(0) != style:
                why.append('the style differs from tools/blocks/fx2.html' if st else 'no fx2 style')
            if not sc or sc.group(0) != script:
                why.append('the script differs from tools/blocks/fx2.html' if sc else 'no fx2 script')
            if not sw:
                why.append('no switch')
            elif sw.group(1) != fid:
                why.append('the switch says ' + sw.group(1))
            why += order(s, name)
            if why:
                stale.append(name + ': ' + '; '.join(why))
            else:
                print('current ' + name)
            continue
        if fid in REFUSE:
            fail(name + ': the form keeps its own layout (REFUSE)')
        new = patch(s, name, fid, style, script)
        todo.append((p, name, new, new != s))
    if check:
        for line in stale:
            print('stale ' + line)
        if stale:
            print('patch-fx2.py --check: %d form(s) differ from tools/blocks/fx2.html' % len(stale))
            return 1
        return 0
    for p, name, new, changed in todo:
        if changed:
            write(p, new)
        print(('patched ' if changed else 'already ') + name)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
