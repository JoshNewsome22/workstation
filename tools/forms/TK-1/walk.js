/* (v21.43) The Walkthrough view: a narrated walkthrough that plays like a video, built live from this book (its pictures,
   photo, colours, token picture and count, terminal token). The whole walkthrough is laid out once per build as a timeline
   (build); renderAt(t) sets every element of the stage to its state at time t, as a pure function of t, with no CSS
   transitions, so playing, seeking, the chapters and the video recorder all draw the same frames. The narration is Web Audio
   (walk-audio.js, made by make-narration.py) scheduled on the timeline; the hands are walk-hands.js. Each is optional: without
   the audio the captions are timed from their word counts and the device's voice reads them; without the hands simple
   placeholder hands are drawn. The pages are the form's own (pageGrid, pageBoard, pageTokens, cardHtml, tokCard), rendered
   with the First-Then layout and the 8.82 in page for the walkthrough only; the book itself (S) is never changed. */
(function(){
'use strict';
const SW=1280,SH=720,PX=96/72,PAUSE=.45,CPT=138,TPT=104;
const LIST=['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','tk_page','rule','start','tok_first','tok_none','tok_more','tok_last','exchange','reset','tips','outro'];
const OPT={tk_page:1,tok_none:1};
const CHOF={intro:'book',ch_show:'choices',ch_pick:'choices',tg_show:'targets',tg_pick:'targets',bd_place:'board',tk_page:'board',rule:'session',start:'session',tok_first:'session',tok_none:'session',tok_more:'session',tok_last:'session',tok_last_term:'session',exchange:'exchange',reset:'exchange',tips:'tips',outro:'tips'};
const CHAPS=[['book','The book'],['choices','Choices'],['targets','Targets'],['board','Board'],['session','Session'],['exchange','Exchange'],['tips','Tips']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not in the build (its texts always win) */
const FB={
  intro:'This is your token board book. Four laminated pages are bound on the left, with a tab for each: Choices, Targets, Board, and Tokens.',
  ch_show:'Page one is the Choices page. Show it before the task begins. Every picture should be something your learner values right now, not something they can get any time, or have just had plenty of.',
  ch_pick:'Your learner looks over the pictures and picks one to work for. If needed, help with the pointing, but let your learner make the choice.',
  tg_show:'Page two is the Targets page, where you choose what to teach: a new skill, or a better way to get what a problem behavior was getting.',
  tg_pick:'Choose one target at a time. Agree with the other adults on exactly what counts, so everyone gives tokens for the same thing.',
  bd_place:'Page three is the Board. Place the target under First, and the chosen item under Then. Your learner can now see the plan: first the target, then the item.',
  tk_page:'Page four is the Tokens page, where the tokens wait. The empty slots on the board show your learner how many are left to earn. Make new tokens valuable first; the tips at the end show how.',
  rule:'Before you start, decide how much of the target behavior earns a token: how many times, or how long. Keep it small, so your learner can succeed. This example uses one token for every two minutes.',
  start:'Now start the session. Point to the board and name both pictures: first the target, then the item. The ring counts down each two-minute interval, sped up for this video.',
  tok_first:'The interval is over, and your learner kept up the target behavior the whole time. Give a token right away, with brief praise that names what they did. Your learner places it in the first slot.',
  tok_none:'If the behavior stops during an interval, give no token, but leave the earned tokens on the board. Calmly remind your learner what to do, and start the next interval.',
  tok_more:'Each interval with the target behavior earns another token, given right away with a few words of praise. The board fills up, one slot at a time.',
  tok_last_term:'One more interval earns the last token. It looks different: this is the terminal token, earned just like the others. With practice, it tells your learner that the board is finished and the item comes next.',
  tok_last:'One more interval with the target behavior, and the last token goes in. Now the board is full, and your learner has earned the item they chose.',
  exchange:'The board is full, so make the exchange right away, especially while the board is new: your learner gets the Then item, for a time or amount set before the session.',
  reset:'When the time with the item is up, put the tokens back on the Tokens page, and the pictures back on their pages. After that, your learner chooses again for the next round.',
  tips:'Three tips. Make the tokens valuable first: give one and trade it for the item right away, again and again, until your learner reaches for the token. Start with a small requirement and few tokens, and raise them slowly; if the behavior falls apart, go back a step. Keep the item available only through the board.',
  outro:'That\'s the whole cycle: choose, set the target, earn the tokens, and exchange. Over time, the target behavior should happen more often; if not, change the item or the requirement. The back of each page tells you more.'
};
/* the simulator's pictures, shown when a page's six cards are empty */
const SAMPLE={ch:[['ipad','Tablet'],['puzzle','Puzzle'],['ball','Ball'],['bubbles','Bubbles'],['lego','Building blocks'],['drawing','Drawing']],
  tg:[['sitting','Sitting'],['raisehand','Raise hand'],['writing','Writing'],['waiting','Waiting'],['alldone','All done'],['reading','Reading']]};
/* brief praise that names the behavior: the target's own name when it reads as one (Sitting: "Great sitting!"), else general praise */
function praiseFor(label){const l=String(label||'').trim().toLowerCase();const ger=/^[a-z]+ing\b/.test(l)&&l.length<=20;
  return{ger,name:l,first:ger?'Great '+l+'!':'Great job!',last:ger?'You did it! Great '+l+'!':'You did it! Great job!',
    more:ger?['Nice '+l+'!','Way to keep '+l+'!','Good '+l+'!','You kept '+l+'!','Super '+l+'!','Great job '+l+'!','Keep it up!','Nice job!']:['Nice work!','Way to go!','Good job!','Keep it up!','Super job!','Great work!','Nice job!','You are doing it!']};}

/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const bump=(t,t0,d)=>{const u=(t-t0)/d;return u<=0||u>=1?0:Math.sin(Math.PI*u);};
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
const handArt=()=>(typeof WALK_HANDS!=='undefined'&&WALK_HANDS&&WALK_HANDS.learner&&WALK_HANDS.teacher)?WALK_HANDS:placeholderHands();
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
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

/* ---------------- placeholder hands (used only until walk-hands.js is in the build), same contract ---------------- */
let PHH=null;
function placeholderHands(){if(PHH)return PHH;
  const mk=(w,h,skin,dark,sleeve)=>{const arm='<path d="M'+w*.2+' '+h*.3+'L'+w*.16+' '+h+'H'+w*.84+'L'+w*.8+' '+h*.3+'Z" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>'+(sleeve?'<path d="M'+w*.1+' '+h*.42+'H'+w*.9+'L'+w*.94+' '+h+'H'+w*.06+'Z" fill="'+sleeve+'" stroke="#2f4a63" stroke-width="2"/>':'');
    const palm='<rect x="'+w*.12+'" y="'+h*.12+'" width="'+w*.76+'" height="'+h*.22+'" rx="'+w*.3+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>';
    const sv=b=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+arm+b+'</svg>';
    const fing=(x,y0,y1)=>'<rect x="'+(x-w*.08)+'" y="'+y0+'" width="'+w*.16+'" height="'+(y1-y0)+'" rx="'+w*.08+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>';
    return{point:{svg:sv(palm+fing(w*.26,h*.005,h*.2)+'<ellipse cx="'+w*.84+'" cy="'+h*.2+'" rx="'+w*.1+'" ry="'+h*.05+'" fill="'+skin+'" stroke="'+dark+'" stroke-width="2"/>'),w,h,tip:[w*.26,h*.012]},
      pinch:{svg:sv(palm+fing(w*.22,h*.02,h*.2)+fing(w*.36,h*.03,h*.2)),w,h,grip:[w*.28,h*.03]},
      open:{svg:sv(palm+[.2,.36,.52,.68].map((x,i)=>fing(w*x,h*(.01+i*.004),h*.18)).join('')+fing(w*.9,h*.12,h*.26)),w,h,palm:[w*.48,h*.22]}};};
  PHH={learner:mk(108,549,'#f3c7a2','#b98361',''),teacher:mk(140,667,'#a8714a','#5b3a22','#5f84a8')};return PHH;}
const HS={learner:1.3,teacher:1.3};
const ANCH={point:'tip',pinch:'grip',open:'palm'};

/* ---------------- the DOM of the view ---------------- */
let DOM=null;
function dom(){if(DOM&&DOM.stage&&DOM.stage.isConnected)return DOM;const g=id=>document.getElementById(id);const stage=g('wkStage');if(!stage)return null;
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};
  wire();return DOM;}

/* ---------------- the build ---------------- */
let B=null;
function emptySix(a){return !a.some(o=>has(o)||String(o.l||'').trim());}
function firstUsed(a){const i=a.findIndex(o=>has(o)||String(o.l||'').trim());return i<0?0:i;}
function sampled(k){return SAMPLE[k].map(([key,l])=>P[key]?cello(key,key==='ipad'||key==='waiting'?l:''):cello('',l));}   /* the library's labels, as the simulator has them */
/* the pages and cards drawn from a copy of the book's state: First-Then, the 8.82 in page, no presets in First and Then */
function forced(fn){const saved=S;
  try{S=Object.assign({},saved,{meta:Object.assign({},saved.meta,{layout:'ft',pagesize:'8.82'}),ft:[cello(),cello()],
      ch:emptySix(saved.ch)?sampled('ch'):saved.ch.map(o=>Object.assign({},o)),tg:emptySix(saved.tg)?sampled('tg'):saved.tg.map(o=>Object.assign({},o))});
    return fn();}
  finally{S=saved;}}
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function coilSvg(h){const n=Math.max(8,Math.round(h/40)),gap=h/n;let s='';for(let i=0;i<n;i++){const y=gap*(i+.5);
    s+='<circle cx="27" cy="'+f2(y)+'" r="3.4" fill="#5d6770"/><path d="M27 '+f2(y-1)+'C17 '+f2(y-9)+' 3 '+f2(y-7)+' 3 '+f2(y+1)+'S17 '+f2(y+8)+' 27 '+f2(y+3)+'" fill="none" stroke="#3b4148" stroke-width="3.2" stroke-linecap="round"/><path d="M26 '+f2(y-1)+'C17 '+f2(y-7)+' 6 '+f2(y-6)+' 5 '+f2(y)+'" fill="none" stroke="#b9c2ca" stroke-width="1.2" opacity=".8"/>';}
  return '<svg class="wk-coil" viewBox="0 0 34 '+f2(h)+'" width="34" height="'+f2(h)+'" aria-hidden="true">'+s+'</svg>';}

function build(){const D=dom();if(!D)return null;stop(true);
  const restore=tempShow(D.sec);
  try{fit();B=compose(D);try{fitAll();}catch(e){}}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lp=layer('wk-pages'),Lveil=layer('wk-veil'),Lfly=layer(),Lhl=layer('wk-hl'),Litem=layer(),Lht=layer('wk-ht'),Lfx=layer('wk-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  /* the book, drawn from the forced copy of the state */
  const F=forced(()=>{const pk={ch:firstUsed(S.ch),tg:firstUsed(S.tg)},n=nTok(),cpt=CPT/72,tpt=TPT/72;
    return{pg:{ch:pageGrid('ch'),tg:pageGrid('tg'),bd:pageBoard(),tk:pageTokens()},
      ch:S.ch.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),tg:S.tg.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),
      tok:Array.from({length:n},(_,i)=>tokCard(tpt,i===n-1)),chipTok:tokCard(.6,false),n,term:termOn(),pick:pk,
      itemPic:pic(S.ch[pk.ch],''),itemLbl:String(lbl(S.ch[pk.ch])||'').trim(),tgLbl:String(lbl(S.tg[pk.tg])||'').trim()};});
  const PR=praiseFor(F.tgLbl);
  const notes=[];
  if(S.meta.layout==='rules')notes.push('This book’s Board uses the Rules row; the walkthrough shows the First-Then Board, which is used the same way.');
  if(emptySix(S.ch)&&emptySix(S.tg))notes.push('The Choices and Targets are still empty, so the walkthrough shows sample pictures.');
  else if(emptySix(S.ch))notes.push('The Choices are still empty, so the walkthrough shows sample pictures for them.');
  else if(emptySix(S.tg))notes.push('The Targets are still empty, so the walkthrough shows sample pictures for them.');
  if(!audioLines())notes.push('The recorded narration is not in this copy of the form: the captions are read by the device’s own voice where it has one.');
  /* the four pages: the page itself (the canvas), no sheet and no trim marks */
  const PG={};['tk','bd','tg','ch'].forEach(k=>{const el=div('wk-page');el.dataset.pg=k;el.innerHTML=F.pg[k];Lp.appendChild(el);
    const pg=el.querySelector('.pg'),cv=pg.querySelector('.cv');pg.querySelectorAll('.trim').forEach(x=>x.remove());cv.style.left='0';cv.style.top='0';
    const lay=div('wk-lay'),shade=div('wk-shade');cv.appendChild(lay);cv.appendChild(shade);PG[k]={k,el,pg,cv,lay,shade};});
  Object.values(PG).forEach(p=>{p.w=p.cv.offsetWidth;p.h=p.cv.offsetHeight;p.el.style.width=p.w+'px';p.el.style.height=p.h+'px';p.pg.style.width=p.w+'px';p.pg.style.height=p.h+'px';
    p.cv.insertAdjacentHTML('beforeend',coilSvg(p.h));});
  const rel=(p,el)=>{const r=el.getBoundingClientRect(),c=p.cv.getBoundingClientRect(),k=c.width/(p.cv.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const ctr=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
  const M={ch:[...PG.ch.cv.querySelectorAll('.bx')].map(e=>rel(PG.ch,e)),tg:[...PG.tg.cv.querySelectorAll('.bx')].map(e=>rel(PG.tg,e)),
    first:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.grey')),then:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.green')),
    slot:[...PG.bd.cv.querySelectorAll('.slot')].map(e=>rel(PG.bd,e)),ybx:[...PG.tk.cv.querySelectorAll('.ybx')].map(e=>rel(PG.tk,e)),
    tab:{},band:rel(PG.ch,PG.ch.cv.querySelector('.band'))};
  ['ch','tg','bd','tk'].forEach(k=>{M.tab[k]=rel(PG[k],PG[k].cv.querySelector('.tab'));});
  const n=F.n,CW=CPT*PX,TW=TPT*PX;
  /* the in-page copies (a card resting on its page moves and turns with it) */
  const inPage=(p,c,html,w)=>{const e=div('wk-in',html);e.style.left=f2(c.x-w/2)+'px';e.style.top=f2(c.y-w/2)+'px';e.style.width=f2(w)+'px';e.style.height=f2(w)+'px';p.lay.appendChild(e);return e;};
  const cards=[];
  const mkCard=(id,html,w,h,cls)=>{const el=div('wk-fc'+(cls?' '+cls:''),'<div class="wk-sh"></div>'+html);el.dataset.card=id;el.style.width=f2(w)+'px';el.style.height=f2(h)+'px';Lfly.appendChild(el);
    const c={id,el,sh:el.firstChild,w,h,tr:new Track({x:-400,y:-400,s:1,l:0,o:1}),where:new Steps('none'),fol:[],inp:{},pops:{},glow:null};cards.push(c);return c;};
  const CH=[],TG=[],TK=[];
  F.ch.forEach((h,i)=>{if(!h)return;const c=i===F.pick.ch?mkCard('ch'+i,h,CW,CW):{id:'ch'+i,inp:{},pops:{},where:new Steps('ch'),fly:false};c.inp.ch=inPage(PG.ch,ctr(M.ch[i]),h,CW);c.inp.ch.dataset.card='ch'+i;c.where.set(-1e8,'ch');if(!c.el)cards.push(c);CH[i]=c;});
  F.tg.forEach((h,i)=>{if(!h)return;const c=i===F.pick.tg?mkCard('tg'+i,h,CW,CW):{id:'tg'+i,inp:{},pops:{},where:new Steps('tg'),fly:false};c.inp.tg=inPage(PG.tg,ctr(M.tg[i]),h,CW);c.inp.tg.dataset.card='tg'+i;c.where.set(-1e8,'tg');if(!c.el)cards.push(c);TG[i]=c;});
  const cC=CH[F.pick.ch]||mkCard('chx',cardHtml({k:'',ph:'',l:'Item'},CPT/72),CW,CW),cT=TG[F.pick.tg]||mkCard('tgx',cardHtml({k:'',ph:'',l:'Target'},CPT/72),CW,CW);
  cC.inp.bd=inPage(PG.bd,ctr(M.then),F.ch[F.pick.ch]||cC.el.lastChild.outerHTML,CW);cC.inp.bd.dataset.card=cC.id;
  cT.inp.bd=inPage(PG.bd,ctr(M.first),F.tg[F.pick.tg]||cT.el.lastChild.outerHTML,CW);cT.inp.bd.dataset.card=cT.id;
  for(let i=0;i<n;i++){const c=mkCard('tok'+i,F.tok[i],TW,TW,'wk-tok');c.inp.tk=inPage(PG.tk,ctr(M.ybx[i]),F.tok[i],TW);c.inp.bd=inPage(PG.bd,ctr(M.slot[i]),F.tok[i],TW);
    c.inp.tk.dataset.card=c.inp.bd.dataset.card='tok'+i;c.where.set(-1e8,'tk');TK.push(c);}
  const lastTok=TK[n-1];if(F.term){lastTok.glow=div('wk-tglow');lastTok.el.insertBefore(lastTok.glow,lastTok.el.children[1]);}
  /* the item (the Then card grown into the thing itself) */
  const itemLabel=F.itemLbl?'2 minutes of '+F.itemLbl:'2 minutes with the item';
  const IW=250;const item=mkCard('item','<div class="wk-ipic">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div><div class="wk-ilbl">'+esc(itemLabel)+'</div>',IW,IW,'wk-item');
  Litem.appendChild(item.el);
  /* the hands */
  const ART=handArt(),hands=[];
  const mkHand=who=>{const root=div('wk-hand wk-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);const h={who,root,poses:{},base:HS[who],tr:new Track({x:640,y:SH+700,s:1,sx:640,sy:SH+800}),pose:new Steps('point')};
    ['point','pinch','open'].forEach(p=>{const a=ART[who][p];const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose',a.svg);e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=f2(an[0])+'px '+f2(an[1])+'px';root.appendChild(e);h.poses[p]={el:e,ax:an[0],ay:an[1]};});
    hands.push(h);return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* layouts: the closed book centred; the session (the Board large on the left, the Tokens page smaller on the right) */
  const pw=PG.ch.w,ph=PG.ch.h,maxH=Math.max(PG.ch.h,PG.tg.h,PG.bd.h,PG.tk.h);
  const sBk=Math.min(.86,566/maxH),bx=(SW-pw*sBk)/2,by=30;
  const DEPTH={ch:0,tg:1,bd:2,tk:3};
  const BOOK=(k,s,x,y)=>{s=s||sBk;const X=x==null?(SW-pw*s)/2:x,Y=y==null?by:y;return{x:X+DEPTH[k]*2.2*s/sBk,y:Y+DEPTH[k]*2.6*s/sBk,s};};
  const TL={x:bx/2,y:by+ph*sBk*.5},TR={x:SW-bx/2,y:by+ph*sBk*.5};
  const sBd=Math.min(.8,520/PG.bd.h),sTk=.52;
  const BDS={x:26,y:30,s:sBd},TKS={x:SW-26-pw*sTk,y:Math.min(300,604-PG.tk.h*sTk),s:sTk};
  const RC={x:TKS.x+pw*sTk/2,y:Math.max(150,TKS.y-112)};
  const HO={x:(BDS.x+pw*sBd+TKS.x)/2,y:Math.max(220,TKS.y-24)};   /* where the teacher holds a token out: in the gap between the Board and the Tokens page */
  const at=(L,c)=>({x:L.x+L.s*c.x,y:L.y+L.s*c.y});
  const s0=sBk*.93;
  Object.keys(PG).forEach(k=>{const b=BOOK(k,s0,(SW-pw*s0)/2,by+ph*(sBk-s0)/2);PG[k].tr=new Track({x:b.x,y:b.y,s:b.s,ry:0,o:1});PG[k].el.style.zIndex=String(10-DEPTH[k]);});
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}Lfx.appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur,s)=>{fx.tr.move(t0,t0+.3,{o:1,s:s||1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glowAt=(L,r,pad,t0,dur,round)=>{const p=pad||6;const g=mkFx('wk-glow'+(round?' round':''),'',{x:L.x+L.s*r.x-p,y:L.y+L.s*r.y-p,w:L.s*r.w+2*p,h:L.s*r.h+2*p});pulse(g,t0,dur);return g;};
  const veil={el:Lveil,tr:new Track({o:0,s:1,dy:0})};fxs.push(veil);
  const ringBox={x:RC.x-74,y:RC.y-74,w:148,h:148};
  const ringEl=mkFx('wk-ring','<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="84"/><circle class="fg" cx="100" cy="100" r="84" transform="rotate(-90 100 100)"/></svg><div class="wk-rt">2:00</div><div class="wk-rl">sped up for this video</div>',ringBox,{s:.7});
  const ring={fx:ringEl,fg:ringEl.el.querySelector('.fg'),t:ringEl.el.querySelector('.wk-rt'),ints:[],C:2*Math.PI*84};
  const chip=mkFx('wk-chip','<span class="wk-ct">'+F.chipTok+'</span><span><b>1 token</b> for every<br><b>2 minutes</b> of '+(PR.ger?esc(PR.name):'the target')+'</span>',{x:RC.x-185,y:12,w:370},{s:.8});
  const noTok=mkFx('wk-note2','<b>No token</b> this interval.<br>Earned tokens stay.',{x:RC.x-84-262,y:RC.y-44,w:262},{s:.9});
  /* the praise bubble: over the token the teacher holds out (between the Board and the Tokens page), not over the pictures */
  const bubbles=[];const bubble=(i,text,t0,dur)=>{const b=mkFx('wk-bub',esc(text),{x:clamp(HO.x-150,10,SW-310),y:HO.y-TW*sBd/2-128,w:300},{s:.6,dy:12});
    b.tr.move(t0,t0+.3,{o:1,s:1,dy:0},0,easeOut);b.tr.move(t0+dur-.3,t0+dur,{o:0,dy:-8});bubbles.push(b);return b;};
  const tipsCard=mkFx('wk-tips','<h3>Three tips</h3>'+'<div class="wk-tip" data-i="0"><b>1</b><p><strong>Make the tokens valuable first.</strong> Give a token and trade it for the item right away, again and again, until your learner reaches for the token.</p></div>'
    +'<div class="wk-tip" data-i="1"><b>2</b><p><strong>Start small.</strong> Ask for a little behavior and use few tokens, then raise them slowly; if the behavior falls apart, go back a step.</p></div>'
    +'<div class="wk-tip" data-i="2"><b>3</b><p><strong>Only through the board.</strong> Keep the Then item put away at other times.</p></div>',{x:520,y:44,w:720},{dy:16});
  const tipRows=[...tipsCard.el.querySelectorAll('.wk-tip')].map(e=>{const fx={el:e,tr:new Track({o:0,s:1,dy:14})};fxs.push(fx);return fx;});
  const cyc=mkFx('wk-cyc','',{x:90,y:478,w:1100});
  const cycItems=['Choose','Set the target','Earn the tokens','Exchange'].map((w,i)=>{const e=div('wk-cy','<b>'+(i+1)+'</b>'+esc(w));cyc.el.appendChild(e);if(i<3)cyc.el.appendChild(div('wk-cya','→'));const fx={el:e,tr:new Track({o:0,s:.85,dy:10})};fxs.push(fx);return fx;});

  /* ---- choreography helpers (stage coordinates) ---- */
  const grip=(c,p,s,who)=>{const g=who==='learner'?[-.08,.46]:[.08,.46];return{x:p.x+c.w*s*g[0],y:p.y+c.h*s*g[1]};};
  const pointAt=(p,s)=>({x:p.x,y:p.y+CW*s*.12});
  const handTo=(h,t0,t1,p,arc)=>{h.tr.move(t0,t1,{x:p.x,y:p.y},arc==null?.14:arc);};
  const offFrom=(p,sx,sy)=>{const dx=sx-p.x,dy=sy-p.y,len=Math.hypot(dx,dy)||1,k=(SH+330-p.y)/Math.max(.2,dy/len);return{x:p.x+dx/len*k,y:p.y+dy/len*k};};
  const enter=(h,t0,t1,p,pose,sh)=>{const o=offFrom(p,sh[0],sh[1]);h.tr.set(t0,{x:o.x,y:o.y,sx:sh[0],sy:sh[1],s:1});h.pose.set(t0,pose);h.tr.move(t0,t1,{x:p.x,y:p.y},.04);};
  const leave=(h,t0,t1)=>{const s=h.tr.at(t0);const o=offFrom(s,s.sx,s.sy);h.tr.move(t0,t1,{x:o.x,y:o.y},0);};
  /* a held card keeps the same point under the fingers: the offset from the hand scales with the card */
  const take=(c,h,t)=>{const cp=cardPos(c,t),hp=h.tr.at(t);c.fol.push({t0:t,t1:1e9,h,dx:cp.x-hp.x,dy:cp.y-hp.y,s0:c.tr.at(t).s||1});c.where.set(t,'fly');};
  const release=(c,t)=>{const f=c.fol[c.fol.length-1];if(!f||f.t1<1e9)return;const p=folPos(c,f,t);f.t1=t;c.tr.set(t,{x:p.x,y:p.y});};
  const carryTo=(c,h,t0,t1,dst,arc)=>{const f=c.fol[c.fol.length-1],k=(c.tr.at(t1).s||1)/f.s0;handTo(h,t0,t1,{x:dst.x-f.dx*k,y:dst.y-f.dy*k},arc==null?.18:arc);};
  const cardPos=(c,t)=>cardPosOf(c,t);
  const pageTurn=(k,t0,t1,back)=>{const p=PG[k];if(back){p.tr.set(t0,{o:1});p.tr.move(t0,t1,{ry:0},0,easeOut);}else{p.tr.move(t0,t1,{ry:-90},0,u=>u*u*(3-2*u));p.tr.set(t1,{o:0});}};
  const stackTo=(t0,t1,fn)=>{['tk','bd','tg','ch'].forEach((k,i)=>PG[k].tr.move(t0+(3-i)*.03,t1,fn(k)));};
  let session=false,ringPending=null;
  const toSession=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BDS);PG.tk.tr.move(t0+.15,t0+dur,TKS,.05);session=true;};
  const toBook=(t0,dur)=>{PG.bd.tr.move(t0,t0+dur,BOOK('bd'));PG.tk.tr.move(t0,t0+dur-.1,BOOK('tk'),.05);session=false;};
  const ringInt=(t0,t1,ok)=>{ring.ints.push({t0,t1,ok});};
  /* a token from the Tokens page to the Board: the teacher's hand takes it and holds it out with praise; the learner's hand takes it and puts it in its slot */
  const SHT=[1130,SH+480],SHL=[300,SH+480];
  const deliver=(i,o)=>{const c=TK[i],src=at(TKS,ctr(M.ybx[i])),dst=at(BDS,ctr(M.slot[i]));
    /* o.tIn / o.lIn: that hand is still in the frame from the token before, and moves on from there; o.stay: both hands stay for the next token */
    if(o.tIn)handTo(HT,o.t0,o.grab,grip(c,src,sTk,'teacher'),.12);else enter(HT,o.t0,o.grab,grip(c,src,sTk,'teacher'),'pinch',SHT);
    c.tr.set(o.grab,{x:src.x,y:src.y,s:sTk,l:0,o:1});take(c,HT,o.grab);c.tr.move(o.grab,o.grab+.25,{l:1});c.tr.move(o.grab+.25,o.atHO,{s:sBd});
    carryTo(c,HT,o.grab+.05,o.atHO,HO,.16);
    if(o.text)bubble(i,o.text,o.bub==null?o.atHO:o.bub,o.bubDur||2.2);
    const tk=o.take;const hp=grip(c,cardPos(c,tk),sBd,'learner');if(o.lIn)handTo(HL,tk-(o.lin||.75),tk,hp,.1);else enter(HL,tk-(o.lin||.75),tk,hp,'pinch',SHL);
    release(c,tk);take(c,HL,tk);if(!o.stay)leave(HT,tk+.08,tk+.8);
    carryTo(c,HL,tk+.05,o.place,dst);release(c,o.place);c.tr.move(o.place,o.place+.22,{l:0});c.where.set(o.place+.22,'bd');
    if(o.stay)return o.place+.3;leave(HL,o.place+.3,o.place+1);return o.place+1;};

  /* ---- the scenes, one per narration line; each returns the time its animation needs ---- */
  const SC={};
  SC.intro=K=>{stackTo(K.t,K.t+1.6,k=>BOOK(k));
    const names=[['Choices','ch',.62],['Targets','tg',.72],['Board','bd',.82],['Tokens','tk',.92]];let last=K.t+1.8;
    const after=K.text.toLowerCase().indexOf('tab');
    names.forEach(([w,k,fr])=>{const t=Math.max(K.t+1.8,K.at(w,fr,after));const L=BOOK(k);glowAt(L,M.tab[k],5,t,1.6);last=Math.max(last,t+1.6);});
    const tb=Math.max(K.t+1.7,K.at('bound',.35));const L0=BOOK('ch');glowAt({x:L0.x,y:L0.y,s:L0.s},{x:-14,y:0,w:40,h:ph},4,tb,1.8);
    return last-K.t;};
  SC.ch_show=K=>{glowAt(BOOK('ch'),M.tab.ch,5,K.t+.2,1.6);const ids=CH.map((c,i)=>c?i:-1).filter(i=>i>=0);
    ids.forEach((i,j)=>{CH[i].pops.ch=(CH[i].pops.ch||[]).concat(K.t+K.d*(.3+.55*j/Math.max(1,ids.length)));});return K.d;};
  SC.ch_pick=K=>{const L=BOOK('ch'),c=cC,sh=[820,SH+480];const P0=at(L,ctr(M.ch[F.pick.ch]));
    const scan=[4,2,1,5].filter(i=>CH[i]&&i!==F.pick.ch).slice(0,3);
    const tp=Math.max(K.t+3.4,K.at('picks one',.48));
    const pts=scan.map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){enter(HL,K.t+.15,K.t+1.05,pts[0],'point',sh);const step=(tp-.7-(K.t+1.05))/pts.length;
      for(let j=1;j<pts.length;j++)handTo(HL,K.t+1.05+step*(j-1)+.25,K.t+1.05+step*j,pts[j]);
      handTo(HL,tp-.75,tp-.05,grip(c,P0,L.s,'learner'),.12);}
    else enter(HL,tp-1,tp-.05,grip(c,P0,L.s,'learner'),'point',sh);
    HL.pose.set(tp-.2,'pinch');
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HL,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HL,tp+.4,tp+1.7,TR,.2);release(c,tp+1.7);c.tr.move(tp+1.7,tp+1.95,{l:0});
    leave(HL,tp+2.05,tp+2.85);return tp+2.95-K.t;};
  SC.tg_show=K=>{pageTurn('ch',K.t+.15,K.t+1.05);glowAt(BOOK('tg'),M.tab.tg,5,K.t+.9,1.6);
    const ids=TG.map((c,i)=>c?i:-1).filter(i=>i>=0);ids.forEach((i,j)=>{TG[i].pops.tg=(TG[i].pops.tg||[]).concat(K.t+1.2+(K.d-1.2)*(.3+.55*j/Math.max(1,ids.length)));});return Math.max(K.d,2);};
  SC.tg_pick=K=>{const L=BOOK('tg'),c=cT,sh=[380,SH+480];const P0=at(L,ctr(M.tg[F.pick.tg]));
    const other=[1,3].filter(i=>TG[i]&&i!==F.pick.tg)[0];const tp=Math.max(K.t+2.2,K.at('one target',.12)+1.0);
    if(other!=null){enter(HT,K.t+.2,K.t+1.1,pointAt(at(L,ctr(M.tg[other])),L.s),'point',sh);handTo(HT,tp-.8,tp-.05,grip(c,P0,L.s,'teacher'),.12);}
    else enter(HT,tp-1,tp-.05,grip(c,P0,L.s,'teacher'),'point',sh);
    HT.pose.set(tp-.2,'pinch');c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HT,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HT,tp+.4,tp+1.4,TL,.2);release(c,tp+1.4);c.tr.move(tp+1.4,tp+1.65,{l:0});leave(HT,tp+1.75,tp+2.55);return tp+2.65-K.t;};
  SC.bd_place=K=>{pageTurn('tg',K.t+.15,K.t+1.05);const L=BOOK('bd');glowAt(L,M.tab.bd,5,K.t+.9,1.4);
    const t1=Math.max(K.t+1.9,K.at('target under first',.2)+.4);const shT=[380,SH+480],shL=[900,SH+480];
    enter(HT,t1-.9,t1,grip(cT,TL,L.s,'teacher'),'pinch',shT);take(cT,HT,t1);cT.tr.move(t1,t1+.3,{l:1});
    const dF=at(L,ctr(M.first));carryTo(cT,HT,t1+.3,t1+1.35,dF);release(cT,t1+1.35);cT.tr.move(t1+1.35,t1+1.6,{l:0});cT.where.set(t1+1.6,'bd');leave(HT,t1+1.7,t1+2.5);
    const t2=Math.max(t1+1.6,K.at('chosen item',.42)-.2);
    enter(HL,t2-.9,t2,grip(cC,TR,L.s,'learner'),'pinch',shL);take(cC,HL,t2);cC.tr.move(t2,t2+.3,{l:1});
    const dT=at(L,ctr(M.then));carryTo(cC,HL,t2+.3,t2+1.35,dT);release(cC,t2+1.35);cC.tr.move(t2+1.35,t2+1.6,{l:0});cC.where.set(t2+1.6,'bd');leave(HL,t2+1.7,t2+2.5);
    const g1=Math.max(t2+1.8,K.at('first the target',.8)),g2=Math.max(g1+.7,K.at('then the item',.9));glowAt(L,M.first,6,g1,1.5);glowAt(L,M.then,6,g2,1.5);
    return Math.max(t2+2.6,g2+1.5)-K.t;};
  SC.tk_page=K=>{toSession(K.t+.15,1.4);const t1=Math.max(K.t+1.7,K.at('where the tokens wait',.4));
    TK.forEach((c,i)=>{c.pops.tk=[t1+i*.18];});const t2=Math.max(t1+.4+n*.18,K.at('empty slots',.62));
    M.slot.forEach((r,i)=>glowAt(BDS,r,4,t2+i*.2,1.3));return Math.max(K.d,t2+n*.2+1.3-K.t);};
  SC.rule=K=>{let t=K.t;if(!session){toSession(t+.1,1.4);t+=1.4;}const tc=Math.max(t+.3,K.at('this example',.8)-.2);chip.tr.move(tc,tc+.4,{o:1,s:1},0,easeOut);return tc+.7-K.t;};
  SC.start=K=>{const sh=[1110,SH+480];const pF=pointAt(at(BDS,ctr(M.first)),sBd),pT=pointAt(at(BDS,ctr(M.then)),sBd);
    const tp1=Math.max(K.t+1,K.at('first the target',.42)),tp2=Math.max(tp1+1,K.at('then the item',.52));
    enter(HT,tp1-.9,tp1,pF,'point',sh);handTo(HT,tp2-.6,tp2,pT,.12);leave(HT,tp2+.6,tp2+1.4);
    glowAt(BDS,M.first,6,tp1-.1,1.3);glowAt(BDS,M.then,6,tp2-.1,1.3);
    const tr0=Math.max(tp2+.3,K.at('the ring',.62));ringEl.tr.move(tr0,tr0+.45,{o:1,s:1},0,easeOut);ringPending=tr0+.6;
    return tr0+1.6-K.t;};
  SC.tok_first=K=>{const tEnd=K.t+.6;ringInt(ringPending==null?K.t-3:ringPending,tEnd,true);ringPending=null;
    const grab=Math.max(tEnd+.75,K.at('give a token',.35)),atHO=grab+1;const bub=Math.max(atHO+.1,K.at('brief praise',.55)-.2);const tk=Math.max(bub+1.1,K.at('your learner places',.8)+.3);
    const end=deliver(0,{t0:grab-.85,grab,atHO,text:PR.first,bub,bubDur:Math.max(2.4,tk-bub+.6),take:tk,place:tk+1,lin:.9});
    return end-K.t+.2;};
  /* the ring runs out without the behavior: no token; the earned token stays (it glows); the teacher points to the target; the next interval starts */
  SC.tok_none=K=>{const t1=Math.max(K.t+2.4,Math.min(K.t+3.6,K.at('give no token',.4)-.2));ringInt(K.t+.3,t1,false);noTok.tr.move(t1,t1+.3,{o:1,s:1},0,easeOut);
    const te=Math.max(t1+.6,K.at('earned tokens',.5));for(let i=0;i<Math.min(1,n);i++)glowAt(BDS,M.slot[i],5,te,1.6);
    const tr=Math.max(te+1.4,K.at('remind your learner',.62));const pF=pointAt(at(BDS,ctr(M.first)),sBd);enter(HT,tr-.8,tr,pF,'point',[1110,SH+480]);glowAt(BDS,M.first,6,tr,1.4);
    const tn=Math.max(tr+1.2,K.at('start the next interval',.85));leave(HT,tn-.2,tn+.6);noTok.tr.move(Math.max(tr+.2,tn-.5),tn-.1,{o:0});ringPending=tn;
    return Math.max(K.d,tn+.8-K.t);};
  SC.tok_more=K=>{const idx=[];for(let i=1;i<n-1;i++)idx.push(i);if(!idx.length)return K.d;
    const want=(K.d+.4)/idx.length;let T=K.t+.25,end=K.t;
    if(want>=2.4){const cy=Math.min(4,want),ri=cy-1.4;   /* a few tokens: each one in full, the hands come in and go */
      idx.forEach((i,j)=>{ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;end=deliver(i,{t0:D-.05,grab:D+.5,atHO:D+1.05,text:PR.more[j%PR.more.length],bubDur:1.7,take:D+1.25,place:D+1.85,lin:.7});T+=cy;});}
    else{const cy=Math.max(1.75,want),ri=cy-.5;   /* a big board: the intervals follow one another and both hands stay in the frame from token to token */
      idx.forEach((i,j)=>{const last=j===idx.length-1;ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;
        end=deliver(i,{t0:D-.05,grab:D+.45,atHO:D+.95,text:PR.more[j%PR.more.length],bubDur:Math.min(1.6,cy-.1),take:D+1.2,place:D+1.75,lin:.6,tIn:j>0,lIn:j>0,stay:!last});T+=cy;});}
    ringPending=null;
    return end-K.t+.1;};
  SC.tok_last=K=>{const i=n-1,T=K.t+.2,ri=2.2;ringInt(ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);ringPending=null;const D=T+ri;
    const tk=F.term?Math.max(D+2.6,K.at('board is finished',.6)):D+1.6;
    const end=deliver(i,{t0:D-.05,grab:D+.55,atHO:D+1.2,text:PR.last,bub:D+1.3,bubDur:F.term?Math.max(2.6,tk-D-.7):2.6,take:tk,place:tk+.9,lin:.8});
    if(F.term){const c=TK[i];c.glowT=[D+.6,tk+1.6];glowAt(BDS,M.slot[i],8,tk+.9,2,true);}
    else M.slot.forEach((r,j)=>glowAt(BDS,r,4,tk+1+j*.08,1.4));
    ringEl.tr.move(end+.2,end+.7,{o:0,s:.9});return end-K.t+.8;};
  SC.exchange=K=>{const t=K.t;chip.tr.move(t,t+.5,{o:0});ringEl.tr.move(t,t+.5,{o:0});veil.tr.move(t+.2,t+.8,{o:.32});
    const c=cC,P0=at(BDS,ctr(M.then)),CEN={x:640,y:292},big=sBd*1.5;
    c.tr.set(t+.3,{x:P0.x,y:P0.y,s:sBd,l:0,o:1});c.where.set(t+.3,'fly');c.tr.move(t+.3,t+.65,{l:1});c.tr.move(t+.65,t+1.6,{x:CEN.x,y:CEN.y,s:big},.1);
    const is=big*CW/IW;item.tr.set(t+1.45,{x:CEN.x,y:CEN.y,s:is,l:1,o:0});item.where.set(t+1.45,'fly');item.tr.move(t+1.45,t+2.05,{o:1});c.tr.move(t+1.45,t+2.05,{o:0});c.where.set(t+2.1,'none');
    const tg=Math.max(t+2.8,K.at('your learner gets',.62)-1.1);const PALM={x:640,y:372};
    enter(HT,tg-.9,tg,grip(item,CEN,is,'teacher'),'pinch',[1110,SH+480]);take(item,HT,tg);
    const pa=ART.learner.open;enter(HL,tg-.3,tg+.7,PALM,'open',[300,SH+480]);
    const drop={x:PALM.x+2,y:PALM.y+12};item.tr.move(tg,tg+1.2,{s:.8});carryTo(item,HT,tg+.1,tg+1.2,drop);
    release(item,tg+1.2);item.tr.move(tg+1.2,tg+1.45,{l:.25});take(item,HL,tg+1.25);leave(HT,tg+1.35,tg+2.1);
    return Math.max(K.d,tg+2.4-K.t);};
  SC.reset=K=>{const r=K.t;leave(HL,r+.2,r+1.1);item.where.set(r+1.15,'none');veil.tr.move(r+.2,r+.8,{o:0});
    const gap=Math.min(.22,1.6/n),r1=Math.max(r+1,K.at('put the tokens back',.3)-.5);TK.forEach((c,i)=>{const ts=r1+i*gap,sp=at(BDS,ctr(M.slot[i])),dp=at(TKS,ctr(M.ybx[i]));c.tr.set(ts,{x:sp.x,y:sp.y,s:sBd,l:0,o:1});c.where.set(ts,'fly');
      c.tr.move(ts,ts+.2,{l:1});c.tr.move(ts+.2,ts+.85,{x:dp.x,y:dp.y,s:sTk},.22);c.tr.move(ts+.85,ts+1,{l:0});c.where.set(ts+1,'tk');});
    let t=r1+(n-1)*gap+1.1;toBook(t,1.1);t+=1.15;
    const fB=at(BOOK('bd'),ctr(M.first));cT.tr.set(t,{x:fB.x,y:fB.y,s:sBk,l:0,o:1});cT.where.set(t,'fly');cT.tr.move(t,t+.25,{l:1});cT.tr.move(t+.25,t+.9,{x:TL.x,y:TL.y},.15);
    cC.tr.set(t,{x:TR.x+60,y:SH+170,s:sBk,l:1,o:1});cC.where.set(t,'fly');cC.tr.move(t+.1,t+.9,{x:TR.x,y:TR.y},.1);
    pageTurn('tg',t+.5,t+1.35,true);
    const pT=at(BOOK('tg'),ctr(M.tg[F.pick.tg]));cT.tr.move(t+1.4,t+2.1,{x:pT.x,y:pT.y},.15);cT.tr.move(t+2.1,t+2.3,{l:0});cT.where.set(t+2.3,'tg');
    pageTurn('ch',t+2.3,t+3.1,true);
    const pC=at(BOOK('ch'),ctr(M.ch[F.pick.ch]));cC.tr.move(t+3.1,t+3.8,{x:pC.x,y:pC.y},.15);cC.tr.move(t+3.8,t+4,{l:0});cC.where.set(t+4,'ch');t+=3.95;
    /* the learner looks over the choices again */
    const L=BOOK('ch'),pts=[2,4].filter(i=>CH[i]&&i!==F.pick.ch).concat([F.pick.ch]).slice(0,2).map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){enter(HL,t,t+.8,pts[0],'point',[820,SH+480]);for(let j=1;j<pts.length;j++)handTo(HL,t+.8+(j-1)*.75+.15,t+.8+j*.75,pts[j]);t+=.8+(pts.length-1)*.75+.3;leave(HL,t,t+.8);t+=.8;}
    return Math.max(K.d,t-K.t);};
  SC.tips=K=>{const t=K.t;stackTo(t,t+1,k=>BOOK(k,.52,40,170));tipsCard.tr.move(t+.5,t+1,{o:1,dy:0},0,easeOut);
    const fr=[['valuable',.06],['small requirement',.42],['only through the board',.8]];
    tipRows.forEach((fx,i)=>{const tt=Math.max(t+.9+i*.4,K.at(fr[i][0],fr[i][1])-.3);fx.tr.move(tt,tt+.45,{o:1,dy:0},0,easeOut);});return Math.max(K.d,2.5);};
  SC.outro=K=>{const t=K.t;tipsCard.tr.move(t,t+.5,{o:0,dy:10});stackTo(t+.2,t+1.4,k=>BOOK(k,Math.min(.7,430/maxH),null,24));cyc.tr.move(t+.6,t+.9,{o:1});
    const after=K.text.toLowerCase().indexOf('cycle');const w=[['choose',.3],['set the target',.42],['earn',.55],['exchange',.68]];let last=t+1;
    cycItems.forEach((fx,i)=>{const tt=Math.max(t+1+i*.35,K.at(w[i][0],w[i][1],after)-.1);fx.tr.move(tt,tt+.4,{o:1,s:1,dy:0},0,easeOut);last=tt;});
    return Math.max(K.d,last+1.2-K.t);};

  /* ---- the timeline ---- */
  const ids=LIST.map(id=>id==='tok_last'&&F.term?'tok_last_term':id).filter(id=>!OPT[id]||present(id));
  let T=0;const cues=[];
  ids.forEach(id=>{const ln=line(id),low=ln.t.toLowerCase();
    const K={id,t:T,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return T+ln.d*(i<0?fr:i/Math.max(1,low.length));}};
    const need=(SC[id==='tok_last_term'?'tok_last':id](K))||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T,dur,narr:ln.d,text:ln.t,chapter:CHOF[id],chunks:chunks(ln.t,ln.d,T),a:ln.a});T+=dur;});
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return{id,label,start:c?c.start:0};});
  return{D:T,cues,chapters,PG,cards,hands,fxs,ring,cap,notes,item,F};
}
/* captions: a line in pieces of up to two caption lines, each shown for its share of the narration */
function chunks(text,d,T){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  const total=merged.reduce((a,p)=>a+p.length,0)||1;let acc=0;return merged.map(p=>{const c={t:T+d*acc/total,text:p};acc+=p.length;return c;});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  for(const k in B.PG){const p=B.PG[k],s=p.tr.at(v);css(p.el,'transform','translate('+f2(s.x)+'px,'+f2(s.y)+'px) scale('+s.s.toFixed(4)+')'+(s.ry?' rotateY('+f2(s.ry)+'deg)':''));
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001&&s.ry>-89.5?'visible':'hidden');css(p.shade,'opacity',f2(clamp(-s.ry/90,0,1)*.5));}
  for(const c of B.cards){const w=c.where.at(v).v;
    for(const k in c.inp){const e=c.inp[k];const on=w===k;css(e,'opacity',on?'1':'0');let sc=1;const pp=c.pops[k];if(on&&pp)for(const p of pp)sc=Math.max(sc,1+.08*bump(v,p,.6));css(e,'transform',sc!==1?'scale('+sc.toFixed(4)+')':'none');}
    if(!c.el)continue;
    const s=c.tr.at(v),p=cardPosOf(c,v),k=s.s*(1+.07*s.l),fl=w==='fly';
    css(c.el,'visibility',fl?'visible':'hidden');css(c.el,'opacity',fl?f2(s.o):'0');css(c.el,'transform','translate('+f2(p.x-c.w/2)+'px,'+f2(p.y-c.h/2)+'px) scale('+k.toFixed(4)+')');
    css(c.sh,'transform','translate('+f2(4+14*s.l)+'px,'+f2(5+20*s.l)+'px)');css(c.sh,'opacity',f2(.35+.3*s.l));
    if(c.glow){const g=c.glowT;css(c.glow,'opacity',g&&v>=g[0]&&v<=g[1]?f2(.55+.45*Math.sin((v-g[0])*5)):'0');}}
  for(const h of B.hands){const s=h.tr.at(v),ps=h.pose.at(v),ang=Math.atan2(s.x-s.sx,s.sy-s.y)*180/Math.PI,sc=h.base*s.s,u=clamp(ps.since/.14,0,1);
    const vis=s.y<SH+260;
    for(const name in h.poses){const P=h.poses[name];const o=name===ps.v?(ps.prev===name?1:u):name===ps.prev&&ps.prev!==ps.v?1-u:0;
      css(P.el,'opacity',f2(vis?o:0));css(P.el,'visibility',vis&&o>.001?'visible':'hidden');
      css(P.el,'transform','translate('+f2(s.x-P.ax)+'px,'+f2(s.y-P.ay)+'px) rotate('+f2(ang)+'deg) scale('+sc.toFixed(4)+')');}}
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.s!==1?'translate(0,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');}
  /* the timer ring */
  const R=B.ring;let p=0,state='idle';for(const I of R.ints){if(v>=I.t0&&v<I.t1){p=(v-I.t0)/(I.t1-I.t0);state='run';break;}if(v>=I.t1&&v<I.t1+.8){p=1;state=I.ok?'ok':'no';}}
  css(R.fg,'strokeDasharray',f2(R.C));css(R.fg,'strokeDashoffset',f2(R.C*(1-p)));css(R.fg,'stroke',state==='ok'?'#2f9e44':state==='no'?'#8c97a1':'#f08c00');
  const rem=Math.round(120*(1-(state==='run'?p:state==='idle'?0:1)));txt(R.t,state==='ok'?'✓':state==='no'?'–':Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'));
  /* captions follow the real time, also with reduced motion */
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
function folPos(c,f,t){const hp=f.h.tr.at(t),k=(c.tr.at(t).s||1)/(f.s0||1);return{x:hp.x+f.dx*k,y:hp.y+f.dy*k};}
function cardPosOf(c,t){for(const f of c.fol)if(t>=f.t0&&t<f.t1)return folPos(c,f,t);return c.tr.at(t);}

/* ---------------- the player: clock, narration, controls ---------------- */
let pos=0,playing=false,want=false,raf=0,soundOn=true,capsOn=true,busy=false;
const AU={ctx:null,gain:null,bufs:null,decoding:null,srcs:[],mode:'off',base:0,pos0:0,susp:false,webFail:false,html:{},cur:'',spoken:''};
function toAB(uri){const b=atob(uri.slice(uri.indexOf(',')+1));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;}
function ctx(){if(AU.ctx)return AU.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{AU.ctx=new C();AU.gain=AU.ctx.createGain();AU.gain.connect(AU.ctx.destination);}catch(e){AU.ctx=null;}return AU.ctx;}
function decodeAll(){if(AU.decoding)return AU.decoding;const L=audioLines()||{};AU.bufs={};
  AU.decoding=Promise.all(Object.keys(L).map(id=>new Promise(res=>{const a=L[id]&&L[id].a;if(!a){res();return;}let done=false;const fin=b=>{if(done)return;done=true;if(b)AU.bufs[id]=b;res();};
    try{const pr=AU.ctx.decodeAudioData(toAB(a),fin,()=>fin(null));if(pr&&pr.then)pr.then(fin,()=>fin(null));}catch(e){fin(null);}}))).then(()=>{if(!Object.keys(AU.bufs).length)AU.webFail=true;});
  return AU.decoding;}
function mode(){if(!soundOn)return 'off';const L=audioLines();if(L){if(!AU.webFail&&ctx())return 'web';try{if(typeof Audio!=='undefined'&&htmlEl().canPlayType('audio/mpeg'))return 'html';}catch(e){}}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance)return 'speech';return 'off';}
function clock(){if(!playing)return pos;return AU.mode==='web'&&AU.ctx?AU.pos0+(AU.ctx.currentTime-AU.base):AU.pos0+(performance.now()/1000-AU.base);}
function stopAudio(){AU.srcs.forEach(s=>{try{s.stop();}catch(e){}});AU.srcs=[];AU.susp=false;
  if(AU.html.el)try{AU.html.el.pause();}catch(e){}AU.cur='';try{if(window.speechSynthesis&&AU.mode==='speech')speechSynthesis.cancel();}catch(e){}}
function schedule(from){const c=AU.ctx;B.cues.forEach(q=>{const b=AU.bufs&&AU.bufs[q.id];if(!b||q.start+b.duration<=from)return;const s=c.createBufferSource();s.buffer=b;s.connect(AU.gain);
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
function play(){if(!B)build();if(!B||want)return;want=true;if(pos>=B.D-.05){pos=0;stopAudio();}
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  if(mode()==='web'){const c=AU.ctx;try{const r=c.resume();if(r&&r.catch)r.catch(()=>{});}catch(e){}
    try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}
    if(!AU.bufs||!AU.ready){busy=true;ui();decodeAll().then(()=>{AU.ready=true;busy=false;if(want)begin();else ui();});return;}}
  begin();}
function begin(){const m=mode();
  if(m==='web'&&AU.mode==='web'&&AU.susp&&Math.abs(pos-AU.suspPos)<1e-6){AU.susp=false;try{AU.ctx.resume();}catch(e){}playing=true;loop();ui();return;}
  stopAudio();AU.mode=m;AU.pos0=pos;playing=true;
  if(m==='web'){try{AU.ctx.resume();}catch(e){}AU.base=AU.ctx.currentTime;schedule(pos);}else AU.base=performance.now()/1000;
  if(m==='html'||m==='speech')tickAudio(pos);   /* the first sound starts inside the Play tap (iOS) */
  loop();ui();}
function loop(){cancelAnimationFrame(raf);const f=()=>{if(!playing)return;let t=clock();
    if(t>=B.D){pos=B.D;renderAt(pos);stop(false);pos=B.D;ui();return;}
    if(AU.mode==='html'||AU.mode==='speech')tickAudio(t);renderAt(t);uiTime(t);raf=requestAnimationFrame(f);};raf=requestAnimationFrame(f);}
/* stop(hard): pause; a soft pause of the Web Audio narration suspends the context so Play continues it */
function stop(hard){want=false;busy=false;if(playing){pos=clock();playing=false;cancelAnimationFrame(raf);}
  if(!hard&&AU.mode==='web'&&AU.ctx&&AU.srcs.length){try{AU.ctx.suspend();}catch(e){}AU.susp=true;AU.suspPos=pos;}else stopAudio();}
function pause(){stop(false);if(B)renderAt(pos);ui();}
function seek(t){if(!B)build();if(!B)return;const was=want;stop(true);pos=clamp(+t||0,0,B.D);renderAt(pos);uiTime(pos);if(was)play();else ui();}
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
  if(D.big){D.big.hidden=pl;D.big.setAttribute('aria-label',B&&pos>=B.D-.05?'Play the walkthrough again':pos>0?'Continue the walkthrough':'Play the walkthrough');}
  if(D.snd){D.snd.innerHTML=(soundOn?IC.snd:IC.mute)+'<span>Sound</span>';D.snd.setAttribute('aria-pressed',String(soundOn));D.snd.setAttribute('aria-label',soundOn?'Sound on':'Sound off');}
  if(D.cc){D.cc.setAttribute('aria-pressed',String(capsOn));D.player.classList.toggle('wk-nocap',!capsOn);}
  if(D.fs){const f=isFs();D.fs.innerHTML=(f?IC.fsx:IC.fs)+'<span>'+(f?'Exit full screen':'Full screen')+'</span>';D.fs.setAttribute('aria-label',f?'Exit full screen':'Full screen');}
  uiTime(pos);}
let lastSec=-1,lastCh='';
function uiTime(t){const D=dom();if(!D||!B)return;if(D.seek&&document.activeElement!==D.seek||D.seek&&!want)D.seek.value=String(Math.round(t*10)/10);
  const s=Math.floor(t);if(s!==lastSec){lastSec=s;txt(D.time,mmss(t)+' / '+mmss(B.D));if(D.seek)D.seek.setAttribute('aria-valuetext',mmss(t)+' of '+mmss(B.D));}
  let ch=B.chapters[0].id;for(const c of B.chapters)if(c.start<=t+.01)ch=c.id;
  if(ch!==lastCh){lastCh=ch;D.chaps.querySelectorAll('button').forEach(b=>{const on=b.dataset.ch===ch;b.setAttribute('aria-current',on?'step':'false');});}}
function uiBuilt(){const D=dom();if(!D||!B)return;D.seek.max=String(Math.round(B.D*10)/10);lastSec=-1;lastCh='';
  D.chaps.innerHTML=B.chapters.map(c=>'<button type="button" data-ch="'+c.id+'" aria-current="false" aria-label="Chapter: '+esc(c.label)+'">'+esc(c.label)+'</button>').join('');
  if(D.note){D.note.textContent=B.notes.join(' ');D.note.hidden=!B.notes.length;}
  if(D.tx)D.tx.innerHTML=B.chapters.map(ch=>'<h4>'+esc(ch.label)+'</h4>'+B.cues.filter(c=>c.chapter===ch.id).map(c=>'<p>'+esc(c.text)+'</p>').join('')).join('');}
function isFs(){const D=dom();const e=document.fullscreenElement||document.webkitFullscreenElement;return !!(D&&(e===D.player||D.player.classList.contains('wk-fs')));}
function fullscreen(){const D=dom();if(!D)return;const p=D.player;
  if(isFs()){if(p.classList.contains('wk-fs')){p.classList.remove('wk-fs');document.documentElement.classList.remove('wk-fs-on');}else{(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);}setTimeout(()=>{fit();ui();},60);return;}
  const rq=p.requestFullscreen||p.webkitRequestFullscreen;let ok=false;
  if(rq){try{const r=rq.call(p);ok=true;if(r&&r.catch)r.catch(()=>{p.classList.add('wk-fs');document.documentElement.classList.add('wk-fs-on');fit();ui();});}catch(e){ok=false;}}
  if(!ok){p.classList.add('wk-fs');document.documentElement.classList.add('wk-fs-on');}setTimeout(()=>{fit();ui();},60);}
/* the stage is drawn at 1280 x 720 and scaled to the width of the view (in full screen, to fit the screen) by one transform */
function fit(){const D=dom();if(!D)return;const f=isFs();let k;
  if(f){const bar=(D.player.querySelector('.wk-bar')||{}).offsetHeight||60,chs=D.chaps.offsetHeight||0;k=Math.max(.1,Math.min(window.innerWidth/SW,(window.innerHeight-bar-chs-24)/SH));D.frame.style.width=f2(SW*k)+'px';}
  else{D.frame.style.width='';k=Math.max(.1,(D.frame.clientWidth||SW)/SW);}
  css(D.stage,'transform','scale('+k.toFixed(5)+')');D.frame.style.height=f2(SH*k)+'px';D.player.classList.toggle('wk-small',k<.5);}
function wire(){const D=DOM;
  D.play.addEventListener('click',toggle);D.big.addEventListener('click',()=>{play();});
  D.restart.addEventListener('click',()=>{seek(0);if(!want)play();});
  /* dragging the bar while playing draws the frames and holds the sound; letting go plays on from there */
  let resume=false;D.seek.addEventListener('input',()=>{if(!B)return;if(want){resume=true;stop(true);}pos=clamp(+D.seek.value,0,B.D);renderAt(pos);uiTime(pos);});
  D.seek.addEventListener('change',()=>{if(resume){resume=false;play();}else ui();});
  D.cc.addEventListener('click',()=>{capsOn=!capsOn;ui();});
  D.snd.addEventListener('click',()=>{soundOn=!soundOn;if(want){const t=clock();seek(t);}else{stopAudio();AU.mode='off';}ui();});
  D.fs.addEventListener('click',fullscreen);
  D.chaps.addEventListener('click',e=>{const b=e.target.closest('button[data-ch]');if(!b||!B)return;const c=B.chapters.find(x=>x.id===b.dataset.ch);if(c)seek(c.start);});
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{setTimeout(()=>{fit();ui();},30);}));
  let lastW=-1;const onSize=()=>{const w=D.frame.clientWidth;if(w!==lastW){lastW=w;fit();}};
  if(window.ResizeObserver){new ResizeObserver(onSize).observe(D.player);}window.addEventListener('resize',()=>{lastW=-1;onSize();});
  window.addEventListener('orientationchange',()=>setTimeout(fit,200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&want)pause();});
  document.addEventListener('keydown',e=>{if(!document.body.classList.contains('view-walk')||e.altKey||e.ctrlKey||e.metaKey)return;const tg=e.target,tn=tg&&tg.tagName;
    if(tn==='INPUT'&&tg!==D.seek||tn==='TEXTAREA'||tn==='SELECT'||tg&&tg.isContentEditable)return;
    if(e.key===' '||e.key==='k'||e.key==='K'){if(tn==='BUTTON'&&e.key===' ')return;e.preventDefault();toggle();}
    else if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&tg!==D.seek){e.preventDefault();seek(clock()+(e.key==='ArrowLeft'?-5:5));}
    else if(e.key==='Escape'&&D.player.classList.contains('wk-fs')){fullscreen();}});}

/* ---------------- the view: leaving it pauses, entering it rebuilds from the current book ---------------- */
const setView0=setView;
setView=function(v){if(v!=='walk'&&(want||playing))pause();setView0(v);if(v==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();}};
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();
