/* v21.89 the caseload in Google Drive: an iPad and a laptop share one caseload through a (simulated) school Google Drive.
   Use Google Drive on each; Save case keeps the case here and sends it (no file downloaded); the other device gets it and opens
   the newest copy; the case on screen told when a newer copy came from the other device; a copy changed on both without the
   other asks which to keep and puts the other in Replaced copies; a save with the sign-in over waits and goes at the next one;
   Remove everywhere and Remove only here; a personal account warned; a different account refused; the Drive API not turned on
   said plainly; Save case to a file still writes one. Google (sign-in, userinfo, Drive) is simulated in this test.
   Simulated students only.  usage: node qa/v2189-drive-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const WS=BASE+'/NBH-Workstation/index.html';
const SCHOOL='simulated.bcba@palmbeachschools.org';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const UA_IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const UA_MAC='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
/* ---- a small Google Drive: folders and files with appProperties, versions, multipart uploads, the queries the workstation makes ---- */
const D={files:new Map(),n:0,who:SCHOOL,off:false,calls:0,sess:new Map(),res:0,mpMax:0};   /* v21.97 sess: open resumable uploads; res: content PUTs; mpMax: the largest multipart body */
const now=()=>new Date(Date.now()+D.n*1000).toISOString();
function evalQ(q,f){if(/trashed=false/.test(q)&&f.trashed)return false;
  const mt=/mimeType='([^']+)'/.exec(q);if(mt&&f.mimeType!==mt[1])return false;
  const par=/'([^']+)' in parents/.exec(q);if(par&&!(f.parents||[]).includes(par[1]))return false;
  const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)];if(ap.length&&!ap.some(m=>(f.appProperties||{})[m[1]]===m[2]))return false;return true;}
const pick=f=>({id:f.id,name:f.name,version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties});
function parts(ct,body){const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));}
async function drive(route){const req=route.request(),u=new URL(req.url()),m=req.method();D.calls++;
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/oauth2/v3/userinfo')return json({email:D.who});
  if(D.off)return json({error:{code:403,message:'Google Drive API has not been used in project 123 before or it is disabled.',errors:[{reason:'accessNotConfigured'}]}},403);
  let mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
  if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>evalQ(q,f)).map(pick)});}
  if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
  if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
  if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta)f.trashed=meta.trashed;f.version++;D.n++;f.modifiedTime=now();return json({id:f.id});}
  mm=/^\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(u.pathname);
  /* v21.97 the resumable upload: the metadata first (Google answers with the address for the content), then the content in a PUT */
  if(mm&&u.searchParams.get('uploadType')==='resumable'&&(m==='POST'||m==='PATCH')){const h=req.headers();const meta=JSON.parse(req.postData()||'{}');
    if(!h['x-upload-content-length'])return json({error:{code:400,message:'X-Upload-Content-Length missing'}},400);
    D.n++;const sid='s'+D.n;D.sess.set(sid,{id:mm[1]||'',meta,len:+h['x-upload-content-length']});
    return route.fulfill({status:200,headers:{'Location':'https://www.googleapis.com/upload/drive/v3/files'+(mm[1]?'/'+mm[1]:'')+'?uploadType=resumable&upload_id='+sid,'Access-Control-Expose-Headers':'Location'},body:''});   /* Location is not a CORS-safelisted header: Google exposes it, so does the simulation */}
  if(mm&&u.searchParams.get('upload_id')&&m==='PUT'){const s=D.sess.get(u.searchParams.get('upload_id'));if(!s)return json({error:{code:404,message:'no such upload'}},404);
    const content=req.postData()||'';if(Buffer.byteLength(content)!==s.len)return json({error:{code:400,message:'length differs: '+Buffer.byteLength(content)+' vs '+s.len}},400);
    D.sess.delete(u.searchParams.get('upload_id'));D.res++;D.n++;const meta=s.meta;
    if(!s.id){const id='f'+D.n;const f=Object.assign({id,version:1,modifiedTime:now(),trashed:false},meta,{content});D.files.set(id,f);return json(pick(f));}
    const f=D.files.get(s.id);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;f.modifiedTime=now();return json(pick(f));}
  if(mm){const raw=req.postData()||'';D.mpMax=Math.max(D.mpMax,Buffer.byteLength(raw));if(Buffer.byteLength(raw)>5*1048576)return json({error:{code:413,message:'Request Entity Too Large'}},413);
    const [metaS,content]=parts(req.headers()['content-type'],raw);const meta=JSON.parse(metaS);D.n++;
    if(m==='POST'){const id='f'+D.n;const f=Object.assign({id,version:1,modifiedTime:now(),trashed:false},meta,{content});D.files.set(id,f);return json(pick(f));}
    const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;f.modifiedTime=now();return json(pick(f));}
  return json({error:{code:400,message:'not simulated: '+m+' '+u.pathname}},400);}
const cases=()=>[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='case'&&!f.trashed);
const olds=()=>[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='old'&&f.mimeType!=='application/vnd.google-apps.folder');
async function device(br,ua,touch){const ctx=await br.newContext({viewport:touch?{width:1180,height:820}:{width:1440,height:900},userAgent:ua,hasTouch:!!touch,serviceWorkers:'block',acceptDownloads:true});
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.__gsFail='';window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;
      setTimeout(()=>{if(window.__gsFail){const t=window.__gsFail;if(cfg.error_callback)cfg.error_callback({type:t});return;}cfg.callback({access_token:'simulated-drive-token-'+window.__gsAsk,expires_in:3600});},20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await ctx.route('https://www.googleapis.com/**',drive);await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));let dl=0;page.on('download',()=>dl++);
  await page.goto(WS);await sleep(1300);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;window.alert=()=>{};const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    ['nbh.drive.on','nbh.drive.acct','nbh.drive.skip','nbh.drive.gone','nbh.drive.dev'].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem('nbh.google.drive');});
  return {ctx,page,errs,dls:()=>dl};}
const setBar=(page,v)=>page.evaluate(v=>{const set=(s,x)=>{const e=document.querySelector(s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',v.client);set('#pSid',v.sid||'');set('#pSite',v.site||'');},v);
async function openDM(page){await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(1200);return page.frames().find(f=>/DM-1_Student/.test(f.url()));}
const setField=(fr,name,v)=>fr.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
const getField=(fr,name)=>fr.evaluate(n=>document.querySelector('[name="'+n+'"]').value,name);
const rec=(page,client)=>page.evaluate(async c=>{const r=(await clList()||[]).find(x=>x.client===c);return r?{dev:r.dev,drv:r.drv,saved:r.saved,text:r.text}:null;},client);
const idle=page=>page.waitForFunction(()=>!DRV.busy,null,{timeout:20000}).then(()=>sleep(250));
/* a choice box of the workstation: its title and buttons; press the one whose label matches */
const dlgOf=page=>page.evaluate(()=>{const d=document.getElementById('cfDlg');return {open:d.open,t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(x=>x.textContent)};});
const press=(page,re)=>page.evaluate(src=>{const re=new RegExp(src);const b=[...document.querySelectorAll('#cfFoot button')].find(x=>re.test(x.textContent));if(b)b.click();return !!b;},re.source);
(async()=>{const br=await chromium.launch();
  try{
  const A=await device(br,UA_IPAD,true),B=await device(br,UA_MAC,false);
  /* 1 the iPad: Use Google Drive, then Save case of a student */
  await A.page.evaluate(()=>caseloadOpen());await sleep(500);
  const box0=await A.page.evaluate(()=>{const b=document.getElementById('drvBox');return b?b.textContent:'';});
  ok('1 Caseload offers Use Google Drive, with the school account wording',/Use Google Drive/.test(box0)&&/school Google Drive/.test(box0),box0);
  await A.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await idle(A.page);
  const s1=await A.page.evaluate(()=>({on:localStorage.getItem('nbh.drive.on'),acct:localStorage.getItem('nbh.drive.acct'),chip:document.getElementById('drvChip').textContent,box:(document.getElementById('drvBox')||{}).textContent||''}));
  ok('2 linked: the school account kept, the chip says Drive ✓, Caseload names the account and this device (iPad)',s1.on==='1'&&s1.acct===SCHOOL&&/Drive ✓/.test(s1.chip)&&/this device: iPad/.test(s1.box),s1);
  await A.page.evaluate(()=>document.getElementById('dlg').close());
  await setBar(A.page,{client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School'});
  const a1=await openDM(A.page);await setField(a1,'s.living','Lives with mother and grandmother (simulated).');await sleep(600);
  await A.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(A.page);
  const r1=await rec(A.page,'Mateo Rivera'),c1=cases();
  ok('3 Save case with Drive in use: no file downloaded, the case kept here (by the iPad) and in Drive, nothing waiting',A.dls()===0&&r1&&r1.dev==='iPad'&&r1.drv&&!r1.drv.dirty&&c1.length===1&&/Mateo Rivera/.test(c1[0].content)&&/grandmother/.test(c1[0].content)&&c1[0].appProperties.dev==='iPad',{dls:A.dls(),r1:r1&&{dev:r1.dev,drv:r1.drv},n:c1.length});
  const dirtyDot=await A.page.evaluate(()=>caseDirty());
  ok('4 the case is marked saved (no unsaved dot) and the chip is ✓',!dirtyDot&&/Drive ✓/.test(await A.page.evaluate(()=>document.getElementById('drvChip').textContent)));
  /* 5 the laptop joins and gets the student */
  await B.page.evaluate(()=>caseloadOpen());await sleep(400);await B.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await idle(B.page);
  const b1=await B.page.evaluate(async()=>{const L=await clList()||[];const tr=document.querySelector('#dlgBody .cl-card[data-clrow]');return {n:L.length,who:L[0]&&L[0].client,dev:L[0]&&L[0].dev,row:tr?tr.textContent:'',box:(document.getElementById('drvBox')||{}).textContent||''};});
  ok('5 the laptop uses Google Drive and gets Mateo Rivera, saved on the iPad; this device is the Mac',b1.n===1&&b1.who==='Mateo Rivera'&&b1.dev==='iPad'&&/on the iPad/.test(b1.row)&&/this device: Mac/.test(b1.box),b1);
  await B.page.evaluate(()=>{document.getElementById('dlg').close();paintBlank();});await sleep(700);
  const bl=await B.page.evaluate(()=>(document.getElementById('blankDrv')||{}).textContent||'');
  ok('6 the laptop’s start screen: Last saved: Mateo Rivera, today, on the iPad, with Open',/Last saved: Mateo Rivera, today at .* on the iPad\s*Open/.test(bl),bl);
  /* 7 the laptop opens and changes the case and saves */
  await B.page.evaluate(()=>document.querySelector('#blankDrv [data-clopen]').click());await sleep(2500);
  const b2=await openDM(B.page);const lv=await getField(b2,'s.living');
  ok('7 opened on the laptop from Drive’s copy: the iPad’s words are there',/grandmother/.test(lv),lv);
  await setField(b2,'s.living','Lives with mother, grandmother and an older brother (simulated).');await sleep(600);
  await B.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(B.page);
  const v2=cases()[0];ok('8 the laptop’s save goes over the same file in Drive (version 2, saved by the Mac)',cases().length===1&&+v2.version===2&&v2.appProperties.dev==='Mac'&&/older brother/.test(v2.content),{n:cases().length,v:v2.version,dev:v2.appProperties.dev});
  /* 9 back on the iPad: the open case is older than Drive's: the bar says so and opens the newer copy */
  await A.page.evaluate(()=>drvSync({}));await idle(A.page);await sleep(400);
  const bar=await A.page.evaluate(()=>({hidden:document.getElementById('drvBar').hidden,t:document.getElementById('drvBarText').textContent}));
  ok('9 the iPad, with the older copy open: “Mateo Rivera was saved on the Mac today at …, after this copy was opened here.”',!bar.hidden&&/Mateo Rivera was saved on the Mac today at .*after this copy was opened here\./.test(bar.t),bar);
  await A.page.evaluate(()=>document.getElementById('drvBarOpen').click());await sleep(2500);
  const a2=await openDM(A.page);const lv2=await getField(a2,'s.living');const bar2=await A.page.evaluate(()=>document.getElementById('drvBar').hidden);
  ok('10 Open the newer copy: the iPad shows the laptop’s words and the bar is gone',/older brother/.test(lv2)&&bar2,{lv2,bar2});
  /* 11 the iPad saves with the sign-in over (the Google window closed): the save waits on the iPad */
  await A.page.evaluate(()=>{sessionStorage.removeItem('nbh.google.drive');window.__gsFail='popup_closed';});
  await setField(a2,'s.court','No court involvement (simulated, iPad).');await sleep(600);
  await A.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);
  const w=await A.page.evaluate(async()=>{await drvPaint();const r=(await clList()||[])[0];return {chip:document.getElementById('drvChip').textContent,dirty:r.drv.dirty,ask:window.__gsAsk,dl:0};});
  ok('11 signed out: Save case asked Google once (the window was closed), the case is kept on the iPad and the chip says 1 waiting · sign in',w.dirty&&/1 waiting · sign in/.test(w.chip)&&w.ask>=1&&A.dls()===0,w);
  /* 12 meanwhile the laptop changes the same student */
  await setField(b2,'s.court','Court date pending (simulated, laptop).');await sleep(600);
  await B.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(B.page);
  /* 13 the iPad signs in from the chip: two different copies, asked */
  await A.page.evaluate(()=>{window.__gsFail='';document.getElementById('drvChip').click();});await sleep(1500);
  const q=await dlgOf(A.page);
  ok('13 the iPad signs in: “Mateo Rivera: two different copies”, each device and time named, the choice offered',q.open&&/Mateo Rivera: two different copies/.test(q.t)&&/This iPad saved it today at/.test(q.b)&&/The Mac saved it today at/.test(q.b)&&/Replaced copies/.test(q.b)&&q.btns.includes('Keep this iPad’s')&&q.btns.includes('Keep the Mac’s'),q);
  await press(A.page,/Keep the Mac’s/);await sleep(1500);await idle(A.page);
  const k=await A.page.evaluate(async()=>{const r=(await clList()||[])[0];return {dirty:r.drv.dirty,laptop:/Court date pending/.test(r.text),bar:!document.getElementById('drvBar').hidden};});
  const ol=olds();
  ok('14 Keep the Mac’s: the iPad’s copy is the laptop’s, the iPad’s own goes to Replaced copies in Drive, the bar offers the kept copy',!k.dirty&&k.laptop&&k.bar&&ol.length===1&&/simulated, iPad/.test(ol[0].content)&&/not kept, from this iPad/.test(ol[0].name),{k,old:ol.map(f=>f.name)});
  await A.page.evaluate(()=>document.getElementById('drvBarOpen').click());await sleep(2500);
  /* 15 a second student on the laptop; Remove only here on the iPad, then a new save on the laptop brings it back */
  await B.page.evaluate(()=>clearCase());await sleep(700);
  await setBar(B.page,{client:'SIMULATED – Sample Student',sid:'9990001',site:'Royal Palm School'});const b3=await openDM(B.page);await setField(b3,'pr.notes','Sample notes (simulated).');await sleep(600);
  await B.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(B.page);
  await A.page.evaluate(()=>drvSync({}));await idle(A.page);
  const two=await A.page.evaluate(async()=>(await clList()||[]).map(r=>r.client).sort());
  ok('15 the laptop’s second student reaches the iPad',two.length===2&&two.includes('SIMULATED – Sample Student'),two);
  await A.page.evaluate(()=>caseloadOpen());await sleep(500);
  await A.page.evaluate(()=>{const tr=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(t=>/Sample Student/.test(t.textContent));tr.querySelector('[data-cldel]').click();});await sleep(500);
  const rq=await dlgOf(A.page);ok('16 Remove asks: everywhere (Drive and the other devices) or only this iPad',rq.open&&/Remove Sample Student\?/.test(rq.t)&&rq.btns.includes('Remove everywhere')&&rq.btns.includes('Only this iPad'),rq);
  await press(A.page,/Only this iPad/);await sleep(800);await A.page.evaluate(()=>drvSync({}));await idle(A.page);
  const here=await A.page.evaluate(async()=>(await clList()||[]).map(r=>r.client));
  ok('17 Only this iPad: gone here, still in Drive, and the next sync does not bring it back',here.length===1&&here[0]==='Mateo Rivera'&&cases().length===2,{here,drive:cases().length});
  await setField(b3,'pr.notes','Sample notes, changed again (simulated).');await sleep(500);await B.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(B.page);
  await A.page.evaluate(()=>drvSync({}));await idle(A.page);
  const back=await A.page.evaluate(async()=>(await clList()||[]).map(r=>r.client));
  ok('18 saved again on the laptop: the student comes back to the iPad',back.length===2,back);
  /* 19 Remove everywhere on the laptop: the iPad drops it at its next sync */
  await B.page.evaluate(()=>clearCase());await sleep(700);await B.page.evaluate(()=>caseloadOpen());await sleep(500);
  await B.page.evaluate(()=>{const tr=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(t=>/Sample Student/.test(t.textContent));tr.querySelector('[data-cldel]').click();});await sleep(500);
  await press(B.page,/Remove everywhere/);await sleep(1500);await idle(B.page);
  const gone=[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='gone');
  await A.page.evaluate(()=>drvSync({}));await idle(A.page);
  const after=await A.page.evaluate(async()=>(await clList()||[]).map(r=>r.client));
  ok('19 Remove everywhere: Drive keeps only a marker (no student data in it) and the iPad drops the student at its next sync',gone.length===1&&!/Sample/.test(gone[0].content)&&after.length===1&&after[0]==='Mateo Rivera',{gone:gone.map(f=>f.content.slice(0,60)),after});
  /* 20 a different account at the next sign-in is refused */
  await A.page.evaluate(()=>sessionStorage.removeItem('nbh.google.drive'));D.who='someone.else@palmbeachschools.org';
  await A.page.evaluate(()=>{window.__t=[];const t0=wsUI.toast;wsUI.toast=(m,o)=>{window.__t.push(String(m));return t0(m,o);};document.getElementById('drvChip').click();});await sleep(1200);
  const wr=await A.page.evaluate(()=>({t:window.__t,tok:!!drvTok()}));
  ok('20 signed in as a different account: refused, nothing synced, the message names both accounts',!wr.tok&&wr.t.some(m=>/That was someone\.else@palmbeachschools\.org\. This device keeps its caseload in the Google Drive of simulated\.bcba@palmbeachschools\.org/.test(m)),wr);
  D.who=SCHOOL;
  /* 21 the Drive API not turned on in the Google project: said plainly */
  D.off=true;await A.page.evaluate(()=>{window.__t=[];document.getElementById('drvChip').click();});await sleep(1500);await idle(A.page);
  const off=await A.page.evaluate(()=>({t:window.__t,chip:document.getElementById('drvChip').textContent,err:DRV.err}));D.off=false;
  ok('21 the Drive API not turned on: “Google Drive is not turned on for the workstation’s Google project yet … Enable”',/not turned on for the workstation’s Google project/.test(off.err)&&/Drive: problem/.test(off.chip)&&off.t.some(m=>/Enable/.test(m)),off);
  /* 22 Save case to a file still writes one */
  await A.page.evaluate(()=>{const b=document.getElementById('saveFile');b.hidden=false;});const n0=A.dls();
  const [d]=await Promise.all([A.page.waitForEvent('download',{timeout:15000}).catch(()=>null),A.page.evaluate(()=>saveCase({file:true}))]);await sleep(800);
  ok('22 Save case to a file (More) writes the case file while Drive is in use',!!d&&A.dls()===n0+1&&/^CASE_Mateo_Rivera_/.test(d?d.suggestedFilename():''),d&&d.suggestedFilename());
  await A.page.evaluate(()=>{const d=document.getElementById('cfDlg');if(d.open)d.close();});
  /* 23 a personal account on a third device is warned before anything is kept */
  const C=await device(br,UA_MAC,false);D.who='someone.personal@gmail.com';
  await C.page.evaluate(()=>{wsUI.confirm=async(t)=>{window.__cf=String(t);return false;};caseloadOpen();});await sleep(400);await C.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(1000);
  const p=await C.page.evaluate(()=>({cf:window.__cf||'',on:localStorage.getItem('nbh.drive.on')}));D.who=SCHOOL;
  ok('23 a personal Google account: warned (student records belong in the school Drive), and Cancel keeps Drive off',/That is a personal Google account/.test(p.cf)&&/school Google Drive/.test(p.cf)&&!p.on,p);
  /* 24 the first link of a device that already holds a student: the newer save of each is kept, the other goes to Replaced copies */
  await C.page.evaluate(()=>{wsUI.confirm=async()=>true;});await setBar(C.page,{client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School'});
  const c1f=await openDM(C.page);await setField(c1f,'s.living','An older copy on a third computer (simulated).');await sleep(500);
  await C.page.evaluate(async()=>{const o=Date.now;Date.now=()=>o()-3*864e5;try{}finally{}await caseKeepOnly();Date.now=o;});
  await C.page.evaluate(async()=>{const r=(await clList()||[])[0];r.saved=new Date(Date.now()-3*864e5).toISOString();await clTx('readwrite',st=>st.put(r));});
  const o0=olds().length;await C.page.evaluate(()=>caseloadOpen());await sleep(400);await C.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(1500);await idle(C.page);
  const c2=await C.page.evaluate(async()=>{const r=(await clList()||[])[0];return {pending:/Court date pending/.test(r.text),dev:r.dev};});
  ok('24 a third computer joins holding an older copy of the same student: Drive’s newer copy is kept there and its own older one goes to Replaced copies',c2.pending&&olds().length===o0+1&&/older copy from the Mac/.test(olds().slice(-1)[0].name),{c2,olds:olds().map(f=>f.name)});
  /* 25 (v21.97) a case over 5 MB goes up by the resumable upload and comes down whole; a small case still goes in one multipart request */
  const big='Long notes (simulated): '+'the quick brown fox jumps over the lazy dog. '.repeat(125000);   /* about 5.6 MB */
  const r0=D.res,c0=cases().length,v0=+(cases().find(f=>/Mateo/.test(f.name))||{}).version;
  const c3f=await openDM(C.page);   /* the frame as it is now: the link above put Drive's copy into the open form */
  await setField(c3f,'pr.notes',big);await sleep(1200);
  await C.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(5000);await idle(C.page);
  const bigF=cases().find(f=>/Mateo/.test(f.name)),rc=await rec(C.page,'Mateo Rivera');
  ok('25 a case over 5 MB: one resumable upload (the metadata, then the content), the same file in Drive with the whole text, the case marked synced; no multipart body over 5 MB',D.res===r0+1&&cases().length===c0&&!!bigF&&+bigF.version===v0+1&&bigF.content.length>5e6&&/lazy dog/.test(bigF.content)&&rc&&!rc.drv.dirty&&D.mpMax<5*1048576&&D.mpMax>0,{res:D.res-r0,n:cases().length,v:bigF&&bigF.version,len:bigF&&bigF.content.length,dirty:rc&&rc.drv.dirty,mpMax:D.mpMax});
  await B.page.evaluate(()=>drvSync({}));await idle(B.page);const rb=await rec(B.page,'Mateo Rivera');   /* the laptop (still signed in; the iPad was signed out at 20) */
  ok('26 the laptop’s next sync brings the large copy down whole',rb&&rb.text.length>5e6&&/lazy dog/.test(rb.text),{len:rb&&rb.text.length});
  ok('no page errors (iPad, laptop, third)',!A.errs.length&&!B.errs.length&&!C.errs.length,[A.errs,B.errs,C.errs].map(e=>e.slice(0,3)));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
