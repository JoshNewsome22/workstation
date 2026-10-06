#!/usr/bin/env python3
"""Measure where each word starts in the TK-1 walkthrough's recorded lines, and write the marks into walk.js (v21.49).

The walkthrough times its captions and its actions to the words of the narration (onsetFn in walk.js): the MK block holds,
for every line, the character each word starts at and the second the voice reaches it, keyed by a hash of the line's text,
so a line whose text changes falls back to its share of the characters until it is measured again. The seconds come from
the voice's own phoneme lengths for that very take: the Kokoro model run with its duration output exposed (the same
weights, so the audio is the same; this script makes model_timed.onnx beside model_quantized.onnx the first time), each
phoneme's start mapped to the word it belongs to. The phonemizer joins some short words ("on the" is one word to it), so
the words of the text are aligned to its words by length, and a joined word's parts share it by their own lengths.

Only lines without marks for their current text are measured, unless named (or --all). A take whose length differs from
the recorded line's is not measured (the audio would not be the same) and the script says so.
usage: TK1_TTS=/path/to/tts tts/venv/bin/python tools/forms/TK-1/make-marks.py [ids ... | --all]   (then sh tools/forms/TK-1/build.sh)"""
import json, os, re, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
TTS = os.environ.get('TK1_TTS') or sys.exit('set TK1_TTS to the folder with model_quantized.onnx and voices.npz (see make-narration.py)')
spec = json.load(open(os.path.join(HERE, 'walk-script.json'), encoding='utf-8'))
voice, speed = spec.get('voice', 'af_heart'), float(spec.get('speed', 0.95))
WALK = os.path.join(HERE, 'walk.js')
src = open(WALK, encoding='utf-8').read()
m = re.search(r'/\* MK:BEGIN \*/const MK=(\{.*?\});/\* MK:END \*/', src, re.S)
assert m, 'no MK block in walk.js'
MK = json.loads(m.group(1))
audio = json.loads(re.search(r'const WALK_AUDIO=(\{.*\});\s*$', open(os.path.join(HERE, 'walk-audio.js'), encoding='utf-8').read(), re.S).group(1))
if os.path.exists(os.path.join(HERE, 'walk-audio-bus.js')):   # the bus ride's lines, in their own file
    audio['lines'].update(json.loads(re.search(r'var A=(\{.*?\});if\(', open(os.path.join(HERE, 'walk-audio-bus.js'), encoding='utf-8').read(), re.S).group(1)))
LEAD, SR, SHIFT = .04, 24000, .05   # the silence before every line; SHIFT: the marks sit at a word's audible start (as the v21.43 marks do)

def fnv(text):
    """walk.js's hash: FNV-1a over the UTF-16 code units, in hex"""
    h = 0x811c9dc5
    b = text.encode('utf-16-le')
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xffffffff
    return format(h, 'x')

timed = os.path.join(TTS, 'model_timed.onnx')
if not os.path.exists(timed):
    import onnx
    from onnx import helper, TensorProto
    g = onnx.load(os.path.join(TTS, 'model_quantized.onnx'))
    g.graph.node.append(helper.make_node('Identity', ['/encoder/Round_output_0'], ['duration'], name='duration_out'))
    g.graph.output.append(helper.make_tensor_value_info('duration', TensorProto.FLOAT, None))
    onnx.save(g, timed)
from kokoro_onnx import Kokoro
k = Kokoro(timed, os.path.join(TTS, 'voices.npz'))
assert k.has_timings, 'the timed model has no duration output'
STRESS = 'ˈˌ'
def plen(p): return len([c for c in p if c not in STRESS and (c.isalpha() or c in 'ːəɚɐᵻɾʔ')]) or 1

def marks(lid, text, d):
    v, ph, batches = k._prepare(text, voice, speed, 'en-us', False, .25, .1)
    if len(batches) != 1: return None, 'more than one batch'
    phon = batches[0][0]
    a, edges = k._create_batch(phon, v, speed, True, 0.0)
    if abs(round((len(a) + int(SR * LEAD) + int(SR * .12)) / SR, 3) - d) > .0005: return None, 'the take is %.3f s, the line %.3f s' % ((len(a) + int(SR * LEAD) + int(SR * .12)) / SR, d)
    known = k.tokenizer.known(phon)
    pw = [(mm.start(), mm.group()) for mm in re.finditer(r'\S+', known) if re.search(r'\w', mm.group())]
    tw = [(mm.start(), mm.group()) for mm in re.finditer(r'\S+', text)]
    tl = [plen(k.tokenizer.phonemize(re.sub(r'[^\w’\']', ' ', w), 'en-us')) for _, w in tw]
    ql = [plen(w) for _, w in pw]
    # align: a phoneme word covers one to three text words, or a text word covers one or two phoneme words
    n, mq, INF = len(tw), len(pw), 1e9
    f = [[INF] * (mq + 1) for _ in range(n + 1)]; bk = [[None] * (mq + 1) for _ in range(n + 1)]; f[0][0] = 0
    for i in range(n + 1):
        for j in range(mq + 1):
            if f[i][j] >= INF: continue
            for a_, b_ in ((1, 1), (2, 1), (3, 1), (1, 2)):
                if i + a_ > n or j + b_ > mq: continue
                L1, L2 = sum(tl[i:i + a_]), sum(ql[j:j + b_])
                c = f[i][j] + abs(L1 - L2) / max(L1, L2) + (.15 if (a_, b_) != (1, 1) else 0)
                if c < f[i + a_][j + b_]: f[i + a_][j + b_] = c; bk[i + a_][j + b_] = (a_, b_)
    if f[n][mq] >= INF: return None, 'no alignment'
    starts = [None] * n; i, j = n, mq
    while i or j:
        a_, b_ = bk[i][j]; i0, j0 = i - a_, j - b_
        p0, pword = pw[j0]
        if a_ == 1: starts[i0] = p0
        else:   # a joined word: its parts share it by their own lengths
            tot = sum(tl[i0:i]); acc = 0; raw = [q for q, ch in enumerate(pword)]
            for q in range(a_):
                starts[i0 + q] = p0 + int(round(len(pword) * acc / tot)); acc += tl[i0 + q]
        i, j = i0, j0
    out = []
    for (ci, _), s in zip(tw, starts):
        if ci == 0: continue
        t = round(LEAD + edges[min(s, len(edges) - 1)] / SR - SHIFT, 2)
        if out and t <= out[-1][1]: continue
        out.append([ci, t])
    return out, ''

force = set(x for x in sys.argv[1:] if x != '--all')
if '--all' in sys.argv[1:]: force = set(audio['lines'])
done = 0
for lid, ln in audio['lines'].items():
    text, d = ln['t'], float(ln['d'])
    if lid not in force and lid in MK and MK[lid].get('h') == fnv(text): continue
    o, why = marks(lid, text, d)
    if o is None: print(f'{lid:>14}  not measured: {why}'); continue
    old = MK.get(lid)
    MK[lid] = {'h': fnv(text), 'o': o}; done += 1
    diff = '' if not old or old.get('h') != fnv(text) else '  (largest change %.2f s)' % max([abs(a[1] - b[1]) for a, b in zip(old['o'], o)] or [0])
    print(f'{lid:>14}  {len(o)} marks{diff}')
blk = '/* MK:BEGIN */const MK=' + json.dumps(MK, separators=(',', ':'), ensure_ascii=False) + ';/* MK:END */'
open(WALK, 'w', encoding='utf-8').write(src[:m.start()] + blk + src[m.end():])
print(done, 'lines measured; walk.js written')
