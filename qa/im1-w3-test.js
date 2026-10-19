/* v23.16 Form IM-1, the Self-Injury Trauma Scale, review Wave 3 (simulated data only).
   F450  a High estimate says what to do now (nurse, parent, CR-1, prescriber), keeps the nurse's visit and the call to the
         parent with the administration, and stays open on the workstation until both are recorded; Moderate gets its line.
   F451  a check that stopped before the examination was complete is "not estimated" in the History, the CSV and the case.
   F452  the 30-day count counts new injuries: the same wound seen healing at the next check is not counted again (I228).
   F453  each restraint on Form CR-1's log becomes a row of Restraints and Injury Reports (once); DM-1's health record fills
         the medical alerts line.
   F454  only a check that found an injury owes the report question.   F455  a date in words is read; one that cannot be read
         is not filed and is named.   F456  a tapped location has no number until one is chosen.   F457  Revised October 2026.
   I226  every completed check goes to the case as a series.   I228  new or healing, pre-filled from the last check.
   I229  the Part I healed sites outlined on the body map, and named beside the location.
   usage: node qa/im1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IM=L.BASE+'/NBH-Workstation/IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html';
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(IM);await sleep(1000);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};window.__t=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__t.push(String(m));};});
  /* a fresh case with consent, the two adults, and helpers */
  await p.evaluate(()=>{S=blank();Object.assign(S.meta,{client:'SIMULATED – Sample Student',consent:'yes',intake:MDY(addDays(new Date(),-40)),every:'3'});renderAll();
    window.__adm=(daysAgo,rows,extra)=>{S.cur=Object.assign(admBlank(),{date:MDY(addDays(new Date(),-daysAgo)),time:'08:05',examiner:'School nurse (simulated)',second:'Classroom aide (simulated)',secondRole:'Paraprofessional',present:true,assent:'yes',
      rows:rows.map(r=>Object.assign(newRow(r[0]),{n:r[1],type:r[2],sev:r[3]},r[4]?{heal:r[4]}:{})),rep:Object.assign(repBlank(),{need:'no',why:'fits the self-injury seen',on:'x'})},extra||{});renderAll();};});
  const M=await p.evaluate(()=>({mast:document.querySelector('.nbh-formmeta').textContent,ph:document.querySelector('.nbh-print-meta').textContent}));
  ok('F457 the masthead and the print head say Revised October 2026',/Revised October 2026/.test(M.mast)&&/Revised October 2026/.test(M.ph),M);

  /* ---------- F456 ---------- */
  const N=await p.evaluate(()=>{S.cur=admBlank();S.cur.date=today();renderAll();tapLoc('chest','front');const r=S.cur.rows[0];
    return {n:r.n,status:document.getElementById('imAdmStatus').textContent,mark:(document.querySelector('#imMarks-front .imMark text')||{}).textContent,verdict:document.getElementById('imPart3').textContent};});
  ok('F456 a tapped location has no number until one is chosen: the marker shows ?, the status and the Incomplete verdict say so',N.n===''&&N.mark==='?'&&/1 without a number/.test(N.status)&&/1 without a number/.test(N.verdict),N);

  /* ---------- F455 ---------- */
  const D=await p.evaluate(()=>{const f=s=>{const d=pDate(s);return d?MDY(d):null;};return {a:f('September 8, 2026'),b:f('Sept. 8 2026'),c:f('8 September 2026'),d:f('Sep 31, 2026'),e:f('next Tuesday'),g:f('9/8/2026')};});
  ok('F455 a date in words is read (September 8, 2026; Sept. 8 2026; 8 September 2026); an impossible or unreadable one is not',D.a==='9/8/2026'&&D.b==='9/8/2026'&&D.c==='9/8/2026'&&D.d===null&&D.e===null&&D.g==='9/8/2026',D);
  const D2=await p.evaluate(async()=>{__adm(1,[['hand_R','1','AL','1']]);S.cur.date='next Tuesday';const n0=S.hist.length;await saveAdm();const filed=S.hist.length>n0;
    S.events=[{date:'yesterday',kind:'Restraint',note:''}];renderAll();const sched=document.getElementById('imSched').textContent;S.events=[];renderAll();return {filed,toast:__t[__t.length-1],sched};});
  ok('F455 an administration dated "next Tuesday" is not filed and the toast says why; an event row with an unreadable date is named over the schedule',!D2.filed&&/is not a date the schedule can read/.test(D2.toast)&&/Not a date the schedule can read: event row 1 \("yesterday"\)/.test(D2.sched),D2);

  /* ---------- F450 ---------- */
  const H=await p.evaluate(async()=>{__adm(2,[['scalp','1','CT','2']]);const v={box:!document.getElementById('imHigh').hidden,text:document.getElementById('imHighV').textContent,map:document.getElementById('imHighMap').textContent,fields:document.getElementById('imHighF').style.display};
    await saveAdm();const id=S.cur.id;v.open1=window.__nbhFactsOut().injury.open.map(x=>x.what).filter(t=>/^High estimate/.test(t));v.hist1=document.getElementById('imHist').textContent;
    const set=(k,val)=>{const e=document.querySelector('#imHigh [data-a="'+k+'"]');e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('nurseSaw','School nurse (simulated), 8:20');set('parentTold','By phone, 9:10 (simulated)');await new Promise(r=>setTimeout(r,350));v.kept=document.querySelector('#imHigh [data-a="nurseSaw"]').value;
    await saveAdm();v.open2=window.__nbhFactsOut().injury.open.map(x=>x.what).filter(t=>/^High estimate/.test(t));v.hist2=document.getElementById('imHist').textContent;v.same=S.cur.id===id;return v;});
  ok('F450 a High estimate (CT-2 on the scalp) says at once: immediate medical attention, the nurse now, the parent today, CR-1 and the prescriber, on the Scoring and the Body map pages, with two fields',
    H.box&&/^High estimate \(Iwata et al\., 1990\): immediate medical attention\. The school nurse sees the student now, and the parent or guardian is told today/.test(H.text)&&/Form CR-1/.test(H.text)&&/prescriber/.test(H.text)&&/Record it on the Scoring page/.test(H.map)&&H.fields==='',H);
  ok('F450 filed without them it is open on the workstation and marked in the History; with the nurse and the parent recorded it closes and the History says who',
    H.open1.length===1&&/record that the school nurse saw the student and the parent or guardian was told/.test(H.open1[0])&&/High estimate: the nurse’s visit and telling the parent are not yet recorded/.test(H.hist1)&&H.kept==='School nurse (simulated), 8:20'&&!H.open2.length&&/High: nurse saw the student: School nurse \(simulated\), 8:20; parent or guardian told: By phone, 9:10 \(simulated\)/.test(H.hist2)&&H.same,H);
  const Mo=await p.evaluate(()=>{__adm(0,[['larm_L','1','CT','2']]);return {t:document.getElementById('imHighV').textContent,f:document.getElementById('imHighF').style.display,box:!document.getElementById('imHigh').hidden};});
  ok('F450 a Moderate estimate gets the paper\'s softer line and no fields',Mo.box&&/^Moderate estimate \(Iwata et al\., 1990\): medical attention as needed, and periodic monitoring/.test(Mo.t)&&Mo.f==='none',Mo);

  /* ---------- F451, F454 ---------- */
  const ST=await p.evaluate(async()=>{__adm(0,[],{assent:'stopped',note:'The student pulled away at the first sleeve (simulated).'});S.cur.rep=repBlank();await saveAdm();
    const tr=[...document.querySelectorAll('#imHist tbody tr')].find(t=>/Check stopped/.test(t.textContent));const c=tr?[...tr.cells].map(x=>x.textContent):[];
    const o=window.__nbhFactsOut().injury;return {risk:c[7],ni:c[4],si:c[5],latest:o.latest,open:o.open.map(x=>x.what)};});
  ok('F451 a check that stopped with nothing examined: the History says "not estimated" with no NI or SI, and the case\'s latest is the last completed check',ST.risk==='not estimated'&&ST.ni==='–'&&ST.si==='–'&&ST.latest&&ST.latest.sites===1,ST);
  ok('F454 a check that found no injury (here, the stopped one) does not raise the report question on the workstation',!ST.open.some(t=>/Answer the report question/.test(t)),ST.open);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=fs.readFileSync(await dl.path(),'utf8');
  const stopRow=csv.split('\n').find(l=>/\(check stopped\)/.test(l))||'';
  ok('F451 in the CSV the stopped check has no risk and says why; F450 the High columns are there',/"","the check stopped before the examination was complete: not estimated"/.test(stopRow)&&/"Nurse saw the student \(High estimate\)"/.test(csv)&&/"New or healing"/.test(csv),stopRow);

  /* ---------- F452, I228 ---------- */
  const NW=await p.evaluate(async()=>{S.hist=[];S.cur=admBlank();renderAll();
    __adm(20,[['hand_R','1','AL','1','new']]);await saveAdm();
    S.cur=Object.assign(admBlank(),{date:MDY(addDays(new Date(),-10)),examiner:'School nurse (simulated)',second:'Classroom aide (simulated)',secondRole:'Paraprofessional',present:true,assent:'yes'});renderAll();tapLoc('hand_R');const pre=S.cur.rows[0].heal;
    Object.assign(S.cur.rows[0],{n:'1',type:'AL',sev:'1'});S.cur.rep=Object.assign(repBlank(),{need:'no',why:'x',on:'x'});await saveAdm();
    __adm(1,[['hand_R','1','AL','1','healing']]);await saveAdm();
    const o=window.__nbhFactsOut().injury;return {pre,count30:o.count30,newSites30:o.newSites30,series:o.series&&o.series.length,hist:[...document.querySelectorAll('#imHist tbody tr')].map(t=>t.cells[6].textContent)};});
  ok('I228 a location injured at the last check starts as "same wound, healing"',NW.pre==='healing',NW);
  ok('F452 the same hand wound seen at three checks in 30 days counts once, not three times; the History says new or healing; I226 the case gets the series',NW.count30===1&&NW.newSites30===1&&NW.series===3&&/1 new, 0 healing/.test(NW.hist[0])&&/0 new, 1 healing/.test(NW.hist[2]),NW);

  /* ---------- F453 ---------- */
  const CR=await p.evaluate(()=>{S.events=[];S.meta.medical='';S.meta.crDone='';renderAll();
    const f={crisis:{deadlines:[{kind:'rep',what:'Incident report within 24 hours of the release (restraint on 10/14)',event:'2026-10-14'},{kind:'wn',what:'Written notice (restraint on 10/14)',event:'2026-10-14'},{kind:'rep',what:'Incident report within 24 hours of the release (seclusion on 10/2)',event:'2026-10-02'}]},
      profile:{health:{meds:[{name:'Risperidone',dose:'0.5 mg'}],conditions:'asthma (simulated)',allergies:'latex.'}}};
    const r=window.__nbhFactsIn(f);const a={r,ev:S.events.map(e=>e.date+' '+e.kind+' '+e.note),med:S.meta.medical,sched:document.getElementById('imSched').textContent};
    S.events=S.events.filter(e=>e.kind!=='Restraint');renderAll();window.__nbhFactsIn(f);a.after=S.events.length;return a;});
  ok('F453 a restraint and a seclusion on Form CR-1\'s log become rows (once each), the post-restraint check is scheduled, the medical alerts come from DM-1, and a row deleted by hand does not come back',
    CR.ev.join('|')==='10/14/2026 Restraint Restraint on the log of Form CR-1|10/2/2026 Other Seclusion on the log of Form CR-1'&&/SIT Scale after the restraint of 10\/14\/2026/.test(CR.sched)&&CR.med==='Medications: Risperidone 0.5 mg. Health conditions: asthma (simulated). Allergies: latex (Form DM-1)'&&CR.after===1&&CR.r.filled>=3&&/restraints from Form CR-1/.test(CR.r.note),CR);

  /* ---------- I229 ---------- */
  const HL=await p.evaluate(()=>{S.healed=[{loc:'scalp',ev:'Scar',note:'2 cm above the right ear (simulated)'}];__adm(0,[['scalp','1','CT','1']]);SEL='scalp';renderCur();
    return {cls:[...document.querySelectorAll('#imMaps path[data-loc="scalp"]')].some(p=>p.classList.contains('healed')),side:document.getElementById('imSide').textContent};});
  ok('I229 a healed site from Part I is outlined on the body map and named beside the location',HL.cls&&/Healed \(Part I\): Scar: 2 cm above the right ear \(simulated\)\. Do not score it as a current injury\./.test(HL.side),HL);

  /* ---------- save and open ---------- */
  const RT=await p.evaluate(async()=>{const a=JSON.stringify(S);const open=async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));};
    await open(JSON.stringify({form:'IM-1',rev:'2026-10',S:JSON.parse(a)}));const same=JSON.stringify(S.hist)===JSON.stringify(JSON.parse(a).hist);
    const old=JSON.parse(a);old.hist.forEach(h=>{delete h.nurseSaw;delete h.parentTold;h.rows.forEach(r=>delete r.heal);});await open(JSON.stringify({form:'IM-1',rev:'2026-10',S:old}));
    return {same,oldOk:S.hist.length===old.hist.length&&S.hist.every(h=>h.nurseSaw===''&&h.rows.every(r=>r.heal===''))};});
  ok('save and open keep the new fields; a file from before opens with them empty',RT.same&&RT.oldOk,RT);

  /* ---------- the simulation ---------- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const SIM=await p.evaluate(()=>{const o=window.__nbhFactsOut().injury;return {open:o.open.map(x=>x.what),hist:document.getElementById('imHist').textContent,series:(o.series||[]).map(x=>x.risk).join(',')};});
  ok('the worked example: the intake\'s High estimate was followed (the nurse at once, the parent the same morning), nothing about it is open; the series runs High, Moderate, Low',!SIM.open.some(t=>/^High estimate/.test(t))&&/High: nurse saw the student: School nurse \(simulated\), at once/.test(SIM.hist)&&SIM.series==='High,Moderate,Low',SIM);

  /* ---------- printed pages ---------- */
  const out=path.join(os.tmpdir(),'im1w3');fs.mkdirSync(out,{recursive:true});
  const pr=async(sim,file)=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push('print: '+e.message));await q.goto(IM);await sleep(900);
    await q.evaluate(async s=>{nbhUI.confirm=async()=>true;window.print=()=>{};if(s){document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,900));}},sim);
    await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,file),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();return pages(path.join(out,file));};
  const pb=await pr(false,'blank.pdf'),ps=await pr(true,'sim.pdf');
  ok('the printed pages: blank 10, the worked example 13 (as before Wave 3)',pb===10&&ps===13,{pb,ps});
  ok('no page errors',!errs.length,errs.slice(0,3));
 }catch(e){console.error(e);fails++;}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
