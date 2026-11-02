/* v25.64 GC-1's Good Behavior Game (the BCBA, 11/2): the points version is the default; the fouls version is response cost,
   a punishment step, labelled wherever it prints and asking for the BCBA's sign-off and a reason; the simulated class (a
   fouls game) carries that sign-off. usage: node qa/gc1-gbg-points-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const p=await br.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/GC-1_Group-Contingencies_v2026-10.html');await sleep(600);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const state=()=>p.evaluate(()=>({dir:dir(),script:scriptSteps().map(x=>x.d).join(' | '),rule:document.getElementById('ruleOut').textContent.replace(/\s+/g,' '),
    poster:document.getElementById('posterOut').textContent.replace(/\s+/g,' '),win:winLine()}));
  await p.evaluate(()=>{S=blank();setType('gbg');S.teams=[{name:'Cardinals'},{name:'Blue Jays'}];S.meta.crit='3';renderAll();});await sleep(200);
  let a=await state();
  ok('1 a new Good Behavior Game counts points: the record direction is "at least"',a.dir==='high',a.dir);
  ok('2 its script gives a point to each team that followed the rules, and never marks a foul',/give a point to each team whose members all followed the rules/.test(a.script)&&!/that’s a mark/.test(a.script),a.script.slice(0,400));
  ok('3 its poster says a team earns a point when every member follows the rules',/A team earns a point when every member follows the rules/.test(a.poster)&&!/A mark goes against a team/.test(a.poster));
  ok('4 the plan says a team earns a point at each timer signal and names no foul',/earns a point at each timer signal/.test(a.rule)&&!/A foul goes against a team/.test(a.rule),a.rule.slice(0,500));
  await p.evaluate(()=>{S.meta.g_win='The team with the most points wins, and any team at or over the criterion also wins';renderAll();});await sleep(100);
  ok('5 the points win rules read on the scoreboard ("the most points wins, and every team at or over the goal")',/most points wins, and every team at or over the goal/.test(await p.evaluate(()=>winLine())));
  const opts=await p.evaluate(()=>[...document.querySelectorAll('select[data-m="g_win"] optgroup')].map(g=>g.label+': '+g.children.length));
  ok('6 How a team wins lists the points rules first, and the fouls rules under a punishment label',opts.length===2&&/^Points/.test(opts[0])&&/response cost, a punishment step/.test(opts[1]),opts);
  /* the fouls version: labelled, and asks for sign-off */
  await p.evaluate(()=>{S.meta.dir='low';S.meta.g_win='Every team with no more than the criterion number of fouls wins (all teams can win)';S.meta.g_fouls_ok='';renderAll();});await sleep(150);
  a=await state();const chk=await p.evaluate(()=>document.getElementById('designVerdict').textContent.replace(/\s+/g,' '));
  ok('7 chosen on purpose, the fouls version is labelled response cost in the script and the plan',/Fouls are response cost, a punishment step/.test(a.script)&&/response cost, a punishment step \(the BCBA’s sign-off is not recorded yet\)/.test(a.rule),{s:a.script.slice(0,300),r:a.rule.slice(0,400)});
  ok('8 without a sign-off the Design sheet asks for one',/The game counts fouls: that is response cost, a punishment step\. Record the BCBA’s sign-off/.test(chk));
  await p.evaluate(()=>{S.meta.g_fouls_ok='J. E., 11/2: the class already knows the fouls game';renderAll();});await sleep(150);
  a=await state();const chk2=await p.evaluate(()=>document.getElementById('designVerdict').textContent.replace(/\s+/g,' '));
  ok('9 with a sign-off the plan prints it and the request goes',/signed off: J\. E\., 11\/2/.test(a.rule)&&!/The game counts fouls: that is response cost/.test(chk2),a.rule.slice(0,400));
  /* the simulated class */
  await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
  const sim=await p.evaluate(()=>({dir:dir(),ok:S.meta.g_fouls_ok||''}));
  ok('10 the simulated class is a fouls game with the BCBA’s sign-off recorded',sim.dir==='low'&&/BCBA \(simulated\)/.test(sim.ok),sim);
  ok('11 no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
