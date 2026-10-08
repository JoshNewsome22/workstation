/* v21.40: IA-1 audit fixes. FAST margin as a caution (1), consensus by informants (2), QABF endorsement (3), MAS mean and
   incomplete subscales (5), chance lines from the formula (6), m.fn carried to the packet (8), Clear all keeps the pasted
   wording (9), informant dates and the collector (10), the QABF page's X choice (12), the hypothesis draft (15), the
   informant-count confirm (19), the wording signature (21), and save / reload / open of the new fields. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const grab=async(page,fn)=>page.evaluate(async f=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};(new Function('return ('+f+')'))()();await new Promise(r=>setTimeout(r,600));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {text:got?await got.text():''};},fn.toString());
const QABF=Array.from({length:25},(_,i)=>(i+1)+'. Simulated QABF item '+(i+1)+' about the student and his or her behavior');
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);
 const stub=()=>page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await stub();
 const set=(n,v)=>page.evaluate(({n,v})=>{const e=document.querySelector('[name="'+n+'"]');if(!e)throw new Error('no field '+n);e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},{n,v});
 const get=n=>page.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;},n);
 const text=s=>page.evaluate(s=>(document.querySelector(s)||{textContent:''}).textContent.replace(/\s+/g,' '),s);
 const sim=async sc=>{await page.evaluate(s=>{document.querySelector('#simScenario').value=s;document.querySelector('#simBtn').click();},sc);await sleep(400);};
 const clearAll=async()=>{await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);};

 /* 1: FAST margin of one item is counted, with a caution; a tie is still no outcome */
 await page.evaluate(()=>{document.querySelector('#nInf').value='1';document.querySelector('#nInf').dispatchEvent(new Event('change'));});await sleep(150);
 for(let it=1;it<=16;it++)await set('fast[0]['+it+']',it<=2||it===5?'Y':'N');await sleep(200);
 let v=await text('#fastVerdict');
 ok('1: a one-item FAST margin is counted with a caution note',/A: Social positive[^.]*\(2\); second 1; margin 1\. Caution: margin of one item\./.test(v)&&!/weak differentiation/.test(v),v);
 let row=await text('#convTbl');
 ok('1: the convergence row counts it and shows the caution',/FAST[^]*counted[^]*margin of one item/.test(row)&&!/weak \(/.test(row),row);
 await set('fast[0][6]','Y');await sleep(200);v=await text('#fastVerdict');
 ok('1: a tie is still no outcome',/margin \d+: weak differentiation \(tie\)/.test(v),v);
 ok('1: the Guide and the FAST sheet say the published FAST has no margin rule',await page.evaluate(()=>/no published margin rule, the highest count of yes answers is the outcome/.test(document.querySelector('#guide').textContent)&&/The published FAST has no margin rule/.test(document.querySelector('#fast .cite').textContent)));

 /* 3: QABF endorsement; 5: MAS mean over the items answered and the incomplete flag */
 for(const it of [1,6,11])await set('qabf[0]['+it+']','3');for(const it of [16,21,2,7,12,17,22])await set('qabf[0]['+it+']','0');await sleep(200);
 v=await text('#qabfVerdict');
 ok('3: a leading QABF subscale with 3 of 5 items endorsed is flagged as weak support (this form\'s rule)',/Attention \(9\); second 0; margin 9\. Caution: leading subscale has only 3 of 5 items endorsed: weak support \(this form's rule\)/.test(v),v);
 for(const it of [1,5,9])await set('mas[0]['+it+']','6');for(const it of [2,6,10,14,3])await set('mas[0]['+it+']','1');await sleep(200);
 const mas=await page.evaluate(()=>({tot:document.querySelector('#masTot').textContent.replace(/\s+/g,' '),v:document.querySelector('#masVerdict').textContent.replace(/\s+/g,' ')}));
 ok('5: the MAS mean divides by the items answered (18 over 3 = 6.00) and the cell says 3 of 4 answered',/18M 6\.003 of 4 answered/.test(mas.tot),mas.tot);
 ok('5: the incomplete leading subscale is flagged beside the leading tag',/Sensory \(18\)[^.]*\. Caution: incomplete \(3 of 4 answered\)/.test(mas.v),mas.v);
 row=await text('#convTbl');
 ok('5: the convergence sheet shows the incomplete flag on the MAS row',/MAS[^]*incomplete \(3 of 4 answered\)/.test(row),row);
 ok('5: the MAS 10% margin rule is labelled this form\'s rule',await page.evaluate(()=>/margin under 10% of the subscale maximum is weak differentiation \(this form's rule\)/.test(document.querySelector('#mas').textContent)));

 /* 2: consensus by informants, printed first, outcomes second; at least 3 informants before any label */
 await sim('escape');
 v=await text('#convVerdict');
 ok('2: escape scenario: 2 of 3 informants first, outcomes second, majority wording',/Escape: 2 of 3 informants \(67%\)\s*\d+ of \d+ counted outcomes/.test(v)&&/Majority but not strong agreement/.test(v)&&!/Smith et al/.test(v),v);
 await sim('attention');v=await text('#convVerdict');
 ok('2 and 17: attention scenario: 3 of 3 informants, the FAST social-positive count, no Smith citation with 3 informants',/Attention \(includes 3 FAST social-positive outcomes\): 3 of 3 informants \(100%\)/.test(v)&&/Agreement across informants\./.test(v)&&!/Smith et al/.test(v),v);
 await page.evaluate(()=>{const e=document.querySelector('#nInf');e.value='2';e.dispatchEvent(new Event('change'));});await sleep(300);
 v=await text('#convVerdict');
 ok('2: with 2 informants no consensus label: "Only 2 informants with an outcome"',/Only 2 informants with an outcome/.test(v)&&/at least 3 informants/.test(v),v);
 await clearAll();await page.evaluate(()=>{const e=document.querySelector('#nInf');e.value='5';e.dispatchEvent(new Event('change'));});await sleep(200);
 for(let r=0;r<5;r++){for(let it=1;it<=25;it++)await set(`qabf[${r}][${it}]`,[1,6,11,16,21].includes(it)?'3':'0');}
 await set('int[0].fn','escape');await set('int[0].who','');await sleep(250);   /* an interview with no informant code: an outcome, not a vote */
 v=await text('#convVerdict');
 ok('2: five informants on the QABF: the Smith et al. sentence names the instrument and the count',/5 of 5 informants agree on the QABF: at or above the 4-of-5 level used by Smith et al\. \(2012\)/.test(v)&&/Attention: 5 of 5 informants \(100%\)/.test(v),v);
 ok('2: outcomes are the second line (6 counted: 5 QABF and 1 interview)',/5 of 6 counted outcomes/.test(v),v);
 await set('mas[0][2]','6');await set('mas[0][6]','6');await set('mas[0][10]','6');await set('mas[0][14]','6');await set('mas[0][3]','1');await sleep(250);
 v=await text('#convVerdict');
 ok('2: an informant whose categories tie (QABF attention, MAS escape) casts no vote',/Attention: 4 of 5 informants \(80%\)/.test(v)&&/1 informant with no single leading category/.test(v),v);

 /* 6: chance lines from the formula, named as chance under uniform responding */
 await sim('attention');
 const caps=await page.evaluate(()=>['fast','qabf','mas','pbq'].map(k=>document.querySelector('#'+k+'Fig2 .cap').textContent));
 ok('6: QABF caption: 4-point scale, exact 25.0%, within 1 62.5%',/chance under uniform responding on a 4-point scale \(exact 25\.0%, within 1 62\.5%\)/.test(caps[1]),caps[1]);
 ok('6: MAS and PBQ captions: 7-point scale, exact 14.3%, within 1 38.8%',/7-point scale \(exact 14\.3%, within 1 38\.8%\)/.test(caps[2])&&/7-point scale \(exact 14\.3%, within 1 38\.8%\)/.test(caps[3]),caps[2]);
 ok('6: FAST caption: a yes/no item (50%); the Likert captions quote Iwata et al. on the 6-point range as about 50% and draw the exact value',/chance under uniform responding on a yes\/no item \(50%\)/.test(caps[0])&&!/6-point range/.test(caps[0])&&/described within-1 agreement on a 6-point range as about 50% chance/.test(caps[1]),caps);
 const lines=await page.evaluate(()=>[...document.querySelectorAll('#masFig2 .reflab')].map(t=>t.textContent));
 ok('6: the MAS figure draws the two chance lines',lines.includes('within-1 chance 39%')&&lines.includes('exact chance 14%'),lines);

 /* 8: m.fn set from the leading category, never overwriting a chosen value */
 ok('8: m.fn takes the leading category (attention) when empty',(await get('m.fn'))==='attention');
 await set('m.fn','escape');await set('qabf[0][1]','0');await sleep(250);
 ok('8: a chosen value is kept when the sheet recomputes',(await get('m.fn'))==='escape');
 ok('8: the select is on the Convergence sheet, labelled for the packet, with the eight options',await page.evaluate(()=>{const e=document.querySelector('#summary [name="m.fn"]');return !!e&&[...e.options].map(o=>o.value).join()===',attention,tangible,escape,automatic,physical,multiple,undetermined'&&/carried to the packet/.test(document.querySelector('label[for="mFn"]').textContent);}));
 await sim('tangible');
 ok('8: tangible scenario: the FAST social-positive outcome follows the tangible lead',(await get('m.fn'))==='tangible'&&/Tangible \(includes 3 FAST social-positive outcomes\)/.test(await text('#convVerdict')));

 /* 15: the draft fills the empty fields only */
 await sim('escape');await set('hyp.alt','typed by the assessor');
 await page.evaluate(()=>document.querySelector('#hypDraft').click());await sleep(200);
 const hyp=await page.evaluate(()=>['hyp.c','hyp.alt','hyp.se','hyp.idio','hyp.b'].map(n=>document.querySelector('[name="'+n+'"]').value));
 ok('15: function field reads as a hypothesis with the informant and outcome counts',/^The indirect data suggest escape \(2 of 3 informants; \d+ of \d+ counted outcomes\)/.test(hyp[0]),hyp[0]);
 ok('15: typed text is kept',hyp[1]==='typed by the assessor',hyp[1]);
 ok('15: setting events from the interviews; idiosyncratic variables from the interviews; the behavior label',/short sleep \(parent report\)/.test(hyp[2])&&/multi-step math worksheets/.test(hyp[3])&&/Aggression toward staff/.test(hyp[4]),hyp);
 await set('hyp.c','my own');await page.evaluate(()=>document.querySelector('#hypDraft').click());await sleep(150);
 ok('15: a second draft changes nothing already written',(await get('hyp.c'))==='my own');

 /* 19: lowering the informant count asks when a dropped column holds scores; cancel keeps the count */
 await page.evaluate(()=>{window.confirm=()=>false;});
 await page.evaluate(()=>{const e=document.querySelector('#nInf');e.value='2';e.dispatchEvent(new Event('change'));});await sleep(300);
 ok('19: cancel restores the count and keeps column C',await page.evaluate(()=>document.querySelector('#nInf').value==='3'&&!!document.querySelector('[name="fast[2][1]"]')&&document.querySelector('[name="fast[2][1]"]').value!==''));
 await stub();await page.evaluate(()=>{const e=document.querySelector('#nInf');e.value='2';e.dispatchEvent(new Event('change'));});await sleep(300);
 ok('19: confirmed, the column goes',await page.evaluate(()=>document.querySelector('#nInf').value==='2'&&!document.querySelector('[name="fast[2][1]"]')));

 /* 10: the date column, the spread note, and the collector writing the date; 12: the QABF page's X choice */
 await clearAll();
 ok('10: the informant table has a date column',await page.evaluate(()=>!!document.querySelector('[name="inf[0].date"]')&&/Date given/.test(document.querySelector('#infTbl thead').textContent)));
 await set('inf[0].date','9/1/2026');await set('inf[1].date','9/5/2026');await sleep(250);
 let note=await page.evaluate(()=>({hidden:document.querySelector('#infDateNote').hidden,t:document.querySelector('#infDateNote').textContent}));
 ok('10: a spread over 3 days shows the note',!note.hidden&&/more than 3 days apart \(4 days/.test(note.t)&&/within-3-days rule is not met/.test(note.t),note);
 await set('inf[1].date','9/4/2026');await sleep(250);note=await page.evaluate(()=>document.querySelector('#infDateNote').hidden);
 ok('10: a spread of 3 days hides it',note===true);
 await set('m.beh','Self-injury');await set('rp.w.qabf',QABF.join('\n'));
 const pay=await page.evaluate(()=>{rpInst.value='qabf';return __rp.payloadFor({label:'Self-injury',sing:'self-injury',plur:'self-injurious behaviors',def:'Forceful contact.'});});
 ok('12: the QABF payload carries the X choice',pay.scale.na===true&&pay.scale.naLabel==='X: does not apply',pay.scale);
 ok('21: the payload carries the wording signature (40 characters, lower case)',pay.sig==='simulated qabf item 1 about the student '&&pay.sig.length===40,pay.sig);
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(await page.evaluate(p=>NBH_RESPOND.pageHTML(p),pay),{waitUntil:'load'});await sleep(200);
 const x=await rp.evaluate(()=>{const li=document.querySelector('li.it');const inp=li.querySelector('input[value="NA"]');return {has:!!inp,label:inp?inp.closest('label').textContent.trim():''};});
 ok('12: the respondent page offers X: does not apply on each item',x.has&&/X: does not apply/.test(x.label),x);
 const ans=Array.from({length:25},(_,i)=>i===2?'NA':String(i%4));
 const codes=await page.evaluate(({ans,sig})=>[NBH_RESPOND.encode({v:1,form:'IA-1',inst:'qabf',student:'S',beh:'Self-injury',n:25,ans,date:'2026-09-15',name:'Ms. Rivera',role:'Teacher',confirmed:'yes',sig}),NBH_RESPOND.encode({v:1,form:'IA-1',inst:'qabf',student:'S',beh:'Self-injury',n:25,ans,date:'2026-09-16',name:'Mr. Okafor',role:'Para',confirmed:'yes',sig:'a different first item of another copy of'})],{ans,sig:pay.sig});
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(c=>{rcText.value=c.join('\n');__rp.read([rcText.value]);},codes);await sleep(150);
 const rc=await page.evaluate(()=>({rows:[...document.querySelectorAll('#rcOut tbody tr')].map(tr=>({checked:tr.querySelector('[data-rc]').checked,t:tr.textContent}))}));
 ok('21: a response whose wording differs is marked and left unticked; the matching one is ticked',rc.rows.length===2&&rc.rows[0].checked&&!/wording differs/.test(rc.rows[0].t)&&!rc.rows[1].checked&&/wording differs from this form's: check the item order/.test(rc.rows[1].t),rc);
 await set('inf[0].date','');await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>({a1:document.querySelector('[name="qabf[0][1]"]').value,a3:document.querySelector('[name="qabf[0][3]"]').value,a4:document.querySelector('[name="qabf[0][4]"]').value,date:document.querySelector('[name="inf[0].date"]').value,name:document.querySelector('[name="inf[0].name"]').value,banner:document.querySelector('#gfBanner').textContent}));
 ok('12: the collector blanks the X answer and places the rest',placed.a1==='0'&&placed.a3===''&&placed.a4==='3'&&placed.name==='Ms. Rivera',placed);
 ok('10: the collector writes the response date into the empty date slot as m/d/yyyy',placed.date==='9/15/2026',placed.date);
 ok('10: the collector counts 24 answers (the X is blank, not unread)',/24 answers\./.test(placed.banner),placed.banner);

 /* 9: Clear all keeps the pasted wording, the terms and the video link; clears the name and pronouns */
 await set('rp.name','Georgi');await set('rp.pron','he');await set('rp.video','https://youtu.be/abc');await set('rp.terms','{"self-injury":{"sing":"self-injury"}}');
 await set('m.fn','escape');
 let txt='';await page.evaluate(()=>{window.confirm=m=>{window.__q=String(m);return true;};});await clearAll();txt=await page.evaluate(()=>window.__q||'');await stub();
 const kept=await page.evaluate(()=>['rp.w.qabf','rp.terms','rp.video','rp.name','rp.pron','m.fn','inf[0].date','m.beh'].map(n=>document.querySelector('[name="'+n+'"]').value));
 ok('9: Clear all keeps rp.w.*, rp.terms and rp.video and clears rp.name, rp.pron, m.fn, the date and the target',kept[0].length>100&&/self-injury/.test(kept[1])&&kept[2]==='https://youtu.be/abc'&&kept[3]===''&&kept[4]===''&&kept[5]===''&&kept[6]===''&&kept[7]==='',kept.map(k=>k.slice(0,30)));
 ok('9: the confirm text says what stays',/pasted item wording, the respondent terms and the video link stay/.test(txt),txt);

 /* save, reload, open: the new fields travel */
 await sim('attention');await set('inf[0].date','9/2/2026');await set('inf[2].date','9/9/2026');await set('m.fn','tangible');await sleep(250);
 const data=(await grab(page,()=>document.querySelector('#saveBtn').click())).text;
 ok('save: m.fn and the dates are in the file',/"m\.fn": ?"tangible"/.test(data)&&/"inf\[2\]\.date": ?"9\/9\/2026"/.test(data));
 await page.reload();await sleep(600);await stub();
 await (await page.$('#fileIn')).setInputFiles({name:'ia1.json',mimeType:'application/json',buffer:Buffer.from(data)});await sleep(500);
 const back=await page.evaluate(()=>({fn:document.querySelector('[name="m.fn"]').value,d0:document.querySelector('[name="inf[0].date"]').value,d2:document.querySelector('[name="inf[2].date"]').value,note:document.querySelector('#infDateNote').hidden,n:document.querySelector('#nInf').value}));
 ok('open: m.fn (the chosen value, not the lead), the dates and the spread note come back',back.fn==='tangible'&&back.d0==='9/2/2026'&&back.d2==='9/9/2026'&&back.note===false&&back.n==='3',back);
 await page.evaluate(()=>{window.confirm=()=>false;const e=document.querySelector('#nInf');e.value='1';e.dispatchEvent(new Event('change'));});await sleep(300);
 ok('19: after Open, lowering the count still asks (the previous count is tracked through restore)',await page.evaluate(()=>document.querySelector('#nInf').value==='3'));

 /* 4 and 16: labels */
 const lab=await page.evaluate(()=>({opt:document.querySelector('#pbqVer option[value="18"]').textContent,pbq:document.querySelector('#pbq').textContent,glance:document.querySelector('#guide table.glance').textContent,setup:document.querySelector('label[for="rpwPbq"]').textContent,guide:document.querySelector('#guide').textContent}));
 ok('4: the 18-item PBQ is named the circulating 18-item adaptation with its profile-sheet key (sheet, Setup, Guide) and sum-and-rank is this form\'s rule',/18-item adaptation that circulates with its own profile sheet \(key from its profile sheet, no published reliability\)/.test(lab.opt)&&/sum and rank: this form's rule/.test(lab.pbq)&&/18-item adaptation that circulates with its own profile sheet/.test(lab.glance)&&/18 in the 18-item adaptation/.test(lab.setup),lab.opt);
 ok('16: the 12-of-18 threshold and "conditions, not a function" are labelled this form\'s rule',/not a function \(this form's rule\)/.test(lab.pbq)&&/at or above 12 of 18 is not a function \(this form's rule\)/.test(lab.guide));
 ok('7: the Guide says the Iwata 2013 figures were checked and the others are transcribed; the FAST figure and the Pub. column say Table 3 was checked',/Iwata et al\. \(2013\) and Smith et al\. \(2012\) were checked against the article \(October 2026\); the figures from the other studies are transcribed from their tables/.test(lab.guide)&&await page.evaluate(()=>/Table 3 values checked against the article/.test(document.querySelector('#fastFig3 .cap').textContent)&&/checked against the article/.test(document.querySelector('#fastGrid th[title^="Published"]').title)));
 ok('22: the Setup sheet says one file for every target behavior of the student (v21.64)',await page.evaluate(()=>/One file for every target behavior of the student/.test(document.querySelector('#setup').textContent)));
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 await br.close();console.log('RESULT '+(fails?fails+' FAIL':'all pass'));process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
