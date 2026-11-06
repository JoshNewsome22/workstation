/* v25.65 top bar A (and the side rail, option C, as a switch): the BCBA's iPad held sideways (1376 x 1032, touch, Safari's
   user agent), a simulated student ("Sample Student", nothing real) and Form TD-1 on its Setup sheet with the list of forms
   closed.
   1. room: three slim rows (the dark row, the student line, the form row), the form starting at about 155 px and its first
      card no lower than about 185 px; while writing (the form scrolled down) the form row is the only bar (at most 60 px)
      and names the student; scrolled back up the rows return.
   2. the dark row: the logo's mark (the logo keeps its name), one status indicator ("All saved", or the chip that needs
      attention, in its words and colour) whose panel holds each status with its own action; Today and Caseload open from it.
   3. the form row: the stepper turns the form's own sheets (‹ ›, and its label lists every sheet); Save form is the form's
      Save data (its id kept), Print prints the form, Close closes it; the form's own toolbar is out of sight.
   4. View: a real menu button (aria-expanded, arrow keys, Escape, focus back) whose every item drives the real feature: Fit /
      Actual size, Focus, Side by side (the panes show, each with its bar), Fullscreen, Open in its own tab, Keep the bars in
      place, More form tools.
   5. the side rail: switched from View and from Tools, kept across a reload; every rail item opens what its twin in the dark
      row opens; Packet, Case and Tools open beside the rail; while writing the rail stays and the form row is the only bar;
      upright (1032 x 1376) the rail is icons only with the names kept for screen readers.
   6. a phone (390 px): no rail, no sideways scroll, in either mode; nothing new prints.
   usage: node qa/v2565-topbar-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ED=process.env.WS_EDITION||'NBH-Workstation';
const MEAS={};
async function ctxFor(br,w,h,mode){const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block'});
  await ctx.addInitScript(m=>{try{if(window.top===window&&!sessionStorage.getItem('v2565')){sessionStorage.setItem('v2565','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    if(m==='rail')localStorage.setItem('nbh.ws.navmode','rail');else localStorage.removeItem('nbh.ws.navmode');localStorage.removeItem('nbh.ws.pinbars');localStorage.removeItem('nbh.focus');localStorage.removeItem('nbh.ws.full');}}catch(e){}},mode||'top');
  return ctx;}
async function start(ctx,errs){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e.message||e).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/'+ED+'/index.html');await sleep(2500);await shut(p);return p;}
const shut=p=>p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});}).catch(()=>{});
async function student(p){await p.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('pClient','Sample Student');set('pSid','000000');set('pGrade','5');set('pSite','Sample Elementary');set('pBcba','Sample BCBA');const f=document.getElementById('barFold');if(f&&!f.hidden)f.click();});await sleep(500);}
async function openForm(p,id){await p.evaluate(id=>openForm(id),id);for(let i=0;i<120;i++){await sleep(500);const r=await p.evaluate(id=>{const f=state.frames[id];try{return !!(f&&f.contentDocument&&f.contentDocument.readyState==='complete'&&f.contentDocument.querySelector('.toolbar'));}catch(e){return false;}},id);if(r)break;}await sleep(2500);}
const railClosed=p=>p.evaluate(()=>{const h=document.getElementById('railHide');if(h&&h.offsetParent&&!NARROW.matches)h.click();if(document.body.classList.contains('rail-open'))setRail(false);});
const box=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();const cs=getComputedStyle(e);return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),vis:b.width>0&&b.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};},s);
/* the one bar on screen at the top: what is drawn at the top-middle of the window, under the finger */
const topAt=(p,x,y)=>p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e?(e.closest('header.top')?'header':e.closest('#bar')?'bar':e.closest('.crumb')?'crumb':e.closest('#wsNav')?'nav':e.tagName==='IFRAME'?'form':e.tagName+'#'+e.id):null;},[x,y]);
const frameTop=p=>p.evaluate(()=>{const f=state.frames[state.cur],fb=f.getBoundingClientRect(),d=f.contentDocument;
  const sh=[...d.querySelectorAll('main.sheet,.sheet:not(table)')].find(e=>e.getBoundingClientRect().height>0);
  const inp=[...d.querySelectorAll('input:not([type=hidden]),textarea,select')].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&!e.closest('.toolbar,#nbhRail')&&getComputedStyle(e).visibility!=='hidden';});
  return {frame:Math.round(fb.top),card:sh?Math.round(fb.top+sh.getBoundingClientRect().top):null,field:inp?Math.round(fb.top+inp.getBoundingClientRect().top):null};});
async function scrollForm(p,to){await p.evaluate(to=>{const f=state.frames[state.cur];const w=f.contentWindow;let y=w.scrollY;const st=to>y?60:-60;const t=setInterval(()=>{y+=st;if((st>0&&y>=to)||(st<0&&y<=to)){y=to;clearInterval(t);}w.scrollTo(0,y);},30);},to);await sleep(2600);}
const dlgTitle=p=>p.evaluate(()=>{const d=document.getElementById('dlg');return d&&d.open?document.getElementById('dlgTitle').textContent.trim():'';});
async function viewTap(p,id){const v=p.locator('#aView');await v.tap();await sleep(300);const it=p.locator('#wsViewMenu [data-wn-for="'+id+'"]');const vis=await it.isVisible().catch(()=>false);if(vis){await it.tap();await sleep(500);}return vis;}
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  /* ================= top bar (option A) at 1376 x 1032 ================= */
  const ctx=await ctxFor(br,1376,1032,'top');const p=await start(ctx,errs);await student(p);await openForm(p,'TD-1');await railClosed(p);await sleep(1500);
  const hd=await box(p,'header.top'),nv=await box(p,'#wsNav'),bar=await box(p,'#bar'),cr=await box(p,'.stagew>.crumb'),ft=await frameTop(p);
  MEAS.topShown=ft.frame;MEAS.cardShown=ft.card;MEAS.fieldShown=ft.field;
  ok('1 three slim rows: the dark row ('+hd.h+' px), the student line ('+bar.h+' px), the form row ('+cr.h+' px); the white heading row is gone',hd.y===0&&hd.h>=50&&hd.h<=58&&nv.y===0&&nv.h===hd.h&&bar.y===hd.h&&bar.h>=40&&bar.h<=52&&cr.y===bar.y+bar.h&&cr.h>=48&&cr.h<=58,{hd,nv,bar,cr});
  ok('1 the form starts at '+ft.frame+' px, its first card at '+ft.card+' px (at most about 185), its first field at '+ft.field+' px (it was about 400)',ft.frame<=165&&ft.card<=190,ft);
  const brand=await p.evaluate(()=>({title:document.title,alt:document.getElementById('logo').alt,inRow:!!document.querySelector('#wsNav #wsMark #logo'),logoW:Math.round(document.getElementById('logo').getBoundingClientRect().width),
    mark:Math.round(document.getElementById('wsMark').getBoundingClientRect().width),h1:document.querySelector('header.top h1').textContent,chipsTop:!!document.querySelector('header.top #wsChips')}));
  ok('2 the logo is a small mark at the left of the dark row; it keeps its name, and the page keeps the workstation\'s name',brand.inRow&&brand.mark<=40&&/Workstation/.test(brand.title)&&brand.alt.length>3&&brand.h1==='FBA and BIP Workstation'&&!brand.chipsTop,brand);
  const order=await p.evaluate(()=>[...document.querySelectorAll('#wsNav > *')].filter(e=>e.getBoundingClientRect().width>0&&!e.classList.contains('wn-sep')&&!e.classList.contains('wn-sp')).map(e=>e.id==='wsMark'?'mark':e.classList.contains('wn-right')?[...e.children].filter(c=>c.getBoundingClientRect().width>0).map(c=>c.textContent.replace(/\s+/g,' ').trim()).join('+'):(e.querySelector('.wa-t')||e).textContent.replace(/\s+/g,' ').trim()));
  /* v25.68 (design review H7): no Packet menu ("packet" is the printed document: Build packet); the indicator reports the case file */
  ok('2 the dark row: the mark, Forms, Case map, Documents, Case, Tools, Today, Caseload, Help, the indicator, then Save case, Build packet, Finish PDF',
    JSON.stringify(order.slice(0,9))===JSON.stringify(['mark','Forms','Case map','Documents','Case','Tools','Today','Caseload','Help'])&&/saved|nothing to save|no case/i.test(order[9]||'')&&/^Save case\+Build packet\+Finish PDF$/.test(order[10]||''),order);
  const formsBtns=await p.evaluate(()=>[...document.querySelectorAll('header.top button, #bar button, .crumb button')].filter(b=>b.getBoundingClientRect().width>0&&/^Forms$/.test((b.innerText||'').trim())).length);
  ok('3 one Forms button above the form (the form row has the list\'s icon only)',formsBtns===1&&(await box(p,'#railToggle')).vis&&!(await p.evaluate(()=>{const l=document.querySelector('#railToggle .lbl');return l&&l.getBoundingClientRect().width>0;})),formsBtns);
  /* the student line */
  const sl=await p.evaluate(()=>{const s=document.getElementById('barSum');const v=[...s.children].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.id||e.className);return {v,name:document.getElementById('sumName').textContent,det:document.getElementById('sumDet').textContent,
    edit:getComputedStyle(document.getElementById('barEdit')).textDecorationLine,ini:document.getElementById('sumIni').textContent,h:Math.round(s.getBoundingClientRect().height)};});
  ok('3 the student line: photo or initials, name, "ID · Grade · School · BCBA", and Edit details as a link',sl.name==='Sample Student'&&/000000 · 5th grade · Sample Elementary · Sample BCBA|000000 · Grade 5 · Sample Elementary · Sample BCBA/.test(sl.det)&&sl.ini==='SS'&&/underline/.test(sl.edit)&&sl.v.includes('barEdit')&&sl.h<=48,sl);
  /* the case summary, from what the shell knows of the case (simulated facts) */
  const cs=await p.evaluate(()=>{state.facts=Object.assign({},state.facts||{},{behaviors:[{n:1},{n:2},{n:3},{n:4},{n:5},{n:6}],fn:{key:'unknown'},goals:{red:[1,2,3,4],acq:[1,2,3,4,5]}});paintSum();
    const a=document.getElementById('sumCaseA'),n=document.getElementById('sumName');return {t:a.textContent,old:document.getElementById('sumCase').textContent,aw:Math.round(a.getBoundingClientRect().width),nw:Math.round(n.getBoundingClientRect().width),nsw:n.scrollWidth};});
  ok('3 the case summary on the student line reads "Case: 6 target behaviors · function unknown · 9 goals" (the old line\'s words kept for the shell)',cs.t==='Case: 6 target behaviors · function unknown · 9 goals'&&/^The case: 6 target behaviors, function: unknown, 9 goals/.test(cs.old),cs);
  /* the form row */
  const row=await p.evaluate(()=>{const c=document.querySelector('.stagew>.crumb');const v=[...c.querySelectorAll('button,span,b')].filter(e=>e.parentElement&&(e.parentElement===c||e.parentElement.classList.contains('acts')||e.parentElement.id==='aStep')&&e.getBoundingClientRect().width>0)
      .map(e=>e.id||e.className);const d=state.frames[state.cur].contentDocument;
    return {v,title:document.getElementById('crumbTitle').textContent,code:document.getElementById('aCode').textContent,sheet:document.getElementById('aSheet').textContent,next:document.getElementById('aNext').textContent,
      wrap:Math.round(c.getBoundingClientRect().height),tb:getComputedStyle(d.querySelector('.toolbar')).display,save:document.getElementById('aSave').textContent.trim(),quick:!!d.getElementById('nbhSaveQuick'),
      gone:['crumbFile','crumbPhoto','saveQuick','crumbId'].filter(id=>document.getElementById(id).getBoundingClientRect().width>0)};});
  /* v25.68 (design review M1, H1): the form's short name (the full name in its tooltip); the fields filled are in the form's status
     panel and Save form is Export this form in View, so neither is in the row */
  ok('4 the form row: the list toggle, TD-1 and the form\'s short name, "‹ Setup · 1 of 13 ›" with "Next: Select treatment", Dictate, Print, View and Close, on one row',
    row.code==='TD-1'&&row.title==='Treatment plan'&&row.sheet==='Setup · 1 of 13'&&row.next==='Next: Select treatment'&&['railToggle','aCode','crumbTitle','aStep','aNext','aDict','printOne','aView','closeForm'].every(x=>row.v.includes(x))&&!row.v.includes('aSave')&&row.wrap<=58,row);
  ok('4 gone from the row: the file name, the second student picture, the second Save case; the form\'s own toolbar is out of sight (Save data keeps its id in the form)',row.gone.length===0&&row.tb==='none'&&row.quick,row);
  /* the status indicator */
  let st=await p.evaluate(()=>({t:document.getElementById('wsStat').textContent.trim(),k:document.getElementById('wsStat').className,chips:['autoChip','offChip','drvChip'].map(id=>{const c=document.getElementById(id);return c&&!c.hidden?c.className+':'+c.textContent.trim():null;}).filter(Boolean)}));
  /* v25.68 (design review H1): the indicator reports the case file; a status that needs attention is a mark beside it and in its name */
  ok('5 one status indicator in the dark row, reporting the case file ("Not saved to a file …", "Case saved …", "Nothing to save yet")',/^(Not saved to a file|Case saved|Saved to|Nothing to save yet|No case open)/.test(st.t),st);
  await p.evaluate(()=>autoSet(false));await sleep(400);
  st=await p.evaluate(()=>({t:document.getElementById('wsStat').textContent.trim(),k:document.getElementById('wsStat').className,dot:getComputedStyle(document.querySelector('#wsStat .wa-dot')).backgroundColor}));
  st.lab=await p.evaluate(()=>document.getElementById('wsStat').getAttribute('aria-label'));st.x=await p.evaluate(()=>!!document.querySelector('#wsStat .wa-x'));
  ok('5 a status that needs attention is named in the indicator\'s name, with a mark beside its dot (Autosave off)',/Also: Autosave off/.test(st.lab)&&st.x,st);
  await p.locator('#wsStat').tap();await sleep(400);
  const pan=await p.evaluate(()=>{const P=document.getElementById('wsStatPanel');return {open:!P.hidden,exp:document.getElementById('wsStat').getAttribute('aria-expanded'),chips:[...P.querySelectorAll('button.chip')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.id+': '+b.textContent.trim()),focus:document.activeElement&&document.activeElement.id};});
  ok('5 tapping it opens a small panel with each status as it reads (Autosave off, the offline copy)',pan.open&&pan.exp==='true'&&pan.chips.some(c=>/^autoChip: Autosave off/.test(c)),pan);
  await p.locator('#wsStatPanel #autoChip').tap();await sleep(700);const act=await p.evaluate(()=>({dlg:document.getElementById('dlg').open,cf:document.getElementById('cfDlg').open,t:(document.getElementById('dlgTitle').textContent||'')+(document.getElementById('cfTitle').textContent||'')}));
  ok('5 ... and each one\'s own action (Autosave off: its question to turn it back on, or its copies)',act.dlg||act.cf,act);await shut(p);await p.evaluate(()=>autoSet(true));await sleep(300);
  await p.locator('#wsStat').tap();await sleep(300);await p.keyboard.press('Escape');await sleep(200);
  const esc1=await p.evaluate(()=>({open:!document.getElementById('wsStatPanel').hidden,f:document.activeElement&&document.activeElement.id}));ok('5 Escape closes the panel, focus back on the indicator',!esc1.open&&esc1.f==='wsStat',esc1);
  /* Today and Caseload */
  await p.locator('#wsNav #todayBtn').tap();await sleep(1500);const tday=await dlgTitle(p);await shut(p);
  await p.locator('#wsNav #caseloadBtn').tap();await sleep(1500);const cl=await dlgTitle(p);await shut(p);
  ok('6 Today and Caseload open from the dark row (their own buttons, moved there)',/^Today/.test(tday)&&/^Caseload/.test(cl),{tday,cl});
  /* the stepper */
  await p.locator('#aNextB').tap();await sleep(900);
  let sh=await p.evaluate(()=>{const d=state.frames[state.cur].contentDocument;const on=[...d.querySelectorAll('#viewSeg button')].find(b=>b.getAttribute('aria-pressed')==='true'||b.classList.contains('active')||b.classList.contains('on'));return {label:document.getElementById('aSheet').textContent,form:on&&on.textContent.trim(),next:document.getElementById('aNext').textContent};});
  ok('7 › turns the form to its next sheet (the form\'s own control)',sh.label==='Select treatment · 2 of 13'&&/Select treatment/.test(sh.form||'')&&sh.next==='Next: Build components',sh);
  await p.locator('#aPrev').tap();await sleep(900);sh=await p.evaluate(()=>document.getElementById('aSheet').textContent);ok('7 ‹ turns it back',sh==='Setup · 1 of 13',sh);
  await p.locator('#aSheet').tap();await sleep(400);
  const sm=await p.evaluate(()=>{const m=document.getElementById('wsSheetMenu');return {open:!m.hidden,n:m.querySelectorAll('[role=menuitem]').length,cur:(m.querySelector('[aria-current=true]')||{}).textContent,exp:document.getElementById('aSheet').getAttribute('aria-expanded')};});
  ok('7 the stepper\'s label lists every sheet (a menu, the open one marked)',sm.open&&sm.n===13&&sm.cur==='1. Setup'&&sm.exp==='true',sm);
  await p.locator('#wsSheetMenu [role=menuitem]').nth(4).tap();await sleep(900);sh=await p.evaluate(()=>document.getElementById('aSheet').textContent);
  ok('7 ... and opens the one chosen',/^Reinforcers & schedules · 5 of 13$/.test(sh),sh);
  await p.locator('#aSheet').tap();await sleep(300);await p.locator('#wsSheetMenu [role=menuitem]').first().tap();await sleep(700);
  /* View: a real menu button */
  await p.locator('#aView').focus();await p.keyboard.press('Enter');await sleep(400);
  const vm=await p.evaluate(()=>{const m=document.getElementById('wsViewMenu');return {open:!m.hidden,exp:document.getElementById('aView').getAttribute('aria-expanded'),role:m.getAttribute('role'),hasp:document.getElementById('aView').getAttribute('aria-haspopup'),
    items:[...m.querySelectorAll('[role^=menuitem]')].map(b=>b.textContent.replace(/\s+/g,' ').replace(/^\u2713/,'').trim()+(b.getAttribute('aria-checked')==='true'?' [on]':'')),f:document.activeElement&&document.activeElement.textContent.trim()};});
  ok('8 View is a real menu: aria-haspopup, aria-expanded, menu items (Fit to screen, Actual size, Focus, Side by side, Fullscreen, Open in its own tab, Keep the bars in place, More form tools, the navigation)',
    vm.open&&vm.exp==='true'&&vm.role==='menu'&&vm.hasp==='menu'&&['Fit to screen','Actual size','Focus: one part at a time','Side by side','Fullscreen','Open in its own tab','Keep the bars in place','More form tools…','Top bar','Side rail'].every(t=>vm.items.some(x=>x.indexOf(t)===0)),vm);
  await p.keyboard.press('ArrowDown');const f2=await p.evaluate(()=>document.activeElement.textContent.trim());await p.keyboard.press('Escape');await sleep(200);
  const f3=await p.evaluate(()=>({open:!document.getElementById('wsViewMenu').hidden,f:document.activeElement.id,exp:document.getElementById('aView').getAttribute('aria-expanded')}));
  ok('8 ... arrow keys move through it, Escape closes it with the focus back on View',/Actual size/.test(f2)&&!f3.open&&f3.f==='aView'&&f3.exp==='false',{f2,f3});
  /* every item drives the real feature */
  const fitOf=()=>p.evaluate(()=>state.frames[state.cur].contentDocument.getElementById('nbhFitBtn').getAttribute('aria-pressed'));
  await viewTap(p,'nbhFitBtn:actual');const fa=await fitOf();await viewTap(p,'nbhFitBtn');const fb=await fitOf();
  ok('9 View › Actual size and Fit to screen switch the form\'s own zoom',fa==='false'&&fb==='true',{fa,fb});
  await viewTap(p,'focusBtn');const fo1=await p.evaluate(()=>({on:focusOn(),pr:document.getElementById('focusBtn').getAttribute('aria-pressed')}));await viewTap(p,'focusBtn');const fo2=await p.evaluate(()=>focusOn());
  ok('9 View › Focus turns Focus on and off',fo1.on&&fo1.pr==='true'&&!fo2,{fo1,fo2});
  await viewTap(p,'fullBtn');const fu=await p.evaluate(()=>({full:document.body.classList.contains('ws-full'),exit:(()=>{const b=document.getElementById('fullBtn').getBoundingClientRect();return b.width>0;})(),who:document.querySelector('#crumbWho b').textContent,whoVis:document.getElementById('crumbWho').getBoundingClientRect().width>0}));
  await p.locator('#fullBtn').tap();await sleep(400);const fu2=await p.evaluate(()=>document.body.classList.contains('ws-full'));
  ok('9 View › Fullscreen: only the form row and the form (the student named in it, Fullscreen\'s own button to leave); its button turns it off',fu.full&&fu.exit&&fu.whoVis&&fu.who==='Sample Student'&&!fu2,{fu,fu2});
  const [pop]=await Promise.all([ctx.waitForEvent('page',{timeout:15000}).catch(()=>null),viewTap(p,'popOut')]);await sleep(1500);
  const popUrl=pop?decodeURIComponent(pop.url()):'';if(pop)await pop.close().catch(()=>{});await shut(p);
  ok('9 View › Open in its own tab opens the form in a tab of its own',/TD-1/.test(popUrl)||/^blob:/.test(popUrl),popUrl);
  await viewTap(p,'pinBars');const pin1=await p.evaluate(()=>__wsBars.pinned());await scrollForm(p,900);const pinSt=await p.evaluate(()=>__wsBars.state());
  await viewTap(p,'pinBars');const pin2=await p.evaluate(()=>__wsBars.pinned());await scrollForm(p,0);
  ok('9 View › Keep the bars in place (a checked item) keeps them while scrolling, and lets them fold again when unticked',pin1&&pinSt==='shown'&&!pin2,{pin1,pinSt,pin2});
  await viewTap(p,'nbhMoreBtn');await sleep(500);const mo=await p.evaluate(()=>{const d=state.frames[state.cur].contentDocument,tb=d.querySelector('.toolbar');return {compact:d.documentElement.classList.contains('nbh-compact'),tb:getComputedStyle(tb).display,save:!!d.querySelector('#saveBtn')&&d.querySelector('#saveBtn').getBoundingClientRect().width>0,maxw:getComputedStyle(tb).maxWidth};});
  const moLabel=await p.evaluate(()=>{document.getElementById('aView').click();const t=[...document.querySelectorAll('#wsViewMenu [data-wn-for="nbhMoreBtn"]')].map(b=>b.textContent.trim()).join();window.__wsA.shut();return t;});
  await viewTap(p,'nbhMoreBtn');await sleep(500);const mo2=await p.evaluate(()=>{const d=state.frames[state.cur].contentDocument;return {compact:d.documentElement.classList.contains('nbh-compact'),tb:getComputedStyle(d.querySelector('.toolbar')).display};});
  ok('9 View › More form tools shows the form\'s own More (its other tools, not boxed to the page\'s width); Fewer form tools puts them away',!mo.compact&&mo.tb!=='none'&&mo.save&&mo.maxw==='none'&&/Fewer form tools/.test(moLabel)&&mo2.compact&&mo2.tb==='none',{mo,moLabel,mo2});
  /* Save form, Print, Close */
  const sv=await p.evaluate(()=>{const d=state.frames[state.cur].contentDocument;window.__saved=0;window.__quick=0;d.getElementById('saveBtn').addEventListener('click',()=>{window.__saved++;},{capture:true});d.getElementById('nbhSaveQuick').addEventListener('click',()=>{window.__quick++;},{capture:true});return true;});
  /* v25.68 (design review H1): Save form is Export this form, in View */
  await viewTap(p,'aSave');await sleep(1200);await shut(p);const saved=await p.evaluate(()=>({save:window.__saved,quick:window.__quick}));
  ok('10 View › Export this form presses the form\'s Save data (its quick button, once, which saves)',saved.quick===1&&saved.save>=1,saved);
  await p.evaluate(()=>{window.__printed=0;state.frames[state.cur].contentWindow.print=()=>{window.__printed++;};});
  await p.locator('#printOne').tap();await sleep(500);ok('10 Print prints the form',await p.evaluate(()=>window.__printed)===1);
  /* while writing */
  await scrollForm(p,1100);
  const w1=await p.evaluate(()=>__wsBars.state()),wc=await box(p,'.stagew>.crumb'),wt=await frameTop(p),wTop=await topAt(p,688,20),wWho=await p.evaluate(()=>({t:document.querySelector('#crumbWho b').textContent,v:document.getElementById('crumbWho').getBoundingClientRect().width>0,stat:document.getElementById('aStat2').getBoundingClientRect().width>0}));
  MEAS.topWriting=wt.frame;
  ok('11 while writing: the dark row and the student line fold away, the form row is the only bar ('+wc.h+' px at the top, the form from '+wt.frame+' px)',w1==='folded'&&wc.y===0&&wc.h<=60&&wt.frame<=60&&wTop==='crumb',{w1,wc,wt,wTop,cls:await p.evaluate(()=>document.body.className+' pin='+__wsBars.pinned())});
  ok('11 ... naming the student (a small avatar and the name at its left), with the status',wWho.v&&wWho.t==='Sample Student'&&wWho.stat,wWho);
  await scrollForm(p,0);await sleep(800);const w2=await p.evaluate(()=>__wsBars.state()),w2t=await frameTop(p),w2h=await topAt(p,688,20),w2b=await topAt(p,688,75);
  ok('11 scrolling back up brings the rows back (the dark row and the student line over the form again)',/^(shown|over)$/.test(w2)&&w2h==='header'&&w2b==='bar',{w2,w2t,w2h,w2b});
  /* side by side */
  await openForm(p,'DM-1');await p.evaluate(()=>openForm('TD-1'));await sleep(1500);
  await viewTap(p,'splitBtn');await sleep(500);const chooser=await p.evaluate(()=>document.getElementById('dlg').open&&document.querySelectorAll('#dlgBody .sb-row').length);
  await p.evaluate(()=>{document.querySelectorAll('#dlgBody .sb-row input').forEach(c=>{if(!c.checked){c.checked=true;c.dispatchEvent(new Event('change'));}});document.getElementById('sbGo').click();});await sleep(2500);
  const sb=await p.evaluate(()=>{const fr=Object.values(state.frames).filter(f=>f.getBoundingClientRect().width>100&&!f.hidden);return {split:splitOn(),panes:document.querySelectorAll('#paneBar .pane').length,pb:document.getElementById('paneBar').getBoundingClientRect().height,frames:fr.length,
    tbs:fr.map(f=>getComputedStyle(f.contentDocument.querySelector('.toolbar')).display),step:document.getElementById('aStep').getBoundingClientRect().width,view:document.getElementById('aView').getBoundingClientRect().width>0};});
  ok('12 View › Side by side: the chooser, then the panes, each with its own bar and toolbar; the form row\'s one-form controls step aside',chooser>=2&&sb.split&&sb.panes>=2&&sb.pb>0&&sb.frames>=2&&sb.tbs.every(d=>d!=='none')&&sb.step===0&&sb.view,{chooser,sb});
  await p.evaluate(()=>setSplit([]));await sleep(800);
  /* Close */
  await p.evaluate(()=>{wsUI.confirm=()=>Promise.resolve(true);wsUI.choose=()=>Promise.resolve('keep');});await p.locator('#closeForm').tap();await sleep(1200);
  ok('10 Close (✕) closes the form',await p.evaluate(()=>state.cur!=='TD-1'));
  /* nothing new prints */
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>['wsStat','wsMark','aView','aStep','aSave','crumbWho','wsStatPanel','wsViewMenu','aStat2','sumCaseA'].filter(id=>{const e=document.getElementById(id);if(!e)return false;const b=e.getBoundingClientRect();return b.width>0&&b.height>0;}));
  await p.emulateMedia({media:'screen'});ok('13 nothing new prints (the indicator, the mark, the form row\'s controls, the menus)',pr.length===0,pr);
  /* ================= the side rail ================= */
  await openForm(p,'TD-1');
  await viewTap(p,'aNavRail');await sleep(600);
  let rl=await p.evaluate(()=>({rail:document.body.classList.contains('ws-navrail'),nav:(()=>{const b=document.getElementById('wsNav').getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)];})(),mode:localStorage.getItem('nbh.ws.navmode')}));
  ok('14 View › Navigation: Side rail puts the places in a rail down the left (about 86 px), kept on the device',rl.rail&&rl.nav[0]===0&&rl.nav[1]===0&&rl.nav[2]>=80&&rl.nav[2]<=92&&rl.nav[3]===1032&&rl.mode==='rail',rl);
  await p.reload();await sleep(3000);await shut(p);
  rl=await p.evaluate(()=>document.body.classList.contains('ws-navrail'));ok('14 ... and still there after a reload',rl);
  await student(p);await openForm(p,'TD-1');await railClosed(p);await sleep(1200);
  const rb=await box(p,'#bar'),rc=await box(p,'.stagew>.crumb'),rft=await frameTop(p),rr=await p.evaluate(()=>{const r=document.querySelector('#bar > .wn-right');return r?[...r.children].filter(c=>c.getBoundingClientRect().width>0).map(c=>c.textContent.trim()):null;});
  MEAS.railShown=rft.frame;MEAS.railCard=rft.card;
  ok('14 the top keeps the student line (Save case, Build packet and Finish PDF at its right) and the form row: the form from '+rft.frame+' px',rb.y===0&&rb.x>=80&&rc.y===rb.h&&rft.frame<=115&&JSON.stringify(rr)===JSON.stringify(['Save case','Build packet','Finish PDF']),{rb,rc,rft,rr});
  const ritems=await p.evaluate(()=>[...document.querySelectorAll('#wsNav > *')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.id==='wsMark'?'mark':e.id==='wsStat'?'status':(e.querySelector('.wa-t')||e).textContent.replace(/\s+/g,' ').trim()));
  ok('14 the rail: the mark at the top, Forms, Case map, Documents, Case, Tools, Today, Caseload, Help, the status at the bottom (v25.68 H7: no Packet menu)',JSON.stringify(ritems)===JSON.stringify(['mark','Forms','Case map','Documents','Case','Tools','Today','Caseload','Help','status']),ritems);
  const icoOk=await p.evaluate(()=>[...document.querySelectorAll('#wsNav .wn-item')].filter(e=>e.getBoundingClientRect().width>0).every(e=>{const i=e.querySelector('svg.wa-ico'),t=e.querySelector('.wa-t,.lbl');return i&&t&&i.getBoundingClientRect().bottom<=t.getBoundingClientRect().top+1;}));
  ok('14 each rail item is an icon above a short label',icoOk);
  /* every rail item opens what its twin in the dark row opens */
  const twin=async()=>{const out={};
    for(const [k,sel] of [['Case map','#caseMap'],['Documents','#readDoc'],['Today','#todayBtn'],['Caseload','#caseloadBtn'],['Help','#help']]){await p.locator('#wsNav '+sel).tap();await sleep(1500);out[k]=await dlgTitle(p);await shut(p);await sleep(200);}
    for(const k of ['case','tools']){await p.locator('#wsNav [data-wn-menu="'+k+'"]').tap();await sleep(400);out[k]=await p.evaluate(()=>{const m=document.getElementById('wsNavMenu');const b=m.getBoundingClientRect();return m.hidden?null:{items:[...m.querySelectorAll('button')].filter(x=>x.offsetParent).map(x=>x.dataset.wnFor).join(','),x:Math.round(b.left),y:Math.round(b.top)};});
      await p.keyboard.press('Escape');await sleep(200);}
    const f0=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden'),open:document.body.classList.contains('rail-open')}));await p.locator('#wsNav #wnForms').tap();await sleep(600);
    const f1=await p.evaluate(()=>({hid:document.body.classList.contains('rail-hidden'),open:document.body.classList.contains('rail-open'),x:Math.round(document.getElementById('railNav').getBoundingClientRect().left),w:Math.round(document.getElementById('railNav').getBoundingClientRect().width)}));
    await p.locator('#wsNav #wnForms').tap();await sleep(600);out.forms={f0,f1};return out;};
  const inRail=await twin();
  await viewTap(p,'aNavTop');await sleep(600);const backTop=await p.evaluate(()=>!document.body.classList.contains('ws-navrail')&&!!document.querySelector('header.top #wsNav'));
  const inTop=await twin();
  const same=['Case map','Documents','Today','Caseload','Help'].every(k=>inRail[k]&&inRail[k]===inTop[k])&&['case','tools'].every(k=>inRail[k]&&inTop[k]&&inRail[k].items.replace(/,?aNav\w+/g,'').length>0)&&inRail.forms.f1.hid!==inRail.forms.f0.hid&&inTop.forms.f1.hid!==inTop.forms.f0.hid;
  ok('15 every rail item opens what its twin in the dark row opens (Forms the list, Case map, Documents, Case, Tools, Today, Caseload, Help)',same,{inRail,inTop});
  ok('15 Case and Tools open their menus beside the rail; the list of forms slides out right of the rail',['case','tools'].every(k=>inRail[k].x>=86)&&inRail.forms.f1.x>=86,{x:['case','tools'].map(k=>inRail[k].x),forms:inRail.forms});
  ok('15 View › Navigation: Top bar puts the places back in the dark row',backTop);
  /* Tools › Navigation, with no form open */
  await p.evaluate(()=>{wsUI.confirm=()=>Promise.resolve(true);wsUI.choose=()=>Promise.resolve('keep');});
  for(let i=0;i<4&&await p.evaluate(()=>!!state.cur);i++){await p.locator('#closeForm').tap();await sleep(1000);}
  const tl=await L.navTap(p,'#aNavRail',true);await sleep(600);const tr=await p.evaluate(()=>({rail:document.body.classList.contains('ws-navrail'),form:!!state.cur}));
  ok('16 Tools › Navigation: Side rail switches it with no form open',tl&&tr.rail&&!tr.form,{tl,tr});
  /* while writing, in the rail */
  await openForm(p,'TD-1');await railClosed(p);await sleep(800);await scrollForm(p,1100);
  const rw=await p.evaluate(()=>__wsBars.state()),rwc=await box(p,'.stagew>.crumb'),rwn=await box(p,'#wsNav'),rwt=await frameTop(p);MEAS.railWriting=rwt.frame;
  ok('16 while writing in the rail: the rail stays, the student line folds away, the form row is the only bar ('+rwc.h+' px)',rw==='folded'&&rwn.vis&&rwn.w>=80&&rwc.y===0&&rwc.h<=60&&rwt.frame<=60,{rw,rwc,rwn,rwt});
  await scrollForm(p,0);
  await ctx.close();
  /* ================= upright: the rail is icons only ================= */
  const c2=await ctxFor(br,1032,1376,'rail');const p2=await start(c2,errs);await student(p2);await openForm(p2,'TD-1');
  const ic=await p2.evaluate(()=>{const n=document.getElementById('wsNav').getBoundingClientRect();const its=[...document.querySelectorAll('#wsNav .wn-item')].filter(e=>e.getBoundingClientRect().width>0);
    return {w:Math.round(n.width),labels:its.map(e=>{const t=e.querySelector('.wa-t,.lbl');return t?Math.round(t.getBoundingClientRect().width):-1;}),names:its.map(e=>(e.getAttribute('aria-label')||e.textContent).replace(/\s+/g,' ').trim()),tips:its.filter(e=>!e.title).length};});
  ok('17 upright (1032 x 1376) the rail is icons only (its names kept for screen readers and in the tooltips)',ic.w<=70&&ic.labels.every(x=>x<=1)&&ic.names.every(x=>x.length>=4)&&ic.tips===0,ic);
  const up=await frameTop(p2);MEAS.uprightRail=up.frame;
  const upTop=await p2.evaluate(()=>{localStorage.removeItem('nbh.ws.navmode');__wsA.place();return true;});await sleep(500);const up2=await frameTop(p2);MEAS.uprightTop=up2.frame;
  const upRow=await p2.evaluate(()=>{const n=document.getElementById('wsNav');return {over:n.scrollWidth>n.clientWidth+1,c:document.querySelector('.stagew>.crumb').scrollWidth>document.querySelector('.stagew>.crumb').clientWidth+1};});
  ok('17 upright with the top bar: the dark row and the form row each keep to one row',!upRow.over&&!upRow.c,upRow);
  await c2.close();
  /* ================= a phone ================= */
  for(const mode of ['top','rail']){const c3=await ctxFor(br,390,844,mode);const p3=await start(c3,errs);await student(p3);await openForm(p3,'TD-1');
    const ph=await p3.evaluate(()=>({a:document.body.classList.contains('ws-a'),rail:document.body.classList.contains('ws-navrail'),sw:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),tb:getComputedStyle(state.frames[state.cur].contentDocument.querySelector('.toolbar')).display}));
    ok('18 a phone (390 px, '+mode+'): today\'s phone layout, no rail, no sideways scroll, the form\'s own toolbar',!ph.a&&!ph.rail&&ph.sw<=390&&ph.tb!=='none',ph);await c3.close();}
  /* other iPad and laptop sizes: one row each, no sideways scroll */
  for(const [w,h,mode] of [[1180,820,'top'],[1180,820,'rail'],[1024,768,'top'],[820,1180,'top'],[1440,900,'top'],[1300,860,'rail']]){const c4=await ctxFor(br,w,h,mode);const p4=await start(c4,errs);await student(p4);await openForm(p4,'TD-1');
    const g=await p4.evaluate(()=>{const over=[...document.querySelectorAll('#wsNav,.stagew>.crumb,#barSum')].filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+1).map(e=>e.id||e.className);
      const small=[...document.querySelectorAll('#wsNav button,.stagew>.crumb button,#barSum button,#bar>.wn-right button')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.height<43.5||r.width<43.5);}).map(b=>b.id||b.textContent.trim());
      return {over,small,sw:document.documentElement.scrollWidth-innerWidth,crumbH:Math.round(document.querySelector('.stagew>.crumb').getBoundingClientRect().height)};});
    ok('19 '+w+' x '+h+' ('+mode+'): every row keeps to one row, no sideways scroll, every target 44 px',g.over.length===0&&g.sw<=0&&g.crumbH<=58&&g.small.length===0,g);await c4.close();}
  }catch(e){ok('the run finished without an error',false,String(e&&e.stack||e).slice(0,600));}
  const bad=errs.filter(e=>!/ResizeObserver|favicon|Failed to load resource/.test(e));ok('no page errors',bad.length===0,bad.slice(0,5));
  console.log('MEASURED '+JSON.stringify(MEAS));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
