/* v21.78 helper B: the case flows into Forms TD-1, CR-1 and EB-1 (window.__nbhFactsIn), and CR-1's extended out.
   A simulated case (Mateo Rivera, ID 4471823, Royal Palm School; SIMULATED) is handed to each form opened on its own:
   1  TD-1 fills its empty Starting Information fields (replacement, precursor, preferred stimuli, reinforcer and EO,
      severity and safety, the baseline rate, the function and design from EA-1, the behavior from the shared fill);
      text already typed is kept; a case without EA-1's evidence fills the rest without an error.
   2  CR-1 fills the dangerous behavior, precursor, stages, related plans and health concerns; a DD-1 incident with a
      restraint goes on the log once (a second call adds nothing; an escort is not added; a row deleted by hand is not
      brought back); its out carries the deadlines (the 24-hour report due and not done), the count, dbeh, precursor.
   3  EB-1 places the plan's words, the earliest sign, the lines before it starts and the call for help; typed text kept.
   No page errors.  usage: WS_URL=http://127.0.0.1:8123 node qa/v2178-b-test.js */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const ED='NBH-Workstation';
const TD1='TD-1_Function-Based-Treatment-Developer_v2026-09.html',CR1='CR-1_Crisis-Intervention-Plan_v2026-09.html',EB1='EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html';
let fails=0;const ok=(name,cond,info)=>{console.log((cond?'PASS ':'FAIL ')+name+(cond||info===undefined?'':' :: '+JSON.stringify(info).slice(0,400)));if(!cond)fails++;};
const pad=n=>String(n).padStart(2,'0'),d0=new Date(),TODAY=d0.getFullYear()+'-'+pad(d0.getMonth()+1)+'-'+pad(d0.getDate());
const tm=new Date(d0.getTime()+864e5),TOMORROW=tm.getFullYear()+'-'+pad(tm.getMonth()+1)+'-'+pad(tm.getDate());
const FACTS=evidence=>({
  behaviors:[{label:'Hitting',def:'Strikes another person with an open or closed hand',urg:'4',type:'Target – problem',isRep:false,rep:'',src:'TB-1'},
    {label:'Elopement',def:'Leaves the assigned area without permission',urg:'3',type:'Target – problem',isRep:false,src:'TB-1'},
    {label:'Asks for a break',def:'Hands an adult the break card',urg:'',type:'Target – replacement',isRep:true,src:'TB-1'}],
  fn:{key:'escape',label:'Escape from demands',statements:['When given multi-step math, Mateo hits to get out of the task.']},
  behaviorsFS:[{label:'Hitting',ant:'multi-step math worksheets',cons:'the task is removed for 2 to 5 minutes',alt:'Hand the break card',src:'FS-1'}],
  menu:[{name:'Bubbles',rank:2,tier:'HP'},{name:'Tablet',rank:1,tier:'HP'},{name:'Stickers',rank:3,tier:'LP'}],
  profile:{signals:'nods for yes, pushes the item away for no',avoid:'loud voices; a hand on the shoulder',flags:{safety:['Aggression','Elopement']},
    health:{conditions:'Asthma',allergies:'Peanuts',meds:[{name:'Albuterol',dose:'2 puffs',times:'as needed',reason:'asthma'}],prescriber:'Dr. Simulated'}},
  crisis:{beh:'Hitting',precursor:'Pushes the worksheet away and growls',stages:[{s:'Escalation',do:'Offer the break card',who:'Aide'},{s:'Peak / imminent risk',do:'Clear the room',who:'Teacher and assistant principal'}]},
  plan:{beh:'Hitting: strikes another person',rep:'Hand the break card',prec:'Pushes the worksheet away',ant:['Visual timer on the desk','Seat away from the door'],antCards:['Noncontingent escape'],
    respond:{prec:'Prompt the break card',target:'Keep the demand; block and redirect',after:'Return to the task at the step left',not:'Do not remove the task after hitting',crisis:'Follow Form CR-1'},src:'TD-1'},
  data:{from:'2026-09-01',to:TODAY,days:12,behaviors:[{name:'Hitting',kind:'target',measure:'rate',unit:'per hour',base:{days:5,mean:6,total:30},cur:{days:7,mean:2}}],
    incidentList:[{id:'inc-sim-1',date:TODAY,time:'10:15',beh:'Hitting',what:'Hit the aide three times.',before:'Math worksheet given',hold:'restraint'},
      {id:'inc-sim-2',date:TODAY,time:'11:00',beh:'Elopement',what:'Ran to the hallway',hold:'escort'}]},
  consent:{date:'2026-09-01',parent:'2026-09-02',src:'IC-1'},
  evidence:evidence===false?undefined:{'EA-1':{form:'EA-1',method:'Multielement functional analysis',from:'2026-09-01',to:'2026-09-20',dates:'9/1 to 9/20',n:12,fn:'Escape from demands',fnKey:'escape',strength:'Strong',statement:'Escape maintains hitting.'}}
});
(async()=>{
  const log=[];const br=await chromium.launch();
  const open=async file=>{const ctx=await br.newContext();const p=await ctx.newPage();wire(p,log);await p.goto(BASE+'/'+ED+'/'+file,{waitUntil:'load'});await sleep(700);return p;};
  const type=(p,sel,t)=>p.$eval(sel,(e,t)=>{e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},t);
  const v=(p,n)=>p.$eval('[name="'+n+'"]',e=>e.value).catch(()=>null);
  try{
    /* ---- 1 TD-1 ---- */
    let p=await open(TD1);
    ok('TD-1 has __nbhFactsIn',await p.evaluate(()=>typeof window.__nbhFactsIn==='function'));
    let r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('TD-1 reports what it filled',r&&r.filled>=9,r);
    ok('TD-1 replacement from TB-1',await v(p,'m.repdesc')==='Asks for a break',await v(p,'m.repdesc'));
    ok('TD-1 precursor from CR-1',await v(p,'m.prec')==='Pushes the worksheet away and growls');
    const pref=await v(p,'m.pref');ok('TD-1 preferred stimuli, most preferred first, low tier left out',/^Tablet, Bubbles/.test(pref)&&!/Stickers/.test(pref),pref);
    const reinf=await v(p,'m.reinf');ok('TD-1 reinforcer and EO from FS-1',/EO: multi-step math/.test(reinf)&&/Reinforcer: the task is removed/.test(reinf),reinf);
    const saf=await v(p,'m.safety');ok('TD-1 severity and safety: urgency and DM-1 precautions',/Hitting level 4/.test(saf)&&/Elopement level 3/.test(saf)&&/Aggression, Elopement/.test(saf),saf);
    ok('TD-1 baseline rate per minute from DD-1 (6 per hour)',await v(p,'m.rate')==='0.1',await v(p,'m.rate'));
    ok('TD-1 function from EA-1',await v(p,'m.fn')==='escape');
    ok('TD-1 EA-1 design',/Multielement functional analysis, 12 sessions/.test(await v(p,'m.eadesign')),await v(p,'m.eadesign'));
    ok('TD-1 behavior by the shared fill',/^Hitting: Strikes/.test(await v(p,'m.beh')),await v(p,'m.beh'));
    ok('TD-1 a notice names what was placed',await p.evaluate(()=>/From the case: .*replacement behavior/.test((document.querySelector('#nbhToasts')||{}).textContent||'')));
    const out=await p.evaluate(()=>window.__nbhFactsOut());ok('TD-1 out carries the filled replacement and precursor',out&&out.plan&&out.plan.rep==='Asks for a break'&&out.plan.prec==='Pushes the worksheet away and growls',out&&out.plan);
    await p.context().close();
    p=await open(TD1);
    await type(p,'[name="m.repdesc"]','Says "break" (typed)');await type(p,'[name="m.safety"]','Typed safety note');
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS(false));
    ok('TD-1 keeps typed text',await v(p,'m.repdesc')==='Says "break" (typed)'&&await v(p,'m.safety')==='Typed safety note');
    ok('TD-1 without EA-1 evidence: no design, the function from FS-1',(await v(p,'m.eadesign'))===''&&await v(p,'m.fn')==='escape'&&r.filled>0,r);
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('TD-1 a second call fills only the design (now empty only there)',r.filled===1&&/Multielement/.test(await v(p,'m.eadesign')),r);
    r=await p.evaluate(()=>window.__nbhFactsIn({}));ok('TD-1 an empty case fills nothing',r&&r.filled===0,r);
    await p.context().close();

    /* ---- 2 CR-1 ---- */
    p=await open(CR1);
    ok('CR-1 has __nbhFactsIn',await p.evaluate(()=>typeof window.__nbhFactsIn==='function'));
    ok('CR-1 out of an empty form is null',await p.evaluate(()=>window.__nbhFactsOut())===null);
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('CR-1 reports what it filled',r&&r.filled>=8,r);
    const M=await p.evaluate(()=>JSON.parse(JSON.stringify(S.meta)));
    ok('CR-1 dangerous behavior: the level-4 target only',/^Hitting: Strikes another person/.test(M.dbeh)&&!/Elopement/.test(M.dbeh),M.dbeh);
    ok('CR-1 dangerous behavior shows in its field',await p.$eval('[data-m="dbeh"]',e=>e.value)===M.dbeh);
    ok('CR-1 precursor from the plan',M.precursor==='Pushes the worksheet away');
    ok('CR-1 related plans: TD-1, FS-1, IC-1 consent',/BIP \(Form TD-1\)/.test(M.related)&&/Form FS-1/.test(M.related)&&/consent signed 2026-09-01 \(Form IC-1\)/.test(M.related),M.related);
    ok('CR-1 physical health from DM-1',/Asthma/.test(M.hPhys)&&/Peanuts/.test(M.hPhys)&&/Albuterol 2 puffs \(as needed\), for asthma/.test(M.hPhys)&&/Form DM-1/.test(M.hSource||''),[M.hPhys,M.hSource]);
    ok('CR-1 behavioral health and what to avoid from DM-1',/nods for yes/.test(M.hBeh)&&/loud voices/.test(M.hAvoid),[M.hBeh,M.hAvoid]);
    const pb=await p.evaluate(()=>S.pbis.filter(x=>x.s||x.do).map(x=>[x.s,x.do]));
    ok('CR-1 stages from the plan',pb.length===4&&pb[0][0]==='Prevention (before any sign)'&&pb[2][0]==='Escalation'&&pb[2][1]==='Keep the demand; block and redirect'&&pb[3][0]==='Recovery'&&!pb.some(x=>/CR-1/.test(x[1])),pb);
    const L=await p.evaluate(()=>S.log.filter(x=>x.rd||x.d).map(x=>({d:x.d,rd:x.rd,rt:x.rt,pre:x.pre})));
    ok('CR-1 the DD-1 restraint is on the log (date, time, behavior, what happened)',L.length===1&&L[0].rd===await p.evaluate(()=>crcDateStr(new Date()))&&L[0].rt==='10:15'&&/Hitting: Hit the aide three times/.test(L[0].pre),L);
    ok('CR-1 the escort is not on the log',!L.some(x=>/Elopement/.test(x.pre)));
    ok('CR-1 a notice names the restraint',await p.evaluate(()=>/Form DD-1 recorded a restraint/.test((document.querySelector('#nbhToasts')||{}).textContent||'')));
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('CR-1 a second call adds nothing',r.filled===0&&await p.evaluate(()=>S.log.filter(x=>x.rd||x.d).length)===1,r);
    let o=await p.evaluate(()=>window.__nbhFactsOut());const c=o&&o.crisis;
    ok('CR-1 out keeps the stages and adds dbeh and precursor',c&&c.stages.length===4&&/^Hitting/.test(c.dbeh)&&c.precursor==='Pushes the worksheet away',c);
    const rep=c&&(c.deadlines||[]).find(d=>/24 hours/.test(d.what));
    ok('CR-1 out: the 24-hour report is due tomorrow 10:15 and not done',rep&&rep.done===false&&rep.due===TOMORROW+'T10:15'&&rep.event===TODAY,c&&c.deadlines);
    const wn=c&&(c.deadlines||[]).find(d=>/Written notice/.test(d.what)),ml=c&&(c.deadlines||[]).find(d=>/by mail/.test(d.what));
    ok('CR-1 out: the same-day notice and the 3-school-day report',wn&&wn.due===TODAY&&!wn.done&&ml&&/^\d{4}-\d{2}-\d{2}$/.test(ml.due)&&ml.due>TODAY&&!ml.done,[wn,ml]);
    ok('CR-1 out: no crisis-plan item with one restraint; the count',!(c.deadlines||[]).some(d=>/second restraint/.test(d.what))&&c.restraints&&c.restraints.semester===1&&c.restraints.last===TODAY,c.restraints);
    /* the report done: the out says so */
    await p.evaluate(()=>{const x=S.log.find(y=>y.rd);x.pd=x.rd;x.pt='14:00';});
    o=await p.evaluate(()=>window.__nbhFactsOut());
    ok('CR-1 out: the report completed is done',o.crisis.deadlines.find(d=>/24 hours/.test(d.what)).done===true);
    /* a second restraint (a later incident): the crisis plan item */
    const F2=FACTS();F2.data.incidentList.push({id:'inc-sim-3',date:TODAY,time:'13:40',beh:'Hitting',what:'Hit a peer',hold:'restraint'});
    r=await p.evaluate(f=>window.__nbhFactsIn(f),F2);
    o=await p.evaluate(()=>window.__nbhFactsOut());
    const cp=o.crisis.deadlines.find(d=>/second restraint/.test(d.what));
    ok('CR-1 a new incident is added once; the crisis plan is due at the second restraint',r.filled===1&&o.crisis.restraints.semester===2&&cp&&cp.due===TODAY&&cp.done===false,[r,cp,o.crisis.restraints]);
    /* a row deleted by hand is not brought back */
    await p.evaluate(()=>{S.log=S.log.filter(x=>x.rt!=='13:40');renderAll();});
    r=await p.evaluate(f=>window.__nbhFactsIn(f),F2);
    ok('CR-1 a deleted imported row is not brought back',await p.evaluate(()=>S.log.filter(x=>x.rd).length)===1&&r.filled===0,r);
    ok('CR-1 the imported ids are kept in the record',(await p.evaluate(()=>S.meta.ddInc))==='inc-sim-1,inc-sim-3',await p.evaluate(()=>S.meta.ddInc));
    await p.context().close();
    p=await open(CR1);
    await type(p,'[data-m="dbeh"]','Typed dangerous behavior');await type(p,'[data-m="precursor"]','Typed precursor');
    await p.evaluate(()=>{S.log[0].d='9/30/26';S.log[0].rd=crcDateStr(new Date());S.log[0].rt='10:15';renderAll();});
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS(false));
    const M2=await p.evaluate(()=>S.meta);
    ok('CR-1 keeps typed text',M2.dbeh==='Typed dangerous behavior'&&M2.precursor==='Typed precursor'&&await p.$eval('[data-m="dbeh"]',e=>e.value)==='Typed dangerous behavior',M2);
    ok('CR-1 a restraint typed on the log at the same date and time is not added again',await p.evaluate(()=>S.log.filter(x=>x.rd||x.d).length)===1,await p.evaluate(()=>S.log.map(x=>x.rd+' '+x.rt)));
    const F3=FACTS(false);delete F3.profile.health;delete F3.data;r=await p.evaluate(f=>window.__nbhFactsIn(f),F3);
    ok('CR-1 a case without health or incidents is read without an error',r&&typeof r.filled==='number',r);
    await p.context().close();

    /* ---- 3 EB-1 ---- */
    p=await open(EB1);
    ok('EB-1 has __nbhFactsIn',await p.evaluate(()=>typeof window.__nbhFactsIn==='function'));
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('EB-1 reports what it filled',r&&r.filled>=9,r);
    ok('EB-1 what you will see, how the student asks, after',await v(p,'e.see')==='Hitting: strikes another person'&&await v(p,'e.ask')==='Hand the break card'&&await v(p,'e.after')==='Return to the task at the step left');
    const ln=k=>p.evaluate(k=>Array.from(document.querySelectorAll('#'+k+'Wrap [name]')).map(e=>e.value.trim()).filter(Boolean),k);
    ok('EB-1 if the behavior happens and never do this',JSON.stringify(await ln('resp'))==='["Keep the demand; block and redirect"]'&&JSON.stringify(await ln('never'))==='["Do not remove the task after hitting"]',[await ln('resp'),await ln('never')]);
    ok('EB-1 what helps before it starts: the plan\'s antecedent lines',JSON.stringify(await ln('prev'))==='["Visual timer on the desk","Seat away from the door"]',await ln('prev'));
    ok('EB-1 the earliest sign from the plan',await v(p,'e.early')==='Pushes the worksheet away');
    ok('EB-1 calling for help from the crisis stages',/Hitting, or anyone is at risk of being hurt/.test(await v(p,'e.callwhen'))&&/Peak \/ imminent risk/.test(await v(p,'e.callwhen'))&&await v(p,'e.callwho')==='Teacher and assistant principal',[await v(p,'e.callwhen'),await v(p,'e.callwho')]);
    ok('EB-1 the plan\'s words are marked to rewrite',await p.evaluate(()=>/from the plan/.test(document.querySelector('#p_see').textContent)&&/from the plan/.test(document.querySelector('#p_resp').textContent)));
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());ok('EB-1 a second call fills nothing',r.filled===0&&(await ln('prev')).length===2,r);
    await p.context().close();
    p=await open(EB1);
    await type(p,'[name="e.see"]','Typed: hits');await type(p,'#prevWrap [name]','Typed: a calm greeting');await type(p,'[name="e.callwho"]','Typed: dispatch');
    r=await p.evaluate(f=>window.__nbhFactsIn(f),FACTS());
    ok('EB-1 keeps typed text and typed lines',await v(p,'e.see')==='Typed: hits'&&JSON.stringify(await ln('prev'))==='["Typed: a calm greeting"]'&&await v(p,'e.callwho')==='Typed: dispatch'&&await v(p,'e.ask')==='Hand the break card',await ln('prev'));
    r=await p.evaluate(()=>window.__nbhFactsIn({}));ok('EB-1 an empty case fills nothing',r&&r.filled===0,r);
    await p.context().close();
  }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e));}
  const pe=log.filter(x=>x.type==='pageerror');ok('no page errors',pe.length===0,pe);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
