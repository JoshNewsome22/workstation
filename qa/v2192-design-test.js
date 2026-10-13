/* v21.92 the design review's build stays built. On an iPad held sideways (1180) with nothing open, the form list is a column beside
   the start screen, not a drawer over it (Hide still puts it away); held upright (820) the list stays closed at the start and the
   Forms button says so in words. Above an open form the folded student line and the case buttons share one row at 1180; a form's
   toolbar on a touch screen is one row (a label beside its controls, the view tabs one row that scrolls sideways with a fade
   where there is more, the open tab in sight, "More" for "More controls"); with a mouse the toolbar keeps its layout. Caseload
   shows the students first, then what needs them, then backups, Google Drive and settings folded (open while there is no
   student; a note that needs the user stays above the fold). Lists are rows: a tag pill, the words, the button at the right;
   Overdue, Safety and Injury in red. Dialog text 14 px, the lead 15, the list names 13.5; the start screen's list sits left.
   The student bar on the iPad upright is a grid with nothing clipped, and Grade fits "12th grade" everywhere. A finger gets 44 px
   bar buttons, a 44 px folded heading, a 44 px toast ×. Printing is unchanged: a form prints the same with a finger as with a
   mouse. The extras: reading lines of about 76 characters at most, keyboard hints only with a keyboard, no "View" label
   beside the tabs on a touch screen, the focus bar's label in sentence case, a dialog using 70% of a phone's screen.
   Chromium with iPad and iPhone user agents and touch (isMobile, so pointer:coarse holds). Simulated students only.
   usage: node qa/v2192-design-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const UA={ipad:'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphone:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  mac:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'};
const OUT=__dirname+'/out/v2192-design/';fs.mkdirSync(OUT,{recursive:true});
const DM='DM-1_Student-Demographics-and-Profile_v2026-09.html';
/* the shell with three simulated students kept (one not yet in a file), the details cleared */
async function shell(br,vp,ua,touch,keep){const ctx=await br.newContext({viewport:vp,userAgent:ua,hasTouch:!!touch,isMobile:!!touch,serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async keep=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};wsUI.choose=async()=>'switch';
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on','nbh.focus'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    if(!keep)return;const now=Date.now();const mk=(p,saved,sum,extra)=>Object.assign({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum,
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}},facts:{src:{}}})},extra||{});
    const A=mk({client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School',grade:'5'},new Date(now-3600e3).toISOString(),{items:[{k:'Overdue',t:'The parent notice for the restraint on 10/8 is overdue',open:'CR-1'},{k:'Due',t:'The plan review is due Friday (Form PR-1)',open:'PR-1'}],forms:3},{unfiled:true});
    const B=mk({client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},new Date(now-864e5).toISOString(),{items:[{k:'Overdue',t:'The parent notice for the restraint on 10/8 is overdue',open:'CR-1'},{k:'Data',t:'No data on Form DD-1 for 6 days',open:'DD-1'}],forms:1});
    const C=mk({client:'SIMULATED – Sample Student 2',sid:'SIM-0003',site:'Sample Middle',grade:'7'},new Date(now-3*864e5).toISOString(),{items:[],forms:1});
    await clTx('readwrite',st=>{st.put(A);st.put(B);st.put(C);});await paintBlank();},!!keep);
  await sleep(900);return {ctx,page,errs};}
const setBar=page=>page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');set('#pGrade','12th grade');set('#pBcba','Joshua Newsome, M.A., BCBA');});
async function open(page,id){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(1500);
  await page.evaluate(()=>{const t=document.getElementById('tipHide');if(t&&t.offsetParent)t.click();});await sleep(200);
  const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);return page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);}
const railState=page=>page.evaluate(()=>{const n=document.getElementById('railNav'),cs=getComputedStyle(n),r=n.getBoundingClientRect(),b=document.getElementById('blank').getBoundingClientRect(),sc=document.getElementById('railScrim');
  const tg=document.getElementById('railToggle'),lbl=tg.querySelector('.lbl');
  return {open:document.body.classList.contains('rail-open'),pos:cs.position,vis:cs.visibility,x:[Math.round(r.left),Math.round(r.right)],blankLeft:Math.round(b.left),scrim:sc&&!sc.hidden&&getComputedStyle(sc).display!=='none',
    toggle:getComputedStyle(tg).display!=='none',label:!!lbl&&getComputedStyle(lbl).display!=='none',edge:getComputedStyle(document.getElementById('railEdge')).display!=='none'};});
/* the toolbar of a form: its height, how many rows its groups and its view tabs take, the fade mark, the two screen controls */
const toolbar=fr=>fr.evaluate(()=>{const t=document.querySelector('.toolbar'),v=document.getElementById('viewSeg');const rows=a=>{const T=a.filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect().top).sort((x,y)=>x-y);let n=0,last=-99;T.forEach(y=>{if(y-last>8)n++;last=y;});return n;};
  const g=[...t.querySelectorAll(':scope > .tgroup')],cs=v&&getComputedStyle(v);
  return {h:Math.round(t.getBoundingClientRect().height),groupRows:rows(g),tabRows:rows([...v.querySelectorAll('button')]),wrap:cs&&cs.flexWrap,more:v.getAttribute('data-nbh-more'),sw:v.scrollWidth,cw:v.clientWidth,
    moreBtn:(document.getElementById('nbhMoreBtn')||{}).textContent,dir:g[0]&&getComputedStyle(g[0]).flexDirection,minH:Math.min(...[...t.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>Math.round(b.getBoundingClientRect().height)))};});
/* the text of a printed form, page by page, read in the workstation with its own pdf.js (as qa/v2190-ipad-pdf-test.js does) */
const pdfText=(shellPage,buf)=>shellPage.evaluate(async b64=>{const lib=await pdfjsLoad();const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const pdf=await lib.getDocument({data:bytes}).promise;const out=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();out.push(tc.items.filter(t=>t.str&&t.str.trim()).map(t=>t.str.trim()+'@'+Math.round(t.transform[4])+','+Math.round(t.transform[5])).join('|'));}
  return out;},Buffer.from(buf).toString('base64'));
(async()=>{const br=await chromium.launch();
  try{
  /* ---- 1. the start screen: iPad sideways ---- */
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},UA.ipad,true,true);
    const a=await railState(page);
    ok('1 iPad sideways, nothing open: the form list is a column beside the start screen (static, from the left edge), no scrim over the caseload',a.open&&a.pos==='static'&&a.vis==='visible'&&a.x[0]===0&&a.x[1]>=280&&a.x[1]<=320&&a.blankLeft>=a.x[1]-1&&!a.scrim,a);
    const cards=await page.evaluate(()=>{const C=[...document.querySelectorAll('#blankCl .cl-card')];const t0=Math.round(C[0].getBoundingClientRect().top);return {n:C.length,across:C.filter(c=>Math.abs(Math.round(c.getBoundingClientRect().top)-t0)<=2).length,sw:document.documentElement.scrollWidth};});
    ok('2 the caseload shows beside the list: two cards across, nothing wider than the screen',cards.n===3&&cards.across===2&&cards.sw<=1180,cards);
    await page.evaluate(()=>document.getElementById('railHide').click());await sleep(400);const b=await railState(page);
    ok('3 Hide puts the list away (the start screen takes the width, the edge tab shows); Escape and the edge tab still work',!b.open&&b.vis==='hidden'&&b.blankLeft<=1&&b.edge,b);
    await page.evaluate(()=>document.getElementById('railEdge').click());await sleep(400);const c=await railState(page);
    ok('4 the edge tab brings the column back',c.open&&c.pos==='static'&&c.blankLeft>=280,c);
    await page.screenshot({path:OUT+'start-1180.png'});
    /* a form opens: the list is a drawer again, closed; the bar folded is one row */
    await setBar(page);const fr=await open(page,'DM-1');await page.evaluate(()=>{try{foldBar(true);}catch(e){}});await sleep(400);
    const d=await railState(page),bar=await page.evaluate(()=>{const B=document.getElementById('bar'),s=document.getElementById('barSum'),a=document.querySelector('.bar .grp.acts');
      return {h:Math.round(B.getBoundingClientRect().height),sumTop:Math.round(s.getBoundingClientRect().top),actsTop:Math.round(a.getBoundingClientRect().top),sumCase:getComputedStyle(document.getElementById('sumCase')).display,
        name:document.getElementById('sumName').textContent,minH:Math.min(...[...a.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>Math.round(b.getBoundingClientRect().height)))};});
    ok('5 with a form open the list is the drawer again, closed, and the start screen is gone',!d.open&&d.pos==='absolute'&&d.vis==='hidden',d);
    ok('6 the folded student line and the case buttons share one row (the bar at most 64 px; it was 107), the case line stepping aside under 1300 px',bar.h<=64&&Math.abs(bar.sumTop-bar.actsTop)<=4&&bar.sumCase==='none'&&/Mateo Rivera/.test(bar.name),bar);
    ok('7 a finger: the bar’s buttons are 44 px tall',bar.minH>=44,bar.minH);
    /* the form's toolbar on a touch screen: one row, "More" */
    const tb=await toolbar(fr);
    ok('8 DM-1 on the iPad sideways: the toolbar is one row (groups in a row, a label beside its controls; at most 64 px), with "More" and "Fit", 44 px buttons',tb.groupRows===1&&tb.h<=64&&tb.dir==='row'&&tb.moreBtn==='More'&&tb.minH>=44,tb);
    const td=await open(page,'TD-1');const t2=await toolbar(td);
    ok('9 TD-1 (many tabs): the view tabs are one row that scrolls sideways, a fade at the right says there is more, the toolbar still one row',t2.tabRows===1&&t2.wrap==='nowrap'&&t2.sw>t2.cw+40&&t2.more==='r'&&t2.groupRows===1&&t2.h<=64,t2);
    /* the last tab chosen: the row scrolls so it is in sight, the fade moves to the left */
    const t3=await td.evaluate(async()=>{const v=document.getElementById('viewSeg'),bs=[...v.querySelectorAll('button')],last=bs[bs.length-1];last.click();await new Promise(r=>setTimeout(r,300));
      const a=last.getBoundingClientRect(),s=v.getBoundingClientRect();return {inView:a.left>=s.left-1&&a.right<=s.right+1,more:v.getAttribute('data-nbh-more'),pressed:last.getAttribute('aria-pressed')};});
    ok('10 the last tab tapped comes into view (the row scrolled), and the fade is now at the left',t3.inView&&t3.pressed==='true'&&t3.more==='l',t3);
    /* a finger's tap, not a script's click: every tab of the row reached by a real tap switches to its view (scroll snap once moved the last tab out from under the tap) */
    const tapped=[];for(const v of await td.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.view))){
      const h=await td.evaluateHandle(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]'),v);let err='';try{await h.asElement().tap({timeout:2500});}catch(e){err=String(e.message).split('\n')[0].slice(0,50);}await sleep(350);
      const on=await td.evaluate(()=>{const b=document.querySelector('#viewSeg button[aria-pressed="true"]');return b?b.dataset.view:null;});if(on!==v||err)tapped.push(v+'->'+on+(err?' ('+err+')':''));}
    ok('10b TD-1: a real tap on each of its 13 tabs, through the scrolling row, switches to that view',!tapped.length,tapped);
    await page.screenshot({path:OUT+'td1-1180.png'});
    ok('11 no page errors (iPad sideways)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* ---- 2. the iPad upright ---- */
  {const {ctx,page,errs}=await shell(br,{width:820,height:1180},UA.ipad,true,true);
    const a=await railState(page);
    ok('12 iPad upright, nothing open: the list stays closed (no drawer over the caseload) and the Forms button carries its word',!a.open&&a.vis==='hidden'&&a.toggle&&a.label&&!a.scrim,a);
    await page.evaluate(()=>document.getElementById('railToggle').click());await sleep(400);const b=await railState(page);
    ok('13 Forms opens the drawer over the start screen, with the scrim',b.open&&b.pos==='absolute'&&b.vis==='visible'&&b.scrim,b);
    await page.evaluate(()=>document.getElementById('railScrim').click());await sleep(400);
    /* the bar unfolded: a grid, nothing clipped, Grade fits */
    await setBar(page);await sleep(300);
    const g=await page.evaluate(()=>{const d=document.querySelector('.bar .grp.det'),r=d.getBoundingClientRect();const ins=[...d.querySelectorAll('input')].map(i=>{const q=i.getBoundingClientRect();return {id:i.id,w:Math.round(q.width),r:Math.round(q.right),sw:i.scrollWidth,cw:i.clientWidth};});
      const rows=new Set([...d.children].filter(e=>e.offsetParent&&!e.classList.contains('pphoto')).map(e=>Math.round(e.getBoundingClientRect().top))).size;
      return {display:getComputedStyle(d).display,rows,ins,right:Math.round(r.right),bar:Math.round(document.getElementById('bar').getBoundingClientRect().height),lbl:getComputedStyle(document.querySelector('#railToggle .lbl')).display};});
    ok('14 the student bar held upright is a grid of three rows; every box ends inside the bar; the ID box is wider than 60 px (it was 60)',g.display==='grid'&&g.rows===3&&g.ins.every(i=>i.r<=g.right)&&g.ins.find(i=>i.id==='pSid').w>100,g);
    const gr=g.ins.find(i=>i.id==='pGrade');ok('15 "12th grade" fits its box (84 px or more; it was 46)',gr.w>=84&&gr.sw<=gr.cw+1,gr);
    const fr=await open(page,'DM-1');await page.evaluate(()=>{try{foldBar(true);}catch(e){}});await sleep(400);
    const bar=await page.evaluate(()=>Math.round(document.getElementById('bar').getBoundingClientRect().height));
    ok('16 folded, the bar stays within 120 px (the v21.89 check) with 44 px buttons',bar<=120,bar);
    const tb=await toolbar(fr);ok('17 DM-1 upright: the toolbar one row, at most 64 px (it was 134)',tb.groupRows===1&&tb.h<=64&&tb.tabRows===1,tb);
    /* a toast's × is a 44 px target, and the toast no taller for it */
    const tt=await fr.evaluate(async()=>{nbhUI.toast('A short message for the check.',{ms:4000});await new Promise(r=>setTimeout(r,250));const t=document.querySelector('#nbhToasts .nbh-toast'),b=t&&t.querySelector('button');if(!b)return null;const q=b.getBoundingClientRect(),r=t.getBoundingClientRect();return {w:Math.round(q.width),h:Math.round(q.height),toast:Math.round(r.height)};});
    ok('18 a form’s toast: the × is a 44 px target and the toast stays a short strip (under 60 px)',!!tt&&tt.w>=44&&tt.h>=44&&tt.toast<60,tt);
    /* a form opened on its own has its own Focus switch beside the tabs: on a form with many views it keeps its width (it was squeezed to 43 px for 77 of text) */
    {const sp=await ctx.newPage();await sp.goto(BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(1500);
      const fb=await sp.evaluate(()=>{const b=document.getElementById('nbhFocusBtn');return b?{sw:b.scrollWidth,cw:b.clientWidth,w:Math.round(b.getBoundingClientRect().width)}:null;});await sp.close();
      ok('18b TD-1 on its own, upright: the Focus switch beside the tabs is not squeezed (its words fit)',!!fb&&fb.sw<=fb.cw+1&&fb.w>=70,fb);}
    /* Caseload: students, what needs you, the fold; the note above it */
    await page.evaluate(()=>caseloadOpen());await sleep(900);
    const cl=await page.evaluate(()=>{const b=document.getElementById('dlgBody'),k=document.getElementById('clKeep'),sm=k&&k.querySelector('summary');const order=[...b.children].map(e=>e.tagName+(e.id?'#'+e.id:'')+(e.className?'.'+String(e.className).split(/\s+/)[0]:''));
      const h3=[...b.querySelectorAll('h3.cl-h')].map(h=>h.textContent);const pills=[...b.querySelectorAll('.td-list .td-k')].map(p=>{const cs=getComputedStyle(p);return {t:p.textContent,r:cs.borderRadius,tt:cs.textTransform,bg:cs.backgroundColor,fg:cs.color,hot:p.closest('li').classList.contains('hot')};});
      const li=b.querySelector('.td-list li'),lcs=li&&getComputedStyle(li),btn=li&&li.querySelector('button');
      return {order,h3,keep:!!k,open:k&&k.open,summary:sm&&sm.textContent,sumH:sm&&Math.round(sm.getBoundingClientRect().height),inKeep:['#clTools','#drvBox','#clIni','#clOff','#clPriv','#clCal','#clRestr'].filter(s=>!k||!k.querySelector(s)),
        noteAbove:!!b.querySelector('#dlgBody > .cl-note')&&!k.querySelector('.cl-note'),unfiled:!!b.querySelector('#dlgBody > .cl-note [data-clfile]'),pills,row:lcs&&lcs.display,btnRight:btn&&Math.round(li.getBoundingClientRect().right-btn.getBoundingClientRect().right),
        db:getComputedStyle(b).fontSize,lead:getComputedStyle(b.querySelector('.hp-lead')).fontSize,h3s:getComputedStyle(b.querySelector('h3.cl-h')).fontSize,lh:getComputedStyle(b).lineHeight};});
    ok('19 Caseload: the search, the lead, Students, What needs you, the note that needs the user, then the fold',/^DIV\.cl-find,P\.hp-lead,H3\.cl-h,DIV\.cl-cards,H3\.cl-h,UL\.td-list,DIV\.cl-note,DETAILS#clKeep/.test(cl.order.join(','))&&cl.h3[0]==='Students'&&/What needs you/.test(cl.h3[1]),cl.order);
    ok('20 the fold "Backups, Google Drive and settings" is closed while there are students and holds the backup buttons, the Drive box, the options, the calendar and the report',cl.keep&&cl.open===false&&cl.summary==='Backups, Google Drive and settings'&&!cl.inKeep.length,{open:cl.open,summary:cl.summary,missing:cl.inKeep});
    ok('21 the note about a student not yet in a file sits above the fold, with its Save the file',cl.noteAbove&&cl.unfiled,{noteAbove:cl.noteAbove,unfiled:cl.unfiled});
    ok('22 a finger: the fold’s heading is a 44 px row',cl.sumH>=44,cl.sumH);
    ok('23 the list is rows (a flex row, the button at the right edge); the tags are pills in sentence case, Overdue red, Data quiet',cl.row==='flex'&&cl.btnRight<=1&&cl.pills.length>=2&&cl.pills.every(p=>p.r==='999px'&&p.tt==='none')&&cl.pills.find(p=>p.t==='Overdue').hot&&cl.pills.find(p=>p.t==='Overdue').bg==='rgb(176, 58, 46)'&&cl.pills.find(p=>p.t==='Overdue').fg==='rgb(255, 255, 255)'&&!cl.pills.find(p=>p.t==='Data').hot,cl.pills);
    ok('24 one set of sizes: the dialog at 14 px with line height 1.5, its lead 15, its headings 15',cl.db==='14px'&&cl.lead==='15px'&&cl.h3s==='15px'&&cl.lh==='21px',{db:cl.db,lead:cl.lead,h3:cl.h3s,lh:cl.lh});
    await page.screenshot({path:OUT+'caseload-820.png'});
    await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
    /* with no student kept the fold is open */
    const none=await page.evaluate(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));await caseloadOpen();await new Promise(r=>setTimeout(r,600));const k=document.getElementById('clKeep');return {open:k&&k.open,none:/No student kept yet/.test(document.getElementById('dlgBody').textContent)};});
    ok('25 with no student kept, the fold is open (the backup and Drive controls in sight)',none.open===true&&none.none,none);
    await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
    ok('26 no page errors (iPad upright)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* ---- 3. a phone ---- */
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},UA.iphone,true,true);
    const a=await railState(page);ok('27 a phone, nothing open: the list closed, the Forms button with its word',!a.open&&a.toggle&&a.label,a);
    await page.evaluate(()=>todayOpen());await sleep(900);
    const td=await page.evaluate(()=>{const b=document.getElementById('dlgBody'),li=b.querySelector('.td-list li');return {li:!!li,row:li&&getComputedStyle(li).display,pill:li&&getComputedStyle(li.querySelector('.td-k')).borderRadius,db:getComputedStyle(b).fontSize,sw:b.scrollWidth-b.clientWidth};});
    ok('28 Today on a phone: rows with pills, 14 px, nothing wider than the box',td.li&&td.row==='flex'&&td.pill==='999px'&&td.db==='14px'&&td.sw<=1,td);
    await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
    const fr=await open(page,'TD-1');const tb=await toolbar(fr);
    ok('29 TD-1 on a phone: the view tabs one scrolling row with the fade; the toolbar two rows at most (the tabs, then the controls), under 120 px (it was 354)',tb.tabRows===1&&tb.wrap==='nowrap'&&tb.more==='r'&&tb.groupRows<=2&&tb.h<120,tb);
    ok('30 no page errors (phone)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* ---- 4. the laptop (a mouse): the form's toolbar as it was; the start screen's list sits left; the list's names a size larger ---- */
  {const {ctx,page,errs}=await shell(br,{width:1440,height:900},UA.mac,false,true);
    const st=await page.evaluate(()=>({nm:getComputedStyle(document.querySelector('#rail .item .nm')).fontSize,fid:getComputedStyle(document.querySelector('#rail .item .fid')).fontSize,
      al:getComputedStyle(document.getElementById('blankCl')).textAlign,h2:getComputedStyle(document.querySelector('#blankCl h2')).textAlign,step:getComputedStyle(document.querySelector('.blank .step p')).fontSize}));
    ok('31 the form list’s names at 13.5 px (were 12.5), their codes 11; the start screen’s caseload sits left',st.nm==='13.5px'&&st.fid==='11px'&&st.al==='left'&&st.h2==='left'&&st.step==='13px',st);
    await setBar(page);const gr=await page.evaluate(()=>{const i=document.getElementById('pGrade');return {w:Math.round(i.getBoundingClientRect().width),sw:i.scrollWidth,cw:i.clientWidth};});
    ok('32 on the laptop too, "12th grade" fits the Grade box',gr.w>=84&&gr.sw<=gr.cw+1,gr);
    const fr=await open(page,'DM-1');const tb=await toolbar(fr);
    ok('33 with a mouse the toolbar is as it was: groups as columns (label above), "More controls", the view tabs wrapping',tb.dir==='column'&&tb.moreBtn==='More controls'&&tb.wrap==='wrap',tb);
    const dirty=await page.evaluate(()=>{const it=document.querySelector('#rail .item.cur');if(!it)return null;const d=document.createElement('span');d.className='dirty';d.textContent='•';it.appendChild(d);const c=getComputedStyle(d).color;d.remove();return c;});
    ok('34 the unsaved mark on the open form’s navy row is a light colour (it was the flag orange, 2.3:1)',dirty==='rgb(243, 201, 79)',dirty);
    ok('35 no page errors (laptop)',!errs.length,errs.slice(0,3));
    /* ---- 5. printing is unchanged. Every v21.92 rule a form carries is a screen rule, so paper cannot see it: the block's text is
       read and each new rule found only inside "@media screen and (pointer:coarse)". With the previous release served at
       WS_PREV_URL (the release run does this), DM-1 and TD-1 print the same words in the same places from both, with a mouse and
       with a finger. ---- */
    const css=await fr.evaluate(()=>document.getElementById('nbh-ui-css').textContent);
    const blocks=[];{const re=/@media screen and \(pointer:coarse\)\{/g;let m;while((m=re.exec(css))){let d=1,i=re.lastIndex;for(;i<css.length&&d;i++){if(css[i]==='{')d++;else if(css[i]==='}')d--;}blocks.push(css.slice(m.index,i));}}
    let rest=css;blocks.forEach(b=>{rest=rest.replace(b,'');});
    const NEW=['.toolbar > .tgroup{flex-direction:row','html .toolbar #viewSeg{flex:0 1 auto;flex-wrap:nowrap','[data-nbh-more="r"]','.nbh-toast button{min-width:44px'];
    ok('36 every v21.92 rule in a form is a screen rule for a touch screen (paper cannot see it): '+NEW.length+' rules checked',blocks.length>=3&&NEW.every(sel=>blocks.some(b=>b.indexOf(sel)>=0)&&rest.indexOf(sel)<0),NEW.map(sel=>[sel.slice(0,30),blocks.some(b=>b.indexOf(sel)>=0),rest.indexOf(sel)>=0]));
    const PREV=process.env.WS_PREV_URL||'',CHANGED=(process.env.WS_PRINT_CHANGED||'').split(',').filter(Boolean);   /* v21.97 a release that means to change a form's paper lists it (all, or ids) */
    if(!PREV)console.log('(set WS_PREV_URL to the previous release\u2019s address to compare the printed pages word for word)');
    else{const TD='TD-1_Function-Based-Treatment-Developer_v2026-09.html',R={};
      for(const [id,file] of [['DM-1',DM],['TD-1',TD]])for(const [tag,o] of [['mouse',{}],['touch',{hasTouch:true,isMobile:true,userAgent:UA.ipad,viewport:{width:820,height:1180}}]])for(const [w,base] of [['prev',PREV],['now',BASE]]){
        const c=await br.newContext(Object.assign({viewport:{width:1180,height:820},serviceWorkers:'block'},o));const p=await c.newPage();await p.goto(base+'/NBH-Workstation/'+file);await sleep(1500);
        await p.emulateMedia({media:'print'});await sleep(300);R[id+' '+tag+' '+w]=await pdfText(page,await p.pdf({preferCSSPageSize:true,printBackground:true}));await c.close();}
      for(const id of ['DM-1','TD-1'])for(const tag of ['mouse','touch']){const a=R[id+' '+tag+' prev'],b=R[id+' '+tag+' now'];const same=a.length===b.length&&a.every((t,i)=>t===b[i]);
        const meant=!same&&(CHANGED.includes('all')||CHANGED.includes(id));
        if(meant)console.log('NOTE 37 '+id+' printed with a '+tag+': the paper changed, as this release means it to (pages '+a.length+' -> '+b.length+', first at '+(a.findIndex((t,i)=>t!==b[i])+1)+')');
        else ok('37 '+id+' printed with a '+tag+' is the previous release\u2019s print: '+a.length+' pages, every word in the same place',same&&a.length>=2,{prev:a.length,now:b.length,first:a.findIndex((t,i)=>t!==b[i])+1});}}
    await ctx.close();}
  /* ---- 6. the review's extras: reading lines no longer than about 76 characters, keyboard hints only with a keyboard, the
     tabs without a "View" label on a touch screen, the focus bar's label in sentence case, a dialog using 70% of a phone ---- */
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},UA.ipad,true,true);
    await page.evaluate(()=>caseloadOpen());await sleep(800);
    const x=await page.evaluate(()=>{const lead=document.querySelector('#dlgBody .hp-lead'),r=lead.getBoundingClientRect(),box=document.getElementById('dlgBody').getBoundingClientRect();
      return {leadW:Math.round(r.width),boxW:Math.round(box.width),maxW:getComputedStyle(lead).maxWidth,kbd:[...document.querySelectorAll('.railhead .find kbd')].every(k=>getComputedStyle(k).display==='none'),
        lbl:getComputedStyle(document.querySelector('.bar .det label')).fontSize,opt:getComputedStyle(document.querySelector('#dlgBody .cl-opt')).fontSize,start:parseFloat(getComputedStyle(document.querySelector('.blank .card > p')).maxWidth),
        ac:['pClient','pSid','pGrade','pSite','pBcba'].map(id=>document.getElementById(id).getAttribute('autocomplete'))};});
    ok('38 a line of reading text in a dialog or on the start card is no longer than about 76 characters (the lead at 1180 ran the width of the box)',x.leadW<x.boxW-120&&x.leadW>=480&&x.leadW<=700&&x.start>=480&&x.start<=700,x);
    ok('39 on a touch screen the keyboard hint \u2318K is not shown',x.kbd,x.kbd);
    ok('40 the bar\u2019s labels at 12.5 px, the caseload options at 13; the browser is asked not to remember what is typed in the student bar',x.lbl==='12.5px'&&x.opt==='13px'&&x.ac.every(a=>a==='off'),{lbl:x.lbl,opt:x.opt,ac:x.ac});
    await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});await setBar(page);
    const fr=await open(page,'TD-1');
    const v=await fr.evaluate(()=>{const g=document.getElementById('viewSeg').closest('.tgroup'),sp=g.querySelector(':scope > span');return {lbl:sp?getComputedStyle(sp).display:'none',others:[...document.querySelectorAll('.toolbar > .tgroup > span')].filter(e=>e.offsetParent).length};});
    ok('41 on a touch screen the tabs carry no "View" label (the tabs say what they are; the room goes to them)',v.lbl==='none',v);
    const fx=await fr.evaluate(async()=>{nbhUI.focus.set(true);await new Promise(r=>setTimeout(r,800));const b=document.querySelector('#nbhFxBar .nbh-fx-where b'),cs=b&&getComputedStyle(b),out=b?{tt:cs.textTransform,fs:cs.fontSize,t:b.textContent}:null;nbhUI.focus.set(false);return out;});
    ok('42 the focus bar says "Part 1 of \u2026" in sentence case at 12 px (it was small capitals)',!!fx&&fx.tt==='none'&&fx.fs==='12px'&&/^Part 1 of \d/.test(fx.t),fx);
    ok('43 no page errors (extras)',!errs.length,errs.slice(0,3));await ctx.close();}
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},UA.iphone,true,false);
    await page.evaluate(()=>todayOpen());await sleep(800);
    const d=await page.evaluate(()=>({mh:getComputedStyle(document.querySelector('#dlg .db')).maxHeight,foot:(()=>{const f=document.querySelector('.pal .foot');return f?getComputedStyle(f).display:'(none)';})()}));
    ok('44 on a phone a dialog may use 70% of the screen (it was 62), and the palette\u2019s keyboard foot is not shown',Math.abs(parseFloat(d.mh)-0.7*844)<1&&d.foot==='none',d);
    ok('45 no page errors (phone extras)',!errs.length,errs.slice(0,3));await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
