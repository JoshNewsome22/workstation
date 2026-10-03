const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage(); const log=[]; L.wire(page,log);
  let url=`${L.BASE}/NBH-Workstation/BC-1_Behavioral-Contrast_v2026-09.html`;
  try{ await page.goto(url,{waitUntil:'load',timeout:5000}); }catch(e){ url='file://'+__dirname+'/../NBH-Workstation/BC-1_Behavioral-Contrast_v2026-09.html'; await page.goto(url,{waitUntil:'load'}); }
  await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
  const r=await page.evaluate(()=>{
    const out=[]; const tables=[...document.querySelectorAll('table.rt')];
    tables.forEach((t,ti)=>{
      const rows=[...t.rows].slice(0,3);
      rows.forEach((tr,ri)=>{
        const th=tr.querySelector('th'); if(!th) return;
        const cs=getComputedStyle(th);
        const matched=[];
        for(const ss of document.styleSheets){ let rules; try{rules=ss.cssRules}catch(e){continue}
          const walk=(rs,media)=>{ for(const rule of rs){ if(rule.cssRules){ walk(rule.cssRules,(media?media+' ':'')+(rule.conditionText||rule.cssText.slice(0,40))); continue; }
            if(!rule.selectorText) continue; let m=false; try{ m=th.matches(rule.selectorText); }catch(e){}
            if(m && /background/.test(rule.style.cssText)) matched.push((media?'['+media+'] ':'')+rule.selectorText+' -> '+rule.style.cssText.slice(0,80)); } };
          walk(rules,''); }
        out.push({table:ti, label:th.textContent.trim().slice(0,28), row:ri, thead:!!th.closest('thead'), zebra:t.classList.contains('nbh-zebra'), bg:cs.backgroundColor, rowBg:getComputedStyle(tr).backgroundColor, thClass:th.className, matched});
      });
    });
    return {out, html:document.documentElement.className, sheetCls:(document.querySelector('.sheet')||{}).className};
  });
  console.log(url,'html.class=',JSON.stringify(r.html),'sheet=',r.sheetCls);
  for(const o of r.out) console.log(JSON.stringify(o));
  if(log.length) console.log('LOG',JSON.stringify(log.slice(0,3)));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
