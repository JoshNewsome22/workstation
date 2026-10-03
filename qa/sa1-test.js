const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/sa1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/SA-1_Skill-Acquisition-Data_v2026-10.html';
const views=['setup','trials','steps','graph','probes','guide'];
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  console.log('title:',await page.title());
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  /* blank-state checks */
  console.log('blank: codes',await page.evaluate(()=>S.codes.length),'steps',await page.evaluate(()=>S.steps.length),'sess',await page.evaluate(()=>S.sess.length));
  console.log('blank verdicts:',await page.$eval('#setupVerdict',e=>e.textContent.slice(0,60)),'|',await page.$eval('#graphVerdict',e=>e.textContent.slice(0,50)),'|',await page.$eval('#prVerdict',e=>e.textContent.slice(0,40)));
  /* simulation */
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  /* v21.33: the graph downloads as a PNG */
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#saPngBtn').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  const st=await page.evaluate(()=>S.sess.map(s=>{const x=sessStats(s);return [s.ph,s.inst,Math.round(x.pi),Math.round(x.pc),x.first].join(':');}));
  console.log('sessions:',st.join(' '));
  console.log('ta:',await page.evaluate(()=>S.tas.map(s=>Math.round(taStats(s).pi)).join(',')),'curStep',await page.evaluate(()=>JSON.stringify(curStep())),'mastered steps',await page.evaluate(()=>S.steps.map((s,i)=>stepMastered(i)?1:0).join('')));
  console.log('graph verdict:',await page.$eval('#graphVerdict',e=>e.textContent.replace(/\s+/g,' ').slice(0,200)));
  console.log('graph rules:',await page.$$eval('#graphRules li',l=>l.map(x=>x.textContent.slice(0,90))));
  console.log('probes verdict:',await page.$eval('#prVerdict',e=>e.textContent.replace(/\s+/g,' ').slice(0,160)));
  console.log('probe rows %:',await page.evaluate(()=>probeRows().map(p=>Math.round(p.pc)+(p.pass?'pass':'below')).join(' ')));
  console.log('trial metrics:',await page.$$eval('#trMetrics .metric',m=>m.map(x=>x.querySelector('b').textContent+'='+x.querySelector('.val').textContent)));
  console.log('ta metrics:',await page.$$eval('#taMetrics .metric',m=>m.map(x=>x.querySelector('b').textContent+'='+x.querySelector('.val').textContent)));
  console.log('setup verdict:',await page.$eval('#setupVerdict',e=>e.textContent.replace(/\s+/g,' ').slice(0,120)));
  console.log('plot: circles',await page.$$eval('#saPlot circle',c=>c.length),'phase lines',await page.$$eval('#saPlot line[stroke-dasharray="4 4"]',c=>c.length),'mastery line',await page.$$eval('#saPlot line[stroke="#2F6B37"]',c=>c.length));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* graph on the task analysis */
  await page.click('#viewSeg button[data-view="graph"]');await page.selectOption('[data-m="g_src"]','steps');await sleep(200);
  console.log('TA graph verdict:',await page.$eval('#graphVerdict',e=>e.textContent.replace(/\s+/g,' ').slice(0,160)));
  await (await page.$('.only-graph')).screenshot({path:`${OUT}/sim-graph-ta.png`});
  await page.selectOption('[data-m="g_src"]','');await sleep(150);
  /* editing a cell updates the footer and the graph */
  await page.click('#viewSeg button[data-view="trials"]');
  await page.selectOption('select[data-r="tr"][data-i="11"][data-f="5"]','I');await sleep(400);
  console.log('after edit: session 12 %',await page.evaluate(()=>Math.round(sessStats(S.sess[11]).pi)),'footer',await page.$$eval('#trTbl tr.sum',rs=>rs.find(r=>r.firstElementChild.textContent==='% independent').lastElementChild.textContent));
  await page.selectOption('select[data-r="tr"][data-i="11"][data-f="5"]','–');await sleep(400);
  /* no-change rule: a flat run */
  const flat=await page.evaluate(()=>{const keep=JSON.stringify(S.sess);S.sess=S.sess.slice(0,2).concat([30,30,40,30,30].map((p,i)=>({date:'f'+i,ph:'T',inst:'JN',tr:Array.from({length:10},(_,k)=>k<p/10?'I':'P'),note:''})));renderGraph();const t=document.querySelector('#graphVerdict').textContent;S.sess=JSON.parse(keep);renderAll();return t.slice(0,120);});
  console.log('flat run verdict:',flat);
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: sess',await page.evaluate(()=>S.sess.length),'client',await page.evaluate(()=>S.meta.client||'(none)'));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length,'form',JSON.parse(saved).form,JSON.parse(saved).rev);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,160),'|',JSON.stringify(b[k]).slice(0,160));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.sess.length),await page.evaluate(()=>S.meta.client));
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['not json'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after bad json:',await page.evaluate(()=>S.sess.length));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);console.log('csv lines:',csv.split('\n').length,'(expect 1+12+8+4=25)','entities?',/&[a-z]+;/.test(csv));
  /* prints: the whole form, then each blank sheet alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  for(const [cls,name] of [['sa-print-trial','trial-sheet'],['sa-print-ta','ta-sheet']]){
    await page.evaluate(c=>{document.body.classList.add(c);const st=document.createElement('style');st.id='saSheetPage';st.textContent='@media print{@page{size:letter landscape;margin:0.5in}}';document.head.appendChild(st);},cls);
    await page.pdf({path:`${OUT}/${name}.pdf`,printBackground:true,preferCSSPageSize:true});
    await page.evaluate(c=>{document.body.classList.remove(c);document.querySelector('#saSheetPage').remove();},cls);}
  await page.emulateMedia({media:'screen'});
  console.log('pdf pages',require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','trial-sheet.pdf','ta-sheet.pdf']])"`).toString().trim());
  /* phone */
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="trials"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-trials.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
