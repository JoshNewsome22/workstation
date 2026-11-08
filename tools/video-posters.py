#!/usr/bin/env python3
"""v25.69 The pictures of the procedure videos (the video library, videos.html): for each video nbh-videos.js names, the
photograph on its title card (a clear view of the adult and the student, taken 3 s in), cropped inside its rounded
corners to 16:9 and written beside it as nbh-td1-poster-<the video file's name>.jpg, 640 x 360, under 40 KB. Only the
pictures are read (the sound is not). Run it when a video's pictures changed (not when only its sound was redone), then
python3 tools/pwa-sw.py on the folder. Needs ffmpeg, Pillow and NumPy. The JPEG bytes depend on the Pillow version, so
tools/check-build.py does not run it.

usage: python3 tools/video-posters.py [FOLDER]      FOLDER defaults to NBH-Workstation"""
import base64, io, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def main(argv):
    folder = os.path.abspath(argv[0] if argv else os.path.join(ROOT, 'NBH-Workstation'))
    src = open(os.path.join(folder, 'nbh-videos.js'), encoding='utf-8').read()
    files = re.findall(r"file:'(nbh-td1-video-[a-z0-9-]+\.js)'", src)
    if not files:
        sys.exit('video-posters.py: nbh-videos.js names no video')
    for f in files:
        s = open(os.path.join(folder, f), encoding='utf-8').read()
        m = re.search(r"NBH_TD1_VIDEO\['[^']+'\]\s*=\s*'([A-Za-z0-9+/=]+)'", s)
        if not m:
            sys.exit('video-posters.py: %s holds no video' % f)
        with tempfile.NamedTemporaryFile(suffix='.mp4') as t:
            t.write(base64.b64decode(m.group(1)))
            t.flush()
            png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '3.0', '-i', t.name, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                                 capture_output=True, check=True).stdout
        im = Image.open(io.BytesIO(png)).convert('RGB')
        a = np.asarray(im).astype(int)
        bg = a[600, 1240]   # the title card's background, below the picture
        reg = a[120:700, 720:1280]   # the picture sits right of the title's text
        diff = np.abs(reg - bg).sum(axis=2) > 40
        rows = np.where(diff.sum(axis=1) > 200)[0]
        cols = np.where(diff.sum(axis=0) > 120)[0]
        if not len(rows) or not len(cols):
            sys.exit('video-posters.py: no picture found on the title card of ' + f)
        y0, y1, x0, x1 = rows.min() + 128, rows.max() + 112, cols.min() + 728, cols.max() + 712   # inside the corners and shadow
        w, h = x1 - x0, y1 - y0
        if w / h > 16 / 9:
            nw = int(h * 16 / 9); x0 += (w - nw) // 2; w = nw
        else:
            nh = int(w * 9 / 16); y0 += (h - nh) // 2; h = nh
        out = im.crop((x0, y0, x0 + w, y0 + h)).resize((640, 360), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        o = os.path.join(folder, f.replace('nbh-td1-video-', 'nbh-td1-poster-')[:-3] + '.jpg')
        for q in (82, 78, 74, 70, 65, 60):
            out.save(o, 'JPEG', quality=q, optimize=True, progressive=True)
            if os.path.getsize(o) < 38000:
                break
        print('%s: %d bytes (from %s, %dx%d at %d,%d)' % (os.path.basename(o), os.path.getsize(o), f, w, h, x0, y0))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
