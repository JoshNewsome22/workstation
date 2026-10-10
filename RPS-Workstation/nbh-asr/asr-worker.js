/* nbh-asr/asr-worker.js (v21.51): Form TV-1's on-device speech recognition, for "Follow my words" on the teleprompter.
   sherpa-onnx (k2-fsa, Apache License 2.0, nbh-asr/LICENSE.txt) with a small streaming English model, in a worker so the
   teleprompter keeps scrolling smoothly. The page sends the wasm and the model (downloaded once and kept on the device),
   then audio at 16 kHz; the worker answers with the words heard. Nothing is recorded and nothing leaves the device. */
let rec = null, st = null;
self.onmessage = function (e) {
  const d = e.data || {};
  if (d.t === 'init') {
    self.Module = {
      wasmBinary: d.wasm,
      getPreloadedPackage: function () { return d.data; },
      locateFile: function (p) { return p; },
      print: function () {}, printErr: function () {},
      onRuntimeInitialized: function () {
        try { rec = createOnlineRecognizer(self.Module); st = rec.createStream(); self.postMessage({t: 'ready'}); }
        catch (err) { self.postMessage({t: 'error', m: String(err && err.message || err)}); }
      }
    };
    /* v21.78 the page hands the two scripts as blob URLs it keeps on the device (offline); else from beside this file */
    try { if (d.libs && d.libs.length === 2) importScripts(d.libs[0], d.libs[1]); else importScripts('sherpa-onnx-asr.js', 'sherpa-onnx-wasm-main-asr.js'); }
    catch (err) { self.postMessage({t: 'error', m: String(err && err.message || err)}); }
  } else if (d.t === 'audio' && st) {
    st.acceptWaveform(16000, d.s);
    while (rec.isReady(st)) rec.decode(st);
    const text = rec.getResult(st).text || '', end = rec.isEndpoint(st);
    self.postMessage({t: 'res', text: text, end: end, n: d.n});
    if (end) rec.reset(st);
  } else if (d.t === 'reset' && st) {
    rec.reset(st);
  }
};
