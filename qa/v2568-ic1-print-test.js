/* v25.68 (W1, the BCBA, 11/6) Form IC-1 on paper, redesigned for the family who reads and signs it. Checked, one item or more
   each: 1 one print gives the family's copy and then, from a page of its own, "For the school's file" (the say-it-back check,
   how consent was obtained, the student's assent, the consent record, the reasonable efforts); "Print the family's copy"
   prints the first alone; 2 a one-page key-information summary first, six boxes of real text with question headings, filled
   from the form, icons hidden from screen readers; 3 12 pt body, bold question headings 2 pt larger or more, more room above
   than below, left aligned, tables with light horizontal rules only; 4 paper, not screen: no form control prints, boxes are
   square and marked with an X, an entry prints as text, an empty field as a line with its label under it, no grey fill;
   5 the decision and the signature lines on one page; 6 one title, on page 1; a running head after it (short title, the
   student, page x of y); the family's footer (who to contact, "Keep this copy"), the file's confidentiality footer; 7 the
   family's language: an interpreter's line when one is used (IC-1 holds no Spanish family version to restyle); 8 the page
   counts of the five simulations, both copies (the family's copy of the signed case in 6 pages or fewer); every entry the
   form printed before prints in the file copy; the page is put back after the print; the saved file is unchanged; the master
   print's copy of the form is as before; the PDF has selectable text and a title.
   Chromium; simulated people only. usage: WS_URL=http://127.0.0.1:PORT node qa/v2568-ic1-print-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const U=L.BASE+'/NBH-Workstation/IC-1_Informed-Consent-FBA-BIP_v2026-09.html';
const SIMS=['signed','reeval','except','noresp','revoke'];
const N=s=>String(s||'').replace(/\s+/g,' ').trim();
/* text compared with its punctuation folded to spaces: pdf.js reads some glyphs of the embedded fonts (a hyphen, a dash, a
   bracket, an apostrophe) as spaces or other marks */
const K=s=>String(s||'').normalize('NFKD').replace(/[^A-Za-z0-9]+/g,' ').trim();const has=(t,...a)=>a.every(x=>K(t).includes(K(x)));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(U);await sleep(1200);
    await p.evaluate(()=>{nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};window.alert=()=>{};});return p;};
  const p=await open();
  const sim=async k=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(700);};
  /* a print, as Chrome saves a PDF (the print's start and end are fired around it); its pages read back with pdf.js */
  const pdf=async fam=>{if(fam)await p.evaluate(()=>window.__ic1Print.family());return await p.pdf({format:'Letter',printBackground:true,preferCSSPageSize:true});};
  const read=buf=>p.evaluate(async b64=>{const lib=await import(location.origin+'/NBH-Workstation/nbh-doc/pdf.min.js');lib.GlobalWorkerOptions.workerSrc=location.origin+'/NBH-Workstation/nbh-doc/pdf.worker.min.js';
    const doc=await lib.getDocument({data:Uint8Array.from(atob(b64),c=>c.charCodeAt(0))}).promise;const meta=await doc.getMetadata().catch(()=>({}));const out=[];
    for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();const H=pg.view[3];const it=tc.items.filter(t=>t.str&&t.str.trim());
      const j=a=>a.map(t=>t.str).join(' ').replace(/\s+/g,' ').trim();
      out.push({head:j(it.filter(t=>t.transform[5]>H-48)),foot:j(it.filter(t=>t.transform[5]<44)),body:j(it.filter(t=>t.transform[5]<=H-48&&t.transform[5]>=44)),n:it.length});}
    return {pages:out,title:(meta.info||{}).Title||''};},Buffer.from(buf).toString('base64'));
  /* the page arranged for paper (the print's start), for the checks that read the page itself */
  const arranged=async(fam,fn)=>{await p.emulateMedia({media:'print'});await p.evaluate(f=>{if(f)window.__ic1Print.family();window.dispatchEvent(new Event('beforeprint'));},fam);await sleep(150);
    const r=await p.evaluate(fn);await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:null});await sleep(150);return r;};
  /* the entries the form printed before this version: every named field on the five printed sheets that is not screen-only or
     hidden, as it showed on paper (a date as month/day/year, a list as the words chosen) */
  const entries=()=>p.evaluate(()=>{const out=[];const dt=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);return m?m[2]+'/'+m[3]+'/'+m[1]:v;};
    document.querySelectorAll('#consent [name],#proc [name],#planproc [name],#assent [name],#record [name]').forEach(f=>{
      if(f.type==='hidden'||f.hidden||f.closest('.noprint,[hidden]')||f.type==='checkbox'||f.type==='radio')return;
      let v=f.tagName==='SELECT'?(f.value?f.options[f.selectedIndex].text:''):f.type==='date'?dt(f.value):f.value;v=String(v||'').replace(/\s+/g,' ').trim();if(v)out.push({n:f.name,v});});return out;});

  /* ================= the signed case ================= */
  await sim('signed');
  /* the page as it stands once it has settled (the simulation's last touches, the wording pencils placed): taken the same
     way before and after the print, so only a change the print made shows (on a busy machine the page was read mid-settle) */
  const settle=async()=>{let last='',same=0;for(let i=0;i<60&&same<4;i++){const h=await p.evaluate(()=>document.body.innerHTML);if(h===last)same++;else{same=0;last=h;}await sleep(250);}};
  await settle();
  const before=await p.evaluate(()=>({html:document.body.innerHTML.replace(/ ic-nodate\b/g,'').replace(/ style="height: [0-9.]+px;"/g,''),vals:JSON.stringify([...document.querySelectorAll('[name]')].map(e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value)),
    names:[...document.querySelectorAll('[name]')].length,cls:document.documentElement.className}));
  const E=await entries();
  const F=await read(await pdf(false));await sleep(300);await settle();
  const after=await p.evaluate(()=>({html:document.body.innerHTML.replace(/ ic-nodate\b/g,'').replace(/ style="height: [0-9.]+px;"/g,''),vals:JSON.stringify([...document.querySelectorAll('[name]')].map(e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value)),cls:document.documentElement.className}));
  const G=await read(await pdf(true));await sleep(300);
  const fp=F.pages,gp=G.pages,fileAt=fp.findIndex(x=>/^For the school.s file/.test(x.body));
  const famTxt=fp.slice(0,fileAt).map(x=>x.body).join(' '),fileTxt=fp.slice(fileAt).map(x=>x.body).join(' '),gTxt=gp.map(x=>x.body).join(' ');
  /* 1 */
  ok('1a one print: the family’s copy first, then "For the school’s file" at the top of a page of its own',fileAt>=4&&fileAt<fp.length-1&&/^For the school.s file Staff use/.test(fp[fileAt].body),{fileAt,n:fp.length,top:fp[fileAt]&&fp[fileAt].body.slice(0,90)});
  const STAFF=['How was consent obtained?','Before you sign: say it back','Student assent','Consent record and contact log','Consent events','Reasonable efforts to obtain consent'];
  ok('1b the staff’s parts (how consent was obtained and its status, say it back, the assent, the consent record, the reasonable efforts) are in the file copy only',
    STAFF.every(s=>fileTxt.includes(s)&&!famTxt.includes(s))&&/Consent status: Current/.test(fileTxt)&&!/Consent status/.test(famTxt),STAFF.map(s=>[s,fileTxt.includes(s),famTxt.includes(s)]));
  ok('1c "Print the family’s copy" prints the consent document alone: the same pages as the family’s part of Print, no school’s file',
    gp.length===fileAt&&!/For the school.s file/.test(gTxt)&&STAFF.every(s=>!gTxt.includes(s))&&/7\. Signatures/.test(gTxt)&&/Which procedures need your separate decision\?/.test(gTxt),{fam:gp.length,fileAt});
  const btn=await p.evaluate(async()=>{const b=document.getElementById('printFamBtn');let seen='',n=0;const wp=window.print;
    window.print=()=>{n++;window.dispatchEvent(new Event('beforeprint'));seen=document.documentElement.className;window.dispatchEvent(new Event('afterprint'));};
    b.click();await new Promise(r=>setTimeout(r,100));window.print=wp;const r=b.getBoundingClientRect();
    return {txt:b.textContent.trim(),n,fam:/\bic-fam\b/.test(seen),pr:/\bic-pr\b/.test(seen),left:/\bic-pr\b/.test(document.documentElement.className),inBar:!!b.closest('.toolbar'),w:Math.round(r.width)};});
  ok('1d the toolbar’s "Print the family’s copy" prints once, as the family’s copy, and leaves nothing behind',btn.txt==='Print the family’s copy'&&btn.n===1&&btn.fam&&btn.pr&&!btn.left&&btn.inBar,btn);
  /* 2 */
  const k1=fp[0].body;
  const KEYH=['What are we asking, and why?','What will happen?','Who does it, where, and for how long?','What are your choices?','Who will see the information?','Questions? Who can you contact?'];
  ok('2a page 1 is the key information: the title, the student, six boxes with question headings, as text',has(k1,'Form IC-1 Revised October 2026','Informed consent for functional behavior assessment and behavior intervention planning','Key information','SIMULATED – Sample Student',...KEYH),
    {k1:k1.slice(0,400),miss:KEYH.filter(h=>!has(k1,h))});
  ok('2b the boxes hold what the form holds: the behavior, why now, the procedures checked, who, where and when, the choices and that consent can be withdrawn, privacy, the contacts',
    has(k1,'Hitting and pushing other students during transitions','The current plan has not reduced the behavior','Record review','Experimental (functional) analysis','Jordan Ellis, M.A., BCBA (simulated), with the classroom teacher',
      'Results shared with you: Written report','I give consent','I give consent with exceptions','I do not give consent','withdraw consent at any time','not undo what was already done','seen by the IEP team and the staff who work with your child','court order',
      'ESE contact / case manager: ESE contact (simulated)')&&!/named above/.test(k1),k1.slice(0,1500));
  ok('2c the key information is one page: the consent begins on page 2',/^About your child and this request/.test(fp[1].body),fp[1].body.slice(0,80));
  const ki=await arranged(false,()=>{const k=document.getElementById('icKey');const r=k.getBoundingClientRect();return {boxes:k.querySelectorAll('section.ic-kb').length,heads:[...k.querySelectorAll('.ic-kbh')].map(h=>{const s=getComputedStyle(h);return s.color+'|'+s.backgroundColor+'|'+s.fontWeight;}),
    icons:k.querySelectorAll('.ic-kbi[aria-hidden="true"] svg').length,img:k.querySelectorAll('img:not(.ic-logo)').length,shown:getComputedStyle(k).display};});
  ok('2d six boxes, bold white headings on navy, one icon beside the text in each, hidden from screen readers; no picture of text',ki.boxes===6&&ki.heads.every(h=>h==='rgb(255, 255, 255)|rgb(24, 46, 67)|700')&&ki.icons===6&&ki.img===0&&ki.shown==='block',ki);
  /* 3 */
  const ty=await arranged(false,()=>{const cs=e=>getComputedStyle(e);const para=document.querySelector('#consent p.method'),q=[...document.querySelectorAll('#consent .ic-q,#proc .ic-q')],li=document.querySelector('#consent ul.rules li');
    const td=document.querySelector('#record #logTbl td');return {p:parseFloat(cs(para).fontSize),li:parseFloat(cs(li).fontSize),al:cs(para).textAlign,q:q.map(h=>[parseFloat(cs(h).fontSize),+cs(h).fontWeight,parseFloat(cs(h).marginTop),parseFloat(cs(h).marginBottom),cs(h).fontStyle,cs(h).textDecorationLine]),
      qt:q.map(h=>h.textContent),td:td?[cs(td).borderLeftWidth,cs(td).borderRightWidth,cs(td).borderBottomWidth,cs(td).backgroundColor]:null};});
  ok('3a body text at 12 pt (16 px), left aligned',ty.p===16&&ty.li===16&&/left|start/.test(ty.al),ty);
  ok('3b headings in sentence case, as questions, bold, 14.5 pt (2.5 pt larger), more room above than below, not italic or underlined',ty.q.length>=7&&ty.q.every(([s,w,mt,mb,st,dec])=>s>=16+2*4/3&&w>=700&&mt>mb&&st==='normal'&&dec==='none')&&
    ['1. Why are we asking?','2. What will the assessment involve?','5. What do you decide?'].every(t=>ty.qt.includes(t)),ty);
  ok('3c tables have light horizontal rules only: no side borders, no fill',ty.td&&ty.td[0]==='0px'&&ty.td[1]==='0px'&&parseFloat(ty.td[2])>0&&/rgba\(0, 0, 0, 0\)|rgb\(255, 255, 255\)/.test(ty.td[3]),ty.td);
  /* 4 */
  const pa=await arranged(false,()=>{const sh='#consent,#proc,#planproc,#icFile,#assent,#record';const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length>0;};
    const ctl=[...document.querySelectorAll(sh.split(',').map(s=>s+' input,'+s+' select,'+s+' textarea').join(','))].filter(vis).map(e=>e.name||e.id||e.type);
    const ticked=[...document.querySelectorAll('#assent input[type=checkbox],#consent input[type=radio]')].filter(e=>e.checked).map(e=>{const b=e.previousElementSibling;return !!(b&&b.classList.contains('ic-bx')&&b.textContent==='X'&&vis(b));});
    const bx=[...document.querySelectorAll('.ic-bx')].filter(vis).slice(0,1).map(b=>{const s=getComputedStyle(b);return [s.width,s.height,s.borderTopWidth];})[0];
    const grey=[...document.querySelectorAll(sh.split(',').map(s=>s+' *').join(','))].filter(e=>vis(e)&&!e.closest('svg')).map(e=>getComputedStyle(e).backgroundColor).filter(c=>!/rgba\(0, 0, 0, 0\)|rgb\(255, 255, 255\)/.test(c));
    const lines=[...document.querySelectorAll('#consent .f .ic-pv.ic-line,#icFile .f .ic-pv.ic-line,#record .f .ic-pv.ic-line,#assent .f .ic-pv.ic-line,.ic-sgc .ic-sgl')].filter(vis).map(l=>{const f=l.closest('.f,.ic-sgc'),lab=f.querySelector('label,.ic-sglab');return lab?lab.getBoundingClientRect().top>=l.getBoundingClientRect().bottom-1:false;});
    const pv=[...document.querySelectorAll('#consent .ic-pv:not(.ic-line)')].filter(vis).map(x=>x.textContent);
    const wide=[...document.querySelectorAll(sh)].filter(vis).some(s=>s.scrollWidth>s.clientWidth+2);
    return {ctl,ticked,bx,grey:[...new Set(grey)],lines:lines.length,linesOk:lines.every(Boolean),pv:pv.slice(0,6),wide,grips:[...document.querySelectorAll('textarea')].filter(vis).length};});
  ok('4a no form control prints: no box, list, date picker or resize grip; each entry is text',!pa.ctl.length&&!pa.grips&&pa.pv.includes('SIMULATED – Sample Student')&&pa.pv.some(v=>/^\d\d\/\d\d\/\d{4}$/.test(v)),pa);
  ok('4b ticked boxes and the chosen choice print as square boxes marked with an X; every box shows',pa.ticked.length>=5&&pa.ticked.every(Boolean)&&pa.bx&&pa.bx[0]===pa.bx[1]&&parseFloat(pa.bx[2])>=1,pa);
  ok('4c an empty field prints as a line with its label under it',pa.lines>=4&&pa.linesOk,pa);
  ok('4d no grey fills or shadows on the printed sheets',!pa.grey.length&&!pa.wide,pa.grey);
  /* 5 */
  const together=pages=>{const i=pages.findIndex(x=>has(x.body,'5. What do you decide?'));return i>=0&&has(pages[i].body,'I give consent for the assessment as described','Exceptions or conditions','7. Signatures','Signature','Date','Printed name','Relationship','Staff member obtaining consent','Consent discussed')?i+1:0;};
  ok('5 the decision, the exceptions and the signature lines (signature, printed name, relationship, date; the staff member’s) are on one page, closing the family’s copy',together(fp)===fileAt&&together(gp)===gp.length,{full:together(fp),fam:together(gp),fileAt,g:gp.length});
  /* 6 */
  const TITLE=/Informed consent for functional behavior assessment and behavior intervention planning/gi;
  ok('6a one title: the masthead and the form’s title once, on page 1; no letterhead on a later page',(fp.map(x=>x.body).join(' ').match(TITLE)||[]).length===1&&!fp.slice(1).some(x=>/Revised October 2026/.test(x.body)),fp.map(x=>(x.body.match(TITLE)||[]).length));
  ok('6b a running head on every page after the first: the short title, the student, page x of y; none on page 1',!fp[0].head&&fp.slice(1).every((x,i)=>has(x.head,'Informed consent for FBA and BIP','SIMULATED – Sample Student · ID SIM-000','Page '+(i+2)+' of '+fp.length)),fp.slice(0,3).map(x=>x.head));
  ok('6c the family’s pages end with who to contact and "Keep this copy"; the file’s with the confidentiality line',fp.slice(0,fileAt).every(x=>has(x.foot,'Questions? BCBA: Jordan Ellis','ESE contact: ESE contact (simulated)','Keep this copy'))&&
    fp.slice(fileAt).every(x=>has(x.foot,"Confidential student record. Retain in the student's behavior file.","For the school's file")&&!/Keep this copy/.test(x.foot))&&gp.every(x=>has(x.foot,'Keep this copy')),{f:fp.map(x=>x.foot.slice(0,60))});
  ok('6d the family’s copy closes with "Keep this copy" and how to withdraw consent, in the form’s words',K(famTxt).endsWith(K('Keep this copy. You may also withdraw consent at any time by telling the BCBA or the ESE contact; we will ask you to confirm it in writing for our records.')),famTxt.slice(-300));
  /* 8 every entry */
  const all=K(fp.map(x=>x.body).join(' '));const miss=E.filter(e=>!all.includes(K(e.v)));
  ok('8a every entry the form printed before prints in the file copy ('+E.length+' entries, the signed case)',E.length>60&&!miss.length,miss.slice(0,8));
  /* (two marks the form's own print has always left until the next print are set aside: ic-nodate on an empty date box, and
     the height it gives each text box as the print starts) */
  ok('8b the print leaves the page as it was: the same page, the same entries, no print class left',after.html===before.html&&after.vals===before.vals&&after.cls===before.cls,{same:after.html===before.html,vals:after.vals===before.vals,cls:[before.cls,after.cls]});
  const own=await p.evaluate(()=>({names:document.querySelectorAll('#icKey [name],#icEnd [name],#icFile [name],#icFileSrc [name],#printFamBtn[name]').length,sheets:[...document.querySelectorAll('#icKey,#icEnd,#icFile,#icFileSrc')].filter(e=>e.closest('.sheet')||e.classList.contains('sheet')).length,
    shown:[...document.querySelectorAll('#icKey,#icEnd,#icFile,#icFileSrc')].filter(e=>getComputedStyle(e).display!=='none').length}));
  ok('8c the saved file is unchanged: the paper parts hold no field; on screen they are not shown and are not sheets',own.names===0&&own.sheets===0&&own.shown===0,own);
  ok('8d the PDF keeps selectable text and the form’s title as its document title',F.title===await p.title()&&/IC-1/.test(F.title)&&fp.every(x=>x.n>8),{title:F.title});
  /* the master print's copy of the form (the bridge's collect), as the workstation receives it */
  const col=await p.evaluate(()=>new Promise(res=>{const h=e=>{if(e.data&&e.data.nbh==='payload'){window.removeEventListener('message',h);res({html:e.data.html||'',css:e.data.css||''});}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');setTimeout(()=>res(null),4000);}));
  ok('8e the master print still takes IC-1 as before: its sheets and entries, nothing from the paper design (the key information, the school’s file, the print’s marks)',
    !!col&&/id="consent"/.test(col.html)&&/id="record"/.test(col.html)&&/Hitting and pushing other students/.test(col.html)&&!/id="icKey"|id="icFile"|ic-pv|ic-bx|ic-q\b|class="[^"]*\bicp\b/.test(col.html)&&/html\.ic-pr/.test(col.css),{len:col&&col.html.length});
  /* 7 the family's language */
  await p.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('c.lang','Spanish');s('s.int.name','Ana Interp (simulated)');s('s.int.lang','Spanish');s('s.int.date','2026-10-30');});
  const sp=await read(await pdf(true));await sleep(200);const spi=sp.pages.findIndex(x=>/7\. Signatures/.test(x.body));
  ok('7a the interpreter’s line prints with the signatures when one is used: name, language, date',spi>=0&&has(sp.pages[spi].body,'Interpreter Ana Interp (simulated) Interpreter (if used) Spanish Language 10/30/2026 Date Staff member obtaining consent'),sp.pages[spi]&&sp.pages[spi].body.slice(-700));
  const es=await p.evaluate(()=>document.querySelectorAll('[lang="es"],[lang^="es-"]').length);
  ok('7b IC-1 prints no Spanish family version, so there is none to restyle; the English copy prints the home language and the interpreter',es===0&&/Home language/.test(sp.pages.map(x=>x.body).join(' ')),es);
  /* 8 the five simulations: page counts, the decision and signatures together, every entry */
  const counts={};
  for(const k of SIMS){await sim(k);const e=await entries();const a=await read(await pdf(false));await sleep(200);const b=await read(await pdf(true));await sleep(200);
    const at=a.pages.findIndex(x=>/^For the school.s file/.test(x.body)),t=K(a.pages.map(x=>x.body).join(' '));
    counts[k]={full:a.pages.length,family:b.pages.length,fileAt:at+1,miss:e.filter(x=>!t.includes(K(x.v))).map(x=>x.n),sig:together(b.pages)===b.pages.length};}
  console.log('     page counts: '+JSON.stringify(counts));
  ok('8f the five simulations print both copies, the family’s copy first and the same pages alone; decision and signatures on one page in each',SIMS.every(k=>counts[k].fileAt>1&&counts[k].family===counts[k].fileAt-1&&counts[k].sig),counts);
  ok('8g every entry prints in the file copy, in all five simulations',SIMS.every(k=>!counts[k].miss.length),SIMS.map(k=>[k,counts[k].miss]));
  ok('8h the family’s copy of the signed case is 6 pages or fewer',counts.signed.family<=6,counts.signed);
  /* the Guide and References, when "Include the guide and references" is ticked: in the file copy only */
  await sim('signed');await p.evaluate(()=>{try{localStorage.setItem('nbh.print.guide','1');}catch(e){}});
  const gd=await read(await pdf(false));const gf=await read(await pdf(true));await p.evaluate(()=>{try{localStorage.removeItem('nbh.print.guide');}catch(e){}});
  const gat=gd.pages.findIndex(x=>/^For the school.s file/.test(x.body)),gt=gd.pages.slice(gat).map(x=>x.body).join(' ');
  ok('8i with the guide and references ticked, they print after the school’s file and never in the family’s copy',gat>0&&has(gt,'Guide: when consent is required','References and sources')&&!/Guide when consent|References and sources/.test(K(gd.pages.slice(0,gat).map(x=>x.body).join(' ')+' '+gf.pages.map(x=>x.body).join(' '))),{gat,n:gd.pages.length,fam:gf.pages.length});
  /* touch: the new button on an iPad */
  const ipad=await br.newContext({viewport:{width:1376,height:1032},userAgent:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',hasTouch:true,isMobile:false});
  const ip=await ipad.newPage();ip.on('pageerror',e=>errs.push(e.message));await ip.goto(U);await sleep(1500);
  /* the toolbar folds to one row on the iPad; More shows the rest, Print and the family's copy among it */
  const more=await ip.$('#nbhMoreBtn');if(more&&await more.isVisible())await more.tap();await sleep(500);
  const tb=await ip.evaluate(()=>{const b=document.getElementById('printFamBtn'),q=document.getElementById('printBtn');const r=b.getBoundingClientRect(),s=q.getBoundingClientRect();return {h:Math.round(r.height),w:Math.round(r.width),ph:Math.round(s.height),row:Math.abs(r.top-s.top)<2,name:b.getAttribute('aria-label')||b.textContent.trim()};});
  ok('9 on the iPad (More) the button sits beside Print, as tall, 44 px or more, and named for what it does',tb.h>=44&&tb.h===tb.ph&&tb.row&&tb.name==='Print the family’s copy',tb);
  await ipad.close();
  ok('10 no page errors',!errs.length,errs.slice(0,5));
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
