/* v21.91 case history: each Save case keeps a restore point of the student on this device (what changed since the point
   before; a save the same as the last keeps nothing new); the History dialog (the More menu, the command box, each student
   in Caseload): Open as it was (the case on screen kept first, the unsaved-work question, the bar, Save case makes it the
   current version), Restore one form (only that form), Compare with now; the limits (30 a student, one a day after two
   weeks, the total size); nothing kept with the caseload turned off; Remove and Remove all delete the history (and say
   so); with Google Drive (simulated here: sign-in, files, versions), the Drive file's versions listed, one written by the
   laptop opened and named; signed out and offline said; no request but the simulated Google; no page errors.
   Simulated students only.  usage: node qa/v2191-history-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
const WS=BASE+'/NBH-Workstation/index.html';
const OUT=path.join(__dirname,'out','v2191')+'/';fs.mkdirSync(OUT,{recursive:true});   /* qa/out/v2191/ */
const SCHOOL='simulated.bcba@palmbeachschools.org';
let fails=0,checks=0;const ok=(n,c,i)=>{checks++;console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const UA_IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const UA_MAC='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const MATEO={client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School'},SAMPLE={client:'SIMULATED – Sample Student',sid:'9990001',site:'Royal Palm School'};
/* ---- a small Google Drive (as qa/v2189-drive-test.js), with each file's versions: every content upload is one ---- */
const D={files:new Map(),n:0,who:SCHOOL,calls:[],revList:0,revMedia:0};
const now=()=>new Date(Date.now()+D.n*1000).toISOString();
function evalQ(q,f){if(/trashed=false/.test(q)&&f.trashed)return false;
  const mt=/mimeType='([^']+)'/.exec(q);if(mt&&f.mimeType!==mt[1])return false;
  const par=/'([^']+)' in parents/.exec(q);if(par&&!(f.parents||[]).includes(par[1]))return false;
  const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)];if(ap.length&&!ap.some(m=>(f.appProperties||{})[m[1]]===m[2]))return false;return true;}
const pick=f=>({id:f.id,name:f.name,version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties});
function parts(ct,body){const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));}
const addRev=f=>{f.revs=f.revs||[];f.revs.push({id:'r'+(f.revs.length+1),modifiedTime:f.modifiedTime,content:f.content});};
async function drive(route){const req=route.request(),u=new URL(req.url()),m=req.method();D.calls.push(m+' '+u.pathname+(u.searchParams.get('alt')?'?alt='+u.searchParams.get('alt'):''));
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/oauth2/v3/userinfo')return json({email:D.who});
  let mm=/^\/drive\/v3\/files\/([^/]+)\/revisions$/.exec(u.pathname);
  if(mm&&m==='GET'){D.revList++;const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);return json({revisions:(f.revs||[]).map(r=>({id:r.id,modifiedTime:r.modifiedTime,size:String(r.content.length)}))});}
  mm=/^\/drive\/v3\/files\/([^/]+)\/revisions\/([^/]+)$/.exec(u.pathname);
  if(mm&&m==='GET'){const f=D.files.get(mm[1]),r=f&&(f.revs||[]).find(x=>x.id===mm[2]);if(!r)return json({error:{code:404,message:'Revision not found'}},404);
    if(u.searchParams.get('alt')==='media'){D.revMedia++;return route.fulfill({status:200,contentType:'application/json',body:r.content});}return json({id:r.id,modifiedTime:r.modifiedTime});}
  mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
  if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>evalQ(q,f)).map(pick)});}
  if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
  if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
  if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta)f.trashed=meta.trashed;f.version++;D.n++;f.modifiedTime=now();return json({id:f.id});}
  mm=/^\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(u.pathname);
  if(mm){const [metaS,content]=parts(req.headers()['content-type'],req.postData()||'');const meta=JSON.parse(metaS);D.n++;
    if(m==='POST'){const id='f'+D.n;const f=Object.assign({id,version:1,modifiedTime:now(),trashed:false},meta,{content});addRev(f);D.files.set(id,f);return json(pick(f));}
    const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;f.modifiedTime=now();addRev(f);return json(pick(f));}
  return json({error:{code:400,message:'not simulated: '+m+' '+u.pathname}},400);}
const cases=()=>[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='case'&&!f.trashed);
/* every request a page makes: its own files, or the simulated Google; anything else is a failure */
const outside=[];
async function device(br,ua,touch,vp,google){const ctx=await br.newContext({viewport:vp||(touch?{width:1180,height:820}:{width:1440,height:900}),userAgent:ua,hasTouch:!!touch,serviceWorkers:'block',acceptDownloads:true});
  if(google){await ctx.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;
      setTimeout(()=>cfg.callback({access_token:'simulated-drive-token-'+window.__gsAsk,expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
    await ctx.route('https://www.googleapis.com/**',drive);await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));}
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  ctx.on('request',r=>{const u=r.url();if(u.startsWith(BASE)||/^(data|blob|about):/.test(u))return;if(google&&/^https:\/\/(www\.googleapis\.com|accounts\.google\.com)\//.test(u))return;outside.push(u);});
  await page.goto(WS);await sleep(1300);
  await page.evaluate(async()=>{window.__cf=[];window.__ch=[];window.__pick=null;window.__al=[];
    wsUI.confirm=async(t)=>{window.__cf.push(String(t));return true;};wsUI.alert=async(t)=>{window.__al.push(String(t));};window.alert=t=>{window.__al.push(String(t));};
    const ch0=wsUI.choose;wsUI.choose=async(t,b,n)=>{window.__ch.push({t:String(t),b:(b||[]).map(x=>x.label),n:String(n||'')});if(window.__pick===null)return ch0(t,b,n);const v=window.__pick;window.__pick=null;return v;};
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));await hxWipe();
    ['nbh.caseload.off','nbh.drive.on','nbh.drive.acct','nbh.drive.skip','nbh.drive.gone','nbh.drive.dev'].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem('nbh.google.drive');});
  return {ctx,page,errs};}
const setBar=(page,v)=>page.evaluate(v=>{const set=(s,x)=>{const e=document.querySelector(s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',v.client);set('#pSid',v.sid||'');set('#pSite',v.site||'');},v);
const FILE={'DM-1':/DM-1_Student/,'IC-1':/IC-1_Informed/};
async function openF(page,id){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000});await sleep(1200);return page.frames().find(f=>FILE[id].test(f.url())&&!f.isDetached());}
const frameOf=(page,id)=>page.frames().find(f=>FILE[id].test(f.url())&&!f.isDetached());
const setField=(fr,name,v)=>fr.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
const getField=(fr,name)=>fr.evaluate(n=>document.querySelector('[name="'+n+'"]').value,name);
const pts=(page,v)=>page.evaluate(async v=>{await hxIdle();return (await hxPoints(clKey(v))).map(p=>({why:p.why,dev:p.dev,chg:p.chg,first:p.first,at:p.at,size:p.size,id:p.id}));},v);
const allPts=page=>page.evaluate(async()=>{await hxIdle();return (await hxTx(['points'],'readonly',s=>s.getAll()))||[];});
async function save(page){await page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2600);await page.evaluate(()=>hxIdle());await page.waitForFunction(()=>typeof DRV==='undefined'||!DRV.busy,null,{timeout:20000}).catch(()=>{});await sleep(300);await page.evaluate(()=>hxIdle());}
const lines=page=>page.evaluate(()=>[...document.querySelectorAll('#hxList > li')].map(li=>({id:li.dataset.hxid,t:li.querySelector('.hx-l').textContent,btns:[...li.querySelectorAll('.hx-acts button')].map(b=>b.textContent),panel:(li.querySelector('.hx-panel')||{}).textContent||''})));
const click=(page,sel)=>page.evaluate(s=>{const b=document.querySelector(s);if(b)b.click();return !!b;},sel);
const btnOf=(page,li,attr)=>page.evaluate(([i,a])=>{const l=[...document.querySelectorAll('#hxList > li')][i];const b=l&&l.querySelector('['+a+']');if(b)b.click();return !!b;},[li,attr]);
const hxOpenWait=async page=>{await page.waitForFunction(()=>document.getElementById('dlg').open&&!!document.getElementById('hxView'),null,{timeout:15000});await sleep(300);};
const dirty=page=>page.evaluate(()=>caseDirty());
(async()=>{const br=await chromium.launch();
  try{
  /* =============== an iPad without Google Drive =============== */
  const A=await device(br,UA_IPAD,true);const P=A.page;
  await setBar(P,MATEO);let dm=await openF(P,'DM-1');await setField(dm,'s.living','Lives with mother (simulated A).');await sleep(600);
  await save(P);let L1=await pts(P,MATEO);
  ok('1 Save case keeps a point: when, this iPad, Save case, the first one kept here',L1.length===1&&L1[0].why==='Save case'&&L1[0].dev==='iPad'&&L1[0].first&&!!Date.parse(L1[0].at),L1);
  await setField(dm,'s.living','Lives with mother and grandmother (simulated B).');await setField(dm,'s.court','No court involvement (simulated C).');await sleep(600);
  await save(P);let L2=await pts(P,MATEO);
  ok('2 the next Save case keeps a second point with what changed: Form DM-1: 2 fields',L2.length===2&&JSON.stringify(L2[0].chg)===JSON.stringify(['Form DM-1: 2 fields']),L2.map(x=>x.chg));
  await save(P);const L3=await pts(P,MATEO);
  ok('3 Save case again with nothing changed keeps nothing new',L3.length===2,L3.length);
  let ic=await openF(P,'IC-1');await setField(ic,'c.parent','Parent One (simulated)');await sleep(600);await save(P);const L4=await pts(P,MATEO);
  ok('4 a form added: Form IC-1 added',L4.length===3&&L4[0].chg.some(x=>/^Form IC-1 added$/.test(x)),L4.map(x=>x.chg));
  /* the History dialog from the More menu */
  await P.evaluate(()=>document.getElementById('moreBtn').click());await sleep(300);
  const more=await P.evaluate(()=>[...document.querySelectorAll('#moreMenu [data-more]')].map(b=>b.textContent));
  ok('5 More holds Case history',more.includes('Case history'),more);
  await P.evaluate(()=>[...document.querySelectorAll('#moreMenu [data-more]')].find(b=>b.textContent==='Case history').click());await hxOpenWait(P);
  let ln=await lines(P);const ttl=await P.evaluate(()=>document.getElementById('dlgTitle').textContent);
  ok('6 History: newest first, “Today 3:42 PM · on this iPad · Save case — Form IC-1 added”, Latest on the newest, the first one kept at the bottom',ttl==='Case history'&&ln.length===3&&/^Today \d{1,2}:\d\d\s?[AP]M · on this iPad · Save case — Form IC-1 added/.test(ln[0].t)&&/Latest/.test(ln[0].t)&&/· Save case — Form DM-1: 2 fields/.test(ln[1].t)&&/the first one kept here: 1 form/.test(ln[2].t),{ttl,ln});
  ok('7 each point offers Open as it was, Restore one form (this student is on screen) and Compare with now',ln.every(l=>JSON.stringify(l.btns)===JSON.stringify(['Open as it was','Restore one form','Compare with now'])),ln.map(l=>l.btns));
  const src0=await P.evaluate(()=>document.getElementById('hxSrc').textContent);
  ok('8 without Google Drive: the saves kept on this iPad, and how Drive would add the other device’s',/The saves kept on this iPad/.test(src0)&&/With Google Drive in use/.test(src0),src0);
  await P.evaluate(()=>document.getElementById('dlg').close());
  /* the command box */
  await P.evaluate(()=>palOpen());await sleep(300);await P.fill('#palIn','history');await P.evaluate(()=>palDraw());await sleep(200);
  const pal=await P.evaluate(()=>[...document.querySelectorAll('#palRes .rnm')].map(x=>x.textContent));await P.evaluate(()=>palClose());
  ok('9 the command box finds Case history: go back to an earlier save',pal.some(t=>/Case history: go back to an earlier save/.test(t)),pal.slice(0,5));
  /* Compare with now: the case on screen with an unsaved change, against the second point */
  const sigD=await P.evaluate(()=>state.status['DM-1'].sig);
  await setField(dm,'s.living','Lives with mother, grandmother and an aunt (simulated D, not saved).');await sleep(800);
  await P.waitForFunction(s=>state.status['DM-1'].sig!==s,sigD,{timeout:15000}).catch(()=>{});   /* v21.97 the form reports its new fingerprint in its own time (up to a few seconds after repeated edits); History reads it as the dialog opens */
  await P.evaluate(()=>hxOpen());await hxOpenWait(P);await btnOf(P,1,'data-hxcmp');await P.waitForFunction(()=>/From then to now|There is no case/.test((document.querySelector('#hxList .hx-panel')||{}).textContent||''),null,{timeout:20000});
  ln=await lines(P);const on0=await P.evaluate(()=>(document.querySelector('#hxView .hx-note')||{}).textContent||'');
  ok('10 Compare with now (the second point against the case on screen): Form DM-1: 1 field, Form IC-1 added',/From then to now \(the case on screen\)/.test(ln[1].panel)&&/Form DM-1: 1 field/.test(ln[1].panel)&&/Form IC-1 added/.test(ln[1].panel),ln[1]);
  ok('11 History says the case on screen has changes not saved yet',/changes not saved yet/.test(on0),on0);
  /* Restore one form: Form DM-1 from the third point; Form IC-1's unsaved change stays */
  await P.evaluate(()=>document.getElementById('dlg').close());await setField(ic,'c.parent','Parent Two (simulated, not saved)');await sleep(800);
  await P.evaluate(()=>hxOpen());await hxOpenWait(P);await btnOf(P,0,'data-hxone');await P.waitForFunction(()=>!!document.querySelector('#hxList [data-hxform]'),null,{timeout:15000});
  const pick=await P.evaluate(()=>[...document.querySelectorAll('#hxList [data-hxform]')].map(b=>b.dataset.hxform));
  ok('12 Restore one form lists the forms of that save',JSON.stringify(pick.sort())===JSON.stringify(['DM-1','IC-1']),pick);
  await P.evaluate(()=>{window.__cf=[];document.querySelector('#hxList [data-hxform="DM-1"]').click();});
  await P.waitForFunction(()=>!document.getElementById('dlg').open&&!!state.frames['DM-1']&&!state.pending['DM-1'],null,{timeout:30000});await sleep(1500);
  dm=frameOf(P,'DM-1');ic=frameOf(P,'IC-1');
  const r12={dm:await getField(dm,'s.living'),court:await getField(dm,'s.court'),ic:await getField(ic,'c.parent'),cf:await P.evaluate(()=>window.__cf.slice()),dirty:await dirty(P)};
  ok('13 Restore Form DM-1: Form DM-1 is as it was (B, C), Form IC-1 keeps its change, the case is marked unsaved; the question named only that form',/simulated B/.test(r12.dm)&&/simulated C/.test(r12.court)&&/Parent Two/.test(r12.ic)&&r12.dirty&&r12.cf.some(t=>/^Restore Form DM-1 as it was today at/.test(t)&&/Only Form DM-1/.test(t)),r12);
  const L5=await pts(P,MATEO);
  ok('14 the case on screen was kept first: “before Form DM-1 was restored”, with the unsaved changes',L5.length===4&&L5[0].why==='before Form DM-1 was restored'&&L5[0].chg.some(x=>/Form DM-1: 1 field/.test(x))&&L5[0].chg.some(x=>/Form IC-1: 1 field/.test(x)),L5.map(x=>[x.why,x.chg]));
  /* Open as it was: the first point, with unsaved work on screen */
  await P.evaluate(()=>{window.__ch=[];window.__pick='go';hxOpen();});await hxOpenWait(P);ln=await lines(P);
  const firstIdx=ln.findIndex(l=>/the first one kept here/.test(l.t));await btnOf(P,firstIdx,'data-hxgo');
  await P.waitForFunction(()=>!document.getElementById('dlg').open&&!!state.hx,null,{timeout:30000});await P.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(2000);
  dm=frameOf(P,'DM-1');
  const g={ch:await P.evaluate(()=>window.__ch.slice()),dm:await getField(dm,'s.living'),ic:await P.evaluate(()=>inCase('IC-1')),bar:await P.evaluate(()=>{const b=document.getElementById('hxBar');return b&&!b.hidden?b.textContent:'';}),dirty:await dirty(P)};
  ok('15 Open as it was with work not saved asks first: Save first, Open it anyway, Cancel (the case on screen kept in History either way)',g.ch.length===1&&/^Open Mateo Rivera’s case as it was today at/.test(g.ch[0].t)&&/not saved yet/.test(g.ch[0].t)&&JSON.stringify(g.ch[0].b)==='["Save first","Open it anyway","Cancel"]'&&/kept in History first/.test(g.ch[0].n),g.ch);
  ok('16 the whole case as it was then: Form DM-1 says A, Form IC-1 is not in it',/simulated A/.test(g.dm)&&!g.ic,g);
  ok('17 the bar: “Mateo Rivera: the case as it was saved today at … on this iPad. Save case makes it the current version”, and the case is marked unsaved',/Mateo Rivera: the case as it was saved today at .* on this iPad\. Save case makes it the current version/.test(g.bar)&&g.dirty,g);
  const L6=await pts(P,MATEO);
  const t6=await P.evaluate(id=>hxText(id),L6[0].id);
  ok('18 the version on screen was kept first: “before going back”, with Form DM-1 as restored and Form IC-1’s unsaved change',L6.length===5&&L6[0].why==='before going back'&&L6[0].chg.some(x=>/Form DM-1: 1 field/.test(x))&&/Parent Two/.test(t6)&&/simulated B/.test(t6),{L6:L6.map(x=>[x.why,x.chg]),t6:t6.length});
  await save(P);
  const s18=await P.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera');const d=JSON.parse(r.text);return {bar:document.getElementById('hxBar').hidden,dm:JSON.stringify(d.forms['DM-1'].snap.data),ic:!!d.forms['IC-1'],hx:!!state.hx};});
  const L7=await pts(P,MATEO);
  ok('19 Save case makes it the current version: the copy on this iPad holds A and no IC-1, the bar is gone, a Save case point is kept',s18.bar===true&&/simulated A/.test(s18.dm)&&!s18.ic&&!s18.hx&&L7.length===6&&L7[0].why==='Save case',{s18,L7:L7.map(x=>x.why)});
  /* back to the version kept before going back: nothing was lost */
  await P.evaluate(()=>{window.__ch=[];hxOpen();});await hxOpenWait(P);ln=await lines(P);const bk=ln.findIndex(l=>/before going back/.test(l.t));await btnOf(P,bk,'data-hxgo');
  await P.waitForFunction(()=>!document.getElementById('dlg').open&&!!state.hx,null,{timeout:30000});await P.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(1500);
  dm=frameOf(P,'DM-1');const back={dm:await getField(dm,'s.living'),ic:await P.evaluate(()=>inCase('IC-1')),ch:await P.evaluate(()=>window.__ch.length)};
  ic=await openF(P,'IC-1');back.parent=await getField(ic,'c.parent');
  ok('20 Open as it was on “before going back”: the restored DM-1 and IC-1’s unsaved change are back (no question: the case on screen was saved)',/simulated B/.test(back.dm)&&back.ic&&/Parent Two/.test(back.parent)&&back.ch===0,back);
  await save(P);
  /* Caseload: History beside each student; Restore one form only for the student on screen */
  await P.evaluate(async()=>{await clearCase();});await sleep(500);await setBar(P,SAMPLE);dm=await openF(P,'DM-1');await setField(dm,'pr.notes','Sample notes (simulated).');await sleep(500);await save(P);
  await P.evaluate(()=>caseloadOpen());await sleep(700);
  const clb=await P.evaluate(()=>[...document.querySelectorAll('#dlgBody [data-hxopen]')].map(b=>({k:b.dataset.hxopen,t:b.textContent,prev:(b.previousElementSibling||{}).dataset?b.previousElementSibling.dataset.clopen:''})));
  ok('21 Caseload: History beside each student’s Open (one each)',clb.length===2&&clb.every(b=>b.t==='History'&&b.prev===b.k),clb);
  await P.evaluate(()=>{const b=[...document.querySelectorAll('#dlgBody [data-hxopen]')].find(x=>/mateo rivera/.test(x.dataset.hxopen));b.click();});await hxOpenWait(P);
  ln=await lines(P);const mt=await P.evaluate(()=>document.querySelector('#hxView .hp-lead b').textContent);
  ok('22 History of a student not on screen: their points, Open as it was and Compare with now, no Restore one form',mt==='Mateo Rivera'&&ln.length>=6&&ln.every(l=>JSON.stringify(l.btns)==='["Open as it was","Compare with now"]'),{mt,n:ln.length,b:ln[0]&&ln[0].btns});
  await btnOf(P,0,'data-hxcmp');await P.waitForFunction(()=>/From then to now|There is no case/.test((document.querySelector('#hxList .hx-panel')||{}).textContent||''),null,{timeout:15000});
  const cmpR=(await lines(P))[0].panel;
  ok('23 Compare with now for a student not on screen: against the copy on this iPad (the same as now)',/the copy on this iPad, saved today at/.test(cmpR)&&/The same as now/.test(cmpR),cmpR);
  await P.evaluate(()=>document.getElementById('dlg').close());
  /* screenshots of the History dialog: the iPad sideways, upright, a phone */
  await P.evaluate(()=>{window.__pick=null;hxOpen(clKey({client:'Mateo Rivera',sid:'4471823'}));});await hxOpenWait(P);await btnOf(P,1,'data-hxcmp');await sleep(1200);
  await P.screenshot({path:OUT+'history-ipad-1180.png'});
  await P.setViewportSize({width:820,height:1180});await sleep(500);await P.screenshot({path:OUT+'history-ipad-820.png'});
  await P.setViewportSize({width:390,height:844});await sleep(500);await P.screenshot({path:OUT+'history-phone-390.png'});
  const fit=await P.evaluate(()=>{const d=document.getElementById('dlg').getBoundingClientRect(),b=document.getElementById('dlgBody');return {w:d.width,left:d.left,right:d.right,vw:innerWidth,sx:b.scrollWidth,cx:b.clientWidth,doc:document.documentElement.scrollWidth};});
  ok('24 on a phone (390 wide) the History dialog fits: nothing wider than the screen, no sideways scroll',fit.left>=0&&fit.right<=fit.vw+1&&fit.sx<=fit.cx+1,fit);
  await P.setViewportSize({width:1180,height:820});await P.evaluate(()=>document.getElementById('dlg').close());
  /* Remove: the confirm names the history; the student's points go */
  await P.evaluate(()=>{window.__cf=[];caseloadOpen();});await sleep(600);
  await P.evaluate(()=>{const tr=[...document.querySelectorAll('[data-cldel]')].find(b=>/mateo rivera/.test(b.dataset.cldel));tr.click();});await sleep(1200);
  const rm=await P.evaluate(async()=>({cf:window.__cf.slice(),n:(await hxPoints(clKey({client:'Mateo Rivera',sid:'4471823'}))).length,on:(await clList()).map(r=>r.client)}));
  ok('25 Remove names the case history in its question, and Mateo Rivera’s history is deleted with them',rm.cf.some(t=>/^Take Mateo Rivera off the caseload on this iPad\?/.test(t)&&/case history on this iPad/.test(t))&&rm.n===0&&!rm.on.includes('Mateo Rivera'),rm);
  /* nothing kept with the caseload turned off */
  await P.evaluate(()=>{document.getElementById('dlg').close();localStorage.setItem('nbh.caseload.off','1');});const n0=(await pts(P,SAMPLE)).length;
  dm=frameOf(P,'DM-1');await setField(dm,'pr.notes','Sample notes, changed with the caseload off (simulated).');await sleep(500);await save(P);
  await P.evaluate(async()=>{await hxKeep({key:clKey({client:'SIMULATED – Sample Student',sid:'9990001'}),text:JSON.stringify({form:'CASE',packet:{client:'x'},forms:{'TB-1':{snap:{total:1,data:{a:'z'}}}}}),why:'test'});});
  const n1=(await pts(P,SAMPLE)).length;
  ok('26 with the caseload turned off (Do not keep cases on this iPad) no point is kept',n1===n0&&n0===1,{n0,n1});
  await P.evaluate(()=>localStorage.removeItem('nbh.caseload.off'));
  /* Remove all: the confirm names it; every point goes, a student’s not on the caseload too */
  await P.evaluate(async()=>{await hxKeep({key:clKey({client:'SIMULATED – Not Kept',sid:'9990002'}),text:JSON.stringify({form:'CASE',packet:{client:'SIMULATED – Not Kept'},forms:{'TB-1':{snap:{total:1,data:{a:'1'}}}}}),why:'before going back'});window.__cf=[];});
  const pre=(await allPts(P)).length;await P.evaluate(()=>clRemoveAll());await sleep(1500);
  const ra=await P.evaluate(async()=>({cf:window.__cf.slice(),n:((await hxTx(['points'],'readonly',s=>s.getAll()))||[]).length,t:((await hxTx(['texts'],'readonly',s=>s.getAll()))||[]).length,d:((await hxTx(['drive'],'readonly',s=>s.getAll()))||[]).length}));
  ok('27 Remove all student data names the case history in its question and deletes every point (one of a student not on the caseload too)',pre>=2&&ra.cf.some(t=>/^Remove every student’s data from this iPad\?/.test(t)&&/their case history/.test(t))&&ra.n===0&&ra.t===0&&ra.d===0,{pre,ra});
  /* =============== the limits (a fresh device) =============== */
  const B=await device(br,UA_IPAD,true);
  const cap=await B.page.evaluate(async()=>{const k=clKey({client:'SIMULATED – Sample Student',sid:'9990001'}),day=864e5,t0=Date.now();
    const mk=(i,at)=>({key:k,text:JSON.stringify({form:'CASE',saved:at,packet:{client:'SIMULATED – Sample Student',sid:'9990001'},forms:{'TB-1':{title:'TB-1',snap:{total:2,data:{n:String(i),pad:'x'.repeat(2000)}}}}}),at,dev:'iPad',why:'Save case'});
    const want=[];for(let d=39;d>=15;d--){want.push(t0-d*day-3600e3);if(d<=19)want.push(t0-d*day);}for(let d=9;d>=0;d--){want.push(t0-d*day-7200e3);want.push(t0-d*day-60e3);}
    let i=0;for(const t of want)await hxKeep(mk(i++,new Date(t).toISOString()));
    const L=await hxPoints(k),old=L.filter(p=>Date.parse(p.at)<t0-14*day),days=old.map(p=>hxDay(p.at));
    return {made:want.length,n:L.length,recent:L.filter(p=>Date.parse(p.at)>=t0-14*day).length,old:old.length,oneADay:new Set(days).size===days.length,newestOld:old.length?Math.round((t0-Date.parse(old[0].at))/day):null};});
  ok('28 the limits: '+cap.made+' saves of one student leave at most 30, every save of the last two weeks, one a day before that (the day’s last)',cap.n<=30&&cap.recent===20&&cap.oneADay&&cap.old===cap.n-20&&cap.newestOld===15,cap);
  const sz=await B.page.evaluate(async()=>{const all=(await hxTx(['points'],'readonly',s=>s.getAll())).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)),one=all[all.length-1].size,c0=HX.cap;
    HX.cap=one*5+10;const k2=clKey({client:'SIMULATED – Second Student',sid:'9990003'});
    await hxKeep({key:k2,text:JSON.stringify({form:'CASE',packet:{client:'SIMULATED – Second Student',sid:'9990003'},forms:{'TB-1':{title:'TB-1',snap:{total:2,data:{n:'new',pad:'y'.repeat(2000)}}}}}),dev:'iPad',why:'Save case'});
    const left=(await hxTx(['points'],'readonly',s=>s.getAll())).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)),tot=left.reduce((s,p)=>s+p.size,0),texts=(await hxTx(['texts'],'readonly',s=>s.getAll())).length;HX.cap=c0;
    const newest5=all.slice(-4).map(p=>p.id);return {before:all.length,after:left.length,tot,cap:one*5+10,texts,keptNewest:newest5.every(id=>left.some(p=>p.id===id)),second:left.some(p=>p.key===k2)};});
  ok('29 the total size: past the cap the oldest go first (the newest stay, the new one is kept, the texts go with their points)',sz.tot<=sz.cap&&sz.after===5&&sz.texts===5&&sz.keptNewest&&sz.second,sz);
  const big=await B.page.evaluate(()=>({max:HX.max,days:HX.days,mb:Math.round(HX.cap/1048576)}));
  ok('30 the limits as set: 30 a student, two weeks before one a day, about 200 MB in all',big.max===30&&big.days===14&&big.mb===200,big);
  /* =============== an iPad and a laptop with Google Drive =============== */
  const I=await device(br,UA_IPAD,true,null,true),M=await device(br,UA_MAC,false,null,true);
  await I.page.evaluate(()=>caseloadOpen());await sleep(400);await I.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await I.page.waitForFunction(()=>!DRV.busy,null,{timeout:20000});
  await I.page.evaluate(()=>document.getElementById('dlg').close());
  await setBar(I.page,MATEO);let idm=await openF(I.page,'DM-1');await setField(idm,'s.living','Lives with mother (simulated, saved on the iPad).');await sleep(600);await save(I.page);
  ok('31 with Drive: Save case on the iPad keeps a point and sends the case (version 1)',(await pts(I.page,MATEO)).length===1&&cases().length===1&&cases()[0].revs.length===1,{n:cases().length});
  await M.page.evaluate(()=>caseloadOpen());await sleep(400);await M.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(1200);await M.page.waitForFunction(()=>!DRV.busy,null,{timeout:20000});await M.page.evaluate(()=>hxIdle());
  const m1=await pts(M.page,MATEO);
  ok('32 the laptop gets the student from Drive: a point “brought here by Google Drive”, saved on the iPad',m1.length===1&&m1[0].why==='brought here by Google Drive'&&m1[0].dev==='iPad',m1);
  await M.page.evaluate(()=>document.getElementById('dlg').close());
  await M.page.evaluate(k=>caseloadGo(k,''),await M.page.evaluate(()=>clKey({client:'Mateo Rivera',sid:'4471823'})));await sleep(2500);
  let mdm=await openF(M.page,'DM-1');await setField(mdm,'s.living','Lives with mother and grandmother (simulated, laptop 2).');await sleep(600);await save(M.page);
  await setField(mdm,'s.living','Lives with mother, grandmother and a cousin (simulated, laptop 3).');await sleep(600);await save(M.page);
  ok('33 the laptop saves twice: Drive holds versions 2 and 3 by the Mac',cases()[0].revs.length===3&&cases()[0].appProperties.dev==='Mac',cases()[0].revs.map(r=>r.id));
  /* the iPad opens History before it syncs: the laptop's versions are listed from Drive, unopened */
  const rl0=D.revList,rm0=D.revMedia;
  await I.page.evaluate(()=>hxOpen());await hxOpenWait(I.page);await I.page.waitForFunction(()=>/Google Drive holds|that only Google Drive holds|could not be listed/.test(document.getElementById('hxSrc').textContent),null,{timeout:15000});
  let il=await lines(I.page);const isrc=await I.page.evaluate(()=>document.getElementById('hxSrc').textContent);
  ok('34 History on the iPad lists Drive’s versions when it opens (one list request, no contents fetched): the iPad’s own save once, “also in Google Drive”, and the laptop’s two',D.revList===rl0+1&&D.revMedia===rm0&&il.length===3&&il.filter(l=>/in Google Drive \(open it to see where it was saved\)/.test(l.t)).length===2&&/also in Google Drive/.test(il[2].t)&&/on this iPad · Save case/.test(il[2].t)&&/Latest/.test(il[0].t)&&/2 copies of this student that only Google Drive holds/.test(isrc),{il,isrc,rl:D.revList-rl0,rm:D.revMedia-rm0});
  await btnOf(I.page,1,'data-hxcmp');await I.page.waitForFunction(()=>/From then to now/.test(([...document.querySelectorAll('#hxList > li')][1].querySelector('.hx-panel')||{}).textContent||''),null,{timeout:15000});
  await btnOf(I.page,0,'data-hxcmp');await I.page.waitForFunction(()=>/From then to now/.test(([...document.querySelectorAll('#hxList > li')][0].querySelector('.hx-panel')||{}).textContent||''),null,{timeout:15000});
  il=await lines(I.page);
  ok('35 opened (Compare with now), each laptop version is fetched once and named: “on the Mac · in Google Drive — Form DM-1: 1 field”',D.revMedia===rm0+2&&il[0].t.match(/^Today \d{1,2}:\d\d\s?[AP]M · on the Mac · in Google Drive — Form DM-1: 1 field/)&&/on the Mac · in Google Drive — Form DM-1: 1 field/.test(il[1].t)&&/From then to now \(the case on screen\)/.test(il[0].panel)&&/Form DM-1: 1 field/.test(il[0].panel),{il,media:D.revMedia-rm0});
  await I.page.screenshot({path:OUT+'history-drive-ipad-1180.png'});
  await I.page.setViewportSize({width:820,height:1180});await sleep(400);await I.page.screenshot({path:OUT+'history-drive-ipad-820.png'});
  await I.page.setViewportSize({width:390,height:844});await sleep(400);await I.page.screenshot({path:OUT+'history-drive-phone-390.png'});await I.page.setViewportSize({width:1180,height:820});
  /* Open as it was on the laptop's version 2: the newest comes here first (the iPad's own kept), then version 2 is on screen */
  const old0=[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='old').length;
  await btnOf(I.page,1,'data-hxgo');await I.page.waitForFunction(()=>!document.getElementById('dlg').open&&!!state.hx,null,{timeout:30000});await I.page.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(1500);
  idm=frameOf(I.page,'DM-1');const ig={dm:await getField(idm,'s.living'),bar:await I.page.evaluate(()=>{const b=document.getElementById('hxBar');return b&&!b.hidden?b.textContent:'';}),nb:await I.page.evaluate(()=>document.getElementById('drvBar').hidden)};
  ok('36 Open as it was on a laptop version: the iPad shows the laptop’s second save; the bar says “saved today at … on the Mac”',/laptop 2/.test(ig.dm)&&/the case as it was saved today at .* on the Mac\. Save case makes it the current version/.test(ig.bar)&&ig.nb,ig);
  const ip=await pts(I.page,MATEO);
  ok('37 the iPad got Drive’s newest first: a point “brought here by Google Drive” (the laptop’s third save) above the iPad’s own',ip.length===2&&ip[0].why==='brought here by Google Drive'&&ip[0].dev==='Mac'&&ip[1].why==='Save case',ip.map(p=>[p.why,p.dev]));
  await save(I.page);const cf=await I.page.evaluate(()=>document.getElementById('cfDlg').open);
  const v4=cases()[0];
  ok('38 Save case makes it the current version everywhere: Drive’s version 4 is the laptop’s second save, by the iPad, with no question of two copies',!cf&&v4.revs.length===4&&/laptop 2/.test(v4.content)&&v4.appProperties.dev==='iPad'&&[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='old').length===old0,{cf,revs:v4.revs.length,dev:v4.appProperties.dev});
  await I.page.evaluate(()=>hxOpen());await hxOpenWait(I.page);await I.page.waitForFunction(()=>/Google Drive holds|that only Google Drive holds/.test(document.getElementById('hxSrc').textContent),null,{timeout:15000});il=await lines(I.page);
  ok('39 History afterwards: Latest is this iPad’s Save case (also in Google Drive); the laptop’s third save shows once',/on this iPad · Save case/.test(il[0].t)&&/Latest/.test(il[0].t)&&/also in Google Drive/.test(il[0].t)&&il.filter(l=>/laptop 3|brought here by Google Drive/.test(l.t)).length===1,il.map(l=>l.t));
  await I.page.evaluate(()=>document.getElementById('dlg').close());
  /* the laptop's own History: the Mac's saves and the iPad's, all also in Drive */
  await M.page.evaluate(()=>hxOpen());await hxOpenWait(M.page);await M.page.waitForFunction(()=>/Google Drive holds|that only Google Drive holds/.test(document.getElementById('hxSrc').textContent),null,{timeout:15000});
  const ml=await lines(M.page);
  ok('40 the laptop’s History: its two saves (on this Mac) above the iPad’s (on the iPad · brought here by Google Drive), the iPad’s later save from Drive',ml.some(l=>/on this Mac · Save case — Form DM-1: 1 field/.test(l.t))&&ml.some(l=>/on the iPad · brought here by Google Drive — the first one kept here: 1 form/.test(l.t))&&ml.some(l=>/in Google Drive/.test(l.t)&&!/also in/.test(l.t)),ml.map(l=>l.t));
  await M.page.evaluate(()=>document.getElementById('dlg').close());
  /* a laptop 1280 wide with Drive in use: no room on the bar's one row, so History goes up beside the student's name */
  await M.page.setViewportSize({width:1280,height:800});await sleep(800);
  const lt=await M.page.evaluate(()=>{const b=document.getElementById('hxBtn'),g=document.querySelector('.bar .grp.acts');const rows=new Set([...g.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>Math.round(e.getBoundingClientRect().top))).size;
    return {top:!!b.closest('header.top'),vis:b.offsetParent!==null,rows,sf:document.getElementById('saveFile').offsetParent!==null};});
  await M.page.evaluate(()=>document.getElementById('hxBtn').click());await hxOpenWait(M.page);const lt2=await M.page.evaluate(()=>document.querySelector('#hxView .hp-lead b').textContent);await M.page.evaluate(()=>document.getElementById('dlg').close());
  await M.page.setViewportSize({width:1440,height:900});await sleep(800);const lt3=await M.page.evaluate(()=>!document.getElementById('hxBtn').closest('header.top')&&document.getElementById('hxBtn').offsetParent!==null);
  ok('41 a laptop 1280 wide with Drive in use: the bar stays one row, History waits in the heading and opens the case’s history; at 1440 it is back on the bar',lt.top&&lt.vis&&lt.rows===1&&lt.sf&&lt2==='Mateo Rivera'&&lt3,{lt,lt2,lt3});
  /* signed out, then offline: local points only, said */
  const rl1=D.revList;await I.page.evaluate(()=>{sessionStorage.removeItem('nbh.google.drive');hxOpen();});await hxOpenWait(I.page);
  const so=await I.page.evaluate(()=>({src:document.getElementById('hxSrc').textContent,btn:!!document.getElementById('hxSign'),n:document.querySelectorAll('#hxList > li').length}));
  ok('42 signed out of Google: “Only the saves kept on this iPad are listed: you are signed out of Google…”, with Sign in, and nothing asked of Drive',/^Only the saves kept on this iPad are listed: you are signed out of Google/.test(so.src)&&so.btn&&D.revList===rl1&&so.n>=2,so);
  await I.page.evaluate(()=>document.getElementById('dlg').close());
  await I.page.evaluate(()=>sessionStorage.setItem('nbh.google.drive',JSON.stringify({tok:'simulated-drive-token-x',exp:Date.now()+3600e3})));await I.ctx.setOffline(true);
  await I.page.evaluate(()=>hxOpen());await hxOpenWait(I.page);const of=await I.page.evaluate(()=>document.getElementById('hxSrc').textContent);await I.ctx.setOffline(false);
  ok('43 offline: “Only the saves kept on this iPad are listed: there is no internet…”',/^Only the saves kept on this iPad are listed: there is no internet/.test(of)&&D.revList===rl1,of);
  await I.page.evaluate(()=>document.getElementById('dlg').close());
  /* Remove with Drive in use names the history too */
  await I.page.evaluate(()=>{window.__ch=[];window.__pick='';caseloadOpen();});await sleep(600);await I.page.evaluate(()=>document.querySelector('[data-cldel]').click());await sleep(600);
  const dr=await I.page.evaluate(()=>window.__ch.slice());
  ok('44 Remove with Google Drive in use: “Either way, their case history on this iPad is deleted.”',dr.length===1&&/Either way, their case history on this iPad is deleted\./.test(dr[0].t),dr);
  ok('45 no request left the page but the simulated Google (no student data anywhere else)',outside.length===0,outside.slice(0,8));
  ok('46 no page errors (the iPad, the limits, the iPad and the laptop with Drive)',![A,B,I,M].some(x=>x.errs.length),[A,B,I,M].map(x=>x.errs.slice(0,3)));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' of '+checks+' failed':'RESULT: all passed ('+checks+' checks)');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
