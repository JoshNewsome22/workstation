const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/sr1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/SR-1_Schedules-of-Reinforcement_v2026-10.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['catalog','patterns','choose','design','card','guide'];
  console.log('catalogue count:',await page.$eval('#catCount',e=>e.textContent),'cards',await page.$$eval('#catOut details',d=>d.length));
  await page.click('#famSeg button[data-fam="dr"]');await sleep(100);console.log('dr family:',await page.$eval('#catCount',e=>e.textContent));
  await page.click('#famSeg button[data-fam="all"]');await page.fill('#catSearch','momentary');await sleep(150);console.log('search momentary:',await page.$eval('#catCount',e=>e.textContent),'open',await page.$$eval('#catOut details[open]',d=>d.length));
  await page.fill('#catSearch','');await sleep(100);
  await page.click('#catOpen');await sleep(100);await page.screenshot({path:`${OUT}/catalog-open.png`,fullPage:true});await page.click('#catClose');
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  console.log('patterns drawn:',await page.$$eval('#patOut .pat svg',s=>s.length));
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  console.log('chooser rows:',await page.$$eval('#chooseOut tbody tr',r=>r.length));
  /* every designer */
  const designs=['dro','drl','vi','ncr','pr','token','thin','chain','interlock','lh','lag'];
  await page.click('#viewSeg button[data-view="design"]');
  for(const d of designs){await page.selectOption('[data-m="ds_sel"]',d);await sleep(120);const nota=await page.$eval('#dsOut',e=>(e.querySelector('.metric .val')||{}).textContent||'(no notation)');const warn=await page.$$eval('#dsOut .verdict',v=>v.map(x=>x.textContent.slice(0,60)));console.log('design',d,'→',nota.trim().slice(0,70),warn.length?'| warn: '+warn.join(' / '):'');await (await page.$('#dsOut')).screenshot({path:`${OUT}/design-${d}.png`});}
  /* drl variants and vi methods */
  await page.selectOption('[data-m="ds_sel"]','drl');for(const v of ['interval','spaced']){await page.selectOption('[data-m="drl_var"]',v);await sleep(80);console.log(' drl',v,(await page.$eval('#dsOut .metric .val',e=>e.textContent)).trim());}
  await page.selectOption('[data-m="ds_sel"]','vi');for(const v of ['arith','rand']){await page.selectOption('[data-m="vi_method"]',v);await sleep(80);console.log(' vi',v,(await page.$eval('#dsOut',e=>e.textContent.replace(/\s+/g,' ').slice(0,160))));}
  const fh=await page.evaluate(()=>{const s=fhSeries(180,10);return [s.join(','),s.reduce((a,b)=>a+b,0)/s.length];});console.log('FH series',fh[0],'mean',fh[1]);
  await page.selectOption('[data-m="ds_sel"]','dro');await sleep(100);
  await page.click('#viewSeg button[data-view="card"]');await sleep(150);await (await page.$('#cardOut')).screenshot({path:`${OUT}/card-dro.png`});
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k);}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.meta.client));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(300);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\r\n').length,'has entities?',/&[a-z]+;/.test(csv));
  /* prints */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.add('sr-card-only'));await page.pdf({path:`${OUT}/card-only.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.remove('sr-card-only'));await page.emulateMedia({media:'screen'});
  console.log('pdf pages',require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','card-only.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="catalog"]');await page.click('#catOut details:first-of-type summary');await sleep(200);await page.screenshot({path:`${OUT}/phone-catalog.png`,fullPage:false});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
