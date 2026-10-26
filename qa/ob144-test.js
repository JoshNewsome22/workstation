/* v24.44 Form OB-1 polished (review V17: R-052, R-053, R-055, R-056; E-28, E-30): the interval rules' errors in the Guide
   (Powell, Martindale, & Kulp, 1975) and the sample's coverage on the Summary; momentary time sampling for a timed behavior
   and an untouched sample fitted to the planned length; Florida's restraint and seclusion law in one shared constant that
   OB-1, ABC-1 and EA-1 read, worded as Form CR-1's statute summary; twelve narrative lines on a blank observation and
   Print blank observation sheets (n); # and Date kept in view on the Log; Duplicate this observation's setup; the Live
   Recorder's question before saving an observation under a minute and the time on its Save button.
   usage: node qa/ob144-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,700)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const pdfInfo=f=>{try{const o=cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps({"n":d.page_count,"t":[p.get_text() for p in d]}))',f]).toString();return JSON.parse(o);}catch(e){return null;}};
const flat=t=>String(t||'').replace(/\s+/g,' ');
const OB='OB-1_Direct-Observation-Record_v2026-09.html';
const W=fs.readdirSync(path.join(ROOT,'NBH-Workstation'));const file=p=>W.find(f=>f.startsWith(p));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(f,vp)=>{const p=await b.newPage({viewport:vp||{width:1300,height:950}});p.on('pageerror',e=>errs.push(f.slice(0,6)+': '+String(e).slice(0,200)));
   await p.goto(BASE+'/NBH-Workstation/'+f);await sleep(1500);
   await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};window.__asked=[];nbhUI.confirm=async(m)=>{window.__asked.push(String(m));return window.__answer!==false;};});return p;};
 const print=async(p,name)=>{await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});const f=path.join(OUT,name);fs.writeFileSync(f,buf);const i=pdfInfo(f);return i?{n:i.n,all:flat(i.t.join(' ')),pages:i.t.map(flat)}:{n:0,all:'',pages:[]};};

 /* ---- R-053: one constant, in every form, worded as CR-1's summary ---- */
 let p=await open(file('CR-1_'));
 const cr=await p.evaluate(()=>({law:window.nbhLaw||null,frozen:Object.isFrozen(window.nbhLaw||{}),txt:document.body.innerHTML.replace(/<[^>]+>/g,' ').replace(/&sect;/g,'§').replace(/\s+/g,' ')}));await p.close();
 const L=cr.law||{};
 ok('R-053 the shared constant window.nbhLaw is in Form CR-1 (frozen), with the students covered, the seclusion and restraint subsections, the notices and the box lines',
   !!cr.law&&cr.frozen&&L.covered==='students with an IEP'&&L.seclusionCite==='s. 1003.573(2), F.S.'&&L.restraintCite==='s. 1003.573(7), F.S.'&&/before the end of that school day/.test(L.restraintDue)&&/within 24 hours/.test(L.restraintDue)&&/within 3 school days/.test(L.restraintDue)&&/1003\.573\(7\)/.test(L.restraintDue)&&/1003\.573\(2\)/.test(L.seclusion)&&!!L.seclusionBox&&!!L.restraintBox,L);
 ok('R-053 every claim in it is in Form CR-1\'s statute summary: students covered are those with an individual education plan, seclusion prohibited under (2), the incident report within 24 hours (7)(a), the written notice before the end of the school day (7)(c), the report by mail within 3 school days (7)(d)',
   /A child with an individual education plan/.test(cr.txt)&&/prohibited outright for school personnel under § 1003\.573\(2\)/.test(cr.txt)&&/\(7\)\(a\) A school shall prepare an incident report within 24 hours/.test(cr.txt)&&/\(7\)\(c\)[^.]*notify the parent[^.]*\. Such notification must be in writing and provided before the end of the school day/.test(cr.txt)&&/\(7\)\(d\)[^.]*by mail within 3 school days/.test(cr.txt),cr.txt.slice(0,200));
 p=await open(file('EA-1_'));
 const ea=await p.evaluate(()=>({same:JSON.stringify(window.nbhLaw),spans:[...document.querySelectorAll('[data-nbh-law]')].map(e=>e.getAttribute('data-nbh-law')+'='+e.textContent),old:/seclusion with students with disabilities/.test(document.body.innerHTML)}));await p.close();
 ok('R-053 Form EA-1\'s two seclusion checks name the students covered and the subsection from the constant (no "students with disabilities" left), and EA-1 holds the same constant',
   ea.same===JSON.stringify(L)&&ea.spans.filter(x=>x==='covered=students with an IEP').length===2&&ea.spans.filter(x=>x==='seclusionCite=s. 1003.573(2), F.S.').length===2&&!ea.old,ea);
 p=await open(file('ABC_Recording'));
 const abc=await p.evaluate(()=>({same:JSON.stringify(window.nbhLaw),src:[...document.scripts].some(s=>/the law asks for '\+\(\(window\.nbhLaw\|\|\{\}\)\.restraintDue/.test(s.textContent)),old:[...document.scripts].some(s=>/the parent’s written notice is due before the end of the school day, the incident report within 24 hours and the report by mail within 3 school days \(s\. 1003\.573, F\.S\.\): log it/.test(s.textContent))}));await p.close();
 ok('R-053 Form ABC-1\'s restraint notice (a hold coded on a saved incident) reads the constant, and ABC-1 holds the same constant',abc.same===JSON.stringify(L)&&abc.src&&!abc.old,abc);

 /* ---- OB-1 ---- */
 p=await open(OB);
 const law=await p.evaluate(()=>({same:JSON.stringify(window.nbhLaw),labs:[...document.querySelectorAll('#obsPages input[data-group="cons"],#obsPages .chk')].map(e=>e.textContent.trim()).filter(t=>/Secluded|Physical restraint/.test(t))}));
 ok('R-053 OB-1\'s "What Followed the Behavior" boxes carry the law\'s words and subsections from the constant',law.same===JSON.stringify(L)&&law.labs.some(t=>t==='Secluded alone in a room or area ('+L.seclusionBox+')')&&law.labs.some(t=>t==='Physical restraint ('+L.restraintBox+')'),law.labs);
 const guide=await p.evaluate(()=>{const g=document.getElementById('guide');return {li:[...g.querySelectorAll('li')].map(l=>l.textContent.replace(/\s+/g,' ')).find(t=>/^What each rule gets wrong/.test(t))||'',cite:g.querySelector('.cite').textContent.replace(/\s+/g,' ')};});
 ok('R-052 E-28 Guide section 5 says what each rule over- or underestimates (partial interval over, whole interval under, momentary time sampling both ways), naming Powell, Martindale and Kulp (1975), and the reference list carries it in order',
   /Powell, Martindale and Kulp \(1975\)/.test(guide.li)&&/Partial interval overestimated/.test(guide.li)&&/Whole interval underestimated/.test(guide.li)&&/momentary time sampling erred both ways/.test(guide.li)&&/5 of 45 min/.test(guide.li)
   &&/Lerman[^•]*• Powell, J\., Martindale, A\., & Kulp, S\. \(1975\)\. An evaluation of time-sample measures of behavior\. Journal of Applied Behavior Analysis, 8\(4\), 463–469\. • Thompson/.test(guide.cite),guide);
 /* the simulation: the Summary's coverage */
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2000);
 const sum=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#sumTbl tbody tr')].map(r=>({cov:(r.querySelector('.ob-cov')||{}).textContent||'',min:(r.cells[2]||{}).textContent||''}));
   return {rows,ivN:state.cfg.ivN,len:state.cfg.ivLen,key:document.getElementById('sumNote').textContent};});
 const sm=sum.ivN*sum.len/60;
 ok('R-052 E-28 the Summary says under each interval figure how much of the observation the sample covered ("'+sm+' of N min"), the All observations row the total, and the key says the two time bases differ',
   sum.rows.length>=3&&sum.rows.slice(0,-1).every(r=>r.cov===sm+' of '+r.min.trim()+' min')&&/ of \d+(\.\d)? min$/.test(sum.rows[sum.rows.length-1].cov)&&/the sample is \d+(\.\d)? min of each observation, while the count and the rate per hour cover all of it/.test(sum.key),sum);
 /* restraint and seclusion ticked: the notices name the law from the constant */
 await p.evaluate(()=>{state.obs[0].cons.restraint=true;state.obs[1].cons.seclusion=true;render();});await sleep(300);
 const notes=await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '));
 ok('R-053 a restraint ticked on an observation brings the notices in the constant\'s words; a seclusion, the prohibition and subsection (2)',
   notes.includes('A physical restraint is recorded on ')&&notes.includes(': '+L.restraintDue+'. Log it on Form DD-1')&&notes.includes('seclusion is prohibited for a student with an IEP (s. 1003.573(2), F.S.). Tell the administrator'),notes.slice(notes.indexOf('A physical restraint')-10,notes.indexOf('A physical restraint')+400));
 /* E-30: duplicate this observation's setup */
 const dup=await p.evaluate(()=>{const n0=state.obs.length,o=state.obs[0];document.querySelector('#obsPages .obs-page button.dupObs[data-obs="0"]').click();const x=state.obs[state.obs.length-1];
   return {n0,n1:state.obs.length,same:['setting','activity','arrange','adults','students','announced'].every(k=>String(x[k])===String(o[k])),src:o.setting+'|'+o.activity,blankData:!x.date&&!x.start&&!x.count&&!x.narrative.some(r=>r.w)&&!Object.values(x.cons||{}).some(Boolean)};});
 ok('E-30 "Duplicate this observation\'s setup" adds an observation with its setting, activity, arrangement, adults, students and announcement, and no date, times, counts, narrative or ticks',dup.n1===dup.n0+1&&dup.same&&dup.blankData&&dup.src.length>3,dup);
 /* E-30: the Log keeps # and Date beside the actions */
 await p.setViewportSize({width:820,height:1100});await p.evaluate(()=>document.querySelector('#viewSeg [data-view="log"]').click());await sleep(500);
 const frz=await p.evaluate(()=>{const t=document.querySelector('#logBody table.oblog');const w=t.closest('.tblwrap,.nbh-scrollx')||t.parentElement;const r=t.rows[1];const cs=i=>getComputedStyle(r.cells[i]);
   const before=r.cells[2].getBoundingClientRect().left;w.scrollLeft=400;const after=r.cells[2].getBoundingClientRect().left;
   return {pos:[cs(0).position,cs(1).position,cs(2).position],left:[cs(1).left,cs(2).left],scrolled:w.scrollLeft,before,after,act:r.cells[0].getBoundingClientRect().right,date:r.cells[2].getBoundingClientRect().left};});
 ok('E-30 on the Log at iPad width, # and Date stay in view beside Open and Remove while the table scrolls sideways',frz.pos.every(x=>x==='sticky')&&parseFloat(frz.left[0])>0&&parseFloat(frz.left[1])>parseFloat(frz.left[0])&&frz.scrolled>0&&Math.abs(frz.after-frz.before)<2,frz);
 await p.close();

 /* ---- E-28: momentary time sampling for a timed behavior; a method chosen by hand stays ---- */
 p=await open(OB);
 const mts=await p.evaluate(async()=>{const d=document.getElementById('mDur1');const m0=state.cfg.ivMethod;d.checked=true;d.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));const m1=state.cfg.ivMethod,sel=document.getElementById('ivMethod').value;
   const s=document.getElementById('ivMethod');s.value='whole';s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
   d.checked=false;d.dispatchEvent(new Event('change',{bubbles:true}));d.checked=true;d.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
   return {m0,m1,sel,after:state.cfg.ivMethod};});
 ok('E-28 ticking "Time each episode" on a new record sets the interval sample to momentary time sampling (toolbar too); a method then chosen by hand is not changed by ticking it again',mts.m0==='partial'&&mts.m1==='mts'&&mts.sel==='mts'&&mts.after==='whole',mts);
 await p.close();
 /* ---- E-28: an untouched sample fits the planned length ---- */
 p=await open(OB);
 const fit=await p.evaluate(async()=>{document.querySelector('#viewSeg [data-view="obs"]').click();const pl=document.getElementById('obrPlan');pl.value='10';pl.dispatchEvent(new Event('input',{bubbles:true}));pl.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
   const a={ivN:state.cfg.ivN,tool:document.getElementById('ivN').value,info:document.getElementById('obrIvInfo').textContent};
   pl.value='45';pl.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
   return {a,b:{ivN:state.cfg.ivN,info:document.getElementById('obrIvInfo').textContent}};});
 ok('E-28 R-052 a planned length of 10 min fits the untouched sample to it (40 × 15 s, toolbar too), and the recorder says how much of the plan the sample covers; at 45 min, 60 intervals at most (15 of 45 min)',
   fit.a.ivN===40&&fit.a.tool==='40'&&/covers 10:00 of the planned 10:00/.test(fit.a.info)&&fit.b.ivN===60&&/covers 15:00 of the planned 45:00/.test(fit.b.info),fit);
 /* ---- R-056: an observation under a minute is saved only after a yes; the Save button shows the time ---- */
 const rec=async(ans)=>p.evaluate(async(ans)=>{const pl=document.getElementById('obrPlan');pl.value='';pl.dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('obrStart').click();await new Promise(r=>setTimeout(r,2200));document.getElementById('obrTapS').click();document.getElementById('obrTapS').click();document.getElementById('obrEnd').click();await new Promise(r=>setTimeout(r,500));
   const sv=document.getElementById('obrSave'),bd=sv.querySelector('.obr-dur');const label=(sv.firstChild&&sv.firstChild.nodeType===3?sv.firstChild.textContent:'').trim()+' | '+(bd&&!bd.hidden?bd.textContent:'')+' | '+(sv.getAttribute('aria-label')||'');window.__asked=[];window.__answer=ans;const c0=state.obs.map(o=>String(o.count)).join('|');
   document.getElementById('obrSave').click();await new Promise(r=>setTimeout(r,900));window.__answer=true;
   return {label,asked:window.__asked.slice(),c0,c1:state.obs.map(o=>String(o.count)).join('|'),st:document.getElementById('obrState').textContent};},ans);
 const no=await rec(false);
 ok('R-056 Start, two taps and End within seconds: the Save button carries the time, "0:02" (and says "Save to the record, 0:02 observed" to a screen reader), Save asks first, and No saves nothing',/^Save to the record \| 0:0\d \| Save to the record, 0:0\d observed$/.test(no.label)&&/^Save an observation under one minute\?/.test(no.asked[0]||'')&&no.c0===no.c1&&no.st==='Ended',no);
 const yes=await p.evaluate(async()=>{window.__asked=[];window.__answer=true;document.getElementById('obrSave').click();await new Promise(r=>setTimeout(r,1200));return {asked:window.__asked.slice(),counts:state.obs.map(o=>String(o.count)),st:document.getElementById('obrState').textContent,label:document.getElementById('obrSave').textContent.trim(),aria:document.getElementById('obrSave').getAttribute('aria-label')};});
 ok('R-056 a yes saves it (the count of 2 written to the observation) and the button reads "Save to the record" again, with no time on it',/under one minute/.test(yes.asked[0]||'')&&yes.counts.includes('2')&&yes.label==='Save to the record'&&yes.aria===null,yes);
 await p.close();

 /* ---- R-055 / E-30: blank sheets ---- */
 p=await open(OB);
 const scr=await p.evaluate(()=>{const t=document.querySelector('#obsPages .obs-page table.narr');return {all:t.tBodies[0].rows.length,shown:[...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display!=='none').length};});
 await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>{const t=document.querySelector('#obsPages .obs-page table.narr');return [...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display!=='none').length;});await p.emulateMedia({media:'screen'});
 ok('R-055 a blank observation shows its three lines on screen and prints twelve to write on',scr.shown===3&&scr.all===12&&pr===12,{scr,pr});
 const whole=await print(p,'ob144-whole.pdf');
 const k=await p.evaluate(()=>{window.print=()=>{};document.getElementById('obBlankN').value='3';document.getElementById('obBlankBtn').click();return {cls:document.body.classList.contains('ob-blank-printing'),pages:document.querySelectorAll('#obBlankPr .obs-page').length,ids:document.querySelectorAll('#obBlankPr [data-obs]').length};});
 const bl=await print(p,'ob144-blank3.pdf');
 await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(200);
 const gone=await p.evaluate(()=>!document.getElementById('obBlankPr')&&!document.body.classList.contains('ob-blank-printing'));
 const whole2=await print(p,'ob144-whole2.pdf');
 const pg1=bl.pages[0]||'';
 /* a blank observation prints on two pages, as it did before: the record and its twelve lines, then the conditions and the conclusions */
 const firsts=bl.pages.filter((t,i)=>i%2===0),seconds=bl.pages.filter((t,i)=>i%2===1);
 ok('R-055 E-30 "Print blank observation sheets" with 3 prints three blank observations, each from a new page (the band "Observation ______", the context fields and the twelve lines, then the conditions and the conclusions), nothing else of the form, and puts the sheets away after the print',
   k.cls&&k.pages===3&&k.ids===0&&bl.n===6&&firsts.every(t=>/Direct Observation Record — Observation ______/.test(t)&&/What Happened/.test(t))&&seconds.every(t=>/What Followed the Behavior/.test(t)&&/What this observation supports or rules out/.test(t)&&!/Observation ______/.test(t))&&!/How the Numbers Are Taken|Observation Log|Across the Observations/i.test(bl.all)&&gone&&whole2.n===whole.n,{k,n:bl.n,whole:whole.n,whole2:whole2.n,pg1:pg1.slice(0,300),gone});
 await p.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
