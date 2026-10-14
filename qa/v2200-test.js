/* v22.00 Wave 0 of the review's fixes. (1) The questionnaire page shows a link's item number as text, so a crafted link runs
   no script (review F495), and respond.html and staff-data.html carry a security policy that refuses inline script, with
   their own scripts moved into files (I251). (2) Dates are the device's own calendar day: a parent note written at 9:30 pm
   in Florida is dated that day, a questionnaire answered then carries that day, a case saved then reads 'yesterday' the next
   morning (F504). (3) Form DD-1 names seclusion as prohibited by s. 1003.573 where it is logged, and its notice says to tell
   the administrator and the parent (F99). (The Drive editions, F501, are checked by qa/v2189-drive-test.js 31 and 32.)
   Simulated students only.  usage: node qa/v2200-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';const ROOT=(process.env.WS_ROOT||__dirname+'/..')+'/NBH-Workstation/';
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
(async()=>{const br=await chromium.launch();
  try{
  /* 1 the questionnaire page */
  const p1=await br.newPage();const csp=[];p1.on('console',m=>{if(/Content Security Policy|Content-Security-Policy/i.test(m.text()))csp.push(m.text());});const e1=[];p1.on('pageerror',e=>e1.push(e.message));
  const pay={v:1,form:'IA-1',inst:'FAST',title:'FAST',student:'Mateo R.',beh:'hitting',bcba:'The BCBA',items:[{n:'<img src=x onerror="window.__xss=(window.__xss||0)+1">',text:'Item one'},{n:2,text:'Item two'}],scale:{kind:'yn'},extras:[{id:'name',label:'Your name'}]};
  await p1.goto(W+'respond.html#p='+b64(pay));await sleep(1200);
  const r1=await p1.evaluate(()=>({xss:window.__xss||0,q:(document.querySelector('li.it .q')||{}).textContent||'',imgs:document.querySelectorAll('li.it .q img').length,items:document.querySelectorAll('li.it').length}));
  ok('1 a crafted link: the item number shows as text, nothing in it runs, and the questionnaire still opens',r1.xss===0&&r1.imgs===0&&/<img src/.test(r1.q)&&r1.items===2,r1);
  const pages=['respond.html','staff-data.html'].map(f=>{const s=fs.readFileSync(ROOT+f,'utf8');return {f,csp:/http-equiv="Content-Security-Policy"[^>]*script-src 'self'/.test(s)&&!/script-src[^;"]*unsafe-inline/.test(s),inline:(s.match(/<script>/g)||[]).length};});
  ok('2 respond.html and staff-data.html carry a policy that refuses inline script, and hold no inline script themselves',pages.every(x=>x.csp&&x.inline===0),pages);
  await p1.goto(W+'staff-data.html');await sleep(900);
  ok('3 both pages run under the policy with no refusal and no error',!csp.length&&!e1.length,{csp:csp.slice(0,3),e1});
  /* 4 the evening in Florida: the parent note, a questionnaire answer, the caseload's 'saved yesterday' */
  const ctx=await br.newContext({timezoneId:'America/New_York',serviceWorkers:'block'});const p2=await ctx.newPage();
  await p2.clock.install({time:new Date('2026-10-15T01:30:00Z')});   /* 9:30 pm on Wednesday 14 October in Florida */
  await p2.goto(W+'index.html');await p2.clock.runFor(2000);
  const r4=await p2.evaluate(()=>{const set=(q,v)=>{const s=document.querySelector(q);s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSite','Royal Palm School');
    const d=document.createElement('div');d.innerHTML=hnSheetHtml(hnParts());return {intro:d.textContent,ago:clAgo(new Date().toISOString())};});
  ok('4 a parent note written at 9:30 pm is dated that day (October 14), and a save made then reads "today"',/October 14, 2026/.test(r4.intro)&&!/October 15, 2026/.test(r4.intro)&&r4.ago==='today',{intro:r4.intro.slice(0,200),ago:r4.ago});
  await p2.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
  const r5=await p2.evaluate(()=>clAgo('2026-10-15T01:30:00.000Z'));
  ok('5 the next morning that save reads "yesterday", as the Drive line beside it does',r5==='yesterday',r5);
  const p3=await ctx.newPage();await p3.clock.install({time:new Date('2026-10-15T01:30:00Z')});
  await p3.goto(W+'respond.html#p='+b64({v:1,form:'IA-1',inst:'FAST',title:'FAST',student:'Mateo R.',beh:'hitting',items:[{n:1,text:'One'}],scale:{kind:'yn'}}));await p3.clock.runFor(1500);
  const r6=fs.readFileSync(ROOT+'nbh-respond.js','utf8');
  const shell=fs.readFileSync(ROOT+'index.html','utf8');
  ok('6 no date in the shell or the questionnaire page is cut from the world clock (toISOString().slice(0,10))',!/toISOString\(\)\.slice\(0,10\)/.test(shell)&&!/date:new Date\(\)\.toISOString\(\)\.slice\(0,10\)/.test(r6),'a UTC date cut remains');
  /* 7 Form DD-1 and seclusion */
  const p4=await br.newPage();const e4=[];p4.on('pageerror',e=>e4.push(e.message));await p4.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1200);
  const r7=await p4.evaluate(()=>({label:DD_HOLDS.seclusion,restraint:DD_HOLDS.restraint,note:DD_SECL_NOTE}));
  ok('7 DD-1 logs a seclusion as "Seclusion (prohibited by s. 1003.573)" and its notice says to tell the administrator at once and the parent the same day; a restraint reads as before',
    /prohibited by s\. 1003\.573/.test(r7.label)&&/administrator at once/.test(r7.note)&&/parent is told the same day/.test(r7.note)&&r7.restraint==='Restraint'&&!e4.length,{r7,e4});
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
