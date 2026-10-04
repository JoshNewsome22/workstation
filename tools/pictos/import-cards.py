#!/usr/bin/env python3
"""Import picture cards drawn in Illustrator (one card per SVG: a white rounded frame, the label at the top in Georgia,
the picture below) into the shared picture library.

usage: python3 tools/pictos/import-cards.py CARD.svg KEY "LABEL" CATEGORY AFTER_KEY [CARD.svg KEY "LABEL" CATEGORY AFTER_KEY ...]

For each card it writes tools/pictos/custom/KEY.svg and adds [KEY, LABEL, CATEGORY, "FILE:custom/KEY.svg"] to
tools/pictos/pictos.json after AFTER_KEY (an entry already there is left as it is). Then rebuild the library:
    python3 tools/pictos/build-pictos.py <openmoji package dir> tools/pictos/nbh-pictos.js
    cp tools/pictos/nbh-pictos.js NBH-Workstation/nbh-pictos.js

The frame (the card-sized rounded rectangle) and the label (the large Georgia text) are left out: Form TK-1 prints the
label above the picture itself. A card whose picture is an embedded raster image is rendered (with its transparency and
any shapes drawn over or under it), trimmed, scaled to 600 px on its long side (about 300 dpi on a 2 in card picture)
and kept as WebP. A card drawn in vector shapes keeps them as vectors: the stylesheet's classes become presentation
attributes (the library refuses classes, which would leak into the page) and each font list gets a generic fallback.
Rendering uses the Playwright Chromium the qa/ scripts use (node, qa/lib.js); WebP encoding uses Pillow.
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
    const rects=[...s.querySelectorAll('rect')].map(e=>({e,a:e.getBBox().width*e.getBBox().height})).sort((x,y)=>y.a-x.a);if(rects[0])rects[0].e.remove();
    const texts=[...s.querySelectorAll('text')].map(e=>({e,fs:parseFloat(getComputedStyle(e).fontSize)||0,y:e.getBBox().y,ff:getComputedStyle(e).fontFamily}));
    const lab=texts.filter(t=>/georgia/i.test(t.ff)).sort((x,y)=>y.fs-x.fs||x.y-y.y)[0];const label=lab?lab.e.textContent.trim():'';if(lab)lab.e.remove();
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;[...s.children].forEach(e=>{if(/^(defs|style|title|desc)$/i.test(e.tagName))return;const q=e.getBoundingClientRect();if(!q.width&&!q.height)return;x0=Math.min(x0,q.left);y0=Math.min(y0,q.top);x1=Math.max(x1,q.right);y1=Math.max(y1,q.bottom);});
    return {label,box:{x:x0,y:y0,w:x1-x0,h:y1-y0}};});
  if(mode==='png')await p.screenshot({path:out,omitBackground:true,clip:{x:r.box.x,y:r.box.y,width:r.box.w,height:r.box.h}});
  else fs.writeFileSync(out,JSON.stringify(r));
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
    if rects:
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
    s = LONG / max(im.size); im = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=84, method=6); W, H = im.size; m = round(MARGIN * max(W, H))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%d %d %d %d"><image width="%d" height="%d" href="data:image/webp;base64,%s"/></svg>'
            % (-m, -m, W + 2 * m, H + 2 * m, W, H, base64.b64encode(buf.getvalue()).decode()))

def main(argv):
    if len(argv) == 0 or len(argv) % 5: raise SystemExit(__doc__)
    spec_path = os.path.join(HERE, 'pictos.json'); spec = json.loads(open(spec_path, encoding='utf-8').read())
    for i in range(0, len(argv), 5):
        card, key, label, cat, after = argv[i:i + 5]
        if cat not in spec['cats']: raise SystemExit('unknown category ' + cat + ' (one of ' + ', '.join(spec['cats']) + ')')
        svg = open(card, encoding='utf-8').read()
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, 'card.svg'); open(src, 'w', encoding='utf-8').write(svg)
            if re.search(r'<image\b', svg):
                png = os.path.join(d, 'pic.png'); node([src, png, 'png']); out = raster_picture(card, png); kind = 'raster'
            else:
                js = os.path.join(d, 'box.json'); node([src, js, 'box']); out = vector_picture(svg, open(js).read()); kind = 'vector'
        note = ('<?xml version="1.0" encoding="UTF-8"?>\n<!-- %s: the picture from the user\'s card %s (%s), without the card frame and label;\n'
                '     written by tools/pictos/import-cards.py. -->\n' % (label, os.path.basename(card), kind))
        open(os.path.join(HERE, 'custom', key + '.svg'), 'w', encoding='utf-8').write(note + out + '\n')
        keys = [e[0] for e in spec['items']]
        if key not in keys:
            if after not in keys: raise SystemExit('no entry ' + after + ' to place ' + key + ' after')
            spec['items'].insert(keys.index(after) + 1, [key, label, cat, 'FILE:custom/' + key + '.svg'])
        print('%-16s %-12s %-6s %-7s %6d bytes' % (key, label, cat, kind, len(out)))
    open(spec_path, 'w', encoding='utf-8').write(json.dumps(spec, ensure_ascii=False, indent=0))

if __name__ == '__main__':
    main(sys.argv[1:])
