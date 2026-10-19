/* v22.37 privacy (review F278, F279, F368, F448, F449).
   GC-1: a dependent contingency's poster names no student and shows no individual goal ("our class goal") until the student
   is named to the class and the parent agreed in writing, with the date; the reason is on screen. Other students' plans,
   initials and team names go on the class sheet, which is never in Save data, the case snapshot or the packet (the Guide
   stays out too); an older file's other-student answers move there. HD-1: the note under the title says what Autosave
   keeps; a photo of a sheet goes to a district number or email, and the Setup page says so. IM-1: the reason for a No and
   the record of a report are never in the data file or the snapshot (print or a file of their own); an older file that
   holds them opens; a parent's No (or no decision) to injury checks lists nothing due, here or for the workstation; the
   decision comes from Form IC-1 (dec.ij) when the fields are empty. Simulated people only.
   usage: node qa/v2237-privacy-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/';
const GC='GC-1_Group-Contingencies_v2026-10.html',HD='HD-1_Home-Data-Sheets_v2026-10.html',IM='IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async(file,tag)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+': '+e.message));await p.goto(W+file);await sleep(900);
    await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};window.print=()=>{};});return p;};
  const own=p=>p.evaluate(()=>nbhBridge.ownSave());
  const snap=p=>p.evaluate(()=>JSON.stringify(nbhBridge.snapshot()));
  const openFile=(p,sel,obj)=>p.evaluate(([s,t])=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector(s);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},[sel,typeof obj==='string'?obj:JSON.stringify(obj)]);
  const setM=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},s);
  const download=async(p,sel)=>{const [d]=await Promise.all([p.waitForEvent('download'),p.evaluate(s=>document.querySelector(s).click(),sel)]);return {name:d.suggestedFilename(),text:require('fs').readFileSync(await d.path(),'utf8')};};

  /* ================= GC-1 (F278) ================= */
  const g=await open(GC,'GC-1');
  await g.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  await g.evaluate(()=>{setType('dep');['dp_agree','dp_reach','dp_peers','dp_exit'].forEach(k=>{S.chk[k]=true;});renderAll();});
  await setM(g,'dp_who','M.R.');await setM(g,'dp_beh','hand raised before speaking in 8 of 10 opportunities, from the student’s plan');
  await setM(g,'crit','8');   /* v22.74 (review F280): the number the Record scores agrees with the written goal, or the Design sheet warns */
  await setM(g,'dp_named','No: the class is told that one or more classmates will earn for everyone (names not given)');await sleep(400);
  let po=await txt(g,'#posterOut');
  ok('1 GC-1 dependent, not named: the poster has no initials and no goal, and says "our class goal"',!/M\.R\.|hand raised before speaking|names not given/.test(po)&&/our class goal/.test(po),po.slice(0,400));
  ok('2 the reason is on screen (Poster page and Design sheet), and the Design rule keeps the initials',/names no student and shows no individual goal/.test(await txt(g,'#gcPosterWhy'))&&/not recorded as Yes/.test(await txt(g,'#dpWhy'))&&/M\.R\./.test(await txt(g,'#ruleOut'))&&/Ready to post/.test(await txt(g,'#designVerdict')),[await txt(g,'#gcPosterWhy'),await txt(g,'#designVerdict')]);
  ok('3 the parent-consent decision is asked, with its date (Yes / No / Not asked yet)',await g.evaluate(()=>[...document.querySelectorAll('[data-m="dp_parent"] option')].map(o=>o.value).join('|'))==='|yes|no|nr'&&!!(await g.$('[data-m="dp_pdate"]')));
  await setM(g,'dp_named','Yes, with the student’s agreement, and framed as the student earning for the class');await sleep(300);
  po=await txt(g,'#posterOut');
  ok('4 named to the class but no parent agreement: still no initials or goal on the poster, and the verdict asks for it',!/M\.R\.|hand raised before speaking/.test(po)&&/written agreement \(Yes, with its date\) is not recorded/.test(await txt(g,'#designVerdict')),await txt(g,'#designVerdict'));
  await setM(g,'dp_parent','yes');await sleep(300);
  ok('5 Yes without its date: still left out, the reason says the date is missing',!/M\.R\./.test(await txt(g,'#posterOut'))&&/date of the parent/.test(await txt(g,'#gcPosterWhy')));
  await setM(g,'dp_pdate','10/12/2026');await sleep(300);
  po=await txt(g,'#posterOut');
  ok('6 Yes in writing, dated: the poster names the student and shows the goal, and says why',/M\.R\. meets this goal: hand raised before speaking/.test(po)&&/parent agreed in writing on 10\/12\/2026/.test(await txt(g,'#gcPosterWhy'))&&/Ready to post/.test(await txt(g,'#designVerdict')),po.slice(0,300));
  await setM(g,'dp_parent','no');await sleep(300);
  ok('7 the parent said No: left out, and the verdict says to choose not named',!/M\.R\./.test(await txt(g,'#posterOut'))&&/parent said No to naming/.test(await txt(g,'#designVerdict')));
  const scb=await g.evaluate(()=>document.querySelector('#posterOut .po-goal').textContent);
  ok('8 the scoreboard says "our class goal", without the student’s number',/our class goal/.test(scb),scb);

  /* ================= GC-1 (F279) ================= */
  await g.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  ok('9 Setup asks for this student’s plan and a count of others; the simulation keeps the other student on the class sheet',await g.evaluate(()=>!!document.querySelector('[data-m="plan_me"]')&&!!document.querySelector('[data-m="plans_n"]')&&!document.querySelector('[data-m="plans"]')&&/M\.A\./.test(CL.plans)&&/M\.A\./.test(document.querySelector('gc-text[data-cl="plans"]').textContent)));
  let o=await own(g),sn=await snap(g);
  const OTHER=/M\.A\. \(TD-1|DRA for hand-raising|M\.A\.’s own case/;   /* the other student (the BCBA's "M.A." degree is not one) */
  ok('10 Save data (the case file’s copy) and the snapshot of the fields hold no other student',!OTHER.test(o)&&!OTHER.test(sn)&&!/"plans"/.test(o)&&/"v": 2/.test(o),{own:OTHER.test(o),snap:OTHER.test(sn)});
  const cls=await download(g,'#gcClassSave');
  ok('11 Save class sheet: a file of its own, with the other student',/^GC-1_class-sheet_/.test(cls.name)&&JSON.parse(cls.text).form==='GC-1 class sheet'&&/M\.A\./.test(cls.text),cls.name);
  await g.evaluate(()=>{CL={plans:'',notreach:'',members:''};renderClass();});await openFile(g,'#gcClassIn',cls.text);await sleep(400);
  ok('12 Open class sheet brings it back',await g.evaluate(()=>/M\.A\./.test(CL.plans)&&/M\.A\./.test(document.querySelector('gc-text[data-cl="plans"]').textContent)));
  await g.evaluate(()=>document.querySelector('#gcClassPrint').click());await sleep(150);
  const cp=await g.evaluate(()=>({on:document.body.classList.contains('gc-class-only'),t:document.querySelector('#gcClassOut').textContent}));
  ok('13 Print class sheet prints it on its own, as a class record',cp.on&&/M\.A\./.test(cp.t)&&/A class record, not a student/.test(cp.t),cp);
  await g.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await sleep(100);
  ok('14 after printing, the class sheet is not left on the page',await g.evaluate(()=>!document.body.classList.contains('gc-class-only')&&!document.querySelector('#gcClassOut').textContent));
  /* an older file */
  const oldGC={form:'GC-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{cls:'Room 12 (simulated)',plans:'D.R. (TD-1, escape) and M.A. (TD-1, attention)',notreach:'M.A. lost the game for the Blue Jays twice'},chk:{},type:'gbg',exp:[],menu:[],teams:[],log:[],fl:[]}};
  await g.evaluate(()=>{CL={plans:'',notreach:'',members:''};renderClass();});await openFile(g,'#fileIn',oldGC);await sleep(500);
  o=await own(g);
  ok('15 an older file opens; its other-student answers move to the class sheet, out of Save data, and the Setup page says so',await g.evaluate(()=>S.meta.cls==='Room 12 (simulated)'&&!('plans' in S.meta)&&!('notreach' in S.meta)&&/M\.A\./.test(CL.plans)&&/lost the game/.test(CL.notreach))&&!/M\.A\./.test(o)&&/moved to the class sheet/.test(await txt(g,'#gcMoved')),await txt(g,'#gcMoved'));
  ok('16 the Guide section is the packet’s #guide (left out of the master print)',await g.evaluate(()=>document.querySelector('section.only-guide').id==='guide'));
  await g.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);
  await g.evaluate(()=>nbhCase.apply({behaviors:[{label:'Calling out',def:'speaking to the class without a hand up'}],fn:{key:'attention',label:'Attention'},goals:{red:[{text:'Calling out at or below 2 per math block for 3 weeks'}],acq:[]}}));await sleep(300);
  ok('16b this student’s plan comes from the case when it is empty',await g.evaluate(()=>S.meta.plan_me==='Calling out; function: Attention; plan goal: Calling out at or below 2 per math block for 3 weeks (from the case)'&&!clHas()),await g.evaluate(()=>S.meta.plan_me));
  await g.close();

  /* ---- GC-1 inside the workstation: what it hands over ---- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));
  await sh.goto(W+'index.html');await sleep(1200);await sh.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  await sh.evaluate(()=>openForm('GC-1'));await sh.waitForFunction(()=>!!state.status['GC-1'],null,{timeout:30000});await sleep(1200);
  const gf=sh.frames().find(f=>/GC-1_Group/.test(f.url()));
  await gf.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(800);
  const hand=await sh.evaluate(async()=>{const c=await grab('GC-1','collect',undefined,6000);const s=await grab('GC-1','snapshot',undefined,6000);const f=await grab('GC-1','facts?',undefined,4000);
    const shaped=c?packetShape(c,0,packetOpts(),{}):null;return {html:shaped?shaped.html:'',snap:JSON.stringify(s||{}),facts:JSON.stringify(f||{})};});
  ok('17 workstation: the packet section, the case snapshot and the facts-out hold no other student and no class sheet',hand.html.length>2000&&!OTHER.test(hand.html+hand.snap+hand.facts)&&!/Class Sheet/.test(hand.html),{len:hand.html.length,m:OTHER.test(hand.html),s:OTHER.test(hand.snap)});
  ok('18 workstation: the packet leaves GC-1’s Guide out',!/What the Research Supports|Ethical Cautions/.test(hand.html));
  await sh.close();

  /* ================= HD-1 (F368) ================= */
  const h=await open(HD,'HD-1');
  const note=await txt(h,'.nbh-savenote'),body=await h.evaluate(()=>document.body.innerText);
  ok('19 HD-1: the note under the title says Autosave keeps a copy on this device for up to 14 days (the F478 wording); nothing says nothing is stored',/Autosave keeps a safety copy of this form in this browser, on this device, for up to 14 days/.test(note)&&!/Nothing is stored in the browser|close the tab and they are gone/i.test(body),note);
  const opts=await h.evaluate(()=>[...document.querySelectorAll('[data-m="ret_how"] option')].map(o=>o.textContent));
  ok('20 HD-1: no "photo by text message"; the photo choices go to a district number or email',!opts.some(x=>/by text message/.test(x))&&opts.some(x=>/district phone number/.test(x))&&opts.some(x=>/district email/.test(x)),opts);
  await setM(h,'ret_how','A photo of the sheet, texted to a district phone number');await sleep(300);
  ok('21 a photo chosen: the Setup page says district only, save to the district drive, delete from the phone; and asks for the number',/district phone number or a district email only/.test(await txt(h,'#hdRetNote'))&&/delete it from the phone/.test(await txt(h,'#hdRetNote'))&&/Name the district number or email/.test(await txt(h,'#setupVerdict')));
  await h.evaluate(()=>document.querySelector('#simBtn').click());await sleep(600);
  const foot=await h.evaluate(()=>(document.querySelector('#sheetOut .hs-foot')||{}).textContent||'');
  ok('22 the simulation sends the photo to the school’s district number, printed on the family’s sheet',await h.evaluate(()=>/district phone/.test(S.meta.ret_how)&&!/by text/.test(S.meta.feedback))&&/555-0100, the school office/.test(foot),foot);
  await openFile(h,'#fileIn',{form:'HD-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Mateo Rivera (simulated)',sid:'4471823',ret_how:'A photo of the sheet by text message'},chk:{},bh:[],rt:[],sk:[],ag:[],wk:[]}});await sleep(500);
  ok('23 an older file’s "by text message" opens as the district-number choice',await h.evaluate(()=>S.meta.client==='Mateo Rivera (simulated)'&&S.meta.ret_how==='A photo of the sheet, texted to a district phone number'&&document.querySelector('[data-m="ret_how"]').value===S.meta.ret_how));
  await h.close();

  /* ================= IM-1 (F448) ================= */
  const m=await open(IM,'IM-1');
  await m.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
  await m.evaluate(()=>document.querySelector('#imCare button[data-careedit="0"]').click());await sleep(300);
  o=await own(m);sn=await snap(m);
  const scr=await txt(m,'#imCareEdit');
  ok('24 IM-1: the record of the report is on the screen',/SIM-0000/.test(scr)&&await m.evaluate(()=>/SIM-0000/.test(S.care[0].rep.to)));
  ok('25 Save data (the case file’s copy) holds no reason, no hotline, no reference and no reporter; it marks them kept apart',!/SIM-0000|State child abuse hotline|the person who noticed it|One bite mark, seen to happen/.test(o)&&JSON.parse(o).S.care[0].rep.kept===true&&JSON.parse(o).S.care[0].rep.need==='yes');
  ok('26 the snapshot of the fields (also in the case file) holds none of it either',!/SIM-0000|State child abuse hotline|the person who noticed it/.test(sn));
  ok('27 the report record (printed on its own) holds it',/SIM-0000/.test(await m.evaluate(()=>window.__imRepRecord())));
  ok('28 the Guide and the report record say what is kept where',/never saved with this form/.test(await txt(m,'#imGuideSafety'))&&!/stay on the screen\. On paper/.test(await txt(m,'#imGuideSafety'))&&/kept only here/.test(await m.evaluate(()=>window.__imRepRecord())));
  const rr=await download(m,'button.imRepSave');
  ok('29 Save the report record: a file of its own',/^IM-1_report-record_/.test(rr.name)&&JSON.parse(rr.text).form==='IM-1 report record'&&/SIM-0000/.test(rr.text),rr.name);
  await openFile(m,'#fileIn',o);await sleep(600);
  ok('30 the data file reopened: the record is not there, and the care log says it is kept apart (nothing asked again)',await m.evaluate(()=>!S.care[0].rep.to&&S.care[0].rep.kept===true&&!__nbhFactsOut().injury.open.some(x=>/Record the report/.test(x.what))&&!/still needs its report recorded/.test(document.querySelector('#imCareVerdict').textContent)));
  await openFile(m,'#imRepIn',rr.text);await sleep(500);
  ok('31 Open a report record puts it back on the screen',await m.evaluate(()=>/SIM-0000/.test(S.care[0].rep.to)&&/the person who noticed it/.test(S.care[0].rep.by)));
  const oldIM={form:'IM-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Mateo Rivera (simulated)',consent:'yes'},chk:{},healed:[],events:[],cur:{rows:[]},hist:[],nurse:[],
    care:[{id:'c1',date:'9/20/2026',time:'10:00',area:'buttocks',task:'help with toileting',seen:'A small bruise (simulated)',by:'Jordan Lee (simulated)',byRole:'Aide',second:'Dana Whitfield',secondRole:'Teacher',nurse:'Told at 10:15',
      rep:{r3:true,need:'yes',on:'9/20/2026',when:'9/20/2026, 10:30 AM',to:'Hotline (simulated), reference SIM-1111',by:'Jordan Lee (simulated)',told:'Iris Calloway'}}]}};
  await openFile(m,'#fileIn',oldIM);await sleep(600);
  o=await own(m);
  ok('32 an older file that holds a report record opens, with it on the screen; the next save leaves it out',await m.evaluate(()=>S.meta.client==='Mateo Rivera (simulated)'&&S.care.length===1&&S.care[0].rep.to==='Hotline (simulated), reference SIM-1111'&&/Hotline \(simulated\)/.test(document.querySelector('#imCare tbody').textContent))&&!/SIM-1111|Jordan Lee \(simulated\)","told|Iris Calloway/.test(o)&&/SIM-1111/.test(await m.evaluate(()=>window.__imRepRecord())));

  /* ================= IM-1 (F449) ================= */
  await m.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
  const yes=await m.evaluate(()=>({due:__nbhDue().length,open:__nbhFactsOut().injury.open.filter(x=>/SIT Scale/.test(x.what)).length}));
  ok('33 with Yes the re-examination is due, here and for the workstation',yes.due>=1&&yes.open>=1,yes);
  await setM(m,'consent','no');await sleep(400);
  const no=await m.evaluate(()=>({due:__nbhDue(),open:__nbhFactsOut().injury.open.filter(x=>/SIT Scale|re-examination|intake/.test(x.what)),sched:document.querySelector('#imSched').textContent,hist:document.querySelector('#imSchedHist').textContent,setup:document.querySelector('#setupVerdict').textContent}));
  ok('34 the parent said No: nothing due (the Today list and the calendar read this), and the form says No instead of asking',!no.due.length&&!no.open.length&&/No scheduled checks/.test(no.sched)&&/No scheduled checks/.test(no.hist)&&!/overdue|\(due\)/.test(no.sched)&&/The parent said No to injury checks/.test(no.setup),no);
  await setM(m,'consent','');await sleep(400);
  const wait=await m.evaluate(()=>({due:__nbhDue(),open:__nbhFactsOut().injury.open.filter(x=>/SIT Scale/.test(x.what)),sched:document.querySelector('#imSched').textContent}));
  ok('35 no decision yet: the checks are listed as waiting, none due or overdue',!wait.due.length&&!wait.open.length&&/waiting for the parent/.test(wait.sched)&&!/overdue/.test(wait.sched),wait);
  await setM(m,'consent','no');await m.evaluate(()=>{newAdm();});await sleep(300);
  await m.evaluate(()=>{S.cur.second='Dana Whitfield';S.cur.secondRole='Teacher';S.cur.present=true;S.cur.assent='yes';S.cur.note='';bindAdm();});
  const n0=await m.evaluate(()=>S.hist.length);await m.evaluate(()=>saveAdm());await sleep(300);
  ok('36 with No, Save to history files nothing without a reason under Conditions',await m.evaluate(()=>S.hist.length)===n0);
  await m.evaluate(()=>{S.cur.note='A scratch seen in class; written down without an examination (simulated)';bindAdm();});await m.evaluate(()=>saveAdm());await sleep(300);
  ok('37 with the reason it is filed, marked as written down without the parent’s Yes',await m.evaluate(()=>S.hist.length)===n0+1&&await m.evaluate(()=>S.hist[S.hist.length-1].pc==='no')&&/without the parent.s Yes/.test(await txt(m,'#imHist tbody')));
  await m.close();
  /* the decision from Form IC-1 */
  const f=await open(IM,'IM-1 (case)');
  const ic=(dec,extra)=>Object.assign({src:'IC-1',state:'Current',on:true,method:'sign',kind:'initial',obtained:'2026-10-12',date:'2026-10-12',procs:[],covered:[],dec:{ij:{dec,when:'',who:'',date:'2026-10-12'}},v:2},extra||{});
  await f.evaluate(c=>nbhCase.apply({consent:c}),ic('no'));await sleep(300);
  ok('38 from Form IC-1 (dec.ij No): the empty fields are filled, marked with the source',await f.evaluate(()=>S.meta.consent==='no'&&S.meta.consentDate==='10/12/2026 (Form IC-1, Specific procedures E)'&&document.querySelector('[data-m="consent"]').value==='no'&&!__nbhDue().length));
  await f.evaluate(c=>nbhCase.apply({consent:c}),ic('yes'));await sleep(200);
  ok('39 a decision already recorded is never overwritten',await f.evaluate(()=>S.meta.consent==='no'));
  await f.evaluate(()=>{S.meta.consent='';S.meta.consentDate='';renderAll();});await f.evaluate(c=>nbhCase.apply({consent:c}),ic('yes'));await sleep(200);
  ok('40 dec.ij Yes with consent on file reads Yes',await f.evaluate(()=>S.meta.consent==='yes'&&/Form IC-1, Specific procedures E/.test(S.meta.consentDate)));
  await f.evaluate(()=>{S.meta.consent='';S.meta.consentDate='';renderAll();});await f.evaluate(c=>nbhCase.apply({consent:c}),ic('yes',{state:'Revoked',on:false,ended:'2026-10-15'}));await sleep(200);
  ok('41 consent revoked on IC-1 reads No, whatever E said',await f.evaluate(()=>S.meta.consent==='no'&&/^10\/15\/2026 \(Form IC-1, Specific procedures E; consent revoked\)$/.test(S.meta.consentDate)),await f.evaluate(()=>S.meta.consentDate));
  await f.close();
  ok('42 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
