/* Enhancement sprint, package A9: the token system names the behavior that earns tokens (Form TE-1).
   A. Form TB-1 and Form PA-1 simulated in the workstation, then a fresh TE-1: "Behavior the tokens are earned for" holds
      the case's replacement (TB-1's defined replacement target, without "(replacement)"), never a problem behavior; the
      backup menu holds PA-1's ranked menu in rank order without its low-preference items, with "Rank n (tier)" under
      Preference (PA-1) and the class from PA-1's type; the packet's details still arrive, nothing else on the form is
      touched, and a later push of the case changes nothing.
   B. A TE-1 with a typed behavior and typed backups, open before the case exists: both are left alone when the case
      arrives. With the behavior emptied, the next push fills it; the typed backups stay as typed.
   C. The day lens's path (scratchpad enhance/verify.js): TB-1 simulated, FS-1 opened and concluded, then TE-1: no
      "Aggression"; with no PA-1 the backups stay empty. The function has no field here: the list shows it disabled.
   D. The fill's rules on a standalone TE-1, through nbhCase.apply (the entry the shell's facts verb uses): a defined
      replacement target before a paired replacement before GB-1's skill objective; a paired replacement that points to the
      defined target ("see target 4") is that target; staff notes dropped, the label's own brackets kept; a candidate that
      names a problem behavior (the case's own, or the link guard's words) passed over; Form FS-1's alternative and a TB-1
      candidate marked replacement; unranked and low-preference items never placed; rank order, one row per name; a case
      with no replacement leaves the field empty (never the general fill's first behavior).
   E. From the case: the list says what each item gives here, ticks what the fill would take, disables a reduction goal;
      Use puts the ticked replacement into an empty behavior field (a problem behavior ticked gives its replacement),
      never replaces a typed behavior (and says so), adds the ticked reinforcers to empty rows, then new rows, and skips one
      already on the menu; a forced reduction goal places nothing.
   F. The link with Form TK-1 still works: TE-1 and TK-1 both filled from the case, both linked in the workstation: TE-1
      compares through the relay, the student and the behavior read in step, the menu row offers only the book's cards
      that are not backups here (PA-1's low-preference items), unticked; the compare changes nothing but the link record.
   G. Files saved before: the audit's saved TE-1 (oldsave/TE-1.json) opens unchanged, and the case changes nothing in it;
      a case-filled TE-1 saves and opens back the same. The form's own Open packet, with a packet another form saved
      (its target behavior "Aggression"), fills the student's details but not the behavior, and says so. Load simulation
      still asks first, and Cancel keeps every field.
   No page or console error anywhere.
   Run: WS_URL=http://127.0.0.1:8309 WS_ROOT=<worktree> node qa/sprint-a9-test.js [edition]
   (the edition folder: NBH-Workstation, the default, or RPS-Workstation) */
const {chromium,fs,path,BASE,forms,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a9/';
const OLD=process.env.OLDSAVE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/enhance/oldsave';
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
  ok('F: the menu row offers only the book\'s cards that are not backups here (PA-1\'s low-preference items: '+missing.join(', ')+'), unticked',
    !!rows.menu&&rows.menu.st===7&&rows.menu.take&&rows.menu.pressed===''&&missing.length>0&&missing.every(c=>lpNames.includes(c)),{menu:rows.menu,missing,lpNames});
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
  ok('E: each problem behavior with a replacement says its replacement goes here, unticked',probI.every(i=>/^A behavior to reduce: its replacement, “.+”, (goes here|is already)/.test(it('beh',i).own)&&!it('beh',i).checked&&!it('beh',i).disabled),probI.map(i=>it('beh',i)));
  ok('E: the replacement target already in the field says so, unticked',/^Already the behavior the tokens are earned for here\.$/.test(it('beh',repI).own)&&!it('beh',repI).checked,it('beh',repI));
  const red=P.items.filter(x=>x.kind==='red'),acq=P.items.filter(x=>x.kind==='acq');
  ok('E: a reduction goal is shown unticked and disabled, with the reason',red.length>0&&red.every(x=>!x.checked&&x.disabled&&/tokens are earned for a behavior to increase/.test(x.own)),red);
  ok('E: a skill objective says what goes here ('+acqWant+')',!!acqWant&&acq.length>0&&acq[0].own==='Goes here as the behavior the tokens are earned for: “'+acqWant+'”.',acq);
  const mi=P.items.filter(x=>x.kind==='menu'),M=facts.menu;
  ok('E: (the typed "Bubbles" is a ranked item on PA-1\'s simulated menu)',M.some(m=>m.name==='Bubbles'&&m.rank!=null&&!LP(m)),M.map(m=>m.name));
  ok('E: the menu: the item already typed says so, unticked; the other ranked items are ticked; low-preference ones are not',
    mi.every(x=>{const m=M[x.i];if(m.name==='Bubbles')return !x.checked&&x.own==='Already on the backup menu.';return x.checked===(m.rank!=null&&!LP(m));}),mi.map(x=>[x.name,x.checked,x.own]));
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
  await ctx.close();}

 /* ---------- D: the rules, on a standalone TE-1 ---------- */
 {const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TE-1']);await sleep(600);
  const run=f=>p.evaluate(f=>{S=blank();renderAll();const rep=nbhCase.apply(f);return {beh:S.meta.beh||'',bk:S.bk.filter(r=>r.n).map(r=>[r.n,r.c,r.pref]),rep};},f);
  const T=(label,o)=>Object.assign({label,isRep:false,src:'TB-1',type:'Single topography'},o||{});
  const R=(label,o)=>Object.assign({label,isRep:true,src:'TB-1',type:'Replacement / alternative behavior'},o||{});
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
  const openText=(t,n)=>p.evaluate(([t,n])=>{const fi=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],n,{type:'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},[t,n]).then(()=>sleep(500));
  const oldPath=path.join(OLD,'TE-1.json');
  if(fs.existsSync(oldPath)){const old=fs.readFileSync(oldPath,'utf8'),o=JSON.parse(old);
    await openText(old,'TE-1.json');
    const s=await p.evaluate(()=>JSON.parse(JSON.stringify(S)));
    ok('G: the audit\'s saved TE-1 opens: its behavior and its '+o.S.bk.length+' backups',s.meta.beh===o.S.meta.beh&&JSON.stringify(s.bk.map(b=>b.n))===JSON.stringify(o.S.bk.map(b=>b.n)),{beh:s.meta.beh,bk:s.bk.map(b=>b.n)});
    const s1=await p.evaluate(()=>JSON.stringify(S));
    const rep=await p.evaluate(f=>nbhCase.apply(f),factsA);
    ok('G: the case changes nothing in it',(await p.evaluate(()=>JSON.stringify(S)))===s1&&rep.filled===0,rep);}
  else ok('G: the audit\'s saved TE-1 is at '+oldPath,false);
  /* a case-filled TE-1 saves and opens back the same */
  await p.evaluate(()=>{S=blank();renderAll();});await p.evaluate(f=>nbhCase.apply(f),factsA);
  const saved=await p.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};
    HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};document.querySelector('#saveBtn').click();}));
  const sv=JSON.parse(saved),s2=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>{S=blank();renderAll();});await openText(saved,'TE-1_round.json');
  ok('G: a case-filled TE-1 saves and opens back the same',sv.form==='TE-1'&&sv.S.meta.beh==='Break request'&&(await p.evaluate(()=>JSON.stringify(S)))===s2);
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

 const errs=log.filter(l=>(l.type==='pageerror'||l.type==='error')&&!/Failed to load resource: the server responded with a status of 404/.test(l.text));
 ok('no page or console errors',!errs.length,errs);
 await br.close();
 console.log(fails?fails+' FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(2);});
