let chromium;try{({chromium}=require("playwright"));}catch(e){({chromium}=require("/opt/node22/lib/node_modules/playwright"));}
const fs=require('fs'),path=require('path');
/* the output folders a test names (qa/out/<name>/...) are created before it runs; qa/out is not in git */
try{const _fs=require('fs'),_p=require('path');_fs.mkdirSync(_p.join(__dirname,'out'),{recursive:true});const _src=_fs.readFileSync(require.main.filename,'utf8');for(const m of _src.matchAll(/\/out\/([\w.-]+)\//g))_fs.mkdirSync(_p.join(__dirname,'out',m[1]),{recursive:true});}catch(e){}
const ROOT=process.env.WS_ROOT||require('path').resolve(__dirname,'..');
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
  /* a DOM click: the button may be folded under "More controls" (hidden), where a Playwright click, even forced, does nothing */
  for(const s of ids){const el=await target.$(s); if(el){ await el.evaluate(e=>e.click()).catch(()=>{}); return s; }}
  const b=await target.$$('button');
  for(const el of b){const t=((await el.textContent())||'').trim(); if(/simulat|example|demo/i.test(t)){await el.evaluate(e=>e.click()).catch(()=>{});return t;}}
  return null;
}
function wire(page,log){
  page.on('dialog',d=>d.accept().catch(()=>{}));
  page.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') log.push({type:m.type(),text:m.text().slice(0,300)}); });
  page.on('pageerror',e=>log.push({type:'pageerror',text:String(e.message||e).slice(0,300)}));
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* an email given to Gmail (the raw message, decoded from base64url): its text, and its page when it has one (v21.88 the
   emails are multipart/alternative: the text and the page with the buttons) */
function mailParts(raw){const dec=b=>Buffer.from(String(b||'').replace(/\r\n/g,''),'base64').toString('utf8');const head=raw.split('\r\n\r\n')[0];
  const bm=/boundary="([^"]+)"/.exec(head);if(!bm)return {head,text:dec(raw.split('\r\n\r\n').slice(1).join('\r\n\r\n')),html:''};
  const o={head,text:'',html:''};raw.split('--'+bm[1]).slice(1,-1).forEach(p=>{const i=p.indexOf('\r\n\r\n'),h=p.slice(0,i),b=p.slice(i+4);if(/text\/plain/.test(h))o.text=dec(b);if(/text\/html/.test(h))o.html=dec(b);});return o;}
module.exports={chromium,fs,path,ROOT,BASE,forms,loadSim,wire,sleep,mailParts};
