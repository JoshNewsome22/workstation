
/* v21.31 the case: hooks. An empty behavior table takes the target behaviors from Form TB-1, with
   their examples and non-examples as the plain-words "what counts"; the picker adds rows. */
const nbhHdRow=b=>({name:b.label||'',ex:b.ex||b.def||'',nex:b.nex||'',ms:'tally',todo:''});
window.__nbhFactsIn=function(f){
  const behs=f.behaviors||[];if(!behs.length||!S.bh.every(b=>!b.name))return {filled:0};
  S.bh=behs.slice(0,4).map(nbhHdRow);renderAll();return {filled:S.bh.length};
};
window.__nbhFactsPick=function(sel){
  let n=0;sel.behaviors.forEach(b=>{if(S.bh.some(x=>x.name===b.label))return;const slot=S.bh.find(x=>!x.name);if(slot)Object.assign(slot,nbhHdRow(b));else S.bh.push(nbhHdRow(b));n++;});
  sel.goals.acq.forEach(g=>{if(S.bh.some(x=>x.name===g.beh))return;S.bh.push({name:g.beh,ex:g.cond?'given '+g.cond:'',nex:'',ms:'yn',todo:''});n++;});
  if(n)renderAll();return {filled:n};
};
