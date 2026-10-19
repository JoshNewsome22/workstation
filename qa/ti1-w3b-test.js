/* Form TI-1, review Wave 3 part 2: a Safety tag, and a safety step coded Commission calls for the incident report (F246); steps
   from QS-1's non-negotiables are tagged where their words say so and the verdict waits until they are checked (F242); the
   retraining sheet asks why first (F243); an observation replaced in its column is kept on the record (F239).
   Simulated data only. usage: node qa/ti1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const TI='TI-1_Treatment-Integrity-Observation_v2026-09.html';
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(TI);
  /* ---- F242 steps from QS-1 ---- */
  const q=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({quick:{rules:[
      {do:'Offer the break card when the task begins (simulated)'},
      {do:'Give the computer after calm and the finished task',dont:'Use them to end a behavior in progress'},
      {do:'Move the other students away',dont:'Hold him, grab him or block the door'},
      {do:'Praise each request for a break (simulated)'}]}});
    const banner=document.getElementById('tiQsBanner');
    return {r,from:S.meta.fromQs,steps:S.steps.map(s=>({cmp:s.cmp,crit:s.crit})),banner:banner?banner.textContent:''};});
  ok('1 F242 steps from Form QS-1: a line that names a hold or a block is tagged Safety (critical), a reinforcer used to end a behavior Consequence (critical), the rest wait for the BCBA',
    q.from==='1'&&q.steps.length>=4&&q.steps[2].cmp==='safe'&&q.steps[2].crit&&q.steps[1].cmp==='con'&&q.steps[1].crit&&q.steps[0].cmp===''&&q.steps[3].cmp===''&&/Check the steps’ tags/.test(q.banner),q);
  const q2=await p.evaluate(d=>{S.nObs=2;S.critN=2;S.obs=[{date:d[0],type:'Unannounced'},{date:d[1],type:'Unannounced'}];for(let j=0;j<2;j++)for(let i=0;i<4;i++)S.cells[i+'_'+j]='C';renderAll();
    const a=document.querySelector('#verdictBox').textContent;document.getElementById('tiQsOk').click();const b=document.querySelector('#verdictBox').textContent;
    return {a,b,from:S.meta.fromQs||'',banner:!!document.getElementById('tiQsBanner')};},[iso(-9),iso(-2)]);
  ok('2 F242 the verdict waits while scored steps are untagged; Tags checked lets it be read',/^Not yet decidable: the steps came from Form QS-1’s non-negotiables/.test(q2.a)&&/^Criterion met/.test(q2.b)&&q2.from===''&&!q2.banner,q2);
  /* ---- F246 safety ---- */
  const s1=await p.evaluate(()=>{const opts=[...document.querySelectorAll('#stepTbl select[data-f="cmp"]')][0].innerHTML;
    S.steps[3].crit=false;const sel=document.querySelector('#stepTbl select[data-s="3"][data-f="cmp"]');sel.value='safe';sel.dispatchEvent(new Event('change',{bubbles:true}));
    return {opts};});
  await sleep(200);
  const s2=await p.evaluate(()=>{const crit3=S.steps[3].crit;S.cells['2_1']='EC';renderAll();const f=window.__nbhFactsOut();
    return {crit3,sum:(document.getElementById('tiSafetySum')||{}).textContent||'',score:(document.getElementById('tiSafetyScore')||{}).textContent||'',safety:f&&f.integrity&&f.integrity.safety};});
  ok('3 F246 a Safety tag is offered, and a step tagged Safety is critical',/Safety/.test(s1.opts)&&s2.crit3===true,{s1,s2});
  ok('4 F246 a safety step coded Commission shows the incident report and the parent’s notice that day, on the Summary and the Scoring sheet, and the case is told',
    /A safety step was coded Commission\./.test(s2.sum)&&/Observation #2 .*step 3/.test(s2.sum)&&/incident report within 24 hours/.test(s2.sum)&&/s\. 1003\.573\(7\)\(a\) and \(7\)\(c\)/.test(s2.sum)&&/Seclusion is prohibited/.test(s2.sum)&&
    s2.score===s2.sum&&Array.isArray(s2.safety)&&s2.safety.length===1&&s2.safety[0].step===3&&s2.safety[0].col===2,s2);
  /* ---- F243 why first ---- */
  const w=await p.evaluate(()=>{S.meta.barrier='Room short one adult; the aide covers two students (simulated)';S.cells['0_1']='EO';renderAll();return (document.getElementById('rtWhyNote')||{}).textContent||'';});
  ok('5 F243 the retraining sheet asks why first, says the recommendations assume a skill, and quotes the barriers recorded',/^Why first\. For each step below, ask: can the interventionist do it correctly in rehearsal now\?/.test(w)&&/find out why with Form PD-1/.test(w)&&
    /Each recommendation below assumes the cause is a skill/.test(w)&&/Barriers recorded on this form: “Room short one adult/.test(w),w);
  /* ---- F239 the observation replaced is kept ---- */
  const a=await p.evaluate(()=>{window.tiArchive(0);renderAll();return {past:JSON.parse(JSON.stringify(S.past||[])),t:(document.getElementById('tiPast')||{}).textContent||''};});
  ok('6 F239 an observation replaced in its column is kept on the record with its date and figures, and listed on the Summary',a.past.length===1&&a.past[0].pct===100&&a.past[0].type==='Unannounced'&&a.past[0].col===1&&/Earlier Observations Kept on This Record/.test(a.t),a);
  const rt=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;S=blank();renderAll();
    const dt=new DataTransfer();dt.items.add(new File([txt],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,400));return {past:(S.past||[]).length,cmp:S.steps.map(s=>s.cmp).join(',')};});
  ok('7 F239 F246 the kept observations and the Safety tag are saved and opened again',rt.past===1&&/safe/.test(rt.cmp),rt);
  /* ---- the shell's Today ---- */
  const sh=await open('index.html');
  const td=await sh.evaluate(d=>{state.facts={integrity:{criterion:90,obs:[{date:d,type:'Unannounced',pct:95}],safety:[{date:d,step:3,col:2}]},data:{incidentList:[]}};
    const a=todayItems().filter(x=>x.k==='Safety').map(x=>x.t);state.facts.data.incidentList=[{date:d,beh:'X',hold:'restraint'}];const b=todayItems().filter(x=>x.k==='Safety').length;state.facts={};return {a,b};},iso(-1));
  ok('8 F246 Today names a safety step coded Commission on TI-1 until DD-1’s incident log holds a restraint that day',td.a.length===1&&/Form TI-1 recorded a safety step \(step 3\) as Commission/.test(td.a[0])&&td.b===0,td);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
