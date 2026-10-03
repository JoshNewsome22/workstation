/* qa/tk1-audit.js: TK-1 rendered in print layout over 73 combinations of settings; every page is checked for text outside its container, collisions, clipped text and pieces off the sheet. "First/Then label overlaps a box" is the text box, not the ink, and is ignored; "texts edited long" is meant to continue on a second back. */
/* TK-1 audit: every scenario rendered in print layout, every page checked for text outside its container, collisions,
   overflow and pieces off the sheet */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
const CHECK=()=>{
  const out=[];const R=e=>e.getBoundingClientRect();
  const T=e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return b.width?b:R(e);};
  const inside=(a,b,tol)=>a.left>=b.left-tol&&a.right<=b.right+tol&&a.top>=b.top-tol&&a.bottom<=b.bottom+tol;
  const over=(a,b,tol)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>tol&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>tol;
  const name=e=>(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):e.tagName)+(e.textContent.trim()?' "'+e.textContent.trim().slice(0,24)+'"':'');
  document.querySelectorAll('#book .pg').forEach((pg,pi)=>{const lab=(pi+1)+':'+(pg.dataset.label||pg.dataset.kind);const k=pg.getBoundingClientRect().width/(pg.offsetWidth||1);const tol=1.5*k;
    const add=(m)=>out.push(lab+' | '+m);
    const P=R(pg);
    pg.querySelectorAll('*').forEach(e=>{if(e.closest('.trim')||e.classList.contains('trim')||e.closest('.wm'))return;const r=R(e);if(!r.width||!r.height)return;if(getComputedStyle(e).visibility==='hidden')return;
      if(!inside(r,P,tol)&&!e.closest('.cv'))add('off the sheet: '+name(e));});
    const cv=pg.querySelector('.cv');if(cv&&!inside(R(cv),P,tol))add('page box larger than the sheet');
    if(cv)cv.querySelectorAll('.slot,.ybx,.bx,.panel,.tab,.qr,.bd-photo,.tkcorner,.rule,.earn,.credit,.bbody,.bttl').forEach(e=>{if(!inside(R(e),R(cv),tol))add('outside the page box: '+name(e));});
    const panel=pg.querySelector('.panel');
    const ttl=pg.querySelector('.ttl');
    if(ttl&&panel){const t=T(ttl);if(!inside(t,R(panel),tol))add('title text outside the panel');
      pg.querySelectorAll('.bd-photo,.tkcorner,.ftlab,.qr,.bx,.ybx,.rule,.earn').forEach(o=>{const b=o.classList.contains('ftlab')?T(o):R(o);if(over(t,b,tol))add('title overlaps '+name(o));});}
    pg.querySelectorAll('.ftlab').forEach(f=>{const t=T(f);pg.querySelectorAll('.bx').forEach(b=>{if(over(t,R(b),tol))add('First/Then label overlaps a box');});});
    const slots=[...pg.querySelectorAll('.slot')];slots.forEach((s,i)=>{const sr=R(s);s.querySelectorAll('.ca,.cb').forEach(c=>{const t=T(c);if(!inside(t,sr,tol))add('caption outside its slot: '+name(c));if(over(t,R(s.querySelector('.dot')),tol))add('caption overlaps the dot: '+name(c));});
      slots.slice(i+1).forEach(o=>{if(over(sr,R(o),tol))add('slots overlap');});if(panel&&over(sr,R(panel),tol))add('slot overlaps the panel');});
    pg.querySelectorAll('.card').forEach(c=>{const cl=c.querySelector('.cl');if(cl&&cl.textContent.trim()&&!inside(T(cl),R(c),tol))add('card label outside its card: '+name(cl));const im=c.querySelector('.cp svg,.cp img');if(im&&!inside(R(im),R(c),tol))add('card picture outside its card');});
    pg.querySelectorAll('.bx .qr').forEach(q=>{const bx=q.closest('.bx');if(!inside(R(q),R(bx),tol))add('QR outside its box');const d=bx.querySelector('.dot');if(d&&over(R(q),R(d),tol))add('QR overlaps the dot');});
    pg.querySelectorAll('.panel>.qr').forEach(q=>{pg.querySelectorAll('.bx,.ybx,.foot,.rule,.earn').forEach(o=>{const b=o.classList.contains('foot')?T(o):R(o);if(over(R(q),b,tol))add('QR overlaps '+name(o));});});
    const ybx=[...pg.querySelectorAll('.ybx')];ybx.forEach((y,i)=>{if(panel&&!inside(R(y),R(panel),tol))add('park box outside the panel');ybx.slice(i+1).forEach(o=>{if(over(R(y),R(o),tol))add('park boxes overlap');});pg.querySelectorAll('.tkcorner,.foot').forEach(o=>{const b=o.classList.contains('foot')?T(o):R(o);if(over(R(y),b,tol))add('park box overlaps '+name(o));});});
    pg.querySelectorAll('.tab').forEach(t=>{const tr=R(t);t.querySelectorAll('i').forEach(i=>{if(!inside(T(i),tr,tol))add('tab letter outside the tab: '+i.textContent);});});
    pg.querySelectorAll('.rule').forEach((r,i,a)=>{const rl=r.querySelector('.rl');if(rl&&!inside(T(rl),R(r),2*tol))add('rule label outside its column: '+name(rl));if(rl&&rl.scrollHeight>rl.clientHeight+2)add('rule label clipped: '+name(rl));const e=pg.querySelector('.earn');if(e&&over(R(r),R(e),tol))add('rule overlaps the Earn box');[...a].slice(i+1).forEach(o=>{if(over(R(r),R(o),tol))add('rules overlap');});if(panel&&!inside(R(r),R(panel),tol))add('rule outside the panel');});
    const earn=pg.querySelector('.earn');if(earn&&panel&&!inside(R(earn),R(panel),tol))add('Earn column outside the panel');
    const bt=pg.querySelector('.bttl'),tb=pg.querySelector('.tband');if(bt&&tb){const t=T(bt);const tr=R(tb);if(t.left<tr.left-tol||t.right>tr.right+tol)add('back title wider than its band');}
    pg.querySelectorAll('.bbody').forEach(b=>{if(b.scrollHeight>b.clientHeight+2)add('back text clipped by '+(b.scrollHeight-b.clientHeight)+' px');const last=[...b.children].pop();const cr=pg.querySelector('.credit');if(last&&cr&&over(R(last),T(cr),tol))add('back text runs into the credit line');});
    const cr=pg.querySelector('.credit');if(cr){const t=T(cr);if(cr.scrollWidth>cr.clientWidth+1)add('credit line cut off');}
    pg.querySelectorAll('.foot').forEach(f=>{if(panel&&!inside(T(f),R(panel),tol))add('foot line outside the panel');});
    pg.querySelectorAll('.ttl,.slot .ca,.slot .cb,.card .cl,.foot,.bttl').forEach(e=>{if(e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible')add('text cut off: '+name(e));});
  });
  if(document.querySelector('#book .pg.contd'))out.push('a back continues on a second page');
  return out;};
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1366,height:1024}});wire(page,log);
  await page.addInitScript(()=>{window.print=()=>{};});
  await page.goto(URL);await sleep(800);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(600);
  const base=await page.evaluate(()=>JSON.stringify(S));
  const sc=[];
  for(const size of ['8.82','11','fill'])for(const lay of ['ft','rules'])for(const n of [3,4,5,6,7,8,9,10])sc.push({name:`${size} ${lay} n=${n}`,js:`S.meta.pagesize='${size}';S.meta.layout='${lay}';S.meta.n='${n}';ensure();recaps(true);`});
  const L='S.meta.pagesize="8.82";';
  sc.push({name:'blank book',js:'S=blank();'});
  sc.push({name:'blank book 11',js:'S=blank();S.meta.pagesize="11";'});
  sc.push({name:'long first name',js:L+'S.meta.first="Christopher-Alexander";'});
  sc.push({name:'long name rules + setting',js:L+'S.meta.first="Christopher-Alexander";S.meta.layout="rules";S.meta.setting="Cafeteria";'});
  sc.push({name:'bare possessive',js:L+'S.meta.first="James";S.meta.poss="bare";'});
  sc.push({name:'long card labels',js:L+'S.ch.forEach((o,i)=>o.l="Computer time with friends "+i);S.tg.forEach((o,i)=>o.l="Raise my hand and wait quietly "+i);'});
  sc.push({name:'long rule labels rules row 5',js:L+'S.meta.layout="rules";S.tg.forEach((o,i)=>o.l="Keep hands and feet to myself "+i);'});
  sc.push({name:'rules row 2 targets',js:L+'S.meta.layout="rules";S.tg.forEach((o,i)=>{if(i>1){o.k="";o.ph="";o.l="";}});'});
  sc.push({name:'presets on First/Then long labels',js:L+'S.ft[0]={k:"writing",ph:"",l:"Finish my writing worksheet"};S.ft[1]={k:"ipad",ph:"",l:"Tablet time with games"};'});
  sc.push({name:'presets 10 tokens',js:L+'S.meta.n="10";ensure();recaps(true);S.ft[0]={k:"writing",ph:"",l:"Writing"};S.ft[1]={k:"ipad",ph:"",l:"Tablet"};'});
  sc.push({name:'custom token name',js:L+'S.meta.tokname="Sticker";recaps(true);'});
  sc.push({name:'long captions',js:L+'S.caps.forEach(c=>{c.a="You are doing an amazing job";c.b="Only a few more to go!";});'});
  sc.push({name:'long credit',js:L+'S=blank();S.meta.credit="Made for the Royal Palm School behavior team, Palm Beach County School District, 2026-2027 school year. Questions: see the BCBA.";'});
  sc.push({name:'long QR url',js:L+'S.meta.qr="https://example.org/"+"a".repeat(220);'});
  sc.push({name:'long QR url plain',js:L+'S.meta.qr="https://example.org/"+"a".repeat(220);S.chk.qrframe=false;'});
  sc.push({name:'grey panel watermark',js:L+'S.meta.panel="grey";S.bg[0]={k:"ball",ph:"",l:""};S.bg[1]={k:"lego",ph:"",l:""};S.meta.wm="30";'});
  sc.push({name:'how-to on duplex',js:L+'S.chk.pg_how=true;S.meta.order="duplex";'});
  sc.push({name:'how-to 11',js:'S.meta.pagesize="11";S.chk.pg_how=true;'});
  sc.push({name:'cards order 10 tokens',js:L+'S.meta.order="cards";S.meta.n="10";ensure();recaps(true);'});
  sc.push({name:'cards order 11 in',js:'S.meta.pagesize="11";S.meta.order="cards";'});
  sc.push({name:'spare large',js:L+'S.meta.order="spare";S.meta.sp_card="ch:0";S.meta.sp_size="large";'});
  sc.push({name:'spare small token',js:L+'S.meta.order="spare";S.meta.sp_card="tok";S.meta.sp_size="small";'});
  sc.push({name:'spare own long label',js:L+'S.meta.order="spare";S.meta.sp_card="own";S.meta.sp_label="Quiet hands while waiting";'});
  sc.push({name:'only Board page',js:L+'S.chk.pg_ch=false;S.chk.pg_tg=false;S.chk.pg_tk=false;'});
  sc.push({name:'texts edited long',js:L+'S.txt.tb=S.txt.tb+"\\n\\n"+S.txt.tb;'});
  const all={};
  for(const s of sc){await page.evaluate(([b,js])=>{S=JSON.parse(b);new Function(js)();renderAll();setView('preview');},[base,s.js]);await sleep(250);
    await page.emulateMedia({media:'print'});await page.evaluate(()=>fitAll());await sleep(60);
    const r=await page.evaluate(CHECK);const pages=await page.evaluate(()=>document.querySelectorAll('#book .pg').length);
    await page.emulateMedia({media:'screen'});
    all[s.name]={pages,issues:[...new Set(r)]};
    console.log((r.length?'ISSUES ':'ok     ')+s.name+' ('+pages+' sheets)'+(r.length?'\n   '+[...new Set(r)].slice(0,14).join('\n   '):''));}
  console.log('LOG',JSON.stringify(log).slice(0,600));
  const bad=Object.entries(all).filter(([k,v])=>k!=='texts edited long'&&v.issues.some(i=>!/First\/Then label overlaps a box/.test(i)));console.log(bad.length?'RESULT: '+bad.length+' SCENARIOS WITH ISSUES':'RESULT: ALL CLEAN');await br.close();process.exit(bad.length?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
