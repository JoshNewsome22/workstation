const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const log=[];const br=await chromium.launch();
 for(const [file,view] of [['CF-1_Contextual-Fit-Assessment_v2026-09.html','rate'],['OB-1_Direct-Observation-Record_v2026-09.html','obs'],['SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','targets'],['TB-1_Target-Behavior-Development_v2026-09.html','']]){
  const page=await br.newPage({viewport:{width:1200,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(900);
  const before=await page.evaluate(()=>[...document.querySelectorAll('#viewSeg button')].map(b=>b.dataset.view+':'+(b.dataset.nbhFill||'-')+' '+b.title));
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(1500);
  const after=await page.evaluate(()=>[...document.querySelectorAll('#viewSeg button')].map(b=>b.dataset.view+':'+(b.dataset.nbhFill||'-')+' '+b.title));
  const t=await page.evaluate(async()=>{alert('short notice');const n1=document.querySelectorAll('.nbh-toast').length;alert('A long notice.\n\nWith a second paragraph that would not fit in a toast and so goes to the styled notice dialog instead.');const open=document.querySelector('#nbhUiDlg').open;document.querySelector('#nbhUiF button').click();
    const p=window.nbhUI.confirm('Delete this row?\nThe row holds an entry.',{danger:true,ok:'Delete'});await new Promise(r=>setTimeout(r,50));const q=document.querySelector('#nbhUiDlg').open,btns=[...document.querySelectorAll('#nbhUiF button')].map(b=>b.textContent);document.querySelector('#nbhUiF button.danger').click();const v=await p;
    window.confirm=()=>false;const v2=await window.nbhUI.confirm('stubbed?');return {toasts:n1,dlgOpen:open,confirmOpen:q,btns,v,v2};});
  console.log(file.slice(0,5),'before',JSON.stringify(before.slice(0,4)),'after',JSON.stringify(after.slice(0,4)),JSON.stringify(t));
  await page.close();}
 /* touch */
 const ctx=await br.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p2=await ctx.newPage();wire(p2,log);
 await p2.goto(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(900);await p2.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
 console.log('touch sizes',await p2.evaluate(()=>{const r=e=>e?Math.round(e.getBoundingClientRect().height):null;return {delRow:r(document.querySelector('.delRow')),iv:r(document.querySelector('button.iv')),check:r(document.querySelector('.checks input')),toolbarBtn:r(document.querySelector('.toolbar button')),coarse:matchMedia('(pointer:coarse)').matches};}));
 console.log('LOG',JSON.stringify(log).slice(0,400));await br.close();})();
