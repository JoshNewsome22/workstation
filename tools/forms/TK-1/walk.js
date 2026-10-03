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
  tg_show:'Page two is the Targets page, where you choose what to teach: a new skill, or a replacement behavior from the behavior plan. If the target is asking for something, like a break, still give what was asked for, every time.',
  tg_pick:'Choose one target at a time. Agree with the other adults on exactly what counts, so everyone gives tokens for the same thing.',
  bd_place:'Page three is the Board. Place the target under First, and the chosen item under Then. Your learner can now see the plan: first the target, then the item.',
  tk_page:'Page four is the Tokens page, where the tokens wait. The empty slots on the board show your learner how many are left to earn. Make new tokens valuable first; the tips at the end show how.',
  rule:'Before you start, decide how much of the target behavior earns a token: how many times, or how long. Keep it small, so your learner can succeed. This example uses one token for every two minutes.',
  start:'Now start the session. Point to the board and name both pictures: first the target, then the item. The ring counts down each two-minute interval, sped up for this video.',
  tok_first:'The interval is over, and your learner kept up the target behavior the whole time. Give a token right away, with brief praise that names what they did. Let your learner put it in the next slot.',
  tok_none:'If the behavior stops, there is no token for that interval, but the earned tokens stay on the board. Calmly remind your learner what to do right away, and start the interval over when they begin again.',
  tok_more:'Each interval with the target behavior earns another token, given right away with a few words of praise. The board fills up, one slot at a time.',
  tok_last_term:'One more interval earns the last token. It looks different: this is the terminal token, earned just like the others. With practice, it tells your learner that the board is finished and the item comes next.',
  tok_last:'One more interval with the target behavior, and the last token goes in. Now the board is full, and your learner has earned the item they chose.',
  exchange:'The board is full, so trade the tokens for the Then item right away, especially while the board is new. Your learner gets it for the time or amount set before the session.',
  reset:'When the time with the item is up, put it away, and return the pictures to their pages. Then your learner chooses again for the next round.',
  tips:'Three tips. Make the tokens valuable first: give one and trade it for the item right away, again and again, until your learner reaches for the token. Start with a small requirement and few tokens, and raise them slowly; if the behavior falls apart, go back a step. Keep the item available only through the board.',
  outro:'That\'s the whole cycle: choose, set the target, earn the tokens, and exchange. Over time, the target behavior should happen more often; if not, change the item or the requirement. The back of each page tells you more.'
};
/* the simulator's pictures, shown when a page's six cards are empty */
const SAMPLE={ch:[['ipad','Tablet'],['puzzle','Puzzle'],['ball','Ball'],['bubbles','Bubbles'],['lego','Building blocks'],['drawing','Drawing']],
  tg:[['sitting','Sitting'],['raisehand','Raise hand'],['writing','Writing'],['waiting','Waiting'],['alldone','All done'],['reading','Reading']]};
/* brief praise that names the behavior: an ongoing behavior named by its -ing word reads as itself (Sitting: "Great sitting!");
   any other target is named after the praise ("Great job: raise hand!"), so the praise always says what was done */
const NOTGER=/^(bring|sing|ring|string|swing|thing|king|spring|sting|wing|sling|cling|fling|bling|ping)$/;
function gerund(label){const l=String(label||'').trim().toLowerCase();const w=(l.match(/^[a-z]+/)||[''])[0];return w.length>=5&&/ing$/.test(w)&&!NOTGER.test(w)&&l.length<=20;}
function praiseFor(label){const raw=String(label||'').trim().replace(/[.!?]+$/,''),l=raw.toLowerCase(),ger=gerund(l);
  const nm=raw?(/^[A-Z][a-z]/.test(raw)?raw[0].toLowerCase()+raw.slice(1):raw):'';
  if(ger)return{ger,name:l,first:'Great '+l+'!',last:'You did it! Great '+l+'!',
    more:['Nice '+l+'!','Way to keep '+l+'!','Good '+l+'!','You kept '+l+'!','Super '+l+'!','Great job '+l+'!','Nice job '+l+'!','Still '+l+'!']};
  if(!nm)return{ger,name:'',first:'Great job!',last:'You did it! Great job!',more:['Nice work!','Way to go!','Good job!','Keep it up!','Super job!','Great work!','Nice job!','You are doing it!']};
  return{ger,name:nm,first:'Great job: '+nm+'!',last:'You did it! Great job: '+nm+'!',
    more:['Nice work: '+nm+'!','Way to go: '+nm+'!','Good job: '+nm+'!','Super job: '+nm+'!','Great work: '+nm+'!','Nice job: '+nm+'!','Yes: '+nm+'!','Well done: '+nm+'!']};}

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
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
const handArt=()=>(typeof WALK_HANDS!=='undefined'&&WALK_HANDS&&WALK_HANDS.learner&&WALK_HANDS.teacher)?WALK_HANDS:placeholderHands();
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
/* where each phrase starts in its recording (seconds from the start of the clip, by the character it starts at), measured from the
   voice (the start of each caption piece, each clause, and each phrase an action is tied to); a line whose text has changed since
   it was measured falls back to its share of the characters. Made with the voice by a script outside the repo; keyed by a hash of the text. */
/* MK:BEGIN */const MK={};/* MK:END */
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
  const Lp=layer('wk-pages'),Lveil=layer('wk-veil'),Lfly=layer(),Lhl=layer('wk-hl'),Lht=layer('wk-ht'),Lfx=layer('wk-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  /* the book, drawn from the forced copy of the state */
  /* the demo target: the first one that is an ongoing behavior (an -ing word, which suits a two-minute interval), else the first */
  const F=forced(()=>{const used=o=>has(o)||String(o.l||'').trim();const gi=S.tg.findIndex(o=>used(o)&&gerund(lbl(o)));
    const pk={ch:firstUsed(S.ch),tg:gi>=0?gi:firstUsed(S.tg)},n=nTok(),cpt=CPT/72,tpt=TPT/72;
    return{pg:{ch:pageGrid('ch'),tg:pageGrid('tg'),bd:pageBoard(),tk:pageTokens(),chb:pageBack('ch')},
      ch:S.ch.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),tg:S.tg.map(o=>has(o)||String(o.l||'').trim()?cardHtml(o,cpt):''),
      tok:Array.from({length:n},(_,i)=>tokCard(tpt,i===n-1)),chipTok:tokCard(.6,false),n,term:termOn(),pick:pk,
      itemPic:pic(S.ch[pk.ch],''),itemLbl:String(lbl(S.ch[pk.ch])||'').trim(),tgLbl:String(lbl(S.tg[pk.tg])||'').trim()};});
  const PR=praiseFor(F.tgLbl);
  const notes=[];
  if(S.meta.layout==='rules')notes.push('This book’s Board uses the Rules row (several targets and an Earn box); the walkthrough shows the First-Then Board. Tokens, praise and the exchange work the same way; agree on exactly what earns each token.');
  const libGone=!!window.NBH_PICTOS_MISSING,sampleWord=libGone?'sample words':'sample pictures';
  if(libGone&&[...S.ch,...S.tg,S.tok&&S.tok[0]].some(o=>o&&o.k&&!/^(tk|av):/.test(o.k)))notes.push('The picture library (nbh-pictos.js) is not beside this form, so its pictures are missing here and in the book; put it in the same folder.');
  if(emptySix(S.ch)&&emptySix(S.tg))notes.push('The Choices and Targets are still empty, so the walkthrough shows '+sampleWord+'.');
  else if(emptySix(S.ch))notes.push('The Choices are still empty, so the walkthrough shows '+sampleWord+' for them.');
  else if(emptySix(S.tg))notes.push('The Targets are still empty, so the walkthrough shows '+sampleWord+' for them.');
  if(!audioLines())notes.push('The recorded narration is not in this copy of the form: the captions are read by the device’s own voice where it has one.');
  /* the four pages: the page itself (the canvas), no sheet and no trim marks */
  const PG={};['tk','bd','tg','ch','chb'].forEach(k=>{const el=div('wk-page');el.dataset.pg=k;el.innerHTML=F.pg[k];Lp.appendChild(el);
    const pg=el.querySelector('.pg'),cv=pg.querySelector('.cv');pg.querySelectorAll('.trim').forEach(x=>x.remove());cv.style.left='0';cv.style.top='0';
    const lay=div('wk-lay'),shade=div('wk-shade');cv.appendChild(lay);cv.appendChild(shade);PG[k]={k,el,pg,cv,lay,shade};});
  Object.values(PG).forEach(p=>{p.w=p.cv.offsetWidth;p.h=p.cv.offsetHeight;p.el.style.width=p.w+'px';p.el.style.height=p.h+'px';p.pg.style.width=p.w+'px';p.pg.style.height=p.h+'px';
    if(p.k!=='chb')p.cv.insertAdjacentHTML('beforeend',coilSvg(p.h));});
  const rel=(p,el)=>{const r=el.getBoundingClientRect(),c=p.cv.getBoundingClientRect(),k=c.width/(p.cv.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const ctr=r=>({x:r.x+r.w/2,y:r.y+r.h/2});
  const M={ch:[...PG.ch.cv.querySelectorAll('.bx')].map(e=>rel(PG.ch,e)),tg:[...PG.tg.cv.querySelectorAll('.bx')].map(e=>rel(PG.tg,e)),
    first:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.grey')),then:rel(PG.bd,PG.bd.cv.querySelector('.bx.ft.green')),
    slot:[...PG.bd.cv.querySelectorAll('.slot')].map(e=>rel(PG.bd,e)),ybx:[...PG.tk.cv.querySelectorAll('.ybx')].map(e=>rel(PG.tk,e)),
    tab:{},band:rel(PG.ch,PG.ch.cv.querySelector('.band'))};
  M.tabCol={};['ch','tg','bd','tk'].forEach(k=>{const e=PG[k].cv.querySelector('.tab');M.tab[k]=rel(PG[k],e);M.tabCol[k]=getComputedStyle(e).backgroundColor||'#1d4a77';});
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
  const itemLabel=F.itemLbl?F.itemLbl+', as agreed':'The item, as agreed';   /* the time or amount is set before the session (no number that echoes the interval) */
  const IW=250;const item=mkCard('item','<div class="wk-ipic">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div><div class="wk-ilbl">'+esc(itemLabel)+'</div>',IW,IW,'wk-item');
  /* the hands */
  const ART=handArt(),hands=[];
  const mkHand=who=>{const root=div('wk-hand wk-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);const h={who,root,poses:{},base:HS[who],tr:new Track({x:640,y:SH+700,s:1,sx:640,sy:SH+800}),pose:new Steps('point'),lifts:[]};
    ['point','pinch','open'].forEach(p=>{const a=ART[who][p];const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose',a.svg);e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=f2(an[0])+'px '+f2(an[1])+'px';root.appendChild(e);const wr=a.wrist||[a.w/2,a.h*.24];h.poses[p]={el:e,ax:an[0],ay:an[1],wx:wr[0],wy:wr[1]};});
    hands.push(h);return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* layouts: the closed book centred; the session (the Board large on the left, the Tokens page smaller on the right) */
  const pw=PG.ch.w,ph=PG.ch.h,maxH=Math.max(PG.ch.h,PG.tg.h,PG.bd.h,PG.tk.h);
  const sBk=Math.min(.86,566/maxH),bx=(SW-pw*sBk)/2,by=30;
  const DEPTH={chb:0,ch:0,tg:1,bd:2,tk:3};
  const BOOK=(k,s,x,y)=>{s=s||sBk;const X=x==null?(SW-pw*s)/2:x,Y=y==null?by:y;return{x:X+DEPTH[k]*2.2*s/sBk,y:Y+DEPTH[k]*2.6*s/sBk,s};};
  /* each person keeps one seat for the whole video: the learner on the left, the teacher on the right; a picked card waits on the
     table on its own person's side (the chosen item on the left, the target on the right; two places on the right for the reset) */
  const TL={x:bx/2,y:by+ph*sBk*.5},TR={x:SW-bx/2,y:by+ph*sBk*.5},TRa={x:SW-bx/2,y:by+ph*sBk*.27},TRb={x:SW-bx/2,y:by+ph*sBk*.75};
  const sBd=Math.min(.8,520/PG.bd.h),sTk=.52;
  const BDS={x:26,y:30,s:sBd},TKS={x:SW-26-pw*sTk,y:Math.min(300,604-PG.tk.h*sTk),s:sTk};
  const RC={x:TKS.x+pw*sTk/2,y:Math.max(150,TKS.y-112)};
  const HO={x:(BDS.x+pw*sBd+TKS.x)/2,y:Math.max(220,TKS.y-24)};   /* where the teacher holds a token out: in the gap between the Board and the Tokens page */
  const at=(L,c)=>({x:L.x+L.s*c.x,y:L.y+L.s*c.y});
  const s0=sBk*.93;
  Object.keys(PG).forEach(k=>{const b=BOOK(k,s0,(SW-pw*s0)/2,by+ph*(sBk-s0)/2);PG[k].tr=new Track({x:b.x,y:b.y,s:b.s,ry:0,o:k==='chb'?0:1,fx:1});PG[k].el.style.zIndex=String(k==='chb'?11:10-DEPTH[k]);});
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';if(box.b!=null){e.style.top='auto';e.style.bottom=f2(SH-box.b)+'px';}else e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  /* a glow fades in over 0.3 s: callers start it 0.15 s before the word, so it peaks on the word */
  const pulse=(fx,t0,dur,s)=>{fx.tr.move(t0,t0+.3,{o:1,s:s||1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glowAt=(L,r,pad,t0,dur,round)=>{const p=pad||6;const g=mkFx('wk-glow'+(round?' round':''),'',{x:L.x+L.s*r.x-p,y:L.y+L.s*r.y-p,w:L.s*r.w+2*p,h:L.s*r.h+2*p});pulse(g,t0,dur);return g;};
  const veil={el:Lveil,tr:new Track({o:0,s:1,dy:0,dx:0})};fxs.push(veil);
  /* the four tabs named as they are read: a label in each tab's colour beside it */
  const tabLbl={};[['ch','Choices'],['tg','Targets'],['bd','Board'],['tk','Tokens']].forEach(([k,w])=>{const L=BOOK(k),r=M.tab[k];
    const fx=mkFx('wk-tabl',esc(w),{x:L.x+L.s*(r.x+r.w)+14,y:L.y+L.s*(r.y+r.h/2)-24},{s:.8,dx:-10});fx.el.style.borderColor=M.tabCol[k];fx.el.style.setProperty('--tc',M.tabCol[k]);tabLbl[k]=fx;});
  const ringBox={x:RC.x-74,y:RC.y-74,w:148,h:148};
  const ringEl=mkFx('wk-ring','<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="84"/><circle class="fg" cx="100" cy="100" r="84" transform="rotate(-90 100 100)"/></svg><div class="wk-rt">2:00</div><div class="wk-rl">sped up for this video</div>',ringBox,{s:.7});
  const ring={fx:ringEl,fg:ringEl.el.querySelector('.fg'),t:ringEl.el.querySelector('.wk-rt'),ints:[],C:2*Math.PI*84};
  /* the rule: "1 token for ..." first, then the example filled in */
  const chip=mkFx('wk-chip','<span class="wk-ct">'+F.chipTok+'</span><span class="wk-cst"><span class="wk-c0"><b>1 token</b> for <span class="wk-blank"></span></span><span class="wk-c1"><b>1 token</b> for every<br><b>2 minutes</b> of '+(PR.ger?esc(PR.name):'the target')+'</span></span>',{x:RC.x-185,y:12,w:370},{s:.8});
  const chip0=sub(chip.el.querySelector('.wk-c0'),{o:1}),chip1=sub(chip.el.querySelector('.wk-c1'));
  const ricN=mkFx('wk-ric','<svg viewBox="0 0 64 44" aria-hidden="true"><path d="M8 6v32M18 6v32M28 6v32M38 6v32M2 34L46 10" stroke="#1d4a77" stroke-width="5" stroke-linecap="round" fill="none"/><text x="50" y="40" font-size="0"></text></svg><span>How many times</span>',{x:RC.x-182,y:104,w:172},{s:.7,dy:8});
  const ricL=mkFx('wk-ric','<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#fff" stroke="#1d4a77" stroke-width="4.5"/><path d="M22 10v12l8 6" stroke="#ef7d00" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg><span>How long</span>',{x:RC.x+10,y:104,w:172},{s:.7,dy:8});
  const noTok=mkFx('wk-note2','<b>No token</b> this interval.<br>Earned tokens stay.',{x:RC.x-84-262,y:RC.y-44,w:262},{s:.9});
  /* the praise bubble: over the token the teacher holds out (between the Board and the Tokens page), not over the pictures; its
     bottom stays put, so a longer name wraps upward; marked, the words that name the behavior are underlined */
  const bubble=(text,t0,dur,mark)=>{let h=esc(text);if(mark&&PR.name){const e=esc(PR.name),i=h.lastIndexOf(e);if(i>=0)h=h.slice(0,i)+'<span class="wk-nm">'+e+'</span>'+h.slice(i+e.length);}
    const b=mkFx('wk-bub',h,{x:clamp(HO.x-165,10,SW-340),b:HO.y-TW*sBd/2-50,w:330},{s:.6,dy:12});
    b.tr.move(t0,t0+.3,{o:1,s:1,dy:0},0,easeOut);b.tr.move(t0+dur-.3,t0+dur,{o:0,dy:-8});return b;};
  const tipsCard=mkFx('wk-tips','<h3>Three tips</h3>'+'<div class="wk-tip" data-i="0"><b>1</b><p><strong>Make the tokens valuable first.</strong> Give a token and trade it for the item right away, again and again, until your learner reaches for the token.</p></div>'
    +'<div class="wk-tip" data-i="1"><b>2</b><p><strong>Start small.</strong> Ask for a little behavior and use few tokens, then raise them slowly; if the behavior falls apart, go back a step.</p></div>'
    +'<div class="wk-tip" data-i="2"><b>3</b><p><strong>Only through the board.</strong> Keep the Then item put away at other times.</p></div>',{x:520,y:44,w:720},{dy:16});
  const tipRows=[...tipsCard.el.querySelectorAll('.wk-tip')].map(e=>sub(e,{dy:14,h:0}));
  /* tip one, shown under the book: a token given, then traded for the item at once */
  const PDX=196;
  const pair=mkFx('wk-pair','<div class="wk-pt">'+F.chipTok+'</div><div class="wk-pa">→</div><div class="wk-pi">'+(F.itemPic||'<span>'+esc(F.itemLbl||'Item')+'</span>')+'</div>',{x:64,y:478,w:400,h:104});
  const pTok=sub(pair.el.querySelector('.wk-pt')),pItem=sub(pair.el.querySelector('.wk-pi'),{o:1});
  const cyc=mkFx('wk-cyc','',{x:90,y:478,w:1100});
  const cycArr=[];const cycItems=['Choose','Set the target','Earn the tokens','Exchange'].map((w,i)=>{if(i){const a=div('wk-cya','→');cyc.el.appendChild(a);cycArr[i]=sub(a,{dx:-6});}const e=div('wk-cy','<b>'+(i+1)+'</b>'+esc(w));cyc.el.appendChild(e);return sub(e,{s:.85,dy:10});});

  /* ---- choreography helpers (stage coordinates) ---- */
  /* where a hand holds a card (as a share of the card's size from its centre): the teacher, who reaches from the right, by its right
     edge; the learner, from the left, by its lower left; so at a hand-off the two hands meet on opposite sides */
  const GR={learner:[-.25,.46],teacher:[.46,.05]};
  const grip=(c,p,s,who,g)=>{g=g||GR[who];return{x:p.x+c.w*s*g[0],y:p.y+c.h*s*g[1]};};
  const pointAt=(p,s)=>({x:p.x,y:p.y+CW*s*.12});
  /* a longer move lifts the hand a little off the table (it grows a few per cent and settles) */
  const lift=(h,t0,t1,d)=>{if(d>150&&t1-t0>.25)h.lifts.push([t0,t1-t0]);};
  const handTo=(h,t0,t1,p,arc)=>{const a=h.tr.at(t0);lift(h,t0,t1,Math.hypot(p.x-a.x,p.y-a.y));h.tr.move(t0,t1,{x:p.x,y:p.y},arc==null?.14:arc);};
  /* in and out of the frame: from just below its bottom edge, along the line from the shoulder; the way in takes longer the
     further it goes (0.8 to 1.3 s) and slows down to land; it starts earlier rather than landing later */
  const offY=(h,pose)=>SH+34+h.base*h.poses[pose].ay;
  const offFrom=(p,sx,sy,y)=>{const dx=sx-p.x,dy=sy-p.y,len=Math.hypot(dx,dy)||1,k=(y-p.y)/Math.max(.2,dy/len);return{x:p.x+dx/len*k,y:p.y+dy/len*k};};
  const enter=(h,t0,t1,p,pose,sh)=>{const o=offFrom(p,sh[0],sh[1],offY(h,pose));const dur=clamp(Math.hypot(p.x-o.x,p.y-o.y)/700,.8,1.3);
    const st=Math.min(t1-.35,Math.max(Math.min(t0,t1-dur),h.tr.last().t+.02));h.tr.set(st,{x:o.x,y:o.y,sx:sh[0],sy:sh[1],s:1});h.pose.set(st,pose);h.tr.move(st,t1,{x:p.x,y:p.y},.04,easeOut);return st;};
  const leave=(h,t0,t1)=>{const s=h.tr.at(t0);const o=offFrom(s,s.sx,s.sy,offY(h,h.pose.at(t0).v));h.tr.move(t0,t1,{x:o.x,y:o.y},0,easeIn);};
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
  /* an interval of the ring: it runs from t0 to t1 (to the share f of the ring when the behavior stopped), then holds its ✓ or – until hold */
  const ringInt=(t0,t1,ok,o)=>{o=o||{};ring.ints.push({t0,t1,ok,f:o.f||1,hold:o.hold||t1+.8});};
  /* a token from the Tokens page to the Board: the teacher's hand takes it and holds it out with praise; the learner's hand takes it and puts it in its slot */
  const SHT=[1110,SH+480],SHL=[300,SH+480];
  const deliver=(i,o)=>{const c=TK[i],src=at(TKS,ctr(M.ybx[i])),dst=at(BDS,ctr(M.slot[i])),gp=grip(c,src,sTk,'teacher');
    /* o.tIn / o.lIn: that hand is still in the frame from the token before, and moves on from there (empty, it points; it pinches again
       just before it takes); o.stay: both hands stay for the next token */
    if(o.tIn){handTo(HT,o.t0,o.grab,gp,.12);HT.pose.set(Math.max(o.t0,o.grab-.3),'pinch');}else enter(HT,o.t0,o.grab,gp,'pinch',SHT);
    c.tr.set(o.grab,{x:src.x,y:src.y,s:sTk,l:0,o:1});take(c,HT,o.grab);c.tr.move(o.grab,o.grab+.25,{l:1});c.tr.move(o.grab+.25,o.atHO,{s:sBd});
    carryTo(c,HT,o.grab+.05,o.atHO,HO,.16);
    if(o.text)bubble(o.text,o.bub==null?o.atHO:o.bub,o.bubDur||2.2);
    const tk=o.take,hp=grip(c,cardPos(c,tk),sBd,'learner');
    if(o.lIn){handTo(HL,tk-(o.lin||.75),tk,hp,.1);HL.pose.set(tk-.3,'pinch');}else enter(HL,tk-Math.max(.9,o.lin||.9),tk,hp,'pinch',SHL);
    release(c,tk);take(c,HL,tk);if(!o.stay)leave(HT,tk+.08,tk+.8);else HT.pose.set(tk+.06,'point');
    carryTo(c,HL,tk+.05,o.place,dst);release(c,o.place);c.tr.move(o.place,o.place+.22,{l:0});c.where.set(o.place+.22,'bd');
    if(o.stay){HL.pose.set(o.place+.06,'point');return o.place+.3;}leave(HL,o.place+.3,o.place+1);return o.place+1;};

  /* ---- the scenes, one per narration line; each returns the time its animation needs ---- */
  const SC={};
  SC.intro=K=>{stackTo(K.t,K.t+1.6,k=>BOOK(k));
    const names=[['Choices','ch'],['Targets','tg'],['Board','bd'],['Tokens','tk']];let last=K.t+1.8;
    const after=K.text.toLowerCase().indexOf('tab');
    names.forEach(([w,k],j)=>{const t=Math.max(K.t+1.8+j*.3,K.at(w,.62+.1*j,after)-.15);const L=BOOK(k);glowAt(L,M.tab[k],5,t,1.6);
      tabLbl[k].tr.move(t,t+.3,{o:1,s:1,dx:0},0,easeOut);last=Math.max(last,t+1.6);});
    Object.values(tabLbl).forEach(fx=>fx.tr.move(last+.4,last+.8,{o:0}));
    const tb=Math.max(K.t+1.7,K.at('bound',.35)-.15);const L0=BOOK('ch');glowAt({x:L0.x,y:L0.y,s:L0.s},{x:-14,y:0,w:40,h:ph},4,tb,1.8);
    return last+.8-K.t;};
  SC.ch_show=K=>{glowAt(BOOK('ch'),M.tab.ch,5,K.t+.2,1.6);const ids=CH.map((c,i)=>c?i:-1).filter(i=>i>=0);
    ids.forEach((i,j)=>{CH[i].pops.ch=(CH[i].pops.ch||[]).concat(K.t+K.d*(.3+.55*j/Math.max(1,ids.length)));});return K.d;};
  /* the learner looks over two pictures (half-second moves, short stops), then takes the one they chose, as "picks one" is said */
  SC.ch_pick=K=>{const L=BOOK('ch'),c=cC;const P0=at(L,ctr(M.ch[F.pick.ch]));
    const scan=[4,2,1,5].filter(i=>CH[i]&&i!==F.pick.ch).slice(0,2);const pts=scan.map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    const land=Math.max(K.t+.9,K.at('looks over',.1)+.25);let tq=land;
    if(pts.length){enter(HL,K.t,land,pts[0],'point',SHL);for(let j=1;j<pts.length;j++){handTo(HL,tq+.3,tq+.8,pts[j]);tq+=.8;}}
    const gp=grip(c,P0,L.s,'learner'),tp=Math.max(tq+.3+.7,K.at('picks one',.3)+.2);
    if(pts.length){handTo(HL,tp-.7,tp-.05,gp,.12);HL.pose.set(tp-.7,'pinch');}else enter(HL,tp-1,tp-.05,gp,'pinch',SHL);
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HL,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HL,tp+.4,tp+1.5,TL,.2);release(c,tp+1.5);c.tr.move(tp+1.5,tp+1.75,{l:0});
    leave(HL,tp+1.85,tp+2.6);return tp+2.7-K.t;};
  SC.tg_show=K=>{pageTurn('ch',K.t+.15,K.t+1.05);glowAt(BOOK('tg'),M.tab.tg,5,K.t+.9,1.6);
    const ids=TG.map((c,i)=>c?i:-1).filter(i=>i>=0);ids.forEach((i,j)=>{TG[i].pops.tg=(TG[i].pops.tg||[]).concat(K.t+1.2+(K.d*.6-1.2)*(.3+.55*j/Math.max(1,ids.length)));});return Math.max(K.d,2);};
  SC.tg_pick=K=>{const L=BOOK('tg'),c=cT;const P0=at(L,ctr(M.tg[F.pick.tg]));
    const other=[1,3,5,0].filter(i=>TG[i]&&i!==F.pick.tg)[0];const tp=Math.max(K.t+2.2,K.at('one target',.12)+.9);const gp=grip(c,P0,L.s,'teacher');
    if(other!=null){enter(HT,K.t,K.t+1.0,pointAt(at(L,ctr(M.tg[other])),L.s),'point',SHT);handTo(HT,tp-.75,tp-.05,gp,.12);HT.pose.set(tp-.75,'pinch');}
    else enter(HT,tp-1,tp-.05,gp,'pinch',SHT);
    c.tr.set(tp,{x:P0.x,y:P0.y,s:L.s,l:0,o:1});take(c,HT,tp);c.tr.move(tp,tp+.35,{l:1});
    carryTo(c,HT,tp+.4,tp+1.4,TR,.2);release(c,tp+1.4);c.tr.move(tp+1.4,tp+1.65,{l:0});leave(HT,tp+1.75,tp+2.5);return tp+2.6-K.t;};
  SC.bd_place=K=>{pageTurn('tg',K.t+.15,K.t+1.05);const L=BOOK('bd');glowAt(L,M.tab.bd,5,K.t+.9,1.4);
    const t1=Math.max(K.t+1.9,K.at('target under first',.2)+.2);
    enter(HT,t1-.9,t1,grip(cT,TR,L.s,'teacher'),'pinch',SHT);take(cT,HT,t1);cT.tr.move(t1,t1+.3,{l:1});
    const dF=at(L,ctr(M.first));carryTo(cT,HT,t1+.3,t1+1.3,dF);release(cT,t1+1.3);cT.tr.move(t1+1.3,t1+1.55,{l:0});cT.where.set(t1+1.55,'bd');leave(HT,t1+1.65,t1+2.4);
    const t2=Math.max(t1+1.5,K.at('chosen item',.42)+.1);
    enter(HL,t2-.9,t2,grip(cC,TL,L.s,'learner'),'pinch',SHL);take(cC,HL,t2);cC.tr.move(t2,t2+.3,{l:1});
    const dT=at(L,ctr(M.then));carryTo(cC,HL,t2+.3,t2+1.3,dT);release(cC,t2+1.3);cC.tr.move(t2+1.3,t2+1.55,{l:0});cC.where.set(t2+1.55,'bd');leave(HL,t2+1.65,t2+2.4);
    const g1=Math.max(t2+1.6,K.at('first the target',.8)-.15),g2=Math.max(g1+.7,K.at('then the item',.9)-.15);glowAt(L,M.first,6,g1,1.5);glowAt(L,M.then,6,g2,1.5);
    return Math.max(t2+2.5,g2+1.5)-K.t;};
  SC.tk_page=K=>{toSession(K.t+.15,1.4);const t1=Math.max(K.t+1.7,K.at('where the tokens wait',.4)-.1);
    TK.forEach((c,i)=>{c.pops.tk=[t1+i*.18];});const t2=Math.max(t1+.4+n*.18,K.at('empty slots',.62)-.15);
    M.slot.forEach((r,i)=>glowAt(BDS,r,4,t2+i*.2,1.3));
    const t3=Math.max(t2+n*.2+1,K.at('valuable first',.8)-.15);TK.forEach((c,i)=>{c.pops.tk.push(t3+i*.06);});
    return Math.max(K.d,t2+n*.2+1.3-K.t);};
  /* the rule: what earns a token (how many times, or how long), then the example filled in */
  SC.rule=K=>{let t=K.t;if(!session){toSession(t+.1,1.4);t+=1.4;}
    const tc=Math.max(t+.3,K.at('decide how much',.2)-.1);chip.tr.move(tc,tc+.4,{o:1,s:1},0,easeOut);
    const ti=Math.max(tc+.5,K.at('how many times',.45)-.15),tl=Math.max(ti+.5,K.at('how long',.52)-.15);
    ricN.tr.move(ti,ti+.35,{o:1,s:1,dy:0},0,easeOut);ricL.tr.move(tl,tl+.35,{o:1,s:1,dy:0},0,easeOut);
    const tk=Math.max(tl+.8,K.at('keep it small',.6)-.15);glowAt(BDS,M.slot[0],4,tk,1.6);
    const tf=Math.max(tk+.6,K.at('this example',.8)-.15);chip0.tr.move(tf,tf+.3,{o:0});chip1.tr.move(tf+.1,tf+.45,{o:1});chip.tr.move(tf,tf+.2,{s:1.06});chip.tr.move(tf+.2,tf+.45,{s:1});
    ricN.tr.move(tf,tf+.4,{o:0,s:.8});glowAt({x:0,y:0,s:1},{x:RC.x+10,y:104,w:172,h:96},4,tf,1.3);ricL.tr.move(tf+1.2,tf+1.6,{o:0,s:.8});
    return tf+1.7-K.t;};
  /* the session starts: the ring shows 2:00; the teacher points to the board and names both pictures; the ring counts down */
  SC.start=K=>{ringEl.tr.move(K.t+.15,K.t+.6,{o:1,s:1},0,easeOut);
    const pF=pointAt(at(BDS,ctr(M.first)),sBd),pT=pointAt(at(BDS,ctr(M.then)),sBd);
    const tp0=Math.max(K.t+1,K.at('point to the board',.25)+.25);enter(HT,tp0-.9,tp0,pF,'point',SHT);
    const tp1=Math.max(tp0,K.at('first the target',.42)),tp2=Math.max(tp1+.9,K.at('then the item',.52));
    handTo(HT,tp2-.5,tp2,pT,.12);leave(HT,tp2+.7,tp2+1.45);
    glowAt(BDS,M.first,6,tp1-.15,1.3);glowAt(BDS,M.then,6,tp2-.15,1.3);
    const tr0=Math.max(tp2+.3,K.at('the ring',.62));ringPending=tr0;const ts=Math.max(tr0+.5,K.at('sped up',.85)-.15);ringEl.tr.move(ts,ts+.2,{s:1.06});ringEl.tr.move(ts+.2,ts+.45,{s:1});
    return tr0+1.2-K.t;};
  /* the first token comes as the interval ends (the reach starts just before), not when the line gets to it; the ring keeps its ✓ until
     the token is in its slot; the praise is shown again with the behavior's name marked as the line says so; the slot glows as it is named */
  SC.tok_first=K=>{const tEnd=K.t+.6,grab=tEnd+.45,atHO=grab+.8,tk=atHO+.9,place=tk+.8;
    ringInt(ringPending==null?K.t-3:ringPending,tEnd,true,{hold:place});ringPending=null;
    deliver(0,{t0:tEnd-.4,grab,atHO,text:PR.first,bub:atHO,bubDur:2.4,take:tk,place,lin:.9});
    const tb=Math.max(atHO+2.5,K.at('brief praise',.5)-.15);bubble(PR.first,tb,2.8,true);
    const ts=Math.max(tb+.5,K.at('put it in the next slot',.85)-.15);glowAt(BDS,M.slot[0],5,ts,1.8);
    return Math.max(place+1,ts+1.8)-K.t;};
  /* the behavior stops part way: the ring stops and turns grey, no token; the reminder comes at once; the earned token stays (it glows);
     the interval starts over when the learner begins again */
  SC.tok_none=K=>{const ts=Math.max(K.t+1.4,K.at('stops',.12)+.35),tn=Math.max(ts+4,K.at('start the interval over',.8)-.1);
    ringInt(K.t+.2,ts,false,{f:.4,hold:tn});noTok.tr.move(ts,ts+.3,{o:1,s:1},0,easeOut);
    const pF=pointAt(at(BDS,ctr(M.first)),sBd);enter(HT,ts-.5,ts+.45,pF,'point',SHT);glowAt(BDS,M.first,6,ts+.3,1.4);
    const te=Math.max(ts+.6,K.at('earned tokens',.5)-.15);glowAt(BDS,M.slot[0],5,te,1.6);
    const tr=Math.max(te+.8,K.at('remind your learner',.62)-.15);glowAt(BDS,M.first,6,tr,1.4);handTo(HT,tr,tr+.18,{x:pF.x,y:pF.y+12},0);handTo(HT,tr+.18,tr+.4,pF,0);
    leave(HT,tn-.3,tn+.5);noTok.tr.move(tn-.5,tn-.1,{o:0});ringPending=tn;
    return Math.max(K.d,tn+.6-K.t);};
  SC.tok_more=K=>{const idx=[];for(let i=1;i<n-1;i++)idx.push(i);if(!idx.length)return K.d;
    const want=(K.d+.4)/idx.length;let T=K.t+.25,end=K.t;
    if(want>=2.4){const cy=Math.min(4,want),ri=cy-1.4;   /* a few tokens: each one in full, the hands come in and go */
      idx.forEach((i,j)=>{ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;end=deliver(i,{t0:D-.4,grab:D+.5,atHO:D+1.05,text:PR.more[j%PR.more.length],bubDur:1.7,take:D+1.25,place:D+1.85,lin:.9});T+=cy;});}
    else{const cy=Math.max(1.75,want),ri=cy-.5;   /* a big board: the intervals follow one another and both hands stay in the frame from token to token */
      idx.forEach((i,j)=>{const last=j===idx.length-1;ringInt(j===0&&ringPending!=null&&ringPending<T?ringPending:T,T+ri,true);const D=T+ri;
        end=deliver(i,{t0:D-.05,grab:D+.45,atHO:D+.95,text:PR.more[j%PR.more.length],bubDur:Math.min(1.6,cy-.1),take:D+1.2,place:D+1.75,lin:.6,tIn:j>0,lIn:j>0,stay:!last});T+=cy;});}
    ringPending=null;
    return end-K.t+.1;};
  /* the last token: given at once; the terminal token goes straight into its slot, and sits there, its round slot glowing, while the line
     says why it looks different; the full board glows as it is named */
  SC.tok_last=K=>{const i=n-1,T=K.t+.2,ri=2.2,D=T+ri,tk=F.term?D+2.2:D+1.6,place=tk+.9;
    ringInt(ringPending!=null&&ringPending<T?ringPending:T,D,true,{hold:place});ringPending=null;
    const end=deliver(i,{t0:D-.4,grab:D+.5,atHO:D+1.2,text:PR.last,bub:D+1.25,bubDur:2.6,take:tk,place,lin:.9});let fin=end;
    if(F.term){TK[i].glowT=[D+.6,place];const ta=Math.max(place,K.at('looks different',.3)-.15);glowAt(BDS,M.slot[i],8,place,Math.max(4.5,ta+3.2-place),true);
      const tf=Math.max(place+4.6,K.at('board is finished',.6)-.15);M.slot.forEach((r,j)=>glowAt(BDS,r,4,tf+j*.08,1.4));fin=Math.max(fin,tf+1.5);}
    else{const tf=Math.max(place+.3,K.at('board is full',.6)-.15);M.slot.forEach((r,j)=>glowAt(BDS,r,4,tf+j*.08,1.4));fin=Math.max(fin,tf+1.5);}
    ringEl.tr.move(end+.2,end+.7,{o:0,s:.9});return Math.max(end+.8,fin)-K.t;};
  /* the exchange: the teacher's hand gathers the tokens off the board and takes them back to the Tokens page (the trade); the Then card
     lifts and grows into the item; the teacher holds it by its right edge, the learner takes it by its left edge and keeps it for the time agreed */
  const GI_T=[.48,-.12],GI_L=[-.48,.12];
  SC.exchange=K=>{const t=K.t;chip.tr.move(t,t+.5,{o:0});
    const tg=Math.max(t+1.1,K.at('trade the tokens',.15)+.15),s0p=at(BDS,ctr(M.slot[0]));
    const g0=grip(TK[0],s0p,sBd,'teacher');enter(HT,tg-.9,tg,g0,'pinch',SHT);
    TK.forEach((c,i)=>{const sp=at(BDS,ctr(M.slot[i]));c.tr.set(tg-.3,{x:sp.x,y:sp.y,s:sBd,l:0,o:1});c.where.set(tg-.3,'fly');
      c.tr.move(tg-.2+i*.03,tg+.45+i*.03,{x:s0p.x+i*2.5,y:s0p.y-i*3,l:.4},.05);});
    const tgT=tg+.5+n*.03;TK.forEach(c=>take(c,HT,tgT));TK.forEach(c=>c.tr.move(tgT,tgT+1,{s:sTk,l:.8}));
    const tc=at(TKS,{x:pw/2,y:PG.tk.h*.45});carryTo(TK[0],HT,tgT+.05,tgT+1,tc,.16);
    TK.forEach((c,i)=>{const dp=at(TKS,ctr(M.ybx[i])),tr=tgT+1+i*.04;release(c,tr);c.tr.move(tr,tr+.45,{x:dp.x,y:dp.y,l:0},.1);c.where.set(tr+.47,'tk');});
    HT.pose.set(tgT+1.05,'point');leave(HT,tgT+1.15,tgT+1.85);
    const c=cC,P0=at(BDS,ctr(M.then)),CEN={x:640,y:292},big=sBd*1.5,tt=Math.max(tgT+1.2,K.at('then item',.4)-.1);
    veil.tr.move(tt-.2,tt+.4,{o:.32});
    c.tr.set(tt,{x:P0.x,y:P0.y,s:sBd,l:0,o:1});c.where.set(tt,'fly');c.tr.move(tt,tt+.35,{l:1});c.tr.move(tt+.35,tt+1.3,{x:CEN.x,y:CEN.y,s:big},.1);
    const is=big*CW/IW;item.tr.set(tt+1.15,{x:CEN.x,y:CEN.y,s:is,l:1,o:0});item.where.set(tt+1.15,'fly');item.tr.move(tt+1.15,tt+1.75,{o:1});c.tr.move(tt+1.15,tt+1.75,{o:0});c.where.set(tt+1.8,'none');
    const tgv=Math.max(tt+1.9,K.at('your learner gets',.62)-.3),HOFF={x:560,y:330},si=.75;
    enter(HT,tgv-.9,tgv,grip(item,CEN,is,'teacher',GI_T),'pinch',SHT);take(item,HT,tgv);item.tr.move(tgv,tgv+1.1,{s:si});carryTo(item,HT,tgv+.1,tgv+1.1,HOFF,.1);
    const tl=tgv+1.15;enter(HL,tl-.95,tl,grip(item,HOFF,si,'learner',GI_L),'pinch',SHL);release(item,tl);take(item,HL,tl);HT.pose.set(tl+.05,'point');leave(HT,tl+.15,tl+.9);
    const tw=Math.max(tl+1.1,K.at('for the time',.6)+.2);leave(HL,tw,tw+1.1);release(item,tw+1.12);item.where.set(tw+1.12,'none');
    return Math.max(K.d,tw+1.2-K.t);};
  /* the reset: the item comes back in the teacher's hand and turns back into its card; the hand puts the pictures back, each on its
     own page (the target first, as its page turns back over the Board, then the chosen item); the learner looks over the choices again */
  SC.reset=K=>{const r=K.t;veil.tr.move(r+.1,r+.7,{o:0});toBook(r+.1,1.1);
    const QI={x:820,y:300},si=.75,ti=Math.max(r+1.1,K.at('put it away',.3)-.6),gI=grip(item,QI,si,'teacher',GI_T);
    const st=enter(HT,ti-1,ti,gI,'pinch',SHT),h0=HT.tr.at(st);item.tr.set(st,{x:h0.x+QI.x-gI.x,y:h0.y+QI.y-gI.y,s:si,l:1,o:1});item.where.set(st,'fly');take(item,HT,st);
    const ts=ti+.05,sc=sBk*CW/IW;item.tr.move(ts,ts+.5,{s:sc});
    const pI={x:QI.x+(gI.x-QI.x)*(1-sc/si),y:QI.y+(gI.y-QI.y)*(1-sc/si)};   /* where the shrinking item's centre ends up (it keeps its point under the fingers) */
    cC.tr.set(ts+.4,{x:pI.x,y:pI.y,s:sBk,l:1,o:0});cC.where.set(ts+.4,'fly');take(cC,HT,ts+.4);cC.tr.move(ts+.4,ts+.6,{o:1});item.tr.move(ts+.4,ts+.6,{o:0});release(item,ts+.62);item.where.set(ts+.62,'none');
    carryTo(cC,HT,ts+.65,ts+1.25,TRa);release(cC,ts+1.25);cC.tr.move(ts+1.25,ts+1.45,{l:0});
    const fB=at(BOOK('bd'),ctr(M.first));handTo(HT,ts+1.3,ts+1.8,grip(cT,fB,sBk,'teacher'));
    cT.tr.set(ts+1.8,{x:fB.x,y:fB.y,s:sBk,l:0,o:1});take(cT,HT,ts+1.8);cT.tr.move(ts+1.8,ts+2,{l:1});carryTo(cT,HT,ts+1.95,ts+2.55,TRb);release(cT,ts+2.55);cT.tr.move(ts+2.55,ts+2.7,{l:0});
    pageTurn('tg',ts+2.55,ts+3.25,true);
    const pT=at(BOOK('tg'),ctr(M.tg[F.pick.tg]));take(cT,HT,ts+3.25);cT.tr.move(ts+3.25,ts+3.4,{l:1});carryTo(cT,HT,ts+3.3,ts+3.9,pT,.15);release(cT,ts+3.9);cT.tr.move(ts+3.9,ts+4.05,{l:0});cT.where.set(ts+4.08,'tg');
    pageTurn('ch',ts+4,ts+4.7,true);handTo(HT,ts+4,ts+4.55,grip(cC,TRa,sBk,'teacher'));
    const pC=at(BOOK('ch'),ctr(M.ch[F.pick.ch]));take(cC,HT,ts+4.72);cC.tr.move(ts+4.72,ts+4.87,{l:1});carryTo(cC,HT,ts+4.77,ts+5.37,pC,.15);release(cC,ts+5.37);cC.tr.move(ts+5.37,ts+5.52,{l:0});cC.where.set(ts+5.55,'ch');
    leave(HT,ts+5.5,ts+6.2);let t=ts+5.6;
    /* the learner looks over the choices again */
    const L=BOOK('ch'),pts=[2,4].filter(i=>CH[i]&&i!==F.pick.ch).concat([F.pick.ch]).slice(0,2).map(i=>pointAt(at(L,ctr(M.ch[i])),L.s));
    if(pts.length){const tl=Math.max(t+.4,K.at('chooses again',.6)-.2);enter(HL,tl-.9,tl,pts[0],'point',SHL);t=tl;for(let j=1;j<pts.length;j++){handTo(HL,t+.3,t+.8,pts[j]);t+=.8;}t+=.3;leave(HL,t,t+.8);t+=.8;}
    return Math.max(K.d,t-K.t);};
  /* the tips: each tip is lit while it is read; the first is shown under the book, a token given and traded for the item at once, twice */
  SC.tips=K=>{const t=K.t;stackTo(t,t+1,k=>BOOK(k,.52,40,170));tipsCard.tr.move(t+.5,t+1,{o:1,dy:0},0,easeOut);
    const fr=[['valuable',.06],['start with a small',.42],['keep the item',.8]];const ts=fr.map((f,i)=>Math.max(t+.9+i*.4,K.at(f[0],f[1])-.3));
    tipRows.forEach((fx,i)=>{const a=ts[i],b=i<2?ts[i+1]:t+K.d;fx.tr.move(a,a+.45,{o:1,dy:0,h:1},0,easeOut);fx.tr.move(b-.1,b+.3,{h:0});});
    pair.tr.move(ts[0]+.1,ts[0]+.5,{o:1});
    const trade=a=>{pTok.tr.set(a,{o:0,s:.6,dx:0});pTok.tr.move(a,a+.3,{o:1,s:1},0,easeOut);pTok.tr.move(a+.9,a+1.5,{dx:PDX,s:.5},.0);pTok.tr.move(a+1.35,a+1.5,{o:0});
      pItem.tr.move(a+1.45,a+1.7,{s:1.18});pItem.tr.move(a+1.7,a+2,{s:1});};
    const sp=Math.max(2.3,Math.min(3,(ts[1]-ts[0]-.8)/2));trade(ts[0]+.6);trade(ts[0]+.6+sp);
    return Math.max(K.d,2.5);};
  /* the end: the book closes, the cycle is named step by step (each arrow comes with the step after it), and the Choices page turns
     over to show its back as the backs are mentioned */
  SC.outro=K=>{const t=K.t,sO=Math.min(.7,430/maxH);tipsCard.tr.move(t,t+.5,{o:0,dy:10});pair.tr.move(t,t+.4,{o:0});stackTo(t+.2,t+1.4,k=>BOOK(k,sO,null,24));cyc.tr.move(t+.6,t+.9,{o:1});
    const after=K.text.toLowerCase().indexOf('cycle');const w=[['choose',.3],['set the target',.42],['earn',.55],['exchange',.68]];let last=t+1;
    cycItems.forEach((fx,i)=>{const tt=Math.max(t+1+i*.35,K.at(w[i][0],w[i][1],after)-.15);fx.tr.move(tt,tt+.4,{o:1,s:1,dy:0},0,easeOut);if(cycArr[i])cycArr[i].tr.move(tt-.05,tt+.3,{o:1,dx:0},0,easeOut);last=tt;});
    const tb=Math.max(last+1.2,K.at('the back of each page',.86)-.1),B0=BOOK('ch',sO,null,24);
    PG.chb.tr.set(tb,{x:B0.x,y:B0.y,s:B0.s,ry:0,o:0,fx:0});PG.ch.tr.move(tb,tb+.35,{fx:0},0,easeIn);PG.ch.tr.set(tb+.35,{o:0});PG.chb.tr.set(tb+.35,{o:1});PG.chb.tr.move(tb+.35,tb+.75,{fx:1},0,easeOut);
    return Math.max(K.d,tb+2.4-K.t);};

  /* ---- the timeline ---- */
  const ids=LIST.map(id=>id==='tok_last'&&F.term?'tok_last_term':id).filter(id=>!OPT[id]||present(id));
  let T=0;const cues=[];
  ids.forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);if(i>=0&&window.__wkMarkLog)window.__wkMarkLog.push([id,i]);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id==='tok_last_term'?'tok_last':id](K))||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id],chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return{id,label,start:c?c.start:0};});
  return{D:T,cues,chapters,PG,cards,hands,fxs,ring,cap,notes,item,F};
}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const parts=(text.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[text]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,text.indexOf(p.slice(0,12),cur));cur=i+1;if(k&&window.__wkMarkLog)window.__wkMarkLog.push([id,i]);return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  /* a page: placed, scaled, turned over its binding (ry), or flipped over in place (fx: its width shrinks to its middle and back) */
  for(const k in B.PG){const p=B.PG[k],s=p.tr.at(v),fx=s.fx==null?1:clamp(s.fx,0,1);
    css(p.el,'transform','translate('+f2(s.x+p.w*s.s*(1-fx)/2)+'px,'+f2(s.y)+'px) scale('+(fx<1?(s.s*fx).toFixed(4)+','+s.s.toFixed(4):s.s.toFixed(4))+')'+(s.ry?' rotateY('+f2(s.ry)+'deg)':''));
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001&&s.ry>-89.5?'visible':'hidden');css(p.shade,'opacity',f2(clamp(-s.ry/90,0,1)*.5));}
  for(const c of B.cards){const w=c.where.at(v).v;
    for(const k in c.inp){const e=c.inp[k];const on=w===k;css(e,'opacity',on?'1':'0');let sc=1;const pp=c.pops[k];if(on&&pp)for(const p of pp)sc=Math.max(sc,1+.08*bump(v,p,.6));css(e,'transform',sc!==1?'scale('+sc.toFixed(4)+')':'none');}
    if(!c.el)continue;
    const s=c.tr.at(v),p=cardPosOf(c,v),k=s.s*(1+.07*s.l),fl=w==='fly';
    css(c.el,'visibility',fl?'visible':'hidden');css(c.el,'opacity',fl?f2(s.o):'0');css(c.el,'transform','translate('+f2(p.x-c.w/2)+'px,'+f2(p.y-c.h/2)+'px) scale('+k.toFixed(4)+')');
    css(c.sh,'transform','translate('+f2(4+14*s.l)+'px,'+f2(5+20*s.l)+'px)');css(c.sh,'opacity',f2(.35+.3*s.l));
    if(c.glow){const g=c.glowT;css(c.glow,'opacity',g&&v>=g[0]&&v<=g[1]?f2(.55+.45*Math.sin((v-g[0])*5)):'0');}}
  /* the hands: each pose is drawn about the point that touches; while a pose changes, the new drawing starts with its wrist where the
     old one's wrist is (so the forearms coincide and no second arm shows) and slides onto its own touch point over 0.3 s */
  for(const h of B.hands){const s=h.tr.at(v),ps=h.pose.at(v),ang=Math.atan2(s.x-s.sx,s.sy-s.y)*180/Math.PI,u=clamp(ps.since/.14,0,1);
    let lf=0;for(const L of h.lifts)lf=Math.max(lf,bump(v,L[0],L[1]));const sc=h.base*s.s*(1+.05*lf);
    const vis=s.y<SH+260;let ox=0,oy=0;
    if(ps.prev!==ps.v&&ps.since<.3&&h.poses[ps.prev]){const r=ang*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),W=P=>{const dx=(P.wx-P.ax)*sc,dy=(P.wy-P.ay)*sc;return[dx*cs-dy*sn,dx*sn+dy*cs];};
      const a=W(h.poses[ps.prev]),b=W(h.poses[ps.v]),k=1-ps.since/.3;ox=(a[0]-b[0])*k;oy=(a[1]-b[1])*k;}
    for(const name in h.poses){const P=h.poses[name];const o=name===ps.v?(ps.prev===name?1:u):name===ps.prev&&ps.prev!==ps.v?1-u:0;const nw=name===ps.v&&ps.prev!==name;
      css(P.el,'opacity',f2(vis?o:0));css(P.el,'visibility',vis&&o>.001?'visible':'hidden');
      css(P.el,'transform','translate('+f2(s.x-P.ax+(nw?ox:0))+'px,'+f2(s.y-P.ay+(nw?oy:0))+'px) rotate('+f2(ang)+'deg) scale('+sc.toFixed(4)+')');}}
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');css(fx.el,'transform',s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  /* the timer ring */
  const R=B.ring;let p=0,state='idle';for(const I of R.ints){if(v>=I.t0&&v<I.t1){p=(v-I.t0)/(I.t1-I.t0)*I.f;state='run';break;}if(v>=I.t1&&v<I.hold){p=I.f;state=I.ok?'ok':'no';}}
  css(R.fg,'strokeDasharray',f2(R.C));css(R.fg,'strokeDashoffset',f2(R.C*(1-p)));css(R.fg,'stroke',state==='ok'?'#2f9e44':state==='no'?'#8c97a1':'#f08c00');
  const rem=Math.round(120*(1-(state==='idle'?0:p)));txt(R.t,state==='ok'?'✓':state==='no'?'–':Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'));
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
