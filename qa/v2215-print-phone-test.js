/* v22.15 (review F475, F479). A packet with Form TK-1 in it keeps the packet's own page: every page letter portrait, with the
   student, "Page N of M" and the confidentiality line (TK-1's landscape, edge-to-edge book rule no longer escapes its
   section). On an iPhone (390 px), the forms keep 14 px side margins on screen, and in the forms whose tables were wider
   than the screen (PA-1, AD-1, RA-1, EA-1, TD-1, SM-1, TV-1, OB-1) no view makes the whole page scroll sideways. Simulated
   student only.   usage: node qa/v2215-print-phone-test.js */
const L=require(__dirname+'/lib.js');const {execFileSync}=require('child_process');
const OUT=__dirname+'/out/v2215';L.fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const pdfInfo=file=>JSON.parse(execFileSync('python3',['-I','-c','import sys,json,pymupdf as f\nd=f.open(sys.argv[1])\nprint(json.dumps([[round(p.rect.width),round(p.rect.height),p.get_text()] for p in d]))',file],{encoding:'utf8',maxBuffer:64<<20}));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  for(const id of ['DM-1','TK-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:30000});await L.sleep(800);
    const fr=page.frames().find(f=>f.url().includes(L.forms().find(x=>x.id===id).file.slice(0,8)));if(fr)await L.loadSim(fr);await L.sleep(1500);}
  const html=await page.evaluate(async()=>{let doc='';const wo=window.open;window.open=()=>({document:{open(){},write(h){doc+=h;},close(){}},focus(){},print(){},close(){},closed:false});
    try{await masterRun(ALL.filter(r=>r[0]==='DM-1'||r[0]==='TK-1'),{});}finally{window.open=wo;}const i=doc.lastIndexOf('<!DOCTYPE html>');return i>=0?doc.slice(i):doc;});
  const pp=await ctx.newPage();await pp.setContent(html,{waitUntil:'load'});await L.sleep(1500);await pp.emulateMedia({media:'print'});
  const file=OUT+'/dm1-tk1.pdf';L.fs.writeFileSync(file,await pp.pdf({preferCSSPageSize:true,printBackground:true}));await pp.close();
  const P=pdfInfo(file),n=P.length;
  const land=P.map((p,i)=>p[0]>p[1]?i+1:0).filter(Boolean),noWho=P.map((p,i)=>/Mateo Rivera/.test(p[2])?0:i+1).filter(Boolean),noNum=P.map((p,i)=>p[2].indexOf('Page '+(i+1)+' of '+n)>=0?0:i+1).filter(Boolean);
  ok('1 a packet of DM-1 and TK-1 ('+n+' pages): every page letter portrait',n>3&&!land.length,{n,land:land.slice(0,10),size:P[0]&&P[0].slice(0,2)});
  ok('2 every page of it names the student and says "Page N of '+n+'"',n>3&&!noWho.length&&!noNum.length,{noWho:noWho.slice(0,10),noNum:noNum.slice(0,10)});
  /* the phone */
  const phone=await br.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
  const ids=['PA-1','AD-1','RA-1','EA-1','TD-1','SM-1','TV-1','OB-1'];const wide=[],pad=[];
  for(const f of L.forms().filter(x=>process.env.PHONE_ALL?true:ids.includes(x.id))){const p=await phone.newPage();p.on('pageerror',e=>errs.push(f.id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await L.sleep(1500);await L.loadSim(p);await L.sleep(1500);
    const views=await p.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.view));
    for(const v of (views.length?views:[''])){if(v)await p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');b.click();},v);await L.sleep(700);
      await p.evaluate(()=>window.nbhPolish&&nbhPolish.tscroll&&nbhPolish.tscroll());await L.sleep(150);
      const m=await p.evaluate(()=>{const de=document.documentElement;const sh=[...document.querySelectorAll('.sheet')].find(s=>s.offsetParent&&s.tagName!=='TABLE');return {sw:de.scrollWidth,cw:de.clientWidth,pad:sh?parseFloat(getComputedStyle(sh).paddingLeft):null};});
      if(m.sw>m.cw+1)wide.push(f.id+'/'+v+':'+m.sw);if(m.pad!=null&&m.pad>15)pad.push(f.id+'/'+v+':'+m.pad);}
    await p.close();}
  ok('3 on an iPhone, no view of '+(process.env.PHONE_ALL?'any of the 46 forms':'PA-1, AD-1, RA-1, EA-1, TD-1, SM-1, TV-1 or OB-1')+' makes the page scroll sideways',!wide.length,wide);
  ok('4 on an iPhone, the forms\' sheets keep 14 px side margins on screen (not the paper page\'s 0.6 in)',!pad.length,pad);
  /* the forms' question box fits the phone's screen and does not move the page */
  const dq=await phone.newPage();await dq.goto(L.BASE+'/NBH-Workstation/'+encodeURI(L.forms().find(x=>x.id==='PA-1').file));await L.sleep(1200);
  const dg=await dq.evaluate(async()=>{window.nbhUI.confirm('Load the simulated assessment?\nEvery sheet is filled with a worked example.');await new Promise(r=>setTimeout(r,300));const d=document.querySelector('#nbhUiDlg'),b=d.getBoundingClientRect();return {open:d.open,left:Math.round(b.left),right:Math.round(b.right),vw:document.documentElement.clientWidth,sx:window.scrollX};});
  ok('7 on an iPhone, the forms\' question box fits the screen and the page stays put',dg.open&&dg.left>=0&&dg.right<=dg.vw&&dg.sx===0,dg);await dq.close();
  /* print is untouched by the phone rules */
  const pr=await phone.newPage();await pr.goto(L.BASE+'/NBH-Workstation/'+encodeURI(L.forms().find(x=>x.id==='OB-1').file));await L.sleep(1200);await pr.emulateMedia({media:'print'});
  const pp2=await pr.evaluate(()=>{const sh=[...document.querySelectorAll('.sheet')].find(s=>s.tagName!=='TABLE');return sh?getComputedStyle(sh).paddingLeft:'';});
  ok('5 printed from a phone, a sheet keeps its print layout (the 14 px is for the screen only)',parseFloat(pp2)!==14,pp2);
  ok('6 no page errors',!errs.length,errs.slice(0,5));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
