/* v23.69 Form TB-1's candidate list on an iPad (the BCBA's screenshot: the boxes could not be seen and the labels ran into
   each other). iPad Pro landscape (1366 x 1024, touch, Fit on), the form alone and in the workstation:
   1. every box in the candidate list (the behavior, who reported it, the rate, the four answers) has a border and a white
      fill: it can be seen;
   2. the same in the agreement pilot (Quality check);
   3. with type wider than Chromium's (as Safari's is), no label runs past its answer's place, no two places overlap, and
      the boxes of a line line up along their foot (v23.81: each candidate a card, its answers four to a line);
   4. on a laptop the boxes show too; on a phone the table is a table, as before;
   5. paper is as before: the boxes print without a border, as they did;
   6. no page errors. Simulated data only.  usage: node qa/tb1-ipad-boxes-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='TB-1');
const boxes=sel=>{const out=[];document.querySelectorAll(sel+' tbody td input:not([type=checkbox]):not([type=radio]),'+sel+' tbody td select,'+sel+' tbody td textarea').forEach(e=>{
  const b=e.getBoundingClientRect();if(b.width<4||b.height<4)return;const c=getComputedStyle(e);
  const sides=['Top','Bottom','Left','Right'].filter(s=>parseFloat(c['border'+s+'Width'])>0&&c['border'+s+'Style']!=='none'&&!/, 0\)$/.test(c['border'+s+'Color'])).length;
  out.push({tag:e.tagName,sides,bg:c.backgroundColor});});return out;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1500);
  const z=await p.evaluate(()=>(document.getElementById('nbhFitBtn')||{}).textContent||'');
  const c1=await p.evaluate(boxes,'#candTbl');
  const bad1=c1.filter(x=>x.sides<4||x.bg!=='rgb(255, 255, 255)');
  ok('1 iPad ('+z+'): every box in the candidate list can be seen (a border all round, a white fill; '+c1.length+' boxes)',/Fit/.test(z)&&c1.length>=20&&!bad1.length,{z,n:c1.length,bad:bad1.slice(0,5)});
  await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=tab],#viewSeg button,.tabs button')].find(x=>/Quality check/.test(x.textContent));if(b)b.click();});await sleep(500);
  const c2=await p.evaluate(boxes,'#ioaTbl');const bad2=c2.filter(x=>x.sides<4||x.bg!=='rgb(255, 255, 255)');
  ok('2 the agreement pilot\'s boxes can be seen too ('+c2.length+' boxes)',c2.length>=4&&!bad2.length,{n:c2.length,bad:bad2.slice(0,5)});
  await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=tab],#viewSeg button,.tabs button')].find(x=>/Select/.test(x.textContent));if(b)b.click();});await sleep(400);
  /* Safari's type is wider than Chromium's: set the labels in a wide face (DejaVu Sans) and see that every column still holds its own */
  await p.addStyleTag({content:'#candTbl tbody td::before{font-family:"DejaVu Sans",sans-serif!important}'});await sleep(300);
  const lay=await p.evaluate(()=>{const tr=document.querySelector('#candTbl tbody tr');const tds=[...tr.children].slice(1,9);
    const r=tds.map(td=>{const b=td.getBoundingClientRect(),c=td.querySelector('input,select,textarea').getBoundingClientRect();return {l:b.left,r:b.right,t:b.top,b:b.bottom,foot:Math.round(c.bottom),over:td.scrollWidth-td.clientWidth};});
    const hit=(x,y)=>x.l<y.r-0.5&&y.l<x.r-0.5&&x.t<y.b-0.5&&y.t<x.b-0.5,lines={};r.slice(1).forEach(x=>{const k=Math.round(x.t/8);(lines[k]=lines[k]||[]).push(x.foot);});
    return {r,overlap:r.some((x,i)=>r.some((y,j)=>j>i&&hit(x,y))),over:r.filter(x=>x.over>1).length,rowOver:tr.scrollWidth-tr.clientWidth,
      feet:Object.values(lines).filter(f=>Math.max(...f)-Math.min(...f)>1).length};});
  ok('3 with wider type (as Safari\'s), no label runs past its answer\'s place, no two places overlap, and each line\'s boxes line up along their foot',!lay.overlap&&!lay.over&&lay.rowOver<=1&&!lay.feet,lay);
  /* in the workstation, as the BCBA uses it */
  const w=await ctx.newPage();w.on('pageerror',e=>errs.push('shell: '+e.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await w.evaluate(async()=>{openForm('TB-1');const t0=performance.now();while(!state.status['TB-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));});await sleep(1500);
  const fr=w.frames().find(f=>/TB-1_/.test(f.url()));const c3=fr?await fr.evaluate(boxes,'#candTbl'):[];const bad3=c3.filter(x=>x.sides<4);
  ok('4a in the workstation on the iPad: the boxes can be seen',c3.length>=20&&!bad3.length,{n:c3.length,bad:bad3.slice(0,4)});
  await w.close();
  const lp=await br.newContext({viewport:{width:1440,height:900}});const q=await lp.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);
  const c4=await q.evaluate(boxes,'#candTbl');
  ok('4b on a laptop the boxes can be seen',c4.length>=20&&c4.every(x=>x.sides===4),{n:c4.length,bad:c4.filter(x=>x.sides<4).slice(0,3)});
  /* paper: as before, the boxes print without a border inside the table's ruled cells */
  await q.emulateMedia({media:'print'});await sleep(300);
  const pr=await q.evaluate(()=>{const e=document.querySelector('#candTbl tbody td textarea');const c=getComputedStyle(e);return {thead:getComputedStyle(document.querySelector('#candTbl thead')).display,b:c.borderTopWidth,td:getComputedStyle(e.closest('td')).borderTopWidth};});
  ok('5 paper is as before: the table with its header row, the boxes borderless in ruled cells',pr.thead!=='none'&&pr.b==='0px'&&pr.td!=='0px',pr);
  await lp.close();
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPAD.replace('iPad','iPhone')});const r=await ph.newPage();r.on('pageerror',e=>errs.push(e.message));await r.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);
  const phn=await r.evaluate(()=>({tbl:getComputedStyle(document.getElementById('candTbl')).display}));
  ok('4c on a phone the list is laid out as before (not the two-line rows)',phn.tbl!=='block',phn);
  await ph.close();
  ok('6 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
