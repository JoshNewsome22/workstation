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
