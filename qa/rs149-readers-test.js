/* v24.49 Form RS-1: up to five other readers of the shared record, kept with the RBT and picked from the staff directory
   (the BCBA, 10/26: "add like 4 more additional emails slots ... linked to staff directory so I don't have to continually
   type in the emails"). One reader box shows; + Another reader opens the next, five in all; tapping a box offers the staff
   directory and a pick fills the address; the addresses are kept with the RBT (in the file) and come back, each box that
   holds one shown; a send goes to the RBT and every reader, each address once; the RBT's email boxes pick from the
   directory too. Simulated names and addresses only. usage: node qa/rs149-readers-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const PEOPLE={nbh:'people',v:1,gone:{},drv:null,list:[{name:'Dana Cole (simulated)',role:'BCBA',group:'',email:'dcole.sim@example.org',phone:'',site:'',note:''},
  {name:'Sam Ortiz (simulated)',role:'Clinical director',group:'',email:'sortiz.sim@example.org',phone:'',site:'',note:''},
  {name:'Lee Park (simulated)',role:'RBT',group:'',email:'lpark.sim@example.org',phone:'',site:'',note:''}]};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1180,height:820}});await ctx.addInitScript(P=>{try{if(!localStorage.getItem('nbh.people'))localStorage.setItem('nbh.people',JSON.stringify(P));}catch(e){}},PEOPLE);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';renderAll();setView('print');});await sleep(400);
 const vis=()=>p.evaluate(()=>({boxes:[1,2,3,4,5].map(i=>{const e=document.getElementById(i===1?'shOther':'shOther'+i);return !!e&&!!e.offsetParent;}),add:!!(document.getElementById('shAddCc')||{}).offsetParent}));
 const V0=await vis();
 ok('one reader box shows, with + Another reader',V0.boxes.join()==='true,false,false,false,false'&&V0.add,V0);
 /* the directory: tap the box, pick a person */
 const pick=async(sel,name)=>{await p.click(sel);await sleep(400);const it=p.locator('#nbhPpl button',{hasText:name}).first();const shown=await it.isVisible().catch(()=>false);if(shown){await it.click();await sleep(300);}return shown;};
 const s1=await pick('#shOther','Dana Cole');const v1=await p.evaluate(()=>({box:document.getElementById('shOther').value,kept:S.setup.cc1}));
 ok('tapping the reader box offers the staff directory; a pick fills the address and keeps it with the RBT',s1&&v1.box==='dcole.sim@example.org'&&v1.kept==='dcole.sim@example.org',{s1,v1});
 for(let i=0;i<4;i++){await p.click('#shAddCc');await sleep(150);}const V1=await vis();
 ok('+ Another reader opens the next box each time, five in all, then goes away',V1.boxes.every(Boolean)&&!V1.add,V1);
 const s2=await pick('#shOther2','Sam Ortiz');
 await p.fill('#shOther3','dcole.sim@example.org');await p.dispatchEvent('#shOther3','change');
 await p.fill('#shRbt','lpark.sim@example.org');await p.dispatchEvent('#shRbt','change');
 const R=await p.evaluate(()=>window.__rsShare.recipients().map(x=>x.to));
 ok('a send goes to the RBT and every reader, each address once (a repeat is left out)',s2&&R.join()==='lpark.sim@example.org,dcole.sim@example.org,sortiz.sim@example.org',{s2,R});
 /* kept in the file and shown again */
 const back=await p.evaluate(()=>{const o=fromFile({form:'RS-1',S:JSON.parse(JSON.stringify(S))});return [o.setup.cc1,o.setup.cc2,o.setup.cc3,o.setup.rbt_email];});
 ok('the readers and the RBT\'s address are kept with the RBT in the file',back.join()==='dcole.sim@example.org,sortiz.sim@example.org,dcole.sim@example.org,lpark.sim@example.org',back);
 await p.evaluate(()=>{S.setup.cc3='';renderAll();setView('print');});await sleep(300);const V2=await vis();
 ok('opened again, each box that holds an address shows (an emptied one does not), with + Another reader',V2.boxes.join()==='true,true,false,false,false'&&V2.add,V2);
 /* the RBT's email on Setup picks from the directory too */
 await p.evaluate(()=>{setView('setup');const e=document.getElementById('sEmail');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
 const s3=await pick('#sEmail','Lee Park');const v3=await p.evaluate(()=>({box:document.getElementById('sEmail').value,kept:S.setup.rbt_email}));
 ok('the RBT\'s email on Setup picks from the staff directory too',s3&&v3.box==='lpark.sim@example.org'&&v3.kept==='lpark.sim@example.org',{s3,v3});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
