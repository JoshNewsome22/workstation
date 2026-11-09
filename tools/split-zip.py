#!/usr/bin/env python3
"""v25.71 Splits a release zip into parts small enough to download in the Claude app and most mail (about 100 MB is the
limit the BCBA met with v25.70's 109 MB zip). Called by tools/zip-release.sh; by hand:

  python3 tools/split-zip.py OUT/RPS-Workstation_v25.71.zip [--max-mb 56]

writes OUT/RPS-Workstation_v25.71_part1.zip (every file but the procedure videos, then as many videos as fit) and
OUT/RPS-Workstation_v25.71_part2-videos.zip, _part3-videos.zip ... (the rest of the videos, each part under the limit).
Every file is in exactly one part, at the same path: extract all the parts into the same folder and the result is the
whole zip. A zip already under the limit is left alone (no parts). The parts are checked against the zip before it ends.
"""
import sys, os, zipfile

def main(argv):
    if not argv or argv[0].startswith('-'):
        print(__doc__); return 2
    src = argv[0]; cap = 56.0
    if '--max-mb' in argv: cap = float(argv[argv.index('--max-mb') + 1])
    cap_b = cap * 1e6
    base = src[:-4] if src.endswith('.zip') else src
    for old in [f for f in os.listdir(os.path.dirname(os.path.abspath(src))) if f.startswith(os.path.basename(base) + '_part')]:
        os.remove(os.path.join(os.path.dirname(os.path.abspath(src)), old))
    z = zipfile.ZipFile(src)
    inf = z.infolist()
    if os.path.getsize(src) <= cap_b:
        print('split-zip: %s is %.0f MB, under %.0f MB: no parts' % (os.path.basename(src), os.path.getsize(src) / 1e6, cap)); return 0
    vids = sorted([i for i in inf if os.path.basename(i.filename).startswith('nbh-td1-video-')], key=lambda i: i.filename)
    rest = [i for i in inf if i not in vids]
    parts = [list(rest)]; size = sum(i.compress_size for i in rest)
    if size > cap_b:
        print('split-zip: the files besides the videos are %.0f MB, over the limit' % (size / 1e6)); return 1
    for v in vids:
        if size + v.compress_size > cap_b:
            parts.append([]); size = 0
        parts[-1].append(v); size += v.compress_size
    names = []
    for n, items in enumerate(parts, 1):
        name = '%s_part%d%s.zip' % (base, n, '' if n == 1 else '-videos')
        with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as o:
            for i in items:
                o.writestr(i, z.read(i.filename))
        names.append(name)
    seen = []
    for name in names:
        seen += zipfile.ZipFile(name).namelist()
    if sorted(seen) != sorted(z.namelist()) or len(seen) != len(set(seen)):
        print('split-zip: the parts do not hold the zip exactly'); return 1
    for name in names:
        print('split-zip: %s %.1f MB' % (os.path.basename(name), os.path.getsize(name) / 1e6))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
