#!/usr/bin/env python3
"""Build tools/pictos/nbh-pictos.js: the pictogram library shared by the forms (OpenMoji, CC BY-SA 4.0,
plus composed pictograms). usage: build-pictos.py <openmoji package dir> [out.js]"""
import json, re, sys, os
pkg = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), 'nbh-pictos.js')
spec = json.load(open(os.path.join(os.path.dirname(__file__), 'pictos.json'), encoding='utf-8'))
def inner(hexcode):
    p = os.path.join(pkg, 'color', 'svg', hexcode + '.svg')
    if not os.path.exists(p): raise SystemExit('missing ' + hexcode)
    s = open(p, encoding='utf-8').read()
    s = re.sub(r'<\?xml[^>]*\?>', '', s); s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    m = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S); body = m.group(1)
    body = re.sub(r'\s+id="[^"]*"', '', body)                      # ids collide once inlined
    body = re.sub(r'<g id="grid"[^>]*>.*?</g>', '', body, flags=re.S)
    body = re.sub(r'<g[^>]*>\s*</g>', '', body)                     # empty groups (skintone, hair placeholders)
    body = re.sub(r'\s+', ' ', body).replace('> <', '><').strip()
    return body
def wrap(parts):
    """parts: list of (hexcode, transform) placed in a 72x72 box; returns inner svg."""
    return ''.join('<g transform="%s">%s</g>' % (t, inner(h)) if t else inner(h) for h, t in parts)
LINE = 'fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
COMP = {
  # a figure on a chair: chair + student bust scaled onto it
  'sitting': wrap([('1FA91', 'translate(6 14) scale(0.85)'), ('1F9D1', 'translate(22 8) scale(0.5)')]),
  'walkingfeet': wrap([('1F6B6-200D-27A1-FE0F', 'translate(4 2) scale(0.9)')]) + '<path d="M8 66 h56" ' + LINE + ' stroke-dasharray="4 4"/>',
  'waiting': wrap([('1F9CD', 'translate(2 6) scale(0.8)'), ('23F3', 'translate(40 30) scale(0.45)')]),
  'break': wrap([('1FA91', 'translate(4 22) scale(0.65)'), ('23F8', 'translate(38 10) scale(0.5)')]),
  'askhelp': wrap([('1F64B', 'translate(0 4) scale(0.9)'), ('2753', 'translate(46 2) scale(0.35)')]),
  'stayarea': '<rect x="6" y="6" width="60" height="60" rx="4" ' + LINE + ' stroke-dasharray="5 4"/>' + wrap([('1F9CD', 'translate(14 10) scale(0.72)')]),
  'eyes': wrap([('1F440', 'translate(2 20) scale(0.5)'), ('1F9D1-200D-1F3EB', 'translate(34 4) scale(0.55)')]),
  'kindwords': wrap([('1F4AC', 'translate(4 6) scale(0.9)'), ('2764', 'translate(24 20) scale(0.4)')]),
  'lineup': wrap([('1F9CD', 'translate(-2 14) scale(0.5)'), ('1F9CD', 'translate(18 14) scale(0.5)'), ('1F9CD', 'translate(38 14) scale(0.5)')]) + '<path d="M60 40 h8" ' + LINE + '/><path d="M64 36 l4 4 -4 4" ' + LINE + '/>',
  'myturn': wrap([('1F9D1', 'translate(2 10) scale(0.6)'), ('1F449', 'translate(40 20) scale(0.45)')]),
  'follow': wrap([('1F9D1-200D-1F3EB', 'translate(0 4) scale(0.6)'), ('27A1', 'translate(40 26) scale(0.35)')]),
  'feetfloor': wrap([('1F9B6', 'translate(10 8) scale(0.75)')]) + '<path d="M6 64 h60" ' + LINE + '/>',
  'washhands': wrap([('1F9FC', 'translate(4 4) scale(0.55)'), ('1F450', 'translate(26 24) scale(0.62)')]),
  'papertowel': '<rect x="14" y="10" width="44" height="12" rx="3" fill="#D0CFCE" stroke="#000" stroke-width="2"/><path d="M18 22 v38 h36 v-38" fill="#FFFFFF" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M24 30 h24 M24 38 h24 M24 46 h24" ' + LINE + '/>',
  'brush': '<rect x="30" y="34" width="12" height="32" rx="5" fill="#A57939" stroke="#000" stroke-width="2"/><ellipse cx="36" cy="22" rx="20" ry="13" fill="#6A462F" stroke="#000" stroke-width="2"/>' + ''.join('<circle cx="%d" cy="%d" r="1.5" fill="#FFF"/>' % (x, y) for x in range(22, 52, 6) for y in (17, 23, 29)),
  'deodorant': '<rect x="24" y="22" width="24" height="42" rx="6" fill="#9B9B9A" stroke="#000" stroke-width="2"/><circle cx="36" cy="20" r="11" fill="#D0CFCE" stroke="#000" stroke-width="2"/>',
  'towel': '<path d="M12 12 h48 v12 h-48 z M12 24 h48 v12 h-48 z M12 36 h48 v12 h-48 z M12 48 h48 v12 h-48 z" fill="#F4AA41" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 24 h48 M12 36 h48 M12 48 h48" ' + LINE + '/>',
  'tissue': '<rect x="12" y="30" width="48" height="30" rx="4" fill="#92D3F5" stroke="#000" stroke-width="2"/><path d="M26 30 q10 -18 20 0" fill="#FFFFFF" stroke="#000" stroke-width="2"/>',
  'circle': wrap([('1F9D1', 'translate(26 2) scale(0.3)'), ('1F9D1', 'translate(46 16) scale(0.3)'), ('1F9D1', 'translate(46 38) scale(0.3)'), ('1F9D1', 'translate(26 50) scale(0.3)'), ('1F9D1', 'translate(6 38) scale(0.3)'), ('1F9D1', 'translate(6 16) scale(0.3)')]),
  'desk': wrap([('1FA91', 'translate(2 26) scale(0.6)'), ('1F4DD', 'translate(32 8) scale(0.5)')]) + '<path d="M30 46 h38 v4 h-38 z" fill="#A57939" stroke="#000" stroke-width="2"/><path d="M34 50 v16 M64 50 v16" ' + LINE + '/>',
  'classroom': wrap([('1F3EB', 'translate(2 2) scale(0.6)'), ('1F9D1-200D-1F3EB', 'translate(40 30) scale(0.5)')]),
  'swing': '<path d="M10 66 L22 10 M62 66 L50 10 M14 10 h44" ' + LINE + '/><path d="M28 14 v30 M44 14 v30" ' + LINE + '/><rect x="24" y="44" width="24" height="6" rx="2" fill="#A57939" stroke="#000" stroke-width="2"/>',
  'helper': wrap([('1F9D1-200D-1F3EB', 'translate(0 4) scale(0.6)'), ('1F9D1', 'translate(38 22) scale(0.5)')]) + '<path d="M38 20 l6 -6" ' + LINE + '/>',
  'first': '<rect x="6" y="6" width="60" height="60" rx="6" fill="#B1CC33" stroke="#000" stroke-width="2"/><text x="36" y="52" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="#000">1</text>',
  'then': '<rect x="6" y="6" width="60" height="60" rx="6" fill="#92D3F5" stroke="#000" stroke-width="2"/><text x="36" y="52" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="#000">2</text>',
  'now': '<circle cx="36" cy="36" r="28" fill="#FCEA2B" stroke="#000" stroke-width="2"/><path d="M36 14 v22 l14 8" ' + LINE + '/>',
  'countdown': ''.join('<rect x="%d" y="22" width="10" height="28" rx="2" fill="%s" stroke="#000" stroke-width="2"/>' % (8 + i * 12, c) for i, c in enumerate(['#5C9E31', '#B1CC33', '#FCEA2B', '#F4AA41', '#EA5A47'])),
}
def from_file(rel):
    """an SVG kept in tools/pictos/ (FILE:custom/name.svg), drawn into the 72 x 72 box through its own view box. Only
    presentation attributes are allowed: a <style>, a class, an id, a script or a link would leak into the page."""
    p = os.path.join(os.path.dirname(__file__), rel)
    t = open(p, encoding='utf-8').read()
    t = re.sub(r'<\?xml[^>]*\?>', '', t); t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    m = re.search(r'<svg[^>]*\sviewBox="([^"]+)"[^>]*>(.*)</svg>', t, re.S)
    if not m: raise SystemExit(rel + ': no <svg viewBox="...">')
    vb, body = m.group(1), m.group(2)
    if re.search(r'<style|\sclass=|\sid=|<script|href=|\son[a-z]+=', body, re.I): raise SystemExit(rel + ': styles, classes, ids, scripts, links or handlers are not allowed')
    body = re.sub(r'\s+', ' ', body).replace('> <', '><').strip()
    return '<svg x="0" y="0" width="72" height="72" viewBox="%s">%s</svg>' % (vb, body)
items = {}; order = []; total = 0
for entry in spec['items']:
    key, label, cat, src = entry[:4]
    body = COMP[src[5:]] if src.startswith('COMP:') else from_file(src[5:]) if src.startswith('FILE:') else inner(src)
    items[key] = {'l': label, 'c': cat, 's': body}; order.append(key); total += len(body)
    if len(entry) > 4: items[key].update(entry[4])    # flags, e.g. {"w": 1}: a word card (Form TK-1 prints only its label)
js = '/* NBH pictogram library: OpenMoji (https://openmoji.org) CC BY-SA 4.0, with composed pictograms. Built by tools/pictos/build-pictos.py. */\n'
js += 'window.NBH_PICTOS=' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'
js += 'window.NBH_PICTO_CATS=' + json.dumps(spec['cats'], ensure_ascii=False) + ';\nwindow.NBH_PICTO_ORDER=' + json.dumps(order) + ';\n'
js += 'window.NBH_PICTO_LICENSE=' + json.dumps(spec['_license']) + ';\n'
js += 'window.picto=function(k,cls,extra){var p=window.NBH_PICTOS[k];if(!p)return "";return \'<svg class="\'+(cls||"ic")+\'" viewBox="0 0 72 72" aria-hidden="true"\'+(extra||"")+\'>\'+p.s+"</svg>";};\n'
open(out, 'w', encoding='utf-8').write(js)
print('wrote', out, len(items), 'pictos,', round(os.path.getsize(out) / 1024), 'KB; mean body', round(total / len(items)), 'chars')
