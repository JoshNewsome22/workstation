/* v21.99 every target on the caseload cards: a student whose Form DD-1 tracks several targets shows the first reduction
   target with "1 of N" and a step button (44 px) that goes through the others, the skills last and marked; a sideways
   swipe across the trend does the same on the iPad; "Every target on each card" shows all of a student's targets at once
   on every card and is remembered on this device; a student with one target has no step button; a student kept before
   v21.99 gets its targets' trends the first time its card is shown. Simulated students only.
   usage: node qa/v2199-cards-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const UA_IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:820,height:1180},userAgent:UA_IPAD,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on','nbh.caseload.allt'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
    const days=(spec)=>Array.from({length:12},(_,i)=>{const vals={};Object.keys(spec).forEach(k=>{vals[k]=spec[k][i];});return {date:iso(i-14),vals};});
    const now=Date.now();
    const mk=(p,facts,old)=>{const sum={items:[],lastData:facts.data?facts.data.byDay.slice(-1)[0].date:'',forms:1,trend:clTrendOf(facts)};if(!old)sum.trends=clTrendsOf(facts);
      return {key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved:new Date(now-864e5).toISOString(),sum,
        text:JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date(now-864e5).toISOString(),packet:p,forms:{'DD-1':{title:'Daily Data',snap:{total:1,data:{},own:''}}},facts})};};
    const many=days({'Physical aggression':[9,8,8,7,6,6,5,4,4,3,2,2],'Elopement':[3,3,2,2,2,1,1,1,0,1,0,0],'Mand for break':[0,1,1,2,3,3,4,5,5,6,7,8]});
    const fA={src:{data:'DD-1'},data:{byDay:many,behaviors:[{name:'Mand for break',kind:'replacement',unit:'occurrences'},{name:'Physical aggression',kind:'target',unit:'occurrences'},{name:'Elopement',kind:'target',unit:'occurrences'}]}};
    const one=days({'Elopement':[4,4,3,3,3,2,2,2,1,1,1,0]});
    const fB={src:{data:'DD-1'},data:{byDay:one,behaviors:[{name:'Elopement',kind:'target',unit:'occurrences'}]}};
    const A=mk({client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School',grade:'5'},fA,false);
    const B=mk({client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},fB,false);
    const C=mk({client:'SIMULATED – Sample Student 2',sid:'SIM-0003',site:'Sample Middle',grade:'7'},fA,true);   /* kept before v21.99: one trend, no trends */
    await clTx('readwrite',st=>{st.put(A);st.put(B);st.put(C);});});
  await page.evaluate(()=>caseloadOpen());await sleep(1200);
  const card=(name)=>page.evaluate(n=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.getAttribute('aria-label')===n);if(!c)return null;
    const tw=c.querySelector('.cl-tw'),st=c.querySelector('.cl-step'),r=st&&st.getBoundingClientRect();
    return {names:[...tw.querySelectorAll('.cl-tt b')].map(b=>b.textContent),n:(tw.querySelector('.cl-n')||{}).textContent||'',skill:!!tw.querySelector('.cl-up'),trends:tw.querySelectorAll('.cl-trend').length,
      step:st?[Math.round(r.width),Math.round(r.height)]:null,pts:(tw.querySelector('.cl-spark')||{dataset:{}}).dataset.pts||''};},name);
  const a0=await card('Mateo Rivera');
  ok('1 a student with three targets: the first reduction target shows, with "1 of 3" and a 44 px step button',!!a0&&a0.names[0]==='Physical aggression'&&a0.n==='1 of 3'&&!!a0.step&&a0.step[0]>=44&&a0.step[1]>=44&&a0.pts==='9 8 8 7 6 6 5 4 4 3 2 2',a0);
  const tap=()=>page.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.getAttribute('aria-label')==='Mateo Rivera');c.querySelector('.cl-step').click();});
  await tap();const a1=await card('Mateo Rivera');await tap();const a2=await card('Mateo Rivera');await tap();const a3=await card('Mateo Rivera');
  ok('2 the step button goes to the second reduction target, then the skill (marked), then back to the first',a1.names[0]==='Elopement'&&a1.n==='2 of 3'&&!a1.skill&&a2.names[0]==='Mand for break'&&a2.n==='3 of 3'&&a2.skill&&a3.names[0]==='Physical aggression',{a1,a2,a3});
  /* a sideways swipe across the trend, as a finger on the iPad */
  const swipe=dx=>page.evaluate(dx=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.getAttribute('aria-label')==='Mateo Rivera'),el=c.querySelector('.cl-trend'),r=el.getBoundingClientRect();
    const x0=r.left+r.width/2,y0=r.top+r.height/2,T=(x)=>new Touch({identifier:1,target:el,clientX:x,clientY:y0});
    el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[T(x0)],changedTouches:[T(x0)]}));
    el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[T(x0+dx)]}));},dx);
  await swipe(-90);const s1=await card('Mateo Rivera');await swipe(90);const s2=await card('Mateo Rivera');await swipe(90);const s3=await card('Mateo Rivera');await swipe(15);const s4=await card('Mateo Rivera');
  ok('3 a swipe left shows the next target, a swipe right the one before (round to the last), a small movement nothing',s1.names[0]==='Elopement'&&s2.names[0]==='Physical aggression'&&s3.names[0]==='Mand for break'&&s4.names[0]==='Mand for break',{s1:s1.names,s2:s2.names,s3:s3.names,s4:s4.names});
  const b0=await card('Sample Student');
  ok('4 a student with one target: the trend alone, no step button and no count',!!b0&&b0.names.join()==='Elopement'&&!b0.step&&b0.n==='',b0);
  const c0=await card('Sample Student 2');await sleep(1500);const c1=await card('Sample Student 2');
  const cRec=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='SIMULATED – Sample Student 2');return r&&r.sum&&r.sum.trends?r.sum.trends.map(t=>t.name):null;});
  ok('5 a student kept before v21.99 gets every target the first time its card is shown, kept with the student',!!c1&&c1.n==='1 of 3'&&!!cRec&&cRec.join()==='Physical aggression,Elopement,Mand for break',{c0,c1,cRec});
  /* Every target on each card */
  const hasSwitch=await page.evaluate(()=>!!document.querySelector('#dlgBody [data-clallt]'));
  await page.evaluate(()=>{const x=document.querySelector('#dlgBody [data-clallt]');x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const e1=await card('Mateo Rivera'),e2=await card('Sample Student');
  ok('6 "Every target on each card": the three targets stacked on the student\'s card, each with its own line; the one-target card unchanged',hasSwitch&&e1.trends===3&&e1.names.join()==='Physical aggression,Elopement,Mand for break'&&!e1.step&&e2.trends===1,{hasSwitch,e1,e2});
  await page.evaluate(async()=>{try{document.getElementById('dlg').close();}catch(e){}caseloadOpen();});await sleep(1000);
  const e3=await card('Mateo Rivera'),kept=await page.evaluate(()=>({ls:localStorage.getItem('nbh.caseload.allt'),box:!!(document.querySelector('#dlgBody [data-clallt]')||{}).checked}));
  ok('7 the choice is remembered on this device: Caseload opened again shows every target, the switch ticked',e3.trends===3&&kept.ls==='1'&&kept.box,{e3,kept});
  await page.evaluate(()=>{const x=document.querySelector('#dlgBody [data-clallt]');x.checked=false;x.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const e4=await card('Mateo Rivera');
  ok('8 unticked: one target again, with its step button',e4.trends===1&&!!e4.step,e4);
  const lay=await page.evaluate(()=>{const b=document.getElementById('dlgBody');return {box:b.scrollWidth-b.clientWidth,page:document.documentElement.scrollWidth-innerWidth,over:[...b.querySelectorAll('.cl-card')].filter(c=>c.scrollWidth>c.clientWidth+1).length};});
  ok('9 the iPad held upright: no sideways scrolling, no card wider than its column',lay.box<=0&&lay.page<=0&&lay.over===0,lay);
  /* 11 (v22.01) each target's level and trend in words under the graph: the mean of the last 5 days, the change over the last 10 */
  const lv=await page.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.getAttribute('aria-label')==='Mateo Rivera');return [...c.querySelectorAll('.cl-lv li')].map(li=>li.textContent);});
  ok('11 the card lists every target with its level and trend: aggression now 3 and falling (improving), elopement now 0.4 and falling (improving), the skill now 6.2 and rising (improving)',
    lv.length===3&&/^Physical aggression now 3 occurrences \(last 5 days\) · falling, improving$/.test(lv[0])&&/^Elopement now 0\.4 occurrences \(last 5 days\) · falling, improving$/.test(lv[1])&&/^Mand for break now 6\.2 occurrences \(last 5 days\) · rising, improving$/.test(lv[2]),lv);
  const lt=await page.evaluate(()=>[clLevelTrend({pts:[['a',2],['b',2],['c',2],['d',2.2],['e',1.9]],unit:'occurrences'}),clLevelTrend({pts:[['a',1],['b',3],['c',6]],up:false}),clLevelTrend({pts:[['a',5],['b',5]]}),clLevelTrend({pts:[['a',40],['b',60],['c',80]],unit:'% independent',up:true})]);
  ok('12 the rule: a small change reads steady, a rising problem behavior is worsening, two days are too few, a rising skill in percent is improving',
    lt[0].dir==='steady'&&lt[0].good===null&&lt[1].dir==='rising'&&lt[1].good===false&&lt[2].dir===''&&lt[3].dir==='rising'&&lt[3].good===true,lt);
  ok('10 no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
