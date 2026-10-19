/* Form RR-1, review Wave 3 part 1: 10 removal days in the regulation's terms, and a manifestation determination only from a recorded
   change-of-placement decision (F21); the headline removal days are the school year's (F22); the date the IEP was held is not the
   annual review date (F23); a partial day with no portion is named (F26); a weekday is a pattern only when chance is unlikely to give
   it (F27); a run of more than 10 consecutive school days across removals (F28); the assessments a review can propose (F29).
   Simulated data only. usage: node qa/rr1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('RR-1_'));
  /* school days built in the page: the first Monday on or after 1 October of a school year, and n school days on from it */
  const D=await p.evaluate(()=>{const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const now=new Date(),cy=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
    const mon=y=>{const d=new Date(y,9,1,12);while(d.getDay()!==1)d.setDate(d.getDate()+1);return d;};
    const add=(d0,n)=>{const d=new Date(d0);let k=0;while(k<n){d.setDate(d.getDate()+1);if(d.getDay()>0&&d.getDay()<6)k++;}return ymd(d);};
    const a=mon(cy),b=mon(cy-1);return {cy,syl:cy+'–'+String(cy+1).slice(2),a0:ymd(a),a2:add(a,2),a6:add(a,6),a7:add(a,7),a11:add(a,11),b0:ymd(b),b7:add(b,7),ym:ymd(a).slice(0,4)};});
  const led=o=>p.evaluate(o=>{const t=document.getElementById('rrLedgerStore');t.value=JSON.stringify(Object.assign({v:1,rows:[],ns:[],yr:{}},o));t.dispatchEvent(new Event('input',{bubbles:true}));},o);
  /* ---- F22 ---- */
  await led({rows:[{s:D.b0,e:D.b7,t:'oss',c:'yes'},{s:D.a0,e:D.a2,t:'oss',c:'yes'}]});await sleep(300);
  const h=await p.evaluate(()=>({h:document.getElementById('stDaysH').textContent,d:document.getElementById('stDays').textContent,sub:document.getElementById('stDaysSub').textContent,
    sy:document.getElementById('syI').textContent,syS:document.getElementById('syISub').textContent}));
  ok('1 F22 the headline is this school year\'s counted days, with the sum over the years beside it',h.h==='DAYS REMOVED, '+D.syl+' (LEDGER)'&&h.d==='3'&&h.sub==='11 counted over 2 school years'&&/ \/ 3$/.test(h.sy)&&h.syS==='incidents in period; days removed in '+D.syl+' (ledger)',{h,D});
  /* ---- F26 ---- */
  await led({rows:[{s:D.a0,t:'partial',c:'yes'}]});await sleep(300);
  const w=await p.evaluate(()=>document.querySelector('#rlRows .rl-row [data-o="warn"]').textContent);
  ok('2 F26 an office stay with no portion of the day entered is named as counting a whole school day',/^No portion of the day is entered, so this row counts as a whole school day\./.test(w),w);
  await led({rows:[{s:D.a0,t:'partial',c:'yes',p:'0.25'}]});await sleep(300);
  ok('3 F26 with the portion entered the warning goes',!/No portion of the day/.test(await p.evaluate(()=>document.querySelector('#rlRows .rl-row [data-o="warn"]').textContent)));
  /* ---- F28, F21 ---- */
  await led({rows:[{s:D.a0,e:D.a6,t:'oss',c:'yes'},{s:D.a7,e:D.a11,t:'oss',c:'yes'}]});await sleep(300);
  const r=await p.evaluate(()=>({flags:document.getElementById('rlFlags').textContent,cd:!!document.querySelector('#rlDecide [data-k="cd"]'),out:window.__nbhFactsOut().records.removals}));
  ok('4 F28 two removals running 12 consecutive school days are flagged under 300.536(a)(1), and the decision fields open',
    /A run of more than 10 consecutive school days across removals.*Removals 1 and 2 run 12 consecutive school days.*300\.536\(a\)/.test(r.flags)&&r.cd&&r.out.flags.includes('a1r'),r);
  await led({rows:[{s:D.a0,e:D.a6,t:'oss',c:'yes'},{s:D.a7,e:D.a11,t:'oss',c:'yes'}],yr:{[D.cy]:{cd:D.a11}}});await sleep(300);
  const dc=await p.evaluate(()=>window.__nbhFactsOut().records.removals.decision);
  ok('5 F21 a recorded decision to change placement goes to the case with the manifestation determination\'s due date (10 school days on)',dc&&dc.change===D.a11&&/^\d{4}-\d\d-\d\d$/.test(dc.mdDue)&&dc.mdDue>D.a11&&!dc.md,dc);
  /* ---- F21 the workstation's Today list ---- */
  const sh=await open('index.html');
  const tl=await sh.evaluate(([D,dc])=>{const t=f=>tdTimelines(f).map(x=>x.t).join(' || ');
    return {ten:t({records:{removals:{days:10,at10:true,list:[{date:D.a0,days:10}],flags:['b2']}}}),nine:t({records:{removals:{days:9,list:[{date:D.a0,days:9}]}}}),
      dec:t({records:{removals:{days:12,at10:true,list:[],flags:['b2','a1r'],decision:dc}}}),run:t({records:{removals:{days:12,at10:true,list:[],flags:['b2','a1r']}}})};},[D,dc]);
  ok('6 F21 at ten days the workstation names services during further removals and the team\'s pattern decision, not a required manifestation determination',
    /<b>10 days of removal this year<\/b>: services continue during any further removal \(34 CFR 300\.530\(b\)\(2\), \(d\)\(4\)\); a series of more than 10 days is a change of placement only if the team finds a pattern \(34 CFR 300\.536\)\. Record the team’s decision on Form RR-1/.test(tl.ten)
    &&!/manifestation determination/.test(tl.ten)&&/^9 days of removal this year: at ten, services continue/.test(tl.nine),tl);
  ok('7 F21, F28 a run across removals asks for the team\'s decision; a recorded change of placement gives the manifestation determination\'s due date',
    /Back-to-back removals run more than 10 consecutive school days/.test(tl.run)&&/<b>A change of placement was decided on [\d/]+<\/b>: the manifestation determination is due within 10 school days, by [\d/]+ .*\(34 CFR 300\.530\(e\)\(1\)\)/.test(tl.dec)&&!/Back-to-back/.test(tl.dec),tl);
  /* ---- F23 ---- */
  const iep=await p.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('i.annual','');s('i.iepdate','2026-09-02');return window.__nbhFactsOut().records;});
  ok('8 F23 with no annual review date, the date the IEP was held goes as iepHeld and not as the review date',iep.iepHeld==='2026-09-02'&&!('iep' in iep),iep);
  const dm=await open(file('DM-1_'));
  const dmd=await dm.evaluate(()=>{const e=document.querySelector('[name="p.iepdate"]');e.value='2026-09-02';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
    const o=window.__nbhFactsOut();return o&&o.profile&&o.profile.dates;});
  ok('9 F23 Form DM-1 likewise sends the date the IEP was held apart from the review date',dmd&&dmd.iepHeld==='2026-09-02'&&!dmd.iep,dmd);
  const fsp=await open(file('FS-1_'));
  const bg=await fsp.evaluate(()=>{S.meta.bgRecords='';renderAll();window.__nbhFactsIn({records:{iepHeld:'2026-09-02',iep:'2027-09-01'}});return S.meta.bgRecords||document.querySelector('[data-m="bgRecords"]').value;});
  ok('10 F23 Form FS-1 names the IEP held and the review due apart',/IEP held 9\/2\/2026; annual IEP review due 9\/1\/2027\./.test(bg),bg);
  /* ---- F27 ---- */
  await p.evaluate(()=>{document.getElementById('simScenario').value='setting';document.getElementById('simBtn').click();});await sleep(900);
  const dw=await p.evaluate(()=>[...document.querySelectorAll('.verdict li')].map(x=>x.textContent).find(t=>/incidents fall on/.test(t))||'');
  ok('11 F27 five of eight incidents on one weekday is common by chance: given as a count, not a pattern',/^5 of 8 weekday incidents fall on Mon\. With 8 incidents, a day this busy is common by chance \(p = 0\.052\), so it is not a pattern yet/.test(dw),dw);
  const dw2=await p.evaluate(D=>{const n=+document.getElementById('nInc').value;const d0=new Date(D.a0+'T12:00:00');
    for(let i=0;i<n;i++){const e=document.querySelector('[name="ic['+i+'].d"]');if(!e)break;const d=new Date(d0);d.setDate(d.getDate()+7*(i<8?i:i-8)+(i<8?0:1));
      e.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');e.dispatchEvent(new Event('input',{bubbles:true}));}
    return [...document.querySelectorAll('.verdict li')].map(x=>x.textContent).find(t=>/incidents fall on/.test(t))||'';},D).catch(e=>'ERR '+e.message);
  ok('12 F27 when chance is unlikely to give a day that busy, it is called a pattern with its probability',/^8 of \d+ weekday incidents fall on Mon \(unlikely by chance: p = [0-9.<\s]+\): a day-of-week pattern/.test(dw2),dw2);
  /* ---- F29 ---- */
  const g=await p.evaluate(()=>{const names=['in','si','ob','mt','da','im'].map(k=>!!document.querySelector('[name="y.'+k+'"]'));
    const set=(k,on)=>{const e=document.querySelector('[name="y.'+k+'"]');e.checked=on;e.dispatchEvent(new Event('change',{bubbles:true}));};
    ['ia','abc','sp','dd','ea','vi','pa','ra','ms','eval','in','si','ob','mt','da','im'].forEach(k=>set(k,false));set('in',true);set('ob',true);
    const s=document.querySelector('[name="y.suff"]');s.value='partial';s.dispatchEvent(new Event('change',{bubbles:true}));
    return {names,v:document.getElementById('synVerdict').textContent};});
  ok('13 F29 interviews and observations from the newer forms can be proposed, and they count as tests and as confirmation by observation',
    g.names.every(Boolean)&&!/No interview, observation, or analysis is proposed/.test(g.v)&&!/no observation \(ABC-1/.test(g.v)&&/2 additional assessment\(s\) proposed/.test(g.v),g);
  ok('14 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
