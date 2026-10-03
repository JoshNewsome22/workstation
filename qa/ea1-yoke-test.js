/* v21.37: EA-1's yoked control on the runner: a master session keeps its delivery times, a yoked session replays them */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/EA-1_Experimental-Analysis-Protocol_v2026-09.html';
const PRE=__dirname+'/out/yoke/EA-1_pre.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const pages=buf=>{const m=buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:1000}});
 /* the runner's clock runs 20 times faster than real time; the cue loops still tick in real time */
 await ctx.addInitScript(()=>{const r=performance.now.bind(performance);const t0=r();performance.now=()=>t0+(r()-t0)*20;window.confirm=()=>true;window.alert=()=>{};});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 /* the yoked variant: its three cards */
 await page.evaluate(()=>{const v=document.querySelector('[name="v.chosen"]');const o=[...v.options].find(o=>/yoked/i.test(o.textContent+' '+o.value));v.value=o.value;v.dispatchEvent(new Event('change',{bubbles:true}));v.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
 await page.evaluate(()=>document.querySelector('#loadTpl').click());await sleep(500);
 const cards=await page.evaluate(()=>[...document.querySelectorAll('#condWrap .card')].map(c=>c.querySelector('[name$=".name"]').value));
 ok('yoked template loads its cards',/master/i.test(cards[0])&&/yoked/i.test(cards[1]),cards);
 const condOpts=await page.evaluate(()=>[...document.querySelector('#eaCond').options].map(o=>o.textContent));
 ok('picker hidden before any record',await page.evaluate(()=>document.querySelector('#eaYokeL').hidden),condOpts);
 /* master session: 1 min at 20x, consequence 10 s, targets at ~5, 20 and 35 s (the third inside a period: no delivery) */
 await page.evaluate(()=>{const s=document.querySelector('#eaCond');s.value='0';s.dispatchEvent(new Event('change'));});await sleep(100);
 const d0=await page.evaluate(()=>({mode:eaMode.value,cons:eaCons.value,ncr:eaNcr.value}));
 await page.evaluate(()=>{eaMin.value='1';eaCons.value='10';eaStart.click();});
 const at=async s=>{await page.waitForFunction(s=>eaRunner.elapsed()>=s*1000,s,{timeout:20000});await page.evaluate(()=>eaTarget.click());};
 await at(5);await at(20);await at(24);await at(35);
 await page.waitForFunction(()=>eaRunner.state()==='done',null,{timeout:20000});
 const m=await page.evaluate(()=>({del:eaRunner.yoke().del.map(t=>Math.round(t/1000)),count:eaRunner.count(),sum:eaSum.textContent}));
 ok('master: three deliveries recorded, the target inside a period makes none',m.del.length===3&&m.del[0]===5&&m.del[1]===20&&m.del[2]===35,m);
 ok('master summary names the record',/Deliveries recorded3 \(times kept/.test(m.sum.replace(/\s+/g,' '))||/Deliveries recorded/.test(m.sum),m.sum.slice(0,300));
 await page.evaluate(()=>eaSave.click());await sleep(300);
 const row=await page.evaluate(()=>({y:document.querySelector('[name="s[0].y"]').value,n:document.querySelector('[name="s[0].n"]').value,c:document.querySelector('[name="s[0].c"]').value,v:document.querySelector('[name="s[0].v"]').value}));
 ok('log row 1 keeps the record and says so in the notes',/^v1;cons=10;min=1;t=5\.\d,20\.\d,35\.\d$/.test(row.y)&&/3 deliveries, times kept/.test(row.n)&&row.v==='4',row);
 /* the runner moved to the yoked card and offers the record */
 const pk=await page.evaluate(()=>({cond:eaCond.selectedOptions[0].textContent,shown:!eaYokeL.hidden,opts:[...eaYoke.options].map(o=>o.textContent),val:eaYoke.value,min:eaMin.value,cons:eaCons.value,ncr:eaNcr.value}));
 ok('yoked card preselects session 1 and takes its length and period',/yoked/i.test(pk.cond)&&pk.shown&&pk.val==='0'&&pk.min==='1'&&pk.cons==='10'&&pk.ncr==='0'&&/Session 1 .*3 deliveries/.test(pk.opts[1]),pk);
 /* the yoked session: a target at 3 s and one at 19 s; the deliveries at 5 and 20 land within 3 s of them, the one at 35 does not */
 await page.evaluate(()=>eaStart.click());
 await page.waitForFunction(()=>eaRunner.elapsed()>=3000,null,{timeout:20000});const noCons=await page.evaluate(()=>{eaTarget.click();return eaRunner.cons();});
 await page.waitForFunction(()=>eaRunner.elapsed()>=6000,null,{timeout:20000});
 const cue1=await page.evaluate(()=>({y:eaRunner.yoke(),cue:eaCue.textContent,cons:eaRunner.cons()}));
 ok('first delivery cued at 5 s and opened the period; the target at 3 s got nothing of its own',cue1.y.i===1&&cue1.cons>0&&noCons===0,{cue1,noCons});
 await page.waitForFunction(()=>eaRunner.elapsed()>=19000,null,{timeout:20000});await page.evaluate(()=>eaTarget.click());
 await page.waitForFunction(()=>eaRunner.state()==='done',null,{timeout:30000});
 const y=await page.evaluate(()=>({y:eaRunner.yoke(),sum:eaSum.textContent.replace(/\s+/g,' ')}));
 ok('three deliveries replayed, two within 3 s of a target',y.y.n===3&&y.y.hit===2,y.y);
 ok('summary says so',/Replayed deliveries3 of 3 from session 1/.test(y.sum)&&/Within 3 s of a target2/.test(y.sum),y.sum.slice(0,400));
 await page.evaluate(()=>eaSave.click());await sleep(300);
 const row2=await page.evaluate(()=>({y:document.querySelector('[name="s[1].y"]').value,n:document.querySelector('[name="s[1].n"]').value,c:document.querySelector('[name="s[1].c"]').value}));
 ok('row 2 notes the yoke and keeps no record of its own',row2.y===''&&/yoked to session 1: 3 of 3 deliveries replayed, 2 within 3 s/.test(row2.n)&&row2.c==='1',row2);
 /* save and reopen: the record survives */
 const data=await page.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
   const b=document.querySelector('#saveBtn,#btnSave,#dl-json')||[...document.querySelectorAll('button')].find(b=>/^\s*save data\s*$/i.test(b.textContent));b.click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():null;});
 ok('save data gives a file',!!data&&data.length>1000,data&&data.slice(0,80));
 await page.reload();await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 const inp=await page.$('#fileIn,#fileImport,#file-input');await inp.setInputFiles({name:'ea1.json',mimeType:'application/json',buffer:Buffer.from(data)});await sleep(800);
 await page.evaluate(()=>{const s=document.querySelector('#eaCond');s.dispatchEvent(new Event('change'));});await sleep(100);
 const back=await page.evaluate(()=>({y:document.querySelector('[name="s[0].y"]').value,opts:[...eaYoke.options].length,shown:!eaYokeL.hidden}));
 ok('restored file still offers the record',/^v1;cons=10/.test(back.y)&&back.opts===2&&back.shown,back);
 /* an ordinary condition is untouched: no yoke, its own consequence */
 await page.evaluate(()=>{eaYoke.value='';eaYoke.dispatchEvent(new Event('change'));const s=document.querySelector('#eaCond');s.value='2';s.dispatchEvent(new Event('change'));});await sleep(100);
 const play=await page.evaluate(()=>({yoke:eaYoke.value,ncr:eaNcr.value,cons:eaCons.value}));
 ok('control card: no replay, its own schedule',play.yoke===''&&+play.ncr>0,play);
 /* print: blank unchanged against the pre-edit copy; the hidden record never prints */
 const p2=await ctx.newPage();const count=async url=>{await p2.goto(url);await sleep(500);await p2.emulateMedia({media:'print'});const n=pages(await p2.pdf({preferCSSPageSize:true,printBackground:true}));await p2.emulateMedia({media:'screen'});return n;};
 const blankNow=await count(URL),blankPre=fs.existsSync(PRE)?await count('file://'+PRE):18;
 ok('blank print page count unchanged',blankNow===blankPre,{now:blankNow,pre:blankPre});
 ok('no console or page error',log.length===0,log);
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
