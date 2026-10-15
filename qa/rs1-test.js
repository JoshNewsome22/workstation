/* Form RS-1 (RBT Supervision Log), standalone page. Simulated people and codes only ("Jordan Lee (simulated)",
   "Simulated BCBA", RBT-00-000000, SIM-0002). Checks:
   1. the form opens with no page errors; the simulation loads (the first month red on purpose, a later one compliant);
   2. Setup (the RBT, a supervisor with everything the handbook asks, the school year 2026-27, Mon-Fri 8:00 to 2:00) fills
      September 2026 with its weekdays; times entered compute the hours;
   3. 60 RBT hours with two contacts of 90 minutes = 5%: every check met; only group contacts fail "individual"; no
      observation fails "observation"; a supervisor without BCBA/BCaBA, a phone contact and a group of 11 fail and are
      not counted; a BCaBA as Requirements Coordinator is flagged; a month marked "No services" is not applicable;
   4. the observation checklist scores Yes / (Yes + No); the PDU log totals the kinds that count, inside the cycle;
   5. Save data -> Clear all -> Open data gives back the same state; a file from another form is refused;
   6. the CSV holds the days and the contacts; the monthly record prints (emulated print, PDF) on a reasonable number of
      pages with its totals, no text under 7.5 pt, with the drawn signature, and without the confidential concerns;
   7. phone width: no sideways scroll.
   usage: WS_URL=http://127.0.0.1:8123 node qa/rs1-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
const OUT=__dirname+'/out/rs1/';fs.mkdirSync(OUT,{recursive:true});
const URL=L.BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const K='2026-09';
(async()=>{const br=await L.chromium.launch();const log=[];
  try{
  const page=await br.newPage({viewport:{width:1180,height:820}});L.wire(page,log);
  await page.goto(URL);await sleep(900);
  ok('1 the form opens with no page errors',!log.some(x=>x.type==='pageerror'),log);
  ok('1 it opens on the Month view, with Setup offered first',await page.evaluate(()=>/view-month/.test(document.body.className)&&!!document.querySelector('#setupNudge [data-go="setup"]')));
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  /* the simulation */
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
  const sim=await page.evaluate(()=>{const y=setupYear(),ks=yearKeys(y),t=keyOf(todayISO());return {name:S.setup.rbt_name,st:ks.filter(k=>k<=t).map(k=>[k,stats(k).status])};});
  ok('1 the simulation loads simulated people only',/simulated/i.test(sim.name)&&await page.evaluate(()=>S.sups.every(s=>/^Simulated /.test(s.name))),sim);
  ok('1 the simulation: the first month is red on purpose, a full month after it is compliant',sim.st.length<2||(sim.st[0][1]==='fail'&&(sim.st.length<3||sim.st[1][1]==='ok')),sim.st);
  ok('1 no page errors after the simulation',!log.some(x=>x.type==='pageerror'),log);
  /* the smallest printed text in the simulated month's record and year summary (7.5 pt = 10 px) */
  const minFont=sel=>page.evaluate(sel=>{let min=99,at='';document.querySelectorAll(sel+' *').forEach(e=>{if(e.closest('svg'))return;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=parseFloat(getComputedStyle(e).fontSize);if(f<min){min=f;at=e.tagName+':'+e.textContent.slice(0,30);}});return {min,at};},sel);
  await page.evaluate(()=>{curKey=yearKeys(setupYear())[1];renderPrint();});await page.emulateMedia({media:'print'});
  const sm1=await minFont('#monthOut'),sm2=await minFont('#yearOut');await page.emulateMedia({media:'screen'});
  ok('1 the simulated record and year summary print no text under 7.5 pt',sm1.min>=9.99&&sm2.min>=9.99,[sm1,sm2]);

  /* ---- 2. setup by hand ---- */
  await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(400);
  ok('2 Clear all empties the form and opens Setup',await page.evaluate(()=>!S.setup.rbt_name&&Object.values(S.months).every(m=>!m.days.length&&!m.contacts.length)&&/view-setup/.test(document.body.className)));
  await page.fill('#sName','Jordan Lee (simulated)');await page.fill('#sCert','RBT-00-000000');await page.fill('#sClients','SIM-0002, SIM-0005');
  await page.fill('#sExp','2026-12-01');await page.selectOption('#sPath','recert');
  const sid=await page.evaluate(()=>S.sups[0].id),F=f=>'#sup_'+sid+'_'+f;
  await page.fill(F('name'),'Simulated BCBA');await page.selectOption(F('cred'),'BCBA');await page.fill(F('cert'),'1-00-00000');
  await page.selectOption(F('role'),'RBT Supervisor');await page.selectOption(F('trained'),'yes');await page.fill(F('trained_date'),'2025-08-01');
  await page.selectOption(F('portal'),'yes');await page.selectOption(F('oversight'),'employed');await page.check(F('norel'));
  ok('2 the supervisor card says everything the handbook asks is recorded',/Everything the handbook asks/.test(await page.textContent(F('issues'))),await page.textContent(F('issues')));
  await page.selectOption('#sYear','2026');await page.fill('#sStart','08:00');await page.fill('#sEnd','14:00');await page.fill('#sBreak','0');
  ok('2 the setup is in the state',await page.evaluate(()=>S.setup.year==='2026'&&S.setup.day_start==='08:00'&&S.setup.day_end==='14:00'&&S.setup.days.join()==='1,2,3,4,5'&&S.sups[0].cred==='BCBA'));
  await page.click('#viewSeg button[data-view="month"]');await sleep(200);
  await page.click('#monthBar button[data-month="'+K+'"]');await sleep(300);
  const rows=await page.$$eval('#dayTbl tbody tr[data-did] input[data-f="date"]',e=>e.map(x=>x.value));
  const wk=[];for(let d=1;d<=30;d++){const x=new Date(2026,8,d);if(x.getDay()>=1&&x.getDay()<=5)wk.push('2026-09-'+String(d).padStart(2,'0'));}
  ok('2 September 2026 is filled with its '+wk.length+' weekdays',rows.join()===wk.join(),{rows});
  const first=await page.evaluate(()=>month('2026-09').days[0].id);
  await page.fill('#d_'+first+'_end','12:00');await page.fill('#d_'+first+'_brk','30');await sleep(100);
  ok('2 8:00 to 12:00 less 30 minutes computes 3.50 hours',(await page.textContent('#h_'+first)).trim()==='3.50',await page.textContent('#h_'+first));
  await page.fill('#d_'+first+'_end','14:00');await page.fill('#d_'+first+'_brk','0');await sleep(100);
  ok('2 back to 6.00 hours',(await page.textContent('#h_'+first)).trim()==='6.00');
  /* ten days of 6 hours: the rest marked No service */
  const ids=await page.evaluate(()=>month('2026-09').days.map(d=>d.id));
  for(const id of ids.slice(10))await page.check('#d_'+id+'_none');
  await sleep(150);
  ok('2 ten days of service, 60.00 RBT hours',(await page.textContent('#tRbt')).trim()==='60.00'&&(await page.textContent('#tDays')).trim()==='10',[await page.textContent('#tRbt'),await page.textContent('#tDays')]);
  ok('2 no contacts yet: 180 more minutes needed',/180 more minutes/.test(await page.textContent('#needLine')),await page.textContent('#needLine'));

  /* ---- 3. contacts and the compliance panel ---- */
  const addC=async o=>{const before=await page.evaluate(()=>month(curKey).contacts.map(c=>c.id));await page.click('#addContact');await sleep(150);
    const id=await page.evaluate(b=>month(curKey).contacts.map(c=>c.id).find(x=>!b.includes(x)),before);const G=f=>'#c_'+id+'_'+f;
    await page.fill(G('date'),o.date);await page.fill(G('start'),o.start);await page.fill(G('end'),o.end);
    await page.selectOption(G('sup'),sid);await page.selectOption(G('format'),o.format);if(o.group)await page.fill(G('group'),o.group);
    await page.selectOption(G('mode'),o.mode);await page.selectOption(G('obs'),o.obs);await sleep(100);return id;};
  const c1=await addC({date:'2026-09-08',start:'09:00',end:'10:30',format:'indiv',mode:'person',obs:'yes'});
  await page.check('#c_'+c1+'_s1');await page.check('#c_'+c1+'_a3');await page.check('#c_'+c1+'_b3');await page.fill('#c_'+c1+'_feedback','Simulated feedback: praise was specific; fade the gestural prompt next.');
  const c2=await addC({date:'2026-09-22',start:'14:30',end:'16:00',format:'group',group:'3',mode:'video',obs:'no'});
  const chk=()=>page.$$eval('#compBox li[data-check]',l=>Object.fromEntries(l.map(x=>[x.dataset.check,x.dataset.s])));
  const box=()=>page.$eval('#compBox',e=>e.dataset.status);
  let c=await chk();
  ok('3 two contacts of 90 minutes against 60 hours = 5.0%: met',c.pct==='ok'&&(await page.textContent('#tPct')).trim()==='5.0%'&&(await page.textContent('#tSup')).trim()==='3.00',[c,await page.textContent('#tPct')]);
  ok('3 contacts, individual, observation, credentials, mode, group size, supervisor records: all met',['contacts','indiv','obs','cred','mode','group','req'].every(k=>c[k]==='ok'),c);
  ok('3 the month is compliant (green) and says so',await box()==='ok'&&/Compliant/.test(await page.textContent('#compVerdict')),[await box(),await page.textContent('#compVerdict')]);
  ok('3 the month bar shows September met',/met/.test(await page.textContent('#monthBar button[data-month="2026-09"] small')));
  await page.selectOption('#c_'+c1+'_format','group');await page.fill('#c_'+c1+'_group','2');await sleep(100);c=await chk();
  ok('3 only group contacts: "individual" fails after the month ended',c.indiv==='fail'&&c.pct==='ok'&&await box()==='fail',c);
  await page.selectOption('#c_'+c1+'_format','indiv');await page.selectOption('#c_'+c1+'_obs','no');await sleep(100);c=await chk();
  ok('3 no observation with a client: "observation" fails',c.obs==='fail'&&c.indiv==='ok'&&await box()==='fail',c);
  await page.selectOption('#c_'+c1+'_obs','yes');await sleep(100);
  await page.click('#viewSeg button[data-view="setup"]');await page.selectOption(F('cred'),'Other or none');await sleep(100);
  ok('3 a supervisor without BCBA/BCaBA is flagged on Setup',/may not supervise/.test(await page.textContent(F('issues'))));
  await page.click('#viewSeg button[data-view="month"]');await sleep(150);c=await chk();
  ok('3 ... and the month: the credential check fails, nothing is counted (0.0%)',c.cred==='fail'&&c.pct==='fail'&&(await page.textContent('#tContacts')).trim()==='0',[c,await page.textContent('#tContacts')]);
  await page.click('#viewSeg button[data-view="setup"]');await page.selectOption(F('cred'),'BCaBA');await page.selectOption(F('role'),'RBT Requirements Coordinator');await sleep(100);
  ok('3 a BCaBA as Requirements Coordinator is flagged (must be a BCBA); a BCaBA may supervise',/must be a BCBA/.test(await page.textContent(F('issues'))));
  await page.selectOption(F('role'),'RBT Supervisor');await sleep(100);
  await page.click('#viewSeg button[data-view="month"]');await sleep(150);c=await chk();
  ok('3 a BCaBA supervisor counts',c.cred==='ok'&&c.pct==='ok',c);
  await page.click('#viewSeg button[data-view="setup"]');await page.selectOption(F('cred'),'BCBA');await page.click('#viewSeg button[data-view="month"]');await sleep(150);
  await page.selectOption('#c_'+c2+'_mode','phone');await sleep(100);c=await chk();
  ok('3 a contact by phone: flagged and not counted',c.mode==='fail'&&c.contacts==='fail'&&c.pct==='fail',c);
  await page.selectOption('#c_'+c2+'_mode','video');await page.fill('#c_'+c2+'_group','11');await sleep(100);c=await chk();
  ok('3 a group of 11 RBTs: flagged and not counted',c.group==='fail'&&c.contacts==='fail',c);
  await page.fill('#c_'+c2+'_group','3');await sleep(100);c=await chk();
  ok('3 back to compliant',await box()==='ok',c);
  /* a month marked No services */
  await page.click('#monthBar button[data-month="2026-08"]');await sleep(200);await page.check('#noSvc');await sleep(200);
  ok('3 ... and counts none of its rows',(await page.textContent('#tRbt')).trim()==='0.00'&&await page.evaluate(()=>stats('2026-08').rbtMin===0));
  ok('3 a month marked "No services" is not applicable, not failed',await box()==='na'&&/n\/a/.test(await page.textContent('#monthBar button[data-month="2026-08"] small'))&&/Not applicable/.test(await page.textContent('#compVerdict')));
  await page.click('#monthBar button[data-month="'+K+'"]');await sleep(200);

  /* ---- 4. checklist and PDUs ---- */
  for(let j=0;j<8;j++)await page.check('#ck_'+c1+'_'+j+'_y');await page.check('#ck_'+c1+'_8_n');await page.check('#ck_'+c1+'_9_na');await sleep(100);
  ok('4 checklist: 8 Yes, 1 No, 1 N/A = 89%',/^89% \(8 of 9 scored, 1 N\/A\)/.test(await page.textContent('#c_'+c1+'_score')),await page.textContent('#c_'+c1+'_score'));
  ok('4 the score is on the contact and in the month',/89%/.test(await page.textContent('details.rs-contact[data-cid="'+c1+'"] summary'))&&/89%/.test(await page.textContent('#compBox')));
  await page.click('#viewSeg button[data-view="rbt"]');await sleep(150);
  await page.fill('#cCycle','2026-01-01');await page.fill('#cCycleEnd','2027-12-31');
  const addP=async(t,ty,u,d)=>{await page.click('#addPdu');await sleep(80);const id=await page.evaluate(()=>S.pdus[S.pdus.length-1].id);await page.fill('#p_'+id+'_title',t);await page.selectOption('#p_'+id+'_type',ty);await page.fill('#p_'+id+'_units',u);if(d)await page.fill('#p_'+id+'_date',d);await sleep(60);return id;};
  await addP('Ethics in school settings (simulated)','ace','2','2026-03-01');const pe=await page.evaluate(()=>S.pdus[0].id);await page.check('#p_'+pe+'_ethics');
  await addP('In-service: prompting (simulated)','inservice','3','2026-05-01');
  const bad=await addP('Monthly supervision meeting (simulated)','nocount','1.5','2026-06-01');
  await addP('Old course (simulated)','univ','4','2025-06-01');
  await sleep(100);
  ok('4 PDUs: only the kinds that count, inside the cycle: 5 of 12, 2 in ethics',/^5 of 12/.test((await page.textContent('#pduMetric .val')).trim())&&/2 in ethics/.test(await page.textContent('#pduMetric')),await page.textContent('#pduMetric'));
  ok('4 a PDU entered as supervision is warned about',/Does not count/.test(await page.textContent('#p_'+bad+'_warn')));
  ok('4 the credential shows the days until expiration',/days? left|day left|expired/.test(await page.textContent('#credVerdict')));
  await page.click('#addConcern');await sleep(100);const cn=await page.evaluate(()=>S.concerns[0].id);await page.fill('#cn_'+cn+'_concern','Simulated concern: data entered late on two days.');
  ok('4 a concern is recorded',await page.evaluate(()=>S.concerns.length===1&&/Simulated concern/.test(S.concerns[0].concern)));

  /* ---- 5. save, clear, open ---- */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
  /* the same state: every value compared, keys in any order, an empty value the same as an absent one */
  const canon=()=>page.evaluate(()=>{const c=v=>Array.isArray(v)?v.map(c):v&&typeof v==='object'?Object.keys(v).sort().reduce((o,k)=>{const x=c(v[k]);if(x===''||x===false||x==null||(typeof x==='object'&&!Array.isArray(x)&&!Object.keys(x).length))return o;o[k]=x;return o;},{}):v;
    const s=c(JSON.parse(JSON.stringify(S)));Object.keys(s.months||{}).forEach(k=>{const m=s.months[k];if(!m.days.length&&!m.contacts.length&&!m.note&&!m.noservice)delete s.months[k];});return JSON.stringify(s);});
  const saved=await page.evaluate(()=>window.__saved),before=await canon();
  ok('5 Save data writes {form:"RS-1", rev:"2026-10"}',(()=>{try{const d=JSON.parse(saved);return d.form==='RS-1'&&d.rev==='2026-10'&&d.S;}catch(e){return false;}})());
  await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);
  ok('5 cleared',await page.evaluate(()=>!S.setup.rbt_name&&!S.pdus.length&&!S.concerns.length&&Object.values(S.months).every(m=>!m.days.length&&!m.contacts.length)));
  const openF=t=>page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},t);
  await openF(saved);await sleep(400);
  const after=await canon();
  ok('5 Open data gives back the same state',before===after,before===after?'':{b:before.slice(0,300),a:after.slice(0,300)});
  await openF('{"form":"CN-1","S":{}}');await sleep(200);
  ok('5 a file saved by another form is refused, nothing changed',await canon()===after);
  await page.click('#viewSeg button[data-view="month"]');await page.click('#monthBar button[data-month="'+K+'"]');await sleep(200);
  ok('5 after the round trip September is still compliant',await box()==='ok');

  /* ---- 6. CSV and print ---- */
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(300);
  const csv=await page.evaluate(()=>window.__saved)||'';const lines=csv.split('\n');
  ok('6 the CSV holds every September day row and both contacts',lines.filter(l=>/^"Service day","September 2026"/.test(l)).length===wk.length&&lines.filter(l=>/^"Supervision contact","September 2026"/.test(l)).length===2&&/"Record","Month","Date"/.test(lines[0]),lines.slice(0,3));
  ok('6 the CSV has the computed hours and minutes',lines.some(l=>/"2026-09-01","08:00","14:00","0","6.00"/.test(l))&&lines.some(l=>/"Supervision contact".*"90"/.test(l)));
  await page.click('#viewSeg button[data-view="print"]');await sleep(200);
  await page.fill('#sgSup','Simulated BCBA, BCBA');await page.fill('#sgSupDate','2026-09-30');await page.fill('#sgRbt','Jordan Lee (simulated), RBT');
  const cv=await page.$('canvas[data-pad="sup_img"]');await cv.scrollIntoViewIfNeeded();await sleep(150);const bb=await cv.boundingBox();await page.mouse.move(bb.x+30,bb.y+bb.height*0.6);await page.mouse.down();
  for(let i=1;i<=12;i++)await page.mouse.move(bb.x+30+i*18,bb.y+bb.height*(0.6+0.2*Math.sin(i)));await page.mouse.up();await sleep(150);
  ok('6 the drawn signature is kept with the month and shown on the record',await page.evaluate(()=>/^data:image\/png/.test(month('2026-09').sig.sup_img||''))&&!!(await page.$('#monthOut .p-sig img')));
  const mo=await page.textContent('#monthOut');
  ok('6 the record carries the BACB documentation: days and times, contacts, format, observations, supervisors, oversight',['Service days','8:00 am','Supervision contacts','Individual; In person','Direct observations with a client: 9/8/2026','Simulated BCBA','Supervisor–client oversight','Percent supervised','5.0%','60.00','7 years'].every(t=>mo.includes(t)),mo.slice(0,400));
  ok('6 the confidential concerns are not on the monthly record',!/Simulated concern/.test(mo)&&!/Simulated concern/.test(await page.textContent('#yearOut')));
  await page.evaluate(()=>{renderPrint();document.body.classList.add('rs-print-month');const st=document.createElement('style');st.id='rsPage';st.textContent='@media print{@page{size:letter portrait;margin:0.5in 0.5in 0.55in}}';document.head.appendChild(st);});
  await page.emulateMedia({media:'print'});await sleep(150);
  const vis=await page.evaluate(()=>{const v=e=>!!(e&&e.getClientRects().length&&getComputedStyle(e).display!=='none');return {m:v(document.querySelector('#monthOut')),y:v(document.querySelector('#yearOut')),c:v(document.querySelector('#concernOut')),setup:v(document.querySelector('section.only-setup')),tb:v(document.querySelector('.toolbar'))};});
  ok('6 printing the month shows the record alone',vis.m&&!vis.y&&!vis.c&&!vis.setup&&!vis.tb,vis);
  const small=await page.evaluate(()=>{let min=99,at='';document.querySelectorAll('#monthOut *').forEach(e=>{if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=parseFloat(getComputedStyle(e).fontSize);if(f<min){min=f;at=e.tagName+':'+e.textContent.slice(0,30);}});return {min,at};});
  ok('6 no text on the printed record under 7.5 pt (10 px)',small.min>=9.99,small);
  await page.pdf({path:OUT+'month.pdf',preferCSSPageSize:true,printBackground:true});
  await page.evaluate(()=>{document.body.classList.remove('rs-print-month');document.body.classList.add('rs-print-year');});
  await page.pdf({path:OUT+'year.pdf',preferCSSPageSize:true,printBackground:true});
  await page.evaluate(()=>{document.body.classList.remove('rs-print-year');document.body.classList.add('rs-print-concerns');});
  await page.pdf({path:OUT+'concerns.pdf',preferCSSPageSize:true,printBackground:true});
  await page.evaluate(()=>{document.body.classList.remove('rs-print-concerns');document.querySelector('#rsPage').remove();});await page.emulateMedia({media:'screen'});
  const info=JSON.parse(require('child_process').execFileSync('python3',['-c',`
import pymupdf,json
o={}
for f in ['month','year','concerns']:
  d=pymupdf.open('${OUT}'+f+'.pdf');o[f]=[d.page_count,''.join(p.get_text() for p in d)]
print(json.dumps(o))`]).toString());
  ok('6 the monthly record PDF: 1 to 3 letter pages, with the totals',info.month[0]>=1&&info.month[0]<=3&&/Percent supervised/.test(info.month[1])&&/60\.00/.test(info.month[1])&&/5\.0%/.test(info.month[1])&&/Verification/i.test(info.month[1]),[info.month[0],info.month[1].slice(0,200)]);
  ok('6 the year summary PDF: 1 or 2 pages, September compliant',info.year[0]>=1&&info.year[0]<=2&&/September 2026/.test(info.year[1])&&/Year Summary/.test(info.year[1]),[info.year[0]]);
  ok('6 the concerns print only from their own button',/Simulated concern/.test(info.concerns[1])&&!/Simulated concern/.test(info.month[1]+info.year[1]));
  /* the year view */
  await page.click('#viewSeg button[data-view="year"]');await sleep(200);
  ok('6 the year view: September compliant, August not applicable, a chart with the 5% line',/Yes/.test(await page.textContent('#yearTbl tr[data-open-month="2026-09"]'))&&/n\/a/.test(await page.textContent('#yearTbl tr[data-open-month="2026-08"]'))&&/5% minimum/.test(await page.textContent('#yearChart')));
  await page.screenshot({path:OUT+'year.png',fullPage:true});
  /* ---- 7. phone ---- */
  await page.setViewportSize({width:390,height:844});await sleep(300);
  const over=[];for(const v of ['setup','month','year','rbt','print','guide']){await page.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);await sleep(200);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]>sw[1]+1)over.push(v+' '+sw.join('/'));}
  ok('7 phone width: no sideways scroll on any view',!over.length,over);
  ok('7 no page errors or console errors in the whole run',!log.some(x=>x.type==='pageerror'||x.type==='error'),log);
  }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e).slice(0,500));}
  await br.close();
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
