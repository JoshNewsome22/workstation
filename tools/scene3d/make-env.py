#!/usr/bin/env python3
"""make-env.py IN.hdr OUT.js [W H]: a small copy of a Radiance .hdr lighting picture, written as a script the scene can
read without loading a file (the pages also open from a folder, where a page may not fetch).

The lighting picture is Poly Haven's "Art Studio" (polyhaven.com/a/art_studio, by Oliksiy Yakovlyev, CC0). It only lights
the scene and shows in reflections, where it is blurred, so 128 x 64 is enough."""
import sys, base64, struct, math

def read_hdr(path):
    f = open(path, 'rb'); assert f.readline().startswith(b'#?'), 'not a Radiance file'
    while True:
        line = f.readline()
        if line.strip() == b'': break
    dims = f.readline().split(); h, w = int(dims[1]), int(dims[3]); data = f.read(); pos = 0
    rows = []
    for _ in range(h):
        if not (data[pos] == 2 and data[pos + 1] == 2): raise SystemExit('only new run-length Radiance files are read')
        assert (data[pos + 2] << 8 | data[pos + 3]) == w; pos += 4
        ch = []
        for _c in range(4):
            out = bytearray()
            while len(out) < w:
                n = data[pos]; pos += 1
                if n > 128: out += bytes([data[pos]]) * (n - 128); pos += 1
                else: out += data[pos:pos + n]; pos += n
            ch.append(out)
        rows.append(ch)
    return w, h, rows

def main():
    src, dst = sys.argv[1], sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 128; H = int(sys.argv[4]) if len(sys.argv) > 4 else 64
    w, h, rows = read_hdr(src); fx, fy = w // W, h // H; out = bytearray()
    for Y in range(H):
        acc = [[0.0, 0.0, 0.0] for _ in range(W)]
        for y in range(Y * fy, (Y + 1) * fy):
            r, g, b, e = rows[y]
            for X in range(W):
                a = acc[X]
                for x in range(X * fx, (X + 1) * fx):
                    if e[x]:
                        s = math.ldexp(1.0, e[x] - 136); a[0] += r[x] * s; a[1] += g[x] * s; a[2] += b[x] * s
        n = fx * fy
        for X in range(W):
            rr, gg, bb = (c / n for c in acc[X]); m = max(rr, gg, bb)
            if m < 1e-32: out += bytes(4); continue
            mant, ex = math.frexp(m); k = mant * 256.0 / m
            out += bytes([min(255, int(rr * k)), min(255, int(gg * k)), min(255, int(bb * k)), ex + 128])
    open(dst, 'w').write('/* written by tools/scene3d/make-env.py from Poly Haven "Art Studio" (CC0): %d x %d, red green blue and a shared exponent */\nexport const ENV_W=%d,ENV_H=%d,ENV_RGBE="%s";\n' % (W, H, W, H, base64.b64encode(bytes(out)).decode()))
    print('wrote', dst, len(out), 'bytes of light')

main()
