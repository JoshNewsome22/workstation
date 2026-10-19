/* v22.78 Form PA-1, review Wave 3: the competing stimulus verdicts go to the case and the plan forms (F118); the trials carry a
   stop rule, medical clearance, supervision and an assent line, with Assent withdrawn in the runner (F119); the composite thirds
   are thirds of the items assessed (F121); the Leif et al. criterion only with % of intervals, and the re-test scored by the
   same test (F122); protective equipment and the mechanical-restraint rule (F124); the CSA sheet fills from the case and notes
   a social function (F123); the fit reads Incomplete until all seven are rated (F125); one engagement tag (F126); the
   walkthrough's CSA board matches the sheet (F127); session fidelity read by TI-1 (I61); a stale menu flagged on the forms that
   use it (I62). Simulated data only.
   usage: node qa/pa1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const PA='PA-1_Preference-Assessment-Protocol_v2026-09.html',TD='TD-1_Function-Based-Treatment-Developer_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async(p,k)=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(700);};
  const meta=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-meta="'+k+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const clear=p=>p.evaluate(()=>document.getElementById('clearBtn').click()).then(()=>sleep(400));

  let p=await open(PA);
  /* F118 the competing stimulus verdicts, out */
  await sim(p,'auto');
  const out=await p.evaluate(()=>{const m=window.__nbhFactsOut().menu;return {m:m.map(x=>({n:x.name,t:x.tier,v:x.csa&&x.csa.verdict,c:!!x.contra})),sum:document.getElementById('sumCsa').textContent,
    rule:(()=>{const r=nbhCase.menuItems({menu:m});return {names:r.map(x=>x.name),gone:r.gone,why:r.goneWhy,comp:r.competing.map(x=>x.name),keep:(r.find(x=>x.name==='Bubbles')||{}).keep,line:nbhCase.menuLine(m,9)};})()};});
  const pb=out.m.find(x=>x.n==='Picture book'),bub=out.m.find(x=>x.n==='Bubbles');
  ok('1 F118 every item the CSA tested carries its verdict to the case; the picture book, under which the behavior rose, is marked contra',
    out.m.every(x=>x.v)&&pb&&pb.v==='Increased'&&pb.c&&bub&&/^HC/.test(bub.v)&&!bub.c,out.m);
  ok('2 F118 the shared rule leaves the contra item out (named, with its reason), keeps a low-preference HC item, and lists the competing items; menuLine never offers the contra item',
    !out.rule.names.includes('Picture book')&&out.rule.gone.includes('Picture book')&&out.rule.why['Picture book']==='csa'&&out.rule.comp.includes('Bubbles')&&!out.rule.comp.includes('Picture book')&&
    (bub.t!=='LP'||out.rule.keep==='csa')&&!/Picture book/.test(out.rule.line),out.rule);
  ok('3 F118 the Summary names the competing items for the plan, HC first, and the item not to use as a competing item',
    /^Competing items for the plan \(competing stimulus sheet\): /.test(out.sum)&&/Not as competing items: Picture book/.test(out.sum)&&out.sum.indexOf('(HC,')<out.sum.indexOf('HC with'),out.sum);
  /* I65 a page for the family */
  await meta(p,'recs','Vibrating tube and chewy necklace during independent work (simulated)');await meta(p,'famLang','es');await sleep(100);
  const fam=await p.evaluate(()=>{let got='';const pr=window.print;window.print=()=>{const b=document.getElementById('paFam');got=b?b.innerHTML:'';};document.getElementById('paFamBtn').click();
    return new Promise(r=>setTimeout(()=>{window.print=pr;r({html:got,note:document.getElementById('paFamNote').textContent,cls:document.body.classList.contains('pa-fam-printing')});},1800));});
  ok('5a I65 the family page: Spanish headings, the items chosen most, the team\'s use as typed, the home rule and the check date; no name; the screen says to have it translated; the page goes away after printing',
    /<h1>Lo que más eligió su hijo o hija<\/h1>/.test(fam.html)&&/<li>/.test(fam.html)&&/Vibrating tube and chewy necklace during independent work/.test(fam.html)&&/En casa/.test(fam.html)&&!/SIMULATED|Sample Student|SIM-000/.test(fam.html)&&
    /Have the district’s interpreter translate them first/.test(fam.note)&&!fam.cls,fam);
  await meta(p,'famLang','');
  /* F126 one engagement tag */
  const tags=await p.evaluate(()=>({t:document.getElementById('csa').innerText,cells:[...document.querySelectorAll('#csaTbl td[id^="csaTbl-C"]')].map(t=>t.textContent)}));
  ok('4 F126 no row carries "HP, not competing"; a high-engagement item is tagged High engagement beside its category',!/HP, not competing/.test(tags.t)&&tags.cells.some(c=>/High engagement/.test(c))&&
    !tags.cells.some(c=>/Partly competing.*not competing/.test(c)),tags.cells);
  /* F119 the safety plan in view while a trial runs; Assent withdrawn ends the trial and Save writes it */
  await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="csa"]').click();});await sleep(200);
  const safe0=await p.evaluate(()=>document.getElementById('pa-run-csa-safe').textContent);
  ok('5 F119 the runner shows the termination criteria and the assent line written on the sheet',/^End the trial when: Any broken skin or bleeding on the hand; the student asks to stop \(simulated\)\. Assent: Assent withdrawn when the student pushes the item away/.test(safe0),safe0);
  /* a free trial: clear one control cell so the runner has somewhere to write, then run, withdraw, save */
  await p.evaluate(()=>{const c=document.querySelector('#csaTbl input[data-c="0"]');c.value='';c.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  await p.evaluate(()=>{const b=document.getElementById('pa-run-csa-blk');b.value='fa';b.dispatchEvent(new Event('change',{bubbles:true}));const s=document.getElementById('pa-run-csa-ses');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));const t=document.getElementById('pa-run-csa-cond');t.value='c';t.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.evaluate(()=>document.getElementById('pa-run-csa-start').click());await sleep(1300);
  const dis=await p.evaluate(()=>document.getElementById('pa-run-csa-assent').disabled);
  await p.evaluate(()=>document.getElementById('pa-run-csa-assent').click());await sleep(200);
  const msg=await p.evaluate(()=>document.getElementById('pa-run-csa-msg').textContent);
  await p.evaluate(()=>document.getElementById('pa-run-csa-save').click());await sleep(400);
  const st=await p.evaluate(()=>({log:document.querySelector('[data-meta="csaStopped"]').value,cell:document.querySelector('#csaTbl input[data-c="0"]').value,msg:document.getElementById('pa-run-csa-msg').textContent}));
  ok('6 F119 Assent withdrawn is live while a trial runs, ends it at once, and Save writes the trial under Trials stopped early',
    dis===false&&/^Assent withdrawn at 0:0\d: the trial ended at once/.test(msg)&&/^\d+\/\d+\/\d{4} · Free access, series 1, Control \(no items\): assent withdrawn at 0:0\d\.$/.test(st.log)&&st.cell!==''&&/Written under Trials stopped early/.test(st.msg),{dis,msg,st});
  /* F122 the Leif criterion and the unit */
  await meta(p,'csaUnit','rpm');await sleep(150);await meta(p,'csaCrit','e75p15');await sleep(150);
  const leif=await p.evaluate(()=>({hc:[...document.querySelectorAll('#csaTbl td[id^="csaTbl-C"]')].filter(t=>/\bHC\b/.test(t.textContent)).length,ro:document.getElementById('csaReadout').textContent,
    optRpm:document.querySelector('#csaUnit option[value="rpm"]').disabled,optLeif:document.querySelector('#csaCrit option[value="e75p15"]').disabled}));
  ok('7 F122 with the behavior per minute the Leif et al. criterion makes no item HC and the readout says why',leif.hc===0&&/0 HC by 75% engagement/.test(leif.ro)&&/counts intervals .* no item is HC by it/.test(leif.ro),leif);
  await meta(p,'csaCrit','80');await meta(p,'csaUnit','pct');await sleep(150);
  const opts=await p.evaluate(()=>{const u=document.querySelector('[data-meta="csaUnit"]');u.value='rpm';u.dispatchEvent(new Event('input',{bubbles:true}));return {leif:document.querySelector('#csaCrit option[value="e75p15"]').disabled};});
  await meta(p,'csaUnit','pct');await meta(p,'csaCrit','e75p15');await sleep(150);
  const opts2=await p.evaluate(()=>({rpm:document.querySelector('#csaUnit option[value="rpm"]').disabled}));
  ok('8 F122 the selects do not offer the pair: per minute disables the Leif criterion, and the Leif criterion disables per minute',opts.leif===true&&opts2.rpm===true,{opts,opts2});
  /* the re-test scored by the same test: under 80% + 50% engagement an item below 50% engagement is not HC at an 85% re-test */
  await meta(p,'csaCrit','80e50');await sleep(150);
  const rt=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#csaTbl tbody tr')].slice(1);let k=-1;rows.forEach((tr,i)=>{const e=parseFloat((document.getElementById('csaTbl-E'+i)||{}).textContent);if(k<0&&e<50)k=i;});
    if(k<0)return {k};const inp=document.querySelector('#csaRetestTbl input[data-rt="'+k+'"]');inp.value='85';inp.dispatchEvent(new Event('input',{bubbles:true}));return {k,cat:document.getElementById('csaRt-C'+k).textContent};});
  ok('9 F122 the re-test category uses the criterion chosen on the sheet (80% and 50% engagement): an 85% re-test of a low-engagement item is not HC',rt.k>=0&&/^Reduced ≥ 80%, below the engagement criterion/.test(rt.cat),rt);
  await meta(p,'csaCrit','80');
  /* F124 protective equipment */
  const eq0=await p.evaluate(()=>({row:document.getElementById('csaEquipRow').hidden,note:document.querySelector('.csa-equip').textContent}));
  await meta(p,'csaBlockForm','Protective equipment (noncontingent)');await sleep(150);
  const eq1=await p.evaluate(()=>({row:document.getElementById('csaEquipRow').hidden,flag:document.getElementById('csaEquipFlag').hidden?'':document.getElementById('csaEquipFlag').textContent}));
  await meta(p,'csaEquipBy','Occupational therapist (simulated), padded gloves');await sleep(150);
  const eq2=await p.evaluate(()=>document.getElementById('csaEquipFlag').hidden);
  ok('10 F124 the sheet states the mechanical-restraint rule; protective equipment opens the recommendation fields, and the blocking condition run with it and no recommender is flagged until one is recorded',
    eq0.row===true&&/Mechanical restraint is prohibited for school personnel \(s\. 1003\.573, F\.S\.; see Form CR-1\)/.test(eq0.note)&&eq1.row===false&&/^Protective equipmentThe blocking condition is run with protective equipment, and no doctor’s or therapist’s recommendation is recorded/.test(eq1.flag)&&eq2===true,{eq0,eq1,eq2});
  /* I61 session fidelity */
  await p.evaluate(()=>window.paFidAuto('csa'));await meta(p,'fid_csa_1',true);await sleep(100);
  const fid=await p.evaluate(()=>({n:document.getElementById('fidN-csa').textContent,pf:(window.__nbhFactsOut().prefs||{}).fidelity}));
  ok('11 I61 a runner ticks what it times; the count shows beside the ticks, and the case carries the method\'s steps for Form TI-1',
    fid.n==='2 of 6 (33%)'&&Array.isArray(fid.pf)&&fid.pf.length===1&&fid.pf[0].method==='Competing stimulus'&&fid.pf[0].done===2&&fid.pf[0].steps.length===6&&fid.pf[0].steps[2].ok===true,fid);
  const pf=fid.pf;
  /* I62 the monitoring status rides on the item */
  await sim(p,'shift');
  const sh=await p.evaluate(()=>window.__nbhFactsOut().menu.filter(m=>m.mon&&m.mon.status==='Shifted').map(m=>m.name+'|'+m.mon.date));
  ok('12 I62 the shift example: the item the Monitoring sheet calls Shifted carries the status and a date',sh.length>=1&&sh.every(x=>/\|\d{4}-\d{2}-\d{2}$/.test(x)),sh);

  /* F121 the composite thirds */
  await clear(p);
  await p.evaluate(()=>{const n=document.getElementById('nStim');n.value='10';n.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  await p.evaluate(()=>{document.querySelectorAll('#poolTbl input[data-f="name"]').forEach((e,i)=>{e.value='Item '+String.fromCharCode(65+i)+' (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));});
    const put=(i,t,v)=>{const s=document.querySelector('#ssTbl select[data-i="'+i+'"][data-t="'+t+'"]');s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));};
    for(let t=0;t<5;t++){put(0,t,'A');put(1,t,t<2?'A':'N');put(2,t,'N');}});await sleep(200);
  const f121=await p.evaluate(()=>({tiers:window.__nbhFactsOut().menu.slice(0,3).map(m=>m.name+':'+m.tier),meth:document.getElementById('sumMethods').textContent,flags:document.getElementById('sumFlags').textContent,
    comp:[...document.querySelectorAll('#sumTbl tbody tr')].slice(0,3).map(tr=>tr.cells[8].textContent)}));
  ok('13 F121 three of ten items assessed: not cut into thirds; nothing handed on as HP, and the Summary says how many were assessed',
    f121.tiers.every(t=>/:$/.test(t))&&/3 of 10 stimuli assessed/.test(f121.meth)&&/^Not tiered: 3 of 10 stimuli assessed/.test(f121.flags)&&f121.comp.every(c=>c==='not tiered'),f121);
  await p.evaluate(()=>{const n=document.getElementById('nStim');n.value='6';n.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  const f121b=await p.evaluate(()=>window.__nbhFactsOut().menu.slice(0,3).map(m=>m.name+':'+m.tier));
  ok('14 F121 three of six assessed: thirds of the three assessed, so the item approached on no trial is LP, not HP',
    JSON.stringify(f121b)===JSON.stringify(['Item A (simulated):HP','Item B (simulated):MP','Item C (simulated):LP']),f121b);
  /* F125 the fit */
  await p.evaluate(()=>{const s=(f,v)=>{const e=document.querySelector('#ecoAttrTbl select[data-f="'+f+'"][data-i="0"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('port','Y');s('cons','Brief');s('sat','Low');});await sleep(150);
  const fit=await p.evaluate(()=>({eco:document.getElementById('ecoF0').textContent,sum:[...document.querySelectorAll('#sumTbl tbody tr')].find(tr=>/Item A/.test(tr.cells[0].textContent)).cells[9].textContent}));
  ok('15 F125 three of seven attributes rated: Incomplete with the count, on the Ecological sheet and the Summary, never Poor',fit.eco==='43% (3/7) Incomplete'&&fit.sum==='43% (3/7) Incomplete',fit);
  /* F127 the walkthrough's board, entered into the sheet */
  await clear(p);
  const src=fs.readFileSync(path.join(L.ROOT||path.resolve(__dirname,'..'),'NBH-Workstation',PA),'utf8');
  const grab=k=>new Function('return '+new RegExp('\\n  '+k+':(\\[\\[[\\s\\S]*?\\]\\]|\\[[^\\[\\]]*\\]),\\n').exec(src)[1])();
  const E={pool:grab('csaPool'),ctrl:grab('csaCtrl'),csa:grab('csa'),out:grab('csaOut')};
  const sheet=await p.evaluate(E=>{document.querySelectorAll('#poolTbl input[data-f="name"]').forEach((e,i)=>{e.value=E.pool[i];e.dispatchEvent(new Event('input',{bubbles:true}));});
    const n=document.getElementById('csaSeries');n.value='3';n.dispatchEvent(new Event('change',{bubbles:true}));
    const set=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    E.ctrl.forEach((v,s)=>set('#csaTbl input[data-c="'+s+'"]',v));
    E.csa.forEach((r,i)=>{for(let s=0;s<3;s++){set('#csaTbl input[data-i="'+i+'"][data-f="e'+(s+1)+'"]',r[2*s]);set('#csaTbl input[data-i="'+i+'"][data-f="p'+(s+1)+'"]',r[2*s+1]);}});
    return E.pool.map((_,i)=>[document.getElementById('csaTbl-E'+i).textContent,document.getElementById('csaTbl-P'+i).textContent,document.getElementById('csaTbl-R'+i).textContent,document.getElementById('csaTbl-C'+i).textContent]);},E);
  const board=E.out.map(r=>[r[1],r[2],r[3],(r[4]+(r[5]?' High engagement':''))]);
  const same=sheet.every((r,i)=>r[0]===board[i][0]&&r[1]===board[i][1]&&r[2]===board[i][2]&&r[3]===board[i][3]);
  const prac=/A 13% reduction is far from the 80% HC criterion/.test(src)&&!/A 14% reduction/.test(src);
  ok('16 F127 the walkthrough\'s competing-stimulus board matches what the sheet computes from its trials, digit for digit, tags included, and the practice answer says 13%',same&&prac,{sheet,board,prac});
  await p.close();

  /* F123 and F119 from the case */
  p=await open(PA);
  const F={behaviors:[{label:'Hand mouthing (simulated)',urg:3}],fn:{key:'escape',label:'Escape'},src:{fn:'FS-1'},student:{assent:'given',stop:{signs:'says "stop" or pushes the item away'}},
    evidence:{'EA-1':{fn:'Automatic',dates:'9/2/2026–9/12/2026',subtype:'Subtype 2',term:'Any tissue damage; 3 hand bites within 10 s (simulated)'}},goals:{red:[{text:'Hand mouthing from 40% to under 10% of intervals (simulated)'}],acq:[]}};
  const fin=await p.evaluate(F=>{const r=nbhCase.apply(F);const v=k=>document.querySelector('[data-meta="'+k+'"]').value;
    return {r,beh:v('csaBeh'),hyp:v('csaHyp'),sub:v('csaSubtype'),term:v('csaTerm'),as:v('csaAssent'),pur:v('purpose'),
      fw:document.getElementById('csaFnWarn').hidden?'':document.getElementById('csaFnWarn').textContent,cl:document.getElementById('csaClearFlag').hidden?'':document.getElementById('csaClearFlag').textContent};},F);
  ok('17 F123 the CSA sheet fills from the case: the target behavior, EA-1\'s result as hypothesis source, its subtype, and the purpose from the first goal',
    fin.beh==='Hand mouthing (simulated) (Form TB-1)'&&fin.hyp==='Form EA-1: Automatic, 9/2/2026–9/12/2026'&&fin.sub==='Subtype 2'&&/^Identify reinforcers for the plan’s goal: Hand mouthing from 40%/.test(fin.pur)&&fin.r.filled>=4,fin);
  ok('18 F119 F123 EA-1\'s termination criteria and the student\'s stop signals (Form SI-1) fill the safety plan; a social function in the case is noted; urgency 3 with no clearance says the safety plan is incomplete',
    fin.term==='Any tissue damage; 3 hand bites within 10 s (simulated) (Form EA-1)'&&fin.as==='Assent withdrawn when the student says "stop" or pushes the item away (Form SI-1): the trial ends at once and is marked stopped.'&&
    /^FunctionThe case’s function is Escape \(Form FS-1\)\. This sheet is written for behavior hypothesized to be automatically maintained/.test(fin.fw)&&/^Safety plan incomplete: no medical clearance\. The target behavior is at TB-1 urgency level 3/.test(fin.cl),fin);
  await meta(p,'csaClear','School nurse consulted (simulated)');await sleep(100);
  const cl2=await p.evaluate(()=>document.getElementById('csaClearFlag').hidden);
  ok('19 F119 the flag goes once the clearance is written',cl2===true,cl2);
  await p.close();

  /* F118 and I62 in TD-1 */
  p=await open(TD);
  const MENU=[{name:'Tablet (video)',tier:'HP',rank:1,csa:{verdict:'Not competing',red:13,eng:95,cond:'Free access'},mon:{status:'Shifted',date:'2026-10-10'}},
    {name:'Vibrating tube',tier:'HP',rank:2,csa:{verdict:'HC',red:92,eng:90,cond:'Free access'}},{name:'Squeeze ball',tier:'MP',rank:3,csa:{verdict:'HC (prompting)',red:84,eng:70,cond:'Prompted engagement'}},
    {name:'Picture book',tier:'MP',rank:4,csa:{verdict:'Increased',red:-21,eng:29,cond:'Free access',contra:true},contra:true},{name:'Bubbles',tier:'LP',rank:6,csa:{verdict:'HC',red:87,eng:44,cond:'Free access'}}];
  const td=await p.evaluate(M=>{nbhCase.apply({menu:M,prefs:{last:'2026-09-27',reassess:'2026-10-01'},fn:{key:'automatic',label:'Automatic'}});const e=document.querySelector('[name="m.pref"]');
    const st=document.getElementById('nbhStaleMenu');const ac=document.getElementById('addComp');ac.value='EE';document.getElementById('addCompBtn').click();const card=[...document.querySelectorAll('#compWrap .card')].find(c=>c.dataset.code==='EE');
    return {pref:e?e.value:null,stale:st&&!st.hidden?st.textContent:'',ee:card?card.querySelector('[name$=".p0"]').value:''};},MENU);
  ok('20 F118 TD-1: the competing items come first with their verdicts, HC before HC with prompting; the low-preference HC item is kept; the item the behavior rose with is left out, saying why',
    td.pref==='Competing items (Form PA-1, competing stimulus assessment): Vibrating tube (HC, 92% reduction), Bubbles (HC, 87% reduction), Squeeze ball (HC with prompting, 84% reduction in prompted engagement); Tablet (video), Vibrating tube, Squeeze ball, Bubbles (low preference, competing in PA-1) (Form PA-1, most preferred first); left out: Picture book (the behavior rose with it in Form PA-1’s competing stimulus assessment)',td.pref);
  ok('21 F118 TD-1: an environmental-enrichment card added takes the competing items as its matched stimuli',td.ee==='Vibrating tube (HC, 92% reduction), Bubbles (HC, 87% reduction), Squeeze ball (HC with prompting, 84% reduction in prompted engagement) (Form PA-1)',td.ee);
  ok('22 I62 TD-1 flags the stale menu: the item marked Shifted on PA-1 and the overdue reassessment',
    /^Reinforcer menu: ranked 9\/27 on Form PA-1; Tablet \(video\) marked Shifted on PA-1 on 10\/10; reassessment overdue since 10\/1\. Check the menu with the BCBA before using that item\.$/.test(td.stale),td.stale);
  const quiet=await p.evaluate(M=>{const m=M.map(x=>Object.assign({},x,{mon:x.mon&&{status:'Watch',date:x.mon.date}}));nbhCase.apply({menu:m,prefs:{last:'2026-09-27',reassess:'2099-01-01'}});const st=document.getElementById('nbhStaleMenu');return st?st.hidden:true;},MENU);
  ok('23 I62 a Watch status and a reassessment not yet due raise nothing',quiet===true,quiet);
  await p.close();

  /* I61 TI-1 takes the fidelity steps */
  p=await open('TI-1_Treatment-Integrity-Observation_v2026-09.html');
  const ti=await p.evaluate(pf=>{nbhCase.apply({prefs:{fidelity:pf}});const b=document.getElementById('addPA');const vis=b&&b.style.display!=='none';if(b)b.click();
    return {vis,steps:S.steps.map(s=>s.d).filter(Boolean)};},pf);
  ok('24 I61 TI-1 offers PA-1\'s assessment steps from the case and adds them, named by method',ti.vis&&ti.steps.length>=6&&ti.steps.includes('Form PA-1, competing stimulus: Every trial the same length'),ti);
  await p.close();

  /* EA-1 sends its termination criteria */
  p=await open('EA-1_Experimental-Analysis-Protocol_v2026-09.html');
  await L.loadSim(p);await sleep(900);
  const ea=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.evidence?{term:o.evidence.term||''}:null;});
  ok('25 EA-1 hands its session termination criteria to the case with its result (for PA-1)',ea&&/^Any tissue damage; 3 head hits within 10 s; student requests to stop \(simulated\)$/.test(ea.term),ea);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('26 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
