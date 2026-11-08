/* v25.69 wave 3: the follow-ups left by wave 2 for "the other files" (W2-SAFETY and W2-CLASSSTAFF, "What other files would need";
   the BCBA's decisions of 11/6). Simulated data only ("Sample Student", "S.S.", the forms' own simulations, "Simulated RBT").
   EV  the shell and Form CR-1's events (crisis.events): Today and What's due name a Baker Act initiation whose parent is not
       recorded as reached and a threat team case whose brief is not recorded as given; each opens CR-1 at that event (its
       Threat team brief view, the event's card in view and outlined), from Today and from the caseload; each clears once the
       parent is reached or the brief given. The calendar has the events' dates (the .ics file says "Safety event"). A CR-1
       holding only events is "a plan with no crisis plan" on the hand-over check, and the case line says no stages. The
       transition summary and the IEP meeting packet do not name the events (district policy).
   SC  the daily self-check, end to end: Form TI-1's questions for its interventionist reach Form DD-1 through the case; DD-1
       offers them for that person's staff phone link (k), which keeps them; the staff phone page (staff-data.html, a phone at
       390 px) asks them and sends the answers with the period's data (sc) to the reply box (a box kept in the test's browser;
       no server); DD-1 collects the entry, keeps the answers (S.staff.self), shows the day's self-check on its log, shades the
       day on its graphs (under TI-1's criterion) with a legend line, and gives data.staff.self to the case; TI-1 compares the
       day with its observation that day. A link made with the self-check unticked carries no k; a record with no self-check
       saves as before. OB-1's classroom check is a part of the case of its own.
   PAD the new parts on an iPad sideways and upright (touch, Safari's user agent) and on a laptop: no page-wide scroll, 44 px
   no page errors anywhere
   usage: WS_URL=http://127.0.0.1:8650 WS_ROOT=<worktree> node qa/v2569-wave3-test.js [EV SC PAD] */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;const crypto=require('crypto');
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const F=L.forms(),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const OUT=path.join(__dirname,'out','v2569-wave3');try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const IPAD=L.IPAD_UA,IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const errs=[];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const ago=k=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-k);return iso(d);};
/* the reply box (box.php's answers), kept in this browser: the staff page puts sealed entries, DD-1 registers, lists and removes */
const BOXURL='https://box.sim.invalid/reply/box.php',BOX={};
async function boxRoute(route){const req=route.request(),u=new URL(req.url()),a=u.searchParams.get('a'),b=u.searchParams.get('b');let body={};try{body=JSON.parse(req.postData()||'{}');}catch(e){}
  const J=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
  if(a==='ping')return J({ok:true,v:3});
  if(a==='new'){BOX[body.b]=BOX[body.b]||{t:body.t,r:[]};return J({ok:true,b:body.b,had:false});}
  const x=BOX[b];if(!x)return J({ok:false,error:'no such box'},404);
  if(a==='put'){const id='r-'+Math.floor(Date.now()/1000)+'-'+crypto.randomBytes(6).toString('hex');x.r.push({id,at:new Date().toISOString(),k:body.k,iv:body.iv,ct:body.ct});return J({ok:true,id});}
  if(a==='list')return J({ok:true,b,count:x.r.length,replies:x.r});
  if(a==='del'){const ids=new Set(body.ids||[]),m=x.r.length;x.r=x.r.filter(r=>!ids.has(r.id));return J({ok:true,deleted:m-x.r.length});}
  return J({ok:false,error:'unknown'},400);}
async function ctxFor(br,w,h,touch){const c=await br.newContext(Object.assign({viewport:{width:w,height:h},serviceWorkers:'block',acceptDownloads:true},touch?{hasTouch:true,isMobile:true,userAgent:w<500?IPHONE:IPAD}:{}));
  await c.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2569')){sessionStorage.setItem('v2569','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    ['nbh.ws.pinbars','nbh.focus','nbh.ws.full','nbh.ws.rail','nbh.ws.navmode','nbh.railoff','nbh.ws.n90off'].forEach(k=>localStorage.removeItem(k));}}catch(e){}window.print=function(){};});
  await c.route('https://box.sim.invalid/**',boxRoute);return c;}
const stubs=p=>p.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.choose=async()=>'';wsUI.alert=async()=>{};window.alert=()=>{};window.confirm=()=>true;}).catch(()=>{});
async function shell(c,tag){const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);await stubs(p);
  await p.evaluate(async()=>{const L0=await clList();for(const r of L0||[])await clTx('readwrite',st=>st.delete(r.key));['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});
    const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient','SIMULATED - Sample Student');});
  return p;}
const frameOf=(p,id)=>p.frames().find(f=>decodeURIComponent(f.url()).includes(FILE[id]));
async function waitForm(p,id,ms){for(let i=0;i<(ms||40000)/250;i++){if(await p.evaluate(id=>!!state.status[id]&&!state.pending[id],id))return true;await sleep(250);}return false;}
async function openIn(p,id,sim){await p.evaluate(i=>openForm(i),id);await waitForm(p,id,60000);await sleep(900);const fr=frameOf(p,id);if(!fr)return null;
  await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;window.alert=()=>{};}).catch(()=>{});
  if(sim){await L.loadSim(fr);await sleep(1500);}return fr;}
const facts=p=>p.evaluate(async()=>{await gatherFacts(true);await new Promise(r=>setTimeout(r,700));return JSON.parse(JSON.stringify(state.facts||{}));});
const sw=p=>p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));

(async()=>{const br=await L.chromium.launch();
 /* ---------------- EV: the shell and CR-1's events ---------------- */
 if(want('EV'))try{
  const c=await ctxFor(br,1440,900,false),p=await shell(c,'EV');
  const cr=await openIn(p,'CR-1',false);
  const d1=ago(2),d2=ago(3);
  const made=await cr.evaluate(async([d1,d2])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('#viewSeg button[data-view="tm"]').click();await w(200);
    const set=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    document.getElementById('tmAddThreat').click();await w(150);set('[data-tmi="0"][data-tm="d"]',d2);set('[data-tmi="0"][data-tm="t"]','09:15');
    document.getElementById('tmAddBaker').click();await w(150);set('[data-tmi="1"][data-tm="d"]',d1);set('[data-tmi="1"][data-tm="t"]','13:40');set('[data-tmi="1"][data-tm="who"]','School resource officer');
    set('[data-tmi="1"][data-tma="0"][data-tm="d"]',d1);set('[data-tmi="1"][data-tma="0"][data-tm="t"]','13:50');set('[data-tmi="1"][data-tma="0"][data-tm="o"]','Left a voicemail');
    document.querySelector('#viewSeg button[data-view="plan"]').click();await w(100);
    return {ids:S.tm.map(x=>x.id),stages:(S.pbis||[]).filter(r=>r&&String(r.s||'').trim()&&String(r.do||'').trim()).length};},[d1,d2]);
  let f=await facts(p);const ev=(f.crisis&&f.crisis.events)||[];
  ok('EV 1 CR-1 sends its events with their ids (crisis.events), and no stages: only events are in it',ev.length===2&&ev.every((e,i)=>e.id===made.ids[i])&&made.stages===0&&Array.isArray(f.crisis.stages)&&!f.crisis.stages.length,{ev,made});
  const t1=await p.evaluate(()=>todayItems().filter(x=>/Form CR-1/.test(x.t)).map(x=>({k:x.k,t:x.t,open:x.open,at:x.at})));
  const bk=t1.find(x=>/Baker Act/.test(x.t)),th=t1.find(x=>/threat management team/.test(x.t));
  ok('EV 2 Today names the Baker Act initiation (parent not recorded as reached, 1 attempt) and the threat team case (brief not given), as Safety, each opening CR-1 at its event',
    t1.length===2&&bk&&bk.k==='Safety'&&/not recorded as reached \(1 attempt recorded\)/.test(bk.t)&&/at 1:40 PM/.test(bk.t)&&bk.open==='CR-1'&&bk.at==='tm-'+made.ids[1]&&th&&th.k==='Safety'&&/brief for the team is not recorded as given/.test(th.t)&&th.at==='tm-'+made.ids[0],t1);
  /* the Today window: the button opens CR-1 at the Baker Act initiation */
  await p.evaluate(()=>todayOpen());await sleep(900);
  const btn=await p.evaluate(()=>[...document.querySelectorAll('#dlgBody .td-list li')].filter(li=>/Baker Act/.test(li.textContent)).map(li=>{const b=li.querySelector('button[data-open]');return b?{open:b.dataset.open,at:b.dataset.at||''}:null;})[0]);
  await p.locator('#dlgBody .td-list li:has-text("Baker Act") button[data-open]').click();await sleep(1500);
  const at1=await cr.evaluate(()=>({view:document.body.className,hash:location.hash,go:[...document.querySelectorAll('.tm-card.tm-go')].map(c=>c.dataset.tmc),
    focus:document.activeElement&&document.activeElement.textContent,top:(()=>{const c=document.querySelector('.tm-card.tm-go');return c?Math.round(c.getBoundingClientRect().top):null;})(),h:innerHeight}));
  ok('EV 3 from Today, "Open CR-1" opens it at that event: the Threat team brief view, the Baker Act card in view, outlined and given the focus',
    btn&&btn.at==='tm-'+made.ids[1]&&/view-tm/.test(at1.view)&&at1.hash==='#tm-'+made.ids[1]&&at1.go.join()==='1'&&/Baker Act initiation 1/.test(at1.focus||'')&&at1.top!==null&&at1.top>=-5&&at1.top<at1.h,{btn,at1});
  /* What's due and the caseload: the student kept on this device, its summary as at the save */
  await cr.evaluate(()=>{document.querySelector('#viewSeg button[data-view="plan"]').click();});
  const due=await p.evaluate(async()=>{await caseloadKeep(packet(),{});const L0=await clList();const h=dueBoard(L0);const d=document.createElement('div');d.innerHTML=h;
    const rows=[...d.querySelectorAll('.due-row')].filter(r=>/Form CR-1|Baker Act|threat management/i.test(r.textContent));
    return {grp:rows.map(r=>r.className),txt:rows.map(r=>r.querySelector('.due-what').textContent),btn:rows.map(r=>{const b=r.querySelector('button[data-clopen]');return b?b.dataset.clform+'|'+(b.dataset.at||''):'';}),
      items:(L0[0].sum.items||[]).filter(x=>x.at).map(x=>x.at)};});
  ok('EV 4 What\'s due lists both under "Needs you now", each with its Open CR-1 at the event (the caseload copy keeps where each opens)',
    due.txt.length===2&&due.grp.every(g=>/\bnow\b/.test(g))&&due.btn.includes('CR-1|tm-'+made.ids[1])&&due.btn.includes('CR-1|tm-'+made.ids[0])&&due.items.length===2,due);
  await p.evaluate(()=>caseloadOpen());await sleep(1200);
  const clb=await p.evaluate(()=>[...document.querySelectorAll('#dlgBody .td-list li')].filter(li=>/threat management/.test(li.textContent)).map(li=>{const b=li.querySelector('button[data-clopen]');return b?b.dataset.clform+'|'+(b.dataset.at||''):'';}));
  await p.locator('#dlgBody .td-list li:has-text("threat management") button[data-clopen]').first().click();await sleep(1800);
  const at2=await cr.evaluate(()=>({view:document.body.className,go:[...document.querySelectorAll('.tm-card.tm-go')].map(c=>c.dataset.tmc)}));
  ok('EV 5 from Caseload\'s "What needs you", the threat team case opens CR-1 at its card',clb[0]==='CR-1|tm-'+made.ids[0]&&/view-tm/.test(at2.view)&&at2.go.join()==='0',{clb,at2});
  /* the calendar */
  const cal=await p.evaluate(async()=>{const E=calEvents(state.facts||{}).filter(e=>e.form==='CR-1'&&e.sev);let ics='';const RB=window.Blob,ck=HTMLAnchorElement.prototype.click;
    window.Blob=function(ps,o){ics=ps.join('');return new RB(ps,o);};window.Blob.prototype=RB.prototype;HTMLAnchorElement.prototype.click=function(){};
    try{await clCalendar();}finally{window.Blob=RB;HTMLAnchorElement.prototype.click=ck;}return {E,ics};});
  const ymd=s=>s.replace(/-/g,'');
  ok('EV 6 the calendar has the events\' dates (Baker Act initiation, threat management team case); the calendar file carries them as "Safety event (Form CR-1)", the kind left in the workstation',
    cal.E.length===2&&cal.E.some(e=>e.date===d1&&e.what==='Baker Act initiation')&&cal.E.some(e=>e.date===d2&&e.what==='Threat management team case')&&cal.ics.includes('DTSTART;VALUE=DATE:'+ymd(d1))&&cal.ics.includes('DTSTART;VALUE=DATE:'+ymd(d2))&&/Safety event \(Form CR-1\)/.test(cal.ics)&&!/Baker|threat/i.test(cal.ics),{E:cal.E,ics:cal.ics.slice(0,600)});
  /* a plan with no crisis plan */
  const ho=await p.evaluate(()=>{const was=state.facts;state.facts=Object.assign({},was,{plan:{rep:'Mand for a break (simulated)',beh:'Aggression (simulated)'}});
    const L0=handoverItems().map(x=>x.t);paintFacts();const line=($('#factsTxt')||{}).textContent||'';
    const ts=tdSummaryHTML(),iep=JSON.stringify(iepParts());state.facts=was;paintFacts();return {L0,line,ts:/Baker|threat (management )?team/i.test(ts),iep:/Baker|threat (management )?team/i.test(iep)};});
  ok('EV 7 a CR-1 holding only events counts as no crisis plan: the hand-over check asks for one ("Form CR-1 holds no crisis stages yet"), and the case line says "Crisis plan: no stages yet"',
    ho.L0.some(t=>/^A plan with no crisis plan: Form CR-1 holds no crisis stages yet/.test(t))&&/Crisis plan: no stages yet/.test(ho.line),{L0:ho.L0,line:ho.line});
  ok('EV 8 the transition summary and the IEP meeting packet do not name the events (district policy)',!ho.ts&&!ho.iep,ho);
  /* cleared */
  await cr.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const set=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    document.querySelector('#viewSeg button[data-view="tm"]').click();await w(100);document.querySelector('[data-tmattadd="1"]').click();await w(150);
    set('[data-tmi="1"][data-tma="1"][data-tm="d"]',S.tm[1].d);set('[data-tmi="1"][data-tma="1"][data-tm="t"]','14:30');set('[data-tmi="1"][data-tma="1"][data-tm="o"]','Spoke with the parent');});
  f=await facts(p);const t2=await p.evaluate(()=>todayItems().filter(x=>/Form CR-1/.test(x.t)).map(x=>x.t));
  ok('EV 9 the Baker Act item clears once the parent is recorded as reached; the threat team case stays',t2.length===1&&/threat management team/.test(t2[0])&&f.crisis.events.find(e=>e.kind==='baker').reached===true,{t2});
  await cr.evaluate(()=>{const e=document.querySelector('[data-tmi="0"][data-tm="brief"]');e.value=S.tm[0].d;e.dispatchEvent(new Event('input',{bubbles:true}));});
  f=await facts(p);const t3=await p.evaluate(async()=>{await caseloadKeep(packet(),{});const L0=await clList();return {today:todayItems().filter(x=>/Form CR-1/.test(x.t)).length,due:/Baker|threat management/.test(dueBoard(L0))};});
  ok('EV 10 the threat team item clears once the brief is recorded as given; What\'s due holds neither',t3.today===0&&!t3.due,t3);
  ok('EV 11 no page errors in the shell and CR-1',!errs.some(e=>/^EV/.test(e)),errs);
  await p.close();await c.close();
 }catch(e){ok('EV: the section ran to the end',false,String(e&&e.stack||e));}

 /* ---------------- SC: the daily self-check, end to end ---------------- */
 if(want('SC'))try{
  const c=await ctxFor(br,1440,900,false),p=await shell(c,'SC');
  const ti=await openIn(p,'TI-1',true);
  const tq=await ti.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('#viewSeg button[data-view="rt"]').click();await w(200);document.getElementById('tiScCrit').click();await w(150);
    return {who:S.meta.int,items:S.sck.items.map(x=>({i:x.i,d:x.d})),obs:S.obs.map(o=>o.date),crit:(window.__nbhFactsOut().integrity||{}).criterion};});
  const D=tq.obs[tq.obs.length-1],WHO=tq.who+', Room 12';
  const dd=await openIn(p,'DD-1',true);
  await facts(p);await sleep(500);
  const pan=await dd.evaluate(async([who,box])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const s=stSt();s.site=box;stPaint();
    const P=document.getElementById('ddStaff');const wi=P.querySelector('#stWho');wi.value='Ms. Other (simulated)';wi.dispatchEvent(new Event('input',{bubbles:true}));await w(50);
    const other={shown:!document.getElementById('stSc').hidden,txt:document.getElementById('stSc').textContent};
    wi.value=who;wi.dispatchEvent(new Event('input',{bubbles:true}));await w(50);const b=document.getElementById('stSc');
    return {other,shown:!b.hidden,on:!!(b.querySelector('#stScOn')||{}).checked,li:[...b.querySelectorAll('li')].map(x=>x.textContent),txt:b.textContent,hl:Math.round((b.querySelector('label.st-sc-on')||{getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height)};},[WHO,BOXURL]);
  ok('SC 1 DD-1 takes Form TI-1\'s questions from the case and offers them, ticked, for a link for TI-1\'s interventionist ("Ask the daily self-check"); for another adult it says whose they are',
    pan.shown&&pan.on&&pan.li.length===5&&pan.li[0]===tq.items[0].d&&/from Form TI-1/.test(pan.txt)&&pan.other.shown&&/Form TI-1 holds a daily self-check for/.test(pan.other.txt)&&!/Ask the daily self-check/.test(pan.other.txt),{pan,tq:tq.items.length});
  const qsf=await dd.evaluate(()=>{const was=ddCaseFacts;try{ddCaseFacts={integrity:{selfCheck:{who:'Simulated RBT',items:[{i:'k1',d:'Gave the break card first'}],src:'TI-1'}},
      quick:{selfCheck:{items:[{i:'q1',d:'Offer the break card first'},{i:'q2',d:'Praise the wait'},{i:'q3',d:'One voice in an escalation'}],src:'QS-1'}}};
      return {other:window.__dd2569.selfQs('Sample para (simulated)'),mine:window.__dd2569.selfQs('Simulated RBT, Room 12')};}finally{ddCaseFacts=was;}});
  ok('SC 1b for an adult who is not TI-1\'s interventionist the link takes Form QS-1\'s self-check (its non-negotiables), the same ids',qsf.other.src==='QS-1'&&qsf.other.items.map(x=>x.i).join()==='q1,q2,q3'&&qsf.mine.src==='TI-1'&&qsf.mine.items.length===1,qsf);
  const mk=await dd.evaluate(async()=>{const P=document.getElementById('ddStaff');P.querySelector('#stMake').click();
    for(let i=0;i<60&&!(S.staff&&S.staff.links&&S.staff.links.length);i++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,300));
    const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();const l=S.staff.links[0],u=stUrlOf(l);
    const pl=JSON.parse(new TextDecoder().decode(stUnb64(u.split('#s=')[1])));
    const again=stUrlOf(stNorm(JSON.parse(JSON.stringify(S.staff))).links[0]);
    return {k:l.k,pk:pl.k,url:u,same:again===u,asks:(P.querySelector('#stLinks tr[data-code] .st-asks')||{}).textContent||''};});
  ok('SC 2 the link carries the questions (k: id and words, five), kept on the link so the QR made again is the same link; the list of links says what it asks',
    Array.isArray(mk.k)&&mk.k.length===5&&JSON.stringify(mk.pk)===JSON.stringify(tq.items.map(x=>({i:x.i,n:x.d})))&&mk.same&&/^Asks the self-check: 1\. /.test(mk.asks),{k:mk.k,pk:mk.pk,same:mk.same,asks:mk.asks});
  /* the phone */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:'block',userAgent:IPHONE});await ph.route('https://box.sim.invalid/**',boxRoute);
  const q=await ph.newPage();q.on('pageerror',e=>errs.push('SC phone: '+e.message));await q.goto(mk.url);await sleep(1200);
  const sent=await q.evaluate(async D=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};o.q=[...document.querySelectorAll('.sc-q')].length;
    const dt=document.getElementById('sdDate');dt.value=D;dt.dispatchEvent(new Event('input',{bubbles:true}));dt.dispatchEvent(new Event('change',{bubbles:true}));await w(150);
    document.querySelector('[data-a="inc"]').click();await w(50);document.querySelector('[data-a="inc"]').click();await w(50);
    const ids=window.__nbhStaffPage.link.k.map(x=>x.i),ans=['y','y','n','y','x'];
    ids.forEach((id,k)=>{const b=document.querySelector('[data-sc="'+id+'"][data-sa="'+ans[k]+'"]');if(b)b.click();});await w(80);
    document.getElementById('sdSend').click();for(let i=0;i<40&&window.__nbhStaffPage.state().out.length;i++)await w(150);await w(200);
    const st=window.__nbhStaffPage.state();o.out=st.out.length;o.sent=st.sent.length;o.msg=document.getElementById('sdMsg').textContent;o.sw=document.documentElement.scrollWidth;o.iw=innerWidth;return o;},D);
  const inBox=Object.values(BOX).reduce((a,x)=>a+x.r.length,0);
  ok('SC 3 the staff phone page asks the five questions, and its Send takes the period\'s data with the answers to the reply box (sealed; no sideways scroll at 390 px)',sent.q===5&&sent.out===0&&sent.sent===1&&inBox===1&&/Sent/.test(sent.msg)&&sent.sw<=sent.iw,{sent,inBox});
  await q.screenshot({path:path.join(OUT,'phone.png'),fullPage:true});await q.close();await ph.close();
  /* DD-1 collects */
  const got=await dd.evaluate(async D=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const r=await stCollect(false);await w(400);const s=S.staff;
    const row=S.rows.find(x=>x.date===D),b=S.behaviors.find(x=>x.id===s.links[0].t[0]);
    if(typeof renderResults==='function')renderResults();await w(300);
    const sh=[...document.querySelectorAll('#resultsOut .dd-sc-day')].map(x=>x.getAttribute('data-sc-day'));
    const leg=[...document.querySelectorAll('#resultsOut .legend')].map(x=>x.textContent).join('|'),note=[...document.querySelectorAll('#resultsOut .dd-sc-h')].map(x=>x.textContent)[0]||'';
    document.getElementById('stRecentW').open=true;const log=(document.querySelector('#stRecent tbody tr')||{}).textContent||'';
    const out=window.__nbhFactsOut().data.staff;
    return {placed:r&&r.placed,self:JSON.parse(JSON.stringify(s.self||[])),val:row&&b?row.values[b.id]:null,sh,leg:/Self-check under 90%: staff phone/.test(leg),note,log,out:out.self,thr:window.__dd2569.thr(),
      rowKeys:row?Object.keys(row).join(','):''};},D);
  const e0=got.self[0]||{};
  ok('SC 4 DD-1 collects the entry: the count on its day, and the answers kept in the record (S.staff.self: the day, the link\'s person and code, the five answers), not on the day\'s row',
    got.placed>=1&&got.self.length===1&&e0.date===D&&e0.who===WHO&&e0.items.length===5&&e0.items.map(a=>a.a).join('')==='yynyx'&&!/\bsc\b/.test(got.rowKeys),{got:{placed:got.placed,self:got.self,val:got.val,rowKeys:got.rowKeys}});
  ok('SC 5 the Staff phones log shows the entry\'s self-check ("self-check 3 of 4 yes (1 did not come up)")',/self-check 3 of 4 yes \(1 did not come up\)/.test(got.log),got.log);
  ok('SC 6 the day is shaded on the graphs, under TI-1\'s criterion (90%: 75% yes), with the legend line "Self-check under 90%: staff phone" and a line saying what the shading is',
    got.thr===90&&got.sh.length>=1&&got.sh.every(x=>x===D)&&got.leg&&/under 90% yes/.test(got.note)&&/Form TI-1's observations stay the measure/.test(got.note),{thr:got.thr,sh:got.sh,leg:got.leg,note:got.note});
  ok('SC 7 to the case: data.staff.self [{date, who, code, at, items}]',Array.isArray(got.out)&&got.out.length===1&&got.out[0].date===D&&got.out[0].who===WHO&&/^[A-Z0-9]{6,12}$/.test(got.out[0].code)&&!!got.out[0].at&&got.out[0].items.length===5&&!('id' in got.out[0]),got.out);
  /* TI-1 compares */
  await facts(p);await sleep(800);
  const cmp=await ti.evaluate(D=>{const C=window.__ti2568b.cal();const r=C&&C.rows.find(x=>x.date===D);return {r:r?{self:r.self,obs:r.obs,on:r.on,high:r.high,y:r.y,n:r.n,x:r.x}:null,kept:(S.sckIn||[]).length,txt:(document.getElementById('tiSc')||{}).textContent||''};},D);
  ok('SC 8 TI-1 takes the day from the case and sets it beside its observation that day, on the same steps (75% yes against what was observed)',cmp.r&&Math.round(cmp.r.self)===75&&cmp.r.obs!=null&&cmp.r.on==='steps'&&cmp.kept===1&&cmp.r.y===3&&cmp.r.n===1&&cmp.r.x===1,cmp);
  /* the record keeps it; unticked, a link is as it was */
  const rec=await dd.evaluate(async()=>{const a=JSON.stringify(S.staff);S.staff=JSON.parse(a);stClean();const same=JSON.stringify(S.staff)===a;
    const P=document.getElementById('ddStaff');const wi=P.querySelector('#stWho');wi.value='Simulated RBT, Room 14';wi.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,50));
    const cb=document.getElementById('stScOn');cb.click();await new Promise(r=>setTimeout(r,50));P.querySelector('#stMake').click();
    for(let i=0;i<60&&S.staff.links.length<2;i++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,300));const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();
    const l=S.staff.links[1],pl=l?JSON.parse(new TextDecoder().decode(stUnb64(stUrlOf(l).split('#s=')[1]))):null;
    return {same,hasK:!!(l&&'k' in l),plK:!!(pl&&'k' in pl),plKeys:pl?Object.keys(pl).join(','):''};});
  ok('SC 9 the record keeps the link\'s questions and the answers as they are (normalized again, unchanged); a link made with the self-check unticked carries no k (its payload as before)',
    rec.same&&!rec.hasK&&!rec.plK&&rec.plKeys==='v,f,x,c,w,s,t,st,d',rec);
  /* a record with no self-check */
  const dd2=await c.newPage();dd2.on('pageerror',e=>errs.push('SC DD-1 alone: '+e.message));await dd2.goto(L.BASE+'/NBH-Workstation/'+encodeURI(FILE['DD-1']));await sleep(1500);
  await dd2.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;});await L.loadSim(dd2);await sleep(1500);
  const old=await dd2.evaluate(()=>{const st={box:null,site:'',page:'',links:[{code:'SIMCODE1',who:'Sample para (simulated)',made:'2026-10-01',t:[S.behaviors[0].id],names:{},st:[],last:'',n:0,off:false}],got:[],seen:[],log:[],held:[],noPrintQr:false};
    const n=stNorm(JSON.parse(JSON.stringify(st)));return {same:JSON.stringify(n)===JSON.stringify(st),sh:document.querySelectorAll('.dd-sc-day').length,staff:'staff' in S,
      f:JSON.stringify(window.__nbhFactsOut()&&window.__nbhFactsOut().data||{}).includes('"self"')};});
  ok('SC 10 a record with no self-check is as before: a link\'s record normalizes to itself (no k, no self), nothing is shaded, nothing new goes to the case',old.same&&old.sh===0&&!old.f,old);
  await dd2.close();
  /* OB-1's classroom check, a part of the case of its own */
  const ob=await openIn(p,'OB-1',false);
  const cls=await ob.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('#viewSeg button[data-view="class"]').click();await w(300);const ld=[...document.querySelectorAll('button')].find(b=>/Load a simulated check/i.test(b.textContent));if(ld)ld.click();await w(500);
    const o=window.__nbhFactsOut()||{};return {cls:!!o.classroom,ev:!!o.evidence};});
  const fc=await facts(p);
  ok('SC 11 OB-1\'s classroom check reaches the case as a part of its own (classroom, from OB-1), with no observation of the student in the record',cls.cls&&!cls.ev&&fc.classroom&&fc.src&&fc.src.classroom==='OB-1'&&Array.isArray(fc.classroom.checks)&&fc.classroom.checks.length>=1,{cls,src:fc.src&&fc.src.classroom});
  ok('SC 12 no page errors in the shell, DD-1, TI-1, OB-1 and the phone page',!errs.some(e=>/^SC/.test(e)),errs);
  await p.screenshot({path:path.join(OUT,'shell-sc.png')});await p.close();await c.close();
 }catch(e){ok('SC: the section ran to the end',false,String(e&&e.stack||e));}

 /* ---------------- PAD: the iPad and the laptop ---------------- */
 if(want('PAD'))try{
  for(const vp of [{w:1376,h:1032,n:'sideways',t:true},{w:1032,h:1376,n:'upright',t:true},{w:1440,h:900,n:'laptop',t:false}]){
   const c=await ctxFor(br,vp.w,vp.h,vp.t),p=await shell(c,'PAD '+vp.n);
   const cr=await openIn(p,'CR-1',false);
   await cr.evaluate(async d=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('#viewSeg button[data-view="tm"]').click();await w(150);document.getElementById('tmAddBaker').click();await w(150);
     const e=document.querySelector('[data-tmi="0"][data-tm="d"]');e.value=d;e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#viewSeg button[data-view="plan"]').click();},ago(1));
   await facts(p);await p.evaluate(()=>todayOpen());await sleep(900);
   const b=p.locator('#dlgBody .td-list li:has-text("Baker Act") button[data-open]');const bh=Math.round(((await b.boundingBox())||{height:0}).height);
   if(vp.t)await b.tap();else await b.click();await sleep(1500);
   const a=await cr.evaluate(()=>({go:document.querySelectorAll('.tm-card.tm-go').length,sw:document.documentElement.scrollWidth,iw:innerWidth}));const s0=await sw(p);
   ok('PAD '+vp.n+': Today\'s Open CR-1 ('+bh+' px) opens CR-1 at the event; no page-wide scroll in the shell or CR-1',a.go===1&&a.sw<=a.iw+1&&s0.sw<=s0.iw+1&&(!vp.t||bh>=44),{a,s0,bh});
   const dd=await openIn(p,'DD-1',false);
   /* Form TI-1's questions in the case, as TI-1 gives them */
   await p.evaluate(async()=>{const f=Object.assign({},state.facts||{});f.src=Object.assign({},f.src||{},{integrity:'TI-1'});
     f.integrity={criterion:90,obs:[],selfCheck:{who:'Simulated RBT',items:[{i:'k1',d:'Gave the break card before the demand'},{i:'k2',d:'Held the delay to its full length'},{i:'k3',d:'Praised the wait, naming it'}],src:'TI-1'}};
     setFacts(f,true);await new Promise(r=>setTimeout(r,800));});
   const d=await dd.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const tab=document.querySelector('[role=tab][data-tab="data"]');if(tab)tab.click();await w(300);
     const P=document.getElementById('ddStaff');const wi=P.querySelector('#stWho');wi.value='Simulated RBT';wi.dispatchEvent(new Event('input',{bubbles:true}));await w(50);
     const lab=document.querySelector('#stSc label.st-sc-on');if(lab)lab.scrollIntoView({block:'center'});await w(50);const r=lab?lab.getBoundingClientRect():{height:0,right:0};
     return {h:Math.round(r.height),right:Math.round(r.right),sw:document.documentElement.scrollWidth,iw:innerWidth,shown:!document.getElementById('stSc').hidden};});
   ok('PAD '+vp.n+': DD-1\'s "Ask the daily self-check" is 44 px and inside the screen; no page-wide scroll',d.shown&&d.h>=44&&d.right<=d.iw&&d.sw<=d.iw+1,d);
   await p.screenshot({path:path.join(OUT,'pad-'+vp.n+'.png')});await p.close();await c.close();}
  ok('PAD no page errors',!errs.some(e=>/^PAD/.test(e)),errs);
 }catch(e){ok('PAD: the section ran to the end',false,String(e&&e.stack||e));}

 await br.close();
 console.log('\nRESULT: '+(fails?fails+' of '+n+' failed':'all '+n+' passed'));process.exit(fails?1:0);
})();
