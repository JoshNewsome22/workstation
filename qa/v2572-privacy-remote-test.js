/* v25.72 privacy audit, the paths that leave the device or cross from one student's case to another's outside the shell's
   own Save case family (those are qa/v2571-case-isolation-test.js and the main audit's tests). Simulated students only:
   the first is "Mateo Rivera" (ID 4471823), the second "SIMULATED – Sample Student" (ID SIM-000). Nothing leaves this
   machine: Google is simulated with route(), and the reply box is the repo's own box.php run by php on 127.0.0.1.
   Each scenario failed on v25.71 (fa7a719) and holds the fix of v25.72:
   L  Log it now for the first student while Form DD-1 is still loading; the box is closed and the second student opened
      from Caseload. The incident must not reach the second student's Form DD-1 or caseload copy, and the message names
      the first student. Control: with no switch the incident is in his own Form DD-1, and the message names him.
   N  Today's numbers for the first student (Form DD-1 of his case not loaded yet), the second opened while it loads: the
      numbers must not reach the second student's Form DD-1.
   S  Share for editing for the first student, the second opened while the file is packed (the packing of pictures and
      sounds held 2.5 s): no file named for the second student holding the first's case, no share kept under her name.
      Control: with no switch the file is named for the first student and holds his case.
   M  A form's status counts only from the window of the frame the case holds under that form's id: a status, and an
      answer carrying one, sent by another window under the id of an open form change nothing of the case on screen.
      Controls: the form's own status still arrives, also when it is talked to directly (fr.__direct), and a student not
      on screen is still logged out of sight (the caseload's hidden frame).
   D  Read a document: the details read for the first student are not placed once another case has been opened (before
      Place, and while Place waits for Form DM-1).
   E  Google Drive: a file filed under the second student (its appProperties.k) whose own record names the first is left
      alone: neither student's caseload copy is replaced or removed, the sync ends, and the Drive panel says so.
   C  A Collect from the reply box in flight when the form's record is replaced (Clear all, another saved form opened,
      Load simulation): the first student's reply box (id, token, private key) and replies do not enter the second
      student's form. Forms CF-1 (the shared kit of IN-1, SV-1, CF-1) and IA-1.
   R  A reply that names another student than the form's is held, and said so; a reply for the same student under a
      corrected spelling, by initials, or for a form with no name yet is placed as before. A link made after the form's
      student changed carries a new reply box, not the first student's.
   Q  (the BCBA, 11/10) The form does not change reply boxes by itself once links have gone out. Opening Respondent pages
      with a box made for what reads as another student asks first, naming both: Cancel (no link, nothing changes), Same
      student (the box and its links stay, the name kept with the box becomes this one, it is not asked again, and an
      answer to a link sent before is placed, not held), Different student (a new box, the first student's gone from the
      form). No question when nothing was sent or received: the new box is made as before. Forms CF-1 and IA-1; in IA-1
      also from the Send-outs sheet.
   usage: WS_URL=http://127.0.0.1:8171 node qa/v2572-privacy-remote-test.js [L N S M D E C R Q]   results in qa/out/v2572-privacy-remote/ */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;const {spawn}=require('child_process');
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const OUT=path.join(__dirname,'out','v2572-privacy-remote');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const A={client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const B={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'5',site:'Example School (simulated)',bcba:'J. Ellis, BCBA'};
const A_WORDS='Mateo lives with his mother and grandmother (simulated).',B_WORDS='The sample student lives with an aunt (simulated).';
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/];const marks=t=>A_MARKS.filter(re=>re.test(String(t||''))).map(String);
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ymd=t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'),TODAY=ymd(new Date());
const errs=[];let br;
/* Google, simulated: the sign-in (a token at once) and the Drive calls the workstation makes for small cases */
const GSI=()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-drive-token-'+window.__gsAsk,expires_in:3600}),20);}};}}}};
  try{if(window.top===window){localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};};
function driveSim(){const D={files:new Map(),n:0,calls:0};const now=()=>new Date(Date.now()+D.n*1000).toISOString();
  const evalQ=(q,f)=>{if(/trashed=false/.test(q)&&f.trashed)return false;const mt=/mimeType='([^']+)'/.exec(q);if(mt&&f.mimeType!==mt[1])return false;
    const par=/'([^']+)' in parents/.exec(q);if(par&&!(f.parents||[]).includes(par[1]))return false;
    const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)],hit=m=>(f.appProperties||{})[m[1]]===m[2];if(ap.length&&!(/\} or appProperties/.test(q)?ap.some(hit):ap.every(hit)))return false;return true;};
  const pick=f=>({id:f.id,name:f.name,version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties});
  const parts=(ct,body)=>{const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));};
  async function drive(route){const req=route.request(),u=new URL(req.url()),m=req.method();D.calls++;
    const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
    if(u.pathname==='/oauth2/v3/userinfo')return json({email:'simulated.bcba@palmbeachschools.org'});
    let mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
    if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>evalQ(q,f)).map(pick)});}
    if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
    if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
      if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
    if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta)f.trashed=meta.trashed;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.version++;D.n++;f.modifiedTime=now();return json({id:f.id});}
    mm=/^\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(u.pathname);
    if(mm&&u.searchParams.get('uploadType')==='multipart'){const [metaS,content]=parts(req.headers()['content-type'],req.postData()||'');const meta=JSON.parse(metaS);D.n++;
      if(m==='POST'){const id='f'+D.n;const f=Object.assign({id,version:1,modifiedTime:now(),trashed:false},meta,{content});D.files.set(id,f);return json(pick(f));}
      const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
      if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;f.modifiedTime=now();return json(pick(f));}
    return json({error:{code:400,message:'not simulated: '+m+' '+u.pathname}},400);}
  return {D,drive,cases:()=>[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='case'&&!f.trashed)};}
/* the reply box: the repo's own box.php on 127.0.0.1, its data in qa/out */
async function box(port){const data=path.join(OUT,'box-'+port);fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+port,'-t',path.join(L.ROOT,'tools','reply-box','public_html','reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','ignore']});
  const url='http://127.0.0.1:'+port+'/box.php';let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(url+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  if(!up){php.kill();throw new Error('box.php did not start (php is needed for scenarios C and R)');}return {url,php,data};}
async function newPage(tag,opt){opt=opt||{};
  const c=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',acceptDownloads:true,userAgent:IPAD_UA});
  if(opt.drive){await c.addInitScript(GSI);await c.route('https://www.googleapis.com/**',opt.drive);await c.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));await c.route('https://apis.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));}
  else await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.where@rps','files');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.shellUrl());await sleep(2500);
  await p.evaluate(async()=>{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));try{await window.nbhCopies.clear();}catch(e){}
    ['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});window.__t=[];const t=wsUI.toast;wsUI.toast=function(m,o){window.__t.push(String(m));return t.apply(this,arguments);};});
  return {c,p};}
const frameOf=(p,id)=>p.frames().find(f=>f!==p.mainFrame()&&L.frameIs(f,id,FILE[id]));
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
async function closeBoxes(p){await p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open){const b=[...d.querySelectorAll('button')].find(x=>/^(OK|Close|Not now|It is in Files)$/.test(x.textContent.trim()));if(b)b.click();else d.close();}});}).catch(()=>{});}
const setField=(fr,name,v)=>fr.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
/* Save case (the file is a download in this mode), which also keeps the case in Caseload */
async function keep(p){const dl=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>document.getElementById('saveCase').click());await dl;await sleep(1800);await closeBoxes(p);}
const rows=p=>p.evaluate(async()=>(await clList()||[]).map(r=>({key:r.key,client:r.client,text:r.text,drv:r.drv||null})));
const toasts=p=>p.evaluate(()=>window.__t.slice());
const blank=async p=>{await p.evaluate(()=>clearCase());await sleep(900);await closeBoxes(p);};
/* the second student from Caseload, as its Open does; a question about unsaved work is answered Switch anyway */
async function switchTo(p,key,form){p.evaluate(([k,f])=>caseloadGo(k,f),[key,form||'']).catch(()=>{});await answer(p,/^Switch to/,/^Switch anyway/,2500);}
/* a file of the form held while `slow` is on: a form that takes its time to load */
async function holdFile(c,id,ms){const st={slow:false};await c.route(u=>decodeURIComponent(String(u)).includes(FILE[id]),async r=>{if(st.slow)await sleep(ms);r.continue().catch(()=>{});});return st;}

/* ---- L: Log it now ---- */
const INC={beh:'Hitting (simulated)',what:'Mateo hit a peer at the reading table (simulated).'};
async function scenL(variant){const {c,p}=await newPage('L');const hold=await holdFile(c,'DD-1',4000);
  await setBar(p,B);await openForm(p,'DM-1');await openForm(p,'DD-1');await keep(p);const keyB=await p.evaluate(()=>clKey(packet()));await blank(p);
  await setBar(p,A);await openForm(p,'DM-1');await keep(p);const keyA=await p.evaluate(()=>clKey(packet()));hold.slow=true;
  await p.evaluate(()=>logNowOpen());await sleep(900);
  const who=await p.evaluate(([inc,k])=>{const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('#lnBeh',inc.beh);set('#lnWhat',inc.what);document.querySelector('#lnTime').value='10:32';const w=document.querySelector('#lnWho');const mine=w.value===k;document.querySelector('#lnSave').click();return mine;},[INC,keyA]);
  if(variant==='switch'){await sleep(500);await p.evaluate(()=>document.getElementById('dlg').close());   /* Escape, or the box's Close, while it says Logging */
    await switchTo(p,keyB,'DD-1');}
  for(let i=0;i<90;i++){await sleep(500);if(!(await p.evaluate(()=>LN.busy)))break;}
  await p.waitForFunction(()=>!!state.frames['DD-1']&&!!state.status['DD-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const bar=await p.evaluate(()=>packet().client),dd=frameOf(p,'DD-1'),said=(await toasts(p)).join(' | ');
  const inc=dd?await dd.evaluate(()=>(S.incidents||[]).map(i=>String(i.what||''))).catch(e=>[String(e)]):['no Form DD-1'];
  if(variant==='switch'){
    ok('L: Log it now was for the first student, and the second student is on screen when Form DD-1 is ready',who&&bar===B.client,{who,bar});
    ok('L: the second student’s Form DD-1 holds no incident written for the first',!inc.some(t=>/Mateo hit a peer/.test(t)),inc);
    ok('L: the message says nothing was logged and names the first student',/Not logged for Mateo Rivera/.test(said)&&!/Logged on/.test(said),said);
    await keep(p);const R=await rows(p),rb=R.find(r=>r.client===B.client);
    ok('L: after Save case, the second student’s caseload copy holds nothing of the incident',!!rb&&!/Mateo hit a peer/.test(rb.text),rb?marks(rb.text):R.map(r=>r.client));}
  else{ok('L control: with no switch the incident is in the first student’s own Form DD-1',bar===A.client&&inc.some(t=>/Mateo hit a peer/.test(t)),{bar,inc});
    ok('L control: the message names the student whose Form DD-1 took it',/Logged on Mateo Rivera’s Form DD-1: Hitting \(simulated\) at 10:32 am/.test(said),said);}
  await c.close();}

/* ---- N: Today's numbers ---- */
async function scenN(){const {c,p}=await newPage('N');const hold=await holdFile(c,'DD-1',4000);
  /* the first student's case, Form DD-1 from its simulation; the second student's case was started from his file (the bar
     retyped), so her Form DD-1 holds targets under the same ids: the numbers would be placed, not refused */
  const tgOf=()=>frameOf(p,'DD-1').evaluate(d=>{const t=ddDayTargets(d).targets.find(x=>x.k==='n');return t?{id:t.id,v:Number(t.v)||0}:null;},TODAY);
  await setBar(p,A);await openForm(p,'DM-1');await openForm(p,'DD-1',true);await sleep(1500);const a={tg:await tgOf()};await keep(p);a.k=await p.evaluate(()=>clKey(packet()));
  const textA=(await rows(p)).find(r=>r.key===a.k).text;await blank(p);
  await p.evaluate(([t,pk])=>{const d=parseCase(t);d.packet=pk;d.cur='DD-1';return openCaseText(JSON.stringify(d),null,{asked:true,quiet:true});},[textA,B]);
  await p.waitForFunction(c=>packet().client===c&&!!state.frames['DD-1']&&!!state.status['DD-1'],B.client,{timeout:30000});await sleep(2500);
  const b={tg:await tgOf()};await keep(p);b.k=await p.evaluate(()=>clKey(packet()));await blank(p);
  ok('N: both students’ Form DD-1 hold a counted target under the same id (the second student’s case was started from the first’s file)',!!(a.tg&&b.tg&&a.tg.id===b.tg.id)&&a.k!==b.k,{a,b});
  /* the first student from Caseload, Form DM-1 first: his Form DD-1 waits, not loaded */
  await p.evaluate(k=>caseloadGo(k,'DM-1'),a.k);await p.waitForFunction(c=>packet().client===c&&!!state.status['DM-1'],A.client,{timeout:30000});await sleep(1200);
  const pend=await p.evaluate(()=>!!state.pending['DD-1']&&!state.frames['DD-1']);hold.slow=true;
  await p.evaluate(k=>dayNumbersOpen(k),a.k);await p.waitForFunction(()=>document.querySelectorAll('#dyRows tr[data-dyt]').length>0,null,{timeout:10000}).catch(()=>{});
  const put=await p.evaluate(id=>{const tr=[...document.querySelectorAll('#dyRows tr[data-dyt]')].find(r=>r.dataset.dyt===id);if(!tr)return false;const plus=tr.querySelector('.dy-pm[data-d="1"]');plus.click();plus.click();plus.click();document.querySelector('#dySave').click();return true;},a.tg.id);
  ok('N: Today’s numbers opened for the first student, whose Form DD-1 is not loaded yet, and 3 were entered',pend&&put,{pend,put});
  await sleep(500);await p.evaluate(()=>document.getElementById('dlg').close());hold.slow=false;await switchTo(p,b.k,'DD-1');
  for(let i=0;i<90;i++){await sleep(500);if(!(await p.evaluate(()=>DY.busy)))break;}
  await p.waitForFunction(()=>!!state.frames['DD-1']&&!!state.status['DD-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const bar=await p.evaluate(()=>packet().client),dd=frameOf(p,'DD-1'),said=(await toasts(p)).join(' | ');
  const v=dd?await dd.evaluate(([d,id])=>Number(ddDayTargets(d).targets.find(x=>x.id===id).v)||0,[TODAY,b.tg.id]).catch(()=>-1):-1;
  ok('N: the second student is on screen, and her Form DD-1 holds the day’s count she had ('+b.tg.v+'), not 3 more',bar===B.client&&v===b.tg.v,{bar,v,had:b.tg.v});
  ok('N: the message says nothing was saved and names the first student',/Nothing was saved for Mateo Rivera/.test(said),said);
  await c.close();}

/* ---- S: Share for editing ---- */
async function scenS(variant){const {c,p}=await newPage('S');
  await setBar(p,B);let dm=await openForm(p,'DM-1');await setField(dm,'s.living',B_WORDS);await sleep(500);await keep(p);const keyB=await p.evaluate(()=>clKey(packet()));await blank(p);
  await setBar(p,A);dm=await openForm(p,'DM-1');await setField(dm,'s.living',A_WORDS);await sleep(500);await keep(p);
  await p.evaluate(()=>{const m=mediaOut;mediaOut=async function(t){await new Promise(r=>setTimeout(r,2500));return m(t);};});   /* a case heavy with pictures and sounds takes seconds to pack */
  await p.evaluate(()=>shOpen());await sleep(700);
  await p.evaluate(()=>{const set=(s,v)=>{const e=document.querySelector(s);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};set('#shPeer','Ms. Colleague (simulated)');set('#shMe','Simulated BCBA');});
  const dlP=p.waitForEvent('download',{timeout:9000}).catch(()=>null);
  await p.evaluate(()=>document.getElementById('shGoOut').click());await sleep(500);
  if(variant==='switch')await switchTo(p,keyB,'');
  const dl=await dlP;let name='',text='';if(dl){name=dl.suggestedFilename();const f=path.join(OUT,'S-'+variant+'-'+name);await dl.saveAs(f);text=fs.readFileSync(f,'utf8');}
  await sleep(1200);await closeBoxes(p);const bar=await p.evaluate(()=>packet().client),said=(await toasts(p)).join(' | ');
  const shares=await p.evaluate(()=>new Promise(res=>{const r=indexedDB.open('nbh-share');r.onsuccess=()=>{try{const g=r.result.transaction('shares').objectStore('shares').getAll();g.onsuccess=()=>res(g.result.map(x=>({client:x.client,caseKey:x.caseKey,base:String(x.base||'')})));g.onerror=()=>res([]);}catch(e){res([]);}};r.onerror=()=>res([]);}));
  if(variant==='switch'){
    ok('S: the second student is on screen when the packing ends',bar===B.client,bar);
    ok('S: no file was written under the second student’s name, and none holding the first student’s case',!name||(!/Sample|SIMULATED/i.test(name.split('_for-')[0])&&!text.includes(A_WORDS)),{name,holdsFirst:text.includes(A_WORDS)});
    ok('S: no share is kept under the second student’s name or key',!shares.some(s=>s.client===B.client||s.caseKey===keyB),shares.map(s=>({client:s.client,first:s.base.includes(A_WORDS)})));
    ok('S: the message says the case was not shared and names the first student',/Not shared: another student was opened before Mateo Rivera’s file was written/.test(said),said);}
  else{ok('S control: with no switch the file is named for the first student and holds his case',/^CASE_Mateo_Rivera_for-Ms-Colleague-simulated_/.test(name)&&text.includes(A_WORDS)&&!text.includes(B_WORDS),{name});
    ok('S control: the share kept on this device is the first student’s',shares.length===1&&shares[0].client===A.client&&shares[0].base.includes(A_WORDS),shares.map(s=>s.client));}
  await c.close();}

/* ---- M: whose status it is ---- */
async function scenM(){const {c,p}=await newPage('M');
  /* the first student kept with Form DD-1; the second on screen with Forms DM-1 and DD-1 */
  await setBar(p,A);await openForm(p,'DM-1');await openForm(p,'DD-1');await keep(p);const keyA=await p.evaluate(()=>clKey(packet()));await blank(p);
  await setBar(p,B);const dm=await openForm(p,'DM-1');await setField(dm,'s.living',B_WORDS);await openForm(p,'DD-1');await sleep(4500);
  const before=await p.evaluate(()=>({filled:state.status['DM-1'].filled,who:(state.whoIs||{})['DM-1'],mis:!!state.mismatch['DM-1']}));
  /* a window that is not the case's Form DM-1 says it is (a form loaded out of sight for another student, answering late) */
  const got=await p.evaluate(async()=>{const fr=document.createElement('iframe');fr.hidden=true;document.body.appendChild(fr);
    const send=m=>fr.contentWindow.eval('parent.postMessage('+JSON.stringify(m)+',"*")');
    send({nbh:'status',id:'DM-1',status:{filled:777,total:999,sig:'foreign'},who:'Mateo Rivera',details:{note:'Mateo Rivera (simulated), another student’s details'}});
    await new Promise(r=>setTimeout(r,300));const a={filled:state.status['DM-1'].filled,who:(state.whoIs||{})['DM-1'],mis:!!state.mismatch['DM-1'],det:JSON.stringify((state.details||{})['DM-1']||'')};
    send({nbh:'snapshot',id:'DM-1',status:{filled:555,total:999,sig:'foreign2'},who:'Mateo Rivera',snap:{}});
    await new Promise(r=>setTimeout(r,300));const b={filled:state.status['DM-1'].filled,who:(state.whoIs||{})['DM-1']};fr.remove();return {a,b};});
  ok('M: a status sent under Form DM-1’s id by another window changes nothing of the case on screen (fields filled, the student named, the details)',got.a.filled===before.filled&&got.a.who===before.who&&got.a.mis===before.mis&&!/Mateo/.test(got.a.det),{before,after:got.a});
  ok('M: an answer carrying a status, sent the same way, changes nothing either',got.b.filled===before.filled&&got.b.who===before.who,{before,after:got.b});
  /* controls: the form's own status still arrives */
  await setField(dm,'s.living',B_WORDS+' More words.');await p.evaluate(()=>{delete state.status['DM-1'];ask(state.frames['DM-1'],'status');});
  const own=await p.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:6000}).then(()=>true).catch(()=>false);
  ok('M control: Form DM-1’s own status still arrives',own);
  await p.evaluate(()=>{const fr=state.frames['DM-1'];fr.__direct=true;delete state.status['DM-1'];ask(fr,'status');});
  const direct=await p.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:6000}).then(()=>true).catch(()=>false);
  await p.evaluate(()=>{state.frames['DM-1'].__direct=false;});
  ok('M control: a form talked to directly (fr.__direct) still gives its status',direct);
  /* control: the caseload's hidden frame. An incident for the first student, who is not on screen, is logged out of sight;
     nothing of it shows on the second student's Form DD-1 */
  const st0=await p.evaluate(()=>({who:(state.whoIs||{})['DD-1'],filled:(state.status['DD-1']||{}).filled}));
  const r=await p.evaluate(async([k,inc])=>{const R=(await clList()).find(x=>x.key===k),d=parseCase(R.text);return lnAway(R,d,{date:inc.date,time:'09:15',beh:inc.beh,before:'',what:inc.what,words:'',did:'',ended:'',by:'Simulated BCBA',hold:'',parent:'no',parentWhen:'',bcba:true,count:false});},[keyA,Object.assign({date:TODAY},INC)]);
  await sleep(1500);const R=await rows(p),ra=R.find(x=>x.client===A.client),dd=frameOf(p,'DD-1');
  const st1=await p.evaluate(()=>({who:(state.whoIs||{})['DD-1'],filled:(state.status['DD-1']||{}).filled,mis:!!state.mismatch['DD-1']}));
  const inc=dd?await dd.evaluate(()=>(S.incidents||[]).length).catch(()=>-1):-1;
  ok('M control: a student not on screen is still logged out of sight (the caseload’s hidden Form DD-1), in his own kept copy',!!(r&&r.ok)&&!!ra&&/Mateo hit a peer/.test(ra.text),{r,kept:!!ra});
  ok('M control: the Form DD-1 on screen is as it was: no incident, the same student, the same fields filled',inc===0&&st1.who===st0.who&&st1.filled===st0.filled&&!st1.mis,{st0,st1,inc});
  await c.close();}

/* ---- D: Read a document ---- */
const DOC='Student Name: RIVERA, MATEO J        Student ID: 4471823\nDate of Birth: 03/14/2016   Sex: M   Grade: 03\nSchool: Royal Palm School   Teacher: Ms. Alvarez (Room 12)\nHome Language: Spanish\nPrimary Exceptionality: Autism Spectrum Disorder';
async function scenD(variant){const {c,p}=await newPage('D');const hold=await holdFile(c,'DM-1',4000);
  /* the second student kept with Form DM-1 (her own words, nothing else); then the first student's bar, no form yet */
  await setBar(p,{client:B.client,sid:B.sid});const dm=await openForm(p,'DM-1');await setField(dm,'s.living',B_WORDS);await sleep(500);await keep(p);
  const keyB=await p.evaluate(()=>clKey(packet()));const textB=(await rows(p)).find(r=>r.key===keyB).text;await blank(p);
  await setBar(p,{client:A.client,sid:A.sid});
  await p.evaluate(()=>drOpen());await sleep(300);await p.fill('#drText',DOC);await p.click('#drRead');await sleep(400);
  const read=await p.evaluate(()=>document.querySelectorAll('#drOut [data-dr]:checked').length);
  /* another case is opened under the box (a case file opened into the app from Files does this) */
  const turn=()=>p.evaluate(t=>openCaseText(t,null,{asked:true,quiet:true}),textB);
  if(variant==='before'){await turn();await p.waitForFunction(c=>packet().client===c&&!!state.status['DM-1'],B.client,{timeout:30000});await sleep(1000);
    await p.evaluate(()=>{const b=document.querySelector('#drPlace');if(b)b.click();});}
  else{hold.slow=true;await p.evaluate(()=>document.querySelector('#drPlace').click());await sleep(600);hold.slow=false;await turn();   /* Place is waiting for Form DM-1 to load */
    await p.waitForFunction(c=>packet().client===c&&!!state.status['DM-1'],B.client,{timeout:30000});}
  await sleep(9000);const fr=frameOf(p,'DM-1');
  const now=await p.evaluate(()=>({bar:[...document.querySelectorAll('#pClient,#pSid,#pGrade,#pSite')].map(e=>e.value),open:document.querySelector('#dlg').open&&!!document.querySelector('#drOut')}));
  const got=fr?await fr.evaluate(()=>{const g=n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;};return {first:g('s.first'),last:g('s.last'),dob:g('s.dob'),lang:g('s.lang'),elig:g('p.elig'),room:g('s.room'),living:g('s.living')};}).catch(e=>({err:String(e)})):{err:'no Form DM-1'};
  const said=(await toasts(p)).join(' | '),tag='D ('+(variant==='before'?'another case opened before Place':'another case opened while Place waits for Form DM-1')+')';
  ok(tag+': the document was read ('+read+' details) and the second student is on screen',read>=5&&now.bar[0]===B.client,{read,bar:now.bar});
  ok(tag+': her bar holds none of the document’s details (grade, school)',now.bar[2]===''&&now.bar[3]==='',now.bar);
  ok(tag+': her Form DM-1 holds none of them (birth date, language, eligibility, teacher) and keeps her own words',!got.err&&!got.dob&&!got.lang&&!got.elig&&!got.room&&got.living===B_WORDS&&!marks(JSON.stringify(got)).length,got);
  ok(tag+': the message says nothing was placed, and the box is closed',/another case was opened after this document was read/.test(said)&&!now.open,{said,open:now.open});
  await c.close();}

/* ---- E: a Drive file that names another student than it is filed under ---- */
async function scenE(){const sim=driveSim();const {c,p}=await newPage('E',{drive:sim.drive});
  const idle=()=>p.waitForFunction(()=>!DRV.busy&&!DRV.again,null,{timeout:20000}).then(()=>sleep(300)).catch(()=>{});
  const save=async()=>{await p.evaluate(()=>document.getElementById('saveCase').click());await sleep(3000);await idle();await closeBoxes(p);};
  await p.evaluate(()=>caseloadOpen());await sleep(400);await p.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await idle();await closeBoxes(p);
  await setBar(p,B);let dm=await openForm(p,'DM-1');await setField(dm,'s.living',B_WORDS);await sleep(500);await save();await blank(p);
  await setBar(p,A);dm=await openForm(p,'DM-1');await setField(dm,'s.living',A_WORDS);await sleep(500);await save();await blank(p);await idle();
  const fA=sim.cases().find(f=>/Mateo/.test(f.name)),fB=sim.cases().find(f=>/Sample Student/.test(f.name)),R0=await rows(p);
  ok('E: both students are in Caseload and in the simulated Drive, each in a file of its own',!!(fA&&fB)&&R0.length===2&&R0.every(r=>r.drv&&r.drv.id&&!r.drv.dirty),{files:sim.cases().map(f=>f.name),rows:R0.map(r=>({client:r.client,drv:r.drv&&{id:r.drv.id,dirty:r.drv.dirty}}))});
  /* the second student's file comes to hold the first student's record and case (a file changed outside the workstation):
     filed under her (its appProperties.k is unchanged), naming him inside */
  const body=JSON.parse(fA.content);body.text=body.text.replace(A_WORDS,A_WORDS+' Words from the other file (simulated).');const at=new Date(Date.now()+60000).toISOString();body.rec.saved=at;
  fB.content=JSON.stringify(body);fB.version++;fB.modifiedTime=at;
  const calls0=sim.D.calls;await p.evaluate(()=>drvSync({}));await sleep(4000);
  const settled=await p.evaluate(()=>!DRV.busy&&!DRV.again),calls=sim.D.calls-calls0;await sleep(1500);const calls2=sim.D.calls-calls0;
  const R=await rows(p),ra=R.find(r=>r.client===A.client),rb=R.find(r=>r.client===B.client);
  ok('E: the second student’s caseload copy is still there, with her own words',!!rb&&rb.text.includes(B_WORDS)&&!marks(rb.text).length,{rows:R.map(r=>r.client)});
  ok('E: the first student’s caseload copy is his own, not the other file’s, and stands on his own Drive file',!!ra&&ra.text.includes(A_WORDS)&&!/Words from the other file/.test(ra.text)&&ra.drv&&ra.drv.id===fA.id,ra?{other:/Words from the other file/.test(ra.text),drv:ra.drv&&ra.drv.id,own:fA.id}:'no copy');
  ok('E: the sync ends (it does not start again and again over the file)',settled&&calls2===calls&&calls<40,{settled,calls,calls2});
  const line=await p.evaluate(()=>String(DRV.err||''));
  ok('E: Google Drive’s line says a file was left alone, by its name',/Sample Student \(SIM-000\)\.json/.test(line)&&/left as it is/.test(line),line);
  await c.close();}

/* ---- C and R: the reply box. The forms on their own (as a person opens one outside a case), box.php on 127.0.0.1 ---- */
/* a respondent answers a reply link on a page of its own and sends */
async function respond(url,text){const c=await br.newContext({viewport:{width:390,height:844}});const rp=await c.newPage();await rp.goto(url,{waitUntil:'load'});await sleep(700);
  await rp.evaluate(text=>{document.querySelectorAll('li.it').forEach(li=>{const r=li.querySelector('input[type=radio]');if(r)r.click();});
    const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();
    document.querySelectorAll('input[type=text],input:not([type])').forEach(i=>{if(!i.value&&!i.readOnly){i.value='Ms. Lopez';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}});   /* a page not made for one person asks the name */
    document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value=text+' '+(i+1);t.dispatchEvent(new Event('input',{bubbles:true}));});
    document.querySelector('button:not(.ghost)').click();},text);await sleep(1800);
  const done=await rp.evaluate(()=>/Sent\./.test(document.body.innerText));await c.close();return done;}
async function formPage(id){const c=await br.newContext({viewport:{width:1300,height:900},acceptDownloads:true});const pg=await c.newPage();pg.on('pageerror',e=>errs.push(id+': '+String(e.message||e).slice(0,240)));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(L.formUrl(encodeURI(FILE[id])));await sleep(1200);await pg.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});return {c,pg};}
/* Form CF-1: the student, a rater on the sheet, the reply box at this address, and that rater's link */
const cfFill=(pg,o)=>pg.evaluate(o=>{const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('client',o.client);set('sid',o.sid||'');set('bcba','Simulated BCBA');set('email','simulated.bcba@example.org');},o);
async function cfLink(pg,url){await pg.evaluate(()=>{S.raters[0].name='Ms. Lopez';S.raters[0].role='Classroom teacher';renderAll();});
  await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
  await pg.evaluate(u=>{const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},url);
  await pg.waitForFunction(()=>{const b=__rp.kit.rb().box;return !!(b&&b.site);},null,{timeout:10000});await pg.evaluate(()=>document.querySelector('#rbFromSheet').click());await sleep(200);
  const a=await pg.evaluate(()=>{const k=__rp.kit,b=k.rb().box,l=k.personLink(k.rb().sends[0]);return {box:b.id,priv:b.priv.d,stu:b.stu||'',link:l&&l.url||l,label:document.querySelector('#rpStudent').value};});
  await pg.evaluate(()=>document.querySelector('#rpDlg').close());return a;}
const cfNow=pg=>pg.evaluate(()=>({client:S.meta.client,box:S.rb&&S.rb.box&&S.rb.box.id||'',priv:S.rb&&S.rb.box&&S.rb.box.priv&&S.rb.box.priv.d||'',got:S.rb&&S.rb.box&&(S.rb.box.got||[]).length||0,
  held:(S.rb&&S.rb.box&&S.rb.box.held||[]).map(h=>({why:h.why,student:h.student,name:h.name})),raters:S.raters.map(x=>x.name).filter(Boolean),placed:S.rb&&S.rb.placed||0,all:JSON.stringify(S)}));
async function scenC(bx){
  for(const how of ['clear','file','sim','control']){const {c,pg}=await formPage('CF-1');
    await cfFill(pg,B);const fileB=await pg.evaluate(()=>JSON.stringify({form:'CF-1',rev:'2026-09',saved:new Date().toISOString(),S}));   /* the second student's saved form, no box in it */
    await pg.evaluate(()=>{S=blank();renderAll();});await cfFill(pg,A);const a=await cfLink(pg,bx.url);const sent=await respond(a.link,'Simulated comment');
    if(!ok('C '+how+': set-up: the first student’s Form CF-1 has a reply box, and a rater answered its link',!!a.box&&sent,{box:!!a.box,sent})){await c.close();continue;}
    if(how!=='control')await c.route(/box\.php\?a=list/,async r=>{await sleep(3500);r.continue().catch(()=>{});});   /* a slow connection: the Collect is on its way */
    await pg.evaluate(()=>{window.__cr=undefined;__rp.kit.collect(true).then(r=>window.__cr=r||'nothing',e=>window.__cr='error '+e);});await sleep(700);
    if(how==='clear'){await pg.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(500);await cfFill(pg,B);}
    if(how==='sim'){await pg.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);}
    if(how==='file'){await pg.setInputFiles('#fileIn',{name:'CF-1_second.json',mimeType:'application/json',buffer:Buffer.from(fileB)});await sleep(500);}
    await pg.waitForFunction(()=>window.__cr!==undefined,null,{timeout:20000}).catch(()=>{});await sleep(700);const r=await cfNow(pg);
    if(how==='control'){ok('C control: with the record left alone, the reply is placed in the first student’s own form',r.client===A.client&&r.box===a.box&&r.raters.includes('Ms. Lopez')&&r.placed===1,{client:r.client,raters:r.raters,placed:r.placed});await c.close();continue;}
    const tag='C '+(how==='clear'?'(Clear all, then the second student typed)':how==='file'?'(the second student’s saved form opened)':'(Load simulation)');
    ok(tag+': the form holds another record now, without the first student’s reply box (id, token, private key)',r.client!==A.client&&r.box!==a.box&&r.priv!==a.priv&&!r.all.includes(a.box)&&!r.all.includes(a.priv),{client:r.client,sameBox:r.box===a.box,sameKey:!!r.priv&&r.priv===a.priv});
    ok(tag+': the first student’s respondent and answers are not placed or held in it',!r.all.includes('Ms. Lopez')&&!r.placed&&!r.held.length&&!r.got,{raters:r.raters,placed:r.placed,held:r.held,got:r.got});
    await c.close();}
  /* Form IA-1 (its own reply box code): a Collect on its way when the second student's saved form, which has a box of its
     own, is opened */
  {const {c,pg}=await formPage('IA-1');const set=(n,v)=>pg.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
    const boxAt=async()=>{await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);await pg.evaluate(u=>{const e=document.querySelector('#rpBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},bx.url);
      await pg.waitForFunction(()=>{const b=__rp.box();return !!(b&&b.site);},null,{timeout:10000});};
    await set('m.client',B.client);await set('m.beh','Aggression toward staff (simulated)');await boxAt();await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    const dlB=pg.waitForEvent('download',{timeout:15000});await pg.evaluate(()=>document.querySelector('#saveBtn').click());const fB=path.join(OUT,'C-IA-1-second.json');await (await dlB).saveAs(fB);   /* her saved form, with its own box */
    const fileB=fs.readFileSync(fB,'utf8'),boxB=await pg.evaluate(()=>__rp.box().id);
    await pg.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(600);
    await set('m.client',A.client);await set('m.beh','Aggression toward staff (simulated)');await boxAt();
    const a=await pg.evaluate(()=>{const l=__rp.links(),b=__rp.box();return {box:b.id,priv:b.priv.d,link:l[0]&&l[0].url};});await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    const sent=a.link?await respond(a.link,'Simulated comment'):false;
    if(ok('C Form IA-1: set-up: each student’s form has a reply box of its own, and an informant answered the first student’s link',!!a.box&&!!boxB&&a.box!==boxB&&sent,{a:!!a.box,b:!!boxB,sent})){
      await c.route(/box\.php\?a=list/,async r=>{await sleep(3500);r.continue().catch(()=>{});});
      await pg.evaluate(()=>{window.__cr=undefined;__rp.collect(true).then(r=>window.__cr=r||'nothing',e=>window.__cr='error '+e);});await sleep(700);
      await pg.setInputFiles('#fileIn',{name:'IA-1_second.json',mimeType:'application/json',buffer:Buffer.from(fileB)});
      await pg.waitForFunction(()=>window.__cr!==undefined,null,{timeout:20000}).catch(()=>{});await sleep(900);
      const r=await pg.evaluate(()=>{const b=__rp.box();return {client:document.querySelector('[name="m.client"]').value,box:b&&b.id,got:b?b.got.length:-1,held:b?b.held.length:-1,line:['#outBoxLine','#rpBoxLine','#rcBoxLine'].map(q=>(document.querySelector(q)||{}).textContent||'').join(' | ')};});
      ok('C Form IA-1: the second student’s form keeps its own box, and nothing of the first student’s replies is noted in it (ids taken, replies held, a message)',r.client===B.client&&r.box===boxB&&r.got===0&&r.held===0&&!/could not be opened|Cannot read|undefined|null/.test(r.line),r);}
    await c.close();}}
const SAME=[['Mateo R.','Mateo Rivera'],['Mateo R.','mateo  rivera'],['Mateo R.','Matteo Rivera'],['Mateo R.','Rivera, Mateo'],['Rivera M.','Mateo Rivera'],['Mateo R.','Mateo Rivera Sanchez'],['Mateo R.','Mateo Rivera-Sanchez'],['M.R.','Mateo Rivera'],['M. R.','Mateo Luis Rivera'],['Mateo R.','M.R.'],['Mateo R.',''],['','Mateo Rivera'],['the student','Mateo Rivera'],['your student in Room 12','Mateo Rivera'],['Mateo','Mateo Rivera'],['Matt R.','Matthew Rivera'],['José R.','Jose Rivera'],['M.R. (ID 4471823)','Mateo Rivera'],['S.S.S.','SIMULATED – Sample Student'],['SIMULATED S.','SIMULATED – Sample Student']];
const OTHER=[['Mateo R.','SIMULATED – Sample Student'],['SIMULATED S.','Mateo Rivera'],['S.S.S.','Mateo Rivera'],['M.R.','SIMULATED – Sample Student'],['Mateo R.','Mateo Sanchez'],['Mateo R.','Maria Rivera'],['Leo W.','Mateo Rivera']];
async function scenR(bx){
  /* 1. what counts as another student */
  {const {c,pg}=await formPage('CF-1');const t=await pg.evaluate(([S,O])=>{const f=window.NBH_RESPOND&&NBH_RESPOND.sameStudent;if(!f)return null;return {same:S.filter(x=>!f(x[0],x[1])),other:O.filter(x=>f(x[0],x[1]))};},[SAME,OTHER]);
    ok('R: the same student under a corrected spelling, the names turned round, a second surname, initials, typed words, or no name is not taken for another ('+SAME.length+' pairs)',!!t&&!t.same.length,t?t.same:'no check in this release');
    ok('R: a plainly different student is ('+OTHER.length+' pairs)',!!t&&!t.other.length,t?t.other:'no check in this release');await c.close();}
  /* 2. the first student's Form CF-1 has a reply box and a rater's link, answered. The form's student is then changed to the
        second (the form's data kept: a case used to start another student's). The reply is not placed on its own. */
  {const {c,pg}=await formPage('CF-1');await cfFill(pg,A);const a=await cfLink(pg,bx.url);const sent=await respond(a.link,'Simulated comment');
    ok('R: set-up: the first student’s link names him by first name and last initial, and a rater answered it',sent&&/Mateo R\./.test(decodeURIComponent(String(a.link)))||sent,{sent});
    await cfFill(pg,B);await sleep(300);
    const cr=await pg.evaluate(()=>__rp.kit.collect(false).then(r=>r||'nothing'));await sleep(500);const r=await cfNow(pg);
    const shown=await pg.evaluate(()=>{document.querySelector('#rcBtn').click();return new Promise(res=>setTimeout(()=>res((document.querySelector('#rbHeld')||{}).textContent||''),300));});
    ok('R: a reply about the first student, collected by a form that is now the second student’s, is held and not placed',r.client===B.client&&!r.placed&&r.held.length===1&&r.held[0].why==='student'&&!!cr&&cr.placed===0,{placed:r.placed,held:r.held,cr});
    ok('R: the held reply says which student it is about and which this form is about, and can be kept or discarded',/it is about Mateo R\., and this form is about SIMULATED S\./.test(shown)&&/Keep and place it/.test(shown)&&/Discard/.test(shown),shown.slice(0,400));
    await pg.evaluate(()=>{const d=document.querySelector('#rcDlg');if(d&&d.open)d.close();});
    /* 3. a page or link made now: the label is the second student's, and the box is a new one */
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());if(await qBox(pg,2500))await qAnswer(pg,/^Different student/);   /* a reply has come, so the form asks (scenario Q) */
    await pg.waitForFunction(b=>{const x=__rp.kit.rb().box;return !!(x&&x.site&&x.id!==b);},a.box,{timeout:8000}).catch(()=>{});
    const l=await pg.evaluate(()=>{const k=__rp.kit,b=k.rb().box,p=k.personPayload(k.rb().sends[0]);return {box:b&&b.id||'',stu:b&&b.stu||'',link:p&&p.box&&p.box.b||'',student:p&&p.student,label:document.querySelector('#rpStudent').value,note:document.querySelector('#rbNote').textContent,all:JSON.stringify(S)};});
    ok('R: a link made after the form’s student changed carries a new reply box, and the first student’s (id, token, private key) is gone from the form',!!l.box&&l.box!==a.box&&l.link===l.box&&l.stu==='SIMULATED S.'&&!l.all.includes(a.box)&&!l.all.includes(a.priv),{newBox:l.box!==a.box,link:l.link===l.box,stu:l.stu,stillHasFirst:l.all.includes(a.box)});
    ok('R: the page’s student label is the second student’s initials, and the note says the form started a box of its own',l.label==='S.S.S.'&&/reply box was made for Mateo R\., and the form is now about SIMULATED S\./.test(l.note),{label:l.label,note:l.note});
    await c.close();}
  /* 4. the same student, his name corrected: his reply is placed as before, and his box is kept */
  {const {c,pg}=await formPage('CF-1');await cfFill(pg,A);const a=await cfLink(pg,bx.url);const sent=await respond(a.link,'Simulated comment');
    await cfFill(pg,{client:'Matteo Rivera Sanchez',sid:A.sid});await sleep(300);
    await pg.evaluate(()=>__rp.kit.collect(false).then(r=>r||'nothing'));await sleep(500);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(900);const r=await cfNow(pg);
    ok('R control: the same student with his name corrected (a spelling, a second surname): the reply is placed, nothing is held, and the box is kept',sent&&r.raters.includes('Ms. Lopez')&&r.placed===1&&!r.held.length&&r.box===a.box,{raters:r.raters,placed:r.placed,held:r.held,sameBox:r.box===a.box});
    await c.close();}
  /* 5. Form IA-1's own code: the same two rules */
  {const {c,pg}=await formPage('IA-1');const set=(n,v)=>pg.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
    await set('m.client',A.client);await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
    await pg.evaluate(u=>{const e=document.querySelector('#rpBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},bx.url);await pg.waitForFunction(()=>{const b=__rp.box();return !!(b&&b.site);},null,{timeout:10000});
    const a=await pg.evaluate(()=>({box:__rp.box().id,stu:__rp.box().stu||''}));await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    await set('m.client',B.client);
    const sc=await pg.evaluate(()=>{if(!__rp.screen)return {keep:[],flag:[],none:'no such check in this release'};const r=__rp.screen([{form:'IA-1',inst:'fast',student:'Mateo R.',name:'Ms. Lopez',beh:'',ans:[]},{form:'IA-1',inst:'fast',student:'S.S.S.',name:'Mr. Ortiz',beh:'',ans:[]}]);return {keep:r.keep.map(o=>o.name),flag:r.flag.map(o=>o.name+':'+o.why)};});
    ok('R Form IA-1: a reply about the first student is held in a form that is now the second student’s; one about her is not',sc.keep.join()==='Mr. Ortiz'&&sc.flag.join()==='Ms. Lopez:student',sc);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());await pg.waitForFunction(b=>{const x=__rp.box();return !!(x&&x.site&&x.id!==b);},a.box,{timeout:8000}).catch(()=>{});
    const l=await pg.evaluate(()=>{const b=__rp.box(),p=__rp.payload()||{};return {box:b&&b.id||'',stu:b&&b.stu||'',link:(p.box||{}).b||'',label:document.querySelector('#rpStudent').value,note:document.querySelector('#rpNote').textContent};});
    ok('R Form IA-1: the first student’s box is not put in a link for the second, and the form starts a box of its own (the label and the note follow)',!!l.box&&l.box!==a.box&&l.link===l.box&&l.label==='S.S.S.'&&/reply box was made for Mateo R\./.test(l.note),{newBox:l.box!==a.box,l});
    await c.close();}}

/* ---- Q: the question before a link, when the box was made for what reads as another student and links have gone out ---- */
/* the form's question box, when it is open: its words and its buttons */
async function qBox(pg,ms){const t=Date.now();while(Date.now()-t<(ms||2500)){
  const q=await pg.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(!d||!d.open)return null;return {head:document.getElementById('nbhUiH').textContent,body:document.getElementById('nbhUiB').textContent,btns:[...document.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)};}).catch(()=>null);
  if(q)return q;await sleep(80);}return null;}
const qAnswer=async(pg,re)=>{const r=await pg.evaluate(src=>{const b=[...document.querySelectorAll('#nbhUiF button')].find(x=>new RegExp(src).test(x.textContent));if(b)b.click();return !!b;},re.source);await sleep(300);return r;};
const Q_HEAD=/^Is SIMULATED – Sample Student the same student as Mateo R\.\?$/;
const qWords=q=>!!q&&Q_HEAD.test(q.head)&&/reply box was made for Mateo R\., and links from it have gone out/.test(q.body)&&/Same student: the box stays\. Links already sent keep working/.test(q.body)&&/Different student: this form starts a new reply box\. Answers to links already sent no longer come to this form/.test(q.body)&&/Cancel: no link is made, and nothing changes/.test(q.body)
  &&q.btns.join(' | ')==='Cancel | Same student: keep the reply box | Different student: start a new one';
/* Form CF-1 for the first student: two raters on the sheet, each with a link of their own; the first answers and is collected */
async function cfOut(pg,bx){await cfFill(pg,A);await pg.evaluate(()=>{S.raters[0].name='Ms. Lopez';S.raters[0].role='Classroom teacher';S.raters[1].name='Mr. Ortiz';S.raters[1].role='Paraprofessional';renderAll();});
  await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
  await pg.evaluate(u=>{const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},bx.url);
  await pg.waitForFunction(()=>{const b=__rp.kit.rb().box;return !!(b&&b.site);},null,{timeout:10000});await pg.evaluate(()=>document.querySelector('#rbFromSheet').click());await sleep(200);
  const a=await pg.evaluate(()=>{const k=__rp.kit,b=k.rb().box,u=s=>{const l=k.personLink(s);return l&&l.url||l;},S2=k.rb().sends;return {box:b.id,priv:b.priv.d,stu:b.stu||'',links:S2.map(u),names:S2.map(s=>s.name)};});
  await pg.evaluate(()=>document.querySelector('#rpDlg').close());
  a.sent=await respond(a.links[a.names.indexOf('Ms. Lopez')],'Simulated comment');
  a.first=await pg.evaluate(()=>__rp.kit.collect(false).then(r=>r&&r.placed||0));await sleep(400);return a;}
const cfBox=pg=>pg.evaluate(()=>{const k=__rp.kit,r=k.rb(),b=r.box,p=k.personPayload(r.sends.find(s=>s.name==='Mr. Ortiz')||r.sends[0]);
  return {box:b&&b.id||'',stu:b&&b.stu||'',aka:b&&b.aka||[],link:p&&p.box&&p.box.b||'',dlg:document.querySelector('#rpDlg').open,note:(document.querySelector('#rbNote')||{}).textContent||'',placed:r.placed,held:b?b.held.length:0,all:JSON.stringify(S)};});
async function scenQ(bx){
  /* 1. Cancel, then Same student */
  {const {c,pg}=await formPage('CF-1');const a=await cfOut(pg,bx);
    ok('Q: set-up: the first student’s Form CF-1 has a reply box, two raters have links, and the first rater’s answer is collected (links have gone out)',!!a.box&&a.links.length===2&&a.sent&&a.first===1,{box:!!a.box,links:a.links.length,sent:a.sent,first:a.first});
    await cfFill(pg,B);await sleep(300);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,3000);
    ok('Q: opening Respondent pages asks first, naming both names as the form has them, and says what each choice does to the links already sent',qWords(q),q||'no question');
    const mid=await cfBox(pg);
    ok('Q: while the question is open the box is as it was, and a link made meanwhile carries no box',mid.box===a.box&&mid.stu==='Mateo R.'&&!mid.link,{sameBox:mid.box===a.box,stu:mid.stu,link:mid.link});
    await qAnswer(pg,/^Cancel$/);const can=await cfBox(pg);
    ok('Q: Cancel: Respondent pages is closed (no link is made) and nothing changes: the same box, kept for the first student',!!q&&!can.dlg&&can.box===a.box&&can.stu==='Mateo R.'&&can.all.includes(a.priv),{dlg:can.dlg,sameBox:can.box===a.box,stu:can.stu});
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q2=await qBox(pg,3000);
    ok('Q: it is asked again the next time',qWords(q2),q2||'no question');
    await qAnswer(pg,/^Same student/);await sleep(600);const keep=await cfBox(pg);
    ok('Q: Same student: the box and its links stay, the name kept with the box becomes this student’s, and Respondent pages is open',!!q2&&keep.dlg&&keep.box===a.box&&keep.stu==='SIMULATED S.'&&keep.aka.includes('Mateo R.')&&keep.link===a.box&&/reply box is kept/.test(keep.note),{dlg:keep.dlg,sameBox:keep.box===a.box,stu:keep.stu,aka:keep.aka,link:keep.link===a.box,note:keep.note});
    await pg.evaluate(()=>document.querySelector('#rpDlg').close());await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q3=await qBox(pg,1800);
    ok('Q: after Same student it is not asked again',!!q2&&!q3,q3);await pg.evaluate(()=>{const d=document.querySelector('#rpDlg');if(d.open)d.close();});
    /* the second rater answers the link sent before the name changed (it says Mateo R.): placed, not held */
    const sent2=await respond(a.links[a.names.indexOf('Mr. Ortiz')],'Simulated comment');await pg.evaluate(()=>__rp.kit.collect(false).then(r=>r||'nothing'));await sleep(500);const aft=await cfBox(pg);
    ok('Q: after Same student, an answer to a link sent before is placed in this form, not held',!!q2&&sent2&&aft.placed===2&&aft.held===0,{sent2,placed:aft.placed,held:aft.held});
    await c.close();}
  /* 2. Different student */
  {const {c,pg}=await formPage('CF-1');const a=await cfOut(pg,bx);await cfFill(pg,B);await sleep(300);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,3000);
    await qAnswer(pg,/^Different student/);await pg.waitForFunction(b=>{const x=__rp.kit.rb().box;return !!(x&&x.site&&x.id!==b);},a.box,{timeout:8000}).catch(()=>{});const nw=await cfBox(pg);
    ok('Q: Different student: asked first, then the form starts a new reply box; the first student’s (id, private key) is gone from the form, and the note says so',qWords(q)&&nw.dlg&&!!nw.box&&nw.box!==a.box&&nw.link===nw.box&&nw.stu==='SIMULATED S.'&&!nw.all.includes(a.box)&&!nw.all.includes(a.priv)&&/reply box was made for Mateo R\., and the form is now about SIMULATED S\./.test(nw.note),{asked:!!q,dlg:nw.dlg,newBox:nw.box!==a.box,link:nw.link===nw.box,stu:nw.stu,note:nw.note});
    await pg.evaluate(()=>document.querySelector('#rpDlg').close());await pg.evaluate(()=>document.querySelector('#rpBtn').click());
    ok('Q: after Different student it is not asked again',!!q&&!(await qBox(pg,1800)));await c.close();}
  /* 3. nothing sent, nothing received: no question, the new box as before */
  {const {c,pg}=await formPage('CF-1');await cfFill(pg,A);await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
    await pg.evaluate(u=>{const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},bx.url);
    await pg.waitForFunction(()=>{const b=__rp.kit.rb().box;return !!(b&&b.site);},null,{timeout:10000});const a=await pg.evaluate(()=>__rp.kit.rb().box.id);await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    await cfFill(pg,B);await sleep(300);await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,1800);
    await pg.waitForFunction(b=>{const x=__rp.kit.rb().box;return !!(x&&x.site&&x.id!==b);},a,{timeout:8000}).catch(()=>{});
    const r=await pg.evaluate(()=>{const b=__rp.kit.rb().box;return {box:b&&b.id||'',stu:b&&b.stu||'',dlg:document.querySelector('#rpDlg').open,note:document.querySelector('#rbNote').textContent};});
    ok('Q: with no link sent and no answer received there is nothing to lose: no question, and the form starts its own box as before',!q&&r.dlg&&!!r.box&&r.box!==a&&r.stu==='SIMULATED S.'&&/starts a reply box of its own/.test(r.note),{asked:!!q,r});await c.close();}
  /* 4. Form IA-1 (its own code): the same question, from Respondent pages and from the Send-outs sheet */
  const ia=async()=>{const {c,pg}=await formPage('IA-1');const set=(n,v)=>pg.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
    await set('m.client',A.client);await set('m.beh','Aggression toward staff (simulated)');await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
    await pg.evaluate(u=>{const e=document.querySelector('#rpBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},bx.url);await pg.waitForFunction(()=>{const b=__rp.box();return !!(b&&b.site);},null,{timeout:10000});
    return {c,pg,set,now:()=>pg.evaluate(()=>{const b=__rp.box(),p=__rp.payload()||{};return {box:b&&b.id||'',stu:b&&b.stu||'',aka:b&&b.aka||[],link:(p.box||{}).b||'',dlg:document.querySelector('#rpDlg').open};})};};
  {const f=await ia(),{pg}=f;const a=await pg.evaluate(()=>{const l=__rp.links(),b=__rp.box();return {box:b.id,link:l[0]&&l[0].url};});await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    const sent=a.link?await respond(a.link,'Simulated comment'):false;await pg.evaluate(()=>__rp.collect(true).then(()=>1,()=>0));await sleep(500);const got=await pg.evaluate(()=>__rp.box().got.length);
    ok('Q Form IA-1: set-up: the first student’s form has a reply box, and an answer to its link has come',!!a.box&&sent&&got===1,{box:!!a.box,sent,got});
    await f.set('m.client',B.client);
    await pg.evaluate(()=>document.querySelector('#outPagesBtn').click());const q0=await qBox(pg,3000);await qAnswer(pg,/^Cancel$/);const s0=await f.now();
    ok('Q Form IA-1: the Send-outs sheet’s pages ask the same question before any is made; Cancel changes nothing',qWords(q0)&&s0.box===a.box&&s0.stu==='Mateo R.',{q:q0||'no question',sameBox:s0.box===a.box,stu:s0.stu});
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,3000);const mid=await f.now();await qAnswer(pg,/^Cancel$/);const can=await f.now();
    ok('Q Form IA-1: Respondent pages asks before it opens; Cancel leaves it closed and the box as it was',qWords(q)&&!mid.dlg&&!mid.link&&!can.dlg&&can.box===a.box&&can.stu==='Mateo R.',{q:q||'no question',mid,can:{dlg:can.dlg,sameBox:can.box===a.box,stu:can.stu}});
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q2=await qBox(pg,3000);await qAnswer(pg,/^Same student/);await sleep(500);const keep=await f.now();
    ok('Q Form IA-1: Same student: the box stays and is this student’s now, Respondent pages opens, and a link carries the box',!!q2&&keep.dlg&&keep.box===a.box&&keep.stu==='SIMULATED S.'&&keep.aka.includes('Mateo R.')&&keep.link===a.box,{asked:!!q2,keep});
    const held=await pg.evaluate(()=>{if(!__rp.screen)return ['no such check'];const r=__rp.screen([{form:'IA-1',inst:'fast',student:'M.R.',name:'Ms. Lopez',beh:'',ans:[]}]);return r.flag.map(o=>o.why);});
    ok('Q Form IA-1: after Same student, an answer to a page made before (it says M.R.) is not held as another student’s',!!q2&&!held.length,held);
    await pg.evaluate(()=>document.querySelector('#rpDlg').close());await pg.evaluate(()=>document.querySelector('#rpBtn').click());
    ok('Q Form IA-1: after Same student it is not asked again',!!q2&&!(await qBox(pg,1800)));await f.c.close();}
  {const f=await ia(),{pg}=f;const a=await pg.evaluate(()=>{const l=__rp.links(),b=__rp.box();return {box:b.id,link:l[0]&&l[0].url};});await pg.evaluate(()=>document.querySelector('#rpDlg').close());
    if(a.link)await respond(a.link,'Simulated comment');await pg.evaluate(()=>__rp.collect(true).then(()=>1,()=>0));await sleep(500);await f.set('m.client',B.client);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,3000);await qAnswer(pg,/^Different student/);
    await pg.waitForFunction(b=>{const x=__rp.box();return !!(x&&x.site&&x.id!==b);},a.box,{timeout:8000}).catch(()=>{});const nw=await f.now();
    ok('Q Form IA-1: Different student: asked first, then a new reply box, which the link carries; Respondent pages opens',qWords(q)&&nw.dlg&&!!nw.box&&nw.box!==a.box&&nw.link===nw.box&&nw.stu==='SIMULATED S.',{asked:!!q,nw,newBox:nw.box!==a.box});await f.c.close();}
  {const f=await ia(),{pg}=f;const a=await pg.evaluate(()=>__rp.box().id);await pg.evaluate(()=>document.querySelector('#rpDlg').close());await f.set('m.client',B.client);
    await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,1800);await pg.waitForFunction(b=>{const x=__rp.box();return !!(x&&x.site&&x.id!==b);},a,{timeout:8000}).catch(()=>{});const r=await f.now();
    ok('Q Form IA-1: with nothing sent and nothing received: no question, and the form starts its own box as before',!q&&r.dlg&&!!r.box&&r.box!==a&&r.stu==='SIMULATED S.',{asked:!!q,r,newBox:r.box!==a});await f.c.close();}}

(async()=>{
  br=await L.chromium.launch();
  try{
    if(want('L')){await scenL('switch');await scenL('control');}
    if(want('N'))await scenN();
    if(want('S')){await scenS('switch');await scenS('control');}
    if(want('M'))await scenM();
    if(want('D')){await scenD('before');await scenD('during');}
    if(want('E'))await scenE();
    if(want('C')||want('R')||want('Q')){const bx=await box(8976);try{if(want('C'))await scenC(bx);if(want('R'))await scenR(bx);if(want('Q'))await scenQ(bx);}finally{bx.php.kill();}}
  }catch(e){ok('the run reached its end',false,String(e&&e.stack||e).slice(0,900));}
  finally{await br.close();}
  ok('no page errors',!errs.length,errs.slice(0,6));
  console.log(fails?'FAILED: '+fails+' of '+n:'all '+n+' passed');process.exit(fails?1:0);
})();
