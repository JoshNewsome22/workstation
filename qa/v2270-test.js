/* v22.70 Form VI-1, review Wave 3 part 3b: the Contingency view fills from Form ABC-1's counts (I84); setting events are
   tested by the days with and without them (I81); a summary for the family and the team, in English or Spanish, is written
   from the record (I83). Simulated data only. usage: node qa/v2270-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  /* ABC-1's worked example, and what it sends */
  const a=await open('ABC_Recording_Conditional_Probability_Analysis.html');
  await a.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(2500);
  const out=await a.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();return o&&o.evidence;});
  const c=out&&out.cont;
  ok('1 I84 ABC-1 sends the counts behind its probabilities: incidents, samples, and the four figures for each consequence class and antecedent',
    !!c&&c.N===out.n&&c.M>0&&c.cons.length===3&&c.cons.every(r=>r.a>=0&&r.c>=0&&r.a<=c.N&&r.c<=c.M&&r.label)&&c.ant.length>0&&c.ant.every(r=>r.a>0&&r.a<=c.N&&r.c<=c.M),c);
  await a.close();
  const p=await open('Variable_Isolation_Protocol.html');
  await p.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'ABC-1':out}});await sleep(300);
  const tab=()=>p.evaluate(()=>({kind:document.getElementById('cKind').value,method:document.querySelector('[name="c_method"]').value,
    con:[...document.querySelectorAll('#conTbl tbody tr')].map(tr=>[...tr.querySelectorAll('input')].map(x=>x.value).join(' | ')+' => '+[...tr.querySelectorAll('.o1,.o2,.o3')].map(x=>x.textContent).join(' ')),
    ant:[...document.querySelectorAll('#antTbl tbody tr')].map(tr=>[...tr.querySelectorAll('input')].map(x=>x.value).join(' | ')+' => '+tr.querySelector('.o4').textContent.replace(/\s+/g,' '))}));
  const t1=await tab();
  const top=c.cons.filter(r=>r.a>0||r.c>0).sort((x,y)=>y.a-x.a)[0],a0=c.ant[0];
  ok('2 I84 the consequence side takes each class: its label (Form ABC-1), the incidents and how many it followed, the samples and how many it was in',
    t1.con[0].startsWith(top.label+' (Form ABC-1) | '+c.N+' | '+top.a+' | '+c.M+' | '+top.c+' => ')&&/=> \d\.\d\d \d\.\d\d [+−-]?\d\.\d\d$/.test(t1.con[0]),{t1:t1.con,top});
  ok('3 I84 the antecedent side takes ABC-1\'s antecedents (with A: incidents and samples with it; without A: the rest), counted as incidents plus samples',
    t1.kind==='abc'&&t1.ant[0].startsWith(a0.label+' (Form ABC-1) | '+(a0.a+a0.c)+' | '+a0.a+' | '+((c.N-a0.a)+(c.M-a0.c))+' | '+(c.N-a0.a)+' => ')&&/Yule’s Q|\((strong|moderate|weak|negligible)\)/.test(t1.ant[0])&&t1.method==='Form ABC-1: '+c.N+' incidents, '+c.M+' background samples',t1);
  /* counts typed here are kept */
  await p.evaluate(()=>{const f=document.querySelectorAll('#conTbl tbody tr')[3].querySelectorAll('input');f[0].value='Peer laughter (typed, simulated)';f[1].value='40';});
  const more=JSON.parse(JSON.stringify(out));more.cont.cons[0].a+=1;
  await p.evaluate(f=>window.__nbhFactsIn(f),{evidence:{'ABC-1':more}});await sleep(200);
  const t2=await tab();
  ok('4 I84 a table with counts typed here is left as it is; one ABC-1 wrote follows ABC-1',t2.con.join('\n')===t1.con.slice(0,3).join('\n')+'\n'+'Peer laughter (typed, simulated) | 40 |  |  |  => '+t2.con[3].split(' => ')[1]&&t2.ant[0]===t1.ant[0],{t1:t1.con,t2:t2.con});
  await p.close();
  /* I81 */
  const q=await open('Variable_Isolation_Protocol.html');
  await q.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const se=()=>q.evaluate(()=>[...document.querySelectorAll('#seTbl tbody tr')].map(tr=>[...tr.querySelectorAll('input')].map(x=>x.value).join(' | ')+' => '+tr.querySelector('.se1').textContent+' '+tr.querySelector('.se2').textContent));
  const s1=await se();
  ok('5 I81 the worked example: poor sleep supports (6.3 against 3.4 a day, ratio 1.85); the substitute adult has too few days',
    s1[0]==='Poor sleep | 6 | 6.3 | 16 | 3.4 => 1.85 Supports: more behavior on the days with it'&&s1[1]==='Substitute adult | 3 | 4 | 19 | 4.1 => 0.98 Too few days to read (5 or more on each side)',s1);
  const setRow=(i,v)=>q.evaluate(([i,v])=>{const f=document.querySelectorAll('#seTbl tbody tr')[i].querySelectorAll('input');v.forEach((x,j)=>{f[j].value=x;});f[0].dispatchEvent(new Event('input',{bubbles:true}));},[i,v]);
  await setRow(2,['Missed breakfast','5','2','8','2.4']);await setRow(3,['Noise / assembly','5','1','9','3']);
  const s2=await se();
  ok('6 I81 no clear difference between two thirds and 1.5; two thirds or less reads as less behavior on those days',/=> 0\.83 No clear difference$/.test(s2[2])&&/=> 0\.33 Less behavior on the days with it$/.test(s2[3]),s2);
  ok('7 I81 the setting events in the register are offered by name',(await q.evaluate(()=>[...document.querySelectorAll('#seList option')].map(o=>o.value).join(',')))==='Poor sleep,Substitute adult,Noise / assembly,Missed breakfast');
  const body=await q.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('8 I81 the rule says where a setting event is tested, and the reading is labeled a convention',/test it in Concomitant variation, by the days with it and the days without it/.test(body)&&/The reading is this form’s convention, not an empirical cut-off/.test(body));
  /* I83 */
  await q.evaluate(()=>document.getElementById('btnSum').click());await sleep(300);
  const en=await q.evaluate(()=>document.getElementById('sumText').value);
  ok('9 I83 the English summary: the function chosen, the confidence, when it happens, what makes days harder, the next step, the caveat',
    /^Summary of the behavior assessment \(/.test(en)&&/What we found: The behavior seems to help Sample get out of, or put off, work and other demands\. We are fairly confident in this explanation\./.test(en)&&
    /When it happens most: Independent demand\./.test(en)&&/What makes some days harder: Poor sleep \(about 1\.9 times as much behavior on those days\)\./.test(en)&&
    /What comes next: We will start a support plan built on this explanation and check that it works, without stopping the plan to test it\./.test(en)&&/not from testing/.test(en)&&/Questions: Jordan Ellis, M\.A\., BCBA \(simulated\)\./.test(en),en);
  await q.evaluate(()=>{const s=document.getElementById('sumLang');s.value='es';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const es=await q.evaluate(()=>document.getElementById('sumText').value);
  ok('10 I83 Spanish: an unedited summary is rewritten when the language changes',/^Resumen de la evaluación de la conducta \(/.test(es)&&/Lo que encontramos: La conducta parece ayudar a Sample a evitar o retrasar el trabajo y otras exigencias\. Tenemos bastante confianza en esta explicación\./.test(es)&&
    /Lo que hace más difíciles algunos días: Poor sleep \(alrededor de 1,9 veces más conducta esos días\)\./.test(es)&&/Lo que sigue: Empezaremos un plan de apoyo/.test(es)&&/Hay intérprete disponible/.test(es),es);
  await q.evaluate(()=>{const t=document.getElementById('sumText');t.value=t.value+'\nEdited by the BCBA (simulated).';t.dispatchEvent(new Event('input',{bubbles:true}));});
  let asked=0;await q.evaluate(()=>{window.__asked=0;nbhUI.confirm=async()=>{window.__asked++;return false;};});
  await q.evaluate(()=>{const s=document.getElementById('sumLang');s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));});await q.evaluate(()=>document.getElementById('btnSum').click());await sleep(300);
  asked=await q.evaluate(()=>window.__asked);const kept=await q.evaluate(()=>document.getElementById('sumText').value);
  ok('11 I83 an edited summary is not replaced by a language change, and writing again asks first (declined: kept)',asked===1&&/Edited by the BCBA \(simulated\)\.$/.test(kept)&&/^Resumen/.test(kept),{asked,kept:kept.slice(-60)});
  await q.evaluate(()=>{const r=document.querySelector('input[name="decision"][value="4"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});
  const d4=await q.evaluate(()=>window.viSummary('es'));
  ok('12 I83 a step that arranges conditions says it needs the family\'s permission',/Lo que sigue: Con su permiso, haremos un análisis funcional/.test(d4)&&/With your permission/.test(await q.evaluate(()=>window.viSummary(''))));
  /* saved and opened */
  const dlP=q.waitForEvent('download',{timeout:15000});await q.evaluate(()=>document.getElementById('btnSave').click());const d=JSON.parse(fs.readFileSync(await (await dlP).path(),'utf8'));
  ok('13 the new fields are saved apart (x): the setting-event rows, the language, the summary',d.x&&d.x.se1_l==='Poor sleep'&&d.x.se3_l==='Missed breakfast'&&/Edited by the BCBA/.test(d.x.sum_text)&&d.x.sum_lang==='',d.x);
  const old=JSON.parse(JSON.stringify(d));Object.keys(old.x).filter(k=>/^(se\d|sum_)/.test(k)).forEach(k=>delete old.x[k]);
  await q.setInputFiles('#fileIn',{name:'VI1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await sleep(900);
  const o=await q.evaluate(()=>({se:document.querySelector('#seTbl tbody tr input').value,sum:document.getElementById('sumText').value,lang:document.getElementById('sumLang').value,st:document.querySelector('[name="h_statement"]').value}));
  ok('14 a file without them opens as before, the new fields empty and English',o.se===''&&o.sum===''&&o.lang===''&&/^When an independent/.test(o.st)||(o.se===''&&o.sum===''&&o.lang===''&&o.st.length>20),o);
  await q.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('15 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
