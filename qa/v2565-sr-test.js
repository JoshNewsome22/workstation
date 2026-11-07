/* v25.65, parcel SR: Form SR-1 against the FCT, thinning and NCR research (review FCT-SR, the BCBA's approvals of 11/2).
   H1 the extinction step is a stated choice with no default; H2 FCT or DRA without extinction, the request must win; H3 the size
   of every thinning step, big drops flagged, a largest-drop way to step; H4 the share of requests made in S+, the signal check;
   H5 a wait that ends on what the student does; H6 what to expect from a burst; H7 the next step before thinning stalls; M1-M10
   and L1-L7 as named in each check. Old saved files open and print. Simulated data only.
   usage: WS_URL=http://127.0.0.1:8611 node qa/v2565-sr-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(800);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('SR-1_'));
  const sim=()=>p.evaluate(async()=>{await loadSim();});
  await sim();await sleep(300);
  await p.evaluate(()=>setView('card'));   /* the card on screen, so its text keeps its lines */
  /* the design and the card for the case with these entries (fresh from the simulation each time) */
  const look=x=>p.evaluate(x=>{const keep=JSON.parse(JSON.stringify(S.meta));Object.assign(S.meta,x);renderAll();const o=design();
    const strip=h=>{const d=document.createElement('div');d.innerHTML=String(h||'');return d.textContent.replace(/\s+/g,' ').trim();};
    const r={id:o&&o.id,nota:strip(o&&o.nota),rule:strip(o&&o.rule),warn:(o&&o.warn||[]).map(strip),params:(o&&o.params||[]).map(q=>[strip(q[0]),strip(q[1])]),
      head:(o&&o.stepsHead||[]).map(strip),steps:(o&&o.steps||[]).map(row=>row.map(strip)),data:(o&&o.data||[]).map(strip),notes:strip(o&&o.notes),ext:o&&o.ext||null,
      card:document.getElementById('cardOut').innerText,shown:(()=>{const v=document.body.className;setView('design');const on=id=>getComputedStyle(document.getElementById(id)).display!=='none';const r={ext:on('srExt'),cmp:on('srCmp'),stall:on('srStall'),fn:on('srFnReqs'),brk:on('srBrk')};setView('card');return r;})(),
      facts:(window.__nbhFactsOut()||{}).schedule||null};
    S.meta=keep;renderAll();return r;},x);
  const P=(r,k)=>{const q=r.params.find(x=>x[0]===k);return q?q[1]:null;};

  /* ---- H1 ---- */
  const a0=await look({ds_sel:'ncr',ext_step:''}),a1=await look({ds_sel:'ncr',ext_step:'ext'}),tk=await look({ds_sel:'token'});
  ok('H1a with no choice made, NCR prints no "+ EXT", warns to choose (quoting the chooser\'s answer), and the card marks the extinction line "not yet chosen"; the choice shows on NCR, not on a token design',
    !/\+ EXT/.test(a0.nota)&&a0.warn.some(w=>/^Choose what follows problem behavior/.test(w)&&/was answered: Yes, reliably\./.test(w))&&/Extinction step: not yet chosen/.test(a0.card)&&a0.shown.ext===true&&tk.shown.ext===false,{nota:a0.nota,warn:a0.warn,shown:a0.shown,tk:tk.shown});
  ok('H1b the extinction step chosen: "+ EXT" in the notation, the line under its own heading with the agreement date, out of the rule; the case\'s rule carries it labelled',
    /\+ EXT$/.test(a1.nota)&&/\nExtinction step\n/.test(a1.card)&&/Agreed by the team and parent on 2026-09-30\./.test(a1.card)&&!/never produces/.test(a1.rule)
    &&a1.facts&&a1.facts.ext&&a1.facts.ext.choice==='ext'&&/Extinction step: Calling out itself never produces being called on\./.test(a1.facts.rule),{nota:a1.nota,rule:a1.rule,f:a1.facts&&{ext:a1.facts.ext,rule:a1.facts.rule}});
  const a2=await look({ds_sel:'thin',ext_step:'part'}),a3=await look({ds_sel:'thin',ext_step:'none'});
  ok('H1c "partly" prints the caution and shows what each gets; "none" switches the card to the request-must-win rule',
    a2.warn.some(w=>/sometimes reinforced keeps going; the request must win on several dimensions/.test(w))&&/Extinction step: only partly possible/.test(a2.card)&&a2.shown.cmp
    &&/No extinction step/.test(a3.card)&&/What each gets: the request must win/.test(a3.card)&&a3.warn.some(w=>/follows the rule for FCT or DRA without extinction/.test(w))&&!/\nExtinction step\n/.test(a3.card),{w2:a2.warn,w3:a3.warn});

  /* ---- H2, L4 ---- */
  const n1=await look({ds_sel:'nox',ext_step:'none'}),n2=await look({ds_sel:'nox',ext_step:'none',nx_rq_delay:'30',nx_w_qual:''}),n3=await look({ds_sel:'nox',ext_step:'ext'});
  ok('H2a FCT or DRA without extinction: the seconds decide how soon and how much, the request wins 4 of 5 and the tie on how hard is named; the two lines side by side; thin only how often; the share of requests and the review line',
    /^a raised hand: every time \(FR 1\), within 5 s, for 30 s, being called on, with a comment on the answer, effort: a raised hand\. Every adult gives the request what is written for it, every time\./.test(n1.rule)
    &&/What each gets: the request must win\n/.test(n1.card)&&/How soon\s+5 s\s+20 s\s+the request/.test(n1.card)&&n1.shown.stall===false&&n1.shown.cmp===true
    &&n1.warn.some(w=>/^The request loses or ties on how hard\./.test(w))&&!n1.warn.some(w=>/wins on \d of 5/.test(w))&&/Thin only how often\. How much and how good stay as they are/.test(P(n1,'Thinning without extinction')||'')
    &&n1.data.some(d=>/share of requests each session: requests ÷ \(requests \+ calling out\)/.test(d))&&n1.data.includes('If calling out has not fallen within 5 sessions, the BCBA reviews the plan.')&&/a tie/.test(P(n1,'How hard')||'')&&/\(from the seconds\)/.test(P(n1,'How soon')||''),{rule:n1.rule,warn:n1.warn,data:n1.data,params:n1.params});
  ok('H2b a slower request loses how soon; with who wins how good not said, the request wins 2 of 5 and the form says why it matters',
    n2.warn.some(w=>/loses or ties on how soon, how hard/.test(w))&&n2.warn.some(w=>/^Say who wins on how good/.test(w))&&n2.warn.some(w=>/wins on 2 of 5\. Without extinction, change was largest and most consistent when several dimensions favored the alternative \(Athens & Vollmer, 2010\)/.test(w)),n2.warn);
  ok('H2c (the BCBA, 11/2) what problem behavior still gets is a labelled option that says what it does, why, for how long and what the data must show before it ends; with the extinction step chosen there is none',
    /What problem behavior still gets\nOPTION: Reinforces problem behavior on purpose: when calling out happens, it still gets about 1 in 3 times \(Form ABC-1\), within 20 s, for 10 s, a reprimand, effort: one shout, and never more, sooner or better than the request gets\. What it does: .* Why: there is no extinction step in this plan\. For how long: .*within 5 sessions\. What the data must show before it ends: /.test(n1.card)
    &&/OPTION: Reinforces problem behavior on purpose:/.test(n1.facts.rule)&&!/OPTION: Reinforces problem behavior/.test(n3.card)&&!/When calling out happens, give only/.test(n3.rule),{card:n1.card.slice(0,1800),r3:n3.rule});
  ok('L4 the matching worksheet: problem behavior\'s share of the responses and of the reinforcement, and the share strict matching predicts under the plan',
    /^Problem behavior is 75% of the responses and gets 60% of the reinforcement\. If the request gets it 30 times instead of 8, strict matching predicts problem behavior at about 29% of the responses\./.test(P(n1,'Matching worksheet')||''),P(n1,'Matching worksheet'));

  /* ---- H3 ---- */
  const t1=await look({ds_sel:'thin'}),t2=await look({ds_sel:'thin',th_mode:'drop',th_maxdrop:'20'});
  const col=(r,i)=>r.steps.map(x=>x[i]);
  ok('H3a every step shows the share of the session the request works and the drop; the 40% drop is flagged; the case\'s steps keep their words',
    t1.head[3]==='Request works (% of session)'&&t1.head[4]==='Drop from the last step (%)'&&JSON.stringify(col(t1,3))==='["100%","80%","67%","50%","33%","20%"]'
    &&JSON.stringify(col(t1,4))==='["—","20%","17%","25%","33%","40% large step"]'&&t1.warn.some(w=>/^Large step \(a drop above 33%\) at step 6 \(40%\): resurgence is more likely and larger\. Consider an extra step\./.test(w))
    &&t1.facts.steps[1].what==='S+ 60 s; S− 15 s'&&t1.facts.terminal==='S+ 60 s; S− 4 min',{w:t1.warn,c3:col(t1,3),c4:col(t1,4),f:t1.facts&&t1.facts.steps});
  ok('H3b "a drop of at most 20% per step": the form computes S− (15, 34, 57, 86, 123, 169, 226 s, then 240 s) and nothing is flagged',
    JSON.stringify(col(t2,2))==='["0 (continuous reinforcement, signal present)","15 s","34 s","57 s","86 s","123 s","169 s","3.8 min","4 min (terminal)"]'&&!t2.warn.some(w=>/Large step/.test(w))&&/A drop of at most 20% per step/.test(P(t2,'How the steps are set')||''),{c2:col(t2,2),w:t2.warn});

  /* ---- H4 ---- */
  const ph=await p.evaluate(()=>(e=>e.placeholder||e.getAttribute('data-fx2-ph')||'')(document.querySelector('[data-m="th_crit"]')));   /* v25.68 fx2: on screen the layout keeps a box's words in data-fx2-ph */
  const h1=await look({ds_sel:'thin',th_sigok:'no'});
  const h2=await look({ds_sel:'thin',sd_upv:'1',sd_upn:'2',sd_up2v:'80',sd_row2:'Requests in S+ (%)'}),h3=await look({ds_sel:'thin',sd_upv:'1',sd_upn:'2',sd_up2v:'60'});
  ok('H4 the criterion asks for 80% of requests in S+; the data keep that share; a signal the student cannot name is warned; the step helper sends a second row, never below 70%',
    /at least 80% of requests made while the S\+ is up/.test(ph)&&t1.data.some(d=>/the share of requests made in S\+/.test(d))&&h1.warn.some(w=>/differ in more than color \(shape, object, place, a lanyard plus a spoken rule\)/.test(w))
    &&/Signal check/.test(h1.card)&&h2.facts.decide&&h2.facts.decide.row2==='Requests in S+ (%)'&&JSON.stringify(h2.facts.decide.up2)==='{"op":"ge","v":80,"n":2}'&&h3.facts.decide.up2.v===70&&h3.warn.some(w=>/never set below 70%/.test(w)),{ph,w:h1.warn,d2:h2.facts&&h2.facts.decide,d3:h3.facts&&h3.facts.decide});

  /* ---- H5 ---- */
  const w1=await look({ds_sel:'wait'}),w2=await look({ds_sel:'wait',wt_kind:'time'});
  const cat=await p.evaluate(()=>({delay:CAT.find(c=>c.id==='delay'),fct:CAT.find(c=>c.id==='fct'),ext:CAT.find(c=>c.id==='ext'),ncr:CAT.find(c=>c.id==='ncr')}));
  const ch=await p.evaluate(()=>{S.meta.q_goal='wait';const r=chooserRecs();S.meta.q_goal='red';return r;});
  ok('H5 a wait ends when it is over and the student is doing what was asked, with an item; a time-only wait is "not recommended alone"; the catalogue and the chooser rank waits after signals',
    /^When the student uses a raised hand, say “Wait, please,” and the wait card\. The student holds the wait card and keeps working\. being called on comes when the wait in force is over and the student is doing it/.test(w1.rule)&&/Available during the wait: a puzzle from PA-1 on the desk\./.test(w1.rule)
    &&w2.warn.some(w=>/^A time-only wait is not recommended alone/.test(w))&&/not recommended alone/.test(P(w2,'The wait ends')||'')&&/a time-only wait last/.test(cat.fct.prog)&&/Wait, please/.test(cat.delay.ex)&&/end it on what the student does/.test(cat.delay.prog)
    &&/not recommended alone/.test(ch.find(r=>r.id==='delay').why)&&/a multiple or chained schedule first/.test(w1.notes),{r:w1.rule,w2:w2.warn});

  /* ---- H6 ---- */
  ok('H6 with the extinction step chosen, the card says what to expect: about 1 in 4, back by about the fifth session, the published definition, the safety plan; not with "partly"',
    /What to expect/.test(a1.card)&&/About 1 in 4 treatments show a burst/.test(a1.card)&&/about the fifth session/.test(a1.card)&&/any of the first three sessions higher than every one of the last five baseline sessions/.test(a1.card)
    &&/Do not change the plan in the first three sessions without the BCBA/.test(a1.card)&&!/What to expect/.test(a2.card),a1.card.slice(0,1500));

  /* ---- H7, M1 ---- */
  const g=await p.evaluate(()=>document.querySelector('.only-guide').innerText);
  const m1=await look({ds_sel:'thin',th_comp:''});
  ok('H7 the card says what is added after two step-backs and names the team\'s next step; the Guide says many programs need an added component; punishment is not the next step',
    /If thinning stalls/.test(t1.card)&&/Two step-backs at the same step: before trying that step again, add an alternative reinforcer or competing items/.test(t1.card)&&/We add: competing items from PA-1 during the “not now” period/.test(t1.card)
    &&!/If thinning stalls[\s\S]*punish[\s\S]*Data to keep/i.test(t1.card)&&/Even with good thinning, many programs need an added component/.test(g)&&t1.shown.stall===true,t1.card.slice(0,2000));
  ok('M1 a blank "During S− the student has" is warned: a competing item, never the reinforcer the request asks for',m1.warn.some(w=>/^Name what the student has during “not now”: an item or activity from a competing stimulus assessment, never the reinforcer the request asks for/.test(w)),m1.warn);

  /* ---- M2 ---- */
  const g1=await look({ds_sel:'thin',th_goal_min:'6',th_goal_when:'small-group reading'}),g2=await look({ds_sel:'thin',th_goal_min:'6',th_start:'probe',th_rise:'20'});
  ok('M2 the classroom\'s longest wait sets the terminal S−; a probe start runs one session at the terminal value, then the time to rise doubled to half of it, then a second probe, with the caution',
    /6 min \(terminal\)/.test(g1.steps[g1.steps.length-1][2])&&/^6 min, during small-group reading \(sets the terminal S−\)$/.test(P(g1,'Longest wait in this setting')||'')
    &&JSON.stringify(col(g2,2))==='["6 min (probe: one session at the terminal value)","20 s","40 s","80 s","160 s","6 min (probe again at the terminal value)","6 min (terminal)"]'
    &&g2.warn.some(w=>/clinic-developed method \(Strohmeier et al\., 2024\)\. Use it only with the safety plan, and never for behavior that is dangerous/.test(w)),{c:col(g2,2),w:g2.warn});

  /* ---- M3 ---- */
  const c1=await p.evaluate(()=>{Object.assign(S.meta,{q_goal:'red',q_func:'multi'});const r=chooserRecs();S.meta.q_func='att';return r;});
  const f1=await look({ds_sel:'thin',func:'More than one'}),f2=await look({ds_sel:'thin',func:'More than one',fn_reqs:'Attention: taps the talk card\nEscape or avoidance: hands the break card'});
  ok('M3 more than one function: the chooser puts FCT for each function first; the card warns until one request per function is written, then prints them',
    c1[0].id==='fct'&&/^FCT for each function/.test(c1[0].why)&&f1.shown.fn&&f1.warn.some(w=>/write one request for each function/.test(w))&&!f2.warn.some(w=>/write one request for each function/.test(w))
    &&/Requests, one for each function\nAttention: taps the talk card\nEscape or avoidance: hands the break card/.test(f2.card),{c1:c1.slice(0,2),w:f1.warn});

  /* ---- M4 ---- */
  const k1=await look({ds_sel:'ncr',ncr_thin:'kfi'}),k2=await look({ds_sel:'ncr',ncr_thin:'airt',ncr_last3:'10, 4\n10, 2\n10, 0'}),k3=await look({ds_sel:'ncr',ncr_thin:'fixed'}),k4=await look({ds_sel:'ncr',ncr_startby:'lat',ncr_lat:'30'});
  const opt=await p.evaluate(()=>[...document.querySelectorAll('[data-m="ncr_thin"] option')].map(o=>o.value+':'+o.textContent));
  ok('M4 the published fixed increments climb FT 10, 12, 15, 20, 30 s, 1 to 5 min from the start; the adjusting IRT takes the mean of the last three sessions, at most double; doubling and performance-based are named the form\'s conventions; a start from the latency',
    JSON.stringify(col(k1,1))==='["90 s","120 s","3 min","4 min","5 min (terminal)"]'&&/Kahng et al\., 2000/.test(P(k1,'Thinning')||'')
    &&/^3 min \(the mean IRT of the last 3 sessions is 5\.8 min; held to double the interval in force, 90 s\)$/.test(P(k2,'Next session’s interval')||'')&&k2.head[0]==='Session'&&/Adjusting-IRT worksheet/.test(k2.card)
    &&/the form’s convention/.test(P(k3,'Thinning')||'')&&JSON.stringify(col(k3,1))==='["90 s","3 min","5 min (terminal)"]'&&opt.some(x=>/^perf:.*the form’s convention/.test(x))&&opt.some(x=>/^airt:Adjusting IRT/.test(x))
    &&/^30 s \(the time to the first problem behavior in baseline, as in Lalli et al\., 1997\)$/.test(P(k4,'Starting interval')||''),{k1:col(k1,1),k2:P(k2,'Next session’s interval'),k3:[P(k3,'Thinning'),col(k3,1)],opt,k4:P(k4,'Starting interval')});

  /* ---- M5, M6 ---- */
  const r1=await look({ds_sel:'ncr',sr:'Drawing, Music (Form PA-1)'}),r2=await look({ds_sel:'ncr',ext_step:'none'});
  ok('M5 NCR with PA-1 items: the functional reinforcer is slightly stronger and other items also worked; NCR without extinction warns that problem behavior often returns as it is thinned',
    r1.warn.some(w=>/^For NCR the functional reinforcer \(adult attention: comments, praise, someone close\) is slightly stronger\. Highly preferred other items also worked/.test(w))&&!r1.warn.some(w=>/^This schedule should deliver/.test(w))
    &&r2.warn.some(w=>/^Problem behavior often returns as NCR without extinction is thinned/.test(w)&&/Teach and reinforce a request before thinning, and thin slowly\./.test(w)),{w1:r1.warn,w2:r2.warn});
  ok('M6 the NCR card teaches the request alongside NCR, counts it, and thins NCR before expecting it',/The replacement: teach a raised hand alongside NCR and answer it at once/.test(a1.rule)&&/If they stay near zero while NCR is dense, thin NCR before expecting them/.test(a1.rule)&&/while it is dense, requests may stay low/.test(cat.ncr.pit),a1.rule);

  /* ---- M7 ---- */
  const e1=await look({ds_sel:'thin',func:'Escape or avoidance',sr:'a break from the task (the function, Form FS-1)',srs:'',brk_get:'the drawing kit'}),e2=await look({ds_sel:'thin',func:'Escape or avoidance',sr:'a break from the task (the function, Form FS-1)',srs:''});
  ok('M7 for escape the earned break holds the item: "a break with [item]" on the card; a plain break is warned; the catalogue\'s example has a preferred toy',
    /honored at once with a break from the task with the drawing kit/.test(e1.rule)&&/During the break: the drawing kit/.test(e1.card)&&e1.shown.brk&&e2.warn.some(w=>/^Name what the student gets during the break/.test(w))&&/1-minute break with a preferred toy/.test(cat.fct.ex),{r:e1.rule,w:e2.warn});

  /* ---- M9, M10 ---- */
  const v1=await look({ds_sel:'thin',nx_rq_amt:'5'}),v2=await look({ds_sel:'thin',th_sigkind:'natural'});
  ok('M9 a request\'s reinforcer shorter than what problem behavior got in baseline is warned, labelled a model prediction; the card sets the two side by side',
    v1.warn.some(w=>/^The request’s reinforcer is shorter than what problem behavior got in baseline\. Start it at least as good\./.test(w)&&/a model prediction, not yet tested in clinics/.test(w))&&/What each gets, against baseline/.test(v1.card)&&!t1.warn.some(w=>/reinforcer is shorter/.test(w)),v1.warn);
  ok('M10 a natural signal is reached through the arranged one, with the discrimination checked at each change',/^Start with the arranged signals\. When at least 80% of requests are made in S\+, show them together with the teacher’s own activity \(free: S\+; busy: S−\)\. Then fade the arranged signals\./.test(P(v2,'Signal plan')||''),P(v2,'Signal plan'));

  /* ---- L1, L3, L5, L6, L7 ---- */
  const l3=await look({ds_sel:'ncr',ncr_omit_kind:'cancel'});
  const pat=await p.evaluate(()=>PATS.find(x=>x.k==='extcrf').p);
  ok('L1 the extinction entry gives the burst rates: about 1 in 4 overall, 62% with extinction alone for self-injury',/in about 1 in 4 cases overall \(an extinction burst: 24% of 113 data sets, Lerman &amp; Iwata, 1995\), but in 62% when extinction was used alone for self-injury/.test(cat.ext.prod),cat.ext.prod);
  ok('L3 the omission rule can cancel a delivery as in the source; it is named a momentary-DRO element and skipped deliveries are counted',
    /that delivery is skipped and the next one comes on time \(as in Vollmer et al\., 1997\)\. This is a momentary-DRO element/.test(P(l3,'Omission rule')||'')&&/skip this delivery and wait for the next one/.test(l3.rule)&&l3.data.includes('Deliveries skipped by the omission rule, per session')&&/momentary-DRO element/.test(P(a1,'Omission rule')||'')&&a1.data.includes('Deliveries delayed by the omission rule, per session'),{p:P(l3,'Omission rule'),d:l3.data});
  ok('L5 the pattern caption for extinction after CRF says a burst is seen in about 1 in 4 cases',/A burst is seen in about 1 in 4 cases \(Lerman &amp; Iwata, 1995; Muething et al\., 2024\)/.test(pat),pat);
  ok('L6 NCR notes give a reason to consider VT when staff often miss the timer',/a reason to consider VT when staff often miss the timer/.test(a1.notes)&&/Van Camp et al\., 2000; Carr et al\., 2001/.test(a1.notes),a1.notes);
  ok('L7 the Guide prints both forms\' step rules as conventions, with their sources',/Step rules/.test(g)&&/Both are working conventions, not findings\. Hagopian et al\. \(2004\) stepped after two consecutive sessions/.test(g)&&/100% for severe aggression toward peers/.test(g),'guide');

  /* ---- saved cases, references, names ---- */
  const old=await p.evaluate(()=>{const meta={client:'SIMULATED – Old Case',ds_sel:'ncr',ncr_n:'40',ncr_min:'60',ncr_kind:'ft',ncr_dur:'20',ncr_term:'5',ncr_thin:'perf',ncr_omit:'10',ncr_crit:'at or under 10% of baseline rate',beh:'Calling out',behs:'calling out',alt:'Raising a hand',alts:'a raised hand',sr:'Teacher attention',srs:'being called on',func:'Attention'};
    const n=fromFile({form:'SR-1',rev:'2026-10',S:{meta,notes:{}}});S=n;renderAll();const o=design();
    const r={nota:o.nota,steps:o.steps.map(x=>x[1]),card:document.getElementById('cardOut').innerText,sel:document.querySelector('[data-m="ext_step"]').value};return r;});
  ok('old saved file: an NCR case saved before v25.65 opens and prints its steps as before, with the extinction line marked not yet chosen',
    old.nota==='FT 90 s (20 s access)'&&JSON.stringify(old.steps)==='["90 s","3 min","5 min (terminal)"]'&&/Extinction step: not yet chosen/.test(old.card)&&/Calling out itself never produces being called on/.test(old.card)&&old.sel==='',old);
  const refs=await p.evaluate(()=>document.getElementById('srRefs').textContent);
  ok('the new citations are in the reference list',['Muething, C.','Strohmeier, C. W.','Laureano, B.','Ghaemmaghami, M.','Drifke, M. A.','Weber, J.','Briggs, A. M.','Hoch, H.','Slocum, S. K.','Rooker, G. W.','Phillips, C. L.','Kahng, S.','Pizarro, E. M.'].every(x=>refs.includes(x)),'refs');
  const src=await p.evaluate(()=>document.documentElement.outerHTML);
  /* the names of participants in the studies read for this change, kept encoded so that they are not written here */
  const NM=['SnVsaWE=','TmFuY3k=','U2hlbGJ5','QnJhaWRlbg=='].map(b=>Buffer.from(b,'base64').toString());
  ok('no research participant names in the form',!NM.some(n=>new RegExp('\\b'+n+'\\b').test(src)),'names');
  /* the BCBA, 11/6: a new form thins NCR by the published fixed increments; a file saved without a choice keeps doubling */
  const dflt=await p.evaluate(()=>{S=fresh();renderAll();const a=S.meta.ncr_thin,sel=document.querySelector('[data-m="ncr_thin"]').value;
    const o=fromFile({form:'SR-1',S:{meta:{client:'SIMULATED – Old Case',ds_sel:'ncr'},notes:{}}});return {a,sel,old:o&&o.meta.ncr_thin||''};});
  ok('11/6 a new form defaults to the published fixed increments; an old file without a choice is unchanged (reads as doubling)',dflt.a==='kfi'&&dflt.sel==='kfi'&&dflt.old==='',dflt);
  ok('no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
