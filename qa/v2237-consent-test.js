/* v22.37 the consent on file (review F11, F13, F41, I7, I23, I234). Form IC-1 hands the case its state, not two dates: a
   revoked or declined consent no longer reads as consent on file in the hand-over check, Ready to start, Today's 60-day
   clock, the calendar, the transition summary or the caseload summary; a district reevaluation starts no 60-day clock; an
   old case (two dates only) reads as before. IC-1 lists the reinforcer arrangement comparison (AD-1) and the demand
   assessment (DA-1). The forms that assess say when consent is not on file or does not cover what they run, the session
   runners show the limits the parent set, Today says so when an assessment form is in the case without consent, and
   Form IA-1 asks before any questionnaire goes out without it (sending anyway is noted in the file). Simulated people only.
   usage: node qa/v2237-consent-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const U=f=>L.BASE+'/NBH-Workstation/'+f;
const REV={src:'IC-1',state:'Revoked',on:false,method:'revoked',kind:'',obtained:'',ended:'2026-10-09',date:'',parent:'',exceptions:'',procs:['indirect','abc','fa'],covered:[],dec:{fa:{dec:'yes'},ed:{dec:''}},bip:'',v:2};
const EXC={src:'IC-1',state:'Current, with exceptions',on:true,method:'sign',kind:'',obtained:'2026-10-06',ended:'',date:'2026-10-06',parent:'2026-10-06',exceptions:'No experimental analysis (simulated)',procs:['indirect','abc','pref','fa'],covered:['indirect','abc','pref'],dec:{fa:{dec:'no'},ed:{dec:'no'}},bip:'',v:2};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  /* IC-1 on its own */
  const ic=await ctx.newPage();ic.on('pageerror',e=>errs.push('IC-1: '+e.message));await ic.goto(U('IC-1_Informed-Consent-FBA-BIP_v2026-09.html'));await sleep(900);
  await ic.evaluate(()=>{nbhUI.confirm=async()=>true;});
  const sim=async k=>{await ic.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(400);return ic.evaluate(()=>window.__nbhFactsOut().consent);};
  let c=await sim('revoke');
  ok('1 IC-1 revoked: the case gets Revoked, not on file, the revocation date as ended, and no consent date',c.state==='Revoked'&&c.on===false&&!!c.ended&&c.date===''&&c.parent===''&&c.covered.length===0,c);
  c=await sim('except');
  ok('2 IC-1 with exceptions: on file, the experimental analysis not covered, its decision no, the exceptions text',c.on&&c.state==='Current, with exceptions'&&c.covered.indexOf('fa')<0&&c.covered.indexOf('indirect')>=0&&c.dec.fa.dec==='no'&&/experimental analysis/i.test(c.exceptions),c);
  c=await sim('reeval');
  ok('3 IC-1 through the reevaluation process: kind reeval',c.on&&c.kind==='reeval',c);
  c=await sim('signed');
  await ic.evaluate(()=>{const tb=document.querySelector('#logTbl tbody'),n=document.getElementById('nLog');n.value=+n.value+1;n.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  await ic.evaluate(()=>{const tr=[...document.querySelectorAll('#logTbl tbody tr')].pop();tr.querySelector('input[type=date]').value='2026-11-02';tr.querySelector('select').value='Consent to implement the BIP (plan adopted with the parent)';});
  c=await ic.evaluate(()=>window.__nbhFactsOut().consent);
  ok('4 IC-1 signed, with "Consent to implement the BIP" logged: on file, the analysis covered, the BIP consent date',c.on&&c.covered.indexOf('fa')>=0&&c.bip==='2026-11-02',c);
  const procs=await ic.evaluate(()=>({n:document.getElementById('stProcSub').textContent,ad:!!document.querySelector('[name="p.arrange"]'),da:!!document.querySelector('[name="p.demand"]')}));
  ok('5 IC-1 lists the reinforcer arrangement comparison (AD-1) and the demand assessment (DA-1): 15 procedures (v23.48: practice with waiting, DT-1, apart)',procs.ad&&procs.da&&/15 listed/.test(procs.n),procs);
  /* the shell */
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));await page.goto(U('index.html'));await sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  const sh=await page.evaluate(([REV,EXC])=>{const R={};
    state.facts={consent:REV};R.hand=handoverItems().map(x=>x.t).filter(t=>/onsent/.test(t));R.rs=rsItems(state.facts).map(x=>x.t).filter(t=>/onsent/.test(t));
    R.cal=calEvents(state.facts).map(x=>x.what);R.sum=tdSummaryHTML();
    state.facts={consent:{date:'2026-09-01',parent:'2026-09-03',src:'IC-1'}};R.oldHand=handoverItems().map(x=>x.t).filter(t=>/onsent/.test(t));R.oldCal=calEvents(state.facts).map(x=>x.what);
    state.facts={consent:Object.assign({},EXC,{kind:'reeval'})};R.reCal=calEvents(state.facts).map(x=>x.what);R.rsExc=rsItems(state.facts).map(x=>x.t).filter(t=>/onsent/.test(t));
    return R;},[REV,EXC]);
  ok('6 the hand-over check: "Consent revoked on 10/9 (Form IC-1)", not silence',sh.hand.length===1&&/Consent revoked on 10\/9 \(Form IC-1\)/.test(sh.hand[0]),sh.hand);
  ok('7 Ready to start: consent revoked; the 60-day FBA date is not on the calendar',sh.rs.some(t=>/revoked/.test(t))&&!sh.cal.some(w=>/60 days/.test(w)),{rs:sh.rs,cal:sh.cal});
  ok('8 the transition summary says revoked, not "Consent for the FBA and BIP: <date>"',/Consent for the FBA and BIP: revoked on 2026-10-09/.test(sh.sum),sh.sum.slice(sh.sum.indexOf('History'),sh.sum.indexOf('History')+300));
  ok('9 an old case (two dates only) reads as consent on file, with the 60-day date',!sh.oldHand.length&&sh.oldCal.some(w=>/60 days/.test(w)),sh);
  ok('10 a district reevaluation starts no 60-day clock; Ready to start asks for the consent to carry out the plan',!sh.reCal.some(w=>/60 days/.test(w))&&sh.rsExc.some(t=>/carry out the plan/.test(t)),sh);
  /* in the shell: IC-1 revoked, IA-1 open: Today says so */
  await page.evaluate(()=>openForm('IC-1'));await page.waitForFunction(()=>!!state.status['IC-1'],null,{timeout:30000});await sleep(1200);
  const icf=page.frames().find(f=>/IC-1_Informed/.test(f.url()));
  await icf.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='revoke';document.getElementById('simBtn').click();});await sleep(600);
  await page.evaluate(()=>openForm('IA-1'));await page.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1500);
  const td=await page.evaluate(async()=>{await gatherFacts(true);await new Promise(r=>setTimeout(r,800));return {today:tdTimelines(state.facts).filter(x=>x.k==='Consent').map(x=>x.t),hand:handoverItems().map(x=>x.t).filter(t=>/onsent/.test(t)),c:state.facts&&state.facts.consent&&state.facts.consent.state};});
  ok('11 in the workstation: IC-1 revoked and IA-1 in the case: Today says consent is revoked and nothing is assessed',td.c==='Revoked'&&td.today.length===1&&/Consent revoked/.test(td.today[0])&&/IA-1/.test(td.today[0]),td);
  const iaf=page.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  const note=await iaf.evaluate(()=>{const n=document.getElementById('nbhConsent');return n?{t:n.textContent,c:n.className}:null;});
  ok('12 IA-1 shows the consent line under its toolbar (revoked)',note&&/revoked/i.test(note.t)&&/bad/.test(note.c),note);
  /* IA-1: the check before sending */
  const g=await iaf.evaluate(async()=>{const asked=[];nbhUI.confirm=async t=>{asked.push(t);return false;};document.getElementById('rpLink').click();await new Promise(r=>setTimeout(r,300));
    const n1=document.getElementById('outNote').textContent,v1=document.querySelector('[name="out.consentOk"]').value;
    nbhUI.confirm=async t=>{asked.push(t);return true;};document.getElementById('rpLink').click();await new Promise(r=>setTimeout(r,500));
    const v2=document.querySelector('[name="out.consentOk"]').value,line=document.getElementById('outConsent').textContent;
    const n=asked.length;document.getElementById('rpLink').click();await new Promise(r=>setTimeout(r,300));
    return {asked:asked.length,first:asked[0]||'',n1,v1,v2,line,again:asked.length-n};});
  ok('13 IA-1 asks before a link is made: "Not now" sends nothing and says why',/Consent check before anything is sent/.test(g.first)&&/revoked/i.test(g.first)&&/Not sent/.test(g.n1)&&!g.v1,g);
  ok('14 "Send anyway (consent on paper)" goes on, is noted in the file with the date, shown on the Send-outs sheet, and not asked again',/consent on paper, noted \d+\/\d+\/\d{4}/.test(g.v2)&&/consent on paper/.test(g.line)&&g.again===0,g);
  /* the forms on their own, given a case */
  const form=async(file,cons)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file+': '+e.message));await p.goto(U(file));await sleep(900);
    const r=await p.evaluate(c=>{nbhCase.apply({consent:c,profile:{client:'Mateo Rivera'}});const n=document.getElementById('nbhConsent');return n?{t:n.textContent,c:n.className}:null;},cons);await p.close();return r;};
  const ob=await form('OB-1_Direct-Observation-Record_v2026-09.html',REV),ob2=await form('OB-1_Direct-Observation-Record_v2026-09.html',EXC);
  ok('15 OB-1: a revoked consent is said; consent on file covering observation says nothing',ob&&/revoked/i.test(ob.t)&&!ob2,{ob,ob2});
  const ea=await form('EA-1_Experimental-Analysis-Protocol_v2026-09.html',EXC);
  ok('16 EA-1: consent with exceptions that leave out the analysis: "Form IC-1 does not cover the experimental analysis"',ea&&/does not cover the experimental analysis/.test(ea.t)&&/bad/.test(ea.c),ea);
  const pa=await form('PA-1_Preference-Assessment-Protocol_v2026-09.html',EXC);
  ok('17 PA-1 (a session runner): consent on file, and the parent’s No to food items',pa&&/Consent on file since 10\/6\/2026/.test(pa.t)&&/No food or drink items/.test(pa.t),pa);
  const old=await form('DA-1_Demand-Assessment_v2026-10.html',{date:'2026-09-01',parent:'',src:'IC-1'});
  ok('18 an old case on DA-1: consent on file (read as before)',old&&/Consent on file since 9\/1\/2026/.test(old.t),old);
  /* on paper: nothing of it */
  const p2=await ctx.newPage();await p2.goto(U('OB-1_Direct-Observation-Record_v2026-09.html'));await sleep(800);await p2.evaluate(c=>nbhCase.apply({consent:c}),REV);await p2.emulateMedia({media:'print'});
  ok('19 the consent line is not printed',await p2.evaluate(()=>getComputedStyle(document.getElementById('nbhConsent')).display==='none'));
  ok('20 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
