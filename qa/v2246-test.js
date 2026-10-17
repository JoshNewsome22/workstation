/* v22.46 the plan's step list (review I232). Form TD-1's final plan marks which of its numbered lines are the step list
   staff carry out, and which of those are critical; the case carries the list with the plan, numbered as printed. The
   cards' library steps stay out unless added, the crisis procedure, the thinning ladder, generalization and the data
   rules never join, and the BCBA's changes are kept in the saved file. Simulated cases only. usage: node qa/v2246-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const TD1='/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push('TD-1: '+e.message));await p.goto(L.BASE+TD1);await sleep(900);return p;};
  const sim=async(p,k)=>{await p.evaluate(k=>{window.confirm=()=>true;document.querySelector('#simScenario').value=k;document.querySelector('#simBtn').click();},k);await sleep(900);
    await p.evaluate(()=>{[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^Load$/.test(b.textContent.trim())).forEach(b=>b.click());});await sleep(1300);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-view]')].find(x=>x.dataset.view==='final');if(b)b.click();});await sleep(600);};
  const read=p=>p.evaluate(()=>{const o=__nbhFactsOut()||{},pl=o.plan||{};const rows=[...document.querySelectorAll('#finalBody .plan-step')].map(r=>({n:+r.querySelector('.n').textContent,t:r.querySelector('.t').textContent,in:r.classList.contains('td46-in'),crit:r.classList.contains('crit')}));
    return {steps:pl.steps||[],rev:pl.stepsRev,rows,box:(document.getElementById('td46Steps')||{}).textContent||'',fld:(document.querySelector('[name="fin.steps"]')||{}).value};});
  const p=await open();await sim(p,'escape_fct');
  const a=await read(p);const S=a.steps,all=JSON.stringify(S);
  ok('1 the case carries the step list with the plan, each step numbered as the final plan prints it',S.length>=8&&S.length<30&&S.every(s=>{const r=a.rows[s.n-1];return r&&r.t===s.d&&r.in;})&&a.rows.filter(r=>r.in).length===S.length,{n:S.length,rows:a.rows.length});
  ok('2 the cards’ library steps stay out; the step that delivers the reinforcer joins, critical, as a consequence',!/Select the mand|Prepare implementers|Review integrity weekly/.test(all)&&S.some(s=>/^Reinforce every mand/.test(s.d)&&s.crit&&s.cmp==='con'),S.map(s=>s.d.slice(0,50)));
  ok('3 never in the list: the crisis procedure, the thinning ladder, generalization, the data rules, escape extinction’s consent',!/^Trigger:|FCT 1:|Before treatment:|Record the target behavior|Who agreed|The team agreed/m.test(S.map(s=>s.d).join('\n')),S.map(s=>s.d.slice(0,40)));
  ok('4 the response to the behavior and the stopping rules are critical; positioning is an antecedent, not critical',S.some(s=>/^On the target behavior/.test(s.d)&&s.crit)&&S.some(s=>/^Never force/.test(s.d)&&s.crit)&&S.some(s=>/^Positioning/.test(s.d)&&!s.crit&&s.cmp==='ant'),S.map(s=>[s.d.slice(0,30),s.crit,s.cmp]));
  ok('5 the sheet says what the list is and what never joins it',/The step list\./.test(a.box)&&/Form TI-1/.test(a.box)&&/Form CR-1 governs it/.test(a.box)&&/as the other forms take it \(\d+\)/.test(a.box),a.box.slice(0,300));
  /* the BCBA adds a library step and unmarks a critical one */
  const b=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#finalBody .plan-step')];
    rows.find(r=>/^Select the mand/.test(r.querySelector('.t').textContent)).querySelector('.td46-in-b').click();
    [...document.querySelectorAll('#finalBody .plan-step')].find(r=>/^Staff do not/.test(r.querySelector('.t').textContent)).querySelector('.td46-crit').click();
    const pl=__nbhFactsOut().plan;return {steps:pl.steps,rev:pl.stepsRev,fld:document.querySelector('[name="fin.steps"]').value};});
  const saved=await p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(''),3000);}));
  ok('6 Add to the list and Critical change the list and its fingerprint, and are kept in the form’s fields',b.steps.some(s=>/^Select the mand/.test(s.d))&&b.steps.some(s=>/^Staff do not/.test(s.d)&&!s.crit)&&b.rev!==a.rev&&/select the mand/.test(b.fld)&&/fin\.steps/.test(saved),{rev:[a.rev,b.rev],fld:b.fld});
  const p2=await open();await p2.setInputFiles('#fileIn',{name:'td1.json',mimeType:'application/json',buffer:Buffer.from(saved||'{}')});await sleep(800);
  await p2.evaluate(()=>{[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^(Open|Replace|OK|Continue)$/.test(b.textContent.trim())).forEach(b=>b.click());});await sleep(900);
  const c=await p2.evaluate(()=>{const b=[...document.querySelectorAll('[data-view]')].find(x=>x.dataset.view==='final');if(b)b.click();const pl=(__nbhFactsOut()||{}).plan||{};return {rev:pl.stepsRev,n:(pl.steps||[]).length};});
  ok('7 Open data restores the changes',c.rev===b.rev&&c.n===b.steps.length,{c,b:b.rev});
  const d=await p.evaluate(()=>{document.getElementById('td46Reset').click();return __nbhFactsOut().plan.stepsRev;});
  ok('8 Use the suggested marks puts the suggestions back',d===a.rev,{d,a:a.rev});
  await p.emulateMedia({media:'print'});
  const e=await p.evaluate(()=>{const c=document.querySelector('.td46-ctl'),n=document.querySelector('#td46Steps .noprint');return {ctl:c&&getComputedStyle(c).display,box:n&&getComputedStyle(n).display};});
  ok('9 the buttons and the explanation do not print',e.ctl==='none'&&e.box==='none',e);
  await p.emulateMedia({media:'screen'});
  /* a plan with cards only: the cards' reinforcement and extinction steps are suggested */
  const q=await open();const f=await q.evaluate(()=>{const s=document.querySelector('#addComp');['FCT','EXT'].forEach(c=>{if(![...s.options].some(o=>o.value===c)){const o=document.createElement('option');o.value=c;s.appendChild(o);}s.value=c;document.querySelector('#addCompBtn').click();});const b=[...document.querySelectorAll('[data-view]')].find(x=>x.dataset.view==='final');if(b)b.click();return ((__nbhFactsOut()||{}).plan||{}).steps||[];});
  ok('10 with no lines of its own for staff, the cards’ reinforcement and extinction steps are suggested',f.length>=2&&f.some(s=>/^Reinforce every mand/.test(s.d))&&f.some(s=>/^Match the form to the function/.test(s.d))&&!f.some(s=>/^Select the mand/.test(s.d)),f.map(s=>s.d.slice(0,40)));
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('11 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
