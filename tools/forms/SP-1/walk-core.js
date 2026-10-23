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
