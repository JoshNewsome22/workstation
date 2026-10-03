const L=require(__dirname+'/lib.js');const {chromium,sleep,BASE}=L;const fs=require('fs'),crypto=require('crypto');
const S=__dirname+'/out';
const norm=buf=>{let s=buf.toString('latin1');s=s.replace(/\/CreationDate \([^)]*\)/g,'/CreationDate (X)').replace(/\/ModDate \([^)]*\)/g,'/ModDate (X)').replace(/\/ID \[<[0-9a-fA-F]+> <[0-9a-fA-F]+>\]/g,'/ID [<X> <X>]');return Buffer.from(s,'latin1');};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 const log=[];const page=await ctx.newPage();L.wire(page,log);const url=BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html';
 await page.goto(url,{waitUntil:'load'});await sleep(800);
 /* every view, the walkthrough stories stepped, the drill */
 for(const v of await page.$$eval('#viewSeg button',b=>b.map(x=>x.dataset.view))){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(250);}
 const stories=await page.$$('.story[data-story]');let steps=0;
 for(const st of stories){const next=await st.$('[data-act="next"]');for(let i=0;i<12;i++){if(!next)break;await next.click().catch(()=>{});steps++;await sleep(120);}}
 const drill=await page.$('.scene[data-scene="drill"] svg.tbl');console.log('stories stepped',stories.length,'steps',steps,'drill scene',!!drill);
 const opt=await page.$('#wk-qopts button');if(opt){await opt.click();await sleep(300);await page.click('#wk-qnext');await sleep(600);}
 console.log('errors after views/stories/drill:',JSON.stringify(log).slice(0,400));
 /* phone */
 await page.setViewportSize({width:390,height:800});await sleep(400);await page.click('#viewSeg button[data-view="walk"]').catch(()=>{});await sleep(400);
 console.log('phone scroll/client',await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth].join('/')));
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
 console.log('print bytes',buf.length,'LOG',JSON.stringify(log).slice(0,300));await br.close();})();
