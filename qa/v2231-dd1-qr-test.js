/* v22.31 Form DD-1: the staff links' QR codes on the printed data sheet. Each link that works (not stopped) prints its code
   under the sheet, with who it is for and its link code, so the staff scan it from the paper; made as the form prints and
   taken away after (a copy of the page, the master print's, never carries it); "Print each working link's code" unticked
   prints none; the screen never shows the strip. box.php runs here with php -S, as in qa/v2185-p-test.js. Simulated only.
   usage: node qa/v2231-dd1-qr-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');const {spawn}=require('child_process');
const W=BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
const PORT=+(process.env.BOX_PORT2||18159),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{
  const data=fs.mkdtempSync(path.join(require('os').tmpdir(),'ddqr-'));
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');const j=await r.json();up=!!(j&&j.ok);}catch(e){}}
  ok('0 box.php answers (php -S on '+PORT+')',up);if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900}});const dd=await ctx.newPage();dd.on('pageerror',e=>errs.push(e.message));
  await dd.goto(W,{waitUntil:'load'});await sleep(1200);
  await dd.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
    S=blankState();S.meta.client='Mateo Rivera';S.meta.id='4471823';
    const mk=(name,measure)=>({id:uid('b'),kind:'target',name,definition:name+' (simulated).',obsLength:'Entire school day',measure,direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Physical aggression','count'),mk('Elopement','count')];S.rows=[];renderAll();
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));});
  await dd.evaluate(u=>{document.getElementById('stAdv').open=true;const i=document.getElementById('stBoxIn');i.value=u;i.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);
  const mk=async who=>{await dd.fill('#stWho',who);await dd.evaluate(()=>document.querySelector('#stTgts input[data-stt]').checked=true);await dd.evaluate(()=>document.getElementById('stMake').click());await sleep(1200);await dd.evaluate(()=>{const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();});};
  const n0=await dd.evaluate(()=>{stPaint();return document.getElementById('stPrtNote').textContent;});
  ok('0 no link yet: the panel says no code prints on the sheet until a link is made',/No working link yet/.test(n0)&&/Make the link/.test(n0),n0);
  await mk('Ms. A (simulated)');await mk('Mr. B (simulated)');
  await dd.evaluate(()=>{const l=S.staff.links.find(x=>/Mr\. B/.test(x.who));l.off=true;stPaint();});
  const scr=await dd.evaluate(()=>({html:document.getElementById('stPrintQr').innerHTML,shown:!!document.getElementById('stPrintQr').getClientRects().length,box:document.getElementById('stPrtOn').checked,note:document.getElementById('stPrtNote').textContent}));
  ok('1 on screen: no QR strip (it is made only for paper); the box "Print each working link’s code" is ticked; the panel says one code prints',!scr.html&&!scr.shown&&scr.box&&/Printed with the sheet: 1 code\./.test(scr.note),scr);
  await dd.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await dd.emulateMedia({media:'print'});await sleep(300);
  const pr=await dd.evaluate(()=>{const el=document.getElementById('stPrintQr'),l=S.staff.links.find(x=>/Ms\. A/.test(x.who)),cards=[...el.querySelectorAll('.st-pq')];const r=el.getBoundingClientRect();
    return {shown:!!el.getClientRects().length,n:cards.length,who:cards.map(c=>c.querySelector('b').textContent),code:cards[0]&&cards[0].textContent.indexOf('Code '+l.code)>=0,same:(()=>{if(!cards[0])return false;const t=document.createElement('div');t.innerHTML=ddQrSvg(stUrlOf(l));const a=cards[0].querySelector('svg path'),b=t.querySelector('svg path');return !!a&&!!b&&a.getAttribute('d')===b.getAttribute('d')&&a.getAttribute('d').length>100;})(),
      w:cards[0]&&Math.round(cards[0].querySelector('.st-pq-c').getBoundingClientRect().width),after:!!el.compareDocumentPosition(document.getElementById('sheetDefs'))};});
  ok('2 printing: under the sheet, one code for the working link (the stopped one left out), named for who it is for, with its link code',pr.shown&&pr.n===1&&pr.who[0]==='Scan to record: Ms. A (simulated)'&&pr.code,pr);
  ok('2 the code is the link’s own (the QR of the staff link), about 1.3 in wide',pr.same&&pr.w>=110&&pr.w<=140,pr);
  await dd.emulateMedia({media:'screen'});await dd.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  const aft=await dd.evaluate(()=>document.getElementById('stPrintQr').innerHTML);
  ok('3 after printing the strip is taken away again (a copy of the page never carries it)',!aft,aft.slice(0,80));
  await dd.evaluate(()=>{const c=document.getElementById('stPrtOn');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));window.dispatchEvent(new Event('beforeprint'));});
  const off=await dd.evaluate(()=>({html:document.getElementById('stPrintQr').innerHTML,keep:S.staff.noPrintQr===true,norm:stNorm(JSON.parse(JSON.stringify(S.staff))).noPrintQr===true}));
  await dd.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  ok('4 unticked: nothing printed, and the choice is kept in the record',!off.html&&off.keep&&off.norm,off);
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();php.kill();try{fs.rmSync(data,{recursive:true,force:true});}catch(e){}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
