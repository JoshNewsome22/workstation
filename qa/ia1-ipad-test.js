/* IA-1 respondent dialog: the fixes from the iPad screenshots (v21.40c) */
const {chromium,BASE,loadSim,wire,sleep}=require('./lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(x||'').slice(0,300)));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1024,height:768}});const page=await ctx.newPage();wire(page,log);
 await page.goto(URL);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 /* the case bridge writes "Label: definition" into m.beh; the dialog must split it */
 await page.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.beh','Aggression: Forceful contact of the student’s hand, foot, or head with any part of an adult’s body.');set('m.def','');set('m.email','bcba@example.org');});
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const t1=await page.evaluate(()=>({opt:rpTarget.options[0].textContent,def:document.querySelector('#rpTargets [data-rt="def"]').value,label:document.querySelector('#rpTargets td b').textContent}));
 ok('"Label: definition" in the behavior field becomes a label and a definition',t1.label==='Aggression'&&/^Forceful contact/.test(t1.def)&&/^Aggression \(this form\)/.test(t1.opt),t1);
 /* no wording pasted: the buttons are off but tappable, and a tap flashes the reason */
 const off=await page.evaluate(()=>{const b=document.querySelector('#rpPreview');const was=b.classList.contains('off')&&!b.disabled;b.click();return {was,flash:document.querySelector('#rpStatus').classList.contains('rp-flash'),prev:document.querySelector('#rpPrevDlg').open,text:document.querySelector('#rpStatus').textContent};});
 ok('without wording the buttons are off yet tappable; a tap flashes the status instead of doing nothing',off.was&&off.flash&&!off.prev&&/No wording for the FAST/.test(off.text),off);
 /* the layout: the definition column is not squeezed */
 const w=await page.evaluate(()=>{const td=[...document.querySelectorAll('#rpTargets tbody tr:first-child td')].map(e=>e.getBoundingClientRect().width);return td;});
 ok('targets table: the definition column is at least a quarter of the table',w.length===4&&w[3]>=0.25*(w[0]+w[1]+w[2]+w[3]),w);
 /* with wording: preview opens inside the form in an iframe; the link shows in a box */
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await page.evaluate(()=>{const e=document.querySelector('[name="rp.w.fast"]');e.value=Array.from({length:16},(_,i)=>(i+1)+'. Does the problem behavior occur when the student is asked to work? (item '+(i+1)+')').join('\n');e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 await page.evaluate(()=>document.querySelector('#rpPreview').click());await sleep(600);
 const pv=await page.evaluate(()=>{const d=document.querySelector('#rpPrevDlg'),f=document.querySelector('#rpPrevFrame');const doc=f.contentDocument;return {open:d.open,items:doc?doc.querySelectorAll('li.it').length:0,q1:doc?doc.querySelector('li.it .q').textContent:'',conf:doc?!!doc.querySelector('#nbhr-conf'):false};});
 ok('Preview opens inside the form: 16 personalized items and the definition question in the iframe',pv.open&&pv.items===16&&/when Georgi is asked to work|when the student is asked to work/.test(pv.q1)&&pv.conf,pv);
 await page.evaluate(()=>document.querySelector('#rpPrevClose').click());
 await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('refused'));document.querySelector('#rpLink').click();});await sleep(300);
 const lk=await page.evaluate(()=>({hidden:document.querySelector('#rpLinkBox').hidden,val:document.querySelector('#rpLinkBox').value,note:document.querySelector('#rpNote').textContent}));
 ok('Copy a link with the clipboard refused: the link is in the box with a note to copy it from there',!lk.hidden&&/respond\.html#[pz]=[A-Za-z0-9_-]{40,}/.test(lk.val)&&/select the link in the box/.test(lk.note),lk);
 /* the wording, the link and the email are remembered on this device and fill a fresh form */
 await page.evaluate(()=>{document.querySelector('#rpDlg').close();const e=document.querySelector('[name="rp.video"]');e.value='https://youtu.be/x1';e.dispatchEvent(new Event('input',{bubbles:true}));});
 const dev1=await page.evaluate(()=>({note:document.querySelector('#rpDevNote').hidden?'':document.querySelector('#rpDevText').textContent,store:Object.keys(JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}'))}));
 ok('the Setup sheet says what this device remembers',/Remembered on this device: the FAST wording, the instructions link, your email/.test(dev1.note)&&dev1.store.sort().join()==='m.email,rp.video,rp.w.fast',dev1);
 await page.goto(URL);await sleep(900);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 const dev2=await page.evaluate(()=>({w:document.querySelector('[name="rp.w.fast"]').value.split('\n').length,v:document.querySelector('[name="rp.video"]').value,m:document.querySelector('[name="m.email"]').value,count:document.querySelector('[data-rpw="fast"]').textContent}));
 ok('a fresh IA-1 on this device carries the wording, the link and the email',dev2.w===16&&dev2.v==='https://youtu.be/x1'&&dev2.m==='bcba@example.org'&&/16 pasted/.test(dev2.count),dev2);
 await page.evaluate(()=>document.querySelector('#rpDevForget').click());
 const dev3=await page.evaluate(()=>({hidden:document.querySelector('#rpDevNote').hidden,store:localStorage.getItem('nbh.ia1.respondent')}));
 ok('Forget on this device clears the memory and the note',dev3.hidden&&dev3.store===null,dev3);
 ok('no console or page error',log.length===0,log);
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
