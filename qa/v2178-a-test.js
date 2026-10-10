/* v21.78 helper A: the FBA chain (simulated students only: Mateo Rivera and the forms' own "SIMULATED – Sample Student"):
   1. Forms IA-1, IN-1, OB-1, ABC-1, SP-1, VI-1 and EA-1 give their result as evidence ({form, method, from, to, dates, n, fn,
      fnKey, strength, statement}) once their simulation is loaded, and nothing while they are empty;
   2. Form FS-1 places the evidence on its evidence table (a row per form, its own method and choices), the consent date and
      the statements of IA-1, OB-1 and EA-1 as hypotheses; a second pass adds nothing; a form already listed is not added again;
      what is typed is kept;
   3. Form EA-1 fills the hypothesis carried in, the prior hypothesis, consent, medications, definition, urgency and precursor
      when empty, keeps what is typed, and copes without the medications part;
   4. no page errors.
   usage: node qa/v2178-a-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,loadSim,sleep}=require(__dirname+'/lib.js');
const U=f=>BASE+'/NBH-Workstation/'+f;
const FORMS={'IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','IN-1':'IN-1_Stakeholder-Interview-Record_v2026-09.html',
  'OB-1':'OB-1_Direct-Observation-Record_v2026-09.html','ABC-1':'ABC_Recording_Conditional_Probability_Analysis.html','SP-1':'Scatterplot_Pattern_Analysis.html',
  'VI-1':'Variable_Isolation_Protocol.html','EA-1':'EA-1_Experimental-Analysis-Protocol_v2026-09.html'};
const FS=U('FS-1_FBA-Summary-Report_v2026-09.html'),EA=U(FORMS['EA-1']);
const WANT={'IN-1':'multiple','OB-1':'escape','ABC-1':'escape','SP-1':'','VI-1':'escape','EA-1':'escape'};
const KEYS=['attention','escape','tangible','automatic','multiple','unclear',''];
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1180,height:900}});
  const open=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url.split('/').pop()+': '+String(e.message||e).slice(0,300)));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(url);await sleep(700);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.alert=async()=>{};}}catch(e){}});return p;};
  /* 1. the evidence out */
  const EVID={};
  for(const [id,file] of Object.entries(FORMS)){const p=await open(U(file));
    const empty=await p.evaluate(()=>{const o=window.__nbhFactsOut?window.__nbhFactsOut():null;return o&&o.evidence?o.evidence:null;});
    ok(id+': nothing as evidence while the form is empty',!empty,empty);
    const s=await loadSim(p);await sleep(1600);
    const o=await p.evaluate(()=>window.__nbhFactsOut?window.__nbhFactsOut():null);const e=o&&o.evidence;
    ok(id+': simulation loaded ('+s+') and evidence given',!!e,o);if(!e){await p.close();continue;}
    EVID[id]=e;
    ok(id+': form, method, statement',e.form===id&&e.method&&e.statement&&e.statement.length>20,e);
    ok(id+': fnKey is one of the keys',KEYS.includes(e.fnKey),e.fnKey);
    ok(id+': dates as ISO and a readable range',/^\d{4}-\d{2}-\d{2}$/.test(e.from||'')&&/^\d{4}-\d{2}-\d{2}$/.test(e.to||'')&&e.from<=e.to&&/\d+\/\d+\/\d{4}/.test(e.dates),e);
    ok(id+': strength one of Strong, Moderate, Weak or none',['Strong','Moderate','Weak',''].includes(e.strength),e.strength);
    if(id==='IA-1'){const v=await p.evaluate(()=>document.getElementById('mFn').value);ok('IA-1: the function is the hypothesis carried to the packet',v&&e.fnKey===v&&/carried to the packet/.test(e.statement)&&e.n>=1,[v,e]);}
    else ok(id+': the function the form concludes ('+WANT[id]+')',e.fnKey===WANT[id],e);
    if(id==='OB-1'){const c=await p.evaluate(()=>state.meta.carry);ok('OB-1: the statement is the FS-1 statement',e.statement===c.replace(/\s+/g,' ').trim(),[c,e.statement]);ok('OB-1: the observations counted',e.n===3);}
    if(id==='IN-1')ok('IN-1: the hypothesis and the interviews',/informant report/.test(e.statement)&&e.n===5,e);
    if(id==='SP-1')ok('SP-1: a pattern, not a function',e.fn===''&&/Heaviest interval/.test(e.statement),e);
    if(id==='EA-1')ok('EA-1: the design and the outcome',e.design==='Multielement'&&/Differentiated: Demand/.test(e.statement)&&e.strength==='Strong'&&e.n>0,e);
    await p.close();}
  const F={evidence:EVID,consent:{date:'2026-09-01',parent:'2026-09-02',src:'IC-1'},
    profile:{strengths:'reads well (simulated)',health:{meds:[{name:'Methylphenidate (simulated)',dose:'10 mg',times:'8:00',reason:'attention'},{name:'Melatonin (simulated)',dose:'3 mg',times:'bedtime'}],prescriber:'Dr. Sample (simulated)'}},
    behaviors:[{label:'Aggression toward staff',def:'Forceful contact of hand, foot or head with a staff member (Mateo Rivera, simulated)',urg:3,dim:'frequency'},{label:'Asking for a break',isRep:true,type:'replacement'}],
    plan:{prec:'Vocal protest rising in volume (simulated)'},crisis:{precursor:'Pushing materials away (simulated)'}};
  /* 2. FS-1 */
  {const p=await open(FS);
    const r1=await p.evaluate(f=>window.__nbhFactsIn(f),F);await sleep(300);
    const st=await p.evaluate(()=>({src:S.src.map(r=>Object.assign({},r)),hyp:S.hyp.map(r=>Object.assign({},r)),consent:S.meta.consent,
      col:[...document.querySelectorAll('#srcTbl tbody tr')].map(tr=>tr.cells[0].textContent.trim()),methods:METHODS.map(m=>m[0]),fns:FN,toast:document.body.innerText.indexOf('From the case:')>=0}));
    const forms=st.src.map(r=>r.form).filter(Boolean);
    ok('FS-1: a row per form of the evidence',Object.keys(EVID).every(id=>forms.filter(x=>x===id).length===1),forms);
    ok('FS-1: each row on the table\'s own method, function and strength',st.src.filter(r=>r.form).every(r=>st.methods.includes(r.method)&&(r.fn===''||st.fns.includes(r.fn))&&['','Strong','Moderate','Weak'].includes(r.str)),st.src);
    const row=id=>st.src.find(r=>r.form===id)||{};
    ok('FS-1: EA-1 as a functional analysis, escape, strong',/^Functional analysis, analogue/.test(row('EA-1').method)&&/^Escape/.test(row('EA-1').fn)&&row('EA-1').str==='Strong',row('EA-1'));
    ok('FS-1: ABC-1 as structured descriptive, IN-1 and IA-1 as indirect, SP-1 as scatter plot',/conditional probabilities/.test(row('ABC-1').method)&&/^Indirect: structured/.test(row('IN-1').method)&&/^Indirect: structured/.test(row('IA-1').method)&&/^Scatter plot/.test(row('SP-1').method),st.src);
    ok('FS-1: dates, conducted by and what it contributed',row('OB-1').dates===EVID['OB-1'].dates&&row('OB-1').who&&row('OB-1').contrib.indexOf(EVID['OB-1'].statement.slice(0,40))>=0,row('OB-1'));
    ok('FS-1: the Form column shows the row\'s own form',st.col.includes('IN-1')&&st.col.includes('OB-1'),st.col);
    ok('FS-1: consent from Form IC-1',/9\/1\/2026/.test(st.consent||'')&&/IC-1/.test(st.consent),st.consent);
    ok('FS-1: IA-1, OB-1 and EA-1 offered as hypotheses, the outcome left blank',['IA-1','OB-1','EA-1'].every(id=>st.hyp.filter(h=>h.h.indexOf('Form '+id)>=0).length===1)&&st.hyp.every(h=>!h.out),st.hyp);
    ok('FS-1: the answer counts what was placed, with a message',r1&&r1.filled>=11&&st.toast,[r1,st.toast]);
    const r2=await p.evaluate(f=>window.__nbhFactsIn(f),F);
    const st2=await p.evaluate(()=>({n:S.src.length,h:S.hyp.length,forms:S.src.map(r=>r.form).filter(Boolean)}));
    ok('FS-1: a second pass adds nothing',(!r2||!r2.filled)&&st2.n===st.src.length&&st2.forms.length===forms.length,[r2,st2]);
    /* typed text is kept; a form listed by its method is not added again */
    const s=await loadSim(p);await sleep(1200);
    const before=await p.evaluate(()=>{S.meta.consent='Signed 8/30/2026 by the parent (typed)';bindMeta();return JSON.stringify({src:S.src,hyp:S.hyp});});
    await p.evaluate(f=>window.__nbhFactsIn(f),F);
    const after=await p.evaluate(()=>({src:S.src.map(r=>Object.assign({},r)),hyp:S.hyp.map(r=>Object.assign({},r)),consent:S.meta.consent}));
    const B=JSON.parse(before);
    ok('FS-1 ('+s+'): every row already there is unchanged',B.src.every((r,i)=>JSON.stringify(r)===JSON.stringify(after.src[i]))&&B.hyp.every((r,i)=>JSON.stringify(r)===JSON.stringify(after.hyp[i])),after.src.slice(0,B.src.length));
    const added=after.src.slice(B.src.length).map(r=>r.form);
    ok('FS-1: only the forms not listed are added (IN-1, OB-1, EA-1; not IA-1, SP-1, ABC-1, VI-1)',JSON.stringify(added.sort())===JSON.stringify(['EA-1','IN-1','OB-1']),added);
    ok('FS-1: typed consent kept',after.consent==='Signed 8/30/2026 by the parent (typed)',after.consent);
    ok('FS-1: no empty hypothesis row, none offered',after.hyp.length===B.hyp.length,after.hyp.length);
    await p.close();}
  /* 3. EA-1 */
  {const p=await open(EA);
    const r=await p.evaluate(f=>window.__nbhFactsIn(f),F);
    const v=n=>p.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;},n);
    const hyp=await v('m.hyp');
    ok('EA-1: hypothesis carried in names each form and its function',/IA-1: Attention/.test(hyp)&&/IN-1: Multiple/.test(hyp)&&/ABC-1: Escape\/avoidance/.test(hyp)&&/OB-1: Escape/.test(hyp),hyp);
    ok('EA-1: prior hypothesis unclear or conflicting when the forms differ',await v('v.hyp')==='none',await v('v.hyp'));
    ok('EA-1: consent from Form IC-1',/9\/1\/2026/.test(await v('s.consent')),await v('s.consent'));
    const med=await v('s.med');ok('EA-1: medications, names and doses',/Methylphenidate \(simulated\) 10 mg/.test(med)&&/Melatonin \(simulated\) 3 mg/.test(med),med);
    ok('EA-1: definition, urgency, precursor (TD-1 first)',await v('m.def')===F.behaviors[0].def&&await v('m.urg')==='3'&&await v('m.prec')===F.plan.prec,[await v('m.def'),await v('m.urg'),await v('m.prec')]);
    ok('EA-1: the shared fill still places the target behavior',/Aggression toward staff/.test(await v('m.beh')),await v('m.beh'));
    ok('EA-1: the answer counts them',r&&r.filled>=8,r);
    const r2=await p.evaluate(f=>window.__nbhFactsIn(f),F);ok('EA-1: a second pass fills nothing',!r2||!r2.filled,r2);
    await p.close();}
  {const p=await open(EA);
    const G=Object.assign({},F,{evidence:{'ABC-1':EVID['ABC-1'],'OB-1':EVID['OB-1']},profile:{strengths:'x'},plan:{}});
    await p.evaluate(f=>window.__nbhFactsIn(f),G);
    const v=n=>p.evaluate(n=>document.querySelector('[name="'+n+'"]').value,n);
    ok('EA-1: agreeing sources with a strong one give a consensus on escape',await v('v.hyp')==='escape',await v('v.hyp'));
    ok('EA-1: no medications part, medical clearance left empty',await v('s.med')==='',await v('s.med'));
    ok('EA-1: the precursor from Form CR-1 when TD-1 has none',await v('m.prec')===F.crisis.precursor,await v('m.prec'));
    await p.close();}
  {const p=await open(EA);await loadSim(p);await sleep(1500);
    const names=['m.hyp','v.hyp','s.consent','s.med','m.def','m.urg','m.beh'];
    const get=()=>p.evaluate(ns=>ns.map(n=>document.querySelector('[name="'+n+'"]').value),names);
    const b0=await get();await p.evaluate(()=>{document.querySelector('[name="m.prec"]').value='Typed precursor (simulated)';});
    await p.evaluate(f=>window.__nbhFactsIn(f),F);const b1=await get();
    ok('EA-1: nothing typed is overwritten',JSON.stringify(b0)===JSON.stringify(b1)&&await p.evaluate(()=>document.querySelector('[name="m.prec"]').value)==='Typed precursor (simulated)',[b0,b1]);
    await p.close();}
  ok('no page errors',!errs.length,errs);
  await b.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
