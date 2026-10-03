/* print each walkthrough form from its stored snapshot and compare with the last run (date-normalised) */
const L=require(__dirname+'/lib.js');const {chromium,sleep,BASE}=L;const fs=require('fs');
const S=__dirname+'/out';
const norm=buf=>{let s=buf.toString('latin1');s=s.replace(/\/CreationDate \([^)]*\)/g,'/CreationDate (X)').replace(/\/ModDate \([^)]*\)/g,'/ModDate (X)').replace(/\/ID \[<[0-9a-fA-F]+> <[0-9a-fA-F]+>\]/g,'/ID [<X> <X>]');return Buffer.from(s,'latin1');};
const FORMS=L.forms().filter(f=>['RA-1','PA-1','EA-1','ABC-1','AD-1','DT-1'].includes(f.id));
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 fs.mkdirSync(S+'/qa/print/scene2',{recursive:true});
 for(const f of FORMS){const log=[];const page=await ctx.newPage();L.wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+f.file,{waitUntil:'load'});await sleep(800);
  const sf=S+'/qa/data/'+f.id+'.snap.json';
  if(fs.existsSync(sf)){const snap=JSON.parse(fs.readFileSync(sf,'utf8'));await page.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){window.removeEventListener('message',h);res(ev.data.report);}};window.addEventListener('message',h);window.postMessage({nbh:'restore',snap:s},'*');}),snap);await sleep(1800);}
  await page.emulateMedia({media:'print'});await sleep(500);const buf=norm(await page.pdf({preferCSSPageSize:true,printBackground:true}));await page.emulateMedia({media:null});
  fs.writeFileSync(S+'/qa/print/scene2/'+f.id+'.pdf',buf);process.stderr.write(f.id+' ');
  if(log.length)console.log(f.id,'LOG',JSON.stringify(log).slice(0,200));await page.close();}
 await br.close();console.log('done');})();
