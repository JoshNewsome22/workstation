/* Form TV-1 · Training Video (v21.50): the script of a training video for a finished FBA and BIP, drafted from the case, the
   cards shown beside each paragraph, a teleprompter, the graphics drawn here (and in a window of their own for the Yolobox),
   and an export in the layout of the Google Sheet that drives Flowics. Everything stays in this form's state (S) and its saved
   file: nothing is sent anywhere. (v21.51) The teleprompter can scroll with the voice (its level, or its words recognised on the
   device), a list can build one point a click, and a take gives the video's chapters and captions. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v));return isFinite(n)?n:null;};
const WORDS=['no','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const nw=n=>WORDS[n]||String(n);

/* ---------------- state ---------------- */
/* a row: one beat of the training. seg: the segment; say: the words (blank with cont: the paragraph above goes on);
   title, body: the card; lay: its layout; pics: two pictures with captions; x: the sheet's own last three columns, kept as
   they came (the places of the pictures in the Flowics template) */
/* each look's own colours: the panel, the title and heading, the band, the chapter bar */
const LOOKC={chapters:{c1:'#222f5a',c2:'#eed9ad',c3:'#c1d8d3',c4:'#8b91bb'},panel:{c1:'#0f1b41',c2:'#cbb98a',c3:'#a9cdc7',c4:'#8b91bb'},cards:{c1:'#1d3b5a',c2:'#e8a33d',c3:'#a9cdc7',c4:'#8b91bb'}};
const LAYS=[['auto','Automatic'],['side','A card beside the presenter'],['lower','Lower third'],['full','Full-screen card'],['title','Section title'],['pic1','One picture'],['pic2','Two pictures'],['split','Text beside a picture'],['none','No card (the presenter alone)']];
function newRow(seg,o){return Object.assign({seg:seg||'',say:'',tp:'',cont:false,title:'',body:'',build:false,lay:'auto',ch:'',pics:[{ph:'',cap:''},{ph:'',cap:''}],x:Array(20).fill('')},o||{});}
function blank(){return{meta:{aud:'',pname:'',plines:'',look:'chapters',chapters:'',c1:'#222f5a',c2:'#eed9ad',c3:'#c1d8d3',c4:'#8b91bb',tkspd:'90',tksize:'43',tkfont:'merri',tkcol:'#111111',series:'Functional Treatments in Applied Behavior Analysis',tag:'',cardbg:'light',gbg:'green',side:'left',font:'lato',tpsize:'58',tpwpm:'140',tpmode:'fixed',tpsens:'50',tpline:'30'},chk:{mirror:false,nocd:false,tpmanual:false},rows:[],photos:[],log:[],wt:[],segs:{}};}
let S=blank();
function ensure(){if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  if(!Array.isArray(S.rows))S.rows=[];if(!Array.isArray(S.photos))S.photos=[];if(!Array.isArray(S.log))S.log=[];if(!Array.isArray(S.wt))S.wt=[];if(!S.segs||typeof S.segs!=='object')S.segs={};
  S.rows=S.rows.map(r=>{const o=newRow('',r&&typeof r==='object'?r:{});if(!Array.isArray(o.pics))o.pics=[];while(o.pics.length<2)o.pics.push({ph:'',cap:''});o.pics.length=2;
    if(!Array.isArray(o.x))o.x=[];o.x=o.x.map(v=>String(v==null?'':v));while(o.x.length<20)o.x.push('');o.x.length=20;o.ch=String(o.ch||'');if(!LAYS.some(l=>l[0]===o.lay))o.lay='auto';o.cont=!!o.cont;o.build=!!o.build;return o;});
  /* a setting left empty on purpose stays empty (no series band, the tag made from the name) */
  const d=blank().meta,keep=['series','tag','chapters'];Object.keys(d).forEach(k=>{if(S.meta[k]==null||(S.meta[k]===''&&!keep.includes(k)))S.meta[k]=d[k];});
  S.rows.forEach(r=>{r.tp=String(r.tp==null?'':r.tp);});if(!/^(fixed|speak|follow)$/.test(S.meta.tpmode))S.meta.tpmode='fixed';}
const firstName=()=>{const f=String(S.meta.first||'').trim();if(f)return f;const c=String(S.meta.client||'').trim().replace(/^SIMULATED\s*[–-]\s*/,'');return c?c.split(/\s+/)[0]:'the student';};
const possess=n=>/s$/i.test(n)?n+'’':n+'’s';
const photo=id=>S.photos.find(p=>p.id===id);

/* ---------------- the words: what a paragraph says, how long it takes ---------------- */
/* the teleprompter's own marks in the words said (v21.51): "//" a pause, *a word* to stress, {a note to yourself}, and (v21.52)
   ">>" the next card (or the next point of a list that builds) as the word before it is said; taken out
   of what is counted, of the cards, of the sheet and of the captions */
const MK=/\{[^}]*\}|(^|\s)(\/\/|>>|»)(?=\s|$)|\*[^*\n]+\*/;
const unmark=t=>{t=String(t||'');return MK.test(t)?t.replace(/\{[^}]*\}/g,' ').replace(/(^|\s)(\/\/|>>|»)(?=\s|$)/g,'$1').replace(/\*([^*\n]+)\*/g,'$1').replace(/[ \t]{2,}/g,' ').replace(/ *\n */g,'\n').trim():t;};
const words=t=>(unmark(t).replace(/\[[^\]]*\]/g,' x ').match(/[A-Za-z0-9’'-]+/g)||[]).length;
const todo=t=>/\[[^\]]+\]/.test(String(t||''));
/* what is said: the row's teleprompter words when it has them, else its paragraphs (column B, on the card in the Panel look) */
const spoken=r=>String(r&&r.tp||'').trim()?r.tp:(r?r.say:'');
/* the paragraph a row is in: the words of the first row of its run (a row that continues the one above has none of its own) */
function paraOf(i){let k=i;while(k>0&&S.rows[k].cont)k--;return k;}
function paras(){const P=[];S.rows.forEach((r,i)=>{if(i===0||!r.cont)P.push({start:i,rows:[i]});else P[P.length-1].rows.push(i);});return P;}
const wpm=()=>Math.max(80,Math.min(220,num(S.meta.tpwpm)||140));
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------------- the next-card marks (v21.52) ---------------- */
/* a paragraph with more than one step (more than one card, or a list that builds) gets a ">>" for each step after the first,
   at the end of the sentence nearest an even share of its words (or, with no sentence end near, after the word itself); a
   paragraph that has marks already is left as it is */
const CUE_RE=/(^|\s)(>>|»)(?=\s|$)/;
function paraSteps(p){return p.rows.length-1+p.rows.reduce((a,i)=>a+buildN(S.rows[i]),0);}
function placeCues(only){let n=0;paras().forEach((p,k)=>{if(only&&!only.includes(p.start))return;const r=S.rows[p.start],f=String(r.tp||'').trim()?'tp':'say',t=String(r[f]||''),need=paraSteps(p);
    if(need<1||CUE_RE.test(t))return;const W=[];const re=/\S+/g;let m;while((m=re.exec(t))){if(/^(\/\/|\{.*\}|\[.*\])$/.test(m[0]))continue;W.push({end:m.index+m[0].length,se:/[.!?:;]["”’)\]]*$/.test(m[0])||/^\s*\n/.test(t.slice(m.index+m[0].length))});}
    if(W.length<2)return;const at=[];for(let j=1;j<=need;j++){const want=Math.round(j*W.length/(need+1))-1,win=Math.max(2,Math.round(W.length/(need+1)/2));let best=-1;
      for(let d=0;d<=win;d++){for(const q of [want+d,want-d])if(q>=0&&q<W.length-1&&W[q].se&&!at.includes(q)&&(!at.length||q>at[at.length-1])){best=q;break;}if(best>=0)break;}
      if(best<0)best=Math.max(at.length?at[at.length-1]+1:0,Math.min(W.length-2,want));if(best>=W.length-1||at.includes(best))continue;at.push(best);}
    let o=t;at.slice().sort((a,b)=>b-a).forEach(q=>{o=o.slice(0,W[q].end)+' >>'+o.slice(W[q].end);});r[f]=o;n+=at.length;});return n;}

/* ---------------- drafting from the case ---------------- */
/* the case (the facts the workstation shell hands this form) is kept as it last came, so a draft can be made later too */
let CASE=null;
const SEGS=[['overview','Training Overview'],['profile','Student Profile'],['behaviors','Target Behaviors'],['function','Function & Data'],['goals','Goals of Intervention'],
  ['reinforce','Reinforcement System'],['proactive','Proactive Strategies'],['response','Response Plan'],['takeaways','Key Takeaways'],['terms','Terms & Definitions']];
const lc1=s=>{s=String(s||'').trim();return /^[A-Z][a-z]/.test(s)?s[0].toLowerCase()+s.slice(1):s;};
const sent=s=>{s=String(s||'').trim().replace(/\s+/g,' ');if(!s)return '';return /[.!?]$/.test(s)?s:s+'.';};
const bullets=a=>a.filter(Boolean).map(x=>'• '+String(x).trim()).join('\n');
/* column B as the sheet writes it: the opening sentence a paragraph, the rest the next */
const lead=t=>String(t||'').replace(/^([^.!?\[\n]{12,}?[.!?])\s+(?=[A-Z\[])/,'$1\n\n');
const GROUP={overview:'Intro',profile:'Intro',behaviors:'Behavior',function:'Behavior',goals:'Goals',reinforce:'The Plan',proactive:'The Plan',response:'Response',takeaways:'Close',terms:'Close'};
/* (v21.52) the case's own words, from the profile (DM-1), the plan (TD-1) and the crisis plan (CR-1): a field's items (split at
   ";", new lines and commas), a list said aloud, a short line for a card */
const str=v=>String(v==null?'':v).trim();
const items=t=>str(t).split(/\s*(?:[;\n•]|,\s+)\s*/).map(x=>x.replace(/^[-–*]\s*/,'').replace(/[.]+$/,'').trim()).filter(Boolean);
const andList=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const cap1=x=>{x=str(x);return x?x[0].toUpperCase()+x.slice(1):x;};
/* a card's line: without the asides in brackets, the first clause (or as many of its parts as fit), cut at a word only when
   nothing shorter is whole */
const short=(x,n)=>{x=str(x).replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim();n=n||64;if(x.length<=n)return x;
  const c0=x.split(/\s*[;:]\s+|\.\s+/)[0];if(c0.length<=n&&c0.length>=8)return c0;let o='';for(const q of c0.split(/,\s+/)){if((o?o+', '+q:q).length>n)break;o=o?o+', '+q:q;}
  return o.length>=8?o:x.slice(0,n).replace(/\s+\S*$/,'')+'…';};
const first=x=>str(x).split(/(?<=[.;])\s+/)[0].replace(/[.;]$/,'');
function draft(keys,f){f=f||CASE||{};const N=firstName(),Np=possess(N),out=[];const add=(seg,o)=>{if(o&&o.say)o.say=lead(o.say);out.push(newRow(seg,o));};
  const behs=(f.behaviors||[]).filter(b=>b&&(b.label||b.def)),red=behs.filter(b=>!b.isRep&&!/replacement|alternative/i.test(b.type||'')),rep=behs.filter(b=>b.isRep||/replacement|alternative/i.test(b.type||''));
  const fn=f.fn||null,g=f.goals||{},gr=(g.red||[]).filter(x=>x&&(x.text||x.beh)),ga=(g.acq||[]).filter(x=>x&&(x.text||x.beh));
  const pf=f.profile&&typeof f.profile==='object'?f.profile:null,pl=f.plan&&typeof f.plan==='object'?f.plan:null,cr=f.crisis&&typeof f.crisis==='object'?f.crisis:null;
  const rsp=pl&&pl.respond&&typeof pl.respond==='object'?pl.respond:{},arr=v=>Array.isArray(v)?v.map(str).filter(Boolean):[];
  const menu=(f.menu||[]).slice().sort((a,b)=>(a.rank==null?99:a.rank)-(b.rank==null?99:b.rank)).filter(m=>m&&m.name);
  const who=String(S.meta.pname||'').trim()||'[your name and role]',aud=String(S.meta.aud||'').trim()||'a receiving team';
  const segName=k=>(SEGS.find(s=>s[0]===k)||[k,k])[1],on=k=>keys.includes(k);
  if(on('overview')){
    add(segName('overview'),{say:'This training walks '+aud+' through '+Np+' Functional Behavior Assessment and Behavior Intervention Plan. It is presented by '+who+'.',title:'Presenter',body:[String(S.meta.pname||'').trim()||'[your name]'].concat(String(S.meta.plines||'').split('\n').map(s=>s.trim()).filter(Boolean)).join('\n'),lay:'side'});
    add(segName('overview'),{say:'Everything that follows is meant for someone meeting '+N+' for the first time. It moves from the assessment, to the plan, to what you will do each day.',title:'Covering',
      body:bullets(keys.filter(k=>k!=='overview').map(segName))});}
  if(on('profile')){const st=pf?items(pf.strengths).slice(0,6):[],it=pf?items(pf.interests).slice(0,5):[];
    add(segName('profile'),{say:'A behavior plan only makes sense in the context of the whole learner, including what '+N+' does well and enjoys. '+(st.length?sent('The team names these strengths: '+andList(st.map(lc1))):'[What '+N+' does well.]')+' '+(it.length?cap1(sent(N+' enjoys '+andList(it.map(lc1)))):'[What '+N+' enjoys.]'),
      title:'Strengths',body:st.length||it.length?bullets(st.slice(0,4).map(x=>short(cap1(x),40)).concat(it.length?['Enjoys '+short(andList(it.slice(0,3).map(lc1)),40)]:[])):'• [a strength]\n• [a strength]\n• [an interest]'});
    const cm=pf?[[pf.expr,'Expressive communication: ','Says: '],[pf.recep,'Receptive communication: ','Understands: '],[pf.signals,'Know '+Np+' signals. ','Signals: '],[pf.helps,'What helps: ','Helps: '],[pf.avoid,'What to avoid: ','Avoid: '],[pf.at,'Assistive technology: ','Uses: ']].filter(x=>str(x[0])):[];
    add(segName('profile'),{say:cm.length?'How '+N+' communicates, and what every adult does to support it. '+cm.map(x=>sent(x[1]+str(x[0]))).join(' '):'[How '+N+' communicates, and what every adult should do to support it.]',
      title:'Communication',body:cm.length?cm.slice(0,5).map(x=>x[2]+lc1(short(x[0],40))).join('\n'):'[what every adult does]'});}
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
    add(segName('reinforce'),{say:(menu.length?'These are the items and activities '+N+' works for, from the preference assessment, the most preferred first. ':'')+(pl&&(str(pl.rep)||arr(pl.teach).length||arr(pl.sched).length||str(pl.prompted))?[str(pl.rep)?sent('The replacement behavior is: '+str(pl.rep))+' Honor it every time.':'',arr(pl.teach).length?sent('It is taught with '+andList(arr(pl.teach).map(lc1))):'',arr(pl.sched).length?sent('The reinforcement schedule: '+andList(arr(pl.sched).map(lc1))):'',str(pl.prompted)?sent('Prompted and unprompted responses: '+str(pl.prompted)):''].filter(Boolean).join(' '):'[How reinforcement is delivered: what earns it, how often, and for how long.]'),
      title:menu.length?'Works For':'Reinforcement',body:menu.length?bullets(menu.slice(0,6).map(m=>m.name)):'• [what earns it]\n• [how often]'});}
  if(on('proactive')){const an=pl?arr(pl.ant):[],ac=pl?arr(pl.antCards):[];
    add(segName('proactive'),{say:'Proactive strategies prevent the behavior, or make it less likely, by changing what happens before it. '+(an.length||ac.length?(an.length?'Every adult working with '+N+' does these things. '+an.map(sent).join(' '):'')+(ac.length?' '+sent('The plan also uses '+andList(ac.map(lc1))):''):'[The strategies every adult uses with '+N+'.]'),
      title:'Proactive',body:an.length||ac.length?bullets(an.map(x=>cap1(short(x,50))).concat(ac.map(x=>short(x,50))).slice(0,6)):'• [a strategy]\n• [a strategy]'});}
  if(on('response')){const sp=[[rsp.prec,'At the first sign'+(pl&&str(pl.prec)?' ('+lc1(str(pl.prec).replace(/[.]+$/,''))+')':'')+': ','First sign: '],[rsp.target,'If the behavior occurs: ','If it occurs: '],[rsp.after,'Afterwards: ','After: '],[rsp.not,'What staff do not do: ','Do not: ']].filter(x=>str(x[0]));
    add(segName('response'),{say:'A response plan says what staff do after the behavior begins. It is a safety and de-escalation sequence, followed in order. '+(sp.length?sp.map(x=>sent(x[1]+str(x[0]))).join(' '):'[The steps.]'),
      title:'Steps',body:sp.length?sp.map((x,j)=>(j+1)+'. '+x[2]+lc1(short(x[0],46))).join('\n'):'1. [first step]\n2. [next step]\n3. [next step]',lay:'full'});
    const stg=cr&&Array.isArray(cr.stages)?cr.stages.filter(x=>x&&str(x.s)&&str(x.do)).slice(0,6):[];
    if(stg.length)add(segName('response'),{say:'When the behavior becomes dangerous, the crisis plan takes over, one stage at a time. '+stg.map((x,j)=>'Stage '+nw(j+1)+', '+lc1(str(x.s).replace(/[.:]+$/,''))+'. '+cap1(sent(str(x.do)))).join(' '),
      title:'Safety',body:stg.map((x,j)=>(j+1)+'. '+short(str(x.s),26)+': '+lc1(short(x.do,40))).join('\n'),lay:'full'});
    else if(str(rsp.crisis))add(segName('response'),{say:sent('In a crisis: '+str(rsp.crisis)),title:'Safety',body:short(str(rsp.crisis),120),lay:'full'});}
  if(on('takeaways')){const an=pl?arr(pl.ant):[],tk=[pl&&str(pl.rep)?['First, the replacement behavior: '+str(pl.rep)+'. Honor it every time.','Honor the replacement: '+lc1(short(str(pl.rep),34))]:null,str(rsp.not)?['Second, what never to do: '+lc1(str(rsp.not)),'Never: '+lc1(short(rsp.not,44))]:null,an.length?['And every day, before anything happens: '+lc1(an[0]),cap1(short(an[0],50))]:null].filter(Boolean);
    add(segName('takeaways'),{say:tk.length?(tk.length>1?nw(tk.length)[0].toUpperCase()+nw(tk.length).slice(1)+' things matter most. ':'One thing matters most. ')+tk.map(x=>sent(x[0])).join(' '):'[The two or three things every adult should remember about '+N+'.]',
      title:'Remember',body:tk.length?bullets(tk.map(x=>x[1])):'• [the first thing]\n• [the second thing]',lay:'full'});}
  if(on('terms'))add(segName('terms'),{say:'[Terms specific to '+Np+' plan and to this building, so new staff do not have to guess what they mean.]',title:'Terms',body:'• [term]: [what it means]'});
  /* the chapters of the bar: typed on Setup, or (none yet) one for each part drafted, set on its first row */
  if(!String(S.meta.chapters||'').trim()){const g=[];keys.forEach(k=>{if(!g.includes(GROUP[k]))g.push(GROUP[k]);});S.meta.chapters=g.join('\n');}
  const have=String(S.meta.chapters).split('\n').map(x=>x.trim());let lastG='';out.forEach(r=>{const k=(SEGS.find(x=>x[1]===r.seg)||[''])[0],gname=GROUP[k];if(gname&&gname!==lastG&&have.includes(gname)){r.ch=gname;lastG=gname;}});
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
.gx.flat .gx-card,.gx.flat .gx-band{box-shadow:none}
.gx .gx-todo{background:rgba(232,163,61,.28);border-radius:6px;padding:0 .15em}
.gx-ph{position:absolute;inset:0;background:linear-gradient(135deg,#5a6b78,#2c3a45)}
.gx-ph:after{content:"";position:absolute;width:420px;height:560px;bottom:0;border-radius:210px 210px 0 0;background:rgba(255,255,255,.16)}
.gx-ph.l:after{left:330px}.gx-ph.r:after{right:330px}
.gx.pnl{color:#fff}
.gx.pnl .gx-ph{background:linear-gradient(180deg,#fdfdfb,#ecebe6)}
.gx.pnl .gx-ph:after{background:rgba(84,58,140,.30)}
.gx.pnl .pn{position:absolute;left:16px;top:24px;width:946px;height:897px;background:linear-gradient(180deg,var(--p0) 0,var(--c1) 250px,var(--c1) 100%);border-top-right-radius:58px;overflow:hidden}
.gx.pnl.right .pn{left:auto;right:16px;border-top-right-radius:0;border-top-left-radius:58px}
.gx.pnl.full .pn{width:1888px}
.gx.pnl .pn-t{position:absolute;left:52px;right:44px;top:40px;height:124px;line-height:124px;font-weight:900;font-size:92px;text-transform:uppercase;white-space:nowrap;overflow:hidden;letter-spacing:-.012em;text-shadow:0 4px 9px rgba(0,0,0,.55)}
.gx.pnl .pn-rule{position:absolute;left:22px;top:170px;width:370px;height:3px;background:linear-gradient(90deg,#93abc1,rgba(147,171,193,0))}
.gx.pnl .pn-in{position:absolute;left:51px;right:44px;top:214px;bottom:34px;overflow:hidden;font-weight:700;font-size:30px;line-height:1.21;padding:0;display:block}
.gx.pnl.hp .pn-in{display:flex;flex-direction:column}
.gx.pnl .pn-tx{flex:none}
.gx.pnl.split.hp .pn-in{flex-direction:row}.gx.pnl.split .pn-tx{flex:0 0 44%;min-width:0}
.gx.pnl .pn-in p{margin:0 0 .73em}
.gx.pnl .pn-h{color:var(--c2);font-weight:700;font-size:1.42em;line-height:1.2;margin:.1em 0 .5em}
.gx.pnl .pn-l{margin-left:1.1em;font-size:1.36em;line-height:1.24}
.gx.pnl .pn-l>div{margin:0 0 var(--lg,1.15em)}.gx.pnl .pn-l>div:last-child{margin-bottom:0}
.gx.pnl .pn-l .b{padding-left:.62em;text-indent:-.62em}
.gx.pnl .pn-pics{flex:1 1 0;min-height:46%;margin-top:.5em;display:flex;gap:26px}.gx.pnl.split .pn-pics{min-height:0;margin:0 0 0 28px}
.gx.pnl .pn-pic{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:12px}
.gx.pnl .pn-pic .im{flex:1 1 auto;min-height:0;border-radius:12px;overflow:hidden;background:#fff;padding:10px;box-sizing:border-box}
.gx.pnl .pn-pic img{width:100%;height:100%;object-fit:contain;display:block}
.gx.pnl .pn-pic .cap{font-weight:700;font-size:.9em;text-align:center;line-height:1.15}
.gx.pnl.lower .pn{top:760px;height:161px;border-top-right-radius:44px}
.gx.pnl.right.lower .pn{border-top-right-radius:0;border-top-left-radius:44px}
.gx.pnl.lower .pn-t{top:14px;height:80px;line-height:80px;font-size:58px}
.gx.pnl.lower .pn-h,.gx.pnl.title .pn-h{position:absolute;left:52px;right:44px;white-space:nowrap;overflow:hidden;margin:0}
.gx.pnl.lower .pn-h{top:94px;font-size:34px}
.gx.pnl.title .pn-t{top:300px;height:150px;line-height:150px;font-size:112px}
.gx.pnl.title .pn-rule{top:468px;left:52px;width:520px;height:4px}
.gx.pnl.title .pn-h{top:498px;font-size:50px}
.gx.pnl .pn-band{position:absolute;left:20px;width:948px;top:925px;height:62px;box-sizing:border-box;padding:0 33px;display:flex;align-items:center;background:linear-gradient(90deg,var(--c3a),var(--c3));color:var(--c1);font-weight:900;font-size:30px;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.gx.pnl.right .pn-band{left:auto;right:20px}
.gx.pnl .pn-logo{position:absolute;left:26px;top:992px;width:340px;height:76px;background:no-repeat left center/contain}
.gx.pnl.right .pn-logo{left:auto;right:26px;background-position:right center}
.gx.pnl .pn-tag{position:absolute;left:380px;width:588px;top:994px;height:72px;box-sizing:border-box;padding:0 22px;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,var(--tg0),var(--tg1));font-weight:900;font-size:27px;text-transform:uppercase;white-space:nowrap;overflow:hidden;letter-spacing:.01em}
.gx.pnl.right .pn-tag{left:952px}
.gx.pnl .gx-todo{background:rgba(203,185,138,.35)}
/* the Chapters look's own proportions (the newer template): the panel 1131 wide and nearly the full height, larger type */
.gx.pnl.v2 .pn{top:12px;width:1131px;height:895px}
.gx.pnl.v2.full .pn{width:1888px}
.gx.pnl.v2 .pn-t{left:62px;top:34px;height:136px;line-height:136px}
.gx.pnl.v2 .pn-in{left:46px;right:44px;top:200px}
.gx.pnl.v2 .pn-t,.gx.pnl.v2 .pn-h{color:var(--c2)}
.gx.pnl.v2 .pn-h{text-shadow:0 3px 4px rgba(0,0,0,.6)}
.gx.pnl.v2 .pn-l{font-size:1em;margin-left:.55em}
.gx.pnl.v2 .pn-l .b{padding-left:.75em;text-indent:-.75em}
.gx.pnl.v2 .pn-rule{top:176px;left:30px;width:900px;background:linear-gradient(90deg,#fff 0,rgba(255,255,255,.6) 55%,rgba(255,255,255,0))}
.gx.pnl.v2 .pn-in{bottom:56px}
.gx.pnl.v2 .pn-bar{position:absolute;left:4px;right:4px;bottom:4px;height:38px;display:flex;gap:9px}
.gx.pnl.v2 .pn-bar>div{flex:1 1 0;min-width:0;background:var(--c4);color:#fff;font-family:'TV Merri',Georgia,serif;font-weight:900;font-size:22px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;text-shadow:0 1px 2px rgba(0,0,0,.35);opacity:.82}
.gx.pnl.v2 .pn-bar>div.on{background:var(--c2);color:var(--c1);opacity:1;text-shadow:none;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18)}
.gx.pnl .pn-tick{position:absolute;left:16px;width:1131px;top:911px;height:63px;background:var(--c3);overflow:hidden;display:flex;align-items:center}
.gx.pnl.right .pn-tick{left:auto;right:16px}
.gx.pnl.v2 .pn-logo{top:984px;height:76px}
.gx.pnl .pn-tick .tk-in{display:flex;flex:none;white-space:nowrap;font-family:'TV Merri',Georgia,serif;font-weight:900;font-size:43px;line-height:1.2;color:#111;text-shadow:0 3px 3px rgba(0,0,0,.32)}
.gx.pnl .pn-tick .tk-in span{padding:0 .3em 0 .45em}.gx.pnl .pn-tick .tk-in span:after{content:"\\2022";padding-left:.75em;color:var(--c1)}
@keyframes tvtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.gx.live .pn-tick .tk-in{animation-name:tvtick;animation-timing-function:linear;animation-iteration-count:infinite}
/* a list shown one point at a time (v21.51): the points still to come keep their place, unseen */
.gx [data-rv]{transition:opacity .4s ease,transform .4s ease}
.gx .rv-hid{opacity:0;transform:translateY(12px)}`;
/* Lato Bold and Black (tools/vendor/lato, SIL Open Font License), put in by build.sh as @font-face rules with data URLs */
const LATO_CSS='/*@@LATO@@*/';
const GFX_ALL=LATO_CSS+'\n'+GFX_CSS;
/* the cards' own rules (a card is opaque, and on a key background it has no shadow: a see-through card or a shadow on the
   green or black is keyed out in part, a tinted, muddy edge), in this page too (the graphics window writes them into its own) */
(()=>{const st=document.createElement('style');st.id='tv-gfx';st.textContent=GFX_ALL;document.head.appendChild(st);const lg=document.createElement('style');lg.id='tv-logo';document.head.appendChild(lg);
  /* the cards are measured to fit: again once Lato is ready */
  try{document.fonts.load("900 40px 'TV Lato'").then(()=>{renderThumbs();if(document.body.classList.contains('view-graphics'))gxRender();},()=>{});}catch(e){}})();
/* a card's text: one line a point; "• " or "- " a bullet, "1. " a numbered step; words in [brackets] marked as still to write */
function mark(s){return esc(s).replace(/\[([^\]]+)\]/g,'<span class="gx-todo">[$1]</span>');}
/* rv: the points shown of a list that builds (the rest hidden in their places); null: all */
const rvA=(j,rv)=>rv==null?'':' data-rv="'+j+'"'+(j>=rv?' class="rv-hid"':'');
function bodyHtml(t,rv){const L=String(t||'').split('\n').map(s=>s.trim()).filter(Boolean);if(!L.length)return '';
  const isB=s=>/^[•\-*–]\s*/.test(s),isN=s=>/^\d+[.)]\s+/.test(s);
  if(L.every(isN))return '<ol>'+L.map((s,j)=>'<li'+rvA(j,rv)+'>'+mark(s.replace(/^\d+[.)]\s+/,''))+'</li>').join('')+'</ol>';
  if(L.length>1||L.some(isB))return '<ul>'+L.map((s,j)=>'<li'+rvA(j,rv)+'>'+mark(s.replace(/^[•\-*–]\s*/,''))+'</li>').join('')+'</ul>';
  return '<p'+rvA(0,rv)+'>'+mark(L[0])+'</p>';}
function layOf(r){if(r.lay!=='auto')return r.lay;const np=r.pics.filter(p=>p.ph).length;if(np>=2)return 'pic2';if(np===1)return 'pic1';
  const L=String(r.body||'').split('\n').filter(s=>s.trim()).length;if(!r.title&&!L)return 'none';return L>7||String(r.body||'').length>420?'full':'side';}
/* a colour is a #hex or the default: a value from a file goes into a style attribute */
const hex=(v,d)=>/^#[0-9a-f]{3,8}$/i.test(String(v||''))?String(v):d;
const mixc=(a,b,t)=>{const p=h=>{h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.substr(i,2),16)||0);};const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
function vars(){const m=S.meta,dark=m.cardbg==='dark',c1=hex(m.c1,'#0f1b41'),c2=hex(m.c2,'#cbb98a'),c3=hex(m.c3,'#a9cdc7'),c4=hex(m.c4,'#8b91bb');return '--c1:'+c1+';--c2:'+c2+';--cb:'+(dark?c1:'#ffffff')+';--ct:'+(dark?'#fff':'#1d2730')+';--tc:'+(dark?'#fff':c1)+';--c3:'+c3+';--c4:'+c4+';--c3a:'+mixc(c3,'#ffffff',.12)+';--p0:'+mixc(c1,'#05060d',.62)+';--tg0:'+mixc(c1,'#000000',.82)+';--tg1:'+mixc(c1,'#16404f',.72)+';--gf:'+(m.font==='serif'?"Georgia,'Times New Roman',serif":m.font==='sans'?"Inter,'Helvetica Neue',Helvetica,Arial,sans-serif":"'TV Lato',Lato,'Avenir Next','Helvetica Neue',Arial,sans-serif");}
/* chapters (the Chapters look's bar): the list typed on Setup, a row in the chapter set on it or on the nearest row above; with
   no list typed, the segments are the chapters */
function chList(){const L=String(S.meta.chapters||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,10);if(L.length)return {list:L,own:true};
  const u=[];S.rows.forEach(r=>{if(r.seg&&!u.includes(r.seg))u.push(r.seg);});return {list:u.slice(0,10),own:false};}
function chOf(r){const C=chList();if(!C.list.length)return -1;if(!C.own)return C.list.indexOf(r.seg);let i=S.rows.indexOf(r);if(i<0)return C.list.indexOf(r.ch)>=0?C.list.indexOf(r.ch):0;
  for(;i>=0;i--){const k=C.list.indexOf(S.rows[i].ch);if(k>=0)return k;}return 0;}
/* the Panel look (v21.50), as the Flowics template of the practice's training videos: a navy panel on one half, the segment its
   title (A), the paragraphs (B), the heading in gold (C) and the list (D), the pictures in its lower half (E and F their
   captions); under it the series band, the logo and the tag. In the graphics window the panel stays as the cards change and
   only its words fade out and in. */
function logoSrc(){const L=photo('logo');if(L)return L.img;const im=document.querySelector('img[data-nbh-logo]');return im&&/^data:image\//.test(im.src)?im.src:'';}
function logoCss(){const u=logoSrc();return u?'.gx.pnl .pn-logo{background-image:url("'+u+'")}':'';}
function paintLogo(){const st=$('#tv-logo');if(st){const c=logoCss();if(st.textContent!==c)st.textContent=c;}}
function tagText(){const t=String(S.meta.tag||'').trim();if(t)return t;const c=String(S.meta.client||'').replace(/^SIMULATED\s*[–-]\s*/,'').trim().split(/\s+/).filter(Boolean);
  const f=String(S.meta.first||'').trim()||c[0]||'',l=c.length>1?c[c.length-1][0].toUpperCase()+'.':'';return 'FBA & BIP Video Training'+(f?': '+f+(l?' '+l:''):'');}
function paraHtml(t){return unmark(t).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>'<p>'+mark(x)+'</p>').join('');}
function listHtml(t,rv){const cl=(j,c)=>rv==null?(c?' class="'+c+'"':''):' data-rv="'+j+'" class="'+(c?c+' ':'')+(j>=rv?'rv-hid':'')+'"';
  return String(t||'').split('\n').map(x=>x.trim()).filter(Boolean).map((x,j)=>/^[•\-*–]\s*/.test(x)?'<div'+cl(j,'b')+'>•&nbsp;'+mark(x.replace(/^[•\-*–]\s*/,''))+'</div>':/^\d+[.)]\s+/.test(x)?'<div'+cl(j,'b')+'>'+mark(x)+'</div>':'<div'+cl(j,'')+'>'+mark(x)+'</div>').join('');}
function panelHtml(r,opt){const v2=S.meta.look==='chapters',side=S.meta.side==='right'?'right':'left',pics=r.pics.filter(p=>p.ph&&photo(p.ph)),np=pics.length;
  const l0=r.lay!=='auto'?r.lay:np>=2?'pic2':np===1?'pic1':(!r.seg&&!r.title&&!String(r.say||'').trim()&&!String(r.body||'').trim()?'none':'side');
  let lay=/^(pic1|pic2|side)$/.test(l0)?'side':l0;const hp=(lay==='side'||lay==='split')&&np?(l0==='pic1'||lay==='split'?1:Math.min(2,np)):0;
  const ph=opt.presenter?'<div class="gx-ph '+(side==='right'?'l':'r')+'"></div>':'',k=(v2?'v2-':'')+lay+'-'+side+'-'+hp;
  const cls='gx pnl '+lay+' '+side+(v2?' v2':'')+(hp?' hp':'')+(opt.flat?' flat':'')+(opt.live?' live':'');
  if(lay==='none')return '<div class="'+cls+'" data-k="'+k+'" style="'+vars()+'">'+ph+'</div>';
  const at=S.rows.indexOf(r),say=r.cont&&at>0?S.rows[paraOf(at)].say:r.say,first=String(r.body||'').split('\n').map(x=>x.trim().replace(/^[•\-*–]\s*/,'')).filter(Boolean)[0]||'';let inner;
  if(lay==='lower')inner='<div class="pn-t gx-tx gx-fitw" data-fs="58" data-min="28">'+mark(r.title||r.seg||'')+'</div>'+(first?'<div class="pn-h gx-tx gx-fitw" data-fs="34" data-min="18">'+mark(first)+'</div>':'');
  else if(lay==='title')inner='<div class="pn-t gx-tx gx-fitw" data-fs="112" data-min="44">'+mark(r.seg||r.title||'')+'</div><div class="pn-rule"></div>'+(r.title&&r.title!==r.seg?'<div class="pn-h gx-tx gx-fitw" data-fs="50" data-min="24">'+mark(r.title)+'</div>':'');
  else{const tx='<div class="pn-tx">'+paraHtml(say)+(r.title?'<div class="pn-h">'+mark(r.title)+'</div>':'')+(String(r.body||'').trim()?'<div class="pn-l">'+listHtml(r.body,r.build?opt.rv:null)+'</div>':'')+'</div>';
    const pp=hp?'<div class="pn-pics">'+pics.slice(0,hp).map(p=>'<div class="pn-pic"><div class="im"><img src="'+photo(p.ph).img+'" alt=""></div>'+(p.cap?'<div class="cap">'+mark(p.cap)+'</div>':'')+'</div>').join('')+'</div>':'';
    inner='<div class="pn-t gx-tx gx-fitw" data-fs="'+(v2?102:92)+'" data-min="40">'+mark(r.seg||'')+'</div><div class="pn-rule"></div><div class="gx-in pn-in gx-tx gx-fit" data-fs="'+(v2?33:30)+'" data-min="13" data-gap="'+(v2?'1':'1.15')+'">'+tx+pp+'</div>';}
  /* the Chapters look: the chapter bar along the panel's foot, the chapter of this card lit */
  if(v2){const C=chList(),cur=chOf(r);if(C.list.length>1)inner+='<div class="pn-bar">'+C.list.map((c,j)=>'<div class="gx-fitw'+(j===cur?' on':'')+'" data-fs="22" data-min="10">'+esc(c)+'</div>').join('')+'</div>';}
  const ser=String(S.meta.series||'').trim(),tg=v2?String(S.meta.tag||'').trim():tagText();let band='';
  if(ser&&v2){band='<div class="pn-tick"><div class="tk-in" data-spd="'+tkSpd()+'" style="'+tkStyle()+'">'+Array(6).fill('<span>'+esc(ser)+'</span>').join('')+'</div></div>';}
  else if(ser)band='<div class="pn-band gx-fitw" data-fs="30" data-min="14"><span>'+esc(ser)+'</span></div>';
  return '<div class="'+cls+'" data-k="'+k+'" style="'+vars()+'">'+ph+'<div class="pn">'+inner+'</div>'+band+
    (logoSrc()?'<div class="pn-logo"></div>':'')+(tg?'<div class="pn-tag gx-fitw" data-fs="27" data-min="14"><span>'+esc(tg)+'</span></div>':'')+'</div>';}
function cardHtml(r,opt){opt=opt||{};if(!r)return '<div class="gx" style="'+vars()+'"></div>';if(S.meta.look!=='cards')return panelHtml(r,opt);const lay=layOf(r),side=S.meta.side==='left'?'left':'right',dark=S.meta.cardbg==='dark';
  const ph=opt.presenter?'<div class="gx-ph '+(side==='right'?'l':'r')+'"></div>':'';const seg=esc(r.seg||'');const cls='gx '+lay+' '+side+(dark?' dark':'')+(opt.flat?' flat':'');
  if(lay==='none')return '<div class="'+cls+'" style="'+vars()+'">'+ph+'</div>';
  if(lay==='title')return '<div class="'+cls+'" style="'+vars()+'">'+ph+'<div class="gx-band"><div class="gx-k">'+seg+'</div><div class="gx-title gx-fit" data-fs="96" data-min="44">'+mark(r.title||r.seg||'')+'</div></div></div>';
  const pics=r.pics.filter(p=>p.ph&&photo(p.ph));
  let inner='<div class="gx-title gx-fit" data-fs="'+(lay==='lower'?60:lay==='full'?76:70)+'" data-min="30">'+mark(r.title||'')+'</div>';
  if(lay==='pic1'||lay==='pic2'){const use=lay==='pic1'?pics.slice(0,1):pics.slice(0,2);
    inner+='<div class="gx-pics">'+(use.length?use:[{ph:'',cap:''}]).map(p=>{const P=photo(p.ph);return '<div class="gx-pic"><div class="im">'+(P?'<img src="'+P.img+'" alt="">':'')+'</div>'+(p.cap?'<div class="cap">'+mark(p.cap)+'</div>':'')+'</div>';}).join('')+'</div>';
    if(lay==='pic1'&&String(r.body||'').trim())inner+='<div class="gx-body gx-fit" data-fs="30" data-min="20" style="flex:0 0 auto;margin-top:14px">'+bodyHtml(r.body,r.build?opt.rv:null)+'</div>';}
  else{const L=String(r.body||'').split('\n').filter(s=>s.trim()).length;inner+='<div class="gx-body gx-fit'+(lay==='full'&&L>6?' cols':'')+'" data-fs="'+(lay==='lower'?38:lay==='full'?46:46)+'" data-min="20">'+bodyHtml(lay==='lower'?String(r.body||'').split('\n').filter(s=>s.trim()).slice(0,2).join('\n'):r.body,r.build?opt.rv:null)+'</div>';}
  return '<div class="'+cls+'" style="'+vars()+'">'+ph+'<div class="gx-card"><div class="gx-seg">'+seg+'</div><div class="gx-in">'+inner+'</div></div></div>';}
/* each text box shrinks until its card holds it (from its data-fs to its data-min, in px of the 1920 stage) */
function fitGx(root){(root||document).querySelectorAll('.gx').forEach(g=>{
  g.querySelectorAll('.gx-fitw').forEach(e=>{let f=+e.dataset.fs||40,n=0;const mn=+e.dataset.min||14;e.style.fontSize=f+'px';while(e.scrollWidth>e.clientWidth+1&&f>mn&&n++<90){f-=1;e.style.fontSize=f+'px';}});
  const card=g.querySelector('.gx-card,.gx-band,.pn');if(!card)return;
  const fits=[...g.querySelectorAll('.gx-fit')];fits.forEach(e=>{e.style.fontSize=e.dataset.fs+'px';});
  const over=()=>{const inn=g.querySelector('.gx-in');if(inn)return inn.scrollHeight>inn.clientHeight+1||[...inn.children].some(c=>c.scrollHeight>c.clientHeight+2&&c.classList.contains('gx-body'));return card.scrollHeight>card.clientHeight+1;};
  fits.forEach(e=>{if(e.dataset.gap){let gp=+e.dataset.gap;e.style.setProperty('--lg',gp+'em');while(over()&&gp>.36){gp=Math.round((gp-.1)*100)/100;e.style.setProperty('--lg',gp+'em');}}});
  let guard=0;while(over()&&guard++<60){let moved=false;fits.forEach(e=>{const f=parseFloat(e.style.fontSize),mn=+e.dataset.min||20;if(f>mn){e.style.fontSize=(f-2)+'px';moved=true;}});if(!moved)break;}});}
/* a stage drawn at 1920 x 1080 and scaled into a box of width w */
function stageHtml(r,w,opt){const k=w/1920;return '<div class="gx-box" style="width:'+w+'px;height:'+Math.round(1080*k)+'px"><div class="gx-sc" style="transform:scale('+k.toFixed(5)+')">'+cardHtml(r,opt)+'</div></div>';}

/* ---------------- the graphics window: the cards on their own, for a second display and the Yolobox ---------------- */
let GW=null,gwAt=-1;
const GBG={green:'#00b140',blue:'#0047bb',black:'#000000',white:'#ffffff',none:'#3d4a55'};
/* the ticker's speed, in pixels a second of the 1920 stage (0: still) */
/* the ticker's text: its size (px of the 1920 stage; the band is 63 high), its type and its colour */
const TKF={merri:"'TV Merri',Georgia,serif",lato:"'TV Lato',Lato,'Avenir Next',Arial,sans-serif",georgia:"Georgia,'Times New Roman',serif"};
const tkSize=()=>{const n=num(S.meta.tksize);return n==null?43:Math.max(24,Math.min(48,n));};
function tkStyle(){return 'font-size:'+tkSize()+'px;font-family:'+(TKF[S.meta.tkfont]||TKF.merri)+';color:'+hex(S.meta.tkcol,'#111111');}
const tkSpd=()=>{const n=num(S.meta.tkspd);return n==null?90:Math.max(0,Math.min(200,n));};
function gwOpen(){if(GW&&!GW.closed){try{GW.focus();}catch(e){}gwShow(curRow());return;}
  GW=window.open('','tv1-graphics','popup,width=960,height=540');if(!GW){nbhUI.toast('The browser did not open the window: allow pop-ups for this site, then try again.',{kind:'warn'});return;}
  const fit=fitGx.toString();
  GW.document.open();GW.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TV-1 graphics</title><style>html,body{margin:0;height:100%;overflow:hidden;background:'+(GBG[S.meta.gbg]||'#00b140')+';cursor:none}'+
    '#st{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}.ly{position:absolute;inset:0;transition:opacity .35s ease}'+GFX_ALL+'<\/style><style id="lc"><\/style><\/head><body><div id="st"><div class="ly" id="la"></div><div class="ly" id="lb" style="opacity:0"></div></div><script>'+fit+
    ';var A=document.getElementById("la"),B=document.getElementById("lb");function size(){var w=innerWidth,h=innerHeight,k=Math.min(w/1920,h/1080),st=document.getElementById("st");st.style.transform="translate("+((w-1920*k)/2)+"px,"+((h-1080*k)/2)+"px) scale("+k+")";}'+
    'addEventListener("resize",size);size();var T=0,LC=document.getElementById("lc");function tick(L){var t=L.querySelectorAll(".tk-in");for(var i=0;i<t.length;i++){var sp=+t[i].getAttribute("data-spd");if(!sp){t[i].style.animationName="none";continue;}var d=Math.max(1,t[i].scrollWidth/2/sp);t[i].style.animationDuration=d+"s";t[i].style.animationDelay=(-((performance.now()/1000)%d))+"s";}}'+
    /* the same layout as the card shown: its words fade out (a quarter second), the panel stays, the new words fade in; another layout crossfades */
    'var RVN=null;function rv(L){if(RVN==null)return;var e=L.querySelectorAll("[data-rv]");for(var i=0;i<e.length;i++)e[i].classList.toggle("rv-hid",+e[i].getAttribute("data-rv")>=RVN);}window.reveal=function(n){RVN=n;rv(A);};'+
    'window.show=function(h,bg,lc){RVN=null;document.body.style.background=bg;if(lc!=null&&LC.textContent!==lc)LC.textContent=lc;clearTimeout(T);var m=/data-k="([^"]+)"/.exec(h),c=A.firstChild&&A.firstChild.getAttribute?A.firstChild.getAttribute("data-k"):null;'+
    'if(m&&c&&m[1]===c&&A.style.opacity!=="0"){var o=A.querySelectorAll(".gx-tx");for(var i=0;i<o.length;i++){o[i].style.transition="opacity .25s ease";o[i].style.opacity="0";}'+
    'T=setTimeout(function(){A.style.transition="none";B.style.transition="none";B.innerHTML=h;fitGx(B);tick(B);var n=B.querySelectorAll(".gx-tx");for(var j=0;j<n.length;j++)n[j].style.opacity="0";B.style.opacity="1";A.style.opacity="0";var t=A;A=B;B=t;rv(A);'+
    'requestAnimationFrame(function(){requestAnimationFrame(function(){for(var j=0;j<n.length;j++){n[j].style.transition="opacity .45s ease";n[j].style.opacity="1";}});});},400);}'+
    'else{A.style.transition="opacity .35s ease";B.style.transition="opacity .35s ease";B.innerHTML=h;fitGx(B);tick(B);B.style.opacity="1";A.style.opacity="0";var t=A;A=B;B=t;}'+
    'try{if(!document.fonts.check("900 40px \'TV Lato\'"))document.fonts.load("900 40px \'TV Lato\'").then(function(){fitGx(A);});}catch(e){}};'+
    'document.addEventListener("dblclick",function(){var e=document.documentElement;(e.requestFullscreen||e.webkitRequestFullscreen||function(){}).call(e);});<\/script><\/body><\/html>');GW.document.close();
  gwAt=-1;setTimeout(()=>gwShow(curRow()),80);}
/* rv: the points shown of a list that builds (the teleprompter's card); left out, the teleprompter's own when it is this card */
function gwShow(i,rv){if(!GW||GW.closed||!GW.show)return;const r=S.rows[i];gwAt=i;if(rv===undefined)rv=r&&r.build&&i===TP.i&&document.body.classList.contains('view-prompter')?TP.b:null;
  try{GW.show(cardHtml(r,{presenter:S.meta.gbg==='none',flat:/^(green|blue|black)$/.test(S.meta.gbg),live:true,rv}),GBG[S.meta.gbg]||'#00b140',logoCss());}catch(e){}}
function gwReveal(){if(!GW||GW.closed||!GW.reveal||gwAt!==TP.i)return;try{GW.reveal(TP.b);}catch(e){}}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});
  if(v==='prompter')tpRender();if(v==='graphics')gxRender();if(v==='script')renderThumbs();if(v!=='prompter')tpStop();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- Setup ---------------- */
function renderSetup(){const pk=$('#segPick');if(pk&&!pk.children.length)pk.innerHTML=SEGS.map(([k,l])=>'<label class="ck"><input type="checkbox" data-seg="'+k+'" checked> '+esc(l)+'</label>').join('');
  const f=CASE||{},bits=[];if((f.behaviors||[]).length)bits.push((f.behaviors.length===1?'one target behavior':nw(f.behaviors.length)+' target behaviors')+' (Form '+((f.src&&f.src.behaviors)||'TB-1')+')');
  if(f.fn&&(f.fn.label||f.fn.key))bits.push('the function (Form FS-1)');if(f.goals&&((f.goals.red||[]).length||(f.goals.acq||[]).length))bits.push('the goals (Form GB-1)');if((f.menu||[]).length)bits.push('the reinforcer menu (Form PA-1)');if(f.profile)bits.push('the profile (Form DM-1)');if(f.plan)bits.push('the plan (Form TD-1)');if(f.crisis)bits.push('the crisis plan (Form CR-1)');
  const cl=$('#caseLine');if(cl)cl.textContent=bits.length?'The case holds '+bits.join(', ')+'.':'No case yet: open the case in the workstation (Forms TB-1, FS-1, GB-1, PA-1, and DM-1, TD-1, CR-1) and the draft fills from it; without it, the draft is the outline with prompts to write.';
  const v=$('#setupVerdict'),n=S.rows.length,P=paras(),w=S.rows.reduce((a,r,i)=>a+(r.cont?0:words(spoken(r))),0),td=S.rows.filter(r=>todo(r.say)||todo(r.title)||todo(r.body)).length;
  if(v)v.innerHTML=n?'<div class="verdict '+(td?'v-mid':'v-ok')+'"><b>'+(td?'Still to write:':'Ready.')+'</b> '+(td?td+' row'+(td===1?'':'s')+' with words in [brackets]. ':'')+n+' card'+(n===1?'':'s')+' in '+P.length+' paragraph'+(P.length===1?'':'s')+', about '+mmss(w/wpm()*60)+' at '+wpm()+' words a minute.</div>':
    '<div class="verdict v-mid"><b>No script yet.</b> Draft from the case (below), import a sheet made before, or Load simulator to see a sample.</div>';}

/* ---------------- Script: the rows ---------------- */
function segColor(i){return ['#e8f0f7','#f6efe2','#eef6ee','#f4ecf6','#f8f4e0','#e9f4f4'][i%6];}
function picCell(i,j){const p=S.rows[i].pics[j],P=p.ph&&photo(p.ph);return '<div class="tv-pic"><div class="tv-pv">'+(P?'<img src="'+P.img+'" alt="">':'<span>picture '+(j+1)+'</span>')+'</div><div class="tv-pb"><button type="button" class="tool" data-pic="'+i+':'+j+'">'+(P?'Change':'Add')+'</button>'+(P?'<button type="button" class="tool" data-picx="'+i+':'+j+'">Remove</button>':'')+'</div><input data-i="'+i+'" data-f="cap'+j+'" name="r.'+i+'.cap'+j+'" value="'+esc(p.cap)+'" placeholder="caption" aria-label="Row '+(i+1)+', caption of picture '+(j+1)+'"></div>';}
function chSel(r,i){const C=chList();if(!C.own)return '';return '<label class="tv-ch">Chapter <select data-i="'+i+'" data-f="ch" name="r.'+i+'.ch" aria-label="Chapter of row '+(i+1)+'"><option value="">'+(i?'as above':'the first')+'</option>'+C.list.map(c=>'<option'+(r.ch===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label>';}
function rowHtml(r,i){const segStart=i===0||S.rows[i-1].seg!==r.seg;
  return (segStart?'<div class="tv-seghead" data-segat="'+i+'"><input class="tv-segname" data-segname="'+i+'" value="'+esc(r.seg)+'" aria-label="Segment name" placeholder="Segment"><span class="tv-segsum" data-segsum="'+i+'"></span><button type="button" class="tool" data-addhere="'+i+'">Add a row to this segment</button></div>':'')+
    '<div class="tv-row'+(todo(r.say)||todo(r.title)||todo(r.body)?' todo':'')+'" data-row="'+i+'"><div class="tv-n"><b>'+(i+1)+'</b><span class="mv"><button type="button" data-mv="'+i+':-1" aria-label="Move row '+(i+1)+' up"'+(i?'':' disabled')+'>&#9650;</button><button type="button" data-mv="'+i+':1" aria-label="Move row '+(i+1)+' down"'+(i<S.rows.length-1?'':' disabled')+'>&#9660;</button></span>'+chSel(r,i)+'<button type="button" class="tool" data-dup="'+i+'" aria-label="Copy row '+(i+1)+'">Copy</button><button type="button" class="tool" data-del="'+i+'" aria-label="Remove row '+(i+1)+'">Remove</button></div>'+
    '<div class="tv-say"><label>The paragraphs (column B: on the card, and on the teleprompter)</label><textarea data-i="'+i+'" data-f="say" name="r.'+i+'.say" rows="4"'+(r.cont?' disabled placeholder="(the paragraph above goes on)"':'')+'>'+esc(r.cont?'':r.say)+'</textarea>'+(i?'<label class="ck"><input type="checkbox" data-i="'+i+'" data-f="cont" name="r.'+i+'.cont"'+(r.cont?' checked':'')+'> Same words as above (the card changes)</label>':'')+'<label class="tv-tpl">Teleprompter, when you say more than the card (blank: the paragraphs)</label><textarea class="tv-tp" data-i="'+i+'" data-f="tp" name="r.'+i+'.tp" rows="2" data-nbh-nowording>'+esc(r.tp||'')+'</textarea><span class="tv-w" data-w="'+i+'"></span></div>'+
    '<div class="tv-card"><label>The heading and the list (columns C and D)</label><input data-i="'+i+'" data-f="title" name="r.'+i+'.title" value="'+esc(r.title)+'" placeholder="Heading (C)"><textarea data-i="'+i+'" data-f="body" name="r.'+i+'.body" rows="4" data-nbh-nowording placeholder="The list (D): one line a point; • for a bullet">'+esc(r.body)+'</textarea>'+'<label class="ck tv-build"><input type="checkbox" data-i="'+i+'" data-f="build" name="r.'+i+'.build"'+(r.build?' checked':'')+'> The list one point at a time (the clicker shows the next)</label>'+
      '<div class="tv-lay"><select data-i="'+i+'" data-f="lay" name="r.'+i+'.lay" aria-label="Layout of card '+(i+1)+'">'+LAYS.map(([k,l])=>'<option value="'+k+'"'+(r.lay===k?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select><span class="tv-layis" data-layis="'+i+'"></span></div>'+
      '<div class="tv-pics">'+picCell(i,0)+picCell(i,1)+'</div>'+(r.x[8].trim()&&!r.pics[0].ph?'<p class="hint">The sheet names a picture: '+esc(r.x[8])+'</p>':'')+'</div>'+
    '<div class="tv-thumb" data-thumb="'+i+'"></div></div>';}
function renderRows(){const el=$('#rows');if(!el)return;el.innerHTML=S.rows.length?S.rows.map(rowHtml).join(''):'<p class="hint">No rows yet. Draft from the case (Setup), import a sheet, or Add a row.</p>';
  $$('.tv-seghead',el).forEach((h,k)=>{h.style.background=segColor(k);});renderSums();renderThumbs();}
function renderThumbs(only){$$('[data-thumb]').forEach(t=>{const i=+t.dataset.thumb;if(only!=null&&i!==only)return;t.innerHTML=stageHtml(S.rows[i],240,{presenter:true});fitGx(t);const li=$('[data-layis="'+i+'"]');if(li){const l=layOf(S.rows[i]);li.textContent=S.rows[i].lay==='auto'?'('+((LAYS.find(x=>x[0]===l)||['',''])[1]).toLowerCase()+')':'';}});}
function renderSums(){const W=wpm();$$('[data-w]').forEach(e=>{const i=+e.dataset.w,r=S.rows[i];if(r.cont){e.textContent='';return;}const n=words(spoken(r));e.textContent=n?n+' words, about '+mmss(n/W*60):'';});
  $$('[data-segsum]').forEach(e=>{const i0=+e.dataset.segsum,seg=S.rows[i0].seg;let n=0,w=0;for(let i=i0;i<S.rows.length&&S.rows[i].seg===seg;i++){n++;if(!S.rows[i].cont)w+=words(S.rows[i].say);}e.textContent=n+' card'+(n===1?'':'s')+', about '+mmss(w/W*60);});
  const tot=S.rows.reduce((a,r)=>a+(r.cont?0:words(spoken(r))),0),td=S.rows.filter(r=>todo(r.say)||todo(r.title)||todo(r.body)).length,sm=$('#scriptSum');
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
/* (v21.51) the script on the teleprompter, word by word: each word a span, so the scroll can follow the voice. Its marks,
   in the words said: "//" a pause, *a word* to stress, {a note to yourself}; they show here only, never on a card, in the
   sheet or in the captions. Three ways to scroll: at the speed set, while you speak (the microphone's level only), or
   following your words (speech recognition on the device). Nothing the microphone hears is recorded or sent. */
let TP={i:0,run:false,y:0,ty:null,raf:0,last:0,t0:0,rec:false,tick:0,b:0,lastP:-1,pos:0,man:0};
/* the way the script scrolls now: the one chosen, or while the microphone is asked for nothing, without it the speed set, and
   until the recogniser is ready (or when it cannot be had) the voice's level */
function tpMd(){let m=S.meta.tpmode||'fixed';if(m==='fixed')return m;if(!VO.on)return VO.asking?'hold':'fixed';if(m==='follow'&&(!VO.ready||VO.mode!=='follow'))m='speak';return m;}
const curRow=()=>Math.max(0,Math.min(S.rows.length-1,TP.i));
const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
/* a number as it is said (a year as a year), for matching what is heard */
function n2w(n){if(n<20)return [ONES[n]];if(n<100)return [TENS[Math.floor(n/10)]].concat(n%10?[ONES[n%10]]:[]);if(n<1000)return [ONES[Math.floor(n/100)],'hundred'].concat(n%100?n2w(n%100):[]);
  if((n>=1100&&n<2000)||(n>=2010&&n<2100))return n2w(Math.floor(n/100)).concat(n%100===0?['hundred']:n%100<10?['oh'].concat(n2w(n%100)):n2w(n%100));return n2w(Math.floor(n/1000)).concat(['thousand'],n%1000?n2w(n%1000):[]);}
function normTok(w){const out=[];String(w).toLowerCase().replace(/[’']/g,'').replace(/%/g,' percent ').replace(/&/g,' and ').split(/[^a-z0-9]+/).forEach(p=>{if(!p)return;if(/^\d+$/.test(p)&&p.length<=4)n2w(+p).forEach(x=>out.push(x));else if(/^\d+$/.test(p))p.split('').forEach(d=>out.push(ONES[+d]));else out.push(p);});return out;}
let SW=[],SP=[],SPn=0,SPK=[],PK=[],PW=[],CQ=[],CQE=[];
function tpWordsHtml(text,k){let h='';const re=/(\{[^}]*\})|(\[[^\]]*\])|(\*[^*\n]+\*)|(\n+)|([ \t]+)|([^\s{}\[\]*]+|[{}\[\]*])/g;let m;
  while((m=re.exec(text))){if(m[1])h+='<span class="tp-note">'+esc(m[1].slice(1,-1))+'</span>';else if(m[2])h+=mark(m[2]);else if(m[3])h+='<em class="tp-em">'+tpWordsHtml(m[3].slice(1,-1),k)+'</em>';
    else if(m[4])h+='<br>';else if(m[5])h+=m[5];else{const w=m[6];if(w==='//'){h+='<span class="tp-pause" title="Pause">‖</span>';continue;}if(w==='>>'||w==='»'){h+='<span class="tp-cue" title="The next card here">▶</span>';CQ.push({k,at:SW.length});continue;}const toks=normTok(w),s=SPn++;SPK[s]=k;toks.forEach(t=>SW.push({w:t,s,k}));h+='<span class="tw" data-s="'+s+'">'+esc(w)+'</span>';}}
  return h;}
function tpRender(){const st=$('#tpStrip');if(!st)return;const P=paras();SW=[];SPn=0;SPK=[];CQ=[];
  st.innerHTML=P.length?P.map((p,k)=>{const r0=S.rows[p.start];return '<div class="tp-p" data-p="'+k+'">'+'<div class="tp-cards">'+p.rows.map(i=>'<span class="tp-c" data-ci="'+i+'">'+(i+1)+(S.rows[i].title?' · '+esc(S.rows[i].title):'')+'</span>').join('')+'</div><div class="tp-t">'+tpWordsHtml(spoken(r0)||'',k)+'</div></div>';}).join('')+'<div class="tp-end">End of the script</div>':'<div class="tp-p"><div class="tp-t">No script yet.</div></div>';
  SP=[...st.querySelectorAll('.tw')];CQE=[...st.querySelectorAll('.tp-cue')];PK=[];PW=[];SW.forEach((t,j)=>{if(PK[t.k]==null)PK[t.k]=j;PW[t.k]=(PW[t.k]||0)+1;});TP.pos=Math.min(TP.pos||0,SW.length);
  tpStyle();tpGo(TP.i,true);}
function tpStyle(){const sc=$('#tpScreen');if(!sc)return;sc.style.setProperty('--tps',(num(S.meta.tpsize)||58)+'px');sc.style.setProperty('--tl',Math.max(15,Math.min(60,num(S.meta.tpline)||30))+'%');sc.classList.toggle('mirror',!!S.chk.mirror);
  const v=$('#tpWpmV');if(v)v.textContent=wpm()+' wpm';const md=S.meta.tpmode||'fixed';document.body.classList.toggle('tp-voice',md!=='fixed');const w=$('#tpWpmL');if(w)w.hidden=md==='follow';}
const pEls=()=>$$('#tpStrip .tp-p');
function tpParaAt(y){const P=pEls();let k=0;for(let j=0;j<P.length;j++){if(P[j].offsetTop<=y+2)k=j;else break;}return k;}
/* a card's list shown one point at a time (the row's own setting): how many points it has */
const buildN=r=>r&&r.build?String(r.body||'').split('\n').filter(x=>x.trim()).length:0;
/* the card shown, without moving the script (the scroll or the voice moved it) */
function tpSetCard(i,bv){const n=S.rows.length;if(!n)return;TP.i=Math.max(0,Math.min(n-1,i));TP.b=bv==null?0:Math.max(0,Math.min(buildN(S.rows[TP.i]),bv));const k=paras().findIndex(p=>p.rows.includes(TP.i));TP.lastP=k;
  pEls().forEach((e,j)=>e.classList.toggle('on',j===k));$$('#tpStrip .tp-c').forEach(e=>e.classList.toggle('on',+e.dataset.ci===TP.i));tpInfo();
  if(TP.rec){const r=S.rows[TP.i];S.log.push({i:TP.i,t:+((performance.now()-TP.t0)/1000).toFixed(2),seg:r.seg,title:r.title});syncState();logLine();}
  gwShow(TP.i,buildN(S.rows[TP.i])?TP.b:null);}
function tpInfo(){const n=S.rows.length,r=S.rows[TP.i],bn=buildN(r);$('#tpPos').textContent='Card '+(TP.i+1)+' of '+n+(r&&r.title?': '+r.title:'')+(bn?' · point '+TP.b+' of '+bn:'');
  const nx=S.rows[TP.i+1];$('#tpFoot').textContent=bn&&TP.b<bn?'Next: point '+(TP.b+1)+' of '+bn:nx?'Next: '+(nx.cont?'(same paragraph) ':'')+(nx.title||nx.seg||''):'The last card';}
/* a card chosen (the clicker, the arrows): the script goes to its paragraph */
function tpGo(i,instant,bv){const n=S.rows.length;if(!n)return;const was=TP.i,k0=TP.lastP;tpSetCard(i,bv);const k=TP.lastP;
  const pe=$('#tpStrip .tp-p[data-p="'+k+'"]');if(pe&&(instant||!pe.contains(document.activeElement))){const sameP=k0===k;if(!sameP||instant){TP.y=pe.offsetTop;TP.ty=null;if(PK[k]!=null&&!(TP.pos>=PK[k]&&TP.pos<PK[k]+PW[k]))TP.pos=PK[k];tpApply(!instant);tpReadTo(TP.pos);}}
  if(!instant&&i!==was)TP.man=performance.now();}
function tpApply(smooth){const st=$('#tpStrip');if(!st)return;st.style.transition=smooth?'transform .45s ease':'none';st.style.transform='translateY('+(-TP.y)+'px)';}
/* the clicker: the next point of a card that builds, else the next card (the one before shows its whole list) */
function tpNext(){const r=S.rows[TP.i],bn=buildN(r);if(bn&&TP.b<bn){TP.b++;tpInfo();gwReveal();return;}if(S.rows.length&&TP.i<S.rows.length-1)tpGo(TP.i+1);}
function tpPrev(){if(buildN(S.rows[TP.i])&&TP.b>0){TP.b--;tpInfo();gwReveal();return;}if(TP.i>0)tpGo(TP.i-1,false,buildN(S.rows[TP.i-1]));}
/* 3, 2, 1 before the clock or the scroll starts (Setup: the countdown) */
function countdown(go){if(S.chk.nocd){go();return;}const sc=$('#tpScreen');let o=$('#tpCd');if(!o){o=document.createElement('div');o.id='tpCd';o.className='tp-cd';sc.appendChild(o);}
  cdStop();let n=3;o.hidden=false;o.textContent=n;countdown.on=true;countdown.t=setInterval(()=>{n--;if(n>0){o.textContent=n;return;}cdStop();go();},1000);}
/* the countdown called off (pressed again while it counts) */
function cdStop(){clearInterval(countdown.t);const was=!!countdown.on;countdown.on=false;const o=$('#tpCd');if(o)o.hidden=true;return was;}
function tpToggle(){if(TP.run){tpHalt();return;}if(cdStop())return;countdown(()=>{TP.run=true;const b=$('#tpRun');if(b){b.setAttribute('aria-pressed','true');b.textContent='Stop';}TP.last=performance.now();cancelAnimationFrame(TP.raf);TP.raf=requestAnimationFrame(tpFrame);wake(true);
  const md=S.meta.tpmode||'fixed';if(md!=='fixed')voStart(md);voSay('');});}
function tpHalt(){TP.run=false;const b=$('#tpRun');if(b){b.setAttribute('aria-pressed','false');b.textContent='Scroll';}cancelAnimationFrame(TP.raf);voStop();}
/* the scroll: at the speed set (each paragraph its height over its reading time), while you speak, or to the word heard;
   the cards change as the reading line passes into the next paragraph (or the next part of one), unless only the clicker
   changes them (Setup) */
function tpFrame(now){if(!TP.run)return;const dt=Math.min(.1,(now-TP.last)/1000);TP.last=now;const md=tpMd(),P=pEls();
  if(md==='follow'){if(TP.ty!=null&&Math.abs(TP.ty-TP.y)>.5){TP.y+=(TP.ty-TP.y)*Math.min(1,dt*5);tpApply(false);}}
  else if(md==='fixed'||(md==='speak'&&VO.speaking)){const k=tpParaAt(TP.y),pe=P[k];if(pe){const n=Math.max(1,PW[k]||words(spoken(S.rows[paras()[k].start]))),secs=n/wpm()*60,end=P[P.length-1].offsetTop+P[P.length-1].offsetHeight;TP.y=Math.min(end,TP.y+pe.offsetHeight/secs*dt);tpApply(false);
    if(PK[k]!=null){const f=Math.max(0,Math.min(1,(TP.y-pe.offsetTop)/Math.max(1,pe.offsetHeight))),p=PK[k]+Math.floor(f*(PW[k]||0));if(p>TP.pos){TP.pos=p;tpReadTo(p);}}}}
  tpAutoCard();TP.raf=requestAnimationFrame(tpFrame);}
/* (v21.52) with next-card marks in the script, the marks change the cards: a paragraph comes up on its first card, and each
   mark passed (the word before it said, or, scrolling without the words, its line at the reading line) is one more step (the
   next point of a list that builds, else the next card). With no marks, each paragraph's cards share its words. */
function stepOf(k,n){const p=paras()[k];let i=p.rows[0],b=0;for(let j=0;j<n;j++){if(b<buildN(S.rows[i])){b++;continue;}if(i+1>=S.rows.length)break;i++;b=0;}return {i,b};}
function cuePassed(c,j,fol){return fol?TP.pos>=c.at:!!CQE[j]&&CQE[j].offsetTop<=TP.y;}
function tpAutoCard(){const fol=tpMd()==='follow'&&SW.length;if(CQ.length)CQ.forEach((c,j)=>{const e=CQE[j];if(e)e.classList.toggle('done',cuePassed(c,j,fol));});
  if(S.chk.tpmanual||performance.now()-TP.man<4000)return;const P=paras();let k,f;
  if(fol){const t=SW[Math.max(0,Math.min(SW.length-1,TP.pos-1))];k=t.k;f=PW[k]?(TP.pos-1-PK[k])/PW[k]:0;}
  else{k=tpParaAt(TP.y);const pe=pEls()[k];f=pe?(TP.y-pe.offsetTop)/Math.max(1,pe.offsetHeight):0;}
  const p=P[k];if(!p)return;
  if(CQ.length){let n=0;CQ.forEach((c,j)=>{if(c.k===k&&cuePassed(c,j,fol))n++;});const st=stepOf(k,n);
    if(st.i>TP.i)tpSetCard(st.i,st.b);else if(st.i===TP.i&&st.b>TP.b){TP.b=st.b;tpInfo();gwReveal();}return;}const idx=p.rows[Math.max(0,Math.min(p.rows.length-1,Math.floor(f*p.rows.length)))];if(idx>TP.i||(k!==TP.lastP&&idx!==TP.i&&P.findIndex(q=>q.rows.includes(TP.i))<k))tpSetCard(idx,buildN(S.rows[idx]));}
/* the words read so far, dimmed (the voice modes) */
let RD=0;function tpReadTo(pos){if(!SP.length)return;const s=pos>0&&SW[pos-1]?SW[pos-1].s+1:0;if(s===RD)return;const a=Math.min(s,RD),b=Math.max(s,RD);for(let j=a;j<b&&j<SP.length;j++)SP[j].classList.toggle('rd',j<s);RD=s;}
function tpStop(){if(TP.run)tpHalt();cdStop();wake(false);}
let WL=null;function wake(on){try{if(on&&!WL&&navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>{WL=w;},()=>{});else if(!on&&WL){WL.release().catch(()=>{});WL=null;}}catch(e){}}
function tpClock(){if(!TP.rec)return;$('#tpClock').textContent=mmss((performance.now()-TP.t0)/1000);}
function logLine(){const l=$('#logLine');if(l)l.textContent=S.log.length?S.log.length+' card times kept (the last take)'+(S.wt.length?', and '+S.wt.length+' word times':'')+'.':'';}

/* ---------------- the microphone (the voice modes) ---------------- */
/* its level only, for "While I speak": speaking when the level stands above the room's own (measured as you go) by the
   sensitivity set; the words, for "Follow my words", go to the recogniser on the device. Nothing is kept or sent. */
const VO={asking:false,on:false,ctx:null,stream:null,src:null,proc:null,speaking:false,floor:.004,hang:0,lv:0,mode:'',w:null,ready:false,loading:false,inflight:0,acc:[],accN:0,done:[],cur:[],n:0};
async function voStart(md){VO.mode=md;if(VO.on){if(md==='follow')asrEnsure();return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){voSay('This browser gives the page no microphone: the script scrolls at the speed set.');return;}
  VO.asking=true;try{VO.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});VO.asking=false;}
  catch(e){VO.asking=false;voSay('The microphone was not allowed: the script scrolls at the speed set. (Allow it for this site to scroll with your voice.)');return;}
  if(!TP.run){VO.stream.getTracks().forEach(t=>t.stop());return;}
  const AC=window.AudioContext||window.webkitAudioContext;VO.ctx=new AC();VO.src=VO.ctx.createMediaStreamSource(VO.stream);VO.proc=VO.ctx.createScriptProcessor(2048,1,1);
  const mute=VO.ctx.createGain();mute.gain.value=0;VO.src.connect(VO.proc);VO.proc.connect(mute);mute.connect(VO.ctx.destination);VO.proc.onaudioprocess=e=>voAudio(e.inputBuffer.getChannelData(0));
  try{await VO.ctx.resume();}catch(e){}VO.on=true;VO.floor=.004;VO.done=[];VO.cur=[];VO.inflight=0;if(VO.w&&VO.ready)VO.w.postMessage({t:'reset'});voMeter();if(md==='follow')asrEnsure();}
function voStop(){if(VO.proc)VO.proc.onaudioprocess=null;try{VO.src&&VO.src.disconnect();VO.proc&&VO.proc.disconnect();}catch(e){}if(VO.stream)VO.stream.getTracks().forEach(t=>t.stop());if(VO.ctx)VO.ctx.close().catch(()=>{});
  VO.on=false;VO.stream=VO.ctx=VO.src=VO.proc=null;VO.speaking=false;VO.acc=[];VO.accN=0;voMeter();}
const voSens=()=>{const s=num(S.meta.tpsens);return s==null?50:Math.max(0,Math.min(100,s));};
function voAudio(x){let e=0;for(let j=0;j<x.length;j++)e+=x[j]*x[j];const rms=Math.sqrt(e/x.length),now=performance.now(),k=1.6+(100-voSens())/100*3.2;
  if(rms>Math.max(.002,VO.floor*k)){VO.speaking=true;VO.hang=now+450;}else{if(now>VO.hang)VO.speaking=false;VO.floor=Math.max(.0008,VO.floor*.97+rms*.03);}
  VO.lv=rms;voMeter();
  if(VO.mode==='follow'&&VO.ready){const sr=VO.ctx.sampleRate,f=sr/16000,n=Math.floor(x.length/f),y=new Float32Array(n);for(let j=0;j<n;j++){const a=Math.floor(j*f),b=Math.min(x.length,Math.floor((j+1)*f));let s=0;for(let q=a;q<b;q++)s+=x[q];y[j]=s/Math.max(1,b-a);}
    VO.acc.push(y);VO.accN+=n;if(VO.accN>=1600&&VO.inflight<4){const all=new Float32Array(VO.accN);let o=0;VO.acc.forEach(a=>{all.set(a,o);o+=a.length;});VO.acc=[];VO.accN=0;VO.inflight++;VO.w.postMessage({t:'audio',s:all,n:++VO.n},[all.buffer]);}}}
let voMt=0;function voMeter(now0){const m=$('#tpMic');if(!m)return;const now=performance.now();if(!now0&&now-voMt<100&&VO.on)return;voMt=now;
  m.hidden=!VO.on&&!VO.loading;m.classList.toggle('on',VO.speaking);const d=m.querySelector('i');if(d)d.style.transform='scale('+(1+Math.min(1.5,VO.lv*40)).toFixed(2)+')';
  const t=m.querySelector('span');if(t&&!VO.loading)t.textContent=VO.mode==='follow'?(VO.ready?'Following your words':'Starting the recogniser…'):VO.speaking?'Speaking':'Listening';}
function voSay(t){const l=$('#tpVoice');if(l){l.textContent=t;l.hidden=!t;}}

/* ---------------- the recogniser, on the device (Follow my words) ---------------- */
/* sherpa-onnx (Apache License 2.0) with a small English model, in nbh-asr/ beside the forms: 57 MB, downloaded once when
   first chosen, each part checked against its SHA-256, kept on the device (Cache Storage), and run in a worker */
const ASR_CACHE='tv1-voice-model';
async function sha(b){const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function asrFiles(prog){const base='nbh-asr/',man=await (await fetch(base+'manifest.json',{cache:'no-cache'})).json(),cache=await caches.open(ASR_CACHE),all=new Uint8Array(man.size);let o=0;
  for(const p of man.parts){let b=null;try{const r=await cache.match(base+p.name);if(r){b=await r.arrayBuffer();if(b.byteLength!==p.size||await sha(b)!==p.sha256)b=null;}}catch(e){b=null;}
    if(!b){const res=await fetch(base+p.name,{cache:'no-store'});if(!res.ok)throw new Error('part '+p.name+': '+res.status);b=await res.arrayBuffer();if(b.byteLength!==p.size||await sha(b)!==p.sha256)throw new Error('part '+p.name+' did not arrive whole');try{await cache.put(base+p.name,new Response(b.slice(0)));}catch(e){}}
    all.set(new Uint8Array(b),o);o+=b.byteLength;prog(o/man.size);}
  return {wasm:all.slice(man.wasm[0],man.wasm[1]).buffer,data:all.slice(man.data[0],man.data[1]).buffer};}
async function asrHave(){try{const c=await caches.open(ASR_CACHE);return (await c.keys()).length>0;}catch(e){return false;}}
async function asrEnsure(){if(VO.ready||VO.loading){if(VO.ready)VO.mode='follow';return;}
  if(location.protocol==='file:'||!window.caches||!window.crypto||!crypto.subtle){voSay('Follow my words needs the workstation from its website (the recogniser is a download beside the forms): your voice paces the script instead.');VO.mode='speak';return;}
  if(!(await asrHave())&&!(await nbhUI.confirm('Follow my words: download the speech recogniser?\nIt is about 57 MB, from this workstation’s website, once; it stays on this device afterwards. It runs on the device: what the microphone hears is not recorded and never leaves it.',{ok:'Download'}))){voSay('Not downloaded: your voice paces the script instead.');VO.mode='speak';return;}
  VO.loading=true;voMeter();const m=$('#tpMic span');
  try{const f=await asrFiles(p=>{if(m)m.textContent='Getting the recogniser: '+Math.round(p*100)+'%';});if(m)m.textContent='Starting the recogniser…';
    VO.w=new Worker('nbh-asr/asr-worker.js');VO.w.onmessage=e=>{const d=e.data||{};if(d.t==='ready'){VO.ready=true;VO.loading=false;voMeter(true);}else if(d.t==='res'){VO.inflight=Math.max(0,VO.inflight-1);voHeard(d.text,d.end);}else if(d.t==='error'){VO.loading=false;voSay('The recogniser did not start ('+d.m+'): your voice paces the script instead.');VO.mode='speak';voMeter();}};
    VO.w.postMessage({t:'init',wasm:f.wasm,data:f.data},[f.wasm,f.data]);}
  catch(err){VO.loading=false;voSay('The recogniser could not be fetched ('+String(err.message||err)+'): your voice paces the script instead.');VO.mode='speak';voMeter();}}
$('#asrDrop').addEventListener('click',async()=>{if(!window.caches){nbhUI.toast('No speech recogniser is kept here.',{kind:'ok'});return;}const had=await asrHave();
  if(had&&!(await nbhUI.confirm('Remove the speech recogniser from this device?\nFollow my words downloads it again (about 57 MB) when next chosen.',{ok:'Remove',danger:true})))return;
  try{await caches.delete(ASR_CACHE);}catch(e){}if(VO.w){VO.w.terminate();VO.w=null;VO.ready=false;if(VO.mode==='follow')VO.mode='speak';}nbhUI.toast(had?'The speech recogniser is removed from this device.':'No speech recogniser is kept on this device.',{kind:'ok'});});
/* the words heard, placed in the script: the last few, matched (allowing a word missed or misheard) near where the
   reading is, or anywhere when the match is strong (a skip ahead, or back) */
const STOP=new Set(['the','a','an','and','of','to','in','is','it','that','on','for','as','at','be','or','by','with','this','are','was','he','she','his','her','they','we','you','i']);
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
const simW=(a,b)=>a===b?1:(a.length<4||b.length<4)?0:1-lev(a,b)/Math.max(a.length,b.length);
const wtW=w=>STOP.has(w)?.3:w.length<=3?.6:1;
function voScore(R,e){let i=R.length-1,j=e,sc=0,miss=0;if(simW(R[i],SW[j].w)<.72)return 0;
  while(i>=0&&j>=0&&miss<4){const s=simW(R[i],SW[j].w);if(s>=.72){sc+=wtW(SW[j].w)*s;i--;j--;continue;}if(j>0&&simW(R[i],SW[j-1].w)>=.72){j--;miss++;continue;}if(i>0&&simW(R[i-1],SW[j].w)>=.72){i--;miss++;continue;}i--;j--;miss++;}
  return sc;}
function voHeard(text,end){if(!TP.run)return;const toks=normTok(text);VO.cur=toks;if(end&&toks.length){VO.done=VO.done.concat(toks).slice(-24);VO.cur=[];}
  const R=VO.done.concat(VO.cur).slice(-8);if(R.length<2||!SW.length)return;const p=TP.pos;let best=null;
  const look=(a,b,pen)=>{for(let e=Math.max(0,a);e<Math.min(SW.length,b);e++){const sc=voScore(R,e);if(sc<=0)continue;const v=sc-pen*Math.abs(e+1-p)/40;if(!best||v>best.v)best={e,sc,v};}};
  look(p-6,p+30,.4);if(!best||best.sc<1.4)look(0,SW.length,1.2);if(!best)return;
  const to=best.e+1,back=to<p-1,far=Math.abs(to-p)>30;if(best.sc<(back||far?2.6:1.4))return;if(to===p)return;
  TP.pos=to;tpReadTo(to);const sp=SP[SW[to-1].s];if(sp){TP.ty=Math.max(0,sp.offsetTop-sp.offsetHeight*.2);}
  /* the clock running: the time of each word come to (the few passed since the last words heard, at this time too) */
  if(TP.rec){const t=+((performance.now()-TP.t0)/1000).toFixed(2);let last=-1;for(let j=to>p&&to-p<=12?p:to-1;j<to;j++){const s=SW[j].s;if(s!==last){S.wt.push([s,t]);last=s;}}if(S.wt.length>20000)S.wt.splice(0,S.wt.length-20000);}}

$('#tpNext').addEventListener('click',tpNext);$('#tpPrev').addEventListener('click',tpPrev);$('#tpRun').addEventListener('click',tpToggle);
$('#tpRec').addEventListener('click',()=>{const b=$('#tpRec');if(!TP.rec){if(cdStop())return;countdown(()=>{TP.rec=true;TP.t0=performance.now();S.log=[];S.wt=[];b.textContent='Stop the clock';b.setAttribute('aria-pressed','true');TP.tick=setInterval(tpClock,250);wake(true);tpSetCard(TP.i,TP.b);});}
  else{TP.rec=false;clearInterval(TP.tick);b.textContent='Start the clock';b.setAttribute('aria-pressed','false');syncState();logLine();}});
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

/* ---------------- chapters and captions for the video (from the clock's card times, and the words heard) ---------------- */
const hms=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};
/* YouTube's chapters: the first at 0:00, each at least 10 seconds, at least three; a chapter is the bar's (the Chapters
   look) or the segment */
function chaptersOf(){if(!S.log.length)return {list:[],note:'No card times yet: Start the clock on the teleprompter as you record.'};
  const lab=r=>{if(S.meta.look==='chapters'){const C=chList(),c=chOf(r);if(c>=0&&C.list[c])return C.list[c];}return r.seg||r.title||'Part';};
  const raw=[];S.log.slice().sort((a,b)=>a.t-b.t).forEach(l=>{const r=S.rows[l.i];if(!r)return;const L=lab(r);if(!raw.length||raw[raw.length-1].l!==L)raw.push({t:l.t,l:L});});
  if(!raw.length)return {list:[],note:'No card times yet.'};raw[0].t=0;const out=[];let dropped=0;
  raw.forEach((c,j)=>{const nx=raw[j+1];if(out.length&&nx&&nx.t-c.t<10){dropped++;return;}if(out.length&&c.t-out[out.length-1].t<10){out[out.length-1].l=c.l;dropped++;return;}out.push(c);});
  return {list:out,note:(out.length<3?'YouTube shows chapters only when there are at least three. ':'')+(dropped?dropped+' shorter than 10 seconds left out. ':'')};}
/* the captions: each paragraph's words from when its first card came up to when the next paragraph's did (or, with the
   words heard while the clock ran, from when each word was said), two lines of at most 42 characters a caption */
function cuesOf(){if(!S.log.length)return [];tpRender();const P=paras(),seq=[];S.log.slice().sort((a,b)=>a.t-b.t).forEach(l=>{const k=P.findIndex(p=>p.rows.includes(l.i));if(k<0)return;if(!seq.length||seq[seq.length-1].k!==k)seq.push({k,t:l.t});});
  const wt=new Map();(S.wt||[]).forEach(([s,t])=>{if(!wt.has(s))wt.set(s,t);});const cues=[],SK=[];SPK.forEach((k,s)=>{(SK[k]||(SK[k]=[])).push(s);});
  /* a paragraph's words as written (a comma after a stressed word stays with it) */
  seq.forEach((g,j)=>{const wordsK=[],sIdx=[];(SK[g.k]||[]).forEach(s=>{const t=SP[s].textContent;if(wordsK.length&&/^[,.;:!?)\]’”'"…]+$/.test(t))wordsK[wordsK.length-1]+=t;else{wordsK.push(t);sIdx.push(s);}});if(!wordsK.length)return;
    const t0=g.t,t1=seq[j+1]?seq[j+1].t:t0+wordsK.length/wpm()*60,total=wordsK.join(' ').length||1;
    const chunks=[];let line='',lines=[],start=0;wordsK.forEach((w,q)=>{if((line+' '+w).trim().length>42){lines.push(line.trim());line='';if(lines.length===2){chunks.push({from:start,to:q,text:lines.join('\n')});lines=[];start=q;}}line+=' '+w;});
    if(line.trim())lines.push(line.trim());if(lines.length)chunks.push({from:start,to:wordsK.length,text:lines.join('\n')});
    const at=q=>{if(wt.has(sIdx[q]))return Math.max(t0,Math.min(t1,wt.get(sIdx[q])));const c=wordsK.slice(0,q).join(' ').length;return t0+(t1-t0)*c/total;};
    chunks.forEach((c,ci)=>{const a=at(c.from),b=ci<chunks.length-1?at(chunks[ci+1].from):t1;cues.push({a,b:Math.max(a+.8,b),text:c.text});});});
  for(let j=0;j<cues.length-1;j++)cues[j].b=Math.min(cues[j].b,cues[j+1].a);return cues;}
const stamp=(s,sep)=>{const ms=Math.round(s*1000),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),x=Math.floor(ms%60000/1000),f=ms%1000;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')+sep+String(f).padStart(3,'0');};
$('#chapBtn').addEventListener('click',()=>{const c=chaptersOf();if(!c.list.length){nbhUI.toast(c.note,{kind:'warn'});return;}const txt=c.list.map(x=>hms(x.t)+' '+x.l).join('\n');
  download(txt+'\n','text/plain','TV-1_'+fileName()+'_YouTube-chapters.txt');try{if(navigator.clipboard)navigator.clipboard.writeText(txt).catch(()=>{});}catch(e){}nbhUI.toast(c.list.length+' chapters, for the video’s description on YouTube (copied too). '+c.note,{kind:c.list.length<3?'warn':'ok'});});
function capDl(kind){const c=cuesOf();if(!c.length){nbhUI.toast('No card times yet: Start the clock on the teleprompter as you record.',{kind:'warn'});return;}
  const body=kind==='vtt'?'WEBVTT\n\n'+c.map(x=>stamp(x.a,'.')+' --> '+stamp(x.b,'.')+'\n'+x.text).join('\n\n')+'\n':c.map((x,j)=>(j+1)+'\n'+stamp(x.a,',')+' --> '+stamp(x.b,',')+'\n'+x.text).join('\n\n')+'\n';
  download(body,kind==='vtt'?'text/vtt':'application/x-subrip','TV-1_'+fileName()+'_captions.'+kind);nbhUI.toast(c.length+' captions'+(S.wt.length?', timed by the words heard':', timed by the card times')+'.',{kind:'ok'});}
$('#srtBtn').addEventListener('click',()=>capDl('srt'));$('#vttBtn').addEventListener('click',()=>capDl('vtt'));

/* ---------------- editing ---------------- */
let tSoon=0;function soon(){clearTimeout(tSoon);tSoon=setTimeout(()=>{renderSums();syncState();},250);}
document.addEventListener('input',e=>{const el=e.target;if(el.id==='tvState'){restoreState(el.value);return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(el.dataset.m==='chapters'){chLine();renderRows();}if(/^tk/.test(el.dataset.m))tkLine();if(/^(c1|c2|c3|c4|cardbg|side|font|look|series|tag|first|client|chapters|tkspd|tksize|tkfont|tkcol)$/.test(el.dataset.m)){clearTimeout(window.__tvLk);window.__tvLk=setTimeout(()=>{renderThumbs();gwShow(gwAt<0?curRow():gwAt);},250);}if(/^tp/.test(el.dataset.m))tpStyle();if(el.dataset.m==='tpwpm')renderSums();soon();return;}
  if(el.dataset.segname!==undefined){const i0=+el.dataset.segname,old=S.rows[i0].seg;for(let i=i0;i<S.rows.length&&S.rows[i].seg===old;i++)S.rows[i].seg=el.value;clearTimeout(window.__tvSg);window.__tvSg=setTimeout(()=>renderThumbs(),300);soon();return;}
  if(el.dataset.i!==undefined&&el.dataset.f){const i=+el.dataset.i,f=el.dataset.f,r=S.rows[i];if(!r)return;
    if(f==='cont'){r.cont=el.checked;if(r.cont)r.say='';renderRows();syncState();return;}
    if(f==='build'){r.build=el.checked;if(i===TP.i)TP.b=0;syncState();return;}
    if(/^cap\d$/.test(f))r.pics[+f.slice(3)].cap=el.value;else r[f]=el.value;
    if(f==='ch'){renderThumbs();syncState();return;}if(f==='lay'||f==='title'||f==='body'||f==='say'||/^cap/.test(f)){clearTimeout(r._t);r._t=setTimeout(()=>renderThumbs(i),300);}
    const row=el.closest('.tv-row');if(row)row.classList.toggle('todo',todo(r.say)||todo(r.title)||todo(r.body));soon();}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.m==='look'){setLook(el.value);renderSetup();return;}
  if(el.dataset.m==='tpmode'){S.meta.tpmode=el.value;tpStyle();if(TP.run){if(el.value==='fixed')voStop();else voStart(el.value);}syncState();return;}if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;tpStyle();syncState();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;gwShow(gwAt<0?curRow():gwAt);renderThumbs();renderSetup();syncState();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.mv){const [i,s]=d.mv.split(':').map(Number),j=i+s;if(j<0||j>=S.rows.length)return;[S.rows[i],S.rows[j]]=[S.rows[j],S.rows[i]];if(S.rows[0])S.rows[0].cont=false;renderRows();syncState();return;}
  if(d.dup!==undefined){const i=+d.dup,c=JSON.parse(JSON.stringify(S.rows[i]));S.rows.splice(i+1,0,newRow('',c));renderRows();syncState();return;}
  if(d.del!==undefined){const i=+d.del;S.rows.splice(i,1);if(S.rows[i]&&i===0)S.rows[0].cont=false;if(S.rows[i]&&S.rows[i].cont&&(i===0))S.rows[i].cont=false;renderRows();syncState();return;}
  if(d.addhere!==undefined){const i0=+d.addhere,seg=S.rows[i0].seg;let k=i0;while(k+1<S.rows.length&&S.rows[k+1].seg===seg)k++;S.rows.splice(k+1,0,newRow(seg));renderRows();syncState();const t=$('textarea[data-i="'+(k+1)+'"][data-f="say"]');if(t)t.focus();return;}
  if(d.pic){const [i,j]=d.pic.split(':').map(Number);PICK={i,j};$('#photoIn').click();return;}
  if(d.picx){const [i,j]=d.picx.split(':').map(Number);S.rows[i].pics[j].ph='';prune();renderRows();syncState();return;}});
$('#cueBtn').addEventListener('click',()=>{const n=placeCues();renderRows();syncState();nbhUI.toast(n?n+' next-card mark'+(n===1?'':'s')+' (>>) placed, each where a card changes or a point comes up: move one by moving its >> in the words.':'No paragraph needs one: every paragraph with more than one card or point has its marks already.',{kind:'ok'});});
$('#addSeg').addEventListener('click',()=>{S.rows.push(newRow('New segment',{title:'',say:''}));renderRows();syncState();const ins=$$('.tv-segname');if(ins.length){ins[ins.length-1].focus();ins[ins.length-1].select();}});
$('#addRow').addEventListener('click',()=>{const L=S.rows[S.rows.length-1];S.rows.push(newRow(L?L.seg:'Training Overview'));renderRows();syncState();});
$('#emptyAll').addEventListener('click',async()=>{if(!S.rows.length)return;if(await nbhUI.confirm('Empty the script?\nEvery row, card and picture is removed.',{ok:'Empty',danger:true})){S.rows=[];S.photos=[];renderAll();}});
function setLook(v){const o=LOOKC[S.meta.look]||{},n=LOOKC[v]||{};['c1','c2','c3','c4'].forEach(k=>{if(!S.meta[k]||String(S.meta[k]).toLowerCase()===o[k])S.meta[k]=n[k];});S.meta.look=v;bindMeta();chLine();renderThumbs();gwShow(gwAt<0?curRow():gwAt);syncState();}
function tkLine(){const v=$('#tkV');if(v)v.textContent=tkSpd()?'('+tkSpd()+' px a second)':'(still)';const z=$('#tkZ');if(z)z.textContent='('+tkSize()+' px)';}
function chLine(){tkLine();document.body.classList.toggle('tv-v2',S.meta.look==='chapters');const C=chList(),l=$('#chLine');if(l)l.textContent=S.meta.look!=='chapters'?'':C.own?C.list.length+' chapters on the bar; each card is in the chapter set on its row or on the nearest row above.':'No chapters typed: the segments are the chapters ('+C.list.length+').';}
/* the logo beside the tag: the form's letterhead logo, or one chosen here (kept with the pictures, as 'logo') */
$('#logoBtn').addEventListener('click',()=>{PICK={logo:true};$('#photoIn').click();});
$('#logoReset').addEventListener('click',()=>{S.photos=S.photos.filter(p=>p.id!=='logo');paintLogo();logoLine();renderThumbs();gwShow(gwAt<0?curRow():gwAt);syncState();});
function logoLine(){const l=$('#logoLine');if(l)l.textContent=photo('logo')?'A logo of your own.':'The letterhead logo.';}
/* pictures: kept at up to 3840 px on the long side (sharp on a 4K video, 3840 x 2160), as JPEG (PNG when they have transparency) */
let PICK=null;
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f||!PICK)return;const at=PICK;PICK=null;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,3840/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);
    const png=/png|gif|webp/i.test(f.type);const id=at.logo?'logo':'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);if(at.logo)S.photos=S.photos.filter(p=>p.id!=='logo');S.photos.push({id,label:String(f.name||'picture').replace(/\.[^.]+$/,'').slice(0,40),img:png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.9)});
    if(at.logo){paintLogo();logoLine();renderThumbs();gwShow(gwAt<0?curRow():gwAt);syncState();return;}S.rows[at.i].pics[at.j].ph=id;if(!S.rows[at.i].pics[at.j].cap)S.rows[at.i].pics[at.j].cap='';renderRows();syncState();};im.src=r.result;};r.readAsDataURL(f);});
function prune(){const used=new Set();S.rows.forEach(r=>r.pics.forEach(p=>{if(p.ph)used.add(p.ph);}));S.photos=S.photos.filter(p=>used.has(p.id)||p.id==='logo');}

/* ---------------- the sheet: import and export in the layout Flowics reads ---------------- */
/* the first tab: every row, A the segment, B the paragraphs, C the heading, D the list, E and F the two picture captions, G to Z
   the template's own columns as they came: M and N the heading and words of a card beside a picture (the layout "Text beside a
   picture"), O the picture's file, P the chapters of the bar (one a row, from the first row), Q to Z the chapter tabs (in the
   Chapters look written as 1 for the card's own chapter and 0.35 for the others). Nine columns when nothing past I is used. */
function sheetRows(){const C=chList(),v2=S.meta.look==='chapters',wide=v2||S.rows.some(r=>r.x.slice(3).some(v=>String(v).trim()));
  return S.rows.map((r,i)=>{const x=r.x.slice(),sp=r.lay==='split';if(sp){x[6]=r.title;x[7]=r.body;}
    if(v2&&C.own){x[9]=C.list[i]||'';const c=chOf(r);for(let k=0;k<10;k++)x[10+k]=k<C.list.length?(k===c?'1':'0.35'):x[10+k];}
    const row=[r.seg,unmark(r.cont?(S.rows[paraOf(i)].say||''):r.say),sp?'':r.title,sp?'':r.body,r.pics[0].cap,r.pics[1].cap].concat(x);return wide?row:row.slice(0,9);});}
const tabName=(i,s)=>(String(i).padStart(2,'0')+'_'+String(s||'Segment').replace(/&/g,'And').replace(/\./g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')).slice(0,31);
function fromSheet(rows){const out=[],chs=[];rows.forEach(c=>{c=c.map(v=>String(v==null?'':v));while(c.length<26)c.push('');if(c[15].trim())chs.push(c[15].trim());if(!c.slice(0,4).some(v=>v.trim())&&!c[12].trim()&&!c[13].trim())return;
    const prev=out[out.length-1],say=c[1],cont=!!(prev&&say.trim()&&say.trim()===(prev.cont?(out[out.findLastIndex?out.findLastIndex(r=>!r.cont):out.length-1]||{}).say:prev.say||'').trim());
    const clean=t=>t.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean).join('\n'),sp=!c[2].trim()&&!c[3].trim()&&!!(c[12].trim()||c[13].trim());
    const x=c.slice(6,26);if(sp){x[6]='';x[7]='';}
    out.push(newRow(c[0].trim(),{say:cont?'':say.replace(/\r/g,'').replace(/\n[ \t]+\n/g,'\n\n').replace(/\s+$/,''),cont,title:sp?c[12].trim():c[2].trim(),body:clean(sp?c[13]:c[3]),lay:sp?'split':'auto',pics:[{ph:'',cap:c[4].trim()},{ph:'',cap:c[5].trim()}],x}));});
  /* the chapters, and each card's own: the tab whose value stands above the others */
  if(chs.length){let last='';out.forEach(r=>{const v=r.x.slice(10,10+chs.length).map(n=>parseFloat(n)),mx=Math.max(...v.filter(isFinite));
    if(isFinite(mx)&&v.filter(n=>n===mx).length===1&&v.some(n=>isFinite(n)&&n<mx)){const c=chs[v.indexOf(mx)];if(c!==last){r.ch=c;last=c;}}});}
  out.chapters=chs.slice(0,10);return out;}
$('#impBtn').addEventListener('click',()=>$('#impIn').click());
$('#impIn').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;let rows=null;
  try{if(/\.xlsx$/i.test(f.name)||/spreadsheetml/.test(f.type)){const sh=await readXlsx(new Uint8Array(await f.arrayBuffer()));rows=sh&&sh[0]?sh[0].rows:null;}else rows=parseCsv(await f.text());}
  catch(err){rows=null;}
  const got=rows?fromSheet(rows):[];if(!got.length){nbhUI.toast('That file has no rows this form can read: use the sheet’s first tab, downloaded as CSV or .xlsx.',{kind:'warn'});return;}
  if(S.rows.length&&!(await nbhUI.confirm('Replace the script with the '+got.length+' rows of '+f.name+'?\nThe rows here now are removed (their pictures too).',{ok:'Replace',danger:true})))return;
  S.rows=got;if(got.chapters.length){S.meta.chapters=got.chapters.join('\n');if(S.meta.look!=='chapters')setLook('chapters');}prune();renderAll();setView('script');
  const named=got.filter(r=>r.x[8].trim()).length;nbhUI.toast(got.length+' rows read from '+f.name+(got.chapters.length?', with '+got.chapters.length+' chapters':'')+'. Pictures are not in a sheet: add them on their rows'+(named?' (the sheet names '+named+')':'')+'.',{kind:'ok'});});
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
    h+='<div class="pr-r"><div class="pr-n">'+(i+1)+'</div><div class="pr-say">'+(r.cont?'<i>(the paragraph above goes on)</i>':esc(r.say).replace(/\n+/g,'<br>')+(String(r.tp||'').trim()?'<div class="pr-tp"><b>Said:</b> '+esc(r.tp).replace(/\n+/g,'<br>')+'</div>':''))+'</div><div class="pr-card"><b>'+esc(r.title)+'</b>'+(r.body?'<br>'+esc(r.body).replace(/\n/g,'<br>'):'')+'</div></div>';});
  o.innerHTML=h;}
$('#printBtn').addEventListener('click',()=>{renderPrint();setTimeout(()=>window.print(),60);});

/* ---------------- save, open, clear, the simulator ---------------- */
function syncState(){const t=$('#tvState');if(t)t.value=JSON.stringify(S);}
function fromFile(d){if(!d||typeof d!=='object'||d.form!=='TV-1'||!d.S||typeof d.S!=='object')return null;const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v);
  if(s.meta&&typeof s.meta==='object')Object.keys(s.meta).forEach(k=>{o.meta[k]=str(s.meta[k]).slice(0,4000);});['c1','c2','c3','c4','tkcol'].forEach(k=>{o.meta[k]=hex(o.meta[k],blank().meta[k]);});if(s.chk&&typeof s.chk==='object')Object.keys(s.chk).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<16000000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,300).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,40),img:str(p&&p.img)})).filter(p=>/^[A-Za-z0-9_-]{1,20}$/.test(p.id)&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));
  o.rows=Array.isArray(s.rows)?s.rows.slice(0,600).map(r=>{r=r&&typeof r==='object'?r:{};const pics=Array.isArray(r.pics)?r.pics:[];
    return newRow(str(r.seg).slice(0,80),{say:str(r.say).slice(0,8000),tp:str(r.tp).slice(0,8000),cont:!!r.cont,title:str(r.title).slice(0,200),body:str(r.body).slice(0,4000),lay:LAYS.some(l=>l[0]===r.lay)?r.lay:'auto',ch:str(r.ch).slice(0,60),
      build:!!r.build,pics:[0,1].map(j=>{const p=pics[j]||{};return {ph:ids.has(str(p.ph))?str(p.ph):'',cap:str(p.cap).slice(0,120)};}),x:Array.from({length:20},(_,j)=>str(Array.isArray(r.x)?r.x[j]:'').slice(0,2000))});}):[];
  if(o.rows[0])o.rows[0].cont=false;
  o.log=Array.isArray(s.log)?s.log.slice(0,2000).map(l=>({i:Math.max(0,parseInt(l&&l.i)||0),t:num(l&&l.t)||0,seg:str(l&&l.seg).slice(0,80),title:str(l&&l.title).slice(0,200)})):[];
  o.wt=Array.isArray(s.wt)?s.wt.slice(-20000).filter(a=>Array.isArray(a)&&a.length===2).map(a=>[Math.max(0,parseInt(a[0])||0),Math.max(0,num(a[1])||0)]):[];
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
  const rows=draft(keys);S.rows=S.rows.concat(rows);placeCues(rows.map(r=>S.rows.indexOf(r)));renderAll();setView('script');
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
  const fill=(seg,title,say,body)=>{const r=S.rows.find(x=>x.seg===seg&&x.title===title);if(r){if(say!=null)r.say=lead(say);if(body!=null)r.body=body;}};
  fill('Student Profile','Strengths','A behavior plan only makes sense in the context of the whole learner, including what Sam does well and enjoys. Sam reads above grade level, loves drawing, and is kind to younger students.','• Reads above grade level\n• Drawing and art\n• Kind to younger students');
  fill('Student Profile','Communication','Sam speaks in full sentences, but under stress words get harder. Every adult gives Sam a moment, and points to the break card.','Give a moment to answer.\nPoint to the break card.');
  fill('Proactive Strategies','Proactive','Proactive strategies prevent the behavior, or make it less likely, by changing what happens before it. Every adult gives Sam a first-then card, short tasks broken into steps, and a choice of where to start.','• First-then card\n• Short tasks, in steps\n• A choice of where to start');
  fill('Response Plan','Steps',null,'1. Stay calm; use few words\n2. Point to the break card\n3. Give the break; set the timer\n4. Return to the same task, with help');
  fill('Response Plan','Steps','A response plan says what staff do after the behavior begins. It is a safety and de-escalation sequence, followed in order. Stay calm and use few words. Point to the break card. Give the break, set the timer, and return to the same task, with help.',null);
  fill('Key Takeaways','Remember','Two things matter most. Honor every break request, right away. And always return to the same task afterwards, so that leaving never ends the work.','• Honor every break request\n• Return to the same task');
  fill('Terms & Definitions','Terms','A few terms come up every day. The break card is the red card on Sam’s desk. The first-then card shows the task, then the reward.','• Break card: the red card on the desk\n• First-then card: the task, then the reward');
  S.rows=S.rows.filter(r=>!(r.seg==='Reinforcement System')).concat([]);
  const ri=S.rows.findIndex(r=>r.seg==='Proactive Strategies');S.rows.splice(ri,0,newRow('Reinforcement System',{ch:'The Plan',say:'These are the items and activities Sam works for, from the preference assessment, the most preferred first.\n\nSam earns a token for each finished step; five tokens earn five minutes of the chosen item.',title:'Works For',body:'• Tablet time\n• Drawing\n• Playground\n• Music'}),
    newRow('Reinforcement System',{cont:true,title:'Earning',body:'• A token for each finished step\n• Five tokens: five minutes',lay:'lower'}));
  S.rows.splice(1,0,newRow('Training Overview',{cont:true,title:'Training Overview',lay:'title'}));
  placeCues();CASE=SIMCASE;renderAll();setView('script');nbhUI.toast('Simulator loaded: a sample training script for Sam ('+S.rows.length+' cards).',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);

/* ---------------- the case (the workstation shell's facts): kept for drafting; nothing is filled until you draft ---------------- */
window.__nbhFactsIn=function(f){CASE=f||null;renderSetup();return {filled:0,note:'the case is kept for drafting: press Draft from the case'};};
window.__nbhFactsPick=function(sel){CASE=Object.assign({},CASE||{},{behaviors:sel.behaviors&&sel.behaviors.length?sel.behaviors:(CASE&&CASE.behaviors)||[],fn:sel.fn||(CASE&&CASE.fn)||null,goals:sel.goals||(CASE&&CASE.goals),menu:sel.menu&&sel.menu.length?sel.menu:(CASE&&CASE.menu)||[]});
  const keys=SEGS.map(s=>s[0]);const rows=draft(keys);S.rows=S.rows.concat(rows);renderAll();return {filled:rows.length};};
window.__nbhViewFill=function(v){if(v!=='script')return null;return {filled:S.rows.filter(r=>!todo(r.say)&&!todo(r.title)&&!todo(r.body)).length,total:S.rows.length||1};};

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{const k=el.dataset.m;if(S.meta[k]!=null&&S.meta[k]!=='')el.value=S.meta[k];else if(el.tagName==='SELECT'||el.type==='color'||el.type==='range')S.meta[k]=el.value;else el.value='';});
  $$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();paintLogo();logoLine();chLine();renderRows();if(document.body.classList.contains('view-graphics'))gxRender();if(document.body.classList.contains('view-prompter'))tpRender();renderPrint();logLine();syncState();}
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
window.addEventListener('beforeprint',renderPrint);
window.addEventListener('resize',()=>{clearTimeout(window.__tvRs);window.__tvRs=setTimeout(()=>{if(document.body.classList.contains('view-graphics'))gxRender();},200);});
renderAll();
