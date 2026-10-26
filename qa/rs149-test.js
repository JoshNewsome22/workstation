/* v24.49 Form RS-1: the year summary runs through a chosen month (the BCBA, 10/26: an August record entered in October
   printed the year summary with September's and October's figures). With the simulation loaded (every month of this
   school year up to today): signing August, the year summary stands as at August's end (later months blank in the
   table and the chart, totals "Through August 2026", the credential's days left counted from August 31, readings
   through August); the printed PDF carries no later month's figures; "the whole year so far" brings them back; the
   choice follows the month being signed; the printed date is today's. Also: no "\u" escape shows as text on RS-1 or SP-1.
   usage: node qa/rs149-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const pdfText=f=>{try{return JSON.parse(cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps([p.get_text() for p in d]))',f]).toString());}catch(e){return null;}};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1024}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2500);
 const ks=await p.evaluate(()=>yearKeys(setupYear()));const aug=ks[0];   /* the school year opens in August */
 const pick=k=>p.evaluate(k=>{const b=document.querySelector('#monthBar button[data-month="'+k+'"]');if(b)b.click();renderPrint();},k);
 const read=()=>p.evaluate(()=>{const o=document.getElementById('yearOut');const rows=[...o.querySelectorAll('table.p-t')[0].querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim()));
   const bars=[...o.querySelectorAll('svg path')].filter(x=>x.getAttribute('fill')==='#254657').length,T=[...o.querySelectorAll('svg text')],labs=T.filter(t=>/^[A-Z][a-z]{2}$/.test(t.textContent)),notMet=T.filter(t=>/✕/.test(t.textContent)).map(t=>{const x=+t.getAttribute('x');const l=labs.find(l=>Math.abs(+l.getAttribute('x')-x)<1);return l?l.textContent:'?';});
   return {title:o.querySelector('.p-title').textContent,rows,bars,notMet,foot:o.querySelector('.p-foot').textContent,cred:(([...o.querySelectorAll('.p-keep')].find(k=>/credential/i.test((k.querySelector('h4')||{}).textContent||''))||{querySelector:()=>null}).querySelector('p')||{}).textContent||'',rd:([...o.querySelectorAll('.p-att')].pop()||{}).textContent||'',sel:document.getElementById('yrThrough').value,opts:[...document.getElementById('yrThrough').options].map(o=>o.textContent)};});
 await pick(aug);const A=await read();
 const later=A.rows.slice(1,12);
 ok('signing August, the summary runs through August by default: the title and the totals row say so',A.sel==='auto'&&/through August 2026/.test(A.title)&&/^Through August 2026/.test(A.rows[12][0]),{title:A.title,tot:A.rows[12]});
 ok('September to July are blank in the table (no days, hours, contacts or verdict)',later.every(r=>r.slice(1).every(c=>c==='—'||c===''||c==='0.0%'&&false)),later.slice(0,3));
 ok('the totals are August\'s own (the same figures as August\'s row)',A.rows[12][1]===A.rows[0][1]&&A.rows[12][2]===A.rows[0][2]&&A.rows[12][3]===A.rows[0][3],{aug:A.rows[0],tot:A.rows[12]});
 ok('the chart has August\'s bar alone and no "not met" mark after August',A.bars===(A.rows[0][4]==='—'?0:1)&&A.notMet.every(m=>m==='Aug'),{bars:A.bars,notMet:A.notMet});
 const exp=await p.evaluate(()=>S.setup.rbt_exp);const days=await p.evaluate(()=>{const e=fromIso(S.setup.rbt_exp),b=fromIso(thruAsOf(yearKeys(setupYear())[0]));return e&&b?Math.round((e-b)/86400000):null;});
 ok('the credential\'s days left are counted from August 31, and the readings line says "through August 2026"',days!=null&&A.cred.indexOf(days+' day')>=0&&/through August 2026/.test(A.rd),{cred:A.cred,days,rd:A.rd,exp});
 const today=await p.evaluate(()=>mdy(todayISO()));
 ok('the printed date is today\'s, and the foot names the month',A.foot.indexOf('printed '+today)>=0&&/year summary through August 2026/.test(A.foot),A.foot);
 /* the printed PDF of the year summary */
 await p.evaluate(()=>{window.print=()=>{};document.getElementById('printYear2').click();});await sleep(300);
 await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});
 const f=path.join(ROOT,'qa','out','rs149-year.pdf');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,buf);const T=(pdfText(f)||[]).join(' ').replace(/\s+/g,' ');
 const sepRow=(T.match(/Year Summary.*?September 2026 ((?:\S+ ){9})/)||[])[1]||'';
 ok('the printed year summary reads "Through August 2026" and its September row is blank',/Through August 2026/.test(T)&&/^(— ){9}$/.test(sepRow),{sepRow,has:/Through August 2026/.test(T)});
 await p.evaluate(()=>document.body.classList.remove('rs-print-year'));
 /* the whole year so far */
 await p.evaluate(()=>{const s=document.getElementById('yrThrough');s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);const W=await read();
 const filled=W.rows.slice(1,12).filter(r=>r[1]!=='—').length;
 ok('"the whole year so far" brings the later months back: the title and the totals row read as before',!/through/.test(W.title)&&W.rows[12][0]==='The year'&&filled>=1,{title:W.title,tot:W.rows[12][0],filled});
 /* a later month signed: auto follows it */
 await p.evaluate(()=>{const s=document.getElementById('yrThrough');s.value='auto';s.dispatchEvent(new Event('change',{bubbles:true}));});
 await pick(ks[2]);const O=await read();
 ok('signing October, the summary runs through October (August to October filled), and the choice lists the month being signed',/through October 2026/.test(O.title)&&O.rows[2][1]!==undefined&&O.rows.slice(3,12).every(r=>r[1]==='—')&&/October 2026/.test(O.opts[0]),{title:O.title,opt:O.opts[0]});
 /* the escapes */
 const esc1=await p.evaluate(()=>[...document.querySelectorAll('button,[title],p,span,div')].filter(e=>/\\u[0-9a-f]{4}/i.test((e.childNodes.length===1&&e.firstChild.nodeType===3?e.textContent:'')+' '+(e.getAttribute('title')||''))).map(e=>e.outerHTML.slice(0,80)));
 const lbl=await p.evaluate(()=>{const b=document.getElementById('shRbtCopy');return b&&b.textContent;});
 const sp=await b.newPage();await sp.goto(BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1200);
 const esc2=await sp.evaluate(()=>/\\u2715/.test(document.body.innerText));await sp.close();
 ok('no "\\u" escape shows as text: the RBT copy button reads "Save the RBT’s copy"; SP-1\'s note shows ✕',!esc1.length&&lbl==='Save the RBT’s copy'&&!esc2,{esc1,lbl,esc2});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
