/* Form TD-1, review Wave 3 part 2: the specialist planners print only when used (F187); the staff-training table from Form ST-1's
   record (I95). Simulated data only. usage: node qa/td1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('TD-1_'));
  const disp=async()=>{await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const d=await p.evaluate(()=>['#hpPlanWrap','#ecsPlanWrap'].map(q=>getComputedStyle(document.querySelector(q)).display));await p.emulateMedia({media:'screen'});return d;};
  const d0=await disp(),s0=await p.evaluate(()=>['#hpPlanWrap','#ecsPlanWrap'].map(q=>getComputedStyle(document.querySelector(q)).display));
  ok('1 F187 a blank plan prints neither planner; both stay on screen',d0.join()==='none,none'&&s0.every(x=>x!=='none'),{d0,s0});
  const sim=async k=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(1300);};
  await sim('escape_fct');const d1=await disp();
  await sim('auto_rrb');const d2=await disp();
  ok('2 F187 the high-p planner prints with the high-p card in the plan, the arranging/ordering planner with its package',d1[0]!=='none'&&d1[1]==='none'&&d2[1]!=='none',{d1,d2});
  const q=await open(file('TD-1_'));
  const d3=await q.evaluate(()=>{const e=document.querySelector('#ecsPlanWrap input,#ecsPlanWrap textarea');e.value='Simulated entry';e.dispatchEvent(new Event('input',{bubbles:true}));return document.getElementById('ecsPlanWrap').dataset.empty;});
  ok('3 F187 a planner with an entry prints',d3==='0',d3);
  /* ---- I95 ---- */
  const t=await q.evaluate(()=>{const g=n=>document.querySelector('[name="'+n+'"]').value;const e=document.querySelector('[name="tr[0].who"]');e.value='Paula Brennan (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));
    window.__nbhFactsIn({staff:{people:[{name:'Dana Whitfield (simulated)',role:'Classroom teacher',criterion:'90% across 2 consecutive rounds',met:true,date:'2026-10-02'},
      {name:'Paula Brennan (simulated)',role:'Paraprofessional',met:false}],all:false}});
    return [0,1,2].map(i=>['who','i','m','r','f','c','n'].map(k=>g('tr['+i+'].'+k)).join('|'));});
  ok('4 I95 a trainee trained to criterion on Form ST-1 fills an empty row with the four parts ticked and the date',t[1]==='Dana Whitfield (simulated), Classroom teacher|✓|✓|✓|✓|10/2/2026|Trained to criterion on Form ST-1: 90% across 2 consecutive rounds',t);
  ok('5 I95 a trainee already on a row is matched there, and one still training is marked so; nothing typed is overwritten',
    t[0]==='Paula Brennan (simulated)||||||Training in progress on Form ST-1; not to implement alone until the criterion is met'&&t[2]==='||||||',t);
  ok('6 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
