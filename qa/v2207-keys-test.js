/* v22.07 the keyboard on the laptop (review F489, F490, F492): "Skip to the open form" takes the second Tab from the top
   into the open form's first field; Go to (Ctrl K) keeps the focus while open and gives it back on Escape; Today puts
   the focus on its title; in a form, a field reached by Tab or Shift+Tab is never left under the pinned toolbar.
   Simulated data only.   usage: node qa/v2207-keys-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>state.cur==='DM-1'&&!!state.status['DM-1'],null,{timeout:30000});await sleep(1200);
  await page.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0);});
  await page.keyboard.press('Tab');const s1=await page.evaluate(()=>document.activeElement.textContent);
  await page.keyboard.press('Tab');const s2=await page.evaluate(()=>document.activeElement.textContent);
  await page.keyboard.press('Enter');await sleep(400);
  const into=await page.evaluate(()=>{const fr=state.frames['DM-1'];const a=document.activeElement;const ia=fr.contentDocument.activeElement;return {frame:a===fr,tag:ia&&ia.tagName,name:ia&&(ia.name||ia.id)};});
  ok('1 the second Tab from the top is "Skip to the open form"; Enter puts the cursor in the open form\'s first field',s1==='Skip to the form list'&&s2==='Skip to the open form'&&into.frame&&/INPUT|SELECT|TEXTAREA/.test(into.tag||''),{s1,s2,into});
  await page.evaluate(()=>document.getElementById('help').focus());
  await page.keyboard.press('Control+k');await sleep(300);
  const o1=await page.evaluate(()=>document.activeElement.id);
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');const o2=await page.evaluate(()=>document.activeElement.id);
  await page.keyboard.press('Escape');await sleep(200);const o3=await page.evaluate(()=>({id:document.activeElement.id,open:document.getElementById('pal').classList.contains('on'),modal:document.getElementById('pal').getAttribute('aria-modal')}));
  ok('2 Go to (Ctrl K): the focus is in its box, Tab keeps it there, Escape closes it and puts the focus back on the button it came from',o1==='palIn'&&o2==='palIn'&&o3.id==='help'&&!o3.open&&o3.modal==='true',{o1,o2,o3});
  await page.evaluate(()=>todayOpen());await sleep(900);
  const t=await page.evaluate(()=>({id:document.activeElement.id,t:document.activeElement.textContent}));
  await page.evaluate(()=>document.getElementById('dlg').close());
  ok('3 Today: the focus is on its title as it opens',t.id==='dlgTitle'&&/^Today/.test(t.t),t);
  /* the form on its own: a field the browser would leave under the pinned toolbar comes out from under it */
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.setViewportSize({width:1100,height:700});
  await p2.goto(BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(1800);
  const f=await p2.evaluate(async()=>{const tb=document.querySelector('.toolbar');const h=tb.getBoundingClientRect().height;const pad=document.documentElement.style.scrollPaddingTop;
    const fs=[...document.querySelectorAll('input[type=text],textarea')].filter(x=>x.offsetParent&&!x.closest('.toolbar'));const el=fs[Math.min(12,fs.length-1)];
    const y=el.getBoundingClientRect().top+window.scrollY;window.scrollTo(0,y-10);await new Promise(r=>setTimeout(r,100));const before=el.getBoundingClientRect().top;
    el.focus();await new Promise(r=>setTimeout(r,200));return {h:Math.round(h),pad,before:Math.round(before),after:Math.round(el.getBoundingClientRect().top)};});
  ok('4 a form on its own: the page keeps a scroll margin the toolbar\'s height, and a field focused under the toolbar is brought out below it',parseInt(f.pad,10)>=f.h&&f.before<f.h&&f.after>=f.h,f);
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
