/* ===== walk-script.json: the narration's words (read when the recorded narration is not beside the form) ===== */
window.SP_WALK_SCRIPT=[{"id": "intro", "text": "This is the scatterplot data sheet. It records when a behavior happens across the school day, so the team can see the pattern. Here is how to fill it out."}, {"id": "head", "text": "At the top, write your name as the observer, and the setting. The student, the target behavior, the dates, and the sheet number are printed for you."}, {"id": "defs", "text": "Below that is the definition of the behavior, with an example and a non-example. Read it before you start. Only what fits the definition is marked."}, {"id": "grid", "text": "The grid is the school day. Each row is one interval of time, with the activity printed beside it. Each column is one day. Write the date at the top of each day's column."}, {"id": "low", "text": "At the end of each interval, mark its cell. If the behavior happened once, draw a slash through the cell."}, {"id": "high", "text": "If it happened two or more times, shade the whole cell. The cutoff is printed in the legend at the bottom of your sheet; use the number printed there."}, {"id": "blank", "text": "If you watched the interval and the behavior did not happen, leave the cell blank. A blank means you watched, and there was none."}, {"id": "count", "text": "At the end of each interval, write the number of times the behavior happened in its cell. Leave the cell blank when you watched and there was none. The legend at the bottom tells the team which numbers count as high rate; you only write the number."}, {"id": "mark", "text": "At the end of each interval, mark its cell. If the behavior happened in that interval, once or many times, shade the whole cell. There is no slash on this sheet; a cell is either blank or shaded."}, {"id": "blank1", "text": "If you watched the interval and the behavior did not happen, leave the cell blank. A blank means you watched, and there was none. The legend at the bottom of your sheet shows both marks."}, {"id": "x", "text": "If you did not observe the student during an interval, because they were pulled out, at lunch in another room, or absent, write an X in that cell. For a whole day, write an X at the top of the day's column. An X is left out of every count."}, {"id": "codes", "text": "If your sheet has a code key, write the code letter in the marked cell. If the activity in an interval was not the one printed, write what it was."}, {"id": "daily", "text": "At the end of each day, initial that day's line on the back of the sheet, and note anything unusual, like a fire drill or a substitute. The totals at the bottom are for the behavior analyst; you can leave them."}, {"id": "sample", "text": "A sheet marked SAMPLE may be attached. It shows what a filled-in sheet looks like. It is not the student's data: do not count it, and do not copy from it. Mark the blank sheet."}, {"id": "outro", "text": "Return the sheet to the behavior analyst at the end of the week. Thank you for marking it carefully."}];
/* (v24.00) Form SP-1, the Walkthrough view: a narrated walkthrough of the paper scatterplot data sheet for the staff who
   mark it, played like a video. The worked example is a simulated student (nothing from this record is in it): the sheet is
   put into the form, drawn as the Data sheet draws it, copied as the paper prints, and the record put back in the same turn.
   The example follows this record's marking setup (slash and shade, shade only, or counts), so it teaches the sheet the
   staff will be handed. Laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as a
   pure function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form)
   draw the same frames. The player (clock, narration, controls, full screen) is Form TK-1's (tools/forms/TK-1/walk.js), as
   SM-1 carries it (tools/forms/SP-1/walk.js is assembled from tools/forms/SM-1/walk.js by the release's build); the
   narration is walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as
   nbh-sp1-narration.js. Without it the captions are timed from their word counts and the device's voice reads them. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
window.NBH_WALK_INFO={file:'Scatterplot walkthrough',from:'from this form: the worked example (a simulated student), the sheet as it prints, in this record\u2019s marking setup',what:'form',
  priv:'The video shows the form\u2019s worked example (a simulated student) only; nothing from this student\u2019s record is in it, so it can be shared with the staff who mark the sheet.'};
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'sheet',head:'sheet',defs:'sheet',grid:'sheet',low:'mark',high:'mark',blank:'mark',count:'mark',mark:'mark',blank1:'mark',x:'mark',codes:'more',daily:'more',sample:'end',outro:'end'};
const CHAPS=[['sheet','The sheet'],['mark','Marking'],['more','Codes and notes'],['end','Sample and return']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.SP_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const easeIn=u=>u*u;
const bump=(t,t0,d)=>{const u=(t-t0)/d;return u<=0||u>=1?0:Math.sin(Math.PI*u);};
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
function tog(el,c,on){const k='_wkC'+c;if(el[k]!==on){el[k]=on;el.classList.toggle(c,on);}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
/* where each word starts in its recording (seconds from the start of the clip, by the character it starts at), taken from the
   voice's own phoneme lengths for that very clip (a mark at every word, at its audible start); a line whose text has changed since
   falls back to its share of the characters. Made by a script outside the repo; keyed by a hash of the text. */
const MK={};   /* SP-1: no measured word marks; a line's words are placed by their share of its characters */
const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16);};
/* the time (s into the clip) the voice reaches character i: the measured marks, joined by straight lines */
function onsetFn(id,text,d){const m=MK[id];const pts=[[0,.05]];
  if(m&&m.h===hash(text))m.o.forEach(p=>{if(p[0]>0&&p[0]<text.length&&p[1]>pts[pts.length-1][1])pts.push(p);});
  pts.push([text.length,Math.max(pts[pts.length-1][1]+.1,d-.15)]);pts.sort((a,b)=>a[0]-b[0]);
  return i=>{if(i<=0)return pts[0][1];for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k];if(i<=b[0])return a[1]+(b[1]-a[1])*(i-a[0])/Math.max(1,b[0]-a[0]);}return pts[pts.length-1][1];};}
function present(id){const L=audioLines();return L?!!L[id]:id in FB;}

/* ---------------- keyframe tracks: numeric states eased in and out, moves along a gentle arc ---------------- */
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
/* discrete steps (which page a card is on, a hand's pose) */
function Steps(v){this.k=[{t:-1e9,v}];}
Steps.prototype.set=function(t,v){const L=this.k[this.k.length-1];this.k.push({t:Math.max(t,L.t),v});return this;};
Steps.prototype.at=function(t){const k=this.k;let lo=0,hi=k.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1;}return{v:k[lo].v,since:t-k[lo].t,prev:lo>0?k[lo-1].v:k[lo].v};};


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
  const restore=tempShow(D.sec);
  try{fit();B=compose(D);}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

const CREDIT_WALK='Created by Joshua Newsome, BCBA';
/* ---------------- the worked example: a simulated student, the sheet as it prints ----------------
   The example follows this record's marking setup (slash and shade, shade only, or counts), so the walkthrough teaches the
   sheet the staff will be handed; everything else about it is fixed. It is put into the form, drawn, copied, and taken
   out again in one turn: the record is exactly as it was. */
function demoState(){const one=+state.cfg.levels===1,count=state.cfg.mode==='count';
  const meta={client:'A. Student (sample)',observer:'',setting:'Room 12',sheet:'',behavior:'Aggression',
    definition:'Hits, kicks, or pushes another person with enough force to be felt.',
    example:'Slaps a peer on the arm; kicks the teacher’s leg under the table.',nonexample:'Bumping into someone in line; a high-five.',
    threshold:'2',week:'October 19, 2026 – October 23, 2026',date0:'2026-10-19',date1:'2026-10-20',date2:'2026-10-21',date3:'2026-10-22',date4:'2026-10-23',photo:DEMO_PHOTO,photoOn:'1'};
  const cfg={startMin:7*60+30,spanH:8,interval:30,days:5,dayStart:1,mode:count?'count':'tap',codes:true,threshold:2,perSheet:10,levels:one?1:2,actOn:true,guide:true,video:'',
    activity:['Arrival','Morning meeting','Independent math','Independent math','Specials','Specials','Lunch','Recess','Transition back','Writing','Group reading','Centers','Science','Snack','Pack up','Dismissal']};
  const cells={};
  return {meta,cfg,codes:[{k:'A',d:'Demand / work given'},{k:'B',d:'Transition'},{k:'C',d:'Attention to others'},{k:'D',d:'Alone, low attention'}],cells,behaviors:[{meta:Object.assign({},meta),cells}],cur:0};}
/* the worked example's photo slot: a drawn placeholder (a plain silhouette), so the sheet shows where a student's photo goes */
const DEMO_PHOTO='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe8ea"/><circle cx="50" cy="38" r="17" fill="#8aa0a8"/><path d="M18 92c3-20 16-30 32-30s29 10 32 30z" fill="#8aa0a8"/></svg>');
let composing=false;
function demoPages(){
  const keep={meta:state.meta,cfg:state.cfg,codes:state.codes,cells:state.cells,behaviors:state.behaviors,cur:state.cur};
  const ioa=spIOA;if(ioa)spIoaSet(false);
  let sheet=null,guide=null;composing=true;
  try{Object.assign(state,demoState());renderMeta();if(typeof renderCodes==='function')renderCodes();render();
    sheet=staticClone($('#sheet'));guide=spGuide();}
  finally{Object.assign(state,keep);renderMeta();if(typeof renderCodes==='function')renderCodes();render();if(ioa)spIoaSet(true);composing=false;}
  return {sheet,guide};}
const stateKey=()=>(+state.cfg.levels===1?1:2)+'|'+(state.cfg.mode==='count'?'count':'tap');
/* a rect in the paper's own space: from the layout offsets up to the page (v24.02: not from the screen rectangles, which the
   form's Fit zoom and the stage's scale distort on an iPad), plus the page's offset from the paper's left */
function prelOf(el,P){if(!el||!P)return null;let x=0,y=0,n=el;while(n&&n!==P){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}
  if(n!==P)return null;return{x:x+P.offsetLeft,y,w:el.offsetWidth,h:el.offsetHeight};}
function boxTo(e,r,p){e.style.left=f2(r.x-p)+'px';e.style.top=f2(r.y-p)+'px';e.style.width=f2(r.w+2*p)+'px';e.style.height=f2(r.h+2*p)+'px';}
let RO=null;

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lpaper=layer('spw-cam'),Lfx=layer('spw-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!audioLines())notes.push('The recorded narration (nbh-sp1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  const one=+state.cfg.levels===1,count=state.cfg.mode==='count';
  const pg=demoPages();
  const paper=div('spw-paper');Lpaper.appendChild(paper);
  const PW=816,GAP=70;
  const page=(el,x)=>{const w=div('spw-pg');w.style.left=x+'px';if(el){el.removeAttribute('id');el.querySelectorAll('button,.noprint,select,input,#codeTable').forEach(e=>e.remove());w.appendChild(el);}paper.appendChild(w);return w;};
  const P1=page(pg.sheet,0),P2=page(pg.guide,PW+GAP);
  const PH=Math.max(300,(P1.firstElementChild&&P1.firstElementChild.offsetHeight)||P1.offsetHeight);
  const prel=(el,P)=>prelOf(el,P||P1);
  /* v24.03 a glow remembers what it points at: when a page's size changes after the build (a font arriving, a line wrapping),
     every glow is placed again from the sheet's layout (B.relayout, read by renderAt) */
  const glows=[];
  try{if(RO)RO.disconnect();RO=new ResizeObserver(()=>{if(B)B.relayout=true;});RO.observe(P1);RO.observe(P2);}catch(e){}
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  const q=(s,P)=>(P||P1).querySelector(s),qa=(s,P)=>[...(P||P1).querySelectorAll(s)];
  const byText=(sel,text,up,P)=>{const e=qa(sel,P).find(x=>x.textContent.trim().startsWith(text));return e?(up?e.closest(up):e):null;};
  /* the camera: the whole sheet, or a part of it brought close */
  const s0=Math.min(1200/PW,610/PH),HOME={x:(SW-PW*s0)/2,y:Math.max(12,(SH-100-PH*s0)/2+6),s:s0};
  const cam=new Track(HOME);
  const view=(r,zoom)=>{if(!r)return HOME;const s=clamp(Math.min(1180/r.w,500/r.h),s0,zoom||1.6);return{x:SW/2-(r.x+r.w/2)*s,y:300-(r.y+r.h/2)*s,s};};
  const camTo=(t0,t1,r,zoom)=>cam.move(t0,t1,view(r,zoom));
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  /* a glow on the paper (it moves with the camera) */
  const glow=(r,t0,dur,pad,el,P)=>{if(!r)return;const p=pad||5;const g=mkFx('wk-glow spw-glow','',{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p},null,paper);pulse(g,t0,dur);if(el)glows.push({fx:g,el,P:P||P1,pad:p});return g;};
  /* a glow on an element of the sheet (placed again when the page's layout changes) */
  const glowEl=(el,t0,dur,pad,P)=>glow(prel(el,P),t0,dur,pad,el,P);
  /* the marks: a cell of the grid changes at a moment (set as attributes and a class, so Save as video's painter sees it) */
  const marks=[];
  const rows=qa('table.scatter tbody tr'),ths=qa('table.scatter thead tr:first-child th');
  const tdAt=(r,c)=>{const tr=rows[r];return tr?tr.querySelectorAll('td.mark')[c]||null:null;};
  const setCell=(td,st,text)=>{if(!td)return;const cell=td.querySelector('.cell'),cnt=td.querySelector('.count'),gl=td.querySelector('.glyph');
    if(cell){cell.setAttribute('data-state',st);cell.classList.toggle('spw-set',st!=='0');if(gl)gl.textContent=text!=null?text:(st==='x'?'X':'');}
    else{td.classList.remove('lvl1','lvl2','lvlx');if(st!=='0')td.classList.add(st==='x'?'lvlx':'lvl'+st);if(cnt)cnt.textContent=text!=null?text:(st==='x'?'X':'');}};
  const mark=(t,td,st,text)=>{if(!td)return;setCell(td,'0','');marks.push({t,on:false,apply(on){if(on===this.on)return;this.on=on;setCell(td,on?st:'0',on?text:'');}});};
  const absent=(t,ci)=>{const th=ths[ci+2],col=rows.map(tr=>tr.querySelectorAll('td.mark')[ci]).filter(Boolean);
    marks.push({t,on:false,apply(on){if(on===this.on)return;this.on=on;if(th)th.classList.toggle('sp-absent',on);col.forEach(td=>setCell(td,on?'x':'0',''));}});};
  /* the parts of the sheet the scenes point at */
  const E={photo:q('.sp-photo'),observer:byText('.ident .f label','Observer','.f'),setting:byText('.ident .f label','Setting','.f'),client:byText('.ident .f label','Client','.f'),behavior:byText('.ident .f label','Target','.f'),dates:byText('.ident .f label','Dates','.f'),
    defs:q('.defs'),def:byText('.defs .dlab','Operational','.drow'),ex:byText('.defs .dlab','Example','.drow'),nonex:byText('.defs .dlab','Non-example','.drow')};
  const R={head:prel(q('.nbh-print-head')),photo:prel(q('.sp-photo')),band:prel(q('.bar')),ident:prel(q('.ident')),
    observer:prel(byText('.ident .f label','Observer','.f')),setting:prel(byText('.ident .f label','Setting','.f')),sheetno:prel(byText('.ident .f label','Sheet no','.f')),
    client:prel(byText('.ident .f label','Client','.f')),behavior:prel(byText('.ident .f label','Target','.f')),dates:prel(byText('.ident .f label','Dates','.f')),
    defs:prel(q('.defs')),def:prel(byText('.defs .dlab','Operational','.drow')||byText('.defs .dlab','Operational',null)),
    ex:prel(byText('.defs .dlab','Example','.drow')||byText('.defs .dlab','Example',null)),nonex:prel(byText('.defs .dlab','Non-example','.drow')||byText('.defs .dlab','Non-example',null)),
    table:prel(q('table.scatter')),row3:prel(rows[2]),thThu:prel(ths[5]),dateline:uni(qa('table.scatter td.dateline').map(e=>prel(e))),
    legend:prel(q('.legend')),lgBlank:prel(byText('.legend .lgrow span','Blank','.lgrow')),lgSlash:prel(q('.legend .lgrow.lg-slash')),lgShaded:prel(byText('.legend .lgrow span','Shaded','.lgrow')),lgX:prel(byText('.legend .lgrow span','X','.lgrow')),
    codes:prel(q('.codes')),codekey:prel(q('.codekey')),act3:prel(rows[3]&&rows[3].querySelector('td.act')),
    tfoot:prel(q('table.scatter tfoot')),ginit:prel(q('.sp-ginit',P2),P2),gpage:prel(q('.sheet',P2)||P2,P2)};
  const cellsR=(r0,r1)=>uni([prel(tdAt(r0,0)),prel(tdAt(r1,4))]);
  const colR=ci=>{const th=prel(ths[ci+2]);if(!th||!R.table)return null;return{x:th.x,y:th.y,w:th.w,h:R.table.y+R.table.h-th.y};};
  const SC={};
  SC.intro=K=>{cam.set(K.t,HOME);glowEl(q('.bar'),K.at('scatterplot',.05),2.4,8);return K.d;};
  SC.head=K=>{camTo(K.t,K.t+.9,uni([R.head,R.ident]),1.3);glowEl(E.observer,K.at('observer',.12),3);glowEl(E.setting,K.at('setting',.3),3);
    const t=K.at('student',.5);glowEl(E.photo,t-.1,4.6);glowEl(E.client,t,4.5);glowEl(E.behavior,t+.3,4.2);glowEl(E.dates,t+.6,3.9);glowEl(q('.bar'),K.at('sheet number',.8),2.6,8);return K.d;};
  SC.defs=K=>{camTo(K.t,K.t+.9,R.defs,1.3);glowEl(E.def||E.defs,K.at('definition',.1),3.2);glowEl(E.ex,K.at('example',.3),2.6);glowEl(E.nonex,K.at('non-example',.45),2.6);glowEl(E.defs,K.at('read it',.6),3);return K.d;};
  SC.grid=K=>{camTo(K.t,K.t+.9,R.table,1.1);glowEl(rows[2],K.at('each row',.2),3.4);glow(colR(1),K.at('each column',.55),3);glow(R.dateline,K.at('write the date',.75),3.2);return K.d;};
  SC.low=K=>{camTo(K.t,K.t+.9,cellsR(0,7),1.4);const t=K.at('draw a slash',.55);mark(t,tdAt(2,1),'1');glowEl(tdAt(2,1),t-.3,Math.max(2,K.d-(t-K.t)+.2),3);return K.d;};
  SC.high=K=>{const t=K.at('shade',.12);mark(t,tdAt(3,1),'2');glowEl(tdAt(3,1),t-.3,3.2,3);camTo(K.at('legend',.55)-.3,K.at('legend',.55)+.6,R.legend,1.4);glowEl(q('.legend .lgrow.lg-slash'),K.at('legend',.55)+.5,3);glowEl(byText('.legend .lgrow span','Shaded','.lgrow'),K.at('legend',.55)+.8,3);return K.d;};
  SC.blank=K=>{camTo(K.t,K.t+.9,cellsR(0,7),1.4);glowEl(tdAt(2,2),K.at('leave',.2),Math.max(2.5,K.d-1),3);return K.d;};
  SC.count=K=>{camTo(K.t,K.t+.9,cellsR(0,7),1.4);const t=K.at('write the number',.1);mark(t,tdAt(2,1),'1','1');mark(t+.9,tdAt(3,1),'2','3');glowEl(tdAt(2,1),t-.3,2.2,3);glowEl(tdAt(3,1),t+.6,2.2,3);
    glowEl(tdAt(2,2),K.at('leave the cell blank',.4),2.6,3);const tl=K.at('legend',.66);camTo(tl-.3,tl+.6,R.legend,1.4);glowEl(q('.legend'),tl+.5,3.2);return K.d;};
  SC.mark=K=>{camTo(K.t,K.t+.9,cellsR(0,7),1.4);const t=K.at('shade',.3);mark(t,tdAt(2,1),'2');mark(t+.8,tdAt(3,1),'2');glowEl(tdAt(2,1),t-.3,2.4,3);glowEl(tdAt(3,1),t+.5,2.4,3);
    const t2=K.at('no slash',.7);glow(uni([prel(tdAt(2,1)),prel(tdAt(3,1))]),t2,Math.max(2,K.d-(t2-K.t)),4);return K.d;};
  SC.blank1=K=>{glowEl(tdAt(2,2),K.at('leave',.1),3,3);const tl=K.at('legend',.62);camTo(tl-.3,tl+.6,R.legend,1.4);glowEl(byText('.legend .lgrow span','Blank','.lgrow'),tl+.5,3);glowEl(byText('.legend .lgrow span','Shaded','.lgrow'),tl+.8,3);return K.d;};
  SC.x=K=>{camTo(K.t,K.t+.9,uni([prel(ths[2]),cellsR(0,9)]),1.25);const t=K.at('write an x',.42);mark(t,tdAt(6,2),'x');glowEl(tdAt(6,2),t-.3,3,3);
    const t2=K.at('whole day',.6);absent(t2+.5,3);glow(colR(3),t2+.4,3.2,3);glowEl(byText('.legend .lgrow span','X','.lgrow'),K.at('left out',.85),2.5);return K.d;};
  SC.codes=K=>{camTo(K.t,K.t+.9,R.codes,1.4);glowEl(q('.codekey')||q('.codes'),K.at('code key',.08),2.8);const t=K.at('write the code letter',.3);camTo(t-.4,t+.4,cellsR(0,7),1.4);mark(t+.3,tdAt(3,1),count?'2':'2','A');glowEl(tdAt(3,1),t,3,3);
    const t2=K.at('activity',.6);camTo(t2-.3,t2+.5,uni([prel(rows[3]),prel(rows[3])]),1.5);glowEl(rows[3]&&rows[3].querySelector('td.act'),t2+.3,Math.max(2,K.d-(t2-K.t)),3);return K.d;};
  SC.daily=K=>{camTo(K.t,K.t+1,R.ginit||R.gpage,1.2);glowEl(q('.sp-ginit',P2),K.t+.9,4,5,P2);const t=K.at('totals',.62);camTo(t-.4,t+.5,R.tfoot,1.4);glowEl(q('table.scatter tfoot'),t+.4,Math.max(2,K.d-(t-K.t)),3);return K.d;};
  SC.sample=K=>{cam.move(K.t,K.t+.9,HOME);
    const w=mkFx('spw-sampw','<div class="spw-samp">SAMPLE</div>',{x:0,y:PH*.42,w:PW,h:160},null,paper);w.tr.move(K.t+.4,K.t+1,{o:1});w.tr.move(K.t+K.d-.3,K.t+K.d+.3,{o:0});
    const c=mkFx('spw-card spw-sampc','<b>SAMPLE</b>Example marks, to show how the sheet is filled in. Not the student’s data: do not count it or copy it. Mark the blank sheet.',{x:290,y:40,w:700});
    c.tr.move(K.at('attached',.2),K.at('attached',.2)+.5,{o:1});c.tr.move(K.t+K.d-.3,K.t+K.d+.3,{o:0});return K.d+.3;};
  SC.outro=K=>{cam.move(K.t,K.t+1,HOME);const veil=mkFx('spw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t+.2,K.t+.9,{o:.5});
    const c=mkFx('spw-card','<b>Thank you</b>Return the sheet to the behavior analyst at the end of the week.',{x:240,y:200,w:800},{s:.8,dy:12});c.tr.move(K.t+.4,K.t+.9,{o:1,s:1,dy:0},0,easeOut);return K.d+.6;};
  /* ---- the timeline: the lines this record's sheet needs ---- */
  const ids=['intro','head','defs','grid'].concat(count?['count','blank']:one?['mark','blank1']:['low','high','blank'],['x','codes','daily','sample','outro']);
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||'sheet',chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  cam.move(T-1.2,T-.2,HOME);
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,paper,fxs,marks,cap,notes,glows,key:stateKey(),relayout:false};
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
  if(B.relayout){B.relayout=false;for(const g of B.glows){const r=prelOf(g.el,g.P);if(r)boxTo(g.fx.el,r,g.pad);}}
  const c=B.cam.at(v);css(B.paper,'transform','translate('+f2(c.x)+'px,'+f2(c.y)+'px) scale('+c.s.toFixed(4)+')');
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');}
  for(const mk of B.marks)mk.apply(v>=mk.t);
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
/* ---------------- the player: clock, narration, controls ---------------- */
let pos=0,playing=false,want=false,raf=0,soundOn=true,capsOn=true,busy=false,drag=false,msg='';
const AU={ctx:null,gain:null,bufs:{},dec:{},srcs:[],mode:'off',base:0,pos0:0,susp:false,suspPos:0,webFail:false,html:{},cur:'',req:0,spoke:false,wd:null};
function toAB(uri){const b=atob(uri.slice(uri.indexOf(',')+1));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
function ctx(){if(AU.ctx)return AU.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  try{AU.ctx=new C();AU.gain=AU.ctx.createGain();AU.gain.connect(AU.ctx.destination);
    /* the system can take the sound (a call, Siri, an alarm, another app): the clock stops, so the player pauses and says so */
    AU.ctx.addEventListener('statechange',()=>{if(AU.mode==='web'&&playing&&AU.ctx.state!=='running')interrupted();});}
  catch(e){AU.ctx=null;}return AU.ctx;}
/* decode only the lines this build plays (once each); a line a rebuild switches to is decoded then */
function decodeIds(ids){const L=audioLines()||{};const ps=ids.map(id=>{if(AU.bufs[id]||!L[id]||!L[id].a)return null;if(AU.dec[id])return AU.dec[id];
    return AU.dec[id]=new Promise(res=>{let done=false;const fin=b=>{if(done)return;done=true;if(b)AU.bufs[id]=b;else AU.dec[id]=null;res();};
      try{const pr=AU.ctx.decodeAudioData(toAB(L[id].a),fin,()=>fin(null));if(pr&&pr.then)pr.then(fin,()=>fin(null));}catch(e){fin(null);}});}).filter(Boolean);
  return Promise.all(ps).then(()=>{if(ids.some(id=>L[id]&&L[id].a)&&!ids.some(id=>AU.bufs[id]))AU.webFail=true;});}
const needIds=()=>B?B.cues.map(c=>c.id).filter(id=>{const L=audioLines();return L&&L[id]&&L[id].a;}):[];
function mode(){if(!soundOn)return 'off';const L=audioLines();if(L){if(!AU.webFail&&ctx())return 'web';try{if(typeof Audio!=='undefined'&&htmlEl().canPlayType('audio/mpeg'))return 'html';}catch(e){}}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance)return 'speech';return 'off';}
function clock(){if(!playing)return pos;return AU.mode==='web'&&AU.ctx?AU.pos0+(AU.ctx.currentTime-AU.base):AU.pos0+(performance.now()/1000-AU.base);}
function stopAudio(){AU.srcs.forEach(s=>{try{s.stop();}catch(e){}});AU.srcs=[];AU.susp=false;
  if(AU.html.el)try{AU.html.el.pause();}catch(e){}AU.cur='';try{if(window.speechSynthesis&&AU.mode==='speech')speechSynthesis.cancel();}catch(e){}}
/* nothing is sounding: let the audio thread rest (the next Play resumes it inside the tap) */
function idle(){if(AU.ctx&&AU.ctx.state==='running'&&!AU.srcs.length)try{AU.ctx.suspend();}catch(e){}}
function schedule(from){const c=AU.ctx;B.cues.forEach(q=>{const b=AU.bufs[q.id];if(!b||q.start+b.duration<=from)return;const s=c.createBufferSource();s.buffer=b;s.connect(AU.gain);
  try{s.start(AU.base+Math.max(0,q.start-from),Math.max(0,from-q.start));}catch(e){return;}AU.srcs.push(s);});}
/* the fallbacks, driven from the frame loop: one audio element per line, or the device's voice reading the caption */
function tickAudio(t){const q=cueAt(t);const inLine=q&&t<q.start+q.narr;
  if(AU.mode==='html'){const id=inLine?q.id:'';if(id===AU.cur)return;const a=htmlEl();try{a.pause();}catch(e){}AU.cur=id;if(!id)return;
    const L=audioLines();if(!L||!L[id]||!L[id].a)return;const off=Math.max(0,t-q.start);a.src=L[id].a;
    if(off>.3)a.addEventListener('loadedmetadata',function f(){a.removeEventListener('loadedmetadata',f);try{a.currentTime=off;}catch(e){}});
    const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});}
  else if(AU.mode==='speech'){const id=inLine?q.id:'';if(id===AU.cur)return;AU.cur=id;if(!id)return;
    let k=0;q.chunks.forEach((c,i)=>{if(c.t<=t+.001)k=i;});const say=q.chunks.slice(t-q.start>1?k:0).map(c=>c.text).join(' ');
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(say);u.rate=1;u.lang='en-US';speechSynthesis.speak(u);}catch(e){}}}
function htmlEl(){if(!AU.html.el){AU.html.el=new Audio();AU.html.el.preload='auto';}return AU.html.el;}
/* iOS lets an audio element, and the device's voice, start later only once they have been started inside a tap: so the Play tap
   starts both, silently, whichever the narration ends up using */
let SILENT='';
function silentWav(){if(SILENT)return SILENT;const n=400,b=new Uint8Array(44+n*2),v=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i);};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return SILENT='data:audio/wav;base64,'+btoa(s);}
function prime(){try{if(typeof Audio!=='undefined'){const a=htmlEl();if(!a.src&&!AU.html.primed){AU.html.primed=true;a.src=silentWav();const p=a.play();if(p&&p.then)p.then(()=>{try{a.pause();}catch(e){}},()=>{});}}}catch(e){}
  try{if(!AU.spoke&&window.speechSynthesis&&window.SpeechSynthesisUtterance&&(!audioLines()||!ctx())){AU.spoke=true;speechSynthesis.speak(new SpeechSynthesisUtterance(''));}}catch(e){}}
/* the screen stays on while the walkthrough plays (it runs for minutes with no touch) */
let WL=null;
function wake(on){try{if(on&&!WL&&navigator.wakeLock&&document.visibilityState==='visible'){navigator.wakeLock.request('screen').then(w=>{if(!want){w.release().catch(()=>{});return;}WL=w;w.addEventListener('release',()=>{if(WL===w)WL=null;});},()=>{});}
  else if(!on&&WL){const w=WL;WL=null;w.release().catch(()=>{});}}catch(e){}}
/* inside the workstation, opening another form only hides this form's frame (no visibilitychange): look for that while playing */
let WT=0,ioHidden=false;
function frameHidden(){try{const fe=window.frameElement;if(fe&&(fe.hidden||!fe.getClientRects().length))return true;}catch(e){}return ioHidden;}
function watch(on){clearInterval(WT);WT=0;if(on)WT=setInterval(()=>{if(want&&frameHidden())pause();},500);}
function setMsg(m){msg=m||'';const D=dom();if(D&&D.msg){txt(D.msg,msg);D.msg.hidden=!msg;}}
function play(){if(!B||B.dirty)build();if(!B||want)return;want=true;setMsg('');if(pos>=B.D-.05){pos=0;stopAudio();}
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  wake(true);prime();
  if(mode()==='web'){const c=AU.ctx;try{const r=c.resume();if(r&&r.catch)r.catch(()=>{});}catch(e){}
    try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}
    const ids=needIds();if(ids.some(id=>!AU.bufs[id])&&!AU.webFail){busy=true;ui();const tok=++AU.req;
      decodeIds(ids).then(()=>{if(tok!==AU.req)return;busy=false;if(want&&!playing)begin();else ui();});return;}}
  begin();}
function begin(){const m=mode();
  if(m==='web'&&AU.mode==='web'&&AU.susp&&Math.abs(pos-AU.suspPos)<1e-6){AU.susp=false;try{AU.ctx.resume();}catch(e){}playing=true;watch(true);loop();ui();return;}
  stopAudio();AU.mode=m;AU.pos0=pos;playing=true;
  if(m==='web'){try{AU.ctx.resume();}catch(e){}AU.base=AU.ctx.currentTime;schedule(pos);}else{AU.base=performance.now()/1000;idle();}
  if(m==='html'||m==='speech')tickAudio(pos);   /* the first sound starts inside the Play tap (iOS) */
  watch(true);loop();ui();}
/* the frame loop; with the Web Audio clock it also watches that the clock moves (some systems stop it without telling) */
function loop(){cancelAnimationFrame(raf);AU.wd=null;const f=()=>{if(!playing)return;let t=clock();
    if(AU.mode==='web'&&AU.ctx){const now=performance.now(),ct=AU.ctx.currentTime;if(!AU.wd||ct!==AU.wd.ct)AU.wd={ct,at:now};else if(now-AU.wd.at>900){interrupted();return;}}
    if(t>=B.D){pos=B.D;renderAt(pos);stop(false);stopAudio();idle();pos=B.D;ui();return;}
    if(AU.mode==='html'||AU.mode==='speech')tickAudio(t);renderAt(t);uiTime(t);raf=requestAnimationFrame(f);};raf=requestAnimationFrame(f);}
function interrupted(){if(!playing)return;pos=clock();playing=false;want=false;busy=false;cancelAnimationFrame(raf);watch(false);wake(false);
  AU.susp=!!AU.srcs.length;AU.suspPos=pos;renderAt(pos);setMsg('The sound was interrupted. Tap Play to go on.');ui();}
/* stop(hard): pause; a soft pause of the Web Audio narration suspends the context so Play continues it */
function stop(hard){want=false;busy=false;AU.req++;if(playing){pos=clock();playing=false;cancelAnimationFrame(raf);}watch(false);wake(false);
  if(!hard&&AU.mode==='web'&&AU.ctx&&AU.srcs.length){try{AU.ctx.suspend();}catch(e){}AU.susp=true;AU.suspPos=pos;}else stopAudio();}
function pause(){stop(false);if(!AU.susp)idle();if(B)renderAt(pos);ui();}
function seek(t){if(!B)build();if(!B)return;const was=want;stop(true);pos=clamp(+t||0,0,B.D);renderAt(pos);uiTime(pos);if(was&&pos<B.D-.05)play();else{idle();ui();}}
function toggle(){if(want)pause();else play();}

/* ---------------- the controls ---------------- */
const IC={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z" fill="currentColor"/></svg>',
  restart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3.6 4.2l1.9 5.9 5.6-2.6z" fill="currentColor"/></svg>',
  snd:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z" fill="currentColor"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z" fill="currentColor"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  fs:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  fsx:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'};
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function ui(){const D=dom();if(!D)return;const pl=want;
  D.player.classList.toggle('wk-playing',pl);D.player.classList.toggle('wk-busy',busy);
  if(D.play){D.play.innerHTML=busy?'<span class="wk-spin" aria-hidden="true"></span>':pl?IC.pause:IC.play;D.play.setAttribute('aria-label',busy?'Loading the narration':pl?'Pause':'Play');}
  if(D.big){const hadFocus=document.activeElement===D.big;D.big.hidden=pl;D.big.setAttribute('aria-label',B&&pos>=B.D-.05?'Play the walkthrough again':pos>0?'Continue the walkthrough':'Play the walkthrough');
    if(pl&&hadFocus&&D.play)try{D.play.focus({preventScroll:true});}catch(e){}}
  /* toggle buttons keep one name; aria-pressed carries the state */
  if(D.snd){D.snd.innerHTML=(soundOn?IC.snd:IC.mute)+'<span>Sound</span>';D.snd.setAttribute('aria-pressed',String(soundOn));D.snd.setAttribute('aria-label','Sound');}
  if(D.cc){D.cc.setAttribute('aria-pressed',String(capsOn));D.player.classList.toggle('wk-nocap',!capsOn);}
  if(D.fs){const f=isFs();D.fs.innerHTML=(f?IC.fsx:IC.fs)+'<span>'+(f?'Exit full screen':'Full screen')+'</span>';D.fs.setAttribute('aria-label',f?'Exit full screen':'Full screen');}
  lastAria=-1;uiTime(pos);}
let lastSec=-1,lastCh='',lastAria=-1;
/* the seek bar: a slider drawn by the player (not a form field, so watching never counts as an unsaved change in the workstation) */
function seekDraw(t){const D=dom();if(!D||!B||!D.seek)return;const f=B.D?clamp(t/B.D,0,1):0;
  if(D.sfill)css(D.sfill,'transform','scaleX('+f.toFixed(4)+')');if(D.sthumb)css(D.sthumb,'left',(f*100).toFixed(2)+'%');
  /* a screen reader hears the position on a pause or a seek, and at most every ten seconds while it plays */
  const a=want&&!drag?Math.floor(t/10):Math.floor(t);if(a!==lastAria){lastAria=a;D.seek.setAttribute('aria-valuenow',String(Math.round(t)));D.seek.setAttribute('aria-valuetext',mmss(t)+' of '+mmss(B.D));}}
function uiTime(t){const D=dom();if(!D||!B)return;seekDraw(t);
  const s=Math.floor(t);if(s!==lastSec){lastSec=s;txt(D.time,mmss(t)+' / '+mmss(B.D));}
  let ch=B.chapters[0].id;for(const c of B.chapters)if(c.start<=t+.01)ch=c.id;
  if(ch!==lastCh){lastCh=ch;D.chaps.querySelectorAll('button').forEach(b=>{const on=b.dataset.ch===ch;b.setAttribute('aria-current',on?'step':'false');});}}
function uiBuilt(){const D=dom();if(!D||!B)return;D.seek.setAttribute('aria-valuemax',String(Math.round(B.D)));lastSec=-1;lastCh='';lastAria=-1;
  D.chaps.innerHTML=B.chapters.map(c=>'<button type="button" data-ch="'+c.id+'" aria-current="false" aria-label="Chapter: '+esc(c.label)+'">'+esc(c.label)+'</button>').join('');
  if(D.note){D.note.textContent=B.notes.join(' ');D.note.hidden=!B.notes.length;}
  if(D.tx)D.tx.innerHTML=B.chapters.map(ch=>'<h3>'+esc(ch.label)+'</h3>'+B.cues.filter(c=>c.chapter===ch.id).map(c=>'<p>'+esc(c.text)+'</p>').join('')).join('');}
function isFs(){const D=dom();const e=document.fullscreenElement||document.webkitFullscreenElement;return !!(D&&(e===D.player||D.player.classList.contains('wk-fs')));}
/* the fixed full-screen panel (where element full screen is missing): everything behind it is inert, so Tab stays in the player */
let INERT=[];
function setInert(on){INERT.forEach(e=>{e.inert=false;});INERT=[];if(!on)return;const D=dom();
  for(let n=D.player;n&&n.parentElement&&n!==document.body;n=n.parentElement)for(const sib of n.parentElement.children)if(sib!==n&&!sib.inert&&!/^(SCRIPT|STYLE|LINK)$/.test(sib.tagName)){sib.inert=true;INERT.push(sib);}}
function panel(on){const D=dom();D.player.classList.toggle('wk-fs',on);document.documentElement.classList.toggle('wk-fs-on',on);setInert(on);}
function fullscreen(){const D=dom();if(!D)return;const p=D.player;
  if(isFs()){if(p.classList.contains('wk-fs'))panel(false);else{(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);}setTimeout(()=>{fit();ui();},60);return;}
  const rq=p.requestFullscreen||p.webkitRequestFullscreen;let ok=false;
  if(rq){try{const r=rq.call(p);ok=true;if(r&&r.catch)r.catch(()=>{panel(true);fit();ui();});}catch(e){ok=false;}}
  if(!ok)panel(true);[60,400,1000].forEach(t=>setTimeout(()=>{fit();ui();},t));}
/* the stage is drawn at 1280 x 720 and scaled to the width of the view (in full screen, to fit the screen) by one transform; in full
   screen a small picture moves the captions under it, so the scale is worked out again with the caption band's height */
function fit(){const D=dom();if(!D)return;const f=isFs();let k;
  if(f){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||60,chs=D.chaps.offsetHeight||0;
    /* v21.44 the room is the player's own box: on an iPad a form inside the workstation reports a window as wide as its page,
       not the screen, and the picture came out wider than the screen in full screen */
    const R=fsRoom(D),kk=cap=>Math.max(.1,Math.min(R.w/SW,(R.h-bar-chs-cap-12)/SH));k=kk(0);D.player.classList.toggle('wk-small',k<.5);
    if(k<.5&&capsOn&&D.cap2)k=kk(D.cap2.offsetHeight||0);D.frame.style.width=f2(SW*k)+'px';}
  else{const kw=Math.max(.1,(D.player.clientWidth||SW)/SW);k=kw;let small=k<.5;
    /* a short window (an iPad held sideways, the form inside the workstation): the picture is scaled to the height left below the
       sticky toolbar once its controls are counted too, so it and its controls show together; it is centred and the controls keep the
       player's width. Down to .4 the captions stay on the picture; below that they go under it; below .3 the width rules again
       (the page scrolls, and full screen is the way to see it whole) */
    const h=roomH(D),kh=h/SH;
    if(kh<kw){if(kh>=.4){k=kh;small=false;}
      else{D.player.classList.add('wk-small');const k2=(h-(capsOn&&D.cap2?D.cap2.offsetHeight||0:0))/SH;if(k2>=.3){k=k2;small=true;}}}
    D.frame.style.width=k<kw-.0005?f2(SW*k)+'px':'';css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',small);return;}
  css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',k<.5);}
/* the inside of the player in full screen (its padding is the screen's safe areas), never more than the window */
function fsRoom(D){const p=D.player;let w=p.clientWidth||0,h=p.clientHeight||0;
  try{const cs=getComputedStyle(p);w-=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);h-=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);}catch(e){}
  const vv=window.visualViewport,W=Math.min(window.innerWidth||Infinity,vv&&vv.width||Infinity),H=Math.min(window.innerHeight||Infinity,vv&&vv.height||Infinity);
  return {w:w>0?Math.min(w,W):(isFinite(W)?W:SW),h:h>0?Math.min(h,H):(isFinite(H)?H:SH)};}
/* the height the picture may take outside full screen: the window less the sticky toolbar, the player's controls and its margins */
function stickyH(){const tb=document.querySelector('.toolbar');let th=0;try{if(tb&&/sticky|fixed/.test(getComputedStyle(tb).position))th=tb.offsetHeight;}catch(e){}return th;}
function roomH(D){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||0,chs=D.chaps.offsetHeight||0;return (window.innerHeight||0)-stickyH()-bar-chs-30;}
/* on entering the view: when the player does not fit below the sticky toolbar, scroll it there */
function reveal(){const D=dom();if(!D||isFs())return;const th=stickyH();
  const r=D.player.getBoundingClientRect();if(!r.height||(r.top>=th&&r.bottom<=window.innerHeight))return;window.scrollTo({top:Math.max(0,r.top+window.scrollY-th-8)});}
function wire(){const D=DOM;
  D.play.addEventListener('click',toggle);D.big.addEventListener('click',()=>{play();});
  D.restart.addEventListener('click',()=>{seek(0);if(!want)play();});
  /* the seek bar: drag or tap anywhere on it (touch too); while it is held the frames follow and the sound waits; letting go plays on */
  let resume=false;const posFrom=e=>{const r=D.seek.getBoundingClientRect();return clamp((e.clientX-r.left)/Math.max(1,r.width),0,1)*(B?B.D:0);};
  D.seek.addEventListener('pointerdown',e=>{if(!B||e.button>0)return;e.preventDefault();drag=true;try{D.seek.setPointerCapture(e.pointerId);}catch(x){}try{D.seek.focus({preventScroll:true});}catch(x){}
    if(want){resume=true;stop(true);}pos=posFrom(e);renderAt(pos);ui();});
  D.seek.addEventListener('pointermove',e=>{if(!drag)return;pos=posFrom(e);renderAt(pos);uiTime(pos);});
  const up=()=>{if(!drag)return;drag=false;if(resume){resume=false;if(pos<B.D-.05)play();else ui();}else ui();};
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>D.seek.addEventListener(ev,up));
  D.seek.addEventListener('keydown',e=>{if(!B||e.altKey||e.ctrlKey||e.metaKey)return;const st={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5,PageDown:-30,PageUp:30}[e.key];
    let to=null;if(st!=null)to=clock()+st;else if(e.key==='Home')to=0;else if(e.key==='End')to=B.D;if(to==null)return;e.preventDefault();e.stopPropagation();seek(to);});
  D.cc.addEventListener('click',()=>{capsOn=!capsOn;ui();if(isFs())fit();});
  D.snd.addEventListener('click',()=>{soundOn=!soundOn;if(want){const t=clock();seek(t);}else{stopAudio();AU.mode='off';idle();}ui();});
  D.fs.addEventListener('click',fullscreen);
  D.chaps.addEventListener('click',e=>{const b=e.target.closest('button[data-ch]');if(!b||!B)return;const c=B.chapters.find(x=>x.id===b.dataset.ch);if(c)seek(c.start);});
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{[30,350,900].forEach(t=>setTimeout(()=>{fit();ui();},t));}));
  let lastW=-1;const onSize=()=>{const w=D.player.clientWidth;if(w!==lastW){lastW=w;fit();}};
  if(window.ResizeObserver){new ResizeObserver(onSize).observe(D.player);
    /* the sticky toolbar's height is part of the room the picture fits in (it folds and unfolds, and its rows wrap) */
    const tb=document.querySelector('.toolbar');let lastT=-1;if(tb)new ResizeObserver(()=>{const h=tb.offsetHeight;if(h!==lastT){lastT=h;if(document.body.classList.contains('view-walk')&&!isFs())fit();}}).observe(tb);}
  window.addEventListener('resize',()=>{lastW=-1;onSize();if(isFs())fit();});
  window.addEventListener('orientationchange',()=>setTimeout(fit,200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&want)pause();});
  /* a frame hidden by the workstation reports no intersection and a root of no size (a plain scroll out of view keeps playing) */
  if(window.IntersectionObserver)try{new IntersectionObserver(es=>{const e=es[es.length-1];ioHidden=!e.isIntersecting&&!!e.rootBounds&&(!e.rootBounds.width||!e.rootBounds.height);if(ioHidden&&want)pause();}).observe(D.player);}catch(e){}
  /* Escape closes the full-screen panel first, before the workstation sees it (one key, one thing) */
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&D.player.classList.contains('wk-fs')){e.preventDefault();e.stopPropagation();fullscreen();}},true);
  document.addEventListener('keydown',e=>{if(!document.body.classList.contains('view-walk')||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;const tg=e.target,tn=tg&&tg.tagName;
    if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||tg&&tg.isContentEditable)return;
    if(e.key===' '||e.key==='k'||e.key==='K'){if(e.key===' '&&tg&&tg.closest&&tg.closest('button,summary,a[href],[role="button"],[role="checkbox"],dialog'))return;e.preventDefault();if(e.repeat)return;toggle();}
    else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();seek(clock()+(e.key==='ArrowLeft'?-5:5));}});}

/* ---------------- the view: leaving it pauses, entering it builds from the record's setup ---------------- */
let building=false;
function openWalk(){if(building)return;building=true;try{if(!B||B.dirty||B.key!==stateKey())build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}fit();ui();reveal();}
$('#viewSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(!b)return;
  if(b.dataset.view==='walk')openWalk();else{if(want||playing)pause();if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);}});
/* the record's marking setup can change while the view is open (Tools, Open data, the case): the walkthrough follows it */
{const render0=render;render=function(){const r=render0.apply(this,arguments);if(composing||building)return r;
  try{if(B&&B.key!==stateKey()){B.dirty=true;if(document.body.classList.contains('view-walk'))openWalk();}}catch(e){}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){const L=audioLines()||{};return Object.keys(L).filter(id=>!MK[id]||MK[id].h!==hash(String(L[id].t||'')));},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();
