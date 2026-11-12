# tools/scene3d: the drawn scene in lit 3D

`NBH-Workstation/nbh-scene3d.js` is the classroom scene the drawn pages use where the device can draw it (the explainers
and the counting practice; the drawn procedure videos are rendered from the same scene). It is built from this folder.

- `src/shared.js`: what the two scenes share (the test of the device, the names of the parts, the page styles, the
  room's light).
- `src/engine.js`: the clay scene. `create(host, options)` returns `{ el, set(state), parts, destroy() }` and takes the same
  state as the flat scene (`NBH-Workstation/nbh-scene.js`, whose header lists the keys); `ok()` says whether the device
  can draw it. The picture is drawn only when `set()` is called, and `set()` keeps nothing between calls.
- `src/env.js`: the room's light, written by `make-env.py` from Poly Haven's "Art Studio" lighting picture (CC0). The
  picture itself is not kept here; download `art_studio_1k.hdr` from polyhaven.com/a/art_studio to make it again.
- `build.sh`: writes `NBH-Workstation/nbh-scene3d.js` as ONE ordinary script (the pages also open from a folder, where a
  page may load neither a module nor a file). It fetches three.js (MIT) and esbuild (MIT) from the package registry into
  `node_modules/`, which is not kept. `banner.txt` is the notice at the top of the file (the MIT licence text, the credit).

## The real-looking scene (v25.90)

`src/real.js` is the same scene with real-looking people and things: `NBHScene3D.createReal(host, options)` takes the
same state and gives back the same handle, plus `ready` (a promise: the people have been read). It draws from a pack,
`NBH-Workstation/nbh-scene3d-real.js` (`window.NBHSceneReal`), which a page asks for only when it needs it
(`loadScript('nbh-scene3d-real.js', ...)` in explain.html, so `tools/pwa-sw.py` lists it for the offline copy). Which
explainers use it is the `REAL` list in explain.html; the others, and any device that cannot read the pack, keep the
clay scene. Faces do not move: a mouth or brows in the state are not shown, the head turns and words are a bubble.

- The pack is written by `make-real.mjs` (its notice is `banner-real.txt`): each model is a small .glb with its pictures
  taken out and carried beside it as text, so nothing is fetched while a model is read and the page works from a folder.
  It needs `@gltf-transform/core`, `/extensions`, `/functions`, `meshoptimizer` and `sharp` from the package registry
  (not kept here): `node make-real.mjs SOURCES_DIR ../../NBH-Workstation/nbh-scene3d-real.js`.
- The sources are not kept in the repository. The two people are simulated: a picture made from a written description
  (Kling), turned into a model (3D AI Studio, Prism 3.1) and given a skeleton with the usual joint names (Hips, Spine,
  LeftArm, LeftForeArm, LeftHand, LeftHandMiddle1, ...; `real.js` finds joints by the end of their names). The picture
  must show the person standing with the arms straight and away from the body, or the skeleton fits badly. The chair
  and the floor and table-top pictures are Poly Haven's (CC0): "School Chair 01", "Laminate Floor 02", "White Maple
  Veneer". The shelf and the cup of pencils were made the same way as the people.
- To change a person: put the new model in the sources as `adult.glb` or `student.glb`, run `make-real.mjs`, and check
  the words of the explainers that show them (he or she). Heights: the scene stands an adult at 1.66 m and a student at
  1.32 m, measured from the feet to the base of the head. A `sizes.json` beside the sources gives a pack its own:
  `{"adult": {"height": 1.62, "whole": true}, "student": {"height": 1.3, "whole": true}}`. `whole` means the height is
  of the whole figure, crown to sole: use it for a drawn character with a large head (an animated-film style), which the
  ordinary rule would make far too big.
- v25.91: the fingers close (`curl` in `real.js`: lightly at rest, round a thing held or a crayon, a first finger out
  when the hand is held up), where the skeleton has finger joints (names ending HandIndex1..3, HandMiddle1..3, ...).
  All three explainers use the scene (`REAL` in explain.html).

The built file is committed, so `tools/build-release.sh` and `tools/check-build.py` never need node. After a change here:
`bash tools/scene3d/build.sh`, then `bash tools/build-release.sh`, then `node qa/v2578-scene3d-test.js` and
`node qa/v2590-real-scene-test.js`.

Two rules learned the hard way:
- No very large polygon. One 30 m floor was drawn across the whole picture at some camera angles; big surfaces are divided.
- The lighting numbers are half-size floats, which every WebGL 2 device can smooth; full-size ones cannot be on some tablets.
