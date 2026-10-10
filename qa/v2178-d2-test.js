/* v21.78 (helper D2): SA-1's Delay row through Save and Open, the case facts out of SA-1 (skills), PR-1 (review) and
   IM-1 (injury), and GB-1's progress report from a simulated case. Simulated students only. */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(name,cond,info)=>{console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?' :: '+(typeof info==='string'?info:JSON.stringify(info)).slice(0,400):''));if(!cond)fails++;};
const iso=/^\d{4}-\d{2}-\d{2}$/;
(async()=>{
  const br=await chromium.launch();const log=[];
  const open=async(file)=>{const page=await br.newPage({viewport:{width:1280,height:900}});wire(page,log);await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(500);
    await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});return page;};
  const sim=async page=>{await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(600);};

  /* ---- SA-1 ---- */
  {const p=await open('SA-1_Skill-Acquisition-Data_v2026-10.html');
    ok('SA-1 out is null on a blank form',await p.evaluate(()=>window.__nbhFactsOut()===null));
    await sim(p);
    const rt=await p.evaluate(()=>{S.sess[3].dl='4';S.sess.push({date:'10/1',ph:'T',inst:'JN',tr:['I'],dl:'2 s',note:'typed'});S.sess.push({date:'',ph:'T',inst:'',tr:[],note:''});
      const before=JSON.stringify(S);const o=fromFile(JSON.parse(JSON.stringify({form:'SA-1',S})));return {same:JSON.stringify(o)===before,dl:o.sess.map(s=>s.dl),types:o.sess.map(s=>typeof s.dl)};});
    ok('SA-1 round trip identical with the Delay row',rt.same,rt.dl);
    ok('SA-1 Delay row kept as strings',rt.dl[3]==='4'&&rt.dl[12]==='2 s'&&rt.types.slice(0,13).every(t=>t==='string'),rt.dl);
    const num=await p.evaluate(()=>{const o=fromFile({form:'SA-1',S:{sess:[{date:'1/2',ph:'T',tr:['I'],dl:3}]}});return o.sess[0].dl;});
    ok('SA-1 a number in the Delay row opens as a string',num==='3',num);
    await p.evaluate(()=>{S.sess.splice(12,2);S.sess[3].dl='0';renderAll();});
    const addS=await p.evaluate(()=>{document.querySelector('#addS').click();const s=S.sess[S.sess.length-1];const r='dl' in s;S.sess.pop();renderAll();return r;});
    ok('SA-1 a new session has a Delay entry',addS);
    const out=await p.evaluate(()=>window.__nbhFactsOut());const pr=out&&out.skills&&out.skills.programs[0];
    ok('SA-1 out: skills.programs with one program',!!pr&&out.skills.programs.length===1,out);
    ok('SA-1 out: name, target, criterion',pr&&/Break request/.test(pr.name)&&/break card/.test(pr.target)&&/90% independent across 3/.test(pr.criterion),pr);
    ok('SA-1 out: current level from the latest session (90), mastered, maintenance phase',pr&&pr.current===90&&pr.mastered===true&&pr.phase==='maintenance',pr);
    ok('SA-1 out: last date ISO, not in the future',pr&&iso.test(pr.last)&&pr.last<=new Date(Date.now()+864e5).toISOString().slice(0,10),pr&&pr.last);
    const notM=await p.evaluate(()=>{S.sess=S.sess.slice(0,6);renderAll();const r=window.__nbhFactsOut().skills.programs[0];return r;});
    ok('SA-1 out: before mastery, not mastered and in teaching',notM.mastered===false&&notM.phase==='teaching',notM);
    await p.close();}

  /* ---- PR-1 ---- */
  {const p=await open('PR-1_Periodic-Plan-Review_v2026-09.html');
    ok('PR-1 out is null on a blank form',await p.evaluate(()=>window.__nbhFactsOut()===null));
    await sim(p);
    const o=await p.evaluate(()=>window.__nbhFactsOut());const r=o&&o.review;
    ok('PR-1 out: review with ISO dates, next after the review',r&&iso.test(r.date)&&iso.test(r.next)&&r.next>r.date,r&&[r.date,r.next]);
    ok('PR-1 out: decision continue, with its words',r&&r.decision==='continue'&&r.decisionText==='Continue unchanged',r&&[r.decision,r.decisionText]);
    ok('PR-1 out: rules are numbers (minDays 10, improvePct 25)',r&&r.rules.minDays===10&&r.rules.improvePct===25&&typeof r.rules.fadePct==='number',r&&r.rules);
    ok('PR-1 out: exit monitoring written (schedule, threshold 2), no exit date while continuing',r&&r.exit&&/monthly/i.test(r.exit.every)&&r.exit.thresholdN===2&&!r.exit.date&&!r.exit.next,r&&r.exit);
    const x=await p.evaluate(()=>{S.meta.dec='Exit the plan';S.meta.date='9/15/26';S.meta.post='Checked every 2 weeks for a term';return window.__nbhFactsOut().review;});
    ok('PR-1 out: exit recorded gives the exit date and the next check from the schedule',x.decision==='exit'&&x.exit.date==='2026-09-15'&&x.exit.next==='2026-09-29',x.exit);
    const y=await p.evaluate(()=>{S.meta.post='Rate checked monthly for one term';const a=window.__nbhFactsOut().review.exit.next;S.meta.dec='Return to assessment';const b=window.__nbhFactsOut().review.decision;S.meta.dec='Modify the plan';const c=window.__nbhFactsOut().review.decision;S.meta.dec='Begin fading';const d=window.__nbhFactsOut().review.decision;return [a,b,c,d];});
    ok('PR-1 out: monthly next check, and the decision keys',y.join()==='2026-10-15,reassess,modify,fade',y);
    /* through the form's fields, as typed */
    const z=await p.evaluate(async()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
      set('dec','Begin fading');set('date','2026-10-02');set('next','11/6/2026');await new Promise(r=>setTimeout(r,200));return window.__nbhFactsOut().review;});
    ok('PR-1 out: read from the fields as typed (ISO and m/d/yyyy)',z.decision==='fade'&&z.date==='2026-10-02'&&z.next==='2026-11-06',[z.decision,z.date,z.next]);
    await p.close();}

  /* ---- IM-1 ---- */
  {const p=await open('IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html');
    ok('IM-1 out is null on a blank form',await p.evaluate(()=>window.__nbhFactsOut()===null));
    await sim(p);
    const o=await p.evaluate(()=>window.__nbhFactsOut());const j=o&&o.injury;
    ok('IM-1 out: last injury date ISO',j&&iso.test(j.last),j);
    ok('IM-1 out: count in the last 30 days (two administrations and the care entry)',j&&j.count30===3,j&&j.count30);
    ok('IM-1 out: the re-examination open with an ISO due date',j&&j.open.length>=1&&j.open.every(x=>iso.test(x.due)&&x.done===false)&&j.open.some(x=>/re-examination/.test(x.what)),j&&j.open);
    ok('IM-1 out: latest administration indices',j&&j.latest&&j.latest.sites===1&&iso.test(j.latest.date),j&&j.latest);
    const k=await p.evaluate(()=>{const t=new Date(),d=(t.getMonth()+1)+'/'+t.getDate()+'/'+t.getFullYear();S.care.push(careCopy({id:'x1',date:d,time:'09:00',area:S.care[0].area,task:'help with toileting',seen:'A small red mark (simulated)',by:'Aide (simulated)'}));return window.__nbhFactsOut().injury;});
    ok('IM-1 out: a care entry not yet passed on opens the nurse, parent and report items, due that day',k.count30===4&&['school nurse','parent or guardian','report question'].every(w=>k.open.some(x=>x.what.indexOf(w)>=0)),k.open.map(x=>x.what+' '+x.due));
    await p.close();}

  /* ---- GB-1 progress report ---- */
  {const p=await open('GB-1_Goal-and-Objective-Builder_v2026-09.html');
    await sim(p);
    await p.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
      document.querySelector('#addRed').click();document.querySelector('#addRed').click();
      set('red[1].beh','Elopement');set('red[1].dir','decrease');set('red[1].meas','frequency per school day');set('red[1].cur','5 per school day');set('red[1].ml','more');set('red[1].tgt','0 per school day');set('red[1].crit','5');
      set('red[2].beh','Spitting');set('red[2].dir','decrease');set('red[2].meas','frequency per school day');});
    const t=new Date(),D=n=>{const d=new Date(t);d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
    const f={data:{from:D(40),to:D(1),days:20,src:'DD-1',conds:[{name:'Baseline',from:D(40),to:D(30),days:6},{name:'FCT and NCR',from:D(29),to:D(1),days:14}],
      behaviors:[{name:'Aggression toward staff',kind:'target',measure:'rate',unit:'per hour',direction:'decrease',days:20,mean:40,base:{days:6,mean:84},baseName:'Baseline',cur:{days:14,mean:18},curName:'FCT and NCR',aim:null,aimMet:false},
        {name:'Elopement',kind:'target',measure:'count',unit:'occurrences',direction:'decrease',days:20,mean:4.9,base:{days:6,mean:5},cur:{days:14,mean:4.8},curName:'FCT and NCR',aim:null,aimMet:false}]},
      skills:{programs:[{name:'Break request (FCT), Program 2',target:'Hands the break card to the adult when a non-preferred task is presented',criterion:'90% independent across 3 consecutive teaching sessions with 2 instructors',current:90,last:D(1),mastered:true,phase:'maintenance'}]},
      review:{rules:{minDays:10,improvePct:25}}};
    const r0=await p.evaluate(f=>window.__nbhFactsIn(f),f);
    ok('GB-1 facts in still returns its report',r0&&typeof r0.filled==='number',r0);
    await p.click('#viewSeg button[data-view="prog"]');await sleep(300);
    ok('GB-1 Progress report view shows its pane',await p.evaluate(()=>getComputedStyle(document.querySelector('#progPane')).display!=='none'));
    const L=await p.evaluate(()=>window.__gbProgress());const by=k=>L.find(x=>x.key===k)||{};
    ok('GB-1 report lists every written objective (3 reduction, 1 skill)',L.length===4,L.map(x=>x.key));
    ok('GB-1 R1 from DD-1 (18 per hour = 0.3 per minute against 1.4 to 0.2): sufficient progress',by('red0').code==='Sufficient progress to meet the goal'&&/DD-1/.test(by('red0').src)&&/0\.3 per minute/.test(by('red0').level),by('red0'));
    ok('GB-1 R2 barely changed: little or no progress',by('red1').code==='Little or no progress',by('red1'));
    ok('GB-1 R3 not in the data: not yet introduced',by('red2').code==='Not yet introduced',by('red2'));
    ok('GB-1 A1 from SA-1, mastered',by('acq0').code==='Mastered'&&/SA-1/.test(by('acq0').src)&&/90/.test(by('acq0').level),by('acq0'));
    if(process.env.SHOW)console.log(L.map(x=>x.say).join('\n'));
    const bad=L.filter(x=>/baseline|reinforce|criterion|DD-1|SA-1|objective/i.test(x.say));
    ok('GB-1 family sentences free of jargon',!bad.length&&L.every(x=>x.say.length>20),L.map(x=>x.say));
    ok('GB-1 family sentence: one sentence each',L.every(x=>(x.say.match(/[.!?](\s|$)/g)||[]).length===1),L.map(x=>x.say));
    const P=await p.evaluate(()=>[document.querySelector('[name="pr.from"]').placeholder,document.querySelector('[name="pr.to"]').placeholder]);
    ok('GB-1 default period is the last 9 weeks',(new Date(P[1])-new Date(P[0]))/864e5===63,P);
    /* the code can be changed, is kept with the record, and changes the sentence */
    await p.selectOption('select[data-pk="red1"]','Progress, may not meet the goal');await sleep(300);
    const ch=await p.evaluate(()=>({g:window.__gbProgress().find(x=>x.key==='red1'),c:collect().f['pr.picks']}));
    ok('GB-1 a changed code is kept (and saved) and the sentence follows',ch.g.chosen==='Progress, may not meet the goal'&&ch.g.code==='Little or no progress'&&/may not meet/.test(ch.g.say)&&/red1/.test(ch.c||''),ch);
    await p.selectOption('select[data-pk="red1"]','Little or no progress');await sleep(200);
    ok('GB-1 choosing the suggestion again drops the override',!(await p.evaluate(()=>collect().f['pr.picks'])));
    /* the period: a period with no DD-1 figures leaves the reduction codes to choose */
    await p.evaluate(()=>{const a=document.querySelector('[name="pr.from"]'),b=document.querySelector('[name="pr.to"]');a.value='2025-01-01';b.value='2025-03-01';a.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(400);
    const old=await p.evaluate(()=>window.__gbProgress().find(x=>x.key==='red0'));
    ok('GB-1 a period outside the data: no figures, code left to choose',!old.code&&!old.level&&/outside|no figures/i.test(old.why+old.say),old);
    await p.click('#progNine');await sleep(300);
    ok('GB-1 Last 9 weeks resets the period',await p.evaluate(()=>!document.querySelector('[name="pr.from"]').value&&window.__gbProgress()[0].code!==''));
    /* copy and print */
    await p.context().grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{});
    await p.click('#progCopy');await sleep(300);
    const txt=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>document.querySelector('#progCopyBox')&&document.querySelector('#progCopyBox').value));
    ok('GB-1 Copy the report puts the text out',/PROGRESS REPORT ON ANNUAL GOALS/.test(txt||'')&&/For the family:/.test(txt||'')&&/Sufficient progress/.test(txt||''),(txt||'').slice(0,200));
    await p.evaluate(()=>{document.body.classList.add('gb-print-prog');});await p.emulateMedia({media:'print'});
    const vis=await p.evaluate(()=>[...document.querySelectorAll('.pane')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.pane));
    const say=await p.evaluate(()=>getComputedStyle(document.querySelector('.gp-say')).display);
    await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.body.classList.remove('gb-print-prog'));
    ok('GB-1 Print the report prints the report alone, with the sentences as text',vis.join()==='prog'&&say==='block',[vis,say]);
    /* outside the workstation: no facts, nothing pre-picked */
    const none=await p.evaluate(()=>{window.__nbhFactsIn({});return window.__gbProgress().map(x=>x.code);});
    ok('GB-1 with no case figures, no code is pre-picked',none.every(c=>!c),none);
    /* phone width */
    await p.evaluate(f=>window.__nbhFactsIn(f),f);await p.setViewportSize({width:390,height:800});await sleep(300);
    const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
    ok('GB-1 report fits a phone width',sw[0]<=sw[1],sw);
    await p.close();}

  const pe=log.filter(l=>l.type==='pageerror');
  ok('no page errors',!pe.length,pe);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
