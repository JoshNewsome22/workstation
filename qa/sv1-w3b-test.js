/* Form SV-1, review Wave 3 part 2: the Goals pre round at plan sign-off (F223), the conditions per respondent and the options
   text (I115), the respondent page in Spanish (I111), the student's response strip (I112), the open answers coded (I114),
   the published scales named (I113). Simulated data only. usage: node qa/sv1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');const {execFileSync}=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const SV='SV-1_Social-Validity_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html';
const OUT=__dirname+'/out/sv1-w3b';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(SV);
  /* F223 */
  const g=await p.evaluate(()=>({btn:$('#gRound button[data-r="pre"]').textContent,instr:document.querySelector('.only-goals .instr').textContent,guide:document.querySelector('.only-guide').textContent,ph:$('[data-m="pre_when"]').placeholder}));
  ok('1 F223 the Goals pre round is taken at plan sign-off, with Procedures: G2 to G4 ask about what only the plan sets; the open item, G1 and G5 may come earlier',
    /Pre — at plan sign-off/.test(g.btn)&&/pre at plan sign-off, with the Procedures pre round/.test(g.instr)&&/would be answered about a plan that does not exist yet/.test(g.instr)&&/Pre, GoalsAt plan sign-off/.test(g.guide.replace(/\s+/g,' ').replace(/Goals At/,'GoalsAt'))&&/Goals and Procedures at plan sign-off/.test(g.ph),g);
  /* I113 */
  ok('2 I113 the Guide names the published school scales (IRP-15, TARF-R, CIRP) with their sources, used beside the form and from the published source',
    /Intervention Rating Profile-15 for teachers \(IRP-15; Martens, Witt, Elliott, & Darveaux, 1985\)/.test(g.guide)&&/TARF-R; Reimers & Wacker, 1988/.test(g.guide)&&/CIRP; Witt & Elliott, 1985/.test(g.guide)&&
    await p.evaluate(()=>/Acceptability of classroom management strategies/.test($('#svRefs').textContent)&&/Professional Psychology: Research and Practice, 16/.test($('#svRefs').textContent)),g.guide.slice(0,300));
  /* I115 */
  const c=await p.evaluate(async()=>{await loadSim();const before=condCount('post'),a=respCond('post',2);
    const sel=document.querySelector('[data-rcnd="post:open:2"]');sel.value='No';sel.dispatchEvent(new Event('change',{bubbles:true}));
    const sel2=document.querySelector('[data-rcnd="post:coer:2"]');sel2.value='No';sel2.dispatchEvent(new Event('change',{bubbles:true}));
    const after=condCount('post'),note=$('#condNote').textContent,rows=$$('#condRespTbl tbody tr').length;
    S.resp[1].anon='No';renderAll();const anonCell=[...$$('#condRespTbl tbody tr')[1].cells].some(td=>/No \(Respondents table\)/.test(td.textContent));S.resp[1].anon='Yes';renderAll();
    return {before,a,after,note,rows,anonCell,rc:JSON.stringify(S.rcond)};});
  ok('3 I115 a condition per respondent: the caregiver’s interview not asked open-first and under some pressure takes the round to 1 of 4 and is named; a respondent marked not anonymous is not anonymous in every round',
    c.before===3&&c.a===3&&c.after===1&&/post round \(1 of 4\); by respondent: .*Mother \(D\. S\.\).*\(post, 1 of 4\)/.test(c.note)&&c.rows===4&&c.anonCell,c);
  const opt=await p.evaluate(()=>{S.meta.options='The team could also try a token board instead, and the plan can change at any review.';$('#rpRole').value='caregiver';$('#rpRound').value='post';$('#rpLang').value='';return window.__rp.payload().instructions;});
  ok('4 I115 the options, as respondents are told them, head the respondent page',/^Before you answer: The team could also try a token board instead, and the plan can change at any review\. Rate each statement/.test(opt),opt);
  /* I111 */
  const es=await p.evaluate(()=>{$('#rpBtn').click();$('#rpLang').value='es';$('#rpLang').dispatchEvent(new Event('change',{bubbles:true}));$('#rpRole').value='caregiver';$('#rpRound').value='post';$('#rpNick').value='Sam';
    const P=window.__rp.payload(),html=NBH_RESPOND.pageHTML(P),note=!$('#rpLangNote').hidden;$('#rpRole').value='student';const Q=window.__rp.payload();$('#rpDlg').close();
    return {lang:P.lang,title:P.title,head:P.heading,g1:P.items[0].text,n:P.items.length,anch:P.scale.anchors[2],na:P.scale.naLabel,open0:P.open&&P.open[0].label,ins:P.instructions.slice(0,60),html:/<html lang="es"/.test(html),note,stu:Q.open&&Q.open[0].label,stuItem:Q.items[0].text};});
  ok('5 I111 a Spanish respondent page: the form’s statements, open items, scale and labels in Spanish, the page itself in Spanish, and a note to have it read before its first use',
    es.lang==='es'&&es.title==='Validez social, ronda posterior'&&es.head==='Validez social: Metas, Procedimientos y Efectos'&&es.g1==='La conducta que este plan busca reducir es la que más me importa, a mí o a Sam.'&&es.n===18&&
    es.anch==='3 un poco en desacuerdo'&&/^N\/A: no puedo juzgarlo/.test(es.na)&&/^Metas: En sus propias palabras/.test(es.open0)&&/^Antes de responder: /.test(es.ins)&&es.html&&es.note&&
    /^Metas: ¿Qué es lo que más quieres que cambie para ti/.test(es.stu)&&es.stuItem==='Este plan es sobre algo en lo que quiero mejorar.',es);
  /* I114 */
  const cd=await p.evaluate(()=>{setView('eff');const k=key('Eo',2),sel=document.querySelector('select[data-cd="'+k+'"][data-r="post"]');sel.value='unmeasured';sel.dispatchEvent(new Event('change',{bubbles:true}));
    const k2=key('E8c',3),s2=document.querySelector('select[data-cd="'+k2+'"][data-r="post"]');s2.value='side';s2.dispatchEvent(new Event('change',{bubbles:true}));
    const o=window.__nbhFactsOut().sv;return {flags:$('#flagList').textContent,named:o.named,line:o.goals&&o.goals.line,role:$('#eRole_post').textContent};});
  ok('6 I114 an open answer coded "not measured" or "a side effect" is named in the checks, on the team copy, in the goals line for TB-1 and to the case',
    /Named by .*Mother \(D\. S\.\).*\(post round\) and not measured: “The calls from school have stopped/.test(cd.flags)&&/A side effect named by .*Sam.*: “Better: I do not get sent out/.test(cd.flags)&&
    Array.isArray(cd.named)&&cd.named.length===2&&cd.named[0].tag==='unmeasured'&&cd.named[0].role==='Caregiver'&&/Named and not measured: caregiver: “The calls/.test(cd.line)&&/\(the answer names something not measured\)/.test(cd.role),cd);
  const pr=await open(PR);const also=await pr.evaluate(n=>prAlsoText({sv:{named:n}}),cd.named);
  ok('7 I114 PR-1 lists what the consumers named and the plan does not measure, and the side effects',/^Named by the consumers on Form SV-1 and not measured: “The calls from school have stopped.*” \(caregiver, post round\)\./m.test(also)&&/^Side effects named on Form SV-1: “Better: I do not get sent out/m.test(also),also);
  await pr.close();
  const rt=await p.evaluate(async()=>{let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};$('#saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const n=fromFile(JSON.parse(saved));return {code:JSON.stringify(n.code)===JSON.stringify(S.code),rc:JSON.stringify(n.rcond)===JSON.stringify(S.rcond),opt:n.meta.options===S.meta.options};});
  ok('8 save and open: the codes, the conditions by respondent and the options text are kept',rt.code&&rt.rc&&rt.opt,rt);
  /* I112 */
  await p.evaluate(()=>{$('#svStrip').innerHTML=stripHTML();document.documentElement.classList.add('sv-printstrip');});await p.emulateMedia({media:'print'});
  const st=await p.evaluate(()=>({items:$$('#svStrip .st-item').length,faces:$$('#svStrip .st-faces').length,face1:$$('#svStrip .st-faces')[0].querySelectorAll('.st-face svg').length,idk:$$('#svStrip .st-idk').length,
    q:$$('#svStrip .st-q').map(x=>x.textContent),script:/someone the plan is not about/.test($('#svStrip .st-script').textContent),sheet:getComputedStyle(document.querySelector('main.sheet')).display}));
  await p.pdf({path:OUT+'/strip.pdf',format:'Letter',printBackground:true});await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.documentElement.classList.remove('sv-printstrip'));
  const txt=execFileSync('python3',['-c','import sys,pymupdf;d=pymupdf.open(sys.argv[1]);print(d.page_count);print(" ".join(p.get_text() for p in d))',OUT+'/strip.pdf']).toString();const np=+txt.split('\n')[0];
  ok('9 I112 the student’s response strip: the student’s five items, each with six faces and "I don’t know", the open questions first in each section, a script for the adult; printed on its own',
    st.faces===5&&st.face1===6&&st.idk===5&&st.items===8&&st.q[0]==='What do you most want to be different for you at school this year?'&&st.q[1]==='This plan is about something I want to get better at.'&&st.script&&st.sheet==='none'&&
    np>=1&&np<=3&&/What I think about my plan/.test(txt)&&!/Respondents|Conditions of Administration/.test(txt),{st,np});
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
