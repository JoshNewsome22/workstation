/* v24.40 one simulated student (review V14 part 2: R-049, R-121, E-02). Form IA-1's simulation plans the FAST and one scale
   (the QABF) with three informants, leaves the MAS, PBQ and WEFA unused and blank, drafts the hypothesis and ticks a
   Decision with a rationale, for every scenario; and across the forms that name them, the simulated student's date of
   birth, grade and school agree. usage: node qa/ia140-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1300,height:950}});p.on('pageerror',e=>errs.push('IA-1: '+String(e).slice(0,100)));
 await p.goto(BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html');await sleep(1500);
 const SC=['attention','tangible','escape','automatic','physical','flat','split'];const out={};
 for(const sc of SC){await p.evaluate(s=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value=s;document.getElementById('simBtn').click();},sc);await sleep(3200);
   out[sc]=await p.evaluate(()=>{const v=k=>{const e=document.querySelector('[name="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;};
     const blank=k=>{let n=0,f=0;for(let r=0;r<3;r++)for(let it=1;it<=30;it++){const e=document.querySelector('[name="'+k+'['+r+']['+it+']"]');if(!e)continue;n++;if(e.value!=='')f++;}return {n,f};};
     return {plan:['fast','qabf','mas','pbq','wefa','int'].map(k=>v('plan.'+k+'.u')),who:[v('plan.fast.who'),v('plan.qabf.who'),v('plan.wefa.who')],wefaNote:v('plan.wefa.n'),wefaRow:[v('wefa[0].comm'),v('wefa[1].seeks')],mas:blank('mas'),pbq:blank('pbq'),wefa:blank('wefa'),fast:blank('fast'),qabf:blank('qabf'),
       hyp:['c','a','b'].map(k=>(v('hyp.'+k)||'').length),dec:['abc','med','fa','single','interview'].filter(k=>v('dec.'+k)),note:(v('dec.note')||'').length,dob:v('m.dob'),sum:(document.getElementById('summary')||{textContent:''}).textContent.replace(/\s+/g,' ').slice(0,200)};});}
 const planOk=Object.values(out).every(o=>o.plan.join()==='Yes,Yes,No,No,No,Yes'&&o.who[0]==='A, B, C'&&o.who[1]==='A, B, C'&&o.who[2]===''&&/elopement/.test(o.wefaNote));
 ok('IA-1 (R-049): in every scenario the plan is the FAST and the QABF with the three informants and the interviews; the MAS, PBQ and WEFA are marked not used, the WEFA\'s note saying the target is not elopement',planOk,Object.fromEntries(Object.entries(out).map(([k,o])=>[k,[o.plan.join(),o.who,o.wefaNote]])));
 ok('the instruments not in the plan hold no scores and the WEFA header rows are blank; the FAST and QABF are scored for all three informants',
   Object.values(out).every(o=>o.mas.f===0&&o.pbq.f===0&&o.wefa.f===0&&o.wefaRow.every(x=>!x)&&o.fast.f===o.fast.n&&o.fast.n>=30&&o.qabf.f===o.qabf.n&&o.qabf.n>=60),Object.fromEntries(Object.entries(out).map(([k,o])=>[k,[o.mas,o.pbq,o.wefa,o.fast,o.qabf]])));
 ok('IA-1 (E-02): the hypothesis is drafted (the conclusion, the antecedent, the behavior) and the Decision ticked with a rationale, in every scenario',
   Object.values(out).every(o=>o.hyp.every(l=>l>10)&&o.dec.length>=1&&o.note>40),Object.fromEntries(Object.entries(out).map(([k,o])=>[k,[o.hyp,o.dec,o.note]])));
 ok('the Decision fits the scenario: a single-function test for attention and tangible, a functional analysis for escape, a medical referral first for the physical profile',
   out.attention.dec.includes('single')&&out.tangible.dec.includes('single')&&out.escape.dec.includes('fa')&&out.physical.dec.join()==='med',{a:out.attention.dec,t:out.tangible.dec,e:out.escape.dec,p:out.physical.dec});
 await p.close();
 /* ---- the same student across the forms ---- */
 const forms={'TB-1':'TB-1_Target-Behavior-Development_v2026-09.html','IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','PA-1':'PA-1_Preference-Assessment-Protocol_v2026-09.html','RA-1':'Reinforcer_Assessment_Protocol.html',
   'DA-1':'DA-1_Demand-Assessment_v2026-10.html','EA-1':'EA-1_Experimental-Analysis-Protocol_v2026-09.html','TD-1':'TD-1_Function-Based-Treatment-Developer_v2026-09.html','DD-1':'Daily_Behavior_Data_and_Visual_Analysis.html',
   'SM-1':'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','FS-1':'FS-1_FBA-Summary-Report_v2026-09.html','SP-1':'Scatterplot_Pattern_Analysis.html'};
 /* read from the fields the forms show, whatever their state is called */
 const READ=()=>{const vals=[...document.querySelectorAll('input,textarea,select')].map(e=>String(e.value||''));const has=re=>vals.some(v=>re.test(v));
   const named=re=>{const e=[...document.querySelectorAll('input,select')].find(x=>re.test(x.name||'')||re.test(x.id||'')||re.test(x.dataset.m||'')||re.test(x.dataset.f||'')||re.test(x.dataset.k||''));return e?e.value:null;};
   let sid=named(/^sid$|m\.sid|meta\.sid/);try{if(!sid&&typeof state==='object'&&state&&state.meta)sid=state.meta.sid;}catch(e){}
   return {dob:(vals.find(v=>/^(4\/18\/20\d\d|20\d\d-04-18)$/.test(v))||null),old:has(/2014/),school:has(/Example ESE center school/),oldSchool:has(/Sample Elementary/),age:named(/age/i),grade:named(/grade/i),sid};};
 const got={};for(const id of Object.keys(forms)){const q=await b.newPage({viewport:{width:1300,height:950}});q.on('pageerror',e=>errs.push(id+': '+String(e).slice(0,100)));await q.goto(BASE+'/NBH-Workstation/'+forms[id]);await sleep(1500);
   await q.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});for(const i of ['simBtn','btnLoadExample']){const e=document.getElementById(i);if(e){e.click();return;}}});await sleep(3000);
   got[id]=await q.evaluate(READ);await q.close();}
 const dobs=Object.values(got).map(g=>g.dob).filter(Boolean);
 ok('the simulated student is born 4/18/2017 (9 years 6 months this school year) on every form that gives a date of birth, and no form keeps the old 2014 date',dobs.length>=7&&dobs.every(d=>/^(4\/18\/2017|2017-04-18)$/.test(d))&&Object.values(got).every(g=>!g.old)&&got['DD-1'].age==='9 yr 6 mo',got);
 ok('grade 4 at the Example ESE center school wherever the grade or the school is named (DA-1, SM-1, FS-1, DD-1), no Sample Elementary left, and SP-1 carries the student ID',
   got['DA-1'].grade==='4'&&got['DA-1'].school&&got['SM-1'].grade==='4'&&/^4th grade/.test(got['FS-1'].grade||'')&&got['FS-1'].school&&got['DD-1'].school&&Object.values(got).every(g=>!g.oldSchool)&&got['SP-1'].sid==='SIM-000',got);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
