/* v23.62 (review Wave 4, I240): the packet is built two forms at a time and carries each picture once.
   A simulated case of eight forms, saved and opened again (one form loaded), then Build master print:
   1. two forms load and fill at a time, never more; the packet's sections are in the order of the list;
   2. the page as written holds each picture once (the letterhead was written once a form), every picture shows in the
      packet, and none is left waiting for its place;
   3. the case is still as saved, and no more forms stay loaded than the workstation keeps (FRAME_CAP).
   Simulated student only.  usage: node qa/i240-packet-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IDS=['DM-1','TB-1','FS-1','DD-1','GB-1','TD-1','TK-1','ST-1'];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};}catch(e){}try{localStorage.removeItem('nbh.warm');}catch(e){}});
  const t=await p.evaluate(async IDS=>{for(const id of IDS){openForm(id);const fr=state.frames[id];const t0=performance.now();while(!state.status[id]&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));
      try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1600));}}catch(e){}}
    const forms={};for(const id of IDS){const s=await grab(id,'snapshot',null,8000);if(s&&s.snap)forms[id]={title:s.title||id,snap:s.snap};}
    return JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:packet(),forms,facts:state.facts||undefined,cur:IDS[0]});},IDS);
  await p.evaluate(async t=>{await clearCase();await openCaseText(t,null,{asked:true,quiet:true});},t);await sleep(1500);
  const before=await p.evaluate(()=>({frames:Object.keys(state.frames),dirty:caseDirty()}));
  /* how many fill at once, and the page as it is written */
  await p.evaluate(()=>{window.__inflight=0;window.__max=0;const wf=warmForm;warmForm=async function(id){__inflight++;__max=Math.max(__max,__inflight);try{return await wf.apply(this,arguments);}finally{__inflight--;}};
    const o=window.open;window.open=function(){const w=o.apply(this,arguments);try{const d=w.document,dw=d.write.bind(d);d.write=function(s){if(s.length>100000)window.__mpDoc=s;return dw(s);};}catch(e){}return w;};});
  const pop=p.waitForEvent('popup',{timeout:120000});
  await p.evaluate(IDS=>{IDS.forEach(id=>state.ticked[id]=true);masterRun(ALL.filter(([id])=>IDS.includes(id)),{check:false});},IDS);
  const w=await pop;await p.waitForFunction(()=>$('#masterPrint').textContent==='Build master print',null,{timeout:180000});await sleep(2000);
  const r=await p.evaluate(IDS=>{const s=window.__mpDoc||'';const u=s.match(/data:image\/[a-z+]+;base64,[A-Za-z0-9+\/=]{4000,}/g)||[];const c={};u.forEach(x=>{c[x]=(c[x]||0)+1;});
    return {max:window.__max,len:s.length,big:u.length,twice:Object.values(c).filter(n=>n>1).length,frames:Object.keys(state.frames).length,cap:FRAME_CAP,dirty:caseDirty(),order:ALL.filter(([id])=>IDS.includes(id)).map(x=>x[0])};},IDS);
  const shown=await w.evaluate(()=>({secs:[...document.querySelectorAll('section.mp-sec')].map(x=>x.id.replace(/^sec-/,'')),imgs:document.images.length,
    broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>(i.className||i.alt||'').slice(0,30)),svg:[...document.querySelectorAll('image')].filter(x=>!x.getAttribute('href')&&!x.getAttribute('xlink:href')).length,left:document.querySelectorAll('[data-mp-pic]').length}));
  ok('1 two forms load and fill at a time, never more ('+r.max+'), and the sections are in the list\'s order',before.frames.length===1&&r.max===2&&shown.secs.join()===r.order.join(),{max:r.max,secs:shown.secs,order:r.order,before});
  ok('2 each picture is written once ('+r.big+' pictures of 4 KB or more in '+Math.round(r.len/1024)+' KB), every one shows ('+shown.imgs+' images), none left waiting for its place',
    r.big>0&&r.twice===0&&shown.imgs>8&&!shown.broken.length&&!shown.svg&&!shown.left,{r,shown});
  ok('3 the case is still as saved, and no more forms stay loaded than the workstation keeps',!r.dirty&&!before.dirty&&r.frames<=r.cap,{dirty:r.dirty,frames:r.frames,cap:r.cap});
  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
