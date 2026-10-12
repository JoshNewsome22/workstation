/* v21.91 search the caseload: three simulated students kept on this device (Mateo Rivera with Forms DD-1, TB-1 and FS-1;
   SIMULATED – Sample Student with Form CN-1; SIMULATED – Sample Student 2 with Form FS-1). One search over every student:
   the facts (target behaviors) and the forms' words; every word must be there, capitals and accents aside; question words
   left out; a date found by its month; snippets escaped and marked; the command box's "In the caseload" group; a place
   opened brings the right student, form, page and field (outlined, not focused, so no keyboard); Initials only in what is
   found; the parsed copies kept until they change; nothing sent anywhere; no page errors.
   Simulated students only.  usage: node qa/v2191-find-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const UA_IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const OUT=__dirname+'/out/v2191-find/';
(async()=>{const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:UA_IPAD,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[],net=[];
  page.on('pageerror',e=>errs.push(e.message));
  ctx.on('request',r=>{const u=r.url();if(!u.startsWith(BASE)&&!/^(data|blob|about):/.test(u))net.push(u);});
  try{
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};window.__choose=[];wsUI.choose=async t=>{window.__choose.push(String(t));return 'switch';};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  const frameOf=async id=>{const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);return page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);};
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:40000});await sleep(1200);
    const fr=await frameOf(id);await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;nbhUI.alert=async()=>{};}catch(e){}window.confirm=()=>true;window.alert=()=>{};});return fr;};
  const sim=async fr=>{await fr.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(2500);};
  const setF=(fr,sel,v)=>fr.evaluate(([sel,v])=>{const e=document.querySelector(sel);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,v]);
  const student=async(name,sid,site,grade)=>{await page.evaluate(([n,s,si,g])=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient',n);set('#pSid',s);set('#pSite',si);set('#pGrade',g);},[name,sid,site,grade]);};
  const keep=async()=>{const r=await page.evaluate(async()=>{await gatherFacts(false);return await caseKeepOnly();});await sleep(600);await page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();});await sleep(900);return r;};
  /* Mateo Rivera: DD-1 and TB-1 simulated, FS-1 with words of its own on its Report page */
  await student('Mateo Rivera','4471823','Royal Palm School','5');
  await sim(await open('DD-1'));
  await sim(await open('TB-1'));
  const fs1=await open('FS-1');
  const okA=await setF(fs1,'textarea[data-m="limits"]','Mateo’s data were not taken on the bus or in the bus loop at dismissal (simulated).');
  await setF(fs1,'textarea[data-m="referral"]','Why does he leave the classroom during writing? (simulated)');
  const k1=await keep();
  /* SIMULATED – Sample Student: a consultation note with an accent and characters that are markup */
  await student('SIMULATED – Sample Student','SIM-0002','Sample Elementary','3');
  const cn1=await open('CN-1');
  const okB=await setF(cn1,'textarea[data-n="observed"]','Met the café staff about the piñata at lunch; the <b>bus</b> driver & aide joined (simulated).');
  const k2=await keep();
  /* SIMULATED – Sample Student 2: FS-1 with a review date in November and aggression */
  await student('SIMULATED – Sample Student 2','SIM-0003','Sample Middle','7');
  const fs3=await open('FS-1');
  await setF(fs3,'textarea[data-m="referral"]','Aggression during transitions between classes (simulated).');
  await setF(fs3,'input[data-m="review"]','2026-11-03');
  const k3=await keep();
  const kept=await page.evaluate(async()=>(await clList()).map(r=>({c:r.client,forms:Object.keys(JSON.parse(r.text).forms||{}),beh:((JSON.parse(r.text).facts||{}).behaviors||[]).map(b=>b.label)})));
  ok('0 three simulated students kept on this device, with their forms and Mateo’s target behaviors from Form TB-1',okA&&okB&&k1&&k2&&k3&&kept.length===3&&kept.some(r=>r.c==='Mateo Rivera'&&r.forms.includes('FS-1')&&r.beh.some(b=>/Elopement/.test(b))),{okA,okB,k1,k2,k3,kept});
  const run=q=>page.evaluate(async q=>{const L=await clList();return findRun(q,L,{}).map(x=>({c:x.r.client,hits:x.hits.map(h=>({k:h.e.kind,f:h.e.form,l:h.e.label,t:h.e.text.slice(0,120),ws:h.ws}))}));},q);
  /* 1 facts: who has elopement as a target */
  let r=await run('elopement');
  ok('1 “elopement”: Mateo Rivera only, his target behavior (a fact from Form TB-1) first',r.length===1&&r[0].c==='Mateo Rivera'&&r[0].hits[0].k==='fact'&&r[0].hits[0].l==='Target behavior'&&r[0].hits[0].f==='TB-1',r);
  r=await run('who has elopement as a target');
  ok('2 “who has elopement as a target”: the question words left out; Mateo, by his target behavior first',r.length===1&&r[0].c==='Mateo Rivera'&&r[0].hits[0].k==='fact'&&r[0].hits[0].l==='Target behavior'&&r[0].hits.every(h=>/elopement/i.test(h.t)),r);
  /* 3 the forms' words, all words */
  r=await run('bus');
  ok('3 “bus”: Mateo (Form FS-1) and Sample Student (Form CN-1), not Sample Student 2',r.length===2&&r.some(x=>x.c==='Mateo Rivera'&&x.hits.some(h=>h.f==='FS-1'))&&r.some(x=>x.c==='SIMULATED – Sample Student'&&x.hits.some(h=>h.f==='CN-1')),r);
  r=await run('bus loop');
  ok('4 “bus loop”: every word must be there: Mateo only',r.length===1&&r[0].c==='Mateo Rivera',r);
  r=await run('Bus  LOOP dismissal');
  ok('4b capitals and spaces aside: still Mateo only',r.length===1&&r[0].c==='Mateo Rivera',r);
  r=await run('bus nothing-like-this');
  ok('4c a word no student has: nobody',r.length===0,r);
  /* 5 accents */
  const ra=await run('cafe'),rb=await run('CAFÉ'),rc=await run('pinata cafe'),rd=await run('PIÑATA café');
  const sB5=x=>x.some(y=>y.c==='SIMULATED – Sample Student'&&y.hits.some(h=>h.f==='CN-1'&&/café/.test(h.t)));
  ok('5 accents aside: “cafe” and “CAFÉ” find Sample Student’s “café” (and Mateo’s “cafeteria”, a word starting so); “pinata cafe” and “PIÑATA café” her only',
    sB5(ra)&&sB5(rb)&&[rc,rd].every(x=>x.length===1&&sB5(x)),{ra:ra.map(x=>x.c),rb:rb.map(x=>x.c),rc:rc.map(x=>x.c),rd:rd.map(x=>x.c)});
  r=await run('us');
  ok('5b words are matched from their start: “us” is not found inside “bus”',!r.some(x=>x.hits.some(h=>/\bbus\b/i.test(h.t)&&!/\bus\b/i.test(h.t))),r);
  /* 6 a date by its month */
  r=await run('November');
  ok('6 “November” finds Sample Student 2’s review date (2026-11-03) in Form FS-1',r.some(x=>x.c==='SIMULATED – Sample Student 2'&&x.hits.some(h=>h.f==='FS-1'&&h.t==='2026-11-03')),r);
  r=await run('aggression');
  ok('6b “aggression”: Mateo (his target behavior) and Sample Student 2 (her FS-1)',r.length===2&&r.some(x=>x.c==='Mateo Rivera'&&x.hits[0].k==='fact')&&r.some(x=>x.c==='SIMULATED – Sample Student 2'&&x.hits[0].f==='FS-1'),r);
  /* 7 the Caseload dialog: the search at the top, grouped by student, snippets escaped and marked */
  await page.evaluate(()=>caseloadOpen());await sleep(700);
  const top=await page.evaluate(()=>{const b=document.getElementById('dlgBody');return {first:b.firstElementChild&&b.firstElementChild.className,has:!!document.getElementById('clFindIn'),wide:document.getElementById('dlg').classList.contains('cl-wide'),focus:document.activeElement&&document.activeElement.id};});
  ok('7 Caseload: a search field at the top of the dialog, not given the focus as the dialog opens (no keyboard popping up on the iPad)',top.first==='cl-find'&&top.has&&top.focus!=='clFindIn',top);
  await page.fill('#clFindIn','bus');await sleep(600);
  const g=await page.evaluate(()=>{const o=document.getElementById('clFindOut');return {vis:!o.hidden,groups:[...o.querySelectorAll('.cl-fg')].map(s=>({who:s.querySelector('h4').firstChild.textContent,hits:[...s.querySelectorAll('.cl-hit')].map(h=>({f:h.querySelector('.cl-hf').textContent,html:h.querySelector('.cl-hs').innerHTML,b:!!h.querySelector('.cl-hs b'),marks:[...h.querySelectorAll('mark')].map(m=>m.textContent)}))}))};});
  const sB=g.groups.find(x=>x.who==='Sample Student'),sA=g.groups.find(x=>x.who==='Mateo Rivera'),hA=sA&&sA.hits.find(h=>/^Form FS-1/.test(h.f)),hB=sB&&sB.hits.find(h=>/^Form CN-1/.test(h.f));
  ok('8 grouped by student (names as Caseload shows them), each place with its form id and name',g.vis&&g.groups.length===2&&!!hA&&!!hB&&/^Form FS-1 · FBA Summary Report$/.test(hA.f)&&/^Form CN-1 · Consultation/.test(hB.f),g);
  ok('9 the snippet is escaped (the <b> typed in the note is text, not markup) and the word is marked',!!hB&&!!hA&&!hB.b&&/&lt;b&gt;<mark class="cl-m">bus<\/mark>&lt;\/b&gt;/.test(hB.html)&&/&amp; aide/.test(hB.html)&&hA.marks.every(m=>/^bus$/i.test(m))&&hA.marks.length>=2,{hA,hB});
  await page.screenshot({path:OUT+'dialog-search-1180.png'});
  /* 10 the command box: forms and commands, then "In the caseload" */
  await page.keyboard.press('Escape');await sleep(300);
  await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}palOpen();});await sleep(500);
  await page.fill('#palIn','bus loop');await sleep(400);
  const pal=await page.evaluate(()=>{const R=[...document.querySelectorAll('#palRes > *')];const gi=R.findIndex(x=>x.classList.contains('pal-grp'));
    return {grp:gi>=0?R[gi].textContent:'',after:R.slice(gi+1).filter(x=>x.classList.contains('r')).map(x=>({id:x.querySelector('.rid').textContent,nm:x.querySelector('.rnm').textContent,mk:x.querySelectorAll('mark').length})),before:R.slice(0,Math.max(0,gi)).length};});
  ok('10 the command box: a group “In the caseload” with Mateo’s place in Form FS-1, words marked',/In the caseload/i.test(pal.grp)&&pal.after.length>=1&&pal.after[0].id==='FS-1'&&/Mateo Rivera/.test(pal.after[0].nm)&&pal.after[0].mk>=2,pal);
  await page.fill('#palIn','report');await sleep(300);
  const pal2=await page.evaluate(()=>{const R=[...document.querySelectorAll('#palRes > *')];const gi=R.findIndex(x=>x.classList.contains('pal-grp'));const fi=R.findIndex(x=>x.classList.contains('r')&&/Report/.test(x.textContent)&&!x.classList.contains('cl-prow'));return {gi,fi};});
  ok('10b the forms and commands come first, the caseload after them',pal2.fi>=0&&(pal2.gi<0||pal2.fi<pal2.gi),pal2);
  await page.fill('#palIn','bu');await sleep(300);
  const pal3=await page.evaluate(()=>!!document.querySelector('#palRes .pal-grp'));
  ok('10c two letters: no caseload group (three or more)',!pal3);
  await page.screenshot({path:OUT+'palette-1180.png'});
  await page.evaluate(()=>palClose());
  /* 11 opening a place: the right student, form, page and field, outlined and not focused */
  await page.evaluate(()=>caseloadOpen());await sleep(600);
  await page.fill('#clFindIn','bus loop');await sleep(600);
  await page.evaluate(()=>document.activeElement&&document.activeElement.blur());
  await page.evaluate(()=>document.querySelector('#clFindOut .cl-hit').click());
  await page.waitForFunction(()=>packet().client==='Mateo Rivera'&&state.cur==='FS-1'&&!state.pending['FS-1'],null,{timeout:40000});
  let fr=await frameOf('FS-1');
  await fr.waitForFunction(()=>!!document.querySelector('.nbh-found'),null,{timeout:20000}).catch(()=>{});
  await sleep(900);
  const o1=await fr.evaluate(()=>{const e=document.querySelector('.nbh-found'),r=e&&e.getBoundingClientRect();return {tag:e&&e.tagName,m:e&&e.dataset.m,val:e&&e.value,view:document.body.className,pressed:(document.querySelector('#viewSeg [aria-pressed=true]')||{}).textContent,inView:!!r&&r.top>=0&&r.bottom<=innerHeight,focused:document.activeElement===e,active:document.activeElement&&document.activeElement.tagName};});
  const sh=await page.evaluate(()=>({dlg:document.getElementById('dlg').open,active:document.activeElement&&document.activeElement.id}));
  ok('11 the place opens Mateo’s case at Form FS-1, on its Report page, the Limitations field in view and outlined',o1.tag==='TEXTAREA'&&o1.m==='limits'&&/bus loop/.test(o1.val||'')&&/view-rep/.test(o1.view)&&/Report/.test(o1.pressed||'')&&o1.inView&&!sh.dlg,{o1,sh});
  ok('12 the field is not focused (no keyboard on the iPad), nor is the search',!o1.focused&&!/TEXTAREA|INPUT/.test(o1.active||'')&&sh.active!=='clFindIn',{o1,sh});
  await page.screenshot({path:OUT+'opened-fs1-1180.png'});
  await sleep(2600);
  const gone=await fr.evaluate(()=>!document.querySelector('.nbh-found'));
  ok('12b the outline goes after a moment',gone);
  /* 13 a fact opens its form, and the form shows the field holding the words (TB-1's Elopement) */
  const rt=await page.evaluate(async()=>{const L=await clList(),x=findRun('elopement',L,{})[0],h=x.hits[0];return await findGo({key:x.r.key,form:h.e.form,words:h.ws,fkey:h.e.fkey||'',kind:h.e.kind});});
  await sleep(700);
  fr=await frameOf('TB-1');
  const o2=await fr.evaluate(()=>{const e=document.querySelector('.nbh-found');return {tag:e&&e.tagName,val:e&&(e.value||e.textContent),focused:document.activeElement===e};});
  ok('13 the target behavior (a fact) opens Form TB-1 at the field that holds “Elopement”, not focused',!!rt&&rt.found===true&&/Elopement/i.test(o2.val||'')&&!o2.focused&&await page.evaluate(()=>state.cur==='TB-1'),{rt,o2});
  /* 14 another student, from the start screen's search */
  await page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();});await sleep(900);await page.evaluate(()=>paintBlank());await sleep(600);
  const bl=await page.evaluate(()=>{const i=document.getElementById('blFindIn'),c=document.querySelector('#blankCl .cl-cards');return {i:!!i,above:!!i&&!!c&&!!(i.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)};});
  ok('14 the start screen has the search, above the cards',bl.i&&bl.above,bl);
  await page.fill('#blFindIn','cafe staff');await sleep(600);
  await page.screenshot({path:OUT+'blank-search-1180.png'});
  await page.evaluate(()=>{document.activeElement&&document.activeElement.blur();document.querySelector('#blFindOut .cl-hit').click();});
  await page.waitForFunction(()=>packet().client==='SIMULATED – Sample Student'&&state.cur==='CN-1'&&!state.pending['CN-1'],null,{timeout:40000});
  fr=await frameOf('CN-1');await fr.waitForFunction(()=>!!document.querySelector('.nbh-found'),null,{timeout:20000}).catch(()=>{});
  const o3=await fr.evaluate(()=>{const e=document.querySelector('.nbh-found');return {n:e&&e.dataset.n,focused:document.activeElement===e};});
  ok('15 Sample Student’s case opens at Form CN-1, the note’s field outlined, not focused',o3.n==='observed'&&!o3.focused,o3);
  /* 16 Initials only */
  await page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();localStorage.setItem('nbh.caseload.ini','1');});await sleep(700);
  await page.evaluate(()=>caseloadOpen());await sleep(600);await page.fill('#clFindIn','bus');await sleep(600);
  const ini=await page.evaluate(()=>({t:document.getElementById('clFindOut').textContent,who:[...document.querySelectorAll('#clFindOut .cl-fg h4')].map(h=>h.firstChild.textContent)}));
  ok('16 Initials only: the students as M. R. and S. S., and neither name nor ID in what is found',ini.who.includes('M. R.')&&ini.who.includes('S. S.')&&!/Mateo|Rivera|4471823|Sample Student/.test(ini.t),ini);
  await page.fill('#clFindIn','4471823');await sleep(500);
  const ini2=await page.evaluate(()=>document.getElementById('clFindOut').textContent);
  ok('16b Initials only: an ID typed finds the student, shown by initials only',/M\. R\./.test(ini2)&&!/4471823|Mateo/.test(ini2),ini2);
  await page.evaluate(()=>{localStorage.removeItem('nbh.caseload.ini');try{$('#dlg').close();}catch(e){}});
  /* 17 the parsed copy is kept until it changes */
  const cache=await page.evaluate(async()=>{const L=await clList(),r=L[0],a=findIdx(r),b=findIdx(r);const r2=Object.assign({},r,{saved:new Date(Date.now()+5000).toISOString()});const c=findIdx(r2);return {same:a===b,again:c!==a,n:FIND.cache.size};});
  ok('17 each copy is read once and kept read until its save changes',cache.same&&cache.again&&cache.n>=3,cache);
  /* 18 nothing leaves the device; no page errors */
  ok('18 no request to any other address (the search reads only this device)',!net.length,net.slice(0,5));
  ok('19 no page errors',!errs.length,errs.slice(0,5));
  }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e).slice(0,800));}
  finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
