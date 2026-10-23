/* ---------------- the view: leaving it pauses, entering it builds from the record's setup ---------------- */
let building=false;
function openWalk(){if(building)return;building=true;try{if(!B||B.dirty||B.key!==stateKey())build();}catch(e){console.error('Walkthrough: '+(e&&e.message||e));}finally{building=false;}fit();ui();reveal();}
$('#viewSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(!b)return;
  if(b.dataset.view==='walk')openWalk();else{if(want||playing)pause();if(isFs()&&dom()&&dom().player.classList.contains('wk-fs'))panel(false);}});
/* the record's marking setup can change while the view is open (Tools, Open data, the case): the walkthrough follows it */
{const render0=render;render=function(){const r=render0.apply(this,arguments);if(composing||building)return r;
  try{if(B&&B.key!==stateKey()){B.dirty=true;if(document.body.classList.contains('view-walk'))openWalk();}}catch(e){}return r;};}
window.TKWALK={build,renderAt,play,pause,seek,toggle,
  get duration(){return B?B.D:0;},get cues(){return cuesOut();},get chapters(){return chapsOut();},
  get time(){return clock();},get unmeasured(){const L=audioLines()||{};return Object.keys(L).filter(id=>!MK[id]||MK[id].h!==hash(String(L[id].t||'')));},get playing(){return playing;},get audioMode(){return AU.mode;},get reduced(){return reduced();},
  get stage(){const D=dom();return D&&D.stage;}};
})();
