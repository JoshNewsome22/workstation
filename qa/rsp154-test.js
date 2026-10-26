/* v24.54 Form RS-1: the PDF as the record prints (the BCBA, 10/26, the emailed August PDF beside the printed samples: "it
   doesnt have the two graphs at the bottom and it doesnt have the header like the earlier samples"). The month's PDF
   starts with the masthead (the logo as a picture, RBT Supervision Log, the form, its revision, the printed date) and goes
   on to the year summary through that month, on a page of its own, with its table and its chart; the year summary's PDF
   has the masthead too; a signature given with its name and date boxes empty takes the name the box shows (from Setup) and
   today's date; a record signed that way before names the signer from Setup. Simulated names only.
   usage: node qa/rsp154-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const pages=b64=>{const s=Buffer.from(b64,'base64').toString('latin1');
  return [...s.matchAll(/\/Type \/Page \/Parent[^\n]*\/Contents (\d+) 0 R/g)].map(m=>{const i=s.indexOf('\n'+m[1]+' 0 obj\n');const a=s.indexOf('stream\n',i)+7;const t=s.slice(a,s.indexOf('endstream',a));
    return {t,words:[...t.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map(x=>x[1]),imgs:(t.match(/\/Im\d+ Do/g)||[]).length};});};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1180,height:900}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const today=await p.evaluate(()=>todayISO());
 await p.evaluate(()=>{const k=yearKeys(setupYear())[1];S.setup.rbt_name='Lee Park (simulated)';S.setup.rbt_cred='RBT';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[];for(let d=1;d<=30;d++){const x=new Date(2026,8,d);if(x.getDay()%6===0)continue;m.days.push({id:'d'+d,date:k+'-'+String(d).padStart(2,'0'),start:'08:45',end:'15:30',brk:'',act:'',none:false});}
   m.contacts=[{id:'c1',date:k+'-08',start:'10:30',end:'12:30',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:['Observation'],sact:['Feedback'],bst:[],feedback:'Simulated feedback.',follow:'',ck:{},ckp:{}}];
   m.sig={};curKey=k;renderAll();setView('print');renderPrint();});await sleep(500);
 /* sign with the name and date boxes left empty: the supervisor types and adopts, the RBT draws */
 await p.evaluate(()=>{const d=document.querySelector('[data-tsgo="sup_img"]').closest('details');d.open=true;const nm=d.querySelector('[data-tsname]');nm.value='Dana Cole';nm.dispatchEvent(new Event('input',{bubbles:true}));
   const c=d.querySelector('[data-tsok]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));d.querySelector('[data-tsgo]').click();
   document.querySelector('canvas.rs-pad[data-pad="rbt_img"]').scrollIntoView({block:'center'});});await sleep(300);
 const bb=await (await p.$('canvas.rs-pad[data-pad="rbt_img"]')).boundingBox();await p.mouse.move(bb.x+40,bb.y+70);await p.mouse.down();for(let i=0;i<25;i++)await p.mouse.move(bb.x+40+i*14,bb.y+70+Math.sin(i/3)*25);await p.mouse.up();await sleep(300);
 const F=await p.evaluate(()=>{const g=month(curKey).sig;return {sup:[g.sup_name,g.sup_date,$('#sgSup').value,$('#sgSupDate').value],rbt:[g.rbt_name,g.rbt_date,$('#sgRbt').value,$('#sgRbtDate').value],img:!!g.sup_img&&!!g.rbt_img};});
 ok('signing with the name and date boxes empty fills them with the name the box shows (from Setup) and today\'s date',F.img&&F.sup.join()===['Dana Cole (simulated), BCBA',today,'Dana Cole (simulated), BCBA',today].join()&&F.rbt.join()===['Lee Park (simulated), RBT',today,'Lee Park (simulated), RBT',today].join(),F);
 /* a name typed in first is kept */
 await p.evaluate(()=>{const g=month(curKey).sig;g.rbt_name='L. Park (simulated), RBT';g.rbt_date='2026-10-20';renderSign();});
 await p.evaluate(()=>{const c=document.querySelector('canvas.rs-pad[data-pad="rbt_img"]');c.dispatchEvent(new PointerEvent('pointerdown',{clientX:c.getBoundingClientRect().left+20,clientY:c.getBoundingClientRect().top+40,pointerId:1,bubbles:true}));
   c.dispatchEvent(new PointerEvent('pointermove',{clientX:c.getBoundingClientRect().left+80,clientY:c.getBoundingClientRect().top+60,pointerId:1,bubbles:true}));c.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,bubbles:true}));});
 const K=await p.evaluate(()=>{const g=month(curKey).sig;return [g.rbt_name,g.rbt_date];});
 ok('a name and date already in the boxes are kept when signing',K.join()==='L. Park (simulated), RBT,2026-10-20',K);
 /* an older record signed with the name box empty: the printed record names the signer from Setup */
 const O=await p.evaluate(()=>{const g=month(curKey).sig;g.rbt_name='';renderMonthOut();const t=document.getElementById('monthOut').textContent;g.rbt_name='Lee Park (simulated), RBT';renderMonthOut();return /RBT: Lee Park \(simulated\), RBT/.test(t);});
 ok('a record signed before with the name box empty names the signer from Setup on the printed record',O);
 /* the month's PDF */
 const M=await p.evaluate(async()=>{const x=await window.__rsShare.pdfOf('month');return {b64:x.b64,pages:x.pages};});const P=pages(M.b64);
 const p1=P[0]||{words:[],imgs:0},yi=P.findIndex(q=>q.words.slice(0,8).join(' ').includes('Year Summary'));
 ok('the month\'s PDF starts with the masthead: the logo as a picture, "RBT Supervision Log", the form and its revision, the printed date',p1.words.slice(0,3).join(' ')==='RBT Supervision Log'&&/Form RS-1 .*Revised September 2026 .*Printed/.test(p1.words.slice(0,20).join(' '))&&p1.imgs>=1,{w:p1.words.slice(0,16),imgs:p1.imgs});
 ok('then the month\'s record (its title right under the masthead)',/RBT Supervision Record: September 2026/.test(p1.words.slice(0,30).join(' ')),p1.words.slice(0,30));
 ok('the year summary through the month follows on a page of its own (its title first on the page), after the signatures, with its table and its chart',yi>0&&P.slice(0,yi).some(q=>q.words.includes('Verification')||q.words.includes('VERIFICATION'))&&P[yi].words.includes('MONTH')&&P[yi].imgs>=1&&P[yi].words.join(' ').includes('PERCENT SUPERVISED BY MONTH'),{yi,first:P[yi]&&P[yi].words.slice(0,10),imgs:P[yi]&&P[yi].imgs});
 /* the year summary's PDF */
 const Y=await p.evaluate(async()=>(await window.__rsShare.pdfOf('year')).b64);const PY=pages(Y);
 ok('the year summary\'s PDF has the masthead too, then the summary and its chart',PY[0]&&PY[0].words.slice(0,3).join(' ')==='RBT Supervision Log'&&PY[0].words.join(' ').includes('Year Summary')&&PY[0].imgs>=2,{w:PY[0]&&PY[0].words.slice(0,12),imgs:PY[0]&&PY[0].imgs});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
