/* The pictures come from nbh-pictos.js, the shared pictogram library kept beside the forms (one copy serves
   Form SM-1 and Form VS-1; the one-file edition carries it once and puts it in when a form opens). Without
   the file the form still works: photos and words, no library pictures, and the picture chooser says so. */
if(!window.NBH_PICTOS){window.NBH_PICTOS={};window.NBH_PICTO_CATS={};window.NBH_PICTO_ORDER=[];window.NBH_PICTO_LICENSE='';window.picto=function(){return '';};window.NBH_PICTOS_MISSING=true;}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';

/* ---- v21.33: clock times are picked (type="time", stored HH:MM). Older files with typed text are converted. ---- */
function toHM24(v){const t=String(v==null?"":v).trim().toLowerCase();if(!t)return "";if(/^\d{2}:\d{2}$/.test(t))return t;
  const m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/.exec(t);if(!m)return "";let h=+m[1],mi=m[2]?+m[2]:0;if(h>23||mi>59)return "";
  if(m[3]==="p"&&h<12)h+=12;else if(m[3]==="a"&&h===12)h=0;else if(!m[3]&&h>=1&&h<=6)h+=12;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0");}
function fmtHM(v){const t=toHM24(v);if(!t)return String(v==null?'':v);let h=+t.slice(0,2);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+t.slice(3)+' '+ap;}

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- v21.33: save a graph as a PNG (the SVG serialised and drawn on a canvas at 2x) ---- */
function graphFile(id,who){const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');return id+'_graph_'+((String(who||'').trim()||'student').replace(/\s+/g,'_').replace(/[^\w-]+/g,'').replace(/_+/g,'_')||'student')+'_'+ymd+'.png';}
function svgToPng(svg,fname){if(!svg)return;const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);const W=vb[2]||svg.clientWidth||900,H=vb[3]||svg.clientHeight||320;
  const c=svg.cloneNode(true);c.setAttribute('width',W);c.setAttribute('height',H);c.removeAttribute('id');c.removeAttribute('class');c.removeAttribute('style');if(!c.getAttribute('font-family'))c.setAttribute('font-family','system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml;charset=utf-8'}));const im=new Image();
  im.onload=()=>{const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname;document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),0);},'image/png');};
  im.onerror=()=>{URL.revokeObjectURL(url);alert('The graph could not be drawn as an image.');};im.src=url;}

/* ---- the pictures a sheet can carry: the shared pictogram library (window.NBH_PICTOS) or an uploaded photo ---- */
const ICON_KEYS=window.NBH_PICTO_ORDER||[];
/* (v21.62) My pictures: the practice's own pictures, taken with the camera (nbh-pictures.js beside the forms; without it the
   picker has no My pictures). A chosen one goes into the cell as a photo does, at 256 px. */
const MINE=!!window.NBHPIC;
if(MINE)NBHPIC.on(()=>{const d=$('#pickDlg');if(d&&d.open)d.grid();});
const icon=(k,cls)=>window.NBH_PICTOS&&window.NBH_PICTOS[k]?picto(k,cls||'ic'):'';
const pic=(o,cls)=>o&&o.img?'<img class="'+(cls||'ic')+'" src="'+o.img+'" alt="">':icon(o&&o.icon,cls);
const face=(happy,cls)=>'<svg class="'+(cls||'face')+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="'+(happy?'#c9e6c6':'#f0cfcf')+'" stroke="#333" stroke-width="1.4"/><circle cx="8.5" cy="10" r="1.4" fill="#333"/><circle cx="15.5" cy="10" r="1.4" fill="#333"/><path d="'+(happy?'M7.5 14.5 q4.5 4.5 9 0':'M7.5 16.5 q4.5 -4.5 9 0')+'" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round"/></svg>';
/* the picker dialog: one for the whole form */
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><b>Choose a picture</b><select id="pdCat"><option value="">All</option>'+(MINE?'<option value="_mine">My pictures</option>':'')+Object.entries(window.NBH_PICTO_CATS||{}).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button>'+(MINE?'<button type="button" id="pdCam">Take a photo</button><button type="button" id="pdLib">My pictures\u2026</button>':'')+'<button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' A photo is resized to a thumbnail and saved inside the form\'s file.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    if(MINE&&(!c||c==='_mine'))h+=NBHPIC.buttons(NBHPIC.list().filter(p=>!q||(p.label||'').toLowerCase().includes(q)));
    if(c!=='_mine')h+=ICON_KEYS.filter(k=>{const p=NBH_PICTOS[k];return (!c||p.c===c)&&(!q||p.l.toLowerCase().includes(q)||k.includes(q));}).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(NBH_PICTOS[k].l)+(NBH_PICTOS[k].o?'<span class="pd-yours">yours</span>':'')+'</button>').join('');
    $('#pdGrid').innerHTML=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no pictures are listed. Put it in the same folder as the form, or use a photo.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');};
  const useLib=pic=>{NBHPIC.toPhoto(pic,PICK.size||256,380000).then(p=>{if(!PICK)return;PICK.arr[PICK.i].img=p.img;PICK.arr[PICK.i].icon='';d.close();PICK.done();});};
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',e=>{const b=e.target.closest('button[data-k],button[data-lib]');if(!b||!PICK)return;if(b.dataset.lib){const pic=NBHPIC.get(b.dataset.lib);if(pic)useLib(pic);return;}PICK.arr[PICK.i].icon=b.dataset.k;PICK.arr[PICK.i].img='';d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].icon='';PICK.arr[PICK.i].img='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  if(MINE){$('#pdCam',d).addEventListener('click',()=>{NBHPIC.open({use:!!PICK}).then(pic=>{if(!pic)return;if(PICK)useLib(pic);else grid();});});
    $('#pdLib',d).addEventListener('click',()=>{NBHPIC.manage().then(grid);});}
  d.grid=grid;return d;}
function openPick(arr,i,done,size){PICK={arr,i,done,size:size||256};   /* size (v21.66): the model pictures ask for 480 px */const d=pickDlg();$('#pdQ',d).value='';d.grid();if(MINE)NBHPIC.all();if(d.showModal)d.showModal();else d.setAttribute('open','');}
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f||!PICK)return;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,(PICK.size||256)/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      PICK.arr[PICK.i].img=c.toDataURL('image/jpeg',0.82);PICK.arr[PICK.i].icon='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();};im.src=r.result;};r.readAsDataURL(f);});
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+(pic(o,'')||'')+'</span><button type="button" data-pick="1">'+(o.img||o.icon?'Change':'Choose')+'</button></div>';}

/* ---- defaults the sheets ship with ---- */
const LEVELS=[
  {pts:'1',desc:'10 or more prompts; not on time for class: gone for more than 10 minutes'},
  {pts:'2',desc:'No more than 8 prompts; not on time for class: gone for more than 8 minutes'},
  {pts:'3',desc:'No more than 6 prompts; not on time for class: gone for more than 6 minutes'},
  {pts:'4',desc:'No more than 4 prompts to finish the task; not on time for class: gone more than 4 minutes'},
  {pts:'5',desc:'No prompts or redirects to finish the task; on time for class'}
];
/* v22.7x (review F261): one set of thresholds. The ladder's and the fading table's "Move on when", the Record's decisions and
   the Guide read the same numbers: agreement at or above SM_AG.up to move on, below SM_AG.down to step back, the teacher's
   No ratings matched at SM_AG.no or more, judged only when the window holds SM_AG.noMin of them; each phase's window (w) in
   school days at the current goal (two weeks = 10, four weeks = 20). All are working conventions of this form. */
const SM_AG={up:90,down:80,no:80,noMin:3};
const LADDER=[
  {ph:'0',w:0,what:'Teacher rates only. The student sees the sheet and the rating at the end of each period; no points depend on it yet.',when:'3 to 5 school days of the teacher&rsquo;s ratings; the Record suggests the first goal from them.'},
  {ph:'1',w:5,met:true,what:'The student rates every period; the teacher rates every period independently; points follow the match table. Honest Nos are praised.',when:'Agreement at or above 90%, the student matching at least 80% of the teacher&rsquo;s No ratings, and the goal met on 4 of the last 5 school days at the current goal.'},
  {ph:'2',w:10,what:'The teacher matches half the periods, chosen beforehand by coin or dice; the student does not know which until the comparison. Unmatched periods earn the student&rsquo;s rating.',when:'Agreement at or above 90% on the matched periods, and at least 80% on the teacher&rsquo;s Nos, over two weeks (10 school days) at the current goal.'},
  {ph:'3',w:10,what:'One matched period a day, drawn at random; the rest earn the student&rsquo;s rating.',when:'The same, over two weeks (10 school days), on the one matched period a day.'},
  {ph:'4',w:20,cap:true,what:'The student rates alone; one surprise match a week. The reward follows the student&rsquo;s own total.',when:'Goal at its ceiling for four weeks (20 school days), the surprise checks agreeing.'},
  {ph:'5',w:0,what:'The sheet is retired; a verbal self-report at the end of the day and the plan&rsquo;s own data (Form PR-1).',when:'Exit on the plan&rsquo;s criteria.'}
];
const FADE=[
  {what:'Every period rated, reward the same day.',when:'Agreement at or above 90% and the goal met on 4 of the last 5 school days, held for two weeks (10 school days), at phase 2 of the ladder or beyond.'},
  {what:'Only the hardest half of the periods rated; the rest are assumed met unless the teacher notes otherwise.',when:'Goal met on 4 of the last 5 school days for two weeks (10 school days) with no rise in the unrated periods&rsquo; behavior on the plan&rsquo;s data. (The Record and the iPad count each unrated period as met, its full points, and leave it out of the behavior measure.)'},
  {what:'One rating at the end of each half day.',when:'Two weeks (10 school days) at criterion: the goal met on 4 of the last 5.'},
  {what:'One end-of-day self-rating; the reward moves to a weekly total with a small daily acknowledgment.',when:'Three weeks (15 school days) at criterion with agreement held on the surprise checks.'},
  {what:'A verbal self-report at the end of the day, no sheet; the plan&rsquo;s own data continue.',when:'Four weeks (20 school days) at criterion.'},
  {what:'Retired. The behavior is monitored on Form PR-1 and a sheet returns only if the data call for it.',when:'Exit on the plan&rsquo;s criteria.'}
];
const BCRULES=[
  'The reward is immediate: it follows the task as soon as the task is done, the same day where possible.',
  'The first contract asks for a small step, something the student has already done at least sometimes.',
  'The reward comes often and in small amounts rather than rarely and in large ones.',
  'The contract rewards accomplishment, what the student did, not obedience or attitude.',
  'The reward follows the performance, never comes first.',
  'The contract is fair: the size of the task matches the size of the reward.',
  'The terms are clear: anyone reading it would know exactly what counts and what is earned.',
  'The contract is honest: what it promises is delivered, every time it is earned.',
  'The contract is positive: it says what the student will do and earn, not what will happen if they do not.',
  'The contract is used systematically: the record is kept and the terms are followed as written.'
];
const FID=[
  'The sheet is on the desk at the start with the day&rsquo;s reward chosen and written on it.',
  'The student rates within a minute of the end of each period, with one prompt at most.',
  'The teacher rates independently, before seeing the student&rsquo;s rating or without looking at it.',
  'Ratings are compared out loud, match points written, and an honest No praised as warmly as a Yes.',
  'Disagreements are not argued; the teacher&rsquo;s rating stands, with one sentence on what was seen.',
  'Points are totalled and the goal checked at the time written on the Reinforcement sheet.',
  'The reward is delivered the same day when earned; nothing is removed when it is not.',
  'The day is entered on the Record (points, possible, matches) and the sheet is filed.',
  'The home note goes home and comes back signed (if used).'
];
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{},sys:'',tg:[],per:[],lv:LEVELS.map(l=>({pts:l.pts,desc:l.desc})),lad:LADDER.map(()=>({on:false,note:''})),fade:FADE.map(()=>({on:false,note:''})),fid:FID.map(()=>({in:'',note:''})),bck:BCRULES.map(()=>({in:'',note:''})),log:[],wk:{},d:{},store:[],per2:[],chg:[]};}
let S=blank();
function ensure(){
  if(!Array.isArray(S.tg))S.tg=[];if(!Array.isArray(S.per))S.per=[];if(!Array.isArray(S.log))S.log=[];
  if(!Array.isArray(S.lv)||S.lv.length!==5)S.lv=LEVELS.map(l=>({pts:l.pts,desc:l.desc}));
  if(!Array.isArray(S.lad)||S.lad.length!==LADDER.length)S.lad=LADDER.map(()=>({on:false,note:''}));
  if(!Array.isArray(S.fid)||S.fid.length!==FID.length)S.fid=FID.map(()=>({in:'',note:''}));
  if(!Array.isArray(S.fade)||S.fade.length!==FADE.length)S.fade=FADE.map(()=>({on:false,note:''}));
  if(!Array.isArray(S.bck)||S.bck.length!==BCRULES.length)S.bck=BCRULES.map(()=>({in:'',note:''}));
  if(!S.wk||typeof S.wk!=='object')S.wk={};
  if(!Array.isArray(S.chg))S.chg=[];   /* v22.7x (review I132) the dated changes */
  while(S.tg.length<2)S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});
  while(S.per.length<4)S.per.push({t:'',label:'',icon:'',img:''});
  S.per.forEach(p=>{const h=toHM24(p.t);if(h)p.t=h;});
  if(typeof smEnsure==='function')smEnsure();   /* v21.45 the design, the store, the second schedule (sm-v2-ui.js) */
  if(typeof mmEnsure==='function')mmEnsure();   /* v21.66 Match the model (sm-mm.js) */
}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function setSys(v){S.sys=v;document.body.className=document.body.className.replace(/\bsys-\S+/g,'').trim()+(v?' sys-'+v:'');
  $$('#sysOpt label').forEach(l=>{l.classList.toggle('on',l.dataset.sys===v);l.querySelector('input').checked=l.dataset.sys===v;});}
$('#sysOpt').addEventListener('change',e=>{if(e.target.name==='sys'){setSys(e.target.value);renderAll();}});

/* ---------------- rows ---------------- */
function renderT(){
  const tb=$('#tTbl tbody');tb.innerHTML=S.tg.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="tg" data-i="${i}" data-f="word" value="${esc(r.word)}" placeholder="I stayed in my area"></td>
    <td><input data-r="tg" data-i="${i}" data-f="def" value="${esc(r.def)}" placeholder="seated or standing within the taped area for the whole period, except with permission"></td>
    <td><input data-r="tg" data-i="${i}" data-f="cue" value="${esc(r.cue)}" placeholder="Bottom on the chair"></td>
    <td><input data-r="tg" data-i="${i}" data-f="ex" value="${esc(r.ex)}"></td>
    <td><input data-r="tg" data-i="${i}" data-f="nex" value="${esc(r.nex)}"></td>
    <td>${pickCell('tg',i,r)}<input data-r="tg" data-i="${i}" data-f="goal" value="${esc(r.goal||'')}" placeholder="goal % (school sheet)" style="margin-top:4px;font-size:11px"></td>${delCell('tg',i,'target')}</tr>`).join('');
}
function renderP(){
  const tb=$('#pTbl tbody');tb.innerHTML=S.per.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input type="time" data-r="per" data-i="${i}" data-f="t" value="${esc(toHM24(r.t)||r.t)}" aria-label="Period ${i+1} time"></td>
    <td><input data-r="per" data-i="${i}" data-f="label" value="${esc(r.label)}" placeholder="Reading"></td>
    <td>${pickCell('per',i,r)}</td>${delCell('per',i,'period')}</tr>`).join('');
}
function renderRub(){
  $('#rubTbl tbody').innerHTML=S.lv.map((l,i)=>`<tr><td class="num">${i+1}</td><td><input data-r="lv" data-i="${i}" data-f="pts" value="${esc(l.pts)}" style="text-align:center"></td><td><input data-r="lv" data-i="${i}" data-f="desc" value="${esc(l.desc)}"></td></tr>`).join('');
}
function renderLad(){
  $('#ladTbl tbody').innerHTML=LADDER.map((l,i)=>`<tr${S.lad[i].on?' style="background:#F4F8F7"':''}><td class="num">${l.ph}</td><td class="num"><input type="checkbox" data-r="lad" data-i="${i}" data-f="on"${S.lad[i].on?' checked':''} aria-label="Phase ${l.ph} in use"></td><td>${l.what}</td><td>${l.when}</td><td><input data-r="lad" data-i="${i}" data-f="note" value="${esc(S.lad[i].note)}" placeholder="started, agreement, moved on"></td></tr>`).join('');
}
function renderFade(){
  $('#fadeTbl tbody').innerHTML=FADE.map((l,i)=>`<tr${S.fade[i].on?' style="background:#F4F8F7"':''}><td class="num">${i+1}</td><td class="num"><input type="checkbox" data-r="fade" data-i="${i}" data-f="on"${S.fade[i].on?' checked':''} aria-label="Fading step ${i+1} in use"></td><td>${l.what}</td><td>${l.when}</td><td><input data-r="fade" data-i="${i}" data-f="note" value="${esc(S.fade[i].note)}" placeholder="started, data, moved on"></td></tr>`).join('');
}
/* v22.7x (review F263): a penalty clause sets rule 9 (the contract is positive) to No while it stands and holds the verdict: a
   penalty needs the BIP team's agreement, written into the BIP (Form TD-1) with the parent's informed consent (Form IC-1); one
   that takes away recess or what was earned goes against the sheet's own rule that points are never taken away */
const smPen=()=>/^A stated/.test(S.meta.bc_pen||'');
const smPenHard=()=>smPen()&&/recess|points?\b|tokens?\b|stickers?\b|earned|free time/i.test(S.meta.bc_pentext||'');
function renderBck(){const pen=smPen(),inOf=i=>i===8&&pen?'No':S.bck[i].in;
  $('#bcTbl tbody').innerHTML=BCRULES.map((t,i)=>{const v=inOf(i),lock=i===8&&pen;return `<tr><td class="num">${i+1}</td><td>${t}</td><td><select data-r="bck" data-i="${i}" data-f="in" aria-label="Rule ${i+1} met"${lock?' disabled title="No while the contract has a penalty clause"':''}><option value=""></option><option${v==='Yes'?' selected':''}>Yes</option><option${v==='No'?' selected':''}>No</option></select></td><td><input data-r="bck" data-i="${i}" data-f="note" value="${esc(S.bck[i].note)}"${lock?' placeholder="No: the contract has a penalty clause"':''}></td></tr>`;}).join('');
  const n=BCRULES.filter((t,i)=>inOf(i)==='Yes').length,no=BCRULES.filter((t,i)=>inOf(i)==='No').length;
  const hard=smPenHard()?' <b>This penalty takes away '+(/recess/i.test(S.meta.bc_pentext||'')?'recess':'what was earned')+'.</b> The sheet&rsquo;s own rule is that points are never taken away, and many district policies limit taking recess away: rewrite it as a day that earns nothing.':'';
  $('#bcVerdict').innerHTML=pen?'<div class="verdict v-no"><b>Not ready: a penalty needs the BIP team&rsquo;s agreement,</b> written into the BIP (Form TD-1) with the parent&rsquo;s informed consent (Form IC-1), and that BIP&rsquo;s date under the clause. Rule 9 (the contract is positive) stays No while the clause stands; a punishment procedure comes only after less intrusive ones (BACB Ethics Code, 2.15).'+hard+'</div>'
    :no?'<div class="verdict v-no"><b>'+no+' rule'+(no===1?'':'s')+' not met.</b> Rewrite the contract before anyone signs it; a contract that fails a rule is usually one that pays late, asks too much, or is not kept.</div>':n===BCRULES.length?'<div class="verdict v-ok"><b>All ten rules met.</b> Ready to sign.</div>':'';
}
function renderFid(){
  $('#fidTbl tbody').innerHTML=FID.map((t,i)=>`<tr><td class="num">${i+1}</td><td>${t}</td><td><select data-r="fid" data-i="${i}" data-f="in" aria-label="Step ${i+1} in the plan"><option value=""></option><option${S.fid[i].in==='Yes'?' selected':''}>Yes</option><option${S.fid[i].in==='No'?' selected':''}>No</option><option${S.fid[i].in==='N/A'?' selected':''}>N/A</option></select></td><td><input data-r="fid" data-i="${i}" data-f="note" value="${esc(S.fid[i].note)}"></td></tr>`).join('');
}
/* v22.7x (review F259, F260): the goal-met cell is worked out from the points and that day's goal (the tick stays only for a
   row without points); the On No cell gives how many of the teacher's No ratings the student matched */
function smMetCell(r,i){const p=num(r.pts),q=num(r.poss),g=num(r.goal);if(String(r.ph||'')==='0')return '<span class="hint" title="A teacher-only day earns no points">—</span>';
  if(p!=null&&q&&g!=null)return p/q*100>=g-1e-9?'<b style="color:#2F6B37">yes</b>':'no';
  return '<input type="checkbox" data-r="log" data-i="'+i+'" data-f="met"'+(r.met?' checked':'')+' aria-label="Goal met on day '+(i+1)+'">';}
function smOnNo(r){const t=num(r.tno),m=num(r.nom);return t!=null?(m||0)+' of '+t:'—';}
function renderL(){
  $('#lTbl tbody').innerHTML=S.log.map((r,i)=>{const p=num(r.pts),q=num(r.poss),m=num(r.m),n=num(r.n);
    return `<tr><td class="num">${i+1}</td><td><input data-r="log" data-i="${i}" data-f="date" value="${esc(r.date)}"></td><td><input data-r="log" data-i="${i}" data-f="ph" value="${esc(r.ph)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="goal" value="${esc(r.goal)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="pts" value="${esc(r.pts)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="poss" value="${esc(r.poss)}" style="text-align:center"></td><td class="num">${p!=null&&q?pct(p/q*100):'—'}</td><td><input data-r="log" data-i="${i}" data-f="beh" value="${esc(r.beh||'')}" style="text-align:center" aria-label="Behavior percent on day ${i+1}"></td><td><input data-r="log" data-i="${i}" data-f="m" value="${esc(r.m)}" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="n" value="${esc(r.n)}" style="text-align:center"></td><td class="num">${m!=null&&n?pct(m/n*100):'—'}</td><td class="num">${smOnNo(r)}</td><td class="num">${smMetCell(r,i)}</td><td><input data-r="log" data-i="${i}" data-f="tgp" value="${esc(r.tgp||'')}" placeholder="80,67,100" style="text-align:center"></td><td><input data-r="log" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('log',i,'day')}</tr>`;}).join('');
}
function renderWk(){
  const t=$('#wkTbl');if(S.sys!=='rubric'){t.innerHTML='';return;}
  const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));
  let h='<thead><tr><th style="width:16%">Period</th>'+DAYS.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>';
  S.per.forEach((p,pi)=>{h+='<tr><td class="lk">'+esc(p.t?fmtHM(p.t):'')+' '+esc(p.label||('Period '+(pi+1)))+'</td>'+DAYS.map((d,di)=>{const k='d'+di+'_p'+pi,v=S.wk[k]||'';
    return '<td><select data-wk="'+k+'" aria-label="'+d+' period '+(pi+1)+'"><option value=""></option>'+S.lv.map((l,li)=>'<option value="'+(li+1)+'"'+(String(li+1)===String(v)?' selected':'')+'>'+(li+1)+' · '+esc(l.desc.slice(0,38))+'</option>').join('')+'</select></td>';}).join('')+'</tr>';});
  const tot=DAYS.map((d,di)=>{let pts=0,n=0;const cnt=[0,0,0,0,0];S.per.forEach((p,pi)=>{const v=num(S.wk['d'+di+'_p'+pi]);if(v){pts+=num(S.lv[v-1].pts)||0;n++;cnt[v-1]++;}});return{pts,n,cnt};});
  h+='<tr><td class="lk">Total points</td>'+tot.map(t=>'<td class="num"><b>'+t.pts+'</b> of '+(t.n*maxp)+(t.n?' ('+pct(t.pts/(t.n*maxp)*100)+')':'')+'</td>').join('')+'</tr>';
  S.lv.forEach((l,li)=>{h+='<tr><td class="lk">Level '+(li+1)+'</td>'+tot.map(t=>'<td class="num">'+(t.n?pct(t.cnt[li]/t.n*100):'—')+'</td>').join('')+'</tr>';});
  h+='<tr><td class="lk">Week total</td><td class="num" colspan="5"><b>'+tot.reduce((s,t)=>s+t.pts,0)+'</b> of '+tot.reduce((s,t)=>s+t.n*maxp,0)+'</td></tr></tbody>';
  t.innerHTML=h;
}
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='log'){const tr=el.closest('tr');const r=S.log[+el.dataset.i],p=num(r.pts),q=num(r.poss),m=num(r.m),n=num(r.n);tr.children[6].textContent=p!=null&&q?pct(p/q*100):'—';tr.children[10].textContent=m!=null&&n?pct(m/n*100):'—';if(el.dataset.f!=='met')tr.children[12].innerHTML=smMetCell(r,+el.dataset.i);renderRecord();}
    else if(el.dataset.r==='tg'||el.dataset.r==='per'||el.dataset.r==='lv'){renderSheet();renderPoints();if(el.dataset.r==='per'||el.dataset.r==='lv')renderWkSoon();}
    return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(il_|iv_|mp_|goal|sh_|nick|client|menu|sm_|t_rem|when|pf_|ci_|smp_)/.test(el.dataset.m)){renderPoints();renderSheet();}if(/^iv_/.test(el.dataset.m))renderCueList();if(/^bc_/.test(el.dataset.m)||el.dataset.m==='client')renderBc();if(/^bc_pen/.test(el.dataset.m))renderBck();if(el.dataset.m==='goal'||el.dataset.m==='r_base')renderRecord();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){if(el.type==='checkbox')S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.checked;else S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='lad'){renderLad();renderRecord();}if(el.dataset.r==='fade')renderFade();if(el.dataset.r==='bck')renderBck();if(el.dataset.r==='log')renderRecord();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderSheet();renderPoints();renderSetup();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderPoints();renderSheet();renderSetup();renderBc();if(/^bc_pen|^rf_class|^func$/.test(el.dataset.m)){renderBck();smCaseRender();}}
  if(el.dataset.wk!==undefined){S.wk[el.dataset.wk]=el.value;renderWk();}
});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>{if(r==='tg')renderT();else if(r==='per')renderP();else if(typeof smRepick==='function')smRepick(r);renderSheet();});});
let wkT=0;function renderWkSoon(){clearTimeout(wkT);wkT=setTimeout(renderWk,250);}
$('#addT').addEventListener('click',()=>{if(S.tg.length>=6)return;S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});renderT();renderSheet();renderPoints();renderSetup();});
$('#delT').addEventListener('click',async ()=>{if(S.tg.length<=1)return;const r=S.tg[S.tg.length-1];if((r.word||r.def)&&!(await nbhUI.confirm('Remove the last target?\nIts name, definition, cues and examples are deleted.',{ok:'Remove',danger:true})))return;S.tg.pop();renderT();renderSheet();renderPoints();renderSetup();});
$('#addP').addEventListener('click',()=>{if(S.per.length>=16)return;S.per.push({t:'',label:'',icon:'',img:''});renderP();renderSheet();renderPoints();renderWk();});
$('#delP').addEventListener('click',async ()=>{if(S.per.length<=1)return;const r=S.per[S.per.length-1];if((r.t||r.label)&&!(await nbhUI.confirm('Remove the last period?\nIts time, label and icon are deleted.',{ok:'Remove',danger:true})))return;S.per.pop();renderP();renderSheet();renderPoints();renderWk();});
$('#addL').addEventListener('click',()=>{S.log.push({date:'',ph:curPhase(),goal:S.meta.goal||'',pts:'',poss:String(possible().poss||''),beh:'',m:'',n:'',met:false,tgp:'',note:''});renderL();renderRecord();});
$('#delL').addEventListener('click',async ()=>{if(!S.log.length)return;const r=S.log[S.log.length-1];if((r.date||r.pts)&&!(await nbhUI.confirm('Remove the last day?\nIts date, points and note are deleted from the Record.',{ok:'Remove',danger:true})))return;S.log.pop();renderL();renderRecord();});
$('#wkAdd').addEventListener('click',()=>{const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));let added=0;
  DAYS.forEach((d,di)=>{let pts=0,n=0;S.per.forEach((p,pi)=>{const v=num(S.wk['d'+di+'_p'+pi]);if(v){pts+=num(S.lv[v-1].pts)||0;n++;}});
    if(n){const poss=n*maxp,g=num(S.meta.goal);S.log.push({date:d,ph:curPhase(),goal:S.meta.goal||'',pts:String(pts),poss:String(poss),m:'',n:'',met:g!=null?pts/poss*100>=g:false,tgp:'',note:'from the week grid'});added++;}});
  renderL();renderRecord();if(!added)alert('No period has a level yet.');});
$('#wkClear').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear the week grid?\nEvery level entered for the week is removed.',{ok:'Clear',danger:true})){S.wk={};renderWk();}});
function curPhase(){const i=S.lad.findIndex(x=>x.on);return i<0?'':LADDER[i].ph;}
/* the Record's per-target percents (tgp) are a comma list in target order and the week grid is keyed d<day>_p<period>,
   so deleting a target or a period drops its own values and re-keys the rest */
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  if(r==='tg'){const n=S.log.filter(x=>{const a=String(x.tgp||'').split(',');return a.length>i&&String(a[i]).trim()!=='';}).length;
    if((row.word||row.def||row.cue||row.ex||row.nex||row.icon||row.img||row.goal||n)&&!(await nbhUI.confirm('Delete this target?'+(n?'\nIts per-target percent on '+n+' day'+(n===1?'':'s')+' of the Record will be dropped; later targets move up.':''),{ok:'Delete',danger:true})))return;
    S.tg.splice(i,1);S.log.forEach(x=>{if(!x.tgp)return;const a=String(x.tgp).split(',');if(a.length>i){a.splice(i,1);x.tgp=a.join(',');}});
    if(!S.tg.length)S.tg.push({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''});renderT();renderL();renderSheet();renderPoints();renderSetup();renderRecord();}
  else if(r==='per'){const n=Object.keys(S.wk).filter(k=>{const m=/^d\d_p(\d+)$/.exec(k);return m&&+m[1]===i&&S.wk[k];}).length;
    if((row.t||row.label||row.icon||row.img||n)&&!(await nbhUI.confirm('Delete this period?'+(n?'\nIts '+n+' level'+(n===1?'':'s')+' in the week grid will be dropped; later periods move up.':''),{ok:'Delete',danger:true})))return;
    S.per.splice(i,1);const w={};Object.keys(S.wk).forEach(k=>{const m=/^(d\d)_p(\d+)$/.exec(k);if(!m){w[k]=S.wk[k];return;}const pi=+m[2];if(pi===i)return;w[m[1]+'_p'+(pi>i?pi-1:pi)]=S.wk[k];});S.wk=w;
    if(!S.per.length)S.per.push({t:'',label:'',icon:'',img:''});renderP();renderSheet();renderPoints();renderWk();}
  else if(r==='log'){if((row.date||row.pts||row.m||row.tgp||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe day it holds is deleted from the Record.',{ok:'Delete',danger:true})))return;S.log.splice(i,1);renderL();renderRecord();}
}
$('#smPngBtn').addEventListener('click',()=>svgToPng($('#logPlot'),graphFile('SM-1',S.meta.client)));
document.addEventListener('click',e=>{const b=e.target.closest('button.sm-png');if(!b)return;svgToPng(b.parentNode.querySelector('svg'),graphFile('SM-1',S.meta.client).replace('_graph_','_graph_sheet_'));});

/* ---------------- points ---------------- */
function mp(){return{yy:num(S.meta.mp_yy)??2,nn:num(S.meta.mp_nn)??1,yn:num(S.meta.mp_yn)??0,ny:num(S.meta.mp_ny)??0};}
function possible(){
  const P=S.per.length,T=S.tg.length,sys=S.sys;let poss=0,unit='points';
  if(sys==='match'){const m=mp();poss=P*T*Math.max(m.yy,m.nn,m.yn,m.ny);}
  else if(sys==='contract'||sys==='smiley')poss=P*T;
  else if(sys==='rubric')poss=P*Math.max(...S.lv.map(l=>num(l.pts)||0));
  else if(sys==='interval'){poss=num(S.meta.iv_n)||0;unit='intervals';}
  else if(sys==='interlock'){poss=1;unit='session';}
  else if(sys==='perf'){poss=num(S.meta.pf_n)||5;unit='sessions';}
  else if(sys==='cico')poss=P*T*2;
  {const v=typeof smV2Poss==='function'?smV2Poss(sys,P,T):null;if(v!=null)poss=v;}   /* v21.45 a rating style chosen on the Design page */
  const g=num(S.meta.goal);const need=g!=null&&poss?Math.ceil(poss*g/100):null;
  return{poss,need,g,unit};
}
function renderPoints(){
  const p=possible(),m=$('#ptMetrics');
  m.innerHTML=`<div class="metric"><b>Points possible per day</b><div class="val">${p.poss||'—'}</div><div class="sub">${esc(p.unit)} · ${S.per.length} period${S.per.length===1?'':'s'} × ${S.tg.length} target${S.tg.length===1?'':'s'}</div></div>
    <div class="metric"><b>Goal</b><div class="val">${p.g!=null?pct(p.g):'—'}</div><div class="sub">${p.need!=null?p.need+' of '+p.poss+' '+esc(p.unit):'enter a goal percent'}</div></div>
    <div class="metric"><b>System</b><div class="val" style="font-size:16px">${esc({match:'Self & Match',contract:'Contract',rubric:'Rubric point sheet',interval:'Cued intervals',interlock:'Interlocking session',smiley:'Expectations and earns',perf:'Performance count',cico:'Check-in / check-out'}[S.sys]||'not chosen')}</div><div class="sub">${S.chk.weekly?'weekly sheet':'one sheet per day'}${S.chk.pict?' · pictorial':''}</div></div>`;
  const gt=$('[data-m="goal_txt"]');if(gt&&!S.meta.goal_txt)gt.placeholder=p.need!=null?`If I earn ${p.need} of ${p.poss} points, I earn my reward.`:'filled from the goal';
  renderIl();
}
function ilRows(){
  const dir=S.meta.il_dir||'dec',init=num(S.meta.il_init)??20,step=num(S.meta.il_step)??2,every=Math.max(1,num(S.meta.il_every)??2),len=num(S.meta.il_len)??16,chk=Math.max(1,num(S.meta.il_chk)??1);
  const floor=num(S.meta.il_floor)??0,cap=num(S.meta.il_cap)??init;const rows=[];
  for(let t=0;t<=len;t+=chk){const k=Math.floor(t/every);let req=dir==='inc'?init+k*step:init-k*step;req=Math.max(floor,Math.min(cap,req));rows.push({t,req});}
  return rows;
}
function renderIl(){const el=$('#ilPreview');if(!el)return;if(!S.meta.il_init&&!S.meta.il_dir){el.textContent='';return;}
  const r=ilRows();el.innerHTML='<b>Requirement by minute:</b> '+r.map(x=>x.t+' min → '+x.req).join(' · ');}

/* ---------------- setup verdict ---------------- */
function renderSetup(){
  renderCueList();   /* v22.63 */
  const m=S.meta,out=[];
  /* v22.7x (review F266): a skill not yet in the repertoire is taught first; the sheet pays for doing more of a behavior the student can do */
  if(/^No/.test(m.r_perf||''))out.push('<b>Not yet: teach the skill first</b> (Form SA-1 for the teaching data); start the sheet when the skill is in the repertoire. A point sheet pays for doing more of what the student can already do; it does not teach it.');
  else if(/^Partly/.test(m.r_perf||''))out.push('Teach the skill alongside the sheet, and keep the goal low until the skill data (Form SA-1) show it.');
  if(/Not yet/.test(m.r_disc||''))out.push('The student cannot yet tell the target from its absence: start at phase 0 (teacher rates only) and run the discrimination practice on the Teach sheet before any rating depends on the student.');
  if(/pictures|read aloud/.test(m.r_read||'')&&!S.chk.pict)out.push('The student needs pictures: tick <b>Pictorial sheet</b> on the System sheet so the faces and period pictures print.');
  if(m.r_pa==='No')out.push('No reinforcer assessment: run a brief MSWO (Form PA-1) before the first day, or the goal will be set against a reward that may not be one.');
  if(m.func==='Automatic')out.push('An automatically maintained behavior does not respond to a point sheet on its own; the sheet can track a replacement behavior while the plan treats the function.');
  if(S.chk.pict&&S.tg.length>4)out.push('A pictorial sheet with '+S.tg.length+' targets is dense: the original Self &amp; Match sheets carry fewer targets with larger cells. Drop to four, or print the student-size sheet and let it run to two pages.');
  if(S.sys==='cico'&&/Escape|Automatic/.test(m.func||''))out.push('Check-in / check-out works best when the behavior is maintained by adult attention (March &amp; Horner, 2002; Hawken et al., 2014); for an escape function add a break request and a demand change from the plan, or choose another system.');
  const gr=parseInt(m.grade,10);if(gr>=6&&!S.chk.pocket&&['match','contract','cico'].includes(S.sys))out.push('A middle or high school student may prefer the pocket card (System sheet): the same system on an index card with no pictures.');
  const sv=$('#sysVerdict');if(sv)sv.innerHTML=(S.chk.pict&&S.tg.length>4)?'<div class="verdict v-mid">Pictorial sheet with more than four targets: the cells will be small. Four or fewer reads best; or tick the student-size print.</div>':'';
  $('#setupVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':(m.client?'<div class="verdict v-ok"><b>Ready to design.</b> Targets next, then the system and the goal.</div>':'');
}

/* v22.63 a variable cue from a list (Bancroft & Bourret, 2008, make a new list of values for each session): n lengths from
   about a third of the average to about twice it (1 to 6 minutes at an average of 3), skewed so the median sits below the
   average (the long ones spread out), whose mean is the average exactly (to the second); shuffled by the day and S.meta.iv_seed, so the adult's list and the iPad's timer agree */
function smCueList(n,avg,seedStr){n=Math.max(2,Math.min(60,Math.round(n||10)));avg=avg>0?avg:3;const lo=avg/3,hi=2*avg,v=[];
  for(let i=0;i<n;i++)v.push(lo+(hi-lo)*Math.pow((i+0.5)/n,1.5));
  const m=v.reduce((a,b)=>a+b,0)/n,k=(avg-lo)/(m-lo),w=v.map(x=>Math.round((lo+(x-lo)*k)*60));
  w[w.length-1]+=Math.round(avg*60*n)-w.reduce((a,b)=>a+b,0);
  let h=2166136261;for(const c of String(seedStr||''))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
  const r=()=>{h=(h+0x6D2B79F5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  for(let i=w.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[w[i],w[j]]=[w[j],w[i]];}
  return w;}
function smCueToday(){const d=new Date(),ds=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();return smCueList(num(S.meta.iv_n)||10,num(S.meta.iv_len)||3,ds+'|'+(S.meta.iv_seed||''));}
const smMS=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function renderCueList(){const box=document.getElementById('ivCueList');if(!box)return;
  if(!/^Variable/.test(S.meta.iv_timing||'')){box.innerHTML='';return;}
  const w=smCueToday(),avg=num(S.meta.iv_len)||3;let t=0;const at=w.map(s=>smMS(t+=s));
  box.innerHTML='<b>Today&rsquo;s cue times</b>, from the start of the session (for the adult; keep them out of the student&rsquo;s sight): '+at.join(', ')+
    '<br><span class="smr-mute">Lengths: '+w.map(smMS).join(', ')+' &mdash; from '+smMS(Math.min(...w))+' to '+smMS(Math.max(...w))+', averaging '+smMS(Math.round(avg*60))+' exactly. The iPad&rsquo;s cue timer follows the same list.</span> '+
    '<button type="button" class="tool" id="ivCueNew">New order</button>';}
document.addEventListener('click',e=>{if(e.target&&e.target.id==='ivCueNew'){S.meta.iv_seed=String((+S.meta.iv_seed||0)+1);renderCueList();const f=document.querySelector('[data-m="iv_timing"]');if(f)f.dispatchEvent(new Event('change',{bubbles:true}));}});   /* the change marks the case unsaved */

/* ---------------- the student's sheet ---------------- */
function sheetTitle(){if(S.meta.sh_title)return S.meta.sh_title;const n=S.meta.nick||S.meta.client||'My';const poss=n==='My'?'My':n+'’s';
  return{match:poss+' Self & Match Sheet',contract:poss+' Self-Monitoring Contract',rubric:poss+' Point Sheet',interval:poss+' On-Task Check',interlock:'Self-Monitoring with an Interlocking Schedule',smiley:poss+' Self-Monitoring',perf:poss+' Work Count',cico:poss+' Daily Progress Report'}[S.sys]||poss+' Sheet';}
function tgHead(t,i,span){const q=S.tg[i];return '<th class="q" colspan="'+(span||1)+'">'+(S.chk.pict&&!S.chk.pocket?pic(q,'ic'):'')+'<b>'+esc(q.word||('Target '+(i+1)))+'</b>'+(q.cue?'<span class="cue">• '+esc(q.cue)+'</span>':'')+'</th>';}
function perCell(p,i){return '<td class="per">'+esc(p.t?fmtHM(p.t)+' ':'')+esc(p.label||('Period '+(i+1)))+(S.chk.pict&&!S.chk.pocket?pic(p,'ic'):'')+'</td>';}
const yn=()=>smRateKey()!=='auto'?smRateCell(S.chk.pocket?14:20):S.chk.pict&&!S.chk.pocket?face(true)+face(false):'<div class="yn">YES<br>NO</div>';
/* v21.45 a rating style chosen on the Design page replaces the sheet type's own marks */
const smC=def=>smRateKey()!=='auto'?smRateCell(S.chk.pocket?14:20):def;
const circles=n=>Array.from({length:n},(_,i)=>'<span class="circ">'+(i+1)+'</span>').join('');
function sheetHead(extra){const m=S.meta,p=possible();
  const goal=m.goal_txt||(p.need!=null?'If I earn '+p.need+' of '+p.poss+' '+p.unit+', I earn my reward.':'');
  return '<div class="sm-head"><div><div class="sm-line">Name: <span class="bl">'+esc(m.client||'')+'</span> &nbsp; Date: <span class="bl" style="min-width:110px">'+esc(m.sh_date||'')+'</span></div>'+
    '<div class="sm-title">'+esc(sheetTitle())+'</div>'+(goal?'<div class="sm-line">'+esc(goal)+'</div>':'')+
    '<div class="sm-line">Reward I’m working for: <span class="bl">'+esc(m.sh_reward||'')+'</span></div></div>'+(extra||'')+(typeof smPhoto==='function'?smPhoto(S.chk.pocket?44:68,'classic'):'')+'</div>';}   /* v21.48 the photo, when the Design page shows it */
function matchKey(){const k=mp();const f=(y)=>S.chk.pict&&!S.chk.pocket?face(y,'face'):(y?'Yes':'No');
  if(S.chk.pocket)return '<div class="sm-line" style="font-size:10px">Points: both Yes '+k.yy+' · both No '+k.nn+' · mismatch '+k.yn+(k.ny!==k.yn?' / '+k.ny:'')+'</div>';
  return '<table class="key"><tr><th>If student says</th><th>If teacher says</th><th>Points</th></tr><tr><td>'+f(true)+'</td><td>'+f(true)+'</td><td>'+k.yy+'</td></tr><tr><td>'+f(false)+'</td><td>'+f(false)+'</td><td>'+k.nn+'</td></tr><tr><td>'+f(true)+'</td><td>'+f(false)+'</td><td>'+k.yn+'</td></tr>'+(k.ny!==k.yn?'<tr><td>'+f(false)+'</td><td>'+f(true)+'</td><td>'+k.ny+'</td></tr>':'')+'</table>';}
function graphStrip(){ /* a bar per day the student colors in; the goal line drawn */
  const g=num(S.meta.goal);const W=520,H=142,L=52,B=30,T=10;   /* v22.20 (review F483) the labels at 16-17 units print at 9 pt or more beside the evaluation box (10 and 11 printed at 5.9 and 6.5 pt there) */const X=i=>L+i*((W-L-10)/5),bw=(W-L-10)/5-10,Y=v=>T+(H-T-B)*(1-v/100);
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="My week: a bar for each day">';
  [0,25,50,75,100].forEach(p=>{s+='<line x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-10)+'" y2="'+Y(p)+'" stroke="#bbb" stroke-width="1"/><text x="'+(L-4)+'" y="'+(Y(p)+4)+'" font-size="16" text-anchor="end" fill="#333" font-family="system-ui,sans-serif">'+p+'%</text>';});
  DAYS.forEach((d,i)=>{s+='<rect x="'+(X(i)+5)+'" y="'+T+'" width="'+bw+'" height="'+(H-T-B)+'" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="'+(X(i)+5+bw/2)+'" y="'+(H-6)+'" font-size="17" text-anchor="middle" fill="#111" font-family="system-ui,sans-serif">'+d.slice(0,3)+'</text>';});
  if(g!=null)s+='<line x1="'+L+'" y1="'+Y(g)+'" x2="'+(W-10)+'" y2="'+Y(g)+'" stroke="#9b4e15" stroke-width="2.5" stroke-dasharray="6 4"/><text x="'+(W-12)+'" y="'+(Y(g)-4)+'" font-size="16" text-anchor="end" fill="#9b4e15" font-family="system-ui,sans-serif">my goal '+g+'%</text>';
  return '<div class="graph"><b>My week: color the bar up to my percent</b>'+s+'</svg><button type="button" class="tool noprint sm-png">Save graph as image</button></div>';}
function evalBox(){return '<div class="evalbox"><b>My goal today:</b> <span class="bl" style="min-width:240px">'+esc(S.meta.smp_goal||'')+'</span> &nbsp; <b>I met it:</b> &nbsp;YES &nbsp;/&nbsp; NO<br><b>What helped me:</b> <span class="bl" style="min-width:60%"></span><br><b>Next time I will:</b> <span class="bl" style="min-width:60%"></span></div>';}
function tearOff(){const m=S.meta;return '<div class="tear"><span class="cut">✂ tear here, send home, bring back signed</span><br><b>Home note</b> &nbsp; '+esc(m.client||'')+' &nbsp; Date: <span class="bl" style="min-width:90px"></span><br>Today I earned <span class="bl" style="min-width:50px"></span> of <span class="bl" style="min-width:50px"></span> '+esc(possible().unit)+'. I <b>did</b> / <b>did not</b> meet my goal. My reward was: <span class="bl" style="min-width:160px"></span><br>Teacher: <span class="bl" style="min-width:140px"></span> &nbsp; Parent signature: <span class="bl" style="min-width:160px"></span> &nbsp; One good thing from today: <span class="bl" style="min-width:220px"></span>'+(smLangLine()?'<br>'+smLangLine():'')+'</div>';}
function sheetFoot(opts){const m=S.meta,p=possible();const g=p.g!=null?'GOAL: '+pct(p.g):'';opts=opts||{};
  return '<div class="sm-foot"><div><b>I earned <span class="bl" style="min-width:60px"></span> '+esc(opts.unit||'points')+'. I <i>DID</i> or <i>DID NOT</i> earn my reward.</b>'+
    (m.when?'<div class="sm-line" style="font-size:11px">Reward time: '+esc(m.when)+'</div>':'')+
    '<div class="sm-line">Teacher initials: <span class="bl" style="min-width:80px"></span> Student initials: <span class="bl" style="min-width:80px"></span></div></div>'+
    '<div class="src">'+esc(g)+(opts.src?'<br>'+opts.src:'')+'<br>Form SM-1</div></div>'+((S.chk.eval||S.chk.graph)&&!S.chk.pocket?'<div class="extras">'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+'</div>':'')+(S.chk.home&&!S.chk.pocket?tearOff():'');}
function rrKey(){return /one reminder/.test(S.meta.t_rem||'')&&!S.chk.pocket?'<div class="legend"><b>R R</b> in the teacher&rsquo;s box: one tally per reminder given; a Yes allows one reminder.</div>':'';}
function renderSheet(){
  const out=$('#sheetOut');out.className=(S.chk.big?'sm-big ':'')+(S.chk.pocket&&['match','contract','cico'].includes(S.sys)?'sm-pocket':'');
  if(!S.sys){out.innerHTML='<p class="hint">Choose a system on the System sheet; the student’s sheet appears here.</p>';return;}
  const T=S.tg,P=S.per,rem=/one reminder/.test(S.meta.t_rem||'');
  let h='';const warn=S.chk.pict&&!S.chk.pocket&&T.length>4?'<div class="warn">Pictorial sheet with '+T.length+' targets: four or fewer reads better for a young student.</div>':'';
  if(S.sys==='match'){
    h=sheetHead(matchKey())+rrKey()+'<table class="sm"><thead><tr><th rowspan="2" style="width:13%"></th>'+T.map((t,i)=>tgHead(t,i,2)).join('')+'<th colspan="3" style="width:16%">Number of points</th></tr>'+
      '<tr>'+T.map(()=>'<th>Student</th><th class="t">Teacher</th>').join('')+'<th>Yes match</th><th>No match</th><th>Total</th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+yn()+'</td><td class="t">'+yn()+(rem?'<div class="rr">R R</div>':'')+'</td>').join('')+'<td></td><td></td><td class="tot"></td></tr>').join('')+
      '<tr class="totals"><td colspan="'+(1+T.length*2)+'">Total</td><td class="w"></td><td class="w"></td><td class="w"></td></tr></tbody></table>'+sheetFoot({src:'After Salter &amp; Croce (2006)'});
  }else if(S.sys==='contract'){
    if(S.chk.weekly){
      const legend='<div class="legend">'+T.map((t,i)=>'<b>'+(i+1)+' = '+esc(t.word||('Target '+(i+1)))+'</b>').join('')+' &nbsp; Tick the box when you did it; the teacher initials the day.</div>';
      h=sheetHead()+legend+'<table class="sm wk"><thead><tr><th style="width:16%">Period</th>'+DAYS.map(d=>'<th>'+d+'<br><span style="font-weight:400;font-size:10.5px">Date ______</span></th>').join('')+'</tr></thead><tbody>'+
        P.map((p,i)=>'<tr>'+perCell(p,i)+DAYS.map(()=>'<td class="wkc">'+T.map((t,ti)=>'<span class="box"></span>'+(ti+1)+' ').join('')+'</td>').join('')+'</tr>').join('')+
        '<tr><td class="per">Teacher initials</td>'+DAYS.map(()=>'<td style="height:26px"></td>').join('')+'</tr>'+
        '<tr class="totals"><td>Checks (of '+(P.length*T.length)+')</td>'+DAYS.map(()=>'<td class="w"></td>').join('')+'</tr><tr class="totals"><td>Week total</td><td class="w" colspan="5"></td></tr></tbody></table>'+sheetFoot({unit:'checks'});
    }else{
      h=sheetHead()+'<table class="sm sm-contract"><thead><tr><th style="width:16%">Period</th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th style="width:11%">Teacher initials</th></tr></thead><tbody>'+
        P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td class="chk">'+smC(S.chk.pict&&!S.chk.pocket?face(true)+face(false):'<span class="mbox" style="margin:0"></span>')+'</td>').join('')+'<td></td></tr>').join('')+
        '<tr class="totals"><td>Total checks</td>'+T.map(()=>'<td class="w"></td>').join('')+'<td class="w"></td></tr></tbody></table>'+sheetFoot({unit:'checks'});
    }
  }else if(S.sys==='rubric'){
    const days=S.chk.weekly?DAYS:['Today'];const maxp=Math.max(...S.lv.map(l=>num(l.pts)||0));const n=S.lv.length;
    const cell=()=>S.chk.rubmatch?'<div class="rrow"><span class="who">Me</span>'+circles(n)+'</div><div class="rrow"><span class="who">Teacher</span>'+circles(n)+'<span class="mbox" title="match"></span></div>':'<div class="rrow">'+circles(n)+'</div>';
    h=sheetHead()+'<table class="sm rub" style="margin-bottom:8px"><thead><tr><th style="width:70%">Level</th><th>Points</th></tr></thead><tbody>'+S.lv.map((l,i)=>'<tr><td class="lv l'+(i+1)+'">'+esc(l.desc)+'</td><td>'+esc(l.pts)+'</td></tr>').join('')+'</tbody></table>'+
      '<div class="legend">Circle the level each period'+(S.chk.rubmatch?'; the teacher circles too, and ticks the box when the two match':'')+'.</div>'+
      '<table class="sm"><thead><tr><th style="width:16%">Period</th>'+days.map(d=>'<th>'+d+'<br><span style="font-weight:400;font-size:10.5px">Date ______</span></th>').join('')+'</tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+days.map(()=>'<td>'+cell()+'</td>').join('')+'</tr>').join('')+
      '<tr class="totals"><td>Total points (of '+(P.length*maxp)+')</td>'+days.map(()=>'<td class="w"></td>').join('')+'</tr>'+(S.chk.weekly?'<tr class="totals"><td>Week total</td><td class="w" colspan="5"></td></tr>':'')+'</tbody></table>'+sheetFoot();
  }else if(S.sys==='interval'){
    const n=num(S.meta.iv_n)||10,len=num(S.meta.iv_len)||3,q=S.meta.iv_q||'Was I working?';
    h=sheetHead('<table class="key"><tr><th>Cue</th><td>'+esc(S.meta.iv_cue||'timer')+(/^Variable/.test(S.meta.iv_timing||'')?' about every ':' every ')+len+' min'+(/^Variable/.test(S.meta.iv_timing||'')?' (varies)':'')+'</td></tr><tr><th>Activity</th><td>'+esc(S.meta.iv_act||'')+'</td></tr><tr><th>Teacher matches</th><td>'+esc(S.meta.iv_match||'')+'</td></tr></table>')+
      '<div class="sm-dir">When the cue comes, ask yourself <b>'+esc(q)+'</b> and circle the answer. Then go straight back to work.</div>'+
      '<table class="sm"><thead><tr><th style="width:10%">Interval</th><th style="width:12%">'+(/^Variable/.test(S.meta.iv_timing||'')?'Minute<br><span style="font-weight:400;font-size:10px">write it in</span>':'Minute')+'</th><th>'+esc(q)+'<br><span style="font-weight:400">Student</span></th><th class="t">Teacher</th><th style="width:14%">Match</th></tr></thead><tbody>'+
      Array.from({length:n},(_,i)=>'<tr><td>'+(i+1)+'</td><td>'+(/^Variable/.test(S.meta.iv_timing||'')?'':((i+1)*len))+'</td><td>'+yn()+'</td><td class="t">'+yn()+'</td><td></td></tr>').join('')+
      '<tr class="totals"><td colspan="2">Yes answers</td><td class="w">___ of '+n+' = ___%</td><td class="w">___ of '+n+'</td><td class="w">___ of ___</td></tr></tbody></table>'+sheetFoot({unit:'intervals'});
  }else if(S.sys==='interlock'){
    const rows=ilRows(),dir=S.meta.il_dir||'dec',unit=S.meta.il_unit==='min'?'minutes of engagement':'items';
    const every=num(S.meta.il_every)??2,step=num(S.meta.il_step)??2,init=num(S.meta.il_init)??20;
    h='<div class="sm-head"><div><div class="sm-title">Self-Monitoring with an Interlocking Schedule of Reinforcement</div><div class="sm-line"><b>'+(dir==='inc'?'Increasing requirement as time elapses: preventing slow responding and improving fluency':'Decreasing requirement as time elapses: preventing ratio strain and improving quality')+'</b></div>'+
      '<div class="sm-line">Name: <span class="bl">'+esc(S.meta.client||'')+'</span> Date: <span class="bl" style="min-width:100px">'+esc(S.meta.sh_date||'')+'</span> Task: <span class="bl">'+esc(S.meta.il_task||'')+'</span></div></div></div>'+
      '<div class="sm-dir"><b>Directions</b><ol><li><b>Start the task.</b> Start a stopwatch the moment the student begins. The initial requirement to earn the reinforcer is <b>'+init+' '+esc(unit)+'</b>.</li>'+
      '<li><b>Check engagement every minute.</b> At the end of each minute the student circles Yes or No under Self-check for their own on-task behavior; the staff member independently circles Yes or No under Teacher-check, and writes the '+esc(unit)+' done so far.</li>'+
      '<li><b>Track the interlocking requirement.</b> For every '+every+' full minute'+(every===1?'':'s')+' that elapse the requirement '+(dir==='inc'?'rises':'falls')+' by '+step+(dir==='inc'?', so finishing sooner costs less.':', so taking time for quality costs nothing.')+'</li>'+
      '<li><b>Deliver the reinforcer.</b> The session ends when both conditions are met at the same minute: the '+esc(unit)+' done reach the number required at that minute, and the student and the teacher both circled Yes. Tick the box, praise the pacing and the quality, and deliver the reinforcer at once.</li></ol></div>'+
      '<table class="sm sm-il"><thead><tr><th colspan="2">Task engagement</th><th colspan="3">Two conditions</th><th rowspan="2" style="width:12%">Both conditions met</th></tr><tr><th class="t">Teacher-check</th><th>Self-check</th><th>Minutes elapsed</th><th>'+esc(unit)+' done</th><th>'+esc(unit)+' required</th></tr></thead><tbody>'+
      rows.map(r=>'<tr><td class="t"><span class="yes">Yes</span> &nbsp; <span class="no">No</span></td><td><span class="yes">Yes</span> &nbsp; <span class="no">No</span></td><td>'+r.t+'</td><td></td><td class="req">'+r.req+'</td><td><span style="display:inline-block;width:16px;height:16px;border:1.5px solid #111"></span></td></tr>').join('')+
      '</tbody></table><div class="sm-line" style="margin-top:8px">Comments: <span class="bl" style="min-width:80%"></span></div><div class="sm-foot"><div></div><div class="src">After the school’s session sheet (pp. 64–70) · Form SM-1</div></div>';
  }else if(S.sys==='smiley'){
    const inrow=S.meta.sm_inrow||'2',earn=(S.meta.sm_earn||'').split('\n').map(x=>x.trim()).filter(Boolean),tiers=(S.meta.sm_tiers||'').split('\n').map(x=>x.trim()).filter(Boolean);
    h='<div class="sm-head"><div><div class="sm-line">Name: <span class="bl">'+esc(S.meta.client||'')+'</span></div><div class="sm-title">'+esc(sheetTitle())+'</div><div class="sm-line">Date: <span class="bl" style="min-width:110px">'+esc(S.meta.sh_date||'')+'</span></div></div></div>'+
      '<div style="display:flex;gap:12px;align-items:flex-start"><table class="sm" style="flex:1"><thead><tr><th style="width:18%">Schedule</th><th colspan="'+T.length+'">I should be…</th><th style="width:9%">'+esc(inrow)+' in a row?</th></tr><tr><th></th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th></th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+smC(face(true,'face'))+'</td>').join('')+'<td><span class="mbox" style="margin:0"></span></td></tr>').join('')+
      '<tr class="totals"><td>Day’s total</td>'+T.map(()=>'<td class="w">____ / '+P.length+' = ____%</td>').join('')+'<td class="w"></td></tr>'+
      '<tr class="totals"><td>Goal</td>'+T.map(t=>'<td class="w">'+(t.goal?esc(t.goal)+'%':'______%')+'</td>').join('')+'<td class="w"></td></tr></tbody></table>'+
      '<div style="width:30%;border:1.5px solid #111;padding:8px;font-size:12px"><div style="font-weight:700;text-align:center;border-bottom:1.5px solid #111;padding-bottom:4px;margin-bottom:6px">'+esc(inrow)+' in a row<br>I can earn…</div>'+(earn.length?earn.map(e=>'<div style="padding:2px 0;border-bottom:1px dotted #999">'+esc(e)+'</div>').join(''):'<div style="color:#666">(list the earns on the Reinforcement sheet)</div>')+'<div style="padding:2px 0">Other: ________</div></div></div>'+
      '<div class="sm-line" style="margin-top:8px"><b>Total smiley faces earned: ______</b></div>'+
      '<div style="display:flex;gap:12px;align-items:flex-start;margin-top:6px"><table class="key"><tr><th colspan="2">End of the day rewards</th></tr>'+(tiers.length?tiers.map(t=>{const m=/^(\S+)\s+(.*)$/.exec(t);return '<tr><td><b>'+esc(m?m[1]:t)+'</b></td><td>'+esc(m?m[2]:'')+'</td></tr>';}).join(''):'<tr><td>10+</td><td>________</td></tr><tr><td>16+</td><td>________</td></tr>')+'</table>'+
      '<div style="font-size:12.5px">Teacher initials: ________<br>Student initials: ________'+(S.chk.home?'<br>Parent initials: ________':'')+'</div></div>'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+(S.chk.home?tearOff():'')+'<div class="sm-foot"><div></div><div class="src">After the school’s self-monitoring sheets · Form SM-1</div></div>';
  }else if(S.sys==='perf'){
    const n=Math.max(1,Math.min(10,num(S.meta.pf_n)||5)),mins=S.meta.pf_min||'',goal=num(S.meta.pf_goal),top=Math.max(goal||0,num(S.meta.pf_max)||20),what=S.meta.pf_what||'items',corr=S.meta.pf_kind==='correct',week=S.meta.pf_span==='week';
    const labels=week?DAYS.slice(0,n):Array.from({length:n},(_,i)=>'Session '+(i+1));
    /* the student's graph: one column per session, the count axis, the goal line */
    const W=520,H=200,L=36,B=24,T=10,cw=(W-L-10)/n;const Y=v=>T+(H-T-B)*(1-v/top);
    let g='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="My count graph">';
    const ticks=[];for(let v=0;v<=top;v+=Math.max(1,Math.round(top/5)))ticks.push(v);if(ticks[ticks.length-1]!==top)ticks.push(top);
    ticks.forEach(v=>{g+='<line x1="'+L+'" y1="'+Y(v)+'" x2="'+(W-10)+'" y2="'+Y(v)+'" stroke="#bbb"/><text x="'+(L-4)+'" y="'+(Y(v)+4)+'" font-size="10" text-anchor="end" fill="#333" font-family="system-ui,sans-serif">'+v+'</text>';});
    labels.forEach((d,i)=>{g+='<rect x="'+(L+i*cw+6)+'" y="'+T+'" width="'+(cw-12)+'" height="'+(H-T-B)+'" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="'+(L+i*cw+cw/2)+'" y="'+(H-7)+'" font-size="10.5" text-anchor="middle" fill="#111" font-family="system-ui,sans-serif">'+esc(week?d.slice(0,3):String(i+1))+'</text>';});
    if(goal!=null)g+='<line x1="'+L+'" y1="'+Y(goal)+'" x2="'+(W-10)+'" y2="'+Y(goal)+'" stroke="#9b4e15" stroke-width="2.5" stroke-dasharray="6 4"/><text x="'+(W-12)+'" y="'+(Y(goal)-4)+'" font-size="10" text-anchor="end" fill="#9b4e15" font-family="system-ui,sans-serif">my goal: '+goal+'</text>';
    g+='</svg>';
    h=sheetHead('<table class="key"><tr><th>I count</th><td>'+esc(what)+'</td></tr><tr><th>Each session</th><td>'+esc(mins?mins+' minutes':'')+'</td></tr><tr><th>My goal</th><td>'+(goal!=null?goal+' '+esc(what):'')+'</td></tr></table>')+
      '<div class="sm-dir">When the timer rings, count your '+esc(what)+', write the number, and color the bar on the graph up to that number. Then circle whether you reached your goal.</div>'+
      '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap"><table class="sm" style="flex:1;min-width:280px"><thead><tr><th style="width:26%">'+(week?'Day':'Session')+'</th><th>Minutes</th><th>'+esc(what)+' done</th>'+(corr?'<th>Correct</th>':'')+'<th>Goal reached?</th><th class="t">Teacher check</th></tr></thead><tbody>'+
      labels.map(d=>'<tr><td class="per">'+esc(d)+'</td><td>'+esc(mins)+'</td><td style="height:30px"></td>'+(corr?'<td></td>':'')+'<td class="yn">YES &nbsp; NO</td><td class="t"></td></tr>').join('')+
      '<tr class="totals"><td>Sessions at goal</td><td class="w" colspan="'+(corr?5:4)+'">____ of '+n+'</td></tr></tbody></table><div class="graph" style="flex:1;min-width:300px;margin-top:0"><b>My graph: color each bar up to my count</b>'+g+'<button type="button" class="tool noprint sm-png">Save graph as image</button></div></div>'+sheetFoot({unit:'sessions at goal'});
  }else if(S.sys==='cico'){
    const key=S.meta.ci_key||'2 = Yes, met the expectation · 1 = Partly, with a reminder · 0 = No',goal=num(S.meta.ci_goal)??80,poss=P.length*T.length*2;
    h=sheetHead('<table class="key"><tr><th>Points</th><td style="text-align:left">'+esc(key)+'</td></tr><tr><th>Daily goal</th><td>'+goal+'% ('+Math.ceil(poss*goal/100)+' of '+poss+' points)</td></tr><tr><th>Mentor</th><td>'+esc(S.meta.ci_mentor||'')+'</td></tr></table>')+
      '<div class="inout"><div><b>Check-in '+esc(S.meta.ci_in?'· '+S.meta.ci_in.split(';')[0]:'')+'</b>Mentor initials: <span class="bl" style="min-width:60px"></span> &nbsp; Card and materials ready: YES / NO<br>My goal today: <span class="bl" style="min-width:60%"></span></div>'+
      '<div><b>Check-out '+esc(S.meta.ci_out?'· '+S.meta.ci_out.split(';')[0]:'')+'</b>Points earned: <span class="bl" style="min-width:50px"></span> of '+poss+' = <span class="bl" style="min-width:50px"></span>% &nbsp; Goal met: YES / NO<br>Mentor initials: <span class="bl" style="min-width:60px"></span> &nbsp; Reward: <span class="bl" style="min-width:140px"></span></div></div>'+
      '<table class="sm cico"><thead><tr><th style="width:18%">Period</th>'+T.map((t,i)=>tgHead(t,i,1)).join('')+'<th style="width:11%">Teacher initials</th></tr></thead><tbody>'+
      P.map((p,i)=>'<tr>'+perCell(p,i)+T.map(()=>'<td>'+smC('<span class="sc">0 1 2</span>')+'</td>').join('')+'<td></td></tr>').join('')+
      '<tr class="totals"><td>Points</td>'+T.map(()=>'<td class="w">____ of '+(P.length*2)+'</td>').join('')+'<td class="w"></td></tr></tbody></table>'+
      '<div class="sm-line" style="margin-top:6px">Teacher comment (one line, something that went well): <span class="bl" style="min-width:60%"></span></div>'+
      sheetFoot({src:'After the Behavior Education Program card (Crone, Hawken &amp; Horner, 2010)'})+(S.meta.ci_home&&/^Yes/.test(S.meta.ci_home)&&!S.chk.home&&!S.chk.pocket?tearOff():'');
  }
  if(S.chk.pocket&&['match','contract','cico'].includes(S.sys)){const body=h.replace(/<div class="sm-foot">[\s\S]*$/,'').replace(/<div class="inout">[\s\S]*?<\/div><\/div>/,'');const card='<div class="card">'+body+'<div class="sm-line" style="margin-top:4px">I earned ____ · Goal met: Y / N · Teacher: ______ · Student: ______'+(S.sys==='cico'?' · Check-in: ____ Check-out: ____':'')+'</div></div>';h=card+card;}
  out.innerHTML=warn+h;
}

/* ---------------- the contract document ---------------- */
function renderBc(){
  const m=S.meta,out=$('#bcOut');if(!out)return;const bl=(w)=>'<span class="bl" style="min-width:'+(w||120)+'px"></span>';
  const st=m.bc_student||m.client||'',tc=m.bc_teacher||'',pa=m.bc_parent||'';
  const v=(k,w)=>m[k]?esc(m[k]):bl(w);
  let h='<h3>Behavior Contract</h3><div class="sub">between '+(st?esc(st):bl(140))+(tc?' and '+esc(tc):'')+(pa?' and '+esc(pa):'')+'</div>';
  h+='<h4>What I will do</h4><div class="clause"><p>'+(m.bc_task?esc(m.bc_task):'I, '+bl(140)+', agree to '+bl(300)+'.')+'</p><p><b>How much, how well:</b> '+v('bc_how',240)+'</p><p><b>When and where:</b> '+v('bc_when',240)+'</p><p><b>Who records it:</b> '+v('bc_record',240)+'</p></div>';
  h+='<h4>What I earn</h4><div class="clause"><p><b>Reward:</b> '+v('bc_rw',240)+' &nbsp; <b>How much:</b> '+v('bc_rwmuch',120)+'</p><p><b>When:</b> '+v('bc_rwwhen',200)+' &nbsp; <b>From:</b> '+v('bc_rwwho',140)+'</p>'+(m.bc_bonus?'<p><b>Bonus:</b> '+esc(m.bc_bonus)+'</p>':'')+'</div>';
  h+='<h4>What the adults will do</h4><div class="clause"><p>'+v('bc_adult',300)+'</p></div>';
  h+='<h4>If the task is not done</h4><div class="clause"><p>'+(/^A stated/.test(m.bc_pen||'')&&m.bc_pentext?esc(m.bc_pentext):'Nothing is earned that day, and nothing already earned is taken away. The contract starts again the next day.')+'</p>'+
    (/^A stated/.test(m.bc_pen||'')?'<p><b>Agreed in the BIP dated</b> '+v('bc_penbip',110)+' (Form TD-1), with the parent&rsquo;s informed consent.</p>':'')+'</div>';   /* v22.7x (review F263) */
  h+='<h4>Changing the contract</h4><div class="clause"><p>'+(m.bc_renego?esc(m.bc_renego):'Either of us may ask for a meeting to change the contract. Changes are written here and signed again; nobody changes it alone.')+' Review date: '+v('bc_review',110)+'.</p></div>';
  h+='<h4>Task record</h4><table class="ct"><tr><th style="width:14%">Date</th><th>Task done (initials)</th><th>Reward given (initials)</th><th>Date</th><th>Task done (initials)</th><th>Reward given (initials)</th></tr>'+Array.from({length:7},()=>'<tr><td style="height:22px"></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')+'</table>';
  h+='<div class="sig"><div>Student: '+esc(st)+'<br>Signature and date</div><div>Teacher: '+esc(tc)+'<br>Signature and date</div>'+(pa?'<div>Parent: '+esc(pa)+'<br>Signature and date</div>':'')+'<div>Witness<br>Signature and date</div></div>';
  /* v22.7x (review I135, F264): the student's assent, and the family's language and interpreter on the parent's copy, when known */
  if(m.bc_assent)h+='<p class="sub" style="margin-top:8px"><b>The student&rsquo;s assent:</b> '+esc(m.bc_assent.toLowerCase())+(smCaseF&&smCaseF.student&&smCaseF.student.date?' (Form SI-1, '+esc(smMDY(smCaseF.student.date))+')':'')+'; asked again at each review date.</p>';
  const lg=smLangLine();if(pa&&lg)h+='<p class="sub">'+lg+'</p>';
  h+='<p class="sub" style="margin-top:10px">Starts '+esc(m.bc_start||'________')+' · '+(m.bc_voice?esc(m.bc_voice)+' · ':'')+'After Homme, Csanyi, Gonzales &amp; Rechs (1970) · Form SM-1</p>';
  out.innerHTML=h;
}

/* ---------------- the record ---------------- */
/* v22.7x (review F258): a row holds the points, what the student earned (the reward measure), and the behavior: the share of
   the teacher's ratings that were Yes (beh; with a style of more levels, the teacher's mean level as a share of the top), the
   teacher's No ratings and how many of them the student matched (tno, nom), the student's own Nos (sno), the behavior per
   target (bgp) and the periods assumed met at fading step 2 (asm). The iPad writes them all; on paper Behavior % is typed.
   A sheet with no teacher rating (contract, expectations and earns, the rubric rated by the student alone, the performance
   count) has no behavior measure: its points are the student's own rating, and the Record says so. Check-in/check-out is
   rated by the adult alone, so its points are the behavior measure.
   (F259) A day's goal is met when its points reach that day's goal: worked out, not ticked; the tick stands only on a row
   without points. A teacher-only day (phase 0) earns no points and has no goal to meet. */
function rows(){return S.log.map(r=>({...r,p:num(r.pts),q:num(r.poss),m:num(r.m),n:num(r.n),g:num(r.goal),ph:String(r.ph||''),tp:String(r.tgp||'').split(',').map(x=>num(x)),
    b:num(r.beh),tno:num(r.tno),nom:num(r.nom),sno:num(r.sno),asm:num(r.asm),bp:String(r.bgp||'').split(',').map(x=>num(x))}))
  .map(r=>{const pc=r.p!=null&&r.q?r.p/r.q*100:null;return {...r,pc,ag:r.m!=null&&r.n?r.m/r.n*100:null,b:r.b!=null?r.b:S.sys==='cico'?pc:null,
    mt:r.ph==='0'?null:pc!=null&&r.g!=null?pc>=r.g-1e-9:!!r.met};});}
function smHasT(){return S.sys==='match'||S.sys==='interval'||S.sys==='cico'||(S.sys==='rubric'&&!!S.chk.rubmatch);}
function smMatched(){return ['match','interval','interlock'].includes(S.sys)||(S.sys==='rubric'&&!!S.chk.rubmatch);}
const smMean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
/* (F259, F261) the rules on the Reinforcement sheet, read as "N of the last M" (defaults 4 of 5 to raise, fewer than 2 of 5 to
   lower), the days each new goal is held before any change (3), the step and the ceiling */
function smRuleN(txt,def){const m=String(txt||'').match(/(\d+)\s+of\s+(?:the\s+)?(?:last\s+)?(\d+)/i);if(!m)return def;const n=+m[1],w=+m[2];return n>0&&w>=n&&w<=20?[n,w]:def;}
function smTH(){const up=smRuleN(S.meta.cc_up,[4,5]),dn=smRuleN(S.meta.cc_down,[2,5]),h=num(S.meta.cc_hold),st=num(String(S.meta.cc_step||'').replace(/^[^\d]*/,''));
  return {upN:up[0],upW:up[1],dnN:dn[0],dnW:dn[1],hold:h!=null&&h>=1&&h<=20?Math.round(h):3,step:st!=null&&st>0&&st<=50?st:5,cap:num(S.meta.cc_cap)};}
/* (F259, F261) the decision window: the days at the current goal and in the current ladder phase, from the day they began.
   Days at another goal or phase do not count; a goal or a phase changed on the Reinforcement or Teach sheet starts a new run. */
function smRun(R){const g=num(S.meta.goal),ph=curPhase(),T=R.filter(r=>r.ph!=='0'&&r.pc!=null);let k=T.length;
  while(k>0&&T[k-1].g===g&&(!ph||T[k-1].ph===ph))k--;
  const rows=T.slice(k);return {rows,g,ph,since:rows.length?String(rows[0].date||''):''};}
/* (F262) the points a day earns when the student rates honestly and the targets were met in b% of the periods: on Self & Match
   an agreed No pays too (both-Yes for each met period, both-No for the rest, of the top match points); a style of more levels
   pays the adult's level plus the bonus; other sheets pay the level itself. And back again. */
function smPtsAt(b){if(b==null)return null;if(S.sys!=='match')return b;const lv=typeof smRLv==='function'?smRLv():null;
  if(lv&&lv.length>2){const mx=Math.max(...lv.map(x=>x[1]))||1,bo=typeof smBonus==='function'?smBonus():1;return (b/100*mx+bo)/(mx+bo)*100;}
  const k=mp(),top=Math.max(k.yy,k.nn,k.yn,k.ny)||1;return (b*k.yy+(100-b)*k.nn)/top;}
function smBehAt(p){if(p==null)return null;if(S.sys!=='match')return p;const lv=typeof smRLv==='function'?smRLv():null;
  if(lv&&lv.length>2){const mx=Math.max(...lv.map(x=>x[1]))||1,bo=typeof smBonus==='function'?smBonus():1;return Math.max(0,Math.min(100,(p/100*(mx+bo)-bo)/mx*100));}
  const k=mp(),top=Math.max(k.yy,k.nn,k.yn,k.ny)||1;return k.yy===k.nn?null:Math.max(0,Math.min(100,(p*top-100*k.nn)/(k.yy-k.nn)));}
/* (F262) the baseline: the teacher-only days (phase 0), read as the behavior measure (a row from before v22.7x with points only
   is read as its percent of points). The first goal is set at a level the student reached on at least half of them (the
   middle day, the higher of two), in points as the sheet pays them, rounded down to 5; with how many baseline days meet it.
   No suggestion from fewer than 3 baseline days. */
function smBase(R){const B=R.filter(r=>r.ph==='0'),xs=B.map(r=>r.b!=null?{b:r.b,p:smPtsAt(r.b)}:r.pc!=null?{b:null,p:r.pc}:null).filter(Boolean);
  const bs=xs.filter(x=>x.b!=null).map(x=>x.b);let sug=null,met=0,bAt=null;
  if(xs.length>=3){const so=xs.slice().sort((a,b)=>b.p-a.p),mid=so[Math.ceil(so.length/2)-1];sug=Math.floor(mid.p/5)*5;met=xs.filter(x=>x.p>=sug-1e-9).length;bAt=smBehAt(sug);}
  return {days:B.length,n:xs.length,beh:bs.length===xs.length&&bs.length>0,bm:smMean(bs),pm:smMean(xs.map(x=>x.p)),sug,met,bAt};}
function renderRecord(){
  const R=rows(),v=$('#logVerdict'),M=$('#logMetrics'),RU=$('#logRules'),hasT=smHasT(),TH=smTH(),bs=smBase(R),run=smRun(R),ph=curPhase();
  const tx=R.filter(r=>r.ph!=='0'&&r.pc!=null),RR=run.rows,last=RR.slice(-TH.upW),met=last.filter(r=>r.mt).length;
  const PH=R.filter(r=>r.ph!=='0'&&r.pc!=null&&(!ph||r.ph===ph)),w5=PH.slice(-5),agr=w5.filter(r=>r.ag!=null),agm=smMean(agr.map(r=>r.ag));
  const noR=w5.filter(r=>r.tno!=null),tnoS=noR.reduce((s,r)=>s+r.tno,0),nomS=noR.reduce((s,r)=>s+(r.nom||0),0);
  const txb=tx.filter(r=>r.b!=null),bmean=smMean(txb.map(r=>r.b)),pmean=smMean(tx.map(r=>r.pc));
  const at=run.g!=null?pct(run.g):'—',since=run.since?' since '+run.since:'',inPh=run.ph?' in phase '+run.ph:'';
  M.innerHTML=`<div class="metric"><b>Baseline (teacher only)</b><div class="val">${bs.n?(bs.beh?pct(bs.bm):pct(bs.pm)):'—'}</div><div class="sub">${bs.days} teacher-only day${bs.days===1?'':'s'}${bs.n?(bs.beh?' · the targets met in that share of the teacher&rsquo;s ratings':' · percent of points'):''}${bs.sug!=null?' · suggested first goal '+bs.sug+'% of the points, met on '+bs.met+' of '+bs.n:''}</div></div>
    <div class="metric"><b>${hasT?'Behavior since self-rating began':'Points since self-rating began'}</b><div class="val">${hasT?(bmean!=null?pct(bmean):'—'):(pmean!=null?pct(pmean):'—')}</div><div class="sub">${hasT?(txb.length+' day'+(txb.length===1?'':'s')+' with the teacher&rsquo;s ratings'+(pmean!=null&&S.sys!=='cico'?' · '+pct(pmean)+' of the points':'')):tx.length+' day'+(tx.length===1?'':'s')+' · this sheet has no teacher rating: the points are the student&rsquo;s own'}</div></div>
    <div class="metric"><b>Goal met at the current goal</b><div class="val">${last.length?met+' of '+last.length:'—'}</div><div class="sub">${RR.length?(RR.length>last.length?'the last '+last.length+' of ':'')+RR.length+' school day'+(RR.length===1?'':'s')+' at '+at+inPh+esc(since):'current goal '+at+(run.ph?' · phase '+run.ph:'')+' · no days at it yet'}</div></div>
    <div class="metric"><b>Agreement, last 5 days</b><div class="val">${agm!=null?pct(agm):'—'}</div><div class="sub">${tnoS?'on the teacher&rsquo;s Nos: '+nomS+' of '+tnoS:'student and teacher ratings'}</div></div>`;
  const TM=$('#tgMetrics');if(TM){const last5=R.filter(r=>r.ph!=='0').slice(-5);TM.innerHTML=S.tg.map((t,i)=>{const bv=last5.map(r=>r.bp[i]).filter(x=>x!=null),vals=bv.length?bv:last5.map(r=>r.tp[i]).filter(x=>x!=null);const mn=smMean(vals);
    return '<div class="metric"><b>Target '+(i+1)+', last 5 days</b><div class="val">'+(mn!=null?pct(mn):'—')+'</div><div class="sub">'+esc(t.word||'')+(bv.length?' · teacher rated it met':vals.length?' · of the points':'')+(t.goal?' · goal '+esc(t.goal)+'%':'')+'</div></div>';}).join('');}
  if(!R.length){v.innerHTML='<div class="verdict v-mid"><b>No days yet.</b> Enter the teacher-only days as phase 0 (Behavior %: the share of the teacher&rsquo;s ratings that were Yes); the Record suggests a first goal from them.</div>';RU.innerHTML='';drawLog(R);return;}
  const rules=[];
  /* the baseline and the first goal (F262) */
  if(ph==='0'||!tx.length){
    if(bs.n>=3)rules.push(['mid','Baseline: '+bs.n+' teacher-only day'+(bs.n===1?'':'s')+(bs.beh?', the targets met in '+pct(bs.bm)+' of the teacher&rsquo;s ratings on average':', '+pct(bs.pm)+' of the points on average')+'. Suggested first goal: '+bs.sug+'% of the points, met on '+bs.met+' of the '+bs.n+' baseline days'+(bs.beh&&S.sys==='match'&&bs.bAt!=null?' (a student rating honestly earns it on a day with the targets met in about '+pct(bs.bAt)+' of the periods, since an agreed No pays too)':'')+'. Start phase 1 there.'+(ph==='0'||!ph?smChgBtn('start',bs.sug,'Set the first goal at '+bs.sug+'% and start phase 1','the baseline, '+bs.n+' teacher-only days; met on '+bs.met+' of them'):'')]);
    else rules.push(['mid',bs.n+' teacher-only day'+(bs.n===1?'':'s')+' so far: the first goal is suggested from 3 or more (3 to 5 school days, Teach sheet).']);
  }
  let change='';
  if(tx.length&&ph!=='0'){
    const g=run.g,atCap=TH.cap!=null&&g!=null&&g>=TH.cap,wD=RR.slice(-TH.dnW),metD=wD.filter(r=>r.mt).length;
    const upDue=RR.length>=TH.hold&&met>=TH.upN,dnDue=RR.length>=TH.hold&&metD+Math.max(0,TH.dnW-wD.length)<TH.dnN;
    const prevG=(()=>{const T=R.filter(r=>r.ph!=='0'&&r.pc!=null),i0=RR.length?T.indexOf(RR[0]):T.length;for(let k=i0-1;k>=0;k--){if(T[k].g!=null&&T[k].g!==g)return T[k].g;}return null;})();
    const down=g==null?null:prevG!=null&&prevG<g?prevG:Math.max(0,g-TH.step),up=g==null?null:TH.cap!=null?Math.min(TH.cap,g+TH.step):g+TH.step;
    const wtxt=n=>' of the last '+n+' school day'+(n===1?'':'s')+' at '+pct(g)+esc(since);
    if(g==null)rules.push(['mid','No goal on the Reinforcement sheet: the days cannot be judged against one.']);
    else if(!RR.length)rules.push(['mid','The goal is '+pct(g)+(run.ph?' in phase '+run.ph:'')+', with no school days at it yet: hold it for '+TH.hold+' school days before any change.']);
    else if(RR.length<TH.hold)rules.push(['mid',RR.length+' school day'+(RR.length===1?'':'s')+' at '+pct(g)+inPh+esc(since)+': hold. No change before '+TH.hold+' school days at this goal (Reinforcement sheet).']);
    else if(dnDue){change='down';rules.push(['no','Goal met on '+metD+wtxt(wD.length)+': lower the goal to '+pct(down)+', a level the student has reached, re-check the reward with a brief MSWO, and look at fidelity before anything else.'+smChgBtn('goal',down,'Lower it to '+pct(down),'goal met on '+metD+' of the last '+wD.length+' school days at '+pct(g))]);}
    else if(upDue&&atCap)rules.push(['ok','Goal met on '+met+wtxt(last.length)+': hold the goal at its ceiling ('+pct(TH.cap)+').']);
    else if(upDue){change='up';rules.push(['ok','Goal met on '+met+wtxt(last.length)+': raise the goal by the step, to '+pct(up)+(TH.cap!=null?' (ceiling '+pct(TH.cap)+')':'')+'.'+smChgBtn('goal',up,'Raise it to '+pct(up),'goal met on '+met+' of the last '+last.length+' school days at '+pct(g))]);}
    else rules.push(['mid','Goal met on '+met+wtxt(last.length)+': hold the goal'+(RR.length<TH.upW?' ('+RR.length+' school days at it so far; the rule looks at '+TH.upW+')':'')+'.']);
  }
  /* the matching ladder (F260, F261): judged only where the system has a teacher match; one change at a time, the goal first */
  if(smMatched()&&tx.length&&ph&&ph!=='0'){
    const L=LADDER.find(l=>l.ph===ph),sw=w5.filter(r=>r.sno!=null),said=sw.reduce((s,r)=>s+r.sno,0),nev=sw.length>=3&&said===0;
    if(agm!=null&&agr.length>=3&&agm<SM_AG.down){if(change==='up'){rules.pop();rules.push(['mid','Goal met often at '+pct(run.g)+', but hold it: agreement has dropped, and the points mean little until it recovers.']);change='';}
      const Li=LADDER.findIndex(l=>l.ph===ph),back=Li>0?LADDER[Li-1].ph:null;
      rules.push(['no','Agreement '+pct(agm)+' over the last '+agr.length+' school days in phase '+ph+': move back one phase on the matching ladder and re-run the rating practice.'+(back!=null?smChgBtn('lad',back,'Move back to phase '+back,'agreement '+pct(agm)+' over the last '+agr.length+' school days'):'')]);}
    else if(nev)rules.push(['no','The student has not said No in the last '+sw.length+' days rated: agreement means little when only Yes is used (the student agrees whenever the teacher says Yes). Re-teach with the non-examples on the Teach sheet, praise an honest No, and do not thin the matching yet.']);
    else if(L&&L.w&&ph!=='5'){
      const W=RR.slice(-L.w),wa=W.filter(r=>r.ag!=null),wam=smMean(wa.map(r=>r.ag)),wn=W.filter(r=>r.tno!=null),wt=wn.reduce((s,r)=>s+r.tno,0),wm=wn.reduce((s,r)=>s+(r.nom||0),0),wnp=wt?wm/wt*100:null;
      const atCap=TH.cap!=null&&run.g!=null&&run.g>=TH.cap,next=LADDER[LADDER.indexOf(L)+1];
      if(change)rules.push(['mid','The next ladder phase waits: one change at a time, the goal first, then the ladder once the new goal has held for '+L.w+' school days.']);
      else if(RR.length<L.w)rules.push(['mid','Phase '+ph+': '+RR.length+' of the '+L.w+' school days at the current goal that the ladder is judged on (Teach sheet).']);
      else if(L.cap&&!atCap)rules.push(['mid','Phase '+ph+': the goal is not at its ceiling yet; phase '+next.ph+' follows four weeks at the ceiling.']);
      else if(!wn.length)rules.push(['mid','Agreement '+(wam!=null?pct(wam):'—')+'; agreement on the teacher&rsquo;s No ratings is not known for these days (entered by hand). Rate the next days on the Rate page, or enter the sheets&rsquo; marks there, before thinning the matching.']);
      else if(wt<SM_AG.noMin)rules.push(['mid','Agreement '+(wam!=null?pct(wam):'—')+', but only '+wt+' No rating'+(wt===1?'':'s')+' by the teacher in the last '+W.length+' school days: not enough to judge whether the student says No honestly. Run the non-example practice (Teach sheet) or hold until there are more.']);
      else if(wam!=null&&wam>=SM_AG.up&&wnp>=SM_AG.no&&(!L.met||met>=TH.upN)){const pin=!String((typeof smD==='function'?smD().pin:'')||'').trim()&&W.some(r=>/^ipad:/.test(String(r.src||'')));
        rules.push(['ok','Agreement '+pct(wam)+' and the teacher&rsquo;s Nos matched '+wm+' of '+wt+' ('+pct(wnp)+') over the last '+W.length+' school days at '+pct(run.g)+': phase '+next.ph+' of the matching ladder is due.'+(pin?' Set a PIN on the Rate page first: with none, the adult&rsquo;s part of the Student screen opens to anyone who holds the button, so the teacher&rsquo;s ratings on the iPad cannot be told from the student&rsquo;s.':'')+smChgBtn('lad',next.ph,'Move to phase '+next.ph,'agreement '+pct(wam)+', the teacher&rsquo;s Nos matched '+wm+' of '+wt)]);}
      else rules.push(['mid','Agreement '+(wam!=null?pct(wam):'—')+', the teacher&rsquo;s Nos matched '+wm+' of '+wt+(wnp!=null?' ('+pct(wnp)+')':'')+': stay on phase '+ph+'.']);
    }
  }
  if(!hasT&&tx.length)rules.push(['mid','This sheet has no teacher rating: its points are the student&rsquo;s own, and the plan&rsquo;s own data (Form DD-1) carry the behavior.']);
  const vtag=rules.some(r=>r[0]==='no')?'v-no':rules.some(r=>r[0]==='ok')?'v-ok':'v-mid';
  v.innerHTML='<div class="verdict '+vtag+'"><b>Phase '+(ph||'?')+' · '+R.length+' day'+(R.length===1?'':'s')+' recorded.</b> '+(rules[0]?rules[0][1].replace(/ ?<button[\s\S]*?<\/button>/g,''):'')+'</div>';
  RU.innerHTML='<ul style="font-family:var(--sans);font-size:12.5px;margin:4px 0 4px 18px">'+rules.map(r=>'<li>'+r[1]+'</li>').join('')+'</ul><p class="hint">The thresholds ('+TH.upN+' of '+TH.upW+' to raise, fewer than '+TH.dnN+' of '+TH.dnW+' to lower, each new goal held '+TH.hold+' school days; agreement '+SM_AG.up+'% to move on the ladder and below '+SM_AG.down+'% to step back, the teacher&rsquo;s Nos matched at '+SM_AG.no+'%) are the form&rsquo;s working conventions, written on the Reinforcement and Teach sheets. Only the days at the current goal and phase count, and one change is advised at a time.</p>';
  drawLog(R);
}
function drawLog(R){
  /* full check: the legend under the chart was one centred line of about 1100 units in a 900-unit chart, cut at both
     ends; it is two lines now, with the plot 14 units shorter to make room (B 48 -> 62; the chart's size is unchanged) */
  const W=900,H=320,L=56,Rg=20,T=18,B=62,n=Math.max(R.length,10);const X=i=>L+(i+0.5)*(W-L-Rg)/n,Y=v=>T+(H-T-B)*(1-v/100);
  /* v22.7x (review F258): the behavior (the teacher's ratings) is the main line where the sheet has a teacher rating; the
     points, which pay an honest No too, are the second line */
  const hasT=smHasT()&&S.sys!=='cico'&&R.some(r=>r.b!=null);
  let s='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#fff"/>';
  [0,25,50,75,100].forEach(p=>{s+='<line x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-Rg)+'" y2="'+Y(p)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(p)+4)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+p+'%</text>';});
  s+='<line x1="'+L+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  /* phase changes as dashed lines, the goal as a stepped line */
  let prev=null;R.forEach((r,i)=>{if(prev!==null&&r.ph!==prev){const x=X(i)-(W-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+T+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#182e43" stroke-dasharray="4 4"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+12)+'" font-size="11" fill="#182e43" font-family="system-ui,sans-serif">phase '+esc(r.ph)+'</text>';}prev=r.ph;});
  /* v22.7x (review I132): a dated line where the goal changed (from the rows), and where a fading step was ticked (the dated changes) */
  {let pg=null;R.forEach((r,i)=>{if(r.ph==='0'||r.g==null)return;if(pg!=null&&r.g!==pg){const x=X(i)-(W-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+(T+16)+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#9b4e15" stroke-dasharray="2 3"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+26)+'" font-size="10.5" fill="#9b4e15" font-family="system-ui,sans-serif">goal '+esc(String(r.g))+'%</text>';}pg=r.g;});
   const iso=R.map(r=>nbhSmIso(r.date));(S.chg||[]).filter(c=>c.k==='fade').forEach(c=>{const d=nbhSmIso(c.date);if(!d)return;const i=iso.findIndex(x=>x&&x>=d);if(i<0)return;const x=X(i)-(W-L-Rg)/n/2;
     s+='<line x1="'+x.toFixed(1)+'" y1="'+(T+30)+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#5b3f78" stroke-dasharray="1 3"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+40)+'" font-size="10.5" fill="#5b3f78" font-family="system-ui,sans-serif">'+esc(c.what.replace(/ ticked$/,'').toLowerCase())+'</text>';});}
  let gp='';R.forEach((r,i)=>{if(r.g!=null&&r.ph!=='0'){const x0=X(i)-(W-L-Rg)/n/2,x1=X(i)+(W-L-Rg)/n/2;gp+='M'+x0.toFixed(1)+' '+Y(r.g).toFixed(1)+' L'+x1.toFixed(1)+' '+Y(r.g).toFixed(1)+' ';}});
  if(gp)s+='<path d="'+gp+'" stroke="#9b4e15" stroke-width="2" fill="none"/>';
  const line=(get,col,w,dash)=>{let d='';R.forEach((r,i)=>{const v=get(r);if(v==null){d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});
    d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';});};
  if(hasT)line(r=>r.pc,'#9aa9b0',1.6,'6 3');
  line(r=>hasT?r.b:r.pc,'#2f5568',2);
  /* a thin line per target: the teacher's ratings per target where kept, else the points per target */
  const TC=['#5C9E31','#9B4E15','#5b3f78','#b1860b','#8E2A2A'];S.tg.forEach((t,ti)=>line(r=>{const bv=r.bp[ti];return bv!=null?bv:hasT?null:r.tp[ti];},TC[ti%5],1.2,'3 3'));
  R.forEach((r,i)=>{const v=hasT?r.b:r.pc;if(v!=null)s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="4.5" fill="'+(r.ph==='0'?'#fff':r.mt?'#2F6B37':'#2f5568')+'" stroke="#2f5568" stroke-width="1.5"/>';
    if(hasT&&r.pc!=null)s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(r.pc).toFixed(1)+'" r="2.5" fill="#9aa9b0"/>';
    if(r.ag!=null)s+='<rect x="'+(X(i)-3).toFixed(1)+'" y="'+(Y(r.ag)-3).toFixed(1)+'" width="6" height="6" fill="#76a2a3"/>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+14)+'" font-size="10" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(String(r.date||i+1).slice(0,6))+'</text>';});
  [[hasT?'Behavior: the share of the teacher’s ratings that were Yes (line; green when the day’s goal was met; hollow in phase 0)':'Percent of points (line; filled green when the goal was met; hollow in the teacher-only phase)',H-22],
   [hasT?'points (grey dashes; an honest No earns points too) · goal of points (brown) · agreement (squares) · per target (thin dashes)':'goal (brown) · agreement (small squares) · per-target percents (thin dashed lines)',H-7]].forEach(([t,y])=>{
    s+='<text x="'+((L+W-Rg)/2)+'" y="'+y+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(t)+'</text>';});
  $('#logPlot').innerHTML=s;
  if(typeof smChgRender==='function')smChgRender();
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();setSys(S.sys);renderT();renderP();renderRub();renderLad();renderFade();renderFid();renderBck();renderL();renderWk();renderPoints();renderSetup();renderSheet();renderBc();renderRecord();if(typeof mmRender==='function')mmRender();if(typeof smCaseRender==='function'){smCaseRender();smChgRender();}}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
function sheetOrientation(){if(S.chk.pocket&&['match','contract','cico'].includes(S.sys))return 'portrait';if(S.sys==='match'||S.sys==='interval'||S.sys==='interlock'||S.sys==='smiley'||S.sys==='perf')return 'landscape';if(S.chk.weekly)return 'landscape';return 'portrait';}
function printAlone(cls,orient){document.body.classList.add(cls);
  const st=document.createElement('style');st.textContent='@media print{@page{size:letter '+orient+';margin:0.5in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove(cls);st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);}
$('#sheetPrintBtn').addEventListener('click',()=>{if(!S.sys){alert('Choose a system first; there is no sheet yet.');return;}printAlone('sm-sheet-only',sheetOrientation());});
$('#bcPrintBtn').addEventListener('click',()=>{renderBc();printAlone('sm-bc-only','portrait');});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'SM-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`SM-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='SM-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  o.sys=['match','contract','rubric','interval','interlock','smiley','perf','cico'].includes(s.sys)?s.sys:'';
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n||50).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='on'||f==='met'?!!(x&&x[f]):str(x&&x[f]);});return r;}):null;
  o.tg=arr('tg',['word','def','cue','ex','nex','icon','img','goal'],6)||[];o.per=arr('per',['t','label','icon','img'],16)||[];
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';o.tg.forEach(x=>{x.img=okImg(x.img);});o.per.forEach(x=>{x.img=okImg(x.img);});
  const lv=arr('lv',['pts','desc'],5);if(lv&&lv.length===5)o.lv=lv;
  const lad=arr('lad',['on','note'],LADDER.length);if(lad&&lad.length===LADDER.length)o.lad=lad;
  const fid=arr('fid',['in','note'],FID.length);if(fid&&fid.length===FID.length)o.fid=fid;
  const fade=arr('fade',['on','note'],FADE.length);if(fade&&fade.length===FADE.length)o.fade=fade;
  const bck=arr('bck',['in','note'],BCRULES.length);if(bck&&bck.length===BCRULES.length)o.bck=bck;
  o.log=arr('log',['date','ph','goal','pts','poss','beh','m','n','tno','nom','sno','asm','met','tgp','bgp','note','src'],400)||[];   /* v22.7x (F258) the behavior and the No counts */   /* src (v21.46): 'ipad:yyyy-mm-dd' for a row a day rated on the iPad wrote */
  Object.keys(obj('wk')).forEach(k=>{if(/^d[0-4]_p\d+$/.test(k))o.wk[k]=str(s.wk[k]);});
  o.chg=(arr('chg',['date','what','why','k'],200)||[]).filter(c=>c.what);   /* v22.7x (review I132) */
  o.tg.forEach(t=>{if(!window.NBH_PICTOS||!NBH_PICTOS[t.icon])t.icon='';});o.per.forEach(p=>{if(!window.NBH_PICTOS||!NBH_PICTOS[p.icon])p.icon='';});
  if(typeof mmFromFile==='function'){const mm=mmFromFile(s.mm);if(mm)o.mm=mm;}   /* v21.66 Match the model; mmEnsure cleans it */
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='SM-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved SM-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form SM-1. Nothing was changed.':'That file could not be read as a saved SM-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved SM-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Day','Date','Phase','Goal %','Points','Possible','% of points','Behavior %','Matches','Ratings','Agreement %','Teacher No','No matched','Student No','Goal met','Per target % (points)','Per target % (behavior)','Note']];   /* v22.7x (F258, F260) */
  rows().forEach((r,i)=>out.push([i+1,r.date,r.ph,r.goal,r.pts,r.poss,r.pc==null?'':r.pc.toFixed(1),r.b==null?'':r.b.toFixed(1),r.m,r.n,r.ag==null?'':r.ag.toFixed(1),r.tno==null?'':r.tno,r.nom==null?'':r.nom,r.sno==null?'':r.sno,r.mt==null?'':r.mt?'yes':'no',r.tgp||'',r.bgp||'',r.note]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SM-1_record.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated system?\nEvery sheet is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const fmt=d=>(d.getMonth()+1)+'/'+d.getDate();const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const D=n=>fmt(step(n,-1)),F=n=>fmt(step(n,1)),Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  S=blank();S.sys='match';
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'3',nick:'Sam',plan:'BIP dated '+Y(30)+' (Form TD-1): break card and a 2-minute task start; replacement skills from GB-1',func:'Escape or avoidance',
    setting:'General education classroom (Ms. R.), specials, lunch and recess',rater:'Ms. R. in class; the paraeducator at specials, lunch and recess',bcba:'Jordan Ellis, M.A., BCBA (simulated)',date:Y(16),start:Y(15),review:Y(0),
    r_perf:'Yes: the behavior is in the repertoire',rf_class:'Activities and privileges (free time, a game, a walk, helper)',rf_closed:'No: only through the sheet (closed)',rf_mag:'from phase 3, free time grows from 5 to 10 minutes and Friday adds a game with a friend',r_disc:'With practice (teach first with examples and non-examples)',r_read:'Needs pictures and faces',r_pa:'Yes, menu carried in below',r_base:'4 school days, teacher rating only',
    r_hist:'A clip chart last year, moved down in front of the class; Sam tore up two point sheets in the spring. Nothing with the student rating himself.',
    t_reduce:'Leaving the work area and tipping the desk (escape); the targets are the plan’s replacement behaviors',t_rem:'A Yes allows one reminder (the teacher tallies reminders in the R R box)',
    mp_yy:'2',mp_nn:'1',mp_yn:'0',mp_ny:'0',goal:'75',goal_txt:'',menu:'Extra recess with a friend (5 min) · Line leader · Drawing time at the back table · Feed the class fish · Teacher helper',
    when:'Same day, at the end of the sheet',bonus:'A sticker on the sheet when every rating in the day matches',never:'Points are never taken away; a mismatch earns 0 and nothing more is said; the sheet is never shown to the class',
    homeNote:'The sheet goes home in the folder; a parent initials it; a goal day earns five minutes of praise and a story, not a second reward',group:'',
    cc_up:'Met on 4 of the last 5 school days',cc_hold:'3 school days',cc_step:'5 points',cc_down:'Met on fewer than 2 of 5 days, or Sam stops choosing a reward',cc_cap:'90',
    tr_ex:'For each target: the teacher and the para act out three examples and three non-examples; Sam labels each with a face card until 9 of 10 are right, two days running.',
    tr_prac:'Two practice periods on '+Y(17)+': Sam rated, Ms. R. rated, they compared; an honest sad face was praised each time it was earned.',tr_acc:'Agreement at or above 80% on 3 practice days',
    tr_dis:'Ms. R.’s rating stands; Sam may ask once what she saw; no argument on the sheet',tr_who:'J. Ellis with Ms. R., '+Y(18)+' and '+Y(17),
    gen_set:'Specials next (art, music), with the para rating; the same sheet travels in the folder',gen_thin:'Rate three periods instead of six once phase 3 holds; then a weekly goal',gen_exit:'Goal at 90% with checks faded for four weeks and the plan data on PR-1 holding',
    iv_q:'Was I working?',iv_len:'3',iv_n:'10',iv_cue:'Tactile timer (vibrating prompt)',iv_timing:'Variable: the length varies around the average, so the cue cannot be predicted',iv_match:'Half of the intervals, chosen beforehand',iv_act:'independent math practice',
    il_dir:'dec',il_unit:'items',il_init:'20',il_step:'2',il_every:'2',il_len:'16',il_chk:'1',il_task:'Math worksheet, problems 1 to 20',il_floor:'6',il_cap:'20',
    sm_inrow:'2',sm_earn:'Show my work\nShare my interest\nTake a walk\nDraw a picture\nTeacher helper\nClass thumbs up',sm_tiers:'10+ Free time\n16+ Play a game',
    pf_what:'math problems completed',pf_kind:'correct',pf_n:'5',pf_min:'10',pf_goal:'12',pf_max:'20',pf_span:'day',
    ci_key:'2 = Yes, met the expectation · 1 = Partly, with a reminder · 0 = No',ci_mentor:'Mr. Ortiz, front office',ci_in:'8:10; greet, card out, goal said aloud, materials check',ci_out:'2:55; total the points, praise or problem-solve, copy home',ci_goal:'80',ci_home:'Yes, signed and returned next morning',
    smp_goal:'“Stay in my area and use my break card” (Sam chose it from two)',smp_eval:'At check-out Sam circles YES or NO on the goal and says one thing that helped',smp_instr:'At the cue: “Am I in my area? Yes, keep going.” Taught aloud, then whispered, then silent',smp_selfr:'Sam picks the reward from the menu when the total meets the goal, after Ms. R. initials the total',
    bc_student:'',bc_teacher:'Ms. R.',bc_parent:'Sam’s father',bc_start:Y(10),bc_review:F(4),bc_voice:'Negotiated line by line',bc_task:'Earn the goal on my point sheet',bc_how:'At least 4 of 5 school days in the week',bc_when:'Every school day, all six periods, Room 12 and specials',bc_record:'Ms. R. initials the task record each day the goal is met',bc_adult:'Ms. R. will rate every period and give the daily reward the same day; Dad will read the home note each night and sign on Friday',bc_rw:'Extra recess with a friend',bc_rwmuch:'10 minutes',bc_rwwhen:'Friday at 2:40',bc_rwwho:'Ms. R.',bc_bonus:'Five days in a row earns lunch with a friend in the classroom',bc_pen:'None: a day the task is not done earns nothing, and nothing is lost',bc_pentext:'',bc_renego:'Either of us may ask for a meeting; the contract is rewritten, never changed by one side',
    sh_date:'',sh_title:'',sh_reward:'',decision:'Week 3: goal raised from 75 to 80 on '+Y(2)+' (met 4 of 5 after 5 school days at 75). Matching stays at every period until agreement holds at 90 and Sam matches the teacher’s Nos at 80.',sv:'Sam chose the sheet with faces over the one with words and asks for the recess reward most days.'};
  S.chk={pict:true,home:true,weekly:false,big:false,graph:true,eval:true,pocket:false,rubmatch:true};
  /* v21.45 the design and the reward store */
  S.d={look:'bright',rate:'thumbs',av:'faceboy2',wf:true,mid:'18 points by lunch = 5 minutes of drawing at the back table',cstrip:false};
  S.store=[{n:'Line leader',icon:'lineup',img:'',p:'8',tier:'s'},{n:'Drawing time',icon:'drawing',img:'',p:'10',tier:'s'},{n:'Teacher helper',icon:'helper',img:'',p:'12',tier:'m'},{n:'Feed the class fish',icon:'pet',img:'',p:'15',tier:'m'},{n:'Extra recess with a friend',icon:'playground',img:'',p:'20',tier:'b'}];
  S.tg=[{word:'I stayed in my area',def:'Seated or standing within the taped area for the whole period, except with permission or a break card',cue:'Bottom on the chair',ex:'At the desk while the class works; at the carpet during meeting',nex:'Wandering to the window; under the table',icon:'stayarea',img:'',goal:'80'},
    {word:'I followed directions the first time',def:'Starts the task within 10 s of the direction, with at most one reminder',cue:'Start within 10 seconds',ex:'Opens the book when asked',nex:'Says “no” and waits for a third prompt',icon:'follow',img:'',goal:'80'},
    {word:'I used kind words and hands',def:'No hitting, pushing, grabbing or name-calling; asks for help or a break with the card',cue:'Gentle and respectful',ex:'Asks for a turn; uses the break card',nex:'Pushes a chair; calls a peer a name',icon:'safehands',img:'',goal:'90'}];
  S.per=[{t:'8:30',label:'Arrival',icon:'arrival',img:''},{t:'9:15',label:'Reading',icon:'reading',img:''},{t:'10:00',label:'Math',icon:'math',img:''},{t:'11:00',label:'Specials',icon:'art',img:''},{t:'12:15',label:'Lunch and recess',icon:'lunch',img:''},{t:'1:30',label:'Centers',icon:'centers',img:''}];
  S.fade.forEach((f,i)=>{f.on=i===0;f.note=i===0?'From '+Y(16)+'; every period rated':'';});S.bck.forEach(b=>{b.in='Yes';});
  S.lad.forEach((l,i)=>{l.on=i===1;l.note=i===0?'Days 1 to 4 ('+Y(20)+' to '+Y(17)+'): the targets met in 41% of the teacher’s ratings; first goal set at 70% of the points (met on 2 of the 4 days)':i===1?'From '+Y(16)+'; agreement 75% in week 1, 88% in week 2, 92% in week 3':'';});
  S.fid.forEach((f,i)=>{f.in='Yes';f.note=i===2?'Ms. R. rates on her clipboard before Sam shows his sheet':i===8?'Returned 9 of 11 days':'';});
  /* v22.7x (review F258, F262): the baseline is four teacher-only days (no points, the share of the teacher's ratings that were
     Yes), and each self-rating day carries the behavior beside the points, with the teacher's Nos and how many Sam matched */
  const g1=70,g2=75,g3=80;
  const days=[[null,'0',null,30,null,null],[null,'0',null,44,null,null],[null,'0',null,38,null,null],[null,'0',null,52,null,null],
    [g1,'1',64,40,13,18],[g1,'1',72,50,14,18],[g1,'1',69,46,13,18],[g1,'1',78,60,15,18],[g1,'1',75,56,15,18],
    [g1,'1',81,64,16,18],[g1,'1',78,60,16,18],[g1,'1',83,68,17,18],[g1,'1',86,74,16,18],[g1,'1',72,52,16,18],
    [g2,'1',83,68,17,18],[g2,'1',89,80,17,18],[g2,'1',78,62,16,18],[g2,'1',86,76,17,18],[g2,'1',92,86,18,18],
    [g3,'1',83,70,17,18],[g3,'1',89,80,17,18]];
  const cl=v=>Math.max(0,Math.min(100,v));
  S.log=days.map((d,i)=>{const b=d[3],tno=Math.round(18*(1-b/100)),base=d[1]==='0';
    if(base)return{date:D(days.length-1-i),ph:'0',goal:'',pts:'',poss:'',beh:String(b),m:'',n:'',tno:'',nom:'',sno:'',asm:'',met:false,tgp:'',bgp:[cl(b+10),cl(b-12),cl(b+2)].join(','),note:i===0?'teacher rating only':'',src:''};
    const pts=Math.round(36*d[2]/100),nom=Math.max(0,tno-(d[5]-d[4]));
    return{date:D(days.length-1-i),ph:d[1],goal:String(d[0]),pts:String(pts),poss:'36',beh:String(b),m:String(d[4]),n:String(d[5]),tno:String(tno),nom:String(nom),sno:String(nom),asm:'',met:pts/36*100>=d[0],
      tgp:[cl(d[2]+8),cl(d[2]-10),cl(d[2]+4)].join(','),bgp:[cl(b+10),cl(b-12),cl(b+2)].join(','),note:i===4?'first day rating':i===14?'goal raised to 75':i===19?'goal raised to 80':'',src:''};});
  S.meta.goal='80';
  if(typeof smRSim==='function')smRSim();   /* v21.46 today's first periods rated on the iPad (sm-rate.js) */
  if(typeof mmSim==='function')mmSim(D);   /* v21.66 */
  renderAll();setView('sheet');
  nbhUI.toast('Simulation loaded: '+'a simulated third-grader’s pictorial Self & Match sheet with three targets over six periods.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
/* v21.45 the first render is at the end of the script (build.sh), once the v2 parts (sm-v2-*.js) are defined */

/* v21.31 the case: hooks. The targets a student self-monitors are stated positively, so an empty target
   table takes the acquisition objectives from Form GB-1 and the paired replacements named on Form TB-1,
   not the problem behaviors themselves; the problem behaviors go to the "reduction target" line, the
   function to its field, and the ranked menu from Form PA-1 to the reward menu. The picker adds whatever
   is ticked as a target row, so a reduction target can be written in when the team wants it on the sheet.
   One skill is one row (with Form TB-1 passing a skill shared by several behaviors under one name): a replacement
   target defined on Form TB-1 under the name of a row already made fills that row's empty definition, examples and
   non-examples, and the picker places a name already on the sheet no second time, filling only its empty fields. */
const nbhSmRow=o=>Object.assign({word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''},o);
const nbhSmK=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
const nbhSmPct=c=>{const m=/(\d{1,3})\s*%/.exec(String(c||''));return m&&+m[1]>0&&+m[1]<=100?m[1]:'';};
const nbhSmFill=(r,o)=>{let k=0;['def','ex','nex'].forEach(f=>{if(o[f]&&!r[f]){r[f]=o[f];k++;}});return k;};
window.__nbhFactsIn=function(f){
  let n=0;const behs=f.behaviors||[],acq=(f.goals&&f.goals.acq)||[];
  if(S.tg.every(t=>!t.word&&!t.def)){
    const rows=[];
    /* v22.7x (review F265): a GB-1 objective's condition is not a definition: the definition is left for the BCBA to write, and the
       objective's criterion, when it is a percent, becomes the target's goal */
    acq.forEach(g=>{if(g.beh&&rows.length<5&&!rows.some(r=>r.word===g.beh))rows.push(nbhSmRow({word:g.beh,def:'',goal:nbhSmPct(g.crit)}));});
    behs.forEach(b=>{const w=b.isRep?b.label:b.rep;if(!w)return;const had=rows.find(r=>r.word===w);
      if(had){if(b.isRep)nbhSmFill(had,{def:b.def||'',ex:b.ex||'',nex:b.nex||''});return;}
      if(rows.length<5)rows.push(nbhSmRow(b.isRep?{word:b.label,def:b.def,ex:b.ex||'',nex:b.nex||''}:{word:w}));});
    if(rows.length){while(rows.length<2)rows.push(nbhSmRow({}));S.tg=rows;n+=rows.filter(r=>r.word).length;}
  }
  const red=behs.filter(b=>!b.isRep);
  if(!S.meta.t_reduce&&red.length){S.meta.t_reduce=red.map(b=>b.label+(b.rep?' (replaced by '+b.rep+')':'')).join('; ');n++;}
  if(!S.meta.func&&f.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),f.fn.key||f.fn.label);if(v){S.meta.func=v;n++;}}
  if(!S.meta.menu&&(f.menu||[]).length){S.meta.menu=nbhCase.menuLine(f.menu,5);n++;}
  if(n)renderAll();return {filled:n};
};
/* v21.74 out: the Record's days (the share of the points earned, the goal, whether it was met), for Form DD-1's week summary.
   v22.7x (review F258, F259, F262): with the behavior (beh: the share of the teacher's ratings that were Yes), the ladder
   phase (ph; a teacher-only day, phase 0, has no points and no goal to meet, so Forms DD-1 and PR-1 leave it out of the
   treatment figures) and the goal met as worked out from the points.
   A date without a year ("10/13", as the Record writes it) is this year's, or last year's when that is more than two months ahead. */
const nbhSmIso=s=>{s=String(s||'').trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  m=/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(s);if(!m||+m[1]<1||+m[1]>12||+m[2]<1||+m[2]>31)return '';
  const now=new Date();let y=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):now.getFullYear();
  if(!m[3]&&new Date(y,+m[1]-1,+m[2])-now>61*864e5)y--;
  return y+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');};
window.__nbhFactsOut=function(){try{const r1=v=>v==null?null:Math.round(v*10)/10;
  const days=rows().map(r=>{const d=nbhSmIso(r.date);if(!d)return null;
    if(r.ph==='0')return r.b!=null||r.pc!=null?{date:d,pct:r1(r.pc),beh:r1(r.b),ph:'0',goal:null,met:null}:null;
    return r.pc!=null?{date:d,pct:r1(r.pc),beh:r1(r.b),ph:r.ph,goal:r.g,met:!!r.mt}:null;}).filter(Boolean).slice(-60);
  return days.length?{points:{days,src:'SM-1',beh:smHasT()?(S.sys==='cico'?'adult':'teacher'):''}}:null;}catch(e){return null;}};
window.__nbhFactsPick=function(sel){
  let n=0;const dup=[];
  const add=o=>{const had=nbhSmK(o.word)?S.tg.find(t=>nbhSmK(t.word)===nbhSmK(o.word)):null;
    if(had){if(nbhSmFill(had,o))return true;if(dup.indexOf(had.word)<0)dup.push(had.word);return false;}
    if(S.tg.length>=5&&!S.tg.some(t=>!t.word&&!t.def))return false;const slot=S.tg.find(t=>!t.word&&!t.def);if(slot)Object.assign(slot,nbhSmRow(o));else S.tg.push(nbhSmRow(o));return true;};
  sel.behaviors.forEach(b=>{const w=b.isRep?b.label:(b.rep||b.label);if(add({word:w,def:w===b.label?b.def:'',ex:w===b.label?(b.ex||''):'',nex:w===b.label?(b.nex||''):''}))n++;});
  sel.goals.acq.forEach(g=>{if(add({word:g.beh,def:'',goal:nbhSmPct(g.crit)}))n++;});   /* v22.7x (review F265) */
  sel.goals.red.forEach(g=>{if(add({word:g.beh,def:'no '+(g.ml||'more')+' than '+(g.tgt||'the target level')}))n++;});
  if(sel.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),sel.fn.key||sel.fn.label);if(v){S.meta.func=v;n++;}}
  if(sel.menu.length){S.meta.menu=[S.meta.menu,sel.menu.map(m=>m.name).join(', ')].filter(Boolean).join(', ');n++;}
  renderAll();
  const notes=[];if(dup.length)notes.push((dup.length===1?dup[0]+' is':dup.join(', ')+' are')+' already on the sheet.');
  if(S.tg.length>=5)notes.push('The sheet holds at most five targets.');
  return {filled:n,note:notes.join(' ')};
};

/* ===================== v22.7x Wave 3 (review F264, F265, I132, I134, I135) ===================== */
/* (F264, I135) what the case knows about the student: Form DM-1's allergies and diet, home language and interpreter, and
   photo/media permission; Form SI-1's assent and the student's own words. Kept for this session only (the case sends them
   each time the form opens in the workstation); nothing of it is written into the form's saved file but the assent, when the
   team takes it onto the contract. */
let smCaseF=null;
const smT=v=>String(v==null?'':v).trim();
const smMDY=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(smT(v));return m?(+m[2])+'/'+(+m[3])+'/'+m[1]:smT(v);};
const SM_ASSENT={given:'Given',partial:'Partial',refused:'Refused'};
{const was=window.__nbhFactsIn;window.__nbhFactsIn=function(f){smCaseF=f&&typeof f==='object'?f:null;
  const r=was?was.apply(this,arguments):{filled:0};let n=0;
  try{const st=smCaseF&&smCaseF.student;const a=st&&SM_ASSENT[smT(st.assent).toLowerCase()];if(a&&!S.meta.bc_assent){S.meta.bc_assent=a;n++;bindMeta();renderBc();}}catch(e){}
  try{smCaseRender();if(typeof smRenderDesign==='function'&&document.body.classList.contains('view-design'))smRenderDesign();}catch(e){}
  return Object.assign({},r||{},{filled:((r&&r.filled)||0)+n});};}
function smProf(){const f=smCaseF||{},p=f.profile||{},h=p.health||{},L=p.language||{},fl=p.flags||{},st=f.student||{};
  return {has:!!f.profile,all:smT(h.allergies),cult:smT(p.culture),lang:smT(L.home),interp:L.interpreter===true,lnotes:smT(L.notes),photo:smT(fl.photo),
    sih:!!f.student,assent:smT(st.assent),pref:smT(st.preference),likes:smT(st.likes),sdate:smT(st.date)};}
/* the family's language on the parent's copy (the home note, the contract), when Form DM-1 gives one other than English or an interpreter */
function smLangLine(){const P=smProf();if(!P.lang&&!P.interp)return '';if(!P.interp&&/^english/i.test(P.lang))return '';
  return 'Family&rsquo;s language: '+esc(P.lang||'see Form DM-1')+(P.interp?' · Interpreter: '+(P.lnotes&&/Interpreter:/.test(P.lnotes)?esc(P.lnotes.replace(/^.*Interpreter:\s*/,'').replace(/;.*$/,'')):'<span class="bl" style="min-width:120px"></span>'):'');}
/* photo/media permission: No on Form DM-1 keeps the student's own photo off the sheets, the Rate page and the walkthrough video */
function smPhotoOK(){const P=smProf();return P.photo!=='No';}
function smPhotoNote(){const P=smProf(),d=typeof smD==='function'?smD():{};if(!P.has)return '';
  if(P.photo==='No')return '<div class="verdict v-no" style="margin-top:6px"><b>Form DM-1: photo/media permission on file is No.</b> The student&rsquo;s own photo is not shown on the sheets, the Rate page or the walkthrough video'+(d.avimg?' (the one chosen stays in the file, unused)':'')+'; a library picture can stand in. A QR link must point to a file shared only with the team.</div>';
  if(d.avimg&&P.photo!=='Yes')return '<div class="verdict v-mid" style="margin-top:6px"><b>Photo/media permission is not recorded as Yes on Form DM-1.</b> Check it before a sheet with the student&rsquo;s photo goes on the desk or home, or into the walkthrough video.</div>';
  return '';}
const SM_FOOD=/\b(candy|candies|snacks?|chips?|cookies?|treats?|gum|soda|juice|chocolate|popcorn|pizza|crackers?|fruit|drinks?|food|edibles?|lollipops?|sweets?|cereal|pretzels?|ice cream|cupcakes?|donuts?|goldfish)\b/i;
function smFoodItems(){return (typeof smStore==='function'?smStore():[]).map(o=>smT(o.n)).filter(n=>n&&SM_FOOD.test(n));}
/* (I134) back-ups that match the function on Form FS-1, with their limits: an escape back-up is capped and never skips the
   skill being taught, so the student cannot buy their way out of instruction. Working suggestions, for the team to price. */
const SM_FN_BACKUPS={
  'Escape or avoidance':{why:'the behavior gets the student out of work, so the points buy a short, planned break from it',items:[['Break pass: 3 minutes away from the task','8'],['Skip one problem card (not the skill being taught; one per assignment)','10'],['Half a worksheet (once a day)','15']],cap:'Cap each: at most two a day, never on the skill being taught, and the work is returned to after the break.'},
  'Attention':{why:'the behavior gets an adult&rsquo;s or peers&rsquo; attention, so the points buy attention at a time that suits the class',items:[['Lunch with the teacher','15'],['5 minutes with a chosen friend','8'],['Be the teacher&rsquo;s helper','10']],cap:'Deliver the attention warmly and on time; the same attention is not given for the behavior.'},
  'Tangible':{why:'the behavior gets an item or activity, so the points buy that item or activity',items:[['Time with the item the behavior gets (5 minutes)','8'],['Take the item home for a night','20']],cap:'Keep the item available only through the sheet (a closed economy), or the points buy less.'}};
function smFnBackups(){const f=S.meta.func||'';return SM_FN_BACKUPS[f]||null;}
function smCaseRender(){
  const P=smProf(),box=$('#smCaseBox'),sb=$('#smStuBox'),fb=$('#smFnBox');
  if(box){const L=[],food=smFoodItems(),ed=/^Edibles/.test(S.meta.rf_class||'');
    if(P.all)L.push('<p><b>Allergies</b> (Form DM-1): '+esc(P.all)+'</p>');
    if(P.cult)L.push('<p><b>Cultural, religious or dietary considerations</b> (Form DM-1): '+esc(P.cult)+'</p>');
    if(P.lang||P.interp)L.push('<p><b>Home language</b> (Form DM-1): '+esc(P.lang||'—')+(P.interp?'; an interpreter is needed'+(P.lnotes?' ('+esc(P.lnotes)+')':''):'')+'.'+(smLangLine()?' The home note and the contract print in English with the family&rsquo;s language and the interpreter on the parent&rsquo;s copy; explain them in that language.':'')+'</p>');
    let w='';if(ed||food.length)w='<div class="verdict '+(P.all?'v-no':'v-mid')+'"><b>Food as a back-up'+(food.length?' ('+esc(food.slice(0,4).join(', '))+')':'')+'.</b> '+(P.all?'Form DM-1 records allergies: '+esc(P.all)+'. Check every food item against them with the nurse, ':P.has?'Form DM-1 records no allergies: confirm with the nurse and the family, ':'Check allergies and diet with the nurse and the family (Form DM-1), ')+'and get the family&rsquo;s written agreement before any food is given.</div>';
    box.innerHTML=(L.length?'<div class="hint" style="margin:6px 0"><b>From the case</b>'+L.join('')+'</div>':'')+w;}
  if(sb){const L=[];if(P.sih){const a=SM_ASSENT[P.assent.toLowerCase()]||P.assent;if(a)L.push('Assent: '+esc(a.toLowerCase()));if(P.pref)L.push('Would want from a plan, in the student&rsquo;s words: &ldquo;'+esc(P.pref)+'&rdquo;');if(P.likes)L.push('Likes: '+esc(P.likes));}
    const v=/^refused/i.test(P.assent)?'<div class="verdict v-no"><b>The student has refused.</b> Take it to the team and the parent before the sheet starts: what changes for the student, and how assent is asked again.</div>':/^partial/i.test(P.assent)?'<div class="verdict v-mid"><b>Assent is partial.</b> Say which parts the student agreed to, and ask again at each review date.</div>':'';
    sb.innerHTML=L.length?'<div class="hint" style="margin:6px 0"><b>From Form SI-1'+(P.sdate?', '+esc(smMDY(P.sdate)):'')+'</b><br>'+L.join('<br>')+'<br>Write the goal in the student&rsquo;s words above, and ask for assent again at each review date (BACB Ethics Code, 2.11).</div>'+v:'';}
  if(fb){const F=smFnBackups();fb.innerHTML=F?'<div class="hint" style="margin:6px 0"><b>Back-ups that match the function ('+esc(S.meta.func)+', Form FS-1):</b> '+F.why+'. '+F.items.map(x=>x[0]+' ('+x[1]+' points)').join('; ')+'. '+F.cap+' <button type="button" class="tool noprint" id="smFnAdd">Add these to the reward store</button></div>':'';}}
document.addEventListener('click',e=>{if(!e.target.closest('#smFnAdd'))return;const F=smFnBackups();if(!F)return;
  const have=new Set(smStore().map(o=>smT(o.n).toLowerCase()));S.store=smStore();
  F.items.forEach(([n,p])=>{const t=n.replace(/&rsquo;/g,'’');if(have.has(t.toLowerCase())||S.store.length>=16)return;S.store.push({n:t,icon:typeof smGuessIcon==='function'?smGuessIcon(t):'',img:'',p,tier:''});});
  if(typeof smRenderStore==='function')smRenderStore();renderSheet();smCaseRender();nbhUI.toast('Added to the reward store: price them for this student.',{kind:'ok'});});
/* (F265) the plan beside the point days, for the case: Form TI-1's fidelity steps and Form QS-1's point-sheet card can be read
   from it instead of typed again. It goes with the point days (no days, no point sheet in the case yet). */
{const was=window.__nbhFactsOut;window.__nbhFactsOut=function(){const o=was?was.apply(this,arguments):null;if(!o||!o.points)return o;
  try{const plain=t=>String(t||'').replace(/<[^>]+>/g,'').replace(/&rsquo;/g,'’').replace(/&amp;/g,'&').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim(),k=mp(),fs=smFadeStep();
    o.points.plan={sys:S.sys,targets:S.tg.filter(t=>smT(t.word)).map(t=>({word:t.word,def:t.def||'',goal:t.goal||''})),match:S.sys==='match'?{yy:k.yy,nn:k.nn,yn:k.yn,ny:k.ny}:null,
      goal:num(S.meta.goal),phase:curPhase(),fade:fs>=0?fs+1:null,rewardTime:S.meta.when||'',never:S.meta.never||'',
      fidelity:FID.map((t,i)=>({t:plain(t),v:S.fid[i].in})).filter(x=>x.v!=='No'&&x.v!=='N/A').map(x=>x.t),changes:(S.chg||[]).slice(-20).map(c=>({date:c.date,what:c.what,why:c.why}))};}catch(e){}
  return o;};}
/* (I132) a dated change for every goal, ladder phase or fading step: taken from the Record's advice (its button), or ticked on
   the Teach sheet. Each is listed under the graph with the rule that triggered it, drawn on the graph, and sent with the plan. */
function smToday(){const d=new Date();return (d.getMonth()+1)+'/'+d.getDate();}
function smChgBtn(kind,val,label,why){return ' <button type="button" class="tool noprint" data-chg="'+kind+'|'+esc(String(val))+'" data-why="'+esc(String(why||'').replace(/<[^>]+>/g,'').replace(/&rsquo;/g,'’').replace(/&[a-z]+;/g,' '))+'">'+label+'</button>';}
function smChgLog(k,what,why){S.chg.push({date:smToday(),what,why:why||'',k});}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-chg]');if(!b)return;const [kind,val]=b.dataset.chg.split('|'),why=b.dataset.why||'';
  if(kind==='goal'||kind==='start'){const from=S.meta.goal||'';if(!(await nbhUI.confirm('Set the goal to '+val+'%'+(kind==='start'?' and start phase 1':'')+'?\nThe change is dated today on the Record and its graph.',{ok:'Change it'})))return;
    S.meta.goal=val;smChgLog('goal','Goal '+(from?from+'%':'none')+' → '+val+'%',why);
    if(kind==='start'){const was=curPhase();S.lad.forEach((l,i)=>{l.on=LADDER[i].ph==='1';});smChgLog('lad','Ladder phase '+(was||'none')+' → 1','the first goal set from the baseline');}}
  else if(kind==='lad'){const was=curPhase();if(!(await nbhUI.confirm('Move to phase '+val+' of the matching ladder?\nThe change is dated today on the Record and its graph.',{ok:'Move'})))return;
    S.lad.forEach((l,i)=>{l.on=LADDER[i].ph===val;});smChgLog('lad','Ladder phase '+(was||'none')+' → '+val,why);}
  else return;
  renderAll();});
document.addEventListener('change',e=>{const el=e.target;if(el.type!=='checkbox'||!el.checked||(el.dataset.r!=='lad'&&el.dataset.r!=='fade'))return;const i=+el.dataset.i;
  if(el.dataset.r==='lad')smChgLog('lad','Ladder phase '+LADDER[i].ph+' ticked','ticked on the Teach sheet');else smChgLog('fade','Fading step '+(i+1)+' ticked','ticked on the Teach sheet');
  renderRecord();});
function smChgRender(){const el=$('#logChg');if(!el)return;const C=(S.chg||[]).slice(-12);
  el.innerHTML=C.length?'<p class="hint" style="margin:4px 0"><b>Changes</b> (dated as made): '+C.map(c=>esc(c.date)+': '+esc(c.what)+(c.why?' ('+esc(c.why)+')':'')).join(' · ')+'</p>':'';}
