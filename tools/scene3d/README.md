# tools/scene3d: the drawn scene in lit 3D

`NBH-Workstation/nbh-scene3d.js` is the classroom scene the drawn pages use where the device can draw it (the explainers
and the counting practice; the drawn procedure videos are rendered from the same scene). It is built from this folder.

- `src/engine.js`: the scene. `create(host, options)` returns `{ el, set(state), parts, destroy() }` and takes the same
  state as the flat scene (`NBH-Workstation/nbh-scene.js`, whose header lists the keys); `ok()` says whether the device
  can draw it. The picture is drawn only when `set()` is called, and `set()` keeps nothing between calls.
- `src/env.js`: the room's light, written by `make-env.py` from Poly Haven's "Art Studio" lighting picture (CC0). The
  picture itself is not kept here; download `art_studio_1k.hdr` from polyhaven.com/a/art_studio to make it again.
- `build.sh`: writes `NBH-Workstation/nbh-scene3d.js` as ONE ordinary script (the pages also open from a folder, where a
  page may load neither a module nor a file). It fetches three.js (MIT) and esbuild (MIT) from the package registry into
  `node_modules/`, which is not kept. `banner.txt` is the notice at the top of the file (the MIT licence text, the credit).

The built file is committed, so `tools/build-release.sh` and `tools/check-build.py` never need node. After a change here:
`bash tools/scene3d/build.sh`, then `bash tools/build-release.sh`, then `node qa/v2578-scene3d-test.js`.

Two rules learned the hard way:
- No very large polygon. One 30 m floor was drawn across the whole picture at some camera angles; big surfaces are divided.
- The lighting numbers are half-size floats, which every WebGL 2 device can smooth; full-size ones cannot be on some tablets.
