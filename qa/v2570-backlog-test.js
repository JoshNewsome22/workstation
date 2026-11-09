/* v25.70 the BCBA's backlog answers of 11/9 (DECISIONS "11/9 BCBA answers (backlog)"), as built. Simulated data only: the bar's
   simulated student, the forms' worked examples, a simulated BCBA with a phone in the Staff directory, simulated trainees.
     1 the family's plan on one page, in plain words. Build packet, Family: step 2 lists the page first ("The plan in plain
       words", one page) and shows it as an editable preview: what we are working on (the target behaviors in everyday words),
       how school will help (the replacement skill and the plan's parts, from Form TD-1), what home can do (two to four of
       Form HD-1's family steps or Form CT-1's steps), who to call (the BCBA and the phone of the Staff directory); written at
       about a grade-6 level (Flesch-Kincaid, worked out here), without the field's words, safety events, restraints or record
       numbers; Print / Save PDF waits for Reviewed; a page that names a restraint or holds a record number cannot be ticked;
       the edits are kept with the case (the case file's data, read back by Open case) and no form's saved fields change; a plan
       changed since takes Reviewed away; Start again from the plan writes it again, with Undo; the packet prints the page first,
       on one page, as edited; a screenshot of the preview at 1180 x 820;
     2 one name for the child on every page that goes home: Form HD-1's "Called at home" when it is filled (the packet's title,
       head and foot, the plan page, the home sheets), else Form DM-1's preferred name (the workstation, and Form HD-1 through
       the case), else the first word of the bar's name; read from the case file's copy of HD-1 while it waits to be loaded;
     3 cards on an iPad upright: SA-1's probes, GC-1's record of game days and RM-1's inoculation plan are cards on an iPad held
       upright (1032 x 1376, 820 x 1180), each box under its column's name, nothing wider than the screen; tables on an iPad held
       sideways (1376 x 1032, 1180 x 820) and with a mouse (1300 x 900); turning the iPad turns them, every value as it was; the
       saved file, the CSV export and the print the same upright (cards) as sideways and as without the layout (the shared
       blocks taken out of the page as served), as the fx2 group tests prove it; patch-fx2.py --check on every form;
     4 Form RS-1's filled BACB form signs in Apple Markup and Adobe Acrobat's Fill & Sign: from a stand-in carrying an XFA copy,
       Reader's usage rights (/Perms) and NeedAppearances, the saved copy (read with python3 -I, pymupdf) keeps its fields (not
       flattened; each filled one with its own appearance), no XFA, no /Perms, no NeedAppearances, not encrypted with every
       permission, the signature fields empty, visible, sized and on their page; "How to sign the filled form" beside the fill
       button, for both apps, in the monthly and the final panels, not on paper;
     5 no page errors.
   usage: WS_URL=http://127.0.0.1:8741 node qa/v2570-backlog-test.js   (about 6 minutes) */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;const {execFileSync}=require('child_process');
let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const OUT=__dirname+'/out/v2570-backlog/';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const errs=[];
const BAR={client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School (simulated)',grade:'5',bcba:'Jordan Ellis, M.A., BCBA (simulated)'};
const PEOPLE=JSON.stringify({nbh:'people',v:1,list:[{id:'p-sim-1',name:'Jordan Ellis (simulated)',role:'BCBA',group:'',email:'',phone:'555-0142',site:'',note:'',upd:1}],gone:{},drv:null});
const OPEN=['DM-1','IC-1','FS-1','TD-1','HD-1','CT-1'];
const file=id=>L.forms().find(x=>x.id===id).file;
/* a PDF read with python3 -I (pymupdf): each page's text */
const PAGES=`import sys,json,pymupdf
print(json.dumps([[p.get_text() for p in pymupdf.open(f)] for f in sys.argv[1:]]))`;
const pdfPages=(...f)=>JSON.parse(execFileSync('python3',['-I','-c',PAGES,...f],{encoding:'utf8',maxBuffer:256<<20}));
const sq=t=>String(t).replace(/\s+/g,'');
/* about how hard the words read: the Flesch-Kincaid grade, worked out here on its own */
function fk(t){const S=String(t).split(/[.!?]+(?:\s|$)|\n+/).filter(s=>/[a-z]/i.test(s)),W=String(t).match(/[A-Za-z’']+/g)||[];
  const syl=w=>{w=w.toLowerCase().replace(/[^a-z]/g,'');if(w.length<=3)return 1;w=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');return Math.max(1,(w.match(/[aeiouy]{1,2}/g)||[]).length);};
  return 0.39*W.length/S.length+11.8*W.reduce((n,w)=>n+syl(w),0)/W.length-15.59;}
const JARGON=/\b(mands?|extinction|reinforc\w*|contingen\w*|antecedents?|function(al)?|FCT|BIP|FBA|DRA|DRO|NCR|baseline|criterion|operant|escape|tangible|aggression|self-injur\w*|simulated)\b/i;
const NOGO=/\b(restrain\w*|seclu\w*|incident|crisis|police|911|injur\w*|emergency)\b|4471823|SIM-000|\bForms? [A-Z]{2,3}-\d\b/i;

async function openCase(br){const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  await ctx.addInitScript(P=>{window.print=function(){};try{localStorage.setItem('nbh.people',P);localStorage.removeItem('nbh.packet.est');}catch(e){}},PEOPLE);
  await ctx.clock.setFixedTime(new Date('2026-11-09T10:00:00'));
  const page=await ctx.newPage();page.on('dialog',d=>d.accept().catch(()=>{}));page.on('pageerror',e=>errs.push('shell: '+e.message));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(b=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient',b.client);set('#pSid',b.sid);set('#pSite',b.site);set('#pGrade',b.grade);set('#pBcba',b.bcba);},BAR);
  for(const id of OPEN){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000}).catch(()=>{});await sleep(400);
    const fr=page.frames().find(x=>x.url().endsWith('/'+file(id)));if(!fr)continue;
    await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}}).catch(()=>{});
    await L.loadSim(fr);await sleep(1000);}
  await page.evaluate(()=>gatherFacts(true));await sleep(1500);
  await page.evaluate(()=>{Object.keys(state.ticked).forEach(k=>state.ticked[k]=false);['DM-1','IC-1','HD-1'].forEach(id=>state.ticked[id]=true);renderRail();});
  return {ctx,page};}
const frameOf=(page,id)=>page.frames().find(x=>x.url().endsWith('/'+file(id)));
/* Build packet, Family, step 2 */
async function famStep2(page){await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}$('#masterPrint').click();});await page.waitForSelector('#dlg[open] .pk-card',{timeout:15000});
  await page.evaluate(()=>document.querySelector('.pk-card[data-aud="family"]').click());await page.waitForSelector('#pkSumRev',{timeout:8000});await sleep(300);}
const panel=page=>page.evaluate(()=>({text:Object.fromEntries(FS_KEYS.map(k=>[k,document.querySelector('[data-fs="'+k+'"]').value])),
  labels:[...document.querySelectorAll('.pk-sumpg label')].map(l=>l.textContent),title:$('#pkSumT').textContent,chk:$('#pkSumChk').textContent,rev:$('#pkSumRev').checked,revDis:$('#pkSumRev').disabled,
  print:$('#pkPrint').disabled,sw:!!document.querySelector('[data-pk-sum]')&&document.querySelector('[data-pk-sum]').closest('li').textContent,total:$('#pkTotal').textContent,
  moved:!$('#pkSumNew').hidden,first:document.querySelector('.pk-secs li')&&document.querySelector('.pk-secs li').querySelector('[data-pk-sum]')!==null}));
const type=(page,k,v)=>page.evaluate(([k,v])=>{const t=document.querySelector('[data-fs="'+k+'"]');t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));},[k,v]);
/* every open form's saved file */
const snaps=page=>page.evaluate(async ids=>{const o={};for(const id of ids){const r=await grab(id,'snapshot',null,8000);o[id]=r&&r.snap?JSON.stringify({d:r.snap.data,o:r.snap.own}).replace(/"saved":"[^"]*"/g,''):null;}return o;},OPEN);
async function windowPdf(win,f){await win.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await win.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});await sleep(1200);
  await win.emulateMedia({media:'print'});await sleep(300);
  const secs=await win.evaluate(()=>[...document.querySelectorAll('.mp-sec')].map(s=>s.id.replace(/^sec-/,'')));const title=await win.evaluate(()=>(document.querySelector('.mp-cover h1')||{}).textContent||'');
  fs.writeFileSync(f,await win.pdf({preferCSSPageSize:true,printBackground:true}));return {secs,title,P:pdfPages(f)[0]};}

/* ---- 3: the forms on their own, as the fx2 group tests open them ---- */
const NARROW={'SA-1':['#prTbl','probes'],'GC-1':['#lTbl','record'],'RM-1':['#mitTbl','mit']};
const strip=s=>s.replace(/<style id="fx2-v2492">[\s\S]*?<\/style>\n?/,'').replace(/<script id="fx2-v2492-js">[\s\S]*?<\/script>\n?/,'').replace(/<script id="fx2-cfg">[\s\S]*?<\/script>\n?/,'')
  .replace(/<script>document\.documentElement\.classList\.add\('fx2'\);[^<]*<\/script>\n?/,'');
async function formPage(ctx,id,tag,off){if(off)await ctx.route('**/NBH-Workstation/'+file(id),async r=>{const res=await r.fetch();r.fulfill({response:res,body:strip(await res.text())});});
  await ctx.clock.setFixedTime(new Date('2026-11-09T10:00:00'));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+' '+tag+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/'+file(id));await sleep(1300);await p.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}});
  await L.loadSim(p);await sleep(1800);await p.addStyleTag({content:'#nbhToasts,.nbh-toast{display:none!important}'});
  await p.evaluate(v=>{const b=document.querySelector('[data-view="'+v+'"]');if(b)b.click();},NARROW[id][1]);await sleep(800);return p;}
const tableLook=(p,sel)=>p.evaluate(sel=>{const t=document.querySelector(sel);if(!t)return null;const R=[...t.tBodies[0].rows].filter(r=>r.getClientRects().length);
  const boxes=[...t.querySelectorAll('tbody input:not([type=hidden]),tbody select,tbody textarea')];
  const named=boxes.filter(b=>b.offsetParent).every(b=>{const c=b.closest('td,th');return /\w/.test(getComputedStyle(c,'::before').content.replace(/^none$/,''))||c.getAttribute('data-fx2k')==='title';});
  return {cards:t.classList.contains('fx2-cards'),disp:getComputedStyle(t).display,tr:R[0]?getComputedStyle(R[0]).display:'',rows:R.length,named,
    wide:document.documentElement.scrollWidth-document.documentElement.clientWidth,vals:boxes.map(b=>b.type==='checkbox'?String(b.checked):b.value).join('\u0001')};},sel);
const snapshot=p=>p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='snapshot'&&ev.data.snap){removeEventListener('message',h);res(ev.data.snap);}};addEventListener('message',h);postMessage({nbh:'snapshot'},'*');setTimeout(()=>res(null),10000);}));
const restore=(p,s)=>p.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){removeEventListener('message',h);res(true);}};addEventListener('message',h);postMessage({nbh:'restore',snap:s},'*');setTimeout(()=>res(false),10000);}),s);
const csv=p=>p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='csv-out'){removeEventListener('message',h);res(ev.data.csv);}};addEventListener('message',h);postMessage({nbh:'csv?'},'*');setTimeout(()=>res('(no answer)'),6000);}));
const dj=x=>JSON.stringify(x&&(x.data||x)).replace(/"t[a-z0-9]{9,13}"/g,'"(id)"').replace(/"saved":"[^"]*"/g,'');

/* ---- 4: the BACB stand-in (field names only, as qa/v2568-rs1-bacbpdf-test.js builds them) ---- */
const P=require(path.resolve(L.ROOT,'NBH-Workstation','pdf-lib.min.js'));
const sig2=[['SUPERVISOR_SIGNATURE','s'],['SUPERVISOR_SIGNATURE_DATE','t'],['TRAINEE_SIGNATURE','s'],['TRAINEE_SIGNATURE_DATE','t']],sig1=sig2.slice(0,2);
const M27=[['TRAINEE_NAME','t'],['TRAINEE_BACB_ID','t'],['TRAINEE_CERTIFICATE_MONTH/YEAR','t'],['TRAINEE_FIELDWORK_STATE','t'],['TRAINEE_FIELDWORK_COUNTRY','t'],
  ['RESPONSIBLE_SUPERVISOR_NAME','t'],['RESPONSIBLE_SUPERVISOR_BACB_ID','t'],['Independent_Hours','t'],['Independent_Minutes','t'],['Supervised_Hours','t'],['Supervised_Minutes','t'],
  ['Total_Fieldwork_Hours','r'],['Total_Fieldwork_Minutes','r'],['PERCENT_HOURS_SUPERVISED','r'],['Observation_Hours','t'],['Independent_Minutes 3','t']].concat(sig2,['BACB_ID_BUTTON','BACB_ID_BUTTON 3','INDEPENDENT_HOURS_BUTTON 2','SUPERVISED_HOURS_BUTTON 2'].map(b=>[b,'b']));
async function standIn(list,o){o=o||{};const doc=await P.PDFDocument.create(),pg=doc.addPage([612,792]),form=doc.getForm(),cx=doc.context,N=P.PDFName;let y=770;
  for(const [n,ty] of list){const r={x:40,y,width:200,height:14};y-=19;
    if(ty==='t'||ty==='r'){const f=form.createTextField(n);f.addToPage(pg,r);if(ty==='r'){f.setText('0');f.enableReadOnly();}}
    else if(ty==='b'){const f=form.createButton(n);f.addToPage('?',pg,Object.assign({},r,{width:14}));}
    else if(ty==='s'){const fd=cx.obj({FT:'Sig',T:P.PDFString.of(n),Kids:[]}),fr=cx.register(fd);
      const w=cx.obj({Type:'Annot',Subtype:'Widget',Rect:[260,y,460,y+24],Parent:fr,P:pg.ref,F:4});const wr=cx.register(w);pg.node.addAnnot(wr);fd.get(N.of('Kids')).push(wr);form.acroForm.addField(fr);}}
  if(o.xfa){const s=cx.register(cx.flateStream('<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/"><xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/"><xfa:data/></xfa:datasets></xdp:xdp>'));
    form.acroForm.dict.set(N.of('XFA'),cx.obj([P.PDFString.of('datasets'),s]));}
  if(o.perms)doc.catalog.set(N.of('Perms'),cx.obj({UR3:cx.obj({Type:'Sig',Filter:'Adobe.PPKLite',SubFilter:'adbe.pkcs7.detached',Contents:P.PDFHexString.of('00')})}));
  if(o.need)form.acroForm.dict.set(N.of('NeedAppearances'),P.PDFBool.True);
  /* saved without pdf-lib's own form pass, which would take the XFA out before RS-1 sees it */
  return Buffer.from(await doc.save({updateFieldAppearances:false}));}
/* the PDF as the two apps meet it, read with python3 -I: its catalog and form, each field and widget */
const PDFINFO=`import sys,json,re,pymupdf
d=pymupdf.open(sys.argv[1]);cat=d.pdf_catalog()
def key(x,k):
    t,v=d.xref_get_key(x,k);return t,v
af_t,af_v=key(cat,'AcroForm')
af=d.xref_object(int(af_v.split()[0])) if af_t=='xref' else (af_v if af_t=='dict' else '')
W=[]
for p in d:
    for w in p.widgets():
        o=d.xref_object(w.xref)
        W.append({'name':w.field_name,'type':w.field_type_string,'value':w.field_value if w.field_type!=pymupdf.PDF_WIDGET_TYPE_SIGNATURE else ('signed' if '/V' in d.xref_object(int(re.search(r'/Parent (\\d+)',o).group(1))) else ''),
          'rect':[round(v,1) for v in w.rect],'flags':w.field_flags,'hidden':bool(int((re.search(r'/F (\\d+)',o) or [0,'0'])[1])&2),'ap':'/AP' in o,'page':p.number})
print(json.dumps({'enc':d.is_encrypted,'needpw':d.needs_pass,'perm':d.permissions,'trailerEnc':'/Encrypt' in d.pdf_trailer(),'xfa':'/XFA' in af,'need':bool(re.search(r'/NeedAppearances\\s+true',af)),
  'perms':key(cat,'Perms')[0]!='null','render':key(cat,'NeedsRendering')[0]!='null','af':af[:300],'w':W,'pages':len(d)}))`;
const pdfInfo=f=>JSON.parse(execFileSync('python3',['-I','-c',PDFINFO,f],{encoding:'utf8',maxBuffer:64<<20}));

(async()=>{const br=await L.chromium.launch();
  try{
  /* ================= 1 and 2: the Family packet ================= */
  const t0=Date.now();const {ctx,page}=await openCase(br);console.log('   ('+OPEN.length+' forms opened with their worked examples in '+Math.round((Date.now()-t0)/1000)+' s)');
  const hd=frameOf(page,'HD-1'),dm=frameOf(page,'DM-1');
  const fam0=await hd.evaluate(()=>({called:S.meta.nick,fam:window.hdFamily(),label:document.querySelector('[data-m="nick"]').closest('div').querySelector('label').textContent}));
  const cgSteps=await page.evaluate(()=>(((state.facts||{}).caregiver||{}).steps||[]).map(x=>x.d));
  const before=await snaps(page);
  await famStep2(page);const s1=await panel(page);
  await page.evaluate(()=>document.querySelector('.pk-sum').scrollIntoView({block:'start'}));await sleep(300);
  await page.screenshot({path:OUT+'family-summary-1180x820.png'});
  ok('1 Build packet, Family: step 2 lists the plan in plain words first, one page, with a switch ("'+s1.sw.replace(/\s+/g,' ').trim()+'"), and counts it ('+s1.total+')',
    s1.first&&/The plan in plain words/.test(s1.sw)&&/about 1 page/.test(s1.sw)&&/4 sections/.test(s1.total),s1);
  ok('1 the editable preview: "'+s1.title+'", four parts (what we are working on, how we will help at school, what you can do at home, who to call), each a box',
    s1.labels.map(x=>x.replace(/\s*\(.*$/,'')).join('|')==='What we are working on|How we will help at school|What you can do at home|Who to call'&&s1.title==='Sam’s plan at school',s1.labels);
  const T=s1.text,all=Object.values(T).join('\n'),home=T.home.split('\n').filter(Boolean),teach=T.teach.split('\n').filter(Boolean);
  ok('1 what we are working on: the target behaviors in everyday words (hurting adults at school; hurting himself, like hitting his own head), when they happen and the goal',
    /hurting adults at school/.test(T.work)&&/hitting his own head/.test(T.work)&&/work is hard or long/.test(T.work)&&/happen less/.test(T.work),T.work);
  ok('1 how school will help: the replacement skill from Form TD-1 (the break card) and '+(teach.length-1)+' of the plan\'s parts as what adults do',
    /better way to ask for a break: press the break card/.test(teach[0]||'')&&teach.length>=3&&teach.length<=5,teach);
  const fromForms=home.filter(h=>fam0.fam.steps.concat(cgSteps).some(s=>sq(s).toLowerCase().replace(/\.$/,'')===sq(h).toLowerCase().replace(/\.$/,'')));
  ok('1 what home can do: '+home.length+' items (2 to 4), from Form HD-1\'s family steps or Form CT-1\'s steps',home.length>=2&&home.length<=4&&fromForms.length===home.length,{home,hd:fam0.fam.steps,ct:cgSteps});
  ok('1 who to call: the BCBA and the phone the Staff directory holds ("'+T.call.slice(0,60)+'…")',/Jordan Ellis at 555-0142/.test(T.call)&&!/M\.A\.|BCBA/.test(T.call),T.call);
  const g=fk(all);
  ok('1 plain language: about a grade-6 level (Flesch-Kincaid '+g.toFixed(1)+'; the page says "'+(s1.chk.match(/grade \d+/)||[''])[0]+'"), none of the field\'s words',g<=7&&g>=2&&!JARGON.test(all)&&/Reads at about grade [4-7]/.test(s1.chk),{g,j:(all.match(JARGON)||[])[0],chk:s1.chk});
  ok('1 it leaves out safety events, restraints, the crisis plan and record numbers (the student ID, form names)',!NOGO.test(all),(all.match(NOGO)||[])[0]);
  ok('1 Print / Save PDF waits for Reviewed',s1.print&&!s1.rev&&!s1.revDis,s1);
  /* a restraint named, or a record number: Reviewed cannot be ticked */
  await type(page,'work',T.work+' A restraint was used on 10/2.');await sleep(150);const s2=await panel(page);
  await type(page,'work',T.work+' Student ID 4471823.');await sleep(150);const s2b=await panel(page);
  await type(page,'work',T.work);await sleep(150);const s2c=await panel(page);
  ok('1 a page that names a restraint, or holds the student ID, cannot be ticked Reviewed, and says why; taken out, it can',s2.revDis&&/restraint/i.test(s2.chk)&&s2b.revDis&&/record number/.test(s2b.chk)&&!s2c.revDis,{s2:s2.chk,s2b:s2b.chk});
  /* the BCBA's edits, then Reviewed */
  const mine=home.concat(['Read a picture book together before bed and point to the pictures.']).join('\n');
  await type(page,'home',mine);await page.evaluate(()=>$('#pkSumRev').click());await sleep(200);const s3=await panel(page);
  const kept=await page.evaluate(()=>({S:JSON.parse(JSON.stringify(state.famSum)),file:JSON.parse(JSON.stringify(caseData(packet(),{},'sim'))).famSum,sig:/\|SUM:/.test(caseSig())}));
  ok('1 Reviewed ticked: Print / Save PDF is on; the edits and the review are kept with the case (in the case file\'s data, and in what marks it unsaved)',
    !s3.print&&s3.rev&&kept.S&&kept.S.text&&kept.S.text.home===mine&&!!kept.S.reviewed&&JSON.stringify(kept.file)===JSON.stringify(kept.S)&&kept.sig,{s3:s3.print,kept});
  /* Open case reads them back */
  const back=await page.evaluate(d=>{const was=state.famSum;state.famSum=null;famSumIn({famSum:d});const r=JSON.parse(JSON.stringify(state.famSum));state.famSum=was;return r;},kept.file);
  ok('1 a case file opened again brings the page back as edited and reviewed',JSON.stringify(back)===JSON.stringify(kept.S),{back,kept:kept.S});
  await famStep2(page);const s4=await panel(page);
  ok('1 Build packet again: the page as edited, still Reviewed',s4.text.home===mine&&s4.rev&&!s4.print,s4.text.home);
  /* ================= 2: "Called at home" first ================= */
  await hd.evaluate(()=>{const e=document.querySelector('[data-m="nick"]');e.value='Mati';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
  const n1=await page.evaluate(()=>({first:pkFirst(packet().client)}));const hd1=await hd.evaluate(()=>({first:hdFirst(),child:(document.querySelector('#sheetOut .hs-who')||{}).textContent||''}));
  ok('2 Form HD-1\'s label reads "Called at home"; filled ("Mati"), it names the child on the family\'s pages: the workstation ('+n1.first+') and the home sheets ('+hd1.first+')',
    /^Called at home/.test(fam0.label)&&n1.first==='Mati'&&hd1.first==='Mati'&&/Child:\s*Mati/.test(hd1.child),{label:fam0.label,n1,hd1});
  /* the packet: built from the reviewed page */
  await famStep2(page);const s5=await panel(page);
  ok('2 the plan page follows it ("'+s5.title+'"); the review stands (the plan has not changed)',s5.title==='Mati’s plan at school'&&s5.rev&&!s5.print,s5.title);
  const [w]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#pkPrint').click())]);w.on('pageerror',e=>errs.push('family window: '+e.message));
  const fa=await windowPdf(w,OUT+'family.pdf');await w.close();
  const at=fa.P.findIndex(t=>/Mati’s plan at school/.test(t)),sp=fa.P[at]||'',nx=fa.P[at+1]||'';
  ok('1 the Family packet prints the plan in plain words first, on one page of its own ('+fa.P.length+' pages; sections '+fa.secs.join(', ')+')',
    fa.secs.join()==='SUM,IC-1,CT-1,HD-1'&&at===1&&/NBHSEC:SUM;/.test(sq(sp))&&/NBHSEC:IC-1;/.test(sq(nx))&&!/What you can do at home/.test(nx),{secs:fa.secs,at});
  ok('1 it prints as edited and reviewed: the four parts, the BCBA\'s own line, the phone; no record number, restraint or crisis',
    ['What we are working on','How we will help at school','What you can do at home','Who to call'].every(h=>sp.includes(h))&&sq(sp).includes(sq('Read a picture book together before bed'))&&/555-0142/.test(sp)&&!NOGO.test(sp.replace(/NBH[A-Z]+[^\n]*/g,'')),sp.slice(0,600));
  const famPages=fa.P.slice(1);
  ok('2 every family page names the child by "Called at home": the title ("'+fa.title+'"), the head and the foot (For Mati’s family), the home sheets (Child: Mati)',
    fa.title==='Mati’s plan, for the family'&&famPages.every(t=>sq(t).includes(sq('Mati’s plan · for the family'))&&sq(t).includes(sq('For Mati’s family. Questions: Jordan Ellis, 555-0142.')))&&fa.P.some(t=>/Child:\s*Mati/.test(t))&&!fa.P.some(t=>/Child:\s*Sam\b/.test(t)),fa.title);
  const after=await snaps(page);const chg=OPEN.filter(id=>id!=='HD-1'&&before[id]!==after[id]);
  ok('1 the page\'s edits change no form\'s saved fields (every open form\'s file the same, HD-1 but for its name)',!chg.length&&OPEN.every(id=>before[id]),chg);
  /* empty: Form DM-1's preferred name, at the workstation and in Form HD-1 through the case */
  await hd.evaluate(()=>{const e=document.querySelector('[data-m="nick"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
  await dm.evaluate(()=>{const e=document.querySelector('[name="s.pref"]');e.value='Teo';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.evaluate(()=>gatherFacts(true));await sleep(2500);
  const n2=await page.evaluate(()=>pkFirst(packet().client)),hd2=await hd.evaluate(()=>({first:hdFirst(),child:(document.querySelector('#sheetOut .hs-who')||{}).textContent||'',head:hdHomeHead()}));
  ok('2 "Called at home" empty: Form DM-1\'s preferred name ("Teo") at the workstation ('+n2+') and on Form HD-1\'s sheets, through the case ('+hd2.first+'; '+hd2.head+')',
    n2==='Teo'&&hd2.first==='Teo'&&/Child:\s*Teo/.test(hd2.child)&&/^Teo’s home sheets/.test(hd2.head),{n2,hd2});
  await famStep2(page);const s6=await panel(page);
  ok('2 the plan page follows ("'+s6.title+'"): its words, the BCBA\'s edits among them, name Teo, and the review stands (only the name changed)',s6.title==='Teo’s plan at school'&&/helping Teo/.test(s6.text.work)&&!/\bSam\b/.test(Object.values(s6.text).join(' '))&&s6.text.home.includes('picture book')&&s6.rev&&!s6.print&&!s6.moved,{t:s6.title,w:s6.text.work.slice(0,80),rev:s6.rev,moved:s6.moved});
  /* the plan itself changed (another replacement skill on Form TD-1): Reviewed is taken away until the page is read again */
  const rep0=await page.evaluate(()=>{const r=state.facts.plan.rep;state.facts.plan.rep='point to the break card';return r;});
  await famStep2(page);const s6b=await panel(page);await page.evaluate(r=>{state.facts.plan.rep=r;},rep0);
  ok('1 a plan changed since the review: the page says so, Reviewed is off and Print / Save PDF waits again; the edits are kept',s6b.moved&&!s6b.rev&&s6b.print&&s6b.text.home.includes('picture book'),{moved:s6b.moved,rev:s6b.rev});
  await dm.evaluate(()=>{const e=document.querySelector('[name="s.pref"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.evaluate(()=>gatherFacts(true));await sleep(2500);
  const n3=await page.evaluate(()=>pkFirst(packet().client)),hd3=await hd.evaluate(()=>hdFirst());
  ok('2 neither filled: the first word of the student\'s name ('+n3+' at the workstation, '+hd3+' on Form HD-1\'s own student box)',n3==='Mateo'&&!!hd3&&!/^(Sam|Teo|Mati)$/.test(hd3),{n3,hd3});
  /* Form HD-1 waiting in the case file (put away, not loaded): its "Called at home" from the file's copy */
  const pend=await page.evaluate(()=>{const was=state.pending['HD-1'];state.pending['HD-1']={title:'HD-1',status:{filled:9,sig:'x'},snap:{own:JSON.stringify({form:'HD-1',S:{meta:{nick:'Mati'},sk:[{label:'Praise the first step',who:'Adult'}]}})}};
    const r={first:pkFirst(packet().client),steps:fsHomeSteps()};if(was)state.pending['HD-1']=was;else delete state.pending['HD-1'];return r;});
  ok('2 Form HD-1 waiting in the case file: "Called at home" and its family steps read from the file\'s copy',pend.first==='Mati'&&pend.steps.join()==='Praise the first step',pend);
  /* Start again from the plan, with Undo */
  const s7=await page.evaluate(async()=>{const before=JSON.stringify(state.famSum);$('#pkSumReset').click();await new Promise(r=>setTimeout(r,200));
    const draft=document.querySelector('[data-fs="home"]').value,undo=document.querySelector('.ws-undo-row .ws-undo-b, .ws-undo-b');const mid=state.famSum;if(undo)undo.click();await new Promise(r=>setTimeout(r,400));
    return {mid,undo:!!undo,draftHasMine:/picture book/.test(draft),after:JSON.stringify(state.famSum)===before};});
  ok('1 Start again from the plan writes the page again from the plan (no question first), and Undo brings the edits back',s7.mid===null&&s7.undo&&!s7.draftHasMine&&s7.after,s7);
  await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
  await ctx.close();

  /* ================= 3: cards on the iPad upright ================= */
  const ipad=await L.ipadBrowser(pw);console.log('   (the iPad\'s engine: '+ipad._nbhEngine+')');
  for(const id of Object.keys(NARROW)){const sel=NARROW[id][0];const look={};
    for(const [w,h] of [[1032,1376],[820,1180],[1376,1032],[1180,820]]){const c=await L.ipadCtx(ipad,{viewport:{width:w,height:h}});const p=await formPage(c,id,w+'x'+h);look[w]=await tableLook(p,sel);
      if(w===820){await p.evaluate(sel=>document.querySelector(sel).scrollIntoView({block:'start'}),sel);await sleep(200);await p.screenshot({path:OUT+id+'-upright-820.png'});}
      if(w===1032){/* turned: sideways, then upright again, on the same page */
        await p.setViewportSize({width:1376,height:1032});await sleep(700);look.turned=await tableLook(p,sel);await p.setViewportSize({width:1032,height:1376});await sleep(700);look.back=await tableLook(p,sel);}
      await c.close();}
    const mc=await br.newContext({viewport:{width:1300,height:900}});const mp=await formPage(mc,id,'mouse');look.mouse=await tableLook(mp,sel);await mc.close();
    const up=[look[1032],look[820]],side=[look[1376],look[1180],look.mouse];
    ok(`3 ${id}: ${sel} is cards on an iPad held upright (1032 x 1376 and 820 x 1180), each box under its column's name, nothing wider than the screen (${look[1032].rows} entries)`,
      up.every(x=>x&&x.cards&&x.disp==='block'&&x.tr==='grid'&&x.named&&x.wide<=1&&x.rows>0),up);
    ok(`3 ${id}: a table on an iPad held sideways (1376 x 1032, 1180 x 820) and with a mouse (1300 x 900)`,side.every(x=>x&&!x.cards&&x.disp==='table'&&x.tr==='table-row'),side);
    ok(`3 ${id}: turning the iPad turns it (sideways a table, upright cards again), every value as it was`,look.turned&&!look.turned.cards&&look.turned.tr==='table-row'&&look.back.cards&&look.back.tr==='grid'&&look.turned.vals===look[1032].vals&&look.back.vals===look[1032].vals,
      {turned:look.turned&&look.turned.tr,back:look.back&&look.back.tr});
    /* the saved file, the CSV and the print: upright (cards) as sideways and as without the layout */
    const run=async(w,h,off)=>{const c=await L.ipadCtx(ipad,{viewport:{width:w,height:h}});const p=await formPage(c,id,w+'x'+h+(off?' (no layout)':''),off);const s=await snapshot(p),v=await csv(p);
      const cards=await p.evaluate(sel=>{const t=document.querySelector(sel);return !!t&&t.classList.contains('fx2-cards');},sel);
      if(s0)await restore(p,s0);await sleep(1500);
      await p.emulateMedia({media:'print'});await p.evaluate(()=>dispatchEvent(new Event('beforeprint')));await sleep(900);
      const f=OUT+id+'-'+w+(off?'-without':'')+'.pdf';fs.writeFileSync(f,await p.pdf({preferCSSPageSize:true,printBackground:true}));await c.close();return {s,v,f,cards};};
    let s0=null;const A=await run(1032,1376,false);s0=A.s;const B=await run(1376,1032,false),C=await run(1032,1376,true);
    ok(`3 ${id}: the saved file is the same upright (cards) as sideways (a table) and as without the layout; the CSV export the same (${A.v==null?'none':String(A.v).split('\n').length+' lines'})`,
      !!A.s&&A.cards&&!B.cards&&dj(A.s)===dj(B.s)&&dj(A.s)===dj(C.s)&&A.v===B.v&&A.v===C.v&&A.v!=='(no answer)',{a:!!A.s,cards:[A.cards,B.cards],csv:[A.v===B.v,A.v===C.v]});
    const [pa,pb,pc]=pdfPages(A.f,B.f,C.f);const same=(x,y)=>x.length===y.length&&x.every((t,i)=>t===y[i]);
    ok(`3 ${id}: the print is the same upright (cards on screen) as sideways and as without the layout (${pa.length} pages, the same text on every page)`,pa.length>0&&same(pa,pb)&&same(pa,pc),
      {n:[pa.length,pb.length,pc.length],at:pa.findIndex((t,i)=>t!==pc[i])});}
  /* the tables the forms already showed as cards stay cards sideways (SA-1's steps, GC-1's teams) */
  {const c=await L.ipadCtx(ipad,{viewport:{width:1376,height:1032}});const p=await formPage(c,'GC-1','sideways');const tm=await p.evaluate(()=>{const t=document.querySelector('#tmTbl');return t&&t.classList.contains('fx2-cards');});await c.close();
    ok('3 the lists that were already cards stay cards on the iPad sideways (GC-1\'s teams)',tm===true,tm);}
  {const forms=fs.readdirSync(path.join(L.ROOT,'NBH-Workstation')).filter(f=>/^[A-Z].*\.html$/.test(f)).map(f=>path.join(L.ROOT,'NBH-Workstation',f));
    const r=require('child_process').spawnSync('python3',[path.join(L.ROOT,'tools','blocks','patch-fx2.py'),'--check',...forms],{encoding:'utf8'});const cur=(r.stdout.match(/^current /mg)||[]).length;
    ok(`3 patch-fx2.py --check: every form holds the shared layout's copy (${cur} forms)`,r.status===0&&cur>=48,(r.stdout+r.stderr).slice(-400));}
  await ipad.close();

  /* ================= 4: RS-1's filled BACB form, for Apple Markup and Adobe Acrobat ================= */
  {const ctx=await br.newContext({viewport:{width:1376,height:1032}});await ctx.clock.setFixedTime(new Date('2027-03-15T10:00:00'));
    const page=await ctx.newPage();page.on('pageerror',e=>errs.push('RS-1: '+e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(L.BASE+'/NBH-Workstation/'+file('RS-1'));await sleep(900);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.print=()=>{};});
    await page.click('[data-rsmode="trainee"]');await sleep(250);await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(1000);
    await page.evaluate(()=>{setView('print');window.__rsTrainee.setKey('2027-01');});await sleep(300);
    const how=await page.evaluate(()=>[...document.querySelectorAll('.tr-bacb-how')].map(d=>{const pn=d.closest('.tr-bacb'),b=pn&&pn.querySelector('[data-trbacb]');d.open=true;
      return {panel:pn&&pn.id,after:!!(b&&(b.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING)),text:d.textContent.replace(/\s+/g,' '),sum:Math.round(d.querySelector('summary').getBoundingClientRect().height),noprint:!!d.closest('.noprint')};}));
    ok('4 "How to sign the filled form" beside the fill buttons, in the monthly and the final panels, for Apple Markup and Adobe Acrobat\'s Fill & Sign; not on paper; a 44 px summary',
      how.length===2&&how[0].panel==='trBacbM'&&how[1].panel==='trBacbF'&&how.every(h=>h.after&&h.noprint&&h.sum>=44&&/Apple Markup/.test(h.text)&&/Add Signature/.test(h.text)&&/Fill & Sign/.test(h.text)&&/Create signature/.test(h.text)&&/digital ID/.test(h.text)&&/date/.test(h.text))&&
      /supervisor and the trainee sign the same copy/.test(how[0].text),how.map(h=>Object.assign({},h,{text:h.text.slice(0,140)})));
    const src=await standIn(M27,{xfa:true,perms:true,need:true});fs.writeFileSync(OUT+'standin-M27i.pdf',src);
    const si=pdfInfo(OUT+'standin-M27i.pdf');
    const [fc]=await Promise.all([page.waitForEvent('filechooser'),page.click('[data-trbacb="month"]')]);await fc.setFiles({name:'M-FVF-Individual-2027.pdf',mimeType:'application/pdf',buffer:src});
    await page.waitForFunction(()=>{const o=document.querySelector('#trBacbOut');return o&&/Not filled|Save the filled form/.test(o.textContent);},null,{timeout:30000}).catch(()=>{});
    const res=await page.evaluate(()=>document.querySelector('#trBacbOut').textContent.replace(/\s+/g,' '));
    const saved=await page.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL;let blob=null;URL.createObjectURL=b=>{URL.createObjectURL=mk;blob=b;return 'blob:x';};
      const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;const name=this.download;
        blob.arrayBuffer().then(ab=>{const u=new Uint8Array(ab);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
          setTimeout(()=>res({name,b64:btoa(s),after:document.querySelector('#trBacbOut').innerText}),50);});};
      const b=document.querySelector('[data-trbacbsave="month"]');if(!b)return res(null);b.click();}));
    ok('4 the stand-in (an XFA copy, Reader\'s usage rights and NeedAppearances, as some forms from Acrobat carry) is recognised, filled and saved',si.xfa&&si.perms&&si.need&&!!saved&&/Save the filled form/.test(res)&&/Apple Markup or Adobe Acrobat/.test(saved.after),{si:{xfa:si.xfa,perms:si.perms,need:si.need},res:res.slice(0,300),after:saved&&saved.after});
    if(saved){fs.writeFileSync(OUT+saved.name,Buffer.from(saved.b64,'base64'));const I=pdfInfo(OUT+saved.name);
      const W=I.w,txt=W.filter(x=>x.type==='Text'),sig=W.filter(x=>x.type==='Signature'),filled=txt.filter(x=>String(x.value||'').trim());
      ok('4 filled, not flattened: every field of the BACB\'s form is still a field ('+W.length+' of '+si.w.length+'), the '+filled.length+' filled ones each with its own appearance (both apps show the value as written)',
        W.length===si.w.length&&filled.length>=10&&filled.every(x=>x.ap),{n:[W.length,si.w.length],noAp:filled.filter(x=>!x.ap).map(x=>x.name)});
      ok('4 no XFA, no extended-rights stamp, no request to draw the fields again or to render from XFA',!I.xfa&&!I.perms&&!I.need&&!I.render,{xfa:I.xfa,perms:I.perms,need:I.need,render:I.render,af:I.af});
      ok('4 not encrypted and no password: every permission open, so neither app is blocked from signing or saving',!I.enc&&!I.needpw&&!I.trailerEnc&&(I.perm===-1||(I.perm&(4|8|32|256))===(4|8|32|256)),{enc:I.enc,perm:I.perm});
      ok('4 a valid signature area left empty: the '+sig.length+' signature fields unsigned, visible, sized ('+sig.map(x=>Math.round(x.rect[2]-x.rect[0])+' x '+Math.round(x.rect[3]-x.rect[1])).join(', ')+' pt) and on their page; their dates empty',
        sig.length===2&&sig.every(x=>!x.value&&!x.hidden&&x.rect[2]-x.rect[0]>=20&&x.rect[3]-x.rect[1]>=10&&x.page===0)&&W.filter(x=>/SIGNATURE_DATE/.test(x.name)).every(x=>!String(x.value||'').trim()),sig);}
    await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
  ok('5 no page errors',!errs.length,errs.slice(0,6));
  await br.close();
  if(!process.env.KEEP_OUT)try{L.fs.readdirSync(OUT).filter(f=>/\.pdf$/.test(f)).forEach(f=>L.fs.unlinkSync(OUT+f));}catch(e){}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
