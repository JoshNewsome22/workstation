/* v25.72 case isolation, the Save case family: what is written for one student holds only that student. Simulated students only.
   Relatives of the v25.71 case-facts race (qa/v2571-case-isolation-test.js). Each began the same way: something read the case
   over several waits (a slow form is waited for up to 25 s), another case was opened meanwhile, and the reader went on, now
   reading the next student's forms, facts, photo and papers into the first student's file, caseload copy or case history.
   The first student is "Mateo Rivera" (ID 4471823), the second "Priya Nandakumar" (5530917), the third "Devon Achterberg"
   (6620458); all simulated. A form "answers late" by the workstation's request reaching it late (hold).
   S  Save case is reading a slow form; Caseload, the second student, Switch anyway. Before: the first student's case file,
      caseload copy and case history point were written with the second student's forms.
   C  the same through Close case (Save and close): the case opened meanwhile is not the one closed.
   K  Keep it on this device and switch, overtaken by a third student: the first student's kept copy holds only his.
   R  the name and ID at the top retyped to another kept student's: Save case asks before replacing that student's kept case
      (it used to replace it, and with Google Drive that student's file, without a word); Cancel leaves everything.
   P  a form's own safety copy (it carries no student details) restored from Autosave over an open case: the last student's
      name, ID, photo, file and case id are not left on it.
   F  Caseload, Read every linked sheet: the student on screen changes between two sheets; a sheet read for one student is
      not put into the next student's Form DD-1 (the sheet reader is stood in for; no Google here).
   X  a case history point begun for one student is not written from, or filed under, the student opened meanwhile.
   O  a form of the case holds another student's name (the strip says so): Save case asks before it saves, as Build packet
      does before it prints (the BCBA, 11/10). Cancel writes nothing; Save anyway is not asked again for the same forms.
   usage: WS_URL=http://127.0.0.1:8171 node qa/v2572-save-isolation-test.js [S C K R P F X O]   results in qa/out/v2572-save-isolation/ */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const A={client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const B={client:'Priya Nandakumar',sid:'5530917',grade:'2',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const A_FORMS=['DM-1','IC-1','RR-1','IA-1','IN-1','OB-1'],B_FORMS=['DM-1','TB-1','DD-1'];
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/],B_MARKS=[/Priya/i,/Nandakumar/i,/5530917/];
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const errs=[];let br=null;
async function newPage(tag,OUT){
  const c=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',acceptDownloads:true,userAgent:IPAD_UA});
  await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  p.__dl=[];p.on('download',async d=>{try{const f=path.join(OUT,tag+'-'+p.__dl.length+'-'+d.suggestedFilename());await d.saveAs(f);p.__dl.push({name:d.suggestedFilename(),file:f,at:Date.now()});}catch(e){}});
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);
  await p.evaluate(async()=>{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));try{await window.nbhCopies.clear();}catch(e){}try{await hxWipe();}catch(e){}
    ['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  return {c,p};}
const frameOf=(p,id)=>p.frames().find(f=>f!==p.mainFrame()&&decodeURIComponent(f.url()).includes(FILE[id]));
async function setBar(p,o){await p.evaluate(o=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v||'';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',o.client);set('#pSid',o.sid);set('#pGrade',o.grade);set('#pSite',o.site);set('#pBcba',o.bcba);},o);await sleep(300);}
async function answerIn(fr){for(let i=0;i<3;i++){const o=await fr.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){d.querySelector('.u-f button:last-child').click();return true;}return false;}).catch(()=>false);if(!o)break;await sleep(900);}}
async function openForm(p,id,sim){await p.evaluate(id=>openForm(id),id);
  await p.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:60000});await sleep(1300);const fr=frameOf(p,id);
  if(sim&&fr){await L.loadSim(fr);await sleep(1200);await answerIn(fr);await sleep(600);}return fr;}
async function answer(p,titleRe,btnRe,ms){const t=Date.now();while(Date.now()-t<(ms||15000)){
  const r=await p.evaluate(([tr,br])=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;if(!new RegExp(tr).test(t))return null;
    const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(br).test(x.textContent));if(!b)return {t,none:[...document.querySelectorAll('#cfFoot button')].map(x=>x.textContent)};b.click();return {t};},[titleRe.source,btnRe.source]).catch(()=>null);
  if(r)return r;await sleep(60);}return null;}
async function closeBoxes(p){return await p.evaluate(()=>{const out=[];['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open){out.push((d.querySelector('#cfTitle,#dlgTitle,h2,h3')||d).textContent.trim().slice(0,200));const b=[...d.querySelectorAll('button')].find(x=>/^(OK|Close|Not now|It is in Files)$/.test(x.textContent.trim()));if(b)b.click();else d.close();}});return out;}).catch(()=>[]);}
async function waitDl(p,n,ms){const t=Date.now();while(Date.now()-t<(ms||30000)){if(p.__dl.length>=n)return true;await sleep(100);}return false;}
/* open a case, save it (so the caseload keeps it) and close it */
async function makeKept(p,who,forms){await setBar(p,who);for(const id of forms)await openForm(p,id,id!=='DM-1');await sleep(1500);
  const n=p.__dl.length;await p.evaluate(()=>{$('#saveCase').click();});await waitDl(p,n+1,60000);await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);
  await sleep(800);}
async function closeCase(p,how){const n=p.__dl.length;await p.evaluate(()=>$('#closeCase').click());const q=await answer(p,/^Close this case/,how||/^Save and close/,15000);
  if(!how){await waitDl(p,n+1,60000);await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);}
  await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});return q;}
/* the shell's request to one form (by id) for one verb reaches the form ms late: the form answers late.
   Done in the shell's own post(), so the form sees the shell as the sender, as it does in use. */
async function hold(p,id,verb,ms){await p.evaluate(([id,verb,ms])=>{const p0=window.__post0||(window.__post0=post);window.__holds=window.__holds||[];window.__holds.push({id,verb,ms,n:0});
  if(!window.__postHeld){window.__postHeld=true;post=function(fr,msg){const h=window.__holds.find(h=>msg&&msg.nbh===h.verb&&state.frames[h.id]===fr);
    if(h){h.n++;const w=fr.contentWindow;setTimeout(()=>{try{w.postMessage(msg,'*');}catch(e){}},h.ms);return;}return p0(fr,msg);};}},[id,verb,ms]);}
async function unhold(p){await p.evaluate(()=>{if(window.__holds)window.__holds.length=0;});}
const marks=(text,M)=>M.filter(re=>re.test(String(text||''))).map(String);
/* everything kept in the browser, as text per place */
async function stores(p){return await p.evaluate(async()=>{const out={};
  out.caseload=(await clTx('readonly',st=>st.getAll())||[]).map(r=>({key:r.key,client:r.client,sid:r.sid,text:r.text,sum:JSON.stringify(r.sum||{}),thumb:r.thumb?String(r.thumb.src||'').length:0,unfiled:!!r.unfiled}));
  try{out.copies=(await window.nbhCopies.list()||[]).map(r=>({student:r.student,key:r.key,kind:r.kind,text:JSON.stringify(r)}));}catch(e){out.copies='err '+e;}
  try{await hxIdle();const pts=await hxTx(['points'],'readonly',s=>s.getAll());out.history=[];for(const pt of pts||[]){out.history.push({key:pt.key,client:pt.client,sid:pt.sid,why:pt.why,forms:pt.forms,text:await hxText(pt.id)});}}catch(e){out.history='err '+e;}
  out.local={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);out.local[k]=localStorage.getItem(k);}
  out.session={};for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);out.session[k]=sessionStorage.getItem(k);}
  return out;});}
const C3={client:'Devon Achterberg',sid:'6620458',grade:'5',site:'Royal Palm School',bcba:'J. Ellis, BCBA'},C_FORMS=['DM-1','TB-1','DD-1'],C_MARKS=[/Devon/i,/Achterberg/i,/6620458/];
const OUT=path.join(__dirname,'out','v2572-save-isolation');
const ONLY=process.argv.slice(2).filter(a=>/^[A-Z]$/.test(a)),want=k=>!ONLY.length||ONLY.includes(k);
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const keyOf=(rows,re)=>rows.find(r=>re.test(r.client||''));
async function toasts(p){await p.evaluate(()=>{window.__toasts=[];const h=document.getElementById('wsToasts');if(h)new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(x=>{if(x.nodeType===1)window.__toasts.push(x.textContent||'');}))).observe(h,{childList:true});});}
/* a tap as a finger makes it: it lands only if nothing (a question box) is in the way */
async function tap(p,loc,what){try{await loc.click({timeout:4000});return true;}catch(e){console.log('  note: '+what+' did not take a tap: '+String(e.message||e).split('\n')[0].slice(0,160));return false;}}
async function card(p,nameRe){
  if(!(await p.evaluate(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>0))){
    if(!(await tap(p,p.locator('#caseloadBtn'),'the Caseload button')))return false;}
  await p.waitForFunction(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>=1,null,{timeout:15000});await sleep(350);
  /* the card's own Open button (a line of what needs doing on the card opens the case at a form of its own) */
  const cd=p.locator('#dlgBody .cl-card[data-clrow]').filter({hasText:nameRe}).first(),own=cd.locator('.cl-card-acts button[data-clopen]');
  return tap(p,(await own.count())?own.first():cd.locator('[data-clopen]').first(),'the student\u2019s card');}
const onScreen=p=>p.evaluate(()=>({client:packet().client,sid:packet().sid,forms:Object.keys(state.frames).concat(Object.keys(state.pending)).filter((v,i,a)=>a.indexOf(v)===i),gen:state.caseGen}));
/* the save started here is left to finish; its boxes are answered as a user would */
async function saveEnds(p,ms){const boxes=[];const tEnd=Date.now()+(ms||60000);
  while(Date.now()<tEnd){const r=await p.evaluate(()=>window.__saveR);if(r!==undefined&&r!==null)return {r,boxes};
    const b=await p.evaluate(()=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;const bs=[...document.querySelectorAll('#cfFoot button')];
      const y=bs.find(x=>/It is in Files|^OK$|Save anyway/.test(x.textContent.trim()))||bs[0];if(y)y.click();return t.slice(0,300);}).catch(()=>null);
    if(b)boxes.push(b);await sleep(250);}
  return {r:null,boxes};}
/* what was written, against the students it must not hold: [{where, holds}] */
function crossed(p,after,dls,who){const bad=[];
  for(const d of dls){let txt='';try{txt=fs.readFileSync(d.file,'utf8');}catch(e){}
    for(const w of who){if(w.name.test(d.name))for(const o of who){if(o!==w&&marks(txt,o.marks).length)bad.push({where:'file '+d.name,holds:marks(txt,o.marks)});}}}
  for(const r of after.caseload||[]){for(const w of who){if(w.name.test(r.client||''))for(const o of who){if(o!==w){const m=marks(r.text+' '+r.sum,o.marks);if(m.length)bad.push({where:'caseload copy of '+r.client,holds:m});}}}}
  if(Array.isArray(after.history))for(const pt of after.history){for(const w of who){if(w.keyRe.test(pt.key||''))for(const o of who){if(o!==w){const m=marks(pt.text,o.marks);if(m.length||(pt.client&&!w.name.test(pt.client)))bad.push({where:'case history of '+w.name.source+' ('+pt.why+')',holds:m.length?m:['filed under this student, named '+pt.client]});}}}}
  return bad;}
const WHO={A:{name:/Mateo/,marks:A_MARKS,keyRe:/mateo/},B:{name:/Priya/,marks:B_MARKS,keyRe:/priya/},C:{name:/Devon/,marks:C_MARKS,keyRe:/devon/}};
async function firstOnScreen(p,forms){await setBar(p,A);for(const id of (forms||A_FORMS))await openForm(p,id,id!=='DM-1');await sleep(1500);await p.evaluate(()=>gatherFacts(true));await sleep(1200);}

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  br=await L.chromium.launch();

  /* ---- S  Save case overtaken by another student opened from Caseload ---- */
  if(want('S')){const {c,p}=await newPage('S',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await firstOnScreen(p);
    await hold(p,'DM-1','snapshot',7000);   /* Form DM-1 answers the save 7 s late */
    const nDl=p.__dl.length;
    await p.evaluate(()=>{window.__saveR=undefined;saveCase().then(v=>window.__saveR={v},e=>window.__saveR={err:String(e)});});
    await sleep(400);
    const tapped=await card(p,/Priya/);
    ok('S while Save case reads a slow form, Caseload and another student’s card still take a tap (the path is open)',tapped);
    const sw=await answer(p,/^Switch to/,/^Switch anyway/,6000);
    await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000}).catch(()=>{});
    const end=await saveEnds(p,60000);await sleep(4000);await closeBoxes(p);await sleep(500);
    const after=await stores(p),dls=p.__dl.slice(nDl),scr=await onScreen(p),ts=await p.evaluate(()=>window.__toasts||[]);
    fs.writeFileSync(path.join(OUT,'S-after.json'),JSON.stringify({after,scr,ts,end,sw},null,1));
    const bad=crossed(p,after,dls,[WHO.A,WHO.B]);
    ok('S nothing written for the first student holds the second (file, caseload copy, case history)',!bad.length,bad);
    ok('S the overtaken save is not reported as saved',end.r&&end.r.v===false,end);
    ok('S it says so, and where the first student’s work is',ts.some(t=>/was not saved to a file: another case was opened/.test(t)&&/safety copy/.test(t)),ts.slice(-4));
    ok('S the first student’s work is in the safety copy, his alone',Array.isArray(after.copies)&&after.copies.some(x=>/Mateo/.test(x.student||'')&&marks(x.text,A_MARKS).length&&!marks(x.text,B_MARKS).length),(after.copies||[]).map&&after.copies.map(x=>[x.student,x.kind]));
    ok('S the second student is on screen with her own forms, not marked saved by the first student’s save',scr.client===B.client&&B_FORMS.every(f=>scr.forms.includes(f))&&!scr.forms.some(f=>['IC-1','RR-1','IA-1','IN-1','OB-1'].includes(f)),scr);
    await c.close();}

  /* ---- C  Close case (Save and close) overtaken the same way: the case opened meanwhile is not the one closed ---- */
  if(want('C')){const {c,p}=await newPage('C',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await firstOnScreen(p);
    await hold(p,'DM-1','snapshot',7000);
    const nDl=p.__dl.length;
    await p.evaluate(()=>$('#closeCase').click());
    const q=await answer(p,/^Close this case/,/^Save and close/,15000);
    await sleep(500);
    const tapped=await card(p,/Priya/);
    const sw=await answer(p,/^Switch to/,/^Switch anyway/,6000);
    await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000}).catch(()=>{});
    /* long enough for the first student's save to give up on every form and for Close case to act */
    for(let i=0;i<70;i++){await sleep(500);await p.evaluate(()=>{const g=document.getElementById('cfDlg');if(g&&g.open){const bs=[...document.querySelectorAll('#cfFoot button')];const y=bs.find(x=>/It is in Files|^OK$/.test(x.textContent.trim()))||bs[0];if(y)y.click();}}).catch(()=>{});}
    const after=await stores(p),dls=p.__dl.slice(nDl),scr=await onScreen(p);
    fs.writeFileSync(path.join(OUT,'C-after.json'),JSON.stringify({after,scr,q,sw,tapped},null,1));
    const bad=crossed(p,after,dls,[WHO.A,WHO.B]);
    ok('C Close case asked, and the switch went ahead while it saved',!!q&&tapped,{q,tapped,sw});
    ok('C nothing written for the first student holds the second',!bad.length,bad);
    ok('C the case opened meanwhile is still open: Close case did not close it',scr.client===B.client&&B_FORMS.every(f=>scr.forms.includes(f))&&!scr.forms.some(f=>['IC-1','RR-1','IA-1','IN-1','OB-1'].includes(f)),scr);
    await c.close();}

  /* ---- K  Keep it on this device and switch, overtaken by a third student ---- */
  if(want('K')){const {c,p}=await newPage('K',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,C3,C_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await firstOnScreen(p);
    await hold(p,'DM-1','snapshot',7000);
    const nDl=p.__dl.length;
    const t1=await card(p,/Priya/);
    const q1=await answer(p,/^Switch to/,/^Keep it on this/,6000);   /* the first student's case is being kept; the Caseload is still open */
    await sleep(500);
    const t2=await card(p,/Devon/);
    const q2=await answer(p,/^Switch to/,/^Switch anyway/,6000);
    await p.waitForFunction(x=>packet().client===x,C3.client,{timeout:30000}).catch(()=>{});
    await sleep(16000);await closeBoxes(p);await sleep(500);
    const after=await stores(p),dls=p.__dl.slice(nDl),scr=await onScreen(p),ts=await p.evaluate(()=>window.__toasts||[]);
    fs.writeFileSync(path.join(OUT,'K-after.json'),JSON.stringify({after,scr,ts,q1,q2,t1,t2},null,1));
    ok('K the two taps and their questions went as a user’s would',t1&&!!q1&&t2&&!!q2,{t1,q1,t2,q2});
    const bad=crossed(p,after,dls,[WHO.A,WHO.B,WHO.C]);
    ok('K the first student’s kept copy holds nothing of the third (nor the second)',!bad.length,bad);
    ok('K the student opened last stays on screen: the overtaken keep does not go on to switch',scr.client===C3.client,scr);
    await c.close();}

  /* ---- R  the name and ID at the top retyped to another kept student's: asked before that student's case is replaced ---- */
  if(want('R')){const {c,p}=await newPage('R',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,A,['DM-1','IN-1']);   /* the first student's case, kept, still on screen */
    const before=keyOf((await stores(p)).caseload,/Priya/);
    await setBar(p,B);await sleep(600);   /* retyped */
    const nDl=p.__dl.length;
    await p.evaluate(()=>{$('#saveCase').click();});
    const q=await answer(p,/^Replace the case already kept for/,/^Cancel/,8000);
    ok('R Save case asks before it puts the case on screen in the other student’s place',!!q,await p.evaluate(()=>({box:document.getElementById('cfDlg').open?document.getElementById('cfTitle').textContent:'none'})));
    await sleep(3000);await closeBoxes(p);
    const mid=await stores(p),rowB=keyOf(mid.caseload,/Priya/);
    ok('R Cancel: her kept case is as it was, with nothing of his in it, and no file was written',!!rowB&&!!before&&rowB.text===before.text&&!marks(rowB.text,A_MARKS).length&&p.__dl.length===nDl,{same:rowB&&before&&rowB.text===before.text,marks:rowB&&marks(rowB.text,A_MARKS),files:p.__dl.length-nDl});
    const bad=crossed(p,mid,[],[WHO.A,WHO.B]);
    ok('R her case history holds nothing of his',!bad.filter(b=>/history/.test(b.where)).length,bad);
    /* the answer Replace does what it says, and is not asked again for the same case */
    await p.evaluate(()=>{$('#saveCase').click();});
    const q2=await answer(p,/^Replace the case already kept for/,/^Replace the kept case/,8000);
    await waitDl(p,nDl+1,60000).catch(()=>{});await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);await sleep(1500);
    const end=await stores(p),rowB2=keyOf(end.caseload,/Priya/);let f2=[];try{f2=Object.keys(JSON.parse(rowB2.text).forms||{});}catch(e){}
    ok('R Replace: the case on screen is kept in her place, as the question said',!!q2&&f2.join()==='DM-1,IN-1',{q2,f2});
    await p.evaluate(()=>{$('#saveCase').click();});
    const q3=await answer(p,/^Replace the case already kept for/,/^Cancel/,3500);await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);
    ok('R the next save of the same case is not asked again',!q3,q3);
    await c.close();
    /* a case typed from blank under a kept student's name has been no one else's: not asked (her earlier case stays in Case history) */
    const z=await newPage('R2',OUT);const p2=z.p;
    await makeKept(p2,B,['DM-1','TB-1']);await closeCase(p2);await sleep(800);await closeBoxes(p2);
    await setBar(p2,B);await openForm(p2,'DM-1',false);await openForm(p2,'IN-1',true);await sleep(1200);
    const n2=p2.__dl.length;await p2.evaluate(()=>{$('#saveCase').click();});
    const q4=await answer(p2,/^Replace the case already kept for/,/^Cancel/,4000);await waitDl(p2,n2+1,60000).catch(()=>{});await answer(p2,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p2);
    ok('R a case typed from blank under her own name is saved without the question',!q4&&p2.__dl.length===n2+1,{q4,files:p2.__dl.length-n2});
    await z.c.close();}

  /* ---- P  a form's own safety copy (no student details of its own) restored over an open case ---- */
  if(want('P')){const {c,p}=await newPage('P',OUT);await toasts(p);
    const q=await c.newPage();await q.goto(L.BASE+'/NBH-Workstation/'+FILE['IN-1'],{waitUntil:'load',timeout:60000});await sleep(2500);
    await q.locator('[data-m="client"]').first().fill(B.client);await q.locator('textarea:visible').first().fill('Interview note PRIYANOTE77 for the second student (simulated)');await sleep(3800);
    const made=await q.evaluate(async()=>(await window.nbhCopies.list()||[]).map(r=>({kind:r.kind,student:r.student,packet:!!r.packet})));await q.close();
    ok('P a form used on its own kept a copy with no student details of its own',made.some(r=>r.kind==='form'&&/Priya/.test(r.student||'')&&!r.packet),made);
    await makeKept(p,A,['DM-1','IC-1']);   /* the first student's case on screen, saved */
    await p.evaluate(()=>{state.caseHandle={name:'CASE_Mateo_Rivera.json'};state.caseId='case-of-the-first-student';});   /* as the one-file edition holds them after a save */
    await p.evaluate(()=>$('#autoChip').click());
    await p.waitForFunction(()=>document.getElementById('dlg').open&&!!document.querySelector('#dlgBody .as-list'),null,{timeout:15000});await sleep(300);
    const t=await tap(p,p.locator('#dlgBody .as-list li').filter({hasText:/Priya/}).first().locator('button[data-as="r"]'),'Restore');
    await answer(p,/^Restore this copy/,/^Restore/,2500);
    await p.waitForFunction(()=>Object.keys(state.frames).concat(Object.keys(state.pending)).includes('IN-1')&&!Object.keys(state.frames).concat(Object.keys(state.pending)).includes('IC-1'),null,{timeout:30000}).catch(()=>{});
    await sleep(4000);await closeBoxes(p);await sleep(500);
    const st=await p.evaluate(()=>({client:packet().client,sid:packet().sid,photo:!!state.photo,handle:!!state.caseHandle,caseId:state.caseId||null,savedAt:state.savedAt?1:0,forms:Object.keys(state.frames).concat(Object.keys(state.pending))}));
    ok('P the copy was restored from the Autosave list by a tap',t&&st.forms.includes('IN-1'),st);
    ok('P the first student’s name and ID are not left at the top over the restored form',!/Mateo|Rivera/.test(st.client)&&st.sid!==A.sid,st);
    ok('P the restored case does not take over his file, his case id or his saved mark',!st.handle&&st.caseId!=='case-of-the-first-student'&&!st.savedAt,st);
    const nDl=p.__dl.length;await p.evaluate(()=>{window.__saveR=undefined;saveCase().then(v=>window.__saveR={v},e=>window.__saveR={err:String(e)});});
    await saveEnds(p,60000);await sleep(2500);await closeBoxes(p);
    const after=await stores(p),dls=p.__dl.slice(nDl);const bad=[];
    for(const d of dls){const txt=fs.readFileSync(d.file,'utf8');if(/Mateo|Rivera/.test(d.name)&&/PRIYANOTE77|Priya/.test(txt))bad.push({where:'file '+d.name,holds:'the second student’s interview'});}
    const rowA=keyOf(after.caseload,/Mateo/);if(rowA&&/PRIYANOTE77|Priya/.test(rowA.text))bad.push({where:'caseload copy of '+rowA.client,holds:'the second student’s interview'});
    fs.writeFileSync(path.join(OUT,'P-after.json'),JSON.stringify({st,made,files:dls.map(d=>d.name),bad},null,1));
    ok('P Save case then writes nothing of hers under his name (file, caseload copy)',!bad.length,bad);
    await c.close();}

  /* ---- F  Caseload, Read every linked sheet, with the student on screen changed between two sheets ----
     The sheet reader is stood in for (no Google here): it takes 5 s and gives back a record marked with the student it read. */
  if(want('F')){const {c,p}=await newPage('F',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,C3,C_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    const keys=await p.evaluate(async()=>(await clList()||[]).map(r=>({key:r.key,client:r.client})));
    const kB=keys.find(k=>/Priya/.test(k.client)).key;
    await p.evaluate(k=>caseloadGo(k,'DM-1'),kB);   /* her case open, Form DD-1 not loaded yet */
    await p.waitForFunction(x=>packet().client===x&&!!state.pending['DD-1'],B.client,{timeout:30000});await sleep(2500);await closeBoxes(p);
    await p.evaluate(()=>{clLinkOf=function(r){try{const d=parseCase(r.text),fm=d&&d.forms&&d.forms['DD-1'];return fm?{gs:{on:true},fm}:null;}catch(e){return null;}};
      clRefreshOne=async function(r,L){await new Promise(z=>setTimeout(z,5000));return {ok:true,days:1,to:'2026-11-01',snap:{total:1,data:{sheetOf:'SHEET-OF-'+r.client},own:''}};};});
    await tap(p,p.locator('#caseloadBtn'),'the Caseload button');
    await p.waitForFunction(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>=2,null,{timeout:15000});await sleep(300);
    await p.evaluate(()=>{window.__rfDone=false;clRefreshAll().then(()=>{window.__rfDone=true;},()=>{window.__rfDone=true;});});
    await sleep(1200);   /* her sheet is being read */
    const t=await card(p,/Devon/);await answer(p,/^Switch to/,/^Switch anyway/,2500);
    await p.waitForFunction(x=>packet().client===x,C3.client,{timeout:30000}).catch(()=>{});
    await p.waitForFunction(()=>window.__rfDone===true,null,{timeout:60000}).catch(()=>{});await sleep(1500);
    const st=await p.evaluate(()=>({client:packet().client,dd1:JSON.stringify((state.pending['DD-1']||{}).snap||null).slice(0,400),loaded:!!state.frames['DD-1']}));
    fs.writeFileSync(path.join(OUT,'F-after.json'),JSON.stringify({st,t,keys},null,1));
    ok('F the other student’s card took a tap while the sheets were being read',t&&st.client===C3.client,st);
    ok('F the sheet read for the first student on screen is not put into the next student’s Form DD-1',!/SHEET-OF-Priya/.test(st.dd1),st);
    await c.close();}

  /* ---- X  a case history point begun for one student, with another opened before it is written ---- */
  if(want('X')){const {c,p}=await newPage('X',OUT);await toasts(p);
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,A,['DM-1','IN-1']);
    await hold(p,'DM-1','snapshot',7000);
    await p.evaluate(()=>{window.__hxDone=false;hxKeepScreen('kept by the test').then(()=>{window.__hxDone=true;},()=>{window.__hxDone=true;});});
    await sleep(400);
    const t=await card(p,/Priya/);await answer(p,/^Switch to/,/^Switch anyway/,2500);
    await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000}).catch(()=>{});
    await p.waitForFunction(()=>window.__hxDone===true,null,{timeout:60000}).catch(()=>{});await sleep(2500);await closeBoxes(p);
    const after=await stores(p);const bad=crossed(p,after,[],[WHO.A,WHO.B]).filter(b=>/history/.test(b.where));
    fs.writeFileSync(path.join(OUT,'X-after.json'),JSON.stringify({history:Array.isArray(after.history)?after.history.map(h=>({key:h.key,client:h.client,why:h.why,forms:h.forms})):after.history,bad,t},null,1));
    ok('X the switch went ahead while the point was being read',t&&(await onScreen(p)).client===B.client);
    ok('X no case history point of one student holds the other, or is filed under the other',!bad.length,bad);
    await c.close();}

  /* ---- O  a form of the case holds another student's name (as a form that reached the wrong case would): Save case asks first ---- */
  if(want('O')){const {c,p}=await newPage('O',OUT);await toasts(p);
    await makeKept(p,A,['DM-1','IN-1']);   /* his case, saved, on screen */
    /* the interview form's own record now names her, as a form that reached the wrong case by any route would */
    await frameOf(p,'IN-1').evaluate(nm=>{const e=document.querySelector('[data-m="client"]');e.value=nm;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},B.client);await sleep(5500);
    const strip=await p.evaluate(()=>({on:document.getElementById('alertbar').classList.contains('on'),t:document.getElementById('alertbar').innerText.slice(0,200)}));
    ok('O (setup) the strip says a form holds a different student’s name',strip.on&&/Different student/.test(strip.t),strip);
    const before=keyOf((await stores(p)).caseload,/Mateo/),nDl=p.__dl.length;
    await p.evaluate(()=>{$('#saveCase').click();});
    await p.waitForFunction(()=>document.getElementById('cfDlg').open&&/another student/.test(document.getElementById('cfTitle').textContent),null,{timeout:8000}).catch(()=>{});
    const body=await p.evaluate(()=>document.getElementById('cfDlg').open?document.getElementById('cfTitle').textContent+' | '+document.getElementById('cfBody').textContent:'no question');
    ok('O Save case asks before it saves the case with that form in it, naming the form and the name it holds',/with another student’s name in it\?/.test(body)&&/Form IN-1 holds/.test(body)&&/Priya Nandakumar/.test(body),body.slice(0,300));
    await answer(p,/with another student’s name in it\?/,/^Cancel/,3000);await sleep(2500);await closeBoxes(p);
    const mid=keyOf((await stores(p)).caseload,/Mateo/);
    ok('O Cancel: no file is written and his kept case is as it was',p.__dl.length===nDl&&!!mid&&!!before&&mid.text===before.text&&!marks(mid.text,B_MARKS).length,{files:p.__dl.length-nDl,same:!!mid&&!!before&&mid.text===before.text});
    await p.evaluate(()=>{$('#saveCase').click();});
    const q2=await answer(p,/with another student’s name in it\?/,/^Save anyway/,8000);
    await waitDl(p,nDl+1,60000).catch(()=>{});await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,8000);await closeBoxes(p);await sleep(1200);
    ok('O Save anyway saves it',!!q2&&p.__dl.length===nDl+1,{q2,files:p.__dl.length-nDl});
    await p.evaluate(()=>{$('#saveCase').click();});
    const q3=await answer(p,/with another student’s name in it\?/,/^Cancel/,3500);await waitDl(p,nDl+2,30000).catch(()=>{});await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);await closeBoxes(p);
    ok('O the same form and name are not asked about again in this case',!q3,q3);
    await c.close();}

  ok('no page errors',!errs.length,errs.slice(0,6));
  await br.close();
  console.log('\n'+(n-fails)+' passed, '+fails+' failed');process.exit(fails?1:0);
})().catch(async e=>{console.error(e);try{await br.close();}catch(x){}process.exit(1);});
