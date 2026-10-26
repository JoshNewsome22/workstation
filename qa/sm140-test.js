/* v24.40 one simulated student, part: Form SM-1's worked example in counts (every Behavior % a share of 18 ratings, every
   per-target Yes share a share of 6, every per-target points share a share of 12); Form EA-1's worked example with a complete
   Decision (function key, notes, the blind second reading; the undifferentiated steps ticked in that scenario) and its sessions on
   school days, the analysis before the evaluation; Form TD-1's escape example at EA-1's baseline rate (2.4 a minute), the rate's
   source named, the baseline sessions before the treatment sessions, the crisis procedure and the safety cards filled.
   usage: node qa/sm140-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const F={'SM-1':'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','EA-1':'EA-1_Experimental-Analysis-Protocol_v2026-09.html','TD-1':'TD-1_Function-Based-Treatment-Developer_v2026-09.html'};
const share=(v,d)=>v!=null&&Math.abs(v*d/100-Math.round(v*d/100))<0.011;   /* a multiple of 100/d within 0.06 */
const wk=s=>{const d=new Date(s);return !isNaN(d)&&d.getDay()%6!==0;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 async function open(id,scenario){const ctx=await b.newContext({viewport:{width:1300,height:950}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+String(e).slice(0,100)));await p.goto(BASE+'/NBH-Workstation/'+F[id]);await sleep(1500);
   await p.evaluate(sc=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});nbhUI.alert=async()=>{};window.alert=()=>{};const s=document.getElementById('simScenario');if(sc&&s){s.value=sc;s.dispatchEvent(new Event('change',{bubbles:true}));}document.getElementById('simBtn').click();},scenario||'');await sleep(3200);return {ctx,p};}
 /* ---- SM-1 ---- */
 {const {ctx,p}=await open('SM-1');
  const r=await p.evaluate(()=>rows().map(x=>({ph:x.ph,b:x.b,bp:x.bp,tp:x.tp,p:x.p,q:x.q,m:x.m,n:x.n,g:x.g,mt:x.mt})));
  const rated=r.filter(x=>x.ph!=='0'),base=r.filter(x=>x.ph==='0');
  ok('SM-1: the worked example holds 4 teacher-only days and 17 rated days, every Behavior % a share of 18 ratings',base.length===4&&rated.length===17&&r.every(x=>share(x.b,18)),{base:base.length,rated:rated.length,bad:r.filter(x=>!share(x.b,18)).map(x=>x.b).slice(0,5)});
  ok('every per-target Yes share is a share of 6 and the three sum to the day\'s Behavior %',r.every(x=>x.bp.length===3&&x.bp.every(v=>share(v,6))&&Math.abs(x.bp.reduce((a,v)=>a+v/100*6,0)/18*100-x.b)<0.1),{sample:r.slice(0,3).map(x=>[x.b,x.bp])});
  ok('every rated day\'s per-target points share is a share of 12 and the three add up to the day\'s points of 36',rated.every(x=>x.q===36&&x.tp.length===3&&x.tp.every(v=>share(v,12))&&Math.round(x.tp.reduce((a,v)=>a+v/100*12,0))===x.p),{sample:rated.slice(0,3).map(x=>[x.p,x.tp])});
  ok('matches are of 18 ratings and the goal-met reading follows the points (4 of the 5 days at goal 75 met it)',rated.every(x=>x.n===18&&x.m<=18)&&rated.filter(x=>x.g===75).length===5&&rated.filter(x=>x.g===75&&x.mt).length===4,{g75:rated.filter(x=>x.g===75).map(x=>[x.p,x.mt])});
  await ctx.close();}
 /* ---- EA-1 ---- */
 for(const sc of ['escape','undiff']){const {ctx,p}=await open('EA-1',sc);
  const d=await p.evaluate(()=>{const chk=k=>!!document.querySelector('[name="'+k+'"]:checked');const v=k=>{const e=document.querySelector('[name="'+k+'"]');return e?e.value:null;};
    const s=[],tx=[];for(let i=0;i<80;i++){const e=document.querySelector('[name="s['+i+'].d"]');if(e&&e.value)s.push(e.value);const t=document.querySelector('[name="tx['+i+'].d"]');if(t&&t.value)tx.push(t.value);}
    return {fn:chk('d.fn'),cont:chk('d.cont'),stop:chk('d.stop'),alone:chk('d.alone'),pair:chk('d.pair'),eo:chk('d.eo'),func:v('d.func'),fnkey:v('d.fnkey'),note:v('d.note'),txi:v('d.tx'),who:v('d2.who'),d2date:v('d2.date'),read:v('d2.read'),agree:v('d2.agree'),outcome:v('d2.outcome'),s,tx,start:v('t.start')};});
  const sd=d.s.map(x=>new Date(x)),td=d.tx.map(x=>new Date(x));
  ok('EA-1 ('+sc+'): the Decision is complete: Function identified ticked, the function statement, the key for the report, the notes, the treatment implication'+(sc==='undiff'?', the alone screen, the pairwise test and the EO steps ticked':''),
    d.fn&&!d.cont&&!d.stop&&d.func&&d.func.length>40&&(sc==='undiff'?d.fnkey==='attention'&&d.alone&&d.pair&&d.eo:d.fnkey==='escape'&&!d.alone)&&d.note&&d.note.length>40&&d.txi&&d.txi.length>20,{fn:d.fn,fnkey:d.fnkey,note:(d.note||'').slice(0,50),alone:d.alone,pair:d.pair});
  ok('EA-1 ('+sc+'): the blind second reading is on record: who, when, what was read, agreement',d.who&&d.d2date&&d.read&&d.agree==='agree'&&d.outcome,{who:d.who,read:d.read,outcome:d.outcome});
  ok('EA-1 ('+sc+'): every analysis and evaluation session is dated on a weekday; the analysis ends before the evaluation begins, which ends today; the evaluation start is its first date',
    d.s.length>=8&&d.tx.length>=6&&d.s.every(wk)&&d.tx.every(wk)&&Math.max(...sd)<Math.min(...td)&&Math.abs(Math.max(...td)-new Date().setHours(12,0,0,0))<4*86400e3&&d.start===d.tx[0],{s:[d.s[0],d.s[d.s.length-1]],tx:[d.tx[0],d.tx[d.tx.length-1]],start:d.start});
  await ctx.close();}
 /* ---- TD-1 ---- */
 {const {ctx,p}=await open('TD-1','escape_fct');
  const d=await p.evaluate(()=>{const v=k=>{const e=document.querySelector('[name="'+k+'"]');return e?e.value:null;};const mo=[];for(let i=0;i<80;i++){const ph=v('mo['+i+'].p'),dt=v('mo['+i+'].d');if(ph&&dt)mo.push([ph,dt,v('mo['+i+'].t')]);}
    const card=code=>{const c=document.querySelector('#compWrap .card[data-code="'+code+'"]');if(!c)return null;const i=c.dataset.i;return [0,1,2].map(k=>v('cp['+i+'].p'+k));};
    return {rate:v('m.rate'),src:v('m.ratesrc'),note:(document.getElementById('tdRateSrc')||{}).textContent,crit:v('mon.crit'),crisis:v('rb.crisis'),inj:v('rb.2'),mo,pb:card('R_PB'),safe:card('SAFE')};});
  const bl=d.mo.filter(x=>x[0]==='BL'),tx=d.mo.filter(x=>x[0]!=='BL');const firstTx=Math.min(...tx.map(x=>new Date(x[1])));const bl1=d.mo.slice(0,5);
  const blMean=bl1.reduce((a,x)=>a+(+x[2]),0)/bl1.length;
  ok('TD-1 (escape): the baseline is EA-1\'s demand-condition rate, 2.4 a minute, its source named on Setup, the 90% benchmark 0.24, the first five baseline sessions averaging near it',
    d.rate==='2.4'&&d.src==='EA-1'&&/Form EA-1/.test(d.note||'')&&d.crit==='0.24'&&bl1.every(x=>x[0]==='BL')&&Math.abs(blMean-2.4)<0.5,{rate:d.rate,src:d.src,note:d.note,crit:d.crit,blMean:+blMean.toFixed(2)});
  ok('the baseline sessions are dated on weekdays before the first treatment session; every monitoring date is a weekday',d.mo.length>20&&d.mo.every(x=>wk(x[1]))&&bl1.every(x=>new Date(x[1])<firstTx),{n:d.mo.length,first:d.mo[0],firstTx:new Date(firstTx).toLocaleDateString()});
  ok('the crisis procedure is written and the consequence and protective-procedure cards carry their trigger, blocking rule, equipment and nursing review',
    d.crisis&&/Trigger/.test(d.crisis)&&d.inj==='yes'&&d.pb&&d.pb[1]&&d.pb[2]&&d.safe&&d.safe[0]&&d.safe[1]&&d.safe[2],{crisis:(d.crisis||'').slice(0,40),pb:d.pb,safe:d.safe});
  await ctx.close();
  const a=await open('TD-1','attention_ncr');const ar=await a.p.evaluate(()=>document.querySelector('[name="m.rate"]').value);await a.ctx.close();
  ok('TD-1 (attention): the baseline is EA-1\'s attention-condition rate, 10 a minute',ar==='10',{ar});}
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
