/* v25.70 (the BCBA, 11/9) Form VS-1's Signal cards: a red "not now" side and a green "you can ask" side (or a staff side), 5 x 7
   in, for FCT schedule thinning and multiple schedules, and Form TD-1's "Make signal cards" link. Checks: every template renders;
   the colours and the symbols; the 5 x 7 card and its page in the print CSS, the crop marks, the bleed-safe line and the duplex
   alignment (long-edge flip); grayscale contrast between the two sides of at least 3:1; the card kept by Save data / Open data and
   by the workstation's snapshot and restore; the exports and the other printouts unchanged; TD-1's links on its FCT, multiple-
   schedule and thinning cards, and in the workstation VS-1 opened beside TD-1 at the sheet. Writes iPad screenshots (1180 x 820)
   of the editor and PDFs of an attention card, both print ways, to SIG_OUT (default qa/out/v2570-signal). Simulated data only. */
const {chromium,fs,BASE,wire,sleep,IPAD_UA}=require(__dirname+'/lib.js');
const OUT=process.env.SIG_OUT||(__dirname+'/out/v2570-signal');fs.mkdirSync(OUT,{recursive:true});
const VS=BASE+'/NBH-Workstation/VS-1_Visual-Supports_v2026-10.html',TD=BASE+'/NBH-Workstation/'+fs.readdirSync(__dirname+'/../NBH-Workstation').find(f=>f.startsWith('TD-1_'));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const TPL={attention:['Attention is not available right now','You can ask for attention'],items:['Not now','You can ask for it'],break:['Keep working','You can ask for a break'],help:['Try on your own','You can ask for help'],general:['Not now','Yes, you can ask']};
async function vs(br,o){const ctx=await br.newContext(Object.assign({viewport:{width:1180,height:820}},o||{}));await ctx.addInitScript(()=>{window.print=function(){window.__printed=(window.__printed||0)+1;};});
  const p=await ctx.newPage();const log=[];wire(p,log);p.on('pageerror',e=>log.push({type:'pageerror',text:String(e)}));await p.goto(VS+((o&&o.hash)||''));await sleep(700);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};});return {ctx,p,log};}
const view=(p,v)=>p.click('#viewSeg button[data-view="'+v+'"]').then(()=>sleep(250));
const use=async(p,k)=>{await p.selectOption('#sgTpl',k);await p.click('#sgUse');await sleep(300);};
const sides=p=>p.evaluate(()=>({prev:[...document.querySelectorAll('#sgPrev .sg-side')].map(s=>({c:s.dataset.color,w:(s.querySelector('.sg-words')||{}).textContent||'',staff:s.dataset.color==='staff'?s.textContent:''})),
  pages:[...document.querySelectorAll('#signalOut .sg-page')].map(pg=>({sg:pg.dataset.sg,cards:[...pg.querySelectorAll('.sg-pos')].map(x=>x.dataset.color)}))}));
/* the pixels of an element, from its screenshot, as luminance (linear sRGB): median and mean */
async function lum(p,el){const png=(await el.screenshot()).toString('base64');
  return p.evaluate(async b=>{const im=new Image();await new Promise(r=>{im.onload=r;im.src='data:image/png;base64,'+b;});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data,L=[],lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};let s=0;
    for(let i=0;i<d.length;i+=16){const y=.2126*lin(d[i])+.7152*lin(d[i+1])+.0722*lin(d[i+2]);L.push(y);s+=y;}L.sort((a,b)=>a-b);return {med:L[L.length>>1],mean:s/L.length};},png);}
const ratio=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
/* the geometry of the sheets as they print: each page's size, its cards (trim box, in inches from the page), the marks, the text */
const geo=p=>p.evaluate(()=>[...document.querySelectorAll('#signalOut .sg-page')].map(pg=>{const R=pg.getBoundingClientRect(),z=R.width/pg.offsetWidth,I=96*z,rel=r=>({x:(r.left-R.left)/I,y:(r.top-R.top)/I,w:r.width/I,h:r.height/I});
  return {sg:pg.dataset.sg,w:pg.offsetWidth/96,h:pg.offsetHeight/96,k:pg.dataset.k||'',
    cards:[...pg.querySelectorAll('.sg-side')].map(s=>{const r=rel(s.getBoundingClientRect()),nm=s.querySelector('.sg-name,.sg-sh'),tp=s.querySelector('.sg-top'),texts=[];
      const tw=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);let t;while((t=tw.nextNode())){if(!t.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(t);[...rg.getClientRects()].forEach(q=>{if(q.width&&q.height)texts.push(rel(q));});}
      const sv=[...s.querySelectorAll('svg')].map(v=>rel(v.getBoundingClientRect()));
      return {c:s.dataset.color,side:s.dataset.side,r,name:nm?rel(nm.getBoundingClientRect()):null,top:tp?rel(tp.getBoundingClientRect()):null,texts,sv,cw:s.offsetWidth/96,ch:s.offsetHeight/96,rot:(s.closest('.sg-pos')||{dataset:{}}).dataset.rot};}),
    marks:[...pg.querySelectorAll('.sg-mk')].map(m=>Object.assign(rel(m.getBoundingClientRect()),{fold:m.classList.contains('fold')}))};}));
const near=(a,b,t)=>Math.abs(a-b)<=(t||.02);
/* which edge of the page the card's top edge (its sg-top point) faces: U, D, L or R; mirror: as seen once the sheet is turned over
   on its long edge (left and right swap) */
const dir=c=>{const dx=c.top.x+c.top.w/2-(c.r.x+c.r.w/2),dy=c.top.y+c.top.h/2-(c.r.y+c.r.h/2);return Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U');};
const mirror=d=>({L:'R',R:'L'}[d]||d);
const inside=(q,r,m)=>q.x>=r.x+m-.01&&q.y>=r.y+m-.01&&q.x+q.w<=r.x+r.w-m+.01&&q.y+q.h<=r.y+r.h-m+.01;
const overlaps=(q,r)=>q.x<r.x+r.w-.005&&q.x+q.w>r.x+.005&&q.y<r.y+r.h-.005&&q.y+q.h>r.y+.005;
/* print it the way Print the signal cards does (window.print stubbed): the sheet's state while it prints, the page request */
async function printState(p,fn){await p.evaluate(()=>{window.vsSignalPrint();});await sleep(120);await p.emulateMedia({media:'print'});await sleep(150);
  const r=await fn();await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(150);return r;}

(async()=>{const br=await chromium.launch();const allLog=[];
 try{
 /* ---------------- 1. each template renders ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);await view(p,'signal');
  const none=await p.evaluate(()=>({on:document.querySelector('#sgSec').classList.contains('sg-on'),edit:document.querySelector('#sgEdit').hidden,sig:'sig' in S}));
  ok('the Signal cards sheet opens with no card: the editor hidden, nothing in the form\u2019s state',!none.on&&none.edit&&!none.sig,none);
  const R={};for(const k of Object.keys(TPL)){await use(p,k);R[k]=await sides(p);}
  ok('each of the five templates renders its red front and its green back with the template\u2019s words, on two pages (front, back)',Object.entries(TPL).every(([k,[r,g]])=>{const s=R[k];return s.prev.length===2&&s.prev[0].c==='red'&&s.prev[1].c==='green'&&s.prev[0].w===r&&s.prev[1].w===g&&s.pages.length===2&&s.pages[0].sg==='front'&&s.pages[1].sg==='back'&&s.pages[0].cards[0]==='red'&&s.pages[1].cards[0]==='green';}),R);
  await use(p,'items');await p.fill('#sgItem','the tablet');await sleep(200);const it=await sides(p);
  ok('Items or toys: [item] is the item typed (blank: the picture\u2019s name, else "it")',it.prev[1].w==='You can ask for the tablet',it.prev[1]);
  const vis=()=>p.evaluate(()=>['#sgItem','#sgGreen','#sgAsk','#sgPaper'].map(id=>!!document.querySelector(id).offsetParent));
  const v1=await vis();await use(p,'attention');const v2=await vis();
  ok('the editor shows what the card uses: the item box only for [item], the staff boxes only with the staff side, the paper only for separate pages',JSON.stringify(v1)==='[true,true,false,true]'&&JSON.stringify(v2)==='[false,true,false,true]',{v1,v2});
  await p.selectOption('#sgBack','staff');await sleep(300);const st=await sides(p);
  const v3=await vis();await p.selectOption('#sgMode','fold');await sleep(200);const v4=await vis();await p.selectOption('#sgMode','duplex');
  ok('with the staff side: its three boxes shown and the green words box hidden; the fold sheet hides the paper',JSON.stringify(v3)==='[false,false,true,true]'&&JSON.stringify(v4)==='[false,false,true,false]',{v3,v4});
  ok('the staff side: a red card and a green card, each with the staff instructions on its back (what to do when the student asks during red, how long, when to flip), four pages',
   st.prev.length===4&&st.prev.map(x=>x.c).join()==='red,staff,green,staff'&&st.prev.filter(x=>x.c==='staff').every(x=>/asks during red/.test(x.staff)&&/How long red lasts/.test(x.staff)&&/When to flip to green/.test(x.staff)&&/Attention is not available right now/.test(x.staff))&&st.pages.length===4,st);
  await p.fill('#sgAsk','Point to the card once (simulated).');await sleep(200);
  ok('the staff words are edited in place',(await p.evaluate(()=>document.querySelector('#sgPrev .sg-staff .sg-q').textContent)).includes('Point to the card once (simulated).'));
  await p.selectOption('#sgBack','color');await sleep(200);
  await p.screenshot({path:OUT+'/editor-desktop-1180.png'});
  await ctx.close();}

 /* ---------------- 2. colours and symbols ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);await view(p,'signal');await use(p,'attention');
  const c=await p.evaluate(()=>{const f=document.querySelector('#signalOut .sg-red'),b=document.querySelector('#signalOut .sg-green'),cs=e=>getComputedStyle(e);
    return {red:cs(f.querySelector('.sg-bg')).backgroundColor,green:cs(b.querySelector('.sg-bg')).backgroundColor,rw:cs(f.querySelector('.sg-words')).color,gw:cs(b.querySelector('.sg-words')).color,
      rs:f.querySelector('svg[data-sym]').dataset.sym,gs:b.querySelector('svg[data-sym]').dataset.sym,oct:(f.querySelector('svg[data-sym] polygon').getAttribute('points')||'').trim().split(/\s+/).length,
      circ:!!b.querySelector('svg[data-sym] circle'),chk:!!b.querySelector('svg[data-sym] polyline'),panel:cs(b.querySelector('.sg-panel')).backgroundColor};});
  ok('red #C8102E and green #1E8E3E, white words on both',c.red==='rgb(200, 16, 46)'&&c.green==='rgb(30, 142, 62)'&&c.rw==='rgb(255, 255, 255)'&&c.gw==='rgb(255, 255, 255)',c);
  ok('the red side carries a stop hand in an octagon (8 corners), the green side a check in a circle: the sides differ in shape and symbol, not only colour',c.rs==='octagon-hand'&&c.oct===8&&c.gs==='circle-check'&&c.circ&&c.chk&&c.panel==='rgb(255, 255, 255)',c);
  await p.selectOption('#sgSym','x');await sleep(200);
  ok('the red side\u2019s symbol can be an \u2715 in an octagon',await p.evaluate(()=>document.querySelector('#signalOut .sg-red svg[data-sym]').dataset.sym==='octagon-x'&&document.querySelectorAll('#signalOut .sg-red svg[data-sym] line').length===2));
  await p.selectOption('#sgSym','hand');await ctx.close();}

 /* ---------------- 3. the page size, the marks, the bleed-safe line and the duplex alignment ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);await view(p,'signal');await use(p,'attention');await p.fill('#sgFirst','Sam');await sleep(200);
  const pr=await printState(p,async()=>({css:await p.evaluate(()=>{const s=document.querySelector('#sgPageSize');return s?s.textContent:'';}),
    side:await p.evaluate(()=>[...document.querySelectorAll('#signalOut .sg-side')].map(s=>[s.getBoundingClientRect().width,s.getBoundingClientRect().height,getComputedStyle(s).width,getComputedStyle(s).height])),
    shown:await p.evaluate(()=>[...document.querySelectorAll('section')].filter(s=>getComputedStyle(s).display!=='none').map(s=>s.className.split(' ')[0])),g:await geo(p)}));
  ok('in print the card is 5 \u00d7 7 in (480 \u00d7 672 CSS px) on a Letter portrait page with no margin, and only the signal sheet prints',pr.side.every(x=>x[2]==='480px'&&x[3]==='672px')&&/size:letter portrait;margin:0/.test(pr.css)&&pr.g.every(g=>near(g.w,8.5)&&near(g.h,11))&&pr.shown.join()==='only-signal',pr);
  const [F,B]=pr.g,f=F.cards[0],b=B.cards[0];
  ok('duplex, flip on the long edge: the back\u2019s card is the front\u2019s mirrored across the sheet (x\u2032 = 8.5 \u2212 x \u2212 w), at the same height, and both read the same way up (the name at the top)',near(f.r.x,F.w-b.r.x-b.r.w)&&near(f.r.y,b.r.y)&&dir(f)==='U'&&mirror(dir(b))==='U'&&f.name.y<f.r.y+1&&b.name.y<b.r.y+f.r.h/2,{f:f.r,b:b.r,df:dir(f),db:dir(b)});
  ok('crop marks: eight on each page, at the four corners, outside the trim and its 0.125 in bleed, inside the page',pr.g.every(g=>{const r=g.cards[0].r,o={x:r.x-.125,y:r.y-.125,w:r.w+.25,h:r.h+.25};return g.marks.length===8&&g.marks.every(m=>!overlaps(m,o)&&m.x>=0&&m.y>=0&&m.x+m.w<=g.w&&m.y+m.h<=g.h);}),pr.g.map(g=>g.marks));
  ok('bleed safe: no word within 0.25 in of the card\u2019s edge, front or back',pr.g.every(g=>g.cards.every(c=>c.texts.length&&c.texts.every(q=>inside(q,c.r,.25)))),pr.g.map(g=>g.cards.map(c=>c.texts.filter(q=>!inside(q,c.r,.25)))));
  /* landscape */
  await p.selectOption('#sgOrient','land');await sleep(250);
  const pl=await printState(p,async()=>({side:await p.evaluate(()=>[...document.querySelectorAll('#signalOut .sg-side')].map(s=>getComputedStyle(s).width+' '+getComputedStyle(s).height)),g:await geo(p)}));
  ok('landscape: the card is 7 \u00d7 5 in, mirrored on the back, words inside the safe line',pl.side.every(x=>x==='672px 480px')&&near(pl.g[0].cards[0].r.x,8.5-pl.g[1].cards[0].r.x-pl.g[1].cards[0].r.w)&&pl.g.every(g=>g.cards.every(c=>c.texts.every(q=>inside(q,c.r,.25)))),pl);
  /* card stock */
  await p.selectOption('#sgOrient','port');await p.selectOption('#sgPaper','card');await sleep(250);
  const pc=await printState(p,async()=>({css:await p.evaluate(()=>document.querySelector('#sgPageSize').textContent),g:await geo(p)}));
  ok('5 \u00d7 7 card stock: the print CSS asks for a 5in 7in page, and each side fills its page',/size:5in 7in;margin:0/.test(pc.css)&&pc.g.length===2&&pc.g.every(g=>near(g.w,5)&&near(g.h,7)&&near(g.cards[0].r.x,0)&&near(g.cards[0].r.w,5)),pc);
  await p.selectOption('#sgPaper','letter');
  /* the fold sheet */
  await p.selectOption('#sgMode','fold');await sleep(250);
  const pf=await printState(p,async()=>({css:await p.evaluate(()=>document.querySelector('#sgPageSize').textContent),g:await geo(p)}));
  const fg=pf.g[0]||{cards:[]},fr=fg.cards.find(c=>c.side==='front'),fb=fg.cards.find(c=>c.side==='back');
  ok('the fold sheet: one Letter landscape sheet, the 5 \u00d7 7 front and the back beside it, sharing the fold line (dashed marks), crop marks at the outer corners',/size:letter landscape;margin:0/.test(pf.css)&&pf.g.length===1&&near(fg.w,11)&&near(fg.h,8.5)&&fr&&fb&&fr.c==='red'&&fb.c==='green'&&near(fr.r.x+5,fb.r.x)&&near(fr.r.y,fb.r.y)&&near(fr.r.w,5)&&near(fr.r.h,7)&&fg.marks.filter(m=>m.fold).length===2&&fg.marks.filter(m=>!m.fold).length===8&&fg.marks.filter(m=>m.fold).every(m=>near(m.x,fb.r.x,.01)),pf);
  ok('the fold sheet keeps the words inside the safe line',fg.cards.every(c=>c.texts.every(q=>inside(q,c.r,.25))));
  await p.selectOption('#sgOrient','land');await sleep(250);
  const pf2=await printState(p,async()=>({css:await p.evaluate(()=>document.querySelector('#sgPageSize').textContent),g:await geo(p)}));
  const g2=pf2.g[0],a2=g2.cards.find(c=>c.side==='front'),b2=g2.cards.find(c=>c.side==='back');
  ok('a landscape card folds on a Letter portrait sheet: the back below the front, drawn upside down so it reads upright once folded',/size:letter portrait;margin:0/.test(pf2.css)&&near(g2.w,8.5)&&near(g2.h,11)&&near(a2.r.y+5,b2.r.y)&&a2.rot==='0'&&b2.rot==='180'&&dir(a2)==='U'&&dir(b2)==='D',{a2:[a2.r,a2.rot,dir(a2)],b2:[b2.r,b2.rot,dir(b2)]});
  await ctx.close();}
 /* the iPad: Safari prints portrait inside its own margins (the area, 7.4 x 9.45 in) */
 {const {ctx,p,log}=await vs(br,{userAgent:IPAD_UA,isMobile:true,hasTouch:true});allLog.push(log);await view(p,'signal');await use(p,'attention');await p.fill('#sgFirst','Sam');await p.selectOption('#sgOrient','land');await sleep(250);
  const pi=await printState(p,async()=>({css:await p.evaluate(()=>document.querySelector('#sgPageSize').textContent),g:await geo(p)}));
  const [F,B]=pi.g,f=F.cards[0],b=B.cards[0];
  ok('iPad, landscape card, front and back: turned to fit Safari\u2019s area, +90 on the front and \u221290 on the back; after the long-edge flip the name is at the same edge, the card at the same place, marks inside the area',
   /margin:\.5in/.test(pi.css)&&near(F.w,7.4)&&near(F.h,9.45)&&f.rot==='90'&&b.rot==='-90'&&near(f.r.w,5)&&near(f.r.h,7)&&near(f.r.x,F.w-b.r.x-b.r.w)&&near(f.r.y,b.r.y)&&dir(f)==='R'&&mirror(dir(b))==='R'&&pi.g.every(g=>g.marks.every(m=>m.x>=0&&m.x+m.w<=g.w+.01&&m.y>=0&&m.y+m.h<=g.h+.01)),{css:pi.css,F:[F.w,F.h],f:[f.r,f.rot,dir(f)],b:[b.r,b.rot,dir(b)],marks:pi.g.map(g=>g.marks.filter(m=>!(m.x>=0&&m.x+m.w<=g.w+.01&&m.y>=0&&m.y+m.h<=g.h+.01)))});
  await p.selectOption('#sgOrient','port');await p.selectOption('#sgMode','fold');await sleep(250);
  const pj=await printState(p,async()=>({g:await geo(p),note:await p.evaluate(()=>document.querySelector('#sgNote').textContent)}));
  ok('iPad, the fold sheet: turned and scaled to Safari\u2019s area, and the note says how much and how to print a true 5 \u00d7 7',pj.g.length===1&&+pj.g[0].k>.8&&+pj.g[0].k<.9&&/fits the sheet to that area at 86%/.test(pj.note)&&/true 5 by 7/.test(pj.note),pj.g.map(g=>g.k).concat(pj.note));
  await p.selectOption('#sgMode','duplex');await sleep(200);
  /* the iPad screenshots of the editor */
  await view(p,'signal');await p.evaluate(()=>window.scrollTo(0,0));await sleep(200);await p.screenshot({path:OUT+'/ipad-editor-top.png'});
  await p.evaluate(()=>document.querySelector('#sgPrev').scrollIntoView({block:'center'}));await sleep(250);await p.screenshot({path:OUT+'/ipad-editor-preview.png'});
  await p.selectOption('#sgBack','staff');await sleep(250);await p.evaluate(()=>{document.querySelector('#sgPrev').scrollIntoView({block:'start'});window.scrollBy(0,-80);});await sleep(250);await p.screenshot({path:OUT+'/ipad-editor-staff-side.png'});
  await p.selectOption('#sgBack','color');await ctx.close();}

 /* ---------------- 4. grayscale ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);await view(p,'signal');await use(p,'attention');await sleep(200);
  const one=async sel=>lum(p,await p.$(sel));
  const r0=await one('#signalOut .sg-page[data-sg="front"] .sg-side'),g0=await one('#signalOut .sg-page[data-sg="back"] .sg-side');
  await p.click('#sgPick button[data-sgpick]');await sleep(200);await p.click('#pdGrid button[data-k]');await sleep(300);
  const hasPic=await p.evaluate(()=>!!(S.sig.pic[0].k||S.sig.pic[0].ph)&&document.querySelectorAll('#signalOut .sg-pic').length===2);
  const r1=await one('#signalOut .sg-page[data-sg="front"] .sg-side'),g1=await one('#signalOut .sg-page[data-sg="back"] .sg-side');
  await p.selectOption('#sgBack','staff');await sleep(250);const s1=await one('#signalOut .sg-page[data-sg="back"] .sg-side');
  const q=[ratio(r0.med,g0.med),ratio(r1.med,g1.med),ratio(r1.med,s1.med)];
  console.log('  grayscale luminance (median, mean): red',r0,'green',g0,'with a picture: red',r1,'green',g1,'staff',s1,'ratios',q.map(x=>x.toFixed(2)).join(', '));
  ok('in grayscale the two sides differ by at least 3:1 (the luminance most of each side shows: red '+r0.med.toFixed(3)+', green '+g0.med.toFixed(3)+'), with a picture too ('+q[1].toFixed(2)+':1), and red against the staff side ('+q[2].toFixed(2)+':1)',hasPic&&q.every(x=>x>=3),{q,hasPic});
  await ctx.close();}

 /* ---------------- 5. saved and opened again ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);
  const blankFile=await p.evaluate(()=>nbhBridge.ownSave());
  ok('a form with no signal card saves no card (its file as before)',!!blankFile&&!/"sig"/.test(blankFile));
  await view(p,'signal');await use(p,'help');await p.fill('#sgRed','Try it yourself first (simulated)');await p.selectOption('#sgOrient','land');await p.selectOption('#sgMode','fold');await p.selectOption('#sgBack','staff');await p.fill('#sgFirst','Sam');
  await p.click('#sgPick button[data-sgpick]');await sleep(200);await p.click('#pdGrid button[data-k]');await sleep(300);
  const want=await p.evaluate(()=>JSON.stringify(S.sig)),file=await p.evaluate(()=>nbhBridge.ownSave());
  const snap=await p.evaluate(()=>new Promise(r=>{const h=e=>{if(e.data&&e.data.nbh==='snapshot'&&e.data.snap){window.removeEventListener('message',h);r(e.data.snap);}};window.addEventListener('message',h);window.postMessage({nbh:'snapshot'},'*');}));
  const fp=await vs(br);allLog.push(fp.log);
  await fp.p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'VS-1_test.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},file);await sleep(500);
  const got=await fp.p.evaluate(()=>JSON.stringify(S.sig||null));await view(fp.p,'signal');const s2=await sides(fp.p);
  ok('Save data, then Open data in a fresh form: the card comes back as it was (template, words, picture, name, card, print way, staff side)',got===want&&s2.prev[0].w==='Try it yourself first (simulated)'&&s2.prev.length===4,{got,want});
  const fq=await vs(br);allLog.push(fq.log);
  const rep=await fq.p.evaluate(s=>new Promise(r=>{const h=e=>{if(e.data&&e.data.nbh==='restored'){window.removeEventListener('message',h);r(e.data.report);}};window.addEventListener('message',h);window.postMessage({nbh:'restore',snap:s},'*');}),snap);await sleep(400);
  ok('the workstation\u2019s case (snapshot, then restore in a fresh form): the card is kept with the case',!!(snap&&snap.own)&&rep&&rep.own&&(await fq.p.evaluate(()=>JSON.stringify(S.sig||null)))===want,rep);
  /* an older file, and a file with a card the sheet does not know */
  await fq.p.evaluate(()=>{const t=JSON.stringify({form:'VS-1',rev:'2026-10',S:{meta:{},chk:{},photos:[],sig:{tpl:'nope',red:'x'}}});const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
  ok('a file with no card, or a card of an unknown template, opens with no card',await fq.p.evaluate(()=>!S.sig&&!document.querySelector('#sgSec').classList.contains('sg-on')));
  await ctx.close();await fp.ctx.close();await fq.ctx.close();}

 /* ---------------- 6. the exports and the other printouts unchanged ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);
  await p.evaluate(async()=>{await loadSim();});await sleep(500);
  const grab=()=>p.evaluate(async()=>{let csv=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{csv=t;});return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.querySelector('#csvBtn').click();await new Promise(r=>setTimeout(r,200));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ck;
    return {csv,outs:['boardOut','cardsOut','rulesOut','stripsOut'].map(id=>document.getElementById(id).innerHTML),facts:JSON.stringify(window.__nbhFactsOut&&__nbhFactsOut())};});
  await p.emulateMedia({media:'print'});const pr0=await p.evaluate(()=>getComputedStyle(document.querySelector('#sgSec')).display);await p.emulateMedia({media:'screen'});await sleep(200);
  const before=await grab();
  await view(p,'signal');await use(p,'attention');await view(p,'strips');
  const after=await grab();
  ok('with a signal card made: the CSV export, the case facts and the board, card, rule and strip sheets are unchanged',before.csv&&before.csv===after.csv&&before.facts===after.facts&&before.outs.every((h,i)=>h===after.outs[i]),{csv:before.csv===after.csv,facts:before.facts===after.facts,outs:before.outs.map((h,i)=>h===after.outs[i])});
  ok('a form with no card prints no signal sheet (the form\u2019s own print and the master print as before)',pr0==='none',pr0);
  const ps=await p.evaluate(()=>{document.querySelector('#outPrintBtn').click();return 1;});await sleep(150);await p.emulateMedia({media:'print'});
  const sh=await p.evaluate(()=>[...document.querySelectorAll('section')].filter(s=>getComputedStyle(s).display!=='none').map(s=>s.className.split(' ')[0]));
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(150);
  ok('Print the visuals on Strips and boards prints the strips alone, the signal card left out',sh.join()==='only-strips',sh);
  await p.emulateMedia({media:'print'});const pr1=await p.evaluate(()=>getComputedStyle(document.querySelector('#sgSec')).display);await p.emulateMedia({media:'screen'});
  ok('once made, the card prints with the form (its own sheet)',pr1==='block',pr1);
  await ctx.close();}

 /* ---------------- 7. the PDFs of an attention card, both ways ---------------- */
 {const {ctx,p,log}=await vs(br);allLog.push(log);await view(p,'signal');await use(p,'attention');await p.fill('#sgFirst','Sam');await sleep(200);
  for(const [mode,f] of [['duplex','attention-card-duplex-front-back.pdf'],['fold','attention-card-fold-sheet.pdf']]){await p.selectOption('#sgMode',mode);await sleep(250);
    await p.evaluate(()=>window.vsSignalPrint());await sleep(120);await p.emulateMedia({media:'print'});await p.pdf({path:OUT+'/'+f,printBackground:true,preferCSSPageSize:true});await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(150);}
  const cp=require('child_process');const pages=f=>{try{return cp.execSync(`python3 -c "import pymupdf,sys;d=pymupdf.open(sys.argv[1]);print(d.page_count,*[round(p.rect.width/72,2) for p in d],*[round(p.rect.height/72,2) for p in d])" "${f}"`).toString().trim();}catch(e){return 'no pymupdf';}};
  const a=pages(OUT+'/attention-card-duplex-front-back.pdf'),b=pages(OUT+'/attention-card-fold-sheet.pdf');console.log('  PDFs:',a,'|',b);
  ok('the PDFs: front and back on two Letter portrait pages; the fold sheet on one Letter landscape page',a==='no pymupdf'||a==='2 8.5 8.5 11.0 11.0'&&b==='1 11.0 8.5',[a,b]);
  await ctx.close();}

 /* ---------------- 8. Form TD-1: Make signal cards ---------------- */
 {const ctx=await br.newContext({viewport:{width:1180,height:820}});const p=await ctx.newPage();const log=[];wire(p,log);allLog.push(log);p.on('pageerror',e=>log.push({type:'pageerror',text:String(e)}));
  await p.goto(TD);await sleep(1500);await p.evaluate(()=>{nbhUI.confirm=async()=>true;});
  await p.evaluate(()=>{const f=document.querySelector('[name="m.fn"]');f.value='attention';f.dispatchEvent(new Event('change',{bubbles:true}));const add=c=>{const s=document.getElementById('addComp');s.value=c;document.getElementById('addCompBtn').click();};add('FCT');add('S_MULT');add('NCR');});
  await sleep(600);await p.evaluate(()=>window.__tdSignal.mark());
  const L=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,a:(c.querySelector('a.td-sig-go')||{}).href||'',t:(c.querySelector('a.td-sig-go')||{}).textContent||''})));
  const th=await p.evaluate(()=>{const a=document.querySelector('#tdSigThin a.td-sig-go');return a?a.getAttribute('href'):'';});
  ok('TD-1: the FCT and multiple-schedule cards carry "Make signal cards", to VS-1\u2019s sheet with the template for the plan\u2019s function (attention); an NCR card does not; the thinning plan carries it too',
   L.filter(x=>x.code==='FCT'||x.code==='S_MULT').every(x=>x.t==='Make signal cards'&&/VS-1_Visual-Supports_v2026-10\.html#signal-cards-attention$/.test(x.a))&&L.filter(x=>x.code==='NCR').every(x=>!x.a)&&/#signal-cards-attention$/.test(th),{L,th});
  await p.evaluate(()=>{window.__tdBank.show('sbt_tr-chained-delay-thinning');});await sleep(300);
  await p.evaluate(()=>{const h=[...document.querySelectorAll('*')].find(e=>e.shadowRoot&&e.shadowRoot.querySelector('.detail'));h.shadowRoot.querySelector('.detail button.add').click();});await sleep(900);await p.evaluate(()=>window.__tdSignal.mark());
  const tc=await p.evaluate(()=>{const c=[...document.querySelectorAll('#compWrap .card')].find(c=>{const b=c.querySelector('[name$="].bank"]');return b&&b.value==='sbt_tr-chained-delay-thinning';});return c?!!c.querySelector('a.td-sig-go'):null;});
  ok('a bank card that thins the schedule (Ghaemmaghami et al.\u2019s chained delay thinning, SBT_TR) carries the link',tc===true,tc);
  await p.evaluate(()=>{const f=document.querySelector('[name="m.fn"]');f.value='escape';f.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  ok('the template follows the function: escape opens the Break card',await p.evaluate(()=>[...document.querySelectorAll('a.td-sig-go')].every(a=>/#signal-cards-break$/.test(a.getAttribute('href')))));
  await p.emulateMedia({media:'print'});const pd=await p.evaluate(()=>[...document.querySelectorAll('.td-sig')].every(e=>getComputedStyle(e).display==='none'));await p.emulateMedia({media:'screen'});
  const col=await p.evaluate(()=>JSON.stringify(window.__tdCollect?__tdCollect():{}));
  ok('the links never print, and TD-1\u2019s saved file holds nothing of them',pd&&col.length>100&&!/Make signal cards|td-sig|signal-cards/.test(col),{pd,len:col.length});
  await ctx.close();}
 /* standalone VS-1 at the hash */
 {const {ctx,p,log}=await vs(br,{hash:'#signal-cards-break'});allLog.push(log);await sleep(300);
  const s=await p.evaluate(()=>({v:/view-signal/.test(document.body.className),t:document.querySelector('#sgTpl').value,sg:document.querySelector('#sgSugg').textContent,sig:!!S.sig}));
  ok('VS-1 opened at #signal-cards-break shows the Signal cards sheet with the Break template chosen, suggested, not yet used',s.v&&s.t==='break'&&/Break template/.test(s.sg)&&!s.sig,s);
  await ctx.close();}
 /* in the workstation: TD-1 asks, the shell opens VS-1 beside it at the sheet */
 {const ctx=await br.newContext({viewport:{width:1440,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});const p=await ctx.newPage();const log=[];wire(p,log);allLog.push(log);
  await p.goto(BASE+'/NBH-Workstation/index.html');await p.waitForFunction(()=>typeof openForm==='function'&&typeof openFor==='function');await sleep(600);
  await p.evaluate(()=>openForm('TD-1'));await p.waitForFunction(()=>!!state.status['TD-1'],null,{timeout:30000});await sleep(800);
  const tdf=p.frames().find(f=>/TD-1_/.test(f.url()));
  await tdf.evaluate(()=>{nbhUI.confirm=async()=>true;const f=document.querySelector('[name="m.fn"]');f.value='attention';f.dispatchEvent(new Event('change',{bubbles:true}));const s=document.getElementById('addComp');s.value='FCT';document.getElementById('addCompBtn').click();});await sleep(600);
  await tdf.evaluate(()=>{window.__tdSignal.mark();window.__op=[];window.addEventListener('message',e=>{if(e.data&&e.data.nbh==='opened')window.__op.push(e.data);});window.__opened0=window.open;window.open=function(){window.__tab=1;};document.querySelector('#compWrap .card a.td-sig-go').click();});
  await p.waitForFunction(()=>!!state.frames['VS-1'],null,{timeout:5000}).catch(()=>{});
  await p.waitForFunction(()=>{const f=state.frames['VS-1'];try{return f&&f.contentDocument&&/view-signal/.test(f.contentDocument.body.className);}catch(e){return false;}},null,{timeout:20000}).catch(()=>{});
  const w=await p.evaluate(()=>{const f=state.frames['VS-1'],d=f&&f.contentDocument;return {open:!!f,split:state.split,view:d?d.body.className:'',hash:f?f.contentWindow.location.hash:'',tpl:d?d.querySelector('#sgTpl').value:'',log:(state.relayLog||[]).slice(-2)};});
  const td=await tdf.evaluate(()=>({op:window.__op,tab:!!window.__tab}));
  ok('in the workstation "Make signal cards" opens Form VS-1 beside TD-1 at the Signal cards sheet, the Attention template chosen; no new tab',w.open&&/view-signal/.test(w.view)&&w.hash==='#signal-cards-attention'&&w.tpl==='attention'&&w.split.includes('TD-1')&&w.split.includes('VS-1')&&td.op.length===1&&td.op[0].ok&&!td.tab,{w,td});
  await ctx.close();}
 }catch(e){ok('the run finished',false,e.stack||e.message);}
 const errs=allLog.flat().filter(l=>l.type==='pageerror'||(l.type==='error'&&!/favicon|ERR_FILE_NOT_FOUND|404/.test(l.text||'')));
 ok('no page errors',!errs.length,errs.slice(0,4));
 await br.close();console.log(bad?'RESULT: '+bad+' failed':'RESULT: all passed');process.exitCode=bad?1:0;})();
