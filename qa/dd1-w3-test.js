/* Form DD-1, review Wave 3 part 1: an incident adds to the day's count only when asked, and the cell says so (F101); a
   behavior watched for part of the day has its own minutes (F102); latency counts a cue with no response at the longest
   wait, and the day's notes say how many were answered (F103); a trend is flat when the fitted change stays inside the
   envelope (F105); the week's change is called only when it is one, and the incident note does not promise the plan stays
   the same after a hold (F107). Simulated data only. usage: node qa/dd1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const DD='Daily_Behavior_Data_and_Visual_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+DD);await sleep(1200);
  await p.evaluate(async()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;await loadExample();});await sleep(600);

  /* ---- F101 the incident's one ---- */
  const a=await p.evaluate(()=>{const b=S.behaviors.find(x=>ddCountable(x)),r=sortedRows()[sortedRows().length-1],was=num(r.values[b.id])||0;
    ddIncOpen(null);const d=document.getElementById('dlgInc'),c=d.querySelector('#incCount');const def=c.checked,lab=d.querySelector('#incCountT').textContent;
    const set=(k,v)=>{const e=d.querySelector(k);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#incDate',r.date);set('#incBeh',b.id);set('#incWhat','Pushed the chair over (simulated)');const lab2=d.querySelector('#incCountT').textContent;d.querySelector('#incSave').click();
    const i=S.incidents[S.incidents.length-1],now1=num(S.rows.find(x=>x.date===r.date).values[b.id])||0;
    ddIncOpen(i.id);const d2=document.getElementById('dlgInc');const reopened=d2.querySelector('#incCount').checked;d2.querySelector('#incCount').checked=true;d2.querySelector('#incSave').click();
    const now2=num(S.rows.find(x=>x.date===r.date).values[b.id])||0;const inp=document.querySelector(`#dataTable tr[data-r="${CSS.escape(r.id)}"] input[data-v="${CSS.escape(b.id)}"]`);
    return {def,lab,lab2,was,now1,counted1:false,now2,counted2:i.counted,reopened,cls:inp?inp.className:'',title:inp?inp.title:''};});
  ok('1 F101 a new incident does not add to the day\'s count unless asked: the box starts unticked and says why',a.def===false&&/^This one is not on the sheet yet: add one to .*’s count of /.test(a.lab2)&&a.now1===a.was&&a.reopened===false,a);
  ok('2 F101 ticked, it adds one, and the day\'s cell is marked and says it includes the incident\'s one',a.now2===a.was+1&&a.counted2===true&&/inc-cell/.test(a.cls)&&/^Includes 1 added from the incident log\. To take it off, edit the incident/.test(a.title),a);
  const lg=await p.evaluate(()=>{const b=S.behaviors.find(x=>ddCountable(x)),d=sortedRows()[sortedRows().length-2].date;
    const r1=window.ddLogIncident({date:d,time:'10:20',beh:b.name,what:'Hit the table (simulated)'}),r2=window.ddLogIncident({date:d,time:'11:00',beh:b.name,what:'Hit the table again (simulated)',count:true});return {c1:r1.inc&&r1.inc.counted,c2:r2.inc&&r2.inc.counted};});
  ok('3 F101 Log it now counts only when asked',lg.c1===false&&lg.c2===true,lg);
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const ln=await sh.evaluate(async()=>{const c0=document.getElementById('pClient');c0.value='Mateo Rivera';c0.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,300));try{await logNowOpen();}catch(e){}await new Promise(r=>setTimeout(r,400));const c=document.getElementById('lnCount');return {has:!!c,checked:c?c.checked:null,lab:c?c.parentNode.textContent.trim():''};});
  ok('4 F101 the workstation\'s Log it now asks before adding to the day\'s count (unticked)',ln.has&&ln.checked===false&&/^This one is not on the data sheet yet: add one to the day’s count$/.test(ln.lab),ln);

  /* ---- F102 a behavior watched for part of the day ---- */
  const m=await p.evaluate(async()=>{const b=S.behaviors[0];b.measure='rate';b.obsLength='Single period';delete b.obsMin;const r=sortedRows()[0];r.obsMin='';r.values[b.id]='6';renderBehaviors();renderData();renderResults();
    const v1=plotValue(r,b),w=document.querySelector(`#behTable tr[data-b="${CSS.escape(b.id)}"] .dd-obswarn`),w1=w&&getComputedStyle(w).display!=='none'?w.textContent:'';
    const res=[...document.querySelectorAll('.dd-obswarn')].map(e=>e.textContent).join(' | ');
    const inp=document.querySelector(`#behTable tr[data-b="${CSS.escape(b.id)}"] [data-f="obsMin"]`);inp.value='45';inp.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(z=>setTimeout(z,200));
    const w2=document.querySelector(`#behTable tr[data-b="${CSS.escape(b.id)}"] .dd-obswarn`);return {v1,w1,res,v2:plotValue(r,b),w2:getComputedStyle(w2).display,obsMin:b.obsMin,head:(S.settings.showDefs=true,renderData(),[...document.querySelectorAll('.sd-m')].map(t=>t.textContent).join('|'))};});
  ok('5 F102 a rate watched for a single period with no minutes of its own: divided by the day\'s 360 minutes, and said on its row and in the results',m.v1===1&&/^Watched for “Single period”, but its rate is divided by the day’s minutes until its minutes observed are set\./.test(m.w1)&&/no minutes observed are set for it, so its rate is computed over the day's minutes \(360 min by default\)/.test(m.res),m);
  ok('6 F102 given its 45 minutes, 6 responses read 8 an hour, the warning goes, and the sheet\'s column says the minutes',m.v2===8&&m.w2==='none'&&m.obsMin==='45'&&/Single period \(45 min\)/.test(m.head),m);

  /* ---- F103 latency ---- */
  const lat=async cap=>p.evaluate(async cap=>{const b=S.behaviors[1];b.measure='latency';b.latMax=cap;renderBehaviors();renderData();await new Promise(z=>setTimeout(z,150));
    const st=document.getElementById('ddlStart');st.click();await new Promise(z=>setTimeout(z,200));
    const go=()=>document.querySelector(`#ddlCards [data-act="go"][data-b="${CSS.escape(b.id)}"]`),alt=()=>document.querySelector(`#ddlCards [data-act="alt"][data-b="${CSS.escape(b.id)}"]`);
    for(let k=0;k<2;k++){go().click();await new Promise(z=>setTimeout(z,60));alt().click();await new Promise(z=>setTimeout(z,60));}
    go().click();await new Promise(z=>setTimeout(z,80));go().click();await new Promise(z=>setTimeout(z,80));
    const P=ddLive.plan();const c=P.cells.find(x=>x.b&&x.b.id===b.id);const sum=document.getElementById('ddlSum')?document.getElementById('ddlSum').textContent:'';
    document.getElementById('ddlEnd').click();await new Promise(z=>setTimeout(z,150));document.getElementById('ddlDiscard').click();await new Promise(z=>setTimeout(z,300));
    return {n:c&&c.n,s:c&&c.s,note:c&&c.note,sum};},cap);
  const l1=await lat('2'),l0=await lat('');
  ok('7 F103 with a longest wait of 2 min, the two cues with no response count at 2 min each in the mean (3 cues, about 4 min), and the day\'s note says 1 of 3 answered',
    l1.n===3&&l1.s>=4&&l1.s<4.1&&/: 1 of 3 cues answered \(no response counted at 2 min\)$/.test(l1.note||''),l1);
  ok('8 F103 with none set, the mean is the response\'s alone, and the note still says 1 of 3 answered',l0.n===1&&l0.s<0.1&&/: 1 of 3 cues answered \(no response left out of the mean\)$/.test(l0.note||''),l0);
  const rn=await p.evaluate(()=>{const r={notes:'Fire drill'};ddLive.note(r,'Latency, X: 1 of 3 cues answered');ddLive.note(r,'Latency, X: 1 of 3 cues answered');return r.notes;});
  ok('9 F103 the line goes into the day\'s notes once, after what is there',rn==='Fire drill · Latency, X: 1 of 3 cues answered',rn);

  /* ---- F105 the trend ---- */
  const tr=await p.evaluate(()=>({flat:trendDirection(0.17,'decrease',0.1,5,2.5),up:trendDirection(1,'decrease',0.1,5,2.5),floor:trendDirection(0.05,'decrease',0.1,5,0),zero:trendDirection(0.2,'decrease',0.1,5,0),
    cap:[...document.querySelectorAll('.caution')].map(e=>e.textContent).find(t=>/called flat/.test(t))||''}));
  ok('10 F105 a baseline slope of 0.17 a day whose change across the phase stays inside the envelope is flat, not accelerating; a real rise still is; the rule is said',
    tr.flat.word==='flat (zero-celerating)'&&tr.flat.rule==='envelope'&&tr.up.word==='accelerating'&&tr.floor.rule==='floor'&&tr.zero.word==='accelerating'&&/changes, across the condition, by no more than the stability envelope's half-width/.test(tr.cap),tr);

  /* ---- F107 the week's change and the notes home ---- */
  const ch=await p.evaluate(()=>{const b={measure:'count',kind:'target',direction:'decrease'},pb={measure:'trials',kind:'acquisition',direction:'increase'};
    return {small:ddChange(b,{mean:2.0},{mean:1.9}),real:ddChange(b,{mean:1},{mean:2}),fifteen:ddChange(b,{mean:10},{mean:8.5}),pts:ddChange(pb,{mean:60},{mean:63}),pts2:ddChange(pb,{mean:60},{mean:75})};});
  ok('11 F107 a fall from 2.0 to 1.9 a day is about the same; a rise from 1 to 2 is up 100% (worse); under 20% is about the same; a percentage needs five points',
    ch.small.t==='about the same (down 5%)'&&ch.small.k===''&&ch.real.t==='up 100%'&&ch.real.k==='bad'&&/^about the same/.test(ch.fifteen.t)&&ch.pts.k===''&&ch.pts2.k==='good',ch);
  const nt=await p.evaluate(()=>{const d=sortedRows()[sortedRows().length-1].date;S.rows.forEach(r=>{if(r.date>=d)r.phaseType=r.phaseType==='full'?'none':r.phaseType;});
    return {held:ddIncNoteText({date:d,hold:'restraint',what:'Hit an adult (simulated)'}),plain:ddIncNoteText({date:d,hold:'',what:'Threw a pencil (simulated)'})};});
  ok('12 F107 the incident note does not promise the plan stays the same after a restraint; with no hold and no new phase it still says so',
    /The team will look at what happened and let you know if anything in .*’s plan changes\./.test(nt.held)&&!/plan stays the same/.test(nt.held)&&/plan stays the same/.test(nt.plain),nt);
  ok('13 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
