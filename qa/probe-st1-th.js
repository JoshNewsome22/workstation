const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage(); const log=[]; L.wire(page,log);
  let url=`${L.BASE}/NBH-Workstation/ST-1_Behavior-Skills-Training_v2026-09.html`;
  try{ await page.goto(url,{waitUntil:'load',timeout:5000}); }catch(e){ url='file://'+__dirname+'/../NBH-Workstation/ST-1_Behavior-Skills-Training_v2026-09.html'; await page.goto(url,{waitUntil:'load'}); }
  await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
  const r=await page.evaluate(()=>{
    const out=[]; const tables=[...document.querySelectorAll('table.rt')];
    tables.forEach((t,ti)=>{
      const rows=[...t.rows].slice(0,4);
      rows.forEach((tr,ri)=>{
        const th=tr.querySelector('th'); if(!th) return;
        const cs=getComputedStyle(th);
        out.push({table:ti, first:th.textContent.trim().slice(0,30), tag:th.tagName, row:ri, thead:!!th.closest('thead'), zebra:t.classList.contains('nbh-zebra'), bg:cs.backgroundColor, color:cs.color, fw:cs.fontWeight, rowBg:getComputedStyle(tr).backgroundColor, thClass:th.className, thStyle:th.getAttribute('style')});
      });
    });
    const vars=getComputedStyle(document.documentElement);
    return {out, mist:vars.getPropertyValue('--nbh-mist'), zebra:vars.getPropertyValue('--nbh-zebra'), wash:vars.getPropertyValue('--wash'), html:document.documentElement.className};
  });
  console.log(url); console.log('vars',r.mist,r.zebra,r.wash,'html.class=',JSON.stringify(r.html));
  for(const o of r.out) console.log(JSON.stringify(o));
  if(log.length) console.log('LOG',JSON.stringify(log.slice(0,3)));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
