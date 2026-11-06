/* v25.68 Form RS-1's BCBA trainee mode (research #21; the BCBA, 11/6). Simulated people and codes only ("Trainee T.
   (simulated)", "Jordan Ellis (simulated)", SIM-0002). The clock is held at March 15, 2027, so months on both sides of the
   January 1, 2027 switch are in the past. Checks, by the brief's items:
   1. the choice at the top: RBTs the default and unchanged; BCBA trainees shows the trainee pages in place of the RBT pages,
      the RBT record page leaves the views and the page arrows, and back to RBTs shows the RBT log as it was;
   2. the trainee's own record, entered through the page: the trainee, a supervisor (with the handbook's reminders), and
      entries of independent hours, an individual and a group supervision contact, an observation with feedback; hours by
      activity (unrestricted, restricted), supervised hours, contacts, observation minutes; an entry before the contract,
      an overlap and a group of 12 marked; running totals by fieldwork type, the 1.33 estimate, the unrestricted share and
      the five years;
   3. the monthly figures and minimums against the rules of the month's dates: December 2026 under the 2022 rules (130 hours,
      5%, four contacts, one observation), January and February 2027 under the 2027 rules (160 hours, 60 or 90 minutes of
      observation, 7.5% concentrated, no contacts); each month names its rules; a month before 2027 is also read against the
      2027 rules; the handbook's adjustment table for a short 2022 month, the hours entered for the form; concentrated hours
      not adjusted;
   4. the monthly verification form filled from the entries, in the order of the BACB's form: the 2027 form in hours and
      minutes with the observation, the 2022 form in decimal hours with the fieldwork type, both forms for a 2026 month;
      both signatures (one drawn, one typed and adopted); the deadline (a late signature marked); a change after signing
      marked; the due line;
   5. the final verification: the signed months by fieldwork type, the late and unsigned months left out and named, the
      supervisor's signature; the year summary with each month's rules and the running totals;
   6. Code 4.05's documentation note with "Check the current wording before printing", the line that the BACB's documents
      decide (their names and dates), "Check the current BACB documents before signing" on Setup, the month and Sign and print;
   7. the simulation: Trainee T. and a simulated BCBA, months under both rules, one short on purpose, the RBT records not
      changed; the RBT simulation keeps the trainee records and says so;
   8. the file: Save data carries the trainees and Open data gives them back the same; a file without trainees opens and saves
      unchanged; Clear all clears both;
   9. paper: the form and the record print on letter paper (no text under 7.5 pt), the RBT mode prints no trainee page, the
      packet takes the trainee papers in trainee mode; the CSV;
  10. the iPad sideways and upright (touch) and a phone: no sideways scroll, 44 px targets, every field labelled.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2568-rs1-trainee-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
const OUT=__dirname+'/out/v2568-rs1-trainee/';fs.mkdirSync(OUT,{recursive:true});
const URL=L.BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html';
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const NOW=new Date('2027-03-15T10:00:00');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const errs=[];
async function open(ctx,tag){const page=await ctx.newPage();L.wire(page,[]);page.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,300)));
  await page.clock.setFixedTime(NOW);await page.goto(URL);await sleep(900);
  await page.evaluate(()=>{window.__conf=[];window.confirm=t=>{window.__conf.push(String(t));return true;};window.alert=()=>{};window.print=()=>{};});return page;}
const X=(page,f,a)=>page.evaluate(f,a);
/* Save data's file, caught before it reaches the computer */
const grab=page=>page.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};
  const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};document.querySelector('#saveBtn').click();}));
const openFile=(page,text)=>page.evaluate(t=>{const i=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);
async function addVia(page,btn){const before=await X(page,()=>window.__rsTrainee.cur().entries.map(e=>e.id));await page.click(btn);await sleep(150);
  return X(page,b=>window.__rsTrainee.cur().entries.map(e=>e.id).find(id=>!b.includes(id)),before);}
const setMonth=(page,k)=>page.selectOption('#trMonthSel',k).then(()=>sleep(200));
const checks=page=>X(page,()=>[...document.querySelectorAll('#trCompBox li[data-check]')].map(li=>li.dataset.check+':'+li.dataset.s).join(' '));
/* entries put straight into the record (the bulk of a month's hours; the page's own add buttons are tested on their own) */
const bulk=(page,list)=>X(page,list=>{const t=window.__rsTrainee.cur(),sp=t.sups[0].id;list.forEach((e,i)=>t.entries.push(Object.assign({id:'b'+Math.random().toString(36).slice(2,9),kind:'ind',fmt:'indiv',grp:'',cat:'unr',obs:false,obsMin:'',obsHow:'',setting:'',sup:sp,client:'SIM-0002',sum:'simulated'},e)));
  t.entries.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));renderAll();},list);
const days=(k,from,n,start,end,o)=>Array.from({length:n},(_,i)=>Object.assign({date:k+'-'+String(from+i).padStart(2,'0'),start,end},o||{}));
(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1376,height:1032}});
  const page=await open(ctx,'main');
  /* ================= 1. the choice at the top ================= */
  const m0=await X(page,()=>({pressed:[...document.querySelectorAll('[data-rsmode]')].map(b=>b.dataset.rsmode+':'+b.getAttribute('aria-pressed')),tr:document.body.classList.contains('rs-trainee'),
    rbtShown:!!document.querySelector('section.only-setup:not(.tr-sec)').offsetParent,trShown:!!document.querySelector('#trSetup').offsetParent,who:!!document.querySelector('#rsWho').offsetParent,
    top:document.querySelector('#rsMode').compareDocumentPosition(document.querySelector('#rsWho'))&Node.DOCUMENT_POSITION_FOLLOWING,view:/view-setup/.test(document.body.className)}));
  ok('1 the choice at the top reads "Who you supervise": RBTs (pressed, the default) or BCBA trainees; the RBT log shows as before',m0.pressed.join()==='rbt:true,trainee:false'&&!m0.tr&&m0.rbtShown&&!m0.trShown&&m0.who&&m0.top&&m0.view,m0);
  const rbtBefore=await X(page,()=>document.querySelector('main.sheet').innerText.length);
  await page.click('[data-rsmode="trainee"]');await sleep(250);
  const m1=await X(page,()=>({pressed:document.querySelector('[data-rsmode="trainee"]').getAttribute('aria-pressed'),rbt:[...document.querySelectorAll('main.sheet>section:not(.tr-sec)')].some(s=>s.offsetParent),
    tr:!!document.querySelector('#trSetup').offsetParent,who:!!document.querySelector('#trWho').offsetParent,rbtBtn:document.querySelector('#viewSeg button[data-view="rbt"]').hidden,
    pn:(document.querySelector('.nbh-pn-where')||{}).textContent||''}));
  ok('1 BCBA trainees shows the trainee pages in place of the RBT pages, with its own trainee bar; the RBT record page leaves the views and the page count',
    m1.pressed==='true'&&!m1.rbt&&m1.tr&&m1.who&&m1.rbtBtn&&(!m1.pn||/of 5/.test(m1.pn)),m1);
  /* ================= 2. the trainee's record, by hand ================= */
  await page.fill('#trName','Trainee T. (simulated)');await page.fill('#trBacb','000000');await page.fill('#trState','Florida');await page.fill('#trCountry','United States');
  await page.fill('#trContract','2026-11-20');await page.fill('#trCourse','2026-09-01');
  const sid=await X(page,()=>window.__rsTrainee.cur().sups[0].id),SF=f=>'#ts_'+sid+'_'+f;
  const supNote0=await page.textContent(SF('issues'));
  await page.fill(SF('name'),'Jordan Ellis (simulated)');await page.fill(SF('cert'),'1-00-00000');await page.fill(SF('since'),'2019-06-15');await page.fill(SF('trained'),'2019-08-01');await page.check(SF('norel'));
  const supNote1=await page.textContent(SF('issues'));
  ok('2 the trainee and the supervisor are kept; the supervisor card lists the handbook’s reminders until each is recorded (it decides nothing)',
    /8-hour supervision training/.test(supNote1)===false&&/Everything this page asks/.test(supNote1)&&/name and BACB certification number/.test(supNote0)&&
    await X(page,()=>{const t=window.__rsTrainee.cur();return t.setup.name==='Trainee T. (simulated)'&&t.setup.contract==='2026-11-20'&&t.sups[0].name==='Jordan Ellis (simulated)'&&t.sups[0].norel===true;}),[supNote0,supNote1]);
  await page.fill(SF('trained'),'2026-12-01');const supLate=await page.textContent(SF('issues'));await page.fill(SF('trained'),'2019-08-01');
  ok('2 a supervision training dated after the contract is marked (BCBA Handbook, p. 18)',/after the contract/.test(supLate),supLate);
  await page.evaluate(()=>setView('month'));await sleep(200);
  await setMonth(page,'2026-12');
  /* the page's own buttons: independent hours, an individual contact, a group contact, an observation */
  const F=(id,f)=>'#te_'+id+'_'+f;
  let id=await addVia(page,'#trAddInd');await page.fill(F(id,'date'),'2026-12-02');await page.fill(F(id,'start'),'08:00');await page.fill(F(id,'end'),'12:00');await page.selectOption(F(id,'cat'),'res');
  const card1=await X(page,i=>{const d=document.querySelector('details.tr-ent[data-teid="'+i+'"]');return {open:d.open,sum:d.querySelector('summary').textContent};},id);
  id=await addVia(page,'#trAddSupC');await page.fill(F(id,'date'),'2026-12-03');await page.fill(F(id,'start'),'13:00');await page.fill(F(id,'end'),'15:00');await page.selectOption(F(id,'cat'),'unr');await page.fill(F(id,'sumx'),'Reviewed the week’s data; feedback on the FBA summary.');
  id=await addVia(page,'#trAddSupC');await page.fill(F(id,'date'),'2026-12-10');await page.fill(F(id,'start'),'13:00');await page.fill(F(id,'end'),'15:00');await page.selectOption(F(id,'cat'),'unr');await page.selectOption(F(id,'fmt'),'group');await sleep(80);
  await page.fill(F(id,'grp'),'12');await sleep(80);
  const big=await checks(page);await page.fill(F(id,'grp'),'4');
  const obsId=await addVia(page,'#trAddObs');await page.fill(F(obsId,'date'),'2026-12-17');await page.fill(F(obsId,'start'),'09:00');await page.fill(F(obsId,'end'),'10:00');await page.fill(F(obsId,'setting'),'Simulated Elementary, classroom 4');
  const obsCard=await X(page,i=>{const d=document.querySelector('details.tr-ent[data-teid="'+i+'"]');return {obs:d.querySelector('[data-trf="obs"]').checked,shown:!d.querySelector('[data-trshow="obs"]').hidden,note:d.querySelector('.tr-kindnote').textContent};},obsId);
  ok('2 Add independent hours, Add a supervision contact and Add an observation open a new entry card; an observation with feedback is a supervision contact and observation (BCBA Handbook, p. 20)',
    card1.open&&/Independent/.test(card1.sum)&&/Restricted/.test(card1.sum)&&obsCard.obs&&obsCard.shown&&/as a contact and as observation/.test(obsCard.note),[card1,obsCard]);
  ok('2 a group of 12 trainees is marked (a group has 2 to 10, p. 20)',/group:fail/.test(big),big);
  /* an entry before the contract, and an overlap */
  id=await addVia(page,'#trAddInd');await page.fill(F(id,'date'),'2026-12-17');await page.fill(F(id,'start'),'09:30');await page.fill(F(id,'end'),'11:00');await page.selectOption(F(id,'cat'),'unr');
  const ov=await page.textContent(F(id,'is'));
  await X(page,i=>{const t=window.__rsTrainee.cur();t.entries=t.entries.filter(e=>e.id!==i);renderAll();},id);
  await setMonth(page,'2026-11');id=await addVia(page,'#trAddInd');await page.fill(F(id,'date'),'2026-11-16');await page.fill(F(id,'start'),'08:00');await page.fill(F(id,'end'),'09:00');await page.selectOption(F(id,'cat'),'unr');
  const early=await page.textContent(F(id,'is'));const earlyChk=await checks(page);
  ok('2 an entry that overlaps another is noted (log each stretch once), and one dated before the supervision contract is marked (BCBA Handbook, p. 15)',/Overlaps the entry/.test(ov)&&/Before the supervision contract/.test(early)&&/early:fail/.test(earlyChk),[ov,early,earlyChk]);
  await X(page,i=>{const t=window.__rsTrainee.cur();t.entries=t.entries.filter(e=>e.id!==i);renderAll();},id);
  /* December 2026: 120 more independent hours; 129 in all, 5 supervised (3.9%), three contacts, one observation */
  await bulk(page,days('2026-12',18,12,'08:00','18:00').concat([{date:'2026-12-31',start:'08:00',end:'08:00'}].slice(0,0)));
  await setMonth(page,'2026-12');
  const dec=await X(page,()=>{const s=window.__rsTrainee.tStats('2026-12');return {rs:s.rs.id,tot:s.tot/60,sup:s.sup/60,pct:Math.round(s.pct*100)/100,contacts:s.contacts,obsN:s.obsN,obsMin:s.obsMin,indiv:s.indiv/60,grp:s.grp/60,unr:s.unr/60,res:s.res/60,status:s.status,c:s.checks.map(c=>c.k+':'+c.s).join(' ')};});
  const decUi=await X(page,()=>({rules:document.querySelector('#trMRules').textContent,panel:document.querySelector('#trCompBox').textContent,opt:document.querySelector('#trMonthSel').selectedOptions[0].textContent}));
  ok('2 hours by activity and kind: December has 129 h (125 unrestricted, 4 restricted), 5 h supervised (3 h individual, 2 h group), 3 contacts and 60 minutes of observation',
    dec.tot===129&&dec.sup===5&&dec.indiv===3&&dec.grp===2&&dec.contacts===3&&dec.obsN===1&&dec.obsMin===60&&dec.res===4&&dec.unr===125,dec);
  /* ================= 3. the month's minimums, by the rules of its dates ================= */
  ok('3 December 2026 uses the 2022 rules and says so: 129 h within 20 to 130 met, 3.88% under 5% not met, 3 of 4 contacts not met, one observation met, group not over half met',
    dec.rs==='2022'&&/2022 BCBA fieldwork requirements/.test(decUi.rules)&&/through December 31, 2026/.test(decUi.rules)&&/hours:ok/.test(dec.c)&&/pct:fail/.test(dec.c)&&/contacts:fail/.test(dec.c)&&/obs:ok/.test(dec.c)&&/indiv:ok/.test(dec.c)&&dec.status==='fail'&&/2022 rules · short/.test(decUi.opt),[dec,decUi.opt]);
  ok('3 a month before 2027 is also read against the 2027 rules (for an application on or after January 1, 2027)',/Against the 2027 rules/.test(decUi.panel)&&/short/.test(decUi.panel)&&!/contacts/i.test(decUi.panel.split('Against the 2027 rules')[1].split('A. Independent')[0]),decUi.panel.slice(0,400));
  const adj=await page.textContent('#trAdj');
  ok('3 the handbook’s adjustment table for the short 2022 month: the contacts prorated (3 of 4, 96.75 of 129 hours) and the independent hours decreased to 95 for 5%, with more than one to work out together',
    /The handbook.s adjustments for this month/.test(adj)&&/prorate the hours based on the percentage of contacts/.test(adj)&&/96\.75 of 129\.00 hours/.test(adj)&&/independent 95\.00 h, supervised 5\.00 h/.test(adj)&&/More than one applies/.test(adj),adj.slice(0,600));
  await page.fill('#trAdjInd','95');await sleep(100);
  const formH=await X(page,()=>window.__rsTrainee.formHours('2026-12'));
  ok('3 the hours entered for the form (95 independent) are the form’s, the record keeps every hour accrued',formH.ind===95*60&&formH.sup===300&&formH.adj&&await X(page,()=>window.__rsTrainee.tStats('2026-12').ind===124*60),formH);
  /* January 2027: 150 h independent, 8 h individual supervision with 45 minutes of observation: 158 h */
  await bulk(page,days('2027-01',4,15,'08:00','18:00').concat([{date:'2027-01-20',start:'13:00',end:'17:00',kind:'sup',obs:true,obsMin:'45',setting:'Simulated Elementary'},{date:'2027-01-27',start:'13:00',end:'17:00',kind:'sup'}]));
  await setMonth(page,'2027-01');
  const jan=await X(page,()=>{const s=window.__rsTrainee.tStats('2027-01');return {rs:s.rs.id,tot:s.tot/60,pct:Math.round(s.pct*100)/100,obsMin:s.obsMin,c:s.checks.map(c=>c.k+':'+c.s).join(' '),status:s.status,
    as22:window.__rsTrainee.tStats('2027-01',null,'2022').checks.find(c=>c.k==='hours').s};});
  const janUi=await X(page,()=>({rules:document.querySelector('#trMRules').textContent,opt:document.querySelector('#trMonthSel').selectedOptions[0].textContent}));
  ok('3 January 2027 uses the 2027 rules and says so: 158 h within 20 to 160 (over the 2022 rules’ 130), no contacts minimum, 45 of 60 minutes of observation not met',
    jan.rs==='2027'&&/2027 BCBA fieldwork requirements/.test(janUi.rules)&&/from January 1, 2027/.test(janUi.rules)&&jan.tot===158&&/hours:ok/.test(jan.c)&&!/contacts/.test(jan.c)&&/obs:fail/.test(jan.c)&&jan.as22==='fail'&&/2027 rules/.test(janUi.opt),[jan,janUi]);
  const jid=await X(page,()=>window.__rsTrainee.cur().entries.find(e=>e.date==='2027-01-20').id);
  await X(page,i=>{const d=document.querySelector('details.tr-ent[data-teid="'+i+'"]');d.open=true;},jid);await page.fill(F(jid,'obsMin'),'60');await sleep(100);
  const jan2=await X(page,()=>({c:window.__rsTrainee.tStats('2027-01').checks.map(c=>c.k+':'+c.s).join(' '),st:window.__rsTrainee.tStats('2027-01').status,adj:document.querySelector('#trAdj').textContent}));
  ok('3 sixty minutes of observation meet the 2027 rule (cumulative minutes) and the month is met',/obs:ok/.test(jan2.c)&&jan2.st==='ok',jan2);
  /* February 2027, concentrated: 100 h independent, 9 h supervised (8.26%: over 7.5%, under the 2022 rules' 10%), 90 minutes observed */
  await bulk(page,days('2027-02',1,10,'08:00','18:00').concat([{date:'2027-02-11',start:'13:00',end:'14:30',kind:'sup',obs:true,setting:'Simulated Elementary'},{date:'2027-02-12',start:'13:00',end:'15:00',kind:'sup'},{date:'2027-02-16',start:'13:00',end:'15:30',kind:'sup'},{date:'2027-02-18',start:'13:00',end:'16:00',kind:'sup'}]));
  await setMonth(page,'2027-02');await page.selectOption('#trMType','conc');await sleep(150);
  const feb=await X(page,()=>{const s=window.__rsTrainee.tStats('2027-02');return {ft:s.ft,pct:Math.round(s.pct*100)/100,c:s.checks.map(c=>c.k+':'+c.s+'('+c.t+')').join(' | '),status:s.status,as22:window.__rsTrainee.tStats('2027-02',null,'2022').checks.find(c=>c.k==='pct').s};});
  ok('3 a concentrated 2027 month needs 7.5% supervised and 90 minutes of observation: 8.26% and 90 minutes are met (the 2022 rules would need 10%)',
    feb.ft==='conc'&&feb.pct===8.26&&/at least 7\.5%/.test(feb.c)&&/90 minutes/.test(feb.c)&&feb.status==='ok'&&feb.as22==='fail',feb);
  /* a short concentrated month is not adjusted */
  const conc=await X(page,()=>{const t=window.__rsTrainee.cur(),m=t.months['2027-02'];m.ftype='conc';const saved=t.entries.slice();t.entries=t.entries.filter(e=>!(e.date==='2027-02-18'));renderAll();
    const txt=document.querySelector('#trAdj').textContent;t.entries=saved;renderAll();return txt;});
  ok('3 a concentrated month that falls short is not prorated or adjusted (BCBA Handbook, p. 23)',/Concentrated hours may not be prorated or adjusted/.test(conc),conc.slice(0,300));
  /* ================= 2 (cont.) running totals ================= */
  await page.evaluate(()=>setView('year'));await sleep(250);
  const yr=await X(page,()=>({m:document.querySelector('#trMetrics').textContent,rows:[...document.querySelectorAll('#trYearTbl tbody tr')].map(r=>r.innerText.replace(/\s+/g,' ').trim()),note:document.querySelector('#trTotNote').textContent}));
  ok('2 running totals: 287 h supervised fieldwork of 2,000, 109 h concentrated of 1,500, the 1.33 estimate (432.0), the unrestricted share and the five years from December 2026',
    /Supervisedfieldwork287\.00/.test(yr.m.replace(/\s+/g,''))&&/Concentratedfieldwork109\.00/.test(yr.m.replace(/\s+/g,''))&&/432\.0/.test(yr.m)&&/1\.33/.test(yr.m)&&/Unrestricted/.test(yr.m)&&/complete by the end of November 2031/.test(yr.m),yr.m);
  ok('5 the month-by-month table names each month’s rules (December 2022, January and February 2027) and its status',
    yr.rows.some(r=>/^December 2026 2022 Supervised 129\.00/.test(r)&&/short/.test(r))&&yr.rows.some(r=>/^January 2027 2027 Supervised 158\.00/.test(r)&&/met/.test(r))&&yr.rows.some(r=>/^February 2027 2027 Concentrated 109\.00/.test(r)),yr.rows.slice(4,8));
  /* ================= 4. the monthly verification form ================= */
  await page.evaluate(()=>setView('print'));await sleep(250);await page.selectOption('#trPMonthSel','2027-02');await sleep(200);
  const due0=await X(page,()=>window.__nbhDue().filter(d=>/Sign the trainee form/.test(d.what)).map(d=>d.what+' '+d.date));
  /* the supervisor draws, the trainee types and adopts */
  const pad=await page.$('canvas.tr-pad[data-trpad="sup"]');await pad.scrollIntoViewIfNeeded();await sleep(100);const bb=await pad.boundingBox();
  await page.mouse.move(bb.x+30,bb.y+bb.height/2);await page.mouse.down();for(let i=1;i<=12;i++)await page.mouse.move(bb.x+30+i*25,bb.y+bb.height/2+(i%2?14:-14));await page.mouse.up();await sleep(150);
  await X(page,()=>{document.querySelectorAll('#trPrint .rs-sign details.rs-typesig').forEach(d=>d.open=true);});
  /* a tap in the typed signature box offers the trainee's name; ticking the box enables Adopt and sign */
  await page.click('#trTsTr');await sleep(80);const pre=await page.inputValue('#trTsTr');const dis0=await page.isDisabled('[data-trtsgo="tr"]');
  await page.check('#trTsOkTr');await page.click('[data-trtsgo="tr"]');await sleep(200);
  const fv=await X(page,()=>{const t=window.__rsTrainee.cur(),g=t.months['2027-02'].sig,o=document.querySelector('#trFormOut');return {sup:!!g.sup_img,supHow:g.sup_how,tr:!!g.tr_img,trHow:g.tr_how,trName:g.tr_name,supDate:g.sup_date,trDate:g.tr_date,imgs:o.querySelectorAll('img').length,txt:o.innerText.replace(/\s+/g,' '),vers:[...o.querySelectorAll('.tr-fvf')].map(x=>x.dataset.ver),stat:[...document.querySelectorAll('[data-trsigstat]')].map(e=>e.textContent)};});
  ok('4 the February form is the 2027 form, filled from the entries: trainee, BACB ID, 02/2027, state and country, supervisor and number, A 100 hh 00 mm, B 9 hh 00 mm, 1 hh 30 mm of observation, total 109 hh 00 mm, 8.26%',
    fv.vers.join()==='2027'&&/2027 Fieldwork Requirements/.test(fv.txt)&&/Trainee Name: Trainee T\. \(simulated\)/.test(fv.txt)&&/BACB ID #: 000000/.test(fv.txt)&&/Month\/Year: 02\/2027/.test(fv.txt)&&/Florida/.test(fv.txt)&&/United States/.test(fv.txt)&&
    /Supervisor Name: Jordan Ellis \(simulated\)/.test(fv.txt)&&/1-00-00000/.test(fv.txt)&&/A\. Independent Hours \(supervisor not present\): 100 hh 00 mm/.test(fv.txt)&&/B\. Supervised Hours \(supervisor present\): 9 hh 00 mm/.test(fv.txt)&&
    /include 1 hh 30 mm of observation/.test(fv.txt)&&/Total Fieldwork Hours \(add A & B\): 109 hh 00 mm/.test(fv.txt)&&/8\.26%/.test(fv.txt)&&!/Fieldwork Type \(Select One\)/.test(fv.txt),fv.txt.slice(0,1200));
  ok('4 both signatures: the supervisor drawn, the trainee typed and adopted, each dated the day signed and shown on the form with how and when',
    pre==='Trainee T. (simulated)'&&dis0&&fv.sup&&fv.supHow==='drawn'&&fv.tr&&fv.trHow==='typed'&&fv.trName==='Trainee T. (simulated)'&&fv.supDate==='2027-03-15'&&fv.trDate==='2027-03-15'&&fv.imgs===2&&/Signed electronically: drawn/.test(fv.txt)&&/typed name adopted/.test(fv.txt)&&fv.stat.slice(0,2).every(s=>/Signed for February 2027/.test(s)),fv);
  ok('4 the form says it is laid out as the BACB’s form, is not the BACB’s form, and carries the BACB’s attestation and its 7-year line',
    /in the order of the BACB.s Monthly Fieldwork Verification Form/.test(fv.txt)&&/It is not the BACB.s form/.test(fv.txt)&&/The trainee completed the fieldwork in compliance with all relevant fieldwork requirements/.test(fv.txt)&&/AT LEAST 7 YEARS/.test(fv.txt),fv.txt.slice(0,600));
  const due1=await X(page,()=>window.__nbhDue().filter(d=>/Sign the trainee form/.test(d.what)).map(d=>d.what+' '+d.date));
  ok('4 the due line lists a trainee form to sign until both have signed',due0.some(d=>/February 2027.* 2027-03-31$/.test(d))&&!due1.some(d=>/February 2027/.test(d)),[due0,due1]);
  /* a change after both signed */
  await X(page,()=>{const t=window.__rsTrainee.cur();t.entries.find(e=>e.date==='2027-02-12'&&e.kind==='sup').end='15:30';renderAll();});await sleep(100);
  const chg=await X(page,()=>({w:document.querySelector('#trSigChanged').hidden,txt:document.querySelector('#trSigChanged').textContent,f:document.querySelector('#trFormOut').textContent,st:window.__rsTrainee.sigState('2027-02').changed}));
  ok('4 a change to the figures after both signed is said on the page and on the form, to sign again',!chg.w&&/sign again/.test(chg.txt)&&/changed after this form was signed/.test(chg.f)&&chg.st,chg.txt);
  await X(page,()=>{const t=window.__rsTrainee.cur();t.entries.find(e=>e.date==='2027-02-12'&&e.kind==='sup').end='15:00';renderAll();});
  /* December: the 2022 form, both forms; signed by name and date in January (on time) */
  await page.selectOption('#trPMonthSel','2026-12');await sleep(200);
  await page.fill('#trSgSup','Jordan Ellis (simulated)');await page.fill('#trSgSupDate','2027-01-10');await page.fill('#trSgTr','Trainee T. (simulated)');await page.fill('#trSgTrDate','2027-01-12');await sleep(100);
  const f22=await X(page,()=>{const o=document.querySelector('#trFormOut');return {vers:[...o.querySelectorAll('.tr-fvf')].map(x=>x.dataset.ver),txt:o.innerText.replace(/\s+/g,' '),box:[...o.querySelectorAll('.f-box')].map(b=>b.textContent).join('|'),opts:[...document.querySelector('#trFormVer').options].map(x=>x.value)};});
  ok('4 the December form is the 2022 form in decimal hours: the fieldwork type ticked (Supervised), A 95.00 (adjusted), B 5.00, total 100.00, 5.00%, the 2022 attestations (contacts, observation)',
    f22.vers.join()==='2022'&&/2022 Fieldwork Requirements/.test(f22.txt)&&/Fieldwork Type \(Select One\)/.test(f22.txt)&&f22.box.startsWith('✕|')&&/A\. Independent Hours \(supervisor not present\): 95\.00/.test(f22.txt)&&/B\. Supervised Hours \(supervisor present\): 5\.00/.test(f22.txt)&&
    /Total Fieldwork Hours \(add A & B\): 100\.00/.test(f22.txt)&&/5\.00%/.test(f22.txt)&&/The required number of supervisory contacts occurred during this month/.test(f22.txt)&&/short of the 2022 rules/.test(f22.txt)&&/were adjusted/.test(f22.txt),f22.txt.slice(0,1500));
  await page.selectOption('#trFormVer','both');await sleep(150);
  const both=await X(page,()=>[...document.querySelectorAll('#trFormOut .tr-fvf')].map(x=>x.dataset.ver));
  ok('4 a 2026 month can print the 2027 form too, or both (the BACB recommends both when the application date is not known); a 2027 month offers only the 2027 form',
    both.join()==='2022,2027'&&f22.opts.join()===',2027,both'&&await X(page,()=>{const k=window.__rsTrainee.key();window.__rsTrainee.setKey('2027-01');setView('print');const d=document.querySelector('#trFormVer').disabled;window.__rsTrainee.setKey(k);return d;}),[both,f22.opts]);
  await page.selectOption('#trFormVer','');
  /* January signed today: after February 28, too late */
  await page.selectOption('#trPMonthSel','2027-01');await sleep(150);await page.fill('#trSgSup','Jordan Ellis (simulated)');await page.fill('#trSgSupDate','2027-03-15');await page.fill('#trSgTr','Trainee T. (simulated)');await page.fill('#trSgTrDate','2027-03-15');await sleep(100);
  const late=await X(page,()=>({s:window.__rsTrainee.sigState('2027-01'),li:(setView('month'),window.__rsTrainee.setKey('2027-01'),document.querySelector('#trCompBox li[data-check="sign"]').textContent)}));
  ok('4 a form signed after the last day of the following month is marked (sign by 2/28/2027)',late.s.late&&late.s.by==='2027-02-28'&&/after the deadline of 2\/28\/2027/.test(late.li),late);
  /* ================= 5. the final verification and the year summary ================= */
  await page.evaluate(()=>setView('print'));await sleep(200);
  await page.selectOption('#trFinFrom','2026-12');await page.selectOption('#trFinTo','2027-02');await page.selectOption('#trFinVer','2027');await sleep(120);
  const fpad=await page.$('canvas.tr-pad[data-trpad="fin"]');await fpad.scrollIntoViewIfNeeded();await sleep(100);const fb=await fpad.boundingBox();
  await page.mouse.move(fb.x+40,fb.y+fb.height/2);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(fb.x+40+i*30,fb.y+fb.height/2+(i%2?12:-12));await page.mouse.up();await sleep(150);
  const fin=await X(page,()=>{const o=document.querySelector('#trFinalOut');return {txt:o.innerText.replace(/\s+/g,' '),img:o.querySelectorAll('img').length,cols:[...o.querySelectorAll('.f-cols .c')].map(c=>c.textContent)};});
  ok('5 the final verification (2027 form): the signed months by type, December (the hours on its form) as supervised fieldwork and February as concentrated; January (signed late) left out and named',
    /FINAL \| FIELDWORK VERIFICATION FORM/.test(fin.txt)&&/Start Date \(MM\/YYYY\): 12\/2026/.test(fin.txt)&&/End Date \(MM\/YYYY\): 02\/2027/.test(fin.txt)&&fin.cols[0]==='95 hh 00 mm'&&fin.cols[1]==='100 hh 00 mm'&&fin.cols[2]==='5 hh 00 mm'&&fin.cols[3]==='9 hh 00 mm'&&fin.cols[4]==='100 hh 00 mm'&&fin.cols[5]==='109 hh 00 mm'&&
    /signed after the last day of the following month.*January 2027/.test(fin.txt)&&/Signed but short of a requirement: December 2026/.test(fin.txt)&&/without multiplier/.test(fin.txt),[fin.cols,fin.txt.slice(0,900)]);
  ok('5 the final verification carries the supervisor’s signature and the final form’s attestations',fin.img===1&&/I am the supervisor designated in the signed supervision contract/.test(fin.txt)&&/Information presented on this Final Fieldwork Verification Form/.test(fin.txt),fin.img);
  const yo=await X(page,()=>document.querySelector('#trYearOut').innerText.replace(/\s+/g,' '));
  ok('5 the year summary prints each month with its rules and status, and the running totals with the five years and the unrestricted share',
    /Fieldwork Year Summary/.test(yo)&&/December 2026 2022 Supervised 129\.00/.test(yo)&&/February 2027 2027 Concentrated 109\.00/.test(yo)&&/Running totals to March 2027/i.test(yo)&&/Five years from the first month December 2026 to the end of November 2031/i.test(yo)&&/Unrestricted share/i.test(yo),yo.slice(0,900));
  /* ================= 6. Code 4.05, the documents, the check line ================= */
  await page.evaluate(()=>setView('guide'));await sleep(200);
  const g=await X(page,()=>({code:document.querySelector('#trCodeNote').textContent,docs:document.querySelector('#trDocsLine').textContent,src:document.querySelector('#trRules2').textContent,shown:!!document.querySelector('#trGuide').offsetParent}));
  ok('6 Code 4.05’s documentation note, marked "Check the current wording before printing"',g.shown&&/Code 4\.05 of the Ethics Code for Behavior Analysts \(BACB, 2020\) requires supervision documentation/.test(g.code)&&/Check the current wording before printing/.test(g.code),g.code);
  ok('6 a line that the BACB’s documents decide, with their names and dates',/documents decide/.test(g.docs)&&/BCBA Handbook \(updated 10\/2026\)/.test(g.docs)&&/2027 BCBA Requirements \(updated 02\/2026\)/.test(g.docs)&&/2027 Transition \(updated 01\/2026\)/.test(g.docs)&&/version 06\/2026/.test(g.docs)&&/version 08\/2023/.test(g.docs),g.docs);
  ok('6 the Guide gives the sentence and the page behind each rule (130 hours p. 16, contacts p. 20, the 2027 contacts eliminated in the March 2022 newsletter, the application rule)',
    /no fewer than 20 and no more than 130 hours/.test(g.src)&&/BCBA Handbook, p\. 16/.test(g.src)&&/at least four supervisor-trainee contacts/.test(g.src)&&/March 2022, p\. 4/.test(g.src)&&/requirements in place at the time you submit your certification application/.test(g.src),g.src.slice(0,300));
  const chk={};for(const v of ['setup','month','print']){await page.evaluate(v=>setView(v),v);await sleep(120);chk[v]=await X(page,()=>[...document.querySelectorAll('.tr-sec')].filter(s=>s.offsetParent).some(s=>/Check the current BACB documents before signing/.test(s.innerText)));}
  ok('6 "Check the current BACB documents before signing" is on Setup, the month and Sign and print',chk.setup&&chk.month&&chk.print,chk);
  /* ================= 9. paper ================= */
  await page.evaluate(()=>{setView('print');window.__rsTrainee.setKey('2027-02');});await sleep(200);
  const nodes=await X(page,()=>window.nbhPrintNodes().map(n=>n.id));
  await page.evaluate(()=>document.body.classList.add('tr-print-month'));await page.emulateMedia({media:'print'});
  const pf=await X(page,()=>{let min=99,at='';['#trFormOut','#trLogOut'].forEach(sel=>document.querySelectorAll(sel+' *').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=parseFloat(getComputedStyle(e).fontSize);if(f<min){min=f;at=e.tagName+':'+e.textContent.slice(0,30);}}));
    return {min,at,shown:[...document.querySelectorAll('section')].filter(s=>getComputedStyle(s).display!=='none').map(s=>s.id||s.className),year:getComputedStyle(document.querySelector('#trYearOut')).display};});
  await page.pdf({path:OUT+'trainee-month.pdf',format:'Letter',margin:{top:'0.5in',bottom:'0.55in',left:'0.5in',right:'0.5in'}});
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('tr-print-month'));
  const pdfTxt=fs.readFileSync(OUT+'trainee-month.pdf','latin1'),pages=(pdfTxt.match(/\/Type\s*\/Page[^s]/g)||[]).length;
  ok('9 the form and the month’s record print on letter paper, on 2 to 5 pages, with no text under 7.5 pt; only the trainee’s Sign and print papers',pages>=2&&pages<=5&&pf.min>=9.99&&pf.shown.join()==='trPrint'&&pf.year==='none',[pages,pf]);
  ok('9 the workstation’s packet takes the trainee’s form, record and year summary in trainee mode',nodes.join()==='trFormOut,trLogOut,trYearOut',nodes);
  const csv=await X(page,()=>new Promise(res=>{const mk=URL.createObjectURL;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};document.querySelector('#csvBtn').click();}));
  ok('9 Export CSV in trainee mode writes the trainee’s entries with the fields the handbook lists (date, times, fieldwork type, supervisor, individual or group, activity, observation, summary)',
    /^"Trainee","BACB ID","Month","Rules","Fieldwork type","Date","Start","End"/.test(csv)&&/"Supervision type"/.test(csv)&&/"Activity category"/.test(csv)&&/"2027-02-11","13:00","14:30"/.test(csv)&&/"Concentrated supervised fieldwork"/.test(csv),csv.slice(0,300));
  /* ================= 8. the file ================= */
  const file=await grab(page);const J=JSON.parse(file);
  ok('8 Save data carries the trainee beside the RBT records',Array.isArray(J.trainees)&&J.trainees.length===1&&J.trainees[0].setup.name==='Trainee T. (simulated)'&&J.trainees[0].entries.length>40&&J.S&&J.form==='RS-1',Object.keys(J));
  const p2=await open(ctx,'reopen');await openFile(p2,file);await sleep(900);
  const file2=await grab(p2);const strip=t=>{const o=JSON.parse(t);delete o.saved;return JSON.stringify(o);};
  if(JSON.stringify(JSON.parse(file).trainees)!==JSON.stringify(JSON.parse(file2).trainees)){fs.writeFileSync(OUT+'file1.json',JSON.stringify(JSON.parse(file),null,1));fs.writeFileSync(OUT+'file2.json',JSON.stringify(JSON.parse(file2),null,1));}
  await p2.click('[data-rsmode="trainee"]');await sleep(200);
  const back=await X(p2,()=>({n:window.__rsTrainee.cur().entries.length,dec:window.__rsTrainee.formHours('2026-12').ind,sig:!!window.__rsTrainee.cur().months['2027-02'].sig.sup_img,fin:!!window.__rsTrainee.cur().final.sig.sup_img}));
  await openFile(p2,file2);await sleep(900);const file3=await grab(p2);
  ok('8 Open data gives the trainee back the same (signatures, the hours for the form, the final verification): the trainees in the file saved again are the same, and a third save is the same file',
    JSON.stringify(JSON.parse(file).trainees)===JSON.stringify(JSON.parse(file2).trainees)&&strip(file2)===strip(file3)&&back.dec===95*60&&back.sig&&back.fin,back);
  /* Clear all clears both */
  await X(p2,()=>document.querySelector('#clearBtn').click());await sleep(400);
  const clr=await X(p2,()=>({tr:window.__rsTrainee.trHas(),rbt:S.setup.rbt_name||'',conf:window.__conf.slice(-1)[0]}));
  ok('8 Clear all with trainee records says they are cleared too, and clears them',!clr.tr&&/every BCBA trainee record/.test(clr.conf),clr);
  await p2.close();
  /* a file from before (no trainees) opens and saves unchanged */
  const p3=await open(ctx,'old');await X(p3,()=>document.querySelector('#simBtn').click());await sleep(900);const old=await grab(p3);
  await openFile(p3,old);await sleep(900);const old2=await grab(p3);await openFile(p3,old2);await sleep(900);const old3=await grab(p3);
  ok('8 a file with no trainee is written as before (no trainee key) and opens and saves unchanged',!('trainees' in JSON.parse(old))&&!('trainees' in JSON.parse(old2))&&strip(old2)===strip(old3)&&!(await X(p3,()=>window.__rsTrainee.trHas())),Object.keys(JSON.parse(old2)));
  /* ================= 7. the simulation ================= */
  const rb0=await X(p3,()=>({n:R.length,name:S.setup.rbt_name,months:Object.keys(S.months).length}));
  await p3.click('[data-rsmode="trainee"]');await sleep(200);await X(p3,()=>document.querySelector('#simBtn').click());await sleep(900);
  const sim=await X(p3,()=>{const X=window.__rsTrainee,t=X.cur(),u=[...new Set(t.entries.map(e=>e.date.slice(0,7)))].sort();
    return {name:t.setup.name,sup:t.sups.map(s=>s.name),u,rules:u.map(k=>X.tStats(k).rs.id),st:u.map(k=>X.tStats(k).status),signed:u.map(k=>X.sigState(k).both),clients:[...new Set(t.entries.map(e=>e.client).filter(Boolean))],conf:window.__conf.slice(-1)[0]};});
  const rb1=await X(p3,()=>({n:R.length,name:S.setup.rbt_name,months:Object.keys(S.months).length}));
  ok('7 the trainee simulation: Trainee T. (simulated), a simulated BCBA, coded clients, the months up to today under both rules (October 2026 to March 2027), the second month short on purpose, the ended months met and signed',
    sim.name==='Trainee T. (simulated)'&&sim.sup.join()==='Jordan Ellis (simulated)'&&sim.clients.every(c=>/^SIM-\d{4}$/.test(c))&&sim.u[0]==='2026-10'&&sim.u[sim.u.length-1]==='2027-03'&&sim.rules.includes('2022')&&sim.rules.includes('2027')&&
    sim.st[1]==='fail'&&sim.st.slice(2,-1).every(s=>s==='ok')&&sim.signed[0]&&!sim.signed[1]&&sim.signed.slice(2,-1).every(Boolean),sim);
  ok('7 the trainee simulation leaves the RBT records as they were and says so',JSON.stringify(rb0)===JSON.stringify(rb1)&&/the RBT records are not changed/.test(sim.conf),[rb0,rb1,sim.conf]);
  await p3.click('[data-rsmode="rbt"]');await sleep(200);await X(p3,()=>document.querySelector('#simBtn').click());await sleep(900);
  const rsim=await X(p3,()=>({tr:window.__rsTrainee.cur().setup.name,conf:window.__conf.slice(-1)[0],note:document.querySelector('#rsModeNote').textContent,rbt:S.setup.rbt_name}));
  ok('7 the RBT simulation keeps the trainee records and says so; beside the choice, the file says it holds a trainee record',rsim.tr==='Trainee T. (simulated)'&&/The BCBA trainee records are kept/.test(rsim.conf)&&/also holds 1 BCBA trainee record/.test(rsim.note)&&/simulated/.test(rsim.rbt),rsim);
  /* ================= 1 (cont.) and 9: the RBT mode as before ================= */
  await p3.emulateMedia({media:'print'});
  const rp=await X(p3,()=>({tr:[...document.querySelectorAll('.tr-sec')].some(s=>getComputedStyle(s).display!=='none'),rbt:getComputedStyle(document.querySelector('#monthOut')).display!=='none',nodes:window.nbhPrintNodes().map(n=>n.id).join()}));
  await p3.emulateMedia({media:'screen'});
  ok('1 back in RBT mode the RBT pages print as before, with no trainee page, and the packet takes the RBT month and year',!rp.tr&&rp.rbt&&rp.nodes==='monthOut,yearOut',rp);
  ok('1 back in RBT mode, the RBT log shows as it did (its Setup, the supervisee bar, the RBT record page)',await X(p3,()=>!!document.querySelector('#rsWho').offsetParent&&!document.querySelector('#viewSeg button[data-view="rbt"]').hidden&&!document.querySelector('#trSetup').offsetParent));
  await p3.close();await page.close();await ctx.close();
  /* ================= 10. the iPad and the phone ================= */
  const sizes=[['iPad sideways',1376,1032,true],['iPad upright',1032,1376,true],['phone',390,844,true]];
  for(const [nm,w,h,touch] of sizes){const c=await br.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:true,deviceScaleFactor:2,userAgent:w<800?undefined:IPAD});const p=await open(c,nm);
    await p.tap('[data-rsmode="trainee"]');await sleep(200);await X(p,()=>document.querySelector('#simBtn').click());await sleep(900);
    const r={};for(const v of ['setup','month','year','print','guide']){await X(p,v=>setView(v),v);await sleep(250);
      if(v==='month')await X(p,()=>{const d=document.querySelector('details.tr-ent');if(d)d.open=true;});
      r[v]=await X(p,()=>{const de=document.documentElement,z=parseFloat(document.querySelector('main.sheet').style.zoom||'1')||1;const small=[...document.querySelectorAll('.tr-sec button,.tr-sec select,.tr-sec input:not([type=checkbox]):not([type=radio]),#trWho button,#trWho select,.rs-mode-b,.tr-sec summary')].filter(e=>e.offsetParent&&!e.closest('.rs-paper')).filter(e=>e.getBoundingClientRect().height/z<43.5).map(e=>(e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().height/z)+' (zoom '+z+')');
        const unl=[...document.querySelectorAll('.tr-sec input,.tr-sec select,.tr-sec textarea,#trWho select')].filter(e=>e.offsetParent).filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')).map(e=>e.id||e.name);
        return {over:de.scrollWidth-de.clientWidth,small:small.slice(0,6),unl:unl.slice(0,6)};});}
    await p.screenshot({path:OUT+nm.replace(/\W+/g,'-')+'-guide.png'});
    ok('10 '+nm+': no trainee page pushes the page sideways',Object.values(r).every(x=>x.over<=1),Object.fromEntries(Object.entries(r).map(([k,x])=>[k,x.over])));
    ok('10 '+nm+': the trainee buttons, fields and entry headers are 44 px or taller, and every field has a label',Object.values(r).every(x=>!x.small.length&&!x.unl.length),r);
    await c.close();}
  ok('no page error',errs.length===0,errs);
  }catch(e){console.log('FAIL the test stopped: '+(e&&e.stack||e));fails++;}
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
