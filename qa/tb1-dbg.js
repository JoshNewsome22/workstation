const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage();const log=[];wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html');await sleep(900);
 console.log(await page.evaluate(()=>{const body=document.body,was=body.className;const out={was};
  for(const k of ['guide','select','define']){body.className=was.replace(/\bview-[\w-]+/g,'').trim()+' view-'+k;const all=[...document.querySelectorAll('input,select,textarea')];const v=all.filter(e=>e.offsetParent);out[k]={all:all.length,vis:v.length,sample:v.slice(0,3).map(e=>e.name||e.id||e.className)};}
  body.className=was;out.sheets=[...document.querySelectorAll('main > *, body > *')].slice(0,12).map(e=>e.tagName+'#'+e.id+'.'+e.className.slice(0,20)+':'+getComputedStyle(e).display);return out;}));
 await br.close();})();
