/* The offline copy and the installed app (v21.43), in Chromium, against a copy of both editions served by a small
   server that answers like the website's Apache (ETag and Last-Modified on every file, 304 to If-None-Match and
   If-Modified-Since, no-cache on html and js), so files can be changed while the pages are open, and that can also
   answer as a host gone wrong (a holding page, a redirect, GoDaddy's injected snippet, the folder's password):
     A  manifest.json parses (and Chromium reads it without an error), its icons are PNGs of the sizes it names, the
        maskable one is there, the touch icon is 180 x 180 and opaque, the head carries the iPad's tags and the manifest
        link asks for it with the sign-in (crossorigin="use-credentials"); the school edition has a manifest and icons of
        its own; each edition's release.json lists every file with its length and SHA-256
     B  the first visit registers sw.js, the chip counts the files (n of N) and ends at Saved for offline use, the set
        holds every listed file byte for byte, the shell asked for persistent storage; the list holds every file of the
        folder that a page names (scanned here independently of tools/pwa-sw.py)
     C  with the network off the shell and every one of the 45 forms open, the picture library loads, a form is filled
        and saved (and the case too), an unsaved page gets the offline page; nothing saved is asked of the network, and
        no request a page makes for a file of the folder goes unanswered; Diagnostics says the libraries are saved
     D  the writing help's relay (/ai, outside the folder: GET and POST), another website, a POST and a HEAD inside the
        folder are not answered by the worker; a saved file is (the control); offline, the relay is not served
     E  a changed file (a release: release.json written again) is found by Check, staged, announced (Update ready, the
        strip); a reload during the check and everything before Reload (a form opened then, a script, a new tab) get the
        set in use; with unsaved work the strip says to save first and Reload asks; after Reload the new files are in use
        and the old set is gone; a start with no window open takes a ready update by itself
     F  checks ask about every file and release.json with If-None-Match and get 304s; with ETags that never match
        (Apache's -gzip) the same bytes are not taken for a change and the next check asks with If-Modified-Since; with
        no validators at all automatic checks slow to hourly; the password stops a check and the strip offers Sign in
     G  a changed sw.js installs beside the one in use (unchanged files copied after 304s, none downloaded), waits,
        takes over on Reload and deletes the old caches
     H  Reset deletes the copy, forgets the worker and loads the page from the website; a fresh copy follows;
        localStorage, IndexedDB and other caches are left alone
     I  the school edition keeps its own copy beside the practice's, and resetting one leaves the other
     J  nothing is registered from a drive (file://) or in the one-file edition (served or from a drive), which carries
        no manifest link and still opens its forms
     K  installed on an iPad (simulated: standalone, an iPad's user agent, share and canShare stubs): Save data and
        Save case go to the share sheet as files; too long after the tap a notice asks for one more tap; a closed sheet
        says Not saved, the case's unsaved dot comes back and Autosave's copy stays; in a browser tab nothing is wrapped
     L  the install tip on an iPad in Safari, once, and not when installed
     M  a device without room: the chip says so, nothing half saved is left, the workstation works online; an hour
        later an automatic check tries again by itself
     N  a first save cut off half way (the network gone) says so, serves nothing from the half set, and carries on
        later without fetching again what it had saved
     O  a host that answers every request with a holding page ("Account Suspended"), or redirects to one: nothing is
        taken, the next start (offline) is still the workstation; the address ?nbh-online=reset resets the copy without
        the shell (and, offline, says it needs the internet and keeps the copy)
     P  GoDaddy's snippet injected into every page: the saved pages are the files without it, byte for byte, a snippet
        that changes per request is not taken for an update, and a saved page does not wait for the injected script
     Q  two windows of one edition: Reload in one, while the other is open, swaps nothing and says why; once the other
        is closed it does; both editions open at once: each shell shows only its own worker's status
     R  taps that score intervals in MT-1 after a Save case (no field changes): Reload asks first
     S  the folder's password: the worker's requests refused but the page's carry the sign-in (the copy is made
        through the page); all requests refused (the chip and the strip say to sign in); a page not saved, behind the
        password, offers Sign in past the worker
     T  the release list during uploads: release.json up before the files, a file cut short, part of an upload: nothing
        taken until every listed file is up; a single file uploaded without release.json still arrives; a damaged
        release.json counts as none
     U  installed on an iPad: a window the page opens for a page of its own making (the pop-up test, the master print)
        opens inside the app, with Print and Close; Own tab fills the window instead of opening Safari
     V  the browser stops the worker half way through the first save: the chip says so and the save starts again
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
/* st.auth: the folder's password (401 to anything without an Authorization header; st.authMount: only in that
   folder, for this and authMode); st.authMode 'fetch': 401 to every
   request a script makes with fetch (Sec-Fetch-Dest: empty), pages and their scripts served; 'worker': the same, but
   the page's own fetches for the worker (?nbh-online=fetch) are served, as when the browser hands the sign-in to the
   page's requests and not to the worker's. st.suspended: every answer cPanel's holding page; st.redirectAll: a 302 to
   it. st.inject 'stable'|'vary': GoDaddy's snippet before the first </head>, </body> and </html> of every page (its
   script from st.injectSrc, else img1.wsimg.com), 'vary' different on every request; st.htmlNoValidators: pages
   without ETag and Last-Modified. */
const SUSP='<!DOCTYPE html><html><head><title>Account Suspended</title></head><body><h1>Account Suspended</h1><p>This Account has been suspended. Contact your hosting provider for more information.</p></body></html>';
function makeServer(mounts){
  const st={offline:false,delay:{},etagBug:false,noValidators:false,htmlNoValidators:false,auth:false,authMode:null,suspended:false,redirectAll:false,inject:null,injectSrc:'',n:0,log:[]};
  const TYPES={html:'text/html; charset=utf-8',js:'application/javascript',json:'application/json',png:'image/png',webp:'image/webp',txt:'text/plain; charset=utf-8',md:'text/plain; charset=utf-8'};
  const snippet=()=>"<script>'undefined'=== typeof _trfq || (window._trfq = []);'undefined'=== typeof _trfd && (window._trfd=[]),_trfd.push({'tccl.baseHost':'secureserver.net'},{'ap':'cpsh-oh'},{'server':'p3plzcpnl505855'},{'dcenter':'p3'},{'cp_id':'10012345'},{'cp_cl':'8'}"+(st.inject==='vary'?",{'rq':'"+(++st.n)+"'}":'')+") // Monitoring performance to make your website faster. If you want to opt-out, please contact web hosting support.</script><script src='"+(st.injectSrc||'https://img1.wsimg.com/traffic-assets/js/tccl.min.js')+"'></script>";
  const srv=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://h');
    const e={t:Date.now(),method:req.method,path:u.pathname,q:u.search,inm:req.headers['if-none-match']||'',ims:req.headers['if-modified-since']||'',dest:req.headers['sec-fetch-dest']||'',status:0};
    st.log.push(e);
    if(st.offline){e.status=-1;req.socket.destroy();return;}
    const done=(code,h,body)=>{e.status=code;res.writeHead(code,h);res.end(body);};
    if(u.pathname==='/ai'||u.pathname.indexOf('/ai/')===0){let b='';req.on('data',c=>b+=c);req.on('end',()=>done(200,{'Content-Type':'application/json'},JSON.stringify({relay:true,method:req.method})));return;}
    if(u.pathname==='/suspended.html'){done(200,{'Content-Type':'text/html; charset=utf-8'},SUSP);return;}
    const m=Object.keys(mounts).find(k=>u.pathname.indexOf(k)===0);
    if(!m){if(Object.keys(mounts).includes(u.pathname+'/')){done(301,{Location:u.pathname+'/'},'');return;}done(404,{'Content-Type':'text/plain'},'not found');return;}
    if(st.suspended){done(200,{'Content-Type':'text/html; charset=utf-8'},SUSP);return;}
    if(st.redirectAll){done(302,{Location:'/suspended.html'},'');return;}
    const asks=st.authMode&&(!st.authMount||m===st.authMount)&&e.dest==='empty'&&!(st.authMode==='worker'&&/[?&]nbh-online=fetch/.test(u.search));
    if((st.auth&&(!st.authMount||m===st.authMount)&&!req.headers.authorization)||asks){done(401,{'WWW-Authenticate':'Basic realm="workstation"','Content-Type':'text/html'},'<html><body>401 sign in</body></html>');return;}
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
      const nov=st.noValidators||(st.htmlNoValidators&&ext==='html');
      if(nov){delete h['ETag'];delete h['Last-Modified'];}
      let same=false;
      if(nov)same=false;
      else if(inm)same=!st.etagBug&&inm.split(',').map(x=>x.trim()).includes(etag);
      else if(ims){const t=Date.parse(ims);same=!isNaN(t)&&sec<=t;}
      const send=()=>{
        if(st.offline){e.status=-1;req.socket.destroy();return;}
        if(same){e.status=304;res.writeHead(304,h);res.end();return;}
        e.status=200;res.writeHead(200,h);
        if(req.method==='HEAD'){res.end();return;}
        if(st.inject&&ext==='html'){
          let body=fs.readFileSync(file,'utf8');
          for(const tag of ['</head>','</body>','</html>']){const i=body.indexOf(tag);if(i>=0)body=body.slice(0,i)+snippet()+body.slice(i);}
          res.end(body);return;
        }
        fs.createReadStream(file).pipe(res);
      };
      const d=st.delay[rel];if(d)setTimeout(send,d);else send();
    });
  });
  return {srv,st,listen:()=>new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv.address().port))),close:()=>new Promise(r=>srv.close(()=>r()))};
}
/* another website, for the cross-origin request; its copy of the host's monitoring script can be made to hang */
function makeOther(){
  const log=[],st={hang:0};
  const srv=http.createServer((req,res)=>{log.push(req.url);
    if(/tccl/.test(req.url)){const go=()=>{res.writeHead(200,{'Content-Type':'application/javascript'});res.end('window.__tccl=1;');};if(st.hang)setTimeout(go,st.hang);else go();return;}
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end('{"other":true}');});
  return {srv,log,st,listen:()=>new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv.address().port)))};
}
let tick=Math.floor(Date.now()/1000)+30;
const touch=p=>{tick+=5;fs.utimesSync(p,tick,tick);};
/* a release made on the website's copy: tools/pwa-sw.py writes its release.json (and sw.js's list) again */
function release(folder){cp.execFileSync('python3',[path.join(ROOT,'tools','pwa-sw.py'),path.join(SITE,folder)],{stdio:'pipe'});touch(path.join(SITE,folder,'release.json'));}
/* a file on the website changed; list: as part of a release (release.json written again), else uploaded on its own */
function edit(rel,fn,list){
  const p=path.join(SITE,rel),s=fs.readFileSync(p,'utf8'),o=fn(s);
  if(o===s)throw new Error('the edit changed nothing in '+rel);
  fs.writeFileSync(p,o);touch(p);
  if(list)release(rel.split('/')[0]);
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
/* the files of the folder a page names, found here on its own terms (not tools/pwa-sw.py's): any src=, href=, data= or
   poster= of any tag but <a>, url(...), and fetch, loadScript, importScripts, new Worker, import() and .src = in scripts;
   only names of files that exist beside index.html count */
function scanLoads(dir,pages){
  const out=new Set();
  const local=x=>/^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]+$/.test(x)&&fs.existsSync(path.join(dir,x));
  for(const p of pages){
    const s=fs.readFileSync(path.join(dir,p),'utf8'),refs=[];
    for(const t of s.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*>/gi)){if(t[1].toLowerCase()==='a')continue;for(const m of t[0].matchAll(/\b(?:src|href|data|poster)\s*=\s*(["'])([^"']*)\1/gi))refs.push(m[2]);}
    for(const m of s.matchAll(/url\(\s*(["']?)([^"')\s]+)\1\s*\)/g))refs.push(m[2]);
    for(const m of s.matchAll(/\b(?:fetch|loadScript|importScripts|Worker|import)\s*\(\s*(["'])([^"']+)\1/g))refs.push(m[2]);
    for(const m of s.matchAll(/\.src\s*=\s*(["'])([^"']+)\1/g))refs.push(m[2]);
    for(let r of refs){r=r.split('#')[0].split('?')[0];if(local(r)&&!/\.html$/.test(r))out.add(r);}
  }
  return [...out];
}
const pngInfo=b=>({png:b.slice(0,8).toString('hex')==='89504e470d0a1a0a',w:b.readUInt32BE(16),h:b.readUInt32BE(20),colorType:b[25]});

(async()=>{
  /* the site: copies of both editions, and a one-file edition built from this tree */
  fs.rmSync(SITE,{recursive:true,force:true});
  fs.cpSync(path.join(ROOT,'NBH-Workstation'),path.join(SITE,'workstation'),{recursive:true});
  fs.cpSync(path.join(ROOT,'RPS-Workstation'),path.join(SITE,'workstation-rps'),{recursive:true});
  fs.mkdirSync(path.join(SITE,'one'),{recursive:true});
  cp.execFileSync('python3',[path.join(ROOT,'tools','build-single.py'),path.join(ROOT,'NBH-Workstation'),path.join(SITE,'one','NBH-Workstation.html')]);
  /* folders of their own for the parts that change files or answer in their own way (Q, R, S, T), each a copy of the
     practice's edition as built */
  const own={};
  for(const k of ['q','r','s','t'])if(want(k.toUpperCase())){fs.cpSync(path.join(ROOT,'NBH-Workstation'),path.join(SITE,'workstation-'+k),{recursive:true});own['/workstation-'+k+'/']=path.join(SITE,'workstation-'+k);}
  const S=makeServer(Object.assign({'/workstation/':path.join(SITE,'workstation'),'/workstation-rps/':path.join(SITE,'workstation-rps'),'/one/':path.join(SITE,'one')},own));
  const port=await S.listen(),ORIGIN='http://127.0.0.1:'+port,NBH=ORIGIN+'/workstation/',RPS=ORIGIN+'/workstation-rps/';
  const OWN=k=>ORIGIN+'/workstation-'+k+'/';
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
      const tags=['<link rel="manifest" href="manifest.json" crossorigin="use-credentials">','<link rel="apple-touch-icon" href="apple-touch-icon.png">','<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-status-bar-style" content="default">','<meta name="theme-color" content="#ffffff">','<meta name="apple-mobile-web-app-title" content="'+short+'">'];
      const miss=tags.filter(t=>idx.indexOf(t)<0);
      check(ed+' index.html carries the manifest link (with the sign-in: crossorigin="use-credentials") and the iPad’s tags, the Home Screen name the manifest’s short name',!miss.length,miss.join(' '));
      /* the release list: every file sw.js lists, with the length and SHA-256 of the file in this folder */
      let rel=null;try{rel=JSON.parse(fs.readFileSync(path.join(ROOT,dir,'release.json'),'utf8'));}catch(e){}
      const swList=(()=>{const s=fs.readFileSync(path.join(ROOT,dir,'sw.js'),'utf8');const m=/const FILES = \[([\s\S]*?)\];/.exec(s);return m[1].match(/'([^']+)'/g).map(x=>x.slice(1,-1));})();
      const relBad=!rel||rel.nbh!=='release'?['no release list']:swList.filter(f=>{const e=rel.files[f],b=fs.readFileSync(path.join(ROOT,dir,f));return !e||e.len!==b.length||e.sha!==sha(b);}).concat(Object.keys(rel.files).filter(f=>!swList.includes(f)));
      check(ed+' release.json lists every file of sw.js’s list with its length and SHA-256, and nothing else',!relBad.length,relBad.slice(0,5).join(', '));
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
    try{localStorage.setItem('nbh.ws.autosave.on','off');localStorage.setItem('nbh.ws.autosave.v2','off');}catch(e){}
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
  const need=['index.html',...F.map(f=>f.file),'nbh-pictos.js','nbh-tk1-narration.js','nbh-tk1-video.js','nbh-sm1-narration.js','nbh-dd1-narration.js','nbh-tk1-bus-narration.js','nbh-ia1-narration.js','nbh-ra1-narration.js','nbh-pictures.js','nbh-respond.js','respond.html','pdf-lib.min.js','nbh-pdf-tools.js','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png'];
  /* v21.67 the document readers (PDF.js, Tesseract) in their folders, named by index.html's nbh-offline meta */
  const offline=(/<meta name="nbh-offline" content="([^"]*)"/.exec(fs.readFileSync(path.join(ROOT,'NBH-Workstation','index.html'),'utf8'))||[0,''])[1].split(/\s+/).filter(Boolean);need.push(...offline);
  check('B the list is the shell, the 45 forms, the picture library, the TK-1 narration, the respondent page and its library, the PDF tools, the document readers (nbh-offline), the manifest and the icons',offline.length===6&&need.every(f=>FILES.includes(f))&&FILES.every(f=>need.includes(f)),FILES.filter(f=>!need.includes(f)).concat(need.filter(f=>!FILES.includes(f))).join(', '));
  const named=scanLoads(path.join(ROOT,'NBH-Workstation'),['index.html','respond.html',...F.map(f=>f.file)]);
  check('B every file of the folder a page names (scanned here: tags, styles, fetch, loadScript, workers, .src) is in the list',named.length>=6&&named.every(f=>FILES.includes(f)),'named '+named.length+'; not listed: '+named.filter(f=>!FILES.includes(f)).join(', '));
  const pa=await page.evaluate(()=>({asked:window.__persistAsked||0,seen:window.__persistedSeen||0,was:window.__persistedWas}));
  check('B the shell asked the browser to keep the copy (navigator.storage.persist, unless it is kept already)',pa.asked>0||(pa.seen>0&&pa.was===true),JSON.stringify(pa));
  await page.evaluate(()=>$('#diag').click());await sleep(400);
  const dg=await page.evaluate(()=>{const r=Array.from(document.querySelectorAll('#dlgBody tr')).find(t=>/^Offline copy/.test(t.textContent));return r?r.textContent:'';});
  await page.evaluate(()=>$('#dlg').close());
  await page.evaluate(()=>$('#help').click());await sleep(300);
  const hp=await page.evaluate(()=>document.querySelector('#dlgBody').textContent);
  await page.evaluate(()=>$('#dlg').close());
  const pal=await page.evaluate(()=>CMDS.map(c=>c.n).filter(n=>/update|Offline copy/i.test(n)));
  check('B Diagnostics names the offline copy, Help explains it, the command box can check for updates',new RegExp('Saved for offline use \\u2014 '+FILES.length+' files').test(dg)&&/Offline, installing and updates/.test(hp)&&/Add to Home Screen/.test(hp)&&pal.length===2,dg.slice(0,120)+' | '+pal.join(', '));
  check('B in a browser tab nothing is wrapped for saving (createObjectURL and the link click are the browser’s own)',await page.evaluate(()=>window.nbhShareSave&&window.nbhShareSave.on===false&&/\[native code\]/.test(URL.createObjectURL.toString())&&/\[native code\]/.test(HTMLAnchorElement.prototype.click.toString())));

  /* ================= C: offline ================= */
  if(want('C')){
    S.st.offline=true;await ctx.setOffline(true);
    const mark=S.st.log.length;
    /* every request the shell and its forms make for a file of the folder must be answered (HEAD aside: Diagnostics
       asks the website with it, and the worker leaves it alone) */
    const unanswered=[];
    const onFail=r=>{const u=r.url();if(u.indexOf(NBH)===0&&r.method()!=='HEAD')unanswered.push(u.slice(NBH.length)+' '+((r.failure()||{}).errorText||''));};
    const onResp=r=>{const u=r.url();if(u.indexOf(NBH)===0&&r.request().method()!=='HEAD'&&r.status()>=400)unanswered.push(u.slice(NBH.length)+' '+r.status());};
    page.on('requestfailed',onFail);page.on('response',onResp);
    await page.reload();await sleep(900);
    check('C offline: the shell opens from the copy',await page.evaluate(()=>/Workstation/.test(document.title)&&document.querySelectorAll('#rail .item').length===45));
    check('C offline: the chip says Offline now',/^Offline now$/.test(await waitChip(page,/^Offline now$/,10000)),await chip(page));
    const notOpen=[],pic={};
    for(const f of F){
      if(!(await openIn(page,f.id)))notOpen.push(f.id);
      if(['SM-1','VS-1','TK-1'].includes(f.id)){const fr=frameOf(page,f.file);pic[f.id]=fr?await fr.evaluate(()=>window.NBH_PICTOS?Object.keys(window.NBH_PICTOS).length:0).catch(()=>0):0;}
      await closeCur(page);
    }
    check('C offline: every one of the 45 forms opens in the shell and answers',!notOpen.length,notOpen.join(', '));
    check('C offline: the picture library loads in SM-1, VS-1 and TK-1',Object.values(pic).length===3&&Object.values(pic).every(n=>n>100),JSON.stringify(pic));
    page.off('requestfailed',onFail);page.off('response',onResp);
    check('C offline: no request the shell and the 45 forms made for a file of the folder went unanswered',!unanswered.length,unanswered.slice(0,6).join(', '));
    await page.evaluate(()=>$('#diag').click());
    await page.waitForFunction(()=>{const r=Array.from(document.querySelectorAll('#dlgBody tr')).map(t=>t.textContent).join('|');return /Picture library.*(saved on this device|could not check)/.test(r)&&/Respondent pages.*(saved on this device|could not check)/.test(r);},null,{timeout:8000}).catch(()=>{});
    const dgo=await page.evaluate(()=>Array.from(document.querySelectorAll('#dlgBody tr')).map(t=>t.textContent).filter(t=>/^(Picture library|Respondent pages)/.test(t)));
    await page.evaluate(()=>$('#dlg').close());
    check('C offline: Diagnostics reports the picture library and the respondent pages as saved on this device, not "could not check"',dgo.length===2&&dgo.every(t=>/saved on this device/.test(t)),dgo.join(' | '));
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
    /* the respondent page carries its answers in the address after #: served from the copy, the address keeps it */
    const HASH='#v=1&pwa-test=keep-this-'+Date.now();
    await p2.goto(NBH+'respond.html'+HASH).catch(()=>{});await sleep(600);
    const rsp=await p2.evaluate(()=>({hash:location.hash,lib:typeof window.NBHRespond!=='undefined'||!!document.querySelector('script[src*="nbh-respond.js"]'),sw:!!navigator.serviceWorker.controller})).catch(e=>({err:String(e)}));
    const keys=await p2.evaluate(async s=>{const out=[];for(const n of await caches.keys())if(n.indexOf('nbh-offline:'+s)===0)for(const r of await (await caches.open(n)).keys())out.push(r.url);return out;},NBH).catch(()=>[]);
    check('C offline: respond.html opens from the copy with its #answers kept in the address, and no saved key carries a # or a ?',rsp.hash===HASH&&rsp.lib&&rsp.sw&&keys.length>50&&!keys.some(k=>/[#?]/.test(k)),JSON.stringify(rsp)+' keys '+keys.length+' odd '+keys.filter(k=>/[#?]/.test(k)).slice(0,2).join(' '));
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
    edit('workstation/nbh-pictos.js',s=>s+'\nwindow.__pictosV2=1;\n',true);
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
    edit('workstation/GB-1_Goal-and-Objective-Builder_v2026-09.html',s=>s.replace('<title>Form GB-1 · ','<title>Form GB-1 v3 · '),true);
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
    const rl=S.st.log.slice(mark).filter(e=>e.path==='/workstation/release.json');
    check('F a check asks about every file and release.json with If-None-Match and the website answers 304',rq.length===FILES.length&&rq.every(e=>e.inm&&e.status===304)&&rl.length===1&&rl[0].inm&&rl[0].status===304,rq.length+' asked, '+rq.filter(e=>e.status===304).length+' 304, '+rq.filter(e=>e.inm).length+' with If-None-Match; release.json '+JSON.stringify(rl));
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
    /* what other parts of the workstation keep on this device (Autosave and the like): Reset must leave it */
    await page.evaluate(async()=>{
      localStorage.setItem('pwa.test.keep','1');
      await new Promise(res=>{const q=indexedDB.open('pwa-test-keep',1);q.onupgradeneeded=()=>q.result.createObjectStore('d');q.onsuccess=()=>{const t=q.result.transaction('d','readwrite');t.objectStore('d').put('v','k');t.oncomplete=()=>{q.result.close();res();};};q.onerror=()=>res();});
      await (await caches.open('another-app-cache')).put('/x-keep',new Response('x'));
    });
    const mark=S.st.log.length;
    await page.evaluate(()=>PWA.open());await sleep(200);
    const nav=page.waitForNavigation({timeout:20000}).catch(()=>null);
    await page.click('#offReset');const q=await confirmDlg(page,true);await nav;await sleep(800);
    const fromWeb=S.st.log.slice(mark).some(e=>e.path==='/workstation/'&&e.status===200&&!e.inm);
    check('H Reset asks, then loads the page from the website with its address cleaned',/Reset the offline copy/.test(q)&&fromWeb&&page.url()===NBH,q+' '+page.url());
    const s2=await waitChip(page,/^Saved for offline use$/,120000);
    const cn3=await names(page,NBH);
    check('H the old copy is gone and a fresh one is saved',s2==='Saved for offline use'&&!cn3.includes(old)&&cn3.length===2,cn3.join(', '));
    const kept=await page.evaluate(async()=>({ls:localStorage.getItem('pwa.test.keep'),
      idb:await new Promise(res=>{const q=indexedDB.open('pwa-test-keep',1);q.onsuccess=()=>{try{const g=q.result.transaction('d').objectStore('d').get('k');g.onsuccess=()=>{res(g.result==='v');q.result.close();};}catch(e){res(false);}};q.onerror=()=>res(false);}),
      other:await caches.has('another-app-cache')}));
    check('H Reset leaves localStorage, IndexedDB and caches that are not the offline copy',kept.ls==='1'&&kept.idb===true&&kept.other===true,JSON.stringify(kept));
    await page.evaluate(async()=>{localStorage.removeItem('pwa.test.keep');indexedDB.deleteDatabase('pwa-test-keep');await caches.delete('another-app-cache');});
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
      try{localStorage.setItem('nbh.ws.autosave.on','off');localStorage.setItem('nbh.ws.autosave.v2','off');}catch(e){}
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
    /* an hour later (the worker's record is set back an hour) and with room again, an automatic check tries by itself */
    await c.send('Storage.overrideQuotaForOrigin',{origin:ORIGIN}).catch(()=>{});
    await qp.evaluate(async s=>{const c=await caches.open('nbh-offline:'+s+':state'),k=s+'__nbh-offline__/info';const r=await c.match(k);const i=r?await r.json():{};const t=Date.now()-61*60000;i.quotaAt=t;i.checkedAt=t;
      await c.put(k,new Response(JSON.stringify(i),{headers:{'Content-Type':'application/json'}}));},NBH);
    await qp.evaluate(()=>PWA.ask('check',{force:false},120000));
    const t2=await waitChip(qp,/^Saved for offline use$/,90000);
    check('M an hour after "no room", with room again, an automatic check (not Check for updates) makes the copy',t2==='Saved for offline use',t2);
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

  /* ================= O: a host that answers with something that is not the workstation ================= */
  if(want('O')){
    const octx=await br.newContext({viewport:{width:1440,height:900}});
    let op=await octx.newPage();wire(op,errs);
    await op.goto(NBH);
    const c0=await waitChip(op,/^Saved for offline use$/,120000);
    for(const mode of ['suspended','redirect']){
      if(mode==='suspended')S.st.suspended=true;else S.st.redirectAll=true;
      await op.evaluate(()=>PWA.ask('check',{force:true},120000));
      const s=await status(op);
      S.st.suspended=false;S.st.redirectAll=false;
      check('O a host answering every request with '+(mode==='suspended'?'its "Account Suspended" page':'a redirect to that page')+': nothing is taken, and the look says the answer was not the workstation’s',c0==='Saved for offline use'&&!s.staged&&s.result&&s.result.kind==='foreign',c0+' '+JSON.stringify(s.result));
    }
    /* closed, and opened again offline while the host still answers that way */
    S.st.suspended=true;
    await op.close();
    S.st.offline=true;await octx.setOffline(true);
    op=await octx.newPage();wire(op,errs);
    await op.goto(NBH).catch(()=>{});await sleep(900);
    const o1=await op.evaluate(()=>({t:document.title,forms:typeof FORMS!=='undefined'&&FORMS.length>0})).catch(e=>({err:String(e)}));
    check('O ... the next start, offline, is the workstation, not the holding page',o1.forms===true&&/Workstation/.test(o1.t),JSON.stringify(o1));
    /* the reset address, typed into the browser: offline it keeps the copy and says why */
    await op.goto(NBH+'?nbh-online=reset').catch(()=>{});await sleep(600);
    const o2=await op.evaluate(()=>document.body.innerText).catch(()=>'');
    const k2=await names(op,NBH).catch(()=>[]);
    check('O the reset address (?nbh-online=reset), offline: the page says resetting needs the internet, and the copy is kept',/was not reset/.test(o2)&&k2.length===2,o2.slice(0,90)+' / '+k2.length);
    S.st.offline=false;await octx.setOffline(false);
    /* online, but the host still shows its holding page: the copy is kept */
    await op.goto(NBH+'?nbh-online=reset').catch(()=>{});await sleep(600);
    const o2b=await op.evaluate(()=>document.body.innerText).catch(()=>'');
    const k2b=await names(op,NBH).catch(()=>[]);
    check('O ... online while the host shows a holding page: nothing is reset, the page says why, the copy is kept',/was not reset/.test(o2b)&&/did not answer with the workstation/.test(o2b)&&k2b.join()===k2.join(),o2b.slice(0,90)+' / '+k2b.length);
    S.st.suspended=false;
    const oldSet=k2.find(n=>n.indexOf(':set:')>0);
    const mark=S.st.log.length;
    await op.goto(NBH+'?nbh-online=reset');await sleep(1500);
    const fromWeb=S.st.log.slice(mark).some(e=>e.path==='/workstation/'&&e.q==='?nbh-online=reset'&&e.status===200);
    const o3=await waitChip(op,/^Saved for offline use$/,120000);
    const k3=await names(op,NBH);
    check('O ... online, without the shell: the page comes from the website, the old copy is deleted, a fresh one is saved',fromWeb&&!!oldSet&&!k3.includes(oldSet)&&k3.length===2&&o3==='Saved for offline use'&&op.url()===NBH,JSON.stringify({fromWeb,o3,url:op.url()})+' '+k3.join(', '));
    await octx.close();
  }

  /* ================= P: GoDaddy's snippet in every page ================= */
  if(want('P')){
    S.st.inject='stable';
    const pctx=await br.newContext({viewport:{width:1440,height:900}});
    await pctx.route('https://img1.wsimg.com/**',r=>r.abort());   /* the host's script itself is not reachable from here */
    const pp=await pctx.newPage();wire(pp,errs);
    await pp.goto(RPS);
    const c0=await waitChip(pp,/^Saved for offline use$/,120000);
    const ran=await pp.evaluate(()=>!!window._trfd);   /* the first visit's page, from the website, ran the snippet */
    const set=(await names(pp,RPS)).find(n=>n.indexOf(':set:')>0);
    const pages=FILES.filter(f=>/\.html$/.test(f));
    const sums=await pp.evaluate(async([c,base,files])=>{const cache=await caches.open(c),out={};for(const f of files){const r=await cache.match(base+f);if(!r){out[f]=null;continue;}const d=await crypto.subtle.digest('SHA-256',await r.arrayBuffer());out[f]=Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');}return out;},[set,RPS,pages]);
    const bad=pages.filter(f=>sums[f]!==sha(fs.readFileSync(path.join(SITE,'workstation-rps',f))));
    check('P through a host that injects its snippet into every page: each saved page is the file without it, byte for byte',c0==='Saved for offline use'&&ran&&!bad.length,c0+' snippet ran: '+ran+'; differ: '+bad.slice(0,4).join(', '));
    S.st.inject='vary';S.st.htmlNoValidators=true;
    const seen=[];
    for(let i=0;i<3;i++){await pp.evaluate(()=>PWA.ask('check',{force:true},120000));const s=await status(pp);seen.push(s.staged?'staged '+s.staged.files.length:(s.result&&s.result.kind));}
    S.st.htmlNoValidators=false;
    check('P a snippet different on every request, pages without ETag or Last-Modified: three looks, nothing taken for an update',seen.every(x=>x==='ok'),seen.join(' | '));
    await pctx.close();
    /* a snippet of a shape the worker does not know (its script on another website): the release list's lengths find
       it; the saved shell then does not wait for that script, which hangs */
    S.st.inject='stable';S.st.injectSrc=XO+'/traffic-assets/js/tccl.min.js';O.st.hang=0;
    const p2ctx=await br.newContext({viewport:{width:1440,height:900}});
    const p2=await p2ctx.newPage();wire(p2,errs);
    await p2.goto(NBH);
    const c1=await waitChip(p2,/^Saved for offline use$/,120000);
    const set2=(await names(p2,NBH)).find(n=>n.indexOf(':set:')>0);
    const saved=await p2.evaluate(async([c,u])=>{const r=await (await caches.open(c)).match(u);return r?await r.text():'';},[set2,NBH+'index.html']);
    O.st.hang=12000;
    const t0=Date.now();
    await p2.reload({waitUntil:'commit'});
    await p2.waitForFunction(()=>typeof openForm==='function'&&document.readyState!=='loading',null,{timeout:60000}).catch(()=>{});
    const ms=Date.now()-t0;
    O.st.hang=0;S.st.inject=null;S.st.injectSrc='';
    check('P a snippet of a shape not known (its script on another website): cut by the release list, so the saved shell does not wait for that script',c1==='Saved for offline use'&&!!saved&&saved.indexOf('tccl')<0&&saved===fs.readFileSync(path.join(SITE,'workstation','index.html'),'utf8')&&ms<4000,c1+' '+ms+' ms');
    await p2ctx.close();
  }

  /* ================= Q: two windows of one edition, and both editions open ================= */
  if(want('Q')){
    const QB=OWN('q');
    const qc=await br.newContext({viewport:{width:1440,height:900}});
    const a=await qc.newPage();wire(a,errs);
    await a.goto(QB);
    const c0=await waitChip(a,/^Saved for offline use$/,120000);
    edit('workstation-q/nbh-pictos.js',s=>s+'\nwindow.__pictosV2=1;\n',true);
    await a.evaluate(()=>PWA.check());
    const u0=await waitChip(a,/^Update ready$/,60000);
    const b=await qc.newPage();wire(b,errs);
    await b.goto(QB);await sleep(1200);
    check('Q a second window of the edition shows the strip too',c0==='Saved for offline use'&&u0==='Update ready'&&await b.evaluate(()=>!document.querySelector('#pwaBar').hidden));
    await a.click('#pwaReload');
    await a.waitForFunction(()=>document.querySelector('#cfDlg')&&document.querySelector('#cfDlg').open,null,{timeout:8000}).catch(()=>{});
    const msg=await a.evaluate(()=>{const c=document.querySelector('#cfDlg'),t=c&&c.open?c.innerText:'';if(c&&c.open){const bs=[...c.querySelectorAll('#cfFoot button')];bs[bs.length-1].click();}return t;});
    const aOld=await a.evaluate(async()=>(await (await fetch('nbh-pictos.js')).text()).indexOf('__pictosV2')<0);
    await openIn(b,'SM-1');
    const bpic=await frameOf(b,'SM-1_').evaluate(()=>!!window.__pictosV2);
    check('Q Reload in one window while another is open: nothing is swapped (neither window gets new files) and it says to close the other window first',aOld&&!bpic&&/Close the other workstation window/.test(msg),msg.replace(/\s+/g,' ').slice(0,200));
    await b.close();await sleep(500);
    const nav=a.waitForNavigation({timeout:20000}).catch(()=>null);
    await a.click('#pwaReload');await nav;await sleep(1200);
    check('Q ... once the other window is closed, Reload swaps and the new files are in use',await a.evaluate(async()=>(await (await fetch('nbh-pictos.js')).text()).indexOf('__pictosV2')>=0));
    /* both editions open in one browser, an update to one of them */
    const r=await qc.newPage();wire(r,errs);
    await r.goto(RPS);
    const c1=await waitChip(r,/^Saved for offline use$/,120000);
    edit('workstation-q/GB-1_Goal-and-Objective-Builder_v2026-09.html',s=>s.replace('<title>Form GB-1 · ','<title>Form GB-1 v2 · '),true);
    await a.evaluate(()=>PWA.check());
    const u1=await waitChip(a,/^Update ready$/,60000);
    await sleep(1000);
    const rs=await r.evaluate(()=>({chip:document.querySelector('#offChip').textContent,bar:!document.querySelector('#pwaBar').hidden,scope:PWA.st&&PWA.st.scope}));
    check('Q two editions open in one browser, an update to one: the other’s shell shows only its own worker (no Update ready, no strip)',u1==='Update ready'&&c1==='Saved for offline use'&&rs.chip==='Saved for offline use'&&!rs.bar&&rs.scope===RPS,JSON.stringify(rs));
    await qc.close();
  }

  /* ================= R: taps after a Save case ================= */
  if(want('R')){
    const RB=OWN('r');
    const rc=await br.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
    const rp=await rc.newPage();wire(rp,errs);
    await rp.goto(RB);await waitChip(rp,/^Saved for offline use$/,120000);
    await openIn(rp,'MT-1');await sleep(800);
    const fr=frameOf(rp,'MT-1_');
    await fr.evaluate(()=>{const e=document.querySelector('[data-m="beh"]')||document.querySelector('input[type=text],textarea');e.value='Out of seat';e.dispatchEvent(new Event('input',{bubbles:true}));});
    await sleep(4500);
    await rp.fill('#pClient','Tap Student');await sleep(300);
    const dl=rp.waitForEvent('download',{timeout:15000}).catch(()=>null);
    await rp.evaluate(()=>$('#saveCase').click());await dl;await sleep(800);
    await rp.evaluate(()=>{const d=document.querySelector('#dlg');if(d&&d.open)d.close();const c=document.querySelector('#cfDlg');if(c&&c.open){const bs=[...c.querySelectorAll('#cfFoot button')];bs[bs.length-1].click();}});await sleep(300);
    const plus=fr.locator('td button',{hasText:/^\s*\+\s*$/});const np=Math.min(12,await plus.count());
    for(let i=0;i<np;i++)await plus.nth(i).click().catch(()=>{});
    await sleep(4500);
    const dirty=await rp.evaluate(()=>caseDirty());
    edit('workstation-r/GB-1_Goal-and-Objective-Builder_v2026-09.html',s=>s.replace('<title>Form GB-1 · ','<title>Form GB-1 v2 · '),true);
    await rp.evaluate(()=>PWA.check());
    await waitChip(rp,/^Update ready$/,60000);
    const strip=await rp.evaluate(()=>document.querySelector('#pwaText').textContent);
    await rp.click('#pwaReload');
    const q=await confirmDlg(rp,false);await sleep(400);
    const kept=await rp.evaluate(()=>!!state.frames['MT-1']);
    /* the shell's own check may see the taps too (Autosave v2 counts them as edits): then the question is the one for
       typed work; either way Reload must ask */
    check('R taps that score intervals after a Save case: the strip says to save first, Reload asks, Not now keeps the form',np>=6&&/save the case first/i.test(strip)&&(dirty?/Reload without saving/.test(q):/since the last Save case/.test(q))&&kept,JSON.stringify({np,dirty,strip:strip.slice(0,110),q:q.replace(/\s+/g,' ').slice(0,140),kept}));
    await rc.close();
  }

  /* ================= S: the folder's password ================= */
  if(want('S')){
    const SB=OWN('s');
    S.st.authMount='/workstation-s/';
    /* every request a script makes is refused, the worker's and the page's: no copy can be made */
    S.st.authMode='fetch';
    const s1=await br.newContext({viewport:{width:1440,height:900}});const sp=await s1.newPage();wire(sp,errs);
    await sp.goto(SB);
    const t1=await waitChip(sp,/^Not saved for offline use/,60000);await sleep(800);
    const ui=await sp.evaluate(()=>({bar:!document.querySelector('#pwaBar').hidden,t:document.querySelector('#pwaText').textContent,sign:!document.querySelector('#pwaSign').hidden}));
    check('S the password refuses every request a script makes: the chip says to sign in and the strip offers Sign in',t1==='Not saved for offline use: sign in'&&ui.bar&&ui.sign&&/password/.test(ui.t),t1+' '+JSON.stringify(ui));
    await s1.close();
    /* the worker's own requests refused, the page's carry the sign-in: the copy is made through the page */
    S.st.authMode='worker';
    const mark=S.st.log.length;
    const s2=await br.newContext({viewport:{width:1440,height:900}});const sp2=await s2.newPage();wire(sp2,errs);
    await sp2.goto(SB);
    const t2=await waitChip(sp2,/^Saved for offline use$|^Not saved/,120000);
    const via=S.st.log.slice(mark).filter(e=>e.path.indexOf('/workstation-s/')===0&&/nbh-online=fetch/.test(e.q)&&e.status===200).length;
    const set=(await names(sp2,SB)).find(n=>n.indexOf(':set:')>0);
    const odd=set?await sp2.evaluate(async([c,base,files])=>{const cache=await caches.open(c),out=[];for(const f of files){const r=await cache.match(base+f);if(!r){out.push(f+' missing');continue;}if(r.status!==200)out.push(f+' '+r.status);else if(/401 sign in/.test((await r.clone().text()).slice(0,200)))out.push(f+' 401 page');}return out;},[set,SB,FILES]):['no set'];
    check('S the worker’s own requests refused, the page’s carrying the sign-in: the copy is made through the page, and no 401 is saved',t2==='Saved for offline use'&&via>=FILES.length-2&&!odd.length,t2+' via the page: '+via+' '+odd.slice(0,4).join(', '));
    await s2.close();
    /* a page not saved here, the whole folder behind the password: the worker offers a Sign in that goes past it */
    S.st.authMode=null;
    const s3=await br.newContext({viewport:{width:1440,height:900}});const sp3=await s3.newPage();wire(sp3,errs);
    await sp3.goto(SB);await waitChip(sp3,/^Saved for offline use$/,120000);
    S.st.auth=true;
    await sp3.goto(SB+'README.txt').catch(()=>{});await sleep(300);
    const txt=await sp3.evaluate(()=>document.body.innerText).catch(()=>'');
    const href=await sp3.evaluate(()=>{const x=document.querySelector('a');return x?x.href:'';}).catch(()=>'');
    const m2=S.st.log.length;
    if(href)await sp3.goto(href).catch(()=>{});await sleep(300);
    const past=S.st.log.slice(m2).some(e=>e.path==='/workstation-s/README.txt'&&/nbh-online=signin/.test(e.q)&&e.status===401);
    check('S a page not saved here, behind the password: the page offers Sign in, a load past the worker that the website answers with its challenge',/needs the website’s password/.test(txt)&&/[?&]nbh-online=signin/.test(href)&&past,txt.slice(0,70)+' | '+href+' | past: '+past);
    S.st.auth=false;S.st.authMount=null;
    await s3.close();
  }

  /* ================= T: the release list during uploads ================= */
  if(want('T')){
    const TB=OWN('t'),W=path.join(SITE,'workstation-t');
    const tc=await br.newContext({viewport:{width:1440,height:900}});const tp=await tc.newPage();wire(tp,errs);
    await tp.goto(TB);
    const c0=await waitChip(tp,/^Saved for offline use$/,120000);
    const CF='CF-1_Contextual-Fit-Assessment_v2026-09.html',TK='TK-1_Token-Board-Book_v2026-10.html',GB='GB-1_Goal-and-Objective-Builder_v2026-09.html',SV='SV-1_Social-Validity_v2026-09.html';
    /* the next release, made beside the website: two forms changed, and its own release.json */
    const NEXT=path.join(SITE,'next-t');fs.rmSync(NEXT,{recursive:true,force:true});fs.cpSync(W,NEXT,{recursive:true});
    for(const [f,x,y] of [[CF,'<title>Form CF-1 · ','<title>Form CF-1 v2 · '],[TK,'<title>Form TK-1 · ','<title>Form TK-1 v2 · ']]){const p=path.join(NEXT,f),s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replace(x,y));}
    cp.execFileSync('python3',[path.join(ROOT,'tools','pwa-sw.py'),NEXT],{stdio:'pipe'});
    const up=f=>{fs.copyFileSync(path.join(NEXT,f),path.join(W,f));touch(path.join(W,f));};
    const look=async()=>{await tp.evaluate(()=>PWA.ask('check',{force:true},120000));return status(tp);};
    up('release.json');
    let st=await look();
    check('T release.json up before the files (an upload under way): nothing is taken, and the look says the files do not match their list yet',c0==='Saved for offline use'&&!st.staged&&st.result&&st.result.kind==='mismatch',JSON.stringify(st.result));
    up(CF);
    st=await look();
    check('T one of the two changed forms up: still nothing taken',!st.staged&&st.result&&st.result.kind==='mismatch'&&st.result.path===TK,JSON.stringify(st.result));
    const full=fs.readFileSync(path.join(NEXT,TK));fs.writeFileSync(path.join(W,TK),full.subarray(0,Math.floor(full.length/2)));touch(path.join(W,TK));
    st=await look();
    check('T the other form up but cut short: nothing taken',!st.staged&&st.result&&/^(mismatch|foreign)$/.test(st.result.kind),JSON.stringify(st.result));
    up(TK);
    st=await look();
    check('T the whole upload up: both forms are staged',!!st.staged&&st.staged.files.slice().sort().join()===[CF,TK].sort().join(),JSON.stringify(st.staged));
    const nav=tp.waitForNavigation({timeout:20000}).catch(()=>null);
    await tp.click('#pwaReload');await nav;await sleep(1200);
    await openIn(tp,'CF-1');const t1=await frameOf(tp,'CF-1_').evaluate(()=>document.title);await closeCur(tp);
    edit('workstation-t/'+GB,s=>s.replace('<title>Form GB-1 · ','<title>Form GB-1 v3 · '));
    st=await look();
    check('T a single file uploaded on its own, release.json left as it was: it still arrives',/^Form CF-1 v2 · /.test(t1)&&!!st.staged&&st.staged.files.join()===GB,t1+' '+JSON.stringify(st.staged)+' '+JSON.stringify(st.result));
    {const p=path.join(W,'release.json'),b=fs.readFileSync(p);fs.writeFileSync(p,b.subarray(0,200));touch(p);}
    edit('workstation-t/'+SV,s=>s.replace('<title>Form SV-1 · ','<title>Form SV-1 v2 · '));
    st=await look();
    check('T a release.json damaged in the upload counts as none: every file is checked on its own and the change arrives',!!st.staged&&st.staged.files.includes(SV),JSON.stringify(st.staged)+' '+JSON.stringify(st.result));
    await tc.close();
  }

  /* ================= U: installed on an iPad: windows and printing ================= */
  if(want('U')){
    const uctx=await br.newContext({viewport:{width:1180,height:820},userAgent:IPAD,hasTouch:true});
    await uctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'standalone',{get:()=>true,configurable:true});try{localStorage.setItem('nbh.ws.autosave.on','off');localStorage.setItem('nbh.ws.autosave.v2','off');}catch(e){}});
    let pops=0;uctx.on('page',()=>pops++);
    const up=await uctx.newPage();wire(up,errs);pops=0;
    await up.goto(NBH);await sleep(1200);
    const inApp=await up.evaluate(()=>!!(window.nbhShareSave&&window.nbhShareSave.inApp));
    const overlay=()=>up.evaluate(()=>{const o=document.querySelector('[id^="nbhInApp"]');if(!o)return null;const f=o.querySelector('iframe');let inner='';try{inner=f.contentDocument&&f.contentDocument.body?f.contentDocument.body.innerText:'';}catch(e){}
      return {bar:Array.from(o.querySelectorAll('button')).map(b=>b.textContent).join(' '),title:(o.querySelector('b')||{}).textContent,inner:inner.slice(0,400),top:o.matches(':modal')};});
    /* the pop-up test in Diagnostics: its window opens inside the app, above the Diagnostics notice */
    await up.evaluate(()=>$('#diag').click());await sleep(400);
    await up.evaluate(()=>{const b=[...document.querySelectorAll('#dlgBody button')].find(x=>/Test pop-ups/.test(x.textContent));if(b)b.click();});
    await sleep(600);
    const o1=await overlay();
    check('U installed on an iPad: the pop-up test opens inside the app, above the notice, with Print and Close, and no window of its own',inApp&&!!o1&&/Pop-ups are allowed/.test(o1.inner)&&/Print/.test(o1.bar)&&/Close/.test(o1.bar)&&o1.top&&pops===0,JSON.stringify(o1)+' pops '+pops);
    await up.evaluate(()=>{const o=document.querySelector('[id^="nbhInApp"]');const b=o&&[...o.querySelectorAll('button')].find(x=>x.textContent==='Close');if(b)b.click();});
    check('U ... Close takes it away',await up.evaluate(()=>!document.querySelector('[id^="nbhInApp"]')));
    await up.evaluate(()=>{const d=document.querySelector('#dlg');if(d&&d.open)d.close();});
    /* the master print: built into the window inside the app, then printed from it */
    await openIn(up,'PD-1');await sleep(600);
    await up.evaluate(()=>{state.ticked={'PD-1':true};});
    await up.evaluate(()=>$('#masterPrint').click());
    await up.waitForFunction(()=>{const o=document.querySelector('[id^="nbhInApp"]'),f=o&&o.querySelector('iframe');try{return !!(f&&f.contentDocument&&f.contentDocument.body&&/PD-1|Performance Diagnostic/.test(f.contentDocument.body.innerText));}catch(e){return false;}},null,{timeout:40000}).catch(()=>{});
    await sleep(4500);
    const o2=await overlay();
    const note=await up.evaluate(()=>{const o=document.querySelector('[id^="nbhInApp"]');const n=o&&o.querySelector('[role="status"]');return n?n.textContent:'';});
    check('U the master print is built inside the app (no window of its own), with Print and Close',!!o2&&/PD-1|Performance Diagnostic/.test(o2.inner)&&/Print/.test(o2.bar)&&pops===0,JSON.stringify(o2&&{title:o2.title,bar:o2.bar,inner:o2.inner.slice(0,80)})+' note: '+note.slice(0,80));
    await up.evaluate(()=>{const o=document.querySelector('[id^="nbhInApp"]');const b=o&&[...o.querySelectorAll('button')].find(x=>x.textContent==='Close');if(b)b.click();});
    /* Own tab: the form fills the window instead of a window of its own */
    await up.click('#popOut');await sleep(600);
    const full=await up.evaluate(()=>document.body.classList.contains('ws-full'));
    check('U Own tab, installed on an iPad: the form fills the window here instead of opening Safari',full&&pops===0,'full '+full+' pops '+pops);
    await uctx.close();
  }

  /* ================= V: the browser stops the worker during the first save ================= */
  if(want('V')){
    const vb=await chromium.launch();
    const vctx=await vb.newContext({viewport:{width:1440,height:900}});const vp=await vctx.newPage();wire(vp,errs);
    const cdp=await vctx.newCDPSession(vp);await cdp.send('ServiceWorker.enable');
    for(const f of FILES)if(/^(TK-1|PA-1|EA-1|TD-1|OB-1)_|^nbh-pictos/.test(f))S.st.delay[f]=2500;
    await vp.goto(RPS);
    let seen='';const t0=Date.now();
    while(Date.now()-t0<60000){const t=await chip(vp);const m=/^Saving for offline use: (\d+) of/.exec(t);if(m&&+m[1]>=10){seen=t;break;}await sleep(50);}
    await cdp.send('ServiceWorker.stopAllWorkers');
    S.st.delay={};
    const a=await waitChip(vp,/^Not saved for offline use yet$/,15000);
    const done=await waitChip(vp,/^Saved for offline use$/,120000);
    check('V the browser stops the worker half way through the first save: the chip says so, and the save begins again by itself',!!seen&&a==='Not saved for offline use yet'&&done==='Saved for offline use',seen+' / '+a+' / '+done);
    await vb.close();
  }

  check('no script errors on any page',!errs.length,errs.slice(0,6).join(' | '));
  await br.close();await S.close();O.srv.close();
  console.log('\n'+passes+' passed, '+fails+' failed');
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
