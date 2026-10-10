/* v21.78 in the workstation, end to end: Form OB-1 and EA-1 simulated, Form FS-1 open: the shell gathers their results
   (evidence) and FS-1's evidence table takes a row for each; Today reads the case without error.
   Simulated students only. usage: node qa/v2178-flow-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await (await br.newContext({viewport:{width:1366,height:1000}})).newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);await page.evaluate(()=>{wsUI.confirm=async()=>true;});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000}).catch(()=>{});await sleep(1200);
    const file=await page.evaluate(id=>ALL.find(x=>x[0]===id)[2],id);return page.frames().find(f=>f.url().includes(file));};
  for(const id of ['OB-1','EA-1']){const fr=await open(id);await fr.evaluate(async()=>{try{nbhUI.confirm=async()=>true;}catch(e){}const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(1500);}
  const fs=await open('FS-1');
  await page.evaluate(async()=>{await gatherFacts(true);});await sleep(2500);
  const ev=await page.evaluate(()=>state.facts&&state.facts.evidence?Object.keys(state.facts.evidence):[]);
  ok('the shell gathers the evidence of OB-1 and EA-1',ev.includes('OB-1')&&ev.includes('EA-1'),ev);
  const rows=await fs.evaluate(()=>JSON.stringify(typeof S!=='undefined'?S:{}).match(/OB-1|EA-1/g)||[]);
  ok('FS-1 takes a row for each (OB-1, EA-1) in its evidence',rows.includes('OB-1')&&rows.includes('EA-1'),rows.slice(0,6));
  const again=await (async()=>{await page.evaluate(async()=>{await gatherFacts(true);pushFactsToAll();});await sleep(2000);return fs.evaluate(()=>(JSON.stringify(S).match(/"form":"OB-1"/g)||[]).length);})();
  ok('a second push brings no second OB-1 row',again<=1,again);
  const t=await page.evaluate(()=>{try{return {n:todayItems().length,ok:true};}catch(e){return {ok:false,e:e.message};}});
  ok('Today reads the case without error',t.ok,t);
  ok('no errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
