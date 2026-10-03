const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/gc1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/GC-1_Group-Contingencies_v2026-10.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['setup','design','poster','record','fidelity','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  /* v21.33: the graph downloads as a PNG */
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#gcPngBtn').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  console.log('after sim: type',await page.evaluate(()=>S.type),'teams',await page.evaluate(()=>S.teams.length),'log rows',await page.evaluate(()=>S.log.length),'dir',await page.evaluate(()=>dir()));
  console.log('baseline:',await page.evaluate(()=>JSON.stringify(baseStats())));
  console.log('met per row:',await page.evaluate(()=>S.log.map(r=>rowMet(r)===null?'-':rowMet(r)?'Y':'N').join('')));
  console.log('record verdict:',await page.$eval('#logVerdict',e=>e.textContent.slice(0,240)));
  console.log('design verdict:',await page.$eval('#designVerdict',e=>e.textContent.slice(0,160)));
  console.log('rule:',await page.$eval('#ruleOut',e=>e.textContent.replace(/\s+/g,' ').slice(0,400)));
  console.log('fidelity:',await page.$eval('#fidVerdict',e=>e.textContent.slice(0,120)));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* every arrangement renders a rule and a rules card */
  await page.click('#viewSeg button[data-view="design"]');
  for(const t of ['indep','dep','interdep','gbg','cwfit','random','selfmon','tootle']){
    await page.evaluate(x=>{setType(x);renderAll();},t);await sleep(100);
    const r=await page.$eval('#ruleOut',e=>e.textContent.replace(/\s+/g,' ').length);const p=await page.$eval('#posterOut',e=>e.querySelectorAll('.po-page').length);
    console.log('  type',t,'rule chars',r,'poster pages',p);
    await (await page.$('#ruleOut')).screenshot({path:`${OUT}/rule-${t}.png`});
  }
  await page.evaluate(()=>{setType('gbg');renderAll();});
  /* decision rule: relax when fewer than 2 of 4 met */
  const relax=await page.evaluate(()=>{const keep=JSON.stringify(S.log);S.log.slice(-4).forEach(r=>{r.v[0]='7';});renderRecord();const t=document.querySelector('#logVerdict').textContent;S.log=JSON.parse(keep);renderRecord();return t.slice(0,200);});
  console.log('relax verdict:',relax);
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: exp',await page.evaluate(()=>S.exp.filter(t=>t.text).length),'log',await page.evaluate(()=>S.log.length));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,120),'|',JSON.stringify(b[k]).slice(0,120));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.log.length));
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['not json'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after bad json:',await page.evaluate(()=>S.log.length));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'header:',csv.split('\n')[0]);
  /* prints: the whole form, then the poster alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.add('gc-poster-only'));await page.pdf({path:`${OUT}/poster-only.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.remove('gc-poster-only'));await page.emulateMedia({media:'screen'});
  console.log('pdf pages',require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','poster-only.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="record"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-record.png`,fullPage:true});
  await page.click('#viewSeg button[data-view="poster"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-poster.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
