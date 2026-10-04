/* v21.31 the case: hooks. The target behaviors defined on sheet 4 (or, before sheet 4 is written, the
   candidates marked Target on sheet 1) are what the other forms of this case receive.
   (Sprint A4) What goes to the other forms is cleaned; this form's own sheets, its print and its saved file keep what
   was typed. A paired replacement loses a staff note at its end ("(see target 4)", "(see Forms EA-1 and TD-1)",
   "; see sheet 3"), and a replacement target's name loses "(replacement)". A bracket is a note when it begins with
   "see", "cf." or "refer to" and a space, or holds nothing but references to targets, forms or sheets ("(target 4)",
   "(Forms EA-1 and TD-1)", "(targets 4-5)"); one with other words in it ("(sheet 2 of the packet)", "(Form TK-1
   board)", "(see/say 'break')") is part of the name. A paired replacement that points to a replacement target defined
   on sheet 4 ("see target 4"), or reads exactly as one that does (case, spacing and an end stop aside), goes on under
   that target's name, so one skill reaches the other forms once, under one name; a note that names several targets
   ("targets 4 and 5", "targets 4-5") points to none, and a replacement target named only "(replacement)" gives no name
   to the replacements that point to it. Wording that only means the same ("Requests a break", "Break request") is
   left apart: joining it could join two skills. */
const NBHTB_NOTE=/(?:\s*[(\[]\s*(?:(?:see|cf\.?|refer\s+to):?\s+[^()\[\]]*|(?:forms?|targets?|sheets?)\s*#?\s*[A-Z]{0,3}-?\d+(?:\s*(?:,|;|&|and|or|to|through|[-–—])\s*(?:(?:forms?|targets?|sheets?)\s*)?#?\s*[A-Z]{0,3}-?\d+)*\s*)[)\]][\s.;,]*|\s*[—–;,.]\s*see\s+(?:targets?|forms?|sheets?|pages?|above|below)\b.*|\s+-\s+see\s+(?:targets?|forms?|sheets?|pages?|above|below)\b.*)\s*$/i;
const NBHTB_MARK=/(?:\s*[(\[]\s*(?:the\s+)?(?:replacement|alternative|replaces)\b[^()\[\]]*[)\]]|\s+[—–-]\s*(?:the\s+)?(?:replacement|alternative)(?:\s+(?:behaviou?r|response|skill))?)\s*$/i;
/* the one card a note points to ("target 4", "target #4"); none when it names several ("targets 4 and 5", "4-5") */
function nbhTbPtr(s){
  const nums=[];String(s||'').replace(/\btargets?\s*#?\s*(\d{1,2})((?:\s*(?:,|and|&|or|to|through|thru|[-–—])\s*#?\s*\d{1,2})*)/ig,(a,n1,more)=>{nums.push(+n1);(more.match(/\d{1,2}/g)||[]).forEach(x=>nums.push(+x));return a;});
  const u=nums.filter((x,i)=>nums.indexOf(x)===i);return u.length===1?u[0]:0;
}
function nbhTbClean(s){
  let t=String(s||'').trim(),ptr=0,m,k=0;
  while(k++<6){
    if((m=NBHTB_NOTE.exec(t))){ptr=ptr||nbhTbPtr(m[0]);t=t.slice(0,m.index).trim();continue;}
    if((m=NBHTB_MARK.exec(t))){t=t.slice(0,m.index).trim();continue;}
    break;
  }
  return {text:t,ptr};
}
const nbhTbSame=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[‘’ʼ]/g,"'").replace(/[“”]/g,'"').replace(/[‐-―]/g,'-').replace(/\s+/g,' ').replace(/[\s.;:,!]+$/,'').trim();
function nbhTbName(lab){return nbhTbClean(lab).text||String(lab||'').trim();}
/* a paired replacement: the name it goes on under, its own words without the note, and the replacement target it points to.
   A note in place of a name ("— this is the replacement behavior", "see target 4", "n/a") names nothing itself. */
function nbhTbRep(raw,named){
  const s=String(raw||'').trim();if(!s)return {name:'',base:'',to:''};
  const c=nbhTbClean(s),noteOnly=!c.text||/^([—–-]|see\b|this is\b|n\/a\b)/i.test(s);
  const p=c.ptr||(noteOnly?nbhTbPtr(s):0),to=(p&&named[p])||'';
  return noteOnly?{name:to,base:'',to}:{name:to||c.text,base:c.text,to};
}
window.__nbhFactsOut=function(){
  const key=s=>window.nbhCase?window.nbhCase.fnKeyOf(s):'';
  const out=[];const n=+(($('#nTgt')||{}).value)||0;
  const isRepT=t=>/replacement|alternative/i.test(val(`tgt[${t}].type`));
  /* the replacement targets defined on sheet 4, by card number, under their cleaned names */
  const named={};for(let t=0;t<n;t++)if(isRepT(t)){const nm=nbhTbClean(val(`tgt[${t}].lab`)).text;if(nm)named[t+1]=nm;}
  const reps=[];for(let t=0;t<n;t++)reps[t]=val(`tgt[${t}].lab`)&&!isRepT(t)?nbhTbRep(val(`tgt[${t}].rep`),named):null;
  /* words that read as a pointing replacement's own, or as a defined target's name, go on under that target's name;
     words that two different targets claim are left as they are */
  const via={},claim=(k,v)=>{if(k)via[k]=via[k]===undefined||via[k]===v?v:null;};
  Object.keys(named).forEach(t=>claim(nbhTbSame(named[t]),named[t]));
  reps.forEach(r=>{if(r&&r.to&&r.base)claim(nbhTbSame(r.base),r.to);});
  reps.forEach(r=>{if(r&&!r.to&&r.base){const v=via[nbhTbSame(r.base)];if(v)r.name=v;}});
  for(let t=0;t<n;t++){const g=k=>val(`tgt[${t}].${k}`);const lab=g('lab');if(!lab)continue;
    const isRep=isRepT(t),rep=isRep?'':(reps[t]&&reps[t].name)||'';
    out.push({label:isRep?(named[t+1]||lab):lab,def:g('def'),ex:g('ex'),nex:g('nex'),type:g('type'),isRep,fn:g('fn'),fnKey:key(g('fn')),dim:g('dim'),unit:g('unit'),
      rep,ctx:g('ctx'),urg:g('urg'),tops:g('tops'),excl:g('excl'),src:'TB-1'});}
  /* a candidate decided "Target – replacement" goes on as a replacement, under its cleaned name */
  if(!out.length){for(let i=0;i<candN;i++){const g=k=>val(`cand[${i}].${k}`);const beh=g('beh');if(!beh||!/^Target/.test(g('dec')))continue;
    const type=g('dec').replace(/^Target\s*[–-]\s*/,''),isRep=/replacement|alternative/i.test(type);
    out.push({label:isRep?nbhTbName(beh):beh,def:'',rate:g('rate'),type,isRep,urg:g('urg'),src:'TB-1 (candidate)'});}}
  return out.length?{behaviors:out}:null;
};
