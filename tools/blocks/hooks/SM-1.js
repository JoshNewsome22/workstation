
/* v21.31 the case: hooks. The targets a student self-monitors are stated positively, so an empty target
   table takes the acquisition objectives from Form GB-1 and the paired replacements named on Form TB-1,
   not the problem behaviors themselves; the problem behaviors go to the "reduction target" line, the
   function to its field, and the ranked menu from Form PA-1 to the reward menu. The picker adds whatever
   is ticked as a target row, so a reduction target can be written in when the team wants it on the sheet.
   One skill is one row (with Form TB-1 passing a skill shared by several behaviors under one name): a replacement
   target defined on Form TB-1 under the name of a row already made fills that row's empty definition, examples and
   non-examples, and the picker places a name already on the sheet no second time, filling only its empty fields. */
const nbhSmRow=o=>Object.assign({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''},o);
const nbhSmK=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
const nbhSmFill=(r,o)=>{let k=0;['def','ex','nex'].forEach(f=>{if(o[f]&&!r[f]){r[f]=o[f];k++;}});return k;};
window.__nbhFactsIn=function(f){
  let n=0;const behs=f.behaviors||[],acq=(f.goals&&f.goals.acq)||[];
  if(S.tg.every(t=>!t.word&&!t.def)){
    const rows=[];
    acq.forEach(g=>{if(g.beh&&rows.length<5&&!rows.some(r=>r.word===g.beh))rows.push(nbhSmRow({word:g.beh,def:g.cond?'given '+g.cond:''}));});
    behs.forEach(b=>{const w=b.isRep?b.label:b.rep;if(!w)return;const had=rows.find(r=>r.word===w);
      if(had){if(b.isRep)nbhSmFill(had,{def:b.def||'',ex:b.ex||'',nex:b.nex||''});return;}
      if(rows.length<5)rows.push(nbhSmRow(b.isRep?{word:b.label,def:b.def,ex:b.ex||'',nex:b.nex||''}:{word:w}));});
    if(rows.length){while(rows.length<2)rows.push(nbhSmRow({}));S.tg=rows;n+=rows.filter(r=>r.word).length;}
  }
  const red=behs.filter(b=>!b.isRep);
  if(!S.meta.t_reduce&&red.length){S.meta.t_reduce=red.map(b=>b.label+(b.rep?' (replaced by '+b.rep+')':'')).join('; ');n++;}
  if(!S.meta.func&&f.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),f.fn.key||f.fn.label);if(v){S.meta.func=v;n++;}}
  if(!S.meta.menu&&(f.menu||[]).length){S.meta.menu=nbhCase.menuLine(f.menu,5);n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  let n=0;const dup=[];
  const add=o=>{const had=nbhSmK(o.word)?S.tg.find(t=>nbhSmK(t.word)===nbhSmK(o.word)):null;
    if(had){if(nbhSmFill(had,o))return true;if(dup.indexOf(had.word)<0)dup.push(had.word);return false;}
    if(S.tg.length>=5&&!S.tg.some(t=>!t.word&&!t.def))return false;const slot=S.tg.find(t=>!t.word&&!t.def);if(slot)Object.assign(slot,nbhSmRow(o));else S.tg.push(nbhSmRow(o));return true;};
  sel.behaviors.forEach(b=>{const w=b.isRep?b.label:(b.rep||b.label);if(add({word:w,def:w===b.label?b.def:'',ex:w===b.label?(b.ex||''):'',nex:w===b.label?(b.nex||''):''}))n++;});
  sel.goals.acq.forEach(g=>{if(add({word:g.beh,def:g.cond?'given '+g.cond:''}))n++;});
  sel.goals.red.forEach(g=>{if(add({word:g.beh,def:'no '+(g.ml||'more')+' than '+(g.tgt||'the target level')}))n++;});
  if(sel.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),sel.fn.key||sel.fn.label);if(v){S.meta.func=v;n++;}}
  if(sel.menu.length){S.meta.menu=[S.meta.menu,sel.menu.map(m=>m.name).join(', ')].filter(Boolean).join(', ');n++;}
  renderAll();
  const notes=[];if(dup.length)notes.push((dup.length===1?dup[0]+' is':dup.join(', ')+' are')+' already on the sheet.');
  if(S.tg.length>=5)notes.push('The sheet holds at most five targets.');
  return {filled:n,note:notes.join(' ')};
};
