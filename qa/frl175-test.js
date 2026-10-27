/* v24.75 the shell asks a form for its data only once the form's page has answered: a question sent while the page loaded
   was lost, every later answer went to the question before it, and Save case then waited out the last question (up to 7 s;
   on an iPad the share sheet then asked for one more tap). Simulated entries only.
   usage: node qa/frl175-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1180,height:820},userAgent:IPAD,hasTouch:true});
 await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'standalone',{get:()=>true,configurable:true});
   try{localStorage.setItem('nbh.ws.autosave.on','off');localStorage.setItem('nbh.ws.autosave.v2','off');}catch(e){}
   const T=(()=>{try{return window.top;}catch(e){return window;}})();
   navigator.canShare=d=>!!(d&&d.files&&d.files.length);navigator.share=async d=>{(T.__shared=T.__shared||[]).push({name:d.files[0].name,at:performance.now()});};});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.goto(BASE+'/NBH-Workstation/');await sleep(900);
 await p.fill('#pClient','Share Student');
 /* the race: a question to the form in the moment it is opened, while its page loads */
 const R=await p.evaluate(async()=>{openForm('CF-1');const fr=state.frames['CF-1'];const heard0=fr&&fr.__heard;
   const t=performance.now();const r=await grab('CF-1','facts?',null,4000);const ms=performance.now()-t;
   const t2=performance.now();const r2=await grab('CF-1','facts?',null,4000);const ms2=performance.now()-t2;
   return {heard0,first:!!r,ms:Math.round(ms),second:!!r2,ms2:Math.round(ms2),left:(pending['CF-1|facts-out']||[]).length};});
 ok('a question sent while the form loads waits for the page and is answered; the next one is answered at once, nothing left waiting',R.heard0===false&&R.first&&R.ms<4000&&R.second&&R.ms2<500&&R.left===0,R);
 const fr=p.frames().find(x=>x.url().indexOf('CF-1_')>=0);
 await fr.evaluate(()=>{let k=0;for(const el of document.querySelectorAll('textarea,input[type="text"],input:not([type])')){if(k>=8)break;if(el.offsetParent===null||el.readOnly||el.disabled)continue;el.value='Shared entry '+(++k);['input','change'].forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true})));}});
 const times=[];
 for(let i=0;i<3;i++){await sleep(i?1200:4500);
   const t=await p.evaluate(async()=>{window.__shared=[];const t0=performance.now();$('#saveCase').click();
     for(let k=0;k<200&&!(window.__shared||[]).length;k++)await new Promise(r=>setTimeout(r,50));
     const d=document.querySelector('#cfDlg');if(d&&d.open){const bs=d.querySelectorAll('#cfFoot button');if(bs.length)bs[bs.length-1].click();}
     return (window.__shared||[]).length?Math.round(window.__shared[0].at-t0):-1;});times.push(t);await sleep(300);}
 ok('Save case reaches the share sheet within a second, every time (three saves)',times.every(t=>t>=0&&t<1000),times);
 ok('no answer is left waiting for a form after the saves',await p.evaluate(()=>Object.keys(pending).filter(k=>/^CF-1\|/.test(k)&&pending[k].length).length===0));
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed')+' (save ms '+times.join(', ')+')');await b.close();process.exit(bad?1:0);})();
