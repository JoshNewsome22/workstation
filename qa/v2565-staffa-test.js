/* v25.65 the research review, batch 2, parcel STAFFA: Forms CT-1, ST-1, TV-1, QS-1 and EB-1 (simulated data only).
   CT-1  CARE-H1 changes coming up with a booster, the line for the family, an adult not yet probed   CARE-H2 the kind of plan sets the
         criterion, the fixed critical step   CARE-H3 the relapse response in parts, the Extinction tick, no clearance without consent
         CARE-H4 a generalization probe, a second routine, a self-check list, HD-1   CARE-M1 formats   CARE-M2 telehealth   CARE-M3 the
         3-month probe and support   CARE-M4 trained by the primary caregiver   CARE-L2 the fit answers out   CARE-L3 no prediction claim
         FEED-M3 the mealtime routine, escape extinction a marked restrictive step with consent.
   ST-1  SKILL-H1 releases guidance   SKILL-H8 learner responses   SKILL-M8 the stage out   SKILL-M9 why did it drop   SKILL-L6 the
         report again   SKILL-L7 the extinction label, video feedback; STAFF-M10 the QS-1 reading check shown.
   TV-1  SKILL-H7 demonstrations   SKILL-M8 the hand-off to ST-1, an older version, judging a step.
   QS-1  STAFF-H6 the first check   M9 how often, the My day card   M10 teach-back scoring   M11 pictures, worked examples, reading grade
         M12 PD-1.
   EB-1  STAFF-H7 teach-back   M11 pictures, reading grade   M12 PD-1   L1 how it is going   L2 the setting assessed   L3 the references
         L6 PD-1 sends limited-contact staff here.
   Records saved before v25.65 open and decide (or print) as before.
   usage: node qa/v2565-staffa-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/';
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
async function open(ctx,file,errs){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file.slice(0,4)+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(W+file);await sleep(1200);await p.evaluate(()=>{nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};window.alert=()=>{};});return p;}
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  /* =============================== CT-1 =============================== */
  const c=await open(ctx,'CT-1_Caregiver-Training_v2026-09.html',errs);
  await L.loadSim(c);await sleep(1500);
  const vt=()=>c.evaluate(()=>{const v=document.querySelector('#verdictBox .verdict');return {cls:v.className,t:v.textContent,lvl:ctLvl};});
  let v=await vt();
  ok('CT-1 0 the simulation still decides Competent on the in-home probe',/v-ok/.test(v.cls)&&/^Competent on the in-home probe/.test(v.t)&&v.lvl===2,v);
  /* CARE-H1 */
  const h1=await c.evaluate(()=>{const due=window.__nbhDue();const note=document.getElementById('ctChgNote').textContent,house=document.getElementById('cgHouse').textContent+' '+document.getElementById('ctHouseProbe').textContent;
    S.meta.expect='';const el=document.querySelector('[data-m="expect"]');el.value='';document.getElementById('ctExpectBtn').click();
    return {due:due.map(d=>d.what),note,house,expect:S.meta.expect,rows:document.querySelectorAll('#ctChgTbl tbody tr').length};});
  ok('CARE-H1 a change coming up asks for a booster before it, counted on the due list as the thinning step\'s is; an adult with no in-home probe is marked; the line for the family',
    /booster rehearsal of the relapse response is due before the father runs/i.test(h1.note)&&h1.due.some(w=>/^Booster rehearsal before the father/.test(w))&&h1.due.includes('Booster rehearsal before the thinning step')&&
    /Not yet probed at home: Father/.test(h1.house)&&/first time the plan is used in a new place or with a new person/.test(h1.expect)&&h1.rows===1,h1);
  /* CARE-H2 */
  const h2=await c.evaluate(()=>{const before=S.crit;const el=document.querySelector('[data-m="planKind"]');el.value='int';el.dispatchEvent(new Event('change',{bubbles:true}));
    const after=S.crit,note=document.getElementById('ctKindNote').textContent,fix=!document.getElementById('ctFixStep').hidden;
    document.getElementById('ctFixAdd').click();const st=S.steps.find(s=>/reinforcer for the problem behavior is not given/.test(s.d));
    el.value='fr1';el.dispatchEvent(new Event('change',{bubbles:true}));const back=S.crit;
    const g=document.querySelector('section.only-guide').textContent;
    return {before,after,back,note,fix,st,guide:/80% integrity is not a uniformly acceptable minimal level of integrity/.test(g)&&/Jones & St\. Peter, 2022/.test(g)};});
  ok('CARE-H2 an intermittent plan sets the default criterion to 90%, and FR 1 back to 80%; the fixed critical step is offered and added as an extinction step; the Guide says why',
    h2.before===80&&h2.after===90&&h2.back===80&&/Jones & St\. Peter, 2022/.test(h2.note)&&h2.fix&&h2.st&&h2.st.crit&&h2.st.ext&&h2.guide,h2);
  await c.evaluate(()=>{S.steps=S.steps.filter(s=>!/reinforcer for the problem behavior is not given/.test(s.d));renderAll();});
  /* CARE-H3 */
  await c.evaluate(()=>document.querySelector('#viewSeg [data-view="card"]').click());await sleep(200);
  const h3=await c.evaluate(()=>{const card=document.getElementById('ctCard'),t=card.innerText;const ext=card.querySelectorAll('.ct-extw').length;
    const ia=t.indexOf('Keep the card where he can reach it'),ie=t.indexOf('Do not give the tablet while he is screaming');
    const col=document.querySelectorAll('#stepTbl input[data-f="ext"]').length;
    S.meta.extCons='';renderSum();const v1=document.querySelector('#verdictBox .verdict');const r1={cls:v1.className,t:v1.textContent,lvl:ctLvl};
    S.meta.extCons='10/2/2026, Form IC-1';renderSum();const v2=document.querySelector('#verdictBox .verdict');
    return {ext,ia,ie,col,every:card.querySelectorAll('.ct-every').length,r1,r2:{cls:v2.className,lvl:ctLvl},row:!document.getElementById('ctRelExtRow').hidden};});
  ok('CARE-H3 the card marks the extinction step and puts the new behavior first; an Extinction tick a step; no clearance while an extinction step has no consent recorded',
    h3.ext>=2&&h3.ia>0&&h3.ie>h3.ia&&h3.col>=6&&h3.every===3&&h3.row&&/v-mid/.test(h3.r1.cls)&&/^Not cleared yet\. Step 4 is an extinction step/.test(h3.r1.t)&&h3.r1.lvl===0&&/v-ok/.test(h3.r2.cls)&&h3.r2.lvl===2,h3);
  /* CARE-H4 */
  const h4=await c.evaluate(()=>{const opt=[...document.querySelectorAll('#piTbl select[data-f="type"] option')].map(o=>o.textContent);
    const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
    S.fu[0]=Object.assign(S.fu[0],{date:iso(-1),pct:'6/6',crit:'3/3',rel:'Yes',how:'In person',rt:'The trained routine'});renderFu();renderSum();
    const a=document.querySelector('#verdictBox .verdict').textContent+' '+document.getElementById('ctOpenNote').textContent,la=ctLvl;
    S.fu[0].rt='A second routine';renderSum();const b=document.querySelector('#verdictBox .verdict').textContent+' '+(document.getElementById('ctOpenNote').hidden?'':document.getElementById('ctOpenNote').textContent);
    S.fu[0]={date:'',pct:'',crit:'',rel:'',how:'',rt:'',note:''};renderFu();renderSum();
    window.__nbhFactsIn({home:{integrity:[{date:'2026-10-20',pct:80,of:5},{date:'2026-10-21',pct:100,of:5}]}});const hr=document.getElementById('ctHomeRec').textContent;
    renderCard();const self=document.querySelectorAll('#ctCard table.ct-self tr').length;
    return {gen:opt.includes('Generalization probe'),a,la,b,hr,self,hd:!!document.getElementById('ctHdSend')};});
  ok('CARE-H4 a Generalization probe round; holding in the trained routine asks for a second routine, a second routine settles it; the self-check list on the card; the caregiver\'s own HD-1 record shown, not counted',
    h4.gen&&h4.la===3&&/^Competent and holding at home: .*Shown in the trained routine: one follow-up probe in a second routine/.test(h4.a)&&!/second routine the plan applies to is still due/.test(h4.b)&&
    h4.self===7&&/90% of steps ticked Yes over the last 2 days/.test(h4.hr)&&/not a measure/.test(h4.hr)&&h4.hd,h4);
  /* CARE-M1, M2, M3, M4 */
  const m=await c.evaluate(()=>{const fm=document.querySelectorAll('select.ct-fmt').length,lad=document.getElementById('ctLadderNote').textContent;
    S.meta.where='Telehealth';renderAll();const tele=!document.getElementById('ctTele').hidden,tn=document.getElementById('ctTeleNote');const teleNote=!tn.hidden&&tn.textContent;
    S.meta.where='In the home';
    S.meta.supportLvl='Rarely';renderAll();const sup=document.getElementById('ctSupportNote').textContent;S.meta.supportLvl='Sometimes';
    S.fu.forEach(r=>{r.date='';});document.getElementById('ctFuPlan').click();const dates=S.fu.slice(0,4).map(r=>r.date);
    S.meta.fu_summer='2027-06-10';const due=window.__nbhDue().map(d=>d.what);
    S.fu.forEach(r=>{r.date='';});S.meta.fu_summer='';
    S.meta.trainedBy='cg';renderAll();const p1={t:document.querySelector('#verdictBox .verdict').textContent,lvl:ctLvl};
    S.meta.trainerProbe='2026-10-30';renderAll();const p2=ctLvl;S.meta.trainedBy='';S.meta.trainerProbe='';renderAll();
    return {fm,lad,tele,teleNote,sup,dates,due,p1,p2};});
  const dd=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
  ok('CARE-M1 each component has its format, and the formats show beside the rounds to criterion',m.fm===5&&/^Formats: instruction: written steps with pictures and a worked example; modeling: live, in person/.test(m.lad)&&/criterion met after 3 scored rounds/.test(m.lad),m);
  ok('CARE-M2 telehealth shows its block; with a behavior to reduce, the caution to plan an in-person probe (Neely et al., 2021)',m.tele&&/plan at least one in-person probe/.test(m.teleNote||'')&&/Neely et al\., 2021/.test(m.teleNote||''),m);
  ok('CARE-M3 the probes dated at weeks 1, 3 and 6 and 3 months; little support brings them closer and offers a booster; the probe after school contact ends is due',
    m.dates.every(Boolean)&&dd(m.dates[0],m.dates[1])===14&&dd(m.dates[0],m.dates[2])===35&&dd(m.dates[0],m.dates[3])===84&&/closer together/.test(m.sup)&&/booster/.test(m.sup)&&m.due.some(w=>/^Follow-up probe after school contact ends/.test(w)),m);
  ok('CARE-M4 an adult trained by the primary caregiver waits for the trainer\'s own probe; with it recorded the decision is as before',/^The trainer’s own probe is still due/.test(m.p1.t)&&m.p1.lvl===1&&m.p2===2,m);
  /* CARE-L2, L3 */
  const l=await c.evaluate(()=>{const f=window.__nbhCaregiverFacts();const st=document.querySelector('[data-m="stop"]'),ph=st.getAttribute('placeholder')||st.getAttribute('data-fx2-ph')||''/* v25.68 fx2: on screen the layout keeps the box's words in data-fx2-ph */,g=document.querySelector('section.only-guide').textContent;
    return {fit:f&&f.fit&&f.fit.length,q:f&&f.fit&&f.fit[0].q,ext:f&&f.steps&&f.steps.filter(s=>s.ext).length,ph,g:/it does not predict the integrity data/.test(g)};});
  ok('CARE-L2 the six home-fit answers go to the case for Form CF-1',l.fit===6&&/^I have time to do this/.test(l.q)&&l.ext===1,l);
  ok('CARE-L3 no claim that the answer predicts the integrity data; ratings and integrity are checked one against the other',!/predicts the integrity data/.test(l.ph)&&/check one against the other/.test(l.ph)&&l.g,l);
  /* FEED-M3 */
  const fd=await c.evaluate(()=>{const n0=S.steps.length;const el=document.querySelector('[data-m="meal"]');el.value='yes';el.dispatchEvent(new Event('change',{bubbles:true}));
    const box=!document.getElementById('ctMealBox').hidden,txt=document.getElementById('ctMealBox').textContent;
    document.getElementById('ctMealSteps').click();const n1=S.steps.length;document.getElementById('ctMealEE').click();const r=S.steps.find(s=>s.restr),ri=S.steps.indexOf(r);
    S.cells[ri+'_2']='C';S.cells[ri+'_3']='C';   /* rehearsed in the decision rounds, so the consent is what remains */
    renderSum();const v1=document.querySelector('#verdictBox .verdict').textContent,l1=ctLvl;
    S.meta.meal_eeCons='10/2/2026, Form IC-1, planned with the family, the doctor and the feeding specialist';renderSum();const l2=ctLvl;
    S.steps=S.steps.slice(0,n0);Object.keys(S.cells).forEach(k=>{if(+k.split('_')[0]>=n0)delete S.cells[k];});S.meta.meal='';S.meta.meal_eeCons='';renderAll();
    return {box,n0,n1,r:r&&{crit:r.crit,ext:r.ext,d:r.d},v1,l1,l2,force:/never forced open/i.test(txt)&&/RESTRICTIVE/.test(txt),warn:/Refusal often comes back for a while when a new person feeds/.test(txt),lips:/A bite only offered at the lips is an ordinary step/.test(txt)};});
  ok('FEED-M3 the mealtime routine: the structure steps, the change of feeder warning; escape extinction a marked RESTRICTIVE step that blocks clearance until written consent; the mouth never forced open',
    fd.box&&fd.n1===fd.n0+6&&fd.r&&fd.r.crit&&fd.r.ext&&/^RESTRICTIVE, with written consent/.test(fd.r.d)&&/restrictive step \(escape extinction at meals\)/.test(fd.v1)&&fd.l1===0&&fd.l2===2&&fd.force&&fd.warn&&fd.lips,fd);
  /* a record saved before v25.65 */
  const old=await c.evaluate(()=>{const keep=JSON.parse(JSON.stringify(S));['relapseAlt','relapseExt','extCons','relapseReh2','relapseReh2_how','planKind','cardSelf','support','supportLvl','c_inst_fmt','c_mod_fmt','c_reh_fmt','c_fb_fmt','c_situ_fmt'].forEach(k=>delete keep.meta[k]);
    delete keep.chg;keep.steps.forEach(s=>{delete s.ext;});(keep.house.list||[]).forEach(r=>{['relapseReh2','relapseReh2_how','support','supportLvl','c_inst_fmt','c_mod_fmt','c_reh_fmt','c_fb_fmt','c_situ_fmt'].forEach(k=>delete r.own.meta[k]);});
    keep.meta.relapseDo='Keep the card where he can reach it. Do not give the tablet while he is screaming.';
    S=Object.assign(blank(),keep);renderAll();renderCard();const v=document.querySelector('#verdictBox .verdict');
    return {cls:v.className,t:v.textContent,lvl:ctLvl,self:!!document.querySelector('#ctCard table.ct-self'),ext:document.querySelectorAll('#ctCard .ct-extw').length,row:document.getElementById('ctRelExtRow').hidden};});
  ok('CT-1 a record saved before v25.65 opens and decides as before, its card as it was',/v-ok/.test(old.cls)&&/^Competent on the in-home probe/.test(old.t)&&old.lvl===2&&!old.self&&old.ext===0&&old.row,old);
  await c.close();

  /* =============================== ST-1 =============================== */
  const s=await open(ctx,'ST-1_Behavior-Skills-Training_v2026-09.html',errs);
  await L.loadSim(s);await sleep(1500);
  const s0=await s.evaluate(()=>{const v=document.querySelector('#verdictBox .verdict');const card=[...document.querySelectorAll('#metricWrap .metric')].map(m=>m.textContent).find(t=>/^Learner responses rehearsed/.test(t));
    return {cls:v.className,t:v.textContent,card,stage:(window.__nbhStaffFacts().people[0]||{}).stage,rows:document.querySelectorAll('#stLrTbl tbody tr').length};});
  ok('ST-1 0 the simulation still decides Competent, with 5 of 5 learner responses in the decision rounds',/v-ok/.test(s0.cls)&&/^Competent: criterion met at R3 and holding in R4–R5/.test(s0.t)&&/5 of 5/.test(s0.card)&&s0.rows===5,s0);
  const h8=await s.evaluate(()=>{S.rounds[3].lr=['c','pb','ask','two'];S.rounds[4].lr=['c','pb','ask','two'];renderAll();const v=document.querySelector('#verdictBox .verdict');const a={cls:v.className,t:v.textContent,w:document.getElementById('stLrWatch').textContent,met:window.__nbhStaffFacts().people[0].met};
    S.rounds.forEach(r=>{delete r.lr;});renderAll();const v2=document.querySelector('#verdictBox .verdict');const b={cls:v2.className,t:v2.textContent};
    S.rounds[3].lr=['c','pb','ask','two'];S.rounds[4].lr=['c','nr','pb','ask','two'];renderAll();return {a,b};});
  ok('SKILL-H8 a learner response not met in the decision rounds keeps the trainee from Competent and is named under the steps to watch; a record with none recorded decides as before',
    /v-mid/.test(h8.a.cls)&&/has not yet met this learner response: no response/.test(h8.a.t)&&/^Learner responses not yet met in the decision rounds: No response/.test(h8.a.w)&&h8.a.met===false&&
    /v-ok/.test(h8.b.cls)&&/The learner responses the trainer acted out are not recorded/.test(h8.b.t),h8);
  ok('SKILL-M8 the trainee\'s stage goes to the case with the person (for Form TV-1)',s0.stage==='probe',s0);
  const sh1=await s.evaluate(()=>{const n=S.steps.length,c9=S.cells['9_0'];S.steps[2].d='Guides the student hand-over-hand to the card.';renderAll();const on=!document.getElementById('stH1').hidden,t=document.getElementById('stH1').textContent;
    document.getElementById('stH1Add').click();const st=S.steps[3];return {on,t,n1:S.steps.length-n,st:st&&{d:st.d,crit:st.crit},moved:S.cells['10_0']===c9,off:document.getElementById('stH1').hidden};});
  ok('SKILL-H1 a step with physical guidance is offered the critical step "Releases guidance when the student pulls away", inserted after it with the codes after it moved down; the stop rule beside it',
    sh1.on&&/is restraint and is not a prompt/.test(sh1.t)&&sh1.n1===1&&/^Releases guidance when the student pulls away/.test(sh1.st.d)&&sh1.st.crit&&sh1.moved&&sh1.off,sh1);
  await L.loadSim(s);await sleep(1200);
  const m9=await s.evaluate(()=>{S.ti={retrain:{src:'file',file:'TI-1_sim.json',kind:'retrain',when:'2026-11-01',saved:'',student:'',int:'',crit:90,critN:2,obs:[{col:3,date:'2026-10-30',integrity:76.9,critical:60}],
      steps:[{n:8,text:S.steps[7].d,critical:true,codes:['EC','EC'],commission:2,omission:0,pct:0,priority:1,component:'con'}],targeted:''}};renderAll();
    const on=!document.getElementById('stWhy').hidden,t0=window.stTiTargets().length;
    const k=n=>{const el=document.querySelector('[data-m="wd_k'+n+'"]');el.checked=!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));};
    k(2);return new Promise(r=>setTimeout(()=>{const t2=window.stTiTargets().length,out=document.getElementById('stWhyOut').textContent,chg=!document.getElementById('stWhyChg').hidden;k(1);
      setTimeout(()=>r({on,t0,t2,out,chg,t1:window.stTiTargets().length}),50);},50));});
  ok('SKILL-M9 a trainee signed off as competent, with steps to retrain from TI-1: Why did it drop? first; only knowing the steps lets the runner offer the retraining round',
    m9.on&&m9.t0===0&&m9.t2===0&&/Change the setting or the feedback, not the training/.test(m9.out)&&m9.chg&&m9.t1===1,m9);
  const sl=await s.evaluate(()=>{const ph=document.querySelector('[data-m="hc_after_how"]').placeholder,fo=[...document.querySelectorAll('[data-m="fu_mode"] option')].map(o=>o.textContent);
    const svp=!!document.querySelector('[data-m="svp1"]')&&!!document.querySelector('[data-m="svp_date"]'),h=document.getElementById('stHomeNote').textContent;
    window.__nbhFactsIn({quick:{readCheck:[{who:'Simulated RBT',done:true,date:'Nov 2, 2026'}]}});const qs=document.getElementById('stQsRead');
    return {ph,fo,svp,h,qs:!qs.hidden&&qs.textContent,refs:document.getElementById('stRefs').textContent};});
  ok('SKILL-L6 the Trainee Report asked again after the in-situ probe; caregivers\' preference for least-to-most noted for Form SA-1 (Halbur et al., 2020)',sl.svp&&/least-to-most/.test(sl.h)&&/Halbur et al\., 2020/.test(sl.h)&&/Halbur, M\. E\./.test(sl.refs),sl);
  ok('SKILL-L7 the hard case labelled as an extinction step; follow-up by video call or video self-monitoring',/\(extinction step, from the plan on Form TD-1\)$/.test(sl.ph)&&sl.fo.includes('Feedback by video call')&&sl.fo.some(o=>/^Video self-monitoring/.test(o)),sl);
  ok('STAFF-M10 (ST-1) Form QS-1\'s reading check, complete, beside the trainee\'s training record',/^Reading check on Form QS-1: complete \(Nov 2, 2026\)/.test(sl.qs||''),sl);
  await s.close();

  /* =============================== TV-1 =============================== */
  const t=await open(ctx,'TV-1_Training-Video_v2026-10.html',errs);
  await L.loadSim(t);await sleep(2000);
  const tv=await t.evaluate(()=>{document.getElementById('tvDemoAfter').value='response';document.getElementById('tvDemoAdd').click();
    const i=S.rows.findIndex(r=>r.demo),r=S.rows[i],prev=S.rows[i-1];const warn0=/show at least three/.test(document.getElementById('tvDemoOut').textContent);
    r.demo.sit={ok:true,none:true,pb:true};r.demo.secs='90';r.demo.ok={0:'error'};renderAll();const warn1=/show at least three/.test(document.getElementById('tvDemoOut').textContent);
    paceShow(false);const pace=(document.querySelector('.tv-demopace')||{}).textContent;tvQuizRender();const j=QUIZ.filter(q=>q.judge);
    const back=fromFile({form:'TV-1',S:JSON.parse(JSON.stringify(S))});const kept=back.rows.find(x=>x.demo);
    return {seg:r.seg,lay:r.lay,prevSeg:prev&&prev.seg,say:r.say,body:r.body,warn0,warn1,pace,j:j.map(q=>q.q+' | '+q.a),n:QUIZ.length,kept:kept&&kept.demo};});
  ok('SKILL-H7 a Show it segment after the response plan: the voiceover names each step, the steps on screen, a checklist of situations (warning under three); pacing gives the demonstration against the talk; a saved file keeps it',
    tv.seg==='Show It: Response Plan'&&tv.lay==='lower'&&tv.prevSeg==='Response Plan'&&/^Watch it done\.\s+First: /.test(tv.say)&&/^1\. /.test(tv.body)&&/\n3\. Leaves or hits: keep everyone safe; the task stays/.test(tv.body)&&tv.warn0&&!tv.warn1&&/^Demonstration and talk: 1:30 of the video shows the procedure being done/.test(tv.pace||'')&&
    tv.kept&&tv.kept.secs==='90'&&tv.kept.sit.pb===true&&tv.kept.ok['0']==='error',tv);
  ok('SKILL-M8 the check quiz includes "Is this step done right?" for a step the demonstration marks',tv.j.length===1&&/^Is this step done right\? Watch the demonstration after Response Plan, at the step: /.test(tv.j[0])&&/\| Done with an error$/.test(tv.j[0])&&tv.n<=8,tv);
  const vw=await t.evaluate(()=>{window.__nbhFactsIn({staff:{people:[{name:'Ms. Lee (simulated)',met:false,stage:'rehearsal-met'}]},plan:{adoption:{date:'2026-10-15',version:2}}});
    S.viewers=[{name:'Ms. Lee (simulated)',role:'teacher',date:'2026-10-20',ver:'10/20/2026',score:'7 of 8',missed:'3'},{name:'Mr. Ortiz (simulated)',role:'para',date:'2026-09-01',ver:'9/1/2026',score:'',missed:''}];tvViewersRender();
    return [...document.querySelectorAll('#viewOut td.tv-vst')].map(td=>td.textContent);});
  ok('SKILL-M8 Who Watched shows each viewer\'s Form ST-1 status, flags no ST-1 record 2 weeks after watching, and an older version',
    vw.length===2&&/^Form ST-1: competent in rehearsal, in-situ probe still due$/.test(vw[0])&&/No Form ST-1 record/.test(vw[1])&&/No Form ST-1 record 2 weeks after watching/.test(vw[1])&&/Watched an older version/.test(vw[1]),vw);
  await t.close();

  /* =============================== QS-1 =============================== */
  const q=await open(ctx,'QS-1_Staff-Quick-Start_v2026-10.html',errs);
  await L.loadSim(q);await sleep(1500);
  const q0=await q.evaluate(()=>({pages:document.querySelectorAll('#out .qs-page').length,p4:[...document.querySelectorAll('#out .qs-page')][3].innerText}));
  const qa=await q.evaluate(PNG=>{S.parts[0].first='2026-11-05';S.parts[0].then='Form TI-1 every 2 weeks';S.five[0].often='every time he asks';S.dayCard='yes';S.tiers[1].ex='When he says “no” and pushes the paper, you say: “Half the page or the computer?”';
    S.pics=[{img:PNG,cap:'This is the break card'}];renderEditor();build();const P=[...document.querySelectorAll('#out .qs-page')];
    return {pages:P.length,p1:P[0].innerText,p2:P[1].innerHTML,p3:P[2].innerText,p4:P[3].innerText,day:(document.querySelector('#out .qs-day')||{}).innerText||'',due:window.__nbhDue().map(d=>d.what+' '+d.date),review:document.getElementById('review').innerText,
      g:document.querySelector('section[data-pane="guide"]').textContent,pd:!!document.getElementById('qsPd1')};},PNG);
  ok('STAFF-H6 a first check for each adult: on the due line, on page four with the first-week line once booked; Setup names who has none',
    !/In your first week/.test(q0.p4)&&/In your first week, the BCBA \(Jordan Ellis, BCBA \(simulated\)\) or the person named will watch once and talk with you the same day/.test(qa.p4)&&/Nov 5, 2026; then Form TI-1 every 2 weeks/.test(qa.p4)&&
    qa.due.some(d=>/^First check of Ms\. Lee, teacher \(simulated\) running the plan.* 2026-11-05$/.test(d))&&/No check booked for: Mr\. Ortiz, para \(simulated\); Specials teachers/.test(qa.review),qa);
  ok('STAFF-M9 each of the five things says how often; the My day card with a tick for the morning and the afternoon; the Guide on checking the card against an observation',
    /The break card is the plan\..*every time he asks/.test(qa.p1)&&/^MY DAY/i.test(qa.day)&&/AM\s+PM/.test(qa.day)&&qa.pages===q0.pages+1&&/Compare the card with an observation now and then/.test(qa.g)&&/Cohrs et al\., 2016/.test(qa.g),qa);
  ok('STAFF-M11 a picture with its caption on page two, a worked example under its tier, an estimated reading grade a page on Setup',
    /<figure><img src="data:image\/png;base64,/.test(qa.p2)&&/This is the break card/.test(qa.p2)&&/For example: When he says “no” and pushes the paper/.test(qa.p3)&&/Reading grade, estimated \(Flesch–Kincaid\): page 1: [\d.]+/.test(qa.review)&&/a low score does not make a page right/.test(qa.review),qa.review);
  ok('STAFF-M12 the Guide says a quick start clarifies and prompts, and the button opens Form PD-1',/A quick start clarifies and prompts\./.test(qa.g)&&/Run Form PD-1 for that step instead of reissuing/.test(qa.g)&&qa.pd,qa.g.slice(0,300));
  const rc=await q.evaluate(()=>{setView('flow');renderEditor();const sel=[...document.querySelectorAll('#qsRc select[data-rcw="Ms. Lee, teacher (simulated)"]')];
    sel.forEach((e,i)=>{e.value=i===1?'c':'r';e.dispatchEvent(new Event('change',{bubbles:true}));});
    const d=document.querySelector('#qsRc input[data-rcw="Ms. Lee, teacher (simulated)"]');d.value='2026-11-02';d.dispatchEvent(new Event('change',{bubbles:true}));
    const st=[...document.querySelectorAll('#qsRc tbody tr')].map(tr=>tr.lastElementChild.textContent);const o=window.__nbhFactsOut();
    const back=fromFile({form:'QS-1',S:JSON.parse(JSON.stringify(S))});
    return {n:sel.length,st,rcOut:o&&o.quick&&o.quick.readCheck,kept:back&&back.rc&&back.rc['Ms. Lee, teacher (simulated)'],pics:back&&back.pics.length,g:document.querySelector('section[data-pane="guide"]').textContent};});
  ok('STAFF-M10 the reading check scored as teach-back for each adult and question; complete, with its date, goes to the case for Form ST-1; a saved file keeps it',
    rc.n>=4&&/^Complete \(Nov 2, 2026\)$/.test(rc.st[0])&&/^Not scored yet$/.test(rc.st[1])&&rc.rcOut&&rc.rcOut.some(x=>x.who==='Ms. Lee, teacher (simulated)'&&x.done===true&&x.date==='Nov 2, 2026')&&rc.kept&&rc.kept.a['1']==='c'&&rc.pics===1&&/Sleiman et al\., 2023/.test(rc.g),rc);
  const qo=await q.evaluate(()=>{const d=JSON.parse(JSON.stringify(S));['five','tiers','parts'].forEach(k=>d[k].forEach(r=>{delete r.often;delete r.ex;delete r.first;delete r.then;}));delete d.dayCard;delete d.pics;delete d.rc;
    const n=fromFile({form:'QS-1',S:d});S=n;ensure();renderEditor();build();const P=[...document.querySelectorAll('#out .qs-page')];return {pages:P.length,p4:P[3].innerText,day:!!document.querySelector('#out .qs-day')};});
  ok('QS-1 a file saved before v25.65 opens and prints as before',qo.pages===q0.pages&&!/In your first week/.test(qo.p4)&&!qo.day,qo);
  await q.close();

  /* =============================== EB-1 =============================== */
  const e=await open(ctx,'EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html',errs);
  await L.loadSim(e);await sleep(1500);
  const eb=await e.evaluate(PNG=>{const out=()=>document.getElementById('out').innerText;const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
    build(true);const a=out(),ack=a.slice(a.indexOf('Acknowledgment'));
    set('e.assessed','No');set('e.pic1',PNG);set('e.pcap1','This is the blue card');set('e.hig_since','2026-10-06');set('e.hig_n','4');document.getElementById('ebHigBtn').click();build(true);const b=out(),bh=document.getElementById('out').innerHTML;
    const hig=document.querySelector('[name="e.hig"]').value;set('e.date','2026-12-01');review();const note=document.getElementById('ebHigNote').textContent;
    const file=collect();delete file.f['e.acktb'];ebRecord(file);build(true);const c=out(),ackOld=c.slice(c.indexOf('Acknowledgment'));
    return {qs:(ack.match(/☐ Answered correctly/g)||[]).length,third:/prompted the request at the earliest sign/.test(ack),again:/Checked again on/.test(ack),rev:/For the reviewer: ask each question/.test(ack),q1:/When you see the earliest sign \(goes quiet/.test(ack),
      diff:/IF IT LOOKS DIFFERENT HERE/i.test(b)&&/tell Jordan Ellis, M\.A\., BCBA \(simulated\)\./.test(b),pic:/<figure><img src="data:image\/png/.test(bh)&&/This is the blue card/.test(b),hig,higOut:/HOW IT IS GOING/i.test(b),note,
      oldQs:(ackOld.match(/Answered correctly/g)||[]).length,oldTry:/tried once: ☐ honoring the request\s+☐ making the call/.test(ackOld)&&!/prompted the request at the earliest sign|For the reviewer|Checked again on/.test(ackOld),
      grade:document.getElementById('ebGrade').textContent,pd:!!document.getElementById('ebPd1'),g:document.querySelector('section[data-pane="guide"]').textContent,refs:document.getElementById('ebRefs').textContent};},PNG);
  ok('STAFF-H7 each signature block: three teach-back questions, the reviewer\'s instruction, a third try and a date to check again; a brief saved before prints as it did',
    eb.qs===6&&eb.third&&eb.again&&eb.rev&&eb.q1&&eb.oldQs===0&&eb.oldTry&&/Signing shows the brief was received\. The questions and the tries show it was understood\./.test(eb.g),eb);
  ok('STAFF-M11 (EB-1) a picture with its caption on the brief, and its estimated reading grade on Setup',eb.pic&&/^Reading grade, estimated \(Flesch–Kincaid\): [\d.]+\./.test(eb.grade),eb);
  ok('STAFF-M12 (EB-1) the Guide says a brief clarifies and prompts, and the button opens Form PD-1',/A brief clarifies and prompts\./.test(eb.g)&&/Run Form PD-1 for that step instead of reissuing the brief/.test(eb.g)&&eb.pd,eb.g.slice(0,200));
  ok('STAFF-L1 the How it is going line, written from the date and the count, and a note when the brief is reissued',/^Since October 6, 2026, the request has been used about 4 times a day; thank you for honoring it on the bus\.$/.test(eb.hig)&&eb.higOut&&/write this line again/.test(eb.note),eb);
  ok('STAFF-L2 not assessed in this setting: the brief says to tell the contact when it looks different here (Lang et al., 2009)',eb.diff&&/Lang et al\., 2009/.test(eb.g),eb);
  ok('STAFF-L3 the reference list holds every source the Guide cites, Fritz et al. (2013) and Athens and Vollmer (2010) among them',/Fritz, J\. N\., Iwata, B\. A\., Hammond, J\. L\., & Bloom, S\. E\. \(2013\)/.test(eb.refs)&&/Athens, E\. S\., & Vollmer, T\. R\. \(2010\)/.test(eb.refs)&&
    ['Sleiman','Graff','Alavosius','Quilitch','Bowe','Ditzian','Merritt','Shapiro','Andrasik','Putnam','Lang','Volkert'].every(a=>eb.refs.includes(a+', ')),eb.refs.slice(0,300));
  ok('STAFF-L6 (EB-1) the Guide says Form PD-1 sends limited-contact staff to this brief',/when Form PD-1 finds that a substitute, a bus driver, a specials teacher or lunchroom staff needs clarification or a prompt, this brief is the one written for them/.test(eb.g),eb.g.slice(0,200));
  await e.close();
  ok('no page errors',errs.length===0,errs);
 }catch(x){ok('crashed',false,String(x&&x.stack||x));}
 await br.close();
 console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
