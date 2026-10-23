/* ===== walk-script.json: the narration's words (read when the recorded narration is not beside the form) ===== */
window.ABC_WALK_SCRIPT=[{"id": "intro", "text": "This is the ABC incident data sheet. One sheet records one incident of the target behavior: what was in place right before it, what the student did, and what followed. The behavior analyst enters each sheet into the record, where the analysis is built. Here is how to fill it out."}, {"id": "head", "text": "At the top, the student and the target behavior are printed for you. Write your name as the observer, the setting, the date, the start time, how many minutes the incident lasted, the activity or routine, and the names of the staff who were present."}, {"id": "rules", "text": "Below that, mark whether an adult was within view, and circle the peak intensity, from one, minimal, to five, a crisis. The consequence window and the check interval are printed from the record. Use the ones printed on your sheet."}, {"id": "columns", "text": "The middle of the sheet has three columns: antecedent, behavior, and consequence. Tick what you saw, not what you think the student wanted. Leave a box blank when it did not apply."}, {"id": "setev", "text": "Here is an incident, filled in. Earlier in the day the student came in short of sleep, so that setting event is ticked on the row above the columns."}, {"id": "ante", "text": "The antecedent is what was in place immediately before the behavior. The teacher put a math sheet on the desk and the work was difficult, so academic demand and difficult task are ticked in the first column."}, {"id": "beh", "text": "In the middle column, tick the target behavior you saw. The student's own target behaviors, defined on Form TB-1, are printed first with their definitions; here, screaming and crying. Under preceded by, tick the lower intensity responses in the seconds before it: the student refused, then pushed the sheet away."}, {"id": "cons", "text": "The consequence is what adults and peers did within the window, whether or not it was meant. The teacher took the sheet back, so demand removed is ticked in the third column."}, {"id": "narr", "text": "Then write a brief description, in order, with the times: what was said, what the student did, what the adults did next, and how it ended. The codes carry the arithmetic; your words carry what the codes leave out."}, {"id": "after", "text": "At the bottom, tick what happened right after the consequence, and how the incident was resolved. Then hand the sheet in. One incident, one sheet."}, {"id": "bgwhy", "text": "The second sheet is the background sample. At each check of the timer when the behavior is not happening, you record what was in place anyway. Without these checks, the analysis cannot tell a trigger from something that is simply there all day."}, {"id": "bgmark", "text": "Write the date, the time, and the activity. Tick the antecedent conditions in place at the check, and anything that happened in the seconds scored. Here the student was working on math with an adult within view, and nothing else happened."}, {"id": "bgblank", "text": "Leave every box blank when none applied. An empty check is still data: it is what makes the base rate meaningful. Skip the check only when the behavior itself occurred in the seconds scored; that window is an incident."}, {"id": "analysis", "text": "In the record, the analysis puts the two sheets together. In this example, academic demand was in place before nine of twelve incidents, seventy-five percent, but in only four of twenty background checks, twenty percent. Demand goes with the behavior far more often than it is simply there."}, {"id": "strength", "text": "The same comparison is made for every antecedent and every consequence, and the hypotheses are ranked for the functional analysis. It is a ranking, not a function statement, and the contingency strength is read only once ten or more background samples are on file."}, {"id": "sample", "text": "A sample sheet is attached, marked SAMPLE across it. It shows how a finished sheet looks. It is not the student's data: do not count it or copy it. Fill in a blank sheet for each incident."}, {"id": "outro", "text": "Thank you. Hand your sheets to the behavior analyst at the end of the day, with the background samples from the same session."}];
/* (v24.05) Form ABC-1, the narrated walkthrough at the top of the Walkthrough view: how the paper ABC incident data sheet
   and the background sample sheet are filled in, and how the record's analysis reads them, played like a video. The worked
   example is a simulated student (nothing from this record is in it): the sheets are built by the form's own paper-sheet
   code (v24.04) with the example's header, so the record is never touched. Laid out once per build as a timeline;
   renderAt(t) sets every element to its state at time t as a pure function of t, so playing, seeking, the chapters and
   Save as video (nbh-tk1-video.js, Form TK-1's, beside the form) draw the same frames. The player (clock, narration,
   controls, full screen) is Form TK-1's (tools/forms/TK-1/walk.js), as SM-1 carries it (tools/forms/ABC-1/walk.js is
   assembled from tools/forms/SM-1/walk.js by tools/forms/ABC-1/build-walk.py); the narration is walk-audio.js (made by
   make-narration.py from walk-script.json), kept beside the form as nbh-abc1-narration.js. Without it the captions are
   timed from their word counts and the device's voice reads them. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
window.NBH_WALK_INFO={file:'ABC data sheet walkthrough',from:'from this form: the worked example (a simulated student), the paper sheets as they print, and the analysis reading',what:'form',
  priv:'The video shows the form\u2019s worked example (a simulated student) only; nothing from this student\u2019s record is in it, so it can be shared with the staff who fill in the sheets.'};
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'sheet',head:'sheet',rules:'sheet',columns:'sheet',setev:'incident',ante:'incident',beh:'incident',cons:'incident',narr:'incident',after:'incident',bgwhy:'background',bgmark:'background',bgblank:'background',analysis:'analysis',strength:'analysis',sample:'end',outro:'end'};
const CHAPS=[['sheet','The sheet'],['incident','An incident'],['background','A background check'],['analysis','The analysis'],['end','Sample and hand-in']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.ABC_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
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
const MK={};   /* ABC-1: no measured word marks; a line's words are placed by their share of its characters */
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
/* ---------------- the worked example: a simulated student, the paper sheets as they print ----------------
   Nothing from this record is in the example: the incident sheet, the background sample sheet and the analysis reading are
   built for a made-up student from the form's own paper-sheet code (window.abcPaper, v24.04) with the example's header, so
   the record is not touched at all. */
const DEMO_PHOTO='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe8ea"/><circle cx="50" cy="38" r="17" fill="#8aa0a8"/><path d="M18 92c3-20 16-30 32-30s29 10 32 30z" fill="#8aa0a8"/></svg>');
function demoHeader(){return{client:'A. Student (sample)',observer:'',location:'Room 12',target:'Screaming and crying',window:'20',checks:'fixed:10',start:'',end:'',minutes:''};}
function demoIncident(){return{date:'10/19/2026',time:'10:15 AM',dur:'4',activity:'Independent math',staff:'Ms. R., Mr. D.',observer:'J. Lee',location:'Room 12',staffPresent:'yes',intensity:3,
  ids:['se_sleep','a_acad','a_difficult','tb_sample','p_refuse','p_push','c_dem_rem','i_stopped','r_bip'],
  narrative:'10:14 Teacher put the math sheet on the desk: “Start with number one.” Student said “No, I’m not doing it” and pushed the sheet away. 10:15 Student screamed and cried, about four minutes, still in the seat. Teacher took the sheet back and moved to the next student. Screaming stopped within a minute of the sheet leaving the desk. No peers reacted.'};}
/* the analysis reading: made-up counts, the shape of the record's Analysis tab (conditional probabilities, then the ranking) */
function analysisCard(){
  const row=(lab,a,an,b,bn,hi)=>'<tr'+(hi?' class="abw-hi"':'')+'><th>'+lab+'</th><td><span class="abw-bar"><i style="width:'+Math.round(a/an*100)+'%"></i></span><b>'+a+' of '+an+'</b> <small>'+Math.round(a/an*100)+'%</small></td><td><span class="abw-bar abw-bg"><i style="width:'+Math.round(b/bn*100)+'%"></i></span><b>'+b+' of '+bn+'</b> <small>'+Math.round(b/bn*100)+'%</small></td></tr>';
  return '<div class="abw-an"><div class="ap-band">Reading the Analysis <small>the record’s Analysis tab · 12 incidents · 20 background samples</small></div>'+
    '<p class="abw-lead">For each condition: how often it was in place before an incident, against how often it was in place at a background check. A condition that goes with the behavior far more often than it is simply there is a candidate trigger.</p>'+
    '<table class="abw-tab"><thead><tr><th>Antecedent</th><th>Before incidents</th><th>At background checks</th></tr></thead><tbody>'+
    row('Presented with academic demand',9,12,4,20,true)+row('Transition announced',2,12,5,20)+row('Attention diverted to others',1,12,6,20)+row('Preferred item restricted',0,12,3,20)+
    '</tbody><thead><tr><th>Consequence</th><th>After incidents</th><th>At background checks</th></tr></thead><tbody>'+
    row('Demand removed/avoided',10,12,2,20,true)+row('Attention given',3,12,8,20)+row('Item given',0,12,2,20)+'</tbody></table>'+
    '<div class="abw-rank"><h5>Hypotheses ranked for the functional analysis</h5><ol><li><b>Escape from academic demand</b> <i>strong</i><span>demand before 75% of incidents, at 20% of checks; demand removed after 83%</span></li><li><b>Attention</b> <i>weak</i><span>attention given after 25% of incidents, at 40% of checks: no more than its base rate</span></li><li><b>Tangible</b> <i>none</i><span>no item restricted before or given after</span></li></ol>'+
    '<p class="abw-note">A ranking, not a function statement. <b>Contingency strength</b> is read once 10 or more background samples are on file (20 on file here).</p></div></div>';}
let composing=false;
function demoPages(){
  const P=window.abcPaper;if(!P||typeof P.html!=='function')return{inc:null,bg:null};
  /* the example's own defined target (as Form TB-1's print first on a real sheet); the record's targets never reach the example */
  const demo={header:demoHeader(),photo:DEMO_PHOTO,sample:demoIncident(),targets:[{id:'tb_sample',label:'Screaming and crying',def:'Vocalizing above conversation level, or crying, for 10 seconds or more.'}]};
  composing=true;let inc=null,bg=null;
  try{inc=div('',P.html('sample',demo)).firstElementChild;bg=div('',P.html('bg',demo)).firstElementChild;}
  finally{composing=false;}
  if(inc){inc.classList.remove('ap-sample');const sb=inc.querySelector('.ap-sambar');if(sb)sb.remove();}
  return{inc,bg};}
const stateKey=()=>'abc';
/* a rect in the paper's own space: from the layout offsets up to the page (not from the screen rectangles, which the stage's
   scale and an iPad's zoom distort), plus the page's offset from the paper's left */
function prelOf(el,P){if(!el||!P)return null;let x=0,y=0,n=el;while(n&&n!==P){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}
  if(n!==P)return null;return{x:x+P.offsetLeft,y,w:el.offsetWidth,h:el.offsetHeight};}
function boxTo(e,r,p){e.style.left=f2(r.x-p)+'px';e.style.top=f2(r.y-p)+'px';e.style.width=f2(r.w+2*p)+'px';e.style.height=f2(r.h+2*p)+'px';}
let RO=null;

function compose(D){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lpaper=layer('abw-cam'),Lfx=layer('abw-fx');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!audioLines())notes.push('The recorded narration (nbh-abc1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  const pg=demoPages();
  const paper=div('abw-paper');Lpaper.appendChild(paper);
  const PW=816,GAP=70;
  const page=(el,x)=>{const w=div('abw-pg');w.style.left=x+'px';if(el){el.removeAttribute('id');el.querySelectorAll('button,.noprint,select,input').forEach(e=>e.remove());w.appendChild(el);}paper.appendChild(w);return w;};
  const P1=page(pg.inc,0),P2=page(pg.bg,PW+GAP),P3=page(div('',analysisCard()).firstElementChild,2*(PW+GAP));
  const PH=Math.max(300,P1.offsetHeight||300);
  const prel=(el,P)=>prelOf(el,P||P1);
  /* a glow remembers what it points at: when a page's size changes after the build (a font arriving, a line wrapping), every
     glow is placed again from the sheet's layout (B.relayout, read by renderAt) */
  const glows=[];
  try{if(RO)RO.disconnect();RO=new ResizeObserver(()=>{if(B)B.relayout=true;});RO.observe(P1);RO.observe(P2);RO.observe(P3);}catch(e){}
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  const q=(s,P)=>(P||P1).querySelector(s),qa=(s,P)=>[...(P||P1).querySelectorAll(s)];
  const byText=(sel,text,up,P)=>{const e=qa(sel,P).find(x=>x.textContent.trim().toLowerCase().startsWith(String(text).toLowerCase()));return e?(up?e.closest(up):e):null;};
  const field=(lab,P)=>byText('.ap-f b',lab,'.ap-f',P);
  const optOf=(id,P)=>q('.ap-opt[data-id="'+id+'"]',P);
  const pageR=P=>({x:P.offsetLeft,y:0,w:PW,h:Math.max(300,P.offsetHeight||PH)});
  /* the camera: a whole page, or a part of it brought close */
  const s0=Math.min(1200/PW,610/PH),HOME={x:(SW-PW*s0)/2,y:Math.max(12,(SH-100-PH*s0)/2+6),s:s0};
  const cam=new Track(HOME);
  const view=(r,zoom)=>{if(!r)return HOME;const s=clamp(Math.min(1180/r.w,500/r.h),s0,zoom||1.8);return{x:SW/2-(r.x+r.w/2)*s,y:300-(r.y+r.h/2)*s,s};};
  const whole=P=>{const r=pageR(P),s=Math.min(1200/r.w,610/r.h);return{x:SW/2-(r.x+r.w/2)*s,y:Math.max(12,(SH-100-r.h*s)/2+6),s};};
  const camTo=(t0,t1,r,zoom)=>cam.move(t0,t1,view(r,zoom));
  /* overlays */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  /* a glow on the paper (it moves with the camera) */
  const glow=(r,t0,dur,pad,el,P)=>{if(!r)return;const p=pad||4;const g=mkFx('wk-glow abw-glow','',{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p},null,paper);pulse(g,t0,dur);if(el)glows.push({fx:g,el,P:P||P1,pad:p});return g;};
  /* a glow on an element of a sheet (placed again when the page's layout changes) */
  const glowEl=(el,t0,dur,pad,P)=>glow(prel(el,P),t0,dur,pad,el,P);
  /* the marks: a tick or a written value appears at a moment and is gone again before it (set as a class or text, so Save
     as video's painter sees it). The sheets are built filled in; every tick and value the scenes write is taken off first. */
  const marks=[];
  const step=(t,on,off)=>{marks.push({t,on:false,apply(v){if(v===this.on)return;this.on=v;if(v)on();else off();}});};
  const tick=(t,el)=>{if(!el)return;el.classList.remove('on');el.classList.add('abw-tick');step(t,()=>el.classList.add('on'),()=>el.classList.remove('on'));};
  const write=(t,fld,val)=>{if(!fld)return;const sp=fld.querySelector('span');if(!sp)return;const v=val!=null?val:sp.textContent;sp.textContent='';sp.classList.add('abw-hand');step(t,()=>{sp.textContent=v;},()=>{sp.textContent='';});};
  /* the narrative: its sentences appear one by one */
  const prose=(el,t0,t1)=>{if(!el)return;const full=el.textContent;el.textContent='';const parts=full.split(/(?<=[.!?][\u201d"\u2019']?)\s+/).filter(Boolean).map((x,i,a)=>i<a.length-1?x+' ':x);
    const c={n:0},show=()=>{el.textContent=parts.slice(0,c.n).join('');};   /* the sentences shown are a count, so seeking back takes them off in any order */
    parts.forEach((s,i)=>{const t=t0+(t1-t0)*i/Math.max(1,parts.length);step(t,()=>{c.n++;show();},()=>{c.n--;show();});});};
  /* the parts of the sheets the scenes point at */
  const E={band:q('.ap-band'),head:q('.ap-head'),id:q('.ap-id'),id2:qa('.ap-id')[1],photo:q('.ap-photo'),cols:q('.ap-cols'),col:qa('.ap-col'),row:q('.ap-row'),narr:q('.ap-narr'),lines:q('.ap-lines'),out:q('.ap-out'),outs:qa('.ap-out > div'),foot:q('.ap-foot'),
    client:field('Student'),target:field('Target'),observer:field('Observer'),setting:field('Setting'),date:field('Date'),time:field('Start'),dur:field('Duration'),act:field('Activity'),staff:field('Staff'),
    adult:field('Adult'),peak:field('Peak'),win:field('Consequence window'),
    bgBand:q('.ap-band',P2),bg1:q('.ap-bg',P2),bg2:qa('.ap-bg',P2)[1],bgFoot:q('.ap-foot',P2),
    anTab:q('.abw-tab',P3),anLead:q('.abw-lead',P3),anRank:q('.abw-rank',P3),anNote:q('.abw-note',P3),anRows:qa('.abw-tab tbody tr',P3)};
  const bgIn=(sel,i)=>E.bg1?E.bg1.querySelectorAll(sel)[i||0]:null;
  const BG={date:field('Date',E.bg1||P2),time:field('Time',E.bg1||P2),act:field('Activity',E.bg1||P2),adult:field('Adult',E.bg1||P2),lists:E.bg1?[...E.bg1.querySelectorAll('.ap-list')]:[],acad:E.bg1?E.bg1.querySelector('.ap-opt[data-id="a_acad"]'):null};
  if(BG.adult)BG.adultYes=BG.adult.querySelector('.ap-opt');
  /* every tick and value written during the walkthrough starts off */
  const O=id=>optOf(id);
  const SC={};
  SC.intro=K=>{cam.set(K.t,HOME);glowEl(E.band,K.at('ABC incident',.05),2.6,6);glowEl(E.cols,K.at('what was in place',.3),4,6);glowEl(E.foot,K.at('behavior analyst',.62),3,4);return K.d;};
  SC.head=K=>{camTo(K.t,K.t+.9,uni([prel(E.head),prel(E.id)]),1.5);glowEl(E.client,K.at('student',.08),2.6);glowEl(E.target,K.at('target behavior',.14),2.6);glowEl(E.photo,K.at('printed',.2),2.2);
    const w=(ph,fr,fld,val)=>{const t=K.at(ph,fr);write(t+.2,fld,val);glowEl(fld,t,2.2);};
    w('your name',.32,E.observer,'J. Lee');w('the setting',.42,E.setting);w('the date',.5,E.date);w('start time',.58,E.time);w('how many minutes',.66,E.dur);w('activity',.78,E.act);w('names of the staff',.9,E.staff);return K.d+.4;};
  SC.rules=K=>{camTo(K.t,K.t+.9,prel(E.id2),1.8);const a=K.at('adult',.1);tick(a+.3,E.adult&&E.adult.querySelector('.ap-opt'));glowEl(E.adult,a,2.6);
    const p=K.at('peak intensity',.28);tick(p+.5,E.peak&&E.peak.querySelectorAll('.ap-opt')[2]);glowEl(E.peak,p,4);glowEl(E.win,K.at('consequence window',.62),4);return K.d;};
  SC.columns=K=>{camTo(K.t,K.t+.9,prel(E.cols),1.2);glowEl(E.col[0],K.at('antecedent',.2),2.4,3);glowEl(E.col[1],K.at('behavior',.28),2.4,3);glowEl(E.col[2],K.at('consequence',.36),2.4,3);glowEl(E.cols,K.at('tick what you saw',.5),3.2,6);return K.d;};
  SC.setev=K=>{camTo(K.t,K.t+.9,prel(E.row),2);const t=K.at('short of sleep',.5);tick(t+.3,O('se_sleep'));glowEl(O('se_sleep'),t,3.4,3);return K.d;};
  SC.ante=K=>{camTo(K.t,K.t+.9,prel(E.col[0]),1.6);const a=K.at('academic demand',.62);tick(a+.3,O('a_acad'));glowEl(O('a_acad'),a,3,3);const b=K.at('difficult task',.78);tick(b+.3,O('a_difficult'));glowEl(O('a_difficult'),b,3,3);return K.d;};
  SC.beh=K=>{camTo(K.t,K.t+.9,prel(E.col[1]),1.6);glowEl(E.col[1].querySelector('.ap-grp'),K.at('tick the target',.05),2.6,3);const f=K.at('printed first',.3);glowEl(O('tb_sample'),f,4,3);
    tick(K.at('screaming and crying',.48)+.3,O('tb_sample'));const r=K.at('refused',.75);tick(r+.3,O('p_refuse'));glowEl(O('p_refuse'),r,2.4,3);const p=K.at('pushed',.88);tick(p+.3,O('p_push'));glowEl(O('p_push'),p,2.4,3);return K.d;};
  SC.cons=K=>{camTo(K.t,K.t+.9,prel(E.col[2]),1.6);const t=K.at('demand removed',.68);tick(t+.3,O('c_dem_rem'));glowEl(O('c_dem_rem'),t,3.4,3);return K.d;};
  SC.narr=K=>{camTo(K.t,K.t+.9,prel(E.narr),1.5);prose(E.lines,K.at('in order',.14),K.at('how it ended',.6)+.5);glowEl(E.narr,K.t+.9,2.4,4);return K.d;};
  SC.after=K=>{camTo(K.t,K.t+.9,prel(E.out),1.8);const t=K.at('right after',.14);tick(t+.3,O('i_stopped'));glowEl(E.outs[0]||E.out,t,2.6,3);const r=K.at('resolved',.4);tick(r+.3,O('r_bip'));glowEl(E.outs[1]||E.out,r,2.6,3);
    const h=K.at('hand the sheet',.6);cam.move(h,h+1,HOME);glowEl(E.foot,h+.8,3,4);return K.d;};
  SC.bgwhy=K=>{cam.move(K.t,K.t+1.1,whole(P2));glowEl(E.bgBand,K.t+1,3,6,P2);glowEl(E.bg1,K.at('record what was in place',.4),3.4,4,P2);return K.d;};
  SC.bgmark=K=>{camTo(K.t,K.t+.9,prel(E.bg1,P2),1.5);const w=(ph,fr,fld,val)=>{const t=K.at(ph,fr);write(t+.2,fld,val);glowEl(fld,t,2,3,P2);};
    w('the date',.05,BG.date,'10/19/2026');w('the time',.12,BG.time,'10:40 AM');w('the activity',.2,BG.act,'Independent math');
    const a=K.at('working on math',.62);tick(a+.3,BG.acad);glowEl(BG.acad,a,2.6,3,P2);const v=K.at('adult within view',.74);tick(v+.3,BG.adultYes);glowEl(BG.adult,v,2.4,3,P2);glowEl(BG.lists[1],K.at('nothing else happened',.88),2.6,3,P2);return K.d;};
  SC.bgblank=K=>{glowEl(BG.lists[1],K.at('leave every box',.02),2.6,3,P2);glowEl(BG.lists[2],K.at('leave every box',.02)+.4,2.6,3,P2);glowEl(BG.lists[3],K.at('leave every box',.02)+.8,2.6,3,P2);
    const s=K.at('skip the check',.6);camTo(s-.4,s+.5,prel(E.bgFoot,P2),1.8);glowEl(E.bgFoot,s+.4,Math.max(2.5,K.d-(s-K.t)),4,P2);return K.d;};
  SC.analysis=K=>{cam.move(K.t,K.t+1.1,whole(P3));const t=K.at('academic demand',.3);camTo(t-.5,t+.4,prel(E.anTab,P3),1.5);glowEl(E.anRows[0],t,3,3,P3);
    const n=K.at('nine of twelve',.42);glowEl(E.anRows[0]&&E.anRows[0].children[1],n,2.6,3,P3);const f=K.at('four of twenty',.62);glowEl(E.anRows[0]&&E.anRows[0].children[2],f,2.6,3,P3);glowEl(E.anRows[0],K.at('far more often',.85),3,3,P3);return K.d;};
  SC.strength=K=>{glowEl(E.anTab,K.at('every antecedent',.05),3,4,P3);const r=K.at('ranked',.3);camTo(r-.4,r+.5,prel(E.anRank,P3),1.6);glowEl(E.anRank,r+.4,3.4,4,P3);
    glowEl(E.anNote,K.at('ten or more',.78),Math.max(2.5,K.d-(K.at('ten or more',.78)-K.t)),4,P3);return K.d;};
  SC.sample=K=>{cam.move(K.t,K.t+1,HOME);
    const w=mkFx('abw-sampw','<div class="abw-samp">SAMPLE</div>',{x:0,y:PH*.42,w:PW,h:160},null,paper);w.tr.move(K.t+.5,K.t+1.1,{o:1});w.tr.move(K.t+K.d-.3,K.t+K.d+.3,{o:0});
    const c=mkFx('abw-card abw-sampc','<b>SAMPLE</b>Example marks, to show how the sheet is filled in. Not the student’s data: do not count it or copy it. Fill in a blank sheet.',{x:290,y:40,w:700});
    c.tr.move(K.at('attached',.2),K.at('attached',.2)+.5,{o:1});c.tr.move(K.t+K.d-.3,K.t+K.d+.3,{o:0});return K.d+.3;};
  SC.outro=K=>{cam.move(K.t,K.t+1,HOME);const veil=mkFx('abw-veil','',{x:0,y:0,w:SW,h:SH});veil.el.style.zIndex='0';veil.tr.move(K.t+.2,K.t+.9,{o:.5});
    const c=mkFx('abw-card','<b>Thank you</b>Hand your sheets to the behavior analyst at the end of the day, with the background samples from the same session.',{x:200,y:190,w:880},{s:.8,dy:12});c.tr.move(K.t+.4,K.t+.9,{o:1,s:1,dy:0},0,easeOut);return K.d+.6;};
  /* ---- the timeline ---- */
  const ids=['intro','head','rules','columns','setev','ante','beh','cons','narr','after','bgwhy','bgmark','bgblank','analysis','strength','sample','outro'];
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||'sheet',chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  /* whatever the sheets were built with and no scene writes stays off: the sheets open blank */
  qa('.ap-opt.on:not(.abw-tick)').concat(qa('.ap-opt.on:not(.abw-tick)',P2)).forEach(e=>e.classList.remove('on'));
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

/* ---------------- the view: leaving it pauses, entering it builds (once; the example does not depend on the record) ---------------- */
let building=false;
function openWalk(){if(building)return;building=true;try{if(!B||B.dirty)build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}fit();ui();reveal();}
$('#viewSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(!b)return;
  if(b.dataset.view==='walk')setTimeout(openWalk,0);else{if(want||playing)pause();if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);}});
/* the Walkthrough tab itself (the tab strip above the panels) opens the view the same way */
{const t=document.getElementById('tab-walk');if(t)t.addEventListener('click',()=>setTimeout(openWalk,0));}
/* opened by a link or at load (the panel already showing): build when the player is first seen */
try{const sec=document.getElementById('panel-walk');if(sec&&!sec.hidden)setTimeout(openWalk,0);}catch(e){}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){const L=audioLines()||{};return Object.keys(L).filter(id=>!MK[id]||MK[id].h!==hash(String(L[id].t||'')));},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();
