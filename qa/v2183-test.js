/* v21.83 room for the form on the iPad (the shell), and since v25.63 the one top bar: the rarer buttons are in its Packet,
   Case and Tools menus (each runs the bar's own button) at every width; upright, Case map, Documents and Finish PDF go into
   Tools too; the student's details fold to one line when the first form opens. usage: node qa/v2183-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const errs=[];
  for(const [w,h,touch] of [[1180,820,true],[820,1180,true],[1440,1000,false]]){
    const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:touch});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
    /* v25.63: one top bar at every width: Forms, Case map, Documents, the Packet, Case and Tools menus, Help, then Save case,
       Print and Finish PDF. Upright (900 px or less) Case map, Documents and Finish PDF move into Tools. The rarer buttons are
       in the menus, and each menu item runs the bar's own button. */
    const vis=await page.evaluate(()=>{const v=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null;};return {save:v('savePacket'),xlsx:v('caseXlsx'),diag:v('diag'),pdf:v('bookmarkPdf'),help:v('help'),map:v('caseMap'),doc:v('readDoc'),docText:(()=>{const l=document.querySelector('#readDoc .lbl');return !!l&&l.getBoundingClientRect().width>30&&/Documents/.test(l.textContent);})(),saveCase:v('saveCase'),print:v('masterPrint'),menus:[...document.querySelectorAll('#wsNav [data-wn-menu]')].filter(e=>e.offsetParent).map(e=>e.dataset.wnMenu).join(),sideways:document.documentElement.scrollWidth>innerWidth+1};});
    const wide=w>900,pdfOn=w>1300;   /* v25.65 top bar A: Today and Caseload joined the bar, so Finish PDF goes into Tools at 1300 px and less */
    ok(w+'x'+h+' the rare buttons are in the menus; Help, Save case and Print on the bar'+(wide?', with Case map and Documents':'')+(pdfOn?' and Finish PDF':'')+'; no sideways scroll',!vis.save&&!vis.xlsx&&!vis.diag&&vis.help&&vis.saveCase&&vis.print&&vis.menus==='packet,case,tools'&&vis.map===wide&&vis.doc===wide&&vis.docText===wide&&vis.pdf===pdfOn&&!vis.sideways,vis);
    const items=async k=>{await page.evaluate(k=>__wsNav.open(k),k);await sleep(250);return page.evaluate(()=>{const M=document.getElementById('wsNavMenu'),r=M.getBoundingClientRect();return {open:!M.hidden,items:[...M.querySelectorAll('[data-wn-for]')].filter(e=>e.offsetParent).map(e=>e.textContent),inside:r.left>=0&&r.right<=innerWidth};});};
    const pk=await items('packet'),cs=await items('case'),tl=await items('tools');
    ok(w+'x'+h+' Packet has Save and Open packet; Case has Open, Close, Case as spreadsheet and History; Tools has Fill open forms, Staff directory and Diagnostics'+(wide?'':', with Read a document, Case map and Finish PDF')+'; inside the screen',
      pk.open&&pk.inside&&pk.items.join()==='Save packet,Open packet'&&cs.inside&&['Open case','Close case','Case as spreadsheet','History'].every(x=>cs.items.includes(x))&&tl.inside&&['Fill open forms','Staff directory','Diagnostics'].every(x=>tl.items.includes(x))
      &&['Read a document','Case map'].every(x=>tl.items.includes(x)===!wide)&&tl.items.includes('Finish PDF')===!pdfOn,{pk,cs,tl});
    await page.evaluate(()=>__wsNav.shut());
    const tools=page.locator('#wsNav [data-wn-menu="tools"]');if(touch)await tools.tap();else await tools.click();await sleep(250);
    const ex=await page.evaluate(()=>document.querySelector('#wsNav [data-wn-menu="tools"]').getAttribute('aria-expanded'));
    const di=page.locator('#wsNavMenu [data-wn-for="diag"]');if(touch)await di.tap();else await di.click();await sleep(500);
    const d=await page.evaluate(()=>({menu:document.getElementById('wsNavMenu').hidden,dlg:document.getElementById('dlg').open}));
    ok(w+'x'+h+' Tools → Diagnostics runs the bar\'s own button (the menu closes)',ex==='true'&&d.menu&&d.dlg,{ex,...d});
    await page.evaluate(()=>{try{document.getElementById('dlg').close();}catch(e){}});
    await page.focus('#wsNav [data-wn-menu="case"]');await page.keyboard.press('Enter');await sleep(250);await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await sleep(200);
    ok(w+'x'+h+' Escape closes the menu and goes back to its button',await page.evaluate(()=>document.getElementById('wsNavMenu').hidden&&document.activeElement===document.querySelector('#wsNav [data-wn-menu="case"]')));
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
  {const ctx=await br.newContext({viewport:{width:1300,height:900}});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1000);
    const L=await page.evaluate(()=>rsItems({plan:{rep:'x',targets:[{label:'Hitting',fn:'escape',covered:true},{label:'Screaming',fn:'attention',covered:false}]}}).map(x=>x.t));
    ok('Ready to start names a target the plan does not address yet (TD-1 Targets in this plan)',L.some(t=>/Not addressed by the plan yet: Screaming \(attention\)/.test(t))&&!L.some(t=>/: Hitting/.test(t)),L);await ctx.close();}
  ok('no page errors',!errs.length,errs.slice(0,4));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
