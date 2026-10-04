/* The offline copy and the installed app (v21.43), in Chromium, against a copy of both editions served by a small
   server that answers like the website's Apache (ETag and Last-Modified on every file, 304 to If-None-Match and
   If-Modified-Since, no-cache on html and js), so files can be changed while the pages are open:
     A  manifest.json parses (and Chromium reads it without an error), its icons are PNGs of the sizes it names, the
        maskable one is there, the touch icon is 180 x 180 and opaque, the head carries the iPad's tags; the school
        edition has a manifest and icons of its own
     B  the first visit registers sw.js, the chip counts the files (n of N) and ends at Saved for offline use, the set
        holds every listed file byte for byte, the shell asked for persistent storage
     C  with the network off the shell and every one of the 44 forms open, the picture library loads, a form is filled
        and saved (and the case too), an unsaved page gets the offline page; nothing saved is asked of the network
     D  the writing help's relay (/ai, outside the folder: GET and POST), another website, a POST and a HEAD inside the
        folder are not answered by the worker; a saved file is (the control); offline, the relay is not served
     E  a changed file is found by Check, staged, announced (Update ready, the strip); a reload during the check and
        everything before Reload (a form opened then, a script, a new tab) get the set in use; with unsaved work the
        strip says to save first and Reload asks; after Reload the new files are in use and the old set is gone; a start
        with no window open takes a ready update by itself
     F  checks ask with If-None-Match and get 304s; with ETags that never match (Apache's -gzip) the same bytes are
        not taken for a change and the next check asks with If-Modified-Since
     G  a changed sw.js installs beside the one in use (unchanged files copied after 304s, none downloaded), waits,
        takes over on Reload and deletes the old caches
     H  Reset deletes the copy, forgets the worker and loads the page from the website; a fresh copy follows
     I  the school edition keeps its own copy beside the practice's, and resetting one leaves the other
     J  nothing is registered from a drive (file://) or in the one-file edition (served or from a drive), which carries
        no manifest link and still opens its forms
     K  installed on an iPad (simulated: standalone, an iPad's user agent, share and canShare stubs): Save data and
        Save case go to the share sheet as files; too long after the tap a notice asks for one more tap; a closed sheet
        says Not saved and the case's unsaved dot comes back; in a browser tab nothing is wrapped and files download
     L  the install tip on an iPad in Safari, once, and not when installed
     M  a device without room: the chip says so, nothing half saved is left, the workstation works online
     N  a first save cut off half way (the network gone) says so, serves nothing from the half set, and carries on
        later without fetching again what it had saved
   usage: node qa/pwa-test.js        (PWA_ONLY=A,B,C runs those parts only; B always runs when another part needs it) */
const {chromium,fs,path,ROOT,sleep,forms,loadSim}=require(__dirname+'/lib.js');
const http=require('http'),crypto=require('crypto'),cp=require('child_process'),zlib=require('zlib');
const OUT=path.join(__dirname,'out','pwa');fs.mkdirSync(OUT,{recursive:true});
const ONLY=(process.env.PWA_ONLY||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
const want=k=>!ONLY.length||ONLY.includes(k);
let fails=0,passes=0;
const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail!==undefined&&detail!==''?' ('+String(detail).slice(0,500)+')':''));if(ok)passes++;else fails++;};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SITE=path.join(OUT,'site');

/* ---------------------------------------------------------------- an Apache-like server for the copies */
function makeServer(mounts){
  const st={offline:false,delay:{},etagBug:false,noValidators:false,auth:false,log:[]};
  const TYPES={html:'text/html; charset=utf-8',js:'application/javascript',json:'application/json',png:'image/png',webp:'image/webp',txt:'text/plain; charset=utf-8',md:'text/plain; charset=utf-8'};
  const srv=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://h');
    const e={t:Date.now(),method:req.method,path:u.pathname,inm:req.headers['if-none-match']||'',ims:req.headers['if-modified-since']||'',status:0};
    st.log.push(e);
    if(st.offline){e.status=-1;req.socket.destroy();return;}
    const done=(code,h,body)=>{e.status=code;res.writeHead(code,h);res.end(body);};
    if(u.pathname==='/ai'||u.pathname.indexOf('/ai/')===0){let b='';req.on('data',c=>b+=c);req.on('end',()=>done(200,{'Content-Type':'application/json'},JSON.stringify({relay:true,method:req.method})));return;}
    const m=Object.keys(mounts).find(k=>u.pathname.indexOf(k)===0);
    if(!m){if(Object.keys(mounts).includes(u.pathname+'/')){done(301,{Location:u.pathname+'/'},'');return;}done(404,{'Content-Type':'text/plain'},'not found');return;}
    if(st.auth&&!req.headers.authorization){done(401,{'WWW-Authenticate':'Basic realm="workstation"','Content-Type':'text/plain'},'sign in');return;}
    let rel;try{rel=decodeURIComponent(u.pathname.slice(m.length));}catch(x){done(400,{},'');return;}
    if(rel===''||rel.endsWith('/'))rel+='index.html';
    const file=path.join(mounts[m],rel);
    if(file.indexOf(mounts[m])!==0){done(403,{},'');return;}
    fs.stat(file,(err,s)=>{
      if(err||!s.isFile()){done(404,{'Content-Type':'text/plain'},'not found');return;}
      const ext=((/\.([a-z0-9]+)$/i.exec(rel)||[])[1]||'').toLowerCase();
      const etag='"'+s.size.toString(16)+'-'+Math.round(s.mtimeMs*1000).toString(16)+(st.etagBug?'-gzip':'')+'"';
      const sec=Math.floor(s.mtimeMs/1000)*1000;
      const h={'Content-Type':TYPES[ext]||'application/octet-stream','Last-Modified':new Date(sec).toUTCString(),'ETag':etag,
        'Cache-Control':/^(html|js)$/.test(ext)?'no-cache, must-revalidate':'max-age=0'};
      const inm=req.headers['if-none-match'],ims=req.headers['if-modified-since'];
      if(st.noValidators){delete h['ETag'];delete h['Last-Modified'];}
      let same=false;
      if(st.noValidators)same=false;
      else if(inm)same=!st.etagBug&&inm.split(',').map(x=>x.trim()).includes(etag);
      else if(ims){const t=Date.parse(ims);same=!isNaN(t)&&sec<=t;}
      const send=()=>{
        if(st.offline){e.status=-1;req.socket.destroy();return;}
        if(same){e.status=304;res.writeHead(304,h);res.end();return;}
        e.status=200;res.writeHead(200,h);
        if(req.method==='HEAD'){res.end();return;}
        fs.createReadStream(file).pipe(res);
      };
      const d=st.delay[rel];if(d)setTimeout(send,d);else send();
    });
  });
  return {srv,st,listen:()=>new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv.address().port))),close:()=>new Promise(r=>srv.close(()=>r()))};
}
/* another website, for the cross-origin request */
function makeOther(){
  const log=[];
  const srv=http.createServer((req,res)=>{log.push(req.url);res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end('{"other":true}');});
  return {srv,log,listen:()=>new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv.address().port)))};
}
let tick=Math.floor(Date.now()/1000)+30;
function edit(rel,fn){
  const p=path.join(SITE,rel),s=fs.readFileSync(p,'utf8'),o=fn(s);
  if(o===s)throw new Error('the edit changed nothing in '+rel);
  fs.writeFileSync(p,o);tick+=5;fs.utimesSync(p,tick,tick);
}

/* ---------------------------------------------------------------- shell helpers */
const chip=page=>page.evaluate(()=>{const c=document.querySelector('#offChip');return c&&!c.hidden?c.textContent:'';}).catch(()=>'');
async function waitChip(page,re,ms){const t0=Date.now();let last='';while(Date.now()-t0<(ms||60000)){last=await chip(page);if(re.test(last))return last;await sleep(100);}return 'TIMEOUT after "'+last+'"';}
const status=page=>page.evaluate(()=>PWA.ask('status',null,15000).then(d=>d&&d.status));
const names=(page,scope)=>page.evaluate(s=>caches.keys().then(k=>k.filter(n=>n.indexOf('nbh-offline:'+s+':')===0)),scope);
function wire(page,log){
  page.on('dialog',d=>d.accept().catch(()=>{}));
  page.on('pageerror',e=>log.push(String(e.message||e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR_|status of 404|status of 503/.test(m.text()))log.push('console: '+m.text().slice(0,300));});
}
async function openIn(page,id){
  await page.evaluate(i=>openForm(i),id);
  return page.waitForFunction(i=>!!state.status[i],id,{timeout:25000}).then(()=>true).catch(()=>false);
}
async function closeCur(page){
  await page.evaluate(()=>$('#closeForm').click());await sleep(120);
  await page.evaluate(()=>{const b=document.querySelector('#cfFoot button.danger');if(b)b.click();});await sleep(120);
}
const frameOf=(page,file)=>page.frames().find(x=>x.url().indexOf(file)>=0);
/* fill the first visible text field of a form with a value and press its Save data */
async function fillAndSave(target,value){
  return target.evaluate(v=>{
    const el=Array.from(document.querySelectorAll('textarea,input[type="text"],input:not([type])')).find(e=>e.offsetParent!==null&&!e.readOnly&&!e.disabled);
    if(!el)return 'no field';
    el.focus();el.value=v;['input','change'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true})));
    const b=document.querySelector('#saveBtn,#btnSave,#dl-json')||Array.from(document.querySelectorAll('button')).find(x=>/^\s*save data\s*$/i.test(x.textContent));
    if(!b)return 'no save button';
    b.click();return 'ok';
  },value);
}
/* type into the first n visible text fields of a form, so the case holds work */
async function fillSome(target,n,word){
  return target.evaluate(([n,w])=>{let k=0;for(const el of document.querySelectorAll('textarea,input[type="text"],input:not([type])')){
    if(k>=n)break;if(el.offsetParent===null||el.readOnly||el.disabled)continue;el.value=w+' '+(++k);['input','change'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true})));}return k;},[n,word]);
}
async function confirmDlg(page,ok){
  await page.waitForFunction(()=>document.querySelector('#cfDlg')&&document.querySelector('#cfDlg').open,null,{timeout:5000}).catch(()=>{});
  const t=await page.evaluate(()=>document.querySelector('#cfTitle').textContent+' / '+document.querySelector('#cfBody').textContent);
  await page.evaluate(k=>{const bs=Array.from(document.querySelectorAll('#cfFoot button'));(k?bs[bs.length-1]:bs[0]).click();},ok);
  return t;
}
const swFiles=()=>{const s=fs.readFileSync(path.join(ROOT,'NBH-Workstation','sw.js'),'utf8');const m=/const FILES = \[([\s\S]*?)\];/.exec(s);return m[1].match(/'([^']+)'/g).map(x=>x.slice(1,-1));};
const pngInfo=b=>({png:b.slice(0,8).toString('hex')==='89504e470d0a1a0a',w:b.readUInt32BE(16),h:b.readUInt32BE(20),colorType:b[25]});

(async()=>{
  /* the site: copies of both editions, and a one-file edition built from this tree */
  fs.rmSync(SITE,{recursive:true,force:true});
  fs.cpSync(path.join(ROOT,'NBH-Workstation'),path.join(SITE,'workstation'),{recursive:true});
  fs.cpSync(path.join(ROOT,'RPS-Workstation'),path.join(SITE,'workstation-rps'),{recursive:true});
  fs.mkdirSync(path.join(SITE,'one'),{recursive:true});
  cp.execFileSync('python3',[path.join(ROOT,'tools','build-single.py'),path.join(ROOT,'NBH-Workstation'),path.join(SITE,'one','NBH-Workstation.html')]);
  const S=makeServer({'/workstation/':path.join(SITE,'workstation'),'/workstation-rps/':path.join(SITE,'workstation-rps'),'/one/':path.join(SITE,'one')});
  const port=await S.listen(),ORIGIN='http://127.0.0.1:'+port,NBH=ORIGIN+'/workstation/',RPS=ORIGIN+'/workstation-rps/';
  const O=makeOther(),XO='http://127.0.0.1:'+(await O.listen());
  const FILES=swFiles();
  const br=await chromium.launch();
  const errs=[];

  /* ================= A: manifest and icons ================= */
  if(want('A')){
    const nbhIcons={};
    for(const [ed,dir,org,short] of [['NBH','NBH-Workstation','Newsome Behavioral Health','NBH Workstation'],['RPS','RPS-Workstation','Royal Palm School','RPS Workstation']]){
      let man=null;try{man=JSON.parse(fs.readFileSync(path.join(ROOT,dir,'manifest.json'),'utf8'));}catch(e){}
      const idx=fs.readFileSync(path.join(ROOT,dir,'index.html'),'utf8');
      check(ed+' manifest.json parses, names the edition, opens ./ standalone',!!man&&man.name==='FBA and BIP Workstation · '+org&&man.short_name===short&&man.display==='standalone'&&man.start_url==='./'&&man.scope==='./'&&!('id' in man),man&&JSON.stringify({name:man.name,short:man.short_name,display:man.display,start:man.start_url,scope:man.scope}));
      const paper=(/--paper:(#[0-9a-fA-F]{6})/.exec(idx)||[])[1],head=(/header\.top\{background:(#[0-9a-fA-F]{3,6})/.exec(idx)||[])[1];
      check(ed+' manifest colours are the shell’s: theme the white heading, background the page',!!man&&man.theme_color==='#ffffff'&&head==='#fff'&&man.background_color===String(paper).toLowerCase(),man&&man.theme_color+' '+man.background_color+' / '+head+' '+paper);
      const icons=(man&&man.icons)||[],got=[];
      for(const ic of icons){
        const f=path.join(ROOT,dir,ic.src);const ok=fs.existsSync(f);const inf=ok?pngInfo(fs.readFileSync(f)):{};
        got.push(ic.src+' '+ic.sizes+' '+ic.purpose+' '+(ok?inf.w+'x'+inf.h:'missing'));
        check(ed+' icon '+ic.src+' is a PNG of the size it names ('+ic.sizes+')',ok&&inf.png&&ic.type==='image/png'&&ic.sizes===inf.w+'x'+inf.h);
        if(ed==='NBH')nbhIcons[ic.src]=ok?sha(fs.readFileSync(f)):'';
        else check(ed+' icon '+ic.src+' is the school’s, not the practice’s',ok&&nbhIcons[ic.src]&&sha(fs.readFileSync(f))!==nbhIcons[ic.src]);
      }
      check(ed+' icons: 192 and 512 for any purpose, and a maskable 512',icons.some(i=>i.sizes==='192x192'&&i.purpose==='any')&&icons.some(i=>i.sizes==='512x512'&&i.purpose==='any')&&icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'),got.join('; '));
      const tf=path.join(ROOT,dir,'apple-touch-icon.png'),ti=fs.existsSync(tf)?pngInfo(fs.readFileSync(tf)):{};
      check(ed+' apple-touch-icon.png is 180 x 180 and opaque (iOS fills a transparent one with black)',ti.png&&ti.w===180&&ti.h===180&&ti.colorType===2,JSON.stringify(ti));
      const tags=['<link rel="manifest" href="manifest.json">','<link rel="apple-touch-icon" href="apple-touch-icon.png">','<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-status-bar-style" content="default">','<meta name="theme-color" content="#ffffff">','<meta name="apple-mobile-web-app-title" content="'+short+'">'];
      const miss=tags.filter(t=>idx.indexOf(t)<0);
      check(ed+' index.html carries the manifest link and the iPad’s tags, the Home Screen name the manifest’s short name',!miss.length,miss.join(' '));
    }
    const ctx=await br.newContext();const p=await ctx.newPage();
    for(const [ed,url] of [['NBH',NBH],['RPS',RPS]]){
      await p.goto(url);await sleep(400);
      const c=await ctx.newCDPSession(p);
      const m=await c.send('Page.getAppManifest').catch(e=>({errors:[{message:String(e)}]}));
      check(ed+' Chromium reads the manifest without an error',!!m.url&&/manifest\.json$/.test(m.url)&&!(m.errors||[]).length,JSON.stringify(m.errors||[]));
      const ie=await c.send('Page.getInstallabilityErrors').catch(()=>null);
      check(ed+' Chromium finds nothing that stops it being installed',!!ie&&!(ie.installabilityErrors||[]).filter(x=>!/not-in-main-frame|in-incognito|already-installed|warn-not-offline-capable/.test(x.errorId)).length,ie?JSON.stringify(ie.installabilityErrors):'no answer');
    }
    await ctx.close();
  }

  /* ================= B: the first visit ================= */
  const ctx=await br.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
  await ctx.addInitScript(()=>{
    window.print=function(){};
    try{localStorage.setItem('nbh.ws.autosave.on','off');}catch(e){}
    try{const s=navigator.storage;if(s&&s.persist&&window===window.top){const o=s.persist.bind(s),q=s.persisted.bind(s);
      s.persist=()=>{window.__persistAsked=(window.__persistAsked||0)+1;return o();};
      s.persisted=()=>q().then(v=>{window.__persistedSeen=(window.__persistedSeen||0)+1;window.__persistedWas=v;return v;});}}catch(e){}
  });
  let page=await ctx.newPage();wire(page,errs);
  S.st.delay['TK-1_Token-Board-Book_v2026-10.html']=700;S.st.delay['nbh-pictos.js']=700;S.st.delay['PA-1_Preference-Assessment-Protocol_v2026-09.html']=700;
  await page.goto(NBH);
  const seen=new Set();let txt='';const t0=Date.now();
  while(Date.now()-t0<120000){txt=await chip(page);if(txt)seen.add(txt);if(txt==='Saved for offline use')break;await sleep(40);}
  S.st.delay={};
  if(txt!=='Saved for offline use')console.log('  debug B:',JSON.stringify(await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();
    return {ctl:!!navigator.serviceWorker.controller,active:r&&!!r.active,waiting:r&&!!r.waiting,installing:r&&!!r.installing,keys:await caches.keys(),st:await PWA.ask('status',null,5000).then(d=>d&&d.status)};})).slice(0,2000),
    JSON.stringify(S.st.log.filter(e=>e.status!==200&&e.status!==304).slice(0,10)));
  check('B first visit: the chip counts the files as they are saved (n of '+FILES.length+'), then says Saved for offline use',[...seen].some(t=>new RegExp('^Saving for offline use: \\d+ of '+FILES.length+'$').test(t))&&txt==='Saved for offline use',[...seen].slice(0,6).join(' | ')+' ... '+txt);
  let st=await status(page);
  check('B the worker controls the shell and the set in use holds every listed file ('+FILES.length+')',await page.evaluate(()=>!!navigator.serviceWorker.controller)&&st&&st.live&&st.files===FILES.length&&st.total===FILES.length&&!st.missing.length,st&&JSON.stringify({live:st.live,files:st.files,total:st.total,missing:st.missing}));
  let cn=await names(page,NBH);
  check('B the caches are this folder’s: the state cache and one set named with the worker’s version',cn.length===2&&cn.includes('nbh-offline:'+NBH+':state')&&cn.some(n=>/:v[0-9a-f]{12}:set:/.test(n)),cn.join(', '));
  const set1=cn.find(n=>n.indexOf(':set:')>0);
  const sums=await page.evaluate(async([c,base,files])=>{const cache=await caches.open(c);const out={};for(const f of files){const r=await cache.match(base+f);if(!r){out[f]=null;continue;}const d=await crypto.subtle.digest('SHA-256',await r.arrayBuffer());out[f]=Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');}return out;},[set1,NBH,FILES]);
  const bad=FILES.filter(f=>sums[f]!==sha(fs.readFileSync(path.join(SITE,'workstation',f))));
  check('B every saved copy is the file on the website, byte for byte',!bad.length,bad.join(', '));
  const F=forms('NBH-Workstation');
  const need=['index.html',...F.map(f=>f.file),'nbh-pictos.js','nbh-respond.js','respond.html','pdf-lib.min.js','nbh-pdf-tools.js','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png'];
  check('B the list is the shell, the 44 forms, the picture library, the respondent page and its library, the PDF tools, the manifest and the icons',need.every(f=>FILES.includes(f))&&FILES.every(f=>need.includes(f)),FILES.filter(f=>!need.includes(f)).concat(need.filter(f=>!FILES.includes(f))).join(', '));
  const pa=await page.evaluate(()=>({asked:window.__persistAsked||0,seen:window.__persistedSeen||0,was:window.__persistedWas}));
  check('B the shell asked the browser to keep the copy (navigator.storage.persist, unless it is kept already)',pa.asked>0||(pa.seen>0&&pa.was===true),JSON.stringify(pa));
  await page.evaluate(()=>$('#diag').click());await sleep(400);
  const dg=await page.evaluate(()=>{const r=Array.from(document.querySelectorAll('#dlgBody tr')).find(t=>/^Offline copy/.test(t.textContent));return r?r.textContent:'';});
  await page.evaluate(()=>$('#dlg').close());
  await page.evaluate(()=>$('#help').click());await sleep(300);
  const hp=await page.evaluate(()=>document.querySelector('#dlgBody').textContent);
  await page.evaluate(()=>$('#dlg').close());
  const pal=await page.evaluate(()=>CMDS.map(c=>c.n).filter(n=>/update|Offline copy/i.test(n)));
  check('B Diagnostics names the offline copy, Help explains it, the command box can check for updates',/Saved for offline use \u2014 55 files/.test(dg)&&/Offline, installing and updates/.test(hp)&&/Add to Home Screen/.test(hp)&&pal.length===2,dg.slice(0,120)+' | '+pal.join(', '));
  check('B in a browser tab nothing is wrapped for saving (createObjectURL and the link click are the browser’s own)',await page.evaluate(()=>window.nbhShareSave&&window.nbhShareSave.on===false&&/\[native code\]/.test(URL.createObjectURL.toString())&&/\[native code\]/.test(HTMLAnchorElement.prototype.click.toString())));

  /* ================= C: offline ================= */
  if(want('C')){
    S.st.offline=true;await ctx.setOffline(true);
    const mark=S.st.log.length;
    await page.reload();await sleep(900);
    check('C offline: the shell opens from the copy',await page.evaluate(()=>/Workstation/.test(document.title)&&document.querySelectorAll('#rail .item').length===44));
    check('C offline: the chip says Offline now',/^Offline now$/.test(await waitChip(page,/^Offline now$/,10000)),await chip(page));
    const notOpen=[],pic={};
    for(const f of F){
      if(!(await openIn(page,f.id)))notOpen.push(f.id);
      if(['SM-1','VS-1','TK-1'].includes(f.id)){const fr=frameOf(page,f.file);pic[f.id]=fr?await fr.evaluate(()=>window.NBH_PICTOS?Object.keys(window.NBH_PICTOS).length:0).catch(()=>0):0;}
      await closeCur(page);
    }
    check('C offline: every one of the 44 forms opens in the shell and answers',!notOpen.length,notOpen.join(', '));
    check('C offline: the picture library loads in SM-1, VS-1 and TK-1',Object.values(pic).length===3&&Object.values(pic).every(n=>n>100),JSON.stringify(pic));
    /* fill and save a form, then the case */
    await page.fill('#pClient','Offline Student');
    await openIn(page,'CF-1');const fr=frameOf(page,'CF-1_');
    const dl1=page.waitForEvent('download',{timeout:10000}).catch(()=>null);
    const r1=await fillAndSave(fr,'Offline note 4471');const d1=await dl1;
    let body1='';if(d1){const p1=await d1.path().catch(()=>null);if(p1)body1=fs.readFileSync(p1,'utf8');}
    check('C offline: a form is filled and its Save data writes the file',r1==='ok'&&!!d1&&/^CF-1_.*\.json$/.test(d1.suggestedFilename())&&body1.indexOf('Offline note 4471')>=0,r1+' '+(d1&&d1.suggestedFilename()));
    await sleep(4500);   /* the form's next status carries the change */
    const dl2=page.waitForEvent('download',{timeout:15000}).catch(()=>null);
    await page.evaluate(()=>$('#saveCase').click());const d2=await dl2;
    let body2='';if(d2){const p2=await d2.path().catch(()=>null);if(p2)body2=fs.readFileSync(p2,'utf8');}
    check('C offline: Save case writes the case file with the form in it',!!d2&&/^CASE_Offline_Student_.*\.json$/.test(d2.suggestedFilename())&&body2.indexOf('Offline note 4471')>=0,d2&&d2.suggestedFilename());
    await page.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d&&d.open)d.close();});
    await closeCur(page);
    const p2=await ctx.newPage();wire(p2,errs);
    await p2.goto(NBH+'README.txt').catch(()=>{});await sleep(300);
    check('C offline: a page in the folder that is not saved gets the offline page',await p2.evaluate(()=>/not saved on this device/.test(document.body.innerText)&&!!document.querySelector('a[href]')).catch(()=>false));
    await p2.close();
    const asked=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&FILES.includes(e.path.slice('/workstation/'.length)));
    check('C offline: none of the saved files was asked of the network',!asked.length,asked.map(e=>e.path).slice(0,8).join(', '));
    S.st.offline=false;await ctx.setOffline(false);
    await page.reload();await sleep(600);
  }

  /* ================= D: what the worker leaves alone ================= */
  if(want('D')){
    await waitChip(page,/^Saved for offline use$/,15000);
    const resp=[];const on=r=>resp.push({url:r.url(),sw:r.fromServiceWorker(),method:r.request().method(),status:r.status()});
    page.on('response',on);
    const got=await page.evaluate(async xo=>{const o={};const go=async(k,u,opt)=>{try{const r=await fetch(u,opt);o[k]=r.status;}catch(e){o[k]='error';}};
      await go('relayGet','/ai/health');await go('relayPost','/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"x"}'});
      await go('cross',xo+'/x.json');await go('postIn','./nothing-here',{method:'POST',body:'x'});await go('headIn','nbh-pictos.js',{method:'HEAD'});
      await go('saved','nbh-respond.js');return o;},XO);
    await sleep(300);page.off('response',on);
    const by=k=>resp.find(r=>k(r));
    const rg=by(r=>/\/ai\/health$/.test(r.url)),rp=by(r=>/\/ai$/.test(r.url)&&r.method==='POST'),xc=by(r=>r.url.indexOf(XO)===0),pi=by(r=>/nothing-here$/.test(r.url)),hd=by(r=>/nbh-pictos\.js$/.test(r.url)&&r.method==='HEAD'),sv=by(r=>/nbh-respond\.js$/.test(r.url));
    check('D the relay (/ai, outside the folder) is not answered by the worker: GET and POST reach the website',rg&&!rg.sw&&rg.status===200&&rp&&!rp.sw&&rp.status===200&&S.st.log.filter(e=>e.path.indexOf('/ai')===0).length>=2,JSON.stringify([rg,rp]));
    check('D a request to another website is not answered by the worker',xc&&!xc.sw&&got.cross===200&&O.log.length>=1,JSON.stringify(xc));
    check('D a POST and a HEAD inside the folder go to the network untouched',pi&&!pi.sw&&hd&&!hd.sw,JSON.stringify([pi,hd]));
    check('D a saved file is answered by the worker (the control)',sv&&sv.sw&&got.saved===200,JSON.stringify(sv));
    S.st.offline=true;await ctx.setOffline(true);
    const off=await page.evaluate(async()=>{try{const r=await fetch('/ai/health');return r.status;}catch(e){return 'error';}});
    check('D offline, the relay is not served from the copy',off==='error',String(off));
    S.st.offline=false;await ctx.setOffline(false);
  }

  /* ================= E: a changed file ================= */
  if(want('E')){
    await page.reload();await waitChip(page,/^Saved for offline use$/,15000);
    const CF='CF-1_Contextual-Fit-Assessment_v2026-09.html',TK='TK-1_Token-Board-Book_v2026-10.html';
    edit('workstation/index.html',s=>s.replace('<title>','<meta name="nbh-test-version" content="2">\n<title>'));
    edit('workstation/'+CF,s=>s.replace('<title>Form CF-1 · ','<title>Form CF-1 v2 · '));
    edit('workstation/nbh-pictos.js',s=>s+'\nwindow.__pictosV2=1;\n');
    S.st.delay[TK]=4000;
    const before=(await names(page,NBH)).find(n=>n.indexOf(':set:')>0);
    await page.evaluate(()=>PWA.open());await page.click('#offCheck');
    const ck=await waitChip(page,/Checking/,5000);
    check('E Check for updates: the chip says Checking…',/Checking/.test(ck),ck);
    await sleep(800);
    await page.reload();await sleep(700);
    const mid=await page.evaluate(async()=>({meta:!!document.querySelector('meta[name="nbh-test-version"]'),pic:(await (await fetch('nbh-pictos.js')).text()).indexOf('__pictosV2')>=0}));
    check('E a reload while the check runs gets the set in use: nothing new yet',!mid.meta&&!mid.pic,JSON.stringify(mid));
    const ur=await waitChip(page,/^Update ready$/,40000);S.st.delay={};
    check('E the check finds the changes, keeps them in a staging copy and says Update ready',ur==='Update ready',ur);
    check('E the strip says a new version is ready, with Reload',await page.evaluate(()=>!document.querySelector('#pwaBar').hidden&&/A new version of the workstation is ready/.test(document.querySelector('#pwaText').textContent)&&!document.querySelector('#pwaReload').hidden));
    st=await status(page);
    check('E the staged copy lists exactly the changed files',st.staged&&st.staged.files.slice().sort().join()===['index.html',CF,'nbh-pictos.js'].sort().join(),st.staged&&st.staged.files.join(', '));
    cn=await names(page,NBH);
    const staged=cn.filter(n=>n.indexOf(':set:')>0&&n!==before);
    const stIdx=staged.length===1?await page.evaluate(async([c,u])=>{const r=await (await caches.open(c)).match(u);return r?await r.text():'';},[staged[0],NBH+'index.html']):'';
    const liveIdx=await page.evaluate(async([c,u])=>{const r=await (await caches.open(c)).match(u);return r?await r.text():'';},[before,NBH+'index.html']);
    check('E the staging copy holds the new index.html; the set in use still holds the old one',staged.length===1&&stIdx.indexOf('nbh-test-version')>=0&&liveIdx.indexOf('nbh-test-version')<0,cn.join(', '));
    /* nothing new is used before Reload: a form opened now, a script, a new tab */
    await openIn(page,'CF-1');
    const t1=await frameOf(page,'CF-1_').evaluate(()=>document.title);
    const pic1=await page.evaluate(async()=>(await (await fetch('nbh-pictos.js')).text()).indexOf('__pictosV2')>=0);
    const tab=await ctx.newPage();await tab.goto(NBH);await sleep(500);
    const tabMeta=await tab.evaluate(()=>!!document.querySelector('meta[name="nbh-test-version"]'));await tab.close();
    check('E before Reload nothing new is used: a form opened now, the picture library, the shell in a new tab',/^Form CF-1 · /.test(t1)&&!pic1&&!tabMeta,JSON.stringify({t1,pic1,tabMeta}));
    /* unsaved work: the strip says to save first, and Reload asks */
    await fillSome(frameOf(page,'CF-1_'),8,'Unsaved entry');await sleep(5000);
    await page.evaluate(()=>PWA.paint());
    const strip=await page.evaluate(()=>({t:document.querySelector('#pwaText').textContent,save:!document.querySelector('#pwaSave').hidden,dirty:caseDirty()}));
    check('E with unsaved work the strip says to save the case first and carries Save case',strip.dirty&&/Save the case first/.test(strip.t)&&strip.save,JSON.stringify(strip));
    await page.click('#pwaReload');
    const q=await confirmDlg(page,false);await sleep(500);
    check('E Reload asks first while the case holds unsaved work, and Not now keeps the page',/Reload without saving/.test(q)&&await page.evaluate(()=>!document.querySelector('meta[name="nbh-test-version"]')&&!!state.frames['CF-1']),q);
    const nav=page.waitForNavigation({timeout:20000}).catch(()=>null);
    await page.click('#pwaReload');await confirmDlg(page,true);await nav;await sleep(1200);
    const after=await page.evaluate(async()=>({meta:!!document.querySelector('meta[name="nbh-test-version"]'),pic:(await (await fetch('nbh-pictos.js')).text()).indexOf('__pictosV2')>=0}));
    await openIn(page,'CF-1');const t2=await frameOf(page,'CF-1_').evaluate(()=>document.title);
    check('E after Reload the new files are in use: the shell, a form, the picture library',after.meta&&after.pic&&/^Form CF-1 v2 · /.test(t2),JSON.stringify(after)+' '+t2);
    cn=await names(page,NBH);
    check('E after Reload the old set is deleted: one set and the state cache',cn.length===2&&!cn.includes(before)&&cn.includes(staged[0]),cn.join(', '));
    check('E after Reload the chip is back to Saved for offline use, the strip gone, a note says the new version is in use',(await waitChip(page,/^Saved for offline use$/,10000))==='Saved for offline use'&&await page.evaluate(()=>document.querySelector('#pwaBar').hidden&&/new version of the workstation is in use/.test(document.querySelector('#wsToasts').textContent)));
    await closeCur(page);
    /* a start with no window open takes a ready update by itself */
    edit('workstation/GB-1_Goal-and-Objective-Builder_v2026-09.html',s=>s.replace('<title>Form GB-1 · ','<title>Form GB-1 v3 · '));
    await page.evaluate(()=>PWA.check());
    check('E a second change is staged',(await waitChip(page,/^Update ready$/,40000))==='Update ready');
    for(const p of ctx.pages())await p.close();
    page=await ctx.newPage();wire(page,errs);
    await page.goto(NBH);await sleep(800);
    await openIn(page,'GB-1');const t3=await frameOf(page,'GB-1_').evaluate(()=>document.title);
    st=await status(page);
    check('E a start with no workstation window open takes the ready update by itself',/^Form GB-1 v3 · /.test(t3)&&!st.staged&&await page.evaluate(()=>document.querySelector('#pwaBar').hidden),t3);
    await closeCur(page);
  }

  /* ================= F: conditional requests ================= */
  if(want('F')){
    let mark=S.st.log.length;
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));
    let rq=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&FILES.includes(e.path.slice(13)));
    check('F a check asks about every file with If-None-Match and the website answers 304',rq.length===FILES.length&&rq.every(e=>e.inm&&e.status===304),rq.length+' asked, '+rq.filter(e=>e.status===304).length+' 304, '+rq.filter(e=>e.inm).length+' with If-None-Match');
    S.st.etagBug=true;mark=S.st.log.length;
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));
    rq=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&FILES.includes(e.path.slice(13)));
    st=await status(page);
    check('F with ETags that never match (Apache -gzip) the same bytes are not taken for a change',rq.length===FILES.length&&rq.every(e=>e.status===200)&&!st.staged&&st.result&&st.result.kind==='ok',rq.length+' asked, staged '+JSON.stringify(st.staged)+' '+JSON.stringify(st.result));
    mark=S.st.log.length;
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));
    rq=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&FILES.includes(e.path.slice(13)));
    check('F ... and the next check asks with If-Modified-Since instead and gets 304s',rq.length===FILES.length&&rq.every(e=>!e.inm&&e.ims&&e.status===304),rq.filter(e=>e.status===304).length+' of '+rq.length+' 304');
    S.st.etagBug=false;
    /* a website that answers no "has this changed?" at all: every check downloads everything, so automatic ones slow down */
    S.st.noValidators=true;
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));
    st=await status(page);
    mark=S.st.log.length;
    await page.evaluate(()=>PWA.ask('check',{force:false},60000));await sleep(500);
    const asked=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&FILES.includes(e.path.slice(13))).length;
    S.st.noValidators=false;
    check('F a website with no ETag or Last-Modified: the same bytes are not a change, and automatic checks wait an hour',st.slow===true&&!st.staged&&asked===0,JSON.stringify({slow:st.slow,staged:st.staged,asked}));
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));   /* takes the validators the website gives again */
    await page.evaluate(()=>PWA.ask('check',{force:true},120000));   /* ... and asks with them */
    st=await status(page);
    check('F ... until the website answers 304 again',st.slow===false&&!st.staged,JSON.stringify({slow:st.slow}));
    /* the website's password: the check stops, changes nothing, and says so */
    S.st.auth=true;
    await page.evaluate(()=>PWA.ask('check',{force:true},60000));
    st=await status(page);S.st.auth=false;
    check('F a website that asks for its password: the check changes nothing and says why (auth)',st.result&&st.result.kind==='auth'&&st.live&&!st.staged,JSON.stringify(st.result));
    await page.evaluate(()=>PWA.paint());
    const as=await page.evaluate(()=>({shown:!document.querySelector('#pwaBar').hidden,t:document.querySelector('#pwaText').textContent,sign:!document.querySelector('#pwaSign').hidden,reload:!document.querySelector('#pwaReload').hidden}));
    check('F ... the strip says so once, with Sign in (and no Reload)',as.shown&&/asked for its password/.test(as.t)&&as.sign&&!as.reload,JSON.stringify(as));
    await page.click('#pwaLater');
    check('F ... and Later puts it away for the session',await page.evaluate(()=>{PWA.paint();return document.querySelector('#pwaBar').hidden;}));
    await page.evaluate(()=>PWA.open());await sleep(300);
    check('F ... and the notice offers Sign in to the website',await page.evaluate(()=>!!document.querySelector('#offSign')&&/password/.test(document.querySelector('#offLive').textContent)));
    /* Sign in loads the page past the copy, so that the browser meets the password and asks for it */
    S.st.auth=true;
    const signMark=S.st.log.length;
    const navResp=page.waitForResponse(r=>/[?&]nbh-online=signin/.test(r.url()),{timeout:15000}).catch(()=>null);
    await page.click('#offSign');
    const nr=await navResp;await sleep(600);
    check('F Sign in asks the website itself (past the copy), which answers with its password challenge',!!nr&&!nr.fromServiceWorker()&&nr.status()===401&&S.st.log.slice(signMark).some(e=>/^\/workstation\/$/.test(e.path)&&e.status===401),nr?nr.url()+' '+nr.status()+' sw='+nr.fromServiceWorker():'no response');
    S.st.auth=false;
    await page.goto(NBH);await waitChip(page,/^Saved for offline use$|^Update ready$/,15000);
    await page.evaluate(()=>PWA.ask('check',{force:true},60000));
  }

  /* ================= G: a changed sw.js ================= */
  if(want('G')){
    const v1=(await status(page)).version;
    edit('workstation/sw.js',s=>s.replace(/const VERSION = '[0-9a-z]+';/,"const VERSION = 'testtwo00002';"));
    const mark=S.st.log.length;
    await page.evaluate(()=>PWA.check());
    const ur=await waitChip(page,/^Update ready$/,60000);
    const reg=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {waiting:!!r.waiting,active:!!r.active,ctl:!!navigator.serviceWorker.controller};});
    check('G a changed sw.js installs beside the worker in use and waits (Update ready)',ur==='Update ready'&&reg.waiting&&reg.active&&reg.ctl,ur+' '+JSON.stringify(reg));
    const dl=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation/')===0&&e.status===200&&e.path!=='/workstation/sw.js');
    check('G the new worker copied the unchanged files from the old set after 304s, downloading none',!dl.length,dl.map(e=>e.path).join(', '));
    let cn2=await names(page,NBH);
    check('G its set carries its own version beside the old one',cn2.some(n=>n.indexOf(':vtesttwo00002:set:')>0)&&cn2.some(n=>n.indexOf(':v'+v1+':set:')>0),cn2.join(', '));
    check('G until Reload the old worker serves',(await status(page)).version===v1);
    const nav=page.waitForNavigation({timeout:20000}).catch(()=>null);
    await page.click('#pwaReload');await nav;await sleep(1500);
    const v2=await status(page);
    cn2=await names(page,NBH);
    check('G Reload: the new worker takes over and the old version’s caches are deleted',v2&&v2.version==='testtwo00002'&&v2.live&&v2.files===FILES.length&&cn2.length===2&&cn2.every(n=>n.indexOf(':v'+v1+':')<0),JSON.stringify({v:v2&&v2.version,files:v2&&v2.files})+' '+cn2.join(', '));
    check('G the shell opens a form from the new worker’s set',await openIn(page,'PD-1'));
    await closeCur(page);
  }

  /* ================= H: Reset ================= */
  if(want('H')){
    const old=(await names(page,NBH)).find(n=>n.indexOf(':set:')>0);
    const mark=S.st.log.length;
    await page.evaluate(()=>PWA.open());await sleep(200);
    const nav=page.waitForNavigation({timeout:20000}).catch(()=>null);
    await page.click('#offReset');const q=await confirmDlg(page,true);await nav;await sleep(800);
    const fromWeb=S.st.log.slice(mark).some(e=>e.path==='/workstation/'&&e.status===200&&!e.inm);
    check('H Reset asks, then loads the page from the website with its address cleaned',/Reset the offline copy/.test(q)&&fromWeb&&page.url()===NBH,q+' '+page.url());
    const s2=await waitChip(page,/^Saved for offline use$/,120000);
    const cn3=await names(page,NBH);
    check('H the old copy is gone and a fresh one is saved',s2==='Saved for offline use'&&!cn3.includes(old)&&cn3.length===2,cn3.join(', '));
  }

  /* ================= I: two editions on one website ================= */
  if(want('I')){
    const pr=await ctx.newPage();wire(pr,errs);
    await pr.goto(RPS);
    const s3=await waitChip(pr,/^Saved for offline use$/,120000);
    const a=await names(pr,NBH),b=await names(pr,RPS);
    check('I the school edition keeps its own copy beside the practice’s, each named after its folder',s3==='Saved for offline use'&&a.length===2&&b.length===2,a.concat(b).join(', '));
    const rr=await pr.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope));
    check('I each edition has its own worker',rr.includes(NBH)&&rr.includes(RPS),rr.join(', '));
    await pr.evaluate(()=>PWA.open());await sleep(200);
    const nav=pr.waitForNavigation({timeout:20000}).catch(()=>null);
    await pr.click('#offReset');await confirmDlg(pr,true);await nav;await sleep(600);
    const a2=await names(pr,NBH);
    check('I resetting the school edition leaves the practice’s copy',a2.length===2&&a2.join()===a.join(),a2.join(', '));
    await waitChip(pr,/^Saved for offline use$/,120000);
    await pr.close();
  }

  /* ================= J: from a drive, and the one-file edition ================= */
  if(want('J')){
    const fctx=await br.newContext();const pf=await fctx.newPage();
    const probe=async(p,url)=>{await p.goto(url);await sleep(2500);return p.evaluate(async()=>({sw:'serviceWorker' in navigator,regs:navigator.serviceWorker?await navigator.serviceWorker.getRegistrations().then(r=>r.length,()=>0):0,chip:document.querySelector('#offChip').hidden,man:!!document.querySelector('link[rel="manifest"]'),diag:typeof PWA!=='undefined'?PWA.diag():''}));};
    let r=await probe(pf,'file://'+path.join(ROOT,'NBH-Workstation','index.html'));
    check('J from a drive (file://) no worker is registered and the chip stays hidden',r.regs===0&&r.chip,JSON.stringify(r));
    r=await probe(pf,ORIGIN+'/one/NBH-Workstation.html');
    check('J the one-file edition, served from the website, registers no worker, hides the chip and carries no manifest link',r.regs===0&&r.chip&&!r.man,JSON.stringify(r));
    check('J the one-file edition still opens its forms',await openIn(pf,'PD-1'));
    r=await probe(pf,'file://'+path.join(SITE,'one','NBH-Workstation.html'));
    check('J the one-file edition from a drive registers no worker either',r.regs===0&&r.chip&&!r.man,JSON.stringify(r));
    const one=fs.readFileSync(path.join(SITE,'one','NBH-Workstation.html'),'utf8');
    const shell=zlib.gunzipSync(Buffer.from(/<script type="text\/plain" id="nbh-embed-shell">([^<]*)<\/script>/.exec(one)[1],'base64')).toString('utf8');
    check('J ... and neither it nor the copy of the page its case files carry has the install block',one.indexOf('nbh-pwa-head')<0&&shell.indexOf('nbh-pwa-head')<0&&!/rel="manifest"/.test(shell),'');
    await fctx.close();
  }

  /* ================= K: installed on an iPad (simulated) ================= */
  const IPAD='Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
  if(want('K')){
    const ictx=await br.newContext({viewport:{width:1180,height:820},userAgent:IPAD,hasTouch:true,acceptDownloads:true});
    await ictx.addInitScript(()=>{
      Object.defineProperty(Navigator.prototype,'standalone',{get:()=>true,configurable:true});
      try{localStorage.setItem('nbh.ws.autosave.on','off');}catch(e){}
      const T=(()=>{try{return window.top;}catch(e){return window;}})();
      navigator.canShare=d=>!!(d&&d.files&&d.files.length);
      navigator.share=async d=>{
        const f=d.files[0],rec={name:f.name,type:f.type,size:f.size,text:await f.text(),active:navigator.userActivation?navigator.userActivation.isActive:null};
        (T.__shared=T.__shared||[]).push(rec);
        const m=T.__shareMode||'ok';
        if(m==='late'){T.__shareMode='ok';const e=new Error('no tap');e.name='NotAllowedError';throw e;}
        if(m==='abort'){T.__shareMode='ok';const e=new Error('closed');e.name='AbortError';throw e;}
      };
    });
    const pi=await ictx.newPage();wire(pi,errs);let dls=0;pi.on('download',()=>dls++);
    await pi.goto(NBH+'CF-1_Contextual-Fit-Assessment_v2026-09.html');await sleep(800);
    check('K installed on an iPad: the save block is on in the form',await pi.evaluate(()=>window.nbhShareSave&&window.nbhShareSave.on===true));
    await pi.evaluate(()=>{window.__shared=[];});
    await fillAndSave(pi,'Shared note 5150');await sleep(800);
    let sh=await pi.evaluate(()=>window.__shared||[]);
    check('K Save data goes to the share sheet as a file, inside the tap, and nothing downloads',sh.length===1&&/^CF-1_.*\.json$/.test(sh[0].name)&&sh[0].type==='application/json'&&sh[0].text.indexOf('Shared note 5150')>=0&&dls===0,JSON.stringify(sh.map(x=>[x.name,x.type,x.size,x.active]))+' downloads '+dls);
    await pi.evaluate(()=>{window.__shareMode='late';});
    await pi.evaluate(()=>document.querySelector('#saveBtn').click());
    const dlg=await pi.waitForSelector('#nbhShareDlg',{timeout:5000}).then(()=>true).catch(()=>false);
    const dlgText=dlg?await pi.evaluate(()=>document.querySelector('#nbhShareDlg').innerText):'';
    if(dlg)await pi.click('#nbhShareDlg button:last-child');await sleep(500);
    sh=await pi.evaluate(()=>window.__shared||[]);
    check('K too long after the tap: a notice asks for one more tap, and its Save opens the sheet',dlg&&/Save to Files/.test(dlgText)&&sh.length===3&&sh[2].name===sh[1].name&&!(await pi.$('#nbhShareDlg'))&&dls===0,dlgText.replace(/\s+/g,' ').slice(0,120)+' / '+sh.length);
    await pi.evaluate(()=>{window.__shareMode='abort';});
    await pi.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(600);
    check('K the sheet closed without saving: the form says Not saved',await pi.evaluate(()=>/Not saved: CF-1_/.test((document.querySelector('#nbhToasts')||{}).textContent||'')));
    /* a CSV from a data: or blob: link goes the same way */
    await pi.evaluate(()=>{window.__shared=[];const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('a,b\n1,2');a.download='probe.csv';document.body.appendChild(a);a.click();a.remove();});await sleep(400);
    sh=await pi.evaluate(()=>window.__shared||[]);
    check('K a data: link with a download name goes to the share sheet too',sh.length===1&&sh[0].name==='probe.csv'&&sh[0].text==='a,b\n1,2',JSON.stringify(sh));
    /* the shell: Save case */
    const ps=await ictx.newPage();wire(ps,errs);ps.on('download',()=>dls++);
    await ps.goto(NBH);await sleep(900);
    await ps.fill('#pClient','Share Student');await openIn(ps,'CF-1');await fillSome(frameOf(ps,'CF-1_'),8,'Shared entry');await sleep(4500);
    await ps.evaluate(()=>{window.__shared=[];});
    await ps.evaluate(()=>$('#saveCase').click());await sleep(2500);
    sh=await ps.evaluate(()=>window.__shared||[]);
    check('K the shell: Save case goes to the share sheet as the case file',sh.length===1&&/^CASE_Share_Student_.*\.json$/.test(sh[0].name)&&/"CF-1"/.test(sh[0].text)&&dls===0,JSON.stringify(sh.map(x=>x.name)));
    await ps.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d&&d.open)d.close();});
    const clean=await ps.evaluate(()=>!caseDirty());
    await ps.evaluate(()=>{window.__shareMode='abort';window.__shared=[];});
    await ps.evaluate(()=>$('#saveCase').click());await sleep(2500);
    const back=await ps.evaluate(()=>({dirty:caseDirty(),toast:document.querySelector('#wsToasts').textContent}));
    check('K a case the sheet did not keep counts as unsaved again (the dot comes back) and the shell says Not saved',clean&&back.dirty&&/Not saved: CASE_/.test(back.toast),JSON.stringify(back).slice(0,200));
    check('K installed: no install tip',await ps.evaluate(()=>document.querySelector('#tipBar').hidden));
    await ictx.close();
  }

  /* ================= L: the install tip ================= */
  if(want('L')){
    const tctx=await br.newContext({viewport:{width:1180,height:820},userAgent:IPAD,hasTouch:true});
    const pt=await tctx.newPage();wire(pt,errs);
    await pt.goto(NBH);await sleep(900);
    const tip=await pt.evaluate(()=>({shown:!document.querySelector('#tipBar').hidden,t:document.querySelector('#tipBar').textContent.replace(/\s+/g,' ').trim()}));
    check('L an iPad in Safari gets the tip: Install: Share, then Add to Home Screen',tip.shown&&/Install: Share, then Add to Home Screen/.test(tip.t),tip.t);
    await pt.click('#tipHide');await pt.reload();await sleep(700);
    check('L ... once: dismissed, it does not come back',await pt.evaluate(()=>document.querySelector('#tipBar').hidden));
    check('L a computer gets no tip',await page.evaluate(()=>document.querySelector('#tipBar').hidden));
    await tctx.close();
  }

  /* ================= M: no room on the device ================= */
  if(want('M')){
    const qctx=await br.newContext();const qp=await qctx.newPage();wire(qp,errs);
    const c=await qctx.newCDPSession(qp);
    let ok=true;await c.send('Storage.overrideQuotaForOrigin',{origin:ORIGIN,quotaSize:3*1024*1024}).catch(e=>{ok=String(e);});
    await qp.goto(NBH);
    const t=await waitChip(qp,/^Not saved for offline use/,90000);
    const qn=await names(qp,NBH);
    check('M a device without room: the chip says Not saved for offline use: no room, and no half-saved set is left',ok===true&&t==='Not saved for offline use: no room'&&qn.length===1&&qn[0].endsWith(':state'),t+' '+qn.join(', ')+' '+ok);
    check('M ... and the workstation works online',await openIn(qp,'PD-1'));
    await qctx.close();
  }

  /* ================= N: a first save cut off half way carries on later ================= */
  if(want('N')){
    const nctx=await br.newContext();const np=await nctx.newPage();wire(np,errs);
    for(const f of FILES)if(/^(TK-1|PA-1|EA-1|TD-1|OB-1|RA-1)_|^Reinforcer|^nbh-pictos/.test(f))S.st.delay[f]=1500;
    await np.goto(RPS);
    let seen='';const t1=Date.now();
    while(Date.now()-t1<60000){const t=await chip(np);const m=/^Saving for offline use: (\d+) of/.exec(t);if(m&&+m[1]>=12){seen=t;break;}await sleep(50);}
    S.st.offline=true;
    const cut=await waitChip(np,/^Not saved for offline use yet$/,60000);
    S.st.offline=false;S.st.delay={};
    const st1=await status(np);
    check('N a first save cut off half way: the chip says Not saved for offline use yet, nothing is served from a half set',!!seen&&cut==='Not saved for offline use yet'&&!st1.live,seen+' / '+cut+' / '+JSON.stringify(st1&&st1.result));
    const mark=S.st.log.length;
    await np.evaluate(()=>PWA.check());
    const done=await waitChip(np,/^Saved for offline use$/,120000);
    const again=S.st.log.slice(mark).filter(e=>e.status===200&&e.path.indexOf('/workstation-rps/')===0).length;
    const st2=await status(np);
    check('N ... and carries on when asked again, without fetching again what it had already saved',done==='Saved for offline use'&&st2.live&&st2.files===FILES.length&&again<FILES.length-8,'downloaded again: '+again+' of '+FILES.length+'; '+done);
    await nctx.close();
  }

  check('no script errors on any page',!errs.length,errs.slice(0,6).join(' | '));
  await br.close();await S.close();O.srv.close();
  console.log('\n'+passes+' passed, '+fails+' failed');
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
