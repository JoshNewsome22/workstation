const {chromium,sleep}=require('./lib');
(async()=>{const br=await chromium.launch();const page=await br.newPage();const log=[];page.on('pageerror',e=>log.push(String(e.message)));page.on('console',m=>{if(m.type()==='error')log.push(m.text().slice(0,200));});
 await page.goto('file://'+require('path').resolve(__dirname,'../deliver/NBH-Workstation.html')+'');await sleep(1500);
 await page.evaluate(()=>EMBED.ready);console.log('pictos block chars',await page.evaluate(()=>EMBED.pictos.length));
 for(const id of ['SM-1','VS-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000}).catch(()=>{});await sleep(800);
  const fr=page.frames().find(f=>f!==page.mainFrame()&&f.name()!==''||f.url().startsWith('about:srcdoc'));
  const frs=page.frames().filter(f=>f!==page.mainFrame());const f=frs[frs.length-1];
  console.log(id,'status',await page.evaluate(i=>!!state.status[i],id),'pictos',await f.evaluate(()=>({n:Object.keys(window.NBH_PICTOS||{}).length,missing:!!window.NBH_PICTOS_MISSING,caseBtn:!!document.querySelector('#nbhCaseBtn')})));}
 console.log('diag pic row:',await page.evaluate(()=>{$('#diag').click();const c=document.querySelector('#diagPic');const t=c&&c.textContent;$('#dlg').close();return t;}));
 console.log('LOG',JSON.stringify(log).slice(0,400));await br.close();})();
