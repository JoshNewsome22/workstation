/* v21.94 Log it now: an incident, time-stamped, into Form DD-1's incident log from the start screen, the Today list and the
   command list. Simulated students only (Mateo Rivera 4471823; SIMULATED – Sample Student SIM-0002). Chromium.
   usage: node qa/v2194-log-test.js   (WS_URL=http://127.0.0.1:8123) */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
async function shell(br,vp,touch){const ctx=await br.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch,userAgent:touch?IPHONE:undefined,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on@nbh'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const now=Date.now();const mk=(p,saved,sum)=>({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum,
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}},facts:{src:{}}})});
    const A=mk({client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School',grade:'5'},new Date(now-3600e3).toISOString(),{items:[],forms:1});
    const B=mk({client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},new Date(now-864e5).toISOString(),{items:[],forms:1});
    await clTx('readwrite',st=>{st.put(A);st.put(B);});await paintBlank();});
  await sleep(900);return {ctx,page,errs};}
const frameOf=(page,file)=>page.frames().find(f=>f.url().indexOf(file)>=0);
(async()=>{const br=await chromium.launch();
  try{
  /* ---- 1. from the start screen, for a student kept on the device and not on screen ---- */
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},false);
    const has=await page.evaluate(()=>!!document.querySelector('#blank #blLog')&&getComputedStyle(document.querySelector('#blank #blLog')).display!=='none');
    ok('1 the start screen offers Log it now beside New student and Caseload',has);
    await page.click('#blLog');await sleep(600);
    const d=await page.evaluate(()=>({open:$('#dlg').open,title:$('#dlgTitle').textContent.trim(),who:[...document.querySelectorAll('#lnWho option')].map(o=>o.textContent.trim()),date:$('#lnDate').value,time:$('#lnTime').value,hold:[...document.querySelectorAll('#lnHold option')].map(o=>o.value)}));
    const today=new Date(),iso=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    ok('2 the sheet opens with the two students to pick from, today and the time now',d.open&&d.title==='Log it now'&&d.who.length===2&&d.date===iso&&/^\d{2}:\d{2}$/.test(d.time)&&d.hold.join()===',escort,restraint,seclusion',d);
    await page.evaluate(()=>{const s=$('#lnWho');s.value=[...s.options].find(o=>/Mateo/.test(o.textContent)).value;$('#lnTime').value='10:32';$('#lnBeh').value='Hitting';$('#lnBefore').value='Asked to start the math worksheet';
      $('#lnWhat').value='Hit the para on the arm twice with an open hand';$('#lnDid').value='Blocked, moved the worksheet away, waited';$('#lnEnded').value='Back at his desk by 10:40';$('#lnBy').value='Simulated BCBA';});
    await page.click('#lnSave');
    await page.waitForFunction(()=>!!(state.frames['DD-1']&&state.status['DD-1']),null,{timeout:40000}).catch(()=>{});await sleep(2500);
    const after=await page.evaluate(()=>({client:packet().client,cur:state.cur,dlgOpen:$('#dlg').open,toast:[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).join(' | ').slice(0,300)}));
    const fr=frameOf(page,'Daily_Behavior');
    const inc=fr?await fr.evaluate(()=>{const L=(S.incidents||[]);return {n:L.length,i:L[0]?{date:L[0].date,time:L[0].time,name:ddIncName(L[0]),before:L[0].before,what:L[0].what,did:L[0].did,ended:L[0].ended,by:L[0].by,parent:L[0].parent,hold:L[0].hold||'',bcba:L[0].bcba}:null,rows:document.querySelectorAll('#ddInc tbody tr').length};}):null;
    ok('3 Mateo’s case opened with Form DD-1, which holds the incident as logged (a behavior not on its sheet kept by name)',after.client==='Mateo Rivera'&&after.cur==='DD-1'&&!after.dlgOpen&&inc&&inc.n===1&&inc.i.time==='10:32'&&inc.i.name==='Hitting'&&/open hand/.test(inc.i.what)&&inc.i.parent==='no'&&inc.i.by==='Simulated BCBA'&&inc.i.hold===''&&inc.rows>=1,{after,inc});
    ok('4 the workstation said what was logged',/Logged on Form DD-1: Hitting at 10:32 am/.test(after.toast),after.toast);
    /* ---- 2. with the case on screen: from the Today list, a restraint, the behavior matched to the sheet ---- */
    await fr.evaluate(()=>{nbhUI.confirm=async()=>true;});await loadSim(fr);await sleep(2500);
    const sim=await fr.evaluate(()=>({n:(S.incidents||[]).length,b:S.behaviors.filter(b=>ddCountable(b)).map(b=>({id:b.id,name:b.name}))}));
    ok('5a Form DD-1’s simulation loaded (behaviors counted by frequency on the sheet)',sim.b.length>=1,sim);
    await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});await page.evaluate(()=>todayOpen());await sleep(1200);
    const td=await page.evaluate(()=>({tdLog:!!$('#dlgBody #tdLog'),first:($('#dlgBody .td-more button')||{}).id}));
    ok('5 the Today list offers Log it now first in its row',td.tdLog&&td.first==='tdLog',td);
    await page.click('#tdLog');await sleep(700);
    const d2=await page.evaluate(()=>({who:$('#lnWho').tagName,first:($('#lnWho').options&&$('#lnWho').options[0]||{}).textContent,lead:$('#dlgBody .hp-lead').textContent,beh:[...document.querySelectorAll('#lnBehList option')].map(o=>o.value)}));
    ok('6 with the case on screen the sheet offers the student on screen first (v22.22: the other students kept here after it) and the case’s behaviors',d2.who==='SELECT'&&/^Mateo Rivera \(on screen\)/.test(d2.first),d2);
    await page.evaluate(b=>{$('#lnTime').value='13:05';$('#lnBeh').value=b.toLowerCase();$('#lnWhat').value='Hit the teacher';$('#lnHold').value='restraint';$('#lnDid').value='Two-person hold, 2 minutes';},sim.b[0].name);
    await page.click('#lnSave');await sleep(2500);
    const inc2=await fr.evaluate(()=>{const L=(S.incidents||[]);const i=L.filter(x=>x.time==='13:05').pop()||{};return {n:L.length,name:ddIncName(i),beh:i.beh,hold:i.hold||'',time:i.time,counted:!!i.counted};});
    const toast2=await page.evaluate(()=>[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).join(' | ').slice(-220));
    ok('7 the second incident matched the sheet’s behavior (case aside), carries the restraint and counts for the day',inc2.n===sim.n+1&&inc2.beh===sim.b[0].id&&inc2.name===sim.b[0].name&&inc2.hold==='restraint'&&inc2.time==='13:05'&&inc2.counted&&/Logged on Form DD-1: .* at 1:05 pm, one added to the day’s count \(restraint\)/.test(toast2),{inc2,toast2,sim});
    /* the case facts carry both, home not yet told */
    await page.evaluate(()=>gatherFacts(true));await sleep(800);
    const facts=await page.evaluate(()=>{const f=state.facts||{};const L=((f['DD-1']||f.dd1||{}).incidentList)||(f.incidentList)||[];let n=L.length;if(!n){try{const d=state.facts&&state.facts.src;}catch(e){}}return {n,items:todayItems().filter(x=>/Home|incident/i.test(x.k+' '+x.t)).map(x=>x.k+': '+x.t.replace(/<[^>]*>/g,'').slice(0,90))};});
    ok('8 Today lists the incidents home has not been told about',facts.items.length>=1&&/incidents? home has not been told about/.test(facts.items.join(' ')),facts);
    const cmd=await page.evaluate(()=>!!CMDS.find(c=>/Log it now/.test(c.n)));
    ok('9 the command list carries Log it now',cmd);
    ok('10 no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  /* ---- 3. on a phone: the sheet fits and its controls are 44 px ---- */
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},true);
    await page.tap('#blLog').catch(()=>page.click('#blLog'));await sleep(700);
    const m=await page.evaluate(()=>{const db=$('#dlgBody');const r=db.getBoundingClientRect();const over=[...db.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length;
      const small=[...db.querySelectorAll('input:not([type=hidden]),select,textarea,button')].filter(e=>e.getBoundingClientRect().height<40).map(e=>e.id||e.tagName);return {w:Math.round(r.width),vw:innerWidth,over,small,scrollW:db.scrollWidth,clientW:db.clientWidth};});
    ok('11 phone: the sheet fits the screen with no sideways scroll and no control under 40 px',m.over===0&&m.scrollW<=m.clientW+1&&!m.small.length,m);
    ok('12 phone: no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
