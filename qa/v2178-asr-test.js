/* v21.78 Form TV-1's speech recogniser offline: after one start online (the manifest, the parts and the three scripts kept in
   the 'tv1-voice-model' cache), it starts again with the website unreachable (every nbh-asr/ request refused).
   usage: node qa/v2178-asr-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext();const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html');await sleep(1000);
  const start=()=>page.evaluate(async()=>{try{const f=await asrFiles(()=>{});const L=await asrLibs();const w=new Worker(L.worker);
    const r=await new Promise(res=>{const t=setTimeout(()=>res('timeout'),60000);w.onmessage=e=>{const d=e.data||{};if(d.t==='ready'||d.t==='error'){clearTimeout(t);res(d.t+(d.m?': '+d.m:''));}};w.postMessage({t:'init',wasm:f.wasm,data:f.data,libs:L.libs},[f.wasm,f.data]);});
    w.terminate();const keys=(await (await caches.open(ASR_CACHE)).keys()).map(k=>k.url.split('/').pop());return {r,keys};}catch(e){return {r:'threw: '+e.message,keys:[]};}});
  const a=await start();
  ok('online: the recogniser starts, and the manifest and the three scripts are kept with the parts',a.r==='ready'&&['manifest.json','asr-worker.js','sherpa-onnx-asr.js','sherpa-onnx-wasm-main-asr.js','part-00.bin'].every(n=>a.keys.includes(n)),a);
  let refused=0;await page.route('**/nbh-asr/**',r=>{refused++;r.abort();});
  const b=await start();
  ok('offline (every nbh-asr/ request refused): it starts again from the device',b.r==='ready'&&refused>0,{b,refused});
  ok('no errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
