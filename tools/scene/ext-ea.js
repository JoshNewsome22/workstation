/* EA-1: the session room. The placemat, the leisure items, the magazine, the helmet and floor mat,
   the partition window and the board are in the engine's room; this module names the scene and adds
   the open door of the supervised alone condition (the enhancement sprint, B2): a frame with
   openDoor:true shows a doorway in the back wall standing open, drawn behind the people and the table.
   walkOut:true draws the student standing and walking to that door, both feet on the floor; stepIn:true
   has the therapist get up and stand beside the student, clear of the doorway, with an open hand between
   the student's hand and head (the pose blockOpen): a block, not a hold. */
const EXT={
  alt:'The session room: the therapist, the student and the data collector',
  /* the hand in the therapist's own space, which stands 26 higher for stepIn: on screen it is at 566, 96,
     between the student's raised hand and the helmet */
  poseA:{blockOpen:[206,140,236,122]},
  svgBack(){return '<g class="ea-door" transform="translate(330 0)" style="display:none">'+
    '<polygon points="-8,286 72,286 54,256 10,256" fill="#ffffff" opacity=".45"/>'+
    '<rect x="0" y="62" width="64" height="194" fill="#fbf7ea"/><path d="M0 220 L64 220 L64 256 L0 256 Z" fill="#efe6cf"/>'+
    '<rect x="-6" y="56" width="76" height="200" fill="none" stroke="#b9c5c1" stroke-width="6"/>'+
    '<polygon points="0,62 -24,72 -24,266 0,256" fill="#c8b48c"/><polygon points="0,62 -24,72 -24,76 0,66" fill="#b39e75"/>'+
    '<circle cx="-18" cy="166" r="3" fill="#555"/></g>';},
  /* the door goes behind the people; each seated figure gets a round knee. A limb's ends are cut in a half circle,
     so where the thigh meets the shin the room shows through; the table hides that, and the supervised alone frames
     have no table */
  refs(el,q){el.eaDoor=q('.ea-door');const back=q('.abcw');if(el.eaDoor&&back)back.parentNode.insertBefore(el.eaDoor,back);
    [[el.A,9.5],[el.S,7.5]].forEach(([F,r])=>{if(!F||!F.legN)return;const k=F.legN.ownerDocument.createElementNS('http://www.w3.org/2000/svg','circle');
      k.setAttribute('class','leg near ea-knee');k.setAttribute('r',String(r));F.legN.parentNode.insertBefore(k,F.legN.nextSibling);F.eaKnee=k;});},
  target(f,t){
    /* standing, a step from the door: the arms hang nearly straight at the sides */
    if(f.walkOut){t.sdx=-118;t.sdy=-26;t.sHx=560;t.sHy=240;t.fHx=592;t.fHy=244;t.sGaze=0;t.sTilt=0;}
    if(f.stepIn)t.adx=330;
  },
  discrete(f,el,show){show(el.eaDoor,!!f.openDoor);el.eaWalk=!!f.walkOut;el.eaStand=!!f.stepIn;},
  /* the stride: the near leg forward toward the door, the far leg behind, the shoes and the shadow on the floor
     (the figure is lifted 26 to stand, so the floor is at 284 in its own space). The therapist standing (stepIn):
     lifted 26 the same way, both legs straight down to the floor, the far arm out of sight behind the body. A
     straight leg is one limb from hip to foot, with no knee; both ends sit inside the body and the shoe, which
     cover the half circles cut out of a limb's ends */
  draw(c,el){const S=el.S,A=el.A;if(!S||!S.legN)return;
    const knee=(F,x,y)=>{if(!F.eaKnee)return;F.eaKnee.style.display=x==null?'none':'';if(x!=null){F.eaKnee.setAttribute('cx',String(x));F.eaKnee.setAttribute('cy',String(y));}};
    if(el.eaWalk){
      S.legN.setAttribute('d',limb(566,204,540,282,19,10));
      S.legF.setAttribute('d',limb(578,206,598,280,17,9));
      S.shoeN.setAttribute('d','M550 284 q-2 -10 -18 -9 l-4 9 z');S.shoeF.setAttribute('d','M608 282 q-2 -10 -18 -9 l-4 9 z');
      if(S.shadow){S.shadow.setAttribute('cy','284');S.shadow.setAttribute('cx','572');}
      knee(S,null);
    }else{if(S.shadow&&S.shadow.getAttribute('cy')!=='258'){S.shadow.setAttribute('cy','258');S.shadow.setAttribute('cx','538');}
      /* the engine's own standing legs bend at 234 */
      const g=FIG.student;if(el.standS)knee(S,g.hip.x-g.face*4,234);else knee(S,g.knee.x,g.knee.y);}
    if(!A||!A.legN||!el.adultAt)return;
    const farA=A.upperF&&A.upperF.parentNode;
    if(el.eaStand){
      el.adultAt.setAttribute('transform',el.adultAt.getAttribute('transform')+' translate(0 -26)');
      A.legN.setAttribute('d',limb(124,190,128,282,23,12));
      A.legF.setAttribute('d',limb(112,192,108,281,21,11));
      A.shoeN.setAttribute('d','M120 284 q2 -10 18 -9 l4 9 z');A.shoeF.setAttribute('d','M100 282 q2 -10 18 -9 l4 9 z');
      /* seen side-on, the far arm hangs behind the body */
      if(farA)farA.style.display='none';
      if(A.shadow){A.shadow.setAttribute('cy','284');A.shadow.setAttribute('cx','120');}
      knee(A,null);
    }else{if(farA&&farA.style.display)farA.style.display='';
      if(A.shadow&&A.shadow.getAttribute('cy')!=='258'){A.shadow.setAttribute('cy','258');A.shadow.setAttribute('cx','154');}
      knee(A,FIG.adult.knee.x,FIG.adult.knee.y);}}
};
