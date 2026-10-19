/* Form ABC-1's sound level meter (v23.38): the iPad's microphone gives the room's A-weighted level (only the level, every
   10 seconds); Incident starting takes the level of the seconds before it (the last 2 left out), each background check the
   level of its scored seconds; the Analysis tab compares them (the loud quarter of the checks, p(behavior | loud), Yule's Q,
   by activity, minute by minute); set against a sound level meter it reads dBA; paused while dictating; saved and opened
   with the record; never printed; a record that never used it is saved and analysed as before.
   The microphone is a test tone (a 1 kHz or 100 Hz sine). Simulated data only. usage: node qa/abc-noise-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const ABC='ABC_Recording_Conditional_Probability_Analysis.html';
/* the microphone: a sine whose loudness and pitch the test sets */
const MIC=()=>{window.__amp=0.01;window.__hz=1000;navigator.mediaDevices.getUserMedia=async()=>{const ac=new AudioContext();const o=ac.createOscillator(),g=ac.createGain();
  o.frequency.value=window.__hz;g.gain.value=window.__amp;o.connect(g);const d=ac.createMediaStreamDestination();g.connect(d);o.start();await ac.resume();
  window.__tone=(a,h)=>{g.gain.value=a;if(h)o.frequency.value=h;};window.__track=d.stream.getAudioTracks()[0];return d.stream;};};
(async()=>{const br=await L.chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
  try{
  const now=async p=>p.evaluate(()=>document.getElementById('sndNow').textContent);
  /* ---- the meter itself, in real time ---- */
  const c1=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});await c1.addInitScript(MIC);
  const p=await c1.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+ABC);await sleep(1000);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.abc.sndCal');}catch(e){}nbhUI.toast=()=>{};});
  await p.click('#sndBtn');await sleep(1600);const a1=await now(p);
  await p.evaluate(()=>window.__tone(0.1));await sleep(1600);const a2=await now(p);
  ok('1 the meter reads a quiet 1 kHz tone (43 dB under full scale) as about 57 on the iPad’s own scale, and one 20 dB louder as about 77',/^Now 5[67] \(iPad scale\)$/.test(a1)&&/^Now 7[67] \(iPad scale\)$/.test(a2),{a1,a2});
  await p.evaluate(()=>window.__tone(0.1,100));await sleep(1600);const a3=await now(p);
  ok('2 it is A-weighted: the same tone at 100 Hz (a hum) reads about 19 dB lower',/^Now 5[789] \(iPad scale\)$/.test(a3),a3);
  await p.evaluate(()=>window.__tone(0.1,1000));await sleep(3600);
  p.once('dialog',d=>d.accept('70'));await p.click('#sndCal');await sleep(1200);const a4=await now(p),cal=await p.evaluate(()=>JSON.parse(localStorage.getItem('nbh.abc.sndCal')||'null'));
  ok('3 set against a sound level meter (70 dBA typed) it reads dBA from then on',!!cal&&Math.abs(cal.off-93)<1.5&&/^Now (69|70|71) dBA$/.test(a4),{cal,a4});
  p.once('dialog',d=>d.accept(''));await p.click('#sndCal');await sleep(300);const cl=await p.evaluate(()=>localStorage.getItem('nbh.abc.sndCal'));
  await p.evaluate(()=>{let b=document.getElementById('nbhDictBtn');if(!b){b=document.createElement('button');b.id='nbhDictBtn';document.body.appendChild(b);}window.__dWas=b.getAttribute('aria-pressed');b.setAttribute('aria-pressed','true');});await sleep(1500);
  const dct=await p.evaluate(()=>({t:document.getElementById('sndNow').textContent,l:abcNoise.level(Date.now()-1000,Date.now()+1)}));
  await p.evaluate(()=>{const b=document.getElementById('nbhDictBtn');if(b)b.setAttribute('aria-pressed',window.__dWas||'false');});
  ok('4 an empty reading clears the setting; while Dictate has the microphone nothing is measured',cl===null&&dct.t==='Paused while you dictate'&&dct.l===null,{cl,dct});
  await sleep(2500);await p.click('#sndBtn');await sleep(300);
  const off=await p.evaluate(()=>({btn:document.getElementById('sndBtn').getAttribute('aria-pressed'),track:window.__track.readyState,runs:state.noise.runs.map(r=>({off:r.off,wtd:r.wtd,v:r.v.filter(x=>x!=null)}))}));
  ok('5 turned off, the microphone is let go; the record keeps a level for each 10 seconds heard, A-weighted, and no sound',off.btn==='false'&&off.track==='ended'&&off.runs.length>=1&&off.runs.every(r=>r.wtd===true)&&off.runs.some(r=>r.v.length>=1&&r.v.every(v=>typeof v==='number'&&v<0&&v>-80)),off);
  await c1.close();

  /* ---- with the observation timer, on a test clock ---- */
  const c2=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});await c2.addInitScript(MIC);
  const q=await c2.newPage();q.on('pageerror',e=>errs.push(e.message));await q.clock.install({time:new Date(2026,9,19,9,0,0)});
  await q.goto(L.BASE+'/NBH-Workstation/'+ABC);await q.clock.pauseAt(new Date(2026,9,19,9,0,3));
  await q.evaluate(()=>{try{localStorage.removeItem('nbh.abc.sndCal');}catch(e){}nbhUI.toast=()=>{};nbhUI.confirm=async()=>true;window.confirm=()=>true;
    /* the test clock draws a frame every 16 ms of its time: once a second is enough for the clock face (the checks run on their own 250 ms tick) */
    window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),1000);});
  await q.click('#sndBtn');await sleep(600);
  await q.selectOption('#obsChecks','fixed:5');await q.click('#obsStart');
  await q.clock.runFor(5*60000+1000);await sleep(200);
  await q.click('#obsRecord');await sleep(200);const bv=await q.inputValue('#bg-noise');
  await q.click('#bg-save');await sleep(200);const s1=await q.evaluate(()=>state.samples.map(s=>s.noise));
  ok('6 a background check takes the level of its scored seconds, kept with its sample',bv==='57'&&s1.length===1&&s1[0]&&Math.abs(s1[0].v-57)<1&&s1[0].cal===false&&s1[0].src==='mic'&&s1[0].w===10,{bv,s1});
  await q.evaluate(()=>window.__tone(0.1));await sleep(500);await q.clock.runFor(15000);
  await q.click('#obsBarInc');await sleep(150);const ev=await q.inputValue('#e-noise');
  await q.evaluate(()=>{const b=document.querySelector('#abc-grid input[id^="b-"]');b.click();});await q.click('#save-entry');await sleep(200);
  /* the behavior's own sound: quiet until a second before the press */
  await q.evaluate(()=>window.__tone(0.01));await sleep(500);await q.clock.runFor(14000);await q.evaluate(()=>window.__tone(0.1));await sleep(500);await q.clock.runFor(1000);
  await q.click('#obsBarInc');await sleep(150);const ev2=await q.inputValue('#e-noise');
  await q.evaluate(()=>{const b=document.querySelector('#abc-grid input[id^="b-"]');b.click();});await q.click('#save-entry');await sleep(200);
  const en=await q.evaluate(()=>state.entries.map(e=>e.noise));
  ok('7 Incident starting takes the level of the seconds before it, and the incident keeps it',ev==='77'&&en.length===2&&Math.abs(en[0].v-77)<1&&en[0].src==='mic',{ev,en});
  ok('8 the behavior’s own sound (the last 2 seconds before the press) is left out',ev2==='57'&&Math.abs(en[1].v-57)<1,{ev2,en1:en[1]});
  await q.evaluate(()=>switchTab('incidents'));const tl=await q.evaluate(()=>document.getElementById('inc-table').textContent.replace(/\s+/g,' '));
  ok('9 the incident list shows each incident’s level',/sound 77 \(iPad scale\)/.test(tl)&&/sound 57 \(iPad scale\)/.test(tl),tl.slice(0,300));
  await q.evaluate(()=>document.getElementById('sndBtn').click());
  /* the analysis, on simulated incidents and checks */
  await q.evaluate(()=>{const bid=state.entries[0].behaviors[0],N=(v,cal)=>({v,cal:!!cal,src:'mic',w:10});
    const E=(t,v,act)=>({id:'sim'+t.replace(':',''),date:'2026-10-19',time:t,mode:'coded',behaviors:[bid],antecedents:[],consequences:[],precursors:[],settingEvents:[],resolution:[],activity:act,noise:N(v)});
    const Sm=(t,v,act)=>({id:'sm'+t.replace(':',''),date:'2026-10-19',time:t,window:10,unit:'s',activity:act,antecedents:[],events:[],precursors:[],settingEvents:[],staffPresent:'',noise:N(v)});
    state.entries=[E('09:10',75,'Lunch'),E('09:20',76,'Lunch'),E('09:30',74,'Lunch'),E('09:40',78,'Math'),E('09:50',73,'Lunch'),E('10:00',77,'Lunch'),E('10:10',55,'Math'),E('10:20',54,'Math')];
    state.samples=[50,52,54,55,56,57,58,59,60,53,51,58,72,74,76,78].map((v,i)=>Sm('11:'+String(i*3).padStart(2,'0'),v,i>=12?'Lunch':'Math'));refreshAll();});
  await q.evaluate(()=>switchTab('analysis'));await sleep(300);
  const an=await q.evaluate(()=>{const c=[...document.querySelectorAll('#analysis-out .card')].find(x=>/Sound level before incidents/.test(x.textContent));if(!c)return null;
    return {t:c.innerText.replace(/\s+/g,' '),svg:c.querySelectorAll('svg').length,rows:[...c.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(x=>x.innerText.trim()).join(' '))};});
  ok('10 the analysis compares the level before incidents with the checks’: medians, the difference, the loud quarter, Yule’s Q',!!an&&/75 median level before an incident/.test(an.t)&&/58 median level at a background check/.test(an.t)&&/\+17 dB louder before incidents/.test(an.t)
    &&/Loud is the loudest quarter of the background checks: 63 or more/.test(an.t)&&/60% of sampled units in the loud quarter contained the behavior \(6\/10\)/.test(an.t)&&/Yule's Q \(strong/.test(an.t)&&/The iPad’s own scale/.test(an.t),an&&an.t.slice(0,900));
  ok('11 by activity, each activity against itself; and the observation minute by minute with its incidents',!!an&&an.rows.length===2&&an.rows.some(r=>/^Lunch 75 \(5\) 75 \(4\) 0 dB$/.test(r))&&an.rows.some(r=>/^Math 55 \(3\) 56 \(12\) 0 dB$/.test(r))&&an.svg>=2&&/2026-10-19: the level minute by minute, each incident a red line/.test(an.t),an&&{rows:an.rows,svg:an.svg});
  /* a level typed from a meter is dBA, and the scales are not mixed */
  await q.evaluate(()=>switchTab('record'));await q.evaluate(()=>{const b=document.querySelector('#abc-grid input[id^="b-"]');b.click();});await q.fill('#e-noise','68');await q.click('#save-entry');await sleep(150);
  await q.evaluate(()=>switchTab('analysis'));await sleep(300);
  const ty=await q.evaluate(()=>({n:state.entries.find(e=>e.noise&&e.noise.src==='typed'),t:document.getElementById('analysis-out').textContent.replace(/\s+/g,' ')}));
  ok('12 a level typed from a meter is kept as dBA, and the analysis does not mix it with the iPad’s scale',!!ty.n&&ty.n.noise.v===68&&ty.n.noise.cal===true&&/1 level is on the other scale \(dBA\) and left out/.test(ty.t),{n:ty.n,t:ty.t.slice(0,200)});
  await q.evaluate(()=>switchTab('background'));await q.fill('#bg-date','2026-10-19');await q.fill('#bg-noise','64');await q.click('#bg-save');await sleep(150);
  const tb=await q.evaluate(()=>({n:state.samples[state.samples.length-1].noise,box:document.getElementById('bg-noise').value}));
  ok('12b a background check’s level typed from a meter is kept as dBA, and the box is emptied for the next check',!!tb.n&&tb.n.v===64&&tb.n.cal===true&&tb.n.src==='typed'&&tb.box==='',tb);
  /* saved and opened with the record */
  const saved=await q.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};exportJSON();setTimeout(()=>res(null),3000);}));
  const csv=await q.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};exportCSV();setTimeout(()=>res(null),3000);}));
  const j=JSON.parse(saved);
  ok('13 the record keeps the levels and the meter’s log; the spreadsheet has the level and its scale',j.noise&&j.noise.runs.length>=1&&j.entries.some(e=>e.noise&&e.noise.v===75)&&/,sound_level,sound_scale\r?\n/.test(csv)&&/,75,iPad scale\r?\n/.test(csv)&&/,68,dBA/.test(csv),{noise:!!j.noise,csv:csv&&csv.split('\n')[0]});
  await q.emulateMedia({media:'print'});const pr=await q.evaluate(()=>({row:getComputedStyle(document.getElementById('sndRow')).display,note:getComputedStyle(document.getElementById('sndNote')).display,bg:getComputedStyle(document.getElementById('bg-noise').closest('label')).display}));await q.emulateMedia({media:'screen'});
  ok('14 the meter and the background box are not printed',pr.row==='none'&&pr.note==='none'&&pr.bg==='none',pr);
  await c2.close();
  const c3=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const r=await c3.newPage();r.on('pageerror',e=>errs.push(e.message));
  await r.goto(L.BASE+'/NBH-Workstation/'+ABC);await sleep(1000);await r.evaluate(()=>{nbhUI.toast=()=>{};nbhUI.confirm=async()=>true;window.alert=()=>{};});
  await r.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'ABC.json',{type:'application/json'}));const i=document.querySelector('#file-input');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(1200);
  await r.evaluate(()=>switchTab('analysis'));await sleep(300);const re=await r.evaluate(()=>({runs:state.noise.runs.length,t:document.getElementById('analysis-out').innerText.replace(/\s+/g,' ')}));
  ok('15 a saved record opens with its levels and its log, and the analysis is the same',re.runs>=1&&/\+17 dB louder before incidents/.test(re.t),re.runs);
  /* a record that never used the meter */
  await r.evaluate(()=>loadDemo());await sleep(500);await r.evaluate(()=>switchTab('analysis'));await sleep(300);
  const plain=await r.evaluate(()=>new Promise(res=>{const t=document.getElementById('analysis-out').textContent;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(x=>{URL.createObjectURL=o;res({t,x});});return o(b);};exportJSON();setTimeout(()=>res(null),3000);}));
  ok('16 a record that never used the meter: no sound section, and its file is as before (no "noise")',!!plain&&!/Sound level before incidents/.test(plain.t)&&!/"noise"/.test(plain.x),plain&&plain.x.slice(0,100));
  await c3.close();
  ok('17 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
