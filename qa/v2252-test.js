/* v22.52 Form CN-1, the consultation and session notes (review F328-F337, I166, I168, I169). A new note is not signed: Sign
   this note writes the case BCBA's name with the date and time only once the note says what was done and why, then locks it;
   corrections are dated addenda and a withdrawn signature stays on the record; a note like this one leaves out who was present,
   the purpose and the signature; the service log certifies signed notes only, prints each date signed and lists unsigned ones
   below the certification. A change names its kind (no change, a rule the plan writes, a revision with the team's date, the
   notice, whether it is substantial and the parent's consent to it, or recommended only), the case shows TD-1's version,
   PR-1's review and IC-1's consent (nbhCase.consent) for it and says where it must be carried; the Log counts changes by kind.
   The IEP's minutes count the kinds it names (not the IEP meeting), with a per-note override and the rule printed. The week's
   figure from DD-1 is the week's mean, the phase average apart, with DD-1's criterion run, and the verdict is a level for the
   week. Integrity reads in TI-1's own bands with its critical-step figure. A scheduled session not held has its reason, minutes
   and make-up, and the log shows it. The plan in force follows TD-1's newest version. The time check compares the visit's own
   categories. The school comes from the packet. The Guide's sources and checks say no more than they support. A safety line
   from the case flags a second restraint; a direct session records assent with SI-1's plan; the assessment contacts are types.
   iPad-like (touch), then a phone width. Simulated people only. usage: node qa/v2252-test.js (32 checks) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CN='CN-1_Consultation-Notes_v2026-10.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
  const open=async(id,file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});return p;};
  const p=await open('CN-1',CN);
  const today=await p.evaluate(()=>{const d=new Date();return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);});
  const verdict=()=>p.$eval('#noteVerdict',e=>e.textContent);
  const toast=()=>p.evaluate(()=>{const t=document.getElementById('nbhToasts');return t?t.textContent:'';});
  /* ---- F329 signing ---- */
  await p.evaluate(()=>{S=blank();S.meta.bcba='Jordan Ellis, M.A., BCBA (simulated)';S.meta.client='Mateo Rivera';cur=0;renderAll();});
  await p.click('#newNote');await sleep(150);
  await p.fill('[data-n="date"]',today);await p.fill('[data-n="start"]','09:00');await p.fill('[data-n="end"]','09:30');
  await p.selectOption('[data-n="type"]','Observation');await p.fill('[data-n="present"]','Dana Whitfield (teacher)');await sleep(200);
  let a=await p.evaluate(()=>({sig:note().sig,ro:document.querySelector('[data-n="sig"]').readOnly,sd:document.querySelector('[data-n="sig_date"]').readOnly}));
  let v=await verdict();
  ok('1 F329 a new note is not signed (Signed is empty and written only by the button); dated, timed, typed and attended it still says it is not signed, never "Complete"',a.sig===''&&a.ro&&a.sd&&/The note is not signed/.test(v)&&!/Complete/.test(v),{a,v});
  await p.click('#signNote');await sleep(250);
  a=await p.evaluate(()=>({sig:note().sig,sd:note().sig_date}));let t=await toast();
  ok('2 F329 Sign this note refuses while the note does not say why (the purpose) and what was done (what was seen or the training)',a.sig===''&&a.sd===''&&/Not signed yet: the note still needs the purpose \(why\), what was done/.test(t),{a,t});
  await p.fill('[data-n="purpose"]','Scheduled observation of independent work');await p.fill('[data-n="observed"]','Two requests for a break, both honored within 10 seconds.');
  await p.check('#nxTbl tbody tr:first-child input[data-x="done"]').catch(()=>{});await p.uncheck('#nxTbl tbody tr:first-child input[data-x="done"]').catch(()=>{});
  await p.click('#signNote');await sleep(300);
  a=await p.evaluate(()=>({sig:note().sig,sd:note().sig_date,st:note().sig_time,dis:document.querySelector('[data-n="observed"]').disabled,what:document.querySelector('#nxTbl input[data-x="what"]').disabled,done:document.querySelector('#nxTbl input[data-x="done"]').disabled,
    signHidden:document.getElementById('signNote').hidden,addShown:!document.getElementById('addAdd').hidden,out:document.getElementById('sigOut').textContent}));v=await verdict();
  ok('3 F329 once written, Sign writes the case BCBA\'s name, today\'s date and the time; the note reads Complete and is locked (fields and step words), the Done ticks stay open',a.sig==='Jordan Ellis, M.A., BCBA (simulated)'&&a.sd===today&&/^\d\d:\d\d$/.test(a.st)&&a.dis&&a.what&&!a.done&&a.signHidden&&a.addShown&&/^Complete\./.test(v)&&/Signed by Jordan Ellis/.test(a.out),{a,v});
  await p.click('#addAdd');await p.fill('#addText','Correction: the second request came at 9:20, not 9:15.');await p.click('#addSave');await sleep(200);
  a=await p.evaluate(()=>({add:note().add,out:document.getElementById('noteOut').textContent}));
  ok('4 F329 a correction is a dated addendum with the BCBA\'s name, and it prints with the note',a.add.length===1&&a.add[0].date===today&&/Jordan Ellis/.test(a.add[0].by)&&/Addenda/i.test(a.out)&&/second request came at 9:20/.test(a.out),a);
  await p.click('#unsignNote');await sleep(250);
  a=await p.evaluate(()=>({sig:note().sig,sd:note().sig_date,add:note().add.map(x=>x.text),dis:document.querySelector('[data-n="observed"]').disabled}));
  ok('5 F329 withdrawing the signature unlocks the note and stays on it as a dated addendum',a.sig===''&&a.sd===''&&!a.dis&&a.add.length===2&&/^Signature of .* withdrawn to correct the note\.$/.test(a.add[1]),a);
  await p.click('#dupNote');await sleep(150);
  a=await p.evaluate(()=>{const n=note();return {type:n.type,present:n.present,purpose:n.purpose,sig:n.sig,plan:n.plan,setting:n.setting};});
  ok('6 F329 New note like this one copies the type, setting and plan, not who was present, the purpose or a signature',a.type==='Observation'&&a.present===''&&a.purpose===''&&a.sig==='',a);
  /* the unsigned note on the service log: below the certification, not counted */
  await p.evaluate(()=>{S.notes.splice(cur,1);cur=0;S.meta.iep_min='120';S.meta.iep_per='month';S.meta.iep_kind='consult';renderAll();setView('svc');renderSvc();});
  a=await p.evaluate(()=>{const o=document.getElementById('svcOut').innerText,i=o.indexOf('I certify'),j=o.search(/Not yet signed: not certified/i);return {o:o.slice(0,1600),i,j,iep:document.querySelector('#svcIep .val').textContent};});
  ok('7 F329 an unsigned note is listed under "Not yet signed: not certified" below the certification and is not counted toward the IEP',a.j>a.i&&a.i>0&&/No signed service entries in this period/.test(a.o)&&a.iep==='0 of 120',a);
  /* ---- F328 the kind of change and what it needs ---- */
  await p.evaluate(()=>{setView('note');const n=note();Object.assign(n,{changes:'None of the steps changed except the break interval, now 5 min',chg_kind:''});renderNote();});
  const chk=()=>p.$eval('#noteVerdict',e=>e.textContent);
  const c1=await chk();
  await p.evaluate(()=>{note().chg_kind='rule';renderNote();});const c2=await chk();
  await p.evaluate(()=>{note().chg_kind='revision';renderNote();});const c3=await chk();
  await p.evaluate(()=>{Object.assign(note(),{chg_iep:'10/9/26',chg_pwn:'10/9/26',chg_subst:'yes'});renderNote();});const c4=await chk();
  await p.evaluate(()=>{note().chg_consent='10/9/26, in writing';renderNote();});const c5=await chk();
  const opts=await p.$$eval('[data-n="chg_kind"] option',o=>o.map(x=>x.textContent));const noAuth=await p.evaluate(()=>!document.querySelector('[data-n="authority"]'));
  ok('8 F328 the one authority list is gone; a change written "None of ... except" with no kind is asked for its kind, a rule for the rule, a revision for the team\'s date, the notice and whether it is substantial, a substantial one for the parent\'s consent',
    noAuth&&opts.join('|')==='|No change to the plan|A decision rule written in the plan (Form TD-1)|A revision of the plan (the IEP team’s decision)|Recommended only; awaiting the team'&&/Say what kind of change this is/.test(c1)&&/Name the decision rule in the plan/.test(c2)&&
    /IEP team’s decision: give the date of the team meeting, or of the written amendment/.test(c3)&&/No prior written notice recorded/.test(c3)&&/Say whether the change is substantial/.test(c3)&&/needs the parent’s informed consent to it/.test(c4)&&!/consent|substantial|notice|team meeting/i.test(c5.replace(/The note is not signed.*$/,'')),{c1,c2,c3,c4,c5,opts});
  /* the case for the revision: TD-1's version, PR-1's review, IC-1's consent through nbhCase.consent */
  const CASE={plan:{versions:[{v:1,why:'adopted',date:'2026-08-24',notice:'2026-08-26'},{v:2,why:'modified',date:'2026-09-28',notice:'2026-09-30'}]},
    review:{log:[{date:'2026-09-28',decision:'modify',decisionText:'Modify the plan'}]},
    consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-09-01',covered:['indirect','abc','bip'],procs:['indirect','abc','bip'],bip:'2026-09-10',v:2},
    crisis:{restraints:{semester:2,last:'2026-10-06'},deadlines:[{what:'Crisis intervention plan upon the second restraint this semester',due:'2026-10-06',done:false}]},
    injury:{last:'2026-10-05',count30:1,latest:{date:'2026-10-05',sites:1,risk:'low'},open:[]},
    student:{assent:'given',stop:{signs:'pushes the materials away',steps:'pause and offer a break'},date:'2026-09-02'}};
  a=await p.evaluate(C=>{const n=note();Object.assign(n,{date:'9/29/26',chg_iep:'',chg_pwn:'',chg_subst:'',chg_consent:''});nbhCase.apply(C);renderNote();
    const t=document.getElementById('chgCase').textContent,b=document.getElementById('cnChgUse');if(b)b.click();return {t,b:!!b,iep:note().chg_iep,pwn:note().chg_pwn};},CASE);
  ok('9 F328 F333 a revision shows what the case holds (Form TD-1 version 2 and its notice, the PR-1 review, IC-1\'s consent read by nbhCase.consent and that it does not cover changing the plan), says where it must be carried, and Use these dates fills the team date and notice',
    /Carry it to Form TD-1/.test(a.t)&&/Form DD-1 \(a phase-change line/.test(a.t)&&/QS-1 and EB-1/.test(a.t)&&/Form TD-1 records version 2, revised 9\/28\/26, notice 9\/30\/26/.test(a.t)&&/Form PR-1: the review of 9\/28\/26 decided Modify the plan/.test(a.t)&&/Consent on file since 9\/1\/2026 \(Form IC-1\); consent to implement the BIP recorded 9\/10\/26/.test(a.t)&&/does not cover changing the plan/.test(a.t)&&a.b&&a.iep==='9/28/26'&&a.pwn==='9/30/26',a);
  /* an older file: the one authority choice becomes the kind of change */
  const OLD={form:'CN-1',rev:'2026-10',saved:'2026-09-12T12:00:00Z',S:{meta:{client:'Mateo Rivera',sid:'4471823',bcba:'Jordan Ellis (simulated)'},notes:[
    {date:'9/10/26',start:'09:00',end:'09:30',type:'Consultation',present:'Dana Whitfield (teacher)',purpose:'Data review',observed:'Reviewed the week.',changes:'Break interval now 5 min',authority:'Parent or guardian consent obtained (Form IC-1)',sig:'Jordan Ellis (simulated)',sig_date:'',next:[]},
    {date:'9/11/26',start:'10:00',end:'10:30',type:'Observation',present:'Dana Whitfield (teacher)',purpose:'Observation',observed:'Seen.',changes:'none',authority:'No change to the plan',sig:'Jordan Ellis (simulated)',sig_date:'9/11/26',next:[]}]}};
  a=await p.evaluate(async d=>{const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'old.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,400));cur=0;renderNote();const v0=document.getElementById('noteVerdict').textContent,lg=document.getElementById('chgLegacy').textContent;
    return {k:S.notes.map(n=>n.chg_kind),lg,v0,signed:S.notes.map(signed),auth:S.notes.map(n=>n.authority)};},OLD);
  ok('10 F328 a file saved before: "Parent or guardian consent (IC-1)" becomes a revision that asks for the team\'s date and says how it was recorded; "No change" with "none" stays no change; a name without a date signed is not a signature',
    a.k.join()==='revision,none'&&/Recorded before v22.52 as “Parent or guardian consent obtained \(Form IC-1\)”/.test(a.lg)&&/give the date of the team meeting/.test(a.v0)&&/holds a name but no date signed/.test(a.v0)&&a.signed.join()==='false,true'&&a.auth.join()===',',a);
  /* ---- the worked example ---- */
  await p.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(700);
  a=await p.evaluate(()=>({m:document.getElementById('logMetrics').textContent.replace(/\s+/g,' '),cells:[...document.querySelectorAll('#logTbl tbody tr')].map(r=>r.textContent.replace(/\s+/g,' ').slice(0,600))}));
  ok('11 F328 the worked example: the IEP meeting\'s revision is the one plan change, the specials visit is a recommendation awaiting the team, and the home routine is no change to the school plan',/Plan changes1notes recording a change · 1 recommended, awaiting the team/.test(a.m)&&a.cells.some(c=>/Change: Specials \(art, music, PE\) added/.test(c))&&a.cells.some(c=>/Recommended: Recommended: add specials/.test(c)),a);
  a=await p.evaluate(()=>{const S2=S.notes.map((n,i)=>({n,i}));return {v:S2.map(({i})=>{cur=i;renderNote();return document.getElementById('noteVerdict').textContent.slice(0,9);}),
    time:S2.map(({i})=>{cur=i;renderNote();return document.getElementById('timeOut').innerHTML;}),signed:S.notes.every(signed)};});
  ok('12 F329 F335 every simulated note is signed and Complete, and no time-by-category check is amber (documentation and travel are outside the visit)',a.signed&&a.v.every(x=>x==='Complete.')&&a.time.every(h=>!/v-mid/.test(h))&&a.time.some(h=>/Outside the visit: documentation and travel/.test(h)),a);
  a=await p.evaluate(()=>{setView('log');renderLog();return [...document.querySelectorAll('#hoursTbl tr')].map(r=>r.textContent.replace(/\s+/g,' '));});
  ok('13 F335 the hours table names its two figures: time with the student or team (start to end) and all time by category, in and outside the visit',/Time with the student or team/.test(a[0])&&a.some(x=>/^By category, in the visit/.test(x))&&a.some(x=>/^Outside the visit/.test(x))&&a.some(x=>/^All time.*including documentation and travel/.test(x)),a);
  /* ---- F330 the IEP minutes ---- */
  a=await p.evaluate(()=>{setView('svc');renderSvc();const now=new Date(),inM=d=>d&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    const want=S.notes.filter(n=>signed(n)&&['Observation','Consultation','Training','Phone or video call'].includes(n.type)&&inM(parseDate(n.date))).reduce((s,n)=>s+duration(n),0);
    const meet=S.notes.filter(n=>signed(n)&&/meeting/.test(n.type)&&inM(parseDate(n.date))).reduce((s,n)=>s+duration(n),0);
    return {want,meet,val:document.querySelector('#svcIep .val').textContent,sub:document.querySelector('#svcIep .sub').textContent,o:document.getElementById('svcOut').innerText,f:window.__nbhFactsOut().service.iep};});
  ok('14 F330 against the IEP\'s consultation minutes only consultation, observation and training count: the IEP and parent meetings are left out and shown on their own line, the rule prints on the page, and the case gets the same count',
    a.val===a.want+' of 120'&&a.f.done===a.want&&(a.meet?a.f.notCounted===a.meet&&new RegExp(a.meet+' min of meetings, record reviews or the assessment not counted').test(a.sub)&&/Meeting \(IEP or team meeting\) not counted toward the IEP/.test(a.o):true)&&/Counted toward the IEP’s minutes: consultation, observation and training, from signed notes\. Not counted unless a note says so: IEP and team meetings/.test(a.o),a);
  a=await p.evaluate(()=>{const n=S.notes.find(x=>x.type==='Parent meeting'),b=window.__nbhFactsOut().service.iep.done;n.svc_iep='yes';renderSvc();const c=window.__nbhFactsOut().service.iep.done;n.svc_iep='';renderSvc();
    const now=new Date(),d=parseDate(n.date),inM=d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return {b,c,inM,d:duration(n)};});
  ok('15 F330 a note set to count toward the IEP service (parent training the IEP lists) is counted',a.inM?a.c===a.b+a.d:a.c===a.b,a);
  /* ---- F334 a session not held ---- */
  a=await p.evaluate(()=>{const o=document.getElementById('svcOut').innerText,f=window.__nbhFactsOut().service;const i=S.notes.findIndex(n=>n.type==='Scheduled session not held');cur=i;setView('note');renderNote();
    return {o,missed:f.missed,iepMissed:f.iep.missed||null,box:!document.getElementById('missBox').hidden,mo:document.getElementById('missOut').textContent,types:[...document.querySelectorAll('[data-n="type"] option')].map(x=>x.textContent),
      tot:document.getElementById('svcTot').textContent};});
  ok('16 F334 a scheduled session not held is its own type with the reason, the minutes scheduled and the make-up; the service log lists it (no minutes delivered), the totals add up the missed minutes by reason and the make-up, and the case gets them',
    a.types.includes('Scheduled session not held')&&a.box&&/No service delivered: 45 minutes scheduled \(Staff not available\)\. Made up on .* \(note 7, 45 min\)/.test(a.mo)&&
    a.missed&&a.missed.length===1&&a.missed[0].min===45&&a.missed[0].reason==='Staff not available'&&!!a.missed[0].madeUp&&/1 scheduled session not held, 45 min \(staff not available 45 min\); made up 45 min/.test(a.tot)&&
    (/SCHEDULED SESSIONS NOT HELD/i.test(a.o)?/The sessions listed as not held were not provided, for the reasons shown/.test(a.o):true),a);
  /* ---- F331 the week's figure from DD-1 ---- */
  const dd=await open('DD-1','Daily_Behavior_Data_and_Visual_Analysis.html');await L.loadSim(dd);await sleep(1500);
  const ddf=await dd.evaluate(()=>{const b=S.behaviors.find(x=>(x.kind||'target')==='target');b.aim='1';return window.__nbhFactsOut();});await dd.close();
  const tgt=ddf.data.behaviors.find(b=>b.kind==='target'&&b.aim!=null&&b.cur),wk=ddf.data.week,mon=new Date(wk.mon+'T12:00:00'),sun=new Date(mon.getTime()+6*864e5);
  const vals=(ddf.data.series||[]).filter(x=>{const d=new Date(x.date+'T12:00:00');return d>=mon&&d<=sun&&typeof x.v[tgt.name]==='number';}).map(x=>x.v[tgt.name]);
  const wmean=Math.round(vals.reduce((s,x)=>s+x,0)/vals.length*100)/100;
  a=await p.evaluate(f=>{S.notes.push(newNote());cur=S.notes.length-1;renderNote();nbhCase.apply(f);const n=note();
    return {rate:n.data_rate,goal:n.data_goal,unit:n.data_unit,unitSel:document.querySelector('[data-n="data_unit"]').value,beh:n.data_beh,week:n.data_week,phase:n.data_phase,run:n.data_run,need:n.data_need,out:document.getElementById('rateOut').textContent};},ddf);
  ok('17 F331 from DD-1 the week\'s figure is that week\'s mean (not the phase\'s), in the note\'s own unit with the behavior named; the phase average and DD-1\'s criterion run are given on their own',
    +a.rate===wmean&&+a.rate!==tgt.cur.mean&&a.unit==='per day'&&a.unitSel==='per day'&&a.beh===tgt.name&&new RegExp('^week of .*'+vals.length+' days recorded \\(Form DD-1\\)$').test(a.week)&&a.phase.indexOf(String(tgt.cur.mean)+' per day over '+tgt.cur.days+' days ('+tgt.curName+')')===0&&a.run===String(tgt.run)&&a.need===String(tgt.need),{a,wmean,tgt});
  ok('18 F331 the verdict is a level for the week, never "Meets the goal", and the goal\'s criterion is left to DD-1\'s run and the goal itself',/^(At or below|Not at|Close to) the goal level this week/.test(a.out)&&!/Meets the goal/.test(a.out)&&/Phase average: /.test(a.out)&&/Form DD-1/.test(a.out)&&(+a.run>=+a.need?/check it against the goal’s own criterion \(Form GB-1\) before calling the goal met/.test(a.out):/the goal is not met until the run reaches it/.test(a.out)),a);
  a=await p.evaluate(()=>{Object.assign(note(),{data_run:'',data_need:'',data_rate:'0.9',data_goal:'1'});renderNote();return document.getElementById('rateOut').textContent;});
  ok('19 F331 a figure typed by hand is one week\'s: the note says the goal is judged on its run of consecutive measurements on DD-1',/At or below the goal level this week/.test(a)&&/One week’s figure: whether the goal is met is judged on its criterion/.test(a),a);
  /* ---- F332 integrity in TI-1's bands ---- */
  const ti=await open('TI-1','TI-1_Treatment-Integrity-Observation_v2026-09.html');await L.loadSim(ti);await sleep(1200);
  const tib=await ti.evaluate(()=>[62,76.9,85,88,94].flatMap(x=>['Behavior reduction','Skill acquisition'].map(pt=>bandOf(x,pt).txt)));const tif=await ti.evaluate(()=>window.__nbhFactsOut());await ti.close();
  a=await p.evaluate(()=>[62,76.9,85,88,94].flatMap(x=>['Behavior reduction','Skill acquisition'].map(pt=>tiBand(x,pt).txt)));
  ok('20 F332 the note reads a score in TI-1\'s own bands and words for the plan type (62, 76.9, 85, 88, 94 for a behavior-reduction and a skill-acquisition plan)',JSON.stringify(a)===JSON.stringify(tib),{a,tib});
  a=await p.evaluate(f=>{const n=note();['integ','integ_crit','integ_date','integ_note','integ_how','integ_criterion'].forEach(k=>{n[k]='';});nbhCase.apply(f);n.integ_ptype='Behavior reduction';renderNote();
    return {integ:n.integ,crit:n.integ_crit,out:document.getElementById('integOut').textContent,th:[...document.querySelectorAll('.only-note th')].map(x=>x.textContent).filter(x=>/Integrity/.test(x)),
      by:!!document.querySelector('[data-n="integ_by"]'),how:!!document.querySelector('[data-n="integ_how"]'),guide:document.querySelector('.only-guide').textContent};},tif);
  ok('21 F332 from TI-1 the latest score comes with TI-1\'s critical-step figure, which below the criterion says to treat the plan as not yet running as written; the row is "Integrity (Form TI-1)" with who observed and whether at this visit or reported; the Guide no longer calls its bands TI-1\'s own when they were not',
    a.integ===String(tif.integrity.obs[tif.integrity.obs.length-1].pct)&&a.crit===String(tif.integrity.crit)&&/Caution: effects were degraded/.test(a.out)&&/Critical steps 62\.5%, below the 90% criterion: treat the plan as not yet running as written \(Form TI-1\)/.test(a.out)&&a.th.join('|')==='Integrity (Form TI-1)'&&a.by&&a.how&&!/the same as Form TI-1 uses/.test(a.guide),a);
  a=await p.evaluate(()=>S.notes.filter(n=>n.integ_by&&/paraeducator/.test(n.integ_by)).map(n=>({d:parseDate(n.integ_date).getDay(),how:n.integ_how})));
  ok('22 F332 in the worked example the para\'s TI-1 scores fall on school days and read as reported to the BCBA',a.length===2&&a.every(x=>x.d>0&&x.d<6&&x.how==='reported to the BCBA'),a);
  /* ---- F333 the plan in force from TD-1 ---- */
  a=await p.evaluate(C=>{S.meta.plan='';S.meta.plan_v='';S.meta.plan_src='';nbhCase.apply(C);const m=S.meta.plan;S.notes.push(newNote());cur=S.notes.length-1;const n=note();n.date='10/1/26';n.plan='BIP version 1, adopted 8/24/26';n.plan_v='1';renderNote();
    const v=document.getElementById('noteVerdict').textContent,b=document.getElementById('cnPlanUse');if(b)b.click();return {m,v,b:!!b,plan:note().plan,ch:window.__nbhFactsOut().service.changes};},CASE);
  ok('23 F333 the plan in force comes from Form TD-1\'s newest version, a note carrying an older one is warned with a one-tap fix, and the changes the notes record go to the case with their dates',
    a.m==='BIP version 2, revised 9/28/26, notice 9/30/26 (Form TD-1)'&&/The case holds a newer plan than this note carries: BIP version 2/.test(a.v)&&a.b&&a.plan===a.m&&Array.isArray(a.ch)&&a.ch.some(c=>c.kind==='revision'&&c.team&&c.notice&&c.substantial==='yes'&&c.consent)&&a.ch.some(c=>c.kind==='recommended'),a);
  a=await p.evaluate(C=>{const e=document.querySelector('[data-m="plan"]');e.value='BIP version 2 as amended at the meeting (typed)';e.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply({plan:{versions:C.plan.versions.concat([{v:3,why:'modified',date:'2026-10-10',notice:'2026-10-12'}])}});return {m:S.meta.plan,bar:document.getElementById('planCase').textContent};},CASE);
  ok('23b F333 a plan line typed on The Case is not rewritten by the case; a newer TD-1 version is offered beside it instead',a.m==='BIP version 2 as amended at the meeting (typed)'&&/Form TD-1’s newest version is BIP version 3, revised 10\/10\/26, notice 10\/12\/26/.test(a.bar),a);
  /* ---- I166 safety, I168 assent, I169 the assessment contacts ---- */
  /* two incidents since the last note: yesterday (home told) and today (not yet) */
  const isoN=k=>{const d=new Date();d.setDate(d.getDate()-k);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');},mdN=k=>{const d=new Date();d.setDate(d.getDate()-k);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  a=await p.evaluate(([C,i1,i0])=>{const n=note();n.date=(d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2))(new Date());n.safety='';nbhCase.apply(Object.assign({},C,{data:{incidentList:[{date:i1,tier:'Tier 3',beh:'Physical aggression',parent:'yes'},{date:i0,tier:'Tier 2',beh:'Physical aggression',parent:''}]}}));
    return {s:note().safety,flag:document.getElementById('safeOut').textContent};},[CASE,isoN(1),isoN(0)]);
  ok('24 I166 the safety line is filled from the case (restraints this semester, the incidents since the last note and whether home was told, the latest injury), and a second restraint is flagged with the statute; it says it does not replace the incident report or the notice',
    /^Restraints this semester: 2, the last on 10\/6\/26 \(Form CR-1\)\./.test(a.s)&&a.s.indexOf('(Form DD-1): 2; '+mdN(1)+' Tier 3, Physical aggression, home told; '+mdN(0)+' Tier 2, Physical aggression, home not yet told.')>0&&/Incidents since \d+\/\d+\/\d+ \(Form DD-1\)/.test(a.s)&&/Latest injury recorded 10\/5\/26.*\(Form IM-1\)/.test(a.s)&&
    /Second restraint this semester \(2 on Form CR-1, the last on 10\/6\/26\): s\. 1003\.573\(6\)\(a\), F\.S\., requires a crisis intervention plan; Form CR-1 does not hold one yet/.test(a.flag)&&/does not replace the incident report or the notice to the parent/.test(a.flag),a);
  a=await p.evaluate(()=>{const n=note();n.type='Direct session';renderNote();const r={box:!document.getElementById('asBox').hidden,si:document.getElementById('asCase').textContent,v:document.getElementById('noteVerdict').textContent};
    Object.assign(n,{as_given:'Given, then withdrawn during the session',as_how:'came to the table and chose the first activity',as_withdraw:'pushed the materials away at 10:20; paused and offered a break; resumed when he chose to',as_part:'4 of 5 activities'});renderNote();r.out=document.getElementById('noteOut').textContent;return r;});
  ok('25 I168 a direct session records assent, how it was shown, a withdrawal and how it was honored, and participation, with Form SI-1\'s assent plan from the case; the check asks for assent and the note prints it',
    a.box&&/Form SI-1 \(interview of 9\/2\/26\): assent given; how the student says stop: pushes the materials away; what staff do then: pause and offer a break/.test(a.si)&&/Record whether the student gave assent/.test(a.v)&&/Assent: Given, then withdrawn during the session/.test(a.out)&&/Withdrawal and how it was honored: pushed the materials away/.test(a.out),a);
  a=await p.evaluate(()=>{const n=note();Object.assign(n,{type:'FBA observation',as_given:'',as_how:'',as_withdraw:'',as_part:'',data_rate:'',data_goal:'',data_beh:'',data_unit:'',data_week:'',data_phase:'',integ:'',integ_crit:'',integ_date:'',integ_note:'',integ_how:'',integ_ptype:'',integ_criterion:'',changes:'',chg_kind:'',chg_iep:'',chg_pwn:'',chg_subst:'',chg_consent:'',start:'09:00',end:'09:40'});renderNote();
    const hid=[...document.querySelectorAll('.cn-planrow')].map(r=>r.hidden),types=[...document.querySelectorAll('[data-n="type"] option')].map(x=>x.textContent),e=svcOf(n,cur);return {hid,types,kind:e.kind,counts:countsIep(e,'consult')};});
  ok('26 I169 the consent meeting, an assessment interview and an FBA observation are types; on them the plan rows step aside, and the assessment is not counted toward the IEP\'s minutes',
    ['Consent meeting','Assessment interview','FBA observation'].every(x=>a.types.includes(x))&&a.hid.length>=5&&a.hid.every(Boolean)&&a.kind==='assessment'&&a.counts===false,a);
  /* ---- F336 the school from the packet ---- */
  a=await p.evaluate(()=>{S=blank();cur=0;renderAll();window.__nbhApplyPacket({client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Simulated Elementary',bcba:'Jordan Ellis (simulated)',dob:'2016-03-14'},true);return {school:S.meta.school,dob:S.meta.dob,client:S.meta.client};});
  ok('27 F336 the workstation\'s packet fills School and district (and the date of birth from Form DM-1, as m/d/yyyy), so neither is typed again for the service log',a.school==='Simulated Elementary'&&a.dob==='3/14/2016'&&a.client==='Mateo Rivera',a);
  /* ---- F337 the Guide and the next-step check ---- */
  a=await p.evaluate(()=>{const g=document.querySelector('.only-guide').textContent.replace(/\s+/g,' ');const n=note();Object.assign(n,{recs:'Re-train step 2',next:[{what:'Re-train step 2',who:'',when:'',done:false}]});renderNote();const v1=document.getElementById('noteVerdict').textContent;
    n.next[0].who='Dana Whitfield';n.next[0].when='10/23/26';renderNote();return {g,v1,v2:document.getElementById('noteVerdict').textContent,fb:!!document.querySelector('[data-n="fb_who"]')&&!!document.querySelector('[data-n="fb_change"]')};});
  ok('28 F337 the Guide gives Bergan and Kratochwill three interviews in four stages, calls the note a share of the feedback loop only with its feedback row, and a recommendation\'s step needs an owner and a date as the check says',
    /three of them carried by a structured interview \(problem identification, problem analysis, plan evaluation\); plan implementation is monitored between them/.test(a.g)&&!/each carried by an interview/.test(a.g)&&/A stored integrity score is not feedback given/.test(a.g)&&!/are the performance-feedback loop/.test(a.g)&&a.fb&&
    /Recommendations were given but no next step has an owner and a date/.test(a.v1)&&!/no next step has an owner and a date/.test(a.v2),a);
  /* ---- Save data and Open data keep the new parts; the CSV has them ---- */
  a=await p.evaluate(async()=>{document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,500));const n=S.notes[0];n.add=[{date:'9/16/26',time:'08:00',by:'Jordan Ellis (simulated)',text:'Addendum kept.'}];
    let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(x=>{saved=saved||x;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));
    const before=JSON.stringify(S);S=blank();cur=0;renderAll();const dt=new DataTransfer();dt.items.add(new File([saved],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,400));const after=JSON.stringify(S);let csv=null;URL.createObjectURL=b=>{b.text().then(x=>{csv=x;});return o(b);};document.getElementById('csvBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    return {same:before===after,head:(csv||'').split('\n')[0],missKept:S.notes.some(n=>n.type==='Scheduled session not held'&&n.miss_reason==='Staff not available'),addKept:S.notes[0].add.length===1};});
  ok('29 Save data then Open data keeps every new part (kind of change, the session not held, signatures and addenda), and the CSV carries the new columns',a.same&&a.missKept&&a.addKept&&/"Kind of change"/.test(a.head)&&/"Not held: reason"/.test(a.head)&&/"Addenda"/.test(a.head)&&/"Time signed"/.test(a.head),a);
  /* ---- a phone ---- */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});const q=await ph.newPage();q.on('pageerror',e=>errs.push('phone: '+e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+CN);await sleep(900);await q.evaluate(()=>{window.confirm=()=>true;});await q.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const sw=[];for(const vw of ['note','log','svc']){await q.evaluate(vw=>{setView(vw);if(vw==='svc')renderSvc();if(vw==='log')renderLog();},vw);await sleep(200);sw.push(await q.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth));}
  await q.evaluate(()=>{setView('note');cur=4;renderNote();});await sleep(150);sw.push(await q.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth));
  ok('30 at a phone\'s width the note (with a session not held), the log and the service log do not scroll sideways',sw.every(x=>x<=0),sw);await ph.close();
  }catch(e){errs.push('test: '+(e.stack||e.message));}
  ok('no script errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
