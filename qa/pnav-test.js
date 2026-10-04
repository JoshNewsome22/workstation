/* the server: lib.js's BASE (WS_URL, default the :8123 every check here uses) */
const {chromium,fs,wire,sleep,forms,BASE}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();
 for(const f of forms()){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+f.file);await sleep(500);
  const info=await page.evaluate(()=>{const n=document.querySelector('.nbh-pagenav');if(!n)return{bar:false};
    return{bar:true,hidden:n.hidden,where:n.querySelector('.nbh-pn-where').textContent,next:n.querySelector('.nbh-pn-next').textContent,w:Math.round(n.getBoundingClientRect().width)};});
  let steps=0,last='';
  if(info.bar&&!info.hidden){for(let k=0;k<20;k++){const nx=await page.$('.nbh-pn-next');if(!nx||await nx.isDisabled())break;
     await page.evaluate(()=>window.scrollTo(0,400));await nx.click();await sleep(150);steps++;
     last=await page.evaluate(()=>document.querySelector('.nbh-pn-where').textContent+' y='+window.scrollY);}}
  console.log(f.id.padEnd(6),JSON.stringify(info),'steps',steps,last,log.length?'ERR '+JSON.stringify(log).slice(0,200):'');
  await page.close();}
 await br.close();})();
