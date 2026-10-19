/* Form RA-1 regression: every view, every step of every walkthrough story and a practice question with no errors, the
   Walkthrough on a phone within its width, and the form's print (compared with the last run's, for information).
   v22.71: pass or fail. usage: node qa/ra1-regress.js */
const L=require(__dirname+'/lib.js');const {chromium,sleep,BASE}=L;const fs=require('fs'),crypto=require('crypto');
const S=__dirname+'/out';
const norm=buf=>{let s=buf.toString('latin1');s=s.replace(/\/CreationDate \([^)]*\)/g,'/CreationDate (X)').replace(/\/ModDate \([^)]*\)/g,'/ModDate (X)').replace(/\/ID \[<[0-9a-fA-F]+> <[0-9a-fA-F]+>\]/g,'/ID [<X> <X>]');return Buffer.from(s,'latin1');};
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 const log=[];const page=await ctx.newPage();L.wire(page,log);const url=BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html';
 await page.goto(url,{waitUntil:'load'});await sleep(800);
 /* every view, then the Walkthrough: every step of every story, and a practice question answered. v22.71: the stories are
    stepped in the Walkthrough view (stepping them while another view showed waited out a hidden button's timeout on every
    click), and they draw with NBHTable, the table seen from above */
 for(const v of await page.$$eval('#viewSeg button',b=>b.map(x=>x.dataset.view))){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(250);}
 await page.click('#viewSeg button[data-view="walk"]');await sleep(500);
 const st=await page.evaluate(async()=>{const out={stories:0,steps:0};for(const k in window.SCENES){out.stories++;const S=window.SCENES[k];for(let i=0;i<S.frames.length;i++){S.go(i);out.steps++;await new Promise(r=>setTimeout(r,40));}}return out;});
 const drill=!!(await page.$('#walk .scene.nst:not(.story .scene)'));
 ok('1 every step of every story drawn ('+st.stories+' stories, '+st.steps+' steps), and the practice scene',st.stories===6&&st.steps>40&&drill,{st,drill});
 const opt=await page.$('#wk-qopts button');if(opt){await opt.click({timeout:3000});await sleep(300);const nx=await page.$('#wk-qnext');if(nx)await nx.click({timeout:3000}).catch(()=>{});await sleep(600);}
 ok('2 no errors in the views, the stories or the practice',!log.length,log);
 /* phone */
 await page.setViewportSize({width:390,height:800});await sleep(400);await page.click('#viewSeg button[data-view="walk"]').catch(()=>{});await sleep(400);
 const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
 ok('3 on a phone the Walkthrough fits the width ('+sw.join('/')+')',sw[0]<=sw[1]+1,sw);
 await page.setViewportSize({width:1280,height:900});
 /* the normal print from the stored snapshot, against the last run. v21.37: the snapshot lives in qa/data (where
    printbase.js keeps it); when it is missing, the simulation is loaded, its snapshot written and said so, and this
    run's print becomes the one later runs compare against. */
 await page.goto(url,{waitUntil:'load'});await sleep(800);
 const DATA=L.path.join(__dirname,'data'),sf=L.path.join(DATA,'RA-1.snap.json');fs.mkdirSync(DATA,{recursive:true});
 let snap=null;
 if(fs.existsSync(sf)){snap=JSON.parse(fs.readFileSync(sf,'utf8'));
   await page.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){window.removeEventListener('message',h);res(ev.data.report);}};window.addEventListener('message',h);window.postMessage({nbh:'restore',snap:s},'*');}),snap);await sleep(1500);
   console.log('snapshot restored from',sf);}
 else{await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(2000);
   snap=await page.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='snapshot'&&ev.data.snap){window.removeEventListener('message',h);res(ev.data.snap);}};window.addEventListener('message',h);window.postMessage({nbh:'snapshot'},'*');setTimeout(()=>res(null),10000);}));
   if(snap){fs.writeFileSync(sf,JSON.stringify(snap));console.log('no snapshot yet: the simulation was loaded and its snapshot written to',sf,'(first run); later runs restore it');}
   else console.log('no snapshot yet and none could be taken; printing the simulation as loaded');}
 await page.emulateMedia({media:'print'});await sleep(500);const buf=norm(await page.pdf({preferCSSPageSize:true,printBackground:true}));await page.emulateMedia({media:null});
 const pages=b=>(b.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 const out=S+'/anim/v2/RA-1-print.pdf';fs.mkdirSync(S+'/anim/v2',{recursive:true});
 if(fs.existsSync(out)){const prev=fs.readFileSync(out);console.log('print vs the last run:',prev.equals(buf)?'identical':'differs','('+pages(prev)+' -> '+pages(buf)+' pages)');}
 else console.log('first print kept for the next run:',pages(buf),'pages');
 fs.writeFileSync(out,buf);
 ok('4 the form prints ('+pages(buf)+' pages), with no errors',pages(buf)>0&&!log.length,log);
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
