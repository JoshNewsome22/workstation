/* v22.07 the privacy statements tell the truth (review F478, F509, F510, F511, F497, I260), and Rewrite with Claude is off
   in the school edition (the user's decision): every form's note under its title says what Autosave keeps; Caseload's
   first line says where the caseload is with Google Drive off and on; Help has "Where the student's data goes" (with the
   Rewrite row only where the feature is on); the school edition's writing help has no Rewrite tab, asks nothing of a
   website, and no form's guide names it. Simulated data only.   usage: node qa/v2207-privacy-test.js */
const fs=require('fs'),path=require('path');
const {chromium,BASE,ROOT,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();
  try{
  const root=ROOT||path.join(__dirname,'..');
  for(const ed of ['NBH-Workstation','RPS-Workstation']){
    const forms=fs.readdirSync(path.join(root,ed)).filter(f=>/\.html$/.test(f)&&!/^(index|respond|staff-data)\.html$/.test(f));
    const old=forms.filter(f=>/Nothing is stored in the browser\. Entries live/.test(fs.readFileSync(path.join(root,ed,f),'utf8')));
    const neu=forms.filter(f=>/Autosave keeps a safety copy of this form in this browser, on this device, for up to 14 days/.test(fs.readFileSync(path.join(root,ed,f),'utf8')));
    ok(ed+' 1 no form says "Nothing is stored in the browser"; all 47 say what Autosave keeps',!old.length&&neu.length===47,{old,neu:neu.length});
  }
  const rwNamed=fs.readdirSync(path.join(root,'RPS-Workstation')).filter(f=>/\.html$/.test(f)&&/Rewrite with Claude/.test(fs.readFileSync(path.join(root,'RPS-Workstation',f),'utf8')));
  const cfg=/window\.nbhWordingConfig=\s*(\{[^\n]*\})/.exec(fs.readFileSync(path.join(root,'RPS-Workstation','nbh-wording.js'),'utf8'));
  ok('2 the school edition: no page names Rewrite with Claude, and the writing help is set with it off and no relay',!rwNamed.length&&cfg&&JSON.parse(cfg[1]).rewrite===false&&JSON.parse(cfg[1]).relay==='',{rwNamed,cfg:cfg&&cfg[1]});
  for(const ed of ['NBH-Workstation','RPS-Workstation']){
    const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    const asked=[];page.on('request',r=>{if(/\/ai\//.test(r.url()))asked.push(r.url());});
    await page.goto(BASE+'/'+ed+'/index.html');await sleep(1400);
    const lead=async on=>{await page.evaluate(o=>{const k='nbh.drive.on@'+DRV_ED;if(o)localStorage.setItem(k,'1');else localStorage.removeItem(k);},on);await page.evaluate(()=>caseloadOpen());await sleep(600);
      const t=await page.evaluate(()=>(document.querySelector('#dlgBody .hp-lead')||{}).textContent||'');await page.evaluate(()=>document.getElementById('dlg').close());return t;};
    const off=await lead(false),onT=await lead(true);await lead(false);
    ok(ed+' 3 Caseload\'s first line: Drive off, kept in this browser on this device until removed; Drive on, in the school Google Drive; never "nothing leaves it"',
      /kept in this browser on this device until you remove them\. The case files you save are the record\./.test(off)&&/and in your school Google Drive \(the folder FBA-BIP Workstation cases\)/.test(onT)&&!/nothing leaves it/.test(off+onT),{off,onT});
    await page.evaluate(()=>document.getElementById('help').click());await sleep(500);
    const h=await page.evaluate(()=>{const b=document.getElementById('dlgBody');const d=[...b.querySelectorAll('details')].find(x=>/Where the student/.test(x.querySelector('summary').textContent));
      return {lead:(b.querySelector('.hp-lead')||{}).textContent,rows:d?[...d.querySelectorAll('.hp-data tr')].slice(1).map(r=>r.cells[0].textContent):[],files:/a case moves between devices only when you move its file/.test(b.textContent)};});
    await page.evaluate(()=>document.getElementById('dlg').close());
    const rps=ed==='RPS-Workstation';
    ok(ed+' 4 Help: "Save the case before you leave", the table "Where the student\'s data goes" (Drive, Gmail, reply box, short links, DD-1\'s sheet'+(rps?'; no Rewrite row':', Rewrite with Claude')+'), and no "only when you move its file"',
      /Save the case before you leave\./.test(h.lead)&&h.rows.some(r=>/Use Google Drive/.test(r))&&h.rows.some(r=>/sent by email/.test(r))&&h.rows.some(r=>/reply box/.test(r))&&h.rows.some(r=>/Short questionnaire links/.test(r))&&h.rows.some(r=>/DD-1/.test(r))&&(rps?!h.rows.some(r=>/Rewrite/.test(r)):h.rows.some(r=>/Rewrite with Claude/.test(r)))&&!h.files,h);
    /* the writing help in Form DD-1: the Rewrite tab is there in the practice edition, gone in the school edition */
    const fp=await ctx.newPage();fp.on('pageerror',e=>errs.push(e.message));fp.on('request',r=>{if(/\/ai\//.test(r.url()))asked.push(r.url());});
    await fp.goto(BASE+'/'+ed+'/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(1500);
    const tabs=await fp.evaluate(async()=>{const ta=[...document.querySelectorAll('textarea')].find(x=>x.offsetParent);ta.value='He was angry (simulated).';ta.dispatchEvent(new Event('input',{bubbles:true}));nbhWording.open(ta);await new Promise(r=>setTimeout(r,600));
      const R=document.getElementById('nbh-wording-ui').shadowRoot;const t=[...R.querySelectorAll('[role=tab]')].filter(b=>!b.hidden).map(b=>b.getAttribute('aria-label').replace(/,.*$/,''));
      const t1=R.getElementById('tb1');t1.focus();t1.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(r=>setTimeout(r,200));
      const sel=[...R.querySelectorAll('[role=tab]')].find(b=>b.getAttribute('aria-selected')==='true').getAttribute('aria-label');
      const wt=R.getElementById('tp3').textContent;return {t,sel,wt:/as Rewrite with Claude does/.test(wt)};});
    ok(ed+' 5 the writing help\'s tabs: '+(rps?'Check wording and iPad Writing Tools only (the arrow goes from one to the other), no word of Rewrite':'Check wording, Rewrite with Claude, iPad Writing Tools'),
      rps?(tabs.t.join()==='Check wording,iPad Writing Tools'&&tabs.sel==='iPad Writing Tools'&&!tabs.wt):(tabs.t.join()==='Check wording,Rewrite with Claude,iPad Writing Tools'&&tabs.sel==='Rewrite with Claude'),tabs);
    await sleep(800);
    if(rps)ok(ed+' 6 nothing was asked of the rewrite service',!asked.length,asked);
    ok(ed+' 7 no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  const host=fs.readFileSync(path.join(root,'NBH-Workstation','HOSTING.md'),'utf8');
  ok('8 HOSTING.md: no "Nothing leaves the machine" and no "The tool holds no student data"; the data table is there',!/Nothing leaves the machine/.test(host)&&!/The tool\s+holds no student data/.test(host)&&/\| Questionnaire answers and staff phone entries/.test(host));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
