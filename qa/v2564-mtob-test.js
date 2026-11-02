/* v25.64 Forms MT-1 and OB-1 against the JABA measurement research (the BCBA's approved recommendations; simulated data only).
   MT-1  H4  the chooser: the typical episode, about how many, what matters most; a suggested measure; the interval longer
             than an episode flagged; the observer teaching with a short momentary interval.
         H5  the momentary sentence of the Guide; the missed-effect caution on every verdict and under the graph; partial
             interval on a falling behavior.        M2  a behavior under 10% in 15 minutes or less.
         M1  kappa under point-by-point, flagged below .60.   H7  coverage in each condition, pairings, possible drift.
         M4  each observer checked against a scored example (90%, 4 to 6 weeks, after an agreement flag); the blind tick.
         L6  each pause of the timer: when, how long, why; a pause while a plan procedure ran is flagged.
         L7  the observer also teaching: a T on the graph.       An older file opens as before.
   OB-1  H3  the tap times saved by the Live Recorder; observer 2's file lined up by its Start; block-by-block (carried),
             exact count per block, time window +-2 s, total count labelled; tap times that no longer match a count fall
             back to the total count.            M1  interval kappa.   M2  the chance of seeing none.
         H7  coverage by arrangement, pairings, drift.   M4  the checks on Setup and in the observation plan.
         L7  the teaching tick, the FS-1 statement and the outside observer.   An older file opens as before.
   usage: node qa/v2564-mtob-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const MT=L.BASE+'/NBH-Workstation/MT-1_Discontinuous-Measurement_v2026-09.html',OB=L.BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html';
const mock=()=>{window.__asked=[];nbhUI.confirm=async t=>{window.__asked.push(String(t));return true;};window.confirm=()=>true;window.__alerts=[];window.alert=t=>{window.__alerts.push(String(t));};window.print=()=>{};};
(async()=>{const br=await L.chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  /* ======================= MT-1 ======================= */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('MT-1 '+e.message));await p.goto(MT);await sleep(1200);await p.evaluate(mock);
  const H4=await p.evaluate(async()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    const rd=()=>({s:document.getElementById('mtSuggest').textContent.replace(/\s+/g,' '),f:document.getElementById('mtChooseFlag').textContent.replace(/\s+/g,' ')});const o={};
    set('mins','10');set('iv','20');set('ttype','Reduction target');set('epLen','8');set('epN','12');set('matter','How often');o.often=rd();
    set('epN','100');o.many=rd();set('matter','How long');o.long=rd();set('epLen','3');o.tiny=rd();
    set('epLen','90');set('ttype','Acquisition target');o.inc=rd();
    set('ttype','Reduction target');set('method','Momentary time sampling');set('iv','10');const t=document.querySelector('[data-m="teach"]');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));o.teach=rd();o.teachMeta=S.meta.teach;
    t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));return o;});
  ok('MT-1 H4 how often, 12 countable episodes: count them on OB-1; a 20-s interval longer than an 8-s episode is flagged (Wirth et al., 2014)',/Count the episodes on Form OB-1/.test(H4.often.s)&&/12 in 10 minutes/.test(H4.often.s)&&/longer than a typical episode \(8 seconds\): error grows sharply \(Wirth et al\., 2014\)/.test(H4.often.f),H4.often);
  ok('MT-1 H4 too many to count (100 in 10 minutes): partial interval, 10-second, labelled as undercounting',/Partial interval, 10-second intervals\. It estimates how often, and undercounts when episodes come several to an interval/.test(H4.many.s),H4.many);
  ok('MT-1 H4 how long: momentary time sampling no longer than the episode (5 s here); a 3-s episode: time each one on OB-1',/Momentary time sampling.*no longer than the typical episode: with this observation length, 5 seconds or shorter/.test(H4.long.s)&&/Time each episode/.test(H4.tiny.s),[H4.long,H4.tiny]);
  ok('MT-1 H4 a behavior being increased: whole interval or momentary time sampling, 60 s or shorter for a 90-s episode',/Whole interval or momentary time sampling.*60 seconds or shorter/.test(H4.inc.s)&&!/longer than a typical episode/.test(H4.inc.f),H4.inc);
  ok('MT-1 H4/L7 the observer teaching with 10-s momentary intervals: the agreement caution (Hanley et al., 2007); the tick keeps "1"',/also teaching: a very short momentary interval can lower agreement/.test(H4.teach.f)&&H4.teachMeta==='1',H4.teach);
  /* H5, M2 */
  const H5=await p.evaluate(async()=>{const o={};const g=document.querySelector('section.only-guide').textContent.replace(/\s+/g,' ');
    o.guide=/Its errors are not biased on average, but in any one observation they can be large\. It tends to read low when the behavior fills little of the time and high when it fills most of it\. It is least accurate in short observations/.test(g);
    o.old=/about equally often/.test(g);
    S.meta.method='Partial interval';S.meta.ttype='Reduction target';S.meta.mins='10';S.meta.iv='20';S.marks={};for(let i=0;i<30;i++)S.marks[i]=i<2?'1':'0';renderAll();
    o.v=document.getElementById('sumVerdict').textContent.replace(/\s+/g,' ');
    S.meta.mins='20';S.meta.iv='20';S.marks={};for(let i=0;i<60;i++)S.marks[i]=i<2?'1':'0';renderAll();o.v20=document.getElementById('sumVerdict').textContent;return o;});
  ok('MT-1 H5 the Guide\'s momentary sentence is the corrected one, and "about equally often" is gone',H5.guide&&!H5.old,H5);
  ok('MT-1 H5 the verdict: partial interval on a reduction target understates the improvement, and the missed-effect caution',/As the behavior falls, the overestimate grows, so the graph will understate the improvement/.test(H5.v)&&/Interval measures tend to show less change than really occurred\. A small drop, or none, does not show that the plan failed\. Check against a count or a timed sample before changing the plan\./.test(H5.v),H5.v);
  ok('MT-1 M2 scored in under 10% of a 10-minute observation: add observations across the day; at 20 minutes, not said',/poorly estimated by short observations\. Add observations across the day before comparing phases/.test(H5.v)&&!/poorly estimated/.test(H5.v20),H5);
  /* the simulation: M1, H7, M4, L7, the graph note */
  await p.evaluate(async()=>{await loadSim();});await sleep(400);
  const SIM=await p.evaluate(()=>{const o={};const pm=v=>v==='1'||v==='0';let a=0,t=0,o1=0,o2=0;
    for(let i=0;i<30;i++){const x=S.marks[i],y=S.ioa[i];if(!pm(x)||!pm(y))continue;t++;if(x===y)a++;o1+=x==='1';o2+=y==='1';}
    const pe=(o1*o2+(t-o1)*(t-o2))/(t*t),po=a/t;o.hand=((po-pe)/(1-pe)).toFixed(2);
    o.kap=(document.querySelector('#ioaOut .metric .kap')||{}).textContent;
    o.cov=[...document.querySelectorAll('#mtIoaCov table.mt-cov tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim()).join('|'));
    o.pair=[...document.querySelectorAll('#mtIoaCov table.mt-pair tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim()).join('|'));
    o.drift=!!document.querySelector('#mtIoaCov .mt-drift');o.note=document.getElementById('mtPlotNote').textContent;
    o.T=[...document.querySelectorAll('#mtPlot text.mt-mark')].map(t=>t.textContent);o.ck=document.getElementById('mtCkNote').textContent;
    o.last=S.sess[S.sess.length-1];o.default=document.querySelector('section.only-log').textContent.replace(/\s+/g,' ');
    o.out=window.__nbhFactsOut().intervals.sessions[6];return o;});
  ok('MT-1 M1 kappa under point-by-point, as computed by hand from the simulation\'s marks ('+SIM.hand+')',SIM.kap==='kappa '+SIM.hand&&+SIM.hand>=.6,SIM);
  ok('MT-1 H7 each condition\'s IOA coverage (Baseline 1 of 3, Plan 2 of 4), at or above 20%, with no drift flag',JSON.stringify(SIM.cov)===JSON.stringify(['Baseline|1 of 3|33%|At or above 20%','Plan|2 of 4|50%|At or above 20%'])&&!SIM.drift,SIM.cov);
  ok('MT-1 H7 agreement by observer pairing, from each IOA session\'s second observer',SIM.pair.length===2&&SIM.pair.some(r=>/^Aide A \(simulated\) with Jordan Ellis, M\.A\., BCBA \(simulated\)\|2\|91\.7%$/.test(r))&&SIM.pair.some(r=>/with Behavior technician \(simulated\)\|1\|90\.0%$/.test(r)),SIM.pair);
  ok('MT-1 H7 the default printed with the log: a quarter to a third of sessions in every condition, rotate the second observer, the primary observer not told',/IOA on at least a quarter to a third of sessions in every condition, spread across times, activities and observers\. Rotate the second observer\. Where possible, the primary observer does not know which session will be checked/.test(SIM.default),'');
  ok('MT-1 H5/L7 under the graph the missed-effect caution, and a T over session 6 (the aide was also running the group)',/^Interval measures tend to show less change than really occurred/.test(SIM.note)&&/T above a point/.test(SIM.note)&&JSON.stringify(SIM.T)==='["T"]',{note:SIM.note,T:SIM.T});
  ok('MT-1 M4 the simulation\'s observers were checked (95%, 100%); its non-occurrence flag asks for both to be checked again',!/no check against a scored example/.test(SIM.ck)&&/agreement figure on this sheet is flagged: check both observers/.test(SIM.ck),SIM.ck);
  ok('MT-1 H7/M1 the logged sheet keeps its second observer and kappa, and the case carries them',SIM.last.obs2==='Jordan Ellis, M.A., BCBA (simulated)'&&SIM.last.kap===SIM.hand&&SIM.out.obs2===SIM.last.obs2&&SIM.out.kap===SIM.hand,{last:SIM.last,out:SIM.out});
  const DR=await p.evaluate(()=>{const o={};const keep=JSON.parse(JSON.stringify(S.sess));
    S.sess[3].ioa='75.0 / 70.0 / 72.0';S.sess[6].ioa='78.0 / 70.0 / 80.0';renderSess();o.cond=(document.querySelector('#mtIoaCov .mt-drift')||{}).textContent||'';
    S.sess=JSON.parse(JSON.stringify(keep));S.sess[3].ioa='';S.sess[6].ioa='';renderSess();o.none=[...document.querySelectorAll('#mtIoaCov table.mt-cov tbody tr')].map(tr=>tr.cells[3].textContent);
    S.sess=JSON.parse(JSON.stringify(keep));S.sess[3].ioa='99.0 / 99.0 / 99.0';S.sess[3].obs2='Behavior technician (simulated)';S.sess[0].ioa='80.0 / 80 / 80';S.sess[6].ioa='81.0 / 80.0 / 80.0';renderSess();o.pair=(document.querySelector('#mtIoaCov .mt-drift')||{}).textContent||'';
    S.sess=keep;renderSess();return o;});
  ok('MT-1 H7 possible drift: Plan\'s mean agreement (76.5%) 10 or more points below Baseline\'s (93.3%)',/Possible drift: mean agreement in Plan \(76\.5%\) is 10 or more points below Baseline \(93\.3%\)/.test(DR.cond),DR);
  ok('MT-1 H7 a condition with no IOA session is flagged',DR.none[1]==='No IOA session in this condition',DR.none);
  ok('MT-1 H7 possible drift: one pairing 10 or more points above the others',/Possible drift: Aide A \(simulated\) with Behavior technician \(simulated\) agree 10 or more points above the other pairings \(99\.0% against 80\.5%\)/.test(DR.pair),DR.pair);
  /* M1 below .60; M4 the checks */
  const K=await p.evaluate(()=>{const o={};S.ioa={};for(let i=0;i<30;i++)S.ioa[i]=i%3?S.marks[i]:(S.marks[i]==='1'?'0':'1');renderSum();
    o.kap=document.querySelector('#ioaOut .kap').textContent;o.flag=(document.querySelector('#ioaOut .mt-kap')||{}).textContent||'';
    S.meta.ck1Pct='85';S.meta.ck2Date='';S.meta.ck2Pct='';S.meta.ck2Ex='';S.meta.ck1Date='2026-01-05';S.meta.date='10/1/26';renderSum();o.ck=document.getElementById('mtCkNote').textContent;return o;});
  ok('MT-1 M1 kappa below .60 is flagged, as Hartmann\'s suggestion and not a validated cut-off',/below \.60/.test(K.kap)&&/below \.60.*Hartmann.s \(1977\) suggestion, not a validated cut-off/.test(K.flag),K);
  ok('MT-1 M4 an observer at 85% (below 90%), last checked 38 weeks before; a second observer with no check; an agreement flag asks for a new check',/85% correct against the example, below this form.s 90%/.test(K.ck)&&/last checked 38 weeks before this session/.test(K.ck)&&/Second observer \(Jordan Ellis[^)]*\)\): no check against a scored example/.test(K.ck)&&/check both observers against the scored example again/.test(K.ck),K.ck);
  /* L6 the pauses */
  const PZ=await p.evaluate(async()=>{const o={};S.marks={};S.ioa={};S.meta.ioaOn='No';S.meta.mins='5';S.meta.iv='5';delete S.meta.lastCap;renderAll();
    const st=document.getElementById('tmrStart');st.click();await new Promise(r=>setTimeout(r,1300));st.click();await new Promise(r=>setTimeout(r,1300));
    const sel=document.querySelector('#tmrPz select[data-pz="0"]');o.panel=!document.getElementById('tmrPz').hidden&&!!sel;sel.value='A plan procedure running';sel.dispatchEvent(new Event('change',{bubbles:true}));
    st.click();await new Promise(r=>setTimeout(r,200));o.p=JSON.parse(JSON.stringify(S.meta.pauses));o.out=document.getElementById('pzOut').textContent;
    window.mtTimer.reset();for(let i=0;i<10;i++)S.marks[i]=i<4?'1':'0';renderSum();await captureSheet(false);o.row=S.sess[S.sess.length-1];
    renderSess();o.cell=document.querySelectorAll('#sessTbl tbody tr')[S.sess.length-1].textContent;o.P=[...document.querySelectorAll('#mtPlot text.mt-mark')].map(t=>t.textContent);
    let blob=null;const A0=HTMLAnchorElement.prototype.click,U0=URL.createObjectURL;HTMLAnchorElement.prototype.click=function(){};URL.createObjectURL=b=>{blob=b;return 'blob:x';};
    document.getElementById('csvBtn').click();HTMLAnchorElement.prototype.click=A0;URL.createObjectURL=U0;o.csv=blob?await blob.text():'';
    window.__asked=[];window.__ans=true;document.getElementById('clearSheet').click();await new Promise(r=>setTimeout(r,200));o.cleared=S.meta.pauses===undefined;return o;});
  ok('MT-1 L6 Pause keeps when it began, how long it lasted and why (chosen under the timer)',PZ.panel&&PZ.p.length===1&&PZ.p[0].at>=1&&PZ.p[0].len>=1&&/^\d{1,2}:\d\d:\d\d$/.test(PZ.p[0].wall)&&PZ.p[0].why==='A plan procedure running',PZ.p);
  ok('MT-1 L6 time paused while a plan procedure ran is flagged on the sheet: measured outside the procedure only (Carroll & Kodak, 2014)',/Timer paused 1 time/.test(PZ.out)&&/Measured outside the procedure only/.test(PZ.out)&&/Carroll & Kodak, 2014/.test(PZ.out),PZ.out);
  ok('MT-1 L6 the logged row, its log cell, a P on the graph and the CSV keep it; Clear sheet clears the pauses',PZ.row.pzProc==='1'&&/1 pause, 0:0\d, 1 while a plan procedure ran/.test(PZ.row.pz)&&/measured outside the procedure only/.test(PZ.cell)&&PZ.P.includes('P')&&/"Timer pauses"/.test(PZ.csv)&&/\(measured outside the procedure only\)"/.test(PZ.csv)&&PZ.cleared,{row:PZ.row,P:PZ.P});
  /* save and open: the new fields round trip; an older file opens as before */
  const RT=await p.evaluate(async()=>{const o={};S.meta.epLen='12';S.meta.matter='How long';S.meta.teach='1';S.meta.blind='1';S.meta.ck1Pct='95';
    const json=JSON.stringify({form:'MT-1',rev:'2026-09',S});const put=async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'f.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));};
    S=blank();renderAll();await put(json);o.back=[S.meta.epLen,S.meta.matter,S.meta.teach,S.meta.blind,S.meta.ck1Pct,document.querySelector('[data-m="teach"]').checked,document.querySelector('[data-m="blind"]').checked,document.querySelector('[data-m="matter"]').value];
    const old={form:'MT-1',rev:'2026-09',S:{meta:{client:'SIMULATED – Old File',method:'Partial interval',mins:'10',iv:'20',cols:'4',ioaOn:'Yes',obs:'Aide A (simulated)'},marks:{0:'1',1:'0'},ioa:{0:'1',1:'0'},
      sess:[{d:'9/1/26',m:'Partial interval',r:'1:2',len:'10 min',n:'30',p:'40.0',ioa:'90.0 / 80.0 / 92.0',chg:'',ph:'Baseline',note:''},{d:'9/2/26',m:'Partial interval',r:'1:2',len:'10 min',n:'30',p:'30.0',ioa:'',chg:'',ph:'Baseline',note:''}]}};
    await put(JSON.stringify(old));o.old={teach:document.querySelector('[data-m="teach"]').checked,ep:document.querySelector('[data-m="epLen"]').value,p:S.sess.map(r=>r.p).join(),pair:[...document.querySelectorAll('#mtIoaCov table.mt-pair tbody tr')].map(tr=>tr.cells[0].textContent).join(),
      pz:document.getElementById('pzOut').textContent,chance:[...document.querySelectorAll('#ioaOut .chance')].length};return o;});
  ok('MT-1 the chooser\'s answers, the ticks and the checks are saved with the file and open again',JSON.stringify(RT.back)===JSON.stringify(['12','How long','1','1','95',true,true,'How long']),RT.back);
  ok('MT-1 an older file opens as before: its log and agreement, no ticks, no pauses, the observers of its rows "not recorded"',RT.old.teach===false&&RT.old.ep===''&&RT.old.p==='40.0,30.0'&&RT.old.pair==='observer not recorded with second observer not recorded'&&RT.old.pz===''&&RT.old.chance===3,RT.old);
  await p.close();

  /* ======================= OB-1 ======================= */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('OB-1 '+e.message));q.on('console',m=>{if(m.type()==='error')errs.push('OB-1 console '+m.text());});await q.goto(OB);await sleep(1200);await q.evaluate(mock);
  const blankCov=await q.evaluate(()=>({hd:document.getElementById('covHead').hidden,zero:document.getElementById('obZero').textContent}));
  ok('OB-1 a blank record shows no coverage table and no chance line',blankCov.hd===true&&blankCov.zero==='',blankCov);
  /* H3: an observation recorded with tap times; observer 2's file */
  const T0=Date.UTC(2026,9,20,14,0,0);
  const H3=await q.evaluate(async T0=>{const o={};const ob=state.obs[0];
    Object.assign(ob,{date:'2026-10-20',start:'10:00',end:'10:01',mins:'1',count:'5',peerCount:'0',taps:{s:[1,5,12,25,41],p:[]},rec:{t0:T0,dur:60,pz:[]}});
    ob.obs2On=true;render();
    const file={meta:{observer:'Behavior technician (simulated)',ck1Date:'2026-10-01',ck1Ex:'A scored video',ck1Pct:'96'},cfg:state.cfg,
      obs:[{date:'2026-10-19',start:'09:00',count:'2',rec:{t0:T0-864e5,dur:60,pz:[]},taps:{s:[3,4],p:[]}},
           {date:'2026-10-20',start:'10:00',count:'7',peerCount:'0',iv:[],peerIv:[],rec:{t0:T0,dur:60,pz:[]},taps:{s:[1.5,6,8,13,33,41.5,55],p:[]}}]};
    const put=async d=>{const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'o2.json',{type:'application/json'}));const fi=document.getElementById('obs2FileIn');fi.dataset.obs='0';fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));};
    o.btn=!!document.querySelector('.obs-page button.obs2File');await put(file);const a=ioa(state.obs[0]);
    o.asked=window.__asked.splice(0);o.count2=state.obs[0].count2;o.second=state.obs[0].secondObs;o.ck2=state.meta.ck2Pct;o.block=a.block;o.agree=a.agree;o.count=a.count;
    const pg=document.querySelectorAll('.obs-page')[0];o.line=pg.querySelector('p.ioa').textContent;o.field=pg.querySelector('input[data-field="agree"]').value;
    o.sum=[...document.querySelectorAll('#sumBox li')].map(x=>x.textContent).join(' || ');o.draft=draft();
    /* observer 2 started 2 s earlier, so their taps sit 2 s later on their own clock: lined up, the figures are the same */
    const f2=JSON.parse(JSON.stringify(file));f2.obs[1].rec.t0=T0-2000;f2.obs[1].rec.dur=62;f2.obs[1].taps.s=f2.obs[1].taps.s.map(x=>x+2);await put(f2);o.shift=ioa(state.obs[0]).block;window.__asked.splice(0);
    /* a count typed by hand that no longer matches the taps: the total count is carried */
    state.obs[0].count='6';render();const b=ioa(state.obs[0]);o.stale={block:b.block,agree:b.agree,line:document.querySelectorAll('.obs-page')[0].querySelector('p.ioa').textContent};
    state.obs[0].count='5';render();return o;},T0);
  ok('OB-1 H3 Open observer 2\'s file picks the observation recorded at the same Start, asks first, and fills the observer 2 columns, the name and their check',H3.btn&&H3.asked.length===1&&/a count of 7, a peer count of 0, with the tap times/.test(H3.asked[0])&&H3.count2==='7'&&H3.second==='Behavior technician (simulated)'&&H3.ck2==='96',H3);
  ok('OB-1 H3 block-by-block 44.4% over 6 blocks of 10 s (2/3, 1, 0, 0, 1, 0), exact count per block 33.3% (2 of 6), time window 50% (4 of 8 taps matched)',H3.block&&H3.block.p===44.4&&H3.block.n===6&&H3.block.exact.p===33.3&&H3.block.exact.k===2&&H3.block.tw.p===50&&H3.block.tw.k===4&&H3.block.tw.n===8,H3.block);
  ok('OB-1 H3 the block-by-block figure is carried in Agreement (%), and total count (71.4%) is labelled as not showing the same events were counted',H3.agree===44.4&&H3.field==='44.4'&&H3.count.p===71.4&&/^Agreement: block-by-block 44\.4% \(6 blocks of 10 s\), carried; exact count per block 33\.3% \(2 of 6\); time window ±2 s 50% \(4 of 8 taps matched\);.* count 71\.4% \(5 and 7; total count, which does not show the observers counted the same events\)/.test(H3.line),H3.line);
  ok('OB-1 H3 the carried figure below 80% is named in the summary, and the summary and FS-1 statement say block-by-block was carried',/Observation 1: block-by-block 44\.4% \(6 blocks of 10 s\), total count agreement 71\.4%/.test(H3.sum)&&/block-by-block agreement from both observers’ tap times in 1 of them, the figure carried/.test(H3.sum)&&/observation 1 on 10\/20\/2026, block-by-block 44\.4%, total count 71\.4%/.test(H3.draft),{sum:H3.sum,draft:H3.draft});
  ok('OB-1 H3 the two records are lined up by their Starts: observer 2 starting 2 s earlier gives the same blocks and figures',H3.shift&&H3.shift.p===44.4&&H3.shift.n===6&&H3.shift.tw.p===50&&H3.shift.tw.k===4&&H3.shift.off===-2,H3.shift);
  ok('OB-1 H3 tap times that no longer match a count: the total count is carried, and the line says why',H3.stale.block&&H3.stale.block.stale&&H3.stale.agree===85.7&&/the tap times no longer match the counts, so the total count is carried/.test(H3.stale.line),H3.stale);
  /* the Live Recorder saves the tap times */
  const REC=await q.evaluate(async()=>{const o={};const s=document.getElementById('obrStart');s.click();await new Promise(r=>setTimeout(r,300));
    const t=document.getElementById('obrTapS');t.click();await new Promise(r=>setTimeout(r,250));t.click();await new Promise(r=>setTimeout(r,250));t.click();await new Promise(r=>setTimeout(r,300));
    document.getElementById('obrEnd').click();await new Promise(r=>setTimeout(r,300));document.getElementById('obrSave').click();await new Promise(r=>setTimeout(r,600));
    const ob=state.obs.find(x=>x.taps&&x.taps.s.length===3);o.taps=ob&&ob.taps;o.rec=ob&&ob.rec;o.count=ob&&ob.count;return o;});
  ok('OB-1 H3 the Live Recorder saves each tap\'s time (seconds from Start) and the Start on the wall clock with the observation',REC.count==='3'&&REC.taps.s.length===3&&REC.taps.s.every((v,i,a)=>v>=0&&(!i||v>=a[i-1]))&&REC.rec.t0>1.7e12&&REC.rec.dur>0&&Array.isArray(REC.rec.pz),REC);
  /* the simulation: M1, M2, H7, M4 */
  await q.evaluate(async()=>{await loadSim();});await sleep(600);
  const SM=await q.evaluate(()=>{const o={};o.sum=[...document.querySelectorAll('#sumBox li')].map(x=>x.textContent).join(' || ');o.ioa2=document.querySelectorAll('.obs-page')[1].querySelector('p.ioa2').textContent;
    o.zero=document.getElementById('obZero').textContent;o.draft=draft();o.z72=zeroPct(1,20);
    o.cov=[...document.querySelectorAll('#covWrap table.obcov tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim()).join('|'));
    o.pair=[...document.querySelectorAll('#covWrap table.obpair tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim()).join('|'));o.drift=(document.querySelector('#covWrap .obdrift')||{}).textContent||'';
    o.plan=document.getElementById('planBox').textContent;o.k=kIOA([true,true,false,false,true,false,false,false,false,false],[true,false,false,false,true,false,false,true,false,false],10).k;return o;});
  ok('OB-1 M1 interval kappa on the stricter-checks line, and kappa below .60 named on a line of its own (observation 2: 0.00)',/interval kappa 0\.00, below \.60 \(Hartmann’s suggestion, not a validated cut-off\)/.test(SM.ioa2)&&/Observation 2: interval kappa 0\.00, below \.60/.test(SM.sum),SM.ioa2);
  ok('OB-1 M1 kappa as computed by hand: 8 of 10 alike, chance .58, kappa .52',Math.abs(SM.k-(0.8-0.58)/(1-0.58))<1e-9,SM.k);
  ok('OB-1 M2 the chance of seeing none at the pooled rate (6.9 per hour): observation 2, 40 min, about 1%; at 1 per hour a 20-minute observation, about 72%',/\(6\.9 per hour\)/.test(SM.zero)&&/observation 2 \(40 min\) about 1%, and none was seen/.test(SM.zero)&&SM.z72==='about 72%',SM.zero);
  ok('OB-1 M2 the FS-1 statement qualifies the observation with none',/The behavior was not seen in observation 2 \(40 minutes\); at the rate across the observations \(6\.9 per hour\), an observation that long would show none about 1% of the time\./.test(SM.draft),SM.draft);
  ok('OB-1 H7 coverage by arrangement: independent work 1 of 2, small group 1 of 1',JSON.stringify(SM.cov)===JSON.stringify(['Independent work|1 of 2|50%|At or above 20%','Small group|1 of 1|100%|At or above 20%']),SM.cov);
  ok('OB-1 H7 agreement by pairing, and possible drift where small group\'s mean (0%) is 10 or more points below independent work\'s (90%)',SM.pair.length===2&&/Possible drift: mean agreement in Small group \(0%\) is 10 or more points below Independent work \(90%\)/.test(SM.drift),{pair:SM.pair,drift:SM.drift});
  ok('OB-1 M4 the simulation\'s observers are checked (no "no check" line); its flagged agreement asks for a new check',!/no check against a scored example/.test(SM.plan)&&/An agreement figure is flagged \(Summary\): check both observers against the scored example again/.test(SM.plan),SM.plan);
  /* M4 below 90; L7 the teaching ticks */
  const L7=await q.evaluate(()=>{const o={};state.meta.ck1Pct='80';render();o.plan=document.getElementById('planBox').textContent;state.meta.ck1Pct='95';
    document.querySelectorAll('.obs-page input[data-field="teach"]').forEach(c=>{c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});
    o.teach=state.obs.map(x=>x.teach);o.plan2=document.getElementById('planBox').textContent;o.draft=draft();o.blind=document.querySelectorAll('.obs-page input[data-field="blind"]').length;
    const old=JSON.parse(JSON.stringify(state));old.obs.forEach(x=>{delete x.teach;delete x.blind;delete x.taps;delete x.rec;});['ck1Date','ck1Ex','ck1Pct','ck2Date','ck2Ex','ck2Pct'].forEach(k=>delete old.meta[k]);return {o,old:JSON.stringify(old)};});
  ok('OB-1 M4 an observer at 80% is named in the observation plan, below this form\'s 90%',/The observer scored 80% against the scored example, below this form’s 90%/.test(L7.o.plan),L7.o.plan);
  ok('OB-1 L7 every observation ticked "also running the class": the plan asks for an outside observer, and the FS-1 statement says so',L7.o.teach.every(Boolean)&&/have an outside observer make at least one observation/.test(L7.o.plan2)&&/The observer was also running the class during observations 1, 2 and 3/.test(L7.o.draft)&&L7.o.blind===1,L7.o);
  const OLD=await q.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'old.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));
    return {n:state.obs.length,ag:[...document.querySelectorAll('input[data-field="agree"]')].map(x=>x.value),ticks:[...document.querySelectorAll('input[data-field="teach"]')].map(x=>x.checked),ck:document.getElementById('mCk1Pct').value,plan:document.getElementById('planBox').textContent};},L7.old);
  ok('OB-1 an older file opens as before: the same agreement figures (90 typed, 0 total count), no ticks, the checks empty and asked for in the plan',OLD.n===3&&OLD.ag.join()==='90,0,'&&OLD.ticks.every(x=>!x)&&OLD.ck===''&&/The observer has no check against a scored example recorded/.test(OLD.plan),OLD);
  const G=await q.evaluate(()=>({g:document.getElementById('guide').textContent.replace(/\s+/g,' '),r:document.getElementById('sumRules').textContent.replace(/\s+/g,' ')}));
  ok('OB-1 the Guide says what the code does: block-by-block carried from the tap times, total count labelled, kappa as Hartmann\'s suggestion, coverage and drift, the chance of none',/The figure carried is then block-by-block agreement/.test(G.g)&&/Total count agreement is kept as a fourth figure/.test(G.g)&&/Hartmann’s \(1977\) suggestion, not a validated cut-off/.test(G.g)&&/Possible drift/.test(G.g)&&/72% of the time/.test(G.g)&&/block-by-block \(where both observers’ tap times are held\)/.test(G.r),'');
  await q.close();
  ok('no page errors in either form',!errs.length,errs.slice(0,4));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
