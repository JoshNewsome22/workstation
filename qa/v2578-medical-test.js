/* v25.78 (the BCBA, 11/11): the new Form ME-1, Medical Event Record. Simulated data only: invented people, drawn squares for
   photos, a made-up PDF for papers.
   A  an event: the kinds and each kind's own questions; a seizure's length from its times or the minutes typed; a late
      entry marked; what an event still needs; the report question and what the record is not.
   B  photos and papers: a photo shrunk to 1600 px and a photographed page to 2200 px, kept in the media store by
      reference; a PDF kept as it is; a file that is not a PDF or a photo refused, and a PDF over 8 MB; a photo of the
      student only with consent; 12 to an event; opened large; deleted after a question in the page.
   C  what leaves the form: the case facts (counts, the last event's date, kind and care, what is open) and the CSV hold
      no description, no diagnosis, no instruction and no photo or paper.
   D  files: Save data pressed by a person carries the photos and papers inside the file; pressed by the workstation it
      holds references; a file opens again, a partial or odd one too, and another form's file is refused.
   P  paper: only what was entered; photos only when ticked; one event when asked, with the list of events left off.
   Also: each change stamps the event ("last changed"), and Form ME-1 goes into a packet only by hand, after a question.
   S  in the workstation: the 49th form; the case facts and Today; Save case carries the photo and the PDF inside the
      file while the copy kept on the device holds references; the case opens again with them; the sweep keeps them.
   usage: node qa/v2578-medical-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),FILE='ME-1_Medical-Event-Record_v2026-11.html',URL=L.BASE+'/NBH-Workstation/'+FILE;
const OUT=path.join(__dirname,'out','v2578-medical');fs.mkdirSync(OUT,{recursive:true});
const pdfText=f=>{try{return JSON.parse(cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps(" ".join(p.get_text() for p in d)))',f]).toString());}catch(e){return null;}};
const flat=t=>String(t||'').replace(/\s+/g,' ');
/* a made-up PDF: the header a PDF starts with, and filler */
const fakePdf=n=>Buffer.concat([Buffer.from('%PDF-1.4\n% simulated discharge paper, made by the test\n'),Buffer.alloc(n,0x20),Buffer.from('\n%%EOF\n')]);
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  /* ---------- the files ---------- */
  const src=fs.readFileSync(path.join(W,FILE),'utf8'),im=fs.readFileSync(path.join(W,fs.readdirSync(W).find(f=>f.startsWith('IM-1_'))),'utf8'),idx=fs.readFileSync(path.join(W,'index.html'),'utf8');
  const tail=s=>s.slice(s.indexOf('/* ===================== NBH student packet'));
  ok('0a the shared blocks are byte for byte Form IM-1\'s; its id is ME-1, "Medical Event Record", Revised November 2026',tail(src)===tail(im)&&/<span class="nbh-formid">Form ME-1<\/span><span>Revised November 2026<\/span>/.test(src)&&/<title>Form ME-1 · Medical Event Record · /.test(src)&&/<h1>Medical Event Record<\/h1>/.test(src));
  ok('0b the workstation lists it as the 49th form, holds its photos and papers as references, and Help counts 49',/\['ME-1','Medical Event Record','ME-1_Medical-Event-Record_v2026-11\.html'\]/.test(idx)&&/const MEDIA_FORMS=\['TV-1','IM-1','ME-1'\]/.test(idx)&&/All 49 forms are inside this file/.test(idx)&&/FACT_SRC\['ME-1'\]='medical'/.test(idx)&&L.forms().length===49);
  ok('0c the form says what it is not, sends an emergency to the health plan and 911, and leaves the report to the person and the procedure',/does <b>not<\/b> replace the school&rsquo;s or agency&rsquo;s own incident or accident report, the nurse&rsquo;s record, or a report of suspected abuse or neglect/.test(src)&&/Anyone who has a reason to suspect abuse or neglect makes the report themselves/.test(src)&&/In an emergency the health plan and 911 come first/.test(src)&&/Photos do not replace the nurse’s check or a mandated report\. For an injury that is unexplained or suspicious, follow the school’s or agency’s reporting procedure, including who may take photos, before photographing\. Never photograph a private area\./.test(src));

  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('ME-1: '+e.message));
  await p.goto(URL);await sleep(1200);
  await p.evaluate(()=>{window.__wc=0;window.confirm=()=>{window.__wc++;return false;};window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};
    window.__nc=0;nbhUI.confirm=async()=>{window.__nc++;return true;};window.__toasts=[];const T=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));return T(m,o);};});
  const E=(f,a)=>p.evaluate(f,a);
  const put=(sel,v)=>E(([sel,v])=>{const e=document.querySelector(sel);if(!e)return false;if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,v]);
  const ev=(k,v)=>put('#meEdit [data-ev="'+k+'"]',v);
  const square=async(color,w,h)=>Buffer.from(await E(([c,w,h])=>{const k=document.createElement('canvas');k.width=w;k.height=h;const x=k.getContext('2d');x.fillStyle=c;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(w/4,h/4,w/2,h/8);return k.toDataURL('image/png').split(',')[1];},[color,w,h]),'base64');
  const addFiles=async(sel,files)=>{await p.setInputFiles(sel,files);await sleep(1500);};

  /* ---------- A: an event ---------- */
  let t=await E(()=>({n:S.events.length,empty:document.querySelector('#meList tbody').innerText,open:document.getElementById('meOpen').innerText,edit:document.getElementById('meEdit').innerText}));
  ok('A1 an empty record says so, on both pages',t.n===0&&/No medical event is recorded\. Press New event/.test(t.empty)&&/Nothing is open/.test(t.open)&&/No event is open/.test(t.edit),t);
  await E(()=>document.getElementById('meNew').click());await sleep(300);
  t=await E(()=>{const e=S.events[0],d=new Date();return {n:S.events.length,view:/view-event/.test(document.body.className),date:e.date===(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear(),time:/^\d+:\d\d [AP]M$/.test(e.time),rec:!isNaN(Date.parse(e.rec)),
    kinds:[...document.querySelectorAll('#meEdit select[data-ev="kind"] option')].map(o=>o.value).join(),kindPart:!!document.querySelector('#meEdit [data-part="kind"]'),parts:[...document.querySelectorAll('#meEdit .mePart>h3')].map(h=>h.textContent).join('|')};});
  ok('A2 New event opens a new entry with today\'s date and the time, stamped when first written; seven kinds; the common parts in order, "Written by" last',t.n===1&&t.view&&t.date&&t.time&&t.rec&&t.kinds===',ing,sz,inj,alg,br,ill,oth'&&!t.kindPart&&t.parts==='What Happened|What Was Done at School|Medical Care|Who Was Told|Back at School|Does This Need a Report?|After the Event|Follow-up|Photos and Papers|Written by',t);
  const kp={};for(const k of ['ing','sz','inj','alg','br','ill','oth']){await ev('kind',k);await sleep(120);
    kp[k]=await E(k=>{const P=document.querySelector('#meEdit [data-part="kind"]');return {h:P?P.querySelector('h3').textContent:'',n:P?P.querySelectorAll('[data-ev]').length:0,want:(P_KIND[k]||[]).length,next:(document.getElementById('meNext')||{}).innerText||''};},k);}
  ok('A3 each kind of event adds its own questions (and "Other" none), and names what else is worth opening',kp.ing.h==='What Was Swallowed'&&kp.sz.h==='The Seizure'&&kp.inj.h==='The Injury'&&kp.alg.h==='The Reaction'&&kp.br.h==='The Choking or Breathing Trouble'&&kp.ill.h==='The Illness'&&kp.oth.h===''&&
    ['ing','sz','inj','alg','br','ill'].every(k=>kp[k].n===kp[k].want&&kp[k].n>=2)&&/Form DM-1, Safety Precautions/.test(kp.ing.next)&&/pica safety checklist/.test(kp.ing.next)&&/seizure action plan/.test(kp.sz.next)&&/Form IM-1/.test(kp.inj.next)&&kp.oth.next==='',kp);
  /* a seizure's length */
  await ev('kind','sz');await sleep(150);await ev('szStart','1:12 PM');await ev('szEnd','1:19 PM');await sleep(400);
  const z1=await E(()=>({t:document.getElementById('meSzLen').textContent,m:szMin(S.events[0]),list:document.querySelector('#meList tbody tr').innerText}));
  await ev('szStart','11:58 PM');await ev('szEnd','12:03 AM');await sleep(400);const z2=await E(()=>szMin(S.events[0]));
  await ev('szStart','');await ev('szEnd','');await ev('szDur','0.5');await sleep(400);const z3=await E(()=>({t:document.getElementById('meSzLen').textContent,h:document.getElementById('meSzLen').hidden}));
  await ev('szDur','');await sleep(400);const z4=await E(()=>document.getElementById('meSzLen').hidden);
  ok('A4 a seizure\'s length comes from its two times (across midnight too), else from the minutes typed; nothing is shown when neither is written; the line points to the seizure action plan and gives no advice of its own',z1.m===7&&/It lasted about 7 minutes\. The student’s seizure action plan says what to do, and when to call 911\./.test(z1.t)&&/about 7 minutes/.test(z1.list)&&z2===5&&/under a minute/.test(z3.t)&&!z3.h&&z4===true,{z1,z2,z3,z4});
  /* a late entry */
  const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();};
  await ev('date',ago(5));await sleep(400);const l1=await E(()=>({rec:document.getElementById('meRecLine').innerText,list:document.querySelector('#meList tbody tr').innerText}));
  await ev('date',ago(0));await ev('time','');await sleep(400);const l2=await E(()=>({rec:document.getElementById('meRecLine').innerText,list:document.querySelector('#meList tbody tr').innerText}));
  ok('A5 an entry first written more than 24 hours after the event is marked a late entry, on the event and in the list; one written the same day is not',/^First written \d+\/\d+\/\d{4} \d+:\d\d [AP]M · Late entry \(written more than 24 hours after the event\)$/.test(l1.rec.trim())&&/Late entry/.test(l1.list)&&/^First written/.test(l2.rec)&&!/Late/.test(l2.rec)&&!/Late entry/.test(l2.list),{l1,l2});
  /* what an event still needs */
  await ev('kind','ing');await sleep(150);
  const o1=await E(()=>openOf(S.events[0]).map(o=>o.what));
  await ev('care','er');await sleep(350);const o2=await E(()=>openOf(S.events[0]).map(o=>o.what));
  await ev('parWho','Parent (simulated)');await ev('instr','Simulated instructions.');await ev('retDate',ago(0));await ev('ingPassed','Cleared by the doctor (simulated)');await ev('repNeed','yes');await sleep(350);
  const o3=await E(()=>openOf(S.events[0]).map(o=>o.what));
  await ev('repWhen','today 2:00 PM');await ev('repTo','Hotline (simulated), ref SIM-1');await ev('repBy','Sim BCBA');await ev('clrNeed','y');await ev('distRep','notyet');await sleep(350);
  await E(()=>document.getElementById('meTaskAdd').click());await sleep(150);await put('#meTasks input[data-tk="0"][data-f="what"]','Call the family (simulated)');await put('#meTasks input[data-tk="0"][data-f="due"]',ago(-3));await sleep(400);
  const o4=await E(()=>({o:openOf(S.events[0]),ul:document.getElementById('meOpen').innerText,cell:document.querySelector('#meList tbody tr').innerText}));
  await put('#meTasks input[data-tk="0"][data-f="done"]',ago(0));await ev('clrGot','From the doctor (simulated)');await ev('distRep','y');await sleep(400);
  const o5=await E(()=>({n:openOf(S.events[0]).length,ul:document.getElementById('meOpen').innerText}));
  ok('A6 what an event still needs is listed and clears as it is recorded: the parent told, the report question, the item passed or cleared, the discharge instructions and the return after outside care, the report made, the clearance, the school\'s own report, each follow-up with its date',
    o1.join('|')==='Record that the parent or guardian was told|Not yet recorded as passed, or cleared by the doctor|Answer the report question (abuse or neglect)'&&o2.includes('The discharge instructions are not recorded or attached')&&o2.includes('The return to school is not recorded')&&
    o3.join('|')==='Record the report made (when, to whom, by whom)'&&o4.o.length===3&&o4.o[0].what==='Call the family (simulated)'&&/^\d{4}-\d\d-\d\d$/.test(o4.o[0].due)&&/own incident report is not made yet/.test(o4.ul)&&/clearance to return is not received yet/.test(o4.ul)&&/Call the family \(simulated\) due /.test(o4.ul)&&o5.n===0&&/Nothing is open/.test(o5.ul),{o1,o2,o3,o4,o5});

  /* each change stamps the event */
  const u0=await E(()=>({upd:!isNaN(Date.parse(S.events[0].upd)),line:document.getElementById('meRecLine').innerText}));
  await E(()=>{const e=S.events[0],d=new Date(Date.now()-10*60000);e.rec=d.toISOString();e.upd='';renderAll();});const u1=await E(()=>document.getElementById('meRecLine').innerText);
  await ev('where','Classroom (simulated)');await sleep(400);
  const u2=await E(()=>({line:document.getElementById('meRecLine').innerText,paper:document.querySelector('#mePaper .meRec').textContent,gap:Date.parse(S.events[0].upd)-Date.parse(S.events[0].rec)}));
  ok('A7 every change stamps the event: "last changed" shows beside "First written" once it is a minute or more later, on screen and on paper',u0.upd&&!/last changed/.test(u0.line)&&!/last changed/.test(u1)&&/^First written \d+\/\d+\/\d{4} \d+:\d\d [AP]M · last changed \d+\/\d+\/\d{4} \d+:\d\d [AP]M$/.test(u2.line.trim())&&/· last changed /.test(u2.paper)&&u2.gap>=9*60000,{u0,u1,u2});

  /* ---------- B: photos and papers ---------- */
  await E(()=>{window.__toasts=[];});
  await addFiles('#mePhFile',{name:'item photo.png',mimeType:'image/png',buffer:await square('#3a7bd5',2400,1200)});
  t=await E(()=>{const a=S.events[0].att[0]||{},im=document.querySelector('#meAttList .meAtt-th img'),b=document.querySelector('#meAttList .meAtt-th');
    return {n:S.events[0].att.length,ref:nbhMedia.isRef(a.ref),mime:(nbhMedia.parse(a.ref)||{}).mime,name:a.name,kind:a.kind,at:/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(a.at),w:im&&im.naturalWidth,h:im&&im.naturalHeight,alt:im&&im.alt,box:b&&[b.offsetWidth,b.offsetHeight],toast:window.__toasts.join('|'),count:document.getElementById('meAttCount').textContent};});
  ok('B1 a photo added is shrunk to 1600 px as a JPEG, kept in the media store by reference with its name and time, and shown as a thumbnail of 44 px or more; after something swallowed it is filed as a photo of the item',t.n===1&&t.ref&&t.mime==='image/jpeg'&&t.name==='item photo.jpg'&&t.kind==='item'&&t.at&&t.w===1600&&t.h===800&&t.alt==='Photo of the item: item photo.jpg'&&t.box[0]>=44&&t.box[1]>=44&&/1 file attached/.test(t.toast)&&/^1 of 12/.test(t.count),t);
  await E(()=>{window.__toasts=[];});
  await addFiles('#meDocFile',[{name:'discharge.pdf',mimeType:'application/pdf',buffer:fakePdf(6000)},{name:'page 1.png',mimeType:'image/png',buffer:await square('#888888',3000,4000)},
    {name:'notes.pdf',mimeType:'application/pdf',buffer:Buffer.from('this is not a PDF, only named like one')},{name:'huge.pdf',mimeType:'application/pdf',buffer:fakePdf(8*1048576+10)},{name:'movie.mp4',mimeType:'video/mp4',buffer:Buffer.alloc(2000,1)}]);
  await sleep(1500);
  t=await E(()=>{const A=S.events[0].att;return {n:A.length,kinds:A.map(a=>a.kind).join(),mimes:A.map(a=>(nbhMedia.parse(a.ref)||{}).mime).join(),names:A.map(a=>a.name).join('|'),pdfSize:A[1]&&A[1].size,th:document.querySelectorAll('#meAttList .meAtt-th')[1].textContent.trim(),
    pageW:(document.querySelectorAll('#meAttList .meAtt-th img')[1]||{}).naturalHeight,toast:window.__toasts.join('|'),open:openOf(S.events[0]).length};});
  ok('B2 papers: a PDF is kept as it is and a photographed page at 2200 px, both filed as discharge papers; a file that is not a PDF or a photo is refused and so is a PDF over 8 MB, each said plainly',t.n===3&&t.kinds==='item,paper,paper'&&t.mimes==='image/jpeg,application/pdf,image/jpeg'&&t.names==='item photo.jpg|discharge.pdf|page 1.jpg'&&t.pdfSize>6000&&t.pdfSize<6200&&t.th==='PDF'&&t.pageW===2200&&/2 files attached/.test(t.toast)&&/1 PDF is larger than 8 MB and was not attached/.test(t.toast)&&/2 files were not read as a PDF or a photo/.test(t.toast),t);
  /* a photo of the student needs consent */
  const kindSel='#meAttList select[data-at="0"][data-f="kind"]';
  await E(()=>{window.__toasts=[];});await put('#meCons','');await put(kindSel,'student');await sleep(200);
  const c1=await E(s=>({k:S.events[0].att[0].kind,v:document.querySelector(s).value,toast:window.__toasts.join('|')}),kindSel);
  await E(()=>{window.__toasts=[];});await put('#meCons','no');await put(kindSel,'student');await sleep(200);
  const c2=await E(s=>({k:S.events[0].att[0].kind,toast:window.__toasts.join('|')}),kindSel);
  await put('#meCons','ic1');await put(kindSel,'student');await sleep(200);const c3=await E(()=>({k:S.events[0].att[0].kind,gate:document.getElementById('meAttGate').textContent}));
  await put('#meCons','no');await sleep(400);const c4=await E(()=>document.getElementById('meAttGate').textContent);
  await put('#meCons','other');await put('#meBy','SB');await sleep(400);const c5=await E(()=>document.getElementById('meAttGate').textContent);
  ok('B3 a photo can be filed as a photo of the student only when "Consent to photograph the student" is answered Yes, and the form says why; if the answer is later taken back, the event says a photo of the student is held without consent',c1.k==='item'&&c1.v==='item'&&/can be added only when "Consent to photograph the student" is answered Yes/.test(c1.toast)&&c2.k==='item'&&/the answer to "Consent to photograph the student" is No\. Describe the injury in words instead/.test(c2.toast)&&c3.k==='student'&&c3.gate===''&&/holds a photo of the student, and "Consent to photograph the student" is not answered Yes/.test(c4)&&c5==='',{c1,c2,c3,c4,c5});
  /* the student's photo has its own button, and the consent is asked before the camera opens */
  await E(()=>{window.__toasts=[];});await put('#meCons','');
  let chose=false;const onFc=()=>{chose=true;};p.on('filechooser',onFc);
  await p.click('#mePhStu');await sleep(500);
  const s1=await E(()=>({n:S.events[0].att.length,toast:window.__toasts.join('|')}));const chose1=chose;p.off('filechooser',onFc);
  await put('#meCons','other');
  const fcP=p.waitForEvent('filechooser',{timeout:8000});await p.click('#mePhStu');const fc=await fcP;await fc.setFiles({name:'arm.png',mimeType:'image/png',buffer:await square('#aa5533',800,600)});await sleep(1500);
  const s2=await E(()=>{const A=S.events[0].att;return {n:A.length,k:A[A.length-1].kind,name:A[A.length-1].name,labels:[document.getElementById('mePhAdd').textContent,document.getElementById('mePhStu').textContent].join('|')};});
  const fcQ=p.waitForEvent('filechooser',{timeout:8000});await p.click('#mePhAdd');const fc2=await fcQ;await fc2.setFiles({name:'floor.png',mimeType:'image/png',buffer:await square('#33aa55',640,480)});await sleep(1500);
  const s3=await E(()=>{const A=S.events[0].att;return {n:A.length,k:A[A.length-1].kind};});
  await E(()=>document.querySelector('#meAttList [data-attdel="4"]').click());await sleep(300);await E(()=>document.querySelector('#meAttList [data-attdel="3"]').click());await sleep(300);
  const s4=await E(()=>S.events[0].att.length);
  ok('B3b "Add a photo of the student" opens the camera only when the consent is answered Yes (it says why, and nothing opens), and files the photo as a photo of the student; "Add a photo (an item, a place)" never files one as the student',!chose1&&s1.n===3&&/can be added only when "Consent to photograph the student" is answered Yes/.test(s1.toast)&&s2.n===4&&s2.k==='student'&&s2.name==='arm.jpg'&&s2.labels==='Add a photo (an item, a place)|Add a photo of the student'&&s3.n===5&&s3.k==='item'&&s4===3,{chose1,s1,s2,s3,s4});
  /* opened large; twelve to an event; deleted after a question in the page */
  await E(()=>document.querySelector('#meAttList [data-attopen="0"]').click());await sleep(400);
  const d1=await E(()=>{const D=document.getElementById('meAttDlg'),im=D.querySelector('img');return {open:D.open,t:document.getElementById('meAttDlgT').textContent,w:im&&im.naturalWidth};});
  await E(()=>document.getElementById('meAttClose').click());await sleep(150);
  await E(()=>document.querySelector('#meAttList [data-attopen="1"]').click());await sleep(400);
  const d2=await E(()=>{const D=document.getElementById('meAttDlg'),f=D.querySelector('iframe');return {open:D.open,t:document.getElementById('meAttDlgT').textContent,frame:!!f&&/^blob:/.test(f.src),hint:D.innerText};});
  await E(()=>document.getElementById('meAttClose').click());await sleep(150);
  const many=[];for(let i=0;i<11;i++)many.push({name:'p'+i+'.png',mimeType:'image/png',buffer:await square('#'+(100000+i*7919).toString(16).slice(0,6),300+i,200)});
  await E(()=>{window.__toasts=[];});await addFiles('#mePhFile',many);await sleep(1200);
  const d3=await E(()=>({n:S.events[0].att.length,toast:window.__toasts.join('|')}));
  await E(()=>{window.__nc=0;document.querySelector('#meAttList [data-attdel="11"]').click();});await sleep(400);
  for(let i=10;i>=3;i--){await E(i=>document.querySelector('#meAttList [data-attdel="'+i+'"]').click(),i);await sleep(120);}
  const d4=await E(()=>({n:S.events[0].att.length,nc:window.__nc,wc:window.__wc,rows:document.querySelectorAll('#meAttList .meAtt').length}));
  ok('B4 a photo opens large and a PDF in a frame, with a way out if the pages do not show; an event holds 12, and says so; Delete asks in the page (never the browser)',d1.open&&d1.t==='Photo of the student (an injury): item photo.jpg'&&d1.w===1600&&d2.open&&d2.t==='Discharge papers: discharge.pdf'&&d2.frame&&/use Save a copy and open the file/.test(d2.hint)&&d3.n===12&&/holds up to 12 photos and papers; 2 were not attached/.test(d3.toast)&&d4.n===3&&d4.nc===9&&d4.wc===0&&d4.rows===3,{d1,d2,d3,d4});

  /* ---------- C: what leaves the form ---------- */
  await ev('what','SECRETWORD what happened, simulated.');await ev('dx','SECRETWORD the doctor said, simulated.');await ev('instr','SECRETWORD instructions.');await ev('cause','SECRETWORD cause.');await put('#meAttList input[data-at="0"][data-f="note"]','SECRETWORD note');await sleep(500);
  t=await E(()=>{const o=window.__nbhFactsOut();return {o,txt:JSON.stringify(o)};});
  ok('C1 the case facts hold how many events, the last one\'s date, kind and level of care, and what is open: no description, no diagnosis, no instruction, no photo, no paper',t.o&&t.o.medical.count===1&&t.o.medical.count90===1&&/^\d{4}-\d\d-\d\d$/.test(t.o.medical.last.date)&&t.o.medical.last.kind==='Swallowed item'&&t.o.medical.last.care==='Emergency room'&&Array.isArray(t.o.medical.open)&&!/SECRETWORD|nbh-media|data:|discharge\.pdf|item photo/.test(t.txt)&&Object.keys(t.o).join()==='medical'&&Object.keys(t.o.medical).sort().join()==='count,count90,last,open',t);
  const csvP=p.waitForEvent('download',{timeout:15000});await E(()=>document.getElementById('csvBtn').click());const csv=fs.readFileSync(await (await csvP).path(),'utf8');
  const head=csv.split('\n')[0],row=csv.split('\n').slice(1).join('\n');
  ok('C2 the CSV writes one line an event with its fields, the lists as their words, and the photos and papers only as a count',/^"Event","Kind","First written","Last changed","Late entry","Date","Time"/.test(head)&&/"Photos and papers"$/.test(head)&&/^"1","Swallowed item"/.test(row)&&/"Emergency room"/.test(row)&&/,"3"$/.test(row.trim())&&!/nbh-media|data:image|data:application/.test(csv),{head:head.slice(0,200),tail:row.slice(-120)});
  await E(()=>{S.meta.alerts='';renderAll();});
  t=await E(()=>{const r=window.__nbhFactsIn({profile:{health:{conditions:'Seizure disorder (simulated)',allergies:'peanuts (simulated)'},flags:{safety:['Pica / mouthing non-food items','Elopement','Choking risk / food stuffing']}}});return {r,al:S.meta.alerts,note:document.getElementById('meCaseNote').textContent};});
  const t2=await E(()=>{const r=window.__nbhFactsIn({profile:{health:{conditions:'Something else'}}});return {r,al:S.meta.alerts};});
  ok('C3 from the case: the health conditions and allergies fill the empty alerts line (never a line already written), and Form DM-1\'s safety precautions that bear on a medical event are named',t.r.filled===1&&t.al==='Seizure disorder (simulated); allergies: peanuts (simulated)'&&/From the case: the medical alerts\. Check them with the family and the nurse\./.test(t.note)&&/already name: Pica \/ mouthing non-food items, Choking risk \/ food stuffing\./.test(t.note)&&!/Elopement/.test(t.note)&&t2.r.filled===0&&t2.al===t.al,{t,t2});

  /* ---------- D: files ---------- */
  await E(()=>document.querySelector('#viewSeg button[data-view="events"]').click());await sleep(200);
  let dl=p.waitForEvent('download',{timeout:20000});
  await p.click('#nbhSaveQuick');   /* the toolbar's own Save data, as a person presses it (it presses #saveBtn) */
  const byPerson=fs.readFileSync(await (await dl).path(),'utf8');
  const byShell=await E(()=>window.nbhBridge.ownSave());   /* as the workstation and Autosave take the form's state */
  ok('D1 Save data pressed by a person writes the photos and the PDF inside the file (it opens anywhere); the same button pressed by the workstation or Autosave writes references, at once',/"form": "ME-1"/.test(byPerson)&&(byPerson.match(/"ref": "data:image\/jpeg;base64,/g)||[]).length===2&&(byPerson.match(/"ref": "data:application\/pdf;base64,/g)||[]).length===1&&!/nbh-media:/.test(byPerson)&&
    (byShell.match(/"ref": "nbh-media:/g)||[]).length===3&&!/data:(image|application)/.test(byShell)&&byShell.length<byPerson.length/3,{person:byPerson.length,shell:byShell.length});
  const before=await E(()=>JSON.stringify(S));
  await E(()=>{S=blank();CUR=-1;renderAll();});
  await p.setInputFiles('#fileIn',{name:'me1.json',mimeType:'application/json',buffer:Buffer.from(byPerson)});await sleep(1800);
  t=await E(()=>({same:JSON.stringify(S),refs:S.events[0].att.map(a=>nbhMedia.isRef(a.ref)).join(),cur:CUR,rows:document.querySelectorAll('#meList tbody tr').length,att:document.querySelector('#meList tbody tr').innerText}));
  ok('D2 that file opens again: the same record, its photos and papers back in the media store by reference',t.same===before&&t.refs==='true,true,true'&&t.rows===1,{refs:t.refs,rows:t.rows,eq:t.same===before});
  await p.setInputFiles('#fileIn',{name:'odd.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'ME-1',rev:'2026-11',S:{meta:{client:'SIMULATED – Partial',photoConsent:'maybe'},chk:{printOne:'yes'},
    events:[{kind:'bogus',date:'10/1/2026',care:'spa',seen:'y',what:'Simulated.',tasks:[{what:'One'},'x'],att:[{ref:'javascript:alert(1)',name:'x'},{ref:'data:text/html;base64,PGI+',name:'y'},{ref:'data:image/png;base64,iVBORw0KGgo=',name:'ok<>.png',kind:'weird',note:'n'}]},'junk',{id:'same'},{id:'same'}]}}))});await sleep(700);
  t=await E(()=>({c:S.meta.client,cons:S.meta.photoConsent,chk:S.chk.printOne,n:S.events.length,k:S.events[0].kind,care:S.events[0].care,seen:S.events[0].seen,tk:S.events[0].tasks.length,att:S.events[0].att.map(a=>a.name+':'+a.kind).join(),ids:new Set(S.events.map(e=>e.id)).size,rows:document.querySelectorAll('#meList tbody tr').length}));
  await p.setInputFiles('#fileIn',{name:'other.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'IM-1',S:{}}))});await sleep(400);
  const al=await E(()=>({al:(window.__al||[]).join('|'),c:S.meta.client}));
  ok('D3 a partial or odd file opens with what can be read: an unknown kind or answer dropped, an attachment that is not a picture or a PDF dropped, each event with its own id; a file saved by another form is refused and nothing changes',t.c==='SIMULATED – Partial'&&t.cons===undefined&&t.chk===false&&t.n===3&&t.k===''&&t.care===''&&t.seen==='y'&&t.tk===1&&t.att==='ok .png:other'&&t.ids===3&&t.rows===3&&/saved by Form IM-1, not by Form ME-1\. Nothing was changed/.test(al.al)&&al.c==='SIMULATED – Partial',{t,al});

  /* ---------- P: paper ---------- */
  await E(()=>document.getElementById('simBtn').click());await sleep(1800);
  t=await E(()=>({n:S.events.length,att:S.events.map(e=>e.att.length).join(),ref:nbhMedia.isRef((S.events[2].att[0]||{}).ref),names:JSON.stringify(S).match(/Sim Student \(example\)/)?1:0,sim:(JSON.stringify(S.events).match(/[Ss]imulated/g)||[]).length,ph:document.getElementById('mePhPrintOn').checked}));
  ok('P0 the simulation: three invented events (something swallowed, a long seizure, a fall), each line marked simulated, one drawn picture attached, the photo box unticked',t.n===3&&t.att==='0,0,1'&&t.ref&&t.names===1&&t.sim>=40&&!t.ph,t);
  await p.emulateMedia({media:'print'});await sleep(200);
  const p1=await E(()=>{const P=document.getElementById('mePaper'),vis=el=>!!el&&getComputedStyle(el).display!=='none';return {paper:vis(P),edit:vis(document.getElementById('meEdit')),evs:P.querySelectorAll('.meEv').length,figs:P.querySelectorAll('figure img').length,txt:P.innerText,imgs:[...document.querySelectorAll('img')].filter(i=>i.offsetParent&&/^blob:|^data:image\/jpeg/.test(i.src)).length};});
  await p.emulateMedia({media:'screen'});
  await E(()=>{const c=document.getElementById('mePhPrintOn');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));CUR=1;renderAll();const o=document.querySelector('[data-c="printOne"]');o.checked=true;o.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.emulateMedia({media:'print'});await sleep(300);
  const p2=await E(()=>{const P=document.getElementById('mePaper');return {evs:P.querySelectorAll('.meEv').length,txt:P.innerText.slice(0,200),one:document.body.classList.contains('me-one'),all:getComputedStyle(document.querySelector('.meAll')).display,stu:getComputedStyle(document.querySelector('.only-events .fieldgrid')).display!=='none'};});
  await E(()=>{CUR=2;renderAll();});await sleep(300);
  const p3=await E(()=>{const P=document.getElementById('mePaper');return {evs:P.querySelectorAll('.meEv').length,figs:P.querySelectorAll('figure img').length,cap:(P.querySelector('figcaption')||{}).innerText||''};});
  const pdf=path.join(OUT,'me1.pdf');await p.pdf({path:pdf,format:'Letter',printBackground:true});const pt=flat(pdfText(pdf));
  await p.emulateMedia({media:'screen'});
  ok('P1 on paper each event is written out with only what was entered, its attachments listed by name; photos are left out unless "Include the photos when printing" is ticked',p1.paper&&!p1.edit&&p1.evs===3&&p1.figs===0&&p1.imgs===0&&/Medical event 3 · Swallowed item/.test(p1.txt)&&/Medical event 2 · Seizure/.test(p1.txt)&&/It lasted about 7 minutes\./.test(p1.txt)&&/photos are not printed with this copy/.test(p1.txt)&&/Photo of the item: simulated-item\.jpg/.test(p1.txt)&&!/Epinephrine given|Temperature, if taken|Rescue medicine given\s*–/.test(p1.txt)&&/Signature/.test(p1.txt),{evs:p1.evs,figs:p1.figs,imgs:p1.imgs,txt:p1.txt.slice(0,300)});
  ok('P2 "Print only the event that is open" prints the student\'s line and that one event, without the list of events or what the others still need; with the photo box ticked its photo prints with what it is, when it was added and by whom',p2.evs===1&&/^Medical event 2 · Seizure/.test(p2.txt.trim())&&p2.one&&p2.all==='none'&&p2.stu&&!/about 7 minutes/.test(pt||'x about 7 minutes')&&!/Medical Events/.test(pt||'Medical Events')&&/Sim Student \(example\)/.test(pt||'')&&p3.evs===1&&p3.figs===1&&/Photo of the item/.test(p3.cap)&&/added by SB/.test(p3.cap)&&!!pt&&/Medical event 3/.test(pt)&&/Still open/.test(pt)&&!/Medical event 2/.test(pt),{p2,p3,pt:pt?pt.slice(0,200):'no text'});
  await p.close();

  /* ---------- S: in the workstation ---------- */
  const s=await ctx.newPage();s.on('pageerror',e=>errs.push('shell: '+e.message));
  await s.goto(L.shellUrl());await sleep(1500);
  await s.evaluate(()=>{window.confirm=()=>true;wsUI.confirm=async()=>true;wsUI.prompt=async()=>'';window.__toasts=[];const T=wsUI.toast;wsUI.toast=(m,o)=>{window.__toasts.push(String(m));return T(m,o);};});
  await s.evaluate(async()=>{try{await nbhMedia.sweep([]);}catch(e){}});
  t=await s.evaluate(()=>({rail:document.querySelectorAll('#rail .item').length,row:[...document.querySelectorAll('#rail .item')].some(r=>/ME-1/.test(r.textContent)&&/Medical Event Record/.test(r.textContent)),short:FORM_SHORT['ME-1'],kw:/seizure/.test(FORM_KW['ME-1'])&&/swallowed/.test(FORM_KW['ME-1'])}));
  ok('S1 the workstation lists 49 forms, Form ME-1 among the specialist protocols, found by "seizure" or "swallowed"',t.rail===49&&t.row&&t.short==='Medical events'&&t.kw,t);
  await s.evaluate(()=>openForm('ME-1'));await s.waitForFunction(()=>!!state.status['ME-1']&&!!state.frames['ME-1'],null,{timeout:40000}).catch(()=>{});await sleep(1500);
  const fr0=s.frames().find(f=>f!==s.mainFrame()&&L.frameIs(f,'ME-1',FILE));
  await fr0.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2000);await s.evaluate(()=>gatherFacts());await sleep(600);
  const pk=await s.evaluate(()=>{const asked=[];const c=window.confirm;window.confirm=m=>{asked.push(String(m));return false;};
    document.getElementById('tickUsed').click();const filled=((state.status['ME-1']||{}).filled||0),auto=!!state.ticked['ME-1'];
    const tk=()=>document.querySelector('#rail [data-tick="ME-1"]');
    if(tk())tk().click();const no=!!state.ticked['ME-1'];
    window.confirm=m=>{asked.push(String(m));return true;};if(tk())tk().click();const yes=!!state.ticked['ME-1'];window.confirm=c;state.ticked['ME-1']=false;renderRail();
    return {filled,auto,no,yes,asked:asked.length,q:asked[0]||'',takes:JSON.stringify(PK_TAKES).indexOf('ME-1')};});
  ok('S1b Form ME-1 goes into a packet only by hand: "tick the forms in use" leaves it out, ticking it asks first (it holds medical information), and the staff and family packets never take it',pk.filled>4&&!pk.auto&&!pk.no&&pk.yes&&pk.asked===2&&/Form ME-1 holds medical information: what happened, what a doctor said and the discharge instructions/.test(pk.q)&&pk.takes<0,pk);
  const fr=s.frames().find(f=>f!==s.mainFrame()&&L.frameIs(f,'ME-1',FILE));
  await fr.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2000);
  await fr.evaluate(async b64=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);CUR=2;renderAll();await attAdd([new File([u],'discharge.pdf',{type:'application/pdf'})],true);},fakePdf(6000).toString('base64'));await sleep(800);
  t=await s.evaluate(async()=>{await gatherFacts();const f=state.facts||{},m=f.medical||{};const L=tdSafety(f).filter(x=>x.k==='Medical');
    return {count:m.count,src:(f.src||{}).medical,open:(m.open||[]).length,list:L.length,first:L[0]&&L[0].t,opens:L[0]&&L[0].open,txt:JSON.stringify(m),bits:(document.getElementById('factsBody')||document.body).innerText.indexOf('Medical events')>=0};});
  ok('S2 the case takes the medical facts from Form ME-1, and Today lists what each event still needs under "Medical", opening Form ME-1; nothing of what happened, the diagnosis or the attachments is in them',t.count===3&&t.src==='ME-1'&&t.open>=2&&t.list===t.open&&/^Swallowed item of \d+\/\d+\/\d{4}: /.test(t.first||'')&&t.opens==='ME-1'&&!/nbh-media|data:|bead|X-ray|blocked/i.test(t.txt),t);
  const dlP=s.waitForEvent('download',{timeout:30000}).catch(()=>null);
  await s.evaluate(()=>{document.getElementById('pClient').value='Sim Student (example)';document.getElementById('pClient').dispatchEvent(new Event('input'));saveCase();});
  const cdl=await dlP;let ctxt='';if(cdl)ctxt=fs.readFileSync(await cdl.path(),'utf8');await sleep(1200);
  const cl=await s.evaluate(async()=>{const L=await clList()||[];const r=L.find(x=>/Sim Student/.test(x.client||''));return r?{len:r.text.length,ref:(r.text.match(/nbh-media:/g)||[]).length,data:/data:(image\/jpeg|application\/pdf)/.test(r.text)}:{none:true};});
  ok('S3 Save case: the file carries the photo and the PDF inside it (no reference), while the copy kept on this device holds the two references',!!cdl&&/data:image\/jpeg;base64,/.test(ctxt)&&/data:application\/pdf;base64,/.test(ctxt)&&!/nbh-media:/.test(ctxt)&&cl.ref===2&&!cl.data&&cl.len<ctxt.length,{file:ctxt.length,cl});
  const re=await s.evaluate(async t=>{window.__toasts=[];await clearCase();await openCaseText(t,null,{asked:true});await new Promise(r=>setTimeout(r,2500));
    const snap=JSON.stringify(((state.forms||{})['ME-1']||{}).snap||(state.saved||{})['ME-1']||'');const L=await clList()||[];const r=L.find(x=>/Sim Student/.test(x.client||''));
    return {toast:window.__toasts.find(x=>/now kept on this device/.test(x))||'',cl:r?{ref:(r.text.match(/nbh-media:/g)||[]).length,data:/data:(image\/jpeg|application\/pdf)/.test(r.text)}:null,st:await nbhMedia.stat()};},ctxt);
  await s.evaluate(()=>openForm('ME-1'));await s.waitForFunction(()=>!!state.status['ME-1']&&!!state.frames['ME-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
  const fr2=s.frames().find(f=>f!==s.mainFrame()&&L.frameIs(f,'ME-1',FILE));
  const back=await fr2.evaluate(async()=>{const A=S.events.flatMap(e=>e.att);CUR=S.events.findIndex(e=>e.att.length);renderAll();await new Promise(r=>setTimeout(r,900));const im=document.querySelector('#meAttList .meAtt-th img');
    return {n:S.events.length,att:A.length,refs:A.map(a=>nbhMedia.isRef(a.ref)).join(),mimes:A.map(a=>(nbhMedia.parse(a.ref)||{}).mime).sort().join(),w:im&&im.naturalWidth,pdf:!!(await nbhMedia.get(A.find(a=>/pdf/.test(a.ref)).ref)),client:S.meta.client};});
  ok('S4 that case file opens again: the photo and the PDF go back to the media store (said once), and Form ME-1 shows them',/2 sounds and pictures \(0\.0 MB\) now kept on this device/.test(re.toast)&&re.cl&&re.cl.ref===2&&!re.cl.data&&back.n===3&&back.att===2&&back.refs==='true,true'&&back.mimes==='application/pdf,image/jpeg'&&back.w===800&&back.pdf&&back.client==='Sim Student (example)',{re,back});
  const sw=await s.evaluate(async()=>{MEDIA_GRACE=0;const f=state.frames['ME-1'];const held=!!(f&&f.contentWindow&&typeof f.contentWindow.nbhMediaHeld==='function'&&/nbh-media:/.test(f.contentWindow.nbhMediaHeld()));
    await nbhMedia.put(new Blob([new Uint8Array(5000)],{type:'image/png'}));const a=(await nbhMedia.stat()).count;const gone=await mediaSweep();return {held,a,gone,left:(await nbhMedia.stat()).count};});
  ok('S5 the sweep deletes what nothing refers to and keeps Form ME-1\'s photo and PDF (the form tells the workstation what it holds)',sw.held&&sw.a===3&&sw.gone===1&&sw.left===2,sw);
  await s.close();
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
