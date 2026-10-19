/* Form OB-1, review Wave 3 part 2: several target behaviors on one record (F74) and episode timing for a behavior whose TB-1
   dimension is duration (I38).
   F74: Setup's other target behaviors (up to three, each with its definition, added and removed), their rows on every sheet, the
   summary's table, sentences and the FS-1 statement, the CSV, a file saved and opened again, an older file opening as one behavior,
   a file holding nonsense, the Live Recorder's tiles and keys (5 to 7, Shift for the peer) and their save into the sheet, the case's
   targets in (every target but the replacements, up to three, once, and the case panel's ticked ones) and the evidence out (one
   statement per behavior), the print, a phone's width, and in the workstation TB-1's simulated targets arriving in OB-1.
   I38: the timed box on Setup, the total minutes and the longest episode on the sheet, the Student tile starting and ending an
   episode (Undo opens the last one again or takes away the one going on), an episode still going at End timed to the end and
   noted, the partial-interval sample marked through an episode, the summary's minutes and share of the time observed.
   The Live Recorder's clock is moved on by the test (performance.now), so the episodes last minutes in a few seconds.
   Simulated data only. usage: WS_URL=... WS_ROOT=... node qa/ob1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const OUT=__dirname+'/out/ob1-w3b/';fs.mkdirSync(OUT,{recursive:true});
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  /* the recorder's clock: performance.now() plus what the test adds */
  await ctx.addInitScript(()=>{const real=performance.now.bind(performance);let off=0;performance.now=()=>real()+off;window.__adv=ms=>{off+=ms;};window.print=()=>{};});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(f+' console: '+m.text().slice(0,200));});
    await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__q=[];if(window.nbhUI){nbhUI.confirm=async m=>{window.__q.push(String(m));return true;};nbhUI.toast=()=>{};}});return p;};
  const OB=file('OB-1_');
  const grab=async(p,sel)=>{const [d]=await Promise.all([p.waitForEvent('download',{timeout:10000}),p.evaluate(s=>document.querySelector(s).click(),sel)]);return {name:d.suggestedFilename(),path:await d.path()};};

  /* ---------------- 1-6 Setup and the sheets ---------------- */
  const p=await open(OB);
  const s1=await p.evaluate(()=>{const r={};r.blankWrap=document.getElementById('mbWrap').classList.contains('noprint');r.blankRows=document.querySelectorAll('#mbTbl tbody tr').length;
    r.dur1Print=document.getElementById('dur1Row').classList.contains('noprint');
    document.getElementById('addObs').click();document.querySelector('#viewSeg [data-view="setup"]').click();
    const add=document.getElementById('mbAdd');add.click();
    const set=(k,f,v)=>{const e=document.querySelector('#mbTbl [data-mbk="'+k+'"][data-mbf="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set(0,'label','Elopement (simulated) — leaving the assigned area');set(0,'def','More than 2 m from the assigned area without permission (simulated).');
    r.focus=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.mbf:'';
    add.click();set(1,'label','Crying (simulated)');set(1,'def','Tears or sobbing audible from 3 m (simulated).');
    const t=document.querySelector('#mbTbl [data-mbk="1"][data-mbf="dur"]');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));
    add.click();r.addHidden=add.hidden;r.rows=document.querySelectorAll('#mbTbl tbody tr').length;r.more=JSON.parse(JSON.stringify(state.meta.more));
    r.wrap=document.getElementById('mbWrap').classList.contains('noprint');
    const pg=document.querySelectorAll('.obs-page')[0];r.fields=[...pg.querySelectorAll('table.obs-count input[data-field]')].map(e=>e.dataset.field);
    r.labs=[...pg.querySelectorAll('table.obs-count td.lab')].map(td=>td.textContent);
    r.rep=(pg.querySelector('.rephd,.obs-rep')||{}).textContent||'';
    return r;});
  ok('1 F74 a blank record has no other behaviors, and the block does not print',s1.blankWrap&&s1.blankRows===0&&s1.dur1Print,s1);
  ok('2 F74 Add a target behavior adds a row (focus in its name); three at most, then the button goes; each row its name, definition and timed box',
    s1.rows===3&&s1.addHidden&&s1.more.length===3&&s1.more[0].label==='Elopement (simulated) — leaving the assigned area'&&/2 m/.test(s1.more[0].def)&&s1.more[1].dur==='1'&&s1.more[0].dur===''&&!s1.wrap&&s1.focus==='label',s1);
  ok('3 F74 I38 every sheet counts each behavior for the student and the peer; a timed one has its total minutes and longest episode',
    ['count','peerCount','mb:0:c','mb:0:p','mb:1:c','mb:1:p','mb:1:tot','mb:1:long','mb:2:c','mb:2:p'].every(f=>s1.fields.includes(f))&&!s1.fields.includes('durTot')
    &&s1.labs.includes('Elopement (simulated): occurrences')&&s1.labs.includes('Crying (simulated): episodes')&&s1.labs.includes('Total minutes of the episodes')&&s1.labs.includes('Longest episode (minutes)'),s1);
  const s2=await p.evaluate(async()=>{const r={};const pg=()=>document.querySelectorAll('.obs-page')[0];
    const set=(f,v)=>{const e=pg().querySelector('input[data-field="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('mb:0:c','4');set('mb:2:c','2');r.mb=JSON.parse(JSON.stringify(state.obs[0].mb));
    /* Remove asks, and takes that behavior's entries with it */
    window.__q=[];document.querySelector('#mbTbl button[data-mbdel="0"]').click();await new Promise(z=>setTimeout(z,100));
    r.q=window.__q.slice();r.more=state.meta.more.map(b=>b.label);r.mb2=JSON.parse(JSON.stringify(state.obs[0].mb));r.add=document.getElementById('mbAdd').hidden;
    /* the first behavior timed */
    const d=document.getElementById('mDur1');d.checked=true;d.dispatchEvent(new Event('change',{bubbles:true}));
    r.dur1=state.meta.dur1;r.dur1Print=document.getElementById('dur1Row').classList.contains('noprint');r.f=[...pg().querySelectorAll('input[data-field]')].map(e=>e.dataset.field).filter(f=>/^dur/.test(f));
    return r;});
  ok('4 F74 entries typed go to their own behavior',s2.mb[0].c==='4'&&s2.mb[2].c==='2'&&s2.mb[1].c==='',s2);
  ok('5 F74 Remove asks first, naming the counts it takes, and the other behaviors keep theirs',s2.q.length===1&&/^Remove Elopement \(simulated\) — leaving the assigned area from the record\?\nIts counts on 1 observation are removed with it\./.test(s2.q[0])
    &&s2.more.join('|')==='Crying (simulated)|'&&s2.mb2.length===2&&s2.mb2[1].c==='2'&&s2.add===false,s2);
  ok('6 I38 the first behavior\'s timed box gives each sheet its total minutes and longest episode, and prints once ticked',s2.dur1==='1'&&!s2.dur1Print&&s2.f.join(',')==='durTot,durLong',s2);
  await p.close();

  /* ---------------- 7-12 the simulation: summary, statement, CSV, files ---------------- */
  const q=await open(OB);
  await q.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const sm=await q.evaluate(()=>({beh:[...document.querySelectorAll('#behTbl tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent).join('|')),head:!document.getElementById('behHead').hidden,
    cap:(document.querySelector('#behTbl caption')||{}).textContent||'',sum:[...document.querySelectorAll('#sumBox li')].map(x=>x.textContent),draft:draft(),
    rep:(document.querySelector('.obs-page .rep')||{}).textContent||'',ivrule:(document.querySelector('.obs-page p.ivrule')||{}).textContent||'',
    labs:[...document.querySelectorAll('.obs-page')[0].querySelectorAll('table.obs-count td.lab')].map(td=>td.textContent)}));
  ok('7 F74 I38 the summary has a row for each behavior: observations, counts and rates, the peer\'s, and the timed one\'s minutes, longest and share',
    sm.head&&sm.beh.length===2&&sm.beh[0]==='Aggression toward staff|2 of 3|13|6.9|2|1.1|||'&&sm.beh[1]==='Out of seat (simulated) (timed)|2 of 3|5|2.7|1|0.5|10.5|3|9.3%'
    &&/for the first behavior, Aggression toward staff\./.test(sm.cap),sm);
  ok('8 F74 I38 the summary box gives the other behavior\'s figures in words',sm.sum.includes('Out of seat (simulated): 5 episodes in 2 of 3 observations (2.7 per hour); the comparison peer 1 episode (0.5 per hour); 10.5 minutes timed in all, the longest episode 3 minutes (9.3% of the minutes observed).')
    &&!sm.sum.some(t=>/^Aggression toward staff: /.test(t)),sm.sum);
  ok('9 F74 I38 the FS-1 statement names the first behavior and gives the other its own sentences, its minutes too',
    sm.draft.includes('The first target behavior (Aggression toward staff) was observed in 2 of 3 observations, with 13 occurrences recorded (6.9 per hour).')
    &&sm.draft.includes('Out of seat (simulated) was observed in 2 of 3 observations, with 5 episodes recorded (2.7 per hour). The comparison peer had 1 episode (0.5 per hour). Its episodes were timed: 10.5 minutes in all, the longest 3 minutes (9.3% of the minutes observed).')
    &&/describe when and where the behaviors occurred; they do not establish what maintains them\.$/.test(sm.draft),sm.draft);
  ok('10 F74 the sheets say which behavior the interval sample is of',sm.labs.includes('Aggression toward staff: occurrences counted')&&sm.labs.includes('Partial interval (Aggression toward staff)')&&/The sample is of Aggression toward staff only\./.test(sm.ivrule),sm);
  const csv=await grab(q,'#csvBtn');const rows=fs.readFileSync(csv.path,'utf8').split('\n');const H=rows[0];
  ok('11 F74 I38 the CSV adds each other behavior\'s columns after all the others',/"Interval IOA \(%\)","Out of seat \(simulated\): count","Out of seat \(simulated\): peer count","Out of seat \(simulated\): minutes timed","Out of seat \(simulated\): longest episode \(min\)"$/.test(H)
    &&/"3","1","6.5","3"$/.test(rows[1])&&/"0","0","0",""$/.test(rows[2]),{H:H.slice(-260),r1:rows[1].slice(-60)});
  const js=await grab(q,'#saveBtn');
  const back=await q.evaluate(()=>{state.meta.more=[];state.obs.forEach(o=>o.mb=[]);render();return state.meta.more.length;});
  await q.setInputFiles('#fileIn',js.path);await sleep(700);
  const rb=await q.evaluate(()=>({more:state.meta.more,mb:state.obs.map(o=>o.mb[0]&&o.mb[0].tot),rows:document.querySelectorAll('#behTbl tbody tr').length,tiles:document.querySelectorAll('#obrMore .obr-mrow').length}));
  ok('12 F74 saved and opened again, the other behavior and its entries come back (and its tiles)',back===0&&rb.more.length===1&&rb.more[0].dur==='1'&&rb.mb.join(',')==='6.5,0,4'&&rb.rows===2&&rb.tiles===1,rb);
  /* an older file: one behavior, as before */
  const OLD={meta:{client:'Old File Student (simulated)',behavior:'Aggression toward staff (simulated)',definition:'Forceful contact (simulated).'},cfg:{ivLen:15,ivMethod:'partial',ivN:20},
    obs:[{date:'2026-09-24',start:'09:05',end:'09:50',count:'7',peerCount:'1',iv:Array.from({length:20},(_,j)=>j===3),peerIv:Array(20).fill(false),narrative:[{t:'09:07',w:'Worksheet placed.'}]}]};
  const oldF=OUT+'old-one-behavior.json';fs.writeFileSync(oldF,JSON.stringify(OLD));
  await q.setInputFiles('#fileIn',oldF);await sleep(700);
  const ol=await q.evaluate(()=>({n:behList().length,more:state.meta.more,mb:state.obs[0].mb,head:document.getElementById('behHead').hidden,wrap:document.getElementById('mbWrap').classList.contains('noprint'),
    labs:[...document.querySelectorAll('.obs-page')[0].querySelectorAll('table.obs-count td.lab')].map(td=>td.textContent),draft:draft(),tiles:document.getElementById('obrMore').hidden,
    beh:document.getElementById('obrTapS').hasAttribute('data-beh'),ev:(window.__nbhFactsOut()||{}).evidence}));
  ok('13 F74 an older file opens as one behavior: no other rows, no table, the statement and the tiles as before',ol.n===1&&ol.more.length===0&&ol.mb.length===0&&ol.head&&ol.wrap
    &&ol.labs[0]==='Occurrences counted'&&ol.labs.length===2&&/^The observer conducted 1 direct observation .*The behavior was observed in 1 of 1 observation, with 7 occurrences recorded/.test(ol.draft)&&ol.tiles&&!ol.beh&&!!ol.ev&&!ol.ev.perBehavior,ol);
  const junk={meta:{behavior:'X (simulated)',more:[{label:'A (simulated)',dur:true},null,'text',{label:{x:1},def:5},{label:'C'},{label:'D'},{label:'E'}],dur1:'yes'},
    obs:[{count:'1',mb:[{c:{a:1},p:null,tot:'2',long:3},'x',{c:'4'},{c:'5'},{c:'6'}],durTot:{x:1},durLong:null}]};
  const junkF=OUT+'junk.json';fs.writeFileSync(junkF,JSON.stringify(junk));
  await q.setInputFiles('#fileIn',junkF);await sleep(700);
  const jk=await q.evaluate(()=>({more:state.meta.more,dur1:state.meta.dur1,mb:state.obs[0].mb,dt:state.obs[0].durTot,dl:state.obs[0].durLong,rows:document.querySelectorAll('#mbTbl tbody tr').length}));
  ok('14 F74 a file holding nonsense opens safely: three behaviors at most, text where text is due',jk.more.length===3&&jk.more[0].dur==='1'&&jk.more[1].label==='[object Object]'&&jk.more[1].def==='5'&&jk.dur1===''
    &&jk.mb.length===3&&jk.mb[0].c===''&&jk.mb[0].tot==='2'&&jk.mb[0].long==='3'&&jk.mb[1].c===''&&jk.dt===''&&jk.dl===''&&jk.rows===3,jk);
  await q.close();

  /* ---------------- 15-21 the Live Recorder ---------------- */
  const r=await open(OB);
  await r.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  await r.evaluate(()=>document.querySelector('#viewSeg [data-view="obs"]').click());await sleep(300);
  const t0=await r.evaluate(()=>({rows:document.querySelectorAll('#obrMore .obr-mrow').length,hidden:document.getElementById('obrMore').hidden,beh:document.getElementById('obrTapS').getAttribute('data-beh'),
    tiles:[...document.querySelectorAll('#obrMore [data-mk]')].map(b=>b.dataset.who+':'+b.getAttribute('aria-keyshortcuts')+':'+b.disabled+':'+b.getAttribute('data-beh')),line:document.querySelector('#obrMore [data-mk][data-who="s"] .obr-rate').textContent}));
  ok('15 F74 the other behavior has a row of tiles, named, disabled until Start, keys 5 and Shift+5; a timed one says it takes the start and the end',
    t0.rows===1&&!t0.hidden&&t0.beh==='Aggression toward staff'&&t0.tiles.join(',')==='s:5:true:Out of seat (simulated),p:Shift+5:true:Out of seat (simulated)'&&t0.line==='tap at its start and its end',t0);
  await r.click('#obrStart');await sleep(300);
  await r.keyboard.press('1');await sleep(60);await r.keyboard.press('Shift+Digit1');await sleep(60);
  await r.keyboard.press('Digit5');await sleep(60);
  await r.evaluate(()=>window.__adv(90000));await sleep(400);
  const t1=await r.evaluate(()=>({line:document.querySelector('#obrMore [data-mk][data-who="s"] .obr-rate').textContent,ring:document.querySelector('#obrMore [data-mk][data-who="s"]').classList.contains('obr-timing'),more:obRecorder.more()}));
  await r.keyboard.press('Digit5');await sleep(60);
  await r.keyboard.press('Shift+Digit5');await sleep(60);await r.keyboard.press('Shift+Digit5');await sleep(60);
  await r.evaluate(()=>document.querySelector('#obrMore [data-mu][data-who="p"]').click());await sleep(60);
  await r.keyboard.press('Digit5');await sleep(60);
  await r.evaluate(()=>window.__adv(30000));await sleep(300);
  const t2=await r.evaluate(()=>({c:obRecorder.counts(),more:obRecorder.more(),n:[...document.querySelectorAll('#obrMore .obr-n')].map(x=>x.textContent),msg:document.getElementById('obrMsg').textContent}));
  ok('16 F74 I38 keys 5 and Shift+5 count the other behavior; its Student tile starts an episode and the next tap ends it, ringed and timed while it runs',
    /^episode 1:3\d$/.test(t1.line)&&t1.ring&&t1.more[0].ep.length===1&&t1.more[0].ep[0].b===null&&t2.c.s===1&&t2.c.p===1&&t2.more[0].s===2&&t2.more[0].p===1&&t2.more[0].ep.length===2&&t2.more[0].ep[0].b!==null&&t2.more[0].ep[1].b===null&&t2.n.join(',')==='2,1',{t1,t2});
  await r.evaluate(()=>window.obRecorder&&document.getElementById('obrEnd').click());await sleep(400);
  const t3=await r.evaluate(()=>({st:obRecorder.state(),more:obRecorder.more(),sum:document.getElementById('obrSum').innerText}));
  ok('17 I38 at End an episode still going is timed to the end; the Recording Summary gives each behavior by name with its minutes',
    t3.st==='ended'&&t3.more[0].ep[1].cut&&t3.more[0].ep[1].b!==null&&/Aggression toward staff: student\s+1 occurrence/.test(t3.sum)&&/Out of seat \(simulated\)\s+student 2 episodes, [\d.]+ per hour; 2 min timed, the longest episode 1.5 min; peer 1 episode/.test(t3.sum),t3);
  await r.evaluate(()=>{const s=document.getElementById('obrInto');s.value='0';s.dispatchEvent(new Event('change'));window.__q=[];});await sleep(100);
  await r.click('#obrSave');await sleep(700);
  const t4=await r.evaluate(()=>({q:window.__q.slice(),o:JSON.parse(JSON.stringify(state.obs[0])),st:obRecorder.state(),
    sheet:[...document.querySelectorAll('.obs-page')][0].querySelector('input[data-field="mb:0:tot"]').value}));
  ok('18 F74 replacing an observation names the other behavior\'s entries too',t4.q.length===1&&/a count of Out of seat \(simulated\) \(3\), a peer count of Out of seat \(simulated\) \(1\) and minutes of Out of seat \(simulated\) timed \(6\.5\)/.test(t4.q[0]),t4.q);
  ok('19 F74 I38 Save to the record writes each behavior into its own rows: counts, the minutes timed and the longest, and the note on the episode cut short',
    t4.st==='ready'&&t4.o.count==='1'&&t4.o.peerCount==='1'&&t4.o.mb[0].c==='2'&&t4.o.mb[0].p==='1'&&t4.o.mb[0].tot==='2'&&t4.o.mb[0].long==='1.5'&&t4.sheet==='2'&&t4.o.durTot===''
    &&/The last episode of Out of seat \(simulated\) was still going when the observation ended, so it is timed to the end\./.test(t4.o.notes),{o:{count:t4.o.count,mb:t4.o.mb,notes:t4.o.notes,durTot:t4.o.durTot}});
  /* the first behavior timed, with the sample running */
  /* the peer switched off, so the student's row alone decides whether an interval is scored */
  await r.evaluate(()=>{state.meta.dur1='1';render();document.getElementById('obrPeer').click();});await sleep(300);
  const t5a=await r.evaluate(()=>document.getElementById('obrRateS').textContent);
  await r.click('#obrStart');await sleep(300);
  await r.click('#obrSample');await sleep(200);
  await r.evaluate(()=>window.__adv(5000));await sleep(300);
  await r.keyboard.press('1');await sleep(100);
  const sc1=await r.evaluate(()=>obRecorder.scheduled());
  await r.evaluate(()=>window.__adv(32000));await sleep(600);
  const t5=await r.evaluate(()=>({smp:obRecorder.sample(),ep:obRecorder.episodes(),c:obRecorder.counts(),sch:obRecorder.scheduled(),line:document.getElementById('obrRateS').textContent,ring:document.getElementById('obrTapS').classList.contains('obr-timing'),timed:obRecorder.timed()}));
  ok('20 I38 a timed first behavior: the Student tile starts an episode; in a partial-interval sample every interval it runs into is marked +, and their ends do not alert',
    /tap at its start and its end/.test(t5a)&&t5.timed&&t5.c.s===1&&t5.ep.length===1&&t5.ep[0].b===null&&t5.smp.s.slice(0,3).join('')==='+++'&&t5.smp.s[3]===''&&t5.ring&&/^episode 0:3\d$/.test(t5.line)
    &&!t5.sch.includes('iv2')&&!sc1.includes('iv0'),{t5,sc1});
  await r.keyboard.press('1');await sleep(80);
  const u1=await r.evaluate(()=>obRecorder.episodes());
  await r.keyboard.press('z');await sleep(80);
  const u2=await r.evaluate(()=>({ep:obRecorder.episodes(),c:obRecorder.counts().s,msg:document.getElementById('obrMsg').textContent}));
  await r.keyboard.press('z');await sleep(80);
  const u3=await r.evaluate(()=>({ep:obRecorder.episodes(),c:obRecorder.counts().s}));
  await r.keyboard.press('1');await sleep(80);await r.evaluate(()=>window.__adv(60000));await sleep(300);await r.keyboard.press('1');await sleep(80);
  await r.keyboard.press('1');await sleep(80);await r.evaluate(()=>window.__adv(30000));await sleep(300);await r.keyboard.press('1');await sleep(80);
  ok('21 I38 Undo opens the episode last ended again, then takes away the one going on',u1[0].b!==null&&u2.ep.length===1&&u2.ep[0].b===null&&/going on again/.test(u2.msg)&&u2.c===1&&u3.ep.length===0&&u3.c===0,{u1,u2,u3});
  await r.evaluate(()=>document.getElementById('obrEnd').click());await sleep(400);
  await r.evaluate(()=>{const s=document.getElementById('obrInto');s.value='';s.dispatchEvent(new Event('change'));});await sleep(100);
  const nBefore=await r.evaluate(()=>state.obs.length);
  await r.click('#obrSave');await sleep(800);
  const t6=await r.evaluate(()=>{const o=state.obs[state.obs.length-1];return {n:state.obs.length,count:o.count,durTot:o.durTot,durLong:o.durLong,mb:o.mb,
    sheet:[...document.querySelectorAll('.obs-page')].pop().querySelector('input[data-field="durTot"]').value,beh:[...document.querySelectorAll('#behTbl tbody tr')].map(tr=>tr.children[0].textContent)};});
  ok('22 I38 saved: the episodes counted, their total minutes and the longest on the sheet; the other behavior\'s untouched tiles save 0 (the peer off: empty)',
    t6.n===nBefore+1&&t6.count==='2'&&t6.durTot==='1.5'&&t6.durLong==='1'&&t6.sheet==='1.5'&&t6.mb[0].c==='0'&&t6.mb[0].p===''&&t6.mb[0].tot==='0'&&t6.mb[0].long===''&&t6.beh[0]==='Aggression toward staff (timed)',t6);
  await r.close();

  /* ---------------- 23-27 the case: in and out ---------------- */
  const c=await open(OB);
  const B=(label,dim,isRep)=>({label,def:'Definition of '+label+'.',dim,isRep:!!isRep});
  const facts={behaviors:[B('Aggression (simulated)','Count / rate'),B('Tantrum (simulated)','Duration'),B('Break request (simulated)','% of opportunities',true),B('Elopement (simulated)','Count / rate'),B('Aggression (simulated)','Count / rate'),B('Spitting (simulated)','Count / rate'),B('Screaming (simulated)','Count / rate')]};
  const in1=await c.evaluate(f=>{const rep=window.nbhCase.apply(f);return {rep,beh:state.meta.behavior,dur1:state.meta.dur1,more:JSON.parse(JSON.stringify(state.meta.more))};},facts);
  await sleep(300);
  Object.assign(in1,await c.evaluate(f=>{const a={tiles:document.querySelectorAll('#obrMore .obr-mrow').length};const rep2=window.nbhCase.apply(f);a.rep2=rep2;a.more2=state.meta.more.length;return a;},facts));
  ok('23 F74 the case\'s targets arrive: the first in the behavior box (the generic fill), the others but the replacement and the first again, three at most, each with its definition, the duration one timed',
    in1.rep&&in1.rep.generic===true&&in1.rep.more===3&&/^Aggression \(simulated\): Definition of Aggression/.test(in1.beh)&&!in1.dur1&&in1.more.map(b=>b.label+'/'+b.dur).join('|')==='Tantrum (simulated)/1|Elopement (simulated)/|Spitting (simulated)/'
    &&in1.more[0].def==='Definition of Tantrum (simulated).'&&/Screaming \(simulated\) was not placed/.test(in1.rep.note||'')&&in1.tiles===3,in1);
  ok('24 F74 opened again from the case, a record already holding its behavior is left as it is',in1.more2===3&&in1.rep2&&in1.rep2.generic===true&&!in1.rep2.more,in1.rep2);
  await c.close();
  const c2=await open(OB);
  const in2=await c2.evaluate(()=>{const r={};window.nbhCase.apply({behaviors:[{label:'Tantrum (simulated)',def:'Crying and dropping (simulated).',dim:'Duration'},{label:'Hitting (simulated)',def:'Open hand (simulated).',dim:'Count / rate'}]});
    r.dur1=state.meta.dur1;r.more=state.meta.more.map(b=>b.label);r.f=[...document.querySelectorAll('#obsPages input[data-field^="dur"]')].length;
    document.getElementById('addObs').click();r.f2=[...document.querySelectorAll('#obsPages input[data-field^="dur"]')].map(e=>e.dataset.field).join(',');
    /* the case panel's ticked targets: the first already on the record, so the behavior box stays; the others beside it */
    const B=(label,dim,isRep)=>({label,def:'Definition of '+label+'.',dim,isRep:!!isRep});
    r.repA=window.__nbhFactsPick({behaviors:[B('Hitting (simulated)','Count / rate'),B('Break request (simulated)','% of opportunities',true),B('Spitting (simulated)','')]});
    r.behA=state.meta.behavior;r.dur1A=state.meta.dur1;r.moreA=state.meta.more.map(b=>b.label);
    /* a new first one replaces the behavior box, as the generic fill did, and takes its own timing */
    r.repB=window.__nbhFactsPick({behaviors:[B('Kicking (simulated)','Duration'),B('Spitting (simulated)','')]});
    r.behB=state.meta.behavior;r.dur1B=state.meta.dur1;r.moreB=state.meta.more.map(b=>b.label);
    /* the record full: what does not fit is named */
    r.repC=window.__nbhFactsPick({behaviors:[B('Yelling (simulated)','Count / rate'),B('Biting (simulated)','Count / rate')]});
    r.behC=state.meta.behavior;r.moreC=state.meta.more.length;return r;});
  ok('25 I38 a first target whose TB-1 dimension is duration is timed on the record',in2.dur1==='1'&&in2.more.join('|')==='Hitting (simulated)'&&in2.f===2&&in2.f2==='durTot,durLong,durTot,durLong',in2);
  ok('26 F74 the case panel\'s ticked targets all arrive, each once: one already on the record stays put, a new first one goes into the behavior box with its timing, the rest beside; what does not fit is named',
    /^Tantrum \(simulated\): /.test(in2.behA)&&in2.dur1A==='1'&&in2.moreA.join('|')==='Hitting (simulated)|Break request (simulated)|Spitting (simulated)'&&in2.repA.filled===2
    &&/^Kicking \(simulated\): Definition of Kicking/.test(in2.behB)&&in2.dur1B==='1'&&in2.moreB.length===3
    &&/^Yelling \(simulated\): /.test(in2.behC)&&in2.moreC===3&&/Biting \(simulated\) was not placed/.test(in2.repC.note||''),in2);
  await c2.close();
  const e=await open(OB);
  await e.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const ev=await e.evaluate(()=>{const o=window.__nbhFactsOut();return {ev:o&&o.evidence,draft:draft()};});
  const per=(ev.ev&&ev.ev.perBehavior)||[];
  ok('27 F74 I38 the evidence carries one statement per behavior, with its figures, beside the record\'s own',per.length===2&&per[0].behavior==='Aggression toward staff'&&per[0].count===13&&per[0].timed===false
    &&per[1].behavior==='Out of seat (simulated)'&&per[1].statement==='Out of seat (simulated) was observed in 2 of 3 observations, with 5 episodes recorded (2.7 per hour). The comparison peer had 1 episode (0.5 per hour). Its episodes were timed: 10.5 minutes in all, the longest 3 minutes (9.3% of the minutes observed).'
    &&per[1].durTot===10.5&&per[1].durLong===3&&per[1].durPct===9.3&&per[1].rate===2.7&&ev.ev.form==='OB-1'&&/Out of seat \(simulated\) was observed/.test(ev.draft),per);

  /* ---------------- 28-29 print and phone ---------------- */
  await e.emulateMedia({media:'print'});await sleep(200);
  const pr=await e.evaluate(()=>{const vis=el=>!!el&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;
    document.body.className='view-setup';
    return {wrap:vis(document.getElementById('mbWrap')),rm:[...document.querySelectorAll('#mbTbl button.rm')].some(vis),add:vis(document.getElementById('mbAdd')),dur1:vis(document.getElementById('dur1Row'))};});
  await e.emulateMedia({media:'screen'});
  ok('28 F74 on paper the other behaviors print with their definitions, without the buttons; the timed box only when ticked',pr.wrap&&!pr.rm&&!pr.add&&!pr.dur1,pr);
  await e.setViewportSize({width:390,height:844});await sleep(300);
  const ph=await e.evaluate(async()=>{const out={};for(const v of ['setup','summary','obs']){document.querySelector('#viewSeg [data-view="'+v+'"]').click();await new Promise(z=>setTimeout(z,250));out[v]=document.documentElement.scrollWidth;}
    const t=[...document.querySelectorAll('#obrMore [data-mk]')].map(b=>b.getBoundingClientRect()),u=[...document.querySelectorAll('#obrMore [data-mu]')].map(b=>b.getBoundingClientRect());
    out.side=t.length===2&&Math.abs(t[0].top-t[1].top)<2&&u.length===2&&u[0].top>=t[0].bottom-1&&Math.min(...t.map(x=>x.height))>=44&&Math.min(...u.map(x=>x.height))>=44;
    out.r=t.concat(u).map(x=>[Math.round(x.top),Math.round(x.left),Math.round(x.height)]);return out;});
  ok('29 F74 on a phone nothing scrolls sideways; the tiles side by side with their Undo under them, each at least 44 px',ph.setup<=390&&ph.obs<=390&&ph.summary<=390&&ph.side,ph);
  await e.close();

  /* ---------------- 30 the workstation: TB-1's simulated targets reach OB-1 ---------------- */
  const sctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const sh=await sctx.newPage();sh.on('pageerror',x=>errs.push('shell: '+x.message));
  await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await sh.evaluate(()=>{const s=(i,v)=>{const e=document.getElementById(i);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('pClient','Mateo Rivera (simulated)');s('pSid','4471823');});
  const F=L.forms('NBH-Workstation');
  const openF=async id=>{await sh.evaluate(i=>openForm(i),id);await sh.waitForFunction(i=>!!state.status[i],id,{timeout:20000}).catch(()=>{});await sleep(1800);
    const f=F.find(x=>x.id===id).file;return sh.frames().find(x=>x.url().includes(f)||x.url().includes(encodeURIComponent(f)));};
  let fr=await openF('TB-1');await fr.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(6000);
  fr=await openF('OB-1');
  const ws=await fr.evaluate(()=>({beh:state.meta.behavior,more:(state.meta.more||[]).map(b=>b.label),tiles:document.querySelectorAll('#obrMore .obr-mrow').length,dur1:state.meta.dur1}));
  ok('30 F74 in the workstation, TB-1\'s simulated targets reach OB-1: the first in the behavior box, the next three (not the replacement) on Setup with their tiles',
    /^Aggression: /.test(ws.beh||'')&&ws.more.join('|')==='Self-injury – head hitting|Elopement|Arranging and ordering (higher-level RRB)'&&ws.tiles===3&&!ws.dur1,ws);
  await sctx.close();
  ok('31 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
