/* v24.35 the short report prints (review V12, part 2): beside Print, IA-1 offers the scores and convergence, PA-1 the Summary
   and the hierarchies with data, DA-1 the Results alone, TB-1 a one-page Definitions for staff, DD-1 the graphs alone. Each
   is printed with the simulation loaded and read back from the PDF: fewer pages than the whole form, the parts asked for
   present, the rest absent; the whole-form print unchanged. usage: node qa/pp135-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const pdfInfo=f=>{try{const o=cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps({"n":d.page_count,"t":[p.get_text() for p in d]}))',f]).toString();return JSON.parse(o);}catch(e){return null;}};
const flat=t=>String(t||'').replace(/\s+/g,' ');
const setSel=(p,id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);   /* the toolbar may be folded on this width */
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const errsAll=[];
 async function form(file,sim,prep){const p=await b.newPage({viewport:{width:1300,height:950}});p.on('pageerror',e=>errsAll.push(file.slice(0,5)+': '+String(e)));
   await p.goto(BASE+'/NBH-Workstation/'+file);await sleep(1500);await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});
   await p.evaluate(sim);await sleep(1800);if(prep)await p.evaluate(prep);await sleep(300);return p;}
 async function print(p,name){await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});const f=path.join(OUT,name);fs.writeFileSync(f,buf);const i=pdfInfo(f);return i?{n:i.n,all:flat(i.t.join(' ')),pages:i.t.map(flat)}:{n:0,all:'',pages:[]};}
 /* ---- IA-1 ---- */
 let p=await form('IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html',()=>document.getElementById('simBtn').click());
 const iaW=await print(p,'pp135-ia-whole.pdf');await setSel(p,'iaPrintWhat','scores');const iaS=await print(p,'pp135-ia-scores.pdf');await setSel(p,'iaPrintWhat','');const iaW2=await print(p,'pp135-ia-whole2.pdf');await p.close();
 ok('IA-1: "The scores and convergence" prints the Summary sheet alone (outcomes by instrument and informant, the convergence, the hypothesis, the decision), a few pages, no instrument worksheet; the whole form prints as before afterwards',
   iaS.n>0&&iaS.n<=5&&iaS.n*4<=iaW.n&&/Outcomes by Instrument/.test(iaS.all)&&/Hypothesis Statement/.test(iaS.all)&&/Results by Group/.test(iaS.all)&&iaW2.n===iaW.n,{whole:iaW.n,scores:iaS.n,again:iaW2.n,p1:iaS.pages[0]&&iaS.pages[0].slice(0,120)});
 /* ---- PA-1 ---- */
 p=await form('PA-1_Preference-Assessment-Protocol_v2026-09.html',()=>document.getElementById('simBtn').click());
 const paW=await print(p,'pp135-pa-whole.pdf');await setSel(p,'paPrintWhat','summary');const paS=await print(p,'pp135-pa-summary.pdf');await p.close();
 const paHier=(paS.all.match(/Hierarchy/g)||[]).length;
 ok('PA-1: "The Summary and the hierarchies with data" prints the Summary and each run method\'s hierarchy table (MSWO among them), far fewer pages than the whole form, without the methods\' procedure text',
   paS.n>0&&paS.n<=Math.max(4,Math.ceil(paW.n/2))&&paHier>=3&&!/Run This Assessment/.test(paS.all)&&!/RAISD/.test(paS.all),{whole:paW.n,summary:paS.n,hier:paHier});
 /* ---- DA-1 ---- */
 p=await form('DA-1_Demand-Assessment_v2026-10.html',()=>document.getElementById('simBtn').click());
 const daW=await print(p,'pp135-da-whole.pdf');await setSel(p,'daPrintWhat','results');const daS=await print(p,'pp135-da-results.pdf');await p.close();
 ok('DA-1: "The Results alone" prints the ranked tasks, metrics, verdict and recommendations and not the inventory or the assessment record',
   daS.n>0&&daS.n<daW.n&&/Printed [^.]*?\d{4} Ranked Tasks/.test(daS.pages[0])&&/Recommendations/.test(daS.all)&&!/Trial/.test(daS.pages[0].slice(0,400).replace(/Form DA-1.*?Confidential/,'')),{whole:daW.n,results:daS.n,p1:daS.pages[0]&&daS.pages[0].slice(0,160)});
 /* ---- TB-1 ---- */
 p=await form('TB-1_Target-Behavior-Development_v2026-09.html',()=>document.getElementById('simBtn').click());
 const names=await p.evaluate(()=>{const n=+document.getElementById('nTgt').value;const out=[];for(let t=0;t<n;t++){const e=document.querySelector('[name="tgt['+t+'].lab"]');const v=e?e.value.trim():'';if(v)out.push(v);}return out;});
 const tbW=await print(p,'pp135-tb-whole.pdf');await setSel(p,'tbPrintWhat','staff');const tbS=await print(p,'pp135-tb-staff.pdf');
 const gone=await p.evaluate(()=>!document.getElementById('tbStaff')&&!document.body.classList.contains('tb-staff-only'));await p.close();
 ok('TB-1: "Definitions for staff (one page)" prints a page or two (a page for every two targets at most) carrying every named target with its definition, examples and non-examples, and nothing else of the form; the sheet is removed after the print',
   tbS.n>=1&&tbS.n<=Math.max(2,Math.ceil(names.length/2))&&names.length>=2&&names.every(nm=>tbS.all.includes(nm))&&/Definitions for Staff/.test(tbS.all)&&/non-\s?examples/i.test(tbS.all)&&!/Quality Check|Selection/.test(tbS.pages[0].replace(/Form TB-1.*?Confidential/,'').slice(0,300))&&gone,{whole:tbW.n,staff:tbS.n,names});
 /* ---- DD-1 ---- */
 p=await form('Daily_Behavior_Data_and_Visual_Analysis.html',()=>document.getElementById('btnLoadExample').click(),()=>showTab('results'));
 const ddW=await (async()=>{await p.evaluate(()=>{window.print=()=>{};});await p.evaluate(()=>document.getElementById('btnPrint').click());await sleep(300);return print(p,'pp135-dd-whole.pdf');})();
 await setSel(p,'p_what','graphs');await p.evaluate(()=>document.getElementById('btnPrint').click());await sleep(300);const ddG=await print(p,'pp135-dd-graphs.pdf');
 const cls=await p.evaluate(()=>document.body.classList.contains('dd-pr-graphs'));
 await setSel(p,'r_behavior',await p.evaluate(()=>document.querySelector('#r_behavior option:nth-child(2)').value));await sleep(600);await p.evaluate(()=>document.getElementById('btnPrint').click());await sleep(300);const ddOne=await print(p,'pp135-dd-one.pdf');await p.close();
 ok('DD-1: "Graphs only" prints each behavior\'s heading, definition and graph without the within- and across-condition analysis; with one behavior chosen, one behavior\'s graph',
   ddG.n>0&&ddG.n<ddW.n&&/Within-condition analysis/.test(ddW.all)&&!/Within-condition analysis/.test(ddG.all)&&!/Across-condition analysis/.test(ddG.all)&&ddOne.n>=1&&ddOne.n<=2&&!cls,{whole:ddW.n,graphs:ddG.n,one:ddOne.n,cls});
 ok('no page errors',!errsAll.length,errsAll.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
