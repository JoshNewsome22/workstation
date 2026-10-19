/* Form VS-1, review Wave 3: PA-1's reinforcers with their own pictures and words, once, and a cleared word stays cleared (F288); the
   device's My pictures only when the BCBA says so, DM-1's permission, Remove off the device (F289); the plan's own break and help card
   (F290); the countdown's requirement (F291); the visuals to the case (F292); the Guide's lines, the rule cards and the sizes (F293-F296).
   Simulated data only. usage: node qa/vs1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('VS-1_'));await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__asked=[];window.__ans=true;nbhUI.confirm=async(t)=>{window.__asked.push(t);return window.__ans;};nbhUI.toast=()=>{};});
  const strips=()=>p.evaluate(()=>{renderAll();return document.getElementById('stripsOut').textContent.replace(/\s+/g,' ');});
  /* ---- F288 ---- */
  const a=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({menu:[{name:'Goldfish crackers',tier:'HP',rank:1},{name:'Bubbles',tier:'HP',rank:2},{name:'Music',tier:'MP',rank:3},{name:'Picture book',tier:'LP',rank:4},{name:'Squeeze ball'}]});
    return {r,ch:S.choice.slice(0,4).map(o=>({k:o.k,l:o.l})),then:{k:S.ft[1].k,l:S.ft[1].l},rw:{k:S.tk[1].k,l:S.tk[1].l},need:document.getElementById('vsNeed').textContent,bub:window.__vsMatch('Bubbles'),mus:window.__vsMatch('Music')};});
  ok('1 F288 the menu goes on with matching pictures and words together; a name with no picture clears the starting one and is named; no low or unranked item',
    a.ch[0].l==='Goldfish crackers'&&a.ch[1].l==='Bubbles'&&a.ch[1].k===a.bub&&!!a.bub&&a.ch[2].l==='Music'&&a.ch[2].k===a.mus&&a.ch[3].k===''&&a.ch[3].l===''&&
    !JSON.stringify(a).includes('Picture book')&&!JSON.stringify(a).includes('Squeeze ball')&&a.then.l==='Goldfish crackers'&&a.rw.l==='Goldfish crackers'&&a.then.k!=='ipad'&&a.rw.k!=='ipad'&&
    (a.ch[0].k?true:/No library picture matched Goldfish crackers/.test(a.need)),a);
  const b=await p.evaluate(()=>{S.choice[1].l='';renderAll();window.__nbhFactsIn({menu:[{name:'Goldfish crackers',tier:'HP'},{name:'Bubbles',tier:'HP'}]});const again=S.choice[1].l;
    let done=false;openPick(S.choice,0,()=>{done=true;});const o=S.choice[0];o.k='ball';o.ph='';PICK.done();document.getElementById('pickDlg').close();return {again,l0:S.choice[0].l,k0:S.choice[0].k,done};});
  ok('2 F288 the case fills once: a word the BCBA cleared is not written back, and a picture chosen later takes the case\'s word away',b.again===''&&b.l0===''&&b.k0==='ball'&&b.done,b);
  const c=await p.evaluate(()=>{S=blank();S.chk.s_ft=true;renderAll();setView('strips');const w=[...document.querySelectorAll('input.vs-word')].map(e=>({v:e.value,ph:e.placeholder}));return {w,txt:document.getElementById('stripsOut').textContent.replace(/\s+/g,' ')};});
  ok('3 F288 the First, Then and Working-for cards have their own word fields; the first-then board prints the pictures\' words, not First and Then again',c.w.length===3&&c.w.every(x=>x.v===''&&x.ph)&&!/First First|Then Then/.test(c.txt),c);
  /* ---- F290 ---- */
  const d0=await p.evaluate(()=>{S=blank();S.chk.s_break=true;renderAll();return {on:S.brk.filter(o=>o.on).map(o=>o.l),txt:document.getElementById('stripsOut').textContent.replace(/\s+/g,' ')};});
  const d1=await p.evaluate(()=>{window.__nbhFactsIn({plan:{rep:'Asks for help by handing the help card',reinf:'Help with the next step'}});return {on:S.brk.filter(o=>o.on).map(o=>o.l),txt:document.getElementById('stripsOut').textContent.replace(/\s+/g,' ')};});
  const d2=await p.evaluate(()=>{S={meta:{},chk:{s_break:true},photos:[],board:[],cards:[],rules:[],ft:[cello(),cello()],sched:[],choice:[],tk:[cello(),cello()],fs:[]};ensure();const n=S.brk.filter(o=>o.on).length;S=blank();renderAll();return n;});
  ok('4 F290 the break card alone to start; the plan\'s request ticked from the case with what the adults do at the foot of the sheet; an older file keeps its four cards',
    d0.on.join('|')==='Break, please'&&/Break, please/.test(d0.txt)&&!/Help, please|All done|More, please/.test(d0.txt)&&d1.on.join('|')==='Help, please'&&/For the adults: Help, please: Honor it at once, every time, while the card is new: Help with the next step\./.test(d1.txt)&&!/Break, please/.test(d1.txt)&&d2===4,{d0,d1,d2});
  /* ---- F291 ---- */
  const e1=await p.evaluate(()=>{S=blank();S.chk.s_wait=true;renderAll();const t=document.getElementById('stripsOut').textContent;const s=document.querySelector('[data-m="w_each"]');s.value='time';s.dispatchEvent(new Event('change',{bubbles:true}));
    return {t,t2:document.getElementById('stripsOut').textContent,note:!document.getElementById('wEachNote').hidden};});
  ok('5 F291 the countdown says what takes a square away; time alone brings the note from the delay research',/Take one away each time you finish one, or wait with calm hands; at zero it is your turn\./.test(e1.t)&&/Take one away each minute; at zero it is your turn\./.test(e1.t2)&&e1.note,e1);
  /* ---- F289 ---- */
  const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const f1=await p.evaluate(async png=>{await NBHPIC.ready();window.__asked=[];window.__ans=false;S=blank();S.photos=[{id:'p1',img:png,label:'Red toy (simulated)',lib:'simlibA'}];renderAll();await new Promise(r=>setTimeout(r,900));
    const no={asked:window.__asked.slice(),has:!!NBHPIC.get('simlibA')};window.__asked=[];window.__ans=true;S.photos.push({id:'p2',img:png,label:'Blue cup (simulated)',lib:'simlibB'});renderAll();await new Promise(r=>setTimeout(r,1500));
    const yes={asked:window.__asked.slice(),has:!!NBHPIC.get('simlibB'),againA:window.__asked.some(t=>/simlibA/.test(t))};
    window.__ans=true;setView('library');renderAll();const btn=[...document.querySelectorAll('button[data-phdel]')].find(x=>x.dataset.phdel==='p2');btn.click();await new Promise(r=>setTimeout(r,900));
    return {no,yes,gone:!NBHPIC.get('simlibB')};},PNG);
  ok('6 F289 a file\'s pictures from another device join My pictures only when the BCBA says yes; each is asked about once; Remove can take one off the device',
    f1.no.asked.length===1&&/This file carries a picture from another device’s My pictures\./.test(f1.no.asked[0])&&!f1.no.has&&f1.yes.asked.length===1&&f1.yes.has&&f1.gone,f1);
  const f2=await p.evaluate(async()=>{nbhCase.facts={profile:{flags:{photo:'No'}}};renderAll();const note=document.getElementById('vsPerm').textContent;let clicked=0;const fi=document.getElementById('photoIn');const was=fi.click;fi.click=()=>{clicked++;};
    window.__ans=false;window.__asked=[];document.getElementById('phAdd').click();await new Promise(r=>setTimeout(r,200));const a=window.__asked.slice();fi.click=was;nbhCase.facts=null;renderAll();return {note,clicked,a};});
  ok('7 F289 with no photo permission on DM-1, the Pictures page says so and Upload a photo asks first',/^Form DM-1: no photo or media permission\./.test(f2.note)&&f2.clicked===0&&f2.a.length===1&&/records no photo or media permission/.test(f2.a[0]),f2);
  /* ---- F292 ---- */
  await p.evaluate(()=>{window.__ans=true;});await p.evaluate(()=>loadSim());await sleep(600);
  const g=await p.evaluate(()=>{S.meta.date='10/19/2026';S.meta.bcba='Jordan Ellis (simulated)';return window.__nbhFactsOut();});
  const ix=fs.readFileSync(dir+'index.html','utf8');
  ok('8 F292 the visuals go to the case with the date and the BCBA, the break card with what the adults do; the workstation counts them',g&&g.visuals&&g.visuals.items.some(v=>v.what==='Break and help cards'&&v.words==='Break, please')&&g.visuals.items.some(v=>v.what==='Token board')&&g.visuals.date==='10/19/2026'&&g.visuals.by==='Jordan Ellis (simulated)'&&
    /FACT_SRC\['VS-1'\]='visuals';FACT_GEN\.push\('VS-1'\);/.test(ix)&&/<b>Visuals:<\/b>/.test(ix)&&!!(await p.$('[data-m="date"]'))&&!!(await p.$('[data-m="bcba"]')),g);
  const sim=await strips();
  ok('9 F290 the simulation prints the break card alone, as Forms QS-1, TI-1 and ST-1 expect',/Break, please/.test(sim)&&!/Help, please|More, please/.test(sim),sim.slice(0,300));
  /* ---- F293-F296 ---- */
  const page=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('10 F293 the Guide gives the meta-analysis\'s answer on speech',/Flippin, Reszka and Watson \(2010\) judged PECS promising but not yet established, with small to moderate gains in communication and small to negative gains in speech/.test(page)&&/gains in speech small to negative/.test(page)&&!/note that speech gains are variable/.test(page),'text');
  ok('11 F294 F291 the sources: Ferster and Skinner, Mirenda and Locke, Ghaemmaghami et al., Vollmer et al., and the picture-type row rewritten',/Ferster, C\. B\., & Skinner, B\. F\. \(1957\)\. Schedules of reinforcement/.test(page)&&/Mirenda, P\., & Locke, P\. A\. \(1989\)/.test(page)&&/Ghaemmaghami, M\., Hanley, G\. P\., & Jessel, J\. \(2016\)/.test(page)&&/Vollmer, T\. R\., Borrero/.test(page)&&
    /teach each picture with more than one example of the item/.test(page)&&!/first step of the picture hierarchy/.test(page)&&!/the wait card and countdown are those signals/.test(page),'text');
  const rules=await p.evaluate(()=>RULES0.filter(r=>['waiting','listening','calm','eyes'].includes(r[0])).map(r=>r[1]+': '+r[2]).join(' | '));
  const old=await p.evaluate(()=>{S=blank();S.rules.find(r=>r.k==='waiting').say='My turn is coming. Hands in my lap.';ensure();return S.rules.find(r=>r.k==='waiting').say;});
  ok('12 F295 no eye contact or still hands in the rule library; an older file\'s default sentence is brought up to date; the hint says to choose from the plan',
    !/Eyes on the speaker|Look at the teacher when she talks|Still body|Hands in my lap/.test(rules)&&/when the teacher talks/.test(rules)&&old==='My turn is coming. Calm body, I can wait.'&&/leave out eye-contact and still-hands rules unless the team has decided they matter/.test(page),{rules,old});
  ok('13 F296 the card sheets\' hint and the schedule agree on size',/one and a half or two inches matches the visual schedule here, and one inch a small desk strip/.test(page)&&!/one inch suits a schedule strip/.test(page),'text');
  ok('14 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
