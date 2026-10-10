/* v21.78 the shell: Today reads the restraint notices, injuries, the review's rules against the data, the timelines and the
   home sheets; the hand-over check adds the open notices; the transition summary; the case bar on an iPad (sprint-a8 bars).
   Simulated student only (Mateo Rivera). usage: node qa/v2178-shell-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
(async()=>{const br=await chromium.launch();const page=await (await br.newContext({viewport:{width:1300,height:900}})).newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const F={src:{},consent:{date:iso(-50)},behaviors:[{label:'Elopement',def:'Leaving the area'},{label:'Asking for a break',isRep:true}],plan:{rep:'Asking for a break',ant:['First-then card'],respond:{prec:'Offer the break card',not:'Argue'}},
    data:{from:iso(-40),to:iso(-1),days:28,conds:[{name:'Baseline',from:iso(-40),to:iso(-30)},{name:'Intervention',from:iso(-29),to:iso(-1)}],
      behaviors:[{name:'Elopement',kind:'target',unit:'a day',base:{days:6,mean:4},baseName:'Baseline',cur:{days:18,mean:3.8},curName:'Intervention'},{name:'Asking for a break',kind:'replacement',base:{days:6,mean:0.5},cur:{days:18,mean:6}}],incidentList:[]},
    integrity:{obs:[{date:iso(-3),pct:94,n:20}],criterion:90},
    crisis:{stages:[{s:'Escalation',do:'Clear the area'}],deadlines:[{what:'24-hour report to the district',due:iso(-1),done:false,event:iso(-2)},{what:'Parent told the same day',due:iso(-2),done:true,event:iso(-2)}],restraints:{semester:2,last:iso(-2)}},
    injury:{last:iso(-4),count30:1,open:[{what:'Nurse follow-up on the bruise',due:iso(1),done:false}]},
    review:{date:iso(-60),next:iso(3),decision:'continue',rules:{minDays:10,improvePct:20},exit:{}},
    records:{removals:{days:9,list:[],at10:false},iep:iso(20),reeval:iso(200)},
    home:{sheets:[{name:'Week of the 5th',sent:iso(-9),due:iso(-2),back:''}]},
    evidence:{'OB-1':{form:'OB-1',method:'Direct observation',dates:'two weeks',fn:'Escape from demands',strength:'Moderate'}}};
  const t=await page.evaluate(F=>{state.facts=F;const L=todayItems();return L.map(x=>x.k+'|'+x.t.replace(/<[^>]+>/g,'')+'|'+(x.open||''));},F);
  const has=(re,open)=>t.some(x=>re.test(x)&&(!open||x.endsWith('|'+open)));
  ok('Today: the overdue 24-hour report first, the done parent notice not listed, two restraints this semester',/^Overdue\|24-hour report to the district/.test(t[0])&&!has(/Parent told/)&&has(/2 restraints this semester/,'CR-1'),t);
  ok('Today: the open injury follow-up',has(/^Injury\|Nurse follow-up on the bruise \(due .*in 1 day\)/,'IM-1'),t);
  ok('Today: Elopement 18 days in and about where it was, integrity 94%: review the plan; the replacement (up a lot) not flagged',has(/^Decision\|Elopement: 18 days into Intervention, about where it was before the plan \(\+5%\); Form PR-1 counts 20% as progress, with integrity at 94%: review the plan/,'PR-1')&&!has(/Asking for a break: \d+ days/),t);
  ok('Today: the FBA due 60 days from consent (no function yet), the review in 3 days, the IEP in 20 days, 9 removal days',has(/^Timeline\|The FBA is due .*60 days from consent .*in 10 days/,'FS-1')&&has(/plan review \(Form PR-1\) is due .*in 3 days/,'PR-1')&&has(/annual IEP review is .*in 20 days/,'GB-1')&&has(/9 days of removal this year: at ten/,'RR-1')&&!has(/reevaluation/),t);
  ok('Today: the home sheet not back',has(/^Home\|1 home sheet not back: Week of the 5th/,'HD-1'),t);
  const low=await page.evaluate(F=>{F=JSON.parse(JSON.stringify(F));F.integrity.obs[0].pct=70;state.facts=F;return todayItems().filter(x=>x.k==='Decision').map(x=>x.t+'|'+x.open);},F);
  ok('Today: integrity under the criterion: retrain first (TI-1), not the plan',low.length===1&&/the last integrity check was 70%: retrain first/.test(low[0])&&/\|TI-1$/.test(low[0]),low);
  const h=await page.evaluate(F=>{state.facts=F;return handoverItems().map(x=>x.t.replace(/<[^>]+>/g,''));},F);
  ok('the hand-over check: the restraint notice not done, and the home sheet',h.some(x=>/restraint or seclusion notice not done: 24-hour report/.test(x))&&h.some(x=>/home sheet not back/.test(x)),h);
  const s=await page.evaluate(F=>{state.facts=F;document.getElementById('pClient').value='Mateo Rivera';document.getElementById('pBcba').value='Sample BCBA';return tdSummaryHTML();},F);
  ok('the transition summary: the student, the targets, the evidence, the plan, where things stand, what worked, the open deadlines, the contacts',/Transition Summary/.test(s)&&/Mateo Rivera/.test(s)&&/Elopement<\/b>: Leaving the area/.test(s)&&/OB-1<\/b> Direct observation/.test(s)&&/Replacement: Asking for a break/.test(s)&&/Progress: Asking for a break/.test(s)&&/Not yet: Elopement/.test(s)&&/24-hour report/.test(s)&&/Case BCBA: Sample BCBA/.test(s),s.slice(0,400));
  const d=await page.evaluate(async F=>{state.facts=F;await handoverOpen();return !!document.querySelector('#dlgBody #tdSum');},F);
  ok('the hand-over dialog offers the transition summary',d);
  ok('no errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
