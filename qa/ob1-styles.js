const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1280,height:900}});
 await page.goto(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(500);
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(500);
 await page.emulateMedia({media:'print'});await sleep(300);
 const r=await page.evaluate(()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return {mt:c.marginTop,mb:c.marginBottom,pt:c.paddingTop,pb:c.paddingBottom,fs:c.fontSize,lh:c.lineHeight,bi:c.breakInside,ba:c.breakAfter,bb:c.breakBefore};};
   return {warn:g('#guide .warn'),h3:g('#guide h3.sub'),rules:g('#guide ul.rules'),li:g('#guide ul.rules li'),cite:g('#guide .cite'),method:g('#guide p.method'),warnN:document.querySelectorAll('#guide .warn').length,h3N:document.querySelectorAll('#guide h3.sub').length,
     ivcell:g('.obs-page td.ivcell'),ivbtn:g('button.iv'),ioa:g('p.ioa'),obs2row:(()=>{const e=document.querySelector('tr.obs2row');return e?e.getBoundingClientRect().height:null;})(),countrow:document.querySelector('table.obs-count tbody tr').getBoundingClientRect().height,ivrule:g('.obs-page p.method.ivrule'),grid:g('.obs-page table.grid.obs-count'),ivwrap:g('.obs-page .ivwrap')};});
 console.log(JSON.stringify(r,null,0));await br.close();})();
