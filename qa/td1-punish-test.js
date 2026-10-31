/* v25.30 punishment elements on TD-1's bank cards (the BCBA, 10/31): a protocol whose steps include one marked
   "RESTRICTIVE: Punishment" offers Add without punishment (the default) and Add with punishment (consent required);
   without leaves those steps off the card, with puts them on and labels the card and the plan; a protocol without a
   punishment element keeps the one Add to the plan button. Simulated data only. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
const file=pre=>fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>f.startsWith(pre));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL+file('TD-1_'));await p.waitForTimeout(1500);
 const pick=await p.evaluate(()=>{const P=TD1_BANK.protocols,re=/^\s*RESTRICTIVE:\s*Punishment\b/i;const a=P.find(x=>x.steps.some(s=>re.test(s))&&x.steps.filter(s=>re.test(s)).length===1);const z=P.find(x=>!x.steps.some(s=>re.test(s)));
   return {pun:a.id,lab:a.lab,np:a.steps.length,npun:a.steps.filter(s=>re.test(s)).length,plain:z.id,count:P.filter(x=>x.steps.some(s=>re.test(s))).length};});
 ok('the bank has protocols with a marked punishment step ('+pick.count+')',pick.count>=5,pick);
 const host='[...document.querySelectorAll("*")].find(e=>e.shadowRoot&&e.shadowRoot.querySelector(".detail"))';
 const det=async id=>p.evaluate(([id,host])=>{window.__tdBank.show(id);const d=eval(host).shadowRoot.querySelector('.detail');const bs=[...d.querySelectorAll('button.add')];
   return {btns:bs.map(x=>[x.textContent,x.dataset.pun||'']),note:!!d.querySelector('.punnote'),pun:d.querySelectorAll('ol.steps li.pun').length};},[id,host]);
 const d1=await det(pick.pun),d2=await det(pick.plain);
 ok('a protocol with a punishment step offers Add without punishment (first) and Add with punishment (consent required), with the note and the step marked',
   d1.btns.length===2&&d1.btns[0][0]==='Add without punishment'&&d1.btns[0][1]==='0'&&d1.btns[1][0]==='Add with punishment (consent required)'&&d1.btns[1][1]==='1'&&d1.note&&d1.pun===pick.npun,d1);
 ok('a protocol without one keeps the single Add to the plan button and no note',d2.btns.length===1&&d2.btns[0][0]==='Add to the plan'&&!d2.note&&!d2.pun,d2);
 await p.click('text=Build components').catch(()=>{});await p.waitForTimeout(400);
 const addWith=async pun=>{await p.evaluate(([id,host,pun])=>{window.__tdBank.show(id);eval(host).shadowRoot.querySelector('.detail button.add[data-pun="'+pun+'"]').click();},[pick.pun,host,pun]);await p.waitForTimeout(900);
   return p.evaluate(()=>{const c=document.querySelector('#compWrap').lastElementChild,i=c.dataset.i;const steps=[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value).filter(Boolean);
     const R=window.__tdBank&&eval('[...document.querySelectorAll("*")].find(e=>e.shadowRoot&&e.shadowRoot.querySelector(".detail"))').shadowRoot.querySelector('.st');
     return {steps,pun:steps.filter(s=>/^\s*RESTRICTIVE:\s*Punishment/i.test(s)).length,bsrc:document.querySelector('[name="cp['+i+'].bsrc"]').value,shown:(c.querySelector('.td-bank-src')||{}).textContent||'',st:R?R.textContent:''};});};
 const w0=await addWith('0');
 ok('Add without punishment: the card has every other step and no punishment step, and says so',w0.pun===0&&w0.steps.length===pick.np-pick.npun&&!/with punishment/.test(w0.bsrc)&&/left off/.test(w0.st),w0);
 await p.evaluate(()=>{document.querySelectorAll('#compWrap .card [data-rm]').forEach(x=>x.click());});await p.waitForTimeout(600);
 const w1=await addWith('1');
 ok('Add with punishment: the card has the punishment step too, and its source line says it needs consent',w1.pun===pick.npun&&w1.steps.length===pick.np&&/, with punishment steps \(consent required\) \(/.test(w1.bsrc)&&/with punishment steps \(consent required\)/.test(w1.shown)&&/district review and written consent/.test(w1.st),w1);
 ok('the label travels with the card (its saved source line)',await p.evaluate(()=>[...document.querySelectorAll('[name$="].bsrc"]')].some(e=>/with punishment steps \(consent required\)/.test(e.value))));
 const d3=await det(pick.pun);
 ok('after adding, the plain choice is still the first button',d3.btns[0][0]==='Add without punishment',d3);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
