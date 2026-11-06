/* v25.67 Form TB-1's replacement-behavior library (tools/blocks/tb1-replacement-library.json, written into the form as
   <script id="tb1-rlib"> by tools/blocks/patch-tb1-rlib.py) and its picker beside each card's replacement field.
   1. the library loads: version 2026-11, as many entries as the JSON file, 40 to 70, every pairs id a TB-1 problem
      behavior, every note naming its studies, every teaching line without physical guidance beyond what the student allows
   2. the tool's --check is clean (the form holds exactly the copy the library writes)
   3. for a card whose problem behavior is in an entry's pairs, the picker lists the paired entries first, then those
      that suit the card's function, then the rest
   4. choosing fills an empty field with the label and definition, may replace an earlier library choice, and never
      overwrites words typed in the field; the other forms take a library choice under its label
   5. a search by one of an entry's other names (aka) finds it
   6. a TB-1 case saved by the form before v25.67 (simulated; the v25.65 test's file, with a typed replacement) opens
      with every field as saved, and opening the picker changes nothing
   7. the picker adds no control to the page (it lives in a shadow root), and there are no page errors
   Chromium only. Prints PASS / FAIL lines and RESULT; exit code 1 on any failure.
   usage: node qa/v2567-tb1-rlib-test.js */
const {chromium,BASE,ROOT,wire,sleep,fs,path}=require(__dirname+'/lib.js');
const {spawnSync}=require('child_process');
const URL=BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(!c&&i!==undefined?'  '+String(typeof i==='string'?i:JSON.stringify(i)).slice(0,700):''));if(!c)fails++;};
const host=t=>`#tgtWrap .card[data-tgt="${t}"] .tb1rlib-host`;
const JSONLIB=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','blocks','tb1-replacement-library.json'),'utf8'));
/* the v25.65 test's simulated case, saved by the form before v25.67, with a replacement typed on card 0 */
const OLD=(()=>{const src=fs.readFileSync(path.join(__dirname,'v2565-tb1lib-test.js'),'utf8');const m=/const OLD=(\{.*?\});\n/.exec(src);const o=JSON.parse(m[1]);
 o.saved='2026-11-05T15:00:00.000Z';o.fields['tgt[0].rep']='Asks for a short break with the green card (team wording, simulated)';o.fields['tgt[0].fn']='Escape / avoidance (social negative)';return o;})();
(async()=>{const br=await chromium.launch();const log=[],errs=[];
 try{
  /* 2 the tool's --check */
  const chk=spawnSync('python3',[path.join(ROOT,'tools','blocks','patch-tb1-rlib.py'),'--check'],{cwd:ROOT,encoding:'utf8'});
  ok('2 patch-tb1-rlib.py --check is clean (the form holds exactly the copy the library writes)',chk.status===0,(chk.stdout||'')+(chk.stderr||''));

  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});const page=await ctx.newPage();wire(page,log);page.on('pageerror',e=>errs.push(e.message));
  await page.goto(URL,{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="define"]').click());await sleep(300);

  /* 1 the library loads */
  const L=await page.evaluate(()=>({version:TB1_RLIB.version,note:TB1_RLIB.note,entries:TB1_RLIB.entries,pids:TB1_LIB.entries.map(e=>e.id),one:document.querySelectorAll('script#tb1-rlib').length}));
  const E=L.entries,byId=Object.fromEntries(E.map(e=>[e.id,e]));
  ok('1 the library loads: version 2026-11, one copy, the JSON file\'s '+JSONLIB.entries.length+' entries in order',L.version==='2026-11'&&L.one===1&&E.length===JSONLIB.entries.length&&E.every((e,i)=>e.id===JSONLIB.entries[i].id),{v:L.version,one:L.one,n:E.length});
  ok('1 it holds 40 to 70 entries ('+E.length+')',E.length>=40&&E.length<=70,E.length);
  ok('1 every pairs id is a TB-1 problem-behavior entry, and every entry pairs with at least one',E.every(e=>e.pairs.length&&e.pairs.every(p=>L.pids.includes(p))),E.filter(e=>!e.pairs.every(p=>L.pids.includes(p))).map(e=>e.id));
  ok('1 every note names its studies ("Definition after ..."), and the library note names the journals',E.every(e=>/^Definition after [A-Z]/.test(e.note))&&/Journal of Applied Behavior Analysis/.test(L.note)&&/Behavior Analysis in Practice/.test(L.note),E.filter(e=>!/^Definition after/.test(e.note)).map(e=>e.id));
  ok('1 every entry has the fields the picker shows, and its teaching uses no physical guidance beyond what the student allows',
   E.every(e=>['id','cat','lab','def','ex','nex','measure','teach','crit','note'].every(k=>typeof e[k]==='string'&&e[k].trim())&&Array.isArray(e.aka)&&e.aka.length&&Array.isArray(e.fn)&&e.fn.length&&/no physical guidance beyond what the student allows/.test(e.teach)),
   E.filter(e=>!/no physical guidance beyond what the student allows/.test(e.teach||'')).map(e=>e.id));
  ok('1 per-response criteria are 100%; an interval, time-sample or duration criterion says so',E.every(e=>{const p=(e.crit.match(/(\d+)\s*%/g)||[]).map(x=>parseInt(x,10));return !p.length||Math.min(...p)>=100||/interval|time.sampl|duration|of the walk|samples?/i.test(e.crit);}),E.filter(e=>/\b[0-9]{1,2}\s*%/.test(e.crit)&&!/interval|time.sampl|duration|of the walk|sample/i.test(e.crit)).map(e=>e.id));

  /* 3 the order follows the card's problem behavior and function */
  const LAB='Elopement from the assigned area',PID='elo-area';
  await page.fill('[name="tgt[0].lab"]',LAB);await page.dispatchEvent('[name="tgt[0].lab"]','change');
  await page.selectOption('[name="tgt[0].fn"]','Escape / avoidance (social negative)');await sleep(200);
  const light=await page.evaluate(h=>document.querySelector(h).querySelectorAll('button,input,select,textarea').length,host(0));
  const ctl0=await page.evaluate(()=>document.querySelectorAll('input,select,textarea,button').length);
  await page.locator(host(0)+' button.open').click();await sleep(200);
  const list=()=>page.evaluate(h=>{const r=document.querySelector(h).shadowRoot;return [...r.querySelectorAll('.grp')].map(g=>({g:g.dataset.g,h:g.querySelector('.gh').textContent,ids:[...g.querySelectorAll('.it')].map(b=>b.dataset.id)}));},host(0));
  const G=await list();const flat=G.flatMap(g=>g.ids);
  const paired=E.filter(e=>e.pairs.includes(PID)).map(e=>e.id),suits=E.filter(e=>!e.pairs.includes(PID)&&(e.fn.includes('escape')||e.fn.includes('any'))).map(e=>e.id);
  ok('3 the picker opens with every entry listed once ('+flat.length+')',flat.length===E.length&&new Set(flat).size===E.length,flat.length);
  ok('3 for a card labelled "'+LAB+'", the '+paired.length+' entries that pair with it come first, under their own heading',paired.length>0&&G[0]&&G[0].g==='pair'&&JSON.stringify(G[0].ids)===JSON.stringify(paired)&&/Pairs with Elopement from the assigned area/.test(G[0].h),G.map(g=>[g.g,g.ids.length]));
  ok('3 then the entries that suit the card\'s escape function, then the rest',G[1]&&G[1].g==='fn'&&JSON.stringify(G[1].ids)===JSON.stringify(suits)&&G[2]&&G[2].g==='rest'&&G[2].ids.every(id=>!paired.includes(id)&&!suits.includes(id)),G.map(g=>[g.g,g.ids.length]));
  await page.selectOption('[name="tgt[0].fn"]','Attention (social positive)');await sleep(200);
  const G2=await list();
  ok('3 the order follows a change of function while the picker is open',G2[1]&&G2[1].g==='fn'&&G2[1].ids.every(id=>byId[id].fn.includes('attention')||byId[id].fn.includes('any'))&&G2[1].ids.includes('r-attention')&&!G2[1].ids.includes('r-break'),G2.map(g=>[g.g,g.ids.slice(0,3)]));

  /* 4 choosing */
  const rep=()=>page.evaluate(()=>document.querySelector('[name="tgt[0].rep"]').value);
  const pick=async id=>{await page.locator(host(0)+` .it[data-id="${id}"]`).click();await sleep(150);};
  const msg=()=>page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.msg').textContent,host(0));
  ok('4 the replacement field starts empty',await rep()==='');
  const first=G[0].ids[0];await pick(first);
  ok('4 choosing an entry fills the empty field with its label and definition ('+byId[first].lab+')',await rep()===byId[first].lab+' — '+byId[first].def,await rep());
  const det=await page.evaluate(h=>{const d=document.querySelector(h).shadowRoot.querySelector('.detail');return d.hidden?'':d.textContent;},host(0));
  ok('4 the entry is shown with its measure, teaching, criterion and studies',det.includes(byId[first].measure)&&det.includes(byId[first].crit)&&det.includes(byId[first].note)&&/How it is taught/.test(det),det.slice(0,200));
  const second=G[0].ids[1]||'r-wait';await pick(second);
  ok('4 choosing another replaces an earlier library choice ('+byId[second].lab+')',await rep()===byId[second].lab+' — '+byId[second].def,await rep());
  const facts=await page.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();const b=o&&o.behaviors&&o.behaviors.find(x=>x.label==='Elopement from the assigned area');return b?b.rep:null;});
  ok('4 the other forms of the case take the choice under its label alone',facts===byId[second].lab,facts);
  const OWN='Asks to walk to the office with the pass (the team’s words)';
  await page.fill('[name="tgt[0].rep"]',OWN);await page.dispatchEvent('[name="tgt[0].rep"]','change');
  await pick(first);
  ok('4 choosing never overwrites words typed in the field, and says so',await rep()===OWN&&/left as it is/.test(await msg()),{rep:await rep(),msg:await msg()});
  await page.fill('[name="tgt[0].rep"]',byId[first].lab+' — '+byId[first].def+' Practised on the playground first.');await pick(second);
  ok('4 an edited library choice counts as typed words and is kept',/Practised on the playground first\.$/.test(await rep()),await rep());
  await page.fill('[name="tgt[0].rep"]','');await page.dispatchEvent('[name="tgt[0].rep"]','change');
  await page.fill('[name="tgt[0].rep"]','Asks');await page.type('[name="tgt[0].rep"]',' for a break');
  ok('4 typing in the field stays free',await rep()==='Asks for a break',await rep());

  /* 5 search by another name */
  const search=async w=>{await page.locator(host(0)+' input.q').fill(w);await sleep(120);return (await list()).flatMap(g=>g.ids);};
  for(const [id,w] of [['r-lure','stranger danger'],['r-oral-item','chew tube'],['r-excuse-wait','polite interrupt'],['r-stay-near','hand on the cart']]){
   const r=await search(w);ok('5 a search for "'+w+'" (one of its other names) finds '+id,r.includes(id)&&byId[id].aka.includes(w),r.slice(0,5));}
  const none=await search('zzqx');
  ok('5 a search with no match says so',none.length===0&&await page.evaluate(h=>!!document.querySelector(h).shadowRoot.querySelector('.none'),host(0)));
  await page.locator(host(0)+' input.q').fill('');

  /* 7 no control added to the page */
  const ctl1=await page.evaluate(()=>document.querySelectorAll('input,select,textarea,button').length);
  ok('7 the picker adds no control to the page: it lives in a shadow root (light DOM '+light+', page controls '+ctl0+' then '+ctl1+')',light===0&&ctl0===ctl1,{light,ctl0,ctl1});

  /* 6 a case saved before v25.67 opens as saved */
  const page2=await ctx.newPage();const errs2=[];page2.on('pageerror',e=>errs2.push(e.message));
  await page2.goto(URL,{waitUntil:'load'});await sleep(1200);await page2.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await page2.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'tb1-old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(OLD));
  await sleep(1200);
  if(await page2.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);})){await page2.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiDlg button')].pop();b&&b.click();});await sleep(800);}
  const diff=()=>page2.evaluate(F=>{const bad=[];Object.keys(F).forEach(k=>{const el=document.querySelector('[name="'+k+'"]');if(!el){bad.push(k+' missing');return;}const v=el.type==='checkbox'?el.checked:el.value;if(v!==F[k])bad.push(k);});return bad;},OLD.fields);
  const d0=await diff();
  ok('6 a TB-1 case saved before v25.67 opens with every one of its '+Object.keys(OLD.fields).length+' fields as saved, the typed replacement included',d0.length===0,d0.slice(0,10));
  await page2.evaluate(()=>document.querySelector('#viewSeg button[data-view="define"]').click());await sleep(200);
  await page2.locator(host(0)+' button.open').click();await sleep(200);
  const G3=await page2.evaluate(h=>[...document.querySelector(h).shadowRoot.querySelectorAll('.grp')].map(g=>g.dataset.g+':'+g.querySelectorAll('.it').length),host(0));
  const d1=await diff();
  ok('6 opening the picker on that case changes nothing, and it lists the entries paired with its card (hair pulling) first',d1.length===0&&/^pair:/.test(G3[0]||''),{d1:d1.slice(0,5),G3});
  await page2.locator(host(0)+' .it').first().click();await sleep(150);
  ok('6 choosing from the library there leaves the typed replacement as it is',await page2.evaluate(()=>document.querySelector('[name="tgt[0].rep"]').value)===OLD.fields['tgt[0].rep']);
  const rep1=await page2.evaluate(()=>document.querySelector('[name="tgt[1].rep"]').value);
  await page2.locator(host(1)+' button.open').click();await sleep(150);await page2.locator(host(1)+' .it').first().click();await sleep(150);
  const rep1b=await page2.evaluate(()=>document.querySelector('[name="tgt[1].rep"]').value);
  ok('6 and fills the empty replacement field of its second card',rep1===''&&/ — /.test(rep1b),rep1b);

  ok('7 no page errors',errs.length===0&&errs2.length===0,errs.concat(errs2));
 }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e));}
 await br.close();
 console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
