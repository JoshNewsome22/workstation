/* Form CR-1, review Wave 3 part 1: the semester's days bound "this semester" (F339); the count, the second restraint's date and the
   debriefed incident's date come from the log (F345); the debriefing's report answer is checked against the clock (F340); Copy for
   the BIP copies the plan, the incident records only when ticked (F344); the plan's first date apart from its revision (F346).
   Simulated data only. usage: node qa/cr1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('CR-1_'));
  /* a blank record: the count is typed */
  const b0=await p.evaluate(()=>{const e=document.querySelector('[data-m="nRest"]');return {ro:e.readOnly,card:document.getElementById('logMetrics').textContent};});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1200);
  const val=k=>p.evaluate(k=>{const e=document.querySelector('[data-m="'+k+'"]');return {v:e.value,ro:e.readOnly};},k);
  const n0=await val('nRest'),d0=await val('d2'),db=await val('dbDate');
  const sec=await p.evaluate(()=>{const s=crcStates().filter(x=>x.dated&&!x.secl);return {d2:crcD(s[1].bDay),db:s[1].began?crcDT(s[1].began):''};});
  ok('1 F345 with restraints on the log, the count and the second restraint\'s date come from it and are not typed; a blank record types them',
    b0.ro===false&&n0.v==='3'&&n0.ro&&d0.v===sec.d2&&d0.ro,{b0,n0,d0,sec});
  ok('2 F345 the debriefed incident\'s date and time come from its restraint on the log',db.v===sec.db&&db.ro,{db,sec});
  const m=()=>p.evaluate(()=>({card:document.getElementById('logMetrics').innerText.replace(/\s+/g,' '),n:document.querySelector('[data-m="nRest"]').value,early:document.querySelectorAll('#logTbl tr.cr-earlier').length,
    out:window.__nbhFactsOut().crisis.restraints}));
  const m1=await m();
  const setSem=(a,b)=>p.evaluate(([a,b])=>{[['semFrom',a],['semTo',b]].forEach(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});},[a,b]);
  const first=await p.evaluate(()=>crcDateStr(crcStates().filter(x=>x.dated)[0].bDay));
  const after=await p.evaluate(f=>{const d=new Date(f+'T12:00:00');d.setDate(d.getDate()+1);return crcDateStr(d);},first);
  await setSem(after,'2027-06-30');await sleep(300);const m2=await m();
  ok('3 F339 the semester\'s days bound the count: a restraint before them is kept, greyed, and not counted, here or in the case',
    /Restraints logged\s*3\s*this semester/.test(m1.card)&&m1.out.semester===3&&/Restraints logged\s*2\s*this semester; 1 in an earlier semester, kept for the year/.test(m2.card)&&m2.n==='2'&&m2.early===1&&m2.out.semester===2,{m1,m2});
  await setSem('','');await sleep(300);const m3=await m();
  ok('4 F339 with no semester days entered every dated restraint counts, and the card says so',/Restraints logged\s*3\s*this semester \(no semester days entered on Setup: every dated restraint counts\)/.test(m3.card)&&m3.early===0,m3);
  /* ---- F340 ---- */
  const rc=await p.evaluate(()=>{const e=document.querySelector('[data-m="dbReport"]');e.value='Not yet, and still within the time allowed';e.dispatchEvent(new Event('change',{bubbles:true}));const t=document.getElementById('dbRepCheck').textContent;
    e.value='Yes, within 24 hours';e.dispatchEvent(new Event('change',{bubbles:true}));return {t,t2:document.getElementById('dbRepCheck').textContent};});
  ok('5 F340 the debriefing\'s report answer is checked against its restraint\'s clock',/^Check the incident report\. The clock for restraint 2 records the report as completed; this answer says it is not done yet\./.test(rc.t)&&rc.t2==='',rc);
  /* ---- F344 ---- */
  const bt=await p.evaluate(()=>{const a=bipText();document.getElementById('bipAll').checked=true;const b=bipText();document.getElementById('bipAll').checked=false;return {a,b};});
  ok('6 F344 Copy for the BIP copies the plan and the reduction goal, not the debriefing, the notices or the log',
    /BREATHING: NO HOLD MAY RESTRICT IT/.test(bt.a)&&/REDUCTION GOAL/.test(bt.a)&&!/POST-INCIDENT DEBRIEFING|PARENT NOTIFICATION AND REPORTING|WHAT CHANGES AS A RESULT|- Restraint 1/.test(bt.a),bt.a.slice(0,600));
  ok('7 F344 ticked, the debriefing and the log come with it',/POST-INCIDENT DEBRIEFING/.test(bt.b)&&/RESTRAINT LOG AND REDUCTION GOAL/.test(bt.b)&&/- Restraint 1/.test(bt.b));
  /* ---- F346 ---- */
  const pl=await p.evaluate(()=>({st:crcPlan().plan.st,bip:/Plan first developed: /.test(bipText())}));
  ok('8 F346 the date the plan was first developed stands apart from its current revision',/^Plan first developed [\d/]+; current revision dated [\d/]+ on the Setup sheet$/.test(pl.st)&&pl.bip,pl);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
