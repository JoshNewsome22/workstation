/* (v21.45) Form SM-1, the Walkthrough view: a narrated walkthrough of the student's own sheet that plays like a video. It is
   built live from the sheet as the Sheet page draws it (the look, the targets, the day, the rating style, the store, the goal,
   the contract), laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as a pure
   function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form) draw the
   same frames. The player (clock, narration, controls, full screen) is Form TK-1's (tools/forms/TK-1/walk.js), copied here; the
   narration is walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as nbh-sm1-narration.js.
   Without it the captions are timed from their word counts and the device's voice reads them. The lines that play depend on the
   sheet: the rating style chooses its own line, Self & Match adds the matching, the store, the bank, the midday check and the
   contract each add theirs. The sheet itself (S) is never changed. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
window.NBH_WALK_INFO={file:'Self-monitoring sheet walkthrough',from:'from this sheet: its targets, pictures, names and rewards',what:'sheet'};
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'sheet',targets:'sheet',rows:'sheet',rows_iv:'sheet',honest:'rate',match_teacher:'match',match_points:'match',match_bonus:'match',teacher_rates:'match',
  count:'points',goal:'points',midday:'points',store:'rewards',reward_plain:'rewards',bank:'rewards',contract:'contract',
  mm_intro:'model',mm_rate:'model',mm_teacher:'model',mm_match:'model',mm_practice:'model',mm_checks:'model',adults:'adults',outro:'adults'};
const CHAPS=[['sheet','Your sheet'],['rate','Rating'],['match','Matching'],['points','Points'],['rewards','Rewards'],['contract','Contract'],['model','Match the model'],['adults','For the adults']];
/* v21.67 the Match the model chapter plays when the file holds a task with a name or a picture (tools/forms/SM-1/sm-mm.js) */
const MM_IDS=['mm_intro','mm_rate','mm_teacher','mm_match','mm_practice','mm_checks'];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.SM_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
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
const MK={};   /* SM-1: no measured word marks; a line's words are placed by their share of its characters */
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
const HAND='"Bradley Hand","Chalkboard SE","Segoe Print","Comic Sans MS","Comic Neue",cursive';
/* the pencils: a yellow pencil for the student, a blue pen for the adult; drawn along +x, the tip at the left end */
const PENCIL='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L24 4 H130 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H24 Z" fill="#f6c343" stroke="#5a4210" stroke-width="2"/><path d="M2 13 L24 4 V22 Z" fill="#f2d7b0" stroke="#5a4210" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L10 9.8 V16.2 Z" fill="#333"/><rect x="128" y="4" width="16" height="18" rx="4" fill="#ef8fa6" stroke="#5a4210" stroke-width="2"/><rect x="120" y="4" width="8" height="18" fill="#c9ced3" stroke="#5a4210" stroke-width="2"/><path d="M30 9 H118" stroke="#e0a92a" stroke-width="2"/></svg>';
const PEN='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L18 7 H132 a5 5 0 0 1 5 5 v2 a5 5 0 0 1 -5 5 H18 Z" fill="#1f4e8c" stroke="#0e2440" stroke-width="2"/><path d="M2 13 L18 7 V19 Z" fill="#c9ced3" stroke="#0e2440" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L8 10.8 V15.2 Z" fill="#0e2440"/><rect x="96" y="3" width="30" height="5" rx="2" fill="#c9ced3" stroke="#0e2440" stroke-width="1.5"/></svg>';

/* the line each rating style reads */
function rateLine(){const sys=S.sys;if(sys==='rubric')return 'rate_rubric';if(sys==='interval')return 'rate_iv';if(sys==='cico'&&smRateKey()==='auto')return '';
  const k=smRateKey();if(k!=='auto')return ['pics','words'].includes(k)?'rate_any':'rate_'+k;
  if(sys==='contract')return 'rate_check1';if(sys==='smiley')return 'rate_any';return S.chk.pict&&!S.chk.pocket?'rate_faces2':'rate_yn';}

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lpaper=layer('smw-cam'),Lfx=layer('smw-fx'),Lpen=layer('smw-pens');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!S.sys){notes.push('Choose a sheet type on the System page first: the walkthrough is built from the student’s sheet.');}
  if(!audioLines())notes.push('The recorded narration (nbh-sm1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  /* the sheet, drawn as the Sheet page draws it, without its buttons, the reflection boxes and the home note */
  renderSheet();const so=$('#sheetOut');
  const paper=div('smw-paper');const inner=div(so.className,so.innerHTML);inner.id='wkSheet';paper.appendChild(inner);Lpaper.appendChild(paper);
  inner.querySelectorAll('button,.extras,.tear,.sm2-fit').forEach(e=>e.remove());
  if(!S.sys)inner.innerHTML='<p style="font:600 28px var(--bk);padding:60px">Choose a sheet type on the System page, and the student’s sheet appears here.</p>';
  const PW=1000;inner.style.width=PW+'px';
  /* v21.67 the Match the model sheet, a second page to the right of the first (the camera goes to it in its chapter) */
  const MMT=(typeof mmT==='function'&&S.mm&&S.mm.tasks&&S.mm.tasks.length)?mmT():null,mmOn=!!(MMT&&(MMT.task||MMT.lv.some(l=>l.img||l.icon)));
  let mmEl=null;if(mmOn){inner.style.position='relative';mmEl=div('smw-mm',mmSheetHtml(MMT));mmEl.style.cssText='position:absolute;left:1090px;top:0;width:1000px';inner.appendChild(mmEl);paper.style.overflow='visible';}
  const PH=Math.max(200,inner.offsetHeight);
  const prel=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=inner.getBoundingClientRect();const k=c.width/(inner.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const q=s=>inner.querySelector(s),qa=s=>[...inner.querySelectorAll(s)];
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  /* the camera: the whole sheet, or a part of it brought close */
  const s0=Math.min(1220/PW,640/PH),HOME={x:(SW-PW*s0)/2,y:Math.max(14,(SH-90-PH*s0)/2+6),s:s0};
  const cam=new Track(HOME);
  const view=r=>{if(!r)return HOME;const s=clamp(Math.min(1150/r.w,470/r.h),s0,1.75);return{x:SW/2-(r.x+r.w/2)*s,y:300-(r.y+r.h/2)*s,s};};
  const camTo=(t0,t1,r)=>cam.move(t0,t1,view(r));
  const toStage=(t,r)=>{const c=cam.at(t);return{x:c.x+r.x*c.s,y:c.y+r.y*c.s,w:r.w*c.s,h:r.h*c.s};};
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  /* a glow on the paper (it moves with the camera) */
  const glow=(r,t0,dur,pad)=>{if(!r)return;const p=pad||6;const g=mkFx('wk-glow smw-pglow','',{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p},null,inner);pulse(g,t0,dur);};
  /* a pencil mark: a circle round a glyph, a check, a number written in */
  const marks=[];
  const ring=(r,t0,t1,col)=>{if(!r)return null;const pad=4,w=r.w+2*pad,h=r.h+2*pad;const e=div('smw-mark','<svg viewBox="0 0 '+f2(w+6)+' '+f2(h+6)+'" width="'+f2(w+6)+'" height="'+f2(h+6)+'"><ellipse cx="'+f2(w/2+3)+'" cy="'+f2(h/2+3)+'" rx="'+f2(w/2)+'" ry="'+f2(h/2)+'" fill="none" stroke="'+(col||'#2b4a9b')+'" stroke-width="3.2" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100" transform="rotate(-8 '+f2(w/2+3)+' '+f2(h/2+3)+')"/></svg>');
    e.style.left=f2(r.x-pad-3)+'px';e.style.top=f2(r.y-pad-3)+'px';inner.appendChild(e);const m={el:e,path:e.querySelector('ellipse'),t0,t1,kind:'ring',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:w/2,ry:h/2};marks.push(m);return m;};
  const write=(r,text,t0,t1,col,size)=>{if(!r)return null;const e=div('smw-write',esc(text));e.style.left=f2(r.x)+'px';e.style.top=f2(r.y)+'px';e.style.width=f2(r.w)+'px';e.style.height=f2(r.h)+'px';e.style.color=col||'#2b4a9b';e.style.fontFamily=HAND;e.style.fontSize=f2(size||Math.min(28,r.h*.7))+'px';inner.appendChild(e);
    const m={el:e,t0,t1,kind:'write',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:Math.min(r.w,40)/2,ry:6};marks.push(m);return m;};
  /* the pencils: a pencil travels to a mark and draws it (the tip follows the stroke), then rests at the side */
  const pens=[];const mkPen=(svg,rest)=>{const e=div('smw-pen',svg);Lpen.appendChild(e);const p={el:e,tr:new Track({x:rest.x,y:rest.y,o:0,a:-38}),rest,draws:[]};pens.push(p);return p;};
  const PS=mkPen(PENCIL,{x:120,y:760}),PT=mkPen(PEN,{x:1160,y:760});
  const penPt=(mk,u,t)=>{const c=cam.at(t),k=c.s;let x,y;if(mk.kind==='ring'){const a=-Math.PI/2+u*2*Math.PI;x=mk.cx+Math.cos(a)*mk.rx;y=mk.cy+Math.sin(a)*mk.ry;}else{x=mk.cx+mk.rx*(2*u-1);y=mk.cy+Math.sin(u*Math.PI*6)*3;}return{x:c.x+x*k,y:c.y+y*k};};
  const draw=(pen,m,lead)=>{if(!m)return;const a=penPt(m,0,m.t0),b=penPt(m,1,m.t1);pen.tr.set(m.t0-(lead||.6)-.01,{o:1});pen.tr.move(m.t0-(lead||.6),m.t0,{x:a.x,y:a.y},.08);m.pt=penPt;pen.draws.push(m);pen.tr.set(m.t1,{x:b.x,y:b.y});};
  const penAway=(pen,t0)=>{pen.tr.move(t0,t0+.7,{x:pen.rest.x,y:pen.rest.y});pen.tr.set(t0+.7,{o:0});};
  /* the parts of the sheet the scenes point at */
  const m=typeof smModel==='function'&&S.sys?smModel():{raters:['me'],tg:[],rows:[]};
  const disc=!!q('.dc');
  const tbl=disc?q('.dc table'):q('table.v2-t')||qa('table.sm').find(t=>t.querySelector('tbody'))||q('table.sm');
  const body=tbl?[...tbl.querySelectorAll('tbody tr, tr')].filter(r=>!r.classList.contains('tot')&&!r.classList.contains('totals')&&!r.classList.contains('who')&&r.querySelector('td')):[];
  const glyphs=td=>td?[...td.querySelectorAll('.gset > .g, .gset > svg, svg.face, .yn, .sc, .mbox, .gstars .g')]:[];
  const rateCells=tr=>[...tr.querySelectorAll('td')].filter(td=>glyphs(td).length);
  /* per row: the student's cells and the adult's, in target order (the discreet cards: one card row per target and rater) */
  let rowsCells=[];
  if(disc){const meRows=body.filter(r=>!/\((teacher|[^)]*)\)/i.test(r.textContent)||/\(me\)/i.test(r.textContent)).filter(r=>rateCells(r).length),tRows=body.filter(r=>/\(/.test(r.textContent)&&!/\(me\)/i.test(r.textContent)&&rateCells(r).length);
    const nP=meRows[0]?rateCells(meRows[0]).length:0;for(let i=0;i<nP;i++)rowsCells.push({tr:null,me:meRows.map(r=>rateCells(r)[i]),t:tRows.map(r=>rateCells(r)[i]),mc:null,pc:null});}
  else rowsCells=body.map(tr=>{const c=rateCells(tr);const t=c.filter(x=>x.classList.contains('t')),me=c.filter(x=>!x.classList.contains('t'));const tds=[...tr.querySelectorAll('td')];
    return{tr,me,t,mc:tr.querySelector('td.mc')||null,pc:tr.querySelector('td.pc')||tds[tds.length-1]||null};}).filter(r=>r.me.length||r.t.length);
  const R0=rowsCells[0]||{me:[],t:[]};
  const R={head:prel(q('.v2-head')||q('.sm-head')||q('.dch')),targets:uni(qa('thead th.tg, th.q').map(prel))||prel(tbl&&tbl.querySelector('tr')),
    rows:uni(qa('tbody th.c0, td.per').map(prel))||uni(body.map(r=>prel(r.firstElementChild))),
    goal:prel(q('.v2-goal'))||prel(q('.sm-head .sm-line:nth-child(3)'))||prel(q('.v2-meta')),wf:prel(q('.v2-wf .box')),
    tot:prel(q('tr.tot'))||prel(q('tr.totals'))||prel(q('.dcf')),store:prel(q('.v2-store'))||prel(q('.v2-store-list'))||prel(q('.v2-store-line')),
    tiles:qa('.v2-store .tile, .v2-store-list .sl').map(prel),mid:prel(q('.v2-mid')),contract:prel(q('.v2-contract')),key:prel(q('.v2-keyline'))||prel(q('table.key'))||prel(q('.v2-lv')),
    tbl:prel(tbl),row0:uni([...(R0.me||[]),...(R0.t||[])].map(prel).concat(R0.tr?[prel(R0.tr)]:[]))};
  const bin=smRateBin(),lv=smLevels(),k=smRateKey(),stars=k!=='auto'&&SM_RATES[k].count;
  /* which glyph a rating circles: 0 the best, the last one the lowest */
  const gl=(td,j)=>{const g=glyphs(td);if(!g.length)return null;if(stars)return prel(g[0].parentNode);return prel(g[Math.max(0,Math.min(g.length-1,j))]);};
  const nG=td=>Math.max(1,glyphs(td).length);
  const tw=smTeacher();
  /* the story: the student's answers in the first row (yes, yes, not yet), the adult's the same; a few totals written in */
  const meAns=R0.me.map((td,i)=>i===R0.me.length-1&&R0.me.length>1?nG(td)-1:0);
  const hasMatch=m.raters.includes('me')&&m.raters.includes('t')&&R0.t.length>0,teacherOnly=!m.raters.includes('me');
  const ptsOf=(a,b)=>{if(S.sys!=='match')return null;const mm=mp();if(bin){if(a!==b)return mm.yn;return a===0?mm.yy:mm.nn;}const v=(lv&&lv[b]?lv[b][1]:0);return v+(a===b?smBonus():0);};
  const SC={};
  SC.intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(R.head,K.t+.4,2.4);const tw0=Math.max(K.t+2.4,K.at('working for',.8)-.15);if(R.wf)glow(R.wf,tw0,1.8,8);return K.d;};
  SC.targets=K=>{camTo(K.t+.1,K.t+1.1,R.targets&&R.tbl?{x:R.tbl.x,y:R.targets.y-6,w:R.tbl.w,h:R.targets.h+60}:R.targets);const ths=qa('thead th.tg, th.q').map(prel);
    ths.forEach((r,i)=>glow(r,Math.max(K.t+1.2+i*.55,K.at('each goal',.4)-.2+i*.55),1.6));const tp=Math.max(K.t+2.5,K.at('picture',.85)-.2);qa('thead th.tg .tp, th.q svg, th.q img').map(prel).forEach((r,i)=>glow(r,tp+i*.2,1.4,4));return K.d;};
  SC.rows=K=>{camTo(K.t+.1,K.t+1.1,uni([R.rows,R.row0]));const rs=disc?qa('.dc tr:first-child th').map(prel).slice(1):qa('tbody th.c0, td.per').map(prel);rs.slice(0,9).forEach((r,i)=>glow(r,K.t+1.2+i*.32,1.2,3));return K.d;};
  SC.rows_iv=K=>{const t=SC.rows(K);return t;};
  /* the rating: the student's pencil circles each answer in the first row as the line names the choices */
  const rateScene=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));if(R.key)glow(R.key,K.t+.6,2,4);let t=Math.max(K.t+1.6,K.at('circle',.45)-.1);
    if(teacherOnly){return K.d;}
    R0.me.forEach((td,i)=>{const r=gl(td,meAns[i]);const mk=stars?null:ring(r,t,t+.55,'#2b4a9b');if(stars){const g=glyphs(td),n=meAns[i]===0?3:1;g.slice(0,n).forEach((e,j)=>{const x=prel(e);const f=div('smw-fill','');f.style.cssText='left:'+f2(x.x)+'px;top:'+f2(x.y)+'px;width:'+f2(x.w)+'px;height:'+f2(x.h)+'px';inner.appendChild(f);marks.push({el:f,t0:t+j*.25,t1:t+j*.25+.2,kind:'fill',cx:x.x+x.w/2,cy:x.y+x.h/2,rx:x.w/2,ry:x.h/2});});draw(PS,marks[marks.length-1],.6);}
      else draw(PS,mk,i?.45:.7);t+=stars?1:.95;});
    penAway(PS,t+.2);return Math.max(K.d,t+.6-K.t);};
  ['rate_thumbs','rate_faces2','rate_faces3','rate_pm','rate_check','rate_yn','rate_p012','rate_s15','rate_stars3','rate_color3','rate_any','rate_check1','rate_rubric','rate_iv'].forEach(id=>{SC[id]=rateScene;});
  SC.honest=K=>{const last=R0.me[R0.me.length-1];const r=last?gl(last,meAns[R0.me.length-1]):null;if(r)glow(r,Math.max(K.t+.3,K.at('honest',.1)-.1),2.6,8);return K.d;};
  /* the adult rates the same row with a pen, on their own, then the two compare: a check in Same answer, the points written in */
  SC.match_teacher=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));let t=Math.max(K.t+1.2,K.at('rates you too',.3)+.2);
    R0.t.forEach((td,i)=>{const mk=ring(gl(td,meAns[i]),t,t+.55,'#b8322a');draw(PT,mk,i?.45:.8);t+=.9;});penAway(PT,t+.1);
    const tc=Math.max(t+.3,K.at('compare',.85)-.2);R0.me.forEach((td,i)=>{const a=prel(td),b=prel(R0.t[i]);if(a&&b)glow(uni([a,b]),tc+i*.3,1.2,2);});return Math.max(K.d,tc+R0.me.length*.3+1.2-K.t);};
  SC.match_points=SC.match_bonus=K=>{let t=Math.max(K.t+.6,K.at('match',.25)+.1);let sum=0;
    R0.me.forEach((td,i)=>{const p=ptsOf(meAns[i],meAns[i]);sum+=p||0;const a=prel(td),b=prel(R0.t[i]);if(!a||!b)return;const u=uni([a,b]);const bub=mkFx('smw-plus','+'+(p==null?1:p),{x:0,y:0},null,inner);bub.el.style.left=f2(u.x+u.w/2-20)+'px';bub.el.style.top=f2(u.y-6)+'px';
      bub.tr.move(t+i*.6,t+i*.6+.3,{o:1,dy:-10},0,easeOut);bub.tr.move(t+i*.6+1.6,t+i*.6+2,{o:0});});
    const tw1=t+R0.me.length*.6+.3;if(R0.mc){const mk=write(prel(R0.mc),'✓ '+R0.me.length,tw1,tw1+.4,'#2b7a3b');draw(PT,mk,.6);}if(R0.pc){const mk=write(prel(R0.pc),String(sum||''),tw1+.7,tw1+1.1,'#2b4a9b');draw(PS,mk,.6);}
    const tn=Math.max(tw1+1.2,K.at('even when',.45)-.15);const last=R0.me[R0.me.length-1];if(last&&R0.t.length){glow(uni([prel(last),prel(R0.t[R0.t.length-1])]),tn,2.2,6);}
    penAway(PS,tw1+1.6);penAway(PT,tw1+1.4);return Math.max(K.d,tn+2.2-K.t);};
  SC.teacher_rates=K=>{camTo(K.t+.1,K.t+1,uni([R.row0,R.targets]));let t=K.t+1.3;(R0.t.length?R0.t:R0.me).forEach((td,i)=>{const mk=ring(gl(td,i===2?1:0),t,t+.55,'#b8322a');draw(PT,mk,i?.45:.8);t+=.9;});penAway(PT,t);return Math.max(K.d,t+.6-K.t);};
  /* the day's points: the other rows' totals written in, then the total */
  SC.count=K=>{cam.move(K.t+.1,K.t+1.1,view(uni([R.tbl,R.tot])));let t=K.t+1.3,sum=0;const per=Math.max(1,Math.round((m.p.poss||12)/Math.max(1,rowsCells.length)));
    rowsCells.forEach((rc,i)=>{if(!rc.pc||disc)return;const have=rc.pc.textContent.trim()||(i===0&&rc.pc.querySelector('.smw-write'));let v=i===0&&R0.me.length?R0.me.reduce((s,td,j)=>s+(ptsOf(meAns[j],meAns[j])||0),0):Math.max(0,per-((i*7)%3));
      sum+=v;if(i===0&&R0.pc&&marks.some(x=>x.el.parentNode===inner&&x.kind==='write'))return;const mk=write(prel(rc.pc),String(v),t,t+.3,'#2b4a9b');draw(PS,mk,i?.35:.7);t+=.5;});
    const tr=q('tr.tot td.pc')||q('tr.totals td.w:last-child');const tt=Math.max(t+.3,K.at('write the total',.5)-.1);if(tr){const mk=write(prel(tr),String(sum||Math.round((m.p.poss||10)*.86)),tt,tt+.4,'#2b4a9b',24);draw(PS,mk,.6);}penAway(PS,tt+.9);
    B_total=sum||Math.round((m.p.poss||10)*.86);return Math.max(K.d,tt+1.2-K.t);};
  let B_total=0;
  SC.goal=K=>{camTo(K.t+.1,K.t+1,R.goal?uni([R.goal,R.head]):R.head);if(R.goal)glow(R.goal,K.t+.9,2.4,6);const tr=Math.max(K.t+2,K.at('reach your goal',.6)-.15);
    const badge=mkFx('smw-badge','<b>'+(B_total||'')+'</b> points · goal '+(m.p.need!=null?m.p.need:'')+' <span>✓</span>',{x:SW/2-170,y:470,w:340},{s:.7,dy:10});badge.tr.move(tr,tr+.4,{o:1,s:1,dy:0},0,easeOut);badge.tr.move(K.t+K.d+.2,K.t+K.d+.6,{o:0});return K.d+.4;};
  SC.midday=K=>{camTo(K.t+.1,K.t+1,R.mid);if(R.mid)glow(R.mid,K.t+.9,K.d-1,6);return K.d;};
  /* the store: each reward lit in turn, then the one chosen goes up to the "working for" box */
  SC.store=K=>{camTo(K.t+.1,K.t+1.1,uni([R.store,R.wf]));const tl=R.tiles.filter(Boolean);const tc=Math.max(K.t+1.2,K.at('how many points',.4)-.2);tl.forEach((r,i)=>glow(r,tc+i*.35,1.3,3));
    const tp=Math.max(tc+tl.length*.35+.3,K.at('choose what',.62)-.15);const pick=tl.length?tl[Math.min(tl.length-1,1)]:null;
    if(pick&&R.wf){const tile=qa('.v2-store .tile')[Math.min(tl.length-1,1)];const fly=mkFx('smw-fly',tile?tile.innerHTML:'',{x:pick.x,y:pick.y,w:pick.w,h:pick.h},{o:0},inner);fly.el.style.background='#fff8e3';
      const dx=R.wf.x+R.wf.w/2-(pick.x+pick.w/2),dy=R.wf.y+R.wf.h/2-(pick.y+pick.h/2),sc=Math.min(1,R.wf.h/pick.h);fly.tr.set(tp,{o:1});fly.tr.move(tp+.1,tp+1.3,{dx,dy,s:sc},.12);glow(R.wf,tp+1.2,1.6,6);}
    return Math.max(K.d,tp+2.9-K.t);};
  SC.reward_plain=K=>{cam.move(K.t+.1,K.t+1,HOME);if(R.wf)glow(R.wf,K.t+1,2,6);else if(R.head)glow(R.head,K.t+1,2);return K.d;};
  SC.bank=K=>{const bank=mkFx('smw-badge smw-bank','<b>Bank</b> + '+(Math.max(0,(B_total||10)-10))+' points saved',{x:SW/2-170,y:470,w:340},{s:.7,dy:10});const t=K.t+.6;bank.tr.move(t,t+.4,{o:1,s:1,dy:0},0,easeOut);bank.tr.move(K.t+K.d-.1,K.t+K.d+.3,{o:0});return K.d+.3;};
  /* the contract: a card with its words, signed by the student and the adult */
  SC.contract=K=>{const mm=S.meta;cam.move(K.t,K.t+.8,HOME);
    const card=mkFx('smw-card smw-contract','<h3>My Contract</h3><p><b>I will:</b> '+esc(mm.bc_task||'reach my goal on my sheet')+(mm.bc_how?' ('+esc(mm.bc_how)+')':'')+'</p><p><b>I earn:</b> '+esc(mm.bc_rw||'the reward I choose')+(mm.bc_rwwhen?', '+esc(mm.bc_rwwhen):'')+'</p>'+
      '<div class="sg"><div><svg viewBox="0 0 220 50" width="220" height="50"><path class="sig1" d="M8 34 C 30 4, 40 44, 60 22 S 90 8, 104 30 S 140 40, 160 18 S 196 26, 212 30" fill="none" stroke="#2b4a9b" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/></svg><span>'+esc(smName()||'Student')+'</span></div>'+
      '<div><svg viewBox="0 0 220 50" width="220" height="50"><path class="sig2" d="M10 30 C 26 10, 44 40, 62 24 C 80 8, 92 36, 118 28 C 140 20, 160 34, 182 22 L 210 26" fill="none" stroke="#b8322a" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/></svg><span>'+esc(mm.bc_teacher||tw)+'</span></div></div>',{x:300,y:60,w:680},{dy:16});
    card.tr.move(K.t+.4,K.t+1,{o:1,dy:0},0,easeOut);const ts=Math.max(K.t+2,K.at('sign',.85)-.4);
    const s1=card.el.querySelector('.sig1'),s2=card.el.querySelector('.sig2');marks.push({el:card.el,path:s1,t0:ts,t1:ts+1.1,kind:'sig'});marks.push({el:card.el,path:s2,t0:ts+1.2,t1:ts+2.2,kind:'sig'});
    card.tr.move(Math.max(K.t+K.d,ts+2.6),Math.max(K.t+K.d,ts+2.6)+.5,{o:0});return Math.max(K.d,ts+3.1-K.t);};
  /* for the adults: four points, each lit as it is read */
  SC.adults=K=>{cam.move(K.t,K.t+.8,HOME);const tips=[['Rate on your own','before you look at the student’s sheet'],['Praise honest ratings','even an honest no'],['Never take points away',''],['Give the reward','the way it was promised']];
    const card=mkFx('smw-card smw-tips','<h3>For the adults</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong>'+(x[1]?' '+esc(x[1]):'')+'</p></div>').join(''),{x:290,y:40,w:700},{dy:16});
    card.tr.move(K.t+.3,K.t+.9,{o:1,dy:0},0,easeOut);const rows=[...card.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));
    const at=[['rate on your own',.12],['praise',.45],['never take',.68],['give the reward',.86]].map((a,i)=>Math.max(K.t+1+i*.5,K.at(a[0],a[1])-.2));
    rows.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});card.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});return K.d+.4;};
  /* v21.67 Match the model: the job and the pictures; the student circles the picture the work is most like, the teacher too; a
     match earns the picture's points and the bonus; the practice; the checks thinning */
  const MR=mmOn?{sheet:prel(mmEl.querySelector('.mm-sheet')),task:prel(mmEl.querySelector('.mm-task')),models:[...mmEl.querySelectorAll('.mm-model')],rule:prel(mmEl.querySelector('.mm-rule')),
    row0:mmEl.querySelector('table.mm-grid tbody tr'),foot:prel(mmEl.querySelector('.mm-sfoot')),grid:prel(mmEl.querySelector('table.mm-grid'))}:null;
  const mmCells=()=>MR&&MR.row0?[...MR.row0.querySelectorAll('td')]:[];
  SC.mm_intro=K=>{camTo(K.t+.1,K.t+1.2,MR.sheet);glow(MR.task,Math.max(K.t+1.4,K.at('the job',.2)-.1),2,6);let t=Math.max(K.t+3.2,K.at('not yet',.45)-.2);
    MR.models.forEach((el,i)=>glow(prel(el),t+i*.9,1.6,4));const tn=Math.max(t+MR.models.length*.9,K.at('number',.8)-.2);MR.models.forEach((el,i)=>glow(prel(el.querySelector('.mm-mnum')),tn+i*.3,1.4,4));
    return Math.max(K.d,tn+MR.models.length*.3+1.4-K.t);};
  SC.mm_rate=K=>{const tds=mmCells();camTo(K.t+.1,K.t+1,uni([prel(MR.models[0]),prel(MR.row0)]));const tc=Math.max(K.t+1.2,K.at('look at the pictures',.3)-.2);MR.models.forEach((el,i)=>glow(prel(el),tc+i*.5,1.2,4));
    const circ=tds[1]?[...tds[1].querySelectorAll('.mm-circ')]:[];const best=circ[circ.length-1];const tr=Math.max(tc+MR.models.length*.5+.3,K.at('circle',.7)-.3);
    if(best){const mk=ring(prel(best),tr,tr+.6,'#2b4a9b');draw(PS,mk,.8);penAway(PS,tr+.9);}return Math.max(K.d,tr+1.6-K.t);};
  SC.mm_teacher=K=>{const tds=mmCells();const circ=tds[2]?[...tds[2].querySelectorAll('.mm-circ')]:[];const best=circ[circ.length-1];const tr=Math.max(K.t+1.2,K.at('circles',.6)-.3);
    if(best){const mk=ring(prel(best),tr,tr+.6,'#b8322a');draw(PT,mk,.8);penAway(PT,tr+.9);}return Math.max(K.d,tr+1.6-K.t);};
  SC.mm_match=K=>{const tds=mmCells();const t0=Math.max(K.t+.8,K.at('match',.2)-.1);if(tds[1]&&tds[2])glow(uni([prel(tds[1]),prel(tds[2])]),t0,1.8,4);
    const tw=Math.max(t0+1.6,K.at('points',.4)-.2);const top=MMT.lv[0]||{pts:3};
    if(tds[3]){const m1=write(prel(tds[3]),'✓ yes',tw,tw+.4,'#2b7a3b',13);draw(PT,m1,.6);}if(tds[4]){const m2=write(prel(tds[4]),String((+top.pts||0)+(+MMT.bonus||0)),tw+.7,tw+1.1,'#2b4a9b',18);draw(PS,m2,.6);}
    const th=Math.max(tw+1.4,K.at('honest',.7)-.2);glow(MR.rule,th,2.4,6);penAway(PS,tw+1.6);penAway(PT,tw+1.2);return Math.max(K.d,th+2.4-K.t);};
  SC.mm_practice=K=>{cam.move(K.t,K.t+.8,HOME);const card=mkFx('smw-card smw-prac','<h3>Rating practice</h3><div class="pr">'+MR.models.map(el=>'<div class="pm">'+((el.querySelector('.mm-mpic')||{}).innerHTML||'')+'<b>'+esc(((el.querySelector('.mm-mnum')||{}).textContent||'').trim())+'</b></div>').join('')+'</div><p class="sc"><b>9</b> of 10 right → ready to rate my own</p>',{x:290,y:50,w:700},{dy:16});
    card.tr.move(K.t+.4,K.t+1,{o:1,dy:0},0,easeOut);const pms=[...card.el.querySelectorAll('.pm')].map(e=>sub(e,{o:.5,h:0}));const t1=Math.max(K.t+2,K.at('pick the model',.45)-.2);
    pms.forEach((fx,i)=>{fx.tr.move(t1+i*.5,t1+i*.5+.3,{o:1,h:1});fx.tr.move(t1+i*.5+.9,t1+i*.5+1.2,{h:0});});
    const sc=sub(card.el.querySelector('.sc'),{o:0});const t2=Math.max(t1+pms.length*.5+.5,K.at('nine',.75)-.2);sc.tr.move(t2,t2+.4,{o:1});card.tr.move(K.t+K.d+.1,K.t+K.d+.5,{o:0});return K.d+.5;};
  SC.mm_checks=K=>{camTo(K.t,K.t+.8,uni([MR.grid,MR.foot]));glow(MR.foot,K.t+.9,2.2,6);
    const card=mkFx('smw-card smw-checks','<h3>The teacher’s checks</h3><div class="st">'+['Every time','Every other time','One in three','A surprise'].map(x=>'<span>'+x+'</span>').join('<i>→</i>')+'</div>',{x:290,y:430,w:700},{dy:16});
    card.tr.move(K.t+1,K.t+1.6,{o:1,dy:0},0,easeOut);const sp=[...card.el.querySelectorAll('.st span')].map(e=>sub(e,{o:.45,h:0}));const t1=Math.max(K.t+2.2,K.at('less often',.5)-.6);
    sp.forEach((fx,i)=>{fx.tr.move(t1+i*.55,t1+i*.55+.3,{o:1,h:1});fx.tr.move(t1+i*.55+.8,t1+i*.55+1.1,{h:0});});card.tr.move(K.t+K.d+.1,K.t+K.d+.5,{o:0});return K.d+.5;};
  SC.outro=K=>{cam.move(K.t,K.t+1,HOME);const words=['Notice','Rate','Be honest','Count'];
    const box=mkFx('smw-words',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:140,y:250,w:1000},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['notice',.05],['rate',.15],['honest',.28],['count',.42]].map((a,i)=>Math.max(K.t+.5+i*.45,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));
    const veil=mkFx('smw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t+.2,K.t+.8,{o:.55});return K.d+.6;};

  /* ---- the timeline: the lines this sheet needs ---- */
  const ids=['intro'];if(S.sys){ids.push(S.sys==='interval'?'rows_iv':'targets');if(S.sys!=='interval')ids.push('rows');else ids.splice(1,0,'targets');
    const rl=S.sys==='cico'?'':rateLine();if(rl){ids.push(rl);ids.push('honest');}
    if(hasMatch&&S.sys==='match'){ids.push('match_teacher');ids.push(bin?'match_points':'match_bonus');}else if(hasMatch)ids.push('match_teacher');else if(teacherOnly)ids.push('teacher_rates');
    ids.push('count');if(m.p&&m.p.need!=null)ids.push('goal');if(smD().mid&&R.mid)ids.push('midday');
    if(smStore().length&&R.store)ids.push('store');else ids.push('reward_plain');if(smD().bank&&smStore().length)ids.push('bank');
    if(S.meta.bc_task||S.meta.bc_rw)ids.push('contract');if(mmOn)ids.push(...MM_IDS);ids.push('adults');}
  else if(mmOn)ids.push(...MM_IDS);
  ids.push('outro');
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||(id.indexOf('rate_')===0?'rate':'sheet'),chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  cam.move(T-1.2,T-.2,HOME);
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,paper,inner,fxs,marks,pens,cap,notes};
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
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  /* the marks: a circle or a signature drawn along its length; a number written in; a star coloured */
  for(const mk of B.marks){const u=clamp((v-mk.t0)/Math.max(.01,mk.t1-mk.t0),0,1);
    if(mk.kind==='ring'||mk.kind==='sig'){const dv=f2(100*(1-u));if(mk.path._dv!==dv){mk.path._dv=dv;mk.path.setAttribute('stroke-dashoffset',dv);}   /* an attribute, so Save as video's painter sees it too */
if(mk.kind==='ring'){css(mk.el,'visibility',u>0?'visible':'hidden');}}
    else{css(mk.el,'opacity',f2(u));css(mk.el,'visibility',u>0?'visible':'hidden');if(mk.kind==='write')css(mk.el,'clipPath','inset(0 '+f2(100*(1-u))+'% 0 0)');}}
  /* the pencils: on their track, or following the stroke they draw */
  for(const p of B.pens){let s=p.tr.at(v),x=s.x,y=s.y;
    for(const d of p.draws)if(v>=d.t0&&v<=d.t1){const P=d.pt(d,(v-d.t0)/Math.max(.01,d.t1-d.t0),v);x=P.x;y=P.y;break;}
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001?'visible':'hidden');css(p.el,'transform','translate('+f2(x)+'px,'+f2(y-13)+'px) rotate('+f2(s.a)+'deg)');}
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

/* ---------------- the view: leaving it pauses, entering it rebuilds from the current book ---------------- */
const setView0=setView;
setView=function(v){const was=document.body.classList.contains('view-walk');if(v!=='walk'&&(want||playing))pause();
  if(v==='walk'&&was&&B&&!B.dirty)return;   /* the Walkthrough button again, with the book unchanged: nothing to do */
  setView0(v);if(v==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();reveal();}else if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);};
/* the book can change while the view is open (Open data, a restore, the case): rebuild from it */
let building=false;
if(typeof renderAll==='function'){const renderAll0=renderAll;
  renderAll=function(){const r=renderAll0.apply(this,arguments);if(building)return r;if(B)B.dirty=true;
    if(document.body.classList.contains('view-walk')){building=true;try{build();fit();ui();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){const L=audioLines()||{};return Object.keys(L).filter(id=>!MK[id]||MK[id].h!==hash(String(L[id].t||'')));},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();

