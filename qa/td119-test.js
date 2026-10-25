/* v24.19 Form TD-1 printing (the 10/25 review): the staff packet (Final plan, integrity checklist, flowchart); a sheet's last
   lines stay with their sheet on paper. usage: node qa/td119-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 const PDF=async()=>{await p.emulateMedia({media:'print'});const buf=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});return buf;};
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1500);
 /* the whole form: fewer pages, the last lines kept with their sheets */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();});await sleep(800);await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());await sleep(300);
 const all=await PDF();
 await p.emulateMedia({media:'print'});
 const rules=await p.evaluate(()=>({cite:getComputedStyle(document.querySelector('#select > .cite')).breakBefore,orph:getComputedStyle(document.querySelector('#select p.method')).orphans,q:getComputedStyle(document.querySelector('.qrow')).breakInside}));
 await p.emulateMedia({media:'screen'});
 ok('the whole-form printout of the worked example (its final plan rendered) is 46 pages or fewer (it was 46 before the keep-together rules and 45 after; v24.21 added the provenance line to the summary statement and the fuller checklist heading) and the keep-together rules are on',pages(all)<=46&&rules.cite==='avoid'&&rules.orph==='3'&&rules.q==='avoid',{pages:pages(all),rules});
 /* the packet button and what it does */
 await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;window.__during={cls:document.body.className,finBeforePlan:(()=>{const f=document.getElementById('final'),pl=document.getElementById('plan');return !!(f.compareDocumentPosition(pl)&Node.DOCUMENT_POSITION_FOLLOWING);})(),flow:!!document.getElementById('flowBlock').textContent.trim(),flowAfterList:(()=>{const fb=document.getElementById('flowBlock'),ft=document.getElementById('fidTbl');return !!(ft.compareDocumentPosition(fb)&Node.DOCUMENT_POSITION_FOLLOWING);})()};};});
 const btn=await p.evaluate(()=>{const b=document.getElementById('printPacketBtn');return b?{text:b.textContent,after:b.previousElementSibling&&b.previousElementSibling.id}:null;});
 ok('the toolbar has Print the staff packet beside Print final plan only',btn&&btn.text==='Print the staff packet'&&btn.after==='printFinalBtn',btn);
 await p.evaluate(()=>document.getElementById('printPacketBtn').click());await sleep(400);
 const during=await p.evaluate(()=>window.__during);
 await sleep(2300);
 const after=await p.evaluate(()=>({cls:document.body.className,finBeforePlan:(()=>{const f=document.getElementById('final'),pl=document.getElementById('plan');return !!(f.compareDocumentPosition(pl)&Node.DOCUMENT_POSITION_FOLLOWING);})(),prints:window.__prints,flow:!!document.getElementById('flowBlock').textContent.trim()}));
 ok('the packet prints with the Final plan moved ahead of the Implementation plan, the flowchart built, and the order and class restored afterwards',
   after.prints===1&&/print-packet/.test(during.cls)&&during.finBeforePlan&&during.flow&&during.flowAfterList&&!/print-packet/.test(after.cls)&&!after.finBeforePlan&&after.flow,{during,after});
 /* what the packet shows on paper */
 await p.evaluate(()=>{const f=document.getElementById('final'),pl=document.getElementById('plan');pl.parentNode.insertBefore(f,pl);document.body.classList.add('print-packet');});
 await p.emulateMedia({media:'print'});
 const vis=await p.evaluate(()=>{const d=e=>e?getComputedStyle(e).display:'missing';const sheets=[...document.querySelectorAll('.sheet')].filter(s=>getComputedStyle(s).display!=='none').map(s=>s.id);
   return {sheets,summary:d(document.getElementById('planSummary')),fidHead:d(document.getElementById('fidHead')),fidTbl:d(document.getElementById('fidTbl')),flow:d(document.getElementById('flowBlock')),thin:d(document.getElementById('thinTbl')),bar:getComputedStyle(document.querySelector('#plan > .bar'),'::after').content};});
 await p.emulateMedia({media:'screen'});
 const pk=await PDF();
 await p.evaluate(()=>{document.body.classList.remove('print-packet');const f=document.getElementById('final'),m=document.getElementById('monitor');m.parentNode.insertBefore(f,m);});
 ok('on paper the packet is the Final plan and, from the Implementation plan, only the integrity checklist and the flowchart',vis.sheets.join()==='final,plan'&&vis.summary==='none'&&vis.fidHead!=='none'&&vis.fidTbl!=='none'&&vis.flow!=='none'&&vis.thin==='none'&&/integrity checklist/.test(vis.bar),vis);
 ok('the packet is a printout of its own, shorter than the whole form',pages(pk)>=3&&pages(pk)<=20&&pages(pk)<pages(all),{pk:pages(pk),all:pages(all)});
 /* Print final plan only still prints just the final plan */
 await p.evaluate(()=>{window.print=()=>{window.__fin={cls:document.body.className,shown:[...document.querySelectorAll('.sheet')].filter(s=>getComputedStyle(s).display!=='none').length};};document.getElementById('printFinalBtn').click();});await sleep(400);
 const fin=await p.evaluate(()=>window.__fin);
 ok('Print final plan only still prints the final plan alone',fin&&/print-final/.test(fin.cls),fin);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
