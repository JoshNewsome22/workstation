"""v21.84 The scripts every form loads from ONE file beside it, instead of carrying a copy of its own.

Until v21.83 every one of the 46 forms carried the same script blocks byte for byte: 21.5 of the folder's 34.8 MB of
forms were these copies, and a change to one of them rewrote every form, so each iPad downloaded about 35 MB again. Each
block below is now a file beside the forms (NBH-Workstation/<file>), and a form carries only its loader,
<script id="<id>" src="<file>"></script>: a classic synchronous script in the place the inline block held, so the order
in which the form's scripts run is unchanged. The offline copy saves the files with the forms (tools/pwa-sw.py lists every
file a page loads, and refuses a form that holds an inline copy again); the school edition's build copies them, the logo
swapped (tools/build-rps.py); the one-file editions put each one back inline as the form is packed (tools/build-single.py),
because a form there opens from srcdoc or a blob, where a relative src loads nothing; so those editions, and the case
files written from them, are what they were.

Each file is written by the tool that writes the block (the third column). A tool that puts the block in a form inline,
as it always did, then calls move_out() to write the file and leave the loader in its place. Files are read and written
without newline translation; a file's text is the inline block's text byte for byte, so build-single.py's copy of a form
is the form as it was. None may hold "</script" or "<!--" (it goes back inline there).

Not moved: the styles (the master print collects every <style> of a form), nbh-pwa-save (the offline worker checks every
page carries it), nbh-guard (tools/blocks/patch-autosave.py edits it inside each form) and the blocks not the same in
every form (the workstation bridge, the packet map, nbh-fit-screen)."""
import os

# (block id, file beside the forms, the tool that writes it), in the order they sit in a form
SHARED = (
    ('nbh-logo', 'nbh-logo.js', 'tools/dedupe-logo.py'),
    ('nbh-wording', 'nbh-wording.js', 'tools/blocks/patch-wording.py'),
    ('nbh-case-flow', 'nbh-case-flow.js', 'tools/blocks/patch-case.py'),
    ('nbh-ui', 'nbh-ui.js', 'tools/blocks/patch-ui.py'),
    ('nbh-field-care', 'nbh-field-care.js', 'tools/blocks/patch-shared.py'),
    ('nbh-autosave', 'nbh-autosave.js', 'tools/blocks/patch-autosave.py'),
    ('nbh-polish', 'nbh-polish.js', 'tools/apply-polish.py'),
)
FILES = tuple(f for _, f, _ in SHARED)
OPEN, CLOSE = '<script id="%s">', '</script>'


class Problem(Exception):
    pass


def file_of(sid):
    for i, f, _ in SHARED:
        if i == sid:
            return f
    raise KeyError(sid)


def loader(sid):
    return '<script id="%s" src="%s"></script>' % (sid, file_of(sid))


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)


def body_of(s, sid):
    """the text of the inline block sid in form text s, or None when it holds none (only the loader, or nothing)"""
    o = OPEN % sid
    if s.count(o) == 0:
        return None
    if s.count(o) > 1:
        raise Problem('%d inline copies of <script id="%s">' % (s.count(o), sid))
    a = s.index(o) + len(o)
    return s[a:s.index(CLOSE, a)]


def check_body(body, sid):
    low = body.lower()
    if '</script' in low or '<!--' in low:
        raise Problem('<script id="%s"> holds </script or <!--, so it could not go back inline in the one-file edition' % sid)


def move_out(s, sid, folder, overwrite=True, check=False):
    """Form text s with its inline <script id="sid"> replaced by the loader, and the block's text written to folder/<file>.
    overwrite: the caller wrote the block from its source, so the file takes it; otherwise a file that holds other text
    stops it (two forms with different copies). check: write nothing. Returns (text, what happened to the file:
    'written' | 'current' | 'stale' | None when the form holds no inline copy)."""
    body = body_of(s, sid)
    if body is None:
        return s, None
    check_body(body, sid)
    path = os.path.join(folder, file_of(sid))
    old = read(path) if os.path.isfile(path) else None
    if old is not None and old != body and not overwrite:
        raise Problem('%s holds other text than this form\'s <script id="%s">: run %s on every form'
                      % (os.path.basename(path), sid, dict((i, t) for i, _, t in SHARED)[sid]))
    o = OPEN % sid
    a = s.index(o)
    b = s.index(CLOSE, a + len(o)) + len(CLOSE)
    out = s[:a] + loader(sid) + s[b:]
    if old == body:
        return out, 'current'
    if check:
        return out, 'stale'
    write(path, body)
    return out, 'written'


def inline(s, folder, sids=None, texts=None):
    """Form text s with each loader put back as the inline block, the file's text byte for byte (the one-file edition).
    Every loader must be there once, with no inline copy beside it."""
    for sid, f, tool in SHARED:
        if sids is not None and sid not in sids:
            continue
        tag = loader(sid)
        if s.count(tag) != 1 or s.count('<script id="%s"' % sid) != 1:
            raise Problem('does not hold exactly one %s (and no other <script id="%s">): run python3 %s on it' % (tag, sid, tool))
        t = texts[f] if texts and f in texts else read(os.path.join(folder, f))
        check_body(t, sid)
        s = s.replace(tag, (OPEN % sid) + t + CLOSE)
    return s


def check_form(s):
    """'' when form text s loads every shared file once and holds no inline copy; else what is wrong"""
    for sid, f, tool in SHARED:
        tag = loader(sid)
        if s.count(tag) != 1 or s.count('<script id="%s"' % sid) != 1:
            return 'does not load %s once by %s (or still holds an inline copy): run python3 %s on it' % (f, tag, tool)
    return ''
