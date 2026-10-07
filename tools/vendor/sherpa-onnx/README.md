# sherpa-onnx (the recogniser behind Form TV-1's "Follow my words")

Form TV-1's teleprompter can follow the presenter's voice with speech recognition that runs on the device: the audio
never leaves it. The recogniser is **sherpa-onnx** (k2-fsa, Apache License 2.0, `LICENSE` here), its WebAssembly build
for the web, with a small streaming English model.

| Part | Where it comes from | SHA-256 of the archive |
| --- | --- | --- |
| The WebAssembly build | `https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.7/sherpa-onnx-wasm-simd-v1.13.7-en-asr-zipformer.tar.bz2` (its `sherpa-onnx-asr.js`, `sherpa-onnx-wasm-main-asr.js` and `sherpa-onnx-wasm-main-asr.wasm`; its own 190 MB model is not used) | `21559527d65f7674a45834870e4f51b0af14be27d4de1043aa6f576d9b426acc` |
| The model | `https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17.tar.bz2` (the int8 encoder, decoder and joiner and `tokens.txt`; exported from icefall's pruned-transducer-stateless7-streaming small LibriSpeech model, Apache License 2.0) | `9c559283e8498d3fe95913c79ca1cb454bb26281ac2b102b41306c7d752765d9` |

`tools/forms/TV-1/build-asr.py <the unpacked build folder> <the unpacked model folder>` writes `NBH-Workstation/nbh-asr/`:
the two scripts (the loader's file list rewritten for the small model), the worker that runs the recogniser
(`tools/forms/TV-1/asr-worker.js`), and the wasm and the model together cut into parts of 1.8 MB (`part-00.bin` …), with
`manifest.json` naming each part's size and SHA-256. The form downloads the parts only when "Follow my words" is first
chosen, checks each, and keeps them on the device (Cache Storage, `tv1-voice-model`); the offline copy of the workstation
(`sw.js`) does not list them, so nobody downloads them who does not use them.
