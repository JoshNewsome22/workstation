/* v25.65 the research review of the preference and reinforcer forms, parcel PREF: Forms PA-1 and RA-1 (simulated data only).
   PA-1  H2  the wait-component mode for a social function: the default from the case until data are entered; never adds the
             functional reinforcer; the extinction line; a saved CSA keeps its arrangement
         H4  a tangible function on record: free operant first (Guide, the PS and MSWO sheets, the Summary, problem behavior)
         H5  the video / GIF format: no matching check, the RA-1 confirmation, no contingent access only with the tick
         H6  the blocking condition marked restrictive; approved by, date, parent informed; the runner locked until then
         M2  Spearman's rho against the earlier full assessment (.58), and the interval it suggests
         M3  the access in the plan, flagged beyond four times the assessment's; the high-tech line
         M4  the combined run;  M5  the method for social interactions;  M7  durability at the planned length of use
         M8  the latency-based CSA: no HC, the longest latency, the runner ends a trial at the first occurrence
         M9  vary only among the top third, and the variety check;  L1  Pace et al. (1985) and the 40% line
         L4  general education;  L5  the top two edibles within one position;  L6  the category and the substitute
   RA-1  H3  rule 9: the standing third option first; escape for problem behavior only as the labelled option
         M1  three reinforcers per step; the work output at each ratio and the observed Pmax; the plan ratio it supports
         M6  a social stimulus at a plan ratio above FR 3; Confirmed withheld for FR 1 evidence alone
         L2  the token note;  L3  the minutes of access in the hour before each session, edible access flagged
   Files saved before v25.65 open and print as before.
   usage: node qa/v2565-pref-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const PA='PA-1_Preference-Assessment-Protocol_v2026-09.html',RA='Reinforcer_Assessment_Protocol.html';
const PASRC=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation',PA),'utf8'),RASRC=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation',RA),'utf8');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const sim=async(p,k)=>{await p.evaluate(k=>{const s=document.getElementById('simScenario');if(s&&k)s.value=k;document.getElementById('simBtn').click();},k);await sleep(900);};
  const meta=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-meta="'+k+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const shown=(p,id)=>p.evaluate(id=>{const e=document.getElementById(id);return !!e&&!e.hidden&&getComputedStyle(e).display!=='none';},id);
  const text=(p,id)=>p.evaluate(id=>{const e=document.getElementById(id);return e?e.textContent.replace(/\s+/g,' ').trim():null;},id);
  const clear=async p=>{await p.evaluate(()=>document.getElementById('clearBtn').click());await sleep(400);};
  const save=async p=>{const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
  const load=async(p,obj)=>{await (await p.$('#fileIn')).setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});await sleep(700);};

  /* ============================== PA-1 ============================== */
  let p=await open(PA);
  /* L1, L4, M9, H4 (guide text) */
  ok('L1 the single-stimulus bands credit Pace et al. (1985) for the 80% line, give their 50% line, and keep LP < 40% as stricter',
    /The 80% line is from Pace et al\. \(1985\)/.test(PASRC)&&/non-preferred at 50% or less/.test(PASRC)&&/stricter than Pace et al\.&rsquo;s 50%/.test(PASRC)&&/LP &lt; 40%/.test(PASRC));
  ok('L4 rule 1 and the Indirect sheet: in general education a brief MSWO plus the student’s own nomination is enough to start',
    (PASRC.match(/brief MSWO (?:plus|and) the student&rsquo;s own nomination/g)||[]).length>=2&&/Resetar &amp; Noell, 2008/.test(PASRC));
  ok('M9 vary only among items in the top third, never the top item replaced by a mix of moderate items, with the mixed evidence cited',
    /Vary only among items in the top third\. Do not replace the top item with a mix of moderate items/.test(PASRC)&&/Wine &amp; Wilder, 2009/.test(PASRC)&&/Bowman et al\., 1997/.test(PASRC));
  ok('M2 the Monitoring sheet calls the daily brief MSWO an option, not a requirement, and no longer prescribes daily for edibles and weekly for leisure',
    /an option for edibles and for motivation checks, not a requirement/.test(PASRC)&&!/Daily before sessions for edibles, weekly or at plan review for leisure items/.test(PASRC));
  ok('M8 the Guide and the unit select offer the latency-based CSA (trial ends at the first occurrence, or at 5 min)',
    /<option value="lat">Latency to the first occurrence \(s\): the trial ends there, or at 5 min<\/option>/.test(PASRC)&&/17&ndash;19 occurrences per participant/.test(PASRC));

  /* H4: a tangible function in the case */
  await sim(p,'clear');
  let r=await p.evaluate(()=>{nbhCase.apply({behaviors:[{label:'Grabbing items (simulated)',urg:2}],fn:{key:'tangible',label:'Tangible'},src:{fn:'FS-1'}});
    const t=id=>{const e=document.getElementById(id);return e&&!e.hidden?e.textContent:'';};return {ps:t('tanFlag-ps'),ms:t('tanFlag-ms'),pb:t('paPbTan'),g:t('paFnRule3'),sum:t('pa65Flags')};});
  ok('H4 tangible function on record: the flag on the paired-stimulus and MSWO sheets, the line under Problem behavior across methods, the Guide and the Summary say free operant first',
    /Tangible function on record \(Form FS-1\)\. Paired-stimulus and MSWO formats remove each item after access/.test(r.ps)&&r.ps===r.ms&&/Use free operant first, then a video format or response restriction/.test(r.pb)&&/free operant first/.test(r.g)&&/Method order.*Free operant is the first method/.test(r.sum),r);
  r=await p.evaluate(()=>{nbhCase.apply({fn:{key:'multiple',label:'Escape and tangible',perBehavior:[{label:'Hitting',fn:'Escape',fnKey:'escape'},{label:'Grabbing',fn:'Tangible',fnKey:'tangible'}]},src:{fn:'FS-1'}});return !document.getElementById('tanFlag-ps').hidden;});
  ok('H4 a tangible function as one of several (per behavior) counts too',r);

  /* H5: the video format */
  await meta(p,'psFormat','Video / GIF');await sleep(150);
  r={box:await shown(p,'vid-ps'),fl:await shown(p,'vidFlag-ps')};
  await meta(p,'psVidAcc','no');await sleep(150);r.fl2=await text(p,'vidFlag-ps');r.fl2s=await shown(p,'vidFlag-ps');
  await meta(p,'psVidRA',true);await sleep(150);r.fl3=await shown(p,'vidFlag-ps');r.sum=await text(p,'pa65Flags');
  ok('H5 Video / GIF on the paired-stimulus sheet opens the clip fields; no contingent access without the RA-1 tick is flagged, and the tick clears it; the Summary says to confirm the top item',
    r.box&&!r.fl&&r.fl2s&&/No contingent access is allowed only with the tick above/.test(r.fl2)&&!r.fl3&&/Video \/ GIF format on Paired stimulus: confirm the top item in Form RA-1 or in the treatment data/.test(r.sum),r);
  ok('H5 every selection sheet offers Video / GIF; rule 5 puts video first for social interactions and activities; no matching check for video',
    (PASRC.match(/<option>Video \/ GIF<\/option>/g)||[]).length===3&&/Video or GIF first<\/b> for social interactions and for activities that cannot be brought to the table/.test(PASRC)&&/format needs no matching check/.test(PASRC));

  /* M3, L6: the plan's access and the category */
  r=await p.evaluate(()=>{const set=(i,u,v)=>{const e=document.querySelector('#paUseTbl input[data-u="'+u+'"][data-i="'+i+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set(1,'plan','10 min');set(1,'cat','bubbles and wands');set(2,'plan','45 s');document.activeElement&&document.activeElement.blur();
    const f=i=>document.getElementById('paUseF'+i).textContent;return {f1:f(1),f2:f(2),f0:f(0),sum:document.getElementById('pa65Flags').textContent,n:[...document.querySelectorAll('#paUseTbl tbody tr')].length};});
  ok('M3 an item whose plan access (10 min) is more than four times the assessment’s (30 s) is flagged; 45 s is not; the tablet gets the high-tech line',
    /Hierarchies can differ between brief and long access\. Assess this item at its plan duration, or confirm it in RA-1 at that magnitude/.test(r.f1)&&!/Hierarchies/.test(r.f2)&&/High-tech items may need long access to work\. Consider accumulated access \(token exchange\) instead of 30-s deliveries/.test(r.f0)&&r.n===6,r);
  r=await p.evaluate(()=>{const set=(i,v)=>{const e=document.querySelector('#paUseTbl input[data-u="cat"][data-i="'+i+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set(0,'screens');set(4,'Screens');return document.getElementById('pa65Flags').textContent;});
  ok('L6 the top item’s category prints the substitute line, naming the other items of that category',/Substitute: if Tablet \(video\) is unavailable, a substitute from the same category \(screens: Musical toy\) is a reasonable first choice; confirm it in the data/.test(r),r);

  /* M2: stability since the earlier assessment */
  r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#paPrevTbl tbody tr')].map(t=>[t.children[0].textContent,+t.children[1].textContent]);
    const order=rows.slice().sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    const set=(nm,v)=>{const i=[...document.querySelectorAll('#paPrevTbl tbody tr')].findIndex(t=>t.children[0].textContent===nm);const e=document.querySelectorAll('#paPrevTbl tbody input')[i];e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    order.forEach((nm,k)=>set(nm,String(k+1)));const a=document.getElementById('paStabOut').textContent;
    order.forEach((nm,k)=>set(nm,String(order.length-k)));const b=document.getElementById('paStabOut').textContent;
    document.getElementById('paStabUse').click();return {a,b,sel:document.getElementById('mReassess').value,set:!document.getElementById('mReassessSet').disabled||!!document.getElementById('mReassessDue').value,n:rows.length};});
  ok('M2 the same order as before: rho = 1.00, stable, about 3 months; the reverse order: shifting, monthly; Use the suggestion sets the schedule, and it parses to a date',
    /Spearman’s rho = 1\.00 across 6 items ranked both times: stable/.test(r.a)&&/about every 3 months/.test(r.a)&&/rho = -1\.00/.test(r.b)&&/shifting/.test(r.b)&&/Full assessment monthly/.test(r.b)&&r.sel==='Full assessment monthly'&&r.set,r);
  await clear(p);await meta(p,'pool','Edibles');await sleep(100);const e1=await text(p,'paStabOut');await meta(p,'pool','Social interactions');await sleep(100);const e2=await text(p,'paStabOut');
  ok('M2 with no earlier ranks: about 3 months for an edible pool, about 6 weeks (shorter) for a social pool',/about every 3 months/.test(e1)&&/about every 6 weeks/.test(e2)&&/shorter than for edibles/.test(e2),{e1,e2});

  /* M5, M4 */
  r={soc:await shown(p,'paSocAid'),socT:await text(p,'paSocAid')};await meta(p,'pool','Combined run: the top two from each category');await sleep(100);r.comb=await shown(p,'paCombAid');r.soc2=await shown(p,'paSocAid');r.sum=await text(p,'pa65Flags');
  ok('M5 a pool of social interactions shows the method by repertoire (verbal PS, picture MSWO, video or SIPA) and praise as its own item in the student’s languages',
    r.soc&&/The student talks and can name the interactions: a verbal paired-stimulus assessment/.test(r.socT)&&/picture MSWO/.test(r.socT)&&/social interaction preference assessment \(SIPA\)/.test(r.socT)&&/List praise as its own item, in the languages the student hears at home and at school/.test(r.socT),r);
  ok('M4 the combined run: separate pools stay the default, the combined run is optional, and a displaced item is confirmed in RA-1 before it is dropped',
    r.comb&&!r.soc2&&/an item displaced in the combined run may still reinforce; confirm it in Form RA-1 before dropping it/i.test(r.sum)&&/Assess them in separate pools\./.test(PASRC)&&/leisure items sometimes rank above every edible/.test(PASRC),r);

  /* L5: two edibles within one position on the MSWO */
  await clear(p);
  r=await p.evaluate(()=>{const nm=['Pretzel','Fruit snack','Cheese puff','Goldfish crackers','Graham cracker','Apple juice'];
    document.querySelectorAll('#poolTbl input[data-f="name"]').forEach((e,i)=>{e.value=nm[i];e.dispatchEvent(new Event('input',{bubbles:true}));});
    document.querySelectorAll('#poolTbl select[data-f="type"]').forEach(e=>{e.value='Edible';e.dispatchEvent(new Event('input',{bubbles:true}));});
    const pick=(s,t,v)=>{const e=document.querySelector('#msTbl select[data-s="'+s+'"][data-t="'+t+'"]');e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));};
    [[0,1,2,3,4,5],[1,0,2,3,4,5],[0,1,3,2,4,5],[1,0,2,4,3,5],[0,1,2,3,5,4]].forEach((o,s)=>o.forEach((v,t)=>pick(s,t,v)));
    return {on:!document.getElementById('paEdChk').hidden,t:document.getElementById('paEdChkTxt').textContent};});
  await meta(p,'msEdTop','1');await sleep(100);r.res=await text(p,'msEdOut');
  ok('L5 an edible pool whose top two are within one position on the MSWO suggests a 5-trial concurrent choice (Fritz et al., 2020), and reads its result',
    r.on&&/The top two edibles are within one position: Pretzel \(mean position 1\.4\) and Fruit snack \(1\.6\)/.test(r.t)&&/5 trials/.test(r.t)&&/Fruit snack chosen 4 of 5: the plan names it/.test(r.res),r);

  /* M8: the latency-based CSA */
  await clear(p);await meta(p,'csaUnit','lat');await sleep(200);
  r=await p.evaluate(()=>{const set=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    [20,22,18].forEach((v,s)=>set('#csaTbl input[data-c="'+s+'"]',v));const L=[[200,240,260],[45,30,40],[25,20,15]];
    L.forEach((a,i)=>a.forEach((v,s)=>{set('#csaTbl input[data-i="'+i+'"][data-f="e'+(s+1)+'"]',80);set('#csaTbl input[data-i="'+i+'"][data-f="p'+(s+1)+'"]',v);}));
    const c=i=>document.getElementById('csaTbl-C'+i).textContent,R=i=>document.getElementById('csaTbl-R'+i).textContent;
    return {head:[...document.querySelectorAll('#csaTbl thead th')].map(t=>t.textContent).join('|'),c:[c(0),c(1),c(2)],R:[R(0),R(1),R(2)],ro:document.getElementById('csaReadout').textContent,box:!document.getElementById('csaLatBox').hidden,
      sum:document.getElementById('pa65Flags').textContent,menu:(window.__nbhFactsOut()||{}).menu||[],max:document.querySelector('#csaTbl input[data-i="0"][data-f="p1"]').getAttribute('max')};});
  ok('M8 latency: the table reads latency against the control, the longest mean latency is marked, an item 10 s or more longer is Longer than control, no item is HC, and the case gets no HC verdict',
    /Latency vs control/.test(r.head)&&/Longest latency/.test(r.c[0])&&/Longer than control/.test(r.c[1])&&/Not longer than control/.test(r.c[2])&&r.R[0]==='+213 s'&&/no item is HC/.test(r.ro)&&r.box&&r.max==null&&
    /Confirm the longest-latency item in a brief treatment check; for some students it needs blocking and redirection/.test(r.sum)&&!r.menu.some(m=>m.csa&&/^HC/.test(m.csa.verdict)),r);
  r=await p.evaluate(async()=>{const b=document.getElementById('pa-run-csa-cond');b.value='0';b.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('pa-run-csa-start').click();await new Promise(r=>setTimeout(r,1300));
    document.getElementById('pa-run-csa-pb').click();await new Promise(r=>setTimeout(r,200));const st=document.getElementById('pa-run-csa-sum').textContent;document.getElementById('pa-run-csa-discard').click();await new Promise(r=>setTimeout(r,300));return st;});
  ok('M8 the runner ends a latency trial at the first occurrence and writes the seconds to it',/first occurrence at \d+ s/.test(r)&&/latency \(s\) \d+/.test(r),r);
  r=await p.evaluate(()=>{nbhCase.apply({behaviors:[{label:'Head hitting (simulated)',urg:3}],fn:{key:'automatic',label:'Automatic'}});const u=document.getElementById('csaUnit');u.value='pct';u.dispatchEvent(new Event('input',{bubbles:true}));u.dispatchEvent(new Event('change',{bubbles:true}));
    const e=document.getElementById('csaLatRec');return e.hidden?'':e.textContent;});
  ok('M8 behavior that can injure (TB-1 urgency 3) suggests the latency-based CSA',/Consider Target-behavior unit: Latency to the first occurrence/.test(r),r);
  await p.close();

  /* H2: the wait-component mode */
  p=await open(PA);
  await p.evaluate(()=>{nbhCase.apply({behaviors:[{label:'Yelling (simulated)',urg:2}],fn:{key:'attention',label:'Attention'},src:{fn:'FS-1'}});});await sleep(300);
  r=await p.evaluate(()=>{
    return {mode:document.getElementById('csaMode').value,box:!document.getElementById('csaWaitBox').hidden,ctrl:document.querySelector('#csaTbl tbody tr td').textContent,
      opt:document.querySelector('#pa-run-csa-cond option[value="c"]').textContent,warn:document.getElementById('csaFnWarn').textContent,box2:document.getElementById('csaWaitBox').textContent.replace(/\s+/g,' ')};});
  ok('H2 a social function in the case with no CSA data sets the wait-component mode: the control is the plan’s wait with no item, the functional reinforcer is never added, and the extinction line prints',
    r.mode==='wait'&&r.box&&r.ctrl==='Control (wait, no item)'&&r.opt==='Control (wait, no item)'&&/never adds delivery of the functional reinforcer/.test(r.warn)&&
    /This assessment never adds delivery of the functional reinforcer/.test(r.box2)&&/Where the approved plan uses extinction during the wait component, that is an extinction step; it is in the plan, not added by this assessment/.test(r.box2),r);
  r=await p.evaluate(async()=>{document.getElementById('pa-run-csa-cond').value='c';document.getElementById('pa-run-csa-start').click();await new Promise(r=>setTimeout(r,300));const m=document.getElementById('pa-run-csa-msg').textContent;document.getElementById('pa-run-csa-endearly').click();await new Promise(r=>setTimeout(r,200));document.getElementById('pa-run-csa-discard').click();await new Promise(r=>setTimeout(r,200));return m;});
  ok('H2 the runner’s control trial in the wait component: the plan’s response only, nothing added',/the plan’s wait component with no item\. Problem behavior gets only the response the approved plan gives; nothing is added/.test(r),r);
  ok('H2 the Guide says the published method reinforces problem behavior on purpose and is written in TD-1 only as a labelled option, never the default',
    /That reinforces problem behavior on purpose, and this sheet does not add it/.test(PASRC)&&/Form TD-1 writes it as a labelled option that reinforces problem behavior on purpose, never as the default/.test(PASRC));
  const out=await p.evaluate(()=>(window.__nbhFactsOut()||{}).prefs);
  ok('H2 the case carries the arrangement for Form TD-1 (prefs.csa.mode wait)',out&&out.csa&&out.csa.mode==='wait',out);
  await p.close();
  /* a CSA saved before v25.65, under a social function: it keeps the no-item control */
  p=await open(PA);await sim(p,'auto');const saved=await save(p);delete saved.meta.csaMode;
  ['cat','plan','prev'].forEach(k=>saved.stim.forEach(s=>delete s[k]));['csaBlockBy','csaBlockDate','csaBlockParent'].forEach(k=>delete saved.meta[k]);await load(p,saved);
  r=await p.evaluate(()=>{nbhCase.apply({fn:{key:'escape',label:'Escape'},src:{fn:'FS-1'}});return {mode:document.getElementById('csaMode').value,box:!document.getElementById('csaWaitBox').hidden,hc:document.getElementById('csaReadout').textContent,
    vid:[...document.querySelectorAll('.pa65-vid')].every(e=>e.hidden),blk:document.getElementById('csaBlockFlag').textContent,by:document.getElementById('csaBlockBy').value,stab:document.querySelector('#paPrevTbl tbody input').value,
    unprinted:['paUseBox','paStabBox','paVarRow','csaDurRow'].every(id=>document.getElementById(id).classList.contains('pa65-empty'))};});
  ok('saved files: a CSA saved before v25.65 keeps the no-item control under a social function and its HC results; the new fields stay empty and off the printout, and its blocking condition, run with no approval recorded, is flagged',
    r.mode===''&&!r.box&&/3 HC by 80% reduction vs control/.test(r.hc)&&r.vid&&r.by===''&&/approval is not complete/.test(r.blk)&&r.stab===''&&r.unprinted,r);

  /* H6: the blocking condition */
  r=await p.evaluate(async()=>{const cb=document.querySelector('#csaRunSet input[data-run="pb"]');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
    const fl=document.getElementById('csaBlockFlag').textContent,box=!document.getElementById('csaBlockBox').hidden,h4=(document.querySelector('#csaTbl-pb').closest('.csa-cond').querySelector('h4')||{}).textContent;
    const b=document.getElementById('pa-run-csa-blk');b.value='pb';b.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('pa-run-csa-cond').value='0';document.getElementById('pa-run-csa-start').click();await new Promise(r=>setTimeout(r,200));
    return {fl,box,h4,msg:document.getElementById('pa-run-csa-msg').textContent,run:document.getElementById('pa-run-csa-start').textContent};});
  ok('H6 switching on the blocking condition marks it RESTRICTIVE, opens the approval fields, flags the missing approval (free access and prompted engagement already run: no order flag), and the runner will not start it',
    r.box&&/RESTRICTIVE/.test(r.h4)&&/its approval is not complete/.test(r.fl)&&!/only after free access/.test(r.fl)&&/^Locked: the blocking condition is a restrictive step/.test(r.msg)&&r.run==='Start trial',r);
  await meta(p,'csaBlockBy','BCBA (simulated)');await meta(p,'csaBlockDate','10/30/2026');await meta(p,'csaBlockParent','10/30/2026, phone (Form IC-1)');
  r=await p.evaluate(async()=>{const fl=document.getElementById('csaBlockFlag');const t=fl.hidden?'':fl.textContent;document.getElementById('pa-run-csa-start').click();await new Promise(r=>setTimeout(r,300));
    const run=document.getElementById('pa-run-csa-start').textContent;document.getElementById('pa-run-csa-endearly').click();await new Promise(r=>setTimeout(r,200));document.getElementById('pa-run-csa-discard').click();await new Promise(r=>setTimeout(r,200));return {t,run};});
  ok('H6 with approved by, date and parent informed filled, the approval flag is gone and the runner starts the condition',!/approval is not complete/.test(r.t)&&r.run==='Pause',r);
  ok('H6 the sheet prints that blocking works as extinction of the sensory result, only after free access and prompted engagement, never the default; HC with disruption is kept',
    /Blocking works as extinction of the behavior&rsquo;s sensory result\. It is used only after free access and prompted engagement have been run, and never as the default\./.test(PASRC)&&/HC with disruption/.test(PASRC));

  /* M7: durability */
  await meta(p,'csaUseLen','30');await sleep(100);const d1=await p.evaluate(()=>[...document.querySelectorAll('#csaDurRow .pa65-dur')].every(e=>!e.hidden));
  await meta(p,'csaDurFirst','2');await meta(p,'csaDurLast','6');await sleep(100);
  r={d1,out:await text(p,'csaDurOut'),pref:await p.evaluate(()=>((window.__nbhFactsOut()||{}).prefs||{}).csa)};
  ok('M7 a 30-min period of use (more than 3 times the 5-min trial) asks for the first and last thirds; the last third more than twice the first says rotate about every 10 min or offer several HC items; the case carries it and the re-test rule',
    r.d1&&/rotate item sets about every 10 min, or offer several HC items at once/.test(r.out)&&r.pref&&/Rotate item sets about every 10 min/.test(r.pref.rotate||'')&&/rises above the validation level on 2 consecutive days/.test(r.pref.retest||''),r);

  /* M9: the variety check */
  await meta(p,'varRes','Chose the varied set');await sleep(100);
  ok('M9 the variety check records the student’s choice and says to vary among the top third',/vary among the items in the top third/.test(await text(p,'paVarOut')));
  await clear(p);r=await p.evaluate(()=>{const cb=document.querySelector('#csaRunSet input[data-run="pb"]');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));return document.getElementById('csaBlockFlag').textContent;});
  ok('H6 blocking switched on before free access and prompted engagement have data: the order is flagged',/Blocking is used only after free access and prompted engagement have been run; free access has no data yet; prompted engagement has not been switched on/.test(r),r);
  await p.close();

  /* ============================== RA-1 ============================== */
  p=await open(RA);
  ok('H3 rule 9: a standing third option from the first session is the default; problem behavior ends the session and the pairing is redesigned; escape for problem behavior is kept only as the labelled option, with what, why, how long and what data end it',
    /From the first session, keep a standing third option<\/b> \(the neutral spot, with no demand and nothing to win\)/.test(RASRC)&&/follow the safety plan, end the session \(Ended early: Problem behavior\) and redesign the pairing/.test(RASRC)&&
    /<b>OPTION: Reinforces problem behavior on purpose:<\/b>/.test(RASRC)&&/What it does:/.test(RASRC)&&/For how long:/.test(RASRC)&&/What the data must show before it ends:/.test(RASRC)&&!/Allow the student to avoid making either choice \(for example, reinforce the problem behavior with escape\), collect/.test(RASRC));
  await meta(p,'coMode','coa');await sleep(150);
  r={def:await p.evaluate(()=>{const s=document.querySelector('[data-meta="coa_third"]');return {v:s.value,t:s.options[s.selectedIndex].textContent};}),why0:await shown(p,'coaThirdWhy')};
  await meta(p,'coa_third','esc');await sleep(100);r.why1=await shown(p,'coaThirdWhy');r.t=await text(p,'coaThirdTxt');
  ok('H3 COA Setup: the third option defaults to the standing neutral spot; choosing the labelled option explains it and asks why',
    r.def.v===''&&/\(default\)/.test(r.def.t)&&!r.why0&&r.why1&&/OPTION: Reinforces problem behavior on purpose\. What it does:/.test(r.t),r);
  await meta(p,'coMode','st');
  /* M1: three per step, the work output and the observed Pmax */
  await sim(p);
  r=await p.evaluate(()=>({out:document.getElementById('prOutTxt').textContent,pm:document.getElementById('raPmaxSum').textContent,circles:document.querySelectorAll('#prOut circle').length}));
  ok('M1 the progressive-ratio sheet draws the work output at each ratio, marks the observed Pmax, and the Summary prints the plan ratio it supports, under the parameters',
    /Tablet \(video\): observed Pmax FR \d+/.test(r.out)&&r.circles>3&&/Plan ratio supported/.test(r.pm)&&/Tablet \(video\): at or just below FR \d+/.test(r.pm)&&/Under these parameters only: Progression \+2/.test(r.pm)&&!/Picture book/.test(r.pm),r);
  r=await p.evaluate(()=>{const s=document.getElementById('prRep');s.value='3';s.dispatchEvent(new Event('change',{bubbles:true}));return null;});await sleep(500);
  r=await p.evaluate(()=>{const h=[...document.querySelectorAll('#prTbl thead th')].map(t=>t.textContent).filter(t=>/^FR/.test(t));return {h:h.slice(0,7),par:document.getElementById('prParams').textContent};});
  ok('M1 Each ratio three times: three columns per ratio, and the parameters say so',r.h.join(',')==='FR 1,FR 1,FR 1,FR 3,FR 3,FR 3,FR 5'&&/each ratio three times/.test(r.par),r);
  ok('M1 the concurrent-operants sheet has the same-class tick',/data-meta="coSameClass"> Stimuli from the same class \(two edibles, two screens\): also compare at the plan ratio/.test(RASRC));
  /* M6, L2 */
  r=await p.evaluate(()=>{const t=document.querySelector('#stimTbl select[data-f="type"][data-i="1"]');t.value='Social / attention';t.dispatchEvent(new Event('input',{bubbles:true}));
    const n=document.getElementById('raSocNote');return {n:n.hidden?'':n.textContent,v:[...document.querySelectorAll('#sumTbl tbody tr')].map(x=>x.lastElementChild.textContent),note:document.getElementById('sumNote').textContent,out:(window.__nbhFactsOut()||{}).reinf.items.map(x=>x.verdict)};});
  ok('M6 a social stimulus at a plan ratio of FR 5 shows the dense-schedule note; tested only at FR 1, it reads Probable, not Confirmed, on the Summary and in the case',
    /Attention often reinforces only on dense schedules\. Run the progressive-ratio sheet, or test at the plan ratio, before attention carries a thin schedule alone/.test(r.n)&&r.v[0]==='Confirmed'&&r.v[1]==='Probable'&&r.out[1]==='Probable'&&/a social stimulus tested only at FR 1; the plan ratio is FR 5/.test(r.note),r);
  r=await p.evaluate(()=>{const t=document.querySelector('#stimTbl select[data-f="type"][data-i="2"]');t.value='Token';t.dispatchEvent(new Event('input',{bubbles:true}));return document.getElementById('raTokNote').hidden?'':document.getElementById('raTokNote').textContent;});
  ok('L2 a token under test: test it on the progressive-ratio sheet against the backup items alone, and record pre-session access to the backup items',
    /Test the token on the progressive-ratio sheet against the backup items alone/.test(r)&&/Record any pre-session access to the backup items, because it can lower an edible.s break point/.test(r),r);
  /* L3 */
  r=await p.evaluate(()=>{const t=document.querySelector('#stimTbl select[data-f="type"][data-i="0"]');t.value='Edible';t.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-recadd="pr"]').click();const row=document.querySelector('#recTbl-pr tbody tr:last-child');const set=(f,v)=>{const e=row.querySelector('[data-rf="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('sess','1');set('preMin','10');return {head:document.querySelector('#recTbl-pr thead').textContent,out:document.getElementById('recOut-pr').textContent};});
  ok('L3 the session record takes the minutes of access in the hour before; edible access in that hour is flagged; the MO rule says so, and treats activities apart',
    /Access, hour before \(min\)/.test(r.head)&&/Edible access in the hour before session 1 \(10 min\)/.test(r.out)&&/longer restriction \(a day or more\) may raise engagement/i.test(RASRC)&&/record it\./.test(RASRC),r);
  /* a file saved before v25.65 */
  await p.close();p=await open(RA);await sim(p);const rs=await save(p);(rs.rec||[]).forEach(x=>delete x.preMin);delete rs.meta.coa_third;rs.prRep=2;
  await load(p,rs);r=await p.evaluate(()=>({rep:document.getElementById('prRep').value,v:[...document.querySelectorAll('#sumTbl tbody tr')].map(x=>x.lastElementChild.textContent),th:document.querySelector('[data-meta="coa_third"]').value}));
  ok('saved files: an RA-1 file from before v25.65 (each ratio twice, no third option recorded) opens as saved',r.rep==='2'&&r.v.join()==='Confirmed,Confirmed,Not supported'&&r.th==='',r);
  await p.close();
 }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
 ok('no page errors',!errs.length,errs);
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
