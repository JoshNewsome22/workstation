/* v25.72 privacy audit, the papers and what the browser keeps: nothing of one student in another student's papers, and
   nothing naming a student left behind when they are removed. Simulated students only ("Mateo Rivera" 4471823, "Priya
   Nandakumar" 5530917). Beside qa/v2572-save-isolation-test.js (the Save case family) and qa/v2571-case-isolation-test.js.
   M  Build packet collects its forms two at a time over several seconds; another student is opened from Caseload meanwhile.
      Before: one packet, the second student's cover and facts over the first student's pages. Now it is not built.
   D  a packet's window is left open; the next student's case is opened; the packet is printed from that window. Before: the
      line "packet, its title, printed" went into the next student's Documents list (and so into her case file).
   N  the district's form 2547 is filled from one PDF kept on the device, and only boxes with an answer were written. A copy
      already filled for one student, chosen as that PDF, left his answers in every later student's notice. Now the boxes
      are emptied before each notice, and a copy with answers in it is asked about and emptied before it is kept.
      The form is a stand-in made here with the same box names, not the district's PDF.
   L  the recent-students list and the pins hold students' keys (name and ID). A student removed from the caseload stayed
      on the recent list, and Remove all student data left both lists. After Remove all, every place this browser keeps
      things for the page (local and session storage, every IndexedDB store) is read for the students' names and IDs.
      Form TB-1's bank (My definitions) is the BCBA's own work: it stays, the question says so and names the entries
      that may name a student kept here (the BCBA, 11/10).
   usage: WS_URL=http://127.0.0.1:8171 node qa/v2572-papers-isolation-test.js [M D N L]   results in qa/out/v2572-papers-isolation/ */
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
const OUT=path.join(__dirname,'out','v2572-papers-isolation');
const ONLY=process.argv.slice(2).filter(a=>/^[A-Z]$/.test(a)),want=k=>!ONLY.length||ONLY.includes(k);
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
async function toasts(p){await p.evaluate(()=>{window.__toasts=[];const h=document.getElementById('wsToasts');if(h)new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(x=>{if(x.nodeType===1)window.__toasts.push(x.textContent||'');}))).observe(h,{childList:true});});}
/* a tap as a finger makes it: it lands only if nothing (a question box) is in the way */
async function tap(p,loc,what){try{await loc.click({timeout:4000});return true;}catch(e){console.log('  note: '+what+' did not take a tap: '+String(e.message||e).split('\n')[0].slice(0,160));return false;}}
async function card(p,nameRe){
  if(!(await p.evaluate(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>0))){
    if(!(await tap(p,p.locator('#caseloadBtn'),'the Caseload button')))await p.evaluate(()=>caseloadOpen());}
  await p.waitForFunction(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>=1,null,{timeout:15000});await sleep(350);
  const cd=p.locator('#dlgBody .cl-card[data-clrow]').filter({hasText:nameRe}).first(),own=cd.locator('.cl-card-acts button[data-clopen]');
  return tap(p,(await own.count())?own.first():cd.locator('[data-clopen]').first(),'the student’s card');}
const keysOf=p=>p.evaluate(async()=>(await clList()||[]).map(r=>({key:r.key,client:r.client})));
const blankNow=p=>p.waitForFunction(()=>!Object.keys(state.frames).length&&!Object.keys(state.pending).length&&!document.getElementById('pClient').value,null,{timeout:30000});
/* a stand-in for the district's form 2547 with the same box names (not the district's PDF), as qa/v2241-restraint-test.js makes it */
const STANDIN=`async()=>{await pdfTools();const P=PDFLib,doc=await P.PDFDocument.create(),pg=doc.addPage([612,792]),fm=doc.getForm(),N=k=>'form1[0].#subform[0].'+k;let y=760;
  const tx=k=>{const t=fm.createTextField(N(k));t.addToPage(pg,{x:20,y:(y-=14),width:200,height:12});};
  ['Student_Number[0]','First_Name[0]','Middle_Name[0]','Last_Name[0]','DOB[0]','Grade[0]','Request_Date[0]','Current_School[0]','Student_Address[0]','Student_City[0]','Student_State[0]','Student_Zip[0]','TextField2[0]','TextField2[1]','TextField2[2]','DateTimeField1[0]','DateTimeField1[1]','TextField4[0]','TextField5[0]',
   'DateTimeField4[0]','DateTimeField4[1]','DateTimeField3[0]','DateTimeField3[1]','DateTimeField2[0]','DateTimeField2[1]','TextField3[0]','TextField3[1]'].concat([...Array(12).keys()].map(i=>'TextField6['+i+']')).forEach(tx);
  [0,1,2,3].forEach(i=>{const c=fm.createCheckBox(N('CheckBox1['+i+']'));c.addToPage(pg,{x:300,y:700-i*14,width:10,height:10});});
  [0,1,2,3,4,5].forEach(i=>{const r=fm.createRadioGroup(N('RadioButtonList['+i+']'));r.addOptionToPage('0',pg,{x:350,y:700-i*14,width:10,height:10});r.addOptionToPage('1',pg,{x:370,y:700-i*14,width:10,height:10});});
  return await doc.save();}`;
const READ=`async bytes=>{const d2=await PDFLib.PDFDocument.load(bytes),v={};d2.getForm().getFields().forEach(x=>{const n=x.getName().split('.').pop();try{v[n]=x.getText?(x.getText()||''):x.isChecked?x.isChecked():x.getSelected?(x.getSelected()||''):'';}catch(e){v[n]='?';}});return v;}`;
const LEFT=/Mateo|Luis|Rivera|4471823|Ana |scratch|Carried|Banyan|561-555/;   /* the first student's answers */

(async()=>{
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  br=await L.chromium.launch();

  /* ---- M  Build packet overtaken by another student opened from Caseload ---- */
  if(want('M')){const {c,p}=await newPage('M',OUT);await toasts(p);const IDS=['DM-1','IC-1','IN-1','OB-1'];
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,A,IDS);   /* the first student's case on screen, saved */
    await hold(p,'IC-1','collect',3500);   /* Form IC-1 hands over its pages 3.5 s late */
    const popP=c.waitForEvent('page',{timeout:20000}).catch(()=>null);
    await p.evaluate(ids=>{window.__mpDone=false;Promise.resolve(masterRun(ALL.filter(f=>ids.includes(f[0])),{title:'Packet'})).then(()=>{window.__mpDone=true;},()=>{window.__mpDone=true;});},IDS);
    const pop=await popP;await sleep(300);
    const t=await card(p,/Priya/);await answer(p,/^Switch to/,/^Switch anyway/,2500);
    await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000}).catch(()=>{});
    await p.waitForFunction(()=>window.__mpDone===true,null,{timeout:60000}).catch(()=>{});await sleep(2000);
    let txt='';const closed=!pop||pop.isClosed();if(!closed){try{txt=await pop.evaluate(()=>(document.title||'')+' '+document.documentElement.innerText);}catch(e){}}
    const ts=await p.evaluate(()=>window.__toasts||[]);
    fs.writeFileSync(path.join(OUT,'M-after.json'),JSON.stringify({opened:!!pop,closed,a:marks(txt,A_MARKS),b:marks(txt,B_MARKS),ts:ts.slice(-3)},null,1));
    ok('M the packet window opened and the other student’s card took a tap while the forms were collected',!!pop&&t,{pop:!!pop,t});
    ok('M the packet is not built from two students’ forms',closed||!(marks(txt,A_MARKS).length&&marks(txt,B_MARKS).length),{a:marks(txt,A_MARKS),b:marks(txt,B_MARKS)});
    ok('M it says the packet was not built, and why',ts.some(x=>/packet was not built: another case was opened/.test(x)),ts.slice(-3));
    await c.close();}

  /* ---- D  a packet's window left open and printed after the next student's case is opened ---- */
  if(want('D')){const {c,p}=await newPage('D',OUT);await toasts(p);const IDS=['DM-1','IN-1'];
    await makeKept(p,B,B_FORMS);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,A,IDS);
    const popP=c.waitForEvent('page',{timeout:20000}).catch(()=>null);
    await p.evaluate(ids=>masterRun(ALL.filter(f=>ids.includes(f[0])),{title:'Packet'}),IDS);
    const pop=await popP;await sleep(3000);   /* the watch on the window sees the packet written */
    if(pop)await pop.evaluate(()=>window.dispatchEvent(new Event('beforeprint'))).catch(()=>{});await sleep(600);
    const docsA=await p.evaluate(()=>(state.docs||[]).map(d=>({form:d.form,title:d.title})));
    ok('D printed while its case is open, the packet is listed among that case’s papers',docsA.some(d=>d.form==='packet'),docsA);
    const t=await card(p,/Priya/);await answer(p,/^Switch to/,/^Switch anyway/,3500);
    await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000}).catch(()=>{});await sleep(1500);await closeBoxes(p);
    const docs0=await p.evaluate(()=>(state.docs||[]).length);
    if(pop&&!pop.isClosed())await pop.evaluate(()=>window.dispatchEvent(new Event('beforeprint'))).catch(()=>{});await sleep(800);
    const docsB=await p.evaluate(()=>(state.docs||[]).map(d=>({form:d.form,title:d.title})));
    fs.writeFileSync(path.join(OUT,'D-after.json'),JSON.stringify({docsA,docsB,docs0,t},null,1));
    ok('D printed after the next student is opened, it is not listed among her papers',t&&docsB.length===docs0&&!marks(JSON.stringify(docsB),A_MARKS).length,{docs0,docsB});
    await c.close();}

  /* ---- N  the district's form 2547: a copy with an earlier student's answers in it, used as the form kept on the device ---- */
  if(want('N')){const {c,p}=await newPage('N',OUT);await toasts(p);
    await setBar(p,Object.assign({},A,{client:'Mateo Luis Rivera'}));
    const first=await p.evaluate(async([mk,rd])=>{const blank=await (0,eval)('('+mk+')')();
      const data={date:'10/16/2026',school:'Royal Palm School (simulated)',seated:false,standing:true,prone:false,transport:true,other:'Carried by two staff (simulated)',injS:'no',injO:'yes',inj:'Others: a scratch on the aide’s arm (simulated)',
        a1:{date:'10/16/2026',ph:'561-555-0101',vm:'no',sp:'Ana Rivera (simulated)',ph2:'561-555-0102',vm2:'yes',sp2:'',em:'',oth:'Note sent home (simulated)'},a2:{date:'10/17/2026',ph:'561-555-0101',vm:'yes',sp:'',ph2:'',vm2:'',sp2:'',em:'',oth:''},sent:'10/19/2026',ack:'10/20/2026',first:'10/16/2026',second:'10/17/2026',incDate:'10/16/2026',kind:'restraint'};
      state.facts=Object.assign({},state.facts||{},{profile:{home:{addr:'12 Banyan Court, Royal Palm Beach, FL 33411'}}});
      const out=await f2547Fill(blank,data);const v=await (0,eval)('('+rd+')')(out);let s='';const u=new Uint8Array(out);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
      return {v,b64:btoa(s)};},[STANDIN,READ]);
    ok('N (setup) the first student’s notice holds his answers',first.v['First_Name[0]']==='Mateo'&&first.v['Middle_Name[0]']==='Luis'&&first.v['CheckBox1[1]']===true&&/Carried/.test(first.v['TextField4[0]']),first.v);
    const file=path.join(OUT,'Form 2547 notice, filled for the first student (simulated).pdf');fs.writeFileSync(file,Buffer.from(first.b64,'base64'));
    /* 1 a notice for the next student filled from that copy: only her answers */
    await setBar(p,B);
    const second=await p.evaluate(async([rd,b64])=>{const bin=atob(b64),kept=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)kept[i]=bin.charCodeAt(i);
      state.facts=Object.assign({},state.facts||{},{profile:{home:{addr:''}}});
      const data={date:'11/02/2026',school:'Royal Palm School (simulated)',seated:true,standing:false,prone:false,transport:false,other:'',injS:'no',injO:'no',inj:'',
        a1:{date:'11/02/2026',ph:'',vm:'',sp:'',ph2:'',vm2:'',sp2:'',em:'',oth:''},a2:null,sent:'',ack:'',first:'11/02/2026',second:'',incDate:'11/02/2026',kind:'restraint'};
      const out=await f2547Fill(kept,data);return await (0,eval)('('+rd+')')(out);},[READ,first.b64]);
    const stale=Object.keys(second).filter(k=>(typeof second[k]==='string'&&LEFT.test(second[k]))||(/^CheckBox1\[(1|3)\]$/.test(k)&&second[k]===true));
    fs.writeFileSync(path.join(OUT,'N-second.json'),JSON.stringify({second,stale},null,1));
    ok('N the next student’s notice holds her own answers',second['First_Name[0]']==='Priya'&&second['Last_Name[0]']==='Nandakumar'&&second['CheckBox1[0]']===true,second);
    ok('N and nothing left over from the first student (name, address, kind of restraint, injuries, contacts)',!stale.length,stale.map(k=>[k,second[k]]));
    /* 2 choosing that copy as the form to keep: asked, and what is kept is empty */
    await p.evaluate(()=>f2547Pick(''));await p.waitForSelector('#f2547File',{timeout:10000});
    await p.setInputFiles('#f2547File',file);
    const q=await answer(p,/already has answers in/,/^Empty the boxes and keep it/,10000);
    await sleep(2500);
    const kept=await p.evaluate(async rd=>{const r=await f2547Get();if(!r||!r.v)return null;const v=await (0,eval)('('+rd+')')(r.v);return Object.keys(v).filter(k=>v[k]===true||(typeof v[k]==='string'&&v[k]!=='')).map(k=>[k,v[k]]);},READ);
    ok('N a copy with answers in it is asked about before it is kept',!!q,q);
    ok('N what is kept on the device has every box empty',Array.isArray(kept)&&!kept.length,kept);
    await c.close();}

  /* ---- L  the lists of students' keys (name and ID) this browser keeps, after a student is removed and after Remove all ---- */
  if(want('L')){const {c,p}=await newPage('L',OUT);await toasts(p);
    await makeKept(p,B,['DM-1','TB-1']);await closeCase(p);await sleep(800);await closeBoxes(p);
    await makeKept(p,A,['DM-1','IN-1']);await closeCase(p);await sleep(800);await closeBoxes(p);
    const ks=await keysOf(p),kA=ks.find(k=>/Mateo/.test(k.client)).key,kB=ks.find(k=>/Priya/.test(k.client)).key;
    await card(p,/Mateo/);await p.waitForFunction(x=>packet().client===x,A.client,{timeout:30000});await sleep(1200);
    await card(p,/Priya/);await answer(p,/^Switch to/,/^Switch anyway/,2500);await p.waitForFunction(x=>packet().client===x,B.client,{timeout:30000});await sleep(1200);
    await p.evaluate(k=>clPinSet(k,true),kB);
    await p.evaluate(()=>$('#closeCase').click());await answer(p,/^Close this case/,/^Save and close|^Close/,2500);await blankNow(p).catch(()=>{});await sleep(2500);await closeBoxes(p);
    const lists=()=>p.evaluate(()=>Object.keys(localStorage).filter(k=>/^nbh\.(ws\.recent|caseload\.pin)@/.test(k)).map(k=>k+'='+localStorage.getItem(k)).join('  '));
    const l0=await lists();
    ok('L (setup) the recent list holds both students’ keys, and one is pinned',(()=>{const part=re=>l0.split('  ').find(x=>re.test(x))||'',rec=part(/^nbh\.ws\.recent@/),pin=part(/^nbh\.caseload\.pin@/);return /mateo rivera/.test(rec)&&/priya nandakumar/.test(rec)&&/priya nandakumar/.test(pin);})(),l0);
    /* the first student removed from the caseload */
    await p.evaluate(()=>caseloadOpen());await p.waitForFunction(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .cl-card[data-clrow]').length>=2,null,{timeout:15000});await sleep(300);
    await p.evaluate(k=>{const b=[...document.querySelectorAll('#dlgBody [data-cldel]')].find(x=>x.dataset.cldel===k);if(b)b.click();},kA);
    await sleep(2500);const l1=await lists();
    ok('L a student removed from the caseload is no longer on the recent list; the other still is',!/mateo|4471823/.test(l1)&&/priya/.test(l1),l1);
    await sleep(16000);await closeBoxes(p);   /* the Undo offer has passed */
    /* Remove all student data */
    /* two entries in Form TB-1's bank (My definitions), the BCBA's own work: one names the student still kept here */
    await p.evaluate(()=>new Promise(res=>{const r=indexedDB.open('nbh-tb1-bank',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('defs'))r.result.createObjectStore('defs',{keyPath:'id'});};r.onerror=()=>res();
      r.onsuccess=()=>{const db=r.result,t=db.transaction('defs','readwrite'),st=t.objectStore('defs');
        st.put({id:'my-test1',lab:'Leaving the seat',def:'Priya leaves her seat without permission during independent work (simulated)',saved:'2026-11-09T12:00:00.000Z'});
        st.put({id:'my-test2',lab:'Calling out',def:'Speaks without raising a hand during whole-class teaching (simulated)',saved:'2026-11-09T12:01:00.000Z'});t.oncomplete=()=>{db.close();res();};};}));
    await p.evaluate(()=>{clRemoveAll();});
    await p.waitForFunction(()=>document.getElementById('cfDlg').open&&/^Remove every student/.test(document.getElementById('cfTitle').textContent),null,{timeout:8000}).catch(()=>{});
    const qb=await p.evaluate(()=>document.getElementById('cfDlg').open?document.getElementById('cfBody').textContent:'');
    ok('L the question says Form TB-1’s bank stays, and names the entry that may name a student (not the other)',/2 saved definitions in Form TB-1’s bank \(My definitions\) stay/.test(qb)&&/“Leaving the seat”/.test(qb)&&!/Calling out/.test(qb),qb.slice(-420));
    const q=await answer(p,/^Remove every student/,/^Remove everything/,8000);await answer(p,/never saved to a file/,/^Remove anyway/,2500);
    await sleep(30000);await closeBoxes(p);   /* and its Undo offer has passed */
    const left=await p.evaluate(async()=>{const out=[];const add=(where,text)=>out.push({where,text:String(text||'')});
      for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);add('localStorage '+k,k+' '+localStorage.getItem(k));}
      for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);add('sessionStorage '+k,k+' '+sessionStorage.getItem(k));}
      const dbs=await indexedDB.databases();
      for(const d of dbs){await new Promise(res=>{let r;try{r=indexedDB.open(d.name);}catch(e){return res();}r.onerror=()=>res();r.onblocked=()=>res();r.onsuccess=()=>{const db=r.result,names=[...db.objectStoreNames];if(!names.length){db.close();return res();}
        let todo=names.length;const fin=()=>{if(!--todo){db.close();res();}};
        names.forEach(nm=>{try{const g=db.transaction(nm,'readonly').objectStore(nm).getAll();g.onsuccess=()=>{let t='';try{t=JSON.stringify(g.result,(k,v)=>v instanceof ArrayBuffer||ArrayBuffer.isView(v)?'[bytes]':v);}catch(e){t='';}add('IndexedDB '+d.name+' / '+nm,t);fin();};g.onerror=fin;}catch(e){fin();}});};});}
      return out;});
    const who=[].concat(A_MARKS,B_MARKS),all=left.filter(x=>marks(x.text,who).length).map(x=>({where:x.where,holds:marks(x.text,who)}));
    const bankLeft=left.find(x=>/nbh-tb1-bank/.test(x.where)),named=all.filter(x=>!/nbh-tb1-bank/.test(x.where));
    ok('L my bank is kept whole (both entries), as the question said',!!bankLeft&&/my-test1/.test(bankLeft.text)&&/my-test2/.test(bankLeft.text),bankLeft&&bankLeft.text.slice(0,200));
    fs.writeFileSync(path.join(OUT,'L-left.json'),JSON.stringify({places:left.map(x=>x.where),named},null,1));
    ok('L Remove all student data asked first',!!q,q);
    ok('L after it, nothing this browser keeps for the workstation names a student (local and session storage, every IndexedDB store but my bank)',left.length>3&&!named.length,named);
    await c.close();}

  ok('no page errors',!errs.length,errs.slice(0,6));
  await br.close();
  console.log('\n'+(n-fails)+' passed, '+fails+' failed');process.exit(fails?1:0);
})().catch(async e=>{console.error(e);try{await br.close();}catch(x){}process.exit(1);});
