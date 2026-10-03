/* v21.31 the case: hooks. In: a record still holding the three example behaviors and no data takes the
   target behaviors from Form TB-1 (each paired replacement as a replacement row, the aim from Form
   GB-1's target level); the picker adds rows to a record already in use. */
function nbhDdAim(label,f){
  const red=(f&&f.goals&&f.goals.red)||[];const l=String(label||'').toLowerCase();
  const r=red.find(x=>x.beh&&(l.indexOf(x.beh.toLowerCase())>=0||x.beh.toLowerCase().indexOf(l)>=0));
  const m=r&&/^\s*(\d+(?:\.\d+)?)/.exec(r.tgt||'');return m?m[1]:'';
}
function nbhDdRow(kind,name,def,pairId,f){
  return {id:uid("b"),kind:kind,name:name||'',definition:def||'',obsLength:'Entire school day',measure:'count',
    direction:kind==='target'?'decrease':'increase',aim:kind==='target'?nbhDdAim(name,f):'',critDays:3,pairWith:pairId||'',color:PALETTE[S.behaviors.length%PALETTE.length]};
}
function nbhDdAfter(){
  S.rows.forEach(r=>{S.behaviors.forEach(b=>{if(!(b.id in r.values)){r.values[b.id]='';r.values[OPP(b.id)]='';}
    if(!r.intervals)r.intervals={};if(!r.intervals[b.id]){r.intervals[b.id]={};r.intervals[OPP(b.id)]={};}});});
  renderBehaviors();renderData();renderIntervalPanel();syncResultControls();renderResults();
}
window.__nbhFactsIn=function(f){
  const behs=f.behaviors||[];if(!behs.length)return {filled:0};
  const EX=['Physical aggression','Self-injury','Property destruction'];
  const untouched=!S.rows.length&&S.behaviors.every(b=>!b.definition&&!b.aim)&&S.behaviors.every(b=>b.kind==='target'&&EX.indexOf(b.name)>=0);
  if(!untouched)return {filled:0,note:'the behavior table is already in use; the picker adds rows to it'};
  S.behaviors=[];
  behs.filter(b=>!b.isRep).forEach(b=>S.behaviors.push(nbhDdRow('target',b.label,b.def,'',f)));
  behs.filter(b=>b.rep).forEach(b=>{const t=S.behaviors.find(x=>x.kind==='target'&&x.name===b.label);S.behaviors.push(nbhDdRow('replacement',b.rep,'',t?t.id:'',f));});
  behs.filter(b=>b.isRep).forEach(b=>S.behaviors.push(nbhDdRow('replacement',b.label,b.def,'',f)));
  nbhDdAfter();return {filled:S.behaviors.length};
};
window.__nbhFactsPick=function(sel){
  let n=0;const f=sel.facts||{};
  sel.behaviors.forEach(b=>{if(S.behaviors.some(x=>x.name===b.label))return;S.behaviors.push(nbhDdRow(b.isRep?'replacement':'target',b.label,b.def,'',f));n++;
    if(b.rep&&!S.behaviors.some(x=>x.name===b.rep)){const t=S.behaviors[S.behaviors.length-1];S.behaviors.push(nbhDdRow('replacement',b.rep,'',t.id,f));n++;}});
  sel.goals.acq.forEach(a=>{if(S.behaviors.some(x=>x.name===a.beh))return;S.behaviors.push(nbhDdRow('acquisition',a.beh,a.cond?'Given '+a.cond:'','',f));n++;});
  if(n)nbhDdAfter();return {filled:n};
};
