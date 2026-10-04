/* Enhancement sprint, package A4: each replacement skill appears once, and mastery uses the objective's criterion
   (Forms TB-1, DD-1 and FS-1). Based on the audit's reproduction (scratchpad enhance/x_dup.js).
   A. TB-1 passes on clean replacement names: "(see target 4)" and "(see Forms EA-1 and TD-1)" go, "(replacement)" goes
      from the replacement target's name, and the paired replacement that points to target 4 (or reads as the one that
      does) goes on as "Break request". TB-1's own sheets and saved file keep what was typed.
   B. TB-1's simulation in the workstation, then DD-1, TK-1, SM-1, SR-1, FS-1, GB-1 and HD-1 opened fresh: DD-1 has 6
      behavior rows (not 9), one "Break request" row paired with Aggression and holding target 4's definition; TK-1's
      targets and printed target cards have no "(see" text and one break card; SM-1 has no repeated row; SR-1's
      alternative response has no "(see target 4)"; FS-1 has 4 target rows, and its "From the case" list will not take
      the replacement target as a problem behavior.
   C. A GB-1 objective of 5 consecutive measurements gives a fresh DD-1 a criterion of 5 days (aim and days on the
      target row, and on the skill row from the acquisition objective), and DD-1 shows "Criterion met" only after 5
      qualifying days.
   D. A DD-1 already in use: the objective's days replace the form's own 3 and its aim fills an empty aim; a value typed
      in DD-1 is kept; a level that does not fit the row's measure is not carried; "From the case" puts a ticked
      objective's criterion on its row.
   E. Load simulation asks first in DD-1, with the question the other forms use; Cancel keeps every field.
   F. Files saved before this change still open (scratchpad enhance/oldsave, or OLDSAVE=<folder>).
   No page or console error anywhere.
   Run: WS_URL=http://127.0.0.1:8304 WS_ROOT=<worktree> node qa/sprint-a4-test.js [edition]
   (the edition folder: NBH-Workstation, the default, or RPS-Workstation) */
const {chromium,fs,path,BASE,forms,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OLD=process.env.OLDSAVE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/enhance/oldsave';
const FILE={};forms(ED).forEach(f=>FILE[f.id]=f.file);
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,900)));if(!c)fails++;};
const log=[];
const CLEAN=[{label:'Aggression',isRep:false,rep:'Break request'},{label:'Self-injury – head hitting',isRep:false,rep:'Break request'},
  {label:'Elopement',isRep:false,rep:'Break request'},{label:'Break request',isRep:true,rep:''},
  {label:'Arranging and ordering (higher-level RRB)',isRep:false,rep:'Engages with a competing item from the A-CSA list'}];
const NOTE=/\(see\b|\(replacement\)|see target|EA-1 and TD-1/i;

async function shell(br){
  const ctx=await br.newContext({viewport:{width:1366,height:1000}});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/index.html');await sleep(900);
  return {ctx,page};
}
async function openIn(page,id){
  await page.evaluate(id=>openForm(id),id);
  const h=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{state:'attached',timeout:15000});
  const fr=await h.contentFrame();
  await fr.waitForFunction(()=>document.readyState==='complete'&&!!window.nbhCase,null,{timeout:15000});
  await page.waitForFunction(id=>!!state.status[id],id,{timeout:15000});
  return fr;
}
/* TB-1's simulation in the workstation, until the shell carries its five behaviors */
async function tb1Sim(page){
  const tb=await openIn(page,'TB-1');
  await tb.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});
  await page.waitForFunction(()=>!!(state.facts&&(state.facts.behaviors||[]).length>=5&&state.facts.src&&state.facts.src.behaviors==='TB-1'),null,{timeout:40000});
  return tb;
}
/* a form opened fresh after the case holds its facts: it has taken them in when its case says so */
async function fresh(page,id){
  const fr=await openIn(page,id);
  await fr.waitForFunction(()=>!!(window.nbhCase&&nbhCase.facts&&nbhCase.last),null,{timeout:20000}).catch(()=>{});
  await sleep(600);return fr;
}
/* a GB-1 field typed as a person would: the value, then input and change */
const setGb=(gb,name,v)=>gb.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return false;e.value=v;
  e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[name,v]);
const cardOf=(gb,kind,beh)=>gb.evaluate(([k,b])=>{const c=[...document.querySelectorAll('#'+k+'Wrap .card')].find(c=>{const o=c.querySelector('[data-out]');const i=o?o.dataset.out.replace(k,''):'';
  const e=document.querySelector('[name="'+k+'['+i+'].beh"]');return e&&e.value===b;});return c?+c.querySelector('[data-out]').dataset.out.replace(k,''):-1;},[kind,beh]);
const ddRows=fr=>fr.evaluate(()=>S.behaviors.map(b=>({kind:b.kind,name:b.name,def:b.definition||'',measure:b.measure,aim:b.aim,critDays:b.critDays,
  pair:b.pairWith?((S.behaviors.find(x=>x.id===b.pairWith)||{}).name||'?'):''})));
/* the "Criterion met" cell of a behavior's Baseline row on DD-1's Graphs & analysis */
const ddMet=(fr,name)=>fr.evaluate(n=>{const rep=[...document.querySelectorAll('#resultsOut .behavior-report')].find(r=>{const h=r.querySelector('.sec-title h3');return h&&h.textContent.trim()===n;});
  if(!rep)return {none:true};const head=rep.querySelector('.sec-title > span').textContent.replace(/\s+/g,' ');
  const tb=[...rep.querySelectorAll('table')].find(t=>[...t.querySelectorAll('th')].some(th=>th.textContent==='Criterion met'));if(!tb)return {head,noTable:true};
  const ths=[...tb.querySelectorAll('thead th')].map(th=>th.textContent),i=ths.indexOf('Criterion met'),row=[...tb.querySelectorAll('tbody tr')].find(tr=>/Baseline/.test(tr.cells[0].textContent));
  return {head,met:row&&row.cells[i]?row.cells[i].textContent.replace(/\s+/g,' ').trim():null};},name);
const dlgIn=fr=>fr.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?{head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>(b.className?b.className+':':'')+b.textContent)}:null;});
const values=fr=>fr.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='file'&&!e.closest('#nbhUiDlg,#nbhCaseDlg')).map(e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value));
/* a file the page would download, caught as text */
const caught=(p,label)=>p.evaluate(async t=>{let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:caught';};
  HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
  try{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t).click();await new Promise(r=>setTimeout(r,400));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}
  return got?await got.text():'';},label);

(async()=>{const br=await chromium.launch();

 /* ---------- A: TB-1 on its own ---------- */
 {const ctx=await br.newContext({viewport:{width:1180,height:900}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE['TB-1']);await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simBtn').click();});
  await p.waitForFunction(()=>{const e=document.querySelector('[name="tgt[4].rep"]');return e&&!!e.value;},null,{timeout:10000});
  const out=await p.evaluate(()=>window.__nbhFactsOut().behaviors.map(b=>({label:b.label,isRep:b.isRep,rep:b.rep})));
  ok('A: TB-1 passes on the cleaned names ("Break request" for the break card, no staff notes)',JSON.stringify(out)===JSON.stringify(CLEAN),out);
  const typed=await p.evaluate(()=>({rep0:document.querySelector('[name="tgt[0].rep"]').value,rep1:document.querySelector('[name="tgt[1].rep"]').value,
    lab3:document.querySelector('[name="tgt[3].lab"]').value,ttl3:document.querySelector('#tgtTtl3').textContent,rep4:document.querySelector('[name="tgt[4].rep"]').value}));
  ok('A: TB-1\'s own sheet keeps what was typed',typed.rep0==='Hands a break card and waits (see target 4)'&&typed.rep1==='Hands a break card and waits'&&
    typed.lab3==='Break request (replacement)'&&typed.ttl3==='Break request (replacement)'&&/\(see Forms EA-1 and TD-1\)$/.test(typed.rep4),typed);
  const file=JSON.parse((await caught(p,'Save data'))||'{}');
  const miss=await p.evaluate(fields=>{const m=[];for(const [k,v] of Object.entries(fields||{})){const els=[...document.querySelectorAll('[name="'+CSS.escape(k)+'"]')];if(!els.length)continue;const el=els[0];
    const now=el.type==='checkbox'?el.checked:el.type==='radio'?((els.find(x=>x.checked)||{}).value||''):el.value;if(typeof v==='boolean'?now!==v:String(now)!==String(v))m.push(k);}return m;},file.fields);
  ok('A: TB-1\'s saved file is unchanged: every field as the sheets show it, the notes and "(replacement)" included',!!file.fields&&file.fields['tgt[0].rep']==='Hands a break card and waits (see target 4)'&&
    file.fields['tgt[3].lab']==='Break request (replacement)'&&miss.length===0&&!('behaviors' in file),{miss:miss.slice(0,6),keys:Object.keys(file)});
  /* the other ways of writing a note or a pointer, typed on the cards */
  const more=await p.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('tgt[1].rep','see target 4');set('tgt[2].rep','Requests a break (verbal or card)');set('tgt[4].rep','Engages with a competing item — see sheet 3');
    const r=window.__nbhFactsOut().behaviors.map(b=>b.rep);
    set('tgt[1].rep','Hands a break card and waits');set('tgt[2].rep','Hands a break card and waits');set('tgt[4].rep','Engages with a competing item from the A-CSA list (see Forms EA-1 and TD-1)');return r;});
  ok('A: a pointer alone ("see target 4") goes on as the target\'s name; other words are left apart; a dash note goes',
    JSON.stringify(more)===JSON.stringify(['Break request','Break request','Requests a break (verbal or card)','','Engages with a competing item']),more);
  /* a TB-1 file saved before this change (four targets) */
  const fp=path.join(OLD,'TB-1.json');
  if(fs.existsSync(fp)){await p.setInputFiles('#fileIn',fp);await sleep(1200);
    const o=await p.evaluate(()=>({n:document.querySelectorAll('#tgtWrap .card').length,rep0:document.querySelector('[name="tgt[0].rep"]').value,
      out:window.__nbhFactsOut().behaviors.map(b=>b.label+' | '+b.rep)}));
    ok('A: a TB-1 file saved before this change opens as typed, and passes on the cleaned names',o.n===4&&o.rep0==='Hands a break card and waits (see target 4)'&&
      JSON.stringify(o.out)===JSON.stringify(['Aggression | Break request','Self-injury – head hitting | Break request','Elopement | Break request','Break request | ']),o);}
  else console.log('SKIP A: no saved TB-1 file at '+fp+' (set OLDSAVE)');
  /* a candidate decided "Target – replacement" before sheet 4 is written */
  const cand=await p.evaluate(()=>!!document.querySelector('[name="cand[0].dec"]'));
  if(cand){const r=await p.evaluate(()=>{document.querySelectorAll('#tgtWrap [name$="].lab"]').forEach(e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
      const b=document.querySelector('[name="cand[0].beh"]'),d=document.querySelector('[name="cand[0].dec"]');b.value='Break request (replacement)';d.value='Target – replacement';
      d.dispatchEvent(new Event('change',{bubbles:true}));const o=window.__nbhFactsOut();return o&&o.behaviors[0];});
    ok('A: a candidate decided "Target – replacement" goes on as a replacement, under its cleaned name',!!r&&r.label==='Break request'&&r.isRep===true,r);}
  await ctx.close();}

 /* ---------- B: TB-1's simulation, then the forms that take the case, opened fresh ---------- */
 {const {ctx,page}=await shell(br);
  await tb1Sim(page);
  const facts=await page.evaluate(()=>state.facts.behaviors.map(b=>({label:b.label,isRep:!!b.isRep,rep:b.rep||''})));
  ok('B: the workstation carries the cleaned names',JSON.stringify(facts)===JSON.stringify(CLEAN),facts);
  const bar=await page.evaluate(()=>$('#factsTxt').textContent);
  ok('B: the bar lists "Break request" once, without "(replacement)"',(bar.match(/Break request/g)||[]).length===1&&!NOTE.test(bar),bar);
  const dd=await fresh(page,'DD-1');const rows=await ddRows(dd);
  ok('B: DD-1 has 6 behavior rows, not 9',rows.length===6,rows.map(r=>r.kind+': '+r.name));
  ok('B: DD-1 has the four targets and two replacement rows',JSON.stringify(rows.map(r=>r.kind+': '+r.name))===JSON.stringify(['target: Aggression','target: Self-injury – head hitting','target: Elopement',
    'target: Arranging and ordering (higher-level RRB)','replacement: Break request','replacement: Engages with a competing item from the A-CSA list']),rows.map(r=>r.kind+': '+r.name));
  const br1=rows.find(r=>r.name==='Break request')||{};
  ok('B: the one "Break request" row is paired with Aggression and holds target 4\'s definition',br1.pair==='Aggression'&&/^Picking up the break card and placing it in the adult/.test(br1.def),br1);
  ok('B: no DD-1 row carries a staff note or "(replacement)"',rows.every(r=>!NOTE.test(r.name)),rows.map(r=>r.name));
  const liveN=await dd.evaluate(()=>S.behaviors.length);
  ok('B: DD-1\'s data sheet has one column per row ('+liveN+')',liveN===6);
  const tk=await fresh(page,'TK-1');
  const tg=await tk.evaluate(()=>S.tg.filter(o=>o.l||o.k).map(o=>({l:o.l,k:o.k})));
  ok('B: TK-1\'s targets: one break card and no "(see" text',tg.filter(o=>o.k==='break').length===1&&tg.every(o=>!NOTE.test(o.l))&&tg.length===2,tg);
  const cards=await tk.evaluate(()=>{const ps=[...document.querySelectorAll('#book .pg[data-label^="Card sheet: the targets"]')];return {n:ps.length,text:ps.map(p=>p.innerText.replace(/\s+/g,' ')).join(' | ')};});
  ok('B: TK-1\'s printed target cards show no "(see" text and one "Break request" card',cards.n>=1&&!NOTE.test(cards.text)&&(cards.text.match(/Break request/g)||[]).length===1,cards);
  const sm=await fresh(page,'SM-1');
  const smr=await sm.evaluate(()=>({tg:S.tg.map(t=>t.word).filter(Boolean),red:S.meta.t_reduce}));
  ok('B: SM-1 has no repeated row and no staff note',smr.tg.length===new Set(smr.tg).size&&smr.tg.every(w=>!NOTE.test(w))&&JSON.stringify(smr.tg)===JSON.stringify(['Break request','Engages with a competing item from the A-CSA list']),smr.tg);
  ok('B: SM-1\'s reduction line names the replacement plainly',!NOTE.test(smr.red)&&/Aggression \(replaced by Break request\)/.test(smr.red),smr.red);
  const sr=await fresh(page,'SR-1');
  const alt=await sr.evaluate(()=>S.meta.alt);
  ok('B: SR-1\'s alternative response has no "(see target 4)"',alt==='Break request',alt);
  const hd=await fresh(page,'HD-1');
  const hdr=await hd.evaluate(()=>S.bh.map(b=>b.name).filter(Boolean));
  ok('B: HD-1 takes the cleaned names',hdr.every(n=>!NOTE.test(n))&&hdr.includes('Break request'),hdr);
  const fs1=await fresh(page,'FS-1');
  const fsr=await fs1.evaluate(()=>S.beh.map(b=>({lab:b.lab,fn:b.fn,alt:b.alt})));
  ok('B: FS-1 has 4 target rows, the problem behaviors, each with its function',fsr.length===4&&fsr.every(b=>b.fn)&&!fsr.some(b=>/Break request/.test(b.lab)),fsr);
  ok('B: FS-1\'s alternatives carry the cleaned names',JSON.stringify(fsr.map(b=>b.alt))===JSON.stringify(['Break request','Break request','Break request','Engages with a competing item from the A-CSA list']),fsr.map(b=>b.alt));
  /* FS-1's "From the case": the replacement target cannot be ticked, and says why; a problem behavior can */
  await page.evaluate(()=>openForm('FS-1'));await sleep(300);
  await fs1.evaluate(()=>document.querySelector('#nbhCaseBtn').click());await sleep(300);
  const pk=await fs1.evaluate(()=>{const bs=[...document.querySelectorAll('#nbhcBody input[data-kind="beh"]')];return bs.map(cb=>({name:cb.nextElementSibling.querySelector('b').textContent,dis:cb.disabled,chk:cb.checked,
    own:(cb.closest('label').querySelector('.nbhc-own')||{}).textContent||''}));});
  const rp=pk.find(x=>x.name==='Break request')||{};
  ok('B: in FS-1\'s "From the case" list the replacement target is unticked, cannot be ticked, and says why',rp.dis===true&&rp.chk===false&&/replacement behavior, not a problem behavior/.test(rp.own)&&pk.filter(x=>x.dis).length===1,pk);
  await fs1.evaluate(()=>{const cb=[...document.querySelectorAll('#nbhcBody input[data-kind="beh"]')].find(c=>c.disabled);document.querySelectorAll('#nbhcBody input').forEach(c=>c.checked=false);cb.disabled=false;cb.checked=true;document.querySelector('#nbhcUse').click();});
  await sleep(300);
  const forced={n:await fs1.evaluate(()=>S.beh.length),done:await fs1.evaluate(()=>document.querySelector('#nbhcDone').textContent)};
  ok('B: FS-1: the replacement ticked anyway (as an older list would send it) is not placed, and the note says why',forced.n===4&&/^Nothing to place: a replacement behavior was left out/.test(forced.done),forced);
  await fs1.evaluate(()=>{document.querySelectorAll('#nbhcBody input').forEach(c=>c.checked=false);const cb=[...document.querySelectorAll('#nbhcBody input[data-kind="beh"]')].find(c=>c.nextElementSibling.querySelector('b').textContent==='Elopement');cb.checked=true;document.querySelector('#nbhcUse').click();});
  await sleep(300);
  const placed={n:await fs1.evaluate(()=>S.beh.length),done:await fs1.evaluate(()=>document.querySelector('#nbhcDone').textContent)};
  ok('B: FS-1: a problem behavior ticked is placed as before',placed.n===5&&/^Placed 1 item on this form\.$/.test(placed.done),placed);
  await fs1.evaluate(()=>document.querySelector('#nbhcClose').click());
  const gb=await fresh(page,'GB-1');
  const gbo=await gb.evaluate(()=>{const o=window.__nbhFactsOut();return {red:o.goals.red.map(r=>r.pair),acq:o.goals.acq.map(a=>a.beh)};});
  ok('B: GB-1 takes the cleaned names (its own one-objective-per-skill rule is package A5\'s)',gbo.red.concat(gbo.acq).every(s=>!NOTE.test(s))&&gbo.acq.includes('Break request'),gbo);
  await ctx.close();}

 /* ---------- C: a GB-1 objective of 5 consecutive measurements, then DD-1 opened fresh ---------- */
 {const {ctx,page}=await shell(br);
  await tb1Sim(page);
  const gb=await fresh(page,'GB-1');
  const ri=await cardOf(gb,'red','Aggression'),ai=await cardOf(gb,'acq','Break request');
  ok('C: GB-1 has a reduction objective for Aggression and an acquisition objective for Break request, from the case',ri>=0&&ai>=0,{ri,ai});
  await setGb(gb,'red['+ri+'].dir','decrease');await setGb(gb,'red['+ri+'].meas','frequency per school day');await setGb(gb,'red['+ri+'].ml','more');
  await setGb(gb,'red['+ri+'].tgt','2');await setGb(gb,'red['+ri+'].crit','5 consecutive');
  await setGb(gb,'acq['+ai+'].crit','independently in at least 80% of opportunities');await setGb(gb,'acq['+ai+'].n','5');await setGb(gb,'acq['+ai+'].unit','sessions');
  const sent=await gb.evaluate(()=>{const o=window.__nbhFactsOut();return o.goals.red.find(r=>r.beh==='Aggression').text;});
  ok('C: the objective, criterion typed "5 consecutive", reads "... to no more than 2 ... over 5 consecutive measurements ..."',/will decrease their frequency per school day of Aggression .*to no more than 2 .*over 5 consecutive measurements/.test(sent),sent);
  await page.waitForFunction(()=>{const g=state.facts&&state.facts.goals;return !!(g&&(g.red||[]).some(r=>r.beh==='Aggression'&&r.crit==='5 consecutive')&&(g.acq||[]).some(a=>a.beh==='Break request'&&a.n==='5'));},null,{timeout:30000});
  const dd=await fresh(page,'DD-1');const rows=await ddRows(dd);
  const ag=rows.find(r=>r.name==='Aggression')||{},rq=rows.find(r=>r.name==='Break request')||{},el=rows.find(r=>r.name==='Elopement')||{};
  ok('C: DD-1\'s Aggression row takes the objective\'s criterion: aim 2, 5 consecutive days',ag.aim==2&&ag.critDays===5&&ag.measure==='count',ag);
  ok('C: DD-1\'s Break request row takes the acquisition objective\'s: 80% independent, 5 days',rq.measure==='trials'&&rq.aim==80&&rq.critDays===5,rq);
  ok('C: a behavior with no objective starts as before (no aim, 3 days)',el.aim===''&&el.critDays===3,el);
  /* five school days with Aggression at 1 (at or under the aim), entered one at a time on the data sheet */
  await dd.evaluate(()=>{document.querySelector('#d_start').value='2026-09-21';document.querySelector('#d_count').value='5';document.querySelector('#btnAddDays').click();});await sleep(300);
  const id=await dd.evaluate(()=>S.behaviors.find(b=>b.name==='Aggression').id);
  const seen=[];
  for(let k=0;k<5;k++){
    await dd.evaluate(([id,k])=>{const tr=[...document.querySelectorAll('#dataTable tbody tr[data-r]')].filter(t=>t.querySelector('input[data-v="'+id+'"]'))[k];
      const e=tr.querySelector('input[data-v="'+id+'"]');e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}));},[id,k]);
    await sleep(200);seen.push((await ddMet(dd,'Aggression')).met);
  }
  ok('C: "Criterion met" is not shown after 3 or 4 qualifying days of a 5-day objective',seen[2]==='not yet — current run 3 of 5'&&seen[3]==='not yet — current run 4 of 5',seen);
  ok('C: "Criterion met" shows after the 5th qualifying day',/\(5 consecutive\)$/.test(seen[4]||'')&&!/not yet/.test(seen[4]),seen);
  const head=(await ddMet(dd,'Aggression')).head;
  ok('C: the graph heading states the criterion: 2 for 5 consecutive days',/criterion 2 for 5 consecutive days/.test(head||''),head);
  await ctx.close();}

 /* ---------- D: a DD-1 already in use when the objectives are written ---------- */
 {const {ctx,page}=await shell(br);
  await tb1Sim(page);
  const dd=await fresh(page,'DD-1');
  ok('D: DD-1 opened before GB-1: its rows start with 3 days and no aim',(await ddRows(dd)).every(r=>r.critDays===3&&r.aim===''));
  /* typed in DD-1: Elopement's days; and a day of data, so the record is in use */
  await dd.evaluate(()=>{const b=S.behaviors.find(x=>x.name==='Elopement');const e=document.querySelector('#behTable tr[data-b="'+CSS.escape(b.id)+'"] input[data-f="critDays"]');e.value='4';e.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#btnAddOne').click();});
  const gb=await fresh(page,'GB-1');
  const ri=await cardOf(gb,'red','Aggression'),ei=await cardOf(gb,'red','Elopement'),si=await cardOf(gb,'red','Self-injury – head hitting');
  await setGb(gb,'red['+ri+'].meas','frequency per school day');await setGb(gb,'red['+ri+'].tgt','2');await setGb(gb,'red['+ri+'].crit','5');
  await setGb(gb,'red['+ei+'].meas','frequency per school day');await setGb(gb,'red['+ei+'].tgt','1');await setGb(gb,'red['+ei+'].crit','6');
  await setGb(gb,'red['+si+'].meas','rate per minute');await setGb(gb,'red['+si+'].tgt','0.1 per minute');await setGb(gb,'red['+si+'].crit','4');
  const waitDd=(fn,arg)=>dd.waitForFunction(fn,arg,{timeout:30000}).then(()=>true).catch(()=>false);
  await waitDd(()=>{const b=S.behaviors.find(x=>x.name==='Aggression');return b&&b.critDays===5&&b.aim==2;});
  await sleep(1500);
  let rows=await ddRows(dd);const R=n=>rows.find(r=>r.name===n)||{};
  ok('D: in use, the objective\'s 5 days take the place of the form\'s 3, and its aim fills the empty aim',R('Aggression').critDays===5&&R('Aggression').aim==2,R('Aggression'));
  ok('D: the days typed in DD-1 are kept (4, not the objective\'s 6); the empty aim is filled',R('Elopement').critDays==='4'&&R('Elopement').aim==1,R('Elopement'));
  ok('D: a rate per minute does not go into a count row: no aim, the days still come',R('Self-injury – head hitting').aim===''&&R('Self-injury – head hitting').critDays===4,R('Self-injury – head hitting'));
  /* the objective changes: what DD-1 took from it follows; what was typed in DD-1 stays */
  await dd.evaluate(()=>{const b=S.behaviors.find(x=>x.name==='Elopement');const e=document.querySelector('#behTable tr[data-b="'+CSS.escape(b.id)+'"] input[data-f="aim"]');e.value='3';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await setGb(gb,'red['+ri+'].crit','6');await setGb(gb,'red['+ri+'].tgt','1');await setGb(gb,'red['+ei+'].tgt','0');
  await waitDd(()=>{const b=S.behaviors.find(x=>x.name==='Aggression');return b&&b.critDays===6;});
  await sleep(1500);
  rows=await ddRows(dd);
  ok('D: a changed objective is followed where DD-1 took its values (6 days, aim 1)',R('Aggression').critDays===6&&R('Aggression').aim==1,R('Aggression'));
  ok('D: an aim typed in DD-1 is kept when the objective changes',R('Elopement').aim==='3'&&R('Elopement').critDays==='4',R('Elopement'));
  /* From the case: the ticked reduction objective for Self-injury puts its days on the row and says why the aim stays */
  await page.evaluate(()=>openForm('DD-1'));await sleep(300);
  await dd.evaluate(()=>document.querySelector('#nbhCaseBtn').click());await sleep(300);
  const pick=await dd.evaluate(()=>{document.querySelectorAll('#nbhcBody input').forEach(c=>c.checked=false);const i=nbhCase.facts.goals.red.findIndex(r=>/^Self-injury/.test(r.beh));
    document.querySelector('#nbhcBody input[data-kind="red"][data-i="'+i+'"]').checked=true;
    const b=S.behaviors.find(x=>/^Self-injury/.test(x.name));b.critDays='2';
    document.querySelector('#nbhcUse').click();return document.querySelector('#nbhcDone').textContent;});
  rows=await ddRows(dd);
  ok('D: a ticked objective puts its days on the row it names (typed days give way when picked), and says why the aim is not carried',
    R('Self-injury – head hitting').critDays===4&&R('Self-injury – head hitting').aim===''&&/does not fit the row.s measure, Frequency \(count\)/.test(pick),{row:R('Self-injury – head hitting'),pick});
  await dd.evaluate(()=>document.querySelector('#nbhcClose').click());
  ok('D: still one row per skill, nothing added by the pushes',rows.length===6,rows.map(r=>r.name));
  await ctx.close();}

 /* ---------- E: Load simulation asks first in DD-1 ---------- */
 {const ctx=await br.newContext({viewport:{width:1180,height:820}});const p=await ctx.newPage();wire(p,log);
  const native=[];p.on('dialog',d=>native.push(d.type()+': '+d.message().slice(0,80)));
  await p.goto(BASE+'/'+ED+'/'+FILE['DD-1']);await sleep(900);
  const MARK='ZQX typed by the analyst';
  await p.evaluate(m=>{const e=document.querySelector('#m_client');e.value=m;e.dispatchEvent(new Event('input',{bubbles:true}));
    const d=document.querySelector('#behTable textarea[data-f="definition"]');d.value='ZQX definition typed';d.dispatchEvent(new Event('input',{bubbles:true}));},MARK);
  ok('E: no day of data yet (it used to replace the sheet without asking then)',await p.evaluate(()=>S.rows.length===0));
  const before=await values(p);
  await p.evaluate(()=>document.querySelector('#btnLoadExample').click());await sleep(400);
  const q=await dlgIn(p);
  ok('E: DD-1\'s Load simulation asks first ("'+(q?q.head:'no question')+'")',!!q&&q.head==='Load the simulated student?'&&/Anything already entered will be replaced\.$/.test(q.body)&&q.btns.join()==='Cancel,primary:Load',q);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiDlg[open] #nbhUiF button')].find(b=>b.textContent==='Cancel');if(b)b.click();});await sleep(500);
  const kept=await values(p);
  ok('E: Cancel keeps every field as it was',!(await dlgIn(p))&&JSON.stringify(kept)===JSON.stringify(before)&&(await p.evaluate(()=>S.meta.client))===MARK,{n:before.length,changed:kept.map((v,i)=>v===before[i]?null:i).filter(x=>x!==null).slice(0,8)});
  await p.evaluate(()=>document.querySelector('#btnLoadExample').click());await sleep(400);
  await p.evaluate(()=>{const b=document.querySelector('#nbhUiDlg[open] #nbhUiF .primary');if(b)b.click();});
  await p.waitForFunction(()=>/SIMULATED/.test(S.meta.client)&&S.rows.length===20,null,{timeout:10000}).catch(()=>{});
  ok('E: Load replaces the entries with the simulated student (20 school days)',await p.evaluate(()=>/SIMULATED/.test(S.meta.client)&&S.rows.length===20&&S.behaviors.length===6));
  await p.evaluate(m=>{S.meta.client=m;window.confirm=()=>true;},MARK);
  await p.evaluate(()=>document.querySelector('#btnLoadExample').click());await sleep(800);
  ok('E: with window.confirm stubbed (as the older checks do), it loads without the question',!(await dlgIn(p))&&await p.evaluate(()=>/SIMULATED/.test(S.meta.client)));
  ok('E: no browser dialog appeared',native.length===0,native);
  await ctx.close();}

 /* ---------- F: files saved before this change still open ---------- */
 for(const [id,sel,check] of [
   ['DD-1','#fileImport',async(p,d)=>{const r=await p.evaluate(()=>({b:S.behaviors.map(b=>b.name+'|'+b.critDays+'|'+b.aim),rows:S.rows.length,client:S.meta.client}));
     return {ok:r.rows===d.rows.length&&r.client===d.meta.client&&JSON.stringify(r.b)===JSON.stringify(d.behaviors.map(b=>b.name+'|'+b.critDays+'|'+b.aim)),r};}],
   ['FS-1','#fileIn',async(p,d)=>{const r=await p.evaluate(()=>({client:S.meta.client,n:S.beh.length}));const s=d.S||{};return {ok:r.client===(s.meta||{}).client&&r.n===Math.max(1,(s.beh||[]).length),r};}]]){
  const fp=path.join(OLD,id+'.json');if(!fs.existsSync(fp)){console.log('SKIP F '+id+': no saved file at '+fp+' (set OLDSAVE)');continue;}
  const d=JSON.parse(fs.readFileSync(fp,'utf8'));
  const ctx=await br.newContext({viewport:{width:1366,height:1000}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+FILE[id]);await sleep(800);
  await p.setInputFiles(sel,fp);await sleep(1500);
  const c=await check(p,d);
  ok('F: a '+id+' file saved before this change opens ('+path.basename(fp)+')',c.ok,c.r);
  await ctx.close();}

 const errs=log.filter(l=>l.type!=='warning');
 ok('no page or console error in any form or the workstation',errs.length===0,errs.slice(0,6));
 if(log.length>errs.length)console.log('warnings: '+JSON.stringify(log.filter(l=>l.type==='warning').slice(0,4)));
 await br.close();console.log('RESULT '+(fails?fails+' FAIL':'all pass'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
