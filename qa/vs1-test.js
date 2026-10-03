const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/vs1/shots';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/VS-1_Visual-Supports_v2026-10.html';const cp=require('child_process');
const pages=f=>cp.execSync(`python3 -c "import pymupdf;print(pymupdf.open('${f}').page_count)"`).toString().trim();
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);const views=['board','cards','rules','strips','library','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  console.log('board cells',await page.$$eval('#boardOut .cell2',c=>c.length),'rules on',await page.evaluate(()=>S.rules.filter(r=>r.on).length));
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  console.log('board cells filled',await page.evaluate(()=>S.board.filter(o=>o.k).length),'cards verdict:',await page.$eval('#cardsVerdict',e=>e.textContent),'card cells',await page.$$eval('#cardsOut .cell2',c=>c.length),'rule pages',await page.$$eval('#rulesOut .page',c=>c.length),'strip pages',await page.$$eval('#stripsOut .page',c=>c.length));
  await page.click('#viewSeg button[data-view="board"]');await sleep(100);const sz=await page.evaluate(()=>{const c=document.querySelector('#boardOut .cell2');const r=c.getBoundingClientRect();return [r.width/96,r.height/96];});console.log('board cell inches',sz.map(x=>x.toFixed(2)).join('x'));
  /* photo upload via the library page, then use it in the first board cell through the picker */
  await page.click('#viewSeg button[data-view="library"]');await page.click('#phAdd');
  await page.evaluate(()=>{const c=document.createElement('canvas');c.width=60;c.height=40;const x=c.getContext('2d');x.fillStyle='#36c';x.fillRect(0,0,60,40);c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'bus.png',{type:'image/png'}));const i=document.querySelector('#photoIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});});await sleep(500);
  console.log('photos',await page.evaluate(()=>S.photos.length),await page.evaluate(()=>S.photos[0]&&S.photos[0].label));
  await page.click('#viewSeg button[data-view="board"]');await page.click('#bTbl .pick[data-i="0"] button[data-pick]');await sleep(150);await page.selectOption('#pdCat','_photos');await sleep(100);await page.click('#pdGrid button[data-ph]');await sleep(200);
  console.log('cell 0 photo:',await page.evaluate(()=>!!S.board[0].ph),'board imgs',await page.$$eval('#boardOut img',i=>i.length));
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,100),'|',JSON.stringify(b[k]).slice(0,100));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);console.log('still loaded after wrong file:',await page.evaluate(()=>S.board.filter(o=>o.k||o.ph).length));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);console.log('csv lines:',(await page.evaluate(()=>window.__saved)).split('\n').length);
  /* prints: each page's visuals alone */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/form.pdf`,format:'Letter',printBackground:true});
  for(const v of ['board','cards','rules','strips']){const orient=v==='board'?'landscape':'portrait';await page.evaluate(({v,o})=>{document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v+' vs-out-only';document.querySelectorAll('section').forEach(s=>s.classList.remove('vs-show'));document.querySelector('section.only-'+v).classList.add('vs-show');const st=document.createElement('style');st.id='pg';st.textContent='@media print{@page{size:letter '+o+';margin:0}}';document.head.appendChild(st);},{v,o:orient});
    await page.pdf({path:`${OUT}/out-${v}.pdf`,printBackground:true,preferCSSPageSize:true});await page.evaluate(()=>{document.body.classList.remove('vs-out-only');document.querySelectorAll('section').forEach(s=>s.classList.remove('vs-show'));document.querySelector('#pg').remove();});console.log('out',v,'pages',pages(`${OUT}/out-${v}.pdf`));}
  await page.emulateMedia({media:'screen'});console.log('form pages',pages(`${OUT}/form.pdf`));
  await page.setViewportSize({width:390,height:800});await sleep(300);for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1])console.log('PHONE OVERFLOW',v,sw.join('/'));}
  console.log('phone checked. LOG:',JSON.stringify(log));await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
