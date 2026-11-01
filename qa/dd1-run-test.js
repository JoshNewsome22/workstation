/* v25.64 DD-1's criterion: the decision line's "longest run" is the longest stretch of days at the aim in the current
   phase (it read a field critInfo never returned, so it always printed 0; found by the article review of the data forms).
   usage: node qa/dd1-run-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(800);
  const r=await p.evaluate(()=>{const day=(i,y)=>({date:'2026-10-'+String(i+1).padStart(2,'0'),y});
    /* decrease to 1 or less, 3 days needed: runs of 2, then 1, then the current phase ends on a day above the aim */
    const ys=[3,1,0,4,1,5,2];const a={n:ys.length,pts:ys.map((y,i)=>day(i,y))};
    const beh={aim:'1',direction:'decrease',critDays:'3'};const ci=critInfo(a,beh);
    const ys2=[1,1,1,0,3];const ci2=critInfo({n:5,pts:ys2.map((y,i)=>day(i,y))},beh);
    return {ci,ci2};});
  ok('a run of 2 days at the aim, then 1, then a day above: longest run 2, the current run 0, not met',r.ci.longestRun===2&&r.ci.currentRun===0&&!r.ci.metDate&&r.ci.count===3,r.ci);
  ok('four days at the aim then one above: longest run 4, met on the third day',r.ci2.longestRun===4&&r.ci2.metDate==='2026-10-03',r.ci2);
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
