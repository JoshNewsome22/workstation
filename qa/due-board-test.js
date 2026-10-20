/* v23.71 the start screen's What's due, by when (the BCBA's iPad: one deadline four times, "in 5 days" for a date two days
   past, "and 91 more"). Simulated students kept on this device, their summaries saved on different days; the clock at
   Tuesday 10/20/2026:
   1. one row for a student and a date: the reevaluation in RR-1 and DM-1 and the review in DM-1 on 10/18 are one row,
      each form named, a button for each;
   2. the days counted from today: 10/18, saved on 10/13 as "in 5 days", is 2 days overdue; 10/22, saved on 10/19 as
      "in 3 days", is in 2 days;
   3. the groups in order: Needs you now, Overdue, This week, Coming up, To look at, each with its count, and the counts
      at the top;
   4. a date over a year past is set aside under its own line, not in Overdue;
   5. what has no date (no data lately) keeps its words and its button;
   6. a button opens that student's case at that form;
   7. many rows: the first of each group, then Show all opens the rest in place, and Show fewer closes them;
   8. on an iPad a row is one line across; on a phone it stacks, nothing wider than the screen;
   9. a student's card (iPad, laptop, Caseload) counts its days from today too: "due 10/18 (in 5 days)", saved on 10/13,
      is "(2 days overdue)" on Mateo's card;
  10. no page errors. Simulated data only.  usage: node qa/due-board-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const KEEP=async(p,extra)=>p.evaluate(async extra=>{
  const rec=(name,sid,saved,items)=>({key:clScope()+'|'+sid+'|'+name.toLowerCase(),scope:clScope(),client:name,sid,site:'Test Elementary (simulated)',grade:'4',bcba:'Jordan Ellis (simulated)',
    saved,sum:{items,lastData:'',forms:3},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:{client:name,sid},forms:{}})});
  const R=[rec('Mateo Rivera (simulated)','4471823','2026-10-13T15:00:00',[
      {k:'Timeline',t:'The reevaluation is due 10/18 (in 5 days)',open:'RR-1'},{k:'Due',t:'DM-1 Reevaluation due 10/18 (in 5 days)',open:'DM-1'},
      {k:'Due',t:'DM-1 Next review 10/18 (in 5 days)',open:'DM-1'},{k:'Due',t:'RR-1 Reevaluation due 10/18 (in 5 days)',open:'RR-1'},
      {k:'Data',t:'No data on Form DD-1 since 9/30 (9 school days)',open:'DD-1'}]),
    rec('Leo Whitfield (simulated)','5550199','2026-10-19T16:00:00',[
      {k:'Due',t:'DM-1 Rights at 18: notice of transfer (18th birthday) 9/13 (402 days overdue)',open:'DM-1'},
      {k:'Timeline',t:'The plan review (Form PR-1) is due 10/22 (in 3 days)',open:'PR-1'}]),
    rec('Nina Park (simulated)','5550123','2026-10-20T08:00:00',[
      {k:'Safety',t:'A restraint on 10/19: the parent notice is due today (Form CR-1)',open:'CR-1'},
      {k:'Due',t:'GB-1 Progress report due 11/2 (in 13 days)',open:'GB-1'}])];
  if(extra)for(let i=1;i<=14;i++)R[2].sum.items.push({k:'Due',t:'TK-1 Token board step '+i+' due 10/'+(20+i%9)+' (in '+(i%9)+' days)',open:'TK-1'});
  for(const r of R)await clTx('readwrite',st=>st.put(r));await paintBlank();await new Promise(r=>setTimeout(r,300));},extra);
const read=p=>p.evaluate(()=>{const b=document.querySelector('#blankCl .due-board');if(!b)return null;
  return {head:b.querySelector('.due-head').innerText.replace(/\s+/g,' '),groups:[...b.querySelectorAll('.due-grp')].map(g=>g.textContent.replace(/\s+/g,' ').trim()),
    rows:[...b.querySelectorAll(':scope > .due-rows > .due-row')].map(r=>({cls:r.className,date:[...r.querySelector('.due-date').children].map(x=>x.textContent).join(' '),who:r.querySelector('.due-who').innerText,what:r.querySelector('.due-what').innerText.replace(/\s+/g,' '),
      btn:[...r.querySelectorAll('button')].map(x=>x.textContent)})),
    long:(b.querySelector('.due-long summary')||{}).textContent||'',longRows:[...b.querySelectorAll('.due-long .due-row')].map(r=>r.textContent.replace(/\s+/g,' ')),
    more:(b.querySelector('#dueAll')||{}).textContent||''};});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:new Date(2026,9,20,9,0,0)});
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;try{wsUI.confirm=async()=>true;}catch(e){}try{sessionStorage.removeItem('nbh.due.all');}catch(e){}});
  await KEEP(p,false);const a=await read(p);
  const m=a&&a.rows.find(r=>/Mateo/.test(r.who)&&/10\/18/.test(r.date));
  ok('1 one row for the student and the date: the reevaluation (RR-1, DM-1) and the review (DM-1), a button a form',!!m&&a.rows.filter(r=>/Mateo/.test(r.who)&&/10\/18/.test(r.date)).length===1&&/^Reevaluation RR-1, DM-1 · Next review DM-1$/.test(m.what)&&m.btn.join()==='Open RR-1,Open DM-1',{m,rows:a&&a.rows});
  const l=a&&a.rows.find(r=>/Leo/.test(r.who));
  ok('2 the days from today: 10/18 is 2 days overdue (saved "in 5 days"), 10/22 is in 2 days (saved "in 3 days")',!!m&&m.date==='Sun 10/18 2 days overdue'&&!!l&&l.date==='Thu 10/22 in 2 days'&&l.what==='Plan review PR-1',{m:m&&m.date,l});
  ok('3 the groups in order, each counted, and the counts at the top',!!a&&a.groups.join('|')==='Needs you now 1|Overdue 1|This week 1|Coming up 1|To look at 1'&&/What’s due 1 need you now · 1 overdue · 1 this week · 1 coming up · 1 to look at/.test(a.head),a&&{g:a.groups,h:a.head});
  ok('4 a date over a year past is set aside under its own line, not in Overdue',!!a&&/^1 date over a year past, set aside/.test(a.long)&&a.longRows.length===1&&/Rights at 18/.test(a.longRows[0])&&!a.rows.some(r=>/Rights at 18/.test(r.what)),a&&{long:a.long,lr:a.longRows});
  const d=a&&a.rows.find(r=>/^Data/.test(r.date));
  ok('5 what has no date keeps its words and its button; what needs you now comes first, red',!!d&&d.what==='No data on Form DD-1 since 9/30 (9 school days)'&&d.btn.join()==='Open DD-1'&&/now/.test(a.rows[0].cls)&&/Safety/.test(a.rows[0].date),{d,first:a&&a.rows[0]});
  const cd=await p.evaluate(()=>{const c=[...document.querySelectorAll('#blankCl .cl-card')].find(x=>/Mateo/.test(x.querySelector('.cl-nm').textContent));return c?c.querySelector('.cl-next').textContent.replace(/\s+/g,' '):'';});
  ok('9 a student\'s card counts its days from today too: Mateo\'s 10/18 is 2 days overdue, not "in 5 days"',/10\/18 \(2 days overdue\)/.test(cd)&&!/in 5 days/.test(cd),cd);
  const g=await p.evaluate(async()=>{const was=caseloadGo;let got=null;caseloadGo=async(k,f)=>{got=[k,f];};const b=[...document.querySelectorAll('#blankCl .due-row button')].find(x=>x.textContent==='Open DM-1');b.click();await new Promise(r=>setTimeout(r,100));caseloadGo=was;return got;});
  ok('6 a button opens that student\'s case at that form',!!g&&/\|4471823\|mateo rivera \(simulated\)$/.test(g[0])&&g[1]==='DM-1',g);
  await KEEP(p,true);const b=await read(p);const wk=b&&b.rows.filter(r=>/wk/.test(r.cls)).length;
  await p.click('#dueAll');await sleep(400);const c=await read(p);const wk2=c&&c.rows.filter(r=>/wk/.test(r.cls)).length;
  await p.click('#dueAll');await sleep(400);const e=await read(p);
  ok('7 many rows: the first of each group, Show all opens the rest in place, Show fewer closes them',!!b&&wk===8&&/^Show all \d+$/.test(b.more)&&wk2>8&&c.more==='Show fewer'&&e.rows.length===b.rows.length,{wk,wk2,more:b&&b.more,more2:c&&c.more});
  const lay=await p.evaluate(()=>{const r=document.querySelector('#blankCl .due-row.od');const k=[...r.children].map(x=>Math.round(x.getBoundingClientRect().top));return {tops:k,flat:Math.max(...k)-Math.min(...k)<30};});
  ok('8a on an iPad a row is one line across: the date, the student, what is due, the buttons',lay.flat,lay);
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPAD.replace('iPad','iPhone')});const q=await ph.newPage();q.on('pageerror',x=>errs.push(x.message));
  await q.clock.install({time:new Date(2026,9,20,9,0,0)});await q.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);await KEEP(q,false);
  const pl=await q.evaluate(()=>{const r=document.querySelector('#blankCl .due-row.od');const w=document.documentElement.scrollWidth;const k=[...r.children].map(x=>Math.round(x.getBoundingClientRect().top));return {w,stack:Math.max(...k)-Math.min(...k)>30,wide:[...document.querySelectorAll('#blankCl .due-row')].some(x=>x.getBoundingClientRect().right>392)};});
  ok('8b on a phone a row stacks and nothing is wider than the screen',pl.stack&&!pl.wide&&pl.w<=392,pl);
  await ph.close();
  ok('10 no page errors',!errs.length,errs.slice(0,4));
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
