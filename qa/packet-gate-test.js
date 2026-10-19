/* v22.77 (review I242) the full-packet print gate. The master print is built the way the BCBA builds it: the simulated student
   in the bar, every form of a student's case opened with its worked example (Form TD-1 also with four simulated people signed
   in and the parent's signature, the sign-in of review F476), every one ticked, Build master print pressed, and the print
   window printed to PDF with Chromium (print media, the packet's own page). The PDF is read back page by page with PyMuPDF
   (qa/packet-gate.py) and the release fails when the packet is broken:
     1 every page Letter upright; nothing printed nearer an edge than 0.2 in, and every line of every sheet inside the
       packet's page box (0.62 in top and bottom, 0.45 in each side): the margins are kept (review F475);
     2 every page carries the practice, the student and ID and the FERPA line, "Page N of M" with the right N and M, and a
       form's pages its section's number and name, as the shell's running heads put them (F475, F477);
     3 the cover holds the student and the FERPA notice on its first page, before the contents (F481), and lists every
       ticked form once, in the order the sections print;
     4 no blank page, no page holding only a heading, no page holding one stray line;
     5 no signature line apart from its signer's label: Form TD-1's sign-in cards and every other signature block start and
       end on one page (F476);
     6 the smallest print per form is 6 pt or more (the workstation states no general floor; F483 and SETUP.md's v22.20 call
       print under 6 pt too small, so 6 pt it is);
     7 no Guide (#guide, .only-guide, [data-pane="guide"]) and none of the parts the packet leaves out (the toolbar, buttons,
       screen-only notes, the simulation's note, each form's own reference list, empty handwriting boxes) (F172, F187, F207,
       F317, F413, F426);
     8 the page count per form against qa/packet-gate-baseline.json: a change fails unless WS_PRINT_CHANGED names the form
       (or is "all"); then the new count is listed and written to the baseline.
   v22.77 (review I241) the packet check in the print window:
     10 the window lists the packet's problems before the print dialog (on screen, not on paper, the dialog held), quickly;
        for the simulated packet, the worked examples and their own students, the parts shrunk under 70%, nothing else;
        its estimate of each form's length is near the PDF's; built without the check the packet prints the same pages,
        line for line, and the dialog opens at once;
     11 on a three-form packet, each line and its fix: the bar without a student (Name the student), a form naming another
        student (Leave it out builds again in the same window), a Guide kept (Leave the Guide out), a form not read, an
        empty form, a form far over its usual length, Open Form X; and the same list inside the app installed on an iPad.
   Faults the packet has today, before this gate existed, are listed in the baseline's "known" (each with the form, the
   kind and how many): they are printed as KNOWN on every run and fail only when they grow; a fault anywhere else fails.
   The clock is held at 2026-10-14 10:00 so the worked examples' dates, and so the page counts, are the same every run.
   Simulated data only. About 3 minutes.
   usage: node qa/packet-gate-test.js     (WS_PRINT_CHANGED=all or TD-1,SM-1 when a release changes paper on purpose;
          GATE_FORMS=DM-1,TK-1 for a smaller packet while working (page counts not compared, no baseline written); GATE_UPDATE=1 rewrites the baseline;
          GATE_DEVICE=ipad builds it as an upright iPad does) */
const L=require(__dirname+'/lib.js');const {execFileSync}=require('child_process');
const OUT=__dirname+'/out/packet-gate';L.fs.mkdirSync(OUT,{recursive:true});
const BASEFILE=__dirname+'/packet-gate-baseline.json';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CHANGED=(process.env.WS_PRINT_CHANGED||'').split(',').map(s=>s.trim()).filter(Boolean);
const ONLY=(process.env.GATE_FORMS||'').split(',').map(s=>s.trim()).filter(Boolean);
const FLOOR=6;
/* GATE_DEVICE=ipad: the workstation as an iPad held upright lays it out (820 x 1180, touch, an iPad's user agent); its print
   window measures the packet the same way. Page counts are compared on a laptop's run only. */
const IPAD=process.env.GATE_DEVICE==='ipad';
const BAR={client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School (simulated)',grade:'5',bcba:'Jordan Ellis, M.A., BCBA (simulated)'};
/* the student's case: every form but the staff records (RS-1 is not part of a student's case; Save case leaves it out) */
const FORMS=L.forms().filter(f=>f.id!=='RS-1'&&(!ONLY.length||ONLY.includes(f.id)));
const SIGS='.td85-card,.sigblock,.ic-signpart,.eb-sig,.sig,.hs-sig,.cn-sig';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext(IPAD?{viewport:{width:820,height:1180},hasTouch:true,serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'}:{viewport:{width:1280,height:900},serviceWorkers:'block'});
  /* the workstation keeps 8 forms loaded and puts the rest away (filled again when collected); this case keeps every one */
  await ctx.addInitScript(()=>{window.print=function(){};try{localStorage.setItem('nbh.frames.cap','60');}catch(e){}});
  await ctx.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(b=>{try{localStorage.removeItem('nbh.packet');}catch(e){}   /* Packet options as they come (not in the init script: it runs in the print window too) */
    wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient',b.client);set('#pSid',b.sid);set('#pSite',b.site);set('#pGrade',b.grade);set('#pBcba',b.bcba);},BAR);
  const t0=Date.now();
  for(const f of FORMS){await page.evaluate(id=>openForm(id),f.id);await page.waitForFunction(id=>!!state.status[id],f.id,{timeout:30000}).catch(()=>{});await L.sleep(400);
    const fr=page.frames().find(x=>x.url().endsWith('/'+f.file));if(!fr){errs.push('no frame '+f.id);continue;}
    await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}}).catch(()=>{});
    await L.loadSim(fr);await L.sleep(1100);
    if(f.id==='TD-1')await fr.evaluate(()=>{   /* four people signed in (three drawn signatures, one to sign on paper) and the parent's signature */
      const cv=document.createElement('canvas');cv.width=600;cv.height=150;const c=cv.getContext('2d');c.lineWidth=4;c.strokeStyle='#1a2b3c';c.beginPath();c.moveTo(30,110);
      for(let i=0;i<14;i++)c.quadraticCurveTo(50+i*36,i%2?25:135,70+i*36,95);c.stroke();const img=cv.toDataURL('image/png');
      const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
      const d='2026-10-14',on='signed on the iPad';
      set('ad.sigs',JSON.stringify([{name:'Dana Whitfield (simulated)',role:'ESE teacher',how:on,signed:d,img},{name:'Paula Brennan (simulated)',role:'Paraprofessional',how:on,signed:d,img},
        {name:'Jordan Ellis (simulated)',role:'BCBA',how:on,signed:d,img},{name:'Iris Calloway (simulated)',role:'General education teacher',how:'in person',signed:d}]));
      set('ad.psig',JSON.stringify({name:'Ana Rivera (simulated)',rel:'Parent',how:on,signed:d,img}));});
  }
  await page.evaluate(()=>gatherFacts(true));await L.sleep(1500);
  const td1=FORMS.some(f=>f.id==='TD-1')?await page.frames().find(x=>/\/TD-1_/.test(x.url())).evaluate(()=>document.querySelectorAll('#td85Block .td85-card').length):-1;
  console.log('   ('+FORMS.length+' forms opened with their worked examples in '+Math.round((Date.now()-t0)/1000)+' s'+(td1>=0?'; TD-1 shows '+td1+' sign-in cards':'')+')');
  /* ---- Build master print, as the BCBA presses it ---- */
  const ids=FORMS.map(f=>f.id);
  await page.evaluate(ids=>{Object.keys(state.ticked).forEach(k=>state.ticked[k]=false);ids.forEach(id=>state.ticked[id]=true);renderRail();},ids);
  const want=await page.evaluate(()=>{const L=ALL.filter(([id])=>state.ticked[id]);return (packetOpts().order==='list'?L:mpCaseOrder(L)).map(f=>[f[0],f[1]]);});
  const [win]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#masterPrint').click())]);
  win.on('pageerror',e=>errs.push('print window: '+e.message));
  await win.evaluate(()=>{window.__printed=0;window.print=function(){window.__printed++;};}).catch(()=>{});   /* the print dialog, counted */
  await win.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});await L.sleep(1500);
  await win.emulateMedia({media:'print'});await L.sleep(400);
  /* ---- what the packet's page holds, read as it prints ---- */
  const dom=await win.evaluate(SIGS=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
    const txt=e=>(e.textContent||'').replace(/\s+/g,' ').trim();
    const secs=[...document.querySelectorAll('.mp-sec')].map(s=>s.id.replace(/^sec-/,''));
    const per=sel=>{const o={};document.querySelectorAll(sel).forEach(e=>{if(!vis(e))return;const s=e.closest('.mp-sec');const id=s?s.id.replace(/^sec-/,''):'?';(o[id]=o[id]||[]).push(txt(e).slice(0,60));});return o;};
    const guides=per('.mp-sec #guide,.mp-sec .only-guide,.mp-sec [data-pane="guide"]');
    const left=per('.mp-sec .noprint,.mp-sec .toolbar,.mp-sec button.tool,.mp-sec button.rm,.mp-sec button.addRow,.mp-sec button.delObs,.mp-sec button.nbh-tool,.mp-sec .nbh-pm,.mp-sec input[type="file"],.mp-sec dialog');   /* a form's record buttons (a rating, an interval's mark) are its data */
    const refs=per('.mp-sec:not(.mp-app) #refs,.mp-sec:not(.mp-app) .mp-refblk,.mp-sec:not(.mp-app) .cite');
    const blanks=[...document.querySelectorAll('#sec-TD-1 .defs .drow')].filter(r=>{const l=r.querySelector('.dlab');return l&&/^(Data collected|Materials and cues)$/.test(txt(l))&&!r.querySelector('.nbh-val');}).length+
      [...document.querySelectorAll('#sec-DM-1 #pkTbl tbody tr')].filter(r=>{const cb=r.querySelector('input[type="checkbox"]');return !(cb&&cb.checked)&&!r.querySelector('.nbh-val');}).length;
    const toc=[...document.querySelectorAll('.mp-cover ol>li')].map(l=>(l.dataset.mk||'').replace(/^NBHTOC:|;$/g,''));
    /* the gate's labels on each signature block: a 0 x 0 float of white 3 px text at its start and at its end, as the cover's
       Finish PDF labels are made (a grid or flex block is labelled on its first and last item); nothing may move */
    const blocks=[...document.querySelectorAll(SIGS)].filter(e=>!(e instanceof SVGElement)&&vis(e)&&!e.parentElement.closest(SIGS));
    const rect=e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height].map(v=>Math.round(v*4)/4).join(',');};
    const before=blocks.map(rect).join('|')+'#'+[...document.querySelectorAll('.mp-sec')].map(rect).join('|');
    const flow=e=>{let d=getComputedStyle(e).display;while(/grid|flex|table/.test(d)&&e.firstElementChild){e=e.firstElementChild;d=getComputedStyle(e).display;}return e;};
    const flowEnd=e=>{let d=getComputedStyle(e).display;while(/grid|flex|table/.test(d)&&e.lastElementChild){e=e.lastElementChild;d=getComputedStyle(e).display;}return e;};
    const sig=blocks.map((b,k)=>{flow(b).setAttribute('data-gsa',k);flowEnd(b).setAttribute('data-gsz',k);const s=b.closest('.mp-sec');
      return {k,sec:s?s.id.replace(/^sec-/,''):'?',cls:(b.getAttribute('class')||'').split(' ')[0],text:txt(b).slice(0,50)};});
    const st=document.createElement('style');st.id='gateMarks';
    st.textContent='[data-gsa]::before{content:"GSA" attr(data-gsa) ";"}[data-gsz]::after{content:"GSZ" attr(data-gsz) ";"}'+
      '[data-gsa]::before,[data-gsz]::after{float:left;width:0;height:0;overflow:visible;margin:0;padding:0;border:0;font:normal 3px/1 Arial,Helvetica,sans-serif;color:#fff;white-space:nowrap;pointer-events:none}';
    document.head.appendChild(st);
    const after=blocks.map(rect).join('|')+'#'+[...document.querySelectorAll('.mp-sec')].map(rect).join('|');
    return {secs,guides,left,refs,blanks,toc,sig,moved:before!==after};},SIGS);
  const shorts=await page.evaluate(()=>Object.fromEntries(ALL.map(f=>[f[0],f[1]])));
  const pdfFile=OUT+'/packet.pdf';L.fs.writeFileSync(pdfFile,await win.pdf({preferCSSPageSize:true,printBackground:true}));
  L.fs.writeFileSync(OUT+'/packet.html',await win.content());
  const meta={sections:dom.secs.map((id,i)=>({k:i+1,id,short:id==='REFS'?'References and Sources':shorts[id]||id})),
    practice:'Newsome Behavioral Health',runHead:BAR.client+' · ID '+BAR.sid,student:BAR.client,
    ferpaFoot:'Confidential student record — FERPA protected. Retain in the student\'s behavior file.',
    conf:['Confidential student record. This packet contains personally identifiable','destroy any copy.'],floor:FLOOR,top:0.62,side:0.45,edge:0.2,
    forbid:['Load simulation','About the simulation','Apply to empty fields','Press Apply','\\bGuide: ','References and Sources']};
  L.fs.writeFileSync(OUT+'/meta.json',JSON.stringify(meta));
  const R=JSON.parse(execFileSync('python3',['-I',__dirname+'/packet-gate.py',pdfFile,OUT+'/meta.json'],{encoding:'utf8',maxBuffer:256<<20}));
  L.fs.writeFileSync(OUT+'/gate.json',JSON.stringify(R));
  const N=R.pages;
  console.log('   (the packet: '+N+' pages, a '+R.coverPages+'-page cover and '+dom.secs.length+' sections; '+Math.round((Date.now()-t0)/1000)+' s)');
  /* ---- the baseline: page counts and the faults known before the gate ---- */
  let base=null;try{base=JSON.parse(L.fs.readFileSync(BASEFILE,'utf8'));}catch(e){}
  const known=(base&&base.known)||{};const kn=(id,kind)=>(known[id]||{})[kind]||0;
  const over=(list,kind)=>{const c={};list.forEach(x=>{c[x[1]]=(c[x[1]]||0)+1;});const bad=[],kept=[];
    Object.keys(c).forEach(id=>{(c[id]>kn(id,kind)?bad:kept).push(id+' '+c[id]+(kn(id,kind)?' (known '+kn(id,kind)+')':''));});return {bad,kept,list};};
  const KNOWN=[];const note=(kind,o)=>{if(o.kept.length)KNOWN.push(kind+': '+o.kept.join(', '));};
  /* 1 paper and margins */
  ok('1 every page of the '+N+' is Letter upright (612 x 792 pt)',N>dom.secs.length&&!R.odd.length,R.odd.slice(0,8));
  ok('1 the margins are kept: nothing printed within 0.2 in of an edge, every line and picture of every sheet inside the 0.62 in / 0.45 in page box',!R.margins.length,R.margins.slice(0,8));
  /* 2 the running heads */
  ok('2 every page names the practice, the student and ID, the FERPA line and "Page N of '+N+'"; each form\'s pages its section\'s number and name',!R.heads.length,R.heads.slice(0,6));
  const runs=R.order,inOrder=runs[0]===0&&runs.slice(1).every((k,i)=>k===i+1)&&runs.length===dom.secs.length+1;
  ok('2 the sections print in the order of the contents, each on pages of its own, after the cover',inOrder,runs.slice(0,60));
  /* 3 the cover */
  const tocOK=JSON.stringify(dom.toc)===JSON.stringify(dom.secs)&&JSON.stringify(dom.secs.filter(s=>s!=='REFS'))===JSON.stringify(want.map(w=>w[0]));
  const tocPages=R.tocMarks.every(t=>t[1]<=R.coverPages)&&R.tocMarks.length===dom.secs.length;
  ok('3 the cover\'s first page holds the student and the FERPA notice, before the contents ('+R.coverPages+' cover page'+(R.coverPages===1?'':'s')+')',R.cover.notice&&R.cover.beforeContents&&R.cover.student,R.cover);
  ok('3 the cover lists every ticked form once, in the order the sections print, with the References last ('+dom.toc.length+' entries)',tocOK&&tocPages,{toc:dom.toc.join(),secs:dom.secs.join(),want:want.map(w=>w[0]).join(),marks:R.tocMarks.slice(0,4)});
  /* 4 blank pages */
  const bl=over(R.blank,'blank'),hd=over(R.heading,'heading'),sy=over(R.stray,'stray');note('blank pages',bl);note('a heading alone on a page',hd);note('a stray line alone on a page',sy);
  ok('4 no blank page',!bl.bad.length,bl.list.slice(0,8));
  ok('4 no page holding only a heading',!hd.bad.length,hd.list.slice(0,8));
  ok('4 no page holding one stray line',!sy.bad.length,sy.list.slice(0,8));
  /* 5 signatures */
  const split=dom.sig.filter(s=>{const p=R.sig[s.k]||{};return !(p.A&&p.Z&&p.A===p.Z);}).map(s=>Object.assign({pages:R.sig[s.k]||null},s));
  const td85=dom.sig.filter(s=>s.cls==='td85-card').length;
  ok('5 no signature apart from its signer: all '+dom.sig.length+' signature blocks ('+td85+' of them TD-1\'s sign-in cards) start and end on one page; labelling them moved nothing',
    !split.length&&!dom.moved&&(td1<0||td85===td1)&&Object.keys(R.sig).length===dom.sig.length,{split:split.slice(0,5),moved:dom.moved,td85,td1,labels:Object.keys(R.sig).length});
  /* 6 small print */
  const small=[],smallKnown=[];Object.entries(R.perSec).forEach(([id,r])=>{if(r.minPt==null||r.minPt>=FLOOR)return;const k=kn(id,'minPt');
    (k&&r.minPt>=k-0.05?smallKnown:small).push(id+' '+r.minPt+' pt "'+r.minText+'" p.'+r.minPage+(k?' (known '+k+')':''));});
  if(smallKnown.length)KNOWN.push('print under '+FLOOR+' pt: '+smallKnown.join('; '));
  ok('6 no form prints under '+FLOOR+' pt (the smallest per form is in qa/out/packet-gate/gate.json)',!small.length,small);
  /* 7 what stays out */
  const keyed=o=>Object.entries(o).map(([k,v])=>k+': '+v.length+' ('+v[0]+')');
  ok('7 no Guide prints (#guide, .only-guide, [data-pane="guide"])',!Object.keys(dom.guides).length,keyed(dom.guides));
  ok('7 none of the parts the packet leaves out: no toolbar, tool button or screen-only note, no note about the simulation, no form\'s own reference list (they are gathered at the end), no empty handwriting box in TD-1 or DM-1',
    !Object.keys(dom.left).length&&!Object.keys(dom.refs).length&&dom.blanks===0&&!R.forbid.length,{left:keyed(dom.left),refs:keyed(dom.refs),blanks:dom.blanks,words:R.forbid.slice(0,4)});
  /* 8 page counts */
  const now={};Object.entries(R.perSec).forEach(([id,r])=>{now[id]=r.pages;});
  const was=(base&&base.pages)||{},diff=[],meant=[];
  Object.keys(now).forEach(id=>{if(was[id]===undefined||was[id]===now[id]||ONLY.length||IPAD)return;   /* a smaller packet compares none: a form fed by others' facts (TD-1) prints fewer pages without them */(CHANGED.includes('all')||CHANGED.includes(id)?meant:diff).push(id+' '+was[id]+' > '+now[id]);});
  const fresh=Object.keys(now).filter(id=>was[id]===undefined);
  if(meant.length)console.log('   (paper changed on purpose, WS_PRINT_CHANGED: '+meant.join(', ')+')');
  if(ONLY.length||IPAD)console.log('   (8: '+(IPAD?'an iPad\'s run; page counts are compared on a laptop\'s':'a smaller packet; page counts are compared on the full packet only')+')');
  else ok('8 every form prints the pages the baseline holds'+(base?'':' (no baseline yet: written now)'),!diff.length,diff);
  /* ---- I241: the packet check in the print window ---- */
  const C=await win.evaluate(()=>({chk:window.__nbhCheck,printed:window.__printed,est:window.__nbhPages||{},fit:window.__nbhFitBy||{},
    folded:[...document.querySelectorAll('.mp-sec')].filter(s=>s.querySelector('details:not([open])')).map(s=>s.id.replace('sec-',''))}));
  const shellMs=await page.evaluate(()=>(state.mpLast||{}).ms);
  const items=(C.chk&&C.chk.items)||[];console.log('   (packet check, '+items.length+' line'+(items.length===1?'':'s')+(C.chk?', '+shellMs+' ms in the workstation and '+C.chk.ms+' ms in the window':'')+': '+items.map(t=>t.slice(0,90)).join(' | ')+')');
  const panel=async media=>{await win.emulateMedia({media});return win.evaluate(()=>{const b=document.getElementById('mpCheck');if(!b)return null;const r=b.getBoundingClientRect();return {shown:!b.hidden,h:Math.round(r.height),display:getComputedStyle(b).display,buttons:b.querySelectorAll('button').length};});};
  const onScreen=await panel('screen'),onPaper=await panel('print');
  const simLine=items.find(t=>/hold the worked example \(simulated data\)/.test(t))||'';
  ok('10 I241 the print window lists the packet\'s problems before the print dialog: shown on screen, not on paper, and the dialog waits ('+items.length+' lines)',
    !!C.chk&&C.chk.n===items.length&&items.length>0&&onScreen&&onScreen.shown&&onScreen.h>40&&onPaper.display==='none'&&C.printed===0,{chk:C.chk&&C.chk.n,onScreen,onPaper,printed:C.printed});
  ok('10 it is quick: '+shellMs+' ms in the workstation and '+(C.chk&&C.chk.ms)+' ms in the print window for this '+N+'-page packet (under 250 ms each)',shellMs<250&&C.chk&&C.chk.ms<250,{shellMs,win:C.chk&&C.chk.ms});
  const simIds=(simLine.match(/[A-Z]{2,3}-1/g)||[]);
  ok('10 the simulated packet: one line names the forms holding the worked example ('+simIds.length+' forms), others the forms whose worked example names a student of its own ("SIMULATED \u2013 Sample Student" and two more), not the bar\'s; nothing about the bar, the forms read, the contents or a page rule',
    simIds.length>=Math.min(20,ids.length-1)&&items.filter(t=>/another student/.test(t)).every(t=>/ another student \(.+\), not Mateo Rivera\.$/.test(t))&&
    !items.some(t=>/No student|could not be read|page rule|contents on the cover|prints with it|runs to about/.test(t)),items.filter(t=>!/worked example|of its size/.test(t)).slice(0,4));
  /* the window's estimate of each form's length, against the PDF */
  /* a form whose entries are closed <details> (SR-1's catalogue) prints them open in Chromium, and the window cannot measure what it does
     not lay out: its estimate is low, never high, so it is listed, not held to the range */
  const off=Object.entries(C.est).map(([id,e])=>[id,e,(R.perSec[id]||{}).pages]).filter(x=>x[2]&&(x[1]<x[2]*0.6||x[1]>x[2]*1.5)&&!(C.folded.includes(x[0])&&x[1]<x[2]));
  if(C.folded.length)console.log('   (estimates for forms with closed entries, which print open: '+C.folded.map(id=>id+' '+C.est[id]+' of '+((R.perSec[id]||{}).pages||'?')).join(', ')+')');
  ok('10 the window\'s estimate of each form\'s length is within 0.6 to 1.5 times its pages in the PDF, and no form of the simulated packet is listed as far over its usual length',
    Object.keys(C.est).length===dom.secs.length&&!off.length&&!items.some(t=>/runs to about/.test(t)),{off:off.slice(0,8),n:Object.keys(C.est).length});
  /* it never changes what prints: the same packet without the check prints the same pages, line for line (the gate's white
     labels left aside; this second packet has none, so the labels are shown to move nothing too) */
  const [win2]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(ids=>{const L=ALL.filter(([id])=>ids.includes(id));masterRun(packetOpts().order==='list'?L:mpCaseOrder(L),{check:false});},ids)]);
  win2.on('pageerror',e=>errs.push('print window 2: '+e.message));
  await win2.evaluate(()=>{window.__printed=0;window.print=function(){window.__printed++;};}).catch(()=>{});
  await win2.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});await L.sleep(1500);
  const C2=await win2.evaluate(()=>({chk:window.__nbhCheck,printed:window.__printed,panel:!!document.getElementById('mpCheck')}));
  await win2.emulateMedia({media:'print'});await L.sleep(400);
  const pdf2=OUT+'/packet-nocheck.pdf';L.fs.writeFileSync(pdf2,await win2.pdf({preferCSSPageSize:true,printBackground:true}));await win2.close();
  const same=JSON.parse(execFileSync('python3',['-I','-c',`import sys,json,pymupdf
def sig(f):
    out=[]
    for p in pymupdf.open(f):
        L=[]
        for b in p.get_text('dict')['blocks']:
            if b['type']!=0:
                L.append(['img']+[round(v,1) for v in b['bbox']]); continue
            for l in b['lines']:
                for s in l['spans']:
                    if s['color']!=0xffffff and s['text'].strip(): L.append([s['text'],round(s['bbox'][0],1),round(s['bbox'][1],1),round(s['size'],2)])
        out.append(L)
    return out
A,B=sig(sys.argv[1]),sig(sys.argv[2])
d=[i+1 for i in range(min(len(A),len(B))) if A[i]!=B[i]]
print(json.dumps({'a':len(A),'b':len(B),'n':len(d),'diff':d[:10]}))`,pdfFile,pdf2],{encoding:'utf8',maxBuffer:64<<20}));
  ok('10 the check never changes what prints: built without it, the packet prints the same '+same.b+' pages, every line in the same place; and without it the print dialog opens as before',
    same.a===same.b&&same.n===0&&!C2.panel&&C2.chk===undefined&&C2.printed===1,{same,C2});
  /* the lines that come up, and their fixes, on a small packet (Forms DM-1, TD-1 and GB-1, already filled) */
  const SMALL=['DM-1','TD-1','GB-1'];
  if(SMALL.every(id=>ids.includes(id))){
    const build=async opt=>{const [w]=await Promise.all([page.waitForEvent('popup',{timeout:60000}),page.evaluate(([S,o])=>{masterRun(mpCaseOrder(ALL.filter(([id])=>S.includes(id))),o);},[SMALL,opt||{}])]);
      w.on('pageerror',e=>errs.push('check window: '+e.message));
      await w.evaluate(()=>{window.__printed=0;window.print=function(){window.__printed++;};}).catch(()=>{});
      await w.waitForFunction(()=>window.__nbhCheck!==undefined&&document.querySelector('.mp-sec'),null,{timeout:60000});await L.sleep(300);return w;};
    const lines=w=>w.evaluate(()=>[...document.querySelectorAll('#mpCheck li')].map(l=>({t:l.querySelector('.mpc-t').textContent,b:[...l.querySelectorAll('button')].map(b=>b.textContent)})));
    /* a fix button, in the line that starts with `line` */
    const press=async(w,line,label,again)=>{if(again)await w.evaluate(()=>{window.__nbhCheck=undefined;});
      await w.evaluate(([t,l])=>{const li=[...document.querySelectorAll('#mpCheck li')].find(x=>x.querySelector('.mpc-t').textContent.indexOf(t)===0);
        const b=li&&[...li.querySelectorAll('button')].find(x=>x.textContent===l);if(!b)throw new Error('no button '+l+' in a line "'+t+'"');b.click();},[line,label]).catch(e=>{if(again||/no button/.test(e.message))throw e;});   /* a fix that closes the window may close it under the click */
      if(again)await w.waitForFunction(()=>window.__nbhCheck!==undefined&&document.querySelector('.mp-sec'),null,{timeout:60000});};
    const secsOf=w=>w.evaluate(()=>[...document.querySelectorAll('.mp-sec')].map(s=>s.id.replace('sec-','')).join(','));
    const setBar=v=>page.evaluate(v=>{const e=document.querySelector('#pClient');e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));},v);
    const td=page.frames().find(x=>/\/TD-1_/.test(x.url()));
    /* a student not named */
    await setBar('');let w=await build();let li=await lines(w);
    const nm=li.find(x=>/^No student is named in the bar/.test(x.t));
    await press(w,'No student is named','Name the student');await L.sleep(500);
    const focus=await page.evaluate(()=>document.activeElement&&document.activeElement.id);
    ok('11 no student in the bar: "every page reads Student not named", naming the form that holds one; Name the student closes the window and puts the cursor in the bar',
      !!nm&&/Student not named/.test(nm.t)&&/\(Form DM-1 names [^)]+\)\.$/.test(nm.t)&&w.isClosed()&&focus==='pClient',{nm,closed:w.isClosed(),focus});
    await setBar(BAR.client);await L.sleep(300);
    /* a form naming another student; Leave it out builds the packet again in the same window */
    const nameSel=await td.evaluate(()=>{const S=['[data-m="client"]','[name="m.client"]','[name="s_name"]','[data-meta="client"]','#m_client','#mClient','[name="h-client"]','[name="h.client"]','[name="c.client"]','[name="student"]','[name="s.student"]','#h-client','#hClient','#cClient','#sClient','[name="c.student"]'];return S.find(s=>{const e=document.querySelector(s);return e&&String(e.value||'').trim();})||'';});
    const setTd=v=>td.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));},[nameSel,v]);
    await setTd('Other Student (simulated)');await page.waitForFunction(()=>(state.whoIs||{})['TD-1']==='Other Student (simulated)'&&state.mismatch['TD-1'],null,{timeout:15000}).catch(()=>{});
    w=await build();li=await lines(w);const an=li.find(x=>/^Form TD-1 names another student/.test(x.t));
    await press(w,'Form TD-1 names another student','Leave it out',true);const after=await secsOf(w),tick=await page.evaluate(()=>!!state.ticked['TD-1']);
    ok('11 a form naming another student is listed ("Form TD-1 names another student (Other Student (simulated)), not Mateo Rivera"); Leave it out unticks it and builds the packet again in the same window, without it',
      !!an&&/\(Other Student \(simulated\)\), not Mateo Rivera\./.test(an.t)&&!w.isClosed()&&!/TD-1/.test(after)&&/DM-1/.test(after)&&!tick,{an,after,tick});
    await w.close();await setTd('SIMULATED \u2013 Sample Student');await page.waitForFunction(()=>(state.whoIs||{})['TD-1']!=='Other Student (simulated)',null,{timeout:15000}).catch(()=>{});   /* as its worked example had it */
    await page.evaluate(()=>{state.ticked['TD-1']=true;renderRail();});
    /* a Guide kept in Packet options */
    await page.evaluate(()=>{try{localStorage.setItem('nbh.packet',JSON.stringify({guides:{'DM-1':true}}));}catch(e){}});
    w=await build();li=await lines(w);const gl=li.find(x=>/^The Guide of Form DM-1 prints with it/.test(x.t));
    await press(w,'The Guide of Form DM-1','Leave the Guide out',true);li=await lines(w);const kept=await page.evaluate(()=>JSON.parse(localStorage.getItem('nbh.packet')||'{}').guides||{});
    const gNow=await w.evaluate(()=>!!document.querySelector('#sec-DM-1 #guide'));
    ok('11 a Guide kept in Packet options is listed; Leave the Guide out changes the option and builds again without it',!!gl&&!li.some(x=>/The Guide of/.test(x.t))&&!kept['DM-1']&&!gNow,{gl,kept,gNow});
    await w.close();await page.evaluate(()=>{try{localStorage.removeItem('nbh.packet');}catch(e){}});
    /* a form that could not be read, a form with nothing in it, a form far over its usual length */
    await page.evaluate(()=>{window.__g0=grab;grab=function(id){return id==='GB-1'&&arguments[1]==='collect'?Promise.resolve(null):window.__g0.apply(this,arguments);};
      Object.defineProperty(state.status,'DM-1',{get:()=>({filled:2,total:90,sig:''}),set:()=>{},configurable:true});MP_PAGES['TD-1']=2;});
    w=await build();li=await lines(w);
    await page.evaluate(()=>{grab=window.__g0;delete state.status['DM-1'];MP_PAGES['TD-1']=40;});
    const lost=li.find(x=>/^Form GB-1 could not be read, so it is not in the packet\./.test(x.t)),emp=li.find(x=>/^Form DM-1 is empty: it prints as a blank form\./.test(x.t)),
      long=li.find(x=>/^Form TD-1 runs to about \d+ pages; with its full worked example it takes 2\./.test(x.t));
    ok('11 a ticked form that could not be read, a form with nothing in it and a form far over its usual length are each listed, with Open and Leave it out',
      !!lost&&!!emp&&!!long&&emp.b.join()==='Open Form DM-1,Leave it out'&&long.b.join()==='Open Form TD-1,Leave it out'&&lost.b.join()==='Open Form GB-1',li.map(x=>x.t.slice(0,70)+' ['+x.b.join('/')+']'));
    /* Open closes the window and opens the form */
    await press(w,'Form TD-1 runs to about','Open Form TD-1');await L.sleep(800);const cur=await page.evaluate(()=>state.cur);
    ok('11 Open Form TD-1 closes the print window and opens the form in the workstation',w.isClosed()&&cur==='TD-1',{closed:w.isClosed(),cur});
  }
  /* the app installed on an iPad opens the print window inside itself (an iframe over the page, its own Print and Close): the
     list shows there, the dialog waits, and a fix reaches the workstation through the page around it */
  {const UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const ictx=await br.newContext({viewport:{width:1180,height:820},userAgent:UA,hasTouch:true,serviceWorkers:'block'});
    await ictx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'standalone',{get:()=>true,configurable:true});try{localStorage.setItem('nbh.ws.autosave.on','off');localStorage.setItem('nbh.ws.autosave.v2','off');}catch(e){}});
    const ip=await ictx.newPage();let pops=0;ictx.on('page',()=>pops++);ip.on('pageerror',e=>errs.push('installed app: '+e.message));
    await ip.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1500);
    await ip.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};masterRun(ALL.filter(f=>['DM-1','GB-1'].includes(f[0])),{});});
    await ip.waitForFunction(()=>{const o=document.querySelector('[id^="nbhInApp"]'),f=o&&o.querySelector('iframe');try{return !!(f&&f.contentWindow.__nbhCheck);}catch(e){return false;}},null,{timeout:60000}).catch(()=>{});
    await L.sleep(1500);
    const ia=await ip.evaluate(()=>{const o=document.querySelector('[id^="nbhInApp"]'),f=o&&o.querySelector('iframe'),w=f&&f.contentWindow,d=w&&w.document;
      return {overlay:!!o,chk:w&&w.__nbhCheck,shown:!!(d&&d.getElementById('mpCheck')&&!d.getElementById('mpCheck').hidden)};});
    await ip.evaluate(()=>{const f=document.querySelector('[id^="nbhInApp"] iframe'),d=f.contentWindow.document;const b=[...d.querySelectorAll('#mpCheck button')].find(x=>x.textContent==='Open Form GB-1');b.click();});
    await L.sleep(1200);const ia2=await ip.evaluate(()=>({overlay:!!document.querySelector('[id^="nbhInApp"]'),cur:state.cur}));
    ok('11 installed on an iPad: the list shows inside the app\'s own print window ('+((ia.chk||{}).n||0)+' lines), and Open Form GB-1 there closes it and opens the form',
      ia.overlay&&ia.chk&&ia.chk.n>=2&&ia.shown&&pops===0&&!ia2.overlay&&ia2.cur==='GB-1',{ia,ia2,pops});
    await ictx.close();}
  KNOWN.forEach(k=>console.log('KNOWN '+k));
  if(!errs.length)ok('12 no page errors',true);else ok('12 no page errors',false,errs.slice(0,4));
  /* the baseline: written when there is none, for the forms changed on purpose, or on GATE_UPDATE=1; never from a smaller packet */
  if(!ONLY.length&&!IPAD&&(!base||meant.length||fresh.length||process.env.GATE_UPDATE)&&!diff.length){
    const pages=Object.assign({},was,now);const nb={about:(base&&base.about)||'qa/packet-gate-test.js: the page count of each form in the simulated full packet, and the faults the packet had before the gate.',
      packet:{forms:FORMS.length,pages:N,cover:R.coverPages},pages,known:(base&&base.known)||{}};
    if(process.env.GATE_UPDATE){const k={};const add=(id,kind,v)=>{(k[id]=k[id]||{})[kind]=v;};
      [['blank',R.blank],['heading',R.heading],['stray',R.stray]].forEach(([kind,list])=>list.forEach(x=>add(x[1],kind,((k[x[1]]||{})[kind]||0)+1)));
      Object.entries(R.perSec).forEach(([id,r])=>{if(r.minPt!=null&&r.minPt<FLOOR)add(id,'minPt',r.minPt);});
      Object.keys(k).forEach(id=>{k[id].why=((known[id]||{}).why)||'';});nb.known=k;}
    L.fs.writeFileSync(BASEFILE,JSON.stringify(nb,null,1)+'\n');console.log('   (baseline written: '+BASEFILE.replace(/.*\/qa\//,'qa/')+')');}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
