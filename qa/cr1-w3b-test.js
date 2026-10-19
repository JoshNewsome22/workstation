/* Form CR-1, review Wave 3 part 2 (F338): one debriefing per restraint. Choosing another restraint keeps the debriefing on screen
   and opens that restraint's own; the others are listed and printed in full, follow their restraint's number when a row is deleted,
   mark the log's Debrief done, travel in the file, the BIP copy and the spreadsheet. Simulated data only.
   usage: node qa/cr1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('CR-1_'));
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1200);
  const look=()=>p.evaluate(()=>({row:S.meta.dbRow,ctx:document.querySelector('[data-m="dbContext"]').value,date:document.querySelector('[data-m="dbDate"]').value,
    act:S.act.filter(a=>a.c).map(a=>a.c),keys:Object.keys(S.debs||{}).sort(),list:(document.querySelector('#crDebOthers .cr-deb-list')||{}).textContent||'',
    deb:[...document.querySelectorAll('#logTbl select[data-f="deb"]')].map(e=>e.value+(e.disabled?'*':''))}));
  const choose=v=>p.evaluate(v=>{const s=document.querySelector('select[data-m="dbRow"]');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));},v);
  const a=await look();
  ok('1 F338 the example keeps a debriefing for restraint 2 on the sheet and one for restraint 3, listed with Open',a.row==='2'&&/^Student had been asked|./.test(a.ctx)&&JSON.stringify(a.keys)==='["3"]'
    &&/Debriefings of other restraints, kept with this record: Restraint 3 \(/.test(a.list),a);
  const ctx2=a.ctx;
  await choose('3');await sleep(300);const b=await look();
  ok('2 F338 choosing restraint 3 opens its own debriefing, and restraint 2\'s is kept',b.row==='3'&&/^A substitute teacher/.test(b.ctx)&&b.act.length===1&&/^Substitute folders/.test(b.act[0])
    &&JSON.stringify(b.keys)==='["2"]'&&/Restraint 2/.test(b.list),b);
  const back=await p.evaluate(()=>S.debs['2'].dbContext);
  ok('3 F338 restraint 2\'s debriefing is kept word for word',back===ctx2,{back,ctx2});
  await choose('');await sleep(300);const c=await look();
  ok('4 F338 choosing no restraint opens a blank debriefing; both are kept',c.row===''&&c.ctx===''&&c.act.length===0&&JSON.stringify(c.keys)==='["2","3"]',c);
  await p.evaluate(()=>{const e=document.querySelector('[data-m="dbContext"]');e.value='Typed before a restraint was chosen (simulated).';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await choose('1');await sleep(300);const d=await look();
  ok('5 F338 what was typed before a restraint was chosen goes with the first one chosen that has none',d.row==='1'&&d.ctx==='Typed before a restraint was chosen (simulated).'&&JSON.stringify(d.keys)==='["2","3"]',d);
  ok('6 F338 every restraint with a debriefing is debriefed on the log',JSON.stringify(d.deb)==='["Yes*","Yes*","Yes*"]',d.deb);
  /* paper: each kept debriefing in full */
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>({full:[...document.querySelectorAll('.cr-deb-full')].map(x=>getComputedStyle(x).display+'|'+x.querySelector('h3').textContent),list:getComputedStyle(document.querySelector('.cr-deb-list')).display}));
  await p.emulateMedia({media:'screen'});
  ok('7 F338 on paper the other debriefings print in full, under their restraints; the list does not',JSON.stringify(pr.full)==='["block|Post-Incident Debriefing: Restraint 2","block|Post-Incident Debriefing: Restraint 3"]'&&pr.list==='none',pr);
  const bt=await p.evaluate(()=>{document.getElementById('bipAll').checked=true;const t=bipText();document.getElementById('bipAll').checked=false;return t;});
  const cs=await p.evaluate(()=>crCsvRows().filter(r=>/^Debriefing \(restraint/.test(r[0])).map(r=>r[0]+'|'+r[1]));
  ok('8 F338 the BIP copy (with the debriefing) and the spreadsheet carry the other debriefings',/POST-INCIDENT DEBRIEFING: RESTRAINT 2/.test(bt)&&/POST-INCIDENT DEBRIEFING: RESTRAINT 3/.test(bt)&&cs.includes('Debriefing (restraint 3)|What was happening before it started'),{cs:cs.slice(0,6)});
  /* the file */
  const saved=await p.evaluate(()=>JSON.stringify({form:'CR-1',S}));
  await p.evaluate(()=>{S=blank();renderAll();});
  await p.setInputFiles('#fileIn',{name:'cr1.json',mimeType:'application/json',buffer:Buffer.from(saved)});await sleep(600);
  const f=await look();
  ok('9 F338 the debriefings travel with the file',f.row==='1'&&JSON.stringify(f.keys)==='["2","3"]'&&/^A substitute teacher/.test(await p.evaluate(()=>S.debs['3'].dbContext)),f);
  /* a row deleted: the kept debriefings follow their restraint's number */
  await p.evaluate(()=>document.querySelector('button.rowDel[data-rdel="log"][data-i="0"]').click());await sleep(500);
  const g=await look();
  ok('10 F338 deleting restraint 1 renumbers the kept debriefings; the deleted one\'s stays on the sheet with no restraint chosen',
    g.row===''&&g.ctx==='Typed before a restraint was chosen (simulated).'&&JSON.stringify(g.keys)==='["1","2"]'&&/^A substitute teacher/.test(await p.evaluate(()=>S.debs['2'].dbContext)),g);
  /* one with no restraint chosen is opened from the list */
  await choose('2');await sleep(300);const h=await look();
  await p.evaluate(()=>{const b=document.querySelector('#crDebOthers button[data-debopen^="u"]');if(b)b.click();});await sleep(300);const i=await look();
  ok('11 F338 a debriefing with no restraint chosen is kept and opens from the list',h.row==='2'&&h.keys.includes('u1')&&i.row===''&&i.ctx==='Typed before a restraint was chosen (simulated).'&&i.keys.includes('2'),{h,i});
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
