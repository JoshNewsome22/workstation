/* v24.43 Form IA-1 polished (review V16: R-044 to R-051, R-131; E-36, E-37), with Form ABC-1's chart text (R-131).
   The target list after a fill; the drafted Antecedent and the setting event said once; a finished hypothesis, Decision and
   rationale in the simulation; the definition check per informant; one privacy promise and initials by default; "Agree
   (within 1)"; the outcome tally labeled not independent; item selects and charts on an iPad; the masthead's printed-items
   line; the minimum plan; typed answers; the one-informant print and the summary print button.
   usage: node qa/ia143-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const pdfInfo=f=>{try{return JSON.parse(cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps({"n":d.page_count,"t":[p.get_text() for p in d]}))',f]).toString());}catch(e){return null;}};
const IA='/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(vp,opt)=>{const ctx=await b.newContext(Object.assign({viewport:vp},opt||{}));const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));await p.goto(BASE+IA);await sleep(1500);
   await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});return p;};
 const sim=async(p,sc)=>{await p.evaluate(s=>{if(s)document.getElementById('simScenario').value=s;document.getElementById('simBtn').click();},sc||'');await sleep(3200);};
 const v=(p,k)=>p.evaluate(k=>{const e=document.querySelector('[name="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;},k);
 let p=await open({width:1300,height:950});
 /* R-044 */
 await sim(p);
 const t1=await p.evaluate(()=>[...document.querySelectorAll('#tgtSel option')].map(o=>o.textContent));
 await p.evaluate(()=>{document.querySelector('[name="m.beh"]').value='Property destruction (simulated)';});await sleep(1300);   /* a fill with no keystroke, as an opened file or the case makes */
 const t2=await p.evaluate(()=>[...document.querySelectorAll('#tgtSel option')].map(o=>o.textContent));
 ok('R-044: after Load simulation the toolbar\'s target list reads the target\'s label, and a fill made with no keystroke (an opened file, the case) shows within a second',
   t1.length===1&&/Aggression toward staff/.test(t1[0])&&!/untitled/.test(t1[0])&&/Property destruction/.test(t2[0]),{t1,t2});
 /* R-045 */
 const scen={};for(const sc of ['attention','escape','flat']){await sim(p,sc);scen[sc]=await p.evaluate(()=>{const v=k=>{const e=document.querySelector('[name="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):'';};
   return {c:v('hyp.c'),a:v('hyp.a'),b:v('hyp.b'),dec:['abc','med','fa','single','interview'].filter(k=>v('dec.'+k)),note:v('dec.note')};});}
 ok('R-045: every scenario shows a finished hypothesis statement (conclusion, antecedent, behavior), a ticked Decision and a written rationale',
   Object.values(scen).every(o=>o.c.length>20&&o.a.length>5&&o.b.length>5&&o.dec.length>=1&&o.note.length>40),scen);
 await sim(p,'attention');
 const dr=await p.evaluate(()=>{['hyp.se','hyp.a','hyp.idio'].forEach(n=>{document.querySelector('[name="'+n+'"]').value='';});document.getElementById('hypDraft').click();const v=n=>document.querySelector('[name="'+n+'"]').value;
   return {se:v('hyp.se'),a:v('hyp.a'),int0:v('int[0].a'),fb:v('fast.before')};});
 ok('R-045: Draft from the convergence sheet fills the Antecedent from the interview cards and the FAST open-ended "before" answer, and a setting event two interviews name is written once with both sources',
   /^When /.test(dr.a)&&dr.a.includes(dr.int0)&&dr.a.includes(dr.fb)&&/FAST open-ended/.test(dr.a)&&(dr.se.match(/short sleep/g)||[]).length===1&&/interview 1 \(A\) and interview 2 \(B\)/.test(dr.se),dr);
 /* E-36 definition check */
 const df=await p.evaluate(()=>{const v=k=>(document.querySelector('[name="'+k+'"]')||{}).value;const before=[0,1,2].map(i=>v('inf['+i+'].defok'));window.__iaDefRecord(1,'QABF','unsure');
   return {before,after:v('inf[1].defok'),src:v('inf[1].defsrc'),note:document.getElementById('infDefNote').textContent,box:!document.getElementById('infDef').classList.contains('noprint')};});
 ok('E-36: each informant\'s answer to "Do you understand this definition?" is recorded (the simulation: Yes for all three); an Unsure from a respondent page replaces a Yes, names its page and asks for the definition to be gone over',
   df.before.every(x=>x==='Yes')&&df.after==='Unsure'&&/QABF page: Unsure/.test(df.src)&&/B \(unsure\)/.test(df.note)&&df.box,df);
 const src=fs.readFileSync(path.join(ROOT,'NBH-Workstation','IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html'),'utf8');
 ok('E-36: a collected response carries its page\'s answer onto the informant (the import passes it on)',/conf:o\.confirmed==null\?'':o\.confirmed/.test(src)&&/window\.__iaDefRecord\(idx,INST\[key\]\.title,r\.conf\)/.test(src));
 /* R-046 */
 const rp=await p.evaluate(()=>{document.getElementById('rpBtn').click();const l=document.querySelector('label[for="rpName"]').textContent,ph=document.querySelector('label[for="rpPhoto"]').textContent;const nm=document.getElementById('rpName').value;
   const d=document.getElementById('rpDlg')||document.querySelector('dialog[open]');if(d&&d.close)d.close();return {l,ph,nm,setup:document.getElementById('setup').textContent.replace(/\s+/g,' ')};});
 ok('R-046: the Respondent pages dialog names the student by initials by default, as Setup promises, and says a photo travels in the file and its emails',
   /initials by default/.test(rp.l)&&/^([A-Z]\.)+$/.test(rp.nm)&&/travels inside the page file and in every email/.test(rp.ph)&&/show the student by initials \(a first name only if you type one, a photo only if you add one/.test(rp.setup),{l:rp.l,nm:rp.nm,ph:rp.ph});
 /* R-047, R-048, R-051 */
 const txt=await p.evaluate(()=>({agree:['qabf','mas','pbq','fast'].map(k=>[...document.querySelectorAll('#'+k+' thead th')].map(t=>t.textContent).filter(t=>/^Agree/.test(t))[0]||''),
   cnt:(document.querySelector('#summary .ia-cnt')||{}).textContent||'',tag:(document.querySelector('#summary .verdict .tag')||{}).textContent||'',mast:document.body.textContent.replace(/\s+/g,' ')}));
 ok('R-047: the QABF, MAS and PBQ agreement column reads "Agree (within 1)"; the FAST (yes / no) keeps "Agree"',txt.agree.slice(0,3).every(x=>x==='Agree (within 1)')&&txt.agree[3]==='Agree',txt.agree);
 ok('R-048: the consensus line leads with informants; the counted-outcomes tally sits under it, labeled not independent',/informants/.test(txt.tag)&&!/counted outcomes/.test(txt.tag)&&/counted outcomes: a tally, not independent evidence/.test(txt.cnt),{tag:txt.tag,cnt:txt.cnt});
 ok('R-051: the masthead says the FAST\'s items are printed and the QABF, MAS, PBQ and WEFA items are not',/Item text is printed for the FAST only/.test(txt.mast)&&/QABF, MAS, PBQ and WEFA items are not reproduced/.test(txt.mast));
 /* E-36 minimum plan */
 const mp=await p.evaluate(async()=>{['fast','qabf','mas','pbq','wefa','int'].forEach(k=>{document.querySelector('[name="plan.'+k+'.u"]').value='';});document.getElementById('iaMinPlan').click();await new Promise(r=>setTimeout(r,300));
   return {plan:['fast','qabf','mas','pbq','wefa','int'].map(k=>document.querySelector('[name="plan.'+k+'.u"]').value),box:document.getElementById('iaMin').textContent};});
 ok('E-36: Setup recommends a minimum set (FAST and QABF per informant, one interview) with minutes per informant; one click writes it into the plan',
   mp.plan.join()==='Yes,Yes,No,No,No,Yes'&&/FAST about 10 minutes/.test(mp.box)&&/QABF about 10 to 15 minutes per informant/.test(mp.box),mp);
 /* E-37 keyboard entry */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="fast"]').click());await sleep(300);
 await p.evaluate(()=>{document.querySelector('[name="fast[0][1]"]').value='';document.querySelector('[name="fast[0][1]"]').focus();});await p.keyboard.press('y');await sleep(150);
 const k1=await p.evaluate(()=>({v:document.querySelector('[name="fast[0][1]"]').value,f:document.activeElement.name}));
 await p.keyboard.press('n');await sleep(150);const k2=await p.evaluate(()=>({v:document.querySelector('[name="fast[0][2]"]').value,f:document.activeElement.name}));
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="qabf"]').click());await sleep(300);
 await p.evaluate(()=>document.querySelector('[name="qabf[1][4]"]').focus());await p.keyboard.press('2');await sleep(150);const k3=await p.evaluate(()=>({v:document.querySelector('[name="qabf[1][4]"]').value,f:document.activeElement.name}));
 ok('E-37: typing an answer in an item box enters it and moves to the next item (Y then N on the FAST, a digit on the QABF)',
   k1.v==='Y'&&k1.f==='fast[0][2]'&&k2.v==='N'&&k2.f==='fast[0][3]'&&k3.v==='2'&&k3.f==='qabf[1][5]',{k1,k2,k3});
 /* E-37 prints */
 const po=await p.evaluate(()=>[...document.querySelectorAll('#iaPrintWhat option')].map(o=>o.value+'|'+o.textContent));
 await p.evaluate(()=>{const w=document.getElementById('iaPrintWhat');w.value='inf:1';});
 await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});
 const f=path.join(OUT,'ia143-informant.pdf');fs.writeFileSync(f,buf);const pi=pdfInfo(f)||{n:0,t:[]};const all=pi.t.join(' ').replace(/\s+/g,' ');
 const gone=await p.evaluate(()=>!document.getElementById('iaInfPrint')&&!document.body.classList.contains('ia-pr-inf'));
 await p.evaluate(()=>{document.getElementById('iaPrintWhat').value='';});
 ok('E-37: Print offers each informant\'s answers across the instruments; informant B\'s print is a page or two with the FAST and QABF answers and totals and nothing else of the form, and the sheet is gone after',
   po.some(x=>/^inf:1\|Informant B/.test(x))&&pi.n>=1&&pi.n<=2&&/Informant B: Answers Across the Instruments/.test(all)&&/FAST/.test(all)&&/QABF/.test(all)&&!/Hypothesis Statement/.test(all)&&gone,{po,n:pi.n,head:all.slice(0,300),gone});
 const sb=await p.evaluate(()=>{const b=document.getElementById('iaPrintSum');let asked=null;const pr=window.print;window.print=()=>{asked=document.getElementById('iaPrintWhat').value;};b.click();window.print=pr;return {there:!!b,asked,after:document.getElementById('iaPrintWhat').value};});
 await sleep(100);const sb2=await p.evaluate(()=>document.getElementById('iaPrintWhat').value);
 ok('E-37: the Summary sheet carries a button that prints the short summary (the scores and convergence) and leaves the print choice as it was',sb.there&&sb.asked==='scores'&&sb2==='',{sb,sb2});
 await p.context().close();
 /* R-050, R-131 on an iPad */
 p=await open({width:820,height:1180},{hasTouch:true});await sim(p);
 const pad={};for(const k of ['fast','qabf','mas','pbq','wefa','summary']){await p.evaluate(k=>document.querySelector('#viewSeg [data-view="'+k+'"]').click(),k);await sleep(400);
   pad[k]=await p.evaluate(k=>{const sel=[...document.querySelectorAll('#'+k+' table.grid.item select')].filter(s=>s.getBoundingClientRect().width);const s0=sel[0];let selW=0,gap=0;
     if(s0){selW=Math.round(s0.getBoundingClientRect().width);const row=[...s0.closest('tr').querySelectorAll('select')].map(x=>x.getBoundingClientRect());gap=row.length>1?Math.round(row[1].left-row[0].right):0;}
     let minFs=99,ov=0,figs=0,figW=[];document.querySelectorAll('#'+k+' .figure svg').forEach(svg=>{const bb=svg.getBoundingClientRect();if(!bb.width)return;figs++;figW.push(Math.round(bb.width));const sc=svg.getScreenCTM();
       const ts=[...svg.querySelectorAll('text')].filter(t=>t.getBoundingClientRect().width);ts.forEach(t=>{minFs=Math.min(minFs,parseFloat(getComputedStyle(t).fontSize)*sc.a);});
       for(let a=0;a<ts.length;a++)for(let c=a+1;c<ts.length;c++){const A=ts[a].getBoundingClientRect(),C=ts[c].getBoundingClientRect();if(Math.min(A.right,C.right)-Math.max(A.left,C.left)>2&&Math.min(A.bottom,C.bottom)-Math.max(A.top,C.top)>2)ov++;}});
     return {n:sel.length,selW,gap,minFs:Math.round(minFs*10)/10,ov,figs,figW};},k);}
 ok('R-050: on an iPad (820 px, touch) the item boxes on the FAST, QABF, MAS, PBQ and WEFA are at least 44 px wide and do not touch their neighbors',
   ['fast','qabf','mas','pbq','wefa'].every(k=>pad[k].n>10&&pad[k].selW>=44&&pad[k].gap>=6&&pad[k].gap<=30),pad);
 ok('R-131: on the iPad every chart sits on a row of its own and its text is 12 px or larger, with no label over another (benchmark labels staggered)',
   Object.values(pad).every(o=>o.figs===0||(o.minFs>=12&&o.ov===0&&o.figW.every(w=>w>=650))),pad);
 await p.context().close();
 /* R-131 ABC-1 */
 p=await (await b.newContext({viewport:{width:820,height:1180}})).newPage();p.on('pageerror',e=>errs.push('ABC-1: '+String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');await sleep(1500);
 await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('load-demo').click();});await sleep(3500);
 const abc=await p.evaluate(()=>{const tabs=[...document.querySelectorAll('[role="tab"],.tabs button,[data-tab]')];const res=[];return new Promise(async res2=>{for(const t of tabs){t.click();await new Promise(r=>setTimeout(r,350));
   document.querySelectorAll('svg.chart').forEach(svg=>{if(!svg.getBoundingClientRect().width)return;const sc=svg.getScreenCTM();let mn=99;svg.querySelectorAll('text').forEach(x=>{if(x.getBoundingClientRect().width)mn=Math.min(mn,parseFloat(getComputedStyle(x).fontSize)*sc.a);});res.push({id:(svg.closest('[id]')||{}).id,mn:Math.round(mn*10)/10});});}res2(res);});});
 ok('R-131: Form ABC-1\'s analysis charts show no text under 12 px on the iPad',abc.length>=8&&abc.every(x=>x.mn>=12),abc.filter(x=>x.mn<12).slice(0,5));
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
