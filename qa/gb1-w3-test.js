/* Form GB-1, review Wave 3: the goal is met only on the objective's own target, never on DD-1's stepped aim (F188, I97); the
   level is the reporting period's own days (F191); choices belong to a period and every report is kept (F192, I96); DD-1's rate
   per hour into a per-minute objective, mixed units checked (F193); the family sentences announce no team decision (F190); the
   Guide off the goal document (F194); the IEP date from the case (F195); the template's source and Florida's rule (F196, F197).
   Simulated data only. usage: node qa/gb1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const GB='GB-1_Goal-and-Objective-Builder_v2026-09.html',DD='Daily_Behavior_Data_and_Visual_Analysis.html';
/* school days (Monday to Friday) between two dates, with a value each */
const days=(from,to,f)=>{const out=[];const d=new Date(from+'T12:00:00');const z=new Date(to+'T12:00:00');let k=0;while(d<=z){const w=d.getDay();if(w&&w<6){out.push({date:d.toISOString().slice(0,10),v:f(k,d)});k++;}d.setDate(d.getDate()+1);}return out;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(GB);
  await L.loadSim(p);await sleep(900);
  await p.evaluate(()=>{addRed();const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('red[1].beh','Elopement (simulated)');set('red[1].dir','decrease');set('red[1].meas','frequency per school day');set('red[1].cur','6 per school day');set('red[1].ml','more');set('red[1].tgt','1 per school day');set('red[1].crit','5');
    set('m.date','2026-02-23');set('red[0].date','2027-02-20');set('red[1].date','2027-02-20');});
  /* the case: DD-1 per hour (Aggression) and per day (Elopement), Feb 23 to Oct 9 in Treatment; DD-1's aim stepped at 20 per hour and held */
  const T=days('2026-02-23','2026-10-09',(k,d)=>({a:Math.max(10,40-k*0.15),e:k%4===0?2:1}));
  const mk=list=>list.map(x=>({date:x.date,vals:{'Aggression toward staff (simulated)':Math.round(x.v.a*100)/100,'Elopement (simulated)':x.v.e}}));
  const daily=mk(T);
  const meanIn=(a,b,key)=>{const L=T.filter(x=>x.date>=a&&x.date<=b).map(x=>x.v[key]);return L.reduce((s,v)=>s+v,0)/L.length;};
  const facts={review:{rules:{improvePct:25}},data:{from:'2026-02-02',to:'2026-10-09',days:T.length+12,src:'DD-1',daily,byDay:daily.slice(-30),
    behaviors:[{name:'Aggression toward staff (simulated)',kind:'target',measure:'rate',unit:'per hour',direction:'decrease',days:20,mean:18,base:{mean:84,days:12},baseName:'Baseline',cur:{mean:30,days:T.length},curName:'Treatment',aim:20,need:3,run:7,aimMet:true},
      {name:'Elopement (simulated)',kind:'target',measure:'count',unit:'occurrences',direction:'decrease',days:20,mean:1.25,base:{mean:6,days:12},baseName:'Baseline',cur:{mean:1.3,days:T.length},curName:'Treatment',aim:1,need:5,run:0,aimMet:false}],
    conds:[{name:'Baseline',from:'2026-02-02',to:'2026-02-20',days:12},{name:'Treatment',from:'2026-02-23',to:'2026-10-09',days:T.length}]}};
  const per=async(a,b)=>{await p.evaluate(([a,b])=>{const x=document.querySelector('[name="pr.from"]'),y=document.querySelector('[name="pr.to"]');x.value=a;y.value=b;x.dispatchEvent(new Event('input',{bubbles:true}));y.dispatchEvent(new Event('input',{bubbles:true}));},[a,b]);await sleep(350);};
  await p.evaluate(f=>{window.__nbhFactsIn(f);document.querySelector('#viewSeg button[data-view="prog"]').click();},facts);await per('2026-08-11','2026-10-09');
  const r1=await p.evaluate(()=>window.__gbProgress());const A=r1[0],E=r1[1];
  const m1=meanIn('2026-08-11','2026-10-09','a');
  ok('1 F191 the level is the period’s own days: their mean, number and range, with the whole phase as a second figure, converted to the objective’s unit',
    new RegExp('^'+(Math.round(m1*100)/100).toString().replace('.','\\.')+' per hour on average across \\d+ school days with data in this period \\(August 11 to October 9; range [\\d.]+–[\\d.]+\\); the whole Treatment phase: 30 per hour = [\\d.]+ per minute$').test(A.level),A.level);
  ok('2 F188 I97 DD-1’s stepped aim held does not make the goal met: the code comes from the objective’s own target, and the why says the aim is a treatment step',
    A.code!=='Mastered'&&/DD-1’s current step \(20 per hour\) has been held 7 days in a row: a treatment step, not this objective’s target/.test(A.why)&&!/has met this goal/.test(A.say),A);
  await p.selectOption('select[data-pk="red0"]','Mastered');await sleep(300);
  const r2=await p.evaluate(()=>window.__gbProgress()[0]);
  ok('3 F188 Mastered chosen by hand against the figures: the sentence does not say the goal is met, and a warning shows',
    r2.chosen==='Mastered'&&/the team will look at whether this goal is met at the next review/.test(r2.say)&&!/has met this goal/.test(r2.say)&&/Mastered is chosen, but this period’s figures are not at the objective’s target/.test(r2.warn),r2);
  const fixed=await p.evaluate(()=>[document.querySelector('[name="pr.from"]').value,document.querySelector('[name="pr.to"]').value]);
  /* a real mastery: the last days of a period all at or under the target (0.2 per minute = 12 per hour, 5 asked) */
  const f2=JSON.parse(JSON.stringify(facts));f2.data.daily.forEach(x=>{if(x.date>='2026-09-28')x.vals['Aggression toward staff (simulated)']=9;});
  const r3=await p.evaluate(f=>{window.__nbhFactsIn(f);const L=window.__gbProgress();return L[0];},f2);
  ok('4 F188 the goal is suggested met when the objective’s own target holds for its own number of measurements in a row',r3.code==='Mastered'&&/At or better than the target on the last \d+ days with data in a row \(\d+ asked\)/.test(r3.why),r3);
  await p.evaluate(f=>window.__nbhFactsIn(f),facts);
  /* ---- F192 the choices belong to the period ---- */
  await p.evaluate(()=>{const t=document.querySelector('textarea[data-say="red1"]');t.value='EDITED FOR THE AUGUST REPORT';t.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
  await per('2026-03-02','2026-05-01');
  const q=await p.evaluate(()=>({L:window.__gbProgress(),head:document.querySelector('.gp-head').textContent}));
  const m2=meanIn('2026-03-02','2026-05-01','a');
  ok('5 F192 another period starts clean: the code and the sentence chosen for August are not carried, and the report says they are kept with that period',
    q.L[0].chosen===q.L[0].code&&q.L[0].chosen!=='Mastered'&&q.L[1].say!=='EDITED FOR THE AUGUST REPORT'&&/Codes and sentences chosen for August 11, 2026 to October 9, 2026 are kept with that period/.test(q.head),{c:q.L.map(x=>[x.code,x.chosen,x.say.slice(0,40)]),head:q.head});
  ok('6 F191 an earlier period reports its own days (March to May), not the whole phase',q.L[0].level.indexOf(String(Math.round(m2*100)/100)+' per hour on average across')===0&&/in this period \(March 2 to May 1;/.test(q.L[0].level),q.L[0].level);
  await per('2026-08-11','2026-10-09');
  const back=await p.evaluate(()=>window.__gbProgress());
  ok('7 F192 going back to the August period finds its choices again, and a choice made on the rolling nine weeks fixed the period',back[0].chosen==='Mastered'&&back[1].say==='EDITED FOR THE AUGUST REPORT'&&fixed[0]!==''&&fixed[1]!=='',{back:back.map(x=>[x.chosen,x.say.slice(0,30)]),fixed});
  /* ---- I96 every report kept, the last one beside each goal ---- */
  await p.click('#progKeep');await sleep(300);
  await per('2026-10-12','2026-12-18');
  const nx=await p.evaluate(()=>({L:window.__gbProgress(),h:window.__gbProgHistory(),txt:window.__gbProgText(),cell:document.querySelector('#progOut .gp-since').textContent,kept:document.querySelector('.gp-kept').textContent}));
  ok('8 I96 Keep this report keeps it in the form’s file: its period, figures, codes and sentences',nx.h.length===1&&nx.h[0].from==='2026-08-11'&&nx.h[0].rows.length===3&&nx.h[0].rows[0].code==='Mastered'&&nx.h[0].rows[1].say==='EDITED FOR THE AUGUST REPORT'&&/Reports kept/.test(nx.kept),nx.h);
  ok('9 I96 the next report shows the last one beside each goal, on screen, in print and in the copied text',/^Last report \(August 11, 2026 to October 9, 2026\): .+ per hour .*; Mastered$/.test(nx.cell)&&nx.L[0].since&&/Last report \(August 11, 2026 to October 9, 2026\):/.test(nx.txt),{cell:nx.cell,since:nx.L[0].since});
  const sh=await p.evaluate(()=>{document.querySelector('[data-hshow="0"]').click();return document.querySelector('#gpHist').textContent;});
  ok('10 I96 a kept report can be shown again as it was',/EDITED FOR THE AUGUST REPORT/.test(sh)&&/Mastered/.test(sh),sh.slice(0,200));
  ok('11 F191 a period with no DD-1 day inside it and outside its phase has no figures',!nx.L[0].level,nx.L[0]);
  /* ---- F190 the sentences announce no team decision ---- */
  const say=await p.evaluate(()=>{const R={kind:'red',i:1,beh:'Elopement (simulated)',date:'2027-02-20',fig:{now:3,tgt:1,unit:' times a day',from:'2026-08-11',to:'2026-10-09',start:6}};
    return [gbpSay(R,'Progress, may not meet the goal'),gbpSay(R,'Little or no progress')];});
  ok('12 F190 "may not meet" and "little or no progress" say what the data show and that the team will review it, not that it is changing the goal',
    /is making progress but may not meet this goal by .* at this pace\.$/.test(say[0])&&/there has been little or no change so far; the team will review this goal at the next meeting\.$/.test(say[1])&&!/is changing|looking at what to adjust/.test(say.join(' ')),say);
  /* ---- F192 a file saved before v22.84: its choices belong to the period showing ---- */
  const old=await p.evaluate(()=>{const e=document.querySelector('[name="pr.picks"]');e.value=JSON.stringify({code:{red1:'Little or no progress'},say:{}});gbProgRender();return JSON.parse(e.value);});
  ok('13 F192 choices saved before are kept with the period showing when the file is opened',old.periods&&old.periods['2026-10-12|2026-12-18']&&old.periods['2026-10-12|2026-12-18'].code.red1==='Little or no progress'&&Object.keys(old.periods).length===1,old);
  /* ---- F193 DD-1's rate per hour into a per-minute objective ---- */
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="red"]').click());
  const dd={form:'DD-1',meta:{client:'SIMULATED – Sample Student',baseline:'Baseline'},settings:{entryMode:'daily',dayStart:'08:00',dayEnd:'14:00',slotMin:30},
    behaviors:[{id:'b1',name:'Aggression toward staff (simulated)',kind:'target',measure:'rate',obsLength:'Entire school day'},{id:'b2',name:'Elopement (simulated)',kind:'target',measure:'count',obsLength:'Entire school day'}],
    rows:[{date:'2026-02-02',phaseType:'full',phaseLabel:'Baseline',values:{b1:300,b2:6}},{date:'2026-02-03',values:{b1:270,b2:5}},{date:'2026-02-04',values:{b1:330,b2:7}},{date:'2026-02-23',phaseType:'full',phaseLabel:'Treatment',values:{b1:120,b2:4}}]};
  const u=await p.evaluate(async d=>{const e=document.querySelector('[name="red[0].cur"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));const e2=document.querySelector('[name="red[1].cur"]');e2.value='';e2.dispatchEvent(new Event('input',{bubbles:true}));
    await gbDdUse(d,'file','DD-1_sim.json');return {r1:document.querySelector('[name="red[0].cur"]').value,meas:document.querySelector('[name="red[0].meas"]').value,rep:document.querySelector('#gbDdOut').innerText};},dd);
  ok('14 F193 DD-1’s baseline goes into a per-minute objective as a rate per minute, with DD-1’s per-hour figure beside it',u.meas==='rate per minute'&&u.r1==='0.83 per minute (50 per hour on DD-1, baseline: mean of 3 days, range 45–55 per hour)',u);
  const ck=await p.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('red[0].cur','50 per hour');render();
    const a=redChecks(0).join(' ');set('red[0].cur','0.83 per minute (50 per hour on DD-1)');render();return {a,b:redChecks(0).join(' ')};});
  ok('15 F193 a current level and a target level in different units get a Check line; the same units do not',/are in different units: write both in the objective&rsquo;s response measure \(rate per minute\)/.test(ck.a)&&!/different units/.test(ck.b),ck);
  /* ---- F195 the IEP date from the case ---- */
  const ie=await p.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.review','');set('red[1].date','');
    window.__nbhFactsIn({profile:{dates:{iep:'2027-03-02'}}});return {rev:document.querySelector('[name="m.review"]').value,d1:document.querySelector('[name="red[1].date"]').value,d0:document.querySelector('[name="red[0].date"]').value,src:document.querySelector('#gbIepSrc').textContent};});
  ok('16 F195 the annual IEP date in the case fills an empty review date and an objective with no target date; a typed date is kept',ie.rev==='2027-03-02'&&ie.d1==='2027-03-02'&&ie.d0==='2027-02-20'&&/from the student profile \(Form DM-1\)/.test(ie.src),ie);
  /* ---- F194, F196, F197 ---- */
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="red"]').click());await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>({guide:getComputedStyle(document.querySelector('.pane[data-pane="guide"]')).display,fmt:[...document.querySelectorAll('.gb-fmt')].map(e=>getComputedStyle(e).display),cite:getComputedStyle(document.querySelector('main.sheet>.cite')).display}));
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="guide"]').click());const pg=await p.evaluate(()=>getComputedStyle(document.querySelector('.pane[data-pane="guide"]')).display);await p.emulateMedia({media:'screen'});
  ok('17 F194 the Guide, the format blocks and the source notes stay off the goal document; the Guide prints from its own view',pr.guide==='none'&&pr.fmt.every(x=>x==='none')&&pr.cite==='none'&&pg==='block',{pr,pg});
  const tx=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('18 F194 F196 F197 "(Student)" in the template; the template’s source named as unpublished course material in the reference list; Florida permits objectives for other students',
    /\(Student\) will/.test(tx)&&!/Consumer name/.test(tx)&&/adapted from unpublished course material/.test(tx)&&/Florida Institute of Technology\. \(2019\)\. ABA instructional series \[Unpublished course material/.test(tx)&&/Florida permits benchmarks or short-term objectives for any other student with a disability/.test(tx)&&!/Florida also requires/.test(tx)&&!/\(3\)\(h\)[37]\./.test(tx),'');
  /* ---- DD-1 hands its whole record by day ---- */
  const d=await open(DD);
  await L.loadSim(d);await sleep(900);
  const dl=await d.evaluate(()=>{const o1=window.__nbhFactsOut().data,n1=(o1.byDay||[]).length,d1=!!o1.daily;
    /* forty more school days with data, before the sample's first day */
    const R=S.rows,first=sortedRows()[0],t=new Date(first.date+'T12:00:00');let k=0;while(k<40){t.setDate(t.getDate()-1);if(t.getDay()%6===0)continue;const c=JSON.parse(JSON.stringify(first));c.date=t.toISOString().slice(0,10);delete c.phaseType;delete c.phaseLabel;R.push(c);k++;}
    const o=window.__nbhFactsOut().data;return {n1,d1,byDay:(o.byDay||[]).length,daily:(o.daily||[]).length,dated:sortedRows().filter(r=>r.date).length};});
  ok('19 F191 DD-1 hands the case every day with data beyond the last 30 (only when there are more), so a report can read its own period',!dl.d1&&dl.byDay===30&&dl.daily===dl.n1+40,dl);
  /* ---- I97 Today ---- */
  const shell=await (await br.newContext()).newPage();await shell.goto(L.BASE+"/NBH-Workstation/index.html");await sleep(1200);
  const td=await shell.evaluate(()=>{state.facts={src:{},data:{from:'2026-09-01',to:'2026-10-09',days:20,behaviors:[{name:'Aggression',aimMet:true,run:7,need:3}]}};return todayItems().filter(x=>x.k==='Aim').map(x=>x.t).join(' ');});
  ok('20 I97 Today’s aim line says the aim is a treatment step and the goal is judged on GB-1',/DD-1’s aim is a treatment step; whether the IEP goal is met is judged on Form GB-1/.test(td),td);
  ok('21 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
