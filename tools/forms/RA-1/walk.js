/* (v21.60) Form RA-1, the Walkthrough view: a narrated walkthrough of the reinforcer assessment at the table, drawn with hands.
   The student's hand places a block in the bin (the response), the assessor's hand delivers the stimulus (the reinforcer), and
   the session panel beside the table counts: the clock, the responses, the rate, the access, and the cumulative record; then
   the form's own sheets (copies, their fields turned into text) show where the numbers go: the single-operant sheet and its
   verdict, the concurrent-operants allocation, the progressive-ratio break point, the runner, and the summary. The example is
   the form's simulated student with fixed numbers (put into the form for the build only, and taken out again before anything
   else runs): the narration names the tablet, the fruit chew and praise, so the walkthrough is always the worked example and
   never a student's record. Laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as a
   pure function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form)
   draw the same frames. The hands are Form TK-1's drawings (walk-hands.js, inlined by patch-walk.py) on TK-1's rig; the player
   (clock, narration, controls, full screen) is Form TK-1's, as SM-1 carries it (tools/forms/SM-1/walk.js). The narration is
   walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as nbh-ra1-narration.js; without it the
   captions are timed from their word counts and the device's voice reads them. */
(function(){
'use strict';
const INFO={file:'Reinforcer assessment walkthrough',from:'from this form: the worked example at the table (the simulated student), its sheets and its summary',
  priv:'The video shows the form\u2019s worked example (the simulated student) only; nothing from your own sheets is in it, so it can be shared with the staff who run the sessions.'};
window.NBH_WALK_INFO=Object.assign({what:'form'},INFO);
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'why',response:'why',control:'so',reinforce:'so',effect:'so',sheet:'so',praise:'so',co_setup:'co',co_run:'co',co_read:'co',pr_run:'pr',pr_read:'pr',rules:'table',runner:'table',summary:'result',outro:'result'};
const CHAPS=[['why','Why test'],['so','Single operant'],['co','Concurrent operants'],['pr','Progressive ratio'],['table','At the table'],['result','The result']];
const IDS=['intro','response','control','reinforce','effect','sheet','praise','co_setup','co_run','co_read','pr_run','pr_read','rules','runner','summary','outro'];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB={};(window.RA_WALK_SCRIPT||[]).forEach(l=>{FB[l.id]=l.text;});

/* ---------------- small helpers ---------------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const easeOut=u=>1-Math.pow(1-u,3);
const easeIn=u=>u*u;
const lin=u=>u;
const bump=(t,t0,d)=>{const u=(t-t0)/d;return u<=0||u>=1?0:Math.sin(Math.PI*u);};
const f2=v=>(Math.round(v*100)/100).toString();
function div(cls,html){const d=document.createElement('div');if(cls)d.className=cls;if(html)d.innerHTML=html;return d;}
function css(el,p,v){const c=el._wk||(el._wk={});if(c[p]!==v){c[p]=v;el.style[p]=v;}}
function txt(el,v){if(el._wkT!==v){el._wkT=v;el.textContent=v;}}
function tog(el,c,on){const k='_wkC'+c;if(el[k]!==on){el[k]=on;el.classList.toggle(c,on);}}
const audioLines=()=>(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines&&typeof WALK_AUDIO.lines==='object')?WALK_AUDIO.lines:null;
const handArt=()=>(typeof WALK_HANDS!=='undefined'&&WALK_HANDS&&WALK_HANDS.learner&&WALK_HANDS.teacher)?WALK_HANDS:placeholderHands();
function line(id){const L=audioLines();const l=L&&L[id];const t=String((l&&l.t)||FB[id]||'');const words=t.split(/\s+/).filter(Boolean).length;
  const d=l&&+l.d>0?+l.d:Math.max(1.5,words*.4);return{t,d,a:l&&typeof l.a==='string'?l.a:''};}
const MK={};   /* no measured word marks: a line's words are placed by their share of its characters */
function onsetFn(id,text,d){const pts=[[0,.05],[text.length,Math.max(.15,d-.15)]];
  return i=>{if(i<=0)return pts[0][1];const a=pts[0],b=pts[1];return a[1]+(b[1]-a[1])*Math.min(1,i/Math.max(1,b[0]));};}
function present(id){const L=audioLines();return L?!!L[id]:id in FB;}
const mmss2=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------------- keyframe tracks (as TK-1's) ---------------- */
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
/* discrete steps (a hand's pose, where a block is) */
function Steps(v){this.k=[{t:-1e9,v}];}
Steps.prototype.set=function(t,v){const L=this.k[this.k.length-1];this.k.push({t:Math.max(t,L.t),v});return this;};
Steps.prototype.at=function(t){const k=this.k;let lo=0,hi=k.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1;}return{v:k[lo].v,since:t-k[lo].t,prev:lo>0?k[lo-1].v:k[lo].v};};

/* ---------------- placeholder hands (used only when walk-hands.js is missing), the same contract as TK-1's ---------------- */
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
const HS={learner:1.12,teacher:1.18};
const ANCH={point:'tip',pinch:'grip',open:'palm'};

/* ---------------- the DOM of the view ---------------- */
let DOM=null;
function dom(){if(DOM&&DOM.stage&&DOM.stage.isConnected)return DOM;const g=id=>document.getElementById(id);const stage=g('wkStage');if(!stage)return null;
  DOM={sec:stage.closest('section'),player:g('wkPlayer'),frame:g('wkFrame'),stage,big:g('wkBig'),cap2:g('wkCap2'),play:g('wkPlay'),restart:g('wkRestart'),seek:g('wkSeek'),time:g('wkTime'),cc:g('wkCc'),snd:g('wkSnd'),fs:g('wkFs'),chaps:g('wkChaps'),note:g('wkNote'),tx:g('wkTx')};const sk=DOM.seek;DOM.sfill=sk&&sk.querySelector('.wk-sfill');DOM.sthumb=sk&&sk.querySelector('.wk-sthumb');
  let m=DOM.frame.querySelector('.wk-msg');if(!m){m=div('wk-msg');m.setAttribute('role','status');m.hidden=true;DOM.frame.appendChild(m);}DOM.msg=m;
  wire();return DOM;}

/* ---------------- the worked example: the form's simulated student with fixed numbers ----------------
   Three stimuli from the MSWO (PA-1): the tablet (92%), the fruit chew (71%), praise with a high five (46%). Single operant,
   multielement, 16 sessions in a control-tablet-chew-praise rotation: control about 2.4 a minute, the tablet 11.6 to 13.2
   (Clear), the chew 7.4 to 8.2 (Clear), praise at the control's rate (None). Concurrent operants, three bins, 10 sessions:
   the tablet takes about three quarters of the responses, the chew a fifth, the control almost none. Progressive ratio, +2:
   the tablet breaks at FR 15 to 17, the chew at FR 7 to 9, the control and praise at FR 1 to 3; the plan ratio is FR 5. */
const EXN=['Tablet (video)','Fruit chew','Praise + high five'];
const EXSO=[['ctl',12],['0',58],['1',37],['2',13],['ctl',11],['0',61],['1',39],['2',10],['ctl',13],['0',63],['1',40],['2',15],['ctl',12],['0',66],['1',41],['2',12]];
const EXCO=[['L',34,9,1],['R',36,8,0],['M',33,10,1],['L',35,9,2],['R',34,11,0],['M',37,7,1],['L',32,9,1],['R',36,10,0],['M',34,8,1],['L',35,9,1]];
const EXPR={'0':[8,9,8],'1':[4,5,5],'2':[2,1,1],ctl:[1,2,1]};   /* ratios completed, three sessions each */
function exampleState(){const X=blank();X.n=3;X.sessMin=5;X.nSess=16;X.nCoSess=10;X.prStep='a2';X.prStart=1;X.prStop=120;
  const D=n=>{const d=new Date();d.setDate(d.getDate()-n);return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();};
  X.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',setting:'Room 12, small-group table (simulated)',assessor:'Joshua Newsome, M.A., BCBA',date:D(0),
    question:'Do the top three items from the MSWO function as reinforcers for independent block sorting, and which will hold up under a thinned schedule?',
    pasrc:'Form PA-1, MSWO, 5 sessions; top 3 high-preference items carried forward',
    response:'Places one block in the bin from the tray; counted when the block lands in the bin',
    materials:'Tray of 50 blocks, bin 20 cm to the right; for concurrent operants, three identical bins 40 cm apart',
    magnitude:'20 s access delivered within 2 s of the response; edible: one piece',control:'Same materials, responses produce nothing; assessor present and neutral',
    mo:'No access to tested items for 3 h before the session; sessions at 9:30 daily; never within 30 min of snack',signal:'Colored placemat per condition; the item is shown once before the session starts',
    d_so:true,d_co:true,d_pr:true,prcap:'20',pbdef:'Any forceful contact with an adult or the materials, or leaving the table for more than 10 s',stoprule:'End the session at the first instance of aggression; record the session as terminated',
    soDesign:'Multielement',coOpts:'3',planRatio:'5',coMode:'st',ioa:'Second observer on 33% of sessions across all three conditions; mean 96% on responses per session',
    recs:'Tablet access is the reinforcer of record for independent work. Fruit chew is a usable back-up. Praise alone did not function as a reinforcer.',schedule:'FR 5 with 20-s tablet access; break points of 15–17 support thinning to FR 8 over two weeks'};
  X.stim=[{name:EXN[0],type:'Leisure item',pa:'92',mag:'20 s access'},{name:EXN[1],type:'Edible',pa:'71',mag:'one piece'},{name:EXN[2],type:'Social / attention',pa:'46',mag:'brief praise statement'}];
  X.so=EXSO.map(([c,r],k)=>({date:D(18-Math.floor(k/4)*3),cond:c,resp:String(r),min:'5',pb:false,phase:false}));
  X.co=EXCO.map(([p,a,b,c],k)=>({date:D(14-k),pos:p,r:[String(a),String(b),String(c)],pb:false}));
  const lad=[];for(let i=0,v=1;i<14;i++,v+=2)lad.push(v);const order=['0','1','2','ctl'];X.pr=[];
  for(let k=0;k<12;k++){const c=order[k%4],stop=EXPR[c][Math.floor(k/4)];const done=lad.map((_,j)=>j<stop);X.pr.push({date:D(12-Math.floor(k/4)*2),cond:c,done,resp:String(lad.slice(0,stop).reduce((a,b)=>a+b,0)),pb:false});}
  return X;}
/* runs fn with the example in the form (its sheets rendered from it), then puts the form back as it was, all in one turn */
function withExample(fn){const prev=S;S=exampleState();
  try{ensure();renderAll();return fn();}
  finally{S=prev;ensure();renderAll();}}

/* ---------------- the build ---------------- */
let B=null;
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function build(){const D=dom();if(!D)return null;stop(true);
  const restore=tempShow(document.getElementById('walk')||D.sec);   /* the stage is measured: the view must have a layout */
  try{fit();withExample(()=>{B=compose(D);});}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];
const CREDIT_WALK='Created by Joshua Newsome, BCBA';

/* a copy of a part of the form: every field turned into the text it shows (read from the original, in order), buttons and
   hidden parts taken out, ids taken off (a figure's pattern keeps its id: its bars fill by it) */
function copyOf(orig,keepButtons){if(!orig)return null;const c=orig.cloneNode(true);
  const ov=[...orig.querySelectorAll('input,select,textarea')],cv=[...c.querySelectorAll('input,select,textarea')];
  cv.forEach((e,i)=>{const o=ov[i]||e;const s=document.createElement('span');s.className='raw-v';
    if(o.type==='checkbox'||o.type==='radio'){s.textContent=o.checked?'☑':'☐';s.classList.add('raw-chk');}
    else{let v=String(o.value==null?'':o.value);if(o.tagName==='SELECT'&&o.selectedOptions&&o.selectedOptions[0])v=o.selectedOptions[0].textContent.trim();s.textContent=v;if(e.tagName==='TEXTAREA')s.classList.add('raw-ta');if(!v)s.classList.add('raw-empty');}
    e.replaceWith(s);});
  if(keepButtons)c.querySelectorAll('button').forEach(b=>{const s=document.createElement('span');s.className=b.className+' raw-btn';s.innerHTML=b.innerHTML;b.replaceWith(s);});
  c.querySelectorAll('button,[hidden],.noprint,.nbh-print-head,.no-print,.wk-go-line').forEach(x=>x.remove());
  c.querySelectorAll('[id]').forEach(e=>{if(e.tagName.toLowerCase()!=='pattern')e.removeAttribute('id');});
  /* the form's echo() fills every .echo-client and .echo-response in the document: the copies keep their text under another name */
  c.querySelectorAll('[class*="echo-"]').forEach(e=>{e.className=e.className.replace(/\becho-(\w+)/g,'raw-echo-$1');});
  c.removeAttribute('id');return c;}

/* ---------------- the stage: the table, the hands, the session panel, the papers ---------------- */
const COL={ctl:'#8d989e','0':'#2f5fa3','1':'#e0742f','2':'#3f8a4f'};
const MATL={ctl:'CONTROL','0':'TABLET','1':'FRUIT CHEW','2':'PRAISE + HIGH FIVE'};
const BLOCKC=['#7b61a8','#e8b737','#4f9a8a','#d9583b','#2f5fa3','#c9a13b'];
const TABLET='<div class="raw-tab"><div class="raw-tabscr"><div class="raw-tabvid"><i></i><i></i><i></i></div><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="rgba(255,255,255,.9)"/><path d="M15.5 12.5v15l12-7.5z" fill="#1d3b5a"/></svg></div></div>';
const CHEW='<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M6 14l22 10v22L6 56c6-9 6-33 0-42z" fill="#f2b84b" stroke="#8a5a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M114 14L92 24v22l22 10c-6-9-6-33 0-42z" fill="#f2b84b" stroke="#8a5a12" stroke-width="2.5" stroke-linejoin="round"/><rect x="28" y="12" width="64" height="46" rx="18" fill="#e0593a" stroke="#8a2a14" stroke-width="2.5"/><path d="M40 24c8 8 32 8 40 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round"/><text x="60" y="42" text-anchor="middle" font="700 13px Inter,Arial,sans-serif" fill="#fff">CHEW</text></svg>';
function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Ltab=layer('raw-table'),Lfly=layer('raw-fly'),Lhl=layer('raw-hl'),Lht=layer('raw-ht'),Lveil=layer('raw-veil'),Lcam=layer('raw-cam'),Lfx=layer('raw-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=['The walkthrough shows the form’s worked example (the simulated student, with fixed numbers), whatever is on the sheets; nothing on the sheets is changed.'];
  if(!audioLines())notes.push('The recorded narration (nbh-ra1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  /* overlays: on the stage, or on the world (they move with the camera) */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glow=(r,t0,dur,p,parent,round)=>{if(!r)return null;const pp=p==null?6:p;const g=mkFx('wk-glow raw-glow'+(round?' round':''),'',{x:r.x-pp,y:r.y-pp,w:r.w+2*pp,h:r.h+2*pp},null,parent||Lfx);pulse(g,t0,dur);return g;};
  const note=(r,text,t0,t1,side,parent)=>{if(!r)return null;const n=mkFx('raw-note',esc(text),{x:r.x+r.w/2,y:side==='below'?r.y+r.h+8:r.y-40},{dy:side==='below'?-8:8},parent||Lfx);n.el.style.transform='translateX(-50%)';n.tr.move(t0,t0+.35,{o:1,dy:0},0,easeOut);n.tr.move(t1,t1+.35,{o:0});return n;};
  const card=(cls,html,box,t0,t1,init)=>{const c=mkFx('smw-card raw-card '+cls,html,box,Object.assign({dy:16},init||{}));c.tr.move(t0,t0+.5,{o:1,dy:0},0,easeOut);if(t1!=null)c.tr.move(t1,t1+.4,{o:0});return c;};
  const veil=(t0,t1,o)=>{const v=mkFx('smw-veil raw-veilb','',{x:0,y:0,w:SW,h:SH},null,Lveil);v.tr.move(t0,t0+.5,{o:o==null?.5:o});if(t1!=null)v.tr.move(t1,t1+.4,{o:0});return v;};
  const chip=(text,box,t0,t1,cls)=>{const c=mkFx('raw-chip '+(cls||''),esc(text),box,{dy:10,s:.9});c.tr.move(t0,t0+.35,{o:1,dy:0,s:1},0,easeOut);if(t1!=null)c.tr.move(t1,t1+.3,{o:0});return c;};
  const box=(x,y,w,h)=>({x,y,w,h});const cbox=(cx,cy,w,h)=>({x:cx-w/2,y:cy-h/2,w,h});
  /* ---- the table ---- */
  const TRAY={x:60,y:250,w:340,h:270},TRAY2={x:28,y:262,w:222,h:298};
  const BIN1={x:545,y:430},BINW=170,MAT1=box(395,150,300,410),DROP={x:545,y:232};
  const HOME={tablet:{x:706,y:80},chew:{x:548,y:76}};   /* the assessor's side: across the table, the top of the frame */
  const SHL=[280,SH+520],SHT=[640,-560];
  const COX=[350,555,760],MATW=180,MATH=330,MATY=220,BINY=440,BIN2W=140,HOME2=COX.map(x=>({x,y:112}));
  const mkEl=(cls,b,html,parent)=>{const e=div(cls,html);e.style.left=f2(b.x)+'px';e.style.top=f2(b.y)+'px';e.style.width=f2(b.w)+'px';e.style.height=f2(b.h)+'px';(parent||Ltab).appendChild(e);return e;};
  /* the mats: one for the single arrangement (its colour and label change with the condition), three for the bins in a row */
  const mat1=mkEl('raw-mat',MAT1,'<span class="raw-matlbl"></span>');const mat1Fx=sub(mat1,{o:0});const mat1Lbl=mat1.firstChild;
  const matCol=new Steps('ctl');
  const mats3=COX.map((x,i)=>{const m=mkEl('raw-mat raw-mat3',box(x-MATW/2,MATY,MATW,MATH),'<span class="raw-matlbl"></span>');const fx=sub(m,{o:0,dx:0});return{el:m,fx,lbl:m.firstChild,i};});
  const COORD=['0','1','ctl'];mats3.forEach((m,i)=>{m.el.style.background=COL[COORD[i]];m.lbl.textContent=MATL[COORD[i]];});
  /* the bins: top-down, an open box; the blocks dropped in it lie on its floor */
  const bin1=mkEl('raw-bin',cbox(BIN1.x,BIN1.y,BINW,BINW),'<div class="raw-binfloor"></div>');const bin1Fx=sub(bin1,{o:1});
  const bins3=COX.map((x,i)=>{const b=mkEl('raw-bin raw-bin3',cbox(x,BINY,BIN2W,BIN2W),'<div class="raw-binfloor"></div>');return{el:b,fx:sub(b,{o:0,dx:0}),i};});
  const none3=mkEl('raw-none',cbox(COX[2],112,150,60),'nothing');const none3Fx=sub(none3,{o:0});
  /* the trays and their blocks (each block a card the hand can carry) */
  const tray1=mkEl('raw-tray',TRAY),tray1Fx=sub(tray1,{o:1});const tray2=mkEl('raw-tray',TRAY2),tray2Fx=sub(tray2,{o:0});
  const cards=[];
  const mkCard=(id,html,w,h,cls)=>{const el=div('raw-fc'+(cls?' '+cls:''),'<div class="wk-sh raw-sh"></div>'+html);el.dataset.card=id;el.style.width=f2(w)+'px';el.style.height=f2(h)+'px';Lfly.appendChild(el);
    const c={id,el,sh:el.firstChild,w,h,tr:new Track({x:-400,y:-400,s:1,l:0,o:1,r:0}),fol:[],home:null};cards.push(c);return c;};
  const BK=42;
  const mkBlocks=(tray,cols,rows,gap,fx)=>{const out=[];const ox=tray.x+(tray.w-(cols*BK+(cols-1)*gap))/2+BK/2,oy=tray.y+(tray.h-(rows*BK+(rows-1)*gap))/2+BK/2;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=out.length;const c=mkCard('b'+k,'<div class="raw-block" style="background:'+BLOCKC[(i+j*2)%BLOCKC.length]+'"></div>',BK,BK,'raw-blk');
      c.home={x:ox+i*(BK+gap),y:oy+j*(BK+gap)};c.tr.set(-1e8,{x:c.home.x,y:c.home.y,r:((i*7+j*3)%5-2)*3});c.trayFx=fx;out.push(c);}return out;};
  const blocks1=mkBlocks(TRAY,6,4,10,tray1Fx),blocks2=mkBlocks(TRAY2,4,5,10,tray2Fx);
  blocks2.forEach(c=>c.tr.set(-1e8,{o:0}));
  /* the items, on the assessor's side of the table */
  const tablet=mkCard('tablet',TABLET,150,105,'raw-item');tablet.tr.set(-1e8,{x:HOME.tablet.x,y:HOME.tablet.y});
  const chew=mkCard('chew','<div class="raw-chewpic">'+CHEW+'</div>',110,66,'raw-item');chew.tr.set(-1e8,{x:HOME.chew.x,y:HOME.chew.y});
  /* the hands (TK-1's drawings): each pose drawn about the point that touches */
  const ART=handArt(),hands=[];
  const mkHand=who=>{const root=div('wk-hand raw-hand wk-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);const h={who,root,poses:{},base:HS[who],tr:new Track({x:640,y:SH+900,s:1,sx:640,sy:SH+1000}),pose:new Steps('pinch'),lifts:[]};
    ['point','pinch','open'].forEach(p=>{const a=ART[who][p];const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose',a.svg);e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=f2(an[0])+'px '+f2(an[1])+'px';root.appendChild(e);const wr=a.wrist||[a.w/2,a.h*.24];h.poses[p]={el:e,ax:an[0],ay:an[1],wx:wr[0],wy:wr[1],w:a.w,h:a.h};});
    hands.push(h);return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* a longer move lifts the hand a little off the table (it grows a few per cent and settles) */
  const lift=(h,t0,t1,d)=>{if(d>150&&t1-t0>.25)h.lifts.push([t0,t1-t0]);};
  const handTo=(h,t0,t1,p,arc)=>{const a=h.tr.at(t0);lift(h,t0,t1,Math.hypot(p.x-a.x,p.y-a.y));h.tr.move(t0,t1,{x:p.x,y:p.y},arc==null?.14:arc);};
  /* in and out of the frame, along the line from the shoulder; the drawing is turned along the arm, so it parks low enough that
     its highest corner, at that angle, is still below the frame */
  /* the park line: below the frame for a hand whose shoulder is below it (the student), above it for one across the table (the assessor) */
  const offY=(h,pose,p,sx,sy)=>{const P=h.poses[pose],r=Math.atan2(p.x-sx,sy-p.y),sn=Math.sin(r),cs=Math.cos(r);let up=P.ay,dn=0;
    for(const x of [-P.ax,P.w-P.ax])for(const y of [-P.ay,P.h-P.ay]){const o=x*sn+y*cs;up=Math.max(up,-o);dn=Math.max(dn,o);}return sy>p.y?SH+34+h.base*up:-34-h.base*dn;};
  const offFrom=(p,sx,sy,y)=>{const dx=sx-p.x,dy=sy-p.y,len=Math.hypot(dx,dy)||1;let d=dy/len;if(Math.abs(d)<.2)d=d<0?-.2:.2;const k=(y-p.y)/d;return{x:p.x+dx/len*k,y:p.y+dy/len*k};};
  const enter=(h,t0,t1,p,pose,sh)=>{const o=offFrom(p,sh[0],sh[1],offY(h,pose,p,sh[0],sh[1]));const dur=clamp(Math.hypot(p.x-o.x,p.y-o.y)/700,.8,1.3);
    const stt=Math.min(t1-.35,Math.max(Math.min(t0,t1-dur),h.tr.last().t+.02));h.tr.set(stt,{x:o.x,y:o.y,sx:sh[0],sy:sh[1],s:1});h.pose.set(stt,pose);h.tr.move(stt,t1,{x:p.x,y:p.y},.04,easeOut);h.in=true;return stt;};
  const leave=(h,t0,t1)=>{const s=h.tr.at(t0);const o=offFrom(s,s.sx,s.sy,offY(h,h.pose.at(t0).v,s,s.sx,s.sy));h.tr.move(t0,t1,{x:o.x,y:o.y},0,easeIn);h.in=false;};
  /* a held card keeps the same point under the fingers */
  const cardPos=(c,t)=>cardPosOf(c,t);
  const take=(c,h,t)=>{const cp=cardPos(c,t),hp=h.tr.at(t);c.fol.push({t0:t,t1:1e9,h,dx:cp.x-hp.x,dy:cp.y-hp.y,s0:c.tr.at(t).s||1});c.tr.set(t,{l:1});};
  const release=(c,t)=>{const f=c.fol[c.fol.length-1];if(!f||f.t1<1e9)return;const p=folPos(c,f,t);f.t1=t;c.tr.set(t,{x:p.x,y:p.y});c.tr.move(t,t+.2,{l:0});};
  const carryTo=(c,h,t0,t1,dst,arc)=>{const f=c.fol[c.fol.length-1],k=(c.tr.at(t1).s||1)/f.s0;handTo(h,t0,t1,{x:dst.x-f.dx*k,y:dst.y-f.dy*k},arc==null?.18:arc);};
  /* where the fingers take a block (its upper left), and where it lies in a bin (a 3 by 3 of slots, filled in order) */
  const gripOf=c=>({x:c.home.x-6,y:c.home.y-4});
  const SLOT=[[0,0],[-44,-40],[44,-42],[-46,42],[46,40],[0,-46],[2,46],[-46,0],[46,2]];
  /* the student's hand places the next block: picks it from the tray at tp (the hand arrives then), lands it in the bin at
     tp+.75; the hand waits over the bin. A bin remembers how many blocks lie in it. */
  const bins={};const binAt=(id,c)=>{bins[id]=bins[id]||{c,n:0};return bins[id];};
  let pool=blocks1,next=0;
  const place=(tp,binId,binC,sz)=>{const c=pool[next++%pool.length];const g=gripOf(c);const bn=binAt(binId,binC);
    if(HL.in)handTo(HL,tp-.55,tp,g,.1);else enter(HL,tp-1,tp,g,'pinch',HL.in===false?SHL:SHL);
    HL.pose.set(Math.max(HL.tr.last().t-1,tp-.6),'pinch');
    take(c,HL,tp+.02);const slot=SLOT[bn.n%SLOT.length];bn.n++;const dst={x:binC.x+slot[0]*(sz||1)*.78,y:binC.y+slot[1]*(sz||1)*.78};
    carryTo(c,HL,tp+.1,tp+.75,{x:dst.x,y:dst.y-12},.22);release(c,tp+.75);c.tr.move(tp+.75,tp+.95,{x:dst.x,y:dst.y,s:.9*(sz||1),r:(bn.n*37)%40-20},0,easeIn);
    return tp+.75;};
  /* between sessions the bins are emptied: the blocks fade back into the tray */
  const resetBlocks=t=>{pool.forEach(c=>{if(c.fol.length){c.tr.move(t,t+.25,{o:0});c.tr.set(t+.3,{x:c.home.x,y:c.home.y,s:1,r:c.tr.k[1].st.r});c.tr.move(t+.35,t+.7,{o:1});}});for(const k in bins)bins[k].n=0;next=0;};
  const park=(h,t0,t1,p)=>{handTo(h,t0,t1,p,.06);};
  /* the assessor's hand brings an item to the student (the spot on the mat above the bin), and takes it back */
  const deliver=(item,t0,t1,spot)=>{const p=cardPos(item,t0),g={x:p.x+item.w*.42,y:p.y+4};
    if(HT.in)handTo(HT,t0-.6,t0,g,.1);else enter(HT,t0-1,t0,g,'pinch',SHT);HT.pose.set(Math.max(HT.tr.last().t-1,t0-.5),'pinch');
    take(item,HT,t0+.02);carryTo(item,HT,t0+.08,t1,spot||DROP,.14);release(item,t1);return t1;};
  const takeBack=(item,t0,t1,home)=>{const p=cardPos(item,t0),g={x:p.x+item.w*.42,y:p.y+4};
    if(HT.in)handTo(HT,t0-.5,t0,g,.1);else enter(HT,t0-.9,t0,g,'pinch',SHT);take(item,HT,t0+.02);carryTo(item,HT,t0+.08,t1,home||HOME[item.id]||HOME.tablet,.14);release(item,t1);return t1;};
  /* the student's hand rests on the tablet while the access runs */
  const restOn=(t0,t1,spot)=>{const p=spot||DROP;HL.pose.set(t0,'open');handTo(HL,t0,t0+.5,{x:p.x-8,y:p.y+18},.08);HL.pose.set(t1,'pinch');};
  /* a high five above the mat: the assessor's open hand comes to meet the student's */
  const HF={x:560,y:178};
  const hiFive=(t0)=>{if(HT.in)handTo(HT,t0-.7,t0,HF,.1);else enter(HT,t0-1.1,t0,HF,'open',SHT);HT.pose.set(Math.max(HT.tr.last().t-1.2,t0-.9),'open');
    HL.pose.set(t0-.5,'open');handTo(HL,t0-.55,t0+.05,{x:HF.x-14,y:HF.y+16},.12);
    const b=mkFx('wk-bub raw-bub','Nice work!',{x:HF.x-390,y:HF.y-130,w:300},{s:.6,dy:12});b.tr.move(t0,t0+.3,{o:1,s:1,dy:0},0,easeOut);b.tr.move(t0+1.5,t0+1.8,{o:0,dy:-8});
    leave(HT,t0+.7,t0+1.6);HL.pose.set(t0+.9,'pinch');return t0+.8;};
  /* ---- the session panel: the clock, the responses, the rate, the access, the cumulative record ---- */
  const PANEL=box(880,30,370,566);
  const panel=mkFx('raw-panel','<div class="raw-ph"><span class="raw-dot"></span><b class="raw-cond">Control</b><span class="raw-sess"></span></div>'
    +'<div class="raw-pso"><div class="raw-clock"><div class="raw-big raw-left">5:00</div><div class="raw-sub">time left <i class="raw-state">ready</i></div><div class="raw-pbar"><span></span></div></div>'
    +'<div class="raw-counts"><div class="raw-cnt"><div class="raw-big raw-n">0</div><div class="raw-sub">responses</div></div><div class="raw-cnt"><div class="raw-big raw-rate">&ndash;</div><div class="raw-sub">per minute</div></div></div>'
    +'<div class="raw-acc"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42" transform="rotate(-90 50 50)"/></svg><div class="raw-acct">20 s</div><div class="raw-accl">access &middot; the clock is paused</div></div>'
    +'<div class="raw-cum"><svg viewBox="0 0 330 150" aria-hidden="true"><line x1="34" y1="8" x2="34" y2="126" class="ax"/><line x1="34" y1="126" x2="324" y2="126" class="ax"/><text x="36" y="142" class="tk">0</text><text x="318" y="142" class="tk" text-anchor="end">5 min</text><text x="28" y="12" class="tk" text-anchor="end">70</text><text x="28" y="130" class="tk" text-anchor="end">0</text><path class="raw-cmp"/><path class="raw-cur"/></svg><div class="raw-cuml">cumulative record: responses over the session</div></div></div>'
    +'<div class="raw-pco"></div><div class="raw-ppr"></div><div class="raw-ff">&#9193; fast-forward</div>',PANEL,{o:0},Ltab);
  const P={el:panel.el,dot:panel.el.querySelector('.raw-dot'),cond:panel.el.querySelector('.raw-cond'),sess:panel.el.querySelector('.raw-sess'),so:panel.el.querySelector('.raw-pso'),left:panel.el.querySelector('.raw-left'),state:panel.el.querySelector('.raw-state'),
    pbar:panel.el.querySelector('.raw-pbar span'),n:panel.el.querySelector('.raw-n'),rate:panel.el.querySelector('.raw-rate'),acc:panel.el.querySelector('.raw-acc'),accFg:panel.el.querySelector('.raw-acc .fg'),acct:panel.el.querySelector('.raw-acct'),accl:panel.el.querySelector('.raw-accl'),
    cum:panel.el.querySelector('.raw-cum'),cmp:panel.el.querySelector('.raw-cmp'),cur:panel.el.querySelector('.raw-cur'),co:panel.el.querySelector('.raw-pco'),pr:panel.el.querySelector('.raw-ppr'),ff:panel.el.querySelector('.raw-ff')};
  const COLN=['Tablet (video)','Fruit chew','Control'];
  P.co.innerHTML='<div class="raw-cot">Allocation</div>'+COLN.map((n,i)=>'<div class="raw-corow" data-i="'+i+'"><span class="raw-con" style="color:'+COL[COORD[i]]+'">'+esc(n)+'</span><span class="raw-cobar"><i style="background:'+COL[COORD[i]]+'"></i></span><b class="raw-cocnt">0</b><em class="raw-copct">&ndash;</em></div>').join('');
  P.coRows=[...P.co.querySelectorAll('.raw-corow')].map(r=>({bar:r.querySelector('.raw-cobar i'),cnt:r.querySelector('.raw-cocnt'),pct:r.querySelector('.raw-copct')}));
  const LAD=prLadder();
  P.pr.innerHTML='<div class="raw-prt">Progressive ratio: +2</div><div class="raw-lad">'+LAD.map((v,i)=>'<span class="raw-fr" data-i="'+i+'">FR '+v+'</span>').join('')+'</div>'
    +'<div class="raw-prnow"><div class="raw-big raw-prreq">FR 1</div><div class="raw-sub"><b class="raw-prgot">0</b> of <b class="raw-prneed">1</b> blocks placed</div></div>'
    +'<div class="raw-prrow"><div class="raw-cnt"><div class="raw-big raw-prrf">0</div><div class="raw-sub">reinforcers</div></div><div class="raw-cnt raw-prstop"><div class="raw-big raw-prst">120 s</div><div class="raw-sub">without a response: stop</div></div></div>'
    +'<div class="raw-prbp"><span>Break point</span><b class="raw-prbpv">&ndash;</b></div>';
  P.frs=[...P.pr.querySelectorAll('.raw-fr')];P.prreq=P.pr.querySelector('.raw-prreq');P.prgot=P.pr.querySelector('.raw-prgot');P.prneed=P.pr.querySelector('.raw-prneed');P.prrf=P.pr.querySelector('.raw-prrf');P.prst=P.pr.querySelector('.raw-prst');P.prstop=P.pr.querySelector('.raw-prstop');P.prbp=P.pr.querySelector('.raw-prbp');P.prbpv=P.pr.querySelector('.raw-prbpv');
  const dyns=[];const dyn=(t0,fn)=>{dyns.push({t0,fn});};
  /* a single-operant session as the panel shows it: real time while the hands work (the clock pauses during an access), then a
     fast-forward to the end of the five minutes with the rest of the responses spread over it */
  const TOTAL=300;
  const soSpec=o=>{const accIn=v=>o.acc.reduce((a,A)=>a+clamp(v-A[0],0,A[1]-A[0]),0);const sReal=v=>Math.max(0,(v-o.v0)-accIn(v));const sFF0=sReal(o.ff0);
    const sAt=v=>v<o.v0?0:v<o.ff0?sReal(v):v<o.ff1?sFF0+(TOTAL-sFF0)*easeOut((v-o.ff0)/(o.ff1-o.ff0)):TOTAL;
    const times=o.resp.map(sReal);const rest=Math.max(0,o.final-times.length);const from=sFF0+3;
    for(let i=0;i<rest;i++){const u=(i+.5)/rest;times.push(from+(TOTAL-5-from)*u+(((i*7)%5)-2)*1.2);}times.sort((a,b)=>a-b);o.times=times;
    return v=>{const s=sAt(v);const n=times.filter(x=>x<=s+1e-6).length;const A=o.acc.find(a=>v>=a[0]&&v<a[1]);
      return{kind:'so',cond:o.label,color:o.color,sess:o.sess,left:TOTAL-s,s,n,rate:s>=20||v>=o.ff1?n/(s/60):null,acc:A?{left:A[2]*(1-(v-A[0])/(A[1]-A[0])),total:A[2]}:null,ff:v>=o.ff0&&v<o.ff1,over:v>=o.ff1,started:v>=o.v0,cum:times,cmp:o.cmp||null,cmpCol:o.cmpCol||''};};};
  const pathOf=(times,s,ymax)=>{const X=t=>34+290*clamp(t/TOTAL,0,1),Y=n=>126-118*clamp(n/ymax,0,1);let d='M'+X(0)+' '+Y(0);let n=0;for(const t of times){if(t>s)break;d+='L'+f2(X(t))+' '+f2(Y(n))+'L'+f2(X(t))+' '+f2(Y(++n));}d+='L'+f2(X(s))+' '+f2(Y(n));return d;};
  const paintPanel=S0=>{if(!S0){return;}txt(P.cond,S0.cond||'');css(P.dot,'background',S0.color||'#888');txt(P.sess,S0.sess||'');
    css(P.so,'display',S0.kind==='so'?'block':'none');css(P.co,'display',S0.kind==='co'?'block':'none');css(P.pr,'display',S0.kind==='pr'?'block':'none');css(P.ff,'opacity',S0.ff?'1':'0');
    if(S0.kind==='so'){txt(P.left,mmss2(S0.left));txt(P.state,S0.over?'session over':S0.acc?'paused':S0.started?'running':'ready');css(P.pbar,'transform','scaleX('+(1-S0.left/TOTAL).toFixed(4)+')');
      txt(P.n,String(S0.n));txt(P.rate,S0.rate==null?'–':S0.rate.toFixed(1));css(P.acc,'opacity',S0.acc?'1':'0');if(S0.acc){const C=2*Math.PI*42;css(P.accFg,'strokeDasharray',f2(C));css(P.accFg,'strokeDashoffset',f2(C*(1-S0.acc.left/S0.acc.total)));txt(P.acct,Math.ceil(S0.acc.left)+' s');}
      const d=pathOf(S0.cum,S0.s,70);if(P.cur._d!==d){P.cur._d=d;P.cur.setAttribute('d',d);}const d2=S0.cmp?pathOf(S0.cmp,TOTAL,70):'';if(P.cmp._d!==d2){P.cmp._d=d2;P.cmp.setAttribute('d',d2);}css(P.cmp,'stroke',S0.cmpCol||'#8d989e');css(P.cur,'stroke',S0.color||'#1d3b5a');}
    else if(S0.kind==='co'){const tot=S0.n.reduce((a,b)=>a+b,0)||1;S0.n.forEach((n,i)=>{const r=P.coRows[i];css(r.bar,'transform','scaleX('+(n/Math.max(1,S0.max)).toFixed(4)+')');txt(r.cnt,String(n));txt(r.pct,tot>0&&S0.n.some(x=>x)?Math.round(100*n/tot)+'%':'–');});}
    else if(S0.kind==='pr'){P.frs.forEach((e,i)=>{tog(e,'done',i<S0.done);tog(e,'now',i===S0.done&&!S0.over);});const fr=LAD[Math.min(S0.done,LAD.length-1)];txt(P.prreq,'FR '+fr);txt(P.prgot,String(S0.got));txt(P.prneed,String(fr));txt(P.prrf,String(S0.done));
      css(P.prstop,'opacity',S0.stop?'1':'.35');txt(P.prst,S0.stop?Math.ceil(S0.stop.left)+' s':'120 s');tog(P.prbp,'on',S0.bp!=null);txt(P.prbpv,S0.bp==null?'–':'FR '+S0.bp);}};
  /* ---- the papers: copies of the form's sheets, one under the other, the camera moves over them ---- */
  const wrap=div('raw-worldwrap');Lcam.appendChild(wrap);const world=div('raw-world');wrap.appendChild(world);const worldFx=sub(wrap,{o:0});
  const q1=(s,root)=>(root||document).querySelector(s);
  const paper=(cls,w)=>{const p=div('smw-paper raw-paper '+(cls||''));p.style.width=(w||816)+'px';world.appendChild(p);return p;};
  const add=(p,el)=>{if(el)p.appendChild(el);return el;};
  const soP=paper('raw-so');add(soP,copyOf(q1('#so .bar')));const soRead=add(soP,copyOf(q1('#soReadout')));const soTbl=add(soP,copyOf(q1('#soTbl')));const soRank=add(soP,copyOf(q1('#soRank')));const soFig=add(soP,copyOf(q1('#so .figure')));const soMeth=add(soP,copyOf(q1('#so p.method')));
  const coP=paper('raw-co');add(coP,copyOf(q1('#co .bar')));add(coP,copyOf(q1('#coReadout')));const coTbl=add(coP,copyOf(q1('#coTbl')));const coRank=add(coP,copyOf(q1('#coRank')));const coFig=add(coP,copyOf(q1('#co .figure.co-st-only')));
  const prP=paper('raw-pr',1040);add(prP,copyOf(q1('#pr .bar')));const prPar=add(prP,copyOf(q1('#pr .sumhead')));const prTbl=add(prP,copyOf(q1('#prTbl')));const prRank=add(prP,copyOf(q1('#prRank')));const prFig=add(prP,copyOf(q1('#pr .figure')));
  const sumP=paper('raw-sum',900);add(sumP,copyOf(q1('#summary .bar')));const sumHead=add(sumP,copyOf(q1('#summary .sumhead')));const sumTbl=add(sumP,copyOf(q1('#sumTbl')));const sumMeth=add(sumP,copyOf(q1('#summary p.method')));
  const runP=paper('raw-run',760);const run=add(runP,copyOf(q1('#ra-run-so'),true));
  if(run){/* the runner as it looks part way through a tablet session */
    const set=(sel,v)=>{const e=run.querySelector(sel);if(e)e.textContent=v;};
    const sels=[...run.querySelectorAll('.ra-run-set .raw-v')];if(sels[0])sels[0].textContent=EXN[0];if(sels[1])sels[1].textContent='1';if(sels[2])sels[2].textContent='20';if(sels[3])sels[3].textContent='Minutes run less access time';
    const srcs=[...run.querySelectorAll('.ra-run-src')];if(srcs[0])srcs[0].textContent='Every response: FR 1';if(srcs[1])srcs[1].textContent='20 s access, as on Setup';
    set('.ra-run-big','3:48');set('.ra-run-sub b','Running');set('.ra-run-sub span','1:12 elapsed');set('.ra-run-cue b','Deliver '+EXN[0]);set('.ra-run-cue span','20 s of access, then the clock runs again');
    const ns=run.querySelectorAll('.ra-run-n');if(ns[0])ns[0].textContent='17';if(ns[1])ns[1].textContent='0';const bar=run.querySelector('.ra-run-bar span');if(bar)bar.style.width='24%';
    set('.ra-run-info','Every response produces '+EXN[0]+' for 20 s; the sheet takes minutes run less access time.');const scr=run.querySelector('.ra-run-script');if(scr)scr.remove();const sm=run.querySelector('.ra-run-sum');if(sm)sm.remove();const msg=run.querySelector('.ra-run-msg');if(msg)msg.remove();}
  let y=0;[soP,coP,prP,sumP,runP].forEach(p=>{p.style.top=y+'px';y+=p.offsetHeight+80;});world.style.width='1040px';world.style.height=y+'px';
  const wrel=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=world.getBoundingClientRect();const k=c.width/(world.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y0=Math.min(...rs.map(r=>r.y));return{x,y:y0,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y0};};
  const pad=(r,p)=>r?{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p}:null;
  const view=r=>{if(!r)return{x:0,y:0,s:1};const s=clamp(Math.min(1180/r.w,560/r.h),.3,1.9);return{x:SW/2-(r.x+r.w/2)*s,y:316-(r.y+r.h/2)*s,s};};
  const cam=new Track(view(wrel(soP)));
  const camTo=(t0,t1,r,ez)=>cam.move(t0,t1,view(r),0,ez);const camSet=(t,r)=>cam.set(t,view(r));
  const glowW=(r,t0,dur,p)=>glow(r,t0,dur,p==null?4:p,world);const noteW=(r,text,t0,t1,side)=>note(r,text,t0,t1,side,world);
  const rowsOf=tbl=>tbl&&tbl.tBodies[0]?[...tbl.tBodies[0].rows]:[];const colOf=(tbl,c)=>uni(rowsOf(tbl).map(tr=>wrel(tr.cells[c])).concat([tbl&&tbl.tHead?wrel(tbl.tHead.rows[0].cells[c]):null]));
  /* the papers are shown over a dimmed table; the hands are out of the frame then */
  const papers=(t0,t1)=>{const v=veil(t0,t1,.62);worldFx.tr.move(t0,t0+.5,{o:1});if(t1!=null)worldFx.tr.move(t1,t1+.4,{o:0});return v;};
  const panelShow=(t0,on)=>{panel.tr.move(t0,t0+.4,{o:on?1:0});};
  const matTo=(t,c)=>{matCol.set(t,c);};
  /* the arrangements: one bin on its mat (single operant, progressive ratio), or three bins in a row (concurrent operants) */
  const arrange=(t,three)=>{const a=three?0:1,b=three?1:0;mat1Fx.tr.move(t,t+.5,{o:a});bin1Fx.tr.move(t,t+.5,{o:a});tray1Fx.tr.move(t,t+.5,{o:a});tray2Fx.tr.move(t,t+.5,{o:b});none3Fx.tr.move(t,t+.5,{o:b});
    mats3.forEach(m=>m.fx.tr.move(t,t+.5,{o:b}));bins3.forEach(m=>m.fx.tr.move(t,t+.5,{o:b}));blocks1.forEach(c=>c.tr.move(t,t+.5,{o:a}));blocks2.forEach(c=>c.tr.move(t,t+.5,{o:b}));
    pool=three?blocks2:blocks1;next=0;for(const k in bins)bins[k].n=0;};
  /* rectangles on the stage (the panel's parts) */
  const srel=el=>{if(!el)return null;const sr=st.getBoundingClientRect(),k=(sr.width/SW)||1,r=el.getBoundingClientRect();return{x:(r.left-sr.left)/k,y:(r.top-sr.top)/k,w:r.width/k,h:r.height/k};};
  const measure=(el,fn)=>{const subs=[P.so,P.co,P.pr],o=subs.map(x=>x.style.display);subs.forEach(x=>{x.style.display=x===el?'block':'none';});try{return fn();}finally{subs.forEach((x,i)=>{x.style.display=o[i];});}};
  const R={bin:cbox(BIN1.x,BIN1.y,BINW,BINW),drop:cbox(DROP.x,DROP.y,160,110),tray:TRAY,mat:MAT1,tablet:cbox(HOME.tablet.x,HOME.tablet.y,150,105),chew:cbox(HOME.chew.x,HOME.chew.y,110,66),
    n:srel(P.n.parentElement),rate:srel(P.rate.parentElement),clock:srel(P.left.parentElement),acc:srel(P.acc),cum:srel(P.cum),panel:PANEL,
    co:measure(P.co,()=>P.coRows.map(r=>srel(r.pct.parentElement))),coPct:measure(P.co,()=>uni(P.coRows.map(r=>srel(r.pct)))),
    lad:measure(P.pr,()=>srel(P.pr.querySelector('.raw-lad'))),prnow:measure(P.pr,()=>srel(P.pr.querySelector('.raw-prnow'))),prstop:measure(P.pr,()=>srel(P.prstop)),prbp:measure(P.pr,()=>srel(P.prbp)),prrf:measure(P.pr,()=>srel(P.prrf.parentElement)),
    bins3:COX.map(x=>cbox(x,BINY,BIN2W,BIN2W)),mats3:COX.map(x=>box(x-MATW/2,MATY,MATW,MATH)),none:cbox(COX[2],112,150,60)};
  const words=(ws,box0,t0,ats)=>{const w=mkFx('smw-words raw-words',ws.map(x=>'<span>'+esc(x)+'</span>').join(''),box0,{o:1});const sp=[...w.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    sp.forEach((fx,i)=>{const a=ats[i]==null?t0+i*.5:ats[i];fx.tr.move(a,a+.4,{o:1,s:1,dy:0},0,easeOut);});return w;};
  const specs={};
  const SC={};
  /* ---- why test ---- */
  SC.intro=K=>{const t=K.t;
    card('raw-title','<h3>Reinforcer assessment</h3><p>Does getting it make the behavior more likely?</p>',{x:790,y:40,w:440},t+.3,Math.max(t+5.5,K.at('The way to find out',.62)-.3));
    const tp=Math.max(t+2,K.at('preference assessment',.15)-.2);note(uni([R.tablet,R.chew]),'PA-1: what the student picks',tp,tp+4,'below');glow(uni([R.tablet,R.chew]),tp,4,10);
    const tb=Math.max(tp+4.2,K.at('more likely',.42)-.2);glow(R.bin,tb,4,8,null,true);note(R.bin,'The behavior: a block in the bin',tb+.2,tb+4,'below');
    const tw=Math.max(tb+4,K.at('with the item delivered',.72)-1.3);deliver(tablet,tw,tw+1.2);note(R.drop,'Delivered for it',tw+1.2,tw+3.2,'below');
    const tx=Math.max(tw+2.6,K.at('and without',.9)-.4);takeBack(tablet,tx,tx+1);leave(HT,tx+1.1,tx+2);note(R.drop,'And without',tx+.9,K.t+K.d+.3,'below');
    return Math.max(K.d,tx+2.2-K.t);};
  SC.response=K=>{const t=K.t;
    const tp=Math.max(t+1.3,K.at('something the student',.12)-.4);const tl=place(tp,'bin1',BIN1);note(R.bin,'1 response',tl+.05,tl+2.4,'below');
    const crit=[['Can already do it','already do',.2],['Easy to count','easy to count',.3],['Produces nothing by itself','produces nothing',.42],['Takes a little effort','little effort',.56]];
    crit.forEach((c,i)=>{const ti=Math.max(tl+.6+i*.9,K.at(c[1],c[2])-.15);chip(c[0],{x:60,y:52+i*42,w:340},ti,K.t+K.d+.3,'raw-chipl');});
    const t2=Math.max(tl+4.6,K.at('Here it is placing',.68)-.3);const tl2=place(t2,'bin1',BIN1);
    const tc=Math.max(tl2+.1,K.at('counted when',.86)-.1);glow(R.bin,tc,2.6,8,null,true);note(R.bin,'Counted when it lands',tc+.1,K.t+K.d+.3,'below');
    leave(HL,Math.max(tl2+1.2,K.t+K.d-.8),Math.max(tl2+2,K.t+K.d));return Math.max(K.d,tl2+2.2-K.t);};
  /* ---- single operant ---- */
  SC.control=K=>{const t=K.t;resetBlocks(t);matTo(t+.2,'ctl');panelShow(t+.3,true);
    const v0=Math.max(t+1.8,K.at('The student places',.28)-1.2);const lands=[v0+.6,v0+4.2,v0+7.8].map(x=>place(x,'bin1',BIN1));
    const tn=Math.max(lands[0]+.3,K.at('nothing happens',.44)-.2);note(R.drop,'Nothing happens',tn,tn+3,'below');
    const ff0=Math.max(lands[2]+.6,K.at('The session runs five minutes',.56)-.2),ff1=ff0+3.2;leave(HL,ff0,ff0+.9);
    const o=specs.ctl={label:'Control',color:COL.ctl,sess:'Session 1 of 16 · multielement',v0,ff0,ff1,resp:lands,acc:[],final:12};dyn(t,soSpec(o));
    const tr=Math.max(ff1-.4,K.at('responses per minute',.74)-.2);glow(R.rate,tr,3,6);
    const tb=Math.max(tr+1.5,K.at('has to beat',.9)-.3);note(R.rate,'2.4 a minute: the rate to beat',tb,K.t+K.d+.4,'below');
    return Math.max(K.d,ff1+1-K.t);};
  SC.reinforce=K=>{const t=K.t;resetBlocks(t);matTo(t+.2,'0');
    const v0=t+1.1;const l1=place(v0+.4,'bin1',BIN1);const d1=deliver(tablet,l1+.35,l1+1.5);const a1=[d1,d1+3.2,20];restOn(d1+.1,a1[1]-.1);
    note(R.drop,'Within 2 s · 20 s · the same every time',d1+.1,a1[1]+.6,'below');
    const b1=takeBack(tablet,a1[1]+.1,a1[1]+1.1);const l2=place(b1+.3,'bin1',BIN1);const d2=deliver(tablet,l2+.35,l2+1.5);const a2=[d2,d2+3.2,20];restOn(d2+.1,a2[1]-.1);
    const tp=Math.max(d2+.3,K.at('clock pauses',.52)-.2);glow(R.clock,tp,2.8,6);note(R.clock,'The clock waits: minutes of available time',tp+.2,tp+3.4,'below');
    const b2=takeBack(tablet,Math.max(a2[1]+.1,K.at('tablet goes away',.8)-1),Math.max(a2[1]+1.1,K.at('tablet goes away',.8)));leave(HT,b2+.2,b2+1.1);
    const ff0=b2+.4,ff1=ff0+3;leave(HL,ff0,ff0+.9);
    const o=specs.tab={label:EXN[0],color:COL['0'],sess:'Session 2 of 16 · multielement',v0,ff0,ff1,resp:[l1,l2],acc:[a1,a2],final:58};dyn(t,soSpec(o));
    note(R.rate,'11.6 a minute',ff1,ff1+2.5,'below');return Math.max(K.d,ff1+1.6-K.t);};
  SC.effect=K=>{const t=K.t;
    dyn(t,v=>({kind:'so',cond:EXN[0],color:COL['0'],sess:'Session 2 of 16 · against session 1, control',left:0,s:TOTAL,n:58,rate:11.6,acc:null,ff:false,over:true,started:true,cum:specs.tab.times,cmp:specs.ctl.times,cmpCol:COL.ctl}));
    glow(R.n,t+.2,2.6,6);const tr=Math.max(t+2,K.at('The rate climbs',.12)-.1);glow(R.cum,tr,3.4,6);note(R.cum,'Tablet above, control below',tr+.3,tr+3.4,'below');
    const tf=Math.max(tr+1.6,K.at('stays up across sessions',.26)-.3);const fc=card('raw-figcard','',{x:40,y:36,w:800},tf,K.t+K.d+.3);const fig=copyOf(q1('#so .figure'));if(fig){fig.querySelector('p.cap')&&fig.querySelector('p.cap').remove();fc.el.appendChild(fig);}
    const means=k=>EXSO.filter(x=>x[0]===k).map(x=>(x[1]/5).toFixed(1)).join(' · ');
    const tl=Math.max(tf+1.2,K.at('while control stays low',.4)-.2);chip('Tablet: '+means('0')+' a minute',{x:70,y:420,w:380},tl,K.t+K.d+.3,'raw-chipl');chip('Control: '+means('ctl'),{x:470,y:420,w:340},tl+.5,K.t+K.d+.3,'raw-chipl');
    const te=Math.max(tl+2.5,K.at('That difference',.56)-.2);chip('Reinforcement effect = the difference, replicated',{x:70,y:472,w:740},te,K.t+K.d+.3,'raw-chipb');
    const tn=Math.max(te+2.5,K.at('not that the student likes',.76)-.2);chip('Likes it: a preference',{x:70,y:530,w:340},tn,K.t+K.d+.3,'raw-chipl raw-dim');chip('Changes what the student does: a reinforcer',{x:430,y:530,w:380},Math.max(tn+1.2,K.at('changes what',.88)-.2),K.t+K.d+.3,'raw-chipl');
    return K.d+.3;};
  SC.sheet=K=>{const t=K.t;papers(t,K.t+K.d+.1);panelShow(t,false);
    const rows=rowsOf(soTbl);camSet(t,pad(uni([wrel(soTbl.tHead)].concat(rows.slice(0,8).map(wrel))),16));
    const tr0=Math.max(t+.8,K.at('one row',.1)-.3);rows.slice(0,4).forEach((tr,i)=>glowW(wrel(tr),tr0+i*.4,2.2,2));noteW(wrel(rows[0]),'Session 1: control, 12 responses, 5 minutes, 2.4 a minute',tr0+.3,tr0+3.6);
    const tg=Math.max(tr0+3.6,K.at('the graph plots',.26)-.4);camTo(tg,tg+1.1,pad(wrel(soFig),10));glowW(wrel(soFig),tg+1,3,4);
    const tv=Math.max(tg+3.6,K.at('The verdict is read',.42)-.4);camTo(tv,tv+1.1,pad(wrel(soRank),14));glowW(colOf(soRank,4),Math.max(tv+1.1,K.at('ratio to control',.5)-.2),3,2);glowW(colOf(soRank,5),Math.max(tv+2,K.at('the overlap',.56)-.2),3,2);
    const tc=Math.max(tv+3.2,K.at('twice the control rate',.62)-.2);glowW(colOf(soRank,7),tc,K.t+K.d-tc,3);noteW(colOf(soRank,7),'Clear: ratio ≥ 2, no overlap, 3+ sessions each',tc+.3,tc+5,'below');
    const tn=Math.max(tc+5.2,K.at('The numbers support',.85)-.4);camTo(tn,tn+1.2,pad(uni([wrel(soFig),wrel(soRank)]),12));glowW(wrel(soFig),tn+1.2,K.t+K.d-tn-1,4);noteW(wrel(soFig),'Read the plot first',tn+1.4,K.t+K.d+.2,'below');return K.d;};
  SC.praise=K=>{const t=K.t;resetBlocks(t);matTo(t+.2,'2');panelShow(t+.2,true);
    const v0=t+1.2;const l1=place(v0+.4,'bin1',BIN1);const h1=hiFive(l1+1.05);const l2=place(h1+1.3,'bin1',BIN1);const h2=hiFive(l2+1.05);
    const ff0=h2+1.1,ff1=ff0+2.6;leave(HL,ff0,ff0+.9);
    const o=specs.pr8={label:EXN[2],color:COL['2'],sess:'Session 4 of 16 · multielement',v0,ff0,ff1,resp:[l1,l2],acc:[],final:13,cmp:null};o.cmp=specs.ctl.times;o.cmpCol=COL.ctl;dyn(t,soSpec(o));
    const tc=Math.max(t+1.5,K.at('chosen almost half',.2)-.2);chip('PA-1: chosen 46% of the time',{x:40,y:56,w:340},tc,tc+5,'raw-chipl');
    const tr=Math.max(ff1-.2,K.at('its rate sits with control',.5)-.2);glow(R.rate,tr,3,6);note(R.rate,'2.6 a minute · control 2.4',tr+.2,tr+3.4,'below');
    const tp=Math.max(tr+3,K.at('Preferred is not',.72)-.2);veil(tp,K.t+K.d+.2,.35);card('raw-why','<h3>Preferred is not the same as reinforcing</h3><p>PA-1: chosen 46% of the time. Single operant: 2.6 a minute against 2.4 in control. Reinforcement effect: <b>None</b>.</p>',{x:90,y:150,w:700},tp,K.t+K.d+.2);
    return Math.max(K.d,ff1+1.2-K.t);};
  /* ---- concurrent operants ---- */
  SC.co_setup=K=>{const t=K.t;panelShow(t,false);arrange(t+.3,true);tablet.tr.move(t+.4,t+1.3,{x:HOME2[0].x,y:HOME2[0].y});chew.tr.move(t+.4,t+1.3,{x:HOME2[1].x,y:HOME2[1].y});
    const tq=Math.max(t+1.6,K.at('which one',.18)-.2);chip('Which one, when both are there?',{x:880,y:70,w:370},tq,tq+5,'raw-chipb');
    const t2=Math.max(tq+3,K.at('Two identical bins',.32)-.2);glow(R.bins3[0],t2,3,8,null,true);glow(R.bins3[1],t2,3,8,null,true);note(uni([R.bins3[0],R.bins3[1]]),'Identical, the same distance away',t2+.2,t2+3,'below');
    const ta=Math.max(t2+3,K.at('A block in one',.47)-.2);glow(uni([R.bins3[0],cbox(COX[0],112,150,105)]),ta,2.6,6);const tb=Math.max(ta+1.6,K.at('the other earns',.56)-.2);glow(uni([R.bins3[1],cbox(COX[1],112,110,66)]),tb,2.6,6);
    const tn=Math.max(tb+1.6,K.at('third bin',.64)-.2);glow(uni([R.bins3[2],R.none]),tn,2.6,6);
    const tr=Math.max(tn+2.8,K.at('positions rotate',.76)-.3);const rot=(t0,k)=>{const dx=i=>205*(((i+k)%3)-i);mats3.forEach((m,i)=>m.fx.tr.move(t0,t0+1,{dx:dx(i)}));
      tablet.tr.move(t0,t0+1,{x:COX[(0+k)%3],y:112},.1);chew.tr.move(t0,t0+1,{x:COX[(1+k)%3],y:112},.1);none3Fx.tr.move(t0,t0+1,{dx:dx(2)});};
    rot(tr,1);chip('Session 2: the mats move',{x:300,y:40,w:520},tr,tr+1.8,'raw-chipb');rot(tr+1.9,2);chip('Session 3',{x:300,y:40,w:520},tr+1.9,tr+3.6,'raw-chipb');
    const ts=Math.max(tr+3.8,K.at('side bias',.9)-.3);note(uni(R.mats3),'A side bias would follow the side, not the item',ts,K.t+K.d+.3,'below');return Math.max(K.d,tr+4-K.t);};
  SC.co_run=K=>{const t=K.t;panelShow(t+.2,true);const bT={x:COX[2],y:BINY},bC={x:COX[0],y:BINY},dT={x:COX[2],y:300},dC={x:COX[0],y:300};
    const l1=place(t+1.4,'bin3t',bT,.82);const d1=deliver(tablet,l1+.35,l1+1.4,dT);const a1=[d1,d1+1.5,20];const b1=takeBack(tablet,a1[1]+.1,a1[1]+1,{x:COX[2],y:112});
    const l2=place(b1+.3,'bin3c',bC,.82);const d2=deliver(chew,l2+.35,l2+1.4,dC);chew.tr.move(d2+.3,d2+.8,{o:0});chew.tr.set(d2+1,{x:COX[0],y:112});chew.tr.move(d2+1.1,d2+1.6,{o:1});leave(HT,d2+.2,d2+1.1);
    const ff0=d2+1,ff1=ff0+2.4;leave(HL,ff0,ff0+.9);const ev=[[l1,0],[l2,1]];
    dyn(t,v=>{const n=[0,0,0];ev.forEach(e=>{if(v>=e[0])n[e[1]]++;});if(v>=ff0){const u=easeOut(clamp((v-ff0)/(ff1-ff0),0,1));[34,9,1].forEach((f,i)=>{n[i]=Math.round(n[i]+(f-n[i])*u);});}
      return{kind:'co',cond:'Three bins',color:'#1d3b5a',sess:'Session 3 of 10 · the positions as rotated',n,max:40,ff:v>=ff0&&v<ff1};});
    const tm=Math.max(ff1-.3,K.at('The measure is allocation',.62)-.2);glow(R.coPct,tm,3.2,6);note(R.coPct,'Each option’s share of the responses',tm+.2,K.t+K.d+.3,'below');
    return Math.max(K.d,ff1+1.4-K.t);};
  SC.co_read=K=>{const t=K.t;papers(t,K.t+K.d+.1);panelShow(t,false);const rows=rowsOf(coRank);
    camSet(t,pad(uni([wrel(coTbl.tHead)].concat(rowsOf(coTbl).slice(0,6).map(wrel))),16));const tr0=t+.6;rowsOf(coTbl).slice(0,3).forEach((tr,i)=>glowW(wrel(tr),tr0+i*.4,2,2));
    const tv=Math.max(tr0+2.2,K.at('relative test',.1)-.2);camTo(tv,tv+1.1,pad(wrel(coRank),14));glowW(colOf(coRank,6),tv+1.1,3,2);
    const tc=Math.max(tv+3,K.at('small share',.26)-.2);if(rows[1]){glowW(wrel(rows[1].cells[3]),tc,3.4,3);noteW(wrel(rows[1].cells[3]),'A fifth of the responses: Lower',tc+.2,tc+3.4);}
    const ta=Math.max(tc+3.4,K.at('alone, it was',.5)-.3);if(rows[1])noteW(wrel(rows[1].cells[6]),'Alone: Clear, on the single-operant sheet',ta,ta+3.6,'below');
    const tb=Math.max(ta+3.4,K.at('the tablet beats it',.64)-.2);if(rows[0])glowW(wrel(rows[0].cells[6]),tb,K.t+K.d-tb,3);
    const tp=Math.max(tb+2.6,K.at('a plan with a choice',.86)-.2);if(rows[0])noteW(wrel(rows[0].cells[6]),'What a plan with a choice needs to know',tp,K.t+K.d+.3,'below');return K.d;};
  /* ---- progressive ratio ---- */
  SC.pr_run=K=>{const t=K.t;arrange(t+.2,false);matTo(t+.3,'0');panelShow(t+.4,true);tablet.tr.move(t+.2,t+1,{x:HOME.tablet.x,y:HOME.tablet.y});chew.tr.move(t+.2,t+1,{x:HOME.chew.x,y:HOME.chew.y,o:1});
    const l1=place(t+1.6,'bin1',BIN1);const d1=deliver(tablet,l1+.35,l1+1.5);restOn(d1+.1,d1+1.7);const b1=takeBack(tablet,d1+1.9,d1+2.8);
    const l2=place(b1+.3,'bin1',BIN1),l3=place(l2+.42,'bin1',BIN1),l4=place(l3+.42,'bin1',BIN1);const d2=deliver(tablet,l4+.35,l4+1.5);restOn(d2+.1,d2+1.7);const b2=takeBack(tablet,d2+1.9,d2+2.8);
    const ff0=b2+.3,ff1=ff0+2.2;leave(HT,b2+.2,b2+1.1);handTo(HL,ff0,ff0+.6,{x:TRAY.x+TRAY.w-30,y:TRAY.y+TRAY.h+30},.06);
    const l5=place(ff1+.4,'bin1',BIN1),l6=place(l5+.42,'bin1',BIN1);handTo(HL,l6+.3,l6+.9,{x:TRAY.x+TRAY.w/2,y:TRAY.y+TRAY.h+40},.06);
    const s0=l6+.6,s1=s0+2.4;leave(HL,s1+.6,s1+1.5);
    dyn(t,v=>{let done=0,got=0,bp=null,stop=null,ff=false;
      if(v<ff0){got=v>=l1?1:0;if(v>=d1){done=1;got=[l2,l3,l4].filter(x=>v>=x).length;}if(v>=d2){done=2;got=0;}}
      else if(v<ff1){ff=true;const u=easeOut((v-ff0)/(ff1-ff0));const prog=2+6*u;done=Math.min(8,Math.floor(prog));got=Math.round((prog-done)*LAD[Math.min(done,LAD.length-1)]);}
      else{done=8;got=[l5,l6].filter(x=>v>=x).length;if(v>=s0)stop={left:120*(1-clamp((v-s0)/(s1-s0),0,1)),total:120};if(v>=s1){bp=LAD[7];stop={left:0,total:120};}}
      return{kind:'pr',cond:EXN[0],color:COL['0'],sess:'Session 1 of 3 · progressive ratio, +2',done,got,stop,bp,ff,over:v>=s1};});
    const tf=Math.max(d1-.2,K.at('costs one block',.2)-.3);glow(R.prnow,tf,2.6,6);note(R.prnow,'FR 1: one block, one tablet',tf+.2,tf+2.8,'below');
    const tg=Math.max(l2,K.at('grows by a fixed step',.38)-.2);glow(R.lad,tg,3,6);note(R.lad,'+2 after every reinforcer: FR 1, 3, 5 …',tg+.2,tg+3.2,'below');
    const tw=Math.max(ff0,K.at('keeps working',.56)-.2);note(R.prrf,'Still worth it',tw,tw+2.4,'below');
    const ts=Math.max(s0,K.at('stop interval',.76)-.2);glow(R.prstop,ts,s1-ts+.6,6);note(R.prstop,'No response for 120 s: the session ends',ts+.2,s1+.8,'below');
    glow(R.prbp,s1,3,6);note(R.prbp,'Break point: FR 15, the last ratio completed',s1+.2,s1+3.4,'below');return Math.max(K.d,s1+3.6-K.t);};
  SC.pr_read=K=>{const t=K.t;papers(t,K.t+K.d+.1);panelShow(t,false);const rows=rowsOf(prRank);const rowOf=re=>rows.find(r=>re.test(r.cells[1].textContent));
    camSet(t,pad(uni([wrel(prPar),wrel(prRank)]),16));const tp=Math.max(t+.8,K.at('same step',.14)-.3);glowW(wrel(prPar),tp,3,3);noteW(wrel(prPar),'The same progression, stop interval and cap for every stimulus',tp+.2,tp+3.4,'below');
    const tb=Math.max(tp+3.4,K.at('well above',.3)-.3);camTo(tb,tb+1,pad(wrel(prRank),14));glowW(colOf(prRank,3),tb+1,3.2,2);const rT=rowOf(/Tablet/),rC=rowOf(/Fruit/),rK=rowOf(/^Control/),rP=rowOf(/Praise/);
    if(rT)noteW(wrel(rT.cells[3]),'Plan ratio FR 5: the tablet (15.7) and the chew (8.3) carry it',Math.max(tb+1.4,K.at('can carry it',.45)-.2),tb+5.4);
    const tn=Math.max(tb+5.4,K.at('near the control',.56)-.2);if(rP&&rK){glowW(uni([wrel(rP),wrel(rK)]),tn,3.4,2);noteW(wrel(rP.cells[3]),'Praise: 1.7, the control’s own break point',tn+.2,tn+3.6,'below');}
    const tu=Math.max(tn+3.6,K.at('One break point is unstable',.68)-.2);glowW(colOf(prRank,2),tu,3,2);noteW(colOf(prRank,2),'Three sessions each',tu+.2,tu+3,'below');
    const tc=Math.max(tu+3,K.at('no-reinforcer control',.88)-.2);if(rK)glowW(wrel(rK),tc,K.t+K.d-tc,3);
    const tf=Math.max(tc+.5,K.t+K.d-4);camTo(tf,tf+1.2,pad(uni([wrel(prRank),wrel(prFig)]),12));return K.d;};
  /* ---- at the table ---- */
  SC.rules=K=>{const t=K.t;panelShow(t,false);veil(t,K.t+K.d+.2,.55);
    const tips=[['Deliver immediately','a fixed magnitude, no added praise'],['A no-consequence control','the same materials, the assessor neutral'],['Restrict access before','a few hours; record any access there was'],['Problem behavior every session','and the stop rule'],['A second observer','about one session in three, when the result goes into a plan']];
    const c=card('smw-tips raw-tips','<h3>For every design</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong> '+esc(x[1])+'</p></div>').join(''),{x:180,y:28,w:920},t+.3,K.t+K.d+.2);
    const rs=[...c.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));const at=[['Deliver the stimulus',.1],['no-consequence control',.36],['Restrict access',.5],['Record problem behavior',.72],['second observer',.84]].map((a,i)=>Math.max(t+.9+i*.5,K.at(a[0],a[1])-.2));
    rs.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});return K.d+.3;};
  SC.runner=K=>{const t=K.t;papers(t,K.t+K.d+.1);panelShow(t,false);if(!run)return K.d;camSet(t,pad(wrel(run),10));
    const q=s=>run.querySelector(s);const btns=[...run.querySelectorAll('.ra-run-ctl .raw-btn')];
    const tt=Math.max(t+1.2,K.at('times the session',.2)-.2);glowW(wrel(q('.ra-run-clock')),tt,3,4);
    const tc=Math.max(tt+2.6,K.at('cues each delivery',.36)-.2);glowW(wrel(q('.ra-run-cue')),tc,3,4);noteW(wrel(q('.ra-run-cue')),'Deliver, and the access timer runs',tc+.2,tc+3,'below');
    const tr=Math.max(tc+3,K.at('counts the responses',.5)-.2);glowW(wrel(q('.ra-run-resp')),tr,3,4);noteW(wrel(q('.ra-run-resp')),'Tap, or press Space',tr+.2,tr+3,'below');
    const ts=Math.max(tr+3,K.at('writes the row',.64)-.2);if(btns[2])glowW(wrel(btns[2]),ts,3,4);
    const tk=Math.max(ts+3,K.at('Space or R',.82)-.2);glowW(wrel(q('.ra-run-keys')),tk,K.t+K.d-tk,4);return K.d;};
  /* ---- the result ---- */
  SC.summary=K=>{const t=K.t;papers(t,K.t+K.d+.1);panelShow(t,false);const rows=rowsOf(sumTbl);camSet(t,pad(uni([wrel(sumHead),wrel(sumTbl)]),14));
    const cols=[['the preference rank',.18,[1]],['the single-operant ratio',.27,[2,3]],['the concurrent allocation',.36,[4,5]],['the break point',.44,[6,7]],['and a verdict',.52,[8]]];
    cols.forEach((c,i)=>{const ti=Math.max(t+1+i*1.1,K.at(c[0],c[1])-.2);c[2].forEach(ci=>glowW(colOf(sumTbl,ci),ti,2.2,2));});
    const ta=Math.max(t+7,K.at('confirmed by an absolute test',.64)-.3);if(rows[0]){glowW(wrel(rows[0].cells[8]),ta,4,3);noteW(wrel(rows[0].cells[8]),'Confirmed: a Clear single-operant effect, or High potency',ta+.2,ta+4.2);}
    const tr=Math.max(ta+4.2,K.at('relative only',.8)-.3);glowW(colOf(sumTbl,5),tr,3.4,2);noteW(colOf(sumTbl,5),'Won only the concurrent test: Relative only',tr+.2,tr+3.6,'below');
    const ts=Math.max(tr+3.6,K.at('the plan’s schedule',.9)-.3);const pr=sumHead&&sumHead.querySelector('.raw-v');if(pr)glowW(wrel(pr),ts,K.t+K.d-ts,4);glowW(colOf(sumTbl,6),ts,K.t+K.d-ts,2);if(pr)noteW(wrel(pr),'FR 5, from the break points',ts+.2,K.t+K.d+.3,'below');return K.d;};
  SC.outro=K=>{const t=K.t;panelShow(t,false);veil(t+.2,null,.55);
    words(['Deliver','Count','Compare'],{x:90,y:250,w:1100},t,[['deliver',.05],['count',.4],['compare',.7]].map((a,i)=>Math.max(t+.4+i*.5,K.at(a[0],a[1])-.15)));return K.d+.8;};

  /* ---- the timeline ---- */
  let T=0;const cues=[];
  IDS.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||CHAPS[0][0],chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  const chapters=CHAPS.map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,world,fxs,cards,hands,dyns,cap,notes,matCol,mat1,mat1Lbl,paintPanel,example:true};
}
/* a held card keeps the same point under the fingers: the offset from the hand scales with the card */
function folPos(c,f,t){const hp=f.h.tr.at(t),k=(c.tr.at(t).s||1)/(f.s0||1);return{x:hp.x+f.dx*k,y:hp.y+f.dy*k};}
function cardPosOf(c,t){for(const f of c.fol)if(t>=f.t0&&t<f.t1)return folPos(c,f,t);return c.tr.at(t);}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const P='․';const guard=text.replace(/(\d)\.(\d)/g,'$1'+P+'$2');   /* 2.4 is one number, not a sentence's end */
  const parts=(guard.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[guard]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,guard.indexOf(p.slice(0,12),cur));cur=i+1;return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p.split(P).join('.')};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  const c=B.cam.at(v);css(B.world,'transform','translate('+f2(c.x)+'px,'+f2(c.y)+'px) scale('+c.s.toFixed(4)+')');
  const mc=B.matCol.at(v).v;css(B.mat1,'background',mc==='none'?'#c4bdb0':COL[mc]);txt(B.mat1Lbl,mc==='none'?'':MATL[mc]);
  /* the blocks and the items: placed, carried (following a hand), lifted (a larger shadow) */
  for(const cd of B.cards){const s=cd.tr.at(v),p=cardPosOf(cd,v),k=s.s*(1+.07*s.l);css(cd.el,'opacity',f2(s.o));css(cd.el,'visibility',s.o>.001?'visible':'hidden');
    css(cd.el,'transform','translate('+f2(p.x-cd.w/2)+'px,'+f2(p.y-cd.h/2)+'px) rotate('+f2(s.r||0)+'deg) scale('+k.toFixed(4)+')');css(cd.sh,'transform','translate('+f2(3+12*s.l)+'px,'+f2(4+16*s.l)+'px)');css(cd.sh,'opacity',f2(.3+.3*s.l));}
  /* the hands: each pose is drawn about the point that touches; while a pose changes, the new drawing starts with its wrist where the
     old one's wrist is (so the forearms coincide and no second arm shows) and slides onto its own touch point over 0.3 s */
  for(const h of B.hands){const s=h.tr.at(v),ps=h.pose.at(v),ang=Math.atan2(s.x-s.sx,s.sy-s.y)*180/Math.PI,u=clamp(ps.since/.14,0,1);
    let lf=0;for(const L of h.lifts)lf=Math.max(lf,bump(v,L[0],L[1]));const sc=h.base*s.s*(1+.05*lf);
    const vis=s.y<SH+420&&s.y>-900;let ox=0,oy=0;
    if(ps.prev!==ps.v&&ps.since<.3&&h.poses[ps.prev]){const r=ang*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),W=P=>{const dx=(P.wx-P.ax)*sc,dy=(P.wy-P.ay)*sc;return[dx*cs-dy*sn,dx*sn+dy*cs];};
      const a=W(h.poses[ps.prev]),b=W(h.poses[ps.v]),k=1-ps.since/.3;ox=(a[0]-b[0])*k;oy=(a[1]-b[1])*k;}
    const sw=ps.prev!==ps.v&&ps.since<.14&&!!h.poses[ps.prev];
    for(const name in h.poses){const P=h.poses[name];const nw=name===ps.v&&ps.prev!==name,old=sw&&name===ps.prev;const o=name===ps.v?1:old?1-u:0;
      css(P.el,'opacity',f2(vis?o:0));css(P.el,'visibility',vis&&o>.001?'visible':'hidden');css(P.el,'zIndex',old?'2':'1');tog(P.el,'wk-out',old);
      css(P.el,'transform','translate('+f2(s.x-P.ax+(nw?ox:0))+'px,'+f2(s.y-P.ay+(nw?oy:0))+'px) rotate('+f2(ang)+'deg) scale('+sc.toFixed(4)+')');}}
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');
    const keepX=fx.el.classList.contains('raw-note');const tr=(keepX?'translateX(-50%) ':'')+(s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'');css(fx.el,'transform',tr.trim()||'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  /* the session panel: the latest session's state at v */
  let sp=null;for(const d of B.dyns)if(d.t0<=v)sp=d;if(sp)B.paintPanel(sp.fn(v));
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
/*@@PLAYER@@*/
/* ---------------- captions (SRT) and chapters for YouTube, from this walkthrough's own timeline ---------------- */
function stamp(t,sep){t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=Math.floor(t%60),ms=Math.round((t-Math.floor(t))*1000);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+sep+String(ms).padStart(3,'0');}
function captionsOf(){if(!B)build();if(!B)return [];const out=[];B.cues.forEach((c,i)=>{const end=Math.min(c.start+c.dur,(B.cues[i+1]||{start:B.D}).start);
  c.chunks.forEach((ch,k)=>{const a=ch.t,b=k+1<c.chunks.length?c.chunks[k+1].t:Math.min(end,c.start+c.narr+.35);if(b>a+.2)out.push({a,b,text:ch.text});});});return out;}
function chaptersText(){if(!B)build();if(!B)return '';const mm=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};return B.chapters.map((c,i)=>mm(i?c.start:0)+' '+c.label).join('\n');}
function dlText(text,type,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
function exportCaps(){const caps=captionsOf();if(!caps.length)return;const base=INFO.file.replace(/\s+/g,'-');
  const srt=caps.map((x,j)=>(j+1)+'\n'+stamp(x.a,',')+' --> '+stamp(x.b,',')+'\n'+x.text).join('\n\n')+'\n';dlText(srt,'application/x-subrip','RA-1_'+base+'_captions.srt');
  const ch=chaptersText()+'\n';setTimeout(()=>dlText(ch,'text/plain','RA-1_'+base+'_YouTube-chapters.txt'),400);try{if(navigator.clipboard)navigator.clipboard.writeText(ch).catch(()=>{});}catch(e){}
  if(window.nbhUI&&nbhUI.toast)nbhUI.toast(caps.length+' captions (SRT) and '+(B.chapters.length)+' chapters for the video\'s description; the chapters are on the clipboard too.',{kind:'ok'});}
(function(){const b=document.getElementById('wkCaps');if(b)b.addEventListener('click',exportCaps);})();
/* ---------------- the view: RA-1's views; leaving the Walkthrough pauses it, entering it builds it once ---------------- */
const setView0=setView;
setView=function(v){if(v!=='walk'&&(want||playing))pause();
  setView0(v);
  if(v==='walk'){if(!B||!B.cap||!B.cap.isConnected){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}}fit();ui();reveal();}
  else if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);};
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){return [];},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get example(){return !!(B&&B.example);},captions:captionsOf,chapterList:chaptersText,exportCaptions:exportCaps,
  get stage(){const D=dom();return D&&D.stage;}};
})();
