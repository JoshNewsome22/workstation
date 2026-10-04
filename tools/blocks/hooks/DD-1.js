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
   objective under "From the case" puts its criterion on the row that names its behavior, or on a new row.
   Which objective goes on which row (nbhDdMatch): each row takes one objective, and an objective goes to one row, the
   closest: the same name first, then a name that begins with the other, then (only for a row made here from the case)
   a name inside the other as whole words. A row already in use takes only the same name or one that begins with the
   other, so a row typed "Hitting" never takes the objective for "Self-injury – head hitting". Among objectives as
   close, the one whose pairing names the row's partner (the behavior a replacement replaces, a target's replacement)
   comes first. An objective that states neither a level nor a number of days has no criterion to give and is passed
   over, so a skill's criterion written on any of its objectives reaches the row. Rows that carry exactly an
   objective's name all take it (an older record can hold one skill twice, paired with two behaviors).
   When the case changes a row already in use, a note at the top of the form says which rows and what changed, and
   stays until it is dismissed: the workstation opens a case with the form's messages held back, and a form not in
   view shows none. The note is not part of the record and does not print. */
const nbhDdK=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[‘’ʼ]/g,"'").replace(/[‐-―]/g,'-').replace(/\s+/g,' ').replace(/[\s.;:,!]+$/,'').trim();
const nbhDdIsRep=b=>!!(b&&(b.isRep||/replacement|alternative/i.test(b.type||'')));
/* how closely two names agree: 0 the same, 1 one begins the other, 2 one inside the other (whole words), -1 not at all */
function nbhDdTier(a,b){
  const x=nbhDdK(a),y=nbhDdK(b);if(!x||!y)return -1;if(x===y)return 0;
  const at=(h,w)=>{const i=h.indexOf(w);return i<0?-1:(/[a-z0-9]/.test(h.charAt(i-1))||/[a-z0-9]/.test(h.charAt(i+w.length))?-1:i);};
  const i=at(x,y),j=at(y,x);if(i===0||j===0)return 1;return i>0||j>0?2:-1;
}
/* the behaviors a row goes with: a replacement's or a skill's paired behavior, or the rows paired with a target */
function nbhDdPartners(r){
  return S.behaviors.filter(x=>r.kind==='target'?x.pairWith===r.id:x.id===r.pairWith).map(x=>nbhDdK(x.name)).filter(Boolean);
}
/* how well an objective (red: a reduction objective) suits a row: [the names' agreement, 0 when its pairing names the
   row's partner else 1], or null. loose: a row made here from the case, which may also take a name inside the other */
function nbhDdFit(r,g,red,loose){
  if(!g||!g.beh||(r.kind==='target')!==red)return null;
  const t=nbhDdTier(g.beh,r.name);if(t<0||t>(loose?2:1))return null;
  const pk=nbhDdPartners(r);return [t,String(g.pair||'').split(';').some(p=>pk.indexOf(nbhDdK(p))>=0)?0:1];
}
/* the case's objectives on the rows: a Map of row to objective. loose(row): the row was made here from the case */
function nbhDdMatch(rows,f,loose){
  const g=(f&&f.goals)||{},cand=[];
  rows.forEach((r,ri)=>{const red=r.kind==='target';((red?g.red:g.acq)||[]).forEach((o,oi)=>{
    if(!o||!(nbhDdLevel(o,red)||nbhDdDays(o,red)))return;   /* it states no criterion */
    const s=nbhDdFit(r,o,red,!!(loose&&loose(r)));if(s)cand.push({r,o,k:(red?'r':'a')+oi,s:s.concat(ri,oi)});});});
  cand.sort((a,b)=>a.s[0]-b.s[0]||a.s[1]-b.s[1]||a.s[2]-b.s[2]||a.s[3]-b.s[3]);
  const out=new Map(),first={};
  cand.forEach(c=>{if(out.has(c.r))return;
    if(c.k in first&&!(first[c.k]===0&&c.s[0]===0))return;   /* already given; only another row of exactly its name shares it */
    out.set(c.r,c.o);if(!(c.k in first))first[c.k]=c.s[0];});
  return out;
}
/* the row closest to one objective (a ticked one), or null */
function nbhDdClosest(rows,g,red,loose){
  let best=null,bs=null;
  rows.forEach(x=>{const s=nbhDdFit(x,g,red,!!(loose&&loose(x)));if(s&&(!bs||s[0]<bs[0]||(s[0]===bs[0]&&s[1]<bs[1]))){best=x;bs=s;}});
  return best;
}
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
function nbhDdRow(kind,name,def,pairId){
  return {id:uid("b"),kind:kind,name:name||'',definition:def||'',obsLength:'Entire school day',measure:'count',
    direction:kind==='target'?'decrease':'increase',aim:'',critDays:3,pairWith:pairId||'',color:PALETTE[S.behaviors.length%PALETTE.length]};
}
function nbhDdAfter(){
  S.rows.forEach(r=>{S.behaviors.forEach(b=>{if(!(b.id in r.values)){r.values[b.id]='';r.values[OPP(b.id)]='';}
    if(!r.intervals)r.intervals={};if(!r.intervals[b.id]){r.intervals[b.id]={};r.intervals[OPP(b.id)]={};}});});
  renderBehaviors();renderData();renderIntervalPanel();syncResultControls();renderResults();
}
/* what the case changed on rows in use, until the note is dismissed: row id -> {name, days:[was, now], aim:[was, now]} */
const nbhDdSeen={};
function nbhDdNote(changes){
  changes.forEach(c=>{const s=nbhDdSeen[c.id]||(nbhDdSeen[c.id]={});s.name=c.name;
    ['days','aim'].forEach(k=>{if(!c[k])return;if(s[k])s[k][1]=c[k][1];else s[k]=c[k].slice();});});
  const same=(a,b)=>String(a==null?'':a)===String(b==null?'':b),say=x=>x===''||x==null?'blank':String(x);
  const parts=Object.keys(nbhDdSeen).map(id=>{const s=nbhDdSeen[id],bits=[];
    if(!S.behaviors.some(b=>b.id===id))return '';
    if(s.days&&!same(s.days[0],s.days[1]))bits.push(say(s.days[1])+' consecutive days (was '+say(s.days[0])+')');
    if(s.aim&&!same(s.aim[0],s.aim[1]))bits.push('aim '+say(s.aim[1])+' (was '+say(s.aim[0])+')');
    return bits.length?(s.name||'A row')+': '+bits.join(', ')+'.':'';}).filter(Boolean);
  let el=document.getElementById('ddCaseNote');
  if(!parts.length){if(el)el.remove();return;}
  if(!el){const at=document.getElementById('tab-setup');if(!at)return;
    el=document.createElement('div');el.id='ddCaseNote';el.className='noprint no-print';el.setAttribute('role','status');
    el.style.cssText='display:flex;gap:12px;align-items:flex-start;margin:0 0 12px;padding:9px 12px;border:1px solid #c9d4d2;border-left:4px solid #0E5C63;border-radius:4px;background:#f2f7f6;color:#16242e;font-size:13px;line-height:1.45';
    at.parentNode.insertBefore(el,at);}
  el.textContent='';
  const p=document.createElement('span');p.style.flex='1';
  p.textContent='Form GB-1’s objectives changed the behavior table when the case was read at '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'. '+
    parts.join(' ')+' Values typed here are kept, and “Criterion met” on Graphs & analysis follows the new values.';
  const b=document.createElement('button');b.type='button';b.className='btn ghost';b.style.cssText='min-width:64px;min-height:40px;flex:none';b.textContent='OK';b.setAttribute('aria-label','Dismiss this note');
  b.addEventListener('click',()=>{Object.keys(nbhDdSeen).forEach(k=>delete nbhDdSeen[k]);el.remove();});
  el.appendChild(p);el.appendChild(b);
}
/* a record replaced (a file opened, the simulation loaded; Clear all reloads the page) takes the note with it */
function nbhDdDrop(){Object.keys(nbhDdSeen).forEach(k=>delete nbhDdSeen[k]);const e=document.getElementById('ddCaseNote');if(e)e.remove();}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='fileImport')nbhDdDrop();},true);
if(typeof loadExample==='function'){const nbhDdSim=loadExample;loadExample=function(){nbhDdDrop();return nbhDdSim.apply(this,arguments);};}
/* the toast waits while the workstation has the form's messages held back (opening a case), up to 10 seconds */
function nbhDdToast(msg){let k=0;(function go(){if(!window.__nbhQuiet){toast(msg);return;}if(++k<40)setTimeout(go,250);})();}
window.__nbhFactsIn=function(f){
  const behs=f.behaviors||[];
  const EX=['Physical aggression','Self-injury','Property destruction'];
  const untouched=!S.rows.length&&S.behaviors.every(b=>!b.definition&&!b.aim)&&S.behaviors.every(b=>b.kind==='target'&&EX.indexOf(b.name)>=0);
  if(untouched){
    if(!behs.length)return {filled:0};
    S.behaviors=[];
    const tg=behs.filter(b=>!nbhDdIsRep(b)),rows=tg.map(b=>{const r=nbhDdRow('target',b.label,b.def,'');S.behaviors.push(r);return r;});
    /* one replacement row per skill, in the order of the behaviors they replace and paired with the first; then the
       replacement targets no behavior names; a defined target under a skill's name gives that row its definition */
    const skills=[];
    tg.forEach((b,i)=>{const k=nbhDdK(b.rep);if(k&&!skills.some(s=>s.k===k))skills.push({k,name:b.rep,def:'',pair:rows[i].id});});
    behs.filter(nbhDdIsRep).forEach(b=>{const k=nbhDdK(b.label);if(!k)return;const s=skills.find(x=>x.k===k);if(s){if(!s.def)s.def=b.def||'';}else skills.push({k,name:b.label,def:b.def||'',pair:''});});
    skills.forEach(s=>S.behaviors.push(nbhDdRow('replacement',s.name,s.def,s.pair)));
    nbhDdMatch(S.behaviors,f,()=>true).forEach((g,r)=>nbhDdCrit(r,g,'new'));
    nbhDdAfter();return {filled:S.behaviors.length};
  }
  /* a record in use: the objectives' criteria reach the rows that name their behaviors, and the form says which */
  let n=0;const got=[],M=nbhDdMatch(S.behaviors,f,null);
  S.behaviors.forEach(r=>{const g=M.get(r);if(!g)return;const was={days:r.critDays,aim:r.aim},k=nbhDdCrit(r,g,'fill');
    if(k){n+=k;got.push({id:r.id,name:r.name,days:[was.days,r.critDays],aim:[was.aim,r.aim]});}});
  if(n){nbhDdAfter();nbhDdNote(got);const msg='Form GB-1’s criterion is now on '+got.map(c=>c.name).join(', ');nbhDdToast(msg+'.');return {filled:n,note:msg};}
  return behs.length?{filled:0,note:'the behavior table is already in use; the picker adds rows to it'}:{filled:0};
};
window.__nbhFactsPick=function(sel){
  let n=0;const f=sel.facts||{},notes=[],made=new Set();
  const named=name=>{const k=nbhDdK(name);return k?S.behaviors.find(x=>nbhDdK(x.name)===k):null;};
  const add=r=>{S.behaviors.push(r);made.add(r);n++;return r;};
  sel.behaviors.forEach(b=>{
    const rep=nbhDdIsRep(b),had=named(b.label);
    if(had){if(rep&&b.def&&!had.definition){had.definition=b.def;n++;}return;}
    const r=add(nbhDdRow(rep?'replacement':'target',b.label,b.def,''));
    if(!rep&&b.rep&&!named(b.rep))add(nbhDdRow('replacement',b.rep,'',r.id));});
  /* the rows made here take the case's objectives, as a record made from the case does (each objective to one row) */
  nbhDdMatch(S.behaviors,f,r=>made.has(r)).forEach((g,r)=>{if(made.has(r))nbhDdCrit(r,g,'new');});
  /* a ticked objective: its criterion goes onto the row that names its behavior, or onto a new row */
  const goal=(g,red)=>{if(!g||!g.beh)return;
    const r=nbhDdClosest(S.behaviors,g,red,x=>made.has(x));
    if(r){n+=nbhDdCrit(r,g,made.has(r)?'new':'pick',notes);return;}
    nbhDdCrit(add(nbhDdRow(red?'target':'acquisition',g.beh,red||!g.cond?'':'Given '+g.cond,'')),g,'new');};
  (sel.goals.red||[]).forEach(g=>goal(g,true));
  (sel.goals.acq||[]).forEach(g=>goal(g,false));
  if(n)nbhDdAfter();return {filled:n,note:notes.join('; ')};
};
