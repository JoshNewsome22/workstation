const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/si1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/SI-1_Student-Interview-and-Assent_v2026-10.html';
/* v21.78 what this test only logged now decides its exit: a round trip that differs, or errors in the LOG, fail it */
{const lg=console.log,bad=[];console.log=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');if(/round trip identical: false/.test(s)||/LOG:\s*\[\s*["{]/.test(s))bad.push(s.slice(0,240));lg(...a);};process.on('beforeExit',()=>{if(process.exitCode)return;if(bad.length){lg('FAIL '+bad.length+' check(s): '+bad.join(' | '));process.exitCode=1;}else lg('RESULT: all passed');});}
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['interview','assent','preference','summary','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.click('#viewSeg button[data-view="interview"]');await page.click('#verSeg button[data-ver="young"]');await sleep(150);await page.screenshot({path:`${OUT}/blank-interview-young.png`,fullPage:true});
  await page.click('#verSeg button[data-ver="read"]');
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  console.log('after sim: hypothesis',await page.evaluate(()=>JSON.stringify(hypothesis().c)),'top',await page.evaluate(()=>hypothesis().top.join('+')));
  console.log('hyp line:',await page.$eval('#hypOut',e=>e.textContent.replace(/\s+/g,' ').slice(0,300)));
  console.log('assent:',await page.evaluate(()=>JSON.stringify(assentStats())));
  console.log('assent verdict:',await page.$eval('#assentVerdict',e=>e.className+' '+e.firstChild.className+' | '+e.textContent.slice(0,160)));
  console.log('pref:',await page.evaluate(()=>{const p=prefStats();return JSON.stringify({offers:p.offers,top:p.top&&p.top.name,byChoice:p.byChoice.map(c=>c.name+' '+c.ch+'/'+c.off)});}));
  console.log('pref verdict:',await page.$eval('#prefOut .verdict',e=>e.className+' | '+e.textContent.slice(0,200)));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  await page.click('#viewSeg button[data-view="interview"]');await page.click('#verSeg button[data-ver="young"]');await sleep(200);await page.screenshot({path:`${OUT}/sim-interview-young.png`,fullPage:true});
  await page.click('#viewSeg button[data-view="summary"]');await sleep(150);await (await page.$('#sumOut')).screenshot({path:`${OUT}/summary-young.png`});
  /* interaction: a face click, a checkbox, threshold edit */
  await page.click('#viewSeg button[data-view="interview"]');await page.click('#qLike .facepick button[data-k="3"]');console.log('face click:',await page.evaluate(()=>S.iv.like.s));
  await page.click('#befList input[data-c="b_alone"]');console.log('after b_alone tick:',await page.evaluate(()=>JSON.stringify(hypothesis().c)));
  await page.click('#befList input[data-c="b_alone"]');
  await page.click('#viewSeg button[data-view="assent"]');await page.fill('[data-m="a_thr"]','10');await sleep(100);console.log('thr 10 verdict:',await page.$eval('#assentVerdict .verdict',e=>e.className));await page.fill('[data-m="a_thr"]','25');await sleep(100);
  await page.click('#viewSeg button[data-view="interview"]');await page.click('#verSeg button[data-ver="read"]');await sleep(100);
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: sessions',await page.evaluate(()=>assentStats().n),'client',await page.evaluate(()=>S.meta.client||'(none)'));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,160),'|',JSON.stringify(b[k]).slice(0,160));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>assentStats().n),'sessions');
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'first:',csv.split('\n')[1].slice(0,80));
  /* prints: the whole form, then the summary alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.add('si-sum-only'));await page.pdf({path:`${OUT}/summary-only.pdf`,format:'Letter',printBackground:true});
  await page.evaluate(()=>document.body.classList.remove('si-sum-only'));await page.emulateMedia({media:'screen'});
  console.log('pdf pages [form, summary-only]:',require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','summary-only.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  let overflow=0;for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1]){overflow++;console.log('PHONE OVERFLOW',v,sw.join('/'));}}
  await page.click('#viewSeg button[data-view="interview"]');await page.click('#verSeg button[data-ver="young"]');await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1]){overflow++;console.log('PHONE OVERFLOW young',sw.join('/'));}
  await page.screenshot({path:`${OUT}/phone-interview-young.png`,fullPage:true});
  await page.click('#viewSeg button[data-view="summary"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-summary.png`,fullPage:true});
  console.log('phone checked; overflows:',overflow,'LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
