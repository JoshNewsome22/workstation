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
