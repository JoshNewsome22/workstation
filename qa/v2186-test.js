/* v21.86 the shell's side of email from the school Google account: a form asks ({nbh:'mail'}), the workstation shows who
   gets what, the tap signs in and sends one email per person through Gmail, and the form hears each result; no Google key,
   the Mail app chosen, or Gmail not on the account: the form is told to use the Mail app. Google's sign-in, Gmail and the
   account's address are simulated (no network). Simulated people only. usage: node qa/v2186-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  let sent=[],mode='ok';
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;window.__scope=cfg.scope;setTimeout(()=>cfg.callback({access_token:'simulated-mail-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await ctx.route('https://www.googleapis.com/oauth2/v3/userinfo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({email:'simulated.bcba@palmbeachschools.org'})}));
  await ctx.route('https://gmail.googleapis.com/**',async r=>{const b=JSON.parse(r.request().postData()||'{}'),raw=Buffer.from(String(b.raw||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
    sent.push({auth:r.request().headers()['authorization'],raw});
    if(mode==='noservice')return r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'Mail service not enabled',status:'FAILED_PRECONDITION'}})});
    if(/third@/.test(raw))return r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'Invalid To header'}})});
    return r.fulfill({contentType:'application/json',body:JSON.stringify({id:'m'+sent.length})});});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(()=>openForm('IC-1'));await page.waitForFunction(()=>!!state.status['IC-1'],null,{timeout:30000});await sleep(800);
  const fr=()=>page.frames().find(f=>/IC-1_Informed/.test(f.url()));
  const ask=async(req,msgs)=>fr().evaluate(([req,msgs])=>{window.__res=window.__res||{};window.addEventListener('message',e=>{if(e.data&&e.data.nbh==='mail-result'&&e.data.req===req)window.__res[req]=e.data;});
    parent.postMessage({nbh:'mail',id:'IC-1',req,messages:msgs},'*');},[req,msgs]);
  const res=req=>fr().evaluate(req=>(window.__res||{})[req]||null,req);
  const M=[{to:'first@example.org',name:'Ms. Alvarez (simulated)',subject:'Two short questionnaires about M. R.',text:'Hello,\nhttps://example.org/respond.html#a\nYour answers come straight back to me when you press Send.'},
    {to:'second@example.org',name:'Mr. Brooks (simulated)',subject:'A questionnaire about M. R.',text:'Hello é ñ'},{to:'third@example.org',name:'Third (simulated)',subject:'One more',text:'Hi'},{to:'not an email',name:'x',subject:'x',text:'x'}];
  /* 1. sent from the account, one email per person */
  await ask('r1',M);await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:8000}).catch(()=>{});
  const dlg=await page.evaluate(()=>({t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent)}));
  ok('1a the workstation shows who gets an email (the 3 with an address) and asks: Sign in and send / Use the Mail app instead / Not now',/Send 3 emails from your school account/.test(dlg.t)&&/Ms\. Alvarez/.test(dlg.b)&&!/not an email/.test(dlg.b)&&dlg.btns.includes('Sign in and send')&&dlg.btns.includes('Use the Mail app instead'),dlg);
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send/.test(b.textContent)).click());
  await page.waitForFunction(()=>true,null,{timeout:100});for(let i=0;i<40&&!(await res('r1'));i++)await sleep(250);
  const r1=await res('r1');
  ok('1b signed in in that tap with Gmail send permission, then three sent in turn; the form hears each result and the account',r1&&r1.from==='simulated.bcba@palmbeachschools.org'&&r1.results.length===3&&r1.results[0].ok&&r1.results[1].ok&&!r1.results[2].ok&&/Invalid To/.test(r1.results[2].err)&&await page.evaluate(()=>window.__gsAsk===1&&/gmail\.send/.test(window.__scope)),{r1,scope:await page.evaluate(()=>window.__scope)});
  const raw=sent[0]&&sent[0].raw||'',raw2=sent[1]&&sent[1].raw||'';const body2=Buffer.from((raw2.split('\r\n\r\n')[1]||'').replace(/\r\n/g,''),'base64').toString('utf8');
  ok('1c each email is a plain message to that person, from the account, with the subject, and its text whole (accents too)',sent.length===3&&sent.every(s=>s.auth==='Bearer simulated-mail-token')&&/^From: simulated\.bcba@palmbeachschools\.org/m.test(raw)&&/To: "Ms\. Alvarez \(simulated\)" <first@example\.org>/.test(raw)&&/Subject: Two short questionnaires about M\. R\./.test(raw)&&body2==='Hello é ñ',{raw:raw.slice(0,300),body2});
  /* 2. signed in already: Send, no second window */
  sent=[];await ask('r2',[M[0]]);await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:8000}).catch(()=>{});
  const b2=await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent));
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/^Send$/.test(b.textContent)).click());for(let i=0;i<40&&!(await res('r2'));i++)await sleep(250);
  ok('2 signed in already in this tab: the button is Send and no second Google window opens',b2.includes('Send')&&(await res('r2')).results[0].ok&&await page.evaluate(()=>window.__gsAsk===1),b2);
  /* 3. the Mail app chosen; Not now */
  await ask('r3',[M[0]]);await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:8000}).catch(()=>{});
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Mail app/.test(b.textContent)).click());for(let i=0;i<20&&!(await res('r3'));i++)await sleep(200);
  await ask('r4',[M[0]]);await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:8000}).catch(()=>{});
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Not now/.test(b.textContent)).click());for(let i=0;i<20&&!(await res('r4'));i++)await sleep(200);
  const r3=await res('r3'),r4=await res('r4');
  ok('3 Use the Mail app instead, and Not now: the form is told to use the Mail app (Not now marked declined)',r3&&r3.unavailable&&r4&&r4.unavailable&&r4.declined,{r3,r4});
  /* 4. Gmail not on the account */
  mode='noservice';sent=[];await page.evaluate(()=>sessionStorage.removeItem('nbh.google.mail'));
  await ask('r5',[M[0],M[1]]);await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:8000}).catch(()=>{});
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send/.test(b.textContent)).click());for(let i=0;i<40&&!(await res('r5'));i++)await sleep(250);
  const r5=await res('r5');
  ok('4 Gmail not turned on for the account: nothing more is tried and the form is told to use the Mail app',r5&&r5.unavailable&&/Gmail could not send/.test(r5.why)&&sent.length===1,{r5,n:sent.length});
  /* 5. no Google key on this iPad */
  await page.evaluate(()=>localStorage.removeItem('nbh.google.client'));
  await ask('r6',[M[0]]);for(let i=0;i<20&&!(await res('r6'));i++)await sleep(200);
  const r6=await res('r6');
  ok('5 no Google sign-in key on this iPad: told at once to use the Mail app, with why',r6&&r6.unavailable&&/key is not set/.test(r6.why)&&!(await page.evaluate(()=>document.getElementById('cfDlg').open)),r6);
  /* 6. only a form frame may ask */
  const before=await page.evaluate(()=>document.getElementById('cfDlg').open);
  await page.evaluate(()=>{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');window.postMessage({nbh:'mail',id:'X',req:'r7',messages:[{to:'a@b.org',subject:'x',text:'x'}]},'*');});await sleep(800);
  ok('6 a request that does not come from a form frame is ignored',!before&&!(await page.evaluate(()=>document.getElementById('cfDlg').open)));
  ok('no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
