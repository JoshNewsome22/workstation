/* v22.53 Form HD-1, the home data sheets (review F369 to F377, I188 to I190). What is checked:
   F369 the sheet tells the family to write 0 when it did not happen and a dash when the routine did not happen, and the
        example row shows both; on Entry a dash is not asked for, a blank is a gap, the day total says how many routines
        were marked and the graph draws an open point; the Routine did not happen button marks a box with a tap.
   F370 each week keeps the design its sheets went home with: changing the days or unticking a routine on Setup leaves
        the weeks typed in (totals, case days) as they were; a new week follows Setup; a week start that is not a Monday
        is moved to that week's Monday, and the graph and the case use the same date.
   F371 a rating agrees only when the two numbers are the same (within one shown beside it); agreement for each behavior;
        the verdict rests on the lowest and names a behavior with no counted check; a phone check is not counted.
   F372 the checklist, the ABC notes and the sleep log are typed in, summed and passed to the case as numbers only; a
        sheet not sent that week is not due; the sleep rows read "Sun night -> Mon"; the simulation's decision matches
        its own figures; the ABC notes export in Form ABC-1's columns.
   F375 targets from Form TB-1 come in urgency order with the matching measure, four at most, the rest named; a
        replacement goes to the checklist; a rename on TB-1 is offered and keeps the marks; the picker stops at six;
        TD-1's response fills the shared line; the consent on file comes from Form IC-1.
   F376 the routine notes print. F373 a fixed safety line first, "Tell us the next school day if", no form numbers on
   the family's lines, and the family's copy prints without the record's page header and footer. F374 a condition for
   each week, a phase line on the graph, the phase in the case, and baseline sheets without plan lines. F377 the rule
   for marking each behavior, no total for a rating, the split ABC 'after' list, a warning for a countable behavior
   rated. I189 marks a week and pages (the estimate equals the printed pages). I190 the family's agreement and the line
   that it is their choice. I188 the note back to the family. Plus: a save and open reads back exactly, an older file
   keeps its weeks, no box is a staff-directory box, and no family detail goes to the case.
   Simulated people only. usage: node qa/v2253-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),cp=require('child_process');
let fails=0,n=0;const ok=(name,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+name+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const FORM=L.BASE+'/NBH-Workstation/HD-1_Home-Data-Sheets_v2026-10.html';
const OUT=path.join(__dirname,'out','v2253');fs.mkdirSync(OUT,{recursive:true});
const pdfText=f=>cp.execFileSync('python3',['-c','import pymupdf,sys;d=pymupdf.open(sys.argv[1]);print(d.page_count);print("\\n".join(p.get_text() for p in d))',f]).toString();
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820}});
  try{await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:L.BASE});}catch(e){}
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto(FORM);await sleep(700);
    await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};window.__dl=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>window.__dl.push(t));return o(b);};});return p;};
  const sim=async p=>{await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);};
  const view=async(p,v)=>{await p.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);};
  const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():null;},s);

  /* ================= F369 ================= */
  let p=await open();
  await p.evaluate(()=>{S=blank();S.bh[0]=mkBh({name:'Hitting',ex:'a hand lands on a person',nex:'a high five'});S.bh.push(mkBh({name:'Tantrum',ms:'dur'}));renderAll();});
  await view(p,'sheets');
  let box=await txt(p,'#sheetOut .hs[data-sheet="tally"] .hs-box');
  ok('1 F369 the tally sheet: a mark each time and "Write 0 if it did not happen" for a count and for minutes',/Hitting: make one mark \(\|\) each time it happens\. Write 0 if it did not happen\./.test(box)&&/Tantrum: write how many minutes it lasted, all together\. Write 0 if it did not happen\./.test(box),box);
  ok('2 F369 a dash for a routine that did not happen, and a blank only for a forgotten routine',/If a routine did not happen that day \(no outing, no homework\), draw a line \(—\) in its box\./.test(box)&&/If you forget to mark a routine, leave it blank\./.test(box),box);
  const ex=await p.evaluate(()=>[...document.querySelectorAll('#sheetOut .hs[data-sheet="tally"] tr.ex td')].map(t=>t.textContent.trim()));
  ok('3 F369 the example row writes 0 on Wednesday and a dash on Saturday, total 9',JSON.stringify(ex.slice(2))==='["||","|","0","|||","|","—","||","9"]',ex);
  await p.evaluate(()=>{S.bh.pop();renderAll();});await view(p,'entry');
  await p.fill('[data-w="start"]','9/14/26');await p.dispatchEvent('[data-w="start"]','change');
  await p.fill('[data-e="b0_r0_d0"]','2');await sleep(100);
  let c=await p.evaluate(()=>completeness(week()));
  ok('4 F369 one mark on Monday morning and nothing else: a blank stays a gap (1 of 35, the week is not used)',c.ask===35&&c.got===1&&/below 50%/.test(await txt(p,'#entVerdict')),c);
  await p.evaluate(()=>{document.querySelectorAll('#entTbl [data-e]').forEach(i=>{if(!i.value){i.value='0';i.dispatchEvent(new Event('input',{bubbles:true}));}});});await sleep(100);
  c=await p.evaluate(()=>completeness(week()));let H=await p.evaluate(()=>window.__nbhFactsOut().home);
  ok('5 F369 with the zeros the family wrote, a good week is complete and every day reaches the case',c.p===100&&/A full week/.test(await txt(p,'#entVerdict'))&&H.data.length===7&&H.data.map(x=>x.value).join()==='2,0,0,0,0,0,0',{c,d:H.data});
  await p.fill('[data-e="b0_r4_d1"]','-');await p.dispatchEvent('[data-e="b0_r4_d1"]','change');await sleep(80);
  c=await p.evaluate(()=>completeness(week()));
  ok('6 F369 a dash (typed -) is kept as "—", is not asked for and is not a gap',(await p.inputValue('[data-e="b0_r4_d1"]'))==='—'&&c.ask===34&&c.got===34&&c.na===1&&await p.evaluate(()=>document.querySelector('[data-e="b0_r4_d1"]').closest('td').classList.contains('na')),c);
  await p.fill('[data-e="b0_r0_d2"]','');await sleep(80);
  const dt=await txt(p,'#t_b0_d2');
  ok('7 F369 a day with one routine not marked: the day total says how many were marked, and the graph draws an open point',/^0\s*4 of 5 routines$/.test(dt)&&await p.evaluate(()=>document.querySelectorAll('#entPlot circle.pt-open').length===1),dt);
  await p.click('#dashMode');await p.dispatchEvent('[data-e="b0_r4_d3"]','pointerdown');await sleep(60);
  const v1=await p.inputValue('[data-e="b0_r4_d3"]');await p.dispatchEvent('[data-e="b0_r4_d3"]','pointerdown');await sleep(60);
  ok('8 F369 Routine did not happen (—): pressed, a tap marks the box with a dash and a second tap clears it',await p.getAttribute('#dashMode','aria-pressed')==='true'&&v1==='—'&&(await p.inputValue('[data-e="b0_r4_d3"]'))==='',v1);
  await p.click('#dashMode');
  await p.close();

  /* ================= F370 ================= */
  p=await open();await sim(p);
  const base=await p.evaluate(()=>{const w=S.wk[0],H=window.__nbhFactsOut().home;return {hit:weekTotal(w,0).txt,tan:weekTotal(w,1).txt,n:H.data.length,mon:H.data.find(x=>/^Tantrum/.test(x.beh)).value};});
  ok('9 F370 the simulation: week 1 hitting 17, tantrum 117 minutes, 63 home days, Monday tantrum 15',base.hit==='17'&&base.tan==='117'&&base.n===63&&base.mon===15,base);
  await view(p,'sheets');await p.selectOption('[data-m="sh_days"]','5');await sleep(100);
  await view(p,'setup');await p.uncheck('[data-r="rt"][data-i="2"][data-f="on"]');await sleep(150);
  const aft=await p.evaluate(()=>{const w=S.wk[0],H=window.__nbhFactsOut().home;return {hit:weekTotal(w,0).txt,tan:weekTotal(w,1).txt,n:H.data.length,mon:H.data.find(x=>/^Tantrum/.test(x.beh)).value,cost:sheetCost().tally};});
  ok('10 F370 Monday to Friday and Homework unticked for the sheets to come: the weeks typed in keep 17, 117, 63 days and Monday 15',aft.hit==='17'&&aft.tan==='117'&&aft.n===63&&aft.mon===15&&aft.cost===3*4*5,aft);
  await view(p,'entry');
  ok('11 F370 a past week says it keeps the sheets it went home with, and offers the current Setup',/This week keeps the sheets it went home with: Monday to Sunday; Morning, Meals, Homework, Bedtime, Outings/.test(await txt(p,'#wkDesign')||'')&&!!(await p.$('#wkUseCur')));
  await p.click('#addWk');await sleep(150);
  const nw=await p.evaluate(()=>({heads:[...document.querySelectorAll('#entTbl thead th')].map(t=>t.textContent),rows:document.querySelectorAll('#entTbl tbody tr').length,start:week().start,prev:S.wk[2].start,cond:week().cond}));
  ok('12 F370 a new week follows Setup now (five days, four routines) and starts the Monday after the last week',nw.heads.length===8&&nw.heads[6]==='Fri'&&nw.rows===3*5&&nw.start&&nw.start!==nw.prev&&nw.cond==='Plan',nw);
  await p.fill('[data-e="b0_r0_d0"]','1');await sleep(100);
  const dzl=await p.evaluate(()=>({dz:week().dz,lab:[...document.querySelectorAll('#entPlot .dz-lab')].map(t=>t.textContent)}));
  ok('12b F370 its first mark keeps that design with the week, and the graph marks the week the sheet changed',JSON.stringify(dzl.dz)==='{"days":"5","rt":[0,1,3,4],"bh":[0,1,2]}'&&dzl.lab.join()==='sheet changed',dzl);
  await p.close();
  p=await open();await p.evaluate(()=>{S=blank();S.bh[0]=mkBh({name:'Hitting'});renderAll();});await view(p,'entry');
  await p.fill('[data-w="start"]','9/13/26');await p.dispatchEvent('[data-w="start"]','change');await sleep(80);
  await p.fill('[data-e="b0_r0_d0"]','2');await sleep(100);
  const ws=await p.evaluate(()=>({v:document.querySelector('[data-w="start"]').value,note:document.querySelector('#wkStartNote').textContent,date:window.__nbhFactsOut().home.data[0].date,lab:[...document.querySelectorAll('#entPlot text')].map(t=>t.textContent).find(t=>/^\d+\/\d+$/.test(t))}));
  ok('13 F370 a Sunday start: the page says so, the week of Monday 9/14/26 is used, and the graph and the case agree on Monday 9/14',ws.v==='9/14/26'&&/9\/13\/26 is a Sunday; the week of Monday 9\/14\/26 is used\./.test(ws.note)&&ws.date==='2026-09-14'&&ws.lab==='9/14',ws);
  await p.fill('[data-w="start"]','9/16/26');await p.dispatchEvent('[data-w="start"]','change');await sleep(80);
  ok('14 F370 a Wednesday start moves back to its Monday',(await p.inputValue('[data-w="start"]'))==='9/14/26'&&/is a Wednesday/.test(await txt(p,'#wkStartNote')));
  /* an older file: a week with marks and no design takes the design the file was saved with */
  const old={form:'HD-1',rev:'2026-10',S:{meta:{client:'Mateo Rivera (simulated)',sh_days:''},chk:{tally:true},bh:[{name:'Hitting',ex:'',nex:'',ms:'tally',todo:''}],rt:[{label:'Morning',time:'',on:true,note:''},{label:'Homework',time:'',on:true,note:''}],sk:[],ag:[],
    wk:[{start:'9/14/26',cells:{b0_r0_d0:'2',b0_r1_d0:'3',b0_r1_d6:'4'}}]}};
  await p.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(old));await sleep(400);
  const od=await p.evaluate(()=>{const a=weekTotal(S.wk[0],0).txt;S.meta.sh_days='5';S.rt[1].on=false;renderAll();return {dz:S.wk[0].dz,a,b:weekTotal(S.wk[0],0).txt};});
  ok('15 F370 an earlier file: its week keeps the routines and days it was saved with (9 stays 9 after Setup changes)',od.a==='9'&&od.b==='9'&&JSON.stringify(od.dz)==='{"days":"","rt":[0,1],"bh":[0]}',od);
  await p.close();

  /* ================= F371 ================= */
  p=await open();await sim(p);await view(p,'entry');
  const ag=await p.evaluate(()=>{const r=(bh,s,h)=>mkAg({bh:String(bh),staff:String(s),home:String(h)});return {r12:[agree(r(2,1,2)),agreeW1(r(2,1,2))],r01:agree(r(2,0,1)),r23:[agree(r(2,2,3)),agreeW1(r(2,2,3))],r22:agree(r(2,2,2)),r03:agreeW1(r(2,0,3)),t:agree(r(1,20,25))};});
  ok('16 F371 a rating agrees only when the numbers are the same (1/2, 0/1 and 2/3 are 0%, within one 100%); minutes stay smaller / larger',ag.r12[0]===0&&ag.r12[1]===100&&ag.r01===0&&ag.r23[0]===0&&ag.r23[1]===100&&ag.r22===100&&ag.r03===0&&ag.t===80,ag);
  let am=await txt(p,'#agMetrics');
  ok('17 F371 agreement for each behavior; the phone check is shown and not counted; the verdict names Fussing as having no check that counts, and does not say to use the data as they stand',/Agreement, Hitting\s*100%\s*2 checks counted/.test(am)&&/Agreement, Fussing\s*—\s*0 checks counted · 1 by phone, not counted/.test(am)&&/Fussing \(whining, arguing, refusing\) has no check that counts yet \(a check by phone is not counted\)/.test(am)&&!/as they stand/.test(am)&&await p.evaluate(()=>!!document.querySelector('#agMetrics .verdict.v-mid')),am);
  await p.fill('[data-r="ag"][data-i="1"][data-f="home"]','50');await sleep(80);am=await txt(p,'#agMetrics');
  ok('18 F371 the verdict rests on the lowest behavior: Tantrum at 40% is below 60% although the checks average higher',/Below 60% for Tantrum \(crying or screaming more than a minute\) \(40%\)/.test(am)&&await p.evaluate(()=>!!document.querySelector('#agMetrics .verdict.v-no')),am);
  await p.fill('[data-r="ag"][data-i="1"][data-f="home"]','30');await sleep(80);am=await txt(p,'#agMetrics');
  ok('19 F371 between 60% and 80%: hold that behavior\'s home data from decisions until a check reaches 80%',/Between 60% and 80% for Tantrum .* \(67%\): .*hold its home data from decisions until a check reaches 80%/.test(am),am);
  const head=await p.evaluate(()=>[...document.querySelectorAll('#agTbl thead th')].map(t=>t.textContent));
  ok('20 F371 a How staff watched column; the bedtime phone check reads "by phone, not counted"; each writes their mark before seeing the other\'s',head.includes('How staff watched')&&(await p.inputValue('[data-r="ag"][data-i="2"][data-f="how"]'))==='Phone or audio only'&&/by phone, not counted/.test(await p.evaluate(()=>document.querySelectorAll('#agTbl .agv')[2].textContent))&&/Each person writes down their own mark before seeing the other/.test(await p.evaluate(()=>document.querySelector('.only-entry').textContent)),head);

  /* ================= F372 ================= */
  await p.fill('[data-r="ag"][data-i="1"][data-f="home"]','25');await sleep(60);
  const ent=await p.evaluate(()=>({ck:document.querySelectorAll('#ckTbl select[data-k]').length,ckd:document.querySelector('#ck_d0').textContent,abc:document.querySelectorAll('#abcTbl tbody tr').length,
    abcSum:document.querySelector('#abcSum').textContent.replace(/\s+/g,' '),sl:[...document.querySelectorAll('#slTbl tbody td.lk')].map(t=>t.textContent),slh:document.querySelector('#slh_1').textContent,slm:document.querySelector('#slm_1').textContent,slSum:document.querySelector('#slSum').textContent.replace(/\s+/g,' ')}));
  ok('21 F372 the checklist is typed in on Entry (step by routine by day) with the steps done each day',ent.ck===18*7&&/^\d+%$/.test(ent.ckd),ent);
  ok('22 F372 the ABC notes are typed in, with counts for what came before and after across the weeks',ent.abc===4&&/Told to do something\s*2/.test(ent.abcSum)&&/I followed the plan step\s*1/.test(ent.abcSum),ent.abcSum);
  ok('23 F372 the sleep log: rows read "Sun night → Mon", hours asleep with short nights flagged, and the next morning beside them',ent.sl[0]==='Sun night → Mon'&&ent.sl[6]==='Sat night → Sun'&&/^8\.0 short/.test(ent.slh)&&/Fussing: 2/.test(ent.slm),ent);
  ok('24 F372 short or broken nights: the morning comparison, and a note to consider suggesting the family talk with the child\'s doctor (Code 2.12)',/Fussing at the morning routine: 1\.3 on the 6 mornings after a short or broken night, 0\.0 on the 14 other mornings/.test(ent.slSum)&&/talk with the child’s doctor \(BACB Ethics Code 2\.12/.test(ent.slSum),ent.slSum);
  H=await p.evaluate(()=>window.__nbhFactsOut().home);
  ok('25 F372 a sheet not sent that week is not due: 11 sheets, no checklist for week 3 (the Today list will not call it overdue)',H.sheets.length===11&&H.sheets.filter(s=>s.kind==='check').length===2&&/not sent/.test(await txt(p,'#retOut')),H.sheets.map(s=>s.name));
  ok('26 F372 the case gets the checklist (steps done each day), the ABC counts and the hours asleep',H.integrity.length===13&&H.integrity.every(x=>x.date&&typeof x.pct==='number')&&H.abc.notes===4&&H.abc.before['Told to do something']===2&&H.sleep.length===20&&H.sleep.filter(x=>x.short).length===6,{i:H.integrity.length,a:H.abc,s:H.sleep.length});
  const fj=JSON.stringify(await p.evaluate(()=>window.__nbhFactsOut()));
  ok('27 no family detail goes to the case: no caregiver name, phone, child\'s name or the family\'s own words',!/Rivera|555-01|Sam\b|math page|Cousins|cough|SIMULATED/.test(fj),fj.match(/Rivera|555-01|Sam\b|math page|Cousins|cough|SIMULATED/));
  const dec=await p.evaluate(()=>{const rg=wi=>{const v=wD(S.wk[wi]).map(di=>dayTotal(S.wk[wi],0,di).v);return Math.min(...v)+' to '+Math.max(...v);};return {d:S.meta.decision,w1:rg(0),w3:rg(2)};});
  ok('28 F372 the simulation\'s decision quotes its own figures (hitting '+dec.w1+' a day in week 1, '+dec.w3+' in week 3; the sleep log it now holds)',dec.d.indexOf('Hitting ran '+dec.w1+' a day in week 1 and '+dec.w3+' in week 3')>0&&dec.w1==='1 to 4'&&dec.w3==='0 to 1'&&/short or broken nights were followed by a morning fussing rating of 1\.3/.test(dec.d)&&!/2 to 5/.test(dec.d),dec);
  await p.evaluate(()=>{window.__dl=[];document.querySelector('#abcCsv').click();});await sleep(300);
  const abcCsv=(await p.evaluate(()=>window.__dl[0]))||'';const abc1=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation','ABC_Recording_Conditional_Probability_Analysis.html'),'utf8');
  const hd=abcCsv.replace(/^﻿/,'').split('\r\n');
  ok('29 F372 the ABC notes export in Form ABC-1\'s own CSV columns, one row a note, dated from the week',abc1.indexOf('const head = ["'+hd[0].split(',').join('","')+'"]')>0&&hd.length===5&&/^HD1-1,\d{4}-\d{2}-\d{2},4:10 pm,,Homework,/.test(hd[1]),hd.slice(0,2));

  /* ================= F376 / F373 / I190 on the simulated sheets ================= */
  await view(p,'sheets');
  const sh=await p.evaluate(()=>{const o=document.querySelector('#sheetOut');return {all:o.textContent.replace(/\s+/g,' '),tally:o.querySelector('[data-sheet="tally"]').textContent.replace(/\s+/g,' '),grp:[...o.querySelectorAll('[data-sheet="check"] tr.grp')].map(t=>t.textContent.replace(/\s+/g,' ')),
    first:[...o.querySelectorAll('.hs-end')].map(e=>e.firstElementChild.className),safe:o.querySelector('.hs-safe').textContent,choice:o.querySelectorAll('.hs-choice').length,hs:o.querySelectorAll('.hs').length,night:[...o.querySelectorAll('[data-sheet="sleep"] td.night')].map(t=>t.textContent)};});
  ok('30 F376 the routine notes print under the routine on the tally sheet and the checklist',/Meals\s*breakfast and dinner\s*count both meals together/.test(sh.tally)&&/draw a line \(—\) on a day with no outing/.test(sh.tally)&&sh.grp.some(g=>/Meals .*count both meals together/.test(g)),sh.grp);
  ok('31 F373 every sheet starts its foot with the fixed safety line: call 911 or the child\'s doctor, then let us know',sh.first.length===4&&sh.first.every(c=>c==='hs-safe')&&sh.safe==='If anyone is hurt or in danger, call 911 or your child’s doctor. Then let us know.',sh.first);
  ok('32 F373 "Tell us the next school day if" in place of "Call right away if", and no form numbers on the family\'s lines',/Tell us the next school day if a tantrum lasts more than 20 minutes/.test(sh.all)&&!/Call right away/.test(sh.all)&&!/\(Forms? [A-Z]{2,3}-\d/.test(sh.all),sh.all.match(/\(Forms? [A-Z]{2,3}-\d[^)]*\)/));
  await p.evaluate(()=>{S.meta.todo='Stay calm (Form TD-1); follow the plan.';S.meta.urgent='a tantrum lasts more than 20 minutes (Form CR-1)';renderSheets();});
  ok('33 F373 "(Form TD-1)" and "(Form CR-1)" typed on Setup are left off the family\'s copy',!/\(Form (TD|CR)-1\)/.test(await txt(p,'#sheetOut'))&&/When a behavior happens: Stay calm; follow the plan\./.test(await txt(p,'#sheetOut')));
  ok('34 I190 every sheet says keeping it is the family\'s choice, and the sleep log rows read night to morning',sh.choice===sh.hs&&/Keeping this sheet is your choice\. You can stop at any time; it will not change your child’s services\./.test(sh.all)&&sh.night[0]==='Sun night → Mon',sh.night);
  /* I189: the marks and the pages; the pages are what the home sheets print */
  const cost=await txt(p,'#hdCostS');
  await p.evaluate(()=>{window.print=()=>{window.__printed=(document.getElementById('hdSheetPage')||{}).textContent||'';};document.querySelector('#sheetPrintBtn').click();});await sleep(120);
  const pst=await p.evaluate(()=>({style:window.__printed,cls:document.body.classList.contains('hd-sheets-only')}));
  await p.emulateMedia({media:'print'});await p.pdf({path:path.join(OUT,'sheets.pdf'),printBackground:true,preferCSSPageSize:true});await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  const pt=pdfText(path.join(OUT,'sheets.pdf'));const pages=+pt.split('\n')[0];
  ok('35 F373 Print the home sheets: the page header and footer are blanked, so the family\'s copy has no "Confidential student record ... behavior file", no student ID and no page numbers',/@bottom-left\{content:none\}/.test(pst.style)&&/@top-left\{content:none\}/.test(pst.style)&&pst.cls&&!/Confidential student record|Newsome Behavioral Health|ID SIM-000|Page 1 of/.test(pt)&&/Home Tally Sheet/.test(pt),pst.style);
  ok('36 I189 the marks a week (231: 105 on the tally sheet, 126 on the checklist), the warning above 70, and the pages, which match the printed copy ('+pages+')',/Each week the sheets ask the family for 231 marks: 105 on the tally sheet \(3 behaviors × 5 routines × 7 days\), 126 on the checklist \(18 steps under the routines × 7 days\)/.test(cost)&&/more than 70 marks a week \(a working convention/.test(cost)&&cost.indexOf('They print on about '+pages+' pages')>0&&/^Each week/.test(await txt(p,'#hdCost')),cost);
  await p.close();

  /* ================= F374 / F377 ================= */
  p=await open();await sim(p);await view(p,'entry');
  const ph=await p.evaluate(()=>({sel:[...document.querySelectorAll('[data-w="cond"] option')].map(o=>o.textContent),lines:document.querySelectorAll('#entPlot .ph-line').length,labs:[...document.querySelectorAll('#entPlot .ph-lab')].map(t=>t.textContent),phase:[...new Set(window.__nbhFactsOut().home.data.map(x=>x.phase))]}));
  ok('37 F374 a condition for each week (baseline, plan, plan changed); a solid labeled line where it changes (across all five panels); the phase goes to the case with each day',JSON.stringify(ph.sel)==='["Not recorded","Baseline","Plan","Plan changed"]'&&ph.lines===5&&ph.labs.join('|')==='Plan|Plan changed: the timer and the choice of order at homework'&&ph.phase.join()==='Plan,Plan changed',ph);
  await view(p,'setup');await p.check('[data-c="base"]');await sleep(150);
  await p.evaluate(()=>{S.meta.todo='';S.bh.forEach(b=>{b.todo='';});renderAll();});
  const bl=await p.evaluate(()=>({lines:[...document.querySelectorAll('#sheetOut .hs-line')].map(x=>x.textContent),setup:document.querySelector('#setupVerdict').textContent,after:[...document.querySelectorAll('#sheetOut [data-sheet="abc"] .abc:not(.ex) .abc-cols > div:last-child .it')].map(x=>x.textContent)}));
  ok('38 F374 baseline sheets: "Respond the way you usually do; keep everyone safe" in place of the plan lines, and no plan line asked for',bl.lines.length===4&&bl.lines.every(x=>/^When a behavior happens: Respond the way you usually do; keep everyone safe\./.test(x))&&!/has no line from the plan/.test(bl.setup)&&/Baseline sheets with the routine checklist/.test(bl.setup),bl);
  await view(p,'entry');await p.click('#addWk');await sleep(120);
  ok('39 F374 a week added on baseline sheets is a Baseline week, and the ABC sheet has no plan step box',(await p.inputValue('[data-w="cond"]'))==='Baseline'&&!bl.after.some(x=>/plan step/.test(x)));
  await p.uncheck('[data-c="base"]').catch(()=>{});await p.evaluate(()=>{S.chk.base=false;renderAll();});await view(p,'setup');
  const rules=await p.evaluate(()=>[0,1,2].map(i=>[...document.querySelectorAll('#bTbl tbody tr')[i].querySelectorAll('td.rule input')].map(x=>x.dataset.f).join('+')));
  ok('40 F377 a rule for marking each behavior, by measure: one time is (count), starts when and ends when (minutes), 0 means and 3 means (rating)',rules.join('|')==='one|st+en|r0+r3',rules);
  await view(p,'sheets');
  const tb=await p.evaluate(()=>({box:document.querySelector('#sheetOut [data-sheet="tally"] .hs-box').textContent.replace(/\s+/g,' '),na:[...document.querySelectorAll('#sheetOut [data-sheet="tally"] td.tot.na')].map(x=>x.textContent),
    after:[...document.querySelectorAll('#sheetOut [data-sheet="abc"] .abc:not(.ex) .abc-cols > div:last-child .it')].map(x=>x.textContent)}));
  ok('41 F377 the rules print in the instructions (one time is; it starts when ... and ends when; 0 means ... 3 means)',/One time is: a new hit after 3 seconds with no hitting/.test(tb.box)&&/It starts when he starts to cry or scream \(not when he drops to the floor\), and ends when he has been quiet for one minute\./.test(tb.box)&&/0 means no whining, arguing or refusing; 1 and 2 are in between; 3 means fussing for most of the routine\./.test(tb.box),tb.box);
  ok('42 F377 no total for a rating, and the ABC "after" list keeps a break away apart from losing something',tb.na.join()==='no total'&&tb.after.includes('Was sent to their room or had a break away')&&tb.after.includes('Lost a privilege or item')&&tb.after.includes('The task was put off or done for them')&&!tb.after.some(x=>/or lost something/.test(x)),tb);
  await view(p,'setup');await p.selectOption('[data-r="bh"][data-i="0"][data-f="ms"]','rate');await sleep(120);await p.fill('[data-r="bh"][data-i="1"][data-f="st"]','');await p.dispatchEvent('[data-r="bh"][data-i="1"][data-f="st"]','change');await sleep(120);
  const sv=await txt(p,'#setupVerdict');
  ok('43 F377 the setup check warns when a behavior that can be counted is rated, and asks for what 0 and 3 mean and when a timed behavior starts',/Hitting is rated 0 to 3, the least precise measure/.test(sv)&&/Hitting: say what 0 and what 3 mean/.test(sv)&&/Tantrum \(crying or screaming more than a minute\): say when it starts and when it ends/.test(sv),sv);

  /* ================= I190 / I188 ================= */
  ok('44 I190 the family\'s agreement is recorded on Setup; with it empty the setup check asks for it',/agreed to keep them for three weeks/.test(await p.inputValue('[data-m="agreed"]'))&&!/Record when and how the family agreed/.test(sv)&&(await p.evaluate(()=>{S.meta.agreed='';renderSetup();return /Record when and how the family agreed to keep the sheets \(BACB Ethics Code 2\.09 and 2\.11\)/.test(document.querySelector('#setupVerdict').textContent);})));
  await p.close();
  p=await open();await sim(p);await view(p,'entry');await p.selectOption('#wkSel','1');await sleep(150);
  await p.click('#fbWrite');await sleep(150);const fb=await p.inputValue('[data-w="fb"]');
  ok('45 I188 Write the note from this week: fixed sentences from the numbers, with the week before',/^Hello,/.test(fb)&&/- Hitting happened on 6 of the 7 days you marked, 9 times in all; the week before, 17 times\./.test(fb)&&/- Tantrum happened on 6 of the 7 days you marked, 49 minutes in all; the week before, 117 minutes\./.test(fb)&&/- Fussing: the average rating was 0\.7 \(0 to 3\) on the 7 days you marked; the week before, 1\.0\./.test(fb)&&/Jordan Ellis, M\.A\., BCBA \(simulated\)$/.test(fb),fb);
  await p.click('#fbCopy');await sleep(150);
  ok('46 I188 the note is kept with the week, can be copied, and its box is left out of the rewrite service (the family\'s words stay here)',(await p.evaluate(()=>S.wk[1].fb))===fb&&/Copied|Select the note/.test(await txt(p,'#fbMsg'))&&await p.evaluate(()=>!!document.querySelector('[data-w="fb"]').closest('[data-nbh-nowording]')));

  /* ================= round trip, staff directory ================= */
  await p.evaluate(()=>{const w=week();w.abc.push(mkAbc({day:'2',time:'5 pm',rt:'1',a:['Change in the routine'],b:['1'],c:['Not sure'],amt:'3 min',txt:'x'}));w.ck['k0_r0_d0']='—';S.ag[0].how='Video';renderAll();});
  await p.evaluate(()=>{window.__dl=[];document.querySelector('#saveBtn').click();});await sleep(300);
  const saved=await p.evaluate(()=>window.__dl[0]);const before=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(async t=>{S=blank();renderAll();const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(400);
  ok('47 Save data and Open data read everything back exactly: conditions, designs, checklist, ABC notes, sleep log, the note back, how staff watched',(await p.evaluate(()=>JSON.stringify(S)))===before&&(()=>{const j=JSON.parse(saved).S;return JSON.stringify(j.wk[0].dz)==='{"days":"","rt":[0,1,2,3,4],"bh":[0,1,2]}'&&j.wk[1].cond==='Plan changed'&&j.wk[1].abc.length===1&&j.wk[1].fb.length>50&&Object.keys(j.wk[0].sl).length===7&&j.ag[0].how==='Video';})());
  ok('48 families are not staff: no box on HD-1 is a staff-directory box',await p.evaluate(()=>{const P=nbhUI.people;return !!P&&[...document.querySelectorAll('input')].every(el=>!P.bindOf(el));}));
  await p.close();

  /* ================= F375 / I190: the case ================= */
  p=await open();
  const T=[{label:'Hitting',def:'Any forceful contact of the hand with another person.',ex:'open hand\nclosed fist',nex:'high five',dim:'Count / rate',urg:'3',type:'Single topography',isRep:false,src:'TB-1'},
    {label:'Tantrum',def:'Crying or screaming for more than one minute.',ex:'',nex:'',dim:'Duration',urg:'2',isRep:false,src:'TB-1'},
    {label:'Break request',def:'Says or signs break.',ex:'',nex:'',dim:'Count / rate',urg:'',type:'Replacement / alternative behavior',isRep:true,src:'TB-1'},
    {label:'Elopement',def:'Leaves the assigned area without permission.',ex:'leaves the room',nex:'',dim:'Count / rate',urg:'4',isRep:false,src:'TB-1'},
    {label:'Off-task',def:'Eyes off the task for 5 seconds.',ex:'',nex:'',dim:'% of opportunities',urg:'2',isRep:false,src:'TB-1'},
    {label:'Task refusal',def:'Says no to a task.',ex:'',nex:'',dim:'Partial-interval',urg:'1',isRep:false,src:'TB-1'}];
  const r1=await p.evaluate(T=>{const r=nbhCase.apply({behaviors:T});return {r,bh:S.bh.map(b=>b.name+'|'+b.ms+'|'+b.ex),sk:S.sk.map(s=>s.label+'|'+s.who),ph:document.querySelectorAll('#bTbl tbody tr')[2].querySelectorAll('input')[1].placeholder,setup:document.querySelector('#setupVerdict').textContent};},T);
  ok('49 F375 targets in TB-1\'s urgency order, four at most, each with the matching measure (count: tally, duration: minutes, % of opportunities: yes or no)',JSON.stringify(r1.bh)==='["Elopement|tally|leaves the room","Hitting|tally|open hand; closed fist","Tantrum|dur|","Off-task|yn|"]',r1.bh);
  ok('50 F375 the one left out is named; the replacement goes on the checklist as a Child step, not on the tally sheet',/Left off the home sheets .*Task refusal \(urgency 1\)/.test(r1.r.note)&&/Break request went on the checklist as Child steps/.test(r1.r.note)&&JSON.stringify(r1.sk)==='["Break request|Child"]',r1.r);
  ok('51 F375 TB-1\'s definition is not copied into the plain-words example: it shows beside the box, and Setup asks for an example',/^TB-1’s definition, to put in the family’s words: Crying or screaming/.test(r1.ph)&&/Tantrum needs an example and a non-example.*came from Form TB-1 with a definition and no example/.test(r1.setup),r1);
  await p.evaluate(()=>{S.wk[0].cells['b1_r0_d0']='3';freeze(S.wk[0]);});
  const T2=JSON.parse(JSON.stringify(T));T2[0].label='Physical aggression';T2[3].ex='leaves the room\nruns into the hall';
  await p.evaluate(T=>nbhCase.apply({behaviors:T}),T2);await sleep(80);
  const off=await txt(p,'#hdTbNote');
  ok('52 F375 a rename and a new example on TB-1 are offered on the next reading of the case',/Form TB-1 renamed Hitting to Physical aggression\./.test(off)&&/new definition or new examples for Elopement/.test(off)&&!!(await p.$('#hdTbUpd')),off);
  await p.click('#hdTbUpd');await sleep(150);
  const up=await p.evaluate(()=>({bh:S.bh.map(b=>b.name+'|'+b.ex),cell:S.wk[0].cells['b1_r0_d0'],note:document.querySelector('#hdTbNote').textContent}));
  ok('53 F375 Update the sheets: the new name and examples, the marks typed in kept, the offer gone',up.bh[0]==='Elopement|leaves the room; runs into the hall'&&up.bh[1]==='Physical aggression|open hand; closed fist'&&up.cell==='3'&&!up.note,up);
  const pk=await p.evaluate(T=>{const r=window.__nbhFactsPick({behaviors:[T[5],{label:'Spitting',dim:'Count / rate'},{label:'Kicking',dim:'Count / rate'},{label:'Biting',dim:'Count / rate'},T[2]],goals:{red:[],acq:[{beh:'Requests help',cond:'a hard task'}]}});renderSetup();return {r,bh:S.bh.map(b=>b.name),sk:S.sk.map(s=>s.label+'|'+s.who),setup:document.querySelector('#setupVerdict').textContent};},T);
  ok('54 F375 the picker stops at six behaviors and says which were not added; a GB-1 skill goes on the checklist as a Child step',pk.bh.length===6&&/Not added, the table is full \(six behaviors, twelve steps\): Kicking, Biting\./.test(pk.r.note)&&pk.sk.includes('Requests help (given a hard task)|Child')&&pk.sk.filter(s=>/^Break request/.test(s)).length===1,pk);
  ok('55 F375 a TB-1 measure with no home match (partial interval) comes as a tally, flagged on Setup',pk.bh.includes('Task refusal')&&/Form TB-1 measures Task refusal by partial-interval; the home sheet asks for a tally/.test(pk.setup),pk.setup);
  const td=await p.evaluate(()=>{S.meta.todo='';S.bh.forEach(b=>{b.todo='';});const r=nbhCase.apply({plan:{src:'TD-1',beh:'Hitting',respond:{target:'Block and say hands down.',after:'Return to the step with no more talk.'}}});return {r,todo:S.meta.todo,el:document.querySelector('[data-m="todo"]').value,setup:document.querySelector('#setupVerdict').textContent};});
  ok('56 F375 TD-1\'s response to the behavior fills the shared line while it is empty, marked as written for staff',td.todo==='Block and say hands down. Return to the step with no more talk.'&&td.el===td.todo&&/came from Form TD-1, written for school staff/.test(td.setup),td);
  const ic=await p.evaluate(()=>{const o=[];nbhCase.apply({consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-09-01',date:'2026-09-01',bip:''}});o.push(S.meta.consent);
    nbhCase.apply({consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-09-01',date:'2026-09-01',bip:'2026-09-20'}});o.push(S.meta.consent);
    nbhCase.apply({consent:{src:'IC-1',state:'Revoked',on:false,obtained:'',date:'',bip:''}});o.push(S.meta.consent,document.querySelector('#hdConsentNote').textContent);return o;});
  ok('57 I190 the consent on file comes from Form IC-1 (the assessment, then the BIP implementation); a revoked consent clears it and says so',ic[0]==='Consent for the assessment 9/1/2026 (Form IC-1)'&&ic[1]==='BIP implementation consent 9/20/2026 (Form IC-1)'&&ic[2]===''&&/records the consent as Revoked/.test(ic[3]),ic);
  /* the Entry page at phone width */
  await p.setViewportSize({width:390,height:800});await sim(p);await view(p,'entry');await sleep(200);
  const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  ok('58 the Entry page with the new panels does not scroll sideways at phone width',sw[0]===sw[1],sw);
  await p.close();
  ok('59 no script errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?`RESULT: ${fails} FAILED of ${n}`:`RESULT: all passed (${n})`);process.exit(fails?1:0);
})();
