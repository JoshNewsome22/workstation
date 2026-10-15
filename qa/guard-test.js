/* the save mark and the leave guard (v21.33; pass or fail since v22.12, review F505). The workstation: a clean start
   shows no unsaved mark; typing in a form marks the case unsaved, twenty minutes of it pulses the button, a save clears
   it. A form on its own: the guard is there, typing makes it dirty, leaving is stopped, Save data clears it. */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 const dirty=()=>page.evaluate(()=>{paintSave();return $('#saveQuick').classList.contains('dirty');});
 ok('1 the workstation starts with no unsaved mark',!(await dirty()));
 await page.evaluate(()=>openForm('TB-1'));await page.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:20000});await sleep(800);
 const fr=page.frames().find(f=>f.url().includes('TB-1_'));
 await fr.evaluate(()=>{const t=document.querySelector('textarea');t.value='typed by the check';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});
 let d=false;for(let i=0;i<10&&!d;i++){await sleep(700);d=await dirty();}
 ok('2 typing in a form marks the case unsaved (the dot on Save case)',d);
 await page.evaluate(()=>{state.dirtySince=Date.now()-21*60000;paintSave();});
 ok('3 after twenty minutes unsaved, Save case pulses',await page.evaluate(()=>$('#saveQuick').classList.contains('nudge')));
 await page.evaluate(()=>{state.lastSig=caseSig();paintSave();});
 ok('4 once the case is saved, the mark goes',!(await dirty()));
 const p2=await ctx.newPage();wire(p2,log);await p2.goto(BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(600);
 const g=await p2.evaluate(()=>({has:!!window.nbhGuard,dirty:window.nbhGuard&&window.nbhGuard.isDirty(),spell:(document.querySelector('textarea')||{getAttribute:()=>null}).getAttribute('spellcheck'),quick:!!document.querySelector('#nbhSaveQuick')}));
 ok('5 a form on its own carries the guard, clean at load, with the quick Save and spell-check on',g.has&&g.dirty===false&&g.quick&&g.spell==='true',g);
 await p2.evaluate(()=>{const t=document.querySelector('input,textarea');t.value='x';t.dispatchEvent(new Event('input',{bubbles:true}));});
 ok('6 typing makes it dirty',await p2.evaluate(()=>window.nbhGuard.isDirty()));
 p2.on('dialog',dl=>dl.dismiss().catch(()=>{}));
 ok('7 leaving is stopped while it is dirty',await p2.evaluate(()=>{const ev=new Event('beforeunload',{cancelable:true});window.dispatchEvent(ev);return ev.defaultPrevented;}));
 await p2.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(500);
 ok('8 Save data clears it',!(await p2.evaluate(()=>window.nbhGuard.isDirty())));
 ok('9 no page errors',!log.length,log);
 await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
