/* v25.67 the case home, the student switch and the folding Students/Forms column (the BCBA, 11/6: screens 1 and 7 of the case
   home mockup; design review H5 and B1). The BCBA's 13-inch iPad (1376 x 1032 sideways, 1032 x 1376 upright, touch, Safari's
   user agent) and an iPhone (390 x 844). A simulated case built from the forms' own simulations ("Sample Student"; IA-1, OB-1,
   SP-1, EA-1, FS-1, TD-1, DD-1, TI-1), kept on the device with two more simulated students (Sample Student B and C).
   1. no case: the caseload page as it was (the card, What's due, the students' cards), no case home, no column tabs, no
      switch;
   2. a card's Open lands on the case home (no form loaded, the case's forms waiting); a card's Open for one form still opens
      that form; the case home has no form row, nothing to type into;
   3. each panel shows only what the facts hold: one alert at most, from Today's rules (overdue or under a standard), its
      button opening the form that settles it; one line per form that handed the case a result (and FS-1's function);
      quick actions (Log it now opens Today's numbers for this student, Observe OB-1, Home data HD-1, Staff brief EB-1);
      Form DD-1's graph of the main target behavior with its phase line, baseline mean, last 5 days and the change, and
      the replacement behavior's; the function and each plan component; every line opens its form, and closing the last
      form shows the case home again;
   4. an empty case (the student's details only): the empty states, each with its Open button; no alert, no Log it now;
   5. the student switch: a button with aria-expanded; Find a student, the pinned students, then the ones opened recently,
      each with the trend chip, the current one marked; arrow keys, Escape closes and the focus comes back; 44 px targets;
      a choice goes through caseloadGo, which asks about unsaved work (Cancel keeps the case), then the other student's
      case home; the current student brings back the case home with the forms kept open;
   6. the column: the student line's button opens it on its Students tab (compact cards, pinned first, the current one
      marked) beside the stage at 1376 (the stage narrows), remembered across a reload; the Forms tab holds the list of
      forms itself (the same nodes: ids, ticks and opening a form work); the form row's Forms button and the left edge tab
      open it on the Forms tab; upright (1032) it opens over the case home and closes after a choice; the side rail keeps
      working, the column right of it;
   7. nothing of it prints, and the case file and the facts hold nothing of it;
   8. the phone: no switch, no column tabs, the name where it was; the case home is one column, nothing wider than the
      screen;
   9. no page errors.
   usage: WS_URL=http://127.0.0.1:8123 WS_ROOT=<worktree> node qa/v2567-casehome-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,passes=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(c)passes++;else fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const OUT=__dirname+'/out/v2567-casehome/';
const F=L.forms(),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const errs=[];
async function ctxFor(br,w,h,opt){opt=opt||{};const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500,userAgent:w<500?IPHONE:IPAD,serviceWorkers:'block',deviceScaleFactor:1});
  await ctx.addInitScript(o=>{try{if(window.top===window&&!sessionStorage.getItem('v2567ch')){sessionStorage.setItem('v2567ch','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    ['nbh.ws.pinbars','nbh.focus','nbh.ws.full','nbh.caseload.ini'].forEach(k=>localStorage.removeItem(k));
    if(o.nav)localStorage.setItem('nbh.ws.navmode',o.nav);else localStorage.removeItem('nbh.ws.navmode');if(o.rail)localStorage.setItem('nbh.ws.rail',o.rail);}}catch(e){}window.print=function(){window.__printed=(window.__printed||0)+1;};},opt);
  return ctx;}
async function start(ctx,tag){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);await stubs(p);return p;}
/* the questions answered as a test asks (window.__pick), each one kept (window.__asked) */
const stubs=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});window.__asked=[];window.__pick='keep';
  wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.choose=async t=>{window.__asked.push(String(t));return window.__pick;};wsUI.alert=async()=>{};}).catch(()=>{});
const shut=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});}).catch(()=>{});
const box=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect(),cs=getComputedStyle(e);return {x:Math.round(b.left),r:Math.round(b.right),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),pos:cs.position,vis:b.width>0&&b.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};},s);
const st=p=>p.evaluate(()=>({cur:state.cur,frames:Object.keys(state.frames),pending:Object.keys(state.pending),client:packet().client,home:document.body.classList.contains('ws-home'),hasForm:document.body.classList.contains('has-form'),
  shown:(()=>{const e=document.getElementById('caseHome');return !!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;})()}));
async function waitHome(p,ms){for(let i=0;i<(ms||20000)/250;i++){const s=await st(p);if(s.home&&s.shown&&(await p.evaluate(()=>document.querySelectorAll('#caseHome .ch-grid').length)))return s;await sleep(250);}return st(p);}
async function waitForm(p,id){for(let i=0;i<160;i++){const r=await p.evaluate(id=>state.cur===id&&!!state.status[id]&&!state.pending[id],id);if(r)return true;await sleep(250);}return false;}
/* close the form on screen with the form row's Close (the work kept in the case) */
async function closeIt(p){await p.evaluate(()=>{window.__pick='keep';document.getElementById('closeForm').click();});await sleep(1500);}
/* ---------- the simulated case, from the forms' own simulations ---------- */
const SIMS=['IA-1','OB-1','SP-1','EA-1','FS-1','TD-1','DD-1','TI-1'];
async function buildCase(p){
  await p.evaluate(async()=>{const L0=await clList();for(const r of L0||[])await clTx('readwrite',st=>st.delete(r.key));try{localStorage.removeItem('nbh.ws.recent@nbh');}catch(e){}
    const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('pClient','Sample Student');set('pSid','000000');set('pGrade','5');set('pSite','Sample Elementary');set('pBcba','Sample BCBA');});
  for(const id of SIMS){await p.evaluate(i=>openForm(i),id);await p.waitForFunction(i=>!!state.status[i],id,{timeout:60000}).catch(()=>{});await sleep(600);
    const fr=p.frames().find(x=>x.url().includes(FILE[id]));
    if(fr){await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;window.alert=()=>{};}).catch(()=>{});await L.loadSim(fr);await sleep(2200);
      await fr.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());}).catch(()=>{});}}
  return p.evaluate(async()=>{await gatherFacts(true);await new Promise(r=>setTimeout(r,800));const ok=await caseKeepOnly();const key=clKey(packet());
    const mk=(n,sid)=>{const pk={client:n,sid,site:'Sample Elementary',grade:'4'};const saved=new Date(Date.now()-864e5).toISOString();
      return {key:clKey(pk),scope:clScope(),client:pk.client,sid:pk.sid,site:pk.site,grade:pk.grade,bcba:'',saved,sum:{items:[],lastData:'',forms:1},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:pk,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}}})};};
    const b=mk('Sample Student B','000002'),c=mk('Sample Student C','000003');await clTx('readwrite',st=>{st.put(b);st.put(c);});
    clPinSet(key,true);state.lastSig=caseSig();await clearCase();await new Promise(r=>setTimeout(r,600));await paintBlank();
    return {ok,key,b:b.key,c:c.key,rec:JSON.stringify((await clList()).find(r=>r.key===key))};});}
const putRec=(p,rec)=>p.evaluate(async rec=>{const r=JSON.parse(rec);r.scope=clScope();await clTx('readwrite',st=>st.put(r));
  const mk=(n,sid)=>{const pk={client:n,sid,site:'Sample Elementary',grade:'4'};const saved=new Date(Date.now()-864e5).toISOString();
    return {key:clKey(pk),scope:clScope(),client:pk.client,sid:pk.sid,site:pk.site,grade:pk.grade,bcba:'',saved,sum:{items:[],lastData:'',forms:1},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:pk,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}}})};};
  await clTx('readwrite',st=>{st.put(mk('Sample Student B','000002'));st.put(mk('Sample Student C','000003'));});clPinSet(r.key,true);await paintBlank();return r.key;},rec);
(async()=>{const br=await L.chromium.launch();
  try{
  /* ================= the iPad sideways, the column folded ================= */
  const ctx=await ctxFor(br,1376,1032,{rail:'hidden'});const p=await start(ctx,'1376');
  const K=await buildCase(p);
  ok('0 the simulated case is kept on the iPad with two more simulated students',K.ok&&!!K.key&&!!K.rec,{ok:K.ok});
  /* 1. no case: the caseload page */
  const nc=await p.evaluate(()=>{const c=document.querySelector('#blank .card'),cl=document.getElementById('blankCl'),cs=getComputedStyle(document.getElementById('blank'));
    return {card:getComputedStyle(c).display!=='none'&&c.getBoundingClientRect().height>0,cl:!!cl&&!cl.hidden&&cl.offsetParent!==null,h2:(cl.querySelector('h2')||{}).textContent,cards:cl.querySelectorAll('.cl-card').length,
      due:!!cl.querySelector('.due-board,p'),btns:['blNew','blRead','blOpen','blCl'].every(id=>!!document.getElementById(id)),flex:cs.display,center:cs.textAlign,
      home:document.body.classList.contains('ws-home')||document.body.classList.contains('ws-case'),ch:document.getElementById('caseHome')?getComputedStyle(document.getElementById('caseHome')).display:'none',
      tabs:getComputedStyle(document.getElementById('chTabs')).display,packet:getComputedStyle(document.querySelector('nav.rail .rh-top>b')).display,colBtn:getComputedStyle(document.getElementById('chColBtn')).display};});
  ok('1 no case: the caseload page as it was (its card, "Your caseload", What\'s due, three students\' cards, its buttons, centred), no case home, no column tabs or switch',
    nc.card&&nc.cl&&/Your caseload/.test(nc.h2)&&nc.cards===3&&nc.due&&nc.btns&&nc.flex==='flex'&&nc.center==='center'&&!nc.home&&nc.ch==='none'&&nc.tabs==='none'&&nc.packet!=='none'&&nc.colBtn==='none',nc);
  await p.screenshot({path:OUT+'no-case-1376.png'});
  /* 2. a card's Open: the case home */
  await p.evaluate(k=>{const b=document.querySelector('#blankCl .cl-card[data-clrow="'+k.replace(/"/g,'\\"')+'"] .cl-card-acts [data-clopen]');b.click();},K.key);
  let s=await waitHome(p);await sleep(1200);await shut(p);
  const row=await p.evaluate(()=>({crumb:getComputedStyle(document.querySelector('.stagew>.crumb')).display,typed:document.querySelectorAll('#caseHome input,#caseHome textarea,#caseHome select,#caseHome [contenteditable]').length}));
  ok('2 a card\'s Open lands on the case home: no form loaded, the case\'s '+s.pending.length+' forms waiting, the student on the line',s.home&&s.shown&&s.cur===null&&s.frames.length===0&&s.pending.length>=8&&s.client==='Sample Student',s);
  ok('2 the case home has no form row over it and nothing to type into',row.crumb==='none'&&row.typed===0,row);
  await p.screenshot({path:OUT+'home-1376-folded.png'});
  /* 3. the panels */
  const P=await p.evaluate(()=>{const f=state.facts||{},H=document.getElementById('caseHome');
    const items=todayItems(),od=x=>/class="late"|\d+ days? overdue/.test(String(x.t||'')),need=items.filter(x=>TD_HOT.test(x.k)||x.k==='Integrity'||od(x));
    const al=[...H.querySelectorAll('.ch-alert')],a=al[0];
    const find=H.querySelector('[aria-labelledby="chFindH"]'),fr=[...find.querySelectorAll('.ch-row[data-chopen]')].map(b=>b.dataset.chopen);
    const ev=Object.keys(f.evidence||{}).concat(f.fn&&(f.fn.label||f.fn.key)?['FS-1']:[]);
    const d=f.data,up=b=>/replacement|acquisition|skill/i.test(b.kind||'')||b.direction==='increase',pts=b=>(b.series||[]).map(x=>+x.v).filter(x=>isFinite(x));
    const main=(d.behaviors||[]).find(b=>!up(b)&&pts(b).length),rep=(d.behaviors||[]).find(b=>/replacement/i.test(b.kind||'')&&pts(b).length);
    const l5=pts(main).slice(-5),last5=l5.reduce((s,x)=>s+x,0)/l5.length,base=+main.base.mean,pct=(last5-base)/base*100;
    const gM=H.querySelector('[aria-labelledby="chGM"]'),gR=H.querySelector('[aria-labelledby="chGR"]');
    const stats=g=>[...g.querySelectorAll('.ch-st')].map(x=>({v:x.querySelector('b').textContent,l:x.querySelector('span').textContent,c:x.className}));
    const plan=H.querySelector('[aria-labelledby="chPlanH"]'),pl=f.plan||{},nComp=(pl.antCards||[]).length+(pl.teach||[]).length+(pl.sched||[]).length+(pl.respond&&pl.respond.target?1:0);
    const acts=[...H.querySelectorAll('.ch-acts button')].map(b=>(b.dataset.chopen||(b.dataset.chday?'day':''))+':'+b.querySelector('b').textContent);
    return {nAl:al.length,alT:a&&a.querySelector('.ch-at').textContent,alH:a&&a.querySelector('h3').textContent,alBtn:a&&(a.querySelector('[data-chopen]')||{}).dataset,
      need:need.map(x=>({k:x.k,t:x.t.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,'').slice(0,80),open:x.open})),rankOK:!!a&&need.length>0,
      fr,ev,mainName:main.name,mainH:gM.querySelector('h3').textContent,stM:stats(gM),base,last5,pct,phases:gM.querySelectorAll('svg line[stroke-dasharray="4 4"]').length,conds:(d.conds||[]).map(c=>c.name),
      condTxt:[...gM.querySelectorAll('svg text')].map(t=>t.textContent),repName:rep&&rep.name,repH:gR&&gR.querySelector('h3').textContent,stR:gR?stats(gR):null,
      fn:(plan.querySelector('.ch-fn')||{}).textContent,fnLabel:f.fn&&f.fn.label,comp:plan.querySelectorAll('.ch-list .ch-row').length,nComp,chk:plan.querySelectorAll('.ch-pill.chk').length,acts,
      opens:[...H.querySelectorAll('button')].filter(b=>!b.dataset.chopen&&!b.dataset.chday&&!b.dataset.chtoday).length,docs:/Documents/.test(H.textContent),when:/When .* happens/.test(H.textContent)};});
  const rk=['Overdue','Safety','Injury','Removals','Decision','Timeline','Due','Home','Data','Integrity','Aim'];
  const want=P.need.slice().sort((a,b)=>(/overdue/.test(a.t)&&!/^(Overdue|Safety|Injury|Removals)$/.test(a.k)?0:rk.indexOf(a.k))-(/overdue/.test(b.t)&&!/^(Overdue|Safety|Injury|Removals)$/.test(b.k)?0:rk.indexOf(b.k)))[0];
  ok('3a one alert, amber, from Today\'s rules (overdue, safety, or under a standard): "'+(P.alH||'')+'", its button opens '+(P.alBtn&&P.alBtn.chopen),P.nAl===1&&!!want&&P.alT.replace(/\s+/g,' ').indexOf(want.t.replace(/\s+/g,' ').slice(0,40))>=0&&P.alBtn&&P.alBtn.chopen===want.open,{P:{nAl:P.nAl,alT:P.alT,alBtn:P.alBtn},want,need:P.need});
  ok('3b what the assessments found: one line for each form that handed the case a result, and no other ('+P.fr.join(', ')+')',P.fr.length===P.ev.length&&P.ev.every(x=>P.fr.includes(x)),{fr:P.fr,ev:P.ev});
  const stv=k=>(P.stM.find(x=>x.l.includes(k))||{}).v||'';const r1=x=>String(Math.round(x*10)/10);
  ok('3c DD-1\'s graph of the main target behavior ('+P.mainName+'): the phase line between '+P.conds.join(' and ')+', baseline mean '+stv('mean')+', last 5 days '+stv('last 5')+', change '+stv('change')+' (green: moving the right way)',
    P.mainH.indexOf(P.mainName)===0&&P.phases===P.conds.length-1&&P.conds.every(c=>P.condTxt.some(t=>t===c||c.indexOf(t.replace(/\u2026$/,''))===0))&&stv('mean')===r1(P.base)&&stv('last 5')===r1(P.last5)&&stv('change').replace('\u2212','-')===(P.pct>0?'+':'')+Math.round(P.pct)+'%'&&(P.stM.find(x=>x.l==='change')||{}).c.includes(P.pct<0?'gd':'bd'),P);
  ok('3c and the replacement behavior\'s graph ('+P.repName+') under it',!!P.repName&&P.repH.indexOf(P.repName)===0&&P.stR&&P.stR.length>=2,{repName:P.repName,repH:P.repH,stR:P.stR});
  ok('3d the function ('+P.fnLabel+') and each of the plan\'s '+P.nComp+' components with its status; Form TI-1\'s check under its criterion as a Check',P.fn===P.fnLabel&&P.comp===P.nComp+(P.chk?1:0)&&P.chk>=1,{fn:P.fn,fnLabel:P.fnLabel,comp:P.comp,nComp:P.nComp,chk:P.chk});
  ok('3e quick actions: Log it now, Observe (OB-1), Home data (HD-1), Staff brief (EB-1)',JSON.stringify(P.acts)===JSON.stringify(['day:Log it now','OB-1:Observe','HD-1:Home data','EB-1:Staff brief']),P.acts);
  ok('3f no panel the case has no data for: no Documents list, no "When it happens" grid (SP-1 hands no day-by-period counts); every button opens a form or Today',!P.docs&&!P.when&&P.opens===0,{docs:P.docs,when:P.when,opens:P.opens});
  /* every panel opens its form; closing the last form brings the case home back */
  const opened={};
  for(const [sel,id] of [['.ch-alert [data-chopen]',P.alBtn&&P.alBtn.chopen],['[aria-labelledby="chFindH"] .ch-row[data-chopen="OB-1"]','OB-1'],['.ch-graph[data-chopen="DD-1"]','DD-1'],['[aria-labelledby="chPlanH"] .ch-row[data-chopen="FS-1"]','FS-1'],['.ch-acts [data-chopen="HD-1"]','HD-1']]){
    await p.locator('#caseHome '+sel).first().tap();const f=await waitForm(p,id);await sleep(800);opened[id]=f;await closeIt(p);const h=await waitHome(p,15000);opened[id+' back']=h.home&&h.shown&&h.cur===null;
    if(!opened[id+' back'])opened[id+' state']=JSON.stringify(Object.assign(h,{asked:await p.evaluate(()=>window.__asked.slice(-2))}));}
  ok('3g each panel opens its form (the alert\'s, OB-1 from the findings, DD-1 from the graph, FS-1 from the plan, HD-1 from the actions), and closing the last form shows the case home again',Object.values(opened).every(Boolean),opened);
  await p.locator('#caseHome [data-chday]').tap();await sleep(1500);
  const dy=await p.evaluate(()=>({open:document.getElementById('dlg').open,t:document.getElementById('dlgTitle').textContent,who:(document.getElementById('dyWho')||{}).value,me:clKey(packet()),rows:document.querySelectorAll('#dyRows tr[data-dyt]').length}));
  ok('3h Log it now opens the caseload card\'s Today\'s numbers for this student, with DD-1\'s counted targets ('+dy.rows+')',dy.open&&/Today.s numbers/.test(dy.t)&&dy.who===dy.me&&dy.rows>=1,dy);
  await shut(p);
  /* a card's Open for one form still opens that form */
  await p.evaluate(async k=>{await clearCase();},K.key);await sleep(800);await p.evaluate(k=>caseloadGo(k,'DD-1'),K.key);const dd=await waitForm(p,'DD-1');s=await st(p);
  ok('2b a card\'s Open for one form (Open DD-1) still opens that form, alone',dd&&s.cur==='DD-1'&&s.frames.join()==='DD-1'&&!s.home,s);
  await closeIt(p);s=await waitHome(p,8000);ok('2c closing it shows the case home',s.home&&s.shown,s);
  /* 7. nothing prints; the case file and the facts hold nothing of it */
  const fk0=await p.evaluate(()=>JSON.stringify(state.facts));
  await p.evaluate(()=>window.__wsCH.paint());await sleep(300);
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>['#caseHome','#chSwPop','#chColBtn','#chWho','#chTabs','#chStu'].map(s=>{const e=document.querySelector(s);return s+':'+(e?(e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none'?'shown':'none'):'absent');}));
  await p.emulateMedia({media:'screen'});
  const kept=await p.evaluate(async fk0=>{const k=await caseKeepOnly();const r=(await clList()).find(x=>x.key===clKey(packet()));const t=r?r.text:'';return {k,fk:JSON.stringify(state.facts)===fk0,has:/caseHome|ch-alert|ch-graph|ch-row|chSwPop/.test(t),facts:Object.keys(state.facts||{}).filter(x=>/^ch|home/i.test(x))};},fk0);
  ok('7 nothing of it prints (the case home, the switch, the column\'s tabs and students), and the case file and the facts hold nothing of it',pr.every(x=>/:(none|absent)$/.test(x))&&kept.fk&&!kept.has&&!kept.facts.length,{pr,kept});
  /* 4. an empty case */
  const E=await p.evaluate(async()=>{const pk={client:'Sample Student E',sid:'000005',grade:'3',site:'Sample Elementary',bcba:'Sample BCBA'},saved=new Date().toISOString();
    await clTx('readwrite',st=>st.put({key:clKey(pk),scope:clScope(),client:pk.client,sid:pk.sid,site:pk.site,grade:pk.grade,bcba:pk.bcba,saved,sum:{items:[],lastData:'',forms:0},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:pk,forms:{}})}));return clKey(pk);});
  await p.evaluate(()=>{window.__pick='switch';});await p.evaluate(k=>caseloadGo(k,''),E);s=await waitHome(p);await sleep(800);await shut(p);
  const em=await p.evaluate(()=>{const H=document.getElementById('caseHome'),t=H.textContent,b=[...H.querySelectorAll('button')].map(x=>x.dataset.chopen||(x.dataset.chday?'day':'')||x.textContent);
    return {al:H.querySelectorAll('.ch-alert').length,t:/No assessment has handed the case a result yet/.test(t)&&/No days of data from Form DD-1 yet/.test(t)&&/No function written yet/.test(t)&&/No plan written yet/.test(t),b,graphs:H.querySelectorAll('.ch-graph').length};});
  ok('4 an empty case: the empty states (no result, no DD-1 data, no function, no plan), each with its Open button; no alert, no Log it now, no Staff brief, no graph',
    s.home&&em.al===0&&em.t&&['IA-1','OB-1','DD-1','FS-1','TD-1'].every(x=>em.b.includes(x))&&!em.b.includes('day')&&!em.b.includes('EB-1')&&em.graphs===0,{s,em});
  await p.screenshot({path:OUT+'home-1376-empty.png'});
  /* 5. the student switch */
  await p.evaluate(k=>caseloadGo(k,''),K.b);await waitHome(p);await sleep(500);await p.evaluate(k=>caseloadGo(k,''),K.key);await waitHome(p);await sleep(1200);await shut(p);
  const w0=await box(p,'#chWho');
  await p.locator('#chWho').tap();await sleep(1200);
  const sw=await p.evaluate(()=>{const P=document.getElementById('chSwPop'),hs=[...P.querySelectorAll('.ch-gh')].map(h=>h.textContent),lists=[...P.querySelectorAll('.ch-sl')].map(u=>[...u.querySelectorAll('.ch-si')].map(b=>({n:b.querySelector('.ch-nm').textContent,cur:b.getAttribute('aria-current'),chip:(b.querySelector('.ch-chip')||{}).textContent,cls:(b.querySelector('.ch-chip')||{}).className,h:Math.round(b.getBoundingClientRect().height)})));
    const w=document.getElementById('chWho');return {exp:w.getAttribute('aria-expanded'),pop:w.getAttribute('aria-haspopup'),vis:!P.hidden&&P.getBoundingClientRect().height>0,hs,lists,find:!!P.querySelector('input[type=search]')&&P.querySelector('input').placeholder,
      all:(P.querySelector('#chSwAll')||{}).textContent,inside:P.contains(document.activeElement),allH:Math.round(P.querySelector('#chSwAll').getBoundingClientRect().height),findH:Math.round(P.querySelector('.ch-find').getBoundingClientRect().height)};});
  ok('5a the name is a button with ▾ (aria-expanded, 44 px or more): its panel has Find a student, the pinned students, then the ones opened recently, and All students (Caseload) at the foot',
    w0&&w0.h>=44&&sw.exp==='true'&&sw.pop==='dialog'&&sw.vis&&sw.find==='Find a student'&&JSON.stringify(sw.hs)==='["Pinned","Opened recently"]'&&/^All students \(Caseload\)/.test(sw.all)&&sw.inside,{w0,sw});
  const pin=sw.lists[0]||[],rec=sw.lists[1]||[];
  ok('5b pinned: Sample Student, marked as the one on screen, with the trend chip ('+(pin[0]&&pin[0].chip)+', green); opened recently, the latest first: Sample Student B ('+(rec[0]&&rec[0].chip)+'), then Sample Student E; every row 44 px or more',
    pin.length===1&&pin[0].n.indexOf('Sample Student')===0&&pin[0].cur==='true'&&/^[\u2212+]\d+%$/.test(pin[0].chip)&&/gd/.test(pin[0].cls)&&rec.map(x=>x.n).join()==='Sample Student B,Sample Student E'&&rec[0].chip==='no data'&&pin.concat(rec).every(x=>x.h>=44)&&sw.allH>=44&&sw.findH>=44,sw);
  const k1=await p.evaluate(()=>document.activeElement&&document.activeElement.textContent);await p.keyboard.press('ArrowDown');await sleep(150);const k2=await p.evaluate(()=>document.activeElement&&document.activeElement.textContent);
  await p.keyboard.press('Escape');await sleep(300);const esc=await p.evaluate(()=>({hid:document.getElementById('chSwPop').hidden,exp:document.getElementById('chWho').getAttribute('aria-expanded'),focus:document.activeElement&&document.activeElement.id}));
  ok('5c the arrow keys move through the list; Escape closes it and the focus comes back to the name',k1!==k2&&esc.hid&&esc.exp==='false'&&esc.focus==='chWho',{k1,k2,esc});
  await p.locator('#chWho').tap();await sleep(800);await p.locator('#chSwFind').fill('Student C');await sleep(400);
  const fd=await p.evaluate(()=>[...document.querySelectorAll('#chSwPop .ch-si .ch-nm')].map(x=>x.textContent));
  ok('5d Find a student searches the caseload: "Student C" finds Sample Student C alone',JSON.stringify(fd)==='["Sample Student C"]',fd);
  /* a choice goes through caseloadGo, which asks about unsaved work */
  await p.keyboard.press('Escape');await sleep(200);
  await p.evaluate(()=>openForm('CN-1'));await waitForm(p,'CN-1');await sleep(1200);
  await p.evaluate(()=>{const w=state.frames['CN-1'].contentWindow;const i=[...w.document.querySelectorAll('textarea')].find(x=>!x.readOnly&&!x.disabled&&x.offsetParent!==null);i.value='SIMULATED note';i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(5000);
  await p.evaluate(()=>{window.__calls=[];const g=caseloadGo;window.__cg=g;caseloadGo=async function(k,f){window.__calls.push([k,f]);return g.apply(this,arguments);};window.__asked=[];window.__pick='';});
  await p.locator('#chWho').tap();await sleep(800);await p.locator('#chSwFind').fill('Student C');await sleep(300);await p.locator('#chSwPop .ch-si').first().tap();await sleep(2500);
  const c1=await p.evaluate(()=>({calls:window.__calls.slice(),asked:window.__asked.slice(),client:packet().client,dirty:caseDirty(),cur:state.cur}));
  ok('5e a choice goes through caseloadGo, which asks about the unsaved work; Cancel keeps the case and the form',c1.calls.length===1&&c1.calls[0][1]===''&&c1.asked.length===1&&/^Switch to Sample Student C/.test(c1.asked[0])&&c1.client==='Sample Student'&&c1.cur==='CN-1',c1);
  await p.evaluate(()=>{window.__asked=[];window.__pick='switch';});
  await p.locator('#chWho').tap();await sleep(800);await p.locator('#chSwFind').fill('Student C');await sleep(300);await p.locator('#chSwPop .ch-si').first().tap();s=await waitHome(p);await sleep(1000);await shut(p);
  const c2=await p.evaluate(()=>({calls:window.__calls.length,client:packet().client}));
  ok('5f Switch anyway: Sample Student C\'s case home',c2.calls===2&&c2.client==='Sample Student C'&&s.home&&s.cur===null,{c2,s});
  /* the student on screen: back to the case home, the forms kept */
  await p.evaluate(()=>{caseloadGo=window.__cg;window.__pick='switch';});await p.evaluate(k=>caseloadGo(k,''),K.key);await waitHome(p);await sleep(600);await shut(p);
  await p.evaluate(()=>openForm('OB-1'));await waitForm(p,'OB-1');await sleep(800);
  await p.locator('#chWho').tap();await sleep(800);await p.locator('#chSwPop .ch-si[aria-current="true"]').tap();s=await waitHome(p,8000);
  ok('5g the student on screen chosen: back to the case home, the form kept open (not closed)',s.home&&s.cur===null&&s.frames.includes('OB-1'),s);
  /* 6. the column */
  const c0=await box(p,'#caseHome');
  await p.locator('#chColBtn').tap();await sleep(1500);
  const col=await p.evaluate(()=>{const n=document.getElementById('railNav'),r=n.getBoundingClientRect(),b=document.getElementById('blank').getBoundingClientRect(),cs=getComputedStyle(n);
    const cards=[...document.querySelectorAll('#chStu .ch-sc')].map(c=>({n:c.querySelector('.ch-nm').textContent,cur:c.getAttribute('aria-current'),chip:(c.querySelector('.ch-chip')||{}).textContent,h:Math.round(c.getBoundingClientRect().height)}));
    return {exp:document.getElementById('chColBtn').getAttribute('aria-expanded'),tab:document.getElementById('chTabS').getAttribute('aria-selected'),stu:document.getElementById('chStu').offsetParent!==null,forms:document.getElementById('rail').offsetParent!==null,
      pos:cs.position,vis:cs.visibility,x:[Math.round(r.left),Math.round(r.right)],blankL:Math.round(b.left),cards,heads:[...document.querySelectorAll('#chStu .ch-gh')].map(h=>h.textContent),kept:(()=>{try{return localStorage.getItem('nbh.ws.rail');}catch(e){return null;}})()};});
  const c1b=await box(p,'#caseHome');
  ok('6a the student line\'s button opens the column on its Students tab, beside the stage at 1376 ('+col.x.join('–')+' px; the case home '+c0.w+' → '+c1b.w+' px wide)',col.exp==='true'&&col.tab==='true'&&col.stu&&!col.forms&&col.pos==='static'&&col.vis==='visible'&&col.x[0]===0&&col.x[1]>=280&&col.x[1]<=340&&col.blankL>=col.x[1]-1&&c1b.w<c0.w-200,{col,c0,c1b});
  ok('6b Students: the caseload as compact cards, pinned first, the one on screen marked, each with its trend chip; 44 px or more',col.cards.length===4&&col.cards[0].n==='Sample Student'&&col.cards[0].cur==='true'&&col.heads[0]==='Pinned'&&col.cards.every(c=>!!c.chip&&c.h>=44),col);
  await p.screenshot({path:OUT+'home-1376-open.png'});
  await p.reload();await sleep(3000);await stubs(p);
  const kept1=await p.evaluate(()=>({hidden:document.body.classList.contains('rail-hidden'),k:localStorage.getItem('nbh.ws.rail')}));
  await p.evaluate(k=>caseloadGo(k,''),K.key);await waitHome(p);await sleep(800);await shut(p);
  await p.locator('#chColBtn').tap();await sleep(800);
  const fold=await p.evaluate(()=>({hidden:document.body.classList.contains('rail-hidden'),k:localStorage.getItem('nbh.ws.rail'),exp:document.getElementById('chColBtn').getAttribute('aria-expanded')}));
  await p.reload();await sleep(3000);await stubs(p);const kept2=await p.evaluate(()=>({hidden:document.body.classList.contains('rail-hidden'),k:localStorage.getItem('nbh.ws.rail')}));
  ok('6c the iPad remembers the column open or folded across a reload',!kept1.hidden&&kept1.k==='shown'&&fold.hidden&&fold.exp==='false'&&kept2.hidden&&kept2.k==='hidden',{kept1,fold,kept2});
  await p.evaluate(k=>caseloadGo(k,''),K.key);await waitHome(p);await sleep(800);await shut(p);
  await p.locator('#chColBtn').tap();await sleep(800);await p.locator('#chTabF').tap();await sleep(500);
  const ft=await p.evaluate(()=>({tab:document.getElementById('chTabF').getAttribute('aria-selected'),rail:document.getElementById('rail').offsetParent!==null,moved:!!document.querySelector('#railNav > #chForms > .railhead')&&!!document.querySelector('#railNav > #chForms > #rail'),
    ids:['railFind','tickUsed','tickNone','packetOpts','tickCount','railHide'].every(id=>!!document.getElementById(id)),items:document.querySelectorAll('#rail .item').length,stu:document.getElementById('chStu').offsetParent!==null}));
  await p.locator('#rail .item[data-id="DM-1"] [data-tick]').tap();await sleep(300);const tk=await p.evaluate(()=>!!state.ticked['DM-1']);
  await p.locator('#rail .item[data-id="GB-1"] button.open').tap();const gb=await waitForm(p,'GB-1');
  ok('6d the Forms tab holds the list of forms itself (its nodes moved: '+ft.items+' forms, the same ids); a tick and a tap on a form work there',ft.tab==='true'&&ft.rail&&ft.moved&&ft.ids&&ft.items>=45&&!ft.stu&&tk&&gb,{ft,tk,gb});
  /* the form row's Forms button and the left edge tab open the column on its Forms tab */
  await p.evaluate(()=>{window.__wsCH.setTab('stu');setRailHidden(true);});await sleep(400);
  await p.locator('#railToggle').tap();await sleep(500);const e1=await p.evaluate(()=>({open:!document.body.classList.contains('rail-hidden'),tab:window.__wsCH.tab(),rail:document.getElementById('rail').offsetParent!==null}));
  await p.evaluate(()=>{window.__wsCH.setTab('stu');setRailHidden(true);});await sleep(400);
  await p.locator('#railEdge').tap();await sleep(500);const e2=await p.evaluate(()=>({open:!document.body.classList.contains('rail-hidden'),tab:window.__wsCH.tab(),rail:document.getElementById('rail').offsetParent!==null}));
  ok('6e the form row\'s Forms button and the left edge tab open the column on its Forms tab',e1.open&&e1.tab==='forms'&&e1.rail&&e2.open&&e2.tab==='forms'&&e2.rail,{e1,e2});
  await closeIt(p);await sleep(500);
  await ctx.close();
  /* ================= upright: over the case home ================= */
  const cu=await ctxFor(br,1032,1376,{});const q=await start(cu,'1032');const kq=await putRec(q,K.rec);
  await q.evaluate(k=>caseloadGo(k,''),kq);let sq=await waitHome(q);await sleep(1000);await shut(q);
  const u0=await q.evaluate(()=>({open:document.body.classList.contains('rail-open'),scrim:!document.getElementById('railScrim').hidden}));
  await q.screenshot({path:OUT+'home-1032-folded.png'});
  await q.locator('#chColBtn').tap();await sleep(900);
  const u1=await q.evaluate(()=>{const n=document.getElementById('railNav'),cs=getComputedStyle(n),r=n.getBoundingClientRect(),b=document.getElementById('blank').getBoundingClientRect(),sc=document.getElementById('railScrim');
    return {open:document.body.classList.contains('rail-open'),pos:cs.position,vis:cs.visibility,x:[Math.round(r.left),Math.round(r.right)],blankL:Math.round(b.left),scrim:!sc.hidden&&getComputedStyle(sc).display!=='none',tab:window.__wsCH.tab()};});
  await q.screenshot({path:OUT+'home-1032-open.png'});
  await q.locator('#chStu .ch-sc',{hasText:'Sample Student B'}).tap();sq=await waitHome(q);await sleep(800);
  const u2=await q.evaluate(()=>({open:document.body.classList.contains('rail-open'),client:packet().client}));
  ok('6f upright (1032): the case home opens with the column put away; the button opens it over the stage (the stage keeps its width, a scrim behind); a choice closes it',
    sq.home&&!u0.open&&u1.open&&u1.pos==='absolute'&&u1.vis==='visible'&&u1.blankL===0&&u1.scrim&&u1.tab==='stu'&&!u2.open&&u2.client==='Sample Student B',{u0,u1,u2});
  const g2=await q.evaluate(()=>{const C=[...document.querySelectorAll('#caseHome .ch-col')].map(c=>Math.round(c.getBoundingClientRect().left));return {cols:[...new Set(C)].length,sw:document.documentElement.scrollWidth-innerWidth};});
  ok('6g upright the case home is two columns, nothing wider than the screen',g2.cols===2&&g2.sw<=0,g2);
  await cu.close();
  /* ================= the side rail ================= */
  const cr=await ctxFor(br,1376,1032,{nav:'rail',rail:'hidden'});const r=await start(cr,'rail');const kr=await putRec(r,K.rec);
  await r.evaluate(k=>caseloadGo(k,''),kr);await waitHome(r);await sleep(900);await shut(r);
  await r.locator('#chColBtn').tap();await sleep(900);
  const sr=await r.evaluate(()=>{const n=document.getElementById('railNav').getBoundingClientRect(),w=document.getElementById('wsNav').getBoundingClientRect(),b=document.getElementById('blank').getBoundingClientRect();
    return {rail:document.body.classList.contains('ws-navrail'),navR:Math.round(w.right),colL:Math.round(n.left),colR:Math.round(n.right),blankL:Math.round(b.left),tab:window.__wsCH.tab(),stu:document.querySelectorAll('#chStu .ch-sc').length};});
  ok('6h the side rail keeps working: the column sits right of the rail, the stage right of the column',sr.rail&&sr.colL>=sr.navR-1&&sr.blankL>=sr.colR-1&&sr.tab==='stu'&&sr.stu===3,sr);
  await r.screenshot({path:OUT+'home-1376-siderail.png'});
  await cr.close();
  /* ================= the phone ================= */
  const cp=await ctxFor(br,390,844,{});const ph=await start(cp,'390');const kp=await putRec(ph,K.rec);
  const p0=await ph.evaluate(()=>({blank:getComputedStyle(document.querySelector('#blank .card')).display,cl:document.querySelectorAll('#blankCl .cl-card').length}));
  await ph.evaluate(k=>caseloadGo(k,''),kp);await waitHome(ph);await sleep(1200);await shut(ph);
  const pp=await ph.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none';};
    const L=[...document.querySelectorAll('#caseHome .ch-p,#caseHome .ch-alert,#caseHome .ch-o2')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.width)];});
    return {wsa:document.body.classList.contains('ws-a'),who:v('#chWho'),col:v('#chColBtn'),tabs:v('#chTabs'),nameIn:document.getElementById('sumName').parentElement.id,bar:v('#phoneBar'),home:v('#caseHome'),
      lefts:[...new Set(L.map(x=>x[0]))],widths:[...new Set(L.map(x=>x[1]))],n:L.length,sw:document.documentElement.scrollWidth-innerWidth,wide:[...document.querySelectorAll('#caseHome *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length};});
  ok('8 the phone: no switch and no column tabs (the name where it was, the phone\'s own bar along the bottom); the case home one column, nothing wider than the screen',
    p0.blank!=='none'&&!pp.wsa&&!pp.who&&!pp.col&&!pp.tabs&&pp.nameIn==='barSum'&&pp.bar&&pp.home&&pp.lefts.length===1&&pp.widths.length===1&&pp.n>=5&&pp.sw<=0&&pp.wide===0,{p0,pp});
  await ph.screenshot({path:OUT+'home-390.png'});
  await cp.close();
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  ok('9 no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failed, '+passes+' passed':'RESULT: all passed ('+passes+')');process.exit(fails?1:0);})();
