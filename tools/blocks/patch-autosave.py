#!/usr/bin/env python3
"""v21.44 Autosave that holds up on an iPad: put it into the forms and the workstation. Idempotent; run it again after any
change to tools/blocks/nbh-copies.js or nbh-autosave.js, and on a merged tree.

Into every form named (default: the 44 forms, NBH-Workstation/[A-Z]*.html):
  1. <script id="nbh-autosave">: the store (tools/blocks/nbh-copies.js) and the form's part (tools/blocks/nbh-autosave.js),
     each byte for byte, before the polish layer at the end of the body (tools/apply-polish.py puts the polish back at the
     end of the body, so a rebuilt form keeps the same order and a rebuild from parts stays byte for byte). An existing
     copy is replaced. v21.84: the block's text is written once beside the forms, as nbh-autosave.js, and each form
     carries its loader, <script id="nbh-autosave" src="nbh-autosave.js"></script>, in that place (an inline copy is
     replaced by it; see tools/blocks/shared_js.py); --check also checks the file.
  2. Five small changes in the workstation bridge: the status a form reports carries the hash of its whole state
     (window.nbhState, so taps count), the parts the form's own safety copy needs are named on window.nbhBridge, the
     answer to a snapshot says beside it whether the form has been changed since it was opened and which state the
     file holds, and a tap or key during a restore ends the quiet that answers the form's own confirms. And (v21.43)
     the field-by-field restore (a snapshot without the form's own file, or one whose Open fails) takes the form for
     the same shape when its controls without an id or a name sit where they sat, not only when the count of all its
     controls is the same: a control with an id added after those (Form TE-1's hidden #teLink) no longer leaves
     every positional field of an older snapshot behind. A count that differs for any other reason still does.
  3. Five small changes in the leave guard (nbh-guard): the bridge's silent save (the workstation's Autosave) is not the
     user's Save and clears nothing, and the unsaved mark, the leave warning and the quick Save follow the whole state.
     The same changes are made in tools/blocks/nbh-guard.html, the guard's source, so tools/blocks/patch-guard.py writes
     the same guard. (Note: patch-guard.py replaces everything from nbh-guard-css up to nbh-toolbar-width, which takes
     the nbh-ui block with it; do not run it on the shipped forms without fixing that first.)
Into NBH-Workstation/index.html: the store again, between the two "nbh-copies core" markers in the autosave section.
The forms built from parts (tools/forms/<ID>/) take all of this from Form CF-1, the template, when they are rebuilt.

Each change is checked: what it replaces must be there exactly once, or the change must already be in place; anything
else stops the script before a file is written. The sources may not contain "</script", "<!--", the practice's name or a
model ID. Files are read and written without newline translation.

usage: python3 tools/blocks/patch-autosave.py [--check] [FORM.html ...]
  --check   change nothing; exit 1 unless every file already carries the current copy"""
import glob, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BLOCKS = os.path.join(ROOT, 'tools', 'blocks')
OPEN, CLOSE = '<script id="nbh-autosave">', '</script>'
FILE = 'nbh-autosave.js'   # v21.84 the one copy, beside the forms
LOADER = '<script id="nbh-autosave" src="' + FILE + '"></script>'
TAG = '\n<script id="nbh-autosave"'   # an inline copy or the loader
HEAD = ('/* nbh-autosave (v21.44): written by tools/blocks/patch-autosave.py from tools/blocks/nbh-copies.js and\n'
        '   nbh-autosave.js, each copied byte for byte; change those files and run it again rather than editing this copy. */\n')
CORE_A = '/* nbh-copies core: begin (tools/blocks/nbh-copies.js, put here by tools/blocks/patch-autosave.py; edit that file, not this copy) */\n'
CORE_B = '/* nbh-copies core: end */'

BRIDGE = [
    ("    return { filled: n, total: t, sig: s };\n",
     "    var st = { filled: n, total: t, sig: s };\n"
     "    /* v21.44 the form's whole state (nbh-autosave: a hash of what Save data writes), so a tap counts as a change */\n"
     "    try { if (window.nbhState) st = window.nbhState.status(st); } catch (err) {}\n"
     "    return st;\n"),
    ("  window.addEventListener('message', function(ev){\n    var d = ev.data || {};\n    if (!d || !d.nbh) return;\n",
     "  /* v21.44 what nbh-autosave needs for a form opened on its own: its safety copy and the restore of one */\n"
     "  window.nbhBridge = { formId: formId, formTitle: formTitle, who: who, snapshot: snapshot, restoreData: restoreData,\n"
     "    ownSave: ownSave, ownOpen: ownOpen, valueSig: valueSig };\n"
     "  window.addEventListener('message', function(ev){\n    var d = ev.data || {};\n    if (!d || !d.nbh) return;\n"),
    (("        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap });\n",
      # the first v21.44 text (autosave-v2 before the review), brought up to date
      "        /* v21.44 edited: whether this file differs from the form as it was opened (the workstation keeps no copy of a\n"
      "           form only opened); it travels beside the snapshot, never in it, so a case file is unchanged */\n"
      "        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap,\n"
      "                edited: !!(window.nbhState && window.nbhState.differs(own)) });\n"),
     "        /* v21.44 edited: whether this file differs from the form as it was opened (the workstation keeps no copy of a\n"
     "           form only opened); status: the form's state as this file holds it, so Save case marks saved exactly what\n"
     "           is in the file. Both travel beside the snapshot, never in it, so a case file is unchanged */\n"
     "        reply({ nbh:'snapshot', id: formId(), title: formTitle(), snap: snap,\n"
     "                edited: !!(window.nbhState && window.nbhState.differs(own)), status: filled() });\n"),
    (("      /* the form reads the file with a FileReader and redraws; give it that time */\n"
      "      setTimeout(function(){ quiet(false); res(true); }, 1200);\n",
      "      /* the form reads the file with a FileReader and redraws; give it that time. v21.44: a tap or key of the user's\n"
      "         ends the quiet at once, so a Clear all pressed just after a restore is asked as usual */\n"
      "      var gest = function(){ quiet(false); };\n"
      "      document.addEventListener('pointerdown', gest, true); document.addEventListener('keydown', gest, true);\n"
      "      setTimeout(function(){\n"
      "        document.removeEventListener('pointerdown', gest, true); document.removeEventListener('keydown', gest, true);\n"
      "        quiet(false); res(true);\n"
      "      }, 1200);\n",
      "      /* the form reads the file with a FileReader and redraws; give it that time. v21.44: a tap or key of the user's\n"
      "         ends the quiet at once, so a Clear all pressed just after a restore is asked as usual. v22.14 (review F470):\n"
      "         done as soon as the form has read the file (every FileReader or Blob read started by the change has ended and\n"
      "         its handler run) and 0.15 s more for the redraw, not after a fixed 1.2 s; a form that reads no file that way,\n"
      "         or takes longer, is given the 1.2 s as before */\n"
      "      var gest = function(){ quiet(false); };\n"
      "      document.addEventListener('pointerdown', gest, true); document.addEventListener('keydown', gest, true);\n"
      "      var t0 = Date.now(), fin = false, idle = 0;\n"
      "      var done = function(){ if (fin) return; fin = true; unwatch();\n"
      "        document.removeEventListener('pointerdown', gest, true); document.removeEventListener('keydown', gest, true);\n"
      "        quiet(false); res(true);\n"
      "      };\n"
      "      (function look(){ if (fin) return; var t = Date.now() - t0;\n"
      "        if (reads.seen && !reads.pend) idle += 50; else idle = 0;\n"
      "        if ((reads.seen && idle >= 150 && t >= 200) || t >= 1200) return done();\n"
      "        setTimeout(look, 50); })();\n"),
     "      /* the form reads the file with a FileReader and redraws; give it that time. v21.44: a tap or key of the user's\n"
     "         ends the quiet at once, so a Clear all pressed just after a restore is asked as usual. v22.14 (review F470):\n"
     "         done as soon as the form has read the file (every FileReader or Blob read started by the change has ended and\n"
     "         its handler run) and 0.15 s more for the redraw, not after a fixed 1.2 s; a form that reads no file that way,\n"
     "         or takes longer, is given the 1.2 s as before */\n"
     "      var gest = function(){ quiet(false); };\n"
     "      document.addEventListener('pointerdown', gest, true); document.addEventListener('keydown', gest, true);\n"
     "      var n = 0, fin = false, idle = 0;   /* v22.15: time counted in its own 50 ms steps, not by the clock (a clock set back,\n"
     "         or held still, left a form that reads no file waiting for ever) */\n"
     "      var done = function(){ if (fin) return; fin = true; unwatch();\n"
     "        document.removeEventListener('pointerdown', gest, true); document.removeEventListener('keydown', gest, true);\n"
     "        quiet(false); res(true);\n"
     "      };\n"
     "      (function look(){ if (fin) return; var t = (n++) * 50;\n"
     "        if (reads.seen && !reads.pend) idle += 50; else idle = 0;\n"
     "        if ((reads.seen && idle >= 150 && t >= 200) || t >= 1200) return done();\n"
     "        setTimeout(look, 50); })();\n"),
    ("      quiet(true);\n      try {\n        var dt = new DataTransfer();\n",
     "      quiet(true);\n"
     "      /* v22.14: the reads the form starts while it takes the file are counted, so the end is known */\n"
     "      var reads = { seen: false, pend: 0 }, FRp = window.FileReader && FileReader.prototype, Bp = window.Blob && Blob.prototype, kept = [];\n"
     "      var count = function(start){ reads.seen = true; reads.pend++; var end = function(){ setTimeout(function(){ reads.pend--; }, 0); }; start(end); };\n"
     "      if (FRp) ['readAsText', 'readAsDataURL', 'readAsArrayBuffer'].forEach(function(m){ var f = FRp[m]; if (!f) return; kept.push([FRp, m, f]);\n"
     "        FRp[m] = function(){ var r = this; count(function(end){ r.addEventListener('loadend', end); }); return f.apply(this, arguments); }; });\n"
     "      if (Bp) ['text', 'arrayBuffer'].forEach(function(m){ var f = Bp[m]; if (!f) return; kept.push([Bp, m, f]);\n"
     "        Bp[m] = function(){ var p = f.apply(this, arguments); count(function(end){ p.then(function(){ setTimeout(end, 0); }, end); }); return p; }; });\n"
     "      var unwatch = function(){ kept.forEach(function(k){ k[0][k[1]] = k[2]; }); kept = []; };\n"
     "      try {\n        var dt = new DataTransfer();\n"),
    ("        inp.dispatchEvent(new Event('change', { bubbles: true }));\n      } catch (e) { quiet(false); return res(false); }\n",
     "        inp.dispatchEvent(new Event('change', { bubbles: true }));\n      } catch (e) { unwatch(); quiet(false); return res(false); }\n"),
    ("  function restoreData(snap){\n    var list = ctrls(), keys = keysFor(list);\n"
     "    var placed = 0, positionalSkipped = 0, unknown = 0, seen = {};\n"
     "    var sameShape = snap && snap.total === list.length;\n",
     "  /* v21.43 the shape is the same when the controls without an id or a name sit where they sat: a control with one,\n"
     "     added after all of those (Form TE-1's hidden link record) or taken away from after them, moves none of them */\n"
     "  function samePlaces(data, keys){\n"
     "    var n = 0, i, k;\n"
     "    for (i = 0; i < keys.length; i++) if (keys[i].charAt(0) === '~') { if (!(keys[i] in data)) return false; n++; }\n"
     "    for (k in data) if (k.charAt(0) === '~') n--;\n"
     "    return n === 0;\n"
     "  }\n"
     "  function restoreData(snap){\n    var list = ctrls(), keys = keysFor(list);\n"
     "    var placed = 0, positionalSkipped = 0, unknown = 0, seen = {};\n"
     "    var sameShape = snap && (snap.total === list.length || samePlaces(snap.data || {}, keys));\n"),
]
GUARD = [
    ("   toolbar (More controls folded) shows a Save button of its own, so saving on an iPad is one tap. */\n",
     "   toolbar (More controls folded) shows a Save button of its own, so saving on an iPad is one tap.\n"
     "   v21.44: the unsaved mark also follows the form's whole state (window.nbhState, the nbh-autosave block), so a tap that\n"
     "   changes the record counts as typing does, and the bridge's silent save (the workstation's Autosave, a case save) is\n"
     "   not the user's Save, so it never clears the mark. An iPad ignores the leave warning; the safety copy covers it there. */\n"),
    ("    if (e.target && e.target.type === 'file') { setTimeout(function(){ dirty = false; paint(); }, 900); return; }",
     "    if (e.target && e.target.type === 'file') { if (opening) { opening = false; setTimeout(function(){ dirty = false; saved(); paint(); }, 900); } return; }"),   # v21.87 Open data only (patch-guard-open.py)
    ("  var dirty = false;\n  function isField(t)",
     "  var dirty = false, opening = false;   /* opening: Open data was the last button pressed (v21.86) */\n  function isField(t)"),
    (("  document.addEventListener('click', function(e){\n    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b) return;\n"
     "    if (b.id === 'nbhSaveQuick') return;\n"
     "    if (b.matches('#saveBtn,#btnSave,#dl-json') || /^\\s*save data\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; paint(); }, 300); }\n"
     "    else if (b.id === 'clearBtn' || /^\\s*clear all\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; paint(); }, 300); }\n",
     # v21.44
      "  document.addEventListener('click', function(e){\n"
     "    if (window.__nbhQuiet) return;   /* v21.44 the bridge pressing Save for the workstation, not the user */\n"
     "    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b) return;\n"
     "    if (b.id === 'nbhSaveQuick') return;\n"
     "    if (b.matches('#loadBtn,#btnLoad,#up-json') || /^\\s*open data\\s*$/i.test(b.textContent)) opening = true; else if (!b.closest('dialog')) opening = false;\n"
     "    if (b.matches('#saveBtn,#btnSave,#dl-json') || /^\\s*save data\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; saved(); paint(); }, 300); }\n"
     "    else if (b.id === 'clearBtn' || /^\\s*clear all\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; saved(); paint(); }, 300); }\n"),
     "  document.addEventListener('click', function(e){\n"
     "    if (window.__nbhQuiet) return;   /* v21.44 the bridge pressing Save for the workstation, not the user */\n"
     "    var b = e.target && e.target.closest ? e.target.closest('button') : null; if (!b) return;\n"
     "    if (b.id === 'nbhSaveQuick') return;\n"
     "    if (b.matches('#loadBtn,#btnLoad,#up-json') || /^\\s*open data\\s*$/i.test(b.textContent)) opening = true; else if (!b.closest('dialog')) opening = false;\n"
     "    if (b.matches('#saveBtn,#btnSave,#dl-json') || /^\\s*save data\\s*$/i.test(b.textContent)) { setTimeout(function(){ dirty = false; saved(); paint(); }, 300); }\n"
     "    else if (b.id === 'clearBtn' || /^\\s*clear all\\s*$/i.test(b.textContent)) afterClear(function(){ dirty = false; saved(); paint(); });   /* v22.06 only once really cleared */\n"),
    ("    if (window.parent !== window) return;\n    if (!dirty) return;\n",
     "    if (window.parent !== window) return;\n    if (!isDirty()) return;\n"),
    ("  function paint(){ var q = document.getElementById('nbhSaveQuick'); if (q) q.classList.toggle('dirty', dirty); }\n"
     "  setInterval(paint, 2000);\n"
     "  window.nbhGuard = { isDirty: function(){ return dirty; }, clean: function(){ dirty = false; paint(); } };\n",
     "  function isDirty(){ return dirty || !!(window.nbhState && window.nbhState.unsaved()); }\n"
     "  function saved(){ if (window.nbhState) window.nbhState.markSaved(); }\n"
     "  function paint(){ var q = document.getElementById('nbhSaveQuick'); if (q) q.classList.toggle('dirty', isDirty()); }\n"
     "  setInterval(paint, 2000);\n"
     "  window.nbhGuard = { isDirty: isDirty, clean: function(){ dirty = false; saved(); paint(); } };\n"),
    ("  window.nbhGuard = { isDirty: isDirty, clean: function(){ dirty = false; saved(); paint(); } };\n",
     "  window.nbhGuard = { isDirty: isDirty, clean: function(){ dirty = false; saved(); paint(); } };\n"
     "  /* v22.06 Clear all counts the form as clean only once the form has really been cleared: its state changes after the\n"
     "     tap (the question answered Clear). Cancel leaves it as it was, so nothing is marked; typing again ends the wait. */\n"
     "  function afterClear(done){\n"
     "    var S = window.nbhState; if (!S || !S.sig || !S.now) { setTimeout(done, 300); return; }\n"
     "    var was = null, stop = false, n = 0;   /* the state at the tap, worked out now (the last one kept may be a few keys old) */\n"
     "    function quit(){ stop = true; document.removeEventListener('input', quit, true); document.removeEventListener('keydown', quit, true); }\n"
     "    document.addEventListener('input', quit, true); document.addEventListener('keydown', quit, true);\n"
     "    (function look(){ if (stop) return; Promise.resolve(S.now()).then(function(sig){ if (stop) return;\n"
     "      if (was === null) was = sig; else if (sig !== was) { quit(); done(); return; }\n"
     "      if (++n < 100) setTimeout(look, 300); else quit(); }, function(){ if (!stop && ++n < 100) setTimeout(look, 300); }); })();\n"
     "  }\n"),
]


def fail(msg):
    sys.exit('patch-autosave.py: ' + msg)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def source(name):
    t = read(os.path.join(BLOCKS, name))
    low = t.lower()
    for bad in ('</script', '<!--', 'newsome behavioral health', 'cf-1'):
        if bad in low:
            fail(name + ' must not contain ' + repr(bad))
    fam = '|'.join(w[::-1] for w in ('supo', 'tennos', 'ukiah'))   # the families, spelled backwards so this file names none
    m = re.search('cl' + 'aude-[a-z]+-\\d|\\b(' + fam + ')\\b', t, re.I)
    if m:
        fail(name + ' must not carry a model name (' + repr(m.group(0)) + ')')
    return t


def pairs(text, region, plist, what, rel):
    """apply (old, new) pairs inside text[region]; each must be done already or be there exactly once. old may be a
    tuple: the original text and earlier versions of the change, any one of which is replaced"""
    a, b = region
    part = text[a:b]
    for old, new in plist:
        if new in part:
            continue
        olds = old if isinstance(old, tuple) else (old,)
        found = [o for o in olds if part.count(o) == 1]
        if len(found) != 1:
            fail(f'{rel}: {what}: expected the text to change exactly once, found it {[part.count(o) for o in olds]} times: {olds[0][:70]!r}')
        part = part.replace(found[0], new)
    return text[:a] + part + text[b:]


def region(text, start, rel, what):
    i = text.find(start)
    if i < 0:
        fail(f'{rel}: no {what}')
    j = text.find('</script>', i)
    return i, j


def patch_form(s, rel, block):
    i, j = region(s, '/* ============ workstation bridge ============', rel, 'workstation bridge')
    s = pairs(s, (i, j), BRIDGE, 'bridge', rel)
    i, j = region(s, '<script id="nbh-guard">', rel, 'nbh-guard block')
    s = pairs(s, (i, j), GUARD, 'guard', rel)
    n = s.count(TAG)
    if n > 1:
        fail(f'{rel}: {n} copies of the nbh-autosave block')
    if n:
        a = s.index(TAG) + 1; b = s.index(CLOSE, a) + len(CLOSE)
        s = s[:a] + LOADER + s[b:]
    else:
        at = s.find('\n<style id="nbh-polish-css"')
        if at < 0:
            at = s.rfind('\n</body>')
        if at < 0 or s.count('</body>') != 1:
            fail(f'{rel}: expected one </body>')
        s = s[:at] + '\n' + LOADER + s[at:]
    if s.count(TAG) != 1 or s.count(LOADER) != 1 or block in s:
        fail(f'{rel}: not exactly one loader of the block after patching')
    return s


def main(argv):
    check = False; files = []
    for a in argv:
        if a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        elif a == '--check':
            check = True
        elif a.startswith('-'):
            fail('unknown option ' + a + '; see --help')
        else:
            files.append(a)
    core = source('nbh-copies.js'); part = source('nbh-autosave.js')
    block = OPEN + '\n' + HEAD + core.rstrip('\n') + '\n' + part.rstrip('\n') + '\n' + CLOSE
    if not files:
        files = sorted(glob.glob(os.path.join(ROOT, 'NBH-Workstation', '[A-Z]*.html')))
        # v21.78 as many as index.html's FORMS list names (it was a fixed 44)
        idx = read(os.path.join(ROOT, 'NBH-Workstation', 'index.html'))
        mm = re.search(r'const FORMS=(\[[\s\S]*?\n\]);', idx)
        n = len(re.findall(r"\['[A-Z0-9]+-\d+',", mm.group(1))) if mm else -1
        if len(files) != n:
            fail(f'expected the {n} forms in NBH-Workstation, found {len(files)}')
    stale = []; done = 0; folders = []
    for f in files:
        path = os.path.abspath(f); rel = os.path.relpath(path, ROOT)
        s = read(path); t = patch_form(s, rel, block)
        if os.path.dirname(path) not in folders:
            folders.append(os.path.dirname(path))
        if t != s:
            stale.append(rel)
            if not check:
                write(path, t)
        done += 1
    # v21.84 the block itself, once beside the forms: the text the inline copy held, byte for byte
    body = block[len(OPEN):-len(CLOSE)]
    for d in folders:
        fp = os.path.join(d, FILE)
        if not os.path.isfile(fp) or read(fp) != body:
            stale.append(os.path.relpath(fp, ROOT))
            if not check:
                write(fp, body)
    # the guard's source
    gpath = os.path.join(BLOCKS, 'nbh-guard.html'); g = read(gpath)
    i, j = region(g, '<script id="nbh-guard">', 'tools/blocks/nbh-guard.html', 'nbh-guard script')
    g2 = pairs(g, (i, j), GUARD, 'guard', 'tools/blocks/nbh-guard.html')
    if g2 != g:
        stale.append('tools/blocks/nbh-guard.html')
        if not check:
            write(gpath, g2)
    # the workstation's copy of the store
    ipath = os.path.join(ROOT, 'NBH-Workstation', 'index.html'); s = read(ipath)
    if s.count(CORE_A) != 1 or s.count(CORE_B) != 1 or s.index(CORE_A) > s.index(CORE_B):
        fail('NBH-Workstation/index.html: the autosave section has no "nbh-copies core" markers (it predates v21.44)')
    a = s.index(CORE_A) + len(CORE_A); b = s.index(CORE_B)
    t = s[:a] + core.rstrip('\n') + '\n' + s[b:]
    if t != s:
        stale.append('NBH-Workstation/index.html')
        if not check:
            write(ipath, t)
    if check:
        if stale:
            print('not current:\n  ' + '\n  '.join(stale)); sys.exit(1)
        print(f'current: {done} forms, the guard source and index.html')
    else:
        print(f'{len(stale)} file(s) patched, {done} forms checked' + ((':\n  ' + '\n  '.join(stale)) if stale else ''))


if __name__ == '__main__':
    main(sys.argv[1:])
