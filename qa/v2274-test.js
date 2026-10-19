/* v22.74 Form GC-1, review Wave 3 part 1: the poster shows the current criterion and the real way to win (F280); the
   decision rules count only the game days at the current criterion and phase, wait three days before any change, and
   fade on one rule (F281); Met is scored by the arrangement, with a criterion per team (F282); the fidelity steps fit the
   arrangement and the Record holds while fidelity is missing or low (F283); the case fills this student's plan line,
   not the class definition, and the class system goes out to the case and PR-1 (F284). Simulated data only.
   usage: node qa/v2274-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const GC='GC-1_Group-Contingencies_v2026-10.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async p=>{await p.evaluate(async()=>{await loadSim();});await sleep(400);};
  const setM=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},[k,v]);
  const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},s);
  /* the verdict for the first n rows of the worked example (with the fidelity log as given) */
  const at=(p,n,fl)=>p.evaluate(([n,fl])=>{const keepL=JSON.stringify(S.log),keepF=JSON.stringify(S.fl);S.log=S.log.slice(0,n);if(fl)S.fl=fl==='none'?[]:fl;renderRecord();
    const v=document.querySelector('#logVerdict').textContent.replace(/\s+/g,' ');S.log=JSON.parse(keepL);S.fl=JSON.parse(keepF);renderRecord();return v;},[n,fl||null]);

  let p=await open(GC);await sim(p);
  const D=await p.evaluate(()=>S.log.map(r=>r.date));
  /* ---------------- F281 the decision rules ---------------- */
  const s0=await p.evaluate(()=>({n:S.log.length,ph:S.log.map(r=>r.ph).join(''),crit:S.log.map(r=>r.crit).join(','),met:S.log.map(r=>rowMet(r)===null?'-':rowMet(r)?'Y':'N').join('')}));
  ok('1 F281 the worked example: four baseline days, then 5, 4, 3 and the terminal 2 in phase 1, each held at least three days, then phase 2 at 2 (one change at a time)',
    s0.n===23&&s0.ph==='BBBB1111111111111111222'&&s0.crit===',,,,5,5,5,5,4,4,4,4,3,3,3,2,2,2,2,2,2,2,2'&&s0.met==='----NYYYYNYYYYYYYYYYYYY',s0);
  const v8=await at(p,8),v9=await at(p,9),v11=await at(p,11),v12=await at(p,12),v15=await at(p,15),v20=await at(p,20),vAll=await txt(p,'#logVerdict');
  ok('2 F281 four days at 5, three met: tighten from 5 to 4',/Met on 3 of the last 4 game days at 5 fouls per team since [\d/]+: tighten the criterion from 5 to 4 fouls per team \(terminal 2\)\./.test(v8),v8);
  ok('3 F281 the day after the step: one day at 4, so hold (the days at 5 no longer count)',/1 game day at 4 fouls per team since [\d/]+: hold\. No step until 3 game days have been played at this criterion in phase 1/.test(v9)&&!/tighten/.test(v9),v9);
  ok('4 F281 three days at 4, two met: hold the criterion',/Met on 2 of the last 3 game days at 4 fouls per team since [\d/]+: hold the criterion\./.test(v11),v11);
  ok('5 F281 four days at 4, three met: tighten to 3; three days at 3, all met: tighten to the terminal 2',/tighten the criterion from 4 to 3/.test(v12)&&/Met on 3 of the last 3 game days at 3 .*tighten the criterion from 3 to 2/.test(v15),[v12,v15]);
  ok('6 F281 the terminal value met on 5 game days in a row: move to phase 2',/Met on 5 game days in a row at the terminal value at 2 fouls per team since [\d/]+: move to phase 2 on the fading table \(three announced days a week, in the same period/.test(v20),v20);
  ok('7 F281 phase 2: three game days in a row at the terminal value; phase 3 is due after 6 (the fading table)',/Phase 2 .*At the terminal value at 2 fouls per team in phase 2 since [\d/]+: met on 3 game days in a row; phase 3 is due after 6 in a row \(fading table\)\./.test(vAll),vAll);
  /* relax: four misses at 5, then one day met at 6 */
  const rx=await p.evaluate(()=>{const keep=JSON.stringify(S.log);S.log=S.log.slice(0,8);for(let i=4;i<8;i++)S.log[i].v=['7','8','',''];renderRecord();const a=document.querySelector('#logVerdict').textContent.replace(/\s+/g,' ');
    S.log.push({date:S.log[7].date,ph:'1',crit:'6',v:['5','4','',''],rw:'',note:''});renderRecord();const b=document.querySelector('#logVerdict').textContent.replace(/\s+/g,' ');S.log=JSON.parse(keep);renderRecord();return [a,b];});
  ok('8 F281 four misses at 5: relax to 6; one day at 6, met: hold (not relax again to 7)',/Met on 0 of the last 4 game days at 5 .*relax the criterion by one step \(to 6\)/.test(rx[0])&&/1 game day at 6 .*hold/.test(rx[1])&&!/to 7/.test(rx[1]),rx);
  /* the Design sheet's numbers */
  await setM(p,'cc_up','Met by every team on 4 of the last 4 game days at this criterion');const u4=await at(p,8);await setM(p,'cc_up','Met by every team on 3 of the last 4 game days at this criterion (working convention)');
  await setM(p,'cc_hold','4');const h4=await at(p,15);await setM(p,'cc_hold','3');
  ok('9 F281 the numbers come from the Design sheet: 4 of the last 4 holds at 3 of 4; 4 days before a change holds after 3 days at 3',/Met on 3 of the last 4 game days at 5 .*hold the criterion/.test(u4)&&/3 game days at 3 .*No step until 4 game days/.test(h4),[u4,h4]);
  const fade=await p.evaluate(()=>[...document.querySelectorAll('#fadeTbl tbody tr')].map(r=>r.children[4].textContent));
  const guide=await txt(p,'#guide');
  ok('10 F281 one fading rule in the table, the Guide and the Record: the terminal value met on 5 game days in a row (phase 1), 6 (phases 2 and 3)',
    /^The terminal criterion met on 5 game days in a row/.test(fade[0])&&/^The terminal criterion met on 6 game days in a row/.test(fade[1])&&/^The terminal criterion met on 6 game days in a row/.test(fade[2])&&
    /met on 5 game days in a row in phase 1, and on 6 in a row in phases 2 and 3/.test(guide)&&!/has been met on 5 game days \(/.test(guide),fade);

  /* ---------------- F283 the fidelity gate and steps ---------------- */
  const g0=await at(p,8,'none'),g1=await at(p,8,[{date:D[6],who:'x',pct:'60',missed:'5, 6, 9'}]),g2=await at(p,20,[{date:D[16],who:'x',pct:'100',missed:''}]),g3=await at(p,20,[{date:D[14],who:'x',pct:'100',missed:''}]);
  ok('11 F283 no fidelity check since the criterion began: the rule says tighten, but hold',/The rule says tighten the criterion from 5 to 4 fouls per team \(terminal 2\), but hold the criterion: no fidelity check is logged since the criterion became 5 on [\d/]+ \(Fidelity sheet\)\. Score a game period on the Fidelity sheet; at 80% or more, take the step\./.test(g0),g0);
  ok('12 F283 a check under 80% since then: hold; a check from before the criterion began does not count for it',/the latest fidelity check since then \([\d/]+, 60%\) is under 80%/.test(g1)&&/: move to phase 2/.test(g2)&&/but hold the criterion: no fidelity check is logged since the criterion became 2/.test(g3),[g1,g2,g3]);
  const steps=t=>p.evaluate(t=>{setType(t);renderAll();return [...document.querySelectorAll('#fidTbl tbody tr')].map(r=>r.children[1].textContent.replace(/\s+/g,' '));},t);
  const fg=await steps('gbg'),ft=await steps('tootle'),fd=await steps('dep'),fs=await steps('selfmon');await p.evaluate(()=>{setType('gbg');renderAll();});
  ok('13 F283 eleven common steps, praise and a neutral voice as two; tootling, dependent and self-monitoring add their own',
    fg.length===11&&/^A specific praise statement naming the team/.test(fg[4])&&/^Each foul or miss was marked in a neutral voice/.test(fg[5])&&
    ft.length===13&&/screened for put-downs and tattling/.test(ft[11])&&/this arrangement’s own steps from here/.test(ft[11])&&fd.length===13&&/not named or blamed/.test(fd[11])&&fs.length===13&&/cue came on time/.test(fs[11]),{fg:fg.length,ft:ft.slice(10),fd:fd.length});
  /* a tootling day: the common team steps N/A, tootling's own No: not 100% */
  const tp=await p.evaluate(()=>{setType('tootle');renderAll();fidSteps().forEach(({s,i})=>{S.fid[i]={in:s.for?'No':'Yes',note:''};});renderFidelity();const r=[fidStats().pct,document.querySelector('#fidVerdict').textContent];setType('gbg');renderAll();return r;});
  ok('14 F283 a tootling observation with tootling’s own steps missed does not read as the game run as written',tp[0]<90&&!/ran as written/.test(tp[1]),tp);

  /* ---------------- F280 the poster ---------------- */
  await p.evaluate(()=>{setView('poster');renderPoster();});
  const po=await p.evaluate(()=>({goal:document.querySelector('.po-goal').textContent,row:[...document.querySelectorAll('.po-score td.crit')].map(x=>x.textContent).join('|'),
    win:[...document.querySelectorAll('#posterOut .po-big')].map(x=>x.textContent).join(' / ')}));
  ok('15 F280 the scoreboard shows the current criterion (2, since it began), not the Starting criterion (5); the winning line follows the rule',
    po.goal==='The goal: no more than 2 fouls per team (since '+D[15]+')'&&po.row==='Goal|2|2|2|2|2'&&/Every team at or under the goal wins\./.test(po.win)&&!/5/.test(po.row),po);
  await setM(p,'g_win','The team with the fewest fouls wins (ties both win)');await sleep(350);
  const pf=await p.evaluate(()=>({goal:document.querySelector('.po-goal').textContent,row:document.querySelector('.po-score td.crit').textContent,win:[...document.querySelectorAll('#posterOut .po-big')].map(x=>x.textContent).join(' / '),
    card:document.querySelectorAll('#posterOut .po-page')[2].textContent.replace(/\s+/g,' ')}));
  ok('16 F280 fewest fouls wins: the scoreboard says so (no "every team can win"), the criterion is a target, and the rules card agrees',
    /^Our target: no more than 2 fouls per team/.test(pf.goal)&&pf.row==='Target'&&/The team with the fewest fouls wins\. Ties both win\./.test(pf.win)&&!/Every team can win/.test(pf.win)&&/How to win ?The team with the fewest fouls wins\. Ties both win\./.test(pf.card),pf);
  await setM(p,'g_win','Every team with no more than the criterion number of fouls wins (all teams can win)');
  /* CW-FIT: one numeric goal; the Design sheet warns when the written goal disagrees */
  const cw=await p.evaluate(()=>{const keep=JSON.stringify(S);setType('cwfit');Object.assign(S.meta,{dir:'high',unit:'points per team',c_goal:'8 of 10 intervals',crit:'6'});S.log=[];renderAll();const a=document.querySelector('#designVerdict').textContent;S.meta.crit='8';renderAll();const b=document.querySelector('#designVerdict').textContent;
    const card=document.querySelectorAll('#posterOut .po-page')[2].textContent.replace(/\s+/g,' ');S.log=[{date:'10/1',ph:'1',crit:'9',v:['9','10','',''],rw:'',note:''}];renderAll();const card2=document.querySelectorAll('#posterOut .po-page')[2].textContent.replace(/\s+/g,' ');S=JSON.parse(keep);renderAll();return [a,b,card,card2];});
  ok('17 F280 CW-FIT: a written goal without the scored number is flagged; the poster’s rules card takes the number, then the Record’s current one',
    /The written goal the teams reach \(“8 of 10 intervals”\) does not hold the number the Record scores \(6, the Starting criterion\)/.test(cw[0])&&!/does not hold the number/.test(cw[1])&&/A team that reaches at least 8 points per team earns/.test(cw[2])&&/A team that reaches at least 9 points per team earns/.test(cw[3]),cw);

  /* ---------------- F282 scoring by arrangement ---------------- */
  const sc=await p.evaluate(()=>{const keep=JSON.stringify(S);const out={};
    S.type='interdep';S.teams=[];S.meta.id_unit='The whole class, as one group';S.meta.id_rule='Every student meets the criterion';S.meta.dir='low';
    S.log=[{date:'10/1',ph:'1',crit:'2',v:['0','','',''],rw:'',note:''},{date:'10/2',ph:'1',crit:'2',v:['3','','',''],rw:'',note:''}];renderAll();
    out.every=[rowMet(S.log[0]),rowMet(S.log[1]),document.querySelector('#lTbl thead').textContent,document.querySelector('#lHow').textContent];
    S.meta.id_rule='The class total or mean meets the criterion';S.teams=[{name:'Blue Jays',members:'',crit:''},{name:'Team of one',members:'',crit:'1'}];
    S.log=[{date:'10/3',ph:'1',crit:'3',v:['3','2','',''],rw:'',note:''}];renderAll();out.one=[cellMet(S.log[0],0),cellMet(S.log[0],1),rowMet(S.log[0]),document.querySelector('#lTbl thead').textContent];
    S.meta.id_unit='Teams, the best team wins (ties both win)';S.teams[1].crit='';renderAll();out.best=[winMode(),winners(S.log[0]).map(colName).join(','),!!document.querySelector('#lTbl td.won')];
    S.type='indep';S.meta.in_share='80';S.log=[{date:'10/4',ph:'1',crit:'4',v:['20','17','',''],rw:'',note:''},{date:'10/5',ph:'1',crit:'4',v:['20','15','',''],rw:'',note:''}];renderAll();
    out.indep=[rowMet(S.log[0]),rowMet(S.log[1]),[...document.querySelectorAll('#lTbl td.shr')].map(x=>x.textContent).join(','),document.querySelector('#lTbl thead').textContent];
    S=JSON.parse(keep);renderAll();return out;});
  ok('18 F282 interdependent, every student: the cell is the number of students over the criterion, met at 0 (a class total of 14 is no longer scored)',
    sc.every[0]===true&&sc.every[1]===false&&/Students over it/.test(sc.every[2])&&/each cell holds the number of students over the criterion that day; the class meets it at 0/.test(sc.every[3]),sc.every);
  ok('19 F282 a team of one with its own criterion of 1: 2 fouls is not met on a day whose criterion is 3, and the heading shows it',sc.one[0]===true&&sc.one[1]===false&&sc.one[2]===false&&/Team of onecriterion 1/.test(sc.one[3]),sc.one);
  ok('20 F282 teams where the best team wins: a Won column names the winner',sc.best[0]===true&&sc.best[1]==='Team of one'&&sc.best[2],sc.best);
  ok('21 F282 independent: students present and students who earned; met when the share earning reaches 80%',sc.indep[0]===true&&sc.indep[1]===false&&sc.indep[2]==='85%,75%'&&/Present.*Earned.*Share/.test(sc.indep[3]),sc.indep);
  /* the old option is reworded on a file saved before */
  const ow=await p.evaluate(()=>{const o=fromFile({form:'GC-1',rev:'2026-10',S:{v:2,meta:{id_rule:'The score of the lowest student meets the criterion'},type:'interdep',fid:Array.from({length:10},(_,i)=>({in:i===4?'Yes':i===5?'No':'Yes',note:i===4?'praise seen':''}))}});S=o;renderAll();
    const r={rule:S.meta.id_rule,sel:document.querySelector('[data-m="id_rule"]').value,f4:S.fid[4],f5:S.fid[5],f6:S.fid[6],n:S.fid.length};return r;});
  ok('22 F282/F283 a file saved before: the "lowest student" option reads as the student who did least well; the ten old fidelity steps are mapped (old step 5 to both new steps 5 and 6, with a note)',
    /^The score of the student who did least well/.test(ow.rule)&&ow.sel===ow.rule&&ow.n===22&&ow.f4.in==='Yes'&&ow.f5.in==='Yes'&&/one step before v22\.74: check\) praise seen/.test(ow.f4.note)&&ow.f6.in==='No',ow);

  /* ---------------- F284 the case ---------------- */
  await p.close();p=await open(GC);
  const CASE={behaviors:[{label:'Self-injury (head hitting)',def:'Contact of the open palm with the side of the head (simulated)',rep:'Requesting a break with the break card'},{label:'Elopement',def:'Leaving the assigned area without permission (simulated)'}],
    fn:{key:'escape',label:'Escape from demands'},goals:{red:[{text:'Mateo will request a break instead of hitting his head on 4 of 5 days (simulated)'}]}};
  const fi=await p.evaluate(c=>{const r=window.__nbhFactsIn(c);return {r,bdef:S.meta.b_def||'',plan:S.meta.plan_me||''};},CASE);
  ok('23 F284 from the case: the class definition of a disruption is left alone; this student’s plan line takes the targets, the function, the replacement and the plan goal',
    fi.bdef===''&&fi.plan==='Self-injury (head hitting) and Elopement; function: Escape from demands; replacement: Requesting a break with the break card; plan goal: Mateo will request a break instead of hitting his head on 4 of 5 days (simulated) (from the case)',fi);
  await p.evaluate(()=>{setType('gbg');S.exp=[{text:'Stay in your seat',looks:'bottom on the chair',nex:'out of seat without permission'},{text:'Hands and feet to yourself',looks:'',nex:'hitting others'}];S.meta.plan_me='';renderAll();});
  const w1=await txt(p,'#gcPlanWarn'),w1d=await txt(p,'#designVerdict');
  ok('24 F284 a foul that would count this student’s break request, and a foul naming aggression, are flagged on the Setup and Design sheets',
    /The foul “out of seat without permission” may count this student’s replacement behavior \(“Requesting a break with the break card”, Form TB-1\) against the team/.test(w1)&&/Counted against a team: “hitting others”\. Self-injury, aggression and elopement are never fouls/.test(w1)&&/may count this student’s replacement behavior/.test(w1d),w1);
  await p.evaluate(()=>{S.exp[0].looks='bottom on the chair; a break card is permission';S.exp[1].nex='touching others or their things';renderAll();});
  const w2=await txt(p,'#gcPlanWarn');
  ok('25 F284 the exception written into the expectation, and the aggression foul replaced: no flag',w2==='',w2);
  await sim(p);
  const out=await p.evaluate(()=>window.__nbhFactsOut());
  const cw2=out&&out.classwide;
  ok('26 F284 to the case: the arrangement, the start, phase 2 at 2 with the five changes, and the latest fidelity check; no other student and no class sheet',
    cw2&&cw2.arrangement==='The Good Behavior Game'&&cw2.phase==='2'&&cw2.crit===2&&cw2.changes.length===5&&cw2.changes.map(c=>c.crit+'/'+c.ph).join(' ')==='5/1 4/1 3/1 2/1 2/2'&&cw2.fid&&cw2.fid.pct===91&&/^\d{4}-\d{2}-\d{2}$/.test(cw2.start)&&/^\d{4}-\d{2}-\d{2}$/.test(cw2.since)&&
    !/M\.A\.|Blue Jays: rows|class sheet/i.test(JSON.stringify(out)),out);
  const menu=await p.evaluate(async()=>{const dl=[...document.querySelectorAll('#gcMenuList option')].map(o=>o.value);S.meta.r_rwjar='';document.querySelector('[data-m="r_rwjar"]').value='';document.getElementById('gcJarMenu').click();await new Promise(r=>setTimeout(r,100));
    return {dl,list:[document.querySelector('[data-m="reward"]').getAttribute('list'),document.querySelector('[data-m="g_prize"]').getAttribute('list')],jar:S.meta.r_rwjar};});
  ok('27 F284 the class menu feeds the reward and prize boxes (a list to pick from) and fills the reward jar',menu.dl.length===4&&menu.dl[0]==='Five minutes of free choice at the end of the day'&&menu.list.join()==='gcMenuList,gcMenuList'&&menu.jar.split('; ').length===4,menu);
  /* round trip */
  const rt=await p.evaluate(async()=>{let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const before=JSON.stringify(S);S=fromFile(JSON.parse(saved));renderAll();return before===JSON.stringify(S);});
  ok('28 save and open: the same form (teams with their own criterion, the 22 fidelity steps)',rt);

  /* ---------------- the shell and PR-1 ---------------- */
  const sh=await open('index.html');
  const reg=await sh.evaluate(()=>({src:FACT_SRC['GC-1'],gen:FACT_GEN.includes('GC-1'),has:hasFacts({classwide:{arrangement:'x'}}),sig:factsSig({classwide:{a:1}})!==factsSig({})}));
  ok('29 F284 the shell takes GC-1’s class-wide facts into the case',reg.src==='classwide'&&reg.gen&&reg.has&&reg.sig,reg);
  await sh.close();
  const pr=await open(PR);
  const line=await pr.evaluate(c=>prAlsoText({classwide:c}),cw2);
  ok('30 F284 PR-1 says the class-wide system is running: the arrangement, the phase, the criterion and the latest fidelity check',
    /^The class-wide system \(Form GC-1\): The Good Behavior Game since \d+\/\d+; phase 2 since \d+\/\d+, criterion 2 fouls per team since \d+\/\d+; latest fidelity check 91% on \d+\/\d+\.$/.test(line),line);

  ok('31 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
