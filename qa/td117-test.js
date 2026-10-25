/* v24.17 Form TD-1 correctness (the 10/25 review): the selectors' ticks follow the Build sheet; the worked example is a plan
   staff can run; Reinforcers B.4 fills from Setup. usage: node qa/td117-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 /* Reinforcers B.4 from Setup, on a fresh form */
 const pa=await p.evaluate(()=>{const out={};td117.setv('m.fn','escape');document.querySelector('[name="m.fn"]').dispatchEvent(new Event('change',{bubbles:true}));out.esc=td117.val('pa.3');
   td117.setv('pa.3','');td117.setv('m.fn','tangible');document.querySelector('[name="m.fn"]').dispatchEvent(new Event('change',{bubbles:true}));out.tan=td117.val('pa.3');
   document.querySelector('#viewSeg [data-view="reinf"]').click();out.label=[...document.querySelectorAll('#paModel .qt')].map(q=>q.textContent).find(t=>/Function of the problem behavior/.test(t))||'';return out;});
 ok('Reinforcers B.4 fills from the Setup function when empty (escape counts as none or automatic; tangible as tangible) and its label says so',pa.esc==='none or automatic'&&pa.tan==='tangible'&&/filled from Setup/.test(pa.label),pa);
 /* the worked example, every scenario: a plan staff can run */
 const keys=await p.evaluate(()=>[...document.querySelectorAll('#simScenario option')].map(o=>o.value));
 const per={};
 for(const k of keys){
   await p.evaluate(k=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(1500);
   per[k]=await p.evaluate(()=>{const m=td117.meter();const cards=[...document.querySelectorAll('#compWrap .card')];const codes=cards.map(c=>c.dataset.code);
     const who=cards.every(c=>td117.val(`cp[${c.dataset.i}].who`)&&td117.val(`cp[${c.dataset.i}].when`)&&td117.val(`cp[${c.dataset.i}].where`));
     document.querySelector('#viewSeg [data-view="final"]').click();const fin=document.getElementById('final').textContent;
     return {n:m.n,steps:m.steps,ok:m.ok,who,review:!!td117.val('m.review'),q6:(()=>{const fn=td117.val('m.fn'),m=td117.models()[fn];return m?td117.val(`q.${fn}.${m.q.length-1}`):'';})(),chosen:td117.val('sel.chosen'),codes:codes.join(','),notReady:/Not ready to start/.test(fin),dashes:(fin.match(/Run by/g)||[]).length,glanceDash:[...document.querySelectorAll('#final .td-glance tbody tr')].filter(r=>/—/.test(r.children[2].textContent)).length};});
 }
 const all=Object.values(per);
 ok('every scenario loads a plan within the form\'s limit (7 components, 60 staff steps) and the Final plan carries no "Not ready" notice',all.every(x=>x.ok&&x.n<=7&&x.steps<=60&&!x.notReady),per);
 ok('every card says who runs it, when and where; Setup has its review line; the model\'s last question is answered; Components chosen lists the cards on Build',
   all.every(x=>x.who&&x.review&&!!x.q6&&x.glanceDash===0&&x.chosen===x.codes.split(',').filter((c,i,a)=>a.indexOf(c)===i).join(', ')),per);
 ok('the escape scenario keeps its own components, the consequence protocol, protective procedures and the high-p sequence',/^FCT,EXT,R_PB,SAFE,A_HIGHP/.test(per.escape_fct.codes),per.escape_fct);
 /* the ticks follow the Build sheet (escape scenario) */
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1500);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="antecedent"]').click());await sleep(500);
 const rows=()=>p.evaluate(()=>[...document.querySelectorAll('#antRec .td-rec')].map(r=>({code:r.dataset.code,on:r.classList.contains('on'),onb:r.classList.contains('td-onb'),checked:r.querySelector('.td-pick').checked,label:r.querySelector('.td-pk span').textContent,card:[...document.querySelectorAll('#compWrap .card')].some(c=>c.dataset.code===r.dataset.code)})));
 let R=await rows();
 ok('on Antecedents every component with a card on Build reads "On the Build sheet", ticked; the rest "Ticked to add" or "Not in the plan"',R.length>=4&&R.every(r=>r.card?(r.onb&&r.checked&&r.label==='On the Build sheet'):(!r.onb&&(r.checked?r.label==='Ticked to add':r.label==='Not in the plan')))&&R.some(r=>r.card)&&R.some(r=>!r.card),R);
 await p.evaluate(()=>{const t=[...document.querySelectorAll('#antRec .td-rec')].find(r=>r.dataset.code==='A_HIGHP').querySelector('.td-pick');t.click();});await sleep(300);
 R=await rows();const hp=R.find(r=>r.code==='A_HIGHP');
 const gone=await p.evaluate(()=>!document.querySelector('#compWrap .card[data-code="A_HIGHP"]'));
 ok('unticking the high-p sequence on Antecedents removes its card from Build and the row reads "Not in the plan"',gone&&hp&&!hp.checked&&hp.label==='Not in the plan'&&!hp.onb,{hp,gone});
 await p.evaluate(()=>{const t=[...document.querySelectorAll('#antRec .td-rec')].find(r=>r.dataset.code==='A_HIGHP').querySelector('.td-pick');t.click();});await sleep(300);
 R=await rows();const hp2=R.find(r=>r.code==='A_HIGHP');
 ok('ticking it again marks it "Ticked to add" (no card until it is sent)',hp2&&hp2.checked&&hp2.label==='Ticked to add'&&!hp2.onb,hp2);
 await p.evaluate(()=>{td117.add('A_HIGHP');});await sleep(400);
 R=await rows();const hp3=R.find(r=>r.code==='A_HIGHP');
 ok('a card added on Build turns the row to "On the Build sheet" by itself',hp3&&hp3.onb&&hp3.label==='On the Build sheet',hp3);
 await p.evaluate(()=>{document.querySelector('#compWrap .card[data-code="A_HIGHP"] [data-rm]').click();});await sleep(400);
 R=await rows();const hp4=R.find(r=>r.code==='A_HIGHP');
 ok('Remove on the card turns the row back (the stored tick stays, so "Ticked to add")',hp4&&!hp4.onb&&hp4.label==='Ticked to add',hp4);
 const sl=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="select"]').click();return document.getElementById('sendBuild').textContent;});
 ok('the Select sheet\'s send button counts what is left to add and what is already there',/Add the \d+ ticked components? to Build · \d+ already there/.test(sl)||/Add the 0 ticked components to Build · \d+ already there/.test(sl),sl);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
