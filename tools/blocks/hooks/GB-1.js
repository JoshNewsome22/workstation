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
/* v21.44 (A5) one skill objective per replacement skill. A paired replacement is named without its staff notes
   ("(see target 4)", "(see Forms EA-1 and TD-1)": gbClean); one that points to a replacement target defined on TB-1
   ("see target 4"), or reads exactly as one that does, takes that target's name; a replacement target's name drops
   "(replacement)". The behaviors whose replacements then read the same (gbKey) share one acquisition objective,
   which names every behavior it replaces; wording that only means the same thing is not merged. A case in which TB-1
   already passes the cleaned names gives the same objectives. all: every behavior in the case (a "see target N"
   counts in it); list: the ones to place (the ticked ones, for the picker). Groups: the paired replacements first, in
   the order of their behaviors, then the replacement targets that pair with nothing. */
function nbhGbSkills(all,list){
  all=all||[];list=list||all;
  const pointed=rep=>{const m=/\bsee\s+target\s+(\d+)\b/i.exec(String(rep||''));const t=m&&all[+m[1]-1];return t&&t.isRep&&t.label?gbClean(t.label):'';};
  const alias={},named={};
  all.forEach(b=>{if(b.isRep&&b.label)named[gbKey(b.label)]=gbClean(b.label);else if(b.rep){const p=pointed(b.rep);if(p)alias[gbKey(b.rep)]=p;}});
  const skillOf=rep=>pointed(rep)||alias[gbKey(rep)]||named[gbKey(rep)]||gbClean(rep);
  const groups=[],by={};
  const group=name=>{const k=gbKey(name);if(!by[k]){by[k]={name,key:k,pairs:[],cond:''};groups.push(by[k]);}return by[k];};
  list.forEach(b=>{if(!b.isRep&&b.rep){const g=group(skillOf(b.rep));if(b.label&&g.pairs.indexOf(b.label)<0)g.pairs.push(b.label);}});
  list.forEach(b=>{if(b.isRep&&b.label){const g=group(gbClean(b.label));if(!g.cond&&b.ctx)g.cond=b.ctx;}});
  return {groups,skillOf};
}
window.__nbhFactsIn=function(f){
  let n=0;const behs=f.behaviors||[];
  /* only when no objective names a behavior yet: a half-written sheet is left as it is */
  const anyRed=$$('#redWrap .card').some(c=>val('red['+idxOf(c,'red')+'].beh'));
  if(behs.length&&!anyRed){
    const K=nbhGbSkills(behs);
    behs.filter(b=>!b.isRep).forEach(b=>{if(nbhGbPlace('red',k=>{setv(k('beh'),b.label);if(b.base||b.rate)setv(k('cur'),b.base||b.rate);if(b.rep)setv(k('pair'),K.skillOf(b.rep));if(b.ctx)setv(k('ctx'),b.ctx);}))n++;});
    const anyAcq=$$('#acqWrap .card').some(c=>val('acq['+idxOf(c,'acq')+'].beh'));
    if(!anyAcq)K.groups.forEach(g=>{if(nbhGbPlace('acq',k=>{setv(k('beh'),g.name);if(g.pairs.length)setv(k('pair'),g.pairs.join('; '));if(g.cond)setv(k('cond'),g.cond);}))n++;});
  }
  if(f.fn&&window.nbhCase){const e=$('[name="m.fn"]');if(e&&window.nbhCase.put(e,e.tagName==='SELECT'?(f.fn.key||f.fn.label):f.fn.label,false))n++;}
  if(n)render();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  let n=0;const all=(sel.facts&&sel.facts.behaviors)||sel.behaviors,K=nbhGbSkills(all,sel.behaviors);
  sel.behaviors.forEach(b=>{if(b.isRep)return;
    if(nbhGbPlace('red',k=>{setv(k('beh'),b.label);if(b.base||b.rate)setv(k('cur'),b.base||b.rate);if(b.rep)setv(k('pair'),K.skillOf(b.rep));if(b.ctx)setv(k('ctx'),b.ctx);}))n++;});
  /* a skill that already has its objective on the form gets no second one; only its empty fields are filled */
  K.groups.forEach(g=>{
    const have=$$('#acqWrap .card').map(c=>idxOf(c,'acq')).filter(i=>gbKey(val('acq['+i+'].beh'))===g.key)[0];
    if(have!=null){const k=x=>'acq['+have+'].'+x;let put=false;
      if(g.pairs.length&&!val(k('pair'))){setv(k('pair'),g.pairs.join('; '));put=true;}
      if(g.cond&&!val(k('cond'))){setv(k('cond'),g.cond);put=true;}
      if(put)n++;return;}
    if(nbhGbPlace('acq',k=>{setv(k('beh'),g.name);if(g.pairs.length)setv(k('pair'),g.pairs.join('; '));if(g.cond)setv(k('cond'),g.cond);}))n++;});
  if(sel.fn&&window.nbhCase){const e=$('[name="m.fn"]');if(e&&window.nbhCase.put(e,e.tagName==='SELECT'?(sel.fn.key||sel.fn.label):sel.fn.label,true))n++;}
  render();return {filled:n};
};
