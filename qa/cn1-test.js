const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/cn1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/CN-1_Consultation-Notes_v2026-10.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['note','log','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  console.log('after sim: notes',await page.evaluate(()=>S.notes.length),'cur',await page.evaluate(()=>cur));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* computed values */
  console.log('durations:',await page.evaluate(()=>S.notes.map(duration)),'toMin tests:',await page.evaluate(()=>[toMin('9:05 am'),toMin('2:30 pm'),toMin('14:30'),toMin('12:15 pm'),toMin('12:10 am'),toMin('x')]),'cross-noon no suffix:',await page.evaluate(()=>duration({start:'11:30',end:'1:15'})));
  console.log('note 1 rate/integ:',await page.evaluate(()=>{cur=0;renderNote();return JSON.stringify([rateCheck(note()),integCheck(note()),catSum(note())]);}));
  console.log('verdicts:',await page.$eval('#rateOut',e=>e.textContent.trim().slice(0,80)),'|',await page.$eval('#integOut',e=>e.textContent.trim().slice(0,60)),'|',await page.$eval('#timeOut',e=>e.textContent.trim().slice(0,90)));
  console.log('note verdict:',await page.$eval('#noteVerdict',e=>e.textContent.trim().slice(0,100)));
  await page.click('#viewSeg button[data-view="log"]');await sleep(200);
  console.log('log metrics:',await page.$eval('#logMetrics',e=>e.textContent.replace(/\s+/g,' ').slice(0,260)));
  console.log('hours table rows:',await page.$$eval('#hoursTbl tbody tr',r=>r.map(x=>x.textContent.replace(/\s+/g,' ').slice(0,110))));
  console.log('open steps:',await page.$$eval('#openTbl tbody tr',r=>r.length));
  await page.fill('#logSearch','art');await sleep(100);console.log('search "art":',await page.$eval('#logCount',e=>e.textContent));
  await page.fill('#logSearch','');await page.selectOption('#logType','Observation');await sleep(100);console.log('type Observation:',await page.$eval('#logCount',e=>e.textContent));await page.selectOption('#logType','');
  await page.click('#logTbl tbody tr[data-open="2"]');await sleep(150);console.log('clicked row 3 → view',await page.evaluate(()=>document.body.className.match(/view-\S+/)[0]),'cur',await page.evaluate(()=>cur));
  await page.screenshot({path:`${OUT}/sim-note-3.png`,fullPage:true});await (await page.$('#noteOut')).screenshot({path:`${OUT}/noteout-3.png`});
  /* add a step, tick it, change a time, see the duration move */
  await page.click('#addNx');await page.fill('#nxTbl tbody tr:last-child input[data-x="what"]','Test step');await page.fill('[data-n="end"]','10:30');await sleep(100);
  console.log('after end 10:30: dur field',await page.$eval('#durOut',e=>e.value),'steps',await page.evaluate(()=>note().next.length));
  await page.fill('[data-n="end"]','10:00');await page.click('#delNx');await sleep(100);
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();cur=0;renderAll();});
  console.log('cleared: notes',await page.evaluate(()=>S.notes.length),'client',await page.evaluate(()=>S.meta.client));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,160),'|',JSON.stringify(b[k]).slice(0,160));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"HD-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.notes.length),await page.evaluate(()=>S.meta.client));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'cols:',csv.split('\n')[0].split('","').length);
  /* prints: the whole form, then one note alone */
  await page.evaluate(()=>{cur=2;renderNote();});
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>{document.body.classList.add('cn-note-only');const st=document.createElement('style');st.id='cnNotePage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);});await page.pdf({path:`${OUT}/note-only.pdf`,printBackground:true,preferCSSPageSize:true});
  await page.evaluate(()=>{document.body.classList.remove('cn-note-only');document.querySelector('#cnNotePage').remove();});await page.emulateMedia({media:'screen'});console.log('pdfs ok; pages', require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','note-only.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="note"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-note.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
