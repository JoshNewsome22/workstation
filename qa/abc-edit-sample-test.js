/* Form ABC-1: a saved background sample can be corrected (v23.39). Each sample has Edit, as an incident does: its answers
   come back into the Background samples form with a line saying which is open; Save changes replaces it where it stands
   (its id kept, an older file's window in minutes kept, its sound level kept, changed or taken off with the box); Cancel
   edit leaves it as it was; deleting it, or a background check coming due, closes it; nothing of it prints.
   Simulated data only. usage: node qa/abc-edit-sample-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');await sleep(1000);
  await p.evaluate(()=>{nbhUI.toast=()=>{};nbhUI.confirm=async()=>true;window.confirm=()=>true;switchTab('background');});
  const ids=await p.evaluate(()=>({a:[...document.querySelectorAll('#bg-a-opts input[type=checkbox]')].slice(0,3).map(x=>x.id),c:[...document.querySelectorAll('#bg-c-opts input[type=checkbox]')].slice(0,2).map(x=>x.id)}));
  const fill=async(time,act,aIds,noise)=>{await p.fill('#bg-date','2026-10-19');await p.fill('#bg-time',time);await p.fill('#bg-activity',act);
    for(const id of aIds)await p.evaluate(i=>{const c=document.getElementById(i);if(!c.checked)c.click();},id);if(noise!=null)await p.fill('#bg-noise',noise);await p.click('#bg-save');await sleep(150);};
  await fill('09:05','Group math (simulated)',[ids.a[0],ids.a[1]],null);await fill('09:10','Transition (simulated)',[ids.a[2]],'64');
  const before=await p.evaluate(()=>JSON.parse(JSON.stringify(state.samples)));
  const btn=await p.evaluate(()=>[...document.querySelectorAll('#bg-table tbody tr')].map(r=>[...r.querySelectorAll('button')].map(b=>b.textContent.trim())));
  ok('1 each saved sample has Edit beside Delete',btn.length===2&&btn.every(b=>JSON.stringify(b)==='["Edit","Delete"]'),btn);
  await p.click('#bg-table tbody tr:nth-child(1) [data-editsample]');await sleep(150);
  const f=await p.evaluate(a=>({t:document.getElementById('bg-time').value,act:document.getElementById('bg-activity').value,chk:a.map(i=>document.getElementById(i).checked),
    flag:document.getElementById('bg-edit-flag').hidden?null:document.getElementById('bg-edit-flag').textContent,save:document.getElementById('bg-save').textContent,cancel:!document.getElementById('bg-edit-cancel').hidden,
    row:document.querySelector('#bg-table tbody tr:nth-child(1)').className}),ids.a);
  ok('2 Edit puts the sample’s answers back in the form and says which sample is open',f.t==='09:05'&&f.act==='Group math (simulated)'&&JSON.stringify(f.chk)==='[true,true,false]'
    &&/Editing the sample of 2026-10-19 at 09:05/.test(f.flag||'')&&f.save==='Save changes'&&f.cancel&&f.row==='bg-editing',f);
  await p.evaluate(i=>{document.getElementById(i[0]).click();document.getElementById(i[2]).click();},ids.a);await p.fill('#bg-activity','Group reading (simulated)');await p.fill('#bg-time','09:06');
  await p.evaluate(i=>document.getElementById(i).click(),ids.c[0]);await p.click('#bg-save');await sleep(200);
  const a=await p.evaluate(()=>({s:JSON.parse(JSON.stringify(state.samples)),flag:document.getElementById('bg-edit-flag').hidden,save:document.getElementById('bg-save').textContent,cancel:document.getElementById('bg-edit-cancel').hidden,
    st:document.getElementById('bg-status').textContent,any:[...document.querySelectorAll('#bg-a-opts input,#bg-c-opts input')].some(x=>x.checked)}));
  ok('3 Save changes replaces the sample where it stands (same id, same place, the new answers), and the form is ready for the next one',a.s.length===2&&a.s[0].id===before[0].id&&a.s[1].id===before[1].id
    &&a.s[0].time==='09:06'&&a.s[0].activity==='Group reading (simulated)'&&JSON.stringify(a.s[0].antecedents)===JSON.stringify([ids.a[1],ids.a[2]].map(x=>x.replace(/^bga-/,'')))&&JSON.stringify(a.s[0].events)===JSON.stringify([ids.c[0].replace(/^bgc-/,'')])
    &&a.flag&&a.save==='Save sample'&&a.cancel&&a.st==='Sample updated.'&&!a.any,a);
  /* the sound level box */
  await p.click('#bg-table tbody tr:nth-child(2) [data-editsample]');await sleep(150);const nv=await p.inputValue('#bg-noise');
  await p.fill('#bg-noise','66');await p.click('#bg-save');await sleep(200);const n1=await p.evaluate(()=>state.samples[1].noise);
  await p.click('#bg-table tbody tr:nth-child(2) [data-editsample]');await sleep(150);await p.fill('#bg-noise','');await p.click('#bg-save');await sleep(200);const n2=await p.evaluate(()=>state.samples[1].noise);
  ok('4 its sound level comes back in the box, is changed with it, and is taken off when the box is emptied',nv==='64'&&n1&&n1.v===66&&n1.src==='typed'&&n2===undefined,{nv,n1,n2});
  /* Cancel edit */
  await p.click('#bg-table tbody tr:nth-child(1) [data-editsample]');await sleep(150);await p.evaluate(i=>document.getElementById(i).click(),ids.a[0]);await p.fill('#bg-activity','Changed (simulated)');
  const s0=await p.evaluate(()=>JSON.stringify(state.samples[0]));await p.click('#bg-edit-cancel');await sleep(150);
  const cn=await p.evaluate(s0=>({same:JSON.stringify(state.samples[0])===s0,flag:document.getElementById('bg-edit-flag').hidden,any:[...document.querySelectorAll('#bg-a-opts input')].some(x=>x.checked),save:document.getElementById('bg-save').textContent}),s0);
  ok('5 Cancel edit leaves the sample as it was and empties the form',cn.same&&cn.flag&&!cn.any&&cn.save==='Save sample',cn);
  /* deleting the open sample */
  await p.click('#bg-table tbody tr:nth-child(2) [data-editsample]');await sleep(150);await p.click('#bg-table tbody tr:nth-child(2) [data-delsample]');await sleep(300);
  const dl=await p.evaluate(()=>({n:state.samples.length,flag:document.getElementById('bg-edit-flag').hidden,save:document.getElementById('bg-save').textContent,ed:state.bgEditingId}));
  ok('6 deleting the sample that is open closes it',dl.n===1&&dl.flag&&dl.save==='Save sample'&&!dl.ed,dl);
  /* an older file's sample, its window in minutes */
  await p.evaluate(()=>{state.samples.push({id:'old1',date:'2026-09-02',time:'10:00',window:5,unit:'min',activity:'Math (simulated)',antecedents:[],events:[],precursors:[],settingEvents:[],staffPresent:'yes'});renderSamples();});
  await p.click('#bg-table tbody tr:nth-child(2) [data-editsample]');await sleep(150);const of=await p.evaluate(()=>document.getElementById('bg-edit-flag').textContent);
  await p.evaluate(i=>document.getElementById(i).click(),ids.a[0]);await p.click('#bg-save');await sleep(200);const os=await p.evaluate(()=>state.samples.find(x=>x.id==='old1'));
  ok('7 an older file’s sample keeps its window in minutes when its number is left as it was',/its window is in minutes/.test(of)&&os.unit==='min'&&os.window===5&&os.staffPresent==='yes'&&os.antecedents.length===1,{of,os});
  /* a check coming due while a sample is open */
  await p.click('#bg-table tbody tr:nth-child(2) [data-editsample]');await sleep(150);
  await p.evaluate(()=>{document.getElementById('bg-date').value='2026-10-19';document.getElementById('bg-time').value='09:30';window.dispatchEvent(new CustomEvent('abc-record-window',{detail:{k:1,at:Date.now(),win:10}}));});await sleep(150);
  const rw=await p.evaluate(()=>({ed:state.bgEditingId,flag:document.getElementById('bg-edit-flag').hidden,any:[...document.querySelectorAll('#bg-a-opts input')].some(x=>x.checked),t:document.getElementById('bg-time').value}));
  ok('8 a background check coming due closes the open sample: the new check starts from an empty form',!rw.ed&&rw.flag&&!rw.any&&rw.t==='09:30',rw);
  /* nothing of it prints */
  await p.click('#bg-table tbody tr:nth-child(1) [data-editsample]');await sleep(150);
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>({btn:getComputedStyle(document.querySelector('[data-editsample]').closest('td')).display,flag:getComputedStyle(document.getElementById('bg-edit-flag').closest('.btnrow')).display}));await p.emulateMedia({media:'screen'});
  ok('9 the Edit buttons and the editing line are not printed',pr.btn==='none'&&pr.flag==='none',pr);
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
