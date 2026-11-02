/* v25.65 the approved research changes, parcel SKILL: Forms SA-1, TI-1 and GB-1's objective bank (simulated data only).
   SA-1  SKILL-H1  physical guidance only while the student allows it: the line under the codes and on both blank sheets, beside
                   graduated guidance and most-to-least, the pulled-away count and its rule, guided compliance in the Guide.
         SKILL-H2  the one direct test of 90% in numbers; the different-days option; below 100%, the 1-week probe decides.
         SKILL-H3  Carroll et al. (2015) as studied; single-response repetition and demonstration; the brief comparison.
         SKILL-H4  the stall checklist in order (fidelity, prerequisites, reinforcer, procedure, prompt dependence).
         SKILL-H5  many errors: a progressive delay or a fading comparison, most-to-least third; no single hierarchy.
         SKILL-M1  the listener check: a new array position and a new comparison.
         SKILL-M2  verbal and model prompts apart in a new program; the prompt type tried first.
         SKILL-M3  stimulus prompts, with the caution about extra cues.
         SKILL-M4  the steps after the training step; the Delay/level row and the time-delay rule on the Steps page.
         SKILL-M5  problem behavior per session, linked to the errors, and the labelled OPTION (Green et al., 2005).
         SKILL-M6  video model and video prompt; who is in the clips; rewatch the step.
         SKILL-M7  a program for a Form VS-1 schedule.
         SKILL-L1  interspersal costs speed.  L2  instructive feedback and its probe.  L3  who started each trial; free-play probe.
   TI-1  BC-RM-M3  the commission share of each observation, for the case.  SKILL-M9  "Why did it drop?" before retraining.
   GB-1  FEED-H7, FEED-M4, FEED-L1, FEED-L2  the feeding entries of the objective bank.
   Saved SA-1 and TI-1 files from before v25.65 open and read as before.
   usage: node qa/v2565-skill-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/',SA=W+'SA-1_Skill-Acquisition-Data_v2026-10.html',TI=W+'TI-1_Treatment-Integrity-Observation_v2026-09.html',GB=W+'GB-1_Goal-and-Objective-Builder_v2026-09.html';
const SASRC=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation','SA-1_Skill-Acquisition-Data_v2026-10.html'),'utf8');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  /* ======================= SA-1 ======================= */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('SA-1: '+e.message));await q.goto(SA);await sleep(1000);
  await q.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};nbhUI.toast=()=>{};
    /* a program: meta, then sessions [phase, instructor, codes, extra fields] */
    window.__prog=(meta,sess,chk)=>{S=blank();P={list:[S],cur:0};Object.assign(S.meta,{client:'SIMULATED – Sample Student',program:'Test program',ntr:'10',hier:'ltm',format:'dtt',mc_inst:'1'},meta);Object.assign(S.chk,chk||{});
      S.sess=sess.map((x,i)=>Object.assign({date:'10/'+(i+1)+'/26',ph:x[0],inst:x[1],tr:Array.from(x[2]),dl:'',note:''},x[3]||{}));renderAll();
      return {rules:[...document.querySelectorAll('#graphRules li')].map(l=>l.textContent),verdict:document.getElementById('graphVerdict').textContent,out:(window.__nbhFactsOut()||{skills:{programs:[]}}).skills.programs[0]};};});
  const pc=k=>'I'.repeat(k)+'–'.repeat(10-k);
  const setup=await q.evaluate(()=>document.querySelector('section.only-setup').textContent);
  const guide=await q.evaluate(()=>document.querySelector('section.only-guide').textContent);

  /* ---- H1 ---- */
  ok('H1 the guidance line under the code table: given only while the student allows it; let go; holding a body part is restraint',/A physical prompt is given only while the student allows it\. If the student pulls away, stiffens or pushes the adult’s hand, the adult lets go, waits, and offers a lighter prompt or a short break\. Holding a hand, an arm or any body part to stop a response, or as a consequence, is restraint and is not a prompt\./.test(setup));
  let G=await q.evaluate(a=>__prog({hier:'mtl'},a),[['B','JE',pc(0)],['B','JE',pc(0)]]);
  const sh=await q.evaluate(()=>{S.steps=[{text:'Turns on the water'},{text:'Wets both hands'}];renderAll();return {tr:document.getElementById('trialSheet').textContent,ta:document.getElementById('taSheet').textContent,note:document.getElementById('hierNote').textContent};});
  const SHEETLINE=/Physical prompts only while the student allows it: if the student pulls away, stiffens or pushes the adult’s hand, let go, wait, offer a lighter prompt or a short break\. Holding a hand, an arm or any body part is restraint, not a prompt\./;
  ok('H1 the line prints on the trial sheet and the task-analysis sheet, with a Pulled-away row on each',SHEETLINE.test(sh.tr)&&SHEETLINE.test(sh.ta)&&/Pulled away \(times\)/.test(sh.tr)&&/Pulled away from guidance \(times\)/.test(sh.ta),sh);
  ok('H1 most-to-least on the Setup page shows the line beside the choice',/Most-to-least: physical guidance only while the student allows it/.test(sh.note),sh.note);
  const gg=await q.evaluate(()=>{S.meta.hier='gg';renderAll();return document.getElementById('hierNote').textContent;});
  ok('H1 graduated guidance shows it too; least-to-most does not',/Graduated guidance: physical guidance only while the student allows it/.test(gg)&&await q.evaluate(()=>{S.meta.hier='ltm';renderAll();return !/physical guidance only/.test(document.getElementById('hierNote').textContent);}),gg);
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['T','JE',pc(3),{pa:'1'}],['T','JE',pc(4),{pa:'0'}],['T','JE',pc(5),{pa:'2'}]]);
  ok('H1 pulled away in 2 of the last 5 sessions: guidance is not accepted, change the prompt type, shorten the session or add breaks (PA-1)',G.rules.some(r=>/^Guidance is not accepted: the student pulled away from guidance in 2 of the last 4 sessions\. Change the prompt type \(model, gesture, video\), shorten the session or add breaks \(Form PA-1 reinforcer check\)/.test(r)),G.rules);
  const rowH1=await q.evaluate(()=>!!document.querySelector('#trTbl input[data-f="pa"]'));
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['T','JE',pc(3),{pa:'1'}],['T','JE',pc(4)],['T','JE',pc(5)]]);
  ok('H1 the trial grid has the row; once in the last sessions: no rule',rowH1&&!G.rules.some(r=>/Guidance is not accepted/.test(r)),G.rules);
  ok('H1 the Guide: guided compliance is escape extinction, marked as extinction, never the default (Green et al., 2005; MacDuff et al., 1993; Morris et al., 2021)',/Guided compliance \(physical guidance after a refusal\) is escape extinction, not a teaching prompt: if a plan uses it, it is written on Form TD-1, marked as extinction, and it is never the default\./.test(guide)&&/Green et al\., 2005/.test(guide)&&/MacDuff et al\., 1993/.test(guide)&&/Morris et al\., 2021/.test(guide));

  /* ---- H2 ---- */
  ok('H2 the hint: 90% across three sessions maintained at 10% a week later (4 children); 100% a mean of 86% across the 12; one more session; the samples are small',/In the one direct test of 90% across three sessions \(4 children\), maintenance one week later averaged 10%/.test(setup)&&/a mean of 86% correct across the 12/.test(setup)&&/about one more session than 90% \(a mean of 14 against 13\)/.test(setup)&&/The samples are small/.test(setup)&&/in 11 of 12 evaluations/.test(setup));
  const s100=await q.evaluate(()=>{const keep=S;S=JSON.parse(JSON.stringify(S));S.meta.mc_pct='';S.meta.ntr='10';const v=mc().pct;S=keep;return v;});
  ok('H2 a program of 10 trials with no level typed uses 100%',s100===100,s100);
  const day=[['B','JE',pc(0)],['T','JE',pc(10),{date:'10/5/26'}],['T','MR',pc(10),{date:'10/5/26'}],['T','JE',pc(10),{date:'10/5/26'}]];
  G=await q.evaluate(a=>__prog({mc_inst:'2'},a,{mc_days:true}),day);
  ok('H2 "at least 2 different days" ticked: three sessions at 100% on one day are not mastered, and the rule says so',!G.out.mastered&&G.rules.some(r=>/they all fall on one day; the criterion asks for at least 2 different days/.test(r)),G);
  day[3][3]={date:'10/6/26'};G=await q.evaluate(a=>__prog({mc_inst:'2'},a,{mc_days:true}),day);
  ok('H2 on two days: mastered',G.out.mastered&&/Mastered: 3 consecutive/.test(G.verdict),G);
  G=await q.evaluate(a=>__prog({mc_inst:'2'},a),[['B','JE',pc(0)],['T','JE',pc(10),{date:'10/5/26'}],['T','MR',pc(10),{date:'10/5/26'}],['T','JE',pc(10),{date:'10/5/26'}]]);
  ok('H2 not ticked: one day is enough, as before',G.out.mastered,G);
  const h90=await q.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-3);const md=(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
    __prog({mc_pct:'90',mc_inst:'1',mt_sched:'2 weeks, 1 month'},[['B','JE','––––––––––'],['T','JE','IIIIIIIII–',{date:md}],['T','JE','IIIIIIIII–',{date:md}],['T','JE','IIIIIIIII–',{date:md}]]);
    renderPr();return {pv:document.getElementById('prVerdict').textContent,due:window.__nbhDue().map(x=>x.what)};});
  ok('H2 90% kept as a choice: the Probes page says the 1-week probe decides whether 90% held, and the due list puts it first even when the schedule starts at 2 weeks',/The criterion is 90%, below 100%\. The first maintenance probe is due 1 week after mastery, and it decides whether 90% held/.test(h90.pv)&&h90.due.some(x=>/^Maintenance probe, 1 week after mastery \(decides whether 90% held\)/.test(x)),h90);

  /* ---- H3 ---- */
  const ec=await q.evaluate(()=>[...document.querySelectorAll('[data-m="ec"] option')].map(o=>o.textContent));
  ok('H3 the menu: single-response repetition and demonstration under their research names; the older items kept as they were',ec.includes('Single-response repetition: prompt the correct response once, then the next trial')&&ec.includes('Demonstration: model the answer, no response required, then the next trial')&&ec.includes('Error statement only (a neutral “no” or “try again”), then the next trial')&&ec[ec.length-1]==='Other (describe below)',ec);
  ok('H3 the Guide reports Carroll et al. (2015) as studied (re-present until independent most efficient for 3 of 5; no model alone), and Cariveau et al. (2019)',/single-response repetition, remove and re-present, re-present until independent, and multiple-response repetition, against a control\. Re-present until independent was the most efficient for 3 of the 5 children/.test(guide)&&/They did not test a model alone/.test(guide)&&/demonstration \(a model, no response required\) was the most efficient procedure for 8 of 13 learners/.test(guide)&&!/compared four error-correction procedures during discrete-trial instruction: an error statement, a model of the correct response/.test(guide));
  const fi=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};renderAll();window.__nbhFactsIn({plan:{ec:'Single-response repetition after an error'}});const a=S.meta.ec;S=blank();P={list:[S],cur:0};renderAll();window.__nbhFactsIn({plan:{ec:'Demonstration of the answer'}});return [a,S.meta.ec];});
  ok('H3 an error correction sent by TD-1 by its research name picks the menu item',/^Single-response repetition/.test(fi[0])&&/^Demonstration/.test(fi[1]),fi);

  /* ---- H4 and H3's comparison ---- */
  const flat=[['B','JE',pc(0)],['B','JE',pc(0)],['T','JE',pc(3)],['T','JE',pc(3)],['T','JE',pc(2)],['T','JE',pc(3)],['T','JE',pc(3)]];
  G=await q.evaluate(a=>{const r=__prog({},a);r.open=document.getElementById('ecCmp').open;r.n=document.querySelectorAll('#ncList input[type=checkbox]').length;return r;},flat);
  const nc=G.rules.find(r=>/^No change over the last 5 teaching sessions/.test(r))||'';
  ok('H4 the no-change rule points to the checklist in order: fidelity (TI-1), prerequisites, reinforcer (PA-1), procedure, prompt dependence; next: fidelity',/1\. fidelity \(a second adult scores a session on Form TI-1\); 2\. prerequisites .*; 3\. the reinforcer \(Form PA-1\); 4\. the procedure .*; 5\. prompt dependence/.test(nc)&&/Next: fidelity\./.test(nc)&&!/Options in order/.test(nc)&&G.n===5,{nc,n:G.n});
  ok('H3 the brief error-correction comparison opens when the no-change rule fires',G.open===true,G.open);
  G=await q.evaluate(a=>__prog({},a,{nc_fid:true}),flat);
  ok('H4 fidelity ticked: the next check is the prerequisites',G.rules.some(r=>/fidelity \(a second adult scores a session on Form TI-1\) \(checked\)/.test(r)&&/Next: prerequisites\./.test(r)),G.rules);
  const dep=[['B','JE',pc(0)]].concat([0,1,2,3,4].map(()=>['T','JE','IIGGGGGGGG']));
  G=await q.evaluate(a=>__prog({},a),dep);
  ok('H4 prompt dependence (correct with prompts, not alone): the three named options',G.rules.some(r=>/^Prompt dependence: the last 5 teaching sessions average 100% correct with prompts but 20% independent\. Choose one: stronger differential reinforcement \(the best item only after independent responses\), faster fading, or a longer wait before the prompt/.test(r)),G.rules);
  ok('H4 the Guide and the decision rules printed with the checklist',/When progress stalls: check before changing the teaching/.test(guide)&&await q.evaluate(()=>/When Progress Stalls: Check in This Order/.test(document.querySelector('section.only-graph').textContent)));

  /* ---- H5 ---- */
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['T','JE','GG––––––––'],['T','JE','GG––––––––'],['T','JE','GGG–––––––']]);
  const er=G.rules.find(r=>/^Errors:/.test(r))||'';
  ok('H5 many errors under least-to-most: a progressive delay or a comparison of two fading methods; most-to-least third',/Move to a progressive delay \(0 s, then 1, 2, 4 s\) with the prompt type that has worked, or compare two fading methods on two small sets for up to 5 sessions; most-to-least is the third choice/.test(er)&&!/Consider most-to-least/.test(er),er);
  ok('H5 the Guide: no single hierarchy is best (Seaver & Bourret, 2014; Schnell et al., 2020; Cihon et al., 2020); the error rule as printed',/No one hierarchy was the most efficient across learners/.test(guide)&&/most-to-least was never the most efficient/.test(guide)&&/least-to-most was the most efficient for every participant \(Schnell et al\., 2020\)/.test(guide)&&/minimal differences \(Cihon et al\., 2020\)/.test(guide)&&/the form suggests, in this order: a progressive delay/.test(guide)&&!/Consider most-to-least/.test(SASRC));

  /* ---- M1 ---- */
  const m1=await q.evaluate(()=>{S.meta.mc_unit='target';renderAll();return document.getElementById('tgtBox').textContent;});
  ok('M1 the listener check: probe in a new array position and beside a new comparison before calling it mastered',/probe it in a new array position and beside a new comparison before calling it mastered/.test(m1),m1);

  /* ---- M2 ---- */
  const m2=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};renderAll();const a=S.codes.map(c=>c.c+':'+c.label);
    const o=fromFile({form:'SA-1',S:{meta:{program:'Old'},chk:{},codes:[{c:'I',label:'Independent',kind:'ind'},{c:'V',label:'Verbal or model prompt',kind:'pr'},{c:'–',label:'Error',kind:'err'}],sess:[],steps:[],tas:[],probes:[]}});
    return {a,old:o.codes.map(c=>c.c+':'+c.label),pt:!!document.querySelector('[data-m="pt_first"]')};});
  ok('M2 a new program codes I, G, V (verbal), M (model), P, F and –; a saved file keeps its own codes; the prompt type tried first, and why',m2.a.join('|')==='I:Independent (correct, no prompt)|G:Gestural prompt|V:Verbal prompt|M:Model prompt|P:Partial physical prompt|F:Full physical prompt|–:Error or no response'&&m2.old.join('|')==='I:Independent|V:Verbal or model prompt|–:Error'&&m2.pt,m2);

  /* ---- M3 ---- */
  const m3=await q.evaluate(()=>{S.meta.hier='stim';S.meta.stim_type='extra';renderAll();const a=document.getElementById('hierNote').textContent;S.meta.stim_type='within';renderAll();const b=document.getElementById('hierNote').textContent;
    S.chk.pic_words=true;renderAll();const c=document.getElementById('hierNote').textContent;S.chk.pic_words=false;S.meta.hier='';renderAll();
    return {a,b,c,opt:[...document.querySelectorAll('[data-m="hier"] option')].map(o=>o.textContent),sub:[...document.querySelectorAll('[data-m="stim_type"] option')].map(o=>o.textContent)};});
  ok('M3 "Stimulus prompt and fading" with its three kinds; an extra cue, or pictures beside the words, shows the caution; a within-stimulus prompt does not',m3.opt.includes('Stimulus prompt and fading')&&m3.sub.length===4&&/Extra cues can block learning of the stimulus itself; prefer a within-stimulus prompt, or fade the picture in only as needed/.test(m3.a)&&!/Extra cues/.test(m3.b)&&/Extra cues can block/.test(m3.c),m3);

  /* ---- M4 ---- */
  const m4=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};Object.assign(S.meta,{format:'ta',ch_type:'forward',hier:'ctd',ch_after:'guide'});S.steps=[{text:'a'},{text:'b'},{text:'c'}];
    S.tas=[{date:'10/1/26',ph:'T',inst:'JE',lv:['P','–','–'],note:'',dl:'0'}];renderAll();
    return {note:document.getElementById('chAfterNote').textContent,dl:!!document.querySelector('#taTbl input[data-f="dl"]'),rules:[...document.querySelectorAll('#graphRules li')].map(l=>l.textContent),opts:[...document.querySelectorAll('[data-m="ch_after"] option')].map(o=>o.textContent)};});
  ok('M4 the steps after the training step: guidance, the teacher, or not completed; guidance carries the H1 line',m4.opts.includes('The student completes them with guidance')&&m4.opts.includes('The teacher completes them')&&m4.opts.includes('They are not completed')&&/Guided through the later steps: only while the student allows it/.test(m4.note),m4);
  ok('M4 the Steps page has the Delay/level row and the time-delay rule reads it',m4.dl&&m4.rules.some(r=>/^Time delay: at 0 s with 2 errors: stay at 0 s/.test(r)),m4);
  ok('M4 the Guide: Slocum and Tiger (2011) as it reads (three of four no preference, one forward); Bancroft et al. (2011)',/three of the four children showed no preference between the two methods, and one preferred forward chaining/.test(guide)&&/5 of 7 children learned fastest when they were guided through the remaining steps and 2 of 7 when the teacher completed them/.test(guide));

  /* ---- M5 ---- */
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['T','JE',pc(6),{pb:'1'}],['T','JE',pc(5),{pb:'3'}],['T','JE',pc(3),{pb:'5'}]]);
  const pb=G.rules.find(r=>/^Problem behavior rose/.test(r))||'';
  ok('M5 problem behavior rising over 3 sessions with the errors: lower the error rate, easy requests first, FS-1 for escape',/Problem behavior rose over the last 3 sessions \(1, 3, 5\) and the errors rose with it\. Errors may be making the task aversive: lower the error rate \(time delay or a lighter target set\), add easy requests before hard ones, and check Form FS-1 for an escape function\./.test(pb),pb);
  ok('M5 the Green et al. (2005) option is labelled as reinforcing problem behavior on purpose, with what, why, how long and what ends it; never the default',/OPTION: Reinforces problem behavior on purpose: a brief break and a preferred activity after resistance \(Green et al\., 2005\)\. What it does: .* Why: .* For how long: .* It ends when problem behavior has fallen across 3 sessions in a row; .* It is never the default\./.test(pb),pb);
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['T','JE',pc(6),{pb:'3'}],['T','JE',pc(5),{pb:'1'}],['T','JE',pc(3),{pb:'5'}]]);
  ok('M5 not rising each session: no rule; the row is on the grid',!G.rules.some(r=>/^Problem behavior rose/.test(r))&&await q.evaluate(()=>!!document.querySelector('#trTbl input[data-f="pb"]')),G.rules);

  /* ---- M6 ---- */
  const m6=await q.evaluate(()=>{S.meta.hier='vp';renderAll();const a=document.getElementById('hierNote').textContent;S.meta.hier='';renderAll();
    return {a,who:[...document.querySelectorAll('[data-m="vid_who"] option')].map(o=>o.textContent),opt:[...document.querySelectorAll('[data-m="hier"] option')].map(o=>o.textContent),ec:[...document.querySelectorAll('[data-m="ec"] option')].map(o=>o.textContent),store:!!document.querySelector('[data-m="vid_store"]')};});
  ok('M6 video model and video prompt; the clips show a peer or an adult by default; rewatch the step, then model it',m6.opt.includes('Video model (whole skill shown before the trial)')&&m6.opt.includes('Video prompt (each step shown, then done)')&&m6.who[0]==='A peer or an adult, not the student (the default)'&&m6.store&&/rewatch the step, then model it if still incorrect/.test(m6.a)&&m6.ec.includes('Rewatch the step (video prompting), then model it if still incorrect'),m6);
  ok('M6 the Guide: Charlop and Milstein (1989); Schroeder et al. (2023)',/Charlop &amp; Milstein, 1989|Charlop & Milstein, 1989/.test(guide)&&/Schroeder et al\., 2023/.test(guide));

  /* ---- M7 ---- */
  const m7=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};S.meta.program='Break request';renderAll();window.__nbhFactsIn({visuals:[{what:'Visual schedule',words:'Reading, Snack, Math'}]});
    const box=document.getElementById('visBox').textContent;document.getElementById('visStart').click();
    return {box,n:P.list.length,steps:S.steps.map(s=>s.text),fmt:S.meta.format,ch:S.meta.ch_type,sd:S.meta.sd,fade:S.meta.fade};});
  ok('M7 a VS-1 schedule in the case offers a program; the button adds one with the steps of using the schedule, total-task, adult faded',/Form VS-1 has a visual schedule/.test(m7.box)&&m7.n===2&&m7.steps.join('|')==='Goes to the schedule|Looks at or touches the picture|Gets the materials|Does the activity|Puts the materials away|Marks it Done|Goes to the next one'&&m7.fmt==='ta'&&m7.ch==='total'&&/Reading, Snack, Math/.test(m7.sd)&&/guide only while the student allows it/.test(m7.fade),m7);

  /* ---- L1, L2, L3 ---- */
  const l=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};S.meta.format='net';renderAll();
    return {mix:document.querySelector('[data-m="mix"]').placeholder,ifi:!!document.querySelector('[data-m="if_info"]'),ini:!!document.querySelector('#trTbl input[data-f="ini"]')||document.getElementById('trTbl').textContent,sheet:document.getElementById('trialSheet').textContent,pt:PRTYPES.slice()};});
  ok('L1 interspersal: none by default, with the reason written; the Guide gives Majdalany et al. (2014) and Knutson et al. (2019)',/none by default: mixing in mastered targets slowed new learning/.test(l.mix)&&/Massed trials gave the fastest acquisition for 5 of 6 children \(Majdalany et al\., 2014\)/.test(guide)&&/most efficient ratio for all 4 children \(Knutson et al\., 2019\)/.test(guide),l.mix);
  ok('L2 an instructive-feedback line and a probe type for it (Reichow & Wolery, 2011)',l.ifi&&l.pt.includes('Instructive feedback')&&/58% to 92%/.test(guide),l);
  const l3=await q.evaluate(()=>{S.sess=[{date:'10/1/26',ph:'T',inst:'JE',tr:Array.from('IIII'),dl:'',note:'',ini:'SASA'}];renderAll();return {row:!!document.querySelector('#trTbl input[data-f="ini"]'),sheet:document.getElementById('trialSheet').textContent};});
  ok('L3 natural environment teaching: who started each trial, on the grid and the blank sheet; a probe for spontaneous use in free play',l3.row&&/Who started each trial \(S\/A\)/.test(l3.sheet)&&l.pt.includes('Spontaneous use in free play')&&/McGee et al\., 1985/.test(guide),l3);

  /* ---- saved files ---- */
  const rt=await q.evaluate(()=>{S=blank();P={list:[S],cur:0};S.meta.program='Round trip';S.meta.mc_unit='';S.chk.mc_days=true;S.meta.ch_after='teacher';S.meta.if_info='A cow says moo';
    S.sess=[{date:'10/1/26',ph:'T',inst:'JE',tr:['I'],dl:'',note:'',pa:'1',pb:'2',ini:'S'}];S.tas=[{date:'10/1/26',ph:'T',inst:'JE',lv:['I'],note:'',dl:'2',pa:'0',pb:'1'}];
    const o=fromFile(JSON.parse(JSON.stringify({form:'SA-1',S})));return {pa:o.sess[0].pa,pb:o.sess[0].pb,ini:o.sess[0].ini,tdl:o.tas[0].dl,tpa:o.tas[0].pa,tpb:o.tas[0].pb,days:o.chk.mc_days,after:o.meta.ch_after,ifi:o.meta.if_info};});
  ok('saved and opened: the new counts, the steps delay row, the days option and the new Setup lines come back',rt.pa==='1'&&rt.pb==='2'&&rt.ini==='S'&&rt.tdl==='2'&&rt.tpa==='0'&&rt.tpb==='1'&&rt.days===true&&rt.after==='teacher'&&rt.ifi==='A cow says moo',rt);
  G=await q.evaluate(()=>{const o=fromFileAll({form:'SA-1',S:{meta:{program:'Old',ntr:'10',mc_pct:'90',mc_n:'3',mc_inst:'1',format:'dtt',hier:'ltm',ec:'Model the correct response, re-present the Sᴰ, the student responds, then move on'},chk:{},codes:[],sess:[0,1,2,3,4].map(i=>({date:'9/'+(i+1),ph:i<2?'B':'T',inst:'JE',tr:Array.from(i<2?'––––––––––':'IIIIIIIII–'),note:''}))}});
    P=o;S=P.list[0];renderAll();return {verdict:document.getElementById('graphVerdict').textContent,out:window.__nbhFactsOut().skills.programs[0],keys:Object.keys(S.sess[2]).sort().join(','),ec:document.querySelector('[data-m="ec"]').value};});
  ok('an SA-1 file saved before v25.65: mastered at its own 90% as before, its error correction still chosen, no new keys added to its sessions',/Mastered: 3 consecutive teaching sessions at or above 90%/.test(G.verdict)&&G.out.mastered===true&&G.keys==='date,inst,note,ph,tr'&&/^Model the correct response/.test(G.ec),G);
  await q.evaluate(()=>{loadSim();});await sleep(700);
  const sim=await q.evaluate(()=>({v:document.getElementById('graphVerdict').textContent,goal:S.meta.goal}));
  ok('the SA-1 simulation loads and reads mastered; its goal is written at 100%',/Mastered/.test(sim.v)&&/100% of opportunities/.test(sim.goal),sim);

  /* ======================= TI-1 ======================= */
  const t=await ctx.newPage();t.on('pageerror',e=>errs.push('TI-1: '+e.message));await t.goto(TI);await sleep(1400);
  await t.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}window.alert=()=>{};});
  await L.loadSim(t);await sleep(1200);
  const T1=await t.evaluate(()=>{const o=window.__nbhFactsOut().integrity;const exp=o.obs.map((x,k)=>{const M=metrics();return x.com;});
    const j=metrics().used.map(x=>x.j);const mine=j.map(k=>window.tiComObs(k));return {obs:o.obs,com:o.commission,mine,byCon:metrics().byCmp.con};});
  ok('BC-RM-M3 TI-1 sends each observation\'s commission share on consequence steps, and the overall share',T1.obs.length>0&&T1.obs.every((x,k)=>x.com===T1.mine[k].pct&&x.conN===T1.mine[k].n)&&T1.com===Math.round(1000*T1.byCon.ec/T1.byCon.n)/10,T1);
  const hand=await t.evaluate(()=>window.tiRunner.retrain().obs);
  ok('BC-RM-M3 the retraining file for ST-1 carries each observation\'s commission share too',hand.length>0&&hand.every(o=>typeof o.commissionPct==='number'&&o.consequenceOpportunities>0),hand);
  const M9a=await t.evaluate(()=>({hidden:document.getElementById('tiDropBody').hidden,why:window.tiDropOut(),f:window.__nbhFactsOut().integrity.why}));
  ok('SKILL-M9 the check is closed until "already signed off on ST-1" is ticked; nothing is sent before',M9a.hidden===true&&M9a.why===null&&M9a.f===undefined,M9a);
  await t.evaluate(()=>{document.getElementById('tiDropSigned').click();});await sleep(100);
  await t.evaluate(()=>{document.querySelector('.tiDropK[data-k="mat"]').click();document.querySelector('.tiDropK[data-k="notice"]').click();});await sleep(100);
  const M9b=await t.evaluate(()=>({hidden:document.getElementById('tiDropBody').hidden,out:document.getElementById('tiDropOut').textContent,why:window.tiDropOut(),f:window.__nbhFactsOut().integrity.why,n:document.querySelectorAll('.tiDropK').length}));
  ok('SKILL-M9 four ticks from the PDC-HS; materials and noticing found: change the setting or the feedback, not the training; no retraining',!M9b.hidden&&M9b.n===4&&/^Change the setting or the feedback, not the training\./.test(M9b.out)&&!/Retrain on Form ST-1/.test(M9b.out)&&M9b.why.retrain===false&&M9b.why.materialsOrTime&&M9b.why.noOneNotices&&M9b.f&&M9b.f.signedOff,M9b);
  await t.evaluate(()=>{document.querySelector('.tiDropK[data-k="skill"]').click();});await sleep(100);
  const M9c=await t.evaluate(()=>({out:document.getElementById('tiDropOut').textContent,why:window.tiDropOut()}));
  ok('SKILL-M9 only "does not know the steps" leads to retraining on ST-1',/^Retrain on Form ST-1\./.test(M9c.out)&&M9c.why.retrain===true,M9c);
  const dl=t.waitForEvent('download',{timeout:5000}).catch(()=>null);await t.evaluate(()=>document.getElementById('tiRetrainBtn').click());const D=await dl;
  let file=null;if(D){const pth=await D.path();file=JSON.parse(fs.readFileSync(pth,'utf8'));}
  ok('SKILL-M9 the retraining file for ST-1 carries the answers (why)',file&&file.why&&file.why.signedOff===true&&file.why.retrain===true&&file.form==='TI-1-RETRAIN',file&&file.why);
  const old=await t.evaluate(()=>{const keep=JSON.stringify(S);S=Object.assign(blank(),JSON.parse(keep));delete S.meta.dropSigned;delete S.meta.dropSkill;delete S.meta.dropMat;delete S.meta.dropNotice;renderAll();
    return {hidden:document.getElementById('tiDropBody').hidden,why:window.tiDropOut(),pct:window.__nbhFactsOut().integrity.overall};});
  ok('a TI-1 file saved before v25.65 opens with the check closed and its figures as before',old.hidden===true&&old.why===null&&typeof old.pct==='number',old);

  /* ======================= GB-1's objective bank ======================= */
  const g=await ctx.newPage();g.on('pageerror',e=>errs.push('GB-1: '+e.message));await g.goto(GB);await sleep(1500);
  const B=await g.evaluate(()=>{const E={};GB1_BANK.entries.forEach(e=>{E[e.id]=e;});const pick=k=>E[k];
    const ids=['dl-drink','dl-feed','dl-utensil','dl-food'];return {E:ids.map(pick),will:ids.map(k=>gbWill(E[k].beh,'Sample')===E[k].beh),refs:ids.map(k=>E[k].src.every(s=>GB1_BANK.refs[s]))};});
  const [dr,fd,ut,fo]=B.E;
  ok('FEED-H7 dl-drink: small sips from a cup the student lifts or holds, the cup placed in front; no lips in the condition',dr.lab==='Drink small sips of the prescribed liquid from a cup the student lifts or holds'&&dr.cond==='given a cup with [amount] of the prescribed liquid placed in front of the student'&&!/lips/.test(dr.cond+dr.beh),dr);
  ok('FEED-H7 dl-drink: holding the cup at the lips is a marked RESTRICTIVE option with written consent, planned with the family, the doctor and a feeding specialist; offering at the lips is ordinary; the study is context',/RESTRICTIVE, needs approval: holding the cup at the lips until the drink is accepted \(nonremoval\).* is escape extinction\. A school team may use it only with the family’s written consent, planned with the family, the prescribing doctor and a feeding specialist; it is never the default, and the mouth is never forced open\./.test(dr.teach)&&/Offering the cup at the lips, without holding it there, is an ordinary step/.test(dr.teach)&&/Context: what a medical feeding team did\./.test(dr.teach)&&/100% across 3 sessions/.test(dr.note)&&!/90% across 3 sessions/.test(dr.note),dr);
  ok('FEED-H7 dl-feed: the skill kept; only non-forcing methods in the school version; the guided and extra-bite steps are context, marked RESTRICTIVE, not "medical team only"',fd.beh==='pick up the spoon or cup, bring it to the mouth and take in the whole bite or drink'&&/^The school version names only non-forcing methods: a model, a gesture, and a light touch at the wrist or elbow for scooping; backward chaining, in which the student always makes the final move to the mouth; and praise or a preferred item for each self-fed bite or drink\./.test(fd.teach)&&/Context: what hospital feeding programs did\./.test(fd.teach)&&/are RESTRICTIVE steps/.test(fd.teach)&&!/medical feeding team only|only with a feeding team/i.test(fd.teach+fd.note)&&fd.steps.length===5,fd);
  ok('FEED-L2 dl-feed: the truncated note repaired',!/refusa;/.test(fd.note)&&/The studies were run in hospital feeding programs; the school version above leaves out their guided and extra-bite steps\.$/.test(fd.note),fd.note);
  ok('FEED-M4 dl-utensil: the last move to the mouth is the student\'s, prompts limited, guidance stops before the hand leaves the plate, a maintenance step (O\'Brien et al., 1972); tray removal marked as punishment, never the default',/the student always makes the last move to the mouth; prompts limited to a model, a gesture and a light touch at the wrist or elbow for scooping; any guidance stops before the hand leaves the plate/.test(ut.teach)&&/Keep reinforcing spoon use after it is learned/.test(ut.teach)&&ut.steps.some(s=>/maintenance/.test(s))&&ut.src.includes('obrien1972a')&&/a punishment procedure .* never the default/.test(ut.note),ut);
  ok('FEED-L1 dl-food: acceptance and mouth clean measured apart, across [n] target foods one food group at a time, 80% with its basis stated',/acceptance and mouth clean .* recorded as two separate measures/.test(fo.meth)&&/across \[n\] target foods taught one food group at a time/.test(fo.crit)&&/^in at least 80%/.test(fo.crit)&&/80% follows the feeding studies: the randomized trial .* moved to the next food group at 80% independent acceptance \(Peterson et al\., 2019\)/.test(fo.note),fo);
  ok('the four entries read in the objective sentence and cite references the bank holds',B.will.every(Boolean)&&B.refs.every(Boolean),B);
  const shown=await g.evaluate(()=>{const R=document.getElementById('gbBankHost').shadowRoot;R.querySelector('details').open=true;const q=R.querySelector('.q');q.value='drink sips cup';q.dispatchEvent(new Event('input'));
    const b=R.querySelector('.it[data-id="dl-drink"]');if(b)b.click();const d=R.querySelector('.detail');return d?d.textContent:'';});
  ok('GB-1 shows the rewritten dl-drink entry in the bank panel',/Drink small sips of the prescribed liquid/.test(shown)&&/RESTRICTIVE, needs approval/.test(shown),shown.slice(0,300));

  ok('no page errors',errs.length===0,errs);
 }catch(e){ok('ran to the end',false,String(e&&e.stack||e));}
 finally{await br.close();}
 console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
