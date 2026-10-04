#!/usr/bin/env python3
"""TK-1 walkthrough video: the narration track, the mux and the checks (called by qa/tk1-walk-video.js).

The recorder (qa/tk1-walk-video.js) draws every frame of the Walkthrough view with TKWALK.renderAt(i/fps), encodes the
picture alone (H.264) and writes job.json:
  {fps, frames, duration, cues:[{id,start,dur,narr,text,chapter}], chapters:[{id,label,start}],
   clips:{id:{a:'data:audio/mpeg;base64,..', d, t}}, voice, speed, term, n, encoder, title, det:[{t,a,b}]}

Subcommands
  track job.json --wav narration.wav [--tts DIR] [--cache DIR] [--no-tts] [--loudness -16|off] [--report track.json]
      Lays every narration clip at its cue start in one 24 kHz mono track exactly frames/fps long, as the form's player
      starts each clip at its cue start. The clips are the form's own (the MP3 data URIs of WALK_AUDIO). When the
      narration voice is set up (--tts, the folder make-narration.py uses: model_quantized.onnx and voices.npz) each line
      is voiced again with the same voice, speed and padding as make-narration.py and used ONLY when it is the very same
      take as the form's clip (the same length, no time shift, the same waveform below 4 kHz), so the timing the captions
      and actions were fitted to is kept while the track has the full bandwidth instead of the 32 kbit/s MP3. Voiced
      lines are cached (--cache). Then one gain brings the track to -16 LUFS (EBU R128), the few peaks it would push
      past -1.5 dBTP held down by a look-ahead limiter (5 ms ahead, 80 ms back); --loudness off: no gain, no limiter.
  mux job.json --video picture.mp4 --wav narration.wav --out final.mp4 [--track-report track.json] [--frames DIR]
      Muxes the picture (copied as encoded) with the track (AAC 96 kbit/s, 24 kHz mono, +faststart), the seven chapters
      as MP4 chapter marks and a title, then runs the checks below.
  check job.json --out final.mp4 [--wav narration.wav] [--track-report track.json] [--frames DIR]
      Only the checks, on a video already made, against this timeline.
  warm [--tts DIR] [--cache DIR]
      Voices every line of tools/forms/TK-1/walk-audio.js into the cache (and checks it against the form's clip).

The checks (a JSON report; exit 1 when one fails): the length equals the timeline's within 0.2 s; 1920x1080; the frame
rate; the frame count; an audio stream; the BT.709 colour tags (libx264); at every cue start the audio rises from
silence (RMS just before vs. just after) and its onset is where the clip itself puts it; the whole track is not shifted
(cross-correlation with the track that went in); loudness; the chapters; the determinism pairs (the same time drawn
twice); and frames at five cue midpoints (PNG) plus a contact sheet of every cue's midpoint, to look at (--frames).
Needs numpy and soundfile (and imageio-ffmpeg when --ffmpeg is not given).
"""
import argparse, base64, fcntl, glob, hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

SR = 24000
HERE = os.path.dirname(os.path.abspath(__file__))
LEAD, TAIL = .04, .12          # the silence make-narration.py puts before and after every line

ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
ap.add_argument('cmd', choices=['track', 'mux', 'check', 'warm'])
ap.add_argument('job', nargs='?')
ap.add_argument('--wav'); ap.add_argument('--video'); ap.add_argument('--out'); ap.add_argument('--frames')
ap.add_argument('--ffmpeg'); ap.add_argument('--tmp'); ap.add_argument('--report'); ap.add_argument('--track-report')
ap.add_argument('--tts', default=os.environ.get('TK1_TTS') or (os.path.join(os.environ['S'], 'tts') if os.environ.get('S') else ''))
ap.add_argument('--cache', default=os.environ.get('TK1_TTS_CACHE') or os.path.join(os.environ.get('S') or tempfile.gettempdir(), 'tk1-walk-tts-cache'))
ap.add_argument('--no-tts', action='store_true'); ap.add_argument('--loudness', default='-16')
a = ap.parse_args()
FF = a.ffmpeg
if not FF:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()


def run(args, inp=None):
    return subprocess.run([FF, '-hide_banner', '-nostdin'] + args, input=inp, capture_output=True)


def decode(src, inp=None):
    """any audio (a file, or '-' with the bytes) -> float32 mono at 24 kHz"""
    r = run(['-loglevel', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], inp)
    if r.returncode: raise RuntimeError('ffmpeg could not decode: ' + r.stderr.decode(errors='replace')[:400])
    return np.frombuffer(r.stdout, dtype='<f4').astype(np.float32)


def mp3_of(clip):
    m = re.match(r'data:[^;,]+;base64,(.*)$', clip['a'], re.S)
    if not m: raise ValueError('not a base64 data URI')
    return decode('-', base64.b64decode(m.group(1)))


def db(v): return 20 * np.log10(max(float(v), 1e-6))


def rms_db(x, t0, t1):
    s, e = max(0, int(round(t0 * SR))), min(len(x), int(round(t1 * SR)))
    if e <= s: return -120.0
    return db(np.sqrt(np.mean(x[s:e].astype(np.float64) ** 2)))


def onset(x, t0, t1, thr=-38.0, win=.01):
    """the first 10 ms window (in 5 ms steps) whose RMS is above thr dBFS"""
    t = t0
    while t < t1:
        if rms_db(x, t, t + win) > thr: return t
        t += win / 2
    return None


def lowpass(x, fc):
    F = np.fft.rfft(x.astype(np.float64)); F[np.fft.rfftfreq(len(x), 1 / SR) > fc] = 0
    return np.fft.irfft(F, len(x))


def xcorr(p, q, maxlag):
    """the lag (samples, q later than p when > 0) with the highest normalised correlation, and that correlation"""
    n = len(p) + len(q); N = 1 << (n - 1).bit_length()
    c = np.fft.irfft(np.conj(np.fft.rfft(p, N)) * np.fft.rfft(q, N), N)
    lags = np.r_[0:maxlag + 1, -maxlag:0]; v = c[lags]
    i = int(np.argmax(v)); den = np.sqrt(np.dot(p, p) * np.dot(q, q)) or 1.0
    return int(lags[i]), float(v[i] / den)


def same_take(w, x):
    """is the voiced line w the same take as the form's clip x (decoded MP3)? the length, the shift, the waveform below 4 kHz"""
    n = min(len(w), len(x)); lag, _ = xcorr(w[:n].astype(np.float64), x[:n].astype(np.float64), 480)
    p, q = lowpass(w[:n], 4000), lowpass(x[:n], 4000); c = float(np.dot(p, q) / (np.sqrt(np.dot(p, p) * np.dot(q, q)) or 1))
    m = {'len_diff_ms': round((len(w) - len(x)) / SR * 1000, 1), 'lag_samples': lag, 'corr_below_4k': round(c, 4)}
    return abs(len(w) - len(x)) <= int(.05 * SR) and abs(lag) <= 2 and c >= .98, m


# ---------------- the narration voice (the same set-up as make-narration.py), with a cache ----------------
_k = None


def tts_ready():
    return bool(a.tts) and not a.no_tts and os.path.exists(os.path.join(a.tts, 'model_quantized.onnx')) and \
        (os.path.exists(os.path.join(a.tts, 'voices.npz')) or glob.glob(os.path.join(a.tts, 'kokoro-js', 'voices', '*.bin')))


def voiced(text, voice, speed):
    """the line voiced as make-narration.py voices it (24 kHz, LEAD s of silence before, TAIL after); cached by text, voice, speed"""
    global _k
    os.makedirs(a.cache, exist_ok=True)
    key = hashlib.sha1(json.dumps([text, voice, float(speed), LEAD, TAIL]).encode()).hexdigest()[:20]
    path = os.path.join(a.cache, key + '.wav')
    with open(path + '.lock', 'w') as lk:          # two recorders at once voice each line once
        fcntl.flock(lk, fcntl.LOCK_EX)
        if not os.path.exists(path):
            if _k is None:
                npz = os.path.join(a.tts, 'voices.npz')
                if not os.path.exists(npz):
                    np.savez(npz, **{os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
                                     for f in glob.glob(os.path.join(a.tts, 'kokoro-js', 'voices', '*.bin'))})
                from kokoro_onnx import Kokoro
                _k = Kokoro(os.path.join(a.tts, 'model_quantized.onnx'), npz)
            x, sr = _k.create(text, voice=voice, speed=float(speed), lang='en-us')
            if sr != SR: raise RuntimeError('the voice is %d Hz, not %d' % (sr, SR))
            x = np.concatenate([np.zeros(int(sr * LEAD), dtype=np.float32), np.asarray(x, dtype=np.float32), np.zeros(int(sr * TAIL), dtype=np.float32)])
            tmp = path + '.part.wav'; sf.write(tmp, x, SR, subtype='FLOAT'); os.replace(tmp, path)
    x, sr = sf.read(path, dtype='float32')
    return x


def clip_audio(cid, clip, voice, speed, use_tts):
    """the samples for one line: the voiced take when it is the same take as the form's clip, else the clip itself"""
    x = mp3_of(clip)
    row = {'id': cid, 'mp3_s': round(len(x) / SR, 3), 'd': clip.get('d')}
    if use_tts and clip.get('t'):
        try:
            w = voiced(clip['t'], voice, speed)
            ok, m = same_take(w, x); row.update(m)
            if ok: row['source'] = 'voice'; return w, row
            row['source'] = 'mp3'; row['why'] = 'the voiced line is not the same take as the clip'
        except Exception as e:
            row['source'] = 'mp3'; row['why'] = 'voicing failed: %s' % str(e)[:200]
    else:
        row['source'] = 'mp3'
    return x, row


def loudness(path):
    """integrated loudness (LUFS) and true peak (dBTP) by ffmpeg's EBU R128 meter"""
    r = run(['-i', path, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'])
    s = r.stderr.decode(errors='replace'); s = s[s.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', s); P = re.search(r'True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS', s)
    f = lambda m: None if not m or m.group(1) == '-inf' else float(m.group(1))
    return f(I), f(P)


def sliding_min(r, w):
    """m[n] = min(r[n:n+w]), past the end 1 (van Herk / Gil-Werman: two running minima per block of w)"""
    n = len(r); x = np.concatenate([r, np.ones((-n) % w + w)]); B = x.reshape(-1, w)
    pre = np.minimum.accumulate(B, axis=1).ravel(); suf = np.minimum.accumulate(B[:, ::-1], axis=1)[:, ::-1].ravel()
    i = np.arange(n)
    return np.minimum(suf[i], pre[i + w - 1])


def limit(y, ceiling_db=-1.5, look=.005, release=.08):
    """a look-ahead peak limiter on the 4x oversampled (true) peak: the gain falls over `look` s before a peak that would pass
    the ceiling, just enough, and comes back with a `release` s time constant; elsewhere it is exactly 1 (no change)"""
    L = 10 ** (ceiling_db / 20); n = len(y)
    up = np.fft.irfft(np.fft.rfft(y), 4 * n) * 4
    p = np.maximum(np.abs(up).reshape(n, 4).max(1), np.abs(y))
    r = np.minimum(1.0, L / np.maximum(p, 1e-12))
    k = int(round(look * SR)); m = sliding_min(r, k + 1)          # every window of k+1 that holds the peak is at or under it
    cs = np.concatenate([[0.0], np.cumsum(m)]); i = np.arange(n); lo = np.maximum(0, i - k)
    s = (cs[i + 1] - cs[lo]) / (i + 1 - lo)                         # ... so the moving mean is too, and falls smoothly
    c = 1 - np.exp(-1 / (release * SR)); g = s.tolist(); prev = 1.0
    for j in range(n):
        v = g[j]
        if prev >= 1.0 and v >= 1.0: continue
        q = prev + (1.0 - prev) * c
        if q > 1.0 - 1e-7: q = 1.0
        if v < q: q = v
        g[j] = q; prev = q
    g = np.asarray(g)
    return y * g, g


def load_job():
    job = json.load(open(a.job, encoding='utf-8'))
    return job, int(job['fps']), int(job['frames']), float(job['duration']), job['cues'], job.get('clips') or {}


# ---------------- track ----------------
def cmd_track():
    job, fps, frames, D, cues, clips = load_job()
    n = int(round(frames / fps * SR)); track = np.zeros(n, dtype=np.float64)
    order = sorted(cues, key=lambda c: c['start']); rows = []; fails = []; used = {}
    use_tts = bool(tts_ready()); voice, speed = job.get('voice') or 'af_heart', job.get('speed') or .95
    for i, c in enumerate(order):
        cl = clips.get(c['id'])
        if not cl: fails.append('no clip for cue %s' % c['id']); continue
        x, row = clip_audio(c['id'], cl, voice, speed, use_tts)
        s = int(round(c['start'] * SR)); e = min(n, s + len(x))
        if e > s: track[s:e] += x[:e - s]
        end = c['start'] + len(x) / SR; nxt = order[i + 1]['start'] if i + 1 < len(order) else frames / fps
        if end > nxt + .02: fails.append('clip %s (%.2f s) runs past the next cue (%.2f > %.2f)' % (c['id'], len(x) / SR, end, nxt))
        row.update({'start': round(c['start'], 3), 'len': round(len(x) / SR, 3)})
        rows.append(row); used[c['id']] = x
    raw = os.path.join(a.tmp or os.path.dirname(os.path.abspath(a.wav)), 'narration-raw.wav')
    sf.write(raw, track.astype(np.float32), SR, subtype='FLOAT')
    I0, P0 = loudness(raw); gain = 0.0; lim = None; out = track
    if a.loudness != 'off' and I0 is not None:
        # one gain to the target loudness; the rare peaks it would push past -1.5 dBTP are limited (twice at most, to land on it)
        target = float(a.loudness); gain = target - I0
        for _ in range(3):
            out, g = limit(track * 10 ** (gain / 20))
            sf.write(raw, out.astype(np.float32), SR, subtype='FLOAT'); I, _p = loudness(raw)
            gr = -20 * np.log10(np.maximum(g, 1e-9)); sp = np.abs(track) > 10 ** (-60 / 20)
            lim = {'max_db': round(float(gr.max()), 2), 'speech_over_1db_pct': round(float((gr[sp] > 1).mean() * 100), 2) if sp.any() else 0,
                   'speech_over_3db_pct': round(float((gr[sp] > 3).mean() * 100), 3) if sp.any() else 0}
            if I is None or abs(I - target) <= .1: break
            gain += target - I
    for row in rows:      # where the voice starts in the clip itself, at the same gain: the check finds it there after the cue start
        x = used[row['id']] * 10 ** (gain / 20); on = onset(x, 0, min(len(x) / SR, 1.0))
        row['clip_onset'] = None if on is None else round(on, 3)
    peak = float(np.max(np.abs(out))) if n else 0
    if peak > .999: out = out * (.999 / peak)
    sf.write(a.wav, out.astype(np.float32), SR, subtype='PCM_24')
    I1, P1 = loudness(a.wav)
    try: os.remove(raw)
    except OSError: pass
    rep = {'wav': os.path.abspath(a.wav), 'seconds': round(n / SR, 3), 'voice_used': use_tts,
           'from_voice': sum(r['source'] == 'voice' for r in rows), 'from_mp3': sum(r['source'] == 'mp3' for r in rows),
           'loudness_before': {'lufs': I0, 'true_peak_db': P0}, 'gain_db': round(gain, 2), 'limiter': lim, 'loudness': {'lufs': I1, 'true_peak_db': P1},
           'clips': rows, 'fails': fails}
    if a.report: json.dump(rep, open(a.report, 'w'), indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != 'clips'}))
    sys.exit(1 if fails else 0)


# ---------------- mux ----------------
def esc(s): return re.sub(r'([=;#\\\n])', r'\\\1', str(s))


def cmd_mux():
    job, fps, frames, D, cues, clips = load_job()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    meta = os.path.join(a.tmp or os.path.dirname(os.path.abspath(a.wav)), 'chapters.txt')
    chs = sorted(job.get('chapters') or [], key=lambda c: c['start']); L = frames / fps
    with open(meta, 'w', encoding='utf-8') as f:
        f.write(';FFMETADATA1\n')
        if job.get('title'): f.write('title=%s\n' % esc(job['title']))
        if job.get('comment'): f.write('comment=%s\n' % esc(job['comment']))
        for i, c in enumerate(chs):
            e = chs[i + 1]['start'] if i + 1 < len(chs) else L
            f.write('[CHAPTER]\nTIMEBASE=1/1000\nSTART=%d\nEND=%d\ntitle=%s\n' % (round(c['start'] * 1000), round(e * 1000), esc(c['label'])))
    r = run(['-loglevel', 'error', '-y', '-i', a.video, '-i', a.wav, '-f', 'ffmetadata', '-i', meta,
             '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '2', '-map_chapters', '2', '-c:v', 'copy',
             '-c:a', 'aac', '-b:a', '96k', '-ar', str(SR), '-ac', '1', '-metadata:s:a:0', 'language=eng',
             '-movflags', '+faststart', a.out])
    if r.returncode: sys.exit('mux failed: ' + r.stderr.decode(errors='replace'))
    cmd_check(job)


# ---------------- check ----------------
def cmd_check(job=None):
    if job is None: job = load_job()[0]
    fps, frames, D, cues, clips = int(job['fps']), int(job['frames']), float(job['duration']), job['cues'], job.get('clips') or {}
    fails = []
    info = run(['-i', a.out]).stderr.decode(errors='replace')
    dm = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
    dur = int(dm.group(1)) * 3600 + int(dm.group(2)) * 60 + float(dm.group(3)) if dm else -1
    vm = re.search(r'Stream #\S+.*?Video: (\w+)(?: \((\w[\w ]*)\))?.*?, (yuv\w+)(\([^)]*\))?.*?, (\d+)x(\d+)[, ].*?([\d.]+) fps', info)
    am = re.search(r'Stream #\S+.*?Audio: (\w+).*?(\d+) Hz, (\w+)', info)
    cnt = run(['-loglevel', 'error', '-i', a.out, '-map', '0:v:0', '-c', 'copy', '-f', 'framecrc', '-']).stdout.decode(errors='replace')
    nframes = sum(1 for ln in cnt.splitlines() if ln.strip() and not ln.startswith('#'))
    nch = len(re.findall(r'Chapter #\d+:\d+:', info))
    size = os.path.getsize(a.out)
    rep = {'file': os.path.abspath(a.out), 'bytes': size, 'mb': round(size / 1048576, 2),
           'duration': round(dur, 3), 'timeline': round(D, 3), 'frames': nframes, 'frames_expected': frames,
           'video': vm and {'codec': vm.group(1), 'profile': vm.group(2), 'pix_fmt': vm.group(3), 'colour': (vm.group(4) or '').strip('()'),
                            'w': int(vm.group(5)), 'h': int(vm.group(6)), 'fps': float(vm.group(7))},
           'audio': am and {'codec': am.group(1), 'hz': int(am.group(2)), 'layout': am.group(3)},
           'encoder': job.get('encoder'), 'book': {'term': job.get('term'), 'n': job.get('n')}, 'chapters': nch, 'cues': len(cues)}
    if abs(dur - D) > .2: fails.append('duration %.3f s vs timeline %.3f s' % (dur, D))
    if not vm or (int(vm.group(5)), int(vm.group(6))) != (1920, 1080): fails.append('not 1920x1080: %s' % (vm and vm.groups()))
    if not vm or abs(float(vm.group(7)) - fps) > .01: fails.append('frame rate not %d' % fps)
    if vm and job.get('encoder') == 'libx264' and (vm.group(1) != 'h264' or vm.group(3) != 'yuv420p' or 'bt709' not in (vm.group(4) or '')):
        fails.append('not H.264 yuv420p tagged BT.709: %s' % (vm.groups(),))
    if not am: fails.append('no audio stream')
    if nframes != frames: fails.append('frame count %d, expected %d' % (nframes, frames))
    if job.get('chapters') and nch != len(job['chapters']): fails.append('%d chapter marks, expected %d' % (nch, len(job['chapters'])))

    # the audio lines up: read the muxed track back
    aud = decode(a.out); order = sorted(cues, key=lambda c: c['start'])
    trk = json.load(open(a.track_report)) if a.track_report and os.path.exists(a.track_report) else None
    own = {r['id']: r for r in (trk or {}).get('clips', [])}
    sync = []
    for c in order:
        if c['id'] not in clips: continue
        t = c['start']
        pre, post = rms_db(aud, t - .25, t - .01), rms_db(aud, t + .02, t + .6)
        on = onset(aud, t - .25, t + .8)
        row = {'id': c['id'], 'start': round(t, 3), 'pre_db': round(pre, 1), 'post_db': round(post, 1),
               'onset_after_start': None if on is None else round(on - t, 3)}
        ok = pre < -45 and post > -32 and post - pre > 20 and on is not None and -.03 <= on - t <= .45
        if c['id'] in own and own[c['id']].get('clip_onset') is not None and on is not None:
            row['clip_onset'] = round(own[c['id']]['clip_onset'], 3)
            row['offset_vs_clip'] = round(on - t - own[c['id']]['clip_onset'], 3)      # 0 when the clip sits exactly at its cue
            ok = ok and abs(row['offset_vs_clip']) <= .011
        row['ok'] = bool(ok)
        if not ok: fails.append('audio at cue %s: %s' % (c['id'], row))
        sync.append(row)
    rows_on = [r['onset_after_start'] for r in sync if r['onset_after_start'] is not None]
    rep['sync'] = {'checked': len(sync), 'ok': sum(r['ok'] for r in sync),
                   'max_pre_db': max(r['pre_db'] for r in sync) if sync else None,
                   'min_post_db': min(r['post_db'] for r in sync) if sync else None,
                   'onset_range': [min(rows_on), max(rows_on)] if rows_on else None,
                   'offset_vs_clip_range': [min(r['offset_vs_clip'] for r in sync if 'offset_vs_clip' in r), max(r['offset_vs_clip'] for r in sync if 'offset_vs_clip' in r)] if any('offset_vs_clip' in r for r in sync) else None,
                   'rows': sync}
    # the whole track is where it was put (no shift from the AAC encoder's priming): cross-correlate with the track that went in
    if a.wav and os.path.exists(a.wav) and order:
        src, _ = sf.read(a.wav, dtype='float32'); s0 = int(order[0]['start'] * SR); s1 = min(len(src), len(aud), s0 + 30 * SR)
        lag, corr = xcorr(src[s0:s1].astype(np.float64), aud[s0:s1].astype(np.float64), 2400)
        rep['track_shift'] = {'lag_ms': round(lag / SR * 1000, 2), 'corr': round(corr, 4)}
        if abs(lag) > 48 or corr < .9: fails.append('the muxed audio is shifted or changed: %s' % rep['track_shift'])
    I, P = loudness(a.out); rep['loudness'] = {'lufs': I, 'true_peak_db': P}
    if trk: rep['narration'] = {k: trk.get(k) for k in ('from_voice', 'from_mp3', 'gain_db', 'limiter', 'loudness_before')}

    # the same time drawn twice (in different orders) gives the same picture
    if job.get('det'):
        dd = []
        for p in job['det']:
            x, y = rgb(p['a']), rgb(p['b'])
            if x is None or y is None or x.shape != y.shape: dd.append({'t': p['t'], 'error': 'could not read'}); fails.append('determinism pair at %.2f unreadable' % p['t']); continue
            d = np.abs(x.astype(np.int16) - y.astype(np.int16)).max(2)
            row = {'t': p['t'], 'max_diff': int(d.max()), 'px_over_8': int((d > 8).sum()), 'px_over_32': int((d > 32).sum())}
            if row['px_over_32'] > 500: fails.append('the frame at %.2f s differs when drawn again: %s' % (p['t'], row))
            dd.append(row)
        rep['determinism'] = dd

    # frames at five cue midpoints, and a contact sheet of every cue's midpoint, to look at
    if a.frames:
        os.makedirs(a.frames, exist_ok=True)
        ids = [c['id'] for c in order]
        want = [i for i in ('ch_pick', 'bd_place', 'tok_first', 'tok_last_term' if 'tok_last_term' in ids else 'tok_last', 'exchange') if i in ids]
        for i in ids:
            if len(want) >= 5: break
            if i not in want: want.append(i)
        shots = []
        for i, cid in enumerate(want[:5]):
            c = next(q for q in cues if q['id'] == cid); t = c['start'] + c['dur'] / 2
            p = os.path.join(a.frames, '%d-%s.png' % (i + 1, cid))
            r = run(['-loglevel', 'error', '-y', '-ss', '%.3f' % t, '-i', a.out, '-frames:v', '1', '-update', '1', p])
            if r.returncode or not os.path.exists(p): fails.append('frame at %s: %s' % (cid, r.stderr.decode(errors='replace')[:200]))
            else: shots.append({'id': cid, 't': round(t, 2), 'png': p})
        rep['frames_png'] = shots
        sheet = contact_sheet(order, os.path.join(a.frames, 'contact-sheet.png'))
        if sheet: rep['contact_sheet'] = {'png': sheet, 'tiles': ['%d %s %.1fs' % (i + 1, c['id'], c['start'] + c['dur'] / 2) for i, c in enumerate(order)]}
        else: fails.append('the contact sheet could not be made')

    rep['fails'] = fails
    rep['result'] = 'PASS' if not fails else 'FAIL'
    print(json.dumps(rep, indent=1))
    sys.exit(1 if fails else 0)


def rgb(path):
    r = run(['-loglevel', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    m = re.search(r', (\d+)x(\d+)', run(['-i', path]).stderr.decode(errors='replace'))
    if r.returncode or not m: return None
    w, h = int(m.group(1)), int(m.group(2))
    return np.frombuffer(r.stdout, dtype=np.uint8).reshape(h, w, 3)


def contact_sheet(order, path, cols=5, tw=384, th=216):
    """every cue's midpoint as a small frame, in playing order (left to right, top to bottom), in one picture; each tile is
    labelled with its number, cue and time when this ffmpeg has the drawtext filter"""
    font = next((f for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') if os.path.exists(f)), None)
    if font and not re.search(r'\bdrawtext\b', run(['-filters']).stdout.decode(errors='replace')): font = None
    tiles = []
    for i, c in enumerate(order):
        t = c['start'] + c['dur'] / 2
        vf = 'scale=%d:%d:flags=area' % (tw, th)
        if font: vf += ",drawtext=fontfile=%s:text='%d %s %.0fs':x=6:y=6:fontsize=17:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4" % (font, i + 1, c['id'].replace('_', ' '), t)
        r = run(['-loglevel', 'error', '-ss', '%.3f' % t, '-i', a.out, '-frames:v', '1', '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
        if r.returncode or len(r.stdout) != tw * th * 3: return None
        tiles.append(np.frombuffer(r.stdout, dtype=np.uint8).reshape(th, tw, 3))
    rows = (len(tiles) + cols - 1) // cols; g = 4
    img = np.full((rows * th + (rows + 1) * g, cols * tw + (cols + 1) * g, 3), 24, dtype=np.uint8)
    for k, tl in enumerate(tiles):
        y, x = g + (k // cols) * (th + g), g + (k % cols) * (tw + g); img[y:y + th, x:x + tw] = tl
    H, W = img.shape[:2]
    r = run(['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-i', '-', '-frames:v', '1', '-update', '1', path], img.tobytes())
    return path if r.returncode == 0 else None


# ---------------- warm ----------------
def cmd_warm():
    if not tts_ready(): sys.exit('the narration voice is not set up (--tts DIR with model_quantized.onnx and voices.npz)')
    src = open(os.path.join(HERE, 'walk-audio.js'), encoding='utf-8').read()
    W = json.loads(re.search(r'const WALK_AUDIO=(\{.*\});\s*$', src, re.S).group(1)); bad = 0
    for cid, cl in W['lines'].items():
        _, row = clip_audio(cid, cl, W.get('voice') or 'af_heart', W.get('speed') or .95, True)
        bad += row['source'] != 'voice'; print(json.dumps(row))
    print('%d lines, %d not the same take (those use the MP3); cache %s' % (len(W['lines']), bad, a.cache))


if a.cmd in ('track', 'mux', 'check') and not a.job: sys.exit('job.json is needed')
if a.cmd == 'track':
    if not a.wav: sys.exit('--wav is needed')
    cmd_track()
elif a.cmd == 'mux':
    if not (a.video and a.wav and a.out): sys.exit('--video, --wav and --out are needed')
    cmd_mux()
elif a.cmd == 'check':
    if not a.out: sys.exit('--out is needed')
    cmd_check()
else:
    cmd_warm()
