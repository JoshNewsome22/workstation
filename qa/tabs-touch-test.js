/* The view tabs on a touch screen (v23.36): the open tab is brought into view when the strip's own width changes (Fit or Actual
   size, the toolbar wrapping), not only when it is chosen or the window turns; it was left half under the edge on an iPad.
   usage: node qa/tabs-touch-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1024,height:900},hasTouch:true,isMobile:false});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TB-1_'));await sleep(1200);
  const coarse=await p.evaluate(()=>matchMedia('(pointer:coarse)').matches);
  /* the open tab well to the right; then the strip is made narrower without a click or a turn */
  await p.evaluate(()=>{const b=document.querySelector('#viewSeg button[data-view="check"]');b.click();});await sleep(300);
  const view=()=>p.evaluate(()=>{const s=document.getElementById('viewSeg'),a=s.querySelector('[aria-pressed="true"],[aria-selected="true"]'),sr=s.getBoundingClientRect(),ar=a.getBoundingClientRect();
    return {over:s.scrollWidth>s.clientWidth+2,inView:ar.left>=sr.left-1&&ar.right<=sr.right+1,sl:Math.round(s.scrollLeft),cw:s.clientWidth};});
  const a0=await view();
  await p.evaluate(()=>{const s=document.getElementById('viewSeg');s.scrollLeft=0;s.style.maxWidth='300px';});await sleep(400);
  const a1=await view();
  /* v23.87: on a touch screen 700px and wider the strip wraps instead of scrolling, so narrowing it leaves no overflow; the open tab
     must still be in view either way, and scrolled into view where the strip does overflow */
  ok('1 on a touch screen, when the strip grows narrower the open tab is brought back into view',coarse&&a1.inView&&(!a1.over||a1.sl>0),{coarse,a0,a1});
  await p.evaluate(()=>{const s=document.getElementById('viewSeg');s.style.maxWidth='';});await sleep(300);
  const a2=await view();
  ok('2 and when it widens again the open tab stays in view',a2.inView,a2);
  ok('3 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
