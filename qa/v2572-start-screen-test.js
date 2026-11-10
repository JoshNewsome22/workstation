/* v25.72 the start screen (the BCBA's approved before-and-after mock-up, 11/10: "build it"). With no student open and five
   simulated students kept on this device, at 1180x820 (an iPad sideways), 820x1180 (upright) and 390x844 (a phone):
   L1 the students come first: the first card starts within the first screen and the five are whole in view (the review
      measured none before; the mock-up five);
   L2 the bars above the content are slim (the mock-up: 111 px on an iPad, where they were 164 and 200; a phone 54);
   L3 the start screen is short: its length in screens;
   D1 What's due: To look at before Coming up, To look at shows its first five rows with Show all, Coming up its first two;
      Show all opens a group in place and Show fewer folds it; the counts at the top in the same order;
   N1 the next 90 days are folded to one row (the chips, the busiest week, Show timeline); Show timeline opens the chart in
      place and Hide timeline folds it; the choice is kept after a reload;
   K1 Key findings is not shown when nothing stands out, and is shown when a student is trending the wrong way;
   B1 one filled button: Build packet is an outline button (as Save case) with no case; Open on the last-saved row is filled;
   S1 New student shows the student strip with the Name box focused; a student typed there opens a form and Save case keeps
      them, as before;
   I1 Initials only by the heading is Caseload's own setting: changing either changes both, and every name on the start
      screen follows (the cards, the last-saved row, What's due, the timeline);
   F1 Detailed cards brings the full cards back in the same place, and is remembered after a reload;
   O1 Open on a compact card opens that student's case (the existing click on data-clopen);
   T1 thirty students: the cards are drawn quickly, twelve on the screen with the rest in Caseload, none overlapping;
   A1 no text under 12 px and no control under 44 px on the start screen; nothing scrolls sideways at 320 px or at 200%
      text (590x410); the high contrast view keeps the dark text;
   R1 a first run, with no student kept, still shows the three steps, the student strip and the forms list;
   E1 no page errors.
   Simulated students only (invented names). usage: WS_URL=http://127.0.0.1:8155 node qa/v2572-start-screen-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const OUT=path.join(__dirname,'out/v2572-start-screen/');fs.mkdirSync(OUT,{recursive:true});
const IPAD=L.IPAD_UA,PHONE=L.IPAD_UA.replace('iPad','iPhone');
const NAMES=[['Mateo Rivera','4471823','4'],['Priya Nandakumar','5530917','2'],['Devon Achterberg','6620458','5'],['Amara Okonkwo','7719032','1'],['Lucas Ferreira','8842561','3']];
const MORE=['Nora Lindqvist','Elias Castellanos','Sofia Brennan','Kai Moreau','Ruby Tanaka','Omar Haddad','Lena Petrov','Theo Quinlan','Maya Adeyemi','Ivan Novak','Zara Sorensen','Hugo Delgado','Iris Whitfield','Felix Kowalski','Leah Abernathy','Arlo Fontaine','Nina Marchetti','Owen Oyelaran','Tess Vasquez','Remy Holloway','Cleo Nakamura','Jude Ellison','Vera Szabo','Abel Okafor','Ines Brandt'];
/* the students kept here: each with things to look at, a date coming up, a trend, and dates in the next 90 days */
const KEEP=(p,n,o)=>p.evaluate(async([n,NAMES,MORE,o])=>{o=o||{};
  const old=await clTx('readonly',st=>st.getAll());for(const r of old||[])await clTx('readwrite',st=>st.delete(r.key));
  const t0=tdISO(new Date()),md=iso=>{const d=new Date(iso+'T12:00:00');return (d.getMonth()+1)+'/'+d.getDate();};
  const pts=(a,b)=>{const P=[];for(let i=0;i<12;i++){const d=new Date();d.setDate(d.getDate()-14+i);P.push([tdISO(d),Math.round((a+(b-a)*i/11)*10)/10]);}return P;};
  for(let i=0;i<n;i++){const [name,sid,grade]=i<5?NAMES[i]:[MORE[(i-5)%MORE.length]+(i>=30?' '+i:''),String(5100000+i*733),String(1+i%5)];
    const up=tdAdd(t0,20+i*3),rev=tdAdd(t0,40+i*2),saved=new Date(Date.now()-(i+1)*3600e3).toISOString();
    const bad=o.wrong&&i===0;
    const items=[{k:'Integrity',t:'No integrity check on Form TI-1 in the case yet',open:'TI-1'},{k:'Aim',t:'Mand for break has been at its aim 7 days in a row: plan the next step',open:'GB-1'},
      {k:'Due',t:'PR-1 Plan review due '+md(up)+' (in '+(20+i*3)+' days)',open:'PR-1'}];
    const tr={name:'Physical aggression',unit:'occurrences',up:false,pts:bad?pts(1,9):pts(9,1)};
    const facts={review:{next:rev},records:{iep:tdAdd(t0,60+i)}};
    await clTx('readwrite',st=>st.put({key:clScope()+'|'+sid+'|'+name.toLowerCase(),scope:clScope(),client:name,sid,site:'Royal Palm School',grade,bcba:'J. Ellis, BCBA',saved,
      sum:{items,lastData:t0,forms:4,trend:tr,trends:[tr]},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:{client:name,sid,grade,site:'Royal Palm School'},forms:{},facts})}));}
  const a=performance.now();await paintBlank();return Math.round(performance.now()-a);},[n,NAMES,MORE,o]);
/* the measures of the start screen (as the review and the mock-up took them) */
const MET=p=>p.evaluate(()=>{const b=document.getElementById('blank');let sc=b;while(sc&&sc!==document.body&&!(sc.scrollHeight>sc.clientHeight+20&&/(auto|scroll)/.test(getComputedStyle(sc).overflowY)))sc=sc.parentElement;if(!sc||sc===document.body)sc=document.scrollingElement;sc.scrollTop=0;
  const cards=[...document.querySelectorAll('#blankCl .cl-mini,#blankCl .cl-card')].filter(c=>c.getBoundingClientRect().height>0);
  let bottom=innerHeight;document.querySelectorAll('body *').forEach(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();if((s.position==='fixed'||e.classList.contains('phbar'))&&r.height>0&&r.bottom>=innerHeight-1&&r.top>innerHeight*0.7&&r.width>innerWidth*0.8)bottom=Math.min(bottom,r.top);});
  return {vh:innerHeight,bottom:Math.round(bottom),contentTop:Math.round(b.getBoundingClientRect().top),firstCardTop:cards[0]?Math.round(cards[0].getBoundingClientRect().top):null,
    whole:cards.filter(c=>{const r=c.getBoundingClientRect();return r.top>=0&&r.bottom<=bottom;}).length,screens:+(sc.scrollHeight/sc.clientHeight).toFixed(2),cardH:cards[0]?Math.round(cards[0].getBoundingClientRect().height):0};});
/* small text and small controls anywhere on the start screen and the row over it (each counted once) */
const SMALL=p=>p.evaluate(()=>{const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&!(s.clip&&s.clip!=='auto'&&r.width<=1);};
  const small=[...document.querySelectorAll('#blank *, .bar *, .crumb *, header.top *')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&vis(e)&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.textContent.trim().slice(0,24)+':'+getComputedStyle(e).fontSize);
  const tiny=[...document.querySelectorAll('#blank button,#blank a[href],#blank summary,#blank label,#blank input,.bar button,.bar input,.crumb button,.crumb input,header.top button')].filter(e=>vis(e)&&e.type!=='checkbox'&&e.getBoundingClientRect().height<44).map(e=>(e.textContent.trim()||e.id||e.placeholder||'').slice(0,24)+':'+Math.round(e.getBoundingClientRect().height));
  return {small,tiny};});
const hscroll=p=>p.evaluate(()=>{const s=[document.scrollingElement,document.getElementById('blank')].filter(Boolean);return s.some(e=>e.scrollWidth>e.clientWidth+1);});
async function ctxFor(br,w,h,pre){const c=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<600,userAgent:w<600?PHONE:IPAD,serviceWorkers:'block',acceptDownloads:true});
  await c.addInitScript(pre=>{try{if(window.top===window&&!sessionStorage.getItem('t2572')){sessionStorage.setItem('t2572','1');localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.installTip','dismissed');
    Object.entries(pre||{}).forEach(([k,v])=>localStorage.setItem(k,v));}}catch(e){}window.print=function(){};},pre||{});return c;}
const errs=[];
const tap=async(p,sel)=>{try{await p.click(sel,{timeout:4000});return true;}catch(e){return false;}};
async function pageIn(c,tag){const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2600);return p;}
const quiet=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});if(document.activeElement)document.activeElement.blur();});
(async()=>{const br=await L.chromium.launch();
  try{
  /* ---------------- the three sizes, five students ---------------- */
  const LIM={ipadL:{top:120,screens:2.6},ipadP:{top:120,screens:2.4},phone:{top:60,screens:2.4}};
  for(const [nm,w,h] of [['ipadL',1180,820],['ipadP',820,1180],['phone',390,844]]){
    const c=await ctxFor(br,w,h);const p=await pageIn(c,nm);await KEEP(p,5);await sleep(1800);await quiet(p);await sleep(400);
    const m=await MET(p);
    ok('L1 '+nm+': the first student card starts within the first screen and five cards are whole in view',m.firstCardTop!=null&&m.firstCardTop<m.bottom&&m.whole>=5,m);
    ok('L2 '+nm+': the bars above the start screen are at most '+LIM[nm].top+' px',m.contentTop<=LIM[nm].top,{contentTop:m.contentTop});
    ok('L3 '+nm+': the start screen is at most '+LIM[nm].screens+' screens long',m.screens<=LIM[nm].screens,{screens:m.screens});
    if(nm!=='phone')ok('L4 '+nm+': a compact card is 130 to 150 px tall',m.cardH>=120&&m.cardH<=155,{cardH:m.cardH});
    if(nm==='ipadL'){const cols=await p.evaluate(()=>new Set([...document.querySelectorAll('#blankCl .cl-mini')].map(c=>Math.round(c.getBoundingClientRect().top))).size);ok('L5 ipadL: three across (two rows for five)',cols===2,{rows:cols});}
    if(nm==='ipadP'){const cols=await p.evaluate(()=>new Set([...document.querySelectorAll('#blankCl .cl-mini')].map(c=>Math.round(c.getBoundingClientRect().top))).size);ok('L5 ipadP: two across (three rows for five)',cols===3,{rows:cols});}
    if(nm==='phone'){const r=await p.evaluate(()=>{const c=document.querySelector('#blankCl .cl-mini');if(!c)return null;const s=c.querySelector('.cm-sub');return {sub:s&&s.innerText,spark:!!c.querySelector('svg.cl-spark')&&c.querySelector('svg.cl-spark').getBoundingClientRect().width>0,h:Math.round(c.getBoundingClientRect().height),open:!!c.querySelector('.cm-open')};});
      ok('L5 phone: a row a student: the name, "Grade N · due <date>", the sparkline and Open',!!r&&/^Grade \d · due \w{3} \d+\/\d+/.test(r.sub)&&r.spark&&r.open&&r.h<=72,r);}
    const s=await SMALL(p);ok('A1 '+nm+': no text under 12 px on the start screen',!s.small.length,s.small.slice(0,12));
    ok('A2 '+nm+': no control under 44 px high on the start screen',!s.tiny.length,s.tiny.slice(0,12));
    ok('A3 '+nm+': nothing scrolls sideways',!(await hscroll(p)));
    await p.screenshot({path:OUT+nm+'.png'});
    if(nm==='phone'){
      /* the open chart on a phone: no tick label sits on another */
      await p.evaluate(()=>{const b=document.querySelector('#blankCl .n90-tl');if(b)b.click();});await sleep(900);
      const ov=await p.evaluate(()=>{const t=[...document.querySelectorAll('#blankCl .w1-tk')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);let o=0;for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++)if(t[i].left<t[j].right&&t[j].left<t[i].right)o++;return {n:t.length,o};});
      ok('A4 phone: the timeline open, its labels (Today, the months, the last date) do not overlap',ov.n>=2&&ov.o===0,ov);
      const s2=await SMALL(p);ok('A1 phone, the timeline open: no text under 12 px (the dots\' initials too)',!s2.small.length,s2.small.slice(0,8));
      await p.evaluate(()=>{localStorage.removeItem('nbh.ws.n90');});
      /* 320 px wide */
      await p.setViewportSize({width:320,height:640});await sleep(900);ok('A3 phone at 320 px: nothing scrolls sideways',!(await hscroll(p)));}
    await c.close();}
  /* ---------------- the iPad sideways: the parts, one by one ---------------- */
  const c=await ctxFor(br,1180,820);const p=await pageIn(c,'ipad');await KEEP(p,5);await sleep(1800);await quiet(p);
  /* What's due */
  const due=()=>p.evaluate(()=>{const b=document.querySelector('#blankCl .due-board');if(!b)return null;const g=[...b.querySelectorAll('.due-grp')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
    const rows=c=>[...b.querySelectorAll(':scope > .due-rows > .due-row.'+c)].length;const btn=c=>{const x=b.querySelector('[data-dueall="'+c+'"]');return x?x.textContent:'';};
    return {g,look:rows('look'),up:rows('up'),lookBtn:btn('look'),upBtn:btn('up'),sum:b.querySelector('.due-sum').textContent.replace(/\s+/g,' ')};});
  const d0=await due();const iL=d0?d0.g.findIndex(x=>/^To look at/.test(x)):-1,iU=d0?d0.g.findIndex(x=>/^Coming up/.test(x)):-1;
  ok('D1 What\'s due: To look at before Coming up; five rows of To look at with Show all, two of Coming up with Show all',!!d0&&iL>=0&&iU>iL&&d0.look===5&&/^Show all 10$/.test(d0.lookBtn)&&d0.up===2&&/^Show all 5$/.test(d0.upBtn),d0);
  ok('D2 the counts at the top in the same order: to look at, then coming up',!!d0&&/10 to look at · 5 coming up/.test(d0.sum),d0&&d0.sum);
  await tap(p,'#blankCl [data-dueall="look"]');await sleep(700);const d1=await due();
  await tap(p,'#blankCl [data-dueall="look"]');await sleep(700);const d2=await due();
  ok('D3 Show all opens To look at in place (all ten) and Show fewer folds it back to five',!!d1&&d1.look===10&&d1.lookBtn==='Show fewer'&&!!d2&&d2.look===5&&d2.up===2,{d1,d2});
  /* the next 90 days */
  const n90=()=>p.evaluate(()=>{const w=document.querySelector('#blankCl .w1-n90w');if(!w)return null;const ch=w.querySelector('[data-w1n90]'),b=w.querySelector('.n90-tl'),wk=w.querySelector('.n90-wk');
    return {h:Math.round(w.getBoundingClientRect().height),chart:ch?Math.round(ch.getBoundingClientRect().height):-1,dots:w.querySelectorAll('.w1-dot').length,btn:b?b.textContent:'',exp:b?b.getAttribute('aria-expanded'):'',wk:wk&&wk.offsetParent?wk.textContent:'',chips:w.querySelectorAll('.w1-chips button').length};});
  const n0=await n90();ok('N1 the next 90 days in one row: the chips, the busiest week, Show timeline; the chart folded',!!n0&&n0.chart===0&&n0.h<=70&&n0.btn==='Show timeline'&&n0.exp==='false'&&/^Week of \d+\/\d+: \d+ due$/.test(n0.wk)&&n0.chips>=1,n0);
  if(n0&&n0.btn){await tap(p,'#blankCl .n90-tl');await sleep(900);}const n1=await n90();
  ok('N2 Show timeline opens the chart in place, with its dates; the button says Hide timeline',!!n1&&n1.chart>60&&n1.dots>=5&&n1.btn==='Hide timeline'&&n1.exp==='true',n1);
  await p.reload();await sleep(2800);await quiet(p);const n2=await n90();ok('N3 the open timeline is kept after a reload (a device setting)',!!n2&&n2.chart>60,n2);
  if(n2&&n2.btn){await tap(p,'#blankCl .n90-tl');await sleep(700);}const n3=await n90();ok('N4 Hide timeline folds it again',!!n3&&n3.chart===0&&n3.btn==='Show timeline',n3);
  /* Key findings */
  const kf0=await p.evaluate(()=>!!document.querySelector('#blankCl .w1-kf'));ok('K1 no Key findings block when nothing stands out',!kf0);
  await KEEP(p,5,{wrong:true});await sleep(1500);const kf1=await p.evaluate(()=>{const k=document.querySelector('#blankCl .w1-kf');return k?k.innerText.replace(/\s+/g,' ').slice(0,160):'';});
  ok('K2 Key findings shows when a student is trending the wrong way',/Key findings/.test(kf1)&&/trending the wrong way/.test(kf1),kf1);
  await KEEP(p,5);await sleep(1500);await quiet(p);
  /* one filled button */
  const fill=await p.evaluate(()=>{const bg=e=>e?getComputedStyle(e).backgroundColor:'none';const tr=c=>/rgba\(0, 0, 0, 0\)|transparent/.test(c);
    const mp=document.getElementById('masterPrint'),sv=document.getElementById('saveCase'),op=document.querySelector('#blankDrv .bl-last button[data-clopen]');
    const filled=[...document.querySelectorAll('#blank button,.crumb button,#wsNav button')].filter(b=>b.offsetParent&&!tr(bg(b))&&getComputedStyle(b).backgroundColor!==getComputedStyle(b.parentElement).backgroundColor&&/rgb\((\d+), (\d+), (\d+)\)/.test(bg(b))&&(+/rgb\((\d+)/.exec(bg(b))[1])<90).map(b=>b.textContent.trim().slice(0,20));
    return {mp:bg(mp),sv:bg(sv),open:bg(op),filled};});
  ok('B1 no case: Build packet is an outline button, as Save case is',fill.mp===fill.sv,fill);
  ok('B2 the filled button on the start screen is Open on the last-saved row, and it is the only one',!/rgba\(0, 0, 0, 0\)|rgb\(255, 255, 255\)/.test(fill.open)&&fill.filled.length===1&&fill.filled[0]==='Open',fill);
  /* Open on a compact card */
  const o1=await p.evaluate(async()=>{const was=caseloadGo;let got=null;caseloadGo=async(k,f)=>{got=[k,f];};const b=document.querySelector('#blankCl .cl-mini .cm-open[data-clopen]');if(b)b.click();await new Promise(r=>setTimeout(r,100));caseloadGo=was;return {got,key:b&&b.dataset.clopen};});
  ok('O1 Open on a compact card opens that student\'s case (the existing click on data-clopen)',!!o1.got&&o1.got[0]===o1.key&&o1.got[1]==='',o1);
  /* Initials only: the same setting as Caseload's */
  const names=()=>p.evaluate(()=>{const t=[...document.querySelectorAll('#blankCl .cm-nm,#blankCl .cl-nm,#blankDrv .bl-last b,#blankCl .due-who,#blankCl .w1-dot')].map(e=>e.getAttribute('aria-label')||e.textContent).join(' | ');return t;});
  const full=/Mateo|Rivera|Priya|Nandakumar|Devon|Achterberg|Amara|Okonkwo|Lucas|Ferreira/;
  await tap(p,'#blankCl .n90-tl');await sleep(800);   /* the timeline's dots too */
  ok('I0 before: the names are in full',full.test(await names()));
  await tap(p,'#blIniSw');await sleep(1200);const ls1=await p.evaluate(()=>localStorage.getItem('nbh.caseload.ini'));const nm1=await names();
  ok('I1 Initials only by the heading sets Caseload\'s own setting, and every name on the start screen follows',ls1==='1'&&!full.test(nm1)&&/M\. R\./.test(nm1),{ls1,nm1:nm1.slice(0,300)});
  await p.evaluate(()=>caseloadOpen());await sleep(1500);const dlg=await p.evaluate(()=>{const c=document.getElementById('clIni');return c?c.checked:null;});
  ok('I2 the Caseload dialog shows Initials only on',dlg===true,dlg);
  await p.evaluate(()=>{const c=document.getElementById('clIni');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(1500);await quiet(p);await sleep(1200);
  const sw=await p.evaluate(()=>{const c=document.getElementById('blIniSw');return c?c.checked:null;});const nm2=await names();
  ok('I3 turned off in Caseload: the switch by the heading is off and the names are in full again',sw===false&&full.test(nm2),{sw,nm2:nm2.slice(0,200)});
  await tap(p,'#blankCl .n90-tl');await sleep(500);
  /* Detailed cards */
  await tap(p,'#blFullSw');await sleep(1200);const f1=await p.evaluate(()=>({full:document.querySelectorAll('#blankCl .cl-cards .cl-card').length,mini:document.querySelectorAll('#blankCl .cl-mini').length,ls:localStorage.getItem('nbh.ws.cards'),
    first:(()=>{const a=document.querySelector('#blankCl .bl-cards'),b=document.querySelector('#blankCl .due-board');return !!a&&!!b&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);})()}));
  ok('F1 Detailed cards brings the full cards back in the same place (above What\'s due)',f1.full===5&&f1.mini===0&&f1.ls==='full'&&f1.first,f1);
  await p.reload();await sleep(2800);const f2=await p.evaluate(()=>({full:document.querySelectorAll('#blankCl .cl-cards .cl-card').length,on:(document.getElementById('blFullSw')||{}).checked}));
  ok('F2 Detailed cards is remembered after a reload',f2.full===5&&f2.on===true,f2);
  await tap(p,'#blFullSw');await sleep(1200);ok('F3 off again: the compact cards',await p.evaluate(()=>document.querySelectorAll('#blankCl .cl-mini').length===5));
  /* thirty students */
  const ms=await KEEP(p,30);await sleep(1500);await quiet(p);
  const t30=await p.evaluate(()=>{const R=[...document.querySelectorAll('#blankCl .cl-mini')].map(c=>c.getBoundingClientRect());let o=0;for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)o++;}
    const clip=[...document.querySelectorAll('#blankCl .cl-mini .cm-nm')].filter(e=>e.scrollWidth>e.clientWidth+1).length;const more=(document.querySelector('#blankCl .cl-minis+.hint')||{}).textContent||'';return {n:R.length,o,clip,more};});
  ok('T1 thirty students: the start screen is drawn in under 3 s',ms<3000,{ms});
  ok('T2 thirty students: twelve compact cards, none overlapping, every name whole, the rest in Caseload',t30.n===12&&t30.o===0&&t30.clip===0&&/and 18 more in Caseload/.test(t30.more),t30);
  await p.screenshot({path:OUT+'ipad-30.png'});
  /* New student: the strip, the Name box, a form, Save case */
  await KEEP(p,5);await sleep(1500);await quiet(p);
  const bar0=await p.evaluate(()=>({bar:getComputedStyle(document.getElementById('bar')).display,top:!!document.getElementById('blTopNew')&&!!document.getElementById('blTopNew').offsetParent,find:!!document.querySelector('.crumb #blFindIn')}));
  ok('S0 the bare start screen: no student strip; New student and the caseload search in the row over it',bar0.bar==='none'&&bar0.top&&bar0.find,bar0);
  await tap(p,'#blTopNew');await sleep(700);
  const bar1=await p.evaluate(()=>({bar:getComputedStyle(document.getElementById('bar')).display,focus:document.activeElement&&document.activeElement.id}));
  ok('S1 New student shows the student strip with the Name box focused',bar1.bar!=='none'&&bar1.focus==='pClient',bar1);
  await p.keyboard.type('Nora Lindqvist');await p.fill('#pSid','6123457');await sleep(300);
  await p.evaluate(()=>openForm('DM-1'));await p.waitForFunction(()=>!!state.status['DM-1']&&!state.pending['DM-1'],null,{timeout:60000}).catch(()=>{});await sleep(1800);
  const dl=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>document.getElementById('saveCase').click());const d=await dl;await sleep(2500);
  const kept=await p.evaluate(async()=>{['#dlg','#cfDlg'].forEach(s=>{const g=document.querySelector(s);if(g&&g.open)g.close();});return ((await clList())||[]).some(r=>r.sid==='6123457'&&r.client==='Nora Lindqvist');});
  ok('S2 a student typed there opens a form and Save case keeps them, as before',!!d&&kept,{file:d&&d.suggestedFilename(),kept});
  await c.close();
  /* ---------------- 200% text, high contrast, a first run ---------------- */
  {const c2=await ctxFor(br,590,410);const q=await pageIn(c2,'zoom');await KEEP(q,5);await sleep(1500);await quiet(q);
    const z=await q.evaluate(()=>{const s=document.getElementById('blIniSw'),r=s&&s.getBoundingClientRect();return {sw:!!r&&r.width>0,open:!!document.querySelector('#blankCl .cm-open')&&document.querySelector('#blankCl .cm-open').getBoundingClientRect().width>0};});
    ok('A5 text at 200% (590x410): nothing scrolls sideways; the switches and Open are there',!(await hscroll(q))&&z.sw&&z.open,z);await c2.close();}
  {const c3=await ctxFor(br,1180,820,{'nbh.view':'{"t":0,"hc":true}'});const q=await pageIn(c3,'hc');await KEEP(q,5);await sleep(1500);await quiet(q);
    const hc=await q.evaluate(()=>({hc:document.documentElement.classList.contains('nbh-hc'),nm:getComputedStyle(document.querySelector('#blankCl .cm-nm')).color,sub:getComputedStyle(document.querySelector('#blankCl .cm-sub')).color,cards:document.querySelectorAll('#blankCl .cl-mini').length}));
    const lum=c=>{const m=/(\d+), (\d+), (\d+)/.exec(c);return m?(+m[1]+ +m[2]+ +m[3])/3:255;};
    ok('A6 the high contrast view: the cards drawn, their words dark',hc.hc&&hc.cards===5&&lum(hc.nm)<70&&lum(hc.sub)<70,hc);await q.screenshot({path:OUT+'ipad-hc.png'});await c3.close();}
  {const c4=await ctxFor(br,1180,820);const q=await pageIn(c4,'first');await KEEP(q,0);await sleep(1500);
    const fr=await q.evaluate(()=>({steps:!!document.querySelector('#blank .steps')&&document.querySelector('#blank .steps').getBoundingClientRect().height>0,bar:getComputedStyle(document.getElementById('bar')).display,
      rail:document.getElementById('railNav').getBoundingClientRect().width>0&&document.body.classList.contains('rail-open'),top:!!document.getElementById('blTopNew')&&!!document.getElementById('blTopNew').offsetParent}));
    ok('R1 a first run (no student kept): the three steps, the student strip and the forms list, as before',fr.steps&&fr.bar!=='none'&&fr.rail&&!fr.top,fr);await c4.close();}
  ok('E1 no page errors',!errs.length,errs.slice(0,5));
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
