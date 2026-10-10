/* v21.78 touch targets on an iPad: a tap in a table cell beside its one checkbox ticks it (Form TB-1's check grid, RA-1's
   grid), a checkbox is 24 px, a checkbox label's tap area 36 px high; in the shell a tap beside a form's tick box ticks it.
   usage: node qa/v2178-touch-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,deviceScaleFactor:2});const errs=[];
  for(const f of ['TB-1_Target-Behavior-Development_v2026-09.html','Reinforcer_Assessment_Protocol.html','IN-1_Stakeholder-Interview-Record_v2026-09.html','AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html']){
    const page=await ctx.newPage();page.on('pageerror',e=>errs.push(f+': '+e.message));await page.goto(BASE+'/NBH-Workstation/'+f);await sleep(1000);
    const views=await page.$$eval('#viewSeg button[data-view]',b=>b.map(x=>x.dataset.view));let found=null;
    for(const v of views){await page.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);await sleep(250);
      found=await page.evaluate(()=>{const tds=[...document.querySelectorAll('td')].filter(td=>{const c=td.querySelectorAll('input,select,textarea,button,a');const r=td.getBoundingClientRect();return c.length===1&&(c[0].type==='checkbox'||c[0].type==='radio')&&!c[0].disabled&&r.width>=36&&r.height>=30&&td.offsetParent;});
        if(!tds.length)return null;const td=tds[0];td.scrollIntoView({block:'center'});const i=td.querySelector('input');i.setAttribute('data-tt','1');const r=td.getBoundingClientRect(),ir=i.getBoundingClientRect();
        let x=r.left+4,y=r.top+r.height/2;if(x>=ir.left-2)x=r.right-4;return {x,y,was:i.checked,size:[Math.round(ir.width),Math.round(ir.height)],name:i.name||i.getAttribute('aria-label')||''};});
      if(found)break;}
    if(!found){ok(f+': a table cell with one checkbox or radio to tap',false,'none found');await page.close();continue;}
    await page.touchscreen.tap(found.x,found.y);await sleep(150);
    const now=await page.evaluate(()=>{const i=document.querySelector('input[data-tt]');return i?i.checked:null;});
    ok(f+': a tap in the cell beside the box ticks it ('+found.name.slice(0,40)+'), the box '+found.size.join('x'),now===!found.was&&found.size[0]>=24,{found,now});
    const lab=await page.evaluate(()=>{const l=[...document.querySelectorAll('label.ck,label.chk,label.ind')].find(e=>e.offsetParent);if(!l)return null;const cs=getComputedStyle(l);return {pt:cs.paddingTop,pb:cs.paddingBottom};});
    if(lab)ok(f+': a checkbox label carries 7 px above and below (a 36 px tap area)',lab.pt==='7px'&&lab.pb==='7px',lab);
    await page.close();}
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const p=await sh.evaluate(()=>{if(!document.body.classList.contains('rail-open')){}const li=document.querySelector('#rail li.item');const cb=li.querySelector('input[data-tick]'),b=li.querySelector('button.open'),r=li.getBoundingClientRect(),cr=cb.getBoundingClientRect();
    return {x:Math.max(r.left+2,cr.left-6),y:r.top+r.height/2,was:cb.checked,size:Math.round(cr.width),id:li.dataset.id,vis:getComputedStyle(document.getElementById('railNav')).visibility};});
  if(p.vis==='hidden'){await sh.click('#railToggle');await sleep(300);}
  await sh.evaluate(p=>{const li=document.querySelector('#rail li.item[data-id="'+p.id+'"]');li.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:li.getBoundingClientRect().left+2,clientY:p.y}));},p);await sleep(150);
  const now=await sh.evaluate(id=>document.querySelector('#rail input[data-tick="'+id+'"]').checked,p.id);
  ok('shell: a tap beside a form\'s tick box ticks it; the box 26 px',now===!p.was&&p.size>=26,{p,now});
  ok('no errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
