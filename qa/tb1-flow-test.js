/* v21.63 Form TB-1: a candidate row deleted (the rows below move up, renumbered, saved and reopened); Goes to sheet follows
   Type; each selected target starts its card on the Definitions sheet (label, type, urgency, paired replacement) while the card
   has not been edited; the library's starting definition offered on a card whose label it knows, and loaded from the offer; the
   candidates marked Target taken into the targets (the count grows); my bank (save a card's definition, offered first on the
   other cards and in the candidate picker, found by search, kept across a reload, loaded, saved to a file, removed, opened from
   the file, a wrong file refused); the Send button hidden on the form alone and, in the workstation, sending the targets to the
   other open forms; the saved file unchanged in shape; no errors. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/tb1-flow';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html';
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const host=t=>`#tgtWrap .card[data-tgt="${t}"] .tb1lib-host`;
(async()=>{const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1300,height:900}});const page=await ctx.newPage();wire(page,log);
  await page.goto(URL);await sleep(900);
  const view=async v=>{await page.evaluate(v=>document.querySelector(`#viewSeg button[data-view="${v}"]`).click(),v);await sleep(200);};
  const set=(name,v,ev)=>page.evaluate(([n,v,ev])=>{const el=document.querySelector(`[name="${n}"]`);el.value=v;el.dispatchEvent(new Event(ev||(el.tagName==='SELECT'?'change':'input'),{bubbles:true}));return el.value;},[name,v,ev]);
  const val=name=>page.evaluate(n=>{const el=document.querySelector(`[name="${n}"]`);return el?el.value:null;},name);
  const saveFile=async()=>{await page.evaluate(()=>{window.__saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};document.querySelector('#saveBtn').click();});await sleep(400);return JSON.parse(await page.evaluate(()=>window.__saved));};
  const openFile=async t=>{await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'tb1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},t);await sleep(400);};
  const libN=()=>page.evaluate(()=>+(/\((\d+)\)/.exec(document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.cat').options[0].textContent)||[])[1]);
  await view('select');
  /* ---- A. a candidate row deleted ---- */
  await page.evaluate(()=>{window.confirm=()=>true;});
  for(const [i,beh,dec] of [[0,'Hitting others','Target – single topography'],[1,'Whining','Monitor only'],[2,'Screaming','Target – cluster'],[3,'Asks for a break','Target – replacement']]){await set(`cand[${i}].beh`,beh);await set(`cand[${i}].dec`,dec);await set(`cand[${i}].urg`,i===2?'3':'4');}
  const before=await page.evaluate(()=>({rows:document.querySelectorAll('#candBody tr').length,del:document.querySelectorAll('#candBody .tb1-del').length,th:!!document.querySelector('#candTbl th.tb1-xh')}));
  await page.click('#candBody tr:nth-child(2) .tb1-del');await sleep(300);
  const after=await page.evaluate(()=>({rows:document.querySelectorAll('#candBody tr').length,nums:[...document.querySelectorAll('#candBody tr td.n:first-child')].map(td=>td.textContent).join(''),names:[...document.querySelectorAll('#candBody [name$=".beh"]')].map(e=>e.name).join(' '),behs:[...document.querySelectorAll('#candBody [name$=".beh"]')].map(e=>e.value).join('|'),labels:[...document.querySelectorAll('#candBody .tb1-del')].map(b=>b.getAttribute('aria-label')).join('|')}));
  check('A1 every candidate row has a delete button; deleting row 2 moves the rows below up, renumbered 1 to 5, the fields cand[0] to cand[4], the count 5',before.rows===6&&before.del===6&&before.th&&after.rows===5&&after.nums==='12345'&&after.names==='cand[0].beh cand[1].beh cand[2].beh cand[3].beh cand[4].beh'&&after.behs==='Hitting others|Screaming|Asks for a break||'&&/Delete candidate 5$/.test(after.labels),JSON.stringify(after));
  const file1=await saveFile();await openFile(JSON.stringify(file1));

  check('A2 the saved file counts five candidates and reopens with the five rows, the same text in the same rows',file1.counts.cand===5&&await page.evaluate(()=>document.querySelectorAll('#candBody tr').length===5&&document.querySelector('[name="cand[1].beh"]').value==='Screaming'&&document.querySelector('[name="cand[2].dec"]').value==='Target – replacement'));
  /* ---- B. Goes to sheet follows Type; the selected targets start their cards ---- */
  await set('sel[0].type','Cluster (multiple topographies)');const to1=await val('sel[0].to');
  await set('sel[0].type','Single topography');const to2=await val('sel[0].to');
  await set('sel[0].to','3 then 4');await set('sel[0].urg','4');const to3=await val('sel[0].to');
  await set('sel[0].type','Precursor');const to4=await val('sel[0].to');
  check('B1 Goes to sheet follows the Type: a cluster to 3 then 4, a single topography to 4; set by hand it stays until the type changes',to1==='3 then 4'&&to2==='4'&&to3==='3 then 4'&&to4==='4',[to1,to2,to3,to4].join(' | '));
  await set('sel[0].lab','Hitting others');await set('sel[0].rep','Asks for a break');
  const c0=await page.evaluate(()=>({lab:document.querySelector('[name="tgt[0].lab"]').value,type:document.querySelector('[name="tgt[0].type"]').value,urg:document.querySelector('[name="tgt[0].urg"]').value,rep:document.querySelector('[name="tgt[0].rep"]').value,title:document.querySelector('#tgtTtl0').textContent}));
  check('B2 the selected target starts card 1: label, type, urgency and paired replacement, and the card’s title',c0.lab==='Hitting others'&&c0.type==='Precursor'&&c0.urg==='4'&&c0.rep==='Asks for a break'&&c0.title==='Hitting others',JSON.stringify(c0));
  await set('tgt[0].lab','Hitting peers');await set('sel[0].lab','Hits');
  await set('tgt[0].type','Single topography');await set('sel[0].type','Cluster (multiple topographies)');
  const c0b=await page.evaluate(()=>({lab:document.querySelector('[name="tgt[0].lab"]').value,type:document.querySelector('[name="tgt[0].type"]').value}));
  check('B3 a card edited on the Definitions sheet keeps its own label and type when the table changes',c0b.lab==='Hitting peers'&&c0b.type==='Single topography',JSON.stringify(c0b));
  await set('sel[1].lab','Scream');await set('sel[1].lab','Screaming');
  check('B4 the table\u2019s own later edits follow through while the card holds what the table gave it',await val('tgt[1].lab')==='Screaming');
  /* ---- C. the library's starting definition offered ---- */
  await view('define');await sleep(200);
  const off1=await page.evaluate(h=>{const r=document.querySelector(h).shadowRoot;const o=r.querySelector('.offer');return {hidden:o.hidden,text:o.querySelector('.ot').textContent,pick:r.querySelector('.pick').value};},host(1));
  check('C1 card 2 (Screaming, no definition yet) offers the library\u2019s Screaming entry, its picker set to it',!off1.hidden&&/The library has a starting definition for \u201cScreaming\u201d: Screaming/.test(off1.text)&&off1.pick==='tan-scream',JSON.stringify(off1));
  await page.screenshot({path:OUT+'/offer.png'});
  await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.ostart').click(),host(1));await sleep(500);
  const ld=await page.evaluate(h=>{const r=document.querySelector(h).shadowRoot;return {def:document.querySelector('[name="tgt[1].def"]').value.slice(0,30),hidden:r.querySelector('.offer').hidden,msg:r.querySelector('.msg').textContent.slice(0,40),style:document.querySelector('[name="tgt[1].style"]').value};},host(1));
  check('C2 Start from it loads the definition into the card, the offer goes, the Loaded note shows',ld.def.length>10&&ld.hidden&&/Loaded from the library: Screaming/.test(ld.msg)&&ld.style!=='',JSON.stringify(ld));
  await set('tgt[0].lab','Zzyzx wobbling');await set('tgt[0].lab','Zzyzx wobbling','change');
  const off0=await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.offer').hidden,host(0));
  await set('tgt[0].lab','Hitting');await set('tgt[0].lab','Hitting','change');
  const off0b=await page.evaluate(h=>{const r=document.querySelector(h).shadowRoot;return {hidden:r.querySelector('.offer').hidden,text:r.querySelector('.ot').textContent};},host(0));
  check('C3 a card label typed by hand that the library knows by another name (Hitting) is offered the entry; a label it does not know is not',off0===true&&!off0b.hidden&&/Hitting others \(fist, forearm, or elbow\)/.test(off0b.text),JSON.stringify(off0b));
  /* ---- D. the candidates marked Target taken into the targets ---- */
  await view('select');
  await page.evaluate(()=>{for(let i=0;i<3;i++){const el=document.querySelector(`[name="sel[${i}].lab"]`);el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));}});
  await set('tgt[1].lab','');await set('tgt[0].lab','');
  await page.click('#selFromCand');await sleep(400);
  const took=await page.evaluate(()=>({n:+document.querySelector('#nTgt').value,labs:[0,1,2,3].map(i=>document.querySelector(`[name="sel[${i}].lab"]`).value).join('|'),types:[0,1,2].map(i=>document.querySelector(`[name="sel[${i}].type"]`).value).join('|'),to:[0,1,2].map(i=>document.querySelector(`[name="sel[${i}].to"]`).value).join('|'),urg:[0,1,2].map(i=>document.querySelector(`[name="sel[${i}].urg"]`).value).join('|'),cards:[0,1,2].map(i=>document.querySelector(`[name="tgt[${i}].lab"]`).value).join('|'),note:document.querySelector('#selNote').textContent}));
  check('D1 Take the candidates marked Target fills the empty rows in order with the label, the type from the decision, the urgency and the sheet, and the cards take the labels',took.labs==='Hitting others|Screaming|Asks for a break|'&&took.types==='Single topography|Cluster (multiple topographies)|Replacement / alternative behavior'&&took.to==='4|3 then 4|4'&&took.urg==='4|3|4'&&took.cards==='Hitting others|Screaming|Asks for a break'&&/3 candidates added to the targets \(rows 1, 2, 3\)/.test(took.note),JSON.stringify(took));
  await page.click('#selFromCand');await sleep(200);
  check('D2 pressed again, nothing is added twice',/Every candidate marked Target is in the targets already/.test(await page.evaluate(()=>document.querySelector('#selNote').textContent)));
  for(let i=4;i<9;i++)await page.click('#addCand');
  for(let i=4;i<9;i++){await set(`cand[${i}].beh`,'Extra '+i);await set(`cand[${i}].dec`,'Target – precursor');}
  await page.evaluate(()=>{const el=document.querySelector('#nTgt');el.value='3';el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.click('#selFromCand');await sleep(400);
  const grew=await page.evaluate(()=>({n:+document.querySelector('#nTgt').value,rows:document.querySelectorAll('#selBody tr').length,cards:document.querySelectorAll('#tgtWrap .card').length,last:document.querySelector('[name="sel[7].lab"]').value,note:document.querySelector('#selNote').textContent}));
  check('D3 the number of targets grows to fit the candidates taken (here 3 to 8), rows and cards alike',grew.n===8&&grew.rows===8&&grew.cards===8&&grew.last==='Extra 8'&&/5 candidates added/.test(grew.note),JSON.stringify(grew));
  /* ---- E. my bank ---- */
  await view('define');
  await set('tgt[0].def','Contact of the hand with a peer, audible from 1 m.');await set('tgt[0].ex','A slap.\nA punch.\nA push with both hands.');await set('tgt[0].style','Topographical');await set('tgt[0].dim','Count / rate');
  await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.bank').click(),host(0));await sleep(300);
  const dlg=await page.evaluate(()=>{const r=document.querySelector('#tb1BankHost').shadowRoot,d=r.querySelector('dialog');return {open:d.open,lab:r.querySelector('.bklab').value,what:r.querySelector('.bkwhat').textContent.slice(0,40),inDoc:document.querySelectorAll('input.bklab').length};});
  check('E1 Save this definition to my bank opens the dialog (in a shadow root, so its boxes are not the form’s) with the card’s label',dlg.open&&dlg.lab==='Hitting others'&&/Target 1/.test(dlg.what)&&dlg.inDoc===0,JSON.stringify(dlg));
  await page.evaluate(()=>{const r=document.querySelector('#tb1BankHost').shadowRoot;const l=r.querySelector('.bklab');l.value='Hitting others (Sam)';l.dispatchEvent(new Event('input'));r.querySelector('.bkaka').value='hits, sam hitting';r.querySelector('.bksave').click();});await sleep(700);
  const saved=await page.evaluate(h=>{const r=document.querySelector(h).shadowRoot,sel=r.querySelector('.pick');const og=sel.querySelector('optgroup');return {closed:!document.querySelector('#tb1BankHost').shadowRoot.querySelector('dialog').open,first:og&&og.label,opt:og&&og.querySelector('option')&&og.querySelector('option').textContent,toast:(document.querySelector('.nbh-toast')||{}).textContent||''};},host(1));saved.n=await libN();
  check('E2 saved: the toast says so; on another card’s picker the bank’s entry is offered first, under My definitions',saved.closed&&saved.first==='My definitions'&&saved.opt==='Hitting others (Sam)'&&saved.n===208&&/Saved to my bank: “Hitting others \(Sam\)”/.test(saved.toast),JSON.stringify(saved));
  const cand=await page.evaluate(()=>{const r=document.querySelector('#tb1LibCand').shadowRoot,q=r.querySelector('.q');q.value='sam hitting';q.dispatchEvent(new Event('input'));const sel=r.querySelector('.pick');return {val:sel.value,ph:sel.options[0].textContent};});
  check('E3 the candidate picker finds it by its other name and chooses it',/^my-/.test(cand.val)&&/1 match/.test(cand.ph),JSON.stringify(cand));
  const panel=await page.evaluate(()=>{const r=document.querySelector('#tb1LibPanel').shadowRoot,cat=r.querySelector('.cat');return {first:cat.options[1].textContent,bn:r.querySelector('.bn').textContent.slice(0,30),all:cat.options[0].textContent};});
  check('E4 the panel’s categories start with My definitions (1) and its bank line counts one',panel.first==='My definitions (1)'&&/1 definition of your own/.test(panel.bn)&&/208/.test(panel.all),JSON.stringify(panel));
  await page.reload();await sleep(1000);await page.evaluate(()=>{window.confirm=()=>true;});await view('define');
  const kept=await page.evaluate(h=>{const sel=document.querySelector(h).shadowRoot.querySelector('.pick'),og=sel.querySelector('optgroup');return {first:og&&og.label,lab:og&&og.querySelector('option').textContent};},host(0));kept.n=await libN();
  check('E5 the bank is kept across a reload (this browser\u2019s store)',kept.n===208&&kept.first==='My definitions'&&kept.lab==='Hitting others (Sam)',JSON.stringify(kept));
  await set('tgt[0].lab','Hitting others (Sam)');await set('tgt[0].lab','Hitting others (Sam)','change');await sleep(150);
  const offMine=await page.evaluate(h=>{const r=document.querySelector(h).shadowRoot;return {hidden:r.querySelector('.offer').hidden,text:r.querySelector('.ot').textContent};},host(0));
  check('E6 a card named as the bank’s entry is offered it ("Your bank has a starting definition")',!offMine.hidden&&/^Your bank has a starting definition for “Hitting others \(Sam\)”/.test(offMine.text),JSON.stringify(offMine));
  await page.evaluate(h=>document.querySelector(h).shadowRoot.querySelector('.ostart').click(),host(0));await sleep(400);
  check('E7 loading it fills the card with the saved definition and examples',await page.evaluate(()=>document.querySelector('[name="tgt[0].def"]').value==='Contact of the hand with a peer, audible from 1 m.'&&document.querySelector('[name="tgt[0].ex"]').value.split('\n').length===3&&document.querySelector('[name="tgt[0].dim"]').value==='Count / rate'));
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.bsave').click());await sleep(500);
  const exp=await page.evaluate(()=>{let o=null;try{o=JSON.parse(window.__saved||'');}catch(e){}return o&&o.nbh==='tb1-bank'&&o.entries.length===1&&o.entries[0].lab==='Hitting others (Sam)'&&o.entries[0].aka.join()==='hits,sam hitting';});
  check('E8 Save the bank to a file writes a bank file with the entry',exp===true);
  await page.evaluate(()=>{const r=document.querySelector('#tb1LibPanel').shadowRoot;r.querySelector('.q').value='sam';r.querySelector('.q').dispatchEvent(new Event('input'));r.querySelector('.it').click();});await sleep(200);
  const det=await page.evaluate(()=>{const r=document.querySelector('#tb1LibPanel').shadowRoot;return {mine:!!r.querySelector('.minep'),txt:(r.querySelector('.minep')||{}).textContent||''};});
  await page.evaluate(()=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.bdel').click());await sleep(600);
  const gone=await page.evaluate(()=>({cat:document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.cat').options[1].textContent,def:document.querySelector('[name="tgt[0].def"]').value.slice(0,20)}));gone.n=await libN();
  check('E9 the panel shows the bank’s entry as its own and removes it; the card keeps its text',det.mine&&/In my bank, saved \d{4}-\d{2}-\d{2}/.test(det.txt)&&gone.n===207&&!/My definitions/.test(gone.cat)&&gone.def==='Contact of the hand ',JSON.stringify(det)+' '+JSON.stringify(gone));
  await page.evaluate(()=>{const r=document.querySelector('#tb1LibPanel').shadowRoot,i=r.querySelector('.bin');const dt=new DataTransfer();dt.items.add(new File([window.__saved],'bank.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change'));});await sleep(600);
  const imp=await page.evaluate(()=>({bn:document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.bn').textContent}));imp.n=await libN();
  check('E10 Open a bank file brings the entry back',imp.n===208&&/1 definition added/.test(imp.bn),JSON.stringify(imp));
  await page.evaluate(()=>{const r=document.querySelector('#tb1LibPanel').shadowRoot,i=r.querySelector('.bin');const dt=new DataTransfer();dt.items.add(new File(['{"form":"TB-1"}'],'x.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change'));});await sleep(400);
  check('E11 another file is refused',/not a bank file of Form TB-1/.test(await page.evaluate(()=>document.querySelector('#tb1LibPanel').shadowRoot.querySelector('.bn').textContent)));
  /* ---- F. the form's own file: shape unchanged; the bank is not in it ---- */
  const f2=await saveFile();
  check('F1 the saved file holds counts and fields as before, the bank’s boxes not among them, no bank entry in it',f2.form==='TB-1'&&typeof f2.counts.cand==='number'&&!Object.keys(f2.fields).some(k=>/bk|bank/i.test(k))&&!JSON.stringify(f2).includes('my-'),Object.keys(f2.fields).filter(k=>!/^(cand|sel|tgt|m\.|rrb|ft|rev|clus|qc|ioa)/.test(k)).join(','));
  check('F2 the Send row is hidden on the form opened on its own',await page.evaluate(()=>getComputedStyle(document.querySelector('#sendRow')).display==='none'));
  await page.screenshot({path:OUT+'/define.png'});
  check('G0 no errors on the form',!log.length,JSON.stringify(log).slice(0,400));
  /* ---- G. in the workstation: the Send button ---- */
  const log2=[];const sh=await ctx.newPage();wire(sh,log2);await sh.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);
  const open=async id=>{await sh.evaluate(id=>openForm(id),id);const fr=await sh.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const hd=await open('HD-1');const tb=await open('TB-1');
  const row=await tb.evaluate(()=>getComputedStyle(document.querySelector('#sendRow')).display);
  await tb.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(600);
  await tb.evaluate(()=>{document.querySelector('#viewSeg button[data-view="define"]').click();document.querySelector('#sendTgt').click();});await sleep(2500);
  const sent=await tb.evaluate(()=>document.querySelector('#sendNote').textContent);
  const got=await hd.evaluate(()=>S.bh.map(b=>b.name).filter(Boolean));
  check('G1 in the workstation the Send row shows; Send the targets reads the case and the other open form takes the targets; the note says so',row==='flex'&&/Sent to 1 other open form\./.test(sent)&&got.length>=3,row+' | '+sent.slice(0,80)+' | '+got.join(', '));
  check('G2 no errors in the workstation',!log2.length,JSON.stringify(log2).slice(0,400));
  await br.close();console.log('RESULT: '+(fails?fails+' FAILED':'ALL PASS'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
