/* EA-1: the session room. The placemat, the leisure items, the magazine, the helmet and floor mat,
   the partition window and the board are in the engine's room; this module names the scene and adds
   the open door of the supervised alone condition (the enhancement sprint, B2): a frame with
   openDoor:true shows a doorway in the back wall standing open, drawn behind the people and the table.
   walkOut:true draws the student standing and walking to that door, both feet on the floor; stepIn:true
   sets the therapist beside the student, clear of the doorway, with an open hand between the student's
   hand and head (the pose blockOpen): a block, not a hold. */
const EXT={
  alt:'The session room: the therapist, the student and the data collector',
  poseA:{blockOpen:[206,118,236,96]},
  svgBack(){return '<g class="ea-door" transform="translate(330 0)" style="display:none">'+
    '<polygon points="-8,286 72,286 54,256 10,256" fill="#ffffff" opacity=".45"/>'+
    '<rect x="0" y="62" width="64" height="194" fill="#fbf7ea"/><path d="M0 220 L64 220 L64 256 L0 256 Z" fill="#efe6cf"/>'+
    '<rect x="-6" y="56" width="76" height="200" fill="none" stroke="#b9c5c1" stroke-width="6"/>'+
    '<polygon points="0,62 -24,72 -24,266 0,256" fill="#c8b48c"/><polygon points="0,62 -24,72 -24,76 0,66" fill="#b39e75"/>'+
    '<circle cx="-18" cy="166" r="3" fill="#555"/></g>';},
  refs(el,q){el.eaDoor=q('.ea-door');const back=q('.abcw');if(el.eaDoor&&back)back.parentNode.insertBefore(el.eaDoor,back);},
  target(f,t){
    /* standing, a step from the door: the hands hang at the sides */
    if(f.walkOut){t.sdx=-118;t.sdy=-26;t.sHx=556;t.sHy=232;t.fHx=590;t.fHy=230;t.sGaze=0;t.sTilt=0;}
    if(f.stepIn)t.adx=330;
  },
  discrete(f,el,show){show(el.eaDoor,!!f.openDoor);el.eaWalk=!!f.walkOut;},
  /* the stride: the near leg forward toward the door, the far leg behind, the shoes and the shadow on the floor
     (the figure is lifted 26 to stand, so the floor is at 284 in its own space) */
  draw(c,el){const S=el.S;if(!S||!S.legN)return;
    if(el.eaWalk){
      S.legN.setAttribute('d',limb(566,204,552,244,19,15)+' '+limb(552,244,540,280,14,10));
      S.legF.setAttribute('d',limb(578,206,586,244,17,13)+' '+limb(586,244,598,278,12,9));
      S.shoeN.setAttribute('d','M550 284 q-2 -10 -18 -9 l-4 9 z');S.shoeF.setAttribute('d','M608 282 q-2 -10 -18 -9 l-4 9 z');
      if(S.shadow){S.shadow.setAttribute('cy','284');S.shadow.setAttribute('cx','572');}
    }else if(S.shadow&&S.shadow.getAttribute('cy')!=='258'){S.shadow.setAttribute('cy','258');S.shadow.setAttribute('cx','538');}}
};
