/* v25.64 optional steps on TD-1's bank cards (the BCBA, 11/2): a step marked "OPTION:" reinforces problem behavior on
   purpose (the lean baselines of Fisher et al., 2018, and Mitteer et al., 2026). It is shown in the card's steps, marked,
   with a note; it is left off the card unless "Include the optional step" is ticked; ticked, it goes on the card and the
   card's source line says so. A protocol without one shows no box. Simulated data only. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
const file=pre=>fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>f.startsWith(pre));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL+file('TD-1_'));await p.waitForTimeout(1500);
 const info=await p.evaluate(()=>{const P=TD1_BANK.protocols,re=/^\s*OPTION:/i;const w=P.filter(x=>x.steps.some(s=>re.test(s)));
   const a=P.find(x=>x.id==='fct-card-lean-schedule');return {ids:w.map(x=>x.id).sort(),n:a.steps.length,plain:P.find(x=>!x.steps.some(s=>re.test(s))&&!x.steps.some(s=>/^\s*RESTRICTIVE:\s*Punishment/i.test(s))).id,
     texts:w.map(x=>x.steps.find(s=>re.test(s))),notes:w.map(x=>x.note)};});
 ok('three cards carry one optional step: the two Fisher et al. (2018) cards and the Mitteer et al. (2026) card',JSON.stringify(info.ids)===JSON.stringify(['fct-card-lean-schedule','fct-lean-long-resurgence','fct-resurgence-mitigation-comparison']),info.ids);
 ok('each optional step says it reinforces problem behavior on purpose, why, and when it ends, with a safety plan',info.texts.every(t=>/^OPTION: Reinforces problem behavior on purpose:/.test(t)&&/Why:/.test(t)&&/safety plan/.test(t)&&/end it as soon as the baseline is steady/.test(t)),info.texts);
 ok('the notes call it optional and no longer say a school team does not do it',info.notes.every(t=>/optional step/.test(t)&&!/school team does not replicate|not in a school plan/.test(t)),info.notes.map(x=>x.slice(0,120)));
 const host='[...document.querySelectorAll("*")].find(e=>e.shadowRoot&&e.shadowRoot.querySelector(".detail"))';
 const det=async id=>p.evaluate(([id,host])=>{window.__tdBank.show(id);const d=eval(host).shadowRoot.querySelector('.detail');
   return {box:!!d.querySelector('.optck'),checked:!!(d.querySelector('.optck')||{}).checked,note:!!d.querySelector('.optnote'),opt:d.querySelectorAll('ol.steps li.opt').length,btns:[...d.querySelectorAll('button.add')].map(x=>x.textContent)};},[id,host]);
 const d1=await det('fct-card-lean-schedule'),d2=await det(info.plain);
 ok('a card with an optional step shows the box, unticked, the note and the step marked',d1.box&&!d1.checked&&d1.note&&d1.opt===1&&d1.btns.length===1&&d1.btns[0]==='Add to the plan',d1);
 ok('a card without one shows no box and no note',!d2.box&&!d2.note&&!d2.opt,d2);
 await p.click('text=Build components').catch(()=>{});await p.waitForTimeout(400);
 const addIt=async tick=>{await p.evaluate(([host,tick])=>{window.__tdBank.show('fct-card-lean-schedule');const d=eval(host).shadowRoot.querySelector('.detail');d.querySelector('.optck').checked=tick;d.querySelector('button.add').click();},[host,tick]);await p.waitForTimeout(900);
   return p.evaluate((host)=>{const c=document.querySelector('#compWrap').lastElementChild,i=c.dataset.i;const steps=[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value).filter(Boolean);
     const R=eval(host).shadowRoot.querySelector('.st');return {steps,opt:steps.filter(s=>/^\s*OPTION:/i.test(s)).length,bsrc:document.querySelector('[name="cp['+i+'].bsrc"]').value,st:R?R.textContent:''};},host);};
 const w0=await addIt(false);
 ok('unticked (the default): the card has every other step and not the optional one, and says it was left off',w0.opt===0&&w0.steps.length===info.n-1&&!/optional step/.test(w0.bsrc)&&/optional step that reinforces problem behavior on purpose was left off/.test(w0.st),w0);
 await p.evaluate(()=>{document.querySelectorAll('#compWrap .card [data-rm]').forEach(x=>x.click());});await p.waitForTimeout(600);
 const w1=await addIt(true);
 ok('ticked: the optional step goes on the card, and the source line and the message say so',w1.opt===1&&w1.steps.length===info.n&&/with the optional step that reinforces problem behavior on purpose/.test(w1.bsrc)&&/run it only with a safety plan/.test(w1.st),w1);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
