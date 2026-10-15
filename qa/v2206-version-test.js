/* v22.06 the version in Help and Diagnostics, held to the newest heading in SETUP.md; and two keyboard and screen-reader
   fixes in the workstation: the Autosave chip is not a live region (review F491), and the arrow keys switch the open form
   only from a row of the form list, never from Help or a button (F487). DD-1's blank week prints without the episodes
   (F484). Simulated data only.   usage: node qa/v2206-version-test.js */
const fs=require('fs'),path=require('path');
const {chromium,BASE,ROOT,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();
  try{
  const root=ROOT||path.join(__dirname,'..');
  const setup=fs.readFileSync(path.join(root,'NBH-Workstation','SETUP.md'),'utf8');
  const vs=[...setup.matchAll(/^### (v\d+\.\d+)[a-z]?:/gm)].map(m=>m[1]);
  const newest=vs.sort((a,b)=>{const p=x=>x.slice(1).split('.').map(Number);const [a1,a2]=p(a),[b1,b2]=p(b);return a1-b1||a2-b2;}).pop();
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  const rel=await page.evaluate(()=>WS_REL);
  ok('1 the version the workstation names is the newest one SETUP.md describes ('+newest+')',rel===newest,{rel,newest});
  await page.evaluate(()=>document.getElementById('help').click());await sleep(500);
  const hv=await page.evaluate(()=>(document.getElementById('hpVer')||{}).textContent||'');
  await page.evaluate(()=>document.getElementById('dlg').close());
  await page.evaluate(()=>document.getElementById('diag').click());await sleep(800);
  const dv=await page.evaluate(()=>{const tr=[...document.querySelectorAll('#dlgBody tr')].find(r=>/^Version$/.test((r.cells[0]||{}).textContent||''));return tr?tr.cells[1].textContent:'';});
  await page.evaluate(()=>document.getElementById('dlg').close());
  ok('2 Help says "This is version '+rel+' of the workstation." and Diagnostics has a Version row',hv==='This is version '+rel+' of the workstation.'&&dv===rel,{hv,dv});
  const live=await page.evaluate(()=>{const c=document.getElementById('autoChip');return {aria:c.getAttribute('aria-live'),role:c.getAttribute('role')};});
  ok('3 the Autosave chip is not a live region (VoiceOver does not read each autosave over the typing)',live.aria===null&&live.role!=='status',live);
  const said=await page.evaluate(async()=>{const l=document.getElementById('live');l.textContent='';state.auto.at=new Date();chip();const a=l.textContent;state.auto.at=new Date(Date.now()+60000);chip();const b=l.textContent;
    const was=autoOn();autoSet(false);const c=l.textContent;l.textContent='';chip();const d=l.textContent;autoSet(was);return {a,b,c,d};});
  ok('4 a new autosave time says nothing; Autosave turned off is said once in the status line, not again on the next refresh',said.a===''&&said.b===''&&said.c==='Autosave off'&&said.d==='',said);
  /* the arrows: with a form open, from Help and from a button, nothing changes; from a row of the list, the next form opens */
  await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>state.cur==='DM-1',null,{timeout:20000});await sleep(800);
  await page.evaluate(()=>document.getElementById('help').click());await sleep(400);
  await page.evaluate(()=>{const p=document.querySelector('#dlgBody p');if(p){p.tabIndex=-1;p.focus();}});await page.keyboard.press('ArrowDown');await sleep(600);const c1=await page.evaluate(()=>state.cur);
  await page.evaluate(()=>document.getElementById('dlg').close());
  await page.evaluate(()=>document.getElementById('help').focus());await page.keyboard.press('ArrowDown');await sleep(600);const c2=await page.evaluate(()=>state.cur);
  await page.evaluate(()=>{const b=railButton('DM-1');if(b)b.focus();});await page.keyboard.press('ArrowDown');await sleep(1200);const c3=await page.evaluate(()=>state.cur);
  ok('5 the arrow keys: in Help and on the Help button the open form stays DM-1; on DM-1\'s row of the list the next form opens',c1==='DM-1'&&c2==='DM-1'&&c3!=='DM-1'&&!!c3,{c1,c2,c3});
  /* DD-1: the blank week to print leaves out the episodes already recorded */
  const p2=await ctx.newPage();await p2.goto(BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1500);
  const ep=await p2.evaluate(()=>{const e=document.getElementById('epSummary');if(!e)return null;e.innerHTML='<h3>Episodes by day</h3>';document.body.classList.add('dd-blank-on');const a=getComputedStyle(e).display;document.body.classList.remove('dd-blank-on');const b=getComputedStyle(e).display;return {a,b};});
  ok('6 DD-1\'s blank week: the episodes already recorded are hidden while it is on, shown again after',ep&&ep.a==='none'&&ep.b!=='none',ep);
  ok('7 no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
