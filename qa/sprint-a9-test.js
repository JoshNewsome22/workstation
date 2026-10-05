/* Enhancement sprint, package A9: the token system names the behavior that earns tokens (Form TE-1).
   A. Form TB-1 and Form PA-1 simulated in the workstation, then a fresh TE-1: "Behavior the tokens are earned for" holds
      the case's replacement (TB-1's defined replacement target, without "(replacement)"), never a problem behavior; the
      backup menu holds PA-1's ranked menu in rank order without its low-preference items, with "Rank n (tier)" under
      Preference (PA-1) and the class from PA-1's type; the packet's details still arrive, nothing else on the form is
      touched, and a later push of the case changes nothing.
   B. A TE-1 with a typed behavior and typed backups, open before the case exists: both are left alone when the case
      arrives. With the behavior emptied, the next push fills it; the typed backups stay as typed.
   C. The day lens's path (scratchpad enhance/verify.js): TB-1 simulated, FS-1 opened and concluded, then TE-1: no
      "Aggression"; with no PA-1 the backups stay empty. The function has no field here: the list shows it disabled. One of
      the case's problem behaviors typed in the field: a warning under it; a behavior to increase typed instead: none.
   D. The fill's rules on a standalone TE-1, through nbhCase.apply (the entry the shell's facts verb uses): a defined
      replacement target before a paired replacement before GB-1's skill objective; a paired replacement that points to the
      defined target ("see target 4") is that target; staff notes dropped, the label's own brackets kept; a candidate that
      names a problem behavior (the case's own, or the link guard's words) passed over, unless a word earlier in its clause
      rules it out ("no hitting, kicking, or biting"); "See-saw" is not a staff note, "see the note" is no behavior; a first
      word such as "iPad" keeps its letters; Form FS-1's alternative and a TB-1 candidate marked replacement; unranked and
      low-preference items never placed; rank order, one row per name; a case with no replacement leaves the field empty
      (never the general fill's first behavior); the picker's note in the plural.
   E. From the case: the list says what each item gives here, ticks what the fill would take, disables a reduction goal;
      with the field filled, a candidate says it would go here once the field is cleared; a reinforcer of low preference or
      not yet ranked says the fill leaves it out; Use puts the ticked replacement into an empty behavior field (a problem
      behavior ticked gives its replacement), never replaces a typed behavior (and says so), adds the ticked reinforcers to
      empty rows, then new rows, and skips one already on the menu; a forced reduction goal places nothing.
   F. The link with Form TK-1 still works: TE-1 and TK-1 both filled from the case, both linked in the workstation: TE-1
      compares through the relay, the student and the behavior read in step; a choice card the book has and this menu
      lacks can only be one of PA-1's low-preference or unranked items, offered unticked (none at all is in step too); the
      compare changes nothing but the link record.
   G. Files saved before (qa/data/sprint-a9/, the audit's saved TE-1): it opens unchanged, and the case changes nothing in
      it; a case-filled TE-1 saves and opens back the same. The form's own Open packet, with a packet another form saved
      (its target behavior "Aggression"), fills the student's details but not the behavior, and says so; its Save packet
      writes no target behavior, so Form TD-1's Open packet leaves TD-1's empty. Load simulation still asks first, and
      Cancel keeps every field.
   H. While untouched, the fill follows the case, in the workstation: TE-1 open first; Form TB-1's paired replacement
      typed with a pause half-way, then finished: TE-1's behavior follows; PA-1's pool typed and one MSWO pick made, then
      the rest of the assessment: the backups follow to the final ranking. A token cost typed in TE-1 stops the backups
      (a later change on PA-1 leaves them, cost and all); the behavior typed in TE-1 stops the behavior.
   I. The same rules on a standalone TE-1: a later case replaces the fill's own values only; a typed cost, a row added,
      Use, a file opened (the same values, saved and opened again) each end it; a case with nothing ranked or no
      replacement never empties what the fill placed. A field being typed in (a schedule row, a backup note) keeps its
      focus and caret when the case arrives, and a backup cell that has the focus keeps it when the menu is placed again.
   J. The warning: a TE-1 holding "Aggression" (the old fill's, here a file saved before with it) shows, while the case
      names it as a problem behavior, a warning under the field, on screen only (hidden in print and left out of the
      workstation's packet), with the replacement to use; the "From the case" list repeats it at the top; a behavior to
      increase typed in its place clears it; a problem behavior the link saw at a compare is warned of with the form open
      alone; the common words alone are not (that guard is the link's).
   No page or console error anywhere.
   Run: WS_URL=http://127.0.0.1:8309 WS_ROOT=<worktree> node qa/sprint-a9-test.js [edition]
   (the edition folder: NBH-Workstation, the default, or RPS-Workstation; OLDSAVE=<folder> for another saved TE-1.json) */
const {chromium,fs,path,BASE,forms,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a9/';
const OLD=process.env.OLDSAVE||path.join(__dirname,'data','sprint-a9');
const FILE={};forms(ED).forEach(f=>{FILE[f.id]=f.file;});
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,900)));if(!c)fails++;};
const log=[];
const LP=m=>m.tier==='LP';
/* what TE-1 should hold from PA-1's menu: the ranked items without the low-preference third, in rank order */
const expected=menu=>(menu||[]).filter(m=>m&&m.rank!=null&&!LP(m)).sort((a,b)=>a.rank-b.rank);
const CLS={'Edible':'Edible','Leisure item':'Leisure item','Activity':'Activity','Social':'Social / attention','Sensory':'Sensory','Other':'Other'};

async function shell(br,vp){
  const ctx=await br.newContext({viewport:vp||{width:1180,height:820},hasTouch:true});
  await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/index.html');await page.waitForFunction(()=>typeof openForm==='function');await sleep(800);
  await page.evaluate(()=>{window.alert=()=>{};});
  return {ctx,page};
}
async function openIn(page,id){
  await page.evaluate(id=>openForm(id),id);
  const h=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{state:'attached',timeout:15000});
  const fr=await h.contentFrame();
  await fr.waitForFunction(()=>document.readyState==='complete'&&!!window.nbhCase,null,{timeout:15000});
  await page.waitForFunction(id=>!!state.status[id],id,{timeout:15000});
  await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  return fr;
}
const sim=fr=>fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();}).then(()=>sleep(1200));
const bar=page=>page.evaluate(()=>{const s=(i,v)=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
  s('pClient','Jordan Rivera');s('pSid','204417');s('pSite','Lincoln Elementary');s('pBcba','J. Newsome');});
const factsHave=(page,what)=>page.waitForFunction(w=>{const f=state.facts;if(!f||!f.src)return false;
  return w.every(k=>k==='behaviors'?f.src.behaviors==='TB-1'&&(f.behaviors||[]).length>0:k==='menu'?f.src.menu==='PA-1'&&(f.menu||[]).length>0:
    k==='goals'?!!(f.goals&&(f.goals.acq||[]).length):k==='fn'?!!(f.fn&&f.fn.key):false);},what,{timeout:45000});
/* TE-1's record as the tests read it */
const teRead=fr=>fr.evaluate(()=>({beh:S.meta.beh||'',input:document.querySelector('[data-m="beh"]').value,bk:S.bk.map(r=>Object.assign({},r)),
  meta:Object.assign({},S.meta),thin:S.thin.map(r=>Object.assign({},r)),aud:Object.assign({},S.aud),last:window.nbhCase&&nbhCase.last}));
const sNoLk=fr=>fr.evaluate(()=>{const o=JSON.parse(JSON.stringify(S));delete o.meta.lk;return JSON.stringify(o);});
/* a TE-1 field typed as a person would */
const typeIn=(fr,sel,v)=>fr.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
const BK=(i,f)=>`#bkTbl [data-k="${i}"][data-f="${f}"]`;
/* the "From the case" list: open it and read every item */
async function pickerOpen(page,fr,id){
  await page.evaluate(id=>openForm(id),id||'TE-1');await sleep(250);
  await fr.evaluate(()=>{const d=document.querySelector('#nbhCaseDlg');if(d&&d.open)d.close();document.querySelector('#nbhCaseBtn').click();});await sleep(300);
  return fr.evaluate(()=>({open:!!document.querySelector('#nbhCaseDlg[open]'),items:[...document.querySelectorAll('#nbhcBody input[type="checkbox"]')].map(c=>{const l=c.closest('label');
    return {kind:c.dataset.kind,i:+c.dataset.i,checked:c.checked,disabled:c.disabled,name:l.querySelector('b').textContent,own:(l.querySelector('.nbhc-own')||{}).textContent||''};})}));
}
/* a file opened with the form's own Open data, as a person would */
const openFile=(pg,t,n)=>pg.evaluate(([t,n])=>{const fi=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],n,{type:'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},[t,n]).then(()=>sleep(500));
/* the file a button would save, caught before it is downloaded */
const caught=(pg,label)=>pg.evaluate(l=>new Promise(res=>{const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};
  HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};(l==='#saveBtn'?document.querySelector(l):[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===l)).click();}),label);
const T=(label,o)=>Object.assign({label,isRep:false,src:'TB-1',type:'Single topography'},o||{});
const R=(label,o)=>Object.assign({label,isRep:true,src:'TB-1',type:'Replacement / alternative behavior'},o||{});
const tickOnly=(fr,pairs)=>fr.evaluate(p=>{document.querySelectorAll('#nbhcBody input[type="checkbox"]').forEach(c=>{c.checked=p.some(([k,i])=>c.dataset.kind===k&&+c.dataset.i===i);});},pairs);
const useTicked=async fr=>{await fr.evaluate(()=>document.querySelector('#nbhcUse').click());await sleep(300);
  const t=await fr.evaluate(()=>document.querySelector('#nbhcDone').textContent);await fr.evaluate(()=>document.querySelector('#nbhCaseDlg').close());return t;};

(async()=>{fs.mkdirSync(OUT,{recursive:true});
 const br=await chromium.launch();
 let factsA=null;

 /* ---------- A (and F): TB-1 and PA-1 simulated, then a fresh TE-1; then the link with TK-1 ---------- */
 {const {ctx,page}=await shell(br);await bar(page);
  const tb=await openIn(page,'TB-1');await sim(tb);
  const pa=await openIn(page,'PA-1');await sim(pa);
  await factsHave(page,['behaviors','menu']);await sleep(1500);
  const facts=factsA=await page.evaluate(()=>state.facts);
  const paMenu=await pa.evaluate(()=>(window.__nbhFactsOut()||{}).menu||[]);
  ok('A: the case carries Form PA-1\'s menu as PA-1 ranks it ('+facts.menu.length+' items, '+facts.menu.filter(LP).length+' low preference)',
    JSON.stringify(paMenu.map(m=>[m.name,m.rank,m.tier]))===JSON.stringify(facts.menu.map(m=>[m.name,m.rank,m.tier]))&&facts.menu.some(LP),{paMenu,menu:facts.menu});
  const te=await openIn(page,'TE-1');
  await te.waitForFunction(()=>!!(window.nbhCase&&nbhCase.last&&nbhCase.facts&&(nbhCase.facts.menu||[]).length),null,{timeout:20000});await sleep(600);
  const r=await teRead(te);
  const probs=facts.behaviors.filter(b=>!b.isRep).map(b=>b.label),rep=facts.behaviors.find(b=>b.isRep);
  ok('A: TB-1\'s simulation names a defined replacement target ('+(rep&&rep.label)+') and '+probs.length+' problem behaviors',!!rep&&probs.length>0,facts.behaviors.map(b=>b.label));
  ok('A: "Behavior the tokens are earned for" takes the defined replacement target, without "(replacement)": '+r.beh,r.beh==='Break request'&&r.input===r.beh,r);
  ok('A: ... and never a problem behavior',!probs.some(p=>r.beh.toLowerCase().indexOf(p.toLowerCase())>=0||p.toLowerCase().indexOf(r.beh.toLowerCase())>=0)&&!/aggress/i.test(r.beh),{beh:r.beh,probs});
  const want=expected(facts.menu),got=r.bk.filter(x=>x.n);
  ok('A: the backups are PA-1\'s ranked menu in rank order without its low-preference items: '+got.map(x=>x.n).join(', '),
    JSON.stringify(got.map(x=>x.n))===JSON.stringify(want.map(m=>m.name))&&want.length>0,{got:got.map(x=>x.n),want:want.map(m=>m.name)});
  ok('A: no low-preference item reaches the menu',!facts.menu.filter(LP).some(m=>got.some(x=>x.n===m.name)));
  ok('A: Preference (PA-1) holds the rank and tier ("Rank 1 (HP)")',got.every((x,i)=>x.pref==='Rank '+want[i].rank+' ('+want[i].tier+')'),got.map(x=>x.pref));
  ok('A: the class comes from PA-1\'s type',got.every((x,i)=>x.c===(CLS[want[i].type]||'')),got.map((x,i)=>[x.c,want[i].type]));
  ok('A: token cost, the RA-1 answer and the notes are left to the BCBA',got.every(x=>!x.cost&&!x.conf&&!x.note));
  ok('A: the menu keeps the form\'s four rows at least',r.bk.length===Math.max(4,want.length),r.bk.length);
  ok('A: the fill reports the behavior and '+want.length+' backups, not the general fill',r.last&&r.last.filled===1+want.length&&!r.last.generic,r.last);
  ok('A: the packet still fills the student details',r.meta.client==='Jordan Rivera'&&r.meta.sid==='204417'&&r.meta.bcba==='J. Newsome'&&r.meta.setting==='Lincoln Elementary',r.meta);
  const extra=Object.keys(r.meta).filter(k=>!['client','sid','bcba','setting','beh'].includes(k)&&String(r.meta[k]||'').trim());
  ok('A: nothing else on the form is touched (schedules, thinning record, audit)',!extra.length&&r.thin.every(x=>Object.values(x).every(v=>!v))&&!Object.keys(r.aud).length,{extra,thin:r.thin,aud:r.aud});
  const gen=await te.evaluate(()=>document.querySelector('#genMetrics').textContent.replace(/\s+/g,' '));
  ok('A: the generality figures count the backups placed',new RegExp('Backups listed\\s*'+want.length).test(gen),gen);
  const btn=await te.evaluate(()=>document.querySelector('#nbhCaseBtn').textContent);
  ok('A: the toolbar\'s From the case button is shown and marked used',/^From the case: /.test(btn)&&await te.evaluate(()=>document.querySelector('#nbhCaseBtn').classList.contains('nbhc-on')),btn);
  const s0=await te.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>pushFactsToAll());await sleep(1500);
  ok('A: a later push of the case changes nothing',(await te.evaluate(()=>JSON.stringify(S)))===s0);
  await page.screenshot({path:OUT+'A-te1-setup.png'});
  await te.evaluate(()=>setView('gen'));await sleep(200);await page.screenshot({path:OUT+'A-te1-backups.png'});await te.evaluate(()=>setView('setup'));

  /* F: the link with TK-1, both forms filled from the case */
  const tk=await openIn(page,'TK-1');
  await tk.waitForFunction(()=>!!(window.nbhCase&&nbhCase.last),null,{timeout:20000});await sleep(800);
  const tk0=await tk.evaluate(()=>({ch:S.ch.map(c=>c.l||''),tg:S.tg.map(c=>c.l||'')}));
  ok('F: TK-1 takes its choice cards and targets from the case as before',tk0.ch.filter(Boolean).length>=want.length&&tk0.tg.some(Boolean),tk0);
  await tk.evaluate(()=>{setView('setup');document.querySelector('#lkPanel [data-lk="on"]').click();});
  await tk.waitForFunction(()=>nbhLink.state().table,null,{timeout:20000}).catch(()=>{});
  const tkS=await sNoLk(tk),teS=await sNoLk(te);
  await page.evaluate(()=>openForm('TE-1'));await sleep(300);
  await te.evaluate(()=>{document.querySelector('#lkPanel [data-lk="on"]').click();});
  await te.waitForFunction(()=>nbhLink.state().table,null,{timeout:20000}).catch(()=>{});
  const ls=await te.evaluate(()=>nbhLink.state()),rows=await te.evaluate(()=>{const o={};nbhLink.rows().forEach(r=>{o[r.key]=r;});return o;});
  ok('F: TE-1 compares with the TK-1 open in the workstation, through the relay',ls.table&&ls.lk&&ls.lk.last&&ls.lk.last.via==='shell',ls.lk);
  ok('F: the student reads in step',rows.who&&rows.who.st===1,rows.who);
  ok('F: the behavior reads in step with the book\'s target card ('+(rows.beh&&rows.beh.there)+')',rows.beh&&rows.beh.st===1,rows.beh);
  const cards=tk0.ch.filter(Boolean),missing=cards.filter(c=>!got.some(x=>x.n.toLowerCase()===c.toLowerCase()));
  const lpNames=facts.menu.filter(m=>LP(m)||m.rank==null).map(m=>m.name);
  /* TK-1 takes its first six by rank, low-preference items included (a matter for TK-1's own fill): any card missing here
     can only be one of those, offered unticked; with none missing, the menu reads in step */
  ok('F: a choice card the book has and this menu lacks is one of PA-1\'s low-preference or unranked items ('+(missing.join(', ')||'none')+'), offered unticked',
    !!rows.menu&&missing.every(c=>lpNames.includes(c))&&(missing.length?rows.menu.st===7&&rows.menu.take&&rows.menu.pressed==='':rows.menu.st===1),{menu:rows.menu,missing,lpNames});
  ok('F: the compare changes nothing on either form but the link record',(await sNoLk(te))===teS&&(await sNoLk(tk))===tkS);
  await ctx.close();}

 /* ---------- B and E: a TE-1 typed by hand first; then the case; then From the case ---------- */
 {const {ctx,page}=await shell(br);
  const te=await openIn(page,'TE-1');
  await typeIn(te,'[data-m="beh"]','Completes a math worksheet');
  await typeIn(te,BK(0,'n'),'Stickers');await typeIn(te,BK(1,'n'),'Bubbles');await typeIn(te,BK(1,'pref'),'chosen at home');
  const bk0=await te.evaluate(()=>JSON.stringify(S.bk));
  for(const id of ['TB-1','GB-1','PA-1']){const fr=await openIn(page,id);await sim(fr);}
  await factsHave(page,['behaviors','menu','goals']);
  await te.waitForFunction(()=>!!(window.nbhCase&&nbhCase.facts&&(nbhCase.facts.menu||[]).length&&nbhCase.facts.goals&&nbhCase.last),null,{timeout:20000});await sleep(1500);
  let r=await teRead(te);
  ok('B: a typed behavior is kept when the case arrives',r.beh==='Completes a math worksheet',r.beh);
  ok('B: typed backups are left alone: the menu is exactly as typed',JSON.stringify(r.bk)===bk0,r.bk);
  ok('B: the report says why',r.last&&r.last.filled===0&&/backup menu is already begun/.test(r.last.note||''),r.last);
  await typeIn(te,'[data-m="beh"]','');await page.evaluate(()=>pushFactsToAll());await sleep(1500);
  r=await teRead(te);
  ok('B: with the behavior emptied, the next push fills it with the replacement ('+r.beh+'); the typed backups stay as typed',r.beh==='Break request'&&JSON.stringify(r.bk)===bk0,r);
  const facts=await page.evaluate(()=>state.facts);
  /* Form GB-1's first skill objective as this form takes it: its words without the staff note, the first letter a capital
     ("hand the break card to an adult (simulated)" is "Hand the break card to an adult") */
  const acqWant=(s=>{s=String(s||'').replace(/\s*\((?:simulated|see\b[^)]*|replacement)\)/gi,'').replace(/\s+/g,' ').trim();return s.charAt(0).toUpperCase()+s.slice(1);})((((facts.goals||{}).acq||[])[0]||{}).beh);

  /* E: the list */
  let P=await pickerOpen(page,te);
  const it=(k,i)=>P.items.find(x=>x.kind===k&&x.i===i);
  const bi=facts.behaviors.map((b,i)=>[b,i]),repI=bi.find(([b])=>b.isRep)[1],probI=bi.filter(([b])=>!b.isRep&&b.rep).map(([,i])=>i);
  ok('E: the list opens',P.open&&P.items.length>0,P);
  /* the field holds "Break request" (the push above): a replacement that reads the same is already the behavior here; any
     other would go here once the field is cleared, and the line says so (Use never replaces what the field holds) */
  const FLD='Break request',probLine=t=>'A behavior to reduce: its replacement, “'+t+'”, '+(t===FLD?'is already the behavior the tokens are earned for here.':
    'would go here as the behavior the tokens are earned for, but the field already reads “'+FLD+'”; clear it first.');
  ok('E: each problem behavior with a replacement names it: already the behavior here, or would go here once the field is cleared; unticked',
    probI.length>0&&probI.every(i=>{const x=it('beh',i),m=/^A behavior to reduce: its replacement, “(.+?)”, /.exec(x.own);return !!m&&x.own===probLine(m[1])&&!x.checked&&!x.disabled;}),probI.map(i=>it('beh',i)));
  ok('E: the replacement target already in the field says so, unticked',/^Already the behavior the tokens are earned for here\.$/.test(it('beh',repI).own)&&!it('beh',repI).checked,it('beh',repI));
  const red=P.items.filter(x=>x.kind==='red'),acq=P.items.filter(x=>x.kind==='acq');
  ok('E: a reduction goal is shown unticked and disabled, with the reason',red.length>0&&red.every(x=>!x.checked&&x.disabled&&/tokens are earned for a behavior to increase/.test(x.own)),red);
  ok('E: a skill objective, with the field filled, says it would go here once the field is cleared ('+acqWant+'), unticked',!!acqWant&&acq.length>0&&
    acq[0].own==='“'+acqWant+'” would go here as the behavior the tokens are earned for, but the field already reads “'+FLD+'”; clear it first.'&&!acq[0].checked,acq);
  const mi=P.items.filter(x=>x.kind==='menu'),M=facts.menu;
  ok('E: (the typed "Bubbles" is a ranked item on PA-1\'s simulated menu)',M.some(m=>m.name==='Bubbles'&&m.rank!=null&&!LP(m)),M.map(m=>m.name));
  ok('E: the menu: the item already typed says so, unticked; the other ranked items are ticked and say how they go in; low-preference and unranked ones are not ticked, and say the fill leaves them out',
    mi.some(x=>LP(M[x.i]))&&mi.every(x=>{const m=M[x.i];
      if(m.name==='Bubbles')return !x.checked&&x.own==='Already on the backup menu.';
      if(m.rank==null)return !x.checked&&x.own==='Not yet ranked on Form PA-1: the fill leaves it out; tick it to add it anyway.';
      if(LP(m))return !x.checked&&x.own==='Low preference on Form PA-1: the fill leaves it out; tick it to add it anyway.';
      return x.checked&&x.own==='Goes on the backup menu, with “Rank '+m.rank+' ('+m.tier+')” under Preference (PA-1).';}),mi.map(x=>[x.name,x.checked,x.own]));
  await page.screenshot({path:OUT+'E-picker.png'});
  let t=await useTicked(te);r=await teRead(te);
  const add=expected(M).filter(m=>m.name!=='Bubbles');
  ok('E: Use adds the ticked reinforcers in rank order after the typed rows, filling the empty rows first: '+t,
    t==='Placed '+add.length+(add.length===1?' item':' items')+' on this form.'&&r.bk[0].n==='Stickers'&&r.bk[1].n==='Bubbles'&&r.bk[1].pref==='chosen at home'&&
    JSON.stringify(r.bk.slice(2).filter(x=>x.n).map(x=>x.n))===JSON.stringify(add.map(m=>m.name))&&r.bk.length===Math.max(4,2+add.length),{t,bk:r.bk.map(x=>x.n)});
  ok('E: the added rows hold the rank and tier',r.bk.slice(2).filter(x=>x.n).every((x,i)=>x.pref==='Rank '+add[i].rank+' ('+add[i].tier+')'));
  P=await pickerOpen(page,te);
  ok('E: opened again, the reinforcers just added read "Already on the backup menu"',P.items.filter(x=>x.kind==='menu'&&add.some(m=>m.name===x.name.replace(/^\d+\.\s*/,''))).every(x=>x.own==='Already on the backup menu.'&&!x.checked));
  await tickOnly(te,[['menu',M.findIndex(m=>m.name==='Bubbles')]]);t=await useTicked(te);
  ok('E: a reinforcer already on the menu is not added twice',/^Nothing to place: a ticked reinforcer is on the backup menu already\.$/.test(t)&&(await teRead(te)).bk.length===r.bk.length,t);
  /* a typed behavior is never replaced */
  await typeIn(te,'[data-m="beh"]','Completes a math worksheet');
  P=await pickerOpen(page,te);await tickOnly(te,[['acq',0]]);t=await useTicked(te);
  ok('E: a ticked objective never replaces a typed behavior, and the note says so',(await teRead(te)).beh==='Completes a math worksheet'&&
    t==='Nothing to place: “Behavior the tokens are earned for” already reads “Completes a math worksheet”; clear it first to put “'+acqWant+'” there.',t);
  /* an empty field: the fill's own choice is ticked; a problem behavior ticked gives its replacement */
  await typeIn(te,'[data-m="beh"]','');
  P=await pickerOpen(page,te);
  ok('E: with the field empty, the fill\'s own choice is ticked (the defined replacement target) and no problem behavior',it('beh',repI).checked&&probI.every(i=>!it('beh',i).checked),P.items.filter(x=>x.kind==='beh'));
  ok('E: ... and the skill objective says it goes here ('+acqWant+')',(P.items.find(x=>x.kind==='acq')||{}).own==='Goes here as the behavior the tokens are earned for: “'+acqWant+'”.',P.items.filter(x=>x.kind==='acq'));
  await tickOnly(te,[['beh',probI[0]]]);t=await useTicked(te);
  ok('E: '+facts.behaviors[probI[0]].label+' ticked: its replacement goes in, under the defined target\'s name ("see target 4")',(await teRead(te)).beh==='Break request'&&t==='Placed 1 item on this form.',{t,beh:(await teRead(te)).beh});
  await typeIn(te,'[data-m="beh"]','');
  P=await pickerOpen(page,te);await tickOnly(te,[['acq',0]]);t=await useTicked(te);
  ok('E: the skill objective ticked: its words go in, without "(simulated)"',(await teRead(te)).beh===acqWant&&!/simulated/i.test(acqWant)&&t==='Placed 1 item on this form.',{t,acqWant});
  await typeIn(te,'[data-m="beh"]','');
  P=await pickerOpen(page,te);await te.evaluate(()=>{document.querySelectorAll('#nbhcBody input').forEach(c=>{c.checked=false;});const c=document.querySelector('#nbhcBody input[data-kind="red"]');c.disabled=false;c.checked=true;});
  t=await useTicked(te);
  ok('E: a reduction goal forced through places nothing, and says why',(await teRead(te)).beh===''&&/^Nothing to place: a reduction goal is not placed here: tokens are earned for a behavior to increase\.$/.test(t),t);
  const lpI=M.findIndex(LP),nb=(await teRead(te)).bk.filter(x=>x.n).length;
  P=await pickerOpen(page,te);await tickOnly(te,[['menu',lpI]]);t=await useTicked(te);r=await teRead(te);
  ok('E: a low-preference item ticked by hand goes in, marked as such',r.bk.filter(x=>x.n).length===nb+1&&r.bk.some(x=>x.n===M[lpI].name&&x.pref==='Rank '+M[lpI].rank+' (LP)'),{t,bk:r.bk.map(x=>x.n+'|'+x.pref)});
  await ctx.close();}

 /* ---------- C: the day lens's path: TB-1, then FS-1 concludes, then TE-1 ---------- */
 {const {ctx,page}=await shell(br);await bar(page);
  const tb=await openIn(page,'TB-1');await sim(tb);await factsHave(page,['behaviors']);
  const fs1=await openIn(page,'FS-1');await sleep(800);await sim(fs1);await factsHave(page,['behaviors','fn']);await sleep(1000);
  const te=await openIn(page,'TE-1');
  await te.waitForFunction(()=>!!(window.nbhCase&&nbhCase.last&&nbhCase.facts&&nbhCase.facts.fn),null,{timeout:20000});await sleep(500);
  const r=await teRead(te);
  ok('C: after FS-1 concludes, a fresh TE-1 takes the replacement, not "Aggression": '+r.beh,r.beh==='Break request'&&!/aggress/i.test(r.input),r.beh);
  ok('C: with no PA-1 in the case, the backups stay empty',r.bk.every(x=>!x.n&&!x.pref&&!x.c),r.bk);
  const P=await pickerOpen(page,te),fn=P.items.find(x=>x.kind==='fn');
  ok('C: the function has no field here: unticked and disabled, with the reason',!!fn&&!fn.checked&&fn.disabled&&fn.own==='Not placed on this form: it has no field for the function.',fn);
  await te.evaluate(()=>{const d=document.querySelector('#nbhCaseDlg');if(d&&d.open)d.close();});
  /* the warning, in the workstation: a problem behavior of the case typed in the field */
  const facts=await page.evaluate(()=>state.facts),pb=(facts.behaviors.find(b=>!b.isRep)||{}).label||'';
  ok('C: no warning under the field while it holds the replacement',await te.evaluate(()=>{const w=document.querySelector('#teBehWarn');return !w||w.hidden;}));
  await typeIn(te,'[data-m="beh"]',pb);
  const w1=await te.evaluate(()=>{const w=document.querySelector('#teBehWarn');return w&&!w.hidden&&w.getClientRects().length?w.textContent:'';});
  ok('C: "'+pb+'" typed in the field: a warning under it names it as a problem behavior on Form TB-1, with the replacement to use',
    !!pb&&w1==='This plan’s behavior, “'+pb+'”, is a problem behavior on Form TB-1. Tokens are earned for a behavior to increase, such as “'+r.beh+'”; correct it here.',w1);
  await typeIn(te,'[data-m="beh"]','Requests a break using the card');
  ok('C: a behavior to increase typed in its place: no warning',await te.evaluate(()=>{const w=document.querySelector('#teBehWarn');return !!w&&w.hidden&&!document.querySelector('[data-m="beh"]').hasAttribute('aria-describedby');}));
  await ctx.close();}

 /* ---------- D: the rules, on a standalone TE-1 ---------- */
 {const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const run=f=>p.evaluate(f=>{S=blank();renderAll();const rep=nbhCase.apply(f);return {beh:S.meta.beh||'',bk:S.bk.filter(r=>r.n).map(r=>[r.n,r.c,r.pref]),rep};},f);
  let x;
  x=await run({behaviors:[T('Aggression',{rep:'Asks for help'}),R('Break request (replacement)')],goals:{red:[],acq:[{beh:'complete five problems'}]}});
  ok('D: a defined replacement target comes before a paired replacement and an objective',x.beh==='Break request',x);
  x=await run({behaviors:[T('Elopement'),T('Arranging and ordering (higher-level RRB)',{rep:'Engages with a competing item from the A-CSA list (see Forms EA-1 and TD-1)'})],goals:{red:[],acq:[{beh:'complete five problems'}]}});
  ok('D: else the first paired replacement, its staff note dropped',x.beh==='Engages with a competing item from the A-CSA list',x);
  x=await run({behaviors:[T('Aggression',{rep:'Hands a break card and waits (see target 2)'}),R('Break request (replacement)'),T('Elopement',{rep:'Hands a break card and waits'})]});
  ok('D: a paired replacement pointing to the defined target is that target',x.beh==='Break request',x);
  x=await run({behaviors:[T('Elopement')],goals:{red:[{beh:'Elopement'}],acq:[{beh:'raise a hand and wait to be called on (simulated)'}]}});
  ok('D: else Form GB-1\'s first skill objective, capitalised, "(simulated)" dropped',x.beh==='Raise a hand and wait to be called on',x);
  x=await run({behaviors:[T('Screaming',{rep:'Requests a break (FCR)'})]});
  ok('D: the label\'s own brackets stay',x.beh==='Requests a break (FCR)',x);
  x=await run({behaviors:[T('Screaming',{rep:'Elopement'}),T('Elopement')],goals:{red:[],acq:[{beh:'Hitting peers when told no'},{beh:'use the calm-down corner'}]}});
  ok('D: a candidate that is one of the case\'s problem behaviors, or names one, is passed over',x.beh==='Use the calm-down corner',x);
  x=await run({behaviors:[T('Aggression',{rep:'Keeps hands to self (no hitting, kicking, or biting)'})]});
  ok('D: a replacement that names problem words only to rule them out ("no hitting, kicking, or biting") is placed',x.beh==='Keeps hands to self (no hitting, kicking, or biting)',x);
  x=await run({behaviors:[T('Aggression',{rep:'Safe hands: no hitting, kicking or biting'})]});
  ok('D: ... and the same after a colon ("Safe hands: no hitting, kicking or biting")',x.beh==='Safe hands: no hitting, kicking or biting',x);
  x=await run({behaviors:[T('Aggression',{rep:'Hitting stops; asks for a break'}),T('Elopement',{rep:'Asks for help'})]});
  ok('D: ... but a problem word with nothing earlier in its clause to turn it round is still passed over',x.beh==='Asks for help',x);
  x=await run({behaviors:[T('Aggression',{rep:'See-saw turn taking with a peer'})]});
  ok('D: a replacement that begins "See-" is not a staff note ("See-saw turn taking with a peer")',x.beh==='See-saw turn taking with a peer',x);
  x=await run({behaviors:[T('Aggression',{rep:'see the note'}),T('Elopement',{rep:'Requests a break (see the BIP)'})]});
  ok('D: a pointer ("see the note") is not a behavior, and a bracket that begins "see" is a staff note ("(see the BIP)")',x.beh==='Requests a break',x);
  x=await run({behaviors:[T('Elopement')],goals:{red:[],acq:[{beh:'iPad requests using the AAC device'}]}});
  ok('D: a first word not all in lower case keeps its letters ("iPad requests using the AAC device")',x.beh==='iPad requests using the AAC device',x);
  const pk2=await p.evaluate(()=>{S=blank();renderAll();return window.__nbhFactsPick({behaviors:[{label:'Aggression',isRep:false,src:'TB-1'},{label:'Elopement',isRep:false,src:'TB-1'}],goals:{red:[],acq:[]},menu:[]});});
  ok('D: Use with two problem behaviors that name no replacement: the note says so, in the plural',pk2.filled===0&&pk2.note==='2 ticked behaviors are behaviors to reduce with no replacement named, so nothing went in for them.',pk2);
  x=await run({behaviors:[T('Aggression'),T('Elopement',{rep:'— this is the replacement behavior'})],goals:{red:[{beh:'Aggression'}],acq:[]}});
  ok('D: a case with no replacement or skill leaves the field empty (the general fill put "Aggression" here), and says why',x.beh===''&&x.rep.filled===0&&!x.rep.generic&&/no replacement or skill/.test(x.rep.note||''),x);
  x=await run({behaviors:[{label:'Aggression',src:'FS-1',fn:'Escape',rep:'Asks for a break using the card',alt:'Asks for a break using the card'}]});
  ok('D: Form FS-1\'s behaviors (TB-1 not open): the alternative behavior',x.beh==='Asks for a break using the card',x);
  x=await run({behaviors:[{label:'Aggression',def:'',type:'cluster',src:'TB-1 (candidate)'},{label:'Requests a break',def:'',type:'replacement',src:'TB-1 (candidate)'}]});
  ok('D: a TB-1 candidate marked Target – replacement counts as the replacement',x.beh==='Requests a break',x);
  x=await run({behaviors:[{label:'Probe behavior',def:'a probe'}],fn:{key:'escape',label:'Escape / avoidance (social negative)'},src:{behaviors:'TB-1',fn:'FS-1'}});
  ok('D: the all-forms probe (a bare behavior): nothing placed, and not by the general fill',x.beh===''&&x.rep.filled===0&&!x.rep.generic,x);
  const menu=[{name:'Blocks',type:'Leisure item',rank:5,tier:'LP'},{name:'Praise',type:'Social',rank:2,tier:'HP'},{name:'Chips',type:'Edible',rank:1,tier:'HP'},
    {name:'Puzzle',type:'Activity',rank:3,tier:'MP'},{name:'New item',type:'Other',rank:null,tier:''},{name:'chips',type:'Edible',rank:4,tier:'MP'},{name:'Spinner',type:'Gadget',rank:4,tier:'MP'}];
  x=await run({menu});
  ok('D: the menu in rank order, one row per name, no unranked or low-preference item, PA-1\'s types as classes',JSON.stringify(x.bk)===JSON.stringify([
    ['Chips','Edible','Rank 1 (HP)'],['Praise','Social / attention','Rank 2 (HP)'],['Puzzle','Activity','Rank 3 (MP)'],['Spinner','','Rank 4 (MP)']]),x.bk);
  x=await run({menu:[{name:'Blocks',rank:3,tier:'LP'},{name:'New item',rank:null,tier:''}]});
  ok('D: a menu with nothing ranked above the low third places nothing, and says why',!x.bk.length&&x.rep.filled===0&&/ranked no item above its low-preference third/.test(x.rep.note||''),x);
  const many=Array.from({length:9},(_,i)=>({name:'Item '+(i+1),type:'Activity',rank:i+1,tier:i<3?'HP':i<6?'MP':'LP'}));
  x=await run({menu:many});
  ok('D: more ranked items than the four rows: rows are added',x.bk.length===6&&x.bk[5][0]==='Item 6',x.bk);
  await ctx.close();}

 /* ---------- G: files saved before; save and open; Load simulation asks first ---------- */
 {const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const openText=(t,n)=>openFile(p,t,n);
  const oldPath=path.join(OLD,'TE-1.json');
  if(fs.existsSync(oldPath)){const old=fs.readFileSync(oldPath,'utf8'),o=JSON.parse(old);
    await openText(old,'TE-1.json');
    const s=await p.evaluate(()=>JSON.parse(JSON.stringify(S)));
    ok('G: the audit\'s saved TE-1 opens: its behavior and its '+o.S.bk.length+' backups',s.meta.beh===o.S.meta.beh&&JSON.stringify(s.bk.map(b=>b.n))===JSON.stringify(o.S.bk.map(b=>b.n)),{beh:s.meta.beh,bk:s.bk.map(b=>b.n)});
    const s1=await p.evaluate(()=>JSON.stringify(S));
    const rep=await p.evaluate(f=>nbhCase.apply(f),factsA);
    ok('G: the case changes nothing in it',(await p.evaluate(()=>JSON.stringify(S)))===s1&&rep.filled===0,rep);}
  else ok('G: the saved TE-1 from before this change is at '+oldPath+' (set OLDSAVE to its folder)',false);
  /* a case-filled TE-1 saves and opens back the same */
  await p.evaluate(()=>{S=blank();renderAll();});await p.evaluate(f=>nbhCase.apply(f),factsA);
  const saved=await caught(p,'#saveBtn');
  const sv=JSON.parse(saved),s2=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>{S=blank();renderAll();});await openText(saved,'TE-1_round.json');
  ok('G: a case-filled TE-1 saves and opens back the same',sv.form==='TE-1'&&sv.S.meta.beh==='Break request'&&(await p.evaluate(()=>JSON.stringify(S)))===s2);
  /* its Save packet: the student's details, and no target behavior (this form's behavior is the one to increase), so Form
     TD-1's Open packet leaves its target behavior empty */
  await typeIn(p,'[data-m="client"]','Jordan Rivera');await typeIn(p,'[data-m="sid"]','204417');
  const pkt=await caught(p,'Save packet'),pko=JSON.parse(pkt).packet||{};
  ok('G: Save packet from a case-filled TE-1 writes the student\'s details and no target behavior',pko.client==='Jordan Rivera'&&pko.sid==='204417'&&!('beh' in pko)&&(await p.evaluate(()=>S.meta.beh))==='Break request',pko);
  {const q=await ctx.newPage();wire(q,log);await q.goto(BASE+'/'+ED+'/'+FILE['TD-1']);await sleep(700);
   const td=await q.evaluate(async t=>{let msg='';window.alert=m=>{msg=String(m);};const ob=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open packet');
     const inp=[...ob.parentElement.querySelectorAll('input[type="file"]')].pop();const dt=new DataTransfer();dt.items.add(new File([t],'PACKET_Jordan_Rivera.json',{type:'application/json'}));
     inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,700));
     const M=window.__nbhPacketMap||{};let beh=null;for(const s of (M.beh||[])){const e=document.querySelector(s);if(e&&e.tagName!=='BUTTON'){beh=e.value;break;}}return {msg,beh};},pkt);
   await q.close();
   ok('G: ... and Form TD-1\'s Open packet with it fills the student and leaves TD-1\'s target behavior empty',td.beh===''&&/Filled: Student, Student ID\./.test(td.msg),td);}
  /* the form's own Open packet, with a packet saved by a form whose target behavior is the problem behavior */
  await p.evaluate(()=>{S=blank();renderAll();});
  const pk=await p.evaluate(async t=>{let msg='';const a=window.alert;window.alert=m=>{msg=String(m);};
    try{const ob=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open packet');
      const inp=[...ob.parentElement.querySelectorAll('input[type="file"]')].find(i=>i.id!=='fileIn');
      const dt=new DataTransfer();dt.items.add(new File([t],'PACKET_Jordan_Rivera.json',{type:'application/json'}));inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(r=>setTimeout(r,600));}finally{window.alert=a;}
    return {msg,beh:S.meta.beh||'',field:document.querySelector('[data-m="beh"]').value,client:S.meta.client||'',sid:S.meta.sid||''};},
    JSON.stringify({form:'PACKET',rev:'2026-09',saved:'2026-10-04T08:00:00.000Z',packet:{client:'Jordan Rivera',sid:'204417',beh:'Aggression'}}));
  ok('G: Open packet with another form\'s packet: the details are filled, its target behavior ("Aggression") is not, and the message says so',
    pk.client==='Jordan Rivera'&&pk.sid==='204417'&&pk.beh===''&&pk.field===''&&/The target behavior in the packet was not placed/.test(pk.msg),pk);
  /* Load simulation asks first; Cancel keeps every field (window.confirm is not stubbed on this page, so the styled
     question shows) */
  const vals=()=>p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='file'&&!e.closest('#nbhUiDlg,#nbhCaseDlg')).map(e=>e.type==='checkbox'?e.checked:e.value).join('\u0001'));
  const v0=await vals();
  await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);
  const q=await p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?{b:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)}:null;});
  ok('G: Load simulation asks first, saying what is entered will be replaced',!!q&&/will be replaced/.test(q.b)&&q.btns.includes('Cancel'),q);
  if(q){await p.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiF button')].find(b=>b.textContent==='Cancel');b.click();});await sleep(300);}
  ok('G: Cancel keeps every field',(await vals())===v0);
  await ctx.close();}

 /* ---------- H: while untouched, the fill follows the case (the workstation; TE-1 open first) ---------- */
 {const {ctx,page}=await shell(br);await bar(page);
  const te=await openIn(page,'TE-1');await sleep(800);
  const tb=await openIn(page,'TB-1');await sleep(800);
  const tput=(sel,v)=>tb.evaluate(([s,v])=>{const e=document.querySelector(s);e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
  const teBeh=v=>te.waitForFunction(v=>(S.meta.beh||'')===v,v,{timeout:30000}).then(()=>true,()=>false);
  await tput('[name="tgt[0].lab"]','Aggression');
  await tb.evaluate(()=>{const s=document.querySelector('[name="tgt[0].type"]');const o=[...s.options].find(o=>/Single/.test(o.textContent));s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));});
  await tput('[name="tgt[0].rep"]','Hands a br');
  ok('H: Form TB-1\'s paired replacement typed half-way, with a pause: TE-1 takes what is there ("Hands a br")',await teBeh('Hands a br'),await te.evaluate(()=>S.meta.beh));
  await tput('[name="tgt[0].rep"]','Hands a break card and waits');
  ok('H: ... and, the fill\'s own value untouched, follows when the typing is finished ("Hands a break card and waits")',await teBeh('Hands a break card and waits'),await te.evaluate(()=>S.meta.beh));
  const pa=await openIn(page,'PA-1');await sleep(800);
  const names=['Tablet (video)','Bubbles','Squeeze ball','Picture book','Musical toy','Blocks'];
  await pa.evaluate(n=>{const ins=[...document.querySelectorAll('#poolTbl input[data-f="name"]')];n.forEach((v,i)=>{const e=ins[i];if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});},names);
  /* the menu once PA-1 reads it, the shell holds it and TE-1 was given it, all three the same: [name, rank, tier] */
  const MK=m=>((m||[]).map(x=>[x.name,x.rank,x.tier]));
  const settled=async test=>{const t0=Date.now();while(Date.now()-t0<45000){
      const a=JSON.stringify(MK(await pa.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();return (o&&o.menu)||[];})));
      const b=JSON.stringify(MK(await page.evaluate(()=>(state.facts&&state.facts.menu)||[])));
      const c=JSON.stringify(MK(await te.evaluate(()=>(window.nbhCase&&nbhCase.facts&&nbhCase.facts.menu)||[])));
      if(a===b&&b===c&&a!=='[]'&&test(JSON.parse(a)))return JSON.parse(a);await sleep(500);}return null;};
  const want=m=>(m||[]).filter(x=>x[1]!=null&&x[2]!=='LP').sort((a,b)=>a[1]-b[1]).map(x=>[x[0],'Rank '+x[1]+' ('+x[2]+')']);
  const placed=async()=>(await teRead(te)).bk.filter(x=>x.n).map(x=>[x.n,x.pref]);
  const m0=await settled(m=>m.length===names.length);
  ok('H: PA-1\'s pool typed, nothing ranked yet: the backups stay empty',!!m0&&!want(m0).length&&!(await placed()).length,{m0,bk:await placed()});
  await pa.evaluate(()=>{const s=document.querySelector('#msTbl select[data-s="0"][data-t="0"]');const o=[...s.options].find(o=>/Squeeze/.test(o.textContent));s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});
  const m1=await settled(m=>want(m).length>0);
  ok('H: one MSWO pick made: the backups take PA-1\'s ranking as it stands ('+want(m1).map(x=>x[0]).join(', ')+')',!!m1&&JSON.stringify(await placed())===JSON.stringify(want(m1)),{m1,bk:await placed()});
  await sim(pa);
  const m2=await settled(m=>m.every(x=>x[1]!=null)&&JSON.stringify(m)!==JSON.stringify(m1));
  let r=await teRead(te);
  ok('H: the rest of the assessment: the fill\'s own rows, untouched, follow to the final ranking ('+want(m2).map(x=>x[0]).join(', ')+'), in the form\'s four rows and more',
    !!m2&&JSON.stringify(await placed())===JSON.stringify(want(m2))&&r.bk.length===Math.max(4,want(m2).length),{m1,m2,bk:await placed(),n:r.bk.length});
  await te.evaluate(()=>setView('gen'));await typeIn(te,BK(0,'cost'),'2 stars');
  const bk2=await te.evaluate(()=>JSON.stringify(S.bk)),first=(want(m2)[0]||[''])[0];
  await pa.evaluate(n=>{const e=[...document.querySelectorAll('#poolTbl input[data-f="name"]')].find(e=>e.value===n);if(!e)return;e.value=n+' (new)';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},first);
  const m3=await settled(m=>m.some(x=>x[0]===first+' (new)'));
  ok('H: a token cost typed in TE-1 ends it: an item renamed on PA-1 afterwards leaves the backups as they were, the cost kept',
    !!m3&&(await te.evaluate(()=>JSON.stringify(S.bk)))===bk2&&JSON.parse(bk2)[0].cost==='2 stars'&&JSON.parse(bk2)[0].n===first,{m3,bk:(await teRead(te)).bk.map(x=>x.n+'|'+x.cost)});
  await te.evaluate(()=>setView('setup'));await typeIn(te,'[data-m="beh"]','Hands a break card to an adult and waits');
  await tput('[name="tgt[0].rep"]','Hands the break card over');
  const got=await te.waitForFunction(()=>{const b=window.nbhCase&&nbhCase.facts&&(nbhCase.facts.behaviors||[])[0];return !!b&&/^Hands the break card over/.test(b.rep||'');},null,{timeout:30000}).then(()=>true,()=>false);
  ok('H: the behavior typed in TE-1 ends it for the behavior: TB-1\'s replacement changed again leaves it as typed',got&&(await te.evaluate(()=>S.meta.beh))==='Hands a break card to an adult and waits',await te.evaluate(()=>S.meta.beh));
  await ctx.close();}

 /* ---------- I: the rules of following the case, and the focus, on a standalone TE-1 ---------- */
 {const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const menuA=[{name:'Chips',type:'Edible',rank:1,tier:'HP'},{name:'Puzzle',type:'Activity',rank:2,tier:'MP'},{name:'Blocks',type:'Leisure item',rank:3,tier:'LP'}];
  const menuB=[{name:'Puzzle',type:'Activity',rank:1,tier:'HP'},{name:'Bubbles',type:'Leisure item',rank:2,tier:'HP'},{name:'Chips',type:'Edible',rank:3,tier:'MP'},
    {name:'Stickers',type:'Other',rank:4,tier:'MP'},{name:'Tablet',type:'Leisure item',rank:5,tier:'MP'},{name:'Blocks',type:'Leisure item',rank:6,tier:'LP'}];
  const fA={behaviors:[T('Aggression',{rep:'Hands a br'})],menu:menuA},fB={behaviors:[T('Aggression',{rep:'Hands a break card and waits'})],menu:menuB};
  const st=()=>p.evaluate(()=>({beh:S.meta.beh||'',input:document.querySelector('[data-m="beh"]').value,bk:S.bk.map(r=>[r.n,r.c,r.cost,r.pref].join('|')),n:S.bk.length,
    shown:[...document.querySelectorAll('#bkTbl [data-f="n"]')].map(e=>e.value)}));
  const apply=f=>p.evaluate(f=>nbhCase.apply(f),f),blankS=()=>p.evaluate(()=>{S=blank();renderAll();});
  const namesOf=x=>x.bk.map(r=>r.split('|')[0]).filter(Boolean);
  await blankS();let rep=await apply(fA),x=await st();
  ok('I: the first case: the replacement and the ranked menu go in',x.beh==='Hands a br'&&x.bk[0]==='Chips|Edible||Rank 1 (HP)'&&x.bk[1]==='Puzzle|Activity||Rank 2 (MP)'&&x.n===4&&rep.filled===3,{x,rep});
  rep=await apply(fB);x=await st();
  ok('I: a later case, the fill\'s values untouched: its choice now, the menu placed again (rows added as needed), on screen too',
    x.beh==='Hands a break card and waits'&&x.input===x.beh&&JSON.stringify(namesOf(x))===JSON.stringify(['Puzzle','Bubbles','Chips','Stickers','Tablet'])&&x.n===5&&
    JSON.stringify(x.shown)===JSON.stringify(namesOf(x))&&rep.filled===6,{x,rep});
  const xB=x;rep=await apply(fB);
  ok('I: the same case again changes nothing',rep.filled===0&&JSON.stringify(await st())===JSON.stringify(xB),rep);
  rep=await apply(fA);x=await st();
  ok('I: and back: the form\'s four rows again, as the fill found them',x.n===4&&JSON.stringify(namesOf(x))===JSON.stringify(['Chips','Puzzle'])&&x.beh==='Hands a br',x);
  await typeIn(p,BK(0,'cost'),'2 stars');rep=await apply(fB);x=await st();
  ok('I: a token cost typed: the backups stay as they are, cost and all; the behavior, untouched, still follows',
    x.bk[0]==='Chips|Edible|2 stars|Rank 1 (HP)'&&x.n===4&&x.beh==='Hands a break card and waits'&&/backup menu is already begun/.test(rep.note||''),{x,rep});
  await typeIn(p,'[data-m="beh"]','Hands the card over');await apply(fA);
  ok('I: the behavior typed: it stays as typed',(await st()).beh==='Hands the card over',await st());
  await blankS();await apply(fA);await p.evaluate(()=>document.querySelector('#addBk').click());await apply(fB);x=await st();
  ok('I: "Add backup" pressed: the menu stays as the fill left it',JSON.stringify(namesOf(x))===JSON.stringify(['Chips','Puzzle'])&&x.n===5,x);
  await blankS();await apply(fA);
  rep=await p.evaluate(()=>window.__nbhFactsPick({behaviors:[],goals:{red:[],acq:[]},menu:[{name:'Blocks',type:'Leisure item',rank:3,tier:'LP'}]}));
  await apply(fB);x=await st();
  ok('I: "Use the ticked items here": the fill no longer follows (behavior and menu stay, the ticked item added)',
    rep.filled===1&&x.beh==='Hands a br'&&JSON.stringify(namesOf(x))===JSON.stringify(['Chips','Puzzle','Blocks']),{rep,x});
  await blankS();await apply(fA);const sv=await caught(p,'#saveBtn');await blankS();await openFile(p,sv,'TE-1_again.json');await apply(fB);x=await st();
  ok('I: the same values saved and opened again: a later case leaves them as they are',x.beh==='Hands a br'&&JSON.stringify(namesOf(x))===JSON.stringify(['Chips','Puzzle'])&&x.n===4,x);
  await blankS();await apply(fA);rep=await apply({behaviors:[T('Aggression')],menu:[{name:'New item',type:'Other',rank:null,tier:''}]});x=await st();
  ok('I: a case with nothing ranked and no replacement never empties what the fill placed',x.beh==='Hands a br'&&JSON.stringify(namesOf(x))===JSON.stringify(['Chips','Puzzle'])&&rep.filled===0,{x,rep});
  /* the focus: a field being typed in when the case arrives (finding 4's three), and a backup cell with the focus as the menu is placed again */
  for(const [name,sel,view] of [['a schedule row','#thinTbl input','sch'],['the setting','[data-m="setting"]','setup'],['a backup note','#bkTbl [data-k="0"][data-f="note"]','gen']]){
    const f=await p.evaluate(([sel,facts,view])=>{S=blank();renderAll();setView(view);const e=document.querySelector(sel);
      e.focus();e.value='abc def';e.dispatchEvent(new Event('input',{bubbles:true}));e.setSelectionRange(3,3);
      nbhCase.apply(facts);const a=document.activeElement;return {same:a===e,inDoc:document.contains(e),caret:a===e?e.selectionStart:null,beh:S.meta.beh,v:e.value};},
      [sel,{behaviors:[T('Aggression',{rep:'Hands a break card (see target 2)'}),R('Break request (replacement)')]},view]);
    ok('I: the case arriving while '+name+' is typed in: the field keeps its focus, caret and text',f.same&&f.inDoc&&f.caret===3&&f.v==='abc def'&&f.beh==='Break request',f);
  }
  const g=await p.evaluate(([fA,fB])=>{S=blank();renderAll();setView('gen');nbhCase.apply(fA);const e=document.querySelector('#bkTbl [data-k="1"][data-f="n"]');e.focus();e.setSelectionRange(2,2);
    nbhCase.apply(fB);const a=document.activeElement;return {k:a&&a.dataset&&a.dataset.k,f:a&&a.dataset&&a.dataset.f,caret:a&&a.selectionStart,val:a&&a.value,redrawn:!document.contains(e)};},[fA,fB]);
  ok('I: a backup cell with the focus (nothing typed) as the menu is placed again: the same cell has it after, caret kept',g.redrawn&&g.k==='1'&&g.f==='n'&&g.caret===2&&g.val==='Bubbles',g);
  await ctx.close();}

 /* ---------- J: the warning while the field holds a problem behavior ---------- */
 {const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const caseF={behaviors:[T('Aggression',{rep:'Hands a break card and waits (see target 2)'}),R('Break request (replacement)')]};
  const W=()=>p.evaluate(()=>{const w=document.querySelector('#teBehWarn'),e=document.querySelector('[data-m="beh"]');
    return {shown:!!w&&!w.hidden&&w.getClientRects().length>0,text:w?w.textContent:'',noprint:!!w&&w.classList.contains('noprint'),desc:e.getAttribute('aria-describedby')||'',under:!!w&&w.previousElementSibling===e};});
  const NOTE='This plan’s behavior, “Aggression”, is a problem behavior on Form TB-1. Tokens are earned for a behavior to increase, such as “Break request”; correct it here.';
  const oldPath=path.join(OLD,'TE-1.json');
  if(!fs.existsSync(oldPath))ok('J: the saved TE-1 from before this change is at '+oldPath+' (set OLDSAVE to its folder)',false);
  else{const old=JSON.parse(fs.readFileSync(oldPath,'utf8'));old.S.meta.beh='Aggression';const oldA=JSON.stringify(old);
   await openFile(p,oldA,'TE-1_old_aggression.json');
   ok('J: a TE-1 saved with the old fill\'s "Aggression" opens with it; alone, with no case, it is not warned of (the common words are the link\'s guard)',(await p.evaluate(()=>S.meta.beh))==='Aggression'&&!(await W()).shown);
   const s0=await p.evaluate(()=>JSON.stringify(S)),rep=await p.evaluate(f=>nbhCase.apply(f),caseF);let w=await W();
   ok('J: the case names "Aggression" a problem behavior: a warning under the field, with the replacement to use; nothing is overwritten',
     w.shown&&w.under&&w.text===NOTE&&w.desc==='teBehWarn'&&rep.filled===0&&(await p.evaluate(()=>JSON.stringify(S)))===s0,{w,rep});
   await p.emulateMedia({media:'print'});const inPrint=await p.evaluate(()=>{const e=document.querySelector('#teBehWarn');return e?getComputedStyle(e).display:'no warning';});await p.emulateMedia({media:'screen'});
   const html=await p.evaluate(()=>new Promise(res=>{const h=e=>{if(e.data&&e.data.nbh==='payload'){window.removeEventListener('message',h);res(e.data.html||'');}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}));
   ok('J: ... on screen only: hidden in print, and left out of the workstation\'s packet',w.noprint&&inPrint==='none'&&html.length>0&&html.indexOf('id="teBehWarn"')<0&&html.indexOf('is a problem behavior on Form')<0,{inPrint,len:html.length});
   await p.evaluate(()=>{const g=document.querySelector('.nbh-case-grp');if(g)g.hidden=false;document.querySelector('#nbhCaseBtn').click();});await sleep(200);
   const top=await p.evaluate(()=>{const b=document.querySelector('#nbhcBody'),f=b&&b.firstElementChild;return f&&f.classList.contains('nbhc-warn')?f.textContent:'';});
   ok('J: the "From the case" list repeats it at the top',top===NOTE,top);
   await p.evaluate(()=>document.querySelector('#nbhCaseDlg').close());
   await typeIn(p,'[data-m="beh"]','Requests a break using the card');w=await W();
   ok('J: a behavior to increase typed in its place: the warning goes',!w.shown&&!w.desc,w);
   await openFile(p,oldA,'TE-1_old_aggression.json');w=await W();
   ok('J: the old file opened again, the case still here: the warning is back',w.shown&&w.text===NOTE,w);}
  const q=await ctx.newPage();wire(q,log);await q.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const s=await q.evaluate(()=>{S=blank();S.meta.beh='Aggression';S.meta.lk=JSON.stringify({v:1,on:0,base:{},pb:[NBHLink.hash(NBHLink.norm('Aggression'))]});renderAll();
    const w=document.querySelector('#teBehWarn');return w&&!w.hidden?w.textContent:'';});
  ok('J: open alone, a problem behavior the link saw at a compare (the record\'s hashes) is warned of',
    s==='This plan’s behavior, “Aggression”, is a problem behavior on Form TB-1 (the case named it at an earlier compare). Tokens are earned for a behavior to increase; correct it here.',s);
  await ctx.close();}

 const errs=log.filter(l=>(l.type==='pageerror'||l.type==='error')&&!/Failed to load resource: the server responded with a status of 404/.test(l.text));
 ok('no page or console errors',!errs.length,errs);
 await br.close();
 console.log(fails?fails+' FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(2);});
