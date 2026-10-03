const {chromium,BASE,wire,sleep,forms}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1200,height:900}});wire(page,log);
 for(const f of forms().filter(x=>['DM-1','IC-1','RR-1','TB-1','IA-1','PA-1','RA-1','EA-1','TD-1','MS-1','OB-1','GB-1'].includes(x.id))){await page.goto(BASE+'/NBH-Workstation/'+f.file);await sleep(700);await page.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(1500);
  const r=await page.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(x=>x.dataset.view+':'+(x.dataset.nbhFill||'-')+(x.title?'('+x.title.replace(' fields filled','')+')':'')).join(' '));
  const errs=log.filter(l=>l.type==='pageerror').length;log.length=0;console.log(f.id.padEnd(6),errs?'ERR ':'    ',r.slice(0,230));}
 await br.close();})();
