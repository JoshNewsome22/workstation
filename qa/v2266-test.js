/* v22.66 corrections from the reinforcer-assessment articles: Form TD-1's magnitude parameter credits Steinhilber and
   Johnson (2007) for matching the assessment format to treatment access and Trosclair-Lasserre et al. (2008) for a larger
   magnitude mattering as the requirement rises; Form SR-1's concurrent-schedules entry says that interval schedules
   produce matching and ratio schedules maximizing, with Fisher et al. (1992) in its references.
   usage: node qa/v2266-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);return p;};
  let p=await open('TD-1_Function-Based-Treatment-Developer_v2026-09.html');
  const mag=await p.evaluate(()=>{const i=document.querySelector('input[name="rp.mag"]');return i?i.closest('label').textContent.replace(/\s+/g,' ').trim():'';});
  ok('1 TD-1 magnitude: the format matched to treatment access is Steinhilber and Johnson (2007); the rising requirement and thinning are Trosclair-Lasserre et al. (2008)',
    /matched treatment access \(Steinhilber & Johnson, 2007\); a larger magnitude may make a difference only as the requirement rises, so raise it as the schedule is thinned \(Trosclair-Lasserre et al\., 2008\)$/.test(mag),mag);
  ok('2 both are in TD-1\'s references',await p.evaluate(()=>{const t=document.body.textContent;return /Steinhilber, J\., & Johnson, C\. \(2007\)/.test(t)&&/Trosclair-Lasserre, N\. M\./.test(t);}));
  await p.close();
  p=await open('SR-1_Schedules-of-Reinforcement_v2026-10.html');
  const t=await p.evaluate(()=>{const d=document.querySelector('#catOut details[data-id="conc"]');return d?d.textContent.replace(/\s+/g,' '):'';});
  ok('3 SR-1 concurrent schedules: matching on interval schedules, maximizing on ratio schedules, and what each arrangement shows (Fisher et al., 1992)',
    /On concurrent interval schedules, choice proportional to relative reinforcement \(matching\); on concurrent ratio schedules, nearly all responding goes to the richer side \(maximizing\)\. So a concurrent VI arrangement shows how much one stimulus is preferred over another, and a concurrent ratio arrangement shows quickly which is preferred most \(Fisher et al\., 1992\)\./.test(t),t.slice(0,300));
  ok('4 Fisher et al. (1992) in the entry\'s references',/Fisher, W\., Piazza, C\. C\., Bowman, L\. G\., Hagopian, L\. P\., Owens, J\. C\., & Slevin, I\. \(1992\)/.test(t));
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('5 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
