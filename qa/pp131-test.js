/* v24.31 the print policy for the set (the 10/25 review: R-031, E-01; R-029, R-030, R-037, R-042, R-057, R-067, R-075,
   R-079, R-098, R-102): every reviewed form printed whole with its simulation. The record first; the Guide and References
   behind a shared choice and after the record; a sheet's closing lines with their block; blank logs out; OB-1's conditions
   flow; SP-1's essay once; SM-1's browser Print prints the tab. usage: node qa/pp131-test.js (WS_URL as in qa/lib.js;
   python3 with pymupdf) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const PY=`import sys,json,pymupdf
d=pymupdf.open(sys.argv[1]);o=[]
for i,pg in enumerate(d):
    px=pg.get_pixmap(dpi=36,colorspace=pymupdf.csGRAY);s=px.samples;w,h=px.width,px.height;top=int(h*.06);bot=int(h*.94);rows=0
    for r in range(top,bot):
        if any(v<200 for v in s[r*w:(r+1)*w]):rows+=1
    o.append({'n':i+1,'ink':round(100*rows/(bot-top)),'text':' '.join(pg.get_text().split())})
print(json.dumps(o))`;
const py=path.join(OUT,'pp131-ink.py');fs.writeFileSync(py,PY);
const pdfPages=(buf,name)=>{const f=path.join(OUT,name);fs.writeFileSync(f,buf);return JSON.parse(execFileSync('python3',['-I',py,f],{maxBuffer:64e6}).toString());};
const brief=P=>P.map(x=>x.n+':'+x.ink+'%').join(' ');
const FORMS={'TB-1':'TB-1_Target-Behavior-Development_v2026-09.html','IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','PA-1':'PA-1_Preference-Assessment-Protocol_v2026-09.html',
 'RA-1':'Reinforcer_Assessment_Protocol.html','EA-1':'EA-1_Experimental-Analysis-Protocol_v2026-09.html','DA-1':'DA-1_Demand-Assessment_v2026-10.html','DD-1':'Daily_Behavior_Data_and_Visual_Analysis.html',
 'SM-1':'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','SP-1':'Scatterplot_Pattern_Analysis.html','ABC-1':'ABC_Recording_Conditional_Probability_Analysis.html','OB-1':'OB-1_Direct-Observation-Record_v2026-09.html',
 'TD-1':'TD-1_Function-Based-Treatment-Developer_v2026-09.html','TK-1':'TK-1_Token-Board-Book_v2026-10.html','RS-1':'RS-1_RBT-Supervision-Log_v2026-10.html'};
/* the whole-form printouts before v24.31 (the 10/26 survey, each simulation loaded); TD-1 is given 46: its monitor's verdict and criterion note now take a page of their own rather than splitting */
const BEFORE={'TB-1':22,'IA-1':33,'PA-1':29,'RA-1':16,'EA-1':22,'DA-1':18,'DD-1':16,'SM-1':30,'SP-1':14,'ABC-1':17,'OB-1':13,'TD-1':46,'TK-1':13,'RS-1':3};
const GUIDE_SHEETS=['TB-1','IA-1','PA-1','RA-1','EA-1','OB-1'],GUIDE_SECTIONS=['SM-1','DA-1'];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950}});
 const open=async(F)=>{const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.goto(BASE+'/NBH-Workstation/'+FORMS[F]);await sleep(1500);
  const sim=await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;window.confirm=()=>true;const bs=[...document.querySelectorAll('button')];
   let b=document.getElementById('simBtn')||bs.find(x=>/load (the )?simulat|simulated (case|record|data|example|month)|load (a )?(worked )?example|simulation/i.test(x.textContent)&&!/clear|remove/i.test(x.textContent));
   if(!b)return null;const sel=document.getElementById('simScenario');if(sel&&sel.options.length)sel.value=sel.options[0].value;b.click();return b.id||b.textContent.trim();});
  await sleep(2500);return {p,errs,sim};};
 const PDF=async p=>{await p.emulateMedia({media:'print'});const buf=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});await sleep(150);return buf;};
 const setOpt=(p,which,on)=>p.evaluate(([w,o])=>{if(!window.nbhPrint||!window.nbhPrint.set)return false;window.nbhPrint.set(w,o);return true;},[which,on]);   /* the choices live in the workstation's Packet options; forms read them from the device */
 const guideText=p=>p.evaluate(()=>{const g=document.getElementById('guide')||document.querySelector('section.only-guide');if(!g)return '';const h=g.querySelector('.bar,h2,h3')||g;return h.textContent.replace(/\s+/g,' ').trim().slice(0,36);});
 const lightOf=P=>P.slice(0,-1).filter(x=>x.ink<12).map(x=>x.n+':'+x.ink+'%');   /* rows with any ink, at 36 dpi: a page of sparse table rows reads about 20%, a citation alone under 5% */
 const hasText=(P,re)=>P.findIndex(x=>re.test(x.text));
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const F of Object.keys(FORMS)){const {p,errs,sim}=await open(F);
  const tb=await p.evaluate(()=>({opts:!!document.getElementById('nbhPrintOpts'),g:!!document.getElementById('nbhPrintGuide'),bl:!!document.getElementById('nbhPrintBlank'),own:!!document.querySelector('#printGuide[data-nbh-adopted]'),style:!!document.getElementById('nbh-print-policy'),api:!!(window.nbhPrint&&window.nbhPrint.before)}));
  const gt=await guideText(p);
  if(F==='SM-1')await p.evaluate(()=>document.documentElement.classList.add('sm-all'));   /* the record, as Print / Save as PDF prints it; the tab print is checked below */
  const P=pdfPages(await PDF(p),'pp131-'+F+'.pdf');
  const light=lightOf(P);
  ok(F+': the whole-form printout is no longer than before ('+BEFORE[F]+' pages) and no page but the last is under 12% of its rows inked',P.length<=BEFORE[F]&&!light.length,{pages:P.length,light,ink:brief(P)});
  if(GUIDE_SHEETS.includes(F)||GUIDE_SECTIONS.includes(F)){
   const gi=gt?hasText(P,new RegExp(esc(gt.slice(0,24)))):-1;
   ok(F+': the policy is on, no control was added to the toolbar, and the Guide (the choice off) is not in the printout',tb.api&&tb.style&&!tb.opts&&gi<0,{tb,gt,gi});
   await setOpt(p,'guide',true);const G=pdfPages(await PDF(p),'pp131-'+F+'-guide.pdf');const gj=gt?hasText(G,new RegExp(esc(gt.slice(0,24)))):-1;
   const recEnd=G.findIndex(x=>/Guide|GUIDE/.test(x.text)&&x.n>1);
   ok(F+': ticked, the Guide prints after the record (not on page 1) and the printout grows',G.length>P.length&&gj>0&&!/Guide:|Guide\b/.test(G[0].text.slice(0,400)),{pages:[P.length,G.length],gj,p1:G[0].text.slice(0,120)});
   await setOpt(p,'guide',false);
  } else if(F==='TD-1'){ok('TD-1: its own guide checkbox is the shared choice (adopted), no second control',tb.own&&!tb.g,tb);}
  if(F==='EA-1'){ok('EA-1: the empty trial-based log is out of the printout; "Include blank sheets" puts it back',hasText(P,/Trial-Based Log/)<0&&tb.api,{tb,i:hasText(P,/Trial-Based Log/)});
   await setOpt(p,'blank',true);const B=pdfPages(await PDF(p),'pp131-EA-1-blank.pdf');ok('EA-1: with blank sheets included the trial-based log prints',hasText(B,/Trial-Based Log/)>=0,{pages:B.length});await setOpt(p,'blank',false);
   const sig=hasText(P,/Parent or guardian informed/);ok('EA-1: the signature block shares its page with the design sheet\'s body (it stood alone on page 17)',sig>=0&&P[sig].ink>=15,sig>=0&&{n:P[sig].n,ink:P[sig].ink});}
  if(F==='PA-1'){/* a fresh form (the sheets re-render from their state at print time, so a cleared sheet is not a test): nothing run, so the five method sheets stay out */
   const q=await ctx.newPage();await q.goto(BASE+'/NBH-Workstation/'+FORMS[F]);await sleep(1500);
   const U=pdfPages(await PDF(q),'pp131-PA-1-unrun.pdf');const M=/Single-Stimulus Assessment|Paired-Stimulus|Multiple-Stimulus|Duration-Based|Competing-Stimulus/;
   ok('PA-1: a method sheet with nothing run is out of the printout (a fresh form prints none of the five)',hasText(U,M)<0&&tb.api&&U.length>=3,{fi:hasText(U,M),pages:U.length,tb});
   await setOpt(q,'blank',true);const U2=pdfPages(await PDF(q),'pp131-PA-1-unrun2.pdf');ok('PA-1: with blank sheets included the unrun sheets print',U2.filter(x=>M.test(x.text)).length>=3&&U2.length>U.length,{pages:[U.length,U2.length]});await setOpt(q,'blank',false);await q.close();}
  if(F==='SP-1'){const study=P.filter(x=>/THE STUDY/.test(x.text)).length,ctl=P.filter(x=>/Control Chart Analysis/.test(x.text)).length;
   ok('SP-1: the control-chart essay prints once, after the second behavior\'s chart (two Control Chart pages, one essay)',study===1&&ctl>=2&&P.length<BEFORE['SP-1'],{study,ctl,pages:P.length});}
  if(F==='OB-1'){const obs=P.filter(x=>/Direct Observation Record/.test(x.text)&&/Observation \d|Date/.test(x.text)).length;
   ok('OB-1: three observations no longer each spill a near-empty page (13 pages before)',P.length<=11,{pages:P.length,ink:brief(P)});}
  if(F==='DA-1'){const ri=hasText(P,/Recommendations Computed from the ranking/);ok('DA-1: the Recommendations heading shares its page with the first recommendation (it stood alone on page 10)',ri>=0&&/Tasks for the demand condition/.test(P[ri].text),ri>=0&&{n:P[ri].n,text:P[ri].text.slice(0,200)});}
  if(F==='TB-1'){const ii=hasText(P,/Interobserver Agreement Pilot/);ok('TB-1: the IOA pilot heading shares its page with its table (it stood alone on page 19)',ii>=0&&/Observers/.test(P[ii].text)&&P[ii].ink>=15,ii>=0&&{n:P[ii].n,ink:P[ii].ink});}
  if(F==='IA-1'){ok('IA-1: the printout is 28 pages or fewer (33 before, the Guide first and eleven light pages)',P.length<=28,{pages:P.length});}
  if(F==='SM-1'){await p.evaluate(()=>{document.documentElement.classList.remove('sm-all');const b=document.querySelector('[data-view="targets"]');if(b)b.click();});await sleep(500);
   const T=pdfPages(await PDF(p),'pp131-SM-1-tab.pdf');
   await p.evaluate(()=>document.documentElement.classList.add('sm-all'));const A=pdfPages(await PDF(p),'pp131-SM-1-all.pdf');await p.evaluate(()=>document.documentElement.classList.remove('sm-all'));
   ok('SM-1: the browser\'s Print from a tab prints that tab alone; Print / Save as PDF prints the record',T.length<A.length&&T.length<=6&&!T.some(x=>/Behavior Contract between/.test(x.text))&&A.some(x=>/Behavior Contract between/.test(x.text)),{tab:T.length,all:A.length});}
  ok(F+': no page errors',!errs.length,errs.slice(0,3));
  await p.close();}
 /* the choice is kept on the device, for every form */
 {const {p}=await open('TB-1');await setOpt(p,'guide',true);const v=await p.evaluate(()=>localStorage.getItem('nbh.print.guide'));await p.close();
  const q=await open('IA-1');const on=await q.p.evaluate(()=>window.nbhPrint.guideOn()&&!document.documentElement.classList.contains('nbh-pr-noguide'));await setOpt(q.p,'guide',false);await q.p.close();
  ok('the guide choice made on one form holds on the next (kept on the device)',v==='1'&&on,{v,on});}
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
