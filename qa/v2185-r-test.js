/* v21.85 helper R: the service log (Form CN-1), the IEP's service minutes (Form DM-1), the adoption meeting signed (Form TD-1).
   CN-1  1  each note gives the service log its minutes (typed, else the duration), kind (typed, else the type's), with whom
            (typed, else the roles under who was present) and one line (typed, else the purpose); undated or untimed notes
            are not entries
         2  this week and this month by kind, and against the IEP's minutes from the case ("120 of 120 minutes this month");
            typed IEP minutes are not overwritten by the case
         3  the printed service log: the chosen period alone, student, ID, date of birth, dates, start and end, minutes,
            service, provider name and credential, the signature line; one page
         4  the service log CSV; the note CSV gains the service columns
         5  facts out: service {log oldest first, week, month, iep}; Save data and Open data keep the new fields; an older
            file without them opens
   DM-1  6  the behavior service minutes on the IEP (minutes, per, kind, note) saved and sent as profile.services; the
            related services table read when the row is empty; the simulation carries them
   TD-1  7  the sign-in from the Team present box; signatures drawn with the mouse and with touch on the canvas; how and
            the date filled when empty; in person, by phone, declined; the parent's signature on the plan
         8  the images are 600 x 150 PNGs and small; Save data, Clear all and Open data bring them back as images
         9  printed on the final plan (images shown, empty pads hidden, the parent line at the foot says how); Copy for
            the BIP lists who signed
        10  facts out: plan.adoption.signatures [{name, role, signed, how}] (parent:true on the parent's), no image; the
            v21.82 adoption keys still there. No page errors anywhere.
   Simulated students only (Mateo Rivera, ID 4471823, DOB 03/14/2016, Royal Palm School).
   usage: WS_URL=http://127.0.0.1:8152 node qa/v2185-r-test.js */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CN1='/NBH-Workstation/CN-1_Consultation-Notes_v2026-10.html',DM1='/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html',TD1='/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
const OUT=__dirname+'/out/v2185-r/';fs.mkdirSync(OUT,{recursive:true});
const pages=b=>(b.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)||[]).length;
const t0=new Date(),md=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2),isoD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const TODAY=md(t0),OLD=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()-45),OLDS=md(OLD);
/* save a file: the form's Save data / CSV button, the blob caught */
const grab=(p,id)=>p.evaluate(id=>new Promise(res=>{const U=URL,mk=U.createObjectURL,ck=HTMLAnchorElement.prototype.click;let name='';
  U.createObjectURL=b=>{b.text().then(t=>{U.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;setTimeout(()=>res({t,name}),0);});return 'blob:nbh-test';};HTMLAnchorElement.prototype.click=function(){name=this.download;};
  document.getElementById(id).click();}),id);
(async()=>{const br=await chromium.launch();const log=[];
  /* ======================= CN-1 ======================= */
  const p=await br.newPage({viewport:{width:1280,height:900}});wire(p,log);
  await p.addInitScript(()=>{window.print=function(){window.__pstate={cls:document.body.classList.contains('cn-svc-only'),page:!!document.getElementById('cnSvcPage')};};});
  await p.goto(BASE+CN1,{waitUntil:'load'});await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const setN=o=>p.evaluate(o=>{Object.keys(o).forEach(k=>{const e=document.querySelector('[data-n="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});},o);
  const newNote=()=>p.evaluate(()=>document.getElementById('newNote').click());
  await setM('client','Mateo Rivera');await setM('sid','4471823');await setM('dob','03/14/2016');await setM('school','Royal Palm School');await setM('bcba','Jordan Ellis, M.A., BCBA (simulated)');
  /* six notes: four today (observation 60, a call 30 with the parent typed, a training typed as 30 of 45, a direct session 20),
     one 45 days ago (consultation 40), one dated today without times, one undated with times */
  await setN({date:TODAY,start:'09:00',end:'10:00',type:'Observation',present:'Ms. R. (teacher), J. Ortiz (paraeducator), the student',purpose:'Scheduled observation and TI-1'});
  await newNote();await setN({date:TODAY,start:'13:00',end:'13:30',type:'Phone or video call',present:'Mother',purpose:'Weekly call',svc_with:'parent',svc_note:'Called the parent about the home card'});
  await newNote();await setN({date:TODAY,start:'14:00',end:'14:45',type:'Training',present:'J. Ortiz (paraeducator)',purpose:'BST on the break card',svc_min:'30',svc_kind:'training'});
  await newNote();await setN({date:TODAY,start:'10:30',end:'10:50',type:'Direct session',present:'the student',purpose:'Teach the break request'});
  await newNote();await setN({date:OLDS,start:'11:00',end:'11:40',type:'Consultation',present:'Ms. R. (teacher)',purpose:'Data review'});
  await newNote();await setN({date:TODAY,type:'Record review',purpose:'Read the records'});
  await newNote();await setN({start:'08:00',end:'08:30',type:'Consultation'});
  const E=await p.evaluate(()=>svcEntries().map(e=>({i:e.i,iso:e.iso,min:e.min,kind:e.kind,with:e.with,note:e.note})));
  ok('1a five entries: dated notes with minutes; the untimed and the undated notes are not entries',E.length===5,E);
  const byI=i=>E.find(e=>e.i===i)||{};
  ok('1b observation: the duration, the type\'s kind, the roles under who was present, the purpose',byI(0).min===60&&byI(0).kind==='observation'&&byI(0).with==='teacher, paraeducator, student'&&byI(0).note==='Scheduled observation and TI-1',byI(0));
  ok('1c a call is consultation; typed with whom and one line are kept',byI(1).min===30&&byI(1).kind==='consult'&&byI(1).with==='parent'&&byI(1).note==='Called the parent about the home card',byI(1));
  ok('1d typed minutes and kind win over the duration and the type',byI(2).min===30&&byI(2).kind==='training',byI(2));
  ok('1e a direct session is direct service, with the student',byI(3).min===20&&byI(3).kind==='direct'&&byI(3).with==='student',byI(3));
  ok('1f the log is oldest first',E[0].i===4&&E[0].iso===isoD(OLD),E.map(e=>e.iso));
  const hints=await p.evaluate(()=>{cur=0;renderNote();return {min:document.getElementById('svcMin').placeholder,kind:document.querySelector('#svcKind option[value=""]').textContent,with:document.getElementById('svcWith').placeholder};});
  ok('1g the note shows the values an empty field takes (in grey)',/^60 /.test(hints.min)&&/^Observation/.test(hints.kind)&&hints.with==='teacher, paraeducator, student',hints);
  const head=await p.evaluate(()=>document.getElementById('noteOut').textContent);
  ok('1h the printed note carries its service line',/Service60 min, observation, with teacher, paraeducator, student/.test(head),head.slice(0,400));
  /* 2: the IEP's minutes from the case */
  const fin=await p.evaluate(()=>window.__nbhFactsIn({profile:{services:{minutes:120,per:'month',kind:'consult',note:'Behavior consultation to the classroom team'}}}));
  await p.click('#viewSeg button[data-view="svc"]');await sleep(300);
  const m=await p.evaluate(()=>({min:S.meta.iep_min,per:S.meta.iep_per,kind:S.meta.iep_kind,note:S.meta.iep_note,fld:document.getElementById('iepMin').value,iep:document.getElementById('svcIep').textContent.replace(/\s+/g,' '),met:document.getElementById('svcMetrics').textContent.replace(/\s+/g,' '),tot:[...document.querySelectorAll('#svcTot tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim()).join(' ')).join(' | ')}));
  ok('2a the IEP\'s minutes from DM-1 fill the empty fields',fin.filled>=4&&m.min==='120'&&m.per==='month'&&m.kind==='consult'&&m.fld==='120'&&/IEP service minutes/.test(fin.note),{fin,m});
  ok('2b against the IEP: 120 of 120 minutes this month (every kind but direct)',/120 of 120/.test(m.iep)&&/minutes this month/.test(m.iep),m.iep);
  ok('2c this week and this month: 140 minutes, direct 20, consultation and other 120',/THIS WEEK\s*140 min/i.test(m.met)&&/direct 20 · consultation and other 120/.test(m.met),m.met);
  ok('2d by kind: observation 60, consultation 30 this week and 70 in all, training 30, direct 20; totals 140, 140, 180',/Observation 60 60 60/.test(m.tot)&&/Consultation 30 30 70/.test(m.tot)&&/Training 30 30 30/.test(m.tot)&&/Direct service 20 20 20/.test(m.tot)&&/Total 140 140 180/.test(m.tot),m.tot);
  const met2=await p.evaluate(()=>document.getElementById('svcMetrics').textContent);
  ok('2e the dated note without times is counted as missing its minutes',/1 dated note has no minutes or times/.test(met2),met2);
  await setM('iep_min','90');const fin2=await p.evaluate(()=>window.__nbhFactsIn({profile:{services:{minutes:120,per:'week',kind:'direct'}}}));
  ok('2f typed IEP minutes are not overwritten by the case',await p.evaluate(()=>S.meta.iep_min==='90'&&S.meta.iep_per==='month')&&!/IEP service/.test(fin2.note||''),fin2);
  await setM('iep_min','120');
  await setM('iep_per','grading period');await sleep(350);
  const gp=await p.evaluate(()=>({vis:[...document.querySelectorAll('.svc-gp')].every(x=>!x.hidden),iep:document.getElementById('svcIep').textContent}));
  const gpF=isoD(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()-50)),gpT=isoD(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+10));
  await setM('gp_from',gpF);await setM('gp_to',gpT);await sleep(350);
  const gp2=await p.evaluate(()=>document.getElementById('svcIep').textContent.replace(/\s+/g,' '));
  ok('2g per grading period: the dates appear and count every entry between them (160 of 120)',gp.vis&&/grading period/.test(gp.iep)&&/160 of 120/.test(gp2)&&/grading period/.test(gp2),{gp,gp2});
  await setM('iep_per','month');await sleep(350);
  /* 3: the printed service log */
  const pg=await p.evaluate(()=>({opts:[...document.getElementById('svcPeriod').options].map(o=>o.value),txt:document.getElementById('svcOut').innerText,rows:document.querySelectorAll('#svcOut table.sl-t tbody tr[data-open]').length}));
  ok('3a the period is this month by default, with this week, the earlier month and every entry to choose',pg.opts[0]==='m:'+isoD(t0).slice(0,7)&&pg.opts.includes('w')&&pg.opts.includes('all')&&pg.opts.includes('m:'+isoD(OLD).slice(0,7)),pg.opts);
  ok('3b the page: student, ID, date of birth, school, provider with credential, IEP service',/Mateo Rivera/.test(pg.txt)&&/4471823/.test(pg.txt)&&/03\/14\/2016/.test(pg.txt)&&/Royal Palm School/.test(pg.txt)&&/Jordan Ellis, M\.A\., BCBA \(simulated\)/.test(pg.txt)&&/120 minutes per month, consultation/.test(pg.txt),pg.txt.slice(0,600));
  ok('3c this month\'s four entries with start, end, minutes and service; the total; the signature line',pg.rows===4&&/9:00 am/.test(pg.txt)&&/10:00 am/.test(pg.txt)&&/Total, 4 entries\s*140/.test(pg.txt)&&/Provider signature/.test(pg.txt)&&/Against the IEP: 120 of 120 minutes in /.test(pg.txt),pg.txt.slice(500,1600));
  await p.click('#svcPrint');await sleep(150);const ps=await p.evaluate(()=>window.__pstate);await sleep(1600);
  const after=await p.evaluate(()=>({cls:document.body.classList.contains('cn-svc-only'),st:!!document.getElementById('cnSvcPage')}));
  ok('3d Print the service log prints it alone (its class and a portrait page while printing, gone after)',ps&&ps.cls&&ps.page&&!after.cls&&!after.st,{ps,after});
  await p.evaluate(()=>{document.body.classList.add('cn-svc-only');const st=document.createElement('style');st.id='cnSvcPage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);});
  await p.emulateMedia({media:'print'});
  const vis=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('svcOut')).display,note:getComputedStyle(document.querySelector('section.only-note')).display,met:getComputedStyle(document.getElementById('svcMetrics')).display,tb:getComputedStyle(document.querySelector('.toolbar')).display}));
  const pdf1=await p.pdf({path:OUT+'cn1-service-log.pdf',format:'Letter',printBackground:true});
  ok('3e on paper only the service log page shows, on one page',vis.out!=='none'&&vis.note==='none'&&vis.met==='none'&&vis.tb==='none'&&pages(pdf1)===1,{vis,pages:pages(pdf1)});
  await p.evaluate(()=>{document.body.classList.remove('cn-svc-only');document.getElementById('cnSvcPage').remove();});
  const pdf2=await p.pdf({path:OUT+'cn1-form.pdf',format:'Letter',printBackground:true});await p.emulateMedia({media:'screen'});
  ok('3f the whole-form print still renders, with the service log in it',pages(pdf2)>=4,pages(pdf2));
  /* 4: CSV */
  const csv=await grab(p,'svcCsv');const L=csv.t.split('\n');
  ok('4a the service log CSV: a header and this month\'s four rows with minutes, kind and provider',L.length===5&&/^"Student","Student ID","Date","Start","End","Minutes","Kind"/.test(L[0])&&L.slice(1).every(r=>/"Mateo Rivera","4471823"/.test(r)&&/"Jordan Ellis, M\.A\., BCBA \(simulated\)"$/.test(r))&&/"60","Observation"/.test(csv.t)&&/^CN-1_service-log_Mateo_Rivera_/.test(csv.name),{L,name:csv.name});
  await p.selectOption('#svcPeriod','all');await sleep(200);const csvAll=await grab(p,'svcCsv');
  ok('4b every entry when the period is every entry',csvAll.t.split('\n').length===6&&/_all\.csv$/.test(csvAll.name),csvAll.name);
  const ncsv=await grab(p,'csvBtn');const nh=ncsv.t.split('\n')[0];
  ok('4c the note CSV gains the service columns',/"Service minutes","Service kind","With whom","Service note"$/.test(nh),nh.slice(-120));
  /* 5: facts out, save and open */
  const fo=await p.evaluate(()=>window.__nbhFactsOut());const sv=fo&&fo.service;
  ok('5a facts out: service.log oldest first, {date, min, kind, with, note}',sv&&sv.log.length===5&&sv.log[0].date===isoD(OLD)&&sv.log[0].min===40&&sv.log[0].kind==='consult'&&sv.log.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&typeof x.min==='number'&&/^(direct|consult|observation|training|meeting|other)$/.test(x.kind))&&sv.log.some(x=>x.with==='parent'&&x.note==='Called the parent about the home card'),sv);
  ok('5b facts out: week and month {from, to, direct, consult, total}, iep {minutes, per, kind, done, line}',sv&&sv.week.direct===20&&sv.week.consult===120&&sv.week.total===140&&/^\d{4}-\d{2}-\d{2}$/.test(sv.week.from)&&sv.month.total===140&&sv.iep&&sv.iep.minutes===120&&sv.iep.done===120&&sv.iep.line==='120 of 120 minutes this month',sv&&{w:sv.week,m:sv.month,i:sv.iep});
  const saved=await grab(p,'saveBtn');const SJ=JSON.parse(saved.t);
  ok('5c Save data keeps the service fields and the IEP minutes',SJ.S.notes[2].svc_min==='30'&&SJ.S.notes[2].svc_kind==='training'&&SJ.S.notes[1].svc_with==='parent'&&SJ.S.meta.iep_min==='120'&&SJ.S.meta.dob==='03/14/2016',{n:SJ.S.notes[2],m:SJ.S.meta});
  const before=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>{S=blank();cur=0;renderAll();});
  await p.setInputFiles('#fileIn',{name:'CN-1_Mateo_Rivera.json',mimeType:'application/json',buffer:Buffer.from(saved.t)});await sleep(500);
  ok('5d Open data brings it all back',await p.evaluate(b=>JSON.stringify(S)===b,before));
  const oldFile=JSON.parse(saved.t);oldFile.S.notes.forEach(n=>{delete n.svc_min;delete n.svc_kind;delete n.svc_with;delete n.svc_note;});delete oldFile.S.meta.iep_min;oldFile.S.notes[0].svc_kind='bogus';
  await p.setInputFiles('#fileIn',{name:'CN-1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(oldFile))});await sleep(500);
  const oldE=await p.evaluate(()=>({n:svcEntries().length,k:S.notes[0].svc_kind,e:svcEntries().find(e=>e.i===2)}));
  ok('5e an older file without the service fields opens; entries come from the times and the types',oldE.n===5&&oldE.k===''&&oldE.e.min===45&&oldE.e.kind==='training',oldE);
  await p.setViewportSize({width:390,height:800});await p.click('#viewSeg button[data-view="svc"]').catch(()=>{});await sleep(300);
  const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  ok('5f the Service log page fits a phone (no sideways scroll of the page)',sw[0]<=sw[1]+1,sw);
  await p.close();

  /* ======================= DM-1 ======================= */
  const d=await br.newPage({viewport:{width:1280,height:900}});wire(d,log);
  await d.goto(BASE+DM1,{waitUntil:'load'});await sleep(900);await d.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const setD=(n,x)=>d.evaluate(([n,x])=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,x]);
  ok('6a an empty DM-1 sends no services',await d.evaluate(()=>{const o=window.__nbhFactsOut();return !(o&&o.profile&&o.profile.services);}));
  await setD('sv[4].freq','2x/wk, 30 min consult');
  const tb=await d.evaluate(()=>window.__nbhFactsOut().profile.services);
  ok('6b the empty row reads the related services table: 2x/wk, 30 min consult is 60 per week, consultation',tb&&tb.minutes===60&&tb.per==='week'&&tb.kind==='consult'&&/Related services table/.test(tb.note),tb);
  await setD('s.first','Mateo');await setD('s.last','Rivera');await setD('p.svcmin','120');await setD('p.svcper','month');await setD('p.svckind','consult');await setD('p.svcnote','Behavior consultation to the classroom team');
  const dm=await d.evaluate(()=>window.__nbhFactsOut().profile);
  ok('6c profile.services {minutes, per, kind, note} from the row; the other profile keys stay',dm.services&&dm.services.minutes===120&&dm.services.per==='month'&&dm.services.kind==='consult'&&dm.services.note==='Behavior consultation to the classroom team'&&dm.src==='DM-1',dm);
  const dsave=await grab(d,'saveBtn');const df=JSON.parse(dsave.t).fields;
  ok('6d Save data holds the row',df['p.svcmin']==='120'&&df['p.svcper']==='month'&&df['p.svckind']==='consult',{a:df['p.svcmin'],b:df['p.svcper']});
  await d.evaluate(()=>document.getElementById('clearBtn').click());await sleep(500);
  ok('6e Clear all empties it',await d.evaluate(()=>document.querySelector('[name="p.svcmin"]').value===''));
  await d.setInputFiles('#fileIn',{name:'DM-1_Rivera_Mateo.json',mimeType:'application/json',buffer:Buffer.from(dsave.t)});await sleep(600);
  ok('6f Open data brings it back',await d.evaluate(()=>{const s=window.__nbhFactsOut().profile.services;return s&&s.minutes===120&&s.per==='month';}));
  await d.evaluate(()=>document.getElementById('simBtn').click());await sleep(800);
  const dsim=await d.evaluate(()=>window.__nbhFactsOut().profile.services);
  ok('6g the simulation carries 120 minutes a month of consultation',dsim&&dsim.minutes===120&&dsim.per==='month'&&dsim.kind==='consult',dsim);
  /* DM-1 out into CN-1 in */
  const p2=await br.newPage({viewport:{width:1280,height:900}});wire(p2,log);await p2.goto(BASE+CN1,{waitUntil:'load'});await sleep(800);
  const into=await p2.evaluate(F=>{const r=window.__nbhFactsIn(F);return {r,m:S.meta.iep_min,per:S.meta.iep_per,k:S.meta.iep_kind};},{profile:dm});
  ok('6h DM-1\'s profile.services goes into CN-1',into.m==='120'&&into.per==='month'&&into.k==='consult',into);
  await p2.close();await d.close();

  /* ======================= TD-1 ======================= */
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true});const t=await ctx.newPage();wire(t,log);
  await t.addInitScript(()=>{window.print=function(){};});
  await t.goto(BASE+TD1,{waitUntil:'load'});await sleep(1200);await t.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const setT=(n,x)=>t.evaluate(([n,x])=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,x]);
  const setId=(id,x)=>t.evaluate(([id,x])=>{const e=document.getElementById(id);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[id,x]);
  ok('7a an empty TD-1 sends no signatures',await t.evaluate(()=>{const o=window.__nbhFactsOut();return !(o&&o.plan&&o.plan.adoption&&o.plan.adoption.signatures);}));
  await t.click('#viewSeg button[data-view="final"]');await sleep(300);
  await setT('ad.date','2026-10-08');await setT('ad.team','Ms. R. (ESE teacher); Mr. L. (LEA representative); Jordan Ellis (BCBA); general education teacher');await setT('ad.parent','yes');
  await t.click('#td85Team');await sleep(300);
  const r0=await t.evaluate(()=>JSON.parse(document.querySelector('[name="ad.sigs"]').value));
  ok('7b List the team present makes a row for each (name and role; a role alone stays a role)',r0.length===4&&r0[0].name==='Ms. R.'&&r0[0].role==='ESE teacher'&&r0[2].name==='Jordan Ellis'&&r0[2].role==='BCBA'&&r0[3].name===''&&r0[3].role==='general education teacher',r0);
  await t.click('#td85Team');await sleep(200);
  ok('7c listing again adds no one twice',await t.evaluate(()=>JSON.parse(document.querySelector('[name="ad.sigs"]').value).length)===4);
  await t.evaluate(()=>{window.__ptypes=[];document.addEventListener('pointerdown',e=>{if(e.target.matches&&e.target.matches('canvas.td85-pad'))window.__ptypes.push(e.pointerType);},true);});
  /* the mouse on row 1 */
  const box=async sel=>{const h=await t.$(sel);await h.scrollIntoViewIfNeeded();return h.boundingBox();};
  let b=await box('#td85List canvas.td85-pad[data-k="0"]');
  await t.mouse.move(b.x+16,b.y+b.height*.6);await t.mouse.down();for(let i=0;i<36;i++)await t.mouse.move(b.x+16+i*9,b.y+b.height*(.55-.3*Math.sin(i/3)));await t.mouse.up();
  await t.mouse.move(b.x+60,b.y+b.height*.8);await t.mouse.down();for(let i=0;i<10;i++)await t.mouse.move(b.x+60+i*20,b.y+b.height*.8);await t.mouse.up();await sleep(150);
  /* touch on row 2 (the iPad: a finger) */
  await t.evaluate(()=>document.querySelectorAll('.nbh-toast').forEach(e=>e.remove()));   /* "Listed 4 people" lies over the pad until it fades */
  b=await box('#td85List canvas.td85-pad[data-k="1"]');const cdp=await ctx.newCDPSession(t);
  const tp=(x,y)=>[{x:Math.round(x),y:Math.round(y),radiusX:1,radiusY:1,force:1,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp(b.x+20,b.y+b.height*.5)});
  for(let i=1;i<=30;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:tp(b.x+20+i*10,b.y+b.height*(.5+.25*Math.cos(i/2)))});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  const r1=await t.evaluate(()=>({rows:JSON.parse(document.querySelector('[name="ad.sigs"]').value),how0:document.getElementById('td85h0').value,d0:document.getElementById('td85d0').value,pt:window.__ptypes}));
  ok('7d drawn with the mouse: the image, "signed on the iPad" and today\'s date, on the card too',r1.rows[0].img&&/^data:image\/png;base64,/.test(r1.rows[0].img)&&r1.rows[0].how==='signed on the iPad'&&r1.rows[0].signed===isoD(t0)&&r1.how0==='signed on the iPad'&&r1.d0===isoD(t0),{how:r1.rows[0].how,d:r1.rows[0].signed,how0:r1.how0});
  ok('7e drawn with touch (a finger on the iPad): the image is kept',r1.pt.includes('touch')&&r1.rows[1].img&&r1.rows[1].how==='signed on the iPad',{pt:r1.pt,how:r1.rows[1].how,img:!!r1.rows[1].img});
  await setId('td85h2','in person');await sleep(200);await setId('td85h3','declined');await setId('td85n3','Ms. G.');await setId('td85d3','2026-10-08');await sleep(200);
  const r2=await t.evaluate(()=>({c2:document.querySelector('.td85-card[data-k="2"]').textContent,c3:document.querySelector('.td85-card[data-k="3"]').textContent,pads:document.querySelectorAll('#td85List canvas.td85-pad').length,rows:JSON.parse(document.querySelector('[name="ad.sigs"]').value)}));
  ok('7f in person prints a line to sign on paper; declined says so; neither has a pad',/Signs here on the printed plan/.test(r2.c2)&&/Declined to sign/.test(r2.c3)&&r2.pads===0&&r2.rows[2].how==='in person'&&r2.rows[3].how==='declined'&&r2.rows[3].name==='Ms. G.',r2);
  /* the parent's signature on the plan */
  await setId('td85pn','Ana Rivera');await setId('td85pr','Parent');
  b=await box('#td85Parent canvas.td85-pad');
  await t.mouse.move(b.x+30,b.y+b.height*.7);await t.mouse.down();for(let i=0;i<40;i++)await t.mouse.move(b.x+30+i*8,b.y+b.height*(.6-.35*Math.sin(i/4)));await t.mouse.up();await sleep(200);
  const pp=await t.evaluate(()=>JSON.parse(document.querySelector('[name="ad.psig"]').value));
  ok('7g the parent\'s signature on the plan: name, relationship, the image, how and the date',pp.name==='Ana Rivera'&&pp.rel==='Parent'&&/^data:image\/png/.test(pp.img)&&pp.how==='signed on the iPad'&&pp.signed===isoD(t0),{n:pp.name,r:pp.rel,h:pp.how,s:pp.signed});
  /* 8: the images and the file */
  const dims=await t.evaluate(async()=>{const A=JSON.parse(document.querySelector('[name="ad.sigs"]').value),P=JSON.parse(document.querySelector('[name="ad.psig"]').value);
    const sz=s=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.naturalWidth,i.naturalHeight]);i.onerror=()=>r([0,0]);i.src=s;});
    return {d:[await sz(A[0].img),await sz(A[1].img),await sz(P.img)],len:[A[0].img.length,A[1].img.length,P.img.length]};});
  ok('8a each image is a 600 x 150 PNG under 40 KB',dims.d.every(x=>x[0]===600&&x[1]===150)&&dims.len.every(n=>n<40000),dims);
  const tsave=await grab(t,'saveBtn');const tf=JSON.parse(tsave.t).fields;
  console.log('   TD-1 saved file: '+tsave.t.length+' bytes; signatures '+dims.len.join(' + ')+' characters');
  ok('8b Save data holds the sign-in and the parent\'s signature with their images; the file stays small (under 200 KB)',JSON.parse(tf['ad.sigs']).length===4&&JSON.parse(tf['ad.sigs'])[0].img&&JSON.parse(tf['ad.psig']).img&&tsave.t.length<200000,tsave.t.length);
  await t.evaluate(()=>document.getElementById('clearBtn').click());await sleep(800);
  ok('8c Clear all empties the sign-in',await t.evaluate(()=>!document.querySelector('[name="ad.sigs"]').value&&!document.querySelector('#td85List .td85-card')&&!!document.querySelector('#td85Parent canvas.td85-pad')));
  await t.setInputFiles('#fileIn',{name:'TD-1_Mateo_Rivera.json',mimeType:'application/json',buffer:Buffer.from(tsave.t)});await sleep(1400);
  const back=await t.evaluate(()=>({cards:document.querySelectorAll('#td85List .td85-card').length,imgs:[...document.querySelectorAll('#td85Block img.td85-img')].map(i=>i.complete&&i.naturalWidth),n0:document.getElementById('td85n0').value,pn:document.getElementById('td85pn').value,h2:document.getElementById('td85h2').value,pads:document.querySelectorAll('#td85Block canvas.td85-pad').length}));
  ok('8d Open data brings the sign-in back: four people, three signatures shown as images, no empty pad left',back.cards===4&&back.imgs.length===3&&back.imgs.every(w=>w===600)&&back.n0==='Ms. R.'&&back.pn==='Ana Rivera'&&back.h2==='in person'&&back.pads===0,back);
  const bad=JSON.parse(tsave.t);const bs=JSON.parse(bad.fields['ad.sigs']);bs[0].img='https://example.invalid/x.png';bad.fields['ad.sigs']=JSON.stringify(bs);
  await t.setInputFiles('#fileIn',{name:'TD-1_bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await sleep(1200);
  const bk2=await t.evaluate(()=>({imgs:[...document.querySelectorAll('#td85Block img.td85-img')].map(i=>i.getAttribute('src').slice(0,22)),pad0:!!document.querySelector('.td85-card[data-k="0"] canvas.td85-pad')}));
  ok('8e an image that is not a PNG or JPEG data address is dropped (the pad comes back)',bk2.imgs.length===2&&bk2.imgs.every(s=>s.indexOf('data:image/png')===0)&&bk2.pad0,bk2);
  await t.setInputFiles('#fileIn',{name:'TD-1_Mateo_Rivera.json',mimeType:'application/json',buffer:Buffer.from(tsave.t)});await sleep(1400);
  /* 9: printed and copied */
  await t.click('#viewSeg button[data-view="final"]');await sleep(300);
  await t.evaluate(()=>{window.dispatchEvent(new Event('beforeprint'));document.body.classList.add('print-final');});await t.emulateMedia({media:'print'});
  const pr=await t.evaluate(()=>{const B=document.getElementById('td85Block'),r=B.getBoundingClientRect();return {shown:getComputedStyle(document.getElementById('final')).display!=='none'&&r.height>150,
    imgs:[...B.querySelectorAll('img.td85-img')].filter(i=>getComputedStyle(i).display!=='none'&&i.getBoundingClientRect().height>20).length,
    tools:[...B.querySelectorAll('.td85-t,.td85-bar')].every(x=>getComputedStyle(x).display==='none'),line:getComputedStyle(B.querySelector('.td85-card[data-k="2"] .td85-line')).display,
    foot:document.querySelector('#final .sigcite .sig > div:nth-child(3)').textContent,txt:B.innerText,names:['td85n0','td85n2','td85pn'].map(id=>{const e=document.getElementById(id);return getComputedStyle(e).display!=='none'?e.value:'(hidden)';})};});
  const pdf3=await t.pdf({path:OUT+'td1-final.pdf',format:'Letter',printBackground:true});await t.emulateMedia({media:'screen'});await t.evaluate(()=>document.body.classList.remove('print-final'));
  ok('9a printed on the final plan: the sign-in and the three signatures as images; the buttons hidden; the paper line kept',pr.shown&&pr.imgs===3&&pr.tools&&pr.line!=='none'&&pr.names[0]==='Ms. R.'&&pr.names[2]==='Ana Rivera'&&/Signs here on the printed plan/.test(pr.txt)&&/Declined to sign/.test(pr.txt)&&pages(pdf3)>=1,{pr:Object.assign({},pr,{txt:pr.txt.slice(0,200)}),pages:pages(pdf3)});
  ok('9b the parent or guardian line at the foot says the parent signed on the iPad, with the name and the date',/^Parent or guardian \/ date: signed on the iPad above \(Ana Rivera, /.test(pr.foot),pr.foot);
  const bip=await t.evaluate(()=>window.__bipText());
  ok('9c Copy for the BIP lists who signed and how, in the adoption block, with no image',/ADOPTION AND REVISIONS[\s\S]*Signed in at the meeting:[\s\S]*Ms\. R\., ESE teacher: signed on the iPad/.test(bip)&&/Ms\. G\., general education teacher: declined to sign/.test(bip)&&/The parent's signature on the plan: Ana Rivera, Parent, signed on the iPad/.test(bip)&&!/data:image/.test(bip),bip.slice(-900));
  /* 10: facts out */
  const tfo=await t.evaluate(()=>window.__nbhFactsOut());const sg=tfo&&tfo.plan&&tfo.plan.adoption&&tfo.plan.adoption.signatures;
  ok('10a plan.adoption.signatures [{name, role, signed, how}], the parent\'s last with parent:true',Array.isArray(sg)&&sg.length===5&&sg[0].name==='Ms. R.'&&sg[0].role==='ESE teacher'&&sg[0].signed===isoD(t0)&&sg[0].how==='signed on the iPad'&&sg[2].how==='in person'&&sg[3].how==='declined'&&sg[3].signed==='2026-10-08'&&sg[4].parent===true&&sg[4].name==='Ana Rivera'&&sg[4].role==='Parent'&&sg[4].how==='signed on the iPad',sg);
  ok('10b no image goes to the case',!/data:image|base64/.test(JSON.stringify(tfo))&&sg.every(x=>!('img' in x)),JSON.stringify(tfo).length);
  ok('10c the v21.82 adoption keys and the plan stay (date, team, parent, version, versions)',tfo.plan.adoption.date==='2026-10-08'&&/BCBA/.test(tfo.plan.adoption.team)&&tfo.plan.adoption.parent==='yes'&&tfo.plan.adoption.version===1&&Array.isArray(tfo.plan.versions)&&tfo.plan.src==='TD-1',tfo.plan.adoption);
  /* clear one signature, change how with a signature, remove a person */
  await t.evaluate(()=>document.querySelector('.td85-clr[data-k="1"]').click());await sleep(200);
  const c1=await t.evaluate(()=>({img:!!JSON.parse(document.querySelector('[name="ad.sigs"]').value)[1].img,pad:!!document.querySelector('.td85-card[data-k="1"] canvas.td85-pad')}));
  ok('10d Clear the signature takes the image away and gives the pad back',!c1.img&&c1.pad,c1);
  await setId('td85ph','by phone');await sleep(400);
  const c2=await t.evaluate(()=>({p:JSON.parse(document.querySelector('[name="ad.psig"]').value),foot:document.querySelector('#final .sigcite .sig > div:nth-child(3)').textContent}));
  ok('10e changing how after signing asks, then deletes the image; the foot line says by phone',!c2.p.img&&c2.p.how==='by phone'&&/took part by phone/.test(c2.foot),c2);
  await t.evaluate(()=>document.querySelector('.td85-x[data-k="3"]').click());await sleep(400);
  ok('10f Remove takes the person out of the sign-in',await t.evaluate(()=>JSON.parse(document.querySelector('[name="ad.sigs"]').value).length)===3);
  await t.setViewportSize({width:390,height:800});await sleep(300);
  const tw=await t.evaluate(()=>{const B=document.getElementById('td85Block').getBoundingClientRect();return [Math.round(B.right),document.documentElement.clientWidth];});
  ok('10g the sign-in fits a phone',tw[0]<=tw[1]+1,tw);
  await ctx.close();
  const errs=log.filter(x=>x.type==='pageerror'||(x.type==='error'&&!/favicon|ERR_|net::|404/.test(x.text)));
  ok('no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
