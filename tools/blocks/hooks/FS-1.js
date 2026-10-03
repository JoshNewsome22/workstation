/* v21.31 the case: hooks. Out: the function and the summary statements, and the behaviors as this
   report defines them (used by the shell only when Form TB-1 is not open). In: an empty report takes
   the target behaviors from Form TB-1 as its targets; the picker adds more. */
window.__nbhFactsOut=function(){
  const key=s=>window.nbhCase?window.nbhCase.fnKeyOf(s):'';
  const behs=S.beh.filter(b=>b.lab||b.def).map(b=>({label:b.lab,def:b.def,fn:b.fn,fnKey:key(b.fn),dim:b.dim,base:b.base,se:b.se,ant:b.ant,cons:b.cons,
    alt:b.alt,altCons:b.altCons,desired:b.desired,rep:b.alt,statement:stmtText(b),src:'FS-1'}));
  const fnTxt=S.meta.fn||(behs[0]&&behs[0].fn)||'';
  const out={};
  if(fnTxt)out.fn={key:key(fnTxt),label:fnTxt,statements:behs.map(b=>b.statement).filter(Boolean),
    perBehavior:behs.map(b=>({label:b.label,fn:b.fn,fnKey:b.fnKey,statement:b.statement,alt:b.alt}))};
  if(behs.length)out.behaviorsFS=behs;
  return Object.keys(out).length?out:null;
};
function nbhFsRow(b){const r=newBeh();r.lab=b.label||'';r.def=b.def||'';r.dim=b.dim||'';r.base=b.base||b.rate||'';r.alt=b.rep||'';
  const re={escape:/escape/i,attention:/attention/i,tangible:/tangible/i,automatic:/automatic/i,unknown:/unknown/i}[b.fnKey||(window.nbhCase?window.nbhCase.fnKeyOf(b.fn):'')];
  r.fn=re?(FN.find(o=>re.test(o))||''):'';return r;}
window.__nbhFactsIn=function(f){
  const behs=(f.behaviors||[]).filter(b=>b.src!=='FS-1'&&(b.label||b.def));if(!behs.length)return {filled:0};
  const blank=S.beh.every(b=>!b.lab&&!b.def);if(!blank)return {filled:0,note:'the report already names its targets; use the picker to add more'};
  S.beh=behs.map(nbhFsRow);S.cur=0;renderAll();return {filled:S.beh.length};
};
window.__nbhFactsPick=function(sel){let n=0;
  sel.behaviors.forEach(b=>{const slot=S.beh.find(x=>!x.lab&&!x.def);const r=nbhFsRow(b);if(slot)Object.assign(slot,r);else S.beh.push(r);n++;});
  if(n){S.cur=S.beh.length-1;renderAll();}return {filled:n};
};
