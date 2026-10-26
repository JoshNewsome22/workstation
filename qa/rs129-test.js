/* v24.29 Form RS-1 from the independent review (R-026, R-027, R-116, R-117, R-118, R-120, R-147, R-149, R-150; E-03, E-41): a phone
   contact is noted, not counted, and never fails the month; the Every supervisee table follows the month block; an open month reads
   on track; "2 (2 needed)"; the name cell is a button; the plan's integrity checklist on a contact and its way into Form TD-1's log;
   Add a contact like the last one asks the observation question again; Save without concerns; a BCaBA's BCBA; the RBT's copy; the
   autosave label; the handbook note.
   usage: node qa/rs129-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const file=pre=>'/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(x=>x.startsWith(pre));
const PLAN={src:'TD-1',beh:'Hitting (simulated)',checklist:[{t:'Give the instruction once, then wait 5 s (simulated)',crit:true,comp:'FCT'},{t:'Prompt the break card at the first precursor (simulated)',crit:true,comp:'FCT'},{t:'Praise within 3 s of the card (simulated)',comp:'DRA'},{t:'Record the opportunity on the sheet (simulated)',comp:'Data'}]};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 const open=async(path)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(path.slice(17,22)+': '+String(e).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+path);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{return t0&&t0(m,o);}catch(e){}};});
   if(process.env.RS_DEBUG){const o=p.evaluate.bind(p);let k=0;p.evaluate=async(...a)=>{k++;try{return await o(...a);}catch(e){console.log('EVAL #'+k+' failed: '+String(e.message).slice(0,400));throw e;}};}
   return p;};
 let p=await open(file('RS-1_'));
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
 /* ---- R-026 a phone contact is noted, not counted ---- */
 const r1=await p.evaluate(async()=>{pickRbt(1);await new Promise(r=>setTimeout(r,200));const k=curKey,[y,mo]=k.split('-').map(Number);const today=todayISO();const day=d=>iso(y,mo,Math.min(d,+today.slice(8)));
   const set=(id,f,v)=>{const e=document.getElementById('c_'+id+'_'+f);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
   const before=stats(k);
   addContact(null);const a=month(k).contacts[month(k).contacts.length-1];set(a.id,'date',day(21));set(a.id,'start','09:00');set(a.id,'end','11:30');set(a.id,'obs','yes');set(a.id,'mode','person');
   const mid=stats(k);
   addContact(null);const ph=month(k).contacts[month(k).contacts.length-1];set(ph.id,'date',day(22));set(ph.id,'start','10:00');set(ph.id,'end','10:30');set(ph.id,'mode','phone');set(ph.id,'obs','no');
   addContact(null);const c3=month(k).contacts[month(k).contacts.length-1];set(c3.id,'date',day(23));set(c3.id,'start','13:00');set(c3.id,'end','13:30');set(c3.id,'obs','no');set(c3.id,'mode','person');
   await new Promise(r=>setTimeout(r,200));const s=stats(k);const chk=Object.fromEntries(s.checks.map(c=>[c.k,c]));
   const card=document.querySelector('details.rs-contact[data-cid="'+ph.id+'"]');const box=document.getElementById('compBox');
   const yr=[...document.querySelectorAll('#yearTbl tbody tr[data-open-month="'+k+'"] td')].map(td=>td.textContent.trim());
   return {k,phId:ph.id,b:{status:before.status,cnt:before.cnt.length},mid:{status:mid.status,cnt:mid.cnt.length,pct:Math.round(mid.pct*10)/10},s:{status:s.status,cnt:s.cnt.length,noted:s.badMode,pct:Math.round(s.pct*10)/10,obs:s.obs},
     contactsD:chk.contacts.d,contactsS:chk.contacts.s,modeS:chk.mode.s,modeD:chk.mode.d,boxStatus:box.dataset.status,verdict:document.getElementById('compVerdict').textContent,
     bad:card.classList.contains('bad'),pills:[...card.querySelectorAll('summary .rs-pill')].map(x=>x.textContent),issues:document.getElementById('c_'+ph.id+'_issues').textContent,noted:(document.getElementById('tNoted')||{}).textContent,yrLast:yr[yr.length-1],
     who:[...document.querySelectorAll('#rbtAll tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()))};});
 ok('a 150-minute in-person observation, a 30-minute phone contact and a 30-minute in-person contact: the month is on track (not Needs attention), the phone contact is noted and not counted',r1.mid.status!=='fail'&&r1.s.status==='ok'&&r1.s.cnt===3&&r1.s.noted===1&&r1.boxStatus==='ok'&&!/Needs attention/.test(r1.verdict),r1);
 ok('the contacts check reads "3 of 2 (1 noted, not counted)" and the mode row is a note, never a red mark; the totals show the noted contact',/^3 of 2 \(1 noted, not counted\)$/.test(r1.contactsD)&&r1.contactsS==='ok'&&r1.modeS==='na'&&/1 noted this month/.test(r1.modeD)&&r1.noted==='1',r1);
 ok('the phone contact’s card is not red: a "noted, not counted" pill and line, no ✕',!r1.bad&&r1.pills.includes('noted, not counted')&&/noted, not counted/.test(r1.issues)&&!/✕/.test(r1.issues),r1);
 ok('the Year table does not say No for the month',r1.yrLast!=='No',r1.yrLast);
 /* a month whose only contacts are non-counting still goes red after it ends */
 const r2=await p.evaluate(()=>{const ks=yearKeys(setupYear()),i=ks.indexOf(curKey);const k=ks[i-1];const m=month(k);const modes=m.contacts.map(c=>c.mode);m.contacts.forEach(c=>{c.mode='phone';});const s=stats(k);const chk=Object.fromEntries(s.checks.map(c=>[c.k,c]));
   const r={k,n:m.contacts.length,status:s.status,contacts:chk.contacts.s,d:chk.contacts.d,ended:s.ended};m.contacts.forEach((c,j)=>{c.mode=modes[j];});return r;});
 ok('an ended month whose only contacts were by phone is not met (red), with the contacts check failing and the noted count shown',r2.ended&&r2.n>=1&&r2.status==='fail'&&r2.contacts==='fail'&&new RegExp('^0 of 2 \\('+r2.n+' noted, not counted\\)$').test(r2.d),r2);
 /* ---- R-027 the Every supervisee table follows the month block; R-120 on track; R-149 "2 (2 needed)" ---- */
 const r3=await p.evaluate(()=>{const s=stats(curKey);const row=[...document.querySelectorAll('#rbtAll tbody tr')].find(tr=>/Casey/.test(tr.textContent));const td=[...row.querySelectorAll('td')].map(x=>x.textContent.trim());
   const jt=td,js=s;
   const opt=[...document.querySelectorAll('#rbtSel option')].map(o=>o.textContent);const bar=document.querySelector('#monthBar button[data-month="'+curKey+'"] small').textContent;
   const head=[...document.querySelectorAll('#rbtAll thead th')].map(th=>th.textContent.trim());
   return {pct:td[1],want:pctTxt(s.pct),cnt:td[2],obs:td[3],st:td[4],need:td[5],head,jSt:jt[4],jStatus:js.status,jEnded:js.ended,opt,bar,curStatus:s.status};});
 ok('without a reload the Every supervisee table shows the edited month: the percent, "3 (2 needed)", the observations, and a Still needed column',r3.pct===r3.want&&r3.cnt==='3 (2 needed)'&&r3.obs==='2'&&r3.head.includes('Still needed this month')&&typeof r3.need==='string',r3);
 ok('an open month that meets every check reads "on track" in the table, the picker and the month bar (met only after the month ends)',r3.jStatus==='ok'&&!r3.jEnded&&r3.jSt==='on track'&&r3.opt.some(t=>/Casey.*on track/.test(t))&&/on track/.test(r3.bar),r3);
 /* ---- R-150 the name cell is a button; R-149 the autosave label ---- */
 const r4=await p.evaluate(async()=>{const btn=document.querySelector('#rbtAll button.rs-who-btn[data-rbt="0"]');const h=btn.getBoundingClientRect().height;btn.click();await new Promise(r=>setTimeout(r,200));
   return {h,role:btn.tagName,cur:R.indexOf(S),who:window.nbhBridge&&nbhBridge.who(),rows:document.querySelectorAll('#rbtAll tr[role="button"]').length};}).catch(e=>({err:String(e.stack||e).slice(0,700)}));
 ok('the RBT’s name in the supervisee table is a real button at least 44 px tall that switches the record; no row carries a button role',r4.role==='BUTTON'&&r4.h>=44&&r4.cur===0&&r4.rows===0,r4);
 ok('the autosave copy is labeled with the RBT’s name',r4.who==='RBT Jordan Lee (simulated)',r4);
 /* ---- R-118 Add a contact like the last one asks the observation question again ---- */
 const r5=await p.evaluate(async()=>{document.getElementById('addLike').click();await new Promise(r=>setTimeout(r,300));const c=month(curKey).contacts.find(c=>!c.start&&!c.feedback);const L=lastContact();
   const card=document.querySelector('details.rs-contact[data-cid="'+c.id+'"]');return {obs:c.obs,lastObs:L.obs,sup:c.sup===L.sup,pill:[...card.querySelectorAll('summary .rs-pill')].map(x=>x.textContent),issues:document.getElementById('c_'+c.id+'_issues').textContent,toast:window.__toasts.slice(-1)[0]};});
 ok('the copy leaves "Observed the RBT with a client?" unanswered, says so on the card, and the toast says it is asked again',r5.obs===''&&r5.sup&&r5.pill.includes('observation not answered')&&/Observed the RBT with a client\? not answered/.test(r5.issues)&&/asked again/.test(r5.toast),r5);
 /* ---- R-147 a BCaBA supervisor names the BCBA who supervises them ---- */
 const r6=await p.evaluate(async()=>{setView('setup');await new Promise(r=>setTimeout(r,200));const B=S.sups.find(s=>s.cred==='BCaBA'),A=S.sups.find(s=>s.cred==='BCBA');
   B.bcba='';renderSups();supRefresh();const fB=document.querySelector('[data-bcba="'+B.id+'"]'),fA=document.querySelector('[data-bcba="'+A.id+'"]');const issB=document.getElementById('sup_'+B.id+'_issues').textContent;
   const inp=document.getElementById('sup_'+B.id+'_bcba');inp.value='Simulated BCBA, 1-00-00000';inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
   const issB2=document.getElementById('sup_'+B.id+'_issues').textContent;const ask=supIssues(Object.assign({},B,{bcba:''})).every(i=>i.lvl!=='pending'&&i.lvl!=='fail');renderPrint();const head=document.getElementById('monthOut').textContent;
   return {ask,shownB:!fB.hidden,hiddenA:fA.hidden,before:/Supervised by a BCBA/.test(issB),after:/Supervised by a BCBA/.test(issB2),saved:B.bcba,printed:/supervised by Simulated BCBA, 1-00-00000/.test(head)};});
 ok('a BCaBA supervisor has a "Supervised by" field (a BCBA has none), pending until filled, and the printed head names the BCBA',r6.shownB&&r6.hiddenA&&r6.before&&!r6.after&&r6.saved==='Simulated BCBA, 1-00-00000'&&r6.printed&&r6.ask,r6);
 /* ---- R-117 Save without concerns ---- */
 const r7=await p.evaluate(async()=>{window.__blobs=[];URL.createObjectURL=b=>{window.__blobs.push(b);return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};const read=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsText(b);});
   document.getElementById('saveNoConcernsBtn').click();await new Promise(r=>setTimeout(r,200));document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,200));
   const a=JSON.parse(await read(window.__blobs[0])),b=JSON.parse(await read(window.__blobs[1]));
   return {no:a.noConcerns===true&&a.S.concerns.length===0&&(a.rbts||[]).every(x=>x.concerns.length===0)&&a.S.sups.length===2&&(a.rbts||[]).length===2,full:!b.noConcerns&&(b.rbts||[]).some(x=>x.concerns.length>0),note:(document.getElementById('concernWhere')||{}).textContent||'',toast:window.__toasts.slice(-1)[0]};});
 ok('Save without concerns writes the whole file (both RBTs, the supervisors) with no concern entries; Save data keeps them; the Concerns panel says where they live',r7.no&&r7.full&&/Save without concerns writes the same file/.test(r7.note)&&/no Concerns and Corrective Action entries/.test(r7.toast),r7);
 /* ---- E-03 / R-116 the plan's integrity checklist on a contact whose client code is the case's student ID ---- */
 const r8=await p.evaluate(async(PLAN)=>{nbhCase.apply({plan:PLAN,student:{name:'SIMULATED – Sample Student',id:'SIM-0005',src:'packet'}});await new Promise(r=>setTimeout(r,300));
   const r={};const jc=month(curKey).contacts.find(c=>c.obs==='yes');openC.add(jc.id);renderContacts();r.jordan=!!document.querySelector('details.rs-contact[data-cid="'+jc.id+'"] .rs-cksrc');r.jordanLab=document.querySelector('details.rs-contact[data-cid="'+jc.id+'"] .rs-ck h4 span').textContent;
   pickRbt(1);await new Promise(r=>setTimeout(r,200));const c=month(curKey).contacts.find(c=>c.obs==='yes'&&c.client==='SIM-0005');openC.add(c.id);renderContacts();
   const card=document.querySelector('details.rs-contact[data-cid="'+c.id+'"]');const sw=card.querySelector('.rs-cksrc');r.casey=!!sw;r.btn=sw&&sw.querySelector('[data-cksrc="plan"]').textContent;r.disabled=sw&&sw.querySelector('[data-cksrc="plan"]').disabled;
   sw.querySelector('[data-cksrc="plan"]').click();await new Promise(r=>setTimeout(r,200));const card2=document.querySelector('details.rs-contact[data-cid="'+c.id+'"]');
   r.lab=card2.querySelector('.rs-ck h4 span').textContent;r.rows=card2.querySelectorAll('.rs-ckrow').length;r.crit=card2.querySelectorAll('.rs-ckrow.crit').length;r.first=card2.querySelector('.rs-ckrow .t').textContent;
   const tick=(j,v)=>{const e=document.getElementById('ck_'+c.id+'_'+j+'_'+v);e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}));};tick(0,'y');tick(1,'y');tick(2,'n');await new Promise(r=>setTimeout(r,150));
   r.score=document.getElementById('c_'+c.id+'_score').textContent;r.src=c.ckSrc;r.ckp=Object.assign({},c.ckp);r.ck=Object.assign({},c.ck);r.items=(c.ckItems||[]).length;r.planSrc=c.ckPlanSrc;
   document.querySelector('details.rs-contact[data-cid="'+c.id+'"] [data-cksrc="gen"]').click();await new Promise(r=>setTimeout(r,200));const card3=document.querySelector('details.rs-contact[data-cid="'+c.id+'"]');
   r.genLab=card3.querySelector('.rs-ck h4 span').textContent;r.genRows=card3.querySelectorAll('.rs-ckrow').length;r.genScore=document.getElementById('c_'+c.id+'_score').textContent;
   card3.querySelector('[data-cksrc="plan"]').click();await new Promise(r=>setTimeout(r,200));r.backScore=document.getElementById('c_'+c.id+'_score').textContent;
   const out=window.__nbhFactsOut();r.out=out&&out.supervision&&out.supervision.integrityObs;r.month=stats(curKey).ck;
   const d=JSON.parse(JSON.stringify(saveObj()));const ro=rosterFrom(d);const rc=(ro.rbts[1].months[curKey].contacts||[]).find(x=>x.id===c.id);r.file={src:rc.ckSrc,items:(rc.ckItems||[]).length,ckp:rc.ckp,crit:rc.ckItems[0].crit};
   renderPrint();r.printed=document.getElementById('monthOut').textContent;return r;},PLAN);
 ok('a contact whose client code is not the case’s student ID keeps the generic list, now labeled an observation checklist (not the plan’s integrity)',!r8.jordan&&/Observation checklist \(the generic ten; not the plan’s integrity\)/.test(r8.jordanLab),r8);
 ok('the matching contact offers "Score this plan’s integrity checklist (4 items, Form TD-1)"; chosen, the four plan items replace the ten, critical steps marked, and the score counts what was scored',r8.casey&&/Score this plan’s integrity checklist \(4 items, Form TD-1\)/.test(r8.btn)&&!r8.disabled&&/^Integrity checklist from the plan \(Form TD-1\): 4 items/.test(r8.lab)&&r8.rows===4&&r8.crit===2&&/Give the instruction once/.test(r8.first)&&/^67% \(2 of 3 scored\)/.test(r8.score)&&r8.src==='plan'&&r8.items===4&&Object.keys(r8.ckp).length===3&&Object.keys(r8.ck).length===0,r8);
 ok('switching to the generic ten and back keeps each list’s own scores',r8.genRows===10&&/generic ten/.test(r8.genLab)&&r8.genScore==='not scored'&&/^67%/.test(r8.backScore),r8);
 ok('the scored plan checklist goes with the case (supervision.integrityObs) and survives Save data / Open data',Array.isArray(r8.out)&&r8.out.length===1&&r8.out[0].client==='SIM-0005'&&r8.out[0].y===2&&r8.out[0].n===1&&r8.out[0].pct===67&&r8.out[0].items.length===4&&r8.file.src==='plan'&&r8.file.items===4&&r8.file.crit===true&&Object.keys(r8.file.ckp).length===3,r8);
 /* ---- E-41 the RBT's copy; the handbook note; the printed noted line ---- */
 const r9=await p.evaluate(async()=>{window.__blobs=[];URL.createObjectURL=b=>{window.__blobs.push(b);return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};
   document.getElementById('shRbtCopy').click();await new Promise(r=>setTimeout(r,400));const read=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsText(b);});const html=window.__blobs.length?await read(window.__blobs[0]):'';
   const req=document.getElementById('reqBox').textContent;return {n:window.__blobs.length,title:(html.match(/<title>([^<]*)/)||[])[1]||'',goals:/<h4[^>]*>Goals<\/h4>/.test(html)&&/Records every opportunity at the time/.test(html),concern:/Concern/.test(html),note:document.getElementById('shNote').textContent,btn:!!document.getElementById('shRbtCopy'),req:/lines that changed for 2026/.test(req)&&/updated 06\/2026/.test(req),printedNoted:/Noted, not counted: By phone: noted, not counted/.test(document.getElementById('monthOut').textContent)};});
 ok('Save the RBT\u2019s copy writes this month\u2019s record and the goals with no concerns; the Requirements name the 2026 lines to verify; the printed record notes the phone contact without a red mark',r9.n===1&&/\(the RBT\u2019s copy\)$/.test(r9.title)&&r9.goals&&!r9.concern&&/RBT\u2019s copy was saved/.test(r9.note)&&r9.btn&&r9.req&&r9.printedNoted,r9);
 await p.close();
 /* ---- TD-1: the checklist goes with the plan; the observation enters the integrity log ---- */
 p=await open(file('TD-1_'));
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 const td=await p.evaluate(async()=>{const out=window.__nbhFactsOut();const ck=out&&out.plan&&out.plan.checklist;
   const OBS={supervision:{form:'RS-1',integrityObs:[{key:'rs1:x1',date:'2026-10-13',client:'SIM-0005',rbt:'Casey Morgan (simulated)',sup:'Simulated BCaBA',y:7,n:1,na:0,pct:88,items:[],src:'RS-1'}]}};
   const rowsOf=()=>[...document.querySelectorAll('#monBody tr')].map((tr,i)=>({d:document.querySelector('[name="mo['+i+'].d"]').value,sc:document.querySelector('[name="mo['+i+'].sc"]').value,so:document.querySelector('[name="mo['+i+'].so"]').value,n:document.querySelector('[name="mo['+i+'].n"]').value})).filter(r=>/Form RS-1/.test(r.n));
   nbhCase.apply(OBS);await new Promise(r=>setTimeout(r,300));const a=rowsOf();const t1=window.__toasts.slice(-1)[0];nbhCase.apply(OBS);await new Promise(r=>setTimeout(r,300));const b=rowsOf();
   return {ck:Array.isArray(ck)?ck.length:null,crit:Array.isArray(ck)?ck.filter(x=>x.crit).length:null,first:ck&&ck[0],a,b:b.length,t1};});
 ok('TD-1 sends its integrity checklist with the plan (items with a critical mark)',td.ck>5&&td.crit>=1&&td.first&&td.first.t&&typeof td.first.crit==='boolean',td);
 ok('an observation scored on the plan (Form RS-1, through the case) enters the integrity log once: the date, 7 of 8 items, a note naming the source',td.a.length===1&&td.a[0].d==='10/13/2026'&&td.a[0].sc==='7'&&td.a[0].so==='8'&&/^Supervision observation \(Form RS-1\) 10\/13\/2026 SIM-0005 · Simulated BCaBA · 88%$/.test(td.a[0].n)&&td.b===1&&/entered in the integrity log/.test(td.t1),td);
 await p.close();
 /* ---- the workstation carries the supervision facts ---- */
 const src=fs.readFileSync(ROOT+'/NBH-Workstation/index.html','utf8');
 ok('the workstation lists RS-1 among the facts sources (supervision) and in the facts signature',/'RS-1':'supervision'/.test(src)&&/'RM-1','RS-1'\]/.test(src)&&/f\.relapse,f\.supervision\]/.test(src));
 ok('no page errors',errs.length===0,errs);
 await b.close();console.log('RESULT: '+(bad?bad+' failed of '+n:'all '+n+' passed'));process.exit(bad?1:0);})().catch(e=>{console.log('FAIL crash '+e);process.exit(1);});
