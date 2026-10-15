/* v22.09 printing (review F477, F476, F481). A form printed on its own carries the student's name and ID in the middle of
   every page's head and "Page N of M" at its foot (DM-1, TB-1, TD-1, with their simulations). The master print's cover
   puts the FERPA notice right under the student's table, so it is never alone on a second page, even with 26 forms;
   TD-1's sign-in cards print each as one box. Chromium; simulated student only.   usage: node qa/v2209-print-test.js */
const L=require(__dirname+'/lib.js');const {execFileSync}=require('child_process');
const OUT=__dirname+'/out/v2209-print';L.fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const pages=file=>JSON.parse(execFileSync('python3',['-I','-c','import sys,json,pymupdf as f\nd=f.open(sys.argv[1])\nprint(json.dumps([p.get_text() for p in d]))',file],{encoding:'utf8',maxBuffer:64<<20}));
(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const errs=[];
  for(const f of L.forms().filter(x=>['DM-1','TB-1','TD-1'].includes(x.id))){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await L.sleep(1500);await L.loadSim(p);await L.sleep(2200);
    // TB-1's and TD-1's simulations leave the student blank: give them the simulated student (DM-1 keeps first + last)
    await p.evaluate(()=>{const set=(sel,v)=>{const e=document.querySelector(sel);if(e&&!String(e.value||'').trim()){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};set('[name="m.client"]','Mateo Rivera');set('[name="m.sid"]','4471823');});
    const who=await p.evaluate(()=>{const L=document.querySelectorAll('[data-m="client"],[name="m.client"],[name="s_name"],[data-meta="client"],#m_client,#mClient,[name="h-client"],[name="h.client"],[name="c.client"],[name="student"],[name="s.student"],#h-client,#hClient,#cClient,#sClient,[name="c.student"]');for(const s of L){const v=String(s.value||s.textContent||'').trim();if(v)return v;}const f=document.querySelector('#sFirst'),l=document.querySelector('#sLast');return [f&&f.value,l&&l.value].filter(Boolean).join(' ').trim();});
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await L.sleep(500);
    const file=OUT+'/'+f.id+'.pdf';L.fs.writeFileSync(file,await p.pdf({preferCSSPageSize:true,printBackground:true}));
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));const gone=await p.evaluate(()=>!document.getElementById('nbh-print-head'));
    const t=pages(file),n=t.length;const noName=t.map((x,i)=>x.indexOf(who)<0?i+1:0).filter(Boolean),noTot=t.map((x,i)=>x.indexOf('Page '+(i+1)+' of '+n)<0?i+1:0).filter(Boolean);
    ok(f.id+' on its own: all '+n+' pages name the student ('+(who?'simulated':'none')+') and say "Page N of '+n+'"; the head is gone after printing',!!who&&n>1&&!noName.length&&!noTot.length&&gone,{who,n,noName:noName.slice(0,10),noTot:noTot.slice(0,10)});
    await p.close();}
  /* the packet: 26 forms ticked, a long contents list */
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  const html=await page.evaluate(async()=>{let doc='';const wo=window.open;window.open=()=>({document:{open(){},write(h){doc+=h;},close(){}},focus(){},print(){},close(){},closed:false});
    try{await masterRun(ALL.slice(0,26),{});}finally{window.open=wo;}const i=doc.lastIndexOf('<!DOCTYPE html>');return i>=0?doc.slice(i):doc;});
  const pp=await ctx.newPage();await pp.setContent(html,{waitUntil:'load'});await L.sleep(1500);await pp.emulateMedia({media:'print'});
  const order=await pp.evaluate(()=>{const c=document.querySelector('.mp-cover');const k=[...c.children].map(x=>x.className||x.tagName);return {k,li:c.querySelectorAll('ol>li').length,card:getComputedStyle(document.body).display};});
  const file=OUT+'/packet26.pdf';L.fs.writeFileSync(file,await pp.pdf({preferCSSPageSize:true,printBackground:true}));await pp.close();
  const t=pages(file);
  const p1=t[0]||'',p2=t[1]||'';
  ok('the master print with 26 forms: the FERPA notice is on the cover page, under the student\'s table and before the contents; no page holds the notice alone',
    order.k.indexOf('mp-conf')>-1&&order.k.indexOf('mp-conf')<order.k.indexOf('H2')&&/Confidential student record/.test(p1)&&!(/Confidential student record\. This packet/.test(p2)&&p2.replace(/\s+/g,' ').length<700),{order,p1:p1.slice(0,200),p2:p2.slice(0,200)});
  const td=await page.evaluate(()=>{const css=[...document.querySelectorAll('script')].map(s=>s.textContent).join('');return /\.mp-sec \.td85-card\{display:inline-block;width:100%/.test(css);});
  ok('TD-1\'s sign-in cards in the master print: every card one box (not only the parent\'s)',td);
  ok('no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
