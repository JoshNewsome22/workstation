/* v22.47 Google Drive, seen from the workstation (review I253, I257). What Drive holds lists, from Drive itself, every
   student's case file (where and when last saved, and whether this device has them), the Replaced copies (when each goes
   to the trash), the removal markers and the staff directory; a replaced copy is opened or put in the trash; how long
   replaced copies are kept is chosen (and the daily tidy follows it); a student is removed everywhere from it. Sync
   activity lists what each sync sent, brought (and from which device), removed and replaced, by initials only. Google is
   simulated as in qa/v2189-drive-test.js. Simulated students only.  usage: node qa/v2247-test.js */
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
  const ap=[...q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)],hit=m=>(f.appProperties||{})[m[1]]===m[2];if(ap.length&&!(/\) or appProperties|\} or appProperties/.test(q)?ap.some(hit):ap.every(hit)))return false;return true;}
const pick=f=>({id:f.id,name:f.name,mimeType:f.mimeType,size:String((f.content||'').length),version:String(f.version),modifiedTime:f.modifiedTime,appProperties:f.appProperties});
function parts(ct,body){const b=/boundary=([^;]+)/.exec(ct)[1];return body.split('--'+b).slice(1,-1).map(p=>p.replace(/^\r\n/,'').split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,''));}
async function drive(route){const req=route.request(),u=new URL(req.url()),m=req.method();D.calls++;
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/oauth2/v3/userinfo')return json({email:D.who});
  if(D.off)return json({error:{code:403,message:'Google Drive API has not been used in project 123 before or it is disabled.',errors:[{reason:'accessNotConfigured'}]}},403);
  let mm=/^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
  if(u.pathname==='/drive/v3/files'&&m==='GET'){const q=u.searchParams.get('q')||'';return json({files:[...D.files.values()].filter(f=>evalQ(q,f)).map(pick)});}
  if(u.pathname==='/drive/v3/files'&&m==='POST'){const meta=JSON.parse(req.postData()||'{}');D.n++;const id='f'+D.n;D.files.set(id,Object.assign({id,version:1,modifiedTime:now(),trashed:false,content:''},meta));return json({id});}
  if(mm&&m==='GET'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404,message:'File not found'}},404);
    if(u.searchParams.get('alt')==='media'&&D.slow)await new Promise(r=>setTimeout(r,D.slow));   /* v22.06 a slow Drive, for the race in 33 */
    if(u.searchParams.get('alt')==='media')return route.fulfill({status:200,contentType:'application/json',body:f.content});return json(pick(f));}
  if(mm&&m==='PATCH'){const f=D.files.get(mm[1]);if(!f)return json({error:{code:404}},404);const meta=JSON.parse(req.postData()||'{}');if('trashed' in meta)f.trashed=meta.trashed;if(meta.appProperties)f.appProperties=Object.assign({},f.appProperties,meta.appProperties);f.version++;D.n++;f.modifiedTime=now();return json({id:f.id});}
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
    ['nbh.drive.on@nbh','nbh.drive.acct@nbh','nbh.drive.skip@nbh','nbh.drive.gone@nbh','nbh.drive.dev@nbh','nbh.drive.log@nbh','nbh.drive.keep@nbh','nbh.drive.tidy@nbh'].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem('nbh.google.drive@nbh');});
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
const dlgText=page=>page.evaluate(()=>document.getElementById('dlgBody').textContent);
(async()=>{const br=await chromium.launch();let A=null,B=null;
  try{
  A=await device(br,UA_IPAD,true);B=await device(br,UA_MAC,false);
  await A.page.evaluate(()=>caseloadOpen());await sleep(400);await A.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await idle(A.page);
  await setBar(A.page,{client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School'});
  const a1=await openDM(A.page);await setField(a1,'s.living','Lives with mother and grandmother (simulated).');await sleep(600);
  await A.page.evaluate(()=>document.getElementById('saveCase').click());await sleep(2500);await idle(A.page);
  /* a second student, Ana Rivera, kept here and waiting for Drive */
  await A.page.evaluate(async()=>{const m=(await clList()).find(r=>r.client==='Mateo Rivera');const t=m.text.split('Mateo Rivera').join('Ana Rivera').split('4471823').join('4471824');
    const r=Object.assign({},m,{key:clKey({client:'Ana Rivera',sid:'4471824'}),client:'Ana Rivera',sid:'4471824',text:t,drv:{id:'',ver:null,dirty:true}});await clTx('readwrite',st=>st.put(r));await drvSync({});});
  await idle(A.page);
  const log1=await A.page.evaluate(()=>drvLog());
  ok('1 Sync activity keeps what each sync sent, by initials only (no full name kept on the device)',log1.length>=2&&log1.some(e=>e.up.includes('M.R.'))&&log1.some(e=>e.up.includes('A.R.'))&&!/Mateo|Rivera|4471823/.test(JSON.stringify(log1)),log1);
  /* two replaced copies of Mateo: one 3 days old, one 10 days old; and the iPad's own case text in them */
  const mk=await A.page.evaluate(async()=>{const of=await drvOldFolder();const m=(await clList()).find(r=>r.client==='Mateo Rivera');return {of,k:await drvHash(drvKey(m)),body:drvBody(Object.assign({},m,{text:m.text.split('grandmother').join('grandmother and an aunt')}))};});
  const ago=d=>new Date(Date.now()-d*864e5).toISOString();
  [[3,'f-old3'],[10,'f-old10']].forEach(([d,id])=>D.files.set(id,{id,name:'Mateo Rivera - not kept, from the Mac - '+ago(d).slice(0,16).replace('T',' ')+'.json',mimeType:'application/json',parents:[mk.of],appProperties:{nbh:'old',k:mk.k},version:1,modifiedTime:ago(d),trashed:false,content:mk.body}));
  await A.page.evaluate(()=>document.getElementById('drvHolds').click());await sleep(1200);
  const h1=await dlgText(A.page);
  ok('2 What Drive holds: both students’ case files, saved on this iPad, both here',/Students’ case files \(2\)/.test(h1)&&/Mateo Rivera \(4471823\)/.test(h1)&&/Ana Rivera \(4471824\)/.test(h1)&&/on this iPad\s*Yes/.test(h1),h1.slice(0,600));
  ok('3 the replaced copies, with when each goes to the trash (30 days unless chosen), and the other files',/Replaced copies \(2\)/.test(h1)&&/in 27 days/.test(h1)&&/in 20 days/.test(h1)&&/Removal markers: 0/.test(h1)&&/Staff directory: no/.test(h1)&&/empties it after 30 days/.test(h1),h1.slice(400,1600));
  if(process.env.SHOT)await A.page.screenshot({path:process.env.SHOT+'/drive-holds.png'});
  await A.page.evaluate(()=>{const s=document.getElementById('dhKeep');s.value='7';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const h2=await dlgText(A.page),keep=await A.page.evaluate(()=>drvKeepDays());
  ok('4 keep replaced copies 7 days: saved, and the list says when each now goes',keep===7&&/in 4 days/.test(h2)&&/at the next daily check/.test(h2),{keep,h:h2.slice(500,1400)});
  await A.page.evaluate(()=>{localStorage.removeItem('nbh.drive.tidy@nbh');try{kvDel('nbh.drive.tidy@nbh');}catch(e){}return drvSync({});});await idle(A.page);
  ok('5 the daily tidy follows the choice: the copy older than 7 days goes to the trash, the newer one stays',D.files.get('f-old10').trashed===true&&D.files.get('f-old3').trashed===false);
  await A.page.evaluate(()=>document.getElementById('dhAgain').click());await sleep(1000);
  await A.page.evaluate(()=>document.querySelector('[data-dh-open="f-old3"]').click());await sleep(2500);
  const op=await A.page.evaluate(()=>({client:document.getElementById('pClient').value,open:document.getElementById('dlg').open,aunt:/and an aunt/.test(JSON.stringify(packet()))}));
  const dmA=await openDM(A.page);const lv=await getField(dmA,'s.living');
  ok('6 Open a replaced copy: the copy’s case opens on screen',op.client==='Mateo Rivera'&&!op.open&&/and an aunt/.test(lv),{op,lv});
  await A.page.evaluate(async()=>{state.lastSig=caseSig();await caseloadOpen();document.getElementById('drvHolds').click();});await sleep(1500);
  await A.page.evaluate(()=>document.querySelector('[data-dh-trash="f-old3"]').click());await sleep(800);
  const h3=await dlgText(A.page);
  ok('7 Trash puts a replaced copy in Drive’s trash and takes it off the list',D.files.get('f-old3').trashed===true&&/Replaced copies \(0\)/.test(h3),h3.slice(300,900));
  const anaId=cases().find(f=>/Ana Rivera/.test(f.name)).id;
  await A.page.evaluate(id=>document.querySelector('[data-dh-rm="'+id+'"]').click(),anaId);await sleep(1500);await idle(A.page);await sleep(800);
  const h4=await dlgText(A.page),here=await A.page.evaluate(async()=>(await clList()||[]).map(r=>r.client));
  ok('8 Remove everywhere from What Drive holds: Ana’s case file in the trash, a removal marker in its place, and Ana gone from this iPad',D.files.get(anaId).trashed===true&&!here.includes('Ana Rivera')&&here.includes('Mateo Rivera')&&/Students’ case files \(1\)/.test(h4)&&/Removal markers: 1/.test(h4),{here,h:h4.slice(0,500)});
  /* the laptop joins: it gets Mateo, saved on the iPad, and not Ana */
  await B.page.evaluate(()=>caseloadOpen());await sleep(400);await B.page.evaluate(()=>document.getElementById('drvLink').click());await sleep(900);await idle(B.page);
  const b1=await B.page.evaluate(async()=>({who:(await clList()||[]).map(r=>r.client),log:drvLog()}));
  ok('9 the laptop’s Sync activity: M.R. brought here, saved on the iPad; Ana not brought back',b1.who.length===1&&b1.who[0]==='Mateo Rivera'&&b1.log.some(e=>e.got.some(x=>x.who==='M.R.'&&x.dev==='iPad')),b1);
  await B.page.evaluate(()=>{const res={up:[],from:[],goneW:[]};DRV.kept=[{who:'M.R.',why:'not kept, from this Mac'}];drvLogAdd(res,'');DRV.kept=[];document.getElementById('drvAct').click();});await sleep(500);
  const act=await dlgText(B.page);
  if(process.env.SHOT)await B.page.screenshot({path:process.env.SHOT+'/drive-activity.png'});
  ok('10 the Sync activity dialog: when, brought here (from which device), to Replaced copies, initials only',/Brought here: M\.R\. \(saved on the iPad\)/.test(act)&&/To Replaced copies: M\.R\. \(not kept, from this Mac\)/.test(act)&&/initials only/.test(act)&&!/Mateo/.test(act),act.slice(0,700));
  const quiet=await B.page.evaluate(async()=>{const n=drvLog().length;await drvSync({});return [n,drvLog().length];});
  ok('11 a sync that changes nothing adds no line',quiet[0]===quiet[1],quiet);
  ok('12 no script errors',A.errs.length===0&&B.errs.length===0,{A:A.errs,B:B.errs});
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
