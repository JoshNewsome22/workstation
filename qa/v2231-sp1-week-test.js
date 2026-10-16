/* v22.31 Form SP-1's Week of from a calendar: a date box over the field (the whole field on a touch screen, the calendar
   mark at its end with a mouse) opens the calendar; the first day picked writes "Month d, yyyy – Month d, yyyy" over the
   sheet's days (school days with Mon–Fri) and dates the day columns; columns already dated otherwise are asked about first
   (Cancel changes only the Week of line); paper shows the line as before, with no date box. Simulated data only.
   usage: node qa/v2231-sp1-week-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const URL_=L.BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(URL_);await sleep(1200);
  await p.evaluate(()=>{window.__asked=[];window.__ans=true;window.confirm=t=>{window.__asked.push(String(t));return window.__ans;};});
  const pick=iso=>p.evaluate(iso=>{const w=document.getElementById('mWeekPick');w.value=iso;w.dispatchEvent(new Event('change',{bubbles:true}));},iso);
  const read=()=>p.evaluate(()=>({week:document.getElementById('mWeek').value,meta:state.meta.week,days:state.cfg.days,d:Array.from({length:state.cfg.days},(_,i)=>state.meta['date'+i]),ws:document.getElementById('weekStart').value,pv:document.getElementById('mWeekPick').value}));
  const g=await p.evaluate(()=>{const w=document.getElementById('mWeek').getBoundingClientRect(),k=document.getElementById('mWeekPick').getBoundingClientRect();const e=document.getElementById('mWeekPick');return {w:Math.round(w.width),k:e.offsetWidth,kr:Math.round(w.right-k.right),h:Math.round(k.height)>=30};   /* offsetWidth: the sheet is zoomed to the window */});
  ok('1 a laptop: the calendar box sits over the end of the Week of field (44 px), so the field can still be typed in',g.k===44&&Math.abs(g.kr)<=1&&g.h,g);
  await pick('2026-10-12');const a=await read();
  const school=a.d.every(x=>{const d=new Date(x+'T12:00');return d.getDay()!==0&&d.getDay()!==6;});
  ok('2 Monday 10/12/2026 picked: the day columns are dated from it, school days only, and Tools’ Week starting follows',a.d[0]==='2026-10-12'&&a.d.every(Boolean)&&school&&a.ws==='2026-10-12'&&a.pv==='2026-10-12',a);
  ok('2 the Week of line reads first day – last day, and is what the form keeps',/^October 12, 2026 – /.test(a.week)&&a.meta===a.week&&a.week.endsWith(new Date(a.d[a.d.length-1]+'T12:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})),a);
  await p.evaluate(()=>{window.__ans=false;});await pick('2026-10-19');const b=await read();const q=await p.evaluate(()=>window.__asked.splice(0));
  ok('3 columns already dated otherwise: asked first; Cancel changes only the Week of line',q.length===1&&/Date the day columns/.test(q[0])&&b.d[0]==='2026-10-12'&&/^October 19, 2026/.test(b.week),{q,b});
  await p.evaluate(()=>{window.__ans=true;});await pick('2026-10-19');const c=await read();
  ok('3 ... and OK dates them from the new day',c.d[0]==='2026-10-19',c);
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>({pick:getComputedStyle(document.getElementById('mWeekPick')).display,week:getComputedStyle(document.getElementById('mWeek')).display}));await p.emulateMedia({media:'screen'});
  ok('4 paper: the Week of line prints, the calendar box does not',pr.pick==='none'&&pr.week!=='none',pr);
  await ctx.close();
  const tctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:false,userAgent:IPAD,serviceWorkers:'block'});const t=await tctx.newPage();
  t.on('pageerror',e=>errs.push(e.message));await t.goto(URL_);await sleep(1200);
  const tg=await t.evaluate(()=>{const w=document.getElementById('mWeek').getBoundingClientRect(),k=document.getElementById('mWeekPick').getBoundingClientRect(),x=w.left+w.width/3,y=w.top+w.height/2;return {cover:Math.abs(w.width-k.width)<=1&&Math.abs(w.left-k.left)<=1,top:document.elementFromPoint(x,y)&&document.elementFromPoint(x,y).id,coarse:matchMedia('(pointer:coarse)').matches};});
  ok('5 an iPad: a tap anywhere on the Week of field lands on the calendar box',tg.cover&&tg.top==='mWeekPick',tg);
  await tctx.close();
  ok('6 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
