/* @ names a staff member (v23.37): in a text box that is not a name box (Form ABC-1's Brief Incident Description), @ and the
   first letters of a name, or of a role, list the staff directory beside the cursor; Enter, Tab or a tap writes the name in
   place of the @ and the letters; the arrow keys move the choice; an email address lists nothing; Escape closes the list until
   the next @; a name box keeps its own list; the list follows the sheet's scale (Fit); it is never printed; an empty directory
   lists nothing outside the workstation. Simulated data only. usage: node qa/mention-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const PEOPLE={nbh:'people',v:1,gone:{},drv:null,list:[
  {id:'psim1',name:'Dana Whitfield (simulated)',role:'Classroom teacher',email:'dana.whitfield@example.org'},
  {id:'psim2',name:'Paula Brennan (simulated)',role:'Assistant principal',email:'paula.brennan@example.org'},
  {id:'psim3',name:'Iris Calloway (simulated)',role:'School counselor',email:'iris.calloway@example.org'}]};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  await ctx.addInitScript(j=>{try{if(!sessionStorage.getItem('__noPeople'))localStorage.setItem('nbh.people',j);}catch(e){}},JSON.stringify(PEOPLE));
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});return p;};
  const list=p=>p.evaluate(()=>{const b=document.getElementById('nbhPpl');if(!b||b.hidden)return null;const r=b.getBoundingClientRect();
    return {head:(b.querySelector('.pp-h')||{}).textContent||'',hint:(b.querySelector('.pp-hint')||{}).textContent||'',names:[...b.querySelectorAll('button[role=option] .pp-n')].map(x=>x.textContent),
      sel:[...b.querySelectorAll('button[role=option]')].findIndex(x=>x.getAttribute('aria-selected')==='true'),top:r.top,left:r.left};});
  const p=await open('ABC_Recording_Conditional_Probability_Analysis.html');
  const TA='#e-narrative';
  await p.click(TA);await p.evaluate(t=>{const e=document.querySelector(t);window.__inp=0;e.addEventListener('input',()=>window.__inp++);},TA);
  await p.keyboard.type('I was called to @Da');await sleep(250);
  const a=await list(p),ta=await p.evaluate(t=>{const r=document.querySelector(t).getBoundingClientRect();return {top:r.top,left:r.left,bottom:r.bottom};},TA);
  ok('1 @ and the first letters of a name list that staff member, beside the cursor',!!a&&JSON.stringify(a.names)==='["Dana Whitfield (simulated)"]'&&/tap a name to write it/.test(a.head)&&a.sel===0
    &&a.top>ta.top&&a.top<ta.top+70&&a.left>ta.left+60,{a,ta});
  await p.evaluate(()=>{window.__inp=0;});await p.keyboard.press('Enter');await sleep(200);
  let v=await p.evaluate(t=>{const e=document.querySelector(t);return {v:e.value,c:e.selectionStart,inp:window.__inp,open:!!document.getElementById('nbhPpl')&&!document.getElementById('nbhPpl').hidden};},TA);
  ok('2 Enter writes the name in place of the @ and the letters, a space after it, and the form hears it',v.v==='I was called to Dana Whitfield (simulated) '&&v.c===v.v.length&&v.inp>=1&&!v.open,v);
  await p.keyboard.type('and @');await sleep(250);const b=await list(p);
  await p.keyboard.press('ArrowDown');await sleep(120);const b2=await list(p);await p.keyboard.press('Tab');await sleep(200);
  v=await p.evaluate(t=>document.querySelector(t).value,TA);
  ok('3 @ alone lists everyone; the down arrow moves the choice; Tab writes it',!!b&&b.names.length===3&&/type the first letters/.test(b.head)&&!!b2&&b2.sel===1&&b2.names[1]==='Iris Calloway (simulated)'
    &&v==='I was called to Dana Whitfield (simulated) and Iris Calloway (simulated) ',{b,b2,v});
  await p.keyboard.type('saw @assistant');await sleep(250);const c=await list(p);
  await p.click('#nbhPpl button[role=option]');await sleep(250);
  v=await p.evaluate(t=>({v:document.querySelector(t).value,f:document.activeElement===document.querySelector(t)}),TA);
  ok('4 a role’s first letters find the person too; a tap writes the name and the cursor stays in the box',!!c&&JSON.stringify(c.names)==='["Paula Brennan (simulated)"]'&&/saw Paula Brennan \(simulated\) $/.test(v.v)&&v.f,{c,v});
  await p.keyboard.type('at dana.whitfield@exa');await sleep(250);const d=await list(p);
  ok('5 an @ inside a word (an email address) lists nothing',d===null,d);
  await p.keyboard.type(' @Pa');await sleep(250);const e1=await list(p);await p.keyboard.press('Escape');await sleep(120);const e2=await list(p);
  await p.keyboard.type('u');await sleep(250);const e3=await list(p);v=await p.evaluate(t=>document.querySelector(t).value,TA);
  ok('6 Escape closes the list, and it stays closed for that @; the letters stay as typed',!!e1&&e2===null&&e3===null&&/ @Pau$/.test(v),{e1,e2,e3,v:v.slice(-20)});
  await p.keyboard.type(' @Zq');await sleep(250);const f1=await list(p);await p.keyboard.press('Enter');await sleep(150);v=await p.evaluate(t=>document.querySelector(t).value,TA);
  ok('7 letters that start no one’s name say so, and Enter is a new line as always',!!f1&&/No one in your staff directory has a name or role starting “Zq”/.test(f1.hint)&&f1.names.length===0&&/ @Zq\n$/.test(v),{f1,v:v.slice(-12)});
  /* a name box keeps its own list */
  await p.click('#h-observer');await p.keyboard.type('@Da');await sleep(250);const g=await list(p);
  ok('8 a name box (the observer) keeps its own list: @ does not open the writing list there',g===null||!/tap a name to write it|type the first letters/.test(g.head),g);
  /* the sheet's scale (Fit): the list keeps to the cursor */
  const dx=async()=>{await p.evaluate(t=>{const e=document.querySelector(t);e.value='';e.focus();},TA);await p.keyboard.type('I was called to @');await sleep(250);
    const r=await list(p);const t=await p.evaluate(t=>document.querySelector(t).getBoundingClientRect().left,TA);await p.keyboard.press('Escape');return r?r.left-t:null;};
  const d1=await dx();await p.evaluate(t=>{document.querySelector(t).closest('.body').style.zoom='1.5';},TA);const d2=await dx();
  await p.evaluate(t=>{document.querySelector(t).closest('.body').style.zoom='';},TA);
  ok('9 at 150% the list keeps to the cursor (half as far again from the box’s edge)',d1>40&&d2>d1*1.3&&d2<d1*1.7,{d1,d2});
  /* never printed */
  await p.evaluate(t=>{const e=document.querySelector(t);e.value='';e.focus();},TA);await p.keyboard.type('@Ir');await sleep(250);
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>getComputedStyle(document.getElementById('nbhPpl')).display);await p.emulateMedia({media:'screen'});
  ok('10 the list is never printed',pr==='none',pr);
  await p.keyboard.press('Escape');
  /* another form: the shared block */
  const q=await open(file('TB-1_'));await q.click('[name="m.team"]');await q.keyboard.type('Classroom teacher, @wh');await sleep(250);const h=await list(q);
  await q.keyboard.press('Enter');await sleep(150);const hv=await q.evaluate(()=>document.querySelector('[name="m.team"]').value);
  ok('11 the same in every form (Form TB-1’s team)',!!h&&JSON.stringify(h.names)==='["Dana Whitfield (simulated)"]'&&hv==='Classroom teacher, Dana Whitfield (simulated) ',{h,hv});
  /* an empty directory, outside the workstation: nothing */
  const r=await ctx.newPage();r.on('pageerror',e=>errs.push(e.message));await r.goto(L.BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');
  await r.evaluate(()=>{sessionStorage.setItem('__noPeople','1');localStorage.removeItem('nbh.people');});await r.reload();await sleep(1000);
  await r.click(TA);await r.keyboard.type('Called to @Da');await sleep(300);const k=await list(r);
  ok('12 an empty directory lists nothing outside the workstation',k===null,k);
  ok('13 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
