const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/sv1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/SV-1_Social-Validity_v2026-09.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(400);await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};});   /* v21.34: the forms ask through nbhUI.confirm, which honours a stubbed window.confirm; a long alert would open the styled notice, which stays open until closed */
  const views=['setup','goals','proc','eff','sum','guide'];
  // blank state
  console.log('blank progress:',await page.$eval('#progTxt',e=>e.textContent));
  console.log('blank respondents:',await page.$$eval('#rTbl tbody tr',r=>r.length),'grid cols:',await page.$$eval('#gTbl_pre thead th',t=>t.length));
  await page.screenshot({path:`${OUT}/blank-setup.png`,fullPage:true});
  // role drives which items apply: a student row gets G6 only
  await page.selectOption('[data-ri="0"][data-f="role"]','Student');await sleep(150);
  const stu=await page.$$eval('#gTbl_pre tbody tr',rows=>rows.map(r=>r.cells[0].textContent+':'+(r.cells[2].querySelector('select')?'sel':'na')));
  console.log('student col:',stu.join(' '));
  console.log('cf inputs disabled for student:',await page.$eval('[data-ri="0"][data-f="cf1"]',e=>e.disabled));
  await page.selectOption('[data-ri="1"][data-f="role"]','Administrator');await sleep(150);
  console.log('admin P8 enabled:',await page.$eval('#pTbl_pre tbody tr:last-child td:nth-child(4)',td=>!!td.querySelector('select')),'teacher P8:',await page.$eval('#pTbl_pre tbody tr:last-child td:nth-child(5)',td=>!!td.querySelector('select')));
  // rate one item and see the mean, the class and the progress
  await page.click('#viewSeg button[data-view="goals"]');await sleep(150);
  await page.selectOption('select[data-k="G6_0"][data-r="pre"]','2');await sleep(150);
  console.log('G6 after rating 2: class',await page.$eval('select[data-k="G6_0"][data-r="pre"]',e=>e.className),'row flagged',await page.$eval('select[data-k="G6_0"][data-r="pre"]',e=>e.closest('tr').classList.contains('flag')),'mean',await page.$eval('select[data-k="G6_0"][data-r="pre"]',e=>e.closest('tr').querySelector('td.m').textContent));
  console.log('progress:',await page.$eval('#progTxt',e=>e.textContent));
  await page.click('#gRound button[data-r="post"]');await sleep(100);
  console.log('round post on:',await page.$eval('.rnd[data-sec="G"][data-r="post"]',e=>e.classList.contains('on')),'pre hidden:',!(await page.$eval('.rnd[data-sec="G"][data-r="pre"]',e=>e.classList.contains('on'))),'P follows:',await page.$eval('#pRound button[data-r="post"]',b=>b.getAttribute('aria-pressed')));
  await page.screenshot({path:`${OUT}/blank-goals.png`,fullPage:true});
  await page.click('#viewSeg button[data-view="sum"]');await sleep(150);
  console.log('blank-ish verdict:',await page.$eval('#sumVerdict',e=>e.textContent.slice(0,160)));
  // threshold in the toolbar
  const setThr=v=>page.evaluate(v=>{const t=document.querySelector('#thrIn');t.value=v;t.dispatchEvent(new Event('change',{bubbles:true}));},v);
  await setThr('1');await sleep(150);
  console.log('thr=1 flagged rows:',await page.$$eval('#flagTbl tbody tr',r=>r.length));
  await setThr('3');await sleep(150);console.log('thr back to 3 flagged rows:',await page.$$eval('#flagTbl tbody tr',r=>r.length));
  // simulation
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  console.log('view after sim:',await page.evaluate(()=>document.body.className));
  console.log('sim verdict:',await page.$eval('#sumVerdict',e=>e.textContent.slice(0,300)));
  console.log('cond note:',await page.$eval('#condNote',e=>e.textContent.trim().slice(0,160)));
  console.log('metrics:',await page.$$eval('#secMetrics .metric',m=>m.map(x=>x.querySelector('b').textContent+'='+x.querySelector('.val').textContent)));
  console.log('role rows:',await page.$$eval('#roleTbl tbody tr',r=>r.map(x=>Array.from(x.cells).map(c=>c.textContent.trim().replace(/\s+/g,' ')).join('|'))));
  console.log('cmp rows:',await page.$$eval('#cmpTbl tbody tr',r=>r.length),await page.$$eval('#cmpTbl tbody tr',r=>r.slice(0,2).map(x=>Array.from(x.cells).map(c=>c.textContent.trim()).join('|'))));
  console.log('flag rows:',await page.$$eval('#flagTbl tbody tr',r=>r.map(x=>Array.from(x.cells).map(c=>c.textContent.trim()).join('|'))));
  console.log('split rows:',await page.$$eval('#splitTbl tbody tr',r=>r.map(x=>Array.from(x.cells).map(c=>c.textContent.trim()).join('|'))));
  console.log('concord:',await page.$eval('#concord',e=>e.textContent.trim().slice(0,400)));
  console.log('cf rows:',await page.$$eval('#cfTbl tbody tr',r=>r.map(x=>Array.from(x.cells).map(c=>c.textContent.trim()).join('|'))));
  console.log('checks:',await page.$eval('#flagList',e=>e.textContent.trim().slice(0,900)));
  console.log('feedFs:',await page.$eval('#feedFs',e=>e.textContent.slice(0,300)));
  console.log('feedPr:',await page.$eval('#feedPr',e=>e.textContent.slice(0,400)));
  console.log('progress:',await page.$eval('#progTxt',e=>e.textContent));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  // the pre round of goals and procedures, for the screenshots
  await page.click('#viewSeg button[data-view="goals"]');await page.click('#gRound button[data-r="pre"]');await sleep(200);await page.screenshot({path:`${OUT}/sim-goals-pre.png`,fullPage:true});
  await page.click('#viewSeg button[data-view="proc"]');await sleep(200);await page.screenshot({path:`${OUT}/sim-proc-pre.png`,fullPage:true});
  await page.click('#pRound button[data-r="post"]');
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
  console.log('round trip identical:',before===after,'bytes',saved.length,'form',JSON.parse(saved).form);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,200),'VS',JSON.stringify(b[k]).slice(0,200));}
  console.log('after reopen: resp 3 role',await page.$eval('[data-ri="3"][data-f="role"]',e=>e.value),'E5_2',await page.$eval('select[data-k="E5_2"]',e=>e.value),'open Eo_2',await page.$eval('textarea[data-o="Eo_2"][data-r="post"]',e=>e.value.slice(0,30)),'chk prior',await page.$eval('[data-c="prior_agree"]',e=>e.checked),'pr_change',await page.$eval('[data-m="pr_change"]',e=>e.value),'round',await page.evaluate(()=>S.round));
  // wrong file
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"CF-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.$eval('#progTxt',e=>e.textContent));
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['not json'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after bad json:',await page.$eval('#progTxt',e=>e.textContent));
  // CSV
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length, csv.split('\n')[0].slice(0,80),'|',csv.split('\n')[1].slice(0,120));
  // print
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${OUT}/sim.pdf`,format:'Letter',printBackground:true});
  console.log('pdf ok');
  await page.emulateMedia({media:'screen'});
  // phone
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(250);
    const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
    await page.screenshot({path:`${OUT}/phone-${v}.png`,fullPage:true});console.log('phone',v,'scroll/client',sw.join('/'));}
  console.log('LOG:',JSON.stringify(log,null,0));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
