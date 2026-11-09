/* v25.71 case isolation: nothing of one student's case may reach the next student's. Simulated students only.
   The bug (found by qa/student-journey-test.js E5, E5b, E12): Close case saves the case, and the caseload's copy, written while
   the file goes out, reads the case from the forms once more. Save and close then cleared the forms while that read was still
   waiting for a form it had asked (a closed form never answers: the read waits its 4 s), and the read, finishing, put the first
   student's case facts back. The next student's case file, packet file, caseload copy and safety copy then carried the first
   student's consent (IC-1), records review (RR-1), assessments (IA-1, IN-1) and observation statement (OB-1), none of which
   were open for the second student. The same held for a student opened from Caseload while a read ran.
   The first student is "Mateo Rivera" (ID 4471823, simulated) with Forms DM-1, IC-1, RR-1, IA-1, IN-1 and OB-1 holding their
   simulations; the second is "SIMULATED – Sample Student" with DM-1, TB-1 and DD-1 holding theirs (as in the journey).
   Each scenario scans every file the second student's case writes (Save case, Save student details, the caseload copy, the
   safety copy, the case facts on screen) for the first student's name, initials, ID, and every statement and value his
   IC-1, RR-1, IA-1, IN-1 and OB-1 gave the case, and for any part of the case taken from a form not open for the second.
   C  Close case (Save and close), answered at once, then the next student at once (the journey's sequence).
   S  the same with Form OB-1 left mid-edit and slow to answer (its answers held 2.5 s; an observation half typed, a box
      open in it), and a read of the case started just before Close case.
   W  the next student opened from Caseload (Keep it on this iPad and switch) while a read of the first student's case runs
      (Form OB-1's answers held 6 s).
   K  the first student's own caseload copy and case file keep his case facts (the copy is of the case saved, not of
      whatever is on screen by the time it is written).
   usage: WS_URL=http://127.0.0.1:8171 node qa/v2571-case-isolation-test.js [C S W]   results in qa/out/v2571-case-isolation/ */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const OUT=path.join(__dirname,'out','v2571-case-isolation');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const A={client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const B={client:'SIMULATED – Sample Student'};
const A_FORMS=['DM-1','IC-1','RR-1','IA-1','IN-1','OB-1'],A_ONLY=['IC-1','RR-1','IA-1','IN-1','OB-1'],B_FORMS=['DM-1','TB-1','DD-1'];
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/,/\bM\.\s?R\.(?![a-z])/];
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const errs=[];
let chromium=L.chromium,br;
async function newPage(tag){
  const c=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',acceptDownloads:true,userAgent:IPAD_UA});
  await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);
  /* nothing kept from before: the caseload and the safety copies emptied, no box open */
  await p.evaluate(async()=>{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));try{await window.nbhCopies.clear();}catch(e){}
    ['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  return {c,p};}
const frameOf=(p,id)=>p.frames().find(f=>f!==p.mainFrame()&&decodeURIComponent(f.url()).includes(FILE[id]));
async function setBar(p,o){await p.evaluate(o=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v||'';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',o.client);set('#pSid',o.sid);set('#pGrade',o.grade);set('#pSite',o.site);set('#pBcba',o.bcba);},o);await sleep(300);}
async function answerIn(fr){for(let i=0;i<3;i++){const o=await fr.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){d.querySelector('.u-f button:last-child').click();return true;}return false;}).catch(()=>false);if(!o)break;await sleep(900);}}
async function openForm(p,id,sim){await p.evaluate(id=>openForm(id),id);
  await p.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:60000});await sleep(1300);const fr=frameOf(p,id);
  if(sim&&fr){await L.loadSim(fr);await sleep(1200);await answerIn(fr);await sleep(600);}return fr;}
/* the workstation's question box: the button whose words match, as soon as the box with that title is open */
async function answer(p,titleRe,btnRe,ms){const t=Date.now();while(Date.now()-t<(ms||15000)){
  const r=await p.evaluate(([tr,br])=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;if(!new RegExp(tr).test(t))return null;
    const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(br).test(x.textContent));if(!b)return {t,none:[...document.querySelectorAll('#cfFoot button')].map(x=>x.textContent)};b.click();return {t};},[titleRe.source,btnRe.source]).catch(()=>null);
  if(r)return r;await sleep(60);}return null;}
async function closeBoxes(p){await p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open){const b=[...d.querySelectorAll('button')].find(x=>/^(OK|Close|Not now|It is in Files)$/.test(x.textContent.trim()));if(b)b.click();else d.close();}});}).catch(()=>{});}
async function download(p,click,tag){const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(click);const d=await dl;const f=path.join(OUT,tag+'-'+d.suggestedFilename());await d.saveAs(f);return f;}
/* the first student's case: the bar, then each form with its simulation (DM-1 left as the bar fills it) */
async function caseA(p){await setBar(p,A);
  for(const id of A_FORMS)await openForm(p,id,id!=='DM-1');
  await sleep(1500);await p.evaluate(()=>gatherFacts(true));await sleep(1200);
  const f=await p.evaluate(async()=>{await gatherFacts(false);return JSON.parse(JSON.stringify(state.facts||{}));});
  return f;}
/* the second student's own case, made alone on a fresh page: a value her own forms' simulations give (a generic phrase both
   students' simulations share) is hers too and is not counted as the first student's */
let B_OWN='';
async function baselineB(){const {c,p}=await newPage('base');await setBar(p,B);for(const id of B_FORMS)await openForm(p,id,true);await sleep(2500);
  const f=await download(p,()=>$('#saveCase').click(),'base-B-case');B_OWN=fs.readFileSync(f,'utf8');
  B_OWN+=JSON.stringify(await p.evaluate(async()=>{await gatherFacts(false);return state.facts;}));await c.close();}
/* what the first student's IC-1, RR-1, IA-1, IN-1 and OB-1 gave the case: every string of 12 characters or more (not one the
   second student's own forms give) */
function aStrings(f){const L=[];const walk=v=>{if(typeof v==='string'){const s=v.trim();if(s.length>=12&&!/^\d{4}-\d\d-\d\d/.test(s))L.push(s);}else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
  const src=f.src||{};Object.keys(f).forEach(k=>{if(k==='src'||k==='student'||k==='when')return;if(k==='evidence'){A_ONLY.forEach(id=>walk((f.evidence||{})[id]));return;}if(k==='replies'){A_ONLY.forEach(id=>walk((f.replies||{})[id]));return;}
    if(A_ONLY.includes(src[k]))walk(f[k]);});return [...new Set(L)].filter(s=>!B_OWN.includes(s)&&!B_OWN.includes(JSON.stringify(s).slice(1,-1)));}
/* the second student's text: what of the first is in it */
function leaks(text,strs){const t=String(text||'');const out=A_MARKS.filter(re=>re.test(t)).map(String);
  strs.forEach(s=>{const j=JSON.stringify(s).slice(1,-1);if(t.includes(s)||t.includes(j))out.push('statement: '+s.slice(0,80));});return out;}
/* the parts of a case's facts that came from a form not open for the second student */
function foreignParts(f){if(!f)return [];const src=f.src||{},out=[];Object.keys(src).forEach(k=>{const v=String(src[k]||'');if(A_ONLY.some(id=>v.split(/,\s*/).includes(id)))out.push(k+' from '+v);});
  Object.keys(f.evidence||{}).forEach(id=>{if(!B_FORMS.includes(id))out.push('evidence '+id);});Object.keys(f.replies||{}).forEach(id=>{if(!B_FORMS.includes(id))out.push('replies '+id);});return out;}
/* the second student's case, with the forms' simulations, and every file and copy it writes */
async function caseB(p,tag,strs){await sleep(300);
  for(const id of B_FORMS)await openForm(p,id,true);
  await sleep(2500);
  const onScreen=await p.evaluate(async()=>{await gatherFacts(false);return {facts:JSON.parse(JSON.stringify(state.facts||{})),client:packet().client};});
  ok(tag+': the bar holds the second student',onScreen.client===B.client,onScreen.client);
  ok(tag+': the case facts on screen hold nothing of the first student',!leaks(JSON.stringify(onScreen.facts),strs).length&&!foreignParts(onScreen.facts).length,{leaks:leaks(JSON.stringify(onScreen.facts),strs),parts:foreignParts(onScreen.facts)});
  /* the safety copy (Autosave) of her case before it is saved: written at once */
  await p.evaluate(async()=>{for(let i=0;i<50&&state.auto.busy;i++)await new Promise(r=>setTimeout(r,100));state.auto.last=0;state.autoSig='';await autoSave(true);});await sleep(500);
  const cp=await p.evaluate(async()=>(await window.nbhCopies.list()||[]).map(r=>({student:r.student,text:JSON.stringify(r)})));const cpb=cp.filter(r=>/Sample Student/.test(r.student));
  fs.writeFileSync(path.join(OUT,tag+'-copies.json'),JSON.stringify(cp.map(r=>({student:r.student,size:r.text.length})),null,1));
  ok(tag+': the second student’s safety copy (Autosave) holds nothing of the first',cpb.length>0&&cpb.every(r=>!leaks(r.text,strs).length&&!foreignParts(JSON.parse(r.text).facts).length),cpb.length?cpb.map(r=>({leaks:leaks(r.text,strs),parts:foreignParts(JSON.parse(r.text).facts)})):cp.map(r=>r.student));
  const fc=await download(p,()=>$('#saveCase').click(),tag+'-case');await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);
  const tc=fs.readFileSync(fc,'utf8'),jc=JSON.parse(tc);
  ok(tag+': the second student’s case file (Save case) holds nothing of the first',/Sample Student/.test(tc)&&!leaks(tc,strs).length&&!foreignParts(jc.facts).length,{leaks:leaks(tc,strs),parts:foreignParts(jc.facts)});
  const fp=await download(p,()=>$('#savePacket').click(),tag+'-packet');await answer(p,/./,/^OK$|It is in Files/,1500);await closeBoxes(p);
  const tp=fs.readFileSync(fp,'utf8'),jp=JSON.parse(tp);
  ok(tag+': the second student’s packet file (Save student details) holds nothing of the first',/Sample Student/.test(tp)&&!leaks(tp,strs).length&&!foreignParts(jp.facts).length,{leaks:leaks(tp,strs),parts:foreignParts(jp.facts)});
  await sleep(1500);
  const cl=await p.evaluate(async()=>(await clList()||[]).map(r=>({client:r.client,text:r.text,sum:JSON.stringify(r.sum||{})})));const cb=cl.find(r=>/Sample Student/.test(r.client));
  fs.writeFileSync(path.join(OUT,tag+'-caseload.json'),JSON.stringify(cl,null,1));
  ok(tag+': the second student’s caseload copy holds nothing of the first',!!cb&&!leaks(cb.text+cb.sum,strs).length&&!foreignParts(JSON.parse(cb.text).facts).length,cb?{leaks:leaks(cb.text+cb.sum,strs),parts:foreignParts(JSON.parse(cb.text).facts)}:cl.map(r=>r.client));
  return {fc,fp,cl};}
/* Close case: Save and close, each question answered as soon as it is asked; the frames gone, the next student at once */
async function closeAndNext(p,tag){
  const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>$('#closeCase').click());
  const q=await answer(p,/^Close this case/,/^Save and close/,15000);
  const d=await dl;const f=path.join(OUT,tag+'-A-close-'+d.suggestedFilename());await d.saveAs(f);
  await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
  await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});
  await setBar(p,B);return {q,f};}
function checkA(tag,fA,strs,cl){
  const ta=fs.readFileSync(fA,'utf8'),ja=JSON.parse(ta),ca=cl.find(r=>/Mateo/.test(r.client));
  ok(tag+' K: the first student’s case file keeps his case facts (consent, records, assessments, observation)',/Mateo Rivera/.test(ta)&&A_ONLY.every(id=>JSON.stringify((ja.facts||{}).src||{}).includes(id)),Object.assign({},(ja.facts||{}).src));
  const cf=ca&&JSON.parse(ca.text).facts||{};
  ok(tag+' K: the first student’s caseload copy keeps his case facts and his summary',!!ca&&A_ONLY.every(id=>JSON.stringify(cf.src||{}).includes(id))&&strs.length>0&&strs.some(s=>ca.text.includes(JSON.stringify(s).slice(1,-1))),ca?{src:cf.src,sum:ca.sum.slice(0,300)}:'no copy');
}
(async()=>{
  br=await chromium.launch();
  await baselineB();
  if(want('C')){const {c,p}=await newPage('C');
    const fa=await caseA(p);const strs=aStrings(fa);fs.writeFileSync(path.join(OUT,'C-A-facts.json'),JSON.stringify({fa,strs},null,1));
    ok('C: the first student’s forms gave the case his consent, records review, assessments and observation ('+strs.length+' statements and values)',A_ONLY.every(id=>JSON.stringify(fa.src||{}).includes(id))&&strs.length>=5,fa.src);
    const {q,f}=await closeAndNext(p,'C');ok('C: Close case asked and saved',!!q&&fs.existsSync(f),q);
    const r=await caseB(p,'C',strs);checkA('C',f,strs,r.cl);await c.close();}
  if(want('S')){const {c,p}=await newPage('S');
    const fa=await caseA(p);const strs=aStrings(fa);
    /* OB-1 mid-edit: an observation half typed, a box open, and its answers to the workstation held 2.5 s (a form busy) */
    const ob=frameOf(p,'OB-1');
    const mid=await ob.evaluate(()=>{const i=document.querySelector('#o0setting,[id^="o"][id$="setting"]');if(i){i.value='Room 14 (half typed';i.dispatchEvent(new Event('input',{bubbles:true}));}
      const d=document.querySelector('dialog:not([open])');if(d&&d.showModal){try{d.showModal();}catch(e){}}
      window.addEventListener('message',e=>{const x=e.data||{};if(x.nbh==='facts?'&&!e.__held){e.stopImmediatePropagation();const src=e.source,ori=e.origin;setTimeout(()=>{const m=new MessageEvent('message',{data:x,origin:ori,source:src});m.__held=true;window.dispatchEvent(m);},2500);}},true);
      return {typed:!!i,box:!!(d&&d.open)};});
    ok('S: Form OB-1 is left mid-edit and slow to answer',mid.typed,mid);
    p.evaluate(()=>{gatherFacts(true);}).catch(()=>{});await sleep(200);   /* a read of the case under way (a form's change a moment ago) */
    const {q,f}=await closeAndNext(p,'S');ok('S: Close case asked and saved',!!q&&fs.existsSync(f),q);
    const r=await caseB(p,'S',strs);checkA('S',f,strs,r.cl);await c.close();}
  if(want('W')){const {c,p}=await newPage('W');
    /* the second student first, saved and kept on this iPad; then the first, from whose case Caseload switches back */
    await setBar(p,B);for(const id of B_FORMS)await openForm(p,id,true);await sleep(1500);
    await download(p,()=>$('#saveCase').click(),'W-B0-case');await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);
    const dl0=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>$('#closeCase').click());await answer(p,/^Close this case/,/^Save and close/,15000);await dl0;
    await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);await p.waitForFunction(()=>!Object.keys(state.frames).length,null,{timeout:20000});
    const fa=await caseA(p);const strs=aStrings(fa);
    const ob=frameOf(p,'OB-1');await ob.evaluate(()=>{window.addEventListener('message',e=>{const x=e.data||{};if(x.nbh==='facts?'&&!e.__held){e.stopImmediatePropagation();const src=e.source,ori=e.origin;setTimeout(()=>{const m=new MessageEvent('message',{data:x,origin:ori,source:src});m.__held=true;window.dispatchEvent(m);},6000);}},true);});
    await p.evaluate(()=>caseloadOpen());await p.waitForFunction(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>=1,null,{timeout:10000});await sleep(400);
    await p.evaluate(()=>{const r=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(r=>/Sample Student/.test(r.innerText));r.querySelector('.cl-card-acts button[data-clopen]').click();});
    await p.waitForFunction(()=>{const g=document.getElementById('cfDlg');return g&&g.open&&/^Switch to/.test(document.getElementById('cfTitle').textContent);},null,{timeout:4000}).catch(()=>{});
    p.evaluate(()=>{gatherFacts(true);}).catch(()=>{});await sleep(300);   /* a read of his case under way as the switch is answered */
    const sw=await answer(p,/^Switch to/,/^Keep it on this|^Switch anyway|^Save first/,2000);
    await p.waitForFunction(c=>packet().client===c&&$('#openCase').textContent==='Open case'&&!state.restoring,B.client,{timeout:30000});await sleep(5000);await closeBoxes(p);
    const now=await p.evaluate(()=>JSON.parse(JSON.stringify(state.facts||{})));
    ok('W: the second student opened from Caseload while the first student’s case was being read: her case facts hold nothing of his'+(sw?'':' (no switch question)'),!leaks(JSON.stringify(now),strs).length&&!foreignParts(now).length,{leaks:leaks(JSON.stringify(now),strs),parts:foreignParts(now)});
    const fc=await download(p,()=>$('#saveCase').click(),'W-B-case');await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);
    const tc=fs.readFileSync(fc,'utf8');ok('W: her case file saved after the switch holds nothing of the first student',/Sample Student/.test(tc)&&!leaks(tc,strs).length&&!foreignParts(JSON.parse(tc).facts).length,{leaks:leaks(tc,strs),parts:foreignParts(JSON.parse(tc).facts)});
    const cl=await p.evaluate(async()=>(await clList()||[]).map(r=>({client:r.client,text:r.text,sum:JSON.stringify(r.sum||{})})));const ca=cl.find(r=>/Mateo/.test(r.client)),cb=cl.find(r=>/Sample Student/.test(r.client));
    ok('W: the caseload copies: hers holds nothing of his, and his (kept at the switch) keeps his case facts',!!ca&&!!cb&&!leaks(cb.text+cb.sum,strs).length&&A_ONLY.every(id=>JSON.stringify((JSON.parse(ca.text).facts||{}).src||{}).includes(id)),{b:cb&&leaks(cb.text+cb.sum,strs),a:ca&&(JSON.parse(ca.text).facts||{}).src});
    await c.close();}
  ok('no script error',!errs.length,errs.slice(0,8));
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s) of '+n:'RESULT: all '+n+' passed');process.exit(fails?1:0);
})().catch(async e=>{console.error(e);try{await br.close();}catch(x){}process.exit(1);});
