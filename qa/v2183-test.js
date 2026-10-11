/* v21.83 room for the form on the iPad (the shell): on a screen 1194 px wide or less, Save packet, Open packet, Case as
   spreadsheet, Diagnostics and Finish PDF go into More (each runs the bar's own button); wider, they stay on the bar; the
   student's details fold to one line when the first form opens. usage: node qa/v2183-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const errs=[];
  for(const [w,h,touch] of [[1180,820,true],[820,1180,true],[1440,1000,false]]){
    const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:touch});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
    const vis=await page.evaluate(()=>{const v=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null;};return {save:v('savePacket'),xlsx:v('caseXlsx'),diag:v('diag'),pdf:v('bookmarkPdf'),more:v('moreBtn'),help:v('help'),map:v('caseMap'),saveCase:v('saveCase'),sideways:document.documentElement.scrollWidth>innerWidth+1};});
    if(w<=1194){
      ok(w+'x'+h+' the rare buttons are in More; Help, Case map and Save case stay; no sideways scroll',!vis.save&&!vis.xlsx&&!vis.diag&&!vis.pdf&&vis.more&&vis.help&&vis.map&&vis.saveCase&&!vis.sideways,vis);
      await page.evaluate(()=>document.getElementById('moreBtn').click());await sleep(300);
      const m=await page.evaluate(()=>{const M=document.getElementById('moreMenu'),r=M.getBoundingClientRect();return {open:!M.hidden,items:[...M.querySelectorAll('button')].map(b=>b.textContent),inside:r.left>=0&&r.right<=innerWidth,exp:document.getElementById('moreBtn').getAttribute('aria-expanded')};});
      ok(w+'x'+h+' More lists the five, inside the screen',m.open&&m.items.length===5&&m.inside&&m.exp==='true',m);
      await page.evaluate(()=>document.querySelector('#moreMenu [data-more="diag"]').click());await sleep(500);
      const d=await page.evaluate(()=>({menu:document.getElementById('moreMenu').hidden,dlg:document.getElementById('dlg').open,title:(document.querySelector('#dlg h2,#dlgTitle')||{}).textContent||''}));
      ok(w+'x'+h+' More → Diagnostics runs the bar\'s own button (the menu closes)',d.menu&&d.dlg,d);
      await page.evaluate(()=>{try{document.getElementById('dlg').close();}catch(e){}});
      await page.evaluate(()=>document.getElementById('moreBtn').click());await sleep(200);await page.keyboard.press('Escape');await sleep(200);
      ok(w+'x'+h+' Escape closes More',await page.evaluate(()=>document.getElementById('moreMenu').hidden));
    }else ok(w+'x'+h+' wider: the buttons stay on the bar, no More',vis.save&&vis.xlsx&&vis.diag&&vis.pdf&&!vis.more,vis);
    /* the bar folds when the first form opens */
    await page.fill('#pClient','Mateo Rivera');await page.dispatchEvent('#pClient','input');await sleep(300);
    /* still typing (the name field in focus): no fold */
    await page.focus('#pClient');await page.evaluate(()=>openForm('TB-1'));await sleep(800);
    const typing=await page.evaluate(()=>document.body.classList.contains('bar-folded'));
    ok(w+'x'+h+' while the name is being typed, opening a form does not fold the details',!typing);
    await page.evaluate(()=>{document.activeElement.blur();state.barTyped=0;state.barAuto=false;});
    const before=await page.evaluate(()=>document.body.classList.contains('bar-folded'));
    await page.evaluate(()=>openForm('IC-1'));await sleep(1500);
    const after=await page.evaluate(()=>document.body.classList.contains('bar-folded'));
    ok(w+'x'+h+' the details fold to one line when the first form opens',!before&&after,{before,after});
    await ctx.close();}
  ok('no page errors',!errs.length,errs.slice(0,4));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
