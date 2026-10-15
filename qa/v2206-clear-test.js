/* v22.06 Clear all, then Cancel: the work stays and still counts as unsaved (the leave warning, the unsaved mark); Clear all
   answered Clear: the form is empty and counts as saved. Review finding F503. Each form opened on its own; simulated text.
   usage: node qa/v2206-clear-test.js        env ONLY=DM-1,TB-1 */
const {chromium,BASE,sleep,forms}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const only=(process.env.ONLY||'DM-1,TB-1,DD-1,TD-1,TK-1').split(',');
const TXT='Simulated note typed for the test';
(async()=>{const br=await chromium.launch();
  try{
  for(const f of forms().filter(x=>only.includes(x.id))){
    const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    let answer=false;p.on('dialog',d=>{if(d.type()==='confirm'){answer?d.accept():d.dismiss();}else d.accept();});
    await p.goto(BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1800);
    const typed=await p.evaluate(t=>{const e=[...document.querySelectorAll('input[type=text],textarea')].find(x=>x.offsetParent&&!x.readOnly&&!x.disabled&&!x.closest('.toolbar,dialog,.nbh-as-ui'));if(!e)return null;
      e.focus();e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return e.name?'[name="'+e.name+'"]':'#'+e.id;},TXT);
    await sleep(2500);
    const clear=async yes=>{answer=yes;await p.evaluate(()=>{const b=document.getElementById('clearBtn')||[...document.querySelectorAll('button')].find(x=>/^\s*clear all\s*$/i.test(x.textContent));b.click();});await sleep(600);
      await p.evaluate(y=>{const d=document.querySelector('#nbhUiDlg[open]');if(!d)return;const bs=[...d.querySelectorAll('button')];const c=y?bs.find(x=>!/cancel|keep/i.test(x.textContent)&&/clear|ok|yes|delete|start/i.test(x.textContent)):bs.find(x=>/cancel|keep/i.test(x.textContent));if(c)c.click();},yes);await sleep(2500);
      return p.evaluate(s=>({dirty:window.nbhGuard?window.nbhGuard.isDirty():null,val:(document.querySelector(s)||{}).value}),typed);};
    const before=await p.evaluate(()=>window.nbhGuard&&window.nbhGuard.isDirty());
    const c1=await clear(false);
    ok(f.id+' Clear all, then Cancel: the typed text stays and the form still counts as unsaved',!!typed&&before===true&&c1.val===TXT&&c1.dirty===true,{typed,before,c1});
    const c2=await clear(true);
    ok(f.id+' Clear all, answered Clear: the field is empty and the form counts as saved',c2.val!==TXT&&c2.dirty===false,c2);
    ok(f.id+' no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
