/* nbh-link (v21.43): the optional link between Form TK-1 (the token board book) and Form TE-1 (the token economy
   plan). One copy of this file is built into both forms (tools/forms/TK-1/build.sh, tools/blocks/patch-link.py),
   so the two cannot drift apart. Each form compares itself with the other when the user clicks (through the
   shell's read-only relay, or a file the other form saved when it is open alone) and takes only the items the
   user ticks. Compare only reads; fields change only on "Take the ticked items"; no form writes into the other.
   The link record is ONE JSON string in the form's own S.meta.lk (1800 characters at most, see pack()).
   Messages (the asker accepts 'answer' and 'opened' only from window.parent, only while it waits for that reply,
   and only for its partner; anything else is ignored and counted):
     form -> shell {nbh:'ask',want}            shell -> form {nbh:'answer',want,ok,title,snap:{total,data,own}}
     form -> shell {nbh:'open',want,beside}    shell -> form {nbh:'opened',want,ok[,why][,beside]}
   (beside:false in the 'opened' answer: the partner opened in place of the asker, as on a phone.)
   The form supplies an adapter to mount(): {me,other,meWhat,otherWhat,sibling,host,get(),set(str),view(otherS),
   rows(view),take(row),snapshot(),restore(json),after()} and, optionally: choose(key,i,view), which returns true when
   it handled a choice button itself (the row's tick stays) or 'reset' (handled, and the row's tick is let go);
   record(lk,{taken,kept,step}), called as the record is written after a compare or an Apply, with the rows taken,
   kept or found in step, so the form can note what they pair (TK-1's paired target card); noView, the message, or a
   function (partner's S, source) giving it, when view() refuses the partner; rpLine(pages), the words of the reprint
   line. Each row: {key,what,here,there,same?,owner:'there'|'here'|'',pre:['fill'|'changed'|'any'],can,keep (false: no
   Keep button),why,warn,info,preview} plus, where needed, block/fill/fillParts (whoRow), mirror (the partner can take
   this row's value from this form when it compares), choose {n,value} or {labels,on:[i]} (the choice buttons), seen
   (menuSeen hashes), took (the words for the took line), rp (pages to reprint), takeLabel, keptLabel (the words for a
   difference kept: "kept different" unless said), nobase (the record's mark for this key is about another item, so the
   row is compared without it). The record's kd and td hold the day a row was kept, or taken in part (a take that left
   it different); pb holds the hashes of the case's problem behaviors seen at a compare, so the problem-behavior guard
   (problem()) still knows them when the form is open on its own. A row with no what is an information line. Apply
   takes or keeps a row only while its value here is still the one the compare showed, and Undo is offered only while
   the record is still the one the take left. A compare that finds another student writes no in-step mark; those are
   written when "These are the same student" is applied. */
(function(){
'use strict';
if(window.NBHLink)return;
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=v=>v==null||typeof v==='object'?'':String(v);
const trim=v=>str(v).trim();
const val=v=>Array.isArray(v)?v.map(str).filter(Boolean).join('; '):str(v);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const HEX=/^[0-9a-f]{8}$/,RES=/^(step|who|empty|look \d{1,3}|kept \d{1,3}( part \d{1,3})?|part \d{1,3})$/,KEYS=['who','card','beh','n','tok','menu','sched'];
const MAX=1800;

/* NFKC does not fold an iPad's smart punctuation, so curly quotes and the dashes are folded to ' and - here */
function norm(s){s=str(s);try{s=s.normalize('NFKC');}catch(e){}return s.replace(/[\u2018\u2019\u02bc]/g,"'").replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,' ').trim().toLowerCase();}
/* FNV-1a, 32 bits, as 8 hex characters */
function hash(s){s=str(s);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return ('0000000'+(h>>>0).toString(16)).slice(-8);}
/* a near match: the shorter name (4 characters or more) starts the longer one, followed by a space, comma or "(".
   An equal pair is not "near"; it is equal. */
function near(a,b){a=norm(a);b=norm(b);if(!a||!b||a===b)return false;const s=a.length<b.length?a:b,l=s===a?b:a;
  return s.length>=4&&l.slice(0,s.length)===s&&/[ ,(]/.test(l.charAt(s.length));}
/* the words that name one of TK-1's drawn tokens */
const TOKWORD={star:'star',stars:'star',smiley:'smiley',smileys:'smiley',thumb:'thumb',thumbs:'thumb',check:'check',checks:'check',
  tick:'check',ticks:'check',coin:'coin',coins:'coin',medal:'medal',medals:'medal',trophy:'trophy',trophies:'trophy',heart:'heart',hearts:'heart'};
function tokKey(text){const w=norm(text).match(/[a-z]+/g)||[];for(const x of w)if(TOKWORD[x])return TOKWORD[x];return '';}
const plur=w=>/s$/.test(w)?[w]:/[^aeiou]y$/.test(w)?[w,w+'s',w.slice(0,-1)+'ies']:[w,w+'s',w+'es'];
/* the token form names the token: its name, the plural, or its stem as a whole word, ignoring case */
function tokSame(form,name,stem){const f=norm(form),n=norm(name),st=norm(stem)||tokKey(name);if(!f||(!n&&!st))return false;
  const ws=[].concat(n?plur(n):[],st?plur(st):[]);
  if(st&&tokKey(form)===st)return true;
  return ws.some(w=>new RegExp('(^|[^\\p{L}\\p{N}])'+escRe(w)+'($|[^\\p{L}\\p{N}])','u').test(f));}

/* ---- the link record ---- */
const cut=(v,n)=>typeof v==='string'?v.slice(0,n):'';
const okCard=v=>Number.isInteger(v)&&v>=0&&v<=5;
const hexes=(a,n)=>(Array.isArray(a)?a:[]).filter(h=>typeof h==='string'&&HEX.test(h)).slice(0,n);
function readLk(x){
  if(typeof x!=='string'||!x||x.length>2000)return null;
  let o=null;try{o=JSON.parse(x);}catch(e){return null;}
  if(!isObj(o)||o.v!==1)return null;
  const r={v:1,on:o.on===1?1:0,base:{}};
  if(okCard(o.card))r.card=o.card;
  if(isObj(o.last)&&typeof o.last.when==='string'&&!isNaN(Date.parse(o.last.when))){const l=o.last;
    r.last={when:cut(l.when,40),via:l.via==='shell'?'shell':'file',file:cut(l.file,120),saved:cut(l.saved,40),res:RES.test(l.res||'')?l.res:'',nm:cut(l.nm,160)};}
  if(isObj(o.base))KEYS.forEach(k=>{const b=o.base[k];if(Array.isArray(b)&&b.length===2&&HEX.test(b[0])&&HEX.test(b[1]))r.base[k]=[b[0],b[1]];});
  ['kd','td'].forEach(f=>{if(!isObj(o[f]))return;const d={};KEYS.forEach(k=>{if(/^\d{4}-\d{2}-\d{2}$/.test(o[f][k]||''))d[k]=o[f][k];});if(Object.keys(d).length)r[f]=d;});
  if(Array.isArray(o.menuSeen))r.menuSeen=hexes(o.menuSeen,10);
  {const pb=hexes(o.pb,12);if(pb.length)r.pb=pb;}
  if(typeof o.took==='string'&&o.took)r.took=o.took.slice(0,160);
  if(Array.isArray(o.rp)){const rp=o.rp.filter(p=>typeof p==='string'&&p).map(p=>p.slice(0,30)).slice(0,8);if(rp.length){r.rp=rp;r.rpd=cut(o.rpd,40);}}
  if(isObj(o.board)){const b=o.board,six=a=>{const out=(Array.isArray(a)?a:[]).slice(0,6).map(s=>cut(s,40));while(out.length<6)out.push('');return out;};
    r.board={n:/^([1-9]|10)$/.test(b.n||'')?b.n:'',tok:cut(b.tok,40),term:['ring','pic'].includes(b.term)?b.term:'none',last:cut(b.last,40),
      card:okCard(b.card)?b.card:0,cardLabel:cut(b.cardLabel,40),ch:six(b.ch),tg:six(b.tg),paired:b.paired===1?1:0};
    /* paired: the book's card was paired with the plan's behavior by a Take or a Keep there (or found equal to it);
       pair: the two hashes of that pairing (the card's label, the behavior), so the plan can tell whether it holds */
    if(r.board.paired){const p=hexes(b.pair,2);if(p.length===2)r.board.pair=p;}}
  return r;
}
const isOn=x=>{const r=readLk(x);return !!r&&r.on===1;};
/* the record as one string of 1800 characters or less: took goes first, then the board labels are cut to 24 */
function pack(obj){const c=JSON.parse(JSON.stringify(isObj(obj)?obj:{}));c.v=1;let s=JSON.stringify(c);if(s.length<=MAX)return s;
  delete c.took;s=JSON.stringify(c);if(s.length<=MAX)return s;
  if(isObj(c.board)){const b=c.board,c24=v=>typeof v==='string'?v.slice(0,24):v;['tok','last','cardLabel'].forEach(k=>{b[k]=c24(b[k]);});
    ['ch','tg'].forEach(k=>{if(Array.isArray(b[k]))b[k]=b[k].map(c24);});s=JSON.stringify(c);if(s.length<=MAX)return s;}
  if(isObj(c.last)){delete c.last.nm;c.last.file=cut(c.last.file,40);}delete c.rp;delete c.rpd;delete c.kd;delete c.td;s=JSON.stringify(c);if(s.length<=MAX)return s;
  delete c.board;delete c.menuSeen;s=JSON.stringify(c);if(s.length<=MAX)return s;
  return JSON.stringify({v:1,on:c.on===1?1:0,card:okCard(c.card)?c.card:undefined,base:isObj(c.base)?c.base:{},pb:Array.isArray(c.pb)&&c.pb.length?hexes(c.pb,12):undefined});}

/* ---- what each form reads from the other ---- */
function planOf(teS){const S=isObj(teS)?teS:{},m=isObj(S.meta)?S.meta:{},g=k=>trim(m[k]),lk=readLk(m.lk);
  const bk=(Array.isArray(S.bk)?S.bk:[]).filter(isObj).map(r=>({n:trim(r.n),conf:trim(r.conf)})).filter(r=>r.n);
  const th=(Array.isArray(S.thin)?S.thin:[]).filter(r=>isObj(r)&&trim(r.ep)),t=th.length?th[th.length-1]:null;
  const out={bk,thinLast:t?{d:trim(t.d),ep:trim(t.ep)}:null,linkedBack:!!lk&&lk.on===1,pb:lk&&lk.pb?lk.pb.slice():[]};
  ['client','sid','beh','tp','tpN','ep','epN','te','teN','exWhen','exDelay','tokForm','loss','lossRule'].forEach(k=>{out[k]=g(k);});
  return out;}
function boardOf(tkS){const m=isObj(tkS)&&isObj(tkS.meta)?tkS.meta:null;if(!m)return null;const lk=readLk(m.lk);if(!lk||lk.on!==1||!lk.board)return null;
  return Object.assign({},lk.board,{ch:lk.board.ch.slice(),tg:lk.board.tg.slice(),client:trim(m.client),sid:trim(m.sid),pb:lk.pb?lk.pb.slice():[]});}
/* the identity row, the same in both forms: client and sid, each compared only when both are filled */
function whoRow(here,there,o){o=o||{};here=isObj(here)?here:{};there=isObj(there)?there:{};
  const hc=trim(here.client),hs=trim(here.sid),tc=trim(there.client),ts=trim(there.sid);
  const dot=t=>/[.!?]$/.test(t)?t:t+'.',show=(c,s)=>c+(s?(c?' (ID '+s+')':'ID '+s):'');
  const nid=t=>norm(t).replace(/\.$/,''),block=(!!hc&&!!tc&&nid(hc)!==nid(tc))||(!!hs&&!!ts&&nid(hs)!==nid(ts));
  const fillParts={};if(!hc&&tc)fillParts.client=tc;if(!hs&&ts)fillParts.sid=ts;const fill=!block&&Object.keys(fillParts).length>0;
  return {key:'who',what:'Student',here:show(hc,hs),there:show(tc,ts),same:()=>!block&&!fill&&!!(tc||ts),owner:'',pre:['fill'],can:!block,block,fill,fillParts,
    /* the partner takes into its own empty client and sid only */
    mirror:(!tc&&!!hc)||(!ts&&!!hs),
    why:block?'Form '+(o.other||'TE-1')+' names '+show(tc,ts)+'; '+(o.meWhat||'this form')+' names '+dot(show(hc,hs)):'',
    nm:'Form '+(o.other||'TE-1')+' names '+(tc||ts)+'; '+(o.meWhat||'this form')+' names '+dot(hc||hs),took:fill?(fillParts.client&&fillParts.sid?'the student\u2019s name and ID':fillParts.client?'the student\u2019s name':'the student ID'):''};}

/* ---- a behavior to reduce, named where a behavior to increase belongs (the behavior tokens are earned for, a card) ----
   The case's own list comes first: Form TB-1's problem behaviors (isRep false, or a candidate whose type is not a
   replacement) and Form FS-1's (it lists problem behaviors only), matched by label; then the problem behaviors seen at
   an earlier compare (pb: their hashes, kept in a record); then the common words for one, unless a word just before
   turns it round ("no hitting", "instead of hitting", "appropriate refusal"). The replacement named is the problem
   behavior's own (Form TB-1's "rep", Form FS-1's alternative, without a "see target 4" cross-reference), else the case's
   first replacement behavior, so both forms name the same one. */
const PBW=new RegExp('\\b(aggress(?:ion|ions|ive|ively|ing)|elop(?:e|es|ed|ing|ement|ements)|bolting|(?:runs?|running|ran) away|'+
  'self[- ]?injur(?:y|ies|ious|ing)|sibs?|self[- ]?harm(?:s|ing)?|head[- ]?bang(?:s|ing)?|hitting|kicking|biting|spitting|scratching|pinching|hair[- ]pulling|'+
  '(?:hits|kicks|bites|scratches|pinches) (?:others|peers|staff|adults|people|someone|classmates|teachers?|students?|siblings?)|spits (?:at|on)|'+
  'scream(?:s|ing)|yelling|tantrums?|meltdowns?|property (?:destruction|damage)|destroy(?:s|ing)|destruction|disrupt(?:s|ing|ion|ions|ive)|'+
  'refusals?|refusing|non-?complian(?:ce|t)|swearing|cursing|profanity|pica|out[- ]of[- ]seat|off[- ]task|throw(?:s|ing) (?:objects|items|materials|things)|without permission)\\b','g');
const PBNOT=/^(no|not|without|instead|rather|never|avoid|avoids|avoiding|appropriate|appropriately|polite|politely|calm|calmly)$/;
function pbWord(t){PBW.lastIndex=0;let m;while((m=PBW.exec(t))){const before=t.slice(0,m.index).split(/[^\p{L}\p{N}']+/u).filter(Boolean).slice(-3);
  if(!before.some(w=>PBNOT.test(w)))return m[1];}return '';}
const isProb=x=>isObj(x)&&(x.isRep===false||(x.isRep!==true&&(x.src==='FS-1'||(/^TB-1/.test(str(x.src))&&!/replacement|alternative/i.test(str(x.type))))));
const repClean=s=>trim(s).replace(/\s*\(\s*(?:see|cf\.?)\s[^)]*\)\s*$/i,'').replace(/[\s;,.]*\bsee (?:target|behavior|row) \d+\.?$/i,'').trim();
function problem(text,o){o=o||{};const t=norm(text);if(!t)return null;const f=Array.isArray(o.facts)?o.facts.filter(isObj):[];
  const p=f.find(x=>isProb(x)&&norm(x.label)===t);
  if(p){const r=f.find(x=>x.isRep===true&&trim(x.label));return {src:'case',form:p.src==='FS-1'?'FS-1':'TB-1',rep:repClean(p.rep)||repClean(p.alt)||(r?trim(r.label):'')};}
  if(hexes(o.seen,99).includes(hash(t)))return {src:'seen',form:'TB-1',rep:''};
  const w=pbWord(t);return w?{src:'word',word:w}:null;}
/* the hashes of the case's problem behaviors, for a record's pb */
function pbOf(facts){const out=[];(Array.isArray(facts)?facts:[]).forEach(x=>{if(isProb(x)&&trim(x.label)){const h=hash(norm(x.label));if(!out.includes(h))out.push(h);}});return out.slice(0,12);}
/* the warning, worded the same in both forms: o.lead names the item ("Form TE-1's behavior"), o.text is its words, o.fix
   what to do about it */
function problemNote(p,o){o=o||{};if(!p)return '';const q='\u201c'+trim(o.text)+'\u201d',lead=o.lead||'The behavior';
  if(p.src==='word')return lead+', '+q+', names a behavior to reduce (\u201c'+p.word+'\u201d). Tokens are earned for a behavior to increase'+(o.fix?'; '+o.fix:'')+'.';
  return lead+', '+q+', is a problem behavior on Form '+(p.form||'TB-1')+(p.src==='seen'?' (the case named it at an earlier compare)':'')+'. Tokens are earned for a behavior to increase'+
    (p.rep?', such as \u201c'+p.rep+'\u201d':'')+(o.fix?'; '+o.fix:'')+'.';}

/* a file the partner saved: its own JSON, a CASE json, or a .case.html. PACKET, this form's own file, other forms'
   files, a case without the partner and unreadable files are refused. */
function readText(text,fileName,want,me){const t=str(text),O='Form '+want,no=' Nothing was changed.',bad={ok:false,msg:'That file could not be read as a file '+O+' saved.'+no};
  let o=null;
  if(/^\s*[{[]/.test(t)){try{o=JSON.parse(t);}catch(e){o=null;}}
  else{const m=/\x3cscript type="application\/json" id="nbh-case">([\s\S]*?)\x3c\/script>/.exec(t);if(m){try{o=JSON.parse(m[1]);}catch(e){o=null;}}}
  if(!isObj(o))return bad;
  const own=(d,file,saved)=>isObj(d)&&d.form===want&&isObj(d.S)?{ok:true,S:d.S,saved:trim(d.saved)||trim(saved),file:str(file)}:null;
  if(o.form==='PACKET')return {ok:false,msg:'That file is a student packet, not a file '+O+' saved.'+no};
  if(o.form==='CASE'||(!o.form&&isObj(o.forms))){const e=isObj(o.forms)?o.forms[want]:null;
    if(!isObj(e)||!isObj(e.snap))return {ok:false,msg:'That case file holds no '+O+'.'+no};
    let d=null;try{d=JSON.parse(e.snap.own);}catch(x){d=null;}return own(d,fileName,o.saved)||bad;}
  if(me&&o.form===me)return {ok:false,msg:'That file was saved by this form (Form '+me+'), not by '+O+'.'+no};
  const r=own(o,fileName,'');if(r)return r;
  if(typeof o.form==='string'&&o.form!==want&&/^[A-Z]{2,3}-\d$/.test(o.form))return {ok:false,msg:'That file was saved by Form '+o.form+', not by '+O+'.'+no};
  return bad;}

/* ---- row states (plan section 3) ---- */
function stateOf(row,base,o){o=o||{};const O='Form '+(o.other||'TE-1');
  const here=val(row.here),there=val(row.there),a=norm(here),b=norm(there),ha=hash(a),hb=hash(b);
  const can=row.can!==false,pre=Array.isArray(row.pre)?row.pre:[],bs=Array.isArray(base)&&base.length===2?base:null;
  const r=(st,label,take,keep,press)=>({st,label,take:!!take&&can,keep:!!keep&&row.keep!==false,pressed:press&&take&&can?'take':'',ha,hb});
  /* the promise that the partner can take it is made only for a row the partner can take (mirror) */
  const ct=row.mirror?'; '+O+' can take this when it compares':'';
  if(row.block&&!(bs&&bs[0]===ha&&bs[1]===hb))return {st:0,label:'for another student?',take:false,keep:true,block:true,pressed:'',ha,hb};
  /* nothing on either side is not "in step": there is nothing to compare */
  if(!a&&!b&&!row.fill)return r(2,'nothing on either side');
  let same=a===b;if(!same&&typeof row.same==='function'){try{same=!!row.same(here,there);}catch(e){same=false;}}else if(row.same===true)same=true;
  if(same)return r(1,'in step');
  if(!b)return r(2,'only here'+ct);
  if(!a||row.fill)return r(3,'empty here',1,0,pre.includes('fill')||pre.includes('any'));
  if(bs&&bs[0]===ha&&bs[1]===hb)return Object.assign(r(4,o.td?'taken in part ('+o.td+')':(row.keptLabel||'kept different')+(o.kd?' ('+o.kd+')':''),1,1,0),{part:!!o.td});
  if(bs&&bs[0]===ha)return r(5,'changed on '+O,1,1,row.owner==='there'||pre.includes('changed')||pre.includes('any'));
  if(bs&&bs[1]===hb)return r(6,'changed here'+ct,1,1,0);
  return r(7,'different',1,1,pre.includes('any'));}

const fmt=iso=>{const d=new Date(iso);if(!iso||isNaN(d))return '';try{return d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch(e){return d.toLocaleString();}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
/* a bare YYYY-MM-DD (kd, td) is a local day; a full timestamp (rpd) is read as the moment it is, so an evening in the
   Americas is not shown as the next day */
const day=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');const d=m?new Date(+m[1],m[2]-1,+m[3]):new Date(s);if(!s||isNaN(d))return '';try{return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});}catch(e){return d.toDateString();}};
const plural=(n,one,many)=>n+' '+(n===1?one:many);
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function confirmBox(t,o){try{if(window.nbhUI&&window.nbhUI.confirm)return Promise.resolve(window.nbhUI.confirm(t,o||{}));}catch(e){}try{return Promise.resolve(!!window.confirm(t));}catch(e){return Promise.resolve(false);}}
const CSS='.nbh-lk [hidden]{display:none!important}'+
 '.nbh-lk .lk-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}'+
 '.nbh-lk .lk-tools .tool,.nbh-lk .lk-tools a,.nbh-lk .lk-tools button.tool+button.tool,.nbh-lk .lk-btns button.tool+button.tool{margin:0}.nbh-lk .lk-tools a{font-family:var(--sans,sans-serif);font-size:13px;align-self:center}'+
 '.nbh-lk .lk-status{font-family:var(--sans,sans-serif);font-size:13px;font-weight:600;margin:6px 0 2px}.nbh-lk p.hint{margin:2px 0}'+
 '.nbh-lk .lk-status,.nbh-lk p.hint,.nbh-lk .lk-msg,.nbh-lk .lk-warn,.nbh-lk .lk-pre{overflow-wrap:anywhere}'+
 /* a word breaks only when it is wider than its whole cell, so a value column is never squeezed to a letter */
 '.nbh-lk .grid-wrap{max-width:100%;overflow-x:auto}.nbh-lk table.lk-tbl{table-layout:auto}.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{overflow-wrap:break-word;word-break:normal}'+
 '.nbh-lk .lk-tbl td.lk-v{min-width:7em}.nbh-lk .lk-nw{white-space:nowrap}.nbh-lk .lk-none{color:var(--ink-3,#6b7680)}'+
 '.nbh-lk .lk-tbl tbody th{text-align:left;font-weight:600}.nbh-lk .lk-tbl td.lk-st{min-width:7.5em}'+
 '.nbh-lk .lk-btns{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.nbh-lk .lk-btns button{margin:0;min-width:0}'+
 /* numbered choices (the target card, 1 to 6) sit three to a line, so a narrow column never stacks them one by one */
 '.nbh-lk .lk-btns.lk-num{display:grid;grid-template-columns:repeat(3,max-content)}'+
 '.nbh-lk button[aria-pressed=true],.nbh-lk button.tool[aria-pressed=true],.nbh-lk button.tool[aria-pressed=true]:hover{background:var(--nbh-navy,#182e43);color:#fff;border-color:var(--nbh-navy,#182e43)}'+
 /* a ticked Take or Keep shows a tick as well as the dark fill; the tick is decoration, not part of the button's name */
 '.nbh-lk .lk-tbl button[data-act=take][aria-pressed=true]::before,.nbh-lk .lk-tbl button[data-act=keep][aria-pressed=true]::before{content:"\\2713\\00a0";content:"\\2713\\00a0" / ""}'+
 /* the choices inside a row (which card is compared, which names a take adds) are light and carry no tick, so only a
    row's own Take or Keep reads as ticked */
 '.nbh-lk .lk-tbl button.tool[data-act=choose][aria-pressed=true],.nbh-lk .lk-tbl button.tool[data-act=choose][aria-pressed=true]:hover{background:#E7EDF2;color:var(--ink,#16242e);border-color:var(--nbh-navy,#182e43);font-weight:700}'+
 '.nbh-lk .lk-tbl button.tool.lk-pick[aria-pressed=false]{border-style:dashed;color:var(--ink-3,#5b6670)}'+
 '.nbh-lk .lk-warn{color:#7a3d0f;background:#FBEEDB;border-left:3px solid #9B4E15;padding:3px 8px;margin:3px 0}'+
 '.nbh-lk .lk-pre{white-space:pre-wrap;font-size:12px;border-left:3px solid var(--rule-2,#ccc);padding:3px 8px;margin:3px 0}'+
 '.nbh-lk .lk-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'+
 '.nbh-lk .lk-undo .hint{font-size:12px;flex:1 1 16em}'+
 /* on a narrow screen (a phone, or a narrow column side by side) each row is a card: the item, then this form's value
    and the partner's, each named, then the state */
 '@media (max-width:520px){.nbh-lk .lk-tbl{font-size:12.5px}.nbh-lk .lk-tbl thead{display:none}'+
 '.nbh-lk table.lk-tbl,.nbh-lk .lk-tbl tbody,.nbh-lk .lk-tbl tr,.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{display:block;width:auto!important;min-width:0}'+
 '.nbh-lk .lk-tbl th,.nbh-lk .lk-tbl td{padding:5px 8px;overflow-wrap:break-word}.nbh-lk .lk-tbl tbody td{border-top:0}.nbh-lk .lk-tbl tr[data-key]{margin-top:8px}'+
 '.nbh-lk .lk-tbl td.lk-v{min-width:0}.nbh-lk .lk-tbl td[data-l]::before{content:attr(data-l) ": ";font-weight:600}}@media print{.nbh-lk{display:none!important}}';

/* ---- the panel ---- */
function mount(ad){
  const me=ad.me,other=ad.other,O='Form '+other,meWhat=ad.meWhat||'this form',Me=meWhat.charAt(0).toUpperCase()+meWhat.slice(1);
  const W={cur:null,undo:null,undoAfter:'',undoKeep:null,msg:'',msgKind:'',waitA:0,waitO:0,tA:0,tO:0,ignored:0,busy:false,toast:''};
  const framed=()=>{try{return window.parent!==window;}catch(e){return true;}};
  const getLk=()=>{let s='';try{s=ad.get();}catch(e){s='';}return readLk(s);};
  const setLk=o=>{ad.set(o?pack(o):'');};
  const sigOf=lk=>lk&&lk.on===1&&lk.last?lk.last.when+JSON.stringify(lk.base):'';
  const after=()=>{try{if(ad.after)ad.after();}catch(e){if(window.console)console.error(e);}};
  const record=(lk,a)=>{try{if(ad.record)ad.record(lk,a);}catch(e){if(window.console)console.error(e);}};
  const toast=(t,kind)=>{W.toast=t;try{if(window.nbhUI&&window.nbhUI.toast){window.nbhUI.toast(t,{kind:kind||'ok'});return;}}catch(e){}};
  const msg=(t,kind)=>{W.msg=t||'';W.msgKind=kind||'';paintMsg();};
  if(!document.getElementById('nbh-link-css')){const st=document.createElement('style');st.id='nbh-link-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st);}
  const host=typeof ad.host==='string'||!ad.host?document.querySelector(ad.host||'#lkPanel'):ad.host;
  const OFF={'TK-1':'Link this book with Form TE-1, the token economy plan for the same student. The target card, token count, token and Choices are then compared with the plan\u2019s behavior, tokens per exchange, token form and backups, and you choose what to take. Nothing changes on either form without your click.',
    'TE-1':'Link this plan with Form TK-1, the token board book for the same student. The behavior, tokens per exchange, token form and backups are then compared with the book\u2019s target card, token count, token and choice cards, and you choose what to take. Nothing changes on either form without your click.'};
  const T={offText:ad.offText||OFF[me]||'Link '+meWhat+' with '+O+'. Nothing changes on either form without your click.',
    notOpen:O+' is not open in this workstation. Open it beside '+meWhat+', or open a file it saved.',
    noAnswer:O+' did not answer in time (it may still be loading). Try Compare again.',
    noOpen:'This workstation could not open '+O+' from here. Pick it from the list of forms.',
    noView:typeof ad.noView==='string'&&ad.noView?ad.noView:O+'\u2019s link is off, so its file does not name its cards. Turn on Link with Form '+me+' on '+other+'\u2019s Setup page, then compare again.',
    unlink:'Unlink from '+O+'?\nNothing on either form changes; the comparison record is removed.'};
  const Q=s=>host?host.querySelector(s):null;
  if(host){host.classList.add('nbh-lk');host.innerHTML=
    '<div class="lk-off" hidden><p class="hint lk-offtxt">'+esc(T.offText)+'</p><div class="lk-tools"><button type="button" class="tool" data-lk="on">Link with '+esc(O)+'</button></div></div>'+
    '<div class="lk-on" hidden><p class="lk-status" role="status" aria-live="polite"></p><p class="hint lk-next"></p><p class="hint lk-took" hidden></p>'+
    '<div class="lk-rpw" hidden><p class="hint lk-rp" hidden></p><div class="lk-tools"><button type="button" class="tool" data-lk="printed">These pages are reprinted</button></div></div>'+
    '<div class="lk-tools"><button type="button" class="tool" data-lk="compare">Compare with '+esc(O)+'</button><button type="button" class="tool" data-lk="file">Open a file '+esc(O)+' saved</button>'+
    '<button type="button" class="tool" data-lk="beside">Open '+esc(O)+' beside '+esc(meWhat)+'</button><a class="lk-sib" target="_blank" rel="noopener" hidden>Open '+esc(O)+' in a new tab</a>'+
    '<button type="button" class="tool" data-lk="unlink">Unlink</button><input type="file" class="lk-fileIn" accept=".json,.html" hidden></div>'+
    '<div class="verdict v-mid lk-msg" role="alert" hidden></div>'+
    '<div class="lk-cmp" hidden><p class="hint lk-legend">Dark buttons with a \u2713 are ticked. Tap one to tick or untick it, then press Take the ticked items; nothing changes before that. The light buttons beside an item choose which card, or which names, a take uses.</p><div class="grid-wrap"><table class="rt lk-tbl"><thead><tr><th scope="col">What</th><th scope="col">'+esc(Me)+'</th><th scope="col"><span class="lk-nw">'+esc(O)+'</span></th><th scope="col"><span class="lk-vh">State and choice</span></th></tr></thead><tbody></tbody></table></div>'+
    '<div class="lk-tools lk-foot"><button type="button" class="tool" data-lk="apply">Take the ticked items</button><button type="button" class="tool" data-lk="leave">Leave everything as it is</button></div></div>'+
    '<div class="lk-tools lk-undo" hidden><button type="button" class="tool" data-lk="undo" title="Puts back what '+esc(meWhat)+' held before the take. Offered only until anything else on '+esc(meWhat)+' changes.">Undo what was just taken</button>'+
    '<span class="hint">Undo puts back what '+esc(meWhat)+' held before the take. It is offered until anything else on '+esc(meWhat)+' changes.</span></div></div>';}
  /* the alert is written only when its words change, so a screen reader does not announce it again at every repaint */
  function paintMsg(){const m=Q('.lk-msg');if(!m)return;if(m.textContent!==W.msg)m.textContent=W.msg;if(m.hidden!==!W.msg)m.hidden=!W.msg;
    const c='verdict '+(W.msgKind==='ok'?'v-ok':'v-mid')+' lk-msg';if(m.className!==c)m.className=c;}
  function resWords(L){const k=/kept (\d+)/.exec(L.res),p=/part (\d+)/.exec(L.res),out=[];
    if(k)out.push(plural(+k[1],'difference','differences')+' kept');if(p)out.push(plural(+p[1],'item','items')+' taken in part');return out.join(', ');}
  function statusLines(lk){const L=lk.last,out=[];
    if(!L)out.push('Linked with '+O+' \u00b7 not compared yet.');
    else{const when=fmt(L.when),sv=fmt(L.saved),src=L.via==='shell'?'with '+O+' (open in this workstation)':(L.file?'with the file '+L.file:'with a file '+O+' saved')+(sv?' (saved '+sv+')':'');
      const n=+(L.res.split(' ')[1]||0),cmp=' \u00b7 compared '+when+' '+src+'.';
      if(L.res==='who')out.push('Linked with '+O+' \u00b7 for another student? '+(L.nm||'')+cmp);
      else if(L.res==='empty')out.push('Linked with '+O+' \u00b7 '+O+' holds nothing to compare yet'+cmp);
      else if(/^look/.test(L.res))out.push('Linked with '+O+' \u00b7 '+plural(n,'item','items')+' to look at'+(W.cur?' below.':cmp));
      else if(/^(kept|part)/.test(L.res))out.push('Linked with '+O+' \u00b7 '+resWords(L)+cmp);
      else if(L.res==='step')out.push('Linked with '+O+' \u00b7 in step'+cmp);
      else out.push('Linked with '+O+cmp);}
    out.push(framed()?(L?'Changes made on '+O+' since then show only when you compare again.':''):
      'Outside the workstation, '+meWhat+' reads '+O+' from a file: press Save data on '+O+', then Open a file '+O+' saved, here.'+(L?' Changes made there since then show only when you compare again.':''));return out;}
  function evalRows(rows,lk,prev){const st={},pressed={};
    rows.forEach(r=>{if(!r.what||!r.key)return;const nb=!!r.nobase,kd=!nb&&lk.kd&&lk.kd[r.key]?day(lk.kd[r.key]):'',td=!nb&&lk.td&&lk.td[r.key]?day(lk.td[r.key]):'';
      const s=stateOf(r,nb?null:lk.base[r.key],{other,kd,td});st[r.key]=s;
      const p=prev&&prev.st[r.key]&&prev.st[r.key].st===s.st?prev.pressed[r.key]:undefined;
      pressed[r.key]=p!==undefined&&((p==='take'&&s.take)||(p==='keep'&&s.keep)||p==='')?p:s.pressed;});
    return {st,pressed};}
  /* the result of a compare: another student; nothing to compare (every value on the partner's side is empty); items to
     look at; differences kept and items taken in part; or in step */
  function resOf(cur,rows){let look=0,kept=0,part=0,who=false;Object.keys(cur.st).forEach(k=>{const s=cur.st[k];if(s.st===0)who=true;else if([3,5,6,7].includes(s.st))look++;else if(s.st===4){if(s.part)part++;else kept++;}});
    const keyed=(rows||[]).filter(r=>r.what&&r.key);
    if(who)return 'who';if(keyed.length&&keyed.every(r=>!norm(val(r.there))))return 'empty';
    return look?'look '+Math.min(look,999):kept||part?(kept?'kept '+Math.min(kept,999):'')+(kept&&part?' ':'')+(part?'part '+Math.min(part,999):''):'step';}
  const blocked=()=>!!W.cur&&Object.keys(W.cur.st).some(k=>W.cur.st[k].st===0&&W.cur.pressed[k]!=='keep');
  const anyPressed=()=>!!W.cur&&Object.keys(W.cur.pressed).some(k=>!!W.cur.pressed[k]);
  const cell=v=>{const t=val(v);return t?esc(t):'<span class="lk-none" aria-hidden="true">\u2014</span><span class="lk-vh">nothing</span>';};
  function rowHtml(r){
    if(!r.what){const t=val(r.info);return t?'<tr class="lk-info"><td colspan="4" class="hint">'+esc(t)+'</td></tr>':'';}
    const s=W.cur.st[r.key],p=W.cur.pressed[r.key],k=esc(r.key);let b='';
    const tl=r.takeLabel||'Take',kl='Keep '+meWhat+'\u2019s';
    if(s.block)b='<button type="button" class="tool" data-act="keep" data-key="'+k+'" aria-pressed="'+(p==='keep')+'">These are the same student</button>';
    else{if(s.take)b+='<button type="button" class="tool" data-act="take" data-key="'+k+'" aria-pressed="'+(p==='take')+'" aria-label="'+esc(tl+': '+r.what)+'">'+esc(tl)+'</button>';
      if(s.keep)b+='<button type="button" class="tool" data-act="keep" data-key="'+k+'" aria-pressed="'+(p==='keep')+'" aria-label="'+esc(kl+': '+r.what)+'">'+esc(kl)+'</button>';}
    let ch='';if(isObj(r.choose)){const lb=Array.isArray(r.choose.labels)?r.choose.labels.map(str):null,n=Math.max(1,Math.min(10,lb?lb.length:r.choose.n|0||6)),on=Array.isArray(r.choose.on)?r.choose.on:null,gl=r.choose.label||'Card';
      ch='<div class="lk-btns'+(lb?'':' lk-num')+'" role="group" aria-label="'+esc(gl)+'">';
      for(let i=0;i<n;i++)ch+='<button type="button" class="tool'+(on?' lk-pick':'')+'" data-act="choose" data-key="'+k+'" data-i="'+i+'" aria-pressed="'+(on?on.includes(i):r.choose.value===i)+'"'+(lb?'':' aria-label="'+esc(gl+' '+(i+1))+'"')+'>'+esc(lb?lb[i]:String(i+1))+'</button>';ch+='</div>';}
    const notes=[];if(r.why)notes.push('<div class="hint">'+esc(r.why)+'</div>');
    (Array.isArray(r.warn)?r.warn:r.warn?[r.warn]:[]).forEach(w=>notes.push('<div class="lk-warn">'+esc(w)+'</div>'));
    (Array.isArray(r.info)?r.info:r.info?[r.info]:[]).forEach(w=>notes.push('<div class="hint">'+esc(w)+'</div>'));
    if(r.preview)notes.push('<div class="lk-pre">'+esc(r.preview)+'</div>');
    return '<tr data-key="'+k+'" class="lk-s'+s.st+'"><th scope="row">'+esc(r.what)+ch+'</th><td class="lk-v" data-l="'+esc(Me)+'">'+cell(r.here)+'</td><td class="lk-v" data-l="'+esc(O)+'">'+cell(r.there)+'</td><td class="lk-st"><span class="lk-lab">'+esc(s.label)+'</span>'+
      (b?'<div class="lk-btns">'+b+'</div>':'')+'</td></tr>'+(notes.length?'<tr class="lk-note" data-for="'+k+'"><td colspan="4">'+notes.join('')+'</td></tr>':'');}
  function paintFoot(){const a=Q('[data-lk="apply"]');if(a)a.disabled=blocked()||!anyPressed()||W.busy;}
  /* Undo belongs to the record the take was made on: anything that changes it afterwards (an edit, Open data of
     another file, Clear all, the shell's restore) withdraws it, so it can never put one record over another */
  const snapNow=()=>{try{return str(ad.snapshot());}catch(e){return '';}};
  const undoOk=()=>!!W.undo&&!!W.undoAfter&&snapNow()===W.undoAfter;
  const dropUndo=()=>{W.undo=null;W.undoAfter='';W.undoKeep=null;};
  function render(){if(!host)return;const lk=getLk(),on=!!lk&&lk.on===1;
    if(W.cur&&(!on||sigOf(lk)!==W.cur.sig))W.cur=null;if(!on||(W.undo&&!undoOk()))dropUndo();
    Q('.lk-off').hidden=on;Q('.lk-on').hidden=!on;
    if(on){const L=statusLines(lk);Q('.lk-status').textContent=L[0];const nx=Q('.lk-next');nx.textContent=L[1]||'';nx.hidden=!L[1];
      const tk=Q('.lk-took');tk.textContent=lk.took||'';tk.hidden=!lk.took;
      const rp=Q('.lk-rp'),pages=lk.rp||[];let words='';
      if(pages.length){try{words=ad.rpLine?str(ad.rpLine(pages.slice())):'';}catch(e){words='';}if(!words)words='the '+andList(pages)+(pages.length>1?' pages':' page');}
      rp.textContent=pages.length?'Reprint: '+words+(lk.rpd&&day(lk.rpd)?' (changed by the link '+day(lk.rpd)+').':'.'):'';rp.hidden=!pages.length;Q('.lk-rpw').hidden=!pages.length;
      const f=framed();Q('[data-lk="compare"]').hidden=!f;Q('[data-lk="beside"]').hidden=!f;Q('[data-lk="compare"]').disabled=!!W.waitA;Q('[data-lk="beside"]').disabled=!!W.waitO;
      const a=Q('.lk-sib'),blob=location.protocol==='blob:'||location.href==='about:srcdoc'||location.protocol==='about:';
      if(ad.sibling)a.setAttribute('href',ad.sibling);a.hidden=f||blob||!ad.sibling;}
    const cmp=Q('.lk-cmp');cmp.hidden=!(on&&W.cur);
    if(on&&W.cur){Q('.lk-tbl tbody').innerHTML=W.cur.rows.map(rowHtml).join('');}
    Q('.lk-undo').hidden=!(on&&W.undo);paintMsg();paintFoot();}
  /* compare: reads only. It writes lk.last and the in-step marks (the base of each row found in step), except when the
     compare finds another student: then only lk.last, and the marks wait for "These are the same student" */
  function compareWith(obj,src){src=isObj(src)?src:{};let S=obj,saved=trim(src.saved);
    if(isObj(obj)&&isObj(obj.S)&&typeof obj.form==='string'){S=obj.S;saved=saved||trim(obj.saved);}
    const lk=getLk();if(!lk||lk.on!==1)return false;
    dropUndo();W.cur=null;let view=null;try{view=ad.view(S);}catch(e){view=null;}
    if(!view){let t=T.noView;try{if(typeof ad.noView==='function')t=str(ad.noView(S,src))||T.noView;}catch(e){t=T.noView;}msg(t);render();return false;}
    const rows=(ad.rows(view)||[]).filter(isObj),ev=evalRows(rows,lk,null);
    const cur={view,rows,st:ev.st,pressed:ev.pressed,src:{via:src.via==='shell'?'shell':'file',file:str(src.file),saved}};
    const who=rows.find(r=>r.key==='who'&&cur.st.who&&cur.st.who.st===0);cur.held=!!who;
    if(!who){const step=[];rows.forEach(r=>{const s=r.what&&r.key?cur.st[r.key]:null;if(s&&s.st===1){lk.base[r.key]=[s.ha,s.hb];step.push(r);}});record(lk,{taken:[],kept:[],step});}
    lk.last={when:new Date().toISOString(),via:cur.src.via,file:cur.src.file,saved,res:resOf(cur,rows),nm:who?str(who.nm||who.why):''};
    setLk(lk);cur.sig=sigOf(getLk());W.cur=cur;W.msg='';after();render();return true;}
  function press(key,which){if(!W.cur||!W.cur.st[key])return '';const s=W.cur.st[key],p=W.cur.pressed[key];
    if(which!=='take'&&which!=='keep')return p;if(which==='take'&&!s.take)return p;if(which==='keep'&&!s.keep)return p;
    W.cur.pressed[key]=p===which?'':which;
    const tr=Q('tr[data-key="'+key+'"]');if(tr)tr.querySelectorAll('button[data-act="take"],button[data-act="keep"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.act===W.cur.pressed[key])));
    paintFoot();return W.cur.pressed[key];}
  /* a choice button: the adapter handles it (true: the row's tick stays; 'reset': it is let go), or, for an adapter
     that does not, a card number goes into the record as lk.card. Picking the names a take adds ticks that Take. */
  function choose(key,i){if(!W.cur)return;let done=false;try{done=ad.choose?ad.choose(key,i,W.cur.view):false;}catch(e){done=false;}
    const prev={st:Object.assign({},W.cur.st),pressed:Object.assign({},W.cur.pressed)};
    if(done==='reset')delete prev.st[key];
    else if(done!==true){const lk=getLk();if(!lk)return;if(key==='card'&&okCard(i))lk.card=i;setLk(lk);delete prev.st[key];}
    const rows=(ad.rows(W.cur.view)||[]).filter(isObj);
    const ev=evalRows(rows,getLk(),prev);W.cur.rows=rows;W.cur.st=ev.st;W.cur.pressed=ev.pressed;
    const r=rows.find(x=>x.key===key);if(done===true&&r&&isObj(r.choose)&&Array.isArray(r.choose.labels)&&ev.st[key]&&ev.st[key].take&&!ev.pressed[key])W.cur.pressed[key]='take';
    render();}
  /* Apply: the pressed Takes in the order who, card (beh), n, tok, menu, sched; then the bases, the record, the toast */
  /* Apply re-reads this form first: a row whose value here changed after the compare (typed while the table was
     open) is not taken or kept, and is named, so a take never lands on words the compare did not see */
  async function apply(){if(!W.cur||W.busy||blocked()||!anyPressed())return {taken:0,kept:0,stale:0};
    const focusIn=!!host&&host.contains(document.activeElement);W.busy=true;paintFoot();const cur=W.cur;let snap=null;try{snap=ad.snapshot();}catch(e){snap=null;}
    const order=k=>{const i=KEYS.indexOf(k);return i<0?KEYS.length:i;};
    const live={};((ad.rows(cur.view)||[]).filter(isObj)).forEach(r=>{if(r.key)live[r.key]=r;});
    const rows=cur.rows.filter(r=>r.what&&r.key&&cur.pressed[r.key]).sort((a,b)=>order(a.key)-order(b.key));
    const taken=[],kept=[],stale=[],undone=[];
    try{for(const r of rows){const p=cur.pressed[r.key];
      if(!live[r.key]||norm(val(live[r.key].here))!==norm(val(r.here))){stale.push(r);continue;}
      if(p==='take'){let res;try{res=await ad.take(r);}catch(e){res=false;if(window.console)console.error(e);}if(res!==false)taken.push([r,res]);else undone.push(r);}
      else if(p==='keep')kept.push(r);}}
    finally{W.busy=false;}
    const staleTxt=stale.length?'Not taken, because '+meWhat+' changed after the compare: '+andList(stale.map(r=>r.what))+'. The table now shows '+(stale.length===1?'it':'them')+' as '+(stale.length===1?'it is':'they are')+'.':'';
    /* a take that wrote nothing (a question cancelled, or nothing left to change) is named, never silent */
    const undoneTxt=undone.length?'Not taken: '+andList(undone.map(r=>r.what))+' (cancelled, or nothing to change; '+(undone.length===1?'it is as it was':'they are as they were')+').':'';
    const fresh=(ad.rows(cur.view)||[]).filter(isObj),by={};fresh.forEach(r=>{if(r.key)by[r.key]=r;});
    const lk=getLk()||{v:1,on:1,base:{}},now=new Date(),rp=new Set(lk.rp||[]);lk.base=lk.base||{};
    if(!taken.length&&!kept.length){
      if(stale.length||undone.length){const prev={st:cur.st,pressed:Object.assign({},cur.pressed)};undone.forEach(r=>{prev.pressed[r.key]='';});
        const ev=evalRows(fresh,lk,prev);W.cur={view:cur.view,rows:fresh,st:ev.st,pressed:ev.pressed,src:cur.src,sig:cur.sig,held:cur.held};msg([staleTxt,undoneTxt].filter(Boolean).join(' '),'');}
      render();return {taken:0,kept:0,stale:stale.length};}
    taken.forEach(([r,res])=>{const nh=typeof res==='string'?res:by[r.key]?val(by[r.key].here):val(r.there);lk.base[r.key]=[hash(norm(nh)),hash(norm(val(r.there)))];
      if(lk.kd)delete lk.kd[r.key];if(Array.isArray(r.seen))lk.menuSeen=r.seen.filter(h=>HEX.test(h)).slice(0,10);(Array.isArray(r.rp)?r.rp:[]).forEach(x=>rp.add(String(x)));});
    kept.forEach(r=>{lk.base[r.key]=[hash(norm(val(r.here))),hash(norm(val(r.there)))];lk.kd=lk.kd||{};lk.kd[r.key]=ymd(now);if(lk.td)delete lk.td[r.key];});
    /* a compare held for "These are the same student": its in-step marks are written now that it is confirmed */
    const step=[];if(cur.held&&kept.concat(taken.map(x=>x[0])).some(r=>r.key==='who')){const e=evalRows(fresh,lk,null);
      fresh.forEach(r=>{const s=r.what&&r.key?e.st[r.key]:null;if(s&&s.st===1&&!taken.some(([t])=>t.key===r.key)&&!kept.some(x=>x.key===r.key)){lk.base[r.key]=[s.ha,s.hb];step.push(r);}});}
    record(lk,{taken:taken.map(([r])=>r),kept:kept.slice(),step});
    /* a take that leaves its row different (the backups there was room for, the cards picked) reads "taken in part", not "kept" */
    const ev0=evalRows(fresh,lk,null);taken.forEach(([r])=>{const s=ev0.st[r.key];if(s&&s.st===4){lk.td=lk.td||{};lk.td[r.key]=ymd(now);}else if(lk.td)delete lk.td[r.key];});
    if(lk.td&&!Object.keys(lk.td).length)delete lk.td;
    /* the took line holds 160 characters; when it is over, whole items are dropped from the end, never half a word */
    if(taken.length){const head='Taken '+fmt(now.toISOString())+': ',words=taken.map(([r])=>str(r.took||r.what.toLowerCase()));let t=head+words.join('; ');
      while(t.length>160&&words.length>1){words.pop();t=head+words.join('; ')+'; \u2026';}
      if(t.length>160)t=t.slice(0,159)+'\u2026';lk.took=t;}
    if(rp.size&&taken.some(([r])=>Array.isArray(r.rp)&&r.rp.length)){lk.rp=Array.from(rp).slice(0,8);lk.rpd=now.toISOString();}
    const ev=evalRows(fresh,lk,null);
    lk.last={when:now.toISOString(),via:cur.src.via,file:cur.src.file,saved:cur.src.saved,res:resOf(ev,fresh),nm:''};
    setLk(lk);
    /* the table after the take is built again from the record as it now is, so its notes are the new ones; the result
       is counted on it too, since a pairing the form noted in record() can change which rows use the record's mark */
    const rows2=(ad.rows(cur.view)||[]).filter(isObj),ev2=evalRows(rows2,getLk()||lk,null),res2=resOf(ev2,rows2);
    {const l2=getLk();if(l2&&l2.last&&l2.last.res!==res2){l2.last.res=res2;setLk(l2);}}
    const next={view:cur.view,rows:rows2,st:ev2.st,pressed:{},src:cur.src,held:false};Object.keys(ev2.st).forEach(k=>{next.pressed[k]='';});
    next.sig=sigOf(getLk());W.cur=next;dropUndo();W.msg=[staleTxt,undoneTxt].filter(Boolean).join(' ');
    after();
    if(taken.length&&snap){W.undo=snap;W.undoAfter=snapNow();
      /* the Keeps of the same Apply changed nothing on this form, so an Undo keeps them */
      const keepRows=kept.concat(step);if(keepRows.length){W.undoKeep={kept:kept.slice(),step:step.slice(),base:{},kd:{}};keepRows.forEach(r=>{W.undoKeep.base[r.key]=lk.base[r.key];if(lk.kd&&lk.kd[r.key])W.undoKeep.kd[r.key]=lk.kd[r.key];});}}
    render();
    const said=[];if(taken.length)said.push((taken.length===1?'1 item':taken.length+' items')+' taken from '+O);if(kept.length)said.push(plural(kept.length,'difference','differences')+' kept');
    toast(said.join(' and ')+'. '+(taken.length?'Nothing else changed.':'Nothing was changed.')+(W.msg?' '+W.msg:''),'ok');
    /* the Apply button is disabled now; the keyboard goes on to Undo, or to the status line, brought to the middle of
       the screen so that a sticky toolbar does not cover it */
    if(focusIn){const u=Q('[data-lk="undo"]'),st=Q('.lk-status');try{const t=u&&!Q('.lk-undo').hidden?u:st;if(t===st)st.tabIndex=-1;t.focus({preventScroll:true});if(t.scrollIntoView)t.scrollIntoView({block:'center'});}catch(e){}}
    return {taken:taken.length,kept:kept.length,stale:stale.length};}
  function undo(){if(!W.undo)return false;
    if(!undoOk()){dropUndo();msg('Undo is no longer offered: '+meWhat+' has changed since the take.');render();return false;}
    const j=W.undo,keep=W.undoKeep;dropUndo();W.cur=null;try{ad.restore(j);}catch(e){if(window.console)console.error(e);}
    if(keep&&Object.keys(keep.base).length){const lk=getLk();if(lk&&lk.on===1){Object.keys(keep.base).forEach(k=>{if(keep.base[k])lk.base[k]=keep.base[k];});
      if(Object.keys(keep.kd).length)lk.kd=Object.assign(lk.kd||{},keep.kd);record(lk,{taken:[],kept:keep.kept,step:keep.step});setLk(lk);after();}}
    render();
    toast('Undone: '+meWhat+' is as it was before the take'+(keep&&keep.kept.length?'; the '+(keep.kept.length===1?'difference':'differences')+' kept then '+(keep.kept.length===1?'is':'are')+' still kept':'')+'.','ok');return true;}
  function leave(){W.cur=null;W.msg='';render();}
  /* the reprint line goes only when the user says the pages are printed: a browser reports a cancelled print as a print */
  function printed(){const lk=getLk();if(!lk||!lk.rp)return false;delete lk.rp;delete lk.rpd;setLk(lk);after();render();toast('The reprint line is cleared.','ok');return true;}
  async function unlink(){const lk=getLk(),also=[];if(lk&&lk.rp&&lk.rp.length)also.push('the list of pages to reprint');if(lk&&lk.took)also.push('the note of what was last taken');
    if(!(await confirmBox(T.unlink+(also.length?'\nThat removes '+andList(also)+' too.':''),{ok:'Unlink'})))return false;
    W.cur=null;dropUndo();W.msg='';setLk(null);after();render();return true;}
  function link(){const lk=getLk()||{v:1,base:{}};lk.on=1;setLk(lk);W.msg='';after();render();if(framed())ask();}
  /* the relay */
  function ask(){if(!framed()||W.waitA)return;W.cur=null;dropUndo();W.waitA=Date.now();clearTimeout(W.tA);
    W.tA=setTimeout(()=>{if(!W.waitA)return;W.waitA=0;msg(T.noAnswer);render();},12000);
    msg('Asking the workstation for '+O+'\u2026','ok');render();
    try{window.parent.postMessage({nbh:'ask',want:other},'*');}catch(e){W.waitA=0;clearTimeout(W.tA);msg(T.noAnswer);render();}}
  function openBeside(){if(!framed()||W.waitO)return;W.waitO=Date.now();clearTimeout(W.tO);
    W.tO=setTimeout(()=>{if(!W.waitO)return;W.waitO=0;msg(T.noOpen);render();},2000);render();
    try{window.parent.postMessage({nbh:'open',want:other,beside:true},'*');}catch(e){W.waitO=0;clearTimeout(W.tO);msg(T.noOpen);render();}}
  window.addEventListener('message',ev=>{const d=ev.data;if(!isObj(d)||(d.nbh!=='answer'&&d.nbh!=='opened'))return;
    const parentOk=framed()&&ev.source===window.parent;
    if(d.nbh==='answer'){
      if(!parentOk||!W.waitA||d.want!==other){W.ignored++;return;}
      W.waitA=0;clearTimeout(W.tA);
      if(d.ok!==true){msg(d.why==='not open'?T.notOpen:T.noAnswer);render();return;}
      const r=readText(isObj(d.snap)?d.snap.own:'','',other,me);
      if(!r.ok){msg(r.msg);render();return;}
      compareWith(r.S,{via:'shell',saved:r.saved});return;}
    if(!parentOk||!W.waitO||d.want!==other){W.ignored++;return;}
    W.waitO=0;clearTimeout(W.tO);
    if(d.ok!==true){msg(T.noOpen);render();return;}
    /* beside:false: the workstation opened the partner in place of this form (a phone has no room for two) */
    msg(d.beside===false?O+' opens in place of '+meWhat+', since this screen has no room for both; come back to '+meWhat+' to see the comparison.':
      O+' is opening beside '+meWhat+'; it is compared in a moment.','ok');render();setTimeout(ask,1500);});
  /* a saved file */
  /* a file opened while the relay is still asking wins: the late answer is then ignored, as one not waited for. A file
     refused leaves the table that was open, and its ticks, as they were. */
  function fromFile(text,name){if(W.waitA){W.waitA=0;clearTimeout(W.tA);}
    const r=readText(text,name,other,me);if(!r.ok){msg(r.msg);render();return false;}
    return compareWith(r.S,{via:'file',file:r.file,saved:r.saved});}
  /* the keyboard stays where it was: after a button rebuilds the table or hides itself, the focus goes back to that
     button, else to the next one named, else to the status line (or, unlinked, to Link) */
  function refocus(){const sels=[].slice.call(arguments);
    for(const s of sels){const el=s?Q(s):null;if(el&&!el.disabled&&el.getClientRects().length){try{el.focus({preventScroll:true});}catch(e){}return;}}
    const on=!Q('.lk-on').hidden,t=on?Q('.lk-status'):Q('[data-lk="on"]');if(!t)return;if(on)t.tabIndex=-1;try{t.focus({preventScroll:true});}catch(e){}}
  if(host){
    const fi=Q('.lk-fileIn');
    /* The partner's file is not this form's saved state. The forms' unsaved-work guard (nbh-guard) takes the change
       of any file input as "a file was just opened, so nothing is unsaved", so the change is caught here, at the
       window, before it reaches the document, and handled without passing on. */
    window.addEventListener('change',e=>{if(e.target!==fi)return;e.stopPropagation();const f=fi.files&&fi.files[0];if(!f)return;const rd=new FileReader();
      rd.onload=()=>{fromFile(rd.result,f.name);};rd.onerror=()=>{msg('That file could not be read as a file '+O+' saved. Nothing was changed.');};rd.readAsText(f);fi.value='';},true);
    /* the first edit after a take withdraws Undo (see undoOk), and says so */
    ['input','change'].forEach(t=>document.addEventListener(t,e=>{if(!W.undo||(e.target&&host.contains(e.target)))return;
      setTimeout(()=>{if(W.undo&&!undoOk()){dropUndo();msg('Undo is no longer offered: '+meWhat+' has changed since the take.');render();}},0);}));
    host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!host.contains(b))return;
      const a=b.dataset.lk,act=b.dataset.act,k=b.dataset.key,i=b.dataset.i;
      if(a==='on'){link();refocus('[data-lk="compare"]','[data-lk="file"]');}else if(a==='compare')ask();else if(a==='file'){W.msg='';fi.click();}else if(a==='beside')openBeside();
      else if(a==='unlink')unlink().then(done=>{if(done)refocus('[data-lk="on"]');});else if(a==='apply')apply();else if(a==='leave'){leave();refocus();}else if(a==='undo'){undo();refocus();}
      else if(a==='printed'){printed();refocus();}
      else if(act==='take'||act==='keep')press(k,act);else if(act==='choose'){choose(k,+i);refocus('button[data-act="choose"][data-key="'+k+'"][data-i="'+i+'"]');}});}
  const api={compare(){if(framed())ask();else{const fi=Q('.lk-fileIn');if(fi)fi.click();}},compareWith,render,fromFile,
    state(){const lk=getLk();return {on:!!lk&&lk.on===1,lk,res:lk&&lk.last?lk.last.res:'',table:!!W.cur,blocked:blocked(),
      apply:!!W.cur&&!blocked()&&anyPressed()&&!W.busy,undo:!!W.undo,msg:W.msg,toast:W.toast,waiting:!!W.waitA,opening:!!W.waitO,
      status:lk&&lk.on===1?statusLines(lk):[]};},
    rows(){return W.cur?W.cur.rows.filter(r=>r.what&&r.key).map(r=>{const s=W.cur.st[r.key];return {key:r.key,what:r.what,here:val(r.here),there:val(r.there),st:s.st,label:s.label,take:s.take,keep:s.keep,pressed:W.cur.pressed[r.key]||''};}):[];},
    press,apply,undo,leave,link,unlink,choose,printed,ignored:()=>W.ignored};
  window.nbhLink=api;
  render();
  return api;}

window.NBHLink={norm,hash,near,tokSame,tokKey,TOKWORD,readLk,isOn,pack,planOf,boardOf,whoRow,problem,pbOf,problemNote,readText,stateOf,mount,confirm:confirmBox,MAX};
})();
