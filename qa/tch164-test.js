/* v24.64 Form RS-1 (the BCBA's screenshots, 10/26): a contact's task list says it holds the tasks of the areas ticked under
   Content covered, and that ticking another area (Ethics) shows its tasks; ticking Ethics brings F.1 to F.10. Simulated only.
   usage: node qa/tch164-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1024,height:1300}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{const k=yearKeys(setupYear())[1];curKey=k;const m=month(k);m.contacts=[{id:'c1',date:k+'-10',start:'12:30',end:'15:30',sup:'',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-1',acts:['Behavior acquisition','Behavior reduction'],tco:['C.2'],sact:[],bst:[]}];setView('month');renderAll();
   const d=document.querySelector('details.rs-contact[data-cid="c1"]');if(d)d.open=true;});await sleep(300);
 const A=await p.evaluate(()=>{const b=document.querySelector('[data-tcot="c1"]');return {t:b.querySelector('.rs-tcohint').textContent,f:b.querySelectorAll('input[data-tco^="F"]').length,cd:b.querySelectorAll('input[data-tco]').length};});
 ok('with C and D ticked, the list says so, and how to see another area\'s tasks (Ethics)',A.t==='The tasks of the areas ticked above: C. Behavior acquisition, D. Behavior reduction. To choose tasks from another area (e.g., Ethics and professional conduct), tick it above.'&&A.f===0&&A.cd===18,A);
 await p.check('input[data-c="c1"][data-arr="acts"][value="Ethics and professional conduct"]');await sleep(300);
 const B=await p.evaluate(()=>{const b=document.querySelector('[data-tcot="c1"]');return {t:b.querySelector('.rs-tcohint').textContent,f:[...b.querySelectorAll('input[data-tco^="F"]')].map(i=>i.dataset.tco),keep:month(curKey).contacts[0].tco};});
 ok('ticking Ethics shows F.1 to F.10; the task already ticked stays',B.f.length===10&&B.f[9]==='F.10'&&/F\. Ethics and professional conduct\.$/.test(B.t.replace(/ To choose.*$/,''))&&JSON.stringify(B.keep)==='["C.2"]',B);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
