/* v25.68 wave 1, the shell (the BCBA, 11/6): her three decisions, the approved case-home mockup items (screens 4 and 8) and
   the shell's motion (the approved motion demo). The BCBA's 13-inch iPad (1376 x 1032 sideways, 1032 x 1376 upright, touch,
   Safari's user agent), a laptop with a mouse (1440 x 900) and an iPhone (390 x 844). Simulated data only: "Sample Student"
   with the forms' own simulations (DM-1, DD-1, TI-1), "Sample Student C" (the same case with its main target behavior not
   improving: the current phase's values raised, three school days without data, one day absent) and "Sample Student B"
   (consent on file, an IEP date, three days of data).
   D1 the Documents list: a form's own print dialog adds no line; what the workstation makes itself does (its print window,
      Finish PDF); each line has Remove (44 px, named); the first Remove asks once, says only the line goes and no file; a
      Cancel keeps it; later removals do not ask; the case file holds what is left
   D2 the iPad sideways: opening a form puts the list away (as before); the list opened by hand while working stays beside
      the form (no scrim, the form narrower) through opening another form, until it is closed; then H2 again
   D3 where the case files live: with no Google key and Drive off, Open case does not ask (the file chooser); with Drive
      possible it asks once (Files or Google Drive, Cancel), remembers, and uses it (Files: the chooser; Drive off: Use
      Google Drive or a file; Drive on: the students in Drive); Caseload settings shows it and changes it; with Files chosen,
      Save case writes the file even with Drive on
   4  Key findings on Caseload: at most a few sentences, the wrong-way trend (as on the cards) with "See what may be
      holding … back", reviews in 30 days on thin data with "Open DD-1 for …"; the link opens the case home at the panel
   5  the next 90 days: one dot per date the forms hold (calEvents), by type, 44 px, named for VoiceOver; type chips hide and
      show; a dot opens that student's form; nothing outside 90 days, no type the brief does not list
   6  what may be holding progress back: on the case home under the graph, only when the main target is not improving by
      PR-1's rule; each line names its form and opens it; integrity, missing data, plan changes, setting events, absences,
      agreement; checks and to-checks for VoiceOver; not a verdict; nothing in the case file or the facts
   7  previews: a mouse hover (and the Apple Pencil's hover) shows what will open; moving away and Escape close it; a click
      does what it says with no preview; on touch a press and hold shows it and does not open; a plain tap opens with no
      preview; the 90-day dots, the graph's points and the list's forms preview too
   8  motion: menus grow from their button, the case home arrives in reading order, the save tick, the loading outline;
      every movement 0.25 s or less, ended by a tap; none with Reduce Motion (the outline still shows); graphs and numbers
      never animate
   P  print shows none of it; the phone's case home holds the panel in one column; no page errors
   usage: WS_URL=http://127.0.0.1:8641 WS_ROOT=<worktree> node qa/v2568-shell-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,passes=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(c)passes++;else fails++;};
const IPAD=L.IPAD_UA,IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const OUT=__dirname+'/out/v2568-shell/';
const F=L.forms(),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const errs=[];
/* every animation the page starts, with its timing (the motion checks) */
const ANIM=()=>{const a0=Element.prototype.animate;Element.prototype.animate=function(kf,o){const a=a0.apply(this,arguments);try{(window.__an=window.__an||[]).push({el:this,o:typeof o==='number'?{duration:o}:Object.assign({},o||{}),a,t:performance.now()});}catch(e){}return a;};};
async function ctxFor(br,w,h,o){o=o||{};const touch=o.touch!==false;const c=await br.newContext(Object.assign({viewport:{width:w,height:h},serviceWorkers:'block',deviceScaleFactor:1},touch?{hasTouch:true,isMobile:true,userAgent:w<500?IPHONE:IPAD}:{},o.rm?{reducedMotion:'reduce'}:{}));
  await c.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2568s')){sessionStorage.setItem('v2568s','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    ['nbh.ws.pinbars','nbh.focus','nbh.ws.full','nbh.ws.rail','nbh.ws.navmode','nbh.railoff','nbh.ws.n90off'].forEach(k=>localStorage.removeItem(k));}}catch(e){}window.print=function(){window.__printed=(window.__printed||0)+1;};});
  await c.addInitScript(ANIM);return c;}
async function start(c,tag){const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);await shut(p);await stubs(p);return p;}
/* the questions answered as a test asks (window.__pick), each one kept (window.__asked) */
const stubs=p=>p.evaluate(()=>{window.__asked=[];window.__pick='';window.__ok=true;wsUI.confirm=async t=>{window.__asked.push(String(t));return window.__ok;};
  wsUI.choose=async(t,b)=>{window.__asked.push(String(t));window.__btns=(b||[]).map(x=>x.label);return window.__pick;};wsUI.alert=async()=>{};
  try{kvDel('nbh.ws.where@nbh');kvDel('nbh.ws.docsRemoveAsked');kvDel('nbh.google.client');}catch(e){}}).catch(()=>{});
const shut=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});try{__wsA.shut();__wsNav.shut();}catch(e){}}).catch(()=>{});
const noToasts=p=>p.evaluate(()=>{document.querySelectorAll('#wsToasts > *').forEach(t=>t.remove());}).catch(()=>{});
const frameOf=(p,id)=>p.frames().find(f=>decodeURIComponent(f.url()).includes(FILE[id]));
async function waitForm(p,id,ms){for(let i=0;i<(ms||40000)/250;i++){if(await p.evaluate(id=>state.cur===id&&!!state.status[id]&&!state.pending[id],id))return true;await sleep(250);}return false;}
async function waitHome(p,ms){for(let i=0;i<(ms||20000)/250;i++){if(await p.evaluate(()=>document.body.classList.contains('ws-home')&&!!document.querySelector('#caseHome .ch-grid')))return true;await sleep(250);}return false;}
async function openSim(p,id){await p.evaluate(i=>openForm(i),id);await waitForm(p,id,60000);await sleep(900);const fr=frameOf(p,id);if(!fr)return null;
  await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;window.alert=()=>{};}).catch(()=>{});await L.loadSim(fr);await sleep(700);
  await fr.evaluate(()=>{const d=[...document.querySelectorAll('dialog')].find(x=>x.open);if(!d)return;const bs=[...d.querySelectorAll('button')].filter(b=>b.offsetParent);const b=bs.find(b=>/^(load|yes|replace|continue|ok)/i.test(b.textContent.trim()))||bs[bs.length-1];if(b)b.click();}).catch(()=>{});
  await sleep(2200);return fr;}
/* the simulated caseload: Sample Student from the forms' simulations; C and B made from it in the page (each kept on the iPad) */
async function buildCase(p){
  await p.evaluate(async()=>{const L0=await clList();for(const r of L0||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('pClient','Sample Student');set('pSid','000000');set('pGrade','5');set('pSite','Sample Elementary');set('pBcba','Sample BCBA');});
  for(const id of ['DM-1','DD-1','TI-1'])await openSim(p,id);
  return p.evaluate(async()=>{await gatherFacts(true);await new Promise(r=>setTimeout(r,800));const kept=await caseKeepOnly();const key=clKey(packet());
    const A=(await clList()).find(r=>r.key===key);const iso=d=>tdISO(d),dd=n=>{const t=new Date();t.setDate(t.getDate()+n);return iso(t);};
    /* C: the same case, its main target behavior higher in the current phase than in baseline */
    const cC=parseCase(A.text);cC.packet=Object.assign({},cC.packet,{client:'Sample Student C',sid:'000003'});const f=cC.facts,d=f.data,mm=__wsCH.ddMain(f),B0=mm.main,nm=B0.name;
    const days=(d.series||[]).map(x=>x.date),sch=(()=>{const o=[],t=new Date();t.setHours(12,0,0,0);while(o.length<10){t.setDate(t.getDate()-1);if(t.getDay()%6)o.push(iso(t));}return o;})();
    const drop=new Set(sch.filter(x=>days.includes(x)).slice(1,4)),cur=d.conds[d.conds.length-1].from,hi=+B0.base.mean*1.4+2;
    d.series=d.series.filter(x=>!drop.has(x.date));d.series.forEach(x=>{if(x.date>=cur)x.v[nm]=Math.round(hi);});
    if(Array.isArray(d.byDay)){d.byDay=d.byDay.filter(x=>!drop.has(x.date));d.byDay.forEach(x=>{if(x.date>=cur)x.vals[nm]=Math.round(hi);});}
    if(Array.isArray(d.daily))d.daily=d.daily.filter(x=>!drop.has(x.date));
    d.behaviors.forEach(b=>{if(Array.isArray(b.series))b.series=b.series.filter(q=>!drop.has(q.d));});
    B0.series=d.series.map(x=>({d:x.date,v:x.v[nm]})).filter(q=>q.v!=null);const cv=B0.series.filter(q=>q.d>=cur).map(q=>q.v);B0.cur={days:cv.length,mean:cv.reduce((a,b)=>a+b,0)/cv.length,total:cv.reduce((a,b)=>a+b,0)};
    B0.ioa={days:4,of:B0.series.length,mean:92,min:85};const ab=sch.find(x=>!drop.has(x)&&days.includes(x));d.absent=ab?[ab]:[];
    f.review=Object.assign({},f.review||{},{next:dd(18)});f.profile=f.profile||{};f.profile.health=Object.assign({meds:[{name:'Sample medication'}]},f.profile.health||{});
    f.profile.health.changes=[{date:dd(-12),med:'Sample medication',kind:'Dose increased'}];
    const C=Object.assign({},A,{client:'Sample Student C',sid:'000003',key:clKey({client:'Sample Student C',sid:'000003'}),text:JSON.stringify(cC)});
    C.sum=JSON.parse(JSON.stringify(A.sum||{}));C.sum.trend={name:nm,unit:B0.unit||'occurrences',up:false,pts:B0.series.map(q=>[q.d,q.v]).map((q,i,a)=>i>=a.length-10?[q[0],q[1]+i]:q)};C.sum.trends=[C.sum.trend];
    /* B: consent on file, the IEP review in four weeks, three days of data ten school days ago */
    const cB={form:'CASE',rev:'2026-09',saved:new Date(Date.now()-864e5).toISOString(),packet:{client:'Sample Student B',sid:'000002',site:'Sample Elementary',grade:'4'},forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}},
      facts:{consent:{src:'IC-1',state:'Current',on:true,obtained:dd(-16),date:dd(-16)},records:{iep:dd(27)},prefs:{reassess:dd(41)},home:{sheets:[{name:'Morning',due:dd(5)}]},
        data:{from:dd(-20),to:dd(-14),days:3,src:'DD-1',behaviors:[{name:'Elopement',kind:'target',measure:'count',unit:'occurrences',direction:'decrease',series:[{d:dd(-20),v:2},{d:dd(-17),v:3},{d:dd(-14),v:2}]}],
          conds:[{name:'Baseline',from:dd(-20),to:dd(-14),days:3}],series:[{date:dd(-20),cond:'Baseline',v:{Elopement:2}},{date:dd(-17),cond:'Baseline',v:{Elopement:3}},{date:dd(-14),cond:'Baseline',v:{Elopement:2}}],absent:[]}}};
    const Bk={key:clKey(cB.packet),scope:clScope(),client:'Sample Student B',sid:'000002',site:'Sample Elementary',grade:'4',bcba:'',saved:cB.saved,sum:{items:[],lastData:dd(-14),forms:1,trend:{name:'Elopement',unit:'occurrences',up:false,pts:[[dd(-20),2],[dd(-17),3],[dd(-14),2]]}},text:JSON.stringify(cB)};
    await clTx('readwrite',st=>{st.put(C);st.put(Bk);});clPinSet(key,true);state.lastSig=caseSig();await clearCase();await new Promise(r=>setTimeout(r,600));await paintBlank();
    return {kept,A:key,C:C.key,B:Bk.key,dDD:[...drop],ab};});}
const putRecs=(p,R)=>p.evaluate(async R=>{const L0=await clList();for(const r of L0||[])await clTx('readwrite',st=>st.delete(r.key));for(const r of R){r.scope=clScope();await clTx('readwrite',st=>st.put(r));}await paintBlank();},R);
const getRecs=p=>p.evaluate(async()=>(await clList()).map(r=>JSON.parse(JSON.stringify(r))));
async function home(p,key){await p.evaluate(k=>{window.__pick='switch';caseloadGo(k,'');},key);const h=await waitHome(p);await sleep(1200);await shut(p);await noToasts(p);return h;}
/* Open case as she taps it (in the Case menu on the iPad), and the file chooser it opens, if any */
async function openTap(p){const fc=p.waitForEvent('filechooser',{timeout:5000}).catch(()=>null);await L.tapOrMenu(p,'#openCase',true);return fc;}
const lastAn=(p,sel)=>p.evaluate(sel=>(window.__an||[]).filter(x=>x.a&&x.a.id==='w1'&&(!sel||x.el.matches&&x.el.matches(sel))).map(x=>({sel:x.el.id||x.el.className||x.el.tagName,d:+x.o.duration||0,dl:+x.o.delay||0,st:x.a.playState})),sel);
(async()=>{const br=await L.chromium.launch();
  try{
  /* ================= the iPad sideways ================= */
  const c=await ctxFor(br,1376,1032);const p=await start(c,'1376');
  const K=await buildCase(p);
  ok('0 the simulated caseload: Sample Student from the forms\' simulations, Sample Student C (not improving) and B, kept on the iPad',K.kept&&!!K.A&&!!K.C&&!!K.B&&K.dDD.length===3,K);
  const R=await getRecs(p);
  /* ---------- 4 Key findings ---------- */
  await p.evaluate(()=>paintBlank());await sleep(1200);
  const kf=await p.evaluate(()=>{const s=document.querySelector('#blankCl .w1-kf');if(!s)return null;const h2=document.querySelector('#blankCl>h2');
    const nx=h2&&h2.nextElementSibling;return {after:!!nx&&(nx===s||nx.classList.contains('bl-rf')&&nx.nextElementSibling===s),head:s.querySelector('h3').textContent,cards:[...s.querySelectorAll('.w1-k')].map(k=>({cls:k.className,t:k.querySelector('b').textContent,p:k.querySelector('p').textContent,b:[...k.querySelectorAll('button')].map(b=>({t:b.textContent,h:Math.round(b.getBoundingClientRect().height),hold:b.dataset.w1hold||'',go:b.dataset.w1go||'',form:b.dataset.w1form||''}))}))};});
  const wr=kf&&kf.cards.find(x=>/wrong/.test(x.cls)),th=kf&&kf.cards.find(x=>/thin/.test(x.cls));
  ok('4 Key findings on the caseload page, under its heading (after Refresh all): at most a few sentences, the wrong way first',!!kf&&kf.after&&kf.head==='Key findings'&&kf.cards.length>=1&&kf.cards.length<=3&&/wrong/.test(kf.cards[0].cls),kf);
  ok('4 the wrong-way finding names Sample Student C from the cards\' trend (Form DD-1), with "See what may be holding Sample Student C back" (44 px)',!!wr&&/1 student is trending the wrong way/.test(wr.t)&&/Sample Student C, .* rising over the last \d+ days of data \(Form DD-1, as on the cards\)/.test(wr.p)&&!/Sample Student[,:] /.test(wr.p.replace(/Sample Student C/g,''))&&wr.b.length===1&&/See what may be holding Sample Student C back/.test(wr.b[0].t)&&wr.b[0].hold&&wr.b[0].h>=44,wr);
  ok('4 the thin-data finding: a review in the next 30 days with 3 or more of the last 10 school days without data on Form DD-1, each with "Open DD-1 for …"',!!th&&/reviews? in the next 30 days rests? on thin data/.test(th.t)&&/Sample Student B: annual IEP review \d+\/\d+, \d+ of the last 10 school days without data on Form DD-1/.test(th.p)&&/Sample Student C: plan review \d+\/\d+, 3 of the last 10 school days without data \(1 marked absent\) on Form DD-1/.test(th.p)&&th.b.every(b=>b.go&&b.form==='DD-1'&&b.h>=44),th);
  await p.screenshot({path:OUT+'caseload-1376.png'});
  /* ---------- 5 the next 90 days ---------- */
  const want=await p.evaluate(async()=>{const L=(await clList()).filter(r=>!isStaffRec(r)),t0=tdISO(new Date()),t90=tdAdd(t0,90),out=[],seen=new Set();
    L.forEach(r=>{const f=(parseCase(r.text)||{}).facts||{};calEvents(f).forEach(e=>{if(e.date<t0||e.date>t90)return;if(/^Home sheet back/.test(e.what))return;const k=r.key+'|'+e.date+'|'+e.what;if(seen.has(k))return;seen.add(k);out.push(e.what+'|'+e.date);});});return out;});
  const n90=await p.evaluate(()=>{const s=document.querySelector('#blankCl .w1-n90w');if(!s)return null;const dots=[...s.querySelectorAll('.w1-dot')],more=[...s.querySelectorAll('.w1-more')];
    return {head:s.querySelector('h3').textContent,chips:[...s.querySelectorAll('[data-w1ty]')].map(b=>({t:b.textContent,p:b.getAttribute('aria-pressed'),h:Math.round(b.getBoundingClientRect().height)})),
      n:dots.length+more.reduce((a,m)=>a+m.dataset.w1more.split(',').length,0),dots:dots.length,lab:dots.map(d=>d.getAttribute('aria-label')),sz:dots.map(d=>{const r=d.getBoundingClientRect();return Math.min(r.width,r.height);}),
      inside:dots.every(d=>{const r=d.getBoundingClientRect(),b=s.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1;}),home:/Home sheet/.test(s.textContent),wk:[...s.querySelectorAll('.w1-wk span')].map(x=>x.textContent)};});
  ok('5 the next 90 days: one dot (or a "+N") for each date the forms hold in the next 90 days ('+want.length+'), nothing past 90 days, no home sheets',!!n90&&n90.head==='Next 90 days'&&n90.n===want.length&&want.length>=4&&!n90.home,{n90:n90&&{n:n90.n,chips:n90.chips},want});
  ok('5 each dot is 44 px, inside the strip, and named for VoiceOver: the kind, what, the student, the day, how far off, the form it opens',!!n90&&n90.sz.every(x=>x>=44)&&n90.inside&&n90.lab.every(l=>/^[A-Z][^:]+: .+, Sample Student[^,]*, \w+day, \d+\/\d+, (today|in \d+ days?)\. Opens [A-Z]+-1$/.test(l)),n90&&n90.lab.slice(0,4));
  ok('5 type chips for the kinds present (44 px, pressed), only kinds the brief lists',!!n90&&n90.chips.length>=2&&n90.chips.every(x=>x.p==='true'&&x.h>=44&&/^(FBA due|Plan reviews|Annual IEP|Reevaluations|CR-1 notices|IM-1 follow-ups|PA-1 reassessments|Plan starts|Rights at 18|Consent renewals) · \d+$/.test(x.t)),n90&&n90.chips);
  const chip=await p.evaluate(()=>{const b=document.querySelector('#blankCl [data-w1ty]'),k=b.dataset.w1ty,n=+b.textContent.replace(/.* · /,''),c0=document.querySelectorAll('#blankCl .w1-dot').length;b.click();
    const c1=document.querySelectorAll('#blankCl .w1-dot').length,p1=b.getAttribute('aria-pressed');b.click();return {k,n,c0,c1,p1,c2:document.querySelectorAll('#blankCl .w1-dot').length,p2:b.getAttribute('aria-pressed')};});
  ok('5 a chip hides its kind\'s dates (aria-pressed false) and shows them again',chip.c1<chip.c0&&chip.p1==='false'&&chip.c2===chip.c0&&chip.p2==='true',chip);
  /* ---------- 7 (touch) a press and hold on a dot previews; a tap opens ---------- */
  /* the caseload page settled: the same dot under the same point twice */
  const at=()=>p.evaluate(()=>{const d=document.querySelector('#blankCl .w1-dot');if(!d)return null;d.scrollIntoView({block:'center'});const r=d.getBoundingClientRect(),x=Math.round(r.left+r.width/2),y=Math.round(r.top+r.height/2),h=document.elementFromPoint(x,y);
    if(!d.__w1t)d.__w1t=1;return {x,y,i:+d.dataset.w1ev,hit:!!h&&!!h.closest('.w1-dot'),same:!!d.__w1seen};});
  let dot=null;const cdp=await c.newCDPSession(p);for(let i=0;i<30;i++){await p.evaluate(()=>{const d=document.querySelector('#blankCl .w1-dot');if(d)d.__w1seen=1;});await sleep(500);dot=await at();if(dot&&dot.hit&&dot.same)break;}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:dot.x,y:dot.y}]});await sleep(750);
  const held=await p.evaluate(()=>{const v=document.getElementById('w1Pv');return {shown:!!v&&!v.hidden,t:v?v.textContent:'',desc:(document.querySelector('.w1-dot[aria-describedby="w1Pv"]')||{}).className||''};});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(900);
  const afterHold=await p.evaluate(()=>({home:document.body.classList.contains('ws-case'),cur:state.cur,shown:!document.getElementById('w1Pv').hidden}));
  ok('7 press and hold on a dot shows what it is (the date, the student, the form) and does not open it; the dot is described by the preview',held.shown&&/Sample Student/.test(held.t)&&/Tap the dot to open [A-Z]+-1/.test(held.t)&&/w1-dot/.test(held.desc)&&!afterHold.home&&!afterHold.cur,{held,afterHold});
  await p.evaluate(()=>{try{__wsW1.pvHide();}catch(e){}});await sleep(200);
  const evw=await p.evaluate(async()=>(await __wsW1.events())[0]);
  await p.evaluate(()=>{window.__pick='switch';});await p.locator('#blankCl .w1-dot').first().tap();await waitForm(p,evw.form,60000).catch(()=>{});await sleep(1200);
  const tapd=await p.evaluate(()=>({cur:state.cur,client:packet().client,pv:!document.getElementById('w1Pv').hidden}));
  ok('5/7 a plain tap on a dot opens that student\'s form, with no preview',tapd.cur===evw.form&&tapd.client===evw.who&&!tapd.pv,{tapd,evw});
  /* ---------- D2 the list on the iPad sideways ---------- */
  await shut(p);await noToasts(p);await p.evaluate(()=>{state.ticked={};});
  await p.evaluate(k=>{window.__pick='switch';caseloadGo(k,'DD-1');},K.A);await waitForm(p,'DD-1',60000);await sleep(1200);await shut(p);await noToasts(p);
  const r0=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden'),ov:document.body.classList.contains('sr-ov')}));
  ok('D2 opening a form on the iPad sideways puts the list away, as before (H2)',r0.hid&&r0.ov,r0);
  await p.locator('.stagew>.crumb #railToggle').tap();await sleep(700);
  const r1=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden'),ov:document.body.classList.contains('sr-ov'),pos:getComputedStyle(document.getElementById('railNav')).position,
    fw:Math.round(state.frames[state.cur].getBoundingClientRect().width),scrim:getComputedStyle(document.getElementById('railScrim')).display}));
  ok('D2 the list opened by hand while working sits beside the form (no scrim; the form narrower)',!r1.hid&&!r1.ov&&r1.pos!=='absolute'&&r1.fw<1376-280&&r1.scrim==='none',r1);
  await p.locator('#rail .item[data-id="TI-1"] button.open').tap();await waitForm(p,'TI-1',60000);await sleep(1000);await noToasts(p);
  const r2=await p.evaluate(()=>({cur:state.cur,hid:document.body.classList.contains('rail-hidden'),ov:document.body.classList.contains('sr-ov')}));
  ok('D2 opening another form keeps it there (her choice is remembered until she closes it)',r2.cur==='TI-1'&&!r2.hid&&!r2.ov,r2);
  const sh=await p.evaluate(()=>{const b=document.querySelector('#rail [data-srsheet="1"]');if(!b)return null;b.click();return true;});await sleep(800);
  const r3=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden')}));
  ok('D2 choosing a sheet in the list keeps it there too',sh===null||!r3.hid,{sh,r3});
  await p.locator('#railHide').tap();await sleep(600);
  await p.evaluate(()=>openForm('DM-1'));await waitForm(p,'DM-1',60000);await sleep(900);
  const r4=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden'),ov:document.body.classList.contains('sr-ov'),keep:sessionStorage.getItem('nbh.ws.railKeep')}));
  ok('D2 once she closes it, opening a form puts it away again (H2)',r4.hid&&r4.ov&&!r4.keep,r4);
  /* ---------- D1 the Documents list ---------- */
  await p.evaluate(()=>{state.docs=[];});
  const fdm=frameOf(p,'DM-1');if(fdm)await fdm.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await sleep(300);
  const d1=await p.evaluate(()=>state.docs.length);
  ok('D1 a form\'s own print dialog adds no line to the Documents list',d1===0,d1);
  const pop=p.waitForEvent('popup',{timeout:15000}).catch(()=>null);await p.evaluate(()=>{try{iepPrint();}catch(e){}});const w=await pop;
  if(w){await sleep(1500);await w.evaluate(()=>window.dispatchEvent(new Event('beforeprint'))).catch(()=>{});await sleep(400);await w.close().catch(()=>{});}
  await p.evaluate(()=>{const a=document.createElement('a');a.href='data:application/pdf;base64,JVBERi0=';a.download='Packet_Sample (finished).pdf';a.addEventListener('click',e=>e.preventDefault());document.body.appendChild(a);a.click();a.remove();});await sleep(300);
  await p.evaluate(()=>{state.docs.push({form:'packet',title:'Packet',at:new Date(Date.now()-36e5).toISOString(),how:'print'});state.docs.sort((a,b)=>a.at.localeCompare(b.at));});
  const d2=await p.evaluate(()=>state.docs.map(x=>x.form+'|'+x.how+'|'+x.title));
  ok('D1 what the workstation makes itself is listed: its own print window (the IEP meeting packet) and Finish PDF\'s PDF',d2.some(x=>/^packet\|print\|.*IEP meeting/i.test(x))&&d2.some(x=>/^packet\|pdf\|Packet_Sample/.test(x)),d2);
  await p.evaluate(()=>__wsSR.docsOpen());await sleep(500);
  const ds=await p.evaluate(()=>[...document.querySelectorAll('#dlgBody .sr-docl [data-srdocx]')].map(b=>({l:b.getAttribute('aria-label'),h:Math.round(b.getBoundingClientRect().height),t:b.textContent})));
  ok('D1 each line of the Documents sheet has Remove (44 px), named for the line it removes',ds.length===d2.length&&ds.every(x=>x.t==='Remove'&&x.h>=44&&/^Remove .+, \d+\/\d+.*, from this list$/.test(x.l)),ds);
  await p.evaluate(()=>{window.__asked=[];window.__ok=false;});await p.locator('#dlgBody [data-srdocx]').first().tap();await sleep(500);
  const dc=await p.evaluate(()=>({n:state.docs.length,q:window.__asked.slice()}));
  ok('D1 the first Remove asks (only the line goes, no file is deleted, asked once); Cancel keeps the line',dc.n===d2.length&&dc.q.length===1&&/Remove this line from the Documents list\?/.test(dc.q[0])&&/Only the line goes: no file is deleted/.test(dc.q[0])&&/not asked again/.test(dc.q[0]),dc);
  await p.evaluate(()=>{window.__asked=[];window.__ok=true;});const top=await p.evaluate(()=>document.querySelector('#dlgBody [data-srdocx]').dataset.srdocx);
  await p.locator('#dlgBody [data-srdocx]').first().tap();await sleep(500);
  const dr=await p.evaluate(at=>({n:state.docs.length,gone:!state.docs.some(x=>x.at===at),rows:document.querySelectorAll('#dlgBody .sr-docl [data-srdocx]').length,q:window.__asked.length,file:(caseData(packet(),{}).docs||[]).length}),top);
  ok('D1 after OK only that line is gone (the sheet and the case file hold the rest)',dr.n===d2.length-1&&dr.gone&&dr.rows===dr.n&&dr.file===dr.n&&dr.q===1,dr);
  await p.locator('#dlgBody [data-srdocx]').first().tap();await sleep(500);
  const dr2=await p.evaluate(()=>({n:state.docs.length,q:window.__asked.length}));
  ok('D1 a later Remove is not asked again',dr2.n===d2.length-2&&dr2.q===1,dr2);
  await p.screenshot({path:OUT+'documents-1376.png'});await shut(p);
  /* ---------- 8 motion: a menu grows from its button, a tap ends it ---------- */
  await p.evaluate(()=>{window.__an=[];});await p.locator('#wsNav [data-wn-menu="case"]').tap();await sleep(30);
  const mg=await p.evaluate(()=>{const m=document.getElementById('wsNavMenu'),a=(window.__an||[]).filter(x=>x.el===m&&x.a.id==='w1');return {n:a.length,d:a.map(x=>(+x.o.duration||0)+(+x.o.delay||0)),o:m.style.transformOrigin,kf:a[0]&&JSON.stringify(a[0].a.effect.getKeyframes().map(k=>k.transform))};});
  await p.mouse.move(5,600);await p.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse'})));
  const mg2=await p.evaluate(()=>(window.__an||[]).filter(x=>x.a.id==='w1').every(x=>x.a.playState==='finished'));await shut(p);
  ok('8 a menu grows from its button (scale from where the button is), in 0.25 s or less; a tap in the middle ends it at once',mg.n===1&&mg.d.every(x=>x<=250)&&/scale\(0\.96\)/.test(mg.kf||'')&&/px/.test(mg.o)&&mg2,mg);
  /* ---------- 6 what may be holding progress back ---------- */
  await p.evaluate(()=>{window.__an=[];});const hC=await home(p,K.C);
  const hb=await p.evaluate(()=>{const s=document.getElementById('w1Hold');if(!s)return null;const g=document.querySelector('#caseHome #chGM');const gs=g&&g.closest('section');
    return {under:!!gs&&gs.nextElementSibling===s,h:s.querySelector('h3').textContent,lead:s.querySelector('.w1-lead').textContent,foot:s.querySelector('.w1-foot').textContent,
      L:[...s.querySelectorAll('li')].map(li=>({ok:li.classList.contains('ok'),t:li.querySelector('.ch-t').textContent,s:li.querySelector('.ch-s').textContent,b:(li.querySelector('button')||{}).dataset.chopen,bh:Math.round(li.querySelector('button').getBoundingClientRect().height)}))};});
  const ln=k=>hb&&hb.L.find(x=>k.test(x.t));
  ok('6 Sample Student C\'s case home: "What may be holding progress back" under the main graph, with PR-1\'s rule in its lead',hC&&!!hb&&hb.under&&hb.h==='What may be holding progress back'&&/days into .+, mean [\d.]+ against [\d.]+ in .+ \(\d+% worse\); Form PR-1 counts a 20% improvement as progress\./.test(hb.lead),hb&&{h:hb.h,lead:hb.lead,under:hb.under});
  ok('6 every line names the form it comes from and opens it (44 px); checks and to-checks are said for VoiceOver; to-checks first',!!hb&&hb.L.length>=5&&hb.L.every(x=>/^(To check|Checked): /.test(x.t)&&new RegExp('Form '+x.b).test(x.s)&&x.bh>=44)&&hb.L.findIndex(x=>x.ok)>hb.L.findIndex(x=>!x.ok)&&hb.L.slice(hb.L.findIndex(x=>x.ok)).every(x=>x.ok),hb&&hb.L);
  ok('6 integrity (TI-1 against its criterion), missing data (3 of the last 10 school days), a setting event (DM-1\'s medication change), plan changes and agreement (DD-1)',
    !!ln(/Integrity/)&&ln(/Integrity/).b==='TI-1'&&!!ln(/^To check: 3 of the last 10 school days without data/)&&/1 marked absent/.test(ln(/school days without data/).s)&&!!ln(/medication change/)&&ln(/medication change/).b==='DM-1'&&!!ln(/plan change|new phase|started|schedule step/)&&!!ln(/Observers agree: 92% on 4 days/),hb&&hb.L.map(x=>x.t));
  ok('6 it suggests, it does not decide: "A list to check, not a verdict"',!!hb&&/A list to check, not a verdict/.test(hb.foot)&&/yours to decide/.test(hb.foot),hb&&hb.foot);
  await p.screenshot({path:OUT+'holding-back-1376.png'});
  const arr=await p.evaluate(()=>(window.__an||[]).filter(x=>x.a.id==='w1'&&x.el.closest&&x.el.closest('#caseHome')).map(x=>({d:(+x.o.duration||0)+(+x.o.delay||0),g:!!(x.el.querySelector('svg,.ch-stats,.ch-graph')),cls:x.el.className})));
  ok('8 the case home arrives in reading order: each panel 0.25 s or less; no graph or number moves',arr.length>=2&&arr.every(x=>x.d<=250&&!x.g),arr);
  await p.locator('#w1Hold [data-chopen="TI-1"]').first().tap();await waitForm(p,'TI-1',60000);await sleep(800);
  const op=await p.evaluate(()=>state.cur);ok('6 a line\'s button opens its form (TI-1)',op==='TI-1',op);
  const nf=await p.evaluate(()=>{const d=JSON.stringify(caseData(packet(),{})),f=JSON.stringify(state.facts||{});return /holding progress|w1Hold|To check:/.test(d+f);});
  ok('6 nothing of it is in the case file or the facts',!nf,nf);
  await p.evaluate(()=>__wsCH.toHome());await sleep(600);
  /* the improving case: no panel */
  await home(p,K.A);const hA=await p.evaluate(()=>!!document.getElementById('w1Hold'));
  ok('6 Sample Student, improving, has no such panel',!hA,hA);
  /* 4 the finding's link: the case home at the panel */
  await p.evaluate(()=>{const b=document.getElementById('blank');});await p.evaluate(()=>caseloadOpen());await sleep(1500);
  const dk=await p.evaluate(()=>({kf:!!document.querySelector('#dlgBody .w1-kf'),n90:!!document.querySelector('#dlgBody .w1-n90w .w1-dot'),after:(document.querySelector('#dlgBody .w1-kf')||{}).previousElementSibling&&document.querySelector('#dlgBody .w1-kf').previousElementSibling.classList.contains('hp-lead')}));
  ok('4/5 the Caseload screen shows Key findings and the next 90 days too, after its first line',dk.kf&&dk.n90&&dk.after,dk);
  await p.evaluate(()=>{window.__pick='switch';});await p.locator('#dlgBody [data-w1hold]').first().tap();await sleep(500);
  for(let i=0;i<40;i++){if(await p.evaluate(()=>document.activeElement&&document.activeElement.id==='w1HoldH'))break;await sleep(250);}
  const lk=await p.evaluate(()=>({client:packet().client,home:document.body.classList.contains('ws-home'),focus:document.activeElement&&document.activeElement.id,top:Math.round(document.getElementById('w1Hold').getBoundingClientRect().top)}));
  ok('4 "See what may be holding Sample Student C back" opens that case home at the panel (its heading focused, in view)',lk.client==='Sample Student C'&&lk.home&&lk.focus==='w1HoldH'&&lk.top>=0&&lk.top<1032,lk);
  /* ---------- D3 where the case files live ---------- */
  await shut(p);await p.evaluate(()=>{window.__asked=[];});
  let ch=await openTap(p);
  const w0=await p.evaluate(()=>({q:window.__asked.length,where:kvGet('nbh.ws.where@nbh')||''}));
  ok('D3 with no Google key and Drive off, Open case does not ask: the file chooser opens',!!ch&&w0.q===0&&!w0.where,w0);
  await p.evaluate(()=>{kvSet('nbh.google.client','1234-sample.apps.googleusercontent.com');window.__asked=[];window.__pick='files';});
  ch=await openTap(p);
  const w1=await p.evaluate(()=>({q:window.__asked.slice(),b:window.__btns,where:kvGet('nbh.ws.where@nbh')}));
  ok('D3 with Google Drive possible, Open case asks once where the case files live (Files or Google Drive), remembers it, and uses it (Files: the chooser)',!!ch&&w1.q.length===1&&/^Where do your case files live\?/.test(w1.q[0])&&w1.b.join('|')==='In Files on this iPad|In Google Drive|Cancel'&&w1.where==='files',w1);
  await p.evaluate(()=>{window.__asked=[];});ch=await openTap(p);
  const w2=await p.evaluate(()=>window.__asked.length);ok('D3 it is not asked again',!!ch&&w2===0,w2);
  await p.evaluate(()=>caseloadOpen());await sleep(1200);await p.locator('#srClGear').tap();await sleep(300);
  const st1=await p.evaluate(()=>{const e=document.getElementById('w1Where');return e?{t:e.textContent,in:!!e.closest('#srClSet'),b:(e.querySelector('button')||{}).textContent}:null;});
  ok('D3 Caseload settings says where (Files on this iPad), with Change',!!st1&&st1.in&&/Case files\s+Open case and Save case use Files on this iPad\./.test(st1.t)&&st1.b==='Change',st1);
  await p.evaluate(()=>{window.__asked=[];window.__pick='drive';window.__linked=0;window.drvLink=async()=>{window.__linked++;};});
  await p.locator('#w1Where button').tap();await sleep(600);
  const st2=await p.evaluate(()=>({where:kvGet('nbh.ws.where@nbh'),q:window.__asked.length,t:(document.getElementById('w1Where')||{}).textContent}));
  ok('D3 Change asks again and keeps the new place (Google Drive)',st2.where==='drive'&&st2.q===1&&/your school Google Drive/.test(st2.t||''),st2);
  await shut(p);await p.evaluate(()=>{window.__asked=[];window.__pick='file';});
  ch=await openTap(p);
  const w3=await p.evaluate(()=>({q:window.__asked.slice(),b:window.__btns}));
  ok('D3 Drive chosen but not in use here: Open case offers Use Google Drive or a file this time',!!ch&&w3.q.length===1&&/Google Drive is not in use on this iPad yet/.test(w3.q[0])&&w3.b.includes('Use Google Drive')&&w3.b.includes('Open a file instead'),w3);
  /* Drive in use (its setting only; nothing is sent in this test): Open case lists the students in Drive; with Files chosen Save case writes the file */
  await p.evaluate(()=>{kvSet('nbh.drive.on@nbh','1');kvSet('nbh.drive.acct@nbh','sample@school.example');window.drvSoon=()=>{};});
  const sm=await p.evaluate(()=>{const a=drvSaveMode();kvSet('nbh.ws.where@nbh','files');const b=drvSaveMode();kvSet('nbh.ws.where@nbh','drive');return {drive:a,files:b,on:drvOn()};});
  ok('D3 with Drive in use, Save case sends to Drive unless her case files are in Files (then it writes the file)',sm.on&&sm.drive===true&&sm.files===false,sm);
  await L.tapOrMenu(p,'#openCase',true);await sleep(900);
  const dv=await p.evaluate(()=>({t:document.getElementById('dlgTitle').textContent,n:document.querySelectorAll('#dlgBody [data-w1open]').length,file:!!document.getElementById('w1OpenFile')}));
  ok('D3 her case files in Drive, Drive in use: Open case lists the students in Drive (each opens its newest copy), and a file instead',dv.t==='Open a case from Google Drive'&&dv.n===3&&dv.file,dv);
  await p.evaluate(()=>{window.__pick='switch';});await p.locator('#dlgBody [data-w1open]').last().tap();await sleep(400);await waitHome(p);await sleep(800);
  const dvo=await p.evaluate(()=>({client:packet().client,home:document.body.classList.contains('ws-home')}));ok('D3 choosing one opens that student\'s case home',!!dvo.client&&dvo.home,dvo);
  await p.evaluate(()=>{kvDel('nbh.drive.on@nbh');kvDel('nbh.drive.acct@nbh');kvDel('nbh.ws.where@nbh');kvDel('nbh.google.client');});await shut(p);
  /* ---------- 8 the loading outline, the save tick ---------- */
  await home(p,K.C);await p.evaluate(()=>{['FS-1'].forEach(id=>{if(state.frames[id]){try{state.frames[id].remove();}catch(e){}delete state.frames[id];delete state.status[id];}});});
  await p.evaluate(()=>openForm('FS-1'));await sleep(60);
  const sk=await p.evaluate(()=>{const s=document.getElementById('w1Skel');return {shown:!!s&&!s.hidden&&s.getBoundingClientRect().height>200,pe:s&&getComputedStyle(s).pointerEvents,hidden:s&&s.getAttribute('aria-hidden')};});
  await waitForm(p,'FS-1',60000);await sleep(800);const sk2=await p.evaluate(()=>document.getElementById('w1Skel').hidden);
  ok('8 a form opening: the outline of a form holds the stage at once (it takes no taps, VoiceOver skips it) and goes once the form has loaded',sk.shown&&sk.pe==='none'&&sk.hidden==='true'&&sk2,{sk,sk2});
  await p.evaluate(()=>{window.__an=[];window.__ok=true;});await p.locator('#saveCase').tap();
  let tk=null;for(let i=0;i<40;i++){tk=await p.evaluate(()=>{const t=document.getElementById('w1Tick');const a=(window.__an||[]).filter(x=>x.a.id==='w1'&&(x.el.closest&&x.el.closest('#w1Tick')||x.el.id==='wsStat'));return t||a.length?{t:!!t,a:a.map(x=>(+x.o.duration||0)+(+x.o.delay||0))}:null;});if(tk)break;await sleep(150);}
  ok('8 Save case: the tick is drawn once beside "Case saved", with a brief glow, each 0.25 s or less',!!tk&&tk.a.length>=1&&tk.a.every(x=>x<=250),tk);
  const all=await p.evaluate(()=>(window.__an||[]).concat([]).filter(x=>x.a.id==='w1').map(x=>(+x.o.duration||0)+(+x.o.delay||0)));
  await c.close();
  /* ================= the laptop with a mouse: previews ================= */
  const c2=await ctxFor(br,1440,900,{touch:false});const p2=await start(c2,'laptop');await putRecs(p2,R);await home(p2,K.C);
  const tb=p2.locator('#caseHome [data-chopen="TI-1"]').first();await tb.scrollIntoViewIfNeeded();await sleep(200);await tb.hover();await sleep(800);
  const pv=await p2.evaluate(()=>{const v=document.getElementById('w1Pv'),t=document.querySelector('#caseHome [aria-describedby="w1Pv"]');return {shown:!v.hidden,t:v.textContent,role:v.getAttribute('role'),desc:!!t&&t.dataset.chopen,bars:v.querySelectorAll('.pv-bars i').length,btn:v.querySelectorAll('button,a').length};});
  ok('7 hovering "Open TI-1" shows what will open before it opens: the last integrity checks and the step missed most (no button of its own)',pv.shown&&pv.role==='tooltip'&&pv.desc==='TI-1'&&/Last \d integrity checks?/.test(pv.t)&&pv.bars>=1&&/Tap to open TI-1/.test(pv.t)&&pv.btn===0,pv);
  await p2.mouse.move(5,5);await sleep(300);const pvOut=await p2.evaluate(()=>document.getElementById('w1Pv').hidden);
  ok('7 moving away closes it',pvOut,pvOut);
  await tb.hover();await sleep(800);await p2.keyboard.press('Escape');await sleep(200);const pvEsc=await p2.evaluate(()=>document.getElementById('w1Pv').hidden);
  ok('7 Escape closes it',pvEsc,pvEsc);
  await p2.evaluate(()=>{const h=document.querySelector('#caseHome .ch-graph');h.scrollIntoView({block:'center'});});await sleep(300);
  const gb=await p2.evaluate(()=>{const r=document.querySelector('#caseHome .ch-graph svg').getBoundingClientRect();return {x:r.left+r.width*0.8,y:r.top+r.height*0.5};});
  await p2.mouse.move(gb.x,gb.y);await sleep(800);const gp=await p2.evaluate(()=>{const v=document.getElementById('w1Pv');return {shown:!v.hidden,t:v.textContent};});
  ok('7 a point on the graph: its day, its value and its phase',gp.shown&&/\d+\/\d+: [\d.]+/.test(gp.t)&&/Tap to open DD-1/.test(gp.t),gp);
  await p2.evaluate(()=>{const e=document.querySelector('#rail .item[data-id="FS-1"]');e.scrollIntoView({block:'center'});});await p2.evaluate(()=>{try{__wsCH.colShow(true,'forms');}catch(e){}});await sleep(500);
  await p2.locator('#rail .item[data-id="FS-1"]').hover();await sleep(800);const rp=await p2.evaluate(()=>{const v=document.getElementById('w1Pv');return {shown:!v.hidden,t:v.textContent};});
  ok('7 a form in the list: what it is for and how far along it is',rp.shown&&/FS-1/.test(rp.t)&&/^.*For .+\./.test(rp.t),rp);
  /* the Apple Pencil held over the iPad gives a hover with pointerType "pen": the same preview */
  await p2.mouse.move(5,5);await sleep(300);
  const pen=await p2.evaluate(async()=>{const b=document.querySelector('#caseHome [data-chopen="FS-1"]');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();
    b.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'pen',clientX:r.left+5,clientY:r.top+5}));await new Promise(r=>setTimeout(r,700));const v=document.getElementById('w1Pv');return {shown:!v.hidden,t:v.textContent};});
  ok('7 the Apple Pencil held over a button (a pen hover) shows the same preview',pen.shown&&/FS-1/.test(pen.t),pen);
  await p2.mouse.move(5,5);await sleep(300);
  await p2.locator('#caseHome [data-chopen="FS-1"]').first().click();await sleep(300);const clk=await p2.evaluate(()=>({pv:!document.getElementById('w1Pv').hidden,cur:state.cur}));
  ok('7 a click does what the button says, with no preview',!clk.pv&&clk.cur==='FS-1',clk);
  await p2.screenshot({path:OUT+'preview-laptop.png'});
  await c2.close();
  /* ================= Reduce Motion ================= */
  const c3=await ctxFor(br,1376,1032,{rm:true});const p3=await start(c3,'rm');await putRecs(p3,R);
  await p3.evaluate(()=>{window.__an=[];});await home(p3,K.C);await p3.locator('#wsNav [data-wn-menu="case"]').tap();await sleep(300);await shut(p3);
  await p3.evaluate(()=>{if(state.frames['TD-1']){state.frames['TD-1'].remove();delete state.frames['TD-1'];delete state.status['TD-1'];}openForm('TD-1');});await sleep(60);
  const rm=await p3.evaluate(()=>({an:(window.__an||[]).filter(x=>x.a.id==='w1').length,sk:!document.getElementById('w1Skel').hidden}));
  ok('8 with Reduce Motion nothing moves (no menu grows, no arrival), and the loading outline still shows',rm.an===0&&rm.sk,rm);
  await c3.close();
  ok('8 every movement the shell made in this run took 0.25 s or less',all.length>0&&all.every(x=>x<=250),all);
  /* ================= the phone and paper ================= */
  const c4=await ctxFor(br,390,844);const p4=await start(c4,'phone');await putRecs(p4,R);await home(p4,K.C);
  const ph=await p4.evaluate(()=>{const s=document.getElementById('w1Hold');return s?{w:Math.round(s.getBoundingClientRect().width),wide:document.documentElement.scrollWidth>innerWidth+1,btn:[...s.querySelectorAll('button')].every(b=>b.getBoundingClientRect().right<=innerWidth+1)}:null;});
  ok('P the phone: the case home holds the panel in its one column, nothing wider than the screen',!!ph&&ph.w<=390&&!ph.wide&&ph.btn,ph);
  await p4.emulateMedia({media:'print'});const pr=await p4.evaluate(()=>['#w1Hold','#w1Pv','#w1Skel'].map(s=>{const e=document.querySelector(s);return e?getComputedStyle(e).display:'none';}));
  ok('P nothing of it prints',pr.every(x=>x==='none'),pr);
  await c4.close();
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  ok('P no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failed of '+(passes+fails):'RESULT: all '+passes+' passed');process.exit(fails?1:0);})();
