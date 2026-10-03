/* v21.36: the case as a spreadsheet: CSV-exporting forms give their CSV, the others every field by name */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/v2136/';
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:900},acceptDownloads:true});const page=await ctx.newPage();wire(page,log);
 const downloads=[];page.on('download',d=>downloads.push(d.suggestedFilename()));
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 const open=async id=>{await page.evaluate(i=>openForm(i),id);const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
 for(const id of ['TB-1','MT-1','SA-1','DD-1','ABC-1','CN-1']){const f=await open(id);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};const b=[...document.querySelectorAll('button')].find(b=>/^load simulation/i.test(b.textContent.trim()));if(b)b.click();});await sleep(900);}
 await page.evaluate(()=>{$('#pClient').value='Sample Student';$('#pSid').value='SIM-000';});
 const t0=Date.now();
 const b64=await page.evaluate(async()=>{const b=await exportCaseXlsx({bytes:true});let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);});
 fs.writeFileSync(OUT+'case.xlsx',Buffer.from(b64,'base64'));console.log('xlsx bytes',Buffer.from(b64,'base64').length,'ms',Date.now()-t0);
 /* the forms are left as they were: no download fired, the helpers restored, no silence left on */
 for(const id of ['MT-1','SA-1','DD-1','ABC-1','CN-1']){const fr=await (await page.$(`iframe[title*="Form ${id})"]`)).contentFrame();console.log(id,JSON.stringify(await fr.evaluate(()=>({silent:!!window.__nbhSilent,objUrl:URL.createObjectURL.toString().length<60,click:HTMLAnchorElement.prototype.click.toString().indexOf('native')>0}))));}
 console.log('downloads during export',JSON.stringify(downloads));
 /* the real button downloads a file */
 const [dl]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.evaluate(()=>$('#caseXlsx').click())]);console.log('download',dl.suggestedFilename());
 console.log('LOG',JSON.stringify(log).slice(0,500));await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
