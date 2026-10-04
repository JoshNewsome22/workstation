/* shell-check.js <label>: the workstation's new views - fullscreen, hidden list, phone packet bar. */
const L=require('./lib');
const label=process.argv[2]||'after', EDITION='NBH-Workstation';
const DIR=L.path.join(__dirname,'shots',label); L.fs.mkdirSync(DIR,{recursive:true});
(async()=>{
  const browser=await L.chromium.launch(); const log=[];
  const ctx=await browser.newContext({viewport:{width:1440,height:900}}); await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage(); L.wire(page,log);
  await page.goto(`${L.BASE}/${EDITION}/index.html`,{waitUntil:'load'}); await L.sleep(600);
  await page.evaluate(()=>openForm('CR-1')); await page.waitForFunction(()=>!!state.status['CR-1'],null,{timeout:20000}).catch(()=>{});
  const fr=page.frames().find(x=>x.url().includes('CR-1_')); if(fr){await L.loadSim(fr);await L.sleep(1200);}
  /* the simulation's notice (the form's own dialog, v21.34) is closed first: while a dialog is open in the form, Escape
     is the dialog's, not the workstation's */
  if(fr) await fr.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
  await page.screenshot({path:L.path.join(DIR,'shell-CR-1.png')});
  await page.click('#fullBtn'); await L.sleep(500);
  await page.screenshot({path:L.path.join(DIR,'shell-CR-1-full.png')});
  const full1=await page.evaluate(()=>document.body.classList.contains('ws-full'));
  await page.keyboard.press('Escape'); await L.sleep(300);
  const full2=await page.evaluate(()=>document.body.classList.contains('ws-full'));
  /* Escape from inside the form */
  await page.click('#fullBtn'); await L.sleep(300);
  await fr.click('body'); await fr.press('body','Escape'); await L.sleep(400);
  const full3=await page.evaluate(()=>document.body.classList.contains('ws-full'));
  await fr.press('body','Control+Shift+F'); await L.sleep(400);
  const full4=await page.evaluate(()=>document.body.classList.contains('ws-full'));
  await page.keyboard.press('Control+Shift+F'); await L.sleep(300);
  const full5=await page.evaluate(()=>document.body.classList.contains('ws-full'));
  console.log('fullscreen on/esc/esc-from-form/key-from-form/key:',full1,full2,full3,full4,full5);
  await page.click('#railHide'); await L.sleep(400);
  await page.screenshot({path:L.path.join(DIR,'shell-CR-1-nolist.png')});
  const hid=await page.evaluate(()=>[document.body.classList.contains('rail-hidden'),localStorage.getItem('nbh.ws.rail'),getComputedStyle(document.querySelector('#railToggle')).display]);
  await page.click('#railToggle'); await L.sleep(300);
  const shown=await page.evaluate(()=>document.body.classList.contains('rail-hidden'));
  console.log('rail hidden state:',hid,'after toggle hidden?',shown);
  await page.focus('#pClient'); await page.screenshot({path:L.path.join(DIR,'shell-focus-bar.png'),clip:{x:0,y:0,width:900,height:130}});
  await page.click('#help'); await L.sleep(300); await page.screenshot({path:L.path.join(DIR,'shell-help.png')});
  await page.keyboard.press('Escape'); await L.sleep(200);
  await page.click('#closeForm'); await L.sleep(400); await page.screenshot({path:L.path.join(DIR,'shell-empty.png')});
  await ctx.close();
  /* tablet drawer */
  const t=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true}); const tp=await t.newPage(); L.wire(tp,log);
  await tp.goto(`${L.BASE}/${EDITION}/index.html`,{waitUntil:'load'}); await L.sleep(600);
  await tp.screenshot({path:L.path.join(DIR,'shell-tablet-drawer.png')});
  await tp.evaluate(()=>openForm('TI-1')); await tp.waitForFunction(()=>!!state.status['TI-1'],null,{timeout:20000}).catch(()=>{});
  const tf=tp.frames().find(x=>x.url().includes('TI-1_')); if(tf){await L.loadSim(tf);await L.sleep(1200);}
  await tp.screenshot({path:L.path.join(DIR,'shell-tablet-TI-1.png')});
  await tp.click('#fullBtn'); await L.sleep(400); await tp.screenshot({path:L.path.join(DIR,'shell-tablet-TI-1-full.png')});
  await t.close();
  /* phone */
  const p=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}); const pp=await p.newPage(); L.wire(pp,log);
  await pp.goto(`${L.BASE}/${EDITION}/index.html`,{waitUntil:'load'}); await L.sleep(600);
  await pp.screenshot({path:L.path.join(DIR,'shell-phone-start.png')});
  await pp.click('#barToggle'); await L.sleep(300); await pp.screenshot({path:L.path.join(DIR,'shell-phone-bar.png')});
  await pp.click('#barToggle'); await L.sleep(200);
  await pp.evaluate(()=>openForm('DD-1')); await pp.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:20000}).catch(()=>{});
  const pf=pp.frames().find(x=>x.url().includes('Daily_')); if(pf){await L.loadSim(pf);await L.sleep(1200);}
  await pp.screenshot({path:L.path.join(DIR,'shell-phone-DD-1.png')});
  await pp.click('#fullBtn'); await L.sleep(400); await pp.screenshot({path:L.path.join(DIR,'shell-phone-DD-1-full.png')});
  await p.close();
  await browser.close();
  console.log('errors:',JSON.stringify(log.slice(0,10)));
})().catch(e=>{console.error(e);process.exit(1);});
