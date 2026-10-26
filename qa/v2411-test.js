/* v24.11 the BCBA's iPad review: ABC-1's note full width; the form rail can be put away and brought back, the choice kept;
   a form with five or more sheets gets the Sheets menu when the rail does not fit (DM-1 at 900 px); IA-1's target group on
   one line in the rail layout; the workstation's bars fold with a transition; the script's own CSS is in every form.
   usage: node qa/v2411-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const F={abc:'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html',dm:'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html',ia:'/NBH-Workstation/IA-1_Indirect-Functional-Assessment_v2026-09.html'};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=async(w,h)=>{const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});return [c,p];};
 if(!fs.existsSync(ROOT+F.ia))F.ia='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^IA-1_/.test(f));
 /* 1 ABC-1's note */
 {const [c,p]=await ctx(1300,900);await p.goto(BASE+F.abc);await sleep(1500);
  const r=await p.evaluate(()=>{const g=document.querySelector('.narr-guide');const cs=getComputedStyle(g);return {max:cs.maxWidth,w:g.getBoundingClientRect().width,pw:g.parentElement.getBoundingClientRect().width};});
  ok('ABC-1’s note under the incident description runs the full width of its block',(r.max==='none'||/^min\(100%, (\d{4,}|[2-9]\d{2})(\.\d+)?px\)$/.test(r.max))&&r.w>=r.pw-40&&r.w>900,r);await c.close();}
 /* 2 DM-1 at 900 px: the Sheets menu, not a column of tabs */
 {const [c,p]=await ctx(900,900);await p.goto(BASE+F.dm);await sleep(2000);
  const r=await p.evaluate(()=>({mode:window.nbhSheets&&nbhSheets.mode(),strip:getComputedStyle(document.getElementById('viewSeg')).display,menu:!!document.querySelector('.toolbar .nbh-sheets'),css:!!document.getElementById('nbh-ui-111'),tbH:document.querySelector('.toolbar').offsetHeight}));
  ok('DM-1 in a 900 px frame on a touch screen shows the Sheets menu (six sheets), the strip hidden, the toolbar short; the script’s CSS is in the form',r.mode==='menu'&&r.strip==='none'&&r.menu&&r.css&&r.tbH<140,r);await c.close();}
 /* 3 DM-1 at 1300 px: the rail, put away and brought back */
 {const [c,p]=await ctx(1300,900);await p.goto(BASE+F.dm);await sleep(2000);
  const a=await p.evaluate(()=>({mode:nbhSheets.mode(),hide:!!document.getElementById('nbhRailHide'),pad:getComputedStyle(document.body).paddingLeft,tab:!!document.getElementById('nbhRailTab')}));
  ok('DM-1 in a 1300 px frame has the rail with a Hide button in its head, the body pushed over, no tab',a.mode==='rail'&&a.hide&&a.pad==='222px'&&!a.tab,a);
  await p.click('#nbhRailHide');await sleep(400);
  const h=await p.evaluate(()=>({off:document.documentElement.classList.contains('nbh-railoff'),rail:getComputedStyle(document.getElementById('nbhRail')).display,pad:getComputedStyle(document.body).paddingLeft,tab:(()=>{const t=document.getElementById('nbhRailTab');return t&&getComputedStyle(t).display!=='none'&&t.getBoundingClientRect().left===0;})(),arrows:!!document.querySelector('.toolbar .nbh-arrows'),pref:localStorage.getItem('nbh.railoff')}));
  ok('Hide puts the rail away: the body takes the width, a tab shows at the left edge, the sheet arrows stay in the toolbar, the choice is kept',h.off&&h.rail==='none'&&h.pad==='0px'&&h.tab&&h.arrows&&h.pref==='1',h);
  await p.reload();await sleep(2000);
  const r2=await p.evaluate(()=>({off:document.documentElement.classList.contains('nbh-railoff'),tab:!!document.getElementById('nbhRailTab'),mode:nbhSheets.mode()}));
  ok('opened again, the form keeps the rail put away',r2.off&&r2.tab&&r2.mode==='rail',r2);
  await p.click('#nbhRailTab');await sleep(400);
  const s2=await p.evaluate(()=>({off:document.documentElement.classList.contains('nbh-railoff'),rail:getComputedStyle(document.getElementById('nbhRail')).display,tab:!!document.getElementById('nbhRailTab'),pref:localStorage.getItem('nbh.railoff')}));
  ok('the tab brings the rail back and the tab goes',!s2.off&&s2.rail!=='none'&&!s2.tab&&s2.pref==='',s2);await c.close();}
 /* 4 IA-1 at 1300 px: the target group on one line, the toolbar two rows at most */
 {const [c,p]=await ctx(1300,900);await p.goto(BASE+F.ia);await sleep(2000);
  const r=await p.evaluate(()=>{const sel=document.getElementById('tgtSel'),del=document.getElementById('tgtDel'),add=document.getElementById('tgtAdd');const t=e=>Math.round(e.getBoundingClientRect().top);return {mode:nbhSheets.mode(),sel:t(sel),add:t(add),del:t(del),tbH:document.querySelector('.toolbar').offsetHeight,wrap:getComputedStyle(document.querySelector('#tgtGroup .row')).flexWrap};});
  ok('IA-1’s target behavior select, + Target and Remove sit on one line; the toolbar is two rows at most',r.mode==='rail'&&r.sel===r.add&&r.add===r.del&&r.wrap==='nowrap'&&r.tbH<=130,r);await c.close();}
 /* 5 the files */
 const ui=fs.readFileSync(ROOT+'/NBH-Workstation/nbh-ui.js','utf8'),sh=fs.readFileSync(ROOT+'/NBH-Workstation/index.html','utf8'),rps=fs.existsSync(ROOT+'/RPS-Workstation/index.html')?fs.readFileSync(ROOT+'/RPS-Workstation/index.html','utf8'):sh;
 ok('the script carries its CSS (the rail button and tab, the toolbar groups, the fold without a slide) and the five-sheet rule; both workstation shells fold their bars with a transition',
   /n >= 5 \|\|/.test(ui)&&/nbh-ui-111/.test(ui)&&/overflow-anchor:none/.test(ui)&&/body\.ws-fold header\.top,body\.ws-fold \.bar\{max-height:0!important/.test(sh)&&/body\.ws-fold header\.top,body\.ws-fold \.bar\{max-height:0!important/.test(rps)&&!/body\.ws-fold header\.top,body\.ws-fold \.bar\{display:none/.test(sh),{});
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
