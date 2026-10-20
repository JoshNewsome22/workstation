/* v23.61 (review Wave 4, I237): speed and size checks in the release run, so a slowdown shows up here instead of on a
   BCBA's iPad in the middle of a school day. Counts and bytes first; the times are generous (a busy machine must not
   fail them), each about four times what it took when the budget was set.
   1. Bytes: the workstation page, each form, the forms together, the shared scripts every form loads, and the folder
      (without the speech recogniser), each under its budget (qa/budget.json says each and why).
   2. A form opened loads none of the recorded narrations (some 9 MB) until its walkthrough plays (review F474).
   3. A case of six forms opened from the caseload loads one form (I239): one frame, page elements under the budget.
   4. Times: the workstation opens, a form opens in it, the case opens, each within its limit.
   Simulated data only.  usage: node qa/budget-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;const path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const B=JSON.parse(fs.readFileSync(path.join(__dirname,'budget.json'),'utf8')),W=path.join(L.ROOT,'NBH-Workstation');
const kb=n=>Math.round(n/1024);const size=f=>{try{return fs.statSync(path.join(W,f)).size;}catch(e){return 0;}};
function folderBytes(d,skip){let t=0;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.includes(e.name))continue;const p=path.join(d,e.name);t+=e.isDirectory()?folderBytes(p,[]):fs.statSync(p).size;}return t;}
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  /* 1. bytes */
  const forms=L.forms(),over=[];
  const ix=size('index.html');if(ix>B.kb.index*1024)over.push('index.html '+kb(ix)+' KB > '+B.kb.index);
  let all=0;for(const f of forms){const n=size(f.file);all+=n;if(n>B.kb.form*1024)over.push(f.id+' '+kb(n)+' KB > '+B.kb.form);}
  if(all>B.kb.forms*1024)over.push('the forms together '+kb(all)+' KB > '+B.kb.forms);
  const shared=B.shared.reduce((t,f)=>t+size(f),0);if(shared>B.kb.shared*1024)over.push('the shared scripts '+kb(shared)+' KB > '+B.kb.shared);
  const folder=folderBytes(W,['nbh-asr']);if(folder>B.kb.folder*1024)over.push('the folder '+kb(folder)+' KB > '+B.kb.folder);
  ok('1 bytes: the page '+kb(ix)+' KB, the largest form '+kb(Math.max(...forms.map(f=>size(f.file))))+' KB, the '+forms.length+' forms '+kb(all)+' KB, the shared scripts '+kb(shared)+' KB, the folder '+kb(folder)+' KB: each under its budget',
    forms.length>40&&B.shared.every(f=>size(f)>0)&&!over.length,over);
  /* 2. the narrations wait for the walkthrough */
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const got=[];ctx.on('request',r=>{const u=r.url();if(/-narration\.js/.test(u))got.push(u.replace(/.*\//,''));});
  for(const id of B.narrated){const f=forms.find(x=>x.id===id);if(!f)continue;const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file),{waitUntil:'load'});await sleep(1500);await p.close();}
  ok('2 the '+B.narrated.length+' forms with recorded narration load none of it until a walkthrough plays (review F474)',!got.length,got);
  /* 3 and 4: the workstation, a form, a case of six */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));
  let t=Date.now();await p.goto(L.BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await p.waitForFunction(()=>typeof openForm==='function'&&document.readyState==='complete');const tShell=Date.now()-t;
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};wsUI.choose=async()=>'switch';}catch(e){}try{localStorage.removeItem('nbh.warm');}catch(e){}});
  t=Date.now();await p.evaluate(()=>openForm('TB-1'));await p.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:30000}).catch(()=>{});const tForm=Date.now()-t;
  const IDS=['TB-1','FS-1','DD-1','PA-1','GB-1','TD-1'];
  const forms6=await p.evaluate(async IDS=>{const out={};for(const id of IDS){if(!state.frames[id])openForm(id);const fr=state.frames[id];const t0=performance.now();while(!state.status[id]&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));
      try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1600));}}catch(e){}}
    for(const id of IDS){const s=await grab(id,'snapshot',null,8000);if(s&&s.snap)out[id]={title:s.title||id,snap:s.snap};}return out;},IDS);
  const d={form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:{client:'Mateo Rivera (simulated)',sid:'4471823',grade:'4',site:'Test Elementary (simulated)',bcba:'Jordan Ellis (simulated)'},forms:forms6,cur:'TD-1'};
  const key=await p.evaluate(async t=>{await openCaseText(t,null,{asked:true,quiet:true});const k=clKey(packet());await caseloadKeep(packet(),parseCase(t).forms,[]);await clearCase();return k;},JSON.stringify(d));
  await sleep(500);t=Date.now();await p.evaluate(k=>caseloadGo(k,'DD-1'),key);await p.evaluate(()=>settled('DD-1',20000));const tCase=Date.now()-t;
  await sleep(4000);
  const c=await p.evaluate(()=>{let n=document.getElementsByTagName('*').length;Object.values(state.frames).forEach(fr=>{try{n+=fr.contentDocument.getElementsByTagName('*').length;}catch(e){}});
    return {frames:Object.keys(state.frames),pending:Object.keys(state.pending).length,elements:n};});
  ok('3 a case of six forms opened from the caseload loads one form: '+c.frames.length+' frame, '+c.elements+' page elements (budget '+B.elements+')',Object.keys(forms6).length===6&&c.frames.join()==='DD-1'&&c.pending===5&&c.elements<B.elements,c);
  ok('4 times: the workstation opens in '+tShell+' ms (limit '+B.ms.shell+'), a form in '+tForm+' ms ('+B.ms.form+'), the case to its form in '+tCase+' ms ('+B.ms.caseOpen+')',
    tShell<B.ms.shell&&tForm<B.ms.form&&tCase<B.ms.caseOpen,{tShell,tForm,tCase});
  ok('5 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
