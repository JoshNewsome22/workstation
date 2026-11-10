/* v25.72 (privacy) three smaller paths found by the forms-layer audit, each on a form opened on its own. Simulated people only.
   A  Autosave's label. After Clear all the next safety copy was still labelled with the student the form held before
      (Form IN-1): a copy named for "Mateo Rivera" held only the next student's note, and stayed listed under his name.
      Now the copy made after Clear all carries the name the form has then (none, until one is typed).
   B  Form TB-1's Save to my bank kept a definition as typed. My bank is offered for every student on this device, so a
      definition that names the student on the form reached every later student's Form TB-1. Now the form reads what it would
      keep for the student's name (each word of three letters or more, as a whole word) and ID, says which word and in
      which part, and asks. Cancel keeps nothing; "Save it as it is" keeps it (the BCBA's choice); a definition that names
      no one, and the simulated student, save as before with no question.
   D  The staff directory's offer ("... is not in your staff directory. Save to directory"). A parent in a row with an email
      address was offered when the role box was still empty (the name and the address typed first), and when the role was
      a word the family list did not have (Caregiver, Abuela). Now nothing is offered while the row's role box is empty, the
      offer is made when a staff role is typed, and the family list has those words. A staff member is offered as before.
   usage: WS_URL=http://127.0.0.1:8172 node qa/v2572-forms-privacy-test.js [A B D] */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const A={client:'Mateo Rivera',sid:'4471823'},B={client:'SIMULATED – Sample Student'};
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/];const marks=t=>A_MARKS.filter(re=>re.test(String(t||''))).map(String);
const errs=[];let br;
async function page(tag){const c=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',acceptDownloads:true});await c.addInitScript(()=>{window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));return {c,p};}
async function open(p,id){await p.goto(L.formUrl(FILE[id]),{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000});await sleep(900);}
/* the form's own question box: its words, and a button of it pressed by its words */
const asked=p=>p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return d&&d.open?d.textContent.replace(/\s+/g,' ').trim():'';});
const press=(p,re)=>p.evaluate(src=>{const d=document.getElementById('nbhUiDlg');if(!d||!d.open)return false;const b=[...d.querySelectorAll('button')].find(x=>new RegExp(src).test(x.textContent.trim()));if(!b)return false;b.click();return true;},re.source);

/* ---------------- A: Autosave's label after Clear all ---------------- */
async function scenA(){console.log('\n== A: the safety copy made after Clear all is not labelled with the last student (Form IN-1 on its own) ==');const {c,p}=await page('A');
  await open(p,'IN-1');
  const copies=()=>p.evaluate(async()=>(await window.nbhCopies.list()).map(r=>({key:r.key.replace(/^f-[a-z0-9]+/,'f'),student:r.student||'',text:JSON.stringify(r.forms)})));
  await p.locator('[data-m="client"]').first().fill(A.client);await p.locator('textarea:visible').first().fill('First student: interview note (simulated)');await sleep(3000);
  let l=await copies();
  ok('A: a safety copy of the first student’s work is kept under his name (the test’s own footing)',l.some(r=>marks(r.student).length&&marks(r.text).length),l.map(r=>r.student));
  await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('clearBtn').click();});await sleep(700);await press(p,/^Clear all$/);await sleep(1800);
  ok('A: Clear all emptied the form (the test’s own footing)',(await p.locator('[data-m="client"]').first().inputValue())==='');
  await p.locator('textarea:visible').first().fill('Next student, no name typed yet: interview note NEXT77 (simulated)');await sleep(3200);
  l=await copies();const next=l.filter(r=>/NEXT77/.test(r.text));
  ok('A: the work typed after Clear all is in a safety copy (the test’s own footing)',next.length>0,l.map(r=>r.key));
  ok('A: that copy is not labelled with the last student',next.every(r=>!marks(r.student).length),next.map(r=>({key:r.key,student:r.student})));
  await p.locator('[data-m="client"]').first().fill(B.client);await sleep(3200);
  l=await copies();const bad=l.filter(r=>/NEXT77/.test(r.text)&&marks(r.student).length);
  ok('A: no copy that holds the next student’s work is listed under the first student once the next is named',!bad.length,bad.map(r=>({key:r.key,student:r.student})));
  ok('A: the first student’s own copy is still his',l.some(r=>marks(r.student).length&&marks(r.text).length&&!/NEXT77/.test(r.text)));
  await c.close();}

/* ---------------- B: Form TB-1's Save to my bank ---------------- */
const bankList=p=>p.evaluate(()=>new Promise(res=>{const out=[];try{const s=localStorage.getItem('nbh.tb1.bank.v1');if(s)JSON.parse(s).forEach(e=>out.push(e));}catch(e){}
  const r=indexedDB.open('nbh-tb1-bank');r.onerror=()=>res(out);r.onsuccess=()=>{const db=r.result;try{const names=Array.from(db.objectStoreNames);if(!names.length)return res(out);
    const g=db.transaction(names[0],'readonly').objectStore(names[0]).getAll();g.onsuccess=()=>res(out.concat(g.result));g.onerror=()=>res(out);}catch(e){res(out);}};}));
const put=(p,name,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');const set=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;
  set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
/* the card's own "Save this definition to my bank" (in the card's shadow root), then the dialog's Save to my bank */
async function bankSave(p){const pressed=await p.evaluate(()=>{const deep=(root,sel)=>{for(const e of root.querySelectorAll('*')){if(e.shadowRoot){const h=e.shadowRoot.querySelector(sel)||deep(e.shadowRoot,sel);if(h)return h;}}return null;};
    const b=deep(document.querySelector('#tgtWrap')||document,'button.bank');if(!b)return false;b.click();return true;});await sleep(500);
  const open=await p.evaluate(()=>{const h=document.getElementById('tb1BankHost'),d=h&&h.shadowRoot&&h.shadowRoot.querySelector('dialog');if(!d||!d.open)return false;d.querySelector('.bksave').click();return true;});await sleep(900);
  return pressed&&open;}
const bankDlgOpen=p=>p.evaluate(()=>{const h=document.getElementById('tb1BankHost'),d=h&&h.shadowRoot&&h.shadowRoot.querySelector('dialog');return !!(d&&d.open);});
async function scenB(){console.log('\n== B: Form TB-1 asks before my bank keeps a definition that names the student ==');const {c,p}=await page('B');
  await open(p,'TB-1');
  await put(p,'m.client',A.client);await put(p,'m.sid',A.sid);
  await put(p,'tgt[0].lab','Leaving the seat');
  await put(p,'tgt[0].def','Mateo leaves his seat without permission during independent work (simulated).');
  await put(p,'tgt[0].excl','Not counted when student 4471823 is sent to the office by staff (simulated).');await sleep(400);
  ok('B: the card’s button and the dialog’s Save are pressed (the test’s own footing)',await bankSave(p));
  let q=await asked(p);
  ok('B: the form asks before it keeps a definition that names the student',/student/i.test(q)&&q.length>0,q);
  ok('B: the question says which word and in which part (the name in the definition, the ID in the exclusions)',/“Mateo” in the definition/.test(q)&&/“4471823” in the exclusions/.test(q),q);
  ok('B: nothing is kept while the question is open',!(await bankList(p)).length,(await bankList(p)).length);
  await press(p,/^Cancel$/);await sleep(700);
  ok('B: Cancel keeps nothing',!(await bankList(p)).length,(await bankList(p)).map(e=>e.lab));
  ok('B: Cancel leaves the bank’s dialog open, to change the entry or close it',await bankDlgOpen(p));
  /* the next student's form finds nothing of the first */
  await open(p,'TB-1');await put(p,'m.client',B.client);await sleep(600);
  ok('B: my bank, as the next student’s Form TB-1 finds it, holds nothing of the first student',!marks(JSON.stringify(await bankList(p))).length,marks(JSON.stringify(await bankList(p))));
  /* a definition that names no one saves as before, with no question; so does the simulated student's */
  await put(p,'tgt[0].lab','Leaving the seat');await put(p,'tgt[0].def','The student leaves the seat without permission during independent work (simulated).');await sleep(400);
  await bankSave(p);q=await asked(p);
  ok('B: a definition that names no one is saved with no question (the form holds the simulated student)',!q&&(await bankList(p)).length===1,{q,n:(await bankList(p)).length});
  /* the BCBA's own choice: Save it as it is */
  await open(p,'TB-1');await put(p,'m.client',A.client);
  await put(p,'tgt[0].lab','Calling out');await put(p,'tgt[0].def','Rivera calls out an answer without raising a hand (simulated).');await sleep(400);
  await bankSave(p);q=await asked(p);
  ok('B: a family name in the definition is found too',/“Rivera” in the definition/.test(q),q);
  await press(p,/^Save it as it is$/);await sleep(1200);
  const l=await bankList(p);
  ok('B: Save it as it is keeps the entry, as the person chose',l.length===2&&l.some(e=>e.lab==='Calling out'),l.map(e=>e.lab));
  /* a word inside another word is not the name ("Mat" in "material") */
  await open(p,'TB-1');await put(p,'m.client','Mat Lo');await put(p,'tgt[0].lab','Throwing material');await put(p,'tgt[0].def','The student throws work material more than one foot (simulated).');await sleep(400);
  await bankSave(p);q=await asked(p);
  ok('B: a name is matched as a whole word only, and a two-letter name word is not looked for',!q,q);
  await c.close();}

/* ---------------- D: the staff directory's offer ---------------- */
async function scenD(){console.log('\n== D: the staff directory is not offered a family member (Form IA-1’s informants) ==');const {c,p}=await page('D');
  const offer=p=>p.evaluate(()=>[...document.querySelectorAll('.nbh-toast')].filter(t=>/not in your staff directory/.test(t.textContent)).map(t=>t.textContent.replace(/\s+/g,' ').trim().slice(0,110)));
  const people=p=>p.evaluate(()=>{try{return (JSON.parse(localStorage.getItem('nbh.people')||'{}').list||[]).map(x=>x.name);}catch(e){return ['?'];}});
  /* a row typed as a person would: each box filled, then left (the change the offer listens for) */
  async function row(order,v){await open(p,'IA-1');
    await p.evaluate(()=>{const e=document.querySelector('[name="inf[0].name"]');const s=e&&e.closest('section[class*="only-"]');const v=s&&(s.className.match(/only-([a-z0-9]+)/)||[])[1];
      const b=v&&document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();});await sleep(500);
    for(const k of order){const e=p.locator('[name="inf[0].'+k+'"]');await e.scrollIntoViewIfNeeded();await e.fill(v[k]);await e.press('Tab');await sleep(350);}
    await sleep(900);return offer(p);}
  let o=await row(['name','email'],{name:'Rosa Rivera (simulated)',email:'rosa.rivera@example.com'});
  ok('D: a row with a name and an address and no role yet is not offered',!o.length,o);
  await p.locator('[name="inf[0].role"]').fill('Parent');await p.locator('[name="inf[0].role"]').press('Tab');await sleep(1200);
  ok('D: and not when the role typed next is Parent',!(await offer(p)).length,await offer(p));
  o=await row(['role','name','email'],{role:'Caregiver',name:'Rosa Rivera (simulated)',email:'rosa.rivera@example.com'});
  ok('D: a Caregiver is not offered',!o.length,o);
  o=await row(['role','name','email'],{role:'Abuela',name:'Elena Rivera (simulated)',email:'elena.rivera@example.com'});
  ok('D: an Abuela is not offered',!o.length,o);
  o=await row(['role','name','email'],{role:'School counselor',name:'Dana Whitfield (simulated)',email:'dana.whitfield@example.com'});
  ok('D: a staff member is offered, as before',o.length===1&&/Dana Whitfield/.test(o[0]),o);
  o=await row(['name','email','role'],{role:'Classroom teacher',name:'Jordan Blake (simulated)',email:'jordan.blake@example.com'});
  ok('D: a staff member whose role is typed last is offered once the role is typed',o.length===1&&/Jordan Blake/.test(o[0]),o);
  await p.evaluate(()=>document.querySelector('.nbh-toast .pp-save').click());await sleep(900);
  const l=await people(p);
  ok('D: Save to directory keeps that staff member, and no family member is in the directory',l.length===1&&/Jordan Blake/.test(l[0]),l);
  await c.close();}

(async()=>{br=await L.chromium.launch();
  for(const [k,fn] of [['A',scenA],['B',scenB],['D',scenD]]){if(!want(k))continue;try{await fn();}catch(e){ok(k+': the scenario ran to its end',false,String(e&&e.message||e).slice(0,400));}}
  ok('no page error',!errs.length,errs.slice(0,4));
  await br.close();console.log('\n'+(n-fails)+' of '+n+' checks passed');process.exit(fails?1:0);})();
