// tools/scene3d/make-real.mjs: write NBH-Workstation/nbh-scene3d-real.js, the pack the real-looking scene draws with.
//
// The pack is ONE ordinary script (the pages also open from a folder, where a page may fetch no file): it sets
// window.NBHSceneReal to models and pictures carried as text. Each model is a small .glb with its pictures taken out
// (the engine gives it its surface from the pictures beside it, so nothing has to be fetched while the model is read).
//
//   node make-real.mjs SOURCES_DIR OUT.js
//
// SOURCES_DIR holds the sources, which are NOT kept in the repository (see README.md, "The real-looking scene"):
//   adult.glb, student.glb     simulated people with a 52-joint skeleton (names ending Hips, Spine, LeftArm, ...)
//   sizes.json (optional)      their heights, where the scene's own are not right (see below)
//   chair.gltf (+ its files)   Poly Haven "School Chair 01" (CC0)
//   shelf.glb, cup.glb         a cubby shelf with bins and a cup of pencils
//   floor.jpg, maple.jpg       Poly Haven "Laminate Floor 02" and "White Maple Veneer" colour pictures (CC0)
// It needs @gltf-transform/core, /extensions and /functions, meshoptimizer and sharp from the package registry.
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, quantize, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) { console.error('usage: node make-real.mjs SOURCES_DIR OUT.js'); process.exit(2); }
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const jpg = async (buf, px, q) => 'data:image/jpeg;base64,' + (await sharp(Buffer.from(buf)).resize(px, px, { fit: 'inside' }).jpeg({ quality: q, mozjpeg: true }).toBuffer()).toString('base64');
const tris = d => d.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0), 0);

// one model: fewer triangles, whole numbers in place of long ones, and its pictures beside it (their coordinates stay
// in the model: prune is told to keep them)
async function model(file, want, px) {
  const d = await io.read(path.join(SRC, file)), before = tris(d), e = {};
  await d.transform(dedup(), weld());
  if (want && before > want) await d.transform(simplify({ simplifier: MeshoptSimplifier, ratio: want / before, error: 0.01 }));
  const m = d.getRoot().listMaterials()[0];
  const take = async (get, set, key, size, q) => { const t = get.call(m); if (t && size) e[key] = await jpg(t.getImage(), size, q); set.call(m, null); };
  await take(m.getBaseColorTexture, m.setBaseColorTexture, 'map', px.map, 82);
  await take(m.getNormalTexture, m.setNormalTexture, 'nor', px.nor, 76);
  await take(m.getMetallicRoughnessTexture, m.setMetallicRoughnessTexture, 'arm', px.arm, 76);
  m.setOcclusionTexture(null); m.setEmissiveTexture(null);
  // plain names for everything but the joints, whose names the scene finds them by
  const joints = new Set(d.getRoot().listSkins().flatMap(s => s.listJoints()));
  d.getRoot().listMeshes().forEach(x => x.setName('body')); d.getRoot().listNodes().filter(n => !joints.has(n)).forEach(n => n.setName(n.getMesh() ? 'body' : 'holder'));
  d.getRoot().listScenes().forEach(s => s.setName('scene')); d.getRoot().listSkins().forEach(s => s.setName('skeleton')); m.setName('surface');
  for (const x of [...d.getRoot().listAccessors(), ...d.getRoot().listBuffers()]) x.setName('');
  for (const x of [...d.getRoot().listMeshes(), ...d.getRoot().listNodes(), ...d.getRoot().listMaterials(), ...d.getRoot().listScenes()]) x.setExtras({});   // the makers' own labels
  await d.transform(prune({ keepAttributes: true }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }));
  const glb = await io.writeBinary(d);
  e.glb = Buffer.from(glb).toString('base64');
  console.log(file, Math.round(before), '->', Math.round(tris(d)), 'triangles;', glb.length, 'bytes;', Object.keys(e).filter(k => k !== 'glb').map(k => k + ' ' + Math.round(e[k].length * .75 / 1024) + ' KB').join(', '));
  return e;
}
const pack = { v: 1 };
pack.adult = await model('adult.glb', 70000, { map: 2048, nor: 1024 });
pack.student = await model('student.glb', 70000, { map: 2048, nor: 1024 });
// sizes.json (optional): { "adult": { "height": 1.5, "whole": true }, "student": { ... } }: how tall each person stands,
// and whether that is the whole figure (a drawn character with a large head) or an ordinary build (the scene's default)
if (fs.existsSync(path.join(SRC, 'sizes.json'))) { const z = JSON.parse(fs.readFileSync(path.join(SRC, 'sizes.json'), 'utf8')); for (const k of ['adult', 'student']) if (z[k]) Object.assign(pack[k], z[k]); }
pack.chair = await model('chair.gltf', 0, { map: 1024, nor: 512, arm: 512 });
pack.shelf = await model('shelf.glb', 16000, { map: 1024 });
pack.cup = await model('cup.glb', 6000, { map: 512 });
pack.floor = await jpg(fs.readFileSync(path.join(SRC, 'floor.jpg')), 1024, 78);
pack.maple = await jpg(fs.readFileSync(path.join(SRC, 'maple.jpg')), 512, 80);
const banner = fs.readFileSync(new URL('./banner-real.txt', import.meta.url), 'utf8');
fs.writeFileSync(OUT, banner + 'window.NBHSceneReal=' + JSON.stringify(pack) + ';\n');
console.log(path.basename(OUT) + ': ' + fs.statSync(OUT).size + ' bytes');
