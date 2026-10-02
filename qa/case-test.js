/* v21.31 the case: TB-1/FS-1/GB-1/PA-1 simulations flow into the consuming forms through the shell */
const {chromium,fs,BASE,wire,sleep}=require('./lib');
(async()=>{
  const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(800);
  const open=async id=>{await page.evaluate(id=>openForm(id),id);
    const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const sim=async(id)=>{const f=await open(id);await f.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);return f;};
  /* the sources */
  const tb=await sim('TB-1'),fs1=await sim('FS-1'),gb=await sim('GB-1'),pa=await sim('PA-1');
  await sleep(7000);   /* status poll (4 s) notices the new signatures, the shell re-reads the four forms */
  const facts=await page.evaluate(()=>state.facts);
  const summ=f=>({beh:(f.behaviors||[]).map(b=>b.label),src:f.src,fn:f.fn&&(f.fn.key+' / '+f.fn.label),st:(f.fn&&f.fn.statements||[]).length,
    red:(f.goals&&f.goals.red||[]).map(r=>r.beh),acq:(f.goals&&f.goals.acq||[]).map(a=>a.beh),menu:(f.menu||[]).slice(0,4).map(m=>m.rank+' '+m.name+' '+m.tier)});
  console.log('FACTS',JSON.stringify(facts?summ(facts):null,null,1));
  console.log('BAR',await page.evaluate(()=>({hidden:$('#factsRow').hidden,text:$('#factsTxt').textContent})));
  /* the consumers, opened after the facts exist: each gets them on load */
  const out={};
  const read=async(id,fn)=>{const f=await open(id);await sleep(1500);out[id]=await f.evaluate(fn);};
  await read('SM-1',()=>({tg:S.tg.map(t=>t.word),t_reduce:S.meta.t_reduce,func:S.meta.func,menu:S.meta.menu,btn:(document.querySelector('#nbhCaseBtn')||{}).textContent}));
  await read('HD-1',()=>({bh:S.bh.map(b=>b.name+' | '+b.ex.slice(0,40))}));
  await read('DD-1',()=>({beh:S.behaviors.map(b=>b.kind+': '+b.name+' aim='+b.aim+' pair='+b.pairWith)}));
  await read('SA-1',()=>({skill:S.meta.skill,goal:(S.meta.goal||'').slice(0,90),sd:S.meta.sd,reinf:S.meta.reinforcer}));
  await read('SR-1',()=>({beh:(S.meta.beh||'').slice(0,70),behs:S.meta.behs,alt:S.meta.alt,func:S.meta.func,sr:S.meta.sr}));
  await read('DA-1',()=>({target:(S.meta.target||'').slice(0,70),hyp:(S.meta.hyp||'').slice(0,90)}));
  await read('CN-1',()=>({goal:S.meta.goal}));
  await read('OB-1',()=>({beh:(document.querySelector('[data-meta="behavior"]')||{}).value,fn:(document.querySelector('[data-m="fn"],[name="m.fn"]')||{}).value}));
  await read('TD-1',()=>({beh:(document.querySelector('[name="m.beh"]')||{}).value,fn:(document.querySelector('[name="m.fn"]')||{}).value}));
  await read('MT-1',()=>({beh:(document.querySelector('[data-m="beh"]')||{}).value}));
  await read('ABC-1',()=>({beh:(document.querySelector('#h-target')||{}).value}));
  await read('SI-1',()=>({beh:S.meta.beh||'',btn:(document.querySelector('#nbhCaseBtn')||{}).textContent}));
  await read('TI-1',()=>({beh:(document.querySelector('[data-m="beh"]')||{}).value,fn:(document.querySelector('[data-m="fn"]')||{}).value}));
  console.log('CONSUMERS',JSON.stringify(out,null,1));
  /* the picker on SM-1: tick the first behavior, use it */
  const sm=await open('SM-1');await sm.evaluate(()=>document.querySelector('#nbhCaseBtn').click());await sleep(300);
  const dlgOpen=await sm.evaluate(()=>document.querySelector('#nbhCaseDlg').open);
  await sm.evaluate(()=>{document.querySelectorAll('#nbhcBody input').forEach(c=>c.checked=false);document.querySelector('#nbhcBody input[data-kind="beh"]').checked=true;});
  await sm.evaluate(()=>document.querySelector('#nbhcUse').click());await sleep(300);
  console.log('PICK',JSON.stringify({dlgOpen,done:await sm.evaluate(()=>document.querySelector('#nbhcDone').textContent),tg:await sm.evaluate(()=>S.tg.map(t=>t.word))}));
  await page.screenshot({path:'/tmp/sm1-picker.png'});
  /* the packet file carries the facts */
  const pk=await page.evaluate(()=>{$('#pClient').value='Sample';return JSON.parse(JSON.stringify({form:'PACKET',packet:packet(),facts:state.facts})).facts.behaviors.length;});
  console.log('PACKET facts behaviors',pk);
  /* a rename on TB-1 reaches the others */
  await tb.evaluate(()=>{const e=document.querySelector('[name="tgt[0].lab"]');e.value='Hitting (renamed)';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(7000);
  console.log('RENAME',JSON.stringify(await page.evaluate(()=>state.facts.behaviors.map(b=>b.label))),'SM-1 button:',await sm.evaluate(()=>document.querySelector('#nbhCaseBtn').textContent));
  await page.screenshot({path:'/tmp/shell.png'});
  console.log('LOG',JSON.stringify(log.slice(0,12)));
  await br.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
