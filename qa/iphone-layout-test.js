/* v23.74 the workstation on an iPhone (the BCBA's screenshot: a third of the screen before anything to read, two buttons
   without words, four items a screen, one deadline four times). Simulated students kept on this device, the clock at
   Tuesday 10/20/2026, an iPhone's window (390 x 844, touch):
   1. along the bottom, Forms, Caseload, Today and More, each with its word and a finger's height; each runs the
      workstation's own button (Forms opens and closes the list of forms, Caseload and Today their windows);
   2. the top is one slim row on the start screen; with a form open, the form's row holds its name, Save and Close on one
      line; More holds the rest (Print, Focus, Fullscreen, its own tab, Close this form; Save, Open and Close case, ...),
      each running its button;
   3. where you left off is one row; a tap anywhere on it opens that student's case;
   4. What's due shows its counts; By date shows the rows, and a tap anywhere on a row opens it;
   5. a card a student: the name once; what needs you most first (a restraint notice before an overdue date, before this
      week), each deadline once with its days counted from today (10/18 in RR-1 and DM-1 is one row, 2 days overdue);
      the rest under "+N more"; a tap on a row opens that form, a tap on the name the case;
   6. the cards run edge to edge, nothing wider than the screen; Today's count is on the bar; a message sits above it;
   7. the iPad and the laptop are as they were: no bar, the form's row and its buttons, the rows of What's due, the
      cards as before;
   8. axe-core's WCAG 2.1 A and AA rules on the phone's start screen (the rows by date and a card's "+N more" open) and
      on More (skipped, and said, where axe-core is not installed);
   9. no page errors. Simulated data only.  usage: node qa/iphone-layout-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const path=require('path');
let AXE=null;try{AXE=require('fs').readFileSync(require.resolve('axe-core/axe.min.js',{paths:[__dirname,path.join(__dirname,'node_modules')].concat((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean))}),'utf8');}catch(e){AXE=null;}
async function axe(p){if(!AXE)return null;await p.addScriptTag({content:AXE});
  /* meta-viewport left out: on an iPhone only, v23.55 (review F488) adds maximum-scale=1 so Safari does not zoom into a
     tapped field; Safari keeps pinch zoom whatever it says (since iOS 10) */
  return p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},rules:{'meta-viewport':{enabled:false}},iframes:false,resultTypes:['violations']});
    return r.violations.map(v=>v.id+': '+v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(' | '));});}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPH=IPAD.replace('iPad; CPU OS','iPhone; CPU iPhone OS');
const KEEP=p=>p.evaluate(async()=>{
  const rec=(name,sid,saved,items)=>({key:clScope()+'|'+sid+'|'+name.toLowerCase(),scope:clScope(),client:name,sid,site:'Test Elementary (simulated)',grade:'4',bcba:'Jordan Ellis (simulated)',
    saved,sum:{items,lastData:'',forms:3},text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:{client:name,sid},forms:{}})});
  const R=[rec('Mateo Rivera (simulated)','4471823','2026-10-13T15:00:00',[
      {k:'Timeline',t:'The reevaluation is due 10/18 (in 5 days)',open:'RR-1'},{k:'Due',t:'DM-1 Reevaluation due 10/18 (in 5 days)',open:'DM-1'},
      {k:'Due',t:'DM-1 Next review 10/18 (in 5 days)',open:'DM-1'},{k:'Due',t:'RR-1 Reevaluation due 10/18 (in 5 days)',open:'RR-1'},
      {k:'Data',t:'No data on Form DD-1 since 9/30 (9 school days)',open:'DD-1'}]),
    rec('Leo Whitfield (simulated)','5550199','2026-10-20T06:42:00',[
      {k:'Timeline',t:'The plan review (Form PR-1) is due 10/22 (in 3 days)',open:'PR-1'}]),
    rec('Nina Park (simulated)','5550123','2026-10-19T08:00:00',[
      {k:'Safety',t:'A restraint on 10/19: the parent notice is due today (Form CR-1)',open:'CR-1'},
      {k:'Due',t:'GB-1 Progress report due 11/2 (in 13 days)',open:'GB-1'}])];
  for(const r of R)await clTx('readwrite',st=>st.put(r));await paintBlank();await new Promise(r=>setTimeout(r,400));});
/* the next caseloadGo, instead of opening the case */
const spyGo=p=>p.evaluate(()=>{window.__go=null;if(!window.__go0)window.__go0=caseloadGo;caseloadGo=async(k,f)=>{window.__go=[k,f||''];};});
const got=p=>p.evaluate(()=>window.__go);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const b=e.getBoundingClientRect();return !!e.offsetParent&&b.width>0&&b.height>0;},sel);
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPH,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:new Date(2026,9,20,9,0,0)});
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await p.evaluate(()=>{try{sessionStorage.removeItem('nbh.due.ph');}catch(e){}try{$('#tipHide').click();}catch(e){}});await KEEP(p);
  /* 1 the bar */
  const bar=await p.evaluate(()=>[...document.querySelectorAll('#phoneBar button')].map(b=>{const r=b.getBoundingClientRect();return {t:b.textContent.trim(),h:Math.round(r.height),bottom:Math.round(r.bottom)};}));
  ok('1a along the bottom: Forms, Caseload, Today, More, each with its word, a finger\'s height, at the foot of the screen',bar.map(x=>x.t.replace(/\d+$/,'')).join()==='Forms,Caseload,Today,More'&&bar.every(x=>x.h>=44&&x.bottom>=800&&x.bottom<=844),bar);
  await p.tap('#phForms');await sleep(500);const f1=await p.evaluate(()=>({open:document.body.classList.contains('rail-open'),ex:$('#phForms').getAttribute('aria-expanded')}));
  await p.tap('#phForms');await sleep(500);const f2=await p.evaluate(()=>({open:document.body.classList.contains('rail-open'),ex:$('#phForms').getAttribute('aria-expanded'),foc:document.activeElement&&document.activeElement.id}));
  ok('1b Forms opens the list of forms and closes it (the bar stays in reach; the focus comes back to Forms)',f1.open&&f1.ex==='true'&&!f2.open&&f2.ex==='false'&&f2.foc==='phForms',{f1,f2});
  const cl=await p.evaluate(async()=>{let n=0;const o=caseloadOpen;caseloadOpen=function(){n++;};$('#phCaseload').click();await new Promise(r=>setTimeout(r,50));caseloadOpen=o;
    let t=0;const b=$('#todayBtn'),h=()=>t++;b.addEventListener('click',h);$('#phToday').click();b.removeEventListener('click',h);await new Promise(r=>setTimeout(r,400));try{$('#dlg').close();}catch(e){}return {n,t};});await sleep(300);
  ok('1c Caseload and Today run the workstation\'s own buttons',cl.n===1&&cl.t===1,cl);
  /* 2 the top */
  const top=await p.evaluate(()=>({hd:Math.round(document.querySelector('header.top').getBoundingClientRect().height),crumb:getComputedStyle(document.querySelector('.crumb')).display}));
  ok('2a on the start screen the top is one slim row (the logo and Packet), the form\'s row put away',top.hd<=56&&top.crumb==='none',top);
  /* 3 where you left off */
  await spyGo(p);const pk=await p.evaluate(()=>{const b=document.querySelector('#blankDrv .bl-pick');return b&&{t:[...b.children].map(x=>x.textContent.trim()).filter(Boolean).join(' '),h:b.getBoundingClientRect().height,last:getComputedStyle(document.querySelector('#blankDrv .bl-last')).display};});
  await p.tap('#blankDrv .bl-pick .bl-pk-l');await sleep(150);const g3=await got(p);
  ok('3 where you left off is one row (the student, when); a tap anywhere on it opens that case',!!pk&&/^Pick up where you left off Leo Whitfield \(simulated\) · today at 6:42/.test(pk.t)&&pk.h<70&&pk.last==='none'&&!!g3&&/\|5550199\|leo whitfield \(simulated\)$/.test(g3[0]),{pk,g3});
  /* 4 What's due */
  const d1=await p.evaluate(()=>({sum:$('#blankCl .due-sum').textContent.replace(/\s+/g,' '),rows:[...document.querySelectorAll('#blankCl .due-board .due-row')].filter(r=>r.offsetParent).length,btn:($('#duePh')||{}).textContent}));
  await p.tap('#duePh');await sleep(400);
  const d2=await p.evaluate(()=>({rows:[...document.querySelectorAll('#blankCl .due-board .due-row')].filter(r=>r.offsetParent).length,btn:$('#duePh').textContent,ex:$('#duePh').getAttribute('aria-expanded')}));
  await spyGo(p);await p.tap('#blankCl .due-board .due-row.od .due-who');await sleep(150);const g4=await got(p);
  ok('4 What\'s due shows its counts; By date shows the rows by date; a tap anywhere on a row opens it',/1 need you now · 1 overdue · 1 this week · 1 coming up · 1 to look at/.test(d1.sum)&&d1.rows===0&&d1.btn==='By date'&&d2.rows===5&&d2.ex==='true'&&!!g4&&/mateo/.test(g4[0])&&g4[1]==='RR-1',{d1,d2,g4});
  await p.tap('#duePh');await sleep(400);
  /* 5 the cards */
  const cards=await p.evaluate(()=>[...document.querySelectorAll('#blankCl .cl-card')].map(c=>({who:c.querySelector('.cl-nm').textContent,hot:c.classList.contains('ph-hot'),
    first:[...((c.querySelector('.cl-due > .ph-row')||{}).children||[])].map(x=>x.textContent.trim()).filter(Boolean).join(' '),more:(c.querySelector('.ph-more > summary')||{}).textContent||'',rest:[...c.querySelectorAll('.ph-more .ph-row')].map(x=>[...x.children].map(y=>y.textContent.trim()).filter(Boolean).join(' ')),
    next:getComputedStyle(c.querySelector('.cl-next')).display,names:(c.textContent.match(/Rivera|Whitfield|Park/g)||[]).length})));
  const m=cards.find(c=>/Mateo/.test(c.who));
  ok('5a a card a student, most urgent first: the restraint notice, then the overdue date, then this week',cards.map(c=>c.who.split(' ')[0]).join()==='Nina,Mateo,Leo'&&cards[0].hot&&cards[1].hot&&!cards[2].hot,cards.map(c=>[c.who,c.hot]));
  ok('5b each deadline once, its days counted from today: 10/18 in RR-1 and DM-1 is one row, 2 days overdue; the rest under "+N more"',!!m&&/^Sun 10\/18 2 days overdue/.test(m.first)&&/Reevaluation RR-1, DM-1 · Next review DM-1/.test(m.first)&&m.more==='+1 more'&&m.rest.length===1&&/^Data No data on Form DD-1/.test(m.rest[0])&&m.next==='none'&&m.names===1,m);
  await spyGo(p);await p.tap('#blankCl .cl-card:nth-child(2) .cl-due > .ph-row .ph-what');await sleep(150);const g5=await got(p);
  await spyGo(p);await p.tap('#blankCl .cl-card:nth-child(3) .cl-nm');await sleep(150);const g6=await got(p);
  ok('5c a tap on a row opens that student\'s form; a tap on the name opens the case',!!g5&&/mateo/.test(g5[0])&&g5[1]==='RR-1'&&!!g6&&/leo/.test(g6[0])&&g6[1]==='',{g5,g6});
  /* 6 edge to edge, the count, the message */
  const e6=await p.evaluate(async()=>{const c=document.querySelector('#blankCl .cl-card').getBoundingClientRect();
    const tb=$('#todayBtn .tbadge'),pb=$('#phToday .tbadge');wsUI.toast('A message (simulated)');await new Promise(r=>setTimeout(r,300));
    const t=document.querySelector('#wsToasts .ws-toast'),tr=t&&t.getBoundingClientRect(),bar=$('#phoneBar').getBoundingClientRect();
    return {l:Math.round(c.left),w:Math.round(c.width),sw:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('#blank *')].filter(x=>x.offsetParent&&x.getBoundingClientRect().right>391).length,
      badge:!!tb&&!!pb&&pb.hidden===tb.hidden&&pb.textContent===tb.textContent,toast:!!tr&&tr.bottom<=bar.top,
      small:[...document.querySelectorAll('#blank button,#blank summary,#phoneBar button,header.top button')].filter(x=>x.offsetParent).map(x=>[x.id||x.className||x.textContent.trim().slice(0,20),Math.round(x.getBoundingClientRect().height)]).filter(x=>x[1]<44)};});
  ok('6 the cards run edge to edge, nothing wider than the screen; every button at least 44 px tall; Today\'s count is on the bar; a message sits above the bar',e6.l===0&&e6.w===390&&e6.sw<=390&&!e6.wide&&!e6.small.length&&e6.badge&&e6.toast,e6);
  /* 8 the rules, on the start screen with the rows by date and a card's "+N more" open */
  await p.tap('#duePh');await sleep(300);await p.evaluate(()=>{const d=document.querySelector('#blankCl .ph-more');if(d)d.open=true;});await sleep(200);
  const ax1=await axe(p);if(ax1)ok('8a the phone\'s start screen keeps WCAG 2.1 A and AA (axe-core)',!ax1.length,ax1);else console.log('NOTE axe-core is not installed: 8 skipped');
  await p.tap('#duePh');await sleep(300);
  /* 2b with a form open: its row, then More */
  await p.evaluate(async()=>{caseloadGo=window.__go0;$('#pClient').value='Mateo Rivera (simulated)';$('#pSid').value='4471823';openForm('DD-1');const t0=performance.now();while(!state.status['DD-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));});await sleep(1500);
  const cr=await p.evaluate(()=>{const c=document.querySelector('.crumb');const shown=[...c.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.id);
    return {h:Math.round(c.getBoundingClientRect().height),title:$('#crumbTitle').textContent,shown};});
  ok('2b with a form open, its row holds its name, Save and Close on one line',cr.h<=56&&/Daily Data/.test(cr.title)&&cr.shown.join()==='saveQuick,closeForm',cr);
  await p.tap('#phMore');await sleep(400);
  const mo=await p.evaluate(()=>({t:$('#dlgTitle').textContent,h:[...document.querySelectorAll('#dlgBody .ph-mh')].map(x=>x.textContent),b:[...document.querySelectorAll('#dlgBody [data-phmore]')].map(x=>x.dataset.phmore)}));
  const ax2=await axe(p);if(ax2)ok('8b More keeps WCAG 2.1 A and AA (axe-core)',!ax2.length,ax2);
  const ran=await p.evaluate(async()=>{let n=0;const b=$('#caseMap'),h=()=>n++;b.addEventListener('click',h);document.querySelector('#dlgBody [data-phmore="caseMap"]').click();await new Promise(r=>setTimeout(r,100));b.removeEventListener('click',h);
    try{$('#dlg').close();}catch(e){}return n;});
  ok('2c More holds the rest: this form\'s Print, Focus, Fullscreen, its own tab, Close; the case\'s; each runs its button',mo.t==='More'&&mo.h.join()==='This form,The case,The workstation'&&['printOne','focusBtn','fullBtn','popOut','closeForm','saveCase','openCase','closeCase','caseMap','railFind','help'].every(x=>mo.b.includes(x))&&ran===1,{mo,ran});
  await ctx.close();
  /* 7 the iPad and the laptop */
  for(const [nm,o] of [['iPad',{viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD}],['laptop',{viewport:{width:1440,height:900}}]]){
    const c=await br.newContext(Object.assign({serviceWorkers:'block'},o));const q=await c.newPage();q.on('pageerror',e=>errs.push(nm+': '+e.message));await q.clock.install({time:new Date(2026,9,20,9,0,0)});
    await q.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);await KEEP(q);
    const s=await q.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&!!e.offsetParent;};
      return {bar:v('#phoneBar'),crumb:v('.crumb'),list:v('#railNav'),cl:v('#caseloadBtn'),td:v('#todayBtn'),rows:[...document.querySelectorAll('#blankCl .due-board .due-row')].filter(r=>r.offsetParent).length,
        last:v('#blankDrv .bl-last'),pick:v('#blankDrv .bl-pick'),due:[...document.querySelectorAll('#blankCl .cl-due')].some(x=>x.offsetParent),next:[...document.querySelectorAll('#blankCl .cl-next')].every(x=>x.offsetParent),
        ph:[...document.querySelectorAll('#blankCl .cl-ph')].every(x=>x.offsetParent),duePh:v('#duePh')};});
    ok('7 the '+nm+' is as it was: no bar, the list of forms beside the start screen, the form\'s row with Caseload and Today, the rows of What\'s due, the cards as before',!s.bar&&s.crumb&&s.list&&s.cl&&s.td&&s.rows===5&&s.last&&!s.pick&&!s.due&&s.next&&s.ph&&!s.duePh,s);
    await c.close();}
  ok('9 no page errors',!errs.length,errs.slice(0,4));
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
