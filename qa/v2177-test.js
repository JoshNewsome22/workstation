/* v21.77 Form TV-1, the training video, further (simulated student only: Mateo Rivera):
   1. where things stand: Form DD-1's data said, listed and drawn as a chart (the picture 'tvchart'), before the plan and now;
   2. Form QS-1: the non-negotiables as a card of do and don't in two columns (both looks, inside the stage), the tiers one a
      card that builds (see, do, say); QS-1 hands on the words to say;
   3. a draft for a family: plain openings, no crisis stages, the crisis tier left out; Automatic reads who the video is for;
   4. the plain-language check: the terms found, Replace and Keep;
   5. the photo check against Form DM-1's permission (the chart is not a photo); initials only on the cards, the tag and the draft;
   6. the target length: each segment's share, the longest segment and card, over or under on the summary and on Setup;
   7. the check quiz: five to eight questions, the answer among the choices; the CSV for Google Forms; the printed quiz and key;
   8. the rehearsal steps: out with the case (training), printed as a checklist; Form ST-1 fills an empty step list, not a started one;
   9. retakes: R, the button, the clicker held (back to the card it was on); the CSV; kept in the saved file;
   10. the shell reads Form TV-1's facts; no errors.
   usage: node qa/v2177-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,BASE,sleep}=require(__dirname+'/lib.js');
const TV=BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html',ST=BASE+'/NBH-Workstation/ST-1_Behavior-Skills-Training_v2026-09.html',QS=BASE+'/NBH-Workstation/QS-1_Staff-Quick-Start_v2026-10.html';
const OUT=path.join(__dirname,'out','v2177');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const CASE={behaviors:[{label:'Elopement',def:'Leaving the assigned area by more than three feet without permission',ex:'walking out of the classroom door',nex:'going to the bathroom with a pass',dim:'frequency'},
    {label:'Physical aggression',def:'Hitting, kicking or pushing another person',ex:'hitting a peer on the arm',nex:'a high five',dim:'frequency'},{label:'Asking for a break',isRep:true,type:'replacement'}],
  fn:{label:'Escape from demands',key:'escape',statements:['When Mateo is given a long task, Mateo leaves the area, and the task is taken away.']},
  plan:{rep:'Asking for a break with the break card',prec:'Pushing the paper away',ant:['Give a first-then card','Break tasks into short steps','Offer a choice of where to start'],
    respond:{prec:'Move closer and point to the break card',target:'Stay calm, use few words, block the door',after:'Return to the same task, with help',not:'Argue or remove the task'}},
  crisis:{stages:[{s:'Escalation',do:'Clear the area of other students'},{s:'Crisis',do:'Call the crisis team'}]},
  profile:{strengths:'reads well; kind to others',interests:'drawing; music',flags:{photo:'No',safety:[]}},
  data:{from:'2026-09-01',to:'2026-10-09',days:28,behaviors:[{name:'Elopement',kind:'target',unit:'occurrences',measure:'count',base:{days:5,mean:4.2},baseName:'Baseline',cur:{days:23,mean:0.8},curName:'Intervention',aim:0,aimMet:false},
    {name:'Asking for a break',kind:'replacement',unit:'occurrences',measure:'count',base:{days:5,mean:0.4},cur:{days:23,mean:6.5},aim:5,aimMet:true},
    {name:'On-task',kind:'acquisition',unit:'% of intervals',measure:'pint',base:{days:5,mean:35},cur:{days:23,mean:72},aim:80,aimMet:false}]},
  quick:{rules:[{do:'Greet Mateo by name at the door',dont:'Argue about the rules during an escalation'},{do:'Give a first-then card before work',dont:'Take the break card away'},{do:'Praise the first step started',dont:'Remove the task when he leaves'}],
    tiers:[{name:'0 · Earliest sign',see:'Pushes the paper away, head down',do:'Move closer and offer the break card',say:'“Do you need a break?”'},{name:'1 · The behavior',see:'Leaves the seat toward the door',do:'Stay calm, block the door, point to the card',say:'“Break card, then back.”'},
      {name:'2 · Crisis',see:'Hits or runs out of the room',do:'Call the crisis team; clear the area',say:''},{name:'3 · Recovery',see:'Calm, sitting',do:'Return to the same task, with help',say:'“Let’s finish one more.”'}]}};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950},acceptDownloads:true});const page=await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  const dl=async(pg,fn)=>{const [d]=await Promise.all([pg.waitForEvent('download'),pg.evaluate(fn)]);const p=path.join(OUT,d.suggestedFilename());await d.saveAs(p);return p;};
  await page.goto(TV);await sleep(1200);await page.evaluate(()=>{nbhUI.confirm=async()=>true;window.print=()=>{window.__printed=(window.__printed||0)+1;};});
  /* 1-2 the draft from a case with Form DD-1's data and Form QS-1's quick start */
  const d1=await page.evaluate(c=>{Object.assign(S.meta,{client:'Mateo Rivera',first:'',aud:'the receiving team',pname:'Sample Presenter, BCBA'});window.__nbhFactsIn(c);
    const line=document.getElementById('caseLine').textContent;document.getElementById('draftBtn').click();
    const segs=r=>S.rows.filter(x=>x.seg===r),data=segs('Where Things Stand'),ev=segs('Every Day'),ti=segs('Step by Step'),ch=photo('tvchart');
    const svg=ch?decodeURIComponent(escape(atob(ch.img.split(',')[1]))):'';
    return {line,n:S.rows.length,data:data.map(r=>({say:spoken(r),card:r.say,body:r.body,lay:r.lay,ph:r.pics[0].ph,cap:r.pics[0].cap})),svg:{ok:/^data:image\/svg\+xml;base64,/.test(ch&&ch.img||''),before:(svg.match(/Before the plan/g)||[]).length,names:/Elopement/.test(svg)&&/On-task/.test(svg),goal:/Goal 80%/.test(svg)},
      ev:ev.map(r=>({lay:r.lay,body:r.body,say:unmark(spoken(r)),card:r.say,cont:r.cont})),ti:ti.map(r=>({t:r.title,b:r.body,build:r.build,say:unmark(spoken(r)),card:r.say})),order:[...new Set(S.rows.map(r=>r.seg))]};},CASE);
  ok('1 Setup names the daily data and the quick start among what the case holds',/the daily data \(Form DD-1\)/.test(d1.line)&&/quick start/.test(d1.line),d1.line);
  ok('1 where things stand: one card, said in words (before the plan and now, the goal met), listed, with the chart as its picture',d1.data.length===1&&/Elopement: about 4\.2 times a day before the plan, and about 0\.8 times a day now/.test(d1.data[0].say)&&/Asking for a break has met its goal/.test(d1.data[0].say)&&/On-task: 35 → 72%/.test(d1.data[0].body)&&/^Here is where things stand, from the daily data, September 1 to October 9\.$/.test(d1.data[0].card)&&d1.data[0].lay==='pic1'&&d1.data[0].ph==='tvchart'&&/Form DD-1/.test(d1.data[0].cap),d1.data);
  ok('1 the chart: an SVG picture, a panel a behavior, before and now, the goal dashed',d1.svg.ok&&d1.svg.before===3&&d1.svg.names&&d1.svg.goal,d1.svg);
  ok('2 every day: the do and don\'t card, two columns, its lines Do: and Don\'t:, said aloud',d1.ev.length===1&&d1.ev[0].lay==='dodont'&&/^Do: Greet Mateo by name/.test(d1.ev[0].body)&&/Don’t: Argue about the rules/.test(d1.ev[0].body)&&/non-negotiables/.test(d1.ev[0].say)&&/Don’t argue about the rules/.test(d1.ev[0].say)&&!/Greet/.test(d1.ev[0].card),d1.ev);
  ok('2 step by step: a card listing the tiers, then one a tier, each building (see, do, say)',d1.ti.length===5&&d1.ti.every(r=>r.build)&&/^See: Pushes the paper away/.test(d1.ti[1].b)&&/\nSay: “Do you need a break\?”/.test(d1.ti[1].b)&&/What you see: pushes the paper away/.test(d1.ti[1].say)&&d1.ti[1].card==='Earliest sign.',d1.ti);
  ok('2 the segments in their places: where things stand after the function, every day after the strategies, step by step after the response',d1.order.indexOf('Where Things Stand')===d1.order.indexOf('Function & Data')+1&&d1.order.indexOf('Every Day')===d1.order.indexOf('Proactive Strategies')+1&&d1.order.indexOf('Step by Step')===d1.order.indexOf('Response Plan')+1,d1.order);
  /* the do and don't card drawn in both looks, every item inside the stage */
  const look=async lk=>page.evaluate(lk=>{S.meta.look=lk;const i=S.rows.findIndex(r=>r.lay==='dodont');setView('graphics');gxAt=i;gxRender();const box=document.querySelector('#gxBig .gx-box').getBoundingClientRect();
    const it=[...document.querySelectorAll('#gxBig .dd2-i')],cols=[...document.querySelectorAll('#gxBig .dd2-c')].map(c=>c.getBoundingClientRect());
    return {n:it.length,cols:cols.length,side:cols.length===2&&cols[1].left>cols[0].right-2,inside:it.every(e=>{const r=e.getBoundingClientRect();return r.bottom<=box.bottom+1&&r.right<=box.right+1;}),heads:[...document.querySelectorAll('#gxBig .dd2-h')].map(h=>h.textContent)};},lk);
  const lc=await look('chapters'),lk2=await look('cards');await page.evaluate(()=>{S.meta.look='chapters';setView('setup');});
  ok('2 the do and don\'t card in the Chapters look: Do and Don\'t side by side, three each, inside the stage',lc.n===6&&lc.cols===2&&lc.side&&lc.inside&&lc.heads.join()==='Do,Don’t',lc);
  ok('2 and in the Cards look',lk2.n===6&&lk2.side&&lk2.inside,lk2);
  /* 3 a family */
  const f1=await page.evaluate(c=>{S.rows=[];S.meta.aud='the Rivera family';const auto=tvFam();document.getElementById('draftBtn').click();
    const r={auto,ov:(S.rows.find(x=>x.title==='Presenter')||{}).say,safety:S.rows.some(x=>x.title==='Safety'),tiers:S.rows.filter(x=>x.seg==='Step by Step').map(x=>x.title),beh:(S.rows.find(x=>x.title==='Tracked')||{}).say,checks:document.getElementById('tvChecks').textContent};
    S.meta.audk='staff';r.forced=tvFam();S.meta.audk='';S.meta.aud='the receiving team';return r;},CASE);
  ok('3 Automatic: "the Rivera family" drafts for a family; Staff chosen overrides it',f1.auto&&!f1.forced,f1);
  ok('3 the family draft: plain openings, no crisis stages, the crisis tier left out (the recovery kept)',/This video is for the Rivera family/.test(f1.ov)&&/counts a few behaviors/.test(f1.beh)&&!f1.safety&&f1.tiers.join('|')==='What You See, What You Do|0 · Earliest sign|1 · The behavior|3 · Recovery'&&/Drafted for a family/.test(f1.checks),f1);
  /* 4 the plain-language check */
  const p1=await page.evaluate(()=>{S.rows=[];document.getElementById('draftBtn').click();document.getElementById('plainBtn').click();const el=document.getElementById('plainOut');
    const terms=[...el.querySelectorAll('[data-plainrep]')].map(b=>b.dataset.plainrep),before=tvPlainHits().find(x=>x.t==='replacement behavior');
    el.querySelector('[data-plainrep="replacement behavior"]').click();const after=S.rows.some(r=>/replacement behavior/i.test(r.say+r.body+r.title)),plain=S.rows.some(r=>/skill taught instead/i.test(r.say));
    document.querySelector('#plainOut [data-plainkeep="antecedent"],#plainOut [data-plainkeep]').click();const kept=S.meta.plainKeep;return {terms,before:before&&before.n,after,plain,kept,still:tvPlainHits().map(x=>x.t).includes(kept),shown:!el.hidden};});
  ok('4 the plain-language check lists the plan\'s terms (a staff draft: the definitions, the hypothesis, the replacement)',p1.shown&&p1.terms.includes('replacement behavior')&&p1.terms.includes('hypothesis statement')&&p1.terms.includes('observable and measurable')&&p1.before>=1,p1);
  ok('4 Replace puts the plain words in; Keep takes a term off the list',!p1.after&&p1.plain&&p1.kept&&!p1.still,p1);
  /* 5 the photo check, initials only */
  const ph=await page.evaluate(c=>{const jpg='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';S.photos.push({id:'pz',label:'class',img:jpg});S.rows[1].pics[0].ph='pz';renderAll();
    const no=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.className+': '+v.textContent).find(t=>/Photos/.test(t))||'';
    window.__nbhFactsIn(Object.assign({},c,{profile:Object.assign({},c.profile,{flags:{photo:'Yes'}})}));const yes=[...document.querySelectorAll('#tvChecks .verdict')].map(v=>v.className+': '+v.textContent).find(t=>/Photos/.test(t))||'';
    window.__nbhFactsIn(c);S.rows[1].pics[0].ph='';prune();renderAll();const none=/Photos/.test(document.getElementById('tvChecks').textContent);return {no,yes,none};},CASE);
  ok('5 a photo on card 2 and no permission in Form DM-1: a red check names the card; with permission it is green; the chart alone is no photo',/v-no/.test(ph.no)&&/card 2 shows a photo/.test(ph.no)&&/v-ok/.test(ph.yes)&&!ph.none,ph);
  const in1=await page.evaluate(()=>{const cb=document.querySelector('[data-c="initials"]');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));
    const txt=S.rows.map(r=>r.say+r.title+r.body+r.seg).join(' ');S.rows=[];document.querySelectorAll('#segPick input').forEach(c=>{c.checked=c.dataset.seg==='overview';});document.getElementById('draftBtn').click();
    const r={name:/Mateo/.test(txt),ini:/M\. R\./.test(txt),tag:tagText(),first:firstName(),draft:S.rows[0].say,check:document.getElementById('tvChecks').textContent};
    cb.checked=false;cb.dispatchEvent(new Event('change',{bubbles:true}));document.querySelectorAll('#segPick input').forEach(c=>{c.checked=true;});r.back=firstName();return r;});
  ok('5 initials only: the name gone from the script, M. R. in its place, on the tag and in a new draft; off again, the name',!in1.name&&in1.ini&&in1.tag==='FBA & BIP Video Training: M. R.'&&in1.first==='M. R.'&&/M\. R\.’s/.test(in1.draft)&&/Initials only: M\. R\./.test(in1.check)&&in1.back==='Mateo',in1);
  /* 6 the target length */
  const tg=await page.evaluate(c=>{S.rows=[];window.__nbhFactsIn(c);document.getElementById('draftBtn').click();S.meta.target='1';renderAll();setView('script');
    return {sum:document.getElementById('scriptSum').textContent,seg:[...document.querySelectorAll('[data-segsum]')].map(e=>e.textContent),long:document.querySelectorAll('.tv-longseg').length,card:[...document.querySelectorAll('.tv-longcard')].map(e=>e.textContent),
      check:([...document.querySelectorAll('#tvChecks .verdict')].find(v=>/Length/.test(v.textContent))||{}).textContent||''};},CASE);
  ok('6 each segment its share of the time; the longest segment and the longest card marked',tg.seg.every(t=>/· \d+%/.test(t))&&tg.long===1&&tg.seg.filter(t=>/the longest/.test(t)).length===1&&tg.card.length===1&&/the longest card/.test(tg.card[0]),tg);
  ok('6 a one-minute target: the summary and Setup say how far over, and name the longest segment',/target 1:00: \d+:\d\d over/.test(tg.sum)&&/against 1:00: \d+:\d\d over\. The longest segment is .+ \(\d+%\)/.test(tg.check),tg);
  /* 7 the check quiz */
  const qz=await page.evaluate(()=>{document.getElementById('quizBtn').click();return {n:QUIZ.length,ok:QUIZ.every(x=>x.ch.includes(x.a)&&new Set(x.ch).size===x.ch.length&&x.ch.length>=2),q:QUIZ.map(x=>x.q),shown:document.querySelectorAll('#quizOut .tv-quiz>li').length,
    ticks:document.querySelectorAll('#quizOut li.ok').length,pos:QUIZ.map(x=>x.ch.indexOf(x.a))};});
  ok('7 the quiz: five to eight questions from the case, each answer among its choices, shown with the answer ticked',qz.n>=5&&qz.n<=8&&qz.ok&&qz.shown===qz.n&&qz.ticks===qz.n&&qz.q.some(q=>/elopement, as the plan defines it/.test(q))&&qz.q.some(q=>/Why does the team think/.test(q))&&qz.q.some(q=>/what has happened to elopement/.test(q)),qz);
  ok('7 the answers are not always the first choice',new Set(qz.pos).size>1,qz.pos);
  const csv=fs.readFileSync(await dl(page,()=>document.getElementById('quizCsv').click()),'utf8').split('\n');
  ok('7 the CSV for Google Forms: a header and a row a question, the correct answer named',/^"Question","Question type","Option 1","Option 2","Option 3","Option 4","Correct answer","Points"$/.test(csv[0])&&csv.length===qz.n+1&&/"Multiple choice"/.test(csv[1]),csv.slice(0,2));
  const pq=await page.evaluate(async()=>{document.getElementById('quizPrint').click();await new Promise(r=>setTimeout(r,120));const o=document.getElementById('printOut'),h={qs:o.querySelectorAll('.pq>li').length,key:!!o.querySelector('.pq-key'),title:(o.querySelector('h1')||{}).textContent,printed:window.__printed};
    window.dispatchEvent(new Event('afterprint'));h.back=/the Script/.test((o.querySelector('h1')||{}).textContent);return h;});
  ok('7 Print the quiz: the questions with boxes, the key on a page of its own; afterwards the print is the script again',pq.qs===qz.n&&pq.key&&/Check Quiz/.test(pq.title)&&pq.printed>=1&&pq.back,pq);
  /* 8 the rehearsal steps */
  const sp=await page.evaluate(()=>{const st=tvSteps(),o=window.__nbhFactsOut();document.getElementById('stepsBtn').click();return {n:st.length,crit:st.filter(s=>s.crit).length,ant:st.filter(s=>s.cmp==='ant').map(s=>s.d),out:o&&o.training&&o.training.steps.length,src:o&&o.training&&o.training.src,
    noDont:!st.some(s=>/argue/i.test(s.d)),say:st.some(s=>/^Says: “Do you need a break\?” \(0 · Earliest sign\)/.test(s.d)),shown:document.querySelectorAll('#stepsOut .tv-steps li').length};});
  ok('8 the rehearsal steps: the strategies and the do list (antecedent), the response steps and the tiers (critical), no don\'t; out with the case',sp.n>=8&&sp.crit>=4&&sp.ant.includes('Give a first-then card')&&sp.ant.includes('Greet Mateo by name at the door')&&sp.noDont&&sp.say&&sp.out===sp.n&&sp.src==='TV-1'&&sp.shown===sp.n,sp);
  const ps=await page.evaluate(async()=>{document.getElementById('stepsPrint').click();await new Promise(r=>setTimeout(r,120));const o=document.getElementById('printOut'),r={rows:o.querySelectorAll('.pq-tbl tr').length,title:(o.querySelector('h1')||{}).textContent};window.dispatchEvent(new Event('afterprint'));return r;});
  ok('8 the rehearsal checklist prints: a row a step, boxes to tick',ps.rows===sp.n+1&&/Rehearsal Checklist/.test(ps.title),ps);
  const steps=await page.evaluate(()=>window.__nbhFactsOut().training.steps);
  const sp2=await ctx.newPage();sp2.on('pageerror',e=>errs.push('ST-1: '+e.message));await sp2.goto(ST);await sleep(1000);
  const st1=await sp2.evaluate(steps=>{const r1=window.__nbhFactsIn({training:{steps,src:'TV-1'}});const a={r1,n:S.steps.length,first:JSON.parse(JSON.stringify(S.steps[0])),crit:S.steps.filter(s=>s.crit).length,shown:document.querySelectorAll('#stepTbl tbody tr').length};
    S.steps[0].d='Written by the trainer';const r2=window.__nbhFactsIn({training:{steps:[{d:'Another step',crit:false,cmp:'ant'}]}});a.r2=r2;a.kept=S.steps[0].d;a.n2=S.steps.length;return a;},steps);
  ok('8 Form ST-1: an empty step list takes the steps, with the components and the critical marks',st1.r1.filled>=steps.length&&st1.n===steps.length&&st1.first.d===steps[0].d&&st1.first.cmp===steps[0].cmp&&st1.crit===steps.filter(s=>s.crit).length&&st1.shown===steps.length,st1);
  ok('8 a step list already started is left as it is, and says so',st1.kept==='Written by the trainer'&&st1.n2===steps.length&&/were not placed/.test(st1.r2.note),st1);
  await sp2.close();
  /* 9 retakes */
  const rt=await page.evaluate(async()=>{S.chk.nocd=true;setView('prompter');tpGo(3,true);document.getElementById('tpRec').click();await new Promise(r=>setTimeout(r,350));
    const k=(key,o)=>document.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key,bubbles:true,cancelable:true},o||{})));
    k('PageDown');await new Promise(r=>setTimeout(r,150));k('r');const a={n1:S.takes.length,t1:S.takes[0]&&S.takes[0].t,seg1:S.takes[0]&&S.takes[0].seg,i1:TP.i};
    const i0=TP.i;k('PageDown');const moved=TP.i;k('PageDown',{repeat:true});k('PageDown',{repeat:true});document.dispatchEvent(new KeyboardEvent('keyup',{key:'PageDown',bubbles:true}));
    a.moved=moved!==i0||TP.b>0;a.back=TP.i===i0;a.n2=S.takes.length;document.getElementById('tpRetake').click();a.n3=S.takes.length;a.line=document.getElementById('logLine').textContent;a.from=S.takes[0].from;return a;});
  ok('9 R marks a retake: the segment on screen, the time on the clock, when its segment began',rt.n1===1&&rt.t1>0&&rt.seg1&&rt.from!=null&&rt.from<=rt.t1,rt);
  ok('9 the clicker held: back to the card it was pressed on, one retake for the hold; the button marks one too',rt.moved&&rt.back&&rt.n2===2&&rt.n3===3&&/3 retakes marked/.test(rt.line),rt);
  const tcsv=fs.readFileSync(await dl(page,()=>document.getElementById('takeCsv').click()),'utf8').split('\n');
  ok('9 the retakes export as CSV: the time, when the segment began, the card, the segment',/^"Retake","Time","Seconds","Segment began","Card","Segment","Title"$/.test(tcsv[0])&&tcsv.length===4&&/^"1","\d+:\d\d"/.test(tcsv[1]),tcsv);
  const sv=await page.evaluate(()=>{document.getElementById('tpRec').click();setView('setup');const t=JSON.stringify({form:'TV-1',S:JSON.parse(JSON.stringify(S))});const o=fromFile(JSON.parse(t));
    const bad=fromFile({form:'TV-1',S:{rows:[],takes:[{i:'x',t:'<b>',seg:{a:1},title:'<img src=x>'},null,7]}});return {n:o.takes.length,same:o.takes[0].seg===S.takes[0].seg&&o.takes[0].t===S.takes[0].t,bad:bad.takes};});
  ok('9 the saved file keeps the retakes; a file from elsewhere is read field by field',sv.n===3&&sv.same&&sv.bad.length===1&&sv.bad[0].i===0&&sv.bad[0].t===null&&typeof sv.bad[0].seg==='string',sv);
  /* QS-1 hands on the words to say */
  const qp=await ctx.newPage();qp.on('pageerror',e=>errs.push('QS-1: '+e.message));await qp.goto(QS);await sleep(1000);
  const qs=await qp.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();await new Promise(r=>setTimeout(r,300));const o=window.__nbhFactsOut();return o&&o.quick&&o.quick.tiers[0];});
  ok('2 Form QS-1 hands on each tier\'s words to say',qs&&typeof qs.say==='string'&&qs.say.length>3,qs);await qp.close();
  /* 10 the shell */
  const sh=fs.readFileSync(path.join(__dirname,'..','NBH-Workstation','index.html'),'utf8');
  ok('10 the shell reads Form TV-1\'s facts (training) and shows the rehearsal steps on the case line',/'TV-1':'training'/.test(sh)&&/\|\|f\.training\b/.test(sh)&&/Rehearsal steps:/.test(sh),'');
  ok('no errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
