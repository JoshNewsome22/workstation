/* Form PR-1, review Wave 3 minors: what the case already holds is not typed again, and Import From TI-1 fills the period rows
   (F326); the sentences say no more than the studies show, and a 25% change is not called "met" (F327).
   Simulated data only. usage: node qa/pr1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const PR='PR-1_Periodic-Plan-Review_v2026-09.html',CT='CT-1_Caregiver-Training_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const setM=(p,o)=>p.evaluate(o=>{for(const k in o){const e=document.querySelector('[data-m="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}},o);
  const p=await open(PR);
  /* ---- F327 ---- */
  const t1=await p.evaluate(()=>document.body.innerHTML);
  const ct=await (await ctx.request.get(L.BASE+'/NBH-Workstation/'+CT)).text();
  ok('1 F327 the Fading Sequence gives Briggs et al. (2018) as the abstract does (19 of 25, sometimes above baseline) and asks for a current crisis plan before each step; no "42% of thinning steps" in PR-1 or CT-1',
    /resurgence occurred during schedule thinning in functional communication training in 19 of 25 applications \(76%\), and in some it rose above baseline levels \(Briggs et al\., 2018\)/.test(t1)&&
    /check that the crisis plan \(Form CR-1\) is current before each step/.test(t1)&&!/42% of thinning/.test(t1)&&!/42% of thinning/.test(ct)&&/19 of 25 applications \(76%\), in some above baseline levels/.test(ct));
  await setM(p,{intPct:'95',intMean:'70',intN:'3'});
  const v1=await p.evaluate(()=>document.getElementById('intVerdict').textContent);
  ok('2 F327 the printed integrity verdict says the study was of adult volunteers, not that every learner mastered the task',
    /does not pass the plan-run gate/.test(v1)&&/In a laboratory study, adult volunteers learned the task once the consequence errors stopped \(Burlison et al\., 2026\): the direction of the evidence, not a promise for this student\./.test(v1)&&!/every learner/.test(v1),v1);
  const r3=await p.evaluate(()=>{const a=pr83Read({name:'Hitting peers (simulated)',base:'4',cur:'2',days:'12',dir:''}),b=pr83Read({name:'X',base:'4',cur:'3.5',days:'12',dir:''}),
    g=pr83Read({name:'Asking for a break (simulated)',kind:'rep',base:'0',cur:'6',goal:'5',days:'12',dir:'increase'});
    S.tg=[pr83Row({name:'Hitting peers (simulated)',base:'4',cur:'2',days:'12'})];return {a,b,g,line:pr83Line()};});
  ok('3 F327 a 25% reduction is "reached", not "met"; a replacement skill is "at goal"; the log line says the same',
    /^25% reduction reached: /.test(r3.a.rule)&&r3.a.state==='25% reduction reached'&&r3.a.met===true&&/^Not reached: /.test(r3.b.rule)&&r3.b.state==='short of 25% reduction'&&
    r3.g.state==='at goal'&&/\(25% reduction reached\)/.test(r3.line)&&!/\(met\)/.test(r3.line),r3);
  const r4=await p.evaluate(()=>{S.rows[1].i='85';S.rows[1].p='Period 1';renderAll();return document.getElementById('fidTbl').textContent;});
  ok('4 F327 a period row at 85% reads "below the 90% criterion; re-check", not "on the most recent observation"',/80–89%: below the 90% criterion; re-check/.test(r4)&&!/most recent observation; re-check/.test(r4),r4.slice(0,600));
  /* ---- F326 1: fills from the case ---- */
  await p.evaluate(()=>{S.rows[1].i='';S.rows[1].p='';S.log=[];['plan','rep','team','trained','pFrom','pTo','intPct','intMean','intN'].forEach(k=>{S.meta[k]='';});renderAll();});
  const CASE={plan:{rep:'Asking for a break (simulated)',adoption:{date:'2026-09-24',team:'Dana Whitfield (teacher, simulated); Ana Rivera (parent, simulated); Jordan Ellis (simulated)',parent:'yes',notice:'2026-09-24',start:'2026-09-25',version:1},
      versions:[{v:1,why:'adopted',date:'2026-09-24',notice:'2026-09-24'}]},
    staff:{people:[{name:'Paula Brennan (simulated)',role:'Paraprofessional',met:true},{name:'Iris Calloway (simulated)',role:'Teacher',met:false}],all:false},
    data:{from:'2026-08-20',to:'2026-10-16',days:40,src:'DD-1',conds:[{name:'Baseline',from:'2026-08-20',to:'2026-09-24'},{name:'FCT',from:'2026-09-25',to:'2026-10-16'}],behaviors:[]}};
  const f1=await p.evaluate(c=>{const r=window.__nbhFactsIn(c);const g=k=>document.querySelector('[data-m="'+k+'"]').value;
    return {r,plan:g('plan'),rep:g('rep'),team:g('team'),trained:g('trained'),pFrom:g('pFrom'),pTo:g('pTo'),m:{plan:S.meta.plan,trained:S.meta.trained,pFrom:S.meta.pFrom},src:document.getElementById('prTrainedSrc').textContent,
      v:document.getElementById('intVerdict').textContent};},CASE);
  ok('5 F326 the plan under review, the replacement behavior, who took part and staff trained come from the case (TD-1 and ST-1)',
    f1.plan==='BIP v1 adopted 9/24/26, prior written notice 9/24/26, started 9/25/26, Form TD-1'&&f1.m.plan===f1.plan&&f1.rep==='Asking for a break (simulated)'&&/^Dana Whitfield \(teacher, simulated\); Ana Rivera/.test(f1.team)&&
    f1.trained==='Some'&&f1.m.trained==='Some'&&/Form ST-1: 1 of the 2 adults listed has met the criterion\./.test(f1.src),f1);
  ok('6 F326 the period runs from the start of DD-1’s current condition (not baseline) to its last day with data; the note names what was filled',
    f1.pFrom==='2026-09-25'&&f1.pTo==='2026-10-16'&&f1.m.pFrom==='2026-09-25'&&/the plan under review, the replacement behavior, who took part, staff trained to criterion, the period \(the start of FCT on Form DD-1 to Form DD-1’s last day with data\) from the case/.test(f1.r&&f1.r.note),f1);
  ok('7 F326 Staff trained to criterion is read by the integrity verdict: "Some" says a figure below criterion may reflect training',/Staff trained to criterion: Some\. Not every adult running the plan has met the criterion on Form ST-1/.test(f1.v),f1.v);
  const f2=await p.evaluate(c=>{document.querySelector('[data-m="rep"]').value='Hands up for help (typed)';S.meta.rep='Hands up for help (typed)';
    c=JSON.parse(JSON.stringify(c));c.plan.rep='Something else (simulated)';c.plan.adoption.team='Other team (simulated)';c.data.conds[1].from='2026-10-01';const r=window.__nbhFactsIn(c);
    return {r,rep:S.meta.rep,team:S.meta.team,pFrom:S.meta.pFrom};},CASE);
  ok('8 F326 an entry already made is kept: a second push fills nothing',f2.rep==='Hands up for help (typed)'&&/^Dana Whitfield/.test(f2.team)&&f2.pFrom==='2026-09-25'&&!(f2.r&&/the replacement behavior/.test(f2.r.note||'')),f2);
  const f3=await p.evaluate(c=>{['plan','pFrom','pTo','trained'].forEach(k=>{S.meta[k]='';});bindMeta();S.log=[{date:'2026-10-01',decision:'continue'}];
    c=JSON.parse(JSON.stringify(c));c.plan.adoption.version=2;c.plan.versions.push({v:2,why:'function revised',date:'2026-10-10',notice:'2026-10-09'});c.staff.people.forEach(x=>{x.met=true;});
    window.__nbhFactsIn(c);return {plan:S.meta.plan,pFrom:S.meta.pFrom,pTo:S.meta.pTo,trained:S.meta.trained};},CASE);
  ok('9 F326 a revised plan reads as version 2 with its own notice; after a review closed on this form the period starts the day after it; all trained reads All',
    f3.plan==='BIP v2 revised 10/10/26 (function revised), first adopted 9/24/26, prior written notice 10/9/26, started 9/25/26, Form TD-1'&&f3.pFrom==='2026-10-02'&&f3.pTo==='2026-10-16'&&f3.trained==='All',f3);
  /* ---- F326 2: TI-1's dated observations in the period rows ---- */
  const t2=await p.evaluate(async()=>{S.log=[];while(S.rows.length<3)S.rows.push(ROW());S.rows.forEach(r=>{r.i='';r.cc='';});
    S.dd={t:{src:'workstation',rows:[{k:0,label:'Baseline',from:'2026-08-20',to:'2026-09-24',n:20},{k:1,label:'FCT 1',from:'2026-09-25',to:'2026-10-05',n:7},{k:2,label:'FCT 2',from:'2026-10-06',to:'2026-10-16',n:8}]}};
    const TI={form:'TI-1',S:{nObs:4,critN:2,crit:90,steps:[{crit:true,cmp:'con'},{crit:false,cmp:''},{crit:false,cmp:''},{crit:false,cmp:'con'}],
      obs:[{date:'2026-09-29',type:'Unannounced'},{date:'2026-10-02',type:'Announced'},{date:'2026-10-09',type:'Unannounced'},{date:'2026-10-14',type:'Unannounced'}],
      cells:{'0_0':'C','1_0':'C','2_0':'EO','3_0':'EC','0_1':'C','1_1':'C','2_1':'C','3_1':'C','0_2':'C','1_2':'C','2_2':'C','3_2':'C','0_3':'C','1_3':'C','2_3':'C','3_3':'EO'},opp:{},meta:{int:'Paula Brennan (simulated)'}}};
    const x=tiRead(TI,'','');const ok1=await tiApply(x,'file','ti.json');
    return {ok1,obs:x.obsAll,rows:S.rows.map(r=>({i:r.i,cc:r.cc})),msg:document.getElementById('tiMsg').textContent,fid:document.getElementById('fidTbl').textContent};});
  ok('10 F326 Import From TI-1 places each dated observation in the period row whose dates hold it: period 1 mean 75% with 25% commission on consequence steps, period 2 mean 87.5%, baseline untouched',
    t2.ok1&&t2.obs.length===4&&t2.rows[0].i===''&&t2.rows[1].i==='75'&&t2.rows[1].cc==='25'&&t2.rows[2].i==='87.5'&&t2.rows[2].cc==='0'&&/4 cells of the period rows filled from 4 dated observations\./.test(t2.msg)&&!/No period holds an integrity figure yet/.test(t2.fid),t2);
  const t3=await p.evaluate(async()=>{S.rows[1].i='70';S.rows[1].cc='';nbhUI.confirm=async()=>false;S.meta.intPct='';const x={conSteps:2,obsAll:[{date:'2026-09-29',pct:75,c:1,ec:1,eo:0},{date:'2026-10-02',pct:100,c:2,ec:0,eo:0},{date:'2026-10-09',pct:100,c:2,ec:0,eo:0}]};
    const msg=await prTiPeriods(x);nbhUI.confirm=async()=>true;return {msg,rows:S.rows.map(r=>({i:r.i,cc:r.cc}))};});
  ok('11 F326 a figure already in a period row is replaced only when the BCBA says so: Cancel keeps it and fills only what was empty',
    t3.rows[1].i==='70'&&t3.rows[1].cc==='25'&&t3.rows[2].i==='87.5'&&/1 cell of the period rows filled from 3 dated observations; the figures already there were kept\./.test(t3.msg),t3);
  const t4=await p.evaluate(async()=>{const d=S.dd;delete S.dd;const msg=await prTiPeriods({conSteps:0,obsAll:[{date:'2026-09-29',pct:75,c:0,ec:0,eo:0}]});S.dd=d;return msg;});
  ok('12 F326 with no dated period rows the import says how to date them and leaves the column alone',/The period rows carry no dates yet \(Fill question 2 from DD-1 dates them\)/.test(t4),t4);
  /* ---- the log keeps its fields in the order Open rebuilds them ---- */
  const lg=await p.evaluate(()=>{S.meta.dec='Continue unchanged';S.meta.date='2026-10-17';S.meta.team='Dana Whitfield (simulated)';S.meta.pFrom='2026-09-25';S.meta.pTo='2026-10-16';const e=prLogEntry();
    const back=prLogFromFile(JSON.parse(JSON.stringify([e])))[0];return {same:JSON.stringify(e)===JSON.stringify(back),keys:Object.keys(e)};});
  ok('13 a closed review’s log entry reads back field for field (the same order as Open rebuilds it)',lg.same&&lg.keys[0]==='date'&&lg.keys[1]==='period',lg);
  ok('14 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
