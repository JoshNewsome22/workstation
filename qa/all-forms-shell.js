/* every form opens in the shell, answers status, takes a simulation, answers facts? and facts without a script error */
const {chromium,BASE,wire,sleep,forms,loadSim}=require('./lib');
(async()=>{const ed=process.argv[2]||'NBH-Workstation';const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1440,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ed+'/index.html');await sleep(700);
 const F=forms(ed);const bad=[];let n=0;
 for(const f of F){const before=log.length;
  await page.evaluate(i=>openForm(i),f.id);const ok=await page.waitForFunction(i=>!!state.status[i],f.id,{timeout:20000}).then(()=>true).catch(()=>false);
  const fr=page.frames().find(x=>x.url().includes(f.file));
  if(fr){await loadSim(fr);await sleep(500);}
  const r=await page.evaluate(async i=>{const a=await grab(i,'facts?',null,3000);const b=await grab(i,'facts',{facts:{behaviors:[{label:'Probe behavior',def:'a probe'}],fn:{key:'escape',label:'Escape / avoidance (social negative)'},src:{behaviors:'TB-1',fn:'FS-1'}}},3000);
    return {out:!!(a&&a.facts),applied:!!(b&&b.report),rep:b&&b.report?JSON.stringify(b.report).slice(0,80):''};},f.id);
  const btn=fr?await fr.evaluate(()=>{const b=document.querySelector('#nbhCaseBtn');return b?(b.closest('.nbh-case-grp').hidden?'hidden':b.textContent):'none';}):'noframe';
  const errs=log.slice(before).filter(l=>l.type==='pageerror').map(l=>l.text);
  if(!ok||errs.length||!r.applied)bad.push({id:f.id,ok,errs,r});
  console.log(f.id.padEnd(6),ok?'ok ':'NO ',r.out?'out':'   ',r.applied?'in ':'   ',r.rep.padEnd(50),btn.slice(0,40),errs.length?'ERR '+errs[0].slice(0,80):'');n++;
  /* close it so the shell does not hold 42 frames */
  await page.evaluate(()=>$('#closeForm').click());await sleep(150);await page.evaluate(()=>{const b=document.querySelector('#cfFoot button.danger');if(b)b.click();});await sleep(150);}
 console.log('forms',n,'bad',JSON.stringify(bad).slice(0,600));await br.close();})();
