/* v22.73 Form CT-1, review Wave 3 part 2: several caregivers in one record, each with rounds, probes and a sign-off of their
   own, and a household line (F354); a one-page family card printed on its own (I177); the home plan's steps on Form HD-1's
   routine checklist (I179); a booster rehearsal before the next thinning step (I178). Simulated data only.
   usage: node qa/v2273-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CT='CT-1_Caregiver-Training_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async p=>{await p.evaluate(async()=>{await loadSim();});await sleep(500);};
  const setM=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'||e.type==='checkbox'?'change':'input',{bubbles:true}));},[k,v]);
  const sw=(p,i)=>p.evaluate(i=>{const s=document.getElementById('cgSel');s.value=s.options[i].value;s.dispatchEvent(new Event('change',{bubbles:true}));},i);
  const look=p=>p.evaluate(()=>({sel:[...document.getElementById('cgSel').options].map(o=>o.textContent),cur:document.getElementById('cgSel').selectedIndex,
    cg:S.meta.cg,rel:S.meta.rel,coded:Object.keys(S.cells).filter(k=>S.cells[k]).length,probe:S.meta.probe||'',out:S.meta.outcome||'',v:document.querySelector('#verdictBox').textContent,
    house:document.getElementById('cgHouse').hidden?'':document.getElementById('cgHouse').textContent,steps:S.steps.length,safety:S.meta.safety||'',goals:S.goals[0].r}));

  let p=await open(CT);
  await sim(p);let a=await look(p);
  ok('1 F354 the worked example holds two caregivers: the mother, competent on the in-home probe, and the father, not yet trained; the household line says so',
    a.sel.length===2&&a.sel[0]==='1. Mother — Simulated parent'&&a.sel[1]==='2. Father — Simulated parent 2'&&a.cur===0&&
    a.house==='Household: Mother (Simulated parent): competent on the in-home probe · Father (Simulated parent 2): not yet trained. Until every adult who will meet the behavior can run the plan, one adult giving in while another holds out keeps it going.',a);
  await sw(p,1);let b=await look(p);
  ok('2 F354 switching to the father: his own (empty) rounds, probe and sign-off; the goals, the steps and the safety rows are shared',
    b.cur===1&&b.cg==='Simulated parent 2'&&b.rel==='Father'&&b.coded===0&&b.probe===''&&b.out===''&&b.steps===6&&/^If he hits his sister/.test(b.safety)&&/^Coming off the tablet/.test(b.goals)&&/^No rehearsal round has been scored yet/.test(b.v),b);
  /* code a round for the father, then switch back: the mother's record is as it was */
  await p.evaluate(()=>{for(let i=0;i<6;i++){const sel=document.querySelector('#piTbl select[data-s="'+i+'"][data-o="0"]');sel.value='C';sel.dispatchEvent(new Event('change',{bubbles:true}));}});
  await sw(p,0);let c=await look(p);
  ok('3 F354 back to the mother: her rounds, probe and outcome are as they were',c.cg==='Simulated parent'&&c.coded===24&&/^\d+\/\d+\/\d+ — at the tablet transition/.test(c.probe)&&c.out==='Competent on the in-home probe — follow-up probe due'&&/^Competent on the in-home probe/.test(c.v)&&
    /Father \(Simulated parent 2\): in training/.test(c.house),c);
  /* a step deleted: every adult's codes go with it */
  await p.evaluate(async()=>{await delStepAt(0);});await sleep(200);
  const del=await p.evaluate(()=>{const own=S.house.list[1].own.cells;return {mother:Object.keys(S.cells).some(k=>k.startsWith('5_')),father:Object.keys(own).filter(k=>own[k]).sort(),steps:S.steps.length};});
  ok('4 F354 a protocol step deleted: its codes go for every adult, and the codes after it move up',del.steps===5&&!del.mother&&JSON.stringify(del.father)===JSON.stringify(['0_0','1_0','2_0','3_0','4_0']),del);
  await sim(p);
  /* the fit question names the other adults */
  const fit=await p.evaluate(()=>document.getElementById('fitVerdict').textContent);
  ok('5 F354 the fit question on the other adults (Partly) points to the household line',/The other adults in the house: the Household line on the Competency sheet gives where each stands\./.test(fit),fit);
  /* add and remove */
  await p.evaluate(()=>document.getElementById('cgAdd').click());await sleep(200);
  const added=await p.evaluate(()=>({n:S.house.list.length,cur:document.getElementById('cgSel').selectedIndex,cg:S.meta.cg||'',view:document.body.className}));
  await setM(p,'cg','Simulated grandparent');await setM(p,'rel','Grandmother');
  const lab=await p.evaluate(()=>document.getElementById('cgSel').options[2].textContent);
  await p.evaluate(()=>document.getElementById('cgDel').click());await sleep(300);
  const removed=await p.evaluate(()=>({n:S.house.list.length,cg:S.meta.cg}));
  ok('6 F354 + Caregiver adds an empty record and opens Setup; the list names them as they are typed; Remove asks, and takes them out',
    added.n===3&&added.cur===2&&added.cg===''&&added.view==='view-setup'&&lab==='3. Grandmother — Simulated grandparent'&&removed.n===2&&removed.cg==='Simulated parent 2',{added,lab,removed});
  /* save and open: every adult comes back; an older file is one caregiver */
  await sw(p,0);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);
  const fp=await dl.path();const saved=JSON.parse(require('fs').readFileSync(fp,'utf8'));
  await p.evaluate(()=>{S=blank();renderAll();});await (await p.$('#fileIn')).setInputFiles(fp);await sleep(500);
  const back=await look(p);
  const old=JSON.parse(JSON.stringify(saved));delete old.S.house;const tmp=require('path').join(require('os').tmpdir(),'ct1-old2-'+process.pid+'.json');require('fs').writeFileSync(tmp,JSON.stringify(old));
  await (await p.$('#fileIn')).setInputFiles(tmp);await sleep(500);require('fs').unlinkSync(tmp);
  const one=await look(p);
  ok('7 F354 saved and opened: both caregivers come back; a file saved before this opens as one caregiver',saved.S.house.list.length===2&&back.sel.length===2&&back.cg==='Simulated parent'&&back.coded===24&&
    one.sel.length===1&&one.cg==='Simulated parent'&&one.house==='',{n:saved.S.house.list.length,back:back.sel,one:one.sel});
  /* the case, out: the first adult and the household; the steps for the home checklist */
  await sim(p);
  const cg=await p.evaluate(()=>(window.__nbhFactsOut()||{}).caregiver);
  ok('8 F354 I179 the case gets the first caregiver as before, every adult under household, and the protocol steps for the home checklist',
    cg&&cg.name==='Simulated parent'&&cg.stand==='competent on the in-home probe'&&Array.isArray(cg.household)&&cg.household.length===2&&cg.household[1].stand==='not yet trained'&&cg.household[1].rel==='Father'&&
    cg.steps.length===6&&cg.steps[2].crit===true&&/^\d{4}-\d{2}-\d{2}$/.test(cg.thinNext),cg);
  /* I178 the booster rehearsal */
  const due=await p.evaluate(()=>nbhCase.due());
  const bn=await p.evaluate(()=>document.getElementById('ctBoostNote').textContent);
  ok('9 I178 the next thinning step asks for a booster rehearsal of the relapse response before it, on the Today list too',
    due.some(d=>d.what==='Booster rehearsal before the thinning step'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date))&&due.some(d=>d.what==='Next follow-up probe at home (Mother)')&&/^A booster rehearsal of the relapse response with the caregiver is due before \d+\/\d+\/\d{4}/.test(bn),{due,bn});
  await setM(p,'boost_date','2099-01-01');
  const late=await p.evaluate(()=>document.getElementById('ctBoostNote').textContent);
  ok('10 I178 a booster dated after the thinning step is flagged',/falls after the thinning step/.test(late),late);
  await setM(p,'boost_date','');
  /* I177 the family card */
  await p.evaluate(()=>document.querySelector('#viewSeg [data-view="card"]').click());await sleep(200);
  const card=await p.evaluate(()=>{const c=document.getElementById('ctCard');return {t:c.innerText,every:c.querySelectorAll('.ct-every').length,emerg:!!c.querySelector('.ct-card-emerg'),note:document.getElementById('cardNote').hidden?'':document.getElementById('cardNote').textContent,
    name:/SIMULATED|Sample Student|SIM-000/.test(c.innerText)};});
  ok('11 I177 the family card: the routine, the steps (critical ones marked every time), if it comes back, when safety comes first, the emergency box and whom to contact; no name',
    /^At home: Coming off the tablet, about 5pm/.test(card.t)&&/THE STEPS/i.test(card.t)&&card.every===3&&/IF THE BEHAVIOR COMES BACK/i.test(card.t)&&/WHEN SAFETY COMES FIRST/i.test(card.t)&&card.emerg&&/911/.test(card.t)&&/WHOM TO CONTACT/i.test(card.t)&&
    /Prepared with the family on .* by Jordan Ellis/.test(card.t)&&!card.name&&card.note==='',card);
  await setM(p,'cardLang','es');
  const es=await p.evaluate(()=>({t:document.getElementById('ctCard').innerText,note:document.getElementById('cardNote').textContent}));
  ok('12 I177 the headings in Spanish, with a note to have the interpreter translate the rest before it goes home',/^En casa: /.test(es.t)&&/LOS PASOS/i.test(es.t)&&/SIEMPRE/i.test(es.t)&&/Preparado con la familia/.test(es.t)&&/Have the district’s interpreter translate them first/.test(es.note),es);
  await setM(p,'cardLang','');
  /* printing: the card on its own; the form's print without it */
  await p.emulateMedia({media:'print'});
  const vis=()=>p.evaluate(()=>{const v=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;return {card:v(document.getElementById('ctCard')),sum:v(document.querySelector('section.only-sum')),head:v(document.querySelector('main.sheet .nbh-print-head')),bar:v(document.querySelector('.ct-cardbar'))};});
  const normal=await vis();
  await p.evaluate(()=>document.body.classList.add('ct-card-print'));const only=await vis();await p.evaluate(()=>document.body.classList.remove('ct-card-print'));
  await p.emulateMedia({media:'screen'});
  ok('13 I177 printed alone with its own button, the card is the whole page; the form\'s own print leaves it out',!normal.card&&normal.sum&&only.card&&!only.sum&&!only.head&&!only.bar,{normal,only});
  await p.close();

  /* I179 Form HD-1 */
  p=await open('HD-1_Home-Data-Sheets_v2026-10.html');
  const hd=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({caregiver:{name:'Simulated parent',steps:[{d:'Give the five-minute warning (simulated)',crit:false},{d:'Hold out while he protests (simulated)',crit:true}],src:'CT-1'},
      behaviors:[{label:'Hands the break card (simulated)',isRep:true}]});return {sk:S.sk.map(x=>x.who+': '+x.label),note:r&&r.note};});
  const hd2=await p.evaluate(()=>{window.__nbhFactsIn({caregiver:{steps:[{d:'Something else (simulated)'}],src:'CT-1'}});return S.sk.map(x=>x.who+': '+x.label);});
  ok('14 I179 Form HD-1 puts the home plan\'s steps on the routine checklist as Adult steps, before the child\'s, and says the ticks are a self-report read beside the probes; once there, they are not added again',
    JSON.stringify(hd.sk)===JSON.stringify(['Adult: Give the five-minute warning (simulated)','Adult: Hold out while he protests (simulated)','Child: Hands the break card (simulated)'])&&/self-report: read them beside the follow-up probes on Form CT-1/.test(hd.note||'')&&
    JSON.stringify(hd2)===JSON.stringify(hd.sk),{hd,hd2});
  await p.close();
  /* PR-1 */
  p=await open('PR-1_Periodic-Plan-Review_v2026-09.html');
  const also=await p.evaluate(()=>prAlsoText({caregiver:{name:'Simulated parent',rel:'Mother',stand:'competent on the in-home probe',due:'2026-10-26',household:[{name:'Simulated parent',rel:'Mother',stand:'competent on the in-home probe'},{name:'Simulated parent 2',rel:'Father',stand:'not yet trained'}],src:'CT-1'}}));
  ok('15 F354 Form PR-1 names every adult in the home and where each stands',also==='The home plan (Form CT-1): Simulated parent (mother), competent on the in-home probe; Simulated parent 2 (father), not yet trained; follow-up probe due 10/26.',also);
  await p.close();
  /* the runner locks the caregiver list while a round is open */
  p=await open(CT);await sim(p);
  await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="train"]').click();document.getElementById('rrOpen').click();});await sleep(200);
  await p.evaluate(()=>document.getElementById('rrStart').click());await sleep(200);
  const lk=await p.evaluate(()=>({sel:document.getElementById('cgSel').disabled,add:document.getElementById('cgAdd').disabled,locked:rrRunner.locked()}));
  ok('16 F354 while a rehearsal round is open, the caregiver cannot be switched, added or removed',lk.sel&&lk.add&&lk.locked.includes('#cgSel')&&lk.locked.includes('#cgDel'),lk);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('17 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
