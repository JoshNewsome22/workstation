/* v22.20 small print on two sheets (review F483). SM-1's student sheet: the "My week" graph's percent scale, day names and
   goal line print at 9 pt or more, beside the self-evaluation box as on its own (they printed at 5.9 and 6.5 pt). TI-1's
   opportunity table on paper gives the step's wording, which the observer checks against, about a third of the width,
   and fits the sheet (each observation column kept a 188 px screen minimum, and the wording got 0.9 in). Screen sizes
   are unchanged. Simulated student only.   usage: node qa/v2220-print-sizes-test.js */
const L=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async id=>{const f=L.forms().find(x=>x.id===id);const p=await ctx.newPage();p.on('dialog',d=>d.accept().catch(()=>{}));p.on('pageerror',e=>errs.push(id+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await L.sleep(1200);await L.loadSim(p);await L.sleep(1400);return p;};
  /* SM-1 */
  const sm=await open('SM-1');
  const g=async(media,both)=>{await sm.emulateMedia({media});return sm.evaluate(both=>{const host=document.querySelector('#sheetOut');const d=document.createElement('div');d.className='extras';S.meta.goal=S.meta.goal||'80';d.innerHTML=(both?evalBox():'')+graphStrip();host.appendChild(d);
    const svg=d.querySelector('svg'),w=svg.getBoundingClientRect().width,vb=+svg.getAttribute('viewBox').split(' ')[2];const pts=[...svg.querySelectorAll('text')].map(t=>+t.getAttribute('font-size')*w/vb*0.75);
    const r={min:+Math.min(...pts).toFixed(1),n:pts.length,w:Math.round(w)};d.remove();return r;},both);};
  const pb=await g('print',true),pa=await g('print',false);
  ok('1 SM-1 printed: every label of the "My week" graph is 9 pt or more, beside the evaluation box ('+pb.min+' pt) and alone ('+pa.min+' pt)',pb.min>=9&&pa.min>=9&&pb.n>=11,{pb,pa});
  await sm.close();
  /* TI-1 */
  const ti=await open('TI-1');
  const t=async media=>{await ti.emulateMedia({media});await L.sleep(200);return ti.evaluate(()=>{S.steps.forEach((st,i)=>{if(i%3===0)st.cmp='con';});while(S.obs.length<4)S.obs.push(Object.assign({},S.obs[0]||{},{date:''}));renderOpp();
    const tb=document.getElementById('oppTbl'),th=[...tb.querySelectorAll('thead th')].map(x=>x.getBoundingClientRect().width),sh=tb.parentElement.getBoundingClientRect().width,tw=tb.getBoundingClientRect().width;
    return {share:+(th[1]/tw).toFixed(2),tw:Math.round(tw),wrap:Math.round(sh),obsMin:getComputedStyle(tb.querySelectorAll('thead th')[2]).minWidth};});};
  const pr=await t('print'),sc=await t('screen');
  ok('2 TI-1 printed: the opportunity table gives the step\'s wording about a third of its width ('+Math.round(pr.share*100)+'%) and fits the sheet',pr.share>=0.28&&pr.tw<=pr.wrap+1,pr);
  ok('3 on screen TI-1\'s observation columns keep their minimum (the change is for paper)',sc.obsMin==='188px',sc);
  ok('4 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
