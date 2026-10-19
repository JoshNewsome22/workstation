/* Form SV-1, review Wave 3 part 1: what the case is told is what the form decides (F218), the consumers the verdict needs (F219),
   the team copy (F220), the goals on their latest round (F221), an earlier "agree" that holds only while the data agree (F222),
   PR-1's sign and the case in (F224), the goals round to TB-1 (F225), the post rounds kept (F226), the student's paired items
   (F227). Simulated data only. usage: node qa/sv1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const SV='SV-1_Social-Validity_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html',TB='TB-1_Target-Behavior-Development_v2026-09.html',CF='CF-1_Contextual-Fit-Assessment_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(SV);
  /* a record built in the page: rows [name, role, anon], every item rated v (a number or a function of the respondent) in the rounds given */
  await p.evaluate(()=>{window.__mk=(rows,rate,o)=>{o=o||{};S=blank();S.meta=Object.assign({client:'Mateo Rivera',nick:'Mateo'},o.meta||{});S.chk=Object.assign({},o.chk||{});
    S.resp=rows.map(([name,role,anon])=>Object.assign(newResp(),{name,role,anon:anon||'Yes'}));
    (o.rounds||['pre','post']).forEach(rd=>ITEMS.forEach(x=>{if(!SECS[x.s].rounds.includes(rd))return;S.resp.forEach((r,i)=>{if(!applies(x,r.role))return;const v=typeof rate==='function'?rate(r,x,rd):rate;if(v!=null)S.rat[rd][key(x.id,i)]=String(x.rev?7-v:v);   /* E5 is reverse-scored: rated so that its scored value is v */});}));
    if(o.hist)S.hist=o.hist;renderAll();return verdict();};});
  /* ---------- the simulation ---------- */
  const sim=await p.evaluate(async()=>{await loadSim();const V=verdict(),o=window.__nbhFactsOut().sv;
    return {label:V.label,posts:postCount(),hist:$$('#histTbl tbody tr').length,cur:!!document.querySelector('#histTbl tr.cur'),conc:$('#concord').textContent,read:$('#prChgRead').textContent,sv:o,ind:S.meta.pr_indep};});
  ok('1 the simulation: the change as PR-1 prints it (-38%, 38% below baseline, an improvement), PR-1’s own answer on independent use, the first post round kept, two post rounds counted',
    /PR-1 change -38%, 38% below baseline, E1 mean/.test(sim.conc)&&/an improvement/.test(sim.read)&&sim.ind==='Yes, across settings and people'&&sim.posts===2&&sim.hist===2&&sim.cur,sim);
  ok('2 F218 the case is told what the form decides: ok, the role means, the effects, the lowest consumer mean, the rounds counted',
    sim.sv&&sim.sv.ok===(sim.label==='Socially valid')&&sim.sv.roles&&['student','caregiver','implementer'].every(k=>typeof sim.sv.roles[k]==='number')&&typeof sim.sv.effects==='number'&&sim.sv.minConsumer===Math.min(sim.sv.roles.student,sim.sv.roles.caregiver)&&sim.sv.posts===2&&sim.sv.post&&typeof sim.sv.post.mean==='number',sim.sv);
  /* F218 the reproduction: staff 6, caregiver 3, student 2 */
  const r218=await p.evaluate(()=>{const V=__mk([['T','Teacher (implementer)'],['P','Paraprofessional (implementer)'],['C','Caregiver'],['St','Student']],(r)=>STU(r.role)?2:r.role==='Caregiver'?3:6,
    {meta:{pr_change:'-38',pr_indep:'Yes, across settings and people',post_n:'2'},chk:{post_opt:true,post_coer:true,post_anon:true,post_open:true}});return {label:V.label,sv:window.__nbhFactsOut().sv};});
  const pr=await open(PR);
  const ex=await pr.evaluate(async sv=>{await loadSim();S.meta.svLine='';S.log=[];renderAll();window.__nbhFactsIn({src:{},sv});const a=window.__nbhFactsOut().review.exitReady,line=S.meta.svLine;
    const g=JSON.parse(JSON.stringify(sv));g.ok=true;g.label='Socially valid';window.__nbhFactsIn({src:{},sv:g});const b=window.__nbhFactsOut().review.exitReady;return {a,b,line,txt:document.querySelector('#prExit82').textContent};},r218.sv);
  ok('3 F218 staff 6, caregiver 3, student 2: SV-1 says "Acceptability concern", and PR-1 no longer calls social validity met at exit; it names the verdict and the lowest consumer mean',
    r218.label==='Acceptability concern'&&r218.sv.ok===false&&r218.sv.post.mean>=4.5&&ex.a.missing.some(x=>/social validity: Form SV-1 reads “Acceptability concern” \(the lowest of the student’s and the caregiver’s means is 2\.00, below 4\.5\)/.test(x))&&
    !ex.b.missing.some(x=>/social validity/.test(x)),{label:r218.label,ok:r218.sv.ok,post:r218.sv.post,a:ex.a.missing,b:ex.b.missing});
  ok('4 F218 PR-1’s social validity row gives the means by role',/By role \(post\): student 2\.00, caregiver 3\.00, implementers 6\.00\. Acceptability concern\./.test(ex.line),ex.line);
  /* ---------- F219 ---------- */
  const r219=await p.evaluate(()=>{const all={meta:{pr_change:'-38',pr_indep:'Yes, across settings and people',post_n:'2'},chk:{pre_opt:true,pre_coer:true,pre_anon:true,pre_open:true,post_opt:true,post_coer:true,post_anon:true,post_open:true}};
    const a=__mk([['T','Teacher (implementer)'],['A','Administrator'],['R','Related-service provider']],6,all);
    const b=__mk([['T','Teacher (implementer)'],['A','Administrator'],['C','Caregiver']],6,Object.assign({},all,{meta:Object.assign({},all.meta,{missing_why:'The student is nonvocal and has no reliable pictorial response yet (simulated).'})}));
    const c=__mk([['T','Teacher (implementer)'],['C','Caregiver'],['St','Student']],6,all);
    return {a:[a.label,a.why],b:[b.label,b.why],c:[c.label,c.why]};});
  ok('5 F219 a teacher, the principal and an SLP are not enough: "Insufficient", naming the student and a caregiver; administrator and other rows count only in addition',
    r219.a[0]==='Insufficient'&&/No ratings yet from the student, a caregiver\./.test(r219.a[1])&&/never in their place/.test(r219.a[1]),r219.a);
  ok('6 F219 the student excused only with no student row and the reason recorded; with the student, a caregiver and an implementer all 6 the plan is socially valid',
    r219.b[0]==='Socially valid'&&/The student did not rate \(the reason is recorded/.test(r219.b[1])&&r219.c[0]==='Socially valid',r219);
  /* ---------- F221 ---------- */
  const r221=await p.evaluate(()=>{const V=__mk([['T','Teacher (implementer)'],['C','Caregiver'],['St','Student']],6,{rounds:['post'],meta:{pr_change:'-38',pr_indep:'Yes, across settings and people',post_n:'2'},chk:{post_opt:true,post_coer:true,post_anon:true,post_open:true}});
    const W=__mk([['T','Teacher (implementer)'],['C','Caregiver'],['St','Student']],(r,x)=>x.s==='G'?4:6,{rounds:['post'],meta:{pr_change:'-38',pr_indep:'Yes, across settings and people',post_n:'2'}});return {v:[V.label,V.why],w:[W.label,W.why]};});
  ok('7 F221 no pre round: the goals are judged on the review round and the label says so, not a shortfall',r221.v[0]==='Socially valid'&&/Goals 6\.00 \(goals rated at review only; no pre round\)/.test(r221.v[1])&&
    r221.w[0]==='Below the working thresholds'&&/Goals mean 4\.00 \(goals rated at review only; no pre round\)/.test(r221.w[1]),r221);
  /* ---------- F222 ---------- */
  const r222=await p.evaluate(()=>{const rows=[['T','Teacher (implementer)'],['P','Paraprofessional (implementer)'],['C','Caregiver'],['St','Student']];
    const o=c=>({meta:{pr_change:c,pr_indep:'Yes, across settings and people',post_n:'2',prior_date:'9/22/2026'},chk:{prior_agree:true,post_opt:true,post_coer:true,post_anon:true,post_open:true}});
    const a=__mk(rows,6,o('-4')),b=__mk(rows,6,o('20')),c=__mk(rows,6,o('-15'));return {a:[a.label,a.why,a.C.e1.code],b:[b.label,b.why,b.C.e1.code],c:[c.label,c.why,c.C.e1.code]};});
  ok('8 F222 an earlier "agree" does not carry over when this review’s data show no change (-4%) or a worsening (+20%) the consumers call improvement',
    r222.a[0]!=='Socially valid'&&/does not carry over/.test(r222.a[1])&&r222.a[2]==='unsupported'&&r222.b[0]!=='Socially valid'&&/does not carry over/.test(r222.b[1]),r222);
  ok('9 F222 with a mixed reading it carries, and the verdict names the review it came from',r222.c[0]==='Socially valid'&&r222.c[2]==='mixed'&&/with concordance “agree” at the review of 9\/22\/2026/.test(r222.c[1]),r222.c);
  /* ---------- F224 ---------- */
  const r224=await p.evaluate(()=>{const rows=[['T','Teacher (implementer)'],['C','Caregiver'],['St','Student']];
    __mk(rows,6,{meta:{pr_change:'-38'}});const a=concordance().e1.code;
    S.meta.pr_change='38';renderAll();const b=concordance().e1.code,bt=$('#prChgRead').textContent;
    S.meta.pr_dir='increase';renderAll();const c=concordance().e1.code,ct=$('#prChgRead').textContent;
    const old=fromFile({form:'SV-1',S:{meta:{pr_change:'38',pr_indep:'Yes, independently'},resp:[]}}),neu=fromFile({form:'SV-1',S:{v:2,meta:{pr_change:'-38'},resp:[]}});
    S=old;renderAll();const oi=S.meta.pr_indep;return {a,b,bt,c,ct,old:old.meta.pr_change,neu:neu.meta.pr_change,oi};});
  ok('10 F224 the change is read as PR-1 prints it: -38 on a behavior to go down agrees, +38 is a worsening; "to go up" turns it round; a file saved before reads its positive improvement as -38',
    r224.a==='agree'&&r224.b==='unsupported'&&/38% above baseline: a worsening/.test(r224.bt)&&r224.c==='agree'&&/an improvement/.test(r224.ct)&&r224.old==='-38'&&r224.neu==='-38'&&r224.oi==='Yes, across settings and people',r224);
  const cin=await p.evaluate(()=>{S=blank();renderAll();const f={review:{pct:-38.2,repInd:'Yes, but only in one setting',date:'2026-10-14'},plan:{rep:'Asking for a two-minute break with the card',beh:'Tipping the desk'},
      staff:{people:[{name:'Dana Whitfield (simulated)',role:'Teacher'}]},caregiver:{name:'Ana Rivera (simulated)',rel:'Mother'},fit:{values:[{name:'Dana Whitfield (simulated)',r1:5.5,r2:4.5}]}};
    const r=window.__nbhFactsIn(f);const m=Object.assign({},S.meta),btn=$$('#svOffer [data-svadd]').map(b=>b.textContent),rows0=S.resp.filter(x=>x.name).length;
    $('#svOffer [data-svadd]').click();window.__nbhFactsIn(f);const t=S.resp.find(x=>x.name==='Dana Whitfield (simulated)');
    S.meta.pr_change='-10';window.__nbhFactsIn(f);return {r,m,btn,rows0,t,keep:S.meta.pr_change,left:$$('#svOffer [data-svadd]').length};});
  ok('11 F224 from the case, while empty: PR-1’s change, answer and date, TD-1’s skill and behavior; the people offered as rows, never added unasked; CF-1’s values means by name; a typed change kept',
    cin.m.pr_change==='-38'&&cin.m.pr_indep==='Yes, but only in one setting'&&cin.m.pr_date==='10/14/2026'&&cin.m.skill==='Asking for a two-minute break with the card'&&cin.m.beh==='Tipping the desk'&&
    cin.rows0===0&&cin.btn.length===2&&/Add Dana Whitfield \(simulated\) \(teacher\)/.test(cin.btn[0])&&/Add Ana Rivera \(simulated\) \(caregiver\)/.test(cin.btn[1])&&cin.t&&cin.t.role==='Teacher (implementer)'&&cin.t.cf1==='5.5'&&cin.t.cf2==='4.5'&&cin.keep==='-10'&&cin.left===1,cin);
  const prOut=await pr.evaluate(async()=>{await loadSim();return window.__nbhFactsOut().review;});
  ok('12 F224 PR-1 sends its change (as it prints it) and its answer on independent use',typeof prOut.pct==='number'&&prOut.pct<0&&typeof prOut.repInd==='string'&&prOut.repInd.length>3,{pct:prOut.pct,repInd:prOut.repInd});
  const cf=await open(CF);const cfo=await cf.evaluate(async()=>{await loadSim();return window.__nbhFactsOut().fit;});
  ok('13 F224 Form CF-1 sends each respondent’s values mean, by name and round',Array.isArray(cfo.values)&&cfo.values.length>0&&cfo.values.every(v=>v.name&&(typeof v.r1==='number'||typeof v.r2==='number')),cfo.values);
  await cf.close();
  /* ---------- F225 ---------- */
  const g=await p.evaluate(async()=>{await loadSim();return {sv:window.__nbhFactsOut().sv,fs:$('#feedFs').textContent};});
  const tb=await open(TB);const t1=await tb.evaluate(sv=>{const r=window.__nbhFactsIn({sv});const el=document.querySelector('[name="m.rationale"]');const a=el.value;el.value='Typed';window.__nbhFactsIn({sv});return {r,a,b:el.value};},g.sv);
  ok('14 F225 the goals round goes to TB-1’s selection rationale while it is empty: the means by role and what the consumers want; nothing to FS-1',
    /^Social validity of the goals \(Form SV-1, pre round, 1 to 6\): /.test(g.fs)&&/caregiver /.test(g.fs)&&/What the consumers want: /.test(g.fs)&&!/FS-1, Evidence/.test(g.fs)&&t1.a===g.sv.goals.line&&t1.b==='Typed'&&t1.r.filled>=1,{fs:g.fs,t1});
  await tb.close();
  /* ---------- F220 the team copy ---------- */
  const vis=async()=>p.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'&&!!(e.offsetWidth||e.offsetHeight);};
    return {byName:v('#pTbl_post'),byRole:v('#pRole_post'),flagName:v('#flagTbl th.sv-nmcol'),cf:v('#cfTbl'),line:$('#svCopyLine').textContent.slice(0,10),txt:document.querySelector('main.sheet').innerText};});
  await p.evaluate(()=>{setView('sum');});await p.emulateMedia({media:'print'});const tc=await vis();
  await p.evaluate(()=>{S.meta.print_copy='bcba';renderAll();});const bc=await vis();await p.emulateMedia({media:'screen'});const warn=await p.evaluate(()=>$('#svCopyWarn').textContent);
  await p.evaluate(()=>{S.meta.print_copy='';renderAll();});
  ok('15 F220 respondents told only aggregates are seen: the team copy prints by role, the grids by name, the respondent column and the person-by-person comparison left out; no rated respondent named',
    !tc.byName&&tc.byRole&&!tc.flagName&&!tc.cf&&tc.line==='Team copy:'&&!/Mother \(D\. S\.\)|Paraeducator B|Ms\. R\./.test(tc.txt)&&/Caregiver: “/.test(tc.txt),{tc:Object.assign({},tc,{txt:tc.txt.length})});
  ok('16 F220 the BCBA copy prints by name, with a warning on screen that those respondents were promised aggregates',bc.byName&&!bc.byRole&&bc.flagName&&bc.cf&&bc.line==='BCBA copy:'&&/told the rated staff see only aggregates/.test(warn),{bc:Object.assign({},bc,{txt:0}),warn});
  /* ---------- F227 ---------- */
  const sp=await p.evaluate(()=>{__mk([['T','Teacher (implementer)'],['C','Caregiver'],['St','Student']],(r,x)=>x.id==='G6'?2:6,{});return $$('#splitTbl tbody tr').map(r=>r.textContent);});
  ok('17 F227 the student’s own item is set beside the adults’ item it pairs with, so the student shows in Where Consumers Disagree',sp.some(t=>/^G1/.test(t)&&/Student \(on G6, paired\) 2\.00/.test(t)),sp);
  /* ---------- F226 ---------- */
  const h=await p.evaluate(async()=>{await loadSim();await nextPost();const V=verdict();
    let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};$('#saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const n=fromFile(JSON.parse(saved));const canon=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,k2)=>(o[k2]=v[k2],o),{}):v);return {hist:S.hist.length,post:anyRatings('post'),chg:S.meta.pr_change||'',label:V.label,why:V.why,rows:$$('#histTbl tbody tr').length,back:n.hist.length,same:canon(n.hist)===canon(S.hist),posts:postCount()};});
  ok('18 F226 "Start the next review’s post round" keeps the round whole and clears the post columns; the verdict waits for the new round; the rounds are saved and opened',
    h.hist===2&&!h.post&&h.chg===''&&h.label==='Insufficient'&&/This review’s post round is not rated yet \(2 earlier post rounds kept below\)/.test(h.why)&&h.rows===2&&h.back===2&&h.same&&h.posts===2,h);
  ok('19 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
