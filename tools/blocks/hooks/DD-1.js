/* v21.31 the case: hooks. In: a record still holding the three example behaviors and no data takes the
   target behaviors from Form TB-1 (each paired replacement as a replacement row, the aim from Form
   GB-1's target level); the picker adds rows to a record already in use.
   (Sprint A4) One row per replacement skill. A skill that several behaviors share is one replacement row, paired with
   the first behavior it replaces (a row pairs with one behavior), and a replacement target defined on Form TB-1 under
   that name gives the row its definition instead of making a second row.
   The criterion is Form GB-1's. The objective that names a row's behavior (a reduction objective for a target, an
   acquisition objective for a replacement or a skill) gives its number of consecutive measurements as the days at
   criterion (not a fixed 3), and its level as the aim. An aim goes only into a measure that holds it: a row made here
   takes the measure the objective is written in (a rate per minute becomes a rate per hour, so 0.2 per minute is an
   aim of 12; "80% of opportunities" a percentage), and a row already in use keeps its measure and gets no aim it
   cannot hold. In a record already in use the objective's days and aim take the place of the form's own values only
   (the 3 a row starts with, a blank aim, or what was carried here before, so a changed objective is followed), and an
   aim comes only from an objective that states both its level and its days; a value typed here is kept. A ticked
   objective under "From the case" puts its criterion on the row that names its behavior, or on a new row. */
const nbhDdK=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[‘’ʼ]/g,"'").replace(/[‐-―]/g,'-').replace(/\s+/g,' ').replace(/[\s.;:,!]+$/,'').trim();
const nbhDdIsRep=b=>!!(b&&(b.isRep||/replacement|alternative/i.test(b.type||'')));
/* how closely two names agree: 0 the same, 1 one begins the other, 2 one inside the other (whole words), -1 not at all */
function nbhDdTier(a,b){
  const x=nbhDdK(a),y=nbhDdK(b);if(!x||!y)return -1;if(x===y)return 0;
  const at=(h,w)=>{const i=h.indexOf(w);return i<0?-1:(/[a-z0-9]/.test(h.charAt(i-1))||/[a-z0-9]/.test(h.charAt(i+w.length))?-1:i);};
  const i=at(x,y),j=at(y,x);if(i===0||j===0)return 1;return i>0||j>0?2:-1;
}
function nbhDdBest(list,name,nameOf){let best=null,bt=9;(list||[]).forEach(o=>{const t=nbhDdTier(nameOf(o),name);if(t>=0&&t<bt){bt=t;best=o;}});return best;}
function nbhDdGoalFor(r,f){const g=(f&&f.goals)||{};return nbhDdBest(r.kind==='target'?g.red:g.acq,r.name,o=>o&&o.beh);}
/* an objective's level, as the aim each DD-1 measure that holds it would take ({fits:{measure:aim}}; fits null: a plain
   number, held by the row's own measure, as before), and the measure a new row takes (first) */
function nbhDdLevel(g,red){
  const txt=String((red?g.tgt:g.crit)||''),meas=red?String(g.meas||''):'',m=/(\d+(?:\.\d+)?)/.exec(txt);if(!m)return null;
  if(red&&/^increase$/i.test(String(g.dir||'').trim()))return null;   /* a rise (a latency): DD-1's target rows count a fall */
  const pc=/(\d+(?:\.\d+)?)\s*(?:%|percent)/i.exec(txt),of=/(\d+(?:\.\d+)?)\s*(?:of|out of|\/)\s*(\d+(?:\.\d+)?)/i.exec(txt);
  /* the unit the level's own words give, else the objective's response measure */
  let v=+m[1],u=/per\s*min|\/\s*min\b|a minute|each minute/i.test(txt)?'perMin':/per\s*h(ou)?r|\/\s*h(ou)?r\b|an hour|each hour/i.test(txt)?'hour':'';
  if(!u&&pc){v=+pc[1];u='pct';}
  else if(!u&&of&&+of[2]>0&&+of[1]<=+of[2]){v=100*of[1]/of[2];u='pct';}
  else if(!u)u=/\bsec(ond)?s?\b/i.test(txt)?'sec':/\bmin(ute)?s?\b/i.test(txt)?'min':'';
  const mu=/per minute/i.test(meas)?'perMin':/per hour/i.test(meas)?'hour':/per school day/i.test(meas)?'day':/duration/i.test(meas)?'min':
    /interval/i.test(meas)?'pctInt':/latency|second/i.test(meas)?'sec':'';
  if(!u)u=mu;else if(u==='pct'&&mu==='pctInt')u='pctInt';
  const r3=x=>Math.round(x*1000)/1000,INT=['interval','mts','pint','wint'];
  const is=(ms,k,first)=>{const o={};ms.forEach(x=>o[x]=r3(v*(k||1)));return {fits:o,first:first===undefined?ms[0]:first};};
  switch(u){
    case 'perMin':return is(['rate'],60);
    case 'hour':return is(['rate']);
    case 'day':return is(['count']);
    case 'min':return is(['duration']);
    case 'sec':return null;   /* seconds to a response: not carried */
    case 'pctInt':return is(INT);
    case 'pct':return /interval/i.test(txt)?is(INT):/\btime\b/i.test(txt)?is(['pdur']):
      red?is(INT.concat('pdur'),1,''):is(/independen/i.test(txt)?['trials','opps']:['opps','trials']);   /* a reduction percentage of what is not said: no new measure */
  }
  return {fits:null,v:r3(v),first:''};   /* a plain number */
}
function nbhDdDays(g,red){
  const m=/(\d+)/.exec(String((red?g.crit:g.n)||''));if(!m)return 0;
  if(!red&&/week|opportunit/i.test(String(g.unit||'')))return 0;   /* DD-1 counts days with data */
  const d=+m[1];return d>=1&&d<=100?d:0;
}
/* the objective's criterion on a row. how: 'new' (a row made here, which takes the objective's measure), 'fill' (a row in
   use), 'pick' (ticked under From the case: its days and aim replace the row's; the measure stays). Returns the fields changed. */
function nbhDdCrit(r,g,how,notes){
  if(!g)return 0;const red=r.kind==='target',L=nbhDdLevel(g,red),d=nbhDdDays(g,red);let n=0;
  /* the form's own value: blank, or a number it set itself (what is typed here is text) */
  const own=v=>v===''||v==null||typeof v==='number';
  if(d&&String(r.critDays)!==String(d)&&(how!=='fill'||own(r.critDays))){r.critDays=d;n++;}
  if(L&&(how!=='fill'||(own(r.aim)&&d))){
    if(how==='new'&&L.fits&&L.first&&!(r.measure in L.fits))r.measure=L.first;
    const v=L.fits?L.fits[r.measure]:L.v;
    if(v==null){if(notes)notes.push(r.name+': the aim is left as it was, since the objective’s level ('+String(red?g.tgt:g.crit).trim()+') does not fit the row’s measure, '+MEASURES[r.measure].label);}
    else if(String(r.aim)!==String(v)){r.aim=v;n++;}
  }
  return n;
}
function nbhDdRow(kind,name,def,pairId,f){
  const r={id:uid("b"),kind:kind,name:name||'',definition:def||'',obsLength:'Entire school day',measure:'count',
    direction:kind==='target'?'decrease':'increase',aim:'',critDays:3,pairWith:pairId||'',color:PALETTE[S.behaviors.length%PALETTE.length]};
  nbhDdCrit(r,nbhDdGoalFor(r,f),'new');return r;
}
function nbhDdAfter(){
  S.rows.forEach(r=>{S.behaviors.forEach(b=>{if(!(b.id in r.values)){r.values[b.id]='';r.values[OPP(b.id)]='';}
    if(!r.intervals)r.intervals={};if(!r.intervals[b.id]){r.intervals[b.id]={};r.intervals[OPP(b.id)]={};}});});
  renderBehaviors();renderData();renderIntervalPanel();syncResultControls();renderResults();
}
window.__nbhFactsIn=function(f){
  const behs=f.behaviors||[];
  const EX=['Physical aggression','Self-injury','Property destruction'];
  const untouched=!S.rows.length&&S.behaviors.every(b=>!b.definition&&!b.aim)&&S.behaviors.every(b=>b.kind==='target'&&EX.indexOf(b.name)>=0);
  if(untouched){
    if(!behs.length)return {filled:0};
    S.behaviors=[];
    const tg=behs.filter(b=>!nbhDdIsRep(b)),rows=tg.map(b=>{const r=nbhDdRow('target',b.label,b.def,'',f);S.behaviors.push(r);return r;});
    /* one replacement row per skill, in the order of the behaviors they replace and paired with the first; then the
       replacement targets no behavior names; a defined target under a skill's name gives that row its definition */
    const skills=[];
    tg.forEach((b,i)=>{const k=nbhDdK(b.rep);if(k&&!skills.some(s=>s.k===k))skills.push({k,name:b.rep,def:'',pair:rows[i].id});});
    behs.filter(nbhDdIsRep).forEach(b=>{const k=nbhDdK(b.label);if(!k)return;const s=skills.find(x=>x.k===k);if(s){if(!s.def)s.def=b.def||'';}else skills.push({k,name:b.label,def:b.def||'',pair:''});});
    skills.forEach(s=>S.behaviors.push(nbhDdRow('replacement',s.name,s.def,s.pair,f)));
    nbhDdAfter();return {filled:S.behaviors.length};
  }
  /* a record in use: the objectives' criteria reach the rows that name their behaviors, and the form says which */
  let n=0;const got=[];S.behaviors.forEach(r=>{const k=nbhDdCrit(r,nbhDdGoalFor(r,f),'fill');if(k){n+=k;got.push(r.name);}});
  if(n){nbhDdAfter();const msg='Form GB-1’s criterion is now on '+got.join(', ');toast(msg+'.');return {filled:n,note:msg};}
  return behs.length?{filled:0,note:'the behavior table is already in use; the picker adds rows to it'}:{filled:0};
};
window.__nbhFactsPick=function(sel){
  let n=0;const f=sel.facts||{},notes=[];
  const named=name=>{const k=nbhDdK(name);return k?S.behaviors.find(x=>nbhDdK(x.name)===k):null;};
  sel.behaviors.forEach(b=>{
    const rep=nbhDdIsRep(b),had=named(b.label);
    if(had){if(rep&&b.def&&!had.definition){had.definition=b.def;n++;}return;}
    const r=nbhDdRow(rep?'replacement':'target',b.label,b.def,'',f);S.behaviors.push(r);n++;
    if(!rep&&b.rep&&!named(b.rep)){S.behaviors.push(nbhDdRow('replacement',b.rep,'',r.id,f));n++;}});
  /* a ticked objective: its criterion goes onto the row that names its behavior, or onto a new row */
  const goal=(g,red)=>{if(!g||!g.beh)return;
    const r=nbhDdBest(S.behaviors.filter(x=>(x.kind==='target')===red),g.beh,x=>x.name);
    if(r){n+=nbhDdCrit(r,g,'pick',notes);return;}
    S.behaviors.push(nbhDdRow(red?'target':'acquisition',g.beh,red||!g.cond?'':'Given '+g.cond,'',{goals:red?{red:[g]}:{acq:[g]}}));n++;};
  (sel.goals.red||[]).forEach(g=>goal(g,true));
  (sel.goals.acq||[]).forEach(g=>goal(g,false));
  if(n)nbhDdAfter();return {filled:n,note:notes.join('; ')};
};
