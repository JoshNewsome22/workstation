const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');const pm=require('child_process');
const V={base:'',noavoid:'#sheetOut table.sm tr{break-inside:auto!important}',noblock:'#sheetOut .face,#sheetOut .ic{display:inline-block!important}',nofix:'.nbh-print-head,.nbh-print-foot{display:none!important}',nopage:'body.sm-sheet-only{page:auto!important}',noflex:'#sheetOut .sm-head,#sheetOut .sm-foot{display:block!important}',nofixed:'#sheetOut table.sm{table-layout:auto!important}'};
(async()=>{const br=await chromium.launch();
for(const [k,css] of Object.entries(V)){const page=await br.newPage({viewport:{width:1100,height:850}});wire(page,[]);
await page.goto(BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html');await sleep(300);
await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(200);await page.click('#viewSeg button[data-view="sheet"]');
await page.emulateMedia({media:'print'});await page.evaluate(()=>document.body.classList.add('sm-sheet-only'));if(css)await page.addStyleTag({content:css});
const out=`${__dirname}/out/sm1/shots/pg-${k}.pdf`;await page.pdf({path:out,printBackground:true,preferCSSPageSize:true});
console.log(k,pm.execSync(`python3 -c "import pymupdf;print(pymupdf.open('${out}').page_count)"`).toString().trim());await page.close();}
await br.close();})();
