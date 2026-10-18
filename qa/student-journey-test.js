/* The student journey: one simulated student (Mateo Rivera, ID 4471823, DOB 03/14/2016, Royal Palm School) taken through the
   whole workstation the way a BCBA works a case, on an iPad-sized window with touch (1180 x 820, Safari's iPad user agent),
   in the order of the workstation's case map: A DM-1, IC-1, RR-1 · B TB-1 (the targets) · C IN-1 and IA-1 (sent to two
   simulated staff through the school Gmail, answered on their phones from the links in those emails, the reply box run with
   php -S, collected in the forms) · D OB-1, ABC-1, SP-1 and DD-1's baseline · E a second student, and back · F PA-1, FS-1,
   TD-1 (signed at the meeting), GB-1, CR-1, QS-1 · G DD-1's treatment days (one entered on staff-data.html from a staff
   phone link), a restraint, CR-1's notices, TI-1, CN-1 (the service log), PR-1 · H Today, What changed, the IEP meeting
   packet (and its print), Caseload, the calendar file, the restraint report (and .csv), the packet files, the master print
   of every form, the upright iPad. R1-R4: Save case, Close case, Open case from the file, every form opened and compared.
   The forms are driven through their own fields and buttons (typed, tapped) wherever practical. At each hand-off the test
   checks that what one form produced arrives in the next; every few steps the case is saved, closed, opened again from the
   file, every form opened, and compared with what it held; halfway a second simulated student ("SIMULATED – Sample Student")
   is opened, worked on a little and closed, and neither student may appear in the other's forms, Today, packet or files.
   Simulated people only. Google's sign-in, Gmail and the account are simulated (no network). Needs php on the PATH.
   usage: WS_URL=http://127.0.0.1:8161 BOX_PORT=18161 node qa/student-journey-test.js
          about 8 minutes; results, the case files, the PDFs and each round trip's differences in qa/out/student-journey/.
          For working on one part: ONLY=F,G (those phases), START_CASE=file (a case file opened first), CKPT=1 (a case file
          kept after each phase as qa/out/student-journey/ckpt-<phase>.json), TRACE=1 (each field and tap printed). */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/student-journey/';if(!process.env.START_CASE)fs.rmSync(OUT+'dl',{recursive:true,force:true});fs.mkdirSync(OUT+'dl',{recursive:true});
const PORT=+(process.env.BOX_PORT||18161),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPHONE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const T0=Date.now();
let fails=0,passes=0;const RES=[];
const ok=(n,c,i)=>{const line=(c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):'');console.log(line);RES.push(line);if(c)passes++;else fails++;return !!c;};
const note=s=>{console.log('     '+s);RES.push('     '+s);};
/* ---------------- dates: the case runs over the last six weeks, school days only ---------------- */
const pad=n=>String(n).padStart(2,'0'),iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const day=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d;};
const TODAY=iso(day(0));
const mdy=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?(+m[2])+'/'+(+m[3])+'/'+m[1]:s;};
const md2=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?(+m[2])+'/'+(+m[3])+'/'+m[1].slice(2):s;};
/* the school days before today, newest last */
const schoolDays=n=>{const L=[];for(let k=1;L.length<n;k++){const d=day(-k);if(d.getDay()!==0&&d.getDay()!==6)L.unshift(iso(d));}return L;};
const SD=schoolDays(30);          /* SD[29] is the last school day before today */
const D={referral:SD[0],consent:SD[1],records:SD[2],obs1:SD[4],obs2:SD[5],obs3:SD[6],baseFrom:SD[8],baseTo:SD[15],fs:SD[16],adopt:SD[17],start:SD[18],restraint:SD[25],ti:SD[27],last:SD[29]};
const M={client:'Mateo Rivera',first:'Mateo',last:'Rivera',sid:'4471823',dob:'2016-03-14',site:'Royal Palm School',grade:'4',bcba:'J. Ellis, BCBA',email:'simulated.bcba@palmbeachschools.org'};
const SAMPLE={client:'SIMULATED – Sample Student'};
const MATEO_MARKS=[/Mateo/,/Rivera/,/4471823/];const SAMPLE_MARKS=[/SIMULATED\s*[–-]\s*Sample/,/Sample Student/,/SIM-000/,/Sample Parent/];
const STAFF=[{name:'Ms. Lopez (simulated)',email:'lopez.sim@example.org',role:'Teacher'},{name:'Mr. Okafor (simulated)',email:'okafor.sim@example.org',role:'Paraprofessional'}];
const FILES=(()=>{const idx=fs.readFileSync(path.join(ROOT,'NBH-Workstation/index.html'),'utf8');const m=/const FORMS=(\[[\s\S]*?\n\]);/.exec(idx);
  return new Function('return '+m[1])().flatMap(g=>g[1]).reduce((o,[id,,file])=>{o[id]=file;return o;},{});})();

let br,ctx,page,php;const ERRS=[],DLS=[],DIALOGS=[],MAILS=[];let stepName='';
/* ---------------- the shell ---------------- */
const shell=(fn,arg)=>page.evaluate(fn,arg);
const frameOf=id=>page.frames().find(f=>f!==page.mainFrame()&&f.url().indexOf('/'+FILES[id])>=0&&f.url().indexOf('NBH-Workstation/')>=0);
/* a button of the shell's bar: tapped where it is (the folded bar opened first) */
async function tapShell(sel){
  let el=page.locator(sel).first();
  if(!(await el.isVisible().catch(()=>false))&&await shell(()=>document.body.classList.contains('bar-folded'))){await page.locator('#barEdit').tap().catch(()=>{});await sleep(200);}
  if(!(await el.isVisible().catch(()=>false))){const more=page.locator('#moreBtn');if(await more.isVisible().catch(()=>false)){await more.tap();await sleep(250);
    const item=page.locator('#moreMenu [data-more="'+sel.replace(/^#/,'')+'"]');if(await item.isVisible().catch(()=>false)){await item.tap();return;}}}
  await el.tap({timeout:8000});
}
/* the workstation's own question box (#cfDlg): wait for it, note it, and tap the button named */
async function answer(titleRe,btnRe,ms){const t=Date.now();
  while(Date.now()-t<(ms||15000)){
    const d=await shell(()=>{const g=document.getElementById('cfDlg');return g&&g.open?{t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent)}:null;}).catch(()=>null);
    if(d&&(!titleRe||titleRe.test(d.t))){DIALOGS.push({step:stepName,t:d.t,b:d.b.slice(0,300),btns:d.btns});
      const i=d.btns.findIndex(x=>btnRe.test(x));if(i<0)throw new Error('no button '+btnRe+' in "'+d.t+'": '+d.btns.join(' | '));
      await page.locator('#cfFoot button').nth(i).tap();await sleep(250);return d;}
    await sleep(150);}
  return null;}
/* any question or notice still open (the shell's #cfDlg or #dlg): noted and closed so the next tap is not blocked */
async function settleDialogs(){for(let k=0;k<6;k++){
  const d=await shell(()=>{const g=document.getElementById('cfDlg');if(g&&g.open)return {k:'cf',t:document.getElementById('cfTitle').textContent,b:document.getElementById('cfBody').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent)};
    const h=document.getElementById('dlg');if(h&&h.open)return {k:'dlg',t:(document.getElementById('dlgTitle')||{}).textContent||'',b:''};return null;}).catch(()=>null);
  if(!d)return;DIALOGS.push({step:stepName,unexpected:true,t:d.t,b:(d.b||'').slice(0,300),btns:d.btns});note('(a notice left open: '+d.t.slice(0,120)+' — closed)');
  if(d.k==='cf'){const i=d.btns.findIndex(x=>/^(OK|Close|Not now|Cancel)$/.test(x));await page.locator('#cfFoot button').nth(i>=0?i:d.btns.length-1).tap().catch(()=>{});}
  else await shell(()=>document.getElementById('dlg').close());await sleep(200);}}
/* open a form from the form list (the Forms button, then the form), and wait until it has answered and, from a case file, been filled */
async function openF(id){await settleDialogs();
  const inList=await page.locator('#rail [data-open="'+id+'"]').isVisible().catch(()=>false);
  if(!inList){await page.locator('#railToggle').tap();await sleep(350);}
  await page.locator('#rail [data-open="'+id+'"]').tap();
  await page.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:45000});
  /* the case reaches a form 1.1 s after it loads (makeFrame): wait for that before reading it */
  await sleep(1400);const fr=frameOf(id);
  await fr.evaluate(()=>{window.__nativeDlg=[];const c=window.confirm;window.confirm=m=>{window.__nativeDlg.push('confirm: '+m);return true;};window.alert=m=>{window.__nativeDlg.push('alert: '+m);};}).catch(()=>{});
  return fr;}
const nativeDlg=async id=>{const fr=frameOf(id);return fr?fr.evaluate(()=>window.__nativeDlg||[]).catch(()=>[]):[];};
/* make a field of a form visible: its sheet chosen with the form's own view buttons, its folded part opened by its summary */
async function reveal(fr,sel){
  const loc=fr.locator(sel).first();
  if(await loc.isVisible().catch(()=>false))return loc;
  if(!(await loc.count()))throw new Error('no field '+sel);
  /* a button folded away under the toolbar's More controls */
  if(await loc.evaluate(e=>!!e.closest('.toolbar')&&document.documentElement.classList.contains('nbh-compact'))){await fr.evaluate(()=>window.scrollTo(0,0));await fr.locator('#nbhMoreBtn').tap();await sleep(300);if(await loc.isVisible().catch(()=>false))return loc;}
  const sum=await loc.evaluate(e=>{const L=[];let d=e.closest('details');while(d){if(!d.open)L.unshift(d);d=d.parentElement&&d.parentElement.closest('details');}L.forEach((d,i)=>d.setAttribute('data-sj-open',String(i)));return L.length;});
  for(let i=0;i<sum;i++){await fr.locator('details[data-sj-open="'+i+'"] > summary').first().click().catch(()=>{});await sleep(120);}
  if(await loc.isVisible().catch(()=>false))return loc;
  const views=await fr.$$('#viewSeg button[data-view], nav.nbh-tabs [data-tab], .tabs button[data-tab], [role=tablist] [role=tab]');
  for(const v of views){if(!(await v.isVisible().catch(()=>false)))continue;await v.click().catch(()=>{});await sleep(250);if(await loc.isVisible().catch(()=>false))return loc;
    const s2=await loc.evaluate(e=>{const d=e.closest('details');if(d&&!d.open){d.setAttribute('data-sj-open','x');return true;}return false;});
    if(s2){await fr.locator('details[data-sj-open="x"] > summary').first().click().catch(()=>{});await sleep(150);await fr.locator('details[data-sj-open="x"]').first().evaluate(d=>d.removeAttribute('data-sj-open')).catch(()=>{});if(await loc.isVisible().catch(()=>false))return loc;}}
  await loc.scrollIntoViewIfNeeded().catch(()=>{});
  if(await loc.isVisible().catch(()=>false))return loc;
  throw new Error('field '+sel+' could not be shown');}
/* type into one field (or choose, or tick), the way a person does: focus, type, leave the field */
async function put(fr,sel,val){if(process.env.TRACE)console.log('  put '+sel+' = '+String(val).slice(0,40));
  const loc=await reveal(fr,sel);
  const kind=await loc.evaluate(e=>e.tagName==='SELECT'?'select':(e.type==='checkbox'||e.type==='radio')?e.type:e.type==='date'?'date':'text');
  if(kind==='select'){const opts=await loc.evaluate(e=>[...e.options].map(o=>[o.value,o.textContent.trim()]));
    const o=opts.find(x=>x[0]===val)||opts.find(x=>x[1]===val)||opts.find(x=>x[1].toLowerCase().startsWith(String(val).toLowerCase()));
    if(!o)throw new Error(sel+': no option '+val+' in '+opts.map(x=>x[1]).join('|'));await loc.selectOption(o[0]);}
  else if(kind==='checkbox'){if(val)await loc.check();else await loc.uncheck();}
  else if(kind==='radio'){await loc.check();}
  else{await loc.fill(String(val));await loc.press('Tab').catch(()=>{});}
  await sleep(40);}
async function putAll(fr,o){for(const k of Object.keys(o)){const sel=/^[#\[.]/.test(k)?k:'[name="'+k+'"]';await put(fr,sel,o[k]);}}
async function tapIn(fr,sel){if(process.env.TRACE)console.log('  tap '+sel);const loc=await reveal(fr,sel);await loc.tap();await sleep(250);}
const val=(fr,sel)=>fr.evaluate(s=>{const e=document.querySelector(s);return e?(e.type==='checkbox'||e.type==='radio'?e.checked:e.value):null;},sel);
const factsOut=fr=>fr.evaluate(()=>{try{return window.__nbhFactsOut?window.__nbhFactsOut():null;}catch(e){return {err:String(e)};}});
const facts=async()=>{await shell(()=>gatherFacts(false));return shell(()=>JSON.parse(JSON.stringify(state.facts||{})));};
/* the case as Save case writes it: the downloaded file */
async function saveCaseFile(tag){
  const dl=page.waitForEvent('download',{timeout:90000});
  await tapShell('#saveCase');
  const d=await dl;const f=OUT+'dl/'+pad(DLS.length)+'-'+tag+'-'+d.suggestedFilename();await d.saveAs(f);DLS.push(f);
  /* on an iPad the workstation asks whether the file is in Files */
  await answer(/Case file written|Case saved|Case written/,/It is in Files|^OK$/,20000);
  return f;}
const readCase=f=>JSON.parse(fs.readFileSync(f,'utf8'));
/* Open case has finished: its button is back, and the notice (a box when it is long) answered */
async function caseOpened(){await page.waitForFunction(()=>$('#openCase').textContent==='Open case'&&!$('#openCase').disabled&&!state.restoring,null,{timeout:60000});
  await answer(/^Case opened/,/^OK$/,2500);await sleep(500);}
/* a case file opened (for a run of only some phases, START_CASE=path) */
async function openCaseFile(f){const fc=page.waitForEvent('filechooser',{timeout:15000});await tapShell('#openCase');const ch=await fc;await ch.setFiles(f);await caseOpened();}
/* ---------------- comparing a case before and after the file ---------------- */
const ownOf=s=>{try{return s&&s.own?JSON.parse(s.own):null;}catch(e){return null;}};
const STAMP=/^(saved|when|at|savedAt|stamp|updated|ts|exported)$/;
function flat(o,p,out){out=out||{};if(o===null||typeof o!=='object'){out[p]=o;return out;}
  if(Array.isArray(o)){if(!o.length)out[p]='[]';o.forEach((v,i)=>flat(v,p+'['+i+']',out));return out;}
  const ks=Object.keys(o);if(!ks.length)out[p]='{}';ks.forEach(k=>{if(STAMP.test(k))return;flat(o[k],p?p+'.'+k:k,out);});return out;}
const blankV=x=>x===undefined||x===''||x===false||x===null||x==='[]'||x==='{}';
/* what a form holds is its own saved file (the snapshot's own) when it has one; else its fields (the snapshot's data).
   Each difference is classed: lost (a value gone), changed (another value), duplicated (a value that was already elsewhere in
   the form appears again), filled (an empty field took a value the case holds: what the case carries when the form loads),
   new (an empty field took a value from nowhere). The fields of the snapshot outside the form's own file (dialogs, the note
   shown, the view) are what is on the screen, not what is kept, and are not compared when the form has its own file. */
function diffSnap(a,b,factsTxt){const oa=ownOf(a),ob=ownOf(b),useOwn=!!(oa&&ob);
  const A=useOwn?flat(oa,'own'):flat((a&&a.data)||{},'data'),B=useOwn?flat(ob,'own'):flat((b&&b.data)||{},'data');
  const before=new Set(Object.values(A).filter(v=>typeof v==='string'&&v.trim().length>3).map(v=>v.trim()));
  const L=[];new Set(Object.keys(A).concat(Object.keys(B))).forEach(k=>{if(!useOwn&&/^data\.~/.test(k))return;const x=A[k],y=B[k];if(blankV(x)&&blankV(y))return;if(String(x)===String(y))return;
    const sv=v=>JSON.stringify(v===undefined?'(none)':v).slice(0,140);let kind;
    if(blankV(y))kind='lost';else if(!blankV(x))kind='changed';
    else if(typeof y==='string'&&before.has(y.trim()))kind='duplicated';
    else if(factsTxt&&typeof y==='string'&&y.trim().length>3&&factsTxt.indexOf(JSON.stringify(y.trim()).slice(1,-1))>=0)kind='filled';else kind='new';
    L.push({kind,t:kind+' '+k+': '+sv(x)+' -> '+sv(y)});});return L;}
const bad=L=>L.filter(x=>x.kind!=='filled');
/* Save case, Close case, Open case from the file, every form opened and saved again: nothing lost or changed */
async function roundTrip(tag){
  const f1=await saveCaseFile(tag+'-a');const c1=readCase(f1);
  const ids=Object.keys(c1.forms);const facts1=await facts();
  /* Close case: it asks, saves again, then clears */
  const dl=page.waitForEvent('download',{timeout:90000});
  await tapShell('#closeCase');await answer(/^Close this case/,/^Save and close/,15000);
  const d2=await dl;const f2=OUT+'dl/'+pad(DLS.length)+'-'+tag+'-close-'+d2.suggestedFilename();await d2.saveAs(f2);DLS.push(f2);
  await answer(/Case file written|Case saved/,/It is in Files|^OK$/,20000);
  await page.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});
  const c2=readCase(f2);
  const d12=ids.map(id=>[id,bad(diffSnap(c1.forms[id].snap,c2.forms[id].snap)).map(x=>x.t).slice(0,4)]).filter(x=>x[1].length);
  ok(tag+': Close case saved the same forms as Save case just before and cleared the workstation',JSON.stringify(Object.keys(c2.forms))===JSON.stringify(ids)&&!d12.length,{ids,c2:Object.keys(c2.forms),d:d12});
  /* Open case: the file chosen in the file picker */
  const fc=page.waitForEvent('filechooser',{timeout:15000});await tapShell('#openCase');const ch=await fc;await ch.setFiles(f2);
  await caseOpened();
  const bar=await shell(()=>packet());
  ok(tag+': the case opens from the file with the student on the bar and every form listed',bar.client===M.client&&bar.sid===M.sid&&await shell(ids=>ids.every(id=>!!(state.frames[id]||state.pending[id])),ids),{bar,ids});
  /* every form opened, as the BCBA would, and its work compared with what the file holds */
  const all={},factsTxt=JSON.stringify(c2.facts||{});
  for(const id of ids){await openF(id);await sleep(400);const g=await shell(id=>grab(id,'snapshot',null,15000),id);
    all[id]=g&&g.snap?diffSnap(c2.forms[id].snap,g.snap,factsTxt):[{kind:'lost',t:'did not answer'}];}
  const f3=await saveCaseFile(tag+'-b');const c3=readCase(f3);
  ids.forEach(id=>{if(!c3.forms[id])all[id].push({kind:'lost',t:'not in the next Save case'});else if(!all[id].length)all[id]=diffSnap(c2.forms[id].snap,c3.forms[id].snap,factsTxt).map(x=>({kind:x.kind,t:'(saved again) '+x.t}));});
  fs.writeFileSync(OUT+'diff-'+tag+'.json',JSON.stringify(all,null,1));
  const diffs={},fills={};ids.forEach(id=>{const B=bad(all[id]);if(B.length)diffs[id]=B.map(x=>x.t);const F=all[id].filter(x=>x.kind==='filled');if(F.length)fills[id]=F.map(x=>x.t);});
  if(Object.keys(fills).length)note(tag+': filled from the case as the forms opened again (not counted as changes): '+JSON.stringify(fills).slice(0,600));
  ok(tag+': every form ('+ids.join(', ')+') holds after the file exactly what it held before',!Object.keys(diffs).length,diffs);
  /* compared without regard to the order of the keys (a form's entry read again goes to the end of its object) */
  const canon=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'):JSON.stringify(v);
  const facts3=await facts();const fd=Object.keys(Object.assign({},facts1,facts3)).filter(k=>!/^(when|src)$/.test(k)&&canon(facts1[k])!==canon(facts3[k]));
  const fdiff=k=>{const A=flat(facts1[k]||{},k),B=flat(facts3[k]||{},k);return Object.keys(Object.assign({},A,B)).filter(x=>String(A[x])!==String(B[x])).slice(0,6).map(x=>x+': '+String(JSON.stringify(A[x])).slice(0,120)+' -> '+String(JSON.stringify(B[x])).slice(0,120));};
  ok(tag+': the case facts are the same after the file',!fd.length,fd.map(k=>[k,fdiff(k)]));
  return {f1,f2,f3,diffs};}
/* nothing of one student in the other's */
function marksIn(text,marks){return marks.filter(re=>re.test(text)).map(String);}

/* =============================== the phases =============================== */
const PH={};
/* A: the student on the bar; DM-1, IC-1, RR-1 */
PH.A=async()=>{
  await page.locator('#pClient').fill(M.client);await page.locator('#pSid').fill(M.sid);await page.locator('#pGrade').fill(M.grade);
  await page.locator('#pSite').fill(M.site);await page.locator('#pBcba').fill(M.bcba);await page.locator('#pBcba').press('Tab');
  const dm=await openF('DM-1');
  ok('A1 DM-1 opens with the student from the bar in its empty fields',await val(dm,'[name="s.sid"]')===M.sid&&/Royal Palm/.test(await val(dm,'[name="s.school"]')),{sid:await val(dm,'[name="s.sid"]'),school:await val(dm,'[name="s.school"]'),first:await val(dm,'[name="s.first"]'),last:await val(dm,'[name="s.last"]')});
  await putAll(dm,{'s.last':M.last,'s.first':M.first,'s.dob':M.dob,'s.grade':M.grade,'s.room':'Room 14, Ms. Lopez (simulated)','s.lang':'Spanish and English','s.interp':'No','s.photo':'No',
    'c[0].name':'Ana Rivera (simulated)','c[0].rel':'Mother','c[0].phone':'(000) 555-0101','c[0].email':'ana.rivera.sim@example.org',
    'pf.strengths':'Kind to younger students, loves building with blocks, strong visual memory (simulated).','pf.interests':'Trains, drawing, the class computer, helping the custodian','pf.expr':'Full sentences; shuts down when upset',
    'pf.helps':'A two-minute warning before transitions; a first-then card','pf.avoid':'Being called out in front of peers','sf.agg':true,'sf.elope':true,
    'p.elig':'Emotional/Behavioral Disability','p.iepdate':D.referral,'p.annual':iso(day(150)),'p.reeval':iso(day(400)),
    'p.svcmin':'120','p.svcper':'month','p.svckind':'consult','p.svcnote':'Behavior consultation to the classroom team (simulated)','p.crisis':'No'});
  await sleep(600);const fo=await factsOut(dm);const pf=(fo&&fo.profile)||{};
  ok('A2 DM-1 gives the case the profile: strengths, the IEP’s 120 minutes a month of consultation, the dates, the safety flags',pf.services&&pf.services.minutes===120&&pf.services.per==='month'&&pf.services.kind==='consult'&&/blocks/.test(pf.strengths||'')&&pf.dates&&pf.dates.iep===iso(day(150))&&pf.flags&&pf.flags.safety.join()==='Elopement,Aggression',pf);
  const ic=await openF('IC-1');
  ok('A3 IC-1 opens with the student filled from the bar',await val(ic,'#cClient')===M.client&&await val(ic,'#cId')===M.sid,{c:await val(ic,'#cClient')});
  await putAll(ic,{'#cDob':M.dob,'#cParent':'Ana Rivera (simulated)','#cBcba':M.bcba,'#cNotice':D.referral,
    'c.behav':'Hitting peers during independent work; leaving the classroom without permission (simulated).','c.why':'The current supports have not reduced the behavior; the IEP team asked for an FBA (simulated).',
    'p.records':true,'p.indirect':true,'p.abc':true,'p.scatter':true,'p.daily':true,'p.pref':true,'p.bip':true,
    'c.who':'J. Ellis, BCBA, with the classroom teacher','c.where':'Room 14, the hallway, the cafeteria','c.start':D.consent,'c.dur':'4',
    '[name="c.decision"][value="yes"]':true,'#cMethod':'sign','#cDate':D.consent,'#sParName':'Ana Rivera (simulated)','#sParRel':'Parent','#sParDate':D.consent});
  await sleep(500);const icf=await factsOut(ic);
  ok('A4 IC-1 gives the consent date',icf&&icf.consent&&icf.consent.date===D.consent&&icf.consent.parent===D.consent,icf);
  const rr=await openF('RR-1');
  await putAll(rr,{'#hDob':M.dob,'#hStart':D.records,'#hEnd':D.records,'#hReason':'Hitting and leaving the room; the team asked for an FBA (simulated)'});
  /* the consent reaches the case once IC-1 next reports (its status, every few seconds), then the open forms */
  await rr.waitForFunction(d=>{const e=document.getElementById('hConsent');return e&&e.value===d;},D.consent,{timeout:12000}).catch(()=>{});
  ok('A5 RR-1 takes the consent date from IC-1 (the case) while it is empty',await val(rr,'#hConsent')===D.consent,await val(rr,'#hConsent'));
  /* one removal: a day of in-school suspension, counted */
  await tapIn(rr,'#rlAdd');
  const row=rr.locator('#rlRows .rl-row').last();
  await row.locator('[data-k="s"]').fill(D.obs1);await row.locator('[data-k="s"]').press('Tab');
  const tOpts=await row.locator('[data-k="t"]').evaluate(e=>[...e.options].map(o=>o.value+'='+o.textContent));
  const oss=tOpts.find(x=>/out-of-school/i.test(x));await row.locator('[data-k="t"]').selectOption(oss.split('=')[0]);
  const cOpts=await row.locator('[data-k="c"]').evaluate(e=>[...e.options].map(o=>o.value+'='+o.textContent));
  await row.locator('[data-k="c"]').selectOption(cOpts.find(x=>/^[^=]*=Counted|=Yes|counted/i.test(x)).split('=')[0]);await sleep(500);
  const rrf=await factsOut(rr);
  ok('A6 RR-1 gives the case one day of removal this school year',rrf&&rrf.records&&rrf.records.removals&&rrf.records.removals.days===1,{rrf,tOpts,cOpts});
};
/* the round trip after the intake */
PH.R1=async()=>{await roundTrip('R1');};
/* B: TB-1, the targets, defined once and sent to the case */
const TGT=[{lab:'Hitting peers',def:'Striking a peer with an open or closed hand, or with an object held in the hand, with enough force to be heard or to move the peer (simulated).',
    ex:'Slapping a classmate’s arm during independent math.\nHitting a peer’s back with a pencil box.',nex:'High fives.\nAccidental contact while lining up.',unit:'Each strike = 1; a new episode after 10 s without a strike',dim:'Count / rate'},
  {lab:'Leaving the classroom',def:'Passing the classroom door without an adult’s permission (simulated).',ex:'Walking out during a writing task.\nRunning into the hallway when told to clean up.',
    nex:'Going to the restroom with the pass.\nLeaving with the class.',unit:'Each exit = 1',dim:'Count / rate'},
  {lab:'Asking for a break',def:'Saying “break, please” or handing the break card to an adult (simulated).',ex:'Handing the card to Ms. Lopez during math.',nex:'Leaving without asking.',unit:'Each request = 1',dim:'Count / rate'}];
PH.B=async()=>{
  const tb=await openF('TB-1');
  ok('B1 TB-1 opens with the student from the bar',await val(tb,'#mClient')===M.client,await val(tb,'#mClient'));
  await putAll(tb,{'#mDob':mdy(M.dob),'#mAuthor':M.bcba,'m.team':'Classroom teacher Ms. Lopez (simulated), paraprofessional Mr. Okafor (simulated), parent'});
  const cands=[[TGT[0].lab,'Teacher','6','3','Target – single topography'],[TGT[1].lab,'Teacher, para','2','3','Target – single topography'],['Calling out in class','Teacher','15','1','Monitor only'],[TGT[2].lab,'BCBA','','1','Target – replacement']];
  const have=await tb.evaluate(()=>document.querySelectorAll('#candBody tr').length);for(let i=have;i<cands.length;i++)await tapIn(tb,'#addCand');
  for(let i=0;i<cands.length;i++){const c=cands[i];await putAll(tb,{['cand['+i+'].beh']:c[0],['cand['+i+'].by']:c[1],['cand['+i+'].urg']:c[3],['cand['+i+'].dec']:c[4]});if(c[2])await put(tb,'[name="cand['+i+'].rate"]',c[2]);}
  await tapIn(tb,'#selFromCand');
  const sel=await tb.evaluate(()=>[0,1,2,3].map(i=>{const e=document.querySelector('[name="sel['+i+'].lab"]');return e?e.value:null;}));
  ok('B2 Take the candidates marked Target: the two targets and the replacement go to the selected targets, the one to monitor does not',sel[0]===TGT[0].lab&&sel[1]===TGT[1].lab&&sel[2]===TGT[2].lab&&!sel[3],sel);
  for(let i=0;i<3;i++){const t=TGT[i];await putAll(tb,{['tgt['+i+'].def']:t.def,['tgt['+i+'].ex']:t.ex,['tgt['+i+'].nex']:t.nex,['tgt['+i+'].unit']:t.unit,['tgt['+i+'].dim']:t.dim,['tgt['+i+'].ctx']:'Room 14, the hallway and the cafeteria'});
    if(i<2)await put(tb,'[name="tgt['+i+'].rep"]',TGT[2].lab);}
  const card=await tb.evaluate(()=>[0,1,2].map(i=>({lab:document.querySelector('[name="tgt['+i+'].lab"]').value,type:document.querySelector('[name="tgt['+i+'].type"]').value})));
  ok('B3 each card on the Definitions sheet took its label and type from the selection',card[0].lab===TGT[0].lab&&card[1].lab===TGT[1].lab&&card[2].lab===TGT[2].lab&&/Replacement/.test(card[2].type),card);
  await tapIn(tb,'#sendTgt');await sleep(1500);
  const f=await facts();const B=(f.behaviors||[]).map(b=>b.label+(b.isRep?' (replacement)':''));
  ok('B4 Send the targets: the case holds the two targets and the replacement, each with its definition',B.join('|')===TGT[0].lab+'|'+TGT[1].lab+'|'+TGT[2].lab+' (replacement)'&&f.behaviors[0].def===TGT[0].def&&f.src.behaviors==='TB-1',{B,src:f.src});
};
/* C: IN-1 and IA-1 sent to two staff through the school Gmail; the staff answer from their emails; the replies placed */
const linksOf=t=>(String(t||'').match(/https?:\/\/\S+respond\.html#\S+/g)||[]);
async function staffPage(){const c=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3,userAgent:IPHONE_UA,serviceWorkers:'block'});const p=await c.newPage();
  p.on('pageerror',e=>ERRS.push({step:stepName,where:'staff phone',text:String(e.message||e).slice(0,400)}));p.on('dialog',d=>{DIALOGS.push({step:stepName,native:d.type(),where:'staff phone',t:d.message().slice(0,200)});d.accept().catch(()=>{});});return {c,p};}
/* a staff member answers a respondent page by touch: a choice for each item, the confirmation, written answers, Send */
async function staffAnswer(p,url,pick,text){await p.goto(url,{waitUntil:'load'});await sleep(800);
  const info=await p.evaluate(()=>{const g=document.querySelectorAll('.grid2 input[type=text]');return {name:g[0]&&g[0].value,ro:g[0]&&g[0].readOnly,items:document.querySelectorAll('li.it').length,def:(document.querySelector('.def')||{}).textContent||'',title:document.title};});
  const items=await p.$$('li.it');for(let i=0;i<items.length;i++){const v=pick(i);const r=await items[i].$('input[value="'+v+'"]');if(r){await r.scrollIntoViewIfNeeded();await r.tap();}}
  const c=await p.$('input[name=nbhr-confirm][value=yes]');if(c){await c.scrollIntoViewIfNeeded();await c.tap();}
  const ts=await p.$$('textarea:not(.code)');for(let i=0;i<ts.length;i++){if(!(await ts[i].isVisible()))continue;await ts[i].scrollIntoViewIfNeeded();await ts[i].tap();await ts[i].fill(text+' ('+(i+1)+')');}
  const send=p.locator('button:not(.ghost)').first();await send.scrollIntoViewIfNeeded();await send.tap();await sleep(1800);
  info.done=await p.evaluate(()=>(document.querySelector('#nbhr-done')||{}).innerHTML||'');return info;}
const FAST_A=i=>['Y','Y','N','Y','N','N','Y','N','N','N','N','N','N','N','N','N'][i%16],FAST_B=i=>['Y','N','N','Y','N','N','Y','N','Y','N','N','N','N','N','N','N'][i%16];
PH.C=async()=>{
  /* IN-1: the interviews, a respondent page for each staff member, sent from the school account */
  const inn=await openF('IN-1');
  ok('C1 IN-1 opens with the student from the bar and the target behavior from TB-1',await val(inn,'[data-m="client"]')===M.client&&new RegExp(TGT[0].lab).test(await val(inn,'[data-m="beh"]')||''),{client:await val(inn,'[data-m="client"]'),beh:await val(inn,'[data-m="beh"]')});
  await putAll(inn,{'[data-m="bcba"]':M.bcba,'[data-m="email"]':M.email});
  await tapIn(inn,'#rpBtn');await sleep(400);
  await put(inn,'#rbBox',BOXURL);await inn.locator('#rbBox').evaluate(e=>e.dispatchEvent(new Event('change',{bubbles:true})));await sleep(900);
  for(const s of STAFF){await tapIn(inn,'#rbAdd');const tr=inn.locator('#rbRows tr[data-id]').last();
    for(const [k,v] of [['name',s.name],['role',s.role],['email',s.email]]){const el=tr.locator('[data-f="'+k+'"]');const tag=await el.evaluate(e=>e.tagName);if(tag==='SELECT'){const o=await el.evaluate((e,v)=>{const x=[...e.options].find(o=>o.value===v||o.textContent.trim()===v||new RegExp(v.split(' ')[0],'i').test(o.textContent));return x?x.value:null;},v);if(o!==null)await el.selectOption(o);}else{await el.fill(v);await el.press('Tab');}}}
  const n0=MAILS.length;
  await tapIn(inn,'#rbSendAll');
  const d1=await answer(/^Send \d+ emails? from your school account/,/^Sign in and send$|^Send$/,15000);
  for(let i=0;i<40&&MAILS.length<n0+2;i++)await sleep(250);await sleep(1200);
  const m1=MAILS.slice(n0);
  ok('C2 IN-1: Email everyone not sent yet goes through the workstation: it names both staff, signs in to the school account and sends one email each, from the BCBA’s address, each with its own link',!!d1&&/Ms\. Lopez/.test(d1.b)&&/Mr\. Okafor/.test(d1.b)&&m1.length===2&&m1.every(m=>new RegExp('^From: '+M.email.replace(/\./g,'\\.'),'m').test(m.raw)&&linksOf(m.body).length===1)&&/lopez\.sim@/.test(m1[0].raw)&&/okafor\.sim@/.test(m1[1].raw),{d1,n:m1.length,raw:m1.map(m=>m.raw.slice(0,300))});
  const leak=m1.map(m=>m.raw+m.body).filter(t=>/4471823|Rivera/.test(t));
  ok('C3 the emails name the student by first name and last initial only (no ID, no last name)',!leak.length&&m1.every(m=>/Mateo R\./.test(m.raw+m.body)),{leak:leak.map(t=>t.slice(0,300))});
  await inn.evaluate(()=>{const d=document.querySelector('dialog.nbh-mail[open]');if(d)d.close();const r=document.getElementById('rpDlg');if(r&&r.open)r.close();});
  /* the staff answer from the links in their emails, on their phones */
  const {c:sc,p:sp}=await staffPage();
  const a1=await staffAnswer(sp,linksOf(m1[0].body)[0],()=>'',`Mostly during independent math, when the work is hard (Ms. Lopez, simulated)`);
  const a2=await staffAnswer(sp,linksOf(m1[1].body)[0],()=>'',`At transitions and when asked to write (Mr. Okafor, simulated)`);
  ok('C4 each staff member’s interview page opens from the email with the name filled and locked, and ends at Sent.',a1.name===STAFF[0].name&&a1.ro&&/<b>Sent\.<\/b>/.test(a1.done)&&a2.name===STAFF[1].name&&/<b>Sent\.<\/b>/.test(a2.done),{a1,a2});
  /* IA-1: the FAST for each target to both staff */
  const ia=await openF('IA-1');
  await ia.waitForFunction(()=>window.__rp&&__rp.targets&&__rp.targets().list.filter(x=>x.label).length>=2,null,{timeout:10000}).catch(()=>{});
  const t0=await ia.evaluate(()=>({beh:document.querySelector('[name="m.beh"]').value,list:(window.__rp&&__rp.targets?__rp.targets().list.map(x=>x.label):[])}));
  ok('C5 IA-1 opens with the targets from TB-1 as its targets (the replacement left out)',t0.list.join('|')===TGT[0].lab+'|'+TGT[1].lab&&t0.beh===TGT[0].lab,t0);
  await putAll(ia,{'#mEmail':M.email,'#mAssessor':M.bcba,'#mDob':mdy(M.dob)});
  for(let i=0;i<2;i++)await putAll(ia,{['inf['+i+'].name']:STAFF[i].name,['inf['+i+'].role']:STAFF[i].role,['inf['+i+'].email']:STAFF[i].email,['inf['+i+'].mo']:'2',['inf['+i+'].daily']:'Yes'});
  await tapIn(ia,'#rpBtn');await sleep(400);await put(ia,'#rpBox',BOXURL);await ia.locator('#rpBox').evaluate(e=>e.dispatchEvent(new Event('change',{bubbles:true})));await sleep(900);
  await ia.evaluate(()=>{const r=document.getElementById('rpDlg');if(r&&r.open)r.close();});
  await tapIn(ia,'#viewSeg button[data-view="outs"]');
  const plan=await ia.$$('#outPlan [data-oi]');for(const c of plan){const k=await c.getAttribute('data-oi');if((await c.isChecked())!==(k==='fast'))await c.tap();}
  await tapIn(ia,'#outPlanBtn');await sleep(500);
  const rows=await ia.evaluate(()=>__rp.outs().map(o=>o.inf+'/'+o.inst));
  ok('C6 Plan the send-outs: a FAST row for each target and each informant',rows.filter(r=>/^[AB]\/fast$/.test(r)).length===4,rows);
  const n1=MAILS.length;await tapIn(ia,'#outSendDue');
  const d2=await answer(/^Send \d+ emails? from your school account/,/^Sign in and send$|^Send$/,15000);
  for(let i=0;i<40&&MAILS.length<n1+2;i++)await sleep(250);await sleep(1200);
  const m2=MAILS.slice(n1);const L=m2.map(m=>linksOf(m.body));
  ok('C7 IA-1: Send all due now sends one email to each staff member, each with a link per target',!!d2&&m2.length===2&&L.every(x=>x.length===2)&&/Hello Ms\. Lopez/.test(m2[0].body),{d2,n:m2.length,links:L.map(x=>x.length),body:m2[0]&&m2[0].body.slice(0,500)});
  await ia.evaluate(()=>{const d=document.querySelector('dialog.nbh-mail[open]');if(d)d.close();});
  const ans=[];for(let k=0;k<2;k++)for(const u of L[k]||[])ans.push(await staffAnswer(sp,u,k?FAST_B:FAST_A,'During independent work'));
  ok('C8 the staff answer the four FAST pages from their emails: Sent. on each',ans.length===4&&ans.every(a=>/<b>Sent\.<\/b>/.test(a.done)&&a.items>=16),ans.map(a=>({n:a.name,i:a.items,d:a.done.slice(0,40)})));
  await sc.close();
  /* the replies collected in the forms, the case open */
  await tapIn(ia,'#outCollectBtn');await sleep(2500);await settleDialogs();
  const got=await ia.evaluate(()=>{const T=__rp.targets();return {rows:__rp.outs().map(o=>o.inf+'/'+o.inst+'/'+((T.list.find(x=>x.id===o.tgt)||{}).label)+'/'+(o.placed?'placed':o.sent?'sent':'-')),
    a:[1,2,3,4].map(i=>(document.querySelector('[name="fast[0]['+i+']"]')||{}).value),b:[1,2,3,4].map(i=>(document.querySelector('[name="fast[1]['+i+']"]')||{}).value)};});
  ok('C9 IA-1 Collect: the four FAST replies placed, Ms. Lopez in column A and Mr. Okafor in B, each under its target',got.rows.filter(r=>/placed$/.test(r)).length===4&&got.a.join()===[0,1,2,3].map(FAST_A).join()&&got.b.join()===[0,1,2,3].map(FAST_B).join(),got);
  await put(ia,'#mFn','escape');
  const inn2=await openF('IN-1');await tapIn(inn2,'#rcBtn');await sleep(300);await tapIn(inn2,'#rbCollect');await sleep(2500);await settleDialogs();
  await inn2.evaluate(()=>{const d=document.querySelector('dialog.nbh-mail[open]');if(d)d.close();document.querySelectorAll('dialog[open]').forEach(x=>x.close());});
  const ir=await inn2.evaluate(()=>({resp:S.resp.map(r=>r.n+'/'+r.role),ans:S.resp.map((r,i)=>Object.keys(S.ans).filter(k=>k.indexOf(i+'_')===0).length)}));
  ok('C10 IN-1 Collect: both interviews placed as respondents with their answers',ir.resp.some(x=>/Lopez/.test(x))&&ir.resp.some(x=>/Okafor/.test(x))&&ir.ans.filter(n=>n>0).length>=2,ir);
  await put(inn2,'[data-m="fn"]','escape');await put(inn2,'[data-m="hyp"]','Both staff describe hitting and leaving during hard independent work: escape from the task (simulated).');
  await sleep(800);const f=await facts();const ev=f.evidence||{};
  ok('C11 the case holds IA-1’s and IN-1’s results as evidence, and the replies per form',ev['IA-1']&&ev['IA-1'].fnKey==='escape'&&ev['IN-1']&&f.replies&&f.replies['IA-1']&&f.replies['IA-1'].placed===4,{ev:Object.keys(ev).map(k=>k+':'+ev[k].fnKey),rep:f.replies});
};

/* D: observe and measure: OB-1, ABC-1, SP-1, and DD-1's baseline */
const BASE_DAYS=SD.slice(8,16);         /* eight school days of baseline */
const BASE_HIT=[5,4,6,3,5,6,4,5],BASE_LEAVE=[2,1,2,2,1,3,2,2],BASE_ASK=[0,0,1,0,0,0,1,0];
async function ddRows(dd,days,vals,opt){opt=opt||{};
  await tapIn(dd,'#viewSeg button[data-view="data"]');
  const have=await dd.evaluate(()=>S.rows.map(r=>r.date));const need=days.filter(d=>!have.includes(d));
  if(need.length){await put(dd,'#d_wkd',true);await put(dd,'#d_start',need[0]);await put(dd,'#d_count',String(need.length));await tapIn(dd,'#btnAddDays');await sleep(600);}
  const ids=await dd.evaluate(()=>S.behaviors.map(b=>b.id));
  for(let k=0;k<days.length;k++){const lab=await dd.evaluate(d=>{const r=S.rows.find(x=>x.date===d);if(!r)return null;const e=document.querySelector('[data-f="date"]');const all=[...document.querySelectorAll('input[data-f="date"]')];const i=all.findIndex(x=>x.value===d);return i;},days[k]);
    if(lab===null||lab<0)throw new Error('DD-1 has no row for '+days[k]);
    const row=dd.locator('input[data-f="date"]').nth(lab).locator('xpath=ancestor::tr[1]');
    for(let b=0;b<vals.length;b++){if(vals[b][k]===undefined||vals[b][k]===null)continue;const c=row.locator('input[data-v="'+ids[b]+'"]');await c.scrollIntoViewIfNeeded();await c.tap();await c.fill(String(vals[b][k]));await c.press('Tab');}
    if(opt.phaseAt===k){await row.locator('select[data-f="phaseType"]').selectOption({index:1});await sleep(150);const pl=row.locator('input[data-f="phaseLabel"]');await pl.fill(opt.phaseLabel);await pl.press('Tab');}}
  await sleep(500);}
PH.D=async()=>{
  /* OB-1: three observations */
  const ob=await openF('OB-1');
  const ob0=await ob.evaluate(()=>({client:state.meta.client,beh:state.meta.behavior,def:state.meta.definition}));
  ok('D1 OB-1 opens with the student and TB-1’s first target with its definition',ob0.client===M.client&&new RegExp(TGT[0].lab).test(ob0.beh||'')&&/Striking a peer/.test((ob0.beh||'')+(ob0.def||'')),ob0);
  await putAll(ob,{'#mObserver':M.bcba,'#mRole':'BCBA','#mTeacher':'Ms. Lopez (simulated)','[data-meta="question"]':'Whether hitting follows hard independent work and ends it (simulated).'});
  const OBS=[[D.obs1,'09:30','10:15','Room 14','Independent math',3,0,['demand','difficult'],['escape','redirect']],[D.obs2,'10:00','10:40','Room 14','Writing',2,0,['demand'],['escape']],[D.obs3,'12:30','13:00','Cafeteria','Lunch',0,1,['unstruct'],['none']]];
  for(let i=0;i<OBS.length;i++){const o=OBS[i];if(i>0){const n=await ob.evaluate(()=>state.obs.length);if(n<=i)await tapIn(ob,'#addObs');}
    await putAll(ob,{['#o'+i+'date']:o[0],['#o'+i+'start']:o[1],['#o'+i+'end']:o[2],['#o'+i+'setting']:o[3],['#o'+i+'activity']:o[4]});
    await put(ob,'[data-obs="'+i+'"][data-field="count"]',String(o[5]));await put(ob,'[data-obs="'+i+'"][data-field="peerCount"]',String(o[6]));
    for(const a of o[7])await put(ob,'[data-obs="'+i+'"][data-group="ante"][data-key="'+a+'"]',true);for(const c of o[8])await put(ob,'[data-obs="'+i+'"][data-group="cons"][data-key="'+c+'"]',true);}
  await tapIn(ob,'#viewSeg button[data-view="summary"]');await tapIn(ob,'#draftBtn');await sleep(500);
  const obe=(await factsOut(ob)||{}).evidence||{};
  ok('D2 OB-1: three observations; Draft gives the statement; the evidence reads escape',obe.n===3&&obe.fnKey==='escape'&&(obe.statement||'').length>20,obe);
  /* ABC-1: five incidents recorded with the form's own buttons */
  const abc=await openF('ABC-1');
  await putAll(abc,{'#h-observer':'Ms. Lopez (simulated)','#h-location':'Room 14','#h-start':D.obs1,'#h-end':D.obs3});
  const INC=[[D.obs1,'09:40','a-a_acad','b-b_agg_peer','c-c_dem_rem'],[D.obs1,'10:05','a-a_difficult','b-b_agg_peer','c-c_dem_rem'],[D.obs2,'10:12','a-a_acad','b-b_elope','c-c_dem_rem'],[D.obs2,'10:30','a-a_trans','b-b_agg_peer','c-c_reprimand'],[D.obs3,'09:50','a-a_acad','b-b_agg_peer','c-c_dem_rem']];
  for(const x of INC){await tapIn(abc,'#viewSeg button[data-view="record"]');await putAll(abc,{'#e-date':x[0],'#e-time':x[1],'#e-dur':'2','#e-activity':'Independent work',['#'+x[2]]:true,['#'+x[3]]:true,['#'+x[4]]:true});
    await put(abc,'#e-narrative','Asked to start the worksheet; hit the peer beside him; the worksheet was taken away (simulated).');await tapIn(abc,'#save-entry');await sleep(300);await settleDialogs();}
  const ab=await abc.evaluate(()=>({n:state.entries.length,client:state.header.client}));const abe=(await factsOut(abc)||{}).evidence||{};
  ok('D3 ABC-1: five incidents saved with Save incident; the evidence reads escape',ab.n===5&&ab.client===M.client&&abe.fnKey==='escape',{ab,abe});
  /* SP-1: one week, marks tapped in the grid */
  const sp=await openF('SP-1');
  const wk=SD.slice(3,8);   /* a school week (Monday to Friday if the calendar allows) */
  await putAll(sp,{'#mObserver':'Ms. Lopez (simulated)','#mWeek':mdy(wk[0])+' – '+mdy(wk[4]),'#mSetting':'Room 14'});
  for(const d of wk){const wd=new Date(d+'T12:00:00').getDay();await put(sp,'[name="sp.date.'+wd+'"]',d);}
  const cols=wk.map(d=>new Date(d+'T12:00:00').getDay());
  for(const c of cols)for(const r of [5,6]){const b=sp.locator('button.cell[data-r="'+r+'"][data-c="'+c+'"]');await b.scrollIntoViewIfNeeded();await b.tap();await sleep(60);}
  await sleep(500);const spe=(await factsOut(sp)||{}).evidence||{};
  ok('D4 SP-1: ten marks tapped; the pattern names the heaviest interval',spe.n>=1&&/Heaviest interval/.test(spe.statement||''),spe);
  /* DD-1: the targets from TB-1, the baseline typed day by day */
  const dd=await openF('DD-1');
  const db=await dd.evaluate(()=>({b:S.behaviors.map(b=>b.name+'/'+b.kind),client:S.meta.client}));
  ok('D5 DD-1 opens with TB-1’s targets as its behaviors (the replacement as a replacement behavior) and the student',db.b.join('|')===TGT[0].lab+'/target|'+TGT[1].lab+'/target|'+TGT[2].lab+'/replacement'&&db.client===M.client,db);
  await tapIn(dd,'#viewSeg button[data-view="setup"]');await putAll(dd,{'#m_observer':'Ms. Lopez (simulated)','#m_analyst':M.bcba,'#m_baseline':'Baseline'});
  await ddRows(dd,BASE_DAYS,[BASE_HIT,BASE_LEAVE,BASE_ASK]);
  const dv=await dd.evaluate(ids=>S.rows.map(r=>r.date+':'+S.behaviors.map(b=>r.values[b.id]).join(',')),null);
  ok('D6 DD-1: eight days of baseline typed into the sheet',dv.length===8&&dv[0]===BASE_DAYS[0]+':'+BASE_HIT[0]+','+BASE_LEAVE[0]+','+BASE_ASK[0]&&dv[7]===BASE_DAYS[7]+':'+BASE_HIT[7]+','+BASE_LEAVE[7]+','+BASE_ASK[7],dv);
  /* v22.13: DD-1 shares its record a moment after the last entry; read the case until it is there (up to 10 s), not once */
  let f={};for(let i=0;i<20;i++){f=await facts();if(f.data&&f.data.to===BASE_DAYS[7])break;await sleep(500);}
  const fd=f.data||{},hit=(fd.behaviors||[]).find(b=>b.name===TGT[0].lab)||{};
  ok('D7 the case holds DD-1’s record: the dates, and the baseline mean of hitting',fd.from===BASE_DAYS[0]&&fd.to===BASE_DAYS[7]&&Math.abs((hit.base&&hit.base.mean!=null?hit.base.mean:hit.mean)-4.75)<0.06,{from:fd.from,to:fd.to,hit});
  const ev=Object.keys(f.evidence||{}).sort().join(',');
  ok('D8 the case holds the evidence of IA-1, IN-1, OB-1, ABC-1 and SP-1',ev==='ABC-1,IA-1,IN-1,OB-1,SP-1',ev);
};
PH.R2=async()=>{await roundTrip('R2');};
/* E: halfway, a second simulated student; then back to Mateo. Neither may appear in the other's forms, Today, packet or files */
async function caseText(){const ids=await shell(()=>[...new Set(Object.keys(state.frames).concat(Object.keys(state.pending)))]);let t='';
  for(const id of ids){const g=await shell(id=>state.pending[id]?{snap:state.pending[id].snap}:grab(id,'snapshot',null,15000),id);t+='\n'+id+': '+JSON.stringify(g&&g.snap||{});}return {ids,t};}
async function todayText(){await tapShell('#todayBtn');await page.waitForFunction(()=>document.getElementById('dlg').open&&/Today/.test((document.getElementById('dlgTitle')||{}).textContent||''),null,{timeout:15000});await sleep(600);
  const t=await shell(()=>document.getElementById('dlgBody').innerText);return t;}
async function savePacketFile(tag){const dl=page.waitForEvent('download',{timeout:20000}).catch(()=>null);await tapShell('#savePacket');const d=await dl;if(!d)return null;
  const f=OUT+'dl/'+pad(DLS.length)+'-'+tag+'-'+d.suggestedFilename();await d.saveAs(f);DLS.push(f);await answer(/./,/^OK$|It is in Files/,1500).catch(()=>{});return f;}
const closeDlg=()=>shell(()=>{const d=document.getElementById('dlg');if(d&&d.open)d.close();});
PH.E=async()=>{
  /* Mateo's case closed (saved first) */
  const dl=page.waitForEvent('download',{timeout:90000});await tapShell('#closeCase');await answer(/^Close this case/,/^Save and close/,15000);
  const d=await dl;const fM=OUT+'dl/'+pad(DLS.length)+'-E-mateo-'+d.suggestedFilename();await d.saveAs(fM);DLS.push(fM);await answer(/Case file written/,/It is in Files|^OK$/,20000);
  await page.waitForFunction(()=>!Object.keys(state.frames).length,null,{timeout:20000});await sleep(1200);
  const blank=await shell(()=>({cl:!!document.querySelector('#blankCl:not([hidden])'),txt:(document.querySelector('#blankCl')||{}).innerText||''}));
  ok('E1 the start screen lists Mateo on this iPad’s caseload, with New student',blank.cl&&/Mateo Rivera/.test(blank.txt)&&/New student/.test(blank.txt),blank);
  if(await page.locator('#railScrim').isVisible().catch(()=>false)){await page.locator('#railScrim').tap({position:{x:1100,y:400}});await sleep(300);}
  await page.locator('#blNew').tap();await sleep(300);
  await page.locator('#pClient').fill(SAMPLE.client);await page.locator('#pClient').press('Tab');
  for(const id of ['DM-1','TB-1','DD-1']){const fr=await openF(id);
    const was=await shell(id=>JSON.stringify((state.status[id]||{})),id);
    const sim=fr.locator('#simBtn,#btnLoadExample').first();await reveal(fr,'#simBtn,#btnLoadExample');await sim.tap();await sleep(1500);await settleDialogs();}
  await sleep(1500);
  const S1=await caseText();const leakS=marksIn(S1.t,MATEO_MARKS);
  ok('E2 the second student’s forms (DM-1, TB-1, DD-1 simulated) hold nothing of Mateo',!leakS.length,{leakS,ids:S1.ids});
  const tS=await todayText();await closeDlg();
  ok('E3 Today for the second student names only the second student',!marksIn(tS,MATEO_MARKS).length&&/Sample Student/.test(tS),tS.slice(0,500));
  const bS=await shell(()=>packet());ok('E4 the bar holds the second student only',bS.client===SAMPLE.client&&!bS.sid,bS);
  const fS=await saveCaseFile('E-sample');const tf=fs.readFileSync(fS,'utf8');
  ok('E5 the second student’s case file holds nothing of Mateo',!marksIn(tf,MATEO_MARKS).length,marksIn(tf,MATEO_MARKS));
  const pk=await savePacketFile('E-sample');ok('E5b the second student’s packet file (Save packet) holds nothing of Mateo',!!pk&&!marksIn(fs.readFileSync(pk,'utf8'),MATEO_MARKS).length&&/Sample Student/.test(fs.readFileSync(pk,'utf8')),pk&&fs.readFileSync(pk,'utf8').slice(0,300));
  /* back to Mateo from Caseload */
  await tapShell('#caseloadBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await sleep(500);
  const rowsT=await shell(()=>[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].map(r=>r.innerText.replace(/\s+/g,' ')));
  ok('E6 Caseload lists both students',rowsT.length===2&&rowsT.some(r=>/Mateo Rivera/.test(r))&&rowsT.some(r=>/Sample Student/.test(r)),rowsT);
  const key=await shell(()=>{const r=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(r=>/Mateo/.test(r.innerText));return r&&r.dataset.clrow;});
  await page.locator('#dlgBody .cl-card[data-clrow="'+key+'"] .cl-card-acts button[data-clopen]').tap();
  await answer(/^Switch to/,/^Keep it on this iPad|^Switch anyway|^Save first/,4000);
  await page.waitForFunction(()=>packet().client==='Mateo Rivera'&&$('#openCase').textContent==='Open case',null,{timeout:30000});await sleep(1500);
  const S2=await caseText();const leakM=marksIn(S2.t,SAMPLE_MARKS);
  const idsM=Object.keys(readCase(fM).forms);
  ok('E7 back in Mateo’s case from Caseload: his forms are all there ('+idsM.length+') and hold nothing of the second student',!leakM.length&&idsM.every(id=>S2.ids.includes(id))&&S2.ids.length===idsM.length,{leakM,ids:S2.ids,idsM});
  const bM=await shell(()=>packet());ok('E8 the bar is Mateo’s again (name, ID, grade, school, BCBA)',bM.client===M.client&&bM.sid===M.sid&&bM.grade===M.grade&&bM.site===M.site&&bM.bcba===M.bcba,bM);
  const tM=await todayText();await closeDlg();
  ok('E9 Today for Mateo names nothing of the second student',!marksIn(tM,SAMPLE_MARKS).length,tM.slice(0,500));
  const fM2=fs.readFileSync(fM,'utf8');ok('E10 Mateo’s case file holds nothing of the second student',!marksIn(fM2,SAMPLE_MARKS).length,marksIn(fM2,SAMPLE_MARKS));
  const CL=await shell(async()=>(await clList()||[]).map(r=>({client:r.client,text:r.text})));
  ok('E12 the caseload’s copy of each student holds nothing of the other',CL.length===2&&CL.every(r=>/Mateo/.test(r.client)?!marksIn(r.text,SAMPLE_MARKS).length:!marksIn(r.text,MATEO_MARKS).length),CL.map(r=>[r.client,/Mateo/.test(r.client)?marksIn(r.text,SAMPLE_MARKS):marksIn(r.text,MATEO_MARKS)]));
  const fx=await facts();ok('E11 the case facts are Mateo’s (his targets and his data)',(fx.behaviors||[]).map(b=>b.label).join('|')===TGT.map(t=>t.lab).join('|')&&fx.data&&fx.data.from===BASE_DAYS[0],{b:(fx.behaviors||[]).map(b=>b.label),from:fx.data&&fx.data.from});
};

/* F: test what you think (PA-1), conclude (FS-1), plan (TD-1 with the team's signatures, GB-1, CR-1), and the staff quick start (QS-1) */
const MENU=['Drawing time','Train videos','Helping the custodian','Blocks','Stickers'];
async function drawOn(fr,sel,touch){const loc=await reveal(fr,sel);await loc.scrollIntoViewIfNeeded();await sleep(900);const b=await loc.boundingBox();
  if(touch){const cdp=await ctx.newCDPSession(page);const tp=(x,y)=>[{x,y,radiusX:2,radiusY:2,force:1,id:1}];
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp(b.x+20,b.y+b.height*.5)});
    for(let i=1;i<=30;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:tp(b.x+20+i*9,b.y+b.height*(.5+.25*Math.cos(i/2)))});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(b.x+16,b.y+b.height*.6);await page.mouse.down();await sleep(60);for(let i=0;i<36;i++)await page.mouse.move(b.x+16+i*8,b.y+b.height*(.55-.3*Math.sin(i/3)),{steps:2});await sleep(60);await page.mouse.up();}   /* v21.97 a busy machine: the stroke in steps, a breath at each end */
  await sleep(250);}
PH.F=async()=>{
  /* PA-1: the pool from DM-1's interests and the staff, then three MSWO sessions */
  const pa=await openF('PA-1');
  await putAll(pa,{'#mAssessor':M.bcba,'#mDate':md2(D.obs3),'[data-meta="purpose"]':'Reinforcers for the break request and the plan (simulated)','[data-meta="informant"]':'Ms. Lopez (simulated), teacher'});
  for(let i=0;i<MENU.length;i++)await put(pa,'[data-f="name"][data-i="'+i+'"]',MENU[i]);
  await tapIn(pa,'#viewSeg button[data-view="mswo"]');
  const order=[[1,0,2,3,4],[1,0,3,2,4],[0,1,2,4,3]];
  for(let s=0;s<3;s++)for(let t=0;t<5;t++){const c=pa.locator('#msTbl select[data-s="'+s+'"][data-t="'+t+'"]');await c.scrollIntoViewIfNeeded();await c.selectOption(String(order[s][t]));}
  await sleep(500);const pm=((await factsOut(pa))||{}).menu||[];
  ok('PA-1 MSWO: three sessions chosen in the sheet rank Train videos first and Drawing time second',pm.length===5&&pm[0].name==='Train videos'&&pm[0].rank===1&&pm[1].name==='Drawing time',pm.map(m=>m.name+':'+m.rank));
  /* FS-1: the BCBA looks over the indirect results on IA-1's Convergence sheet, then writes the summary */
  const ia=await openF('IA-1');await tapIn(ia,'#viewSeg button[data-view="summary"]');await sleep(800);
  const fsf=await openF('FS-1');
  const fs0=await fsf.evaluate(()=>({beh:S.beh.map(b=>b.lab),src:S.src.map(r=>r.form).filter(Boolean),consent:S.meta.consent}));
  ok('F1 FS-1 opens with TB-1’s two targets, a row of evidence for each assessment form and the consent from IC-1',fs0.beh.join('|')===TGT[0].lab+'|'+TGT[1].lab&&['IA-1','IN-1','OB-1','ABC-1','SP-1'].every(f=>fs0.src.includes(f))&&new RegExp(mdy(D.consent)).test(fs0.consent||''),fs0);
  await putAll(fsf,{'[data-m="window"]':md2(D.obs1)+' – '+md2(BASE_DAYS[7]),'[data-m="date"]':mdy(D.fs),'[data-m="referral"]':'Why does Mateo hit peers and leave the room during independent work, and what should the plan teach instead? (simulated)'});
  const FSB=[['Escape / avoidance (social negative)','an independent written task of more than 10 minutes','the task removed or delayed within a minute','Asking for a break'],['Escape / avoidance (social negative)','a writing demand after a first refusal','the task left behind for several minutes','Asking for a break']];
  for(let i=0;i<2;i++){await tapIn(fsf,'#viewSeg button[data-view="beh"]');await tapIn(fsf,'#behBar button[data-b="'+i+'"]');
    await putAll(fsf,{'[data-b="fn"]':FSB[i][0],'[data-b="ant"]':FSB[i][1],'[data-b="cons"]':FSB[i][2],'[data-b="alt"]':FSB[i][3],'[data-b="se"]':'a late arrival or a missed breakfast','[data-b="altCons"]':'a two-minute break from the task'});}
  await putAll(fsf,{'[data-m="next"]':'Build the plan on TD-1 around functional communication training (the break request) and task changes (simulated).','[data-m="review"]':mdy(iso(day(60)))});
  await sleep(800);const ff=await facts();
  ok('F2 the case holds FS-1’s function: escape, with a statement for each target',ff.fn&&ff.fn.key==='escape'&&ff.src.fn==='FS-1'&&(ff.fn.perBehavior||[]).length===2&&(ff.fn.statements||[]).length===2,ff.fn);
  /* TD-1: the plan */
  const td=await openF('TD-1');
  await td.waitForFunction(()=>{const e=document.querySelector('[name="m.fn"]');return e&&e.value;},null,{timeout:10000}).catch(()=>{});await sleep(500);
  const td0=await td.evaluate(()=>{const v=n=>(document.querySelector('[name="'+n+'"]')||{}).value||'';let tg=[];try{tg=JSON.parse(v('tg.rows')||'[]');}catch(e){}return {beh:v('m.beh'),fn:v('m.fn'),rep:v('m.rep')+'|'+v('m.repdesc'),pref:v('m.pref'),tg:tg.map(x=>x.label+':'+(x.fn||''))};});
  ok('F3 TD-1 opens with the targets from TB-1 and the function from FS-1 (escape), the replacement and the preferred items from PA-1',/Hitting peers/.test(td0.beh)&&td0.fn==='escape'&&/Asking for a break/i.test(td0.rep)&&/Train videos/.test(td0.pref)&&td0.tg.length===2&&td0.tg.every(x=>/^(Hitting peers|Leaving the classroom):/.test(x)),td0);
  await putAll(td,{'#mDob':mdy(M.dob),'m.reinf':'A two-minute break from the task (simulated)','m.sessmin':'30',
    'ant.pos':'Seat near the teacher, away from the door (simulated)','ant.att':'Check in every 5 minutes during independent work (simulated)','ant.se':'If he arrived late or missed breakfast, start with an easier task (simulated)',
    'rb.prec':'At the first sign (pushing the paper away), prompt the break card (simulated)','rb.target':'Block, keep the task in place, prompt the break card; no break after hitting (simulated)',
    'rb.after':'Re-present the task within 5 seconds; praise the next request (simulated)','rb.not':'No removal of the task after hitting; no lecture (simulated)','rb.crisis':'If he leaves the room: one adult follows at a distance; call the office; see Form CR-1 (simulated)'});
  await tapIn(td,'#viewSeg button[data-view="build"]');
  for(const code of ['FCT','DRA']){const opt=await td.locator('#addComp').evaluate((e,c)=>{const o=[...e.options].find(o=>o.value===c||o.textContent.startsWith(c+' '));return o?o.value:null;},code);if(opt){await td.locator('#addComp').selectOption(opt);await tapIn(td,'#addCompBtn');await sleep(300);}}
  /* the adoption meeting, signed */
  await tapIn(td,'#viewSeg button[data-view="final"]');
  await putAll(td,{'ad.date':D.adopt,'ad.team':'Ms. Lopez (simulated) (teacher); Mr. Okafor (simulated) (paraprofessional); J. Ellis (BCBA); Ana Rivera (simulated) (parent)','ad.parent':'yes','ad.notice':D.adopt,'ad.start':D.start});
  await tapIn(td,'#td85Team');await sleep(400);
  const nSig=await td.locator('#td85List canvas.td85-pad').count();
  const sigOf=k=>td.evaluate(k=>{try{const r=JSON.parse(document.querySelector('[name="ad.sigs"]').value||'[]')[k];return !!(r&&r.img);}catch(e){return false;}},k);
  for(const [k,touch] of [[0,false],[1,true]]){let a=0;for(;a<3&&!(await sigOf(k));a++){await sleep(600);await drawOn(td,'#td85List canvas.td85-pad[data-k="'+k+'"]',touch);await sleep(600);}if(a>1)note('TD-1 signature row '+(k+1)+' ('+(touch?'finger':'mouse')+') took '+a+' strokes');}
  await put(td,'#td85pn','Ana Rivera (simulated)');await put(td,'#td85pr','Parent');await sleep(600);
  /* the parent card is drawn again as the name and role are typed: the stroke until the signature is kept (three tries, as the rows) */
  const parSigned=()=>td.evaluate(()=>{try{return !!(JSON.parse(document.querySelector('[name="ad.psig"]').value||'{}').img);}catch(e){return false;}});
  {let a=0;for(;a<3&&!(await parSigned());a++){await drawOn(td,'#td85Parent canvas.td85-pad',true);await sleep(600);}if(a>1)note('TD-1 parent signature took '+a+' strokes');}
  await sleep(600);const tf=(await factsOut(td))||{};const pl=tf.plan||{},ad=pl.adoption||{};
  ok('F4 TD-1 signed at the meeting: the team listed from Team present, two signed on the iPad (mouse and finger), the parent signed; the adoption dates',nSig>=3&&(ad.signatures||[]).filter(s=>s.how==='signed on the iPad').length>=3&&(ad.signatures||[]).some(s=>s.parent&&/Ana Rivera/.test(s.name))&&ad.date===D.adopt&&ad.start===D.start,{nSig,ad});
  ok('F5 TD-1’s plan in the case: the replacement, the antecedents, the responses, the components chosen, the two targets',/break/i.test(pl.rep||'')&&pl.ant.length===3&&/break card/.test(pl.respond.prec)&&pl.teach.some(x=>/Functional communication/i.test(x))&&(pl.targets||[]).length===2,{rep:pl.rep,ant:pl.ant,teach:pl.teach,t:(pl.targets||[]).map(x=>x.label)});
  /* GB-1: the goals */
  const gb=await openF('GB-1');
  const gb0=await gb.evaluate(()=>{const v=n=>(document.querySelector('[name="'+n+'"]')||{}).value||'';return {r0:v('red[0].beh'),r1:v('red[1].beh'),a0:v('acq[0].beh')};});
  ok('F6 GB-1 opens with an objective for each target and one for the replacement',gb0.r0===TGT[0].lab&&gb0.r1===TGT[1].lab&&/break/i.test(gb0.a0),gb0);
  await tapIn(gb,'#applyPlan').catch(()=>{});await sleep(400);
  const G={'red[0].dir':'decrease','red[0].meas':'frequency per school day','red[0].cur':'4.75 per day','red[0].ml':'more','red[0].tgt':'1 per day','red[0].ctx':'Room 14 during independent work','red[0].crit':'5','red[0].meth':'a daily count on Form DD-1','red[0].date':iso(day(120)),
    'red[1].dir':'decrease','red[1].meas':'frequency per school day','red[1].cur':'1.9 per day','red[1].ml':'more','red[1].tgt':'0 per day','red[1].ctx':'school day','red[1].crit':'5','red[1].meth':'a daily count on Form DD-1','red[1].date':iso(day(120)),
    'acq[0].cond':'an independent task and the break card on the desk','acq[0].crit':'independently in at least 80% of opportunities','acq[0].n':'5','acq[0].meth':'daily data on Form DD-1','acq[0].date':iso(day(120))};
  for(const k of Object.keys(G)){const e=await gb.evaluate(k=>{const x=document.querySelector('[name="'+k+'"]');return x?{tag:x.tagName,v:x.value,opts:x.tagName==='SELECT'?[...x.options].map(o=>o.value+'='+o.textContent):null}:null;},k);
    if(!e){note('GB-1 has no field '+k);continue;}if(e.tag==='SELECT'){const o=e.opts.find(x=>x.toLowerCase().includes(String(G[k]).toLowerCase()));if(o)await put(gb,'[name="'+k+'"]',o.split('=')[0]);else note('GB-1 '+k+': no option like '+G[k]+' in '+e.opts.join('|'));}else await put(gb,'[name="'+k+'"]',G[k]);}
  await put(gb,'[name="m.review"]',iso(day(150)));await sleep(600);
  const gf=await facts();const goals=gf.goals||{};
  ok('F7 the case holds GB-1’s three goals, each written out with Mateo’s name',(goals.red||[]).length===2&&(goals.acq||[]).length===1&&[...(goals.red||[]),...(goals.acq||[])].every(g=>/Mateo/.test(g.text||'')),{red:(goals.red||[]).map(g=>g.text),acq:(goals.acq||[]).map(g=>g.text)});
  /* CR-1: the crisis plan */
  const cr=await openF('CR-1');
  const cr0=await cr.evaluate(()=>({beh:S.meta.dbeh,prec:S.meta.precursor,st:(S.pbis||[]).filter(p=>p.do).length}));
  await putAll(cr,{'[data-m="sem"]':'Fall '+new Date().getFullYear(),'[data-m="date"]':mdy(D.adopt)});
  if(!cr0.beh)await put(cr,'[data-m="dbeh"]','Hitting peers with a closed fist, or leaving the building (simulated).');
  if(!cr0.prec)await put(cr,'[data-m="precursor"]','Pushing the paper away, then standing (simulated).');
  if(cr0.st<2){for(let i=0;i<3;i++){const have=await cr.evaluate(()=>(S.pbis||[]).length);if(have<=i)await tapIn(cr,'#addPbis');
    const st=['Prevention (before any sign)','Early precursor','Escalation'][i];const so=await cr.locator('[data-p="'+i+'"][data-f="s"]').evaluate((e,st)=>{const o=[...e.options].find(o=>o.textContent.trim()===st||o.value===st);return o?o.value:e.options[1].value;},st);
    await put(cr,'[data-p="'+i+'"][data-f="s"]',so);await put(cr,'[data-p="'+i+'"][data-f="do"]',['First-then card and the break card on the desk (simulated)','Prompt the break card; no new demands (simulated)','Move the peers away; one adult follows if he leaves (simulated)'][i]);await put(cr,'[data-p="'+i+'"][data-f="who"]','Ms. Lopez (simulated)');}}
  const cf=(await factsOut(cr)||{}).crisis||{};
  ok('F8 CR-1: the dangerous behavior, the precursor and the stages of the crisis plan (filled from the case where empty)',!!cf.beh&&!!cf.precursor&&(cf.stages||[]).length>=2,{cr0,cf:{beh:cf.beh,prec:cf.precursor,st:(cf.stages||[]).length}});
  /* QS-1: the staff quick start from the case */
  const qs=await openF('QS-1');
  await putAll(qs,{'#f_meta_first':'Mateo','#f_meta_start':D.start,'#f_meta_issued':D.adopt});
  await sleep(600);const qsnap=JSON.stringify((await shell(()=>grab('QS-1','snapshot',null,15000)))||{});
  const q=await qs.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();return {q:o&&o.quick};});Object.assign(q,{menu:/Train videos/.test(qsnap),fn:/escape|break/i.test(qsnap),crisis:/Form CR-1|Move the peers away|break card/.test(qsnap)});
  ok('F9 QS-1 takes the plan, the function, the crisis stages and the menu from the case',q.menu&&q.fn&&q.crisis&&q.q&&(q.q.tiers||[]).length>=1,{menu:q.menu,fn:q.fn,crisis:q.crisis,tiers:q.q&&(q.q.tiers||[]).length,rules:q.q&&(q.q.rules||[]).length});
};
PH.R3=async()=>{await roundTrip('R3');};

/* G: run it: DD-1's treatment days (one entered from a staff phone), a restraint, CR-1's notices, TI-1, CN-1, PR-1 */
const TREAT_DAYS=SD.slice(18,29),PHONE_DAY=SD[29];
const TR_HIT=[3,3,2,2,2,1,2,1,1,0,1],TR_LEAVE=[1,1,1,0,1,0,0,1,0,0,0],TR_ASK=[2,3,4,4,5,5,6,5,6,7,6];
const PHONE={hit:1,leave:0,ask:7};
PH.G=async()=>{
  const dd=await openF('DD-1');
  await ddRows(dd,TREAT_DAYS,[TR_HIT,TR_LEAVE,TR_ASK],{phaseAt:0,phaseLabel:'FCT and the break card'});
  const n1=await dd.evaluate(()=>S.rows.length);ok('G1 DD-1: eleven treatment days typed after the phase line',n1===19,n1);
  /* the staff phone link for Mr. Okafor, on the reply box */
  await tapIn(dd,'#viewSeg button[data-view="data"]');
  const ids=await dd.evaluate(()=>S.behaviors.map(b=>b.id));
  await put(dd,'#stWho','Mr. Okafor (simulated)');for(const id of ids)await put(dd,'#stT_'+id,true);
  await reveal(dd,'#stBoxIn').catch(()=>{});await put(dd,'#stBoxIn',BOXURL);await dd.locator('#stBoxIn').evaluate(e=>e.dispatchEvent(new Event('change',{bubbles:true})));
  await tapIn(dd,'#stMake');await sleep(1500);await settleDialogs();
  const url=await dd.evaluate(()=>{const e=document.getElementById('stQrUrl');return e?e.value:'';});
  ok('G2 DD-1 makes Mr. Okafor’s phone link (the QR code and the link shown)',/staff-data\.html#/.test(url),url.slice(0,120));
  await dd.evaluate(()=>{const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();});
  /* the phone: Friday's counts entered late, from the page the link opens */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3,userAgent:IPHONE_UA,serviceWorkers:'block'});const pg=await ph.newPage();
  pg.on('pageerror',e=>ERRS.push({step:stepName,where:'staff-data.html',text:String(e.message||e).slice(0,400)}));
  await pg.goto(url,{waitUntil:'load'});await sleep(800);
  const pinfo=await pg.evaluate(()=>({t:[...document.querySelectorAll('section.t')].map(s=>s.dataset.t+':'+(s.querySelector('h2,h3,b')||{}).textContent),txt:document.body.innerText.slice(0,300)}));
  await pg.locator('#sdDate').fill(PHONE_DAY);await pg.locator('#sdDate').press('Tab').catch(()=>{});await pg.locator('#sdDate').evaluate(e=>e.dispatchEvent(new Event('change',{bubbles:true})));
  const tapN=async(id,n)=>{for(let i=0;i<n;i++){const b=pg.locator('section.t[data-t="'+id+'"] [data-a="inc"]');await b.scrollIntoViewIfNeeded();await b.tap();await sleep(80);}};
  await tapN(ids[0],PHONE.hit);await tapN(ids[2],PHONE.ask);
  await pg.locator('#sdSend').scrollIntoViewIfNeeded();await pg.locator('#sdSend').tap();await sleep(1800);
  const sent=await pg.evaluate(()=>document.getElementById('sdMsg').textContent);
  const leak=marksIn(pinfo.txt,[/Rivera/,/4471823/]);
  ok('G3 the staff phone page lists the three targets, shows the student by initials only, and sends Friday’s counts: Sent.',pinfo.t.length===3&&!leak.length&&/^Sent\./.test(sent),{pinfo,sent,leak});
  await ph.close();
  await tapIn(dd,'#stCollect');await sleep(3000);await settleDialogs();
  const got=await dd.evaluate(([d,ids])=>{const r=S.rows.find(x=>x.date===d);return r?{v:ids.map(id=>r.values[id]),by:r.by||''}:null;},[PHONE_DAY,ids]);
  ok('G4 DD-1 Collect now places the phone entry on Friday’s row (hitting 1, leaving none, 7 requests)',got&&String(got.v[0])==='1'&&String(got.v[2])==='7'&&(got.v[1]===''||got.v[1]==null||String(got.v[1])==='0'),got);
  /* the restraint, logged on DD-1's incidents */
  await tapIn(dd,'#ddIncAdd');await sleep(400);
  await putAll(dd,{'#incDate':D.restraint,'#incTime':'10:20','#incWhat':'Hit two peers with a closed fist during math; held by two trained adults for 2 minutes (simulated).','#incHold':'restraint'});
  const hasBeh=await dd.$('#incBeh');if(hasBeh){const o=await dd.locator('#incBeh').evaluate(e=>e.tagName==='SELECT'?[...e.options].map(o=>o.value).filter(Boolean)[0]:null);if(o)await dd.locator('#incBeh').selectOption(o);else await put(dd,'#incBeh',TGT[0].lab);}
  if(await dd.$('#incBy'))await put(dd,'#incBy','Mr. Okafor (simulated)');
  await tapIn(dd,'#incSave');await sleep(800);await settleDialogs();
  const inc=await dd.evaluate(()=>S.incidents.map(i=>({date:i.date,hold:i.hold,id:i.id})));
  ok('G5 DD-1: the restraint logged as an incident with its hold',inc.some(i=>i.date===D.restraint&&i.hold==='restraint'),inc);
  /* the BCBA looks at Today straight after logging it (Today reads the case, as Save case does) */
  await sleep(300);const tdy=await todayText();await closeDlg();
  const fd=await shell(()=>JSON.parse(JSON.stringify(state.facts||{})));const dd1=fd.data||{};
  note('Today right after the restraint was logged: '+tdy.replace(/\s+/g,' ').slice(0,300));
  ok('G6 the case holds DD-1’s record through the phone day: baseline and treatment, the incident with its hold, the staff entries',dd1.to===PHONE_DAY&&(dd1.incidentList||[]).some(i=>i.hold==='restraint'&&i.date===D.restraint)&&dd1.staff&&+dd1.staff.entries>=1,{to:dd1.to,inc:dd1.incidentList,staff:dd1.staff,beh:(dd1.behaviors||[]).map(b=>b.name+' base '+JSON.stringify(b.base)+' cur '+JSON.stringify(b.cur))});
  /* CR-1 takes the restraint onto its log, with the s. 1003.573 notices */
  const cr=await openF('CR-1');
  await cr.waitForFunction(d=>{try{const o=window.__nbhFactsOut();return ((o&&o.crisis&&o.crisis.deadlines)||[]).some(x=>x.event===d);}catch(e){return false;}},D.restraint,{timeout:10000}).catch(()=>{});
  const cf=((await factsOut(cr))||{}).crisis||{};const dl=(cf.deadlines||[]).filter(x=>x.event===D.restraint);
  ok('G7 CR-1 puts DD-1’s restraint on its log once, with its three notices (24-hour report, written notice the same day, the report by mail in 3 school days)',dl.length===3&&cf.restraints&&cf.restraints.semester===1,{dl,r:cf.restraints});
  /* TI-1: one unannounced observation */
  const ti=await openF('TI-1');
  await putAll(ti,{'[data-m="skill"]':'FCT: the break card','[data-m="int"]':'Mr. Okafor (simulated)','[data-m="pos"]':'Paraprofessional','[data-m="obs"]':M.bcba,'[data-m="setting"]':'Room 14, math'});
  const STEPS=['Break card on the desk at the start of math','Prompt the card at the first sign','Honor the request within 5 seconds','Two-minute break with the timer','Return to the task with praise','No break after hitting'];
  for(let i=0;i<STEPS.length;i++){const have=await ti.evaluate(()=>S.steps.length);if(have<=i)await tapIn(ti,'#addStep');await put(ti,'[data-s="'+i+'"][data-f="d"]',STEPS[i]);}
  await tapIn(ti,'#viewSeg button[data-view="sheet"]');
  await put(ti,'[data-o="0"][data-f="date"]',D.ti);await put(ti,'[data-o="0"][data-f="type"]','Unannounced');await put(ti,'[data-o="0"][data-f="ctx"]','Math');
  const SC=['C','C','EO','C','C','C'];for(let i=0;i<SC.length;i++)await put(ti,'select[data-s="'+i+'"][data-o="0"]',SC[i]);
  await sleep(600);const tif=((await factsOut(ti))||{}).integrity||{};const o0=(tif.obs||[])[0]||{};
  ok('G8 TI-1: one unannounced observation scored in the sheet, 5 of 6 steps correct (83%)',o0.date===D.ti&&Math.round(o0.pct)===83&&o0.type==='Unannounced',tif);
  /* CN-1: three notes this month, and the IEP's minutes from DM-1 */
  const cn=await openF('CN-1');
  const cm=await cn.evaluate(()=>({client:S.meta.client,min:S.meta.iep_min,per:S.meta.iep_per,kind:S.meta.iep_kind}));
  ok('G9 CN-1 opens with the IEP’s 120 minutes a month of consultation from DM-1',cm.min==='120'&&cm.per==='month'&&cm.kind==='consult'&&cm.client===M.client,cm);
  const NOTES=[[md2(SD[20]),'09:00','09:45','Observation','Ms. Lopez (simulated) (teacher), the student','First week of the plan'],[md2(SD[24]),'13:00','13:30','Consultation','Ms. Lopez (simulated) (teacher), Mr. Okafor (simulated) (paraprofessional)','Data review'],[md2(D.ti),'10:00','10:40','Observation','Mr. Okafor (simulated) (paraprofessional), the student','TI-1 observation']];
  for(let i=0;i<NOTES.length;i++){if(i>0)await tapIn(cn,'#newNote');const n=NOTES[i];await putAll(cn,{'[data-n="date"]':n[0],'[data-n="start"]':n[1],'[data-n="end"]':n[2],'[data-n="type"]':n[3],'[data-n="present"]':n[4],'[data-n="purpose"]':n[5]});}
  /* v22.52 (review F329) the service log counts signed notes: each note says what was seen and is signed */
  await cn.evaluate(()=>{S.notes.forEach(n=>{if(n.date){n.observed=n.observed||'Seen as planned (simulated).';n.sig=S.meta.bcba||'BCBA (simulated)';n.sig_date=n.date;}});renderAll();});
  await sleep(600);const sv=((await factsOut(cn))||{}).service||{};
  const inMonth=NOTES.filter(n=>{const m=/^(\d+)\/(\d+)\/(\d+)$/.exec(n[0]);return +m[1]===new Date().getMonth()+1;}).length;
  ok('G10 CN-1’s service log: three entries, minutes from the times, against the IEP’s minutes',(sv.log||[]).length===3&&sv.iep&&sv.iep.minutes===120&&/of 120 minutes/.test(sv.iep.line||''),{log:sv.log,iep:sv.iep,month:sv.month,inMonth});
  /* PR-1: the review, today */
  const pr=await openF('PR-1');
  await putAll(pr,{'[data-m="date"]':mdy(TODAY),'[data-m="period"]':mdy(D.start)+' – '+mdy(PHONE_DAY),'[data-m="team"]':'Ms. Lopez (simulated), Mr. Okafor (simulated), J. Ellis'});
  await tapIn(pr,'#viewSeg button[data-view="ev"]');await tapIn(pr,'#ddBtn');await sleep(400);
  if(await pr.locator('#ddAsk').isVisible().catch(()=>false)){await pr.locator('#ddAsk').tap();await sleep(2500);}
  if(await pr.locator('#ddGo').isEnabled().catch(()=>false)){await pr.locator('#ddGo').tap();await sleep(1200);}
  await settleDialogs();await pr.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  if(await pr.$('#tiBtn')){await tapIn(pr,'#tiBtn').catch(()=>{});await sleep(800);await settleDialogs();await pr.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));}
  await tapIn(pr,'#viewSeg button[data-view="dec"]');
  await putAll(pr,{'[data-m="dec"]':'Continue unchanged','[data-m="decWhy"]':'Hitting is down from a baseline mean of 4.75 a day and the break requests are rising (simulated).','[data-m="next"]':mdy(iso(day(28)))});
  await sleep(800);const rv=((await factsOut(pr))||{}).review||{};
  const prSnap=JSON.stringify((await shell(()=>grab('PR-1','snapshot',null,15000)))||{});
  note('PR-1 targets: '+JSON.stringify(rv.targets||[]).slice(0,600));
  ok('G11 PR-1 reads DD-1’s graph: each target’s baseline and current level, with the change',(rv.targets||[]).length>=2&&rv.targets.every(t=>t.base!=null&&t.cur!=null),{targets:rv.targets,dec:rv.decision,next:rv.next});
  ok('G12 PR-1 records the decision and the next review date',rv.decision==='continue'&&rv.next===iso(day(28)),{dec:rv.decision,next:rv.next});
  /* the goals reach the review through DD-1's aims (the case map: the goals go to the aims on DD-1; PR-1 reads the graph) */
  const fg=await facts();const aims=((fg.data||{}).behaviors||[]).map(b=>b.name+':'+b.aim);const also=await pr.evaluate(()=>S.meta.alsoCase||'');
  ok('G13 GB-1’s goals reach PR-1 through DD-1: the aims are the goals’ target levels (hitting 1 a day, leaving 0) and the review counts the days at the aim',aims.includes(TGT[0].lab+':1')&&aims.includes(TGT[1].lab+':0')&&/At the aim/.test(also),{aims,also});
  note('PR-1 shows the goals as DD-1’s aims; the goal statements themselves (GB-1) do not appear on PR-1: '+(/will decrease/.test(prSnap)?'they do':'they do not'));
};
PH.R4=async()=>{await roundTrip('R4');};
/* H: what the shell makes from the case: Today, the IEP meeting packet, What changed, Caseload, the calendar file, the restraint report, the master print */
PH.H=async()=>{
  /* What changed since the last save: one change made after the round trip's save */
  const dm=await openF('DM-1');await put(dm,'[name="pf.helps"]','A two-minute warning before transitions; a first-then card; the break card (simulated)');await sleep(500);
  await tapShell('#todayBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:15000});await sleep(800);
  const today=await shell(()=>document.getElementById('dlgBody').innerText);
  ok('H1 Today opens for Mateo, with the IEP packet and What changed, and names nothing of the second student',/Mateo Rivera/.test(today)&&/IEP meeting packet/.test(today)&&/What changed/.test(today)&&!marksIn(today,SAMPLE_MARKS).length,today.slice(0,900));
  note('Today: '+today.replace(/\s+/g,' ').slice(0,700));
  await page.locator('#tdChanges').tap();await sleep(1200);
  const ch=await shell(()=>document.getElementById('dlgBody').innerText);
  ok('H2 What changed since the last save names DM-1 with one field changed',/Form DM-1: 1 field changed/.test(ch),ch.slice(0,600));
  await closeDlg();await tapShell('#todayBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:15000});await sleep(500);
  await page.locator('#tdIep').tap();await sleep(1200);
  const iep=await shell(()=>({t:document.getElementById('dlgBody').innerText,P:iepParts()}));const P=iep.P;
  const goals=((await facts()).goals)||{};
  ok('H3 IEP packet, present levels: the daily data (the baseline and the current level of each target, from DD-1) and the function (escape, from FS-1)',/Hitting peers: 4\.75? /.test(P.present)&&/most recently/.test(P.present)&&/escape/i.test(P.present)&&new RegExp(BASE_DAYS[0]).test(P.present),P.present);
  /* v22.29 (F467): a goal GB-1 has not finished (a gap such as "[unit]" left in its sentence) is named as unfinished, not printed with the gap */
  const allG=[...(goals.red||[]),...(goals.acq||[])],doneG=allG.filter(g=>!(g.unfinished||[]).length),openG=allG.filter(g=>(g.unfinished||[]).length);
  ok('H4 IEP packet, goals: the three goals of GB-1, the finished ones word for word, an unfinished one named as not finished',P.goals.length===3&&doneG.every(g=>P.goals.includes(String(g.text||'').trim()))&&P.goals.filter(x=>/not finished on Form GB-1/.test(x)).length===openG.length&&!P.goals.some(x=>/\[[a-z ]+\]/.test(x)),{P:P.goals,gb:allG.map(g=>[g.text,g.unfinished])});
  ok('H5 IEP packet, the plan: the replacement, the strategies, the responses, the targets, adopted by the team with the start date',/Asking for a break|break/i.test(P.plan)&&/Targets the plan addresses: Hitting peers/.test(P.plan)&&new RegExp('Adopted by the team '+D.adopt).test(P.plan)&&new RegExp('started '+D.start).test(P.plan),P.plan);
  ok('H6 IEP packet, behavior services: the IEP’s 120 minutes a month of consultation (DM-1) and what CN-1 logged',/The IEP gives 120 minutes a month of behavior consultation/.test(P.svc)&&/Logged on Form CN-1/.test(P.svc),P.svc);
  ok('H7 IEP packet, progress and safety: PR-1’s review, the restraint this semester (CR-1) and the day of removal (RR-1)',P.prog.length>10&&/1 restraint this semester/.test(P.safety)&&/1 days? of removal/.test(P.safety),{prog:P.prog,safety:P.safety});
  ok('H8 IEP packet names nothing of the second student',!marksIn(JSON.stringify(P)+iep.t,SAMPLE_MARKS).length);
  /* the packet printed: a window of its own */
  const pop=page.waitForEvent('popup',{timeout:15000}).catch(()=>null);await page.locator('#iepPrint').tap();const w=await pop;
  if(w){await w.waitForLoadState('load').catch(()=>{});await sleep(800);const pdf=await w.pdf({format:'Letter',printBackground:true});fs.writeFileSync(OUT+'iep-packet.pdf',pdf);
    const wt=await w.evaluate(()=>document.body.innerText);ok('H9 Print the packet: a page with every part, the student named, printed ('+(pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)||[]).length+' pages)',/IEP Meeting: Behavior/.test(wt)&&/Mateo Rivera/.test(wt)&&/Goals/i.test(wt)&&/Behavior services/i.test(wt),wt.slice(0,400));await w.close();}
  else ok('H9 Print the packet opens its page',false,'no window');
  await closeDlg();
  /* Caseload, the calendar file, the restraint report */
  await tapShell('#caseloadBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await sleep(800);
  const cl=await shell(()=>document.getElementById('dlgBody').innerText);
  ok('H10 Caseload lists Mateo and the second student, the most urgent first, with what needs Mateo',/Mateo Rivera/.test(cl)&&/Sample Student/.test(cl),cl.slice(0,800));
  await shell(()=>{const k=document.getElementById('clKeep');if(k)k.open=true;});   /* v21.92 the calendar and the report sit in the folded housekeeping */
  const dlc=page.waitForEvent('download',{timeout:20000});await page.locator('#clCal').tap();const dc=await dlc;const fcal=OUT+'caseload.ics';await dc.saveAs(fcal);
  const ics=fs.readFileSync(fcal,'utf8');const ev=(ics.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)||[]);
  const sumy=ev.map(e=>(/SUMMARY:(.*)/.exec(e)||[])[1]);
  ok('H11 the calendar file: Mateo’s deadlines by initials only (the plan review, the annual IEP, the reevaluation, the restraint notices), no name or ID',ev.length>=3&&sumy.some(s=>/^M\. R\.: Plan review/.test(s))&&sumy.some(s=>/^M\. R\.: Annual IEP review/.test(s))&&!/Mateo|Rivera|4471823/.test(ics),sumy);
  if(!(await shell(()=>document.getElementById('dlg').open&&!!document.getElementById('clRestr')))){await closeDlg();await tapShell('#caseloadBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await sleep(500);}
  await shell(()=>{const k=document.getElementById('clKeep');if(k)k.open=true;});
  await page.locator('#clRestr').tap();await sleep(800);
  const rr=await shell(()=>({t:document.getElementById('dlgBody').innerText,rows:[...document.querySelectorAll('#dlgBody .cl-tbl tr')].slice(1).map(r=>r.innerText.replace(/\s+/g,' '))}));
  ok('H12 the restraint report: Mateo’s restraint on its date, from DD-1, with CR-1’s notices, and this semester’s count',rr.rows.some(r=>/Mateo Rivera/.test(r)&&new RegExp(D.restraint).test(r)&&/restraint/.test(r)&&/of 3/.test(r))&&/This semester: Mateo Rivera 1/.test(rr.t),rr);
  const dlr=page.waitForEvent('download',{timeout:20000});await page.locator('#clRestrCsv').tap();const dr=await dlr;await dr.saveAs(OUT+'restraint.csv');
  const csv=fs.readFileSync(OUT+'restraint.csv','utf8');ok('H13 the restraint report as a spreadsheet (.csv) holds the same row',new RegExp('"Mateo Rivera","'+D.restraint+'"').test(csv),csv.slice(0,400));
  await closeDlg();
  /* the master print: every form of the case, printed together */
  await settleDialogs();
  if(!(await page.locator('#tickUsed').isVisible().catch(()=>false))){await page.locator('#railToggle').tap();await sleep(400);}
  await page.locator('#tickUsed').tap();await sleep(400);
  const ticked=await shell(()=>Object.keys(state.ticked).filter(k=>state.ticked[k]));const inCaseIds=await shell(()=>[...new Set(Object.keys(state.frames).concat(Object.keys(state.pending)))]);
  ok('H14 Tick the ones I’ve used ticks every form in the case ('+inCaseIds.length+')',inCaseIds.every(id=>ticked.includes(id))&&ticked.length===inCaseIds.length,{ticked,inCaseIds});
  if(await page.locator('#railScrim').isVisible().catch(()=>false)){await page.locator('#railScrim').tap({position:{x:1100,y:400}});await sleep(300);}
  const e0=ERRS.length;const popM=page.waitForEvent('popup',{timeout:60000});await tapShell('#masterPrint');
  await answer(/not open yet/,/Include blanks/,3000);
  const mw=await popM;mw.on('pageerror',e=>ERRS.push({step:stepName,where:'master print',text:String(e.message||e).slice(0,400)}));
  await mw.waitForFunction(()=>document.querySelector('.mp-sec')&&window.__nbhFitted!==undefined,null,{timeout:300000}).catch(()=>{});await sleep(2000);
  await mw.emulateMedia({media:'print'});await sleep(800);
  const mp=await mw.evaluate(()=>({secs:[...document.querySelectorAll('.mp-sec')].map(s=>({id:s.id.replace('sec-',''),len:s.innerText.trim().length,mateo:/Mateo|Rivera/.test(s.innerText)})),contents:[...document.querySelectorAll('.mp-cover li')].map(l=>l.textContent),cover:(document.querySelector('.mp-cover')||{}).innerText||''}));
  await mw.emulateMedia({media:'print'});await sleep(500);const pdf=await mw.pdf({preferCSSPageSize:true,printBackground:true});fs.writeFileSync(OUT+'master.pdf',pdf);
  const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)||[]).length;
  /* v21.96 the packet ends with a references section of its own (no student in it): counted apart from the forms */
  const refs=mp.secs.filter(s=>s.id==='REFS').length,formSecs=mp.secs.filter(s=>s.id!=='REFS'),formContents=mp.contents.filter(l=>!/^References and Sources/.test(String(l).trim()));
  const missing=ticked.filter(id=>!formSecs.some(s=>s.id===id)),empty=mp.secs.filter(s=>s.len<200).map(s=>s.id),noName=formSecs.filter(s=>!s.mateo).map(s=>s.id);
  ok('H15 the master print holds every form of the case ('+formSecs.length+' sections and '+refs+' references section, '+pages+' pages), each with its own content and the student, and the cover lists them all',!missing.length&&!empty.length&&formContents.length===ticked.length&&refs===1&&/Mateo Rivera/.test(mp.cover)&&pages>mp.secs.length,{missing,empty,noName,contents:mp.contents.length,pages});
  ok('H16 the master print holds nothing of the second student',!marksIn(await mw.evaluate(()=>document.body.innerText),SAMPLE_MARKS).length);
  const mpErr=ERRS.slice(e0).filter(e=>!/Failed to load resource|favicon/.test(e.text));
  ok('H17 the master print is built without a script error',!mpErr.length,mpErr.slice(0,8));
  await mw.close();
  const pkM=await savePacketFile('H-mateo');const pkt=pkM?fs.readFileSync(pkM,'utf8'):'';
  ok('H17b Mateo’s packet file (Save packet) holds his details and nothing of the second student',/Mateo Rivera/.test(pkt)&&/4471823/.test(pkt)&&!marksIn(pkt,SAMPLE_MARKS).length,pkt.slice(0,300));
  /* the iPad turned upright (820 x 1180): Today, the IEP packet and Caseload fit the screen, the form list opens by touch */
  await page.setViewportSize({width:820,height:1180});await sleep(1200);
  const fit=async name=>{await sleep(700);const r=await shell(()=>{const d=document.getElementById('dlg'),b=d.getBoundingClientRect(),W=document.documentElement.clientWidth;
      const wide=[...d.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+1||r.left<-1)&&!e.closest('.cl-wrap,.td-wrap,table');}).length;
      return {left:Math.round(b.left),right:Math.round(b.right),W,scrollW:document.documentElement.scrollWidth,wide};});
    ok('H19 upright iPad: '+name+' fits the screen (no part past the edge, no sideways scroll of the page)',r.left>=0&&r.right<=r.W&&r.scrollW<=r.W+1&&!r.wide,r);await closeDlg();};
  await tapShell('#todayBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await fit('Today');
  await tapShell('#todayBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await sleep(400);await page.locator('#tdIep').tap();await fit('the IEP meeting packet');
  await tapShell('#caseloadBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await fit('Caseload');
  await page.locator('#railToggle').tap();await sleep(400);await page.locator('#rail [data-open="DD-1"]').tap();await page.waitForFunction(()=>state.cur==='DD-1',null,{timeout:10000});await sleep(1200);
  const ddw=await shell(()=>{const f=state.frames['DD-1'],r=f.getBoundingClientRect();return {w:Math.round(r.width),W:document.documentElement.clientWidth,scrollW:document.documentElement.scrollWidth,inner:f.contentDocument.documentElement.scrollWidth,innerW:f.contentDocument.documentElement.clientWidth};});
  ok('H20 upright iPad: DD-1 opens from the form list by touch and fills the width without the page scrolling sideways',ddw.w<=ddw.W&&ddw.scrollW<=ddw.W+1&&ddw.inner<=ddw.innerW+1,ddw);
  await page.setViewportSize({width:1180,height:820});await sleep(800);
  /* the last file: nothing of the second student anywhere in Mateo's files */
  const fl=await saveCaseFile('H-final');const all=DLS.filter(f=>/Mateo_Rivera/.test(f)).map(f=>[f,marksIn(fs.readFileSync(f,'utf8'),SAMPLE_MARKS)]).filter(x=>x[1].length);
  ok('H18 none of Mateo’s case files ('+DLS.filter(f=>/Mateo_Rivera/.test(f)).length+') holds anything of the second student',!all.length,all);
};

/* =============================== run =============================== */
(async()=>{
  const data=OUT+'box';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  ok('0 the reply box answers (php -S on '+PORT+')',up);if(!up){php.kill();process.exit(1);}
  br=await chromium.launch();
  ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',acceptDownloads:true,userAgent:IPAD_UA});
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;window.__scope=cfg.scope;setTimeout(()=>cfg.callback({access_token:'simulated-mail-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}
    window.__prints=0;window.print=function(){window.__prints++;};});
  await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await ctx.route('https://www.googleapis.com/oauth2/v3/userinfo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({email:M.email})}));
  await ctx.route('https://gmail.googleapis.com/**',async r=>{const b=JSON.parse(r.request().postData()||'{}'),raw=Buffer.from(String(b.raw||'').replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
    const body=require(__dirname+'/lib.js').mailParts(raw).text;MAILS.push({raw,body,step:stepName});return r.fulfill({contentType:'application/json',body:JSON.stringify({id:'m'+MAILS.length})});});
  ctx.setDefaultTimeout(20000);page=await ctx.newPage();
  page.on('pageerror',e=>ERRS.push({step:stepName,where:'workstation',text:String(e.message||e).slice(0,400)}));
  page.on('console',m=>{if(m.type()==='error')ERRS.push({step:stepName,where:'console '+(m.location()&&m.location().url||'').split('/').pop(),text:m.text().slice(0,400)});});
  page.on('dialog',d=>{DIALOGS.push({step:stepName,native:d.type(),t:d.message().slice(0,300)});d.accept().catch(()=>{});});
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await shell(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  const only=(process.env.ONLY||'').split(',').filter(Boolean);
  if(process.env.START_CASE){stepName='start';await openCaseFile(path.resolve(process.env.START_CASE));note('opened '+process.env.START_CASE);}
  for(const k of Object.keys(PH)){if(only.length&&!only.includes(k))continue;stepName=k;const t=Date.now();console.log('--- phase '+k);
    /* a phase that stopped half way with the second student open must not let the next phase type Mateo's work into her case */
    const who=await shell(()=>packet().client).catch(()=>'');
    if(who&&who!==M.client){note('the workstation holds '+who+'; Mateo’s case is opened again from Caseload before phase '+k);
      try{await settleDialogs();await tapShell('#caseloadBtn');await page.waitForFunction(()=>document.getElementById('dlg').open,null,{timeout:10000});await sleep(500);
        const key=await shell(()=>{const r=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(r=>/Mateo/.test(r.innerText));return r&&r.dataset.clrow;});
        await page.locator('#dlgBody .cl-card[data-clrow="'+key+'"] .cl-card-acts button[data-clopen]').tap();await answer(/^Switch to/,/^Keep it on this iPad|^Switch anyway|^Save first/,4000);
        await page.waitForFunction(()=>packet().client==='Mateo Rivera'&&$('#openCase').textContent==='Open case',null,{timeout:30000});await sleep(1500);}
      catch(e){ok('phase '+k+' starts in Mateo’s case',false,String(e).slice(0,300));break;}}
    try{await PH[k]();}catch(e){ok('phase '+k+' ran to its end',false,String(e&&e.stack||e).slice(0,900));await page.screenshot({path:OUT+'fail-'+k+'.png'}).catch(()=>{});await settleDialogs().catch(()=>{});}
    note('phase '+k+' took '+Math.round((Date.now()-t)/1000)+' s');
    if(process.env.CKPT&&!/^R/.test(k)){try{await settleDialogs();await page.waitForFunction(()=>!Object.keys(state.pending).some(id=>state.frames[id]),null,{timeout:30000}).catch(()=>{});await sleep(1500);await shell(()=>gatherFacts(false));const f=await saveCaseFile('ckpt-'+k);fs.copyFileSync(f,OUT+'ckpt-'+k+'.json');}catch(e){note('checkpoint not saved: '+e.message);}}}
  stepName='end';
  const pe=ERRS.filter(e=>!/Failed to load resource|favicon/.test(e.text));
  ok('no script error anywhere in the journey',!pe.length,pe.slice(0,12));
  fs.writeFileSync(OUT+'dialogs.json',JSON.stringify(DIALOGS,null,1));fs.writeFileSync(OUT+'errors.json',JSON.stringify(ERRS,null,1));fs.writeFileSync(OUT+'mails.json',JSON.stringify(MAILS,null,1));
  await br.close();php.kill();
  const line=(fails?'RESULT: '+fails+' failure(s), '+passes+' passed':'RESULT: all '+passes+' passed')+' in '+Math.round((Date.now()-T0)/1000)+' s';
  console.log(line);RES.push(line);fs.writeFileSync(OUT+'results.txt',RES.join('\n'));console.log('DONE');process.exit(fails?1:0);
})().catch(async e=>{console.error(e);try{await br.close();}catch(x){}try{php.kill();}catch(x){}console.log('DONE');process.exit(1);});
