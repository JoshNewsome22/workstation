/* Enhancement sprint, package A2: nothing overwrites what you entered (Forms IA-1, IN-1, PA-1, MS-1 and AD-1).
   1. The assessments' hypotheses stay the assessor's own. Form FS-1's concluded function never fills IA-1's "Indirect
      hypothesis carried to the packet" or IN-1's "Interview hypothesis carried to the packet"; the target behavior
      still arrives from the case. The checker's three paths (scratchpad enhance/verify-fn/repro.js and repro2.js):
        A. FS-1 simulated, then IA-1 and IN-1 opened fresh;
        B. IA-1 and IN-1 opened first, then FS-1 concludes;
        C. Save case, then Open case (the shell's own buttons; the file is read back), and once more with a hypothesis
           chosen on IN-1, which comes back as chosen;
      and also: the "From the case" list (the Function item cannot be ticked; a selection holding it places nothing
      there), the form's own Open packet (the packet's function is left out; Save packet still carries the form's own),
      and IA-1's own rule (its attention scenario, and the same scores typed in, still fill its own field).
   2. Load simulation asks first in IA-1, PA-1, MS-1 and AD-1, with the question the other forms use: Cancel keeps
      every field, Load replaces them, and a stubbed window.confirm still answers it (the older checks rely on that).
   3. Files saved before the change still open (the audit's saved files: OLDSAVE=<folder> or the default below).
   No page or console error anywhere. Run: WS_URL=http://127.0.0.1:8302 WS_ROOT=<worktree> node qa/sprint-a2-test.js [edition]
   (the edition folder: NBH-Workstation, the default, or RPS-Workstation) */
const {chromium,fs,path,BASE,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a2/';
const OLD=process.env.OLDSAVE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/enhance/oldsave';
const F={'IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','IN-1':'IN-1_Stakeholder-Interview-Record_v2026-09.html',
  'PA-1':'PA-1_Preference-Assessment-Protocol_v2026-09.html','MS-1':'MS-1_Medication-Side-Effect-Monitoring_v2026-09.html',
  'AD-1':'AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html'};
const SIMBTN={'IA-1':'#simBtn','PA-1':'#simBtn','MS-1':'#simBtn','AD-1':'#btnSim'};
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,700)));if(!c)fails++;};
const log=[];
/* the two hypothesis fields and the behavior fields */
const readIA=fr=>fr.evaluate(()=>({fn:document.querySelector('#mFn').value,beh:document.querySelector('[name="m.beh"]').value,last:window.nbhCase&&nbhCase.last}));
const readIN=fr=>fr.evaluate(()=>({fn:document.querySelector('[data-m="fn"]').value,meta:typeof S!=='undefined'&&S.meta?(S.meta.fn||''):null,beh:document.querySelector('[data-m="beh"]').value,last:window.nbhCase&&nbhCase.last}));
const hasFn=fr=>fr.waitForFunction(()=>!!(window.nbhCase&&nbhCase.facts&&nbhCase.facts.fn&&nbhCase.facts.fn.key),null,{timeout:30000});

async function shell(br){
  const ctx=await br.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});
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
const frameOf=async(page,id)=>(await page.waitForSelector(`iframe[title*="Form ${id})"]`,{state:'attached',timeout:20000})).contentFrame();
/* FS-1's simulation in the workstation, until the shell carries its function */
async function fs1Sim(page){
  const fs1=await openIn(page,'FS-1');
  await fs1.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});
  await page.waitForFunction(()=>!!(state.facts&&state.facts.fn&&state.facts.fn.key&&state.facts.src&&state.facts.src.fn==='FS-1'&&(state.facts.behaviors||[]).length),null,{timeout:40000});
  return page.evaluate(()=>({fn:state.facts.fn.key,label:state.facts.fn.label,beh:state.facts.behaviors.map(b=>b.label)}));
}
/* a styled question in a form: its text, and the buttons */
const dlgIn=fr=>fr.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?{head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>(b.className?b.className+':':'')+b.textContent)}:null;});
/* every value a form shows (the comparison for "Cancel keeps every field") */
const values=fr=>fr.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='file'&&!e.closest('#nbhUiDlg,#nbhCaseDlg')).map(e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value));
const clientOf=fr=>fr.evaluate(()=>{for(const s of window.__nbhPacketMap.client){const e=document.querySelector(s);if(e)return e.value;}return null;});
const setClient=(fr,v)=>fr.evaluate(v=>{for(const s of window.__nbhPacketMap.client){const e=document.querySelector(s);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return;}}},v);
/* a file the page would download, caught as text */
const caught=(p,label)=>p.evaluate(async t=>{let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:caught';};
  HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
  try{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t).click();await new Promise(r=>setTimeout(r,400));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}
  return got?await got.text():'';},label);

(async()=>{const br=await chromium.launch();
 const behStart=(v,label)=>!!label&&String(v||'').startsWith(label);

 /* ---------- A: FS-1 concludes first; IA-1 and IN-1 are opened fresh afterwards ---------- */
 {const {ctx,page}=await shell(br);
  const facts=await fs1Sim(page);
  ok('A: Form FS-1\'s simulation gives the case a function and behaviors ('+facts.fn+'; '+facts.beh.length+' behaviors)',!!facts.fn&&facts.beh.length>0,facts);
  const ia=await openIn(page,'IA-1');await hasFn(ia);await sleep(500);
  const a=await readIA(ia);
  ok('A: IA-1 opened after FS-1 concluded: its indirect hypothesis stays "not yet"',a.fn==='',a);
  ok('A: IA-1 still takes the target behavior from the case',behStart(a.beh,facts.beh[0])&&a.last&&a.last.filled===1,a);
  const inn=await openIn(page,'IN-1');await hasFn(inn);await sleep(500);
  const b=await readIN(inn);
  ok('A: IN-1 opened after FS-1 concluded: its interview hypothesis stays "not yet"',b.fn===''&&!b.meta,b);
  ok('A: IN-1 still takes the target behavior from the case',behStart(b.beh,facts.beh[0])&&b.last&&b.last.filled===1,b);
  /* IA-1's own rule: scores whose informants converge on attention, typed into this IA-1, fill its own field */
  const sp=await ctx.newPage();wire(sp,log);await sp.goto(BASE+'/'+ED+'/'+F['IA-1']);await sleep(700);
  await sp.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simScenario').value='attention';document.querySelector('#simBtn').click();});
  await sp.waitForFunction(()=>document.querySelector('#mFn').value==='attention',null,{timeout:10000});
  const typed=await sp.evaluate(()=>{const out={};document.querySelectorAll('[name]').forEach(e=>{if(e.type==='file'||e.type==='button'||/^(m|rp)\./.test(e.name))return;out[e.name]=e.type==='checkbox'?(e.checked?'__on':'__off'):e.value;});return out;});
  await sp.close();
  await page.evaluate(()=>openForm('IA-1'));
  const n=await ia.evaluate(v=>{let n=0;for(const [k,x] of Object.entries(v)){const e=document.querySelector('[name="'+CSS.escape(k)+'"]');if(!e)continue;
    if(x==='__on'||x==='__off')e.checked=x==='__on';else e.value=x;n++;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}return n;},typed);
  await sleep(800);
  const a2=await ia.evaluate(()=>({fn:document.querySelector('#mFn').value,verdict:document.querySelector('#convVerdict').textContent.replace(/\s+/g,' ').slice(0,120)}));
  ok('A: the attention scores typed into IA-1 ('+n+' fields) fill its own hypothesis with attention, not FS-1\'s '+facts.fn,a2.fn==='attention'&&/Attention[^:]*: 3 of 3 informants/.test(a2.verdict),a2);
  await page.evaluate(()=>pushFactsToAll());await sleep(1500);
  ok('A: the next case push leaves it at attention',(await readIA(ia)).fn==='attention');
  await ctx.close();}

 /* ---------- B: IA-1 and IN-1 are open first; FS-1 concludes afterwards ---------- */
 {const {ctx,page}=await shell(br);
  const ia=await openIn(page,'IA-1'),inn=await openIn(page,'IN-1');await sleep(1500);
  const b0={ia:await readIA(ia),in:await readIN(inn)};
  ok('B: IA-1 and IN-1 open with no case and no hypothesis',b0.ia.fn===''&&b0.in.fn==='',b0);
  const facts=await fs1Sim(page);
  await hasFn(ia);await hasFn(inn);await sleep(800);
  const a=await readIA(ia),b=await readIN(inn);
  ok('B: after FS-1 concludes ('+facts.fn+'), IA-1\'s indirect hypothesis is still "not yet"',a.fn==='',a);
  ok('B: after FS-1 concludes, IN-1\'s interview hypothesis is still "not yet"',b.fn===''&&!b.meta,b);
  ok('B: the target behavior reached both forms',behStart(a.beh,facts.beh[0])&&behStart(b.beh,facts.beh[0]),{a:a.beh,b:b.beh});
  /* From the case, on both forms */
  for(const [id,fr,why] of [['IN-1',inn,/your own choice/],['IA-1',ia,/this assessment.s own result/]]){
    await page.evaluate(id=>openForm(id),id);await sleep(300);
    await fr.evaluate(()=>document.querySelector('#nbhCaseBtn').click());await sleep(300);
    const d=await fr.evaluate(()=>{const cb=document.querySelector('#nbhcBody input[data-kind="fn"]');return {open:document.querySelector('#nbhCaseDlg').open,
      fn:cb?{checked:cb.checked,disabled:cb.disabled,note:(cb.closest('label').querySelector('.nbhc-own')||{}).textContent||''}:null,nBeh:document.querySelectorAll('#nbhcBody input[data-kind="beh"]').length};});
    ok(id+', From the case: the Function item is shown unticked, cannot be ticked, and says why',d.open&&d.fn&&!d.fn.checked&&d.fn.disabled&&why.test(d.fn.note),d);
    const want=await fr.evaluate(()=>{const bs=[...document.querySelectorAll('#nbhcBody input[data-kind="beh"]')];bs.forEach(c=>c.checked=false);const c=bs[bs.length-1];c.checked=true;return nbhCase.facts.behaviors[+c.dataset.i].label;});
    await fr.evaluate(()=>document.querySelector('#nbhcUse').click());await sleep(300);
    const after=id==='IA-1'?await readIA(fr):await readIN(fr),done=await fr.evaluate(()=>document.querySelector('#nbhcDone').textContent);
    ok(id+', From the case: the ticked behavior ('+want+') is placed and the hypothesis is untouched',behStart(after.beh,want)&&after.fn===''&&/^Placed 1 item on this form\.$/.test(done),{after,done});
    /* the function asked for anyway (the item re-enabled and ticked, as an older picker would send it) */
    await fr.evaluate(()=>{const cb=document.querySelector('#nbhcBody input[data-kind="fn"]');cb.disabled=false;cb.checked=true;document.querySelectorAll('#nbhcBody input[data-kind="beh"]').forEach(c=>c.checked=false);document.querySelector('#nbhcUse').click();});await sleep(300);
    const forced=id==='IA-1'?await readIA(fr):await readIN(fr),done2=await fr.evaluate(()=>document.querySelector('#nbhcDone').textContent);
    ok(id+', From the case: a selection holding the function still leaves the hypothesis alone, and says so',forced.fn===''&&/^Nothing to place: the function stays off this form/.test(done2),{forced,done2});
    await fr.evaluate(()=>document.querySelector('#nbhcClose').click());
  }
  /* IA-1's own rule: the attention scenario, loaded through its question, fills its own field */
  await page.evaluate(()=>openForm('IA-1'));await sleep(300);
  await ia.evaluate(()=>{document.querySelector('#simScenario').value='attention';document.querySelector('#simBtn').click();});await sleep(300);
  const q=await dlgIn(ia);
  ok('B: in the workstation, IA-1\'s Load simulation asks first',!!q&&/^Load the simulated case\?$/.test(q.head),q);
  await ia.evaluate(()=>{const b=document.querySelector('#nbhUiDlg[open] .primary');if(b)b.click();});
  await ia.waitForFunction(()=>document.querySelector('#mFn').value==='attention',null,{timeout:10000}).catch(()=>{});await sleep(300);
  const s=await readIA(ia);
  ok('B: IA-1\'s attention scenario fills its own hypothesis with attention',s.fn==='attention',s);
  await page.evaluate(()=>pushFactsToAll());await sleep(1500);
  const s2=await readIA(ia);
  ok('B: the next case push changes neither the hypothesis nor the simulated behavior',s2.fn==='attention'&&s2.beh===s.beh&&/simulated/.test(s2.beh),s2);
  await ctx.close();}

 /* ---------- C: Save case, then Open case ---------- */
 {const {ctx,page}=await shell(br);
  const facts=await fs1Sim(page);
  const ia=await openIn(page,'IA-1');await hasFn(ia);const inn=await openIn(page,'IN-1');await hasFn(inn);await sleep(600);
  const save=async name=>{
    const dl=page.waitForEvent('download',{timeout:30000});
    await page.evaluate(()=>document.querySelector('#saveCase').click());
    await page.waitForFunction(()=>document.querySelector('#cfDlg').open,null,{timeout:8000}).catch(()=>{});
    if(await page.evaluate(()=>document.querySelector('#cfDlg').open&&/without a student name/.test(document.querySelector('#cfTitle').textContent)))
      await page.evaluate(()=>document.querySelector('#cfFoot .primary').click());
    const d=await dl;await d.saveAs(OUT+name);await sleep(300);
    await page.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d.open)document.querySelector('#cfFoot .primary').click();});
    return JSON.parse(fs.readFileSync(OUT+name,'utf8'));};
  const reopen=async name=>{
    await page.setInputFiles('#caseFile',OUT+name);
    await page.waitForFunction(()=>document.querySelector('#cfDlg').open,null,{timeout:8000});
    await page.evaluate(()=>document.querySelector('#cfFoot .primary').click());
    await page.waitForFunction(()=>[...document.querySelectorAll('#wsToasts .ws-toast, #cfDlg[open]')].some(t=>/Case opened/.test(t.textContent)),null,{timeout:90000});
    await page.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d.open)document.querySelector('#cfFoot .primary').click();});
    const ia2=await frameOf(page,'IA-1'),in2=await frameOf(page,'IN-1');await hasFn(ia2);await hasFn(in2);
    await sleep(6000);   /* the status poll and the case pushes after the restore */
    return {ia:await readIA(ia2),in:await readIN(in2),ia2,in2};};
  let cj=await save('case-1.json');
  const own=id=>JSON.parse(cj.forms[id].snap.own);
  ok('C: the case file holds both forms with no hypothesis, and FS-1\'s function in its facts',own('IA-1').fields['m.fn']===''&&!own('IN-1').S.meta.fn&&cj.facts&&cj.facts.fn&&cj.facts.fn.key===facts.fn,
    {ia:own('IA-1').fields['m.fn'],in:own('IN-1').S.meta.fn,facts:cj.facts&&cj.facts.fn});
  let r=await reopen('case-1.json');
  ok('C: after Open case, IA-1\'s indirect hypothesis is still "not yet" and its behavior is back',r.ia.fn===''&&behStart(r.ia.beh,facts.beh[0]),r.ia);
  ok('C: after Open case, IN-1\'s interview hypothesis is still "not yet" and its behavior is back',r.in.fn===''&&!r.in.meta&&behStart(r.in.beh,facts.beh[0]),r.in);
  /* a hypothesis chosen on IN-1 is kept through another save and reopen; IA-1 stays empty */
  await page.evaluate(()=>openForm('IN-1'));
  await r.in2.evaluate(()=>{const e=document.querySelector('[data-m="fn"]');e.value='attention';e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  cj=await save('case-2.json');
  ok('C: the second case file holds IN-1\'s chosen hypothesis',own('IN-1').S.meta.fn==='attention'&&own('IA-1').fields['m.fn']==='',{in:own('IN-1').S.meta.fn});
  r=await reopen('case-2.json');
  ok('C: after the second Open case, IN-1 keeps attention (not FS-1\'s '+facts.fn+') and IA-1 is still "not yet"',r.in.fn==='attention'&&r.in.meta==='attention'&&r.ia.fn==='',{in:r.in,ia:r.ia});
  await ctx.close();}

 /* ---------- the form's own Open packet, and Save packet ---------- */
 for(const id of ['IA-1','IN-1']){
  const ctx=await br.newContext({viewport:{width:1366,height:1000}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+F[id]);await sleep(800);
  await p.evaluate(()=>{window.__al=[];window.alert=m=>window.__al.push(String(m));});
  const sel=id==='IA-1'?{fn:'#mFn',beh:'[name="m.beh"]'}:{fn:'[data-m="fn"]',beh:'[data-m="beh"]'};
  const inp=(await p.evaluateHandle(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Save packet');return b&&b.nextElementSibling;})).asElement();
  await inp.setInputFiles({name:'PACKET_Packet_Student.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'PACKET',rev:'2026-09',saved:new Date().toISOString(),
    packet:{client:'Packet Student',sid:'P-0001',beh:'Hitting peers: open-hand contact with a peer',fn:'escape'}}))});
  await sleep(700);
  const r=await p.evaluate(s=>({fn:document.querySelector(s.fn).value,beh:document.querySelector(s.beh).value,client:(()=>{for(const q of window.__nbhPacketMap.client){const e=document.querySelector(q);if(e)return e.value;}})(),al:window.__al.join(' | ')}),sel);
  ok(id+': Open packet fills the student and the behavior',r.client==='Packet Student'&&r.beh==='Hitting peers: open-hand contact with a peer',r);
  ok(id+': Open packet leaves the hypothesis alone and says so',r.fn===''&&/The function in the packet was not placed: the hypothesis on this form is your own\.$/.test(r.al),r);
  await p.evaluate(s=>{const e=document.querySelector(s);e.value='tangible';e.dispatchEvent(new Event('change',{bubbles:true}));},sel.fn);await sleep(200);
  const pk=JSON.parse((await caught(p,'Save packet'))||'{}');
  ok(id+': Save packet still carries this form\'s own hypothesis to the other forms',pk.packet&&pk.packet.fn==='tangible'&&pk.packet.client==='Packet Student',pk.packet);
  await ctx.close();}

 /* ---------- Load simulation asks first ---------- */
 for(const id of Object.keys(SIMBTN)){
  const ctx=await br.newContext({viewport:{width:1180,height:820}});const p=await ctx.newPage();wire(p,log);
  const native=[];p.on('dialog',d=>native.push(d.type()+': '+d.message().slice(0,80)));
  await p.goto(BASE+'/'+ED+'/'+F[id]);await sleep(900);
  const MARK='ZQX typed by the assessor';
  await setClient(p,MARK);
  await p.evaluate(()=>{const t=[...document.querySelectorAll('textarea')].find(e=>!e.closest('.toolbar,#nbhUiDlg,#nbhCaseDlg')&&!e.readOnly&&!e.disabled);if(t){t.value='ZQX note typed by the assessor';t.dispatchEvent(new Event('input',{bubbles:true}));}});
  if(id==='AD-1')ok('AD-1: the session log is empty (it used to ask only once a session row existed)',await p.evaluate(()=>document.querySelectorAll('#tbSess tr').length===0));
  const before=await values(p);
  await p.evaluate(s=>document.querySelector(s).click(),SIMBTN[id]);await sleep(400);
  const q=await dlgIn(p);
  ok(id+': Load simulation asks first ("'+(q?q.head:'no question')+'")',!!q&&/^Load the simulated [a-z ]+\?$/.test(q.head)&&/Anything already entered will be replaced/.test(q.body)&&q.btns.join()==='Cancel,primary:Load',q);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiDlg[open] #nbhUiF button')].find(b=>b.textContent==='Cancel');if(b)b.click();});await sleep(500);
  const kept=await values(p);
  ok(id+': Cancel keeps every field as it was',!(await dlgIn(p))&&JSON.stringify(kept)===JSON.stringify(before)&&(await clientOf(p))===MARK,{n:before.length,changed:kept.map((v,i)=>v===before[i]?null:i).filter(x=>x!==null).slice(0,8)});
  const loaded=()=>p.waitForFunction(()=>{for(const s of window.__nbhPacketMap.client){const e=document.querySelector(s);if(e)return /sim/i.test(e.value);}return false;},null,{timeout:10000}).catch(()=>{});
  await p.evaluate(s=>document.querySelector(s).click(),SIMBTN[id]);await sleep(400);
  await p.evaluate(()=>{const b=document.querySelector('#nbhUiDlg[open] #nbhUiF .primary');if(b)b.click();});await loaded();await sleep(300);
  const c1=await clientOf(p);
  ok(id+': Load replaces the entries with the simulated case ("'+c1+'")',c1!==MARK&&/sim/i.test(c1||''),c1);
  await setClient(p,MARK);await p.evaluate(()=>{window.confirm=()=>true;});
  await p.evaluate(s=>document.querySelector(s).click(),SIMBTN[id]);await loaded();await sleep(300);
  ok(id+': with window.confirm stubbed (as the older checks do), it loads without the question',!(await dlgIn(p))&&/sim/i.test((await clientOf(p))||''),await clientOf(p));
  ok(id+': no browser dialog appeared',native.length===0,native);
  await ctx.close();}

 /* ---------- files saved before this change still open ---------- */
 const expect={'IA-1':d=>({client:d.fields['m.client'],named:d.fields}),'IN-1':d=>({client:d.S.meta.client}),'PA-1':d=>({client:d.meta.client}),
   'MS-1':d=>({client:d.fields['m.client'],named:d.fields}),'AD-1':d=>({client:d.fields.s_name,named:d.fields})};
 for(const id of Object.keys(F)){
  const fp=path.join(OLD,id+'.json');if(!fs.existsSync(fp)){console.log('SKIP '+id+': no saved file at '+fp+' (set OLDSAVE)');continue;}
  const d=JSON.parse(fs.readFileSync(fp,'utf8')),e=expect[id](d);
  const ctx=await br.newContext({viewport:{width:1366,height:1000}});const p=await ctx.newPage();wire(p,log);
  await p.goto(BASE+'/'+ED+'/'+F[id]);await sleep(800);
  await p.setInputFiles('#fileIn',fp);await sleep(1500);
  const got=await p.evaluate(named=>{let client=null;for(const q of window.__nbhPacketMap.client){const el=document.querySelector(q);if(el){client=el.value;break;}}
    /* a radio group's value is the ticked radio's */
    const miss=[];if(named)for(const [k,v] of Object.entries(named)){const els=[...document.querySelectorAll('[name="'+CSS.escape(k)+'"]')],el=els[0];if(!el)continue;
      const now=el.type==='radio'?((els.find(x=>x.checked)||{}).value||''):el.type==='checkbox'?el.checked:el.value;if(typeof v==='boolean'?now!==v:String(now)!==String(v))miss.push(k);}
    return {client,miss:miss.slice(0,10),nMiss:miss.length};},e.named||null);
  ok(id+': a file saved before this change opens ('+path.basename(fp)+': student and every saved field back)',got.client===e.client&&got.nMiss===0,got);
  await ctx.close();}

 const errs=log.filter(l=>l.type!=='warning');
 ok('no page or console error in any form or the workstation',errs.length===0,errs.slice(0,6));
 if(log.length>errs.length)console.log('warnings: '+JSON.stringify(log.filter(l=>l.type==='warning').slice(0,4)));
 await br.close();console.log('RESULT '+(fails?fails+' FAIL':'all pass'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
