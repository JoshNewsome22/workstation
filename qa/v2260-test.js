/* v22.60 Form SR-1's variable and random schedules, from Bancroft and Bourret (2008): variable time as a kind; up to 60
   values; the random method prints its list with its actual mean and longest value; Lists for sessions gives each session
   an order (or draws) of its own; with a session length a time schedule prints the times from the start; the two-timer
   rule for an interval schedule; the random caution completed; NCR on a variable time prints its intervals.
   usage: node qa/v2260-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/SR-1_Schedules-of-Reinforcement_v2026-10.html');await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const set=async(k,v)=>{await p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);await sleep(150);};
  const out=()=>p.evaluate(()=>{const o=document.getElementById('dsOut');return {t:o.textContent.replace(/\s+/g,' '),series:[...o.querySelectorAll('.series')].map(s=>s.textContent.split(/,\s*/).filter(Boolean))};});
  await set('ds_sel','vi');await set('vi_mean','30');
  const kinds=await p.evaluate(()=>[...document.querySelector('[data-m="vi_kind"]').options].map(o=>o.value).join());
  await set('vi_method','fh');await set('vi_n','52');let o=await out();
  ok('1 the kinds are VI, VR and VT; a Fleshler–Hoffman series of 52 values (up to 60 now)',kinds==='vi,vr,vt'&&o.series[0]&&o.series[0].length===52,{kinds,n:o.series[0]&&o.series[0].length});
  /* the random method prints its list */
  await set('vi_n','20');await set('vi_method','rand');o=await out();
  const list=(o.series[0]||[]).map(Number),mean=list.reduce((a,b)=>a+b,0)/(list.length||1);
  ok('2 random interval: the list drawn at each second (probability 0.033), 20 values, with their own mean and the longest',/RI 30 s/.test(o.t)&&/List \(drawn at each second, probability 0\.033\)/.test(o.t)&&list.length===20&&list.every(v=>v>=1)&&o.t.indexOf('Mean of the list'+(Math.round(mean*10)/10).toFixed(1)+' s')>=0&&new RegExp('/ '+Math.max(...list)+' s').test(o.t),{t:o.t.slice(0,600),mean});
  ok('3 the random caution: values cannot be controlled, a capped schedule is no longer constant-probability at the cap',/you cannot control the values \(Bancroft & Bourret, 2008\)/.test(o.t)&&/no longer constant-probability at the cap/.test(o.t),o.t.slice(0,900));
  ok('4 an interval schedule: run two timers, the schedule timer stopping until the reinforcer is collected',/Run two timers: the schedule timer stops when a reinforcer is set up/.test(o.t)&&/a second timer keeps the session length/.test(o.t),o.t.slice(0,900));
  /* lists for sessions */
  await set('vi_method','fh');await set('vi_n','10');await set('vi_lists','3');o=await out();
  const s3=o.series.slice(0,3),sorted=s=>s.slice().map(Number).sort((a,b)=>a-b).join();
  ok('5 Lists for sessions 3: three lists, the same values in a different order each (exact mean each pass), and the rule says one a session',s3.length===3&&sorted(s3[0])===sorted(s3[1])&&sorted(s3[1])===sorted(s3[2])&&s3[0].join()!==s3[1].join()&&/session 2/.test(o.t)&&/Use the list for session 1 in session 1/.test(o.t),{s3,t:o.t.slice(0,300)});
  /* variable time with a session length */
  await set('vi_lists','1');await set('vi_kind','vt');await set('vi_sess','10');o=await out();
  const times=(o.series[1]||[]),secs=times.map(t=>{const m=/^(\d+):(\d\d)$/.exec(t.trim());return m?+m[1]*60+ +m[2]:NaN;});
  ok('6 variable time with a 10-minute session: the times from the start, rising, the last at or before 10:00; one timer is enough',/VT 30 s/.test(o.t)&&/Times from the start of a 10-minute session/.test(o.t)&&secs.length>5&&secs.every((v,i)=>!isNaN(v)&&(i===0||v>secs[i-1]))&&secs[secs.length-1]<=600&&/One timer is enough/.test(o.t),{times:times.slice(0,8),last:times[times.length-1],t:o.t.slice(0,300)});
  ok('7 the notes: SR-1\'s series are exact each pass, a drawn list is not; a random ratio can fade from FR 1',/shuffled without replacement, so each pass has exactly the stated mean/.test(o.t)&&/fade a schedule from FR 1 toward a leaner VR/.test(o.t),o.t.slice(-600));
  /* NCR on a variable time */
  await set('ds_sel','ncr');await set('ncr_n','40');await set('ncr_min','60');await set('ncr_kind','vt');o=await out();
  ok('8 NCR on a variable time prints its intervals at the starting interval and says how to take the next one',/Intervals at the starting interval \(Fleshler–Hoffman, shuffled\)/.test(o.t)&&(o.series[0]||[]).length===10&&/Set the timer to the next interval on the list/.test(o.t),{t:o.t.slice(0,700)});
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('9 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
