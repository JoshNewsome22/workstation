/* v22.68 Form VI-1, review Wave 3 part 2: its result reaches the next assessment (F161): the evidence carries the conditions
   to compare, the confounds, what was set aside, the step chosen and the occurrences coded; Form EA-1 takes VI-1 into the
   hypothesis carried in and fills Conditions to compare and Confounds to separate; Form FS-1 offers VI-1's hypothesis and a
   row for what it set aside; the shell lists VI-1 before EA-1. The function sent is the one chosen beside the statement,
   the words only as a fallback with ruled-out functions dropped, and FS-1 names a source it cannot count (F162).
   Simulated data only. usage: node qa/v2268-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open('Variable_Isolation_Protocol.html');
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const ev=()=>p.evaluate(()=>{const o=window.nbhCase.out();return o&&o.evidence;});
  const e=await ev();
  ok('1 F162 the function is the one chosen beside the statement (the worked example: escape)',e&&e.fnKey==='escape'&&e.fn==='Escape / avoidance'&&e.strength==='Strong',e&&{fn:e.fn,fnKey:e.fnKey,strength:e.strength});
  ok('2 F161 the evidence carries the conditions to compare, the confounds, what was set aside, the step chosen and the occurrences coded',
    /^If this is correct, aggression should fall/.test(e.conditions||'')&&/^Adult proximity is confounded/.test(e.confounds||'')&&/Adult proximity and the escape contingency remain partly confounded/.test(e.confounds||'')&&
    /Poor sleep, attention delivered, denied tangible/.test(e.eliminated||'')&&/Eliminated in the joint method summary: Denied tangible\.$/.test(e.eliminated||'')&&e.decision==='Function-based intervention with treatment-as-test'&&e.n===10,
    {conditions:(e.conditions||'').slice(0,60),confounds:(e.confounds||'').slice(0,60),eliminated:e.eliminated,decision:e.decision,n:e.n});
  /* the words as a fallback */
  const fb=async(st,pick)=>{await p.evaluate(([st,pick])=>{const s=document.querySelector('[name="h_statement"]');s.value=st;s.dispatchEvent(new Event('input',{bubbles:true}));
    const f=document.getElementById('hFn');f.value=pick;f.dispatchEvent(new Event('change',{bubbles:true}));},[st,pick]);const x=await ev();return {fn:x.fn,fnKey:x.fnKey,strength:x.strength};};
  const a=await fb('When work is presented the student hits, which ends the work; therefore the behavior is hypothesized to be maintained by escape from demands, not attention.','');
  const b=await fb('When an adult turns away the student hits; attention is hypothesized to maintain it. Escape was ruled out.','');
  const c=await fb('The behavior is hypothesized to be maintained by escape rather than by attention.','');
  ok('3 with no function chosen, the words are read and a ruled-out function is dropped ("not attention", "ruled out", "rather than")',a.fnKey==='escape'&&a.fn==='Escape from demands'&&b.fnKey==='attention'&&c.fnKey==='escape',{a,b,c});
  const m=await fb('Maintained by both escape and attention.','multiple');
  ok('4 More than one: sent as such, with its strength, for FS-1 to list without counting',m.fnKey==='multiple'&&m.fn==='More than one function'&&m.strength==='Strong',m);
  /* back to the worked example's evidence */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);const e0=await ev();
  await p.close();
  /* EA-1 */
  const q=await open('EA-1_Experimental-Analysis-Protocol_v2026-09.html');
  await q.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'VI-1':e0}});await sleep(300);
  const ea=await q.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {hyp:v('m.hyp'),prior:v('v.hyp'),cond:v('m.vicond'),conf:v('m.viconf')};});
  ok('5 EA-1 takes VI-1 into the hypothesis carried in, and the prior hypothesis follows (escape)',ea.hyp==='VI-1: Escape / avoidance (strong)'&&ea.prior==='escape',ea);
  ok('6 EA-1 fills Conditions to compare and Confounds to separate from VI-1',ea.cond===e0.conditions&&ea.conf===e0.confounds&&!!ea.cond&&!!ea.conf,{cond:ea.cond.slice(0,60),conf:ea.conf.slice(0,60)});
  await q.evaluate(()=>{const t=document.querySelector('[name="m.vicond"]');t.value='Typed by the BCBA (simulated)';t.dispatchEvent(new Event('input',{bubbles:true}));});
  await q.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'VI-1':e0}});await sleep(200);
  ok('7 a line the BCBA typed in EA-1 is kept',await q.evaluate(()=>document.querySelector('[name="m.vicond"]').value)==='Typed by the BCBA (simulated)');
  await q.close();
  /* FS-1 */
  const r=await open('FS-1_FBA-Summary-Report_v2026-09.html');
  await r.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'VI-1':e0}});await sleep(300);
  const fs1=await r.evaluate(()=>({hyp:[...document.querySelectorAll('#hypTbl tbody tr')].map(tr=>({h:tr.querySelector('[data-f="h"]').value,out:tr.querySelector('[data-f="out"]').value,what:tr.querySelector('[data-f="what"]').value})).filter(x=>x.h),
    src:[...document.querySelectorAll('#srcTbl tbody tr')].map(tr=>tr.textContent+' '+[...tr.querySelectorAll('textarea,input,select')].map(x=>x.value).join(' | ')).filter(t=>/VI-1/.test(t))}));
  const hy=fs1.hyp.find(x=>x.h==='Escape / avoidance (Form VI-1)'),sa=fs1.hyp.find(x=>/^Candidates set aside by variable isolation \(Form VI-1\)$/.test(x.h));
  ok('8 FS-1 offers VI-1\'s hypothesis and a row for the candidates it set aside (Set aside)',!!hy&&!!sa&&sa.out==='Set aside'&&/Eliminated in the joint method summary: Denied tangible/.test(sa.what),fs1.hyp);
  ok('9 FS-1\'s evidence row for VI-1 counts the occurrences (10 occurrences)',fs1.src.some(t=>/\(10 occurrences\)/.test(t)),fs1.src);
  await r.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'VI-1':e0}});await sleep(200);
  ok('10 applied again, nothing is added twice',(await r.evaluate(()=>[...document.querySelectorAll('#hypTbl tbody [data-f="h"]')].filter(x=>/Form VI-1/.test(x.value)).length))===2);
  await r.close();
  const r2=await open('FS-1_FBA-Summary-Report_v2026-09.html');
  const multi=Object.assign({},e0,{fn:'More than one function',fnKey:'multiple'});
  await r2.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'VI-1':multi}});await sleep(300);
  const note=await r2.evaluate(()=>document.getElementById('convNote').textContent.replace(/\s+/g,' '));
  ok('11 F162 FS-1 names a source it cannot count because no single function is named',/Not counted, no single function named: VI-1\./.test(note),note);
  await r2.close();
  /* the shell */
  const ix=await (await ctx.request.get(L.BASE+'/NBH-Workstation/index.html')).text();
  ok('12 the shell lists VI-1 before EA-1 in "Test what you think"',ix.indexOf("['VI-1','isolate one variable from the descriptive record, before an analysis'],['EA-1',")>0);
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('13 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
