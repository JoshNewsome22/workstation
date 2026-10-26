/* v24.50 Form RS-1: the RBT's Usual Hours laid out (the BCBA's iPad screenshot, 10/26). At 1180, 820 and 390 wide: the start,
   the end and the time not in services are equal boxes on one line (two and one on a phone), the primary intervention
   runs the box's width and shows its whole name, "Usual service days" is a label above the seven days, which share one
   row; a tap on a day turns it on or off (filled when on) and the Setup page follows; the keyboard reaches each day and
   Space toggles it; the Setup page's days take the same row. usage: node qa/rsu150-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,ROOT,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 for(const [w,h] of [[1180,820],[820,1180],[390,844]]){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1200);
  await p.evaluate(()=>{S.setup.day_start='08:45';S.setup.day_end='15:30';S.setup.day_act=[...document.querySelectorAll('#mAct option')].map(o=>o.value).find(v=>/Behavior reduction/.test(v))||'';S.setup.days=[1,2,3,4,5];renderAll();setView('month');});await sleep(400);
  const L=await p.evaluate(()=>{const r=id=>document.getElementById(id).getBoundingClientRect();const box=document.querySelector('#usualBox .fieldgrid').getBoundingClientRect();
    const s=r('mStart'),e=r('mEnd'),k=r('mBreak'),a=r('mAct'),sel=document.getElementById('mAct');
    const chips=[...document.querySelectorAll('#mDayChips label.chip')].map(x=>x.getBoundingClientRect()),lab=document.querySelector('#mDayChips .rs-days-lab');
    return {same:Math.abs(s.top-e.top)<1&&Math.abs(s.height-e.height)<1&&Math.abs(s.height-k.height)<1&&Math.abs(s.width-e.width)<1,brkRow:Math.abs(k.top-s.top)<1,brkW:Math.round(k.width),sW:Math.round(s.width),
      actFull:Math.abs(a.width-box.width)<2,actWhole:sel.scrollWidth<=sel.clientWidth+1,rows:new Set(chips.map(x=>Math.round(x.top))).size,n:chips.length,minH:Math.round(Math.min(...chips.map(x=>x.height))),
      labAbove:!!lab&&lab.getBoundingClientRect().bottom<=chips[0].top+1,over:chips.some(x=>x.right>box.right+1)};});
  const phone=w<500;
  ok(w+': start, end and the time not in services are equal boxes'+(phone?' (start and end on a line, the time not in services under them, full width)':' on one line'),L.same&&(phone?!L.brkRow&&L.brkW>L.sW*1.8:L.brkRow),L);
  ok(w+': the primary intervention runs the box\'s width and shows its whole name; the days are one row of seven under their label, each 44 px tall or more, none past the box',L.actFull&&L.actWhole&&L.rows===1&&L.n===7&&L.minH>=44&&L.labAbove&&!L.over,L);
  if(w===1180){
   /* a tap on Saturday turns it on (filled) and the Setup page follows; again turns it off */
   await p.tap('#mDayChips label.chip:has(input[data-wd="6"])');await sleep(200);
   const t1=await p.evaluate(()=>{const l=document.querySelector('#mDayChips input[data-wd="6"]').closest('label');return {days:S.setup.days.slice().sort().join(),setup:document.querySelector('#dayChips input[data-wd="6"]').checked,bg:getComputedStyle(l).backgroundColor,fg:getComputedStyle(l).color};});
   await p.tap('#mDayChips label.chip:has(input[data-wd="6"])');await sleep(200);
   const t2=await p.evaluate(()=>({days:S.setup.days.slice().sort().join(),bg:getComputedStyle(document.querySelector('#mDayChips input[data-wd="6"]').closest('label')).backgroundColor}));
   ok('a tap on a day turns it on, filled, and the Setup page follows; a second tap turns it off',t1.days==='1,2,3,4,5,6'&&t1.setup&&t1.fg==='rgb(255, 255, 255)'&&t1.bg!==t2.bg&&t2.days==='1,2,3,4,5',{t1,t2});
   /* the keyboard: Tab reaches the day, Space toggles it, and the day shows the focus ring */
   await p.focus('#mDayChips input[data-wd="0"]');await p.keyboard.press('Space');await sleep(150);
   const k=await p.evaluate(()=>{const i=document.querySelector('#mDayChips input[data-wd="0"]'),l=i.closest('label');return {on:i.checked,days:S.setup.days.includes(0),ring:getComputedStyle(l).outlineStyle};});
   await p.keyboard.press('Space');await sleep(100);
   ok('the keyboard reaches a day and Space toggles it (the checkbox is kept, out of sight)',k.on&&k.days,k);
   /* the Setup page's days */
   await p.evaluate(()=>setView('setup'));await sleep(300);
   const S2=await p.evaluate(()=>{const ch=[...document.querySelectorAll('#dayChips label.chip')].map(x=>x.getBoundingClientRect());return {rows:new Set(ch.map(x=>Math.round(x.top))).size,n:ch.length,lab:!!document.querySelector('#dayChips .rs-days-lab')};});
   ok('the Setup page\'s days take the same row of seven under their label',S2.rows===1&&S2.n===7&&S2.lab,S2);}
  await c.close();}
 /* a typed signature, adopted; a drawn one; how and when on the record; kept in the file; cleared with the signature */
 {const c=await b.newContext({viewport:{width:1180,height:820},hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1200);
  await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';renderAll();setView('print');});await sleep(300);
  await p.fill('#sgSup','Dana Cole (simulated), BCBA');await p.dispatchEvent('#sgSup','input');
  await p.click('.rs-typesig:has(#ts_sup) summary');await sleep(150);await p.click('#ts_sup');await sleep(150);
  const t0=await p.evaluate(()=>({name:document.getElementById('ts_sup').value,prev:document.querySelector('[data-tsprev="sup_img"]').textContent,dis:document.querySelector('[data-tsgo="sup_img"]').disabled}));
  ok('typing instead: the name comes from the signer\'s name box (without the credential), shows in a handwriting style, and Adopt waits for the adoption tick',t0.name==='Dana Cole (simulated)'&&t0.prev===t0.name&&t0.dis,t0);
  await p.check('#tsok_sup');await sleep(100);const en=await p.evaluate(()=>!document.querySelector('[data-tsgo="sup_img"]').disabled);
  await p.click('[data-tsgo="sup_img"]');await sleep(300);
  const t1=await p.evaluate(()=>{const g=month(curKey).sig;return {img:/^data:image\/png;base64,/.test(g.sup_img||''),how:g.sup_how,at:g.sup_at,out:document.getElementById('monthOut').textContent,ink:(()=>{const cv=document.querySelector('canvas[data-pad="sup_img"]'),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n;})()};});
  ok('ticked, Adopt and sign writes the name into the signature box; the record notes "typed name adopted" and when',en&&t1.img&&t1.how==='typed'&&/^\d{4}-\d{2}-\d{2}T/.test(t1.at||'')&&t1.ink>500&&/Signed electronically: typed name adopted as the signature, \d+\/\d+\/\d{4}/.test(t1.out),{en,how:t1.how,at:t1.at,ink:t1.ink});
  /* the RBT draws */
  const bb=await p.locator('canvas[data-pad="rbt_img"]').boundingBox();await p.mouse.move(bb.x+40,bb.y+60);await p.mouse.down();for(let i=1;i<=12;i++)await p.mouse.move(bb.x+40+i*20,bb.y+60+(i%2?18:-18));await p.mouse.up();await sleep(200);
  const t2=await p.evaluate(()=>{const g=month(curKey).sig;const o=fromFile({form:'RS-1',S:JSON.parse(JSON.stringify(S))}).months[curKey].sig;return {how:g.rbt_how,out:document.getElementById('monthOut').textContent,file:[o.sup_how,!!o.sup_at,o.rbt_how,!!o.rbt_at]};});
  ok('a drawn signature is noted "drawn on the screen"; how and when are kept in the file for both',t2.how==='drawn'&&/Signed electronically: drawn on the screen/.test(t2.out)&&t2.file.join()==='typed,true,drawn,true',t2);
  await p.click('[data-padclear="sup_img"]');await sleep(200);
  const t3=await p.evaluate(()=>{const g=month(curKey).sig;return {img:!!g.sup_img,how:g.sup_how||null,at:g.sup_at||null,out:/typed name adopted/.test(document.getElementById('monthOut').textContent)};});
  ok('Clear the signature takes the note away with it',!t3.img&&!t3.how&&!t3.at&&!t3.out,t3);
  await c.close();}
 /* the printed record: each contact whole on one page, the heading and the table header with the first (the September PDF) */
 {const c=await b.newContext({viewport:{width:1180,height:900}});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1200);
  await p.evaluate(()=>{const k=yearKeys(setupYear())[1];S.setup.rbt_name='Lee Park (simulated)';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[];for(let d=1;d<=30;d++){const x=new Date(2026,8,d);if(x.getDay()%6===0)continue;m.days.push({id:'d'+d,date:k+'-'+String(d).padStart(2,'0'),start:'08:45',end:'15:30',brk:'',act:'',none:false});}
   for(let j=0;j<10;j++)m.days.push({id:'e'+j,date:k+'-'+String(1+j).padStart(2,'0'),start:'',end:'',brk:'',act:'',none:true});
   const fb='The team has been working on accuracy in responding as well as task engagement (simulated). The home team wants accuracy to improve, which is understandable; we must make sure this does not lead to a resurgence of problem behavior. Accuracy varies from session to session and task to task (simulated).';
   m.contacts=[{id:'c1',date:k+'-08',start:'10:30',end:'12:30',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:['Observation','BST and performance feedback','Reviewing written materials (progress notes, data sheets)','Data collection and graphing'],sact:['Instruction','Feedback'],bst:[],feedback:fb,follow:'Continue to monitor accuracy across tasks (simulated).',ck:{},ckp:{}},
    {id:'c2',date:k+'-30',start:'13:15',end:'15:00',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:['Overseeing and evaluating service delivery'],sact:['Behavior acquisition'],bst:[],feedback:'',follow:'',ck:{},ckp:{}}];
   curKey=k;renderAll();setView('print');renderPrint();document.body.classList.add('rs-print-month');});await sleep(400);
  const D=await p.evaluate(()=>{const g=[...document.querySelectorAll('#monthOut .p-cgrp')];const W=t=>[...t.querySelectorAll('tr')].find(r=>r.cells.length===8)?[...[...t.querySelectorAll('tr')].find(r=>r.cells.length===8).cells].map(c=>Math.round(c.getBoundingClientRect().width)):[];
    return {n:g.length,h:!!g[0]&&!!g[0].querySelector('h4')&&!!g[0].querySelector('thead'),later:g.slice(1).every(x=>!x.querySelector('h4,thead')),fb:!!g[0]&&/Feedback:/.test(g[0].textContent),cols:g.length>1&&JSON.stringify(W(g[0]))===JSON.stringify(W(g[1])),mail:/p-cgrp/.test(window.__rsShare.page('month').html)};});
  ok('on the record each contact is one block (its feedback with it), the heading and the table header with the first, the columns the same in each; the emailed page the same',D.n===2&&D.h&&D.later&&D.fb&&D.cols&&D.mail,D);
  await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
  const f=require('path').join(ROOT,'qa','out','rsu150-month.pdf');require('fs').mkdirSync(require('path').dirname(f),{recursive:true});require('fs').writeFileSync(f,buf);
  const T=JSON.parse(require('child_process').execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps([p.get_text() for p in d]))',f]).toString());
  const pg=s=>T.findIndex(x=>x.includes(s));const P={head:pg('SUPERVISION CONTACTS'),row:pg('10:30'),fb:pg('Feedback:')};
  ok('printed, the heading, the first contact and its feedback are on one page (none split at the page end)',P.head>=0&&P.head===P.row&&P.row===P.fb,P);
  await c.close();}
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
