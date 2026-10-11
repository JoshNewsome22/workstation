/* v21.86 the leave guard (nbh-guard, in every form): a file chosen after Open data is the form's own file, so the form is
   as saved; any other file chosen (a student's photo in DD-1, a plan read into GB-1 from Form TD-1's file) is a change,
   and work typed before it stays unsaved. Each form opened on its own (where the guard warns before the tab closes):
     1 typed work is unsaved (the form's mark, nbhGuard, and the leave warning)
     2 a photo or another form's file chosen afterwards: still unsaved, still warned
     3 Save data: saved; typed again: unsaved; Open data with the saved file: as saved, no warning
   Found by the full check (qa/link-tk1-test.js check 19). Simulated student only. usage: node qa/guard-open-test.js */
const {chromium,fs,path,BASE,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/guard-open';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const PNG=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108020000009077053de0000000c4944415408d763f8cfc000000301010018dd8db00000000049454e44ae426082','hex');
fs.writeFileSync(OUT+'/photo.png',PNG);
const FORMS=[
  {id:'DD-1',file:'Daily_Behavior_Data_and_Visual_Analysis.html',other:{sel:'#filePhoto',file:OUT+'/photo.png',what:'the student’s photo'}},
  {id:'GB-1',file:'GB-1_Goal-and-Objective-Builder_v2026-09.html',other:{btn:'#planBtn',make:'TD-1',what:'Form TD-1’s plan read in'}},
  {id:'TE-1',file:'TE-1_Token-Economy-Designer_v2026-09.html'},
  {id:'VS-1',file:'VS-1_Visual-Supports_v2026-10.html',other:{sel:'#photoIn',file:OUT+'/photo.png',what:'a picture for a card'}}];
(async()=>{const br=await chromium.launch();
  /* a Form TD-1 data file to read into GB-1: TD-1's own simulation, saved */
  let tdFile=null;{const p=await br.newPage({acceptDownloads:true});await p.goto(BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;nbhUI.alert=async()=>{};}catch(e){}document.querySelector('#simBtn').click();});await sleep(1500);
    const [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>{const b=document.querySelector('#saveBtn,#btnSave,#dl-json')||[...document.querySelectorAll('button')].find(x=>/^\s*save data\s*$/i.test(x.textContent));b.click();})]);
    tdFile=OUT+'/td1.json';await dl.saveAs(tdFile);await p.close();}
  for(const F of FORMS){
    const ctx=await br.newContext({viewport:{width:1180,height:820},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;nbhUI.alert=async()=>{};}catch(e){}const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(1800);
    const st=()=>p.evaluate(()=>{const ev=new Event('beforeunload',{cancelable:true});window.dispatchEvent(ev);return {un:!!(window.nbhState&&nbhState.unsaved()),guard:!!(window.nbhGuard&&nbhGuard.isDirty()),warn:ev.defaultPrevented};});
    const save=async()=>{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>{const b=document.querySelector('#saveBtn,#btnSave,#dl-json')||[...document.querySelectorAll('button')].find(x=>/^\s*save data\s*$/i.test(x.textContent));b.click();})]);const f=OUT+'/'+F.id+'.json';await dl.saveAs(f);await sleep(2500);return f;};
    const type=async w=>{await p.evaluate(w=>{const L=[...document.querySelectorAll('textarea,input[type=text],input:not([type])')].filter(e=>!e.readOnly&&!e.disabled&&!e.closest('dialog,.nbh-toolbar,#nbhToolbar')&&(e.name||e.id||e.dataset.m));const t=L.find(e=>e.offsetParent!==null)||L[0];t.focus();t.value=(t.value||'')+' '+w;t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));},w);await sleep(2500);};
    const f0=await save();await type('TYPED-ONE');const s1=await st();
    ok(F.id+' 1 typed work is unsaved and warned',s1.un&&s1.guard&&s1.warn,s1);
    if(F.other){
      if(F.other.sel)await p.setInputFiles(F.other.sel,F.other.file);
      else{const [ch]=await Promise.all([p.waitForEvent('filechooser',{timeout:10000}),p.evaluate(s=>document.querySelector(s).click(),F.other.btn)]);await ch.setFiles(tdFile);}
      await sleep(2500);await p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(d&&d.open){const b=d.querySelector('.primary');if(b)b.click();}});await sleep(1500);
      const s2=await st();ok(F.id+' 2 '+F.other.what+' chosen afterwards: the typed work is still unsaved and warned',s2.un&&s2.guard&&s2.warn,s2);}
    const f1=await save();const s3=await st();ok(F.id+' 3a Save data: as saved, no warning',!s3.un&&!s3.guard&&!s3.warn,s3);
    await type('TYPED-TWO');const s4=await st();ok(F.id+' 3b typed again: unsaved',s4.un&&s4.guard,s4);
    const [ch]=await Promise.all([p.waitForEvent('filechooser',{timeout:10000}),p.evaluate(()=>{const b=document.querySelector('#loadBtn,#btnLoad,#up-json')||[...document.querySelectorAll('button')].find(x=>/^\s*open data\s*$/i.test(x.textContent));b.click();})]);
    await sleep(300);await p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(d&&d.open){const b=d.querySelector('.primary,.danger');if(b)b.click();}});
    await ch.setFiles(f1);await sleep(2500);await p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(d&&d.open){const b=d.querySelector('.primary,.danger');if(b)b.click();}});await sleep(2500);
    const s5=await st();ok(F.id+' 3c Open data with the saved file: as saved, no warning',!s5.un&&!s5.guard&&!s5.warn,s5);
    ok(F.id+' no page errors',!errs.length,errs.slice(0,3));await ctx.close();}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
