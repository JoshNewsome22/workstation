/* v21.80 (helper F): Form PA-1's "Next reassessment due" (typed, or set from the schedule and the latest dated session),
   saved and opened again, and its case facts out (prefs beside the unchanged menu); Form PR-1 reading Form DD-1's assent
   and probes from a simulated case: the assent line and its caution, the maintenance probes since the exit and whether
   one is due, and nothing typed overwritten. Simulated students only. */
const {chromium,BASE,wire,sleep,fs,path}=require(__dirname+'/lib.js');
let fails=0;const ok=(name,cond,info)=>{console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?' :: '+(typeof info==='string'?info:JSON.stringify(info)).slice(0,400):''));if(!cond)fails++;};
(async()=>{
  const br=await chromium.launch();const log=[];
  const open=async(file)=>{const page=await br.newPage({viewport:{width:1280,height:900}});wire(page,log);await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(500);
    await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});return page;};
  const set=(p,sel,v)=>p.evaluate(([sel,v])=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);

  /* ---- PA-1 ---- */
  {const p=await open('PA-1_Preference-Assessment-Protocol_v2026-09.html');
    ok('PA-1 out is null on a blank form',await p.evaluate(()=>window.__nbhFactsOut()===null));
    ok('PA-1 the date field sits beside the schedule',await p.evaluate(()=>{const d=document.querySelector('#mReassessDue'),s=document.querySelector('#mReassess');return !!d&&d.type==='date'&&d.dataset.meta==='reassessDue'&&s.parentNode.parentNode===d.closest('.f').parentNode;}));
    await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
    const before=await p.evaluate(()=>window.__nbhFactsOut());
    ok('PA-1 simulated: a menu out',before&&Array.isArray(before.menu)&&before.menu.length>0,before&&before.menu&&before.menu.length);
    /* a known schedule and session: Brief MSWO weekly, every other date cleared, the MSWO sheet dated 9/14/2026 */
    await p.evaluate(()=>{document.querySelectorAll('[data-meta$="Date"],[data-meta="date"],[data-meta="reassessDue"]').forEach(e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
      document.querySelectorAll('#stabTbl input[data-f="date"],#ecoObsTbl input[data-f="date"]').forEach(e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});});
    await set(p,'#mReassess','Brief MSWO weekly');await set(p,'[data-meta="msDate"]','9/14/2026');await sleep(200);
    const h1=await p.evaluate(()=>({hint:document.querySelector('#mReassessHint').textContent,dis:document.querySelector('#mReassessSet').disabled,val:document.querySelector('#mReassessDue').value}));
    ok('PA-1 with the date empty, the hint offers the date from the schedule (weekly from 9/14)',/9\/21\/2026/.test(h1.hint)&&/9\/14\/2026/.test(h1.hint)&&!h1.dis&&h1.val==='',h1);
    const o0=await p.evaluate(()=>window.__nbhFactsOut().prefs);
    ok('PA-1 out before the date is set: reassess worked out from the schedule',o0&&o0.reassess==='2026-09-21'&&o0.reassessFrom==='schedule'&&o0.last==='2026-09-14',o0);
    await p.evaluate(()=>document.querySelector('#mReassessSet').click());await sleep(200);
    const v=await p.evaluate(()=>document.querySelector('#mReassessDue').value);
    ok('PA-1 Set from the schedule writes 2026-09-21',v==='2026-09-21',v);
    const out=await p.evaluate(()=>window.__nbhFactsOut());
    ok('PA-1 out.prefs shape',out.prefs&&out.prefs.reassess==='2026-09-21'&&out.prefs.last==='2026-09-14'&&out.prefs.schedule==='Brief MSWO weekly'&&out.prefs.reassessFrom==='typed',out.prefs);
    ok('PA-1 out.menu unchanged',JSON.stringify(out.menu)===JSON.stringify(before.menu));
    const hint2=await p.evaluate(()=>document.querySelector('#mReassessHint').textContent);
    ok('PA-1 a past due date reads as overdue',/Overdue by \d+ days/.test(hint2),hint2);
    /* other schedules */
    const sch=await p.evaluate(async()=>{const r={};const s=document.querySelector('#mReassess'),d=document.querySelector('#mReassessDue');d.value='';d.dispatchEvent(new Event('input',{bubbles:true}));
      for(const t of ['Full assessment monthly','Full assessment each grading period','Brief MSWO daily before sessions (edibles)','When treatment data flatten or plan changes']){s.value=t;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));r[t]=window.__nbhFactsOut().prefs.reassess||'';}
      s.value='Brief MSWO weekly';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));return r;});
    ok('PA-1 monthly, grading period (63 days), daily, and no period',sch['Full assessment monthly']==='2026-10-14'&&sch['Full assessment each grading period']==='2026-11-16'&&sch['Brief MSWO daily before sessions (edibles)']==='2026-09-15'&&sch['When treatment data flatten or plan changes']==='',sch);
    /* a later brief-MSWO log date counts as the latest session */
    const later=await p.evaluate(()=>{const e=document.querySelector('#stabTbl input[data-f="date"]');e.value='2026-10-01';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return window.__nbhFactsOut().prefs;});
    ok('PA-1 a dated brief-MSWO log row is the latest session',later.last==='2026-10-01'&&later.reassess==='2026-10-08',later);
    /* typed date wins; saved and opened again */
    await set(p,'#mReassessDue','2026-11-02');
    const saved=await p.evaluate(async()=>{let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:caught';};HTMLAnchorElement.prototype.click=function(){};
      try{document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,200));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}return got?await got.text():null;});
    const sj=saved&&JSON.parse(saved);
    ok('PA-1 Save writes the date',sj&&sj.meta&&sj.meta.reassessDue==='2026-11-02',sj&&sj.meta&&sj.meta.reassessDue);
    await p.evaluate(()=>{window.nbhUI&&(window.nbhUI.confirm=async()=>true);document.querySelector('#clearBtn').click();});await sleep(400);
    ok('PA-1 cleared: the date is empty',await p.evaluate(()=>document.querySelector('#mReassessDue').value===''));
    const fp=path.join(__dirname,'out','v2180-f','PA-1_saved.json');fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,saved);
    await p.setInputFiles('#fileIn',fp);await sleep(800);
    const rt=await p.evaluate(()=>({v:document.querySelector('#mReassessDue').value,o:window.__nbhFactsOut().prefs,h:document.querySelector('#mReassessHint').textContent}));
    ok('PA-1 Open puts the date back, and out reads it',rt.v==='2026-11-02'&&rt.o.reassess==='2026-11-02'&&rt.o.reassessFrom==='typed'&&rt.o.schedule==='Brief MSWO weekly',rt);
    const snap=await p.evaluate(()=>{const s=window.nbhBridge.snapshot();return s.data['#mReassessDue'];});
    ok('PA-1 the workstation snapshot carries the date',snap==='2026-11-02',snap);
    await p.close();}

  /* ---- PR-1 ---- */
  {const p=await open('PR-1_Periodic-Plan-Review_v2026-09.html');
    const facts={src:{},data:{from:'2026-09-01',to:'2026-10-09',days:24,conds:[],behaviors:[],incidentList:[],
      assent:{days:24,refused:3,withdrew:2,last10:{days:10,refused:2,withdrew:1},list:[{date:'2026-10-01',mark:'refused'},{date:'2026-10-03',mark:'assent'},{date:'2026-10-06',mark:'withdrew'},{date:'2026-10-08',mark:'refused'}]}},
      probes:[{date:'2026-08-20',kind:'maint',setting:'Before exit'},{date:'2026-09-20',kind:'maint',setting:'Lunchroom'},{date:'2026-09-25',kind:'gen',setting:'Art room'}]};
    /* typed entries first: they must stay */
    await p.evaluate(()=>{S.meta.alsoCase='Typed by the BCBA';S.meta.post='Checked every 2 weeks for a term';S.meta.dec='Exit the plan';S.meta.date='2026-09-01';renderAll();});
    const r1=await p.evaluate(f=>window.__nbhFactsIn(f),facts);
    const st1=await p.evaluate(()=>({also:S.meta.alsoCase,post:S.meta.post,alsoEl:document.querySelector('[data-m="alsoCase"]').value,a:document.querySelector('#prAssent'),
      at:document.querySelector('#prAssent').textContent,ah:document.querySelector('#prAssent').hidden,caut:!!document.querySelector('#prAssent .verdict'),pt:document.querySelector('#prProbes').textContent,ph:document.querySelector('#prProbes').hidden}));
    ok('PR-1 typed entries are not overwritten',st1.also==='Typed by the BCBA'&&st1.alsoEl==='Typed by the BCBA'&&st1.post==='Checked every 2 weeks for a term',st1);
    ok('PR-1 In still returns its report',r1===null||typeof r1==='object',r1);
    ok('PR-1 assent line shown',!st1.ah&&/Assent \(Form DD-1\): refused on 2 and withdrew on 1 of the last 10 days marked\./.test(st1.at),st1.at);
    ok('PR-1 caution with 3 of the last 10',st1.caut&&/withdrawn or refused on 3 of the last 10/.test(st1.at),st1.at);
    ok('PR-1 assent marks listed (not the assent day)',/refused 10\/1/.test(st1.at)&&/withdrew 10\/6/.test(st1.at)&&!/assent 10\/3/.test(st1.at),st1.at);
    ok('PR-1 probes since the exit: the lunchroom probe, not the one before the exit; the generalization probe noted',!st1.ph&&/Since the exit on 9\/1/.test(st1.pt)&&/1 maintenance probe, 9\/20 \(Lunchroom\)/.test(st1.pt)&&!/Before exit/.test(st1.pt)&&/Art room/.test(st1.pt),st1.pt);
    ok('PR-1 a probe is due (every 2 weeks from 9/20: 10/4)',/A maintenance probe is due/.test(st1.pt)&&/10\/4/.test(st1.pt),st1.pt);
    /* not due yet: a later probe */
    const nd=await p.evaluate(f=>{f=JSON.parse(JSON.stringify(f));const t=new Date();const iso=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');f.probes.push({date:iso,kind:'maint',setting:'Classroom'});window.__nbhFactsIn(f);return document.querySelector('#prProbes').textContent;},facts);
    ok('PR-1 a probe today: next one due later',/Next maintenance probe due/.test(nd)&&/2 maintenance probes/.test(nd),nd);
    /* below the caution */
    const lo=await p.evaluate(f=>{f=JSON.parse(JSON.stringify(f));f.data.assent.last10={days:10,refused:1,withdrew:1};window.__nbhFactsIn(f);return {t:document.querySelector('#prAssent').textContent,c:!!document.querySelector('#prAssent .verdict')};},facts);
    ok('PR-1 no caution at 2 of the last 10',!lo.c&&/refused on 1 and withdrew on 1/.test(lo.t),lo);
    /* the empty field is written from the case, with the assent line */
    const e1=await p.evaluate(f=>{S.meta.alsoCase='';S.meta.alsoCaseWas='';renderAll();const r=window.__nbhFactsIn(f);return {r,also:S.meta.alsoCase,el:document.querySelector('[data-m="alsoCase"]').value,post:S.meta.post,noprint:document.querySelector('#prAssent p').classList.contains('noprint')};},facts);
    ok('PR-1 the empty "Also in the review period" is written, with the assent line',/Assent \(Form DD-1\): refused on 2/.test(e1.also)&&e1.el===e1.also&&e1.r&&e1.r.filled>=1,e1);
    ok('PR-1 the line is not printed twice',e1.noprint,e1.noprint);
    ok('PR-1 monitoring schedule untouched',e1.post==='Checked every 2 weeks for a term',e1.post);
    /* no exit on this review */
    const ne=await p.evaluate(f=>{S.meta.dec='Continue unchanged';renderAll();window.__nbhFactsIn(f);return document.querySelector('#prProbes').textContent;},facts);
    ok('PR-1 no exit: probes counted, none called due',/No exit recorded/.test(ne)&&/2 maintenance, 1 generalization/.test(ne)&&!/is due/.test(ne),ne);
    /* a case without the new parts hides both, and out is still the review */
    const none=await p.evaluate(()=>{window.__nbhFactsIn({src:{},data:{from:'2026-09-01',to:'2026-10-09',days:5,conds:[],behaviors:[],incidentList:[]}});return {a:document.querySelector('#prAssent').hidden,p:document.querySelector('#prProbes').hidden,o:window.__nbhFactsOut()};});
    ok('PR-1 without assent or probes both are hidden; out still the review',none.a&&none.p&&none.o&&none.o.review&&none.o.review.decision==='continue',none);
    await p.close();}

  const errs=log.filter(l=>l.type==='pageerror');
  ok('no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
