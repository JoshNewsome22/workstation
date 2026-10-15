/* the forms' own notices and questions (v21.34; pass or fail since v22.12, review F505): in a form, a short alert is a
   toast, a long one the styled notice; the styled confirm has Cancel and the named action and answers true or false;
   with no styled dialog it falls back to the browser's. On a touch screen the toolbar's buttons are 44 px. */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();
 for(const file of ['CF-1_Contextual-Fit-Assessment_v2026-09.html','OB-1_Direct-Observation-Record_v2026-09.html','SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','TB-1_Target-Behavior-Development_v2026-09.html']){
  const page=await br.newPage({viewport:{width:1200,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(900);
  const t=await page.evaluate(async()=>{alert('short notice');const n1=document.querySelectorAll('.nbh-toast').length;alert('A long notice.\n\nWith a second paragraph that would not fit in a toast and so goes to the styled notice dialog instead.');const open=document.querySelector('#nbhUiDlg').open;
    document.querySelector('#nbhUiF button').click();await new Promise(r=>setTimeout(r,50));
    const p=window.nbhUI.confirm('Delete this row?\nThe row holds an entry.',{danger:true,ok:'Delete'});await new Promise(r=>setTimeout(r,50));const q=document.querySelector('#nbhUiDlg').open,btns=[...document.querySelectorAll('#nbhUiF button')].map(b=>b.textContent);
    [...document.querySelectorAll('#nbhUiF button')].pop().click();const v=await p;
    window.confirm=()=>false;const v2=await window.nbhUI.confirm('stubbed?');return {toasts:n1,dlgOpen:open,confirmOpen:q,btns,v,v2};});
  ok('1 '+file.slice(0,4)+': short alert a toast, long alert the styled notice; the confirm shows Cancel / Delete and answers',t.toasts===1&&t.dlgOpen&&t.confirmOpen&&t.btns.join()==='Cancel,Delete'&&t.v===true&&t.v2===false,t);
  await page.close();}
 const ctx=await br.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p2=await ctx.newPage();wire(p2,log);
 await p2.goto(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(900);
 const z=await p2.evaluate(()=>({toolbarBtn:Math.round(document.querySelector('.toolbar button,#toolbar button,.nbh-toolbar button,button').getBoundingClientRect().height),coarse:matchMedia('(pointer:coarse)').matches}));
 ok('2 on a touch screen the toolbar\'s buttons are at least 44 px tall',z.coarse&&z.toolbarBtn>=44,z);
 ok('3 no page errors',!log.length,log);
 await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
