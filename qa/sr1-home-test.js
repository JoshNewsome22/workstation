/* The schedule card's family version (v23.49, review I139; wording approved by the BCBA): Form SR-1 writes the paragraph for
   the schedule from the card, in English, and in Spanish once the words it uses are written in Spanish (only those boxes are
   asked for); the BCBA's own words replace the draft; on screen only; an assessment schedule has none. Form HD-1's sheet "The
   school's plan, at home" prints it, the Spanish first when the family's language is Spanish. Simulated data only.
   usage: node qa/sr1-home-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const sr=await open(file('SR-1_'));
  await sr.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  const put=x=>sr.evaluate(x=>{Object.assign(S.meta,x);renderAll();const r=window.__nbhFactsOut();const b=document.getElementById('srHomeOut');
    return {home:r&&r.schedule&&r.schedule.home,box:b?b.innerText:'',fields:[...document.querySelectorAll('#srHomeEs > div')].filter(d=>!d.hidden).map(d=>d.dataset.es)};},x);
  const a=await put({ds_sel:'dro',client:'Mateo Rivera',beh:'Hitting (simulated)',behs:'',sr:'a few minutes of drawing (simulated)',srs:'',sd_step:'',es_beh:'',es_sr:'',home_en:'',home_es:''});
  ok('1 DRO: the English paragraph from the card (the child, the reward, the behavior, the stretch in force), as approved',!!a.home&&/^At school, Mateo earns a few minutes of drawing for stretches of time without hitting\. Right now a stretch is [^,]+, and it grows as Mateo succeeds\. At home you can do the same: notice the times without hitting, praise them, and give something Mateo likes\. If hitting happens, stay calm, say little, and start the stretch again\. Nothing Mateo has already earned is taken away\.$/.test(a.home.en),a);
  ok('2 no Spanish yet: none goes home, and only the two words it uses are asked for (the behavior, the reinforcer)',a.home.es===''&&JSON.stringify(a.home.need)===JSON.stringify(['the reinforcer','the behavior'])&&a.fields.sort().join()==='beh,sr'&&/Write the reinforcer, the behavior in Spanish below/.test(a.box),a);
  const b=await put({es_beh:'pegar',es_sr:'unos minutos para dibujar'});
  ok('3 with the Spanish words: the Spanish paragraph, as approved',/^En la escuela, Mateo gana unos minutos para dibujar por ratos sin pegar\. Ahora cada rato es de [^,]+, y se alarga a medida que Mateo lo logra\. En casa pueden hacer lo mismo: fíjense en los ratos sin pegar, felicítenle y denle algo que le guste\. Si ocurre pegar, mantengan la calma, hablen poco y empiecen el rato de nuevo\. No se le quita nada que Mateo ya haya ganado\.$/.test(b.home.es)&&b.home.need.length===0,b.home);
  const c=await put({home_en:'Our own words for home (simulated).'});
  ok('4 the BCBA\'s own words go home in place of the English draft',c.home.en==='Our own words for home (simulated).'&&/^En la escuela/.test(c.home.es),c.home);
  const t=await put({home_en:'',ds_sel:'token',tk_what:'Star',tk_prod:'1',tk_exch:'10',tk_backs:'Tablet time, 10\nA board game, 8',earn:'a card touch',earns:''});
  ok('5 token economy: the token, what earns it, the exchange and the back-ups',/^At school, Mateo earns a star for a card touch\. When Mateo has 10, Mateo trades them for tablet time or a board game, which Mateo chose\./.test(t.home.en)&&t.fields.sort().join()==='backs,earn,tok',t);
  const p=await put({ds_sel:'pr'});
  ok('6 a progressive ratio (an assessment) has no home version',!p.home&&/no home version/.test(p.box),p);
  await sr.emulateMedia({media:'print'});const pd=await sr.evaluate(()=>getComputedStyle(document.getElementById('srHome')).display);await sr.emulateMedia({media:'screen'});
  ok('7 on screen only: the printed card is unchanged',pd==='none',pd);
  /* HD-1 */
  const hd=await open(file('HD-1_'));
  const H={en:'At school, Mateo earns drawing time (simulated).',es:'En la escuela, Mateo gana tiempo para dibujar (simulado).',need:[]};
  const look=(f,lang)=>hd.evaluate(([f,lang])=>{S.meta.lang=lang;S.chk.sched=true;window.__nbhFactsIn(f);const s=document.querySelector('#sheetOut .hs[data-sheet="sched"]');
    return s?{title:s.querySelector('.hs-title').textContent,boxes:[...s.querySelectorAll('.hs-box')].map(x=>x.getAttribute('lang')+': '+x.textContent),flag:(s.querySelector('.nbh-lang-flag')||{}).textContent||''}:null;},[f,lang]);
  const h1=await look({schedule:{home:H}},'Spanish');
  ok('8 HD-1, a Spanish-speaking family: the Spanish first, then the English, under both titles',!!h1&&/^El plan de la escuela, en casa · The School’s Plan, at Home$/.test(h1.title)&&h1.boxes.length===2&&/^es: El plan de la escuela, en casaEn la escuela, Mateo gana/.test(h1.boxes[0])&&/^en: The school’s plan, at homeAt school, Mateo earns/.test(h1.boxes[1]),h1);
  const h2=await look({schedule:{home:H}},'English');
  ok('9 an English-speaking family: the English only',!!h2&&h2.title==='The School’s Plan, at Home'&&h2.boxes.length===1&&/^en: /.test(h2.boxes[0]),h2);
  const h3=await look({schedule:{home:{en:H.en,es:'',need:['the behavior']}}},'Spanish');
  ok('10 Spanish needed and none yet: the English goes, and a line on screen says what to write on SR-1',!!h3&&h3.boxes.length===1&&/Form SR-1 has no Spanish version yet: write the behavior in Spanish/.test(h3.flag),h3);
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
