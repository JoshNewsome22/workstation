/* Form PR-1, review Wave 3 majors: the period's restraints, removals and a manifestation determination reach the review (F320);
   a change to the plan records the parent's part, the notice and consent (F321); DD-1's maintenance probes show, and Exit
   Readiness is one readiness (F324); the actions go to the case and the due list, and the log keeps who took part (F325).
   Simulated data only. usage: node qa/pr1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const PR='PR-1_Periodic-Plan-Review_v2026-09.html';
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const setM=(p,o)=>p.evaluate(o=>{for(const k in o){const e=document.querySelector('[data-m="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}},o);
  const CASE={data:{from:iso(-40),to:iso(-1),days:28,src:'DD-1',conds:[{name:'Baseline',from:iso(-40),to:iso(-30)},{name:'FCT',from:iso(-29),to:iso(-1)}],
      behaviors:[{name:'Physical aggression',kind:'target',unit:'per day',base:{days:6,mean:4},cur:{days:20,mean:2}}],
      incidentList:[{date:iso(-8),beh:'Physical aggression',tier:'2',parent:'no',hold:'restraint'},{date:iso(-5),beh:'Physical aggression',tier:'1',parent:'yes',hold:''}],
      probes:[{date:iso(-3),kind:'maint',setting:'Room 14'}]},
    crisis:{restraints:{semester:2,last:iso(-8)},deadlines:[{what:'Written notice to the parent before the end of the school day',due:iso(-8),done:false,event:iso(-8)},
      {what:'Crisis intervention plan upon the second restraint this semester',due:iso(-8),done:false,event:iso(-8)},{what:'Incident report within 24 hours of the release',due:iso(-7),done:true,event:iso(-8)}]},
    records:{removals:{days:9,list:[],at10:false,year:'2026-27'},mdr:iso(-6),mdrResult:'manifestation'}};
  const p=await open(PR);
  const a=await p.evaluate(c=>{const r=window.__nbhFactsIn(c);return {r,why:S.meta.why,safe:document.getElementById('prSafety').textContent,hidden:document.getElementById('prSafety').hidden,also:S.meta.alsoCase||''};},CASE);
  ok('1 F320 Safety in the Period: the restraint marked on DD-1, CR-1’s count and the crisis-plan rule, the notices still open, the removals and the manifestation determination',
    !a.hidden&&/Restraints in this period .*: 1 \(/.test(a.safe)&&/Form CR-1: 2 restraints this semester/.test(a.safe)&&/requires a crisis intervention plan \(s\. 1003\.573\(6\)\(a\), F\.S\./.test(a.safe)&&
    /Still open on Form CR-1: Written notice to the parent .*Crisis intervention plan upon the second restraint/.test(a.safe)&&!/Incident report within 24 hours/.test(a.safe)&&/Removals \(Form RR-1\): 9 school days in 2026-27, approaching 10/.test(a.safe)&&/Manifestation determination: .*\(manifestation\).*34 CFR 300\.530\(f\)/.test(a.safe),a.safe);
  ok('2 F320 "Why this review now" is filled with the restraint while empty, and Also in the Review Period counts the restraint',a.why==='Restraint occurred (Form CR-1)'&&/1 marked as a restraint/.test(a.also),{why:a.why,also:a.also});
  await setM(p,{dec:'Continue unchanged',decWhy:'The data are coming down.'});
  const c1=await p.evaluate(()=>document.getElementById('decCheck').textContent);
  ok('3 F320 the decision check: a restraint the reasoning does not mention, the second restraint’s plan still open, the manifestation finding',
    /A restraint is on record in this period .* the Reasoning does not mention it/.test(c1)&&/second restraint this semester, and Form CR-1’s crisis intervention plan is still open/.test(c1)&&/manifestation determination was held in this period/.test(c1),c1);
  /* ---- F321 ---- */
  await setM(p,{dec:'Modify the plan',decWhy:'The restraint on the 8th and the manifestation finding: the team modifies the plan.'});
  const c2=await p.evaluate(()=>({tbl:!document.getElementById('prChangeTbl').hidden,chk:document.getElementById('decCheck').textContent,sign:[...document.querySelectorAll('th')].map(t=>t.textContent).find(t=>/^Parent/.test(t)),ready8:READY[8],
    opts:[...document.querySelectorAll('#actTbl select[data-f="f"]')][0].innerHTML}));
  ok('4 F321 a change to the plan shows Who decided and the check asks for the parent’s part, the notice and whether consent is needed again',
    c2.tbl&&/The plan changes \(Modify the plan\), but Who decided does not record that the parent took part in the decision, the prior written notice date, whether consent is needed again/.test(c2.chk),c2.chk);
  ok('5 F321 the sign-off is the parent who took part; the exit condition is the parent in the decision and the notice; an action can go to IC-1',
    c2.sign==='Parent (took part in the decision)'&&c2.ready8==='The parent took part in the decision to end the plan, and prior written notice was given'&&/IC-1 \(consent\)/.test(c2.opts),c2);
  await setM(p,{chWhere:'IEP team meeting',chDate:iso(-2),chParent:'Yes, at the meeting',chPwn:iso(-1),chConsent:'Not needed: no substantial change',chAssent:'Told about the new break card; said he likes the timer'});
  const c3=await p.evaluate(()=>({chk:document.getElementById('decCheck').textContent,out:window.__nbhFactsOut().review.change}));
  ok('6 F321 with the decision recorded, the check is quiet about it, and the case gets where, when, the parent, the notice and consent',
    !/Who decided does not record/.test(c3.chk)&&c3.out&&c3.out.where==='IEP team meeting'&&c3.out.parent==='Yes, at the meeting'&&/^\d{4}-\d\d-\d\d$/.test(c3.out.pwn)&&c3.out.consent==='Not needed: no substantial change',c3);
  await setM(p,{dec:'Return to assessment',chConsent:'Not yet'});
  const c4=await p.evaluate(()=>document.getElementById('decCheck').textContent);
  ok('7 F321 a return to assessment asks for consent on IC-1 for the new assessment',/consent on Form IC-1 for the new assessment/.test(c4),c4);
  /* ---- F324 ---- */
  const pr=await p.evaluate(()=>({h:document.getElementById('prProbes').hidden,t:document.getElementById('prProbes').textContent}));
  ok('8 F324 DD-1’s maintenance probes, sent inside its data part, show on the Fading and exit sheet',!pr.h&&/1 maintenance/.test(pr.t),pr);
  const ex=await p.evaluate(()=>{READY.forEach((_,i)=>{S.ready[i]=true;});READY_FIELD.forEach(k=>{if(k)S.meta[k]='Recorded (simulated)';});S.meta.post='Monthly probes for a semester (simulated)';S.meta.dec='Exit the plan';renderAll();
    return {v:document.getElementById('exitVerdict').textContent,ready:prExitReady(),E:exitState().ready,chk:document.getElementById('decCheck').textContent};});
  ok('9 F324 Exit Readiness is one readiness: all nine ticked but no social validity or contextual fit, the verdict says the plan cannot stop yet, as the case and the check do',
    !/The plan can stop/.test(ex.v)&&/cannot stop yet: social validity/.test(ex.v)&&ex.ready.ok===false&&ex.E===false&&/Exit is recorded, but Exit Readiness .*social validity/.test(ex.chk),ex);
  /* ---- F325 ---- */
  const q=await open(PR);
  await L.loadSim(q);await sleep(900);
  const s=await q.evaluate(()=>({types:[...document.querySelectorAll('#actTbl input[data-f="b"]')].map(i=>i.type+':'+i.value),acts:(window.__nbhFactsOut().review||{}).actions,due:window.__nbhDue()}));
  ok('10 F325 "By when" is a date; the open actions go to the case with their dates and onto the due list with the next review',
    s.types.length>=3&&s.types.every(x=>/^date:\d{4}-\d\d-\d\d$/.test(x))&&Array.isArray(s.acts)&&s.acts.length===3&&s.acts.every(a=>/^\d{4}-\d\d-\d\d$/.test(a.by)&&a.what&&a.form)&&s.acts.some(a=>a.form==='TI-1')&&
    s.due.some(d=>d.what==='Next review')&&s.due.filter(d=>/^PR-1 action: /.test(d.what)).length===3,s);
  await q.evaluate(()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set('team','Teacher, aide, parent (simulated)');set('why','Scheduled review');set('dec','Exit the plan');set('decWhy','');});
  const cl=await q.evaluate(async()=>{const asked=[];nbhUI.confirm=async m=>{asked.push(m);return false;};const r1=await prCloseReview();const n1=(S.log||[]).length;
    nbhUI.confirm=async m=>{asked.push(m);return true;};const r2=await prCloseReview();const e=S.log[S.log.length-1];return {r1,n1,r2,asked:asked.map(x=>x.slice(0,80)),e};});
  ok('11 F325 closing with the decision check open asks first; No leaves the review open',cl.r1===false&&/^The decision check is not clear:/.test(cl.asked[0]),cl.asked);
  ok('12 F325 the log keeps who took part, the period, why it was held and the check left open',cl.r2===true&&cl.e.team==='Teacher, aide, parent (simulated)'&&cl.e.reason==='Scheduled review'&&!!cl.e.period&&/Exit is recorded/.test(cl.e.checks||''),cl.e);
  const lg=await q.evaluate(()=>document.getElementById('prLogTbl').textContent);
  ok('13 F325 the log shows them',/Took part: Teacher, aide, parent/.test(lg)&&/Why now: Scheduled review/.test(lg)&&/Closed with the check open/.test(lg),lg.slice(0,300));
  /* ---- the shell ---- */
  const sh=await (await br.newContext()).newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const t=await sh.evaluate(([a,b])=>{state.facts={src:{},review:{date:a,earlier:'Any restraint, or three days above 2 per day',decision:'continue'},crisis:{restraints:{semester:1,last:b}}};
    const T=todayItems().map(x=>x.t);state.facts={src:{},review:{log:[{date:a,decision:'reassess'}]},plan:{rep:'x',adoption:{date:'2026-08-01',start:'2026-08-05'},versions:[{v:1,date:'2026-08-01'}]}};
    return {T,R:todayItems().map(x=>x.t)};},[iso(-20),iso(-4)]);
  ok('14 F320 Today: PR-1’s trigger for an earlier review is met by a restraint since the last review',t.T.some(x=>/trigger for an earlier review .*Any restraint.* is met: a restraint on .* \(Form CR-1\)\. Hold the review now/.test(x)),t.T);
  ok('15 F321 Today: a return to assessment needs its notice recorded too',t.R.some(x=>/Form PR-1 decided to return to assessment on .*prior written notice/.test(x)),t.R);
  ok('16 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
