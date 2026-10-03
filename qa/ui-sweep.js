const {chromium,BASE,wire,sleep,forms,loadSim}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1200,height:900}});wire(page,log);
 for(const f of forms()){await page.goto(BASE+'/NBH-Workstation/'+f.file);await sleep(700);await loadSim(page);await sleep(1200);
  const r=await page.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button[data-view]')];if(!b.length)return 'NO VIEWSEG';return b.map(x=>x.dataset.view+':'+(x.dataset.nbhFill||'-')+(x.title?'('+x.title.replace(' fields filled','')+')':'')).join(' ');});
  const errs=log.filter(l=>l.type==='pageerror').length;log.length=0;
  console.log(f.id.padEnd(6),errs?'ERR ':'    ',r.slice(0,200));}
 await br.close();})();
