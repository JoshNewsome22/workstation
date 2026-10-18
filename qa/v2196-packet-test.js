/* v21.96 the master print reads as one report. Built from the simulated case (13 forms, Mateo Rivera in the bar) and read
   back page by page: the cover is one page and lists each section with its sheets and the References section; every page
   after the cover carries its section's name in the running head; each form opens with a section line and prints its
   letterhead once; no Guide, no reference list and no on-screen note (the simulation, the toolbar) is in the record; the
   forms' citations are gathered once in the last section; Form ABC-1's log prints compact; empty handwriting boxes stay out
   of a form that holds data. Packet options are kept in this browser and change the packet: a form's Guide kept, the
   references with each form or left out, the log in full, the boxes printed. Print this form (a form on its own) carries
   none of the on-screen notes either. Chromium; simulated student only.
   usage: node qa/v2196-packet-test.js      (WS_URL=http://127.0.0.1:PORT) */
const L=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/v2196-packet';L.fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const FORMS=['DM-1','IC-1','RR-1','TB-1','IA-1','OB-1','ABC-1','FS-1','GB-1','TD-1','CR-1','DD-1','PR-1'];
const frameOf=(page,file)=>page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);
(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const log=[];const page=await ctx.newPage();L.wire(page,log);
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');set('#pGrade','5');set('#pBcba','Jordan Ellis, M.A., BCBA (simulated)');try{localStorage.removeItem('nbh.packet');}catch(e){}});
  const files=await page.evaluate(ids=>ids.map(id=>ALL.find(f=>f[0]===id)[2]),FORMS);
  for(let i=0;i<FORMS.length;i++){const id=FORMS[i];await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000}).catch(()=>{});await L.sleep(600);
    const fr=frameOf(page,files[i]);if(!fr){console.log('no frame',id);continue;}await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;});try{await L.loadSim(fr);}catch(e){}await L.sleep(1500);}
  await page.evaluate(()=>gatherFacts(true));await L.sleep(1500);
  /* the packet's document, with the print window stood in for; its pages read with the workstation's own pdf.js */
  async function build(opts){await page.evaluate(o=>{try{if(o)localStorage.setItem('nbh.packet',JSON.stringify(o));else localStorage.removeItem('nbh.packet');}catch(e){}},opts||null);
    const html=await page.evaluate(async ids=>{let doc='';const wo=window.open;window.open=()=>({document:{open(){},write(h){doc+=h;},close(){}},focus(){},print(){},close(){},closed:false});
      try{await masterRun(ALL.filter(f=>ids.includes(f[0])),{});}finally{window.open=wo;}const i=doc.lastIndexOf('<!DOCTYPE html>');return i>=0?doc.slice(i):doc;},FORMS);
    const pp=await ctx.newPage();await pp.setContent(html,{waitUntil:'load'});await L.sleep(1200);await pp.emulateMedia({media:'print'});await L.sleep(300);
    const dom=await pp.evaluate(()=>({secs:[...document.querySelectorAll('.mp-sec')].map(s=>({id:s.id,title:s.dataset.title,bands:s.querySelectorAll('.mp-band').length,heads:s.querySelectorAll('.nbh-print-head').length,keep:s.querySelectorAll('[data-mp-keep]').length,flow:s.querySelectorAll('[data-mp-flow]').length,captions:s.querySelectorAll('caption,tfoot').length,noprint:s.querySelectorAll('.noprint').length,abc:s.getAttribute('data-mp-abc')||''})),
      toc:[...document.querySelectorAll('.mp-cover ol>li')].map(l=>({mk:l.dataset.mk,a:(l.querySelector('a.mp-jump')||{}).dataset&&l.querySelector('a.mp-jump').dataset.mk,sub:(l.querySelector('.mp-sub')||{}).textContent||''})),
      period:(document.querySelector('.mp-cover table')||{}).textContent||'',note:(document.querySelector('.mp-note')||{}).textContent||'',pages:(document.querySelector('style').textContent.match(/@page pg\d+/g)||[]).length}));
    const pdf=await pp.pdf({preferCSSPageSize:true,printBackground:true});await pp.close();
    const texts=await page.evaluate(async b64=>{const lib=await pdfjsLoad();const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const pdf=await lib.getDocument({data:bytes}).promise;const out=[];
      for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();const H=pg.view[3];const it=tc.items.filter(t=>t.str&&t.str.trim()&&Math.hypot(t.transform[2],t.transform[3])>4.5);
        const body=it.filter(t=>t.transform[5]<H-40&&t.transform[5]>36);out.push({t:it.map(t=>t.str).join(' ').replace(/\s+/g,' '),top:it.filter(t=>t.transform[5]>=H-40).map(t=>t.str.trim()).join(' | '),body:body.map(t=>t.str).join(' ').replace(/\s+/g,' '),minY:body.length?Math.min(...body.map(t=>t.transform[5])):H,H});}
      return out;},Buffer.from(pdf).toString('base64'));
    return {html,dom,pdf,texts};}
  const A=await build(null);L.fs.writeFileSync(OUT+'/default.pdf',A.pdf);L.fs.writeFileSync(OUT+'/default.html',A.html);
  const tA=A.texts,N=tA.length;const secStart=tA.map((p,i)=>/SECTION \d+ OF \d+/i.test(p.body)?i+1:0).filter(Boolean);
  ok('1 the packet is built: '+N+' pages, a cover and '+A.dom.secs.length+' sections (the 13 forms and the references), each on a new page with a section line',
    N>100&&A.dom.secs.length===FORMS.length+1&&A.dom.secs[A.dom.secs.length-1].id==='sec-REFS'&&secStart.length===FORMS.length+1&&secStart[0]===2&&A.dom.secs.every(s=>s.bands===1),{N,secs:A.dom.secs.length,secStart});
  ok('2 the cover is one page: student, period from the case, each section with its sheets, the References entry, the confidentiality box',
    secStart[0]===2&&/Period/.test(A.dom.period)&&/Data .*school day/.test(A.dom.period)&&/Consent/.test(A.dom.period)&&A.dom.toc.length===FORMS.length+1&&A.dom.toc.filter(t=>t.sub).length>=10&&/Records Inventory/.test(A.dom.toc[2].sub)&&A.dom.toc[A.dom.toc.length-1].mk==='NBHTOC:REFS;'&&A.dom.toc.every(t=>t.a===t.mk)&&/Confidential student record/.test(tA[0].t)&&/references gathered in the last section/.test(A.dom.note),
    {period:A.dom.period.slice(0,160),toc:A.dom.toc.slice(0,3),note:A.dom.note.slice(0,120)});
  const heads=tA.slice(1).map((p,i)=>({page:i+2,top:p.top}));const miss=heads.filter(h=>!/\b\d+ · /.test(h.top));
  ok('3 every page after the cover names its section in the running head, between the practice and the student',!miss.length&&/^Newsome Behavioral Health \| \d+ · .+ \| Mateo Rivera/.test(heads[0].top),{miss:miss.slice(0,4),first:heads[0]});
  const letter=A.dom.secs.map(s=>s.heads);
  ok('4 each form prints its letterhead once (a section has at most one), after its section line',letter.every(n=>n<=1)&&letter.filter(n=>n===1).length>=10,letter);
  const all=tA.map(p=>p.body).join(' ');
  ok('5 no Guide, no reference sheet and no on-screen note is in the record: nothing about the simulation, the toolbar or Apply to empty fields',
    !/Guide: /.test(all)&&!/References and Sources/.test(tA.slice(1,-8).map(p=>p.body).join(' '))&&!/Load simulation|About the simulation|in the toolbar|Apply to empty fields|Press Apply/.test(all)&&A.dom.secs.every(s=>s.noprint===0),
    {guide:(all.match(/Guide: [^.]{0,40}/)||[])[0],sim:(all.match(/.{30}(Load simulation|About the simulation|in the toolbar).{30}/)||[])[0]});
  const refPages=tA.filter(p=>/\d+ · References and Sources/.test(p.top));const refText=refPages.map(p=>p.body).join(' ');
  const refLines=refText.split(/(?<=\))\s(?=[A-Z])/).length;
  ok('6 the last section gathers every form’s citations, grouped by form: regulations, standards and literature, once each',
    refPages.length>=3&&/Form DM-1/.test(refText)&&/Form IC-1/.test(refText)&&/Form TB-1/.test(refText)&&/34 CFR|34 C\.F\.R\./.test(refText)&&/Journal of Applied Behavior Analysis/.test(refText)&&(refText.match(/Toward a functional analysis of self-injury/g)||[]).length===1&&!/· Revised|· Printed/.test(refText),
    {pages:refPages.length,sample:refText.slice(0,200),dup:(refText.match(/Toward a functional analysis of self-injury/g)||[]).length});
  ok('7 a table’s caption and footer are ordinary rows (the running head needs a named page, under which Chromium breaks between them and the table)',A.dom.secs.every(s=>s.captions===0)&&/Notice Log, Restraint 1/.test(all),A.dom.secs.map(s=>s.captions));
  const low=tA.map((p,i)=>({page:i+1,chars:p.body.length})).filter(x=>x.chars<80);
  ok('8 the sheets run on: fewer than 4 pages carry under 80 characters, and the forms’ sheets are marked to flow or to keep a page',low.length<4&&A.dom.secs.reduce((a,s)=>a+s.flow,0)>=20&&A.dom.secs.find(s=>s.id==='sec-IC-1').keep>=3,{low,flow:A.dom.secs.map(s=>[s.id,s.flow,s.keep])});
  const abcPages=tA.filter(p=>/\d+ · ABC Recording/.test(p.top)).length;
  const boxesA=(tA.filter(p=>/· Function-Based Treatment/.test(p.top)).map(p=>p.body).join(' ').match(/Materials and cues/g)||[]).length;
  ok('9 Form ABC-1’s log prints compact (the section is marked); the filled Materials and cues lines of Form TD-1 print, the empty boxes are judged below',A.dom.secs.find(s=>s.id==='sec-ABC-1').abc==='compact'&&boxesA>0,{abc:A.dom.secs.find(s=>s.id==='sec-ABC-1').abc,boxesA});
  /* ---- the options ---- */
  const B=await build({refs:'form',abc:'full',blanks:true,guides:{'RR-1':true}});L.fs.writeFileSync(OUT+'/kept.pdf',B.pdf);
  const tB=B.texts,allB=tB.map(p=>p.body).join(' ');const rrB=tB.filter(p=>/\d+ · Records Review/.test(p.top)).map(p=>p.body).join(' ');
  const abcB=tB.filter(p=>/\d+ · ABC Recording/.test(p.top)).length;
  ok('10 Packet options: the Guide of Form RR-1 kept (and only that one), the references with each form (no last section), the log in full, the boxes printed',
    /Guide: What a Records Review/.test(rrB)&&(allB.match(/Guide: /g)||[]).length===1&&B.dom.secs.length===FORMS.length&&!B.dom.toc.some(t=>t.mk==='NBHTOC:REFS;')&&/References and Sources/.test(allB)&&abcB>abcPages&&(tB.filter(p=>/· Function-Based Treatment/.test(p.top)).map(p=>p.body).join(' ').match(/Materials and cues/g)||[]).length>boxesA&&tB.length>N,
    {guides:(allB.match(/Guide: [^.]{0,30}/g)||[]).slice(0,3),secs:B.dom.secs.length,abc:[abcB,abcPages],boxes:[boxesA,(tB.filter(p=>/· Function-Based Treatment/.test(p.top)).map(p=>p.body).join(' ').match(/Materials and cues/g)||[]).length],pages:[tB.length,N]});
  const C=await build({refs:'none'});const allC=C.texts.map(p=>p.body).join(' ');
  ok('11 references left out: no last section and no citation foot anywhere',C.dom.secs.length===FORMS.length&&!/References and Sources/.test(allC)&&!/Statements about FERPA and IDEA paraphrase/.test(allC)&&C.texts.length<N,{secs:C.dom.secs.length,pages:[C.texts.length,N]});
  /* ---- the options dialog ---- */
  await page.evaluate(()=>{try{localStorage.removeItem('nbh.packet');}catch(e){}Object.keys(state.ticked||{}).forEach(k=>state.ticked[k]=false);['RR-1','TB-1','ABC-1','DD-1'].forEach(id=>state.ticked[id]=true);renderRail();document.getElementById('packetOpts').click();});await L.sleep(500);
  const dlg=await page.evaluate(()=>({open:document.getElementById('dlg').open,title:document.getElementById('dlgTitle').textContent,guides:[...document.querySelectorAll('[data-po-guide]')].map(c=>c.dataset.poGuide),refs:document.querySelector('input[name="refs"]:checked').value,abc:document.querySelector('input[name="abc"]:checked').value}));
  await page.evaluate(()=>{document.querySelector('[data-po-guide="TB-1"]').click();document.querySelector('input[name="refs"][value="none"]').click();document.getElementById('poDone').click();});await L.sleep(300);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nbh.packet')||'{}'));
  ok('12 Packet options lists the ticked forms that carry a Guide, defaults to one list at the end and the compact log, and keeps the choices in this browser',
    dlg.open&&/Packet options/.test(dlg.title)&&dlg.guides.join()==='RR-1,TB-1'&&dlg.refs==='end'&&dlg.abc==='compact'&&saved.guides&&saved.guides['TB-1']===true&&!saved.guides['RR-1']&&saved.refs==='none'&&!(await page.evaluate(()=>document.getElementById('dlg').open)),{dlg,saved});
  /* ---- a form on its own ---- */
  const one=await ctx.newPage();await one.goto(L.BASE+'/NBH-Workstation/'+files[FORMS.indexOf('TB-1')]);await L.sleep(1200);await one.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;});await L.loadSim(one);await L.sleep(1200);
  await one.emulateMedia({media:'print'});await L.sleep(300);const onePdf=await one.pdf({preferCSSPageSize:true,printBackground:true});await one.close();
  const oneT=await page.evaluate(async b64=>{const lib=await pdfjsLoad();const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const pdf=await lib.getDocument({data:bytes}).promise;let s='';for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();s+=tc.items.map(t=>t.str).join(' ')+' ';}return s.replace(/\s+/g,' ');},Buffer.from(onePdf).toString('base64'));
  ok('13 Print this form (Form TB-1 on its own) still prints its Guide and sheets, without the simulation note or the toolbar sentence (pdf.js splits the fi ligature)',/Guide: What Makes a Quality Target Behavior/.test(oneT)&&/Operational De\s?fi\s?nitions/.test(oneT)&&!/Load simulation|About the simulation|in the toolbar/.test(oneT),{sim:(oneT.match(/.{30}(Load simulation|About the simulation|in the toolbar).{30}/)||[])[0]});
  ok('14 no page errors',!log.filter(l=>l.type==='pageerror').length,log.slice(0,4));
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,700));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
