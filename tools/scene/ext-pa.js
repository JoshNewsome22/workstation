/* PA-1: the preference assessment table. The items of a trial sit in a row on the table, one can be
   ringed as the selection, the student or the therapist can hold one, a plan box shows the row from
   above, a small timer and a tray carry the trial, and the boards show the sheets' tables and graphs.
   The engine's own figures, room and props are unchanged; this module adds the markup, the poses
   and the per-frame positions from the first engine (same frame fields: items, sel, sAt, fAt, aAt,
   aBlock, held, heldV, aHold, fx, plan, ptimer, tray, pboard, fMouth). */
const EXT={
  viewBox:'0 -44 880 360',
  alt:PA_ALT,
  noPlant:true,
  exports:{pa:PA_EX,paName:PA_NAME},
  poseA:{present:[184,162,246,178], offer:[186,152,258,164], lap:[152,178,170,206], still:[160,180,172,210]},
  poseS:{hold:[556,168,530,150], eat:[554,170,585,123], mouth:[554,168,587,121], chew:[554,170,586,124], lean:[548,160,500,176], look:[562,184,526,196]},
  svgBack(){return '<g class="paboard"><rect class="pbz" x="206" y="-38" width="492" height="232" rx="6"/><rect class="pin" x="214" y="-30" width="476" height="216" rx="2"/><g class="pbc" transform="translate(220 -26)"></g></g>'+
    '<g class="prop patray" transform="translate(40 240) scale(1.25)"><g class="ti"></g><rect class="tbx" x="-30" y="-12" width="60" height="26" rx="3"/><text class="tl" x="0" y="6" text-anchor="middle"></text></g>'+
    '<g class="prop patimer" transform="translate(214 178)"><rect class="tb" x="-10" y="12" width="20" height="4" rx="2"/><circle class="tf" r="11"/><path class="tw" d=""/><circle class="tp" r="1.6"/><text class="tt" x="16" y="4"></text></g>'+
    '<g class="prop parow"></g><g class="prop paahold"></g>'+
    '<g class="paplan"><rect class="pbg" x="410" y="-40" width="270" height="94" rx="6"/><text class="pt" x="420" y="-26">From above</text><rect class="ptab" x="424" y="-16" width="242" height="40" rx="3"/><path class="prot" d=""/><g class="pgh"></g><g class="pits"></g><g class="plab"></g><g class="pst"><ellipse cx="545" cy="45" rx="16" ry="6.5"/><circle cx="545" cy="43" r="7"/></g><text class="ps" x="567" y="48">Student</text></g>';},
  svgFront(){return '<g class="prop pahold"></g><g class="pafx"><g class="bubbles"><circle cx="492" cy="136" r="5"/><circle cx="476" cy="120" r="3.6"/><circle cx="498" cy="106" r="3"/><circle cx="468" cy="98" r="6"/><circle cx="490" cy="84" r="3.4"/></g><g class="notes"><path d="M448 150 v-15 l9 -3 v14"/><ellipse cx="445" cy="150" rx="3.6" ry="2.6"/><ellipse cx="454" cy="146" rx="3.6" ry="2.6"/><path d="M478 132 v-14 l6 3"/><ellipse cx="475" cy="132" rx="3.6" ry="2.6"/></g><g class="buzz"><path d="M492 160 q-5 6 0 12 M486 156 q-7 10 0 20 M528 160 q5 6 0 12 M534 156 q7 10 0 20"/></g></g>';},
  refs(el,q){
    const g={row:q('.prop.parow'),hold:q('.prop.pahold'),ahold:q('.prop.paahold'),fx:q('.pafx'),plan:q('.paplan'),pits:q('.paplan .pits'),plab:q('.paplan .plab'),prot:q('.paplan .prot'),
      pgh:q('.paplan .pgh'),timer:q('.prop.patimer'),tw:q('.prop.patimer .tw'),tt:q('.prop.patimer .tt'),tray:q('.prop.patray'),trayT:q('.prop.patray .tl'),trayI:q('.prop.patray .ti'),
      board:q('.paboard'),bc:q('.paboard .pbc')};
    const item=(k,sc)=>'<g class="pit" data-k="'+k+'" style="display:none"><g transform="scale('+sc+')">'+PA_RING+'<g class="ic">'+paIcon(k)+'</g></g></g>';
    g.row.innerHTML=PA_KEYS.map(k=>item(k,1)).join('');
    g.pits.innerHTML=PA_KEYS.map(k=>item(k,0.66)).join('');
    g.hold.innerHTML=PA_KEYS.map(k=>'<g class="pih" data-k="'+k+'" style="display:none">'+paIcon(k,'held')+'</g>').join('')+'<g class="pih" data-k="book-open" style="display:none">'+paIcon('book','open')+'</g>';
    g.ahold.innerHTML=PA_KEYS.map(k=>'<g class="pih" data-k="'+k+'" style="display:none">'+paIcon(k,'held')+'</g>').join('');
    const map=(root,sel)=>{const m={};root.querySelectorAll(sel).forEach(n=>{m[n.dataset.k]=n;});return m;};
    g.rowIt=map(g.row,'.pit');g.planIt=map(g.pits,'.pit');g.holdIt=map(g.hold,'.pih');g.aholdIt=map(g.ahold,'.pih');
    el.pa=g;
  },
  target(f,t,ctx){
    const it=f.items||[],n=it.length,dx=ctx.adx||0;
    it.forEach((k,i)=>{if(k){t['rx_'+k]=paRowX(n,i);t['px_'+k]=paPlanX(n,i);}});
    const rx=k=>{const i=it.indexOf(k);return i<0?null:paRowX(n,i);};
    if(f.sAt&&rx(f.sAt)!=null){t.sHx=rx(f.sAt)+7;t.sHy=176;t.sGaze=0.7;}
    if(f.fAt&&rx(f.fAt)!=null){t.fHx=rx(f.fAt)+5;t.fHy=172;}
    if(f.aAt&&rx(f.aAt)!=null){t.aHx=rx(f.aAt)-8-dx;t.aHy=170;t.aGaze=0.6;}
    /* blocking a reach for two items: the therapist's hand between the student's hands and the items */
    if(f.aBlock&&it.filter(Boolean).length>1){const xs=it.filter(Boolean).map(rx),x=(Math.min(...xs)+Math.max(...xs))/2-dx+6;t.aHx=x;t.aHy=150;}
    /* the far hand at the mouth: mouthing while the near hand holds an item */
    if(f.fMouth){t.fHx=586;t.fHy=122;}
    if(f.s==='mouth'||f.s==='eat'||f.s==='chew'||f.held)t.sGaze=0.5;
    const h=PA_HOLD[f.held]||[-4,10,0];t.hx=t.sHx+h[0];t.hy=t.sHy+h[1];t.hr=h[2];
    t.ahx=t.aHx+dx+8;t.ahy=t.aHy+12;
  },
  draw(c,el){
    const g=el.pa;
    Object.keys(g.rowIt).forEach(k=>{if(c['rx_'+k]!=null)g.rowIt[k].setAttribute('transform','translate('+(+c['rx_'+k]).toFixed(1)+' 195)');
      if(c['px_'+k]!=null)g.planIt[k].setAttribute('transform','translate('+(+c['px_'+k]).toFixed(1)+' 17)');});
    g.hold.setAttribute('transform','translate('+(+c.hx||0).toFixed(1)+' '+(+c.hy||0).toFixed(1)+') rotate('+(+c.hr||0).toFixed(1)+')');
    g.ahold.setAttribute('transform','translate('+(+c.ahx||0).toFixed(1)+' '+(+c.ahy||0).toFixed(1)+')');
  },
  discrete(f,el,show){
    const g=el.pa,it=f.items||[],n=it.length;
    Object.keys(g.rowIt).forEach(k=>{const on=it.includes(k);show(g.rowIt[k],on);g.rowIt[k].classList.toggle('sel',f.sel===k);
      show(g.planIt[k],!!f.plan&&on);g.planIt[k].classList.toggle('sel',f.sel===k);});
    const hk=f.held?(f.held==='book'&&f.heldV==='open'?'book-open':f.held):null;
    Object.keys(g.holdIt).forEach(k=>show(g.holdIt[k],k===hk));show(g.hold,!!hk);
    Object.keys(g.aholdIt).forEach(k=>show(g.aholdIt[k],k===f.aHold));show(g.ahold,!!f.aHold);
    show(g.fx,!!f.fx);['bubbles','notes','buzz'].forEach(k=>show(g.fx.querySelector('.'+k),f.fx===k));
    const P=f.plan;show(g.plan,!!P);
    if(P){const lab=P.lab==='LR'?['L','R']:P.lab==='num'?it.map((_,i)=>String(i+1)):[];
      g.plab.innerHTML=lab.map((l,i)=>'<text x="'+paPlanX(n,i).toFixed(1)+'" y="33" text-anchor="middle">'+l+'</text>').join('');
      if(P.rot&&n>1){const a=paPlanX(n,0),b=paPlanX(n,n-1);g.prot.setAttribute('d','M'+a+' -8 C'+(a+10)+' -30 '+(b-10)+' -30 '+b+' -8 M'+(b-6)+' -14 L'+b+' -7 L'+(b+5)+' -15');}
      show(g.prot,!!(P.rot&&n>1));
      g.pgh.innerHTML=it.map((k,i)=>k?'':'<rect x="'+(paPlanX(n,i)-13).toFixed(1)+'" y="-8" width="26" height="26" rx="4"/>').join('');}
    show(g.timer,!!f.ptimer);if(f.ptimer){const p=Math.max(0,Math.min(1,f.ptimer.f)),a=p*2*Math.PI;
      g.tw.setAttribute('d',p<=0?'':p>=1?'M0 -11 A11 11 0 1 1 -0.01 -11 Z':'M0 0 L0 -11 A11 11 0 '+(p>0.5?1:0)+' 1 '+(11*Math.sin(a)).toFixed(2)+' '+(-11*Math.cos(a)).toFixed(2)+' Z');g.tt.textContent=f.ptimer.t||'';}
    show(g.tray,!!f.tray);if(f.tray){g.trayT.textContent=f.tray;const ks=f.tray==='EDIBLES'?['fish','juice','fruit']:['tab','blk','book'];
      g.trayI.innerHTML=ks.map((k,i)=>'<g transform="translate('+(-18+i*18)+' -12) scale(.6)">'+paIcon(k)+'</g>').join('');}
    show(g.board,!!f.pboard);if(f.pboard&&g.board.getAttribute('data-k')!==f.pboard){g.bc.innerHTML=paBoard(f.pboard);g.board.setAttribute('data-k',f.pboard);}
  }
};
