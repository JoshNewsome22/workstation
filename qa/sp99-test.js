/* v23.99 Form SP-1: "Print a sample" beside the quick Save data, left of More controls, on every screen */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const vp of [{width:1180,height:820},{width:1024,height:768}]){
  const p=await b.newPage({viewport:vp});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(URL);await sleep(2500);
  const r=await p.evaluate(()=>{const q=document.querySelector('#spSampleQuick'),m=document.querySelector('#nbhMoreBtn'),s=document.querySelector('#nbhSaveQuick');
    const vis=e=>!!(e&&e.offsetParent)&&e.getBoundingClientRect().width>0;
    return {has:!!q,vis:vis(q),moreVis:vis(m),beforeMore:!!(q&&m&&q.nextElementSibling===m),afterSave:!!(q&&s&&s.nextElementSibling===q),text:q&&q.textContent,compact:document.documentElement.classList.contains('nbh-compact'),underMoreHidden:!vis(document.querySelector('#sampleBtn'))};});
  ok('at '+vp.width+' wide, "Print a sample" is in sight beside Save data, left of More controls'+(r.compact?' (the groups folded)':''),r.has&&r.vis&&r.beforeMore&&r.afterSave&&r.text==='Print a sample',r);
  await p.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++;window.__samplePages=document.querySelectorAll('#spPrint .sp-sample').length;window.__all=document.querySelectorAll('#spPrint > .sheet').length;};});
  await p.evaluate(()=>document.querySelector('#spSampleQuick').click());await sleep(1200);
  const pr=await p.evaluate(()=>({printed:window.__printed,sample:window.__samplePages,all:window.__all,cleared:!document.documentElement.classList.contains('sp-printall')&&document.querySelector('#spPrint').children.length===0}));
  ok('a tap prints the sample pages (every printed page SAMPLE) and clears the print host after',pr.printed===1&&pr.sample>=1&&pr.sample===pr.all&&pr.cleared,pr);
  ok('no page errors',!errs.length,errs.slice(0,3));await p.close();
 }
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
