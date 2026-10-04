#!/usr/bin/env python3
"""Import picture cards drawn in Illustrator (one card per SVG: a white rounded frame, the label at the top in Georgia,
the picture below) into the shared picture library.

usage: python3 tools/pictos/import-cards.py CARD KEY "LABEL" CATEGORY AFTER_KEY [CARD KEY "LABEL" CATEGORY AFTER_KEY ...]
       CARD is a card .svg, or a picture (.png, .webp, .jpg): a card saved as one picture (the frame and the label drawn
       into it) is cut out of its frame below its label; a label at the top of a picture with no frame (the practice's
       navy label, and its underline) is cut off too; a picture with its own transparency is otherwise trimmed as it is

For each card it writes tools/pictos/custom/KEY.svg and adds [KEY, LABEL, CATEGORY, "FILE:custom/KEY.svg"] to
tools/pictos/pictos.json after AFTER_KEY (an entry already there is left as it is). Then rebuild the library:
    python3 tools/pictos/build-pictos.py <openmoji package dir> tools/pictos/nbh-pictos.js
    cp tools/pictos/nbh-pictos.js NBH-Workstation/nbh-pictos.js

The frame (the card-sized rounded rectangle) and the label (the large Georgia text) are left out: Form TK-1 prints the
label above the picture itself. A card whose picture is an embedded raster image is rendered (with its transparency and
any shapes drawn over or under it), trimmed, scaled to 600 px on its long side (about 300 dpi on a 2 in card picture)
and kept as WebP. A card drawn in vector shapes keeps them as vectors: the stylesheet's classes become presentation
attributes (the library refuses classes, which would leak into the page) and each font list gets a generic fallback.
A card saved as one picture (no transparency: a dark rounded frame round it, the label at the top) loses the frame and
the label; the white round the picture becomes clear, softly, so its shadows still fall over a coloured tile (pale parts
of the picture that start with a clear edge stay as they are); the picture is then trimmed and scaled the same way.
A card drawn with gradients, clipping paths, masks or patterns (they need ids, which the library refuses) is rendered
like a raster card.
Rendering uses the Playwright Chromium the qa/ scripts use (node, qa/lib.js); WebP encoding uses Pillow (and numpy for
cards saved as one picture).
"""
import base64, io, json, os, re, subprocess, sys, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
MARGIN = 0.015                       # around the picture, of its long side
LONG = 600                           # px, raster pictures

NODE_RENDER = r"""
const {chromium}=require(process.argv[2]);const fs=require('fs');
(async()=>{const [,, ,src,out,mode]=process.argv;const svg=fs.readFileSync(src,'utf8');
  const vb=/viewBox="([^"]+)"/.exec(svg)[1].split(/[\s,]+/).map(Number);
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:Math.ceil(vb[2]),height:Math.ceil(vb[3])},deviceScaleFactor:8});
  await p.setContent('<!doctype html><html><body style="margin:0;background:transparent">'+svg.replace(/<\?xml[^>]*\?>/,'').replace('<svg ','<svg style="display:block;width:'+vb[2]+'px;height:'+vb[3]+'px" ')+'</body></html>');
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const s=document.querySelector('svg');
    /* the frame: the largest rounded rectangle; the label: the largest-type text at the top */
    const vb=s.viewBox.baseVal,rects=[...s.querySelectorAll('rect')].map(e=>({e,a:e.getBBox().width*e.getBBox().height})).sort((x,y)=>y.a-x.a);const frame=!!(rects[0]&&parseFloat(rects[0].e.getAttribute('rx')||0)>0&&rects[0].a>0.3*vb.width*vb.height);if(frame)rects[0].e.remove();
    const texts=[...s.querySelectorAll('text')].map(e=>({e,fs:parseFloat(getComputedStyle(e).fontSize)||0,y:e.getBBox().y,ff:getComputedStyle(e).fontFamily}));
    const lab=texts.filter(t=>/georgia/i.test(t.ff)).sort((x,y)=>y.fs-x.fs||x.y-y.y)[0];const label=lab?lab.e.textContent.trim():'';if(lab)lab.e.remove();
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;[...s.children].forEach(e=>{if(/^(defs|style|title|desc)$/i.test(e.tagName))return;const q=e.getBoundingClientRect();if(!q.width&&!q.height)return;x0=Math.min(x0,q.left);y0=Math.min(y0,q.top);x1=Math.max(x1,q.right);y1=Math.max(y1,q.bottom);});
    return {label,frame,box:{x:x0,y:y0,w:x1-x0,h:y1-y0}};});
  if(mode==='png')await p.screenshot({path:out,omitBackground:true,clip:{x:r.box.x,y:r.box.y,width:r.box.w,height:r.box.h}});
  fs.writeFileSync(mode==='png'?out+'.json':out,JSON.stringify(r));
  await b.close();})();
"""

def node(script_args):
    lib = os.path.join(REPO, 'qa', 'lib.js')
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as t:
        t.write(NODE_RENDER); js = t.name
    try:
        subprocess.run(['node', js, lib] + script_args, check=True)
    finally:
        os.unlink(js)

def styles(svg):
    """class -> {property: value} from the card's <style> block (Illustrator's simple .a, .b { ... } rules)"""
    css = {}
    for sel, body in re.findall(r'([^{}]+)\{([^}]*)\}', ''.join(re.findall(r'<style[^>]*>(.*?)</style>', svg, re.S))):
        props = dict((k.strip(), v.strip()) for k, v in (d.split(':', 1) for d in body.split(';') if ':' in d))
        for c in re.findall(r'\.([\w-]+)', sel):
            css.setdefault(c, {}).update(props)
    return css

FALLBACK = {'georgia': "Georgia,'Georgia Pro','Times New Roman',serif", 'myriad': 'Arial,Helvetica,sans-serif',
            'times': 'Times,serif', 'arial': 'Helvetica,sans-serif', 'helvetica': 'Arial,sans-serif'}
def font_list(v):
    v = re.sub(r'\s*,\s*', ',', v.strip())
    low = v.lower()
    if re.search(r'(^|,)(serif|sans-serif|monospace|cursive|fantasy)$', low): return v
    for k, fb in FALLBACK.items():
        if k in low: return v + ',' + fb
    return v + ',sans-serif'

def vector_picture(svg, label_box_json):
    """the card's shapes without the frame and the label, classes turned into attributes, in a view box around them"""
    css = styles(svg)
    body = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
    body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
    body = re.sub(r'<defs>.*?</defs>', '', body, flags=re.S)
    info = json.loads(label_box_json)
    # drop the frame (the largest rect: the first rect in these files) and the label text (Georgia, at the top)
    rects = list(re.finditer(r'<rect\b[^>]*/>', body))
    if rects and info.get('frame'):
        def area(m):
            w = re.search(r'\bwidth="([\d.]+)"', m.group(0)); h = re.search(r'\bheight="([\d.]+)"', m.group(0))
            return float(w.group(1)) * float(h.group(1)) if w and h else 0
        big = max(rects, key=area); body = body[:big.start()] + body[big.end():]
    if info.get('label'):
        for m in re.finditer(r'<text\b.*?</text>', body, re.S):
            if re.sub(r'<[^>]+>', '', m.group(0)).strip() == info['label']:
                body = body[:m.start()] + body[m.end():]; break
    ATTR = {'fill': 'fill', 'stroke': 'stroke', 'stroke-width': 'stroke-width', 'stroke-miterlimit': 'stroke-miterlimit',
            'stroke-linecap': 'stroke-linecap', 'stroke-linejoin': 'stroke-linejoin', 'fill-rule': 'fill-rule', 'clip-rule': 'clip-rule',
            'opacity': 'opacity', 'fill-opacity': 'fill-opacity', 'stroke-opacity': 'stroke-opacity', 'font-family': 'font-family',
            'font-size': 'font-size', 'font-weight': 'font-weight', 'font-style': 'font-style', 'letter-spacing': 'letter-spacing',
            'text-anchor': 'text-anchor', 'isolation': None, 'mix-blend-mode': None}
    def repl(m):
        cls = m.group(2).split(); props = {}
        for c in cls: props.update(css.get(c, {}))
        out = []
        for k, v in props.items():
            a = ATTR.get(k, False)
            if a is None or a is False: continue
            if a == 'font-family': v = font_list(v)
            v = v.replace('"', "'")
            if a in ('font-size', 'stroke-width', 'letter-spacing') and v.endswith('px'): v = v[:-2]
            if a == 'letter-spacing' and v.endswith('em'):
                fs = float(str(props.get('font-size', '16')).rstrip('px') or 16); v = '%.3f' % (float(v[:-2]) * fs)
            out.append('%s="%s"' % (a, v))
        return m.group(1) + ' '.join(out)
    body = re.sub(r'(<[a-zA-Z]+\b[^>]*?)\bclass="([^"]+)"', repl, body)
    body = re.sub(r'\s+id="[^"]*"', '', body).replace('data-name="Layer 1"', '')
    body = re.sub(r'\s+', ' ', body).replace('> <', '><').strip()
    b = info['box']; m = MARGIN * max(b['w'], b['h'])
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.2f %.2f %.2f %.2f">%s</svg>' % (b['x'] - m, b['y'] - m, b['w'] + 2 * m, b['h'] + 2 * m, body)

def raster_picture(card, png):
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').getbbox(); im = im.crop(bb)
    if white_surround(im): im = trim_clear(clear_white(im))        # a JPEG on its white background: clear it as well
    return webp_svg(im)

def white_surround(im):
    """True when the picture's edge is opaque near-white all round (a photo on a white background, no transparency)"""
    import numpy as np
    a = np.asarray(im.convert('RGBA')).astype(np.int32)
    e = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    return bool(((e[:, 3] >= 250) & (255 - e[:, :3].min(axis=1) <= 8)).mean() >= 0.9)

def webp_svg(im):
    """an RGBA picture, already trimmed: scaled to LONG px on its long side, kept as WebP inside an SVG with a margin"""
    s = LONG / max(im.size); im = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6); W, H = im.size; m = round(MARGIN * max(W, H))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%d %d %d %d"><image width="%d" height="%d" href="data:image/webp;base64,%s"/></svg>'
            % (-m, -m, W + 2 * m, H + 2 * m, W, H, base64.b64encode(buf.getvalue()).decode()))

# ---- a card saved as one picture: the frame and the label are drawn into it ----
def _grow(seed, allowed, conn8=False):
    """every allowed pixel joined to the seed"""
    m = seed & allowed
    while True:
        n = m.copy(); n[1:] |= m[:-1]; n[:-1] |= m[1:]; n[:, 1:] |= m[:, :-1]; n[:, :-1] |= m[:, 1:]
        if conn8: n[1:, 1:] |= m[:-1, :-1]; n[:-1, :-1] |= m[1:, 1:]; n[1:, :-1] |= m[:-1, 1:]; n[:-1, 1:] |= m[1:, :-1]
        n &= allowed
        if (n == m).all(): return m
        m = n

def _edges(shape):
    import numpy as np
    e = np.zeros(shape, bool); e[0, :] = e[-1, :] = e[:, 0] = e[:, -1] = True
    return e

def flat_card(path):
    """(the picture with the frame and the label whitened out, the label's rows), or None when no frame runs round it"""
    import numpy as np
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32); H, W, _ = a.shape
    dark = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000 < 128
    lim = max(4, round(0.06 * min(H, W))); seed = np.zeros_like(dark)
    # the frame is the first dark line met from each edge along the middle lines, and it runs round the card
    for line, at in ((dark[:lim, W // 2], lambda i: (i, W // 2)), (dark[::-1, W // 2][:lim], lambda i: (H - 1 - i, W // 2)),
                     (dark[H // 2, :lim], lambda i: (H // 2, i)), (dark[H // 2, ::-1][:lim], lambda i: (H // 2, W - 1 - i))):
        hit = np.where(line)[0]
        if len(hit) < 3: return None
        seed[at(hit[0])] = True
    ring = _grow(seed, dark, conn8=True); ys, xs = np.where(ring)
    if ys.min() > lim or xs.min() > lim or ys.max() < H - 1 - lim or xs.max() < W - 1 - lim or ring.mean() > 0.2: return None
    for _ in range(2):                                    # and its smoothed edge
        n = ring.copy(); n[1:] |= ring[:-1]; n[:-1] |= ring[1:]; n[:, 1:] |= ring[:, :-1]; n[:, :-1] |= ring[:, 1:]; ring = n
    inside = ~(ring | _grow(_edges(ring.shape), ~ring))
    ink = 255 - a.min(axis=2); ink[~inside] = 0
    rows = (ink > 60).sum(axis=1); ys = np.where(inside.any(axis=1))[0]; top, bottom = int(ys[0]), int(ys[-1])
    lab = None; y = top                                   # the label: the first band of strong ink near the top,
    while y < top + 0.3 * (bottom - top):                 # in the navy of the practice's labels
        if rows[y]:
            s, gap = y, 0
            while y <= bottom and gap < 6: gap = gap + 1 if rows[y] == 0 else 0; y += 1
            band = a[s:y - gap][(ink[s:y - gap] > 60)]
            navy = (band[:, 2] - band[:, 0] > 30) & (band[:, 2] > band[:, 1] + 15) if len(band) else band
            if len(band) and navy.mean() >= 0.5: lab = (s, y - gap)
            break
        y += 1
    out = a.copy(); out[~inside] = 255
    if lab: out[:lab[1] + 3] = 255
    return Image.fromarray(out.astype(np.uint8), 'RGB'), lab

def clear_white(im, lo=4, hi=28, step=3):
    """the white round the picture made clear, softly. The clear part grows in from the edges through near-white pixels
    whose shade changes gently from pixel to pixel: a shadow fading out over the table is reached (and keeps its look on
    white), while a pale part of the picture that starts with a step (a page, a cloud, a white shirt) is not."""
    import numpy as np
    from PIL import ImageFilter
    im = Image.alpha_composite(Image.new('RGBA', im.size, (255, 255, 255, 255)), im.convert('RGBA'))   # clear parts count as white
    a = np.asarray(im.convert('RGB')).astype(np.float64); ink = 255 - a.min(axis=2)
    sm = np.asarray(Image.fromarray(ink.astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(np.float64)
    near = ink <= hi; bg = _edges(near.shape) & near
    dv = np.abs(sm[1:] - sm[:-1]) <= step; dh = np.abs(sm[:, 1:] - sm[:, :-1]) <= step
    while True:
        n = bg.copy(); n[1:] |= bg[:-1] & dv; n[:-1] |= bg[1:] & dv; n[:, 1:] |= bg[:, :-1] & dh; n[:, :-1] |= bg[:, 1:] & dh
        n &= near
        if (n == bg).all(): break
        bg = n
    al = np.ones(ink.shape); al[bg] = np.clip((ink[bg] - lo) / (hi - lo), 0, 1)
    with np.errstate(divide='ignore', invalid='ignore'):
        un = 255 - (255 - a) / np.maximum(al, 1e-6)[..., None]     # the colour that shows the same over white
    a[bg] = np.clip(un[bg], 0, 255); a[al == 0] = 255
    return Image.fromarray(np.dstack([a, al * 255]).round().astype(np.uint8), 'RGBA')

def trim_clear(im, a_min=0.3, n=3):
    """trimmed to the rows and columns with at least n pixels at least a_min opaque (stray specks do not count)"""
    import numpy as np
    m = np.asarray(im.getchannel('A')) >= a_min * 255
    r = np.where(m.sum(axis=1) >= n)[0]; c = np.where(m.sum(axis=0) >= n)[0]
    return im.crop((int(c[0]), int(r[0]), int(c[-1]) + 1, int(r[-1]) + 1))

def label_rows(im):
    """the rows of a label at the top of a picture with no frame (the practice's navy label, and the line under it when
    there is one): (first, last), or None"""
    import numpy as np
    a = np.asarray(Image.alpha_composite(Image.new('RGBA', im.size, (255, 255, 255, 255)), im.convert('RGBA')).convert('RGB')).astype(np.int32)
    ink = 255 - a.min(axis=2); rows = (ink > 60).sum(axis=1); H = len(rows)
    def band(y):                                          # the next band of ink from row y: (start, end) or None
        while y < H and not rows[y]: y += 1
        if y >= H: return None
        s, gap = y, 0
        while y < H and gap < 6: gap = gap + 1 if rows[y] == 0 else 0; y += 1
        return s, y - gap
    def navy(s, e):
        px = a[s:e][ink[s:e] > 60]
        return len(px) > 0 and ((px[:, 2] - px[:, 0] > 30) & (px[:, 2] > px[:, 1] + 15)).mean() >= 0.5
    b = band(0)
    if not b or b[0] > 0.15 * H or b[1] > 0.3 * H or not navy(*b): return None
    u = band(b[1] + 1)                                    # an underline: a thin navy band right below the words
    if u and u[1] - u[0] <= 0.03 * H and u[0] - b[1] <= 0.06 * H and navy(*u): b = (b[0], u[1])
    return b

def picture_file(path):
    """a .png, .webp or .jpg: (svg, kind)"""
    name = os.path.basename(path)
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'PA') or 'transparency' in im.info:
        im = im.convert('RGBA')
        if im.getchannel('A').getextrema()[0] < 255:
            lab = label_rows(im)
            if not lab: return raster_picture(path, path), 'image'
            print('  %s: label rows %d-%d cut off' % (name, lab[0], lab[1]))
            im = im.crop((0, lab[1] + 3, im.size[0], im.size[1])); return webp_svg(im.crop(im.getchannel('A').getbbox())), 'image'
    fc = flat_card(path)
    if fc:
        pic, lab = fc
        print('  %s: frame found, label rows %s cut off' % (name, '%d-%d' % lab if lab else 'none'))
        return webp_svg(trim_clear(clear_white(pic))), 'flat card'
    im = im.convert('RGBA')
    if not white_surround(im): raise SystemExit(path + ': no transparency, no card frame and no white round it; save it with a clear background')
    lab = label_rows(im)
    if lab:
        print('  %s: label rows %d-%d cut off' % (name, lab[0], lab[1]))
        im = Image.alpha_composite(Image.new('RGBA', im.size, (255, 255, 255, 255)), im); im.paste((255, 255, 255, 255), (0, 0, im.size[0], lab[1] + 3))
    return webp_svg(trim_clear(clear_white(im))), 'flat card' if lab else 'image'

def main(argv):
    if len(argv) == 0 or len(argv) % 5: raise SystemExit(__doc__)
    spec_path = os.path.join(HERE, 'pictos.json'); spec = json.loads(open(spec_path, encoding='utf-8').read())
    for i in range(0, len(argv), 5):
        card, key, label, cat, after = argv[i:i + 5]
        if cat not in spec['cats']: raise SystemExit('unknown category ' + cat + ' (one of ' + ', '.join(spec['cats']) + ')')
        left_out = False
        if card.lower().endswith(('.png', '.webp', '.jpg', '.jpeg')):
            out, kind = picture_file(card)                            # trimmed (or cut out of its frame), scaled, WebP
            left_out = kind == 'flat card'                            # the frame and/or the label were cut off
        else:
            svg = open(card, encoding='utf-8').read()
            with tempfile.TemporaryDirectory() as d:
                src = os.path.join(d, 'card.svg'); open(src, 'w', encoding='utf-8').write(svg)
                if re.search(r'<image\b|url\(#|<(?:linearGradient|radialGradient|clipPath|mask|pattern|filter)\b', svg):
                    png = os.path.join(d, 'pic.png'); node([src, png, 'png']); out = raster_picture(card, png); kind = 'raster'
                    info = json.load(open(png + '.json'))
                else:
                    js = os.path.join(d, 'box.json'); node([src, js, 'box']); out = vector_picture(svg, open(js).read()); kind = 'vector'
                    info = json.load(open(js))
                left_out = bool(info.get('frame') or info.get('label'))
        name = re.sub(r'^[0-9a-f]{8}-', '', os.path.basename(card))          # an upload's prefix is not part of the name
        gone = ' without the card frame and label;' if left_out else ''
        note = ('<?xml version="1.0" encoding="UTF-8"?>\n<!-- %s: the picture from the user\'s file %s (%s),%s\n'
                '     written by tools/pictos/import-cards.py. -->\n' % (label, name, kind, gone))
        open(os.path.join(HERE, 'custom', key + '.svg'), 'w', encoding='utf-8').write(note + out + '\n')
        keys = [e[0] for e in spec['items']]
        if key not in keys:
            if after not in keys: raise SystemExit('no entry ' + after + ' to place ' + key + ' after')
            spec['items'].insert(keys.index(after) + 1, [key, label, cat, 'FILE:custom/' + key + '.svg'])
        print('%-16s %-12s %-6s %-7s %6d bytes' % (key, label, cat, kind, len(out)))
    open(spec_path, 'w', encoding='utf-8').write(json.dumps(spec, ensure_ascii=False, indent=0))

if __name__ == '__main__':
    main(sys.argv[1:])
