/* v24.39 the simulation, seeded and marked (review V14 part 1: R-121, R-122, E-02 in part). Each of the twelve forms with a
   simulation is loaded in two fresh pages and the records compared (identical but for ids); the mark: a banner under the
   toolbar, a Simulated tag on the sheets, the flag in the case snapshot and in the case facts; New example, where the form
   draws, loads a different record named by its number and is not offered where the example cannot differ; the mark goes
   when the student box no longer says SIMULATED. usage: node qa/sim139-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const F={'TB-1':'TB-1_Target-Behavior-Development_v2026-09.html','IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','ABC-1':'ABC_Recording_Conditional_Probability_Analysis.html','SP-1':'Scatterplot_Pattern_Analysis.html','PA-1':'PA-1_Preference-Assessment-Protocol_v2026-09.html','RA-1':'Reinforcer_Assessment_Protocol.html','DA-1':'DA-1_Demand-Assessment_v2026-10.html','EA-1':'EA-1_Experimental-Analysis-Protocol_v2026-09.html','TD-1':'TD-1_Function-Based-Treatment-Developer_v2026-09.html','DD-1':'Daily_Behavior_Data_and_Visual_Analysis.html','SM-1':'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','FS-1':'FS-1_FBA-Summary-Report_v2026-09.html'};
const VARIES=['IA-1','ABC-1','SP-1','PA-1','RA-1','EA-1','TD-1','DD-1'];   /* the forms whose example draws; the rest are fixed text */
/* the record as the case snapshot holds it, ids and time stamps set aside; ABC-1 and DD-1 keep their records in state, not in controls */
const RECORD=`(()=>{const norm=o=>JSON.stringify(o,(k,v)=>/^(id|pid|ts|when|saved|created|updated|printed|stamp|editingId)$/i.test(k)?undefined:v).replace(/[a-z]{0,3}_?m[a-z0-9]{7,}/g,'<id>');   /* ids are made from the clock */
  const sn=nbhBridge.snapshot().data;const out={snap:norm(sn)};try{if(typeof state==='object'&&state&&state.entries)out.rec=norm({e:state.entries,s:state.samples});else if(typeof S==='object'&&S&&S.rows)out.rec=norm(S.rows.map(r=>r.values));}catch(e){}return out;})()`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const allErrs=[];
 async function open(id){const ctx=await b.newContext({viewport:{width:1300,height:950}});const p=await ctx.newPage();p.on('pageerror',e=>allErrs.push(id+': '+String(e).slice(0,100)));await p.goto(BASE+'/NBH-Workstation/'+F[id]);await sleep(1500);
   await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});nbhUI.alert=async()=>{};window.alert=()=>{};});return {ctx,p};}
 const load=async p=>{await p.evaluate(()=>{for(const i of ['simBtn','btnLoadExample','load-demo']){const e=document.getElementById(i);if(e){e.click();return;}}});await sleep(3000);};
 const mark=p=>p.evaluate(()=>{const own=document.getElementById('simBanner'),sh=document.getElementById('nbhSimBanner');const sel=document.querySelectorAll('.sheet:not(table),section[data-panel]').length;let facts=null;try{facts=__nbhFactsOut();}catch(e){}
   return {on:nbhSim.state.on,seed:nbhSim.state.seed,label:nbhSim.state.label,banner:!!(sh&&sh.offsetParent)||!!(own&&!own.hidden),bannerText:((sh||own)||{}).textContent||'',tags:document.querySelectorAll('.nbh-sim-tag').length,sheets:sel,flag:nbhBridge.snapshot().data['#nbhSimulated']===true,facts:!!(facts&&facts.simulated),newBtn:!!document.querySelector('.nbh-sim-new')};});
 for(const id of Object.keys(F)){
   const a=await open(id);await load(a.p);const r1=await a.p.evaluate(RECORD);const m1=await mark(a.p);await a.ctx.close();
   const c=await open(id);await load(c.p);const r2=await c.p.evaluate(RECORD);
   ok(id+': two loads in fresh pages give the same record (ids aside)',r1.snap===r2.snap&&(r1.rec===undefined||r1.rec===r2.rec),{snapEq:r1.snap===r2.snap,recEq:r1.rec===r2.rec,len:[r1.snap.length,r2.snap.length]});
   ok(id+': marked after loading: the banner, a Simulated tag on every sheet, the flag in the case snapshot, simulated in the case facts; the standard example named',
     m1.on&&m1.banner&&m1.tags>=Math.min(1,m1.sheets)&&m1.tags===m1.sheets&&m1.flag&&m1.facts&&m1.seed===1&&/standard example/.test(m1.label),m1);
   const varies=VARIES.includes(id);
   ok(id+': New example is '+(varies?'offered (the example draws)':'not offered (the example is fixed text)'),m1.newBtn===varies,{newBtn:m1.newBtn});
   if(varies){await c.p.evaluate(()=>document.querySelector('.nbh-sim-new').click());await sleep(3500);const r3=await c.p.evaluate(RECORD);const m3=await mark(c.p);
     ok(id+': New example loads a different record, named by its number, still marked',(r3.snap!==r2.snap||(r3.rec!==undefined&&r3.rec!==r2.rec))&&m3.on&&m3.seed>1&&/example \d+/.test(m3.label)&&/example \d+/.test(m3.bannerText),{seed:m3.seed,label:m3.label,snapDiff:r3.snap!==r2.snap,recDiff:r3.rec!==r2.rec});}
   /* the student box typed over: the mark goes */
   const gone=await c.p.evaluate(async()=>{const els=[...document.querySelectorAll('input,textarea')].filter(e=>/simulat/i.test(e.value||''));els.forEach(e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});await new Promise(r=>setTimeout(r,2200));return {cleared:els.length,on:nbhSim.state.on,banner:!!(document.getElementById('nbhSimBanner')),tags:document.querySelectorAll('.nbh-sim-tag').length,flag:!!document.getElementById('nbhSimulated').checked};});
   ok(id+': with no field saying SIMULATED any more the mark goes (banner, tags, flag)',gone.cleared>=1&&!gone.on&&!gone.banner&&gone.tags===0&&!gone.flag,gone);
   await c.ctx.close();}
 /* the workstation: a form's simulated example reaches the case facts */
 {const ctx=await b.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>allErrs.push('shell: '+String(e).slice(0,100)));
  await p.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);await p.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};});
  const file=await p.evaluate(()=>ALL.find(f=>f[0]==='SP-1')[2]);await p.evaluate(()=>openForm('SP-1'));await p.waitForFunction(()=>!!state.status['SP-1'],null,{timeout:40000}).catch(()=>{});await sleep(600);
  const fr=p.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);let facts=null;
  if(fr){await fr.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(3000);await p.evaluate(()=>gatherFacts(true));await sleep(1500);facts=await p.evaluate(()=>({sim:state.facts&&state.facts.simulated,src:state.facts&&state.facts.src&&state.facts.src.simulated}));}
  ok('the workstation\'s case facts say which open form holds the simulated example (SP-1 loaded in the workstation)',!!(facts&&facts.sim&&facts.sim['SP-1']===true&&facts.src==='forms'),{frame:!!fr,facts});await ctx.close();}
 ok('no page errors',!allErrs.length,allErrs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
