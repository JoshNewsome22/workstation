/* v25.95 (the BCBA, 11/12: "the trend line starting from the first data point until the last data point across both
   phases and then trend lines that are just based on the actual phase ... if a graph has three school years, there should
   be an option to show the trend line of all three years analyzed as one trend and or each individual year's trend line
   and if they are accelerating or decelerating") Daily data: two more trend lines, each an option of its own.
   The record here is invented: a simulated student, one target counted over three school years (falling, level, rising).
   A  off unless asked for: the graph and what is under it are as before (one trend line for the one condition);
   B  the trend of the whole record: one line from the first day's place to the last's, in ink, dash and dot, named at the
      line with its direction, in the key, and in a sentence with the number of days;
   C  the trend of each school year: a line over each year's own days and no further, in the target's colour, long
      dashes, each named with its year and direction (the falling year decelerating, the rising year accelerating), the
      sentence saying which direction is the improving one for this target;
   D  the two boxes on the sheet turn them on and off and are kept with the record's settings;
   E  the method follows the Trend line choice (least squares, split-middle) and the sentence names it;
   F  with a full phase change in the middle of a year, each condition keeps its own trend line and the year's line
      runs across the phase line;
   G  no page error.
   Simulated people only. usage: node qa/v2595-trend-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FORM=L.BASE+'/'+L.ED+'/Daily_Behavior_Data_and_Visual_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1376,height:1032},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(FORM);await sleep(1500);
  const fill=o=>p.evaluate(o=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
      const b0=S.behaviors[0]?JSON.parse(JSON.stringify(S.behaviors[0])):{};S.meta.client='Jordan Rivera';S.meta.id='0000000';
      S.behaviors=[Object.assign({},b0,{id:'b1',name:'Physical Aggression',measure:'count',direction:'decrease'})];S.rows=[];
      const F={2024:k=>Math.max(0,6-Math.floor(k/5)+(k%2)),2025:k=>1+(k%3===0?1:0),2026:k=>Math.floor(k/5)+(k%2)};
      (o.years||[2024,2025,2026]).forEach(y=>{let d=new Date(Date.UTC(y,7,12)),k=0;while(k<30){const wd=d.getUTCDay();if(wd>0&&wd<6){const row={date:d.toISOString().slice(0,10),values:{b1:F[y](k)}};if(o.phase&&y===2025&&k===15){row.phaseType='full';row.phaseLabel='Plan';}S.rows.push(row);k++;}d=new Date(d.getTime()+864e5);}});
      Object.assign(S.settings,{cmp:false,rng:'all',showTrend:true,trendLabels:false,trend:o.method||'ols',trendAll:!!o.all,trendYears:!!o.yr});
      document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderAll();},o||{});
  const read=()=>p.evaluate(()=>{const r=document.querySelector('.behavior-report'),g=r.querySelector('svg.graph'),n=v=>+(+v).toFixed(1),ln=l=>({c:l.getAttribute('class')||'',x1:n(l.getAttribute('x1')),y1:n(l.getAttribute('y1')),x2:n(l.getAttribute('x2')),y2:n(l.getAttribute('y2')),stroke:l.getAttribute('stroke'),dash:l.getAttribute('stroke-dasharray')||''});
      const pts=[...g.querySelectorAll('circle')].map(c=>n(c.getAttribute('cx'))).filter(x=>x>0).sort((a,b)=>a-b),beh=S.behaviors[0];
      return {all:[...g.querySelectorAll('line.dd-tr-all')].map(ln),yr:[...g.querySelectorAll('line.dd-tr-year')].map(ln),own:[...g.querySelectorAll('line')].map(ln).filter(l=>!l.c&&l.stroke===beh.color&&!l.dash&&l.x1!==l.x2).length,color:beh.color,
        labels:[...g.querySelectorAll('text.dd-trend')].map(t=>[t.textContent,t.getAttribute('fill')]),note:(r.querySelector('.dd-trends')||{}).textContent||'',legend:[...r.querySelectorAll('.legend>span')].map(s=>s.textContent.trim()),
        first:pts[0],last:pts[pts.length-1],boxes:[document.getElementById('c_trall').checked,document.getElementById('c_tryr').checked],set:[S.settings.trendAll,S.settings.trendYears]};});
  await fill({});const a=await read();
  ok('A off unless asked for: no line of the whole record or of a school year, no sentence, no entry in the key, the boxes unticked, and the one condition keeps its one trend line',
    !a.all.length&&!a.yr.length&&!a.note&&!a.legend.some(t=>/whole record|each school year/.test(t))&&!a.boxes[0]&&!a.boxes[1]&&a.own===1&&!a.labels.length,a);
  await fill({all:1});const b=await read();
  ok('B the whole record: one line from the first day to the last, in ink, dash and dot, named "Whole record: ..." in ink, in the key, and "Trend of the whole record (90 days)" under the graph',
    b.all.length===1&&!b.yr.length&&Math.abs(b.all[0].x1-b.first)<.2&&Math.abs(b.all[0].x2-b.last)<.2&&b.all[0].stroke==='#16242E'&&b.all[0].dash==='11 4 2 4'&&b.labels.length===1&&/^Whole record: /.test(b.labels[0][0])&&b.labels[0][1]==='#16242E'
    &&b.legend.includes('Trend of the whole record')&&/^Trend of the whole record \(90 days\) /.test(b.note)&&!/each school year:/.test(b.note)&&b.own===1,b);
  await fill({yr:1});const c=await read();const [y1,y2,y3]=c.yr;
  ok('C each school year: three lines in the target’s colour, long dashes, each over its own year’s days (one after the other, none into the next year); the falling year’s line falls and is "decelerating, the improving direction", the rising year’s rises and is "accelerating, the worsening direction"',
    c.yr.length===3&&!c.all.length&&c.yr.every(l=>l.stroke===c.color&&l.dash==='9 3')&&Math.abs(y1.x1-c.first)<.2&&y1.x2<y2.x1&&y2.x2<y3.x1&&Math.abs(y3.x2-c.last)<.2&&y1.y2>y1.y1+20&&y3.y2<y3.y1-20
    &&c.labels.length===3&&c.labels[0][0]==='2024-25: decelerating'&&c.labels[2][0]==='2026-27: accelerating'&&/^2025-26: /.test(c.labels[1][0])&&c.labels.every(t=>t[1]===c.color)
    &&/Trend of each school year: 2024-25 \(30 days\) decelerating, the improving direction; 2025-26 \(30 days\) [^;]+; 2026-27 \(30 days\) accelerating, the worsening direction\./.test(c.note)&&c.legend.includes('Trend of each school year'),c);
  /* D: the boxes */
  await fill({});await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.remove('hidden'));});
  await p.locator('#c_tryr').check();await sleep(300);const d1=await read();await p.locator('#c_trall').check();await sleep(300);const d2=await read();
  await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderAll();});const d3=await read();
  await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.remove('hidden'));});await p.locator('#c_tryr').uncheck();await sleep(300);const d4=await read();
  ok('D the two boxes: "Show the trend of each school year" draws the three lines, "Show the trend of the whole record" adds the one; both are kept in the record’s settings and stay ticked when the sheet is drawn again; unticking takes the lines away',
    d1.yr.length===3&&!d1.all.length&&d1.set[1]===true&&d2.yr.length===3&&d2.all.length===1&&d2.set[0]===true&&d3.boxes[0]&&d3.boxes[1]&&d3.yr.length===3&&d4.yr.length===0&&d4.all.length===1&&d4.set[1]===false,{d1:[d1.yr.length,d1.all.length,d1.set],d2:[d2.yr.length,d2.all.length,d2.set],d3:d3.boxes,d4:[d4.yr.length,d4.all.length,d4.set]});
  const lab=await p.evaluate(()=>['c_trall','c_tryr'].map(id=>document.getElementById(id).closest('label').textContent.trim()));
  await fill({all:1,yr:1,method:'split'});const e=await read();
  ok('E the boxes are named for what they show; with split-middle chosen the lines are fitted that way and the sentence says so',lab[0]==='Show the trend of the whole record'&&lab[1]==='Show the trend of each school year'&&/\(split-middle\)/.test(e.note)&&e.all.length===1&&e.yr.length===3&&/\(least squares\)/.test(c.note),{lab,note:e.note.slice(-140)});
  await fill({yr:1,phase:1});const f=await read();
  ok('F a full phase change in the middle of 2025-26: each of the two conditions keeps its own trend line, and the three school years keep theirs, 2025-26’s running across the phase line',f.own===2&&f.yr.length===3&&f.yr[1].x2-f.yr[1].x1>100&&/2025-26 \(30 days\)/.test(f.note),{own:f.own,yr:f.yr});
  await ctx.close();
  ok('G no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
