/* v21.82 (helper L) staff training to the case, generalization and maintenance objectives, the home-language flag on the
   family-facing pages, and the PR-1 decision on DD-1's phase lines. Simulated students only.
   1. ST-1: facts out 'staff' = {people:[{name, role, criterion, met, date}], all}: the simulated trainee competent (met, dated),
      the same trainee with the rounds cleared not met (no date), nothing named: no 'staff'.
   2. GB-1: the generalization and maintenance templates (the type, the sentence, the case), and the progress report read from
      simulated DD-1 probes (f.data.probes with f.data.byDay), and from f.data.bySetting when no probe is marked.
   3. The interpreter flag (f.profile.language) on screen and never in print, nor in the family's text: DD-1's note for home,
      GB-1's progress report, HD-1's home sheets, CT-1's pages; none for English without an interpreter.
   4. DD-1: a review in f.review.log within 3 school days of a condition's first day labels its phase line ("Modified 10/14
      (PR-1)"), on screen and in print; one further away does not.
   No page errors.  usage: node qa/v2182-l-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const ago=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return iso(d);};
const LANG={profile:{language:{home:'Spanish',interpreter:true}}};
const ENG={profile:{language:{home:'English',interpreter:false}}};
const FLAG=/Home language: Spanish[^]*Have this translated or explained by an interpreter \(the district.s interpreter service\) before it goes home\./;
async function open(br,log,file){const p=await br.newPage({viewport:{width:1280,height:900}});wire(p,log);
  await p.goto(W+file,{waitUntil:'load'});await p.waitForTimeout(400);
  await p.evaluate(()=>{try{if(window.nbhUI)nbhUI.confirm=async()=>true;}catch(e){}});return p;}
/* the flag is laid out on screen, and not in print (with what the print shows still laid out) */
async function flagScreenPrint(p,sel,shown,printPrep){
  const scr=await p.evaluate(s=>{const e=document.querySelector(s);return {has:!!e,vis:!!e&&e.getClientRects().length>0,text:e?e.textContent:''};},sel);
  await p.emulateMedia({media:'print'});if(printPrep)await p.evaluate(printPrep);
  const pr=await p.evaluate(([s,k])=>{const e=document.querySelector(s),o=document.querySelector(k);return {vis:!!e&&e.getClientRects().length>0,disp:e?getComputedStyle(e).display:'',shown:!!o&&o.getClientRects().length>0};},[sel,shown]);
  await p.emulateMedia({media:'screen'});return {scr,pr};}
(async()=>{const br=await chromium.launch();const log=[];

  /* ---------- 1. ST-1 ---------- */
  {const p=await open(br,log,'ST-1_Behavior-Skills-Training_v2026-09.html');
    const none=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.staff?o.staff:null;});
    ok('1a ST-1 with no trainee named sends no staff',none===null,none);
    await p.evaluate(async()=>{await loadSim();});await p.waitForTimeout(300);
    const a=await p.evaluate(()=>({o:window.__nbhFactsOut(),v:(document.querySelector('#verdictBox .verdict')||{}).className}));
    const s=a.o&&a.o.staff,q=s&&s.people&&s.people[0];
    ok('1b staff shape {people:[{name, role, criterion, met, date}], all}',!!q&&Array.isArray(s.people)&&s.people.length===1&&typeof s.all==='boolean'&&['name','role','criterion','met'].every(k=>k in q),a.o);
    ok('1c the simulated trainee: name and role from Setup, the criterion in words',q&&q.name==='Simulated RBT'&&q.role==='Registered Behavior Technician'&&/^90% across 2 consecutive rounds, then an in-situ probe at 90% or above$/.test(q.criterion),q);
    ok('1d competent on the decision: met, dated (ISO), all true',q&&q.met===true&&/^\d{4}-\d{2}-\d{2}$/.test(q.date||'')&&s.all===true&&/v-ok/.test(a.v),{q,s,v:a.v});
    const b=await p.evaluate(()=>{S.cells={};S.meta.outcome='';renderAll();return window.__nbhFactsOut().staff;});
    ok('1e rounds cleared: not met, no date, all false',b&&b.people[0].met===false&&!('date' in b.people[0])&&b.all===false,b);
    const c=await p.evaluate(()=>{S.meta.outcome='Competent — may run the plan without the trainer present';return window.__nbhFactsOut().staff;});
    ok('1f the sign-off "Competent — may run the plan without the trainer present" counts as met',c&&c.people[0].met===true&&c.all===true,c);
    await p.close();}

  /* ---------- 2 and 3. GB-1 ---------- */
  {const p=await open(br,log,'GB-1_Goal-and-Objective-Builder_v2026-09.html');
    const z=await p.evaluate(()=>(document.body.innerHTML.match(/generaliz/gi)||[]).length>0&&(document.body.innerHTML.match(/maintenance/gi)||[]).length>0);
    ok('2a GB-1 names generalization and maintenance',z);
    await p.evaluate(async()=>{document.querySelector('#simBtn').click();});await p.waitForTimeout(500);
    const t=await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="acq"]').click();const g=gbAddKind('gen'),m=gbAddKind('maint');
      const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
      set('acq['+g+'].gList','the cafeteria, art and music');set('acq['+m+'].mDate',(d=>{d.setDate(d.getDate()-56);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})(new Date()));render();
      const card=i=>document.querySelector('[data-out="acq'+i+'"]').closest('.card');
      return {g,m,gs:card(g).querySelector('[data-out]').textContent,ms:card(m).querySelector('[data-out]').textContent,gk:card(g).dataset.kind,mk:card(m).dataset.kind,
        gh:card(g).querySelector('.chdt').textContent,gN:card(g).querySelector('[name="acq['+g+'].gN"]').getClientRects().length>0,mW:card(m).querySelector('[name="acq['+m+'].mWeeks"]').getClientRects().length>0,
        gUnit:card(g).querySelector('[name="acq['+g+'].unit"]').getClientRects().length>0,mInG:card(g).querySelector('[name="acq['+g+'].mWeeks"]').getClientRects().length>0,
        out:window.__nbhFactsOut().goals.acq,bip:window.__bipText()};});
    ok("2b the generalization template: type, heading, its fields shown (and not the maintenance ones or the unit)",t.gk==="gen"&&t.gh==="Generalization objective"&&t.gN&&!t.gUnit&&!t.mInG,{gk:t.gk,gh:t.gh,gN:t.gN,gUnit:t.gUnit,mInG:t.mInG});
    ok('2c its sentence: the skill at its criterion in at least 3 settings beyond where it was taught, on consecutive generalization probes',
      /will hand the break card to an adult (?:\(simulated\) )?independently in at least 80% of opportunities in at least 3 settings \(the cafeteria, art and music\) beyond the one where it was taught, across 2 consecutive generalization probes, as measured by generalization probes marked on Form DD-1/.test(t.gs),t.gs);
    ok('2d the maintenance template: on maintenance probes 4 or more weeks after mastery',t.mk==='maint'&&t.mW&&/will continue to hand the break card to an adult (?:\(simulated\) )?independently in at least 80% of opportunities on maintenance probes taken 4 or more weeks after mastery \(mastered [^)]+\), across 2 consecutive probes/.test(t.ms),t.ms);
    const og=t.out.find(a=>a.i===t.g),om=t.out.find(a=>a.i===t.m),oa=t.out.find(a=>a.i===0);
    ok('2e the case carries the type (generalization: across, N, list; maintenance: weeks, mastered); the plain one has none',og&&og.kind==='generalization'&&og.across==='settings'&&og.acrossN==='3'&&/cafeteria/.test(og.acrossList)&&om&&om.kind==='maintenance'&&om.weeks==='4'&&/^\d{4}-/.test(om.mastered)&&oa&&!oa.kind,t.out);
    ok('2f Copy for the BIP carries both sentences',/generalization probes/.test(t.bip)&&/maintenance probes taken 4/.test(t.bip));
    /* the saved file opens with the types */
    const re=await p.evaluate(()=>new Promise(res=>{const o=collect();const inp=document.querySelector('#fileIn');const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(o)],'g.json',{type:'application/json'}));inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));
      setTimeout(()=>res(window.__nbhFactsOut().goals.acq.map(a=>a.kind||'')),500);}));
    ok('2g Open data puts the types back',JSON.stringify(re)===JSON.stringify(['','generalization','maintenance']),re);
    /* the progress report from simulated probes */
    const SK='hand the break card to an adult (simulated)';
    const day=n=>ago(n);
    const byDay=[[30,70],[25,85],[20,90],[15,60],[10,88],[6,92],[3,95]].map(([n,v])=>({date:day(n),vals:{[SK]:v}}));
    const probes=[{date:day(25),kind:'gen',setting:'Cafeteria'},{date:day(15),kind:'gen',setting:'Art'},{date:day(10),kind:'gen',setting:'Art'},{date:day(15),kind:'maint',setting:'Classroom'},{date:day(6),kind:'maint',setting:'Classroom'},{date:day(3),kind:'maint',setting:'Classroom'}];
    const bySetting=[{setting:'Classroom',days:12,behaviors:[{name:SK,mean:84,days:12}]},{setting:'Cafeteria',days:3,behaviors:[{name:SK,mean:82,days:3}]},{setting:'Art',days:2,behaviors:[{name:SK,mean:60,days:2}]}];
    const data={from:day(40),to:day(2),days:20,behaviors:[{name:SK,kind:'replacement',unit:'% of opportunities',direction:'increase',mean:85}],byDay,probes,bySetting};
    const pr=await p.evaluate(([data,lang])=>{window.__nbhFactsIn(Object.assign({data},lang));return window.__gbProgress();},[data,LANG]);
    const pg=pr.find(r=>r.key==='acq'+t.g),pm=pr.find(r=>r.key==='acq'+t.m);
    ok('2h generalization progress from the probes: latest probe in each setting, 2 of 3 settings at the criterion',pg&&/3 generalization probes/.test(pg.level)&&/Cafeteria 85%/.test(pg.level)&&/Art 88%/.test(pg.level)&&/At the criterion in 2 of the 3 settings asked/.test(pg.why)&&pg.src==='Form DD-1, '+SK+' (generalization probes)',pg);
    ok('2i its family sentence reads the probes: in 2 of the 3 places, the places named',pg&&/was able to hand the break card to an adult in 2 of the 3 places this goal asks for \(Cafeteria, Art\) when we checked between/.test(pg.say),pg&&pg.say);
    ok('2j maintenance progress: 3 probes, 2 at the end at the criterion, weeks after mastery counted, Mastered',pm&&/3 maintenance probes/.test(pm.level)&&/after mastery/.test(pm.level)&&pm.code==='Mastered'&&/2 of 3 probes at the criterion; 2 consecutive at the end/.test(pm.why),pm);
    ok('2k its family sentence: at the goal level 2 of 3 times, weeks after learning it',pm&&/when we checked again between .* was at the goal level 2 of 3 times \(the latest \d+ weeks? after learning it\); [^.]* has met this goal\./.test(pm.say),pm&&pm.say);
    const fb=await p.evaluate(([data,lang])=>{const d=Object.assign({},data);delete d.probes;window.__nbhFactsIn(Object.assign({data:d},lang));return window.__gbProgress();},[data,LANG]);
    const fg=fb.find(r=>r.key==='acq'+t.g);
    ok('2l no probe marked: generalization read from DD-1’s means by setting, said so',fg&&/No generalization probe in this period\. DD-1’s means by setting: Classroom 84% \(12 days\), Cafeteria 82% \(3 days\), Art 60% \(2 days\)/.test(fg.level)&&/means by setting/.test(fg.src)&&/Where we take data: Classroom, about 84% of the time/.test(fg.say),fg);
    /* 3. the flag on the progress report */
    await p.evaluate(([data,lang])=>{window.__nbhFactsIn(Object.assign({data},lang));document.querySelector('#viewSeg button[data-view="prog"]').click();},[data,LANG]);await p.waitForTimeout(200);
    const f=await flagScreenPrint(p,'#progOut .nbh-lang-flag','#progOut .gp-say',()=>document.body.classList.add('gb-print-prog'));
    const txt=await p.evaluate(()=>window.__gbProgText());
    ok('3a GB-1: the flag shows on the progress report on screen',f.scr.vis&&FLAG.test(f.scr.text),f);
    ok('3b GB-1: never in print (the family sentences still print), nor in the copied text',!f.pr.vis&&f.pr.disp==='none'&&f.pr.shown&&!/interpreter/i.test(txt),{f,txt:txt.slice(0,200)});
    const e=await p.evaluate(eng=>{document.body.classList.remove('gb-print-prog');window.__nbhFactsIn(eng);gbProgRender();return !!document.querySelector('#progOut .nbh-lang-flag');},ENG);
    ok('3c GB-1: English without an interpreter, no flag',!e);
    await p.close();}

  /* ---------- 3. HD-1 ---------- */
  {const p=await open(br,log,'HD-1_Home-Data-Sheets_v2026-10.html');
    await p.evaluate(async()=>{await loadSim();});await p.waitForTimeout(300);
    const lang0=await p.evaluate(()=>{S.meta.lang='';bindMeta();window.__nbhFactsIn({profile:{language:{home:'Spanish',interpreter:true}}});setView('sheets');return S.meta.lang;});
    ok('3d HD-1: an empty Language at home takes the case’s',lang0==='Spanish (interpreter requested)',lang0);
    const f=await flagScreenPrint(p,'#hdLangFlag','#sheetOut .hs',()=>document.body.classList.add('hd-sheets-only'));
    const sh=await p.evaluate(()=>document.querySelector('#sheetOut').innerText);
    ok('3e HD-1: the flag shows above the home sheets on screen',f.scr.vis&&FLAG.test(f.scr.text),f);
    ok('3f HD-1: never in print (the sheets still print) and not on the sheets themselves',!f.pr.vis&&f.pr.disp==='none'&&f.pr.shown&&!/interpreter/i.test(sh),f);
    const e=await p.evaluate(eng=>{document.body.classList.remove('hd-sheets-only');S.meta.lang='English';bindMeta();window.__nbhFactsIn(eng);renderSheets();return !!document.getElementById('hdLangFlag');},ENG);
    ok('3g HD-1: English without an interpreter, no flag',!e);
    const typed=await p.evaluate(()=>{const el=document.querySelector('[data-m="lang"]');el.value='Haitian Creole';el.dispatchEvent(new Event('input',{bubbles:true}));const f=document.getElementById('hdLangFlag');return f?f.textContent:'';});
    ok('3h HD-1: a home language typed on Setup raises the flag',/Home language: Haitian Creole\./.test(typed),typed);
    await p.close();}

  /* ---------- 3. CT-1 ---------- */
  {const p=await open(br,log,'CT-1_Caregiver-Training_v2026-09.html');
    await p.evaluate(lang=>{window.__nbhFactsIn(lang);},LANG);
    const f=await flagScreenPrint(p,'#ctLangFlag','main.sheet section.only-setup');
    ok('3i CT-1: the flag shows at the top of the caregiver pages on screen',f.scr.vis&&FLAG.test(f.scr.text),f);
    ok('3j CT-1: never in print (the pages still print)',!f.pr.vis&&f.pr.disp==='none'&&f.pr.shown,f);
    const e=await p.evaluate(eng=>{window.__nbhFactsIn(eng);return !!document.getElementById('ctLangFlag');},ENG);
    ok('3k CT-1: English without an interpreter, no flag',!e);
    const tdOnly=await p.evaluate(()=>{window.__nbhFactsIn({plan:{considerations:{language:'Vietnamese',interpreter:true}}});const f=document.getElementById('ctLangFlag');return f?f.textContent:'';});
    ok('3l CT-1: the plan’s considerations (TD-1) when DM-1 holds no language',/Home language: Vietnamese\./.test(tdOnly),tdOnly);
    await p.close();}

  /* ---------- 3 and 4. DD-1 ---------- */
  {const p=await open(br,log,'Daily_Behavior_Data_and_Visual_Analysis.html');
    await p.evaluate(()=>{loadExample();});await p.waitForTimeout(400);
    await p.evaluate(lang=>{window.__nbhFactsIn(lang);ddHomeNote(ddWeekDefault());},LANG);await p.waitForTimeout(200);
    const f=await flagScreenPrint(p,'#dlgHomeNote #hnLang','#dlgHomeNote #hnTx');
    const note=await p.evaluate(()=>document.querySelector('#hnTx').value);
    ok('3m DD-1: the flag shows on the note for home on screen',f.scr.vis&&FLAG.test(f.scr.text),f);
    ok('3n DD-1: never in print, and not in the note’s text (what is copied or printed)',f.pr.disp==='none'&&!/interpreter/i.test(note),{f,note:note.slice(0,120)});
    const pn=await p.evaluate(()=>{document.querySelector('#hnPrint').click();const t=(document.getElementById('ddHnPrint')||{}).innerText||'';document.body.classList.remove('dd-hn-on');return t;});
    ok('3o DD-1: the printed note carries no flag',pn.length>20&&!/interpreter/i.test(pn),pn.slice(0,120));
    const e=await p.evaluate(eng=>{window.__nbhFactsIn(eng);ddHomeNote(ddWeekDefault());const r=!!document.querySelector('#dlgHomeNote #hnLang');document.getElementById('dlgHomeNote').close();return r;},ENG);
    ok('3p DD-1: English without an interpreter, no flag',!e);
    /* 4. the PR-1 decision on the phase line */
    const c=await p.evaluate(()=>{const R=sortedRows(),C=buildConditions();return {start:R[C[1].rowIdx[0]].date,name:C[1].name,n:C.length};});
    const plus=(s,k)=>{const d=new Date(s+'T12:00:00'),st=k<0?-1:1;let n=0;while(n<Math.abs(k)){d.setDate(d.getDate()+st);if(d.getDay()%6)n++;}return iso(d);};
    const near=plus(c.start,2),far=plus(c.start,6),md=s=>(+s.split('-')[1])+'/'+(+s.split('-')[2]);
    const lab=await p.evaluate(log=>{window.__nbhFactsIn({review:{log}});showTab('results');
      return [...document.querySelectorAll('#tab-results svg text.dd-pr1')].map(t=>({t:t.childNodes[0].textContent,d:t.dataset.date,vis:t.getClientRects().length>0}));},
      [{date:far,decision:'continue',decisionText:'Continue (simulated)'},{date:near,decision:'modify',decisionText:'Modify the plan (simulated)'}]);
    ok('4a the phase line of the condition that review started reads "Modified M/D (PR-1)" on screen',lab.length>=1&&lab.every(x=>x.t==='Modified '+md(near)+' (PR-1)'&&x.d===near)&&lab[0].vis,{lab,c,near});
    const leg=await p.evaluate(()=>/the review that started the phase/.test(document.querySelector('#tab-results').innerText));
    ok('4b the legend says what PR-1 on the graph is',leg);
    await p.emulateMedia({media:'print'});
    const prv=await p.evaluate(()=>{const t=document.querySelector('#tab-results svg text.dd-pr1');return !!t&&t.getClientRects().length>0;});
    await p.emulateMedia({media:'screen'});
    ok('4c and in print',prv);
    const no=await p.evaluate(log=>{window.__nbhFactsIn({review:{log}});return document.querySelectorAll('#tab-results svg text.dd-pr1').length;},[{date:far,decision:'modify'}]);
    ok('4d a review 6 school days from the condition’s first day labels nothing',no===0,no);
    const ex=await p.evaluate(log=>{window.__nbhFactsIn({review:{log}});return [...document.querySelectorAll('#tab-results svg text.dd-pr1')].map(t=>t.childNodes[0].textContent);},[{date:plus(c.start,-3),decision:'exit'}]);
    ok('4e 3 school days before it still counts (Exit)',ex.length>=1&&ex[0]==='Exit '+md(plus(c.start,-3))+' (PR-1)',ex);
    await p.close();}

  const errs=log.filter(l=>l.type==='pageerror');
  ok('5 no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
