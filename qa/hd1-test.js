const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/hd1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/HD-1_Home-Data-Sheets_v2026-10.html';
/* v21.78 what this test only logged now decides its exit: a round trip that differs, or errors in the LOG, fail it */
{const lg=console.log,bad=[];console.log=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');if(/round trip identical: false/.test(s)||/LOG:\s*\[\s*["{]/.test(s))bad.push(s.slice(0,240));lg(...a);};process.on('beforeExit',()=>{if(process.exitCode)return;if(bad.length){lg('FAIL '+bad.length+' check(s): '+bad.join(' | '));process.exitCode=1;}else lg('RESULT: all passed');});}
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['setup','sheets','entry','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  console.log('after sim: behaviors',await page.evaluate(()=>S.bh.length),'weeks',await page.evaluate(()=>S.wk.length),'sheets',await page.$$eval('#sheetOut .hs',h=>h.length));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* each home sheet alone */
  await page.click('#viewSeg button[data-view="sheets"]');await sleep(100);
  const hs=await page.$$('#sheetOut .hs');for(let i=0;i<hs.length;i++)await hs[i].screenshot({path:`${OUT}/sheet-${i}.png`});
  /* computed values: week 1 Monday hitting = 2, tantrum 15 min, bedtime 2.0; completeness; agreement */
  const comp=await page.evaluate(()=>{curWk=0;bindWeek();renderEnt();const w=S.wk[0];return{hitMon:dayTotal(w,0,0).txt,tanMon:dayTotal(w,1,0).txt,bedMon:dayTotal(w,2,0).txt,hitWeek:weekTotal(w,0).txt,tanWeek:weekTotal(w,1).txt,bedWeek:weekTotal(w,2).txt,comp:completeness(w),ag:S.ag.map(agree)};});
  console.log('week 1:',JSON.stringify(comp));
  console.log('entry verdict:',await page.$eval('#entVerdict',e=>e.textContent.slice(0,120)));
  console.log('agreement:',await page.$eval('#agMetrics',e=>e.textContent.replace(/\s+/g,' ').slice(0,160)));
  console.log('returned rows:',await page.$$eval('#retOut tbody tr',r=>r.length),'plot panels:',await page.$$eval('#entPlot path',p=>p.length));
  /* type a cell and watch the total move */
  await page.click('#viewSeg button[data-view="entry"]');await page.fill('[data-e="b0_r0_d0"]','7');await sleep(100);
  console.log('after typing 7 into Mon morning hitting: day total',await page.$eval('#t_b0_d0',e=>e.textContent),'week',await page.$eval('#wt_b0',e=>e.textContent));
  await page.fill('[data-e="b0_r0_d0"]','0');await sleep(100);
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: behaviors named',await page.evaluate(()=>S.bh.filter(b=>b.name).length),'weeks',await page.evaluate(()=>S.wk.length));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,120),'|',JSON.stringify(b[k]).slice(0,120));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.wk.length),await page.evaluate(()=>S.meta.client));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'first:',csv.split('\n')[0]);
  /* prints: the whole form, then the home sheets alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>{document.body.classList.add('hd-sheets-only');const st=document.createElement('style');st.id='hdSheetPage';st.textContent='@media print{@page{size:letter portrait;margin:0.5in}}';document.head.appendChild(st);});await page.pdf({path:`${OUT}/sheets-only.pdf`,printBackground:true,preferCSSPageSize:true});
  await page.evaluate(()=>{document.body.classList.remove('hd-sheets-only');document.querySelector('#hdSheetPage').remove();});await page.emulateMedia({media:'screen'});console.log('pdfs ok; pages', require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','sheets-only.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="sheets"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-sheets.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
