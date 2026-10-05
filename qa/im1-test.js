const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/im1/shots';
fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html';
const views=['setup','map','scoring','history','guide'];
(async()=>{
  const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(500);
  /* v21.34: questions and notices are the form's own dialog now; answer them at once (nbhUI honours the stub) */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  console.log('title:',await page.title());
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  /* the map: every published location is a row; the ones with a surface are paths on the figures */
  const locs=await page.evaluate(()=>({chart:LOCS.length,paths:document.querySelectorAll('#imMaps path[data-loc]').length,distinct:new Set([...document.querySelectorAll('#imMaps path[data-loc]')].map(p=>p.dataset.loc)).size,
    front:document.querySelectorAll('#imFig-front path[data-loc]').length,back:document.querySelectorAll('#imFig-back path[data-loc]').length,head:document.querySelectorAll('#imFig-head path[data-loc]').length,
    noSurface:LOCS.filter(l=>!SURF[l.id]).map(l=>l.id),options:document.querySelectorAll('#imAddLoc option').length-1}));
  console.log('locations:',JSON.stringify(locs));
  /* blank print, before anything is marked */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/blank.pdf`,format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});
  /* tap three locations: a marker is placed where the tap landed, a row is added */
  await page.click('#viewSeg button[data-view="map"]');await sleep(100);
  await page.click('#imFig-front path[data-loc="chest"]');await sleep(100);
  await page.click('#imFig-front path[data-loc="hand_L"]',{position:{x:8,y:10}});await sleep(100);
  await page.click('#imFig-back path[data-loc="lleg_R"]');await sleep(100);
  console.log('after three taps: rows',await page.evaluate(()=>S.cur.rows.map(r=>r.loc+'@'+r.view+'('+r.x+','+r.y+')').join(' ')),'markers',await page.$$eval('#imMaps .imMark',m=>m.length),'selected',await page.evaluate(()=>SEL));
  /* the side panel edits the selected row; severity waits for the type */
  console.log('severity select disabled before a type:',await page.$eval('#imSide select[data-f="sev"]',e=>e.disabled));
  /* the side panel (Body map view) and the chart (Scoring view) edit the same row; whichever is showing is used */
  const setRow=async(loc,n,type,sev)=>{await page.evaluate(l=>{SEL=l;renderCur();},loc);const w=await page.evaluate(()=>document.body.classList.contains('view-scoring'))?'#imChart tr.sel ':'#imSide ';
    await page.selectOption(w+'select[data-f="n"]',n);await page.selectOption(w+'select[data-f="type"]',type);await sleep(60);await page.selectOption(w+'select[data-f="sev"]',sev);await sleep(100);};
  await setRow('chest','2','CT','1');await setRow('hand_L','3','AL','2');await setRow('lleg_R','2','AL','1');
  let sc=await page.evaluate(()=>{const s=score(S.cur.rows);return {total:s.total,f:s.f,ni:s.ni,si:s.si,risk:s.risk,rule:s.rule};});
  console.log('hand check A (number 2+3+2=7 -> NI 2; severities 1,2,1 -> one 2, no 3s -> SI 2; AL-2 on the hand, CT-1 -> Low):',JSON.stringify(sc),'ok:',sc.total===7&&sc.ni===2&&sc.si===2&&sc.risk==='Low');
  console.log('metrics on the map:',await page.$$eval('#imIdxMap .metric',m=>m.map(x=>x.querySelector('b').textContent+'='+x.querySelector('.val').textContent)));
  await page.screenshot({path:`${OUT}/three-taps.png`,fullPage:true});
  /* a severity change recolours the marker */
  const fillOf=async loc=>page.evaluate(l=>{const i=S.cur.rows.findIndex(r=>r.loc===l);const m=document.querySelector('#imMaps .imMark[data-row="'+i+'"]');return m?m.className.baseVal+' '+getComputedStyle(m.querySelector('.core')).fill:'(none)';},loc);
  console.log('hand marker before:',await fillOf('hand_L'));
  await setRow('hand_L','3','AL','3');
  console.log('hand marker after severity 3:',await fillOf('hand_L'));
  sc=await page.evaluate(()=>{const s=score(S.cur.rows);return {ni:s.ni,si:s.si,risk:s.risk,rule:s.rule};});
  console.log('hand check B (one 3 -> SI 4; AL-3 -> High):',JSON.stringify(sc),'ok:',sc.si===4&&sc.risk==='High');
  /* the published risk rules on the eyes and the head, through the chart's location select */
  await page.click('#viewSeg button[data-view="scoring"]');await setRow('hand_L','3','AL','2');
  await page.selectOption('#imAddLoc','eyearea_L');await page.click('#imAddBtn');await sleep(100);await setRow('eyearea_L','1','AL','2');
  sc=await page.evaluate(()=>{const s=score(S.cur.rows);return {total:s.total,si:s.si,risk:s.risk,rule:s.rule,rows:S.cur.rows.length};});
  console.log('hand check C (AL-2 near the eyes -> Moderate; two 2s -> SI 3):',JSON.stringify(sc),'ok:',sc.risk==='Moderate'&&sc.si===3);
  await page.selectOption('#imAddLoc','scalp');await page.click('#imAddBtn');await sleep(100);await setRow('scalp','1','CT','2');
  sc=await page.evaluate(()=>{const s=score(S.cur.rows);return {risk:s.risk,rule:s.rule};});
  console.log('hand check D (CT-2 on the head -> High):',JSON.stringify(sc),'ok:',sc.risk==='High'&&/CT-2 on the head/.test(sc.rule));
  /* v21.44 (B4): the private areas are not examined: Genitalia and Rectum are on the list but cannot be chosen; Hips/buttocks adds the side of the hip, and a tap on the buttocks adds no row (qa/policy-safety-test.js covers the care path) */
  console.log('genitalia, rectum disabled; hips (the side of the hip) enabled [expect true,true,false]:',JSON.stringify(await page.evaluate(()=>['genitalia','rectum','hips'].map(l=>{const o=document.querySelector('#imAddLoc option[value="'+l+'"]');return o?o.disabled:'missing';}))),'rows',await page.evaluate(()=>S.cur.rows.length));
  await page.screenshot({path:`${OUT}/scoring-six.png`,fullPage:true});
  /* a row's delete removes its marker */
  await page.evaluate(()=>{window.confirm=()=>true;});
  for(const loc of ['scalp','eyearea_L']){await page.evaluate(l=>{const i=S.cur.rows.findIndex(r=>r.loc===l);document.querySelector('#imChart button.rowDel[data-i="'+i+'"]').click();},loc);await sleep(200);}
  console.log('after two deletes: rows',await page.evaluate(()=>S.cur.rows.map(r=>r.loc).join(' ')),'markers',await page.$$eval('#imMaps .imMark',m=>m.length),'tinted paths',await page.$$eval('#imMaps path.has',p=>new Set(p.map(x=>x.dataset.loc)).size));
  /* save to history, start new, reopen */
  await page.evaluate(()=>{document.querySelectorAll('[data-a="date"]')[0].value='9/1/2026';document.querySelectorAll('[data-a="date"]')[0].dispatchEvent(new Event('input',{bubbles:true}));});
  /* v21.44 (B4): an administration is filed only with two adults named (the second with a role, ticked present) and the student's assent recorded */
  await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(300);
  console.log('without the two adults: hist',await page.evaluate(()=>S.hist.length),'(expect 0)');
  await page.evaluate(()=>{[['examiner','School nurse (test)'],['second','Classroom aide (test)'],['secondRole','paraprofessional'],['assent','yes']].forEach(([k,v])=>{const e=document.querySelector('[data-a="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
    const p=document.querySelector('[data-a="present"]');p.checked=true;p.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(300);
  console.log('saved: hist',await page.evaluate(()=>S.hist.length),'cur id set',await page.evaluate(()=>!!S.cur.id),'same as saved',await page.evaluate(()=>savedSame()));
  await page.evaluate(()=>document.querySelector('#newAdmBtn').click());await sleep(300);
  console.log('new administration: rows',await page.evaluate(()=>S.cur.rows.length),'markers',await page.$$eval('#imMaps .imMark',m=>m.length),'dated',await page.evaluate(()=>S.cur.date),'hist still',await page.evaluate(()=>S.hist.length));
  await page.click('#viewSeg button[data-view="history"]');await page.click('#imHist button[data-open]');await sleep(300);
  console.log('reopened read-only: rows',await page.evaluate(()=>S.cur.rows.length),'ro',await page.evaluate(()=>S.cur.ro),'inputs disabled',await page.$eval('#imChart select[data-f="n"]',e=>e.disabled),'markers',await page.$$eval('#imMaps .imMark',m=>m.length));
  const tapRo=await page.evaluate(()=>{const n=S.cur.rows.length;document.querySelector('#imFig-front path[data-loc="nose"]').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:10,clientY:10}));return S.cur.rows.length===n;});
  console.log('a tap while read-only adds nothing:',tapRo);
  await page.click('#viewSeg button[data-view="history"]');await page.click('#imHist button[data-edit]');await sleep(300);
  console.log('edit this one: ro',await page.evaluate(()=>S.cur.ro),'inputs enabled',await page.$eval('#imChart select[data-f="n"]',e=>!e.disabled));
  /* simulation */
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  const sim=await page.evaluate(()=>histSorted().map(h=>{const s=score(h.rows);return {date:h.date,n:s.n,total:s.total,f:s.f,ni:s.ni,si:s.si,risk:s.risk,rule:s.rule};}));
  console.log('simulation administrations:');sim.forEach(x=>console.log('  ',JSON.stringify(x)));
  const hand=[{total:8,ni:2,si:3,risk:'High'},{total:4,ni:1,si:3,risk:'Moderate'},{total:1,ni:1,si:1,risk:'Low'}];
  console.log('simulation hand check (totals 8,4,1 -> NI 2,1,1; severities {1x2,2x3},{1x1,2x2},{1x1} -> SI 3,3,1; CT-2 scalp -> High, CT-2 forearm -> Moderate, AL-1 -> Low):',sim.length===3&&sim.every((x,i)=>x.total===hand[i].total&&x.ni===hand[i].ni&&x.si===hand[i].si&&x.risk===hand[i].risk));
  console.log('graph: NI points',await page.$$eval('#imPlot circle',c=>c.length),'SI points',await page.$$eval('#imPlot rect[fill="#8E2A2A"]',c=>c.length),'risk boxes',await page.$$eval('#imPlot text[font-weight="600"]',t=>t.map(x=>x.textContent).join(',')));
  console.log('nurse checks',await page.evaluate(()=>S.nurse.length),'healed sites',await page.evaluate(()=>S.healed.length),'events',await page.evaluate(()=>S.events.length));
  console.log('schedule:',await page.$eval('#imSched',e=>e.textContent.replace(/\s+/g,' ').slice(0,330)));
  console.log('due hook:',JSON.stringify(await page.evaluate(()=>window.__nbhDue())));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  await page.click('#viewSeg button[data-view="map"]');await sleep(100);await (await page.$('.imMapWrap')).screenshot({path:`${OUT}/sim-map-detail.png`});
  /* v21.33: the graph downloads as a PNG */
  {const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#imPngBtn').click())]);const b=fs.readFileSync(await dl.path());console.log('graph png:',dl.suggestedFilename(),b.length,'bytes, png and non-trivial:',b[0]===0x89&&b[1]===0x50&&b.length>10000);}
  /* round trip */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});
  console.log('cleared: hist',await page.evaluate(()=>S.hist.length),'client',await page.evaluate(()=>S.meta.client||'(none)'));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));console.log('round trip identical:',before===after,'bytes',saved.length,'form',JSON.parse(saved).form,JSON.parse(saved).rev);
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,200),'|',JSON.stringify(b[k]).slice(0,200));}
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"SM-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after wrong file:',await page.evaluate(()=>S.hist.length),'administrations');
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['not json'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  console.log('still loaded after bad json:',await page.evaluate(()=>S.hist.length));
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);
  const csv=await page.evaluate(()=>window.__saved);const lines=csv.split('\n');
  console.log('csv lines:',lines.length,'(expect 1 header + 5+3+1 locations + 3 nurse + 1 noticed during required care = 14)','columns',lines[0].split(',').length,'(expect 23)','header:',lines[0].slice(0,120));
  console.log('csv row 2:',lines[1].slice(0,160));console.log('csv last:',lines[lines.length-1].slice(0,120),'entities?',/&[a-z]+;/.test(csv));
  /* prints: blank (above) and the simulation */
  await page.emulateMedia({media:'print'});await page.pdf({path:`${OUT}/sim.pdf`,format:'Letter',printBackground:true});await page.emulateMedia({media:'screen'});
  console.log('pdf pages [blank, simulation]:',require('child_process').execSync(`python3 -c "import pymupdf;print([pymupdf.open('${OUT}/'+f).page_count for f in ['blank.pdf','sim.pdf']])"`).toString().trim());
  console.log('blank print has no marker:',await page.evaluate(()=>{const keep=JSON.stringify(S);S=blank();renderAll();const n=document.querySelectorAll('#imMaps .imMark').length;S=JSON.parse(keep);renderAll();return n===0;}));
  /* phone */
  await page.setViewportSize({width:390,height:800});await sleep(300);
  let overflow=0;for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(250);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1]){overflow++;console.log('PHONE OVERFLOW',v,sw.join('/'));}}
  await page.click('#viewSeg button[data-view="map"]');await sleep(200);await page.screenshot({path:`${OUT}/phone-map.png`,fullPage:true});
  console.log('phone checked; overflows:',overflow,'LOG:',JSON.stringify(log));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
