/* v25.65 parcel SAFETY: the approved changes of the 11/2 review against the JABA safety, caregiver and feeding research, in
   Forms CR-1, IM-1, MS-1, RR-1, IC-1 and HD-1 (SAFETY-H1 to H8, M1 to M10, L1 to L5; CARE-H7, H8, M5, M6, M7, M10, M11, L1, L4;
   FEED-M2), and the BCBA's request for photos of the injuries on IM-1's body map (checks 13a to 13g, simulated squares only). One check or more for each. Files saved before v25.65 keep opening and printing as before. Simulated people only.
   usage: node qa/v2565-safety-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const F={CR:'CR-1_Crisis-Intervention-Plan_v2026-09.html',IM:'IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html',MS:'MS-1_Medication-Side-Effect-Monitoring_v2026-09.html',
  RR:'RR-1_Records-Review_v2026-09.html',IC:'IC-1_Informed-Consent-FBA-BIP_v2026-09.html',HD:'HD-1_Home-Data-Sheets_v2026-10.html'};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async(id,file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});return p;};
  const sim=async p=>{await p.evaluate(()=>{const b=document.querySelector('#simBtn');if(b)b.click();});await sleep(1300);};
  const view=(p,v)=>p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);
  const txt=(p,id)=>p.evaluate(id=>{const e=document.getElementById(id);return e?e.innerText:'(missing #'+id+')';},id);
  const loadFile=async(p,obj,name)=>{await p.setInputFiles('#fileIn',{name:name||'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});await sleep(900);};
  /* a value typed as a person would: input and change */
  const put=(p,sel,v)=>p.evaluate(([sel,v])=>{const e=document.querySelector(sel);if(!e)return false;if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,v]);

  /* ================= CR-1 ================= */
  let p=await open('CR-1',F.CR);await sim(p);await view(p,'log');await sleep(300);
  let t=await txt(p,'v65LogFlag');
  ok('1 SAFETY-H1 the log records what each restraint led to and flags the pattern: 2 of 3 followed by the task removed prints the review line',/Restraint in this record is often followed by escape from the task or by adult attention\. The emergency procedure may be adding to the behavior\. Review the FBA \(Form FS-1\) and the BIP \(Form TD-1\)\./.test(t)&&/2 of the 3/.test(t),t);
  ok('2 SAFETY-H1 an injury opens an IM-1 check; the duration is in seconds, read from the times or the old Duration column',/injury is recorded for restraint 2.*Form IM-1/.test(t)&&await p.evaluate(()=>/22/.test(document.querySelector('[data-v65src="1"]').textContent+document.querySelector('#v65LogTbl input[data-l="1"][data-f="durS"]').placeholder)&&document.querySelectorAll('#v65LogTbl select[data-l="0"][data-f="aft"] option').length===7),t);
  t=await txt(p,'v65Graph');
  ok('3 SAFETY-H2 the log draws restraints per period against the goal, with the per-10-days count, a decision line and the caution',await p.evaluate(()=>!!document.querySelector('#v65Graph svg rect'))&&/per 10 school days attended/.test(t)&&/(On track|Above goal|Above the goal line)/.test(t)&&/One restraint more or less is common variation\. Judge the trend over several weeks, not a single week\./.test(t),t.slice(0,400));
  await put(p,'[data-m="bipRevs"]','8/1/26');await sleep(200);t=await txt(p,'v65Graph');
  ok('4 SAFETY-H2 a BIP last revised before the second restraint prints "BIP not revised since the second restraint"',/BIP not revised since the second restraint/.test(t),t.slice(0,300));
  await view(p,'plan');await sleep(200);t=await txt(p,'v65PrecVerdict');
  ok('5 SAFETY-H3 each precursor has its evidence; interview only shows amber with the caregiver caution, and the heart-rate line prints',/found by interview only.*Caregivers may miss precursors or name the wrong ones\. Confirm with ABC-1 before the plan relies on it\./.test(t)&&await p.evaluate(()=>/Heart-rate monitors are not a reliable signal of escalation; use observable precursors/.test(document.querySelector('.only-plan').innerText)&&!!document.querySelector('[data-m="precursor"]')),t);
  t=await p.evaluate(()=>[...document.querySelectorAll('[data-v65fnh]')].map(e=>e.textContent).join('|'));
  ok('6 SAFETY-H4 the Early precursor row shows the function and the communication response; unticking the step shows amber',/Function: Escape from written work.*Teach: Hand the break card/.test(t),t);
  await put(p,'[data-mc="earlyFits"]',false);await sleep(200);t=await txt(p,'v65EarlyVerdict');
  ok('7 SAFETY-H4 the unticked step reads as not yet giving a way to get what the behavior gets',/not yet marked as giving the student a way to get what the behavior gets/.test(t),t);
  t=await txt(p,'v65Safe');
  ok('8 SAFETY-H5 the safety steps that are not restraint start ticked on a new record, with the never-grasp rule, and an adult without a rehearsal shows amber',/Never grasp or hold a body part\. Check the district.s definition of restraint before using any contact\./.test(t)&&await p.evaluate(()=>[...document.querySelectorAll('[data-v65t]')].every(e=>e.checked))&&/No rehearsal date is recorded for: Both adults/.test(t),t.slice(-400));
  await put(p,'[data-mc="trig4"]',true);await put(p,'[data-m="trig4d"]','2099-01-05');await sleep(200);t=await txt(p,'v65Watch');
  ok('9 SAFETY-M1 a ticked trigger newer than the last review puts a review due within 5 school days and a heightened-watch line on the plan',/Heightened watch: precursors may return; the early stages apply in full\./.test(t)&&await p.evaluate(()=>document.querySelector('[data-m="revTrigDue"]').value==='2099-01-12'),t);
  ok('10 SAFETY-M1 the review due date reaches the workstation\'s due list',await p.evaluate(()=>JSON.stringify(window.nbhCase&&nbhCase.due?nbhCase.due():[]).includes('2099-01-12')));
  t=await p.evaluate(()=>{const s=document.querySelector('#pbisTbl select[data-p="0"][data-f="s"]'),w=document.querySelector('#pbisTbl input[data-p="0"][data-f="who"]');w.value='';w.dispatchEvent(new Event('input',{bubbles:true}));s.value='Recovery';s.dispatchEvent(new Event('change',{bubbles:true}));return w.value+'|'+!!document.querySelector('[data-m="dbRebuild"]')+'|'+DB_KEYS.includes('dbRebuild');});
  ok('11 SAFETY-L5 Recovery is led by an adult who was not part of the hold, and the debriefing asks how trust is rebuilt',t==='An adult who was not part of the hold|true|true',t);
  /* an old file opens as before: no new parts, the safety steps not ticked */
  await loadFile(p,{form:'CR-1',rev:'2026-09',S:{meta:{client:'SIM old',date:'9/1/26',dbeh:'Hitting'},team:[],pbis:[{s:'Prevention (before any sign)',do:'Timer',next:'',who:'Teacher'}],act:[],log:[{d:'9/2/26',dur:'20 s',set:'Room 4',staff:'Aide A',rep:'Yes',deb:'Yes',pre:'Demand'}],notify:{},closed:[]}});
  t=await p.evaluate(()=>({tick:[...document.querySelectorAll('[data-v65t]')].some(e=>e.checked),dur:document.querySelector('#v65LogTbl input[data-l="0"][data-f="durS"]').placeholder,beh:S.meta.dbeh,bip:typeof bipText==='function'?'':''}));
  ok('12 CR-1 a file saved before v25.65 opens as before: its safety steps are not ticked, and its "20 s" reads as 20 seconds',!t.tick&&t.dur==='20'&&t.beh==='Hitting',t);
  await p.close();

  /* ================= IM-1 ================= */
  p=await open('IM-1',F.IM);await sim(p);await view(p,'setup');await sleep(200);
  await put(p,'[data-m="peType"]','helmet');await put(p,'[data-m="peSite"]','head');await sleep(500);await view(p,'scoring');await sleep(300);
  t=await txt(p,'v65MaskCur');
  ok('13 SAFETY-H6 equipment with a Low estimate prints that low trauma may reflect it, and a covered site prompts other sites',/Low trauma here may reflect the equipment or self-restraint, not low risk\. Read with the healed injuries in Part I and the behavior rate\./.test(t)&&/check other sites for new injury/.test(t),t);
  ok('14 SAFETY-H6 Part I records self-restraint and equipment, each administration its equipment hours, with the restrictive caution and a changes log',await p.evaluate(()=>!!document.querySelector('[data-m="srObs"]')&&!!document.querySelector('[data-a="peWorn"]')&&!!document.querySelector('[data-a="srSeen"]')&&!!document.querySelector('#v65PeTbl')&&/Putting equipment on as a consequence for self-injury is a restrictive procedure that needs approval, and it is never the default\./.test(document.querySelector('.only-setup').innerText)));
  await view(p,'history');await sleep(300);
  ok('15 SAFETY-M2 the self-injury rate (Form DD-1) is drawn under each administration with the caption',await p.evaluate(()=>document.querySelectorAll('#v65Plot2 rect').length>=3&&/Judge treatment by the behavior rate; use the trauma scores for follow-up\./.test(document.querySelector('.only-history').innerText)));
  t=await p.evaluate(()=>{S.ddRate.days.forEach(d=>{d.v=0;});S.hist[2].rows.forEach(r=>{r.heal='new';});v65Update();return document.getElementById('v65RateV').innerText;});
  ok('16 SAFETY-M2 injuries found while the reported rate is near zero ask for a check on the reports',/Injuries were found while the reported rate was near zero/.test(t),t);
  await view(p,'setup');await put(p,'[data-m="every"]','');await put(p,'[data-m="fsSub"]','2');await sleep(500);t=await txt(p,'v65SubV');
  ok('17 SAFETY-M3 Subtype 2 prints what it means for injury and sets a shorter re-examination interval, which stays editable',/Injuries tend to be more frequent and more severe, and reinforcement alone rarely works\./.test(t)&&await p.evaluate(()=>S.meta.every==='2'),t);
  t=await p.evaluate(()=>document.querySelector('#v65AttTbl').innerText);
  ok('18 SAFETY-M4 injury records are shown per 10 school days attended, with restraint-linked injuries apart',/Per 10 school days/.test(t)&&/Linked to a restraint/.test(t)&&/(September|October|November) 20\d\d/.test(t),t.slice(0,300));
  t=await p.evaluate(()=>{S.cur.wsL='2';S.cur.wsW='1.5';v65Update();return document.getElementById('v65WsV').innerText+'|'+!!document.querySelector('[data-a="wsHow"]');});
  ok('19 SAFETY-L1 an optional index wound size gives its area, measured by ruler or by photo where IC-1 allows',/3 cm/.test(t)&&/\|true$/.test(t),t);
  await loadFile(p,{form:'IM-1',rev:'2026-10',S:{meta:{client:'SIM old',beh:'Head hitting',intake:'9/1/2026'},chk:{t_head:true},healed:[],events:[],cur:{date:'9/1/2026',rows:[]},hist:[{id:'a1',date:'9/1/2026',examiner:'Nurse',second:'Aide',present:true,assent:'yes',rows:[]}],nurse:[],care:[]}});
  t=await p.evaluate(()=>({beh:S.meta.beh,n:S.hist.length,pe:S.peLog.length,rate:S.ddRate}));
  ok('20 IM-1 a file saved before v25.65 opens with its administrations, and no equipment or rate',t.beh==='Head hitting'&&t.n===1&&t.pe===0&&t.rate===null,t);
  await p.close();

  /* ================= IM-1 photos (v25.65 IM-1 photos, the BCBA's request) ================= */
  /* a generated colored square, never a real photo */
  const square=async(pg,color,w,h)=>Buffer.from(await pg.evaluate(([c,w,h])=>{const k=document.createElement('canvas');k.width=w;k.height=h;const x=k.getContext('2d');x.fillStyle=c;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(w/4,h/4,w/2,h/8);return k.toDataURL('image/png').split(',')[1];},[color,w,h]),'base64');
  const addPhoto=async(pg,fr,i,buf)=>{const fc=pg.waitForEvent('filechooser',{timeout:8000});await fr.evaluate(i=>document.querySelector('[data-v65phadd="'+i+'"]').click(),i);const c=await fc;await c.setFiles({name:'square.png',mimeType:'image/png',buffer:buf});await sleep(1500);};
  p=await open('IM-1',F.IM);await view(p,'map');
  await p.evaluate(()=>{window.__wc=0;window.confirm=()=>{window.__wc++;return false;};addLoc('larm_L');});await sleep(300);
  t=await p.evaluate(()=>{document.querySelector('[data-v65phadd="0"]').click();const a=document.getElementById('v65PhGate').textContent;
    const s=document.getElementById('v65PhCons');s.value='no';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-v65phadd="0"]').click();
    return [a,document.getElementById('v65PhGate').textContent,document.querySelectorAll('#v65PhList img').length,[...document.getElementById('v65PhCons').options].map(o=>o.text).join('|'),document.querySelector('.v65ph-safe').textContent].join('\n');});
  ok('13a IM-1 photos: Add photo works only with a Yes to "Consent to photograph injuries", and says why; the safeguarding line is beside it',/until "Consent to photograph injuries" is answered Yes/.test(t)&&/the answer to "Consent to photograph injuries" is No/.test(t)&&/\n0\n/.test(t)&&/\|Yes, on Form IC-1\|Yes, other written consent\|No/.test(t)&&/Photos do not replace the nurse.s check or a mandated report\. For an injury that is unexplained or suspicious, follow the school.s or agency.s reporting procedure, including who may take photos, before photographing\./.test(t),t);
  await put(p,'#v65PhCons','ic1');await put(p,'#v65PhBy','RN');
  await addPhoto(p,p,0,await square(p,'#3a7bd5',2400,1200));
  t=await p.evaluate(()=>{const r=S.cur.rows[0],ph=(r.photos||[])[0]||{},im=document.querySelector('#v65PhList .v65ph-th img'),b=document.querySelector('#v65PhList .v65ph-th');
    return {n:(r.photos||[]).length,ref:nbhMedia.isRef(ph.ref),mime:(nbhMedia.parse(ph.ref)||{}).mime,by:ph.by,at:/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(ph.at),alt:im&&im.alt,w:im&&im.naturalWidth,h:im&&im.naturalHeight,box:b&&[b.offsetWidth,b.offsetHeight],add:document.querySelector('[data-v65phadd="0"]').offsetHeight,
      facts:JSON.stringify(window.__nbhFactsOut()||{}).search(/photo|nbh-media|data:image/i)};});
  ok('13b a photo added appears as a thumbnail named by its site and date, shrunk to 1600 px as a JPEG in the media store, with who took it; targets are 44 px; nothing goes into the case facts',t.n===1&&t.ref&&t.mime==='image/jpeg'&&t.by==='RN'&&t.at&&/^Photo of Lower arm\/wrist \(L\), \d+\/\d+\/\d{4} \d+:\d\d (am|pm)$/.test(t.alt||'')&&t.w===1600&&t.h===800&&t.box[0]>=44&&t.box[1]>=44&&t.add>=44&&t.facts<0,t);
  /* print: off by default, then on */
  await p.emulateMedia({media:'print'});
  t=await p.evaluate(()=>({on:document.getElementById('v65PhPrintOn').checked,shown:getComputedStyle(document.getElementById('v65PhPrint')).display,imgs:[...document.querySelectorAll('img')].filter(i=>i.offsetParent&&/^blob:|^data:image\/jpeg/.test(i.src)).length}));
  const pOff=t;await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>{const c=document.getElementById('v65PhPrintOn');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.emulateMedia({media:'print'});await sleep(200);
  t=await p.evaluate(()=>{const P=document.getElementById('v65PhPrint');return {shown:getComputedStyle(P).display,figs:P.querySelectorAll('figure img').length,txt:P.innerText,cols:getComputedStyle(P.querySelector('.v65ph-grid')).gridTemplateColumns.split(' ').length};});
  await p.emulateMedia({media:'screen'});
  ok('13c print: the photos are left out by default, and with "Include the photos when printing" a Photos section prints each one with its site, date and time, who took it and the consent, two to a row',!pOff.on&&pOff.shown==='none'&&pOff.imgs===0&&t.shown==='block'&&t.figs===1&&/^Photos/.test(t.txt)&&/Lower arm\/wrist \(L\)/.test(t.txt)&&/taken by RN/.test(t.txt)&&/Photographed with consent: Yes, on Form IC-1/.test(t.txt)&&t.cols===2,{pOff,t});
  /* the IM-1 file: saved and opened again */
  let dl=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('saveBtn').click());let ftxt=require('fs').readFileSync(await (await dl).path(),'utf8');
  await p.evaluate(()=>{S=blank();renderAll();});await loadFile(p,JSON.parse(ftxt),'im1.json');await view(p,'map');await sleep(1200);
  t=await p.evaluate(()=>{const im=document.querySelector('#v65PhList .v65ph-th img');return {n:(S.cur.rows[0].photos||[]).length,w:im&&im.naturalWidth,cons:S.meta.photoConsent,len:JSON.stringify(S).length};});
  ok('13d the IM-1 file holds the reference and the details only, and opens again with the thumbnail',/"photos":\s*\[\s*\{\s*"ref":\s*"nbh-media:/.test(ftxt)&&!/data:image\/jpeg/.test(ftxt)&&t.n===1&&t.w===1600&&t.cons==='ic1',t);
  /* delete, asked in the page */
  await p.evaluate(()=>document.querySelector('#v65PhList .v65ph-th').click());await sleep(200);
  t=await p.evaluate(()=>({open:document.getElementById('v65PhDlg').open,big:document.getElementById('v65PhBig').naturalWidth,meta:document.getElementById('v65PhDMeta').textContent}));
  await p.evaluate(()=>{window.__nc=0;const c=nbhUI.confirm;nbhUI.confirm=async(...a)=>{window.__nc++;return true;};document.getElementById('v65PhDel').click();});await sleep(400);
  const del=await p.evaluate(()=>({n:(S.cur.rows[0].photos||[]).length,thumbs:document.querySelectorAll('#v65PhList .v65ph-th').length,nc:window.__nc,wc:window.__wc,open:document.getElementById('v65PhDlg').open}));
  ok('13e a tap on the thumbnail shows the photo large with its details; Delete asks in the page (never the browser) and removes it',t.open&&t.big===1600&&/Photographed with consent: Yes, on Form IC-1/.test(t.meta)&&del.n===0&&del.thumbs===0&&del.nc===1&&del.wc===0&&!del.open,{t,del});
  /* an IM-1 file saved before v25.65 opens unchanged */
  const OLD={form:'IM-1',rev:'2026-10',S:{meta:{client:'SIM old',beh:'Head hitting'},chk:{},healed:[],events:[],cur:{date:'9/1/2026',rows:[{loc:'larm_L',n:'1',type:'AL',sev:'1',kind:'bite',note:'',how:'',view:'front',x:160,y:221,heal:'new'}]},hist:[],nurse:[],care:[]}};
  await loadFile(p,OLD,'old.json');await sleep(300);
  t=await p.evaluate(()=>({row:JSON.stringify(S.cur.rows[0]),cons:S.meta.photoConsent,list:document.getElementById('v65PhList').innerText,print:document.getElementById('v65PhPrint').innerHTML}));
  ok('13f an IM-1 file saved before v25.65 opens unchanged: its row as saved, no photos, no consent answer, nothing added to the print',t.row==='{"loc":"larm_L","n":"1","type":"AL","sev":"1","kind":"bite","note":"","how":"","view":"front","x":160,"y":221,"heal":"new"}'&&t.cons===undefined&&/Add photo/.test(t.list)&&t.print==='',t);
  await p.close();
  /* the case: a photo in IM-1 survives Save case and opening the case file */
  {const w=await ctx.newPage();w.on('pageerror',e=>errs.push('shell: '+e.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
   await w.evaluate(()=>{window.confirm=()=>true;wsUI.confirm=async()=>true;wsUI.prompt=async()=>'';});
   await w.evaluate(()=>{const c=document.getElementById('pClient');c.value='SIMULATED – Photo Student';c.dispatchEvent(new Event('input'));});
   await w.evaluate(()=>openForm('IM-1'));await w.waitForFunction(()=>!!state.frames['IM-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
   const fr=()=>w.frames().find(f=>f!==w.mainFrame()&&!!f.parentFrame()&&/IM-1|srcdoc|about/.test(f.url()+f.name())&&f.url()!=='about:blank'||false)||w.frames().find(f=>f!==w.mainFrame());
   const imf=async()=>{for(const f of w.frames()){if(f===w.mainFrame())continue;try{if(await f.evaluate(()=>!!document.getElementById('v65PhList')))return f;}catch(e){}}return null;};
   let f1=await imf();
   await f1.evaluate(()=>{nbhUI.confirm=async()=>true;setView('map');addLoc('hand_R');const s=document.getElementById('v65PhCons');s.value='other';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
     const b=document.getElementById('v65PhBy');b.value='TP';b.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
   await addPhoto(w,f1,0,await square(w,'#d53a7b',300,300));await sleep(5500);
   const dP=w.waitForEvent('download',{timeout:20000}).catch(()=>null);await w.evaluate(()=>{saveCase();});const d=await dP;const ctxt=d?require('fs').readFileSync(await d.path(),'utf8'):'';
   await w.evaluate(async t=>{await clearCase();await openCaseText(t,null,{asked:true,quiet:true});},ctxt);await sleep(2500);
   await w.evaluate(()=>openForm('IM-1'));await sleep(3500);f1=await imf();
   t=f1?await f1.evaluate(async()=>{setView('map');await new Promise(r=>setTimeout(r,800));const im=document.querySelector('#v65PhList .v65ph-th img');return {n:((S.cur.rows.find(r=>r.loc==='hand_R')||{}).photos||[]).length,w:im&&im.naturalWidth,by:(((S.cur.rows.find(r=>r.loc==='hand_R')||{}).photos||[])[0]||{}).by,cons:S.meta.photoConsent};}):null;
   ok('13g the case: Save case writes the photo into the case file, and the case opened from that file shows it again',ctxt.length>0&&/data:image\/jpeg;base64,/.test(ctxt)&&t&&t.n===1&&t.w===300&&t.by==='TP'&&t.cons==='other',{len:ctxt.length,t});
   await w.close();}

  /* ================= MS-1 ================= */
  p=await open('MS-1',F.MS);await sim(p);
  await p.evaluate(()=>{const S=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    const days=[];for(let k=0;k<20;k++){const d=new Date(2026,9,1+k,12);if(d.getDay()%6)days.push({d:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),v:k<9?6:3});}
    S('x.dd',JSON.stringify({name:'Aggression',unit:'count',days}));S('dc[0].d','10/12/2026');S('dc[0].med','Risperidone');S('dc[0].old','0.5 mg');S('dc[0].new','1 mg');S('dc[1].d','10/2/2026');S('dc[1].med','Risperidone');S('dc[1].new','0.5 mg');S('x.minDays','10');S('x.blind','no');S('x.verBy','nurse log');});
  await view(p,'report');await sleep(400);t=await txt(p,'v65Rp');
  ok('21 SAFETY-H7 the report graphs the BIP target\'s own count by school day with a line at each dose change and the phase means',await p.evaluate(()=>!!document.querySelector('#v65Rp svg path'))&&/After Risperidone 0\.5 mg to 1 mg/.test(t)&&/Do not judge a change in less than 10 school days \(the prescriber sets this\)/.test(t),t.slice(0,500));
  ok('22 SAFETY-H7 a change with fewer than 5 school days of data before it shows "No baseline before this change"',/No baseline before this change/.test(t)&&/No baseline before this change/.test(await p.evaluate(()=>document.querySelector('.v65base[data-dc="1"]').innerText)),t.slice(0,300));
  await view(p,'brief');await sleep(300);t=await txt(p,'briefBody');
  ok('23 SAFETY-M5 with the raters not told, the brief says so and hides the dates; the nurse and the BCBA always know; doses verified by the nurse log',/dates of dose changes are not given to raters\. The nurse and the BCBA always know\. Red-flag rules apply in full\./.test(t)&&!/10\/12\/2026/.test(t)&&/verified by nurse log/.test(t)&&await p.evaluate(()=>/A school does not give placebo\. Only the observer.s knowledge of the change date is masked\./.test(document.getElementById('v65BlindV').innerText)),t.slice(-400));
  await put(p,'[name="x.rowEng"]',true);await view(p,'report');await sleep(300);t=await txt(p,'v65Rp');
  ok('24 SAFETY-M6 an engagement row joins the grid, and the report warns of a general slowing',/A drop in problem behavior with a drop in these rows may reflect a general slowing, not a specific effect\./.test(t)&&await p.evaluate(()=>!!document.querySelector('#grid .cell[data-key="_eng"]')),t.slice(-600));
  ok('25 SAFETY-L2 the report prints the reading aid on usual effect sizes and on re-checking the function',/reductions were usually small to moderate, and larger when baseline rates were higher/.test(t)&&/ask the BCBA to re-check the function \(Form FS-1\)/.test(t));
  t=await p.evaluate(()=>{const S=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};const d=new Date();d.setDate(d.getDate()-3);S('dc[2].d',(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear());S('dc[2].med','Guanfacine');return JSON.stringify(window.__nbhDue());});
  ok('26 SAFETY-L3 a dose change puts a preference check (Form PA-1) on the due list within two weeks',/Re-check preferences after the dose change \(PA-1\)/.test(t),t);
  await view(p,'report');await sleep(300);t=await txt(p,'v65Rp');
  ok('27 SAFETY-L4 the report gives the hours from the dose to the worst period for each rated item',/worst about [\d.]+ h after the .* dose, \d+ of \d+ days rated/.test(t),t.slice(-700));
  ok('28 SAFETY-M10 (MS-1) each dose change shows the school days of target data before it',/school days/.test(await p.evaluate(()=>document.querySelector('.v65base[data-dc="0"]').innerText)));
  await loadFile(p,{form:'MS-1',rev:'2026-09',counts:{med:2,days:14,vit:8},cells:{'_bip|0':2,'_dose|0':3},fields:{'m.client':'SIM old','m.bip':'Aggression'}});
  t=await p.evaluate(()=>({c:document.querySelector('[name="m.client"]').value,dc:document.querySelector('[name="dc[0].d"]').value,bip:[...document.querySelectorAll('#grid .rowlab')].some(e=>/Aggression/.test(e.textContent))}));
  ok('29 MS-1 a file saved before v25.65 opens as before, its BIP 0-3 row still on the grid',t.c==='SIM old'&&t.dc===''&&t.bip,t);
  await p.close();

  /* ================= RR-1 ================= */
  p=await open('RR-1',F.RR);await sim(p);
  await p.evaluate(()=>{const S=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    const inc=[...document.querySelectorAll('[name^="ic["][name$="].d"]')].map(e=>e.value).filter(Boolean);
    inc.slice(0,3).forEach((d,k)=>{S('ev['+(5+k)+'].d',d);S('ev['+(5+k)+'].t','Sleep problem noted');});
    S('md[0].chg',inc[4]);S('md[0].bd','yes');S('md[0].bdsrc','referral log');S('md[0].oth','none');S('c.rEsc','4');S('c.rOf','5');S('c.pe','helmet 2024');S('c.sr','sits on hands');S('y.suff','yes');S('f[0].d','2023-01-10');});
  await sleep(500);await view(p,'health');await sleep(300);t=await txt(p,'v65EvCmp');
  ok('30 SAFETY-H8 a type with 3 dated days compares incidents per school day on event days with all other school days, as a question with a notebook line',/Sleep problem noted/.test(t)&&/Incidents per school day on event days/.test(t)&&/A question for the interviews \(IA-1\) and the observation \(ABC-1\), not a finding/.test(t)&&/Can the parent note this event each morning\?/.test(t),t.slice(0,500));
  ok('31 SAFETY-H8 the event types the research names are offered, each with a definition box',await p.evaluate(()=>{const o=[...document.querySelector('[name="ev[0].t"]').options].map(x=>x.text);return ['Allergy symptoms','Ear infection or pain','Missed dose','Late waking or a changed route to school'].every(x=>o.includes(x))&&o.some(x=>/^Menstrual period/.test(x))&&document.querySelectorAll('#v65EvDef input').length>=14;}));
  t=await p.evaluate(()=>[document.querySelector('[name="b[0].agree"] option[value="high"]').textContent,document.querySelector('.v65fixed').innerText,JSON.stringify(((window.__nbhFactsOut()||{}).records||{}).hypotheses||[])].join('\n'));
  ok('32 SAFETY-M7 the top agreement choice is still a hypothesis, the fixed line sits under the tally, and the rating goes out only as a records-based hypothesis',/^Consistent across records \(still a hypothesis\)/.test(t)&&/The consequence recorded most often matched the function in a minority of cases studied\. Attention follows most problem behavior whatever its function\./.test(t)&&/records-based hypothesis/.test(t)&&!/"agreement":"high"/.test(t),t.slice(0,600));
  t=await p.evaluate(()=>document.getElementById('v65Suff').innerText+'|'+document.querySelector('[data-v65age="0"]').textContent+'|'+!!document.querySelector('[name="f[0].mx"]'));
  ok('33 SAFETY-M8 the method is ticked, the FBA\'s age shown, and "Yes: sufficient" with an old FBA shows amber',/Function can change over time; consider a current assessment\./.test(t)&&/years old/.test(t)&&/true$/.test(t),t);
  t=await p.evaluate(()=>{const o=window.__nbhFactsOut();return document.getElementById('v65CrV').innerText+'|'+JSON.stringify(o&&o.records&&o.records.crisisHist);});
  ok('34 SAFETY-M9 the crisis history counts what restraints led to and the equipment and self-restraint, and carries them to CR-1 and IM-1',/4 of 5 restraints/.test(t)&&/"esc":4,"of":5,"pe":"helmet 2024","sr":"sits on hands"/.test(t),t);
  t=await txt(p,'v65MedV');
  ok('35 SAFETY-M10 a medication change with data shows incidents per school week before and after, with the other medications',/incidents per school week [\d.—]+ in the \d+ school days before, [\d.—]+ in the \d+ after; other medications at the time: none/.test(t),t);
  await loadFile(p,{form:'RR-1',rev:'2026-09',counts:{inc:4,int:3,beh:1},fields:{'h.client':'SIM old','ev[0].d':'2026-09-02','ev[0].t':'Sleep problem noted','b[0].agree':'high'}});
  t=await p.evaluate(()=>[document.querySelector('[name="h.client"]').value,document.querySelector('[name="ev[0].t"]').value,document.querySelector('[name="b[0].agree"]').value].join('|'));
  ok('36 RR-1 a file saved before v25.65 opens as before, its event and agreement values kept',t==='SIM old|Sleep problem noted|high',t);
  await p.close();
  /* the carry-forward lands on CR-1 and IM-1 */
  p=await open('CR-1',F.CR);t=await p.evaluate(()=>{window.__nbhFactsIn({records:{crisisHist:{esc:4,of:5,pe:'helmet 2024',sr:''}}});return document.getElementById('v65LogFlag').innerText;});
  ok('37 SAFETY-M9 Form CR-1 shows the records review\'s count',/Records review \(Form RR-1\): 4 of 5 restraints/.test(t),t);await p.close();
  p=await open('IM-1',F.IM);t=await p.evaluate(()=>{window.__nbhFactsIn({records:{crisisHist:{esc:4,of:5,pe:'helmet 2024',sr:'sits on hands'}}});return S.meta.peType+'|'+S.meta.srDesc+'|'+(S.meta.srObs||'');});
  ok('38 SAFETY-M9 Form IM-1 Part I takes the equipment and self-restraint from the records, leaving "observed now" to staff',t==='helmet 2024 (in the record, Form RR-1)|sits on hands (in the record, Form RR-1)|',t);await p.close();

  /* ================= IC-1 ================= */
  p=await open('IC-1',F.IC);
  await p.evaluate(()=>window.__nbhFactsIn({plan:{antCards:['Visual schedule'],teach:['Functional communication training'],sched:[],respond:{target:'Escape extinction: the task stays until one step is done'}}}));
  await view(p,'planproc');await sleep(300);
  t=await p.evaluate(()=>window.__v65ic.rows().map(r=>r.t).join(',')+'|'+document.getElementById('v65PpV').innerText);
  ok('39 CARE-H7 the plan\'s parts come from TD-1 with their types; extinction needs its own decision and states the risk in plain numbers, never extinction alone',/^antecedent,reinforcement,extinction\|/.test(t)&&/a short burst or new aggression happened in about a quarter to a half of cases, less often when extinction was one part of a package/.test(t)&&/This plan never uses extinction alone/.test(t)&&/needs its own decision/.test(t),t);
  t=await p.evaluate(async()=>{const S=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    const own=document.querySelector('[name="pp[2].dec"]').value;S('pp.sh.dec','yes');S('pp[2].dec','yes');S('pp.sigdate','2026-11-02');await new Promise(r=>setTimeout(r,200));
    return own+'|'+[...document.querySelectorAll('#logTbl tbody tr')].some(tr=>tr.querySelector('select').value==='Consent to implement the BIP (plan adopted with the parent)'&&tr.querySelector('input[type=date]').value==='2026-11-02');});
  ok('40 CARE-H7 no part is decided for the parent, and signing adds "Consent to implement the BIP" to the record',t==='|true',t);
  t=await p.evaluate(()=>document.querySelector('#proc [data-proc="fa"]').innerText);
  ok('41 CARE-H8 the analysis card tells the parent what saying no means, from the randomized study of 57 children',/If you say no,.*we will still complete the assessment with interviews and observation\. In one randomized study of 57 young children with autism, plans built with and without a functional analysis worked about equally often \(about 8 in 10 children\)/.test(t)&&/Not proposed/.test(t),t.slice(0,600));
  t=await p.evaluate(()=>[!!document.querySelector('[name="p.homeData"]'),!!document.querySelector('[name="p.homeTrain"]'),!!document.querySelector('[name="p.homeVideo"]'),!!document.querySelector('[name="hv.dec"]'),/No camera in a bathroom or during dressing/.test(document.querySelector('[data-proc="homevideo"]').innerText)].join(','));
  ok('42 CARE-M10 Part 2 lists the home procedures, and video and photos at home are their own decision with the privacy rules',t==='true,true,true,true,true',t);
  t=await p.evaluate(()=>[!!document.querySelector('[name="ap.resp"]'),!!document.querySelector('[name="a.need"]'),!!document.querySelector('[name="a.skills"]'),!!document.querySelector('[name="a.due"]'),/At every plan change, and at least each grading period\./.test(document.getElementById('assent').innerText)].join(','));
  ok('43 CARE-M11 assent covers the plan, the necessary-procedure rule and the skills, with the re-check rule',t==='true,true,true,true,true',t);
  t=await p.evaluate(()=>document.querySelector('.ic-tb').innerText);
  ok('44 CARE-L1 four teach-back questions before the signature, never a test',['What will happen with my child?','Which parts did I say no to?','Can I stop, and how?','Who do I call?'].every(q=>t.includes(q))&&/It is never a test/.test(t),t.slice(0,300));
  await loadFile(p,{form:'IC-1',rev:'2026-09',counts:{log:6,att:3},fields:{'c.client':'SIM old','p.fa':true,'fa.dec':'yes'}});
  t=await p.evaluate(()=>[document.querySelector('[name="c.client"]').value,document.querySelector('[name="fa.dec"]').value,document.querySelector('[name="hv.dec"]').value,document.querySelector('[name="pp[0].desc"]').value].join('|'));
  ok('45 IC-1 a file saved before v25.65 opens as before, with the new decisions empty',t==='SIM old|yes||',t);
  await p.close();

  /* ================= HD-1 ================= */
  p=await open('HD-1',F.HD);await sim(p);
  await p.evaluate(()=>{['meal','toilet','sleep'].forEach(n=>{const e=document.querySelector('[data-c="'+n+'"]');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});});await sleep(300);
  await view(p,'sheets');await sleep(200);
  t=await p.evaluate(()=>{const m=document.querySelector('#sheetOut [data-sheet="meal"]');return m?m.innerText:'';});
  ok('46 FEED-M2 a meal log sheet goes home with the health line first and the refusal note',/If your child coughs, chokes, has a wet or gurgly voice, or vomits at meals, stop the meal and call your child.s doctor\. If your child cannot breathe, cough or speak, call 911\./.test(t)&&/Refusal can rise for a few days when a new routine starts; keep the routine calm and tell us\./.test(t)&&/Waited calmly/.test(t)&&/Ended the meal early/.test(t),t.slice(0,300));
  t=await p.evaluate(()=>{const m=document.querySelector('#sheetOut [data-sheet="toilet"]');return m?m.innerText:'';});
  ok('47 CARE-M5 a toileting log sheet goes home with the doctor line and the privacy rule',/Toileting can have medical causes; talk with your child.s doctor first\./.test(t)&&/camera off, or shoulders up/.test(t),t.slice(0,300));
  await view(p,'entry');await sleep(200);
  t=await p.evaluate(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const set=(sel,v)=>{const e=document.querySelector(sel);if(e.type==='checkbox'){e.checked=!!v;e.dispatchEvent(new Event('change',{bubbles:true}));}else{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};
    document.querySelector('#v65AddTl').click();document.querySelector('#v65AddTl').click();await W(100);
    set('[data-v65tl="0"][data-f="d"]','0');set('[data-v65tl="0"][data-f="t"]','8:00 am');set('[data-v65tl="0"][data-f="v"]',1);set('[data-v65tl="0"][data-f="kind"]','ask');
    set('[data-v65tl="1"][data-f="d"]','0');set('[data-v65tl="1"][data-f="t"]','10:00 am');set('[data-v65tl="1"][data-f="acc"]','wet');
    document.querySelector('#v65AddMl').click();await W(100);set('[data-v65ml="0"][data-f="d"]','0');set('[data-v65ml="0"][data-f="gag"]',1);await W(150);
    return document.getElementById('v65TlSum').innerText+'\n'+document.getElementById('v65MlSum').innerText;});
  ok('48 CARE-M5 the toileting log computes percent successful voids, accidents per hour logged and self-initiations',/50%/.test(t)&&/ACCIDENTS PER HOUR LOGGED\s*0\.5/i.test(t)&&/SELF-INITIATIONS\s*1/i.test(t),t.slice(0,400));
  ok('49 FEED-M2 a gag, cough or choke ticked on the meal log is flagged for the doctor',/Gagging, coughing or choking was ticked at 1 meal/.test(t));
  t=await p.evaluate(()=>[document.querySelectorAll('#v65SlXTbl select[data-sf="where"]').length,document.querySelector('[id^="v65lat_"]').textContent,/Sleep diaries are best guesses; check one or two nights against another record if a decision rests on them\./.test(document.getElementById('v65SlX').innerText)].join('|'));
  ok('50 CARE-M6 the sleep log adds calls, where the child fell asleep and woke, what the adult did, sleep medicine, and minutes to fall asleep',/^[1-9]\d*\|\d+\|true$/.test(t),t);
  t=await p.evaluate(()=>{S.ag.push({date:'10/1/26',rt:'0',bh:'s0',how:'Video',staff:'Y',home:'N',note:''});renderAg();renderAgM();return [document.querySelector('#agTbl select[data-f="bh"]').closest('table').querySelectorAll('optgroup').length>0,document.getElementById('agMetrics').innerText].join('|');});
  ok('51 CARE-M7 an agreement row can name a checklist step, reported apart; under 80% the checklist reads as the family\'s report, not yet checked',/^true\|/.test(t)&&/Agreement, checklist steps/i.test(t)&&/family.s report, not yet checked/.test(t),t.slice(-400));
  t=await p.evaluate(()=>{const W=orderedWeeks().filter(o=>o.d);const b=S.bh.find(x=>x.name);if(!W.length||!b)return 'no weeks';const X={};X[b.name]=[];W.forEach((o,k)=>{for(let di=0;di<5;di++){const d=addDays(o.d,di);X[b.name].push({d:nbhHdIso(d),v:k===0?1:5});}});S.meta.v65school=JSON.stringify(X);drawEnt();return document.getElementById('v65HsPlot').innerText;});
  ok('52 CARE-L4 the school\'s data are drawn beside the home data, with a note when the two move in opposite directions',/school, mean a school day \(Form DD-1/.test(t)&&/Behavior may shift between settings when the rules change in one; plan both together\./.test(t),t.slice(0,400));
  /* the rows are kept in the file */
  t=await p.evaluate(()=>{const d={form:'HD-1',S:JSON.parse(JSON.stringify(S))};const o=fromFile(d);const w=o.wk[curWk];return w.tl.length+'|'+w.ml.length+'|'+SL_F.includes('calls');});
  ok('53 HD-1 the meal and toileting rows and the new sleep fields are read back from the file',t==='2|1|true',t);
  await loadFile(p,{form:'HD-1',S:{meta:{client:'SIM old'},chk:{tally:true},bh:[{name:'Hitting',ms:'tally'}],rt:[],sk:[],wk:[{start:'9/14/26',cells:{},ck:{},abc:[],sl:{'0':{lo:'8:00 pm',fa:'8:30 pm',up:'6:30 am'}}}],ag:[]}});
  t=await p.evaluate(()=>[S.meta.client,S.wk[0].start,(S.wk[0].ml||[]).length,!!S.chk.meal].join('|'));
  ok('54 HD-1 a file saved before v25.65 opens as before, with no meal or toileting rows',t==='SIM old|9/14/26|0|false',t);
  await p.close();

  ok('55 no page error on any form',!errs.length,errs);
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
