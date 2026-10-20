/* v23.66 (review Wave 4, I243): Form QS-1's staff quick start in large print.
   1. The Quick Start, As It Prints offers Regular print and Large print; Regular prints as before.
   2. Large print sets the handout about a third larger on paper than its regular print (1.24 to 1.65), the pages reflowing
      (more of them, none cut), while the screen preview stays as it is.
   3. The choice is kept with the form: saved and opened again it holds, and the master print prints the handout large.
   Simulated data only.  usage: node qa/i243-large-print-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1000):''));if(!c)fails++;};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));const f=L.forms().find(x=>x.id==='QS-1');
  await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1200);await L.loadSim(p);await sleep(1800);
  const opts=await p.evaluate(()=>[...document.querySelectorAll('#qsLp option')].map(o=>o.value+':'+o.textContent));
  const meas=async()=>p.evaluate(()=>{const pg=document.querySelector('#out .qs-page:not(.qs-flow)');return pg?Number(getComputedStyle(pg).zoom)||1:0;});
  const scr0=await p.evaluate(()=>document.getElementById('out').getBoundingClientRect().height);
  await p.emulateMedia({media:'print'});const h0=await meas();const pdf0=await p.pdf({format:'Letter'});await p.emulateMedia({media:'screen'});
  ok('1 the handout offers Regular print and Large print, Regular by default',opts.length===2&&opts[0].startsWith(':Regular')&&/^large:Large print/.test(opts[1])&&await p.evaluate(()=>document.getElementById('qsLp').value==='')&&!(await p.evaluate(()=>document.getElementById('out').classList.contains('qs-lp'))),opts);
  await p.selectOption('#qsLp','large');await sleep(900);
  const scr1=await p.evaluate(()=>document.getElementById('out').getBoundingClientRect().height);
  await p.emulateMedia({media:'print'});const h1=await meas();const pdf1=await p.pdf({format:'Letter'});
  const cut=await p.evaluate(()=>[...document.querySelectorAll('#out .qs-page')].filter(pg=>pg.scrollWidth>pg.clientWidth+2).length);await p.emulateMedia({media:'screen'});
  const n0=pages(pdf0),n1=pages(pdf1);
  const s1=await p.evaluate(()=>Number(getComputedStyle(document.querySelector('#out .qs-page:not(.qs-flow)')).zoom)||1);
  ok('2a Large print: the handout is set about a third larger on paper (scale '+h0+' to '+h1+'), the screen at 1 ('+s1+')',h0===1.24&&h1===1.65&&s1===1,{h0,h1,s1});
  ok('2b the pages reflow: more of them ('+n0+' to '+n1+'), none cut at the side',n1>n0&&n1<=n0+5&&cut===0,{n0,n1,cut});
  ok('2c the screen preview stays as it is',Math.abs(scr1-scr0)<2,{scr0,scr1});
  /* kept with the form */
  const own=await p.evaluate(async()=>await nbhBridge.ownSave());
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push('reopened: '+e.message));await p2.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1200);
  await p2.evaluate(async t=>{await nbhBridge.ownOpen(t);},own);await sleep(1200);
  const re=await p2.evaluate(()=>({v:document.getElementById('qsLp').value,cls:document.getElementById('out').classList.contains('qs-lp')}));
  ok('3a saved and opened again, the handout is still in large print',/"lp":\s*"large"/.test(own||'')&&re.v==='large'&&re.cls,re);
  const s=await ctx.newPage();s.on('pageerror',e=>errs.push('shell: '+e.message));await s.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await s.evaluate(async own=>{openForm('QS-1');const t0=performance.now();while(!state.status['QS-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));await state.frames['QS-1'].contentWindow.nbhBridge.ownOpen(own);await new Promise(r=>setTimeout(r,1200));},own);
  const pop=s.waitForEvent('popup',{timeout:120000});await s.evaluate(()=>masterRun(ALL.filter(([id])=>id==='QS-1'),{check:false}));const w=await pop;
  await s.waitForFunction(()=>$('#masterPrint').textContent==='Build master print',null,{timeout:120000});await sleep(1500);await w.emulateMedia({media:'print'});
  const mz=await w.evaluate(()=>{const pg=document.querySelector('#sec-QS-1 .qs-lp .qs-page:not(.qs-flow)');return pg?getComputedStyle(pg).zoom:'none';});
  ok('3b the master print prints the handout large',String(mz)==='1.65',{mz});
  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
