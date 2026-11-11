/* v25.72 (privacy) a form opened on its own and used for the next student keeps nothing of the last one. Simulated data only.
   Inside the workstation every student gets new form frames, so this is about a form in its own tab: its own Open (of
   another file) and its own Clear all are how the next student's record starts there. The forms-layer audit found:
     Form EA-1   Clear all left the plan's store, the second analyst's reading and the level of differentiation
     Form ABC-1  Clear all left the second observer's agreement (IOA)
     Form SP-1   Open kept the activity column and the activity beside each time when the file had none
     and, on screen only, what was typed and not yet added: an incident being entered and a probe's stop rule (ABC-1), an
     addendum and its reason (CN-1), the live recorder's setting and note and the quick check (PA-1), the recorder's note
     (OB-1), the staff link being made (DD-1), typed marks (MT-1), the recorder's phase label (EA-1, AD-1).
   Every one of the 49 forms is opened on its own and put through four runs, each from a fresh page:
     1  a marker typed into every text box of the form, then Open (the person's own: the file box) of the form's own blank
        file: the form's file holds no marker; then every sheet is shown, and no box that can be seen holds one, nor does
        any of the boxes named in DRAFTS (seen or not: they are the ones a button reads)
     2  the marker again, then Clear all: the same
     3  Load simulation, then Open of the blank file: the form's file is the blank file, leaf by leaf
     4  Load simulation, then Clear all: the same
   A leaf that is empty on both sides (a default filled in) or a fresh random id or order is not a difference.
   What is kept on purpose, and said so on the form, is named below (KEEP) and nothing else is let through:
     IA-1  the respondent pages' settings are this device's (the staff member's email, the video link, the page and reply box
           addresses, the pasted item wording), and Clear all keeps the respondent terms and language (its question says so)
     OB-1  Clear all clears the observations: "The student, observer and setup details stay."
     SP-1  Clear all clears one behavior's marks: "The header details and any other behaviors stay."
     DD-1  the reply box and staff page addresses are this device's
     search boxes (DM-1, SR-1, VS-1)
     RS-1  the names typed for a typed signature (the supervisor's and the RBT's: staff, on the supervision form, not a
           student's). They are emptied for each month, not when the record is replaced: not changed in v25.72; in the report.
   A box that is not shown on any sheet is not counted unless it is in DRAFTS: Form VS-1's card editor while no card is made,
   Form RS-1's trainee and typed-signature boxes while no trainee record is open (both are filled from the record when
   they are shown), and Form IA-1's name box for a new group of informants (not changed in v25.72; in the report).
   usage: WS_URL=http://127.0.0.1:8172 node qa/v2572-form-residue-test.js [form ids]   e.g. EA-1 ABC-1 SP-1 */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const ONLY=process.argv.slice(2);
const MARK='ZQ4471823';
const CLEAR='#clearBtn,#btnClear,#clear-all,#btnClearAll',FILEIN='#fileIn,#fileImport,#file-input';
/* kept on purpose: leaves of the form's file (by run) and boxes on the page */
const IA_DEV=/^\/fields\/(m\.email|rp\.video|rp\.base|rp\.box|rp\.w\.[a-z]+)$/;
const KEEP={
  'IA-1':{file:{open:IA_DEV,clear:/^\/fields\/(m\.email|rp\.video|rp\.base|rp\.box|rp\.w\.[a-z]+|rp\.terms|rp\.lang)$/},box:/^\[name=(m\.email|rp\.video|rp\.base|rp\.box|rp\.w\.[a-z]+|rp\.terms|rp\.lang)\]$|^#(rpVideo|rpBase|rpBox|mEmail|rpw[A-Z][A-Za-z]*)$/},
  'OB-1':{file:{clear:/^\/(meta|cfg)\//},boxClear:'header'},
  'SP-1':{file:{clear:/./},boxClear:'header'},
  'DD-1':{box:/^#(stBoxIn|stPageIn)$/},
  'DM-1':{box:/^#dxLook$/},'SR-1':{box:/^#catSearch$/},'VS-1':{box:/^#libQ$/}};   /* v25.74 Form RS-1's names typed to sign with (#ts_sup, #ts_rbt) are no longer let off: Open and Clear all empty them */
/* the boxes that were found holding the last student's words: they must be empty whatever else a form keeps */
const DRAFTS={'ABC-1':['pr-stop','bg-activity','a-activity','e-activity','e-staff','e-narrative'],'CN-1':['addText','addWhy','logSearch'],'PA-1':['pa-run-eco-set','pa-run-eco-note','pa-run-eco-other','paQuickNote'],
  'OB-1':['obrNoteW'],'DD-1':['stWho','stSets'],'MT-1':['typeMarks'],'EA-1':['eaPhase'],'AD-1':['adrPhase'],'IA-1':['anNewName']};   /* v25.74 IA-1: the name typed for a new group of informants */

const own=p=>p.evaluate(()=>window.nbhBridge.ownSave());
function leaves(o,pre,out){if(o&&typeof o==='object'){for(const k of Object.keys(o))leaves(o[k],pre+'/'+k,out);}else out[pre]=o;return out;}
const nil=v=>v===undefined||v===''||v===null||v===false||v===0;
const RANDOM=/\/(id|uid|key|ord|order|seed|rid|cur)(\/|$)/i;
/* the leaves of `after` that hold something the blank file does not */
function content(after,blank,noisy){let A,B;try{A=leaves(JSON.parse(after),'',{});B=leaves(JSON.parse(blank),'',{});}catch(e){return [['(not json)','','']];}
  const d=[];for(const k of new Set(Object.keys(A).concat(Object.keys(B)))){if(noisy.has(k)||A[k]===B[k])continue;if(nil(A[k])&&nil(B[k]))continue;if(RANDOM.test(k))continue;d.push([k,String(B[k]).slice(0,30),String(A[k]).slice(0,50)]);}return d;}
function marked(text){let A;try{A=leaves(JSON.parse(text),'',{});}catch(e){return ['(not json)'];}return Object.keys(A).filter(k=>String(A[k]).indexOf(MARK)>=0);}
const fill=p=>p.evaluate(MARK=>{const ok=e=>{if(e.closest('.toolbar,dialog,#nbhUiDlg,#nbhCaseDlg,.nbh-pagenav'))return false;if(e.readOnly||e.disabled)return false;
    if(e.tagName==='TEXTAREA')return true;return /^(text|search|email|tel|url|)$/.test((e.getAttribute('type')||'').toLowerCase());};
  const setI=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set,setT=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;let n=0;
  Array.from(document.querySelectorAll('input,textarea')).filter(ok).slice(0,400).forEach((e,i)=>{if(!e.isConnected)return;try{(e.tagName==='TEXTAREA'?setT:setI).call(e,'Mateo Rivera '+MARK+' f'+i);
    e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));n++;}catch(x){}});return n;},MARK);
/* every sheet of the form shown in turn, then the boxes that hold the marker on any of them (the toolbar and open dialogs left
   out), named by id or name: a box counts when it can be seen on some sheet */
async function boxes(p){const seen=new Set();const look=()=>p.evaluate(MARK=>Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>String(e.value||'').indexOf(MARK)>=0&&!e.closest('.toolbar,#nbhUiDlg,#nbhCaseDlg')&&e.offsetParent!==null&&e.type!=='hidden')
    .map(e=>e.id?'#'+e.id:e.name?'[name='+e.name+']':e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(/\s+/)[0]:'')),MARK).catch(()=>[]);
  (await look()).forEach(x=>seen.add(x));
  const views=await p.evaluate(()=>[...document.querySelectorAll('#viewSeg button,.tabs [role="tab"],.tabbar button[data-tab]')].length).catch(()=>0);
  for(let i=0;i<views;i++){await p.evaluate(i=>{const b=[...document.querySelectorAll('#viewSeg button,.tabs [role="tab"],.tabbar button[data-tab]')][i];if(b)b.click();},i).catch(()=>{});await sleep(250);(await look()).forEach(x=>seen.add(x));}
  if(views)await p.evaluate(()=>{const b=document.querySelector('#viewSeg button,.tabs [role="tab"],.tabbar button[data-tab]');if(b)b.click();}).catch(()=>{});
  return [...seen];}
const draftsHeld=(p,ids)=>p.evaluate(([ids,MARK])=>ids.filter(id=>{const e=document.getElementById(id);return !!(e&&String(e.value||'').indexOf(MARK)>=0);}),[ids||[],MARK]);
async function fresh(p,f){await p.goto(L.formUrl(f.file),{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000});await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;});}
/* the person's own Open: a file put in the form's file box (no workstation, no quiet restore) */
async function openFile(p,text){await p.setInputFiles(FILEIN,{name:'blank.json',mimeType:'application/json',buffer:Buffer.from(text,'utf8')});await sleep(900);
  await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('.u-f button:last-child');if(b)b.click();}}).catch(()=>{});await sleep(500);}
/* Clear all, answered yes; three forms load the page again */
async function clearAll(p){const had=await p.evaluate(sel=>{const b=document.querySelector(sel);if(!b)return false;b.click();return true;},CLEAR);await sleep(700);
  await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('.u-f button:last-child');if(b)b.click();}}).catch(()=>{});await sleep(1500);
  await p.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000}).catch(()=>{});await sleep(400);await p.evaluate(()=>{window.confirm=()=>true;}).catch(()=>{});return had;}

async function one(br,f,log){const id=f.id,K=KEEP[id]||{},kf=K.file||{};const R={id,bad:[]};
  const c=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});await c.addInitScript(()=>{window.print=function(){};});
  const p=await c.newPage();p.on('dialog',d=>d.accept().catch(()=>{}));const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e).slice(0,160)));
  const bad=(k,i)=>R.bad.push([k,i]);
  const fileOk=(text,re)=>marked(text).filter(k=>!(re&&re.test(k)));
  const boxOk=l=>l.filter(b=>!(K.box&&K.box.test(b)));
  try{
    await fresh(p,f);const blank=await own(p);await sleep(1100);const blank2=await own(p);
    const noisy=new Set();{const A=leaves(JSON.parse(blank2),'',{}),B=leaves(JSON.parse(blank),'',{});for(const k of new Set(Object.keys(A).concat(Object.keys(B))))if(A[k]!==B[k])noisy.add(k);}
    /* 1: the marker, then the person's Open of the blank file */
    R.filled=await fill(p);await sleep(400);const held=marked(await own(p)).length;
    await openFile(p,blank);let t=await own(p),m=fileOk(t,kf.open);if(m.length)bad('1 Open: the file still holds the marker',m.slice(0,8));
    let d=await draftsHeld(p,DRAFTS[id]);if(d.length)bad('1 Open: what was typed and not added is still there',d);
    let b=boxOk(await boxes(p));if(b.length)bad('1 Open: boxes on the page still hold the marker',b.slice(0,12));
    /* 2: the marker, then Clear all */
    await fresh(p,f);await fill(p);await sleep(400);const had=await clearAll(p);if(!had)bad('2 Clear all: no Clear all button','');
    t=await own(p);m=fileOk(t,kf.clear);if(m.length)bad('2 Clear all: the file still holds the marker',m.slice(0,8));
    d=await draftsHeld(p,DRAFTS[id]);if(d.length)bad('2 Clear all: what was typed and not added is still there',d);
    if(K.boxClear!=='header'){b=boxOk(await boxes(p));if(b.length)bad('2 Clear all: boxes on the page still hold the marker',b.slice(0,12));}
    /* 3: the simulation, then the person's Open of the blank file */
    await fresh(p,f);const s3=await L.loadSim(p);await sleep(1800);const sim=await own(p);R.sim=content(sim,blank,noisy).length;
    if(!R.sim)bad('3 the simulation did not load (the test’s own footing)',String(s3));
    await openFile(p,blank);d=content(await own(p),blank,noisy).filter(x=>!(kf.open&&kf.open.test(x[0])));if(d.length)bad('3 simulation, then Open: the file is not the blank file',d.slice(0,8).map(x=>x[0]+' = '+x[2]));
    /* 4: the simulation, then Clear all */
    await fresh(p,f);await L.loadSim(p);await sleep(1800);await clearAll(p);
    d=content(await own(p),blank,noisy).filter(x=>!(kf.clear&&kf.clear.test(x[0])));if(d.length)bad('4 simulation, then Clear all: the file is not the blank file',d.slice(0,8).map(x=>x[0]+' = '+x[2]));
    R.held=held;
  }catch(e){bad('the runs did not finish',String(e&&e.message||e).slice(0,300));}
  if(errs.length)bad('page errors',errs.slice(0,3));
  await c.close();return R;}

(async()=>{const br=await L.chromium.launch();
  const forms=L.forms().filter(f=>!ONLY.length||ONLY.includes(f.id));const out={};let next=0;
  await Promise.all([0,1,2].map(async()=>{while(next<forms.length){const f=forms[next++];out[f.id]=await one(br,f);}}));
  await br.close();
  for(const f of forms){const R=out[f.id];
    ok(f.id+': Open and Clear all leave nothing of the record before ('+(R.filled||0)+' boxes marked, '+(R.sim||0)+' leaves from the simulation)',!R.bad.length,R.bad);}
  ok('all the forms were run',forms.length===(ONLY.length||49),forms.length);
  console.log('\n'+(n-fails)+' of '+n+' checks passed');process.exit(fails?1:0);})();
