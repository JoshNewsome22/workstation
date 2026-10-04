/* EA-1: the session room. The placemat, the leisure items, the magazine, the helmet and floor mat,
   the partition window and the board are in the engine's room; this module names the scene and adds
   the open door of the supervised alone condition (the enhancement sprint, B2): a frame with
   openDoor:true shows a doorway in the back wall standing open, drawn behind the people and the table. */
const EXT={
  alt:'The session room: the therapist, the student and the data collector',
  svgBack(){return '<g class="ea-door" transform="translate(330 0)" style="display:none">'+
    '<polygon points="-8,286 72,286 54,256 10,256" fill="#ffffff" opacity=".45"/>'+
    '<rect x="0" y="62" width="64" height="194" fill="#fbf7ea"/><path d="M0 220 L64 220 L64 256 L0 256 Z" fill="#efe6cf"/>'+
    '<rect x="-6" y="56" width="76" height="200" fill="none" stroke="#b9c5c1" stroke-width="6"/>'+
    '<polygon points="0,62 -24,72 -24,266 0,256" fill="#c8b48c"/><polygon points="0,62 -24,72 -24,76 0,66" fill="#b39e75"/>'+
    '<circle cx="-18" cy="166" r="3" fill="#555"/></g>';},
  refs(el,q){el.eaDoor=q('.ea-door');const back=q('.abcw');if(el.eaDoor&&back)back.parentNode.insertBefore(el.eaDoor,back);},
  discrete(f,el,show){show(el.eaDoor,!!f.openDoor);}
};
