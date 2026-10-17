/* v22.41 the restraint record (review F458, F459, F341, F83, F70) and district Policy 5.181. Form DD-1 keeps each restraint's
   record: the state's incident report in its order and answer lists, the parent's notice on form 2547, and the deadlines it
   counts (the written notice that school day; the report within 24 hours, or by the end of the day school reopens; the report
   by mail within 3 school days). CR-1 and DD-1 keep one notice record; a seclusion is counted apart; the workstation tracks the
   deadlines without CR-1, fills a stand-in for form 2547 (made here, not the district's PDF), and names a restraint coded on
   ABC-1 or ticked on OB-1 that DD-1 does not have. CR-1's breathing rule: a prone hold only as the district's last resort.
   Simulated people only.
   usage: node qa/v2241-restraint-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  /* ---- DD-1 ---- */
  const d=await ctx.newPage();d.on('pageerror',e=>errs.push('DD-1: '+e.message));await d.goto(L.BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(900);
  const a=await d.evaluate(()=>{wsUI=window.wsUI||{};
    ddLogIncident({date:'2026-10-16',time:'10:20',beh:'Physical aggression',what:'Hit a peer (simulated)',before:'Math worksheet (simulated)',did:'Prompted the break card (simulated)',ended:'Back at the desk 10:40 (simulated)',hold:'restraint'});
    const i=S.incidents[S.incidents.length-1];rsOpen(i.id);const dl=document.getElementById('dlgRs');
    const pre={start:dl.querySelector('[data-r="start"]').value,preD:dl.querySelector('[data-r="preD"]').value,strD:dl.querySelector('[data-r="strD"]').value,behD:dl.querySelector('[data-r="behD"]').value,aftD:dl.querySelector('[data-r="aftD"]').value};
    const set=(q,v)=>{const e=dl.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    const lists={loc:[...dl.querySelectorAll('[data-r="loc"] option')].map(o=>o.textContent).slice(1),type:[...dl.querySelectorAll('[data-r="type"] option')].map(o=>o.textContent).slice(1),
      meth:[...dl.querySelectorAll('[data-r="meth"] option')].map(o=>o.textContent).slice(1),beh:[...dl.querySelectorAll('[data-r="beh"] option')].map(o=>o.textContent).slice(1)};
    set('[data-r="end"]','10:24');set('[data-r="loc"]','ESE Classroom');set('[data-r="type"]','Standing');set('[data-r="meth"]','PCM (Professional Crisis Management)');
    dl.querySelector('#rsStaff [data-c="n"]').value='Dana Whitfield (simulated)';dl.querySelector('#rsStaff [data-c="pos"]').value='ESE teacher';dl.querySelector('#rsStaff [data-c="tr"]').value='2025-08-01';
    dl.querySelector('[data-rk="risk"][value="Other students"]').checked=true;
    set('[data-r="a1.d"]','2026-10-16');set('[data-r="a1.ph"]','561-555-0101');set('[data-r="a1.vm"]','no');set('[data-r="a1.sp"]','Ana Rivera (simulated)');
    set('[data-r="wn"]','2026-10-16');
    const staffW=dl.querySelector('#rsStaffW').textContent;
    rsSave();
    const r=i.rep,F=new Date(2026,9,16,15,0),Dl=rsDeadlines(i,F),Dm=rsDeadlines(i,new Date(2026,9,20,9,0));
    const out=__nbhFactsOut(),x=out.data.incidentList.find(z=>z.id===i.id);
    const rows=rsIersRows(i).filter(z=>z.length>1).map(z=>z[0]);
    const sr=S.settings.rsStaff;
    /* a reload keeps the record */
    const j=JSON.parse(JSON.stringify(S.incidents));S.incidents=j;ddClean();const kept=S.incidents.find(z=>z.id===i.id);
    return {pre,lists,how:r.how,nDate:r.nDate,parent:i.parent,pw:i.parentWhen,Dl,Dm,x,rest:out.data.restraint,rows,staffW,sr,kept:!!(kept&&kept.rep&&kept.rep.loc==='ESE Classroom'&&kept.rep.staff.length===1)};});
  ok('1 a new record starts from the incident: its time, what came before, what happened, what adults did, how it ended',a.pre.start==='10:20'&&/Math worksheet/.test(a.pre.preD)&&/break card/.test(a.pre.strD)&&/Hit a peer/.test(a.pre.behD)&&/Back at the desk/.test(a.pre.aftD),a.pre);
  ok('2 the state form’s own answer lists: 8 locations, 6 types (prone, supine, mechanical among them), 13 strategies with PCM, 7 behaviors',a.lists.loc.length===8&&a.lists.type.length===6&&a.lists.type.includes('Prone (lying face down)')&&a.lists.meth.length===13&&a.lists.meth.includes('PCM (Professional Crisis Management)')&&a.lists.beh.length===7,a.lists);
  ok('3 the parent’s notification method comes from the contact attempt; its date is the earliest; Home told is set from the record',a.how.join()==='Phone'&&a.nDate==='2026-10-16'&&a.parent==='yes'&&/written notice \(form 2547\) 10\/16/.test(a.pw)&&/spoke with Ana Rivera/.test(a.pw),[a.how,a.nDate,a.pw]);
  const k=(L0,kd)=>L0.find(z=>z.kind===kd)||{};
  ok('4 deadlines: the notice met that day; a Friday release makes the report due by the end of Monday (the day school reopens); mailing due by Wednesday, 3 school days',k(a.Dl,'wn').code==='met'&&k(a.Dl,'rep').due==='2026-10-19'&&k(a.Dl,'ml').due==='2026-10-21'&&k(a.Dl,'rep').code==='due',a.Dl);
  ok('5 the report not yet prepared is overdue once its day has passed',k(a.Dm,'rep').code==='over'&&k(a.Dm,'ml').code==='due',a.Dm);
  ok('6 the case carries the record and the deadlines (with their kind and incident) and the counts',a.x&&a.x.rep&&a.x.rep.wn==='2026-10-16'&&a.rest&&a.rest.deadlines.length===3&&a.rest.deadlines.every(z=>z.kind&&z.inc)&&a.rest.counts&&a.rest.counts.semester===1,[a.x,a.rest]);
  ok('7 For the state report lists the answers in the state form’s order',a.rows.indexOf('Location at which restraint occurred')<a.rows.indexOf('Date of Parent Notification')&&a.rows.indexOf('Date of Parent Notification')<a.rows.indexOf('Type of most restrictive restraint used')&&a.rows.indexOf('Type of most restrictive restraint used')<a.rows.indexOf('The behavior that warranted the use of restraint')&&a.rows[a.rows.length-1]==='If yes, describe',a.rows);
  ok('8 a training date more than a year before the restraint is named (annual certification, Policy 5.181 8d); the staff member is remembered for the next record',/more than a year/.test(a.staffW)&&a.sr&&a.sr[0].n==='Dana Whitfield (simulated)',[a.staffW,a.sr]);
  ok('9 a file read again keeps the record',a.kept);
  /* type warnings, the counts, a seclusion apart */
  const b=await d.evaluate(()=>{const id=S.incidents[0].id,dl=document.getElementById('dlgRs');rsOpen(id);
    const set=(q,v)=>{const e=dl.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    ddCaseFacts={profile:{health:{conditions:'Asthma (simulated)'}}};
    set('[data-r="type"]','Prone (lying face down)');const pr=dl.querySelector('#rsTypeW').textContent,up=!dl.querySelector('#rsUpBox').hidden;
    set('[data-r="type"]','Supine (lying face up)');const su=dl.querySelector('#rsTypeW').textContent;
    set('[data-r="type"]','Mechanical');const me=dl.querySelector('#rsTypeW').textContent;dl.close();
    ['2026-10-01','2026-10-06','2026-10-09'].forEach(dt=>ddLogIncident({date:dt,time:'09:00',beh:'Physical aggression',what:'(simulated)',hold:'restraint'}));
    ddLogIncident({date:'2026-10-12',time:'11:00',beh:'Physical aggression',what:'(simulated)',hold:'seclusion'});
    const c=rsCounts('2026-10-16');rsOpen(S.incidents.find(z=>z.date==='2026-10-16').id);const cw=dl.querySelector('#rsCount').textContent;dl.close();
    const iers=rsIersRows(S.incidents.find(z=>z.date==='2026-10-16')).find(z=>/exceeded two incidents/.test(z[0]));
    const sid=S.incidents.find(z=>z.hold==='seclusion').id;rsOpen(sid);const sw=dl.querySelector('#rsCount').textContent,st=dl.querySelector('#rsTitle').textContent;dl.close();
    const sdl=rsDeadlines(S.incidents.find(z=>z.id===sid),new Date(2026,9,12,12));
    return {pr,up,su,me,c,cw,iers,sw,st,sdl:sdl.map(z=>z.what)};});
  ok('10 a prone restraint: the last resort, reported up the line (the date box shows), and ruled out when the case names asthma',/last resort/.test(b.pr)&&/area superintendent/.test(b.pr)&&/asthma/.test(b.pr)&&/6c-xii/.test(b.pr)&&b.up,b.pr);
  ok('11 supine and mechanical are named as prohibited',/supine restraint is prohibited/.test(b.su)&&/Mechanical restraint is prohibited/.test(b.me),[b.su,b.me]);
  ok('12 counts: 4 restraints in 18 weeks and in the month, the seclusion apart; the team’s meetings named',b.c.sem===4&&b.c.month===4&&b.c.secl===1&&/crisis intervention plan/.test(b.cw)&&/consider an FBA and a BIP/.test(b.cw)&&/frequency and duration/.test(b.cw),[b.c,b.cw]);
  ok('13 the state report’s "exceeded two incidents a semester" is answered from the count',b.iers&&/^Yes \(4 restraints/.test(b.iers[1]),b.iers);
  ok('14 a seclusion: prohibited, its own record and deadlines, never counted as a restraint',/Seclusion is prohibited/.test(b.sw)&&/Seclusion record/.test(b.st)&&b.sdl.every(w=>/\(seclusion on 10\/12\)/.test(w)),[b.sw,b.st,b.sdl]);
  /* CR-1's dates come back to fill DD-1's empty boxes (F459) */
  const c=await d.evaluate(()=>{const i=S.incidents.find(z=>z.date==='2026-10-01');delete i.rep;i.parent='no';i.parentWhen='';
    __nbhFactsIn({crisis:{notices:[{inc:i.id,event:'2026-10-01',wd:'2026-10-01',pd:'2026-10-02',pt:'08:30',md:'2026-10-03',ak:'',mk:'',xt:'09:05'}]}});
    return {rep:i.rep,parent:i.parent,pw:i.parentWhen};});
  ok('15 F459: Form CR-1’s notice dates fill the DD-1 record’s empty boxes, and Home told follows the written notice',c.rep&&c.rep.wn==='2026-10-01'&&c.rep.prep==='2026-10-02'&&c.rep.prepT==='08:30'&&c.rep.sent==='2026-10-03'&&c.rep.end==='09:05'&&c.parent==='yes'&&/Form CR-1/.test(c.pw),c);
  const ddOut=await d.evaluate(()=>__nbhFactsOut());
  /* ---- CR-1 ---- */
  const cr=await ctx.newPage();cr.on('pageerror',e=>errs.push('CR-1: '+e.message));await cr.goto(L.BASE+'/NBH-Workstation/CR-1_Crisis-Intervention-Plan_v2026-09.html');await sleep(900);
  const e=await cr.evaluate(f=>{const r0=__nbhFactsIn(f);const rows=S.log.filter(x=>x.ddId);
    const st=crcStates(new Date(2026,9,20,12)),secl=st.filter(s=>s.secl).length,second=st.find(s=>s.second);
    const o=__nbhFactsOut().crisis;const r16=S.log.find(x=>x.rd==='2026-10-16');
    const li=[...document.querySelectorAll('#crHolds li')].map(x=>x.textContent);
    S.meta.hPhys='Asthma (simulated)';S.meta.prone='last';crProneW();const w1=document.getElementById('crProneW').textContent;
    S.meta.prone='no';crProneW();const w2=document.getElementById('crProneW').textContent;const o2=__nbhFactsOut().crisis;
    const bip=window.__bipText?__bipText():'';
    return {n:rows.length,kinds:rows.map(x=>x.kind||''),secl,second:second?second.r.rd:'',sem:o.restraints&&o.restraints.semester,seclusions:o.seclusions,notices:(o.notices||[]).length,dl:(o.deadlines||[]).filter(z=>/seclusion on/.test(z.what)).length,
      r16:r16?{wd:r16.wd,xt:r16.xt,ddId:!!r16.ddId}:null,li,w1,w2,prone:o2.prone,bipProne:/Face-down \(prone\) restraint for this student: Not allowed/.test(bip)&&/No face-up \(supine\) hold, ever/.test(bip)};},{data:ddOut.data});
  ok('16 CR-1 takes each DD-1 restraint and seclusion once, keyed by the incident, the seclusion marked as such',e.n===5&&e.kinds.filter(x=>x==='seclusion').length===1,e);
  ok('17 F341: the seclusion is not counted as a restraint: 4 this semester, the second is the 10/6 restraint, the seclusion apart with its own notices',e.sem===4&&e.secl===1&&e.second==='2026-10-06'&&e.seclusions===1&&e.dl===3,e);
  ok('18 F459: the DD-1 record fills CR-1’s row (written notice, release time), and CR-1 hands its notice dates back',e.r16&&e.r16.wd==='2026-10-16'&&e.r16.xt==='10:24'&&e.r16.ddId&&e.notices===5,e.r16);
  ok('19 CR-1’s breathing rule: never supine; prone only as the district’s last resort, never with asthma, epilepsy, a heart condition or reflux',e.li.some(t=>/No face-up \(supine\) hold, ever/.test(t))&&e.li.some(t=>/face-down \(prone\) hold only as the district’s last resort/.test(t)&&/asthma, epilepsy or seizures, a heart condition, reflux/.test(t))&&!e.li.some(t=>/No face-down \(prone\) or face-up/.test(t)),e.li);
  ok('20 the per-student prone choice: allowing it with asthma recorded is warned; Not allowed is carried to the case and the BIP copy',/rules out a prone restraint/.test(e.w1)&&e.w2===''&&e.prone==='no'&&e.bipProne,[e.w1,e.w2,e.prone]);
  /* ---- ABC-1 and OB-1: a restraint or a seclusion recorded there reaches the case ---- */
  const ab=await ctx.newPage();ab.on('pageerror',x=>errs.push('ABC-1: '+x.message));await ab.goto(L.BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');await sleep(900);
  const h1=await ab.evaluate(()=>{state.entries.push({id:'e1',date:'2026-10-14',time:'13:05',behaviors:['b_aggr'],consequences:['c_restraint'],antecedents:[]});const o=__nbhFactsOut();return o&&o.evidence&&o.evidence.holds;});
  ok('21 F83: a physical hold or restraint coded on ABC-1 goes to the case with its date',Array.isArray(h1)&&h1.length===1&&h1[0].date==='2026-10-14'&&h1[0].kind==='restraint',h1);
  const ob=await ctx.newPage();ob.on('pageerror',x=>errs.push('OB-1: '+x.message));await ob.goto(L.BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(900);
  const h2=await ob.evaluate(()=>{const labels=CONS.map(x=>x[1]);state.obs.push(Object.assign(blank(),{date:'2026-10-13',start:'09:00',end:'09:30',count:'2'}));state.obs[state.obs.length-1].cons={restraint:true};state.obs.push(Object.assign(blank(),{date:'2026-10-15',start:'10:00',end:'10:20',count:'1'}));state.obs[state.obs.length-1].cons={seclusion:true};
    renderSummary();const li=[...document.querySelectorAll('#sumBox li')].map(x=>x.textContent);const o=__nbhFactsOut();return {labels,li,holds:o&&o.evidence&&o.evidence.holds};});
  ok('22 F70: OB-1 asks apart about removal, seclusion and restraint',h2.labels.includes('Removed from the area or sent to the office')&&h2.labels.some(l=>/^Secluded alone/.test(l))&&h2.labels.some(l=>/^Physical restraint/.test(l))&&!h2.labels.some(l=>/office, or seclusion/.test(l)),h2.labels);
  ok('23 F70: the summary names the restraint and the seclusion first, with what the law asks',/^A physical restraint is recorded on 10\/13/.test(h2.li[0]||'')&&/^A seclusion is recorded on 10\/15/.test(h2.li[1]||'')&&/prohibited/.test(h2.li[1]||''),h2.li.slice(0,2));
  ok('24 F70: both go to the case with their dates and kinds',Array.isArray(h2.holds)&&h2.holds.length===2&&h2.holds.some(z=>z.kind==='seclusion'),h2.holds);
  /* ---- the workstation: one list, without CR-1 (F458), told from either form (F459), what an observation recorded ---- */
  const sh=await ctx.newPage();sh.on('pageerror',x=>errs.push('shell: '+x.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const g=await sh.evaluate(({dd,abc})=>{const f={data:dd.data,evidence:{'ABC-1':{holds:abc}}};
    const T=tdSafety(f),dl=rsDl(f);
    const g2={data:{incidentList:[{id:'q1',date:'2026-10-14',time:'10:00',hold:'restraint',parent:'no'}]},crisis:{deadlines:[{kind:'wn',inc:'q1',what:'Written notice to the parent before the end of the school day (restraint on 10/14)',due:'2026-10-14',done:true,event:'2026-10-14'}]}};
    const told=incTold(g2,g2.data.incidentList[0]);
    const m={data:{restraint:{deadlines:[{kind:'wn',inc:'q1',event:'2026-10-14',due:'2026-10-14',done:false,what:'Written notice (restraint on 10/14)'}]}},crisis:{deadlines:[{kind:'wn',inc:'q1',event:'2026-10-14',due:'2026-10-14',done:true,what:'Written notice (restraint on 10/14)'}]}};
    return {T:T.map(x=>x.k+' | '+x.t.replace(/<[^>]+>/g,'')+' | '+x.open),n:dl.length,told,merged:rsDl(m).length,mDone:rsDl(m)[0].done,unl:rsUnlogged(f)};},{dd:ddOut,abc:h1});
  ok('25 F458: without CR-1 in the case, Today lists DD-1’s restraint deadlines and opens DD-1',g.n>=12&&g.T.some(t=>/Incident report within 24 hours/.test(t)&&/\| DD-1$/.test(t)),g.T.slice(0,6));
  ok('26 Today names the team’s meetings from DD-1’s counts and the seclusion apart',g.T.some(t=>/crisis intervention plan/.test(t))&&g.T.some(t=>/consider an FBA and a BIP/.test(t))&&g.T.some(t=>/seclusion.*prohibited/.test(t)),g.T);
  ok('27 F459: an incident is told when Form CR-1 records the written notice; one deadline, done, when both forms hold it',g.told===true&&g.merged===1&&g.mDone===true,g);
  ok('28 F83: a restraint coded on ABC-1 that DD-1 does not have is named on Today, to be logged on DD-1',g.unl.length===1&&g.unl[0].src==='ABC-1'&&g.T.some(t=>/Form ABC-1 records a restraint on 10\/14/.test(t)),g.unl);
  /* ---- form 2547: a stand-in made here with the same box names (not the district's PDF), filled and read back ---- */
  const p=await sh.evaluate(async()=>{const s=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('#pClient','Mateo Rivera');s('#pSid','4471823');s('#pGrade','4');s('#pSite','Royal Palm School (simulated)');
    await pdfTools();const P=PDFLib,doc=await P.PDFDocument.create(),pg=doc.addPage([612,792]),fm=doc.getForm(),N=k=>'form1[0].#subform[0].'+k;let y=760;
    const tx=k=>{const t=fm.createTextField(N(k));t.addToPage(pg,{x:20,y:(y-=14),width:200,height:12});};
    ['Student_Number[0]','First_Name[0]','Middle_Name[0]','Last_Name[0]','DOB[0]','Grade[0]','Request_Date[0]','Current_School[0]','TextField2[0]','TextField2[1]','TextField2[2]','DateTimeField1[0]','DateTimeField1[1]','TextField4[0]','TextField5[0]',
     'DateTimeField4[0]','DateTimeField4[1]','DateTimeField3[0]','DateTimeField3[1]','DateTimeField2[0]','DateTimeField2[1]','TextField3[0]','TextField3[1]'].concat([...Array(12).keys()].map(i=>'TextField6['+i+']')).forEach(tx);
    [0,1,2,3].forEach(i=>{const c=fm.createCheckBox(N('CheckBox1['+i+']'));c.addToPage(pg,{x:300,y:700-i*14,width:10,height:10});});
    [0,1,2,3,4,5].forEach(i=>{const r=fm.createRadioGroup(N('RadioButtonList['+i+']'));r.addOptionToPage('0',pg,{x:350,y:700-i*14,width:10,height:10});r.addOptionToPage('1',pg,{x:370,y:700-i*14,width:10,height:10});});
    const blank=await doc.save();
    const data={date:'10/16/2026',school:'Royal Palm School (simulated)',seated:false,standing:true,prone:false,transport:false,other:'',injS:'no',injO:'yes',inj:'Others: a scratch on the aide’s arm (simulated)',
      a1:{date:'10/16/2026',ph:'561-555-0101',vm:'no',sp:'Ana Rivera (simulated)',ph2:'',vm2:'',sp2:'',em:'',oth:''},a2:{date:'',ph:'',vm:'',sp:'',ph2:'',vm2:'',sp2:'',em:'',oth:''},sent:'10/19/2026',ack:'',first:'10/16/2026',second:'',incDate:'10/16/2026',kind:'restraint'};
    const out=await f2547Fill(blank,data);const d2=await P.PDFDocument.load(out),F=d2.getForm().getFields(),v={};
    F.forEach(x=>{const n=x.getName().split('.').pop();try{v[n]=x.getText?x.getText():x.isChecked?x.isChecked():x.getSelected?x.getSelected():'';}catch(e){v[n]='?';}});
    await f2547Put(blank,'stand-in.pdf');const kept=await f2547Get();
    return {v,kept:!!(kept&&kept.v&&kept.v.length)};});
  ok('29 form 2547 filled: the student from the bar, the type ticked, the injuries, the first contact attempt and the office dates',p.v['First_Name[0]']==='Mateo'&&p.v['Last_Name[0]']==='Rivera'&&p.v['Student_Number[0]']==='4471823'&&p.v['CheckBox1[1]']===true&&p.v['CheckBox1[2]']===false&&
    p.v['RadioButtonList[0]']==='1'&&p.v['RadioButtonList[1]']==='0'&&p.v['TextField6[0]']==='561-555-0101'&&p.v['RadioButtonList[2]']==='1'&&p.v['TextField6[1]']==='Ana Rivera (simulated)'&&p.v['DateTimeField4[0]']==='10/16/2026'&&p.v['DateTimeField3[1]']==='10/19/2026'&&p.v['DateTimeField2[0]']==='10/16/2026',p.v);
  ok('30 form 2547: the signature lines and initials are left for ink; the blank form is kept on this device',!p.v['TextField2[0]']&&!p.v['TextField2[2]']&&!p.v['TextField3[0]']&&!p.v['TextField3[1]']&&p.kept,p);
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  ok('31 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
