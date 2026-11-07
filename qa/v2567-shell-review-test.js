/* v25.68 the design review's shell group (the BCBA, 11/6: every recommendation "build"; S/designrev/REPORT.md), one or more
   checks an item, each proving the Change. The BCBA's 13-inch iPad (1376 x 1032 sideways, 1032 x 1376 upright, touch,
   Safari's user agent) and an iPhone (390 x 844). Simulated data only: "Sample Student" in the bar and the forms' own
   simulations (DM-1, DD-1, TD-1).
   H1  the indicator reports the case file ("Not saved to a file …", "Case saved 2:14"); its panel: the case file, then the
       safety copy in this browser (Autosave), then this form; Save form is Export this form in View
   M18 Save case's name says "changes not saved" while they are not, and the live region says it once
   L1  Today's count after its label; upright the indicator keeps one word
   M1  the form row: the code and the short name, the full name in the tooltip; no field count; Next only when it fits
   H2  sideways under 1500 px on touch, opening a form puts the list away; opened by hand it stays beside the form (11/6);
       a form of 6 sheets or fewer shows no sheet column of its own; past 6, a 180 px column
   M6  with that column showing the edge tab steps aside; each sheet's mark has words for VoiceOver; a legend
   B3  the open form's sheets under it in the list, the current one marked, each with its state; a tap goes there
   M5  the print ticks only while choosing forms for the packet; each form's state in words; the different-name mark last
   M10 Build packet with nothing chosen opens the choosing; a file that is not a case says why and what to do
   H6  "graph" finds DD-1 (not Demographics), keywords find their forms, the match in bold, a misspelling "did you mean"
   M7  one toast at a time, bottom left of the stage, 6 s, a 44 px close, a one-line summary with View, hidden while a
       dialog is open (the message goes into the dialog); a form's toast on screen comes to it and is kept in the form's
       status ("What changed in this form")
   H4  one notice at a time with "1 of 2 ▸"; after the first look a chip on the student line; in Fullscreen only the chip
   H7  no Packet menu; Save and Open student details in Case; the list's heading Forms; Build packet; the phone's Student
   M2  Today's buttons in three groups (Record, Send and print, Check the case); no Caseload; nothing without a case
   M3  Caseload: the settings behind a gear; the empty state with Open case; Remove in a card's menu, as destructive
   M4  Log incident on the student line; the case's targets as buttons, Other a text box; the time filled; the checkbox
       and its words on one row
   M11 an iPad in Safari: Save case hands the file to the share sheet (no question); without it the download asks "Is the
       file in Files?" once a session
   B4  after the share sheet the indicator says "Saved to Files"
   L3  Focus's bar in the sheet's words; L4 Fullscreen's buttons with words from 1000 px; L6 1 occurrence
   H3  upright, TD-1's answers go under the question when the row is under 600 px (container queries)
   Docs the case home's Documents panel: the packet's print window and Finish PDF each add a line to the case (form, title,
       when, how), kept in the case file; a form's own print adds none (the BCBA, 11/6); the dated papers before any; All
       documents
   M8, L8 the phone: the name and one menu at the top (two lines), Forms, Today, Log and More at the foot, the form near
       the top, Save case and its dot in More
   usage: WS_URL=http://127.0.0.1:8123 WS_ROOT=<worktree> node qa/v2567-shell-review-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,passes=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(c)passes++;else fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const OUT=__dirname+'/out/v2567-shell-review/';
const F=L.forms(),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const errs=[];
async function ctxFor(br,w,h){const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500,userAgent:w<500?IPHONE:IPAD,serviceWorkers:'block',deviceScaleFactor:1});
  await ctx.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2568')){sessionStorage.setItem('v2568','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    ['nbh.ws.pinbars','nbh.focus','nbh.ws.full','nbh.ws.rail','nbh.ws.navmode','nbh.railoff'].forEach(k=>localStorage.removeItem(k));}}catch(e){}window.print=function(){window.__printed=(window.__printed||0)+1;};});
  return ctx;}
async function start(ctx,tag){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);await shut(p);return p;}
const shut=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});try{__wsA.shut();__wsNav.shut();}catch(e){}}).catch(()=>{});
const box=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect(),cs=getComputedStyle(e);return {x:Math.round(b.left),r:Math.round(b.right),y:Math.round(b.top),b:Math.round(b.bottom),w:Math.round(b.width),h:Math.round(b.height),pos:cs.position,vis:b.width>0&&b.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};},s);
const frameOf=(p,id)=>p.frames().find(f=>decodeURIComponent(f.url()).includes(FILE[id]));
async function waitForm(p,id){for(let i=0;i<160;i++){if(await p.evaluate(id=>state.cur===id&&!!state.status[id]&&!state.pending[id],id))return true;await sleep(250);}return false;}
async function openSim(p,id){await p.evaluate(i=>openForm(i),id);await waitForm(p,id);await sleep(900);const fr=frameOf(p,id);if(!fr)return null;
  await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;}).catch(()=>{});await L.loadSim(fr);await sleep(700);
  await fr.evaluate(()=>{const d=[...document.querySelectorAll('dialog')].find(x=>x.open);if(!d)return;const bs=[...d.querySelectorAll('button')].filter(b=>b.offsetParent);const b=bs.find(b=>/^(load|yes|replace|continue|ok)/i.test(b.textContent.trim()))||bs[bs.length-1];if(b)b.click();}).catch(()=>{});
  await sleep(2200);return fr;}
async function setBar(p){await p.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('pClient','Sample Student');set('pSid','900001');set('pGrade','4');set('pSite','Sample Elementary');set('pBcba','Sample BCBA');const b=document.getElementById('barFold');if(b&&b.offsetParent)b.click();});await sleep(500);}
const noToasts=p=>p.evaluate(()=>{document.querySelectorAll('#wsToasts > *').forEach(t=>t.remove());});
(async()=>{const br=await L.chromium.launch();
  try{
  /* ================= the iPad sideways ================= */
  const ctx=await ctxFor(br,1376,1032);const p=await start(ctx,'1376');
  /* H7 before a student: the list's heading, the menus, Build packet */
  const h7=await p.evaluate(()=>({head:document.querySelector('#railNav .rh-top>b').textContent,lab:document.getElementById('railNav').getAttribute('aria-label'),menus:[...document.querySelectorAll('#wsNav [data-wn-menu]')].map(b=>b.dataset.wnMenu),
    mp:document.getElementById('masterPrint').textContent,find:[__wsNav.find('savePacket'),__wsNav.find('openPacket')],sp:document.getElementById('savePacket').textContent,op:document.getElementById('openPacket').textContent}));
  await p.locator('#wsNav [data-wn-menu="case"]').tap();await sleep(300);const caseMenu=await p.evaluate(()=>[...document.querySelectorAll('#wsNavMenu button')].map(b=>b.textContent));await shut(p);
  ok('H7 "packet" means the printed document only: no Packet menu (Case and Tools), the list\'s heading "Forms" ("Forms in this case"), Build packet; Save and Open student details are in Case',
    h7.head==='Forms'&&h7.lab==='Forms in this case'&&!h7.menus.includes('packet')&&h7.menus.includes('case')&&h7.mp==='Build packet'&&h7.find.every(x=>x==='case')&&caseMenu.includes('Save student details')&&caseMenu.includes('Open student details'),{h7,caseMenu});
  /* M2 Today with nothing to go on: no group of buttons */
  await p.evaluate(()=>todayOpen());await sleep(1500);const td0=await p.evaluate(()=>({g:[...document.querySelectorAll('#dlgBody .sr-tg:not([hidden])')].map(s=>s.querySelector('h3').textContent),btn:document.querySelectorAll('#dlgBody button').length}));await shut(p);
  ok('M2 Today with no case: the groups that need data are left out',td0.g.length===0,td0);
  /* M3 Caseload with no student kept */
  await p.evaluate(async()=>{const L0=await clList();for(const r of L0||[])await clTx('readwrite',st=>st.delete(r.key));});
  await p.evaluate(()=>caseloadOpen());await sleep(1500);
  const cl0=await p.evaluate(()=>{const s=document.getElementById('srClSet'),g=document.getElementById('srClGear');return {gear:!!g&&g.getAttribute('aria-expanded'),set:!!s&&s.hidden,empty:/No students yet\. Save case keeps each student here\./.test(document.getElementById('dlgBody').textContent),open:!!document.getElementById('srClOpen'),
    inSet:['clIni','clOff','clBk','clRs'].filter(id=>{const e=document.getElementById(id);return e&&e.closest('#srClSet');}),why:(document.querySelector('#srClSet .sr-why')||{}).textContent||'',
    visBtns:[...document.querySelectorAll('#dlgBody button')].filter(b=>b.offsetParent&&!b.closest('#srClSet')).map(b=>b.textContent.trim())};});
  await p.locator('#srClGear').tap();await sleep(300);const cl1=await p.evaluate(()=>!document.getElementById('srClSet').hidden&&document.getElementById('srClGear').getAttribute('aria-expanded')==='true');await shut(p);
  ok('M3 Caseload: only the students and what needs you; backups, Drive and the settings behind "Caseload settings" (a gear); the empty state says Save case keeps each student here, with Open case; a disabled button says why',
    cl0.gear==='false'&&cl0.set&&cl0.empty&&cl0.open&&cl0.inSet.length>=3&&/Not available yet/.test(cl0.why)&&cl1&&cl0.visBtns.every(t=>/Caseload settings|Open case|Close/.test(t)),{cl0,cl1});
  /* the case: DM-1, DD-1 and TD-1 with their simulations */
  await setBar(p);
  await openSim(p,'DM-1');await openSim(p,'DD-1');
  /* H2 a form of 4 sheets: no sheet column of its own; the list put away, not remembered */
  const dd=await p.evaluate(()=>{const d=state.frames['DD-1'].contentDocument;return {rail:!!d.getElementById('nbhRail'),hidden:document.body.classList.contains('rail-hidden'),ov:document.body.classList.contains('sr-ov'),kept:localStorage.getItem('nbh.ws.rail'),
    fw:Math.round(state.frames['DD-1'].getBoundingClientRect().width),sw:Math.round(document.querySelector('.stagew').getBoundingClientRect().width),step:!!document.querySelector('#aStep:not(.wa-off)')};});
  ok('H2 opening a form on the iPad sideways puts the list away (not remembered: the case home keeps it), so the form has the stage\'s whole width; DD-1 (4 sheets) has no sheet column, only the form row\'s sheet menu',
    dd.hidden&&dd.ov&&dd.kept!=='hidden'&&dd.fw>=1370&&!dd.rail&&dd.step,dd);
  const fr=await openSim(p,'TD-1');await noToasts(p);await sleep(1500);
  const td=await p.evaluate(()=>{const d=state.frames['TD-1'].contentDocument,r=d.getElementById('nbhRail');const marks=[...d.querySelectorAll('#viewSeg .sr-fw')].map(x=>x.textContent);
    return {rail:!!r&&Math.round(r.getBoundingClientRect().width),leg:!!(r&&r.querySelector('.sr-leg')),marks:marks.slice(0,4),edge:getComputedStyle(document.getElementById('railEdge')).display,frail:document.body.classList.contains('sr-frail')};});
  ok('H2 TD-1 (13 sheets): its own sheet column at 180 px',td.rail===180,td);
  ok('M6 with that column showing, the edge tab steps aside (the form row\'s list button opens the list); each sheet\'s mark has words read by VoiceOver ("started", "complete"); a legend at the foot',td.edge==='none'&&td.frail&&td.leg&&td.marks.length>0&&td.marks.every(m=>/^, (started|complete|not started)$/.test(m)),td);
  /* v25.68 (the BCBA, 11/6) the list opened by hand while working stays beside the form until she closes it (qa/v2568-shell-test D2) */
  await p.locator('.stagew>.crumb #railToggle').tap();await sleep(500);
  const ov=await p.evaluate(()=>({rail:getComputedStyle(document.getElementById('railNav')).position,shown:!document.body.classList.contains('rail-hidden'),fw:Math.round(state.frames['TD-1'].getBoundingClientRect().width),scrim:getComputedStyle(document.getElementById('railScrim')).display!=='none',ov:document.body.classList.contains('sr-ov')}));
  /* B3 the open form's sheets under it in the list */
  const tree=await p.evaluate(()=>{const li=document.querySelector('#rail .item[data-id="TD-1"]'),x=li&&li.nextElementSibling;const bs=x&&x.classList.contains('sr-shli')?[...x.querySelectorAll('button[data-srsheet]')]:[];
    return {n:bs.length,cur:bs.findIndex(b=>b.getAttribute('aria-current')==='true'),words:bs.map(b=>(b.querySelector('.sr-sw')||{}).textContent||'').filter(Boolean).length,h:bs.length?Math.round(bs[0].getBoundingClientRect().height):0,lab:bs[2]&&bs[2].getAttribute('aria-label')};});
  ok('H2 the list opened by hand while working comes back beside the form (the BCBA, 11/6: kept until she closes it; no scrim)',ov.rail!=='absolute'&&ov.shown&&!ov.ov&&ov.fw<1370&&!ov.scrim,ov);
  ok('B3 one tree: the open form\'s 13 sheets are listed under it in the list of forms, the current one marked, each with its state in words, 44 px each',tree.n===13&&tree.cur>=0&&tree.words>0&&tree.h>=44,tree);
  await p.locator('#rail [data-srsheet="2"]').tap();await sleep(900);
  const sh3=await p.evaluate(()=>({sheet:document.querySelector('#aSheet b').textContent,hidden:document.body.classList.contains('rail-hidden')}));
  ok('B3 a sheet tapped in the list opens it (the list she opened stays, the BCBA 11/6)',/Build components/i.test(sh3.sheet)&&!sh3.hidden,sh3);
  await p.locator('#railHide').tap();await sleep(500);
  /* M1 the form row */
  const row=await p.evaluate(()=>{const t=document.getElementById('crumbTitle'),nx=document.getElementById('aNext'),cs=document.getElementById('crumbStatus');
    return {t:t.textContent,tip:t.title,code:document.getElementById('aCode').textContent,cut:t.scrollWidth>t.clientWidth+1,count:cs.offsetParent!==null&&/fields? filled/.test(cs.textContent),next:nx.textContent,nfit:nx.classList.contains('sr-cut')||nx.scrollWidth<=nx.clientWidth+1};});
  ok('M1 the form row shows whole words: the code and the short name ("TD-1 Treatment plan"), the full name in the tooltip; no field count; Next only when it fits in full',
    row.code==='TD-1'&&row.t==='Treatment plan'&&row.tip==='Function-Based Treatment Developer'&&!row.cut&&!row.count&&row.nfit,row);
  /* M5 the ticks and the words */
  const m5=await p.evaluate(()=>{const cb=document.querySelector('#rail [data-tick="DD-1"]'),it=document.querySelector('#rail .item[data-id="DD-1"] button.open');
    return {cb:getComputedStyle(cb).display,word:(it.querySelector('.st')||{}).textContent,last:it.lastElementChild&&it.lastElementChild.classList.contains('sr-odd'),num:/\b\d{2,}\b/.test(it.querySelector('.st').textContent)};});
  await p.evaluate(()=>{if(document.body.classList.contains('rail-hidden'))setRailHidden(false);});await sleep(300);
  await p.locator('#srChooseBtn').tap();await sleep(300);
  const m5b=await p.evaluate(()=>({cb:getComputedStyle(document.querySelector('#rail [data-tick="DD-1"]')).display,pressed:document.getElementById('srChooseBtn').getAttribute('aria-pressed'),build:getComputedStyle(document.getElementById('srBuildBtn')).display}));
  await p.locator('#rail [data-tick="DD-1"]').tap();await sleep(200);const tk=await p.evaluate(()=>!!state.ticked['DD-1']);
  await p.locator('#srChooseBtn').tap();await sleep(200);await p.evaluate(()=>{state.ticked={};renderRail();});
  ok('M5 the print ticks are hidden until "Choose forms for the packet" is on (then a tick works and Build packet is there); a form says Has data, not a number; the different-name mark is at the row\'s end',
    m5.cb==='none'&&m5.word==='Has data'&&!m5.num&&m5.last&&m5b.cb!=='none'&&m5b.pressed==='true'&&m5b.build!=='none'&&tk,{m5,m5b,tk});
  /* M10 Build packet with nothing chosen */
  await p.evaluate(()=>{window.__al=[];const a0=wsUI.alert;wsUI.alert=t=>{window.__al.push(String(t));return a0(t);};document.getElementById('masterPrint').click();});await sleep(800);
  const m10=await p.evaluate(()=>({choose:document.body.classList.contains('sr-choose'),al:window.__al,shown:!document.body.classList.contains('rail-hidden')}));await p.evaluate(()=>srChoose(false));
  ok('M10 Build packet with nothing chosen opens the choosing of forms in the list, not an error',m10.choose&&m10.shown&&!m10.al.some(t=>/Tick at least/.test(t)),m10);
  await p.evaluate(()=>{if(__wsSR.keep)__wsSR.keep(false);if(!document.body.classList.contains('rail-hidden'))__wsSR.railAway();});   /* v25.68 the list kept by hand is let go first */
  /* H1, M18 the save status */
  await noToasts(p);await sleep(1200);
  const s1=await p.evaluate(()=>{const b=document.getElementById('wsStat');return {t:b.querySelector('.wa-t').textContent,k:b.className,lab:b.getAttribute('aria-label'),save:document.getElementById('saveCase').getAttribute('aria-label'),dirty:caseDirty(),live:document.getElementById('live').textContent};});
  ok('H1 the indicator reports the case file: "Not saved to a file …" in amber while the case holds unsaved work',s1.dirty&&/^Not saved to a file (yet|since \d)/.test(s1.t)&&/k-warn/.test(s1.k),s1);
  ok('M18 Save case is named "Save case (changes not saved)" while they are not saved',s1.save==='Save case (changes not saved)',s1);
  await p.locator('#wsStat').tap();await sleep(400);
  const pan=await p.evaluate(()=>{const P=document.getElementById('wsStatPanel');const hs=[...P.querySelectorAll('.wa-ph,.sr-fs h4')].map(h=>h.textContent);return {open:!P.hidden,hs,save:!!P.querySelector('#srPanelSave'),auto:!!P.querySelector('#autoChip')&&P.querySelector('#autoChip').compareDocumentPosition(P.querySelector('#srSafeH'))===Node.DOCUMENT_POSITION_PRECEDING,
    form:(P.querySelector('#srFormSt p')||{}).textContent||'',exp:!!P.querySelector('#srExport2')};});await shut(p);
  ok('H1 its panel: the case file with Save case first, then "Safety copy in this browser" (Autosave), then this form with its fields filled and Export this form',pan.open&&pan.hs[0]==='The case file'&&pan.hs.includes('Safety copy in this browser')&&pan.save&&pan.auto&&/TD-1 .*fields? filled/.test(pan.form)&&pan.exp,pan);
  await p.locator('#aView').tap();await sleep(400);const vw=await p.evaluate(()=>({exp:!!document.querySelector('#wsViewMenu #srExport'),aSave:getComputedStyle(document.getElementById('aSave')).display}));await shut(p);
  ok('H1 Save form is "Export this form" in View (the form\'s own Save data), not a second Save in the row',vw.exp&&vw.aSave==='none',vw);
  await p.evaluate(()=>{state.lastSig=caseSig();state.savedAt=new Date(2026,10,6,14,14);state.savedWhere='';paintSave();});await sleep(1300);
  const s2=await p.evaluate(()=>{const b=document.getElementById('wsStat');return {t:b.querySelector('.wa-t').textContent,k:b.className,save:document.getElementById('saveCase').getAttribute('aria-label')};});
  ok('H1 saved, it says so with the time: "Case saved 2:14 PM", green',/^Case saved 2:14/.test(s2.t)&&/k-on/.test(s2.k)&&s2.save==='Save case',s2);
  /* L1 Today's count after its label */
  const l1=await p.evaluate(()=>{const b=document.querySelector('#wsNav #todayBtn'),t=b.querySelector('.wa-t'),g=b.querySelector('.tbadge');if(!g||g.hidden)return {none:true};return {lr:Math.round(t.getBoundingClientRect().right),gl:Math.round(g.getBoundingClientRect().left)};});
  ok('L1 Today\'s count sits after its label ("Today 4"), not on it',l1.none||l1.gl>=l1.lr,l1);
  /* H6 Find a form */
  const h6=await p.evaluate(()=>{const f=q=>palList(q).filter(x=>x.id).map(x=>x.id);return {graph:f('graph'),consent:f('consent')[0],restraint:f('restraint')[0],iep:f('iep goal')[0],home:f('home sheets')[0],dd:f('dd-1')[0],tbd:f('tbd')[0],near:palList('grpah').map(x=>x.id+(x.near?'~':''))};});
  await p.evaluate(()=>palOpen());await sleep(300);await p.keyboard.type('graph');await sleep(500);
  const h6b=await p.evaluate(()=>{const r=document.querySelector('#palRes .r');return {first:r&&r.querySelector('.rid').textContent,bold:r&&r.querySelector('.rnm').innerHTML};});
  await p.fill('#palIn','grpah');await sleep(500);const h6c=await p.evaluate(()=>document.getElementById('palRes').textContent.replace(/\s+/g,' '));await p.keyboard.press('Escape');
  ok('H6 search finds forms by what they do: "graph" gives DD-1 first and never Demographics; consent IC-1, restraint CR-1, "iep goal" GB-1, "home sheets" HD-1, "dd-1" DD-1, "tbd" TB-1',
    h6.graph[0]==='DD-1'&&!h6.graph.includes('DM-1')&&h6.consent==='IC-1'&&h6.restraint==='CR-1'&&h6.iep==='GB-1'&&h6.home==='HD-1'&&h6.dd==='DD-1'&&h6.tbd==='TB-1',h6);
  ok('H6 the matched word in bold; nothing found: "No form found … Did you mean" DD-1',h6b.first==='DD-1'&&/<b>/.test(h6b.bold)&&/No form found for “grpah”\. Did you mean/.test(h6c)&&h6.near[0]==='DD-1~',{h6b,h6c,near:h6.near});
  /* M7 toasts */
  await noToasts(p);
  await p.evaluate(()=>{wsUI.toast('A first message.');wsUI.toast('From the case: the target behavior, the replacement behavior, the reinforcer and EO (FS-1), the settings not sampled (FS-1), severity and safety, the function, the home language (DM-1).');});await sleep(300);
  const m7=await p.evaluate(()=>{const ts=[...document.querySelectorAll('#wsToasts .ws-toast')],t=ts[0],x=t&&t.querySelector('.sr-tx'),st=document.querySelector('.stagew').getBoundingClientRect();
    const b=t&&t.getBoundingClientRect();return {n:ts.length,line:t&&t.querySelector('.sr-tt').textContent,view:!!(t&&t.querySelector('.sr-tv')),x:x&&Math.round(x.getBoundingClientRect().width),xh:x&&Math.round(x.getBoundingClientRect().height),left:b&&Math.round(b.left),sl:Math.round(st.left),bottom:b&&Math.round(innerHeight-b.bottom),full:t&&t.querySelector('.sr')&&t.querySelector('.sr').textContent.length};});
  ok('M7 one toast at a time, at the bottom left of the stage; a one-line summary ("7 details taken from the case.") with View, the full text for VoiceOver; a 44 px close',
    m7.n===1&&m7.line==='7 details taken from the case.'&&m7.view&&m7.x>=44&&m7.xh>=44&&Math.abs(m7.left-(m7.sl+16))<=2&&m7.bottom<60&&m7.full>100,m7);
  await sleep(6500);const gone=await p.evaluate(()=>document.querySelectorAll('#wsToasts .ws-toast').length);
  ok('M7 gone after 6 s',gone===0,gone);
  await p.evaluate(()=>{dialog('Test','<p>A dialog.</p>');wsUI.toast('While a dialog is open.');});await sleep(300);
  const m7b=await p.evaluate(()=>({float:document.querySelectorAll('#wsToasts .ws-toast').length?getComputedStyle(document.getElementById('wsToasts')).display:'none',inDlg:(document.querySelector('#dlg .sr-dmsg')||{}).textContent||''}));await shut(p);await sleep(400);
  const m7e=await p.evaluate(()=>[...document.querySelectorAll('#wsToasts .ws-toast .sr-tt')].map(t=>t.textContent));
  ok('M7 hidden while a dialog is open: the message is a line in the dialog instead (and a toast when the dialog closes at once after it)',m7b.float==='none'&&m7b.inDlg==='While a dialog is open.'&&m7e[0]==='While a dialog is open.',{m7b,m7e});
  await noToasts(p);
  const ftd=frameOf(p,'TD-1');await ftd.evaluate(()=>{nbhUI.toast('From the case: the home language (DM-1), the interpreter (DM-1), the cultural considerations (DM-1).');});await sleep(300);
  const m7c=await p.evaluate(()=>({shell:[...document.querySelectorAll('#wsToasts .ws-toast')].map(t=>t.querySelector('.sr-tt').textContent),log:(__wsSR.log()['TD-1']||[]).map(x=>x.text).slice(-1)[0]||'',
    inFrame:state.frames['TD-1'].contentDocument.querySelectorAll('#nbhToasts .nbh-toast').length}));
  await p.locator('#wsStat').tap();await sleep(400);const m7d=await p.evaluate(()=>(document.querySelector('#srFormSt ol')||{}).textContent||'');await shut(p);await noToasts(p);
  ok('M7 a form\'s own toast, the form on screen, is the workstation\'s one toast; its full text is kept in the form\'s status panel ("What changed in this form")',
    m7c.shell[0]==='3 details taken from the case.'&&m7c.inFrame===0&&/the interpreter \(DM-1\)/.test(m7c.log)&&/the cultural considerations/.test(m7d),{m7c,m7d:m7d.slice(0,200)});
  /* H4 notices */
  await p.evaluate(()=>{__wsSR.fresh();const b=document.getElementById('pwaBar');document.getElementById('pwaText').textContent='A new version of the workstation is ready. Reload to use it.';b.hidden=false;});await sleep(1300);
  const h4=await p.evaluate(()=>{const vis=['alertbar','pwaBar'].filter(id=>{const e=document.getElementById(id);return e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none';});
    return {live:__wsSR.live(),vis,pg:(document.querySelector('.sr-cur .sr-pg')||{}).textContent||''};});
  await p.locator('.sr-cur .sr-pg').tap();await sleep(400);const h4b=await p.evaluate(()=>['alertbar','pwaBar'].filter(id=>getComputedStyle(document.getElementById(id)).display!=='none'&&document.getElementById(id).getBoundingClientRect().height>0));
  ok('H4 one notice at a time: of the different-student notice and the update notice one shows, with "1 of 2 ▸", which shows the other',h4.live.includes('alert')&&h4.live.includes('pwa')&&h4.vis.length===1&&/^1 of 2/.test(h4.pg)&&h4b.length===1&&h4b[0]!==h4.vis[0],{h4,h4b});
  await p.evaluate(()=>__wsSR.foldNow());await sleep(400);
  const h4c=await p.evaluate(()=>{const c=document.getElementById('srNoteChip');return {on:c.classList.contains('on'),inLine:!!c.closest('#barSum'),t:c.textContent,vis:['alertbar','pwaBar'].filter(id=>getComputedStyle(document.getElementById(id)).display!=='none'&&document.getElementById(id).getBoundingClientRect().height>0),
    top:Math.round(document.getElementById('frames').getBoundingClientRect().top)};});
  ok('H4 after the first look the notices fold into a chip on the student line ("⚠ 3 forms name another student · +1"), and the form moves up',h4c.on&&h4c.inLine&&/^⚠ \d forms? names? another student · \+1$/.test(h4c.t)&&h4c.vis.length===0,h4c);
  await p.evaluate(()=>setFull(true));await sleep(900);
  const h4d=await p.evaluate(()=>{const c=document.getElementById('srNoteChip');return {inRow:!!c.closest('.crumb'),on:c.classList.contains('on'),vis:['alertbar','pwaBar'].filter(id=>getComputedStyle(document.getElementById(id)).display!=='none'&&document.getElementById(id).getBoundingClientRect().height>0),
    full:(document.querySelector('#fullBtn .lbl')||{}).textContent,fl:getComputedStyle(document.querySelector('#fullBtn .lbl')).display,fs:getComputedStyle(document.querySelector('#fsForms .lbl')).display};});
  ok('H4 in Fullscreen the notices show only as the chip, in the form row',h4d.inRow&&h4d.on&&h4d.vis.length===0,h4d);
  ok('L4 Fullscreen\'s two buttons say what they do at 1000 px and up: "Forms" and "Exit fullscreen"',h4d.full==='Exit fullscreen'&&h4d.fl!=='none'&&h4d.fs!=='none',h4d);
  await p.evaluate(()=>setFull(false));await sleep(500);await p.evaluate(()=>{document.getElementById('pwaBar').hidden=true;});
  /* L3 Focus's words */
  await p.evaluate(()=>{state.frames['TD-1'].contentDocument.querySelector('#viewSeg button[data-view="select"]').click();});await sleep(500);
  await p.evaluate(()=>focusSet(true));await sleep(2200);
  const l3=await ftd.evaluate(()=>{const b=document.getElementById('nbhFxBar');return b?{where:b.querySelector('.nbh-fx-where b').textContent,next:b.querySelector('.nbh-fx-next .t').textContent,off:b.querySelector('.nbh-fx-off .t').textContent}:null;});
  await p.evaluate(()=>focusSet(false));await sleep(600);
  ok('L3 Focus\'s bar in the sheet\'s words: "Section 1 of N on this sheet", "Next section" (or "Next sheet"), "Show the whole sheet"',!!l3&&/^Section \d+ of \d+ on this sheet$/.test(l3.where)&&/^Next (section|sheet)$/.test(l3.next)&&l3.off==='Show the whole sheet',l3);
  /* M2 Today with the case */
  await p.evaluate(()=>todayOpen());await sleep(2200);
  const m2=await p.evaluate(()=>{const S=[...document.querySelectorAll('#dlgBody .sr-tg:not([hidden])')];return {g:S.map(s=>s.querySelector('h3').textContent),rec:S[0]&&[...S[0].querySelectorAll('button')].map(b=>b.textContent),
    cl:!!document.getElementById('tdCaseload'),wk:(document.getElementById('tdWeek')||{}).className||'',dow:new Date().getDay(),hint:/The end of the week prints/.test(document.getElementById('dlgBody').textContent)};});await shut(p);
  ok('M2 Today\'s buttons in three labelled groups (Record; Send and print; Check the case), no Caseload, no paragraph; the end of the week is the primary button only on Thursday and Friday',
    m2.g.join('|')==='Record|Send and print|Check the case'&&m2.rec&&m2.rec.includes('Log an incident')&&!m2.cl&&!m2.hint&&(/primary/.test(m2.wk)===(m2.dow===4||m2.dow===5)),m2);
  /* M4 Log incident */
  await ftd.evaluate(()=>scrollTo(0,0));for(let i=0;i<20&&(await p.evaluate(()=>__wsBars.state()))!=='shown';i++)await sleep(250);await sleep(400);
  const m4a=await box(p,'#srLog');
  await p.locator('#srLog').tap();await sleep(1200);
  const m4=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#srBehs [data-srbeh]')],c=document.querySelector('#dlg .ln-chk'),i=c&&c.querySelector('input');const n=new Date(),hh=String(n.getHours()).padStart(2,'0');
    return {btns:bs.map(b=>b.textContent),h:bs.length?Math.round(bs[0].getBoundingClientRect().height):0,time:(document.getElementById('lnTime')||{}).value||'',hh,chk:c?Math.abs(i.getBoundingClientRect().top+i.getBoundingClientRect().height/2-(c.getBoundingClientRect().top+c.getBoundingClientRect().height/2))<14&&c.getBoundingClientRect().height<60:false,lab:document.getElementById('lnBeh').closest('label').hidden};});
  await p.locator('#srBehs [data-srbeh]').first().tap();await sleep(200);const m4b=await p.evaluate(()=>({v:document.getElementById('lnBeh').value,pr:document.querySelector('#srBehs [data-srbeh]').getAttribute('aria-pressed')}));
  await p.locator('#srBehs [data-srbeh=""]').tap();await sleep(200);const m4c=await p.evaluate(()=>({lab:document.getElementById('lnBeh').closest('label').hidden,v:document.getElementById('lnBeh').value}));await shut(p);
  ok('M4 "Log incident" on the student line while a case is open (44 px), one tap from anywhere',!!m4a&&m4a.vis&&m4a.h>=44,m4a);
  ok('M4 the case\'s targets as large buttons (from TB-1 and DD-1), Other a text box; the time filled when it opens; the count\'s checkbox and its words on one row',
    m4.btns.length>=2&&m4.btns.includes('Other')&&m4.h>=48&&m4.time.slice(0,2)===m4.hh&&m4.chk&&m4.lab&&m4b.v===m4.btns[0]&&m4b.pr==='true'&&!m4c.lab&&m4c.v==='',{m4,m4b,m4c});
  /* L6 a count's word agrees with its number */
  const l6=await p.evaluate(()=>({one:clUnit(1,'occurrences'),many:clUnit(9,'occurrences'),day:clUnit(1,'times per day'),line:clTrendOne({name:'X',unit:'occurrences',pts:[['2026-10-09',9],['2026-11-05',1]]},0,1,false).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '),
    lv:clLvHtml([{name:'X',unit:'occurrences',pts:[['2026-11-01',1],['2026-11-02',1],['2026-11-03',1]]}]).replace(/<[^>]+>/g,'')}));
  ok('L6 a count\'s word agrees with its number: "9 → 1 occurrence", "now 1 occurrence"; 9 occurrences; 1 time per day',l6.one==='occurrence'&&l6.many==='occurrences'&&l6.day==='time per day'&&/9 → 1 occurrence\b(?!s)/.test(l6.line)&&/now 1 occurrence \(/.test(l6.lv),l6);
  /* the Documents record: a form's print */
  await p.evaluate(()=>{state.docs=[];});
  await ftd.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await sleep(200);
  const dc1=await p.evaluate(()=>JSON.parse(JSON.stringify(state.docs)));
  ok('Docs a form\'s own print dialog adds no line (the BCBA, 11/6: only what the workstation makes itself)',dc1.length===0,dc1);
  /* the packet's print window (the IEP meeting packet): its own title */
  const pop=p.waitForEvent('popup',{timeout:15000}).catch(()=>null);await p.evaluate(()=>{try{iepPrint();}catch(e){}});const w=await pop;let dc2=[];
  if(w){await sleep(1500);await w.evaluate(()=>window.dispatchEvent(new Event('beforeprint'))).catch(()=>{});await sleep(400);dc2=await p.evaluate(()=>JSON.parse(JSON.stringify(state.docs)));await w.close().catch(()=>{});}
  ok('Docs a page the workstation prints in its own window (the IEP meeting packet) adds a "packet" line with that page\'s title',dc2.length===1&&dc2[0].form==='packet'&&/IEP meeting/i.test(dc2[0].title)&&dc2[0].how==='print'&&/^\d{4}-\d\d-\d\dT/.test(dc2[0].at),dc2);
  /* Finish PDF's file */
  await p.evaluate(()=>{const a=document.createElement('a');a.href='data:application/pdf;base64,JVBERi0=';a.download='Packet_Sample (finished).pdf';a.addEventListener('click',e=>e.preventDefault());document.body.appendChild(a);a.click();a.remove();});await sleep(200);
  const dc3=await p.evaluate(()=>JSON.parse(JSON.stringify(state.docs)));
  ok('Docs Finish PDF\'s finished PDF adds a "pdf" line',dc3.length===2&&dc3[1].how==='pdf'&&dc3[1].form==='packet',dc3.slice(-1));
  const dfile=await p.evaluate(()=>{const d=caseData(packet(),{});const keep=state.docs;state.docs=[];const e=caseData(packet(),{});state.docs=keep;return {n:(d.docs||[]).length,empty:'docs' in JSON.parse(JSON.stringify(e)),pdf:JSON.stringify(d).includes('JVBERi0')};});
  ok('Docs the lines go into the case file (never the paper itself); a case with none writes none',dfile.n===2&&!dfile.empty&&!dfile.pdf,dfile);
  await p.evaluate(()=>__wsCH.toHome());await sleep(1500);
  const dh=await p.evaluate(()=>{const s=document.getElementById('chDocs');return s?{rows:[...s.querySelectorAll('.ch-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim()),all:!!s.querySelector('[data-srdocs]')}:null;});
  ok('Docs the case home\'s Documents panel lists the latest, newest first ("IEP meeting packet · Print · 11/6"), with All documents',!!dh&&dh.rows.length===2&&/Packet_Sample \(finished\)/.test(dh.rows[0])&&/PDF ·/.test(dh.rows[0])&&/IEP meeting.*Print · \d+\/\d+/i.test(dh.rows[1])&&dh.all,dh);
  await p.locator('#chDocs [data-srdocs]').first().tap();await sleep(500);
  const dd2=await p.evaluate(()=>({t:document.getElementById('dlgTitle').textContent,n:document.querySelectorAll('#dlgBody .sr-docl li').length,read:!!document.getElementById('srDocRead')}));await shut(p);
  ok('Docs All documents opens the Documents screen: every line, and Read a document',dd2.t==='Documents'&&dd2.n>=2&&dd2.read,dd2);
  /* with none: the dated papers the forms know */
  await p.evaluate(()=>{state.docs=[];state.facts=Object.assign({},state.facts,{consent:{state:'Current',on:true,obtained:'2026-09-02'}});__wsCH.paint();});await sleep(500);
  const dp=await p.evaluate(()=>{const s=document.getElementById('chDocs');return s?{note:(s.querySelector('.ch-note')||{}).textContent,rows:[...s.querySelectorAll('.ch-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim())}:null;});
  ok('Docs until the case has any, the panel lists the dated papers the forms know (IC-1\'s consent), labelled as such',!!dp&&dp.note==='Dated in the forms'&&dp.rows.some(r=>/Consent \(IC-1\).*Signed 9\/2/.test(r)),dp);
  await p.screenshot({path:OUT+'casehome-docs.png'});
  /* an older case without the lines opens as before */
  const old=await p.evaluate(async()=>{await loadCase({form:'CASE',rev:'2026-09',packet:{client:'Sample Student C',sid:'000003'},forms:{}},'file');return {docs:state.docs.length,client:packet().client};});
  ok('Docs a case saved before (no lines) opens unchanged, with none',old.docs===0&&old.client==='Sample Student C',old);
  await ctx.close();
  /* ================= M11, B4: Save case on the iPad ================= */
  const c2=await ctxFor(br,1376,1032);const p2=await start(c2,'save');await setBar(p2);await openSim(p2,'DD-1');await shut(p2);
  await p2.evaluate(()=>{window.__asked=[];window.__shared=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.alert=async()=>{};
    navigator.canShare=()=>true;navigator.share=async o=>{window.__shared.push(o.files.map(f=>f.name+'|'+f.type));};try{sessionStorage.removeItem('nbh.ws.filesOk');}catch(e){}state.filesOk=false;});
  const sv1=await p2.evaluate(async()=>{const r=await saveCase();return {r,asked:window.__asked.slice(),shared:window.__shared.slice(),t:document.querySelector('#wsStat .wa-t').textContent,dirty:caseDirty()};});
  ok('M11 on an iPad in Safari Save case hands the case file to the share sheet (Save to Files in one tap), with no "Is the file in Files?"',sv1.r===true&&sv1.shared.length===1&&/^CASE_Sample_Student_\d{4}-\d\d-\d\d\.json\|application\/json$/.test(sv1.shared[0])&&!sv1.asked.some(t=>/Is the file in Files/.test(t))&&!sv1.dirty,sv1);
  ok('B4 then the indicator says where: "Saved to Files" and the time',/^Saved to Files \d/.test(sv1.t),sv1);
  await p2.evaluate(()=>{delete navigator.canShare;delete navigator.share;Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true});window.__asked=[];});
  await p2.evaluate(()=>{state.lastSig='';});
  const sv2=await p2.evaluate(async()=>{await saveCase();const a=window.__asked.slice();window.__asked=[];state.lastSig='';await saveCase();return {first:a.filter(t=>/Is the file in Files/.test(t)).length,second:window.__asked.filter(t=>/Is the file in Files/.test(t)).length};});
  ok('M11 without the share sheet the download asks "Is the file in Files?" once a session, not at every save',sv2.first===1&&sv2.second===0,sv2);
  await c2.close();
  /* ================= the iPad upright ================= */
  const cu=await ctxFor(br,1032,1376);const pu=await start(cu,'1032');await setBar(pu);const fu=await openSim(pu,'TD-1');await noToasts(pu);
  await pu.evaluate(()=>{state.frames['TD-1'].contentDocument.querySelector('#viewSeg button[data-view="select"]').click();});await sleep(1500);
  const h3=await fu.evaluate(()=>{const q=[...document.querySelectorAll('.qrow .qt')].find(x=>x.offsetParent&&x.querySelector('.nbh-seg'));if(!q)return null;const t=[...q.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
    const rg=document.createRange();rg.selectNodeContents(t);const a=rg.getBoundingClientRect(),b=q.querySelector('.nbh-seg').getBoundingClientRect(),r=q.closest('.qrow').getBoundingClientRect();
    const lh=parseFloat(getComputedStyle(q).lineHeight)||23;return {row:Math.round(r.width),under:b.top>=a.bottom-1,qw:Math.round(a.width),lines:Math.round(a.height/lh),ct:getComputedStyle(q.closest('.qrow')).containerType,body:getComputedStyle(document.body).containerType};});
  ok('H3 upright (1032 px), TD-1\'s answer buttons go under the question when its row is under 600 px, so the question has the row\'s width and wraps to 1 or 2 lines, not 6 (a container query on the row, not the device; the form\'s body is left as it is)',!!h3&&h3.ct==='inline-size'&&h3.body==='normal'&&(h3.row>=600||h3.under&&h3.lines<=2),h3);
  const l1u=await pu.evaluate(()=>{const s=document.querySelector('#wsStat .wa-s'),t=document.querySelector('#wsStat .wa-t');return {s:s.textContent,sv:getComputedStyle(s).display,tv:t.getBoundingClientRect().width};});
  ok('L1 upright the indicator keeps one word ("Not saved" or "Saved"), not a bare dot',/^(Not saved|Saved|Saving…)$/.test(l1u.s)&&l1u.sv!=='none'&&l1u.tv<=1,l1u);
  await pu.screenshot({path:OUT+'upright-td1.png'});
  await cu.close();
  /* ================= the phone ================= */
  const cp=await ctxFor(br,390,844);const pp=await start(cp,'390');
  const l8a=await pp.evaluate(()=>{const n=document.getElementById('whoName').getBoundingClientRect(),s=document.getElementById('whoSub').getBoundingClientRect();return {stack:s.top>=n.bottom-1,sub:document.getElementById('whoSub').textContent};});
  await setBar(pp);await pp.evaluate(()=>document.body.classList.remove('bar-open'));
  const l8b=await pp.evaluate(()=>{const n=document.getElementById('whoName').getBoundingClientRect(),s=document.getElementById('whoSub').getBoundingClientRect();return {stack:s.top>=n.bottom-1,t:document.getElementById('whoName').textContent};});
  ok('L8 the phone\'s header: the name, and the line under it on a line of its own ("Enter the student’s details to begin")',l8a.stack&&l8b.stack&&/student’s details/.test(l8a.sub),{l8a,l8b});
  await openSim(pp,'DD-1');await noToasts(pp);await pp.evaluate(()=>document.body.classList.remove('bar-open'));await sleep(600);
  const m8=await pp.evaluate(()=>{const vis=s=>{const e=document.querySelector(s);return !!e&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none';};
    return {nav:vis('#wsNav'),dots:vis('#srPhDots'),logo:vis('header.top #logo'),chips:vis('header.top #wsChips'),bar:[...document.querySelectorAll('#phoneBar button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.textContent.trim()),
      top:Math.round(document.getElementById('frames').getBoundingClientRect().top),more:document.getElementById('phMore').classList.contains('sr-dirty'),wide:document.documentElement.scrollWidth<=390};});
  await pp.locator('#phMore').tap();await sleep(500);const m8b=await pp.evaluate(()=>({save:!!document.querySelector('#dlgBody [data-phmore="saveCase"]'),cl:!!document.querySelector('#dlgBody [data-phmore="caseloadBtn"]'),st:(document.querySelector('#dlgBody .sr-phst')||{}).textContent||''}));await shut(pp);
  ok('M8 the phone: at the top the name and one ⋯ menu (no dark row, no logo, no chips); at the foot Forms, Today, Log and More; the form starts near the top',!m8.nav&&m8.dots&&!m8.logo&&!m8.chips&&m8.bar.map(t=>t.replace(/\d+$/,'')).join('|')==='Forms|Today|Log|More'&&m8.top<=300&&m8.wide,m8);
  ok('M8 Save case is in More, the unsaved dot on More; Caseload is in More too',m8.more&&m8b.save&&m8b.cl&&/^Not saved to a file/.test(m8b.st),{m8b,more:m8.more});
  ok('H7 the phone\'s toggle for the details says "Student"',await pp.evaluate(()=>document.querySelector('#barToggle .lbl').textContent==='Student'));
  await cp.close();
  /* nothing of it on paper */
  const cx=await ctxFor(br,1376,1032);const px=await start(cx,'print');await setBar(px);await px.evaluate(()=>{document.querySelector('.railhead').scrollIntoView();});
  await px.emulateMedia({media:'print'});const pr=await px.evaluate(()=>['srNoteChip','srLog','srChooseBtn','srPhDots'].filter(id=>{const e=document.getElementById(id);return e&&getComputedStyle(e).display!=='none';}));
  ok('nothing of it prints',pr.length===0,pr);await cx.close();
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  ok('no page errors',!errs.length,errs.slice(0,8));
  await br.close();console.log('RESULT: '+(fails?fails+' failed':'all '+passes+' passed'));process.exit(fails?1:0);})();
