/* v23.65 (review Wave 4, I244): the staff data kit for next week, in one tap.
   Forms DD-1, SM-1 and QS-1 open with their simulations, then Staff kit for next week:
   1. one print: the packet's cover, then Form DD-1, Form SM-1 and Form QS-1, in that order, titled for next week;
   2. Form DD-1 gives next week's blank sheet alone (Monday to Friday of next week, no value filled but the minutes the
      observation window plans, no week summary);
   3. Form SM-1 gives the student's sheet five times, a school day each on pages of its own, and none of the rest of the
      form (no guide, no references, no record);
   4. the forms on screen are as they were (the same values); the master print still prints SM-1 whole;
   5. Today and the command box offer it. Simulated data only.  usage: node qa/i244-kit-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const md=d=>(d.getMonth()+1)+'/'+d.getDate();
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};}catch(e){}});
  await p.evaluate(async()=>{for(const id of ['DD-1','SM-1','QS-1']){openForm(id);const fr=state.frames[id];const t0=performance.now();while(!state.status[id]&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));
    const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,2000));}}});
  await sleep(1500);
  const sig=async()=>p.evaluate(()=>['DD-1','SM-1','QS-1'].map(id=>{try{return state.frames[id].contentWindow.nbhBridge.valueSig();}catch(e){return 'x';}}).join('|'));
  const s0=await sig();
  const mon=new Date();mon.setHours(12,0,0,0);while(mon.getDay()!==1)mon.setDate(mon.getDate()+1);const fri=new Date(mon);fri.setDate(fri.getDate()+4);
  const pop=p.waitForEvent('popup',{timeout:120000});await p.evaluate(()=>staffKit());const w=await pop;
  await p.waitForFunction(()=>$('#masterPrint').textContent==='Build master print',null,{timeout:180000});await sleep(2500);
  const k=await w.evaluate(()=>{const sec=id=>document.getElementById('sec-'+id);const tx=id=>(sec(id)||{innerText:''}).innerText;
    const dd=sec('DD-1'),sm=sec('SM-1');
    return {secs:[...document.querySelectorAll('section.mp-sec')].map(s=>s.id.replace('sec-','')),title:(document.querySelector('.mp-cover h1')||{}).textContent||'',
      ddText:tx('DD-1').slice(0,3000),ddFilled:dd?[...dd.querySelectorAll('td:not(.col-obs)')].filter(td=>/^\s*\d+(\.\d+)?\s*$/.test(td.textContent)&&!td.closest('thead,th')).length:-1,ddWeek:dd?!!dd.querySelector('.wk-table,.dd-week,[class*="wk-"]'):null,
      smDays:sm?sm.querySelectorAll('.sm-kit-day').length:0,smText:tx('SM-1')};});
  ok('1 one print: the cover, then DD-1, SM-1 and QS-1, titled for next week',k.secs.join()==='DD-1,SM-1,QS-1'&&/Staff Data Kit for the Week of/.test(k.title),{secs:k.secs,title:k.title});
  ok('2 DD-1 gives next week\'s blank sheet alone ('+md(mon)+' to '+md(fri)+'), nothing filled, no week summary',k.ddText.includes(md(mon))&&k.ddText.includes(md(fri))&&k.ddFilled===0&&!/The week in numbers|Week summary/i.test(k.ddText),{filled:k.ddFilled,head:k.ddText.slice(0,400)});
  ok('3 SM-1 gives the student\'s sheet five times and none of the rest of the form',k.smDays===5&&!/Ferster|References|The Record\b|What This Form Builds/.test(k.smText),{smDays:k.smDays,text:k.smText.slice(0,300)});
  await w.emulateMedia({media:'print'});const brk=await w.evaluate(()=>[...document.querySelectorAll('#sec-SM-1 .sm-kit-day')].slice(1).map(e=>getComputedStyle(e).breakBefore));
  ok('3b each school day\'s sheet starts a page of its own',brk.length===4&&brk.every(x=>x==='page'),brk);
  await w.close();
  const s1=await sig();
  ok('4a the forms on screen are as they were',s0===s1,{s0,s1});
  const pop2=p.waitForEvent('popup',{timeout:120000});await p.evaluate(()=>masterRun(ALL.filter(([id])=>id==='SM-1'),{check:false}));const w2=await pop2;
  await p.waitForFunction(()=>$('#masterPrint').textContent==='Build master print',null,{timeout:180000});await sleep(1500);
  const whole=await w2.evaluate(()=>({days:document.querySelectorAll('.sm-kit-day').length,len:document.body.innerText.length}));
  ok('4b the master print still prints SM-1 whole (no kit pages)',whole.days===0&&whole.len>k.smText.length,whole);
  await p.evaluate(()=>todayOpen());await sleep(1200);
  const t=await p.evaluate(()=>({btn:!!document.querySelector('#dlgBody #tdKit'),cmd:CMDS.some(c=>/Staff kit for next week/.test(c.n))}));
  ok('5 Today and the command box offer it',t.btn&&t.cmd,t);
  ok('6 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
