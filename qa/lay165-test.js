/* v24.65 Form RS-1 (the BCBA, 10/26: the sections run together): on a contact, Supervision activities, Content covered and How
   it was taught are each a panel with a heading and a count of what is ticked; the tasks sit under a heading for each area
   ticked, with its count; the counts follow the ticks and the ticks are kept as before. Simulated only.
   usage: node qa/lay165-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1180,height:1300}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{const k=yearKeys(setupYear())[1];curKey=k;const m=month(k);m.contacts=[{id:'c1',date:k+'-10',start:'12:30',end:'15:30',sup:'',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-1',sact:['Observation, BST and performance feedback'],acts:['Behavior acquisition'],tco:['C.2'],bst:[],feedback:'',follow:''}];setView('month');renderAll();
   const d=document.querySelector('details.rs-contact[data-cid="c1"]');if(d)d.open=true;});await sleep(300);
 const A=await p.evaluate(()=>{const c=document.querySelector('details.rs-contact[data-cid="c1"]');const G=[...c.querySelectorAll('.rs-grp')];
   return {heads:G.map(g=>g.querySelector('.rs-grph').firstChild.textContent.trim()),counts:G.map(g=>g.querySelector('.rs-grph .rs-grpn').textContent),
     tasksIn:!!G[1].querySelector('[data-tcot]'),area:[...c.querySelectorAll('.rs-tareah')].map(h=>h.textContent),bg:getComputedStyle(G[0]).backgroundColor,gap:G[1].getBoundingClientRect().top-G[0].getBoundingClientRect().bottom};});
 ok('three panels with headings and counts: Supervision activities, Content covered (its tasks inside it), How it was taught',JSON.stringify(A.heads)==='["Supervision activities","Content covered","How it was taught"]'&&JSON.stringify(A.counts)==='["1 ticked","1 ticked",""]'&&A.tasksIn&&A.gap>=10&&A.bg!=='rgba(0, 0, 0, 0)',A);
 ok('the tasks sit under a heading for the area ticked, with its count',JSON.stringify(A.area)==='["C. Behavior acquisition 1 of 11"]',A.area);
 await p.check('input[data-c="c1"][data-arr="bst"][value="Rehearsal"]');await p.check('input[data-c="c1"][data-arr="sact"][value="Reviewing written materials (progress notes, data sheets)"]');
 await p.check('input[data-c="c1"][data-tco="C.7"]');await p.check('input[data-c="c1"][data-arr="acts"][value="Ethics and professional conduct"]');await sleep(300);
 await p.check('input[data-c="c1"][data-tco="F.4"]');await sleep(200);
 const B=await p.evaluate(()=>{const c=document.querySelector('details.rs-contact[data-cid="c1"]');const G=[...c.querySelectorAll('.rs-grp')];const x=month(curKey).contacts[0];
   return {counts:G.map(g=>g.querySelector('.rs-grph .rs-grpn').textContent),area:[...c.querySelectorAll('.rs-tareah')].map(h=>h.textContent),tco:x.tco,bst:x.bst,sact:x.sact.length,acts:x.acts};});
 ok('the counts follow the ticks, and the ticks are kept as before',JSON.stringify(B.counts)==='["2 ticked","2 ticked","1 ticked"]'&&JSON.stringify(B.area)==='["C. Behavior acquisition 2 of 11","F. Ethics and professional conduct 1 of 10"]'&&JSON.stringify(B.tco)==='["C.2","C.7","F.4"]'&&JSON.stringify(B.bst)==='["Rehearsal"]'&&B.sact===2,B);
 await p.setViewportSize({width:390,height:900});await sleep(300);
 const C=await p.evaluate(()=>{const l=document.querySelector('.rs-tlist');return {cols:getComputedStyle(l).gridTemplateColumns.split(' ').length,over:document.documentElement.scrollWidth-innerWidth};});
 ok('on a phone the tasks are one column and nothing runs off the side',C.cols===1&&C.over<=1,C);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
