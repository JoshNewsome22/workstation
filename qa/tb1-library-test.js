/* v21.43 Form TB-1's behavior library: the data against the form's own selects, the card row (search, choose,
   load, the Replace / Fill empty fields only / Cancel question, the functional variant with its own measurement
   fields, undo), the panel on sheet 4, the candidate picker on sheet 2, save and open, print, isolation from the save
   file and the change fingerprint, overflow at phone and tablet widths, touch sizes, and the simulation. Chromium only.
   Exit code 1 if any check fails.
   usage: node qa/tb1-library-test.js */
const {chromium,fs,path,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
const URL=BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html';
const OUT=__dirname+'/out/tb1-library/';
const CATS=["Aggression toward others","Verbal aggression and threats","Self-injurious behavior","Property destruction","Elopement and safety",
 "Tantrums and vocal disruption","Noncompliance and task avoidance","Classroom disruption","Peer and social behavior",
 "Stereotypy and repetitive behavior","Feeding and health-related","Body, privacy and hygiene","Home and sleep","Precursors"];
const KEYS=['lab','type','style','dim','unit','tops','def','ex','nex','on','off','border','excl'];
const KEEP=['fn','urg','clus','ctx','rep','sv'];
const FUNC=['fdim','funit','fon','foff','fex','fnex','fborder','fexcl'];
const UI_TEXT=['Start from the behavior library','Load into this card','starting definitions)','Loaded from the library','Read the full entry',
 'Undo the load','Hide this note','Add a target card and load','Choose one of','Add a candidate from the behavior library','Add as a candidate',
 'shown here only','Definition to load','Undo is off once','How the entries are written','Back to target'];
let pass=0,fail=0;const fails=[];
function check(name,ok,detail){if(ok){pass++;console.log('  ok   '+name);}else{fail++;fails.push(name);console.log('  FAIL '+name+(detail!==undefined?'  '+String(typeof detail==='string'?detail:JSON.stringify(detail)).slice(0,600):''));}}
const norm=s=>String(s||'').replace(/[­]/g,'').replace(/\s+/g,' ').trim();
const lines=s=>String(s||'').split('\n').filter(x=>x.trim()).length;
function pdfText(file){try{return execFileSync('python3',['-c','import sys\ntry:\n import pymupdf as fitz\nexcept ImportError:\n import fitz\nd=fitz.open(sys.argv[1])\nprint("\\n".join(p.get_text() for p in d))',file],{encoding:'utf8',maxBuffer:64*1024*1024});}catch(e){return null;}}
const host=t=>`#tgtWrap .card[data-tgt="${t}"] .tb1lib-host`;
async function open(br,vp,log,opts){const ctx=await br.newContext(Object.assign({viewport:vp,acceptDownloads:true},opts||{}));await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL,{waitUntil:'load'});await sleep(900);return page;}
async function view(page,v){await page.evaluate(v=>document.querySelector(`#viewSeg button[data-view="${v}"]`).click(),v);await sleep(250);}
const fields=(page,t)=>page.evaluate(t=>{const o={};document.querySelectorAll(`[name^="tgt[${t}]."]`).forEach(el=>{o[el.name.slice(el.name.indexOf('.')+1)]=el.value;});return o;},t);
async function choose(page,t,id,variant){await page.locator(host(t)+' input.q').fill('');await page.locator(host(t)+' select.pick').selectOption(id);
 if(variant)await page.locator(host(t)+' select.vs').selectOption(variant);}
const dlgOpen=page=>page.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);});
async function answer(page,which){await page.click(`#nbhUiDlg button[data-tb1lib="${which}"]`);await sleep(250);}
async function loadInto(page,t,id,variant){await choose(page,t,id,variant);await page.locator(host(t)+' button.go').click();await sleep(300);if(await dlgOpen(page))await answer(page,'replace');}
const rowState=(page,t)=>page.evaluate(h=>{const R=document.querySelector(h).shadowRoot,q=s=>R.querySelector(s);
 return {done:!q('.done').hidden,msg:q('.msg').textContent,undo:!q('button.undo').hidden,nou:!q('.nou').hidden,cn:!q('.cn').hidden,
  focus:R.activeElement?R.activeElement.className:''};},host(t));
const status=page=>page.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='status'&&ev.data.status){window.removeEventListener('message',h);res(ev.data.status);}};window.addEventListener('message',h);window.postMessage({nbh:'status'},'*');}));
async function printPdf(page,file,onlyDefine){
 if(onlyDefine)await page.addStyleTag({content:'@media print{.sheet:not(#define){display:none!important}}'});
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 await page.emulateMedia({media:'print'});await sleep(400);
 const hidden=await page.evaluate(()=>[...document.querySelectorAll('.tb1lib-host')].every(h=>getComputedStyle(h).display==='none'));
 const boxes=await page.evaluate(()=>[...document.querySelectorAll('#define .chkrow input[type=checkbox]')].map(c=>getComputedStyle(c).appearance));
 await page.pdf({path:file,preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:null});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(200);
 return {hidden,boxes};}

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const br=await chromium.launch();const log=[];
 let page=await open(br,{width:1180,height:820},log);

 console.log('1. the library and its vocabularies');
 const D=await page.evaluate(([CATS,FUNC])=>{
  const lib=typeof TB1_LIB!=='undefined'?TB1_LIB:null;if(!lib)return {none:true};
  const opts=k=>[...document.querySelector(`[name="tgt[0].${k}"]`).options].map(o=>o.value).filter(Boolean);
  const T=opts('type'),S=opts('style'),Dm=opts('dim');const bad=[],ids={},prefix={};const lines=s=>String(s||'').split('\n').filter(x=>x.trim()).length;
  const FUNCW=/\b(to escape|to avoid|for attention|attention[- ]seeking|on purpose|deliberately|intentionally|angry|anger|frustrat\w*|wants?|manipulat\w*|defian\w*)\b/i;
  const TAGW=/\((?:[^()]*\b(?:cluster|precursor|latency|permanent product|momentary time sample)\b[^()]*|% of opportunities)\)\s*$/i;
  lib.entries.forEach((e,i)=>{const w='#'+i+' '+e.id;
   if(!T.includes(e.type))bad.push(w+' type '+e.type);if(!S.includes(e.style))bad.push(w+' style '+e.style);if(!Dm.includes(e.dim))bad.push(w+' dim '+e.dim);
   if(!CATS.includes(e.cat))bad.push(w+' cat '+e.cat);if(e.type==='Replacement / alternative behavior')bad.push(w+' is a replacement');
   if(!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(e.id))bad.push(w+' id not kebab-case');if(ids[e.id])bad.push(w+' duplicate id');ids[e.id]=1;
   const p=e.id.split('-')[0];if(prefix[e.cat]&&prefix[e.cat]!==p)bad.push(w+' prefix '+p+' differs from '+prefix[e.cat]);prefix[e.cat]=prefix[e.cat]||p;
   ['lab','def','unit','on','off','border','excl'].forEach(k=>{if(typeof e[k]!=='string'||!e[k].trim())bad.push(w+' missing '+k);});
   if(lines(e.ex)<3)bad.push(w+' fewer than 3 examples');if(lines(e.nex)<3)bad.push(w+' fewer than 3 non-examples');
   if(e.type==='Cluster (multiple topographies)'&&!(e.tops&&e.tops.trim()))bad.push(w+' cluster without tops');
   if(e.tops&&e.type!=='Cluster (multiple topographies)')bad.push(w+' tops on a non-cluster');
   if(e.fdef&&e.style==='Functional (outcome-defined)')bad.push(w+' fdef on an entry already functional');
   if(e.aka&&!Array.isArray(e.aka))bad.push(w+' aka not a list');
   [e.def,e.fdef].forEach(x=>{const m=FUNCW.exec(x||'');if(m)bad.push(w+' function or intent word in a definition: '+m[0]);});
   if(/<[a-z\/!]/i.test(JSON.stringify(e)))bad.push(w+' holds markup');
   FUNC.forEach(k=>{if(k in e&&!e.fdef)bad.push(w+' '+k+' without fdef');});
   if(e.fdim&&!Dm.includes(e.fdim))bad.push(w+' fdim '+e.fdim);
   ['fex','fnex'].forEach(k=>{if(k in e&&lines(e[k])<3)bad.push(w+' '+k+' has fewer than 3 lines');});
   if(TAGW.test(e.lab))bad.push(w+' label carries a picker tag: '+e.lab);
   if('tag' in e&&(!e.tag||/[()]/.test(e.tag)))bad.push(w+' tag');});
  const perCat={};lib.entries.forEach(e=>{perCat[e.cat]=(perCat[e.cat]||0)+1;});
  return {n:lib.entries.length,bad,perCat,fdef:lib.entries.filter(e=>e.fdef).length,note:lib.note,T,S,Dm};},[CATS,FUNC]);
 check('TB1_LIB is defined',!D.none);
 check('at least 100 entries ('+D.n+')',D.n>=100);
 check('every entry valid against the selects (type, style, dim, fdim), the 14 categories and the schema',D.bad&&D.bad.length===0,D.bad);
 check('every category has entries',CATS.every(c=>(D.perCat||{})[c]>0),D.perCat);
 check('some entries offer a functional definition ('+D.fdef+')',D.fdef>0);
 const E=await page.evaluate(()=>TB1_LIB.entries);const byId=Object.fromEntries(E.map(e=>[e.id,e]));
 /* the text a card will show: no authoring leftovers, no JSON key names, codes explained, plain functional definitions */
 {const loaded=e=>['lab','def','fdef','tops','ex','nex','on','off','border','excl','unit'].concat(FUNC).map(k=>e[k]||'').join('\n');
  const left=[];E.forEach(e=>{const t=loaded(e);[/\(extended here\)/,/\bborder field\b/,/2-m clause/,/^Outcome (?:\(permanent product\) )?alternative/m,/\bUse it (?:when|where)\b/,
   /Safeguarding rule: a found injury goes on Form IM-1/].forEach(re=>{if(re.test(t))left.push(e.id+' '+re);});});
  check('no authoring leftovers, key names, or advice in the text a card loads',left.length===0,left);
  const NOTCODE=new Set(['IM','FBA','PE','AAC','ABC','RRB','IEP','TV','ID','DA','MS','SIT','NO','T','SIB','OK','A','I','U','C','G']);
  const unexplained=[];E.forEach(e=>{const defd=new Set((e.tops||'').split('\n').map(l=>(/^([A-Z]{1,3}) - /.exec(l)||[])[1]).filter(Boolean)),seen=new Set();
   ['lab','def','fdef','tops','ex','nex','border','excl','on','off','unit'].concat(FUNC).forEach(k=>{const v=e[k];if(!v)return;
    for(const m of v.matchAll(/\b([A-Z]{1,3})\b/g)){const c=m[1];if(NOTCODE.has(c)||defd.has(c)||seen.has(c))continue;seen.add(c);
     const after=v.slice(m.index+c.length,m.index+c.length+6),before=v.slice(Math.max(0,m.index-2),m.index);
     if(/^ \(|^, [a-z]|^ - |^ for /.test(after)||/\($/.test(before)||/^\)/.test(after))continue;unexplained.push(e.id+'.'+k+' '+c);}});});
  check('every data-sheet code is explained where it first appears ('+unexplained.length+' not)',unexplained.length===0,unexplained);
  const fx=E.filter(e=>e.fdef&&e.fdim&&e.fdim!==e.dim&&!(e.funit&&e.fon&&e.foff&&e.fex&&e.fnex));
  check('a functional version that changes the dimension brings its own unit, onset, offset, examples and non-examples',fx.length===0,fx.map(e=>e.id));
  const sgb=E.filter(e=>/safeguarding and mandated-reporting procedure/.test(e.border));
  check('the safeguarding procedure lives in the clinical note, not in the borderline field ('+sgb.length+')',sgb.length===0,sgb.map(e=>e.id));
  const longest=Math.max(...E.map(e=>e.border.length));
  check('no borderline field over 1,500 characters (longest '+longest+')',longest<=1500);}
 const pick=f=>E.find(f);
 const eSingle=pick(e=>e.id==='agg-hit')||pick(e=>e.type==='Single topography'&&!e.fdef&&e.note);
 const eClus=pick(e=>e.id==='agg-cluster')||pick(e=>e.type==='Cluster (multiple topographies)');
 const eFunc=pick(e=>e.id==='elo-area')||pick(e=>e.fdef);
 const eProd=pick(e=>e.id==='sib-skin-pick')||pick(e=>e.fdef&&e.fdim);
 const eOther=pick(e=>e.type==='Single topography'&&!e.fdef&&e.cat==='Property destruction')||pick(e=>e.type==='Single topography'&&!e.fdef&&e.id!==eSingle.id);
 const ePre=pick(e=>e.type==='Precursor');
 console.log('   using',eSingle.id,eClus.id,eFunc.id,eProd.id,eOther.id,ePre.id);
 check('no control was added to the page by the library (controls '+await page.evaluate(()=>document.querySelectorAll('input,select,textarea').length)+')',
  await page.evaluate(()=>document.querySelectorAll('input,select,textarea').length===343));
 check('a library row on every card, the panel and the candidate picker are drawn',await page.evaluate(()=>{const n=+document.querySelector('#nTgt').value;
  return document.querySelectorAll('#tgtWrap .card .tb1lib-host').length===n&&[...document.querySelectorAll('.tb1lib-host')].every(h=>h.shadowRoot)&&!!document.querySelector('#tb1LibPanel').shadowRoot&&!!document.querySelector('#tb1LibCand').shadowRoot;}));
 check('the Guide counts come from the library',await page.evaluate(()=>document.querySelector('[data-tb1lib="n"]').textContent===String(TB1_LIB.entries.length)&&document.querySelector('[data-tb1lib="cats"]').textContent==='14'));
 check('the fields the library fills with long text grow with it (excl, on, off, unit, rep, sv are textareas)',await page.evaluate(()=>['excl','on','off','unit','rep','sv'].every(k=>{const el=document.querySelector(`[name="tgt[0].${k}"]`);return el&&el.tagName==='TEXTAREA'&&el.classList.contains('nbh-line');})));

 console.log('2. search filters the select');
 await view(page,'define');
 const st0=await status(page),dirty0=await page.evaluate(()=>window.nbhGuard.isDirty());
 const optsOf=t=>page.evaluate(h=>[...document.querySelector(h).shadowRoot.querySelectorAll('select.pick option')].filter(o=>o.value).map(o=>o.value),host(t));
 const pickState=t=>page.evaluate(h=>{const s=document.querySelector(h).shadowRoot.querySelector('select.pick');return {ph:s.options[0].textContent,val:s.value,first:(s.options[1]||{}).value,labels:[...s.options].filter(o=>o.value).map(o=>o.textContent)};},host(t));
 const all=await optsOf(0);
 check('the select lists every entry ('+all.length+')',all.length===E.length);
 check('the select is grouped by category (optgroups in order)',JSON.stringify(await page.evaluate(h=>[...document.querySelector(h).shadowRoot.querySelectorAll('select.pick optgroup')].map(g=>g.label),host(0)))===JSON.stringify(CATS));
 check('the picker shows each entry’s tag after its label',(await pickState(0)).labels.includes(eClus.lab+' ('+eClus.tag+')'));
 async function search(q){await page.locator(host(0)+' input.q').fill(q);await sleep(80);return {ids:await optsOf(0),st:await pickState(0)};}
 /* the words a teacher uses, in base or inflected forms; the entry that should be found, and first where that matters */
 const FIND=[['bite','agg-bite',true],['bites','agg-bite',true],['choke','agg-choke'],['shove','agg-push'],['whine','tan-whine'],['disrobe','body-disrobe'],
  ['urinate','body-urinate'],['ruminate','feed-rumination'],['eye poke','sib-eye-poke'],['eye gouge','sib-eye-poke'],['unbuckle','elo-unbuckle'],['seatbelt','elo-unbuckle'],
  ['write on walls','prop-write'],['aggressive','agg-cluster',true],['headbanging','sib-head-bang',true],['head bang','sib-head-bang',true],['hits','agg-hit',true],['kicks','agg-kick',true],
  ['curse','verb-swear'],['tease','peer-tease'],['argue','nc-argue'],['refuse','nc-task-refusal'],['defiant','nc-instr-pct'],['noncompliant','nc-instr-latency'],
  ['picky eater','feed-refuse'],['masturbate','body-genital'],['grunting','tan-vocal'],['growling','tan-vocal'],['out of seat','dis-out-of-seat',true],['elop','elo-area',true],['assault','agg-cluster'],['PICA','feed-pica',true]];
 const miss=[];for(const [q,id,first] of FIND){const r=await search(q);if(!r.ids.includes(id)||(first&&r.ids[0]!==id))miss.push(q+' -> '+r.ids.slice(0,3).join(','));}
 check('search finds what common words name, in base and inflected forms ('+FIND.length+' words)',miss.length===0,miss);
 {const r=await search('bite'),biting=E.filter(e=>/\bbiting\b/i.test(e.lab)).map(e=>e.id);
  check('"bite" lists every biting entry, the label matches first',biting.every(id=>r.ids.includes(id))&&biting.includes(r.ids[0]),r.ids);}
 {const r=await search('pee');check('"pee" finds urinating and no peer entries',r.ids.includes('body-urinate')&&!r.ids.some(id=>byId[id].cat==='Peer and social behavior'),r.ids);}
 {const r=await search('precursors');check('the category matches (every precursor is found)',E.filter(e=>e.cat==='Precursors').every(e=>r.ids.includes(e.id)));}
 {const r=await search('raspberries');check('a word only the definitions hold is found there, and the select says so',r.ids.length>0&&/in the definitions/.test(r.st.ph),r.st.ph);}
 {const r=await search('hitting the teacher');check('a search no entry matches in full lists the closest entries and says so',r.ids.length>0&&/No entry has every word/.test(r.st.ph)&&r.ids[0]==='agg-hit',r.st.ph);}
 {const r=await search('zzqxv');check('a search with no match leaves no entries and says so',r.ids.length===0&&/Nothing matches/.test(r.st.ph));}
 {const r=await search('pee');check('one match found only through another name is listed, not chosen',r.ids.length===1&&r.st.val==='',r.st);}
 {const r=await search('bolt');check('one match whose label holds every word is chosen and Load is enabled',r.ids.length===1&&r.st.val==='elo-bolt'&&await page.evaluate(h=>{const R=document.querySelector(h).shadowRoot;return !R.querySelector('button.go').disabled&&!R.querySelector('.meta').hidden;},host(0)),r.st);}
 await page.locator(host(0)+' input.q').fill('');await sleep(80);
 check('clearing the search lists every entry again',(await optsOf(0)).length===E.length);
 await page.locator(host(0)+' select.pick').selectOption(eFunc.id);await sleep(80);
 const st1=await status(page);
 check('searching and choosing do not mark the form as changed (guard)',!dirty0&&!(await page.evaluate(()=>window.nbhGuard.isDirty())));
 check('searching and choosing do not change the form\'s fingerprint or its field count',st0.sig===st1.sig&&st0.total===st1.total,{st0,st1});
 check('the definition choice shows for an entry with a functional definition, named by the style it loads',await page.evaluate(([h,s])=>{const R=document.querySelector(h).shadowRoot;return !R.querySelector('label.var').hidden&&R.querySelector('select.vs').options[0].textContent===s;},[host(0),eFunc.style]));
 await page.locator(host(0)+' select.pick').selectOption(eSingle.id);await sleep(80);
 check('and hides for one without',await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('label.var').hidden,host(0)));

 console.log('3. loading into an empty card');
 const before1=await fields(page,1);
 await choose(page,0,eSingle.id);await page.locator(host(0)+' button.go').click();await sleep(350);
 check('no question for an empty card',!(await dlgOpen(page)));
 const f0=await fields(page,0),V=(e,f)=>{const g=k=>f&&e['f'+k]?e['f'+k]:(e[k]||'');return {lab:e.lab,type:e.type,style:f?'Functional (outcome-defined)':e.style,dim:g('dim'),unit:g('unit'),tops:e.tops||'',def:f?e.fdef:e.def,ex:g('ex'),nex:g('nex'),on:g('on'),off:g('off'),border:g('border'),excl:g('excl')};};
 const v0=V(eSingle);
 check('it fills exactly the listed fields with the entry',KEYS.every(k=>f0[k]===v0[k]),KEYS.filter(k=>f0[k]!==v0[k]));
 check('it leaves fn, urg, ctx, rep, sv and clus empty',KEEP.every(k=>f0[k]===''),KEEP.map(k=>k+'='+f0[k]));
 check('it touches no other card',JSON.stringify(await fields(page,1))===JSON.stringify(before1));
 const ui0=await page.evaluate(()=>({t:document.querySelector('#tgtTtl0').textContent,ex:document.querySelector('#exN0').textContent,exc:document.querySelector('#exN0').className,nex:document.querySelector('#nexN0').textContent,qc:document.querySelector('#qcHead').textContent}));
 const nEx=lines(eSingle.ex),nNex=lines(eSingle.nex);
 check('the card title shows the label',ui0.t===eSingle.lab,ui0.t);
 check('the example counters update ('+ui0.ex+', '+ui0.nex+')',ui0.ex===nEx+' of 3'&&ui0.nex===nNex+' of 3'&&/\bok\b/.test(ui0.exc));
 check('the quality check carries the new label',ui0.qc.includes(eSingle.lab));
 const note0=await page.evaluate(h=>{const R=document.querySelector(h).shadowRoot,d=R.querySelector('.done'),cn=R.querySelector('.cn');return {shown:!d.hidden&&d.getBoundingClientRect().height>0,msg:R.querySelector('.msg').textContent,cn:!cn.hidden&&cn.getBoundingClientRect().height>0,ct:R.querySelector('.ct').textContent};},host(0));
 check('the note under the row says what was loaded',note0.shown&&note0.msg.startsWith('Loaded from the library: '+eSingle.lab+'. Edit it to fit this learner: the setting, the thresholds and the episode rule.'),note0.msg);
 check('the clinical note shows on screen',!eSingle.note||(note0.cn&&note0.ct===eSingle.note));
 check('the clinical note is not loaded into the card',!Object.values(f0).some(v=>eSingle.note&&v.includes(eSingle.note.slice(0,60))));
 check('loading marks the form as changed and changes its fingerprint',(await page.evaluate(()=>window.nbhGuard.isDirty()))&&(await status(page)).sig!==st1.sig);
 const facts=await page.evaluate(()=>window.__nbhFactsOut());
 check('the case facts carry the loaded behavior',!!(facts&&facts.behaviors&&facts.behaviors[0]&&facts.behaviors[0].label===eSingle.lab&&facts.behaviors[0].def===eSingle.def));
 check('a long loaded field is shown whole (its box as tall as its text)',await page.evaluate(()=>['excl','unit','on','off'].every(k=>{const el=document.querySelector(`[name="tgt[0].${k}"]`);return el.scrollHeight<=el.clientHeight+2;})));
 /* undo, and an edit ending the undo */
 await page.locator(host(0)+' button.undo').focus();await page.keyboard.press('Enter');await sleep(250);
 const fu=await fields(page,0);
 check('Undo puts the card back as it was',KEYS.every(k=>fu[k]==='')&&await page.evaluate(()=>document.querySelector('#tgtTtl0').textContent==='Untitled'&&document.querySelector('#exN0').textContent==='0 of 3'));
 check('after Undo the keyboard focus is on the row’s search box',(await rowState(page,0)).focus.split(' ').includes('q'),await rowState(page,0));
 await choose(page,0,eSingle.id);await page.locator(host(0)+' button.go').click();await sleep(300);
 await page.locator('[name="tgt[0].on"]').fill('Typed onset');await sleep(150);
 {const r=await rowState(page,0);check('typing in a loaded field ends the undo, and the row says so',!r.undo&&r.nou&&r.done,r);}
 await page.locator(host(0)+' button.hide').focus();await page.keyboard.press('Enter');await sleep(150);
 check('Hide this note moves the focus to the Load button',(await rowState(page,0)).focus.split(' ').includes('go'),await rowState(page,0));
 await page.locator('[name="tgt[0].on"]').fill(eSingle.on);
 /* card 2: the function, urgency, context, replacement, social validity and cluster are kept */
 const keep={fn:'Escape / avoidance (social negative)',urg:'4',ctx:'Room 12, all day',rep:'Hands a break card',sv:'Teacher (4/4)',clus:'1'};
 for(const k of KEEP){const sel=`[name="tgt[1].${k}"]`;if(await page.locator(sel).evaluate(e=>e.tagName)==='SELECT')await page.locator(sel).selectOption(keep[k]);else await page.locator(sel).fill(keep[k]);}
 await choose(page,1,eClus.id);await page.locator(host(1)+' button.go').click();await sleep(350);
 check('no question when only the kept fields hold text',!(await dlgOpen(page)));
 const f1=await fields(page,1),v1=V(eClus);
 check('a cluster fills its member list (tops) and the rest',KEYS.every(k=>f1[k]===v1[k])&&f1.tops.length>0,KEYS.filter(k=>f1[k]!==v1[k]));
 check('the label loads without the picker tag',f1.lab===eClus.lab&&!/\(cluster\)/.test(f1.lab),f1.lab);
 check('fn, urg, ctx, rep, sv and clus are kept as typed',KEEP.every(k=>f1[k]===keep[k]),KEEP.map(k=>k+'='+f1[k]));

 console.log('4. the functional (outcome-defined) variant');
 await choose(page,2,eFunc.id,'func');await page.locator(host(2)+' button.go').click();await sleep(350);
 const f2=await fields(page,2);
 check('the functional variant sets the style',f2.style==='Functional (outcome-defined)',f2.style);
 check('and loads the functional definition',f2.def===eFunc.fdef);
 check('the note says the functional definition was loaded',/functional \(outcome-defined\) definition was loaded/.test(await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.msg').textContent,host(2))));
 await choose(page,2,eProd.id,'func');
 check('the row’s line names the functional version’s own dimension',await page.evaluate(([h,d])=>document.querySelector(h).shadowRoot.querySelector('.mt').textContent.includes(d),[host(2),eProd.fdim||eProd.dim]));
 await page.locator(host(2)+' button.go').click();await sleep(300);if(await dlgOpen(page))await answer(page,'replace');
 {const f=await fields(page,2),v=V(eProd,true);
  check('a functional version loads its own dimension, unit, onset, offset, examples and non-examples ('+eProd.id+')',KEYS.every(k=>f[k]===v[k])&&f.dim===(eProd.fdim||eProd.dim)&&f.unit===(eProd.funit||eProd.unit)&&f.ex===(eProd.fex||eProd.ex),KEYS.filter(k=>f[k]!==v[k]));}
 /* every functional version, read from the data the way a load reads it, keeps each card field filled */
 {const empty=[];E.filter(e=>e.fdef).forEach(e=>{const v=V(e,true);['dim','unit','def','ex','nex','on','off','border','excl'].forEach(k=>{if(!v[k])empty.push(e.id+'.'+k);});});
  check('every functional version fills every card field it shares with the topographical one ('+E.filter(e=>e.fdef).length+')',empty.length===0,empty);}

 console.log('5. loading into a filled card asks');
 await page.locator('[name="tgt[3].lab"]').fill('Throwing at peers (our wording)');await page.locator('[name="tgt[3].def"]').fill('Our own definition, typed by the team.');
 await choose(page,3,eOther.id);await page.locator(host(3)+' button.go').click();await sleep(350);
 const q1=await page.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return d&&d.open?{h:d.querySelector('#nbhUiH').textContent,b:d.querySelector('#nbhUiB').textContent,btn:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)}:null;});
 check('the form\'s styled question opens',!!q1,q1);
 check('with Replace, Fill empty fields only and Cancel',!!q1&&JSON.stringify(q1.btn)===JSON.stringify(['Cancel','Fill empty fields only','Replace']),q1&&q1.btn);
 check('naming the fields that hold text',!!q1&&/Label/.test(q1.b)&&/Operational definition/.test(q1.b)&&!/Examples/.test(q1.b),q1&&q1.b);
 check('and saying the type, style and dimension stay with the typed definition',!!q1&&/type, definition style and dimension are left to you/.test(q1.b),q1&&q1.b);
 await page.screenshot({path:OUT+'question.png'});
 await answer(page,'empty');
 let f3=await fields(page,3);const v3=V(eOther);
 check('"Fill empty fields only" keeps the typed text',f3.lab==='Throwing at peers (our wording)'&&f3.def==='Our own definition, typed by the team.');
 check('and fills the empty fields',['unit','ex','nex','on','off','border','excl'].every(k=>f3[k]===v3[k]));
 check('but leaves the type, style and dimension of the typed definition empty',['type','style','dim'].every(k=>f3[k]===''),['type','style','dim'].map(k=>k+'='+f3[k]));
 check('the title keeps the typed label',await page.evaluate(()=>document.querySelector('#tgtTtl3').textContent)==='Throwing at peers (our wording)');
 {const m=await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.msg').textContent,host(3));
  check('the note says only empty fields were filled, and which were left',/Only the empty fields were filled/.test(m)&&/was kept, so its type, definition style and dimension or sampling method were left for you to set/.test(m),m);}
 const undo3=(await rowState(page,3)).undo;
 await page.locator(host(3)+' button.go').click();await sleep(300);await answer(page,'empty');
 const nf=await rowState(page,3);
 check('"Fill empty fields only" with nothing to fill says so, changes nothing, and keeps the earlier undo',/^Nothing was filled from/.test(nf.msg)&&nf.undo===undo3&&undo3&&JSON.stringify(await fields(page,3))===JSON.stringify(f3),nf);
 await choose(page,3,ePre.id);await page.locator(host(3)+' button.go').click();await sleep(300);
 check('a second load asks again',await dlgOpen(page));
 await answer(page,'cancel');
 const f3c=await fields(page,3);
 check('Cancel changes nothing',JSON.stringify(f3c)===JSON.stringify(f3));
 await page.locator(host(3)+' button.go').click();await sleep(300);await answer(page,'replace');
 f3=await fields(page,3);const v3p=V(ePre);
 check('Replace puts the entry in every listed field (and clears what it lacks)',KEYS.every(k=>f3[k]===v3p[k]),KEYS.filter(k=>f3[k]!==v3p[k]));
 await page.locator(host(3)+' button.go').click();await sleep(300);
 {const r=await rowState(page,3);check('loading the entry the card already holds says nothing changed and keeps the undo',!(await dlgOpen(page))&&/^Nothing changed/.test(r.msg)&&r.undo,r);}
 check('Escape on the question is Cancel',await (async()=>{await page.locator(host(3)+' select.pick').selectOption(eSingle.id);await page.locator(host(3)+' button.go').click();await sleep(250);
  await page.keyboard.press('Escape');await sleep(250);return !(await dlgOpen(page))&&JSON.stringify(await fields(page,3))===JSON.stringify(f3);})());
 /* sheet 5's checks were made for the old definition: Replace says so */
 await view(page,'check');await page.evaluate(()=>{const c=document.querySelector('[name="qc[3].0"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await view(page,'define');
 await loadInto(page,3,eSingle.id);
 check('replacing a definition that has quality checks says to re-check them',/quality checklist for target 4 was completed for the previous definition: re-check it on sheet 5/.test((await rowState(page,3)).msg),(await rowState(page,3)).msg);

 console.log('5b. undo after other writers');
 /* the RRB template (no events) over a library load: the row lets go of the load */
 await loadInto(page,0,eOther.id);
 await page.evaluate(()=>{const s=document.querySelector('#rrbTgtSel');[...s.options].forEach(o=>{if(o.value==='0')s.value='0';});});
 await page.evaluate(()=>document.querySelector('#loadRrb').click());await sleep(300);if(await dlgOpen(page))await page.click('#nbhUiDlg .u-f button.primary');await sleep(300);
 {const r=await rowState(page,0),def=(await fields(page,0)).def;check('the RRB template loaded over a library load ends its undo and takes down its note',!r.undo&&!r.done&&/^RRB episode/.test(def),r);}
 /* a write by script with events (the writing help, the shell restoring a case) ends the undo; Undo is never offered over it */
 await loadInto(page,1,eSingle.id);
 await page.evaluate(()=>{const ta=document.querySelector('[name="tgt[1].def"]');ta.value='Rewritten by the writing help.';ta.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText'}));ta.dispatchEvent(new Event('change',{bubbles:true}));});
 {const r=await rowState(page,1);check('a rewrite by script ends the undo and takes down the note that no longer fits',!r.undo&&!r.done,r);}
 /* a write by script without events: Undo leaves that field as it is and says so */
 await loadInto(page,2,eSingle.id);
 await page.evaluate(()=>{document.querySelector('[name="tgt[2].ex"]').value='Examples written by another tool.';});
 await page.locator(host(2)+' button.undo').click();await sleep(250);
 {const f=await fields(page,2),r=await rowState(page,2);check('Undo puts back only what the load wrote and is still there, and names what it left',f.ex==='Examples written by another tool.'&&f.def!==eSingle.def&&/except Examples/.test(r.msg),{ex:f.ex,msg:r.msg});}

 console.log('6. the panel on sheet 4');
 await page.evaluate(()=>{document.querySelector('#tb1LibPanel').shadowRoot.querySelector('details').open=true;});await sleep(150);
 const P=sel=>`#tb1LibPanel ${sel}`;
 const pIds=()=>page.evaluate(()=>[...document.querySelector('#tb1LibPanel').shadowRoot.querySelectorAll('.it')].map(b=>b.dataset.id));
 check('the panel is titled with the number of entries',await page.evaluate(n=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('summary').textContent.replace(/\s+/g,' ').trim()==='Behavior library ('+n+' starting definitions)',E.length));
 check('how the entries are written (the library’s note) is one tap away',await page.evaluate(n=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('details.about p').textContent===n,D.note));
 await page.locator(P('input.q')).fill('elop');await sleep(100);
 const pl=await pIds();
 check('the panel search filters the list, best match first',pl.length>0&&pl.length<E.length&&pl[0]==='elo-area',pl.slice(0,5));
 check('each category’s header sits in a box with its entries',await page.evaluate(()=>{const R=document.querySelector('#tb1LibPanel').shadowRoot;return [...R.querySelectorAll('.gh')].every(h=>h.parentElement.classList.contains('grp')&&h.parentElement.querySelector('.it'));}));
 await page.locator(P('input.q')).fill('');await sleep(100);
 await page.evaluate(()=>{document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.list').scrollTop=900;});
 check('only one category header shows at the top of the scrolled list',await page.evaluate(()=>{const R=document.querySelector('#tb1LibPanel').shadowRoot,l=R.querySelector('.list').getBoundingClientRect();return [...R.querySelectorAll('.gh')].filter(h=>{const r=h.getBoundingClientRect();return r.bottom>l.top+1&&r.top<l.top+20;}).length===1;}));
 await page.locator(P('input.q')).fill('head');await sleep(100);
 check('a new search starts the list at its top',await page.evaluate(()=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.list').scrollTop===0));
 await page.locator(P('input.q')).fill('');await page.locator(P('select.cat')).selectOption('Self-injurious behavior');await sleep(100);
 const pc=await pIds();
 check('the category filter keeps one category',pc.length===E.filter(e=>e.cat==='Self-injurious behavior').length&&pc.every(id=>byId[id].cat==='Self-injurious behavior'));
 await page.locator(P('select.cat')).selectOption('');await sleep(80);
 await page.evaluate(()=>{const l=document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.list');l.scrollIntoView({block:'start'});window.scrollBy(0,-100);});await sleep(200);
 const yList=await page.evaluate(()=>window.scrollY);
 await page.locator(P(`.it[data-id="${eFunc.id}"]`)).click();await sleep(400);
 check('tapping an entry keeps the list on screen while its load buttons come into view',await page.evaluate(()=>{const R=document.querySelector('#tb1LibPanel').shadowRoot,l=R.querySelector('.list').getBoundingClientRect(),b=R.querySelector('.load').getBoundingClientRect();return l.bottom>120&&b.bottom<=innerHeight+1;})&&Math.abs((await page.evaluate(()=>window.scrollY))-yList)<450);
 const det=await page.evaluate(()=>{const R=document.querySelector('#tb1LibPanel').shadowRoot,d=R.querySelector('.detail');return {shown:!d.hidden,txt:d.textContent,li:d.querySelectorAll('li').length,btn:[...d.querySelectorAll('.btns button')].map(b=>b.textContent),vs:!!d.querySelector('select.vs')};});
 const want=[eFunc.def,eFunc.fdef,eFunc.on,eFunc.off,eFunc.border,eFunc.excl,eFunc.unit,eFunc.note].filter(Boolean);
 check('tapping an entry shows it in full (definitions, onset, offset, borderline, exclusions, unit, note)',det.shown&&want.every(x=>det.txt.includes(x)));
 check('with examples and non-examples as lists',det.li===['ex','nex','tops','fex','fnex'].reduce((n,k)=>n+lines(eFunc[k]),0));
 check('and the functional version under its own heading',det.txt.includes('Functional (outcome-defined) version'));
 const nT=await page.evaluate(()=>+document.querySelector('#nTgt').value);
 check('a Load into target button for each card, and Add a target card and load',det.btn.length===nT+1&&det.btn.slice(0,nT).every((b,i)=>b.startsWith('Load into target '+(i+1)))&&det.btn[nT]==='Add a target card and load',det.btn);
 check('the definition choice is offered for an entry with two',det.vs);
 await page.locator(P('select.vs')).selectOption('func');
 {const pre=await fields(page,1);
  await page.locator(P('.btns button.ld[data-t="1"]')).dblclick();await sleep(350);
  check('a double tap on a load button asks once',await page.evaluate(()=>document.querySelectorAll('dialog[open]').length===1)&&await dlgOpen(page));
  await answer(page,'cancel');
  check('and its Cancel leaves no question open and the card as it was',!(await dlgOpen(page))&&JSON.stringify(await fields(page,1))===JSON.stringify(pre));}
 await page.locator(P('.btns button.ld[data-t="1"]')).click();await sleep(300);
 check('loading from the panel into a filled card asks too',await dlgOpen(page));
 await answer(page,'replace');
 const f1b=await fields(page,1);
 check('the panel load fills the card (functional variant) and keeps fn/urg/ctx/rep/sv/clus',f1b.def===eFunc.fdef&&f1b.style==='Functional (outcome-defined)'&&f1b.lab===eFunc.lab&&KEEP.every(k=>f1b[k]===keep[k]));
 check('the card row shows the note after a panel load',await page.evaluate(h=>!document.querySelector(h).shadowRoot.querySelector('.done').hidden,host(1)));
 check('the panel says where it went',/Loaded into target 2\./.test(await page.evaluate(()=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.st').textContent)));
 check('the load buttons follow the card labels',await page.evaluate(lab=>[...document.querySelector('#tb1LibPanel').shadowRoot.querySelectorAll('.btns button')][1].textContent.includes(lab),eFunc.lab));
 await page.locator(P('.btns button.add')).click();await sleep(500);
 const nT2=await page.evaluate(()=>+document.querySelector('#nTgt').value),f4=await fields(page,nT2-1);
 check('Add a target card and load adds a card and fills it',nT2===nT+1&&f4.lab===eFunc.lab&&f4.def===eFunc.fdef&&await page.evaluate(n=>document.querySelectorAll('#tgtWrap .card').length===n&&!!document.querySelector(`#tgtWrap .card[data-tgt="${n-1}"] .tb1lib-host`).shadowRoot,nT2));
 check('the new card appears in the selection table and the quality check',await page.evaluate(n=>document.querySelectorAll('#selBody tr').length===n&&document.querySelectorAll('#qcHead th.c').length===n,nT2));
 await choose(page,0,eFunc.id,'func');
 await page.locator(host(0)+' button.read').click();await sleep(500);
 check('Read the full entry opens the panel on that entry, with the version chosen in the card',await page.evaluate(id=>{const R=document.querySelector('#tb1LibPanel').shadowRoot;return R.querySelector('details').open&&!R.querySelector('.detail').hidden&&R.querySelector('.detail h4').textContent===TB1_LIB.entries.find(e=>e.id===id).lab&&R.querySelector('.detail select.vs').value==='func';},eFunc.id));
 await page.locator(P('.detail button.back')).click();await sleep(700);
 check('and Back to target 1 returns to that card’s row',await page.evaluate(()=>{const c=document.querySelector('#tgtWrap .card[data-tgt="0"]').getBoundingClientRect(),h=document.querySelector('#tgtWrap .card[data-tgt="0"] .tb1lib-host');return c.top>=0&&c.top<innerHeight/2&&document.activeElement===h&&h.shadowRoot.activeElement&&h.shadowRoot.activeElement.classList.contains('pick');}));

 console.log('7. sheet 2: a library label as a candidate');
 await view(page,'select');
 await page.locator('#tb1LibCand input.q').fill('elop');await sleep(80);
 const cOpts=await page.evaluate(()=>[...document.querySelector('#tb1LibCand').shadowRoot.querySelectorAll('select.pick option')].filter(o=>o.value).map(o=>o.value));
 await page.locator('#tb1LibCand select.pick').selectOption(cOpts[0]);await page.locator('#tb1LibCand button.go').click();await sleep(200);
 check('the label goes into the first empty candidate row',await page.evaluate(lab=>document.querySelector('[name="cand[0].beh"]').value===lab,byId[cOpts[0]].lab));
 const rows0=await page.evaluate(()=>document.querySelectorAll('#candBody tr').length);
 for(let i=1;i<rows0;i++){await page.locator('#tb1LibCand button.go').click();await sleep(60);}
 await page.locator('#tb1LibCand button.go').click();await sleep(150);
 check('with every row in use, a new row is added',await page.evaluate(n=>document.querySelectorAll('#candBody tr').length===n+1&&!!document.querySelector(`[name="cand[${n}].beh"]`).value,rows0));

 console.log('8. save, then open');
 await view(page,'define');
 const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#saveBtn').click())]);
 const file=OUT+'saved.json';await dl.saveAs(file);const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 const names=await page.evaluate(()=>[...document.querySelectorAll('[name]')].map(e=>e.name));
 check('the saved file holds the loaded text',/^RRB episode/.test(saved.fields['tgt[0].def'])&&saved.fields['tgt[1].def']===eFunc.fdef&&saved.fields['tgt[3].lab']===eSingle.lab&&saved.fields['tgt[3].def']===eSingle.def&&saved.fields['tgt[1].fn']===keep.fn&&saved.fields[`tgt[${nT2-1}].def`]===eFunc.fdef);
 check('the saved file holds nothing of the library\'s own controls',Object.keys(saved.fields).every(k=>names.includes(k)||/^(qc|ioa)\[/.test(k)));
 const want1=await fields(page,1),want3=await fields(page,3),want4=await fields(page,nT2-1);
 const p2=await open(br,{width:1180,height:820},log);
 await p2.setInputFiles('#fileIn',file);await sleep(1200);
 const g1=await fields(p2,1),g3=await fields(p2,3),g4=await fields(p2,nT2-1);
 check('opening the file restores the loaded text',JSON.stringify(g1)===JSON.stringify(want1)&&JSON.stringify(g3)===JSON.stringify(want3)&&JSON.stringify(g4)===JSON.stringify(want4));
 check('and the titles and counters',await p2.evaluate(lab=>document.querySelector('#tgtTtl3').textContent===lab&&/ of 3$/.test(document.querySelector('#exN3').textContent)&&document.querySelector('#exN3').className.includes('ok'),eSingle.lab));
 check('the reopened cards have their library rows',await p2.evaluate(n=>document.querySelectorAll('#tgtWrap .card .tb1lib-host').length===n&&[...document.querySelectorAll('#tgtWrap .card .tb1lib-host')].every(h=>h.shadowRoot),nT2));

 console.log('9. print');
 await view(p2,'define');
 await p2.evaluate(()=>{const c=document.querySelector('[name="rrb.s.bolt"]');c.checked=true;});
 const pdfD=OUT+'definitions.pdf',prD=await printPdf(p2,pdfD,true);
 check('on paper the library hosts are not displayed',prD.hidden);
 check('the RRB safety flags print as checkboxes',prD.boxes.length===6&&prD.boxes.every(a=>a!=='none'),prD.boxes);
 const tD=pdfText(pdfD);
 if(tD===null)check('PDF text could be read (python3 with PyMuPDF)',false);
 else{const T=norm(tD);
  check('the Definitions sheet prints the loaded definition',T.includes(norm(eSingle.def).slice(0,90))&&T.includes(norm(eFunc.fdef).slice(0,90)),T.slice(0,300));
  check('and its examples',T.includes(norm(eSingle.ex.split('\n')[0]).slice(0,60)));
  check('and a long exclusion and counting unit in full',T.includes(norm(eSingle.excl).slice(-60))&&T.includes(norm(eSingle.unit).slice(-50)));
  const leak=UI_TEXT.filter(s=>T.includes(s));
  check('and none of the library UI',leak.length===0,leak);
  check('nor the clinical note',!eSingle.note||!T.includes(norm(eSingle.note).slice(0,70)));}
 const p3=await open(br,{width:1180,height:820},log);await p3.setInputFiles('#fileIn',file);await sleep(1200);
 const pdfA=OUT+'whole-form.pdf';await printPdf(p3,pdfA,false);const tA=pdfText(pdfA);
 if(tA!==null){const T=norm(tA);const leak=UI_TEXT.filter(s=>T.includes(s));
  check('the whole form on paper carries none of the library UI',leak.length===0,leak);
  check('the Guide paragraph about the library prints',T.includes('About the behavior library')&&T.includes('starting point to edit'));}
 await p3.close();await p2.close();
 {const p5=await open(br,{width:1180,height:820},log);await p5.addStyleTag({content:'@media print{.sheet:not(#refs){display:none!important}}'});
  const f=OUT+'references.pdf';await printPdf(p5,f,false);
  const n=(()=>{try{return +execFileSync('python3',['-c','import sys\ntry:\n import pymupdf as fitz\nexcept ImportError:\n import fitz\nprint(len(fitz.open(sys.argv[1])))',f],{encoding:'utf8'}).trim();}catch(e){return -1;}})();
  check('the References sheet prints on one page ('+n+')',n===1);await p5.close();}

 console.log('10. the simulation still loads');
 const p4=await open(br,{width:1180,height:820},log);
 await p4.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);
 check('the simulation asks with the styled question',await dlgOpen(p4));
 await p4.click('#nbhUiDlg .u-f button.primary');await sleep(1000);
 const sim=await p4.evaluate(()=>({n:document.querySelectorAll('#tgtWrap .card').length,labs:[...document.querySelectorAll('#tgtWrap .card')].map(c=>document.querySelector(`[name="tgt[${c.dataset.tgt}].lab"]`).value),
  rows:[...document.querySelectorAll('#tgtWrap .card .tb1lib-host')].filter(h=>h.shadowRoot).length,cand:document.querySelectorAll('#candBody tr').length,def0:document.querySelector('[name="tgt[0].def"]').value,
  facts:(window.__nbhFactsOut()||{behaviors:[]}).behaviors.length,ttl:document.querySelector('#tgtTtl4').textContent,ctrls:document.querySelectorAll('input,select,textarea').length,
  sv0:document.querySelector('[name="tgt[0].sv"]').value}));
 check('five targets, seven candidates, the worked definitions',sim.n===5&&sim.cand===7&&JSON.stringify(sim.labs)===JSON.stringify(['Aggression','Self-injury – head hitting','Elopement','Break request (replacement)','Arranging and ordering (higher-level RRB)'])&&sim.def0.startsWith('Forceful contact')&&/^Teacher and both aides/.test(sim.sv0),sim);
 check('every simulated card has its library row',sim.rows===5);
 check('the case facts carry the five behaviors',sim.facts===5);
 await view(p4,'define');
 await choose(p4,4,eOther.id);await p4.locator(host(4)+' button.go').click();await sleep(300);
 check('loading over a simulated card asks before replacing',await dlgOpen(p4));
 await answer(p4,'replace');
 check('and Replace says the simulated quality checklist and pilot need re-checking',/quality checklist and the agreement pilot for target 5 were completed for the previous definition/.test((await rowState(p4,4)).msg),(await rowState(p4,4)).msg);
 await p4.close();

 console.log('11. widths: no sideways scroll at 390 px and 820 px; touch sizes');
 for(const vp of [{width:390,height:844},{width:820,height:1180},{width:1180,height:820}]){
  const pg=await open(br,vp,log,{hasTouch:true,isMobile:vp.width<1000});await view(pg,'define');
  await pg.evaluate(()=>{document.querySelector('#tb1LibPanel').shadowRoot.querySelector('details').open=true;});
  await pg.locator(P(`.it[data-id="${eClus.id}"]`)).click();await sleep(150);
  await choose(pg,0,eFunc.id);await pg.locator(host(0)+' button.go').click();await sleep(300);
  const ov=await pg.evaluate(()=>{const de=document.documentElement,inner=[];
   document.querySelectorAll('.tb1lib-host').forEach(h=>{if(!h.shadowRoot)return;h.shadowRoot.querySelectorAll('*').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&el.scrollWidth>el.clientWidth+1&&!/^(SELECT|INPUT|OPTION|OPTGROUP|STYLE)$/.test(el.tagName)&&getComputedStyle(el).overflowX!=='hidden')inner.push(el.className||el.tagName);});
    const hr=h.getBoundingClientRect(),cr=(h.closest('.card,.sheet')||de).getBoundingClientRect();if(hr.right>cr.right+1)inner.push('host past its card');});
   return {sw:de.scrollWidth,cw:de.clientWidth,inner};});
  check(`no horizontal overflow on the Definitions sheet at ${vp.width} px (${ov.sw} / ${ov.cw})`,ov.sw<=ov.cw+1&&ov.inner.length===0,ov);
  if(vp.width<1000){const sz=await pg.evaluate(h=>{const R=document.querySelector(h).shadowRoot,z=parseFloat((document.querySelector('#define').style.zoom)||'1');
    return {read:R.querySelector('button.read').getBoundingClientRect().height/z,undo:R.querySelector('button.undo').getBoundingClientRect().height/z};},host(0));
   check(`touch targets of the row are at least 44 px at ${vp.width} px`,sz.read>=43.5&&sz.undo>=43.5,sz);
   await choose(pg,0,eOther.id);await pg.locator(host(0)+' button.go').click();await sleep(300);
   const db=await pg.evaluate(()=>[...document.querySelectorAll('#nbhUiDlg .u-f button')].map(b=>b.getBoundingClientRect().height));
   check(`the question’s buttons are at least 44 px at ${vp.width} px`,db.length===3&&db.every(h=>h>=43.5),db);
   if(await dlgOpen(pg))await answer(pg,'cancel');}
  await view(pg,'select');
  const ov2=await pg.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  check(`no horizontal overflow on the Select sheet at ${vp.width} px`,ov2.sw<=ov2.cw+1,ov2);
  if(vp.width===390){const fz=await pg.evaluate(h=>getComputedStyle(document.querySelector(h).shadowRoot.querySelector('input.q')).fontSize,host(0));
   check('16 px text in the search box on a phone (no zoom on focus)',fz==='16px',fz);}
  await view(pg,'define');await pg.screenshot({path:OUT+`define-${vp.width}.png`,fullPage:false});
  await pg.close();}

 console.log('12. console');
 const errs=log.filter(l=>l.type==='error'||l.type==='pageerror');
 check('no console errors or page errors',errs.length===0,errs);
 const warns=log.filter(l=>l.type==='warning');if(warns.length)console.log('   warnings (not failures):',JSON.stringify(warns).slice(0,400));
 await br.close();
 console.log(`\n${pass} passed, ${fail} failed${fail?': '+fails.join(' | '):''}`);
 process.exit(fail?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
