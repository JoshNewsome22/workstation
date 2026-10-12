/* v21.88 short links and the email's button: Form IA-1's Send all due now in the workstation (Google's sign-in and Gmail
   simulated) sends each informant an email with a short link (respond.html#q=<id>.<key>, the questionnaire kept sealed on the
   reply box) as text and as a page with a button; the link opens on a phone and the answer comes back; Copy link and the QR
   code use the short link; a box that cannot keep it (before v21.88) leaves the long link; an unknown, cut or unreachable
   short link says so; old long links still open; a sign-in that did not allow sending is not kept and Google is asked again;
   Sign in and send waits for Google's sign-in to load. Simulated student and people only. Needs php on the PATH.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2188-short-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2188-short';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.SHORT_BOX_PORT||18164),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
/* the parts of an email Gmail was given (text, and the page when there is one) */
function mime(raw){const dec=b=>Buffer.from(String(b||'').replace(/\r\n/g,''),'base64').toString('utf8');const head=raw.split('\r\n\r\n')[0];
  const bm=/boundary="([^"]+)"/.exec(head);if(!bm)return {head,text:dec(raw.split('\r\n\r\n').slice(1).join('\r\n\r\n')),html:''};
  const parts=raw.split('--'+bm[1]).slice(1,-1),o={head,text:'',html:''};
  parts.forEach(p=>{const i=p.indexOf('\r\n\r\n'),h=p.slice(0,i),b=p.slice(i+4);if(/text\/plain/.test(h))o.text=dec(b);if(/text\/html/.test(h))o.html=dec(b);});return o;}
const SHORT_RE=/https?:\/\/\S+?respond\.html#q=[A-Za-z0-9]{10}\.[A-Za-z0-9_-]{22}(?:&u=\S+)?/;
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false,ping=null;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');ping=await r.json();up=!!(ping||{}).ok;}catch(e){}}
  ok('0 box.php answers and keeps short links (v 2)',up&&ping.v===2&&ping.short===true,ping);if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  let sent=[],grant='all',gsi=true,asks=[];
  await ctx.exposeFunction('__grant',()=>grant);await ctx.exposeFunction('__ask',p=>{asks.push(p);});
  await ctx.addInitScript(()=>{window.__gsAsk=0;
    window.__gsiInstall=()=>{window.google={accounts:{oauth2:{hasGrantedAllScopes(r,sc){return r.scope.indexOf(sc)>=0;},
      initTokenClient(cfg){return {requestAccessToken(o){window.__gsAsk++;window.__ask(o&&o.prompt||'');window.__grant().then(g=>setTimeout(()=>cfg.callback({access_token:'simulated-mail-token',expires_in:3600,scope:g==='all'?'https://www.googleapis.com/auth/gmail.send email':'email'}),20));}};}}}};};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  /* Google's sign-in script: installed when the page asks for it, after a delay the test can hold back */
  let gsiHold=false;
  await ctx.route('https://accounts.google.com/**',async r=>{while(gsiHold)await sleep(100);return r.fulfill({contentType:'text/javascript',body:'window.__gsiInstall&&window.__gsiInstall();'});});
  await ctx.route('https://www.googleapis.com/oauth2/v3/userinfo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({email:'simulated.bcba@palmbeachschools.org'})}));
  await ctx.route('https://gmail.googleapis.com/**',async r=>{const b=JSON.parse(r.request().postData()||'{}'),raw=Buffer.from(String(b.raw||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
    sent.push(Object.assign({raw},mime(raw)));return r.fulfill({contentType:'application/json',body:JSON.stringify({id:'m'+sent.length})});});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};window.__toasts=[];const t0=wsUI.toast;wsUI.toast=(m,o)=>{window.__toasts.push(String(m));return t0(m,o);};
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  await page.evaluate(()=>openForm('IA-1'));await page.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1500);
  const ia=page.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  await ia.evaluate(u=>{window.confirm=()=>true;try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}
    const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set('m.client','Mateo Rivera');set('m.sid','4471823');set('m.email','simulated.bcba@palmbeachschools.org');set('m.assessor','J. Newsome');set('rp.box',u);
    set('m.beh','Hitting');set('m.def','Forceful contact of an open or closed hand with a peer or adult.');
    [['Ms. Lopez','lopez@example.org','Teacher'],['Mr. Okafor','okafor@example.org','Para']].forEach((p,i)=>{set('inf['+i+'].name',p[0]);set('inf['+i+'].email',p[1]);set('inf['+i+'].role',p[2]);});},BOXURL);
  await ia.evaluate(()=>document.querySelector('#viewSeg button[data-view="outs"]').click());await sleep(300);
  await ia.evaluate(()=>{document.querySelectorAll('#outPlan [data-oi]').forEach(c=>{if(c.checked!==(c.dataset.oi==='fast'))c.click();});document.querySelector('#outPlan').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#outPlanBtn').click();});await sleep(400);
  await ia.evaluate(async()=>{await __rp.ensure();});
  /* Sign in and send waits while Google's sign-in loads */
  gsiHold=true;await page.evaluate(()=>{delete window.google;clGsi=null;});
  await ia.evaluate(()=>document.querySelector('#outSendDue').click());
  await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:15000}).catch(()=>{});await sleep(300);
  const w1=await page.evaluate(()=>{const b=[...document.querySelectorAll('#cfFoot button')].pop();return {t:b.textContent,dis:b.disabled};});
  gsiHold=false;await page.waitForFunction(()=>{const b=[...document.querySelectorAll('#cfFoot button')].pop();return b&&!b.disabled;},null,{timeout:10000}).catch(()=>{});
  const w2=await page.evaluate(()=>{const b=[...document.querySelectorAll('#cfFoot button')].pop();return {t:b.textContent,dis:b.disabled};});
  ok('1 Sign in and send waits for Google’s sign-in: “Loading Google’s sign-in…” and not pressable, then Sign in and send',w1.dis&&/Loading Google/.test(w1.t)&&!w2.dis&&w2.t==='Sign in and send',{w1,w2});
  /* a sign-in without permission to send */
  grant='none';await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send/.test(b.textContent)).click());await sleep(1500);
  const g1=await page.evaluate(()=>({tok:sessionStorage.getItem('nbh.google.mail'),reask:GM.reask,toast:window.__toasts.slice(-1)[0]||''}));
  ok('2 a sign-in that did not allow sending: nothing sent, the sign-in not kept, the person told to allow “Send email on your behalf”',sent.length===0&&!g1.tok&&g1.reask===true&&/Send email on your behalf/.test(g1.toast),{n:sent.length,g1});
  await page.waitForFunction(()=>!!document.querySelector('.nbh-mail'),null,{timeout:8000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('.nbh-mail');if(d){try{d.close();}catch(e){}d.remove();}});await sleep(300);
  /* again: Google is asked with every permission shown, and this time it is allowed */
  grant='all';await ia.evaluate(()=>document.querySelector('#outSendDue').click());
  await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:15000}).catch(()=>{});await sleep(300);
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send/.test(b.textContent)).click());
  for(let i=0;i<60&&sent.length<2;i++)await sleep(250);await sleep(1000);
  ok('3 asked again, Google is asked with every permission shown (prompt consent), and the two emails go',asks.slice(-1)[0]==='consent'&&sent.length===2,{asks,n:sent.length});
  const m0=sent[0]||{},S0=(m0.text.match(SHORT_RE)||[''])[0],H0=/href="([^"]+)"[^>]*>Open the questionnaire</.exec(m0.html||'');
  ok('4 each email holds a short link (under 200 characters, #q=<id>.<key>) as text, and a page with an “Open the questionnaire” button to the same link',!!S0&&S0.length<200&&!!H0&&H0[1].replace(/&amp;/g,'&')===S0&&/multipart\/alternative/.test(m0.head)&&!/#z=|#p=/.test(m0.text+m0.html),{len:S0.length,link:S0.slice(0,160),head:m0.head&&m0.head.slice(0,300),html:(m0.html||'').slice(0,300)});
  const qfiles=fs.readdirSync(data+'/_q');const qraw=qfiles.map(f=>fs.readFileSync(data+'/_q/'+f,'utf8')).join('\n');
  ok('5 the site keeps each questionnaire sealed: one file a link, nothing readable (no names, behavior, initials or definition)',qfiles.length===2&&!/Mateo|Rivera|M\.R\.|Lopez|Okafor|Hitting|Forceful|example\.org|palmbeach/i.test(qraw)&&/"ct":"[A-Za-z0-9_-]{100,}"/.test(qraw),{n:qfiles.length,raw:qraw.slice(0,200)});
  /* the teacher opens the short link on her phone and answers */
  const rctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const rp=await rctx.newPage();const rerr=[];rp.on('pageerror',e=>rerr.push(e.message));
  await rp.goto(S0);await rp.waitForFunction(()=>document.querySelectorAll('li.it').length>0,null,{timeout:10000}).catch(()=>{});
  const who=await rp.evaluate(()=>{const g=document.querySelectorAll('.grid2 input[type=text]');return {name:g[0]&&g[0].value,ro:g[0]&&g[0].readOnly,items:document.querySelectorAll('li.it').length};});
  await rp.evaluate(()=>{document.querySelectorAll('li.it').forEach((li,i)=>{const r=li.querySelector('input[value="'+['Y','N','Y','NA'][i%4]+'"]');if(r)r.click();});
    const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value='Independent work '+(i+1);});document.querySelector('button:not(.ghost)').click();});await sleep(1800);
  const done=await rp.evaluate(()=>(document.querySelector('#nbhr-done')||{}).innerHTML||'');
  ok('6 the short link opens the questionnaire on a phone with her name filled and locked; she answers and presses Send: Sent.',who.name==='Ms. Lopez'&&who.ro&&who.items>=10&&/<b>Sent\.<\/b>/.test(done)&&!rerr.length,{who,done:done.slice(0,160),rerr});
  const col=await ia.evaluate(async()=>{const r=await window.__nbhBoxCollect();return {r,outs:__rp.outs().map(o=>o.inf+':'+(o.placed?'placed':o.got?'got':o.sent?'sent':'-'))};});
  ok('7 IA-1 collects her answers from the reply box as before',col.r&&col.r.ok&&col.r.placed===1&&col.outs.indexOf('A:placed')>=0,col);
  /* Copy link and the QR code use the short link */
  await ia.evaluate(()=>{document.getElementById('rpBtn').click();});await sleep(500);
  await ia.evaluate(()=>{try{navigator.clipboard.writeText=async()=>{};}catch(e){}document.getElementById('rpLink').click();});await sleep(2500);
  const cl=await ia.evaluate(()=>({box:document.getElementById('rpLinkBox').value,note:document.getElementById('rpNote').textContent}));
  ok('8 Copy link in Respondent pages gives the short link',SHORT_RE.test(cl.box)&&cl.box.length<200,cl);
  await ia.evaluate(()=>{document.getElementById('rpQr').click();});await sleep(2500);
  const qr=await ia.evaluate(()=>({note:document.getElementById('qrNote').textContent,svg:!!document.querySelector('#qrBox svg'),cells:(document.querySelector('#qrBox svg path')||{getAttribute:()=>''}).getAttribute('d').split('M').length}));
  ok('9 the QR code is made from the short link (a link of under 200 characters, a simple code)',qr.svg&&/a link of (\d{2,3}) characters/.test(qr.note)&&+/a link of (\d+) characters/.exec(qr.note)[1]<200,qr);
  await ia.evaluate(()=>{const d=document.getElementById('qrDlg');if(d.open)d.close();const r=document.getElementById('rpDlg');if(r.open)r.close();});
  /* a box from before v21.88 (no qput): the long link goes, as before */
  const noQ=u=>/box\.php\?a=qput/.test(u.href);await ctx.route(noQ,r=>r.fulfill({status:400,contentType:'application/json',body:'{"ok":false,"error":"unknown request"}'}));
  /* the long link of the questionnaire Ms. Lopez answered, made again from what the short link holds */
  const pl=await rctx.newPage();await pl.goto(S0.split('#')[0]);const oldL=await pl.evaluate(async s=>{const p=await NBH_RESPOND.openShort('#'+s.split('#')[1]);p.due='12/31/2026';return s.split('#')[0]+NBH_RESPOND.payloadToHash(p);},S0);await pl.close();   /* a new due date: a link not made short before */
  const longL=await ia.evaluate(async u=>await NBH_RESPOND.shortLink(u),oldL);
  ok('10 a reply box that cannot keep short links (before v21.88): the long link is given, unchanged',longL===oldL&&/respond\.html#z=/.test(longL),{longL:longL.slice(0,120)});
  await ctx.unroute(noQ);
  /* short links that do not open */
  const base=S0.split('#')[0],key=/\.([A-Za-z0-9_-]{22})/.exec(S0)[1],uP=(/&u=\S+/.exec(S0)||[''])[0];
  const said=async u=>{const p=await rctx.newPage();await p.goto(u);await sleep(1500);const t=await p.evaluate(()=>document.getElementById('nbhr').textContent);await p.close();return t;};
  const gone=await said(base+'#q=AAAAAAAAAA.'+key+uP),cut=await said(S0.replace(/\.[A-Za-z0-9_-]{22}/,'.'+'B'.repeat(22))),down=await said(base+'#q='+/#q=([A-Za-z0-9]{10})/.exec(S0)[1]+'.'+key+'&u='+encodeURIComponent('http://127.0.0.1:1/box.php'));
  ok('11 an unknown or removed short link says it has expired; a wrong key says the link does not open; an unreachable box says to try again',/expired/.test(gone)&&/does not open/.test(cut)&&/could not be opened right now/.test(down),{gone,cut,down});
  /* an old long link still opens */
  const op=await rctx.newPage();await op.goto(oldL);await op.waitForFunction(()=>document.querySelectorAll('li.it').length>0,null,{timeout:10000}).catch(()=>{});
  const oldItems=await op.evaluate(()=>document.querySelectorAll('li.it').length);await op.close();
  ok('12 a long link (as sent before v21.88) still opens its questionnaire',/#z=/.test(oldL)&&oldItems>=10,{oldItems});
  /* IN-1's Copy link is short too */
  await page.evaluate(()=>openForm('IN-1'));await page.waitForFunction(()=>!!state.status['IN-1'],null,{timeout:30000});await sleep(1500);
  const inf=page.frames().find(f=>/IN-1_Stakeholder/.test(f.url()));
  const inl=await inf.evaluate(async()=>{try{navigator.clipboard.writeText=async()=>{throw new Error('no');};}catch(e){}
    const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('client','Mateo Rivera');set('sid','4471823');set('bcba','J. Newsome, BCBA');set('email','simulated.bcba@palmbeachschools.org');set('beh','Hitting: forceful contact of the hand with another person.');
    document.getElementById('rpBtn').click();await new Promise(r=>setTimeout(r,400));const l=document.getElementById('rpLink');const dis=l.disabled;l.click();await new Promise(r=>setTimeout(r,3000));return {dis,note:document.getElementById('rpNote').textContent};});
  ok('13 IN-1’s Copy link still gives its link (short when its reply box keeps them, else the long one as before)',!inl.dis&&(SHORT_RE.test(inl.note)||/respond\.html#z=/.test(inl.note)),{dis:inl.dis,note:inl.note.slice(0,200)});
  ok('no page errors',!errs.length,errs.slice(0,5));
  }finally{await br.close();php.kill();}
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
