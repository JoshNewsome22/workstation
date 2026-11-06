/* v25.65, batch 2, parcel DELAY: the approved changes from the review of Forms DT-1 and AD-1 against the JABA research on delay,
   waiting, denial and accumulated reinforcement (DELAY-H1 to H5, M1 to M12, L1 to L7), at least one check each, and a record saved
   before v25.65 opening as it was written. Simulated data only.   usage: node qa/v2565-delay-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const DT='Delay-Tolerance-Protocol-Toolkit.html',AD='AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html';
const NAMES=/\b(David|Chris|Alex|Jack|Evan|Alice|Jillian|Hugh|Kevin|Lyle|Willis|Miles|Harmony|Roland|Finn|Joel|Sawyer|Liam|Asher|Dean|Jess|Molly|Eve)\b/;
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__said=m;};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  /* the form's own saved file, caught, and a file given back to the form's Open */
  const save=p=>p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();for(let i=0;i<50&&txt===null;i++)await new Promise(r=>setTimeout(r,100));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;return JSON.parse(txt);});
  const load=(p,d)=>p.evaluate(async d=>{const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,700));},d);
  const setv=(p,n,v,ev)=>p.evaluate(([n,v,ev])=>{const e=document.querySelector('[name="'+n+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event(ev||'input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v,ev]);
  const T=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},s);
  const H=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.hidden:null;},s);

  /* ================= Form DT-1 ================= */
  const d=await open(DT);
  const f0=await d.evaluate(()=>({lab:document.querySelector('label[for=a3]').textContent,sh:['share_imm','share_del','share_den'].map(n=>document.querySelector('[name='+n+']').value),
    den:[...document.querySelector('#tbTrials tr select').options].map(o=>o.value),alt:[...document.querySelector('[name=den_alt]').options].map(o=>o.value).filter(Boolean),
    pace:document.querySelector('[name=pace_rule]').value,place:document.querySelector('[name=delay_place]').value,pbc:document.querySelector('[name=pb_crit]').value,lag:document.querySelector('[name=tok_lag]').value,
    sigTh:[...document.querySelectorAll('#tbTrials')[0].closest('table').querySelectorAll('th')].map(t=>t.textContent).pop()}));
  ok('1 H1 the FCT path is named for delay and denial; three shares start at 40/60/0; a denial trial (DEN) is on the sheet; a denial gives an alternative or a contingency',
    /^Delay and denial tolerance after FCT\./.test(f0.lab)&&f0.sh.join()==='40,60,0'&&f0.den.join()===',Delay,IMM,DEN'&&f0.alt.length===2&&/^An alternative preferred activity at once/.test(f0.alt[0])&&/^A stated contingency/.test(f0.alt[1]),f0);
  await setv(d,'share_den','10');const s1=await T(d,'#shareOut');await setv(d,'share_del','50');const s2=await T(d,'#shareOut');
  ok('2 H1 the shares must add to 100%, and denied trials before any delay step is met are flagged',/add to 110%: they must add to 100%/.test(s1)&&/^The shares add to 100%\. Denied trials are planned, but no delay step has been met yet/.test(s2),{s1,s2});
  ok('3 H1/H2 defaults: problem behavior at or below 0.10 of baseline, delay after the work, fixed trial length; the response-to-token lag stays 2 s',
    /^At or below 0\.10 of the baseline mean/.test(f0.pbc)&&/^After the work/.test(f0.place)&&/^Fixed trial length/.test(f0.pace)&&f0.lag==='2',f0);
  await setv(d,'tok_lag','3');const lag=await H(d,'#dtLagWarn');await setv(d,'tok_lag','2');
  ok('4 H3 DT-1 warns above 2 s from the response to the token',lag===false&&(await H(d,'#dtLagWarn'))===true);
  await d.evaluate(()=>{const r=document.getElementById('dt2');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);const tb=await T(d,'#tbpdNote');const tbh=await H(d,'#tbpdNote');
  ok('5 H2 the time-based option shows its relapse figures (46.5% of steps, 0.53 of baseline; 25.9%, 0.15)',tbh===false&&/46\.5% of steps, at a mean of 0\.53 of baseline\. Delays that end on a response requirement: 25\.9% of steps, 0\.15 of baseline \(Marshall et al\., 2025\)/.test(tb),tb);
  const cit=await d.evaluate(()=>document.getElementById('p4').textContent.replace(/\s+/g,' ')+' || '+document.getElementById('p9').textContent.replace(/\s+/g,' '));
  ok('6 H2 the resurgence-prevalence figure is credited to Marshall et al. (2025), not to Drifke et al. (2020)',!/roughly in half relative to time-based thinning \(Drifke/.test(cit)&&!/reduces the prevalence and magnitude of resurgence relative to time-based thinning \(Drifke/.test(cit)&&/nearly in half relative to time-based thinning \(Marshall et al\., 2025\)/.test(cit));
  ok('7 L7 the reset-rule note says Iannaccone and Jessel studied college students, and pairs Drifke et al. as the clinical replication',/Iannaccone and Jessel \(2021\), a translational study with college students/.test(cit)&&/Drifke et al\. \(2020\) replicated the DRA advantage clinically/.test(cit));
  /* the simulated case */
  await d.evaluate(()=>document.getElementById('btnSim').click());await sleep(1600);
  const sm=await d.evaluate(()=>({rel:document.getElementById('dtRelapse').textContent.replace(/\s+/g,' '),cells:[...document.getElementById('tbProg').rows].map(tr=>tr.cells[7].textContent),plan:document.getElementById('dtRelapsePlan').hidden,
    th:[...document.getElementById('tbProg').closest('table').querySelectorAll('th')].map(t=>t.textContent)[7],dd:document.getElementById('ddPlan').hidden,ddt:document.getElementById('ddPlan').textContent}));
  ok('8 H2 Progress reads each session against the baseline mean (0.29 per minute) and flags the return at the new 45-s step (session 15, 0.69 of baseline); the plan line shows on the FCT path',
    /Baseline mean: 0\.29 problem behavior per minute/.test(sm.rel)&&/New steps checked \(first 3 sessions against the last 5 of the step before\): 6; problem behavior returned at 1\./.test(sm.rel)&&/Problem behavior returned at 45 s \(from 20 s; session 15\): highest so far 0\.20 per minute \(session 15\), 0\.69 of baseline/.test(sm.rel)&&sm.th==='PB / baseline'&&sm.cells[14]==='0.69'&&sm.plan===false,sm);
  await setv(d,'pb_crit','At or below 0.10 of the baseline mean (a 90% reduction)','change');await sleep(150);
  const rc=await d.evaluate(()=>({rel:document.getElementById('dtRelapse').textContent.replace(/\s+/g,' '),c:document.getElementById('tbProg').rows[14].cells[7].textContent}));
  ok('9 H2 with the baseline criterion the return is marked above criterion (over 0.10), in the readout and the row',/0\.69 of baseline, above criterion/.test(rc.rel)&&rc.c==='0.69 above'&&/at or below 0\.10 of it \(0\.029 per minute\)/.test(rc.rel),rc);
  const ren=await d.evaluate(()=>{const tb=document.getElementById('tbGen'),tr=tb.rows[0],f=tr.querySelectorAll('input,select');f[0].value='Context change (new room, new adult, home)';f[6].value='0.3';f[0].dispatchEvent(new Event('input',{bubbles:true}));return document.getElementById('dtRenewal').textContent;});
  ok('10 H2 a context-change probe on Tab 8A is checked for renewal against the last 5 sessions before it',/Problem behavior returned on the context change probe of \d{4}-\d\d-\d\d: 0\.30 per minute against at most 0\.04 in the last 5 sessions before it \(1\.03 of baseline, above criterion\)/.test(ren),ren);
  ok('11 M6 a low AUC (0.29) says to plan token exchange within the session (Form AD-1)',sm.dd===false&&/Plan token exchange within the session; a delayed exchange is likely to cost this student more than peers \(Form AD-1\)/.test(sm.ddt),sm.ddt);
  const pr=await d.evaluate(()=>dtProtocol());
  ok('12 H1/H2/M6/L1 the protocol for the case carries the shares, the denial, the unavailable-item script, the criterion, the plan line, the signal, asking when and the AUC',
    pr&&pr.shares&&pr.shares.imm===40&&pr.shares.del===60&&pr.shares.den===0&&pr.denialSay==='“Not this time.”'&&/^A stated contingency/.test(pr.denialGives)&&'unavailable' in pr&&/^At or below 0\.10/.test(pr.pbCrit)&&/^Plan for problem behavior to come back/.test(pr.relapsePlan)&&
    /^A continuous signal/.test(pr.signal)&&pr.askWhen===false&&pr.discount&&pr.discount.auc===0.29&&pr.arrangeLabel==='Delay and denial tolerance after FCT',pr);
  /* a denial trial on the session sheet */
  const dn=await d.evaluate(()=>{const tb=document.getElementById('tbTrials');const tr=tb.rows[9];const f=tr.querySelectorAll('input,select');f[0].value='DEN';f[0].dispatchEvent(new Event('input',{bubbles:true}));f[1].value='SC';f[5].value='Indep.';f[6].value='Yes';f[7].value='0';f[1].dispatchEvent(new Event('input',{bubbles:true}));
    return {lab:f[1].selectedOptions[0].textContent,den:document.getElementById('oDen').textContent,crit:document.getElementById('oCrit').textContent,tr:document.getElementById('oTR').textContent};});
  ok('13 H1 a denial trial reads Accepted, counts in the session criterion with the delay trials (6 of 7), and its tolerance response is read (5 of 7 independent)',dn.lab==='Accepted'&&dn.den==='1/1 (100.0%)'&&dn.crit==='6/7 (85.7%)'&&dn.tr==='71.4%',dn);
  await d.evaluate(()=>{const f=document.getElementById('tbTrials').rows[9].querySelectorAll('input,select');f[0].value='IMM';f[1].value='';f[5].value='';f[6].value='';f[0].dispatchEvent(new Event('input',{bubbles:true}));});
  /* M2: the Signal column, and the CSV that holds it only once a signal is scored */
  const csv=async()=>d.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSsCsv').click();for(let i=0;i<50&&txt===null;i++)await new Promise(r=>setTimeout(r,100));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;return txt.split('\r\n');});
  const c0=await csv();
  await d.evaluate(()=>{const f=document.getElementById('tbTrials').rows[0].querySelectorAll('input,select');f[11].value='Continuous';f[0].dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('btnCarry').click();});await sleep(500);
  const c1=await csv();
  ok('14 M2 the trial table has a Signal column (last, so saved trials keep their places); the trial CSV gains it only once a signal is scored',sm&&f0.sigTh==='Signal'&&/,Notes$/.test(c0[0])&&/,Notes,Signal$/.test(c1[0])&&/,Continuous$/.test(c1.find(l=>/^22,/.test(l))||''),{h0:c0[0],h1:c1[0],l:c1.find(l=>/^22,/.test(l))});
  const sg=await d.evaluate(()=>({o:[...document.querySelector('[name=sig_type]').options].map(o=>o.value).filter(Boolean),rule:document.getElementById('p4').textContent}));
  ok('15 M2 the signal used is recorded (none, a brief verbal cue, a continuous signal), and the rule says a signal is added to progressive delay, not a stand-alone treatment',sg.o.length===3&&/^A brief verbal cue/.test(sg.o[1])&&/^A continuous signal/.test(sg.o[2])&&/A signal is added to progressive delay\. It is not a stand-alone treatment\./.test(sg.rule),sg.o);
  const un=await d.evaluate(()=>{const g=[...document.getElementById('tbGen').rows].find(tr=>tr.querySelector('select').value==='Unsignaled, no activity');g.querySelectorAll('input')[2].value='';
    const m=document.getElementById('tbMaint').rows[0].querySelectorAll('input');m[2].value='2026-10-01';m[2].dispatchEvent(new Event('input',{bubbles:true}));return {h:document.getElementById('dtUnsigNote').hidden,t:document.getElementById('dtUnsigNote').textContent};});
  ok('16 M2 a maintenance probe run with no unsignaled probe is flagged: the unsignaled probe is required before maintenance',un.h===false&&/run the unsignaled probe with no activity \(Tab 8A\) before maintenance probes/.test(un.t),un);
  /* M1 trial pacing */
  await setv(d,'pace_rule','Not fixed','change');const pw=await d.evaluate(()=>({h:document.getElementById('paceWarn').hidden,t:document.getElementById('paceWarn').textContent,ti:[...document.querySelectorAll('#tbTI tr td:first-child')].map(t=>t.textContent).pop()}));
  ok('17 M1 trial pacing: Not fixed prints the caution; the integrity checklist has the trial-length step',pw.h===false&&/Smaller-sooner choices also speed up the session; read a shift toward them with caution\./.test(pw.t)&&/^Trial length held as written/.test(pw.ti),pw);
  await setv(d,'ss_pace','Not fixed','change');await d.evaluate(()=>document.getElementById('btnCarry').click());await sleep(500);
  const sp=await d.evaluate(()=>{const L=JSON.parse(document.getElementById('dtSessLog').value);return L.find(e=>e.ss_num==='22').ss_pace;});
  ok('18 M1 the session header keeps its trial pacing in the session log',sp==='Not fixed',sp);
  /* M3, M4, M5 */
  await setv(d,'ia_with','The larger-later option only','change');const iw=await H(d,'#iaWithWarn');
  const m3=await d.evaluate(()=>({pref:[...document.querySelector('[name=ia_pref]').options].map(o=>o.value).filter(Boolean).join('|'),alt:[...document.querySelector('[name=ia_type]').options].some(o=>/^Alternative functional reinforcer during the delay/.test(o.value))}));
  ok('19 M3 the activity\'s preference level and side are recorded, the delayed-side caution shows, and an alternative functional reinforcer is an option',iw===false&&m3.pref==='High|Moderate|Low|Not assessed'&&m3.alt,m3);
  const m4=await d.evaluate(()=>({o:[...document.querySelector('[name=delay_place]').options].map(o=>o.value).filter(Boolean),t:document.getElementById('p4').textContent.replace(/\s+/g,' ')}));
  ok('20 M4 where the delay falls is recorded, after the work by default, with the Gadaire et al. note',m4.o.length===2&&/Waits placed before the task produced more impulsive choices for every child studied/.test(m4.t),m4.o);
  await setv(d,'rule_after_n','6');const rl=await T(d,'#ruleLine');const rh=await d.evaluate(()=>[...document.querySelector('[name=rule_how]').options].map(o=>o.value).filter(Boolean).join('|'));
  ok('21 M5 how the rule is given is recorded, and Tab 6 says to add a rationale and rule after the number of sessions written',/^If progressive delay alone has not shifted choice after 6 sessions, add a stated rationale and rule before changing the reinforcer\. For students with emotional or behavioral disorders, expect some not to respond even then/.test(rl)&&/With a rationale/.test(rh),{rl,rh});
  /* M6: hypothetical money; M7: the paired-dimension assessment; medication */
  const m6=await d.evaluate(()=>[...document.querySelector('[name=dd_rule]').options].map(o=>o.value).pop());
  ok('22 M6 the hypothetical-money format is offered for verbal students, about grade 4 and up, and labelled',m6==='Hypothetical money (verbal students, about grade 4 and up)',m6);
  const m7=await d.evaluate(()=>{['dim_mag','dim_dur','dim_qual','dim_rate'].forEach(n=>{document.querySelector('[name='+n+']').checked=false;});const tb=document.getElementById('tbPair');tb.innerHTML='';
    const add=v=>{document.querySelector('[data-add=tbPair]').click();const f=tb.rows[tb.rows.length-1].querySelectorAll('input,select');v.forEach((x,i)=>{f[i].value=x;});f[0].dispatchEvent(new Event('input',{bubbles:true}));};
    add(['Rate against immediacy','10','3']);add(['Quality against immediacy','10','7']);add(['Rate against quality','10','4']);
    const out=document.getElementById('pairOut').textContent;document.getElementById('btnPairDim').click();return {out,q:document.querySelector('[name=dim_qual]').checked,med:!!document.querySelector('[name=med_change]')};});
  ok('23 M7 the paired-dimension assessment ranks the dimensions and names the one that competes best against immediacy; the button ticks it on Tab 1; medication is recorded',
    /^Share of choices won: Quality 65%, Immediacy 50%, Rate 35%\. Competes best against immediacy: Quality \(7 of 10 choices, 70%\)/.test(m7.out)&&m7.q&&m7.med,m7);
  /* M12 */
  const m12=await d.evaluate(()=>{const tb=document.getElementById('tbBT');document.querySelector('[data-add=tbBT]').click();const f=tb.rows[0].querySelectorAll('input');f[0].value='Long division';f[1].value='10';f[2].value='8';f[0].dispatchEvent(new Event('input',{bubbles:true}));
    return {pc:tb.rows[0].cells[3].textContent,t:document.getElementById('preEsc').textContent.replace(/\s+/g,' ')};});
  ok('24 M12 the selection-order method is called this form\'s own; the break-or-task check computes the share; the Porter and Sy method is written only as a labelled option',
    m12.pc==='80.0%'&&/This form ranks tasks by selection order\. That is a practical substitute, not the published method/.test(m12.t)&&/Touching the break card is an appropriate choice, never problem behavior/.test(m12.t)&&/OPTION: Reinforces problem behavior on purpose:/.test(m12.t)&&!/not for school or home/i.test(m12.t),m12.pc);
  const l13=await d.evaluate(()=>({w:!!document.querySelector('[name=tr_when]'),g:!!document.querySelector('[name=gen_late]'),u:!!document.querySelector('[name=ho_unavail]'),opt:[...document.querySelector('#tbGen select').options].some(o=>/^Context change/.test(o.value))}));
  ok('25 L1/L3/H1 asking "when?" is an optional second response; the late-exchange generalization tactic and the unavailable-item script are on Tab 8',l13.w&&l13.g&&l13.u&&l13.opt,l13);
  const dtTxt=await d.evaluate(()=>document.body.textContent);
  ok('26 L6 no study participant is named in DT-1',!NAMES.test(dtTxt),(NAMES.exec(dtTxt)||[''])[0]);
  ok('27 H1 the printed denial line keeps problem behavior from producing the item, and nothing calls a reinforcing step clinic-only',/problem behavior after a denial never produced the item/.test(dtTxt)&&!/Do not copy the clinic test/.test(dtTxt));
  /* a record saved before v25.65 */
  const sv=await save(d);const old=JSON.parse(JSON.stringify(sv));delete old.rev;['share_imm','share_del','share_den','pb_crit','delay_place','pace_rule','den_say','den_alt','sig_type','tr_when','ia_pref','ia_with','rule_how','rule_after_n','med_change','ho_unavail','gen_late','ss_pace'].forEach(k=>delete old.fields[k]);
  delete old.tables.tbPair;delete old.tables.tbBT;old.tables.tbTrials=old.tables.tbTrials.map(r=>r.slice(0,11));old.fixed.tbTI=old.fixed.tbTI.slice(0,36);
  old.fields.ss_log=JSON.stringify(JSON.parse(old.fields.ss_log).map(e=>{delete e.ss_pace;e.trials=e.trials.map(r=>r.slice(0,11));return e;}));
  const d2=await open(DT);await load(d2,old);
  const o2=await d2.evaluate(()=>({sh:['share_imm','share_del','share_den','pb_crit','delay_place'].map(n=>document.querySelector('[name='+n+']').value),pace:document.querySelector('[name=pace_rule]').value,ch:document.getElementById('preChoice').hidden,
    ss:[...document.getElementById('ssPick').options].map(o=>o.value).join(),prog:document.getElementById('tbProg').rows.length,auc:document.getElementById('outAUC').textContent,note:document.getElementById('ssLogNote').textContent}));
  ok('28 a DT-1 record saved before v25.65 opens as written: the new defaulted fields blank, the choice block still hidden on the FCT path, its sessions, Progress and probe kept',
    o2.sh.join('|')==='||||'&&/^Fixed/.test(o2.pace)&&o2.ch===true&&o2.ss==='20,21,22'&&o2.prog===22&&o2.auc==='0.290'&&/The sheet on screen is kept\./.test(o2.note),o2);
  const rt=await save(d2);ok('29 a record saved now is marked v25.65 and keeps the new fields',rt.rev==='v25.65'&&'share_imm' in rt.fields&&Array.isArray(rt.tables.tbPair),{rev:rt.rev});

  /* ================= Form AD-1 ================= */
  const a=await open(AD);
  const a0=await a.evaluate(()=>({w:document.querySelector('[name=d_window]').value,ti:[...document.querySelectorAll('#tbTI tr')].map(tr=>tr.cells[1].textContent)}));
  await setv(a,'d_window','3');await sleep(400);const dw=await H(a,'#dwWarn');
  ok('30 H3 AD-1\'s delivery window starts at 2 s and warns above it; the integrity checklist asks for the token or mark within 2 s, as step 8',a0.w==='2'&&dw===false&&/^Token or mark delivered within 2 s of the response \(count late deliveries\)/.test(a0.ti[7])&&/stopped at once when the stop rule/.test(a0.ti[a0.ti.length-1]),a0);
  await a.evaluate(()=>document.getElementById('btnSim').click());await sleep(1200);
  const as=await a.evaluate(()=>({tv:document.getElementById('tokValOut').textContent,dec:document.getElementById('decSummary').textContent,cc:document.getElementById('ccOut').textContent,w:document.querySelector('[name=d_window]').value,
    ev:document.getElementById('p9').textContent.replace(/\s+/g,' '),plan:adPlanText()}));
  ok('31 H4 the token value check reads tokens against the primary item (96%), and Tab 7A carries it',/^Tokens maintained responding at 96% of the primary item \(2\.30 against 2\.40 responses per minute; no consequence 0\.80\)/.test(as.tv)&&/Token value \(Tab 2C\)\. Tokens maintained responding at 96% of the primary item\./.test(as.dec),as.tv);
  const weak=await a.evaluate(()=>{const tb=document.getElementById('tbTokVal');tb.rows[0].querySelectorAll('input')[2].value='4';tb.rows[3].querySelectorAll('input')[2].value='5';adRefresh();return {t:document.getElementById('tokValOut').textContent,d:document.getElementById('decSummary').textContent};});
  ok('32 H4 tokens clearly below the primary item say a loss may reflect weak tokens, not the arrangement',/A loss under Accumulated \+ tokens may reflect weak tokens, not the arrangement\. Consider Accumulated without tokens/.test(weak.t)&&/may reflect weak tokens/.test(weak.d),weak);
  ok('33 H5 the guide counts eleven works, reads the JABA studies directly (Ward-Horner 2014: 20% held, 40% shifted; Bukala; Fienup; Diaz de Villegas; Leon), and corrects Ward-Horner et al. (2017)',
    /The Eleven Works at a Glance/.test(as.ev)&&/JABA studies read directly/.test(as.ev)&&/held when the continuous reinforcer was 20% smaller, and shifted to discontinuous work at 40% smaller/.test(as.ev)&&/a brief review of 5 studies with 12 participants aged 13–20/.test(as.ev)&&
    !/2017: young children; the majority or all preferred distributed/.test(as.ev)&&/Leon et al\. \(2016\)/.test(as.ev)&&/Leon, Y\., Borrero, J\. C\., &amp;|Leon, Y\., Borrero, J\. C\., & DeLeon/.test(as.ev),as.ev.slice(0,300));
  const dg=await T(a,'#p7 .tree');
  ok('34 H5 decision guide item 1 gives the base rate: 74% of 457 cases in 112 articles',/Across 112 published articles \(457 cases\), the intervention a person chose was also the most effective one in 74% of the cases/.test(dg),dg.slice(0,400));
  ok('35 H3 the simulation uses the 2-s window and the plan carries it to the case',as.w==='2'&&/Delivery window: 2 s from the response to the token or mark/.test(as.plan),as.plan.slice(-400));
  ok('36 L5 the preference reads consistency in the last half and prints the discrimination check',/Consistent in the last half\? Yes: Accumulated \+ tokens on 5 of the last 5 choices\./.test(as.cc)&&/Discrimination check \(Tab 2D\): 4 of 4 cards passed\./.test(as.cc),as.cc);
  /* M11 the reduced block */
  const m11=await a.evaluate(()=>{const tb=document.getElementById('tbCC');const add=sel=>{document.querySelector('[data-add=tbCC]').click();const f=tb.rows[tb.rows.length-1].querySelectorAll('input,select');f[0].value='2026-09-24';f[1].value='Choice';f[2].value='Block reduced';f[3].value=sel;};
    ['Accumulated + tokens','Accumulated + tokens','Distributed','Accumulated + tokens'].forEach(add);document.querySelector('[name=cc_reduce]').value='20';adRefresh();return {cc:document.getElementById('ccOut').textContent,cap:document.getElementById('p3').textContent.replace(/\s+/g,' ')};});
  ok('37 M11 a reduced-block phase is read on its own (preference holds), out of the counts; Tab 3B cautions about a block too small to work',/Block reduced by 20% \(4 choice trials, not in the counts above\): Accumulated \+ tokens chosen on 3 of 4: preference holds\./.test(m11.cc)&&/7 of 10 \(70%\)/.test(m11.cc)&&/A block below some size may not work as a reinforcer at all \(Fulton et al\., 2020\)/.test(m11.cap),m11.cc);
  /* M8 the exchange schedule and the pause after it */
  const m8=await a.evaluate(()=>{const th=[...document.getElementById('tbStep').closest('table').querySelectorAll('th')].map(t=>t.textContent);const S=document.getElementById('tbSess');
    const tok=[...S.rows].filter(tr=>tr.querySelectorAll('select')[0].value==='Accumulated + tokens');tok.forEach((tr,i)=>{const f=tr.querySelectorAll('input,select');f[11].value=i<3?'4':'7';if(i>=3)f[3].value='15';});adRefresh();
    return {th,p:document.getElementById('pauseOut').textContent,sh:[...S.closest('table').querySelectorAll('th')].map(t=>t.textContent)};});
  ok('38 M8 the ladder records tokens before exchange and the delay to exchange; the log records the pause after an exchange, flagged when it grows by half or more',
    m8.th.includes('Tokens before exchange')&&m8.th.includes('Delay to exchange (min)')&&m8.sh.includes('Pause after exch. (s)')&&/The pause grew by half or more from 10 to 15 responses \(4\.0 s to 7\.0 s\)\. Longer runs before exchange typically lengthen the pause at the start of the run\. Hold the step or add an intermediate exchange\./.test(m8.p),m8);
  const nw=await a.evaluate(()=>{const s=document.querySelector('[name=dec_arr]');document.querySelector('[name=pl_exwhen]').value='';document.querySelector('[name=l_delay]').value='Does not wait; problem behavior when made to wait';s.value='Continue the evaluation';s.dispatchEvent(new Event('change',{bubbles:true}));
    s.value='Accumulated + tokens';s.dispatchEvent(new Event('change',{bubbles:true}));return document.querySelector('[name=pl_exwhen]').value;});
  ok('39 M8 a student who does not wait is planned with the exchange within the session',nw==='Within the session',nw);
  const fi=await a.evaluate(()=>{document.querySelector('[name=l_auc]').value='';return window.__nbhFactsIn?__nbhFactsIn({delay:{discount:{auc:0.29,logk:-1.65}}}):null;});await sleep(300);
  const auc=await a.evaluate(()=>({v:document.querySelector('[name=l_auc]').value,f:document.getElementById('learnerFlags').textContent}));
  ok('40 M6 Form DT-1\'s AUC fills AD-1\'s learner variables from the case, with the steep-curve flag',auc.v==='0.29'&&/Discounting probe: AUC 0\.29 \(Form DT-1\)\. A steep curve: plan token exchange within the session/.test(auc.f)&&fi&&/discounting probe from Form DT-1/.test(fi.note),{auc,fi});
  /* M9, M10 */
  const t3=await a.evaluate(()=>document.getElementById('p3').textContent.replace(/\s+/g,' ')+' || '+document.getElementById('p7').textContent.replace(/\s+/g,' '));
  ok('41 M9 "none tested" is replaced by what JABA shows about warnings, with the rich-to-lean line under distributed',!/None of the six works tested warnings or ending routines\./.test(t3)&&/Warnings alone have rarely been enough to prevent problem behavior at transitions\. In the studies where they helped, they were combined with other procedures\./.test(t3)&&/each removal is a change from a rich to a lean situation\. That change is where pauses and problem behavior tend to occur/.test(t3));
  await a.evaluate(()=>{const r=document.getElementById('q3');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const m10=await a.evaluate(()=>({h:document.getElementById('acqMark').hidden,t:document.getElementById('acqMark').textContent,dis:[...document.querySelector('[name=pl_bank]').options].find(o=>/^Nothing shown/.test(o.value)).disabled}));
  ok('42 M10 in skill acquisition each correct response is marked at once; "Nothing shown" is not offered',m10.h===false&&m10.dis&&/In discrete-trial teaching, delays to reinforcement as short as 6 s slowed learning for some children/.test(m10.t),m10);
  /* L2 synchronous, marked restrictive */
  const l2=await a.evaluate(()=>{const c=document.querySelector('[name=c_syn]'),d0=c.disabled;document.querySelector('[name=syn_ok]').value='BCBA and team 9/30/2026; parent consent, Form IC-1, 10/1/2026';adRefresh();const d1=c.disabled;c.checked=true;adRefresh();
    const card=[...document.querySelectorAll('#scriptOut .script-card')].find(x=>x.querySelector('h4').textContent==='Synchronous');
    return {d0,d1,lab:document.querySelector('label[for=c6]').textContent,card:card?card.textContent:'',opt:[...document.querySelector('#tbSess select')?.options||[]].some(o=>o.value==='Synchronous')||[...document.querySelectorAll('#tbSess tr')].length===0};});
  ok('43 L2 synchronous reinforcement is a restrictive, never-default option: it can be ticked only with the approval written, and its script says it is a punishment step',
    l2.d0===true&&l2.d1===false&&/Restrictive: removing the item when the student stops is a punishment step\. It needs BCBA and team approval and parent consent \(Form IC-1\) before use\. Never the default\./.test(l2.lab)&&/Restrictive \(a punishment step/.test(l2.card)&&l2.opt,l2);
  const l4=await T(a,'#p2');
  ok('44 L4 Tab 2B cautions that interrupted work can make a real reinforcer look weak',/Before ruling an item out: if brief access after each response produces less work than no item, test the same item delivered after the work/.test(l4));
  const l3=await a.evaluate(()=>({g:!!document.querySelector('[name=g_late]'),o:[...document.querySelector('[name=pl_exwhen]').options].some(o=>/^Held until after the generalization setting/.test(o.value))}));
  ok('45 L3 AD-1 offers holding the exchange until after the generalization setting',l3.g&&l3.o,l3);
  const adTxt=await a.evaluate(()=>document.body.textContent);
  ok('46 L6 no study participant is named in AD-1',!NAMES.test(adTxt),(NAMES.exec(adTxt)||[''])[0]);
  /* an AD-1 record saved before v25.65 */
  const asv=await save(a);const aold=JSON.parse(JSON.stringify(asv));['d_window','l_auc','c_syn','syn_ok','pl_exwhen','g_late','cc_reduce','ti16'].forEach(k=>delete aold.fields[k]);delete aold.tables.tbTokVal;
  aold.tables.tbSess=aold.tables.tbSess.map(r=>r.slice(0,11));aold.tables.tbStep=aold.tables.tbStep.map(r=>r.slice(0,4));aold.tables.tbCC=aold.tables.tbCC.filter(r=>r[2]!=='Block reduced');
  const dec0=await T(a,'#decSummary');const a2=await open(AD);await load(a2,aold);
  const ao=await a2.evaluate(()=>({w:document.querySelector('[name=d_window]').value,n:document.getElementById('tbSess').rows.length,dec:document.getElementById('decSummary').textContent,dw:document.getElementById('dwWarn').hidden,syn:document.querySelector('[name=c_syn]').checked}));
  const strip=x=>String(x).replace(/\s+/g,'').replace(/Tokenvalue\(Tab2C\)\.[^]*?(?=Disagreement|Agreement|$)/,'');
  ok('47 an AD-1 record saved before v25.65 opens as written: no delivery window is put in, no warning, its sessions and decision as before',ao.w===''&&ao.dw===true&&ao.n===aold.tables.tbSess.length&&!ao.syn&&strip(ao.dec)===strip(dec0),{ao,dec0});
  ok('48 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
