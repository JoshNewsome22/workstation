/* v21.44 policy and safety (B1, B4, B5), with the review's fixes.
   CR-1: the breathing rule on every plan (and in Copy for the BIP), the adult who watches and what to do when no other
   adult is there yet, the debriefing's breathing line, "report first", and Does This Need a Report?: its wording, its
   verdicts (a tick with No is amber and needs a reason), the answer kept off paper, out of Copy for the BIP and out of
   the workstation's spreadsheet, the report record printed on its own, and the warning when the debriefing moves to
   another restraint. IM-1: two adults at every check (named, someone else, with a role, ticked present, never filled in
   unasked), the student's assent and a check that stops, the parent's decision, the private areas (the buttocks never
   examined, the side of the hip checked), the care path (the two-adult exception, a draft counted as open), the report
   question and its record, the CSV. IC-1: part 4's privacy bullets, card E, the revision and the note on an older
   consent, the Student Assent sheet's line. SI-1: the read-aloud box and the adult's note under it. Each: on screen,
   in the Guide, in print, saved and reopened, and a file saved before the change opens.
   Usage: WS_URL=http://127.0.0.1:8123 WS_ROOT=<checkout> node qa/policy-safety-test.js [NBH-Workstation|RPS-Workstation] */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/policy-safety/';fs.mkdirSync(OUT,{recursive:true});
const FILES={'CR-1':'CR-1_Crisis-Intervention-Plan_v2026-09.html','IM-1':'IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html',
  'IC-1':'IC-1_Informed-Consent-FBA-BIP_v2026-09.html','SI-1':'SI-1_Student-Interview-and-Assent_v2026-10.html'};
let fails=0,count=0;
const check=(c,msg,extra)=>{count++;console.log((c?'  ok   ':'  FAIL ')+msg+(!c&&extra!==undefined?' :: '+String(typeof extra==='string'?extra:JSON.stringify(extra)).slice(0,400):''));if(!c)fails++;};
const TODAY=(()=>{const d=new Date();return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();})();
/* files saved before the change, in the shapes those versions wrote */
const OLD={
  'CR-1':{form:'CR-1',rev:'2026-09',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',dbeh:'Striking staff',rStaff:'Aide A (trained 8/1/26)',hAvoid:'No holds from behind',dbInjury:'None'},
    team:[{n:'Parent',r:'Parent',g:'Parent or guardian',p:'Yes'}],pbis:[{s:'Prevention (before any sign)',do:'Timer in view',next:'',who:'Teacher'}],act:[],log:[{d:'9/2/26',dur:'20 s',set:'Room 4',staff:'Aide A',rep:'Yes',deb:'Yes',pre:'Demand'}],notify:{},closed:[]}},
  'IM-1':{form:'IM-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',examiner:'School nurse (RN)'},chk:{t_head:true},healed:[],events:[],
    cur:{id:'',date:'9/1/2026',time:'08:00',examiner:'School nurse (RN)',note:'',ro:false,rows:[{loc:'genitalia',n:'1',type:'AL',sev:'1',kind:'',note:'recorded before the rule',view:'',x:'',y:''},{loc:'hand_R',n:'1',type:'AL',sev:'1',kind:'bite',note:'',view:'front',x:60,y:277},{loc:'hips',n:'1',type:'CT',sev:'1',kind:'',note:'on the buttock, before the rule',view:'back',x:110,y:208}]},
    hist:[{id:'aold1',date:'8/1/2026',time:'08:00',examiner:'School nurse (RN)',note:'intake',rows:[{loc:'hand_R',n:'2',type:'AL',sev:'2',kind:'bite',note:'',view:'front',x:60,y:277},{loc:'hips',n:'1',type:'CT',sev:'1',kind:'',note:'side of the hip',view:'front',x:69,y:207}]}],nurse:[]}},
  'IC-1':{form:'IC-1',rev:'2026-09',saved:'2026-09-30T14:00:00.000Z',counts:{log:6,att:3},fields:{'c.client':'Old Record Student','c.parent':'Old Parent','c.method':'sign','c.decision':'yes','fa.dec':'no','fa.init':'OP','sh.dec':'na','p.records':true}},
  'SI-1':{form:'SI-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',ver:'young',beh:'when I get loud'},chk:{m_verbal:true},iv:{},hard:[],ab:[],wb:[],al:[],pc:[],pr:[]}}
};
async function openPage(ctx,id,log){const page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+FILES[id]);await sleep(700);
  await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};
    const o=URL.createObjectURL;URL.createObjectURL=b=>{if(b&&b.text)b.text().then(t=>{window.__saved=t;});return o(b);};});
  return page;}
async function saveText(page){await page.evaluate(()=>{window.__saved=null;document.querySelector('#saveBtn').click();});await sleep(400);return page.evaluate(()=>window.__saved);}
async function csvText(page){await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(400);return (await page.evaluate(()=>window.__saved))||'';}
async function openText(page,text){await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(500);}
const view=async(page,v)=>{await page.evaluate(x=>document.querySelector('#viewSeg button[data-view="'+x+'"]').click(),v);await sleep(150);};
const shown=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0;},sel);
const text=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},sel);
async function printShown(page,sels){await page.emulateMedia({media:'print'});const r={};for(const s of sels)r[s]=await shown(page,s);await page.emulateMedia({media:'screen'});return r;}
/* the text a printed page carries: what is visible in print media */
async function printedText(page){await page.emulateMedia({media:'print'});const t=await page.evaluate(()=>document.querySelector('main.sheet, .sheet').innerText||'');await page.emulateMedia({media:'screen'});return t.replace(/\s+/g,' ');}
/* the master print's copy of the form (the bridge's collect verb), as the workstation receives it */
const collect=page=>page.evaluate(()=>new Promise(res=>{const h=e=>{if(e.data&&e.data.nbh==='payload'){window.removeEventListener('message',h);res(e.data.html||'');}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');setTimeout(()=>res(null),3000);}));
/* press a form's own Print the report record with the print dialog stubbed; read the record while it is up */
async function repRecord(page,btn,rec){await page.evaluate(b=>{window.__printed=0;window.print=()=>{window.__printed++;};document.querySelector(b).click();},btn);await sleep(200);
  await page.emulateMedia({media:'print'});
  const r=await page.evaluate(rec=>({rec:document.querySelector(rec).innerText.replace(/\s+/g,' '),alone:[...document.querySelectorAll('main.sheet > section')].every(s=>!s.getClientRects().length),recShown:document.querySelector(rec).getClientRects().length>0,printed:window.__printed,
    foot:[...document.querySelectorAll('style')].some(s=>/Report record: confidential/.test(s.textContent))}),rec);
  await page.emulateMedia({media:'screen'});await sleep(1700);
  r.after=await page.evaluate(rec=>document.querySelector(rec).innerHTML===''&&!/rep-only/.test(document.body.className)&&![...document.querySelectorAll('style')].some(s=>/Report record: confidential/.test(s.textContent)),rec);
  return r;}
const setVal=(page,sel,v)=>page.evaluate(([s,x])=>{const e=document.querySelector(s);if(!e)throw new Error('no '+s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
const tick=(page,sel,on)=>page.evaluate(([s,x])=>{const e=document.querySelector(s);if(!e)throw new Error('no '+s);if(e.checked!==x){e.checked=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},[sel,on]);
const cls=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s+' .verdict');return e?e.className:'';},sel);

(async()=>{
  const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:900}});
  /* ======================================================================== CR-1 */
  {console.log('\n=== CR-1 ('+ED+')');const log=[];const page=await openPage(ctx,'CR-1',log);
    await view(page,'plan');
    const b=await text(page,'#crBreath');
    check(await shown(page,'#crBreath'),'the breathing rule shows on the plan sheet');
    ['No hold may restrict breathing','chest, back, stomach or neck','face-down (prone) or face-up (supine)','folds the student forward (chest toward the knees)','crosses their arms tight over the chest','mouth or nose','not part of the hold watches',
     'If no other adult is there yet: call for help at once','lets go at the first danger sign','Let go at once, and get medical help','a trained adult starts CPR while someone calls 911'].forEach(p=>check(b.includes(p),'breathing rule says: '+p,b));
    const signs=await page.$$eval('#crSigns li',l=>l.map(x=>x.textContent));
    check(signs.length===9,'nine danger signs listed',signs);
    [/struggles to breathe/,/cannot breathe/,/suddenly fights the hold harder, or suddenly goes quiet or still/,/gurgling or rasping/,/changes color/,/vomits/,/seizure/,/stops responding/,/goes limp/].forEach(re=>check(signs.some(s=>re.test(s)),'danger sign: '+re.source));
    check(/Florida law also bars restraint that may restrict breathing or blood flow/.test(b)&&/This rule goes further/.test(b)&&/Restraint and Seclusion: Resource Document/.test(b)&&/district/.test(b)&&!/form.s own/.test(b),'the source line names Florida law, then the federal guidance and the district',b.slice(-400));
    check(/restricts breathing/.test(await page.evaluate(()=>document.querySelector('.prohib').textContent)),'the prohibited list names breathing');
    check(/any hold that restricts breathing/.test(await page.evaluate(()=>document.querySelector('[data-m="hAvoid"]').closest('td').textContent)),'positions and holds to avoid: the breathing rule is always ruled out');
    check(/breathing rule/.test(await page.evaluate(()=>document.querySelector('#pbisTbl').closest('.grid-wrap').nextElementSibling.textContent)),'the intervention sequence points to the breathing rule');
    check(/No adult is named/.test(await text(page,'#breathVerdict')),'no watching adult named: the plan says so');
    await setVal(page,'[data-m="rWatch"]','Second adult in the room');await sleep(100);
    check(/Named to watch the breathing from outside the hold: Second adult in the room/.test(await text(page,'#breathVerdict')),'the watching adult named: the verdict follows');
    /* the debriefing */
    await setVal(page,'[data-m="client"]','Test Student');
    await view(page,'deb');
    check(await page.$('[data-m="dbBreath"]')!==null,'debriefing asks about breathing during the hold');
    const first=await text(page,'#crRepFirst');
    check(/make the report first/.test(first)&&/Do not then ask the student or the adults involved about it; investigators do that/.test(first),'the debriefing says: report first, then ask no one about it',first);
    check(await page.evaluate(()=>{const f=document.querySelector('#crRepFirst'),a=document.querySelector('[data-m="dbStudent"]');return !!(f.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING);}),'"report first" comes before the student’s account');
    check(await shown(page,'#crRep'),'Does This Need a Report? shows on the debriefing sheet');
    const rp=await text(page,'#crRep');
    check((await page.$$('#crRep input[type=checkbox][data-mc]')).length===6,'six reasons to tick (private area and pattern apart)');
    ['Any of these can be a reason to suspect abuse or neglect','An injury is in a private area (genitals, buttocks, breasts).','An injury has a pattern','Do you suspect abuse or neglect?','You do not need proof. If you are not sure, report.','the person who suspects it','does not take the place of your own report',
     'right away, as soon as you suspect it','Do not wait for a meeting or the end of the day',"Your state’s law and your agency’s policy set the exact rule",'Do not investigate','To whom','By whom','One debriefing at a time'].forEach(p=>check(rp.includes(p),'report question says: '+p,rp.slice(0,200)));
    check(!/§|F\.S\.|Fla\. Stat|the same day|A report is needed if/.test(rp),'the report question cites no statute and states no legal conclusion');
    check(await page.evaluate(()=>[...document.querySelectorAll('[data-m="rpNeed"] option')].map(o=>o.textContent).join('|'))==='|Yes: a report is being made|No: say why','the answers read "Yes: a report is being made" and "No: say why"');
    check(/Not answered yet/.test(await text(page,'#rpVerdict')),'blank: not answered yet');
    await tick(page,'[data-mc="rpR1"]',true);await sleep(100);
    check(/v-no/.test(await cls(page,'#rpVerdict'))&&/Answer the question now/.test(await text(page,'#rpVerdict')),'a tick and no answer: red, answer the question now');
    await setVal(page,'[data-m="rpNeed"]','no');await sleep(100);
    check(/v-mid/.test(await cls(page,'#rpVerdict'))&&/The answer is No, and a box above is ticked/.test(await text(page,'#rpVerdict'))&&/Write why/.test(await text(page,'#rpVerdict')),'a tick with No: amber, and a reason is asked for',await text(page,'#rpVerdict'));
    check(await page.evaluate(()=>S.meta.rpOn)===TODAY.replace(/\/(\d{4})$/,'/$1'),'answering stamps the day it was answered',await page.evaluate(()=>S.meta.rpOn));
    await setVal(page,'[data-m="rpWhy"]','fell in the gym, seen by the teacher');await sleep(100);
    check(/v-mid/.test(await cls(page,'#rpVerdict'))&&/The reason given: fell in the gym/.test(await text(page,'#rpVerdict')),'a tick with No and a reason: still amber, with the reason shown');
    await setVal(page,'[data-m="rpWhy"]','fell in the gym, seen by the teacher.');await sleep(100);
    check(/seen by the teacher\. If you are not sure, report\./.test(await text(page,'#rpVerdict')),'a reason that ends with a full stop is not given a second one',await text(page,'#rpVerdict'));
    await setVal(page,'[data-m="rpWhy"]','fell in the gym, seen by the teacher');await sleep(100);
    await tick(page,'[data-mc="rpR1"]',false);await sleep(100);
    check(/v-ok/.test(await cls(page,'#rpVerdict'))&&/No report: fell in the gym/.test(await text(page,'#rpVerdict')),'no tick, No and a reason: green');
    await tick(page,'[data-mc="rpR5"]',true);await setVal(page,'[data-m="rpNeed"]','yes');await sleep(100);
    check(/Still to record: when, to whom, by whom/.test(await text(page,'#rpVerdict')),'Yes: still to record when, to whom, by whom');
    await setVal(page,'[data-m="rpWhen"]','9/14/26, 2:10 PM');await setVal(page,'[data-m="rpTo"]','HOTLINE-REF-123');await setVal(page,'[data-m="rpBy"]','Aide Bee');await sleep(100);
    check(/v-ok/.test(await cls(page,'#rpVerdict'))&&/Report recorded: made 9\/14\/26, 2:10 PM to HOTLINE-REF-123, by Aide Bee/.test(await text(page,'#rpVerdict')),'complete: report recorded');
    check(await page.evaluate(()=>S.meta.rpOn)!==''&&await page.evaluate(()=>document.querySelector('[data-m="rpOn"]').value===S.meta.rpOn),'the day answered is kept in its hidden field too');
    /* print: the answer stays off the printed plan; the report record prints on its own */
    const pr=await printShown(page,['#crBreath','#crSigns','#crRepFirst','#crRep','#crRepPaper','#breathVerdict']);
    check(pr['#crBreath']&&pr['#crSigns']&&pr['#crRepFirst']&&pr['#breathVerdict'],'print: the breathing rule, its verdict and "report first" print',pr);
    check(!pr['#crRep']&&pr['#crRepPaper'],'print: the report question does not print; one line in its place',pr);
    check(/Does this need a report\? Answered on \d+\/\d+\/\d+\. The answer, and any report, are kept apart from this plan/.test(await text(page,'#crRepPaper')),'print: the line says only that it was answered, and when',await text(page,'#crRepPaper'));
    const pt=await printedText(page);
    check(!/HOTLINE-REF-123|Aide Bee|fell in the gym/.test(pt),'print: no part of the answer or the report is on paper');
    const col=await collect(page);
    check(col!==null&&!/HOTLINE-REF-123|Aide Bee/.test(col)&&/Does this need a report\? Answered/.test(col),'the master print’s copy leaves the report out too',col===null?'no reply':'');
    const rr=await repRecord(page,'#crRepPrint','#crRepRec');
    check(rr.printed===1&&rr.alone&&rr.recShown&&rr.foot,'Print the report record prints the record alone, with its own page footer',rr);
    check(/Report Record: Confidential/.test(rr.rec)&&/Not part of the student.s file/.test(rr.rec)&&/HOTLINE-REF-123/.test(rr.rec)&&/Aide Bee/.test(rr.rec)&&/Test Student/.test(rr.rec)&&/Yes: a report is being made/.test(rr.rec),'the report record holds the student, the reasons, the answer and the report',rr.rec.slice(0,300));
    check(rr.after,'after printing, the record is emptied and the page is itself again');
    /* the workstation's spreadsheet */
    const csv=await csvText(page);
    check(/"Entry","Value"/.test(csv)&&/Adult who watches the breathing \(not part of the hold\)","Second adult in the room"/.test(csv),'the spreadsheet’s CSV writes the entries by their labels',csv.slice(0,200));
    check(!/HOTLINE-REF-123|Aide Bee|rpTo|rpBy|Do you suspect/.test(csv),'the spreadsheet’s CSV leaves the report record out');
    check(await page.evaluate(()=>{const b=document.querySelector('#csvBtn');return !!b&&b.hidden&&!b.closest('.toolbar');}),'its button has no place on the toolbar');
    /* save and reopen */
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.S.meta.rpR5==='1'&&d.S.meta.rpNeed==='yes'&&d.S.meta.rpTo==='HOTLINE-REF-123'&&d.S.meta.rWatch==='Second adult in the room'&&!!d.S.meta.rpOn,'saved: the tick, the answer, the report, the day and the watching adult',d.S.meta);
    await page.evaluate(()=>{S=blank();renderAll();});
    check(await page.evaluate(()=>!document.querySelector('[data-mc="rpR5"]').checked),'cleared: the tick is off');
    await openText(page,saved);
    check(await page.evaluate(()=>document.querySelector('[data-mc="rpR5"]').checked&&document.querySelector('[data-m="rpNeed"]').value==='yes'&&document.querySelector('[data-m="rWatch"]').value==='Second adult in the room'),'reopened: the tick, the answer and the watching adult are back');
    /* one debriefing at a time */
    await page.evaluate(()=>{S.meta.dbDate='9/14/26, 1:00 PM';S.meta.rpFor='the incident of 9/14/26, 1:00 PM';renderAll();});
    check(!/These answers were given for/.test(await text(page,'#rpVerdict')),'answers for this debriefing: no warning');
    await setVal(page,'[data-m="dbDate"]','10/1/26, 9:30 AM');await sleep(120);
    check(/These answers were given for the incident of 9\/14\/26, 1:00 PM/.test(await text(page,'#rpVerdict'))&&/Print the report record of the earlier one first/.test(await text(page,'#rpVerdict')),'the debriefing moves to another incident: the answers are said to belong to the earlier one',await text(page,'#rpVerdict'));
    await page.evaluate(()=>document.querySelector('#crRepClear').click());await sleep(200);
    check(await page.evaluate(()=>!S.meta.rpNeed&&!S.meta.rpTo&&!S.meta.rpR5&&!S.meta.rpOn&&!S.meta.rpFor&&!document.querySelector('[data-mc="rpR5"]').checked),'Clear the answers clears them, after asking');
    check(/Not answered yet/.test(await text(page,'#rpVerdict')),'cleared: not answered yet');
    /* Copy for the BIP: the rule goes in, the report stays out */
    await openText(page,saved);
    const bip=await page.evaluate(()=>window.__bipText());
    check(bip.includes('BREATHING: NO HOLD MAY RESTRICT IT')&&bip.includes('No face-down (prone) or face-up (supine) holds')&&bip.includes('folds the student forward')&&bip.includes('If no other adult is there yet')&&bip.includes('starts CPR')&&bip.includes('Adult who watches the breathing (not part of the hold): Second adult in the room'),'Copy for the BIP carries the breathing rule and the watching adult',bip.slice(0,300));
    check(!bip.includes('HOTLINE-REF-123')&&!/report is being made|Does this need a report|Do you suspect/i.test(bip),'Copy for the BIP leaves the report out');
    check(!/^[^\n]*:\s*$/m.test(bip)&&!/\n{3,}/.test(bip),'Copy for the BIP: no empty label, single blank lines');
    await page.evaluate(()=>{S=blank();renderAll();});
    check((await page.evaluate(()=>window.__bipText())).split('\n').filter(Boolean).length<=2,'Copy for the BIP of an empty plan is the title only');
    /* the Guide (the Statute sheet) */
    await view(page,'guide');
    const g=await text(page,'section.only-guide');
    check(g.includes('Breathing and blood flow')&&/may not be used in ways that may obstruct or restrict breathing or blood flow/.test(g)&&/facedown position/.test(g),'the statute summary carries Florida’s breathing clause');
    check(g.includes('No Hold May Restrict Breathing')&&g.includes('principle 7')&&/checked in October 2026/.test(g)&&!/as retrieved; your district/.test(g),'the Guide explains the breathing rule, its sources and when it was checked');
    check(g.includes('Does This Need a Report?')&&/person who suspects/.test(g)&&/Print the report record/.test(g)&&/only that the question was answered, and when/.test(g),'the Guide explains the report question and its record');
    /* the simulation fills the new lines */
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);
    check(await page.evaluate(()=>!!S.meta.rWatch&&!!S.meta.dbBreath&&S.meta.rpNeed==='no'&&/broke this plan.s breathing rule/.test(S.meta.rpWhy)&&!!S.meta.rpOn&&S.meta.rpFor==='restraint 2 on the log'),'the simulation names the watching adult, the breathing check, and a No that names the broken rule');
    await view(page,'deb');check(/v-ok/.test(await cls(page,'#rpVerdict'))&&!/These answers were given for/.test(await text(page,'#rpVerdict')),'the simulated debriefing: a No with its reason, for this restraint');
    const simBip=await page.evaluate(()=>window.__bipText());check(simBip.includes('BREATHING: NO HOLD MAY RESTRICT IT')&&simBip.includes('Breathing during the hold:'),'the simulated plan copies the rule and the breathing line to the BIP');
    check(!/broke this plan.s breathing rule; see What Changes/.test(await printedText(page)),'the simulated answer does not print');
    /* a file saved before the change */
    await openText(page,JSON.stringify(OLD['CR-1']));
    check(await page.evaluate(()=>S.meta.client==='Old Record Student'&&!S.meta.rpNeed&&!S.meta.rWatch&&!document.querySelector('[data-mc="rpR1"]').checked),'an earlier file opens, with the new entries empty');
    await view(page,'deb');check(/Not answered yet/.test(await text(page,'#rpVerdict'))&&/Not answered on this record yet/.test(await text(page,'#crRepPaper')),'an earlier file: the report question reads as not answered');
    await view(page,'plan');check(/No adult is named/.test(await text(page,'#breathVerdict')),'an earlier file: no watching adult named');
    const again=JSON.parse(await saveText(page));check(again.S.meta.client==='Old Record Student'&&again.S.log.length>=1&&again.S.log[0].d==='9/2/26','an earlier file saves again with its entries');
    check(log.length===0,'no console errors on CR-1',log);await page.close();}

  /* ======================================================================== IM-1 */
  {console.log('\n=== IM-1 ('+ED+')');const log=[];const page=await openPage(ctx,'IM-1',log);
    await view(page,'map');
    const rule=await text(page,'#imRule');
    check(await shown(page,'#imRule')&&/Two adults\./.test(rule)&&/Ask first\./.test(rule)&&/genitals, buttocks, breasts/.test(rule)&&/The chest only at the collar/.test(rule)&&/No one holds a student still for a check/.test(rule),'the body map states two adults, asking first, what is looked at and the private areas',rule);
    const priv=await page.evaluate(()=>[...document.querySelectorAll('#imMaps path[data-loc="hips"]')].map(p=>p.ownerSVGElement.dataset.view+':'+p.classList.contains('imPriv')+':'+p.getAttribute('aria-label')));
    check(priv.length===2&&priv.includes('back:true:Buttocks: a private area, not examined by staff')&&priv.includes('front:false:Hips/buttocks: the side of the hip only'),'the buttocks (back figure) are shaded and private; the side of the hip (front figure) is not',priv);
    const opts=await page.evaluate(()=>['genitalia','rectum','hips'].map(l=>{const o=document.querySelector('#imAddLoc option[value="'+l+'"]');return o?(o.disabled?'disabled':'enabled')+':'+o.textContent:'missing';}));
    check(opts[0].startsWith('disabled')&&opts[1].startsWith('disabled')&&opts[2]==='enabled:Hips/buttocks (the side of the hip only)','the list offers neither genitals nor anal area; Hips/buttocks is the side of the hip',opts);
    await page.click('#imFig-back path[data-loc="hips"]');await sleep(150);
    check(await page.evaluate(()=>S.cur.rows.length===0&&SELP==='hips'),'tapping the buttocks adds no row');
    check(await page.$('#imSide button[data-carenew="buttocks"]')!==null&&/do not examine private areas/.test(await text(page,'#imSide'))&&/Buttocks/.test(await text(page,'#imSide')),'the side panel offers only the care path');
    await page.evaluate(()=>{const e=document.querySelector('#imFig-back path[data-loc="hips"]');e.focus();e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await sleep(100);
    check(await page.evaluate(()=>S.cur.rows.length===0),'the keyboard on the buttocks adds no row either');
    check(await page.evaluate(()=>{const n=S.cur.rows.length;addLoc('genitalia');addLoc('rectum');return S.cur.rows.length===n;}),'a private area cannot be added from the list');
    await page.evaluate(()=>{const e=document.querySelector('#imFig-front path[data-loc="hips"]');e.focus();e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await sleep(120);
    check(await page.evaluate(()=>S.cur.rows.length===1&&S.cur.rows[0].loc==='hips'&&S.cur.rows[0].view==='front'&&!isPrivRow(S.cur.rows[0])),'the side of the hip (front figure) is checked, as Hips/buttocks');
    check(/Only the side of the hip, above the waistband\. The buttocks are never examined\./.test(await text(page,'#imSide')),'the side panel says how far the hip check goes');
    await page.click('#imFig-back path[data-loc="hips"]');await sleep(150);
    check(await page.evaluate(()=>S.cur.rows.length===1&&S.cur.rows[0].view==='front'&&SELP==='hips'),'the buttocks never take the marker of the side of the hip');
    await page.evaluate(()=>{const e=document.querySelector('#imFig-front path[data-loc="chest"]');e.focus();e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await sleep(120);
    check(/the chest only at the collar\. The breasts are never examined/.test(await text(page,'#imSide')),'the chest check says: the chest only at the collar, never the breasts');
    await page.evaluate(()=>{S.cur.rows=[];SEL=null;SELP=null;renderCur();});
    /* Part I: healed injuries in a private area only from the records or the parent */
    await view(page,'setup');
    check(/from the records or the parent/.test(await text(page,'#healedTbl tbody')),'Part I: a healed private-area injury comes only from the records or the parent');
    await page.evaluate(()=>document.querySelector('#addHealed').click());await sleep(120);
    check(await page.evaluate(()=>{const o=document.querySelector('#healedTbl select[data-f="loc"] option[value="genitalia"]');return !!o&&/from the records or the parent only; never examined/.test(o.textContent);}),'Part I: the private sites are labelled so');
    await page.evaluate(()=>{S.healed=[];renderHealed();});
    /* the parent's decision on injury checks */
    check(/The parent.s decision on injury checks \(Form IC-1, E\) is not recorded/.test(await text(page,'#setupVerdict')),'Setup: the parent’s decision is asked for');
    check(await page.evaluate(()=>[...document.querySelectorAll('[data-m="consent"] option')].map(o=>o.value).join('|'))==='|yes|no|nr','the parent’s decision is a choice: Yes, No, Not recorded');
    /* the care path: an injury in a private area noticed during required care */
    await view(page,'history');
    check(!(await shown(page,'#imCareEdit [data-cd="seen"]')),'the care panel is closed until it is asked for');
    await view(page,'map');await page.click('#imFig-back path[data-loc="hips"]');await sleep(150);
    await page.click('#imSide button[data-carenew="buttocks"]');await sleep(150);
    check(await page.evaluate(()=>document.querySelector('#imCareEdit [data-cd="area"]').value==='buttocks'&&!!document.querySelector('#imCareEdit [data-cd="date"]').value),'the care panel opens with the area and today');
    const panel=await text(page,'#imCareEdit');
    check(/If it needs first aid, the school nurse gives it, as for any injury/.test(panel)&&/do not tell the parent yourself first/.test(panel),'the panel covers first aid and not telling the parent first');
    check(await page.evaluate(()=>{const e=document.querySelector('#imCareEdit [data-rs="draft"][data-rk="r3"]');return e.checked&&e.disabled;}),'the private-area box is ticked, and stays ticked');
    const add=async()=>{await page.evaluate(()=>document.querySelector('#imCareAdd').click());await sleep(150);};
    await add();check(await page.evaluate(()=>S.care.length===0)&&/the second adult present, with their role \(or tick that no second adult was present\)/.test(await text(page,'#imCareMiss')),'an empty entry is not added, and says what is missing');
    for(const [k,v] of [['task','help with toileting'],['seen','A small bruise, about 2 cm, on the left buttock'],['by','Aide Test'],['byRole','Paraprofessional'],['second','Teacher Test'],['nurse','Told at 10:30']])await setVal(page,'#imCareEdit [data-cd="'+k+'"]',v);
    check(/An entry is being written, and it is not added yet/.test(await text(page,'#imCareVerdict')),'a half-written entry counts as open in the care log');
    await add();check(await page.evaluate(()=>S.care.length===0)&&/the second adult present, with their role/.test(await text(page,'#imCareMiss')),'the second adult needs a role');
    await setVal(page,'#imCareEdit [data-cd="secondRole"]','Teacher');await add();
    check(await page.evaluate(()=>S.care.length===0)&&/the answer to Does this need a report/.test(await text(page,'#imCareMiss')),'the report question must be answered');
    check(/v-no/.test(await cls(page,'#imCareEdit [data-rv="draft"]'))&&/A box above is ticked\. Answer the question now/.test(await text(page,'#imCareEdit [data-rv="draft"]')),'the draft’s ticked box asks for an answer now');
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="need"]','no');await sleep(80);
    check(/v-mid/.test(await cls(page,'#imCareEdit [data-rv="draft"]'))&&/The answer is No, and a reason to suspect is marked/.test(await text(page,'#imCareEdit [data-rv="draft"]')),'a No for a private area: amber');
    await add();check(await page.evaluate(()=>S.care.length===0)&&/why you do not suspect abuse or neglect/.test(await text(page,'#imCareMiss')),'a No needs its reason');
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="need"]','yes');await add();
    check(await page.evaluate(()=>S.care.length===1&&S.care[0].area==='buttocks'&&S.care[0].second==='Teacher Test'&&S.care[0].rep.r3===true&&S.care[0].rep.need==='yes'&&S.care[0].rep.on===S.care[0].rep.on&&!!S.care[0].rep.on),'with everything filled in, the entry is added, with the day answered');
    check(await page.evaluate(()=>S.cur.rows.length===0),'the care entry is not a scored row');
    check(/Buttocks/.test(await text(page,'#imCare tbody'))&&/still to record when, to whom and by whom/.test(await text(page,'#imCare tbody')),'the care log lists it, with the report still to record');
    check(/still needs its report recorded/.test(await text(page,'#imCareVerdict'))&&!/being written/.test(await text(page,'#imCareVerdict')),'the care log asks for the report, and nothing is being written');
    await page.evaluate(()=>document.querySelector('#imCare button[data-careedit="0"]').click());await sleep(150);
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="when"]','10/1/2026, 11:00 AM');await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="to"]','Hotline, ref T-1');await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="by"]','Aide Test');
    check(/Entry 1 is being corrected, and the changes are not saved yet/.test(await text(page,'#imCareVerdict')),'a correction counts as open until it is saved');
    await add();
    check(await page.evaluate(()=>S.care.length===1&&S.care[0].rep.to==='Hotline, ref T-1'),'Edit and Save changes correct the entry in place');
    check((await text(page,'#imCareVerdict'))==='','the report recorded: nothing left to ask');
    /* one adult only, as can happen during toileting: recorded, and marked */
    await page.evaluate(()=>document.querySelector('#imCareEdit button[data-carenew]').click());await sleep(120);
    for(const [k,v] of [['area','genitals'],['task','changing a pad or diaper'],['seen','A red mark, as seen'],['by','Aide Test'],['byRole','Paraprofessional'],['second','Aide Test'],['secondRole','Paraprofessional'],['parent','Told at pickup by the nurse']])await setVal(page,'#imCareEdit [data-cd="'+k+'"]',v);
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="need"]','no');await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="why"]','a rash the nurse has charted.');
    await add();check(await page.evaluate(()=>S.care.length===1)&&/someone other than the person who noticed it/.test(await text(page,'#imCareMiss')),'the second adult cannot be the person who noticed it');
    await tick(page,'#imCareEdit [data-cd="alone"]',true);await sleep(150);
    check(await page.evaluate(()=>document.querySelector('#imCareEdit [data-cd="second"]').disabled&&!!document.querySelector('#imCareEdit [data-cd="aloneWhy"]')),'"no second adult" closes the second adult’s fields and asks why');
    check(/The two-adult rule was not met\. The injury is still recorded and the report question still applies/.test(await text(page,'#imCareEdit')),'the panel says the rule was not met, and the entry still counts');
    await add();check(await page.evaluate(()=>S.care.length===1)&&/why no second adult was present, and who was told at once/.test(await text(page,'#imCareMiss')),'the reason, and who was told at once, are needed');
    await setVal(page,'#imCareEdit [data-cd="aloneWhy"]','The teacher was with the class; the nurse was told at 9:05');await add();
    check(await page.evaluate(()=>S.care.length===2&&S.care[1].alone===true&&S.care[1].aloneWhy.length>0),'with the reason, the entry is added');
    check(/None present/.test(await text(page,'#imCare tbody'))&&/The two-adult rule was not met for entry 2/.test(await text(page,'#imCareVerdict'))&&/v-no/.test(await page.evaluate(()=>document.querySelector('#imCareVerdict').innerHTML)),'the log marks it in red: the two-adult rule was not met');
    check(/The answer is No for an injury in a private area: entry 2 \(the reason given: a rash the nurse has charted\)/.test(await text(page,'#imCareVerdict')),'a No for an injury in a private area stays flagged, with its reason');
    check(await page.evaluate(()=>document.body.classList.contains('view-history')),'the care path is the log on the History page, beside the nurse checks');
    /* two adults at every check, and the student asked first */
    await view(page,'setup');await setVal(page,'[data-m="examiner"]','Nurse Test (RN)');await setVal(page,'[data-m="second"]','Aide Usual');await setVal(page,'[data-m="secondRole"]','Paraprofessional');await sleep(350);
    await page.evaluate(()=>document.querySelector('#newAdmBtn').click());await sleep(300);
    check(await page.evaluate(()=>S.cur.second===''&&S.cur.secondRole===''&&S.cur.present===false&&S.cur.assent===''),'a new administration does not fill in the second adult');
    check(/Use Aide Usual \(Paraprofessional\)/.test(await text(page,'#imSecondSug')),'the usual second adult is offered with one tap');
    await page.evaluate(()=>document.querySelector('#imSecondSug button').click());await sleep(150);
    check(await page.evaluate(()=>S.cur.second==='Aide Usual'&&S.cur.secondRole==='Paraprofessional'&&S.cur.present===false&&document.querySelector('[data-a="second"]').value==='Aide Usual'),'the tap fills the name and role, not the presence');
    const two=await text(page,'#imTwoVerdict');
    check(/tick that the second adult was present for the whole check/.test(two)&&/record the student.s assent/.test(two),'the map asks for the presence and the assent',two);
    await page.evaluate(()=>{const e=document.querySelector('#imFig-front path[data-loc="larm_L"]');e.focus();e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await sleep(150);
    await page.selectOption('#imSide select[data-f="type"]','CT');await sleep(60);await page.selectOption('#imSide select[data-f="sev"]','1');await sleep(60);
    await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(300);
    check(await page.evaluate(()=>S.hist.length===0)&&/Not filed: tick that the second adult was present/.test(await page.evaluate(()=>{const t=document.querySelector('#nbhToasts');return t?t.textContent:'';})),'Save to history refuses a check without the presence and the assent');
    await setVal(page,'[data-a="second"]','Nurse Test');await sleep(80);
    check(/name a second adult who is someone other than the examiner/.test(await text(page,'#imTwoVerdict'))&&/v-no/.test(await cls(page,'#imTwoVerdict')),'the same person in both fields is refused, in red');
    await setVal(page,'[data-a="second"]','Aide Test');await setVal(page,'[data-a="secondRole"]','');await sleep(80);
    check(/give the second adult.s role/.test(await text(page,'#imTwoVerdict')),'the second adult’s role is asked for');
    await setVal(page,'[data-a="secondRole"]','Paraprofessional');await tick(page,'[data-a="present"]',true);await setVal(page,'[data-a="assent"]','yes');await sleep(100);
    check(/Two adults at this check: Nurse Test \(RN\), and Aide Test \(Paraprofessional\), present for the whole check\. The student was asked first and agreed\./.test(await text(page,'#imTwoVerdict')),'both adults, the presence and the assent: the map says so',await text(page,'#imTwoVerdict'));
    /* the report question for the administration */
    await view(page,'scoring');
    const rq=await text(page,'#imRepCur');
    check((await page.$$('#imRepCur input[type=checkbox][data-rk]')).length===7&&/It is in a private area \(genitals, buttocks, breasts\)\./.test(rq)&&/It is at a place this student has not been seen to injure/.test(rq),'seven reasons, with a private area and an unusual place apart');
    ['Any of these can be a reason to suspect abuse or neglect','Do you suspect abuse or neglect?','You do not need proof. If you are not sure, report.','right away, as soon as you suspect it','Do not investigate','Print the report record'].forEach(p=>check(rq.includes(p),'administration report question says: '+p));
    await page.selectOption('#imChart select[data-f="how"]','unknown');await sleep(150);
    const vu=await text(page,'#imRepCur [data-rv="cur"]');
    check(/How it happened is not known for Lower arm\/wrist \(L\)\. That alone is not a reason to suspect abuse or neglect; look at the list again\./.test(vu)&&!/v-no/.test(await cls(page,'#imRepCur [data-rv="cur"]')),'"Not known" is a prompt, not a reason (not red)',vu);
    await page.selectOption('#imChart select[data-f="how"]','nomatch');await sleep(150);
    check(/v-no/.test(await cls(page,'#imRepCur [data-rv="cur"]'))&&/The record shows: Lower arm\/wrist \(L\) \(not seen, and it does not match/.test(await text(page,'#imRepCur [data-rv="cur"]')),'"Not seen; does not match" is a reason: red until answered');
    await setVal(page,'#imRepCur [data-rs="cur"][data-rk="need"]','no');await sleep(100);
    check(/v-mid/.test(await cls(page,'#imRepCur [data-rv="cur"]'))&&/The answer is No, and a reason to suspect is marked/.test(await text(page,'#imRepCur [data-rv="cur"]')),'with No: amber, and a reason is asked for');
    await setVal(page,'#imRepCur [data-rs="cur"][data-rk="why"]','the student was seen banging the desk; it matches after all.');await sleep(100);
    check(/The reason given: the student was seen banging the desk; it matches after all\. If you are not sure, report\./.test(await text(page,'#imRepCur [data-rv="cur"]')),'a reason that ends with a full stop is not given a second one',await text(page,'#imRepCur [data-rv="cur"]'));
    await page.selectOption('#imChart select[data-f="how"]','seen');await sleep(150);
    check(/v-ok/.test(await cls(page,'#imRepCur [data-rv="cur"]')),'seen to happen, No and a reason: green');
    check(await page.evaluate(()=>S.cur.rep.on)===TODAY,'answering stamps the day it was answered');
    /* the parent's decision, asked at filing */
    await page.evaluate(()=>{window.__dlg=[];document.querySelector('#saveAdmBtn').click();});await sleep(350);
    check(await page.evaluate(()=>window.__dlg.some(m=>/The parent.s decision on injury checks \(Form IC-1, E\) is not Yes/.test(m))),'filing asks first when the parent’s decision is not Yes');
    check(await page.evaluate(()=>S.hist.length===1&&S.hist[0].second==='Aide Test'&&S.hist[0].secondRole==='Paraprofessional'&&S.hist[0].present===true&&S.hist[0].assent==='yes'&&S.hist[0].rep.need==='no'),'filed with the second adult, the role, the presence, the assent and the answer');
    await view(page,'setup');await setVal(page,'[data-m="consent"]','yes');await setVal(page,'[data-m="consentDate"]','9/2/2026');await sleep(350);
    check(!/injury checks \(Form IC-1, E\) is not/.test(await text(page,'#setupVerdict'))&&await page.evaluate(()=>S.meta.consent==='yes'&&S.meta.consentDate==='9/2/2026'),'with Yes recorded, Setup no longer asks for it');
    /* a check that stopped */
    await page.evaluate(()=>document.querySelector('#newAdmBtn').click());await sleep(300);
    await page.evaluate(()=>document.querySelector('#imSecondSug button').click());await sleep(100);await tick(page,'[data-a="present"]',true);await setVal(page,'[data-a="assent"]','stopped');await sleep(100);
    check(/write under Conditions why the check stopped/.test(await text(page,'#imTwoVerdict')),'a check that stopped asks why, under Conditions');
    await setVal(page,'[data-a="note"]','pulled her arm away at the sleeve; stopped');await sleep(80);
    await page.evaluate(()=>{window.__dlg=[];document.querySelector('#saveAdmBtn').click();});await sleep(350);
    check(await page.evaluate(()=>S.hist.length===2&&S.hist.some(h=>h.assent==='stopped')),'a check that stopped is filed as such');
    await view(page,'history');
    check(/Check stopped/.test(await text(page,'#imHist tbody'))&&/The check stopped: the student said no or pulled away/.test(await text(page,'#imHist tbody')),'the History marks the check that stopped');
    check(/1 check that stopped, not graphed/.test(await page.evaluate(()=>document.querySelector('#imPlot').textContent)),'the graph leaves it out, and says so');
    check(await page.evaluate(()=>schedule().adms.length===1),'the schedule does not count it as done');
    /* print: the answer stays off paper; the report record prints on its own */
    await view(page,'map');
    const pr=await printShown(page,['#imRule','#imRepCur','#imRepCurPaper','#imCare','#imCareVerdict','#imGuideSafety','#imCareEdit']);
    check(pr['#imRule']&&pr['#imCare']&&pr['#imGuideSafety']&&pr['#imRepCurPaper'],'print: the rule, the care log, the Guide table and the report line print',pr);
    check(!pr['#imRepCur']&&!pr['#imCareVerdict']&&!pr['#imCareEdit'],'print: the report question, the care verdicts and the entry panel do not',pr);
    const pt=await printedText(page);
    check(!/Hotline, ref T-1|a rash the nurse has charted|it matches after all/.test(pt),'print: no answer and no report is on paper');
    check(/Report question: answered on \d+\/\d+\/\d+ \(see the report record\)/.test(pt)&&/answered on \d+\/\d+\/\d+/.test(pt),'print: the History and the care log say only that the question was answered, and when');
    const col=await collect(page);
    check(col!==null&&!/Hotline, ref T-1|a rash the nurse has charted/.test(col),'the master print’s copy leaves the report out too');
    const rr=await repRecord(page,'.imRepPrint','#imRepRec');
    check(rr.printed===1&&rr.alone&&rr.recShown&&rr.foot,'Print the report record prints the record alone, with its own page footer',rr);
    check(/Report Record: Confidential/.test(rr.rec)&&/Hotline, ref T-1/.test(rr.rec)&&/a rash the nurse has charted/.test(rr.rec)&&/Noticed during required care, entry 2/.test(rr.rec)&&/Administration of/.test(rr.rec),'the record holds every answer and the report',rr.rec.slice(0,300));
    check(rr.after,'after printing, the record is emptied and the page is itself again');
    /* the Guide */
    const g=await text(page,'#imGuideSafety');
    ['Two adults, always','Ask the student first','What is looked at','Private areas are never examined','Noticed during required care','Does this need a report?','The report record','someone other than the examiner','the chest only at the collar','the side of the hip','the two-adult rule was not met',"your state’s law and your agency’s policy"].forEach(p=>check(g.includes(p),'Guide: '+p));
    /* the draft travels with the record */
    await page.evaluate(()=>{document.querySelector('#imCareEdit button[data-carenew]')&&document.querySelector('#imCareEdit button[data-carenew]').click();});await sleep(100);
    await setVal(page,'#imCareEdit [data-cd="seen"]','half-written note');
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.S.careDraft&&d.S.careDraft.seen==='half-written note'&&d.S.care.length===2&&d.S.hist[0].present===true,'Save data keeps the care log, the presence and a half-written entry');
    const before=await page.evaluate(()=>JSON.stringify(S));
    await page.evaluate(()=>{S=blank();CARE_OPEN=false;renderAll();});await openText(page,saved);
    check(await page.evaluate(()=>JSON.stringify(S))===before,'save and reopen give the same record');
    check(await page.evaluate(()=>document.querySelector('#imCareEdit [data-cd="seen"]')&&document.querySelector('#imCareEdit [data-cd="seen"]').value==='half-written note'),'the half-written entry comes back open');
    /* the CSV */
    const csv=await csvText(page);const head=(csv.split('\n')[0]||'').split('","');
    check(head.length===23&&/How it happened/.test(head[19])&&/Second adult/.test(head[20])&&/Report question/.test(head[21])&&/assent/.test(head[22]),'CSV: the four new columns at the end, the others where they were',head.slice(17));
    check(/"Noticed during required care"/.test(csv)&&/"None present: The teacher was with the class/.test(csv),'CSV: the care log is in it, with the one-adult entry marked');
    check(!/Hotline, ref T-1|a rash the nurse has charted|Yes: made|it matches after all/.test(csv)&&/"answered on \d+\/\d+\/\d+"/.test(csv),'CSV: whether the question was answered, and when; never the answer or the report');
    check(/"the check stopped: the student said no or pulled away"/.test(csv),'CSV: the check that stopped is marked');
    /* the simulation */
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
    check(await page.evaluate(()=>S.hist.every(h=>!!h.second&&!!h.secondRole&&h.present===true&&h.assent==='yes'&&h.rep.need==='no'&&!!h.rep.on)&&S.meta.consent==='yes'&&S.care.length===1&&S.care[0].rep.need==='yes'&&!!S.care[0].rep.to&&!!S.care[0].rep.on),'the simulation names the second adults, ticks their presence, asks first, answers the question, and has one care entry with its report');
    check(await page.evaluate(()=>!S.hist.some(h=>h.rows.some(isPrivRow))),'the simulation examines no private area');
    check((await text(page,'#imCareVerdict'))==='','the simulated care log has nothing open');
    /* files saved before the change */
    await openText(page,JSON.stringify(OLD['IM-1']));
    check(await page.evaluate(()=>S.meta.client==='Old Record Student'&&S.cur.second===''&&S.cur.present===false&&S.cur.assent===''&&S.care.length===0&&S.cur.rows.length===3&&S.cur.rows[0].loc==='genitalia'&&S.cur.rows[0].how===''),'an earlier file opens: its rows kept, the new entries empty');
    await view(page,'map');
    check(/made before the private-area rule: Genitalia, Hips\/buttocks/.test(await text(page,'#imRoNote'))&&/private area; recorded before the rule/.test(await text(page,'#imChart tbody')),'earlier private-area rows (the genitals, the buttocks) are kept and marked',await text(page,'#imRoNote'));
    check(/Genitalia \(a private area\)/.test(await text(page,'#imRepCur [data-rv="cur"]')),'the report question names them');
    check(await page.evaluate(()=>!isPrivRow(S.hist[0].rows[1])&&isPrivRow(S.cur.rows[2])),'an earlier hip row on the front figure is the side of the hip; one on the back figure is the buttocks');
    await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(250);
    check(await page.evaluate(()=>S.hist.length===1),'an earlier administration is not filed until the second adult, the presence and the assent are recorded');
    check(log.length===0,'no console errors on IM-1',log);await page.close();}

  /* ======================================================================== IC-1 */
  {console.log('\n=== IC-1 ('+ED+')');const log=[];const page=await openPage(ctx,'IC-1',log);
    check(await page.evaluate(()=>[...document.querySelectorAll('.nbh-formmeta span, .nbh-print-meta div')].filter(e=>/Revised/.test(e.textContent)).every(e=>/Revised October 2026/.test(e.textContent))),'the revision reads October 2026, on screen and on every sheet');
    await view(page,'consent');
    const cf=await text(page,'#icConf');
    ['What we keep private, and when we must share','stays with your child\'s team','Outside the school, we share it only with your written consent, or when the law allows or requires it','may hurt themselves or someone else','Everyone who works with your child, the BCBA included, must report suspected abuse or neglect right away to the Florida Abuse Hotline',
     'as the law and our agency\'s policy require','court order','whose job is to keep your child and others safe','we tell you what we shared'].forEach(p=>check(cf.includes(p),'family limits of confidentiality: '+p,cf.slice(0,160)));
    check(!/§|F\.S\.|statute|the same day|We do not share it outside the school without your written consent/.test(cf),'the family text cites no statute and promises no more than the law allows');
    check((await page.$$('#icConf ul.ic-conf > li')).length===6,'six short points');
    await view(page,'proc');
    const ij=await text(page,'#icInjury');
    ['E. Checking for injuries','Two adults, always','Your child is asked first','No one holds a child still for a check','Staff write down that it was not done, and why','What may be looked at','the side of the hip above the waistband, and the chest only at the collar','Private areas are never examined by staff','genitals, buttocks or breasts','help with toileting or changing','At a home visit, the parent or guardian can be the second adult'].forEach(p=>check(ij.includes(p),'injury checks: '+p));
    check(/^F\. How you would like to be kept informed/.test(await page.evaluate(()=>[...document.querySelectorAll('#proc .chdt')].pop().textContent)),'the contact preferences are part F');
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').getAttribute('aria-label'))==='Decision: Checking for injuries','the decision is named for its card');
    await view(page,'assent');
    check(await shown(page,'[name="a.conf"]')&&/Told the student, in words for their age, who will hear what they say and what cannot be kept private/.test(await text(page,'#icAssentConf'))&&/Form SI-1/.test(await text(page,'#icAssentConf')),'the Student Assent sheet: the limits told at the outset, with a tick, pointing to SI-1');
    await view(page,'record');check(/of 5$/.test(await text(page,'#stDec')),'the record counts five specific decisions',await text(page,'#stDec'));
    check(await page.evaluate(()=>[...document.querySelector('[name="log[0].ev"]').options].some(o=>o.text==='Limits of confidentiality explained')),'the consent record logs the explanation of the limits');
    /* a consent recorded now, by a person, is recorded on this revision */
    await view(page,'consent');await page.selectOption('#cMethod','sign');await page.click('[name="c.decision"][value="yes"]');await sleep(150);
    check(await page.evaluate(()=>document.querySelector('[name="c.formrev"]').value==='2026-10'&&document.querySelector('#icRevNote').hidden),'a consent recorded now is marked as this revision, with no note');
    await setVal(page,'[name="ij.dec"]','yes');await sleep(100);
    check(/Injury checks are consented to; still to enter: when checks are done; who checks, and the second adult/.test(await text(page,'#statusBox')),'Yes to injury checks asks when, who and the second adult');
    check(await page.evaluate(()=>document.querySelector('#icInjury').classList.contains('dec-yes')),'the card shows the Yes');
    await setVal(page,'[name="ij.when"]','At intake and every 3 weeks');await setVal(page,'[name="ij.who"]','School nurse, with the aide');await setVal(page,'[name="ij.init"]','TP');await setVal(page,'[name="ij.date"]','2026-10-01');await tick(page,'[name="a.conf"]',true);await sleep(100);
    check(!/Injury checks/.test(await text(page,'#statusBox')),'filled in: nothing more asked about injury checks');
    await setVal(page,'[name="ij.dec"]','no');await sleep(80);check(await page.evaluate(()=>document.querySelector('#icInjury').classList.contains('dec-no')),'the card shows the No');
    await setVal(page,'[name="ij.dec"]','yes');
    const pr=await printShown(page,['#icConf','#icInjury','#icGuide6','#icAssentConf']);check(Object.values(pr).every(Boolean),'print: the limits, the injury-check card, the assent line and the Guide section print',pr);
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.rev==='2026-10'&&d.fields['ij.dec']==='yes'&&d.fields['ij.who']==='School nurse, with the aide'&&d.fields['ij.init']==='TP'&&d.fields['c.formrev']==='2026-10'&&d.fields['a.conf']===true,'saved: the revision, the injury-check decision and the assent line');
    await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value===''&&document.querySelector('[name="c.formrev"]').value===''),'cleared');
    await openText(page,saved);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value==='yes'&&document.querySelector('[name="ij.when"]').value==='At intake and every 3 weeks'&&document.querySelector('#icRevNote').hidden),'reopened: the decision is back, and no note');
    /* a consent signed on the September 2026 revision */
    await openText(page,JSON.stringify(OLD['IC-1']));
    check(await page.evaluate(()=>document.querySelector('[name="c.client"]').value==='Old Record Student'&&document.querySelector('[name="fa.dec"]').value==='no'&&document.querySelector('[name="ij.dec"]').value===''),'an earlier file opens, with the injury-check decision empty');
    const rn=await text(page,'#icRevNote');
    check(await shown(page,'#icRevNote')&&/Recorded on the September 2026 revision of this form/.test(rn)&&/were not on the form when this consent was recorded/.test(rn)&&/record the decision on E/.test(rn),'an earlier signed consent: the Consent sheet says which parts were not on it',rn);
    check((await printShown(page,['#icRevNote']))['#icRevNote'],'print: the note prints with the consent');
    await page.evaluate(()=>{const e=document.querySelector('[name="c.date"]');e.value='2026-09-02';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(100);
    check(await shown(page,'#icRevNote'),'correcting the earlier consent keeps the note');
    const pe=await page.evaluate(()=>{const dd=document.querySelector('[name="ij.dec"]').closest('.decide');return dd.classList.contains('ic-dec-empty');});
    check(pe,'an undecided injury check prints its choices as boxes to mark');
    await view(page,'guide');const g=await text(page,'#guide');
    check(g.includes('6. What Stays Private, and Injury Checks')&&/Standard 3\.10/.test(g)&&/reported right away, to the Florida Abuse Hotline/.test(g)&&/Student Assent sheet/.test(g)&&!/the same day/.test(g),'the Guide explains the limits, telling the student at the outset, and the injury checks');
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value==='na'&&document.querySelector('#icRevNote').hidden),'the simulation records injury checks as not proposed, on this revision');
    check(log.length===0,'no console errors on IC-1',log);await page.close();}

  /* ======================================================================== SI-1 */
  {console.log('\n=== SI-1 ('+ED+')');const log=[];const page=await openPage(ctx,'SI-1',log);
    await view(page,'interview');
    check(await page.evaluate(()=>{const c=document.querySelector('#siConf'),q=document.querySelector('#qLike'),i=document.querySelector('#siConf ~ .instr');return !!c&&!!q&&!!(c.compareDocumentPosition(q)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!i&&/Before the first question/.test(i.textContent);}),'the read-aloud box comes before the first question');
    const rd=await text(page,'#siConfText');
    ['who will hear what you tell me','your parent or guardian may read it','I cannot keep private','someone is hurting you','hurt yourself or someone else','I have to tell people whose job is to keep you safe.','That could be the school counselor or the principal','The law and school rules say I must','Do you have any questions about that?'].forEach(p=>check(rd.includes(p),'reading version: '+p,rd.slice(0,200)));
    check(!/The law says I must/.test(rd),'the reading version no longer says only the law');
    const ad=await text(page,'#siConfAdult');
    ['For the adult, not read aloud','stay calm, listen, and do not ask for details','Do not write it in this interview, which the family may read','exact words on a separate sheet for the report','report it right away','follow your agency’s policy on who tells the family','ask whether they still want to talk today'].forEach(p=>check(ad.includes(p),'the adult’s note: '+p,ad));
    await page.click('#verSeg button[data-ver="young"]');await sleep(150);
    const yg=await text(page,'#siConfText');
    check(yg!==rd&&yg.includes('grown-up whose job is to keep kids safe')&&yg.includes('Do you want to ask me anything about that?')&&!yg.includes('Is that OK?'),'younger version: its own words, and no question the adult cannot honour',yg.slice(0,200));
    const pr=await printShown(page,['#siConf','#siConfAdult']);check(pr['#siConf']&&pr['#siConfAdult'],'print: the box and the adult’s note print',pr);
    check((await text(page,'#siConfText'))===yg,'print: the version chosen is the one shown');
    await page.click('#verSeg button[data-ver="read"]');await sleep(100);
    await view(page,'summary');check(/not recorded as read aloud/.test(await text(page,'#sumOut')),'summary: not yet read aloud');
    await view(page,'interview');await tick(page,'[data-c="conf_read"]',true);await setVal(page,'[data-m="conf_say"]','Does my teacher see it?');await sleep(350);
    await view(page,'summary');const sm=await text(page,'#sumOut');
    check(/read aloud to the student before the first question \(reading version\)/.test(sm)&&sm.includes('Does my teacher see it?'),'summary: read aloud, and what the student said',sm.slice(0,300));
    const saved=await saveText(page);const d=JSON.parse(saved);check(d.S.chk.conf_read===true&&d.S.meta.conf_say==='Does my teacher see it?','saved: the tick and the student\'s words');
    const before=await page.evaluate(()=>JSON.stringify(S));await page.evaluate(()=>{S=blank();renderAll();});await openText(page,saved);
    check(await page.evaluate(()=>JSON.stringify(S))===before,'save and reopen give the same record');
    await openText(page,JSON.stringify(OLD['SI-1']));
    check(await page.evaluate(()=>S.meta.client==='Old Record Student'&&!S.chk.conf_read&&!document.querySelector('[data-c="conf_read"]').checked),'an earlier file opens, not ticked');
    check(/grown-up whose job is to keep kids safe/.test(await text(page,'#siConfText')),'an earlier younger-version file shows the younger words');
    await view(page,'summary');check(/not recorded as read aloud/.test(await text(page,'#sumOut')),'an earlier file: summary says not recorded');
    await view(page,'guide');const gd=await text(page,'section.only-guide');
    check(/Who hears the answers/.test(gd)&&/Code 3\.10/.test(gd)&&/Do not write it in this interview, which the family may read/.test(gd)&&/reported right away/.test(gd)&&!/the same day/.test(gd),'the Guide explains who hears the answers, and where a disclosure is written');
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
    check(await page.evaluate(()=>S.chk.conf_read===true&&!!S.meta.conf_say),'the simulation reads the box aloud first');
    check(log.length===0,'no console errors on SI-1',log);await page.close();}

  console.log('\n'+(count-fails)+' of '+count+' checks passed'+(fails?'; '+fails+' FAILED':''));
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
