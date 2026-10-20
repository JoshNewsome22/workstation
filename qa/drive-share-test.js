/* v23.54 a case shared in Google Drive with a colleague's school account (and v23.53, two changed copies put together).
   Two accounts on one simulated Google Drive: the BCBA's iPad and the colleague's laptop. The BCBA shares the student's
   file with the colleague's email; the colleague opens it with Open a case shared with me (Google's picker, simulated: it
   gives their account that one file); each side's Save case goes to the one file, the colleague's device never makes a copy
   of its own, and two changed copies are put together (each side's answer kept; an answer both changed asked side by side,
   naming the person). Stop sharing: the colleague is told once and keeps their copy; their Remove takes it off their
   device only. Help, the data-where row, the command. Google (sign-in, userinfo, Drive, the picker) is simulated here.
   Simulated people only; example.org addresses.  usage: node qa/drive-share-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const WS=BASE+'/NBH-Workstation/index.html',BCBA='jordan.ellis@example.org',COL='dana.whitfield@example.org';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
/* ---- one Google Drive, two accounts: files have an owner and permissions; an account sees its own files, and a file shared
   with it only once it has been picked (drive.file) */
const D={files:new Map(),n:0,picked:{}};
const now=()=>new Date(Date.now()+D.n*1000).toISOString();
const can=(f,who,write)=>f.owner===who||((D.picked[who]||new Set()).has(f.id)&&(f.perms||[]).some(p=>p.email===who&&(!write||p.role==='writer')));
function evalQ(q,f){if(/trashed=false/.test(q)&&f.trashed)return false;const mt=/mimeType='([^']+)'/.exec(q);if(mt&&f.mimeType!==mt[1])return false;
  const par=/'([^']+)' in parents/.exec(q);if(par&&!(f.parents||[]).includes(par[1]))return false;
  const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)],hit=m=>(f.appProperties||{})[m[1]]===m[2];if(ap.length&&!(/\) or appProperties|\} or appProperties/.test(q)?ap.some(hit):ap.every(hit)))return false;
  const nm=/name='([^']+)'/.exec(q);if(nm&&f.name!==nm[1])return false;return true;}
const pick=f=>({id:f.id,name:f.name,version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties,trashed:!!f.trashed,owners:[{emailAddress:f.owner}]});
function parts(ct,body){const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));}
const drive=who=>async route=>{const req=route.request(),u=new URL(req.url()),m=req.method();
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/oauth2/v3/userinfo')return json({email:who});
  if(u.pathname.indexOf('/__picked/')===0){(D.picked[who]=D.picked[who]||new Set()).add(u.pathname.split('/').pop());return json({});}
  let mm=/^\/drive\/v3\/files\/([^/]+)\/permissions(?:\/([^/]+))?$/.exec(u.pathname);
  if(mm){const f=D.files.get(mm[1]);if(!f||f.owner!==who)return json({error:{code:404,message:'File not found'}},404);
    if(m==='POST'){const b=JSON.parse(req.postData()||'{}');D.n++;const p={id:'p'+D.n,email:b.emailAddress,role:b.role};f.perms=(f.perms||[]).concat([p]);return json({id:p.id});}
    if(m==='DELETE'){f.perms=(f.perms||[]).filter(p=>p.id!==mm[2]);return route.fulfill({status:204,body:''});}}
  mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
  if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>f.owner===who&&evalQ(q,f)).map(pick)});}
  if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,owner:who,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
  if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f||!can(f,who))return json({error:{code:404,message:'File not found'}},404);
    if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
  if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f||!can(f,who,true))return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta)f.trashed=meta.trashed;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.version++;return json(pick(f));}
  mm=/^\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(u.pathname);
  if(mm){const raw=req.postData()||'';const [metaS,content]=parts(req.headers()['content-type'],raw);const meta=JSON.parse(metaS);D.n++;
    if(m==='POST'){const id='f'+D.n;const f=Object.assign({id,owner:who,version:1,modifiedTime:now(),trashed:false},meta,{content});D.files.set(id,f);return json(pick(f));}
    const f=D.files.get(mm[1]);if(!f||!can(f,who,true))return json({error:{code:404,message:'File not found'}},404);
    if(meta.name)f.name=meta.name;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.content=content;f.version++;f.modifiedTime=now();return json(pick(f));}
  return json({error:{code:400,message:'not simulated: '+m+' '+u.pathname}},400);};
const cases=who=>[...D.files.values()].filter(f=>f.owner===who&&f.appProperties&&f.appProperties.nbh==='case'&&!f.trashed);
async function device(br,who,ua){const ctx=await br.newContext({viewport:{width:1280,height:900},userAgent:ua,serviceWorkers:'block',acceptDownloads:true});
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.__pickId='';
    const P={Action:{PICKED:'picked',CANCEL:'cancel'},ViewId:{DOCS:'docs'}};
    P.DocsView=function(){return {setOwnedByMe(){return this;},setMimeTypes(){return this;},setIncludeFolders(){return this;}};};
    P.PickerBuilder=function(){let cb=null;const b={addView(){return b;},setOAuthToken(){return b;},setDeveloperKey(k){window.__pickKey=k;return b;},setAppId(a){window.__pickApp=a;return b;},setTitle(){return b;},setCallback(f){cb=f;return b;},
      build(){return {setVisible(){const id=window.__pickId;setTimeout(async()=>{if(!id){cb({action:'cancel'});return;}await fetch('https://www.googleapis.com/__picked/'+id);cb({action:'picked',docs:[{id}]});},20);}};}};return b;};
    window.google={picker:P,accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-drive-token-'+window.__gsAsk,expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');localStorage.setItem('nbh.google.apikey','simulated-picker-key');}catch(e){}});
  await ctx.route('https://www.googleapis.com/**',drive(who));await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await ctx.route('https://apis.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(WS);await sleep(1300);
  await page.evaluate(async()=>{window.__asked=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.alert=async t=>{window.__asked.push(String(t));};window.alert=t=>{window.__asked.push(String(t));};});
  await page.evaluate(()=>caseloadOpen());await sleep(400);await page.evaluate(()=>document.getElementById('drvLink').click());await sleep(1200);await idle(page);await page.evaluate(()=>document.getElementById('dlg').close());
  return {ctx,page,errs};}
const setBar=(page,v)=>page.evaluate(v=>{const set=(s,x)=>{const e=document.querySelector(s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient',v.client);set('#pSid',v.sid||'');},v);
async function openDM(page){await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(1200);return page.frames().find(f=>/DM-1_Student/.test(f.url()));}
const setField=(fr,name,v)=>fr.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
const getField=(fr,name)=>fr.evaluate(n=>document.querySelector('[name="'+n+'"]').value,name);
const idle=page=>page.waitForFunction(()=>!DRV.busy,null,{timeout:30000}).then(()=>sleep(300));
const save=async page=>{await page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(page);};
const sync=async(page,inter)=>{await idle(page);await page.evaluate(i=>drvSync({interactive:!!i}),!!inter);await sleep(800);await idle(page);};
const local=(page,key)=>page.evaluate(async k=>{const r=(await clList()||[]).find(x=>x.key===k);return r?{text:r.text,drv:r.drv}:null;},key);
const rv=page=>page.evaluate(()=>({open:document.getElementById('dlg').open,t:document.getElementById('dlgTitle').textContent,b:document.getElementById('dlgBody').textContent,n:document.querySelectorAll('#dlgBody .sh-c').length}));
(async()=>{const br=await chromium.launch();
  try{
  const A=await device(br,BCBA,'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');
  const B=await device(br,COL,'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15');
  const ST={client:'Mateo Rivera',sid:'4471823'};
  await setBar(A.page,ST);const a1=await openDM(A.page);await setField(a1,'s.living','Lives with his mother (simulated, BCBA).');await sleep(600);await save(A.page);await sync(A.page);
  const key=await A.page.evaluate(st=>clKey(st),ST),file=cases(BCBA)[0];
  ok('1 the BCBA\'s case is in their Drive',!!file&&/Lives with his mother/.test(file.content),cases(BCBA).length);
  /* 2 Share in Drive */
  await A.page.evaluate(()=>shOpen());await A.page.waitForSelector('#shDrvGo',{timeout:10000});
  const box=await A.page.evaluate(()=>document.getElementById('shDrv').textContent);
  await A.page.fill('#shDrvMail',COL);await A.page.click('#shDrvGo');await sleep(1500);
  const sh=await A.page.evaluate(async()=>(await shAll()).filter(r=>r.kind==='drive').map(r=>({role:r.role,with:(r.with||[]).map(x=>x.email)})));
  ok('2 Share for editing offers Through Google Drive; Share in Drive gives the colleague\'s account that file (writer), no email from Google, kept as a share here',
    /Through Google Drive/.test(box)&&(file.perms||[]).length===1&&file.perms[0].email===COL&&file.perms[0].role==='writer'&&sh.length===1&&sh[0].role==='owner'&&sh[0].with[0]===COL,{box:box.slice(0,120),perms:file.perms,sh});
  const said=await A.page.evaluate(()=>window.__asked.slice(-1)[0]||'');
  ok('3 the BCBA is told where the colleague opens it',/shared with dana\.whitfield@example\.org in your Google Drive/.test(said)&&/Open a case shared with me/.test(said),said);
  /* 4 the colleague opens it */
  await B.page.evaluate(id=>{window.__pickId=id;},file.id);await B.page.evaluate(()=>drvShOpen());await sleep(2500);
  await B.page.waitForFunction(()=>!!state.status['DM-1']||!!state.pending['DM-1'],null,{timeout:30000}).catch(()=>{});await sleep(1200);
  const b4=await B.page.evaluate(async()=>({client:packet().client,ids:caseIds(),sh:(await shAll()).filter(r=>r.kind==='drive').map(r=>({role:r.role,owner:r.owner})),key:window.__pickKey,app:window.__pickApp}));
  ok('4 the colleague: Open a case shared with me (Google\'s window with the API key and the project), the case opens, kept as shared by the BCBA',b4.client==='Mateo Rivera'&&b4.ids.includes('DM-1')&&b4.sh.length===1&&b4.sh[0].role==='helper'&&b4.sh[0].owner===BCBA&&b4.key==='simulated-picker-key'&&b4.app==='123',b4);
  /* 5 the colleague works and saves: to the BCBA's file, no copy of their own */
  const b1=await openDM(B.page);await setField(b1,'s.court','No court involvement (simulated, colleague).');await sleep(600);await save(B.page);await sync(B.page);
  ok('5 the colleague\'s Save case goes to the BCBA\'s file, marked as theirs, and their own Drive holds no copy',/No court involvement \(simulated, colleague\)/.test(file.content)&&JSON.parse(file.content).rec.by===COL&&cases(COL).length===0,{by:JSON.parse(file.content).rec.by,own:cases(COL).length});
  /* 6 meanwhile the BCBA changed another answer: put together, nothing asked */
  await setField(a1,'s.living','Lives with his mother and grandmother (simulated, BCBA).');await sleep(600);await save(A.page);await sync(A.page);
  const c6=JSON.parse(file.content).text;
  ok('6 the BCBA saves another answer: the two copies are put together, both answers in the one file, nothing asked',/mother and grandmother/.test(c6)&&/No court involvement \(simulated, colleague\)/.test(c6),{c:c6.length});
  /* 7 the colleague's next sync brings it */
  await sync(B.page);const l7=await local(B.page,key);
  ok('7 the colleague\'s next sync brings the case as put together',/mother and grandmother/.test(l7.text)&&/No court involvement/.test(l7.text)&&!l7.drv.dirty,{dirty:l7&&l7.drv.dirty});
  /* 8 both change the same answer: the second to sync is asked, naming the person */
  await B.page.evaluate(()=>document.getElementById('drvBarOpen')&&!document.getElementById('drvBar').hidden&&document.getElementById('drvBarOpen').click());await sleep(2500);
  const b2=await openDM(B.page);await setField(b2,'s.court','Court date pending (simulated, colleague).');await sleep(600);await save(B.page);await sync(B.page);
  await setField(a1,'s.court','No court involvement, confirmed (simulated, BCBA).');await sleep(600);
  await A.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await A.page.evaluate(()=>drvSync({interactive:true}));
  await A.page.waitForSelector('#shGo',{timeout:20000}).catch(()=>{});const q=await rv(A.page);
  ok('8 the BCBA\'s sync finds the answer both changed: Changes from the colleague\'s account, side by side',q.open&&/^Changes from dana\.whitfield@example\.org$/.test(q.t)&&q.n===1&&/Yours: No court involvement, confirmed/.test(q.b)&&/Dana\.whitfield@example\.org’s: Court date pending/i.test(q.b),q);
  await A.page.evaluate(()=>{document.querySelector('.sh-c input[value="theirs"]').checked=true;document.getElementById('shGo').click();});await sleep(1500);await idle(A.page);
  ok('9 theirs chosen: the one file holds the colleague\'s answer and the BCBA\'s earlier one',/Court date pending/.test(JSON.parse(file.content).text)&&/mother and grandmother/.test(JSON.parse(file.content).text));
  /* 10 stop sharing */
  await A.page.evaluate(()=>shOpen());await A.page.waitForSelector('[data-shstop]',{timeout:10000});await A.page.click('[data-shstop]');await sleep(1500);
  ok('10 Stop sharing takes the colleague off the file',(file.perms||[]).length===0,file.perms);
  await setField(b2,'s.court','Court date set (simulated, colleague, after).');await sleep(600);await save(B.page);await sync(B.page);
  const b10=await B.page.evaluate(async k=>({toasts:[...document.querySelectorAll('#wsToasts .ws-toast')].map(t=>t.textContent).join(' | '),lost:(await shAll()).filter(r=>r.kind==='drive').map(r=>!!r.lost),here:!!(await clList()||[]).find(x=>x.key===k)}),key);
  ok('11 the colleague is told once that it is no longer shared; their copy stays; nothing goes to their own Drive',/no longer shared with you by jordan\.ellis@example\.org/.test(b10.toasts)&&b10.lost[0]===true&&b10.here&&cases(COL).length===0,b10);
  /* 12 their Remove: off their device only */
  await B.page.evaluate(()=>clearCase());await sleep(800);await B.page.evaluate(()=>caseloadOpen());await sleep(800);
  await B.page.evaluate(async()=>{await shPut(Object.assign((await shAll()).find(r=>r.kind==='drive'),{lost:''}));});   /* as before the stop, to see Remove leave the BCBA's file alone */
  await B.page.evaluate(k=>{const b=document.querySelector('[data-cldel="'+k+'"]');if(b)b.click();},key);await sleep(1500);
  const b12=await B.page.evaluate(async k=>({here:!!(await clList()||[]).find(x=>x.key===k),asked:window.__asked.filter(t=>/^Take Mateo/.test(t)).length,gone:drvGone().length}),key);
  ok('12 the colleague\'s Remove takes the case off their device only: the BCBA\'s file is untouched, no removal marker',!b12.here&&b12.asked===1&&b12.gone===0&&!file.trashed&&cases(BCBA).length===1,b12);
  /* 13 where it is said */
  const h=await A.page.evaluate(()=>({where:dataWhere(),cmd:CMDS.some(c=>/^Open a case shared with me/.test(c.n))}));
  ok('13 the data-where row and the command',/Share in Drive/.test(h.where)&&/that one file/.test(h.where)&&h.cmd,{cmd:h.cmd});
  ok('14 no page errors',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
