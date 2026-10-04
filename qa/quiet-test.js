/* v21.44 a form that does not answer: the shell looks into its frame and says why (index.html quietForm/frameCheck).
   Five small websites serve the edition with Form TK-1 broken one way each (none, a script error in the bridge, the
   file cut short, the browser's messages to the form dropped, the file missing), behind a folder password and with
   the host's monitoring snippet put into every page, as GoDaddy's cPanel does. Each must give its own reason; the
   dropped messages must be repaired (the shell then hands its messages to the form directly and TK-1 answers); IC-1,
   opened after, must answer in every case.  usage: node qa/quiet-test.js [EDITION]   EDITION defaults to RPS-Workstation */
const {chromium,ROOT,sleep}=require(__dirname+'/lib.js');
const http=require('http'),fs=require('fs'),path=require('path');
const ED=process.argv[2]||'RPS-Workstation',DIR=path.join(ROOT,ED),MOUNT='/'+ED+'/';
const TK=fs.readdirSync(DIR).find(f=>/^TK-1_.*\.html$/.test(f));
const SNIP="<script>'undefined'=== typeof _trfq || (window._trfq = []);'undefined'=== typeof _trfd && (window._trfd=[]),_trfd.push({'tccl.baseHost':'secureserver.net'},{'ap':'cpsh-oh'}) // Monitoring performance</script><script src='https://img1.wsimg.com/traffic-assets/js/tccl.min.js'></script>";
const AUTH='Basic '+Buffer.from('staff:pw').toString('base64');
const TYPES={html:'text/html',js:'application/javascript',json:'application/json',png:'image/png',webp:'image/webp',svg:'image/svg+xml',md:'text/plain',txt:'text/plain'};
function serve(mode){
  return new Promise(ok=>{const srv=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://h');
    if(u.pathname.indexOf(MOUNT)!==0){res.writeHead(404);return res.end();}
    if(req.headers.authorization!==AUTH){res.writeHead(401,{'WWW-Authenticate':'Basic realm="ws"','Content-Type':'text/html'});return res.end('<html><body>401</body></html>');}
    let rel=decodeURIComponent(u.pathname.slice(MOUNT.length));if(!rel)rel='index.html';
    const f=path.join(DIR,rel);
    if((mode==='missing'&&rel===TK)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404,{'Content-Type':'text/html'});return res.end('<html><body>404</body></html>');}
    const ext=rel.split('.').pop().toLowerCase();let body=fs.readFileSync(f);
    if(ext==='html'){let s=body.toString('utf8');
      if(rel===TK){
        if(mode==='syntax')s=s.replace('(function(){\n  if (window.top === window.self)','(function(){ var = ;\n  if (window.top === window.self)');
        if(mode==='trunc')s=s.slice(0,Math.floor(s.length*0.6));
        if(mode==='lost')s=s.replace('<head>','<head><script>window.addEventListener("message",function(e){if(e.isTrusted&&e.data&&e.data.nbh)e.stopImmediatePropagation();},true);</script>');
      }
      const i=s.indexOf('</head>');if(i>=0)s=s.slice(0,i)+SNIP+s.slice(i);
      body=Buffer.from(s,'utf8');}
    res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
  });srv.listen(0,'127.0.0.1',()=>ok(srv));});
}
const CASES=[
  ['none',r=>r.st&&!r.direct,'TK-1 answers as usual'],
  ['syntax',r=>!r.st&&/not this release/.test(r.crumb)&&/Unexpected token/.test(r.body),'a changed file with a script error: not this release’s, the script named'],
  ['trunc',r=>!r.st&&/cut short/.test(r.crumb)&&/ends early/.test(r.body),'a file cut short: says so'],
  ['lost',r=>r.st&&r.direct,'messages dropped: repaired, TK-1 answers through the direct route'],
  ['missing',r=>!r.st&&/not on the website/.test(r.crumb)&&/404/.test(r.body),'a missing file: the website’s 404 named'],
];
(async()=>{
  if(!TK){console.log('no Form TK-1 in '+ED);process.exit(1);}
  const br=await chromium.launch();let fails=0;
  await Promise.all(CASES.map(async([mode,ok,what])=>{
    const srv=await serve(mode),base='http://127.0.0.1:'+srv.address().port+MOUNT;
    const ctx=await br.newContext({viewport:{width:1366,height:1024},httpCredentials:{username:'staff',password:'pw'}});
    await ctx.route(/wsimg\.com/,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
    const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(base);await sleep(2500);
    await page.evaluate(()=>openForm('TK-1'));
    await page.waitForFunction(()=>state.status['TK-1']||/Why\?/.test(document.querySelector('#crumbStatus').textContent)&&!/checking/.test(document.querySelector('#crumbStatus').textContent),null,{timeout:30000}).catch(()=>{});
    await sleep(500);
    const r=await page.evaluate(()=>({crumb:document.querySelector('#crumbStatus').textContent,st:!!state.status['TK-1'],direct:!!state.frames['TK-1'].__direct}));
    r.body='';
    if(!r.st){await page.evaluate(()=>document.querySelector('#crumbStatus button').click());await sleep(300);
      r.body=await page.evaluate(()=>document.querySelector('#dlgBody').innerText);
      await page.evaluate(()=>document.querySelector('#dlg').close());}
    await page.evaluate(()=>openForm('IC-1'));
    const ic=await page.waitForFunction(()=>!!state.status['IC-1'],null,{timeout:20000}).then(()=>true).catch(()=>false);
    const shellErr=errs.filter(e=>!(mode==='syntax'&&/Unexpected token/.test(e))&&!(mode==='trunc'&&/Invalid or unexpected token|Unexpected end/.test(e)));
    const pass=ok(r)&&ic&&!shellErr.length;if(!pass)fails++;
    console.log((pass?'PASS ':'FAIL ')+mode.padEnd(8)+what+'  '+JSON.stringify({crumb:r.crumb.slice(0,90),st:r.st,direct:r.direct,ic,errs:shellErr.slice(0,2)})+(pass?'':'\n'+r.body));
    await ctx.close();srv.close();
  }));
  await br.close();
  console.log(fails?fails+' of '+CASES.length+' failed':'ALL OK '+CASES.length+' cases');process.exit(fails?1:0);
})();
