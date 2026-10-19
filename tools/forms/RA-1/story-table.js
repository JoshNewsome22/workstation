/* (v22.71) Form RA-1, the Walkthrough view's drawn stories, seen from above the table, in the look of the walkthrough video:
   the tray of blocks, the bin or the three stations on their mats, the tablet and the fruit chew on the assessor's side, the
   student's hand from the near edge and the assessor's from the far edge (Form TK-1's hand drawings, as the video draws them),
   and the data collector's screen beside the table. No figures are drawn. A step that shows a sheet (a board) shows it alone,
   full size, in place of the table. Each step is the same data the stories always had (window.NBHStories: who does what, what
   is on the table, what the screen shows); NBHTable.make(el).set(step) draws it, and the hands and the items glide from one
   step to the next. The caption under the picture says what the student (or the screen) is doing. Put into the form by
   tools/forms/RA-1/patch-story.py. */
window.NBHTable=(function(){
'use strict';
const SW=1280,SH=720;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const div=(cls,html)=>{const d=document.createElement('div');if(cls)d.className=cls;if(html!=null)d.innerHTML=html;return d;};
const art=()=>window.NBH_RA_ART||{};
/* the multielement signals, as the form and the video use them */
const PM={gray:['#8d989e','Control'],blue:['#2f5fa3','Tablet'],red:['#e0742f','Fruit chew'],green:['#3f8a4f','Praise + high five']};
const TAGC={tablet:'#2f5fa3','fruit chew':'#e0742f',nothing:'#8d989e',control:'#8d989e'};
const BLOCKC=['#7b61a8','#e8b737','#4f9a8a','#d9583b','#2f5fa3','#c9a13b'];
/* the table's places (the stage is 1280 by 720; the screen panel takes the right-hand side) */
const TRAY={x:40,y:250,w:300,h:250},BK=38,GAP=8;
const ONE={x:575,y:470},BIN=160,MAT={x:455,y:205,w:240,h:430};
const THREE=[415,585,755],BIN3=124,MAT3={y:215,w:150,h:420},BIN3Y=505;
const DROP={x:575,y:300};             /* where a delivered item sits, in front of the student */
const HOME={tablet:{x:660,y:92},chew:{x:470,y:92}};
const SHOULDER={learner:[430,SH+560],teacher:[600,-560]},HSC={learner:1.12,teacher:1.18};
const ANCH={point:'tip',pinch:'grip',open:'palm'};
/* the shape of the clock chip and the bell, check and dot of the screen's status */
const CLOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#1d3b5a" stroke-width="2"/><path d="M12 6.5V12l3.6 2.2" fill="none" stroke="#1d3b5a" stroke-width="2" stroke-linecap="round"/></svg>';
const KIND={alert:['Cue','nst-k-alert'],rec:['Running','nst-k-rec'],ok:['Done','nst-k-ok']};

/* opt.px: a fixed width in CSS pixels (the printed job aids, laid out in inches, where the window's width says nothing) */
function make(host,opt){
  host.innerHTML='';host.classList.add('nst');
  const frame=div('nst-frame');host.appendChild(frame);
  const st=div('wk-stage nst-stage');st.setAttribute('aria-hidden','true');frame.appendChild(st);
  const px=opt&&+opt.px>0?+opt.px:0;
  const fit=()=>{const w=px||frame.clientWidth||SW;st.style.transform='scale('+(w/SW).toFixed(5)+')';};
  if(px){frame.style.width=px+'px';frame.style.borderRadius='4px';fit();}
  else{try{new ResizeObserver(fit).observe(frame);}catch(e){window.addEventListener('resize',fit);}requestAnimationFrame(fit);fit();}
  const L=c=>{const d=div('nst-L '+c);st.appendChild(d);return d;};
  const Ltab=L('nst-tab'),Litem=L('nst-item'),Lhl=L('nst-hl'),Lht=L('nst-ht'),Lfx=L('nst-fx'),Lbrd=L('nst-brd');
  const at=(el,x,y,w,h)=>{el.style.left=x+'px';el.style.top=y+'px';if(w!=null)el.style.width=w+'px';if(h!=null)el.style.height=h+'px';return el;};
  /* ---- the table ---- */
  const tray=at(div('raw-tray nst-trayb'),TRAY.x,TRAY.y,TRAY.w,TRAY.h);Ltab.appendChild(tray);
  {const cols=6,rows=5,ox=TRAY.x+(TRAY.w-(cols*BK+(cols-1)*GAP))/2,oy=TRAY.y+(TRAY.h-(rows*BK+(rows-1)*GAP))/2;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const b=at(div('nst-blk'),ox+i*(BK+GAP),oy+j*(BK+GAP),BK,BK);b.style.background=BLOCKC[(i+j*2)%BLOCKC.length];b.style.transform='rotate('+(((i*7+j*3)%5-2)*3)+'deg)';tray.appendChild(b);}
    tray.querySelectorAll('.nst-blk').forEach(b=>{b.style.left=(parseFloat(b.style.left)-TRAY.x)+'px';b.style.top=(parseFloat(b.style.top)-TRAY.y)+'px';});}
  const mat1=at(div('raw-mat nst-mat','<span class="nst-matl"></span>'),MAT.x,MAT.y,MAT.w,MAT.h);Ltab.appendChild(mat1);
  const bin1=at(div('raw-bin nst-bin','<div class="raw-binfloor"></div>'),ONE.x-BIN/2,ONE.y-BIN/2,BIN,BIN);Ltab.appendChild(bin1);
  const mats3=THREE.map(x=>{const m=at(div('raw-mat raw-mat3 nst-mat','<span class="nst-matl"></span>'),x-MAT3.w/2,MAT3.y,MAT3.w,MAT3.h);Ltab.appendChild(m);return m;});
  const bins3=THREE.map(x=>{const b=at(div('raw-bin raw-bin3 nst-bin','<div class="raw-binfloor"></div>'),x-BIN3/2,BIN3Y-BIN3/2,BIN3,BIN3);Ltab.appendChild(b);return b;});
  const none3=at(div('raw-none nst-none','nothing'),0,0,140,56);Ltab.appendChild(none3);
  const sw=at(div('nst-switch','<i></i>'),ONE.x-70,ONE.y-70,140,140);Ltab.appendChild(sw);
  /* the brief MSWO array: up to three items in a row in front of the student */
  const arr=div('nst-arr');Ltab.appendChild(arr);
  /* ---- the items ---- */
  const A=art();
  const tab=div('raw-fc raw-item nst-it','<div class="wk-sh raw-sh"></div>'+(A.TABLET||'<div class="raw-tab"><div class="raw-tabscr"></div></div>'));tab.style.width='150px';tab.style.height='105px';Litem.appendChild(tab);
  const chew=div('raw-fc raw-item nst-it','<div class="wk-sh raw-sh"></div><div class="raw-chewpic">'+(A.CHEW||'')+'</div>');chew.style.width='110px';chew.style.height='66px';Litem.appendChild(chew);
  const cup=div('nst-cup','<i></i><i></i><i></i>');Litem.appendChild(cup);
  const held=div('nst-blk nst-held');held.style.width=BK+'px';held.style.height=BK+'px';held.style.background=BLOCKC[1];Litem.appendChild(held);
  const clip=div('nst-clip','<i></i><i></i><i></i><i></i>');Litem.appendChild(clip);
  /* ---- the hands (TK-1's drawings, each pose drawn about the point that touches) ---- */
  const hands={};
  const mkHand=who=>{const ARTH=(typeof A.hands==='function'?A.hands():A.hands)||null;const root=div('wk-hand nst-hand nst-'+who);(who==='teacher'?Lht:Lhl).appendChild(root);
    const h={who,root,poses:{},cur:null};
    if(ARTH&&ARTH[who])['point','pinch','open'].forEach(p=>{const a=ARTH[who][p];if(!a)return;const an=a[ANCH[p]]||[a.w/2,0];const e=div('wk-pose nst-pose',a.svg);
      e.style.width=a.w+'px';e.style.height=a.h+'px';e.style.transformOrigin=an[0]+'px '+an[1]+'px';root.appendChild(e);h.poses[p]={el:e,ax:an[0],ay:an[1]};});
    hands[who]=h;return h;};
  const HL=mkHand('learner'),HT=mkHand('teacher');
  /* a hand at p in a pose: turned along the arm from its shoulder; null takes it off the table, back along the arm */
  const handTo=(h,p,pose)=>{const sh=SHOULDER[h.who],sc=HSC[h.who];
    let q=p,vis=!!p;if(!p){const c=h.last||{x:sh[0],y:h.who==='teacher'?60:SH-40};const dx=sh[0]-c.x,dy=sh[1]-c.y,len=Math.hypot(dx,dy)||1;q={x:c.x+dx/len*420,y:c.y+dy/len*420};}
    else h.last=p;
    const ang=Math.atan2(q.x-sh[0],sh[1]-q.y)*180/Math.PI,want=pose||h.cur||'pinch';
    for(const name in h.poses){const P=h.poses[name],on=vis&&name===want;
      P.el.style.transform='translate('+(q.x-P.ax).toFixed(1)+'px,'+(q.y-P.ay).toFixed(1)+'px) rotate('+ang.toFixed(2)+'deg) scale('+sc+')';
      P.el.style.opacity=on?'1':'0';P.el.style.visibility='visible';}
    if(vis)h.cur=want;};
  /* ---- the screen beside the table, the clock, the speech, the sheet ---- */
  const obsW=div('nst-obsw','<div class="nst-obsh">Data collector&rsquo;s screen</div><div class="nst-obs"><div class="nst-o1"></div><div class="nst-o2"></div><div class="nst-o3"></div><div class="nst-ok"></div></div>'
    +'<div class="nst-obs nst-obs2"><div class="nst-o1"></div><div class="nst-o2"></div><div class="nst-o3"></div></div><div class="nst-lad"><svg class="tbl" viewBox="-2 -2 245 44" aria-hidden="true"><g class="ra-lad"></g></svg><svg class="tbl" viewBox="243 -2 245 44" aria-hidden="true"><g class="ra-lad"></g></svg></div>');Lfx.appendChild(obsW);
  const O1=obsW.querySelectorAll('.nst-obs')[0],O2=obsW.querySelectorAll('.nst-obs')[1],lad=obsW.querySelector('.nst-lad');
  const clock=div('nst-clock',CLOCK+'<b></b>');Lfx.appendChild(clock);
  const bub=div('nst-bub');Lfx.appendChild(bub);
  const pbm=div('nst-pb','Problem behavior');Lfx.appendChild(pbm);
  const fx=div('nst-hit');Lfx.appendChild(fx);
  const clap=div('nst-clap','<i></i><i></i><i></i><i></i><i></i>');Lfx.appendChild(clap);
  const brd=div('nst-board','<div class="nst-bt">On the screen</div><svg class="tbl" viewBox="0 0 480 172" aria-hidden="true"></svg>');Lbrd.appendChild(brd);
  const show=(el,on)=>{el.classList.toggle('nst-off',!on);};
  const place=(el,p,w,h)=>{el.style.transform='translate('+(p.x-w/2).toFixed(1)+'px,'+(p.y-h/2).toFixed(1)+'px)';};
  const fillBin=(bin,n,small)=>{const fl=bin.querySelector('.raw-binfloor');n=Math.max(0,Math.min(9,n|0));if(fl._n===n)return;fl._n=n;const sz=small?28:34,c=small?BIN3/2:BIN/2;
    const SLOT=[[0,0],[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1],[-1,0],[1,0]];fl.innerHTML='';for(let i=0;i<n;i++){const b=div('nst-blk nst-in');const s=SLOT[i];
      b.style.width=sz+'px';b.style.height=sz+'px';b.style.left=(c-sz/2+s[0]*sz*1.05-8)+'px';b.style.top=(c-sz/2+s[1]*sz*1.05-8)+'px';b.style.background=BLOCKC[(i*2+1)%BLOCKC.length];b.style.transform='rotate('+((i*37)%40-20)+'deg)';fl.appendChild(b);}};
  const tagCol=t=>TAGC[String(t||'').toLowerCase()]||'#8d989e';
  let wide=false;
  function set(f){f=f||{};
    const board=!!f.board;show(Lbrd,board);[Ltab,Litem,Lhl,Lht].forEach(l=>show(l,!board));
    if(board){const svg=brd.querySelector('svg');if(svg._k!==f.board){svg._k=f.board;const N=window.NBHScene;svg.innerHTML=(N&&N.board&&N.board(f.board))||'';}}
    /* the screen panel, or the table across the whole frame */
    const obs=!board&&!f.noObs&&(f.obs||f.obs2||f.lad);wide=!obs;st.classList.toggle('nst-wide',wide);show(obsW,!!obs);
    const paintO=(el,o,k)=>{show(el,!!o);if(!o)return;el.querySelector('.nst-o1').textContent=o.t1||'';el.querySelector('.nst-o2').textContent=o.t2||'';el.querySelector('.nst-o3').textContent=o.t3||'';
      if(k){const kk=KIND[o.k]||null;const e=el.querySelector('.nst-ok');e.textContent=kk?kk[0]:'';e.className='nst-ok '+(kk?kk[1]:'');el.classList.toggle('nst-alert',o.k==='alert');}};
    paintO(O1,f.obs,true);paintO(O2,f.obs2,false);
    show(lad,!!f.lad);if(f.lad){const N=window.NBHScene;const lh=(N&&N.ladder&&N.ladder(f.lad))||'';lad.querySelectorAll('g').forEach(g=>{g.innerHTML=lh;});}
    show(clock,!board&&!!f.clock);clock.querySelector('b').textContent=f.clock||'';
    /* the arrangement: one bin on its mat, three stations, a switch, or the brief MSWO array */
    const n=f.bins==null?1:f.bins,three=n===3,one=n===1&&!f.button;
    show(tray,!board&&f.tray!==false);show(mat1,one||!!f.button);show(bin1,one);mats3.forEach(m=>show(m,three));bins3.forEach(b=>show(b,three));show(sw,!!f.button);
    const pm=PM[f.pm]||null;mat1.style.background=pm?pm[0]:'#c4bdb0';mat1.querySelector('.nst-matl').textContent=pm?pm[1]:'';
    const fill=f.fill||[];fillBin(bin1,fill[0]||0,false);bins3.forEach((b,i)=>fillBin(b,fill[i]||0,true));
    const tags=f.tags||[];mats3.forEach((m,i)=>{const t=tags[i]||['',''];m.style.background=tagCol(t[1]);m.querySelector('.nst-matl').textContent=(t[0]&&t[0]!==t[1]?t[0]+' · ':'')+(t[1]||'');});
    const ix=i=>three?THREE[i]:ONE.x,iy=()=>three?BIN3Y:ONE.y;
    /* the items on the assessor's side: in three-station sessions each above its own mat */
    const slotOf=name=>{if(three){const i=tags.findIndex(t=>String(t[1]||'').toLowerCase()===name);if(i>=0)return{x:THREE[i],y:100};}return HOME[name==='fruit chew'?'chew':name];};
    const tablet=f.tablet,TP=slotOf('tablet');
    const aHold=(f.a==='hold'||f.a==='hand'||f.a==='take');
    const aP=f.a==='hand'?{x:DROP.x,y:DROP.y-10}:f.a==='take'?{x:DROP.x,y:DROP.y}:{x:DROP.x+20,y:205};
    let tabAt=null;if(tablet==='table')tabAt=TP;else if(tablet==='student'||tablet==='near')tabAt=DROP;else if(tablet==='adult')tabAt=aHold?{x:aP.x,y:aP.y+18}:{x:DROP.x+20,y:220};
    show(tab,!board&&!!tabAt);if(tabAt)place(tab,tabAt,150,105);tab.classList.toggle('nst-play',!!f.play);
    const CP=slotOf('fruit chew');show(cup,!board&&!!f.cup);if(f.cup)place(cup,{x:CP.x,y:CP.y},92,70);
    let chewAt=null;if(f.chew==='adult')chewAt=aHold&&tablet!=='adult'?{x:aP.x,y:aP.y+14}:{x:DROP.x-10,y:230};else if(f.s==='takeit'&&f.chew)chewAt={x:DROP.x,y:DROP.y};
    show(chew,!board&&!!chewAt);if(chewAt)place(chew,chewAt,110,66);
    show(none3,three);if(three){const i=tags.findIndex(t=>/nothing|control/i.test(String(t[1]||'')));place(none3,{x:THREE[i<0?2:i],y:100},140,56);}
    /* the brief MSWO array */
    const items=f.arr||[];show(arr,!board&&items.length>0);if(items.length){arr.innerHTML=items.map((a,i)=>{const nm=String(a.l1||'');const pic=/tablet/i.test(nm)?(A.TABLET||''):/chew/i.test(nm)?'<div class="raw-chewpic">'+(A.CHEW||'')+'</div>':'<div class="nst-bubbles"><i></i><i></i><i></i></div>';
      return '<div class="nst-ai'+(a.gone?' nst-gone':'')+'" style="left:'+(THREE[i]||THREE[2])+'px"><div class="nst-aip">'+pic+'</div><b>'+esc(nm)+'</b></div>';}).join('');}
    /* the student's hand */
    const binP=k=>({x:ix(k|0)+(three?-4:-6),y:iy()-(three?26:34)});
    let lp=null,lpose='pinch',hold=f.hold==='block';
    switch(f.s){
      case 'pick':lp={x:TRAY.x+TRAY.w-60,y:TRAY.y+TRAY.h/2};hold=true;break;
      case 'place':lp=binP(f.at);hold=f.hold==='block'||!f.button;if(f.button){lp={x:ONE.x-4,y:ONE.y-8};lpose='point';hold=false;}break;
      case 'hi5':lp={x:DROP.x-20,y:262};lpose='open';hold=false;break;
      case 'rest':lp={x:430,y:SH-30};lpose='open';hold=false;break;
      case 'takeit':lp=chewAt&&f.chew==='adult'?{x:chewAt.x-10,y:chewAt.y+26}:tabAt?{x:tabAt.x-30,y:tabAt.y+40}:{x:DROP.x,y:DROP.y+30};hold=false;break;
      case 'holdTablet':lp={x:DROP.x-36,y:DROP.y+34};lpose='open';hold=false;break;
      case 'hit':lp={x:DROP.x+60,y:226};lpose='open';hold=false;break;
      case 'eat':lp={x:300,y:SH+40};hold=false;break;
      case 'reachArr':{const k=items.findIndex(a=>/tablet/i.test(String(a.l1||'')));lp={x:(THREE[k<0?2:k])-6,y:350};hold=false;break;}
      case 'away':lp=null;hold=false;break;
      default:lp=null;hold=false;}
    if(board)lp=null;handTo(HL,lp,lpose);
    show(held,!board&&hold&&!!lp);if(hold&&lp)held.style.transform='translate('+(lp.x-BK/2+4).toFixed(1)+'px,'+(lp.y-BK/2+8).toFixed(1)+'px) rotate(-8deg)';
    /* the assessor's hand */
    let tp=null,tpose='pinch';
    switch(f.a){
      case 'hold':case 'hand':case 'take':tp={x:aP.x+40,y:aP.y-6};break;
      case 'hi5':tp={x:DROP.x+18,y:228};tpose='open';break;
      case 'pointBin':tp={x:ix(f.at|0)+10,y:iy()-96};tpose='point';break;
      case 'write':tp={x:150,y:118};break;
      default:tp=null;}
    if(board||f.ap==='seat')tp=null;handTo(HT,tp,tpose);
    show(clip,!board&&f.a==='write');
    /* speech, praise, problem behavior */
    show(bub,!board&&!!f.say);if(f.say){bub.textContent='“'+f.say+'”';const bx=tp?Math.min(tp.x+60,820):DROP.x+90;bub.style.left=bx+'px';bub.style.top=(tp?Math.max(20,tp.y-150):40)+'px';}
    show(clap,!board&&!!f.clap);show(pbm,!board&&!!f.pb);show(fx,!board&&f.s==='hit');
  }
  return {set};
}
return {make};
})();
