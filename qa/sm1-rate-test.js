/* v21.46 Form SM-1: rating on the iPad (tools/forms/SM-1/sm-rate.js).
   1. The Rate page draws for every sheet type it takes (match, contract, smiley, cico, interval, rubric) and says the
      performance count and the interlocking session stay on paper.
   2. The points follow the paper rules: the Match Points table for a two-level Self & Match style (all four cases, and a
      period the adult did not rate counting as the student rated); the adult's level plus the bonus for a style with more
      levels; the adult's level on cued intervals and the matched rubric; one rater on the contract, expectations and
      check-in/check-out; the totals equal the points possible on the sheet.
   3. Taps: a tap sets the rating, a second tap clears it; the adult's view hides the student's rating until the adult rates
      (unless the Settings show it); reminders count; the goal reached shows the celebration once.
   4. Finish the day writes one Record row (src ipad:date), a second finish updates it; a hand-entered row for the same date is
      replaced only when confirmed; Delete removes the day and its row.
   5. Save data and Open data keep the days; a forged file is cleaned (bad dates, cells, values, a PIN with letters).
   6. The Student screen covers the page, shows the student's part only, and holding the adult's button (and the PIN) opens
      the adult's part; the cue timer selects the next check and flashes; the chime at a period's end opens that period.
   7. The day report prints its table and totals; the simulation has today's first periods rated; no errors.
   usage: node qa/sm1-rate-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+(typeof i==='string'?i:JSON.stringify(i)):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1180,height:820},hasTouch:true});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__ok=true;nbhUI.confirm=async()=>window.__ok;});
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1200);
  /* 7a. the simulation */
  const sim=await page.evaluate(()=>{const k=smRISO(),d=S.days[k];setView('rate');const M=smRModel(d),T=smRTotals(M,d);return {has:!!d,pts:T.pts,poss:T.poss,need:T.need,m:T.m,n:T.n,possSheet:possible().poss,cards:document.querySelectorAll('#smRate .smr-q').length,btn:!!document.querySelector('#viewSeg [data-view="rate"]')};});
  ok('the simulation has today’s first three periods rated (15 of 36, 8 of 9 the same)',sim.has&&sim.pts===15&&sim.poss===36&&sim.possSheet===36&&sim.need===29&&sim.m===8&&sim.n===9&&sim.cards===3&&sim.btn,sim);
  /* 1. every sheet type */
  const sys=await page.evaluate(()=>{const r={};for(const s of ['match','contract','smiley','cico','interval','rubric','perf','interlock']){S.sys=s;S.d.rate='thumbs';renderAll();setView('rate');
    r[s]={q:document.querySelectorAll('#smRate .smr-q').length,o:document.querySelectorAll('#smRate .smr-o').length,empty:(document.querySelector('#smRate .smr-empty')||{}).textContent||''};}S.sys='match';renderAll();return r;});
  ok('the Rate page draws each sheet type it takes',['match','contract','smiley','cico'].every(s=>sys[s].q===3&&sys[s].o===6)&&sys.interval.q===1&&sys.rubric.q===1&&sys.rubric.o===5,sys);
  ok('the performance count and the interlocking session stay on paper',/kept on paper/.test(sys.perf.empty)&&/kept on paper/.test(sys.interlock.empty),{p:sys.perf.empty,i:sys.interlock.empty});
  /* 2. the points */
  const pts=await page.evaluate(()=>{const out={};const day=(me,t)=>Object.assign(smREmpty(),{me,t});
    S.sys='match';S.d.rate='thumbs';S.meta.mp_yy='2';S.meta.mp_nn='1';S.meta.mp_yn='0';S.meta.mp_ny='0';let M=smRModel(day({},{}));
    const v=(a,b)=>smRVal(M,day(a==null?{}:{'0_0':a},b==null?{}:{'0_0':b}),0,0).p;
    out.bin=[v(0,0),v(1,1),v(0,1),v(1,0),v(0,null),v(1,null),v(null,0)];
    S.d.rate='faces3';S.d.mbonus='1';M=smRModel(day({},{}));out.multi=[v(0,0),v(1,0),v(2,2),v(0,null)];out.mpos=smRTotals(M,day({},{})).poss===possible().poss;
    S.sys='interval';S.d.rate='';M=smRModel(day({},{}));out.iv=[v(0,1),v(1,0),v(0,null)];out.ivp=smRTotals(M,day({},{})).poss===possible().poss;
    S.sys='cico';S.d.rate='';M=smRModel(day({},{}));out.cico=[smRVal(M,day({},{'0_0':0}),0,0).p,smRVal(M,day({'0_0':0},{}),0,0).p];out.cicop=smRTotals(M,day({},{})).poss===possible().poss;
    S.sys='contract';M=smRModel(day({},{}));out.con=[v(0,null),v(1,null)];out.conp=smRTotals(M,day({},{})).poss===possible().poss;
    S.sys='rubric';S.chk.rubmatch=true;M=smRModel(day({},{}));out.rub=[v(4,null),v(4,2)].concat(M.lv.map(x=>x[1]));out.rubp=smRTotals(M,day({},{})).poss===possible().poss;S.chk.rubmatch=false;
    S.sys='match';S.d.rate='thumbs';S.d.mbonus='';renderAll();return out;});
  ok('Self & Match, two levels: the Match Points table, an unmatched period as the student rated',JSON.stringify(pts.bin)==='[2,1,0,0,2,1,0]',pts.bin);
  ok('Self & Match, three levels: the adult’s level plus the bonus',JSON.stringify(pts.multi)==='[3,2,1,2]'&&pts.mpos,pts);
  ok('cued intervals: the adult’s level; check-in/check-out: the adult’s rating only; contract: the student’s',JSON.stringify(pts.iv)==='[0,1,1]'&&JSON.stringify(pts.cico)==='[2,0]'&&JSON.stringify(pts.con)==='[1,0]'&&pts.ivp&&pts.cicop&&pts.conp,pts);
  ok('the matched rubric: the adult’s level and its points',pts.rub[1]===pts.rub[2+2]&&pts.rub[0]===pts.rub[2+4]&&pts.rubp,pts.rub);
  /* 3. taps */
  const taps=await page.evaluate(()=>{const k='2030-01-07';SMR.date=k;SMR.sel=0;SMR.mode='me';SMR.modeSet=true;S.d.rshow=false;delete S.days[k];smRRender();
    const r={};const tap=(t,l)=>document.querySelector('#smRate [data-rt="'+t+'"][data-rl="'+l+'"]').click();
    tap(0,0);r.set=S.days[k]&&S.days[k].me['0_0']===0;tap(0,0);r.cleared=!('0_0' in S.days[k].me);tap(0,1);tap(1,0);tap(2,0);r.three=Object.keys(S.days[k].me).length===3;
    r.done=/Show teacher/i.test(document.querySelector('#smRate .smr-done').textContent);
    document.querySelector('#smRate [data-rmode="t"]').click();r.hidden=/has rated\. Rate it yourself/.test(document.querySelector('#smRate .smr-stu').textContent);
    tap(0,1);r.match=/Same answer! \+1/.test(document.querySelector('#smRate .smr-stu').textContent);
    document.querySelector('#smRate [data-rrem="1"]').click();document.querySelector('#smRate [data-rrem="1"]').click();r.rem=S.days[k].rem['0']===2;
    S.d.rshow=true;smRRender();r.shown=/Sam: /.test(document.querySelectorAll('#smRate .smr-stu')[1].textContent);S.d.rshow=false;
    return r;});
  ok('a tap sets the rating and a second tap clears it',taps.set&&taps.cleared&&taps.three,taps);
  ok('the adult does not see the student’s rating until rating, then sees the match',taps.done&&taps.hidden&&taps.match&&taps.shown,taps);
  ok('reminders are counted for the period',taps.rem,taps);
  const party=await page.evaluate(()=>{const k='2030-01-08';SMR.date=k;SMR.mode='me';delete S.days[k];S.meta.goal='50';const d=smRDay(k,true);
    for(let r=0;r<6;r++)for(let t=0;t<3;t++){if(r===1&&t===2)continue;d.me[r+'_'+t]=1;}   /* 17 x 1 point (an honest no each), with no adult rating */
    smRRender();SMR.sel=1;smRRender();const before=!document.getElementById('smRFx')||document.getElementById('smRFx').hidden;
    document.querySelector('#smRate [data-rt="2"][data-rl="1"]').click();const fx=document.getElementById('smRFx');const shown=fx&&!fx.hidden&&/reached your goal/.test(fx.textContent);
    document.getElementById('smRFxOk').click();const closed=fx.hidden;S.meta.goal='80';return {before,shown,closed,pts:smRTotals(smRModel(d),d).pts};});
  ok('reaching the goal shows the celebration',party.before&&party.shown&&party.closed&&party.pts===18,party);
  /* 4. finish the day */
  const fin=await page.evaluate(async()=>{const k='2030-01-07';SMR.date=k;smRRender();const n0=S.log.length;await smRFinish();const n1=S.log.length,row=S.log.find(r=>r.src==='ipad:'+k);
    S.days[k].me['3_0']=0;await smRFinish();const n2=S.log.length,row2=S.log.find(r=>r.src==='ipad:'+k);
    const k2='2030-01-08';S.log.push({date:'1/8',ph:'1',goal:'80',pts:'5',poss:'36',m:'',n:'',met:false,tgp:'',note:'by hand'});const n3=S.log.length;
    window.__ok=true;SMR.date=k2;await smRFinish();const n4=S.log.length,hand=S.log.find(r=>r.date==='1/8');window.__ok=true;
    return {n0,n1,n2,n3,n4,row,row2,hand,fin:!!S.days[k].fin,rec:document.getElementById('lTbl').querySelectorAll('tbody tr').length===S.log.length};});
  ok('Finish the day writes one row to the Record',fin.n1===fin.n0+1&&fin.row&&fin.row.date==='1/7'&&fin.row.poss==='36'&&fin.row.n==='1'&&fin.row.src==='ipad:2030-01-07'&&fin.fin&&fin.rec,fin);
  ok('finishing again updates the row instead of adding one',fin.n2===fin.n1&&+fin.row2.pts>+fin.row.pts,{a:fin.row,b:fin.row2});
  ok('a hand-entered row for the same date is replaced when confirmed',fin.n4===fin.n3&&fin.hand.src==='ipad:2030-01-08'&&fin.hand.pts==='18'&&/Rated on the iPad/.test(fin.hand.note),fin.hand);
  const del=await page.evaluate(async()=>{const k='2030-01-08';const n=S.log.length;smRRender();document.querySelector('#smRate [data-rdel="'+k+'"]').click();await new Promise(r=>setTimeout(r,100));return {gone:!S.days[k],rows:S.log.length===n-1&&!S.log.some(r=>r.src==='ipad:'+k)};});
  ok('Delete removes the day and its Record row',del.gone&&del.rows,del);
  /* 5. save and open */
  const io=await page.evaluate(()=>{S.d.pin='4321';S.d.rspeak=true;const f=JSON.parse(JSON.stringify({form:'SM-1',rev:'2026-10',S}));const o=fromFile(f);
    const g=JSON.parse(JSON.stringify(f));g.S.days={'2030-01-09':{me:{'0_0':1,'0_x':1,'100_0':1,'1_0':-1,'2_0':1.5,'3_0':'2'},t:[],rem:{'0':3,'a':1,'1':'2'},wf:{x:1},note:'n',fin:'yesterday',spent:'5 pts'},'not-a-date':{me:{}},'2030-01-10':'x'};g.S.d.pin='12ab34';g.S.d.rcue='loud';
    const p=fromFile(g);const d=p.days['2030-01-09'];
    return {kept:JSON.stringify(o.days)===JSON.stringify(S.days),pin:o.d.pin,speak:o.d.rspeak,days:Object.keys(p.days),me:d.me,t:d.t,rem:d.rem,wf:d.wf,fin:d.fin,spent:d.spent,pin2:p.d.pin,rcue:'rcue' in p.d,src:o.log.some(r=>/^ipad:/.test(r.src))};});
  ok('Save data and Open data keep the days, the Settings and the Record rows’ source',io.kept&&io.pin==='4321'&&io.speak===true&&io.src,io);
  ok('a forged file is cleaned',JSON.stringify(io.days)==='["2030-01-09"]'&&JSON.stringify(io.me)==='{"0_0":1}'&&JSON.stringify(io.t)==='{}'&&JSON.stringify(io.rem)==='{"0":3}'&&io.wf===''&&io.fin===''&&io.spent==='5'&&io.pin2==='1234'&&!io.rcue,io);
  /* 6. the Student screen */
  await page.evaluate(()=>{S.d.pin='';SMR.date=smRISO();setView('rate');document.getElementById('smRKid').click();});await sleep(300);
  const kid=await page.evaluate(()=>{const w=document.getElementById('smRWrap').getBoundingClientRect();return {cls:document.body.classList.contains('smr-kid'),cover:w.top<=0&&w.left<=0&&w.width>=1170&&w.height>=810,
    acts:!document.getElementById('smRFin'),inert:document.querySelector('.toolbar,#viewSeg').closest('[inert]')!=null,modes:!document.querySelector('#smRate .smr-modes'),hold:!!document.getElementById('smRHold'),grid:!document.querySelector('#smRate .smr-grid'),big:document.querySelector('#smRate .smr-o').getBoundingClientRect().width>=108};});
  ok('the Student screen covers the page with the student’s part only, the page behind it inert',kid.inert&&kid.cls&&kid.cover&&kid.acts&&kid.modes&&kid.hold&&kid.grid&&kid.big,kid);
  const hb=await page.$('#smRHold');let bb=await hb.boundingBox();
  await page.mouse.move(bb.x+10,bb.y+10);await page.mouse.down();await sleep(300);await page.mouse.up();await sleep(900);
  const short=await page.evaluate(()=>SMR.mode);
  await page.mouse.down();await sleep(1250);await page.mouse.up();await sleep(200);
  const held=await page.evaluate(()=>({mode:SMR.mode,grid:!!document.querySelector('#smRate .smr-grid'),back:!!document.querySelector('#smRate [data-rmode="me"]')}));
  ok('a short press does nothing; holding the adult’s button opens the adult’s part',short==='me'&&held.mode==='t'&&held.grid&&held.back,{short,held});
  await page.evaluate(()=>{document.querySelector('#smRate [data-rmode="me"]').click();S.d.pin='2468';smRRender();});
  bb=await (await page.$('#smRHold')).boundingBox();await page.mouse.move(bb.x+10,bb.y+10);await page.mouse.down();await sleep(1250);await page.mouse.up();await sleep(200);
  const pin=await page.evaluate(()=>{const d=document.getElementById('smRPin');const open=d&&d.open;const k=n=>d.querySelector('[data-k="'+n+'"]').click();
    k(1);k(1);k(1);k(1);const wrong=SMR.mode==='me';return {open,wrong};});
  await sleep(600);
  const pin2=await page.evaluate(()=>{const d=document.getElementById('smRPin');const k=n=>d.querySelector('[data-k="'+n+'"]').click();k(2);k(4);k(6);k(8);return {mode:SMR.mode,closed:!d.open};});
  ok('the PIN is asked for, a wrong one refused, the right one opens the adult’s part',pin.open&&pin.wrong&&pin2.mode==='t'&&pin2.closed,{pin,pin2});
  const off=await page.evaluate(()=>{document.getElementById('smRKidOff').click();S.d.pin='';return {cls:document.body.classList.contains('smr-kid'),view:document.body.classList.contains('view-rate'),inert:document.querySelectorAll('[inert]').length};});
  ok('Leave the student screen returns to the Rate page',!off.cls&&off.view&&off.inert===0,off);
  /* the cue timer and the chime */
  const cue=await page.evaluate(async()=>{S.sys='interval';renderAll();const k='2030-01-11';SMR.date=k;SMR.sel=-1;delete S.days[k];setView('rate');document.getElementById('smRCueOn').click();
    const a=!!document.getElementById('smRCount');const d=smRDay(k,true);d.me['0_0']=0;d.me['1_0']=0;SMR.cueAt=Date.now()-10;smRTick();
    const sel=SMR.sel,flash=document.getElementById('smRCard').classList.contains('smr-flash'),next=SMR.cueAt>Date.now();document.getElementById('smRCueOff').click();
    return {a,sel,flash,next,off:!SMR.cue};});
  ok('the cue timer counts down, then selects the next check and flashes',cue.a&&cue.sel===2&&cue.flash&&cue.next&&cue.off,cue);
  const chime=await page.evaluate(()=>{S.sys='match';S.d.rchime=true;renderAll();const now=new Date(),hm=x=>String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0');
    const back=new Date(now.getTime()-60*60000);const save=S.per.map(p=>p.t);S.per.forEach((p,i)=>{p.t=i===0?hm(back):'23:59';});
    const k=smRISO();SMR.date=k;delete S.days[k];setView('rate');SMR.begun=-2;smRTick();const b0=SMR.begun;
    S.per[1].t=hm(now);SMR.sel=4;smRTick();const r={b0,sel:SMR.sel,begun:SMR.begun};S.per.forEach((p,i)=>{p.t=save[i];});S.d.rchime=false;smRSim();renderAll();return r;});
  ok('the chime at a period’s end opens the period that ended',chime.b0===0&&chime.sel===0&&chime.begun===1,chime);
  /* 7b. the day report */
  const rep=await page.evaluate(()=>{const h=smRPage(smRISO());const x=document.createElement('div');x.innerHTML=h;return {rows:x.querySelectorAll('.smr-ptab tbody tr').length,glyphs:x.querySelectorAll('.smr-ptab svg').length,tot:/15 of 36/.test(x.textContent),same:/8 of 9/.test(x.textContent),wf:/Feed the class fish/.test(x.textContent),sig:!!x.querySelector('.smr-sig')};});
  ok('the day report prints the periods, the ratings and the totals',rep.rows===6&&rep.glyphs===18&&rep.tot&&rep.same&&rep.wf&&rep.sig,rep);
  /* the narrow screen (iPhone or a split iPad): nothing wider than the page */
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{setView('rate');});await sleep(300);
  const narrow=await page.evaluate(()=>{const w=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('#smRate .smr-card *, #smRate .smr-goal *')].filter(e=>e.getBoundingClientRect().right>w+1).map(e=>e.className||e.tagName).slice(0,5);return bad;});
  ok('a narrow screen keeps the card inside the page',narrow.length===0,narrow);
  ok('no errors',errs.length===0,errs);
  console.log(fails?fails+' FAILED':'ALL PASS');await br.close();process.exit(fails?1:0);})();
