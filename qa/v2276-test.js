/* v22.76 Form GC-1, review Wave 3 part 3: the teacher's game script, printed on its own page and handed on to Forms ST-1
   and TI-1 (I145); a picture-supported, large-print poster with the expectations in the family's language (I143).
   Simulated data only. usage: node qa/v2276-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');const {execFileSync}=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const GC='GC-1_Group-Contingencies_v2026-10.html',TI='TI-1_Treatment-Integrity-Observation_v2026-09.html',ST='ST-1_Behavior-Skills-Training_v2026-09.html';
const OUT=__dirname+'/out/v2276';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const chk=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-c="'+k+'"]');e.checked=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const pages=p=>p.evaluate(()=>[...document.querySelectorAll('#posterOut .po-page')].map(x=>x.querySelector('.po-title').textContent));

  const p=await open(GC);await p.evaluate(async()=>{await loadSim();setView('poster');});await sleep(400);
  /* ---------------- I145 the script ---------------- */
  const p0=await pages(p);await chk(p,'po_script',true);await sleep(150);const p1=await pages(p);
  const sc=await p.evaluate(()=>({li:[...document.querySelectorAll('#posterOut .po-script ol.po-steps li')].map(x=>x.textContent),steps:scriptSteps()}));
  ok('1 I145 the teacher’s game script is a page of its own, printed only when it is ticked',p0.join('|')==='Room 12 Expectations|Scoreboard|The Good Behavior Game'&&p1.join('|')==='Room 12 Expectations|Scoreboard|The Good Behavior Game|How to Run the Game',[p0,p1]);
  const T=sc.li.join(' ¶ ');
  ok('2 I145 the script says what to say and do: the goal and how to win, a neutral mark, praise, what never happens, the reward, the Record; the every-time steps are marked',
    sc.li.length===10&&/Say the teams and the goal for today out loud: no more than 2 fouls per team\. Every team at or under the goal wins\. Every time\./.test(T)&&/mark it at once against their team .*neutral voice \("Blue Jays, that’s a mark"\).*No lecture\. Every time\./.test(T)&&
    /Every few minutes, praise a team that is at or under the goal/.test(T)&&/Never: No marks are removed as a reward/.test(T)&&/Give the reward as written: a victory tag/.test(T)&&/Enter the day on the Record/.test(T)&&sc.steps.filter(s=>s.crit).length===5,sc.li);
  const types=await p.evaluate(()=>{const keep=JSON.stringify(S),o={};for(const t of ['cwfit','tootle','dep','selfmon']){S.type=t;o[t]=scriptSteps().map(s=>s.d).join(' ¶ ');}S=JSON.parse(keep);renderAll();return o;});
  ok('3 I145 each arrangement gets its own step: CW-FIT’s timer and points, tootling’s cards, the dependent student never named or blamed, self-monitoring’s cue',
    /Each time the timer sounds .*give a point to each team whose members are all using the skills/.test(types.cwfit)&&/Collect the tootle cards.*put-downs and tattling/.test(types.tootle)&&/Never name or blame the student whose score counts/.test(types.dep)&&/At each cue, have every student record/.test(types.selfmon)&&!/that’s a mark/.test(types.tootle),types);
  const out=await p.evaluate(()=>window.__nbhFactsOut().classwide);
  ok('4 I145 the script goes to the case with the class system',out&&Array.isArray(out.script)&&out.script.length===10&&out.script.filter(s=>s.crit).length===5,out&&out.script);
  /* TI-1 and ST-1 take it on request */
  const ti=await open(TI);
  const t1=await ti.evaluate(cw=>{window.__nbhFactsIn({classwide:cw});const b=document.getElementById('addGame');const vis=b&&b.style.display!=='none';const before=S.steps.filter(x=>String(x.d||'').trim()).length;b.click();
    const after=S.steps.filter(x=>String(x.d||'').trim());b.click();const again=S.steps.filter(x=>String(x.d||'').trim()).length;return {vis,before,after:after.length,crit:after.filter(x=>x.crit).length,again,first:after[0]&&after[0].d};},out);
  ok('5 I145 TI-1 offers "Add the class game’s script" and adds its steps once, the every-time steps critical; nothing is added until asked',t1.vis&&t1.before===0&&t1.after===10&&t1.crit===5&&t1.again===10&&/^Before the game, go over the expectations/.test(t1.first),t1);
  await ti.close();
  const st=await open(ST);
  const s1=await st.evaluate(cw=>{window.__nbhFactsIn({classwide:cw});const b=document.getElementById('useGame');const vis=b&&b.style.display!=='none';b.click();const a=S.steps.length,crit=S.steps.filter(x=>x.crit).length;
    S.steps.splice(3,7);renderAll();b.click();return {vis,a,crit,b:S.steps.length};},out);
  ok('6 I145 ST-1 offers "Use the class game’s script": it fills an empty step list, then adds only the steps not there yet',s1.vis&&s1.a===10&&s1.crit===5&&s1.b===10,s1);
  await st.close();

  /* ---------------- I143 the picture poster ---------------- */
  await chk(p,'po_script',false);await chk(p,'po_pics',true);await sleep(200);
  const pic=await p.evaluate(()=>({lib:gcPicsOk(),exp:[...document.querySelectorAll('#posterOut ol.po-exp li')].map(li=>!!li.querySelector('svg.po-pic')),no:document.querySelectorAll('#posterOut .po-picno').length,
    rw:!!document.querySelector('#posterOut .po-rw svg.po-pic'),sel:[...document.querySelectorAll('#gcPicPick select')].map(s=>s.options[s.selectedIndex].textContent)}));
  ok('7 I143 a picture beside each expectation, each rule (crossed) and the prize; the picker shows the picture chosen from the words',
    pic.lib&&pic.exp.length===4&&pic.exp.every(Boolean)&&pic.no===3&&pic.rw&&pic.sel[0]==='Chosen from the words (Raise my hand)'&&pic.sel[1]==='Chosen from the words (Sitting)'&&pic.sel[2]==='Chosen from the words (Safe hands)',pic);
  const ov=await p.evaluate(()=>{const s=document.querySelector('#gcPicPick select');s.value='calm';s.dispatchEvent(new Event('change',{bubbles:true}));const li=document.querySelector('#posterOut ol.po-exp li svg.po-pic');
    return {pic:S.exp[0].pic,svg:li?(d=>{d.innerHTML=window.picto('calm','po-pic');return li.innerHTML===d.firstChild.innerHTML;})(document.createElement('div')):false};});
  ok('8 I143 a picture picked for an expectation replaces the one chosen from the words, and is kept',ov.pic==='calm'&&ov.svg,ov);
  await chk(p,'po_big',true);await p.evaluate(()=>{const e=document.querySelector('[data-m="po_l2"]');e.value='Levanta la mano para hablar\nQuédate en tu asiento\nManos y pies quietos\nSigue las instrucciones';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(400);
  const lg=await p.evaluate(()=>({big:document.querySelectorAll('#posterOut .po-page.po-large').length,l2:[...document.querySelectorAll('#posterOut ol.po-exp .l2')].map(x=>x.textContent),fs:getComputedStyle(document.querySelector('#posterOut .po-large ol.po-exp .w')).fontSize}));
  ok('9 I143 large print on the class pages, and the expectations in the family’s language in italics under each one',lg.big===3&&lg.fs==='34px'&&lg.l2.length===4&&lg.l2[0]==='Levanta la mano para hablar',lg);
  /* the poster still prints one page per sheet, with the script too */
  await chk(p,'po_script',true);await sleep(300);
  await p.emulateMedia({media:'print'});await p.evaluate(()=>document.body.classList.add('gc-poster-only'));
  await p.pdf({path:OUT+'/poster.pdf',format:'Letter',printBackground:true});await p.evaluate(()=>document.body.classList.remove('gc-poster-only'));await p.emulateMedia({media:'screen'});
  const n=+execFileSync('python3',['-c','import sys,pymupdf;print(pymupdf.open(sys.argv[1]).page_count)',OUT+'/poster.pdf']).toString().trim();
  ok('10 I143/I145 with pictures, large print and the script, the poster prints four pages, one per sheet',n===4,n);
  /* save and open */
  const rt=await p.evaluate(async()=>{let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const before=JSON.stringify(S);S=fromFile(JSON.parse(saved));renderAll();return before===JSON.stringify(S)&&S.exp[0].pic==='calm'&&S.chk.po_pics&&S.chk.po_big;});
  ok('11 save and open: the picture picked, the options and the family’s-language lines are kept',rt);
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
