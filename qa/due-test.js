/* v21.35 what is due: PR-1, SA-1 and CN-1 simulations put review dates and next steps on the shell's due line */
const {chromium,BASE,wire,sleep}=require('/home/user/workstation/qa/lib.js');
(async()=>{
  const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(800);
  const open=async id=>{await page.evaluate(id=>openForm(id),id);const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const sim=async id=>{const f=await open(id);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(900);return f;};
  const out={};
  for(const id of ['PR-1','SA-1','CN-1','SM-1','ST-1']){const f=await sim(id);out[id]=await f.evaluate(()=>{const o=window.nbhCase&&nbhCase.out&&nbhCase.out();return o&&o.due;});}
  console.log('FORM DUE',JSON.stringify(out,null,1));
  await sleep(7000);
  console.log('SHELL',JSON.stringify(await page.evaluate(()=>({n:state.due.length,items:state.due.map(x=>x.id+' '+x.what+' '+x.n),sum:$('#sumDue').textContent,facts:$('#factsDue').textContent}))));
  await page.screenshot({path:'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/due/shell-due.png'});
  console.log('LOG',JSON.stringify(log.slice(0,12)));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
