/* v21.95 the Home note: a parent's progress note in English or Spanish, written from the case (Form DD-1's data, GB-1's goals,
   PR-1's review, DM-1's home contact), edited on the sheet, printed, sent from the school account or copied. Simulated student
   only (Mateo Rivera, the forms' own simulations). Chromium.   usage: node qa/v2195-note-test.js  (WS_URL=...) */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const frameOf=(page,file)=>page.frames().find(f=>f.url().indexOf(file)>=0);
async function shell(br,vp,touch){const ctx=await br.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch,userAgent:touch?IPHONE:undefined,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');set('#pGrade','5');set('#pBcba','Joshua Newsome, M.A., BCBA');});
  return {ctx,page,errs};}
async function openSim(page,id,file){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(800);
  const fr=frameOf(page,file);await fr.evaluate(()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;});await loadSim(fr);await sleep(2200);return fr;}
(async()=>{const br=await chromium.launch();
  try{
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},false);
    const dm=await openSim(page,'DM-1','DM-1_Student');await openSim(page,'DD-1','Daily_Behavior');await openSim(page,'GB-1','GB-1_Goal');await openSim(page,'PR-1','PR-1_Periodic');
    /* the home on Form DM-1: Spanish, a parent with an email (simulated) */
    await dm.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;};
      set('s.lang','Spanish');set('s.interp','Yes: spoken');if(!document.querySelector('[name="c[0].name"]').value)set('c[0].name','Sample Parent (simulated)');set('c[0].rel','Mother');set('c[0].lang','Spanish');set('c[0].email','simulated.parent@example.com');});
    await sleep(600);await page.evaluate(()=>gatherFacts(true));await sleep(1200);
    const facts=await page.evaluate(()=>{const f=state.facts||{};const d=f.data||{};return {rows:(d.behaviors||[]).filter(b=>b&&b.name).map(b=>({name:b.name,now:b.cur&&b.cur.mean!=null?b.cur.mean:b.mean,aim:b.aim,unit:b.unit})),days:d.days,from:d.from,to:d.to,inc:(d.incidentList||[]).filter(i=>i.date>=d.from&&i.date<=d.to).length,goals:[].concat(((f.goals||{}).red||[]),((f.goals||{}).acq||[])).length,home:(f.profile||{}).home||null,review:f.review||null};});
    ok('1 the case facts carry the data, the goals and the home (Spanish, a parent with an email)',facts.rows.length>=2&&facts.goals>=1&&facts.home&&/spanish/i.test(facts.home.lang)&&facts.home.email==='simulated.parent@example.com'&&facts.home.name,facts);
    await page.evaluate(()=>todayOpen());await sleep(1000);
    const td=await page.evaluate(()=>!!document.querySelector('#dlgBody #tdHome'));
    ok('2 the Today list offers Home note',td);
    await page.click('#tdHome');await sleep(1500);
    const es=await page.evaluate(()=>{const sh=$('#hnSheet');return {title:$('#dlgTitle').textContent.trim(),lang:$('#dlgBody .hn-lang [aria-pressed="true"]').dataset.lang,text:sh.innerText,rows:sh.querySelectorAll('tbody tr').length,goals:sh.querySelectorAll('ul li').length,sheetLang:sh.lang};});
    ok('3 the note opens in Spanish, as Form DM-1 says the home language is: greeting, section names, a row per behavior, the goals',es.lang==='es'&&es.sheetLang==='es'&&/Estimad/.test(es.text)&&/En qué estamos trabajando/.test(es.text)&&/Buenas noticias/.test(es.text)&&/Qué puede hacer en casa/.test(es.text)&&!/Dear|What we are working on/.test(es.text)&&es.rows===facts.rows.length&&es.goals===facts.goals,{lang:es.lang,rows:es.rows,goals:es.goals,text:es.text.slice(0,300)});
    const esInc=/No hubo incidentes|En este período hubo (\d+) incidente/.exec(es.text);
    ok('4 the Spanish incident line matches the period’s count ('+facts.inc+')',!!esInc&&(facts.inc===0?/No hubo/.test(esInc[0]):+esInc[1]===facts.inc),{line:esInc&&esInc[0],inc:facts.inc});
    await page.click('#dlgBody .hn-lang [data-lang="en"]');await sleep(500);
    const en=await page.evaluate(()=>{const sh=$('#hnSheet');const tr=sh.querySelector('tbody tr');return {lang:$('#dlgBody .hn-lang [aria-pressed="true"]').dataset.lang,text:sh.innerText,first:tr?[...tr.children].map(c=>c.textContent.trim()):null,rows:sh.querySelectorAll('tbody tr').length,btn:$('#hnPrint').textContent};});
    const r0=facts.rows[0];
    ok('5 in English: the greeting, the sections, the first row’s numbers from the facts',en.lang==='en'&&/Dear /.test(en.text)&&/What we are working on/.test(en.text)&&/The good news/.test(en.text)&&!/Estimad/.test(en.text)&&en.first&&en.first[0]===r0.name&&(r0.now==null||en.first[2].indexOf(String(r0.now))>=0)&&en.btn==='Print',{first:en.first,r0});
    const enInc=/There were no incidents|In this period there (?:was|were) (\d+) incident/.exec(en.text);
    ok('6 the English incident line matches the period’s count',!!enInc&&(facts.inc===0?/no incidents/.test(enInc[0]):+enInc[1]===facts.inc),{line:enInc&&enInc[0]});
    ok('7 the period line names the days and dates of Form DD-1’s record, and an interpreter line is there (DM-1 says one is needed)',new RegExp('last '+facts.days+' school days').test(en.text)&&/An interpreter is available/.test(en.text),{days:facts.days});
    /* an edit on the sheet is kept in the text that prints, sends and copies */
    await page.evaluate(()=>{const box=$('#hnSheet .hn-box');box.textContent='Ask about the break card at dinner (simulated).';});
    const printed=await page.evaluate(()=>{let html='';const wo=window.open;window.open=()=>({document:{open(){},write(h){html+=h;},close(){}},focus(){},print(){}});try{hnPrint();}finally{window.open=wo;}return html;});
    ok('8 Print writes the note as a page: the logo, the sections, the home box as edited, no editing marks',/<img src="data:image/.test(printed)&&/What we are working on/.test(printed)&&/break card at dinner/.test(printed)&&!/contenteditable/.test(printed)&&/lang="en"/.test(printed),{len:printed.length});
    const sent=await page.evaluate(()=>{let got=null;const mf=mailFor;mailFor=async(ev,d)=>{got=d;};try{hnSend();}finally{mailFor=mf;}return got&&{to:got.messages[0].to,subject:got.messages[0].subject,text:got.messages[0].text.slice(0,200),html:!!got.messages[0].html,self:got.self};});
    ok('9 Send hands the mail path one message to the home’s email, with the subject naming the student and the note as text and as a page',sent&&sent.to==='simulated.parent@example.com'&&/Mateo/.test(sent.subject)&&/Dear /.test(sent.text)&&sent.html&&sent.self,sent);
    const copied=await page.evaluate(()=>hnText());
    ok('10 the copied text carries the table rows and the edited home box',new RegExp(r0.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' \\| ').test(copied)&&/break card at dinner/.test(copied)&&/WHAT WE ARE WORKING ON/.test(copied),{copied:copied.slice(0,300)});
    const cmd=await page.evaluate(()=>!!CMDS.find(c=>/Home note/.test(c.n)));
    ok('11 the command list carries Home note',cmd);
    ok('12 no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  /* ---- on a phone: the sheet fits ---- */
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},true);
    await openSim(page,'DD-1','Daily_Behavior');await page.evaluate(()=>gatherFacts(true));await sleep(1000);await page.evaluate(()=>homeNoteOpen());await sleep(1500);
    const m=await page.evaluate(()=>{const db=$('#dlgBody');const over=[...db.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length;return {open:$('#dlg').open,over,sw:db.scrollWidth,cw:db.clientWidth,rows:db.querySelectorAll('tbody tr').length};});
    ok('13 phone: the note opens and fits the screen',m.open&&m.over===0&&m.sw<=m.cw+1&&m.rows>=1,m);
    ok('14 phone: no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
