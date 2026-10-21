/* v23.87 (the BCBA's iPad review of TD-1, then a sweep of all 47 forms at iPad sizes) the layout on a touch screen. On an iPad
   Air (1180x820, touch) and upright (820x1180):
   1. in every form with the shared block, every sheet tab is in sight (the strip wraps; no tab past the edge, nothing
      scrolled sideways; the toolbar folded while reading or typing keeps its one scrolling row), and no row of yes/no tap
      buttons is broken over two lines (a cell too narrow keeps its dropdown);
   2. TD-1's Setup: an example number alone reads "e.g. N" beside the box, not in it; a box another form fills says so
      when empty; the student-details grid has its row gap;
   3. TD-1's Antecedents: a yes/no dropdown is a row of tap buttons; a tap sets the dropdown's value and fires its change,
      a second tap clears it; the dropdown itself is kept (1 px, out of the tab order) for the record;
   4. on paper nothing of this shows: the hints and the buttons are not printed and the dropdown is printed as before;
   5. in the workstation the bars fold while the form is scrolled down to be read, come back when it is scrolled up, and
      never stay folded after the form is closed; one Save case at a time (the bar's, or the one beside the form when the
      bar is out of sight);
   6. no page errors. Simulated data only.  usage: node qa/ipad-layout-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const FORMS=L.forms().filter(f=>/id="nbh-ui-css"/.test(fs.readFileSync(path.join(L.ROOT,'NBH-Workstation',f.file),'utf8')));
const TD=FORMS.find(f=>f.id==='TD-1');
const tabs=()=>{const seg=document.querySelector('#viewSeg');if(!seg)return {n:0,out:0,scroll:0};
  const bs=[...seg.querySelectorAll('button')].filter(b=>!b.hidden&&getComputedStyle(b).display!=='none');
  const out=bs.filter(b=>{const r=b.getBoundingClientRect();return r.width<2||r.right>innerWidth+1||r.left<-1;}).length;
  const broken=[...document.querySelectorAll('.nbh-seg')].filter(s=>{const bs=[...s.querySelectorAll('button')];const r=bs.map(b=>Math.round(b.getBoundingClientRect().top));return bs.length&&new Set(r).size>1&&s.offsetParent;}).length;
  return {n:bs.length,out,scroll:Math.max(0,seg.scrollWidth-seg.clientWidth-1),broken,segs:document.querySelectorAll('.nbh-seg').length};};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  /* 1. every form, both ways up */
  const bad=[];let segs=0;
  for(const [w,h] of [[1180,820],[820,1180]]){const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
    for(const f of FORMS){await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(900);
      const r=await p.evaluate(tabs);segs+=r.segs;if(r.out||r.scroll>0||r.broken)bad.push({form:f.id,w,h,...r});}
    await ctx.close();}
  ok('1 every sheet tab in sight in all '+FORMS.length+' forms, sideways and upright, and no row of tap buttons broken over two lines ('+segs+' rows of buttons seen)',!bad.length&&segs>=10,bad.slice(0,8));
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(TD.file));await sleep(1200);
  /* 2. the Setup fields */
  const A=await p.evaluate(()=>{const s=document.querySelector('[name="m.sessmin"]'),b=document.querySelector('[name="m.beh"]');const eg=s&&s.nextElementSibling&&s.nextElementSibling.classList.contains('nbh-eg')?s.nextElementSibling.textContent:'';
    const ident=document.querySelector('.ident:not(.c1)');return {ph:s&&s.placeholder,eg,orig:s&&s.dataset.nbhPh,from:b&&b.placeholder,gap:ident?getComputedStyle(ident).rowGap:''};});
  ok('2 TD-1 Setup: the example number reads "e.g. 10" in the box where it fits, else beside it (the number kept for the record); the target behavior says it comes from Form TB-1; the details grid has its row gap',
    (/^e\.g\. \d+$/.test(A.eg)?A.ph==='':/^e\.g\. \d+$/.test(A.ph))&&/^\d+$/.test(A.orig||'')&&/^From Form TB-1/.test(A.from||'')&&A.gap==='10px',A);
  /* 3. the yes/no buttons */
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="ante"], #viewSeg button:nth-child(4)').click());await sleep(500);
  const B=await p.evaluate(()=>{const seg=[...document.querySelectorAll('.nbh-seg')].find(s=>s.offsetParent);if(!seg)return {seg:false};const sel=seg.previousElementSibling&&seg.previousElementSibling.tagName==='SELECT'?seg.previousElementSibling:seg.parentElement.querySelector('select.nbh-seg-src');
    const bs=[...seg.querySelectorAll('button.nbh-segb')];let changes=0;sel.addEventListener('change',()=>changes++);
    bs[0].click();const v1=sel.value,p1=bs[0].getAttribute('aria-pressed');bs[1].click();const v2=sel.value,p2=[bs[0].getAttribute('aria-pressed'),bs[1].getAttribute('aria-pressed')];bs[1].click();const v3=sel.value;
    const cs=getComputedStyle(sel);return {seg:true,n:bs.length,v1,p1,v2,p2,v3,changes,w:cs.width,hid:sel.getAttribute('aria-hidden'),tab:sel.tabIndex,h:bs[0].getBoundingClientRect().height,dv:bs[0].dataset.v};});
  ok('3 TD-1 Antecedents: a yes/no dropdown is tap buttons (38 px or taller); a tap sets the value and fires change, another clears it; the dropdown is kept 1 px wide, out of the tab order',
    B.seg&&B.n>=2&&B.v1===B.dv&&B.p1==='true'&&B.v2!==B.v1&&B.v2!==''&&B.p2[0]==='false'&&B.p2[1]==='true'&&B.v3===''&&B.changes===3&&parseFloat(B.w)<2&&B.hid==='true'&&B.tab===-1&&B.h>=38,B);
  /* 4. paper: before printing the script gives everything back (placeholders, grown boxes, the dropdowns themselves), so
     the page prints as the release before; after printing the screen gets its hints and buttons again */
  const segName=await p.evaluate(()=>{const s=document.querySelector('select.nbh-seg-src');return s?s.name:'';});
  const grown=await p.evaluate(()=>[...document.querySelectorAll('textarea[data-nbh-mh]')].length);
  await p.emulateMedia({media:'print'});await sleep(300);
  const P=await p.evaluate(n=>{const sel=document.querySelector('[name="'+n+'"]'),cs=sel?getComputedStyle(sel):null;
    return {hints:document.querySelectorAll('.nbh-hint,.nbh-eg').length,segs:document.querySelectorAll('.nbh-seg').length,srcs:document.querySelectorAll('select.nbh-seg-src').length,grown:document.querySelectorAll('textarea[data-nbh-mh]').length,
      ph:[...document.querySelectorAll('[data-nbh-ph]')].length,selW:cs?parseFloat(cs.width):0,selPos:cs?cs.position:'',selDisp:cs?cs.display:''};},segName);
  await p.emulateMedia({media:'screen'});await sleep(400);
  const back=await p.evaluate(()=>({segs:document.querySelectorAll('.nbh-seg').length,hints:document.querySelectorAll('.nbh-hint,.nbh-eg').length}));
  ok('4 on paper nothing of this shows: the hints, the buttons, the shortened placeholders and the grown boxes are given back ('+grown+' boxes, the dropdown '+segName+' printed as before); the screen gets them again after',
    !!segName&&P.hints===0&&P.segs===0&&P.srcs===0&&P.grown===0&&P.ph===0&&P.selW>20&&P.selPos!=='absolute'&&P.selDisp!=='none'&&back.segs>0&&back.hints>0,{P,back});
  await ctx.close();
  /* 5. the workstation's bars fold */
  const c2=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});c2.on('dialog',d=>d.accept().catch(()=>{}));
  const w=await c2.newPage();w.on('pageerror',e=>errs.push(e.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await w.evaluate(()=>openForm('TD-1'));await w.waitForFunction(()=>!!state.status['TD-1']);await sleep(1500);
  const fr=w.frames().find(f=>f!==w.mainFrame()&&/TD-1/.test(f.url()));
  const st=()=>w.evaluate(()=>({fold:document.body.classList.contains('ws-fold'),hdr:getComputedStyle(document.querySelector('header.top')).display,quick:getComputedStyle(document.querySelector('#saveQuick')).display,save:getComputedStyle(document.querySelector('#saveCase')).display}));
  const F={start:await st()};
  for(let i=0;i<8;i++){await fr.evaluate(()=>window.scrollBy(0,120));await sleep(120);}await sleep(700);F.down=await st();
  for(let i=0;i<2;i++){await fr.evaluate(()=>window.scrollBy(0,-60));await sleep(150);}await sleep(700);F.up=await st();
  await fr.evaluate(()=>window.scrollBy(0,500));await sleep(800);F.down2=await st();
  await w.evaluate(()=>document.querySelector('#closeForm').click());await sleep(400);await w.evaluate(()=>{const b=document.querySelector('#cfFoot button.danger');if(b)b.click();});await sleep(600);F.closed=await st();
  ok('5 the bars fold while the form is read and come back when it is scrolled up or closed; one Save case at a time',
    !F.start.fold&&F.start.hdr!=='none'&&F.start.quick==='none'&&F.start.save!=='none'&&F.down.fold&&F.down.hdr==='none'&&F.down.quick!=='none'&&!F.up.fold&&F.up.hdr!=='none'&&F.up.quick==='none'&&F.down2.fold&&!F.closed.fold&&F.closed.hdr!=='none',F);
  await c2.close();
  ok('6 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
