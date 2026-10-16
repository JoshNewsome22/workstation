/* v22.32 Form DD-1's Live Recording folds to its title line: Hide / Show, remembered on this device; while a session runs
   or is not yet saved it stays open (the button says why). Simulated data only.
   usage: node qa/v2232-dd1-live-fold-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));const U=L.BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
  await p.goto(U);await sleep(1200);
  await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));});
  const st=()=>p.evaluate(()=>{const b=document.getElementById('ddlFold'),box=document.getElementById('ddLive'),vis=s=>{const e=box.querySelector(s);return !!(e&&e.getClientRects().length);};
    return {t:b.textContent,exp:b.getAttribute('aria-expanded'),dis:b.disabled,top:vis('.ddl-top'),cards:vis('#ddlCards'),title:vis('#ddlTitle'),h:Math.round(box.getBoundingClientRect().height),bh:Math.round(b.getBoundingClientRect().height)};});
  const a=await st();
  ok('1 open at first, with a Hide button in the title line (44 px on a touch screen)',a.t==='Hide'&&a.exp==='true'&&a.top&&a.cards&&a.bh>=44,a);
  await p.tap('#ddlFold');await sleep(200);const b=await st();
  ok('2 Hide folds it to its title line, with Show',b.t==='Show'&&b.exp==='false'&&!b.top&&!b.cards&&b.title&&b.h<a.h/3,{a,b});
  await p.reload();await sleep(1200);await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));});
  const c=await st();
  ok('3 remembered on this device: folded after the form opens again',c.t==='Show'&&!c.top,c);
  await p.tap('#ddlFold');await sleep(200);await p.tap('#ddlStart');await sleep(400);const d=await st();
  ok('4 Show opens it; with a session running it stays open and Hide is off, saying why',d.top&&d.dis&&/stays open/.test(await p.evaluate(()=>document.getElementById('ddlFold').title)),d);
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
