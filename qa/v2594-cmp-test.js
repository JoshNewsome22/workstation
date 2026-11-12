/* v25.94 (the BCBA, 11/12, with a picture of Daily data: "Can this part of the graphs look better?") "School years
   compared: the first N school days", redrawn. The record here is invented (a simulated student, two targets, counts).
   A  the scale: a faint line and a number at each whole step from 0 to the highest value; the days numbered along the foot
      (1, 5, 10, 15, 20) under the words "School day";
   B  a school year is told three ways besides its colour: its marker's shape, its name at the end of its line (in the
      text's colour, this year's in bold), and the key over the graph, which says which is this school year; this year's
      markers are filled, an earlier year's open;
   C  what it says: equal means are "the same as ... no change" (it read "0 occurrences the same than"); a higher mean
      gives both means, the difference and the percentage;
   D  a tap or the pointer reads one day: a line at that day and each year's value under the graph;
   E  the room is used: on a wide screen the sentence and the table stand beside the graph and the table is no wider
      than its numbers need; on a phone the page is no wider than the screen and the table fits;
   F  a year keeps its colour and its marker whether two years are shown or three;
   G  a long comparison (60 days) draws lines without a marker on every day, and numbers the days by tens.
   Simulated people only. usage: node qa/v2594-cmp-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FORM=L.BASE+'/'+L.ED+'/Daily_Behavior_Data_and_Visual_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const open=async(w,h)=>{const ctx=await br.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(FORM);await sleep(1500);return {p,ctx};};
  /* an invented record: the first school days of each year, two targets counted */
  const fill=(p,years,n,days)=>p.evaluate(([years,n,days])=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
      const b0=S.behaviors[0]?JSON.parse(JSON.stringify(S.behaviors[0])):{},mk=(id,name)=>Object.assign({},b0,{id,name,measure:'count',direction:'decrease'});
      S.meta.client='Jordan Rivera';S.meta.id='0000000';S.behaviors=[mk('b1','Physical Aggression'),mk('b2','Property Destruction')];S.rows=[];
      const A={2024:[1,0,0,2,1,0,0,0,3,0,0,1,0,0,0,2,0,0,1,0],2025:[0,0,0,0,0,2,0,0,2,1,0,0,0,0,0,0,0,0,0,0],2026:[0,2,0,0,0,0,0,0,0,0,1,4,0,0,0,1,0,1,0,1]},
            B={2024:[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],2025:[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],2026:[0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
      years.forEach(y=>{let d=new Date(Date.UTC(y,7,11)),k=0;while(k<days){const wd=d.getUTCDay();if(wd>0&&wd<6){S.rows.push({date:d.toISOString().slice(0,10),values:{b1:A[y][k%20],b2:B[y][k%20]}});k++;}d=new Date(d.getTime()+864e5);}});
      S.settings.cmp=true;S.settings.cmpN=n;S.settings.rng='all';document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderAll();},[years,n,days]);
  const read=p=>p.evaluate(()=>[...document.querySelectorAll('.dd-cmp-b')].map(b=>{const g=b.querySelector('svg.dd-cmp-g'),tx=[...g.querySelectorAll('text')],num=t=>/^\d+(\.\d+)?$/.test(t.textContent.trim());
      const yl=tx.filter(t=>t.getAttribute('text-anchor')==='end'&&num(t)).map(t=>t.textContent),xl=tx.filter(t=>t.getAttribute('text-anchor')==='middle'&&num(t)).map(t=>t.textContent),ends=tx.filter(t=>/^\d{4}-\d\d$/.test(t.textContent)).map(t=>[t.textContent,t.getAttribute('fill'),t.getAttribute('font-weight')||'']);
      const lines=[...g.querySelectorAll('polyline')].map(l=>l.getAttribute('stroke')),grid=[...g.querySelectorAll('line')].filter(l=>l.getAttribute('y1')===l.getAttribute('y2')).length;
      const shapes={circle:[...g.querySelectorAll('circle')].filter(c=>c.getAttribute('r')==='4').map(c=>[c.getAttribute('fill'),c.getAttribute('stroke')]),rect:[...g.querySelectorAll('rect')].map(c=>[c.getAttribute('fill'),c.getAttribute('stroke')]),path:[...g.querySelectorAll('path[d$="Z"]')].map(c=>[c.getAttribute('fill'),c.getAttribute('stroke')])};
      return {h:b.querySelector('h4').textContent,yl,xl,ends,lines,grid,title:tx.some(t=>t.textContent==='School day'),shapes:{circle:shapes.circle.length,rect:shapes.rect.length,path:shapes.path.length,rectOpen:shapes.rect.every(m=>m[0]==='#fff'),pathFill:[...new Set(shapes.path.map(m=>m[0]))],circleOpen:shapes.circle.every(m=>m[0]==='#fff'),circleStroke:[...new Set(shapes.circle.map(m=>m[1]))],rectStroke:[...new Set(shapes.rect.map(m=>m[1]))]},
        key:[...b.querySelectorAll('.dd-cmp-key span')].map(s=>s.textContent),say:(b.querySelector('.dd-cmp-say')||{}).textContent||'',rows:[...b.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent))};}));
  const W=await open(1376,1032);await fill(W.p,[2025,2026],20,20);await sleep(300);const r=await read(W.p),a=r[0],b=r[1];
  ok('A the scale: a line and a number at each whole step (0 to 4 for the first target, 0 to 2 for the second), the days numbered 1, 5, 10, 15, 20 under "School day"',
    r.length===2&&a.yl.join()==='0,1,2,3,4'&&a.grid===5&&b.yl.join()==='0,1,2'&&b.grid===3&&a.xl.join()==='1,5,10,15,20'&&a.title&&b.title,{a:[a.yl,a.grid,a.xl],b:[b.yl,b.grid]});
  ok('B each year told by more than colour: 2025-26 a line with 20 open squares, 2026-27 (this school year, said in the key) with 20 filled triangles; each line’s name at its end in the text’s colour, this year’s in bold',
    a.lines.join()==='#e0561f,#16a070'&&a.shapes.rect===20&&a.shapes.rectOpen&&a.shapes.rectStroke.join()==='#e0561f'&&a.shapes.path===20&&a.shapes.pathFill.join()==='#16a070'&&a.shapes.circle===0
    &&a.key.length===2&&a.key[0]==='2025-26'&&a.key[1]==='2026-27 (this school year)'&&a.ends.length===2&&a.ends.every(e=>e[1]==='#16242E')&&a.ends.find(e=>e[0]==='2026-27')[2]==='700'&&a.ends.find(e=>e[0]==='2025-26')[2]==='',a);
  ok('C what it says: a higher mean gives both means, the difference and the percentage, and "worse"; equal means read "the same as ... no change", with no "the same than" and no "0 occurrences higher"',
    a.say==='2026-27\'s first 20 school days average 0.5 occurrences, 0.25 higher than 2025-26\'s 0.25 (100% higher), which is worse for this target.'&&b.say==='2026-27\'s first 20 school days average 0.1 occurrences, the same as 2025-26\'s, which is no change for this target.'&&a.rows[1].join()==='2026-27,20,0.5,0,4',{a:a.say,b:b.say,rows:a.rows});
  /* D: the pointer over school day 12 of the first graph */
  const g=W.p.locator('svg.dd-cmp-g').first();await g.scrollIntoViewIfNeeded();const bb=await g.boundingBox();const k=bb.width/760;await W.p.mouse.move(bb.x+(42+11*(760-42-76)/19)*k,bb.y+bb.height*.4);await sleep(200);
  const d=await W.p.evaluate(()=>{const b=document.querySelector('.dd-cmp-b'),x=b.querySelector('.dd-cmp-x');return {read:b.querySelector('.dd-cmp-read').textContent,vis:x.style.visibility,x:+x.getAttribute('x1'),other:document.querySelectorAll('.dd-cmp-b')[1].querySelector('.dd-cmp-read').textContent};});
  ok('D the pointer over a day: a line at school day 12 and "School day 12: 2025-26 0 · 2026-27 4 (occurrences)" under that graph only',d.read==='School day 12: 2025-26 0 · 2026-27 4 (occurrences)'&&d.vis==='visible'&&Math.abs(d.x-(42+11*642/19))<.2&&/^Tap or point/.test(d.other),d);
  const lay=p=>p.evaluate(()=>{const b=document.querySelector('.dd-cmp-b'),q=s=>b.querySelector(s).getBoundingClientRect(),g=q('svg.dd-cmp-g'),t=q('.dd-cmp-t'),s=q('.dd-cmp-say'),c=b.getBoundingClientRect();
    return {card:Math.round(c.width),g:[Math.round(g.left),Math.round(g.top),Math.round(g.width)],t:[Math.round(t.left),Math.round(t.top),Math.round(t.width)],s:[Math.round(s.left),Math.round(s.top)],doc:document.documentElement.scrollWidth,vw:innerWidth,box:Math.round(q('.dd-cmp-r').width)};});
  const e1=await lay(W.p);const P=await open(390,844);await fill(P.p,[2025,2026],20,20);await sleep(300);const e2=await lay(P.p);
  ok('E the room is used: on a wide screen the graph is 700 px or more, the sentence and the table stand to its right, and the table is under half the card; on a phone the page is no wider than the screen and the table fits its box',
    e1.g[2]>=700&&e1.s[0]>=e1.g[0]+e1.g[2]&&e1.t[0]>=e1.g[0]+e1.g[2]&&e1.t[1]<e1.g[1]+250&&e1.t[2]<e1.card/2&&e2.doc<=e2.vw&&e2.t[2]<=e2.box,{e1,e2});
  await P.ctx.close();
  await fill(W.p,[2024,2025,2026],20,20);await sleep(300);const f=(await read(W.p))[0];
  ok('F three years: three lines, each with its own marker (2024-25 open circles), and 2025-26 and 2026-27 keep the colour and marker they had with two',
    f.lines.join()==='#184f95,#e0561f,#16a070'&&f.shapes.circle===20&&f.shapes.circleOpen&&f.shapes.circleStroke.join()==='#184f95'&&f.shapes.rect===20&&f.shapes.rectStroke.join()==='#e0561f'&&f.shapes.path===20&&f.key.length===3&&f.key[2]==='2026-27 (this school year)'&&f.ends.length===3,f);
  await fill(W.p,[2025,2026],60,60);await sleep(300);const h=(await read(W.p))[0];
  ok('G sixty days: two lines with no marker on every day, the days numbered by tens',h.lines.length===2&&h.shapes.rect===0&&h.shapes.path===0&&h.shapes.circle===0&&h.xl.join()==='1,10,20,30,40,50,60'&&h.rows[0][1]==='60',{xl:h.xl,shapes:h.shapes,rows:h.rows});
  await W.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
