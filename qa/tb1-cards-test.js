/* v23.81 Form TB-1's candidate behaviors as cards (the BCBA's iPad: "This looks like it could be better designed"). With the
   simulated record, on an iPad Pro at Fit 150% (landscape), upright, in the workstation, in a narrow window, on a wide sheet,
   on paper and on a phone:
   1. each candidate is a card of its own (a border all round, rounded corners, a gap between cards); its number in a badge
      beside the top of the behavior box; the behavior box across the card, its edges those of the answers under it;
   2. the answers four to a line in the table's order (who reported it, the rate, the urgency, social significance; then
      natural reinforcement, the cusp and the decision, the decision across two places), each label on one line, the boxes
      of a line along one foot, every choice whole in its box;
   3. remove is a button the size of a finger beside the behavior box, not over it; removing candidate 2 renumbers the
      badges and the buttons' names;
   4. upright, and in the workstation, the same four to a line;
   5. a window narrower than the sheet (660 px): three to a line, the boxes of a line still along one foot;
   6. a sheet with 900 px and more for the list: the six answers on one line;
   7. paper prints the table as before (its header row, a row to a candidate, no remove button), and a phone keeps the table
      in its sideways scroll;
   8. no page errors. Simulated data only.  usage: node qa/tb1-cards-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='TB-1');
/* the first card, measured: each answer's place, its box and its label */
const card=()=>{const tr=document.querySelector('#candBody tr'),td=[...tr.children],R=e=>e.getBoundingClientRect(),cs=getComputedStyle(tr);
  const c=document.createElement('canvas').getContext('2d');
  const a=td.slice(2,9).map((t,k)=>{const b=t.querySelector('input,select,textarea'),bb=R(b),be=getComputedStyle(t,'::before'),bs=getComputedStyle(b);
    c.font=be.fontWeight+' '+be.fontSize+' '+be.fontFamily;const lab=be.content.replace(/^"|"$/g,'');
    let fit=true;if(b.tagName==='SELECT'&&b.selectedIndex>0){c.font=bs.fontWeight+' '+bs.fontSize+' '+bs.fontFamily;fit=Math.ceil(c.measureText(b.options[b.selectedIndex].text).width)<=b.clientWidth-parseFloat(bs.paddingLeft)-parseFloat(bs.paddingRight);c.font=be.fontWeight+' '+be.fontSize+' '+be.fontFamily;}
    return {k:k+3,lab,labW:Math.ceil(c.measureText(lab).width),room:Math.floor(R(t).width),top:Math.round(bb.top),l:Math.round(bb.left),r:Math.round(bb.right),foot:Math.round(bb.bottom),fit};});
  /* a line is the answers whose boxes stand side by side (a label that wraps sits higher; its box does not) */
  const lines=[];a.forEach(x=>{let L=lines.find(l=>x.top<l.foot&&x.foot>l.top);if(!L)lines.push(L={top:x.top,foot:x.foot,k:[],feet:[],tops:[]});L.k.push(x.k);L.feet.push(x.foot);L.tops.push(x.top);});
  const ta=R(td[1].querySelector('textarea')),badge=R(td[0]),del=R(td[9].querySelector('.tb1-del')),tr2=tr.nextElementSibling;
  return {lines:lines.map(l=>l.k),feet:lines.every(l=>Math.max(...l.feet)-Math.min(...l.feet)<=1&&Math.max(...l.tops)-Math.min(...l.tops)<=1),labOne:a.every(x=>x.labW<=x.room),fit:a.every(x=>x.fit),a,
    card:{bw:['Top','Right','Bottom','Left'].every(s=>parseFloat(cs['border'+s+'Width'])>0),rad:parseFloat(cs.borderTopLeftRadius),gap:tr2?Math.round(R(tr2).top-R(tr).bottom):null},
    badge:{t:td[0].textContent.trim(),w:Math.round(badge.width),top:Math.round(badge.top-ta.top),rad:getComputedStyle(td[0]).borderTopLeftRadius,left:badge.right<=ta.left},
    beh:{l:Math.round(ta.left),r:Math.round(ta.right),aL:Math.min(...a.map(x=>x.l)),aR:Math.max(...a.map(x=>x.r))},
    del:{w:Math.round(del.width),h:Math.round(del.height),top:Math.round(del.top-ta.top),clear:del.left>=ta.right}};};
const sim=async p=>{await p.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}document.getElementById('simBtn').click();});await sleep(1500);
  await p.evaluate(()=>{const b=document.querySelector('#viewSeg button[data-view="select"]');if(b)b.click();});await sleep(400);};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1500);await sim(p);
  const z=await p.evaluate(()=>(document.getElementById('nbhFitBtn')||{}).textContent||'');
  const A=await p.evaluate(card);
  ok('1 iPad ('+z+'): each candidate a card, its number in a badge beside the behavior box, the behavior box across the card',/150%/.test(z)&&A.card.bw&&A.card.rad>=6&&A.card.gap>=8&&
    A.badge.t==='1'&&A.badge.left&&Math.abs(A.badge.top)<=2&&A.badge.rad==='50%'&&Math.abs(A.beh.l-A.beh.aL)<=1&&Math.abs(A.beh.r-A.beh.aR)<=1,{z,card:A.card,badge:A.badge,beh:A.beh});
  ok('2 the answers four to a line in the table\'s order, the decision across two places, each label on one line, each line\'s boxes along one foot, every choice whole',
    JSON.stringify(A.lines)==='[[3,4,5,6],[7,8,9]]'&&A.feet&&A.labOne&&A.fit&&(()=>{const d=A.a.find(x=>x.k===9),q=A.a.find(x=>x.k===5);return d.r-d.l>1.8*(q.r-q.l);})(),{lines:A.lines,feet:A.feet,labOne:A.labOne,fit:A.fit,a:A.a});
  const n0=await p.evaluate(()=>document.querySelectorAll('#candBody tr').length);
  await p.evaluate(()=>document.querySelectorAll('#candBody tr')[1].querySelector('.tb1-del').click());await sleep(700);
  const D=await p.evaluate(()=>[...document.querySelectorAll('#candBody tr')].map(tr=>[tr.children[0].textContent.trim(),tr.querySelector('.tb1-del').getAttribute('aria-label')]));
  ok('3 remove is a button the size of a finger beside the behavior box, not over it; removing candidate 2 renumbers the badges and the buttons',A.del.w>=44&&A.del.h>=44&&A.del.clear&&Math.abs(A.del.top)<=2&&
    D.length===n0-1&&D.every((x,i)=>x[0]===String(i+1)&&x[1]==='Delete candidate '+(i+1)),{del:A.del,n0,D});
  await ctx.close();
  /* upright, and in the workstation */
  const up=await br.newContext({viewport:{width:1024,height:1366},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
  const u=await up.newPage();u.on('pageerror',e=>errs.push(e.message));await u.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1500);await sim(u);const U=await u.evaluate(card);
  const w=await up.newPage();w.on('pageerror',e=>errs.push('shell: '+e.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await w.evaluate(async()=>{openForm('TB-1');const t0=performance.now();while(!state.status['TB-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));});await sleep(1500);
  const fr=w.frames().find(f=>/TB-1_/.test(f.url()));const W=fr?await fr.evaluate(card):null;
  ok('4 upright and in the workstation the same: four to a line, along one foot, each label on one line',JSON.stringify(U.lines)==='[[3,4,5,6],[7,8,9]]'&&U.feet&&U.labOne&&W&&JSON.stringify(W.lines)==='[[3,4,5,6],[7,8,9]]'&&W.feet,{up:[U.lines,U.feet,U.labOne],ws:W&&[W.lines,W.feet]});
  await up.close();
  /* a narrow window; a wide sheet; paper */
  const nw=await br.newContext({viewport:{width:660,height:900}});const q=await nw.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);await sim(q);
  const N=await q.evaluate(card);
  ok('5 a narrow window (660 px): three to a line, each line\'s boxes along one foot',JSON.stringify(N.lines)==='[[3,4,5],[6,7,8],[9]]'&&N.feet&&N.fit,{lines:N.lines,feet:N.feet,a:N.a.map(x=>[x.k,x.top,x.foot])});
  await q.evaluate(()=>document.querySelectorAll('.sheet').forEach(s=>{s.style.zoom='';s.style.width='1200px';s.style.maxWidth='none';}));await sleep(200);
  const Wd=await q.evaluate(card);
  ok('6 a sheet with 900 px and more for the list: the six answers on one line, the decision under them',JSON.stringify(Wd.lines)==='[[3,4,5,6,7,8],[9]]'&&Wd.feet,{lines:Wd.lines});
  await q.reload();await sleep(1200);await q.emulateMedia({media:'print'});await sleep(300);
  const P=await q.evaluate(()=>{const tr=document.querySelector('#candBody tr');return {thead:getComputedStyle(document.querySelector('#candTbl thead')).display,tr:getComputedStyle(tr).display,
    del:getComputedStyle(tr.children[9]).display,tbody:getComputedStyle(document.getElementById('candBody')).display};});
  await nw.close();
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPAD.replace('iPad','iPhone')});const r=await ph.newPage();r.on('pageerror',e=>errs.push(e.message));await r.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);
  const Ph=await r.evaluate(()=>({tbl:getComputedStyle(document.getElementById('candTbl')).display,tr:getComputedStyle(document.querySelector('#candBody tr')).display,scroll:getComputedStyle(document.getElementById('candTbl').parentElement).overflowX}));
  await ph.close();
  ok('7 paper prints the table as before (its header row, a row to a candidate, no remove button); a phone keeps the table in its sideways scroll',
    P.thead==='table-header-group'&&P.tr==='table-row'&&P.del==='none'&&P.tbody==='table-row-group'&&Ph.tbl==='table'&&Ph.tr==='table-row'&&Ph.scroll==='auto',{P,Ph});
  ok('8 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
