/* v22.72 Form CT-1, review Wave 3 part 1: when safety comes first, the emergency route and a contact the school can keep
   (F349); the critical steps on the in-home probe recorded, or ticked as none came due (F350); the sign-off checked against
   the decision, and follow-up probes at home (F351, I176); the caregiver's training out to the case and Form PR-1 (F353);
   the plan in: target behavior, function, skill, source, trainer (F355); the worked example and in-situ training (F357);
   the student's say (I180). Simulated data only. usage: node qa/v2272-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CT='CT-1_Caregiver-Training_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async p=>{await p.evaluate(async()=>{await loadSim();});await sleep(500);};
  const setM=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'||e.type==='checkbox'?'change':'input',{bubbles:true}));},[k,v]);
  const setFu=(p,i,k,v)=>p.evaluate(([i,k,v])=>{const e=document.querySelector('#fuTbl [data-fu="'+i+'"][data-f="'+k+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},[i,k,v]);
  const dec=p=>p.evaluate(()=>{const v=document.querySelector('#verdictBox .verdict');return {cls:v.className.replace('verdict ',''),t:v.textContent};});
  const warn=p=>p.evaluate(()=>{const w=document.getElementById('ctOutWarn');return w.hidden?'':w.textContent;});

  let p=await open(CT);
  await sim(p);
  let d=await dec(p);
  ok('1 the worked example: competent on the in-home probe, its critical steps recorded (2/2), a follow-up probe due, and the sign-off says the same',
    d.cls==='v-ok'&&/^Competent on the in-home probe: /.test(d.t)&&/critical steps on it at 100%/.test(d.t)&&/A follow-up probe is due \d+\/\d+\/\d{4}\./.test(d.t)&&
    await p.evaluate(()=>S.meta.outcome==='Competent on the in-home probe — follow-up probe due'&&S.meta.probe_crit==='2/2')&&await warn(p)==='',d);
  /* F350 */
  await setM(p,'probe_crit','');d=await dec(p);
  ok('2 F350 with steps marked critical, a blank Critical steps correct on the probe is not recorded: the decision waits, and the sign-off is flagged',
    d.cls==='v-mid'&&/the critical steps correct on it are not recorded\. Enter them \(for example 2\/2\), or tick No critical step came due on the probe/.test(d.t)&&/^Outcome entered does not match the decision/.test(await warn(p)),{d,w:await warn(p)});
  await setM(p,'probe_nocrit',true);d=await dec(p);
  ok('3 F350 ticking No critical step came due on the probe: competent, saying so',d.cls==='v-ok'&&/no critical step came due on it/.test(d.t)&&await warn(p)==='',d);
  await setM(p,'probe_nocrit',false);await setM(p,'probe_crit','1/2');d=await dec(p);
  ok('4 F350 one critical step wrong on the probe: not yet competent at home',d.cls==='v-no'&&/^Not yet competent at home/.test(d.t),d);
  await setM(p,'probe_crit','2/2');
  /* F351, I176 */
  const opts=await p.evaluate(()=>[...document.querySelectorAll('[data-m="outcome"] option')].map(o=>o.textContent).filter(Boolean));
  ok('5 F351 the outcomes say what the record shows: held at a follow-up probe; competent on the in-home probe, follow-up due; competent in rehearsal; not yet; paused',
    JSON.stringify(opts)===JSON.stringify(['Running it independently at home — held at a follow-up probe','Competent on the in-home probe — follow-up probe due','Competent in rehearsal — home probe still required','Not yet — further sessions scheduled','Paused at the family’s request']),opts);
  await setM(p,'outcome','Running it independently at home — held at a follow-up probe');
  const w1=await warn(p);
  await p.emulateMedia({media:'print'});const wp=await p.evaluate(()=>{const w=document.getElementById('ctOutWarn');return getComputedStyle(w).display!=='none'&&w.getBoundingClientRect().height>0;});await p.emulateMedia({media:'screen'});
  ok('6 F351 an outcome that claims more than the decision is flagged, on screen and on paper: "Outcome entered does not match the decision"',/^Outcome entered does not match the decision: running it independently at home needs a follow-up probe/.test(w1)&&wp,{w1,wp});
  const fuRows=await p.evaluate(()=>document.querySelectorAll('#fuTbl tbody tr').length);
  await setFu(p,0,'date','2026-10-21');await setFu(p,0,'pct','3/4');d=await dec(p);
  ok('7 F351 I176 a follow-up probe below the criterion: not holding at home, and the sign-off is flagged (three rows to write in)',fuRows===3&&d.cls==='v-no'&&/^Not holding at home: the follow-up probe on 10\/21\/2026 obtained 75% of steps correct, below the 80% criterion/.test(d.t)&&!!await warn(p),{fuRows,d});
  await setFu(p,0,'pct','4/4');d=await dec(p);
  ok('8 F351 with steps marked critical, a follow-up probe needs its critical steps too',d.cls==='v-mid'&&/its critical steps are not recorded/.test(d.t),d);
  await setFu(p,0,'crit','2/2');d=await dec(p);
  ok('9 F351 I176 a follow-up probe at the criterion with the critical steps correct: competent and holding at home, and the outcome stands',d.cls==='v-ok'&&/^Competent and holding at home: .*a follow-up probe on 10\/21\/2026 at 100% of steps correct, critical steps 100%\.$/.test(d.t)&&await warn(p)==='',d);
  await setFu(p,1,'date','2026-11-04');await setFu(p,1,'pct','2/4');d=await dec(p);
  ok('10 F351 the latest follow-up probe decides: a later one below the criterion reads not holding at home',d.cls==='v-no'&&/on 11\/4\/2026 obtained 50%/.test(d.t),d);
  await setFu(p,1,'pct','');await setFu(p,1,'date','');
  const weak=await p.evaluate(()=>({rows:[...document.querySelectorAll('#weakTbl tbody tr')].map(r=>[...r.cells].map(c=>c.textContent.trim())),note:document.getElementById('ctProbeNote').textContent}));
  ok('11 F351 Steps to Watch: a step correct in the latest round is watched for at home, not re-taught; the probe that scored 2 of the 3 critical steps says one was not seen at home',
    weak.rows.length===2&&weak.rows.every(r=>r[4]==='Correct in the latest round: watch for it at home')&&/^The in-home probe scored 2 of the 3 steps marked critical/.test(weak.note),weak);
  /* F349 */
  const rows=await p.evaluate(()=>({safety:!!document.querySelector('textarea[data-m="safety"]'),emerg:!!document.querySelector('textarea[data-m="emerg"]'),
    callTh:document.querySelector('[data-m="call"]').closest('tr').querySelector('th').textContent,callPh:document.querySelector('[data-m="call"]').placeholder,
    sim:{safety:S.meta.safety,emerg:S.meta.emerg,call:S.meta.call,relapse:S.meta.relapseDo}}));
  ok('12 F349 If the Behavior Comes Back: When safety comes first, In an emergency, and a contact the school can keep (its hours, and outside them); the worked example fills them',
    rows.safety&&rows.emerg&&rows.callTh==='Who they contact, when it is answered, and outside those hours'&&/^The school contact \(school phone or district email\), the hours it is answered, and what to do outside those hours$/.test(rows.callPh)&&
    /^If he hits his sister/.test(rows.sim.safety)&&/911/.test(rows.sim.emerg)&&/988/.test(rows.sim.emerg)&&/answered 7:30 am to 3:30 pm on school days/.test(rows.sim.call)&&/the same day/.test(rows.sim.relapse)&&!/next morning/.test(rows.sim.relapse),rows);
  await setM(p,'safety','');await setM(p,'emerg','');d=await dec(p);
  const note=await p.evaluate(()=>{const n=document.getElementById('ctSafetyNote');return n.hidden?'':n.textContent;});
  ok('13 F349 a target behavior that can hurt someone (physical aggression) with the safety rows empty: the caregiver is not cleared until they are written',
    d.cls==='v-mid'&&/The target behavior can put someone at risk, so write When safety comes first and In an emergency under If the Behavior Comes Back/.test(d.t)&&/^When safety comes first and In an emergency are not written yet\./.test(note),{d,note});
  await p.evaluate(()=>document.getElementById('ctEmergBtn').click());
  const em=await p.evaluate(()=>S.meta.emerg);
  ok('14 F349 Write in 911 and 988 puts the emergency route in the box',/^Call 911 if anyone is hurt or in danger, or might be\. For a mental-health crisis, call or text 988, or call the county’s mobile response team: _+\.$/.test(em),em);
  await setM(p,'beh','Calling out during lessons (simulated)');await setM(p,'emerg','');d=await dec(p);
  ok('15 F349 a target behavior that puts no one at risk is not held, but the note asks for the rows',d.cls==='v-ok'&&await p.evaluate(()=>!document.getElementById('ctSafetyNote').hidden),d);
  await p.close();

  /* F355, I180, F349 from the case */
  p=await open(CT);
  const fin=await p.evaluate(()=>{const f={behaviors:[{label:'Hitting peers (simulated)',def:'Open hand to a peer',isRep:false},{label:'Asks for a break (simulated)',isRep:true}],
      fn:{key:'escape',label:'Escape from demands'},plan:{rep:'Hands a break card to an adult (simulated)',beh:'Hitting peers'},
      student:{assent:'given',preference:'more breaks when the work is hard',likes:'drawing and trains',date:'2026-10-01'},
      crisis:{beh:'Hitting staff (simulated)',precursor:'Clenched fists',stages:[{s:'Agitation',do:'Offer the break card',who:'Teacher'},{s:'Peak',do:'Two trained staff hold (simulated)',who:'Team'}]},
      profile:{flags:{safety:['Elopement risk (simulated)']}}};
    const r=nbhCase.apply(f);window.__nbhApplyPacket({bcba:'Jordan Ellis (simulated)'},false);
    const box=document.getElementById('ctCrisis');
    return {beh:S.meta.beh,fn:S.meta.fn,skill:S.meta.skill,src:S.meta.src,stu:S.meta.stuSay,trainer:document.querySelector('[data-m="trainer"]').value,
      box:box.hidden?'':box.textContent,boxPrint:box.classList.contains('noprint'),filled:r&&r.filled};});
  ok('16 F355 from the case: the target behavior (TB-1), the function (FS-1), the skill taught from the plan (TD-1) and its source; the trainer is the case\'s BCBA',
    fin.beh==='Hitting peers (simulated)'&&fin.fn==='Escape from demands'&&fin.skill==='Hands a break card to an adult (simulated)'&&fin.src==='BIP (Form TD-1); FBA (Form FS-1)'&&fin.trainer==='Jordan Ellis (simulated)',fin);
  ok('17 I180 the student\'s say from the student interview (SI-1), in the student\'s words',fin.stu==='Assent given at the student interview (10/1/2026). Would like: more breaks when the work is hard. Likes and does well: drawing and trains.',fin.stu);
  ok('18 F349 on screen only: the school\'s crisis plan (its behavior, earliest sign and stage names, never what is done at each) and the precautions on file, as a reference',
    /The school’s crisis plan \(Form CR-1\) is for trained school staff; it is not a home procedure/.test(fin.box)&&/Hitting staff \(simulated\)/.test(fin.box)&&/Clenched fists/.test(fin.box)&&/Agitation; Peak/.test(fin.box)&&
    !/hold|Offer the break card/.test(fin.box)&&/Elopement risk \(simulated\)/.test(fin.box)&&fin.boxPrint,fin);
  /* the out: nothing while blank */
  const none=await p.evaluate(()=>{S=blank();renderAll();return window.__nbhFactsOut?window.__nbhFactsOut():null;});
  await sim(p);
  const cg=await p.evaluate(()=>(window.__nbhFactsOut()||{}).caregiver);
  ok('19 F353 CT-1 sends the caregiver\'s training to the case (nothing before a caregiver is named or a round coded): who, where it stands, the probe, the follow-up due, the routine, the relapse response and safety rows, the contact',
    (none===null||!none.caregiver)&&!!cg&&cg.src==='CT-1'&&cg.name==='Simulated parent'&&cg.rel==='Mother'&&cg.stand==='competent on the in-home probe'&&cg.level===2&&cg.decision.cls==='ok'&&
    cg.probe&&cg.probe.pct===100&&cg.probe.crit===100&&/^\d{4}-\d{2}-\d{2}$/.test(cg.probe.date)&&/^\d{4}-\d{2}-\d{2}$/.test(cg.due)&&/^Coming off the tablet/.test(cg.routine)&&!!cg.safety&&!!cg.emergency&&!!cg.call&&
    cg.outcome==='Competent on the in-home probe — follow-up probe due',cg);
  const due=await p.evaluate(()=>{const before=nbhCase.due();const e=document.querySelector('#fuTbl [data-fu="0"][data-f="date"]');e.value='2026-10-21';e.dispatchEvent(new Event('input',{bubbles:true}));
    const after=nbhCase.due();e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));return {before,after};});
  ok('19a the Today list takes the next follow-up probe, and not the dates of follow-up probes already run',
    due.before.length===1&&due.before[0].what==='Next follow-up probe at home'&&/^\d{4}-\d{2}-\d{2}$/.test(due.before[0].date)&&JSON.stringify(due.after)===JSON.stringify(due.before),due);
  /* F357 */
  const f357=await p.evaluate(()=>({situ:document.querySelector('[data-m="c_situ"]').closest('.bstrow').firstElementChild.textContent,how:S.meta.c_situ_how,probe:S.meta.probe,fb:S.rounds.map(r=>r.fb).join(' '),
    all:JSON.stringify(S)}));
  ok('19b F357 component 5 is in-situ training (practice and feedback in the routine); the worked example agrees the probe week with the family and no longer says unannounced',
    f357.situ==='5. In-situ training'&&/^Two rounds in the routine/.test(f357.how)&&/the family knew a visit would come that week/.test(f357.probe)&&/Agreed the week of the in-home probe with the family/.test(f357.fb)&&!/nannounced/.test(f357.all),f357);
  /* save and open: the new fields and the follow-up probes come back */
  await setFu(p,0,'date','2026-10-21');await setFu(p,0,'pct','4/4');await setFu(p,0,'crit','2/2');await setFu(p,0,'how','Video call');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);
  const fp=await dl.path();const saved=JSON.parse(require('fs').readFileSync(fp,'utf8'));
  /* an older file: the old top outcome */
  const old=JSON.parse(JSON.stringify(saved));delete old.S.fu;old.S.meta.outcome='Competent — running it independently at home';
  const tmp=require('path').join(require('os').tmpdir(),'ct1-old-'+process.pid+'.json');require('fs').writeFileSync(tmp,JSON.stringify(old));
  await p.evaluate(()=>{S=blank();renderAll();});
  await (await p.$('#fileIn')).setInputFiles(fp);await sleep(500);
  const back=await p.evaluate(()=>({fu:S.fu[0],safety:!!S.meta.safety,crit:S.meta.probe_crit,due:S.meta.fu_due,v:document.querySelector('#verdictBox').textContent.slice(0,40)}));
  await (await p.$('#fileIn')).setInputFiles(tmp);await sleep(500);
  const oldBack=await p.evaluate(()=>({out:S.meta.outcome,sel:document.querySelector('[data-m="outcome"]').value,fu:S.fu.length}));
  require('fs').unlinkSync(tmp);
  ok('20 saved and opened again: the follow-up probes and the new rows come back; an older file\'s "Competent — running it independently at home" opens as competent on the in-home probe',
    back.fu.date==='2026-10-21'&&back.fu.how==='Video call'&&back.safety&&back.crit==='2/2'&&/^\d{4}-\d{2}-\d{2}$/.test(back.due)&&/^Competent and holding at home/.test(back.v)&&
    oldBack.out==='Competent on the in-home probe — follow-up probe due'&&oldBack.sel===oldBack.out&&oldBack.fu===3,{back,oldBack});
  /* print */
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const vis=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;
    return {safety:vis(document.querySelector('[data-m="safety"]')),fu:vis(document.getElementById('fuTbl')),crisis:vis(document.getElementById('ctCrisis')),note:vis(document.getElementById('ctSafetyNote')),btn:vis(document.getElementById('ctEmergBtn'))};});
  await p.emulateMedia({media:'screen'});
  ok('21 on paper: the safety rows and the follow-up probes print; the crisis reference, the note and the button do not',pr.safety&&pr.fu&&!pr.crisis&&!pr.note&&!pr.btn,pr);
  await p.close();

  /* F350 the rehearsal runner's home probe: no critical step came due ticks the box */
  p=await open(CT);
  await p.evaluate(()=>{S=blank();S.steps=[{d:'Give the warning (simulated)',crit:false},{d:'Hold out while he protests (simulated)',crit:true},{d:'Carry on (simulated)',crit:false}];renderAll();document.querySelector('#viewSeg [data-view="train"]').click();});
  await p.evaluate(()=>document.getElementById('rrOpen').click());await sleep(200);
  await p.evaluate(()=>{const a=document.getElementById('rrArr');a.value='Home probe';a.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  await p.evaluate(()=>document.getElementById('rrStart').click());await sleep(200);
  for(const v of ['C','NA','C']){await p.evaluate(v=>{const b=document.querySelector('#rrBody button[data-act="code"][data-v="'+v+'"]:not([data-i])');b.click();},v);await sleep(120);}
  await p.evaluate(()=>document.getElementById('rrEnd').click());await sleep(250);
  const pre=await p.evaluate(()=>({st:rrRunner.state(),probe:rrRunner.probe(),fill:!!document.getElementById('rrFillChk')&&document.getElementById('rrFillChk').checked}));
  await p.evaluate(()=>document.getElementById('rrSave').click());await sleep(400);
  const rr=await p.evaluate(()=>({st:rrRunner.state(),pct:S.meta.probe_pct,crit:S.meta.probe_crit,none:S.meta.probe_nocrit,text:S.meta.probe,box:document.querySelector('[data-m="probe_nocrit"]').checked}));
  ok('22 F350 the rehearsal runner: a home probe in which no critical step came due fills the probe and ticks No critical step came due on the probe',
    rr.pct==='2/2'&&!rr.crit&&rr.none===true&&rr.box&&/no critical step came due/.test(rr.text),{pre,rr});
  await p.close();

  /* the shell keeps CT-1's part of the case; Form PR-1 reads it */
  {const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));
   await page.goto(L.BASE+'/NBH-Workstation/index.html');await page.waitForFunction(()=>typeof openForm==='function');await sleep(800);await page.evaluate(()=>{window.alert=()=>{};});
   await page.evaluate(()=>openForm('CT-1'));const h=await page.waitForSelector('iframe[title*="Form CT-1)"]',{state:'attached',timeout:15000});const fr=await h.contentFrame();
   await fr.waitForFunction(()=>document.readyState==='complete'&&!!window.nbhCase,null,{timeout:15000});await fr.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();});
   const got=await page.waitForFunction(()=>state.facts&&state.facts.caregiver&&state.facts.src.caregiver==='CT-1'&&state.facts.caregiver.level===2,null,{timeout:30000}).then(()=>true,()=>false);
   ok('23 F353 in the workstation the case keeps it (state.facts.caregiver, from Form CT-1)',got,await page.evaluate(()=>state.facts&&state.facts.src));
   await page.close();}
  p=await open('PR-1_Periodic-Plan-Review_v2026-09.html');
  const also=await p.evaluate(()=>prAlsoText({caregiver:{name:'Simulated parent',rel:'Mother',stand:'competent on the in-home probe',probe:{date:'2026-10-12',pct:100},due:'2026-10-26',src:'CT-1'}}));
  ok('24 F353 Form PR-1 says whether the family was trained to run the home plan and where it stands (Form CT-1)',
    also==='The home plan (Form CT-1): Simulated parent (mother), competent on the in-home probe; in-home probe on 10/12 100% of steps correct; follow-up probe due 10/26.',also);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('25 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
