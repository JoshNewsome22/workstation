#!/usr/bin/env python3
"""Write NBH-Workstation/nbh-asr/: the on-device recogniser behind Form TV-1's "Follow my words" (v21.51).

usage: python3 tools/forms/TV-1/build-asr.py <sherpa-onnx-wasm-simd-v1.13.7-en-asr-zipformer folder> \\
                                             <sherpa-onnx-streaming-zipformer-en-20M-2023-02-17 folder>

The sources are described in tools/vendor/sherpa-onnx/README.md (Apache License 2.0). The build's own model is replaced by
the small int8 one: the loader's file list in sherpa-onnx-wasm-main-asr.js is rewritten for it. The wasm and the model are
cut into parts of 1.8 MB (a host has cut larger files short on an iPad), named in manifest.json with their sizes and
SHA-256, which the form checks as it downloads them. The folder is a subfolder so the offline copy (sw.js) does not list it.
"""
import hashlib, json, os, re, shutil, sys
BUILD, MODEL = sys.argv[1:3]
OUT = 'NBH-Workstation/nbh-asr'
PART = 1800000
shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
parts = [('/decoder.onnx', 'decoder-epoch-99-avg-1.int8.onnx'), ('/encoder.onnx', 'encoder-epoch-99-avg-1.int8.onnx'),
         ('/joiner.onnx', 'joiner-epoch-99-avg-1.int8.onnx'), ('/tokens.txt', 'tokens.txt')]
data, files = b'', []
for name, src in parts:
    b = open(os.path.join(MODEL, src), 'rb').read()
    files.append('{filename:"%s",start:%d,end:%d}' % (name, len(data), len(data) + len(b)))
    data += b
js = open(os.path.join(BUILD, 'sherpa-onnx-wasm-main-asr.js'), encoding='utf-8').read()
m = re.search(r'loadPackage\(\{files:\[.*?\],remote_package_size:\d+\}\)', js)
assert m, 'the loader file list is not where it was in v1.13.7'
js = js[:m.start()] + 'loadPackage({files:[' + ','.join(files) + '],remote_package_size:%d})' % len(data) + js[m.end():]
open(os.path.join(OUT, 'sherpa-onnx-wasm-main-asr.js'), 'w', encoding='utf-8').write(js)
shutil.copy(os.path.join(BUILD, 'sherpa-onnx-asr.js'), OUT)
shutil.copy('tools/forms/TV-1/asr-worker.js', OUT)
shutil.copy('tools/vendor/sherpa-onnx/LICENSE', os.path.join(OUT, 'LICENSE.txt'))
wasm = open(os.path.join(BUILD, 'sherpa-onnx-wasm-main-asr.wasm'), 'rb').read()
blob = wasm + data
man = {'version': 'sherpa-onnx v1.13.7 + streaming-zipformer-en-20M-2023-02-17 int8', 'wasm': [0, len(wasm)],
       'data': [len(wasm), len(blob)], 'size': len(blob), 'sha256': hashlib.sha256(blob).hexdigest(), 'parts': []}
for i in range(0, len(blob), PART):
    chunk = blob[i:i + PART]
    name = 'part-%02d.bin' % (i // PART)
    open(os.path.join(OUT, name), 'wb').write(chunk)
    man['parts'].append({'name': name, 'size': len(chunk), 'sha256': hashlib.sha256(chunk).hexdigest()})
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('wrote %s: %d parts, %.1f MB (wasm %.1f MB, model %.1f MB)' % (OUT, len(man['parts']), len(blob) / 1e6, len(wasm) / 1e6, len(data) / 1e6))
