/* v25.75 (the BCBA, 11/10) the forms list: a tap on the open form's own row folds its sheets away; the next tap brings
   them back; another form opened shows its own sheets; a sheet row still goes to its sheet. Simulated names only. */
const L=require(__dirname+'/lib.js');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0,n=0;const ok=(name,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+name+(c||i===undefined?'':'  '+JSON.stringify(i).slice(0,400)));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();
 for(const [tag,vp] of [['wide',{width:1440,height:900}],['iPad',{width:1180,height:820}]]){
  const c=await br.newContext({viewport:vp,hasTouch:tag==='iPad',serviceWorkers:'block'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await c.addInitScript(()=>{try{localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.where@rps','files');localStorage.setItem('nbh.ws.installTip','dismissed');}catch(e){}});
  await p.goto((process.env.WS_URL||'http://127.0.0.1:8123')+'/NBH-Workstation/index.html');await sleep(2500);
  await p.evaluate(()=>{const e=document.querySelector('#pClient');e.value='Sim Student (example)';e.dispatchEvent(new Event('input',{bubbles:true}));openForm('DM-1');});
  await p.waitForFunction(()=>!!document.querySelector('#rail .sr-shli [data-srsheet]'),null,{timeout:30000});
  const show=()=>p.evaluate(()=>{try{setRail(true,false);}catch(e){}document.body.classList.remove('rail-hidden');});
  const st=()=>p.evaluate(()=>{const li=document.querySelector('#rail .item[data-id="'+state.cur+'"]'),x=document.querySelector('#rail .sr-shli');const hb=li&&(li.querySelector('button,a')||li);
    return {cur:state.cur,sheets:x?x.querySelectorAll('[data-srsheet]').length:0,after:!!(x&&x.previousElementSibling===li),exp:hb&&hb.getAttribute('aria-expanded'),frames:Object.keys(state.frames).length};});
  const row=id=>p.locator('#rail .item[data-id="'+id+'"]').first();
  await show();const a=await st();ok(tag+': the open form shows its sheets under its row ('+a.sheets+')',a.cur==='DM-1'&&a.sheets>=2&&a.after&&a.exp==='true',a);
  await row('DM-1').click({position:{x:60,y:12}});await sleep(600);await show();const b=await st();
  ok(tag+': a tap on the open form’s row folds the sheets away; the form stays open',b.cur==='DM-1'&&b.sheets===0&&b.exp==='false'&&b.frames===a.frames,b);
  const arrow=()=>p.evaluate(()=>{const b=document.querySelector('#rail .item[data-id="'+state.cur+'"] .open');const c=getComputedStyle(b,'::after');return {w:c.width,t:c.transform,d:c.display};});
  const ar1=await arrow();
  await sleep(700);const b2=await st();ok(tag+': they stay folded (the list repaints without bringing them back)',b2.sheets===0,b2);
  await row('DM-1').click({position:{x:60,y:12}});await sleep(600);await show();const d=await st();
  ok(tag+': the next tap brings them back',d.sheets===a.sheets&&d.after&&d.exp==='true',d);
  const ar2=await arrow();ok(tag+': the row carries an arrow that turns when the sheets fold',ar1.w==='8px'&&ar2.w==='8px'&&ar1.d!=='none'&&ar1.t!==ar2.t&&ar1.t!=='none',{ar1,ar2});
  await p.locator('#rail .sr-shli [data-srsheet="1"]').click();await sleep(700);await show();
  const s2=await p.evaluate(()=>{const b=document.querySelector('#rail .sr-shli [data-srsheet="1"]');return !!b&&b.getAttribute('aria-current')==='true';});
  ok(tag+': a sheet row still goes to its sheet',s2);
  await row('DM-1').click({position:{x:60,y:12}});await sleep(500);await show();
  await p.evaluate(()=>openForm('IC-1'));await p.waitForFunction(()=>state.cur==='IC-1',null,{timeout:20000});await sleep(1500);await show();const e2=await st();
  const stale=await p.evaluate(()=>{const b=document.querySelector('#rail .item[data-id="DM-1"] .open');return b.hasAttribute('aria-expanded');});ok(tag+': the row of a form that is no longer open carries no arrow',!stale);
  await p.evaluate(()=>openForm('DM-1'));await sleep(1200);await show();const e3=await st();
  ok(tag+': folded is for that visit only: after another form, coming back shows the sheets again',e2.cur==='IC-1'&&e3.cur==='DM-1'&&e3.sheets===a.sheets,{e2,e3});
  ok(tag+': no page error',!errs.length,errs.slice(0,3));await c.close();}
 await br.close();console.log('\nRESULT: '+(fails?fails+' failed of '+n:'all passed'));process.exit(fails?1:0);})();
