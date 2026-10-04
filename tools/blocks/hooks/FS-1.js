/* v21.31 the case: hooks. Out: the function and the summary statements, and the behaviors as this
   report defines them (used by the shell only when Form TB-1 is not open). In: an empty report takes
   the target behaviors from Form TB-1 as its targets; the picker adds more.
   (Sprint A4) The report's targets are the problem behaviors, each with its function. A replacement target defined on
   Form TB-1 is not taken as one of them, neither when the report opens nor from "From the case", where it is shown
   unticked and cannot be ticked: it reaches the report as the alternative behavior of the behaviors it replaces. */
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
const nbhFsIsRep=b=>!!(b&&(b.isRep||/replacement|alternative/i.test(b.type||'')));
function nbhFsRow(b){const r=newBeh();r.lab=b.label||'';r.def=b.def||'';r.dim=b.dim||'';r.base=b.base||b.rate||'';r.alt=b.rep||'';
  const re={escape:/escape/i,attention:/attention/i,tangible:/tangible/i,automatic:/automatic/i,unknown:/unknown/i}[b.fnKey||(window.nbhCase?window.nbhCase.fnKeyOf(b.fn):'')];
  r.fn=re?(FN.find(o=>re.test(o))||''):'';return r;}
window.__nbhFactsIn=function(f){
  const behs=(f.behaviors||[]).filter(b=>b.src!=='FS-1'&&(b.label||b.def)&&!nbhFsIsRep(b));if(!behs.length)return {filled:0};
  const blank=S.beh.every(b=>!b.lab&&!b.def);if(!blank)return {filled:0,note:'the report already names its targets; use the picker to add more'};
  S.beh=behs.map(nbhFsRow);S.cur=0;renderAll();return {filled:S.beh.length};
};
window.__nbhFactsPick=function(sel){let n=0,skip=0;
  sel.behaviors.forEach(b=>{if(nbhFsIsRep(b)){skip++;return;}const slot=S.beh.find(x=>!x.lab&&!x.def);const r=nbhFsRow(b);if(slot)Object.assign(slot,r);else S.beh.push(r);n++;});
  if(n){S.cur=S.beh.length-1;renderAll();}
  return {filled:n,note:skip?(skip===1?'a replacement behavior was':skip+' replacement behaviors were')+' left out: the report’s targets are problem behaviors, and a replacement is the alternative behavior of the one it replaces':''};
};
/* the picker opens on the button's own click; this runs after it, as the click reaches the document */
document.addEventListener('click',function(e){
  const b=e.target&&e.target.closest?e.target.closest('#nbhCaseBtn'):null;if(!b||!window.nbhCase)return;
  const list=(window.nbhCase.facts&&window.nbhCase.facts.behaviors)||[];
  document.querySelectorAll('#nbhcBody input[data-kind="beh"]').forEach(cb=>{if(cb.disabled||!nbhFsIsRep(list[+cb.dataset.i]))return;
    cb.checked=false;cb.disabled=true;
    const sp=cb.nextElementSibling,nm=sp&&sp.querySelector('b');
    if(sp){const s=document.createElement('small');s.className='nbhc-own';s.style.cssText='color:#16242e;font-weight:600';
      s.textContent='Not placed on this form: a replacement behavior, not a problem behavior with a function. It goes in as the alternative behavior of the behaviors it replaces.';
      sp.insertBefore(s,nm?nm.nextSibling:sp.firstChild);}});
});
