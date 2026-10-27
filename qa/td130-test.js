/* v24.30 Form TD-1 from the independent review (R-022, R-113, R-114; E-12, E-40; C-22): the staff card first in the packet, the
   Final plan out of it, the flowchart's stop block kept whole, no citation alone on a page of the whole form, the protocol bank
   filtered to the plan's function and the student's grade band, the simulation's crisis boxes.
   usage: node qa/td130-test.js (WS_URL as in qa/lib.js; needs python3 with pymupdf) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const URL=BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const PY=`import sys,json,pymupdf
d=pymupdf.open(sys.argv[1]);o=[]
for i,pg in enumerate(d):
    px=pg.get_pixmap(dpi=36,colorspace=pymupdf.csGRAY);s=px.samples;w,h=px.width,px.height;top=int(h*.06);bot=int(h*.94);rows=0
    for r in range(top,bot):
        if any(v<200 for v in s[r*w:(r+1)*w]):rows+=1
    o.append({'n':i+1,'ink':round(100*rows/(bot-top)),'text':' '.join(pg.get_text().split())})
print(json.dumps(o))`;
const pdfPages=(buf,name)=>{const f=path.join(OUT,name);fs.writeFileSync(f,buf);const py=path.join(OUT,'td130-ink.py');fs.writeFileSync(py,PY);return JSON.parse(execFileSync('python3',['-I',py,f],{maxBuffer:64e6}).toString());};
const brief=P=>P.map(x=>x.n+':'+x.ink+'%').join(' ');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 const PDF=async()=>{await p.emulateMedia({media:'print'});const buf=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});return buf;};
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1500);

 /* ---- the toolbar ---- */
 const tb=await p.evaluate(()=>{const c=document.getElementById('printCardBtn'),k=document.getElementById('printPacketBtn');return {card:c&&c.textContent,prev:c&&c.previousElementSibling&&c.previousElementSibling.id,title:k&&k.title};});
 ok('the toolbar has Print the staff card beside Print the staff packet, whose title names the card first and the Final plan as its own printout',tb.card==='Print the staff card'&&tb.prev==='printPacketBtn'&&/staff card, then/.test(tb.title)&&/Final plan prints on its own/.test(tb.title),tb);

 /* ---- C-22: the simulation fills the protocol's and the protective card's boxes ---- */
 const sim=await p.evaluate(()=>{const v=n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;};const c=code=>{const k=document.querySelector('#compWrap .card[data-code="'+code+'"]');return k?k.dataset.i:null;};const pb=c('R_PB'),sf=c('SAFE');
  return {pb,sf,p1:pb&&v('cp['+pb+'].p1'),p2:pb&&v('cp['+pb+'].p2'),s0:sf&&v('cp['+sf+'].p0'),s1:sf&&v('cp['+sf+'].p1'),s2:sf&&v('cp['+sf+'].p2'),asks:window.__td1EE?window.__td1EE.issues().length:null};});
 ok('the simulation fills the consequence protocol\'s Blocking rule and Crisis trigger and the protective card\'s equipment, nursing review and crisis reference, and the form still asks nothing before printing',
   sim.pb&&sim.sf&&/never hold/.test(sim.p1)&&/2 hits within 10 s/.test(sim.p2)&&/blocking only/.test(sim.s0)&&/nurse/.test(sim.s1)&&/CR-1/.test(sim.s2)&&sim.asks===0,sim);

 /* ---- the staff card on the Implementation plan sheet ---- */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="plan"]').click());await sleep(700);
 const card=await p.evaluate(()=>{const c=document.getElementById('tdCard');const t=c.textContent.replace(/\s+/g,' ');const ks=[...c.querySelectorAll('.tc-k')].map(e=>e.textContent.trim());
  return {hidden:c.hidden,shown:getComputedStyle(c).display!=='none',fit:c.getAttribute('data-fit'),ks,t,head:document.getElementById('tdCardHead')&&document.getElementById('tdCardHead').textContent,btn:!!document.getElementById('printCardBtn2'),prev:c.previousElementSibling&&c.previousElementSibling.id};});
 ok('the sheet shows the staff card under the flowchart block, with its own print button',!card.hidden&&card.shown&&card.head==='Staff Card'&&card.btn&&card.prev==='tdCardNote',{hidden:card.hidden,head:card.head,prev:card.prev});
 ok('the card reads: the behavior with its function, the early sign, what to teach instead, the four responding boxes, the guidance and stop rule, and the crisis trigger with the crisis procedure',
   /Staff card: SIMULATED – Sample Student/.test(card.t)&&/maintained by escape from demands/.test(card.t)&&card.ks.includes('The behavior')&&card.ks.includes('Watch for (the early sign)')&&card.ks.includes('Instead, teach')&&card.ks.includes('When you see the early sign')&&card.ks.includes('When the behavior happens')&&card.ks.includes('After the episode')&&card.ks.includes('Never')&&card.ks.some(k=>/Guiding the student’s hands: yes/.test(k))&&card.ks.includes('Call for help: the crisis trigger')&&/Stop at once at resistance or any sign of distress: Resistance:/.test(card.t)&&/When: 2 hits within 10 s/.test(card.t)&&/Then: Trigger: 2 hits/.test(card.t)&&/If the student withdraws assent:/.test(card.t)&&/the plan governs/.test(card.t),{ks:card.ks,t:card.t.slice(0,600)});
 ok('nothing on the worked example\'s card is "not written yet"',!/not written yet/.test(card.t),card.t.match(/[^.]*not written yet[^.]*/g));
 const fit=await p.evaluate(()=>{const c=document.getElementById('tdCard'),m=c.cloneNode(true);m.removeAttribute('id');m.style.cssText='position:absolute;left:-9999px;top:0;width:7.7in;max-width:none';document.body.appendChild(m);const h=m.scrollHeight,fs=getComputedStyle(m).fontSize;m.remove();return {h,fs,fit:c.getAttribute('data-fit')};});
 ok('on a 7.7-inch width the card is shorter than 8.6 inches, in type of 11 px or larger',fit.h<=8.6*96&&parseFloat(fit.fs)>=11,fit);
 /* an empty form: the card waits */
 const empty=await p.evaluate(()=>{const F=window.td119;const d={beh:'',onTarget:'',onPrec:'',never:'',crisis:''};return typeof F.renderCard==='function'&&typeof F.printCard==='function';});
 ok('the card and its print are exposed to the workstation (td119.renderCard, td119.printCard)',empty);

 /* ---- Print the staff card ---- */
 await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;const vis=e=>getComputedStyle(e).display!=='none';window.__cardPrint={cls:document.body.className,sheets:[...document.querySelectorAll('.sheet')].filter(vis).map(s=>s.id),planKids:[...document.getElementById('plan').children].filter(vis).map(e=>e.id||e.className.split(' ')[0])};};});
 await p.emulateMedia({media:'print'});
 await p.evaluate(()=>document.getElementById('printCardBtn').click());await sleep(400);
 const cp=await p.evaluate(()=>window.__cardPrint);
 await p.emulateMedia({media:'screen'});await sleep(2300);
 const cpAfter=await p.evaluate(()=>({cls:document.body.className,prints:window.__prints}));
 ok('Print the staff card prints the Implementation plan sheet\'s print head and the card alone, then restores the page',cp&&/print-card/.test(cp.cls)&&cp.sheets.join()==='plan'&&cp.planKids.join()==='nbh-print-head,tdCard'&&cpAfter.prints===1&&!/print-card/.test(cpAfter.cls),{cp,cpAfter});
 await p.evaluate(()=>document.body.classList.add('print-card'));
 const CP=pdfPages(await PDF(),'td130-card.pdf');
 await p.evaluate(()=>document.body.classList.remove('print-card'));
 ok('on paper the staff card is one page, well filled, headed Staff card',CP.length===1&&CP[0].ink>=30&&/Staff card: SIMULATED/.test(CP[0].text)&&/Call for help/i.test(CP[0].text),brief(CP));

 /* ---- the whole form: no citation alone on a page ---- */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();});await sleep(800);await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());await sleep(300);
 const ALL=pdfPages(await PDF(),'td130-all.pdf');
 const selPg=ALL.find(x=>/Escape questions and options after Geiger/.test(x.text)),monPg=ALL.find(x=>/Reinforcement errors \(the problem behavior contacted the reinforcer\) are tracked separately/.test(x.text));
 ok('the whole-form print is no longer than before (46 pages; the simulation now fills five more boxes; 48 with the relapse safeguards of v24.48) and the staff card is not in it',ALL.length<=48&&!ALL.some(x=>/Staff card: SIMULATED/.test(x.text)),{pages:ALL.length});
 ok('the Select sheet\'s closing citation shares its page with the Select cards and Components chosen (page 4 held the citation alone)',!!selPg&&/Components chosen/.test(selPg.text)&&/R_PB/.test(selPg.text)&&selPg.ink>=18,selPg&&{n:selPg.n,ink:selPg.ink});
 ok('the monitor\'s closing citation shares its page with the verdict (the last page held the citation alone)',!!monPg&&/observed session/.test(monPg.text)&&monPg.ink>=18,monPg&&{n:monPg.n,ink:monPg.ink});
 const lightAll=ALL.slice(0,-1).filter(x=>x.ink<12);
 ok('no page of the whole form but the last is under 12% inked (pages 4 and 46 were 5% and 4%)',!lightAll.length,brief(ALL));
 /* ---- the staff packet ---- */
 await p.evaluate(()=>{window.print=()=>{};window.td119.printPacket();});await sleep(250);
 const pkDuring=await p.evaluate(()=>({cls:document.body.className,first:(()=>{const h=document.querySelector('#plan > .nbh-print-head');return h&&h.nextElementSibling&&h.nextElementSibling.id;})()}));
 const PK=pdfPages(await PDF(),'td130-packet.pdf');
 await sleep(2400);
 const pkAfter=await p.evaluate(()=>({cls:document.body.className,prev:document.getElementById('tdCard').previousElementSibling.id,finalInPlace:document.getElementById('final').previousElementSibling.id}));
 ok('the packet puts the card right after the sheet\'s print head while printing and back under the flowchart afterwards; the Final plan never moves',/print-packet/.test(pkDuring.cls)&&pkDuring.first==='tdCard'&&!/print-packet/.test(pkAfter.cls)&&pkAfter.prev==='tdCardNote'&&pkAfter.finalInPlace==='plan',{pkDuring,pkAfter});
 const stopPg=PK.find(x=>/Stop and switch to the crisis plan/.test(x.text));
 ok('the packet is shorter than before (it was 17 pages): page 1 is the staff card alone, page 2 opens the Implementation plan with the integrity checklist, and the Final plan is not in it',
   PK.length>=4&&PK.length<=13&&/Staff card: SIMULATED/.test(PK[0].text)&&!/Treatment Integrity Checklist/.test(PK[0].text)&&/Implementation Plan/.test(PK[1].text)&&/Treatment Integrity Checklist/.test(PK[1].text)&&!PK.some(x=>/Final Treatment Plan: Step by Step/.test(x.text)),{pages:PK.length,p1:PK[0].text.slice(0,200),p2:PK[1].text.slice(0,200)});
 ok('the flowchart\'s stop-and-switch block prints whole: the crisis instruction shares its page with "It is escalating beyond this plan" and the generated-on line',!!stopPg&&/It is escalating beyond this plan/.test(stopPg.text)&&/Generated from the treatment components/.test(stopPg.text),stopPg&&{n:stopPg.n,ink:stopPg.ink,text:stopPg.text.slice(0,300)});
 const lightPk=PK.slice(0,-1).filter(x=>x.ink<20);
 ok('no packet page but the last is light (under 20% of its rows inked)',!lightPk.length,brief(PK));
 ok('the last packet page holds more than the crisis instruction alone (it was 5%)',PK[PK.length-1].ink>=20,brief(PK));


 /* ---- E-40: the protocol bank opens filtered ---- */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="build"]').click());await sleep(500);
 await p.evaluate(()=>document.getElementById('tdBankOpen').click());await sleep(600);
 const bk=()=>p.evaluate(()=>{const R=document.getElementById('tdBankHost').shadowRoot,B=window.__tdBank;const age=R.querySelector('select.age'),fn=R.querySelector('select.fn');
  return {fn:fn.value,age:age.value,ageOpts:[...age.options].map(o=>o.textContent),cnt:R.querySelector('.cnt').textContent,ids:[...R.querySelectorAll('.it')].map(b=>b.dataset.id),inPlan:[...R.querySelectorAll('.it .inp')].length,
   nPlan:B.search('','','plan','').length,nPlanBand:B.search('','','plan',B.band()).length,nAll:B.search('','','','').length,band:B.band()};});
 let s1=await bk();
 ok('with no case student the bank opens on this plan\'s function (escape), any grade: the count line says so and offers Any function and Any grade',s1.fn==='plan'&&s1.age===''&&s1.ageOpts.length===7&&/^\d+ of \d+ protocols for this plan’s function \(escape\)\./.test(s1.cnt)&&/Any function and Any grade show the rest/.test(s1.cnt)&&s1.ids.length===s1.nPlan&&s1.nPlan<s1.nAll&&+(s1.cnt.match(/ of (\d+) protocols/)||[])[1]===s1.nAll   /* v24.73: the bank's total, not a fixed count */,{fn:s1.fn,age:s1.age,cnt:s1.cnt,n:[s1.ids.length,s1.nPlan,s1.nAll]});
 await p.evaluate(()=>{window.__nbhFactsIn({student:{name:'Simulated Student',id:'SIM-1',grade:'4'}});});await sleep(300);
 s1=await bk();
 const bandBad=await p.evaluate(ids=>ids.map(id=>[id,window.__tdBank.entry(id).age]).filter(x=>x[1]&&!window.__tdBank.ageOk(x[0],'35')),s1.ids);
 const bandAges=await p.evaluate(ids=>ids.map(id=>window.__tdBank.entry(id).age||''),s1.ids);
 ok('a case student in grade 4 sets the grade band to Grades 3–5 (marked "this student"): the list shrinks to protocols studied in those grades, with the count for both filters',
   s1.band==='35'&&s1.ageOpts.some(t=>/^Grades 3–5 \(this student\)$/.test(t))&&/for this plan’s function \(escape\), grades 3–5\./.test(s1.cnt)&&s1.ids.length===s1.nPlanBand&&s1.nPlanBand<s1.nPlan&&!bandBad.length&&!bandAges.some(a=>/^(14–22|18\+|9–12|Pre-K–K|Pre-K–2|K–2|K–1|Pre-K|1–2)$/.test(a)),{band:s1.band,cnt:s1.cnt,n:[s1.ids.length,s1.nPlanBand,s1.nPlan],bandBad:bandBad.slice(0,5),ages:[...new Set(bandAges)].slice(0,20)});
 const ageTab=await p.evaluate(()=>{const B=window.__tdBank,ids=B.search('','','','');const f=(id,b)=>B.ageOk(id,b);const e=id=>B.entry(id).age;const by=a=>ids.find(id=>e(id)===a);
  return {'14–22':['912','tr','35'].map(b=>f(by('14–22'),b)),'18+':['tr','912'].map(b=>f(by('18+'),b)),'Pre-K–2':['pk','12','35'].map(b=>f(by('Pre-K–2'),b)),'K–12':['pk','912','tr'].map(b=>f(by('K–12'),b)),'3–8':['12','35','68','912'].map(b=>f(by('3–8'),b))};});
 ok('the age line reads as grades (K–12, 3–8, Pre-K–2) and, above 12, as the transition years (14–22, 18+)',ageTab['14–22'].join()==='true,true,false'&&ageTab['18+'].join()==='true,false'&&ageTab['Pre-K–2'].join()==='true,true,false'&&ageTab['K–12'].join()==='true,true,false'&&ageTab['3–8'].join()==='false,true,true,false',ageTab);
 /* Any function one tap away, and the user's choice outlives the next case update */
 await p.evaluate(()=>{const R=document.getElementById('tdBankHost').shadowRoot,fn=R.querySelector('select.fn');fn.value='';fn.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
 let s2=await bk();await p.evaluate(()=>{window.__nbhFactsIn({student:{name:'Simulated Student',id:'SIM-1',grade:'4'}});});await sleep(300);const s3=await bk();
 ok('Any function is one tap away (the list grows to every protocol for the grade band, the count says "for grades 3–5") and the choice holds when the case updates',s2.fn===''&&s2.ids.length>s1.ids.length&&/protocols for grades 3–5[;.]/.test(s2.cnt)&&s3.fn===''&&s3.ids.length===s2.ids.length,{s2:{fn:s2.fn,n:s2.ids.length,cnt:s2.cnt},s3:{fn:s3.fn,n:s3.ids.length}});
 /* a protocol added from the bank is marked in the list */
 const added=await p.evaluate(async()=>{const B=window.__tdBank,R=document.getElementById('tdBankHost').shadowRoot;const ids=[...R.querySelectorAll('.it')].map(b=>b.dataset.id);
  const id=ids.find(i=>{const e=B.entry(i);return e&&!document.querySelector('#compWrap .card[data-code="'+e.code+'"]');});if(!id)return {id:null};
  B.show(id);await new Promise(r=>setTimeout(r,150));const add=R.querySelector('.detail button.add');add.click();await new Promise(r=>setTimeout(r,400));
  const it=R.querySelector('.it[data-id="'+id+'"]');return {id,code:B.entry(id).code,tag:it&&it.querySelector('.inp')&&it.querySelector('.inp').textContent,card:!!document.querySelector('#compWrap .card[data-code="'+B.entry(id).code+'"]'),tags:R.querySelectorAll('.it .inp').length};});
 ok('a protocol added from the bank is marked "in this plan" in the list',added.id&&added.card&&added.tag==='in this plan'&&added.tags===1,added);

 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
