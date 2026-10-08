/* (v21.56) Form IA-1, the Walkthrough view: a narrated walkthrough of the FAST (Functional Analysis Screening Tool; Iwata,
   DeLeon & Roscoe, 2013) on this form's own scoring worksheet: what the sixteen items are, what to settle before informants
   answer, how the answers are entered and scored, what informant agreement looks like against the published sample, what the
   outcome predicted in the article's second study, and what the results help determine. It is built live from the form as it
   is (the Setup sheet's definition and informants, the FAST grid, totals, verdict, figures and Section 1); a form with no FAST
   answers yet shows a worked example of two informants (put into the form's fields for the build only, and taken out again
   before anything else runs). Laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as
   a pure function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form)
   draw the same frames. The player (clock, narration, controls, full screen) is Form TK-1's, as SM-1 carries it
   (tools/forms/SM-1/walk.js); tools/forms/IA-1/patch-walk.py puts the two together into the form. The narration is
   walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as nbh-ia1-narration.js; without it the
   captions are timed from their word counts and the device's voice reads them. The form's data is never changed by a build:
   the sheets on the stage are copies, their fields turned into text. */
(function(){
'use strict';
/* Save as video (nbh-tk1-video.js) names the file and the dialog's words for this form */
/* (v21.57) three walkthroughs share the engine: the FAST for the assessor, the FAST for informants (two minutes), the Convergence sheet */
let MODE='fast';
const INFO={fast:{file:'FAST walkthrough',from:'from this form: the FAST worksheet, its totals, agreement and figures, and the research behind them'},
  inf:{file:'FAST for informants',from:'from this form: the target behavior, the FAST worksheet and Section 1, for the people who answer it'},
  conv:{file:'Convergence walkthrough',from:'from this form: the Convergence sheet, its verdict and figure, the hypothesis, the decision and the verification record'}};
window.NBH_WALK_INFO=Object.assign({what:'form'},INFO.fast);
const SW=1280,SH=720,PAUSE=.4;
const CHOF={intro:'fast',cats:'fast',define:'before',informants:'before',items:'fill',na:'fill',totals:'scoring',verdict:'scoring',practice:'scoring',practice_answer:'scoring',agree:'agreement',pubitems:'agreement',outagree:'agreement',validity:'research',concur:'research',meaning:'meaning',section1:'meaning',next:'meaning',outro:'meaning',
  i_intro:'inf',i_one:'inf',i_items:'inf',i_na:'inf',i_own:'inf',i_outro:'inf',
  c_intro:'conv_sheet',c_rows:'conv_sheet',c_vote:'conv_rules',c_verdict:'conv_rules',c_phys:'conv_rules',c_fig:'conv_rules',c_hyp:'conv_next',c_decide:'conv_next',c_fa:'conv_fa',c_outro:'conv_fa'};
const CHAPS_BY={fast:[['fast','The FAST'],['before','Before you start'],['fill','Filling it in'],['scoring','Scoring'],['agreement','Agreement'],['research','The research'],['meaning','What it means']],
  inf:[['inf','The FAST, for informants']],
  conv:[['conv_sheet','The sheet'],['conv_rules','Consensus'],['conv_next','Hypothesis and decision'],['conv_fa','After the analysis']]};
const IDS_BY={fast:null,inf:['i_intro','i_one','i_items','i_na','i_own','i_outro'],conv:['c_intro','c_rows','c_vote','c_verdict','c_phys','c_fig','c_hyp','c_decide','c_fa','c_outro']};
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB={};(window.IA_WALK_SCRIPT||[]).forEach(l=>{FB[l.id]=l.text;});

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
const MK={};   /* IA-1: no measured word marks; a line's words are placed by their share of its characters */
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

/* ---------------- the worked example: two informants, when the form has no FAST answers yet ---------------- */
/* Informant A (the teacher): social negative 3 of 4, a margin of two; one item not seen (NA). Informant B (the paraprofessional):
   social negative 3 of 4 with a margin of one (the caution), one automatic item endorsed. The pair agrees on 11 of 15 scored
   items (73%) and on the outcome. */
const EX={
  A:{1:'N',2:'Y',3:'N',4:'N',5:'Y',6:'Y',7:'Y',8:'N',9:'N',10:'N',11:'N',12:'N',13:'N',14:'N',15:'NA',16:'N'},
  B:{1:'Y',2:'Y',3:'N',4:'N',5:'Y',6:'N',7:'Y',8:'Y',9:'N',10:'Y',11:'N',12:'N',13:'N',14:'N',15:'N',16:'N'},
  fields:{'m.client':'Sample Student (example)','m.beh':'Aggression toward staff (example)',
    'm.def':'Forceful contact of hand, foot, or head with a staff member, audible or leaving a mark. Example definition.',
    'inf[0].name':'Teacher (example)','inf[0].role':'classroom teacher','inf[0].mo':'14','inf[0].daily':'Yes','inf[0].hrs':'18','inf[0].set':'classroom, specials','inf[0].train':'In-service only',
    'inf[1].name':'Paraprofessional (example)','inf[1].role':'paraprofessional','inf[1].mo':'6','inf[1].daily':'Yes','inf[1].hrs':'25','inf[1].set':'classroom, lunch, bus line','inf[1].train':'RBT',
    'setup.indep':true,'setup.samedef':true,
    'fast.ml_t':'mid-morning academics','fast.ml_s':'independent worksheets','fast.ml_p':'classroom teacher present','fast.ll_t':'arrival; preferred activity block','fast.ll_s':'one-to-one preferred activity','fast.ll_p':'one-to-one staff',
    'fast.before':'A worksheet is handed out, or a direction is repeated.','fast.after':'The task is removed; the student is sent to the calm corner.','fast.tx':'None listed (example)',
    'fast.incons':'B answered No to item 6 but wrote that the behavior starts when worksheets are handed out: ask B about item 6, and observe the start of independent work.'}};
const hasFast=()=>[...document.querySelectorAll('select[name^="fast["]')].some(s=>s.value!=='');
const hasAny=()=>[...document.querySelectorAll('select[data-inst]')].some(s=>s.value!=='')||[...document.querySelectorAll('select[name^="int["][name$=".fn"]')].some(s=>s.value!=='');
/* the Convergence example: a third informant (the parent) whose FAST, QABF and MAS point to attention while the teacher's and the
   paraprofessional's point to escape: escape leads, two of three informants (a majority without agreement); the interview by the
   teacher says escape; the functional analysis, entered afterwards, found escape */
const EXC={
  C:{1:'Y',2:'Y',3:'Y',4:'N',5:'N',6:'N',7:'Y',8:'N',9:'N',10:'N',11:'N',12:'N',13:'N',14:'N',15:'N',16:'N'},
  fields:{'inf[2].name':'Parent (example)','inf[2].role':'parent','inf[2].mo':'all','inf[2].daily':'No','inf[2].hrs':'2','inf[2].set':'home; school events','inf[2].train':'None',
    'plan.fast.u':'Yes','plan.fast.who':'A, B, C','plan.qabf.u':'Yes','plan.qabf.who':'A, B, C','plan.mas.u':'Yes','plan.mas.who':'A, B, C','plan.int.u':'Yes','plan.int.who':'A',
    'int[0].inst':'FACTS','int[0].who':'A','int[0].routine':'independent math work 10:15 to 10:45','int[0].routineLow':'preferred activity with one-to-one staff','int[0].a':'an independent worksheet is presented','int[0].c':'the task is removed; sent to the calm corner',
    'int[0].idio':'multi-step math worksheets','int[0].summary':'During independent work, when a worksheet is presented, the student hits staff, and as a result the task is removed. (Example.)','int[0].fn':'escape','int[0].conf':'4','int[0].by':'Assessor (example)',
    'hyp.se':'short sleep (parent report); days with a substitute','hyp.a':'When an independent, multi-step math worksheet is presented','hyp.b':'the student hits staff (Aggression toward staff, example)','hyp.c':'and as a result the task is removed: escape from demands (2 of 3 informants; the interview agrees)',
    'hyp.alt':'Attention (the parent\'s FAST, QABF and MAS; the teacher\'s attention the behavior draws)','hyp.idio':'multi-step math worksheets; the first minute of independent work; a substitute teacher',
    'fa.out':'escape','fa.date':'10/21/2026','fa.design':'Multielement (Iwata et al., 1982/1994)','dec.fa':true,'dec.interview':true,
    'dec.note':'Two of three informants point to escape and the interview agrees, but the parent sees attention: a full multielement analysis with both conditions, after a follow-up interview on FAST items 1 to 4. (Example.)'}};
/* the QABF (0 to 3, five items a subscale) and the MAS (0 to 6, four items a subscale) for an informant whose target is one common category */
function exInst(key,r,target){const d=INST[key],hi=key==='qabf'?[3,2,3,2,3]:[5,6,5,6],lo=key==='qabf'?[0,1,0,0,1]:[1,0,1,0];
  const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e)e.value=String(v);};
  d.cats.forEach((c,ci)=>{const on=c[2].includes(target);c[1].forEach((it,k)=>set(key+'['+r+']['+it+']',(on?hi:lo)[(k+r)%(on?hi:lo).length]));});}
/* runs fn with the example in the form's fields, then puts every field back as it was (all of it in one turn: nothing else runs between) */
function withExample(fn){
  const need=MODE==='conv'?!hasAny():!hasFast();
  if(!need||typeof snapshot!=='function'||typeof applyFields!=='function'||typeof renderInst!=='function')return fn(false);
  const snap=snapshot(),nEl=document.getElementById('nInf'),n0=nEl?nEl.value:'',iEl=document.getElementById('nInt'),i0=iEl?iEl.value:'';
  const keys=MODE==='conv'?['fast','qabf','mas']:['fast'];
  const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v;};
  try{if(nEl)nEl.value=MODE==='conv'?'3':'2';keys.forEach(k=>renderInst(k));
    Object.keys(EX.fields).forEach(k=>set(k,EX.fields[k]));
    for(let it=1;it<=16;it++){set('fast[0]['+it+']',EX.A[it]);set('fast[1]['+it+']',EX.B[it]);}
    if(MODE==='conv'){Object.keys(EXC.fields).forEach(k=>set(k,EXC.fields[k]));for(let it=1;it<=16;it++)set('fast[2]['+it+']',EXC.C[it]);
      [0,1,2].forEach(r=>{exInst('qabf',r,r===2?'attention':'escape');exInst('mas',r,r===2?'attention':'escape');});}
    if(typeof renderTot==='function')keys.forEach(k=>renderTot(k));
    if(MODE==='conv'&&typeof renderSummary==='function')renderSummary();
    return fn(true);}
  finally{if(nEl)nEl.value=n0;if(iEl)iEl.value=i0;keys.forEach(k=>renderInst(k));applyFields(snap);if(typeof renderTot==='function')keys.forEach(k=>renderTot(k));if(MODE==='conv'&&typeof renderSummary==='function')renderSummary();}}

/* ---------------- the build ---------------- */
let B=null;
function tempShow(sec){if(!sec||getComputedStyle(sec).display!=='none')return()=>{};const old=sec.style.cssText;
  sec.style.cssText='display:block!important;position:absolute;left:-30000px;top:0;width:12in;visibility:hidden';return()=>{sec.style.cssText=old;};}
function build(){const D=dom();if(!D)return null;stop(true);quizHide();
  window.NBH_WALK_INFO=Object.assign({what:'form'},INFO[MODE]||INFO.fast);
  const restore=tempShow(D.sec);
  try{fit();withExample(ex=>{B=compose(D,ex);});}
  finally{restore();}
  uiBuilt();pos=clamp(pos,0,B.D);renderAt(pos);ui();
  return{duration:B.D,cues:cuesOut(),chapters:chapsOut()};}
const cuesOut=()=>B?B.cues.map(c=>({id:c.id,start:c.start,dur:c.dur,narr:c.narr,text:c.text,chapter:c.chapter})):[];
const chapsOut=()=>B?B.chapters.map(c=>({id:c.id,label:c.label,start:c.start})):[];

const CREDIT_WALK='Created by Joshua Newsome, BCBA';
const HAND='"Bradley Hand","Chalkboard SE","Segoe Print","Comic Sans MS","Comic Neue",cursive';
const PENCIL='<svg viewBox="0 0 150 26" width="150" height="26" aria-hidden="true"><path d="M2 13 L24 4 H130 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H24 Z" fill="#f6c343" stroke="#5a4210" stroke-width="2"/><path d="M2 13 L24 4 V22 Z" fill="#f2d7b0" stroke="#5a4210" stroke-width="2" stroke-linejoin="round"/><path d="M2 13 L10 9.8 V16.2 Z" fill="#333"/><rect x="128" y="4" width="16" height="18" rx="4" fill="#ef8fa6" stroke="#5a4210" stroke-width="2"/><rect x="120" y="4" width="8" height="18" fill="#c9ced3" stroke="#5a4210" stroke-width="2"/><path d="M30 9 H118" stroke="#e0a92a" stroke-width="2"/></svg>';

/* a copy of a part of the form: every field turned into the text it shows (read from the original, in order), buttons and
   hidden parts taken out, ids taken off (a figure's pattern keeps its id: its bars fill by it) */
function copyOf(orig){if(!orig)return null;const c=orig.cloneNode(true);
  const ov=[...orig.querySelectorAll('input,select,textarea')],cv=[...c.querySelectorAll('input,select,textarea')];
  cv.forEach((e,i)=>{const o=ov[i]||e;const s=document.createElement('span');s.className='iaw-v';
    if(o.type==='checkbox'||o.type==='radio'){s.textContent=o.checked?'☑':'☐';s.classList.add('iaw-chk');}
    else{let v=String(o.value==null?'':o.value);if(o.tagName==='SELECT'&&o.selectedOptions&&o.selectedOptions[0])v=o.selectedOptions[0].textContent.trim();s.textContent=v;if(e.tagName==='TEXTAREA')s.classList.add('iaw-ta');if(!v)s.classList.add('iaw-empty');}
    e.replaceWith(s);});
  c.querySelectorAll('button,[hidden],.noprint,.nbh-print-head,.no-print').forEach(x=>x.remove());
  c.querySelectorAll('[id]').forEach(e=>{if(e.tagName.toLowerCase()!=='pattern')e.removeAttribute('id');});
  c.removeAttribute('id');return c;}

function compose(D,ex){
  const st=D.stage;st.innerHTML='';
  const layer=c=>{const d=div('wk-L '+(c||''));st.appendChild(d);return d;};
  const Lcam=layer('smw-cam'),Lfx=layer('smw-fx'),Lpen=layer('smw-pens');
  const cap=div('wk-cap');st.appendChild(cap);
  const cred=div('wk-credit');cred.textContent=CREDIT_WALK;st.appendChild(cred);
  const notes=[];
  if(!audioLines())notes.push('The recorded narration (nbh-ia1-narration.js) is not beside this form: the captions are read by the device’s own voice where it has one.');
  if(ex)notes.push(MODE==='conv'?'No instrument has answers yet, so the walkthrough shows a worked example of three informants and three instruments. Enter a case (or load the simulation) and it is built from that instead.':'The FAST sheet has no answers yet, so the walkthrough shows a worked example of two informants. Enter a case (or load the simulation) and it is built from that instead.');
  const n=typeof nInf==='function'?nInf():2;
  /* the world the camera moves over: the Setup sheet's definition and informants, the FAST worksheet, its figures, Section 1 */
  const world=div('iaw-world');Lcam.appendChild(world);
  const PW=816;
  const paper=(cls)=>{const p=div('smw-paper iaw-paper '+(cls||''));p.style.width=PW+'px';world.appendChild(p);return p;};
  const q1=(s,root)=>(root||document).querySelector(s);
  let setupP=null,fastP=null,figP=null,s1P=null,sumP=null,defsC=null,infC=null,chk=null,barC=null,methC=null,twoC=null,grid=null,tot=null,verd=null,figsC=null,fig3C=null,s1C=null,sum=null;
  if(MODE==='conv'){/* the Convergence sheet, whole (its print head, references and signatures left out) */
    sumP=paper('iaw-sum');sum=copyOf(q1('#summary'));if(sum){sum.classList.remove('sheet');sum.querySelectorAll('.cite,.sig').forEach(x=>x.remove());const mf=sum.querySelector('.ident');if(mf)mf.remove();sumP.appendChild(sum);}}
  else{
  /* 1. setup: the definition rows and the informants */
  setupP=paper('iaw-setup');
  setupP.appendChild(div('bar','Setup: Target Behavior and Informants'));
  const defs0=q1('#setup .defs');defsC=copyOf(defs0);if(defsC){[...defsC.querySelectorAll('.drow')].forEach((r,i)=>{if(i>1)r.remove();});setupP.appendChild(defsC);}
  const h3=div('sub','Informants');h3.className='sub iaw-h3';setupP.appendChild(h3);
  infC=copyOf(q1('#infTbl'));if(infC){const wrap=div('iaw-tblwrap');wrap.appendChild(infC);setupP.appendChild(wrap);
    [...infC.tBodies[0]?infC.tBodies[0].rows:[]].forEach((r,i)=>{if(i>=n)r.remove();});}
  chk=copyOf(q1('#setup .chkrow'));if(chk)setupP.appendChild(chk);
  /* 2. the FAST worksheet: the grid, the totals, the verdict */
  fastP=paper('iaw-fast');
  barC=copyOf(q1('#fast .bar'));if(barC)fastP.appendChild(barC);
  methC=copyOf(q1('#fast p.method'));if(methC)fastP.appendChild(methC);
  const two0=[...document.querySelectorAll('#fast .twoup')].find(e=>!e.classList.contains('figs'));twoC=copyOf(two0);if(twoC)fastP.appendChild(twoC);
  grid=twoC&&twoC.querySelector('table.grid.item');tot=twoC&&twoC.querySelectorAll('table.grid')[1];verd=twoC&&twoC.querySelector('.verdict');
  if(MODE!=='inf'){
  /* 3. the figures */
  figP=paper('iaw-figs');
  figsC=copyOf(q1('#fast .twoup.figs'));fig3C=copyOf(q1('#fastFig3'));if(figsC)figP.appendChild(figsC);if(fig3C)figP.appendChild(fig3C);}
  /* 4. Section 1 */
  s1P=paper('iaw-s1');
  const s1h=[...document.querySelectorAll('#fast h3.sub')].find(h=>/Section 1/.test(h.textContent));
  if(s1h){s1P.appendChild(copyOf(s1h));const pm=s1h.nextElementSibling;if(pm&&pm.matches('p.method'))s1P.appendChild(copyOf(pm));}
  s1C=copyOf(q1('#fast .defs'));if(s1C)s1P.appendChild(s1C);}
  /* the papers one under the other */
  let y=0;[setupP,fastP,figP,s1P,sumP].filter(Boolean).forEach(p=>{p.style.top=y+'px';y+=p.offsetHeight+70;});
  world.style.width=PW+'px';world.style.height=y+'px';
  /* positions in the world (the camera's coordinates) */
  const wrel=el=>{if(!el)return null;const r=el.getBoundingClientRect(),c=world.getBoundingClientRect();const k=c.width/(world.offsetWidth||1)||1;return{x:(r.left-c.left)/k,y:(r.top-c.top)/k,w:r.width/k,h:r.height/k};};
  const uni=rs=>{rs=rs.filter(Boolean);if(!rs.length)return null;const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,w:Math.max(...rs.map(r=>r.x+r.w))-x,h:Math.max(...rs.map(r=>r.y+r.h))-y};};
  const pad=(r,p)=>r?{x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p}:null;
  /* the camera */
  const fastR=MODE==='conv'&&sum?uni([wrel(sum.querySelector('.bar')),wrel(sum.querySelector('table.grid'))])||wrel(sumP):wrel(fastP);
  const view=r=>{if(!r)return{x:0,y:0,s:1};const s=clamp(Math.min(1180/r.w,560/r.h),.3,1.9);return{x:SW/2-(r.x+r.w/2)*s,y:316-(r.y+r.h/2)*s,s};};
  const HOME=(()=>{const v=view(fastR);v.s=Math.min(v.s,1.2);v.x=SW/2-(fastR.x+fastR.w/2)*v.s;v.y=316-(fastR.y+fastR.h/2)*v.s;return v;})();
  const cam=new Track(HOME);
  const camTo=(t0,t1,r,ez)=>cam.move(t0,t1,view(r),0,ez);
  /* overlays: on the world (they move with the camera) or on the stage */
  const fxs=[];
  const mkFx=(cls,html,box,init,parent)=>{const e=div('wk-o '+cls,html);if(box){e.style.left=f2(box.x)+'px';e.style.top=f2(box.y)+'px';if(box.w!=null)e.style.width=f2(box.w)+'px';if(box.h!=null)e.style.height=f2(box.h)+'px';}(parent||Lfx).appendChild(e);
    const fx={el:e,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const sub=(el,init)=>{const fx={el,tr:new Track(Object.assign({o:0,s:1,dy:0,dx:0},init||{}))};fxs.push(fx);return fx;};
  const pulse=(fx,t0,dur)=>{fx.tr.move(t0,t0+.3,{o:1});fx.tr.move(t0+Math.max(.35,dur-.4),t0+dur,{o:0});};
  const glow=(r,t0,dur,p)=>{if(!r)return;const pp=p==null?5:p;const g=mkFx('wk-glow smw-pglow iaw-glow','',{x:r.x-pp,y:r.y-pp,w:r.w+2*pp,h:r.h+2*pp},null,world);pulse(g,t0,dur);return g;};
  const note=(r,text,t0,t1,side)=>{if(!r)return;const n=mkFx('iaw-note',esc(text),{x:r.x+r.w/2,y:side==='below'?r.y+r.h+8:r.y-40},{dy:side==='below'?-8:8},world);n.el.style.transform='translateX(-50%)';n.tr.move(t0,t0+.35,{o:1,dy:0},0,easeOut);n.tr.move(t1,t1+.35,{o:0});return n;};
  const card=(cls,html,box,t0,t1,init)=>{const c=mkFx('smw-card '+cls,html,box,Object.assign({dy:16},init||{}));c.tr.move(t0,t0+.5,{o:1,dy:0},0,easeOut);if(t1!=null)c.tr.move(t1,t1+.4,{o:0});return c;};
  const veil=(t0,t1,o)=>{const v=mkFx('smw-veil','',{x:0,y:0,w:SW,h:SH});v.el.style.zIndex='0';v.tr.move(t0,t0+.5,{o:o==null?.5:o});if(t1!=null)v.tr.move(t1,t1+.4,{o:0});return v;};
  /* the pencil's marks: an answer written in */
  const marks=[];
  const write=(r,text,t0,t1,col,size)=>{if(!r)return null;const e=div('smw-write iaw-write',esc(text));e.style.left=f2(r.x)+'px';e.style.top=f2(r.y)+'px';e.style.width=f2(r.w)+'px';e.style.height=f2(r.h)+'px';e.style.color=col||'#2b4a9b';e.style.fontFamily=HAND;e.style.fontSize=f2(size||Math.min(22,r.h*.72))+'px';world.appendChild(e);
    const m={el:e,t0,t1,kind:'write',cx:r.x+r.w/2,cy:r.y+r.h/2,rx:Math.min(r.w,30)/2,ry:5};marks.push(m);return m;};
  const pens=[];const mkPen=(svg,rest)=>{const e=div('smw-pen',svg);Lpen.appendChild(e);const p={el:e,tr:new Track({x:rest.x,y:rest.y,o:0,a:-38}),rest,draws:[]};pens.push(p);return p;};
  const PS=mkPen(PENCIL,{x:120,y:760});
  const penPt=(mk,u,t)=>{const c=cam.at(t),k=c.s;const x=mk.cx+mk.rx*(2*u-1),y=mk.cy+Math.sin(u*Math.PI*4)*2.5;return{x:c.x+x*k,y:c.y+y*k};};
  const draw=(pen,m,lead)=>{if(!m)return;const a=penPt(m,0,m.t0),b=penPt(m,1,m.t1);pen.tr.set(m.t0-(lead||.6)-.01,{o:1});pen.tr.move(m.t0-(lead||.6),m.t0,{x:a.x,y:a.y},.08);m.pt=penPt;pen.draws.push(m);pen.tr.set(m.t1,{x:b.x,y:b.y});};
  const penAway=(pen,t0)=>{pen.tr.move(t0,t0+.7,{x:pen.rest.x,y:pen.rest.y});pen.tr.set(t0+.7,{o:0});};
  /* the worksheet's parts */
  const rows=grid?[...grid.tBodies[0].rows]:[];
  const cell=(i,c)=>rows[i]?rows[i].cells[c]||null:null;
  const catRows=k=>uni(rows.slice(k*4,k*4+4).map(wrel));
  const ansCells=[];for(let r=0;r<n;r++)for(let i=0;i<16;i++){const td=cell(i,2+r);if(td)ansCells.push({r,i,td,sp:td.querySelector('.iaw-v')});}
  const agrCells=n>1?rows.map(tr=>tr.cells[2+n]).filter(Boolean):[];
  const R={bar:wrel(barC),setupBar:wrel(setupP&&setupP.querySelector('.bar')),grid:wrel(grid),head:grid?wrel(grid.tHead):null,tot:wrel(tot),verd:wrel(verd),
    defRows:defsC?[...defsC.querySelectorAll('.drow')].map(wrel):[],infT:wrel(infC),infRows:infC&&infC.tBodies[0]?[...infC.tBodies[0].rows].map(wrel):[],
    infCols:infC&&infC.tHead?[...infC.tHead.rows[0].cells].map(wrel):[],chk:chk?[...chk.querySelectorAll('label')].map(wrel):[],
    agrHead:grid&&n>1?wrel(grid.tHead.rows[0].cells[2+n]):null,agr:agrCells.map(wrel),
    figs:figsC?[...figsC.querySelectorAll('.figure')].map(wrel):[],fig3:wrel(fig3C),s1Rows:s1C?[...s1C.querySelectorAll('.drow')].map(wrel):[]};
  /* the answers, the agreement, the totals and the verdict are hidden until the pencil has entered them */
  const hid=[];const hide=el=>{if(el)hid.push(sub(el,{o:0}));};
  ansCells.forEach(a=>hide(a.sp));agrCells.forEach(td=>hide(td));
  if(tot)[...tot.querySelectorAll('tbody td.c')].forEach(td=>{hide(td);});
  if(verd)hide(verd);
  let tEntered=0;const shown=t=>{hid.forEach(f=>f.tr.move(t,t+.4,{o:1}));tEntered=t;};
  const SC={};
  /* the FAST */
  SC.intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(R.bar,Math.max(K.t+.4,K.at('the FAST',.08)-.1),2.2,6);
    glow(pad(R.grid,0),Math.max(K.t+2.2,K.at('sixteen-item',.25)-.1),2.4,4);
    const tp=Math.max(K.t+5,K.at('published',.62)-.2);note(R.bar,'Iwata, DeLeon & Roscoe (2013), JABA 46, 271–284',tp,K.t+K.d+.2,'below');return K.d;};
  SC.cats=K=>{camTo(K.t+.1,K.t+1,uni([R.head,catRows(0)]));
    const at=[['items one to four',.15],['five to eight',.42],['nine to twelve',.62],['thirteen to sixteen',.82]].map((a,i)=>Math.max(K.t+1+i*1.2,K.at(a[0],a[1])-.15));
    const lab=['Social positive','Social negative','Automatic: sensory','Automatic: pain'];
    at.forEach((t,k)=>{const r=catRows(k);const end=(at[k+1]||K.t+K.d)+.2;if(k)camTo(t-.5,t+.3,pad(r,30));glow(r,t,end-t,3);note({x:r.x+r.w*.78,y:r.y+r.h/2+26,w:0,h:0},lab[k],t+.2,end-.3);});return K.d;};
  /* before you start */
  SC.define=K=>{camTo(K.t+.1,K.t+1.3,pad(uni([R.setupBar].concat(R.defRows)),8));
    glow(R.defRows[0],Math.max(K.t+1.3,K.at('one behavior',.3)-.1),2.4,3);
    const td=Math.max(K.t+3,K.at('operational definition',.42)-.1);glow(R.defRows[1],td,3,3);note(R.defRows[1],'The same definition, read to every informant',Math.max(td+.6,K.at('same definition',.55)-.1),K.t+K.d-.2,'below');return K.d;};
  SC.informants=K=>{const v=uni([R.infT].concat(R.chk));camTo(K.t+.1,K.t+1.3,v);
    const tr=Math.max(K.t+1.5,K.at('record each one',.3)-.1);R.infRows.slice(0,n).forEach((r,i)=>glow(r,tr+i*.35,2.4,2));
    const colAt=[['their role',.42,2],['known the student',.5,4],['those routines',.62,6]];colAt.forEach(([ph,fr,c])=>{const col=uni(R.infRows.slice(0,n).map((r,i)=>{const td=infC.tBodies[0].rows[i]&&infC.tBodies[0].rows[i].cells[c];return wrel(td);}).concat([R.infCols[c]]));glow(col,Math.max(tr+1,K.at(ph,fr)-.1),2,2);});
    const ti=Math.max(K.t+8,K.at('without conferring',.72)-.2);if(R.chk[0])glow(R.chk[0],ti,K.t+K.d-ti,4);
    const tm=Math.max(ti+1.5,K.at('fifteen',.9)-.2);note(R.chk[0]||R.infT,'15 to 20 minutes, on their own',tm,K.t+K.d+.2,'below');return K.d;};
  /* filling it in */
  /* the camera follows the pencil down the column, four rows at a time */
  const follow=(r,i,t)=>{if(i%4===0)camTo(t-.45,t+.15,pad(uni([catRows(i/4),wrel(cell(i,2+r))]),26));};
  SC.items=K=>{camTo(K.t+.1,K.t+1,uni([R.head,catRows(0)]));
    let t=Math.max(K.t+1.4,K.at('Y for yes',.25)-.2);const tB=K.at('informant B',.62);
    for(let r=0;r<n;r++){if(r===1)t=Math.max(t+.2,tB-.3);
      ansCells.filter(a=>a.r===r).forEach(a=>{const v=(a.sp&&a.sp.textContent||'').trim();const box=wrel(a.td);if(!v||!box){t+=.04;return;}follow(r,a.i,t);
        const mk=write(box,v,t,t+.22,'#2b4a9b',Math.min(16,box.h*.74));draw(PS,mk,.3);t+=.3;});}
    penAway(PS,t+.1);const ts=Math.max(t+.3,K.at('counts as you type',.85)-.1);shown(ts);camTo(ts-.3,ts+.6,uni([R.head,catRows(0),catRows(1)]));
    agrCells.forEach((td,i)=>glow(wrel(td),ts+.3+i*.03,1.6,1));return Math.max(K.d,ts+2.2-K.t);};
  const naCell=ansCells.find(a=>(a.sp&&a.sp.textContent||'').trim()==='NA');
  SC.na=K=>{const r=naCell?wrel(naCell.td):null;const v=r?uni([r,wrel(rows[Math.max(0,naCell.i-3)]),wrel(rows[Math.min(15,naCell.i+3)])]):R.grid;camTo(K.t+.1,K.t+1,v);
    if(r){glow(r,K.t+1,K.t+K.d-K.t-1,3);note(r,'NA: not seen',K.t+1.3,Math.max(K.t+1.4,K.at('left out',.5)-.2));
      const ag=agrCells[naCell.i]?wrel(agrCells[naCell.i]):null;const tl=Math.max(K.t+3,K.at('left out',.5)-.1);if(ag){glow(ag,tl,K.t+K.d-tl,3);note(ag,'Left out of the pair’s agreement',tl+.2,K.t+K.d-.2,'below');}}
    else{const c=card('iaw-card','<h3>NA</h3><p>The informant has not seen that situation and cannot say. An item that either informant answered NA is left out of that pair’s agreement.</p>',{x:300,y:150,w:680},K.t+.6,K.t+K.d);}
    return K.d;};
  /* scoring */
  SC.totals=K=>{camTo(K.t+.1,K.t+1.1,pad(R.tot,10));
    const trs=tot?[...tot.tBodies[0].rows]:[];const tg=Math.max(K.t+1.2,K.at('counts the yes',.1)-.1);trs.forEach((tr,i)=>glow(wrel(tr),tg+i*.4,1.6,2));
    const th=Math.max(tg+2,K.at('most yes answers',.38)-.2);const tops=tot?[...tot.querySelectorAll('td.calc')]:[];
    tops.forEach((td,i)=>{const r=wrel(td);glow(r,th+i*.2,K.t+K.d-th-i*.2,3);});if(tops.length)note(wrel(tops[0]),'Highest total = the outcome',Math.max(th+.5,K.at('shades',.85)-.2),K.t+K.d+.2);return K.d;};
  SC.verdict=K=>{camTo(K.t+.1,K.t+1.1,pad(R.verd,8));const lis=verd?[...verd.querySelectorAll('li')]:[];
    const tr=Math.max(K.t+1.2,K.at('reads the totals',.1)-.1);lis.forEach((li,i)=>glow(wrel(li),tr+i*.35,1.6,2));
    const mg=lis.find(li=>/margin of one item/i.test(li.textContent))||lis.find(li=>/margin 1\b/.test(li.textContent))||lis[0];
    const tm=Math.max(tr+2,K.at('single item',.3)-.2);if(mg){const r=wrel(mg);glow(r,tm,K.t+K.d-tm,3);note(r,'A one-item margin: kept, with a caution',Math.max(tm+.6,K.at('caution',.45)-.1),K.t+K.d-.2,'below');}
    const tt=Math.max(tm+3,K.at('two groups tie',.9)-.2);note(R.verd,'A tie: no outcome',tt,K.t+K.d+.3);return K.d;};
  /* agreement */
  SC.agree=K=>{const ag=uni([R.agrHead].concat(R.agr));if(ag){const top=uni([R.agrHead].concat(R.agr.slice(0,8))),bot=uni(R.agr.slice(8));camTo(K.t+.1,K.t+1.1,pad(uni([top,wrel(grid.tHead)]),20));glow(ag,Math.max(K.t+1.2,K.at('Agree column',.1)-.1),3.2,3);if(bot)camTo(K.t+2.2,K.t+3.2,pad(bot,20));}
    const pairLi=verd?[...verd.querySelectorAll('li')].find(li=>/vs .*item agreement/i.test(li.textContent)):null;
    const tp=Math.max(K.t+3.6,K.at('each pair',.28)-.3);if(pairLi){camTo(tp,tp+1,pad(R.verd,8));glow(wrel(pairLi),tp+1,2.4,3);}
    const ts=Math.max(tp+3,K.at('In the study',.42)-.3);veil(ts,K.t+K.d,.45);
    const c=card('iaw-card iaw-stats','<h3>Study 1: 196 pairs of informants</h3><div class="st" data-i="0"><span>Mean item agreement</span><b>71.5%</b></div><div class="st" data-i="1"><span>Pairs ranged</span><b>28.6% to 100%</b></div><div class="st" data-i="2"><span>Most pairs</span><b>61% to 80%</b></div><div class="st" data-i="3"><span>Direct-observation criterion</span><b>80%</b></div>',{x:250,y:70,w:780},ts,K.t+K.d);
    const sts=[...c.el.querySelectorAll('.st')].map(e=>sub(e,{o:0,dy:6}));const at=[['71.5',.52],['ranged',.62],['most fell',.72],['80 percent',.85]].map((a,i)=>Math.max(ts+.5+i*.4,K.at(a[0],a[1])-.2));
    sts.forEach((f,i)=>f.tr.move(at[i],at[i]+.35,{o:1,dy:0},0,easeOut));
    return K.d+.3;};
  SC.pubitems=K=>{camTo(K.t+.1,K.t+1.4,pad(R.fig3,10));
    const svg=fig3C&&fig3C.querySelector('svg');const lbl=s=>svg?[...svg.querySelectorAll('text.lbl')].find(t=>t.textContent.trim()===s):null;
    const col=s=>{const l=lbl(s);if(!l||!R.fig3)return null;const r=wrel(l),sr=wrel(svg);return{x:r.x+r.w/2-13,y:sr.y+14,w:26,h:r.y-sr.y-14};};
    const t12=Math.max(K.t+1.6,K.at('item twelve',.2)-.2),t4=Math.max(t12+1.2,K.at('item four',.3)-.2);glow(col('12'),t12,3,2);note(col('12'),'53.3%',t12+.2,t12+3);glow(col('4'),t4,3,2);note(col('4'),'84.5%',t4+.2,t4+3);
    const ta=Math.max(t4+2.5,K.at('what happens before',.45)-.3);
    const c=card('iaw-card iaw-stats iaw-small','<div class="st" data-i="0"><span>Antecedent items (before)</span><b>78.9%</b></div><div class="st" data-i="1"><span>Consequent items (after)</span><b>67.7%</b></div>',{x:720,y:60,w:470},ta,Math.max(ta+5,K.at('An item your',.68)));
    const sts=[...c.el.querySelectorAll('.st')].map(e=>sub(e,{o:0,dy:6}));[Math.max(ta+.4,K.at('78.9',.52)-.2),Math.max(ta+1.2,K.at('67.7',.62)-.2)].forEach((t,i)=>sts[i].tr.move(t,t+.35,{o:1,dy:0},0,easeOut));
    const tl=Math.max(ta+5.5,K.at('disagree on',.72)-.2);if(R.agr.length){const lo=agrCells.map((td,i)=>({td,i,v:parseFloat(td.textContent)})).filter(x=>isFinite(x.v)&&x.v<60);lo.slice(0,4).forEach((x,k)=>glow(col(String(x.i+1)),tl+k*.2,K.t+K.d-tl,2));}
    return K.d;};
  SC.outagree=K=>{veil(K.t,K.t+K.d,.5);
    const c=card('iaw-card iaw-big','<h3>Agreement on the outcome</h3><div class="num">64.8%</div><p>of the 196 pairs pointed to the same function</p><p class="lt" data-i="1">about one pair in three did not</p>',{x:250,y:110,w:780},K.t+.4,K.t+K.d);
    const nm=sub(c.el.querySelector('.num'),{o:0,s:.7});const tn=Math.max(K.t+.9,K.at('64.8',.3)-.2);nm.tr.move(tn,tn+.45,{o:1,s:1},0,easeOut);
    const lt=sub(c.el.querySelector('.lt'),{o:0});const t3=Math.max(tn+1.5,K.at('one pair in three',.5)-.2);lt.tr.move(t3,t3+.35,{o:1});return K.d+.3;};
  /* the research */
  const vRows=[['Overall','63.8%','44 of 69'],['Social positive','77.8%','14 of 18'],['Social negative','56.0%','14 of 25'],['Automatic','61.5%','16 of 26']];
  SC.validity=K=>{veil(K.t,K.t+K.d,.5);
    const c=card('iaw-card iaw-tbl','<h3>Study 2: the FAST outcome against a functional analysis</h3><p class="lt">69 problem behaviors, screened with the FAST, then tested</p>'+vRows.map((r,i)=>'<div class="st" data-i="'+i+'"><span>'+r[0]+'</span><b>'+r[1]+'</b><i>'+r[2]+'</i></div>').join(''),{x:200,y:60,w:880},K.t+.4,K.t+K.d);
    const sts=[...c.el.querySelectorAll('.st')].map(e=>sub(e,{o:0,dy:6}));const at=[['63.8',.5],['77.8',.66],['56 percent',.8],['61.5',.92]].map((a,i)=>Math.max(K.t+1.2+i*.5,K.at(a[0],a[1])-.25));
    sts.forEach((f,i)=>f.tr.move(at[i],at[i]+.35,{o:1,dy:0},0,easeOut));return K.d+.3;};
  const cRows=[['Overall','70.8%','17 of 24'],['Social positive','100%','7 of 7'],['Social negative','54.6%','6 of 11'],['Automatic','66.7%','4 of 6']];
  SC.concur=K=>{veil(K.t,K.t+K.d,.5);
    const c=card('iaw-card iaw-tbl','<h3>When both informants agreed on the outcome</h3><p class="lt">24 of the 69 behaviors</p>'+cRows.map((r,i)=>'<div class="st" data-i="'+i+'"><span>'+r[0]+'</span><b>'+r[1]+'</b><i>'+r[2]+'</i></div>').join(''),{x:200,y:60,w:880},K.t+.3,K.t+K.d);
    const sts=[...c.el.querySelectorAll('.st')].map(e=>sub(e,{o:0,dy:6}));const at=[['70.8',.25],['seven of seven',.45],['When informants',.6],['When they split',.8]].map((a,i)=>Math.max(K.t+.9+i*.5,K.at(a[0],a[1])-.25));
    sts.forEach((f,i)=>f.tr.move(at[i],at[i]+.35,{o:1,dy:0},0,easeOut));
    const w=mkFx('iaw-words','<span>Agree: test it</span><span>Split: look further</span>',{x:140,y:560,w:1000},{o:0});const tw=Math.max(at[2],K.at('most useful',.62)-.2);w.tr.move(tw,tw+.4,{o:1});w.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});return K.d+.3;};
  /* what it means */
  SC.meaning=K=>{veil(K.t,K.t+K.d,.5);const tips=[['A consistent format for the interview','the same questions, every time'],['Helps design the functional analysis','which conditions, which idiosyncratic events'],['Not a replacement for the analysis','and not enough, alone, for treatment']];
    const c=card('smw-tips iaw-tips','<h3>What the FAST is for</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong> '+esc(x[1])+'</p></div>').join(''),{x:230,y:70,w:820},K.t+.3,K.t+K.d);
    const rs=[...c.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));const at=[['consistent format',.4],['design the functional',.6],['does not replace',.78]].map((a,i)=>Math.max(K.t+1+i*.5,K.at(a[0],a[1])-.2));
    rs.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});return K.d+.3;};
  SC.section1=K=>{camTo(K.t+.1,K.t+1.4,pad(uni(R.s1Rows),10));
    const at=[['most and least likely',.2,[0,1,2,3,4,5]],['who is present',.3,[2,5]],['before and after',.4,[6,7]]];at.forEach(([ph,fr,idx])=>{const t=Math.max(K.t+1.5,K.at(ph,fr)-.2);idx.forEach(i=>glow(R.s1Rows[i],t,2.2,2));});
    const ti=Math.max(K.t+8,K.at('An informant who',.6)-.3);const last=R.s1Rows[R.s1Rows.length-1];if(last){camTo(ti,ti+1,pad(uni(R.s1Rows.slice(-3)),10));glow(last,ti+1,K.t+K.d-ti-1,3);note(last,'A clarifying question, and something to observe',Math.max(ti+2,K.at('clarifying question',.9)-.2),K.t+K.d+.2,'below');}
    return K.d;};
  SC.next=K=>{veil(K.t,K.t+K.d,.5);const tips=[['Strong concurrence','test that function first'],['Disagreement','interview, observe, full analysis'],['Pain items endorsed','medical screen first'],['After the analysis','record its outcome on Convergence']];
    const c=card('smw-tips iaw-tips','<h3>What the results help determine</h3>'+tips.map((x,i)=>'<div class="tp" data-i="'+i+'"><b>'+(i+1)+'</b><p><strong>'+esc(x[0])+'</strong> '+esc(x[1])+'</p></div>').join(''),{x:230,y:50,w:820},K.t+.3,K.t+K.d);
    const rs=[...c.el.querySelectorAll('.tp')].map(e=>sub(e,{o:.35,h:0}));const at=[['Strong concurrence',.15],['Disagreement calls',.4],['pain items',.55],['after the functional',.75]].map((a,i)=>Math.max(K.t+1+i*.5,K.at(a[0],a[1])-.2));
    rs.forEach((fx,i)=>{fx.tr.move(at[i],at[i]+.35,{o:1,h:1});fx.tr.move((at[i+1]||K.t+K.d)-.05,(at[i+1]||K.t+K.d)+.3,{h:0});});return K.d+.3;};
  SC.outro=K=>{cam.move(K.t,K.t+1.2,HOME);const words=['Screen','Ask','Then test'];
    const box=mkFx('smw-words',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:90,y:250,w:1100},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['screen',.05],['ask',.4],['then test',.7]].map((a,i)=>Math.max(K.t+.4+i*.45,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));
    veil(K.t+.2,null,.55);return K.d+.6;};

  /* ---- the practice check: the last informant's totals; the viewer decides, then the answer ---- */
  const CATL=['Social positive','Social negative','Automatic: sensory','Automatic: pain'];
  const quiz=(()=>{if(!tot||!tot.tBodies[0])return null;const trs=[...tot.tBodies[0].rows];const ncol=trs[0]?trs[0].cells.length-1:0;if(ncol<1)return null;
    let col=ncol;for(;col>=1;col--){if(trs.some(tr=>/\d/.test((tr.cells[col]||{}).textContent||'')))break;}if(col<1)return null;
    const tots=trs.map(tr=>{const m=/(\d+)\s*\/\s*(\d+)/.exec(tr.cells[col].textContent||'');return m?[+m[1],+m[2]]:[0,0];});
    const vals=tots.map(x=>x[0]);const mx=Math.max(...vals);const tops=vals.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);const rest=vals.filter((v,i)=>!tops.includes(i));const second=rest.length?Math.max(...rest):0;
    return {who:(typeof CODES!=='undefined'?CODES[col-1]:String(col)),col,labels:CATL,tots,ans:mx===0?-1:tops.length>1?-1:tops[0],tie:mx>0&&tops.length>1,margin:mx-second,mx,second};})();
  let practiceCard=null;
  SC.practice=K=>{if(!quiz)return K.d;camTo(K.t+.1,K.t+1,pad(R.tot,10));veil(K.t+.6,null,.45);
    const html='<h3>Your turn: informant '+esc(quiz.who)+'</h3><div class="st" data-i="0"><span>Social positive (items 1 to 4)</span><b>'+quiz.tots[0][0]+' of '+quiz.tots[0][1]+'</b></div><div class="st" data-i="1"><span>Social negative (5 to 8)</span><b>'+quiz.tots[1][0]+' of '+quiz.tots[1][1]+'</b></div><div class="st" data-i="2"><span>Automatic: sensory (9 to 12)</span><b>'+quiz.tots[2][0]+' of '+quiz.tots[2][1]+'</b></div><div class="st" data-i="3"><span>Automatic: pain (13 to 16)</span><b>'+quiz.tots[3][0]+' of '+quiz.tots[3][1]+'</b></div><p class="lt iaw-ask">Which group is the outcome? By how much?</p><p class="iaw-ans">'+(quiz.ans<0?(quiz.tie?'A tie: no outcome':'Nothing endorsed: no outcome'):'Outcome: '+esc(CATL[quiz.ans])+' ('+quiz.mx+' of '+quiz.tots[quiz.ans][1]+'), margin '+quiz.margin+(quiz.margin===1?': kept, with a caution':''))+'</p>';
    practiceCard=card('iaw-card iaw-stats iaw-quiz',html,{x:230,y:60,w:820},K.t+.6,null);const ans=practiceCard.el.querySelector('.iaw-ans');practiceCard.ans=sub(ans,{o:0,dy:6});
    const ask=practiceCard.el.querySelector('.iaw-ask');const fa=sub(ask,{o:0});fa.tr.move(Math.max(K.t+1.5,K.at('decide',.45)-.2),Math.max(K.t+1.8,K.at('decide',.45)+.1),{o:1});return K.d+.2;};
  SC.practice_answer=K=>{if(!quiz||!practiceCard)return K.d;const ta=Math.max(K.t+.3,K.at('The outcome is',.02));practiceCard.ans.tr.move(ta,ta+.4,{o:1,dy:0},0,easeOut);
    practiceCard.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});const vl=fxs.find(f=>f.el.classList.contains('smw-veil')&&f.tr.k.some(k=>k.st.o>0));if(vl)vl.tr.move(K.t+K.d,K.t+K.d+.4,{o:0});
    if(quiz.ans>=0&&tot){const td=tot.tBodies[0].rows[quiz.ans].cells[quiz.col];glow(wrel(td),ta+.3,K.t+K.d-ta,3);}return K.d+.4;};
  /* ---- for informants: the same sheets, their own words ---- */
  SC.i_intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(R.bar,Math.max(K.t+.4,K.at('the FAST',.1)-.1),2.4,6);glow(pad(R.grid,0),Math.max(K.t+2.4,K.at('sixteen',.4)-.1),2.4,4);
    note(R.bar,'16 questions · about 15 to 20 minutes',Math.max(K.t+5,K.at('fifteen',.75)-.3),K.t+K.d+.2,'below');return K.d;};
  SC.i_one=K=>{camTo(K.t+.1,K.t+1.3,pad(uni([R.setupBar].concat(R.defRows)),8));glow(R.defRows[0],Math.max(K.t+1.3,K.at('one behavior',.1)-.1),3,3);
    const td=Math.max(K.t+3,K.at('as it was defined',.3)-.1);glow(R.defRows[1],td,3,3);note(R.defRows[1],'This behavior, as defined: nothing else',Math.max(td+.5,K.at('nothing else',.45)-.1),K.t+K.d-.2,'below');return K.d;};
  SC.i_items=K=>{camTo(K.t+.1,K.t+1,uni([R.head,catRows(0)]));let t=Math.max(K.t+1.2,K.at('choose yes',.15)-.3);
    ansCells.filter(a=>a.r===0).forEach(a=>{const v=(a.sp&&a.sp.textContent||'').trim();const box=wrel(a.td);if(!v||!box){t+=.05;return;}follow(0,a.i,t);const mk=write(box,v,t,t+.26,'#2b4a9b',Math.min(16,box.h*.74));draw(PS,mk,.3);t+=.42;});
    penAway(PS,t+.1);note(R.grid?{x:R.grid.x-74,y:R.grid.y+70,w:0,h:0}:null,'Your answers',Math.max(K.t+1.2,K.at('choose yes',.15)-.2),K.t+3.5);
    const ts=Math.max(t+.2,K.at('actually seen',.75)-.2);camTo(ts-.4,ts+.5,uni([R.head,catRows(0),catRows(1)]));note(R.grid?{x:R.grid.x+R.grid.w/2,y:R.grid.y+40,w:0,h:0}:null,'What you have seen, not a guess',ts,K.t+K.d+.2);return Math.max(K.d,t+.6-K.t);};
  SC.i_na=K=>{const r=naCell&&naCell.r===0?wrel(naCell.td):null;const v=r?uni([r,wrel(rows[Math.max(0,naCell.i-3)]),wrel(rows[Math.min(15,naCell.i+3)])]):R.grid;camTo(K.t+.1,K.t+1,v);
    if(r){glow(r,K.t+1,K.t+K.d-K.t-1,3);note(r,'NA: never in that situation',Math.max(K.t+1.3,K.at('N A',.3)-.3),K.t+K.d-.2);}
    else{veil(K.t+.5,K.t+K.d,.4);card('iaw-card','<h3>NA: not applicable</h3><p>You have never been in that situation with the student. It is a better answer than a guess, and it is left out of the scoring.</p>',{x:300,y:150,w:680},K.t+.6,K.t+K.d);}return K.d;};
  SC.i_own=K=>{const v=uni([R.infT].concat(R.chk));camTo(K.t+.1,K.t+1.2,v||R.setupBar);if(R.chk[0])glow(R.chk[0],Math.max(K.t+1.2,K.at('on your own',.05)-.1),4,4);
    const ts=Math.max(K.t+7,K.at('open-ended section',.5)-.4);if(R.s1Rows.length){camTo(ts,ts+1.2,pad(uni(R.s1Rows),10));[0,1,2].forEach(i=>glow(R.s1Rows[i],Math.max(ts+1.2,K.at('when and where',.65)-.2),2.4,2));[6,7].forEach(i=>glow(R.s1Rows[i],Math.max(ts+3,K.at('before and after',.9)-.3),K.t+K.d-ts-3,2));}
    return K.d;};
  SC.i_outro=K=>{cam.move(K.t,K.t+1.2,HOME);const words=['One behavior','Your own answers','Yes · No · NA'];
    const box=mkFx('smw-words iaw-words3',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:60,y:250,w:1160},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['one behavior',.05],['your own',.35],['yes',.65]].map((a,i)=>Math.max(K.t+.4+i*.5,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));veil(K.t+.2,null,.55);return K.d+.6;};
  /* ---- the Convergence sheet ---- */
  const S2=sum?{bar:wrel(sum.querySelector('.bar')),head:wrel(sum.querySelector('.sumhead')),tbl:sum.querySelector('table.grid'),verd:sum.querySelectorAll('.verdict')[0]||null,faVerd:sum.querySelectorAll('.verdict')[1]||null,
    fig:sum.querySelector('.figure'),idents:[...sum.querySelectorAll('.ident')],defs:[...sum.querySelectorAll('.defs')],chk:sum.querySelector('.chkrow'),h3:[...sum.querySelectorAll('h3')]}:null;
  const S2R=S2?{tbl:wrel(S2.tbl),rows:S2.tbl&&S2.tbl.tBodies[0]?[...S2.tbl.tBodies[0].rows].map(wrel):[],heads:S2.tbl&&S2.tbl.tHead?[...S2.tbl.tHead.rows[0].cells].map(wrel):[],verd:wrel(S2.verd),faVerd:wrel(S2.faVerd),fig:wrel(S2.fig),
    fa:wrel(S2.idents[0]),hyp:wrel(S2.defs[0]),hypRows:S2.defs[0]?[...S2.defs[0].querySelectorAll('.drow')].map(wrel):[],chk:wrel(S2.chk),chkRows:S2.chk?[...S2.chk.querySelectorAll('label')].map(wrel):[],note:wrel(S2.defs[1])}:null;
  if(S2){/* the hypothesis and the analysis record appear when the narration reaches them */
    if(S2.defs[0])S2.defs[0].querySelectorAll('.iaw-v').forEach(e=>hide(e));if(S2.idents[0])S2.idents[0].querySelectorAll('.iaw-v').forEach(e=>hide(e));if(S2.faVerd)hide(S2.faVerd);}
  const trsOf=()=>S2&&S2.tbl&&S2.tbl.tBodies[0]?[...S2.tbl.tBodies[0].rows]:[];
  SC.c_intro=K=>{cam.move(K.t,K.t+.1,HOME);glow(S2.bar,Math.max(K.t+.4,K.at('Convergence sheet',.05)-.1),2.6,6);const trs=trsOf();const tr0=Math.max(K.t+3,K.at('Each row',.3)-.2);
    camTo(tr0-.2,tr0+.8,pad(uni([S2R.tbl].concat(S2R.heads)),10));trs.forEach((tr,i)=>glow(wrel(tr),tr0+.6+i*.25,1.6,2));
    const hc=S2R.heads[S2R.heads.length-1];note(hc,'The common set: attention, tangible, escape, automatic, physical',Math.max(tr0+2,K.at('common set',.62)-.2),K.t+K.d+.2);return K.d;};
  SC.c_rows=K=>{camTo(K.t+.1,K.t+1,pad(S2R.tbl,10));const trs=trsOf();const sp=trs.filter(tr=>/ or /.test(tr.cells[6]&&tr.cells[6].textContent||''));const ts=Math.max(K.t+1,K.at('social-positive',.05)-.2);
    sp.forEach((tr,i)=>glow(wrel(tr.cells[6]),ts+i*.2,3,2));if(sp.length)note(wrel(sp[0].cells[6]),'Attention or tangible: either',ts+.3,ts+3.2);
    const wk=trs.filter(tr=>/weak/.test(tr.cells[5]&&tr.cells[5].textContent||''));const tw=Math.max(ts+3.5,K.at('flagged weak',.5)-.2);
    if(wk.length){wk.forEach((tr,i)=>glow(wrel(tr.cells[5]),tw+i*.2,K.t+K.d-tw,2));note(wrel(wk[0].cells[5]),'Shown, not counted',tw+.3,K.t+K.d+.2,'below');}
    else{const hd=S2R.heads[5];glow(hd,tw,K.t+K.d-tw,3);note(hd,'A weak row would be shown here, not counted',tw+.3,K.t+K.d+.2);}return K.d;};
  SC.c_vote=K=>{camTo(K.t+.1,K.t+1,pad(uni([S2R.tbl,S2R.verd]),10));const trs=trsOf();const tv=Math.max(K.t+1,K.at('by informant',.1)-.2);glow(uni([S2R.heads[1]].concat(trs.map(tr=>wrel(tr.cells[1])))),tv,4,3);
    note(S2R.tbl?{x:S2R.tbl.x-74,y:S2R.tbl.y+90,w:0,h:0}:null,'One vote per informant',tv+.3,K.t+K.d+.2);const tm=Math.max(tv+4.5,K.at('most frequent',.7)-.3);trs.forEach((tr,i)=>glow(wrel(tr.cells[6]),tm+i*.15,K.t+K.d-tm,2));return K.d;};
  SC.c_verdict=K=>{camTo(K.t+.1,K.t+1,pad(S2R.verd,10));const tag=S2.verd.querySelector('.tag');const tl=Math.max(K.t+1,K.at('leading category',.08)-.2);if(tag)glow(wrel(tag),tl,K.t+K.d-tl,4);
    const t3=Math.max(tl+2.5,K.at('three informants',.35)-.2);note(S2R.verd,'At least 3 informants with an outcome',t3,t3+4);const t8=Math.max(t3+3,K.at('eighty percent',.55)-.2);note(S2R.verd,'80% or more = agreement',t8,t8+4,'below');
    const li=S2.verd.querySelector('li');const tr=Math.max(t8+3,K.at('A majority',.75)-.2);if(li)glow(wrel(li),tr,K.t+K.d-tr,3);return K.d;};
  SC.c_phys=K=>{veil(K.t,K.t+K.d,.5);card('iaw-card','<h3>Physical or pain leads</h3><p>Wherever a physical or pain profile leads on any instrument, the sheet says so first: a medical or nursing referral comes before any behavioral conclusion.</p>',{x:250,y:120,w:780},K.t+.3,K.t+K.d);
    const li=[...S2.verd.querySelectorAll('li')].find(l=>/Physical \/ pain leads/.test(l.textContent));if(li)glow(wrel(li),K.t+.5,K.t+K.d-K.t-.5,3);return K.d+.3;};
  SC.c_fig=K=>{if(!S2R.fig)return K.d;camTo(K.t+.1,K.t+1.3,pad(S2R.fig,10));glow(S2R.fig,Math.max(K.t+1.3,K.at('two ways',.15)-.2),3,4);
    const tc=Math.max(K.t+5,K.at('counted, not averaged',.55)-.3);note({x:S2R.fig.x+S2R.fig.w/2,y:S2R.fig.y+S2R.fig.h*.55+26,w:0,h:0},'Counted, not averaged',tc,K.t+K.d+.2);return K.d;};
  SC.c_hyp=K=>{camTo(K.t+.1,K.t+1.2,pad(uni([S2R.hyp]),10));const td=Math.max(K.t+1.2,K.at('drafted from the sheet',.12)-.2);if(S2.defs[0])S2.defs[0].querySelectorAll('.iaw-v').forEach((e,i)=>{const f=hid.find(h=>h.el===e);if(f)f.tr.move(td+i*.25,td+i*.25+.4,{o:1});});
    [['setting events',.3,0],['the antecedent',.4,1],['the behavior',.48,2],['the consequence',.55,3],['competing hypothesis',.65,4],['idiosyncratic',.78,5]].forEach(([ph,fr,i])=>{if(S2R.hypRows[i])glow(S2R.hypRows[i],Math.max(td+1+i*.3,K.at(ph,fr)-.15),1.8,2);});
    note(S2R.hyp,'A draft: edit it',Math.max(td+5,K.at('It is a draft',.9)-.2),K.t+K.d+.3,'below');return K.d;};
  SC.c_decide=K=>{camTo(K.t+.1,K.t+1.2,pad(uni([S2R.chk,S2R.note]),10));[['descriptive assessment',.1,0],['medical referral',.3,1],['full analysis',.45,2],['single-function',.55,3],['follow-up interview',.78,4]].forEach(([ph,fr,i],k)=>{if(S2R.chkRows[i])glow(S2R.chkRows[i],Math.max(K.t+1.2+k*.5,K.at(ph,fr)-.15),2.4,3);});return K.d;};
  SC.c_fa=K=>{camTo(K.t+.1,K.t+1.2,pad(uni([S2R.fa,S2R.faVerd]),10));let t=Math.max(K.t+1.4,K.at('enter its outcome',.12)-.2);
    const sps=S2.idents[0]?[...S2.idents[0].querySelectorAll('.iaw-v')]:[];sps.forEach(sp=>{const v=(sp.textContent||'').trim();const box=wrel(sp);if(!v||!box)return;const short=v.replace(/\s*\(.*$/,'');const mk=write(box,short.length>26?short.slice(0,24)+'…':short,t,t+.5,'#2b4a9b',Math.min(15,box.h*.7));draw(PS,mk,.5);t+=.8;});if(sps.length)penAway(PS,t+.1);
    const tv=Math.max(t+.3,K.at('scores each',.4)-.2);const f=hid.find(h=>h.el===S2.faVerd);if(f)f.tr.move(tv,tv+.4,{o:1});if(S2.faVerd)[...S2.faVerd.querySelectorAll('li')].forEach((li,i)=>glow(wrel(li),tv+.5+i*.3,2,2));
    note(S2R.faVerd,'The practice’s own validity record',Math.max(tv+2.5,K.at('validity record',.9)-.3),K.t+K.d+.3,'below');return Math.max(K.d,t+1-K.t);};
  SC.c_outro=K=>{cam.move(K.t,K.t+1.2,HOME);const words=['Converge','Decide','Verify'];
    const box=mkFx('smw-words',words.map(w=>'<span>'+esc(w)+'</span>').join(''),{x:90,y:250,w:1100},{o:1});const ws=[...box.el.querySelectorAll('span')].map(e=>sub(e,{s:.6,dy:12}));
    const at=[['converge',.05],['decide',.4],['verify',.7]].map((a,i)=>Math.max(K.t+.4+i*.45,K.at(a[0],a[1])-.15));ws.forEach((fx,i)=>fx.tr.move(at[i],at[i]+.4,{o:1,s:1,dy:0},0,easeOut));veil(K.t+.2,null,.55);return K.d+.6;};

  /* ---- the timeline: the lines of this mode the form can show ---- */
  let ids;
  if(MODE==='conv'){ids=sum?IDS_BY.conv.filter(id=>id!=='c_fig'||(S2.fig&&S2.fig.querySelector('svg'))):['c_outro'];}
  else if(MODE==='inf'){ids=grid?IDS_BY.inf.slice():['i_intro','i_outro'];}
  else{ids=['intro'];
    if(grid){ids.push('cats');if(defsC||infC)ids.push('define','informants');ids.push('items','na','totals','verdict');if(quiz)ids.push('practice','practice_answer');if(n>1)ids.push('agree');if(fig3C)ids.push('pubitems');ids.push('outagree','validity','concur','meaning');if(s1C)ids.push('section1');ids.push('next');}
    ids.push('outro');}
  let T=0;const cues=[];
  ids.filter(id=>present(id)).forEach(id=>{const ln=line(id),low=ln.t.toLowerCase(),on=onsetFn(id,ln.t,ln.d),T0=T;
    const K={id,t:T0,d:ln.d,text:ln.t,at:(ph,fr,from)=>{const i=low.indexOf(String(ph).toLowerCase(),from>0?from:0);return i<0?T0+ln.d*fr:T0+on(i);}};
    const need=(SC[id]?SC[id](K):ln.d)||0;const dur=Math.max(ln.d+PAUSE,need+.1);
    cues.push({id,start:T0,dur,narr:ln.d,text:ln.t,chapter:CHOF[id]||(CHAPS_BY[MODE]||CHAPS_BY.fast)[0][0],chunks:chunks(id,ln.t,T0,on),a:ln.a});T+=dur;});
  if(!ids.includes('items')&&MODE==='fast')shown(0);
  cam.move(T-1.2,T-.2,HOME);
  const chapters=(CHAPS_BY[MODE]||CHAPS_BY.fast).map(([id,label])=>{const c=cues.find(q=>q.chapter===id);return c?{id,label,start:c.start}:null;}).filter(Boolean);
  return{D:T,cues,chapters,cam,paper:world,fxs,marks,pens,cap,notes,quiz:ids.includes('practice_answer')?quiz:null,mode:MODE};
}
/* captions: a line in pieces of up to two caption lines; each piece shows a moment before the voice reaches its first word */
const CAPLEAD=.12;
function chunks(id,text,T,on){const P='\u2024';const guard=text.replace(/(\d)\.(\d)/g,'$1'+P+'$2');   /* 71.5 is one number, not a sentence's end */
  const parts=(guard.match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g)||[guard]).map(s=>s.trim()).filter(Boolean);const out=[];
  parts.forEach(p=>{if(p.length<=120){out.push(p);return;}const mid=p.length/2;let best=-1;p.replace(/[,;:] /g,(m,i)=>{if(best<0||Math.abs(i-mid)<Math.abs(best-mid))best=i;return m;});if(best<0){out.push(p);return;}out.push(p.slice(0,best+1));out.push(p.slice(best+2));});
  const merged=[];out.forEach(p=>{const L=merged[merged.length-1];if(L&&(L+' '+p).length<=96)merged[merged.length-1]=L+' '+p;else merged.push(p);});
  let cur=0;return merged.map((p,k)=>{const i=Math.max(cur,guard.indexOf(p.slice(0,12),cur));cur=i+1;return{t:k?T+Math.max(0,on(i)-CAPLEAD):T,text:p.split(P).join('.')};});}

/* ---------------- renderAt: the stage at time t ---------------- */
let RMQ=null;const reduced=()=>{try{RMQ=RMQ||window.matchMedia('(prefers-reduced-motion: reduce)');return !!RMQ.matches;}catch(e){return false;}};
function cueAt(t){if(!B)return null;const c=B.cues;let lo=0,hi=c.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(c[m].start<=t)lo=m;else hi=m-1;}return c[lo];}
function renderAt(t){if(!B)build();if(!B)return;t=clamp(+t||0,0,B.D);const cue=cueAt(t);
  const v=reduced()&&cue?Math.min(B.D,cue.start+cue.dur-.02):t;
  const c=B.cam.at(v);css(B.paper,'transform','translate('+f2(c.x)+'px,'+f2(c.y)+'px) scale('+c.s.toFixed(4)+')');
  for(const fx of B.fxs){const s=fx.tr.at(v);css(fx.el,'opacity',f2(s.o));css(fx.el,'visibility',s.o>.001?'visible':'hidden');
    const keepX=fx.el.classList.contains('iaw-note');const tr=(keepX?'translateX(-50%) ':'')+(s.dy||s.dx||s.s!==1?'translate('+f2(s.dx||0)+'px,'+f2(s.dy)+'px) scale('+s.s.toFixed(4)+')':'');css(fx.el,'transform',tr.trim()||'none');
    if(s.h!=null)css(fx.el,'backgroundColor',s.h>.01?'rgba(255,205,90,'+f2(.42*s.h)+')':'transparent');}
  for(const mk of B.marks){const u=clamp((v-mk.t0)/Math.max(.01,mk.t1-mk.t0),0,1);css(mk.el,'opacity',f2(u));css(mk.el,'visibility',u>0?'visible':'hidden');css(mk.el,'clipPath','inset(0 '+f2(100*(1-u))+'% 0 0)');}
  for(const p of B.pens){let s=p.tr.at(v),x=s.x,y=s.y;
    for(const d of p.draws)if(v>=d.t0&&v<=d.t1){const P=d.pt(d,(v-d.t0)/Math.max(.01,d.t1-d.t0),v);x=P.x;y=P.y;break;}
    css(p.el,'opacity',f2(s.o));css(p.el,'visibility',s.o>.001?'visible':'hidden');css(p.el,'transform','translate('+f2(x)+'px,'+f2(y-13)+'px) rotate('+f2(s.a)+'deg)');}
  if(B.quiz&&cue&&cue.id==='practice_answer'&&playing&&t<cue.start+.25&&!QUIZ.done&&!QUIZ.open){pause();quizShow();}
  let ct='';if(cue){for(const ch of cue.chunks)if(ch.t<=t+.001)ct=ch.text;}
  txt(B.cap,ct);css(B.cap,'visibility',ct?'visible':'hidden');const D=dom();if(D&&D.cap2)txt(D.cap2,ct);
  B.t=t;}
/*@@PLAYER@@*/
/* ---------------- the three walkthroughs: the buttons over the player ---------------- */
function setMode(m){if(!INFO[m]||m===MODE)return;MODE=m;document.querySelectorAll('#walk .wk-modes button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m?'true':'false'));
  const intro=document.getElementById('wkIntro');if(intro){const t={fast:intro.dataset.fast,inf:intro.dataset.inf,conv:intro.dataset.conv}[m];if(t)intro.textContent=t;}
  pos=0;try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();}
document.querySelectorAll('#walk .wk-modes button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
/* ---------------- the practice check: the player stops at the answer; the viewer decides; Play on ---------------- */
const QUIZ={open:false,done:false,a:null,m:null};
const qel=id=>document.getElementById(id);
function quizHide(){QUIZ.open=false;QUIZ.done=false;QUIZ.a=null;QUIZ.m=null;const q=qel('wkQuiz');if(q)q.hidden=true;}
function quizShow(){const q=qel('wkQuiz'),z=B&&B.quiz;if(!q||!z)return;QUIZ.open=true;QUIZ.a=null;QUIZ.m=null;
  qel('wkQuizQ').textContent='Informant '+z.who+': '+z.labels.map((l,i)=>l+' '+z.tots[i][0]+' of '+z.tots[i][1]).join(' · ')+'. Which group is the outcome, and by how much?';
  const mk=(host,opts,key)=>{host.innerHTML='';opts.forEach(([v,l])=>{const b=document.createElement('button');b.type='button';b.className='wk-qb';b.textContent=l;b.dataset.v=String(v);b.addEventListener('click',()=>{QUIZ[key]=v;[...host.children].forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));quizCheck();});host.appendChild(b);});};
  mk(qel('wkQuizA'),z.labels.map((l,i)=>[i,l]).concat([[-1,'No outcome (a tie)']]),'a');mk(qel('wkQuizM'),[[0,'0'],[1,'1'],[2,'2'],[3,'3 or more']],'m');
  qel('wkQuizR').textContent='';qel('wkQuizR').className='wk-qres';q.hidden=false;try{q.scrollIntoView({block:'nearest'});}catch(e){}}
function quizCheck(){const z=B&&B.quiz,r=qel('wkQuizR');if(!z||QUIZ.a===null)return;if(QUIZ.a!==-1&&QUIZ.m===null)return;
  const okA=QUIZ.a===z.ans,okM=z.ans<0?QUIZ.a===-1:(z.margin>=3?QUIZ.m===3:QUIZ.m===z.margin);QUIZ.done=true;
  const right=z.ans<0?(z.tie?'A tie: no outcome.':'Nothing endorsed: no outcome.'):'The outcome is '+z.labels[z.ans]+' ('+z.mx+' of '+z.tots[z.ans][1]+'), margin '+z.margin+(z.margin===1?': kept, with a caution.':'.');
  r.textContent=(okA&&okM?'Right. ':okA?'The group is right; the margin is the gap to the next group. ':'Not quite. ')+right;r.className='wk-qres '+(okA&&okM?'ok':'no');}
(function(){const go=qel('wkQuizGo');if(go)go.addEventListener('click',()=>{const q=qel('wkQuiz');if(q)q.hidden=true;QUIZ.open=false;QUIZ.done=true;play();});})();
/* ---------------- captions (SRT) and chapters for YouTube, from this walkthrough's own timeline ---------------- */
function stamp(t,sep){t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=Math.floor(t%60),ms=Math.round((t-Math.floor(t))*1000);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+sep+String(ms).padStart(3,'0');}
function captionsOf(){if(!B)build();if(!B)return [];const out=[];B.cues.forEach((c,i)=>{const end=Math.min(c.start+c.dur,(B.cues[i+1]||{start:B.D}).start);
  c.chunks.forEach((ch,k)=>{const a=ch.t,b=k+1<c.chunks.length?c.chunks[k+1].t:Math.min(end,c.start+c.narr+.35);if(b>a+.2)out.push({a,b,text:ch.text});});});return out;}
function chaptersText(){if(!B)build();if(!B)return '';const mm=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};return B.chapters.map((c,i)=>mm(i?c.start:0)+' '+c.label).join('\n');}
function dlText(text,type,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
function exportCaps(){const caps=captionsOf();if(!caps.length)return;const base=(INFO[MODE]||INFO.fast).file.replace(/\s+/g,'-');
  const srt=caps.map((x,j)=>(j+1)+'\n'+stamp(x.a,',')+' --> '+stamp(x.b,',')+'\n'+x.text).join('\n\n')+'\n';dlText(srt,'application/x-subrip','IA-1_'+base+'_captions.srt');
  const ch=chaptersText()+'\n';setTimeout(()=>dlText(ch,'text/plain','IA-1_'+base+'_YouTube-chapters.txt'),400);try{if(navigator.clipboard)navigator.clipboard.writeText(ch).catch(()=>{});}catch(e){}
  if(window.nbhUI&&nbhUI.toast)nbhUI.toast(caps.length+' captions (SRT) and '+(B.chapters.length)+' chapters for the video\'s description; the chapters are on the clipboard too.',{kind:'ok'});}
(function(){const b=document.getElementById('wkCaps');if(b)b.addEventListener('click',exportCaps);})();
/* ---------------- the view: IA-1's views; leaving the Walkthrough pauses it, entering it builds it from the form as it is ---------------- */
const setView0=setView;
setView=function(v){if(v!=='walk'&&(want||playing))pause();
  setView0(v);
  if(v==='walk'){try{build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}fit();ui();reveal();}
  else if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);};
let building=false;
if(typeof renderAllTot==='function'){const renderAllTot0=renderAllTot;
  renderAllTot=function(){const r=renderAllTot0.apply(this,arguments);if(building)return r;if(B)B.dirty=true;
    if(document.body.classList.contains('view-walk')){building=true;try{build();fit();ui();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){return [];},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get example(){return B?B.notes.some(x=>/worked example/.test(x)):false;},
  get mode(){return MODE;},set mode(m){setMode(m);},get quiz(){return B?B.quiz:null;},captions:captionsOf,chapterList:chaptersText,exportCaptions:exportCaps,quizState:QUIZ,quizCheck,quizShow,
  get stage(){const D=dom();return D&&D.stage;}};
})();
