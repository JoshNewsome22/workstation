/* v25.71 Undo for the six actions v25.70 still only asked about (the BCBA, 11/9: "drop the are you sure questions if undo
   covers the action"). Simulated data only ("Sample Student", "Mateo Rivera" and the like; Google Drive and the reply box
   are simulated here: no request leaves the machine).
   R  Remove all student data (keeps its question, adds Undo): the caseload, the case history, a pin, the Autosave copies,
      the shares' starting points, a picture and a sound, Google Drive's settings and this tab's sign-in all go; Undo puts
      every IndexedDB record, localStorage and sessionStorage entry back byte for byte (the stores compared before and
      after, pictures by their bytes); left alone, the removal stands.
   C  Delete all copies (Autosave): no question; the copies and the pending slot go; Undo puts them back byte for byte;
      left alone, they stay gone. One copy's Delete: no question either, and Undo puts it back.
   D  Google Drive (simulated): Caseload's Remove, Everywhere (the choice is still asked): the student leaves this iPad at
      once, Drive is told nothing while the message is up; Undo brings the record, its history and pin back and Drive is
      never told; left alone, Drive is told only after the message's time (the trash and the marker); What Drive holds'
      Remove everywhere: no question, the same; the page closed while the message is up: Drive is never told, the student
      is removed from this iPad only, and the next start says so.
   O  Reset the offline copy (a real offline copy on this server): no question when nothing would be lost; nothing deleted
      while the message is up; Undo keeps the copy; left alone, the copy is reset after the message's time and the page
      loads again; the page closed first: nothing reset; with work not in a case file the question is still asked.
   B  Form TB-1, Delete my bank and Remove from my bank: no question; the bank's store is put back byte for byte by Undo;
      left alone, it stays empty.
   S  The collected replies (the reply box simulated): Form IA-1's and Form IN-1's Remove the collected replies from the site:
      no question; the site is asked nothing while the message is up (IN-1's inside its open box); Undo: never; left alone:
      once, after the message's time. Form DD-1's staff entries the same.
   usage: WS_URL=http://127.0.0.1:8165 node qa/v2571-undo-more-test.js [R C D O B S] */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const ONLY=process.argv.slice(2).map(s=>s.toUpperCase());const want=k=>!ONLY.length||ONLY.includes(k);
const WS=L.BASE+'/NBH-Workstation/index.html';
const errs=[];
const watch=(p,tag)=>{p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>{errs.push(tag+': a browser dialog: '+d.message().slice(0,80));d.accept().catch(()=>{});});return p;};
async function ctxOf(br,o){o=o||{};const c=await br.newContext(Object.assign({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,userAgent:L.IPAD_UA,serviceWorkers:o.sw?'allow':'block',acceptDownloads:true},o.ctx||{}));
  await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.installTip','dismissed');localStorage.setItem('nbh.ws.rel','v25.70');}}catch(e){}window.print=function(){};});
  return c;}
const closeDlgs=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
const setBar=(p,v)=>p.evaluate(v=>{const set=(s,x)=>{const e=document.querySelector(s);if(!e)return;e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',v.client);set('#pSid',v.sid||'');set('#pSite',v.site||'Sample Elementary');set('#pBcba','Sample BCBA');},v);
/* every IndexedDB database of this site, every store, every record (pictures and sounds by type, size and SHA-256), and
   localStorage and sessionStorage (a tab's heartbeat, written every 5 s, left out): one text to compare */
const DUMP=async(skip)=>{const re=skip?new RegExp(skip):null;
  const hex=async b=>{const h=await crypto.subtle.digest('SHA-256',await b.arrayBuffer());return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');};
  const ser=async v=>{if(v instanceof Blob)return {__blob:v.type,size:v.size,sha:await hex(v)};if(Array.isArray(v)){const o=[];for(const x of v)o.push(await ser(x));return o;}
    if(v&&typeof v==='object'&&!(v instanceof Date)){const o={};for(const k of Object.keys(v))o[k]=await ser(v[k]);return o;}return v;};
  const out={};const names=(await indexedDB.databases()).map(d=>d.name).sort();
  for(const name of names){if(re&&re.test(name))continue;const db=await new Promise(res=>{const r=indexedDB.open(name);r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onupgradeneeded=()=>{try{r.transaction.abort();}catch(e){}};});if(!db)continue;
    out[name]={};for(const st of [...db.objectStoreNames].sort()){const rows=await new Promise(res=>{const t=db.transaction(st),o=[];const q=t.objectStore(st).openCursor();q.onsuccess=()=>{const c=q.result;if(c){o.push([c.primaryKey,c.value]);c.continue();}};t.oncomplete=()=>res(o);});out[name][st]=await ser(rows);}
    db.close();}
  const st=s=>{const o={};for(let i=0;i<s.length;i++){const k=s.key(i);if(!/^nbh\.copies\.hb\|/.test(k))o[k]=s.getItem(k);}return Object.fromEntries(Object.entries(o).sort());};
  return JSON.stringify({idb:out,ls:st(localStorage),ss:st(sessionStorage)});};
const dump=(p,skip)=>p.evaluate(DUMP,skip||null);
function diff(a,b){const A=JSON.parse(a),B=JSON.parse(b),d=[];const walk=(x,y,pth)=>{if(JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x)){new Set(Object.keys(x).concat(Object.keys(y))).forEach(k=>walk(x[k],y[k],pth+'/'+k));return;}d.push(pth+": "+String(JSON.stringify(x)).slice(0,160)+" -> "+String(JSON.stringify(y)).slice(0,160));};walk(A,B,'');return d;}
const undoIn=(p,sel)=>p.locator(sel||'.ws-undo-b').first();
const cfOpen=p=>p.evaluate(()=>{const d=document.getElementById('cfDlg');return !!(d&&d.open);});
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNk+M9QzwAEjDAGNzYAAKMCBQHv0rNvAAAAAElFTkSuQmCC';
const WAV=(()=>{const n=800,b=Buffer.alloc(44+n);b.write('RIFF',0);b.writeUInt32LE(36+n,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(8000,28);b.writeUInt16LE(1,32);b.writeUInt16LE(8,34);b.write('data',36);b.writeUInt32LE(n,40);for(let i=0;i<n;i++)b[44+i]=128+Math.round(60*Math.sin(i/6));return 'data:audio/wav;base64,'+b.toString('base64');})();

/* ---- a small Google Drive (as qa/v2247-test.js), with a log of what changes it ---- */
const D={files:new Map(),n:0,who:'simulated.bcba@palmbeachschools.org',sess:new Map(),log:[]};
const now=()=>new Date(Date.now()+D.n*1000).toISOString();
function evalQ(q,f){if(/trashed=false/.test(q)&&f.trashed)return false;const mt=/mimeType='([^']+)'/.exec(q);if(mt&&f.mimeType!==mt[1])return false;
  const par=/'([^']+)' in parents/.exec(q);if(par&&!(f.parents||[]).includes(par[1]))return false;
  const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)],hit=m=>(f.appProperties||{})[m[1]]===m[2];if(ap.length&&!(/\) or appProperties|\} or appProperties/.test(q)?ap.some(hit):ap.every(hit)))return false;return true;}
const pick=f=>({id:f.id,name:f.name,mimeType:f.mimeType,size:String((f.content||'').length),version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties});
function parts(ct,body){const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));}
async function drive(route){const req=route.request(),u=new URL(req.url()),m=req.method();
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/oauth2/v3/userinfo')return json({email:D.who});
  let mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
  if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>evalQ(q,f)).map(pick)});}
  if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
  if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
  if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta){f.trashed=meta.trashed;D.log.push({t:Date.now(),what:'trash',id:f.id,name:f.name});}
    if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.version++;D.n++;f.modifiedTime=now();return json({id:f.id});}
  mm=/^\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(u.pathname);
  if(mm&&u.searchParams.get('uploadType')==='resumable'&&(m==='POST'||m==='PATCH')){const h=req.headers();const meta=JSON.parse(req.postData()||'{}');D.n++;const sid='s'+D.n;D.sess.set(sid,{id:mm[1]||'',meta,len:+h['x-upload-content-length']});
    return route.fulfill({status:200,headers:{'Location':'https://www.googleapis.com/upload/drive/v3/files'+(mm[1]?'/'+mm[1]:'')+'?uploadType=resumable&upload_id='+sid,'Access-Control-Expose-Headers':'Location'},body:''});}
  const put=(meta,content,id)=>{if(meta.appProperties&&meta.appProperties.nbh==='gone')D.log.push({t:Date.now(),what:'marker',k:meta.appProperties.k||''});
    if(!id){D.n++;const nid='f'+D.n;const f=Object.assign({id:nid,version:1,modifiedTime:now(),trashed:false},meta,{content});D.files.set(nid,f);return f;}
    const f=D.files.get(id);if(!f)return null;if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;D.n++;f.modifiedTime=now();return f;};
  if(mm&&u.searchParams.get('upload_id')&&m==='PUT'){const s=D.sess.get(u.searchParams.get('upload_id'));if(!s)return json({error:{code:404}},404);D.sess.delete(u.searchParams.get('upload_id'));const f=put(s.meta,req.postData()||'',s.id);return f?json(pick(f)):json({error:{code:404}},404);}
  if(mm){const raw=req.postData()||'';const [metaS,content]=parts(req.headers()['content-type'],raw);const f=put(JSON.parse(metaS),content,m==='POST'?'':mm[1]);return f?json(pick(f)):json({error:{code:404}},404);}
  return json({error:{code:400,message:'not simulated: '+m+' '+u.pathname}},400);}
const casesIn=()=>[...D.files.values()].filter(f=>f.appProperties&&f.appProperties.nbh==='case');
async function driveCtx(br){const c=await ctxOf(br);
  await c.addInitScript(()=>{window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){setTimeout(()=>cfg.callback({access_token:'simulated-drive-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await c.route('https://www.googleapis.com/**',drive);await c.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  return c;}
const idle=p=>p.waitForFunction(()=>!DRV.busy,null,{timeout:30000}).then(()=>sleep(300));
const recOf=(p,key)=>p.evaluate(async k=>{const r=(await clList()).find(x=>x.key===k);const pts=await hxPoints(k);
  return {r:r?JSON.stringify(r):null,pts:JSON.stringify(pts),pin:clPins().includes(k),skip:drvLs('nbh.drive.skip')||'{}'};},key);
const pressCf=(p,re)=>p.evaluate(src=>{const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(src).test(x.textContent));if(b)b.click();return !!b;},re.source);
/* a caseload card's Remove, tapped as a person does: its menu first, when it is in one */
async function tapRemove(p,key){const m=await p.evaluate(k=>{document.querySelectorAll('[data-t-menu]').forEach(x=>x.removeAttribute('data-t-menu'));const b=[...document.querySelectorAll('#dlgBody [data-cldel]')].find(x=>x.dataset.cldel===k);if(!b)return false;
    const c=b.closest('.sr-cm');(c||b).scrollIntoView({block:'center'});if(c&&!b.getClientRects().length){c.querySelector(':scope>button').setAttribute('data-t-menu','1');return true;}return false;},key);
  if(m){await p.locator('[data-t-menu="1"]').tap();await sleep(300);}
  await p.locator('#dlgBody [data-cldel="'+key+'"]').first().tap();}
const cfText=p=>p.evaluate(()=>document.getElementById('cfTitle').textContent+' / '+[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent).join(' | '));

(async()=>{const br=await L.chromium.launch();
 /* ================= R: Remove all student data ================= */
 if(want('R'))try{const c=await ctxOf(br),p=watch(await c.newPage(),'R');await p.goto(WS);await sleep(3200);await closeDlgs(p);
  /* the setup answers its own questions (Save case); the checks below answer the real box */
  const seed=async tok=>p.evaluate(async([PNG,WAV,tok])=>{window.__cf0=window.__cf0||wsUI.confirm;wsUI.confirm=async()=>true;
    const set=(s,x)=>{const e=document.querySelector(s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Sample Student');set('#pSid','000000');set('#pSite','Sample Elementary');
    openForm('DM-1');for(let i=0;i<120&&!(state.status['DM-1']&&!state.pending['DM-1']);i++)await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,1200));
    await saveCase();await new Promise(r=>setTimeout(r,1500));
    const m=(await clList()).find(r=>r.client==='Sample Student');
    const pic=await nbhMedia.put(PNG,{kind:'image'}),snd=await nbhMedia.put(WAV,{kind:'audio'});
    const r2=Object.assign({},m,{key:clKey({client:'Sample Second',sid:'000001'}),client:'Sample Second',sid:'000001',text:m.text.split('Sample Student').join('Sample Second').split('000000').join('000001').replace('"Sample Elementary"','"Sample Elementary","note":"'+pic+' '+snd+'"')});
    await clTx('readwrite',st=>st.put(r2));await hxKeep({key:r2.key,text:r2.text,at:new Date(Date.now()-3600e3).toISOString(),dev:'iPad',why:'simulated earlier save'});
    clPinSet(m.key,true);clPinSet(r2.key,true);
    await CP.put({key:'s-othertab-0',kind:'shell',tab:'othertab',student:'Sample Second',saved:new Date(Date.now()-600e3).toISOString(),packet:{client:'Sample Second'},forms:{'DM-1':{title:'DM-1',total:3,data:{a:'1'},own:''}}});
    CP.stash({key:'s-othertab-1',kind:'shell',tab:'othertab2',student:'Sample Student',saved:new Date().toISOString(),forms:{'DM-1':{title:'DM-1',total:1,data:{b:'2'},own:''}}});
    await new Promise(res=>{const q=indexedDB.open('nbh-share',1);q.onupgradeneeded=()=>{try{q.result.createObjectStore('shares',{keyPath:'id'});}catch(e){}};q.onsuccess=()=>{const t=q.result.transaction('shares','readwrite');t.objectStore('shares').put({id:'sh-sim-1',key:m.key,base:'{"simulated":true}',at:new Date().toISOString()});t.oncomplete=()=>{q.result.close();res();};};q.onerror=()=>res();});
    localStorage.setItem('nbh.caseload.backup',new Date(Date.now()-864e5).toISOString());localStorage.setItem('nbh.caseload.read','{"simulated":1}');
    kvSet('nbh.drive.on@nbh','1');kvSet('nbh.drive.acct@nbh','simulated.bcba@palmbeachschools.org');kvSet('nbh.drive.skip@nbh','{"abc":"3"}');kvSet('nbh.drive.log@nbh','[]');
    if(tok){sessionStorage.setItem('nbh.google.tok','{"simulated":1}');sessionStorage.setItem('nbh.google.mail','simulated.bcba@palmbeachschools.org');}
    /* the case on screen closed: nothing it holds is kept back by the sweep */
    state.lastSig=caseSig();await clearCase();await new Promise(r=>setTimeout(r,2600));wsUI.confirm=window.__cf0;   /* Back where you left off forgets the case within 2 s */
    return {n:(await clList()).length,media:(await nbhMedia.stat()).count};},[PNG,WAV,tok]);
  const counts=()=>p.evaluate(async()=>({cl:(await clList()).length,hx:(await new Promise(res=>{hxTx(['points'],'readonly',P=>{P.count().onsuccess=e=>res(e.target.result);}).catch(()=>res(-1));})),
    cp:(await CP.list()).length,media:(await nbhMedia.stat()).count,sh:(await shAll()).length,pins:clPins().length,drv:!!drvLs('nbh.drive.on'),tok:sessionStorage.getItem('nbh.google.tok')}));
  for(const tok of [false,true]){
    const s0=await seed(tok);const before=await dump(p);const c0=await counts();
    await p.evaluate(()=>caseloadOpen());await sleep(900);
    if(await p.evaluate(()=>{const s=document.getElementById('srClSet');return !!(s&&s.hidden);}))await p.locator('#srClGear').tap();await sleep(400);
    await p.locator('#clRemoveAll').evaluate(b=>{let e=b;while(e){if(e.tagName==='DETAILS')e.open=true;e=e.parentElement;}b.scrollIntoView({block:'center'});});await sleep(300);await p.locator('#clRemoveAll').tap();await sleep(700);
    const q=await cfText(p);const asked=await cfOpen(p);
    await pressCf(p,/Remove everything/);await sleep(700);if(await cfOpen(p)){await pressCf(p,/Remove anyway/);await sleep(500);}
    let row=0;for(let i=0;i<20&&!row;i++){await sleep(300);row=await p.locator('#dlg .ws-undo-row .ws-undo-b').count();}
    const c1=await counts();const txt=await p.evaluate(()=>(document.querySelector('#dlg .ws-undo-row')||{}).textContent||'');
    ok('R'+(tok?'2':'1')+' Remove all student data still asks first (the question now says Undo follows), then removes everything'+(tok?' (this tab signed in to Google)':' (Google Drive used, signed out)'),
      asked&&/^Remove every student’s data from this iPad\?/.test(q)&&s0.n===2&&c0.cl===2&&c0.hx>=1&&c0.cp>=1&&c0.media>=2&&c0.sh===1&&c0.pins===2&&c0.drv&&c1.cl===0&&c1.hx===0&&c1.cp===0&&c1.media===0&&c1.sh===0&&!c1.drv&&c1.tok===null,{q,asked,s0,c0,c1});
    const qb=await p.evaluate(()=>document.getElementById('cfBody').textContent);
    ok('R'+(tok?'2':'1')+' the message in the Caseload box offers Undo (the question named it)',row===1&&/^Every student’s data is removed from this iPad\. Google Drive is no longer used here\./.test(txt)&&/Undo puts it all back/.test(qb),{row,txt,qb:qb.slice(0,300)});
    if(!tok)await p.screenshot({path:__dirname+'/out/v2571-undo-more/R-remove-all-undo.png'}).catch(()=>{});
    await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(2500);
    const after=await dump(p);const d=diff(before,after);
    const c2=await counts();const cards=await p.evaluate(()=>document.querySelectorAll('#dlgBody [data-cldel]').length);
    ok('R'+(tok?'2':'1')+' Undo puts back every record and entry byte for byte (IndexedDB, localStorage, sessionStorage; pictures and sounds by their bytes): '+(JSON.parse(before).idb?Object.keys(JSON.parse(before).idb).join(', '):''),before===after&&c2.cl===2&&c2.drv&&cards===2,{d:d.slice(0,12),c2,cards});
  }
  /* left alone, it stands */
  await p.evaluate(()=>{window.__cf0=wsUI.confirm;wsUI.confirm=async()=>true;});await p.evaluate(()=>clRemoveAll());await p.evaluate(()=>{wsUI.confirm=window.__cf0;});
  await sleep(10500);const c3=await counts();const live=await p.evaluate(()=>__ws2570.undoLive());
  ok('R3 left alone for the message\'s time, the removal stands and the Undo goes',c3.cl===0&&c3.hx===0&&c3.cp===0&&c3.media===0&&!live,{c3,live});
  await c.close();}catch(e){ok('R the run finished without an error',false,String(e.stack||e).slice(0,700));}

 /* ================= C: Delete all copies (Autosave) ================= */
 if(want('C'))try{const c=await ctxOf(br),p=watch(await c.newPage(),'C');await p.goto(WS);await sleep(3200);await closeDlgs(p);
  const seed=()=>p.evaluate(async()=>{const t=Date.now();for(let i=0;i<3;i++)await CP.put({key:'s-sim'+i+'-0',kind:'shell',tab:'sim'+i,student:'Sample Student '+(i+1),saved:new Date(t-(i+1)*600e3).toISOString(),packet:{client:'Sample Student '+(i+1)},forms:{'IC-1':{title:'IC-1',total:4,data:{n:String(i)},own:''}}});
    CP.stash({key:'s-sim9-0',kind:'shell',tab:'sim9',student:'Sample Student 9',saved:new Date().toISOString(),forms:{'IC-1':{title:'IC-1',total:1,data:{n:'9'},own:''}}});
    return {n:(await CP.list()).length,pend:Object.keys(localStorage).filter(k=>/^nbh\.copies\.pend\|/.test(k)).length};});
  const s0=await seed(),n0=s0.n;const before=await dump(p);
  await p.evaluate(()=>autoDialog(false));await sleep(900);
  await p.locator('#autoClear').tap();await sleep(1200);
  const r={n0,asked:await cfOpen(p),left:await p.evaluate(async()=>(await CP.list()).length),pend:await p.evaluate(()=>Object.keys(localStorage).filter(k=>/^nbh\.copies\.pend\|/.test(k)).length),undo:await p.locator('#wsToasts .ws-undo-b').count(),txt:await p.evaluate(()=>document.getElementById('wsToasts').textContent)};
  ok('C1 Delete all copies: no question; every copy and the pending slot go; the message offers Undo',n0===3&&s0.pend===1&&!r.asked&&r.left===0&&r.pend===0&&r.undo===1&&/The 3 Autosave copies in this browser deleted\./.test(r.txt),r);
  await p.screenshot({path:__dirname+'/out/v2571-undo-more/C-delete-all-copies-undo.png'}).catch(()=>{});
  await p.locator('#wsToasts .ws-undo-b').tap();await sleep(1800);
  const after=await dump(p);
  ok('C2 Undo puts every copy and the pending slot back byte for byte',before===after&&(await p.evaluate(async()=>(await CP.list()).length))===3,diff(before,after).slice(0,10));
  await p.evaluate(()=>autoDialog(false));await sleep(900);await p.locator('#autoClear').tap();await p.mouse.move(5,5);await sleep(10500);
  const r3={left:await p.evaluate(async()=>(await CP.list()).length),live:await p.evaluate(()=>__ws2570.undoLive())};
  ok('C3 left alone, the copies stay deleted and the Undo goes',r3.left===0&&!r3.live,r3);
  /* one copy's Delete (v25.71 too) */
  await seed();await sleep(500);const b4=await dump(p);await p.evaluate(()=>autoDialog(false));await sleep(900);
  await p.locator('#dlgBody button[data-as="d"]').first().tap();await sleep(1500);
  const r4={asked:await cfOpen(p),left:await p.evaluate(async()=>(await CP.list()).length),row:await p.locator('#dlg .ws-undo-row .ws-undo-b').count(),txt:await p.evaluate(()=>(document.querySelector('#dlg .ws-undo-row')||{}).textContent||'')};
  if(r4.row){await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(1800);}const a4=await dump(p);
  r4.listed=await p.evaluate(()=>document.querySelectorAll('#dlgBody button[data-as="d"]').length);
  ok('C4 one copy\'s Delete: no question; Undo (in the Autosave box) puts it back byte for byte and lists it again',!r4.asked&&r4.left===2&&r4.row===1&&/^The copy of Sample Student \d deleted\./.test(r4.txt)&&b4===a4&&r4.listed===3,{r4,d:diff(b4,a4).slice(0,6)});
  await closeDlgs(p);
  await c.close();}catch(e){ok('C the run finished without an error',false,String(e.stack||e).slice(0,700));}

 /* ================= D: Google Drive ================= */
 if(want('D'))try{const c=await driveCtx(br),p=watch(await c.newPage(),'D');await p.goto(WS);await sleep(2500);await closeDlgs(p);
  await p.evaluate(()=>{window.__cf0=wsUI.confirm;wsUI.confirm=async()=>true;window.alert=()=>{};});
  await p.evaluate(()=>caseloadOpen());await sleep(500);await p.evaluate(()=>document.getElementById('drvLink').click());await sleep(1200);await idle(p);
  await setBar(p,{client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School'});
  await p.evaluate(async()=>{openForm('DM-1');for(let i=0;i<120&&!(state.status['DM-1']&&!state.pending['DM-1']);i++)await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,1200));await saveCase();});await sleep(2000);await idle(p);
  /* two more students kept here and in Drive (simulated copies of the first) */
  await p.evaluate(async()=>{const m=(await clList()).find(r=>r.client==='Mateo Rivera');
    for(const [nm,sid] of [['Ana Rivera','4471824'],['Lucia Rivera','4471825']]){const t=m.text.split('Mateo Rivera').join(nm).split('4471823').join(sid);
      await clTx('readwrite',st=>st.put(Object.assign({},m,{key:clKey({client:nm,sid}),client:nm,sid,text:t,drv:{id:'',ver:null,dirty:true}})));}
    state.lastSig=caseSig();await clearCase();await drvSync({});});
  await idle(p);await p.evaluate(()=>drvSync({}));await idle(p);
  await p.evaluate(()=>{wsUI.confirm=window.__cf0;});
  const keyOf=nm=>p.evaluate(async nm=>((await clList()).find(r=>r.client===nm)||{}).key||'',nm);
  const fileOf=nm=>casesIn().find(f=>f.name.indexOf(nm)===0);
  const mk=await keyOf('Mateo Rivera'),ak=await keyOf('Ana Rivera');await p.evaluate(k=>clPinSet(k,true),mk);
  ok('D0 the setup: three students here and in Drive (simulated)',casesIn().length===3&&!!mk&&!!ak&&!!fileOf('Mateo Rivera')&&!D.log.length,{cases:casesIn().map(f=>f.name),log:D.log});
  /* D1 Caseload's Remove, Everywhere, then Undo */
  const m0=await recOf(p,mk);
  await p.evaluate(()=>caseloadOpen());await sleep(1000);
  await tapRemove(p,mk);await sleep(800);
  const q1=await cfText(p);await pressCf(p,/^Remove everywhere$/);const t1=Date.now();await sleep(1500);
  const d1={q1,gone:(await recOf(p,mk)).r===null,row:await p.locator('#dlg .ws-undo-row .ws-undo-b').count(),txt:await p.evaluate(()=>(document.querySelector('#dlg .ws-undo-row')||{}).textContent||''),log:D.log.length,pend:await p.evaluate(()=>__ws2571.pending().length)};
  ok('D1 Caseload, Remove: the choice is still asked (Everywhere, Only this iPad); Everywhere takes the student off this iPad at once and Drive is told nothing while the message is up',/^Remove Mateo Rivera/.test(q1)&&/Remove everywhere \| Only this iPad/.test(q1)&&d1.gone&&d1.row===1&&/^Mateo Rivera removed from this iPad\. Google Drive and your other devices follow in a few seconds\./.test(d1.txt)&&d1.log===0&&d1.pend===1,d1);
  await p.screenshot({path:__dirname+'/out/v2571-undo-more/D1-drive-remove-everywhere-undo.png'}).catch(()=>{});
  await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(1500);const m1=await recOf(p,mk);
  await sleep(9000);await idle(p);
  ok('D1 Undo: the record, its case history, its pin and the skip list are as before, and Drive is never told (nothing trashed, no marker)',JSON.stringify(m1)===JSON.stringify(m0)&&!D.log.length&&!fileOf('Mateo Rivera').trashed&&(await p.evaluate(()=>__ws2571.pending().length))===0,{same:JSON.stringify(m1)===JSON.stringify(m0),m0:JSON.stringify(m0).slice(0,200),m1:JSON.stringify(m1).slice(0,200),log:D.log});
  /* D2 the same, left alone */
  await p.evaluate(()=>caseloadOpen());await sleep(1000);
  await tapRemove(p,mk);await sleep(800);await pressCf(p,/^Remove everywhere$/);const t2=Date.now();await p.mouse.move(5,5);
  for(let i=0;i<60&&!D.log.some(e=>e.what==='trash');i++)await sleep(250);await idle(p);
  const first=D.log.length?D.log[0].t-t2:-1;
  ok('D2 left alone, Drive is told only after the message\'s time ('+(first/1000).toFixed(1)+' s): the case file to the trash and a removal marker; the student stays off this iPad',first>=7500&&D.log.some(e=>e.what==='trash'&&/^Mateo Rivera/.test(e.name))&&D.log.some(e=>e.what==='marker')&&fileOf('Mateo Rivera').trashed&&(await recOf(p,mk)).r===null&&(await p.evaluate(()=>__ws2571.pending().length))===0,{first,log:D.log});
  /* D3 What Drive holds: Remove everywhere, no question; then Undo */
  D.log.length=0;const a0=await recOf(p,ak);const af=fileOf('Ana Rivera');
  await p.evaluate(()=>caseloadOpen());await sleep(600);await p.evaluate(()=>document.getElementById('drvHolds').click());await sleep(1500);
  await p.locator('[data-dh-rm="'+af.id+'"]').tap();await sleep(1200);
  const d3={asked:await cfOpen(p),gone:(await recOf(p,ak)).r===null,listed:await p.evaluate(()=>/Ana Rivera/.test(document.getElementById('dlgBody').textContent)),row:await p.locator('#dlg .ws-undo-row .ws-undo-b').count(),txt:await p.evaluate(()=>(document.querySelector('#dlg .ws-undo-row')||{}).textContent||''),log:D.log.length};
  ok('D3 What Drive holds, Remove everywhere: no question; the row goes, the student leaves this iPad, Drive is told nothing yet',!d3.asked&&d3.gone&&!d3.listed&&d3.row===1&&/^Ana Rivera \(4471824\) removed from this iPad\. Drive’s trash and your other devices follow in a few seconds\./.test(d3.txt)&&d3.log===0,d3);
  await p.screenshot({path:__dirname+'/out/v2571-undo-more/D3-what-drive-holds-undo.png'}).catch(()=>{});
  await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(1500);const a1=await recOf(p,ak);const listed=await p.evaluate(()=>/Ana Rivera/.test(document.getElementById('dlgBody').textContent));
  await sleep(9000);
  ok('D3 Undo: the student is back on this iPad exactly (record, history, skip list) and listed again; Drive is never told',JSON.stringify(a1)===JSON.stringify(a0)&&listed&&!D.log.length&&!af.trashed,{same:JSON.stringify(a1)===JSON.stringify(a0),listed,log:D.log});
  /* D4 the same, left alone (the box closed by hand ends the message: Drive is told then) */
  await p.locator('[data-dh-rm="'+af.id+'"]').tap();const t4=Date.now();await p.mouse.move(5,5);
  for(let i=0;i<60&&!D.log.some(e=>e.what==='trash');i++)await sleep(250);await idle(p);const f4=D.log.length?D.log[0].t-t4:-1;
  ok('D4 left alone, Drive is told only after the message\'s time ('+(f4/1000).toFixed(1)+' s): Ana\'s case file in the trash, a marker; Ana not on this iPad',f4>=7500&&af.trashed&&D.log.some(e=>e.what==='marker')&&(await recOf(p,ak)).r===null,{f4,log:D.log});
  await closeDlgs(p);
  /* D5 the page closed while the message is up: Drive is never told; the next start says so */
  D.log.length=0;const lk=await keyOf('Lucia Rivera');const lf=fileOf('Lucia Rivera');
  await p.evaluate(()=>caseloadOpen());await sleep(1000);
  await tapRemove(p,lk);await sleep(800);await pressCf(p,/^Remove everywhere$/);await sleep(1500);
  const pend5=await p.evaluate(()=>__ws2571.pending());
  await p.close();await sleep(9000);
  const p2=watch(await c.newPage(),'D5');await p2.goto(WS);await sleep(6000);
  const d5={pend5,log:D.log.length,trashed:lf.trashed,here:(await recOf(p2,lk)).r!==null,toast:await p2.evaluate(()=>{const t=[...document.querySelectorAll('#wsToasts .ws-toast')].map(x=>x.textContent).join(' | ');return t;}),pend:await p2.evaluate(()=>__ws2571.pending().length),skip:await p2.evaluate(()=>drvLs('nbh.drive.skip'))};
  /* a sync now (signed in again) does not bring the student back */
  await p2.evaluate(async()=>{sessionStorage.setItem('nbh.google.drive@nbh',JSON.stringify({tok:'simulated-drive-token',exp:Date.now()+3600e3}));await drvSync({});});await idle(p2);
  d5.afterSync=(await recOf(p2,lk)).r!==null;d5.log2=D.log.length;
  ok('D5 the page closed while the message was up: Drive is never told (nothing trashed, no marker), the student is off this iPad only (the skip list keeps Drive from bringing them back), and the next start says so (by initials)',
    pend5.length===1&&pend5[0].ini==='L.R.'&&d5.log===0&&!d5.trashed&&!d5.here&&/Remove everywhere \(L\.R\.\) was not finished/.test(d5.toast)&&d5.pend===0&&!/Lucia/.test(JSON.stringify(pend5))&&!d5.afterSync&&d5.log2===0,d5);
  await c.close();}catch(e){ok("D the run finished without an error",false,String(e.stack||e).slice(0,2500));}

 /* ================= O: Reset the offline copy ================= */
 if(want('O'))try{const c=await ctxOf(br,{sw:true}),p=watch(await c.newPage(),'O');await p.goto(WS);
  const chip=async ms=>{for(let i=0;i<ms/500;i++){const t=await p.evaluate(()=>{const e=document.getElementById('offChip');return e?e.textContent.trim():'';}).catch(()=>'');if(/^Saved for offline use$/.test(t))return t;await sleep(500);}return '';};
  const saved=await chip(180000);
  const st=()=>p.evaluate(async()=>({reg:(await navigator.serviceWorker.getRegistrations()).length,caches:(await caches.keys()).filter(k=>k.indexOf('nbh-offline:')===0)}));
  const s0=await st();await closeDlgs(p);
  ok('O0 the offline copy is saved on this device (served here)',!!saved&&s0.reg>=1&&s0.caches.length>=1,{saved,s0});
  /* O1 a person's Reset, nothing to lose: no question; nothing deleted while the message is up; Undo keeps it */
  await p.evaluate(()=>PWA.open());await sleep(500);
  let nav=false;p.on('framenavigated',f=>{if(f===p.mainFrame())nav=true;});
  await p.locator('#offReset').tap();await sleep(1500);
  const o1={asked:await cfOpen(p),undo:await p.locator('#wsToasts .ws-undo-b').count(),txt:await p.evaluate(()=>document.getElementById('wsToasts').textContent),s:await st()};
  ok('O1 Reset the offline copy, nothing to lose: no question; the message says it is about to happen, with Undo; nothing deleted yet',!o1.asked&&o1.undo===1&&/The offline copy is reset in a few seconds, and the page loads again from the website\./.test(o1.txt)&&o1.s.reg===s0.reg&&o1.s.caches.join()===s0.caches.join(),o1);
  await p.screenshot({path:__dirname+'/out/v2571-undo-more/O1-reset-undo.png'}).catch(()=>{});
  await p.locator('#wsToasts .ws-undo-b').tap();await sleep(10000);
  const o2=await st();ok('O1 Undo: the copy stays as it was and the page does not load again',!nav&&o2.reg===s0.reg&&o2.caches.join()===s0.caches.join(),{nav,o2});
  /* O2 the page closed while the message is up: nothing reset */
  await p.evaluate(()=>PWA.open());await sleep(500);await p.locator('#offReset').tap();await sleep(1500);await p.close();await sleep(9000);
  const p3=watch(await c.newPage(),'O3');await p3.goto(WS);await sleep(2500);
  const o3=await p3.evaluate(async()=>({reg:(await navigator.serviceWorker.getRegistrations()).length,caches:(await caches.keys()).filter(k=>k.indexOf('nbh-offline:')===0)}));
  ok('O2 the page closed while the message was up: nothing is reset',o3.reg===s0.reg&&o3.caches.join()===s0.caches.join(),o3);
  /* O3 left alone: reset after the message's time, and the page loads again from the website */
  await closeDlgs(p3);await p3.evaluate(()=>PWA.open());await sleep(500);let navAt=0;p3.on('framenavigated',f=>{if(f===p3.mainFrame()&&!navAt)navAt=Date.now();});
  await p3.locator('#offReset').tap();const t3=Date.now();await p3.mouse.move(5,5);
  for(let i=0;i<80&&!navAt;i++)await sleep(250);await sleep(2500);
  const o4=await p3.evaluate(async()=>({url:location.href,old:(await caches.keys()).filter(k=>k.indexOf('nbh-offline:')===0)}));
  ok('O3 left alone, the copy is reset only after the message\'s time ('+((navAt-t3)/1000).toFixed(1)+' s): the old copy is gone and the page loads again from the website',navAt&&navAt-t3>=7500&&s0.caches.some(k=>/:set:/.test(k))&&!o4.old.some(k=>/:set:/.test(k)&&s0.caches.includes(k)),{d:navAt-t3,o4,s0:s0.caches});
  /* O4 with work not in a case file, the question is still asked */
  await sleep(3000);await closeDlgs(p3);await setBar(p3,{client:'Sample Student',sid:'000000'});await p3.evaluate(()=>openForm('IC-1'));await sleep(4000);
  await p3.evaluate(()=>{const f=state.frames['IC-1'].contentDocument.querySelector('input[type=text],textarea');f.value='typed (simulated)';f.dispatchEvent(new Event('input',{bubbles:true}));f.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(1500);
  await p3.evaluate(()=>PWA.open());await sleep(500);await p3.locator('#offReset').tap();await sleep(1500);
  const o5={asked:await cfOpen(p3),q:await p3.evaluate(()=>document.getElementById('cfBody').textContent),undo:await p3.locator('#wsToasts .ws-undo-b').count()};
  if(o5.asked)await pressCf(p3,/^Cancel$/);
  ok('O4 with work not in a case file, Reset still asks first (and says what would be lost)',o5.asked&&/not in a case file yet; it will be lost|since the last Save case will be lost/.test(o5.q)&&!o5.undo,o5);
  await c.close();}catch(e){ok('O the run finished without an error',false,String(e.stack||e).slice(0,700));}

 /* ================= B: Form TB-1's bank ================= */
 if(want('B'))try{const c=await ctxOf(br,{ctx:{viewport:{width:1440,height:900},hasTouch:false,isMobile:false,userAgent:undefined}}),p=watch(await c.newPage(),'B');
  const F=L.forms().find(f=>f.id==='TB-1');await p.goto(L.BASE+'/NBH-Workstation/'+F.file);await sleep(2500);
  const bankAll=()=>p.evaluate(()=>new Promise(res=>{const o=indexedDB.open('nbh-tb1-bank',1);o.onupgradeneeded=()=>{try{o.result.createObjectStore('defs',{keyPath:'id'});}catch(e){}};o.onsuccess=()=>{try{const x=o.result.transaction('defs','readonly').objectStore('defs').getAll();x.onsuccess=()=>{res((x.result||[]).map(e=>e.id));o.result.close();};x.onerror=()=>res([]);}catch(e){res([]);}};o.onerror=()=>res([]);}));
  await p.evaluate(()=>new Promise(res=>{const o=indexedDB.open('nbh-tb1-bank',1);o.onupgradeneeded=()=>{try{o.result.createObjectStore('defs',{keyPath:'id'});}catch(e){}};
    o.onsuccess=()=>{const t=o.result.transaction('defs','readwrite'),st=t.objectStore('defs'),now=Date.now();
      [[1,'Hitting (simulated)'],[2,'Bolting (simulated)']].forEach(([i,lab])=>st.put({id:'my-sim'+i,lab,def:'A simulated definition of '+lab+'.',dim:'Frequency',type:'Reduction',style:'Topographical',unit:'Each instance',saved:new Date(now-i*1000).toISOString(),aka:['sim'+i],note:''}));
      t.oncomplete=()=>{o.result.close();res();};};}));
  await p.reload();await sleep(2500);
  const bankDump=()=>p.evaluate(DUMP,'^(?!nbh-tb1-bank$)');
  const panel=async()=>{await p.evaluate(()=>{const h=document.getElementById('tb1LibPanel');for(const b of document.querySelectorAll('#viewSeg button')){if(h.offsetParent)break;b.click();}
    const d=h.shadowRoot.querySelector('details.pan');d.open=true;h.scrollIntoView();});await sleep(500);};
  const asked=()=>p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);});
  const n0=(await bankAll()).length;const before=await bankDump();await panel();
  await p.locator('#tb1LibPanel .bclear').click();await sleep(1200);
  const b1={n0,asked:await asked(),n:(await bankAll()).length,undo:await p.locator('#nbhToasts .nbh-undo').count(),txt:await p.evaluate(()=>(document.getElementById('nbhToasts')||{}).textContent||''),bn:await p.evaluate(()=>document.getElementById('tb1LibPanel').shadowRoot.querySelector('.bn').textContent)};
  ok('B1 TB-1, Delete my bank: no question; the bank is empty; the message offers Undo',n0===2&&!b1.asked&&b1.n===0&&b1.undo===1&&/The 2 definitions in my bank deleted from this browser\./.test(b1.txt)&&/empty/.test(b1.bn),b1);
  await p.screenshot({path:__dirname+'/out/v2571-undo-more/B-tb1-bank-undo.png'}).catch(()=>{});
  await p.locator('#nbhToasts .nbh-undo').click();await sleep(1500);const after=await bankDump();
  const bn1=await p.evaluate(()=>document.getElementById('tb1LibPanel').shadowRoot.querySelector('.bn').textContent);
  ok('B1 Undo puts the bank\'s store back byte for byte (both definitions, as kept), and the panel counts them again',before===after&&(await bankAll()).length===2&&/^2 definitions of your own/.test(bn1),{d:diff(before,after).slice(0,8),bn1});
  /* Remove from my bank (one entry) */
  await p.evaluate(()=>{const h=document.getElementById('tb1LibPanel');const q=h.shadowRoot.querySelector('.q');q.value='Hitting (simulated)';q.dispatchEvent(new Event('input'));});await sleep(400);
  await p.evaluate(()=>{const h=document.getElementById('tb1LibPanel');h.shadowRoot.querySelector('.it[data-id="my-sim1"]').click();});await sleep(500);
  await p.locator('#tb1LibPanel .bdel').click();await sleep(1200);
  const b2={asked:await asked(),ids:await bankAll(),undo:await p.locator('#nbhToasts .nbh-undo').count()};
  if(b2.undo)await p.locator('#nbhToasts .nbh-undo').first().click();await sleep(1500);const after2=await bankDump();
  ok('B2 Remove from my bank: no question; Undo puts the definition back byte for byte',!b2.asked&&b2.ids.join()==='my-sim2'&&b2.undo===1&&after2===before,{b2,d:diff(before,after2).slice(0,6)});
  await p.locator('#tb1LibPanel .bclear').click();await p.mouse.move(5,5);await sleep(10500);
  ok('B3 left alone, the bank stays empty and the Undo goes',(await bankAll()).length===0&&!(await p.locator('#nbhToasts .nbh-undo').count()));
  await c.close();}catch(e){ok('B the run finished without an error',false,String(e.stack||e).slice(0,700));}

 /* ================= S: the collected replies on the site ================= */
 if(want('S'))try{const c=await ctxOf(br,{ctx:{viewport:{width:1440,height:900},hasTouch:false,isMobile:false,userAgent:undefined}});
  const SITE='https://box.simulated.test/reply/box.php',dels=[];
  await c.route('https://box.simulated.test/**',async r=>{const u=new URL(r.request().url());const a=u.searchParams.get('a');let ids=[];try{ids=JSON.parse(r.request().postData()||'{}').ids||[];}catch(e){}
    if(a==='del')dels.push({t:Date.now(),n:ids.length});
    return r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(a==='del'?{ok:true,deleted:ids.length}:a==='list'?{ok:true,replies:[]}:{ok:true})});});
  const hx=n=>Array.from({length:n},(_,i)=>((i*7+3)%16).toString(16)).join('');
  const BOXV={id:hx(32),token:hx(32).split('').reverse().join(''),pub:{x:'A'.repeat(43),y:'B'.repeat(43)},priv:{d:'C'.repeat(43),x:'A'.repeat(43),y:'B'.repeat(43)},site:SITE,got:['r1','r2','r3'],held:[],made:'2026-11-01'};
  const F=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
  const run=async(tag,id,setup,btn,inBox)=>{const p=watch(await c.newPage(),'S '+id);await p.goto(L.BASE+'/NBH-Workstation/'+F[id]);await sleep(2500);
    await p.evaluate(setup,[BOXV,SITE]);await sleep(800);
    const ready=await p.locator(btn).evaluate(b=>({dis:b.disabled,vis:!!b.getClientRects().length}));if(ready.dis||!ready.vis)console.log('   (setup of '+id+': the button is '+JSON.stringify(ready)+')');
    const sel=inBox?(inBox+' .nbh-undo'):'#nbhToasts .nbh-undo';
    /* Undo */
    dels.length=0;await p.locator(btn).click();await sleep(1200);
    const r={asked:await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);}),undo:await p.locator(sel).count(),txt:await p.locator(sel).first().evaluate(b=>b.parentNode.textContent).catch(()=>''),dels:dels.length};
    ok(tag+' Form '+id+', Remove the collected replies from the site: no question; the site is asked nothing while the message with Undo is up'+(inBox?' (inside the open box)':''),!r.asked&&r.undo===1&&/removed from the site in a few seconds/.test(r.txt)&&r.dels===0,r);
    if(inBox)await p.screenshot({path:__dirname+'/out/v2571-undo-more/S-'+id+'-in-box.png'}).catch(()=>{});
    await p.locator(sel).first().click();await sleep(10000);
    ok(tag+' Undo: the site is never asked',dels.length===0,dels);
    /* left alone */
    await p.locator(btn).click();const t0=Date.now();await p.mouse.move(5,5);for(let i=0;i<60&&!dels.length;i++)await sleep(250);await sleep(800);
    ok(tag+' left alone, the site is asked once, after the message\'s time ('+(dels.length?((dels[0].t-t0)/1000).toFixed(1):'-')+' s)',dels.length===1&&dels[0].t-t0>=7500&&dels[0].n===3,dels);
    await p.close();};
  await run('S1','IA-1',async([B,site])=>{let saved=null;const oc=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return oc(b);};const clk=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,800));URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=clk;
    const j=JSON.parse(saved);j.box=B;if(j.fields&&typeof j.fields==='object')j.fields['rp.box']=site;
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(j)],'ia1.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,1500));const d=document.getElementById('rpBox');if(d&&!d.value)d.value=site;const v=document.querySelector('#viewSeg [data-view="outs"]');if(v)v.click();await new Promise(r=>setTimeout(r,500));
    document.getElementById('outPurgeBtn').scrollIntoView({block:'center'});},'#outPurgeBtn');
  await run('S2','IN-1',([B,site])=>{S.rb={box:JSON.parse(JSON.stringify(B)),sends:[],placed:0,last:'',addr:site};document.getElementById('rcBtn').click();},'#rbPurge','#rcDlg');
  await run('S3','DD-1',([B,site])=>{S.staff=Object.assign({},S.staff||{},{box:JSON.parse(JSON.stringify(B)),site:site,links:[],got:['r-1-aaaaaaaaaaaa','r-2-bbbbbbbbbbbb','r-3-cccccccccccc'],seen:[],log:[],held:[]});
    try{stPaint();}catch(e){}const tb=document.querySelector('nav.tabs button[data-tab="data"]')||document.querySelector('button[data-tab="data"]');if(tb)tb.click();const b=document.getElementById('stPurge');let el=b;while(el){if(el.tagName==='DETAILS')el.open=true;if(el.tagName==='DIALOG'&&!el.open)el.showModal();el=el.parentElement;}b.disabled=false;b.scrollIntoView({block:'center'});},'#stPurge');
  await c.close();}catch(e){ok('S the run finished without an error',false,String(e.stack||e).slice(0,700));}

 const pe=errs.filter(e=>!/a browser dialog/.test(e)||true);
 ok('no page errors and no browser dialogs anywhere',!pe.length,pe.slice(0,8));
 await br.close();console.log((fails?'FAILED ':'OK ')+(n-fails)+' of '+n+' checks passed');process.exit(fails?1:0);})();
