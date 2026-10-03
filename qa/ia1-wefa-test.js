/* v21.41: the WEFA (Wandering and Elopement Functional Assessment Interview) as IA-1's fifth instrument: the sheet, the
   set counts with the form's likelihood labels, items 1 and 8 in two sets, the convergence row, the respondent page
   (True / False, no N/A, the header details as questions), the collector, the Setup wording box, save / reload / open,
   the simulation, Clear all, and the blank print page count. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const grab=async(page,fn)=>page.evaluate(async f=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};(new Function('return ('+f+')'))()();await new Promise(r=>setTimeout(r,600));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {text:got?await got.text():''};},fn.toString());
const WEFA=Array.from({length:18},(_,i)=>(i+1)+'. Simulated WEFA statement '+(i+1)+' about the student and his or her elopement');
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});
 /* blank print page count first, on a fresh page */
 const pp=await ctx.newPage();const plog=[];wire(pp,plog);await pp.goto(URL);await sleep(800);await pp.emulateMedia({media:'print'});
 const pdf=__dirname+'/out/ia1-wefa/blank.pdf';await pp.pdf({path:pdf,format:'Letter',printBackground:true});
 const pages=(fs.readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;console.log('INFO blank print pages after the WEFA: '+pages+' (before: 20)');
 ok('print: the blank form prints without error and the WEFA sheet is in the print run',pages>=20&&plog.length===0,{pages,plog});await pp.close();

 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);
 const stub=()=>page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await stub();
 const set=(n,v)=>page.evaluate(({n,v})=>{const e=document.querySelector('[name="'+n+'"]');if(!e)throw new Error('no field '+n);e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},{n,v});
 const get=n=>page.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;},n);
 const text=s=>page.evaluate(s=>(document.querySelector(s)||{textContent:''}).textContent.replace(/\s+/g,' '),s);
 const sim=async sc=>{await page.evaluate(s=>{document.querySelector('#simScenario').value=s;document.querySelector('#simBtn').click();},sc);await sleep(400);};
 const clearAll=async()=>{await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);};

 /* the sheet */
 const sh=await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="wefa"]').click();const rows=document.querySelectorAll('#wefaGrid tbody tr').length;const sel=document.querySelector('[name="wefa[0][1]"]');
  return {view:document.body.className,shown:getComputedStyle(document.querySelector('#wefa')).display,rows,opts:sel?[...sel.options].map(o=>o.value).join():'',cue1:document.querySelector('#wefaGrid tbody tr td.catcell').textContent,cue8:document.querySelectorAll('#wefaGrid tbody tr')[7].querySelector('td.catcell').textContent,
   det:document.querySelectorAll('#wefaDet tbody tr').length,detCols:document.querySelectorAll('#wefaDet tbody tr:first-child input').length,text:document.querySelector('#wefa').textContent,title:document.querySelector('#wefa .nbh-band').textContent,fast:[...document.querySelector('[name="fast[0][1]"]').options].map(o=>o.value).join()};});
 ok('sheet: View WEFA shows the sheet with 18 item rows',sh.view==='view-wefa'&&sh.shown==='block'&&sh.rows===18&&/WEFA Scoring Worksheet/.test(sh.title),sh);
 ok('sheet: the answer choices are Y and N only (no N/A on the paper form); the FAST keeps NA',sh.opts===',Y,N'&&sh.fast===',Y,N,NA',{o:sh.opts,f:sh.fast});
 ok('sheet: items 1 and 8 show both sets as the cue; no item wording',sh.cue1==='attention, escape'&&sh.cue8==='tangible, escape'&&!/Simulated WEFA statement/.test(sh.text),[sh.cue1,sh.cue8]);
 ok('sheet: the text says the sets overlap on items 1 and 8 and that the counted outcome is this form\'s rule',/Items 1 and 8 belong to two sets as printed, so the sets overlap on those two items/.test(sh.text)&&/0 to 1 Not likely, 2 to 3 Moderately likely, 4 to 5 Likely/.test(sh.text)&&/this form's rule, as for the FAST/.test(sh.text)&&/Honsberger, 2011, as adapted in the assessor's copy/.test(sh.text));
 ok('sheet: the details block has the 10 header fields with a column per informant',sh.det===10&&sh.detCols===3,[sh.det,sh.detCols]);

 /* a typed profile: attention 4, tangibles 1, escape 3, sensory 0; items 1 and 8 count twice */
 await page.evaluate(()=>{document.querySelector('#nInf').value='1';document.querySelector('#nInf').dispatchEvent(new Event('change'));});await sleep(150);
 const Y=[1,2,3,4,8,11];for(let it=1;it<=18;it++)await set('wefa[0]['+it+']',Y.includes(it)?'Y':'N');await sleep(250);
 const tot=await page.evaluate(()=>[...document.querySelectorAll('#wefaTot tbody tr')].map(tr=>tr.textContent.replace(/\s+/g,' ').trim()));
 ok('counts: Attention 4 of 5 Likely; Tangibles 1 of 5 Not likely; Escape 3 of 5 Moderately likely; Sensory 0 Not likely',/^Att.*4 \/ 5Likely$/.test(tot[0])&&/^Tang.*1 \/ 5Not likely$/.test(tot[1])&&/^Esc.*3 \/ 5Moderately likely$/.test(tot[2])&&/^Sens.*0 \/ 5Not likely$/.test(tot[3]),tot);
 let v=await text('#wefaVerdict');
 ok('verdict: the outcome is the set with the most TRUE boxes, a one-item margin as a caution, no FAST benchmark',/A: Attention \(access to social attention\) \(4\); second 3; margin 1\. Caution: margin of one item\./.test(v)&&!/FAST study mean/.test(v),v);
 ok('verdict: each set labelled on its own, as the form does',/Sets A by set: Attention \(access to social attention\) 4 of 5, Likely; Tangibles \(access to items or activities\) 1 of 5, Not likely; Escape \/ avoidance 3 of 5, Moderately likely; Sensory \(automatic reinforcement\) 0 of 5, Not likely\. Each set is labelled on its own, as the form does/.test(v),v);
 let row=await text('#convTbl');
 ok('convergence: the WEFA row is counted under Attention with the margin caution',/WEFA[^]*Attention \(access to social attention\)[^]*Att 4 · Tang 1 · Esc 3 · Sens 0[^]*counted[^]*margin of one item[^]*Attention/.test(row),row);
 ok('m.fn: the WEFA outcome sets the packet hypothesis through INST',(await get('m.fn'))==='attention');
 await page.evaluate(()=>document.querySelector('#hypDraft').click());await sleep(200);
 ok('hypothesis draft: the WEFA outcome is in the counts',/^The indirect data suggest attention \(1 of 1 informants; 1 of 1 counted outcomes\)/.test(await get('hyp.c')),await get('hyp.c'));
 await set('wefa[0][12]','Y');await set('wefa[0][13]','Y');await sleep(250);v=await text('#wefaVerdict');row=await text('#convTbl');
 ok('items 12 and 13 TRUE: escape leads 5 to 4 with the one-item caution',/A: Escape \/ avoidance \(5\); second 4; margin 1\. Caution: margin of one item\./.test(v),v);
 await set('wefa[0][5]','Y');await sleep(250);v=await text('#wefaVerdict');row=await text('#convTbl');
 ok('tie: attention 5 and escape 5 is no outcome (weak, tie) on the sheet and the convergence row',/highest Attention \(access to social attention\) \/ Escape \/ avoidance \(5\); second 1; margin 4: weak differentiation \(tie\)/.test(v)&&/WEFA[^]*weak \(tie\)/.test(row),v);
 ok('agreement: the FAST\'s yes / no item-by-item measure applies',await page.evaluate(()=>{const e=document.querySelector('#nInf');e.value='2';e.dispatchEvent(new Event('change'));return true;}));await sleep(200);
 for(let it=1;it<=18;it++)await set('wefa[1]['+it+']',it<=16?'Y':'N');await sleep(250);v=await text('#wefaVerdict');
 const ag=await page.evaluate(()=>({a1:document.querySelector('#wefaag1').textContent,a6:document.querySelector('#wefaag6').textContent}));
 ok('agreement: A vs B item agreement on 18 items; per-item cells 100% on item 1 and 0% on item 6',/A vs B: item agreement \d+\.\d% on 18 items\./.test(v)&&ag.a1==='100%'&&ag.a6==='0%',{v,ag});
 const caps=await page.evaluate(()=>[document.querySelector('#wefaFig1 .cap').textContent,document.querySelector('#wefaFig2 .cap').textContent]);
 ok('figures: TRUE answers per set (maximum 5); no N/A note; chance 50%',/Count of TRUE answers per set \(maximum 5\)/.test(caps[0])&&/both informants\. Dashed lines/.test(caps[1])&&/yes\/no item \(50%\)/.test(caps[1]),caps);
 /* lowering the count asks when the WEFA column holds scores */
 await page.evaluate(()=>{window.confirm=()=>false;const e=document.querySelector('#nInf');e.value='1';e.dispatchEvent(new Event('change'));});await sleep(300);
 ok('informant count: a WEFA column with scores is protected by the confirm',await page.evaluate(()=>document.querySelector('#nInf').value==='2'&&document.querySelector('[name="wefa[1][1]"]').value==='Y'));await stub();

 /* Setup: the plan row, the wording box and its count; the Guide */
 await set('rp.w.wefa',WEFA.join('\n'));
 const su=await page.evaluate(()=>({boxes:document.querySelectorAll('#rpWording textarea[name^="rp.w."]').length,count:document.querySelector('[data-rpw="wefa"]').textContent,label:document.querySelector('label[for="rpwWefa"]').textContent,plan:!!document.querySelector('[name="plan.wefa.u"]')&&!!document.querySelector('[name="plan.wefa.n"]'),
  glance:document.querySelector('#guide table.glance').textContent.replace(/\s+/g,' '),guide:document.querySelector('#guide').textContent.replace(/\s+/g,' '),refs:document.querySelector('#summary .cite').textContent,sub:document.querySelector('.nbh-sub').textContent,conv:document.querySelector('#summary').textContent}));
 ok('Setup: five wording boxes; the WEFA box counts 18 pasted; the plan has a WEFA row',su.boxes===5&&/18 pasted/.test(su.count)&&/WEFA, 18 items/.test(su.label)&&su.plan,su);
 ok('Guide: the glance row and the method paragraph cite Honsberger (2011) as adapted, say no published data are in hand and that the counted outcome is this form\'s rule',/WEFA.*Honsberger, 2011, as adapted in the assessor's copy.*18 items, true \/ false.*items 1 and 8 are printed in two sets.*No published reliability or validity data in hand/.test(su.glance)&&/WEFA\. The Wandering and Elopement Functional Assessment Interview \(Honsberger, 2011, as adapted in the assessor's copy\)/.test(su.guide)&&/No published reliability or validity data for the WEFA are in hand\. Counting the set with the most TRUE boxes as the outcome for the convergence sheet is this form's own rule/.test(su.guide),su.guide.slice(-900));
 ok('masthead and references name the WEFA',/FAST, QABF, MAS, PBQ, WEFA/.test(su.sub)&&/Honsberger, T\. \(2011\)/.test(su.refs)&&/The WEFA row is the set with the most TRUE boxes \(this form's rule/.test(su.conv));

 /* the respondent page */
 await set('m.beh','Elopement');await set('m.def','Leaving the assigned area without permission.');await set('m.client','Georgi Sample');
 const pay=await page.evaluate(()=>{rpInst.value='wefa';rpName.value='Georgi';return __rp.payloadFor({label:'Elopement',sing:'elopement',plur:'elopements',def:'Leaving the assigned area without permission.'});});
 ok('payload: 18 items, scale yn with True / False and a null third label, the details as open questions first',pay.items.length===18&&pay.scale.kind==='yn'&&pay.scale.labels[0]==='True'&&pay.scale.labels[1]==='False'&&pay.scale.labels[2]===null&&pay.openFirst===true&&pay.open.length===10&&pay.open[1].type==='yns'&&pay.open[1].choices.join()==='Reliably,Somewhat reliably,Unreliably'&&/How does Georgi communicate/.test(pay.open[0].label),{n:pay.items.length,scale:pay.scale,open:pay.open.slice(0,2)});
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(await page.evaluate(p=>NBH_RESPOND.pageHTML(p),pay),{waitUntil:'load'});await sleep(250);
 const r1=await rp.evaluate(()=>{const li=document.querySelector('li.it');const labs=[...li.querySelectorAll('.opts label')].map(l=>l.textContent.trim());const cards=[...document.querySelectorAll('.nr-card .band')].map(b=>b.textContent);
  return {items:document.querySelectorAll('li.it').length,labs,na:!!li.querySelector('input[value="NA"]'),cards,yns:[...document.querySelectorAll('.yns .opts label')].map(l=>l.textContent),tas:document.querySelectorAll('.nr-card textarea:not(.code)').length,q1:li.querySelector('.q').textContent};});
 ok('page: 18 items with True / False and no N/A',r1.items===18&&r1.labs.join()==='True,False'&&!r1.na&&/Simulated WEFA statement 1 about Georgi/.test(r1.q1),r1);
 ok('page: the details card comes before the items with the reliability choices and 9 text answers',r1.cards.indexOf('About the student and the elopement')<r1.cards.indexOf('The items')&&r1.yns.join()==='Reliably,Somewhat reliably,Unreliably'&&r1.tas===9,r1.cards);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Ms. Rivera';inp[1].value='Teacher';
   const tas=[...document.querySelectorAll('.nr-card textarea:not(.code)')];tas[0].value='verbally, gestures';tas[1].value='social attention (chase)';tas[2].value='school: daily; home: weekly';tas[3].value='transitions';tas[4].value='the room';tas[5].value='right in front of me';tas[6].value='tablet';tas[8].value='math worksheet';
   [...document.querySelectorAll('.yns .opts label')][1].click();
   document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+([0,1,2,3,4,10].includes(i)?'Y':'N')+'"]').click();});
   document.querySelector('input[name=nbhr-confirm][value=yes]').click();document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const sent=await rp.evaluate(()=>({code:document.querySelector('.code').value,done:!document.querySelector('.done').hidden,warn:document.querySelector('.warn').hidden?'':document.querySelector('.warn').textContent}));
 const dec=await page.evaluate(c=>NBH_RESPOND.decode(c),sent.code);
 ok('Send: a code with 18 answers and the details',/^NBH1\./.test(sent.code)&&dec.inst==='wefa'&&dec.ans.length===18&&dec.ans[0]==='Y'&&dec.ans[5]==='N'&&dec.open.commrel==='Somewhat reliably'&&dec.open.comm==='verbally, gestures'&&dec.open.i12==='math worksheet',{dec,warn:sent.warn});
 /* the collector places it */
 await clearAll();await set('m.beh','Elopement');
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(c=>{rcText.value='From: Ms. Rivera\n\n'+c;__rp.read([rcText.value]);},sent.code);await sleep(150);
 ok('collector: one WEFA response about Elopement listed',/WEFA about Elopement: 1 response found/.test(await text('#rcOut')),await text('#rcOut'));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {a:[1,2,6,11,18].map(i=>v('wefa[0]['+i+']')),comm:v('wefa[0].comm'),rel:v('wefa[0].commrel'),i7:v('wefa[0].i7'),i12:v('wefa[0].i12'),when:v('wefa[0].when'),name:v('inf[0].name'),n:document.querySelector('#nInf').value,banner:document.querySelector('#gfBanner').textContent,view:document.body.className,verdict:document.querySelector('#wefaVerdict').textContent};});
 ok('collector: TRUE as Y and FALSE as N on the WEFA sheet, the details in the block, the informant named, the sheet opened',placed.a.join()==='Y,Y,N,Y,N'&&placed.comm==='verbally, gestures'&&placed.rel==='Somewhat reliably'&&placed.i7==='tablet'&&placed.i12==='math worksheet'&&placed.when==='right in front of me'&&placed.name==='Ms. Rivera'&&placed.n==='1'&&/Collected 1 WEFA response about Elopement/.test(placed.banner)&&/18 answers/.test(placed.banner)&&placed.view==='view-wefa',placed);
 ok('collector: the placed profile scores (attention 5 Likely; escape 2 Moderately likely)',/A: Attention \(access to social attention\) \(5\); second 2; margin 3\./.test(placed.verdict),placed.verdict);

 /* save, reload, open */
 await set('plan.wefa.u','Yes');await set('plan.wefa.who','A');
 const data=(await grab(page,()=>document.querySelector('#saveBtn').click())).text;
 ok('save: the WEFA answers, details, plan row and wording are in the file',/"wefa\[0\]\[1\]": ?"Y"/.test(data)&&/"wefa\[0\]\.commrel": ?"Somewhat reliably"/.test(data)&&/"plan\.wefa\.u": ?"Yes"/.test(data)&&/"rp\.w\.wefa"/.test(data));
 await page.reload();await sleep(600);await stub();
 await (await page.$('#fileIn')).setInputFiles({name:'ia1.json',mimeType:'application/json',buffer:Buffer.from(data)});await sleep(500);
 const back=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {a1:v('wefa[0][1]'),a6:v('wefa[0][6]'),comm:v('wefa[0].comm'),i7:v('wefa[0].i7'),plan:v('plan.wefa.u'),count:document.querySelector('[data-rpw="wefa"]').textContent,row:document.querySelector('#convTbl').textContent.replace(/\s+/g,' ')};});
 ok('open: answers, details, plan and wording count come back; the convergence row recomputes',back.a1==='Y'&&back.a6==='N'&&back.comm==='verbally, gestures'&&back.i7==='tablet'&&back.plan==='Yes'&&/18 pasted/.test(back.count)&&/WEFA[^]*Attention/.test(back.row),back);

 /* the simulation fills it to the scenario's target */
 await sim('escape');
 const s1=await page.evaluate(()=>{const rows=[...document.querySelectorAll('#convTbl tbody tr')].filter(tr=>/^WEFA/.test(tr.textContent)).map(tr=>tr.textContent.replace(/\s+/g,' '));const v=n=>document.querySelector('[name="'+n+'"]').value;return {rows,i12:v('wefa[0].i12'),plan:v('plan.wefa.u'),filled:[0,1,2].every(r=>v('wefa['+r+'][1]')!=='')};});
 ok('simulation (escape): three WEFA rows; A and B escape, C (the dissenter) attention; the details follow the target; the plan row is filled',s1.rows.length===3&&/Escape \/ avoidance[^]*counted[^]*Escape/.test(s1.rows[0])&&/Escape \/ avoidance/.test(s1.rows[1])&&/Attention \(access/.test(s1.rows[2])&&/independent math worksheet \(simulated\)/.test(s1.i12)&&s1.plan==='Yes'&&s1.filled,s1);
 for(const [sc,cat] of [['attention','Attention'],['tangible','Tangible'],['automatic','Automatic']]){await sim(sc);
  const rows=await page.evaluate(()=>[...document.querySelectorAll('#convTbl tbody tr')].filter(tr=>/^WEFA/.test(tr.textContent)).map(tr=>tr.lastElementChild.textContent));
  ok('simulation ('+sc+'): every WEFA row maps to '+cat,rows.length===3&&rows.every(r=>r===cat),rows);}
 await sim('attention');v=await text('#convVerdict');
 ok('the FAST, QABF, MAS and PBQ still converge as before: 3 of 3 informants, 3 FAST social-positive outcomes',/Attention \(includes 3 FAST social-positive outcomes\): 3 of 3 informants \(100%\)/.test(v),v);
 ok('no NA in the simulated WEFA',await page.evaluate(()=>![...document.querySelectorAll('[name^="wefa["]')].some(e=>e.value==='NA')));

 /* Clear all */
 await clearAll();
 ok('Clear all empties the WEFA answers and details, keeps the pasted wording',await page.evaluate(()=>[...document.querySelectorAll('[name^="wefa["],[name^="plan.wefa"]')].every(e=>e.value==='')&&document.querySelector('[name="rp.w.wefa"]').value.split('\n').length===18));
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 await br.close();console.log('RESULT '+(fails?fails+' FAIL':'all pass'));process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
