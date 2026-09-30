let chromium;try{({chromium}=require("playwright"));}catch(e){({chromium}=require("/opt/node22/lib/node_modules/playwright"));}
const fs=require('fs'),path=require('path');
const ROOT=process.env.WS_ROOT||'/home/user/workstation';
const BASE=process.env.WS_URL||'http://127.0.0.1:8123';
function forms(edition){
  edition=edition||'NBH-Workstation';
  const idx=fs.readFileSync(path.join(ROOT,edition,'index.html'),'utf8');
  const m=/const FORMS=(\[[\s\S]*?\n\]);/.exec(idx);
  const FORMS=new Function('return '+m[1])();
  return FORMS.flatMap(g=>g[1]).map(([id,name,file])=>({id,name,file}));
}
async function loadSim(target){
  const ids=['#simBtn','#btnSim','#load-demo','#btnLoadExample'];
  for(const s of ids){const el=await target.$(s); if(el){ await el.click({force:true}).catch(()=>{}); return s; }}
  const b=await target.$$('button');
  for(const el of b){const t=((await el.textContent())||'').trim(); if(/simulat|example|demo/i.test(t)){await el.click({force:true}).catch(()=>{});return t;}}
  return null;
}
function wire(page,log){
  page.on('dialog',d=>d.accept().catch(()=>{}));
  page.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') log.push({type:m.type(),text:m.text().slice(0,300)}); });
  page.on('pageerror',e=>log.push({type:'pageerror',text:String(e.message||e).slice(0,300)}));
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
module.exports={chromium,fs,path,ROOT,BASE,forms,loadSim,wire,sleep};
