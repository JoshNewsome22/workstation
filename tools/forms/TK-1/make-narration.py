#!/usr/bin/env python3
"""Voice the TK-1 walkthrough narration: tools/forms/TK-1/walk-script.json -> tools/forms/TK-1/walk-audio.js.

The voice is Kokoro-82M (Apache-2.0), run offline with kokoro-onnx. Every line becomes a mono MP3 (24 kHz, 32 kbit/s)
embedded as a data URI, with its text and its length in seconds, so the form plays it with no network access.
Each line is brought to -16 LUFS (speech on phones and tablets; spec "lufs" overrides) with a gain and a peak limiter at
-1.5 dBFS whose look-ahead delay is compensated, so the loudness rises and no word moves in time.

Set up once (only package registries are needed):
    mkdir tts && cd tts
    npm pack kokoro-js@1.2.1 kokoro-q8-shards@1.0.0
    tar xzf kokoro-js-1.2.1.tgz && mv package kokoro-js          # the voices (voices/*.bin), Apache-2.0
    tar xzf kokoro-q8-shards-1.0.0.tgz && mv package shards       # model_quantized.onnx in six parts
    cat shards/kokoro-q8.part0.bin ... part5.bin > model_quantized.onnx
        (sha256 fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478, onnx-community/Kokoro-82M-v1.0-ONNX)
    python3 -m venv venv && venv/bin/pip install kokoro-onnx imageio-ffmpeg soundfile
usage: TK1_TTS=/path/to/tts tts/venv/bin/python tools/forms/TK-1/make-narration.py [only-these-ids ...]
Lines whose text, voice and speed are unchanged keep their audio from the existing walk-audio.js unless named.
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
force = set(sys.argv[1:])
npz = os.path.join(TTS, 'voices.npz')
if not os.path.exists(npz):
    np.savez(npz, **{os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
                     for f in glob.glob(os.path.join(TTS, 'kokoro-js', 'voices', '*.bin'))})
from kokoro_onnx import Kokoro
import soundfile as sf, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
LUFS = float(spec.get('lufs', -16))
def loudness(wav):
    """integrated loudness of a WAV in LUFS (ffmpeg's EBU R128 meter)"""
    r = subprocess.run([ff, '-hide_banner', '-nostats', '-i', wav, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[0-9.]+) LUFS', r.stderr)
    return float(m[-1]) if m else None
k = None
lines = {}
for ln in spec['lines']:
    lid, text = ln['id'], ln['text'].strip()
    prev = (old.get('lines') or {}).get(lid)
    if prev and prev.get('t') == text and old.get('voice') == voice and old.get('speed') == speed and lid not in force:
        lines[lid] = prev; continue
    if k is None: k = Kokoro(os.path.join(TTS, 'model_quantized.onnx'), npz)
    a, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
    a = np.concatenate([np.zeros(int(sr * .04), dtype=np.float32), a, np.zeros(int(sr * .12), dtype=np.float32)])
    with tempfile.TemporaryDirectory() as d:
        sf.write(d + '/a.wav', a, sr)
        lu = loudness(d + '/a.wav'); g = 0.0 if lu is None else max(-10.0, min(12.0, LUFS - lu))
        af = 'volume=%.2fdB,alimiter=limit=0.8414:attack=5:release=50:level=false:latency=true' % g
        subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', d + '/a.wav', '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '32k', d + '/a.mp3'], check=True)
        mp3 = open(d + '/a.mp3', 'rb').read()
    lines[lid] = {'t': text, 'd': round(len(a) / sr, 3), 'a': 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode()}
    print(f'{lid:>14}  {lines[lid]["d"]:6.2f} s  {len(mp3)//1024:4d} KB  {g:+5.1f} dB  {text[:60]}')
data = {'voice': voice, 'speed': speed, 'lines': lines}
open(out_js, 'w', encoding='utf-8').write(
    '/* The walkthrough narration, voiced by tools/forms/TK-1/make-narration.py from walk-script.json with the Kokoro-82M voice\n'
    '   ' + voice + ' (Apache-2.0, run offline). Generated: edit walk-script.json and run the script again. */\n'
    'const WALK_AUDIO=' + json.dumps(data, separators=(',', ':')) + ';\n')
tot = sum(v['d'] for v in lines.values())
print(f'{len(lines)} lines, {tot:.1f} s of speech, walk-audio.js {os.path.getsize(out_js)//1024} KB')
