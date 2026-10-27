/* v24.69 Form RS-1 (the BCBA's screenshots, 10/27): boxes the form hides stay hidden in its grids (the group size and note on
   an individual contact, the BCaBA's BCBA on a BCBA supervisor) and show when they apply; no "&rsquo;" shows as text on any
   page, and an old saved checklist item with it reads right. Simulated only.  usage: node qa/hid169-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1000,height:1300}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const A=await p.evaluate(()=>{const k=yearKeys(setupYear())[0];curKey=k;S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''},{id:'s2',name:'Sam Reed (simulated)',cred:'BCaBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:'',bcba:''}];
   month(k).contacts=[{id:'c1',date:k+'-12',start:'11:00',end:'13:30',sup:'s1',format:'indiv',group:'1',mode:'person',obs:'yes',client:'SIM-1',acts:[],sact:[],bst:[]},{id:'c2',date:k+'-13',start:'11:00',end:'12:00',sup:'s1',format:'group',group:'3',mode:'person',obs:'no',client:'',acts:[],sact:[],bst:[]}];
   setView('month');renderAll();document.querySelectorAll('details.rs-contact').forEach(d=>d.open=true);const vis=e=>!!e&&!!e.offsetParent;
   const r={indiv:vis(document.querySelector('[data-grp="c1"]')),group:vis(document.querySelector('[data-grp="c2"]'))};setView('setup');renderAll();
   r.bcba=vis(document.querySelector('[data-bcba="s1"]'));r.bcaba=vis(document.querySelector('[data-bcba="s2"]'));return r;});
 ok('the group size and note are hidden on an individual contact and shown on a group contact',!A.indiv&&A.group,A);
 ok('"Supervised by (the BCBA\'s name ...)" is hidden for a BCBA and shown for a BCaBA',!A.bcba&&A.bcaba,A);
 const E=await p.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();const hits=new Set();for(const v of ['setup','month','year','rbt','print','guide']){try{setView(v);}catch(e){}document.querySelectorAll('details').forEach(d=>d.open=true);
   const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let x;while((x=tw.nextNode())){if(x.parentElement&&x.parentElement.closest('script,style'))continue;const m=x.data.match(/&[a-z]+;|&#\d+;/g);if(m)m.forEach(y=>hits.add(v+': '+y+' '+x.data.trim().slice(0,60)));}}
   const o=fromFile({form:'RS-1',S:{setup:{},sups:[],months:{'2026-09':{days:[],contacts:[{id:'q',date:'2026-09-02',ckSrc:'plan',ckItems:[{t:'Keeps the student&rsquo;s dignity and privacy'}]}]}}}});
   return {hits:[...hits],old:o.months['2026-09'].contacts[0].ckItems[0].t,item:CHECK[7]};});
 ok('no HTML entity shows as text on any page; the checklist reads "the student’s"',!E.hits.length&&E.item==='Keeps the student’s dignity and privacy',E.hits.slice(0,5));
 ok('an old saved checklist item with "&rsquo;" reads right when opened',E.old==='Keeps the student’s dignity and privacy',E.old);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
