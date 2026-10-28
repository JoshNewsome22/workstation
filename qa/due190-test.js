/* v24.90 Dates that come due. Simulated students only.
   1. the FBA: 60 calendar days from signed consent to start, shown from consent on (not only in its last 15 days), its
      date first so What's due reads it; past the date it is Overdue;
   2. an extension on Form IC-1 with its reason moves the date and says what it was extended from and why; never Overdue
      against the first date; without a reason it does not count, and the item says so;
   3. the setting: another number of days, or school days (weekdays); the caseload's settings hold it;
   4. the FBA item goes once Form FS-1 has the function;
   5. removal days (Form RR-1): none at 6, to look at from 7, Needs you now (a red tag) from 10;
   6. What's due puts the FBA on its date, and the removal days under Needs you now;
   7. Add to Calendar: an .ics file, one all-day event a student and a date, the full name even with Initials only on,
      reminders a week and a day before, the same identity when made again, lines folded at 75 octets, CRLF;
   8. the button on the start screen saves Whats-due_<date>.ics;
   9. Form IC-1 sends the extension with consent (date and reason) and names a missing reason on its Consent sheet;
  10. Form TD-1 names its dates: BIP review (Final plan) and a date in Setup's Review line, once when they are the same;
  11. no page errors.  usage: node qa/due190-test.js */
const L=require(__dirname+'/lib.js');const {chromium,BASE,sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const md=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return (+m[2])+'/'+(+m[3]);};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900},acceptDownloads:true});const errs=[];
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+'/NBH-Workstation/'+f);await sleep(1500);return p;};
  const file=pre=>L.forms().find(x=>x.file.startsWith(pre)).file;
  const sh=await open('index.html');
  const T=(f,set)=>sh.evaluate(([f,set])=>{try{localStorage.removeItem('nbh.fba.days');localStorage.removeItem('nbh.fba.kind');if(set){localStorage.setItem('nbh.fba.days',set[0]);localStorage.setItem('nbh.fba.kind',set[1]);}}catch(e){}
    return tdTimelines(f).map(x=>x.k+'|'+x.t.replace(/<[^>]+>/g,'')+'|'+x.open);},[f,set]);
  const C=(d,ext)=>({consent:Object.assign({src:'IC-1',state:'Current',on:true,kind:'',obtained:d,date:d},ext?{fbaExt:ext}:{})});
  /* 1 */
  let t=await T(C(iso(-50)));
  ok('1 the FBA: due 60 calendar days from consent, its date first, ten days before it',t.length===1&&t[0]==='Timeline|FBA completion (Form FS-1 has no function yet): 60 days from consent on '+md(iso(-50))+', due '+md(iso(10))+' (in 10 days)|FS-1',t);
  t=await T(C(iso(-2)));ok('1 shown from consent on (58 days ahead)',t.length===1&&/^Timeline\|FBA completion .*, due [\d/]+ \(in 58 days\)\|/.test(t[0]),t);
  t=await T(C(iso(-63)));ok('1 past the date: Overdue',t.length===1&&/^Overdue\|FBA completion \(Form FS-1 has no function yet\): 60 days from consent on [\d/]+, due [\d/]+ \(3 days overdue\)/.test(t[0]),t);
  /* 2 */
  t=await T(C(iso(-63),{date:iso(20),why:'The parent agreed in writing to a later date (simulated)'}));
  ok('2 an extension with its reason: the new date, extended from the 60-day date, the reason, not Overdue',t.length===1&&t[0]==='Timeline|FBA completion (Form FS-1 has no function yet): extended from '+md(iso(-3))+' (The parent agreed in writing to a later date (simulated)), due '+md(iso(20))+' (in 20 days)|FS-1',t);
  t=await T(C(iso(-63),{date:iso(20),why:''}));
  ok('2 an extension without a reason does not count, and the item says so',t.length===1&&/^Overdue\|FBA completion .*: 60 days from consent on [\d/]+ \(Form IC-1 records an extension to [\d/]+ without a reason, so it does not count\), due [\d/]+ \(3 days overdue\)/.test(t[0]),t);
  t=await T(C(iso(-63),{date:iso(-10),why:'x'}));ok('2 an "extension" to a date before the 60-day date is not one',t.length===1&&/^Overdue\|FBA completion .*60 days from consent/.test(t[0]),t);
  /* 3 */
  t=await T(C(iso(-50)),['45','cal']);ok('3 the setting: 45 calendar days',t.length===1&&/^Overdue\|FBA completion .*: 45 days from consent on [\d/]+, due [\d/]+ \(5 days overdue\)/.test(t[0]),t);
  const sch=await sh.evaluate(c=>{localStorage.setItem('nbh.fba.days','10');localStorage.setItem('nbh.fba.kind','school');const due=tdAddSchool(c,10);const d=new Date(due+'T12:00:00');return {due,wd:d.getDay(),items:tdTimelines({consent:{state:'Current',on:true,obtained:c,date:c}}).map(x=>x.t)};},'2026-10-30');
  ok('3 school days: 10 weekdays from Friday 10/30/2026 is Friday 11/13/2026, and the item says school days',sch.due==='2026-11-13'&&/10 school days from consent on 10\/30/.test(sch.items[0]),sch);
  const ui=await sh.evaluate(async()=>{localStorage.removeItem('nbh.fba.days');localStorage.removeItem('nbh.fba.kind');await caseloadOpen();const n=document.getElementById('clFbaN'),k=document.getElementById('clFbaK');if(!n)return null;
    const r={v:n.value,k:k.value,lab:n.closest('p').textContent.replace(/\s+/g,' ')};n.value='75';n.dispatchEvent(new Event('change',{bubbles:true}));k.value='school';k.dispatchEvent(new Event('change',{bubbles:true}));
    r.saved=[localStorage.getItem('nbh.fba.days'),localStorage.getItem('nbh.fba.kind')];n.value='0';n.dispatchEvent(new Event('change',{bubbles:true}));r.bad=[n.value,localStorage.getItem('nbh.fba.days')];
    localStorage.removeItem('nbh.fba.days');localStorage.removeItem('nbh.fba.kind');return r;});
  ok('3 the caseload settings hold it: 60 calendar days to start; a change is kept; 0 goes back',ui&&ui.v==='60'&&ui.k==='cal'&&/The FBA is due calendar days.*after signed consent \(Form IC-1\)/.test(ui.lab)&&ui.saved[0]==='75'&&ui.saved[1]==='school'&&ui.bad[0]==='75'&&ui.bad[1]==='75',ui);
  /* 4 */
  t=await T(Object.assign(C(iso(-50)),{fn:{key:'escape',label:'Escape from demands'}}));ok('4 the function written on FS-1: no FBA item',!t.length,t);
  t=await T({consent:{state:'Current',on:true,kind:'reeval',obtained:iso(-50),date:iso(-50)}});ok('4 consent through the reevaluation keeps no FBA clock (as before)',!t.length,t);
  /* 5 */
  const R=n=>({records:{removals:{days:n,list:[],at10:n>=10,year:'2026-27'}}});
  const r6=await T(R(6)),r7=await T(R(7)),r10=await T(R(10));
  ok('5 removal days: none at 6; to look at from 7; at 10 a red tag (Needs you now)',!r6.length&&r7.length===1&&/^Timeline\|7 days of removal this year: at ten/.test(r7[0])&&r10.length===1&&/^Removals\|10 days of removal this year: services continue/.test(r10[0])&&await sh.evaluate(()=>TD_HOT.test('Removals')&&!TD_HOT.test('Timeline')),[r6,r7,r10]);
  /* 6 */
  const g=await sh.evaluate(([a,b])=>{const items=todayItems.call?null:null;state.facts=Object.assign({},a,b);const it=todayItems().map(x=>({k:x.k,t:clStrip(x.t),open:x.open}));
    const rec={key:'k1',client:'Jordan Example (simulated)',saved:new Date().toISOString(),sum:{items:it}};const G=dueGroups([rec]);
    return {up:G.up.map(x=>tdISO(x.d)+'|'+Object.values(x.ev).map(e=>e.what).join(';')+'|'+x.forms.join(',')),now:G.now.map(x=>x.k+'|'+x.t)};},[C(iso(-50)),R(10)]);
  ok('6 What\'s due: the FBA on its date (Coming up), the removal days under Needs you now',g.up.some(x=>x.startsWith(iso(10)+'|FBA completion (Form FS-1 has no function yet): 60 days from consent on ')&&/FS-1/.test(x))&&g.now.some(x=>/^Removals\|10 days of removal/.test(x)),g);
  /* 7 */
  const ics=await sh.evaluate(([a,b])=>{localStorage.setItem('nbh.caseload.ini','1');
    const L=[{key:'s|1|jordan',client:'SIMULATED – Jordan Example',saved:new Date().toISOString(),sum:{items:[{k:'Timeline',t:'FBA completion (Form FS-1 has no function yet): 60 days from consent on 9/1, due '+a+' (in 10 days)',open:'FS-1'},{k:'Due',t:'TD-1 BIP review '+a+' (in 10 days)',open:'TD-1'},{k:'Removals',t:'10 days of removal this year',open:'RR-1'}]}},
      {key:'s|2|riley',client:'Riley Sample (simulated)',saved:new Date().toISOString(),sum:{items:[{k:'Due',t:'GB-1 Progress report due '+b+' (in 3 days)',open:'GB-1'},{k:'Due',t:'DM-1 Old thing 1/2/2024 (700 days overdue)',open:'DM-1'}]}}];
    const x=dueIcs(L),y=dueIcs(L),onscreen=clName(L[0]);localStorage.removeItem('nbh.caseload.ini');const uid=s=>(s.match(/^UID:.*$/mg)||[]);
    return {n:x.n,text:x.text,same:JSON.stringify(uid(x.text))===JSON.stringify(uid(y.text)),onscreen};},[md(iso(10)),md(iso(3))]);
  const lines=ics.text.split('\r\n'),un=ics.text.replace(/\r\n /g,''),z=s=>s.replace(/-/g,'');
  const ev=un.split('BEGIN:VEVENT').slice(1);
  ok('7 the calendar file: two events (one a student and a date; the date over a year past left out), full names, reminders a week and a day before',
    ics.n===2&&ev.length===2&&/^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:/.test(ics.text)&&/END:VCALENDAR\r\n$/.test(ics.text)
    &&un.includes('DTSTART;VALUE=DATE:'+z(iso(10)))&&un.includes('DTEND;VALUE=DATE:'+z(iso(11)))&&un.includes('DTSTART;VALUE=DATE:'+z(iso(3)))
    &&/SUMMARY:Jordan Example: FBA completion\\; BIP review\r\nDESCRIPTION:FBA completion \(Form FS-1 has no function yet\): 60 days from consent on 9\/1 \(Form FS-1\)/.test(un)&&/SUMMARY:Riley Sample \(simulated\): Progress report/.test(un)
    &&ics.onscreen==='J. E.'&&(un.match(/TRIGGER:-P7D/g)||[]).length===2&&(un.match(/TRIGGER:-P1D/g)||[]).length===2&&!/Old thing|10 days of removal/.test(un),{un,ics});
  ok('7 the same identity when made again; every line 75 octets or fewer; CRLF line ends only',ics.same&&lines.every(l=>Buffer.byteLength(l)<=75)&&!/[^\r]\n/.test(ics.text),lines.filter(l=>Buffer.byteLength(l)>75));
  /* 8 */
  const kept=await sh.evaluate(async a=>{const rec={key:clScope()+'|5550111|jordan example (simulated)',scope:clScope(),client:'Jordan Example (simulated)',sid:'5550111',site:'',grade:'',bcba:'',saved:new Date().toISOString(),
    sum:{items:[{k:'Due',t:'TD-1 BIP review '+a+' (in 10 days)',open:'TD-1'}],lastData:'',forms:1},text:JSON.stringify({form:'CASE',rev:'2026-09',packet:{client:'Jordan Example (simulated)'},forms:{}})};
    await clTx('readwrite',st=>st.put(rec));await paintBlank();const b=document.getElementById('dueIcs');return b?b.closest('p').textContent.replace(/\s+/g,' '):null;},md(iso(10)));
  let dl=null;try{const w=sh.waitForEvent('download',{timeout:8000});await sh.evaluate(()=>{const d=document.getElementById('dlg');if(d&&d.open)d.close();document.getElementById('dueIcs').click();});dl=await w;}catch(e){}
  let body='';if(dl){const pth=await dl.path();body=require('fs').readFileSync(pth,'utf8');}
  ok('8 the start screen: Add to Calendar under What\'s due, saving Whats-due_<today>.ics with the date',/Add to Calendar 1 date, with each student’s full name and reminders a week and a day before/.test(kept||'')&&dl&&dl.suggestedFilename()==='Whats-due_'+iso(0)+'.ics'&&body.includes('SUMMARY:Jordan Example (simulated): BIP review'),{kept,name:dl&&dl.suggestedFilename(),body:body.slice(0,300)});
  /* 9 */
  const ic=await open(file('IC-1_'));await L.loadSim(ic);await sleep(1500);
  const icr=await ic.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    const o0=window.__nbhFactsOut().consent;s('r.fbaext','2026-12-18');const box1=document.getElementById('statusBox').textContent;
    s('r.fbaextwhy','The student was absent for two weeks (simulated)');const o=window.__nbhFactsOut().consent,box2=document.getElementById('statusBox').textContent;
    const row=document.querySelector('[name="r.fbaext"]').closest('.drow');
    return {on:o0.on,before:o0.fbaExt||null,ext:o.fbaExt,box1:/FBA completion is extended to .* with no reason/.test(box1),box2:/FBA completion is extended/.test(box2),lab:row.querySelector('.dlab').textContent,sheet:row.closest('.sheet').id};});
  ok('9 Form IC-1: the extension on the Consent record sheet goes with consent (date and reason); a missing reason is named',icr.on&&!icr.before&&icr.ext&&icr.ext.date==='2026-12-18'&&/absent for two weeks/.test(icr.ext.why)&&icr.box1&&!icr.box2&&icr.lab==='FBA completion extended to'&&icr.sheet==='record',icr);
  /* 10 */
  const td=await open(file('TD-1_'));
  const tdr=await td.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('ad.review','2026-12-04');s('m.review','Data read weekly by the BCBA; plan reviewed after 10 school days at or above criterion, or by 11/27/2026');const a=window.__nbhDue();
    s('m.review','or by 12/4/2026');const b=window.__nbhDue();s('ad.review','');s('m.review','weekly');const c=window.__nbhDue();
    return {a,b,c,flow:window.nbhCase&&window.nbhCase.due?window.nbhCase.due():null};});
  ok('10 Form TD-1: BIP review and the Setup review line\'s date; one when the same; none when neither',JSON.stringify(tdr.a)===JSON.stringify([{what:'BIP review',date:'2026-12-04'},{what:'Plan review (Setup)',date:'2026-11-27'}])&&JSON.stringify(tdr.b)===JSON.stringify([{what:'BIP review',date:'2026-12-04'}])&&tdr.c.length===0,tdr);
  ok('11 no page errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
