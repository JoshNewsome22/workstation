/* v21.44 policy and safety (B1, B4, B5).
   CR-1: the breathing rule on every plan (and in Copy for the BIP), the adult who watches, the debriefing's breathing
   line and its Does This Need a Report? question. IM-1: two adults at every check, private areas never examined
   (the care path only), the How it happened column, the report question, the care log. IC-1: the injury-check
   decision (Specific procedures, E) and the limits of confidentiality. SI-1: the read-aloud box on who hears the
   answers. Each: on screen, in the Guide, in print, saved and reopened, and a file saved before the change opens.
   Usage: WS_URL=http://127.0.0.1:8123 WS_ROOT=<checkout> node qa/policy-safety-test.js [NBH-Workstation|RPS-Workstation] */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/policy-safety/';fs.mkdirSync(OUT,{recursive:true});
const FILES={'CR-1':'CR-1_Crisis-Intervention-Plan_v2026-09.html','IM-1':'IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html',
  'IC-1':'IC-1_Informed-Consent-FBA-BIP_v2026-09.html','SI-1':'SI-1_Student-Interview-and-Assent_v2026-10.html'};
let fails=0,count=0;
const check=(c,msg,extra)=>{count++;console.log((c?'  ok   ':'  FAIL ')+msg+(!c&&extra!==undefined?' :: '+String(typeof extra==='string'?extra:JSON.stringify(extra)).slice(0,400):''));if(!c)fails++;};
/* files saved before the change, in the shapes those versions wrote */
const OLD={
  'CR-1':{form:'CR-1',rev:'2026-09',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',dbeh:'Striking staff',rStaff:'Aide A (trained 8/1/26)',hAvoid:'No holds from behind',dbInjury:'None'},
    team:[{n:'Parent',r:'Parent',g:'Parent or guardian',p:'Yes'}],pbis:[{s:'Prevention (before any sign)',do:'Timer in view',next:'',who:'Teacher'}],act:[],log:[{d:'9/2/26',dur:'20 s',set:'Room 4',staff:'Aide A',rep:'Yes',deb:'Yes',pre:'Demand'}],notify:{},closed:[]}},
  'IM-1':{form:'IM-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',examiner:'School nurse (RN)'},chk:{t_head:true},healed:[],events:[],
    cur:{id:'',date:'9/1/2026',time:'08:00',examiner:'School nurse (RN)',note:'',ro:false,rows:[{loc:'genitalia',n:'1',type:'AL',sev:'1',kind:'',note:'recorded before the rule',view:'',x:'',y:''},{loc:'hand_R',n:'1',type:'AL',sev:'1',kind:'bite',note:'',view:'front',x:60,y:277}]},
    hist:[{id:'aold1',date:'8/1/2026',time:'08:00',examiner:'School nurse (RN)',note:'intake',rows:[{loc:'hand_R',n:'2',type:'AL',sev:'2',kind:'bite',note:'',view:'front',x:60,y:277}]}],nurse:[]}},
  'IC-1':{form:'IC-1',rev:'2026-09',saved:'2026-09-30T14:00:00.000Z',counts:{log:6,att:3},fields:{'c.client':'Old Record Student','c.parent':'Old Parent','c.method':'sign','c.decision':'yes','fa.dec':'no','fa.init':'OP','sh.dec':'na','p.records':true}},
  'SI-1':{form:'SI-1',rev:'2026-10',saved:'2026-09-30T14:00:00.000Z',S:{meta:{client:'Old Record Student',ver:'young',beh:'when I get loud'},chk:{m_verbal:true},iv:{},hard:[],ab:[],wb:[],al:[],pc:[],pr:[]}}
};
async function openPage(ctx,id,log){const page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+FILES[id]);await sleep(700);
  await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};
    const o=URL.createObjectURL;URL.createObjectURL=b=>{if(b&&b.text)b.text().then(t=>{window.__saved=t;});return o(b);};});
  return page;}
async function saveText(page){await page.evaluate(()=>{window.__saved=null;document.querySelector('#saveBtn').click();});await sleep(400);return page.evaluate(()=>window.__saved);}
async function openText(page,text){await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(500);}
const view=async(page,v)=>{await page.evaluate(x=>document.querySelector('#viewSeg button[data-view="'+x+'"]').click(),v);await sleep(150);};
const shown=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0;},sel);
const text=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},sel);
async function printShown(page,sels){await page.emulateMedia({media:'print'});const r={};for(const s of sels)r[s]=await shown(page,s);await page.emulateMedia({media:'screen'});return r;}
const setVal=(page,sel,v)=>page.evaluate(([s,x])=>{const e=document.querySelector(s);if(!e)throw new Error('no '+s);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
const tick=(page,sel,on)=>page.evaluate(([s,x])=>{const e=document.querySelector(s);if(!e)throw new Error('no '+s);if(e.checked!==x){e.checked=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},[sel,on]);

(async()=>{
  const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:900}});
  /* ======================================================================== CR-1 */
  {console.log('\n=== CR-1 ('+ED+')');const log=[];const page=await openPage(ctx,'CR-1',log);
    await view(page,'plan');
    const b=await text(page,'#crBreath');
    check(await shown(page,'#crBreath'),'the breathing rule shows on the plan sheet');
    ['No hold may restrict breathing','chest, back, stomach or neck','face-down (prone) or face-up (supine)','mouth or nose','not part of the hold watches','Let go at once, and get medical help'].forEach(p=>check(b.includes(p),'breathing rule says: '+p,b));
    const signs=await page.$$eval('#crSigns li',l=>l.map(x=>x.textContent));
    check(signs.length===6,'six danger signs listed',signs);
    [/struggles to breathe/,/cannot breathe/,/changes color/,/vomits/,/stops responding/,/goes limp/].forEach(re=>check(signs.some(s=>re.test(s)),'danger sign: '+re.source));
    check(/Restraint and Seclusion: Resource Document/.test(b)&&/district/.test(b),'the rule names its source and the district policy');
    check(/restricts breathing/.test(await text(page,'#crBreath')+await page.evaluate(()=>document.querySelector('.prohib').textContent)),'the prohibited list names breathing');
    check(/any hold that restricts breathing/.test(await page.evaluate(()=>document.querySelector('[data-m="hAvoid"]').closest('td').textContent)),'positions and holds to avoid: the breathing rule is always ruled out');
    check(/breathing rule/.test(await page.evaluate(()=>document.querySelector('#pbisTbl').closest('.grid-wrap').nextElementSibling.textContent)),'the intervention sequence points to the breathing rule');
    check(/No adult is named/.test(await text(page,'#breathVerdict')),'no watching adult named: the plan says so');
    await setVal(page,'[data-m="rWatch"]','Second adult in the room');await sleep(100);
    check(/Named to watch the breathing from outside the hold: Second adult in the room/.test(await text(page,'#breathVerdict')),'the watching adult named: the verdict follows');
    /* the debriefing */
    await view(page,'deb');
    check(await page.$('[data-m="dbBreath"]')!==null,'debriefing asks about breathing during the hold');
    check(await shown(page,'#crRep'),'Does This Need a Report? shows on the debriefing sheet');
    const rp=await text(page,'#crRep');
    check((await page.$$('#crRep input[type=checkbox][data-mc]')).length===5,'five reasons to tick');
    ['the person who suspects it','does not take the place of your own report','right away, the same day',"your state’s law and your agency’s policy",'Do not investigate','When:','To whom','By whom'].forEach(p=>check(rp.includes(p),'report question says: '+p,rp.slice(0,200)));
    check(!/§|F\.S\.|Fla\. Stat/.test(rp),'the report question cites no statute');
    check(/Not answered yet/.test(await text(page,'#rpVerdict')),'blank: not answered yet');
    await tick(page,'[data-mc="rpR1"]',true);await sleep(100);
    check(await page.evaluate(()=>!!document.querySelector('#rpVerdict .v-no'))&&/so a report is needed/.test(await text(page,'#rpVerdict')),'a tick: a report is needed (red)');
    await setVal(page,'[data-m="rpNeed"]','no');await sleep(100);
    check(/Change the answer to Yes/.test(await text(page,'#rpVerdict')),'a tick with No: change the answer to Yes');
    await setVal(page,'[data-m="rpNeed"]','yes');await sleep(100);
    check(/Still to record: when, to whom, by whom/.test(await text(page,'#rpVerdict')),'Yes: still to record when, to whom, by whom');
    await setVal(page,'[data-m="rpWhen"]','9/14/26, 2:10 PM');await setVal(page,'[data-m="rpTo"]','HOTLINE-REF-123');await setVal(page,'[data-m="rpBy"]','Aide B');await sleep(100);
    check(await page.evaluate(()=>!!document.querySelector('#rpVerdict .v-ok'))&&/Report recorded: made 9\/14\/26, 2:10 PM to HOTLINE-REF-123, by Aide B/.test(await text(page,'#rpVerdict')),'complete: report recorded');
    /* print */
    const pr=await printShown(page,['#crBreath','#crSigns','#crRep','#rpVerdict','#breathVerdict']);
    check(Object.values(pr).every(Boolean),'print: the breathing rule, the report question and their verdicts print',pr);
    /* save and reopen */
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.S.meta.rpR1==='1'&&d.S.meta.rpNeed==='yes'&&d.S.meta.rpTo==='HOTLINE-REF-123'&&d.S.meta.rWatch==='Second adult in the room','saved: the tick, the answer, the report and the watching adult',d.S.meta);
    await page.evaluate(()=>{S=blank();renderAll();});
    check(await page.evaluate(()=>!document.querySelector('[data-mc="rpR1"]').checked),'cleared: the tick is off');
    await openText(page,saved);
    check(await page.evaluate(()=>document.querySelector('[data-mc="rpR1"]').checked&&document.querySelector('[data-m="rpNeed"]').value==='yes'&&document.querySelector('[data-m="rWatch"]').value==='Second adult in the room'),'reopened: the tick, the answer and the watching adult are back');
    /* Copy for the BIP: the rule goes in, the report stays out */
    const bip=await page.evaluate(()=>window.__bipText());
    check(bip.includes('BREATHING: NO HOLD MAY RESTRICT IT')&&bip.includes('No face-down (prone) or face-up (supine) holds')&&bip.includes('Adult who watches the breathing (not part of the hold): Second adult in the room'),'Copy for the BIP carries the breathing rule and the watching adult',bip.slice(0,300));
    check(!bip.includes('HOTLINE-REF-123')&&!/report is needed|Does this need a report/i.test(bip),'Copy for the BIP leaves the report out');
    check(!/^[^\n]*:\s*$/m.test(bip)&&!/\n{3,}/.test(bip),'Copy for the BIP: no empty label, single blank lines');
    await page.evaluate(()=>{S=blank();renderAll();});
    check((await page.evaluate(()=>window.__bipText())).split('\n').filter(Boolean).length<=2,'Copy for the BIP of an empty plan is the title only');
    /* the Guide */
    await view(page,'guide');
    const g=await text(page,'section.only-guide');
    check(g.includes('No Hold May Restrict Breathing')&&g.includes('principle 7'),'the Guide explains the breathing rule and its source');
    check(g.includes('Does This Need a Report?')&&/person who suspects/.test(g),'the Guide explains the report question');
    /* the simulation fills the new lines */
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);
    check(await page.evaluate(()=>!!S.meta.rWatch&&!!S.meta.dbBreath&&S.meta.rpNeed==='no'&&!!S.meta.rpWhy),'the simulation names the watching adult, the breathing check and a No with its reason');
    const simBip=await page.evaluate(()=>window.__bipText());check(simBip.includes('BREATHING: NO HOLD MAY RESTRICT IT')&&simBip.includes('Breathing during the hold:'),'the simulated plan copies the rule and the breathing line to the BIP');
    /* a file saved before the change */
    await openText(page,JSON.stringify(OLD['CR-1']));
    check(await page.evaluate(()=>S.meta.client==='Old Record Student'&&!S.meta.rpNeed&&!S.meta.rWatch&&!document.querySelector('[data-mc="rpR1"]').checked),'an earlier file opens, with the new entries empty');
    await view(page,'deb');check(/Not answered yet/.test(await text(page,'#rpVerdict')),'an earlier file: the report question reads as not answered');
    await view(page,'plan');check(/No adult is named/.test(await text(page,'#breathVerdict')),'an earlier file: no watching adult named');
    const again=JSON.parse(await saveText(page));check(again.S.meta.client==='Old Record Student'&&again.S.log.length>=1&&again.S.log[0].d==='9/2/26','an earlier file saves again with its entries');
    check(log.length===0,'no console errors on CR-1',log);await page.close();}

  /* ======================================================================== IM-1 */
  {console.log('\n=== IM-1 ('+ED+')');const log=[];const page=await openPage(ctx,'IM-1',log);
    await view(page,'map');
    check(await shown(page,'#imRule')&&/Two adults/.test(await text(page,'#imRule'))&&/genitals, buttocks, breasts/.test(await text(page,'#imRule')),'the body map states the two-adult rule and the private areas');
    const priv=await page.evaluate(()=>[...document.querySelectorAll('#imMaps path[data-loc="hips"]')].map(p=>p.classList.contains('imPriv')&&/private area/.test(p.getAttribute('aria-label'))));
    check(priv.length===2&&priv.every(Boolean),'Hips/buttocks is shaded and labelled a private area on both figures',priv);
    const opts=await page.evaluate(()=>['genitalia','rectum','hips'].map(l=>{const o=document.querySelector('#imAddLoc option[value="'+l+'"]');return o?o.disabled:'missing';}));
    check(opts.every(x=>x===true),'the location list offers no private area',opts);
    await page.click('#imFig-back path[data-loc="hips"]');await sleep(150);
    check(await page.evaluate(()=>S.cur.rows.length===0&&SELP==='hips'),'tapping the buttocks adds no row');
    check(await page.$('#imSide button[data-carenew="buttocks"]')!==null&&/do not examine private areas/.test(await text(page,'#imSide')),'the side panel offers only the care path');
    await page.evaluate(()=>{const e=document.querySelector('#imFig-front path[data-loc="hips"]');e.focus();e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await sleep(100);
    check(await page.evaluate(()=>S.cur.rows.length===0),'the keyboard on a private area adds no row either');
    check(await page.evaluate(()=>{const n=S.cur.rows.length;addLoc('genitalia');addLoc('rectum');return S.cur.rows.length===n;}),'a private area cannot be added from the list');
    check(!(await shown(page,'#imCareEdit [data-cd="seen"]')),'the care panel is closed until it is asked for');
    await page.click('#imFig-back path[data-loc="hips"]');await sleep(150);
    await page.click('#imSide button[data-carenew="buttocks"]');await sleep(150);
    check(await page.evaluate(()=>document.querySelector('#imCareEdit [data-cd="area"]').value==='buttocks'&&!!document.querySelector('#imCareEdit [data-cd="date"]').value),'the care panel opens with the area and today');
    const add=async()=>{await page.evaluate(()=>document.querySelector('#imCareAdd').click());await sleep(150);};
    await add();check(await page.evaluate(()=>S.care.length===0)&&/the second adult present, with their role/.test(await text(page,'#imCareMiss')),'an empty entry is not added, and says what is missing');
    for(const [k,v] of [['task','help with toileting'],['seen','A small bruise, about 2 cm, on the left buttock'],['by','Aide Test'],['byRole','Paraprofessional'],['second','Teacher Test'],['nurse','Told at 10:30']])await setVal(page,'#imCareEdit [data-cd="'+k+'"]',v);
    await add();check(await page.evaluate(()=>S.care.length===0)&&/the second adult present, with their role/.test(await text(page,'#imCareMiss')),'the second adult needs a role');
    await setVal(page,'#imCareEdit [data-cd="secondRole"]','Teacher');await add();
    check(await page.evaluate(()=>S.care.length===0)&&/the answer to Does this need a report/.test(await text(page,'#imCareMiss')),'the report question must be answered');
    await tick(page,'#imCareEdit [data-rs="draft"][data-rk="r3"]',true);await sleep(80);
    check(/so a report is needed/.test(await text(page,'#imCareEdit [data-rv="draft"]')),'the draft\'s tick asks for a report');
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="need"]','yes');await add();
    check(await page.evaluate(()=>S.care.length===1&&S.care[0].area==='buttocks'&&S.care[0].second==='Teacher Test'&&S.care[0].rep.r3===true&&S.care[0].rep.need==='yes'),'with everything filled in, the entry is added');
    check(await page.evaluate(()=>S.cur.rows.length===0),'the care entry is not a scored row');
    check(/Buttocks/.test(await text(page,'#imCare tbody'))&&/still to record when, to whom and by whom/.test(await text(page,'#imCare tbody')),'the care log lists it, with the report still to record');
    check(/still needs its report recorded/.test(await text(page,'#imCareVerdict')),'the care log asks for the report');
    await page.evaluate(()=>document.querySelector('#imCare button[data-careedit="0"]').click());await sleep(150);
    await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="when"]','10/1/2026, 11:00 AM');await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="to"]','Hotline, ref T-1');await setVal(page,'#imCareEdit [data-rs="draft"][data-rk="by"]','Aide Test');
    await add();
    check(await page.evaluate(()=>S.care.length===1&&S.care[0].rep.to==='Hotline, ref T-1'),'Edit and Save changes correct the entry in place');
    check((await text(page,'#imCareVerdict'))==='','the report recorded: nothing left to ask');
    check(await page.evaluate(()=>document.body.classList.contains('view-history')),'the care path is the log on the History page, beside the nurse checks');
    /* two adults at every check */
    await view(page,'map');
    await page.evaluate(()=>{document.querySelector('[data-a="examiner"]').value='Nurse Test';document.querySelector('[data-a="examiner"]').dispatchEvent(new Event('input',{bubbles:true}));});await sleep(80);
    check(/Name the second adult/.test(await text(page,'#imTwoVerdict')),'one adult named: the map asks for the second');
    await page.click('#imFig-front path[data-loc="chest"]');await sleep(150);
    check(/does not include the breasts/.test(await text(page,'#imSide')),'the chest check says it does not include the breasts');
    await page.selectOption('#imSide select[data-f="how"]','unknown');await sleep(150);
    check(/Chest\/stomach \(how it happened is not known\)/.test(await text(page,'#imRepCur [data-rv="cur"]'))&&await page.evaluate(()=>!!document.querySelector('#imRepCur .v-no')),'a location of unknown cause is named under the report question');
    await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(250);
    check(await page.evaluate(()=>S.hist.length===0),'Save to history refuses an administration without the second adult');
    await setVal(page,'[data-a="second"]','Aide Test, paraprofessional');await sleep(80);
    check(/Two adults at this check/.test(await text(page,'#imTwoVerdict')),'both adults named');
    await setVal(page,'#imRepCur [data-rs="cur"][data-rk="need"]','yes');
    await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(300);
    check(await page.evaluate(()=>S.hist.length===1&&S.hist[0].second==='Aide Test, paraprofessional'&&S.hist[0].rows[0].how==='unknown'&&S.hist[0].rep.need==='yes'),'with both named, it is filed with the second adult, the cause and the answer');
    await view(page,'history');check(/with Aide Test/.test(await text(page,'#imHist tbody'))&&/Report: Yes/.test(await text(page,'#imHist tbody')),'the History shows the second adult and the report answer');
    /* print */
    await view(page,'map');
    const pr=await printShown(page,['#imRule','#imRepCur','#imCare','#imGuideSafety']);
    check(Object.values(pr).every(Boolean),'print: the rule, the report question, the care log and the Guide table print',pr);
    check(!(await printShown(page,['#imCareEdit']))['#imCareEdit'],'print: the entry panel does not print');
    /* the Guide */
    const g=await text(page,'#imGuideSafety');
    ['Two adults, always','What is looked at','Private areas are never examined','Noticed during required care','Does this need a report?','your state’s law and your agency’s policy'].forEach(p=>check(g.includes(p),'Guide: '+p));
    /* the draft travels with the record */
    await page.evaluate(()=>{document.querySelector('#imCareEdit button[data-carenew]')&&document.querySelector('#imCareEdit button[data-carenew]').click();});await sleep(100);
    await setVal(page,'#imCareEdit [data-cd="seen"]','half-written note');
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.S.careDraft&&d.S.careDraft.seen==='half-written note'&&d.S.care.length===1,'Save data keeps the care log and a half-written entry');
    const before=await page.evaluate(()=>JSON.stringify(S));
    await page.evaluate(()=>{S=blank();CARE_OPEN=false;renderAll();});await openText(page,saved);
    check(await page.evaluate(()=>JSON.stringify(S))===before,'save and reopen give the same record');
    check(await page.evaluate(()=>document.querySelector('#imCareEdit [data-cd="seen"]')&&document.querySelector('#imCareEdit [data-cd="seen"]').value==='half-written note'),'the half-written entry comes back open');
    /* the CSV */
    await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(250);
    const csv=await page.evaluate(()=>window.__saved)||'';const head=(csv.split('\n')[0]||'').split('","');
    check(head.length===22&&/How it happened/.test(head[19])&&/Second adult/.test(head[20])&&/Report/.test(head[21]),'CSV: the three new columns at the end, the others where they were',head.slice(17));
    check(/"Noticed during required care"/.test(csv),'CSV: the care log is in it');
    /* the simulation */
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
    check(await page.evaluate(()=>S.hist.every(h=>!!h.second&&h.rep.need==='no')&&S.care.length===1&&S.care[0].rep.need==='yes'&&!!S.care[0].rep.to),'the simulation names the second adults, answers the question, and has one care entry with its report');
    check(await page.evaluate(()=>!S.hist.some(h=>h.rows.some(r=>isPriv(r.loc)))),'the simulation examines no private area');
    /* a file saved before the change */
    await openText(page,JSON.stringify(OLD['IM-1']));
    check(await page.evaluate(()=>S.meta.client==='Old Record Student'&&S.cur.second===''&&S.care.length===0&&S.cur.rows.length===2&&S.cur.rows[0].loc==='genitalia'&&S.cur.rows[0].how===''),'an earlier file opens: its rows kept, the new entries empty');
    await view(page,'map');
    check(/made before the private-area rule: Genitalia/.test(await text(page,'#imRoNote'))&&/private area; recorded before the rule/.test(await text(page,'#imChart tbody')),'an earlier private-area row is kept and marked');
    check(/Genitalia \(a private area\)/.test(await text(page,'#imRepCur [data-rv="cur"]')),'the report question names it');
    await page.evaluate(()=>document.querySelector('#saveAdmBtn').click());await sleep(250);
    check(await page.evaluate(()=>S.hist.length===1),'an earlier administration is not filed until the second adult is named');
    check(log.length===0,'no console errors on IM-1',log);await page.close();}

  /* ======================================================================== IC-1 */
  {console.log('\n=== IC-1 ('+ED+')');const log=[];const page=await openPage(ctx,'IC-1',log);
    await view(page,'consent');
    const cf=await text(page,'#icConf');
    ['What we keep private, and when we must share','may be harmed, may harm themselves, or may hurt someone else','abuse or neglect','report the same day','court order','whose job is to keep your child and others safe','we tell you what we shared'].forEach(p=>check(cf.includes(p),'family limits of confidentiality: '+p,cf.slice(0,160)));
    check(!/§|F\.S\.|statute/.test(cf),'the family text cites no statute');
    await view(page,'proc');
    const ij=await text(page,'#icInjury');
    ['E. Checking for injuries','Two adults, always','What may be looked at','Private areas are never examined by staff','genitals, buttocks or breasts','help with toileting or changing'].forEach(p=>check(ij.includes(p),'injury checks: '+p));
    check(/^F\. How you would like to be kept informed/.test(await page.evaluate(()=>[...document.querySelectorAll('#proc .chdt')].pop().textContent)),'the contact preferences are part F');
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').getAttribute('aria-label'))==='Decision: Checking for injuries','the decision is named for its card');
    await view(page,'record');check(/of 5$/.test(await text(page,'#stDec')),'the record counts five specific decisions',await text(page,'#stDec'));
    check(await page.evaluate(()=>[...document.querySelector('[name="log[0].ev"]').options].some(o=>o.text==='Limits of confidentiality explained')),'the consent record logs the explanation of the limits');
    await view(page,'consent');await page.evaluate(()=>{document.querySelector('#cMethod').value='sign';document.querySelector('#cMethod').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[name="c.decision"][value="yes"]').click();});
    await setVal(page,'[name="ij.dec"]','yes');await sleep(100);
    check(/Injury checks are consented to; still to enter: when checks are done; who checks, and the second adult/.test(await text(page,'#statusBox')),'Yes to injury checks asks when, who and the second adult');
    check(await page.evaluate(()=>document.querySelector('#icInjury').classList.contains('dec-yes')),'the card shows the Yes');
    await setVal(page,'[name="ij.when"]','At intake and every 3 weeks');await setVal(page,'[name="ij.who"]','School nurse, with the aide');await setVal(page,'[name="ij.init"]','TP');await setVal(page,'[name="ij.date"]','2026-10-01');await sleep(100);
    check(!/Injury checks/.test(await text(page,'#statusBox')),'filled in: nothing more asked about injury checks');
    await setVal(page,'[name="ij.dec"]','no');await sleep(80);check(await page.evaluate(()=>document.querySelector('#icInjury').classList.contains('dec-no')),'the card shows the No');
    await setVal(page,'[name="ij.dec"]','yes');
    const pr=await printShown(page,['#icConf','#icInjury','#icGuide6']);check(Object.values(pr).every(Boolean),'print: the limits, the injury-check card and the Guide section print',pr);
    const saved=await saveText(page);const d=JSON.parse(saved);
    check(d.fields['ij.dec']==='yes'&&d.fields['ij.who']==='School nurse, with the aide'&&d.fields['ij.init']==='TP','saved: the injury-check decision');
    await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value===''),'cleared');
    await openText(page,saved);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value==='yes'&&document.querySelector('[name="ij.when"]').value==='At intake and every 3 weeks'),'reopened: the injury-check decision is back');
    await openText(page,JSON.stringify(OLD['IC-1']));
    check(await page.evaluate(()=>document.querySelector('[name="c.client"]').value==='Old Record Student'&&document.querySelector('[name="fa.dec"]').value==='no'&&document.querySelector('[name="ij.dec"]').value===''),'an earlier file opens, with the injury-check decision empty');
    const pe=await page.evaluate(()=>{const dd=document.querySelector('[name="ij.dec"]').closest('.decide');return dd.classList.contains('ic-dec-empty');});
    check(pe,'an undecided injury check prints its choices as boxes to mark');
    await view(page,'guide');const g=await text(page,'#guide');
    check(g.includes('6. What Stays Private, and Injury Checks')&&/Standard 3\.10/.test(g),'the Guide explains the limits and the injury checks');
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
    check(await page.evaluate(()=>document.querySelector('[name="ij.dec"]').value==='na'),'the simulation records injury checks as not proposed');
    check(log.length===0,'no console errors on IC-1',log);await page.close();}

  /* ======================================================================== SI-1 */
  {console.log('\n=== SI-1 ('+ED+')');const log=[];const page=await openPage(ctx,'SI-1',log);
    await view(page,'interview');
    check(await page.evaluate(()=>{const c=document.querySelector('#siConf'),q=document.querySelector('#qLike'),i=document.querySelector('#siConf ~ .instr');return !!c&&!!q&&!!(c.compareDocumentPosition(q)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!i&&/Before the first question/.test(i.textContent);}),'the read-aloud box comes before the first question');
    const rd=await text(page,'#siConfText');
    ['who will hear what you tell me','your parent or guardian may read it','I cannot keep private','someone is hurting you','hurt yourself or someone else','whose job is to keep you safe','The law says I must'].forEach(p=>check(rd.includes(p),'reading version: '+p,rd.slice(0,200)));
    await page.click('#verSeg button[data-ver="young"]');await sleep(150);
    const yg=await text(page,'#siConfText');
    check(yg!==rd&&yg.includes('grown-up whose job is to keep kids safe')&&yg.includes('Is that OK?'),'younger version: its own words',yg.slice(0,200));
    const pr=await printShown(page,['#siConf']);check(pr['#siConf'],'print: the box prints');
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
    await view(page,'guide');check(/Who hears the answers/.test(await text(page,'section.only-guide'))&&/Code 3\.10/.test(await text(page,'section.only-guide')),'the Guide explains who hears the answers');
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
    check(await page.evaluate(()=>S.chk.conf_read===true&&!!S.meta.conf_say),'the simulation reads the box aloud first');
    check(log.length===0,'no console errors on SI-1',log);await page.close();}

  console.log('\n'+(count-fails)+' of '+count+' checks passed'+(fails?'; '+fails+' FAILED':''));
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
