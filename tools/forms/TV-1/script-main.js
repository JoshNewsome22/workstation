/* Form TV-1 · Training Video (v21.50): the script of a training video for a finished FBA and BIP, drafted from the case, the
   cards shown beside each paragraph, a teleprompter, the graphics drawn here (and in a window of their own for the Yolobox),
   and an export in the layout of the Google Sheet that drives Flowics. Everything stays in this form's state (S) and its saved
   file: nothing is sent anywhere. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v));return isFinite(n)?n:null;};
const WORDS=['no','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const nw=n=>WORDS[n]||String(n);

/* ---------------- state ---------------- */
/* a row: one beat of the training. seg: the segment; say: the words (blank with cont: the paragraph above goes on);
   title, body: the card; lay: its layout; pics: two pictures with captions; x: the sheet's own last three columns, kept as
   they came (the places of the pictures in the Flowics template) */
const LAYS=[['auto','Automatic'],['side','A card beside the presenter'],['lower','Lower third'],['full','Full-screen card'],['title','Section title'],['pic1','One picture'],['pic2','Two pictures'],['none','No card (the presenter alone)']];
function newRow(seg,o){return Object.assign({seg:seg||'',say:'',cont:false,title:'',body:'',lay:'auto',pics:[{ph:'',cap:''},{ph:'',cap:''}],x:['','','']},o||{});}
function blank(){return{meta:{aud:'',pname:'',plines:'',c1:'#1d3b5a',c2:'#e8a33d',cardbg:'light',gbg:'green',side:'right',font:'sans',tpsize:'58',tpwpm:'140'},chk:{mirror:false},rows:[],photos:[],log:[],segs:{}};}
let S=blank();
function ensure(){if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  if(!Array.isArray(S.rows))S.rows=[];if(!Array.isArray(S.photos))S.photos=[];if(!Array.isArray(S.log))S.log=[];if(!S.segs||typeof S.segs!=='object')S.segs={};
  S.rows=S.rows.map(r=>{const o=newRow('',r&&typeof r==='object'?r:{});if(!Array.isArray(o.pics))o.pics=[];while(o.pics.length<2)o.pics.push({ph:'',cap:''});o.pics.length=2;
    if(!Array.isArray(o.x))o.x=[];while(o.x.length<3)o.x.push('');o.x.length=3;if(!LAYS.some(l=>l[0]===o.lay))o.lay='auto';o.cont=!!o.cont;return o;});
  const d=blank().meta;Object.keys(d).forEach(k=>{if(S.meta[k]==null||S.meta[k]==='')S.meta[k]=d[k];});}
const firstName=()=>{const f=String(S.meta.first||'').trim();if(f)return f;const c=String(S.meta.client||'').trim().replace(/^SIMULATED\s*[–-]\s*/,'');return c?c.split(/\s+/)[0]:'the student';};
const possess=n=>/s$/i.test(n)?n+'’':n+'’s';
const photo=id=>S.photos.find(p=>p.id===id);

/* ---------------- the words: what a paragraph says, how long it takes ---------------- */
const words=t=>(String(t||'').replace(/\[[^\]]*\]/g,' x ').match(/[A-Za-z0-9’'-]+/g)||[]).length;
const todo=t=>/\[[^\]]+\]/.test(String(t||''));
/* the paragraph a row is in: the words of the first row of its run (a row that continues the one above has none of its own) */
function paraOf(i){let k=i;while(k>0&&S.rows[k].cont)k--;return k;}
function paras(){const P=[];S.rows.forEach((r,i)=>{if(i===0||!r.cont)P.push({start:i,rows:[i]});else P[P.length-1].rows.push(i);});return P;}
const wpm=()=>Math.max(80,Math.min(220,num(S.meta.tpwpm)||140));
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------------- drafting from the case ---------------- */
/* the case (the facts the workstation shell hands this form) is kept as it last came, so a draft can be made later too */
let CASE=null;
const SEGS=[['overview','Training Overview'],['profile','Student Profile'],['behaviors','Target Behaviors'],['function','Function & Data'],['goals','Goals of Intervention'],
  ['reinforce','Reinforcement System'],['proactive','Proactive Strategies'],['response','Response Plan'],['takeaways','Key Takeaways'],['terms','Terms & Definitions']];
const lc1=s=>{s=String(s||'').trim();return /^[A-Z][a-z]/.test(s)?s[0].toLowerCase()+s.slice(1):s;};
const sent=s=>{s=String(s||'').trim().replace(/\s+/g,' ');if(!s)return '';return /[.!?]$/.test(s)?s:s+'.';};
const bullets=a=>a.filter(Boolean).map(x=>'• '+String(x).trim()).join('\n');
function draft(keys,f){f=f||CASE||{};const N=firstName(),Np=possess(N),out=[];const add=(seg,o)=>out.push(newRow(seg,o));
  const behs=(f.behaviors||[]).filter(b=>b&&(b.label||b.def)),red=behs.filter(b=>!b.isRep&&!/replacement|alternative/i.test(b.type||'')),rep=behs.filter(b=>b.isRep||/replacement|alternative/i.test(b.type||''));
  const fn=f.fn||null,g=f.goals||{},gr=(g.red||[]).filter(x=>x&&(x.text||x.beh)),ga=(g.acq||[]).filter(x=>x&&(x.text||x.beh));
  const menu=(f.menu||[]).slice().sort((a,b)=>(a.rank==null?99:a.rank)-(b.rank==null?99:b.rank)).filter(m=>m&&m.name);
  const who=String(S.meta.pname||'').trim()||'[your name and role]',aud=String(S.meta.aud||'').trim()||'a receiving team';
  const segName=k=>(SEGS.find(s=>s[0]===k)||[k,k])[1],on=k=>keys.includes(k);
  if(on('overview')){
    add(segName('overview'),{say:'This training walks '+aud+' through '+Np+' Functional Behavior Assessment and Behavior Intervention Plan. It is presented by '+who+'.',title:'Presenter',body:[String(S.meta.pname||'').trim()||'[your name]'].concat(String(S.meta.plines||'').split('\n').map(s=>s.trim()).filter(Boolean)).join('\n'),lay:'side'});
    add(segName('overview'),{say:'Everything that follows is meant for someone meeting '+N+' for the first time. It moves from the assessment, to the plan, to what you will do each day.',title:'Covering',
      body:bullets(keys.filter(k=>k!=='overview').map(segName))});}
  if(on('profile')){
    add(segName('profile'),{say:'A behavior plan only makes sense in the context of the whole learner, including what '+N+' does well and enjoys. [What '+N+' does well, and what '+N+' enjoys.]',title:'Strengths',body:'• [a strength]\n• [a strength]\n• [an interest]'});
    add(segName('profile'),{say:'[How '+N+' communicates, and what every adult should do to support it.]',title:'Communication',body:'[what every adult does]'});}
  if(on('behaviors')){
    if(red.length){
      add(segName('behaviors'),{say:'A target behavior definition must be observable and measurable, so that any two staff members counting the same event arrive at the same number. '+(red.length===1?'One behavior is':nw(red.length)[0].toUpperCase()+nw(red.length).slice(1)+' behaviors are')+' tracked on this plan.',title:'Tracked',body:bullets(red.map(b=>b.label))});
      red.forEach(b=>{const d=String(b.def||'').trim(),ex=String(b.ex||'').trim(),nex=String(b.nex||'').trim(),dim=String(b.dim||'').trim();
        add(segName('behaviors'),{say:(d?sent(b.label+' is defined as '+lc1(d).replace(/[.]+$/,'')):'['+b.label+': its definition.]')+(dim?' It is measured by '+lc1(dim).replace(/[.]+$/,'')+'.':'')+(ex?' For example: '+sent(lc1(ex)):'')+(nex?' It does not include '+sent(lc1(nex)):''),
          title:b.label,body:[d,ex?'Examples: '+ex:'',nex?'Not: '+nex:''].filter(Boolean).join('\n')});});}
    else add(segName('behaviors'),{say:'A target behavior definition must be observable and measurable. [The behaviors tracked, each with its definition.]',title:'Tracked',body:'• [a behavior]'});}
  if(on('function')){
    const st=(fn&&fn.statements||[]).filter(Boolean);
    add(segName('function'),{say:'A hypothesis statement links the conditions under which behavior occurs to the consequence that maintains it.'+(st.length?' '+st.map(sent).join(' '):' [The hypothesis statement.]'),
      title:'Hypothesis',body:st.length?st.join('\n'):'[when …, '+N+' will …, in order to …]'});
    if(fn&&(fn.label||fn.key))add(segName('function'),{say:'',cont:true,title:'Function',body:String(fn.label||fn.key)});}
  if(on('goals')){
    if(gr.length)add(segName('goals'),{say:'Reduction goals specify the criterion at which a target behavior is considered resolved for planning purposes. '+(gr.length===1?'One reduction goal is':nw(gr.length)[0].toUpperCase()+nw(gr.length).slice(1)+' reduction goals are')+' on this plan.',title:'Reduce',body:gr.map(x=>sent(x.text||x.beh)).join('\n')});
    const teach=ga.length?ga.map(x=>sent(x.text||x.beh)):rep.map(b=>sent(b.label));
    if(teach.length)add(segName('goals'),{say:'A replacement behavior produces the same outcome as the problem behavior through an appropriate response. '+(teach.length===1?'One is':nw(teach.length)[0].toUpperCase()+nw(teach.length).slice(1)+' are')+' being taught.',title:'Teach',body:teach.join('\n')});
    if(!gr.length&&!teach.length)add(segName('goals'),{say:'[The goals of the plan: what will be reduced, and what will be taught.]',title:'Goals',body:'[goal]'});}
  if(on('reinforce')){
    add(segName('reinforce'),{say:(menu.length?'These are the items and activities '+N+' works for, from the preference assessment, the most preferred first. ':'')+'[How reinforcement is delivered: what earns it, how often, and for how long.]',
      title:menu.length?'Works For':'Reinforcement',body:menu.length?bullets(menu.slice(0,6).map(m=>m.name)):'• [what earns it]\n• [how often]'});}
  if(on('proactive'))add(segName('proactive'),{say:'Proactive strategies prevent the behavior, or make it less likely, by changing what happens before it. [The strategies every adult uses with '+N+'.]',title:'Proactive',body:'• [a strategy]\n• [a strategy]'});
  if(on('response'))add(segName('response'),{say:'A response plan says what staff do after the behavior begins. It is a safety and de-escalation sequence, followed in order. [The steps.]',title:'Steps',body:'1. [first step]\n2. [next step]\n3. [next step]',lay:'full'});
  if(on('takeaways'))add(segName('takeaways'),{say:'[The two or three things every adult should remember about '+N+'.]',title:'Remember',body:'• [the first thing]\n• [the second thing]',lay:'full'});
  if(on('terms'))add(segName('terms'),{say:'[Terms specific to '+Np+' plan and to this building, so new staff do not have to guess what they mean.]',title:'Terms',body:'• [term]: [what it means]'});
  return out;}

/* ---------------- the cards (1920 x 1080, drawn here and in the graphics window) ---------------- */
const GFX_CSS=`.gx{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;font-family:var(--gf);color:#111;text-align:left}
.gx *{box-sizing:border-box}
.gx .gx-card{position:absolute;background:var(--cb);color:var(--ct);border-radius:26px;box-shadow:0 14px 40px rgba(0,0,0,.32);overflow:hidden;display:flex;flex-direction:column}
.gx .gx-seg{background:var(--c1);color:#fff;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:26px;padding:16px 34px 14px;flex:none}
.gx.dark .gx-seg{background:var(--c2);color:#111}
.gx .gx-in{padding:26px 40px 34px;flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
.gx .gx-title{font-weight:800;line-height:1.08;color:var(--tc);margin:0 0 18px;flex:none}
.gx .gx-title:after{content:"";display:block;width:110px;height:8px;border-radius:4px;background:var(--c2);margin-top:16px}
.gx .gx-body{flex:1 1 auto;min-height:0;line-height:1.28}
.gx .gx-body p{margin:0 0 .5em}
.gx .gx-body ul,.gx .gx-body ol{margin:0;padding:0;list-style:none}
.gx .gx-body li{position:relative;padding-left:1.05em;margin:0 0 .45em}
.gx .gx-body ul li:before{content:"";position:absolute;left:.1em;top:.48em;width:.42em;height:.42em;border-radius:50%;background:var(--c2)}
.gx .gx-body ol{counter-reset:n}
.gx .gx-body ol li{padding-left:1.5em}
.gx .gx-body ol li:before{counter-increment:n;content:counter(n);position:absolute;left:0;top:0;font-weight:800;color:var(--c2)}
.gx.side .gx-card{top:120px;width:800px;min-height:520px;max-height:840px}
.gx.side.right .gx-card{left:1040px}.gx.side.left .gx-card{left:80px}
.gx.lower .gx-card{left:80px;right:80px;bottom:64px;height:250px;flex-direction:row}
.gx.lower .gx-seg{writing-mode:horizontal-tb;display:flex;align-items:center;max-width:340px;font-size:28px;line-height:1.15;padding:20px 30px}
.gx.lower .gx-in{padding:22px 40px;justify-content:center}
.gx.lower .gx-title{margin-bottom:8px}.gx.lower .gx-title:after{display:none}
.gx.full .gx-card{left:110px;right:110px;top:80px;bottom:80px}
.gx.full .gx-body.cols{columns:2;column-gap:70px}
.gx.full .gx-body.cols li{break-inside:avoid}
.gx.title .gx-band{position:absolute;left:0;right:0;top:600px;height:300px;background:var(--c1);display:flex;flex-direction:column;justify-content:center;padding:0 140px;box-shadow:0 14px 40px rgba(0,0,0,.3)}
.gx.title .gx-band:before{content:"";position:absolute;left:0;top:0;bottom:0;width:30px;background:var(--c2)}
.gx.title .gx-k{color:var(--c2);font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:32px;margin-bottom:10px}
.gx.title .gx-title{color:#fff;margin:0}.gx.title .gx-title:after{display:none}
.gx .gx-pics{display:flex;gap:26px;flex:1 1 auto;min-height:0}
.gx .gx-pic{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:12px}
.gx .gx-pic .im{flex:1 1 auto;min-height:0;border-radius:16px;overflow:hidden;background:#dfe5ea}
.gx .gx-pic .im img{width:100%;height:100%;object-fit:cover;display:block}
.gx .gx-pic .cap{font-size:30px;font-weight:700;text-align:center;flex:none;line-height:1.15}
.gx.pic2 .gx-card{left:110px;right:110px;top:470px;bottom:60px}
.gx.pic2 .gx-in{padding-top:22px}
.gx.pic2 .gx-title{font-size:48px!important;margin-bottom:14px}.gx.pic2 .gx-title:after{display:none}
.gx .gx-todo{background:rgba(232,163,61,.28);border-radius:6px;padding:0 .15em}
.gx-ph{position:absolute;inset:0;background:linear-gradient(135deg,#5a6b78,#2c3a45)}
.gx-ph:after{content:"";position:absolute;width:420px;height:560px;bottom:0;border-radius:210px 210px 0 0;background:rgba(255,255,255,.16)}
.gx-ph.l:after{left:330px}.gx-ph.r:after{right:330px}`;
/* the cards' own rules, in this page too (the graphics window writes them into its own) */
(()=>{const st=document.createElement('style');st.id='tv-gfx';st.textContent=GFX_CSS;document.head.appendChild(st);})();
/* a card's text: one line a point; "• " or "- " a bullet, "1. " a numbered step; words in [brackets] marked as still to write */
function mark(s){return esc(s).replace(/\[([^\]]+)\]/g,'<span class="gx-todo">[$1]</span>');}
function bodyHtml(t){const L=String(t||'').split('\n').map(s=>s.trim()).filter(Boolean);if(!L.length)return '';
  const isB=s=>/^[•\-*–]\s*/.test(s),isN=s=>/^\d+[.)]\s+/.test(s);
  if(L.every(isN))return '<ol>'+L.map(s=>'<li>'+mark(s.replace(/^\d+[.)]\s+/,''))+'</li>').join('')+'</ol>';
  if(L.length>1||L.some(isB))return '<ul>'+L.map(s=>'<li>'+mark(s.replace(/^[•\-*–]\s*/,''))+'</li>').join('')+'</ul>';
  return '<p>'+mark(L[0])+'</p>';}
function layOf(r){if(r.lay!=='auto')return r.lay;const np=r.pics.filter(p=>p.ph).length;if(np>=2)return 'pic2';if(np===1)return 'pic1';
  const L=String(r.body||'').split('\n').filter(s=>s.trim()).length;if(!r.title&&!L)return 'none';return L>7||String(r.body||'').length>420?'full':'side';}
/* a colour is a #hex or the default: a value from a file goes into a style attribute */
const hex=(v,d)=>/^#[0-9a-f]{3,8}$/i.test(String(v||''))?String(v):d;
function vars(){const m=S.meta,dark=m.cardbg==='dark',c1=hex(m.c1,'#1d3b5a'),c2=hex(m.c2,'#e8a33d');return '--c1:'+c1+';--c2:'+c2+';--cb:'+(dark?c1:'rgba(255,255,255,.97)')+';--ct:'+(dark?'#fff':'#1d2730')+';--tc:'+(dark?'#fff':c1)+';--gf:'+(m.font==='serif'?"Georgia,'Times New Roman',serif":"Inter,'Helvetica Neue',Helvetica,Arial,sans-serif");}
function cardHtml(r,opt){opt=opt||{};if(!r)return '<div class="gx" style="'+vars()+'"></div>';const lay=layOf(r),side=S.meta.side==='left'?'left':'right',dark=S.meta.cardbg==='dark';
  const ph=opt.presenter?'<div class="gx-ph '+(side==='right'?'l':'r')+'"></div>':'';const seg=esc(r.seg||'');const cls='gx '+lay+' '+side+(dark?' dark':'');
  if(lay==='none')return '<div class="'+cls+'" style="'+vars()+'">'+ph+'</div>';
  if(lay==='title')return '<div class="'+cls+'" style="'+vars()+'">'+ph+'<div class="gx-band"><div class="gx-k">'+seg+'</div><div class="gx-title gx-fit" data-fs="96" data-min="44">'+mark(r.title||r.seg||'')+'</div></div></div>';
  const pics=r.pics.filter(p=>p.ph&&photo(p.ph));
  let inner='<div class="gx-title gx-fit" data-fs="'+(lay==='lower'?60:lay==='full'?76:70)+'" data-min="30">'+mark(r.title||'')+'</div>';
  if(lay==='pic1'||lay==='pic2'){const use=lay==='pic1'?pics.slice(0,1):pics.slice(0,2);
    inner+='<div class="gx-pics">'+(use.length?use:[{ph:'',cap:''}]).map(p=>{const P=photo(p.ph);return '<div class="gx-pic"><div class="im">'+(P?'<img src="'+P.img+'" alt="">':'')+'</div>'+(p.cap?'<div class="cap">'+mark(p.cap)+'</div>':'')+'</div>';}).join('')+'</div>';
    if(lay==='pic1'&&String(r.body||'').trim())inner+='<div class="gx-body gx-fit" data-fs="30" data-min="20" style="flex:0 0 auto;margin-top:14px">'+bodyHtml(r.body)+'</div>';}
  else{const L=String(r.body||'').split('\n').filter(s=>s.trim()).length;inner+='<div class="gx-body gx-fit'+(lay==='full'&&L>6?' cols':'')+'" data-fs="'+(lay==='lower'?38:lay==='full'?46:46)+'" data-min="20">'+bodyHtml(lay==='lower'?String(r.body||'').split('\n').filter(s=>s.trim()).slice(0,2).join('\n'):r.body)+'</div>';}
  return '<div class="'+cls+'" style="'+vars()+'">'+ph+'<div class="gx-card"><div class="gx-seg">'+seg+'</div><div class="gx-in">'+inner+'</div></div></div>';}
/* each text box shrinks until its card holds it (from its data-fs to its data-min, in px of the 1920 stage) */
function fitGx(root){(root||document).querySelectorAll('.gx').forEach(g=>{const card=g.querySelector('.gx-card,.gx-band');if(!card)return;
  const fits=[...g.querySelectorAll('.gx-fit')];fits.forEach(e=>{e.style.fontSize=e.dataset.fs+'px';});
  const over=()=>{const inn=g.querySelector('.gx-in');if(inn)return inn.scrollHeight>inn.clientHeight+1||[...inn.children].some(c=>c.scrollHeight>c.clientHeight+2&&c.classList.contains('gx-body'));return card.scrollHeight>card.clientHeight+1;};
  let guard=0;while(over()&&guard++<60){let moved=false;fits.forEach(e=>{const f=parseFloat(e.style.fontSize),mn=+e.dataset.min||20;if(f>mn){e.style.fontSize=(f-2)+'px';moved=true;}});if(!moved)break;}});}
/* a stage drawn at 1920 x 1080 and scaled into a box of width w */
function stageHtml(r,w,opt){const k=w/1920;return '<div class="gx-box" style="width:'+w+'px;height:'+Math.round(1080*k)+'px"><div class="gx-sc" style="transform:scale('+k.toFixed(5)+')">'+cardHtml(r,opt)+'</div></div>';}

/* ---------------- the graphics window: the cards on their own, for a second display and the Yolobox ---------------- */
let GW=null,gwAt=-1;
const GBG={green:'#00b140',blue:'#0047bb',black:'#000000',none:'#3d4a55'};
function gwOpen(){if(GW&&!GW.closed){try{GW.focus();}catch(e){}gwShow(curRow());return;}
  GW=window.open('','tv1-graphics','popup,width=960,height=540');if(!GW){nbhUI.toast('The browser did not open the window: allow pop-ups for this site, then try again.',{kind:'warn'});return;}
  const fit=fitGx.toString();
  GW.document.open();GW.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TV-1 graphics</title><style>html,body{margin:0;height:100%;overflow:hidden;background:'+(GBG[S.meta.gbg]||'#00b140')+';cursor:none}'+
    '#st{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}.ly{position:absolute;inset:0;transition:opacity .35s ease}'+GFX_CSS+'<\/style><\/head><body><div id="st"><div class="ly" id="la"></div><div class="ly" id="lb" style="opacity:0"></div></div><script>'+fit+
    ';var A=document.getElementById("la"),B=document.getElementById("lb");function size(){var w=innerWidth,h=innerHeight,k=Math.min(w/1920,h/1080),st=document.getElementById("st");st.style.transform="translate("+((w-1920*k)/2)+"px,"+((h-1080*k)/2)+"px) scale("+k+")";}'+
    'addEventListener("resize",size);size();window.show=function(h,bg){document.body.style.background=bg;B.innerHTML=h;fitGx(B);B.style.opacity="1";A.style.opacity="0";var t=A;A=B;B=t;};'+
    'document.addEventListener("dblclick",function(){var e=document.documentElement;(e.requestFullscreen||e.webkitRequestFullscreen||function(){}).call(e);});<\/script><\/body><\/html>');GW.document.close();
  gwAt=-1;setTimeout(()=>gwShow(curRow()),80);}
function gwShow(i){if(!GW||GW.closed||!GW.show)return;const r=S.rows[i];gwAt=i;try{GW.show(cardHtml(r,{presenter:S.meta.gbg==='none'}),GBG[S.meta.gbg]||'#00b140');}catch(e){}}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});
  if(v==='prompter')tpRender();if(v==='graphics')gxRender();if(v!=='prompter')tpStop();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- Setup ---------------- */
function renderSetup(){const pk=$('#segPick');if(pk&&!pk.children.length)pk.innerHTML=SEGS.map(([k,l])=>'<label class="ck"><input type="checkbox" data-seg="'+k+'" checked> '+esc(l)+'</label>').join('');
  const f=CASE||{},bits=[];if((f.behaviors||[]).length)bits.push((f.behaviors.length===1?'one target behavior':nw(f.behaviors.length)+' target behaviors')+' (Form '+((f.src&&f.src.behaviors)||'TB-1')+')');
  if(f.fn&&(f.fn.label||f.fn.key))bits.push('the function (Form FS-1)');if(f.goals&&((f.goals.red||[]).length||(f.goals.acq||[]).length))bits.push('the goals (Form GB-1)');if((f.menu||[]).length)bits.push('the reinforcer menu (Form PA-1)');
  const cl=$('#caseLine');if(cl)cl.textContent=bits.length?'The case holds '+bits.join(', ')+'.':'No case yet: open the case in the workstation (Forms TB-1, FS-1, GB-1, PA-1) and the draft fills from it; without it, the draft is the outline with prompts to write.';
  const v=$('#setupVerdict'),n=S.rows.length,P=paras(),w=S.rows.reduce((a,r,i)=>a+(r.cont?0:words(r.say)),0),td=S.rows.filter(r=>todo(r.say)||todo(r.title)||todo(r.body)).length;
  if(v)v.innerHTML=n?'<div class="verdict '+(td?'v-mid':'v-ok')+'"><b>'+(td?'Still to write:':'Ready.')+'</b> '+(td?td+' row'+(td===1?'':'s')+' with words in [brackets]. ':'')+n+' card'+(n===1?'':'s')+' in '+P.length+' paragraph'+(P.length===1?'':'s')+', about '+mmss(w/wpm()*60)+' at '+wpm()+' words a minute.</div>':
    '<div class="verdict v-mid"><b>No script yet.</b> Draft from the case (below), import a sheet made before, or Load simulator to see a sample.</div>';}

/* ---------------- Script: the rows ---------------- */
function segColor(i){return ['#e8f0f7','#f6efe2','#eef6ee','#f4ecf6','#f8f4e0','#e9f4f4'][i%6];}
function picCell(i,j){const p=S.rows[i].pics[j],P=p.ph&&photo(p.ph);return '<div class="tv-pic"><div class="tv-pv">'+(P?'<img src="'+P.img+'" alt="">':'<span>picture '+(j+1)+'</span>')+'</div><div class="tv-pb"><button type="button" class="tool" data-pic="'+i+':'+j+'">'+(P?'Change':'Add')+'</button>'+(P?'<button type="button" class="tool" data-picx="'+i+':'+j+'">Remove</button>':'')+'</div><input data-i="'+i+'" data-f="cap'+j+'" name="r.'+i+'.cap'+j+'" value="'+esc(p.cap)+'" placeholder="caption" aria-label="Row '+(i+1)+', caption of picture '+(j+1)+'"></div>';}
function rowHtml(r,i){const segStart=i===0||S.rows[i-1].seg!==r.seg;
  return (segStart?'<div class="tv-seghead" data-segat="'+i+'"><input class="tv-segname" data-segname="'+i+'" value="'+esc(r.seg)+'" aria-label="Segment name" placeholder="Segment"><span class="tv-segsum" data-segsum="'+i+'"></span><button type="button" class="tool" data-addhere="'+i+'">Add a row to this segment</button></div>':'')+
    '<div class="tv-row'+(todo(r.say)||todo(r.title)||todo(r.body)?' todo':'')+'" data-row="'+i+'"><div class="tv-n"><b>'+(i+1)+'</b><span class="mv"><button type="button" data-mv="'+i+':-1" aria-label="Move row '+(i+1)+' up"'+(i?'':' disabled')+'>&#9650;</button><button type="button" data-mv="'+i+':1" aria-label="Move row '+(i+1)+' down"'+(i<S.rows.length-1?'':' disabled')+'>&#9660;</button></span><button type="button" class="tool" data-dup="'+i+'" aria-label="Copy row '+(i+1)+'">Copy</button><button type="button" class="tool" data-del="'+i+'" aria-label="Remove row '+(i+1)+'">Remove</button></div>'+
    '<div class="tv-say"><label>What you say</label><textarea data-i="'+i+'" data-f="say" name="r.'+i+'.say" rows="4"'+(r.cont?' disabled placeholder="(the paragraph above goes on)"':'')+'>'+esc(r.cont?'':r.say)+'</textarea>'+(i?'<label class="ck"><input type="checkbox" data-i="'+i+'" data-f="cont" name="r.'+i+'.cont"'+(r.cont?' checked':'')+'> Same words as above (the card changes)</label>':'')+'<span class="tv-w" data-w="'+i+'"></span></div>'+
    '<div class="tv-card"><label>The card</label><input data-i="'+i+'" data-f="title" name="r.'+i+'.title" value="'+esc(r.title)+'" placeholder="Title on the card"><textarea data-i="'+i+'" data-f="body" name="r.'+i+'.body" rows="4" data-nbh-nowording placeholder="One line a point">'+esc(r.body)+'</textarea>'+
      '<div class="tv-lay"><select data-i="'+i+'" data-f="lay" name="r.'+i+'.lay" aria-label="Layout of card '+(i+1)+'">'+LAYS.map(([k,l])=>'<option value="'+k+'"'+(r.lay===k?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select><span class="tv-layis" data-layis="'+i+'"></span></div>'+
      '<div class="tv-pics">'+picCell(i,0)+picCell(i,1)+'</div></div>'+
    '<div class="tv-thumb" data-thumb="'+i+'"></div></div>';}
function renderRows(){const el=$('#rows');if(!el)return;el.innerHTML=S.rows.length?S.rows.map(rowHtml).join(''):'<p class="hint">No rows yet. Draft from the case (Setup), import a sheet, or Add a row.</p>';
  $$('.tv-seghead',el).forEach((h,k)=>{h.style.background=segColor(k);});renderSums();renderThumbs();}
function renderThumbs(only){$$('[data-thumb]').forEach(t=>{const i=+t.dataset.thumb;if(only!=null&&i!==only)return;t.innerHTML=stageHtml(S.rows[i],240,{presenter:true});fitGx(t);const li=$('[data-layis="'+i+'"]');if(li){const l=layOf(S.rows[i]);li.textContent=S.rows[i].lay==='auto'?'('+((LAYS.find(x=>x[0]===l)||['',''])[1]).toLowerCase()+')':'';}});}
function renderSums(){const W=wpm();$$('[data-w]').forEach(e=>{const i=+e.dataset.w,r=S.rows[i];if(r.cont){e.textContent='';return;}const n=words(r.say);e.textContent=n?n+' words, about '+mmss(n/W*60):'';});
  $$('[data-segsum]').forEach(e=>{const i0=+e.dataset.segsum,seg=S.rows[i0].seg;let n=0,w=0;for(let i=i0;i<S.rows.length&&S.rows[i].seg===seg;i++){n++;if(!S.rows[i].cont)w+=words(S.rows[i].say);}e.textContent=n+' card'+(n===1?'':'s')+', about '+mmss(w/W*60);});
  const tot=S.rows.reduce((a,r)=>a+(r.cont?0:words(r.say)),0),td=S.rows.filter(r=>todo(r.say)||todo(r.title)||todo(r.body)).length,sm=$('#scriptSum');
  if(sm)sm.innerHTML=S.rows.length?'<b>'+S.rows.length+'</b> cards &middot; <b>'+paras().length+'</b> paragraphs &middot; <b>'+tot.toLocaleString()+'</b> words &middot; about <b>'+mmss(tot/W*60)+'</b> at '+W+' words a minute'+(td?' &middot; <span class="tv-tdn">'+td+' still to write</span>':''):'';
  renderSetup();}

/* ---------------- Graphics view ---------------- */
let gxAt=0;
function gxRender(){const big=$('#gxBig');if(!big)return;const n=S.rows.length;gxAt=Math.max(0,Math.min(n-1,gxAt));
  const w=Math.min(big.clientWidth||900,1100);big.innerHTML=n?stageHtml(S.rows[gxAt],w,{presenter:true}):'<p class="hint">No cards yet.</p>';fitGx(big);
  $('#gxPos').textContent=n?'Card '+(gxAt+1)+' of '+n:'';const r=S.rows[gxAt];$('#gxInfo').innerHTML=r?esc(r.seg)+(r.title?' &middot; '+esc(r.title):'')+'<br>'+esc((LAYS.find(l=>l[0]===layOf(r))||['',''])[1]):'';
  $('#gxGrid').innerHTML=S.rows.map((r,i)=>'<button type="button" class="gx-t'+(i===gxAt?' on':'')+'" data-gx="'+i+'"><span>'+(i+1)+'</span>'+stageHtml(r,220,{presenter:true})+'</button>').join('');fitGx($('#gxGrid'));}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gx]');if(b){gxAt=+b.dataset.gx;gxRender();gwShow(gxAt);}});

/* ---------------- Teleprompter ---------------- */
let TP={i:0,run:false,y:0,raf:0,last:0,t0:0,rec:false,tick:0};
const curRow=()=>Math.max(0,Math.min(S.rows.length-1,TP.i));
function tpRender(){const st=$('#tpStrip');if(!st)return;const P=paras();
  st.innerHTML=P.length?P.map((p,k)=>{const r0=S.rows[p.start];return '<div class="tp-p" data-p="'+k+'">'+'<div class="tp-cards">'+p.rows.map(i=>'<span class="tp-c" data-ci="'+i+'">'+(i+1)+(S.rows[i].title?' · '+esc(S.rows[i].title):'')+'</span>').join('')+'</div><div class="tp-t">'+mark(r0.say||'').replace(/\n/g,'<br>')+'</div></div>';}).join('')+'<div class="tp-end">End of the script</div>':'<div class="tp-p"><div class="tp-t">No script yet.</div></div>';
  tpStyle();tpGo(TP.i,true);}
function tpStyle(){const sc=$('#tpScreen');if(!sc)return;sc.style.setProperty('--tps',(num(S.meta.tpsize)||58)+'px');sc.classList.toggle('mirror',!!S.chk.mirror);const v=$('#tpWpmV');if(v)v.textContent=wpm()+' wpm';}
function tpGo(i,instant){const n=S.rows.length;if(!n)return;TP.i=Math.max(0,Math.min(n-1,i));const k=paras().findIndex(p=>p.rows.includes(TP.i));
  $$('#tpStrip .tp-p').forEach((e,j)=>e.classList.toggle('on',j===k));$$('#tpStrip .tp-c').forEach(e=>e.classList.toggle('on',+e.dataset.ci===TP.i));
  const pe=$('#tpStrip .tp-p[data-p="'+k+'"]');if(pe&&(instant||!pe.contains(document.activeElement))){const sameP=TP.lastP===k;TP.lastP=k;if(!sameP||instant){TP.y=pe.offsetTop;tpApply(!instant);}}
  const r=S.rows[TP.i];$('#tpPos').textContent='Card '+(TP.i+1)+' of '+n+(r&&r.title?': '+r.title:'');
  const nx=S.rows[TP.i+1];$('#tpFoot').textContent=nx?'Next: '+(nx.cont?'(same paragraph) ':'')+(nx.title||nx.seg||''):'The last card';
  if(TP.rec){S.log.push({i:TP.i,t:+((performance.now()-TP.t0)/1000).toFixed(2),seg:r.seg,title:r.title});syncState();logLine();}
  gwShow(TP.i);}
function tpApply(smooth){const st=$('#tpStrip');if(!st)return;st.style.transition=smooth?'transform .45s ease':'none';st.style.transform='translateY('+(-TP.y)+'px)';}
function tpNext(){if(S.rows.length&&TP.i<S.rows.length-1)tpGo(TP.i+1);}
function tpPrev(){if(TP.i>0)tpGo(TP.i-1);}
function tpToggle(){TP.run=!TP.run;const b=$('#tpRun');if(b){b.setAttribute('aria-pressed',String(TP.run));b.textContent=TP.run?'Stop':'Scroll';}if(TP.run){TP.last=performance.now();cancelAnimationFrame(TP.raf);TP.raf=requestAnimationFrame(tpFrame);wake(true);}else{cancelAnimationFrame(TP.raf);}}
/* scrolling a paragraph at the speed set: the paragraph's height over its reading time */
function tpFrame(now){if(!TP.run)return;const dt=Math.min(.1,(now-TP.last)/1000);TP.last=now;const k=paras().findIndex(p=>p.rows.includes(TP.i)),pe=$('#tpStrip .tp-p[data-p="'+k+'"]');
  if(pe){const n=Math.max(1,words(S.rows[paras()[k].start].say)),secs=n/wpm()*60,h=pe.offsetHeight,max=pe.offsetTop+Math.max(0,h-($('#tpScreen').clientHeight*.5));
    TP.y=Math.min(max,TP.y+h/secs*dt);tpApply(false);}
  TP.raf=requestAnimationFrame(tpFrame);}
function tpStop(){if(TP.run)tpToggle();wake(false);}
let WL=null;function wake(on){try{if(on&&!WL&&navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>{WL=w;},()=>{});else if(!on&&WL){WL.release().catch(()=>{});WL=null;}}catch(e){}}
function tpClock(){if(!TP.rec)return;$('#tpClock').textContent=mmss((performance.now()-TP.t0)/1000);}
function logLine(){const l=$('#logLine');if(l)l.textContent=S.log.length?S.log.length+' card times kept (the last take).':'';}
$('#tpNext').addEventListener('click',tpNext);$('#tpPrev').addEventListener('click',tpPrev);$('#tpRun').addEventListener('click',tpToggle);
$('#tpRec').addEventListener('click',()=>{const b=$('#tpRec');if(!TP.rec){TP.rec=true;TP.t0=performance.now();S.log=[];b.textContent='Stop the clock';b.setAttribute('aria-pressed','true');TP.tick=setInterval(tpClock,250);wake(true);tpGo(TP.i);}
  else{TP.rec=false;clearInterval(TP.tick);b.textContent='Start the clock';b.setAttribute('aria-pressed','false');syncState();}});
$('#tpGfx').addEventListener('click',gwOpen);$('#gxWin').addEventListener('click',gwOpen);
$('#gxPrev').addEventListener('click',()=>{gxAt--;gxRender();gwShow(gxAt);});$('#gxNext').addEventListener('click',()=>{gxAt++;gxRender();gwShow(gxAt);});
$('#tpFs').addEventListener('click',()=>{const w=$('#tpWrap');const fe=document.fullscreenElement||document.webkitFullscreenElement;
  if(fe||w.classList.contains('tp-fs')){if(fe)(document.exitFullscreen||document.webkitExitFullscreen).call(document);w.classList.remove('tp-fs');return;}
  const rq=w.requestFullscreen||w.webkitRequestFullscreen;if(rq){try{const p=rq.call(w);if(p&&p.catch)p.catch(()=>w.classList.add('tp-fs'));}catch(e){w.classList.add('tp-fs');}}else w.classList.add('tp-fs');});
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('view-prompter')||e.altKey||e.ctrlKey||e.metaKey)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&t.type!=='range'&&t.type!=='checkbox')return;
  if(['PageDown','ArrowRight','ArrowDown','Enter'].includes(e.key)){e.preventDefault();tpNext();}
  else if(['PageUp','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();tpPrev();}
  else if(e.key===' '){e.preventDefault();if(!e.repeat)tpToggle();}
  else if(e.key==='Escape'){$('#tpWrap').classList.remove('tp-fs');}});
$('#logCsv').addEventListener('click',()=>{if(!S.log.length){nbhUI.toast('No card times yet: Start the clock on the teleprompter as you record.',{kind:'warn'});return;}
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';const rows=[['Card','Seconds','Time','Segment','Title']].concat(S.log.map(l=>[l.i+1,l.t,mmss(l.t),l.seg,l.title]));
  download(rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv','TV-1_'+fileName()+'_card-times.csv');});

/* ---------------- editing ---------------- */
let tSoon=0;function soon(){clearTimeout(tSoon);tSoon=setTimeout(()=>{renderSums();syncState();},250);}
document.addEventListener('input',e=>{const el=e.target;if(el.id==='tvState'){restoreState(el.value);return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(c1|c2|cardbg|side|font)$/.test(el.dataset.m))renderThumbs();if(/^tp/.test(el.dataset.m))tpStyle();if(el.dataset.m==='tpwpm')renderSums();soon();return;}
  if(el.dataset.segname!==undefined){const i0=+el.dataset.segname,old=S.rows[i0].seg;for(let i=i0;i<S.rows.length&&S.rows[i].seg===old;i++)S.rows[i].seg=el.value;soon();return;}
  if(el.dataset.i!==undefined&&el.dataset.f){const i=+el.dataset.i,f=el.dataset.f,r=S.rows[i];if(!r)return;
    if(f==='cont'){r.cont=el.checked;if(r.cont)r.say='';renderRows();syncState();return;}
    if(/^cap\d$/.test(f))r.pics[+f.slice(3)].cap=el.value;else r[f]=el.value;
    if(f==='lay'||f==='title'||f==='body'||/^cap/.test(f)){clearTimeout(r._t);r._t=setTimeout(()=>renderThumbs(i),300);}
    const row=el.closest('.tv-row');if(row)row.classList.toggle('todo',todo(r.say)||todo(r.title)||todo(r.body));soon();}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;tpStyle();syncState();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(el.dataset.m==='gbg')gwShow(gwAt<0?curRow():gwAt);renderThumbs();renderSetup();syncState();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.mv){const [i,s]=d.mv.split(':').map(Number),j=i+s;if(j<0||j>=S.rows.length)return;[S.rows[i],S.rows[j]]=[S.rows[j],S.rows[i]];if(S.rows[0])S.rows[0].cont=false;renderRows();syncState();return;}
  if(d.dup!==undefined){const i=+d.dup,c=JSON.parse(JSON.stringify(S.rows[i]));S.rows.splice(i+1,0,newRow('',c));renderRows();syncState();return;}
  if(d.del!==undefined){const i=+d.del;S.rows.splice(i,1);if(S.rows[i]&&i===0)S.rows[0].cont=false;if(S.rows[i]&&S.rows[i].cont&&(i===0))S.rows[i].cont=false;renderRows();syncState();return;}
  if(d.addhere!==undefined){const i0=+d.addhere,seg=S.rows[i0].seg;let k=i0;while(k+1<S.rows.length&&S.rows[k+1].seg===seg)k++;S.rows.splice(k+1,0,newRow(seg));renderRows();syncState();const t=$('textarea[data-i="'+(k+1)+'"][data-f="say"]');if(t)t.focus();return;}
  if(d.pic){const [i,j]=d.pic.split(':').map(Number);PICK={i,j};$('#photoIn').click();return;}
  if(d.picx){const [i,j]=d.picx.split(':').map(Number);S.rows[i].pics[j].ph='';prune();renderRows();syncState();return;}});
$('#addSeg').addEventListener('click',()=>{S.rows.push(newRow('New segment',{title:'',say:''}));renderRows();syncState();const ins=$$('.tv-segname');if(ins.length){ins[ins.length-1].focus();ins[ins.length-1].select();}});
$('#addRow').addEventListener('click',()=>{const L=S.rows[S.rows.length-1];S.rows.push(newRow(L?L.seg:'Training Overview'));renderRows();syncState();});
$('#emptyAll').addEventListener('click',async()=>{if(!S.rows.length)return;if(await nbhUI.confirm('Empty the script?\nEvery row, card and picture is removed.',{ok:'Empty',danger:true})){S.rows=[];S.photos=[];renderAll();}});
/* pictures: kept at up to 1600 px (the cards are 1080 high), as JPEG (PNG when they have transparency) */
let PICK=null;
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f||!PICK)return;const at=PICK;PICK=null;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,1600/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);
    const png=/png|gif|webp/i.test(f.type);const id='p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);S.photos.push({id,label:String(f.name||'picture').replace(/\.[^.]+$/,'').slice(0,40),img:png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.86)});
    S.rows[at.i].pics[at.j].ph=id;if(!S.rows[at.i].pics[at.j].cap)S.rows[at.i].pics[at.j].cap='';renderRows();syncState();};im.src=r.result;};r.readAsDataURL(f);});
function prune(){const used=new Set();S.rows.forEach(r=>r.pics.forEach(p=>{if(p.ph)used.add(p.ph);}));S.photos=S.photos.filter(p=>used.has(p.id));}

/* ---------------- the sheet: import and export in the layout Flowics reads ---------------- */
/* the first tab: every row in nine columns, A the segment, B the words, C the card's title, D its text, E and F the two picture
   captions, G to I the template's picture places; a row that continues a paragraph repeats its words (as the sheet does) */
function sheetRows(){return S.rows.map((r,i)=>[r.seg,r.cont?(S.rows[paraOf(i)].say||''):r.say,r.title,r.body,r.pics[0].cap,r.pics[1].cap,r.x[0],r.x[1],r.x[2]]);}
const tabName=(i,s)=>(String(i).padStart(2,'0')+'_'+String(s||'Segment').replace(/&/g,'And').replace(/\./g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')).slice(0,31);
function fromSheet(rows){const out=[];rows.forEach(c=>{c=c.map(v=>String(v==null?'':v));while(c.length<9)c.push('');if(!c.slice(0,4).some(v=>v.trim()))return;
    const prev=out[out.length-1],say=c[1],cont=!!(prev&&say.trim()&&say.trim()===(prev.cont?(out[out.findLastIndex?out.findLastIndex(r=>!r.cont):out.length-1]||{}).say:prev.say||'').trim());
    out.push(newRow(c[0].trim(),{say:cont?'':say.replace(/\r/g,'').replace(/\n \n/g,'\n\n'),cont,title:c[2].trim(),body:c[3].replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean).join('\n'),pics:[{ph:'',cap:c[4].trim()},{ph:'',cap:c[5].trim()}],x:[c[6],c[7],c[8]]}));});
  return out;}
$('#impBtn').addEventListener('click',()=>$('#impIn').click());
$('#impIn').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;let rows=null;
  try{if(/\.xlsx$/i.test(f.name)||/spreadsheetml/.test(f.type)){const sh=await readXlsx(new Uint8Array(await f.arrayBuffer()));rows=sh&&sh[0]?sh[0].rows:null;}else rows=parseCsv(await f.text());}
  catch(err){rows=null;}
  const got=rows?fromSheet(rows):[];if(!got.length){nbhUI.toast('That file has no rows this form can read: use the sheet’s first tab, downloaded as CSV or .xlsx.',{kind:'warn'});return;}
  if(S.rows.length&&!(await nbhUI.confirm('Replace the script with the '+got.length+' rows of '+f.name+'?\nThe rows here now are removed (their pictures too).',{ok:'Replace',danger:true})))return;
  S.rows=got;prune();renderAll();setView('script');nbhUI.toast(got.length+' rows read from '+f.name+'. Pictures are not in a sheet: add them on their rows.',{kind:'ok'});});
$('#xlsxBtn').addEventListener('click',()=>{if(!S.rows.length){nbhUI.toast('No script to export yet.',{kind:'warn'});return;}
  const all=sheetRows(),segs=[];S.rows.forEach((r,i)=>{let s=segs.find(x=>x.seg===r.seg);if(!s){s={seg:r.seg,rows:[]};segs.push(s);}s.rows.push(all[i].slice(0,4));});
  const sheets=[{name:tabName(1,segs[0].seg),rows:all}].concat(segs.slice(1).map((s,k)=>({name:tabName(k+2,s.seg),rows:s.rows})));
  const seen={};sheets.forEach(s=>{let n=s.name,j=2;while(seen[n])n=s.name.slice(0,28)+'_'+(j++);seen[n]=1;s.name=n;});
  download(xlsxBytes(sheets),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','TV-1_'+fileName()+'_Training_Graphics.xlsx');});
$('#csvBtn').addEventListener('click',()=>{if(!S.rows.length){nbhUI.toast('No script to export yet.',{kind:'warn'});return;}const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  download(sheetRows().map(r=>r.map(q).join(',')).join('\n'),'text/csv','TV-1_'+fileName()+'_Training_Graphics.csv');});
function fileName(){return (String(S.meta.client||'student').replace(/^SIMULATED\s*[–-]\s*/,'SIM_')||'student').replace(/[^\w-]+/g,'_');}
function download(data,type,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}

/* the .xlsx writer and the CSV reader are the workstation's own (index.html, v21.36: a stored zip of the SpreadsheetML parts,
   inline strings, no library); the reader of an .xlsx unzips with the browser's own DecompressionStream */
const CRC_T=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c;}return t;})();
function crc32(u){let c=-1;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^-1)>>>0;}
function zipStore(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;const d=new Date(),dosT=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dosD=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const le=(n,b)=>{const a=new Uint8Array(b);for(let i=0;i<b;i++)a[i]=(n>>>(8*i))&255;return a;};
  for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const head=[le(0x04034b50,4),le(20,2),le(0x0800,2),le(0,2),le(dosT,2),le(dosD,2),le(crc,4),le(data.length,4),le(data.length,4),le(name.length,2),le(0,2),name];
    cd.push([le(0x02014b50,4),le(20,2),le(20,2),le(0x0800,2),le(0,2),le(dosT,2),le(dosD,2),le(crc,4),le(data.length,4),le(data.length,4),le(name.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4),name]);
    head.forEach(h=>parts.push(h));parts.push(data);off+=head.reduce((a,h)=>a+h.length,0)+data.length;}
  const cdStart=off;let cdLen=0;cd.forEach(e=>e.forEach(h=>{parts.push(h);cdLen+=h.length;}));[le(0x06054b50,4),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(cdLen,4),le(cdStart,4),le(0,2)].forEach(h=>parts.push(h));
  const out=new Uint8Array(parts.reduce((a,p)=>a+p.length,0));let k=0;parts.forEach(p=>{out.set(p,k);k+=p.length;});return out;}
function xlsxBytes(sheets){const X=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
  const colName=n=>{let t='';n++;while(n){const r=(n-1)%26;t=String.fromCharCode(65+r)+t;n=Math.floor((n-1)/26);}return t;};
  const sheetXml=rows=>{const w=[];rows.forEach(r=>r.forEach((v,j)=>{w[j]=Math.max(w[j]||0,Math.min(60,String(v==null?'':v).length));}));
    const cols=w.length?'<cols>'+w.map((x,j)=>'<col min="'+(j+1)+'" max="'+(j+1)+'" width="'+Math.max(8,x+2)+'" customWidth="1"/>').join('')+'</cols>':'';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+cols+'<sheetData>'+
      rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>{if(v==null||v==='')return '';return '<c r="'+colName(j)+(i+1)+'" t="inlineStr"><is><t xml:space="preserve">'+X(v)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData></worksheet>';};
  const files=[];
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
  files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((sh,i)=>'<sheet name="'+X(sh.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'});
  files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>'});
  sheets.forEach((sh,i)=>files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sheetXml(sh.rows)}));return zipStore(files);}
function parseCsv(text){const rows=[];let row=[],cell='',q=false;const t=String(text||'').replace(/^﻿/,'');
  for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;continue;}
    if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;}
  if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
async function readXlsx(u){const dv=new DataView(u.buffer,u.byteOffset,u.byteLength),td=new TextDecoder();let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)return null;
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const ents={};
  for(let k=0;k<n;k++){const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
    const name=td.decode(u.subarray(p+46,p+46+nl));ents[name]={meth,csz,lo};p+=46+nl+xl+cl;}
  const get=async name=>{const en=ents[name];if(!en)return null;const nl=dv.getUint16(en.lo+26,true),xl=dv.getUint16(en.lo+28,true),d=u.subarray(en.lo+30+nl+xl,en.lo+30+nl+xl+en.csz);
    if(en.meth===0)return td.decode(d);if(en.meth!==8||typeof DecompressionStream==='undefined')throw new Error('compressed');
    return await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();};
  const dp=new DOMParser(),xml=s=>dp.parseFromString(s,'application/xml');const ss=[];const sst=await get('xl/sharedStrings.xml');
  if(sst)[...xml(sst).getElementsByTagName('si')].forEach(si=>ss.push([...si.getElementsByTagName('t')].map(t=>t.textContent).join('')));
  const wb=xml(await get('xl/workbook.xml')),rels=xml(await get('xl/_rels/workbook.xml.rels')),rmap={};[...rels.getElementsByTagName('Relationship')].forEach(r=>{rmap[r.getAttribute('Id')]=r.getAttribute('Target');});
  const out=[];for(const sh of [...wb.getElementsByTagName('sheet')]){const tgt=rmap[sh.getAttribute('r:id')]||'';const doc=xml(await get('xl/'+tgt.replace(/^\/?xl\//,'')));const rows=[];
    [...doc.getElementsByTagName('row')].forEach(r=>{const ri=(+r.getAttribute('r')||rows.length+1)-1,row=[];[...r.getElementsByTagName('c')].forEach(c=>{const ref=c.getAttribute('r')||'',col=ref.replace(/\d+/g,'').split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1,t=c.getAttribute('t');
      let v='';if(t==='s')v=ss[+((c.getElementsByTagName('v')[0]||{}).textContent||0)]||'';else if(t==='inlineStr')v=[...c.getElementsByTagName('t')].map(x=>x.textContent).join('');else v=(c.getElementsByTagName('v')[0]||{}).textContent||'';row[col<0?row.length:col]=v;});
      rows[ri]=Array.from(row,x=>x==null?'':x);});
    out.push({name:sh.getAttribute('name'),rows:Array.from(rows,r=>r||[])});}
  return out;}

/* ---------------- print: the script, by segment ---------------- */
function renderPrint(){const o=$('#printOut');if(!o)return;let seg=null,h='<h1 class="pr-h">'+esc(possess(firstName()))+' Training Video: the Script</h1><p class="pr-s">'+esc([S.meta.client,S.meta.site,S.meta.pname].filter(Boolean).join(' · '))+'</p>';
  S.rows.forEach((r,i)=>{if(r.seg!==seg){seg=r.seg;h+='<h2 class="pr-g">'+esc(seg)+'</h2>';}
    h+='<div class="pr-r"><div class="pr-n">'+(i+1)+'</div><div class="pr-say">'+(r.cont?'<i>(the paragraph above goes on)</i>':esc(r.say).replace(/\n/g,'<br>'))+'</div><div class="pr-card"><b>'+esc(r.title)+'</b>'+(r.body?'<br>'+esc(r.body).replace(/\n/g,'<br>'):'')+'</div></div>';});
  o.innerHTML=h;}
$('#printBtn').addEventListener('click',()=>{renderPrint();setTimeout(()=>window.print(),60);});

/* ---------------- save, open, clear, the simulator ---------------- */
function syncState(){const t=$('#tvState');if(t)t.value=JSON.stringify(S);}
function fromFile(d){if(!d||typeof d!=='object'||d.form!=='TV-1'||!d.S||typeof d.S!=='object')return null;const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v);
  if(s.meta&&typeof s.meta==='object')Object.keys(s.meta).forEach(k=>{o.meta[k]=str(s.meta[k]).slice(0,4000);});['c1','c2'].forEach(k=>{o.meta[k]=hex(o.meta[k],blank().meta[k]);});if(s.chk&&typeof s.chk==='object')Object.keys(s.chk).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<3000000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,300).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,40),img:str(p&&p.img)})).filter(p=>/^[A-Za-z0-9_-]{1,20}$/.test(p.id)&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));
  o.rows=Array.isArray(s.rows)?s.rows.slice(0,600).map(r=>{r=r&&typeof r==='object'?r:{};const pics=Array.isArray(r.pics)?r.pics:[];
    return newRow(str(r.seg).slice(0,80),{say:str(r.say).slice(0,8000),cont:!!r.cont,title:str(r.title).slice(0,200),body:str(r.body).slice(0,4000),lay:LAYS.some(l=>l[0]===r.lay)?r.lay:'auto',
      pics:[0,1].map(j=>{const p=pics[j]||{};return {ph:ids.has(str(p.ph))?str(p.ph):'',cap:str(p.cap).slice(0,120)};}),x:[0,1,2].map(j=>str(Array.isArray(r.x)?r.x[j]:'').slice(0,200))});}):[];
  if(o.rows[0])o.rows[0].cont=false;
  o.log=Array.isArray(s.log)?s.log.slice(0,2000).map(l=>({i:Math.max(0,parseInt(l&&l.i)||0),t:num(l&&l.t)||0,seg:str(l&&l.seg).slice(0,80),title:str(l&&l.title).slice(0,200)})):[];
  return o;}
function restoreState(v){let d=null;try{d=JSON.parse(v);}catch(e){}const n=d&&fromFile({form:'TV-1',S:d});if(n){S=n;renderAll();}}
$('#saveBtn').addEventListener('click',()=>{const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  download(JSON.stringify({form:'TV-1',rev:'2026-10',saved:t.toISOString(),S},null,1),'application/json','TV-1_'+fileName()+'_'+ymd+'.json');});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(x){}
  const other=d&&typeof d.form==='string'&&d.form!=='TV-1'?d.form:'';const n=other?null:fromFile(d);
  if(!n){nbhUI.toast(other?'That file was saved by Form '+other+', not by Form TV-1. Nothing was changed.':'That file could not be read as a saved TV-1 form. Nothing was changed.',{kind:'warn'});return;}S=n;renderAll();};r.readAsText(f);});
$('#clearBtn').addEventListener('click',async()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});
$('#draftBtn').addEventListener('click',async()=>{const keys=$$('#segPick input[data-seg]').filter(c=>c.checked).map(c=>c.dataset.seg);if(!keys.length){nbhUI.toast('Tick the segments to draft (Setup).',{kind:'warn'});setView('setup');return;}
  const rows=draft(keys);S.rows=S.rows.concat(rows);renderAll();setView('script');
  nbhUI.toast(rows.length+' rows drafted'+(CASE?' from the case':' (no case open: the outline, with prompts to write)')+'. Words in [brackets] are still to write.',{kind:'ok'});});
/* the simulator: a sample student; nothing in it is real */
const SIMCASE={behaviors:[{label:'Elopement',def:'Leaving the assigned area by more than three feet without permission',ex:'walking out of the classroom door; running to the playground',nex:'going to the bathroom with a pass',dim:'frequency'},
  {label:'Physical aggression',def:'Hitting, kicking or pushing another person with enough force to be heard or to move them',ex:'hitting a peer on the arm',nex:'a high five',dim:'frequency'},
  {label:'Asking for a break',isRep:true,type:'replacement'}],
  fn:{label:'Escape from demands',statements:['When Sam is given a hard or long task, Sam leaves the area or hits, and the task is taken away.']},
  goals:{red:[{beh:'Elopement',text:'Elopement will decrease to zero instances a day for 15 consecutive school days'}],acq:[{beh:'Asking for a break',text:'Sam will ask for a break with the break card in 8 of 10 opportunities over 3 weeks'}]},
  menu:[{name:'Tablet time',rank:1},{name:'Drawing',rank:2},{name:'Playground',rank:3},{name:'Music',rank:4}]};
async function loadSim(){if(!(await nbhUI.confirm('Load a simulated training script?\nThe form is filled with a sample student. Anything already entered will be replaced.',{ok:'Load'})))return;S=blank();
  Object.assign(S.meta,{client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'3',site:'Elementary, self-contained classroom',bcba:'Sample BCBA',first:'Sam',aud:'the receiving team at the new school',pname:'Sample Presenter, BCBA',plines:'Behavior Analyst\nCo-author of the FBA and BIP'});
  S.rows=draft(SEGS.map(s=>s[0]),SIMCASE);
  const fill=(seg,title,say,body)=>{const r=S.rows.find(x=>x.seg===seg&&x.title===title);if(r){if(say!=null)r.say=say;if(body!=null)r.body=body;}};
  fill('Student Profile','Strengths','A behavior plan only makes sense in the context of the whole learner, including what Sam does well and enjoys. Sam reads above grade level, loves drawing, and is kind to younger students.','• Reads above grade level\n• Drawing and art\n• Kind to younger students');
  fill('Student Profile','Communication','Sam speaks in full sentences, but under stress words get harder. Every adult gives Sam a moment, and points to the break card.','Give a moment to answer.\nPoint to the break card.');
  fill('Proactive Strategies','Proactive','Proactive strategies prevent the behavior, or make it less likely, by changing what happens before it. Every adult gives Sam a first-then card, short tasks broken into steps, and a choice of where to start.','• First-then card\n• Short tasks, in steps\n• A choice of where to start');
  fill('Response Plan','Steps',null,'1. Stay calm; use few words\n2. Point to the break card\n3. Give the break; set the timer\n4. Return to the same task, with help');
  fill('Response Plan','Steps','A response plan says what staff do after the behavior begins. It is a safety and de-escalation sequence, followed in order. Stay calm and use few words. Point to the break card. Give the break, set the timer, and return to the same task, with help.',null);
  fill('Key Takeaways','Remember','Two things matter most. Honor every break request, right away. And always return to the same task afterwards, so that leaving never ends the work.','• Honor every break request\n• Return to the same task');
  fill('Terms & Definitions','Terms','A few terms come up every day. The break card is the red card on Sam’s desk. The first-then card shows the task, then the reward.','• Break card: the red card on the desk\n• First-then card: the task, then the reward');
  S.rows=S.rows.filter(r=>!(r.seg==='Reinforcement System')).concat([]);
  const ri=S.rows.findIndex(r=>r.seg==='Proactive Strategies');S.rows.splice(ri,0,newRow('Reinforcement System',{say:'These are the items and activities Sam works for, from the preference assessment, the most preferred first. Sam earns a token for each finished step; five tokens earn five minutes of the chosen item.',title:'Works For',body:'• Tablet time\n• Drawing\n• Playground\n• Music'}),
    newRow('Reinforcement System',{cont:true,title:'Earning',body:'• A token for each finished step\n• Five tokens: five minutes',lay:'lower'}));
  S.rows.splice(1,0,newRow('Training Overview',{cont:true,title:'Training Overview',lay:'title'}));
  CASE=SIMCASE;renderAll();setView('script');nbhUI.toast('Simulator loaded: a sample training script for Sam ('+S.rows.length+' cards).',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);

/* ---------------- the case (the workstation shell's facts): kept for drafting; nothing is filled until you draft ---------------- */
window.__nbhFactsIn=function(f){CASE=f||null;renderSetup();return {filled:0,note:'the case is kept for drafting: press Draft from the case'};};
window.__nbhFactsPick=function(sel){CASE=Object.assign({},CASE||{},{behaviors:sel.behaviors&&sel.behaviors.length?sel.behaviors:(CASE&&CASE.behaviors)||[],fn:sel.fn||(CASE&&CASE.fn)||null,goals:sel.goals||(CASE&&CASE.goals),menu:sel.menu&&sel.menu.length?sel.menu:(CASE&&CASE.menu)||[]});
  const keys=SEGS.map(s=>s[0]);const rows=draft(keys);S.rows=S.rows.concat(rows);renderAll();return {filled:rows.length};};
window.__nbhViewFill=function(v){if(v!=='script')return null;return {filled:S.rows.filter(r=>!todo(r.say)&&!todo(r.title)&&!todo(r.body)).length,total:S.rows.length||1};};

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{const k=el.dataset.m;if(S.meta[k]!=null&&S.meta[k]!=='')el.value=S.meta[k];else if(el.tagName==='SELECT'||el.type==='color'||el.type==='range')S.meta[k]=el.value;else el.value='';});
  $$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();renderRows();if(document.body.classList.contains('view-graphics'))gxRender();if(document.body.classList.contains('view-prompter'))tpRender();renderPrint();logLine();syncState();}
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
window.addEventListener('beforeprint',renderPrint);
window.addEventListener('resize',()=>{clearTimeout(window.__tvRs);window.__tvRs=setTimeout(()=>{if(document.body.classList.contains('view-graphics'))gxRender();},200);});
renderAll();
