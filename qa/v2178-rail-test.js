/* v21.78 the form list on an iPad: its Hide button stays in view as the list scrolls; with the list put away a tab on the left
   edge brings it back (a tap or a swipe right); a swipe left on the list puts it away. Wide (1366) and the drawer (1180).
   usage: node qa/v2178-rail-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const swipe=(page,sel,dx)=>page.evaluate(([sel,dx])=>{const el=document.querySelector(sel),r=el.getBoundingClientRect(),x=r.left+Math.min(r.width/2,40),y=r.top+r.height/2;
  const mk=(type,X)=>{const t=new Touch({identifier:1,target:el,clientX:X,clientY:y});el.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],changedTouches:[t],bubbles:true}));};
  mk('touchstart',x);mk('touchmove',x+dx/2);mk('touchend',x+dx);},[sel,dx]);
(async()=>{const br=await chromium.launch();const errs=[];
  for(const [w,h] of [[1366,1024],[1180,820]]){const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);await page.evaluate(()=>{try{localStorage.removeItem('nbh.ws.rail');}catch(e){}document.body.classList.remove('rail-hidden');});
    const wide=w>1180;if(!wide&&!(await page.evaluate(()=>document.body.classList.contains('rail-open')))){await page.click('#railToggle');await sleep(300);}
    await page.evaluate(()=>{document.getElementById('railNav').scrollTop=2000;});await sleep(200);
    const vis=await page.evaluate(()=>{const n=document.getElementById('railNav').getBoundingClientRect(),b=document.getElementById('railHide').getBoundingClientRect(),st=[...document.querySelectorAll('nav.rail .stage')].map(e=>e.getBoundingClientRect());
      return {scrolled:document.getElementById('railNav').scrollTop>200,inView:b.top>=n.top-1&&b.bottom<=n.top+60&&b.width>=36&&b.height>=36,under:st.every(r=>r.top>=n.top+49||r.bottom<n.top)};});
    ok(w+': the list scrolled down, its Hide button still at the top, 36 px or more, the headings stopping under it',vis.scrolled&&vis.inView&&vis.under,vis);
    await page.click('#railHide');await sleep(350);
    const st=()=>page.evaluate(()=>({shown:getComputedStyle(document.getElementById('railNav')).display!=='none'&&getComputedStyle(document.getElementById('railNav')).visibility!=='hidden',edge:getComputedStyle(document.getElementById('railEdge')).display!=='none',open:document.body.classList.contains('rail-open'),hidden:document.body.classList.contains('rail-hidden')}));
    const a=await st();ok(w+': Hide puts the list away and the tab shows on the left edge',!a.shown&&a.edge,a);
    await page.click('#railEdge');await sleep(350);const b=await st();ok(w+': a tap on the tab brings the list back (the tab goes)',b.shown&&!b.edge,b);
    await swipe(page,'#railNav',-120);await sleep(350);const c=await st();ok(w+': a swipe left on the list puts it away',!c.shown&&c.edge,c);
    await swipe(page,'#railEdge',120);await sleep(350);const d=await st();ok(w+': a swipe right on the tab brings it back',d.shown&&!d.edge,d);
    await swipe(page,'#railNav',-20);await sleep(200);const e=await st();ok(w+': a short or upward touch does nothing',e.shown,e);
    await page.evaluate(()=>{document.getElementById('railNav').scrollTop=0;});await page.screenshot({path:__dirname+'/out/v2178/rail-'+w+'.png'});
    await ctx.close();}
  ok('no errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
