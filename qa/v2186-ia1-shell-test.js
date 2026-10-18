/* v21.86 the whole path in the workstation itself: Form IA-1's Send all due now asks the workstation, which signs in to
   the school Google account (simulated) and sends one email per informant through Gmail (simulated); the informant opens
   the link from that email, answers and presses Send (the reply box run here with php -S); the case is kept on this iPad
   and closed; the workstation collects by itself and the answer is placed in that student's IA-1, its rows marked.
   Simulated student and people only. Needs php on the PATH.
   usage: WS_URL=http://127.0.0.1:8155 node qa/v2186-ia1-shell-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2186-ia1-shell';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.IA_BOX_PORT||18158),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  ok('0 box.php answers (php -S on '+PORT+')',up);if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  let sent=[];
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-mail-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await ctx.route('https://www.googleapis.com/oauth2/v3/userinfo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({email:'simulated.bcba@palmbeachschools.org'})}));
  await ctx.route('https://gmail.googleapis.com/**',async r=>{const b=JSON.parse(r.request().postData()||'{}'),raw=Buffer.from(String(b.raw||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
    const body=require(__dirname+'/lib.js').mailParts(raw).text;sent.push({raw,body});return r.fulfill({contentType:'application/json',body:JSON.stringify({id:'m'+sent.length})});});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  await page.evaluate(()=>openForm('IA-1'));await page.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1500);
  const ia=page.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  await ia.evaluate(u=>{window.confirm=()=>true;try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}
    const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set('m.client','Mateo Rivera');set('m.sid','4471823');set('m.email','simulated.bcba@palmbeachschools.org');set('m.assessor','J. Ellis');set('rp.box',u);
    set('m.beh','Hitting');set('m.def','Forceful contact of an open or closed hand with a peer or adult.');
    [['Ms. Lopez','lopez@example.org','Teacher'],['Mr. Okafor','okafor@example.org','Para']].forEach((p,i)=>{set('inf['+i+'].name',p[0]);set('inf['+i+'].email',p[1]);set('inf['+i+'].role',p[2]);});},BOXURL);
  await ia.evaluate(()=>document.querySelector('#viewSeg button[data-view="outs"]').click());await sleep(300);
  await ia.evaluate(()=>{document.querySelectorAll('#outPlan [data-oi]').forEach(c=>{if(c.checked!==(c.dataset.oi==='fast'))c.click();});document.querySelector('#outPlan').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#outPlanBtn').click();});await sleep(400);
  const a0=await ia.evaluate(async()=>{const ok=await __rp.ensure();return {ok,rows:__rp.outs().length,due:__rp.dueNow().length,box:!!(__rp.box()&&__rp.box().site)};});
  ok('1 IA-1 in the workstation: a FAST row for each informant column (the third has no one in it yet), due now, on the reply box',a0.ok&&a0.rows===3&&a0.due===3&&a0.box,a0);
  await ia.evaluate(()=>document.querySelector('#outSendDue').click());
  await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:10000}).catch(()=>{});
  const dlg=await page.evaluate(()=>({t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent)}));
  ok('2 Send all due now: the workstation asks to send 2 emails from the school account, naming both',/Send 2 emails from your school account/.test(dlg.t)&&/Ms\. Lopez/.test(dlg.b)&&/Mr\. Okafor/.test(dlg.b)&&dlg.btns.includes('Sign in and send'),dlg);
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send/.test(b.textContent)).click());
  for(let i=0;i<40&&sent.length<2;i++)await sleep(250);await sleep(1200);
  const marked=await ia.evaluate(()=>__rp.outs().map(o=>({inf:o.inf,sent:o.sent||'',how:o.how||o.via||''})));
  const L1=(sent[0]&&sent[0].body.match(/https?:\/\/\S+respond\.html#\S+/g))||[];
  ok('3 Gmail sends one email to each from the account, each with the person’s own link; IA-1 marks those two rows sent and leaves the row with no email',sent.length===2&&/^From: simulated\.bcba@palmbeachschools\.org/m.test(sent[0].raw)&&/To: "?Ms\. Lopez"? <lopez@example\.org>/.test(sent[0].raw)&&/Hello Ms\. Lopez/.test(sent[0].body)&&L1.length===1&&
    marked.length===3&&marked.filter(m=>!!m.sent).map(m=>m.inf).join()==='A,B',{n:sent.length,raw:sent[0]&&sent[0].raw.slice(0,260),body:sent[0]&&sent[0].body.slice(0,400),marked});
  /* the teacher answers from the link in her email */
  const rctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const rp=await rctx.newPage();
  await rp.goto(L1[0]);await sleep(700);
  const who=await rp.evaluate(()=>{const g=document.querySelectorAll('.grid2 input[type=text]');return {name:g[0]&&g[0].value,ro:g[0]&&g[0].readOnly,items:document.querySelectorAll('li.it').length};});
  await rp.evaluate(()=>{document.querySelectorAll('li.it').forEach((li,i)=>{const r=li.querySelector('input[value="'+['Y','N','Y','NA'][i%4]+'"]');if(r)r.click();});
    const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value='Independent work '+(i+1);});document.querySelector('button:not(.ghost)').click();});await sleep(1800);
  const done=await rp.evaluate(()=>(document.querySelector('#nbhr-done')||{}).innerHTML||'');
  ok('4 the link from the email opens with her name filled; she answers the FAST and presses Send: Sent.',who.name==='Ms. Lopez'&&who.ro&&who.items>=10&&/<b>Sent\.<\/b>/.test(done),{who,done:done.slice(0,200)});
  /* the case kept and closed; the workstation collects by itself */
  const kept=await page.evaluate(async()=>{const ok=await caseKeepOnly();const r=(await clList()||[]).find(x=>x.key===clKey(packet()));return {ok,box:r?clBoxForms(r).map(x=>x[0]):[]};});
  await page.evaluate(()=>clearCase());await sleep(600);
  ok('5 the case is kept on this iPad and closed; the caseload sees IA-1 waiting for replies',kept.ok&&kept.box.indexOf('IA-1')>=0,kept);
  const got=await page.evaluate(async()=>{window.__toasts=[];const t0=wsUI.toast;wsUI.toast=m=>window.__toasts.push(String(m));localStorage.removeItem('nbh.caseload.replies');const r=await clRepliesAuto(false);wsUI.toast=t0;return {r,toasts:window.__toasts};});
  const rec=await page.evaluate(async()=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const d=parseCase(r.text);return {rep:d.facts&&d.facts.replies&&d.facts.replies['IA-1'],sum:(r.sum&&r.sum.items||[]).map(x=>x.k+': '+x.t)};});
  ok('6 by itself, the workstation places Ms. Lopez’s FAST in the closed case’s IA-1, with a notice naming the student',got.r&&got.r.placed===1&&got.toasts.length===1&&/Mateo Rivera.*IA-1/.test(got.toasts[0])&&rec.rep&&rec.rep.placed===1,{got,rec});
  await page.evaluate(async()=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));await openCaseText(r.text,null,{asked:true,quiet:true});});
  await page.evaluate(()=>openForm('IA-1'));await page.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1800);
  const ia2=page.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  const back=await ia2.evaluate(()=>__rp.outs().map(o=>({inf:o.inf,st:o.placed?'placed':o.got?'got':o.sent?'sent':'-'})));
  ok('7 the case opened from the caseload: IA-1 shows Ms. Lopez’s row placed and Mr. Okafor’s still out',back.map(b=>b.inf+':'+b.st).join()==='A:placed,B:sent,C:-',back);
  ok('no page errors',!errs.length,errs.slice(0,5));
  }finally{await br.close();php.kill();}
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
