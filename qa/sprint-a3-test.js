/* v21.44 sprint A3: OB-1's Live Recorder fits an iPad held sideways, and OB-1's files carry the date and time.
   1. Reach (the portrait.js measurements, with touch): in the workstation at 1180x820 and 1024x768 with the bar folded and at
      1180x820 with the bar open (each 1180 case also with the wider "Autosaved 12:59 PM" chip, which wraps the bar today),
      at 820x1180, and on its own at 1180x820 and 1024x768. In each, with the recorder in view (the Observations view as it
      opens, again after a note is added, and again scrolled to the top as "back to the recorder" does), the clock, Start,
      End, Save, the count tiles, their Undo buttons and the note box (time, Now, text, Add) all sit fully inside the
      visible area: below the form's sticky toolbar, above the foot of the window, and nothing on top of them. While
      recording, the pill shown when the recorder is scrolled away brings them all back into view, also at 1024x700 (a
      1024x768 iPad's Safari window) with the bar open, where only the working part fits and the settings line scrolls
      away above.
   2. Start, End and Save are one row in the clock's column, under the clock, each at least 44 x 44 px; the note box sits
      under the count tiles.
   3. A short landscape window folds the explanations away behind How it works, which unfolds them; portrait shows them.
   4. The run of ob1-live.js, by touch in the workstation at 1180x820: TB-1 simulated, then OB-1: Start, three student taps,
      one peer tap, a note, End, Save. Every control is tapped where it is, with no scrolling, and the sheet holds what
      ob1-live.js recorded before this package: count 3, peer 1, minutes 0.1, the date and the start and end times of the
      run, the note in the narrative, no interval marked.
   5. File names: Save data gives OB-1_<Student>_<YYYY-MM-DD>_<HHMM>.json and Export CSV the same name in .csv, from the
      local time of the save, so two saves at different times differ; no student gives OB-1_student_...; the file's
      content is unchanged and opens again; a record in v21.24's shape (below) opens whole and saves again under the new
      name; A3_OLD=<a file saved by an earlier version> adds that file.
   6. Print: the form as it was before this package (git A3_BASE, default 683061a) and the form now print the same pages,
      blank and from the same simulated record (compared with compare-print.py, or by page count without PyMuPDF).
   7. No page error and no console error.
   Usage: WS_URL=http://127.0.0.1:8303 WS_ROOT=<worktree> node qa/sprint-a3-test.js [NBH-Workstation|RPS-Workstation] */
const {chromium,fs,path,ROOT,BASE,forms,sleep}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a3/';
const F=forms(ED),OB=F.find(f=>f.id==='OB-1');
if(!OB){console.error('FAIL no OB-1 in '+ED);process.exit(1);}
const FORM=BASE+'/'+ED+'/'+OB.file,SHELL=BASE+'/'+ED+'/index.html';
const A3_BASE=process.env.A3_BASE||'683061a';
/* a record in the shape OB-1 saved it in v21.24: ivUsed on each observation, no second-observer fields, narrative times typed
   as h:mm (1:09 is after lunch); A3_OLD can name a real earlier file as well */
const A3_OLD=process.env.A3_OLD||'';
const OLD_RECORD={meta:{client:'Old File Student',sid:'OLD-024',school:'Room 12 School',observer:'Observer A',role:'BCBA',teacher:'Ms. Teacher',
  behavior:'Aggression toward staff',definition:'Forceful contact with a staff member.',question:'Does it cluster in independent work?',peerBy:'Classroom teacher',
  peerWhy:'Same grade, no plan',carry:'Observer A conducted 2 direct observations.'},cfg:{ivLen:15,ivMethod:'partial',ivN:20},
  obs:[{date:'2026-09-24',start:'09:05',end:'09:50',mins:'',setting:'Room 12',activity:'Math, independent worksheets',arrange:'Independent work',adults:'2',students:'8',
    announced:'Announced',secondObs:'Technician',agree:'90',narrative:[{t:'9:07',w:'Worksheet placed; teacher gives the direction.'},{t:'9:14',w:'Student contacts the paraprofessional’s forearm.'}],
    ante:{demand:true},cons:{escape:true},conclusion:'Followed demands.',count:'7',peerCount:'1',iv:Array.from({length:20},(_,j)=>j===3||j===9),peerIv:Array(20).fill(false),ivUsed:true,notes:'Announced.'},
   {date:'2026-10-01',start:'13:05',end:'13:33',mins:'',setting:'Room 12',activity:'Writing, independent',arrange:'Independent work',adults:'1',students:'8',
    announced:'Unannounced',secondObs:'',agree:'',narrative:[{t:'1:09',w:'Writing prompt given to the class.'},{t:'1:16',w:'Student kicks the table leg.'}],
    ante:{demand:true},cons:{removal:true},conclusion:'Same pattern.',count:'6',peerCount:'1',iv:Array.from({length:20},(_,j)=>j===5),peerIv:Array.from({length:20},(_,j)=>j===12),ivUsed:true,notes:''}]};
let fails=0;
const ok=(name,cond,detail)=>{console.log((cond?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail).slice(0,cond?260:1600):''));if(!cond)fails++;};
const errs=[];
function watch(page,where){
  page.on('pageerror',e=>errs.push(where+' pageerror: '+String(e.message||e).slice(0,240)));
  page.on('console',m=>{if(m.type()==='error')errs.push(where+' console: '+m.text().slice(0,240));});
}
const CORE=['obrClock','obrStart','obrEnd','obrSave','obrTapS','obrTapP','obrUndoS','obrUndoP','obrNote','obrNoteT','obrNoteNow','obrNoteW','obrNoteAdd'];
/* where each control sits, and whether it is fully inside the visible area and not covered */
async function reach(fr){
  return fr.evaluate(ids=>{
    const tb=document.querySelector('.toolbar'),sticky=!!tb&&getComputedStyle(tb).position==='sticky';
    const top=sticky?tb.getBoundingClientRect().bottom:0,vh=window.innerHeight,vw=document.documentElement.clientWidth;
    const out={top:Math.round(top),vh,vw,sw:document.documentElement.scrollWidth,bad:[],els:{}};
    const box=r=>({t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height)});
    for(const id of ids){
      const e=document.getElementById(id);if(!e){out.bad.push(id+' missing');continue;}
      const r=e.getBoundingClientRect();out.els[id]=box(r);
      const inside=r.width>0&&r.height>0&&r.top>=top-0.5&&r.bottom<=vh+0.5&&r.left>=-0.5&&r.right<=vw+0.5;
      const hit=inside?document.elementFromPoint(r.left+r.width/2,r.top+Math.min(r.height/2,18)):null;
      if(!inside)out.bad.push(id+' '+Math.round(r.top)+'..'+Math.round(r.bottom)+' outside '+Math.round(top)+'..'+vh);
      else if(!hit||!(hit===e||e.contains(hit)))out.bad.push(id+' covered by '+(hit?(hit.id||hit.className||hit.tagName):'nothing'));
    }
    const col=document.querySelector('#obRec .obr-clock');out.els.col=col?box(col.getBoundingClientRect()):null;
    return out;},CORE);
}
/* the recorder scrolled to the top under the toolbar, as the recording pill's "back to the recorder" does */
const pillScroll=fr=>fr.evaluate(()=>{const box=document.getElementById('obRec'),bar=document.querySelector('.toolbar'),
  off=bar&&getComputedStyle(bar).position==='sticky'?bar.offsetHeight:0;window.scrollTo(0,Math.max(0,box.getBoundingClientRect().top+window.scrollY-off-8));});
function layoutChecks(tag,m,land){
  const e=m.els,S=e.obrStart,En=e.obrEnd,Sv=e.obrSave,C=e.obrClock,col=e.col;
  ok(tag+': Start, End and Save each at least 44 x 44 px',[S,En,Sv].every(x=>x.w>=44&&x.h>=44),{Start:[S.w,S.h],End:[En.w,En.h],Save:[Sv.w,Sv.h]});
  ok(tag+': Start, End and Save in one row, in that order',Math.abs(S.t-En.t)<=1&&Math.abs(S.t-Sv.t)<=1&&S.r<=En.l&&En.r<=Sv.l,{tops:[S.t,En.t,Sv.t]});
  /* under the clock's status line and progress bar, which wraps to two lines in portrait */
  ok(tag+': the row sits in the clock\'s column, under the clock',!!col&&[S,En,Sv].every(x=>x.l>=col.l-1&&x.r<=col.r+1)&&S.t>=C.b&&S.t-C.b<=90,{col,clockBottom:C.b,rowTop:S.t});
  const N=e.obrNote,TS=e.obrTapS,TP=e.obrTapP,US=e.obrUndoS;
  ok(tag+': the note box sits under the count tiles',N.t>=Math.max(TS.b,US.b)&&N.l>=TS.l-1&&N.r<=TP.r+1,{note:N,tiles:[TS,TP]});
  ok(tag+': nothing runs past the right edge',m.sw<=m.vw,{scrollWidth:m.sw,clientWidth:m.vw});
}
async function shellCase(br,W,H,bar,chip){
  const tag=`shell ${W}x${H} bar ${bar}${chip?' + Autosaved chip':''}`;
  const ctx=await br.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});
  await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,tag);page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(SHELL);await sleep(900);
  /* the name typed with taps, as a person would */
  await page.tap('#pClient');await page.keyboard.type('Jordan Rivera');await page.tap('#pSid');await page.keyboard.type('204417');
  await page.evaluate(i=>openForm(i),'OB-1');await page.waitForFunction(i=>!!state.status[i],'OB-1',{timeout:20000}).catch(()=>{});await sleep(1500);
  const fr=page.frames().find(x=>x.url().includes(OB.file)||x.url().includes(encodeURIComponent(OB.file)));
  if(!fr){ok(tag+': OB-1 opens in the workstation',false);await ctx.close();return;}
  if(bar==='fold'){if(await page.isVisible('#barFold'))await page.tap('#barFold');}
  else if(await page.isVisible('#barEdit'))await page.tap('#barEdit');
  await sleep(400);
  const folded=await page.evaluate(()=>document.body.classList.contains('bar-folded'));
  if(chip)await page.evaluate(()=>{const c=document.getElementById('autoChip');if(c)c.textContent='Autosaved 12:59 PM';});
  await sleep(300);
  const frame=await page.evaluate(()=>{const f=[...document.querySelectorAll('iframe')].find(x=>!x.hidden&&x.getBoundingClientRect().height>0);const r=f.getBoundingClientRect();
    return {top:Math.round(r.top),h:Math.round(r.height),bottom:Math.round(r.bottom),vh:innerHeight};});
  ok(tag+': the bar is '+(bar==='fold'?'folded':'open')+', the form fills the rest of the screen',folded===(bar==='fold')&&frame.bottom<=frame.vh+0.5,{folded,frame});
  await fr.tap('#viewSeg [data-view="obs"]');await sleep(500);
  const m0=await reach(fr);
  ok(tag+': as the Observations view opens, every recorder control is in view',!m0.bad.length,{frameTop:frame.top,visible:[m0.top,m0.vh],bad:m0.bad});
  layoutChecks(tag,m0,W>H);
  /* a note added: the line saying where it went shows under the box */
  await fr.tap('#obrNoteW');await page.keyboard.type('Probe note: J. pushes the worksheet off the desk and puts his head down on his arms');await fr.tap('#obrNoteAdd');await sleep(400);
  const m1=await reach(fr);
  ok(tag+': with a note added, every recorder control is still in view',!m1.bad.length,{note:m1.els.obrNote,visible:[m1.top,m1.vh],bad:m1.bad});
  await pillScroll(fr);await sleep(300);
  const m2=await reach(fr);
  ok(tag+': scrolled to the top as "back to the recorder" does, every recorder control is in view',!m2.bad.length,{note:m2.els.obrNote,visible:[m2.top,m2.vh],bad:m2.bad});
  await foldCheck(tag,fr,W>H);
  await page.screenshot({path:OUT+'reach-'+W+'x'+H+'-'+bar+(chip?'-chip':'')+'.png'});
  await ctx.close();
}
async function foldCheck(tag,fr,land){
  const look=()=>fr.evaluate(()=>{const d=id=>{const e=document.getElementById(id);return e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;};
    const t=document.getElementById('obrAbout');return {hint:d('obrHint'),nhint:d('obrNHint'),about:d('obrAbout'),exp:t?t.getAttribute('aria-expanded'):null};});
  const a=await look();
  if(!land){ok(tag+': portrait shows the explanations, and no How it works',a.hint&&a.nhint&&!a.about,a);return;}
  ok(tag+': the explanations are folded away behind How it works',!a.hint&&!a.nhint&&a.about&&a.exp==='false',a);
  if(!a.about)return;
  await fr.tap('#obrAbout');await sleep(200);const b=await look();
  ok(tag+': How it works unfolds them',b.hint&&b.nhint&&b.exp==='true',b);
  await fr.tap('#obrAbout');await sleep(200);const c=await look();
  ok(tag+': and folds them again',!c.hint&&!c.nhint&&c.exp==='false',c);
}
async function aloneCase(br,W,H){
  const tag=`alone ${W}x${H}`;
  const ctx=await br.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,tag);page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(FORM);await sleep(800);
  await page.tap('#viewSeg [data-view="obs"]');await sleep(300);await pillScroll(page.mainFrame());await sleep(200);
  const m=await reach(page.mainFrame());
  ok(tag+': scrolled to the recorder, every recorder control is in view',!m.bad.length,{visible:[m.top,m.vh],bad:m.bad});
  layoutChecks(tag,m,W>H);
  await ctx.close();
}
/* while recording, scrolled down to the sheets: the pill brings the recorder back with every control in view. In a frame too
   short for the whole panel (1024x700 with the bar open and the wider chip) it brings the working part to the top. */
async function pillCase(br,W,H,bar,chip){
  const tag=`pill, shell ${W}x${H} bar ${bar}${chip?' + Autosaved chip':''}`;
  const ctx=await br.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,tag);page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(SHELL);await sleep(900);
  await page.tap('#pClient');await page.keyboard.type('Jordan Rivera');
  await page.evaluate(i=>openForm(i),'OB-1');await page.waitForFunction(i=>!!state.status[i],'OB-1',{timeout:20000}).catch(()=>{});await sleep(1500);
  const fr=page.frames().find(x=>x.url().includes(OB.file)||x.url().includes(encodeURIComponent(OB.file)));
  if(bar==='fold'){if(await page.isVisible('#barFold'))await page.tap('#barFold');}else if(await page.isVisible('#barEdit'))await page.tap('#barEdit');
  if(chip)await page.evaluate(()=>{const c=document.getElementById('autoChip');if(c)c.textContent='Autosaved 12:59 PM';});
  await sleep(400);
  await fr.tap('#viewSeg [data-view="obs"]');await sleep(400);await fr.tap('#obrStart');await sleep(600);
  await fr.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await sleep(500);
  const shown=await fr.isVisible('#obrPill');
  if(shown)await fr.tap('#obrPill');await sleep(400);
  const m=await reach(fr);
  ok(tag+': the pill shows while the recorder is out of view, and brings every recorder control back into view',shown&&!m.bad.length,{shown,visible:[m.top,m.vh],bad:m.bad});
  await fr.evaluate(()=>{window.confirm=()=>true;});await fr.tap('#obrEnd');await sleep(300);
  await fr.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(d&&d.open){const b=d.querySelector('button.primary,button.danger');if(b)b.click();}});await sleep(300);
  await ctx.close();
}
async function liveRun(br){
  const tag='live run, shell 1180x820';
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,tag);const dlg=[];page.on('dialog',d=>{if(d.type()!=='beforeunload')dlg.push(d.type()+': '+d.message().slice(0,120));d.accept().catch(()=>{});});
  await page.goto(SHELL);await sleep(900);
  await page.evaluate(()=>{const s=(i,v)=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('pClient','Jordan Rivera');s('pSid','204417');});
  await page.evaluate(()=>{const b=document.getElementById('barFold');if(b&&!b.hidden)b.click();});
  const open=async id=>{await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000}).catch(()=>{});await sleep(1800);
    const f=F.find(x=>x.id===id).file;return page.frames().find(x=>x.url().includes(f)||x.url().includes(encodeURIComponent(f)));};
  let fr=await open('TB-1');await fr.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simBtn').click();});await sleep(6000);
  fr=await open('OB-1');
  await fr.tap('#viewSeg [data-view="obs"]');await sleep(600);
  const y0=await fr.evaluate(()=>scrollY);const where=[];
  const tap=async id=>{const m=await fr.evaluate(i=>{const e=document.getElementById(i),r=e.getBoundingClientRect(),tb=document.querySelector('.toolbar').getBoundingClientRect();
      return r.top>=tb.bottom-0.5&&r.bottom<=innerHeight+0.5;},id);
    const y=await fr.evaluate(()=>scrollY);await fr.tap('#'+id);where.push(id+(m&&y===y0?'':' (not in view, or scrolled)'));};
  const ui=()=>fr.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?d.innerText.replace(/\s+/g,' ').slice(0,160):'';});
  const uiOk=()=>fr.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return '';const b=d.querySelector('button.primary,button.danger')||[...d.querySelectorAll('button')].pop();const t=b.textContent;b.click();return t;});
  await tap('obrStart');await sleep(1500);
  for(let i=0;i<3;i++){await tap('obrTapS');await sleep(250);}
  await tap('obrTapP');
  await tap('obrNoteW');const noteT=await fr.evaluate(()=>document.getElementById('obrNoteT').value);
  await page.keyboard.type('Math worksheet given; J. pushes paper off desk');await tap('obrNoteAdd');
  await sleep(1500);await tap('obrEnd');await sleep(400);const endQ=await ui();const endOk=await uiOk();await sleep(500);
  const wall=await fr.evaluate(()=>obRecorder.wall()),elapsed=await fr.evaluate(()=>obRecorder.elapsed()),counts=await fr.evaluate(()=>obRecorder.counts());
  await tap('obrSave');await sleep(600);const saveQ=await ui();if(saveQ)await uiOk();await sleep(900);
  ok(tag+': every control tapped where it was, with no scrolling',where.every(w=>!/not in view/.test(w)),where);
  ok(tag+': End asks first, as before',/^End the observation now\?/.test(endQ)&&endOk==='End now',{endQ,endOk});
  const got=await fr.evaluate(()=>{const o=state.obs[0];return {n:state.obs.length,date:o.date,start:o.start,end:o.end,mins:o.mins,count:o.count,peerCount:o.peerCount,
    iv:(o.iv||[]).filter(Boolean).length,peerIv:(o.peerIv||[]).filter(Boolean).length,narr:o.narrative.filter(r=>r.t||r.w).map(r=>[r.t,r.w]),notes:o.notes,
    client:state.meta.client,behavior:String(state.meta.behavior||'').slice(0,40),rec:obRecorder.state(),
    sheet:[...document.querySelectorAll('.obs-page')][0].querySelector('[data-field="count"]').value};});
  const exp=await fr.evaluate(([ws,we,el])=>{const p=n=>String(n).padStart(2,'0'),d=new Date(ws),e=new Date(we);
    return {date:d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()),start:p(d.getHours())+':'+p(d.getMinutes()),end:p(e.getHours())+':'+p(e.getMinutes()),mins:String(Math.round(el/6000)/10)};},[wall.start,wall.end,elapsed]);
  ok(tag+': counts 3 and 1 recorded',counts.s===3&&counts.p===1,counts);
  ok(tag+': the sheet holds what ob1-live.js recorded: count 3, peer 1, minutes 0.1, no interval marked',
    got.count==='3'&&got.peerCount==='1'&&got.mins==='0.1'&&got.iv===0&&got.peerIv===0&&got.sheet==='3'&&got.n===1,got);
  ok(tag+': the date and the start and end times are the run\'s own',got.date===exp.date&&got.start===exp.start&&got.end===exp.end&&got.mins===exp.mins,{got:[got.date,got.start,got.end,got.mins],exp});
  ok(tag+': the note is in the narrative at its time',got.narr.length===1&&got.narr[0][0]===noteT&&got.narr[0][1]==='Math worksheet given; J. pushes paper off desk',{narr:got.narr,noteT});
  ok(tag+': the student came from the bar and the behavior from TB-1; the recorder is ready again',got.client==='Jordan Rivera'&&/\S/.test(got.behavior)&&got.rec==='ready'&&!saveQ,{client:got.client,behavior:got.behavior,rec:got.rec,saveQ});
  ok(tag+': no browser dialog',!dlg.length,dlg);
  await ctx.close();
}
async function files(br){
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,acceptDownloads:true});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,'files');const dlg=[];
  /* the form's own leave warning (beforeunload) when the test moves on is expected; any other dialog is not */
  page.on('dialog',d=>{if(d.type()!=='beforeunload')dlg.push(d.type()+': '+d.message().slice(0,120));d.accept().catch(()=>{});});
  await page.goto(FORM);await sleep(800);
  const setName=v=>page.evaluate(v=>{const e=document.getElementById('mClient');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);
  const grab=async sel=>{const [d]=await Promise.all([page.waitForEvent('download',{timeout:10000}),page.evaluate(s=>document.querySelector(s).click(),sel)]);return {name:d.suggestedFilename(),path:await d.path()};};
  await setName('Jordan Rivera');
  let fixed=true;try{await page.clock.setFixedTime(new Date(2026,9,6,9,5,0));}catch(e){fixed=false;}
  const pat=/^OB-1_Jordan_Rivera_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})\.(json|csv)$/;
  const t0=new Date();const j1=await grab('#saveBtn');const t1=new Date();
  if(fixed)ok('files: Save data is OB-1_<Student>_<YYYY-MM-DD>_<HHMM>.json',j1.name==='OB-1_Jordan_Rivera_2026-10-06_0905.json',j1.name);
  else{const m=pat.exec(j1.name);const at=m?new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):null;
    ok('files: Save data is OB-1_<Student>_<YYYY-MM-DD>_<HHMM>.json, the local time of the save',!!at&&at>=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate(),t0.getHours(),t0.getMinutes())&&at<=t1,j1.name);}
  const text=fs.readFileSync(j1.path,'utf8'),own=await page.evaluate(()=>JSON.stringify(state,null,1));
  ok('files: the saved file\'s content is unchanged (the record as before)',text===own,{bytes:text.length});
  if(fixed)await page.clock.setFixedTime(new Date(2026,9,6,13,47,0));
  const c1=await grab('#csvBtn'),j2=await grab('#saveBtn');
  if(fixed){ok('files: Export CSV is named the same way, in .csv',c1.name==='OB-1_Jordan_Rivera_2026-10-06_1347.csv',c1.name);
    ok('files: two saves at different times no longer share a name',j2.name==='OB-1_Jordan_Rivera_2026-10-06_1347.json'&&j2.name!==j1.name,[j1.name,j2.name]);}
  else ok('files: Export CSV is named the same way, in .csv',pat.test(c1.name)&&c1.name.endsWith('.csv'),c1.name);
  const head=fs.readFileSync(c1.path,'utf8').split('\n')[0];
  ok('files: the CSV\'s columns are as before',head.startsWith('"Date","Start","End","Minutes","Setting","Activity"')&&/"Interval IOA \(%\)"$/.test(head),head.slice(0,80));
  await setName('José O’Neil-Smith');const j3=await grab('#saveBtn');
  ok('files: other characters become _, as in the other forms\' names',/^OB-1_Jos_O_Neil-Smith_\d{4}-\d{2}-\d{2}_\d{4}\.json$/.test(j3.name),j3.name);
  await setName('  ');const j4=await grab('#saveBtn');
  ok('files: no student gives OB-1_student_...',/^OB-1_student_\d{4}-\d{2}-\d{2}_\d{4}\.json$/.test(j4.name),j4.name);
  /* the file opens again */
  await page.goto(FORM);await sleep(700);
  await page.setInputFiles('#fileIn',j1.path);await sleep(600);
  const back=await page.evaluate(()=>({client:state.meta.client,n:state.obs.length}));
  ok('files: the saved file opens again',back.client==='Jordan Rivera'&&back.n===JSON.parse(text).obs.length,back);
  /* an older file opens with everything in it, and saves again under the new name with its lines kept */
  const oldFile=OUT+'old-v21.24_OB-1.json';fs.writeFileSync(oldFile,JSON.stringify(OLD_RECORD,null,1));
  const look=()=>page.evaluate(()=>({client:state.meta.client,n:state.obs.length,dates:state.obs.map(x=>x.date),counts:state.obs.map(x=>x.count+'/'+x.peerCount),
    marks:state.obs.map(x=>(x.iv||[]).filter(Boolean).length+'/'+(x.peerIv||[]).filter(Boolean).length),lines:state.obs.map(x=>x.narrative.map(r=>r.w).join(' | ')),
    sheets:document.querySelectorAll('.obs-page').length,times:[...document.querySelectorAll('.obs-page')][1].querySelector('input.nt').value}));
  await page.setInputFiles('#fileIn',oldFile);await sleep(700);
  const o=await look(),want={client:OLD_RECORD.meta.client,n:2,dates:OLD_RECORD.obs.map(x=>x.date),counts:['7/1','6/1'],marks:['2/0','1/1'],lines:OLD_RECORD.obs.map(x=>x.narrative.map(r=>r.w).join(' | '))};
  ok('files: a record saved by v21.24 opens with its observations, counts, marks and narrative',JSON.stringify(Object.assign({},o,{sheets:undefined,times:undefined}))===JSON.stringify(Object.assign({},want,{sheets:undefined,times:undefined}))&&o.sheets===2&&o.times==='13:09',{got:o});
  const j5=await grab('#saveBtn'),again=JSON.parse(fs.readFileSync(j5.path,'utf8'));
  ok('files: saved again, it is named the new way and keeps every line',/^OB-1_Old_File_Student_\d{4}-\d{2}-\d{2}_\d{4}\.json$/.test(j5.name)&&again.obs.map(x=>x.narrative.map(r=>r.w).join(' | ')).join('#')===want.lines.join('#')&&again.obs[1].count==='6',j5.name);
  if(A3_OLD&&fs.existsSync(A3_OLD)){const old=JSON.parse(fs.readFileSync(A3_OLD,'utf8'));
    await page.setInputFiles('#fileIn',A3_OLD);await sleep(700);
    const r=await page.evaluate(()=>({client:state.meta.client,n:state.obs.length,counts:state.obs.map(x=>x.count)}));
    ok('files: the earlier file named in A3_OLD opens ('+path.basename(A3_OLD)+')',r.client===old.meta.client&&r.n===old.obs.length&&JSON.stringify(r.counts)===JSON.stringify(old.obs.map(x=>x.count)),r);}
  ok('files: no browser dialog',!dlg.length,dlg);
  await ctx.close();
}
async function print(br){
  let base=null;
  try{base=execFileSync('git',['show',A3_BASE+':'+ED+'/'+OB.file],{cwd:ROOT,maxBuffer:64<<20,stdio:['ignore','pipe','ignore']});}catch(e){}
  if(!base){console.log('NOTE the form at '+A3_BASE+' is not in this checkout (set A3_BASE): print comparison skipped');return;}
  const dirs={base:OUT+'print/base/',now:OUT+'print/now/'};Object.values(dirs).forEach(d=>{fs.rmSync(d,{recursive:true,force:true});fs.mkdirSync(d,{recursive:true});});
  fs.mkdirSync(OUT+'base/',{recursive:true});fs.writeFileSync(OUT+'base/'+OB.file,base);
  /* served beside the checkout when the server's root is WS_ROOT; read from the disk otherwise */
  let baseUrl=BASE+'/qa/out/sprint-a3/base/'+encodeURIComponent(OB.file);
  const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();watch(page,'print');page.on('dialog',d=>d.accept().catch(()=>{}));
  const r=await page.goto(baseUrl).catch(()=>null);if(!r||!r.ok())baseUrl='file://'+OUT+'base/'+OB.file;
  await page.goto(FORM);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;});
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
  const data=OUT+'print-data.json';fs.writeFileSync(data,await page.evaluate(()=>JSON.stringify(state,null,1)));
  const pages=b=>{const m=b.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};const counts={};
  for(const [which,url] of [['base',baseUrl],['now',FORM]]){
    for(const [name,file] of [['blank',null],['simulated',data]]){
      await page.goto(url);await sleep(700);
      if(file){await page.setInputFiles('#fileIn',file);await sleep(700);}
      await page.evaluate(()=>{const b=document.querySelector('#viewSeg [data-view="obs"]');if(b)b.click();});await sleep(200);
      await page.emulateMedia({media:'print'});await sleep(300);
      if(which==='now'&&name==='blank')ok('print: the recorder does not print',await page.evaluate(()=>getComputedStyle(document.getElementById('obRec')).display==='none'));
      const buf=await page.pdf({path:dirs[which]+name+'.pdf',preferCSSPageSize:true,printBackground:true});counts[which+' '+name]=pages(buf);
      await page.emulateMedia({media:'screen'});}}
  await ctx.close();
  let cmp=null;
  try{cmp=execFileSync('python3',[__dirname+'/compare-print.py',dirs.base,dirs.now],{encoding:'utf8'});}catch(e){cmp=null;}
  if(cmp){const m=/identical: (\d+) of (\d+)/.exec(cmp);ok('print: the observation sheets print the same as before this package ('+A3_BASE+'), blank and simulated',!!m&&m[1]===m[2]&&m[2]==='2',cmp.trim().split('\n'));}
  else ok('print: the same number of pages as before this package (no PyMuPDF for a page-by-page comparison)',counts['base blank']===counts['now blank']&&counts['base simulated']===counts['now simulated'],counts);
  console.log('print pages',JSON.stringify(counts));
}
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  console.log('sprint A3 on',ED,'at',BASE);
  const br=await chromium.launch();
  for(const [W,H,bar,chip] of [[1180,820,'fold',false],[1180,820,'fold',true],[1024,768,'fold',false],[1180,820,'open',false],[1180,820,'open',true],[820,1180,'fold',false]])
    await shellCase(br,W,H,bar,chip);
  await aloneCase(br,1180,820);await aloneCase(br,1024,768);
  await pillCase(br,1180,820,'fold',false);await pillCase(br,1024,700,'open',true);
  await liveRun(br);
  await files(br);
  await print(br);
  ok('no page error and no console error',!errs.length,errs);
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
