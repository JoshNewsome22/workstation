/* v22.11 the documentation (review F512-F516, F508). DM-1's Packet Contents lists every form a student's file can hold
   (SI-1's assent and IM-1's injury monitoring among them), in the workstation's order, and a file saved before keeps its
   ticks. Help covers Caseload, Today, History, Focus, Dictate, Read a document and what a shared iPad keeps; it and the
   Client ID prompts point to one Google sign-in checklist in HOSTING.md. README and Help no longer say a form works
   "exactly as" anywhere on its own. SETUP.md opens with a current Start here. Both editions. Simulated data only.
   usage: node qa/v2211-docs-test.js */
const fs=require('fs'),path=require('path');
const L=require(__dirname+'/lib.js');const {chromium,BASE,ROOT,sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const root=ROOT||path.join(__dirname,'..');const rd=(ed,f)=>fs.readFileSync(path.join(root,ed,f),'utf8');
(async()=>{const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const errs=[];
  /* 1-2 DM-1's Packet Contents */
  const dm=L.forms().find(f=>f.id==='DM-1');const p=await ctx.newPage();p.on('pageerror',e=>errs.push('DM-1: '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(BASE+'/NBH-Workstation/'+encodeURI(dm.file));await sleep(1500);
  const shell=L.forms().map(f=>f.id);
  const pk=await p.evaluate(()=>[...document.querySelectorAll('#pkTbl tbody tr')].map(r=>({id:r.cells[1].textContent.trim(),key:(r.querySelector('input[type=checkbox]')||{}).name})));
  const ids=pk.map(r=>r.id),want=shell.filter(id=>id!=='GC-1'&&id!=='RS-1');   /* v22.28 RS-1 is a staff member's supervision record, not the student's */
  ok('1 DM-1\'s Packet Contents lists every form a student\'s file can hold ('+want.length+', GC-1\'s class-wide system and RS-1\'s staff supervision log kept out), SI-1 and IM-1 among them, in the workstation\'s order',
    JSON.stringify(ids)===JSON.stringify(want),{n:ids.length,missing:want.filter(x=>!ids.includes(x)),extra:ids.filter(x=>!want.includes(x))});
  const keys=Object.fromEntries(pk.map(r=>[r.id,r.key]));
  ok('2 a file saved before keeps its ticks: the first 31 forms keep their saved keys (DM-1 pk[0], OB-1 pk[27], AD-1 pk[30]) and the new ones follow',
    keys['DM-1']==='pk[0].in'&&keys['OB-1']==='pk[27].in'&&keys['AD-1']==='pk[30].in'&&keys['SI-1']==='pk[31].in'&&keys['IM-1']==='pk[44].in',keys);
  await p.close();
  for(const ed of ['NBH-Workstation','RPS-Workstation']){
    const tag=ed==='NBH-Workstation'?'practice':'school';
    const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(ed+': '+e.message));
    await pg.goto(BASE+'/'+ed+'/index.html');await sleep(1400);
    await pg.evaluate(()=>document.getElementById('help').click());await sleep(500);
    const h=await pg.evaluate(()=>({sum:[...document.querySelectorAll('#dlgBody summary')].map(s=>s.textContent),text:document.getElementById('dlgBody').textContent}));
    await pg.evaluate(()=>document.getElementById('dlg').close());
    const need=['Your caseload and Today','Going back to an earlier save (History)','Working faster','On a shared computer'];   /* "iPad" on an iPad */
    const words=['Caseload','Search the caseload','Monthly summary','Today','Log it now','Home note','hand-over check','History','Restore','Focus','Dictate','Read a document','photo','Forget a student not saved for','Remove all student data from this'];
    ok('3 '+tag+': Help has the four new sections and names the buttons since v21.75 and the shared-iPad controls',need.every(n=>h.sum.includes(n))&&words.every(w=>h.text.includes(w)),{sections:need.filter(n=>!h.sum.includes(n)),words:words.filter(w=>!h.text.includes(w))});
    ok('4 '+tag+': Help points to HOSTING.md\'s Google sign-in, not to an old release note, and no longer says a form works "exactly as" here wherever it is',
      /HOSTING\.md, Google sign-in/.test(h.text)&&!/SETUP\.md, v21\.76/.test(h.text)&&!/exactly as it does here/.test(h.text)&&/away from those files/.test(h.text),{h:h.text.slice(-500)});
    const src=rd(ed,'index.html');
    ok('5 '+tag+': the Client ID prompt says where to make one',/Paste the Client ID from Google Cloud[^']*HOSTING\.md, Google sign-in/.test(src));
    const dd=rd(ed,'Daily_Behavior_Data_and_Visual_Analysis.html');
    ok('6 '+tag+': DD-1\'s Google key box says where to make one',/how to make one: HOSTING\.md, Google sign-in/.test(dd)&&!/Setup: the Google Sheets link/.test(dd));
    const ho=rd(ed,'HOSTING.md');const sec=(ho.split('## Google sign-in (once, for Sheets, Gmail and Drive)')[1]||'').split('\n## ')[0];
    const must=['Google Sheets API','Gmail API','Google Drive API','spreadsheets.readonly','gmail.send','userinfo.email','drive.file','Authorized JavaScript origins','https://newsomebh.com','Test users','Manage third-party app access'];
    ok('7 '+tag+': HOSTING.md has one Google sign-in checklist: the three APIs, the four scopes, the origin, test users and the IT step',!!sec&&must.every(m=>sec.includes(m)),{missing:must.filter(m=>!sec.includes(m))});
    const se=rd(ed,'SETUP.md');
    ok('8 '+tag+': SETUP.md opens with a current Start here (47 forms, the shared files, where to find the version and HOSTING.md), the old set-up marked as history',
      se.startsWith('# Start here\n')&&/47 forms/.test(se.slice(0,1500))&&/nbh-\*\.js/.test(se.slice(0,1500))&&/kept as it was/.test(se.slice(0,2500)),se.slice(0,200));
    const rm=rd(ed,'README.txt');
    ok('9 '+tag+': README.txt says 47 forms, and that a form away from the shared files loses its letterhead and Autosave',!/\b4[456] forms/.test(rm)&&/47 forms/.test(rm)&&!/exactly as it does inside/.test(rm)&&/without its letterhead/.test(rm));
    if(ed==='RPS-Workstation')ok('10 school: README.txt says nothing of Rewrite with Claude (off in this edition)',!/Rewrite with Claude|nbh-relay-upload/.test(rm),rm.match(/.{0,80}Rewrite with Claude.{0,40}/));
    await pg.close();}
  ok('11 no page errors',!errs.length,errs);
  }catch(e){console.log('FAIL crashed: '+e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
