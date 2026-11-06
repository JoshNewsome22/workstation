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
/* v25.63: the workstation's top menus (Packet, Case, Tools). A bar button that is not on the screen is reached the way a
   person reaches it: open the menu that holds it and choose the item. true when it was chosen. */
async function navTap(page,sel,touch){const id=sel.replace(/^#/,'');
  let key=await page.evaluate(id=>window.__wsNav&&window.__wsNav.find?window.__wsNav.find(id):null,id).catch(()=>null);
  /* v25.65: the window's buttons over a form (Focus, Side by side, Fullscreen, Own tab, Keep the bars in place, the form's Fit and More)
     are in the form row's View menu */
  const view=!key&&await page.evaluate(id=>window.__wsA&&window.__wsA.find?window.__wsA.find(id):null,id).catch(()=>null);if(!key&&!view)return false;
  const T=process.env.NAVTRACE?(...a)=>console.log('     navTap '+id+':',...a):()=>{};
  const b=view?page.locator('#aView'):page.locator('#wsNav [data-wn-menu="'+key+'"]');if(!(await b.isVisible().catch(()=>false))){T('menu button not visible');return false;}
  if(touch)await b.tap();else await b.click();await sleep(250);
  const it=view?page.locator('#wsViewMenu [data-wn-for="'+id+'"]'):page.locator('#wsNavMenu [data-wn-for="'+id+'"]');if(!(await it.isVisible().catch(()=>false))){T('item not visible',await page.evaluate(()=>({hid:document.getElementById('wsNavMenu').hidden,html:document.getElementById('wsNavMenu').innerHTML.slice(0,300)})));return false;}
  T('item',JSON.stringify(await it.boundingBox()));
  if(touch)await it.tap();else await it.click();T('tapped');return true;}
/* v25.65: a button that may be on the screen or in a menu (the top bar's or the form row's View): tapped where it is */
async function tapOrMenu(page,sel,touch){const l=page.locator(sel).first();if(await l.isVisible().catch(()=>false)){if(touch)await l.tap();else await l.click();return true;}return navTap(page,sel,touch);}
/* v25.67 fx2: the iPad's engine. WebKit (Safari's) when it is installed; where it is not, Chromium with an iPad's user agent,
   touch and a mobile viewport (as sprint-a8-test does), so the touch-screen checks still run. ipadCtx adds those to a
   context; on WebKit it adds touch only, as the tests did before. */
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
async function ipadBrowser(pw){try{const b=await pw.webkit.launch();b._nbhEngine='webkit';return b;}catch(e){const b=await pw.chromium.launch();b._nbhEngine='chromium';return b;}}
function ipadCtx(b,o){return b.newContext(Object.assign({hasTouch:true},b._nbhEngine==='chromium'?{isMobile:true,userAgent:IPAD_UA}:{},o||{}));}
module.exports={chromium,fs,path,ROOT,BASE,forms,loadSim,wire,sleep,mailParts,navTap,tapOrMenu,IPAD_UA,ipadBrowser,ipadCtx};
