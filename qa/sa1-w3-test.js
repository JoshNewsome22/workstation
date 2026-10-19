/* v22.8x Form SA-1, skill acquisition data, review Wave 3 (simulated data only).
   F198  the GB-1 objective's criterion fills an empty Setup criterion; a Setup criterion below it is flagged; the case calls the
         program mastered only when the objective's numbers are met too (masteredRule, atObjective).
   F200  under most-to-least (or five 0-s sessions) the no-change rule reads the prompt level or the delay, not percent independent.
   F201  the trials with an error before the prompt have their own row; the least-to-most and time-delay rules read it.
   F202  several programs in one file: add, switch, shared student details, saved and opened, every program to the case.
   F203  the plan on TD-1 (replacement, reinforcement, prompted, hierarchy, fading, error correction) and FS-1's function fill
         empty lines; TD-1 sends its hierarchy, fading rule and error correction.
   F204  initials read without capitals or points.   F205  more independent than trials is a slip, not a pass.
   F206  the worked example: no independent response at a 0-s delay.   F207  the record prints without the blank sheets and the
         Guide unless asked; Revised October 2026.   I102 agreement.   I104 the prompt-level line.   I105 probes due.
   usage: node qa/sa1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/',SA=W+'SA-1_Skill-Acquisition-Data_v2026-10.html';
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('SA-1: '+e.message));await p.goto(SA);await sleep(1000);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};window.__t=[];nbhUI.toast=m=>{window.__t.push(String(m));};
    /* a program: meta, then sessions [phase, instructor, codes, delay/level, errors before the prompt] */
    window.__prog=(meta,sess)=>{S=blank();P={list:[S],cur:0};Object.assign(S.meta,{client:'SIMULATED – Sample Student',program:'Test program',ntr:'10'},meta);
      S.sess=sess.map((x,i)=>({date:'10/'+(i+1)+'/26',ph:x[0],inst:x[1],tr:Array.from(x[2]),dl:x[3]||'',note:'',...(x[4]!=null?{eu:String(x[4])}:{})}));renderAll();
      return {rules:[...document.querySelectorAll('#graphRules li')].map(l=>l.textContent),verdict:document.getElementById('graphVerdict').textContent};};});
  const M=await p.evaluate(()=>({mast:document.querySelector('.nbh-formmeta').textContent,ph:document.querySelector('.nbh-print-meta').textContent}));
  ok('F207 the masthead and the print head say Revised October 2026',/Revised October 2026/.test(M.mast)&&/Revised October 2026/.test(M.ph),M);

  /* ---------- F200 ---------- */
  let G=await p.evaluate(()=>__prog({hier:'mtl'},[['B','JE','––––––––––'],['B','JE','––––––––––'],['T','JE','FFFFFFFFFF','0'],['T','JE','FFFFFFFFFF','0'],['T','JE','PPPPPPPPPP','0'],['T','JE','PPPPPPPPPP','0'],['T','JE','VVVVVVVVVV','0']]));
  ok('F200 most-to-least with the prompt faded F, F, P, P, V (0% independent by design): "Fading", not "change the procedure"',/^Fading: the prompt level moved from F to V/.test(G.rules[0])&&!G.rules.some(r=>/change the procedure/.test(r)),G);
  G=await p.evaluate(()=>__prog({hier:'mtl'},[['B','JE','––––––––––'],['T','JE','FFFFFFFFFF'],['T','JE','FFFFFFFFFF'],['T','JE','FFFFFFFFFF'],['T','JE','FFFFFFFFFF'],['T','JE','FFFFFFFFFF']]));
  ok('F200 most-to-least stuck at full physical for 5 sessions: no change in the prompt level, so the procedure changes',/^No change in the prompt level \(F, F, F, F, F\)/.test(G.rules[0]),G);
  G=await p.evaluate(()=>__prog({hier:'ctd'},[['B','JE','––––––––––'],['T','JE','VVVVVVVVVV','0'],['T','JE','VVVVVVVVVV','0'],['T','JE','VVVVVVVVVV','0'],['T','JE','VVVVVVVVVV','0'],['T','JE','VVVVVVVVVV','0']]));
  ok('F200 constant time delay with five sessions at 0 s: the delay is overdue, and no "change the procedure" beside the time-delay advice',/^Time delay: the last 5 teaching sessions all ran at 0 s/.test(G.rules[0])&&!G.rules.some(r=>/change the procedure/.test(r))&&G.rules.some(r=>/the next session runs at the delay/.test(r)),G);
  G=await p.evaluate(()=>__prog({hier:'ltm'},[['B','JE','––––––––––'],['T','JE','PPPPPPPPPP'],['T','JE','PPPPPPPPPP'],['T','JE','PPPPPPPPPP'],['T','JE','PPPPPPPPPP'],['T','JE','PPPPPPPPPP']]));
  ok('F200 least-to-most keeps the percent rule: no change over 5 sessions says change the procedure',/^No change over the last 5 teaching sessions/.test(G.rules[0]),G);

  /* ---------- F201 ---------- */
  G=await p.evaluate(()=>__prog({hier:'ltm'},[['B','JE','––––––––––'],['T','JE','IPIPIPIPIP',null,5],['T','JE','IPIPIPIPIP',null,4],['T','JE','IPIPIPIPIP',null,4]]));
  const EU=await p.evaluate(()=>({row:!!document.querySelector('#trTbl input[data-f="eu"]'),sheet:/Errors before prompt/.test(document.getElementById('trialSheet').textContent)}));
  ok('F201 least-to-most: the row "Trials with an error before the prompt" is there (and on the blank sheet), and 43% of trials with such an error fires the error rule although every trial ended correct',EU.row&&EU.sheet&&G.rules.some(r=>/^Errors before the prompt: in the last 3 teaching sessions 43% of trials/.test(r)),{G,EU});
  G=await p.evaluate(()=>__prog({hier:'ctd'},[['B','JE','––––––––––'],['T','JE','PPPPPPPPPP','0'],['T','JE','IIIIIIIPPP','2',3]]));
  ok('F201 time delay: at 2 s with 3 of 10 trials in error before the prompt (none uncorrected), back to 0 s',G.rules.some(r=>/^Time delay: 30% of trials in error at the 2-s delay: return to 0 s/.test(r)),G);

  /* ---------- F204 ---------- */
  G=await p.evaluate(()=>{const r=__prog({hier:'mtl',mc_pct:'90',mc_n:'3',mc_inst:'2',teachers:'J. Nunez (JN); Ms. R. (MR)'},[['T','JN','IIIIIIIIII'],['T','jn','IIIIIIIIII'],['T','J.N.','IIIIIIIIII']]);r.dl=[...document.querySelectorAll('#saInits option')].map(o=>o.value);r.out=window.__nbhFactsOut().skills.programs[0].mastered;return r;});
  ok('F204 jn, JN and J.N. are one instructor: not mastered with two required; the initials in "Who teaches" are offered',/with 1 instructor|1 instructor; the criterion asks for 2/.test(G.verdict+G.rules.join(' '))&&G.out===false&&G.dl.join()==='JN,MR',G);

  /* ---------- F198 ---------- */
  const O=await p.evaluate(()=>{S=blank();P={list:[S],cur:0};renderAll();
    window.__nbhFactsIn({goals:{acq:[{beh:'Hands the break card',crit:'independently in at least 80% of opportunities',n:'3',unit:'sessions',text:'(simulated objective)'}]}});
    const a={pct:S.meta.mc_pct,n:S.meta.mc_n,obj:S.meta.obj_pct};S.meta.mc_pct='70';
    S.sess=[['T','JN','IIIIIIIPPP'],['T','MR','IIIIIIIPPP'],['T','JN','IIIIIIIIPP']].map((x,i)=>({date:'10/'+(i+1)+'/26',ph:x[0],inst:x[1],tr:Array.from(x[2]),dl:'',note:''}));renderAll();
    a.note=document.getElementById('objNote').textContent;a.gv=document.getElementById('graphVerdict').textContent;const pr=window.__nbhFactsOut().skills.programs[0];a.p={m:pr.mastered,rule:pr.masteredRule,at:pr.atObjective,pct:pr.pct,obj:pr.objective};return a;});
  ok('F198 the objective\'s 80% and 3 fill the empty criterion; a Setup criterion of 70% is flagged on the Setup page and the Graph; at 70, 70, 80% the rule says mastered but the case does not',
    O.pct==='80'&&O.n==='3'&&O.obj==='80'&&/is below the GB-1 objective \(80% across 3 sessions\)/.test(O.note)&&/below the GB-1 objective/.test(O.gv)&&O.p.rule===true&&O.p.at===false&&O.p.m===false&&O.p.pct===70&&O.p.obj==='80% across 3 sessions',O);

  /* ---------- F203 and TD-1 ---------- */
  const F3=await p.evaluate(()=>{S=blank();P={list:[S],cur:0};renderAll();
    const r=window.__nbhFactsIn({fn:{label:'Escape from demands'},plan:{rep:'Hands the break card',reinf:'a 2-minute break',sched:['Continuous reinforcement (CRF)'],prompted:'praise only',hier:'Most-to-least: full physical, partial, verbal',fade:'drop one level after 2 sessions at 80%',ec:'Model the correct response, then re-present',src:'TD-1'},menu:[{name:'iPad (simulated)'}]});
    const m=S.meta;return {r,plan:m.plan,skill:m.skill,sr:m.sr,srp:m.sr_prompt,hier:m.hier,fade:m.fade,ec:m.ec,rein:m.reinforcer};});
  ok('F203 the plan on TD-1 fills the plan line, the skill, the reinforcement and prompted lines, the hierarchy (most-to-least), the fading rule and the error correction; the function heads the reinforcer line',
    F3.plan==='BIP (Form TD-1): replacement skill: Hands the break card'&&F3.skill==='Hands the break card'&&F3.sr==='a 2-minute break; Continuous reinforcement (CRF) (Form TD-1)'&&F3.srp==='praise only (Form TD-1)'&&F3.hier==='mtl'&&/^drop one level/.test(F3.fade)&&/^Model the correct response/.test(F3.ec)&&/^The function on Form FS-1: Escape from demands; iPad/.test(F3.rein),F3);
  const td=await ctx.newPage();td.on('pageerror',e=>errs.push('TD-1: '+e.message));await td.goto(W+'TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(1500);
  const TD=await td.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('m.beh','Leaving the area (simulated)');set('pr.hier','Most-to-least');set('pr.fade','drop one level after 3 correct');set('teach.chosen','Model the correct response');const o=window.__nbhFactsOut();return o&&o.plan?{h:o.plan.hier,f:o.plan.fade,e:o.plan.ec}:null;});
  ok('F203 TD-1 sends its prompt hierarchy, fading rule and error correction with the plan',TD&&TD.h==='Most-to-least'&&TD.f==='drop one level after 3 correct'&&TD.e==='Model the correct response',TD);
  await td.close();

  /* ---------- F205 ---------- */
  const PR=await p.evaluate(()=>{S.probes=[{date:'10/9/26',type:'Maintenance',dim:'Same as training',desc:'',n:'10',k:'12',note:''}];renderAll();const r=probeRows()[0];return {pc:r.pc,pass:r.pass,cell:document.querySelector('#prTbl tbody tr').cells[7].textContent};});
  ok('F205 12 independent of 10 trials is not a pass: the cell says to check it',PR.pc===null&&PR.pass===null&&/check: more independent than trials/.test(PR.cell),PR);

  /* ---------- the worked example: F206, I102, I104, I105, F207 print ---------- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const SIM=await p.evaluate(()=>{const z=S.sess.filter(s=>s.ph==='T'&&String(s.dl)==='0');return {zeroI:z.map(s=>s.tr.filter(c=>c==='I').length),delay:S.meta.delay,change:S.meta.change,ioa:[sessStats(S.sess[6]).ioa,sessStats(S.sess[9]).ioa].map(a=>a&&Math.round(a.pct)),
    tile:document.getElementById('trMetrics').textContent,line:!!document.querySelector('#saPlot path[stroke="#9B4E15"]'),due:window.__nbhDue(),out:window.__nbhFactsOut().skills.programs.length};});
  ok('F206 in the worked example no session at a 0-s delay has an independent response, and the delay field and the change line say teaching sessions 1 and 2, then 2 s',SIM.zeroI.length===2&&SIM.zeroI.every(n=>n===0)&&/^0 for teaching sessions 1 and 2, then 2 s$/.test(SIM.delay)&&/from teaching session 3/.test(SIM.change),SIM);
  ok('I102 the paraeducator coded two sessions: 100% and 90% agreement, shown in the metrics',SIM.ioa.join()==='100,90'&&/agreement \(ioa\) ?95%/i.test(SIM.tile.replace(/\s+/g,' '))&&/2 sessions with a second observer/.test(SIM.tile.replace(/\s+/g,' ')),SIM.tile.replace(/\s+/g,' ').slice(0,200));
  ok('I104 the graph draws the delay as a dashed line on a right-hand axis',SIM.line,SIM.line);
  ok('I105 the due list has the program\'s first review date and, after mastery, the next maintenance probe',SIM.due.some(x=>/^First review date: /.test(x.what))&&SIM.due.some(x=>/^Maintenance probe, \d+ (week|weeks|month|months) after mastery/.test(x.what)),SIM.due);
  const DU=await p.evaluate(()=>{const keep=JSON.stringify(S);S.meta.mt_sched='1 week, 2 weeks, 1 month';const d0=new Date();d0.setDate(d0.getDate()-20);const md=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
    S.sess=[0,1,2].map(k=>{const d=new Date(d0);d.setDate(d.getDate()+k);return {date:md(d),ph:'T',inst:k%2?'MR':'JE',tr:Array.from('IIIIIIIIII'),dl:'',note:''};});
    const w1=new Date(d0);w1.setDate(w1.getDate()+2+7);S.probes=[{date:md(w1),type:'Maintenance',dim:'Same as training',desc:'',n:'10',k:'10',note:''}];renderAll();const r=window.__nbhDue();S=JSON.parse(keep);P={list:[S],cur:0};renderAll();return r;});
  ok('I105 mastered 18 days ago with the 1-week probe done: the 2-week probe is next on the due list',DU.some(x=>/^Maintenance probe, 2 weeks after mastery/.test(x.what)),DU);
  await p.emulateMedia({media:'print'});
  const PV=await p.evaluate(()=>{const d=id=>getComputedStyle(document.getElementById(id)).display;const a={trial:d('trialSheet'),ta:d('taSheet'),guide:getComputedStyle(document.querySelector('.only-guide')).display};
    const pg=document.getElementById('printGuide');pg.checked=true;pg.dispatchEvent(new Event('change',{bubbles:true}));a.guide2=getComputedStyle(document.querySelector('.only-guide')).display;pg.checked=false;pg.dispatchEvent(new Event('change',{bubbles:true}));return a;});
  await p.emulateMedia({media:'screen'});
  ok('F207 the ordinary print leaves out the blank sheets and the Guide; "with the Guide" adds the Guide',PV.trial==='none'&&PV.ta==='none'&&PV.guide==='none'&&PV.guide2!=='none',PV);

  /* ---------- F202 ---------- */
  const PG=await p.evaluate(async()=>{const a={};document.getElementById('progAdd').click();a.n=P.list.length;a.cur=P.cur;a.client=S.meta.client;a.sess=S.sess.length;
    const sk=document.querySelector('[data-m="skill"]');sk.value='Asks for help (simulated)';sk.dispatchEvent(new Event('input',{bubbles:true}));
    const cl=document.querySelector('[data-m="client"]');cl.value='SIMULATED – Renamed Student';cl.dispatchEvent(new Event('input',{bubbles:true}));
    a.shared=P.list.map(x=>x.meta.client);a.opts=[...document.querySelectorAll('#progSel option')].map(o=>o.textContent);
    const ps=window.__nbhFactsOut().skills.programs;a.out=ps.map(x=>x.name);
    const sel=document.getElementById('progSel');sel.value='0';sel.dispatchEvent(new Event('change',{bubbles:true}));a.back=S.sess.length;
    /* save and open */
    let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ck;const d=JSON.parse(txt);a.file={programs:(d.programs||[]).length,cur:d.cur,S:!!d.S};
    S=blank();P={list:[S],cur:0};renderAll();
    const dt=new DataTransfer();dt.items.add(new File([txt],'x.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
    a.reopened=P.list.map(x=>x.meta.skill);a.reCur=P.cur;
    /* the second program takes the second objective */
    sel.value='1';sel.dispatchEvent(new Event('change',{bubbles:true}));S.meta.skill='';S.meta.goal='';renderAll();
    window.__nbhFactsIn({goals:{acq:[{beh:'Hands the break card to the adult when a non-preferred task is presented',crit:'90%',n:'3',text:'one'},{beh:'Asks for help',crit:'80%',n:'2',text:'two'}]}});a.second=S.meta.skill;
    document.getElementById('progDel').click();await new Promise(r=>setTimeout(r,200));a.after=P.list.length;return a;});
  ok('F202 a second program in the same file: added with the student details, shown in the switcher, sent to the case with the first, saved (programs and cur) and opened again; it takes the second GB-1 objective; it can be removed',
    PG.n===2&&PG.cur===1&&PG.client==='SIMULATED – Sample Student'&&PG.sess===0&&PG.shared.every(c=>c==='SIMULATED – Renamed Student')&&PG.opts.length===2&&/Asks for help/.test(PG.opts[1])&&PG.out.length===2&&PG.back===12&&PG.file.programs===2&&PG.file.cur===0&&PG.file.S&&
    PG.reopened.length===2&&PG.reopened[1]==='Asks for help (simulated)'&&PG.reCur===0&&PG.second==='Asks for help'&&PG.after===1,PG);
  const ONE=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ck;return Object.keys(JSON.parse(txt));});
  ok('F202 a file with one program is saved as before (form, rev, saved, S)',ONE.join()==='form,rev,saved,S',ONE);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=fs.readFileSync(await dl.path(),'utf8');
  ok('the CSV: the new columns after the note, the program last',/"Note","Errors before the prompt","Observer 2 codes","Agreement %","Program"/.test(csv.split('\n')[0]),csv.split('\n')[0]);

  /* ---------- printed pages ---------- */
  const out=path.join(os.tmpdir(),'sa1w3');fs.mkdirSync(out,{recursive:true});
  const pr=async(sim,file)=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push('print: '+e.message));await q.goto(SA);await sleep(900);
    await q.evaluate(async s=>{nbhUI.confirm=async()=>true;window.print=()=>{};if(s){document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,800));}},sim);
    await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,file),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();return pages(path.join(out,file));};
  const pb=await pr(false,'blank.pdf'),ps=await pr(true,'sim.pdf');
  ok('the printed pages: the blank form 5 (11 before, with the blank sheets and the Guide), the worked example 8 (14 before)',pb===5&&ps===8,{pb,ps});
  ok('no page errors',!errs.length,errs.slice(0,3));
 }catch(e){console.error(e);fails++;}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
