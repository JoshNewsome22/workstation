/* v22.63 Form SM-1's variable cue from a list (Bancroft & Bourret, 2008): the session's lengths run from about a third of the
   average to about twice it, and average the interval length exactly; the Setup sheet shows the adult the
   cue times from the start; the order is fixed for the day and changes on New order; the iPad's cue timer follows the same
   list; a fixed cue shows no list. Simulated data only.
   usage: node qa/v2263-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await p.evaluate(()=>{const r=document.querySelector('#sysOpt input[name="sys"][value="interval"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const set=async(k,v)=>{await p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);await sleep(200);};
  await set('iv_len','3');await set('iv_n','10');await set('iv_timing','Variable: the length varies around the average, so the cue cannot be predicted');
  const read=()=>p.evaluate(()=>{const b=document.getElementById('ivCueList');const t=b?b.textContent.replace(/\s+/g,' '):'';const sec=x=>{const m=/^(\d+):(\d\d)$/.exec(x.trim());return m?+m[1]*60+ +m[2]:NaN;};
    const at=(/from the start of the session[^:]*: ([^L]*?)Lengths/.exec(t)||[])[1]||'',ln=(/Lengths: ([\d:, ]+)/.exec(t)||[])[1]||'';
    return {t,at:at.split(',').map(sec).filter(x=>!isNaN(x)),len:ln.split(',').map(sec).filter(x=>!isNaN(x))};});
  let a=await read();const sum=a.len.reduce((x,y)=>x+y,0);
  const srt0=a.len.slice().sort((u,v)=>u-v),med=(srt0[4]+srt0[5])/2;
  ok('1 a variable cue shows today\'s cue times for the adult: ten lengths from 1:00 to 6:00, averaging 3:00 exactly, the median below the average',a.len.length===10&&sum===1800&&Math.min(...a.len)>=60&&Math.max(...a.len)<=360&&med<180&&/keep them out of the student/.test(a.t)&&/averaging 3:00 exactly/.test(a.t),a);
  ok('2 the times from the start add up the lengths, the last at 30:00',a.at.length===10&&a.at.every((x,i)=>x===a.len.slice(0,i+1).reduce((u,v)=>u+v,0))&&a.at[9]===1800,a);
  await set('iv_q','Was I working?');const b=await read();
  ok('3 the order holds for the day (the list does not change when another field does)',b.len.join()===a.len.join(),{a:a.len,b:b.len});
  await p.evaluate(()=>document.getElementById('ivCueNew').click());await sleep(250);const c=await read();const seed=await p.evaluate(()=>S.meta.iv_seed);
  const srt=x=>x.slice().sort((u,v)=>u-v).join();
  ok('4 New order: the same lengths in another order, kept with the case (iv_seed)',c.len.join()!==a.len.join()&&srt(c.len)===srt(a.len)&&seed==='1',{a:a.len,c:c.len,seed});
  const q=await p.evaluate(()=>{SMR.cueQ=null;const o=[];for(let i=0;i<11;i++)o.push(Math.round(smRCueNext()/1000));return o;});
  ok('5 the iPad\'s cue timer follows the same list, then starts it again',q.slice(0,10).join()===c.len.join()&&q[10]===c.len[0],{q,c:c.len});
  const hint=await p.evaluate(()=>{const e=document.getElementById('ivCueList');return e&&e.previousElementSibling?e.previousElementSibling.textContent.replace(/\s+/g,' '):'';});
  ok('6 the hint says how the lengths are made, with the source',/about a third of the average to about twice it/.test(hint)&&/Bancroft & Bourret, 2008/.test(hint)&&/from 1 to 6/.test(hint),hint.slice(-400));
  await set('iv_timing','Fixed: every interval the same length');const f=await read();const fx=await p.evaluate(()=>{SMR.cueQ=null;return smRCueNext();});
  ok('7 a fixed cue shows no list, and the timer gives the interval length',f.t===''&&fx===180000,{t:f.t,fx});
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('8 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
