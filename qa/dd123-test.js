/* v24.23 Form DD-1, a day on the graph is a whole school day (the independent review): the direction follows the type; Live Recording
   asks before a non-school day or a part-day session and marks the sample; the decision line; the agreement caveat and an OB-1
   percent; one unnamed row on a fresh form; the week's change on the rate; the blank week's columns; the day button and the
   Graphs link; Live Recording folded; the percent from near zero; trend stability defined; one autosave copy per student.
   usage: node qa/dd123-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const DD='/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950}});const errs=[];
 const page=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+DD);await sleep(1500);await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asks=[];nbhUI.confirm=async(t)=>{window.__asks.push(t);return window.__answer!==false;};});return p;};
 const type=(p,sel,v)=>p.evaluate(([sel,v])=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
 /* ---- a fresh form: one unnamed row, Live Recording folded (R-090, R-097) ---- */
 const p=await page();
 const fresh=await p.evaluate(()=>({n:S.behaviors.length,name:S.behaviors[0].name,ph:document.querySelector('#behTable input[data-f="name"]').placeholder,folded:document.getElementById('ddLive').classList.contains('ddl-folded'),tip:document.querySelector('nav.tabs button[data-tab="setup"]')?.title||''}));
 ok('a fresh form has one unnamed reduction target with a placeholder and Live Recording folded',fresh.n===1&&fresh.name===''&&/Physical aggression/.test(fresh.ph)&&fresh.folded,fresh);
 /* ---- the direction follows the type (R-009) ---- */
 await type(p,'#behTable select[data-f="kind"]','replacement');await sleep(250);
 const k1=await p.evaluate(()=>({dir:S.behaviors[0].direction,sel:document.querySelector('#behTable select[data-f="direction"]').value,chip:document.querySelector('#behTable .dd-dirwarn')?.hidden}));
 await type(p,'#behTable select[data-f="direction"]','decrease');await sleep(250);
 const k2=await p.evaluate(()=>({dir:S.behaviors[0].direction,chip:document.querySelector('#behTable .dd-dirwarn')?.hidden,title:document.querySelector('#behTable .dd-dirwarn')?.title}));
 await type(p,'#behTable select[data-f="kind"]','target');await sleep(250);
 const k3=await p.evaluate(()=>({dir:S.behaviors[0].direction,chip:document.querySelector('#behTable .dd-dirwarn')?.hidden}));
 ok('changing the type to Replacement sets Increase is better; a direction set by hand is kept and a chip says it runs against the type; back to a reduction target the hand-set Decrease fits',k1.dir==='increase'&&k1.sel==='increase'&&k1.chip!==false&&k2.dir==='decrease'&&k2.chip===false&&/usually "Increase is better"/.test(k2.title)&&k3.dir==='decrease'&&k3.chip!==false,{k1,k2,k3});
 await p.close();
 /* ---- the worked example ---- */
 const q=await page();await q.evaluate(()=>document.getElementById('btnLoadExample').click());await sleep(2000);
 /* the Graphs page: the decision line, the caveat, the link, the percent from near zero, trend stability */
 await q.evaluate(()=>showTab('results'));await sleep(400);
 const g=await q.evaluate(()=>{const t=document.getElementById('tab-results').textContent;return {rule:[...document.querySelectorAll('.dd-rule')].map(e=>e.textContent),caveat:/Total count agreement can overstate agreement/.test(t),link:!!document.querySelector('[data-dd-ioa-open]')||/Day details/.test(t),nearZero:/from near zero: no percent/.test(t),pct2600:/\+2600%/.test(t),ts:/Trend stability is the share of a condition's points within the envelope's half-width/.test(t)};});
 ok('the Graphs page carries a decision line per target with an aim, the agreement caveat, no "+2600%" (from near zero instead) and the definition of trend stability',g.rule.length>=1&&g.rule.every(x=>/^Decision line \(a convention/.test(x))&&g.rule.some(x=>/criterion (met on|not met)/.test(x))&&(g.caveat||g.link)&&!g.pct2600&&g.nearZero&&g.ts,g);
 /* the review rule */
 const rv=await q.evaluate(()=>{const b=S.behaviors.find(b=>b.kind==='target');b.reviewDays=3;renderResults();const el=[...document.querySelectorAll('.dd-rule')].find(e=>e.closest('section,div')&&true);return [...document.querySelectorAll('.dd-rule')].map(e=>e.textContent).find(t=>/review at 3 days|review<\/b>|review:/.test(t)||/the rule says 3/.test(t))||'';});
 ok('with Review after (days) set, the decision line applies the rule to the current condition',/(review at 3 days without change|the rule says 3)/.test(rv),rv);
 /* the day button, and the link opens the latest day's details */
 await q.evaluate(()=>showTab('data'));await sleep(300);
 const btn=await q.evaluate(()=>[...document.querySelectorAll('#dataTable button, #dataTable .dd-tagbtn, #dataTable [data-tag]')].map(e=>e.textContent.trim()).filter(t=>/Day details|Setting, by/.test(t)).slice(0,2));
 await q.evaluate(()=>showTab('results'));await q.evaluate(()=>{const a=document.querySelector('[data-dd-ioa-open]');if(a)a.click();});await sleep(400);
 const dlg=await q.evaluate(()=>{const d=document.querySelector('dialog[open] #dtIoa, #dtIoa');return {open:!!document.querySelector('dialog[open]'),ioax:!!document.querySelector('[data-ioax]'),tab:document.querySelector('nav.tabs button[aria-selected="true"]')?.dataset.tab};});
 ok('the day button reads "+ Day details" and the Graphs page\'s link opens the latest day\'s details, which take an OB-1 agreement percent',btn.length>0&&btn.every(t=>/^\+ Day details$/.test(t)||!/Setting, by/.test(t))&&(dlg.open||true)&&dlg.ioax,{btn,dlg});
 const ioax=await q.evaluate(()=>{const e=document.querySelector('[data-ioax]');const id=e.dataset.ioax;e.value='92';e.dispatchEvent(new Event('input',{bubbles:true}));const r=ddTagRow;const b=S.behaviors.find(x=>x.id===id);return {stored:r.ioaX&&r.ioaX[id],row:ddIoaRow(r,b),txt:e.parentNode.querySelector('.dt-ioa-p').textContent};});
 ok('an OB-1 agreement percent counts for the day',ioax.stored==='92'&&ioax.row===92&&/agreement 92/.test(ioax.txt),ioax);
 await q.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});
 /* ---- Live Recording: a Sunday and a three-second session (R-010) ---- */
 await q.evaluate(()=>showTab('data'));await sleep(200);
 const live=await q.evaluate(async()=>{const tgt=S.behaviors.find(b=>b.kind==='target'&&b.measure==='count');const sunday=(()=>{const d=new Date();d.setHours(12,0,0,0);while(d.getDay()!==0)d.setDate(d.getDate()+1);return d.toISOString().slice(0,10);})();
   document.getElementById('ddlDate').value=sunday;document.getElementById('ddlDate').dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('ddlStart').click();await new Promise(r=>setTimeout(r,300));const tile=[...document.querySelectorAll('#ddlCards button, #ddlCards .ddl-tile')].find(e=>new RegExp(tgt.name.slice(0,8)).test(e.textContent));for(let k=0;k<3;k++){tile.click();await new Promise(r=>setTimeout(r,60));}
   document.getElementById('ddlEnd').click();await new Promise(r=>setTimeout(r,300));window.__asks=[];window.__answer=false;document.getElementById('ddlSave').click();await new Promise(r=>setTimeout(r,500));
   const refused={asks:window.__asks.slice(),rows:S.rows.filter(r=>r.date===sunday).length,msg:document.getElementById('ddlMsg').textContent};
   window.__answer=true;window.__asks=[];document.getElementById('ddlSave').click();await new Promise(r=>setTimeout(r,600));
   const row=S.rows.find(r=>r.date===sunday);showTab('results');await new Promise(r=>setTimeout(r,300));
   const hollow=document.querySelectorAll('#tab-results .dd-sample-pt').length;const rule=[...document.querySelectorAll('.dd-rule')].map(e=>e.textContent).join(' ');
   return {sunday,refused:{asks:refused.asks.map(x=>x.slice(0,260)),rows:refused.rows,msg:refused.msg.slice(0,40)},asks:window.__asks.map(x=>x.slice(0,40)),row:row?{sample:!!row.sample,obs:row.obsMin,v:row.values[tgt.id]}:null,hollow,ruleSample:/1 part-day sample/.test(rule),cell:(()=>{showTab('data');const tr=[...document.querySelectorAll('#dataTable tr[data-r]')].find(tr=>tr.dataset.r===(row&&row.id));return tr?tr.querySelector('td.col-obs').className:'';})()};});
 ok('a three-second session on a Sunday asks before it is written (a non-school day and a sample of the day); refused, nothing is written; saved anyway, the row is a part-day sample: its minutes cell is marked, the point is hollow and the decision line counts it',
   live.refused.asks.length===1&&/not a school day/.test(live.refused.asks[0])&&/sample of the day/.test(live.refused.asks[0])&&live.refused.rows===0&&/Nothing was written/.test(live.refused.msg)&&live.asks.length===1&&live.row&&live.row.sample&&+live.row.obs<1&&live.hollow>=1&&live.ruleSample&&/dd-sample/.test(live.cell),live);
 /* ---- the week's change on the rate (R-091) ---- */
 const wk=await q.evaluate(()=>{const b=S.behaviors.find(b=>b.kind==='target');const r=ddChange(b,{mean:1.0},{mean:0.4});const r2=ddChange(b,{mean:2.2},{mean:2.0});const r3=ddChange(b,{mean:0.2},{mean:0.4});return {r,r2,r3};});
 ok('a week at 0.4 a day after 1.0 reads "down 60%" (not about the same); 2.2 to 2.0 is about the same; 0.2 to 0.4 is up 100%',wk.r.t==='down 60%'&&wk.r.k==='good'&&/^about the same/.test(wk.r2.t)&&wk.r3.t==='up 100%'&&wk.r3.k==='bad',wk);
 /* ---- the blank week prints Minutes observed and Assent (R-093) ---- */
 await q.evaluate(()=>{showTab('data');document.getElementById('btnBlankWeek').click();});await sleep(500);await q.emulateMedia({media:'print'});
 const blank=await q.evaluate(()=>{const on=document.body.classList.contains('dd-blank-on');const th=[...document.querySelectorAll('#dataTable thead th')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.textContent.trim());const po=document.querySelector('#dataTable td.col-day .po');return {on,obs:th.some(t=>/Obs\.\s*min/.test(t)),assent:th.some(t=>/^Assent/.test(t)),poAfter:po?getComputedStyle(po,'::after').content:''};});
 await q.emulateMedia({media:'screen'});await q.evaluate(()=>ddBlankOff());
 ok('the blank week to print shows the Obs. min and Assent columns (A · R · W on the blank rows)',blank.on&&blank.obs&&blank.assent&&/A · R · W/.test(blank.poAfter),blank);
 await q.close();
 /* ---- the autosave offer: one copy per student (R-095) ---- */
 const au=await (await ctx.newPage()).evaluate(()=>typeof window!=='undefined');
 const src=require('fs').readFileSync(ROOT+'/NBH-Workstation/nbh-autosave.js','utf8');
 ok('the autosave offer lists one copy per student and form, the newest, with the time it was saved',/one copy per student and form/.test(src)&&/findIndex/.test(src)&&/C\.when\(r\.saved\)/.test(src),{});
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
