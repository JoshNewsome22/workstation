/* the one-file edition carries the picture library once, and SM-1 and VS-1 find it (v21.42; pass or fail, from the
   repository's deliver/NBH-Workstation.html, since v22.12, review F505) */
const path=require('path');const {chromium,sleep,ROOT}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage();const log=[];page.on('pageerror',e=>log.push(String(e.message)));page.on('console',m=>{if(m.type()==='error')log.push(m.text().slice(0,200));});
 await page.goto('file://'+path.join(ROOT||path.join(__dirname,'..'),'deliver','NBH-Workstation.html'));await sleep(1500);
 await page.evaluate(()=>EMBED.ready);const chars=await page.evaluate(()=>EMBED.pictos.length);
 ok('1 the one-file edition carries the picture library',chars>100000,{chars});
 for(const id of ['SM-1','VS-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000}).catch(()=>{});await sleep(800);
  const frs=page.frames().filter(f=>f!==page.mainFrame());const f=frs[frs.length-1];
  const r=await f.evaluate(()=>({n:Object.keys(window.NBH_PICTOS||{}).length,missing:!!window.NBH_PICTOS_MISSING,caseBtn:!!document.querySelector('#nbhCaseBtn')}));
  ok('2 '+id+' opens inside it and finds the pictures',await page.evaluate(i=>!!state.status[i],id)&&r.n>50&&!r.missing&&r.caseBtn,r);}
 const d=await page.evaluate(()=>{$('#diag').click();const c=document.querySelector('#diagPic');const t=c&&c.textContent;$('#dlg').close();return t;});
 ok('3 Diagnostics has the pictures row',!!d,d);
 ok('4 no page errors',!log.length,log);
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
