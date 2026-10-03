const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/pd1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/PD-1_Performance-Diagnostic-Checklist_v2026-09.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(400);await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};});   /* v21.34: the forms ask through nbhUI.confirm, which honours a stubbed window.confirm; a long alert would open the styled notice, which stays open until closed */await page.click('#viewSeg button[data-view="items"]');await sleep(200);
  const views=['setup','items','obs','score','plan','guide'];
  // blank state: skip rules
  await page.click('.yn[data-i="R2"] button[data-v="NA"]');
  const locked=await page.$$eval('.yn[data-i="R3"] button,.yn[data-i="R4"] button,.yn[data-i="R5"] button',b=>b.map(x=>x.disabled+':'+x.getAttribute('aria-pressed')+':'+x.dataset.v));
  console.log('R2=NA locks:',locked.join(' '));
  await page.click('.yn[data-i="R2"] button[data-v="N"]');
  const unlocked=await page.$$eval('.yn[data-i="R3"] button',b=>b.map(x=>x.disabled+':'+x.getAttribute('aria-pressed')));
  console.log('R2=N unlocks:',unlocked.join(' '),'fu-R2 on:',await page.$eval('tr[data-fu="R2"]',e=>e.classList.contains('on')));
  await page.click('.yn[data-i="R6"] button[data-v="Y"]');
  console.log('R6=Y -> R7:',await page.$eval('.yn[data-i="R7"] button[data-v="NA"]',b=>b.getAttribute('aria-pressed')+' disabled='+b.disabled));
  await page.click('.yn[data-i="T1"] button[data-v="Y"]');
  console.log('T1=Y shows sub-items:',await page.$eval('tr[data-fu="T1"]',e=>e.classList.contains('on')));
  await page.click('.yn[data-i="T1"] button[data-v="N"]');
  console.log('T1=N hides sub-items:',!(await page.$eval('tr[data-fu="T1"]',e=>e.classList.contains('on'))));
  console.log('progress:',await page.$eval('#progTxt',e=>e.textContent));
  // simulation
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);
  console.log('score verdict:',await page.$eval('#scoreVerdict',e=>e.textContent.slice(0,260)));
  console.log('score rows:',await page.$$eval('#scoreTbl tbody tr',r=>r.map(x=>Array.from(x.cells).map(c=>c.textContent.trim()).join('|'))));
  console.log('flags:',await page.$eval('#flagList',e=>e.textContent.trim().slice(0,400)));
  console.log('plan rows:',await page.$$eval('#planTbl tbody tr',r=>r.length), await page.$$eval('#planTbl tbody tr',r=>r.slice(0,3).map(x=>x.cells[1].textContent+' '+x.cells[2].textContent+' '+x.cells[3].textContent.slice(0,40))));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  // round trip
  let saved=null;
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  saved=await page.evaluate(()=>window.__saved);
  const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared progress:',await page.$eval('#progTxt',e=>e.textContent));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);
  await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));
  console.log('round trip identical:',before===after,'bytes',saved.length);
  console.log('after reopen, select R2 checked:',await page.$eval('[data-sel="R2"]',e=>e.checked),'how R2:',await page.$eval('[data-how="R2"]',e=>e.value.slice(0,30)),'sv:',await page.$eval('[data-m="sv_sup_goal"]',e=>e.value),'chk override:',await page.$eval('[data-c="override"]',e=>e.checked));
  // wrong file
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"CF-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.$eval('#progTxt',e=>e.textContent));
  // CSV
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length, csv.split('\n')[1].slice(0,80));
  // print
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${OUT}/sim.pdf`,format:'Letter',printBackground:true});
  console.log('pdf ok');
  await page.emulateMedia({media:'screen'});
  // phone
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of ['setup','items','score','plan']){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);
    const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
    await page.screenshot({path:`${OUT}/phone-${v}.png`,fullPage:true});console.log('phone',v,'scroll/client',sw.join('/'));}
  console.log('LOG:',JSON.stringify(log,null,0));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
