/* the Previous/Next page bar in every form (v21.25; pass or fail since v22.12, review F505): Next walks from page 1 to
   the last page. The server: lib.js's BASE (WS_URL). */
const {chromium,fs,wire,sleep,forms,BASE}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const bad=[],errs=[];let n=0;
 for(const f of forms()){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+f.file);await sleep(500);
  const info=await page.evaluate(()=>{const n=document.querySelector('.nbh-pagenav');if(!n)return{bar:false};
    return{bar:true,hidden:n.hidden,where:n.querySelector('.nbh-pn-where').textContent};});
  let steps=0,last='';
  if(info.bar&&!info.hidden){for(let k=0;k<30;k++){const nx=await page.$('.nbh-pn-next');if(!nx||await nx.isDisabled())break;
     await page.evaluate(()=>window.scrollTo(0,400));await nx.click();await sleep(150);steps++;
     last=await page.evaluate(()=>document.querySelector('.nbh-pn-where').textContent);}
   const m=/^Page 1 of (\d+)/.exec(info.where);n++;
   if(!m||steps!==+m[1]-1||!new RegExp('^Page '+m[1]+' of '+m[1]).test(last))bad.push(f.id+': '+info.where+' -> '+steps+' steps -> '+last);}
  else if(!info.bar)bad.push(f.id+': no page bar');
  if(log.length)errs.push(f.id+': '+JSON.stringify(log).slice(0,200));
  console.log(f.id.padEnd(6),JSON.stringify(info),'steps',steps,last);
  await page.close();}
 ok('1 every form has the page bar, and in the '+n+' with more than one page Next walks from page 1 to the last',!bad.length,bad);
 ok('2 no page errors',!errs.length,errs);
 await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
