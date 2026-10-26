/* v24.22 shared numeric validation (the independent review's R-032 theme): the field-care helper; TB-1's agreement pilot; DD-1's daily
   sheet; SM-1's Record; RS-1's service days. usage: node qa/num122-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const F=p=>'/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>f.startsWith(p));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950}});const errs=[];
 const page=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url.slice(0,24)+': '+String(e)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+url);await sleep(1500);await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});return p;};
 const type=(p,sel,v)=>p.evaluate(([sel,v])=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
 const st=(p,sel)=>p.evaluate(sel=>{const e=document.querySelector(sel);return e?{inv:e.getAttribute('aria-invalid'),cls:e.className,title:e.title,v:e.value}:null;},sel);
 /* ---------------- the helper ---------------- */
 const t=await page(F('TB-1_'));
 const helper=await t.evaluate(()=>({has:!!(window.nbhNum&&nbhNum.mark&&nbhNum.why),css:!!document.getElementById('nbh-num-css'),w1:nbhNum.why('-3',{min:0}),w2:nbhNum.why('abc',{min:0}),w3:nbhNum.why('2.5',{min:0,int:true}),w4:nbhNum.why('150',{min:0,max:100}),w5:nbhNum.why('',{min:0}),w6:nbhNum.why('7',{min:0,max:100,int:true})}));
 ok('every form carries nbhNum: why() reads a number with its rule, mark() is there, and the style is injected',helper.has&&helper.css&&/0 or more/.test(helper.w1)&&helper.w2==='not a number'&&/whole number/.test(helper.w3)&&/100 or less/.test(helper.w4)&&helper.w5===''&&helper.w6==='',helper);
 /* ---------------- TB-1: the agreement pilot (R-005) ---------------- */
 await t.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);await t.evaluate(()=>document.querySelector('#viewSeg [data-view="qc"], #viewSeg [data-view="quality"], #viewSeg button:nth-child(4)').click());await sleep(300);
 const row=await t.evaluate(()=>{const tr=document.querySelector('#ioaBody tr');const g=k=>tr.querySelector('[name$=".'+k+'"]');const q=document.querySelector('[name^="qc["][name$="'+(window.IOA_QC||'')+'"]');return {x:g('x').value,y:g('y').value,a:g('a').value,ro:g('a').readOnly,xn:g('x').name,mode:g('x').getAttribute('inputmode')};});
 const T=row.xn.replace(/\.x$/,'');const sel=k=>`[name="${T}.${k}"]`;
 const qSel=await t.evaluate(T=>{const t=/ioa\[(.+)\]/.exec(T)[1];const k=typeof IOA_QC!=='undefined'?IOA_QC:'';const q=document.querySelector('[name="qc['+t+'].'+k+'"]');return q?q.name:'';},T);
 const qState=()=>t.evaluate(q=>{const e=document.querySelector('[name="'+q+'"]');return e?{checked:e.checked,disabled:e.disabled,title:e.title}:null;},qSel);
 const q0=await qState();
 await type(t,sel('x'),'25');await sleep(150);const bad1=await t.evaluate(([sx,sy,sa])=>({x:document.querySelector(sx).getAttribute('aria-invalid'),xt:document.querySelector(sx).title,a:document.querySelector(sa).value,y:document.querySelector(sy).getAttribute('aria-invalid')}),[sel('x'),sel('y'),sel('a')]);const q1=await qState();
 await type(t,sel('x'),'abc');await sleep(150);const bad2=await st(t,sel('x'));
 await type(t,sel('x'),'19');await type(t,sel('y'),'0');await sleep(150);const bad3=await t.evaluate(([sy,sa])=>({y:document.querySelector(sy).getAttribute('aria-invalid'),a:document.querySelector(sa).value}),[sel('y'),sel('a')]);
 await type(t,sel('y'),'20');await sleep(150);const good=await t.evaluate(([sx,sa])=>({x:document.querySelector(sx).getAttribute('aria-invalid'),a:document.querySelector(sa).value}),[sel('x'),sel('a')]);const q2=await qState();
 ok('TB-1: A above B blanks the Agree %, marks A and unticks and disables the criterion row with the reason; letters and B at 0 do the same; 19 of 20 gives 95 and the row back',
   row.mode==='decimal'&&row.ro&&row.a==='95'&&bad1.x==='true'&&/cannot be more than B/.test(bad1.xt)&&bad1.a===''&&(!qSel||(q1&&!q1.checked&&q1.disabled&&/not right/.test(q1.title)))&&bad2.inv==='true'&&bad3.y==='true'&&bad3.a===''&&good.x==null&&good.a==='95'&&(!qSel||(q2&&!q2.disabled)),{row,qSel,q0,bad1,q1,bad2,bad3,good,q2});
 await t.close();
 /* ---------------- DD-1: the daily sheet (R-006, B-51) ---------------- */
 const d=await page('/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');
 await d.evaluate(()=>document.getElementById('btnLoadExample').click());await sleep(1800);await d.evaluate(()=>showTab('data'));await sleep(300);
 const cell=await d.evaluate(()=>{const e=[...document.querySelectorAll('#dataTable input[data-v]')].find(e=>!/::opp$/.test(e.dataset.v)&&e.value!=='');const b=S.behaviors.find(b=>b.id===e.dataset.v);return {key:e.dataset.v,v:e.value,step:e.step,min:e.min,mode:e.getAttribute('inputmode'),measure:b.measure,row:e.closest('tr').dataset.r};});
 const before=await d.evaluate(k=>{const r=S.rows.find(r=>r.id===k.row),b=S.behaviors.find(b=>b.id===k.key);return plotValue(r,b);},cell);
 await type(d,`#dataTable input[data-v="${cell.key}"]`,'-3');await sleep(200);
 const neg=await d.evaluate(k=>{const e=document.querySelector('#dataTable input[data-v="'+k.key+'"]');const r=S.rows.find(r=>r.id===k.row),b=S.behaviors.find(b=>b.id===k.key);showTab('results');return {inv:e.getAttribute('aria-invalid'),title:e.title,pv:plotValue(r,b),caution:[...document.querySelectorAll('#tab-results .caution, .caution')].map(c=>c.textContent).find(t=>/below zero/.test(t))||''};},cell);
 await d.evaluate(()=>showTab('data'));await type(d,`#dataTable input[data-v="${cell.key}"]`,'2.5');await sleep(200);
 const frac=await d.evaluate(k=>{const e=document.querySelector('#dataTable input[data-v="'+k.key+'"]');const r=S.rows.find(r=>r.id===k.row),b=S.behaviors.find(b=>b.id===k.key);return {inv:e.getAttribute('aria-invalid'),title:e.title,pv:plotValue(r,b)};},cell);
 await type(d,`#dataTable input[data-v="${cell.key}"]`,cell.v);await sleep(200);const back=await st(d,`#dataTable input[data-v="${cell.key}"]`);
 ok('DD-1: a count cell is a whole number at 0 or more (step 1, min 0, number keyboard); −3 is marked, left out of the plotted value and counted on the Graphs page; 2.5 is marked as a check-the-entry but kept; the original clears the mark',
   cell.measure==='count'&&cell.step==='1'&&cell.min==='0'&&cell.mode==='numeric'&&before!==null&&neg.inv==='true'&&/below zero/.test(neg.title)&&neg.pv===null&&/1 entry is below zero on the daily sheet/.test(neg.caution)&&frac.inv==='true'&&/whole number/.test(frac.title)&&frac.pv===2.5&&back.inv==null,{cell,before,neg,frac,back});
 await d.close();
 /* ---------------- SM-1: the Record (R-100) ---------------- */
 const m=await page(F('SM-1_'));
 await m.evaluate(()=>document.getElementById('simBtn').click());await sleep(1800);await m.evaluate(()=>document.querySelector('#viewSeg [data-view="record"], #viewSeg [data-view="log"]').click());await sleep(300);
 const n0=await m.evaluate(()=>({n:S.log.length,met:document.getElementById('logMetrics').textContent.match(/Goal met at the current goal(\d+ of \d+|—)/)?.[1]}));
 await m.evaluate(()=>document.getElementById('addL').click());await sleep(300);
 const i=n0.n;const f=k=>`#lTbl input[data-r="log"][data-i="${i}"][data-f="${k}"]`;
 await type(m,f('date'),'2026-10-26');await type(m,f('ph'),'1');await type(m,f('goal'),'150');await type(m,f('pts'),'40');await type(m,f('poss'),'36');await type(m,f('beh'),'120');await type(m,f('m'),'20');await type(m,f('n'),'18');await sleep(300);
 const badRow=await m.evaluate(i=>{const tr=document.querySelector('#lTbl input[data-i="'+i+'"]').closest('tr');const g=k=>tr.querySelector('[data-f="'+k+'"]');return {pts:g('pts').getAttribute('aria-invalid'),ptsT:g('pts').title,m:g('m').getAttribute('aria-invalid'),beh:g('beh').getAttribute('aria-invalid'),goal:g('goal').getAttribute('aria-invalid'),pct:tr.children[6].textContent,agree:tr.children[10].textContent,met:tr.children[12].textContent,rowsMt:rows()[i].mt,rowsBad:rows()[i].bad};},i);
 await type(m,f('goal'),'75');await type(m,f('pts'),'30');await type(m,f('beh'),'80');await type(m,f('m'),'16');await sleep(300);
 const goodRow=await m.evaluate(i=>{const tr=document.querySelector('#lTbl input[data-i="'+i+'"]').closest('tr');return {inv:tr.querySelectorAll('[aria-invalid]').length,pct:tr.children[6].textContent,agree:tr.children[10].textContent,met:tr.children[12].textContent,mt:rows()[i].mt};},i);
 ok('SM-1: points above possible, matches above ratings, a behavior percent of 120 and a goal of 150 mark their cells, show "—" for the percent, agreement and goal-met, and keep the day out of the rule; fixed entries count again',
   badRow.pts==='true'&&/more than the points possible/.test(badRow.ptsT)&&badRow.m==='true'&&badRow.beh==='true'&&badRow.goal==='true'&&badRow.pct==='—'&&badRow.agree==='—'&&badRow.met==='—'&&badRow.rowsMt===null&&!!badRow.rowsBad&&goodRow.inv===0&&/83/.test(goodRow.pct)&&/89/.test(goodRow.agree)&&/yes/.test(goodRow.met)&&goodRow.mt===true,{n0,badRow,goodRow});
 await m.close();
 /* ---------------- RS-1: the service days (R-119) ---------------- */
 const r=await page(F('RS-1_'));
 await r.evaluate(()=>document.getElementById('simBtn').click());await sleep(1800);await r.evaluate(()=>document.querySelector('#viewSeg [data-view="month"]').click());await sleep(400);
 const day=await r.evaluate(()=>{const e=[...document.querySelectorAll('#dayTbl input[data-f="brk"]')].find(e=>{const d=findDay(e.dataset.d);return d&&d.start&&d.end&&!d.none;});const d=findDay(e.dataset.d);return {id:d.id,brk:d.brk,hrs:document.getElementById('h_'+d.id).textContent,len:toMin(d.end)-toMin(d.start)};});
 const hr=()=>r.evaluate(id=>({hrs:document.getElementById('h_'+id).textContent,inv:document.getElementById('d_'+id+'_brk').getAttribute('aria-invalid'),title:document.getElementById('d_'+id+'_brk').title,tot:document.getElementById('monthTotals')?.textContent||''}),day.id);
 await type(r,`#d_${day.id}_brk`,'-20');await sleep(200);const neg2=await hr();
 await type(r,`#d_${day.id}_brk`,String(day.len+30));await sleep(200);const big=await hr();
 await type(r,`#d_${day.id}_brk`,day.brk||'');await sleep(200);const ok2=await hr();
 ok('RS-1: minutes not in services below 0, or at the day\'s length, mark the cell and give the day no hours; the original gives the hours back',
   neg2.inv==='true'&&/0 or more/.test(neg2.title)&&neg2.hrs==='—'&&big.inv==='true'&&/day's length/.test(big.title)&&big.hrs==='—'&&ok2.inv==null&&ok2.hrs===day.hrs&&day.hrs!=='—',{day,neg2,big,ok2});
 await r.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
