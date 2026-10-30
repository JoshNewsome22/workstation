/* both one-file editions open with all 47 forms, and PD-1, SV-1, TD-1 and GB-1 open inside them with their page bar (pass or fail
   since v22.12, review F505); TD-1 and GB-1 open with their banks, which are files of their own beside the forms (v23.86, v25.18) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const bad=[];
(async()=>{const br=await chromium.launch();
 for(const ed of ['NBH','RPS']){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(BASE+'/deliver/'+ed+'-Workstation.html');await sleep(1200);
  const n=await page.evaluate(()=>typeof FORMS!=='undefined'?FORMS.flatMap(g=>g[1]).length:-1);
  for(const id of ['PD-1','SV-1','TD-1','GB-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000}).catch(()=>{});await sleep(800);
    const fr=page.frames().find(f=>f!==page.mainFrame()&&f.url());const ok=await page.evaluate(i=>!!state.status[i],id);
    const bar=fr?await fr.$('.nbh-pagenav').catch(()=>null):null;console.log(ed,id,'status',ok,'bar',!!bar);if(!ok||!bar)bad.push(ed+' '+id+': status '+ok+', bar '+!!bar);
    const bank=fr&&{'TD-1':'typeof TD1_BANK!=="undefined"?TD1_BANK.protocols.length:-1','GB-1':'typeof GB1_BANK!=="undefined"?GB1_BANK.entries.length:-1'}[id];
    const bf=page.frames().filter(f=>f!==page.mainFrame());let nb=-1;
    if(bank)for(const f of bf){const v=await f.evaluate(bank).catch(()=>-2);if(v>nb)nb=v;}
    if(bank){console.log(ed,id,'bank',nb);if(!(nb>0))bad.push(ed+' '+id+': bank '+nb);}}
  console.log(ed,'forms',n,'title',await page.title(),'LOG',JSON.stringify(log).slice(0,300));if(n!==47)bad.push(ed+': '+n+' forms');if(log.length)bad.push(ed+': '+JSON.stringify(log).slice(0,200));await page.close();}
 console.log((bad.length?'FAIL ':'PASS ')+'both one-file editions open with 47 forms; PD-1, SV-1, TD-1 and GB-1 open inside them with their page bar, TD-1 and GB-1 with their banks'+(bad.length?'  '+JSON.stringify(bad):''));
 console.log(bad.length?'RESULT: 1 failed':'RESULT: all passed');process.exitCode=bad.length?1:0;
 await br.close();})();
