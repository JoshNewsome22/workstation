/* v25.69 the design review's print group (H8, M12, M13, B2), as the BCBA approved it ("build").
   A simulated case (the bar's simulated student, every form below opened with its worked example, a simulated BCBA with a
   phone in the Staff directory) on a laptop's screen, the clock held at 2026-10-14 10:00 as the packet gate holds it:
     1 Build packet asks who the packet is for: four cards (IEP team and file, Teacher and staff, Family, Records request), each
       naming the forms it takes from this case and "about N pages"; a card opens step 2, the sections with a switch each and a
       running page count; IEP team and file has Packet options as its advanced settings;
     2 IEP team and file builds exactly the packet Build packet built before: the same pages, every line in the same place, as
       masterRun given the ticked forms (the path Build packet took); with WS_PREV_URL (the tree before this change, served
       elsewhere) the same packet built there is compared section by section: only the forms changed on purpose (IC-1 and
       FS-1, their signature blocks; DD-1, its graphs' dates and its key) may differ;
     3 the page estimate shown before building is within 0.6 to 1.5 times the pages the PDF has, for each reader;
     4 the presets build the right sections: Teacher and staff (QS-1, EB-1's brief, TD-1's step-by-step plan, CR-1's crisis plan,
       DD-1's data sheet, SM-1's point sheet), Family (IC-1's consent pages, CT-1's family card, HD-1's home sheets) with the
       child's first name in the head and a home footer naming the BCBA and the phone, no record footer and no student ID;
       Records request (the ticked forms, list order, each with its own references, no References section);
     5 no signature block apart: every signature block (the packet gate's, and a table of signature lines) starts and ends on one
       page, and something of its section stands above it on that page (no page holding only a signature block); Form IC-1's
       decision and signatures fit one page (packet gate check 5);
     6 Form HD-1's "Print the home sheets": the primary button on the Home sheets sheet; the sheets alone, "Page 1 of N" on their
       own, the child's first name and the week at the head of every page, the home footer ("Please ... Questions: Jordan
       Ellis, 555-0142.") and no record footer, no full name, no ID; the form's own Print keeps the record footer;
     7 Form DD-1's graphs: the dates under the axis level (none turned), apart (no two overlapping) at 20 days and at 60, every
       2nd to 5th day, each day's full date as its title and on a tap; printed on its own (landscape) its first page is full;
       in the packet (upright pages) its first graph follows the student's details on the results' first page, the key right
       after it;
     8 no page errors.
   Simulated data only. About 4 minutes (6 with WS_PREV_URL).
   usage: node qa/v2569-print-group-test.js      (WS_PREV_URL=http://127.0.0.1:8647 to compare with the tree before) */
const L=require(__dirname+'/lib.js');const {execFileSync}=require('child_process');
const OUT=__dirname+'/out/v2569-print-group/';L.fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const PREV=process.env.WS_PREV_URL||'';
const BAR={client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School (simulated)',grade:'5',bcba:'Jordan Ellis, M.A., BCBA (simulated)'};
const PEOPLE=JSON.stringify({nbh:'people',v:1,list:[{id:'p-sim-1',name:'Jordan Ellis (simulated)',role:'BCBA',group:'',email:'',phone:'555-0142',site:'',note:'',upd:1}],gone:{},drv:null});
const OPEN=['DM-1','IC-1','FS-1','TD-1','GB-1','DD-1','SM-1','HD-1','CT-1','QS-1','EB-1','CR-1'];
const TICK=['DM-1','IC-1','FS-1','TD-1','GB-1','DD-1','HD-1'];
const SIGS='.td85-card,.sigblock,.ic-signpart,.eb-sig,.sig,.hs-sig,.cn-sig,.mp-sigkeep';
const DD1='/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html',HD1='/NBH-Workstation/HD-1_Home-Data-Sheets_v2026-10.html';
/* a PDF read back: each page's lines (text, x0, y0, x1, y1, size), the white 3 px labels apart */
const READ=`import sys,json,pymupdf
out=[]
for p in pymupdf.open(sys.argv[1]):
    L=[];W=[]
    for b in p.get_text('dict')['blocks']:
        if b['type']!=0: L.append(['[img]']+[round(v,1) for v in b['bbox']]+[0]); continue
        for l in b['lines']:
            for s in l['spans']:
                t=s['text']
                if not t.strip(): continue
                r=[t]+[round(v,1) for v in s['bbox']]+[round(s['size'],2)]
                (W if s['color']==0xffffff else L).append(r)
    out.append({'w':round(p.rect.width),'h':round(p.rect.height),'L':L,'W':W})
print(json.dumps(out))`;
const readPdf=f=>JSON.parse(execFileSync('python3',['-I','-c',READ,f],{encoding:'utf8',maxBuffer:512<<20}));
const lines=pg=>pg.L.filter(x=>x[0]!=='[img]').map(x=>x[0]);
const pageText=pg=>lines(pg).join(' ');
/* the page's text with every space taken out: Chromium writes a page's head and foot (its margin boxes) letter by letter */
const sq=t=>String(t).replace(/\s+/g,''),flat=pg=>sq(pageText(pg));
/* the workstation with the simulated case open */
async function openCase(br,base){
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  await ctx.addInitScript(P=>{window.print=function(){};try{localStorage.setItem('nbh.frames.cap','60');localStorage.setItem('nbh.people',P);localStorage.removeItem('nbh.packet.est');}catch(e){}},PEOPLE);
  await ctx.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  const page=await ctx.newPage();page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(base+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(b=>{try{localStorage.removeItem('nbh.packet');}catch(e){}
    wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient',b.client);set('#pSid',b.sid);set('#pSite',b.site);set('#pGrade',b.grade);set('#pBcba',b.bcba);},BAR);
  const forms=L.forms();
  for(const id of OPEN){const f=forms.find(x=>x.id===id);await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000}).catch(()=>{});await L.sleep(400);
    const fr=page.frames().find(x=>x.url().endsWith('/'+f.file));if(!fr)continue;
    await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}}).catch(()=>{});
    await L.loadSim(fr);await L.sleep(1000);}
  await page.evaluate(()=>gatherFacts(true));await L.sleep(1500);
  await page.evaluate(T=>{Object.keys(state.ticked).forEach(k=>state.ticked[k]=false);T.forEach(id=>state.ticked[id]=true);renderRail();},TICK);
  return {ctx,page};}
/* a print window: wait until measured, then its PDF */
async function windowPdf(win,file){await win.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await win.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});await L.sleep(1200);
  await win.emulateMedia({media:'print'});await L.sleep(300);
  const dom=await win.evaluate(()=>({secs:[...document.querySelectorAll('.mp-sec')].map(s=>s.id.replace(/^sec-/,'')),title:(document.querySelector('.mp-cover h1')||{}).textContent||'',
    text:Object.fromEntries([...document.querySelectorAll('.mp-sec')].map(s=>[s.id.replace(/^sec-/,''),(s.innerText||'').replace(/\s+/g,' ')])),
    refs:[...document.querySelectorAll('#sec-REFS .mp-app-p')].map(p=>p.textContent.replace(/\s+/g,' ').trim())}));
  L.fs.writeFileSync(file,await win.pdf({preferCSSPageSize:true,printBackground:true}));return dom;}
/* the sections' pages, from the white NBHSEC labels */
function sections(P){const at={};let cur='cover';P.forEach((pg,i)=>{const m=pg.W.map(w=>/NBHSEC:([A-Z0-9-]+);/.exec(w[0])).find(Boolean);if(m)cur=m[1];(at[cur]=at[cur]||[]).push(i);});return at;}
/* a page's lines between the running heads (the heads and "Page N of M" left aside), each with its place */
const body=pg=>pg.L.filter(x=>x[2]>46&&x[4]<pg.h-46);
/* two runs of pages the same: the same lines, each within half a point of its place (Chromium rounds a line's place
   differently from one layout to the next by a tenth of a point) */
const samePages=(a,b)=>a.length===b.length&&a.every((pa,i)=>pa.length===b[i].length&&pa.every((x,j)=>{const y=b[i][j];return x[0]===y[0]&&[1,2,3,4].every(k=>Math.abs(x[k]-y[k])<=0.5);}));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const t0=Date.now();
  const {ctx,page}=await openCase(br,L.BASE);page.on('pageerror',e=>errs.push('shell: '+e.message));
  console.log('   ('+OPEN.length+' forms opened with their worked examples in '+Math.round((Date.now()-t0)/1000)+' s)');
  /* ---- 1 the sheet ---- */
  await page.evaluate(()=>$('#masterPrint').click());await page.waitForSelector('#dlg[open] .pk-card',{timeout:15000});
  const s1=await page.evaluate(()=>({title:$('#dlgTitle').textContent,cards:[...document.querySelectorAll('.pk-card')].map(c=>({aud:c.dataset.aud,t:c.querySelector('b').textContent,
    f:c.querySelector('.pk-f').textContent,n:c.querySelector('.pk-n').textContent,dis:c.disabled}))}));
  const card=a=>s1.cards.find(c=>c.aud===a)||{};const num=t=>+((/about (\d+) page/.exec(t||'')||[])[1]||0);
  ok('1 Build packet asks "who is this for?" with four cards, each naming its forms from this case and about how many pages',
    /who is this for/i.test(s1.title)&&s1.cards.map(c=>c.t).join('|')==='IEP team and file|Teacher and staff|Family|Records request'&&s1.cards.every(c=>!c.dis&&num(c.n)>0)&&
    card('iep').f==='DM-1, IC-1, FS-1, TD-1, GB-1, DD-1, HD-1'&&card('staff').f==='QS-1, EB-1, TD-1, CR-1, DD-1, SM-1'&&card('family').f==='IC-1, CT-1, HD-1'&&card('records').f==='DM-1, IC-1, DD-1, FS-1, TD-1, GB-1, HD-1',s1);
  const step2=async a=>{await page.evaluate(a=>document.querySelector('.pk-card[data-aud="'+a+'"]').click(),a);await page.waitForSelector('#pkTotal',{timeout:5000});
    return page.evaluate(()=>({title:$('#dlgTitle').textContent,secs:[...document.querySelectorAll('[data-pk-id]')].map(c=>c.dataset.pkId+':'+c.closest('label').querySelector('.pk-sn').textContent),
      total:$('#pkTotal').textContent,adv:!!document.querySelector('.pk-adv input[name="refs"]'),home:!!document.getElementById('pkHome'),fam:(document.querySelector('.pk-fam')||{}).textContent||''}));};
  const iep2=await step2('iep');
  /* a switch changes the running count; switched back, as it was */
  const tog=await page.evaluate(()=>{const c=document.querySelector('[data-pk-id="GB-1"]'),a=$('#pkTotal').textContent;c.click();const b=$('#pkTotal').textContent;c.click();return {a,b,c:$('#pkTotal').textContent};});
  ok('1 step 2: the sections with a switch each and a running page count (switching GB-1 off: "'+tog.b+'"), Packet options as the advanced settings',
    iep2.secs.length===7&&iep2.adv&&/^About \d+ pages in all: 7 sections/.test(iep2.total)&&tog.a!==tog.b&&tog.a===tog.c&&/6 sections/.test(tog.b),{iep2,tog});
  /* ---- 2 IEP team and file: the packet as Build packet built it ---- */
  const [w1]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#pkPrint').click())]);w1.on('pageerror',e=>errs.push('iep window: '+e.message));
  const iep=await windowPdf(w1,OUT+'iep.pdf');await w1.close();
  const [w2]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(T=>{const F=ALL.filter(([id])=>T.includes(id));masterRun(packetOpts().order==='list'?F:mpCaseOrder(F));},TICK)]);
  const leg=await windowPdf(w2,OUT+'legacy.pdf');await w2.close();
  const A=readPdf(OUT+'iep.pdf'),B=readPdf(OUT+'legacy.pdf');
  const same=A.length===B.length&&A.every((pg,i)=>JSON.stringify(pg.L)===JSON.stringify(B[i].L));
  ok('2 IEP team and file prints exactly the packet Build packet built (masterRun with the ticked forms): '+A.length+' pages, every line in the same place',same&&iep.secs.join()===leg.secs.join(),{a:A.length,b:B.length,secs:iep.secs});
  const est=await page.evaluate(()=>JSON.parse(localStorage.getItem('nbh.packet.est')||'{}'));
  /* ---- 3 the estimate ---- */
  const r3=n=>Math.round(n*100)/100;const within=(e,n)=>e>=0.6*n&&e<=1.5*n;
  ok('3 IEP team and file: "about '+num(card('iep').n)+' pages" before building; the PDF has '+A.length+' ('+r3(num(card('iep').n)/A.length)+' times)',within(num(card('iep').n),A.length),{card:card('iep'),pdf:A.length});
  /* ---- 5 signatures ---- */
  const [w3]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(T=>{const F=ALL.filter(([id])=>T.includes(id));masterRun(mpCaseOrder(F),{check:false});},TICK)]);
  await w3.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await w3.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});await L.sleep(1200);await w3.emulateMedia({media:'print'});await L.sleep(300);
  const sg=await w3.evaluate(SIGS=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};const txt=e=>(e.textContent||'').replace(/\s+/g,' ').trim();
    const blocks=[...document.querySelectorAll(SIGS)].filter(e=>vis(e)&&!e.parentElement.closest(SIGS));
    const flow=e=>{let d=getComputedStyle(e).display;while(/grid|flex|table/.test(d)&&e.firstElementChild){e=e.firstElementChild;d=getComputedStyle(e).display;}return e;};
    const flowEnd=e=>{let d=getComputedStyle(e).display;while(/grid|flex|table/.test(d)&&e.lastElementChild){e=e.lastElementChild;d=getComputedStyle(e).display;}return e;};
    const L=blocks.map((b,k)=>{flow(b).setAttribute('data-gsa',k);flowEnd(b).setAttribute('data-gsz',k);const s=b.closest('.mp-sec');return {k,sec:s?s.id.replace(/^sec-/,''):'?',cls:(b.getAttribute('class')||'').split(' ')[0],text:txt(b).slice(0,40)};});
    const st=document.createElement('style');st.textContent='[data-gsa]::before{content:"GSA" attr(data-gsa) ";"}[data-gsz]::after{content:"GSZ" attr(data-gsz) ";"}'+
      '[data-gsa]::before,[data-gsz]::after{float:left;width:0;height:0;overflow:visible;margin:0;padding:0;border:0;font:normal 3px/1 Arial,Helvetica,sans-serif;color:#fff;white-space:nowrap;pointer-events:none}';
    document.head.appendChild(st);return L;},SIGS);
  L.fs.writeFileSync(OUT+'sig.pdf',await w3.pdf({preferCSSPageSize:true,printBackground:true}));await w3.close();
  const S=readPdf(OUT+'sig.pdf');const where={};
  S.forEach((pg,i)=>pg.W.forEach(w=>{const re=/GS([AZ])(\d+);/g;let m;while((m=re.exec(w[0])))(where[m[2]]=where[m[2]]||{})[m[1]]={p:i,y:w[2]};}));
  const bad5=sg.filter(b=>{const w=where[b.k]||{};return !(w.A&&w.Z&&w.A.p===w.Z.p);});
  const alone=sg.filter(b=>{const w=where[b.k];if(!w||!w.A||!w.Z||w.A.p!==w.Z.p)return false;const pg=S[w.A.p];
    return !pg.L.some(x=>x[0]!=='[img]'&&x[2]>50&&x[4]<pg.h-50&&(x[4]<w.A.y-1||x[2]>w.Z.y+14));});
  const ic=sg.filter(b=>b.cls==='ic-signpart'),fs=sg.filter(b=>b.sec==='FS-1'&&b.cls==='mp-sigkeep');
  ok('5 every signature block ('+sg.length+', Form IC-1\'s decision and signatures and Form FS-1\'s signature lines among them) starts and ends on one page',
    !bad5.length&&ic.length===1&&fs.length===1,{bad5:bad5.map(b=>Object.assign({at:where[b.k]},b)).slice(0,6),ic:ic.length,fs:fs.length});
  ok('5 no page holds only a signature block: something of its section stands above or below each one on its page',!alone.length,alone.map(b=>Object.assign({at:where[b.k]},b)).slice(0,6));
  /* ---- 7 DD-1 in the packet: its first graph on the results' first page, the key right after it ---- */
  const at=sections(A),dd=(at['DD-1']||[]).map(i=>A[i]);
  const ri=dd.findIndex(pg=>/Dataspan/.test(flat(pg))),rp=dd[ri]||{L:[],h:792};
  const low=Math.max(0,...rp.L.filter(x=>x[4]<rp.h-46).map(x=>x[4]));
  const keyAt=dd.findIndex(pg=>/Howtoreadthesegraphs/.test(flat(pg)));
  ok('7 Form DD-1 in the packet: the first graph follows the student\'s details on the results\' first page (filled to '+Math.round(100*low/rp.h)+'% of it), the key right after it',
    ri>=0&&/Observationdays/.test(flat(rp))&&low>0.6*rp.h&&(keyAt===ri||keyAt===ri+1)&&dd.filter(pg=>/Howtoreadthesegraphs/.test(flat(pg))).length===1,{ri,keyAt,low,h:rp.h});
  /* ---- 4 the presets ---- */
  /* v25.70 (the BCBA, 11/9) the Family packet opens with the plan in plain words, which waits for Reviewed (qa/v2570-backlog-test.js) */
  const build=async(aud,file)=>{await page.evaluate(()=>$('#masterPrint').click());await page.waitForSelector('#dlg[open] .pk-card',{timeout:15000});const s=await step2(aud);
    if(aud==='family')await page.evaluate(()=>{const r=document.getElementById('pkSumRev');if(r&&!r.checked)r.click();});
    const [w]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#pkPrint').click())]);w.on('pageerror',e=>errs.push(aud+' window: '+e.message));
    const d=await windowPdf(w,file);await w.close();return {s,d,P:readPdf(file)};};
  const st=await build('staff',OUT+'staff.pdf'),fa=await build('family',OUT+'family.pdf'),rc=await build('records',OUT+'records.pdf');
  const T=st.d.text;
  ok('4 Teacher and staff: QS-1, EB-1\'s brief, TD-1\'s step-by-step plan, CR-1\'s crisis plan, DD-1\'s data sheet, SM-1\'s point sheet; no references section ('+st.P.length+' pages)',
    st.d.secs.join()==='QS-1,EB-1,TD-1,CR-1,DD-1,SM-1'&&/Final Treatment Plan/.test(T['TD-1'])&&!/Setup: What the Assessment Established|Select the Treatment/.test(T['TD-1'])&&
    !/How to read these graphs/.test(T['DD-1'])&&/staff/i.test(st.d.title),{secs:st.d.secs,title:st.d.title,td:(T['TD-1']||'').slice(0,200)});
  const F=fa.d.text,famPages=fa.P.slice(1);
  /* the first name (v25.70, the BCBA 11/9): Form HD-1's "Called at home", else Form DM-1's preferred name (the worked examples' are
     the same), else the first word of the bar's name */
  const pref=await page.evaluate(()=>{const v=(id,q)=>{const f=state.frames[id],e=f&&f.contentDocument.querySelector(q);return e?e.value.trim():'';};return v('HD-1','[data-m="nick"]')||v('DM-1','[name="s.pref"]');}),first=pref||'Mateo';
  const foot='For '+first+'’s family. Questions: Jordan Ellis, 555-0142.';
  const famHeads=famPages.every(pg=>{const t=flat(pg);return t.includes(sq(foot))&&t.includes(sq(first+'’s plan · for the family'))&&!/Confidentialstudentrecord|Retaininthestudent|4471823/.test(t);});
  ok('4 Family: the plan in plain words (v25.70), IC-1\'s consent pages, CT-1\'s family card and HD-1\'s home sheets (the first under the letterhead); every page headed with the first name ("'+first+'", Form DM-1\'s preferred name) and footed "'+foot+'", no record footer, no student ID ('+fa.P.length+' pages)',
    fa.d.secs.join()==='SUM,IC-1,CT-1,HD-1'&&/Home Tally Sheet/.test(F['HD-1'])&&/HomeTallySheet/.test(flat(fa.P[(sections(fa.P)['HD-1']||[0])[0]]))&&!/Agreement|Entry/.test((F['HD-1']||'').slice(0,4000))&&/Family Card|When .+ happens|Steps/i.test(F['CT-1'])&&(F['CT-1']||'').length>300&&famHeads&&fa.d.title===first+'’s plan, for the family'&&fa.s.home&&/555-0142/.test(fa.s.fam),
    {secs:fa.d.secs,title:fa.d.title,heads:famHeads,hd:/Home Tally Sheet/.test(F['HD-1']),hdOnly:!/Agreement|Entry/.test((F['HD-1']||'').slice(0,4000)),card:(F['CT-1']||'').slice(0,300),home:fa.s.home,fam:fa.s.fam,hd1:(F['HD-1']||'').slice(0,300)});
  const R=rc.d.text;
  ok('4 Records request: the ticked forms in the list\'s order, each with its own references, no References section',
    rc.d.secs.join()==='DM-1,IC-1,DD-1,FS-1,TD-1,GB-1,HD-1'&&!rc.d.secs.includes('REFS')&&/References/.test(R['TD-1']||''),{secs:rc.d.secs});
  const e3=[['staff',st],['family',fa],['records',rc]].map(([a,x])=>[a,num(card(a).n),x.P.length]);
  ok('3 Teacher and staff, Family and Records request: the estimate before building is within 0.6 to 1.5 times the PDF ('+e3.map(e=>e[0]+' '+e[1]+' of '+e[2]).join(', ')+')',e3.every(e=>within(e[1],e[2])),e3);
  /* once built, the estimate is what was measured */
  ok('3 after a build, the measured lengths are kept for the next estimate',Object.keys(est).length>=7&&est['DM-1']>0,est);
  await ctx.close();
  /* ---- 2 against the tree before this change ---- */
  if(PREV){const {ctx:c2,page:p2}=await openCase(br,PREV);
    const [wp]=await Promise.all([p2.waitForEvent('popup',{timeout:120000}),p2.evaluate(T=>{const F=ALL.filter(([id])=>T.includes(id));masterRun(packetOpts().order==='list'?F:mpCaseOrder(F));},TICK)]);
    const prev=await windowPdf(wp,OUT+'prev.pdf');await wp.close();await c2.close();
    const P=readPdf(OUT+'prev.pdf'),ap=sections(A),bp=sections(P),diff=[];
    Object.keys(ap).forEach(id=>{const a=ap[id].map(i=>body(A[i])),b=(bp[id]||[]).map(i=>body(P[i]));if(!samePages(a,b))diff.push(id+' '+(bp[id]||[]).length+' > '+ap[id].length+' pages');});
    /* the References section lists the forms' citations in the order they stand: Form IC-1's say-it-back citation now follows its
       signatures, so the list may run in another order; it must hold the same lines */
    const sameRefs=iep.refs.length>0&&iep.refs.slice().sort().join('\n')===prev.refs.slice().sort().join('\n')&&(ap.REFS||[]).length===(bp.REFS||[]).length;
    /* v25.70: Form HD-1's "Called at home" label (the BCBA, 11/9) prints on its Setup page */
    const MEANT=['IC-1','FS-1','DD-1','HD-1'].concat(sameRefs?['REFS']:[]);
    ok('2 against the tree before ('+PREV+'): the same sections, and every one prints the same pages, line for line, but the forms changed on purpose; the References hold the same entries on as many pages ('+(diff.join(', ')||'none differ')+')',
      prev.secs.join()===iep.secs.join()&&diff.every(d=>MEANT.includes(d.split(' ')[0])),{diff,prev:prev.secs,now:iep.secs});}
  /* ---- 6 HD-1: the home sheets on their own ---- */
  {const c=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
    await c.addInitScript(P=>{try{localStorage.setItem('nbh.people',P);}catch(e){}},PEOPLE);await c.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
    const p=await c.newPage();p.on('pageerror',e=>errs.push('HD-1: '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(L.BASE+HD1);await L.sleep(1000);await p.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}});await L.loadSim(p);await L.sleep(1500);
    const btn=await p.evaluate(()=>{const b=document.getElementById('hdHomePrintBtn');return b&&{t:b.textContent,primary:b.classList.contains('nbh-btn-primary'),inSheets:!!b.closest('section.only-sheets')};});
    const home=async(file,set)=>{await p.evaluate(set=>{if(set)Object.assign(S.meta,set);renderAll();window.print=()=>{window.dispatchEvent(new Event('beforeprint'));};hdHomePrint();},set||null);await L.sleep(500);
      await p.emulateMedia({media:'print'});await L.sleep(300);L.fs.writeFileSync(file,await p.pdf({preferCSSPageSize:true,printBackground:true}));await p.emulateMedia({media:'screen'});
      await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await L.sleep(200);return readPdf(file);};
    const meta=await p.evaluate(()=>({nick:S.meta.nick,week:S.meta.sh_week,freq:S.meta.freq,how:S.meta.ret_how}));
    const H=await home(OUT+'hd1-home.pdf');const N=H.length;
    const hf='Please send a photo of these on Friday. Questions: Jordan Ellis, 555-0142.';
    const per=H.map((pg,i)=>{const t=flat(pg);return {n:t.includes('Page'+(i+1)+'of'+N),head:t.includes(sq(meta.nick+'’s home sheets'))&&(!meta.week||t.includes(sq('Week of '+meta.week))),foot:t.includes(sq(hf)),rec:/Confidentialstudentrecord|Retaininthestudent|SIM-000|SampleStudent/.test(t)};});
    ok('6 HD-1: "Print the home sheets" is the primary button on the Home sheets sheet',!!btn&&btn.primary&&btn.inSheets&&btn.t==='Print the home sheets',btn);
    ok('6 HD-1\'s home sheets print on their own: Page 1 of '+N+' to '+N+' of '+N+', "'+meta.nick+'’s home sheets · Week of '+meta.week+'" at the head, "'+hf+'" at the foot, no record footer, no full name or ID',
      N>=3&&per.every(x=>x.n&&x.head&&x.foot&&!x.rec)&&/Home Tally Sheet/.test(pageText(H[0])),{N,per:per.filter(x=>!(x.n&&x.head&&x.foot&&!x.rec)).slice(0,3),meta,p1:pageText(H[0]).slice(0,240)});
    const H2=await home(OUT+'hd1-home2.pdf',{nick:'',client:'Mateo Rivera',ret_how:'In the backpack folder',freq:'At the review meeting'});
    const t2=flat(H2[0]);
    ok('6 with no name the family uses, the first name ("Mateo"), on the sheet and at the head; brought back on paper: "Please bring these back on Monday."',
      t2.includes(sq('Mateo’s home sheets'))&&/Child:MateoWeek/.test(t2)&&!/MateoRivera/.test(t2)&&t2.includes(sq('Please bring these back on Monday. Questions: Jordan Ellis, 555-0142.')),t2.slice(0,400));
    /* the form's own Print: the record footer on every page */
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await L.sleep(300);
    L.fs.writeFileSync(OUT+'hd1-all.pdf',await p.pdf({preferCSSPageSize:true,printBackground:true}));const AL=readPdf(OUT+'hd1-all.pdf');
    ok('6 the form\'s own Print keeps the record footer on every page ('+AL.length+' pages)',AL.length>N&&AL.every(pg=>/Retaininthestudent/.test(flat(pg))),AL.length);
    await c.close();}
  /* ---- 7 DD-1's graphs ---- */
  {const c=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',hasTouch:true});await c.clock.setFixedTime(new Date('2026-11-06T10:00:00'));
    const p=await c.newPage();p.on('pageerror',e=>errs.push('DD-1: '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(L.BASE+DD1);await L.sleep(1200);await p.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}});await L.loadSim(p);await L.sleep(2000);
    const axis=()=>p.evaluate(()=>{const sec=document.getElementById('tab-results');const was=sec.classList.contains('hidden');sec.classList.remove('hidden');
      const svg=document.querySelector('#resultsOut .behavior-report svg.graph');const T=[...svg.querySelectorAll('text.dd-xd')];
      const bx=T.map(t=>{const b=t.getBBox();return [b.x,b.x+b.width];});const over=bx.slice(1).filter((b,i)=>b[0]<bx[i][1]+2).length;
      const rot=[...svg.querySelectorAll('text')].filter(t=>/rotate\((?!-?90\b)/.test(t.getAttribute('transform')||'')).length;
      const hits=[...svg.querySelectorAll('.dd-xhit')];const xs=T.map(t=>+t.getAttribute('x'));const gap=xs.length>1?(xs[1]-xs[0]):0;
      const dx=hits.length>1?(+hits[1].getAttribute('x')-+hits[0].getAttribute('x')):1;
      const r={n:T.length,days:hits.length,over,rot,step:Math.round(gap/dx),title:(hits[0]&&hits[0].querySelector('title')||{}).textContent||'',first:(T[0]||{}).textContent||''};if(was)sec.classList.add('hidden');return r;});
    const a20=await axis();
    ok('7 DD-1 at '+a20.days+' days: the dates level (none turned), every '+a20.step+' days, none overlapping; each day\'s full date as its title ("'+a20.title+'")',
      a20.days>=20&&a20.rot===0&&a20.over===0&&a20.step>=2&&a20.step<=5&&a20.n>=Math.floor(a20.days/5)&&/^[A-Z][a-z]{2}, [A-Z][a-z]+ \d{1,2}, 20\d\d$/.test(a20.title)&&/^\d{1,2}\/\d{1,2}$/.test(a20.first),a20);
    /* a tap on a date shows the full date */
    const tip=await p.evaluate(async()=>{const sec=document.getElementById('tab-results');sec.classList.remove('hidden');const h=document.querySelectorAll('#resultsOut .behavior-report svg.graph .dd-xhit')[3];h.scrollIntoView({block:'center'});
      await new Promise(r=>setTimeout(r,200));const b=h.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,want:h.getAttribute('data-dd-day')};});
    await p.touchscreen.tap(tip.x,tip.y);await L.sleep(250);
    const tp=await p.evaluate(()=>{const t=document.getElementById('ddDayTip');return t?{t:t.textContent,on:t.classList.contains('on')&&getComputedStyle(t).opacity!=='0'}:null;});
    ok('7 a tap on a date shows its full date ("'+(tp&&tp.t)+'")',!!tp&&tp.on&&tp.t===tip.want,{tp,tip});
    /* 60 days: further apart, still level and apart */
    await p.evaluate(()=>{const last=S.rows[S.rows.length-1];const d=new Date(last.date+'T12:00:00');let n=0;while(S.rows.length<60&&n<200){n++;d.setDate(d.getDate()+1);if(d.getDay()%6===0)continue;
      const r=JSON.parse(JSON.stringify(last));r.date=localISO(d);r.phaseType='';r.phaseLabel='';S.rows.push(r);}renderAll();});await L.sleep(800);
    const a60=await axis();
    ok('7 DD-1 at '+a60.days+' days: every '+a60.step+' days, level and apart',a60.days>=60&&a60.rot===0&&a60.over===0&&a60.step>=3&&a60.step<=5,a60);
    await p.goto(L.BASE+DD1);await L.sleep(1200);await p.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}});await L.loadSim(p);await L.sleep(2000);
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await L.sleep(600);
    L.fs.writeFileSync(OUT+'dd1.pdf',await p.pdf({preferCSSPageSize:true,printBackground:true}));const D=readPdf(OUT+'dd1.pdf');
    const p1=D[0],lo=Math.max(...p1.L.filter(x=>x[4]<p1.h-40).map(x=>x[4]));
    ok('7 DD-1 printed on its own: page 1 holds the student\'s details, the definitions and the key, filled to '+Math.round(100*lo/p1.h)+'% (not half empty)',lo>0.75*p1.h&&/Howtoreadthesegraphs/.test(flat(p1)),{lo,h:p1.h});
    await c.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
  ok('8 no page errors',!errs.length,errs.slice(0,5));
  await br.close();
  if(!process.env.KEEP_OUT)try{L.fs.readdirSync(OUT).filter(f=>/\.pdf$/.test(f)).forEach(f=>L.fs.unlinkSync(OUT+f));}catch(e){}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
