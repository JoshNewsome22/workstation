/* Form VI-1's primary measure (v23.41): "Count / frequency" and "Rate" are two choices (the BCBA: count and frequency are one
   thing, rate is the count divided by time), as on Form TB-1; a record saved with the old "Frequency / rate" keeps its answer
   and shows Count / frequency; a behavior from the case takes the matching choice; paper prints the words.
   Simulated data only. usage: node qa/vi1-measure-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const VI='Variable_Isolation_Protocol.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+VI);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});return p;};
  const p=await open();
  const o=await p.evaluate(()=>[...document.querySelector('[name="s_measure"]').options].map(x=>x.text).filter(Boolean));
  ok('1 the primary measure offers Count / frequency and Rate as two choices, and no "Frequency / rate"',o[0]==='Count / frequency'&&o[1]==='Rate'&&!o.some(t=>/Frequency \/ rate/.test(t)),o);
  /* a record saved before, with the old words */
  const saved=await p.evaluate(()=>new Promise(res=>{const e=document.querySelector('[name="s_measure"]');e.value='Frequency / rate';e.dispatchEvent(new Event('change',{bubbles:true}));
    const d=document.querySelector('[name="s_def"]');d.value='Striking a peer with an open hand (simulated).';d.dispatchEvent(new Event('input',{bubbles:true}));
    const u=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=u;res(t);});return u(b);};document.getElementById('btnSave').click();setTimeout(()=>res(null),3000);}));
  ok('2 the stored value stays "Frequency / rate", so records saved before and after read the same',!!saved&&/"Frequency \/ rate"/.test(saved)&&!/"Count \/ frequency"/.test(saved),saved&&saved.slice(0,120));
  const q=await open();
  const b=await q.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'VI-1.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,900));const e=document.querySelector('[name="s_measure"]');return {v:e.value,shown:e.options[e.selectedIndex]&&e.options[e.selectedIndex].text};},saved);
  ok('3 a record saved with "Frequency / rate" opens with its answer kept, shown as Count / frequency',b.v==='Frequency / rate'&&b.shown==='Count / frequency',b);
  await q.emulateMedia({media:'print'});const pr=await q.evaluate(()=>{const e=document.querySelector('[name="s_measure"]');return (e.closest('div')||e.parentNode).textContent.replace(/\s+/g,' ');});await q.emulateMedia({media:'screen'});
  ok('4 paper prints Count / frequency',/Count \/ frequency/.test(pr)&&!/Frequency \/ rate/.test(pr),pr.slice(0,160));
  /* a behavior from the case */
  const pick=async dim=>{const r=await open();const v=await r.evaluate(d=>{window.__nbhFactsIn({behaviors:[{label:'Hitting (simulated)',def:'Striking a peer (simulated).',dim:d}]});const e=document.querySelector('[name="s_measure"]');return {v:e.value,t:e.options[e.selectedIndex]&&e.options[e.selectedIndex].text};},dim);await r.close();return v;};
  const c1=await pick('Count / frequency'),c2=await pick('Rate'),c3=await pick('Duration'),c4=await pick('Intensity / magnitude');
  ok('5 a behavior from the case takes the matching choice: Count / frequency, Rate, Duration, the intensity scale',c1.t==='Count / frequency'&&c2.t==='Rate'&&c3.t==='Duration'&&c4.t==='Intensity / severity scale',{c1,c2,c3,c4});
  ok('6 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
