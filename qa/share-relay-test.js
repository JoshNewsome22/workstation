/* v23.52 a case shared for editing, as a file passed back and forth. Two browsers stand for two people's devices (the
   BCBA's and a colleague's; nothing is shared between them but the files). The BCBA shares CR-1 and IC-1 with a colleague;
   the colleague opens the file (first time: it opens as a case of theirs), works, and sends it back; meanwhile the BCBA
   works too, one field on both sides. The file that comes back is put together with the BCBA's case: each side's changes
   kept, the colleague's new log entry kept, one question for the field both changed (theirs chosen), a summary. Round 2:
   the BCBA's next file starts from the colleague's, and the colleague's own work since is kept at their end, nothing asked,
   no entry twice. Help, the More menu, the data-where row and Remove all. Simulated people only.
   usage: node qa/share-relay-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const dev=async who=>{const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
    page.on('pageerror',e=>errs.push(who+': '+e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
    await page.evaluate(()=>{window.__asked=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.alert=async t=>{window.__asked.push(String(t));};window.alert=t=>{window.__asked.push(String(t));};});
    return page;};
  const A=await dev('BCBA'),B=await dev('colleague');
  const frame=(pg,id)=>pg.frames().find(f=>new RegExp('/'+id.replace('-','\\-')+'_').test(f.url()));
  const open=async(pg,id)=>{await pg.evaluate(id=>openForm(id),id);await pg.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(900);};
  const setBar=pg=>pg.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pBcba','Jordan Ellis (simulated)');});
  const cr=(pg,f)=>frame(pg,'CR-1').evaluate(f);
  const icSet=(pg,name,v)=>frame(pg,'IC-1').evaluate(([name,v])=>{const e=document.querySelector('[name="'+name+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[name,v]);
  const own=(pg,id)=>pg.evaluate(async id=>{const r=await grab(id,'snapshot',null,15000);return r&&r.snap?JSON.parse(r.snap.own):null;},id);
  const sendFile=async(pg,peer,me)=>{await pg.evaluate(()=>shOpen());await pg.waitForSelector('#shGoOut',{timeout:10000});
    const lead=await pg.evaluate(()=>({title:document.getElementById('dlgTitle').textContent,peer:document.getElementById('shPeer').value,me:document.getElementById('shMe').value,body:document.getElementById('dlgBody').textContent}));
    if(peer!==null)await pg.fill('#shPeer',peer);if(me)await pg.fill('#shMe',me);
    const [d]=await Promise.all([pg.waitForEvent('download',{timeout:20000}),pg.click('#shGoOut')]);
    const text=fs.readFileSync(await d.path(),'utf8');await sleep(500);return {lead,name:d.suggestedFilename(),text,c:JSON.parse(text)};};
  const take=async(pg,text)=>{await pg.evaluate(t=>{window.__took=openCaseText(t,null);},text);await sleep(1500);};
  const review=pg=>pg.evaluate(()=>({open:document.getElementById('dlg').open,title:document.getElementById('dlgTitle').textContent,body:document.getElementById('dlgBody').textContent,
    n:document.querySelectorAll('#dlgBody .sh-c').length,heads:[...document.querySelectorAll('#dlgBody .sh-c-h')].map(x=>x.textContent)}));

  /* ---- the BCBA's case: CR-1 and IC-1 from their simulations */
  await open(A,'CR-1');await L.loadSim(frame(A,'CR-1'));await sleep(1200);await open(A,'IC-1');await L.loadSim(frame(A,'IC-1'));await sleep(1200);await setBar(A);await sleep(600);
  const s1=await sendFile(A,'Dana Whitfield (simulated)','Jordan Ellis (simulated)');
  ok('1 Share for editing writes one file named for the student and the colleague, with the forms, the student\'s details and the starting point',
    /^CASE_Mateo_Rivera_for-Dana-Whitfield-simulated_\d{4}-\d\d-\d\d\.json$/.test(s1.name)&&s1.c.share&&s1.c.share.from==='Jordan Ellis (simulated)'&&s1.c.share.to==='Dana Whitfield (simulated)'&&s1.c.share.round===1&&
    Object.keys(s1.c.forms).sort().join()==='CR-1,IC-1'&&s1.c.share.base&&Object.keys(s1.c.share.base.forms).sort().join()==='CR-1,IC-1'&&s1.c.packet.client==='Mateo Rivera'&&/Share for editing/.test(s1.lead.title),{name:s1.name,share:s1.c.share&&Object.assign({},s1.c.share,{base:!!s1.c.share.base}),lead:s1.lead.title});
  const a1=await A.evaluate(async()=>{const r=await shAll();return r.map(x=>({role:x.role,peer:x.peer,round:x.round,base:!!x.base}));});
  ok('2 this device keeps the share and its starting point',a1.length===1&&a1[0].role==='owner'&&a1[0].peer==='Dana Whitfield (simulated)'&&a1[0].base,a1);

  /* ---- the colleague opens it: a case of theirs */
  await take(B,s1.text);await B.waitForFunction(()=>!!state.status['CR-1']||!!state.pending['CR-1'],null,{timeout:30000});await sleep(1500);
  const b1=await B.evaluate(async()=>({asked:window.__asked.slice(),ids:caseIds().sort(),client:packet().client,sh:(await shAll()).map(x=>({role:x.role,peer:x.peer}))}));
  ok('3 the colleague: asked once, the case opens with its two forms, kept as a share from the BCBA',b1.asked.some(t=>/^Jordan Ellis \(simulated\) shared Mateo Rivera’s case with you for editing\./.test(t))&&b1.ids.join()==='CR-1,IC-1'&&b1.client==='Mateo Rivera'&&b1.sh.length===1&&b1.sh[0].role==='helper'&&b1.sh[0].peer==='Jordan Ellis (simulated)',b1);

  /* ---- both work on it; one field on both sides */
  await open(B,'CR-1');await open(B,'IC-1');
  await cr(B,()=>{S.meta.hAvoid='No holds from behind (colleague)';S.meta.rWatch='Paula Brennan (colleague)';S.log.push({d:'10/14/26',dur:'15 s',set:'Room 12',staff:'Dana Whitfield (simulated)',rep:'Yes',deb:'No',pre:'Demand (simulated)'});renderAll();});
  await icSet(B,'c.where','Room 12 (colleague)');
  await cr(A,()=>{S.meta.rStaff='Aide A, trained 8/1/26 (BCBA)';S.meta.rWatch='Iris Calloway (BCBA)';renderAll();});
  await icSet(A,'c.who','The BCBA and the teacher (BCBA)');await sleep(800);
  const s2=await sendFile(B,null,null);
  ok('4 the colleague sends it back: the dialog is Send back to the BCBA, their name filled in, and the file starts from what the BCBA sent',
    /^Send back to Jordan Ellis \(simulated\)$/.test(s2.lead.title)&&s2.lead.peer==='Jordan Ellis (simulated)'&&s2.lead.me==='Dana Whitfield (simulated)'&&s2.c.share.from==='Dana Whitfield (simulated)'&&s2.c.share.round===2&&
    JSON.parse(s2.c.share.base.forms['CR-1'].snap.own).S.meta.hAvoid===JSON.parse(s1.c.forms['CR-1'].snap.own).S.meta.hAvoid,{lead:s2.lead.title,peer:s2.lead.peer,me:s2.lead.me,share:Object.assign({},s2.c.share,{base:!!s2.c.share.base})});

  /* ---- the file back at the BCBA's: put together */
  await take(A,s2.text);await A.waitForSelector('#shGo',{timeout:20000});
  const r1=await review(A);
  ok('5 the BCBA: the changes, with a summary by form and one question (the field both changed), mine until chosen',r1.open&&/^Changes from Dana Whitfield \(simulated\)$/.test(r1.title)&&/CR-1 Crisis Plan and Debriefing: 1 added, \d+ changed/.test(r1.body)&&/IC-1 Informed Consent: 1 changed/.test(r1.body)&&r1.n===1&&/CR-1/.test(r1.heads[0])&&
    /Yours: Iris Calloway \(BCBA\)/.test(r1.body)&&/Dana Whitfield \(simulated\)’s: Paula Brennan \(colleague\)/.test(r1.body),r1);
  await A.evaluate(()=>{document.querySelector('.sh-c input[value="theirs"]').checked=true;document.getElementById('shGo').click();});
  await A.waitForFunction(()=>!!state.pending['CR-1']||!!state.status['CR-1'],null,{timeout:30000});await sleep(2500);await open(A,'CR-1');await open(A,'IC-1');
  const ac=await own(A,'CR-1'),ai=await own(A,'IC-1');
  ok('6 the case holds both people\'s work: theirs, mine, their new log entry, and the field both changed as chosen (theirs)',ac&&ac.S.meta.hAvoid==='No holds from behind (colleague)'&&ac.S.meta.rStaff==='Aide A, trained 8/1/26 (BCBA)'&&ac.S.meta.rWatch==='Paula Brennan (colleague)'&&
    ac.S.log.length===JSON.parse(s1.c.forms['CR-1'].snap.own).S.log.length+1&&ac.S.log.some(x=>x.staff==='Dana Whitfield (simulated)')&&ai.fields['c.where']==='Room 12 (colleague)'&&ai.fields['c.who']==='The BCBA and the teacher (BCBA)',
    ac&&{meta:{hAvoid:ac.S.meta.hAvoid,rStaff:ac.S.meta.rStaff,rWatch:ac.S.meta.rWatch},log:ac.S.log.length,where:ai&&ai.fields['c.where'],who:ai&&ai.fields['c.who']});
  const dirty=await A.evaluate(()=>({sig:state.lastSig,dirty:caseDirty()}));
  ok('7 put together, the case waits for Save case',dirty.sig===''&&dirty.dirty===true,dirty);

  /* ---- round 2: the BCBA's next file; the colleague has kept working */
  await cr(B,()=>{S.meta.hBeh='Anxious before tests (colleague, later)';renderAll();});await sleep(500);
  await cr(A,()=>{S.meta.revSched='Every 4 weeks (BCBA)';renderAll();});await sleep(500);
  const s3=await sendFile(A,'Dana Whitfield (simulated)',null);
  ok('8 the BCBA\'s next file to the same colleague: round 3, starting from the colleague\'s last file',/Shared before with/.test(s3.lead.body)&&s3.c.share.round===3&&s3.c.share.id===s1.c.share.id&&
    JSON.parse(s3.c.share.base.forms['CR-1'].snap.own).S.meta.hAvoid==='No holds from behind (colleague)',{body:s3.lead.body.slice(0,300),round:s3.c.share.round});
  await take(B,s3.text);await B.waitForSelector('#shGo',{timeout:20000});
  const r2=await review(B);
  ok('9 at the colleague\'s: nothing asked (their own work since is theirs alone)',r2.open&&r2.n===0&&/Changes from Jordan Ellis \(simulated\)/.test(r2.title),r2);
  await B.evaluate(()=>document.getElementById('shGo').click());await sleep(3000);await open(B,'CR-1');
  const bc=await own(B,'CR-1');
  ok('10 the colleague\'s case: the BCBA\'s work, their own since, and their log entry once',bc&&bc.S.meta.rStaff==='Aide A, trained 8/1/26 (BCBA)'&&bc.S.meta.revSched==='Every 4 weeks (BCBA)'&&bc.S.meta.hBeh==='Anxious before tests (colleague, later)'&&bc.S.meta.rWatch==='Paula Brennan (colleague)'&&
    bc.S.log.filter(x=>x.staff==='Dana Whitfield (simulated)').length===1,bc&&{meta:{rStaff:bc.S.meta.rStaff,revSched:bc.S.meta.revSched,hBeh:bc.S.meta.hBeh,rWatch:bc.S.meta.rWatch},log:bc.S.log.length});

  /* ---- where it is said, and what Remove all clears */
  const h=await A.evaluate(()=>({more:(()=>{document.getElementById('moreBtn').click();const t=document.getElementById('moreMenu').textContent;document.getElementById('moreBtn').click();return t;})(),
    where:dataWhere(),cmd:CMDS.some(c=>/^Share for editing/.test(c.n))}));
  ok('11 More lists Share for editing; the command; the data-where row',/Share for editing/.test(h.more)&&h.cmd&&/Share for editing/.test(h.where)&&/what you and the colleague last had in common/.test(h.where),{more:h.more,cmd:h.cmd});
  const w=await A.evaluate(async()=>{const n0=(await shAll()).length;await clRemoveAll();return [n0,(await shAll()).length];});
  ok('12 Remove all student data clears the shares\' starting points too',w[0]>0&&w[1]===0,w);
  ok('13 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
