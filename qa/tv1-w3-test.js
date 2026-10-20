/* v23.06 Form TV-1, the training video, review Wave 3 (simulated student only: Mateo Rivera, 4471823).
   The case comes from the simulators of TB-1, FS-1, GB-1, PA-1, DM-1, TD-1, CR-1, DD-1, QS-1 and IC-1 through the shell.
   F358  Before You Record asks where the finished video is kept and who may watch it, shows the consent Form IC-1 hands on
         (with its recording and sharing decisions); the chapters and captions ask first until a restricted place is
         chosen; "wider than the team" turns Initials only on; with initials the shared files and the printed headers use them.
   F359  a plan that thins the schedule: no "every time" in the video or the takeaways, a bracketed line for the step it is at,
         and no quiz item until that line is written; written on Setup, it is said and becomes the quiz key; a continuous
         plan still says "every time".
   F361  the audience read as whole words ("the homeroom teachers" and the rest are staff); a family's draft names what it
         leaves out and says the school has a crisis plan and the family has its copy.
   F362  the function behavior by behavior (Form TB-1's and Form FS-1's), a bracketed line where none is written, a question a
         behavior, every function the case names a right answer.
   F363  the rehearsal steps from the case's own words, whole, with their part of the plan and who they are for; the crisis
         plan's physical stages left out; Form ST-1 takes the school's steps and Form CT-1 only the home steps.
   The minors and improvements: F360 the crisis stages with who does each, the physical one whole for the trained staff
   named, with the health limits; F364 where things stand from the plan's targets, the replacement and the skills, the
   average since the plan began and last week; F365 the openings and the plain words, the sources; F366 every rule in the
   words, no cut at "Mr.", whole definitions, the don't as the action, true and false items; F367 the sample's response;
   I181 the plan's date and a change in the case; I182 who watched; I184 the presenter from the Case BCBA, the ID, grade
   and date on the print, the cards on one page; I185 the short version.
   usage: node qa/tv1-w3-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep,loadSim}=require(__dirname+'/lib.js');
const W=BASE+'/NBH-Workstation/';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000}});wire(page,log);
  await page.goto(W+'index.html');await sleep(800);
  const open=async id=>{await page.evaluate(id=>openForm(id),id);const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1000);return (await fr.contentFrame());};
  for(const id of ['TB-1','FS-1','GB-1','PA-1','DM-1','TD-1','CR-1','DD-1','QS-1','IC-1']){const f=await open(id);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});await loadSim(f);await sleep(700);}
  await sleep(7000);
  const facts=await page.evaluate(()=>state.facts);
  /* the week as DD-1 gives it: this week so far through its Friday, last week once it is over (the release run's fix) */
  const rx=t=>String(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),WD=(facts.data||{}).week||{},WK=(WD.rows||[]).find(r=>r.name==='Physical aggression')||{};
  const WKLAB=(()=>{const m=String(WD.mon||'').split('-').map(Number),fri=new Date(m[0],m[1]-1,m[2]+4),t=new Date();t.setHours(0,0,0,0);return fri>=t&&WD.days?'This week so far \\('+WD.days+' school days?\\)':'Last week';})();
  ok('the shell holds the case: the plan, the quick start, the crisis plan, the data and the consent',!!(facts&&facts.plan&&facts.quick&&facts.crisis&&facts.data&&facts.consent&&facts.fn&&facts.behaviors),facts&&Object.keys(facts));
  const tv=await open('TV-1');await sleep(1200);
  const A=await tv.evaluate(async()=>{window.__asked=[];nbhUI.confirm=async m=>{window.__asked.push(m);return window.__yes!==false;};Object.assign(S.meta,{client:'Mateo Rivera',first:'',aud:'the receiving team',keep:'',honor:''});S.chk.initials=false;
    document.getElementById('draftBtn').click();await new Promise(r=>setTimeout(r,400));setView('setup');renderSetup();QUIZ=tvQuiz();
    const row=t=>S.rows.find(r=>r.title===t)||{},checks=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.className.replace('verdict ','')+': '+v.textContent);
    return {checks,works:row('Works For').say,rem:row('Remember').say,remb:row('Remember').body,hyp:row('Hypothesis').say,hypb:row('Hypothesis').body,fnb:row('Function').body,fnc:row('Function').cont,
      quiz:QUIZ.map(x=>({q:x.q,a:x.a,ch:x.ch})),steps:tvSteps(),out:window.__nbhFactsOut().training,safety:!!S.rows.find(r=>r.title==='Safety'),tiers:S.rows.filter(r=>r.seg==='Step by Step').map(r=>r.title)};});
  /* ---------- F358 ---------- */
  ok('F358 Before You Record: where the video is kept is required, not chosen yet',/^v-no: Where the video is kept, and who may watch it: not chosen/.test(A.checks[0]),A.checks);
  ok('F358 the consent Form IC-1 hands on, with its recording and sharing decisions',A.checks.some(c=>/^v-ok: Consent: Consent on file since \d+\/\d+\/\d{4} \(Form IC-1\)\. Recording: permitted as described; who may view: BCBA, behavior resource teacher, second observer for IOA; deleted by \d+\/\d+\/\d{4}\. Sharing outside the school: not proposed\./.test(c)),A.checks);
  const K=await tv.evaluate(async()=>{const r={};window.__asked=[];window.__yes=false;S.log=[{i:0,t:0,seg:S.rows[0].seg,title:S.rows[0].title},{i:3,t:20,seg:S.rows[3].seg,title:S.rows[3].title},{i:6,t:45,seg:S.rows[6].seg,title:S.rows[6].title}];
    r.names=[];const d0=window.download;window.download=(b,t,n)=>{r.names.push(n);r.name=n;};
    document.getElementById('chapBtn').click();await new Promise(x=>setTimeout(x,150));document.getElementById('srtBtn').click();await new Promise(x=>setTimeout(x,150));r.asked=window.__asked.slice();r.dl0=r.names.filter(n=>/chapters|captions/.test(n)).length;r.warn=document.getElementById('tvKeepWarn').textContent;
    const sel=document.querySelector('[data-m="keep"]');sel.value='team';sel.dispatchEvent(new Event('change',{bubbles:true}));window.__asked=[];document.getElementById('chapBtn').click();await new Promise(x=>setTimeout(x,150));
    r.asked2=window.__asked.length;r.dl1=r.names.filter(n=>/chapters|captions/.test(n)).length;r.warn2=document.getElementById('tvKeepWarn').textContent;r.kept=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.className.replace('verdict ','')+': '+v.textContent)[0];
    sel.value='wider';sel.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(x=>setTimeout(x,100));r.ini=S.chk.initials;r.title=S.rows[0].title;r.first=firstName();
    r.wider=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.className.replace('verdict ','')+': '+v.textContent).find(t=>/Wider than the team/.test(t))||'';
    document.getElementById('quizCsv').click();r.quizName=r.name;renderPrint();r.head=(document.querySelector('#printOut .pr-s')||{}).textContent||'';r.stepsHead=(()=>{const h=tvStepsPrint();const m=/<p class="pr-s">([^<]*)<\/p>/.exec(h);return m?m[1]:'';})();
    window.download=d0;window.__yes=true;return r;});
  ok('F358 the chapters and the captions ask first while no restricted place is chosen, and make nothing when the answer is no; a line says so',K.asked.length===2&&/not chosen yet/.test(K.asked[0])&&/YouTube chapters/.test(K.asked[0])&&/captions/.test(K.asked[1])&&K.dl0===0&&/Before these files go anywhere/.test(K.warn),K);
  ok('F358 kept on the district drive for the team: they are made without asking',K.asked2===0&&K.dl1===1&&K.warn2===''&&/Kept on the district drive or video service, restricted to the student’s team: say above where exactly/.test(K.kept),K);
  ok('F358 "wider than the team" turns Initials only on: the cards say M. R.; the consent does not cover sharing outside the school, and it says so',K.ini===true&&K.title==='M. R.’s FBA and BIP'&&K.first==='M. R.'&&/^v-no: Wider than the team\. Initials only is on\. Form IC-1 does not approve sharing outside the school \(not proposed\)/.test(K.wider),K);
  ok('F358 with initials, the files made to share and the printed headers use them',/^TV-1_M_R_quiz\.csv$/.test(K.quizName)&&/^M\. R\./.test(K.head)&&!/Mateo/.test(K.head)&&/^M\. R\./.test(K.stepsHead),K);
  /* ---------- F359 ---------- */
  ok('F359 the plan thins the schedule: the video does not say "every time"; it leaves the step the plan is at for the BCBA',/The plan thins the schedule over time \(chained work requirement/.test(A.works)&&/\[Right now: how the request is honored at this step, e\.g\. after a 2-minute wait with the timer\]\./.test(A.works)&&!/every time/i.test(A.works+A.rem)&&/The replacement: press the break card · \[how, right now\]/.test(A.remb),{w:A.works,r:A.rem,b:A.remb});
  ok('F359 Setup says the plan thins it (the request card, the multiple schedule, delay and denial tolerance, the waiting target) and asks for the step',A.checks.some(c=>/^v-mid: The plan thins the schedule \(Chained work requirement.*Delay and denial tolerance training.*the daily data track “Waits 2 min after mand”\)/.test(c)),A.checks);
  ok('F359 no quiz question on the replacement until the step is written',!A.quiz.some(x=>/uses the replacement behavior/.test(x.q)),A.quiz.map(x=>x.q));
  const H=await tv.evaluate(async()=>{S.meta.honor='after a 2-minute wait with the timer showing';S.rows=[];S.meta.keep='team';S.chk.initials=false;document.getElementById('draftBtn').click();await new Promise(r=>setTimeout(r,300));
    QUIZ=tvQuiz();const q=QUIZ.find(x=>/uses the replacement behavior/.test(x.q));setView('setup');renderSetup();
    return {works:(S.rows.find(r=>r.title==='Works For')||{}).say,rem:(S.rows.find(r=>r.title==='Remember')||{}).say,q:q&&{a:q.a,ch:q.ch},chk:document.getElementById('tvChecks').textContent};});
  ok('F359 the step written on Setup: said in the video and the takeaways, and it is the quiz key; waiting is not a wrong answer',/How it is honored right now: after a 2-minute wait with the timer showing\./.test(H.works)&&/How it is honored right now: after a 2-minute wait/.test(H.rem)&&!/\[Right now/.test(H.works)&&
    H.q&&H.q.a==='After a 2-minute wait with the timer showing'&&!H.q.ch.some(c=>/wait until the work is done/.test(c))&&!/The plan thins the schedule \(/.test(H.chk),H);
  /* ---------- F362 ---------- */
  ok('F362 the function behavior by behavior on its card, the automatic one among them; it continues the hypothesis paragraph',A.fnc===true&&/^Aggression: Escape \/ avoidance/.test(A.fnb)&&/\nElopement: Escape \/ avoidance/.test(A.fnb)&&/\nArranging and ordering: Automatic/.test(A.fnb),A.fnb);
  ok('F362 said aloud with each replacement; the hypotheses not written are left in brackets',/Arranging and ordering \(higher-level RRB\): automatic \(nonsocial\); what Mateo is taught instead: engages with a competing item from the A-CSA list\./.test(A.hyp)&&/\[The hypothesis statement for elopement\.\]/.test(A.hyp)&&/\[elopement: when …/.test(A.hypb),A.hyp);
  const fq=A.quiz.filter(x=>/Why does the team think/.test(x.q));
  ok('F362 a quiz question a behavior, the one with another function among them',fq.length>=2&&fq.some(x=>/arranging and ordering/.test(x.q)&&x.a==='Because of how it feels (sensory)')&&fq.some(x=>/aggression happens/.test(x.q)&&x.a==='To get out of a task or a demand'),fq);
  /* ---------- F363 (the plan's step list) ---------- */
  ok('F363 with the plan\'s step list (Form TD-1): its steps whole, each for school staff, out with the video\'s audience',A.steps.length===A.out.steps.length&&A.out.steps.every(s=>s.who==='staff'&&!/…$/.test(s.d))&&A.out.aud==='staff',A.out);
  /* ---------- F361 ---------- */
  const fam=await tv.evaluate(async()=>{const r={};for(const a of ['the homeroom teachers','the home school team','the team at Foster Elementary','the after-school staff at home base','the substitute teacher for the moment','the Rivera family','Mateo’s parents','Mom and Dad'])r[a]=(S.meta.aud=a,tvFam());
    S.meta.aud='the homeroom teachers';S.rows=[];document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));r.staffSafety=!!S.rows.find(x=>x.title==='Safety');r.staffTiers=S.rows.filter(x=>x.seg==='Step by Step').length;
    S.meta.aud='the Rivera family';S.rows=[];document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));setView('setup');renderSetup();
    r.famSafety=!!S.rows.find(x=>x.title==='Safety');const c=S.rows.find(x=>x.title==='The Crisis Plan')||{};r.crisis=c.say;r.tiers=S.rows.filter(x=>x.seg==='Step by Step').map(x=>x.title);
    r.check=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.textContent).find(t=>/Drafted for/.test(t));r.out=window.__nbhFactsOut().training;S.meta.aud='the receiving team';return r;});
  ok('F361 the audience read as whole words: the homeroom teachers, the home school team, Foster Elementary, home base and the moment are staff; a family, parents, Mom and Dad a family',
    !fam['the homeroom teachers']&&!fam['the home school team']&&!fam['the team at Foster Elementary']&&!fam['the after-school staff at home base']&&!fam['the substitute teacher for the moment']&&fam['the Rivera family']&&fam['Mateo’s parents']&&fam['Mom and Dad'],fam);
  ok('F361 "the homeroom teachers" get the staff video: the crisis plan and every tier',fam.staffSafety&&fam.staffTiers===6,fam);
  ok('F361 a family\'s draft says the school has a crisis plan and the family has its copy, and Setup names what it leaves out',!fam.famSafety&&/The school also has a crisis plan[\s\S]*Your family has its own copy/.test(fam.crisis)&&!fam.tiers.some(t=>/Throwing|Leaving/.test(t))&&
    /Drafted for a family\. Automatic, from “Who the training is for”, which names a family \(“family”\); choose Staff above if the video is for staff\. The draft uses plain words, and leaves out the crisis plan’s five stages and the tiers 2 · Throwing and 3 · Leaving the room; it says the school has a crisis plan and the family has its copy\./.test(fam.check),fam);
  /* ---------- F363 (no step list: the case's own words), F359 (a continuous plan), F362 (two functions) ----------
     on the form opened on its own: in the workstation the shell hands the form its case again a moment later */
  await tv.evaluate(()=>{nbhUI.confirm=async()=>true;});
  const tp=await br.newPage({viewport:{width:1300,height:950}});wire(tp,log);await tp.goto(W+'TV-1_Training-Video_v2026-10.html');await sleep(1200);
  await tp.evaluate(()=>{nbhUI.confirm=async()=>true;S.meta.client='Mateo Rivera';S.meta.keep='team';});
  const B=await tp.evaluate(async F=>{const f=JSON.parse(JSON.stringify(F));delete f.plan.steps;delete f.plan.stepsRev;window.__nbhFactsIn(f);S.meta.aud='the receiving team';S.meta.honor='';S.rows=[];document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));
    const st=tvSteps(),o=window.__nbhFactsOut().training;setView('setup');tvStepsRender();const hint=document.getElementById('stepsOut').textContent;
    const g={};const c=JSON.parse(JSON.stringify(F));c.plan.sched=['Continuous (every request)'];c.plan.teach=['Functional communication training'];delete c.plan.request;c.data={behaviors:[]};delete c.plan.steps;
    c.behaviors=[{label:'Hitting',def:'Hitting a person with a hand',fn:'Escape and attention'},{label:'Leaving the room',def:'Out of the door without permission',fn:''},{label:'Asking for a break',isRep:true,type:'Replacement / alternative behavior'}];c.fn={label:'Escape',key:'escape',statements:[],perBehavior:[]};
    window.__nbhFactsIn(c);S.rows=[];document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));QUIZ=tvQuiz();tvQuizRender();
    g.works=(S.rows.find(r=>r.title==='Works For')||{}).say;g.q=QUIZ.find(x=>/uses the replacement/.test(x.q));g.cb=QUIZ.find(x=>x.keys);g.ticks=document.querySelectorAll('#quizOut li.ok').length;g.n=QUIZ.length;g.fnb=(S.rows.find(r=>r.title==='Function')||{}).body;g.hyp=(S.rows.find(r=>r.title==='Hypothesis')||{}).say;
    g.rows=tvQuizRows().slice(1).filter(r=>r[1]==='Checkboxes');window.__nbhFactsIn(F);return {st,o,hint,g};},facts);await tp.close();
  const st=B.st,by=t=>st.find(s=>s.d.includes(t));
  ok('F363 without the step list, the steps come from the case\'s own words, whole (no cut card lines)',st.length>=12&&!st.some(s=>/…$/.test(s.d))&&!!by('The job, the computer, Mr. Ortiz: after calm and the task')&&!!by('Staff stay ≥ 5 ft during independent work unless prompting; approach from the side at eye level'),st.map(s=>s.d));
  ok('F363 each step\'s part of the plan from its source: a strategy and the crisis plan\'s prevention before, the points kept and the first-sign response after',by('Staff stay ≥ 5 ft').cmp==='ant'&&/^Prevention/.test((st.find(s=>/^Prevention/.test(s.d))||{}).d||'')&&st.find(s=>/^Prevention/.test(s.d)).cmp==='ant'&&by('Keep every point he has earned').cmp==='con'&&by('At the first sign').cmp==='con'&&by('At the first sign').crit===true,st.map(s=>[s.cmp,s.d.slice(0,40)]));
  ok('F363 who each step is for: the tier marked for trained staff only, the rest school staff; the crisis plan\'s physical stage left out, and said',(st.find(s=>/3 · Leaving the room/.test(s.d))||{}).who==='trained'&&st.filter(s=>s.who!=='trained').every(s=>s.who==='staff')&&!st.some(s=>/^Peak|Restraint only/.test(s.d))&&!!st.find(s=>/^Recovery \(Adult who did not restrain\)/.test(s.d))&&/physical stages are left out/.test(B.hint)&&B.o.steps.every(s=>s.who),{st:st.map(s=>[s.who,s.d.slice(0,40)]),hint:B.hint});
  ok('F359 a continuous plan says "every time", and the quiz key is the same',/Honor it every time, right away\./.test(B.g.works)&&B.g.q&&B.g.q.a==='Honor it right away, every time',B.g);
  ok('F362 a behavior with two functions: both right in the quiz, both ticked, a checkbox question in the CSV; a behavior with none is left in brackets',B.g.cb&&B.g.cb.keys.length===2&&B.g.cb.keys.includes('To get out of a task or a demand')&&B.g.cb.keys.includes('To get attention from an adult or a classmate')&&B.g.ticks===B.g.n+1&&B.g.rows.length===1&&/ \| /.test(B.g.rows[0][6])&&
    /\nLeaving the room: \[not yet stated\]/.test(B.g.fnb)&&/\[The function of leaving the room is not yet stated\.\]/.test(B.g.hyp),B.g);
  /* ---------- the minors and improvements (commit 2), on the form opened on its own with the case ---------- */
  const tq=await br.newPage({viewport:{width:1300,height:950}});wire(tq,log);await tq.goto(W+'TV-1_Training-Video_v2026-10.html');await sleep(1200);
  const C=await tq.evaluate(async F=>{nbhUI.confirm=async()=>true;Object.assign(S.meta,{client:'Mateo Rivera',sid:'4471823',grade:'3',date:'2026-10-19',pname:'',bcba:'Jordan Ellis (simulated)',aud:'the receiving team',keep:'team'});window.__nbhFactsIn(F);
    document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,400));const row=t=>S.rows.find(r=>r.title===t)||{},i=S.rows.findIndex(r=>r.title==='Safety'),r={};
    r.safety=row('Safety');r.next=S.rows[i+1]||{};r.data=row('Before and Now');r.dataTp=spoken(r.data);const ch=photo('tvchart');r.svg=ch?decodeURIComponent(escape(atob(ch.img.split(',')[1]))):'';
    r.ev=S.rows.filter(x=>x.seg==='Every Day').map(x=>({tp:x.tp,cont:x.cont,body:x.body}));r.short=short('The job, the computer, Mr. Ortiz: after calm and the task',54);
    r.goals=row('Reduce').say;r.resp=row('Steps').say;r.pres=row('Presenter');r.close=row('Thank you');r.planAt=S.meta.planAt;
    QUIZ=tvQuiz();r.not=(QUIZ.find(x=>/should staff not do/.test(x.q))||{}).a;r.def=(QUIZ.find(x=>/as the plan defines it/.test(x.q))||{}).a;r.defFull=F.behaviors[0].def;
    renderPrint();r.head=(document.querySelector('#printOut .pr-s')||{}).textContent||'';const cp=document.createElement('div');cp.innerHTML=tvCardsPrint();r.cards=cp.querySelectorAll('.tv-card').length;r.cardRows=S.rows.filter(x=>str(x.title)||str(x.body)).length;
    r.cov=row('Covering').body;tvPlainReplace('reinforcement');r.cov2=row('Covering').body;r.neg=tvPlainOf('negative reinforcement');r.src=/Parsons, Rollyson &amp; Reid \(2012\)/.test(document.body.innerHTML);
    /* I181: the plan changes in the case: Setup says so, and those segments are drafted again */
    const G=JSON.parse(JSON.stringify(F));G.plan.respond.target='Keep the task in place; prompt the card once (simulated)';window.__nbhFactsIn(G);setView('setup');renderSetup();
    r.changed=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.textContent).find(t=>/plan changed/.test(t))||'';const n0=S.rows.length;document.getElementById('tvRedraftGo').click();await new Promise(x=>setTimeout(x,200));
    r.after=row('Steps').say;r.n=[n0,S.rows.length];setView('setup');renderSetup();r.changed2=/plan changed/.test(document.getElementById('tvChecks').textContent);
    /* I182: who watched */
    document.getElementById('viewAdd').click();const set=(k,v)=>{const el=document.querySelector('[data-view="'+k+'"][data-vi="0"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));};
    set('name','Dana Whitfield (simulated)');set('role','Paraprofessional');set('date','2026-10-20');set('score','6 of 8');set('missed','3, 6');
    r.viewers=window.__nbhFactsOut().training.viewers;r.kept=fromFile(JSON.parse(JSON.stringify({form:'TV-1',S}))).viewers;r.viewHint=document.getElementById('viewOut').textContent;
    /* I185: the short version */
    document.getElementById('shortBtn').click();await new Promise(x=>setTimeout(x,300));r.shortRows=S.rows.map(x=>x.title);setView('setup');renderSetup();r.shortCheck=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.textContent).find(t=>/short version/.test(t))||'';QUIZ=tvQuiz();r.shortQ=QUIZ.map(x=>x.q);
    document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));r.shortOff=S.meta.short;
    /* F367: the sample */
    await loadSim();await new Promise(x=>setTimeout(x,300));r.sim=row('Steps');
    /* F366: a short case: true and false items */
    window.__nbhFactsIn({behaviors:[{label:'Elopement',def:'Leaving the room without permission'}],quick:{rules:[{do:'Greet him at the door',dont:'No arguing, no raised voices'},{do:'Offer the card',dont:'Take the card away'}]}});S.rows=[];document.getElementById('draftBtn').click();await new Promise(x=>setTimeout(x,300));
    QUIZ=tvQuiz();r.tf=QUIZ.filter(x=>x.type==='tf').map(x=>x.q+' => '+x.a);return r;},facts);await tq.close();
  ok('F360 the crisis stages with who does each; before them, only the trained staff (named) use any physical procedure, and this video is not that training',/Only the staff the crisis plan names as trained \(Aide A \(CPI last trained/.test(C.safety.say)&&/This video is not that training\./.test(C.safety.say)&&/Stage four, peak \/ imminent risk, two CPI-trained adults only\./.test(C.safety.say)&&/Health limits on any physical procedure: Mild exercise-induced asthma/.test(C.safety.say)&&/\n4\. Peak \/ imminent risk \(two CPI-trained adults only\): trained staff only, next card/.test(C.safety.body),C.safety);
  ok('F360 the physical stage whole on a card of its own, with the trained staff and the health limits',C.next.cont===true&&C.next.title==='Trained Staff Only'&&/Restraint only if a closed fist is raised toward the head or face, or a strike is made while an adult is off balance\. Two trained adults, neither of whom is between the student and the door\./.test(C.next.body)&&/\nTrained: Aide A/.test(C.next.body)&&/\nHealth limits: /.test(C.next.body),C.next);
  ok('F364 where things stand: the plan\'s targets, the replacement and the waiting skill; the average since the plan began, last week, and the targets with no daily data',/Mand for break/.test(C.data.body)&&/Waits 2 min after mand/.test(C.data.body)&&!/Property destruction|Tantrum/.test(C.data.body)&&new RegExp('an average of about 2\\.1 times a day over the 14 school days since the plan began\\. '+WKLAB+': '+rx(WK.now)+(WK.change?', '+rx(WK.change)+' on the week before':'')+'\\.').test(C.dataTp)&&/\[No daily data for elopement\.\]/.test(C.dataTp)&&/Since the plan/.test(C.svg)&&!/>Now</.test(C.svg),{body:C.data.body,tp:C.dataTp});
  ok('F365 the openings do not overstate; a segment\'s name is left as it is when a term is replaced; each kind of reinforcement its own words; the sources named',/say when the goal for a target behavior is met/.test(C.goals)&&!/considered resolved/.test(C.goals)&&/from the first sign to afterwards/.test(C.resp)&&/• Reinforcement System/.test(C.cov2)&&C.neg==='getting out of the task'&&C.src,{goals:C.goals,cov2:C.cov2,neg:C.neg,src:C.src});
  ok('F366 every rule in the teleprompter words, a >> where the next card comes up; a card line not cut at "Mr."',C.ev.length===2&&/One sentence of rule for a what-if[\s\S]* >> [\s\S]*Move the other students’ attention/.test(C.ev[0].tp)&&C.ev[1].cont&&C.short==='The job, the computer, Mr. Ortiz',C.ev);
  ok('F366 the quiz: the whole definition, and the don\'t as the action, not a double negative',C.def===C.defFull&&C.not==='Break, negotiation or comments about the behavior',{def:C.def,not:C.not});
  ok('F366 a short case\'s true-or-false items are not all True',C.tf.some(x=>/=> False$/.test(x))&&C.tf.some(x=>/=> True$/.test(x))&&C.tf.some(x=>/Staff do this: arguing or raised voices/i.test(x)),C.tf);
  ok('F367 the sample\'s response plan: the card at the first sign, and the behavior itself never earns a break',/^1\. First sign: prompt the break card/.test(C.sim.body)&&/the behavior itself never earns a break/.test(C.sim.say),C.sim);
  ok('I181 the plan the video teaches: dated on the closing card; a change in the case is named on Setup, and those segments are drafted again',!!C.planAt&&/This video teaches the plan as of \d+\/\d+\/\d{4}\./.test(C.close.say)&&/The plan changed since this video was drafted\. It teaches the plan as of [\d/]+; since then the case’s the response plan changed/.test(C.changed)&&/Keep the task in place; prompt the card once/.test(C.after)&&!C.changed2,{changed:C.changed,after:C.after,n:C.n});
  ok('I182 who watched: the viewer, the version and the items missed go to the case, and stay in the saved file; watching is not competency',C.viewers.length===1&&C.viewers[0].name==='Dana Whitfield (simulated)'&&C.viewers[0].missed==='3, 6'&&/^\d+\/\d+\/\d{4}$/.test(C.viewers[0].ver)&&C.kept.length===1&&C.kept[0].score==='6 of 8'&&/not competency/.test(C.viewHint),C);
  ok('I184 the presenter from the Case BCBA; the script\'s print names the ID, grade and date; the cards print on one page',C.pres.body==='Jordan Ellis (simulated)'&&/presented by Jordan Ellis \(simulated\)/.test(C.pres.say)&&/Mateo Rivera · ID 4471823 · Grade 3 · 10\/19\/2026/.test(C.head)&&C.cards===C.cardRows&&C.cards>10,{pres:C.pres,head:C.head,cards:[C.cards,C.cardRows]});
  ok('I185 the short version: the student, the do and don\'t, the first sign, leaving the room, whom to call; Setup says what it leaves out; three questions; a full draft ends it',JSON.stringify(C.shortRows)===JSON.stringify(['Mateo’s Plan: the Short Version','Mateo','Do and Don’t','Do and Don’t','At the First Sign','If Mateo Leaves','Whom to Call'])&&/leaves out the assessment and the function/.test(C.shortCheck)&&C.shortQ.length===3&&C.shortOff==='',C);
  /* ---------- F363: Form ST-1 takes the school's steps, Form CT-1 only the home steps ---------- */
  const steps=B.o.steps.concat([{d:'At home: hand over the break card at homework time (simulated)',crit:false,cmp:'ant',who:'home'}]);
  const sp=await br.newPage();wire(sp,log);await sp.goto(W+'ST-1_Behavior-Skills-Training_v2026-09.html');await sleep(900);
  const s1=await sp.evaluate(steps=>{window.__nbhFactsIn({training:{steps,src:'TV-1'}});return {n:S.steps.length,home:S.steps.some(s=>/At home/.test(s.d))};},steps);await sp.close();
  ok('F363 Form ST-1 takes the school steps, not the home step',s1.n===steps.length-1&&!s1.home,s1);
  const cp=await br.newPage();wire(cp,log);await cp.goto(W+'CT-1_Caregiver-Training_v2026-09.html');await sleep(900);
  const c1=await cp.evaluate(steps=>{const school=steps.filter(s=>s.who!=='home');window.__nbhFactsIn({training:{steps:school,src:'TV-1'}});const a=S.steps.filter(s=>String(s.d||'').trim()).length;
    window.__nbhFactsIn({training:{steps,src:'TV-1'}});return {a,b:S.steps.filter(s=>String(s.d||'').trim()).map(s=>s.d)};},steps);await cp.close();
  ok('F363 Form CT-1 takes none of the school steps, and only the home step',c1.a===0&&c1.b.length===1&&/At home: hand over the break card/.test(c1.b[0]),c1);
  const bad=log.filter(l=>l.type==='pageerror'||(l.type==='error'&&!/favicon|ERR_FILE|Failed to load resource/.test(l.text)));
  ok('no page errors',!bad.length,bad);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
