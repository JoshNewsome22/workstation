const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();
 for(const ed of ['NBH','RPS']){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(BASE+'/deliver/'+ed+'-Workstation.html');await sleep(1200);
  const n=await page.evaluate(()=>typeof FORMS!=='undefined'?FORMS.flatMap(g=>g[1]).length:-1);
  for(const id of ['PD-1','SV-1','TD-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000}).catch(()=>{});await sleep(800);
    const fr=page.frames().find(f=>f!==page.mainFrame()&&f.url());const ok=await page.evaluate(i=>!!state.status[i],id);
    const bar=fr?await fr.$('.nbh-pagenav').catch(()=>null):null;console.log(ed,id,'status',ok,'bar',!!bar);}
  console.log(ed,'forms',n,'title',await page.title(),'LOG',JSON.stringify(log).slice(0,300));await page.close();}
 await br.close();})();
