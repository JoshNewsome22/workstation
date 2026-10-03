const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/da1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['inventory','assessment','results','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  /* v21.33: the graph downloads as a PNG */
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#daPngBtn').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  const st=await page.evaluate(()=>{const R=stats();return R.ranked.map(o=>({name:o.name,rank:o.rank,n:o.n,comp:o.comp&&+o.comp.toFixed(1),lat:o.lat&&+o.lat.toFixed(0),rate:o.rate&&+o.rate.toFixed(3),pbN:o.pbN,aff:o.aff&&+o.aff.toFixed(2),picked:o.picked,offered:o.offered,cls:o.cls}));});
  console.log('ranked:');st.forEach(o=>console.log('  ',JSON.stringify(o)));
  console.log('tasks',await page.evaluate(()=>S.tasks.length),'sessions',await page.evaluate(()=>S.sess.length),'probes',await page.evaluate(()=>S.probes.length));
  console.log('verdict:',await page.$eval('#resVerdict',e=>e.textContent.trim().slice(0,200)));
  console.log('inventory verdict:',await page.$eval('#invVerdict',e=>e.textContent.trim().slice(0,160)));
  console.log('flags:',await page.evaluate(()=>recommend(stats()).flags.length));console.log('rec headings:',await page.$$eval('#recOut h4',h=>h.map(x=>x.textContent)));
  console.log('fa tasks:',await page.$$eval('#recOut .recbox:first-child li b',h=>h.map(x=>x.textContent)));
  console.log('plan chars:',await page.evaluate(()=>S.meta.plan.length),'first line:',await page.evaluate(()=>S.meta.plan.split('\n')[0].slice(0,140)));
  /* hand-check: task 0 = subtraction: pb 6,7,6 over 5 min each -> mean rate 1.267; latency (40+55+30)/3=41.7; comp 20,30,20 -> 23.3 */
  const t0=st.find(o=>/Subtraction/.test(o.name));console.log('hand check subtraction: rate 1.267 =',t0.rate,'lat 42 =',t0.lat,'comp 23.3 =',t0.comp,'cls low =',t0.cls);
  const t5=st.find(o=>/Sorting/.test(o.name));console.log('hand check sorting: rate 0 =',t5.rate,'lat 300 =',t5.lat,'comp 97.2 =',t5.comp,'cls high =',t5.cls,'chosen 3 of 3 =',t5.picked+' of '+t5.offered);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  await page.click('#viewSeg button[data-view="results"]');
  for(const m of ['rate','lat','comp']){await page.selectOption('#chartSel',m);await sleep(150);await (await page.$('#daChart')).screenshot({path:`${OUT}/chart-${m}.png`});}
  console.log('chart bars:',await page.$$eval('#daChart rect[rx]',r=>r.length));
  await page.selectOption('#chartSel','rate');
  /* edit a session and confirm live recompute */
  await page.click('#viewSeg button[data-view="assessment"]');
  await page.fill('#sessTbl tbody tr:nth-child(2) input[data-f="pb"]','12');await sleep(300);
  console.log('after edit, row 2 rate cell:',await page.$eval('#sessTbl tbody tr:nth-child(2) td:nth-child(10)',e=>e.textContent),'subtraction mean rate now',await page.evaluate(()=>stats().ranked[0].rate.toFixed(3)));
  await page.fill('#sessTbl tbody tr:nth-child(2) input[data-f="pb"]','6');await sleep(300);
  /* generate order adds nper*tasks sessions */
  const before=await page.evaluate(()=>S.sess.length);await page.evaluate(()=>document.querySelector('#genOrder').click());await sleep(200);
  const afterGen=await page.evaluate(()=>S.sess.length);const noRepeat=await page.evaluate(()=>{let ok=true;for(let i=1;i<S.sess.length;i++)if(S.sess[i].t===S.sess[i-1].t)ok=false;return ok;});
  console.log('generated order: sessions',before,'->',afterGen,'(expect +18); no task twice in a row:',noRepeat);
  await page.evaluate(()=>{S.sess=S.sess.slice(0,18);renderSess();renderMeans();renderResults();});
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const beforeS=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: tasks named',await page.evaluate(()=>S.tasks.filter(t=>t.name).length),'sessions',await page.evaluate(()=>S.sess.length));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const afterS=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',beforeS===afterS,'bytes',saved.length);
  if(beforeS!==afterS){const a=JSON.parse(beforeS),b=JSON.parse(afterS);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,120),'|',JSON.stringify(b[k]).slice(0,120));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"PD-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.sess.length),'sessions');
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['not json'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after bad json:',await page.evaluate(()=>S.sess.length),'sessions');
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'header:',csv.split('\n')[0].slice(0,80));
  /* print */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});
  console.log('pdf pages',require('child_process').execSync(`python3 -c "import pymupdf;print(pymupdf.open('${OUT}/form.pdf').page_count)"`).toString().trim());
  /* phone */
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="results"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-results.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
