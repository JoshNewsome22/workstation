/* v24.36 wide tables on the iPad, part 1 (review V13: R-033/E-06, R-043, R-054, R-065, R-074). On an 820 px touch screen:
   every box that scrolls sideways shows a bar above it (the words and two arrows) and a fade at the edge with more to see,
   the arrows move it a screen at a time, and the bar goes when the table fits (a wide desktop shows none); IA-1's page no
   longer slides sideways (its convergence tables scroll in their box); OB-1's Log leads each row with Open and Remove, kept
   in view while the row scrolls; RA-1's progressive ratio sheet shows the Break point right after the condition; a fresh
   SP-1 sheet on touch prints five days a sheet and keeps the time and Total columns in view; DD-1's results tables, DA-1's
   ranked tasks and ABC-1's matrix (which keeps its own fade) carry the bar. usage: node qa/ux136-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const F={ia:'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html',ob:'OB-1_Direct-Observation-Record_v2026-09.html',ra:'Reinforcer_Assessment_Protocol.html',sp:'Scatterplot_Pattern_Analysis.html',da:'DA-1_Demand-Assessment_v2026-10.html',dd:'Daily_Behavior_Data_and_Visual_Analysis.html',abc:'ABC_Recording_Conditional_Probability_Analysis.html'};
const BARS=()=>[...document.querySelectorAll('.nbh-xs-bar')].filter(b=>!b.hidden&&b.offsetParent).map(b=>{const w=b.nextElementSibling;return {at:w.id||String(w.className).replace(/\s*nbh-xs\S*/g,'').trim(),sw:w.scrollWidth,cw:w.clientWidth,own:w.classList.contains('nbh-xs-own'),mask:getComputedStyle(w).maskImage!=='none'||getComputedStyle(w).webkitMaskImage!=='none',l:b.querySelector('[data-xs="-1"]').disabled,r:b.querySelector('[data-xs="1"]').disabled,text:b.querySelector('span').textContent};});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ipad=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 async function open(ctx,file,sim){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file.slice(0,6)+': '+String(e).slice(0,100)));await p.goto(BASE+'/NBH-Workstation/'+file);await sleep(1500);
   await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});if(sim){await loadSim(p);await sleep(2500);}return p;}
 /* ---- IA-1: the page stays put, the convergence table scrolls in its box with the bar ---- */
 let p=await open(ipad,F.ia,true);
  let r=await p.evaluate('('+BARS.toString()+')()').then(bars=>({bars}));const docW=await p.evaluate(()=>document.documentElement.scrollWidth);
 /* v24.46: since v24.43 (R-050, R-131) IA-1's convergence and analysis tables fit an iPad held upright (820): nothing to
    scroll and nothing hidden. The bar is checked at 640, where the convergence table is wider than its box. */
 const fit=await p.evaluate(()=>[...document.querySelectorAll('.nbh-scrollx,.nbh-tscroll')].filter(w=>w.offsetParent&&w.querySelector('table')).map(w=>({sw:w.scrollWidth,cw:w.clientWidth,bar:!!(w.previousElementSibling&&w.previousElementSibling.classList.contains('nbh-xs-bar')&&!w.previousElementSibling.hidden)})));
 ok('IA-1 (R-043) upright (820): the page is as wide as the screen; every table box either fits its table (nothing hidden) or shows the bar',
   docW===820&&fit.length>=1&&fit.every(x=>x.sw<=x.cw+1||x.bar),{docW,fit});
 await p.close();
 const narrow=await b.newContext({viewport:{width:640,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 p=await open(narrow,F.ia,true);r=await p.evaluate('('+BARS.toString()+')()').then(bars=>({bars}));const docW6=await p.evaluate(()=>document.documentElement.scrollWidth);
 ok('IA-1 (R-043) at 640: the page is as wide as the screen and a table wider than its box scrolls in it, with the bar (the words, the right arrow live, the left one not yet) and the fade',
   docW6===640&&r.bars.length>=1&&r.bars.every(x=>x.sw>x.cw&&/More columns to the side/.test(x.text)&&x.l&&!x.r&&x.mask),{docW6,bars:r.bars});
 /* the arrows move it a screen at a time; at the far edge the right arrow goes quiet and the left one wakes */
 const moved=await p.evaluate(async()=>{const bar=[...document.querySelectorAll('.nbh-xs-bar')].find(b=>!b.hidden&&b.offsetParent);const w=bar.nextElementSibling;const s0=w.scrollLeft;bar.querySelector('[data-xs="1"]').click();await new Promise(r=>setTimeout(r,900));
   const s1=w.scrollLeft;const st=[bar.querySelector('[data-xs="-1"]').disabled,bar.querySelector('[data-xs="1"]').disabled,w.classList.contains('nbh-xs-l'),w.classList.contains('nbh-xs-r')];bar.querySelector('[data-xs="-1"]').click();await new Promise(r=>setTimeout(r,900));return {s0,s1,st,s2:w.scrollLeft,max:w.scrollWidth-w.clientWidth};});
 ok('the right arrow scrolls the box to its far edge (the table is under two screens wide): the right arrow goes quiet and the left one wakes, the fade moves to the left edge; the left arrow brings it back',
   moved.s0===0&&moved.s1>=moved.max-2&&moved.st[0]===false&&moved.st[1]===true&&moved.st[2]===true&&moved.st[3]===false&&moved.s2===0,moved);
 await p.close();
 /* ---- OB-1: Open and Remove lead the Log's rows, sticky ---- */
 p=await open(ipad,F.ob,true);await p.evaluate(()=>{const v=document.querySelector('[data-view="log"]');if(v)v.click();});await sleep(1200);
 r=await p.evaluate(()=>{const th=[...document.querySelectorAll('table.grid.oblog thead th')].map(t=>t.className+'|'+t.textContent.trim());const td=document.querySelector('table.grid.oblog tbody tr td');const w=document.querySelector('#obsLog .logwrap');
   const btns=td?[...td.querySelectorAll('button')].map(b=>b.textContent.trim()):[];const r0=td&&td.getBoundingClientRect().left;if(w)w.scrollLeft=300;const r1=td&&td.getBoundingClientRect().left;
   return {th:th.slice(0,3),btns,sticky:td&&getComputedStyle(td).position,r0:Math.round(r0),r1:Math.round(r1),scrolled:w&&w.scrollLeft,bar:!!(w&&w.previousElementSibling&&w.previousElementSibling.classList.contains('nbh-xs-bar')&&!w.previousElementSibling.hidden)};});
 ok('OB-1 (R-054): the Log\'s first column holds Open and Remove, sticky at the left while the row scrolls, and the log\'s box carries the bar',
   /^noprint act\|$/.test(r.th[0])&&/\|#$/.test(r.th[1])&&r.btns.join()==='Open,Remove'&&r.sticky==='sticky'&&r.scrolled>0&&Math.abs(r.r1-r.r0)<=2&&r.bar,r);
 /* Open still opens that observation */
 const opened=await p.evaluate(()=>{const b=document.querySelector('table.grid.oblog tbody tr:nth-child(2) td.act .logOpen');if(!b)return null;b.click();return new Promise(res=>setTimeout(()=>res({view:document.querySelector('[data-view].on,[data-view][aria-selected="true"],[data-view].active')?.dataset.view||'',cur:(window.state&&(state.cur??state.obsIndex??state.i))}),600));});
 ok('Open in the leading column opens the observation (the Log view gives way)',opened&&opened.view!=='log',opened);
 await p.close();
 /* ---- RA-1: Break point right after Condition ---- */
 p=await open(ipad,F.ra,true);await p.evaluate(()=>{const v=document.querySelector('#viewSeg [data-view="pr"]');if(v)v.click();});await sleep(1200);
 r=await p.evaluate(()=>({th:[...document.querySelectorAll('#prTbl thead th')].map(t=>t.textContent.trim()),bp:(document.querySelector('#prB0')||{}).textContent,cell4:(document.querySelector('#prTbl tbody tr td:nth-child(4)')||{}).id,bars:[...document.querySelectorAll('.nbh-xs-bar')].filter(b=>!b.hidden&&b.offsetParent).length}));
 ok('RA-1 (R-074): the progressive ratio sheet reads #, Date, Condition, Break point, then the FR columns; the break point is in the fourth cell of each row and still computed; the sheet\'s box carries the bar',
   r.th.slice(0,4).join()==='#,Date,Condition,Break point'&&/^FR /.test(r.th[4]||'')&&/^\d+$/.test(String(r.bp).trim())&&r.cell4==='prB0'&&r.bars>=1,r);
 await p.close();
 /* ---- SP-1: a fresh sheet on touch prints five days; the time and Total columns stay in view ---- */
 p=await open(ipad,F.sp,false);
 r=await p.evaluate(()=>{const g=document.getElementById('grid');const t=g&&g.querySelector('td.time'),o=g&&g.querySelector('td.tot');return {perSheet:state.cfg.perSheet,sel:(document.getElementById('perSheet')||{}).value,time:t&&[getComputedStyle(t).position,getComputedStyle(t).left],tot:o&&[getComputedStyle(o).position,getComputedStyle(o).right],sid:state.meta.sid||'',cells:Object.keys(state.cells).length};});
 ok('SP-1 (R-065): a fresh sheet on a touch screen is set to five days a sheet, and on screen the time column sticks left and the Total column sticks right',
   r.perSheet===5&&r.sel==='5'&&r.time&&r.time[0]==='sticky'&&r.time[1]==='0px'&&r.tot&&r.tot[0]==='sticky'&&r.tot[1]==='0px',r);
 await p.close();
 /* a desktop fresh sheet keeps the default */
 const desk=await b.newContext({viewport:{width:1400,height:900}});
 p=await open(desk,F.sp,false);const dps=await p.evaluate(()=>state.cfg.perSheet);await p.close();
 ok('a fresh sheet on a desktop keeps the form\'s own days a sheet (the touch default is only for touch)',typeof dps==='number'&&dps!==5,{dps});
 /* ---- DD-1, DA-1, ABC-1: the bar on their wide tables; ABC-1's matrix keeps its own fade ---- */
 p=await open(ipad,F.dd,true);r=await p.evaluate('('+BARS.toString()+')()');
 ok('DD-1: the results tables (blocks of their own) scroll with the bar and the fade',r.length>=2&&r.every(x=>x.sw>x.cw&&x.mask),r);await p.close();
 p=await open(ipad,F.da,true);r=await p.evaluate('('+BARS.toString()+')()');
 ok('DA-1: the ranked tasks box scrolls with the bar',r.length>=1&&r.every(x=>x.sw>x.cw),r);await p.close();
 p=await open(ipad,F.abc,true);r=await p.evaluate('('+BARS.toString()+')()');const abcDoc=await p.evaluate(()=>document.documentElement.scrollWidth);
 ok('ABC-1: the matrix keeps its own fade (marked as its own) and gets the bar; the page stays as wide as the screen',abcDoc===820&&r.length>=1&&r.every(x=>x.own&&x.sw>x.cw),{abcDoc,r});await p.close();
 /* ---- a wide desktop: no bar where the tables fit ---- */
 p=await open(desk,F.ia,true);r=await p.evaluate('('+BARS.toString()+')()');const deskW=await p.evaluate(()=>document.documentElement.scrollWidth);await p.close();
 ok('on a 1400 px desktop IA-1 shows no bar (its tables fit) and the page is as wide as the screen',r.length===0&&deskW===1400,{r,deskW});
 /* ---- print: no bar on paper ---- */
 p=await open(ipad,F.dd,true);await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>[...document.querySelectorAll('.nbh-xs-bar')].filter(b=>getComputedStyle(b).display!=='none').length);await p.emulateMedia({media:'screen'});await p.close();
 ok('the bar is screen only: none shows under print media',pr===0,{pr});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
