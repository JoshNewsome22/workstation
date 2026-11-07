/* v25.68b Form RS-1 fills the BACB's own monthly and final fieldwork verification forms (the BCBA, 11/6: "Fill BACB's PDF").
   The BACB's PDFs are not in the repository and are not used here: each stand-in is a one-page PDF built below with the
   workstation's pdf-lib, carrying the same field names, field types and box values as one of the BACB's eight forms (names
   only: none of the BACB's text or layout). Simulated people only (Trainee T. (simulated), Jordan Ellis (simulated)). The
   clock is held at March 15, 2027, so months under both rule sets have ended. Checks, by the brief's items:
   1. Fill the BACB's form: beside the month's printed form, a PDF-only picker; pdf-lib loaded only when asked; each of the
      eight forms (monthly and final, 2022 and 2027, individual and organization) recognised by its field names; every field
      RS-1 fills holds the month's figure (or the final's totals), the computed totals and percent as the form works them out;
   2. what is left: the signatures and their dates stay empty; the list on screen says what RS-1 filled and what it left and
      that the BACB's form decides; a form with a field RS-1 does not know (a newer version), a file that is not a PDF, a
      signed copy, the 2022 form for a 2027 month and the other structure's form are not filled, and the page says why;
   3. save: the filled copy is saved through the usual link, named with the trainee's initials and the month; the month keeps
      the date the BACB's form was filled, and nothing else in the saved file changes; the date opens again with the file;
   4. the RBT mode unchanged: with and without the new block, the RBT log saves, shows and prints the same; the panel is
      not on paper and not in RBT mode;
   5. the iPad sideways and upright, and a phone: 44 px targets, no sideways scroll; offline: pdf-lib is in the offline copy.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2568-rs1-bacbpdf-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
const OUT=__dirname+'/out/v2568-rs1-bacbpdf/';fs.mkdirSync(OUT,{recursive:true});
const FILE='NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html';
const URL=L.BASE+'/'+FILE;
const P=require(path.resolve(L.ROOT,'NBH-Workstation','pdf-lib.min.js'));
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node22/lib/node_modules/playwright');}
const pagesOf=async b=>(await P.PDFDocument.load(b)).getPageCount();
const NOW=new Date('2027-03-15T10:00:00');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const errs=[];

/* ---------------- the BACB's eight forms, by their field names (read from the BACB's PDFs of 11/2026; names only) ----------------
   [name, type, box values]: t text, r a text field the form works out itself (read-only), c check box (its box values),
   d drop-down list (its choices), s signature, b a help button */
const sig2=[['SUPERVISOR_SIGNATURE','s'],['SUPERVISOR_SIGNATURE_DATE','t'],['TRAINEE_SIGNATURE','s'],['TRAINEE_SIGNATURE_DATE','t']],sig1=sig2.slice(0,2);
const M22=pror=>[['TRAINEE_NAME','t'],['TRAINEE_BACB_ID','t'],['BACB_ID_BUTTON','b'],['TRAINEE_CERTIFICATE_MONTH/YEAR','t'],['CHECK_SUPERVISED_FIELDWORK','c',['Supervised Fieldwork','Concentrated Supervised Fieldwork']],
  ['TRAINEE_FIELDWORK_STATE','t'],['TRAINEE_FIELDWORK_COUNTRY','t'],[pror,'c',['yes']],['RESPONSIBLE_SUPERVISOR_NAME','t'],['RESPONSIBLE_SUPERVISOR_BACB_ID','t'],
  ['INDEPENDENT_HOURS','t'],['INDEPENDENT_HOURS_BUTTON','b'],['SUPERVISED_HOURS','t'],['SUPERVISED_HOURS_BUTTON','b'],['TOTAL_FIELDWORK','r'],['PERCENT_HOURS_SUPERVISED','r']].concat(sig2);
const M27=(obsM,btn)=>[['TRAINEE_NAME','t'],['TRAINEE_BACB_ID','t'],['TRAINEE_CERTIFICATE_MONTH/YEAR','t'],['TRAINEE_FIELDWORK_STATE','t'],['TRAINEE_FIELDWORK_COUNTRY','t'],
  ['RESPONSIBLE_SUPERVISOR_NAME','t'],['RESPONSIBLE_SUPERVISOR_BACB_ID','t'],['Independent_Hours','t'],['Independent_Minutes','t'],['Supervised_Hours','t'],['Supervised_Minutes','t'],
  ['Total_Fieldwork_Hours','r'],['Total_Fieldwork_Minutes','r'],['PERCENT_HOURS_SUPERVISED','r'],['Observation_Hours','t'],[obsM,'t']].concat(sig2,btn.map(b=>[b,'b']));
const ORG=[1,2,3,4].flatMap(n=>[['SUPERVISOR_NAME_'+n,'t'],['SUPERVISOR_BACB_ID_'+n,'t']]);
const F22=(id,pror,type,org,sid,btn)=>[['TRAINEE_NAME','t'],[id,'t'],['START_DATE','t'],['END_DATE','t'],[pror,'c',['prorated fieldwork']],['TRAINEE_FIELDWORK_STATE','t'],['TRAINEE_FIELDWORK_COUNTRY','t']]
  .concat(org?ORG:[],[[type,'c',['Supervised Fieldwork','Concentrated Supervised Fieldwork','Mixed']],['TOTAL_MONTHS_OF_FIELDWORK_OBTAINED','t'],['TOTAL_MONTHS_OF_FIELDWORK_OBTAINED 2','t'],
   ['INDEPENDENT_HOURS','t'],['SUPERVISED_HOURS','t'],['TOTAL_FIELDWORK','r'],['PERCENT_HOURS_SUPERVISED','r'],['INDEPENDENT_HOURS 2','t'],['SUPERVISED_HOURS 2','t'],['TOTAL_FIELDWORK 2','r'],['PERCENT_HOURS_SUPERVISED 2','r'],
   ['RESPONSIBLE_SUPERVISOR_NAME','t'],[sid,'t'],['RESPONSIBLE_SUPERVISOR_QUALIFICATION','d',['Choose One','BCBA/BCBA-D','Verified Instructor','ABPP/ABA']]],sig1,btn.map(b=>[b,'b']));
const C27=p=>['Independent_Hours','Independent_Minutes','Supervised_Hours','Supervised_Minutes','Total_Fieldwork_Hours','Total_Fieldwork_Minutes','PERCENT_HOURS_SUPERVISED'].map(n=>[p+n,'t']);
const F27=(id,org,sid,btn)=>[['TRAINEE_NAME','t'],[id,'t'],['START_DATE','t'],['END_DATE','t'],['TRAINEE_FIELDWORK_STATE','t'],['TRAINEE_FIELDWORK_COUNTRY','t']]
  .concat(org?ORG:[],[['RESPONSIBLE_SUPERVISOR_NAME','t'],[sid,'t']],C27(''),C27('C_'),sig1,btn.map(b=>[b,'b']));
const FORMS={
  M22i:M22('This fieldwork included prorated hours for a partial month. '),
  M22o:M22('This fieldwork included prorated hours for a partial month'),
  M27i:M27('Independent_Minutes 3',['BACB_ID_BUTTON','BACB_ID_BUTTON 3','INDEPENDENT_HOURS_BUTTON 2','SUPERVISED_HOURS_BUTTON 2']),
  M27o:M27('Independent_Minutes 2',['BACB_ID_BUTTON','BACB_ID_BUTTON 2','SUPERVISED_HOURS_BUTTON','INDEPENDENT_HOURS_BUTTON']),
  F22i:F22('TRAINEE_ACCOUNT_ID','CHECK_prorated fieldwork','Fieldwork-Type',false,'RESPONSIBLE_SUPERVISOR_BACB_ID',['BACB_ID_BUTTON','INDEPENDENT_HOURS_BUTTON','SUPERVISED_HOURS_BUTTON','INDEPENDENT_HOURS_BUTTON 2','SUPERVISED_HOURS_BUTTON 2']),
  F22o:F22('TRAINEE_BACB_ID','CHECK_prorated fieldwork ','CHECK_FIELDWORK',true,'RESPONSIBLE_SUPERVISOR_ACCOUNT_ID',['BACB_ID_BUTTON','INDEPENDENT_HOURS_BUTTON 2','SUPERVISED_HOURS_BUTTON 2','INDEPENDENT_HOURS_BUTTON 3','SUPERVISED_HOURS_BUTTON 3']),
  F27i:F27('TRAINEE_ACCOUNT_ID',false,'RESPONSIBLE_SUPERVISOR_BACB_ID',['BACB_ID_BUTTON','BACB_ID_BUTTON 2','INDEPENDENT_HOURS_BUTTON 2','SUPERVISED_HOURS_BUTTON 2']),
  F27o:F27('TRAINEE_BACB_ID',true,'RESPONSIBLE_SUPERVISOR_ACCOUNT_ID',['BACB_ID_BUTTON','BACB_ID_BUTTON 3','INDEPENDENT_HOURS_BUTTON','SUPERVISED_HOURS_BUTTON'])};

/* a stand-in: the form's fields on a blank page (o.rename / o.extra / o.signed make the cases RS-1 must refuse) */
async function standIn(list,o){o=o||{};const doc=await P.PDFDocument.create(),pg=doc.addPage([612,792]),form=doc.getForm(),cx=doc.context,N=P.PDFName;let y=770;
  const box=(on)=>{const mk=s=>cx.register(cx.stream(s,{Type:'XObject',Subtype:'Form',BBox:[0,0,10,10]}));return {on:mk('0 0 10 10 re S 2 2 m 8 8 l S'),off:mk('0 0 10 10 re S')};};
  for(const [n0,ty,opt] of list.concat(o.extra||[])){const n=o.rename&&o.rename[n0]?o.rename[n0]:n0,r={x:40,y,width:200,height:12};y-=17;
    if(ty==='t'||ty==='r'){const f=form.createTextField(n);f.addToPage(pg,r);if(ty==='r'){f.setText('0');f.enableReadOnly();}}
    else if(ty==='b'){const f=form.createButton(n);f.addToPage('?',pg,Object.assign({},r,{width:12}));}
    else if(ty==='d'){const f=form.createDropdown(n);f.addOptions(opt);f.select(opt[0]);f.addToPage(pg,r);}
    else if(ty==='c'||ty==='s'){const fd=cx.obj({FT:ty==='c'?'Btn':'Sig',T:P.PDFString.of(n),Kids:[]}),fr=cx.register(fd);
      (ty==='c'?opt:[null]).forEach((on,i)=>{const w=cx.obj({Type:'Annot',Subtype:'Widget',Rect:[40+i*60,y,50+i*60,y+10],Parent:fr,P:pg.ref,F:4});
        if(on){const a=box();w.set(N.of('AS'),N.of('Off'));w.set(N.of('AP'),cx.obj({N:{[on]:a.on,Off:a.off}}));}
        const wr=cx.register(w);pg.node.addAnnot(wr);fd.get(N.of('Kids')).push(wr);});
      if(ty==='c')fd.set(N.of('V'),N.of('Off'));
      if(ty==='s'&&o.signed)fd.set(N.of('V'),cx.register(cx.obj({Type:'Sig',Filter:'Adobe.PPKLite',Contents:P.PDFHexString.of('00')})));
      form.acroForm.addField(fr);}
    if(y<30){y=770;}}
  return Buffer.from(await doc.save());}
/* what a filled copy holds, field by field */
async function readBack(b64){const doc=await P.PDFDocument.load(Buffer.from(b64,'base64')),form=doc.getForm(),N=P.PDFName,o={};
  for(const f of form.getFields()){const n=f.getName();
    if(f instanceof P.PDFTextField)o[n]=f.getText()==null?'':f.getText();
    else if(f instanceof P.PDFDropdown)o[n]=(f.getSelected()||[])[0]||'';
    else if(f instanceof P.PDFCheckBox){const V=f.acroField.dict.get(N.of('V'));o[n]=V?V.decodeText():'Off';o[n+'#AS']=f.acroField.getWidgets().map(w=>{const a=w.dict.get(N.of('AS'));return a?a.decodeText():'';}).join('|');}
    else if(f instanceof P.PDFSignature)o[n]=f.acroField.dict.get(N.of('V'))?'SIGNED':'';}
  return o;}

async function open(ctx,tag,strip){const page=await ctx.newPage();L.wire(page,[]);page.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,300)));
  if(strip)await page.route('**/'+FILE.split('/').pop(),async r=>{const res=await r.fetch();r.fulfill({response:res,body:stripNew(await res.text())});});
  /* the same random numbers in every page, so two runs of a simulation write the same ids */
  await page.addInitScript(()=>{let s=20271;Math.random=()=>{s=s*16807%2147483647;return (s-1)/2147483646;};});
  await page.clock.setFixedTime(NOW);await page.goto(URL);await sleep(900);
  await page.evaluate(()=>{window.__conf=[];window.confirm=t=>{window.__conf.push(String(t));return true;};window.alert=()=>{};window.print=()=>{};});return page;}
/* the page without this build's block, its style and its panels: the RBT mode must be the same with and without them */
function stripNew(h){const cut=(a,b)=>{const i=h.indexOf(a);if(i<0)throw new Error('not found: '+a);const j=h.indexOf(b,i);h=h.slice(0,i)+h.slice(j+b.length);};
  cut('<style id="rs1-v2568-bacbpdf-css">','</style>\n');cut('<script id="rs1-v2568-bacbpdf">','</script>\n');
  cut('    <!-- v25.68b the BACB','    </div>\n');cut('    <div class="tr-bacb noprint" id="trBacbF"','    </div>\n');return h;}
const X=(page,f,a)=>page.evaluate(f,a);
const outSel=w=>w==='fin'?'#trBacbFinOut':'#trBacbOut';
async function pickPdf(page,w,name,buf,mime){const [fc]=await Promise.all([page.waitForEvent('filechooser'),page.click('[data-trbacb="'+w+'"]')]);
  await fc.setFiles({name,mimeType:mime||'application/pdf',buffer:buf});
  await page.waitForFunction(s=>{const o=document.querySelector(s);return o&&/Not filled|Save the filled form/.test(o.textContent);},outSel(w),{timeout:30000}).catch(()=>{});
  return X(page,s=>{const o=document.querySelector(s);return {text:o.textContent.replace(/\s+/g,' '),save:!!o.querySelector('[data-trbacbsave]'),filled:[...o.querySelectorAll('.tr-bacb-cols>div:first-child li')].map(l=>l.textContent),
    left:[...o.querySelectorAll('.tr-bacb-cols>div:last-child li')].map(l=>l.textContent),no:!!o.querySelector('.tr-bacb-res.no')};},outSel(w));}
/* the filled copy, caught at the usual save link before it reaches the computer */
const saveIt=(page,w)=>X(page,w=>new Promise(res=>{const mk=URL.createObjectURL;let blob=null;URL.createObjectURL=b=>{URL.createObjectURL=mk;blob=b;return 'blob:x';};
  const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;const name=this.download,type=blob&&blob.type;
    blob.arrayBuffer().then(ab=>{const u=new Uint8Array(ab);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
      setTimeout(()=>res({name,type,b64:btoa(s),after:document.querySelector(w==='fin'?'#trBacbFinOut':'#trBacbOut').innerText}),50);});};
  document.querySelector('[data-trbacbsave="'+w+'"]').click();}),w);
const grab=page=>page.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};
  const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};document.querySelector('#saveBtn').click();}));
const noSaved=t=>{const o=JSON.parse(t);delete o.saved;return o;};
/* the month's figures as RS-1's own printed form has them */
const monthFig=(page,k)=>X(page,k=>{const R=window.__rsTrainee,t=R.cur(),s=R.tStats(k,t),h=R.formHours(k,t,s),sp=R.respSup(t);return {ind:h.ind,sup:h.sup,obs:s.obsMin,ft:s.ft,pror:!!R.tPeek(k,t).prorated,name:t.setup.name,bacb:t.setup.bacb,state:t.setup.state,country:t.setup.country,sName:sp.name,sId:sp.cert,form:document.querySelector('#trFormOut').innerText.replace(/\s+/g,' ')};},k);
const finFig=page=>X(page,()=>{const R=window.__rsTrainee,t=R.cur(),D=R.finalData(t);return {a:D.a,b:D.b,ver:D.ver,sup:D.by.sup,conc:D.by.conc,pror:D.pror,type:D.type,sp:{name:D.sp.name,cert:D.sp.cert,qual:D.sp.qual},sups:t.sups.filter(x=>x.name).map(x=>[x.name,x.cert])};});
const d2=mi=>(mi/60).toFixed(2),hm=mi=>[Math.floor(mi/60),mi%60];
const near=(a,b)=>Math.abs(Number(a)-b)<1e-9;
function checkM22(o,f,k){const A=d2(f.ind),B=d2(f.sup),tot=(+A + +B).toFixed(2);const bad=[];const eq=(n,v)=>{if(o[n]!==v)bad.push([n,o[n],v]);};
  eq('TRAINEE_NAME',f.name);eq('TRAINEE_BACB_ID',f.bacb);eq('TRAINEE_CERTIFICATE_MONTH/YEAR',k.slice(5)+'/'+k.slice(0,4));eq('TRAINEE_FIELDWORK_STATE',f.state);eq('TRAINEE_FIELDWORK_COUNTRY',f.country);
  eq('RESPONSIBLE_SUPERVISOR_NAME',f.sName);eq('RESPONSIBLE_SUPERVISOR_BACB_ID',f.sId);eq('INDEPENDENT_HOURS',A);eq('SUPERVISED_HOURS',B);eq('TOTAL_FIELDWORK',tot);
  if(!near(o.PERCENT_HOURS_SUPERVISED,+B/(+A + +B)))bad.push(['PERCENT_HOURS_SUPERVISED',o.PERCENT_HOURS_SUPERVISED]);
  const on=f.ft==='conc'?'Concentrated Supervised Fieldwork':'Supervised Fieldwork';eq('CHECK_SUPERVISED_FIELDWORK',on);eq('CHECK_SUPERVISED_FIELDWORK#AS',f.ft==='conc'?'Off|'+on:on+'|Off');
  return bad;}
function checkM27(o,f,k,obsM){const bad=[];const eq=(n,v)=>{if(String(o[n])!==String(v))bad.push([n,o[n],v]);};const I=hm(f.ind),S=hm(f.sup),Ob=hm(f.obs),Tt=hm(I[0]*60+I[1]+S[0]*60+S[1]);
  eq('TRAINEE_NAME',f.name);eq('TRAINEE_BACB_ID',f.bacb);eq('TRAINEE_CERTIFICATE_MONTH/YEAR',k.slice(5)+'/'+k.slice(0,4));eq('TRAINEE_FIELDWORK_STATE',f.state);eq('TRAINEE_FIELDWORK_COUNTRY',f.country);
  eq('RESPONSIBLE_SUPERVISOR_NAME',f.sName);eq('RESPONSIBLE_SUPERVISOR_BACB_ID',f.sId);
  eq('Independent_Hours',I[0]);eq('Independent_Minutes',I[1]);eq('Supervised_Hours',S[0]);eq('Supervised_Minutes',S[1]);eq('Observation_Hours',Ob[0]);eq(obsM,Ob[1]);
  eq('Total_Fieldwork_Hours',Tt[0]);eq('Total_Fieldwork_Minutes',Tt[1]);if(!near(o.PERCENT_HOURS_SUPERVISED,f.sup/(f.ind+f.sup)))bad.push(['PERCENT_HOURS_SUPERVISED',o.PERCENT_HOURS_SUPERVISED]);
  return bad;}
const sigsEmpty=o=>['SUPERVISOR_SIGNATURE','SUPERVISOR_SIGNATURE_DATE','TRAINEE_SIGNATURE','TRAINEE_SIGNATURE_DATE'].every(n=>!(n in o)||o[n]==='');

(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1376,height:1032}});
  const page=await open(ctx,'main');
  /* ================= 4 (first). the RBT mode: the panel is not there ================= */
  const r0=await X(page,()=>({vis:[...document.querySelectorAll('.tr-bacb,[data-trbacb]')].some(e=>e.offsetParent),pdf:!!window.PDFLib||!!document.querySelector('script[src*="pdf-lib"]')}));
  ok('4 in RBT mode the BACB-form panel is not shown, and pdf-lib is not loaded with the page',!r0.vis&&!r0.pdf,r0);
  await page.click('[data-rsmode="trainee"]');await sleep(250);await X(page,()=>document.querySelector('#simBtn').click());await sleep(1000);
  await X(page,()=>{setView('print');window.__rsTrainee.setKey('2027-01');});await sleep(300);
  const p0=await X(page,()=>{const b=document.querySelector('[data-trbacb="month"]'),i=document.querySelector('#trBacbFile'),fo=document.querySelector('#trFormOut'),pn=document.querySelector('#trBacbM');
    return {btn:b&&b.textContent,vis:!!(b&&b.offsetParent),accept:i&&i.accept,type:i&&i.type,beside:!!(pn&&fo&&(pn.compareDocumentPosition(fo)&Node.DOCUMENT_POSITION_FOLLOWING)),
      on:document.querySelector('#trBacbOn').textContent,fin:(document.querySelector('[data-trbacb="fin"]')||{}).textContent,pdf:!!window.PDFLib};});
  ok('1 Sign and print: "Fill the BACB’s form" beside the month’s printed form, a PDF-only picker; "Fill the BACB’s final form" in the final verification; pdf-lib not loaded yet',
    p0.btn==='Fill the BACB’s form'&&p0.vis&&p0.type==='file'&&/application\/pdf/.test(p0.accept)&&/\.pdf/.test(p0.accept)&&p0.beside&&p0.fin==='Fill the BACB’s final form'&&!p0.pdf&&/has not been filled here yet/.test(p0.on),p0);
  const save0=await grab(page);
  /* ================= 1. the 2027 monthly form, individual supervisor, January 2027 ================= */
  const m27=await standIn(FORMS.M27i);
  const r1=await pickPdf(page,'month','M-FVF-Individual-2027.pdf',m27);
  const lib=await X(page,()=>!!window.PDFLib&&!!document.querySelector('script[src="pdf-lib.min.js"]'));
  ok('1 picking the PDF loads the workstation’s pdf-lib (only then) and recognises the 2027 monthly form, individual supervisor, by its field names',
    lib&&r1.save&&/Monthly Fieldwork Verification Form for the 2027 requirements, individual supervisor/.test(r1.text)&&/recognised by its fields, filled from January 2027/.test(r1.text),r1.text.slice(0,400));
  ok('2 the list on screen: what RS-1 filled, what it left for the person (the signatures and their dates), and that the BACB’s form decides',
    r1.filled.length>=10&&r1.filled.some(x=>/Independent hours:/.test(x))&&r1.filled.some(x=>/Observation with a client:/.test(x))&&r1.left.length===4&&r1.left.every(x=>/signature/i.test(x))&&
    /Filled by RS-1 \(\d+\)/.test(r1.text)&&/Left for you \(4\)/.test(r1.text)&&/The BACB’s form decides\./.test(r1.text),[r1.filled,r1.left]);
  const s1=await saveIt(page,'month');
  const o1=await readBack(s1.b64),f1=await monthFig(page,'2027-01');
  const b1=checkM27(o1,f1,'2027-01','Independent_Minutes 3');
  ok('1 every field RS-1 fills holds January’s figure: the trainee, the month, the supervisor, independent and supervised hours and minutes, observation, the total and the percent (as the form works them out)',
    b1.length===0&&f1.ind>0&&f1.obs>0,b1);
  const hh=mi=>hm(mi)[0]+' hh '+String(hm(mi)[1]).padStart(2,'0')+' mm';
  ok('1 the figures are the ones on RS-1’s printed form for the month',[f1.ind,f1.sup,f1.obs].every(mi=>f1.form.includes(hh(mi))),[hh(f1.ind),hh(f1.sup),hh(f1.obs),f1.form.slice(0,600)]);
  ok('2 the signature fields and their dates stay empty',sigsEmpty(o1),o1);
  ok('3 the filled copy is saved through the usual link, named with the trainee’s initials and the month, as a PDF',s1.name==='M-FVF_TT_2027-01.pdf'&&s1.type==='application/pdf'&&/Saved as M-FVF_TT_2027-01\.pdf/.test(s1.after),[s1.name,s1.type,s1.after.slice(-200)]);
  fs.writeFileSync(OUT+'M-FVF_TT_2027-01.pdf',Buffer.from(s1.b64,'base64'));
  /* ================= 3. the file keeps the date, and nothing else changes ================= */
  const save1=await grab(page),a0=noSaved(save0),a1=noSaved(save1);
  const bac=((a1.trainees||[])[0]||{}).months||{},dated=Object.keys(bac).filter(k=>bac[k].bacb).map(k=>k+':'+bac[k].bacb).join();
  const strip=o=>{o=JSON.parse(JSON.stringify(o));(o.trainees||[]).forEach(t=>Object.values(t.months||{}).forEach(m=>delete m.bacb));return JSON.stringify(o);};
  ok('3 Save data keeps one new value, the date the BACB’s form was filled for January 2027; everything else is the same as before the fill',
    dated==='2027-01:2027-03-15'&&strip(a1)===JSON.stringify(a0)&&strip(a0)===JSON.stringify(a0),[dated,strip(a1).length,JSON.stringify(a0).length]);
  const on1=await X(page,()=>document.querySelector('#trBacbOn').textContent);
  ok('3 the month says when its BACB form was filled',/The BACB’s form for January 2027 was filled here on 3\/15\/2027/.test(on1),on1);
  const p2=await open(ctx,'reopen');await p2.click('[data-rsmode="trainee"]');await sleep(200);
  await X(p2,t=>{const i=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},save1);await sleep(1200);
  const save2=await grab(p2);
  const tr1=JSON.stringify(noSaved(save1).trainees),tr2=JSON.stringify(noSaved(save2).trainees);
  ok('3 a file with the date opens and saves its trainee records again the same, the date kept',tr1===tr2&&/"bacb": ?"2027-03-15"/.test(save2),[tr1.length,tr2.length]);
  await p2.close();
  /* ================= 1. the 2022 monthly form for December 2026 ================= */
  await X(page,()=>window.__rsTrainee.setKey('2026-12'));await sleep(250);
  const r2=await pickPdf(page,'month','M-FVF-Individual-2022.pdf',await standIn(FORMS.M22i));
  const s2=r2.save?await saveIt(page,'month'):{b64:''};const o2=r2.save?await readBack(s2.b64):{},f2=await monthFig(page,'2026-12');const b2=r2.save?checkM22(o2,f2,'2026-12'):['not filled'];
  ok('1 the 2022 monthly form, December 2026: decimal hours, the total and the percent as the form works them out, the fieldwork type ticked, the prorated box left unticked as on RS-1',
    r2.save&&b2.length===0&&o2['This fieldwork included prorated hours for a partial month. ']==='Off'&&!f2.pror&&sigsEmpty(o2)&&s2.name==='M-FVF_TT_2026-12.pdf',[b2,s2.name,r2.text.slice(0,300)]);
  /* the 2027 form for a 2026 month (a trainee who applies in 2027) */
  const r3=await pickPdf(page,'month','M-FVF-Individual-2027.pdf',m27);const s3=r3.save?await saveIt(page,'month'):{};
  const b3=r3.save?checkM27(await readBack(s3.b64),f2,'2026-12','Independent_Minutes 3'):['not filled'];
  ok('1 the 2027 form for December 2026 (under the 2022 rules) is filled, says so, and is named apart',r3.save&&b3.length===0&&/December 2026 is under the 2022 rules; this is the 2027 form/.test(r3.text)&&s3.name==='M-FVF-2027_TT_2026-12.pdf',[b3,s3.name,r3.text.slice(0,300)]);
  /* ================= 2. refused ================= */
  await X(page,()=>window.__rsTrainee.setKey('2027-01'));await sleep(250);
  const n1=await pickPdf(page,'month','M-FVF-Individual-2022.pdf',await standIn(FORMS.M22i));
  ok('2 the 2022 form for January 2027 (under the 2027 rules) is not filled, and the page says to use the 2027 form',n1.no&&!n1.save&&/January 2027 is under the 2027 rules/.test(n1.text),n1.text);
  const n2=await pickPdf(page,'month','M-FVF-newer.pdf',await standIn(FORMS.M27i,{rename:{'Independent_Hours':'Independent_Hours_A'}}));
  const n3=await pickPdf(page,'month','M-FVF-more.pdf',await standIn(FORMS.M27i,{extra:[['Fieldwork_Setting','t']]}));
  ok('2 a form with a field RS-1 does not know (one renamed, or one more: a newer version) is not filled, and says so plainly; RS-1 never guesses a field',
    n2.no&&!n2.save&&/does not know this form’s fields, so it filled nothing/.test(n2.text)&&/never guesses a field/.test(n2.text)&&n3.no&&!n3.save&&/does not know/.test(n3.text),[n2.text,n3.text]);
  const n4=await pickPdf(page,'month','notes.pdf',Buffer.from('These are not the BACB’s form.'),'application/pdf');
  const n5=await pickPdf(page,'month','M-FVF-signed.pdf',await standIn(FORMS.M27i,{signed:true}));
  const n6=await pickPdf(page,'month','M-FVF-Organization-2027.pdf',await standIn(FORMS.M27o));
  ok('2 a file that is not a PDF, a copy already signed, and the organization form for a trainee with an individual supervisor are not filled, each with its reason',
    n4.no&&/is not a PDF/.test(n4.text)&&n5.no&&/already signed/.test(n5.text)&&n6.no&&/supervision structure is an individual supervisor/.test(n6.text)&&![n4,n5,n6].some(x=>x.save),[n4.text,n5.text,n6.text]);
  ok('2 a form not filled keeps RS-1’s printed form as the record',/RS-1’s printed form stays the record/.test(n1.text)&&/RS-1’s printed form stays the record/.test(n2.text),n2.text);
  /* ================= 1. the final forms ================= */
  const ff=await finFig(page);
  const r4=await pickPdf(page,'fin','F-FVF-Individual-2027.pdf',await standIn(FORMS.F27i));const s4=r4.save?await saveIt(page,'fin'):{};const o4=r4.save?await readBack(s4.b64):{};
  const A4=hm(ff.sup.ind),B4=hm(ff.sup.sup),T4=hm(A4[0]*60+A4[1]+B4[0]*60+B4[1]);
  const b4=r4.save?[['TRAINEE_NAME','Trainee T. (simulated)'],['TRAINEE_ACCOUNT_ID','000000'],['START_DATE',ff.a.slice(5)+'/'+ff.a.slice(0,4)],['END_DATE',ff.b.slice(5)+'/'+ff.b.slice(0,4)],['RESPONSIBLE_SUPERVISOR_NAME',ff.sp.name],['RESPONSIBLE_SUPERVISOR_BACB_ID',ff.sp.cert],
    ['Independent_Hours',A4[0]],['Independent_Minutes',A4[1]],['Supervised_Hours',B4[0]],['Supervised_Minutes',B4[1]],['Total_Fieldwork_Hours',T4[0]],['Total_Fieldwork_Minutes',T4[1]],
    ['C_Independent_Hours',''],['C_Supervised_Hours',''],['C_PERCENT_HOURS_SUPERVISED','']].filter(([n,v])=>String(o4[n])!==String(v)).concat(near(o4.PERCENT_HOURS_SUPERVISED,ff.sup.sup/(ff.sup.ind+ff.sup.sup))?[]:[['pct',o4.PERCENT_HOURS_SUPERVISED]]):['not filled'];
  ok('1 the 2027 final form: the span, the supervisor and the supervised-fieldwork totals of the signed months; the concentrated column left blank (no such month)',
    r4.save&&b4.length===0&&ff.sup.n===4&&ff.conc.n===0&&o4.SUPERVISOR_SIGNATURE===''&&o4.SUPERVISOR_SIGNATURE_DATE===''&&s4.name==='F-FVF_TT_2026-10_to_2027-02.pdf'&&/Not counted \(no monthly form signed by both\): November 2026/.test(r4.text),[b4,ff,s4.name,r4.text.slice(0,500)]);
  const r5=await pickPdf(page,'fin','F-FVF-Individual-2022.pdf',await standIn(FORMS.F22i));const s5=r5.save?await saveIt(page,'fin'):{};const o5=r5.save?await readBack(s5.b64):{};
  const A5=d2(ff.sup.ind),B5=d2(ff.sup.sup);
  const b5=r5.save?[['TOTAL_MONTHS_OF_FIELDWORK_OBTAINED','4'],['TOTAL_MONTHS_OF_FIELDWORK_OBTAINED 2',''],['INDEPENDENT_HOURS',A5],['SUPERVISED_HOURS',B5],['TOTAL_FIELDWORK',(+A5 + +B5).toFixed(2)],['INDEPENDENT_HOURS 2',''],
    ['Fieldwork-Type','Supervised Fieldwork'],['RESPONSIBLE_SUPERVISOR_QUALIFICATION','BCBA/BCBA-D'],['CHECK_prorated fieldwork','Off'],['TRAINEE_ACCOUNT_ID','000000']].filter(([n,v])=>String(o5[n])!==String(v)):['not filled'];
  ok('1 the 2022 final form: months of each type, decimal totals, the fieldwork type, the qualification; it says the final verification is set to the 2027 form',
    r5.save&&b5.length===0&&o5.SUPERVISOR_SIGNATURE===''&&/set to the 2027 form; this PDF is the 2022 form/.test(r5.text)&&s5.name==='F-FVF-2022_TT_2026-10_to_2027-02.pdf',[b5,s5.name]);
  /* ================= 1. the organization forms (multiple supervisors at one organization) ================= */
  await X(page,()=>{setView('setup');});await sleep(200);await page.selectOption('#trStruct','org');await sleep(250);
  await X(page,()=>{const t=window.__rsTrainee.cur();t.sups.push({id:'trsimB',name:'Sam Rivera (simulated)',cert:'1-00-00001',qual:'bcba',since:'2018-01-10',trained:'2018-02-01',consult:'',norel:true,resp:false});setView('print');window.__rsTrainee.setKey('2027-01');});await sleep(300);
  const r6=await pickPdf(page,'month','M-FVF-Organization-2027.pdf',await standIn(FORMS.M27o));const s6=r6.save?await saveIt(page,'month'):{};
  const b6=r6.save?checkM27(await readBack(s6.b64),await monthFig(page,'2027-01'),'2027-01','Independent_Minutes 2'):['not filled'];
  const r7=await pickPdf(page,'fin','F-FVF-Organization-2022.pdf',await standIn(FORMS.F22o));const s7=r7.save?await saveIt(page,'fin'):{};const o7=r7.save?await readBack(s7.b64):{};
  const r8=await pickPdf(page,'fin','F-FVF-Organization-2027.pdf',await standIn(FORMS.F27o));const s8=r8.save?await saveIt(page,'fin'):{};const o8=r8.save?await readBack(s8.b64):{};
  await X(page,()=>window.__rsTrainee.setKey('2026-12'));await sleep(250);
  const r9=await pickPdf(page,'month','M-FVF-Organization-2022.pdf',await standIn(FORMS.M22o));const s9=r9.save?await saveIt(page,'month'):{};
  const b9=r9.save?checkM22(await readBack(s9.b64),await monthFig(page,'2026-12'),'2026-12'):['not filled'];
  const orgOk=o=>o.SUPERVISOR_NAME_1==='Jordan Ellis (simulated)'&&o.SUPERVISOR_BACB_ID_1==='1-00-00000'&&o.SUPERVISOR_NAME_2==='Sam Rivera (simulated)'&&o.SUPERVISOR_BACB_ID_2==='1-00-00001'&&o.SUPERVISOR_NAME_3===''&&o.RESPONSIBLE_SUPERVISOR_NAME==='Jordan Ellis (simulated)'&&o.RESPONSIBLE_SUPERVISOR_ACCOUNT_ID==='1-00-00000';
  ok('1 the organization forms: the 2027 and 2022 monthly forms filled as the individual ones, the final forms with each supervisor at the organization and the responsible supervisor',
    r6.save&&b6.length===0&&r9.save&&b9.length===0&&orgOk(o7)&&orgOk(o8)&&o7.CHECK_FIELDWORK==='Supervised Fieldwork'&&o8.Independent_Hours!==''&&o8.C_Independent_Hours===''&&/Responsible supervisor’s name: Jordan Ellis/.test(r6.text),[b6,b9,o7,o8]);
  const n7=await pickPdf(page,'month','M-FVF-Individual-2027.pdf',m27);
  ok('2 with the organization structure, the individual form is not filled',n7.no&&/supervision structure is multiple supervisors at one organization/.test(n7.text),n7.text);
  ok('no page errors in trainee mode',errs.length===0,errs);
  await page.close();
  /* ================= 4. the RBT mode: the same with and without this build ================= */
  const rbt=async strip=>{const p=await open(ctx,strip?'rbt-without':'rbt-with',strip);await X(p,()=>document.querySelector('#simBtn').click());await sleep(1200);
    const sv=noSaved(await grab(p)),txt=await X(p,()=>document.querySelector('main.sheet').innerText),nodes=await X(p,()=>(window.nbhPrintNodes?window.nbhPrintNodes():[]).map(n=>n.outerHTML.length).join());
    await p.emulateMedia({media:'print'});const pages=await pagesOf(await p.pdf({format:'Letter'}));
    const panel=await X(p,()=>[...document.querySelectorAll('.tr-bacb')].map(e=>getComputedStyle(e).display));await p.close();return {sv:JSON.stringify(sv),txt,nodes,pages,panel};};
  const w1=await rbt(false),w0=await rbt(true);
  ok('4 the RBT mode is unchanged: with and without the new block the RBT log’s Save data, its text on screen, the packet’s pages and the printout are the same',
    w1.sv===w0.sv&&w1.txt===w0.txt&&w1.nodes===w0.nodes&&w1.pages===w0.pages&&w1.pages>0,[w1.sv.length,w0.sv.length,w1.txt.length,w0.txt.length,w1.nodes,w0.nodes,w1.pages,w0.pages]);
  ok('4 the panel is not on paper',w1.panel.length===2&&w1.panel.every(d=>d==='none'),w1.panel);
  /* in trainee mode, the printed form and record are the same with and without the panel */
  const trp=async strip=>{const p=await open(ctx,strip?'trp-without':'trp-with',strip);await p.click('[data-rsmode="trainee"]');await sleep(250);await X(p,()=>document.querySelector('#simBtn').click());await sleep(1000);
    await X(p,()=>{setView('print');window.__rsTrainee.setKey('2027-01');});await sleep(300);await p.emulateMedia({media:'print'});await X(p,()=>document.body.classList.add('tr-print-month'));
    const n=await pagesOf(await p.pdf({format:'Letter'}));await p.close();return n;};
  const t1=await trp(false),t0=await trp(true);
  ok('4 the trainee’s printed form and record print the same pages with the panel as without it',t1===t0&&t1>0,[t1,t0]);
  /* ================= 5. the iPad and a phone ================= */
  const b=await L.ipadBrowser(PW);
  for(const [w,h,tag] of [[1376,1032,'iPad sideways'],[1032,1376,'iPad upright'],[390,844,'phone']]){
    const c=await L.ipadCtx(b,{viewport:{width:w,height:h}});const p=await open(c,tag);
    await p.tap('[data-rsmode="trainee"]');await sleep(250);await X(p,()=>document.querySelector('#simBtn').click());await sleep(1000);
    await X(p,()=>{setView('print');window.__rsTrainee.setKey('2027-01');});await sleep(300);
    const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.tap('[data-trbacb="month"]')]);await fc.setFiles({name:'M-FVF-Individual-2027.pdf',mimeType:'application/pdf',buffer:m27});
    await p.waitForSelector('[data-trbacbsave="month"]',{timeout:30000}).catch(()=>{});
    const g=await X(p,()=>{const hs=[...document.querySelectorAll('[data-trbacb],[data-trbacbsave]')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.height),Math.round(r.width)];});
      return {hs,sx:document.scrollingElement.scrollWidth-window.innerWidth};});
    ok('5 '+tag+': the buttons are at least 44 px and the page does not scroll sideways',g.hs.length===3&&g.hs.every(([hh,ww])=>hh>=44&&ww>=44)&&g.sx<=1,g);
    if(tag==='iPad sideways')await p.screenshot({path:OUT+'ipad-sideways.png',fullPage:false});
    await c.close();}
  await b.close();
  const sw=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation','sw.js'),'utf8');
  ok('5 offline: pdf-lib.min.js is in the offline copy the installed app keeps',/'pdf-lib\.min\.js'/.test(sw));
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  await br.close();
  console.log('RESULT: '+(fails?fails+' failed':'all passed'));process.exit(fails?1:0);})();
