/* v24.13 Form EA-1's Plan sheet: one question at a time; the answers land in the form's own fields; the last card recommends the
   variant from the form's ranking and Set it up loads its conditions; the one-variable path names the conditions after the
   variable; the answers are saved with the file. usage: node qa/ea113-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const EA='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^EA-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.goto(BASE+EA);await sleep(1800);
 const pick=async(v)=>{await p.evaluate(v=>{const b=[...document.querySelectorAll('#plWrap .pl-opt')].find(x=>x.dataset.v===v);if(!b)throw new Error('no option '+v);b.click();},v);};
 const next=async()=>{await p.evaluate(()=>{const b=document.querySelector('#plWrap .pl-next');if(!b)throw new Error('no next');b.click();});await sleep(120);};
 const q=()=>p.evaluate(()=>({prog:document.querySelector('#plWrap .pl-prog').textContent,q:document.querySelector('#plWrap .pl-q').textContent,opts:[...document.querySelectorAll('#plWrap .pl-opt')].map(o=>o.dataset.v)}));
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="plan"]').click());await sleep(300);
 const first=await p.evaluate(()=>({view:document.body.className,shown:getComputedStyle(document.getElementById('plan')).display,tabFirst:document.querySelector('#viewSeg button').dataset.view}));
 const q1=await q();
 ok('the Plan tab is first and opens a sheet with the first question (what the analysis is for) and three answers',first.view==='view-plan'&&first.shown==='block'&&first.tabFirst==='plan'&&/Question 1 of/.test(q1.prog)&&/trying to find out/.test(q1.q)&&q1.opts.join()==='fn,var,tx',{first,q1});
 /* the function path, answered like a moderate-risk escape case run in a separate room */
 await pick('fn');await p.evaluate(()=>{const t=document.querySelector('#plWrap .pl-in[data-name="m.question"]');t.value='Does the screaming happen to get out of math work?';});await next();
 const q2=await q();ok('question 2 asks what the assessment points to, with the form’s six hypotheses',/assessment so far/.test(q2.q)&&q2.opts.join()==='none,social,escape,auto,rrb,idio',q2);
 await pick('escape');await next();await pick('mod');await next();await pick('no');await next();await pick('room');await next();await pick('high');await next();await pick('ok');await next();await pick('first');await next();
 const q9=await q();ok('after the eight choices the session question comes, then the stopping rules',/session, and how many/.test(q9.q),q9);
 await p.evaluate(()=>{document.querySelector('#plWrap .pl-in[data-name="m.sessmin"]').value='10';document.querySelector('#plWrap .pl-in[data-name="#nSess"]').value='24';});await next();
 const stop=await p.evaluate(()=>({q:document.querySelector('#plWrap .pl-q').textContent,term:document.querySelector('#plWrap .pl-in[data-name="s.term"]').value,stop:document.querySelector('#plWrap .pl-in[data-name="s.stop"]').value}));
 ok('the stopping rules come filled in for a moderate-risk behavior when the boxes were empty',/end early/.test(stop.q)&&/Three responses that could cause injury/.test(stop.term)&&/Structured visual-inspection criteria/.test(stop.stop),stop);
 await next();
 const sum=await p.evaluate(()=>({q:document.querySelector('#plWrap .pl-q').textContent,rows:[...document.querySelectorAll('#plWrap .pl-row')].map(r=>r.querySelector('b').textContent+': '+r.querySelector('span').textContent),fields:{hyp:document.querySelector('[name="v.hyp"]').value,risk:document.querySelector('[name="v.risk"]').value,setting:document.querySelector('[name="v.setting"]').value,hist:document.querySelector('[name="v.hist"]').value,question:document.querySelector('[name="m.question"]').value},alt:!!document.querySelector('#plAlt')}));
 ok('the plan card recommends the standard multielement analysis for this case (the form’s own ranking), lists its four conditions and the design; the answers are already in the Variant sheet’s fields',
   /The plan/.test(sum.q)&&sum.rows.some(r=>/Recommended variant: Standard multielement FA/.test(r))&&sum.rows.some(r=>/Conditions loaded: Attention · Demand · Alone \/ No interaction · Play \(control\)/.test(r))&&sum.rows.some(r=>/Design: Multielement/.test(r))&&sum.fields.hyp==='escape'&&sum.fields.risk==='mod'&&sum.fields.setting==='room'&&sum.fields.hist==='first'&&/screaming/.test(sum.fields.question),sum);
 await p.evaluate(()=>document.querySelector('#plWrap .pl-set').click());await sleep(700);
 const set=await p.evaluate(()=>({view:document.body.className,chosen:document.querySelector('[name="v.chosen"]').value,n:document.getElementById('nCond').value,c0:(document.querySelector('[name="c[0].name"]')||{}).value,c3:(document.querySelector('[name="c[3].name"]')||{}).value,measure:document.querySelector('[name="m.measure"]').value,design:document.querySelector('[name="v.design"]').value,sessmin:document.querySelector('[name="m.sessmin"]').value,done:document.querySelector('[name="pl.done"]').value,goal:document.querySelector('[name="pl.goal"]').value,saved:document.querySelector('[name="pl.goal"]').getAttribute('name'),rationale:document.querySelector('[name="v.rationale"]').value}));
 ok('Set it up chooses the variant, loads its four condition cards, sets the design and the measure, and opens Conditions; the answers are saved with the file',
   set.view==='view-conditions'&&set.chosen==='standard'&&set.n==='4'&&set.c0==='Attention'&&/Play/.test(set.c3)&&set.measure==='rate'&&set.design==='Multielement'&&set.sessmin==='10'&&set.done==='1'&&set.goal==='fn'&&set.saved==='pl.goal'&&/Plan sheet/.test(set.rationale),set);
 /* the one-variable path: the conditions are named after the variable */
 await p.goto(BASE+EA);await sleep(1800);await p.evaluate(()=>document.querySelector('#viewSeg [data-view="plan"]').click());await sleep(300);
 await pick('var');await next();await p.evaluate(()=>{document.querySelector('#plWrap .pl-in[data-name="pl.var"]').value='Written math worksheets';});await next();await pick('more');await next();
 await pick('none');await next();await pick('no');await next();await pick('class');await next();await pick('mod');await next();await pick('ok');await next();await pick('first');await next();await next();await next();
 const sum2=await p.evaluate(()=>({q:document.querySelector('#plWrap .pl-q').textContent,rows:[...document.querySelectorAll('#plWrap .pl-row')].map(r=>r.querySelector('b').textContent+': '+r.querySelector('span').textContent)}));
 ok('for one variable the plan recommends the antecedent-only (structural) analysis and names the variable',sum2.rows.some(r=>/Recommended variant: Antecedent-only/.test(r))&&sum2.rows.some(r=>/The variable: Written math worksheets \(expected to make the behavior more likely\)/.test(r)),sum2);
 await p.evaluate(()=>document.querySelector('#plWrap .pl-set').click());await sleep(700);
 const set2=await p.evaluate(()=>({chosen:document.querySelector('[name="v.chosen"]').value,c0:(document.querySelector('[name="c[0].name"]')||{}).value,c1:(document.querySelector('[name="c[1].name"]')||{}).value,vicond:document.querySelector('[name="m.vicond"]').value,view:document.body.className}));
 ok('Set it up names the test and control conditions after the variable and notes the comparison under Conditions to compare',set2.chosen==='antecedent'&&set2.c0==='Written math worksheets present (test)'&&set2.c1==='Written math worksheets absent (control)'&&/Written math worksheets present against absent/.test(set2.vicond)&&set2.view==='view-conditions',set2);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
