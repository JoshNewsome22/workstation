/* v21.82 (helper J): Form PR-1's decision log (close a review into a dated log, the next review started with the plan,
   the periods, the rules and the exit sheet kept; the log saved, opened again and printed), its section 4 rows "Social
   validity (SV-1, this period)" and "Contextual fit (CF-1, this period)" filled from the case only while empty, and
   review.log and review.exitReady out; Form SV-1's facts out (sv) and Form CF-1's (fit) from their simulations; and
   tools/new-form.py still building QS-1 from CF-1 without CF-1's own v21.82 block. Simulated students only. */
const {chromium,BASE,ROOT,wire,sleep,fs,path}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
let fails=0;const ok=(name,cond,info)=>{console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?' :: '+(typeof info==='string'?info:JSON.stringify(info)).slice(0,500):''));if(!cond)fails++;};
const OUT=path.join(__dirname,'out','v2182-j');fs.mkdirSync(OUT,{recursive:true});
const ISO=/^\d{4}-\d{2}-\d{2}$/;
(async()=>{
  const br=await chromium.launch();const log=[];
  const open=async(file,url)=>{const page=await br.newPage({viewport:{width:1280,height:900}});wire(page,log);await page.goto(url||BASE+'/NBH-Workstation/'+file);await sleep(600);
    await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)window.nbhUI.confirm=async()=>true;});return page;};
  const sim=async p=>{await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);};
  const save=p=>p.evaluate(async()=>{let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:caught';};HTMLAnchorElement.prototype.click=function(){};
    try{document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,200));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}return got?await got.text():null;});

  /* ---- SV-1 ---- */
  let sv=null;
  {const p=await open('SV-1_Social-Validity_v2026-09.html');
    const o0=await p.evaluate(()=>window.__nbhFactsOut());
    ok('SV-1 out holds no sv on a blank form',!o0||!o0.sv,o0);
    ok('SV-1 the instruction says PR-1 fills automatically in the workstation',await p.evaluate(()=>/fills automatically from this form while it is empty/.test(document.body.innerHTML)&&!/into PR-1 section 4 \(the row/.test(document.body.innerHTML)));
    await sim(p);
    const o=await p.evaluate(()=>window.__nbhFactsOut());sv=o&&o.sv;
    const rd=r=>r&&typeof r.mean==='number'&&r.mean>=1&&r.mean<=6&&Number.isInteger(r.n)&&r.n>0&&ISO.test(r.date);
    ok('SV-1 sv.pre and sv.post {mean, n, date}',sv&&rd(sv.pre)&&rd(sv.post)&&sv.post.date>sv.pre.date,sv);
    ok('SV-1 sv.scale, sv.form, sv.flagged (item texts)',sv&&sv.scale==='1-6'&&sv.form==='SV-1'&&Array.isArray(sv.flagged)&&sv.flagged.every(t=>typeof t==='string'&&t.length>10),sv&&sv.flagged);
    /* the flagged items are the ones the Summary sheet flags: one rated at or below the threshold */
    const fl=await p.evaluate(()=>{S.rat.post[key('G1',0)]='2';renderAll();return window.__nbhFactsOut().sv.flagged;});
    ok('SV-1 an item rated 2 is flagged',fl.some(t=>/behavior this plan is meant to reduce/.test(t)),fl);
    ok('SV-1 the cut PR-1 reads (4.5)',sv&&sv.cut===4.5,sv&&sv.cut);
    await p.close();}

  /* ---- CF-1 ---- */
  let fit=null;
  {const p=await open('CF-1_Contextual-Fit-Assessment_v2026-09.html');
    const o0=await p.evaluate(()=>window.__nbhFactsOut());
    ok('CF-1 out holds no fit on a blank form',!o0||!o0.fit,o0);
    await sim(p);
    const o=await p.evaluate(()=>window.__nbhFactsOut());fit=o&&o.fit;
    ok('CF-1 fit {mean, scale, date, low}',fit&&typeof fit.mean==='number'&&fit.mean>=1&&fit.mean<=6&&fit.scale==='1-6'&&ISO.test(fit.date)&&Array.isArray(fit.low),fit);
    ok('CF-1 the simulation: round 2 from the re-administration date',fit&&fit.round===2&&fit.respondents===4,fit);
    const lo=await p.evaluate(()=>{S.round=2;S.scores[2][k(0,0)]='2';renderAll();return window.__nbhFactsOut().fit;});
    ok('CF-1 an item rated 2 is in fit.low',lo.low.some(t=>/describe what this plan asks me to do/.test(t)),lo.low);
    const ti=await p.evaluate(()=>{const e=document.querySelector('[data-m="ti"]');e.value='';S.meta.ti='';return window.__nbhFactsIn({integrity:{obs:[{date:'2026-10-01',pct:92,type:'Unannounced'}],overall:92}});});
    ok('CF-1 its v21.78 facts in still works',ti&&ti.filled>=1,ti);
    await p.close();}

  /* ---- PR-1 ---- */
  {const p=await open('PR-1_Periodic-Plan-Review_v2026-09.html');
    ok('PR-1 the two section 4 rows exist',await p.evaluate(()=>{const a=document.querySelector('.only-dec [data-m="svLine"]'),b=document.querySelector('.only-dec [data-m="fitLine"]');
      return !!a&&!!b&&/Social validity \(SV-1, this period\)/.test(a.closest('tr').textContent)&&/Contextual fit \(CF-1, this period\)/.test(b.closest('tr').textContent);}));
    await sim(p);
    const cf0=await p.evaluate(()=>S.meta.cf||'');
    const f={src:{},sv,fit};
    const r1=await p.evaluate(f=>window.__nbhFactsIn(f),f);
    const st1=await p.evaluate(()=>({sv:S.meta.svLine,fit:S.meta.fitLine,svEl:document.querySelector('[data-m="svLine"]').value,cf:S.meta.cf||''}));
    ok('PR-1 the social validity row is written from f.sv',/^Form SV-1, scale 1-6: Post mean \d\.\d\d \(4 respondents, \d+\/\d+\/\d{4}\); Pre mean/.test(st1.sv)&&st1.svEl===st1.sv,st1.sv);
    ok('PR-1 the contextual fit row is written from f.fit',/^Form CF-1, scale 1-6: mean \d\.\d\d \(Strong fit\), \d+\/\d+\/\d{4}\./.test(st1.fit),st1.fit);
    ok('PR-1 facts in reports what it filled',r1&&r1.filled>=2&&/SV-1 and CF-1/.test(r1.note),r1);
    ok('PR-1 "Contextual fit, if measured" kept when already entered',cf0?st1.cf===cf0:/^\d/.test(st1.cf),{cf0,cf:st1.cf});
    /* typed entries stay */
    const st2=await p.evaluate(f=>{S.meta.svLine='Typed by the BCBA';S.meta.fitLine='Typed fit';renderAll();const g=JSON.parse(JSON.stringify(f));g.sv.post.mean=2.1;g.fit.mean=2.2;
      window.__nbhFactsIn(g);return {sv:S.meta.svLine,fit:S.meta.fitLine,el:document.querySelector('[data-m="svLine"]').value};},f);
    ok('PR-1 typed rows are not overwritten',st2.sv==='Typed by the BCBA'&&st2.fit==='Typed fit'&&st2.el==='Typed by the BCBA',st2);
    /* exitReady */
    const ex=await p.evaluate(f=>{window.__nbhFactsIn(f);const a=window.__nbhFactsOut().review.exitReady;
      const g=JSON.parse(JSON.stringify(f));g.sv.post.mean=4.0;g.fit.mean=3.5;window.__nbhFactsIn(g);const b=window.__nbhFactsOut().review.exitReady;
      const h=JSON.parse(JSON.stringify(f));delete h.sv;window.__nbhFactsIn(h);const c=window.__nbhFactsOut().review.exitReady;
      const keep={m:Object.assign({},S.meta),r:Object.assign({},S.ready)};
      window.__nbhFactsIn(f);READY.forEach((_,i)=>S.ready[i]=true);['xBeh','xRep','xSched','xInt','xGen','nat','watch','back','post'].forEach(k=>{if(!String(S.meta[k]||'').trim())S.meta[k]='Written';});renderAll();
      const d=window.__nbhFactsOut().review.exitReady,txt=document.querySelector('#prExit82').textContent;S.meta=keep.m;S.ready=keep.r;renderAll();return {a,b,c,d,txt};},f);
    ok('PR-1 exitReady {ok, missing} with the simulation: open conditions named, social validity and fit met',ex.a&&ex.a.ok===false&&Array.isArray(ex.a.missing)&&ex.a.missing.length>0&&!ex.a.missing.some(x=>/social validity|contextual fit/.test(x)),ex.a);
    ok('PR-1 exitReady counts a post mean below 4.5 and a fit below 4',ex.b.missing.some(x=>/social validity: SV-1 post mean 4\.00 is below 4\.5/.test(x))&&ex.b.missing.some(x=>/contextual fit: CF-1 mean 3\.50 is below 4/.test(x)),ex.b.missing);
    ok('PR-1 exitReady counts no post round',ex.c.missing.some(x=>/no post round/.test(x)),ex.c.missing);
    ok('PR-1 exitReady ok with every condition met',ex.d.ok===true&&ex.d.missing.length===0&&/both met/.test(ex.txt),ex);
    /* close the review */
    await p.evaluate(f=>{S.meta.svLine='';S.meta.fitLine='';renderAll();window.__nbhFactsIn(f);},f);
    const before=await p.evaluate(()=>({m:JSON.parse(JSON.stringify(S.meta)),rows:JSON.stringify(S.rows),fade:JSON.stringify(S.fade),ready:JSON.stringify(S.ready),act:S.act.filter(a=>a.a).length,open:S.act.filter(a=>a.a&&!/^(Done|Not doing)$/.test(a.s)).length}));
    await p.evaluate(()=>document.querySelector('#prCloseRev').click());await sleep(500);
    const a1=await p.evaluate(()=>({log:JSON.parse(JSON.stringify(S.log)),m:JSON.parse(JSON.stringify(S.meta)),rows:JSON.stringify(S.rows),fade:JSON.stringify(S.fade),ready:JSON.stringify(S.ready),
      act:S.act.filter(a=>a.a).length,msg:document.querySelector('#prCloseMsg').textContent,tr:document.querySelectorAll('#prLogTbl tbody tr').length,tt:document.querySelector('#prLogTbl').textContent,
      dateEl:document.querySelector('[data-m="date"]').value,decEl:document.querySelector('[data-m="dec"]').value,out:window.__nbhFactsOut().review}));
    const e=a1.log[0]||{},iso=t=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(t);return m?(m[3].length===2?'20'+m[3]:m[3])+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0'):t;};
    ok('PR-1 close: one log entry with the review',a1.log.length===1&&e.date===iso(before.m.date)&&e.decision==='continue'&&e.decisionText===before.m.dec&&e.next===iso(before.m.next),e);
    ok('PR-1 close: the entry carries data, integrity, social validity, fit and actions',/baseline/.test(e.data)&&/%/.test(e.integrity)&&e.sv===before.m.svLine&&e.fit===before.m.fitLine&&e.actions&&e.actions.length>10,e);
    ok('PR-1 close: the review\'s own entries are cleared',!a1.m.dec&&!a1.m.decWhy&&!a1.m.decWhat&&!a1.m.svLine&&!a1.m.fitLine&&!a1.m.intPct&&!a1.m.next&&!a1.m.period&&a1.decEl==='',{dec:a1.m.dec,why:a1.m.decWhy,what:a1.m.decWhat,sv:a1.m.svLine,fit:a1.m.fitLine,int:a1.m.intPct,next:a1.m.next,period:a1.m.period,decEl:a1.decEl});
    ok('PR-1 close: the review date moves to the next review date and the number goes up',a1.m.date===before.m.next&&a1.dateEl===before.m.next&&(!before.m.revNo||+a1.m.revNo===+before.m.revNo+1),{d:a1.m.date,n:a1.m.revNo,was:before.m.revNo});
    ok('PR-1 close: the plan, the periods, the exit sheet and the rules are kept',a1.m.plan===before.m.plan&&a1.m.client===before.m.client&&a1.m.xBeh===before.m.xBeh&&a1.m.post===before.m.post&&a1.m.back===before.m.back&&a1.rows===before.rows&&a1.fade===before.fade&&a1.ready===before.ready,{plan:a1.m.plan});
    ok('PR-1 close: open actions carried, done ones gone',a1.act===before.open,{was:before.act,open:before.open,now:a1.act});
    ok('PR-1 close: the log table shows the review',a1.tr===1&&a1.tt.indexOf(before.m.dec)>=0,a1.tt.slice(0,200));
    ok('PR-1 close: out review.log (oldest first) and the last decision while the next is undecided',a1.out.log.length===1&&a1.out.log[0].date===e.date&&a1.out.date===e.date&&a1.out.decision==='continue'&&a1.out.upcoming===iso(before.m.next)&&a1.out.rules&&a1.out.exitReady,a1.out);
    const rf=await p.evaluate(f=>{window.__nbhFactsIn(f);const a={sv:S.meta.svLine||'',fit:S.meta.fitLine||'',cf:S.meta.cf||''};
      const g=JSON.parse(JSON.stringify(f));g.sv.post.date='2026-12-01';g.sv.post.mean=5.4;window.__nbhFactsIn(g);return {a,b:{sv:S.meta.svLine||'',fit:S.meta.fitLine||''}};},f);
    ok('PR-1 after the close, the case lines already logged are not written again; a new SV-1 round is',rf.a.sv===''&&rf.a.fit===''&&rf.a.cf===''&&/Post mean 5\.40/.test(rf.b.sv)&&rf.b.fit==='',rf);
    /* a second review, then the order */
    await p.evaluate(()=>{const set=(k,v)=>{const el=document.querySelector('[data-m="'+k+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
      set('dec','Modify the plan');set('decWhy','Simulated: the replacement is not used with substitutes.');set('next','12/18/2026');set('intPct','88');});
    await p.evaluate(()=>document.querySelector('#prCloseRev').click());await sleep(500);
    const a2=await p.evaluate(()=>({n:S.log.length,first:document.querySelector('#prLogTbl tbody tr').textContent,out:window.__nbhFactsOut().review.log.map(x=>x.decision),date:S.meta.date}));
    ok('PR-1 a second close: two entries, newest first in the table, oldest first out',a2.n===2&&/Modify the plan/.test(a2.first)&&a2.out.join()==='continue,modify'&&a2.date==='12/18/2026',a2);
    /* save, clear, open */
    const saved=await save(p);const sj=saved&&JSON.parse(saved);
    ok('PR-1 Save writes the log',sj&&sj.form==='PR-1'&&Array.isArray(sj.S.log)&&sj.S.log.length===2&&sj.S.log[1].decision==='modify',sj&&sj.S&&sj.S.log);
    await p.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(400);
    ok('PR-1 Clear empties the log',await p.evaluate(()=>(S.log||[]).length===0&&document.querySelector('#prLogSec').classList.contains('pr-logempty')));
    const fp=path.join(OUT,'PR-1_saved.json');fs.writeFileSync(fp,saved);
    await p.setInputFiles('#fileIn',fp);await sleep(800);
    const rt=await p.evaluate(()=>({log:JSON.parse(JSON.stringify(S.log)),tr:document.querySelectorAll('#prLogTbl tbody tr').length,out:window.__nbhFactsOut().review}));
    ok('PR-1 Open puts the log back, field for field',JSON.stringify(rt.log)===JSON.stringify(sj.S.log)&&rt.tr===2&&rt.out.log.length===2,rt.log);
    /* a bad log in a file is read part by part */
    const bad=await p.evaluate(()=>{const s=fromFile({form:'PR-1',S:{meta:{},log:[{date:'2026-09-01',decision:'continue',x:{}},'junk',{decision:'exit'},{date:'2026-09-20',data:{a:1},next:'2026-10-01'}]}});return s.log;});
    ok('PR-1 a log entry without a date or of the wrong shape is dropped',bad.length===2&&bad[1].decision===''&&!('data' in bad[1])&&bad[1].next==='2026-10-01',bad);
    /* printed */
    await p.emulateMedia({media:'print'});
    const pr=await p.evaluate(()=>{const v=el=>getComputedStyle(el).display!=='none';const s=document.querySelector('#prLogSec');
      const a={log:v(s),rows:document.querySelectorAll('#prLogTbl tbody tr').length,setup:v(document.querySelector('section.only-setup')),btn:v(document.querySelector('#prCloseRev').closest('.pr-closebar'))};
      document.documentElement.classList.add('pr-printlog');const b={log:v(s),setup:v(document.querySelector('section.only-setup')),dec:v(document.querySelector('section.only-dec:not(#prLogSec)')),head:v(document.querySelector('.nbh-print-head'))};
      document.documentElement.classList.remove('pr-printlog');return {a,b};});
    ok('PR-1 printed: the log section prints with the form, the close bar does not',pr.a.log&&pr.a.rows===2&&pr.a.setup&&!pr.a.btn,pr.a);
    ok('PR-1 "Print the log" prints the log alone under the letterhead',pr.b.log&&!pr.b.setup&&!pr.b.dec&&pr.b.head,pr.b);
    const pdf=await p.pdf({format:'Letter'});fs.writeFileSync(path.join(OUT,'PR-1_print.pdf'),pdf);
    ok('PR-1 the print renders',pdf.length>20000,pdf.length);
    await p.evaluate(()=>{S=blank();renderAll();});
    ok('PR-1 an empty log is not printed',await p.evaluate(()=>getComputedStyle(document.querySelector('#prLogSec')).display==='none'));
    await p.emulateMedia({media:'screen'});
    ok('PR-1 blank form out stays null',await p.evaluate(()=>window.__nbhFactsOut()===null));
    await p.close();}

  /* ---- PR-1 inside the workstation ---- */
  {const p=await open('',BASE+'/NBH-Workstation/index.html');
    await p.evaluate(()=>openForm('PR-1'));await p.waitForFunction(()=>!!state.status['PR-1'],null,{timeout:20000});await sleep(800);
    const fr=p.frames().find(x=>/PR-1/.test(x.url()));
    const r=await fr.evaluate(f=>{const r=window.__nbhFactsIn(f);return {r,sv:S.meta.svLine,fit:S.meta.fitLine};},{src:{},sv,fit});
    ok('PR-1 in the workstation: the rows fill from the case',/^Form SV-1/.test(r.sv)&&/^Form CF-1/.test(r.fit),r);
    await p.close();}

  /* ---- new-form.py: QS-1 from CF-1 without CF-1's own block ---- */
  {const q=path.join(OUT,'QS-1_Staff-Quick-Start_v2026-10.html');
    execFileSync('python3',[path.join(ROOT,'tools','new-form.py'),path.join(ROOT,'NBH-Workstation','CF-1_Contextual-Fit-Assessment_v2026-09.html'),path.join(ROOT,'tools','forms','QS-1'),q]);
    const src=fs.readFileSync(q,'utf8');
    ok('new-form.py: CF-1\'s v21.82 block does not reach QS-1',!/cf-v2182|v21\.82|o\.fit=fit/.test(src));
    execFileSync('python3',[path.join(ROOT,'tools','polish-one.py'),q]);
    const errs0=log.filter(x=>x.type==='pageerror').length;
    const p=await open('',BASE+'/qa/out/v2182-j/QS-1_Staff-Quick-Start_v2026-10.html');
    const o=await p.evaluate(()=>({form:document.title,out:typeof window.__nbhFactsOut,fin:typeof window.__nbhFactsIn,btn:!!document.querySelector('#simBtn,#printBtn')}));
    ok('new-form.py: the QS-1 built loads and works, with its own facts hooks',/QS-1/.test(o.form)&&o.out==='function'&&o.btn&&log.filter(x=>x.type==='pageerror').length===errs0,o);
    const out=await p.evaluate(()=>{try{return window.__nbhFactsOut();}catch(e){return 'error '+e;}});
    ok('new-form.py: the QS-1 built has no fit key',!out||typeof out!=='object'||!('fit' in out),out);
    await p.close();}

  const pe=log.filter(x=>x.type==='pageerror');
  ok('no page errors',pe.length===0,pe);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
