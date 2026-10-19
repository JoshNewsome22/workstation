/* Form DT-1, review Wave 3 part 3: the delay-tolerance protocol goes to the case (F402, I202), and Form TD-1's delay component
   and thinning ladder, Form QS-1's day, Form TI-1's steps (on request) and Form PR-1's fading sequence take it into their empty
   places; DT-1's safety and consent block takes the student's assent from Form SI-1 and the rule for problem behavior from Form
   TD-1 (I204). Simulated data only. usage: node qa/dt1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const DT='Delay-Tolerance-Protocol-Toolkit.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  /* ---- F402 the protocol to the case ---- */
  const p=await open(DT);
  const none=await p.evaluate(()=>window.__nbhFactsOut());
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const D=await p.evaluate(()=>window.__nbhFactsOut().delay);
  ok('1 F402 DT-1 sends its protocol to the case: the arrangement, the tolerance response, the cues, the activity, the rules, the ladder with the step in training; nothing while there is no protocol',
    none===null&&D.arrange==='fct'&&/^Hands the break card/.test(D.tr)&&/^Green card/.test(D.cues)&&D.activity==='Two low-effort maintenance problems already mastered'&&D.prob==='2 of 5, randomly selected'&&
    D.ladder.map(x=>x.s).join()==='3,6,10,20,45,90,180'&&D.current===180&&D.mastered===90&&/^80% of delays waited/.test(D.crit)&&/^Extinction/.test(D.pbDuring)&&D.src==='DT-1',{none,D});
  const it=D.items;
  ok('2 F402 the integrity steps are written with this case\'s details and tagged as Form TI-1 tags a step (no choice step on the FCT path)',
    it.length===11&&!it.some(x=>/Choice options presented/.test(x.d))&&it.some(x=>/^Delay cue delivered from the rotation, once, in a neutral tone \(cues: Green card/.test(x.d)&&x.cmp==='ant')&&
    it.some(x=>/^Problem behavior during the delay handled as written: Extinction: the delay runs on.*; a stopped session: The two problems in progress/.test(x.d)&&x.cmp==='con'&&x.crit)&&
    it.some(x=>/^Immediate-reinforcement trials \(2 of 5, randomly selected\) delivered within 2 s$/.test(x.d)&&x.crit)&&it.some(x=>/^Antecedent rule stated verbatim: /.test(x.d)),it);
  const sh=await open('index.html');
  const reg=await sh.evaluate(()=>({src:FACT_SRC['DT-1'],gen:FACT_GEN.includes('DT-1'),has:!!hasFacts({delay:{ladder:[{s:3}]}}),sig:factsSig({delay:{ladder:[{s:33}]}}).includes('33')}));
  ok('3 F402 the workstation takes DT-1\'s protocol into the case',reg.src==='delay'&&reg.gen&&reg.has&&reg.sig,reg);
  /* ---- TD-1 ---- */
  const td=await open(file('TD-1_'));
  const t1=await td.evaluate(d=>{const b=document.createElement('button');b.dataset.addsch='DT_PROG';document.body.appendChild(b);b.click();b.remove();
    const c=document.querySelector('#compWrap .card[data-code="DT_PROG"]'),i=c.dataset.i,v=k=>document.querySelector('[name="cp['+i+'].p'+k+'"]').value;
    const before=[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^DT_PROG/.test(tr.children[0].textContent)).length;
    const r=window.__nbhFactsIn({delay:d});const rows=[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^DT_PROG/.test(tr.children[0].textContent)).map(tr=>[...tr.children].map(x=>x.textContent));
    const out={before,r,p:[v(0),v(1),v(2)],rows};window.__nbhFactsIn({});
    out.back=[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^DT_PROG/.test(tr.children[0].textContent)).map(tr=>tr.children[1].textContent);
    document.querySelector('[name="cp['+i+'].p0"]').value='Our own steps (simulated)';window.__nbhFactsIn({delay:d});out.kept=v(0);return out;},D);
  ok('4 F402 Form TD-1\'s delay component takes DT-1\'s ladder, activity and cue where it held the library\'s wording, and its thinning ladder is DT-1\'s steps with DT-1\'s rules',
    t1.r&&/the delay steps from Form DT-1/.test(t1.r.note)&&t1.p[0]==='3 s, 6 s, 10 s, 20 s, 45 s, 90 s, 3 min (Form DT-1)'&&t1.p[1]==='Two low-effort maintenance problems already mastered'&&/^Green card/.test(t1.p[2])&&
    t1.rows.length===7&&/^3 s \(met \d{4}-\d\d-\d\d, Form DT-1\)$/.test(t1.rows[0][1])&&t1.rows[6][1]==='3 min (in training, Form DT-1)'&&/^80% of delays waited.*; Advance one step when the criterion is met on two consecutive sessions \(Form DT-1\)$/.test(t1.rows[0][2])&&
    /^Step back one level after two consecutive sessions below 50% of delays waited/.test(t1.rows[1][3]),t1);
  ok('5 F402 without a protocol in the case the library\'s steps come back, and a card the BCBA wrote is kept',t1.back.length===5&&t1.back[0]==='5-s signaled delay'&&t1.kept==='Our own steps (simulated)',t1);
  /* ---- QS-1 ---- */
  const q=await open(file('QS-1_'));
  const day=await q.evaluate(d=>{window.__nbhFactsIn({delay:d});window.__nbhFactsIn({delay:d});return S.day.map(x=>x.text).filter(x=>/^Waiting after a request:/.test(x));},D);
  ok('6 F402 Form QS-1 gives staff the waiting line once: the cue, the tolerance response, the activity, the wait now in training and the rule for problem behavior',
    day.length===1&&/^Waiting after a request: give the delay cue \(Green card = the break is coming, keep working; the visual timer is started in view of the student\); the student answers with the tolerance response \(hands the break card, then says or signs “okay” and starts the intervening activity\) and starts two low-effort maintenance problems already mastered; what was asked for comes when the wait is done \(now 3 min\)\. Problem behavior during the wait: extinction: the delay runs on; the behavior does not end the wait or bring the reinforcer\.$/.test(day[0]),day);
  /* ---- TI-1 ---- */
  const ti=await open(file('TI-1_'));
  const t3=await ti.evaluate(d=>{window.__nbhFactsIn({delay:d});const b=document.getElementById('addDelay');const shown=b&&b.style.display!=='none',title=b&&b.title;const n0=S.steps.filter(s=>String(s.d||'').trim()).length;
    b.click();const st=S.steps.filter(s=>/^Delay training: /.test(s.d));b.click();const st2=S.steps.filter(s=>/^Delay training: /.test(s.d)).length;
    return {shown,title,n0,n:st.length,st2,con:st.filter(s=>s.cmp==='con'&&s.crit).length,ant:st.filter(s=>s.cmp==='ant').length,first:st[0]&&st[0].d};},D);
  ok('7 F402 Form TI-1 adds DT-1\'s integrity steps on request, tagged by component, once, beside the steps already there',
    t3.shown&&t3.title==='11 integrity steps on Form DT-1'&&t3.n===11&&t3.st2===11&&t3.con===6&&t3.ant===4&&/^Delay training: Pre-session access/.test(t3.first),t3);
  /* ---- PR-1 ---- */
  const pr=await open(file('PR-1_'));
  const t4=await pr.evaluate(d=>{const r=window.__nbhFactsIn({delay:d});window.__nbhFactsIn({delay:d});const F=S.fade.filter(x=>/Form DT-1/.test(x.s));
    const ui=document.querySelector('#fadeTbl [data-f="s"]').value;return {n:F.length,f:F[0],note:r&&r.note,ui};},D);
  ok('8 F402 Form PR-1 puts the delay ladder on its fading sequence once: the support and its steps, DT-1\'s criterion, the first step met, where it stands',
    t4.n===1&&t4.f.s==='Immediate delivery after a request: the wait lengthened 3 s, 6 s, 10 s, 20 s, 45 s, 90 s, 3 min (Form DT-1)'&&/^80% of delays waited/.test(t4.f.c)&&/^\d{4}-\d\d-\d\d$/.test(t4.f.d)&&t4.f.m==='In progress'&&
    /^Last step met: 90 s \(\d{4}-\d\d-\d\d\); in training: 3 min$/.test(t4.f.w)&&t4.ui===t4.f.s&&/the delay ladder from Form DT-1/.test(t4.note),t4);
  /* ---- I204 ---- */
  const p2=await open(DT);
  const CASE={student:{assent:'given',date:'2026-10-14',stop:{signs:'pushes the card away (simulated)',steps:'end the trial and offer a break (simulated)'}},plan:{respond:{target:'Block and redirect to the work; the demand stays (simulated)'}}};
  const t5=await p2.evaluate(c=>{const r=window.__nbhFactsIn(c);const n=document.getElementById('dtPbNote');return {r,asn:document.querySelector('[name=s_assent]').value,pb:document.querySelector('[name=pb_during]').value,note:n&&!n.hidden?n.textContent:''};},CASE);
  ok('9 I204 the safety and consent block takes the student\'s assent from Form SI-1 and the rule for problem behavior from Form TD-1, with TD-1\'s words under it',
    t5.asn==='Form SI-1, 10/14/2026; assent given; says stop by: pushes the card away (simulated); then: end the trial and offer a break (simulated)'&&t5.pb==='As the behavior plan writes it (Form TD-1)'&&
    t5.note==='Form TD-1 writes: Block and redirect to the work; the demand stays (simulated)'&&/the assent from Form SI-1/.test(t5.r.note),t5);
  const p3=await open(DT);
  const t6=await p3.evaluate(c=>{document.querySelector('[name=s_assent]').value='Typed (simulated)';const s=document.querySelector('[name=pb_during]');s.value=s.options[1].value;window.__nbhFactsIn(c);
    return {asn:document.querySelector('[name=s_assent]').value,pb:s.value,note:(document.getElementById('dtPbNote')||{}).hidden};},CASE);
  ok('10 I204 what the BCBA wrote is kept',t6.asn==='Typed (simulated)'&&/^Extinction/.test(t6.pb)&&t6.note!==false,t6);
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
