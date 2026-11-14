/* v26.27 The licence (the BCBA, 11/13: "Add that [a licence-key system] to the list"; 11/14: "Yes").
   A licence is a short text the publisher signs: who it is for, the kind, the seats, the first and the last day. This file
   reads one, checks the signature against the publisher's public key (in the page, <script id="ws-licence">), and says
   where the copy stands. The check runs on this device; nothing is sent anywhere, and the publisher holds no customer data.
   Where a licence comes from: the file licence.key beside this page (the district's IT places it once, for every device),
   or one entered here on the device (Help, Licence). The one that lasts longest is used.
   What it does, only in a copy built to need a licence ("required": true):
     - 30 days before the last day, and for 30 days after it, a strip says so; everything works.
     - after that, or with no licence: the students already kept here open, print and save as before; a new student (New
       student, the student's boxes or a form with no case open) asks for a licence. No record is ever locked.
   In a copy that needs none (the practice's and the school's own), Help shows the licence when a key is set, and nothing else
   changes. A form opened by itself, outside this page, is not checked.
   It is a lock for honest customers: the signature cannot be forged, but a page that runs on the customer's device can be
   edited there. The contract is what binds; this makes the terms visible.
   A licence: WSL1.<payload>.<signature>, both base64url. The payload is JSON: {v:1,id,to,kind,seats,from,until,ed,note};
   the signature is ECDSA P-256 with SHA-256 over the text "WSL1.<payload>" (r and s, 64 bytes). */
(()=>{
if(window.__wsLicence)return;
const $=s=>document.querySelector(s);
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let CONF={required:false,keys:[],contact:''};
try{const c=JSON.parse($('#ws-licence').textContent);CONF={required:c.required===true,keys:Array.isArray(c.keys)?c.keys.filter(k=>k&&k.x&&k.y):[],contact:String(c.contact||'')};}catch(e){}
const ED=(()=>{try{return DRV_ED;}catch(e){return '';}})();
const ONE=(()=>{try{return !!EMBED;}catch(e){return false;}})();
const KEY='nbh.licence@'+ED,GRACE=30,SOON=30;
const get=k=>{try{return kvGet(k);}catch(e){try{return localStorage.getItem(k)||'';}catch(x){return '';}}};
const put=(k,v)=>{try{if(v===null)kvDel(k);else kvSet(k,v);}catch(e){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(x){}}};

/* ---- bytes ---- */
const b64u=s=>{s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
const ascii=s=>{const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u;};
const big=u=>{let h='';for(const b of u)h+=(b<16?'0':'')+b.toString(16);return BigInt('0x'+(h||'0'));};

/* ---- the check without the browser's own (a page opened from a drive on a device that offers none there) ---- */
function sha256(u){
  const K=[],H=[];let n=2,i=0;const frac=x=>((x-Math.floor(x))*4294967296)|0;
  while(i<64){let p=true;for(let d=2;d*d<=n;d++)if(n%d===0){p=false;break;}if(p){if(i<8)H[i]=frac(Math.pow(n,1/2));K[i++]=frac(Math.pow(n,1/3));}n++;}
  const l=u.length,m=new Uint8Array(((l+9+63)>>6)<<6);m.set(u);m[l]=128;const dv=new DataView(m.buffer);dv.setUint32(m.length-8,Math.floor(l/536870912));dv.setUint32(m.length-4,(l<<3)>>>0);
  const w=new Int32Array(64),r=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<m.length;o+=64){for(i=0;i<16;i++)w[i]=dv.getInt32(o+i*4);
    for(i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(b,17)^r(b,19)^(b>>>10)))|0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(i=0;i<64;i++){const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;}
  const out=new Uint8Array(32),ov=new DataView(out.buffer);for(i=0;i<8;i++)ov.setInt32(i*4,H[i]);return out;}
function p256(msg,sig,key){
  if(typeof BigInt!=='function'||sig.length!==64)return false;
  const P=BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),N=BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
    B=BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
    G=[BigInt('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),BigInt('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5')],
    Z=BigInt(0),I=BigInt(1),T=BigInt(2),TH=BigInt(3);
  const mod=(a,m)=>{a%=m;return a<Z?a+m:a;};
  const inv=(a,m)=>{let r0=mod(a,m),r1=m,s0=I,s1=Z;while(r1){const q=r0/r1;[r0,r1]=[r1,r0-q*r1];[s0,s1]=[s1,s0-q*s1];}return mod(s0,m);};
  const add=(p,q)=>{if(!p)return q;if(!q)return p;const [x1,y1]=p,[x2,y2]=q;let l;
    if(x1===x2){if(mod(y1+y2,P)===Z)return null;l=mod((TH*x1*x1-TH)*inv(T*y1,P),P);}else l=mod((y2-y1)*inv(mod(x2-x1,P),P),P);
    const x3=mod(l*l-x1-x2,P);return [x3,mod(l*(x1-x3)-y1,P)];};
  const mul=(k,p)=>{let r=null;const b=k.toString(2);for(let j=0;j<b.length;j++){r=add(r,r);if(b[j]==='1')r=add(r,p);}return r;};
  const Q=[big(b64u(key.x)),big(b64u(key.y))];
  if(Q[0]>=P||Q[1]>=P||mod(Q[1]*Q[1]-(Q[0]*Q[0]*Q[0]-TH*Q[0]+B),P)!==Z)return false;
  const r=big(sig.subarray(0,32)),s=big(sig.subarray(32));if(r<I||r>=N||s<I||s>=N)return false;
  const w=inv(s,N),X=add(mul(mod(big(sha256(msg))*w,N),G),mul(mod(r*w,N),Q));
  return !!X&&mod(X[0],N)===r;}
async function sigOk(msg,sig,key,how){
  if(how!=='plain'&&window.crypto&&crypto.subtle){
    try{const k=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:key.x,y:key.y,ext:true},{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,sig,msg);}catch(e){if(how==='browser')return false;}}
  if(how==='browser')return false;
  try{return p256(msg,sig,key);}catch(e){return false;}}

/* ---- a licence read: {ok, lic, why} ---- */
const DAY=/^\d{4}-\d{2}-\d{2}$/;
async function read(text,how){
  const t=String(text||'').replace(/\s+/g,'');
  const m=/^WSL1\.([A-Za-z0-9_-]{8,4000})\.([A-Za-z0-9_-]{80,100})$/.exec(t);
  if(!m)return {ok:false,why:'This is not a licence key. It starts with WSL1 and has three parts with dots between them.'};
  let lic,sig;
  try{sig=b64u(m[2]);lic=JSON.parse(new TextDecoder().decode(b64u(m[1])));}catch(e){return {ok:false,why:'The licence key is damaged: part of it is missing or was changed.'};}
  if(!lic||lic.v!==1||!lic.to||!DAY.test(lic.from||'')||!DAY.test(lic.until||''))return {ok:false,why:'The licence key is not one this version can read.'};
  if(!CONF.keys.length)return {ok:false,why:'This copy has no publisher key to check a licence against.'};
  const msg=ascii('WSL1.'+m[1]);let good=false;
  for(const k of CONF.keys){if(await sigOk(msg,sig,k,how)){good=true;break;}}
  if(!good)return {ok:false,why:'The licence key was not signed by the publisher of this workstation, or it was changed after it was signed.'};
  if(lic.ed&&lic.ed!=='*'&&lic.ed!==ED)return {ok:false,why:'This licence is for another edition of the workstation.',lic};
  return {ok:true,lic:{id:String(lic.id||''),to:String(lic.to),kind:String(lic.kind||''),seats:+lic.seats||0,from:lic.from,until:lic.until,note:String(lic.note||'')},text:t};}

/* ---- where the copy stands ---- */
const pad=n=>(n<10?'0':'')+n;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const plus=(day,n)=>{const p=day.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2]+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const gap=(a,b)=>{const f=s=>{const p=s.split('-').map(Number);return Date.UTC(p[0],p[1]-1,p[2]);};return Math.round((f(b)-f(a))/86400000);};
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const nice=day=>{const p=day.split('-').map(Number);return MON[p[1]-1]+' '+p[2]+', '+p[0];};
const L={lic:null,src:'',stored:false,bad:'',state:'none',left:0,ready:null,done:false};
function stand(){
  const now=today(),l=L.lic;
  if(!l){L.state=L.bad?'bad':'none';L.left=0;}
  else if(now<l.from){L.state='early';L.left=gap(now,l.from);}
  else if(now<=l.until){L.left=gap(now,l.until);L.state=L.left<=SOON?'soon':'ok';}
  else{L.left=gap(now,plus(l.until,GRACE));L.state=L.left>=0?'grace':'ended';}
  return L.state;}
const limited=()=>CONF.required&&L.done&&(L.state==='none'||L.state==='bad'||L.state==='ended'||L.state==='early');
async function load(){
  try{if(typeof kvLoad!=='undefined')await kvLoad;}catch(e){}
  const found=[];L.bad='';
  const kept=get(KEY);
  if(kept){const r=await read(kept);if(r.ok)found.push({r,src:'device'});else L.bad=r.why;}
  if(!ONE&&/^https?:$/.test(location.protocol)&&CONF.keys.length){
    try{const res=await fetch('licence.key',{cache:'no-store'});
      if(res.ok){const t=(await res.text()).slice(0,6000);if(/^\s*WSL1\./.test(t)){const r=await read(t);if(r.ok)found.push({r,src:'folder'});else if(!kept)L.bad=r.why;}}}catch(e){}}
  found.sort((a,b)=>a.r.lic.until<b.r.lic.until?1:a.r.lic.until>b.r.lic.until?-1:0);
  const best=found[0];
  if(best){L.lic=best.r.lic;L.src=best.src;L.bad='';
    /* the folder's licence is kept on the device too, so the copy knows it when the device is offline */
    if(best.src==='folder'&&kept!==best.r.text)put(KEY,best.r.text);}
  else{L.lic=null;L.src='';}
  L.stored=!!get(KEY);L.done=true;stand();paint();return L.state;}

/* ---- words ---- */
const KIND={district:'district licence',practice:'practice licence',individual:'licence for one person',trial:'trial licence'};
const seats=l=>l.seats>0?', for '+l.seats+' staff':(l.kind==='district'||l.kind==='practice'?', for every member of staff (a site licence)':'');
const who=l=>'<b>'+E(l.to)+'</b> ('+E(KIND[l.kind]||l.kind||'licence')+E(seats(l))+')'+(l.id?', number '+E(l.id):'');
const contact=get=>CONF.contact?' To '+(get?'get a licence':'renew')+', write to '+E(CONF.contact)+'.':'';
function line(){
  const l=L.lic;
  if(L.state==='ok')return 'Licensed to '+who(l)+', until '+nice(l.until)+'.';
  if(L.state==='soon')return 'Licensed to '+who(l)+'. The licence ends on '+nice(l.until)+(L.left===0?', today':L.left===1?', tomorrow':', in '+L.left+' days')+'.'+contact();
  if(L.state==='grace')return 'The licence of '+who(l)+(l.id?',':'')+' ended on '+nice(l.until)+'. The workstation works as before until '+nice(plus(l.until,GRACE))+'.'+contact();
  if(L.state==='ended')return 'The licence of '+who(l)+(l.id?',':'')+' ended on '+nice(l.until)+'.'+contact();
  if(L.state==='early')return 'The licence of '+who(l)+(l.id?',':'')+' starts on '+nice(l.from)+'.';
  if(L.state==='bad')return 'The licence kept on this '+HEREW+' cannot be used: '+E(L.bad);
  return CONF.required?'No licence has been entered for this copy.'+contact(true):'This copy needs no licence. None is entered.';}
const HEREW=(()=>{try{return HERE;}catch(e){return 'device';}})();
const KEEP='The students kept on this '+HEREW+' open, print and save as before. A new student needs a current licence.';

/* ---- the strip under the top bar ---- */
const css=document.createElement('style');css.id='ws-licence-css';
css.textContent='#licBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0;padding:8px 16px;background:#fff6dc;color:#3d2f00;border-bottom:1px solid #e2c56a;font:14px/1.4 var(--sans,system-ui,sans-serif)}'+
  '#licBar.lim{background:#fde8e4;color:#5a1a10;border-bottom-color:#e0a79c}#licBar span{flex:1 1 280px;min-width:0}#licBar button{min-height:44px;padding:0 14px;border-radius:8px;border:1px solid currentColor;background:#fff;color:inherit;font:600 14px/1 var(--sans,system-ui,sans-serif);cursor:pointer}'+
  '#licBar .lic-x{min-width:44px;padding:0;border-color:transparent;background:transparent;font-size:20px}#licBar[hidden]{display:none}'+
  '.lic-box textarea{width:100%;min-height:96px;box-sizing:border-box;font:16px/1.35 ui-monospace,Menlo,Consolas,monospace;padding:8px;border:1px solid #9bb0b8;border-radius:8px;word-break:break-all}'+
  '.lic-box .lic-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.lic-box .lic-row button{min-height:44px;padding:0 14px}.lic-box .lic-msg{margin:8px 0;font-weight:600}.lic-box .lic-msg.no{color:#8a1c10}.lic-box .lic-msg.yes{color:#17603a}'+
  '@media print{#licBar{display:none!important}}';
document.head.appendChild(css);
const SKIP='nbh.licence.strip';
function paint(){
  let b=$('#licBar');
  const show=CONF.required&&L.state!=='ok';
  let off='';try{off=sessionStorage.getItem(SKIP)||'';}catch(e){}
  const lim=limited();
  if(!show||(!lim&&off===L.state+':'+today())){if(b)b.hidden=true;return;}
  if(!b){b=document.createElement('div');b.id='licBar';b.setAttribute('role','status');const m=$('main');if(!m||!m.parentNode)return;m.parentNode.insertBefore(b,m);
    b.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('button');if(!t)return;
      if(t.classList.contains('lic-x')){try{sessionStorage.setItem(SKIP,L.state+':'+today());}catch(x){}b.hidden=true;}else open();});}
  b.hidden=false;b.classList.toggle('lim',lim);
  b.innerHTML='<span>'+line()+(lim?' '+KEEP:'')+'</span><button type="button" class="lic-go">'+(L.lic?'Licence':'Enter a licence')+'</button>'+(lim?'':'<button type="button" class="lic-x" aria-label="Hide this message for today">&times;</button>');}

/* ---- Help, Licence: what is entered, and entering one ---- */
function body(){
  const from=L.lic?(L.src==='folder'?'It was read from the file <i>licence.key</i> in the workstation’s folder, and is kept on this '+HEREW+' for when it is offline.':'It was entered on this '+HEREW+'.'):'';
  return '<div class="lic-box"><p id="licLine">'+line()+(limited()?' '+KEEP:'')+'</p>'+(from?'<p class="hint">'+from+'</p>':'')+
    (CONF.keys.length?'<p><label for="licText">A licence key (paste it here, or open the file it came in)</label></p><textarea id="licText" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" placeholder="WSL1…"></textarea>'+
      '<div class="lic-row"><button type="button" id="licSave" class="primary">Check and keep this licence</button><button type="button" id="licFile">Open a licence file</button>'+(L.stored?'<button type="button" id="licDrop">Remove the licence from this '+HEREW+'</button>':'')+'</div>'+
      '<input type="file" id="licIn" accept=".key,.txt,text/plain" hidden><p class="lic-msg" id="licMsg" role="status"></p>':'<p class="hint">This copy carries no publisher key, so no licence can be checked in it.</p>')+
    '<p class="hint">The licence is checked on this '+HEREW+'. Nothing is sent anywhere. To give it to every device at once, the person who looks after the website puts the file <i>licence.key</i> in the workstation’s folder.</p></div>';}
function wire(root){
  const q=s=>root.querySelector(s),msg=(t,yes)=>{const m=q('#licMsg');if(m){m.textContent=t;m.className='lic-msg '+(yes?'yes':'no');}};
  const again=()=>{const box=root.querySelector('.lic-box');if(box){const d=document.createElement('div');d.innerHTML=body();box.replaceWith(d.firstChild);wire(root);}};
  const keep=async text=>{const r=await read(text);if(!r.ok){msg(r.why,false);return;}
    put(KEY,r.text);await load();again();const m=root.querySelector('#licMsg');if(m){m.textContent='Kept. '+(L.lic&&L.lic.id===r.lic.id&&L.lic.until===r.lic.until?'':'A licence that lasts longer is already here, and stays in use.');m.className='lic-msg yes';}};
  const s=q('#licSave');if(s)s.addEventListener('click',()=>{const v=q('#licText').value;if(!v.trim()){msg('Paste the licence key first.',false);return;}keep(v);});
  const f=q('#licFile'),i=q('#licIn');if(f&&i){f.addEventListener('click',()=>i.click());
    i.addEventListener('change',async()=>{const file=i.files&&i.files[0];if(!file)return;if(file.size>20000){msg('That file is too large to be a licence.',false);return;}keep(await file.text());i.value='';});}
  const d=q('#licDrop');if(d)d.addEventListener('click',async()=>{put(KEY,null);await load();again();});}
function open(){try{dialog('Licence',body());wire($('#dlgBody'));}catch(e){}}
/* in Help: a section of its own, when the copy needs a licence or can check one */
{const h=$('#help');if(h&&(CONF.required||CONF.keys.length))h.addEventListener('click',()=>{setTimeout(()=>{const db=$('#dlgBody');if(!db||db.querySelector('#hpLic'))return;
  const d=document.createElement('details');d.id='hpLic';d.innerHTML='<summary>Licence</summary>'+body();db.appendChild(d);wire(d);},0);});}

/* ---- a new student, in a copy that needs a licence and has none in force: New student, the student's boxes while no
   case is open, and a form opened with no case all ask for the licence. A student already kept opens as before (the case
   brings the name and its forms), and so does a case file. ---- */
const bare=()=>{try{const n=$('#pClient');return !(n&&n.value.trim())&&!Object.keys(state.frames).length&&!Object.keys(state.pending).length;}catch(e){return false;}};
window.addEventListener('click',e=>{if(!limited())return;const t=e.target&&e.target.closest&&e.target.closest('#blNew,#blTopNew,#blPhNew');if(!t)return;
  e.stopImmediatePropagation();e.preventDefault();open();},true);
document.addEventListener('focusin',e=>{if(!limited()||!bare())return;const t=e.target;
  if(t&&t.closest&&t.closest('#bar')&&/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)){try{t.blur();}catch(x){}open();}},true);
try{const of=openForm;openForm=function(){if(limited()&&bare()){open();return;}return of.apply(this,arguments);};}catch(e){}

L.ready=load();
window.__wsLicence={ready:()=>L.ready,state:()=>({state:L.state,left:L.left,required:CONF.required,limited:limited(),src:L.src,lic:L.lic?Object.assign({},L.lic):null,bad:L.bad}),
  read,open,reload:()=>(L.ready=load()),line:()=>line()};
})();
