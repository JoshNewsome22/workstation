/* Form SR-1, review Wave 3 part 3: Form DD-1's baseline offered to the DRO, DRL and NCR designers, with the source and dates on
   the card (I137); Export CSV writes the designed schedule, and the catalogue exports from its own button (I140).
   Simulated data only. usage: node qa/sr1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(800);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=m=>{window.__toast=m;};}
      /* every download is kept: its name and its text */
      const o=URL.createObjectURL;window.__dl=[];URL.createObjectURL=b=>{const r={text:null};window.__dl.push(r);b.text().then(t=>{r.text=t;});return o(b);};
      const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&window.__dl.length)window.__dl[window.__dl.length-1].name=this.download;};});
    return p;};
  const DATA=(measure,mean)=>({data:{src:'DD-1',from:'2026-09-15',to:'2026-10-09',days:18,
    conds:[{name:'Baseline',from:'2026-09-15',to:'2026-09-26',days:8},{name:'DRO',from:'2026-09-29',to:'2026-10-09',days:10}],
    behaviors:[{name:'Calling out',kind:'target',measure,unit:measure==='rate'?'per hour':'occurrences',base:{days:8,mean,total:mean*8},baseName:'Baseline',cur:{days:10,mean:1,total:10},curName:'DRO'}]}});
  const p=await open(file('SR-1_'));
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  await p.click('#viewSeg button[data-view="design"]');await sleep(150);
  const box=()=>p.evaluate(()=>{const e=document.getElementById('srDdBase');return {hid:e.hidden,txt:e.textContent};});
  const b0=await box();
  await p.evaluate(d=>window.__nbhFactsIn(d),DATA('rate',3));const b1=await box();
  ok('1 I137 with DD-1\'s record in the case, the DRO designer offers its baseline phase: the behavior, the phase, the dates, the school days, the rate, and when it fits',
    b0.hid===true&&b1.hid===false&&/^Form DD-1’s baseline for Calling out \(Baseline, 9\/15\/2026–9\/26\/2026, 8 school days\): 3 per hour\. These are whole school days: use them only when this schedule runs across the day; a schedule run in sessions needs a session baseline\./.test(b1.txt),{b0,b1});
  await p.click('#srDdUse');await sleep(200);
  const u=await p.evaluate(()=>({n:S.meta.dro_n,min:S.meta.dro_min,src:S.meta.dro_bsrc,p0:design().params[0].map(x=>String(x).replace(/<[^>]+>/g,'')),card:document.getElementById('cardOut').innerText,inN:document.querySelector('[data-m="dro_n"]').value,box:document.getElementById('srDdBase').textContent}));
  ok('2 I137 used, it fills the count and the minutes, and the card names the source and the dates',
    u.n==='3'&&u.min==='60'&&u.inN==='3'&&u.src==='Form DD-1, Baseline, 9/15/2026–9/26/2026, 8 school days, 3 per hour'&&u.p0[0]==='Baseline from'&&/Baseline from\s*Form DD-1, Baseline, 9\/15\/2026–9\/26\/2026, 8 school days, 3 per hour/.test(u.card)&&/In use: Form DD-1/.test(u.box),u);
  await p.evaluate(()=>{const e=document.querySelector('[data-m="dro_n"]');e.value='24';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  const h=await p.evaluate(()=>({src:S.meta.dro_bsrc,n:S.meta.dro_n,card:document.getElementById('cardOut').innerText}));
  ok('3 I137 typing the count by hand drops the source from the card',!h.src&&h.n==='24'&&!/Baseline from/.test(h.card),h);
  await p.evaluate(d=>{window.__nbhFactsIn(d);S.meta.ds_sel='drl';renderAll();},DATA('count',6));const b2=await box();
  await p.evaluate(()=>{window.__toast='';document.getElementById('srDdUse').click();});await sleep(150);
  const c0=await p.evaluate(()=>({n:S.meta.drl_n,src:S.meta.drl_bsrc||'',toast:window.__toast}));
  await p.evaluate(()=>{document.getElementById('srDdMin').value='360';document.getElementById('srDdUse').click();});await sleep(200);
  const c1=await p.evaluate(()=>({n:S.meta.drl_n,min:S.meta.drl_min,src:S.meta.drl_bsrc}));
  ok('4 I137 a count per day needs the minutes observed per day before it is used; with them, the DRL designer takes it',
    b2.hid===false&&/: 6 per day\./.test(b2.txt)&&c0.src===''&&c0.n!=='6'&&/minutes observed per school day/.test(c0.toast)&&c1.n==='6'&&c1.min==='360'&&c1.src==='Form DD-1, Baseline, 9/15/2026–9/26/2026, 8 school days, 6 per day in 360 minutes',{b2,c0,c1});
  await p.evaluate(()=>{S.meta.ds_sel='token';renderAll();});const b3=await box();
  ok('5 I137 a design that does not start from a baseline count is offered nothing',b3.hid===true,b3);
  /* ---- I140 ---- */
  await p.evaluate(()=>{S.meta.ds_sel='dro';renderAll();window.__dl=[];document.getElementById('csvBtn').click();});await sleep(400);
  const d1=await p.evaluate(()=>window.__dl[0]);
  await p.evaluate(()=>{window.__dl=[];document.getElementById('catCsvBtn').click();});await sleep(400);
  const d2=await p.evaluate(()=>window.__dl[0]);
  const rows=t=>String(t||'').replace(/^﻿/,'').split('\r\n');
  const r1=rows(d1&&d1.text),r2=rows(d2&&d2.text);
  ok('6 I140 Export CSV writes the schedule as designed: the student\'s entries, the design, its settings, its steps and what to keep',
    d1&&d1.name==='SR-1_schedule-design.csv'&&r1[0]==='"Form SR-1: the schedule as designed",""'&&r1.some(x=>/^"Notation","DRO /.test(x))&&r1.some(x=>/^"Rule","Start the timer/.test(x))
    &&r1.some(x=>/^"Setting: Baseline rate",/.test(x))&&r1.some(x=>/^"Step","Interval"/.test(x))&&r1.some(x=>/^"Data to keep",/.test(x))&&!r1.some(x=>/abbreviation/.test(x)),{name:d1&&d1.name,head:r1.slice(0,12)});
  ok('7 I140 the catalogue exports from its own button on the Catalogue page, with the notes',
    d2&&d2.name==='SR-1_schedules-of-reinforcement.csv'&&/^"family","name","abbreviation"/.test(r2[0])&&r2.length>30,{name:d2&&d2.name,n:r2.length,h:r2[0]});
  const q=await open(file('SR-1_'));
  await q.evaluate(()=>{window.__dl=[];document.getElementById('csvBtn').click();});await sleep(400);
  const d3=await q.evaluate(()=>window.__dl[0]);
  ok('8 I140 with no design chosen, the CSV says so and where the catalogue exports from',d3&&rows(d3.text)[1]==='"No design is chosen yet","Choose one on the Design page. The catalogue exports from the Catalogue page."',d3);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
