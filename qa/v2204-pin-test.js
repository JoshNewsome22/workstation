/* v22.04 Pin to the main screen (v22.05 the thumbtack alone in a circle, grey when pinned, the word for a moment): a pinned student is always on the start screen, first, the rest after them in the
   usual order (most urgent, then the latest saved), twelve in all; the pin is kept on this device across a reload, and
   Remove drops it. Simulated students only.
   usage: node qa/v2204-pin-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const UA_IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},userAgent:UA_IPAD,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on','nbh.caseload.allt'].forEach(k=>localStorage.removeItem(k));}catch(e){}kvDel(CL_PIN_K());
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const now=Date.now(),recs=[];
    for(let i=1;i<=14;i++){const p={client:'SIMULATED – Sample Student '+(i+1),sid:'SIM-'+String(100+i).padStart(4,'0'),site:'Sample Elementary',grade:'3'};
      const items=i===1?[{k:'Overdue',t:'The annual IEP review is overdue',open:'GB-1'}]:[];const saved=new Date(now-i*36e5).toISOString();
      recs.push({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum:{items,lastData:'',forms:1,trends:[]},
        text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{}})});}
    await clTx('readwrite',st=>{recs.forEach(r=>st.put(r));});await paintBlank();});
  await sleep(500);
  const main=()=>page.evaluate(()=>[...document.querySelectorAll('#blankCl .cl-card')].map(c=>({n:c.getAttribute('aria-label'),pin:(c.querySelector('.cl-pin')||{}).getAttribute?c.querySelector('.cl-pin').getAttribute('aria-pressed'):null})));
  const more=()=>page.evaluate(()=>{const h=document.querySelector('#blankCl .cl-cards+.hint');return h?h.textContent:'';});
  const m0=await main(),h0=await more();
  ok('1 by default: twelve cards, the overdue student first, then the latest saved; the last two in Caseload',m0.length===12&&m0[0].n==='Sample Student 2'&&m0[1].n==='Sample Student 3'&&m0[11].n==='Sample Student 13'&&/and 2 more/.test(h0)&&m0.every(x=>x.pin==='false'),{m0,h0});
  const sz=await page.evaluate(()=>{const b=document.querySelector('#blankCl .cl-pin'),r=b.getBoundingClientRect();return {w:r.width,h:r.height,t:b.textContent,l:b.getAttribute('aria-label')};});
  ok('2 each card has a round pin button (the thumbtack, no word), 44 px, named for the student',sz.h>=44&&sz.w>=44&&sz.t===''&&sz.l==='Pin to the main screen: Sample Student 2',sz);
  await page.evaluate(()=>caseloadOpen());await sleep(900);
  await page.evaluate(()=>{[...document.querySelectorAll('#dlgBody .cl-card')].find(c=>c.getAttribute('aria-label')==='Sample Student 15').querySelector('.cl-pin').click();});await sleep(600);
  const d1=await page.evaluate(()=>{const b=[...document.querySelectorAll('#dlgBody .cl-card')].find(c=>c.getAttribute('aria-label')==='Sample Student 15').querySelector('.cl-pin');const tip=b.closest('.cl-top').querySelector('.cl-pin-tip');return {p:b.getAttribute('aria-pressed'),t:b.textContent,on:b.classList.contains('on'),bg:getComputedStyle(b).backgroundColor,tip:tip&&tip.textContent,role:tip&&tip.getAttribute('role')};});
  ok('3 pinned in Caseload: the button is pressed and turns grey, and the word Pinned shows beside it for a moment',d1.p==='true'&&d1.t===''&&d1.on&&d1.bg==='rgb(211, 217, 223)'&&d1.tip==='Pinned'&&d1.role==='status',d1);
  await sleep(1300);const gone=await page.evaluate(()=>document.querySelectorAll('.cl-pin-tip').length);
  ok('3b the word goes again after about a second and a half',gone===0,gone);
  await page.evaluate(()=>{try{document.getElementById('dlg').close();}catch(e){}});await sleep(300);
  const m1=await main(),h1=await more();
  ok('4 the main screen: the pinned student first (the oldest save, beyond the twelve before), then the usual order, still twelve',m1.length===12&&m1[0].n==='Sample Student 15'&&m1[0].pin==='true'&&m1[1].n==='Sample Student 2'&&m1[11].n==='Sample Student 12'&&/and 2 more/.test(h1),{m1,h1});
  await page.reload();await sleep(1800);await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};return paintBlank();});await sleep(400);
  const m2=await main();
  ok('5 kept on this device: after a reload the student is still pinned and first',m2[0]&&m2[0].n==='Sample Student 15'&&m2[0].pin==='true',m2.slice(0,2));
  await page.evaluate(()=>{const b=document.querySelector('#blankCl .cl-pin[aria-pressed="true"]');b.click();});await sleep(600);
  const m3=await main(),foc=await page.evaluate(()=>document.activeElement&&document.activeElement.classList.contains('cl-pin'));
  ok('6 unpinned on the main screen: back to the usual order, the student in Caseload only',m3.length===12&&m3[0].n==='Sample Student 2'&&!m3.some(x=>x.n==='Sample Student 15'),m3.map(x=>x.n));
  await page.evaluate(()=>{const c=[...document.querySelectorAll('#blankCl .cl-card')].find(c=>c.getAttribute('aria-label')==='Sample Student 4');c.querySelector('.cl-pin').click();});await sleep(600);
  const m4=await main(),f4=await page.evaluate(()=>{const a=document.activeElement;return !!a&&a.classList.contains('cl-pin')&&a.closest('.cl-card').getAttribute('aria-label');});
  ok('7 pinned on the main screen: it moves first and the button keeps the focus',m4[0].n==='Sample Student 4'&&m4[0].pin==='true'&&f4==='Sample Student 4',{m4:m4.slice(0,2),f4});
  await page.evaluate(()=>caseloadOpen());await sleep(900);
  await page.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(c=>c.getAttribute('aria-label')==='Sample Student 4');c.querySelector('[data-cldel]').click();});await sleep(900);
  const pins=await page.evaluate(()=>clPins());
  ok('8 Remove takes the pin with the student',Array.isArray(pins)&&pins.length===0,pins);
  await page.evaluate(()=>{try{document.getElementById('dlg').close();}catch(e){}});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>paintBlank());await sleep(500);
  const lay=await page.evaluate(()=>({page:document.documentElement.scrollWidth-innerWidth,over:[...document.querySelectorAll('#blankCl .cl-card')].filter(c=>c.scrollWidth>c.clientWidth+1).length,
    top:[...document.querySelectorAll('#blankCl .cl-top')].filter(t=>{const p=t.querySelector('.cl-pin').getBoundingClientRect(),c=t.closest('.cl-card').getBoundingClientRect();return p.right>c.right+1;}).length}));
  ok('9 on a phone: no sideways scrolling, the Pin button inside its card',lay.page<=0&&lay.over===0&&lay.top===0,lay);
  await page.setViewportSize({width:1180,height:820});
  await page.screenshot({path:process.env.SHOT||'/dev/null'}).catch(()=>{});
  ok('10 no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
