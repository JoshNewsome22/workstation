/* Form RR-1, review Wave 3 part 3 (I14): the inventory and the restraint history from the case. The records Form IC-1 names are
   marked to review on the Sources sheet, not ticked; the restraint and seclusion counts, their period and the most recent come
   from Form CR-1 (or Form DD-1's incident record), and whether the crisis plan is current from CR-1's dates. Each fills an
   empty field only. Simulated data only. usage: node qa/rr1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const iso=d=>d.toISOString().slice(0,10),day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d;},mdy=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
  /* ---- what IC-1 and CR-1 send ---- */
  const ic=await open(file('IC-1_'));await ic.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const C=await ic.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.consent;});
  ok('1 IC-1 sends the records it names as already held',C&&/^Current IEP and BIP/.test(C.records||''),C&&C.records);
  const cr=await open(file('CR-1_'));await cr.evaluate(()=>document.getElementById('simBtn').click());await sleep(1200);
  const X=await cr.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.crisis;});
  ok('2 CR-1 sends its plan date, its review dates and the semester its restraint count covers',X&&X.src==='CR-1'&&!!X.planDate&&('revNext' in X)&&('revLast' in X)&&(!X.restraints||X.sem&&(X.sem.from||X.sem.to)),
    X&&{planDate:X.planDate,revNext:X.revNext,revLast:X.revLast,sem:X.sem,restraints:X.restraints});
  /* ---- RR-1: the records IC-1 names ---- */
  const rr=await open(file('RR-1_'));
  const recs='Current IEP and BIP, discipline records, attendance, prior FBA (date), health record, cumulative folder (simulated)';
  const a=await rr.evaluate(recs=>{const r=window.__nbhFactsIn({consent:{src:'IC-1',records:recs}});
    const rows=[...document.querySelectorAll('#srcTbl tbody tr')].map(tr=>{const cb=tr.querySelector('input[type=checkbox]');return {k:cb.name.split('.')[1],on:cb.checked,tag:!!tr.querySelector('.rr-ic1')};});
    return {r,tagged:rows.filter(x=>x.tag).map(x=>x.k),ticked:rows.filter(x=>x.on).map(x=>x.k),hint:document.getElementById('srcIc1').hidden?'':document.getElementById('srcIc1').textContent,
      other:document.querySelector('[name="src.other.name"]').value,h:document.querySelector('[name="src.ic1"]').value};},recs);
  ok('3 I14 the records Form IC-1 names are marked to review on the Sources sheet, and none is ticked',a.tagged.join()==='iep,fba,bip,odr,att,health,other'&&!a.ticked.length&&a.other==='cumulative folder'&&
    a.hint==='Form IC-1 names 7 records as already held and to be reviewed, marked below. Tick each once it has been examined.'&&a.r.filled>=2&&/the records Form IC-1 names/.test(a.r.note),a);
  const b=await rr.evaluate(()=>{const cb=document.querySelector('[name="src.iep.r"]');cb.click();
    return {tagged:[...document.querySelectorAll('#srcTbl .rr-ic1')].length,hint:document.getElementById('srcIc1').textContent,iepTag:!!cb.closest('tr').querySelector('.rr-ic1')};});
  ok('4 I14 ticking a record as reviewed takes its mark away, and the note counts the rest',b.tagged===6&&!b.iepTag&&/names 6 records/.test(b.hint),b);
  const saved=await rr.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const rr2=await open(file('RR-1_'));
  const c=await rr2.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'RR-1.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,800));return {tagged:[...document.querySelectorAll('#srcTbl .rr-ic1')].map(e=>e.closest('tr').querySelector('input[type=checkbox]').name),iep:document.querySelector('[name="src.iep.r"]').checked};},saved);
  ok('5 I14 the marks are saved with the file and open again',c.tagged.length===6&&c.iep&&!c.tagged.includes('src.iep.r'),c);
  const d=await rr2.evaluate(recs=>{const r=window.__nbhFactsIn({consent:{src:'IC-1',records:recs+', medication list'}});return {r,h:document.querySelector('[name="src.ic1"]').value};},recs);
  ok('6 I14 a second pass does not mark again or add',!/the records Form IC-1/.test(d.r.note)&&!/meds/.test(d.h),d);
  /* ---- the restraint history from CR-1 ---- */
  const rr3=await open(file('RR-1_'));
  const hist=k=>rr3.evaluate(()=>['c.restr','c.secl','c.period','c.last','c.crisis'].map(k=>document.querySelector('[name="'+k+'"]').value));
  const last=iso(day(-12));
  const e=await rr3.evaluate(([last,from,to,pd])=>{const r=window.__nbhFactsIn({crisis:{src:'CR-1',beh:'Hitting',restraints:{semester:2,last},seclusions:1,sem:{from,to},planDate:pd,revLast:'',revNext:''},
    data:{incidentList:[{id:'i1',date:'2026-09-02',hold:'restraint'}]}});return r;},[last,'2026-08-10','2026-12-18',mdy(day(-40))]);
  const e1=await hist();
  ok('7 I14 from Form CR-1: the semester\'s restraint and seclusion counts, its period, the most recent, and a plan dated this year is current',
    e1.join('|')==='2|1|This semester, 8/10/2026 to 12/18/2026 (Form CR-1)|'+last+'|Yes, current'&&/the restraint log \(Form CR-1\)/.test(e.note)&&/the crisis plan \(Form CR-1\)/.test(e.note),{e1,note:e.note});
  const e2=await rr3.evaluate(()=>{const r=window.__nbhFactsIn({crisis:{src:'CR-1',restraints:{semester:5,last:'2026-10-01'},planDate:'1/1/2020'}});return r.filled;});
  ok('8 I14 a second pass changes nothing',e2===0&&(await hist()).join('|')===e1.join('|'),{e2,h:await hist()});
  const rr4=await open(file('RR-1_'));
  const g=await rr4.evaluate(()=>{window.__nbhFactsIn({data:{incidentList:[{id:'a',date:'2026-09-02',hold:'restraint'},{id:'b',date:'2026-09-20',hold:''},{id:'c',date:'2026-10-06',hold:'restraint'},{id:'d',date:'2026-08-25',hold:''}]}});
    return ['c.restr','c.secl','c.period','c.last','c.crisis'].map(k=>document.querySelector('[name="'+k+'"]').value);});
  ok('9 I14 with no CR-1 count, from Form DD-1\'s incident record: its restraints, the period it covers and the most recent; no seclusion entered as none',g.join('|')==='2||8/25/2026 to 10/6/2026 (Form DD-1’s incident record)|2026-10-06|',g);
  const rr5=await open(file('RR-1_'));
  const t=await rr5.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('c.restr','4');s('c.crisis','No');
    window.__nbhFactsIn({crisis:{src:'CR-1',restraints:{semester:2,last:'2026-10-01'},planDate:'10/1/2026'}});return ['c.restr','c.period','c.last','c.crisis'].map(k=>document.querySelector('[name="'+k+'"]').value);});
  ok('10 I14 a count typed on RR-1 keeps the history as typed, and a typed crisis-plan answer is kept',t.join('|')==='4|||No',t);
  const st=await rr5.evaluate(([a,b,c])=>{const e=document.querySelector('[name="c.crisis"]'),one=x=>{e.value='';window.__nbhFactsIn({crisis:Object.assign({src:'CR-1'},x)});return e.value;};
    return [one({planDate:a}),one({planDate:b}),one({planDate:b,revLast:a}),one({planDate:a,revNext:c}),one({beh:'Hitting'})];},[mdy(day(-100)),mdy(day(-400)),mdy(day(-3))]);
  ok('11 I14 the crisis plan is current when dated or reviewed within the year and its next review is not past; otherwise outdated; undated, left for the BCBA',
    st.join('|')==='Yes, current|Yes, outdated|Yes, current|Yes, outdated|',st);
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
