const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage();const log=[];wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html');await sleep(900);
 console.log(await page.evaluate(()=>{const body=document.body;const out={};const d=id=>getComputedStyle(document.querySelector('#'+id)).display;
  out.rest={guide:d('guide'),select:d('select'),cls:body.className};
  body.className='view-select';out.sel={guide:d('guide'),select:d('select'),cls:body.className,vis:[...document.querySelectorAll('input')].filter(e=>e.offsetParent).length,inSelect:document.querySelectorAll('#select input').length,inGuide:document.querySelectorAll('#guide input').length,where:[...document.querySelectorAll('input')].filter(e=>e.offsetParent).slice(0,3).map(e=>e.closest('.sheet')&&e.closest('.sheet').id)};
  body.className='view-guide';return out;}));
 await br.close();})();
