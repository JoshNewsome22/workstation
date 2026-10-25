/* v24.15 Form ABC-1 printing (the 10/25 review): Print / Save as PDF prints the record from any tab; the analysis cards break
   between their blocks on paper; the incident log's narrative prints in full across its own row.
   usage: node qa/abc115-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
const pdfText=buf=>{const t=buf.toString('latin1');return t;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 const PDF=async()=>{await p.emulateMedia({media:'print'});const buf=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});return buf;};
 /* an empty record, printed from the Record tab: the record (one page), not the entry form */
 await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__printedWith=document.body.className;window.__prints++;};});
 await p.evaluate(()=>document.getElementById('printBtn').click());await sleep(300);
 const e1=await p.evaluate(()=>({prints:window.__prints,cls:window.__printedWith,now:document.body.classList.contains('abc-print-record')}));
 await sleep(2300);
 const e2=await p.evaluate(()=>document.body.classList.contains('abc-print-record'));
 ok('Print / Save as PDF prints with the record class on the body, and the class goes afterwards',e1.prints===1&&/abc-print-record/.test(e1.cls)&&e1.now&&!e2,{e1,e2});
 await p.evaluate(()=>document.body.classList.add('abc-print-record'));
 const emptyPdf=await PDF();
 const empty=await p.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none';};return {record:vis('panel-record'),inc:vis('panel-incidents'),bg:vis('panel-background'),an:vis('panel-analysis'),data:vis('panel-data')};});
 await p.emulateMedia({media:'print'});const emptyVis=await p.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none';};return {record:vis('panel-record'),inc:vis('panel-incidents'),bg:vis('panel-background'),an:vis('panel-analysis'),data:vis('panel-data'),bgForm:getComputedStyle(document.querySelector('#panel-background .card > .body')).display,bgTable:getComputedStyle(document.getElementById('bg-table')).display};});await p.emulateMedia({media:'screen'});
 ok('printed from the Record tab, an empty record is a page or two: the header, the (empty) log, samples and analysis; the entry form and the background sample form are not printed',
   pages(emptyPdf)<=2&&!emptyVis.record&&emptyVis.inc&&emptyVis.bg&&emptyVis.an&&!emptyVis.data&&emptyVis.bgForm==='none'&&emptyVis.bgTable!=='none',{pages:pages(emptyPdf),emptyVis});
 await p.evaluate(()=>document.body.classList.remove('abc-print-record'));
 /* the simulated record */
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('load-demo').click();});await sleep(1500);
 const rows=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="incidents"]').click();const t=document.getElementById('inc-table');const narr=[...t.querySelectorAll('tr.inc-narr-row')];
   return {n:state.entries.filter(e=>e.narrative).length,rows:narr.length,hidden:narr.every(r=>getComputedStyle(r).display==='none'),full:narr.every((r,i)=>r.textContent.includes(state.entries.filter(e=>e.narrative)[i].narrative)),del:t.querySelectorAll('[data-del]').length,colspan:narr.length&&narr[0].firstElementChild.getAttribute('colspan')};});
 ok('each incident with a narrative has a hidden full-width narrative row on screen (the row count the buttons see is unchanged)',rows.rows===rows.n&&rows.n>20&&rows.hidden&&rows.full&&rows.del===46&&rows.colspan==='7',rows);
 await sleep(400);
 await p.emulateMedia({media:'print'});
 const pv=await p.evaluate(()=>{const t=document.getElementById('inc-table');const r=t.querySelector('tr.inc-narr-row'),c=t.querySelector('.inc-narr');return {row:getComputedStyle(r).display,cell:getComputedStyle(c).display};});
 await p.emulateMedia({media:'screen'});
 const incPdf=await PDF();
 ok('on paper the narrative row shows and the column\'s shortened narrative is hidden; the 46-incident log prints in ten pages or fewer (it was twelve)',pv.row==='table-row'&&pv.cell==='none'&&pages(incPdf)<=10,{pv,pages:pages(incPdf)});
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(1200);
 const anPdf=await PDF();
 const brk=await p.evaluate(()=>{const c=[...document.querySelectorAll('#panel-analysis .card')];return {cards:c.length,boxes:document.querySelectorAll('#panel-analysis .chartbox').length};});
 ok('the analysis prints in nineteen pages or fewer (it was twenty, four of them under half full), the cards breaking between their blocks',pages(anPdf)<=19&&brk.cards>=12&&brk.boxes>=10,{pages:pages(anPdf),brk});
 await p.emulateMedia({media:'print'});
 const pb=await p.evaluate(()=>{const c=document.querySelector('#panel-analysis .card'),box=document.querySelector('#panel-analysis .chartbox'),h=document.querySelector('#panel-analysis .card > header');return {card:getComputedStyle(c).breakInside,box:getComputedStyle(box).breakInside,head:getComputedStyle(h).breakAfter};});
 await p.emulateMedia({media:'screen'});
 ok('print rules: a card may break, a chart box may not, a card header stays with what follows',pb.card==='auto'&&pb.box==='avoid'&&pb.head==='avoid',pb);
 /* the whole record from the Record tab */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="record"]').click());await sleep(400);
 await p.evaluate(()=>document.body.classList.add('abc-print-record'));
 const allPdf=await PDF();
 await p.evaluate(()=>document.body.classList.remove('abc-print-record'));
 ok('the record printed from the Record tab holds the log, the samples and the analysis (no more pages than the three printed apart)',pages(allPdf)>=pages(incPdf)+pages(anPdf)&&pages(allPdf)<=pages(incPdf)+pages(anPdf)+6,{all:pages(allPdf),inc:pages(incPdf),an:pages(anPdf)});
 /* the Incidents tab's own Print record still prints that tab alone */
 await p.evaluate(()=>{window.print=()=>{window.__printedWith=document.body.className;};document.querySelector('#viewSeg [data-view="incidents"]').click();});await sleep(300);
 await p.evaluate(()=>document.getElementById('print-record').click());await sleep(200);
 const own=await p.evaluate(()=>window.__printedWith);
 ok('the Incidents tab\'s Print record prints that tab (no record class)',!/abc-print-record/.test(own||''),own);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
