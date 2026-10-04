#!/usr/bin/env python3
"""Voice the TK-1 walkthrough narration: tools/forms/TK-1/walk-script.json -> tools/forms/TK-1/walk-audio.js.

The voice is Kokoro-82M (Apache-2.0), run offline with kokoro-onnx. Every line becomes a mono MP3 (24 kHz, 32 kbit/s)
embedded as a data URI, with its text and its length in seconds, so the form plays it with no network access.
Each line is brought to -16 LUFS (speech on phones and tablets; spec "lufs" overrides) with a gain and a peak limiter at
-1.5 dBFS whose look-ahead delay is compensated, so the loudness rises and no word moves in time. (v21.43) The limiter
and the MP3 encoder take a little loudness back, so the line is measured again after them, the gain is raised by what
is missing (up to four passes, within 0.1 LU), and the MP3 itself is measured last and corrected once more if it is
still more than 0.2 LU off: the clips came out at -16.7 to -17.0 LUFS when the gain was worked out once, before them.

Set up once (only package registries are needed):
    mkdir tts && cd tts
    npm pack kokoro-js@1.2.1 kokoro-q8-shards@1.0.0
    tar xzf kokoro-js-1.2.1.tgz && mv package kokoro-js          # the voices (voices/*.bin), Apache-2.0
    tar xzf kokoro-q8-shards-1.0.0.tgz && mv package shards       # model_quantized.onnx in six parts
    cat shards/kokoro-q8.part0.bin ... part5.bin > model_quantized.onnx
        (sha256 fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478, onnx-community/Kokoro-82M-v1.0-ONNX)
    python3 -m venv venv && venv/bin/pip install kokoro-onnx imageio-ffmpeg soundfile
usage: TK1_TTS=/path/to/tts tts/venv/bin/python tools/forms/TK-1/make-narration.py [only-these-ids ... | --all]
Lines whose text, voice and speed are unchanged keep their audio from the existing walk-audio.js unless named (--all names
every line). A line voiced again with unchanged text, voice and speed must come out the same length as before (the
walkthrough's timeline and its videos are fitted to it), or its old audio is kept and the script says so. With
TK1_TTS_CACHE (the folder make-walk-video.py keeps its voiced lines in) a line voiced there is read from it, the same take.
"""
import base64, glob, json, os, re, subprocess, sys, tempfile
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
TTS = os.environ.get('TK1_TTS') or sys.exit('set TK1_TTS to the folder with model_quantized.onnx and kokoro-js/voices')
spec = json.load(open(os.path.join(HERE, 'walk-script.json'), encoding='utf-8'))
voice, speed = spec.get('voice', 'af_heart'), float(spec.get('speed', 0.95))
out_js = os.path.join(HERE, 'walk-audio.js')
old = {}
if os.path.exists(out_js):
    m = re.search(r'const WALK_AUDIO=(\{.*\});\s*$', open(out_js, encoding='utf-8').read(), re.S)
    if m:
        try: old = json.loads(m.group(1))
        except Exception: old = {}
force = set(a for a in sys.argv[1:] if a != '--all')
if '--all' in sys.argv[1:]: force = set(ln['id'] for ln in spec['lines'])
CACHE = os.environ.get('TK1_TTS_CACHE', '')
LEAD, TAIL = .04, .12          # the silence before and after every line (make-walk-video.py keys its cache by them too)
npz = os.path.join(TTS, 'voices.npz')
if not os.path.exists(npz):
    np.savez(npz, **{os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
                     for f in glob.glob(os.path.join(TTS, 'kokoro-js', 'voices', '*.bin'))})
from kokoro_onnx import Kokoro
import soundfile as sf, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
LUFS = float(spec.get('lufs', -16))
def loudness(wav):
    """integrated loudness of a WAV (or an MP3) in LUFS (ffmpeg's EBU R128 meter)"""
    r = subprocess.run([ff, '-hide_banner', '-nostats', '-i', wav, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[0-9.]+) LUFS', r.stderr)
    return float(m[-1]) if m else None
def chain(g):
    return 'volume=%.2fdB,alimiter=limit=0.8414:attack=5:release=50:level=false:latency=true' % g
def take(text):
    """the line voiced (24 kHz, LEAD s of silence before and TAIL after): from make-walk-video.py's cache when it is there"""
    global k
    if CACHE:
        import hashlib
        p = os.path.join(CACHE, hashlib.sha1(json.dumps([text, voice, float(speed), LEAD, TAIL]).encode()).hexdigest()[:20] + '.wav')
        if os.path.exists(p):
            x, sr = sf.read(p, dtype='float32')
            return x, sr
    if k is None: k = Kokoro(os.path.join(TTS, 'model_quantized.onnx'), npz)
    a, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
    return np.concatenate([np.zeros(int(sr * LEAD), dtype=np.float32), a, np.zeros(int(sr * TAIL), dtype=np.float32)]), sr
k = None
lines = {}
for ln in spec['lines']:
    lid, text = ln['id'], ln['text'].strip()
    prev = (old.get('lines') or {}).get(lid)
    if prev and prev.get('t') == text and old.get('voice') == voice and old.get('speed') == speed and lid not in force:
        lines[lid] = prev; continue
    a, sr = take(text)
    d_new = round(len(a) / sr, 3)
    if prev and prev.get('t') == text and old.get('voice') == voice and old.get('speed') == speed and abs(float(prev.get('d', 0)) - d_new) > .0005:
        print(f'{lid:>14}  voiced again it is {d_new} s, not {prev.get("d")} s: the old audio is kept (the timeline is fitted to it)')
        lines[lid] = prev; continue
    with tempfile.TemporaryDirectory() as d:
        sf.write(d + '/a.wav', a, sr)
        lu = loudness(d + '/a.wav'); g = 0.0 if lu is None else max(-10.0, min(18.0, LUFS - lu))
        clamp = lambda x: max(-10.0, min(18.0, x))
        for _ in range(4):        # the limiter takes some loudness back: measure after it, and raise the gain by what is missing
            subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', d + '/a.wav', '-af', chain(g), '-ac', '1', '-ar', '24000', d + '/b.wav'], check=True)
            lb = loudness(d + '/b.wav')
            if lb is None or abs(LUFS - lb) < .1: break
            g = clamp(g + LUFS - lb)
        enc = lambda: subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', d + '/a.wav', '-af', chain(g), '-ac', '1', '-ar', '24000', '-b:a', '32k', d + '/a.mp3'], check=True)
        enc(); lm = loudness(d + '/a.mp3')
        if lm is not None and abs(LUFS - lm) > .2:      # and the MP3 itself, once more
            g = clamp(g + LUFS - lm); enc(); lm = loudness(d + '/a.mp3')
        mp3 = open(d + '/a.mp3', 'rb').read()
    lines[lid] = {'t': text, 'd': d_new, 'a': 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode()}
    print(f'{lid:>14}  {lines[lid]["d"]:6.2f} s  {len(mp3)//1024:4d} KB  {g:+5.1f} dB  {"" if lm is None else "%.1f LUFS" % lm}  {text[:50]}')
data = {'voice': voice, 'speed': speed, 'lines': lines}
open(out_js, 'w', encoding='utf-8').write(
    '/* The walkthrough narration, voiced by tools/forms/TK-1/make-narration.py from walk-script.json with the Kokoro-82M voice\n'
    '   ' + voice + ' (Apache-2.0, run offline). Generated: edit walk-script.json and run the script again. */\n'
    'const WALK_AUDIO=' + json.dumps(data, separators=(',', ':')) + ';\n')
tot = sum(v['d'] for v in lines.values())
print(f'{len(lines)} lines, {tot:.1f} s of speech, walk-audio.js {os.path.getsize(out_js)//1024} KB')
