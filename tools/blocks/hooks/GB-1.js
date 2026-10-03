/* v21.31 the case: hooks. Out: the objectives as written, each with its sentence. In: empty reduction
   objectives take the target behaviors from Form TB-1 (and an acquisition objective each paired
   replacement); the picker adds objectives for the behaviors ticked. */
window.__nbhFactsOut=function(){
  const strip=h=>String(h).replace(/<[^>]+>/g,'').replace(/&ldquo;|&rdquo;/g,'"').replace(/&amp;/g,'&');
  const red=$$('#redWrap .card').map(c=>idxOf(c,'red')).map(i=>{const g=n=>val('red['+i+'].'+n);if(!g('beh'))return null;
    return {i,beh:g('beh'),dir:g('dir'),meas:g('meas'),cur:g('cur'),ml:g('ml'),tgt:g('tgt'),ctx:g('ctx'),crit:g('crit'),meth:g('meth'),date:g('date'),pair:g('pair'),text:strip(redSentence(i)),src:'GB-1'};}).filter(Boolean);
  const acq=$$('#acqWrap .card').map(c=>idxOf(c,'acq')).map(i=>{const g=n=>val('acq['+i+'].'+n);if(!g('beh'))return null;
    return {i,beh:g('beh'),cond:g('cond'),crit:g('crit'),n:g('n'),unit:g('unit'),meth:g('meth'),date:g('date'),pair:g('pair'),text:strip(acqSentence(i)),src:'GB-1'};}).filter(Boolean);
  return red.length||acq.length?{goals:{red,acq}}:null;
};
function nbhGbPlace(kind,fill){
  const wrap=kind==='red'?'#redWrap':'#acqWrap',add=kind==='red'?addRed:addAcq;
  let cards=$$(wrap+' .card').map(c=>idxOf(c,kind));
  let i=cards.find(k=>!val(kind+'['+k+'].beh'));
  if(i==null){add();cards=$$(wrap+' .card').map(c=>idxOf(c,kind));i=cards[cards.length-1];}
  if(i==null)return false;fill(n=>kind+'['+i+'].'+n);return true;
}
window.__nbhFactsIn=function(f){
  let n=0;const behs=f.behaviors||[];
  /* only when no objective names a behavior yet: a half-written sheet is left as it is */
  const anyRed=$$('#redWrap .card').some(c=>val('red['+idxOf(c,'red')+'].beh'));
  if(behs.length&&!anyRed){
    behs.filter(b=>!b.isRep).forEach(b=>{if(nbhGbPlace('red',k=>{setv(k('beh'),b.label);if(b.base||b.rate)setv(k('cur'),b.base||b.rate);if(b.rep)setv(k('pair'),b.rep);if(b.ctx)setv(k('ctx'),b.ctx);}))n++;});
    const anyAcq=$$('#acqWrap .card').some(c=>val('acq['+idxOf(c,'acq')+'].beh'));
    if(!anyAcq){behs.filter(b=>b.rep).forEach(b=>{if(nbhGbPlace('acq',k=>{setv(k('beh'),b.rep);setv(k('pair'),b.label);}))n++;});
      behs.filter(b=>b.isRep).forEach(b=>{if(nbhGbPlace('acq',k=>{setv(k('beh'),b.label);if(b.ctx)setv(k('cond'),b.ctx);}))n++;});}
  }
  if(f.fn&&window.nbhCase){const e=$('[name="m.fn"]');if(e&&window.nbhCase.put(e,e.tagName==='SELECT'?(f.fn.key||f.fn.label):f.fn.label,false))n++;}
  if(n)render();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  let n=0;
  sel.behaviors.forEach(b=>{
    if(b.isRep){if(nbhGbPlace('acq',k=>{setv(k('beh'),b.label);if(b.ctx)setv(k('cond'),b.ctx);}))n++;return;}
    if(nbhGbPlace('red',k=>{setv(k('beh'),b.label);if(b.base||b.rate)setv(k('cur'),b.base||b.rate);if(b.rep)setv(k('pair'),b.rep);if(b.ctx)setv(k('ctx'),b.ctx);}))n++;
    if(b.rep&&nbhGbPlace('acq',k=>{setv(k('beh'),b.rep);setv(k('pair'),b.label);}))n++;});
  if(sel.fn&&window.nbhCase){const e=$('[name="m.fn"]');if(e&&window.nbhCase.put(e,e.tagName==='SELECT'?(sel.fn.key||sel.fn.label):sel.fn.label,true))n++;}
  render();return {filled:n};
};
