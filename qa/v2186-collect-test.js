/* v21.86 replies straight in, end to end: a student's Form DD-1 makes a staff phone link (the reply box run here with
   php -S, as qa/reply-box-test.js does); the case is kept on this iPad and closed; a phone sends the day's counts; the
   workstation's Collect replies (Caseload, and the morning refresh) opens that student's DD-1 unseen, places the entry, and
   writes the case back to the caseload with its facts: the count on its day, data.staff, nothing twice on a second run,
   no dialog. Simulated student only (Mateo Rivera, ID 4471823, Royal Palm School). Needs php on the PATH.
   usage: WS_URL=http://127.0.0.1:8155 node qa/v2186-collect-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2186-collect';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.BOX_PORT||18156),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  ok('0 box.php answers (php -S on '+PORT+')',up);if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};window.__asked=0;wsUI.choose=async()=>{window.__asked++;return '';};
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1200);
  const fr=page.frames().find(f=>/Daily_Behavior_Data/.test(f.url()));
  const T=await fr.evaluate(async u=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
    S=blankState();S.meta.client='Mateo Rivera';S.meta.id='4471823';S.meta.school='Royal Palm School';
    const mk=(name,measure)=>({id:uid('b'),kind:'target',name,definition:name+' (simulated).',obsLength:'Entire school day',measure,direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Elopement','count'),mk('Physical aggression','count')];S.rows=[];renderAll();
    document.getElementById('stAdv').open=true;const i=document.getElementById('stBoxIn');i.value=u;i.dispatchEvent(new Event('change',{bubbles:true}));
    const r=await __ddStaff.make('Ms. A, Room 12',[S.behaviors[0].id],[]);try{const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();}catch(e){}
    return {url:r.url,el:S.behaviors[0].id,today:localISO(new Date()),box:S.staff&&S.staff.box&&S.staff.box.id};},BOXURL);
  ok('1 Form DD-1 in the workstation makes a staff phone link on the reply box',!!T.url&&/staff-data\.html#s=/.test(T.url)&&!!T.box,T);
  const kept=await page.evaluate(async()=>{const ok=await caseKeepOnly();const r=(await clList()||[]).find(x=>x.key===clKey(packet()));return {ok,unf:!!(r&&r.unfiled),box:r?clBoxForms(r).map(x=>x[0]):[]};});
  ok('2 the case is kept on this iPad; the caseload sees its DD-1 waiting for staff entries',kept.ok&&kept.unf&&kept.box.join()==='DD-1',kept);
  await page.evaluate(()=>clearCase());await sleep(600);
  ok('3 the case is closed: no form open',await page.evaluate(()=>!Object.keys(state.frames).length&&!$('#pClient').value));
  /* the phone */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE});
  const pg=await ph.newPage();await pg.goto(T.url,{waitUntil:'load'});await sleep(600);
  for(let i=0;i<2;i++){await pg.tap(`section.t[data-t="${T.el}"] [data-a="inc"]`);await sleep(60);}
  await pg.tap('#sdSend');await sleep(1500);
  const sent=await pg.evaluate(()=>document.getElementById('sdMsg').textContent);
  ok('4 the phone sends two elopements for today',/^Sent\./.test(sent),sent);
  /* the workstation collects, the case closed */
  const t0=Date.now();const res=await page.evaluate(async()=>{const r=await clRepliesAll(true);return {r,note:CLX.note};});
  const after=await page.evaluate(async([el,today])=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const d=parseCase(r.text),own=JSON.parse(d.forms['DD-1'].snap.own);
    const row=(own.rows||[]).find(x=>x.date===today);return {val:row&&row.values&&row.values[el],by:row&&row.by,staff:d.facts&&d.facts.data&&d.facts.data.staff,unf:!!r.unfiled,frames:Object.keys(state.frames).length,host:document.querySelectorAll('#clHost iframe').length};},[T.el,T.today]);
  ok('5 Collect replies opens the student’s DD-1 unseen and places the entry: '+JSON.stringify(res.r),res.r.n===1&&res.r.placed===1&&/Replies: 1 placed/.test(res.note)&&/Mateo Rivera/.test(res.note),res);
  ok('6 the caseload’s copy of the case holds the count on today’s row (Collected by Ms. A) and data.staff; still marked not in a file; nothing left open',String(after.val)==='2'&&/Ms\. A/.test(String(after.by||''))&&after.staff&&+after.staff.entries>=1&&after.unf&&after.frames===0&&after.host===0,after);
  const again=await page.evaluate(async()=>{const r=await clRepliesAll(true);return {r,note:CLX.note,asked:window.__asked};});
  const after2=await page.evaluate(async([el,today])=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const own=JSON.parse(parseCase(r.text).forms['DD-1'].snap.own);const row=(own.rows||[]).find(x=>x.date===today);return row&&row.values&&row.values[el];},[T.el,T.today]);
  ok('7 a second run: nothing new, nothing placed twice, no question asked',again.r.placed===0&&/No new replies/.test(again.note)&&String(after2)==='2'&&again.asked===0,{again,after2});
  /* reopening the case: the form shows what came in */
  const shown=await page.evaluate(async el=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));await openCaseText(r.text,null,{asked:true,quiet:true});return true;},T.el);
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1500);
  const fr2=page.frames().find(f=>/Daily_Behavior_Data/.test(f.url()));
  const v2=await fr2.evaluate(([el,today])=>{const row=S.rows.find(x=>x.date===today);return row&&row.values[el];},[T.el,T.today]);
  ok('8 opened from the caseload, Form DD-1 shows the two elopements on today’s row',shown&&String(v2)==='2',v2);
  ok('no page errors',!errs.length,errs.slice(0,5));
  }finally{await br.close();php.kill();}
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
