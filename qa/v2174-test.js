/* v21.74 the record beyond the sheet, the quick start that follows the plan, the steps from it, and the print check:
   1. Form DD-1: its day-by-day record goes to the case (the last 20 days with data, each behavior's days, mean and total);
      a blank week prints five dated, empty school days and leaves the record as it was; on paper the letterhead is one slim
      line and a row a quarter inch; the incident log adds one to the day's count (and takes it off again when deleted), writes
      a note for home, travels in the data file and prints only when asked; the week summary sets this week against last week
      with the point sheet from the case, and on paper shows only itself;
   2. Form SM-1: its Record's days go to the case with their dates as yyyy-mm-dd;
   3. Form QS-1: a field still holding the plan's words follows the plan when it changes; a field rewritten keeps its words and
      shows the plan's new ones to use or keep; the tiles come from Form DD-1's record; its rules and tiers go to the case;
   4. Form TI-1: an empty step list takes the quick start's non-negotiables; the button adds only the ones not yet there;
   5. the workstation: the case holds DD-1's record, SM-1's point sheet and QS-1's rules; DD-1's incident log offers QS-1's
      tiers; the whole photo travels in the packet file beside the packet and comes back with it; the print check opens from
      Help with its list. No page errors anywhere.
   usage: node qa/v2174-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,BASE,wire,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const stub=()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{nbhUI.confirm=async()=>true;}catch(e){}try{wsUI.confirm=async()=>true;}catch(e){}};
(async()=>{const br=await chromium.launch();const log=[];
  /* ---------- 1. Form DD-1 ---------- */
  let page=await br.newPage({viewport:{width:1400,height:1000}});wire(page,log);
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(stub);await page.evaluate(async()=>{await loadExample();});await sleep(1200);
  const o1=await page.evaluate(()=>{const o=window.__nbhFactsOut(),d=o&&o.data;return d&&{days:d.days,from:d.from,to:d.to,n:d.behaviors.length,b0:d.behaviors[0],src:d.src};});
  ok('1a DD-1 gives the case its record: 20 school days, a line per behavior with its days, mean and total',!!o1&&o1.days===20&&o1.n===6&&o1.b0.days===20&&o1.b0.mean===4.5&&o1.b0.total===90&&o1.src==='DD-1',o1);
  const bw=await page.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));
    const before=JSON.stringify(S.rows);document.getElementById('btnBlankWeek').click();
    const tr=[...document.querySelectorAll('#dataTable tbody tr')];
    const r={rows:tr.length,dates:tr.map(t=>t.querySelector('.pdate').textContent),locked:[...document.querySelectorAll('#dataTable tbody input')].every(i=>i.readOnly)&&[...document.querySelectorAll('#dataTable tbody select,#dataTable tbody button')].every(b=>b.disabled),
      empty:[...document.querySelectorAll('#dataTable tbody input[data-v]')].every(i=>i.value===''),bar:!document.getElementById('ddBlankNote').hidden,same:JSON.stringify(S.rows)===before,
      span:(document.querySelector('#sheetTop .st-r b')||{}).textContent||''};
    document.getElementById('ddBlankN').value='10';document.getElementById('ddBlankN').dispatchEvent(new Event('change',{bubbles:true}));r.ten=document.querySelectorAll('#dataTable tbody tr').length;
    return r;});
  ok('1b Blank week to print: five empty, dated school days (Monday to Friday), nothing to type into, the record unchanged; ten on asking',
    bw.rows===5&&bw.dates.every(d=>/^(MON|TUE|WED|THU|FRI|Mon|Tue|Wed|Thu|Fri)/.test(d))&&bw.locked&&bw.empty&&bw.bar&&bw.same&&/^Data \d/.test(bw.span)&&bw.ten===10,bw);
  await page.emulateMedia({media:'print'});
  const pr=await page.evaluate(()=>{applyColW(true);const lg=document.querySelector('.nbh-print-logo'),t=document.querySelector('.nbh-print-title'),m=document.querySelector('.nbh-print-meta');
    const tr=document.querySelector('#dataTable tbody tr');return {logo:Math.round(lg.getBoundingClientRect().height),title:getComputedStyle(t).fontSize,meta:getComputedStyle(m).display,row:tr.getBoundingClientRect().height,
      bar:getComputedStyle(document.getElementById('ddBlankNote')).display,inc:getComputedStyle(document.getElementById('ddInc')).display};});
  await page.emulateMedia({media:'screen'});
  ok('1c on paper the letterhead is one slim line (logo 0.3 in, title 11 pt beside the form line) and a row a quarter inch; the blank-sheet bar does not print',
    pr.logo<=30&&pr.title==='14.6667px'&&pr.meta==='flex'&&pr.row<=24.5&&pr.bar==='none'&&pr.inc==='none',pr);
  const back=await page.evaluate(()=>{document.getElementById('ddBlankBack').click();return {rows:document.querySelectorAll('#dataTable tbody tr').length,bar:document.getElementById('ddBlankNote').hidden};});
  ok('1d Back to the data shows the record again',back.rows===20&&back.bar,back);
  const inc=await page.evaluate(async()=>{const b=orderedBehaviors()[0],d=S.rows[S.rows.length-1].date,was=num(S.rows.find(x=>x.date===d).values[b.id]);
    document.getElementById('ddIncAdd').click();const g=document.getElementById('dlgInc'),set=(k,v)=>{const e=g.querySelector(k);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
    const tiers=[...g.querySelectorAll('#incTier option')].map(o=>o.textContent);
    set('#incDate',d);set('#incTime','10:20');set('#incBeh',b.id);set('#incTier','Tier 2');set('#incBefore','Math worksheet handed out');set('#incWhat','Pushed the worksheet off the desk and hit the aide on the arm');
    set('#incWords','I am not doing this');set('#incDid','Aide stepped back, offered the break card, one adult spoke');set('#incEnded','Back at the desk by 10:32');set('#incBy','Ms. Alvarez (simulated)');
    const countable=!g.querySelector('#incCount').disabled&&g.querySelector('#incCount').checked;g.querySelector('#incSave').click();
    const now=num(S.rows.find(x=>x.date===d).values[b.id]);const i=S.incidents[0];
    const row=document.querySelector('#ddInc tbody tr');const r={tiers,countable,was,now,counted:i.counted,row:row?row.innerText:''};
    document.querySelector('[data-inc-note]').click();r.note=document.getElementById('incNoteTx').value;document.getElementById('dlgIncNote').close();
    /* a day not on the sheet is added for it */
    document.getElementById('ddIncAdd').click();set('#incDate','2026-12-01');set('#incBeh',b.id);g.querySelector('#incSave').click();
    const nd=S.rows.find(x=>x.date==='2026-12-01');r.newDay=nd?nd.values[b.id]:null;
    /* the edit moves the count to the new behavior's day */
    const b2=orderedBehaviors()[1],w2=num(S.rows.find(x=>x.date===d).values[b2.id]);
    document.querySelector('[data-inc-edit="'+i.id+'"]').click();set('#incBeh',b2.id);g.querySelector('#incSave').click();
    r.edit=[num(S.rows.find(x=>x.date===d).values[b.id]),num(S.rows.find(x=>x.date===d).values[b2.id])-w2];
    await ddIncDel(i.id);r.del=num(S.rows.find(x=>x.date===d).values[b2.id])===w2;r.left=S.incidents.length;
    return r;});
  ok('1e an incident logged with its time, A-B-C and the words adds one to that day’s count; the tiers are offered (the plan’s, or Tier 1 to 3 and the crisis plan)',
    inc.countable&&inc.now===inc.was+1&&inc.counted&&/10:20 am/.test(inc.row)&&/I am not doing this/.test(inc.row)&&inc.tiers.includes('Tier 2')&&inc.tiers.some(t=>/Crisis/.test(t)),inc);
  ok('1f the note for home names the day, says what happened, before and after in plain words, and leaves the exact words and the tier off',
    /^Hello,/.test(inc.note)&&/Sample’s day on [A-Z][a-z]+day, [A-Z][a-z]+ \d+\./.test(inc.note)&&/What happened \(around 10:20 am\): Pushed the worksheet/.test(inc.note)&&/What the adults did:/.test(inc.note)&&!/not doing this/.test(inc.note)&&!/Tier/.test(inc.note),inc.note);
  ok('1g a day not on the sheet is added with its count; an edit moves the one to the new behavior; Delete takes it off again',inc.newDay==='1'&&inc.edit[0]===inc.was&&inc.edit[1]===1&&inc.del&&inc.left===1,inc);
  const rt=await page.evaluate(async()=>{const k=S.incidents.length;S.incidents.push({id:'x"><img src=x onerror=alert(1)>',date:'bad',time:'99',what:{},bcba:'yes'},null,7);S.weekly={'2026-10-05':'Fade the aide to the doorway','junk':5};
    const txt=JSON.stringify(S);await new Promise(res=>{openFile(new File([txt],'d.json',{type:'application/json'}));setTimeout(res,800);});
    return {n:S.incidents.length,k,bad:S.incidents.find(i=>/img/.test(i.id)),weekly:S.weekly,html:document.getElementById('ddInc').innerHTML.includes('<img')};});
  ok('1h the incidents and the week notes travel in the data file; a damaged entry is read in the shape the form writes',
    rt.n===rt.k+1&&rt.bad&&rt.bad.date===''&&rt.bad.time===''&&rt.bad.what===''&&rt.bad.bcba===false&&JSON.stringify(rt.weekly)==='{"2026-10-05":"Fade the aide to the doorway"}'&&!rt.html,rt);
  const pp=await page.evaluate(async()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));return 1;});
  await page.emulateMedia({media:'print'});
  const ip=await page.evaluate(()=>{const a=getComputedStyle(document.getElementById('ddInc')).display;const c=document.getElementById('ddIncPrint');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    return [a,getComputedStyle(document.getElementById('ddInc')).display,S.settings.incPrint];});
  await page.emulateMedia({media:'screen'});
  ok('1i the incident log prints with the sheet only when asked',ip[0]==='none'&&ip[1]!=='none'&&ip[2]===true,ip);
  const wk=await page.evaluate(()=>{const dflt=ddWeekDefault(),mon='2026-10-05';ddCaseFacts={points:{days:[{date:mon,pct:80,goal:75,met:true},{date:ddAddDays(mon,1),pct:70,goal:75,met:false},{date:ddAddDays(mon,-7),pct:50,goal:75,met:false}],src:'SM-1'}};
    document.getElementById('btnWeekSum').click();const opened=ddWeek;const wo=document.getElementById('ddWeekOf');wo.value='2026-10-07';wo.dispatchEvent(new Event('change',{bubbles:true}));const w=document.getElementById('ddWeekWrap');
    const rows=[...w.querySelectorAll('.wk-tab tbody tr')].map(t=>[...t.children].map(c=>c.innerText.replace(/\s+/g,' ').trim()));
    const ta=document.getElementById('ddWeekNext');ta.value='Fade the aide to the doorway\nAdd a second break card';ta.dispatchEvent(new Event('input',{bubbles:true}));
    return {good:[...w.querySelectorAll('.wk-tab tbody tr')].map(t=>t.children[3].className),dflt,opened,shown:ddWeek,mon,rows,text:w.innerText,others:getComputedStyle(document.querySelector('#tab-data > .panel:not(#ddWeekWrap)')).display,saved:S.weekly[mon]};});
  ok('1j the week summary (the latest week with data, or the week asked for): each behavior this week against last week, the change in the plan’s direction, the point sheet from the case, the team’s lines kept by week',
    wk.opened===wk.dflt&&wk.dflt==='2026-11-30'&&wk.shown==='2026-10-05'&&wk.rows.length===6&&/^5 \(1 a day\) 5 days$/.test(wk.rows[0][1])&&/^11 \(2\.2 a day\)$/.test(wk.rows[0][2])&&wk.rows[0][3]==='down 55%'&&wk.good[0]==='good'&&/^up \d+%$/.test(wk.rows[4][3])&&wk.good[4]==='good'&&/75% of the points on average across 2 days; the goal was met on 1/.test(wk.text)&&
    /Incidents \(\d+\)/.test(wk.text)&&wk.others==='none'&&/^Fade the aide/.test(wk.saved||''),wk);
  await page.emulateMedia({media:'print'});
  const wp=await page.evaluate(()=>({ta:getComputedStyle(document.getElementById('ddWeekNext')).display,p:document.querySelector('.wk-next-p').innerText,bar:getComputedStyle(document.querySelector('.wk-bar')).display}));
  await page.emulateMedia({media:'screen'});
  ok('1k printed, the summary shows the team’s lines as text and no controls',wp.ta==='none'&&/Add a second break card/.test(wp.p)&&wp.bar==='none',wp);
  await page.evaluate(()=>document.getElementById('ddWeekClose').click());
  ok('1l Back to the data closes it',await page.evaluate(()=>!document.body.classList.contains('dd-week-on')&&document.getElementById('ddWeekWrap').hidden));
  await page.close();

  /* ---------- 2. Form SM-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'SM-1_Self-Monitoring-and-Point-Systems_v2026-09.html',{waitUntil:'load'}).catch(()=>{});await sleep(1200);
  if(!/SM-1_/.test(page.url())||!(await page.evaluate(()=>typeof S==='object'))){const f=fs.readdirSync(__dirname+'/../NBH-Workstation').find(x=>/^SM-1_.*\.html$/.test(x));await page.goto(W+f,{waitUntil:'load'});await sleep(1200);}
  await page.evaluate(stub);await loadSim(page);await sleep(1200);
  const sm=await page.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();return o&&o.points&&{n:o.points.days.length,d:o.points.days.slice(-2),iso:o.points.days.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)),src:o.points.src};});
  ok('2a SM-1 gives the case its Record: each day’s share of the points and whether the goal was met, dated yyyy-mm-dd',!!sm&&sm.n>=10&&sm.iso&&typeof sm.d[1].pct==='number'&&sm.src==='SM-1',sm);
  await page.close();

  /* ---------- 3. Form QS-1 ---------- */
  page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(W+'QS-1_Staff-Quick-Start_v2026-10.html',{waitUntil:'load'});await sleep(800);await page.evaluate(stub);
  const q=await page.evaluate(()=>{const D=(m,mean)=>({data:{from:'2026-09-14',to:'2026-10-09',days:20,behaviors:[{name:'Leaving the room',kind:'target',measure:'count',unit:'occurrences',two:false,days:20,total:mean*20,mean,zero:3,last:0},
      {name:'Asks for a break',kind:'replacement',measure:'trials',unit:'% independent',two:true,days:14,total:1288,mean:92,zero:0,last:100}],src:'DD-1'}});
    const f1=Object.assign({fn:{label:'Escape from writing'},behaviors:[{label:'Leaving the room',def:'leaves the room without permission',ant:'a writing task'}]},D(0,0.4));
    window.__nbhFactsIn(f1);const r={t1:[S.stats[0].n,S.stats[0].label,S.stats[1].n],gets1:S.gets,may1:S.may};
    S.may='Walks out of the room when writing is handed out';renderEditor();   /* a rewrite */
    const f2=Object.assign({fn:{label:'Escape from handwriting tasks'},behaviors:[{label:'Leaving the room or the seat',def:'x',ant:'a writing task'}]},D(0,0.2));
    window.__nbhFactsIn(f2);
    r.gets2=S.gets;r.may2=S.may;r.chg=S.changed.may;r.t2=S.stats[0].n;r.notice=!!document.querySelector('.qs-chg[data-chg="may"]');
    window.__nbhFactsIn(f2);r.once=Object.keys(S.changed).length;
    document.querySelector('button[data-usenew="may"]').click();r.may3=S.may;r.after=!!S.changed.may;
    S.may='Mine again';window.__nbhFactsIn(Object.assign({},f2,{behaviors:[{label:'Bolting',def:'x',ant:'a writing task'}]}));document.querySelector('button[data-keepmine="may"]').click();r.kept=S.may;r.left=Object.keys(S.changed).length;
    return r;});
  ok('3a the tiles come from Form DD-1’s record: the mean a day, the percent for a skill',q.t1[0]==='0.4'&&q.t1[1]==='leaving the room, a day'&&q.t1[2]==='92%',q);
  ok('3b a field still holding the plan’s words follows the plan; a rewritten one keeps its words and shows the new ones, once',
    q.gets1==='Escape from writing'&&q.gets2==='Escape from handwriting tasks'&&q.t2==='0.2'&&q.may2==='Walks out of the room when writing is handed out'&&q.chg==='Leaving the room or the seat'&&q.notice&&q.once===1,q);
  ok('3c Use the plan’s words takes them; Keep mine keeps the rewrite and the notice goes',q.may3==='Leaving the room or the seat'&&!q.after&&q.kept==='Mine again'&&q.left===0,q);
  await loadSim(page);await sleep(900);
  const qo=await page.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.quick&&{r:o.quick.rules.length,t:o.quick.tiers.map(x=>x.name),r0:o.quick.rules[0]};});
  ok('3d QS-1 gives the case its non-negotiables and its tiers',!!qo&&qo.r>=4&&qo.t.length>=4&&!!qo.r0.do,qo);
  await page.close();

  /* ---------- 4. Form TI-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'TI-1_Treatment-Integrity-Observation_v2026-09.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const ti=await page.evaluate(()=>{const quick={rules:[{do:'Say yes to the break card at once',dont:'Make him wait or ask why'},{do:'One adult speaks during an escalation',dont:''},{do:'',dont:'Threats of losing recess'}],tiers:[],src:'QS-1'};
    const r0=window.__nbhFactsIn({quick});const r={rep:r0&&r0.filled,steps:S.steps.filter(s=>s.d).map(s=>s.d),btn:getComputedStyle(document.getElementById('addQuick')).display};
    S.steps[0].d='My own first step';quick.rules.push({do:'Praise the first minute of work',dont:''});window.__nbhFactsIn({quick});r.kept=S.steps[0].d;
    document.getElementById('addQuick').click();r.after=S.steps.filter(s=>s.d).map(s=>s.d);return r;});
  ok('4a an empty step list takes the quick start’s non-negotiables, each do beside the don’t it replaces',
    ti.rep>=3&&ti.steps[0]==='Say yes to the break card at once (not: make him wait or ask why)'&&ti.steps[1]==='One adult speaks during an escalation'&&ti.steps[2]==='Avoids: Threats of losing recess'&&ti.btn!=='none',ti);
  ok('4b a list in use is left as it is; the button adds only the non-negotiables not yet on it',ti.kept==='My own first step'&&ti.after.length===5&&ti.after.filter(s=>/break card/.test(s)).length===1&&ti.after.includes('Praise the first minute of work')&&ti.after.includes('Say yes to the break card at once (not: make him wait or ask why)'),ti);
  await page.close();

  /* ---------- 5. the workstation ---------- */
  page=await br.newPage({viewport:{width:1300,height:900},acceptDownloads:true});wire(page,log);
  await page.goto(W+'index.html',{waitUntil:'load'});await sleep(800);await page.evaluate(stub);
  await page.fill('#pClient','Mateo Rivera');await page.fill('#pSid','4471823');
  await page.evaluate(()=>{['#pClient','#pSid'].forEach(s=>document.querySelector(s).dispatchEvent(new Event('input',{bubbles:true})));});
  const settle=async id=>{const t=Date.now();while(Date.now()-t<20000&&!(await page.evaluate(id=>!!state.status[id],id)))await sleep(150);};
  for(const id of ['DD-1','SM-1','QS-1']){await page.evaluate(i=>openForm(i,true),id);await settle(id);
    const fr=page.frames().find(f=>f.url().includes(id==='DD-1'?'Daily_Behavior':id+'_'));if(fr){await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});
      if(id==='DD-1')await fr.evaluate(async()=>{await loadExample();});else await loadSim(fr);await sleep(800);}}
  await sleep(6000);await page.evaluate(()=>gatherFacts(true));await sleep(5000);
  const ws=await page.evaluate(()=>{const f=state.facts||{};return {data:!!f.data&&f.data.days,points:!!f.points&&f.points.days.length,quick:!!f.quick&&f.quick.rules.length,src:f.src,line:(document.getElementById('factsTxt')||{}).textContent||''};});
  ok('5a the case holds Form DD-1’s record, Form SM-1’s point sheet and Form QS-1’s rules, and the line under the bar says so',
    ws.data===20&&ws.points>=10&&ws.quick>=4&&ws.src.data==='DD-1'&&ws.src.points==='SM-1'&&ws.src.quick==='QS-1'&&/Data: 20 school days/.test(ws.line)&&/Point sheet/.test(ws.line),ws);
  const dd=page.frames().find(f=>f.url().includes('Daily_Behavior'));
  const dt=await dd.evaluate(()=>{document.getElementById('ddIncAdd').click();const t=[...document.querySelectorAll('#incTier option')].map(o=>o.textContent);document.getElementById('dlgInc').close();
    return {t,qs:ddCaseFacts&&ddCaseFacts.quick&&ddCaseFacts.quick.tiers.map(x=>x.name),hint:document.querySelector('#ddInc .inc-hd .hint').textContent};});
  ok('5b DD-1’s incident log offers the quick start’s tiers',!!dt.qs&&dt.qs.length>0&&dt.qs.every(n=>dt.t.includes(n))&&/Form QS-1/.test(dt.hint),dt);
  const SQ='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  await page.evaluate(sq=>{setPhoto(sq);state.photoSrc=sq.replace('/9j/','/9j/AA');},SQ);
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.evaluate(()=>document.getElementById('savePacket').click())]);
  const pf=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  ok('5c the packet file keeps the whole photo beside the packet, never in it',typeof pf.photoSrc==='string'&&/^data:image\/jpeg/.test(pf.photoSrc)&&!('photoSrc' in pf.packet)&&!!pf.packet.photo,Object.keys(pf));
  const re=await page.evaluate(async d=>{state.photoSrc='';await loadCase({form:'CASE',packet:d.packet,photoSrc:d.photoSrc,forms:{}},'file');const a=state.photoSrc===d.photoSrc;
    await loadCase({form:'CASE',packet:d.packet,photoSrc:'javascript:alert(1)',forms:{}},'file');return [a,state.photoSrc];},pf);
  ok('5d a case opened brings the whole photo back for Adjust position; anything but a picture is not taken',re[0]===true&&re[1]==='',re);
  const pc=await page.evaluate(async()=>{document.getElementById('help').click();await new Promise(r=>setTimeout(r,300));document.getElementById('hpPrintCheck').click();await new Promise(r=>setTimeout(r,300));
    const L=[...document.querySelectorAll('#dlgBody .pc-list input')];const r={n:L.length,title:(document.querySelector('#dlg h2,#dlgTitle')||{}).textContent,open:document.querySelectorAll('#dlgBody .pc-open [data-open]').length,done0:document.getElementById('pcDone').hidden};
    L.forEach(c=>{c.checked=true;});L[0].dispatchEvent(new Event('change',{bubbles:true}));r.done1=document.getElementById('pcDone').hidden;r.cmd=CMDS.some(c=>/Print check/.test(c.n));document.getElementById('dlg').close();return r;});
  ok('5e the print check opens from Help and the command box: nine lines to tick, the forms to open, a word when all are ticked',pc.n===9&&pc.open===3&&pc.done0===true&&pc.done1===false&&pc.cmd,pc);
  const errs=log.filter(l=>l.type==='pageerror');
  ok('5f no page errors anywhere',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
