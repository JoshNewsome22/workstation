/* v21.66 Form SM-1: Match the model (tools/forms/SM-1/sm-mm.js). The view and its parts; the task and the rule; the levels
   (2 to 4, names, points, pictures); the points of a trial (match with the bonus, one apart by the rule, far apart, not
   checked); rating on the iPad (the student picks and locks, hidden; the teacher picks; the result; saved to the record; the
   teacher-first order; not checking); the record (rows, edits recomputing, the metrics, the suggestion moving the checks on
   and back, the chart, CSV); the printed sheet (the pictures, the rule, the rows; print alone); the file (saved, reopened,
   a forged file cleaned); the simulation; Clear all; no errors. */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+(typeof i==='string'?i:JSON.stringify(i)):''));if(!c)fails++;};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1180,height:900},hasTouch:true});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__ok=true;nbhUI.confirm=async()=>window.__ok;});
  const click=sel=>page.evaluate(s=>{const el=document.querySelector(s);if(!el)return false;el.click();return true;},sel);
  const set=(sel,v)=>page.evaluate(([s,v])=>{const el=document.querySelector(s);if(!el)return false;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,v]);
  /* 1. the view */
  await page.evaluate(()=>setView('mm'));await sleep(200);
  const v=await page.evaluate(()=>({btn:!!document.querySelector('#viewSeg button[data-view="mm"]'),shown:getComputedStyle(document.querySelector('.only-mm')).display,other:getComputedStyle(document.querySelector('.only-setup')).display,lv:document.querySelectorAll('#mmLevels .mm-lv').length,empty:(document.querySelector('#mmRate .smr-empty')||{}).textContent||'',sheet:!!document.querySelector('#mmOut .mm-sheet'),print:!!document.querySelector('#mmPrintBtn'),n:S.mm.n}));
  ok('1 the Match the model view shows its section alone: three levels, the rating waits for a task, the sheet drawn, the print button',v.btn&&v.shown==='block'&&v.other==='none'&&v.lv===3&&/Name the task/.test(v.empty)&&v.sheet&&v.print&&v.n===3,v);
  /* 2. the task, the rule, the levels */
  await set('[data-mm="task"]','Clean the lunch table');await set('[data-mm="bonus"]','2');await set('[data-mm="rw.match"]','10 minutes of drawing');await set('[data-mm="close"]','self');await set('[data-mm="far"]','none');
  await set('#mmLevels [data-mml="name"][data-i="0"]','Like the model');await set('#mmLevels [data-mml="pts"][data-i="0"]','3');await set('#mmLevels [data-mml="chk"][data-i="0"]','wiped the top\nchairs in');
  await page.evaluate(p=>{S.mm.lv[0].img=p;S.mm.lv[1].img=p;S.mm.lv[2].img=p;mmRender();},PNG);
  const r2=await page.evaluate(()=>({task:S.mm.task,bonus:S.mm.bonus,rw:S.mm.rw.match,chk:S.mm.lv[0].chk,pics:document.querySelectorAll('#mmLevels .mm-pic img').length,tiles:document.querySelectorAll('#mmRate .mm-tile').length,ask:(document.querySelector('#mmRate .mm-ask')||{}).textContent||'',sheetPics:document.querySelectorAll('#mmOut .mm-model img').length,sheetChk:document.querySelectorAll('#mmOut .mm-mchk div').length,rule:document.querySelector('#mmOut .mm-rule').textContent}));
  ok('2 the task, the bonus, the reward and a checklist are kept; the pictures show in the levels, the tiles and the sheet; the rule reads the settings',r2.task==='Clean the lunch table'&&r2.bonus===2&&r2.rw==='10 minutes of drawing'&&r2.chk==='wiped the top\nchairs in'&&r2.pics===3&&r2.tiles===3&&/which picture looks like your work/.test(r2.ask)&&r2.sheetPics===3&&r2.sheetChk===2&&/\+ 2 bonus and 10 minutes of drawing/.test(r2.rule)&&/my points, no bonus/.test(r2.rule),r2);
  await set('[data-mm="n"]','4');
  const r2b=await page.evaluate(()=>({n:S.mm.n,lv:S.mm.lv.map(l=>l.name+':'+l.pts),tiles:document.querySelectorAll('#mmRate .mm-tile').length,four:!!document.querySelector('#mmOut .mm-four'),keep:!!S.mm.lv[0].img}));
  await set('[data-mm="n"]','2');const r2c=await page.evaluate(()=>({n:S.mm.n,lv:S.mm.lv.map(l=>l.name+':'+l.pts)}));await set('[data-mm="n"]','3');await page.evaluate(p=>{S.mm.lv[2].img=p;mmRender();},PNG);
  ok('2b two to four levels: a fourth is added with its name and points (the pictures kept), the sheet goes wide; two keeps the first two',r2b.n===4&&r2b.lv.join('|')==='Like the model:3|Almost:2|Not yet:1|Not started:1'&&r2b.tiles===4&&r2b.four&&r2b.keep&&r2c.n===2&&r2c.lv.length===2,{r2b,r2c});
  /* 3. the points */
  const p=await page.evaluate(()=>{S.mm.bonus=2;S.mm.close='self';S.mm.far='none';const f=(s,t)=>{const r=__mm.pts(s,t);return r?r.kind+':'+r.pts:null;};const a=[f(0,0),f(2,2),f(0,1),f(1,0),f(0,2),f(2,0),f(1,-1),f(-1,1),f(-1,-1)];
    S.mm.close='teach';S.mm.far='teach';const b=[f(0,1),f(1,0),f(0,2)];S.mm.close='none';const c=[f(0,1)];S.mm.close='self';S.mm.far='none';return {a,b,c};});
  ok('3 the points: a match is the level plus the bonus at any level; one apart by the rule (the student’s, the teacher’s, none); far apart none or the teacher’s; not checked the student’s; a teacher-only rating',p.a.join()==='match:5,match:3,close:3,close:2,far:0,far:0,unchecked:2,teacher:2,'&&p.b.join()==='close:2,close:3,far:1'&&p.c.join()==='close:0',p);
  /* 4. rating on the iPad */
  await page.evaluate(()=>{S.mm.cur=mmCur();mmRender();});
  await click('#mmRate [data-mms="0"]');const s1=await page.evaluate(()=>({on:document.querySelectorAll('#mmRate .mm-tile.on').length,lock:!!document.querySelector('#mmLockS'),stage:__mm.stage()}));
  await click('#mmLockS');const s2=await page.evaluate(()=>({stage:__mm.stage(),ask:(document.querySelector('#mmRate .mm-ask')||{}).textContent||'',tilesT:document.querySelectorAll('#mmRate [data-mmt]').length,hidden:!document.querySelector('#mmRate [data-mms]'),skip:!!document.querySelector('#mmSkip')}));
  await click('#mmRate [data-mmt="0"]');await click('#mmLockT');
  const s3=await page.evaluate(()=>({stage:__mm.stage(),res:(document.querySelector('#mmRate .mm-result')||{}).textContent||'',cls:(document.querySelector('#mmRate .mm-result')||{}).className||'',both:document.querySelectorAll('#mmRate .mm-both .mm-tile').length,save:!!document.querySelector('#mmSave')}));
  ok('4 the student picks and locks (hidden), the teacher’s tiles appear, both picked the best: Match, 3 + 2 bonus = 5 points and the reward',s1.on===1&&s1.lock&&s1.stage==='s'&&s2.stage==='t'&&/has rated \(hidden\)/.test(s2.ask)&&s2.tilesT===3&&s2.hidden&&s2.skip&&s3.stage==='done'&&/Match!/.test(s3.res)&&/3 \+ 2 bonus = 5 points/.test(s3.res)&&/10 minutes of drawing/.test(s3.res)&&/match/.test(s3.cls)&&s3.both===2&&s3.save,{s1,s2,s3});
  await click('#mmSave');await sleep(100);
  const s4=await page.evaluate(()=>({n:S.mm.log.length,row:S.mm.log[0]&&[S.mm.log[0].s,S.mm.log[0].t,S.mm.log[0].pts,S.mm.log[0].kind,S.mm.log[0].rw],cur:S.mm.cur.s,stage:__mm.stage(),rows:document.querySelectorAll('#mmLog tbody tr select').length,metric:document.querySelector('#mmMetrics').textContent}));
  ok('4b Save this trial writes the row (date, picks, points, kind, reward), clears the rating and shows it in the record',s4.n===1&&s4.row.join()==='0,0,5,match,10 minutes of drawing'&&s4.cur===-1&&s4.stage==='s'&&s4.rows===2&&/Matches1of1\(100%\)/.test(s4.metric.replace(/\s+/g,'')),s4);
  /* one apart, then not checked, then the teacher first */
  await click('#mmRate [data-mms="0"]');await click('#mmLockS');await click('#mmRate [data-mmt="1"]');await click('#mmLockT');
  const s5=await page.evaluate(()=>({res:(document.querySelector('#mmRate .mm-result')||{}).textContent||'',cls:(document.querySelector('#mmRate .mm-result')||{}).className||''}));await click('#mmSave');
  await click('#mmRate [data-mms="1"]');await click('#mmLockS');await click('#mmSkip');
  const s6=await page.evaluate(()=>({res:(document.querySelector('#mmRate .mm-result')||{}).textContent||''}));await click('#mmSave');
  await set('[data-mm="first"]','teacher');await page.evaluate(()=>{S.mm.cur=mmCur();mmRender();});
  const s7a=await page.evaluate(()=>({stage:__mm.stage(),ask:(document.querySelector('#mmRate .mm-ask')||{}).textContent||'',skip:!!document.querySelector('#mmSkip')}));
  await click('#mmRate [data-mmt="2"]');await click('#mmLockT');const s7b=await page.evaluate(()=>({stage:__mm.stage(),ask:(document.querySelector('#mmRate .mm-ask')||{}).textContent||''}));
  await click('#mmRate [data-mms="0"]');await click('#mmLockS');const s7c=await page.evaluate(()=>({stage:__mm.stage(),res:(document.querySelector('#mmRate .mm-result')||{}).textContent||'',cls:(document.querySelector('#mmRate .mm-result')||{}).className||''}));await click('#mmSave');
  await set('[data-mm="first"]','student');
  ok('4c one apart: the student’s points stand without the bonus; not checked: the student’s rating counts; teacher first: the teacher picks hidden, then the student, far apart',/One apart/.test(s5.res)&&/points stand: 3 points, no bonus/.test(s5.res)&&/close/.test(s5.cls)&&/Not checked this time/.test(s6.res)&&/2 points/.test(s6.res)&&s7a.stage==='t'&&/Teacher: which picture/.test(s7a.ask)&&!s7a.skip&&s7b.stage==='s'&&/which picture looks like your work/.test(s7b.ask)&&s7c.stage==='done'&&/Far apart/.test(s7c.res)&&/No points this time: 0 points/.test(s7c.res)&&/far/.test(s7c.cls),{s5,s6,s7a,s7b,s7c});
  /* 5. the record */
  const l1=await page.evaluate(()=>({n:S.mm.log.length,kinds:S.mm.log.map(r=>r.kind),pts:S.mm.log.map(r=>r.pts),sug:document.querySelector('#mmSuggest').textContent,dots:document.querySelectorAll('#mmPlot circle').length,sq:document.querySelectorAll('#mmPlot rect').length}));
  ok('5 four trials in the record with their kinds and points; the suggestion waits for five checked trials; the chart has a dot per check and a square per student rating',l1.n===4&&l1.kinds.join()==='match,close,unchecked,far'&&l1.pts.join()==='5,3,2,0'&&/3 checked trials so far/.test(l1.sug)&&l1.dots===3&&l1.sq===4,l1);
  await set('#mmLog [data-mmr="t"][data-i="3"]','0');
  const l2=await page.evaluate(()=>({kind:S.mm.log[3].kind,pts:S.mm.log[3].pts,tag:document.querySelectorAll('#mmLog tbody tr')[3].textContent}));
  ok('5b changing a row’s teacher pick recomputes the result and the points (far apart becomes a match)',l2.kind==='match'&&l2.pts===5&&/Match/.test(l2.tag),l2);
  const sug=await page.evaluate(()=>{const out={};const reset=rows=>{S.mm.log=rows.map(x=>({d:'2026-10-01',s:x[0],t:x[1],pts:0,kind:'',rw:'',note:'',img:''}));mmEnsure();};
    reset([[0,0],[1,1],[0,0],[2,2],[0,0]]);S.mm.check='all';out.all=mmSuggest();S.mm.check='half';out.half=mmSuggest();S.mm.check='third';out.third=mmSuggest();S.mm.check='spot';out.spot=mmSuggest();
    reset([[0,0],[0,0],[0,0],[0,2],[2,0]]);S.mm.check='half';out.back=mmSuggest();reset([[0,0],[0,1],[0,0],[1,0],[0,1]]);out.keep=mmSuggest();mmRenderLog();return out;});
  ok('5c the suggestion moves the checks on at 4 of the last 5 (every time, every other, one in three, surprise) and back after two far-apart checks; otherwise keeps them',/5 of the last 5 matched: move the checks to every other time/.test(sug.all)&&/one time in three/.test(sug.half)&&/surprise checks only/.test(sug.third)&&/stands on its own/.test(sug.spot)&&/Two of the last three checks were far apart: check every time/.test(sug.back)&&/2 of the last 5 matched: keep the checks as they are, and praise honest ratings/.test(sug.keep),sug);
  await click('#mmAdd');const l3=await page.evaluate(()=>({n:S.mm.log.length,last:S.mm.log[S.mm.log.length-1].kind,rows:document.querySelectorAll('#mmLog tbody tr').length}));
  ok('5d Add a row by hand adds an empty trial to fill from the paper sheet',l3.n===6&&l3.last===''&&l3.rows===6,l3);
  const csv=await page.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};document.querySelector('#mmCsv').click();await new Promise(r=>setTimeout(r,100));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():'';});
  ok('5e the CSV has a line per trial with the picks and the result',/^"Trial","Date","Student","Teacher","Result","Points","Reward","Note"/.test(csv)&&csv.split('\n').length===7&&/"Like the model","Like the model","Match"/.test(csv),csv.slice(0,200));
  /* 6. the sheet and printing alone */
  await set('[data-mm="check"]','spot');
  const sh=await page.evaluate(()=>{const o=document.querySelector('#mmOut');return {title:o.querySelector('.mm-title').textContent,task:o.querySelector('.mm-task').textContent,models:o.querySelectorAll('.mm-model').length,rows:o.querySelectorAll('.mm-grid tbody tr').length,circ:o.querySelectorAll('.mm-grid tbody tr:first-child .mm-circ').length,foot:o.querySelector('.mm-sfoot').textContent};});
  ok('6 the printed sheet: the title, the task, a model per level, eight rows with a circle per picture for the student and the teacher, the checks in the foot',/Does it look like the model/.test(sh.title)&&sh.task==='Clean the lunch table'&&sh.models===3&&sh.rows===8&&sh.circ===6&&/surprise/.test(sh.foot),sh);
  const pr=await page.evaluate(()=>{window.print=()=>{};document.querySelector('#mmPrintBtn').click();const cls=document.body.className;const vis=s=>getComputedStyle(document.querySelector(s)).display;const out={cls,out:vis('#mmOut')};return out;});
  await page.emulateMedia({media:'print'});const prp=await page.evaluate(()=>{const vis=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).display:'none';};return {out:vis('#mmOut'),tb:vis('.toolbar'),setup:vis('.only-setup'),rate:vis('#mmRate')};});await page.emulateMedia({media:'screen'});await sleep(1700);
  ok('6b Print the model sheet prints the sheet alone (the toolbar, the other sections and the iPad part hidden), landscape for four pictures otherwise portrait',/sm-mm-only/.test(pr.cls)&&prp.out!=='none'&&prp.tb==='none'&&prp.setup==='none'&&prp.rate==='none',{pr,prp});
  /* 7. the file */
  const saved=await page.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,150));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():'';});
  const file=JSON.parse(saved);
  ok('7 the saved file carries the sheet (task, rule, levels with pictures, the record)',file.S.mm&&file.S.mm.task==='Clean the lunch table'&&file.S.mm.bonus===2&&file.S.mm.lv.length===3&&file.S.mm.lv[0].img.length>20&&file.S.mm.log.length===6,Object.keys(file.S.mm||{}).join());
  await page.evaluate(()=>{document.querySelector('#clearBtn').click();});await sleep(300);
  const cleared=await page.evaluate(()=>({task:S.mm.task,n:S.mm.log.length,lv:S.mm.lv.length}));
  ok('7b Clear all empties it',cleared.task===''&&cleared.n===0&&cleared.lv===3,cleared);
  await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'sm1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(500);
  const back=await page.evaluate(()=>({task:S.mm.task,n:S.mm.log.length,kinds:S.mm.log.map(r=>r.kind).join(),pics:document.querySelectorAll('#mmLevels .mm-pic img').length,rule:/\+ 2 bonus/.test(document.querySelector('#mmOut .mm-rule').textContent)}));
  ok('7c opened again: the task, the pictures, the record with the results recomputed, the rule',back.task==='Clean the lunch table'&&back.n===6&&back.kinds==='match,close,match,close,close,'&&back.pics===3&&back.rule,back);
  const forged=JSON.parse(saved);forged.S.mm.n=9;forged.S.mm.lv[0].img='javascript:alert(1)';forged.S.mm.lv[1].pts='abc';forged.S.mm.log[0].s=7;forged.S.mm.log[1].img='data:text/html,x';forged.S.mm.check='weird';forged.S.mm.bonus=99;forged.S.mm.cur={s:'9',ls:true};
  await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'sm1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(forged));await sleep(500);
  const fg=await page.evaluate(()=>({n:S.mm.n,img0:S.mm.lv[0].img,pts1:S.mm.lv[1].pts,s0:S.mm.log[0].s,img1:S.mm.log[1].img,check:S.mm.check,bonus:S.mm.bonus,cur:S.mm.cur.s+'/'+S.mm.cur.ls,lv:S.mm.lv.length}));
  ok('7d a forged file is cleaned: the level count, a bad picture, letters for points, a pick out of range, a bad photo, an unknown check, a bonus over ten, the trial in progress',fg.n===4&&fg.img0===''&&fg.pts1===0&&fg.s0===-1&&fg.img1===''&&fg.check==='all'&&fg.bonus===10&&fg.cur==='-1/false'&&fg.lv===4,fg);
  /* 8. the simulation */
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1200);await page.evaluate(()=>setView('mm'));await sleep(200);
  const sim=await page.evaluate(()=>({task:S.mm.task,n:S.mm.log.length,kinds:S.mm.log.map(r=>r.kind).join(),check:S.mm.check,sug:document.querySelector('#mmSuggest').textContent,rows:document.querySelectorAll('#mmLog tbody tr').length,chk:document.querySelectorAll('#mmOut .mm-mchk div').length,pics:document.querySelectorAll('#mmOut .mm-model img').length}));
  ok('8 the simulation brings a lunch table with ten trials, the checks thinned once, a suggestion and the checklists on the sheet',sim.task==='Clean the lunch table'&&sim.n===10&&sim.kinds==='match,match,close,match,far,match,match,unchecked,match,unchecked'&&sim.check==='half'&&/of the last 5 matched/.test(sim.sug)&&sim.rows===10&&sim.chk===8&&sim.pics===3,sim);
  ok('9 no script errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
