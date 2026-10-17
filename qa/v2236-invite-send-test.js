/* v22.36 Email the questionnaire (Form IA-1's Respondent pages, Email it, and a row's Email on the Send-outs sheet) sends from
   the school account at once when the form is inside the workstation: Send from my school account asks the workstation,
   which signs in (simulated) and sends through Gmail (simulated); the dialog says it went. With no address it asks for one;
   "Use the Mail app instead" points to Open in Mail; a form open on its own shows Open in Mail only. Simulated people only.
   usage: node qa/v2236-invite-send-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});const sent=[];
  await ctx.addInitScript(()=>{window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){setTimeout(()=>cfg.callback({access_token:'simulated-mail-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await ctx.route('https://www.googleapis.com/oauth2/v3/userinfo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({email:'simulated.bcba@example.org'})}));
  await ctx.route('https://gmail.googleapis.com/**',async r=>{const b=JSON.parse(r.request().postData()||'{}');sent.push(Buffer.from(String(b.raw||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
    return r.fulfill({contentType:'application/json',body:JSON.stringify({id:'m'+sent.length})});});
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  await page.evaluate(()=>openForm('IA-1'));await page.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1200);
  const ia=page.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  const open=to=>ia.evaluate(([to,u])=>{document.querySelectorAll('dialog.nbh-inv').forEach(x=>x.remove());NBH_RESPOND.invite({links:[{label:'Hitting',url:u}],to:to,title:'FAST'});
    return [...document.querySelectorAll('dialog.nbh-inv .b button')].map(b=>b.textContent);},[to,L.BASE+'/NBH-Workstation/respond.html#q=simulated']);
  const b1=await open('');
  ok('1 inside the workstation: Send from my school account first, Open in Mail beside it',b1[0]==='Send from my school account'&&b1[1]==='Open in Mail',b1);
  await ia.evaluate(()=>{document.getElementById('nbhInvTo').value='';document.querySelector('dialog.nbh-inv [data-a=send]').click();});await sleep(200);
  const st0=await ia.evaluate(()=>document.querySelector('dialog.nbh-inv .st').textContent);
  ok('2 no address: it asks for one, nothing sent',/email first/.test(st0)&&!sent.length,st0);
  await open('dana.whitfield@example.org');await sleep(400);
  await ia.evaluate(()=>document.querySelector('dialog.nbh-inv [data-a=send]').click());
  await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:10000}).catch(()=>{});
  const dlg=await page.evaluate(()=>({t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent}));
  ok('3 the workstation asks to send 1 email from the school account, to that address',/Send 1 email from your school account/.test(dlg.t)&&/dana\.whitfield@example\.org/.test(dlg.b),dlg);
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Sign in and send|^Send$/.test(b.textContent)).click());
  for(let i=0;i<40&&!sent.length;i++)await sleep(250);await sleep(500);
  const st=await ia.evaluate(()=>({st:document.querySelector('dialog.nbh-inv .st').textContent,btn:document.querySelector('dialog.nbh-inv [data-a=send]').textContent}));
  ok('4 Gmail sends it, with the subject and the link, and the dialog says it went',sent.length===1&&/To: <dana\.whitfield@example\.org>/.test(sent[0])&&/Subject: FAST/.test(sent[0])&&/Sent from simulated\.bcba@example\.org to dana\.whitfield@example\.org/.test(st.st)&&st.btn==='Sent',{st,raw:(sent[0]||'').slice(0,300)});
  /* the Mail app chosen in the workstation's question */
  await open('paula.brennan@example.org');await ia.evaluate(()=>document.querySelector('dialog.nbh-inv [data-a=send]').click());
  await page.waitForFunction(()=>document.getElementById('cfDlg').open,null,{timeout:10000}).catch(()=>{});
  await page.evaluate(()=>[...document.querySelectorAll('#cfFoot button')].find(b=>/Mail app/.test(b.textContent)).click());await sleep(500);
  const st2=await ia.evaluate(()=>document.querySelector('dialog.nbh-inv .st').textContent);
  ok('5 "Use the Mail app instead": the dialog points to Open in Mail, nothing more sent',/Press Open in Mail/.test(st2)&&sent.length===1,st2);
  /* the form on its own */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('IA-1 alone: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html');await sleep(1000);
  const b2=await q.evaluate(u=>{NBH_RESPOND.invite({links:[{label:'Hitting',url:u}],title:'FAST'});return [...document.querySelectorAll('dialog.nbh-inv .b button')].map(b=>b.textContent);},L.BASE+'/NBH-Workstation/respond.html#q=simulated');
  ok('6 a form open on its own: Open in Mail first, no school-account button',b2[0]==='Open in Mail'&&!b2.includes('Send from my school account'),b2);
  ok('7 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
