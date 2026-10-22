/* v23.95 the website's password: the window fetches for the offline copy's worker only while the session holds the sign-in,
   so an iPad that keeps no password is not asked every few minutes; Sign in grants it, a 401 ends it. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 let hits=0,status=200;await p.route(/nbh-online=fetch/,r=>{hits++;status===401?r.fulfill({status:401,headers:{'WWW-Authenticate':'Basic realm="x"'},body:''}):r.continue();});
 await p.goto(URL+'index.html');await p.waitForTimeout(1200);
 const relay=async()=>p.evaluate(async()=>{const ch=new MessageChannel();const got=new Promise(res=>{const L=[];ch.port1.onmessage=e=>{L.push(e.data);if(!(e.data||{}).ack)res(L);};setTimeout(()=>res(L),4000);});
   const scope=new URL('./',location.href).href;window.__nbhRelay({data:{nbh:'offline',type:'fetch',url:scope+'release.json',headers:{}},ports:[ch.port2],source:{scriptURL:new URL('sw.js',scope).href}});
   const L=await got;const last=L[L.length-1]||{};return {acked:L.some(x=>x&&x.ack),ok:!!last.ok,status:last.status||0,held:sessionStorage.getItem('nbh.pwa.cred')};});
 await p.evaluate(()=>{window.__nbhStandalone=true;});let r=await relay();
 ok('the installed app (standalone) holds no sign-in at launch: the window declines the worker\'s request without fetching (no sign-in box can appear)',!r.acked&&!r.ok&&hits===0,{r,hits});
 await p.evaluate(()=>{window.__nbhStandalone=false;});r=await relay();
 ok('in a browser tab one try a session is allowed (the browser may keep the password): it fetches, answers 200, and the session then holds the sign-in',r.acked&&r.ok&&r.status===200&&hits===1&&r.held==='1',{r,hits});
 status=401;r=await relay();
 ok('a 401 ends the session\'s sign-in: the file is reported as 401 and the sign-in is dropped',r.ok&&r.status===401&&r.held===null,{r,hits});
 status=200;r=await relay();
 ok('after that the window declines again until Sign in (the one try is spent)',!r.acked&&!r.ok&&hits===2,{r,hits});
 await p.goto(URL+'index.html?nbh-online=signin');await p.waitForTimeout(1200);
 ok('a page loaded through Sign in holds the sign-in for the session',await p.evaluate(()=>sessionStorage.getItem('nbh.pwa.cred')==='1'));
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
