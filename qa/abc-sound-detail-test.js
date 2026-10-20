/* Form ABC-1's sound in detail (v23.70): with the Sound level meter on, the sound is split into eight pitch bands (each
   band's own level), the pitch of what stands out is found, and each loud moment is kept with its time, length, peak,
   loudest band, pitch and a word for its range; each incident keeps the seconds before it in detail and its own sound
   (Incident starting to Incident over), each check its seconds; the Analysis tab shows the observed time by band, before
   incidents and at the checks band by band, each incident's sound, and the loud moments. Only numbers are kept.
   The microphone is made of test sounds: a quiet hiss for the room, then a 1,200 Hz sawtooth (a high pitch), a 300 Hz
   sawtooth (a voice's pitch), noise under 80 Hz (a deep rumble), noise over 6 kHz (hiss) and a 0.15-second burst.
   Simulated data only.  usage: node qa/abc-sound-detail-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const ABC='ABC_Recording_Conditional_Probability_Analysis.html';
const MIC=()=>{navigator.mediaDevices.getUserMedia=async()=>{const ac=new AudioContext();await ac.resume();const d=ac.createMediaStreamDestination();
  const nb=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate),ch=nb.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
  const noise=()=>{const s=ac.createBufferSource();s.buffer=nb;s.loop=true;s.start();return s;};
  const g=v=>{const x=ac.createGain();x.gain.value=v;x.connect(d);return x;};
  const room=g(0.002);noise().connect(room);
  const hi=g(0),o1=ac.createOscillator();o1.type='sawtooth';o1.frequency.value=1200;o1.connect(hi);o1.start();
  const vo=g(0),o2=ac.createOscillator();o2.type='sawtooth';o2.frequency.value=300;o2.connect(vo);o2.start();
  const ru=g(0),l1=ac.createBiquadFilter(),l2=ac.createBiquadFilter();l1.type=l2.type='lowpass';l1.frequency.value=l2.frequency.value=80;noise().connect(l1);l1.connect(l2);l2.connect(ru);
  const hs=g(0),h1=ac.createBiquadFilter(),h2=ac.createBiquadFilter();h1.type=h2.type='highpass';h1.frequency.value=h2.frequency.value=6000;noise().connect(h1);h1.connect(h2);h2.connect(hs);
  const bg=g(0);noise().connect(bg);
  const G={hi,vo,ru,hs,bg},V={hi:0.1,vo:0.1,ru:1.5,hs:0.5,bg:0.5};
  window.__snd=(k,on)=>{G[k].gain.value=on?V[k]:0;};
  window.__burst=()=>{const t=ac.currentTime+0.05;bg.gain.setValueAtTime(V.bg,t);bg.gain.setValueAtTime(0,t+0.15);};
  return d.stream;};};
(async()=>{const br=await L.chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
  try{
  /* ---- the meter, in real time ---- */
  const c1=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});await c1.addInitScript(MIC);
  const p=await c1.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+ABC);await sleep(1000);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.abc.sndCal');}catch(e){}nbhUI.toast=()=>{};nbhUI.confirm=async()=>true;window.confirm=()=>true;});
  await p.click('#sndBtn');await sleep(4500);
  for(const k of ['hi','vo','ru','hs']){await p.evaluate(k=>window.__snd(k,true),k);await sleep(1500);await p.evaluate(k=>window.__snd(k,false),k);await sleep(2200);}
  await p.evaluate(()=>window.__burst());await sleep(2200);
  const mo=await p.evaluate(()=>abcNoise.moments().map(m=>({k:m.k,f:m.f,d:m.d,b:m.b})));
  ok('1 five loud moments, each with the word for its range: high-pitched, voice-pitched, deep rumble, hiss, sharp and brief',mo.map(m=>m.k).join()==='hi,vo,ru,hs,bg',mo);
  const hi=mo.find(m=>m.k==='hi'),vo=mo.find(m=>m.k==='vo');
  ok('2 the pitch is found: about 1,200 Hz and about 300 Hz, each lasting about as long as it sounded',!!hi&&Math.abs(hi.f-1200)<=60&&!!vo&&Math.abs(vo.f-300)<=15&&hi.d>=1.1&&hi.d<=2&&vo.d>=1.1&&vo.d<=2,{hi,vo});
  const bands=mo.map(m=>m.b);
  ok('3 each moment\'s loudest band: 1 kHz, 250 Hz, 63 Hz and below, 8 kHz and up',bands[0]===4&&bands[1]===2&&bands[2]===0&&bands[3]===7,bands);
  /* the incident: the seconds before it, then its own sound */
  await p.evaluate(()=>{const w=document.getElementById('h-window');if(w){w.value='5';w.dispatchEvent(new Event('change',{bubbles:true}));}});
  await p.evaluate(()=>window.__snd('vo',true));await sleep(4500);await p.evaluate(()=>window.__snd('vo',false));await sleep(2000);
  await p.click('#swBtn');await sleep(400);
  await p.evaluate(()=>window.__snd('hi',true));await sleep(3000);await p.evaluate(()=>window.__snd('hi',false));await sleep(300);
  await p.click('#swBtn');await sleep(500);
  const box=await p.evaluate(()=>{const i=document.getElementById('e-noise'),r=JSON.parse(i.getAttribute('data-snd')||'null'),sp=i.closest('label').querySelector('.snd-det');return {r,det:sp?sp.textContent:'',dur:abcNoise.during()};});
  ok('4 Incident starting: the seconds before it in detail (average, range, the eight bands)',!!box.r&&!!box.r.d&&isFinite(box.r.d.avg)&&box.r.d.lo<=box.r.d.hi&&Array.isArray(box.r.d.z)&&box.r.d.z.length===8&&box.r.d.zp.length===8,box.r);
  ok('5 Incident over: the incident\'s own sound, its pitch about 1,200 Hz, a high-pitched moment in it; both shown under the box',!!box.dur&&Math.abs(box.dur.f-1200)<=60&&box.dur.mo.some(m=>m.k==='hi')&&/^Before: average -?\d+, -?\d+ to -?\d+; most in the .+ band/.test(box.det)&&/During: average .*pitch about 1,200 Hz.*high-pitched \(about 1,200 Hz\)/.test(box.det),{det:box.det,dur:box.dur});
  await p.evaluate(()=>{const b=document.querySelector('#abc-grid input[id^="b-"]');b.click();});await p.click('#save-entry');await sleep(300);
  const en=await p.evaluate(()=>state.entries.map(e=>({noise:e.noise,noiseIn:e.noiseIn})));
  ok('6 the incident keeps both with it when it is saved',en.length===1&&!!en[0].noise&&!!en[0].noise.d&&!!en[0].noiseIn&&Math.abs(en[0].noiseIn.f-1200)<=60,en);
  await p.evaluate(()=>switchTab('incidents'));const tl=await p.evaluate(()=>document.getElementById('inc-table').textContent.replace(/\s+/g,' '));
  ok('7 the incident list shows the level before and the level during',/sound \d+ \(iPad scale\)during \d+ \(iPad scale\)/.test(tl),tl.slice(0,400));
  await p.evaluate(()=>switchTab('record'));
  /* a background check: its seconds in detail */
  await p.evaluate(()=>window.dispatchEvent(new CustomEvent('abc-record-window',{detail:{k:'t1',at:Date.now(),win:5}})));await sleep(200);
  const bgd=await p.evaluate(()=>{const i=document.getElementById('bg-noise');return {r:JSON.parse(i.getAttribute('data-snd')||'null'),det:i.closest('label').querySelector('.snd-det').textContent};});
  ok('8 a background check keeps its seconds in detail, shown under its box',!!bgd.r&&!!bgd.r.d&&bgd.r.d.z.length===8&&/^average .* band/.test(bgd.det),bgd);
  /* opened again with Edit, the incident's sound comes back; cleared, it goes */
  await p.evaluate(()=>loadIntoForm(state.entries[0]));const back=await p.evaluate(()=>document.getElementById('e-noise').closest('label').querySelector('.snd-det').textContent);
  await p.evaluate(()=>clearForm());const gone=await p.evaluate(()=>({t:document.getElementById('e-noise').closest('label').querySelector('.snd-det').textContent,d:abcNoise.during()}));
  ok('9 Edit brings the incident\'s sound back; clearing the form clears it',/^Before: .*During: .*1,200 Hz/.test(back)&&gone.t===''&&gone.d===null,{back,gone});
  await p.click('#sndBtn');await sleep(300);
  const run=await p.evaluate(()=>{const r=state.noise.runs[state.noise.runs.length-1];return {v:r.v.length,z:(r.z||[]).filter(Boolean).length,zp:(r.zp||[]).filter(Boolean).length,lo:(r.lo||[]).filter(x=>x!=null).length,mo:(r.mo||[]).map(m=>m.k),keys:Object.keys(r).sort().join()};});
  ok('10 the record keeps, every 10 seconds, the level, its range and the eight bands, and the loud moments: numbers only',run.z>=2&&run.z===run.zp&&run.lo>=run.z&&run.mo.slice(0,5).join()==='hi,vo,ru,hs,bg'&&run.keys==='agc,at,b0,hi,lo,mo,off,v,wtd,z,zp',run);
  const js=await p.evaluate(()=>JSON.stringify(state.noise));
  ok('11 no sound is kept (no long runs of samples in the record)',!/\[(-?\d+(\.\d+)?,){200,}/.test(js)&&js.length<20000,{len:js.length});
  await c1.close();

  /* ---- the analysis, on a simulated observation ---- */
  const c2=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const q=await c2.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(L.BASE+'/NBH-Workstation/'+ABC);await sleep(900);
  await q.evaluate(()=>{nbhUI.toast=()=>{};
    const t0=new Date(2026,9,19,9,0,0).getTime(),Z=(a)=>[a-4,a-2,a,a+1,a,a-3,a-8,a-12],bid=BEHAVIORS[0].id;
    /* 10 minutes of a room at -50 on the raw scale (50 on the iPad scale), with a high pitch at 9:03, a deep rumble at 9:05
       (loud only below 90 Hz) and an incident at 9:05 */
    abcNoise.feedZ(t0,t0+180000,-50,Z(-52),0);
    abcNoise.feedZ(t0+180000,t0+183000,-25,[-60,-55,-50,-40,-30,-24,-28,-40],1100);
    abcNoise.feedZ(t0+183000,t0+300000,-50,Z(-52),0);
    abcNoise.feedZ(t0+300000,t0+304000,-48,[-12,-30,-48,-55,-58,-60,-62,-66],0);
    abcNoise.feedZ(t0+304000,t0+600000,-50,Z(-52),0);abcNoise.end();abcNoise.flush();
    const D=(z)=>({avg:60,lo:52,hi:70,s:10,z,zp:z.map(x=>x+6),f:0,mo:[]}),N=z=>({v:60,cal:false,src:'mic',w:10,d:D(z)});
    const base=[46,48,50,51,50,47,42,38],loudHi=[46,48,50,52,55,63,50,40];
    const E=(t,z,inn)=>Object.assign({id:'sim'+t.replace(':',''),date:'2026-10-19',time:t,mode:'coded',behaviors:[bid],antecedents:[],consequences:[],precursors:[],settingEvents:[],resolution:[],activity:'Math',duration:2,noise:N(z)},inn?{noiseIn:{avg:82,lo:60,hi:96,s:120,z:[50,52,60,70,80,84,78,60],zp:[60,62,70,80,90,96,88,70],f:1150,mo:[{s:4,d:6.5,pk:96,b:5,f:1150,k:'hi'}],cal:false}}:{});
    const Sm=(t,z)=>({id:'sm'+t.replace(':',''),date:'2026-10-19',time:t,window:10,unit:'s',activity:'Math',antecedents:[],events:[],precursors:[],settingEvents:[],staffPresent:'',noise:N(z)});
    state.entries=[E('09:05',loudHi,true),E('09:20',loudHi),E('09:40',loudHi)];
    state.samples=['10:00','10:10','10:20','10:30','10:40'].map(t=>Sm(t,base));refreshAll();switchTab('analysis');});
  await sleep(500);
  const an=await q.evaluate(()=>{const c=[...document.querySelectorAll('#analysis-out .card')].find(x=>/The sound in detail/.test(x.textContent));if(!c)return null;
    return {t:c.innerText.replace(/\s+/g,' '),svg:c.querySelectorAll('svg rect').length,tables:[...c.querySelectorAll('table')].map(tb=>[...tb.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(x=>x.innerText.trim()).join(' | ')))};});
  ok('12 the observed time: its average, its range, the loudest band, the loud moments counted',!!an&&/\d+ average level over the 10 minutes observed/.test(an.t)&&/range: the quietest to the loudest tenth of a second/.test(an.t)&&/2 loud moments \(1 high-pitched, 1 deep, 0 hiss or static\)/.test(an.t),an&&an.t.slice(0,700));
  ok('13 a chart of the eight bands and a table of each band (what is usually heard there, its average, its loudest)',!!an&&an.svg===8&&an.tables[0].length===8&&/^63 Hz and below \| deep rumble: thunder/.test(an.tables[0][0])&&/^2 kHz \| high: the pitch of fear screams \(about 1,430 Hz\), shrieks and squeals; whistles \| -?\d+ \| -?\d+ \| 1$/.test(an.tables[0][5]),an&&an.tables[0]);
  ok('14 before incidents and at the checks, band by band: the 2 kHz band named, 16 dB louder before incidents',!!an&&an.tables[1].length===8&&/^2 kHz \| 63 \| 47 \| \+16 dB$/.test(an.tables[1][5])&&/The 2 kHz band was 16 dB louder before incidents than at the background checks/.test(an.t),an&&{rows:an.tables[1],t:an.t.slice(0,1200)});
  ok('15 each incident\'s sound, before and during (Incident starting to Incident over)',!!an&&an.tables[2].length===3&&/^2026-10-19 09:05 \| average 60, 52 to 70; most in the 2 kHz band \(63\) \| average 82, 60 to 96; most in the 2 kHz band \(84\); pitch about 1,150 Hz; 1 loud moment: high-pitched \(about 1,150 Hz\)$/.test(an.tables[2][0]),an&&an.tables[2]);
  ok('16 the loud moments: time, seconds, peak, band, what it was like, an incident near it',!!an&&an.tables[3].length===2&&/^9:03:00 \| 3 \| 75 \| 2 kHz \(76\) \| About 1,100 Hz: high-pitched: the pitch of a scream/.test(an.tables[3][0])&&/^9:05:00 \| 4 \| 52 \| 63 Hz and below \(88\) \| deep, with no clear pitch: a rumble or thud, like thunder.* \| during an incident \(09:05\)$/.test(an.tables[3][1]),an&&an.tables[3]);
  ok('17 the cautions: the meter hears pitch, not sources; the pitch ranges from published research; the bands are not A-weighted',!!an&&/hears pitch and loudness, not what made a sound/.test(an.t)&&['Hillenbrand, Getty, Clark, & Wheeler, 1995','Lee, Potamianos, & Narayanan, 1999','Pisanski, Raine, & Reby, 2020','Engelberg, Schwartz, & Gouzoules, 2021','Arnal, Flinker, Kleinschmidt, Giraud, & Poeppel, 2015','Jongman, Wayland, & Wong, 2000','International Organization for Standardization, 2003','Leventhall, 2004'].every(c=>an.t.includes(c))&&/not A-weighted/.test(an.t),an&&an.t.slice(-1400));
  const refs=await q.evaluate(()=>{const c=[...document.querySelectorAll('#analysis-out .card, .card')].find(x=>/^\s*References/.test(x.querySelector('h2')?x.querySelector('h2').textContent:''));return c?c.innerText:'';});
  const refsSorted=await q.evaluate(()=>{const c=[...document.querySelectorAll('.card')].find(x=>/^\s*References/.test(x.querySelector('h2')?x.querySelector('h2').textContent:''));const a=[...c.querySelectorAll('li')].map(l=>l.textContent.trim().toLowerCase());return a.every((x,i)=>!i||a[i-1].localeCompare(x)<=0);});
  ok('18 every source is in the References, in its place',/Arnal, L\. H\., Flinker, A\., Kleinschmidt, A\., Giraud, A\.-L\., & Poeppel, D\. \(2015\)\. Human screams occupy a privileged niche/.test(refs)&&/Pisanski, K\., Raine, J\., & Reby, D\. \(2020\)\. Individual differences in human voice pitch/.test(refs)
    &&['Engelberg, J. W. M., Schwartz, J. W., & Gouzoules, H. (2021)','Hillenbrand, J., Getty, L. A., Clark, M. J., & Wheeler, K. (1995)','International Organization for Standardization. (2003)','Jongman, A., Wayland, R., & Wong, S. (2000)','Lee, S., Potamianos, A., & Narayanan, S. (1999)','Leventhall, H. G. (2004)'].every(c=>refs.includes(c))&&refsSorted,{head:refs.slice(0,200),refsSorted});
  /* a record from before v23.70 (levels only): no new card, the comparison card as before */
  await q.evaluate(()=>{state.noise={runs:[{at:'2026-10-19T13:00:00.000Z',b0:1,off:null,agc:false,wtd:true,v:[-50,-49]}]};state.entries.forEach(e=>{delete e.noise.d;delete e.noiseIn;});state.samples.forEach(s=>delete s.noise.d);refreshAll();switchTab('analysis');});await sleep(400);
  const old=await q.evaluate(()=>({detail:/The sound in detail/.test(document.getElementById('analysis-out').textContent),cmp:/Sound level before incidents and at the background checks/.test(document.getElementById('analysis-out').textContent)}));
  ok('19 a record kept before this release shows no new card, and the comparison as before',!old.detail&&old.cmp,old);
  ok('20 no page errors',!errs.length,errs.slice(0,4));
  await c2.close();
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
