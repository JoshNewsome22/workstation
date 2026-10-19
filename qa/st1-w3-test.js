/* Form ST-1, review Wave 3 part 1: the sign-off cannot clear a trainee the decision does not (F228); a file another form saved is
   refused (F229); the error-class sentence says what the studies show (F231); the first TI-1 re-check is a date on the Due list
   (F232); a probe dated before training is not its probe (F233); an imported probe is judged on TI-1's criterion (F234); the
   round beside its code (F235); one confidentiality line (F236); the trainer's note out of the trainee's report (F237).
   Simulated data only. usage: node qa/st1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const ST='ST-1_Behavior-Skills-Training_v2026-09.html',TI='TI-1_Treatment-Integrity-Observation_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('ST-1: '+e.message));const alerts=[];p.on('dialog',d=>{alerts.push(d.message());d.accept().catch(()=>{});});
  await p.goto(L.BASE+'/NBH-Workstation/'+ST);await sleep(800);await p.evaluate(()=>{if(window.nbhUI)nbhUI.confirm=async()=>true;});await L.loadSim(p);await sleep(1200);
  const setM=(o)=>p.evaluate(o=>{for(const k in o){const e=document.querySelector('[data-m="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},o);
  const st=()=>p.evaluate(()=>({v:document.querySelector('#verdictBox .verdict').className+' | '+document.querySelector('#verdictBox').textContent,chk:document.getElementById('stSignChk').textContent,
    row:!document.getElementById('stOvRow').hidden,f:window.__nbhStaffFacts()}));
  /* ---- F236 ---- */
  const t0=await p.evaluate(()=>({mast:document.querySelector('.nbh-formmeta').textContent,css:[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n')}));
  ok('1 F236 one line on screen and on paper: a staff training record naming a student, filed with the student’s behavior file and in the trainee’s supervision record',
    /Confidential staff training record naming a student/.test(t0.mast)&&/Confidential staff training record naming a student: file with the student's behavior file and in the trainee's supervision record\./.test(t0.css)&&!/Confidential student record\. Retain/.test(t0.css),t0.mast);
  /* ---- F228 ---- */
  const s0=await st();
  ok('2 the simulation: the decision is met and the outcome agrees; nothing to say under Sign-off',/v-ok/.test(s0.v)&&s0.chk===''&&!s0.row&&s0.f.people[0].met===true&&s0.f.people[0].signoff===true,s0);
  await setM({situ_pct:'70'});await sleep(150);const s1=await st();
  ok('3 F228 the probe at 70%: the decision reads Not yet competent, the outcome still says Competent, and Sign-off says so and asks for a reason',
    /v-no/.test(s1.v)&&/The outcome chosen says Competent, but the decision above reads Not yet competent\. Give the reason/.test(s1.chk)&&s1.row,s1);
  ok('4 F228 the workstation is told the decision: not at criterion, signed off apart, no date',s1.f.people[0].met===false&&s1.f.people[0].signoff===true&&!('date' in s1.f.people[0])&&s1.f.all===false,s1.f);
  await setM({ov_reason:'The probe was taken on a day with two students absent and a substitute aide (simulated).'});await sleep(150);const s2=await st();
  ok('5 F228 with a reason typed, the notice keeps it and the workstation still counts the trainee as not at criterion',
    /Chosen against the decision for this reason: “The probe was taken on a day/.test(s2.chk)&&s2.f.people[0].met===false&&/two students absent/.test(s2.f.people[0].override||''),s2);
  await setM({situ_pct:'95',ov_reason:''});await p.evaluate(()=>{const d=S.meta.situ_date;S.meta.situ_date='';renderAll();window.__d=d;});await sleep(150);const s3=await st();
  ok('6 F228 with the probe date cleared the decision is open and the trainee is not at criterion (no date from a role-play round)',/v-mid/.test(s3.v)&&s3.f.people[0].met===false&&!('date' in s3.f.people[0]),s3.f);
  await p.evaluate(()=>{S.meta.situ_date=window.__d;renderAll();});
  /* ---- F233 ---- */
  await setM({situ_date:'2024-01-01'});await sleep(150);const s4=await st();
  ok('7 F233 a probe dated before the last scored rehearsal round is not the probe of this training',/v-mid/.test(s4.v)&&/The probe is dated 1\/1\/2024, before the last scored rehearsal round, R\d+ \(/.test(s4.v)&&/it is not a probe of this training/.test(s4.v)&&s4.f.people[0].met===false,s4.v);
  await p.evaluate(()=>{S.meta.situ_date=window.__d;renderAll();});
  /* ---- F234 ---- */
  const s5=await p.evaluate(()=>{const d=stIsoOf(S.meta.situ_date);S.crit=90;S.meta.situ_pct='85';S.ti=Object.assign({},S.ti||{},{probe:{src:'workstation',file:'',kind:'saved',when:d,saved:'',student:'',int:'',col:2,crit:80,date:d,integrity:85,critical:100,c:17,s:20,cc:4,cs:4,errs:[],written:{date:d,pct:'85',crit:'100'}}});
    renderAll();const a=document.querySelector('#verdictBox').textContent,ka=S.ti&&S.ti.probe&&S.ti.probe.crit;
    S.ti.probe.crit=90;renderAll();const b=document.querySelector('#verdictBox').textContent,bc=document.querySelector('#verdictBox .verdict').className;
    S.ti.probe.date='2026-01-02';renderAll();const c=document.querySelector('#verdictBox .verdict').className+' '+document.querySelector('#verdictBox').textContent;
    delete S.ti.probe;if(!Object.keys(S.ti).length)delete S.ti;S.meta.situ_pct='95';renderAll();return {a,ka,b,bc,c};});
  ok('8 F234 an imported probe at 85% is judged against Form TI-1’s 80% criterion, and the record says the two criteria differ',
    /Competent: .* at 85% integrity, at or above Form TI-1’s 80% criterion/.test(s5.a)&&/Form TI-1’s criterion, 80%, differs from this form’s rehearsal criterion, 90%/.test(s5.a),s5.a);
  ok('9 F234 at TI-1’s own 90% the same probe is below it; a probe that is no longer the imported one is judged on this form’s criterion',/v-no/.test(s5.bc)&&/below Form TI-1’s 90% criterion/.test(s5.b)&&/v-no/.test(s5.c)&&/below the 90% criterion/.test(s5.c),s5);
  /* ---- F232 ---- */
  const s6=await p.evaluate(()=>{const el=document.querySelector('[data-m="recheck1"]');S.meta.recheck1='2026-10-23';S.meta.recheck1_note='';renderAll();const due=window.__nbhDue(),gen=window.nbhCase&&nbhCase.due?nbhCase.due():null;
    S.meta.recheck1='10/30/2026 (week 2)';S.meta.recheck1_note='';renderAll();const m1={d:S.meta.recheck1,n:S.meta.recheck1_note};
    S.meta.recheck1='week of the 26th';S.meta.recheck1_note='';renderAll();const m2={d:S.meta.recheck1,n:S.meta.recheck1_note};
    S.meta.recheck1='2026-10-23';S.meta.recheck1_note='';renderAll();return {type:el.type,due,gen,m1,m2,v:document.querySelector('#verdictBox').textContent};});
  ok('10 F232 the first re-check is a date box, on the Due list beside the next review',s6.type==='date'&&s6.due.some(x=>/First unannounced TI-1 re-check/.test(x.what)&&x.date==='2026-10-23')&&s6.due.some(x=>/Next review/.test(x.what))&&
    (!s6.gen||s6.gen.some(x=>/First unannounced TI-1 re-check/.test(x.what))),s6);
  ok('11 F232 an older record: a date typed as text becomes the date and its words the note; words alone go to the note',s6.m1.d==='2026-10-30'&&s6.m1.n==='10/30/2026 (week 2)'&&s6.m2.d===''&&s6.m2.n==='week of the 26th'&&/First unannounced TI-1 re-check due 10\/23\/2026\./.test(s6.v),s6);
  /* ---- F235, F237 ---- */
  const s7=await p.evaluate(()=>{S.cells['6_4']='EC';renderAll();const t=document.getElementById('weakTbl').textContent;return {t,sv4:S.meta.sv4,r3:S.rounds[2].fb};});
  ok('12 F235 Steps to Watch gives the round with its code ("R5: Commission")',/R5: Commission/.test(s7.t),s7.t.slice(0,400));
  ok('13 F237 the trainee’s report is the trainee’s; the trainer’s note is with round 3’s feedback',!/Note on the record/.test(s7.sv4)&&/Note on the record: the criterion was first reached at this round/.test(s7.r3),s7);
  /* ---- F231 ---- */
  const src=await (await ctx.request.get(L.BASE+'/NBH-Workstation/'+ST)).text(),srcT=await (await ctx.request.get(L.BASE+'/NBH-Workstation/'+TI)).text();
  ok('14 F231 ST-1 and TI-1 no longer call commission "the error class most consistently linked" to loss of effect, and cite the studies that compared the two',
    !/most consistently linked/.test(src+srcT)&&/has been linked to loss of treatment effect in several DRA, DRO and discrimination-training studies, though not in all \(St\. Peter Pipkin et al\., 2010; Hronek & Kestner, 2025/.test(src)&&(srcT.match(/though not in all \(St\. Peter Pipkin et al\., 2010; Hronek &amp; Kestner, 2025/g)||[]).length===2);
  /* ---- F229 ---- */
  /* S.tr mirrors the open trainee and is refreshed whenever Save data runs (autosave presses it): compared without it */
  const before=await p.evaluate(()=>{window.__al=[];window.alert=m=>{window.__al.push(String(m));};const o=Object.assign({},S);delete o.tr;return JSON.stringify(o);});
  const feed=o=>p.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(o));
  await feed({form:'TI-1',rev:'2026-09',S:{steps:[{d:'x',crit:true}],nObs:4,cells:{'0_0':'C'},meta:{int:'Simulated RBT'}}});await sleep(300);
  await feed({form:'CT-1',S:{crit:80,meta:{outcome:'Competent — running it independently at home'}}});await sleep(300);
  await feed({v:3,forms:{'ST-1':{}}});await sleep(300);
  const after=await p.evaluate(()=>{const o=Object.assign({},S);delete o.tr;return JSON.stringify(o);});alerts.push(...await p.evaluate(()=>window.__al));
  ok('15 F229 a file Form TI-1 or CT-1 saved, or a case file, is refused by name and nothing changes',before===after&&alerts.some(a=>/saved by Form TI-1, not by Form ST-1\. Nothing was changed\./.test(a))&&
    alerts.some(a=>/saved by Form CT-1, not by Form ST-1/.test(a))&&alerts.some(a=>/workstation case file/.test(a)),alerts);
  await feed(JSON.parse(before.replace(/^/,'{"form":"ST-1","S":').replace(/$/,'}')));await sleep(300);
  ok('16 F229 a file this form saved still opens',await p.evaluate(()=>/Simulated|simulated/.test(JSON.stringify(S.meta))&&S.rounds.length>0));
  /* ---- the shell: signed off is not at criterion ---- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const rs=await sh.evaluate(()=>rsItems({staff:{people:[{name:'Paula Brennan (simulated)',met:false,signoff:true},{name:'Iris Calloway (simulated)',met:true}],all:false}}).map(x=>x.t).join(' | '));
  ok('17 F228 Ready to start: a trainee signed off against the decision is named as not at criterion',/1 of 2 implementers not yet at criterion: Paula Brennan \(simulated\) \(signed off, but the decision is not at criterion\) \(Form ST-1\)/.test(rs),rs);
  ok('18 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
