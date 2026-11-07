/* v25.68 wave 2, classroom and staff: research recommendations #10 and #5, at least one check each.
   Simulated data only ("Sample Student", "S.S.", "Ms. Sample (simulated)", the simulated BCBA "Jordan Ellis"); no student named.
   CL   #10 OB-1's Classroom check view: a short timed check of the classroom (opportunities to respond, specific and general
            praise, reprimands and their ratio, the rules, transitions, class-wide engagement by momentary time sampling); a
            record that never uses it saves as before; it stays out of the form's print and the packet unless put in the record;
            the teacher's copy prints on its own; out to the case beside the evidence, never as evidence of its own
   GC   #10 GC-1's Design sheet shows the latest check beside the choice of a class-wide system (screen only; never chooses)
   FB   #10 TI-1's Send feedback offers the check for the teacher: ticked for the teacher's own room, in the message and the slip
   SC   #5  the daily self-check: the staff phone page asks the link's questions after each period and sends the answers with
            the entry (a link without them is as it was); TI-1 picks the questions and compares the answers with observed
            integrity, flagging self-checks that run high; QS-1 offers its non-negotiables as the questions
   PAD  the new parts on an iPad sideways and upright (Chromium with an iPad's user agent and touch), and the phone page at 390 px
   usage: WS_URL=http://127.0.0.1:8657 WS_ROOT=. node qa/v2568-class-staff-test.js [section...] */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FILE=id=>L.forms().find(x=>x.id===id).file;
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const SHOTS=path.join(__dirname,'out','v2568-class-staff');try{fs.mkdirSync(SHOTS,{recursive:true});}catch(e){}
const b64=s=>Buffer.from(s,'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const LINK=(k,code)=>({v:1,f:'DD-1',x:{u:'http://127.0.0.1:9/nbh-box',b:'0123456789abcdef0123456789abcdef',k:{x:'A'.repeat(43),y:'B'.repeat(43)}},c:code||'SIMCODE1',
  w:'Sample para, Room 12',s:'S.S.',t:[{i:'b1',n:'Hitting (simulated)',m:'n'}],st:['Math'],...(k?{k}:{})});
const Q3=[{i:'k1',n:'Gave the break card before the demand'},{i:'k2',n:'Held the delay to its full length'},{i:'k3',n:'Praised the wait, naming it'}];
(async()=>{const br=await L.chromium.launch();const errs=[];
 const ctx=await br.newContext({viewport:{width:1376,height:1032},serviceWorkers:'block',acceptDownloads:true});
 const open=async(id,c,url)=>{const p=await (c||ctx).newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(url||L.BASE+'/NBH-Workstation/'+encodeURI(FILE(id)));await sleep(1300);await p.evaluate(()=>{window.alert=()=>{};window.confirm=()=>true;}).catch(()=>{});return p;};
 const sim=async p=>{await L.loadSim(p);await sleep(1000);};
 const sec=async(k,fn)=>{if(!want(k))return;try{await fn();}catch(e){ok(k+': the section ran to the end',false,String(e&&e.stack||e));}};
 /* the form's Save data, as Autosave and the case file take it */
 const saved=p=>p.evaluate(()=>new Promise(res=>{const RB=window.Blob,mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;let parts=null;
   window.Blob=function(ps,o){if(!parts)parts=ps;return new RB(ps,o);};window.Blob.prototype=RB.prototype;URL.createObjectURL=()=>'blob:x';HTMLAnchorElement.prototype.click=function(){};
   try{document.getElementById('saveBtn').click();}finally{window.Blob=RB;URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}res(parts?parts.join(''):null);}));
 const openText=(p,text)=>p.evaluate(t=>new Promise(res=>{const inp=document.getElementById('fileIn');const dt=new DataTransfer();dt.items.add(new File([t],'saved.json',{type:'application/json'}));
   inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(res,900);}),text);
 /* what the workstation collects for the packet (the form's answer to "collect") */
 const collect=p=>p.evaluate(()=>new Promise(res=>{const on=e=>{const d=e.data||{};if(d.nbh==='payload'){window.removeEventListener('message',on);res(d.html||'');}};
   window.addEventListener('message',on);window.postMessage({nbh:'collect'},'*');setTimeout(()=>res(null),3000);}));
 const shown=async(p,sel,media)=>{if(media)await p.emulateMedia({media});const r=await p.evaluate(s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none';},sel);if(media)await p.emulateMedia({media:'screen'});return r;};
 let OBF=null;   /* OB-1's facts with the simulated check, for GC-1 and TI-1 */

 /* ---------------- CL: OB-1's classroom practices check ---------------- */
 await sec('CL',async()=>{
  const p=await open('OB-1');
  const blank0=await saved(p);
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="class"]').click());await sleep(400);
  const v=await p.evaluate(()=>{const d=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none';};
    return {btn:(document.querySelector('#viewSeg button[data-view="class"]')||{}).textContent,cls:d('#clsCheck'),ed:d('#oclEd'),setup:d('#setup'),sum:d('#summary'),rec:d('#obRec'),noKey:state.meta.cls===undefined};});
  ok('CL 1 a view of its own, "Classroom check": it shows the check and hides the record\'s other sheets',v.btn==='Classroom check'&&v.cls&&v.ed&&!v.setup&&!v.sum&&!v.rec,v);
  const blank1=await saved(p);
  ok('CL 2 a record that has not used the check saves byte for byte as before (nothing is written until a check holds something)',v.noKey&&blank0===blank1&&!/"cls"/.test(blank1));
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={},set=(id,val)=>{const e=document.getElementById(id);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    o.tapsOff=[...document.querySelectorAll('#oclEd [data-tap]')].every(b=>b.disabled);
    set('oclPresent','20');document.getElementById('oclGo').click();await w(200);o.tapsOn=[...document.querySelectorAll('#oclEd [data-tap]')].every(b=>!b.disabled);
    const tap=(k,x)=>{for(let i=0;i<x;i++)document.querySelector('[data-tap="'+k+'"]').click();};tap('otr',12);tap('bsp',3);tap('gp',5);tap('rep',4);
    document.querySelector('[data-undo="otr"]').click();
    document.getElementById('oclTr').click();await w(2200);document.getElementById('oclTr').click();
    document.querySelector('[data-scan="2"]').click();document.querySelector('[data-scan="5"]').click();
    document.getElementById('oclGo').click();await w(200);
    const c=window.__ob2568.cur();o.c=JSON.parse(JSON.stringify(c));o.key=!!state.meta.cls;
    set('oclMin','10');const F=window.__ob2568.figs(window.__ob2568.cur());o.F=F;o.ratio=document.getElementById('oclRatio').textContent;o.spec=document.getElementById('oclSpec').textContent;
    o.rate=document.querySelector('[data-r2="otr"]').textContent;return o;});
  ok('CL 3 the tiles count only while the check runs; Start, the four tiles and Undo count opportunities to respond, specific and general praise, reprimands',
    r.tapsOff&&r.tapsOn&&r.c.otr===11&&r.c.bsp===3&&r.c.gp===5&&r.c.rep===4&&r.key,r);
  ok('CL 4 the figures: a minute from the minutes observed (11 in 10 minutes = 1.1), praise to correction (8 to 4 = "2 to 1"), praise that was specific (3 of 8 = 38%)',
    r.rate==='1.1'&&r.ratio==='2 to 1'&&r.spec==='38%'&&Math.abs(r.F.ratio-2)<1e-9,{rate:r.rate,ratio:r.ratio,spec:r.spec});
  ok('CL 5 a transition is timed from its start to its end, and each engagement scan is the share of the students present who were engaged (18 of 20, 15 of 20: 83%)',
    r.c.tr.length===1&&r.c.tr[0]>=1&&r.c.tr[0]<=4&&r.c.scans.length===2&&r.c.scans[0].n===20&&Math.round(r.F.eng)===83&&r.F.engLo===75,{tr:r.c.tr,scans:r.c.scans,eng:r.F.eng});
  /* the scan comes due on the observed clock, and the check stops itself at its length */
  const due=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),set=(id,val)=>{const e=document.getElementById(id);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    /* a scan due two seconds into the observed clock (the schedule moved up for the check) */
    set('oclEvery','30');set('oclPlan','10');set('oclMin','5');document.getElementById('oclGo').click();await w(100);const R=window.__ob2568.R;R.next=window.__ob2568.cur().sec+2;await w(2600);
    const o={cue:document.getElementById('oclCue').textContent,say:document.getElementById('oclSay').textContent,due:document.getElementById('oclScan').classList.contains('ocl-due')};
    document.querySelector('[data-scan="1"]').click();await w(100);o.cue2=document.getElementById('oclCue').textContent;document.getElementById('oclGo').click();await w(100);
    /* the check stops itself at its length */
    set('oclMin','9.9');document.getElementById('oclGo').click();await w(6800);
    o.go=document.getElementById('oclGo').textContent;o.msg=document.getElementById('oclMsg').textContent;o.sec=window.__ob2568.cur().sec;return o;});
  ok('CL 6 a scan comes due on the observed clock ("Scan now", announced), and the check stops itself at its length (10 minutes)',
    /Scan now/.test(due.cue)&&/Scan now/.test(due.say)&&due.due&&/Next scan in/.test(due.cue2)&&due.go==='Continue'&&/10 minutes observed/.test(due.msg)&&due.sec>=600&&due.sec<=602,due);
  const fill=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),set=(id,val)=>{const e=document.getElementById(id);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('oclRoom','Room 12 (simulated)');set('oclTeacher','Ms. Sample (simulated)');set('oclPosted','yes');set('oclRn','4');set('oclPos','partly');set('oclTaught','no');
    set('oclWell','Clear directions before seatwork.');set('oclNext','Four praise statements for each correction.');await w(200);
    return {c:JSON.parse(JSON.stringify(window.__ob2568.cur())),aim:document.getElementById('oclAim').textContent};});
  ok('CL 7 the rules (posted, how many, stated as what to do, taught during the check) and the coaching notes are kept; the points for the talk are working conventions, never a rating',
    fill.c.rules.posted==='yes'&&fill.c.rules.n===4&&fill.c.rules.pos==='partly'&&fill.c.rules.taught==='no'&&/Four praise/.test(fill.c.next)&&/not a rating/.test(fill.aim)&&/at least 4 to 1/.test(fill.aim),fill);
  const s1=await saved(p);await openText(p,s1);const s2=await saved(p);await openText(p,s2);const s3=await saved(p);const back=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__ob2568.cur())));
  ok('CL 8 Save data and Open data carry the check (state.meta.cls) unchanged, and a record saved with one opens and saves again byte for byte',
    /"cls"/.test(s1)&&JSON.stringify(JSON.parse(s1).meta.cls)===JSON.stringify(JSON.parse(s2).meta.cls)&&s2===s3&&back.otr===11&&back.rules.taught==='no',{same:s2===s3,otr:back.otr});
  /* out of the record unless chosen */
  const out0={pr:await shown(p,'#clsCheck','print'),col:await collect(p)};
  /* the sheet's page in the collection holds no text and no picture, so the packet drops it as it drops any empty page */
  const pg0=await p.evaluate(h=>{const d=new DOMParser().parseFromString('<div id="r">'+h+'</div>','text/html');const s=d.getElementById('clsCheck');if(!s)return {none:true};const pg=s.closest('.nbh-page')||s;
    return {txt:(pg.textContent||'').replace(/\s/g,''),img:!!pg.querySelector('img,svg,canvas,input,select,textarea,hr')};},out0.col||'');
  ok('CL 9 the check is left out of the form\'s print and of the packet while it is not put in the student\'s record (its page there is empty, so dropped)',
    !out0.pr&&out0.col!=null&&!/Classroom check of|Classroom Practices Check/i.test(out0.col)&&(pg0.none||(!pg0.txt&&!pg0.img)),{pr:out0.pr,pg0});
  await p.evaluate(()=>{document.getElementById('oclRec').click();});await sleep(200);
  const out1={pr:await shown(p,'#clsCheck','print'),ed:await shown(p,'#oclEd','print'),setup:await shown(p,'#setup','print'),col:await collect(p),w:await p.evaluate(()=>document.getElementById('oclRecW').textContent)};
  ok('CL 10 ticked "Put this check in the student\'s record": it prints after the summary (the recorder never does) and goes with the packet; a check not yet shared says so',
    out1.pr&&!out1.ed&&out1.setup&&/Classroom check of/.test(out1.col||'')&&!/oclGo|Start the check/.test(out1.col||'')&&/Share it with the teacher first/.test(out1.w),{pr:out1.pr,ed:out1.ed,w:out1.w});
  await p.evaluate(()=>{document.getElementById('oclRec').click();});
  /* the teacher's copy prints on its own */
  const head=await p.evaluate(()=>{window.print=()=>{};document.getElementById('oclPrint').click();window.dispatchEvent(new Event('beforeprint'));
    const st=[...document.head.querySelectorAll('style')].filter(s=>/@page/.test(s.textContent)),last=st[st.length-1];return {id:last&&last.id,t:last&&last.textContent};});
  await p.emulateMedia({media:'print'});
  const tp=await p.evaluate(()=>{const d=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none';};return {teach:d('#oclTeach'),setup:d('#setup'),sum:d('#summary'),obs:d('#obsPages'),cls:d('#clsCheck'),txt:(document.getElementById('oclTeach')||{}).textContent||''};});
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(100);
  const gone=await p.evaluate(()=>!document.getElementById('oclTeach')&&!document.documentElement.classList.contains('ocl-teaching'));
  ok('CL 11 "Print the check for the teacher" prints that check alone, framed as coaching shared with the teacher first, and leaves nothing behind',
    tp.teach&&!tp.setup&&!tp.sum&&!tp.obs&&!tp.cls&&/Coaching for you, shared with you first/.test(tp.txt)&&/not an evaluation/.test(tp.txt)&&gone&&!/Sample Student/.test(tp.txt),tp);
  ok('CL 12 the teacher\'s copy names no student in its running head or foot (its own page rule comes after the record\'s)',head.id==='oclTeachPage'&&/Classroom practices check/.test(head.t)&&/No student is named/.test(head.t),head);
  /* out to the case: beside the evidence when the record has an observation of the student, never as evidence of its own */
  const f0=await p.evaluate(()=>window.__nbhFactsOut());
  ok('CL 13 with no observation of the student the case gets no evidence from this form (Form FS-1 lists no classroom check as an assessment)',f0&&f0.classroom&&!f0.evidence,{keys:f0&&Object.keys(f0)});
  await sim(p);await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="class"]').click());
  const f1=await p.evaluate(async()=>{const k0=state.meta.cls===undefined;document.getElementById('oclSim').click();await new Promise(r=>setTimeout(r,500));return {k0,f:window.__nbhFactsOut()};});
  OBF=f1.f;const x=OBF&&OBF.evidence&&OBF.evidence.classroom&&OBF.evidence.classroom.checks[0];
  ok('CL 14 the form\'s simulation starts a fresh record (no check); "Load a simulated check" fills one; it goes out as classroom, and beside the evidence',
    f1.k0&&x&&OBF.classroom&&x.otr.n===27&&x.ratioText==='2.1 to 1'&&x.eng.pct===83&&x.trans.n===3&&x.rules.taught==='no'&&OBF.evidence.method==='Direct observation (descriptive)',x);
  ok('CL 15 no student is named in what goes out: the room, the teacher and the figures only',!/Sample Student|S\.S\./.test(JSON.stringify(OBF.classroom)));
  const two=await p.evaluate(async()=>{document.getElementById('oclAdd').click();await new Promise(r=>setTimeout(r,200));return {n:window.__ob2568.list().length,opts:document.getElementById('oclWhich').options.length};});
  ok('CL 16 a second check can be added (each one kept, chosen from the list)',two.n===2&&two.opts===2,two);
  await p.screenshot({path:path.join(SHOTS,'ob1-class.png'),fullPage:true});
  await p.close();});

 /* ---------------- GC: GC-1 beside the choice ---------------- */
 await sec('GC',async()=>{
  const p=await open('GC-1');
  const h0=await p.evaluate(()=>document.getElementById('gcClsBox').hidden);
  ok('GC 1 with no classroom check in the case the panel is hidden',h0);
  const F=OBF||{};const earlier=JSON.parse(JSON.stringify(F.classroom||{checks:[]}));
  if(earlier.checks[0]){const e=JSON.parse(JSON.stringify(earlier.checks[0]));e.date='2026-10-01';e.ratio=1.2;e.ratioText='1.2 to 1';e.eng.pct=70;earlier.checks.unshift(e);}
  const r=await p.evaluate(f=>{const type0=S.type;window.__nbhFactsIn({evidence:{'OB-1':f.evidence}});document.querySelector('#viewSeg button[data-view="design"]').click();
    const b=document.getElementById('gcClsBox');return {hidden:b.hidden,t:b.textContent,type0,type1:S.type,vis:getComputedStyle(b).display!=='none'};},F);
  ok('GC 2 on the Design sheet the latest check\'s figures show beside the choice: opportunities to respond, praise to correction, engagement, transitions, rules',
    !r.hidden&&r.vis&&/From the classroom practices check \(Form OB-1/.test(r.t)&&/1\.8 a minute/.test(r.t)&&/2\.1 to 1/.test(r.t)&&/83% of 15 scans/.test(r.t)&&/not taught/.test(r.t),r.t.slice(0,600));
  ok('GC 3 points to weigh tied to the figures (praise built into the routine; rules taught first), as working conventions, and the arrangement stays the BCBA\'s choice',
    /CW-FIT/.test(r.t)&&/rule-following/.test(r.t)&&/expectations taught first/.test(r.t)&&/working conventions, not published cut-offs/.test(r.t)&&/You choose the arrangement/.test(r.t)&&r.type0===r.type1,{type0:r.type0,type1:r.type1});
  const pr=await shown(p,'#gcClsBox','print'),col=await collect(p);
  ok('GC 4 the panel is screen only: never printed with this form and not in the packet\'s collection',!pr&&col!=null&&!/From the classroom practices check/.test(col),{pr});
  const r2=await p.evaluate(c=>{window.__nbhFactsIn({classroom:c});return document.getElementById('gcClsBox').textContent;},earlier);
  ok('GC 5 read from the case\'s classroom part too, and with two checks it says what changed since the one before',/Since the check of 10\/1\/2026/.test(r2)&&/1\.2 to 1 → 2\.1 to 1/.test(r2)&&/engaged 70% → 83%/.test(r2),r2.slice(0,400));
  await p.evaluate(()=>document.getElementById('gcClsBox').scrollIntoView());await p.screenshot({path:path.join(SHOTS,'gc1-design.png')});
  await p.close();});

 /* ---------------- FB: TI-1's feedback to the teacher ---------------- */
 await sec('FB',async()=>{
  const p=await open('TI-1');await sim(p);
  const r=await p.evaluate(async f=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};
    o.none=!document.getElementById('tiSendCls');
    S.meta.int='Ms. Sample (simulated)';window.__nbhFactsIn({evidence:{'OB-1':f.evidence}});renderAll();document.querySelector('#viewSeg button[data-view="rt"]').click();await w(300);
    o.box=(document.querySelector('.ti-sendcls')||{}).textContent||'';o.ck=(document.getElementById('tiSendCls')||{}).checked;
    o.msg=window.__ti2568.message(window.__ti2568.pick);
    document.getElementById('tiSendClsPraise').click();document.getElementById('tiSendClsFix').click();await w(100);
    o.praise=document.getElementById('tiSendPraise').value;o.fix=document.getElementById('tiSendFix').value;
    const c=document.getElementById('tiSendCls');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));await w(100);o.msg2=window.__ti2568.message(window.__ti2568.pick).text;
    S.meta.int='Simulated RBT';renderAll();await w(200);o.box2=(document.querySelector('.ti-sendcls')||{}).textContent||'';o.ck2=(document.getElementById('tiSendCls')||{}).checked;
    return o;},OBF);
  ok('FB 1 with a classroom check in the case, Send feedback shows it; ticked when the check is of this adult\'s room',r.none&&/The classroom practices check/.test(r.box)&&/1\.8 opportunities to respond a minute/.test(r.box)&&r.ck===true,r.box);
  ok('FB 2 ticked, the message (its text and its page) carries the check\'s figures, the student by initials only, to the teacher alone',
    /From the classroom check on \d+\/\d+\/\d{4} \(15 minutes\): 1\.8 opportunities to respond a minute; praise to correction 2\.1 to 1, 40% of the praise specific; the class engaged at 83% of the scans/.test(r.msg.text)&&
    /From the classroom check/.test(r.msg.html)&&/Student: S\.S\. \(initials only\)/.test(r.msg.text)&&!/Sample Student/.test(r.msg.text),r.msg.text.slice(0,900));
  ok('FB 3 "Use the check\'s praise" and "Use the check\'s step" fill the two boxes from the check (what went well, the practice chosen with the teacher)',
    /three behavior-specific praise statements/.test(r.praise)&&/Four praise statements for each correction/.test(r.fix),{praise:r.praise,fix:r.fix});
  ok('FB 4 unticked, the message is as it was; for another adult the check is offered unticked, with a line saying whose room it is',!/classroom check/i.test(r.msg2)&&r.ck2===false&&/add it only when the message goes to that teacher/.test(r.box2),{ck2:r.ck2});
  ok('FB 5 the greeting keeps a title with the name ("Hello Ms. Sample,")',/^Hello Ms\. Sample,/.test(r.msg.text),r.msg.text.slice(0,40));
  const slip=await p.evaluate(async()=>{S.meta.int='Ms. Sample (simulated)';renderAll();await new Promise(r=>setTimeout(r,200));window.print=()=>{};document.getElementById('tiSendSlip').click();const t=(document.getElementById('tiSlip')||{}).textContent||'';window.dispatchEvent(new Event('afterprint'));return t;});
  ok('FB 6 the printed slip carries the check too when it is ticked',/From the classroom check on/.test(slip),slip.slice(0,300));
  await p.close();});

 /* ---------------- SC: the daily self-check ---------------- */
 await sec('SC',async()=>{
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:'block'});
  const url=pl=>L.BASE+'/NBH-Workstation/staff-data.html#s='+b64(JSON.stringify(pl));
  const p=await open('staff',ph,url(LINK(Q3)));
  const a=await p.evaluate(()=>{const c=document.getElementById('sdSc');return {card:!!c,q:[...document.querySelectorAll('.sc-q')].map(x=>x.textContent),b:[...document.querySelectorAll('[data-sc]')].map(x=>x.textContent),
    h:Math.min(...[...document.querySelectorAll('[data-sc]')].map(x=>x.getBoundingClientRect().height)),sw:document.documentElement.scrollWidth,iw:innerWidth,lede:document.querySelector('.lede').textContent,
    names:[...document.querySelectorAll('.sc-i')].every(g=>g.getAttribute('role')==='group'&&document.getElementById(g.getAttribute('aria-labelledby')))};});
  ok('SC 1 a link carrying the questions asks "Did I do it?" for each (Yes, No, Didn\'t come up), named for VoiceOver, 44 px or more, no sideways scroll at 390 px',
    a.card&&a.q.length===3&&/^1\. Gave the break card/.test(a.q[0])&&a.b.slice(0,3).join('|')==='Yes|No|Didn’t come up'&&a.h>=44&&a.sw<=a.iw&&a.names&&/answer the self-check/.test(a.lede),a);
  const s=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};document.querySelector('[data-a="inc"]').click();await w(50);
    document.getElementById('sdSend').click();await w(150);o.m1=document.getElementById('sdMsg').textContent;o.out1=window.__nbhStaffPage.state().out.length;
    document.querySelector('[data-sc="k1"][data-sa="y"]').click();document.querySelector('[data-sc="k2"][data-sa="n"]').click();document.querySelector('[data-sc="k3"][data-sa="x"]').click();
    document.querySelector('[data-sc="k3"][data-sa="y"]').click();document.querySelector('[data-sc="k3"][data-sa="y"]').click();document.querySelector('[data-sc="k3"][data-sa="x"]').click();await w(50);
    o.pressed=[...document.querySelectorAll('[data-sc][aria-pressed="true"]')].map(b=>b.dataset.sc+b.dataset.sa).join(',');o.kept=JSON.parse(localStorage.getItem(window.__nbhStaffPage.key)).sc;return o;});
  ok('SC 2 a send with the self-check unanswered asks once (nothing is held: the next press sends); the answers show pressed and are kept on the phone',
    /self-check/.test(s.m1)&&/press Send again to send without it/.test(s.m1)&&s.out1===0&&s.pressed==='k1y,k2n,k3x'&&s.kept&&s.kept.k1==='y'&&s.kept.k3==='x',s);
  await p.reload();await sleep(900);
  const s2=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};o.after=[...document.querySelectorAll('[data-sc][aria-pressed="true"]')].length;
    document.getElementById('sdSend').click();await w(1200);const st=window.__nbhStaffPage.state();o.sc=st.out.map(e=>e.sc);o.left=st.sc;o.pressed=[...document.querySelectorAll('[data-sc][aria-pressed="true"]')].length;return o;});
  ok('SC 3 the answers survive a reload, go with the entry the send makes (sc: id, words, y / n / x) and are asked again for the next period',
    s2.after===3&&s2.sc.length===1&&JSON.stringify(s2.sc[0])===JSON.stringify([{i:'k1',n:'Gave the break card before the demand',a:'y'},{i:'k2',n:'Held the delay to its full length',a:'n'},{i:'k3',n:'Praised the wait, naming it',a:'x'}])&&Object.keys(s2.left).length===0&&s2.pressed===0,s2);
  const s3=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('[data-a="inc"]').click();document.getElementById('sdSend').click();await w(100);document.getElementById('sdSend').click();await w(900);
    const st=window.__nbhStaffPage.state();return {n:st.out.length,sc:'sc' in st.out[st.out.length-1]};});
  ok('SC 4 pressed again, the period\'s data are sent without the self-check (the entry carries no sc)',s3.n===2&&s3.sc===false,s3);
  const q=await open('staff-old',ph,url(LINK(null,'SIMCODE2')));
  const o=await q.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('[data-a="inc"]').click();document.getElementById('sdSend').click();await w(900);
    const st=window.__nbhStaffPage.state(),raw=JSON.parse(localStorage.getItem(window.__nbhStaffPage.key));return {card:!!document.getElementById('sdSc'),keys:Object.keys(st.out[0]||{}).join(','),sc:'sc' in raw,lede:document.querySelector('.lede').textContent};});
  ok('SC 5 a link without questions shows and sends exactly what it did: no card, the entry\'s keys unchanged, nothing new kept on the phone',
    !o.card&&o.keys==='v,kind,form,c,w,id,date,made,d,as,st,note'&&!o.sc&&!/self-check/.test(o.lede),o);
  await p.screenshot({path:path.join(SHOTS,'staff-phone.png'),fullPage:true});
  await q.close();await p.close();await ph.close();
  /* TI-1: the questions and the comparison */
  const t=await open('TI-1');await sim(t);
  const blank=await t.evaluate(()=>({sc:document.getElementById('tiSc').className,out:JSON.stringify(window.__nbhFactsOut().integrity)}));
  const r=await t.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};document.querySelector('#viewSeg button[data-view="rt"]').click();await w(200);
    document.getElementById('tiScCrit').click();await w(100);o.items=JSON.parse(JSON.stringify(S.sck.items));
    const c=document.querySelector('#tiSc [data-sck="0"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));await w(50);o.limit=document.getElementById('tiScN').textContent;o.n2=S.sck.items.length;
    o.out=window.__nbhFactsOut().integrity.selfCheck;return o;});
  ok('SC 6 TI-1: "Use the critical steps" makes the questions (five at most; a sixth is refused), and they go out for Form DD-1\'s link (integrity.selfCheck: id and words)',
    r.items.length===5&&r.n2===5&&/Five questions at most/.test(r.limit)&&r.out&&r.out.src==='TI-1'&&r.out.items.length===5&&r.out.items.every(x=>/^k[a-z0-9]+$/.test(x.i)&&x.d)&&/Honors an independent break-card exchange/.test(r.out.items[0].d)&&!/selfCheck/.test(blank.out),{items:r.items.length,out:r.out});
  const cal=await t.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const d3=S.obs[3].date,d2=S.obs[2].date,I=S.sck.items,o={};S.meta.int='Simulated RBT';
    const e=(date,ans)=>({date,who:'Simulated RBT, Room 12',code:'SIMCODE1',at:date+'T10:00:00Z',items:I.slice(0,3).map((x,k)=>({i:x.i,n:x.d,a:ans[k]}))});
    window.__nbhFactsIn({data:{staff:{self:[e(d3,'yyy'),e(d3,'yyx'),e(d2,'yny'),{date:d2,who:'Another adult',code:'SIMCODE9',at:'',items:[{i:'k9',n:'x',a:'y'}]}]}}});await w(200);
    o.c=window.__ti2568b.cal();o.t=document.getElementById('tiSc').textContent;o.kept=(S.sckIn||[]).length;o.from=[...document.querySelectorAll('#tiScFrom option')].map(x=>x.textContent);
    o.out=window.__nbhFactsOut().integrity.selfCal;return o;});
  const row3=cal.c&&cal.c.rows.find(x=>x.y===5);
  ok('SC 7 the answers this adult sent (by name; another adult\'s left out) are kept, and each day sits beside the check that day on the same steps',
    cal.kept===3&&cal.c.rows.length===2&&row3&&row3.on==='steps'&&row3.obs!=null&&cal.from.some(x=>/Another adult/.test(x)),{kept:cal.kept,rows:cal.c&&cal.c.rows});
  ok('SC 8 a self-check 15 points or more above what was observed is flagged as running high, with "said yes, observed not done" by step, and talked through at the feedback',
    row3&&row3.self===100&&row3.diff>=15&&row3.high&&row3.miss.length>=1&&/Runs high/.test(cal.t)&&/Said yes, observed not done/.test(cal.t)&&/Talk it through at the next feedback/.test(cal.t)&&cal.out&&cal.out.high===true,{row3,out:cal.out});
  const pr=await shown(t,'#tiSc','print'),prPick=await shown(t,'#tiSc .ti-sc-pick','print');
  const SP=x=>JSON.stringify(JSON.parse(x).S);const sv=await saved(t);await openText(t,sv);const sv2=await saved(t);const back=await t.evaluate(()=>({n:(S.sckIn||[]).length,i:(S.sck&&S.sck.items||[]).length}));
  ok('SC 9 the questions and the comparison print (the picker does not); a saved copy keeps both and opens to the same file',pr&&!prPick&&SP(sv)===SP(sv2)&&back.n===3&&back.i===5,{pr,prPick,same:SP(sv)===SP(sv2),back});
  await t.close();
  const t2=await open('TI-1');await sim(t2);const old1=await saved(t2);await openText(t2,old1);const old2=await saved(t2);
  const em=await t2.evaluate(()=>({cls:document.getElementById('tiSc').className}));
  ok('SC 10 a TI-1 record that has no self-check saves as before (no new key) and its section is left off paper',JSON.stringify(JSON.parse(old1).S)===JSON.stringify(JSON.parse(old2).S)&&!/"sck/.test(old1)&&/ti-sc-empty/.test(em.cls)&&!(await shown(t2,'#tiSc','print')),em);
  const qs=await t2.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));tiQuick=Object.assign({},tiQuick||{},{selfCheck:{items:[{i:'q1',d:'Offer the break card first'},{i:'q2',d:'Praise the wait'},{i:'q3',d:'One voice in an escalation'}],src:'QS-1'}});
    document.querySelector('#viewSeg button[data-view="rt"]').click();window.__ti2568b.render();await w(50);const b=document.getElementById('tiScQs');if(!b)return null;b.click();await w(50);return {items:S.sck.items,src:S.sck.src,out:window.__nbhFactsOut().integrity.selfCheck};});
  ok('SC 11 TI-1 offers Form QS-1\'s self-check as the questions, the same ids, so the answers to a QS-1 link match',qs&&qs.items.length===3&&qs.items[0].i==='q1'&&qs.src==='QS-1'&&qs.out.src==='QS-1',qs);
  await t2.close();
  /* QS-1 */
  const s4=await open('QS-1');await sim(s4);
  const hand0=await s4.evaluate(()=>{build();return document.getElementById('out').innerHTML;});
  const qq=await s4.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};document.querySelector('#viewSeg button[data-view="rules"]').click();await w(200);
    o.box=!!document.getElementById('qsSck');o.rows=document.querySelectorAll('[data-qsck]').length;
    for(let k=0;k<3;k++){const c=document.querySelectorAll('[data-qsck]:not(:checked):not(:disabled)')[0];c.click();await w(60);}
    o.items=JSON.parse(JSON.stringify(S.sck.items));o.out=window.__nbhFactsOut().quick.selfCheck;o.n=document.getElementById('qsSckN').textContent;
    build();o.hand1=document.getElementById('out').innerHTML;
    /* a row still holding the plan's words unreviewed is not offered */
    S.pulled['rules.5.do']=S.rules[5].do;delete S.ok['rules.5.do'];renderEditor();await w(100);o.dis=!!document.querySelector('[data-qsck="5"]:disabled');return o;});
  ok('SC 12 QS-1: three to five non-negotiables ticked on page 4\'s editor become the questions (quick.selfCheck); a row not yet reviewed is not offered',
    qq.box&&qq.rows>=3&&qq.items.length===3&&qq.out&&qq.out.items.length===3&&qq.out.src==='QS-1'&&qq.items[0].d===qq.out.items[0].d&&qq.dis,qq);
  const hand1=qq.hand1;delete qq.hand1;
  const qsv=await saved(s4);await s4.evaluate(()=>{S.sck=undefined;delete S.sck;});await openText(s4,qsv);const qback=await s4.evaluate(()=>(S.sck&&S.sck.items||[]).length);
  ok('SC 13 the handout prints as it did (the self-check is screen only), and Open data reads the questions back',!!hand0&&hand0===hand1&&qback===3,{same:hand0===hand1,len:[hand0&&hand0.length,hand1&&hand1.length],qback});
  await s4.close();});

 /* ---------------- PAD: the iPad ---------------- */
 await sec('PAD',async()=>{
  for(const vp of [{width:1376,height:1032,n:'sideways'},{width:1032,height:1376,n:'upright'}]){
   const ic=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:true,userAgent:L.IPAD_UA,deviceScaleFactor:1,serviceWorkers:'block'});
   /* a button: 44 px (its own height, or its CSS minimum where the form's fit-to-screen zoom rounds it under); a field: as tall as
      the form's own fields on a touch screen */
   const small=async(p,sel)=>p.evaluate(s=>{const field=x=>/^(INPUT|SELECT|TEXTAREA)$/.test(x.tagName);const base=(()=>{const f=[...document.querySelectorAll('.sheet input:not([type=checkbox]):not([type=radio]):not([type=hidden])')].find(x=>x.offsetParent&&!x.closest('#oclEd,#tiSc'));return f?f.getBoundingClientRect().height:38;})();
     return [...document.querySelectorAll(s)].filter(e=>e.offsetParent&&!e.disabled&&getComputedStyle(e).opacity!=='0').map(e=>{const h=e.getBoundingClientRect().height,mh=parseFloat(getComputedStyle(e).minHeight)||0;
       return {t:(e.textContent||e.id||e.getAttribute('aria-label')||'').trim().slice(0,40),h:Math.round(h),ok:field(e)?h>=base-0.5||mh>=base-0.5:(h>=43.5||mh>=44)};}).filter(x=>!x.ok);},sel);
   const wide=p=>p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
   {const p=await open('OB-1',ic);await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="class"]').click();});await sleep(300);
    await p.evaluate(()=>document.getElementById('oclSim').click());await sleep(1600);await p.evaluate(()=>document.getElementById('oclGo').click());await sleep(400);
    const r=await wide(p),s=await small(p,'#oclEd button,#oclEd select,#oclEd input:not([type=checkbox]),#oclEd textarea,#oclEd .ocl-rec');await p.screenshot({path:path.join(SHOTS,'ob1-class-'+vp.n+'.png')});
    await p.evaluate(()=>document.getElementById('oclGo').click());
    ok('PAD OB-1 '+vp.n+': the classroom check fits the screen (no page-wide scroll); its buttons are 44 px and its fields as tall as the form\'s own',r.sw<=r.iw+1&&!s.length,{r,s});await p.close();}
   {const p=await open('GC-1',ic);await p.evaluate(f=>{window.__nbhFactsIn({evidence:{'OB-1':f.evidence}});document.querySelector('#viewSeg button[data-view="design"]').click();},OBF||{});await sleep(400);
    await p.evaluate(()=>document.getElementById('gcClsBox').scrollIntoView());const r=await wide(p);await p.screenshot({path:path.join(SHOTS,'gc1-'+vp.n+'.png')});
    ok('PAD GC-1 '+vp.n+': the classroom check panel fits the screen',r.sw<=r.iw+1,r);await p.close();}
   {const p=await open('TI-1',ic);await sim(p);await p.evaluate(async f=>{S.meta.int='Ms. Sample (simulated)';window.__nbhFactsIn({evidence:{'OB-1':f.evidence}});renderAll();document.querySelector('#viewSeg button[data-view="rt"]').click();
      await new Promise(r=>setTimeout(r,200));document.getElementById('tiScCrit').click();},OBF||{});await sleep(600);
    await p.evaluate(()=>document.getElementById('tiSc').scrollIntoView());const r=await wide(p),s=await small(p,'#tiSc button,#tiSc select,#tiSc textarea,.ti-sendcls button');
    await p.screenshot({path:path.join(SHOTS,'ti1-selfcheck-'+vp.n+'.png')});
    ok('PAD TI-1 '+vp.n+': the self-check and the classroom box fit the screen; buttons 44 px, fields as tall as the form\'s own',r.sw<=r.iw+1&&!s.length,{r,s});await p.close();}
   await ic.close();}});

 ok('ERR no page errors in any form or page opened',!errs.length,errs);
 await br.close();console.log('RESULT: '+(fails?fails+' of '+n+' failed':'all '+n+' passed'));process.exitCode=fails?1:0;})();
