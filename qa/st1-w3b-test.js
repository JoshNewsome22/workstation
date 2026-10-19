/* Form ST-1, review Wave 3 part 2 (F230, I118): several trainees in one record, on one step list. Each keeps their own rounds,
   probe, report and sign-off; the team table shows every decision; the workstation is told each one; each re-check is due.
   Simulated data only. usage: node qa/st1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const ST='ST-1_Behavior-Skills-Training_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('ST-1: '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/'+ST);await sleep(800);await p.evaluate(()=>{if(window.nbhUI)nbhUI.confirm=async()=>true;});await L.loadSim(p);await sleep(1200);
  const team=()=>p.evaluate(()=>({bar:[...document.querySelectorAll('#stTeam .st-bar button')].map(b=>b.textContent+(b.getAttribute('aria-pressed')==='true'?'*':'')),
    tbl:document.querySelector('#stTeam table')?document.querySelector('#stTeam table').textContent:'',n:S.tr.length,cur:S.cur,trainee:S.meta.trainee||'',rounds:S.rounds.filter(r=>r.date).length,
    codes:Object.keys(S.cells).length,skill:S.meta.skill||'',client:S.meta.client||'',steps:S.steps.length,v:(document.querySelector('#verdictBox .verdict')||{}).className}));
  const t0=await team();
  ok('1 one trainee: the bar offers + Add a trainee, and there is no team table',t0.n===1&&t0.bar.includes('+ Add a trainee')&&t0.bar.some(b=>/Simulated RBT\*/.test(b))&&t0.tbl==='',t0);
  const f0=await p.evaluate(()=>window.__nbhStaffFacts());
  ok('2 the workstation hears one trainee, at criterion',f0&&f0.people.length===1&&f0.people[0].met===true&&f0.all===true,f0);
  await p.evaluate(()=>document.getElementById('stAddBtn').click());await sleep(300);const t1=await team();
  ok('3 + Add a trainee opens a new trainee on the same steps, student and skill, with no rounds or codes of their own',t1.n===2&&t1.cur===1&&t1.trainee===''&&t1.rounds===0&&t1.codes===0&&t1.steps===t0.steps&&t1.skill===t0.skill&&t1.client===t0.client&&/v-mid/.test(t1.v),t1);
  await p.evaluate(()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('trainee','Paula Brennan (simulated)');set('pos','Paraprofessional');
    const d=new Date();const iso=n=>{const x=new Date(d);x.setDate(x.getDate()-n);return x.toISOString().slice(0,10);};
    S.rounds[0].date=iso(1);S.rounds[1].date=iso(1);for(let i=0;i<S.steps.length;i++){S.cells[i+'_0']='C';S.cells[i+'_1']='C';}S.meta.recheck1=iso(-10);renderAll();});
  await sleep(400);const t2=await team();
  ok('4 the team table lists both, with each decision: 1 of 2 at criterion',/The team trained on this plan: 1 of 2 at criterion/.test(t2.tbl)&&/Simulated RBT.*Competent/.test(t2.tbl)&&/Paula Brennan \(simulated\) \(open\)Paraprofessional(Open|Not yet competent)/.test(t2.tbl)&&t2.bar.some(b=>/Paula Brennan \(simulated\)\*/.test(b)),t2);
  const f1=await p.evaluate(()=>window.__nbhStaffFacts());
  ok('5 the workstation hears both trainees and their decisions; the team is not all at criterion',f1.people.length===2&&f1.people[0].name==='Simulated RBT'&&f1.people[0].met===true&&f1.people[1].name==='Paula Brennan (simulated)'&&f1.people[1].met===false&&f1.all===false,f1);
  const t2b=await team();
  ok('6 telling the workstation leaves the open trainee on the sheets as they were',t2b.cur===1&&t2b.trainee==='Paula Brennan (simulated)'&&t2b.codes===t2.codes&&t2b.v===t2.v,{t2,t2b});
  await p.evaluate(()=>document.querySelector('#stTeam [data-st-open="0"]').click());await sleep(300);const t3=await team();
  ok('7 Open on the first trainee puts their own record back: five dated rounds, their codes, Competent',t3.cur===0&&t3.trainee==='Simulated RBT'&&t3.rounds===5&&t3.codes===t0.codes&&/v-ok/.test(t3.v),t3);
  await p.evaluate(()=>document.querySelector('#stTeam [data-st-open="1"]').click());await sleep(300);const t4=await team();
  ok('8 and the second trainee’s record is still theirs',t4.cur===1&&t4.trainee==='Paula Brennan (simulated)'&&t4.codes===t2.codes&&t4.rounds===2,t4);
  const due=await p.evaluate(()=>window.__nbhDue());
  ok('9 the Due list carries each trainee’s first TI-1 re-check, with their name',due.filter(x=>/^First unannounced TI-1 re-check after training: /.test(x.what)).length===2&&due.some(x=>/Paula Brennan \(simulated\)/.test(x.what)),due);
  /* save and open */
  const sv=await p.evaluate(async()=>{let txt=null,name='';const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};
    const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){name=this.download||name;};
    document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;
    stSyncCur();const before=JSON.stringify(S);S=blank();renderAll();
    const dt=new DataTransfer();dt.items.add(new File([txt],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,400));stSyncCur();return {name,same:JSON.stringify(S)===before,n:S.tr.length,cur:S.cur,trainee:S.meta.trainee,saved:JSON.parse(txt).S.tr.map(t=>t.meta.trainee)};});
  ok('10 Save data keeps the whole team (named for it) and Open puts every trainee back as they were',/^ST-1_team-of-2_/.test(sv.name)&&sv.same&&sv.n===2&&sv.cur===1&&sv.trainee==='Paula Brennan (simulated)'&&sv.saved.join('|')==='Simulated RBT|Paula Brennan (simulated)',sv);
  /* print */
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>({bar:getComputedStyle(document.querySelector('#stTeam .st-bar')).display,tbl:getComputedStyle(document.querySelector('#stTeam table')).display,
    open:[...document.querySelectorAll('#stTeam .st-open')].map(e=>getComputedStyle(e).display)}));await p.emulateMedia({media:'screen'});
  ok('11 on paper the team table prints and the buttons do not',pr.bar==='none'&&pr.tbl!=='none'&&pr.open.every(d=>d==='none'),pr);
  /* remove */
  await p.evaluate(()=>document.getElementById('stRmBtn').click());await sleep(400);const t5=await team();
  ok('12 Remove this trainee takes the open one out and opens the other; with one left the table goes',t5.n===1&&t5.cur===0&&t5.trainee==='Simulated RBT'&&t5.rounds===5&&t5.tbl==='',t5);
  /* a record saved before several trainees */
  const old=await p.evaluate(async()=>{const s=JSON.parse(JSON.stringify(S));delete s.tr;delete s.cur;const t=JSON.stringify({form:'ST-1',rev:'2026-09',S:s});S=blank();renderAll();
    const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,400));return {n:S.tr.length,cur:S.cur,trainee:S.meta.trainee,f:window.__nbhStaffFacts()};});
  ok('13 a record saved before opens as one trainee',old.n===1&&old.cur===0&&old.trainee==='Simulated RBT'&&old.f.people.length===1,old);
  /* ---- I117 a baseline round; I116 the trainer and plan source from the case ---- */
  const bl=await p.evaluate(()=>{S.nRounds=6;while(S.rounds.length<6)S.rounds.push({date:'',type:'',fb:''});const d=S.rounds[0].date;S.rounds[5]={date:d,type:'Baseline (before training)',fb:''};
    for(let i=0;i<S.steps.length;i++)S.cells[i+'_5']=i<3?'C':'EO';renderAll();const M=metrics();
    return {used:M.used.map(x=>x.j),v:document.querySelector('#verdictBox .verdict').className,cards:document.getElementById('metricWrap').textContent,graph:document.getElementById('acqPlot').textContent,
      opt:[...document.querySelectorAll('select[data-f="type"]')][0].innerHTML};});
  ok('15 I117 a round marked Baseline (before training) is shown beside the figures and kept out of the criterion and the decision',
    !bl.used.includes(5)&&/v-ok/.test(bl.v)&&/Baseline, before training/.test(bl.cards)&&/R6: not counted toward the criterion/.test(bl.cards)&&/Baseline before training \(not counted\): R6/.test(bl.graph)&&/Baseline \(before training\)/.test(bl.opt),bl);
  const fi=await p.evaluate(()=>{S.meta.trainer='';S.meta.src='';S.meta.bcba='Jordan Ellis (simulated)';renderAll();const r=window.__nbhFactsIn({plan:{adoption:{date:'2026-09-24',version:1}}});
    return {r,trainer:S.meta.trainer,src:S.meta.src,el:document.querySelector('[data-m="src"]').value};});
  ok('16 I116 the trainer comes from the case BCBA and the plan source from Form TD-1’s adoption, while empty',fi.trainer==='Jordan Ellis (simulated)'&&fi.src==='BIP v1 adopted 9/24/2026, Form TD-1'&&fi.el===fi.src&&/the trainer and the plan source from the case/.test((fi.r&&fi.r.note)||''),fi);
  const fi2=await p.evaluate(()=>{S.meta.src='BIP of 8/1/2026 (typed)';renderAll();window.__nbhFactsIn({plan:{adoption:{date:'2026-09-24',version:2}}});return S.meta.src;});
  ok('17 I116 a plan source already typed is kept',fi2==='BIP of 8/1/2026 (typed)',fi2);
  ok('18 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
