/* (v21.47) Form DD-1, the Walkthrough view: a narrated walkthrough of this form's own daily data sheet and graphs, for the
   staff who record. It is built live from the form as it is (the behaviors, their definitions and measurement, the days, the
   phase changes, the first behavior's graph and analysis), laid out once per build as a timeline; renderAt(t) sets every
   element to its state at time t as a pure function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js,
   Form TK-1's, beside the form) draw the same frames. The player (clock, narration, controls, full screen) is Form TK-1's, as
   SM-1 carries it (tools/forms/SM-1/walk.js); tools/forms/DD-1/patch-walk.py puts the two together into the form. The narration
   is walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as nbh-dd1-narration.js; without it
   the captions are timed from their word counts and the device's voice reads them. Scenes the data cannot show (no duration
   behavior with episodes, no skill scored out of opportunities, no phase change) are left out. The form's data (S) is never
   changed: the sheet and the graph are copies, their fields turned into text. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
window.NBH_WALK_INFO={file:'Daily data sheet walkthrough',from:'from this form: its behaviors, definitions, days and graphs',what:'form'};
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'sheet',types:'sheet',defs:'sheet',units:'sheet',day:'day',obsmin:'day',blankzero:'day',episodes:'day',percent:'day',phase:'changes',cond:'changes',graph:'graph',analysis:'graph',adults:'team',outro:'team'};
const CHAPS=[['sheet','The sheet'],['day','A day'],['changes','Changes'],['graph','The graphs'],['team','For the team']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.DD_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
const MK={};   /* DD-1: no measured word marks; a line's words are placed by their share of its characters */
const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16);};
function onsetFn(id,text,d){const pts=[[0,.05],[text.length,Math.max(.15,d-.15)]];
  return i=>{if(i<=0)return pts[0][1];const a=pts[0],b=pts[1];return a[1]+(b[1]-a[1])*Math.min(1,i/Math.max(1,b[0]));};}
function present(id){const L=audioLines();return L?!!L[id]:id in FB;}

/* ---------------- keyframe tracks (as SM-1's) ---------------- */
function Track(st){this.k=[{t:-1e9,st:Object.assign({},st)}];}
Track.prototype.last=function(){return this.k[this.k.length-1];};
Track.prototype.hold=function(t){const L=this.last();if(t>L.t)this.k.push({t,st:Object.assign({},L.st)});return this;};
Track.prototype.set=function(t,st){this.hold(t);const L=this.last();this.k.push({t:Math.max(t,L.t),st:Object.assign({},L.st,st)});return this;};
Track.prototype.move=function(t0,t1,st,arc,ez){this.hold(t0);const L=this.last();this.k.push({t:Math.max(t1,L.t),st:Object.assign({},L.st,st),arc:arc||0,ez:ez||ease});return this;};
Track.prototype.at=function(t){const k=this.k;let lo=0,hi=k.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1;}
  if(lo>=k.length-1)return k[lo].st;const a=k[lo],b=k[lo+1],span=b.t-a.t;if(span<=0)return b.st;
  const u0=(t-a.t)/span,u=(b.ez||ease)(u0),o={};for(const p in b.st){const va=a.st[p],vb=b.st[p];o[p]=va+(vb-va)*u;}
  if(b.arc){const dx=b.st.x-a.st.x,dy=b.st.y-a.st.y,len=Math.hypot(dx,dy);if(len>1){let nx=-dy/len,ny=dx/len;if(ny>0||(ny===0&&nx>0)){nx=-nx;ny=-ny;}const h=b.arc*len*4*u*(1-u);o.x+=nx*h;o.y+=ny*h;}}
  return o;};

/* ---------------- the DOM of the view ---------------- */
let DOM=null;
function dom(){if(DOM&&DOM.stage&&DOM.stage.isConnected)return DOM;const g=id=>document.getElementById(id);const stage=g('wkStage');if(!stage)return null;
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};const sk=DOM.seek;DOM.sfill=sk&&sk.querySelector('.wk-sfill');DOM.sthumb=sk&&sk.querySelector('.wk-sthumb');
  let m=DOM.frame.querySelector('.wk-msg');if(!m){m=div('wk-msg');m.setAttribute('role','status');m.hidden=true;DOM.frame.appendChild(m);}DOM.msg=m;
  wire();return DOM;}

/* ---------------- the build ---------------- */
let B=null;
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function build(){const D=dom();if(!D)return null;stop(true);
  const restore=tempShow(D.sec),restoreR=tempShow(document.getElementById('tab-results'));
  try{fit();B=compose(D);}
  finally{restoreR();restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

const CREDIT_WALK='Created by Joshua Newsome, BCBA';
const HAND='"Bradley Hand","Chalkboard SE","Segoe Print","Comic Sans MS","Comic Neue",cursive';
const PENCIL='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L24 4 H130 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H24 Z" fill="#f6c343" stroke="#5a4210" stroke-width="2"/><path d="M2 13 L24 4 V22 Z" fill="#f2d7b0" stroke="#5a4210" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L10 9.8 V16.2 Z" fill="#333"/><rect x="128" y="4" width="16" height="18" rx="4" fill="#ef8fa6" stroke="#5a4210" stroke-width="2"/><rect x="120" y="4" width="8" height="18" fill="#c9ced3" stroke="#5a4210" stroke-width="2"/><path d="M30 9 H118" stroke="#e0a92a" stroke-width="2"/></svg>';

/* the copies: every field turned into the text it shows, the buttons into labels, ids taken off */
function flatten(root){root.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  root.querySelectorAll('input').forEach(i=>{const s=document.createElement('span');s.className='ddw-v'+(i.classList.contains('is-default')?' dflt':'');
    const v=i.getAttribute('value')||'';s.textContent=i.type==='date'?(typeof shortDay==='function'?shortDay(v):v):v;i.replaceWith(s);});
  root.querySelectorAll('select,.pdate,.dd-graphsave,.no-print').forEach(x=>x.remove());
  root.querySelectorAll('button').forEach(b=>{const s=document.createElement('span');s.className='ddw-btn '+b.className;s.textContent=b.textContent;b.replaceWith(s);});}
const minSec=m=>{if(m==null||!isFinite(m))return '';const s=Math.round(m*60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lcam=layer('smw-cam'),Lfx=layer('smw-fx'),Lpen=layer('smw-pens');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!audioLines())notes.push('The recorded narration (nbh-dd1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  const obs=typeof orderedBehaviors==='function'?orderedBehaviors():[];
  if(!obs.length)notes.push('Add a behavior on the Client & behaviors page first: the walkthrough is built from this form’s own sheet and graphs.');
  /* the world the camera moves over: the sheet at the top, the first behavior's graph and analysis below it */
  const world=div('ddw-world');Lcam.appendChild(world);
  renderData();
  const sheetP=div('smw-paper ddw-paper');world.appendChild(sheetP);
  const inner=div('ddw-sheet');inner.id='wkSheet';sheetP.appendChild(inner);
  /* the sheet at its printed widths (the page's width, the columns even): about twice the size on the stage of the screen's */
  if(typeof applyColW==='function')applyColW(true);
  ['#sheetTop','#dataTable','#sheetDefs'].forEach(s=>{const el=document.querySelector(s);if(el&&el.innerHTML.trim()){const c=el.cloneNode(true);inner.appendChild(c);}});
  if(typeof applyColW==='function')applyColW(false);
  flatten(inner);
  const tbl=inner.querySelector('table.sheet');
  if(tbl){/* the actions column is left out */const cg=tbl.querySelector('colgroup');tbl.querySelectorAll('td.actions,th.fx-act').forEach(x=>x.remove());if(!tbl.classList.contains('slim'))tbl.querySelectorAll('thead tr.entry th:last-child').forEach(x=>x.remove());
    if(cg&&cg.lastElementChild){cg.lastElementChild.remove();const w=[...cg.children].reduce((s,c)=>s+(parseInt(c.style.width,10)||0),0);if(w)tbl.style.width=w+'px';}tbl.style.transform='';}
  if(!obs.length||!tbl)inner.innerHTML='<p style="font:600 28px Georgia,serif;padding:60px">Add the behaviors on the Client &amp; behaviors page, and this form’s own sheet appears here.</p>';
  const body=tbl?[...tbl.tBodies[0].rows].filter(r=>r.dataset.r):[];
  /* today: a row added under the last day, its cells empty, written in by the pencil */
  let today=null;
  if(body.length){const last=body[body.length-1];today=last.cloneNode(true);today.className='ddw-today';today.removeAttribute('data-r');
    today.querySelectorAll('.ddw-v').forEach(s=>{if(!s.classList.contains('dflt'))s.textContent='';});today.querySelectorAll('.po,.ddw-btn').forEach(s=>{s.textContent='';});
    today.querySelectorAll('td.calc').forEach(td=>{td.textContent='';});
    last.parentNode.appendChild(today);}
  const PW=Math.max(600,inner.offsetWidth+36),PH=Math.max(300,inner.offsetHeight+32);sheetP.style.width=PW+'px';
  /* the graph, drawn as the Graphs page draws it */
  let gP=null,rep=null;
  if(obs.length&&typeof renderResults==='function'){try{renderResults();}catch(e){}
    const r0=document.querySelector('#tab-results .behavior-report');
    if(r0&&r0.querySelector('svg.graph')){gP=div('smw-paper ddw-paper ddw-gpaper');rep=r0.cloneNode(true);flatten(rep);gP.appendChild(rep);gP.style.top=f2(PH+260)+'px';gP.style.width='1240px';world.appendChild(gP);}}
  world.style.width=Math.max(PW,gP?1240:0)+'px';
  const GY=PH+260;
  /* positions in the world (the camera's coordinates) */
  const wrel=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=world.getBoundingClientRect();const k=c.width/(world.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  const q=s=>inner.querySelector(s),qa=s=>[...inner.querySelectorAll(s)];
  /* the camera */
  const s0=Math.min(1220/PW,640/PH),HOME={x:(SW-PW*s0)/2,y:Math.max(14,(SH-90-PH*s0)/2+6),s:s0};
  const cam=new Track(HOME);
  const view=r=>{if(!r)return HOME;const s=clamp(Math.min(1180/r.w,470/r.h),.3,1.6);return{x:SW/2-(r.x+r.w/2)*s,y:300-(r.y+r.h/2)*s,s};};
  const camTo=(t0,t1,r)=>cam.move(t0,t1,view(r));
  /* overlays: on the world (they move with the camera) or on the stage */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glow=(r,t0,dur,pad)=>{if(!r)return;const p=pad==null?5:pad;const g=mkFx('wk-glow smw-pglow ddw-glow','',{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p},null,world);pulse(g,t0,dur);};
  const note=(r,text,t0,t1,side)=>{if(!r)return;const n=mkFx('ddw-note',esc(text),{x:r.x+r.w/2,y:side==='below'?r.y+r.h+10:r.y-44},{dy:side==='below'?-8:8},world);n.el.style.transform='translateX(-50%)';n.tr.move(t0,t0+.35,{o:1,dy:0},0,easeOut);n.tr.move(t1,t1+.35,{o:0});};
  /* the pencil's marks: a number written in */
  const marks=[];
  const write=(r,text,t0,t1,col,size)=>{if(!r)return null;const e=div('smw-write ddw-write',esc(text));e.style.left=f2(r.x)+'px';e.style.top=f2(r.y)+'px';e.style.width=f2(r.w)+'px';e.style.height=f2(r.h)+'px';e.style.color=col||'#2b4a9b';e.style.fontFamily=HAND;e.style.fontSize=f2(size||Math.min(22,r.h*.68))+'px';world.appendChild(e);
    const m={el:e,t0,t1,kind:'write',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:Math.min(r.w,44)/2,ry:5};marks.push(m);return m;};
  const pens=[];const mkPen=(svg,rest)=>{const e=div('smw-pen',svg);Lpen.appendChild(e);const p={el:e,tr:new Track({x:rest.x,y:rest.y,o:0,a:-38}),rest,draws:[]};pens.push(p);return p;};
  const PS=mkPen(PENCIL,{x:120,y:760});
  const penPt=(mk,u,t)=>{const c=cam.at(t),k=c.s;const x=mk.cx+mk.rx*(2*u-1),y=mk.cy+Math.sin(u*Math.PI*6)*3;return{x:c.x+x*k,y:c.y+y*k};};
  const draw=(pen,m,lead)=>{if(!m)return;const a=penPt(m,0,m.t0),b=penPt(m,1,m.t1);pen.tr.set(m.t0-(lead||.6)-.01,{o:1});pen.tr.move(m.t0-(lead||.6),m.t0,{x:a.x,y:a.y},.08);m.pt=penPt;pen.draws.push(m);pen.tr.set(m.t1,{x:b.x,y:b.y});};
  const penAway=(pen,t0)=>{pen.tr.move(t0,t0+.7,{x:pen.rest.x,y:pen.rest.y});pen.tr.set(t0+.7,{o:0});};
  /* the sheet's parts */
  const two=b=>MEASURES[b.measure]&&MEASURES[b.measure].two&&S.settings.entryMode!=='interval';
  const colOf=[];let ci=2;obs.forEach(b=>{const n=two(b)?3:1;colOf.push({b,i:ci,n});ci+=n;});
  const cell=(tr,i)=>tr?tr.cells[i]||null:null;
  const R={top:wrel(q('.sheet-top'))||wrel(q('th.idcell')),tbl:wrel(tbl),thead:tbl?wrel(tbl.tHead):null,bands:qa('thead th.band').map(wrel),names:qa('thead th.namecell').map(wrel),
    nums:qa('thead .bnum').map(wrel),units:tbl&&tbl.tHead.rows.length?[...tbl.tHead.rows[tbl.tHead.rows.length-1].cells].map(wrel):[],defs:wrel(q('.sd-wrap')),cards:qa('.sd-card').map(wrel),key:wrel(q('.sd-key')),
    today:wrel(today),row0:wrel(body[0])};
  const rowsBox=(a,b)=>uni(body.slice(a,b).map(wrel));
  const SC={};
  SC.intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(R.top,K.t+.5,2.2,6);glow(R.row0,Math.max(K.t+1.5,K.at('each row',.2)-.1),1.8,2);
    const c1=colOf[0];if(c1&&tbl)glow(uni([R.names[0]].concat(body.map(r=>wrel(cell(r,c1.i))))),Math.max(K.t+2.8,K.at('each column',.35)-.1),2,2);return K.d;};
  SC.types=K=>{camTo(K.t+.1,K.t+1.1,R.thead?{x:R.thead.x,y:R.thead.y,w:R.thead.w,h:Math.min(R.thead.h,260)}:R.tbl);
    const kinds=qa('thead th.band');const at={target:K.at('reduction targets',.15),replacement:K.at('replacement behaviors',.4),acquisition:K.at('acquisition targets',.8)};
    kinds.forEach(th=>{const k=(th.className.match(/band-(\w+)/)||[])[1];glow(wrel(th),Math.max(K.t+1.2,(at[k]||K.t+1.2)-.15),2.4,3);});return K.d;};
  SC.defs=K=>{const hv=R.thead?{x:R.thead.x,y:R.thead.y,w:R.thead.w,h:Math.min(R.thead.h,260)}:R.tbl;camTo(K.t+.1,K.t+.6,hv);R.nums.forEach((r,i)=>glow(r,K.t+.8+i*.25,1.4,4));
    const tb=Math.max(K.t+2.2,K.at('below the sheet',.4)-.4);if(R.defs){camTo(tb,tb+1.3,R.defs);R.cards.forEach((r,i)=>glow(r,tb+1.4+i*.45,1.6,4));}return Math.max(K.d,(R.defs?tb+1.4+R.cards.length*.45+1.2:0)-K.t);};
  SC.units=K=>{camTo(K.t+.1,K.t+1.1,R.thead?{x:R.thead.x,y:R.thead.y,w:R.thead.w,h:R.thead.h+40}:R.tbl);const u=R.units;
    const cnt=colOf.find(c=>c.b.measure==='count'||c.b.measure==='rate'),dur=colOf.find(c=>c.b.measure==='duration'||c.b.measure==='pdur'),tw=colOf.find(c=>two(c.b));
    const idx=c=>c?c.i-2:-1;   /* the units row starts at the first behavior (Date and Obs. min span the heading rows) */
    const slim=tbl&&tbl.classList.contains('slim');const off=slim?0:2;
    const g=(c,ph,fr)=>{if(!c)return;const a=idx(c)+off;const rs=u.slice(a,a+c.n);glow(uni(rs),Math.max(K.t+1.2,K.at(ph,fr)-.15),2,3);};
    g(cnt,'a count',.25);g(dur,'total minutes',.5);g(tw,'correct responses',.78);return K.d;};
  /* a day: the pencil writes today's row from the last day's numbers */
  const lastRow=body[body.length-1];
  SC.day=K=>{const v=uni([rowsBox(Math.max(0,body.length-4),body.length),R.today]);camTo(K.t+.1,K.t+1.1,v);if(R.today)glow(R.today,K.t+1,1.4,2);
    let t=Math.max(K.t+1.6,K.at('write the date',.3)-.1);
    const nd=(()=>{const r=S.rows[S.rows.length-1];if(!r||!r.date)return '';const p=r.date.split('-');const d=new Date(+p[0],+p[1]-1,+p[2],12);do{d.setDate(d.getDate()+1);}while(d.getDay()%6===0);return shortDay(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));})();
    const m0=write(wrel(cell(today,0)),nd,t,t+.5,'#2b4a9b',12.5);draw(PS,m0,.8);t+=.9;
    const tf=Math.max(t,K.at('fill in the row',.55)-.2);t=tf;
    colOf.forEach(c=>{for(let j=0;j<c.n;j++){const src=cell(lastRow,c.i+j),dst=cell(today,c.i+j);if(!dst||!src||src.classList.contains('calc'))continue;const v=(src.querySelector('.ddw-v')||src).textContent.trim();if(!v)continue;
      const mk=write(wrel(dst),v,t,t+.32,'#2b4a9b');draw(PS,mk,.35);t+=.48;}});
    /* a percent the form works out: it appears once its two numbers are in */
    colOf.filter(c=>two(c.b)).forEach(c=>{const pc=cell(today,c.i+2),src=cell(lastRow,c.i+2);if(!pc||!src)return;const f=mkFx('ddw-calc',esc(src.textContent.trim()),wrel(pc),null,world);f.tr.move(t+.1,t+.5,{o:1});});
    penAway(PS,t+.2);return Math.max(K.d,t+.9-K.t);};
  SC.obsmin=K=>{const v=uni([rowsBox(Math.max(0,body.length-4),body.length),R.today]);const oc=uni(body.slice(Math.max(0,body.length-4)).concat([today]).map(r=>wrel(cell(r,1))));
    camTo(K.t+.1,K.t+.8,v);glow(oc,Math.max(K.t+.6,K.at('observation minutes',.05)),2.2,2);
    const tc=cell(today,1),sp=tc&&tc.querySelector('.ddw-v');const tl=Math.max(K.t+2.2,K.at('arrived late',.55)-.2);
    if(sp){const f=sub(sp,{o:1});f.tr.move(tl+.3,tl+.6,{o:0});const mk=write(wrel(tc),'300',tl+.7,tl+1.1,'#b8322a');draw(PS,mk,.7);note(wrel(tc),'Arrived at 9:00',tl+1.1,K.t+K.d+.2);penAway(PS,tl+1.5);}
    return Math.max(K.d,tl+2-K.t);};
  /* blank and zero: a cell left blank before the skill was taught, a zero measured */
  SC.blankzero=K=>{let blank=null,zero=null,br=0;
    for(let i=0;i<body.length&&(!blank||!zero);i++){colOf.forEach(c=>{for(let j=0;j<Math.min(c.n,2);j++){const td=cell(body[i],c.i+j);if(!td||td.classList.contains('calc'))continue;const v=(td.querySelector('.ddw-v')||td).textContent.trim();
      if(!blank&&v===''){blank=td;br=i;}if(!zero&&v==='0'&&(!blank||Math.abs(i-br)<4))zero=td;}});}
    const rb=wrel(blank),rz=wrel(zero);camTo(K.t+.1,K.t+1,uni([rb,rz,rowsBox(br,Math.min(body.length,br+3))]));
    const tb=Math.max(K.t+1,K.at('blank',.1)-.1),tz=Math.max(tb+1.4,K.at('write a zero',.4)-.1);
    if(rb){glow(rb,tb,K.t+K.d-tb,3);note(rb,'Blank: not measured',tb+.3,K.t+K.d-.3,'below');}if(rz){glow(rz,tz,K.t+K.d-tz,3);note(rz,'0: measured, none',tz+.3,K.t+K.d-.3);}return K.d;};
  /* episodes: the day's log of a behavior measured by duration */
  const durB=colOf.find(c=>c.b.measure==='duration'&&body.some((r,i)=>S.rows[i]&&episodesOf(S.rows[i],c.b).length));
  SC.episodes=K=>{if(!durB)return K.d;const i=body.findIndex((r,k)=>S.rows[k]&&episodesOf(S.rows[k],durB.b).length);const td=cell(body[i],durB.i);const r=wrel(td);
    camTo(K.t+.1,K.t+1,uni([r,R.names[colOf.indexOf(durB)],rowsBox(i,Math.min(body.length,i+2))]));glow(r,K.t+1,2.4,3);
    const eps=episodesOf(S.rows[i],durB.b),st=episodeStats(S.rows[i],durB.b);
    const card=mkFx('smw-card ddw-epcard','<h4>'+esc(durB.b.name||'')+' · '+esc(shortDay(S.rows[i].date))+'</h4>'+eps.slice(0,5).map((e,k)=>'<div class="ep" data-k="'+k+'"><span>'+esc((e.start?(typeof hm12==='function'?hm12(e.start):e.start):'')+(e.end?' to '+(typeof hm12==='function'?hm12(e.end):e.end):''))+'</span><b>'+esc(e.dur||minSec(epMinutes(e)))+'</b></div>').join('')+'<div class="tot"><span>Day total</span><b>'+esc(minSec(st&&st.total))+' ('+esc(String(Math.round((st&&st.total||0)*100)/100))+' min)</b></div>',{x:780,y:90,w:440},{dx:30});
    const t0=Math.max(K.t+1.6,K.at('each episode',.3)-.3);card.tr.move(t0,t0+.5,{o:1,dx:0},0,easeOut);
    [...card.el.querySelectorAll('.ep')].forEach((e,k)=>{const f=sub(e,{o:0});f.tr.move(t0+.5+k*.45,t0+.8+k*.45,{o:1});});
    const tt=card.el.querySelector('.tot');if(tt){const f=sub(tt,{o:0});f.tr.move(Math.max(t0+2,K.at('adds them up',.8)-.2),Math.max(t0+2.3,K.at('adds them up',.8)+.1),{o:1});}
    card.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});return K.d+.4;};
  /* a skill: correct out of the chances, the percent worked out */
  const twB=colOf.find(c=>two(c.b));
  SC.percent=K=>{if(!twB)return K.d;let i=body.findIndex(r=>{const td=cell(r,twB.i);return td&&(td.querySelector('.ddw-v')||td).textContent.trim()!=='';});if(i<0)i=0;
    const a=wrel(cell(body[i],twB.i)),o=wrel(cell(body[i],twB.i+1)),p=wrel(cell(body[i],twB.i+2));camTo(K.t+.1,K.t+1,uni([a,o,p,R.names[colOf.indexOf(twB)],rowsBox(i,Math.min(body.length,i+2))]));
    glow(a,Math.max(K.t+1,K.at('correct',.3)-.1),1.8,2);glow(o,Math.max(K.t+1.6,K.at('chances',.55)-.1),1.8,2);const tp=Math.max(K.t+2.4,K.at('percent',.85)-.2);glow(p,tp,K.t+K.d-tp,3);note(p,'worked out for you',tp+.2,K.t+K.d-.2);return K.d;};
  /* changes: the first day of a new plan, and an event inside one */
  const fullTr=body.find(r=>r.classList.contains('phase-full')),condTr=body.find(r=>r.classList.contains('phase-cond'));
  const changeScene=(tr,ph1,ph2,lbl)=>K=>{if(!tr)return K.d;const i=body.indexOf(tr);camTo(K.t+.1,K.t+1,rowsBox(Math.max(0,i-1),Math.min(body.length,i+2)));
    const tg=Math.max(K.t+1,K.at(ph1,.2)-.2);glow(wrel(tr),tg,K.t+K.d-tg,2);const ph=[...tr.cells].find(td=>td.classList.contains('col-phase')),lb=[...tr.cells].find(td=>td.classList.contains('col-label'));
    if(ph)glow(wrel(ph),Math.max(tg+.6,K.at(ph2,.5)-.2),1.8,3);if(lb)note(wrel(lb),lbl,Math.max(tg+1.2,K.at(ph2,.7)),K.t+K.d-.2,'below');return K.d;};
  SC.phase=changeScene(fullTr,'full phase change','name the new condition','The new condition');
  SC.cond=changeScene(condTr,'conditional change','dashed line','Inside the phase');
  /* the graph: the camera travels down to it; each day's point lights in turn, then the phase line and the conditions */
  const gsvg=rep&&rep.querySelector('svg.graph'),gq=s=>rep?[...rep.querySelectorAll(s)]:[];
  SC.graph=K=>{if(!gsvg)return K.d;const gr=wrel(gsvg.closest('.chartbox')||gsvg);cam.move(K.t,K.t+1.8,view(gr),0,ease);
    const pts=[...gsvg.querySelectorAll('circle')].map(wrel).filter(Boolean).sort((a,b)=>a.x-b.x);const tp=Math.max(K.t+2,K.at('every point',.3)-.2);
    pts.forEach((r,i)=>{const g=mkFx('ddw-dot','',{x:r.x+r.w/2-11,y:r.y+r.h/2-11,w:22,h:22},null,world);g.tr.move(tp+i*.12,tp+i*.12+.2,{o:1});g.tr.move(tp+i*.12+.9,tp+i*.12+1.3,{o:0});});
    const fl=gsvg.querySelector('line.dd-full');const tl=Math.max(tp+pts.length*.12+.4,K.at('solid line',.55)-.2);if(fl)glow(wrel(fl),tl,2,8);
    const labels=[...gsvg.querySelectorAll('text')].filter(t=>/^[A-Za-z]/.test(t.textContent.trim())&&t.getBBox&&t.getAttribute('font-weight')!==null).map(wrel);
    const tc=Math.max(tl+1,K.at('own level',.85)-.3);gq('svg.graph text').filter(t=>{const s=t.textContent.trim();return S.rows.some(r=>r.phaseType==='full'&&r.phaseLabel&&r.phaseLabel.replace(/\|/g,' ').trim()===s)||s==='Baseline';}).map(wrel).forEach((r,i)=>glow(r,tc+i*.4,1.8,6));
    return K.d;};
  SC.analysis=K=>{if(!rep)return K.d;const tb=rep.querySelector('table'),mg=rep.querySelector('.metric-grid');const tt=wrel(tb),mm=wrel(mg);
    camTo(K.t+.1,K.t+1.3,mm?uni([mm]):tt);const ms=[...(mg?mg.querySelectorAll('.metric'):[])];const find=re=>ms.find(m=>re.test((m.querySelector('.k')||m).textContent));
    [[find(/^Mean level/i),'level changed',.18],[find(/^Trend change/i),'trend',.35],[find(/^Variability/i),'data vary',.52],[find(/Overlap/i),'overlap',.66]].forEach(([m,ph,fr])=>{if(m)glow(wrel(m),Math.max(K.t+1.4,K.at(ph,fr)-.2),2.2,3);});
    const nar=rep.querySelector('.narrative');const tn=Math.max(K.t+5,K.at('reads the graph',.85)-.3);if(nar){camTo(tn,tn+1.1,uni([wrel(nar),mm]));glow(wrel(nar),tn+1,1.8,4);}return K.d;};
  /* for the team: four habits, each lit as it is read */
  SC.adults=K=>{const tips=[['Record the same way every day','the same definitions, the same window'],['Keep blank and zero apart','blank: not measured · 0: none'],['Mark changes on the day','a new plan, a medication change'],['Save the file','to the student’s folder']];
    const veil=mkFx('smw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t,K.t+.5,{o:.45});veil.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});
    const card=mkFx('smw-card smw-tips','<h3>For the team</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong> '+esc(x[1])+'</p></div>').join(''),{x:270,y:60,w:740},{dy:16});
    card.tr.move(K.t+.3,K.t+.9,{o:1,dy:0},0,easeOut);const rows=[...card.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));
    const at=[['same way',.3],['blank and zero',.5],['mark changes',.68],['save the file',.86]].map((a,i)=>Math.max(K.t+1+i*.5,K.at(a[0],a[1])-.2));
    rows.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});card.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});return K.d+.4;};
  SC.outro=K=>{cam.move(K.t,K.t+1.2,HOME);const words=['One row a day','The same way','Every day'];
    const box=mkFx('smw-words',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:90,y:250,w:1100},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['one row',.05],['same way',.2],['every day',.35]].map((a,i)=>Math.max(K.t+.4+i*.45,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));
    const veil=mkFx('smw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t+.2,K.t+.8,{o:.55});return K.d+.6;};

  /* ---- the timeline: the lines this form's data can show ---- */
  const ids=['intro'];
  if(obs.length&&tbl){ids.push('types','defs','units');if(body.length)ids.push('day','obsmin','blankzero');if(durB)ids.push('episodes');if(twB)ids.push('percent');if(fullTr)ids.push('phase');if(condTr)ids.push('cond');if(gsvg)ids.push('graph','analysis');ids.push('adults');}
  if(!R.defs){const k=ids.indexOf('defs');if(k>=0)ids.splice(k,1);}
  ids.push('outro');
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||'sheet',chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  cam.move(T-1.2,T-.2,HOME);
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,paper:world,inner,fxs,marks,pens,cap,notes};
}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,text.indexOf(p.slice(0,12),cur));cur=i+1;return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  const c=B.cam.at(v);css(B.paper,'transform','translate('+f2(c.x)+'px,'+f2(c.y)+'px) scale('+c.s.toFixed(4)+')');
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');
    const keepX=fx.el.classList.contains('ddw-note');const tr=(keepX?'translateX(-50%) ':'')+(s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'');css(fx.el,'transform',tr.trim()||'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  for(const mk of B.marks){const u=clamp((v-mk.t0)/Math.max(.01,mk.t1-mk.t0),0,1);css(mk.el,'opacity',f2(u));css(mk.el,'visibility',u>0?'visible':'hidden');css(mk.el,'clipPath','inset(0 '+f2(100*(1-u))+'% 0 0)');}
  for(const p of B.pens){let s=p.tr.at(v),x=s.x,y=s.y;
    for(const d of p.draws)if(v>=d.t0&&v<=d.t1){const P=d.pt(d,(v-d.t0)/Math.max(.01,d.t1-d.t0),v);x=P.x;y=P.y;break;}
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001?'visible':'hidden');css(p.el,'transform','translate('+f2(x)+'px,'+f2(y-13)+'px) rotate('+f2(s.a)+'deg)');}
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
/*@@PLAYER@@*/
/* ---------------- the view: DD-1's tabs; leaving the Walkthrough pauses it, entering it builds it from the form as it is ---------------- */
const showTab0=showTab;
showTab=function(name){if(name!=='walk'&&(want||playing))pause();
  showTab0(name);
  if(name==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();reveal();}
  else if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);};
let building=false;
if(typeof renderAll==='function'){const renderAll0=renderAll;
  renderAll=function(){const r=renderAll0.apply(this,arguments);if(building)return r;if(B)B.dirty=true;
    if(document.body.classList.contains('view-walk')){building=true;try{build();fit();ui();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){return [];},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();
