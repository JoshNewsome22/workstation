const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:960,height:700}});wire(page,[]);
await page.goto(BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html');await sleep(300);
await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(200);await page.click('#viewSeg button[data-view="sheet"]');
await page.emulateMedia({media:'print'});await page.evaluate(()=>{document.body.classList.add('sm-sheet-only');const st=document.createElement('style');st.textContent='@media print{@page{size:letter landscape;margin:0.5in}}';document.head.appendChild(st);});await sleep(200);
const r=await page.evaluate(()=>{const q=s=>document.querySelector(s);const h=e=>e&&Math.round(e.getBoundingClientRect().height);return {sheetOut:h(q('#sheetOut')),head:h(q('#sheetOut .sm-head')),table:h(q('#sheetOut table.sm')),foot:h(q('#sheetOut .sm-foot')),rows:[...document.querySelectorAll('#sheetOut table.sm tr')].map(h),printHead:h(q('.nbh-print-head')),printFoot:h(q('.nbh-print-foot')),bodyPad:getComputedStyle(document.body).paddingTop,sheetPad:getComputedStyle(q('.sheet')).paddingTop,w:Math.round(q('#sheetOut').getBoundingClientRect().width)}});
console.log(JSON.stringify(r));await br.close();})();
