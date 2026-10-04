#!/usr/bin/env python3
"""TK-1 walkthrough video: the narration track, the mux and the checks (called by qa/tk1-walk-video.js).

The recorder (qa/tk1-walk-video.js) renders every frame of the Walkthrough view with TKWALK.renderAt(i/fps), encodes the
picture alone and writes job.json: {fps, frames, duration, cues:[{id,start,dur,..}], clips:{id:{a:'data:audio/mpeg;base64,..',d}}}.
This script:
  1. decodes every narration clip (the MP3 data URIs of WALK_AUDIO) to 24 kHz mono and lays it at its cue start in one
     track exactly frames/fps long (the form's player starts each clip at its cue start the same way);
  2. muxes it with the picture: the video stream as encoded (H.264), AAC 96 kbit/s, +faststart;
  3. checks the result: its length equals the timeline's within 0.2 s, 1920x1080, the frame rate, an audio stream, the
     frame count; at every cue start the track rises from silence (RMS just before vs. just after); and saves frames at
     five cue midpoints as PNG (--frames) to look at.
usage: python make-walk-video.py job.json --video picture.mp4 --out final.mp4 --ffmpeg /path/to/ffmpeg [--tmp dir] [--frames dir]
Needs numpy and soundfile (and imageio-ffmpeg when --ffmpeg is not given). Prints a JSON report; exits 1 when a check fails.
"""
import argparse, base64, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

SR = 24000

ap = argparse.ArgumentParser()
ap.add_argument('job'); ap.add_argument('--video', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--ffmpeg'); ap.add_argument('--tmp'); ap.add_argument('--frames')
a = ap.parse_args()
FF = a.ffmpeg
if not FF:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()
job = json.load(open(a.job, encoding='utf-8'))
tmp = a.tmp or tempfile.mkdtemp(prefix='tk1-walk-audio-')
fps, frames, D = int(job['fps']), int(job['frames']), float(job['duration'])
cues = job['cues']; clips = job.get('clips') or {}
fails = []

def run(args, inp=None):
    return subprocess.run([FF, '-hide_banner', '-nostdin'] + args, input=inp, capture_output=True)

def decode(path_or_dash, inp=None):
    r = run(['-loglevel', 'error', '-i', path_or_dash, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], inp)
    if r.returncode: raise RuntimeError('ffmpeg could not decode: ' + r.stderr.decode(errors='replace')[:400])
    return np.frombuffer(r.stdout, dtype='<f4').astype(np.float32)

# 1. the narration track
n = int(round(frames / fps * SR))
track = np.zeros(n, dtype=np.float32)
placed = []
order = sorted(cues, key=lambda c: c['start'])
for i, c in enumerate(order):
    cl = clips.get(c['id'])
    if not cl: continue
    m = re.match(r'data:[^;,]+;base64,(.*)$', cl['a'], re.S)
    if not m: fails.append('clip %s is not a base64 data URI' % c['id']); continue
    x = decode('-', base64.b64decode(m.group(1)))
    s = int(round(c['start'] * SR)); e = min(n, s + len(x))
    if e > s: track[s:e] += x[:e - s]
    end = c['start'] + len(x) / SR
    nxt = order[i + 1]['start'] if i + 1 < len(order) else frames / fps
    if end > nxt + 0.02: fails.append('clip %s (%.2f s) runs past the next cue (%.2f > %.2f)' % (c['id'], len(x) / SR, end, nxt))
    placed.append({'id': c['id'], 'start': c['start'], 'len': round(len(x) / SR, 3)})
peak = float(np.max(np.abs(track))) if n else 0
if peak > 0.999: track *= 0.999 / peak
wav = os.path.join(tmp, 'narration.wav')
sf.write(wav, track, SR, subtype='PCM_16')

# 2. the mux
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
r = run(['-loglevel', 'error', '-y', '-i', a.video, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '96k', '-ar', str(SR), '-ac', '1', '-movflags', '+faststart', a.out])
if r.returncode: sys.exit('mux failed: ' + r.stderr.decode(errors='replace'))

# 3. the checks
info = run(['-i', a.out]).stderr.decode(errors='replace')
dm = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
dur = int(dm.group(1)) * 3600 + int(dm.group(2)) * 60 + float(dm.group(3)) if dm else -1
vm = re.search(r'Stream #\S+.*?Video: (\w+).*?, (\d+)x(\d+)[, ].*?([\d.]+) fps', info)
am = re.search(r'Stream #\S+.*?Audio: (\w+).*?(\d+) Hz, (\w+)', info)
cnt = run(['-i', a.out, '-map', '0:v:0', '-c', 'copy', '-f', 'null', '-']).stderr.decode(errors='replace')
fm = re.findall(r'frame=\s*(\d+)', cnt)
nframes = int(fm[-1]) if fm else -1
rep = {'file': os.path.abspath(a.out), 'bytes': os.path.getsize(a.out), 'mb': round(os.path.getsize(a.out) / 1048576, 2),
       'duration': round(dur, 3), 'timeline': round(D, 3), 'frames': nframes, 'frames_expected': frames,
       'video': vm and {'codec': vm.group(1), 'w': int(vm.group(2)), 'h': int(vm.group(3)), 'fps': float(vm.group(4))},
       'audio': am and {'codec': am.group(1), 'hz': int(am.group(2)), 'layout': am.group(3)},
       'encoder': job.get('encoder'), 'book': {'term': job.get('term'), 'n': job.get('n')}, 'clips': len(placed), 'cues': len(cues)}
if abs(dur - D) > 0.2: fails.append('duration %.3f s vs timeline %.3f s' % (dur, D))
if not vm or (int(vm.group(2)), int(vm.group(3))) != (1920, 1080): fails.append('not 1920x1080: %s' % (vm and vm.groups()))
if not vm or abs(float(vm.group(4)) - fps) > 0.01: fails.append('frame rate not %d' % fps)
if not am: fails.append('no audio stream')
if nframes != frames: fails.append('frame count %d, expected %d' % (nframes, frames))

# the audio lines up: read the muxed track back; at each cue start the RMS rises from silence
aud = decode(a.out)
def rms_db(t0, t1):
    s, e = max(0, int(t0 * SR)), min(len(aud), int(t1 * SR))
    if e <= s: return -120.0
    v = float(np.sqrt(np.mean(aud[s:e].astype(np.float64) ** 2)))
    return 20 * np.log10(max(v, 1e-6))
def onset(t0, t1, thr=-38.0, win=0.01):
    t = t0
    while t < t1:
        if rms_db(t, t + win) > thr: return t
        t += win / 2
    return None
sync = []
for c in order:
    if c['id'] not in clips: continue
    t = c['start']
    pre, post = rms_db(t - 0.25, t - 0.01), rms_db(t + 0.02, t + 0.6)
    on = onset(t - 0.25, t + 0.8)
    row = {'id': c['id'], 'start': round(t, 2), 'pre_db': round(pre, 1), 'post_db': round(post, 1),
           'onset_after_start': None if on is None else round(on - t, 3)}
    ok = pre < -45 and post > -32 and post - pre > 20 and on is not None and -0.03 <= on - t <= 0.45
    row['ok'] = bool(ok)
    if not ok: fails.append('audio at cue %s: %s' % (c['id'], row))
    sync.append(row)
rep['sync'] = {'checked': len(sync), 'ok': sum(r['ok'] for r in sync),
               'max_pre_db': max(r['pre_db'] for r in sync) if sync else None,
               'min_post_db': min(r['post_db'] for r in sync) if sync else None,
               'onset_range': [min(r['onset_after_start'] for r in sync if r['onset_after_start'] is not None),
                               max(r['onset_after_start'] for r in sync if r['onset_after_start'] is not None)] if sync else None,
               'rows': sync}

# frames at five cue midpoints, to look at
if a.frames:
    os.makedirs(a.frames, exist_ok=True)
    ids = {c['id'] for c in cues}
    want = [i for i in ('ch_pick', 'bd_place', 'tok_first', 'tok_last_term' if 'tok_last_term' in ids else 'tok_last', 'exchange') if i in ids]
    for c in order:
        if len(want) >= 5: break
        if c['id'] not in want: want.append(c['id'])
    shots = []
    for i, cid in enumerate(want[:5]):
        c = next(q for q in cues if q['id'] == cid); t = c['start'] + c['dur'] / 2
        p = os.path.join(a.frames, '%d-%s.png' % (i + 1, cid))
        r = run(['-loglevel', 'error', '-y', '-ss', '%.3f' % t, '-i', a.out, '-frames:v', '1', p])
        if r.returncode: fails.append('frame at %s: %s' % (cid, r.stderr.decode(errors='replace')[:200]))
        else: shots.append({'id': cid, 't': round(t, 2), 'png': p})
    rep['frames_png'] = shots

rep['fails'] = fails
rep['result'] = 'PASS' if not fails else 'FAIL'
print(json.dumps(rep, indent=1))
sys.exit(1 if fails else 0)
