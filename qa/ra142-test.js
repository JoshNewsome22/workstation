/* v24.42 Form RA-1 (review V15: R-072, R-073, E-34, E-24): High potency as the only positive result with no plan ratio reads
   "Confirmed (PR only)" on the Summary, in the note and in the case facts, and "Confirmed" once the plan ratio is entered or
   another design agrees; a single-operant session under half the planned length is marked short on the sheet, counted in the
   Condition Summary with the ratio the full sessions alone would give, and the runner asks once before saving one; the
   position effect is computed for every option (Option B's own column with three stations); Setup's designs to run fold the
   other sheets away on screen, on paper and in the view buttons; the quick-MSWO link on RA-1's Setup and under TD-1's
   preference-assessment selector names PA-1's file at #quick-mswo, and inside the shell opens PA-1 beside the asker with that
   hash set. usage: node qa/ra142-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const file=pre=>fs.readdirSync(ROOT+'/NBH-Workstation').find(x=>x.startsWith(pre));
const RA='Reinforcer_Assessment_Protocol.html',PA=file('PA-1_'),TD=file('TD-1_');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 const open=async(f)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+String(e).slice(0,160)));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(BASE+'/NBH-Workstation/'+f);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asks=[];window.__answer=true;nbhUI.confirm=async m=>{window.__asks.push(String(m));return window.__answer;};});return p;};
 const look=p=>p.evaluate(()=>({sum:[...document.querySelectorAll('#sumTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim())),
   note:document.getElementById('sumNote').hidden?'':document.getElementById('sumNote').textContent,
   so:[...document.querySelectorAll('#soRank tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim())),
   co:[...document.querySelectorAll('#coRank tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim())),
   short:(()=>{const e=document.getElementById('soShort');return e&&!e.hidden?e.textContent:'';})(),
   facts:(window.__nbhFactsOut&&window.__nbhFactsOut())||null}));
 /* the form's state is in its own closure: every change goes through the sheet's controls */
 const H=`const inp=(e,v)=>{e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}));};
   const soSet=(k,f,v)=>inp(document.querySelector('#soTbl [data-k="'+k+'"][data-f="'+f+'"]'),v);const coSet=(k,f,v,j)=>inp(document.querySelector('#coTbl [data-k="'+k+'"][data-f="'+f+'"]'+(j==null?'':'[data-j="'+j+'"]')),v);
   const soRows=()=>[...document.querySelectorAll('#soTbl select[data-f="cond"]')].filter(e=>e.value!=='').length;`;
 const p=await open(RA);
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
 let a=await look(p);const tab=r=>r.sum.find(x=>x[0]==='Tablet (video)');
 ok('the simulation (plan ratio FR 5, single operant Clear): the tablet is Confirmed as before',tab(a)&&tab(a)[8]==='Confirmed',tab(a));
 /* R-072: the progressive ratio alone, no plan ratio */
 await p.evaluate(H+`document.querySelectorAll('#soTbl select[data-f="cond"]').forEach(e=>inp(e,''));document.querySelectorAll('#coTbl input[data-f="r"]').forEach(e=>inp(e,''));inp(document.getElementById('planRatio'),'');`);await sleep(300);
 a=await look(p);const fact=a.facts&&a.facts.reinf&&a.facts.reinf.items.find(x=>x.name==='Tablet (video)');
 ok('R-072 with the single-operant and concurrent-operants sheets empty and no plan ratio, High potency reads "Confirmed (PR only)" on the Summary and in the case facts, and the note says the control ends at FR 1 by construction',
   tab(a)&&tab(a)[8]==='Confirmed (PR only)'&&tab(a)[7]==='High'&&/Confirmed on the progressive ratio alone/.test(a.note)&&/FR 1 by construction/.test(a.note)&&fact&&fact.verdict==='Confirmed (PR only)',{row:tab(a),note:a.note.slice(0,200),fact});
 await p.evaluate(H+`inp(document.getElementById('planRatio'),'5');`);await sleep(300);a=await look(p);
 ok('R-072 with the plan ratio entered (High then means a break point above it) the same sheets read Confirmed',tab(a)&&tab(a)[8]==='Confirmed'&&!/progressive ratio alone/.test(a.note),{row:tab(a),note:a.note.slice(0,200)});
 ok('the Summary\'s rule, the walkthrough\'s decision and the terms name Confirmed (PR only)',await p.evaluate(()=>[...document.querySelectorAll('#summary p.method,#wk-sum .decide,#wk-terms dd')].filter(e=>/Confirmed \(PR only\)/.test(e.textContent)).length>=3));
 /* R-073: a short session on the sheet */
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
 const before=await look(p);
 await p.evaluate(H+`const k=[...document.querySelectorAll('#soTbl select[data-f="cond"]')].findIndex(e=>e.value==='0');soSet(k,'resp','3');soSet(k,'min','0.07');`);await sleep(300);
 a=await look(p);const tabSo=a.so.find(r=>r[0]==='Tablet (video)'),tabSo0=before.so.find(r=>r[0]==='Tablet (video)');
 const cell=await p.evaluate(()=>{const k=[...document.querySelectorAll('#soTbl select[data-f="cond"]')].findIndex(e=>e.value==='0');return document.getElementById('soR'+k).textContent.trim();});
 ok('R-073 a 3-response, 4-second session on the sheet: its rate reads 42.9 and is marked short, the Condition Summary counts it ("1 short") and the note under it gives the ratio to control the full sessions alone would give',
   /^42\.9\s*short$/.test(cell)&&tabSo&&/\(1 short\)/.test(tabSo[1])&&/1 short session/.test(a.short)&&/Tablet \(video\)[^;]*without them/.test(a.short)&&tabSo[4]!==tabSo0[4],{cell,row:tabSo,was:tabSo0,short:a.short.slice(0,300)});
 /* R-073: the runner asks once */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="so"]').click();});await sleep(200);
 const run=await p.evaluate(H+`(async()=>{const q=id=>document.getElementById('ra-run-so-'+id);const rows0=soRows();
   q('cond').value='0';q('cond').dispatchEvent(new Event('change',{bubbles:true}));q('start').click();await new Promise(r=>setTimeout(r,700));q('resp').click();q('resp').click();await new Promise(r=>setTimeout(r,900));q('end').click();await new Promise(r=>setTimeout(r,400));
   const sum=q('sum')?q('sum').textContent:'';window.__answer=false;q('save').click();await new Promise(r=>setTimeout(r,500));const asked=window.__asks.filter(m=>/under half/.test(m));const rows1=soRows();
   window.__answer=true;q('save').click();await new Promise(r=>setTimeout(r,600));const rows2=soRows();const k=rows2-1;const last={min:document.querySelector('#soTbl [data-k="'+k+'"][data-f="min"]').value,cell:document.getElementById('soR'+k).textContent.trim()};
   return {sum,asked,rows0,rows1,rows2,last,asks:window.__asks.filter(m=>/under half/.test(m)).length};})();`);
 ok('R-073 the runner: a session ended after seconds shows the caution in its Session Summary; Save asks ("under half"), a no saves nothing, a second Save asks again and a yes writes the row, marked short',
   /Under half the planned length/.test(run.sum)&&run.asked.length===1&&/under half/.test(run.asked[0])&&run.rows1===run.rows0&&run.rows2===run.rows0+1&&run.last&&+run.last.min<0.5&&/short$/.test(run.last.cell)&&run.asks===2,run);
 /* E-34: the position effect for every option (three stations) */
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
 const headB=await p.evaluate(()=>[...document.querySelectorAll('#coTbl thead th')].map(e=>e.textContent.trim()));
 await p.evaluate(H+`document.querySelectorAll('#coTbl input[data-f="r"]').forEach(e=>inp(e,''));document.querySelectorAll('#coTbl select[data-f="cond"]').forEach(e=>inp(e,''));document.querySelectorAll('#coTbl select[data-f="posB"]').forEach(e=>inp(e,''));
   /* A at L (B at M): B takes 90%; A at M (B at R): B takes 20%; A at R (B at L): 85% */
   [['L',5,90,5],['M',75,20,5],['R',10,85,5],['L',8,88,4],['M',70,25,5],['R',12,84,4]].forEach(([p,x,y,z],k)=>{coSet(k,'pos',p);coSet(k,'r',String(x),0);coSet(k,'r',String(y),1);coSet(k,'r',String(z),2);});`);await sleep(300);
 a=await look(p);const bub=a.co.find(r=>r[0]==='Bubbles'),tb=a.co.find(r=>r[0]==='Tablet (video)'),ct=a.co.find(r=>r[0]==='Control');
 ok('E-34 with three stations the sheet has an Option B position column; Option B\'s share by its derived position (next after A in the rotation) differs by 65 points: Position effect Suspected on its row, None for the control, no "n/a"',
   headB.includes('Option B position')&&bub&&bub[5]==='Suspected'&&ct&&ct[5]==='None'&&tb&&tb[5]!=='n/a'&&!a.co.some(r=>r[5]==='n/a'),{headB,co:a.co});
 /* B recorded at R for the high rows 0 and 3 and the low rows 1 and 4 alike (the rotation would have put it at M and R): its shares no longer follow its place */
 await p.evaluate(H+`['R','R','M','R','R','M'].forEach((v,k)=>coSet(k,'posB',v));`);await sleep(200);
 a=await look(p);const bub2=a.co.find(r=>r[0]==='Bubbles'),tb2=a.co.find(r=>r[0]==='Tablet (video)');
 ok('E-34 Option B\'s own column overrides the rotation: with B recorded at the same place for high and low sessions its effect reads None, while the tablet\'s (recorded) still reads Suspected',bub2&&bub2[5]==='None'&&tb2&&tb2[5]==='Suspected',a.co);
 /* E-34: the designs to run */
 await p.evaluate(()=>document.querySelector('.ra-designs .ra-one[data-one="so"]').click());await sleep(300);
 const d1=await p.evaluate(()=>({view:document.body.className,coOff:document.getElementById('co').classList.contains('ra-off'),prOff:document.getElementById('pr').classList.contains('ra-off'),soOff:document.getElementById('so').classList.contains('ra-off'),
   btn:['so','co','pr'].map(v=>document.querySelector('#viewSeg [data-view="'+v+'"]').hidden),chk:['so','co','pr'].map(v=>document.getElementById('raRun-'+v).checked),coDisp:getComputedStyle(document.getElementById('co')).display}));
 await p.emulateMedia({media:'print'});const dPrint=await p.evaluate(()=>['so','co','pr'].map(v=>getComputedStyle(document.getElementById(v)).display));await p.emulateMedia({media:'screen'});
 ok('E-34 "Just the single operant" on Setup: the single-operant sheet opens, the other two fold away (hidden on screen and on paper, their view buttons gone, their boxes unticked) and the choice is kept in the record',
   /view-so/.test(d1.view)&&d1.coOff&&d1.prOff&&!d1.soOff&&d1.btn.join()==='false,true,true'&&d1.chk.join()==='true,false,false'&&d1.coDisp==='none'&&dPrint.join()==='block,none,none',{d1,dPrint});
 await p.evaluate(()=>{const c=document.getElementById('raRun-co');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
 const d2=await p.evaluate(()=>({coOff:document.getElementById('co').classList.contains('ra-off'),btn:document.querySelector('#viewSeg [data-view="co"]').hidden}));
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="pr"]').click();});await sleep(300);
 const d3=await p.evaluate(()=>({prOff:document.getElementById('pr').classList.contains('ra-off'),view:document.body.className}));
 ok('E-34 ticking Concurrent operants brings its sheet back; choosing the progressive-ratio view brings that one back too',!d2.coOff&&!d2.btn&&!d3.prOff&&/view-pr/.test(d3.view),{d2,d3});
 /* E-24: the links */
 const link=await p.evaluate(()=>{const a=document.querySelector('#setup a.ra-quick');return a?{href:a.getAttribute('href'),target:a.target,text:a.textContent.trim()}:null;});
 const q=await open(TD);const linkTd=await q.evaluate(()=>{const a=document.querySelector('#reinf a.ra-quick');return a?{href:a.getAttribute('href'),target:a.target,text:a.textContent.trim(),after:!!(a.closest('p')&&a.closest('p').previousElementSibling&&a.closest('p').previousElementSibling.id==='paRec')}:null;});await q.close();
 ok('E-24 RA-1\'s Setup (under Preference assessment source) and TD-1\'s Reinforcers sheet (under the preference-assessment selector) link to PA-1\'s file at #quick-mswo, opening a new tab when the form stands alone',
   link&&link.href===PA+'#quick-mswo'&&link.target==='_blank'&&/brief MSWO/.test(link.text)&&linkTd&&linkTd.href===PA+'#quick-mswo'&&linkTd.target==='_blank'&&linkTd.after,{link,linkTd});
 await p.close();
 /* E-24: inside the shell */
 const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+String(e).slice(0,160)));await sh.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
 await sh.evaluate(()=>{openForm('RA-1');});await sleep(2500);
 const shell=await sh.evaluate(async()=>{const fr=state.frames['RA-1'];const d=fr.contentDocument;const a=d.querySelector('#setup a.ra-quick');let popup=false;fr.contentWindow.open=()=>{popup=true;return null;};
   a.click();await new Promise(r=>setTimeout(r,3000));const pa=state.frames['PA-1'];let hash='';try{hash=pa?pa.contentWindow.location.hash:'';}catch(e){hash='err';}
   let quick=null;try{const q=pa&&pa.contentDocument.getElementById('paQuick');quick=q?!q.hidden:null;}catch(e){}
   return {opened:!!pa,hash,quick,cur:state.cur,split:state.split.slice(),popup,log:(state.relayLog||[]).slice(-3)};});
 ok('E-24 inside the workstation the link opens Form PA-1 beside RA-1 (the shell\'s open verb with at: "quick-mswo") and PA-1\'s hash reads #quick-mswo; no new tab',shell.opened&&shell.hash==='#quick-mswo'&&shell.split.includes('PA-1')&&shell.split.includes('RA-1')&&!shell.popup,shell);
 const again=await sh.evaluate(async()=>{const pa=state.frames['PA-1'];let fired=0;pa.contentWindow.addEventListener('hashchange',()=>fired++);const fr=state.frames['RA-1'];await new Promise(r=>setTimeout(r,1100));const q=pa.contentDocument.getElementById('paQuick');if(q)q.hidden=true;fr.contentDocument.querySelector('#setup a.ra-quick').click();await new Promise(r=>setTimeout(r,800));return {fired,hash:pa.contentWindow.location.hash,quick:q?!q.hidden:null};});
 ok('E-24 a second click with PA-1 already open sets the hash again (a hashchange PA-1 can act on)',again.fired>=1&&again.hash==='#quick-mswo',again);
 ok('E-24 end to end in the workstation: PA-1 opens with its brief-MSWO panel showing, and a second click with the panel closed shows it again',shell.quick===true&&again.quick===true,{first:shell.quick,second:again.quick});
 await sh.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
