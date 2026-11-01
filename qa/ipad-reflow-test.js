/* v25.55 (form design audit): no form pushes the page sideways on an iPad. Every form, empty and with its simulated
   case loaded, at an iPad held upright (820 px) and the narrowest iPad held sideways (iPad mini, 1133 px). A wide table
   may scroll inside its own panel; the page itself may not. TD-1's sheets were 1000 px wide beside a 222 px menu, and a
   filled DD-1 table ran past a sideways iPad, before this check.
   usage: node qa/ipad-reflow-test.js   env ONLY=TD-1,DD-1 for some forms */
const L=require(__dirname+'/lib.js');const {sleep}=L;
const only=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{
  const br=await L.chromium.launch();const bad=[];let n=0;
  const F=L.forms('NBH-Workstation').filter(f=>!only.length||only.includes(f.id));
  for(const [w,h] of [[820,1180],[1133,744]]){
    const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,serviceWorkers:'block'});
    await ctx.addInitScript(()=>{window.print=function(){};});ctx.on('dialog',d=>d.accept().catch(()=>{}));
    for(const f of F){
      const p=await ctx.newPage();
      try{
        await p.goto(L.BASE+'/NBH-Workstation/'+f.file,{waitUntil:'load'});await sleep(400);
        const over=()=>p.evaluate(()=>{const W=document.documentElement.clientWidth,sw=document.documentElement.scrollWidth;if(sw<=W+1)return null;
          const all=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.right>W+1&&b.width>0&&s.display!=='none'&&s.visibility!=='hidden';});
          const leaf=all.filter(e=>!all.some(c=>c!==e&&e.contains(c)));
          return {by:sw-W,at:leaf.slice(0,2).map(e=>e.tagName+(e.id?'#'+e.id:'')+(e.classList.length?'.'+[...e.classList].join('.'):''))};});
        const a=await over();if(a)bad.push({id:f.id,w,state:'empty',...a});
        await L.loadSim(p);await sleep(300);
        await p.evaluate(()=>{const b=[...document.querySelectorAll('dialog[open] button,[role=dialog] button')].find(x=>/^\s*load\s*$/i.test(x.textContent));if(b)b.click();});
        await sleep(900);
        const b=await over();if(b)bad.push({id:f.id,w,state:'loaded',...b});
        n++;
      }catch(e){bad.push({id:f.id,w,err:e.message.slice(0,120)});}
      await p.close();
    }
    await ctx.close();
  }
  await br.close();
  const pass=!bad.length&&n===F.length*2;
  console.log((pass?'PASS':'FAIL')+' no form scrolls the page sideways at 820 or 1133 px, empty or with its case loaded ('+n+' form views)'+(pass?'':'  '+JSON.stringify(bad).slice(0,1500)));
  console.log(pass?'RESULT: all passed':'RESULT: 1 failed');process.exitCode=pass?0:1;
})();
