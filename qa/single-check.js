/* both one-file editions open with all 47 forms, and PD-1, SV-1 and TD-1 open inside them with their page bar (pass or fail since
   v22.12, review F505) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const bad=[];
(async()=>{const br=await chromium.launch();
 for(const ed of ['NBH','RPS']){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(BASE+'/deliver/'+ed+'-Workstation.html');await sleep(1200);
  const n=await page.evaluate(()=>typeof FORMS!=='undefined'?FORMS.flatMap(g=>g[1]).length:-1);
  for(const id of ['PD-1','SV-1','TD-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000}).catch(()=>{});await sleep(800);
    const fr=page.frames().find(f=>f!==page.mainFrame()&&f.url());const ok=await page.evaluate(i=>!!state.status[i],id);
    const bar=fr?await fr.$('.nbh-pagenav').catch(()=>null):null;console.log(ed,id,'status',ok,'bar',!!bar);if(!ok||!bar)bad.push(ed+' '+id+': status '+ok+', bar '+!!bar);}
  console.log(ed,'forms',n,'title',await page.title(),'LOG',JSON.stringify(log).slice(0,300));if(n!==47)bad.push(ed+': '+n+' forms');if(log.length)bad.push(ed+': '+JSON.stringify(log).slice(0,200));await page.close();}
 console.log((bad.length?'FAIL ':'PASS ')+'both one-file editions open with 47 forms; PD-1, SV-1 and TD-1 open inside them with their page bar'+(bad.length?'  '+JSON.stringify(bad):''));
 console.log(bad.length?'RESULT: 1 failed':'RESULT: all passed');process.exitCode=bad.length?1:0;
 await br.close();})();
