/* v25.68 wave 2, safety records: research #2 and #6, at least one check each. Simulated data only ("Sample Student", "S.S.",
   the simulated BCBA "Jordan Ellis"); no participant or student names.
   BRIEF  research #2 CR-1's one-page brief for the school threat management team, built from the case: the situation, the baseline
                      behavior from DD-1's levels and range, the function (FS-1), each target's definition and non-examples (TB-1),
                      the crisis steps, the placement line, a read-back line; initials only; no rating of any kind; one printed page
   EVENTS research #2 Baker Act initiations (date, who initiated, each attempt to reach the parent) and threat team cases as dated
                      events in CR-1: kept with the record, printed, sent to the case as crisis.events; RR-1's timeline counts them as
                      setting events; PR-1's review lists them
   REC    research #6 "recorded at" beside "happened at" on DD-1's incident log, CR-1 (restraints, attempts, debriefings, events), IM-1
                      (administrations, nurse checks, care entries) and CN-1 (notes); more than 24 hours after prints "Late entry"
   ADD    research #6 once TD-1, IC-1, CR-1 or a CN-1 note is signed, a change is a dated addendum with a reason; never blocked; the
                      printout shows the record with its addenda
   OLD    a case saved before opens and saves unchanged (no new keys), and prints as before (nothing new on paper)
   PAD    the new parts on an iPad sideways and upright (Chromium with an iPad's user agent and touch): no page-wide scroll, 44 px
   usage: WS_URL=http://127.0.0.1:8646 WS_ROOT=. node qa/v2568-safety-records-test.js [section...] */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FILE=id=>L.forms().find(x=>x.id===id).file;
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const SHOTS=path.join(__dirname,'out','v2568-safety');try{fs.mkdirSync(SHOTS,{recursive:true});}catch(e){}
const isoDay=k=>{const d=new Date();d.setDate(d.getDate()+k);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const mdyDay=k=>{const d=new Date();d.setDate(d.getDate()+k);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
/* a simulated case, as the workstation sends it: DD-1's levels and ranges, FS-1's function, TB-1's targets */
const CASE={data:{src:'DD-1',from:isoDay(-40),to:isoDay(-1),days:20,behaviors:[{name:'Hitting staff',kind:'target',measure:'count',unit:'occurrences',days:20,mean:1.4,
    base:{days:8,mean:4.2,total:34,min:2,max:7},baseName:'Baseline',cur:{days:12,mean:1.1,total:13,min:0,max:3},curName:'FCT with a break card',rng:{min:0,max:4}}],
    incidentList:[{id:'iSim1',date:isoDay(-3),time:'10:15',beh:'Hitting staff',hold:'',rec:new Date().toISOString(),late:true}]},
  fn:{key:'escape',label:'Escape from demands',statements:['When a math worksheet is given, S.S. hits the adult nearby, and the work is removed.']},
  behaviors:[{label:'Hitting staff',def:'Any contact of S.S.’s open or closed hand with an adult’s body, with force that makes a sound.',nex:'A high five the adult offered.\nTapping an adult’s arm to get attention.',type:'Single topography',src:'TB-1'},
    {label:'Break card',def:'Handing the break card to an adult.',type:'Replacement / alternative behavior',isRep:true,src:'TB-1'}]};
(async()=>{const br=await L.chromium.launch();const errs=[];
 const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});
 const open=async(id,c)=>{const p=await (c||ctx).newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(FILE(id)));await sleep(1300);await p.evaluate(()=>{window.alert=()=>{};}).catch(()=>{});return p;};
 const yes=async p=>{for(let k=0;k<6;k++){await sleep(250);const hit=await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('button.primary,button.danger')||[...d.querySelectorAll('button')].pop();b&&b.click();return true;}return false;});if(!hit&&k>1)break;}};
 const sim=async p=>{await L.loadSim(p);await sleep(900);await yes(p);await sleep(700);};
 const sec=async(k,fn)=>{if(!want(k))return;try{await fn();}catch(e){ok(k+': the section ran to the end',false,String(e&&e.stack||e));}};
 const view=async(p,v)=>{await p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');b&&b.click();},v);await sleep(300);};
 const printShown=async(p,sel)=>{await p.emulateMedia({media:'print'});const r=await p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>getComputedStyle(e).display!=='none'&&!!(e.offsetParent||e.getClientRects().length)),sel);await p.emulateMedia({media:'screen'});return r;};
 const saveJson=async p=>p.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;let got=null;
   URL.createObjectURL=b=>{got=b;return 'blob:held';};HTMLAnchorElement.prototype.click=function(){};
   try{(document.querySelector('#saveBtn,#btnSave,#dl-json')||[...document.querySelectorAll('button')].find(b=>/^\s*save data\s*$/i.test(b.textContent))).click();}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}
   if(!got)return res(null);got.text().then(t=>res(t));}));
 const openJson=async(p,text)=>{await p.evaluate(t=>{const i=document.querySelector('#fileIn,#fileImport,#file-input');const dt=new DataTransfer();dt.items.add(new File([t],'case.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(1500);};
 const strip=t=>{const o=JSON.parse(t);delete o.saved;return JSON.stringify(o);};

 /* ---------------- BRIEF and EVENTS: CR-1 ---------------- */
 await sec('BRIEF',async()=>{
  const p=await open('CR-1');await sim(p);
  await p.evaluate(c=>{S.meta.client='Sample Student';S.meta.bcba='Jordan Ellis, BCBA (simulated)';window.__nbhFactsIn(c);},CASE);await sleep(400);
  await view(p,'tm');
  const vis=await p.evaluate(()=>({sec:!!document.getElementById('tmSec').offsetParent,btn:!!document.querySelector('#viewSeg button[data-view="tm"]'),others:!!document.querySelector('section.only-plan').offsetParent}));
  ok('BRIEF 1 CR-1 has a Threat team brief view, and it shows on its own',vis.sec&&vis.btn&&!vis.others,vis);
  await p.click('#tmAddThreat');await sleep(300);
  await p.locator('[data-tmc="0"] input[data-tm="d"]').fill(isoDay(-1));await p.locator('[data-tmc="0"] input[data-tm="brief"]').fill(isoDay(0));await sleep(400);
  const b=await p.evaluate(()=>({html:window.__cr1Brief.html(),text:window.__cr1Brief.text(),shown:(document.getElementById('tmBrief')||{}).innerHTML||''}));
  const t=b.text;
  ok('BRIEF 2 the brief is a hand-off: situation, what to do, what to watch for, and a read-back line',/1\. Situation/.test(t)&&/2\. What to do/.test(t)&&/3\. What to watch for/.test(t)&&/4\. Read-back/.test(t)&&/Read back by/.test(t),t.slice(0,600));
  ok('BRIEF 3 the baseline behavior comes from DD-1\'s levels and their range (before the plan and now)',/before the plan \(Baseline, 8 school days\), about 4\.2 times a day, from 2 to 7 on a day/.test(t)&&/now \(FCT with a break card, 12 school days\), about 1\.1 times a day, from 0 to 3/.test(t),t.slice(0,900));
  ok('BRIEF 4 the function comes from FS-1, each target\'s definition and non-examples from TB-1 (not the replacement)',/Escape from demands/.test(t)&&/Form FS-1/.test(t)&&/Hitting staff\./.test(t)&&/Not: A high five the adult offered; Tapping/.test(t)&&!/Break card\./.test(t),t.slice(t.indexOf('What each'),t.indexOf('What each')+700));
  ok('BRIEF 5 what to do is the plan\'s crisis steps; what to watch for is the precursor',/What to do[\s\S]*Prevention[\s\S]*What to watch for/.test(t)&&b.html.indexOf('What to watch for')>0,t.slice(0,1500));
  ok('BRIEF 6 the line "Placement decisions are made through the IEP or 504 team." is on it',/Placement decisions are made through the IEP or 504 team\./.test(t));
  ok('BRIEF 7 it never reads as a risk rating: no level, score or rating words, and it says it gives none',!/(low|moderate|medium|high|elevated|severe)[- ]risk|risk (level|rating|score|category)|threat level|\bscore\b|\btier\b/i.test(t)&&/It is not a threat assessment, and it gives no rating or level of any kind/.test(t),t.match(/.{0,40}(risk|score|tier).{0,40}/gi));
  ok('BRIEF 8 initials only: the student is S.S., the full name is not on it; confidential, and nothing is sent',/Student: S\.S\./.test(t)&&!/Sample Student/.test(t)&&/nothing is sent from the workstation/.test(t)&&/District policy decides who receives this brief/.test(t),t.slice(0,300));
  ok('BRIEF 9 the threat team case is the situation ("Referred to the school threat management team")',/Referred to the school threat management team: /.test(t));
  ok('BRIEF 10 the preview on the screen is the brief',/Brief for the School Threat Management Team/.test(b.shown));
  /* one printed page, the brief alone */
  await p.evaluate(()=>{document.getElementById('tmBriefPrint').innerHTML=window.__cr1Brief.html();document.body.classList.add('cr-brief-only');});
  const pdf=await p.pdf({format:'Letter',printBackground:true});const pt=await p.evaluate(()=>document.body.classList.contains('cr-brief-only'));
  await p.evaluate(()=>{document.body.classList.remove('cr-brief-only');document.getElementById('tmBriefPrint').innerHTML='';});
  ok('BRIEF 11 Print the brief prints one page, the brief alone',pages(pdf)===1&&pt,{pages:pages(pdf)});
  /* Print the brief: the running head carries the initials only, after the form's own head (which names the student) */
  const head=await p.evaluate(async()=>{const pr=window.print;let o=null;window.print=()=>{window.dispatchEvent(new Event('beforeprint'));const L=[...document.head.querySelectorAll('style')],a=document.getElementById('tmBriefPage'),b=document.getElementById('nbh-print-head');
      o={mine:a?a.textContent:'',after:!!a&&(!b||L.indexOf(a)>L.indexOf(b)),only:document.body.classList.contains('cr-brief-only')};window.dispatchEvent(new Event('afterprint'));};
    document.getElementById('tmPrint').click();await new Promise(r=>setTimeout(r,300));window.print=pr;return o;});
  ok('BRIEF 14 Print the brief: the running head shows the initials only (S.S.), placed after the form\'s own head',head&&head.only&&head.after&&/@top-center\{content:"S\.S\."\}/.test(head.mine)&&!/Sample Student/.test(head.mine),head);
  /* the whole form's print does not carry the brief */
  const shown=await printShown(p,'#tmBrief,.tm-brief-wrap');
  ok('BRIEF 12 the form\'s own print does not carry the brief (it prints only with its own button)',shown.every(x=>!x),shown);
  ok('BRIEF 13 the statute summary says "Check the current wording before printing" on the screen, and not on paper',(await p.evaluate(()=>/Check the current wording before printing/.test(document.querySelector('.tm-law').textContent)))&&(await printShown(p,'.tm-check')).every(x=>!x));
  await p.close();});

 await sec('EVENTS',async()=>{
  const p=await open('CR-1');await sim(p);await view(p,'tm');
  await p.click('#tmAddBaker');await sleep(300);
  const c='[data-tmc="0"] ';
  await p.locator(c+'input[data-tm="d"]:not([data-tma])').fill(isoDay(-3));await p.locator(c+'input[data-tm="t"]:not([data-tma])').fill('10:20');
  await p.locator(c+'input[data-tm="who"]').fill('School resource officer');await p.locator(c+'textarea[data-tm="note"]').fill('S.S. was taken for an examination (simulated).');
  await p.locator(c+'input[data-tma="0"][data-tm="d"]').fill(isoDay(-3));await p.locator(c+'input[data-tma="0"][data-tm="t"]').fill('10:05');
  await p.locator(c+'select[data-tma="0"][data-tm="m"]').selectOption('Telephone');await p.locator(c+'input[data-tma="0"][data-tm="o"]').fill('Left a voicemail');
  await p.click(c+'button[data-tmattadd]');await sleep(300);
  await p.locator(c+'input[data-tma="1"][data-tm="d"]').fill(isoDay(-3));await p.locator(c+'input[data-tma="1"][data-tm="t"]').fill('10:12');
  await p.locator(c+'select[data-tma="1"][data-tm="m"]').selectOption('Telephone');await p.locator(c+'input[data-tma="1"][data-tm="o"]').fill('Spoke with the parent or guardian');await sleep(400);
  const r=await p.evaluate(()=>({tm:JSON.parse(JSON.stringify(S.tm||[])),out:window.__nbhFactsOut(),st:(document.getElementById('tmSt0')||{}).textContent||'',paper:(document.getElementById('tmPaper')||{}).textContent||''}));
  const ev=r.out&&r.out.crisis&&r.out.crisis.events||[];
  ok('EVENTS 1 a Baker Act initiation keeps its date, time, who initiated it (a role) and each attempt to reach the parent',r.tm.length===1&&r.tm[0].kind==='baker'&&r.tm[0].who==='School resource officer'&&r.tm[0].att.length===2&&r.tm[0].att[1].o==='Spoke with the parent or guardian',r.tm);
  ok('EVENTS 2 the case gets crisis.events: the kind, the date and time, 2 attempts, the parent reached; no names, no notes',ev.length===1&&ev[0].kind==='baker'&&ev[0].date===r.tm[0].d&&ev[0].time==='10:20'&&ev[0].attempts===2&&ev[0].reached===true&&!('note' in ev[0])&&!('who' in ev[0]),ev);
  ok('EVENTS 3 the entry says the parent was reached on attempt 2, and when it was recorded, with "Late entry" (3 days after)',/reached on attempt 2/.test(r.st)&&/Recorded .*\(device clock\)/.test(r.st)&&/Late entry/.test(r.st),r.st);
  const pr=await printShown(p,'#tmSec,#tmPaper');
  ok('EVENTS 4 with an event, the section prints (its table, not the editor)',pr[0]&&pr[1]&&/Baker Act initiation 1/.test(r.paper)&&/Attempt 2:/.test(r.paper),{pr,paper:r.paper.slice(0,300)});
  const saved=await saveJson(p);await openJson(p,saved);
  const again=await p.evaluate(()=>JSON.parse(JSON.stringify(S.tm||[])));
  ok('EVENTS 5 Save data and Open data keep the events and their recorded-at',again.length===1&&again[0].att.length===2&&/^\d{4}-/.test(again[0].rec||'')&&/^\d{4}-/.test(again[0].att[0].rec||''),again);
  const csv=await p.evaluate(()=>crCsvRows().filter(x=>x[0]==='Threat team brief').map(x=>x.join(' | ')).join('\n'));
  ok('EVENTS 6 the spreadsheet carries the events',/Baker Act initiation 1: date and time/.test(csv)&&/attempt 2 to reach the parent/.test(csv),csv);
  await p.close();
  /* RR-1: setting events */
  const q=await open('RR-1');await sim(q);
  const rr=await q.evaluate(async ev=>{window.__nbhFactsIn({crisis:{src:'CR-1',events:ev}});await new Promise(r=>setTimeout(r,500));const tl=document.getElementById('rrTlEv');
    return {tl:(tl||{}).textContent||'',wrap:!document.getElementById('rrTlWrap').hidden,note:(document.getElementById('rrCrEvNote')||{}).textContent||'',cmp:(document.getElementById('v65EvCmp')||{}).textContent||''};},
    [{kind:'baker',date:isoDay(-20),time:'10:20',attempts:2,reached:true},{kind:'threat',date:isoDay(-18)}]);
  ok('EVENTS 7 RR-1\'s timeline draws CR-1\'s Baker Act initiation and threat team case as dated events',rr.wrap&&/Baker Act initiation \(Form CR-1\)/.test(rr.tl)&&/Threat management team case \(Form CR-1\)/.test(rr.tl)&&/count as dated events/.test(rr.note),rr);
  ok('EVENTS 8 RR-1 counts them as setting events in the event-day comparison',/Baker Act initiation \(Form CR-1\)/.test(rr.cmp)&&/Threat management team case \(Form CR-1\)/.test(rr.cmp),rr.cmp.slice(0,400));
  const before=await saveJson(q);await q.close();
  ok('EVENTS 9 nothing is added to RR-1\'s own rows or saved file',!/Form CR-1\)/.test(before));
  /* PR-1: the review lists them */
  const r1=await open('PR-1');await sim(r1);
  const prr=await r1.evaluate(ev=>{const f=Object.assign({},prCase||{});f.crisis=Object.assign({},f.crisis||{},{events:ev});window.__nbhFactsIn(f);renderVerdicts();return (document.getElementById('prSafety')||{}).textContent||'';},
    [{kind:'baker',date:isoDay(-2),attempts:1,reached:false},{kind:'threat',date:isoDay(-1),brief:isoDay(0)}]);
  ok('EVENTS 10 PR-1\'s Safety in the Period lists the Baker Act initiation and the threat team case',/Baker Act initiations in this period \(Form CR-1\): 1/.test(prr)&&/not recorded as reached/.test(prr)&&/Threat management team cases in this period \(Form CR-1\): 1/.test(prr)&&/Placement decisions are made through the IEP or 504 team/.test(prr),prr.slice(0,600));
  await r1.close();});

 /* ---------------- REC: recorded at, late entry ---------------- */
 await sec('REC',async()=>{
  /* DD-1's incident log */
  const d=await open('DD-1');
  await d.evaluate(()=>{if(!S.behaviors.length)return;});await d.click('#ddIncAdd').catch(()=>{});await sleep(400);
  let opened=await d.evaluate(()=>{const g=document.getElementById('dlgInc');return !!(g&&g.open);});
  if(!opened){await d.evaluate(()=>ddIncOpen(null));await sleep(300);}
  await d.locator('#incDate').fill(isoDay(-3));await d.locator('#incTime').fill('09:30');await d.locator('#incWhat').fill('Hit the adult once on the arm (simulated).');
  await d.click('#incSave');await sleep(500);
  await d.evaluate(()=>{ddIncOpen(null);});await sleep(300);await d.locator('#incWhat').fill('Pushed the chair (simulated).');await d.click('#incSave');await sleep(500);
  const dr=await d.evaluate(()=>{const L=S.incidents||[];return {L:JSON.parse(JSON.stringify(L)),log:(document.getElementById('ddInc')||{}).textContent||'',out:window.__nbhFactsOut()};});
  const il=(dr.out&&dr.out.data&&dr.out.data.incidentList)||[];
  ok('REC 1 DD-1: a new incident keeps its recorded-at; one logged 3 days after it happened shows "Late entry", one logged today does not',dr.L.length===2&&dr.L.every(i=>/^\d{4}-\d\d-\d\dT/.test(i.rec||''))&&/Late entry/.test(dr.log)&&(dr.log.match(/Late entry/g)||[]).length===1,{L:dr.L.map(i=>[i.date,i.rec]),log:dr.log.slice(0,400)});
  ok('REC 2 DD-1: the case gets each incident\'s recorded-at and whether it is late',il.length===2&&il.some(i=>i.late===true)&&il.some(i=>i.late===false)&&il.every(i=>i.rec),il);
  const txt=await saveJson(d);await openJson(d,txt);
  ok('REC 3 DD-1: Save data and Open data keep the recorded-at',(await d.evaluate(()=>(S.incidents||[]).filter(i=>i.rec).length))===2);
  await d.close();
  /* CR-1: a restraint typed by hand, its attempt, the debriefing */
  const c=await open('CR-1');await view(c,'log');
  await c.locator('#logTbl input[data-l="0"][data-f="set"]').fill('Math block (simulated)');await c.locator('#logTbl input[data-l="0"][data-f="d"]').fill(mdyDay(-2));await sleep(300);
  await c.locator('#crcRows input[data-c="0"][data-f="rd"]').fill(isoDay(-2)).catch(()=>{});
  await c.locator('#crcRows [data-ca="0.0"][data-f="o"]').fill('Left a voicemail').catch(()=>{});await sleep(400);
  await view(c,'deb');await c.locator('[data-m="dbWho"]').fill('Two staff and the BCBA (simulated)');await sleep(300);
  const cr=await c.evaluate(()=>{crcPaper();return {row:S.log[0].rec||'',row1:S.log[1].rec||'',att:(S.log[0].att[0]||{}).rec||'',deb:S.meta.dbRec||'',paper:(document.getElementById('crcPaper')||{}).textContent||'',debTxt:(document.getElementById('crDbRec')||{}).textContent||''};});
  ok('REC 4 CR-1: a restraint typed on the log, its telephone attempt and the debriefing keep their recorded-at; an untouched row has none',/^\d{4}-/.test(cr.row)&&/^\d{4}-/.test(cr.att)&&/^\d{4}-/.test(cr.deb)&&!cr.row1,cr);
  ok('REC 5 CR-1: the paper prints the restraint\'s recorded-at with "Late entry" (2 days after), and the debriefing\'s',/Recorded .*\(device clock\).*Late entry/.test(cr.paper)&&/Debriefing Recorded/.test(cr.debTxt),{paper:cr.paper.slice(0,500),deb:cr.debTxt});
  await c.close();
  /* IM-1: a nurse check, an administration */
  const m=await open('IM-1');await view(m,'history');await m.click('#addNurse');await sleep(300);
  await m.locator('#imNurse input[data-f="date"]').last().fill(mdyDay(-4).replace(/\/(\d\d)$/,'/20$1'));await m.locator('#imNurse input[data-f="findings"]').last().fill('Scratch on the left hand (simulated)');
  await m.locator('#imNurse input[data-f="findings"]').last().press('Tab');await sleep(300);
  await m.evaluate(()=>{S.cur.date=(()=>{const d=new Date();d.setDate(d.getDate()-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();})();S.cur.examiner='School nurse (simulated)';S.cur.second='Classroom aide (simulated)';S.cur.secondRole='Paraprofessional';S.cur.present=true;S.cur.assent='yes';renderAll();});
  await view(m,'map');await m.locator('.imSaveAdm:visible').first().click();await yes(m);await sleep(600);
  const im=await m.evaluate(()=>({nurse:(S.nurse[S.nurse.length-1]||{}).rec||'',hist:(S.hist[S.hist.length-1]||{}).rec||'',nt:(document.querySelector('#imNurse tbody')||{}).textContent||'',ht:(document.querySelector('#imHist tbody')||{}).textContent||''}));
  ok('REC 6 IM-1: a nurse check added and an administration filed keep their recorded-at; the check dated 4 days back shows "Late entry"',/^\d{4}-/.test(im.nurse)&&/^\d{4}-/.test(im.hist)&&/Late entry/.test(im.nt)&&/Recorded/.test(im.ht),im);
  await m.close();
  /* CN-1: a note */
  const k=await open('CN-1');await k.locator('[data-n="date"]').fill(mdyDay(-3));await k.locator('[data-n="observed"]').fill('Watched the math block (simulated).');await sleep(400);
  const cn=await k.evaluate(()=>{renderNoteOut();return {rec:note().rec||'',ed:(document.getElementById('cnRec68')||{}).textContent||'',out:(document.querySelector('#noteOut .cn-head')||{}).textContent||''};});
  ok('REC 7 CN-1: a note keeps its recorded-at; written 3 days after the contact it shows and prints "Late entry"',/^\d{4}-/.test(cn.rec)&&/Late entry/.test(cn.ed)&&/Recorded.*Late entry/.test(cn.out),cn);
  await k.close();});

 /* ---------------- ADD: addenda once signed ---------------- */
 await sec('ADD',async()=>{
  /* CR-1 */
  const c=await open('CR-1');await sim(c);await view(c,'plan');
  const pre0=await c.evaluate(()=>S.meta.precursor||'');
  await c.locator('#crSgOn').fill(isoDay(-5));await sleep(600);
  await c.locator('[data-m="precursor"]').click();await c.locator('[data-m="precursor"]').fill(pre0+' Pushing materials away (simulated correction).');await sleep(700);
  let r=await c.evaluate(()=>({meta:S.meta.precursor,box:(document.getElementById('cr1Add68')||{}).textContent||'',bar:(()=>{const b=document.getElementById('cr1Add68Bar');return b&&!b.hidden?b.textContent:'';})()}));
  ok('ADD 1 CR-1: after the plan is signed, a change stands (never blocked) and is shown as changed after signing, as it stood and now',/Pushing materials away/.test(r.meta)&&/Changed after signing; not yet filed/.test(r.box)&&/as it stood/.test(r.box)&&/was signed/.test(r.bar),r);
  await c.locator('#cr1Add68Why').fill('Correcting an error');await c.click('#cr1Add68File');await sleep(500);
  r=await c.evaluate(()=>({st:JSON.parse(S.meta.add68||'null'),box:(document.getElementById('cr1Add68')||{}).textContent||''}));
  ok('ADD 2 CR-1: Filed, the addendum is dated, names the BCBA and the reason, and keeps the entry as it stood',r.st&&r.st.list.length===1&&r.st.list[0].why==='Correcting an error'&&/^\d{4}-/.test(r.st.list[0].at)&&r.st.list[0].ch.some(x=>/precursor/i.test(x.l)&&x.was.length>0&&/Pushing materials/.test(x.now))&&/Addendum 1/.test(r.box)&&/Reason: Correcting an error/.test(r.box),r);
  const pp=await printShown(c,'#cr1Add68,.add68-form');
  ok('ADD 3 CR-1: the printout shows the addenda after the signatures (the reason box stays on the screen)',pp[0]&&!pp[1],pp);
  const t=await saveJson(c);await openJson(c,t);
  ok('ADD 4 CR-1: Save data and Open data keep the addenda',(await c.evaluate(()=>{try{return JSON.parse(S.meta.add68).list.length;}catch(e){return 0;}}))===1);
  await c.close();
  /* TD-1 */
  const d=await open('TD-1');
  await d.evaluate(()=>{const e=document.querySelector('[name="ad.psig"]');e.value=JSON.stringify({name:'Sample Parent',rel:'Parent',how:'in person',signed:'2026-10-02'});e.dispatchEvent(new Event('input',{bubbles:true}));});
  await view(d,'setup');const fname=await d.evaluate(()=>{const e=[...document.querySelectorAll('#setup input[type=text][name],#setup input:not([type])[name],#setup textarea[name]')].find(x=>x.offsetParent&&!x.readOnly&&!x.value);return e?e.name:'';});
  await d.locator('[name="'+fname+'"]').click();await d.locator('[name="'+fname+'"]').fill('Simulated correction after signing');await sleep(700);
  await view(d,'final');await sleep(300);
  let tr=await d.evaluate(()=>({box:(document.getElementById('td1Add68')||{}).textContent||''}));
  ok('ADD 5 TD-1: once the plan is signed (in person, on paper, with its date), a change is shown as changed after signing',/Changed after signing; not yet filed/.test(tr.box)&&/Simulated correction after signing/.test(tr.box),{fname,box:tr.box.slice(0,400)});
  await d.locator('#td1Add68Why').fill('Information learned after signing');await d.click('#td1Add68File');await sleep(500);
  {const sv=JSON.parse(await saveJson(d));tr={f:sv.fields['ad.add68']||'',box:await d.evaluate(()=>(document.getElementById('td1Add68')||{}).textContent||'')};}
  ok('ADD 6 TD-1: the addendum is filed with its reason and goes into the saved file (ad.add68)',/Information learned after signing/.test(tr.f)&&/Addendum 1/.test(tr.box),tr.box.slice(0,300));
  ok('ADD 7 TD-1: the Final plan prints the addenda',(await printShown(d,'#td1Add68'))[0]);
  await d.close();
  const d2=await open('TD-1');
  ok('ADD 8 TD-1: an unsigned plan saves no addenda field (a plan saved before saves as it did)',!('ad.add68' in JSON.parse(await saveJson(d2)).fields)&&(await d2.evaluate(()=>!!document.querySelector('[name="ad.add68"]'))));await d2.close();
  /* IC-1 */
  const g=await open('IC-1');await view(g,'consent');
  await g.locator('[name="s.par.name"]').fill('Sample Parent');await g.click('[data-sigtype="par"]');await sleep(300);await g.locator('[name="s.par.date"]').fill(isoDay(-7));await sleep(300);
  const gname=await g.evaluate(()=>{const e=[...document.querySelectorAll('#consent textarea[name],#consent input[type=text][name]')].find(x=>x.offsetParent&&!x.readOnly&&!/^(s\.|tb\.)/.test(x.name));return e?e.name:'';});
  await g.locator('[name="'+gname+'"]').click();await g.locator('[name="'+gname+'"]').fill('Simulated change after the parent signed');await sleep(700);
  await view(g,'record');
  const ic=await g.evaluate(()=>({sig:!!document.querySelector('[name="s.par.sig"]').value,box:(document.getElementById('ic1Add68')||{}).textContent||''}));
  ok('ADD 9 IC-1: after the parent signs on the form, a change to the consent is shown on the Consent record as changed after signing',ic.sig&&/Changed after signing; not yet filed/.test(ic.box)&&/Simulated change after the parent signed/.test(ic.box),{gname,ic});
  await g.locator('#ic1Add68Why').fill('Clarifying the wording');await g.click('#ic1Add68File');await sleep(500);
  const ic2={f:JSON.parse(await saveJson(g)).fields['r.add68']||''};
  ok('ADD 10 IC-1: the addendum is filed with its reason and kept in the saved file; the consent record prints it',/Clarifying the wording/.test(ic2.f)&&(await printShown(g,'#ic1Add68'))[0]);
  await g.close();
  /* CN-1 */
  const k=await open('CN-1');await sim(k);await view(k,'note');
  const sg=await k.evaluate(async()=>{const n=note();if(!signed(n)){S.meta.bcba=S.meta.bcba||'Jordan Ellis, BCBA (simulated)';}return signed(n);});
  if(!sg){await k.click('#signNote');await yes(k);await sleep(400);}
  await k.click('#addAdd');await k.locator('#addText').fill('The observation ran to 10:40, not 10:30 (simulated).');await k.locator('#addWhy').fill('Correcting an error');await k.click('#addSave');await sleep(400);
  let cn=await k.evaluate(()=>{const n=note();renderNoteOut();return {a:JSON.parse(JSON.stringify(n.add||[])),out:(document.getElementById('noteOut')||{}).textContent||''};});
  ok('ADD 11 CN-1: a signed note\'s addendum is dated and keeps its reason; the printed note shows both',cn.a.length>=1&&cn.a[cn.a.length-1].why==='Correcting an error'&&/Reason: Correcting an error/.test(cn.out),cn.a);
  const obs0=await k.evaluate(()=>note().observed);
  await k.click('#unsignNote');await yes(k);await sleep(400);
  await k.locator('[data-n="observed"]').fill(obs0+' Corrected after the signature was withdrawn (simulated).');await sleep(200);
  await k.click('#signNote');await yes(k);await sleep(500);
  cn=await k.evaluate(()=>{renderNoteOut();return {s:signed(note()),out:(document.getElementById('noteOut')||{}).textContent||'',was:!!(note().add||[]).find(a=>a.was)};});
  ok('ADD 12 CN-1: withdrawing the signature keeps the note as first signed; signed again, the printout shows what it said then',cn.s&&cn.was&&/as first signed: /.test(cn.out),cn.out.slice(-700));
  const ct=await saveJson(k);await openJson(k,ct);
  ok('ADD 13 CN-1: Save data and Open data keep the reason and the note as first signed',(await k.evaluate(()=>S.notes.some(n=>(n.add||[]).some(a=>a.why==='Correcting an error'))&&S.notes.some(n=>(n.add||[]).some(a=>a.was)))));
  await k.close();});

 /* ---------------- OLD: saved cases open and save unchanged; print as before ---------------- */
 await sec('OLD',async()=>{
  const NEW={'CR-1':/"(tm|rec|dbRec|sgOn|add68)"\s*:/g,'DD-1':/"rec"\s*:/g,'IM-1':/"rec"\s*:/g,'CN-1':/"(rec|why|was)"\s*:/g,'TD-1':/"ad\.add68"\s*:/g,'IC-1':/"r\.add68"\s*:/g};
  for(const id of ['CR-1','DD-1','IM-1','CN-1','TD-1','IC-1']){
   const p=await open(id);await sim(p);const a=await saveJson(p);await openJson(p,a);const b=await saveJson(p);
   const neu=(a||'').match(NEW[id]);
   ok('OLD '+id+': the simulated case saves with no new keys, and opened again saves the same',!!a&&!neu&&strip(a)===strip(b),{neu,same:!!a&&!!b&&strip(a)===strip(b)});
   const pr=await printShown(p,'.add68.add68-has,.rec68,.only-tm.tm-has,#tmBriefPrint');
   ok('OLD '+id+': nothing new prints for it (no addenda, no recorded-at, no events)',pr.every(x=>!x),pr);
   await p.close();}});

 /* ---------------- PAD: the iPad ---------------- */
 await sec('PAD',async()=>{
  for(const vp of [{width:1376,height:1032,n:'sideways'},{width:1032,height:1376,n:'upright'}]){
   const ic=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:true,userAgent:L.IPAD_UA,deviceScaleFactor:1,serviceWorkers:'block'});
   /* a button: 44 px; a field: the height every field of the form has on a touch screen (the polish layer's), so the new ones match */
   const small=async(p,sel)=>p.evaluate(s=>{const field=x=>/^(INPUT|SELECT|TEXTAREA)$/.test(x.tagName);
     const base=(()=>{const f=[...document.querySelectorAll('main input:not([type=checkbox]):not([type=radio]):not([type=hidden])')].find(x=>x.offsetParent&&!x.closest('#tmSec,.add68,.add68-sign'));return f?f.getBoundingClientRect().height:38;})();
     return [...document.querySelectorAll(s)].filter(e=>e.offsetParent&&!e.disabled&&e.type!=='hidden').map(e=>{const h=e.getBoundingClientRect().height,mh=parseFloat(getComputedStyle(e).minHeight)||0;
     return {t:(e.textContent||e.id||e.getAttribute('aria-label')||'').trim().slice(0,40),h:Math.round(h),need:field(e)?Math.round(base):44,ok:field(e)?h>=base-0.5:(h>=43.5||mh>=44)};}).filter(x=>!x.ok);},sel);
   const p=await open('CR-1',ic);await sim(p);await view(p,'tm');await p.locator('#tmAddBaker').tap();await sleep(400);
   await p.evaluate(()=>{S.meta.sgOn='2026-10-01';});await view(p,'tm');
   const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));await p.screenshot({path:path.join(SHOTS,'cr1-tm-'+vp.n+'.png'),fullPage:false});
   const s=await small(p,'#tmSec button,#tmSec input,#tmSec select');
   ok('PAD CR-1 '+vp.n+': the Threat team brief view fits the screen; its buttons are 44 px and its fields as tall as the form\'s own',w.sw<=w.iw+1&&!s.length,{w,s});
   await view(p,'plan');await p.locator('[data-m="precursor"]').tap();await p.locator('[data-m="precursor"]').fill('Changed on the iPad (simulated)');await sleep(800);
   const s2=await small(p,'#cr1Add68 button,#cr1Add68 input,#cr1Add68Bar button,#crSgOn');const w2=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
   await p.screenshot({path:path.join(SHOTS,'cr1-addenda-'+vp.n+'.png')});
   ok('PAD CR-1 '+vp.n+': the addenda\'s button and the bar are 44 px, the reason box as tall as the form\'s fields, and they fit the screen',w2.sw<=w2.iw+1&&!s2.length,{w2,s2});
   await p.close();await ic.close();}});

 ok('no page errors',errs.length===0,errs.slice(0,8));
 await br.close();
 console.log((fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed')+' ('+n+' checks)');process.exit(fails?1:0);})();
