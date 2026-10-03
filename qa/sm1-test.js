const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/sm1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html';
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const views=['setup','targets','system','reinf','teach','bc','sheet','log','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  /* v21.33: the graph downloads as a PNG */
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#smPngBtn').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#sheetOut .sm-png').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  console.log('after sim: sys',await page.evaluate(()=>S.sys),'possible',await page.evaluate(()=>JSON.stringify(possible())),'log rows',await page.evaluate(()=>S.log.length));
  console.log('record verdict:',await page.$eval('#logVerdict',e=>e.textContent.slice(0,220)));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* every sheet style */
  await page.click('#viewSeg button[data-view="sheet"]');
  for(const sys of ['match','contract','rubric','interval','interlock','smiley','perf','cico']){
    await page.evaluate(s=>{setSys(s);renderAll();},sys);await sleep(150);
    const sc=await page.$('#sheetOut');await sc.screenshot({path:`${OUT}/sheet-${sys}.png`});
    if(sys==='contract'||sys==='rubric'){await page.evaluate(()=>{S.chk.weekly=true;renderAll();});await sleep(150);await (await page.$('#sheetOut')).screenshot({path:`${OUT}/sheet-${sys}-weekly.png`});await page.evaluate(()=>{S.chk.weekly=false;});}
    if(sys==='match'){await page.evaluate(()=>{S.chk.pict=false;renderAll();});await sleep(150);await (await page.$('#sheetOut')).screenshot({path:`${OUT}/sheet-match-text.png`});await page.evaluate(()=>{S.chk.pict=true;});
      await page.evaluate(()=>{S.chk.big=true;renderAll();});await sleep(150);await (await page.$('#sheetOut')).screenshot({path:`${OUT}/sheet-match-big.png`});await page.evaluate(()=>{S.chk.big=false;});
      await page.evaluate(()=>{S.chk.pocket=true;renderAll();});await sleep(150);await (await page.$('#sheetOut')).screenshot({path:`${OUT}/sheet-match-pocket.png`});await page.evaluate(()=>{S.chk.pocket=false;});}
    if(sys==='cico'){await page.evaluate(()=>{S.chk.pocket=true;renderAll();});await sleep(150);await (await page.$('#sheetOut')).screenshot({path:`${OUT}/sheet-cico-pocket.png`});await page.evaluate(()=>{S.chk.pocket=false;renderAll();});}
  }
  await page.evaluate(()=>{setSys('rubric');S.wk={d0_p0:'5',d0_p1:'3',d0_p2:'4',d1_p0:'2'};renderAll();});await page.click('#viewSeg button[data-view="log"]');await sleep(200);
  await page.screenshot({path:`${OUT}/sim-log-rubric.png`,fullPage:true});
  console.log('week grid totals row:',await page.$eval('#wkTbl',t=>t.rows[t.rows.length-7]?t.rows[S.per.length+1].textContent.replace(/\s+/g,' ').slice(0,120):'-'));
  await page.evaluate(()=>{setSys('match');renderAll();});
  await page.click('#viewSeg button[data-view="bc"]');await sleep(150);await (await page.$('#bcOut')).screenshot({path:`${OUT}/contract.png`});
  /* picker: choose a picto, then a photo (a tiny generated PNG), and check the sheet shows them */
  await page.click('#viewSeg button[data-view="targets"]');await page.click('#tTbl .pick[data-i="0"] button[data-pick]');await sleep(150);
  console.log('picker open:',await page.evaluate(()=>document.querySelector('#pickDlg').open),'grid',await page.$$eval('#pdGrid button',b=>b.length));
  await page.fill('#pdQ','walking');await sleep(100);await page.click('#pdGrid button[data-k="walkingfeet"]');await sleep(150);
  console.log('target 0 icon:',await page.evaluate(()=>S.tg[0].icon));
  await page.click('#tTbl .pick[data-i="1"] button[data-pick]');await sleep(100);
  await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=30;const x=c.getContext('2d');x.fillStyle='#c33';x.fillRect(0,0,40,30);c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'p.png',{type:'image/png'}));const i=document.querySelector('#photoIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});});await sleep(500);
  console.log('target 1 photo:',await page.evaluate(()=>S.tg[1].img.slice(0,22)),'sheet imgs',await page.$$eval('#sheetOut img',i=>i.length));
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: targets',await page.evaluate(()=>S.tg.filter(t=>t.word).length),'log',await page.evaluate(()=>S.log.length));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,120),'|',JSON.stringify(b[k]).slice(0,120));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"PD-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.log.length));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  console.log('csv lines:',(await page.evaluate(()=>window.__saved)).split('\n').length);
  /* prints: the whole form, then the student sheet alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  const pdfSheet=async(name)=>{const o=await page.evaluate(()=>sheetOrientation());await page.evaluate(o=>{document.body.classList.add('sm-sheet-only');const st=document.createElement('style');st.id='smSheetPage';st.textContent='@media print{@page{size:letter '+o+';margin:0.5in}}';document.head.appendChild(st);},o);await page.pdf({path:`${OUT}/${name}.pdf`,printBackground:true,preferCSSPageSize:true});await page.evaluate(()=>{document.body.classList.remove('sm-sheet-only');document.querySelector('#smSheetPage').remove();});return o;};
  const pages=[];for(const sys of ['match','contract','rubric','cico','perf','interval','smiley','interlock']){await page.evaluate(s=>{setSys(s);renderAll();},sys);const o=await pdfSheet('so-'+sys);pages.push(sys+':'+o+':'+require('child_process').execSync(`python3 -c "import pymupdf;print(pymupdf.open('${OUT}/so-${sys}.pdf').page_count)"`).toString().trim());}
  await page.evaluate(()=>{setSys('contract');S.chk.weekly=true;renderAll();});pages.push('contract-weekly:'+await pdfSheet('so-contract-weekly')+':'+require('child_process').execSync(`python3 -c "import pymupdf;print(pymupdf.open('${OUT}/so-contract-weekly.pdf').page_count)"`).toString().trim());await page.evaluate(()=>{S.chk.weekly=false;});
  await page.evaluate(()=>{setSys('match');S.chk.big=true;renderAll();});pages.push('match-big:'+await pdfSheet('so-match-big')+':'+require('child_process').execSync(`python3 -c "import pymupdf;print(pymupdf.open('${OUT}/so-match-big.pdf').page_count)"`).toString().trim());await page.evaluate(()=>{S.chk.big=false;setSys('match');renderAll();});
  console.log('sheet-only pages by system:',pages.join('  '));
  await page.evaluate(()=>{document.body.classList.add('sm-bc-only');});await page.pdf({path:`${OUT}/contract-only.pdf`,format:'Letter',printBackground:true});await page.evaluate(()=>{document.body.classList.remove('sm-bc-only');});
  console.log('contract-only pages',require('child_process').execSync(`python3 -c "import pymupdf;print(pymupdf.open('${OUT}/contract-only.pdf').page_count)"`).toString().trim());await page.emulateMedia({media:'screen'});console.log('pdfs ok; pages', require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['form.pdf','so-match.pdf']])"`).toString().trim());
  await page.setViewportSize({width:390,height:800});await sleep(300);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  await page.click('#viewSeg button[data-view="sheet"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-sheet.png`,fullPage:true});
  console.log('phone checked. LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
