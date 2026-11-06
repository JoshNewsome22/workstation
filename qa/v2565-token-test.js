/* v25.65 the token review (TOKEN H2-H5, M1-M11, L1-L7) and the skill review's VS-1 part (SKILL H1, H6, M7, L4, L5), as built in
   GC-1, SM-1, TE-1, TK-1 and VS-1: at least one check for each. usage: node qa/v2565-token-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const FORM={GC:'GC-1_Group-Contingencies_v2026-10.html',SM:'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html',TE:'TE-1_Token-Economy-Designer_v2026-09.html',TK:'TK-1_Token-Board-Book_v2026-10.html',VS:'VS-1_Visual-Supports_v2026-10.html'};
(async()=>{const br=await L.chromium.launch();const errs=[];
  const open=async f=>{const p=await br.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(f+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(L.BASE+'/NBH-Workstation/'+FORM[f]);await sleep(800);await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async p=>{await p.evaluate(async()=>{await loadSim();});await sleep(500);};
  const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):'';},s);

  /* ======================= GC-1 ======================= */
  {const p=await open('GC');await sim(p);
    /* M4 scoring accuracy: the observer counted 10 where the Record has 2 -> 20%, about 2 in 10; that day's Met uses 10 */
    const m4=await p.evaluate(()=>{const r=S.log[18],before=rowMet(r);S.agr.push({date:r.date,who:'x',col:'0',val:'10',note:'',match:'',pp:'',pn:''});renderAll();
      const o={before,after:rowMet(r),acc:agrAcc(S.agr[S.agr.length-1]),rules:document.getElementById('logRules').textContent};S.agr.pop();renderAll();return o;});
    ok('GC M4 scoring accuracy on a check day: 20%, "about 2 in 10", coach the scoring (ST-1); that day\'s Met uses the observer\'s count',m4.acc===20&&/Scoring accuracy: 20% on .*about 2 in 10\. The tally under-counts; decisions use the observer.s counts until scoring improves/.test(m4.rules)&&/Form ST-1/.test(m4.rules)&&m4.before===true&&m4.after===false,m4);
    const fh=await txt(p,'.only-fidelity .hint');
    ok('GC M4 the fidelity hint no longer says "cannot be read as a test"; the tally under-counts and the observer\'s counts decide',!/cannot be read as a test/.test(fh)&&/the tally under-counts: decisions then use the observer.s counts until scoring improves/.test(fh),fh.slice(0,400));
    /* M3 peer statements: a baseline check day with 1 negative, a game day with 4 on a day a team lost */
    const m3=await p.evaluate(()=>{const keep=JSON.stringify(S.agr);S.agr.push({date:S.log[1].date,who:'x',col:'0',val:'11',note:'',match:'',pp:'3',pn:'1'});
      const lost=S.log.findIndex((r,i)=>i>3&&rowMet(r)===false);S.agr.push({date:S.log[lost].date,who:'x',col:'0',val:S.log[lost].v[0],note:'',match:'',pp:'1',pn:'4'});renderAll();
      const t=document.getElementById('logRules').textContent,th=[...document.querySelectorAll('#agrTbl thead th')].map(e=>e.textContent).join('|');S.agr=JSON.parse(keep);renderAll();return {t,th};});
    ok('GC M3 peer statements on check days: a negative count above the baseline mean, on a day a team lost, is flagged with the exit rule and the team of one',/Negative peer statements: 4 on .*above the baseline mean of 1, on a day a team lost\. .*exit rule or a team of one/.test(m3.t)&&/Peer statements \+\|Peer statements −/.test(m3.th),m3);
    /* M6 the rule named with each mark; a fidelity step for it */
    const m6=await p.evaluate(()=>({sc:scriptSteps().map(s=>s.d).join(' | '),fid:fidSteps().map(x=>x.s.t)}));
    ok('GC M6 the script names the rule with each mark ("Blue Jays, hands up to talk"), and a fidelity step scores it, after the neutral-voice step',/name the rule in a few words as you mark it \("Blue Jays, hands up to talk"\)/.test(m6.sc)&&/^Each mark or point came with a brief statement of the rule/.test(m6.fid[6])&&/neutral voice/.test(m6.fid[5]),m6.fid.slice(4,8));
    const m6b=await p.evaluate(()=>{const k=JSON.stringify(S);S.meta.dir='high';const s=scriptSteps().map(x=>x.d).join(' | ');S=JSON.parse(k);renderAll();return s;});
    ok('GC M6 the points version: "Blue Jays, a point for hands up to talk"',/a point for hands up to talk/.test(m6b),m6b.slice(0,400));
    /* M7 the fouls game won only under the criterion */
    const m7=await p.evaluate(()=>({dv:document.getElementById('designVerdict').textContent,th:[...document.querySelectorAll('#lTbl thead th')].map(e=>e.textContent).join('|')}));
    ok('GC M7 "no more than the criterion" alone: the Design sheet warns a team over it cannot win, and the Record has a column for the minute it passed',/Once a team is over the criterion it cannot win.*fewest fouls also wins.*split the period into two games/.test(m7.dv)&&/Minute a team passed the criterion/.test(m7.th),m7);
    const m7b=await p.evaluate(()=>{const k=JSON.stringify(S);S.meta.g_win='The team with the fewest fouls wins, and any team at or under the criterion also wins';renderRule();const t=document.getElementById('designVerdict').textContent;S=JSON.parse(k);renderAll();return t;});
    ok('GC M7 with "the fewest fouls also wins", no warning',!/Once a team is over the criterion/.test(m7b),m7b);
    /* M5 the newer comparisons, the spot checks, the class vote */
    const g=await txt(p,'#guide');const m5=await p.evaluate(()=>({spot:!!document.getElementById('spotTbl'),vote:!!document.querySelector('[data-m="vote"]'),cl:!!document.querySelector('gc-text[data-cl="spot"]')}));
    ok('GC M5 the Guide gives the mixed comparisons (Groves & Austin, 2017; Deshais et al., 2019; Jowett Hirst et al., 2016); spot checks of this student, others on the class sheet, and a class vote',/Groves &(amp;)? Austin, 2017/.test(g)&&/Deshais et al\., 2019/.test(g)&&/Jowett Hirst et al\., 2016/.test(g)&&m5.spot&&m5.vote&&m5.cl,m5);
    /* L7 trained students */
    const l7=await p.evaluate(()=>{const o=[...document.querySelectorAll('[data-m="runs"] option')].map(e=>e.textContent);const n0=fidSteps().length;S.meta.runs='Trained students lead the game (the teacher supervises and gives the reward)';renderAll();const st=fidSteps().map(x=>x.s.t);const r={o,n0,n1:st.length,lead:st.some(t=>/student leader scored as written/.test(t))};S.meta.runs='The teacher, with a paraeducator keeping the score';renderAll();return r;});
    ok('GC L7 "Trained students lead the game" in Who runs it; a fidelity step for the student leader opens with it',l7.o.some(t=>/^Trained students lead the game/.test(t))&&l7.lead&&l7.n1===l7.n0+1,l7);
    /* save and open: the new fields come back; a file of before opens with its 22 fidelity answers in place */
    const rt=await p.evaluate(async()=>{S.agr[0].pp='2';S.agr[0].pn='1';S.agr[0].match='4';S.spot.push({date:S.log[10].date,val:'2',team:'3',note:''});S.log[12].om='18';renderAll();
      let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
      const before=JSON.stringify(S);const x=fromFile(JSON.parse(saved));const old=JSON.parse(saved);old.S.fid=old.S.fid.slice(0,22);delete old.S.smp;delete old.S.spot;old.S.agr.forEach(a=>{delete a.pp;delete a.pn;delete a.match;});const y=fromFile(old);
      return {same:before===JSON.stringify(x),n:y.fid.length,f5:y.fid[5].in,f22:y.fid[22].in,spot:Array.isArray(y.spot)&&!y.spot.length};});
    ok('GC saved cases: save and open keeps the new fields; a file of before opens with its answers in place and the two new steps unanswered',rt.same&&rt.n===24&&rt.f5==='Yes'&&rt.f22===''&&rt.spot,rt);
    /* M8 class-wide self-monitoring: a sample that errs toward too much credit decides the day */
    const m8=await p.evaluate(()=>{S=blank();setType('selfmon');S.meta.crit='80';S.meta.dir='high';S.log=[{date:'10/1',ph:'1',crit:'80',v:['90','','',''],rw:'',note:'',om:''}];S.smp=[];renderAll();const a=rowMet(S.log[0]);
      S.smp.push({date:'10/1',n:'10',ot:'6',match:'6',over:'4',under:'0',note:''});renderAll();const b=rowMet(S.log[0]);const rules=document.getElementById('logRules').textContent,how=document.getElementById('lHow').textContent,sc=scriptSteps().map(s=>s.d).join(' ');return {a,b,rules,how,sc};});
    ok('GC M8 self-monitoring: 90% recorded Yes meets 80%, but a sample with 4 too-much-credit errors and 6 of 10 on task decides the day (not met); "praise accurate No\'s"',m8.a===true&&m8.b===false&&/Most errors give too much credit; praise accurate No.s/.test(m8.rules)&&/percent of students who recorded Yes/.test(m8.how)&&/praise an accurate No/.test(m8.sc),m8);
    await p.close();}

  /* ======================= SM-1 ======================= */
  {const p=await open('SM');await sim(p);
    const all=await p.evaluate(()=>document.body.innerHTML);
    ok('SM H3 the CICO card and the Guide report Campbell and Anderson (2011) as found: feedback sessions removed one at a time, without loss of the effect for 3 of 4',!/carried the effect/.test(all)&&!/component that mattered/.test(all)&&(all.match(/removed the teacher-feedback sessions one at a time; for 3 of 4 students all of them, and the point card, were removed without loss of the effect/g)||[]).length>=2);
    const cf=await p.evaluate(()=>{setSys('cico');renderAll();const r=[...document.querySelectorAll('#cfadeTbl tbody tr')].map(t=>t.textContent);setSys('match');renderAll();return r;});
    ok('SM H3 a fading table for the card: one period\'s feedback at a time, then the card, then the meetings thinned',cf.length===3&&/one period.s teacher feedback at a time/.test(cf[0])&&/Remove the point card/.test(cf[1])&&/morning and afternoon meetings, then thin them/.test(cf[2]),cf);
    const h4=await p.evaluate(()=>{const lad=LADDER[4].what+' '+LADDER[4].when+' | '+LADDER[5].when;
      const inf=smInf({m:'16',n:'18',tno:'5',nom:'3'});   /* over 2, under 0: +11.1 */
      const keep=JSON.stringify(S);S.lad.forEach((x,i)=>{x.on=i===4;});S.meta.goal='90';S.meta.cc_cap='90';
      for(let k=0;k<3;k++)S.log.push({date:'11/'+(10+k),ph:'4',goal:'90',pts:'36',poss:'36',beh:'70',m:'',n:'',tno:'',nom:'',sno:'0',asm:'',met:true,tgp:'',bgp:'',note:'',src:''});
      renderAll();const r=document.getElementById('logRules').textContent,th=[...document.querySelectorAll('#lTbl thead th')].map(e=>e.textContent).join('|');S=JSON.parse(keep);renderAll();return {lad,inf,r,th};});
    ok('SM H4 phase 4: the teacher rates privately every day, a surprise match every 2 to 3 school days; phase 5 on the plan\'s own data (DD-1 or PR-1)',/surprise match comes every 2 to 3 school days, on days drawn at random/.test(h4.lad)&&/plan(&rsquo;|’)s own independent data \(Form DD-1 or PR-1\)/.test(h4.lad),h4.lad);
    ok('SM H4 the Self minus teacher figure: 2 Yes the teacher did not see, over 18 ratings, is +11.1; the Record has the column',h4.inf===11.1&&/Self minus teacher/.test(h4.th),{inf:h4.inf,th:h4.th});
    ok('SM H4 the top rating in every period on 3 days of phase 4: move back one phase',/gave the top rating in every period on 3 days in phase 4.*move back one phase \(to phase 3/.test(h4.r),h4.r.slice(0,500));
    const m2=await p.evaluate(()=>{const card=document.querySelector('label[data-sys="match"]').textContent;S.meta.mp_nn='2';renderPoints();const v=document.getElementById('mpVerdict').textContent;S.meta.mp_nn='';renderPoints();const v0=document.getElementById('mpVerdict').textContent;return {card,v,v0};});
    ok('SM M2 "An honest No still earns, but less than the behavior"; both No paying as much as both Yes is flagged',!/Honesty earns as much as the behavior/.test(m2.card)&&/An honest No still earns, but less than the behavior/.test(m2.card)&&/pays accurate rating as much as the behavior/.test(m2.v)&&m2.v0==='',m2);
    const m10=await p.evaluate(()=>{const o=[...document.querySelectorAll('[data-m="home_do"] option')].map(e=>e.textContent);const keep=JSON.stringify(S);S.chk.home=true;
      const R=S.log.filter(r=>r.ph!=='0');R.forEach(r=>{r.ret=true;});R.slice(-3).forEach(r=>{r.ret=false;});renderAll();const t=document.getElementById('logRules').textContent,box=document.querySelectorAll('#lTbl input[data-f="ret"]').length;S=JSON.parse(keep);renderAll();return {o,t,box,n:S.log.length};});
    ok('SM M10 what the family does on a goal day; a Card back tick on each row; the card back on 2 of 5 days: agree a home privilege, never remove what the child has',m10.o.includes('A home privilege the family already controls, earned on a goal day')&&m10.box===m10.n&&/card came back on 2 of the last 5 school days: agree a home privilege with the family.*never removes something the child already has/.test(m10.t),m10);
    const g=await txt(p,'.only-guide');
    ok('SM L3 overjustification softened: in JABA tests token rewards did not lower later interest; keep the reward modest',/In JABA tests, token rewards did not lower later interest in the task/.test(g)&&/Keep the reward modest/.test(g)&&!/The one consistent finding in the overjustification literature/.test(g));
    ok('SM L4 points are never removed, on its real basis: point loss is a punishment step that needs approval on Form TE-1',/point loss is a punishment step that needs approval on Form TE-1\. In classroom studies, loss worked about as well as earning/.test(g)&&!/students stop rating honestly and start arguing/.test(g));
    const l5=await p.evaluate(()=>{document.getElementById('addGen').click();const n=document.querySelectorAll('#genTbl tbody tr input[data-f="set"]').length,th=[...document.querySelectorAll('#genTbl thead th')].map(e=>e.textContent).join('|');S.gen=[];renderAll();return {n,th};});
    ok('SM L5 Carry to other settings is a table: the setting, the date the student was told, who prompts, a probe with no adult present',l5.n===1&&/Date the student was told to use the sheet there\|Who prompts it\|Probe with no adult present: at goal\?/.test(l5.th),l5);
    const l6=await p.evaluate(()=>({d:[...document.querySelectorAll('[data-m="rec_dev"] option')].map(e=>e.textContent),v:[...document.querySelectorAll('[data-m="rec_vis"] option')].map(e=>e.textContent)}));
    ok('SM L6 how the student records (card, wrist counter, iPad, pocket card) and whether classmates can see it (ask the student)',l6.d.includes('A wrist or hand counter')&&l6.d.includes('A pocket card')&&l6.v.includes('Not asked yet'),l6);
    await p.close();}

  /* ======================= TE-1 ======================= */
  {const p=await open('TE');await sim(p);
    const h5=await p.evaluate(()=>{const o={};const run=(a,b,c)=>{S.meta.tt_a=a;S.meta.tt_b=b;S.meta.tt_c=c;renderAll();return {out:ttOut(),v:document.getElementById('ttVerdict').textContent,aud:!!S.aud[1],lock:document.querySelector('#auditWrap [data-a="1"]').disabled};};
      o.none=run('','','');o.works=run('12','4','13');o.weak=run('12','4','20');o.not=run('5','4.5','10');S.meta.tt_a=S.meta.tt_b=S.meta.tt_c='';S.aud[1]=false;renderAll();return o;});
    ok('TE H5 a token check: A above B is "token works"; A above B but below C "weaker than the backup"; A not above B "not yet a reinforcer"',h5.works.out==='works'&&h5.weak.out==='weak'&&/use the backup directly for new or hard skills/i.test(h5.weak.v)&&h5.not.out==='not'&&/Go back to the establishing plan/.test(h5.not.v),h5);
    /* the BCBA, 11/6: with the sessions entered, A must also be above B in every pair; otherwise "unclear: run more sessions" */
    const h5p=await p.evaluate(()=>{const run=(as,bs,meth)=>{S.meta.tt_a=S.meta.tt_b=S.meta.tt_c='';S.meta.tt_as=as;S.meta.tt_bs=bs;S.meta.tt_meth=meth||'Responses per minute, alternating sessions';renderAll();return {out:ttOut(),v:document.getElementById('ttVerdict').textContent,aud:!!S.aud[1]};};
      const o={all:run('11, 13, 12, 14','5, 4, 6, 3'),onemiss:run('20, 18, 4, 22','5, 4, 6, 3'),close:run('5, 5.2, 5.1','4.8, 5, 4.9'),bp:run('20, 18, 4, 22','5, 4, 6, 3','Break point, progressive ratio')};
      S.meta.tt_as=S.meta.tt_bs='';S.meta.tt_meth='';S.aud[1]=false;renderAll();return o;});
    ok('TE 11/6 the every-pair rule: above in every pair and on average works; clearly above on average but not in one pair is unclear (audit point open); above in every pair but under a fifth on average is unclear; a break-point check reads the means only',
      h5p.all.out==='works'&&h5p.all.aud&&/A was above B in 4 of 4 pairs/.test(h5p.all.v)&&h5p.onemiss.out==='unclear'&&!h5p.onemiss.aud&&/Unclear: run more sessions/.test(h5p.onemiss.v)&&h5p.close.out==='unclear'&&h5p.bp.out==='works',h5p);
    ok('TE H5 the audit\'s must-hold point is ticked only from the outcome (locked; not ticked by hand on a sheet with no check)',h5.works.aud&&h5.works.lock&&h5.weak.aud&&!h5.not.aud&&h5.not.lock&&h5.none.lock&&!h5.none.aud,h5);
    const m1=await p.evaluate(()=>{S.meta.exHow='Accumulated: all the earned time at once, at the exchange';S.meta.tokWorthN='1';S.meta.tokWorthU='minutes of tablet';renderAll();const n=document.getElementById('exHowNote').textContent;document.getElementById('addChx').click();const r=document.querySelectorAll('#chxTbl tbody select').length;const hint=document.querySelector('#thinTbl').closest('section').textContent;S.chx=[];S.meta.exHow='';renderAll();return {n,r,hint:/raise the amount per exchange too, so the unit price holds/.test(hint)};});
    ok('TE M1 how the backup is given, each token\'s worth (5 tokens x 1 = 5 minutes at once), the student\'s choice days, and the unit-price caution',/5 minutes of tablet at once \(5 tokens × 1\)/.test(m1.n)&&m1.r===1&&m1.hint,m1);
    const m9=await p.evaluate(()=>{S.meta.loss='Yes — described below';renderAll();const se=[...document.querySelectorAll('#lossSE [data-se]')].map(e=>e.parentNode.textContent.trim());const c=document.querySelector('#lossSE [data-se="avoid"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
      const v=[...document.querySelectorAll('[data-m="lossView"] option')].map(e=>e.textContent);const t=document.getElementById('lossTbl').textContent;const r={se,list:S.meta.lossSE,v,eq:/earning and losing were about equally effective/.test(t)};S.meta.loss='No';S.meta.lossSE='';renderAll();return r;});
    ok('TE M9 token loss: side effects watched (ticks kept), the student\'s view, and "earning and losing were about equally effective" beside what was tried',m9.se.length===5&&m9.list==='avoid'&&m9.v.includes('After earning only, the student prefers earning only')&&m9.eq,m9);
    const l1=await p.evaluate(()=>({a2:AUDIT[2],a4:AUDIT[4][2],d:[...document.querySelectorAll('[data-m="exDelayTest"] option')].map(e=>e.textContent),econ:document.querySelector('[data-m="econ"]').closest('td').textContent}));
    ok('TE L1 delivery is a research point (Leon et al., 2016), same-day exchange cites Reed & Martens (2011), the closed economy Roane et al. (2005), and a one-week delay test',l1.a2[1]==='research'&&/Leon et al\., 2016/.test(l1.a2[2])&&/Reed & Martens, 2011/.test(l1.a4)&&/Roane et al\., 2005/.test(l1.econ)&&l1.d.some(x=>/one week: kept only if the rate holds/.test(x)),l1);
    const g=await txt(p,'.only-guide');
    ok('TE L2 the Guide: after the token system ends (Kazdin, 1982), with the relapse plan on Form RM-1',/After the Token System Ends/.test(g)&&/Kazdin \(1982\)/.test(g)&&/Form RM-1/.test(g));
    const h2=await p.evaluate(()=>{const k=JSON.stringify(S);Object.assign(S.meta,{loss:'Yes — described below',lossRule:'one token for a hit',lossBeh:'hitting',lossN:'1',lossFloor:'0',lossTried:'DRA 3 weeks',lossCons:'10/1/26',lossRev:'10/3/26 J.E.',lossMeas:'DD-1',lossStop:'no decrease by 11/1'});renderAll();const o=window.__nbhFactsOut();S=JSON.parse(k);renderAll();return o&&o.token&&o.token.loss;});
    ok('TE H2 (its part) the case carries token loss with its floor, consent and review, which Form TK-1 checks',h2&&h2.on&&h2.floor==='0'&&h2.consent==='10/1/26'&&/10\/3\/26/.test(h2.review),h2);
    await p.close();}

  /* ======================= TK-1 ======================= */
  {const p=await open('TK');await sim(p);await sleep(800);
    const backs=()=>p.evaluate(()=>{setView('preview');return [...document.querySelectorAll('#book .pg')].map(g=>(g.dataset.label||'')+': '+g.textContent.replace(/\s+/g,' '));});
    const h2=await p.evaluate(async()=>{const o={opt:[...document.querySelectorAll('[data-m="rcost"] option')].map(e=>e.textContent)};const was=window.nbhCase;
      S.meta.rcost='on';S.meta.rc_rule='one star comes off for a hit';S.meta.rc_te1='';renderAll();o.v0=document.getElementById('setupVerdict').textContent;
      S.meta.rc_te1='10/3/26';renderAll();o.v1=document.getElementById('setupVerdict').textContent;setView('preview');o.bd=[...document.querySelectorAll('#book .pg')].filter(g=>/back: Token Board/.test(g.dataset.label||'')).map(g=>g.textContent).join(' ').replace(/\s+/g,' ');
      window.nbhCase=Object.assign({},was||{},{facts:{token:{loss:{on:true,rule:'x',floor:'0',consent:'',review:''}}}});renderAll();o.v2=document.getElementById('setupVerdict').textContent;
      window.nbhCase=was;S.meta.rcost='';S.meta.rc_rule='';S.meta.rc_te1='';renderAll();return o;});
    ok('TK H2 the option reads "Response cost (a punishment step; approved on Form TE-1)"; "Never" stays the default',h2.opt[0].startsWith('Never')&&h2.opt.includes('Response cost (a punishment step; approved on Form TE-1)'),h2.opt);
    ok('TK H2 Setup is still open without a TE-1 approval date; with one, the Board back prints "Response cost is a punishment procedure, approved 10/3/26; an earned exchange is never lost"',/Still open:.*the Form TE-1 approval date/.test(h2.v0)&&!/Form TE-1 approval date/.test(h2.v1)&&/Response cost is a punishment procedure, approved 10\/3\/26; an earned exchange is never lost\. Response cost, as the BCBA set it: one star comes off for a hit\./.test(h2.bd),h2);
    ok('TK H2 with Form TE-1 in the case recording token loss without consent and review dates, Setup stays open',/Form TE-1 records token loss without the parent.s consent date, a review date/.test(h2.v2),h2.v2);
    const bus=await p.evaluate(()=>{const was=window.nbhCase,k=JSON.stringify(S);S.meta.kind='bus';window.nbhCase=Object.assign({},was||{},{facts:{token:{loss:{on:true,rule:'One star off',floor:'0',consent:'10/1/26',review:'10/3/26'}}}});S.meta.loss_rule='One star off';renderAll();
      const d=document.createElement('div');d.innerHTML=busPlanPage();const t=d.textContent.replace(/\s+/g,' ');window.nbhCase=was;S=JSON.parse(k);renderAll();return t;});
    ok('TK H2 the bus ride plan, printing Form TE-1\'s token-loss rule, labels it: a punishment procedure, approved on the date TE-1 records; an earned exchange is never lost',/token loss follows the plan \(Form TE-1\): One star off\. .*Response cost is a punishment procedure, approved 10\/3\/26; an earned exchange is never lost\./.test(bus),bus.slice(0,600));
    const h5=await p.evaluate(()=>({te:TXT0.te,guide:document.querySelector('.only-guide')?document.querySelector('.only-guide').textContent:document.body.textContent}));
    ok('TK H5 the Token Economy back: the behavior goes up with the tokens and stays lower when they buy nothing (Form TE-1\'s token check); "reaching for the token" is not the test',/goes up\. It goes up with the tokens, and stays lower when the tokens buy nothing \(Form TE-1’s token check\)\./.test(h5.te)&&!/keep at it until the student reaches for the token/.test(h5.guide)&&/reaching for the token is not evidence of its value/.test(h5.guide));
    let b=await backs();const te0=b.filter(x=>/Token Economy/.test(x)).join(' ');
    const m11=await p.evaluate(()=>{const o=[...document.querySelectorAll('[data-m="ch_when"] option')].map(e=>e.textContent);S.meta.ch_when='full';renderAll();setView('preview');const t=[...document.querySelectorAll('#book .pg')].filter(g=>/Token Economy/.test(g.dataset.label||'')).map(g=>g.textContent).join(' ').replace(/\s+/g,' ');S.meta.ch_when='';renderAll();return {o,t,contd:document.querySelectorAll('#book .pg.contd').length};});
    ok('TK M11 When the learner chooses: before the work (the back says the tokens buy the item chosen first; choose again at the exchange) or at the exchange; the back still fits its page',m11.o.length===2&&/Here the tokens buy the item chosen first; to keep their value when that item loses its pull, let the learner choose again at the exchange\./.test(te0)&&/Here the learner chooses from the Choices page when the board is full/.test(m11.t)&&m11.contd===0,{m11,te0:te0.slice(0,500)});
    const old=await p.evaluate(()=>{S.txt.te=TXT_PREV2.ft.te;ensure();return S.txt.te===txtDef('te');});
    ok('TK saved books: a Token Economy back still holding the default text of before takes the new one',old);
    await p.close();}

  /* ======================= VS-1 ======================= */
  {const p=await open('VS');
    const v=await p.evaluate(()=>{S=blank();S.chk.s_ft=true;S.chk.s_sched=true;renderAll();setView('strips');const t=document.getElementById('stripsOut').textContent.replace(/\s+/g,' ');return {t,n:(t.match(/How to teach it \(for the adults\)/g)||[]).length};});
    ok('VS H1 + M7 a new form prints How to teach it at the foot of the first-then and schedule pages: guidance only while the student allows it; holding a body part is restraint',v.n===2&&/Guide only while the student allows it: if the student pulls away, stiffens or pushes your hand, let go, wait, and offer a lighter prompt or a short break\. Holding a hand, an arm or any body part to stop a response, or as a consequence, is restraint and is not a prompt\./.test(v.t)&&/Fade the adult, not the schedule/.test(v.t),v.n);
    const sv=await p.evaluate(async()=>{await loadSim();await new Promise(r=>setTimeout(r,300));setView('strips');return {teach:/How to teach it/.test(document.getElementById('stripsOut').textContent),old:fromFile({form:'VS-1',rev:'2026-10',S:{meta:{},chk:{s_ft:true}}}).chk.s_teach};});
    ok('VS M7 a file saved before (and the simulation) prints as before, with no box until it is ticked',!sv.teach&&!sv.old,sv);
    const g=await txt(p,'.only-guide');
    ok('VS H6 the Guide: a schedule alone does not fix transitions (Waters et al., 2009; Castillo et al., 2018; Jessel et al., 2016; Tustin, 1995)',/A schedule alone does not fix transitions/.test(g)&&/visual schedules alone were ineffective when going from a preferred to a non-preferred activity/.test(g)&&/Castillo et al\., 2018/.test(g)&&/Tustin, 1995/.test(g)&&!/Transitions go better with a visual/.test(g));
    ok('VS H1 the Guide: guidance only while the student allows it; guided compliance is escape extinction, marked and never the default',/Guidance only while the student allows it/.test(g)&&/guided compliance, which is escape extinction, not a teaching prompt/.test(g)&&/Green et al\., 2005/.test(g));
    ok('VS M7 the Guide: the schedule is the prompt that stays; fade the adult, not the schedule (Brodhead et al., 2014, 2018)',/The schedule is the prompt that stays: fade the adult, not the schedule\./.test(g)&&/Brodhead et al\., 2014, 2018/.test(g));
    const h6=await p.evaluate(()=>{S=blank();S.chk.s_sched=true;S.sched[1].kind='work';S.sched[2].kind='work';S.sched[3].kind='work';S.sched[4].kind='pref';renderAll();const a=document.getElementById('scFlag');const r={a:a.hidden?'':a.textContent};S.sched[3].kind='';S.sched[4].kind='';renderAll();r.b=a.hidden?'':a.textContent;S.sched[3].kind='pref';renderAll();r.c=a.hidden?'':a.textContent;
      r.hint=document.querySelector('#scTbl').closest('section').textContent.replace(/\s+/g,' ');return r;});
    ok('VS H6 the schedule editor marks steps Work or Preferred and flags work steps in a row with no preferred step after them',h6.a===''&&/Steps 2 and 3 are work steps in a row with no preferred step after them/.test(h6.b)&&h6.c===''&&/it does not by itself reduce problem behavior at transitions/.test(h6.hint),h6);
    const m7=await p.evaluate(async()=>{S=blank();S.chk.s_sched=true;renderAll();document.getElementById('scSA1').click();await new Promise(r=>setTimeout(r,200));const t=document.getElementById('scTA').textContent;const f=window.__nbhFactsOut();const it=f.visuals.items.find(x=>x.what==='Visual schedule');return {t,ta:it&&it.ta};});
    ok('VS M7 Start an SA-1 program for this schedule: the task analysis (go to the schedule ... go to the next one), total task, shown and carried to the case',/total task/.test(m7.t)&&m7.ta&&m7.ta.chaining==='Total task'&&m7.ta.steps[0]==='Go to the schedule'&&m7.ta.steps[6]==='Go to the next one',m7);
    const l4=await p.evaluate(()=>{const c=[...document.querySelectorAll('[data-m="c_label"] option')].map(e=>e.value);S=blank();S.chk={s_sched:true};S.meta.sc_label='words';renderAll();const out=document.getElementById('stripsOut');const cells=out.querySelectorAll('.cell2').length,pics=out.querySelectorAll('.cell2 svg,.cell2 img').length;return {c,cells,pics};});
    ok('VS L4 a Words only step on the cards and the schedule: the schedule prints its words with no pictures',l4.c.includes('words')&&l4.cells>0&&l4.pics===0,l4);
    const l5=await p.evaluate(async()=>{S=blank();S.chk={s_sched:true};S.sched[0].kind='together';renderAll();const n0=document.querySelectorAll('#stripsOut .page').length;S.meta.sc_joint='yes';renderAll();const out=document.getElementById('stripsOut').textContent;const n1=document.querySelectorAll('#stripsOut .page').length;
      let saved=null,name='';const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};const ca=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){name=this.download;};document.getElementById('scWatch').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ca;
      return {n0,n1,partner:/My Partner’s Schedule/.test(out),tog:/· together/.test(out),name,watch:!!saved&&/<button id="b"/.test(saved)&&/Arrival/.test(saved)};});
    ok('VS L5 a joint schedule prints a partner\'s strip with the Together steps marked; Save for a tablet or watch makes a one-step-at-a-time page',l5.n1>l5.n0&&l5.partner&&l5.tog&&/^VS-1_schedule_/.test(l5.name)&&l5.watch,l5);
    await p.close();}

  ok('no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
