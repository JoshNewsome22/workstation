/* v21.33: Copy for the BIP on FS-1, TD-1, GB-1, CR-1; per-row deletion on FS-1 and CR-1; a save without console errors */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS={
  'FS-1':{file:'FS-1_FBA-Summary-Report_v2026-09.html',heads:['FORM FS-1','TARGET BEHAVIOR 1: Aggression toward staff','LEVEL OF EVIDENCE','SOURCES OF EVIDENCE','HYPOTHESES CONSIDERED','LIMITATIONS','WHAT WOULD CHANGE THIS CONCLUSION'],first:'Definition: Forceful contact'},
  'TD-1':{file:'TD-1_Function-Based-Treatment-Developer_v2026-09.html',heads:['FORM TD-1','TARGET BEHAVIOR AND FUNCTION','BASELINE AND CRITERIA','TEACHING THE REPLACEMENT AND SKILL TARGETS','RESPONDING TO THE PRECURSOR AND THE TARGET BEHAVIOR','DATA, INTEGRITY, AND DECISION RULES'],first:'Target behavior: '},
  'GB-1':{file:'GB-1_Goal-and-Objective-Builder_v2026-09.html',heads:['FORM GB-1','REDUCTION OBJECTIVES','ACQUISITION OBJECTIVES'],first:'R1. SIMULATED – Sample Student will decrease their rate per minute of Aggression toward staff (simulated) from 1.4 per minute to no more than 0.2 per minute in the self-contained ESE classroom'},
  'CR-1':{file:'CR-1_Crisis-Intervention-Plan_v2026-09.html',heads:['FORM CR-1','TEAM','POSITIVE BEHAVIOR INTERVENTIONS AND SUPPORTS','STAGE 1: PREVENTION (BEFORE ANY SIGN)','STAGE 5: RECOVERY','IF RESTRAINT NONETHELESS OCCURS','POST-INCIDENT DEBRIEFING','WHAT CHANGES AS A RESULT','PARENT NOTIFICATION AND REPORTING'],first:'Dangerous behavior this plan addresses: Aggression toward staff'}
};
const OUT=__dirname+'/out/b4/out';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(c,msg)=>{console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)fails++;};
async function saveNoErr(page,log){const n0=log.length;await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(400);const s=await page.evaluate(()=>window.__saved);
  check(s&&s.length>200,'save produced a file ('+(s?s.length:0)+' bytes)');check(log.length===n0,'no console errors during save');return s;}
async function openFile(page,text){await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(400);}
(async()=>{
  const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:1440,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const only=process.argv[2];
  for(const id of Object.keys(FORMS)){
    if(only&&only!==id)continue;
    const F=FORMS[id];console.log('\n=== '+id);const log=[];const page=await ctx.newPage();wire(page,log);
    await page.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(600);
    await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};});   /* v21.34: the forms ask through nbhUI.confirm, which honours a stubbed window.confirm; a long alert would open the styled notice, which stays open until closed */
    check(await page.$('#bipBtn')!==null,'bipBtn present in the toolbar');
    check(await page.evaluate(()=>!!document.querySelector('#bipBtn').closest('.tgroup')&&/Sheet actions/.test(document.querySelector('#bipBtn').closest('.tgroup').textContent)),'bipBtn sits in the Sheet actions group');
    /* empty form: the text has only the title line */
    const empty=await page.evaluate(()=>window.__bipText());check(empty.split('\n').filter(Boolean).length<=2,'empty form gives the title only ('+JSON.stringify(empty.slice(0,60))+')');
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);
    await page.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(500);
    const clip=await page.evaluate(()=>navigator.clipboard.readText());
    const status=await page.evaluate(()=>document.querySelector('#bipMsg').textContent);
    console.log('  status: '+status);
    check(/SIMULATED – Sample Student/.test(clip),'clipboard holds the student name');
    F.heads.forEach(h=>check(clip.includes(h),'heading present: '+h));
    check(clip.includes(F.first),'first target/objective present: '+F.first.slice(0,60));
    check(!/<[a-z]+[^>]*>|&[a-z]+;|&#\d+;/.test(clip),'no markup or entities in the text');
    check(!/\n{3,}/.test(clip)&&!/\n\n$/.test(clip),'single blank lines between sections');
    check(!/^[^\n]*:\s*$/m.test(clip),'no empty "Label:" line');
    fs.writeFileSync(OUT+'/'+id+'.txt',clip);
    console.log('  --- first 25 lines ---');console.log(clip.split('\n').slice(0,25).map(l=>'  | '+l).join('\n'));console.log('  --- ('+clip.split('\n').length+' lines in all)');
    /* fallback dialog when the clipboard is refused */
    await page.evaluate(()=>{window.__cw=navigator.clipboard.writeText;navigator.clipboard.writeText=()=>Promise.reject(new Error('refused'));});
    await page.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(400);
    check(await page.evaluate(()=>{const d=document.querySelector('#bipDlg');return !!d&&d.open&&d.querySelector('textarea').value.length>100&&d.querySelector('textarea').selectionEnd===d.querySelector('textarea').value.length;}),'refused clipboard: dialog open with the text selected');
    check(/refused/.test(await page.evaluate(()=>document.querySelector('#bipMsg').textContent)),'refused clipboard: status says so');
    await page.evaluate(()=>{document.querySelector('#bipClose').click();navigator.clipboard.writeText=window.__cw;});
    check(await page.evaluate(()=>!document.querySelector('#bipDlg').open),'dialog closes');
    /* printing: the new controls are hidden */
    await page.emulateMedia({media:'print'});
    check(await page.evaluate(()=>['#bipBtn','#bipMsg','#bipDlg'].every(s=>{const e=document.querySelector(s);return !e||e.getClientRects().length===0;})),'print: button, status and dialog hidden');
    if(id==='FS-1'||id==='CR-1')check(await page.evaluate(()=>[...document.querySelectorAll('.rowDel,td.nx,th.nx')].every(e=>e.getClientRects().length===0)),'print: delete controls hidden ('+await page.evaluate(()=>document.querySelectorAll('.rowDel').length)+' controls)');
    await page.emulateMedia({media:'screen'});
    /* ---------- Task R ---------- */
    if(id==='FS-1'){
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="ev"]').click());await sleep(100);
      const n0=await page.evaluate(()=>S.src.length);const m1=await page.evaluate(()=>S.src[1].method);
      await page.evaluate(()=>document.querySelector('#srcTbl .rowDel[data-del="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.src.length)===n0-1&&await page.evaluate(()=>S.src[0].method)===m1,'sources: row 1 deleted, row 2 moved up');
      check(await page.evaluate(()=>document.querySelectorAll('#srcTbl tbody tr').length)===n0-1,'sources: table re-rendered');
      const h1=await page.evaluate(()=>S.hyp[1].h);await page.evaluate(()=>document.querySelector('#hypTbl .rowDel[data-del="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.hyp[0].h)===h1,'hypotheses: row 1 deleted');
      /* delete every hypothesis: one blank row stays */
      /* v21.34: the delete handler awaits the styled question, so each click settles before the next */
      for(let k=0;k<20;k++){if(await page.evaluate(()=>S.hyp.length===1&&!S.hyp[0].h))break;await page.evaluate(()=>document.querySelector('#hypTbl .rowDel[data-del="0"]').click());await sleep(80);}await sleep(200);
      check(await page.evaluate(()=>S.hyp.length===1&&!S.hyp[0].h),'hypotheses: one blank row kept');
      /* targets: with target 2 open, delete target 1: the open target follows */
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="beh"]').click());await sleep(100);
      await page.evaluate(()=>{S.cur=1;renderAll();});
      check(await page.evaluate(()=>document.querySelectorAll('#behBar .rowDel').length)===2&&await page.evaluate(()=>document.querySelectorAll('#pathBar .rowDel').length)===0,'targets: a delete control per target on the Targets sheet only');
      await page.evaluate(()=>document.querySelector('#behBar .rowDel[data-delb="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.beh.length===1&&S.cur===0&&/head hitting/.test(S.beh[0].lab)&&/head hitting/i.test(document.querySelector('[data-b="lab"]').value)),'targets: target 1 deleted, target 2 is open and shown');
      await page.evaluate(()=>document.querySelector('#behBar .rowDel[data-delb="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.beh.length===1&&!S.beh[0].lab&&S.cur===0),'targets: last target deleted leaves one blank target');
      const saved=await saveNoErr(page,log);const before=await page.evaluate(()=>JSON.stringify(S));
      await page.evaluate(()=>{S=blank();renderAll();});await openFile(page,saved);
      check(await page.evaluate(()=>JSON.stringify(S))===before,'round trip after deletions identical');
    }
    if(id==='CR-1'){
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="log"]').click());await sleep(100);
      check(await page.evaluate(()=>S.meta.dbRow)==='2','debriefing names restraint 2');
      const d2=await page.evaluate(()=>S.log[1].d),d3=await page.evaluate(()=>S.log[2].d);await page.evaluate(([a,b])=>{window.__d2=a;window.__d3=b;},[d2,d3]);
      await page.evaluate(()=>document.querySelector('#logTbl .rowDel[data-rdel="log"][data-i="0"]').click());await sleep(300);
      check(await page.evaluate(()=>S.log.length===2&&S.log[0].d===window.__d2&&S.meta.dbRow==='1'&&document.querySelector('select[data-m="dbRow"]').value==='1'&&S.log[0].att.length===1),'log: restraint 1 deleted; the debriefing now names restraint 1 (was 2) and the attempts travelled with the row');
      check(await page.evaluate(()=>document.querySelectorAll('#crcRows .crc-r').length===2),'log: the clock redrew to two restraints');
      /* delete the restraint the debriefing names: the confirm text says so and the choice is cleared */
      let dlg='';page.once('dialog',d=>{dlg=d.message();});
      await page.evaluate(()=>document.querySelector('#logTbl .rowDel[data-rdel="log"][data-i="0"]').click());await sleep(300);
      dlg=dlg||await page.evaluate(()=>(window.__dlg||[]).slice(-1)[0]||'');
      check(/debriefing sheet names this restraint/.test(dlg),'log: confirm warns about the debriefing: '+dlg.slice(0,90));
      check(await page.evaluate(()=>S.meta.dbRow===''&&S.log.length===2&&S.log[0].d===window.__d3&&document.querySelector('select[data-m="dbRow"]').value===''),'log: the choice is cleared and the minimum of two rows is kept');
      /* attempts */
      const na=await page.evaluate(()=>S.log[0].att.length);
      await page.evaluate(()=>document.querySelector('[data-cadelx="0.0"]').click());await sleep(300);
      check(await page.evaluate(()=>S.log[0].att.length)===na-1&&await page.evaluate(()=>S.log[0].att[0].m)==='Telephone','attempts: attempt 1 deleted, attempt 2 moved up');
      await page.evaluate(()=>document.querySelector('[data-cadelx="0.0"]').click());await sleep(300);
      check(await page.evaluate(()=>S.log[0].att.length===1&&!S.log[0].att[0].d),'attempts: one blank attempt kept');
      /* no-school days */
      await page.evaluate(()=>document.querySelector('[data-czdelx="0"]').click());await sleep(300);
      check(await page.evaluate(()=>S.closed.length===1&&!S.closed[0].a&&document.querySelectorAll('#crcZRows .crc-zrow').length===1),'no-school days: row 1 deleted, one blank row kept');
      /* team, interventions, actions */
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="setup"]').click());await sleep(100);
      const t2=await page.evaluate(()=>S.team[1].n);await page.evaluate(()=>document.querySelector('#teamTbl .rowDel[data-i="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.team[0].n)===t2&&await page.evaluate(()=>S.team.length)===4,'team: row 1 deleted (minimum of four kept by a blank row)');
      check(/not represented|Parent or guardian/.test(await page.evaluate(()=>document.querySelector('#teamVerdict').textContent)),'team: the verdict now misses the parent');
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="plan"]').click());await sleep(100);
      const p2=await page.evaluate(()=>S.pbis[1].s);await page.evaluate(()=>document.querySelector('#pbisTbl .rowDel[data-i="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.pbis[0].s)===p2&&await page.evaluate(()=>document.querySelector('#pbisTbl tbody tr td').textContent)==='1','interventions: row 1 deleted, order renumbered');
      await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="deb"]').click());await sleep(100);
      const a2=await page.evaluate(()=>S.act[1].c);await page.evaluate(()=>document.querySelector('#actTbl .rowDel[data-i="0"]').click());await sleep(200);
      check(await page.evaluate(()=>S.act[0].c)===a2,'actions: row 1 deleted');
      const saved=await saveNoErr(page,log);const before=await page.evaluate(()=>JSON.stringify(S));
      await page.evaluate(()=>{S=blank();renderAll();});await openFile(page,saved);
      check(await page.evaluate(()=>JSON.stringify(S))===before,'round trip after deletions identical');
    }
    if(id==='TD-1'||id==='GB-1'){await saveNoErr(page,log);}
    const errs=log.filter(l=>l.type!=='warning');console.log('  console errors: '+errs.length+(errs.length?' '+JSON.stringify(errs.slice(0,3)):''));check(errs.length===0,'no console or page errors');
    await page.close();
  }
  await br.close();console.log('\nFAILURES: '+fails);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
