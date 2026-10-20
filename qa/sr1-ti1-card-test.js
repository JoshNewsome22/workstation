/* Form SR-1's schedule card as integrity steps (v23.46, review I139): SR-1 sends the card's rule and its "What never happens"
   lines, each tagged with its component; on an escape or chained schedule, the line that no one holds the student is a safety
   step; Form TI-1's "Add Form SR-1's schedule card" adds them beside the steps already written, once. Simulated data only.
   usage: node qa/sr1-ti1-card-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(800);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('SR-1_'));
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  const out=x=>p.evaluate(x=>{Object.assign(S.meta,x);renderAll();const r=window.__nbhFactsOut();return r&&r.schedule;},x);
  const a=await out({ds_sel:'thin',func:'Escape or avoidance'});const it=(a&&a.items)||[];
  const rule=it.find(x=>/^Follows the card’s rule: /.test(x.d)),beh=it.find(x=>/is not argued with, lectured about, or given the reinforcer by accident/.test(x.d)),safe=it.find(x=>x.cmp==='safe');
  ok('1 SR-1 sends the card as steps: the rule (a consequence step, critical), the behavior never reinforced by accident (critical), nothing earned taken away, the schedule kept for the day',
    !!rule&&rule.cmp==='con'&&rule.crit===true&&rule.d==='Follows the card’s rule: '+a.rule&&!!beh&&beh.cmp==='con'&&beh.crit&&it.some(x=>x.d==='Takes nothing already earned away'&&x.cmp==='con')&&it.some(x=>x.d==='Keeps the schedule as it is for the day'),it);
  ok('2 a thinning schedule with steps: the step in force is a step; for escape, no one holds the student (a safety step, critical)',it.some(x=>/^Runs the step in force today/.test(x.d))&&!!safe&&safe.crit===true&&/^No one holds the student/.test(safe.d),it);
  const b=await out({ds_sel:'dro',func:'Attention'});
  ok('3 a DRO for attention: no safety line',!!b&&Array.isArray(b.items)&&!b.items.some(x=>x.cmp==='safe'),b&&b.items);
  /* TI-1 */
  const t=await open(file('TI-1_'));
  const before=await t.evaluate(()=>{S.steps[0].d='Greets the student at the door (simulated)';renderAll();return S.steps.filter(s=>String(s.d||'').trim()).length;});
  await t.evaluate(sc=>window.__nbhFactsIn({schedule:sc}),a);await sleep(200);
  const bt=await t.evaluate(()=>{const b=document.getElementById('addSched');return b?{shown:b.style.display!=='none',text:b.textContent,title:b.title}:null;});
  ok('4 TI-1 offers "Add Form SR-1\'s schedule card" when the case holds the card',!!bt&&bt.shown&&bt.text==='Add Form SR-1’s schedule card'&&new RegExp('^'+it.length+' steps').test(bt.title),bt);
  await t.evaluate(()=>document.getElementById('addSched').click());await sleep(200);
  const st=await t.evaluate(()=>S.steps.filter(s=>String(s.d||'').trim()).map(s=>({d:s.d,cmp:s.cmp,crit:!!s.crit})));
  const added=st.filter(s=>/^Schedule \(Form SR-1\): /.test(s.d));
  ok('5 the card\'s lines are added beside the step written, named and tagged (the safety step critical)',st[0].d==='Greets the student at the door (simulated)'&&added.length===it.length&&added.some(s=>s.cmp==='con'&&s.crit&&/Follows the card’s rule/.test(s.d))&&added.some(s=>s.cmp==='safe'&&s.crit),st);
  await t.evaluate(()=>document.getElementById('addSched').click());await sleep(200);
  const n2=await t.evaluate(()=>S.steps.filter(s=>String(s.d||'').trim()).length);
  ok('6 pressed again: nothing added twice',n2===before+it.length,{n2,before,n:it.length});
  const t2=await open(file('TI-1_'));const bt2=await t2.evaluate(()=>{window.__nbhFactsIn({});const b=document.getElementById('addSched');return b?b.style.display:'none';});
  ok('7 no schedule card in the case: the button is hidden',bt2==='none',bt2);
  ok('8 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
