/* v25.76 (research 2, #21; the BCBA, 11/11) the pocket clicker: a presentation remote's Next adds one to the chosen counted
   behavior, Back takes its last one off, Next held moves on to the next counted behavior. DD-1's Live Recording and OB-1's
   Live Recorder. The remote is stood in for by its key presses (Page Down, Page Up). Simulated data only. */
const L=require(__dirname+'/lib.js');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0,n=0;const ok=(name,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+name+(c||i===undefined?'':'  '+JSON.stringify(i).slice(0,500)));if(!c)fails++;};
const BASE=process.env.WS_URL||L.BASE;
(async()=>{const br=await L.chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  /* ---------- DD-1 ---------- */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('DD-1: '+e.message));await p.goto(BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1200);
  await p.evaluate(async()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;await loadExample();});await sleep(600);
  const st=()=>p.evaluate(()=>{return {...ddClkState(),
    big:document.getElementById('ddlClk').hidden?'':document.getElementById('ddlClkN').textContent+'|'+document.getElementById('ddlClkW').textContent,
    mark:[...document.querySelectorAll('#ddlCards .ddl-clkon')].length,hint:!document.getElementById('ddlClkHint').hidden,msg:document.getElementById('ddlMsg').textContent};});
  await p.evaluate(()=>{const l=S.behaviors;l[0].measure='count';if(l[1])l[1].measure='count';renderBehaviors();renderData();showTab('data');const f=document.getElementById('ddlFold');if(f&&f.getAttribute('aria-expanded')==='false')f.click();document.body.focus();});await sleep(400);
  const a0=await st();ok('DD-1: the clicker is off until asked for; its hint is hidden',a0.on===false&&!a0.hint&&a0.mark===0&&a0.ids.length>=2,a0);
  await p.keyboard.press('PageDown');await sleep(150);const a1=await st();ok('DD-1: off, Next does nothing',a1.ev===0&&a1.big==='',a1);
  await p.locator('.ddl-tog[data-p="clicker"]').click();await sleep(200);await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
  const a2=await st();ok('DD-1: turned on, the hint shows and one counted behavior is marked Clicker',a2.on&&a2.hint&&a2.mark===1,a2);
  await p.keyboard.press('PageDown');await sleep(150);const a3=await st();ok('DD-1: before Start, Next adds nothing and says to press Start',a3.ev===0&&/press Start first/.test(a3.msg),a3);
  await p.locator('#ddlStart').click();await sleep(300);await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
  await p.keyboard.press('PageDown');await sleep(120);await p.keyboard.press('ArrowRight');await sleep(120);await p.keyboard.press('PageDown');await sleep(150);
  const b1=await st();ok('DD-1: Next three times counts three on the first counted behavior, confirmed in large type',b1.n[0]===3&&b1.n[1]===0&&/^3\|/.test(b1.big),b1);
  await p.keyboard.press('PageUp');await sleep(150);const b2=await st();ok('DD-1: Back takes one off (2), and says so',b2.n[0]===2&&/^2\|.*one taken off/.test(b2.big),b2);
  /* Next held: the first press counts, the repeats move the clicker on and take that count back */
  await p.keyboard.down('PageDown');await p.keyboard.down('PageDown');await p.keyboard.down('PageDown');await p.keyboard.up('PageDown');await sleep(200);
  const c1=await st();ok('DD-1: Next held moves the clicker to the next counted behavior and adds nothing',c1.n[0]===2&&c1.n[1]===0&&c1.cur===c1.ids[1]&&/Now counting/.test(c1.big)&&c1.mark===1,c1);
  await p.keyboard.press('PageDown');await sleep(150);const c2=await st();ok('DD-1: Next now counts the second behavior',c2.n[0]===2&&c2.n[1]===1,c2);
  await p.keyboard.press('PageUp');await p.keyboard.press('PageUp');await sleep(150);const c3=await st();ok('DD-1: Back with nothing left of that behavior leaves the other behavior’s count alone',c3.n[0]===2&&c3.n[1]===0,c3);
  /* never in a field: the arrows keep their own job there */
  const f=await p.evaluate(()=>{const i=document.getElementById('ddlPlan');i.focus();return ddClkState().ev;});await p.keyboard.press('ArrowRight');await p.keyboard.press('PageDown');await sleep(150);
  const f2=await st();ok('DD-1: in a field the clicker keys count nothing',f2.ev===f,{f,f2});
  const kept=await p.evaluate(()=>liveSettings(S.settings.live).clicker===true&&liveSettings({}).clicker===false&&liveSettings({clicker:'yes'}).clicker===false);
  ok('DD-1: the choice is kept with the record’s settings, and a file without it opens with the clicker off',kept);
  await p.close();
  if(process.env.CLK_OB1!=='0'){
  /* ---------- OB-1 ---------- */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('OB-1: '+e.message));q.on('dialog',d=>d.accept());await q.goto(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(1500);
  const os=()=>q.evaluate(()=>({s:+document.getElementById('obrNS').textContent,p:+document.getElementById('obrNP').textContent,on:document.getElementById('obrClkOn').getAttribute('aria-pressed'),
    big:document.getElementById('obrClk').hidden?'':document.getElementById('obrClkN').textContent+'|'+document.getElementById('obrClkW').textContent,who:document.querySelectorAll('.obr-clkon').length,hint:!document.getElementById('obrClkHint').hidden}));
  await q.evaluate(()=>document.querySelector('#viewSeg [data-view="obs"]').click());await sleep(400);
  const o0=await os();ok('OB-1: the clicker is off until asked for',o0.on==='false'&&!o0.hint&&o0.who===0,o0);
  await q.locator('#obrClkOn').click();await sleep(150);await q.locator('#obrStart').click();await sleep(300);await q.evaluate(()=>document.activeElement&&document.activeElement.blur());
  await q.keyboard.press('PageDown');await sleep(100);await q.keyboard.press('PageDown');await sleep(150);
  const o1=await os();ok('OB-1: Next twice counts two for the student, confirmed in large type',o1.s===2&&o1.p===0&&/^2\|/.test(o1.big)&&o1.who===1,o1);
  await q.keyboard.press('PageUp');await sleep(150);const o2=await os();ok('OB-1: Back takes one off (1)',o2.s===1,o2);
  await q.keyboard.down('PageDown');await q.keyboard.down('PageDown');await q.keyboard.down('PageDown');await q.keyboard.up('PageDown');await sleep(200);
  const o3=await os();ok('OB-1: Next held moves the clicker to the peer and adds nothing',o3.s===1&&o3.p===0&&/Now counting/.test(o3.big),o3);
  await q.keyboard.press('PageDown');await sleep(150);const o4=await os();ok('OB-1: Next now counts the peer',o4.s===1&&o4.p===1,o4);
  await q.close();}
  ok('no page error',!errs.length,errs.slice(0,3));
  await br.close();console.log('\nRESULT: '+(fails?fails+' failed of '+n:'all passed'));process.exit(fails?1:0);})();
