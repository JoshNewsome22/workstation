const {chromium,sleep}=require(__dirname+'/lib.js');
const S=__dirname+'/out';
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:420,height:900}});
 await page.goto('file://'+S+'/ob1-ioa/OB-1_pre-edit.html');await sleep(500);
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(500);
 await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="obs"]').click();});await sleep(300);
 console.log('pre-edit',await page.evaluate(()=>({docW:document.documentElement.scrollWidth,vw:innerWidth,tblW:document.querySelectorAll('.obs-page')[1].querySelector('table.obs-count').getBoundingClientRect().width})));
 await br.close();})();
