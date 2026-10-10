const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const fmt1=v=>v==null?'—':(Math.round(v*10)/10).toString();
const pct=v=>v==null?'—':Math.round(v)+'%';

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

/* ---------------- fixed text ---------------- */
const TYPES={indep:'Independent group contingency',dep:'Dependent group contingency',interdep:'Interdependent group contingency',gbg:'The Good Behavior Game',cwfit:'CW-FIT',random:'Randomized interdependent contingency',selfmon:'Class-wide self-monitoring at a cue',tootle:'Tootling'};
const TEAMCOL=['#1f6fa8','#c47a2c','#7b5bb5','#3c8a4a'];
const FADE=[
  {ph:'1',freq:'Every day, in the one period on the Setup sheet',rw:'Right after the game period',move:'The criterion is at its terminal value and has been met on 5 game days (working convention)'},
  {ph:'2',freq:'Three announced days a week; a second period added',rw:'At the end of the same day',move:'Terminal criterion held for two weeks in both periods'},
  {ph:'3',freq:'One or two unannounced days a week; the class learns which when the game starts',rw:'At the end of the week, from the days won',move:'Four weeks at the criterion on game days and on probe days without the game'},
  {ph:'4',freq:'Retired; the expectations stay posted and the teacher praises at the old interval',rw:'Occasional class privileges on no fixed rule',move:'Exit; the Record holds on probes once a month'}
];
const FID=[
  'The expectations are posted where the class can see them and were reviewed, in the students&rsquo; words, before the period began.',
  'The teams and the day&rsquo;s criterion were announced before the game started (or the jar was drawn as written).',
  'The timer was set and the start of the game was announced; the class knew the game was on.',
  'Every foul or point was recorded within seconds of the behavior, against the right team, with a tally the class can see.',
  'Each point was given with a specific praise statement naming the team and the behavior (or each foul was recorded in a neutral voice without a lecture).',
  'Inappropriate behavior that was not a foul was ignored; no consequence outside the rules was added during the game.',
  'No mark or point was removed, and the game was not stopped early as a punishment.',
  'The scores were tallied at the end, read aloud, and the winning team or teams named; the losing team heard nothing more.',
  'The reward was delivered as written: the same day, in the form announced, to every team that met the criterion.',
  'The day was entered on the Record (date, phase, criterion, score per team) before the end of the day.'
];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{},type:'',exp:[],menu:[],teams:[],fade:FADE.map(()=>({crit:'',date:''})),log:[],fid:FID.map(()=>({in:'',note:''})),fl:[]};}
let S=blank();
function ensure(){
  if(!Array.isArray(S.exp))S.exp=[];if(!Array.isArray(S.menu))S.menu=[];if(!Array.isArray(S.teams))S.teams=[];if(!Array.isArray(S.log))S.log=[];if(!Array.isArray(S.fl))S.fl=[];
  if(!Array.isArray(S.fade)||S.fade.length!==FADE.length)S.fade=FADE.map(()=>({crit:'',date:''}));
  if(!Array.isArray(S.fid)||S.fid.length!==FID.length)S.fid=FID.map(()=>({in:'',note:''}));
  while(S.exp.length<3)S.exp.push({text:'',looks:'',nex:''});
  while(S.menu.length<3)S.menu.push({item:'',kind:'',amt:'',how:''});
  S.log.forEach(r=>{if(!Array.isArray(r.v))r.v=['','','',''];while(r.v.length<4)r.v.push('');});
}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function setType(v){S.type=v;document.body.className=document.body.className.replace(/\bct-\S+/g,'').trim()+(v?' ct-'+v:'');
  $$('#ctOpt label').forEach(l=>{l.classList.toggle('on',l.dataset.ct===v);l.querySelector('input').checked=l.dataset.ct===v;});}
$('#ctOpt').addEventListener('change',e=>{if(e.target.name==='ct'){setType(e.target.value);renderAll();}});

/* ---------------- derived ---------------- */
function dir(){
  if(S.meta.dir==='low'||S.meta.dir==='high')return S.meta.dir;
  if(S.type==='gbg')return 'low';if(S.type==='cwfit'||S.type==='tootle'||S.type==='selfmon')return 'high';
  const m=S.meta.measure||'';if(/Percent|Points/.test(m))return 'high';return 'low';
}
function ncol(){return Math.max(1,Math.min(4,S.teams.length));}
function colName(i){const t=S.teams[i];return S.teams.length?((t&&t.name)||('Team '+(i+1))):'Class';}
function rowCrit(r){return r.ph==='B'?null:num(r.crit);}
function cellMet(r,i){const c=rowCrit(r),v=num(r.v[i]);if(c==null||v==null)return null;return dir()==='low'?v<=c:v>=c;}
/* the Good Behavior Game won by the fewest fouls: the lowest score wins, ties both; one option also pays any team at or
   under the criterion */
function winMode(){return S.type==='gbg'&&/fewest fouls/.test(S.meta.g_win||'');}
function winners(r){if(r.ph==='B')return [];const v=[];for(let i=0;i<ncol();i++){const x=num(r.v[i]);if(x!=null)v.push([i,x]);}if(!v.length)return [];const lo=Math.min(...v.map(x=>x[1]));const w=v.filter(x=>x[1]===lo).map(x=>x[0]);
  if(/at or under the criterion/.test(S.meta.g_win||''))v.forEach(x=>{if(cellMet(r,x[0])&&!w.includes(x[0]))w.push(x[0]);});return w.sort((a,b)=>a-b);}
/* tootling: a running total toward the cumulative goal, restarted the day it is reached */
function tootMode(){return S.type==='tootle';}
function tootGoal(){return num(S.meta.t_goaln);}
function tootCum(){const g=tootGoal();let cum=0;return S.log.map(r=>{if(r.ph==='B')return null;const x=num(r.v[0]);if(x==null)return null;cum+=x;const reached=g!=null&&g>0&&cum>=g;const o={cum,reached:g!=null&&g>0?reached:null};if(reached)cum=0;return o;});}
function rowMet(r){if(tootMode()){const c=tootCum()[S.log.indexOf(r)];return c?c.reached:null;}let any=false,all=true;for(let i=0;i<ncol();i++){const m=cellMet(r,i);if(m===null)continue;any=true;if(!m)all=false;}return any?all:null;}
function vals(r){const o=[];for(let i=0;i<ncol();i++){const v=num(r.v[i]);if(v!=null)o.push(v);}return o;}
function baseStats(){const B=S.log.filter(r=>r.ph==='B'),xs=[];B.forEach(r=>xs.push(...vals(r)));
  const mean=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
  const sug=mean==null?null:(dir()==='low'?Math.max(1,Math.round(mean/2)):Math.ceil(mean));
  return{days:B.length,n:xs.length,mean,min:xs.length?Math.min(...xs):null,max:xs.length?Math.max(...xs):null,sug};}
function unitWord(){return S.meta.unit||(dir()==='low'?'fouls':'points');}
function critPhrase(c){if(c==null)return dir()==='low'?'no more than the criterion number of '+unitWord():'at least the criterion number of '+unitWord();
  return dir()==='low'?'no more than '+c+' '+unitWord():'at least '+c+' '+unitWord();}

/* ---------------- rows ---------------- */
function renderE(){
  $('#eTbl tbody').innerHTML=S.exp.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="exp" data-i="${i}" data-f="text" value="${esc(r.text)}" placeholder="${['Hands up to talk','Stay in your seat','Hands and feet to yourself','Follow directions the first time','Use kind words'][i]||''}"></td>
    <td><input data-r="exp" data-i="${i}" data-f="looks" value="${esc(r.looks)}" placeholder="${['hand raised, voice off until called on','bottom on the chair, chair on the floor','hands on your own desk and work','started within 10 seconds','please, thank you, a compliment'][i]||''}"></td>
    <td><input data-r="exp" data-i="${i}" data-f="nex" value="${esc(r.nex)}" placeholder="${['talking without a hand up','out of seat without permission','touching others or their things','not started after 10 seconds','name-calling, teasing'][i]||''}"></td>${delCell('exp',i,'expectation')}</tr>`).join('');
}
function renderM(){
  const K=['','Activity','Privilege','Social','Tangible (not edible)','Edible (family agreement)'];
  $('#mTbl tbody').innerHTML=S.menu.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="menu" data-i="${i}" data-f="item" value="${esc(r.item)}" placeholder="${['Five minutes of free choice','Music during independent work','Extra recess on Friday'][i]||''}"></td>
    <td><select data-r="menu" data-i="${i}" data-f="kind" aria-label="Kind of item ${i+1}">${K.map(k=>`<option value="${esc(k)}"${r.kind===k?' selected':''}>${esc(k)}</option>`).join('')}</select></td>
    <td><input data-r="menu" data-i="${i}" data-f="amt" value="${esc(r.amt)}"></td>
    <td><input data-r="menu" data-i="${i}" data-f="how" value="${esc(r.how)}" placeholder="class vote; teacher&rsquo;s choice"></td>${delCell('menu',i,'item')}</tr>`).join('');
}
function renderTm(){
  $('#tmTbl tbody').innerHTML=S.teams.map((r,i)=>`<tr><td class="num"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${TEAMCOL[i]};vertical-align:-1px"></span> ${i+1}</td>
    <td><input data-r="teams" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="${['Blue Jays','Cardinals','Falcons','Owls'][i]}"></td>
    <td><input data-r="teams" data-i="${i}" data-f="members" value="${esc(r.members)}" placeholder="rows 1 and 2; or the names"></td>${delCell('teams',i,'team')}</tr>`).join('');
}
function renderFade(){
  $('#fadeTbl tbody').innerHTML=FADE.map((f,i)=>`<tr><td class="num">${f.ph}</td><td>${f.freq}</td><td>${f.rw}</td><td><input data-r="fade" data-i="${i}" data-f="crit" value="${esc(S.fade[i].crit)}" placeholder="${i===0?'start':i===FADE.length-1?'terminal':'stepped'}" style="text-align:center"></td><td>${f.move}</td><td><input data-r="fade" data-i="${i}" data-f="date" value="${esc(S.fade[i].date)}"></td></tr>`).join('');
}
function renderL(){
  const n=ncol();
  $('#lTbl thead').innerHTML='<tr><th style="width:4%">#</th><th style="width:10%">Date</th><th style="width:8%">Phase</th><th style="width:9%">Criterion</th>'+Array.from({length:n},(_,i)=>'<th style="width:9%"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:'+TEAMCOL[i]+';margin-right:4px"></span>'+esc(colName(i))+'</th>').join('')+(tootMode()?'<th style="width:8%">Total</th>':'')+'<th style="width:7%">Met</th>'+(winMode()?'<th style="width:12%">Won</th>':'')+'<th style="width:12%">Reward</th><th>Note</th><th class="nx noprint"></th></tr>';
  const cum=tootMode()?tootCum():null;
  $('#lTbl tbody').innerHTML=S.log.map((r,i)=>{const m=rowMet(r);
    return `<tr><td class="num">${i+1}</td><td><input data-r="log" data-i="${i}" data-f="date" value="${esc(r.date)}"></td>
    <td><select data-r="log" data-i="${i}" data-f="ph" aria-label="Phase on day ${i+1}">${['B','1','2','3','4'].map(p=>`<option value="${p}"${r.ph===p?' selected':''}>${p==='B'?'B (baseline)':p}</option>`).join('')}</select></td>
    <td><input data-r="log" data-i="${i}" data-f="crit" value="${esc(r.crit)}" style="text-align:center"${r.ph==='B'?' disabled placeholder="—"':''}></td>
    ${Array.from({length:n},(_,k)=>`<td><input data-r="log" data-i="${i}" data-f="v${k}" value="${esc(r.v[k])}" style="text-align:center" aria-label="${esc(colName(k))} on day ${i+1}"></td>`).join('')}
    ${cum?`<td class="num tot">${cum[i]?cum[i].cum+(tootGoal()?' of '+tootGoal():''):'—'}</td>`:''}<td class="met ${m===true?'y':m===false?'n':''}">${m===true?'Yes':m===false?'No':'—'}</td>${winMode()?`<td class="won">${esc(winners(r).map(colName).join(' and ')||'—')}</td>`:''}
    <td><select data-r="log" data-i="${i}" data-f="rw" aria-label="Reward on day ${i+1}"><option value=""></option>${['Delivered','Not earned','Earned, not delivered'].map(o=>`<option${r.rw===o?' selected':''}>${o}</option>`).join('')}</select></td>
    <td><input data-r="log" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('log',i,'day')}</tr>`;}).join('');
}
function renderFid(){
  $('#fidTbl tbody').innerHTML=FID.map((t,i)=>`<tr><td class="num">${i+1}</td><td>${t}</td><td><select data-r="fid" data-i="${i}" data-f="in" aria-label="Step ${i+1} seen"><option value=""></option>${['Yes','No','N/A'].map(o=>`<option${S.fid[i].in===o?' selected':''}>${o}</option>`).join('')}</select></td><td><input data-r="fid" data-i="${i}" data-f="note" value="${esc(S.fid[i].note)}"></td></tr>`).join('');
}
function renderFl(){
  $('#flTbl tbody').innerHTML=S.fl.length?S.fl.map((r,i)=>`<tr><td class="num">${i+1}</td><td>${esc(r.date)}</td><td>${esc(r.who)}</td><td class="num">${esc(r.pct)}${r.pct===''?'':'%'}</td><td>${esc(r.missed)||'none'}</td>${delCell('fl',i,'log entry')}</tr>`).join(''):'<tr><td colspan="6" class="hint">No observations logged yet.</td></tr>';
}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){
    const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(r==='log'&&/^v\d$/.test(f))S.log[i].v[+f.slice(1)]=el.value;else S[r][i][f]=el.value;
    if(r==='log'){if(tootMode()){const cum=tootCum();$$('#lTbl tbody tr').forEach((tr,k)=>{const c=cum[k],m=S.log[k]&&rowMet(S.log[k]),td=tr.querySelector('td.met'),tt=tr.querySelector('td.tot');if(tt)tt.textContent=c?c.cum+(tootGoal()?' of '+tootGoal():''):'—';if(td){td.className='met '+(m===true?'y':m===false?'n':'');td.textContent=m===true?'Yes':m===false?'No':'—';}});}else{const tr=el.closest('tr'),m=rowMet(S.log[i]),td=tr.querySelector('td.met');td.className='met '+(m===true?'y':m===false?'n':'');td.textContent=m===true?'Yes':m===false?'No':'—';const w=tr.querySelector('td.won');if(w)w.textContent=winners(S.log[i]).map(colName).join(' and ')||'—';}renderRecord();renderBase();}
    else if(r==='exp'){renderExp();renderPoster();}
    else if(r==='menu'){renderMenu();}
    else if(r==='teams'){renderPosterSoon();renderRule();renderLegend();}
    return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;
    if(/^(crit|unit|mins|reward|rw_when|cls|teacher|grade|g_|c_|dp_|id_|r_|s_|t_|in_|po_|announce|never|when)/.test(el.dataset.m)){renderRule();renderPosterSoon();}
    if(/^(crit|cc_|dir|t_goaln)/.test(el.dataset.m)){renderRecord();if(el.dataset.m==='t_goaln')renderL();}}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){
    const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(el.type==='checkbox')S[r][i][f]=el.checked;else if(!(r==='log'&&/^v\d$/.test(f)))S[r][i][f]=el.value;
    if(r==='log'){if(f==='ph'){renderL();}renderRecord();renderBase();}
    if(r==='fid')renderFidelity();if(r==='menu')renderMenu();
    return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderRule();renderPoster();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderRule();renderPoster();renderRecord();renderBase();renderL();}
});
$('#addE').addEventListener('click',()=>{if(S.exp.length>=5)return;S.exp.push({text:'',looks:'',nex:''});renderE();renderExp();renderPoster();});
$('#delE').addEventListener('click',async ()=>{if(S.exp.length<=1)return;const r=S.exp[S.exp.length-1];if((r.text||r.looks)&&!(await nbhUI.confirm('Remove the last expectation?\nIts text and examples are deleted.',{ok:'Remove',danger:true})))return;S.exp.pop();renderE();renderExp();renderPoster();});
$('#addM').addEventListener('click',()=>{if(S.menu.length>=12)return;S.menu.push({item:'',kind:'',amt:'',how:''});renderM();renderMenu();});
$('#delM').addEventListener('click',async ()=>{if(S.menu.length<=1)return;const r=S.menu[S.menu.length-1];if(r.item&&!(await nbhUI.confirm('Remove the last item?\nIts name, amount and delivery are deleted from the menu.',{ok:'Remove',danger:true})))return;S.menu.pop();renderM();renderMenu();});
$('#addTm').addEventListener('click',()=>{if(S.teams.length>=4)return;S.teams.push({name:'',members:''});renderTm();renderL();renderRule();renderPoster();renderRecord();});
$('#delTm').addEventListener('click',async ()=>{if(!S.teams.length)return;const r=S.teams[S.teams.length-1];if((r.name||r.members)&&!(await nbhUI.confirm('Remove the last team?\nIts column on the Record is hidden, not deleted.',{ok:'Remove',danger:true})))return;S.teams.pop();renderTm();renderL();renderRule();renderPoster();renderRecord();});
$('#addL').addEventListener('click',()=>{const last=S.log[S.log.length-1];const ph=last?last.ph:(S.log.length?'1':'B');S.log.push({date:'',ph,crit:ph==='B'?'':(last&&last.ph!=='B'?last.crit:S.meta.crit||''),v:['','','',''],rw:'',note:''});renderL();renderRecord();renderBase();});
$('#delL').addEventListener('click',async ()=>{if(!S.log.length)return;const r=S.log[S.log.length-1];if((r.date||r.v.some(x=>x))&&!(await nbhUI.confirm('Remove the last day?\nIts date and scores are deleted from the Record.',{ok:'Remove',danger:true})))return;S.log.pop();renderL();renderRecord();renderBase();});
$('#fidAdd').addEventListener('click',()=>{const f=fidStats();if(f.n===0){alert('Score at least one step first.');return;}
  S.fl.push({date:S.meta.f_date||'',who:S.meta.f_who||'',pct:String(Math.round(f.pct)),missed:f.missed.join(', ')});renderFl();});
$('#flDel').addEventListener('click',async ()=>{if(!S.fl.length)return;if(!(await nbhUI.confirm('Remove the last log entry?\nThe fidelity check it holds is deleted.',{ok:'Remove',danger:true})))return;S.fl.pop();renderFl();});
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  if(r==='exp'){if((row.text||row.looks||row.nex)&&!(await nbhUI.confirm('Delete this row?\nThe expectation it holds is deleted.',{ok:'Delete',danger:true})))return;S.exp.splice(i,1);if(!S.exp.length)S.exp.push({text:'',looks:'',nex:''});renderE();renderExp();renderRule();renderPoster();}
  else if(r==='menu'){if((row.item||row.amt||row.how)&&!(await nbhUI.confirm('Delete this row?\nThe menu item it holds is deleted.',{ok:'Delete',danger:true})))return;S.menu.splice(i,1);if(!S.menu.length)S.menu.push({item:'',kind:'',amt:'',how:''});renderM();renderMenu();}
  else if(r==='teams'){const n=S.log.filter(x=>x.v[i]).length;
    if((row.name||row.members||n)&&!(await nbhUI.confirm('Delete this team?'+(n?'\nIts scores on '+n+' day'+(n===1?'':'s')+' of the Record will be removed; later teams move left.':''),{ok:'Delete',danger:true})))return;
    S.teams.splice(i,1);S.log.forEach(x=>{x.v.splice(i,1);x.v.push('');});renderTm();renderL();renderRule();renderPoster();renderRecord();renderBase();}
  else if(r==='log'){if((row.date||row.note||row.v.some(x=>x))&&!(await nbhUI.confirm('Delete this row?\nThe day it holds is deleted from the Record.',{ok:'Delete',danger:true})))return;S.log.splice(i,1);renderL();renderRecord();renderBase();}
  else if(r==='fl'){if(!(await nbhUI.confirm('Delete this row?\nThe fidelity check it holds is deleted.',{ok:'Delete',danger:true})))return;S.fl.splice(i,1);renderFl();}
}
$('#gcPngBtn').addEventListener('click',()=>svgToPng($('#logPlot'),graphFile('GC-1',S.meta.cls)));
let poT=0;function renderPosterSoon(){clearTimeout(poT);poT=setTimeout(renderPoster,250);}

/* ---------------- setup verdicts ---------------- */
function renderExp(){
  const filled=S.exp.filter(e=>e.text.trim()),neg=filled.filter(e=>/^\s*(no|don'?t|do not|stop|never|not)\b/i.test(e.text));
  const out=[];
  if(neg.length)out.push('Stated as a prohibition: '+neg.map(e=>'&ldquo;'+esc(e.text)+'&rdquo;').join(', ')+'. Rewrite as what students do; the prohibition belongs in the third column as the foul.');
  if(filled.length&&filled.length<3)out.push('Fewer than three expectations; three to five is the working convention.');
  const nolooks=filled.filter(e=>!e.looks.trim());if(filled.length>=3&&nolooks.length)out.push('No &ldquo;looks like&rdquo; line for: '+nolooks.map(e=>esc(e.text)).join(', ')+'. The teacher needs it to praise to a point.');
  $('#expVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':filled.length>=3?'<div class="verdict v-ok"><b>'+filled.length+' expectations, positively stated.</b> They go on the poster as written.</div>':'';
}
function renderMenu(){
  const f=S.menu.filter(m=>m.item.trim());if(!f.length){$('#menuVerdict').innerHTML='';return;}
  const ed=f.filter(m=>/Edible/.test(m.kind)).length,act=f.filter(m=>/Activity|Privilege|Social/.test(m.kind)).length;
  let h='';if(ed&&ed===f.length)h='<div class="verdict v-mid">Every item is edible. Add activities and privileges; edibles are the last choice and need family agreement.</div>';
  else if(!act&&f.length)h='<div class="verdict v-mid">No activity, privilege or social item yet. The default menu for a class is made of them.</div>';
  else h='<div class="verdict v-ok"><b>'+f.length+' items on the menu'+(ed?', '+ed+' edible':'')+'.</b> The Design sheet names the one the class plays for.</div>';
  $('#menuVerdict').innerHTML=h;
}
function renderBase(){
  const b=baseStats(),M=$('#baseMetrics');
  M.innerHTML=`<div class="metric"><b>Baseline days (phase B)</b><div class="val">${b.days||'—'}</div><div class="sub">${b.n} value${b.n===1?'':'s'} on the Record</div></div>
    <div class="metric"><b>Baseline mean</b><div class="val">${fmt1(b.mean)}</div><div class="sub">${b.min!=null?'range '+b.min+' to '+b.max:'enter days as phase B on the Record'} · ${esc(unitWord())}</div></div>
    <div class="metric"><b>Suggested starting criterion</b><div class="val">${b.sug!=null?b.sug:'—'}</div><div class="sub">${dir()==='low'?'about half the baseline mean: the game cuts fouls from the first day, and a ceiling at baseline asks nothing':'the mean, rounded up: just above an average day'} (working convention)</div></div>`;
}

/* ---------------- the rule ---------------- */
function lines(s){return String(s||'').split('\n').map(x=>x.trim()).filter(Boolean);}
function fouls(){const f=lines(S.meta.g_fouls);if(f.length)return f;return S.exp.filter(e=>e.nex.trim()).map(e=>e.nex.trim());}
function teamNames(){return S.teams.map((t,i)=>t.name||('Team '+(i+1)));}
const lc=s=>/^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|^[A-Z]{2}|^\[/.test(s)?s:s.charAt(0).toLowerCase()+s.slice(1);
function rewardText(){const r=(S.type==='gbg'?S.meta.g_prize:'')||S.meta.reward;return r?r:'[the reward]';}
function ruleText(){
  const m=S.meta,c=num(m.crit),T=teamNames(),when=m.when?' during '+lc(m.when):'',mins=m.mins?' ('+m.mins+' minutes)':'',rw=lc(rewardText()),rwWhen=m.rw_when?', '+m.rw_when.charAt(0).toLowerCase()+m.rw_when.slice(1):'';
  const team=T.length?T.length+' teams ('+T.join(', ')+')':'[the teams]';
  switch(S.type){
    case 'indep':return `Every student plays by the same rule${when}${mins}: a student who ${m.in_crit?'reaches '+m.in_crit:'meets the criterion ('+critPhrase(c)+')'} earns ${rw}${rwWhen}. ${m.in_track?'Tracked by: '+m.in_track.charAt(0).toLowerCase()+m.in_track.slice(1)+'.':''} Nobody&rsquo;s reward depends on anyone else. ${m.in_miss?'A student who does not earn: '+m.in_miss+'.':''}`;
    case 'dep':return `The whole class earns ${rw}${rwWhen} when ${m.dp_who?m.dp_who:'[the student]'} ${m.dp_beh?'meets this: '+m.dp_beh:'meets the criterion ('+critPhrase(c)+')'}${when}${mins}. ${m.dp_named?m.dp_named+'.':''} Peers encourage; the teacher keeps the score; any pressure or blame ends the arrangement for the day.`;
    case 'interdep':return `${m.id_unit?m.id_unit:'The class or each team'} earns ${rw}${rwWhen} when ${m.id_rule?m.id_rule.charAt(0).toLowerCase()+m.id_rule.slice(1):'the group meets the criterion'} (${critPhrase(c)})${when}${mins}. ${m.id_sab?'Saboteur rule: '+m.id_sab+'.':''}`;
    case 'gbg':{const f=fouls();return `The class is divided into ${team}. The game runs ${m.g_time?lc(m.g_time):('[when]'+when)}${mins}. A foul goes against a team each time a member is ${f.length?f.map(lc).join('; '):'seen breaking a rule'}. ${m.g_win?m.g_win+'.':'Every team with '+critPhrase(c)+' wins.'} ${m.g_win?'(Criterion: '+critPhrase(c)+'.)':''} Winners earn ${rw}${rwWhen}. ${m.g_rec?'Fouls are recorded by '+m.g_rec+'.':''}`;}
    case 'cwfit':{const sk=lines(m.c_skills);return `${team} play${when}${mins}. The skills are ${sk.length?sk.join('; '):'getting the teacher&rsquo;s attention, following directions, and ignoring inappropriate behavior'}. Every ${m.c_int||'[N]'} minutes the timer sounds; each team whose members are all using the skills earns ${m.c_pts||'1'} point and a praise statement. A team that reaches ${m.c_goal||critPhrase(c)} earns ${rw}${rwWhen}.`;}
    case 'random':{const d=[];if(S.chk.r_crit)d.push('the criterion');if(S.chk.r_beh)d.push('the expectation that counts');if(S.chk.r_stu)d.push('the students whose scores count');if(S.chk.r_rw)d.push('the reward');
      return `${T.length?team:'The class'} play${when}${mins} under every expectation. After the period ${d.length?d.join(', ')+' are drawn from the jar':'[what is drawn] is drawn from the jar'}; the class earns ${S.chk.r_rw?'what the slip or the mystery envelope says':rw}${rwWhen} when the drawn criterion is met${c!=null?' (the written criterion is '+critPhrase(c)+')':''}.`;}
    case 'selfmon':return `At ${m.s_cue?m.s_cue.charAt(0).toLowerCase()+m.s_cue.slice(1):'the cue'}${m.s_int?' about every '+m.s_int+' minutes':''}${when}${mins}, each student answers &ldquo;${m.s_q||'Was I meeting the expectation?'}&rdquo; ${m.s_how?'('+m.s_how+')':''}. The class earns ${rw}${rwWhen} when ${m.s_crit||critPhrase(c)}. ${m.s_chk?'Teacher check: '+m.s_chk+'.':''}`;
    case 'tootle':return `Students write a tootle when they see ${m.t_what||'a classmate doing something kind or helpful'}${m.t_how?' ('+m.t_how+')':''}. ${m.t_read?m.t_read+'.':'The teacher counts them and reads some aloud.'} The class earns ${rw}${rwWhen} when ${m.t_goal||(tootGoal()?'the class total reaches '+tootGoal()+' tootles':critPhrase(c))}.`;
    default:return '';
  }
}
function renderRule(){
  const R=$('#ruleOut'),V=$('#designVerdict');
  if(!S.type){R.innerHTML='<div class="rule"><b>The rule</b>Choose an arrangement above; the rule is written here from its fields.</div>';V.innerHTML='';return;}
  R.innerHTML='<div class="rule"><b>'+esc(TYPES[S.type])+'</b>'+ruleText().replace(/\s+\./g,'.').replace(/\s{2,}/g,' ')+'</div>';
  const out=[],m=S.meta,c=num(m.crit),b=baseStats();
  if(c==null)out.push('No starting criterion. '+(b.sug!=null?'The baseline suggests '+b.sug+' '+esc(unitWord())+'.':'Enter baseline days as phase B on the Record and the Setup sheet suggests one.'));
  else if(b.mean!=null&&dir()==='low'&&c<b.mean/4)out.push('The criterion ('+c+') is under a quarter of the baseline mean ('+fmt1(b.mean)+'): the class will lose at first. Start near half the mean and tighten on the rule (working convention).');
  else if(b.mean!=null&&dir()==='low'&&c>b.mean)out.push('The criterion ('+c+') is above the baseline mean ('+fmt1(b.mean)+'): the class meets it without the game. Start near half the mean (working convention).');
  else if(b.mean!=null&&dir()==='high'&&c>b.mean*1.25)out.push('The criterion ('+c+') is well above the baseline mean ('+fmt1(b.mean)+'): the class will lose at first. Start just above the mean and raise on the rule (working convention).');
  if(!m.reward&&!(S.type==='gbg'&&m.g_prize))out.push('No reward named. Take one from the menu on the Setup sheet.');
  if(['gbg','cwfit'].includes(S.type)&&S.teams.length<2)out.push('Fewer than two teams; the game needs at least two.');
  if(S.type==='dep'){const need=['dp_agree','dp_reach','dp_peers','dp_exit'].filter(k=>!S.chk[k]);if(need.length)out.push('A dependent contingency needs the first four safeguards ticked before it runs ('+need.length+' missing).');}
  if(S.type==='interdep'&&!m.id_sab)out.push('No saboteur rule. Write what happens when one student repeatedly costs the group (a team of one, with the same rule and prize, is the arrangement the literature uses).');
  if(S.type==='random'&&!['r_crit','r_beh','r_stu','r_rw'].some(k=>S.chk[k]))out.push('Nothing is ticked as drawn; tick at least one component or choose another arrangement.');
  if(!m.never)out.push('Write what never happens (no marks removed, no scolding of a losing team, no early stop as a punishment).');
  V.innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':'<div class="verdict v-ok"><b>Ready to post.</b> The poster and the record follow this rule; the criterion steps on the rows below.</div>';
}

/* ---------------- the poster ---------------- */
function renderPoster(){
  const m=S.meta,c=num(m.crit),T=teamNames(),ex=S.exp.filter(e=>e.text.trim());
  const title=m.po_title||((m.cls?m.cls+' ':'Our ')+'Expectations');
  const want=k=>!!S.chk[k]||!(S.chk.po_exp||S.chk.po_score||S.chk.po_rules);
  const days={'1':['Today'],'3':['Monday','Wednesday','Friday'],'4':['Monday','Tuesday','Wednesday','Thursday']}[m.po_days]||['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const foot='<div class="po-foot"><span>'+esc(m.cls||'')+(m.teacher?' · '+esc(m.teacher):'')+'</span><span>Form GC-1</span></div>';
  let h='';
  if(want('po_exp'))h+='<div class="po-page"><p class="po-kicker">'+esc(m.cls||'Our class')+'</p><div class="po-title">'+esc(title)+'</div>'+
    (ex.length?'<ol class="po-exp">'+ex.map((e,i)=>'<li><span class="n">'+(i+1)+'</span><div><div class="w">'+esc(e.text)+'</div>'+(e.looks?'<div class="l">'+esc(e.looks)+'</div>':'')+'</div></li>').join('')+'</ol>':'<p class="hint">No expectations yet; enter them on the Setup sheet.</p>')+
    (m.reward||m.g_prize?'<div class="po-big" style="margin-top:18px">We earn: '+esc(rewardText())+'</div>':'')+foot+'</div>';
  if(want('po_score')){const rows=T.length?T:['Our class'];
    h+='<div class="po-page"><p class="po-kicker">'+esc(m.cls||'Our class')+'</p><div class="po-title">Scoreboard</div>'+
      '<div class="po-goal">'+(c!=null?'The goal: '+esc(critPhrase(c)):'The goal: ____ '+esc(unitWord()))+'</div>'+
      '<table class="po-score"><thead><tr><th class="team">Team</th>'+days.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>'+
      rows.map((t,i)=>'<tr><th class="team">'+(T.length?'<span class="po-team" style="background:'+TEAMCOL[i]+'"></span>':'')+esc(t)+'</th>'+days.map(()=>'<td class="box"></td>').join('')+'</tr>').join('')+
      '<tr><td class="crit">Goal</td>'+days.map(()=>'<td class="crit">'+(c!=null?esc(String(c)):'')+'</td>').join('')+'</tr>'+
      '<tr class="win"><th class="team">Winners</th>'+days.map(()=>'<td></td>').join('')+'</tr></tbody></table>'+
      '<div class="po-big" style="margin-top:16px;font-size:20px">'+(dir()==='low'?'At or under the goal wins.':'At or over the goal wins.')+(S.type==='gbg'||T.length>1?' Every team can win.':'')+'</div>'+foot+'</div>';}
  if(want('po_rules')){
    if(S.type==='gbg'){const f=fouls();
      h+='<div class="po-page"><p class="po-kicker">'+esc(m.cls||'Our class')+'</p><div class="po-title">The Good Behavior Game</div><div class="po-cols"><div><div class="po-h">How we play</div><ul class="po-list">'+
        '<li>'+(T.length?T.length+' teams: '+esc(T.join(', ')):'The class plays in teams')+'</li><li>'+esc(m.g_time||('When: '+(m.when||'____')))+(m.mins?' ('+esc(m.mins)+' minutes)':'')+'</li><li>A mark goes against a team when a member breaks a rule</li><li>'+(m.g_rec?'Scored by '+esc(lc(m.g_rec)):'The teacher keeps the score on the board')+'</li></ul></div>'+
        '<div><div class="po-h">The rules</div>'+(f.length?'<ul class="po-list">'+f.map(x=>'<li>No '+esc((y=>y.charAt(0).toLowerCase()+y.slice(1))(x.replace(/^no\s+/i,'')))+'</li>').join('')+'</ul>':'<p class="hint">Enter the fouls on the Design sheet or the third column of the expectations.</p>')+'</div></div>'+
        '<div class="po-h">How to win</div><div class="po-big">'+esc(m.g_win||('Every team with '+critPhrase(c)+' wins'))+'</div>'+
        '<div class="po-h">The prize</div><div class="po-big">'+esc(rewardText())+(m.rw_when?' <span style="font-weight:400;font-size:18px">('+esc(m.rw_when.toLowerCase())+')</span>':'')+'</div>'+foot+'</div>';}
    else{h+='<div class="po-page"><p class="po-kicker">'+esc(m.cls||'Our class')+'</p><div class="po-title">'+esc(S.type?TYPES[S.type]:'How We Earn')+'</div>'+
        '<div class="po-h">The rule</div><div style="font-size:19px;line-height:1.5">'+(S.type?ruleText().replace(/\s+\./g,'.'):'Choose an arrangement on the Design sheet.')+'</div>'+
        (ex.length?'<div class="po-h">How we earn</div><ul class="po-list">'+ex.map(e=>'<li><b>'+esc(e.text)+'</b>'+(e.looks?': '+esc(e.looks):'')+'</li>').join('')+'</ul>':'')+
        '<div class="po-h">The reward</div><div class="po-big">'+esc(rewardText())+(m.rw_when?' <span style="font-weight:400;font-size:18px">('+esc(m.rw_when.toLowerCase())+')</span>':'')+'</div>'+foot+'</div>';}
  }
  $('#posterOut').innerHTML=h;
}

/* ---------------- the record ---------------- */
function gameRows(){return S.log.filter(r=>r.ph!=='B'&&rowMet(r)!==null);}
function renderRecord(){
  const v=$('#logVerdict'),M=$('#logMetrics'),RU=$('#logRules');
  const b=baseStats(),G=gameRows(),last=G.slice(-4),met=last.filter(r=>rowMet(r)).length;
  const gx=[];G.forEach(r=>gx.push(...vals(r)));const gmean=gx.length?gx.reduce((a,c)=>a+c,0)/gx.length:null;
  const cur=G.length?num(G[G.length-1].crit):num(S.meta.crit),ph=G.length?G[G.length-1].ph:'';
  M.innerHTML=`<div class="metric"><b>Baseline mean</b><div class="val">${fmt1(b.mean)}</div><div class="sub">${b.days} day${b.days===1?'':'s'} · ${esc(unitWord())}</div></div>
    <div class="metric"><b>Mean with the game on</b><div class="val">${fmt1(gmean)}</div><div class="sub">${G.length} game day${G.length===1?'':'s'}${b.mean!=null&&gmean!=null?' · '+(dir()==='low'?Math.round((1-gmean/b.mean)*100)+'% below baseline':Math.round((gmean/b.mean-1)*100)+'% above baseline'):''}</div></div>
    <div class="metric"><b>Criterion met, last 4 game days</b><div class="val">${last.length?met+' of '+last.length:'—'}</div><div class="sub">a day is met when every team meets it</div></div>
    <div class="metric"><b>Current criterion</b><div class="val">${cur!=null?cur:'—'}</div><div class="sub">${ph?'phase '+esc(ph)+' · ':''}${dir()==='low'?'at most':'at least'} · terminal ${esc(S.meta.cc_end||'—')}</div></div>`;
  if(!S.log.length){v.innerHTML='<div class="verdict v-mid"><b>No days yet.</b> Enter the baseline days as phase B; the Setup sheet will suggest a starting criterion.</div>';RU.innerHTML='';drawLog();return;}
  const step=num(S.meta.cc_step)??1,end=num(S.meta.cc_end),rules=[];
  if(tootMode()){const g=tootGoal(),cum=tootCum(),rowsT=S.log.map((r,k)=>({r,c:cum[k]})).filter(x=>x.c);const n=rowsT.length,mean=n?rowsT.reduce((a,x)=>a+num(x.r.v[0]),0)/n:null;
    const reached=rowsT.filter(x=>x.c.reached).length;let run=0;for(let k=rowsT.length-1;k>=0&&!rowsT[k].c.reached;k--)run++;const last=n?rowsT[n-1]:null;
    if(g==null||g<=0)rules.push(['mid','No cumulative goal on the Design sheet (Tootling: cumulative goal); the total cannot be read against a goal.']);
    else if(!n)rules.push(['mid','No game days with a count yet.']);
    else if(last.c.reached){const t=end!=null?Math.min(end,g+step):g+step;rules.push(['ok','The class reached the goal of '+g+' tootles on '+esc(last.r.date||'the last game day')+(reached>1?' (reached '+reached+' times so far)':'')+': deliver the reward and raise the goal by the step, from '+g+' to '+t+(end!=null?' (terminal '+end+')':'')+'. The count starts again at zero.']);}
    else{const left=g-last.c.cum,days=mean?Math.ceil(left/mean):null;const txt='Total so far '+last.c.cum+' of '+g+' ('+Math.round(100*last.c.cum/g)+'%) after '+run+' game day'+(run===1?'':'s')+' on this count; mean '+fmt1(mean)+' tootles per game day'+(days!=null?', so the goal in about '+days+' more game day'+(days===1?'':'s')+' at that rate':'')+'.';
      if(run>=10)rules.push(['no',txt+' No goal reached in ten game days: lower the goal to within reach, re-teach what a tootle is, and re-vote the reward (working convention).']);else rules.push(['mid',txt+(reached?' Reached '+reached+' time'+(reached===1?'':'s')+' so far.':'')]);}
    v.innerHTML='<div class="verdict '+(rules.some(r=>r[0]==='no')?'v-no':rules.some(r=>r[0]==='ok')?'v-ok':'v-mid')+'"><b>'+(ph?'Phase '+esc(ph)+' · ':'')+S.log.length+' day'+(S.log.length===1?'':'s')+' recorded ('+G.length+' with the game on).</b> '+rules[0][1]+'</div>';
    RU.innerHTML='<ul style="font-family:var(--sans);font-size:12.5px;margin:4px 0 4px 18px">'+rules.map(r=>'<li>'+r[1]+'</li>').join('')+'</ul><p class="hint">The tootling rules (raise by the step when the goal is reached, lower after ten game days without it) are working conventions; the step and the terminal goal are on the Design sheet.</p>';
    drawLog();return;}
  const tighten=cur==null?null:dir()==='low'?(end!=null?Math.max(end,cur-step):cur-step):(end!=null?Math.min(end,cur+step):cur+step);
  const atEnd=cur!=null&&end!=null&&cur===end;
  if(!G.length)rules.push(['mid',b.days+' baseline day'+(b.days===1?'':'s')+' entered'+(b.sug!=null?'; the suggested starting criterion is '+b.sug+' '+esc(unitWord()):'')+'. No game days yet.']);
  else if(last.length<4)rules.push(['mid','Fewer than four game days: no decision yet.']);
  else if(met>=3){
    if(atEnd){const held=G.slice(-5).filter(r=>num(r.crit)===end).length;
      rules.push([held>=5?'ok':'mid','Criterion met on '+met+' of the last 4 game days at the terminal value'+(held>=5?' and held for 5 game days: move to the next fading phase (phase '+(Math.min(4,(parseInt(ph)||1)+1))+' on the Design sheet).':'; hold until it has been held for 5 game days, then move to the next fading phase.')]);}
    else rules.push(['ok','Criterion met on '+met+' of the last 4 game days: tighten the criterion from '+cur+' to '+tighten+' '+esc(unitWord())+(end!=null?' (terminal '+end+')':'')+'.']);
  }else if(met<2)rules.push(['no','Criterion met on '+met+' of the last 4 game days: relax the criterion by one step (to '+(cur==null?'—':dir()==='low'?cur+step:cur-step)+'), score a game period on the Fidelity sheet, and re-vote the menu before anything else.']);
  else rules.push(['mid','Criterion met on '+met+' of the last 4 game days: hold the criterion.']);
  const losing=[];for(let i=0;i<ncol();i++){const lost=last.filter(r=>cellMet(r,i)===false).length;if(lost>=3)losing.push(colName(i));}
  if(losing.length)rules.push(['no',esc(losing.join(' and '))+' missed the criterion on 3 or more of the last 4 game days: look at who on the team is costing it, teach the expectation again, and consider a team of one before the team gives up.']);
  const nd=last.filter(r=>r.rw==='Earned, not delivered').length;if(nd)rules.push(['no','A reward earned and not delivered on '+nd+' of the last 4 days: the game stops working when the prize does not come.']);
  v.innerHTML='<div class="verdict '+(rules.some(r=>r[0]==='no')?'v-no':rules.some(r=>r[0]==='ok')?'v-ok':'v-mid')+'"><b>'+(ph?'Phase '+esc(ph)+' · ':'')+S.log.length+' day'+(S.log.length===1?'':'s')+' recorded ('+G.length+' with the game on).</b> '+rules[0][1]+'</div>';
  RU.innerHTML='<ul style="font-family:var(--sans);font-size:12.5px;margin:4px 0 4px 18px">'+rules.map(r=>'<li>'+r[1]+'</li>').join('')+'</ul><p class="hint">The thresholds (3 of 4 to tighten, fewer than 2 of 4 to relax, 5 days at the terminal value to fade, a step of '+step+') are working conventions from the Design sheet; change them there if the team uses others.</p>';
  drawLog();
}
function renderLegend(){const n=ncol();$('#plotLegend').innerHTML=Array.from({length:n},(_,i)=>'<span><i style="background:'+TEAMCOL[i]+'"></i>'+esc(colName(i))+'</span>').join('')+'<span><i style="background:#9b4e15;height:3px;border-radius:0"></i>criterion</span><span><i style="background:#fff;border:1.5px solid #5B6B6B"></i>baseline (hollow)</span>';}
function marker(i,x,y,fill,stroke){const r=4.5;
  if(i===0)return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  if(i===1)return '<rect x="'+(x-r)+'" y="'+(y-r)+'" width="'+(2*r)+'" height="'+(2*r)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  if(i===2)return '<path d="M'+x+' '+(y-r-1)+' L'+(x+r+1)+' '+y+' L'+x+' '+(y+r+1)+' L'+(x-r-1)+' '+y+' Z" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  return '<path d="M'+x+' '+(y-r-1)+' L'+(x+r+1)+' '+(y+r)+' L'+(x-r-1)+' '+(y+r)+' Z" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';}
function drawLog(){
  renderLegend();const R=S.log,n=Math.max(R.length,10),cols=ncol();
  const W=900,H=320,L=50,Rg=20,T=18,B=48;const X=i=>L+(i+0.5)*(W-L-Rg)/n;
  let top=0;R.forEach(r=>{vals(r).forEach(v=>{if(v>top)top=v;});const c=rowCrit(r);if(c!=null&&c>top)top=c;});
  const stepY=top<=5?1:top<=10?2:top<=25?5:top<=50?10:top<=100?20:Math.pow(10,Math.floor(Math.log10(top)));
  const ymax=Math.max(stepY,Math.ceil((top||5)/stepY)*stepY);const Y=v=>T+(H-T-B)*(1-v/ymax);
  let s='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#fff"/>';
  for(let v=0;v<=ymax;v+=stepY)s+='<line x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-Rg)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+v+'</text>';
  s+='<line x1="'+L+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  let prev=null;R.forEach((r,i)=>{if(prev!==null&&r.ph!==prev){const x=X(i)-(W-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+T+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#182e43" stroke-dasharray="4 4"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+12)+'" font-size="11" fill="#182e43" font-family="system-ui,sans-serif">'+(r.ph==='B'?'baseline':'phase '+esc(r.ph))+'</text>';}prev=r.ph;});
  let gp='';R.forEach((r,i)=>{const c=rowCrit(r);if(c!=null){const x0=X(i)-(W-L-Rg)/n/2,x1=X(i)+(W-L-Rg)/n/2;gp+='M'+x0.toFixed(1)+' '+Y(c).toFixed(1)+' L'+x1.toFixed(1)+' '+Y(c).toFixed(1)+' ';}});
  if(gp)s+='<path d="'+gp+'" stroke="#9b4e15" stroke-width="2" fill="none"/>';
  for(let k=0;k<cols;k++){let d='';R.forEach((r,i)=>{const v=num(r.v[k]);if(v==null||(i>0&&R[i-1].ph!==r.ph)){d+='|';}if(v==null)return;d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});
    d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="'+TEAMCOL[k]+'" stroke-width="2"/>';});}
  R.forEach((r,i)=>{for(let k=0;k<cols;k++){const v=num(r.v[k]);if(v==null)continue;s+=marker(k,+X(i).toFixed(1),+Y(v).toFixed(1),r.ph==='B'?'#fff':TEAMCOL[k],TEAMCOL[k]);}
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+14)+'" font-size="10" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(String(r.date||i+1).slice(0,6))+'</text>';});
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(H-6)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(unitWord())+' by day (hollow in baseline) · criterion (brown) · dashed lines mark phase changes</text>';
  $('#logPlot').innerHTML=s;
}

/* ---------------- fidelity ---------------- */
function fidStats(){const y=S.fid.filter(f=>f.in==='Yes').length,no=S.fid.filter(f=>f.in==='No').length;const n=y+no;
  return{y,no,n,pct:n?y/n*100:null,missed:S.fid.map((f,i)=>f.in==='No'?String(i+1):'').filter(Boolean)};}
function renderFidelity(){const f=fidStats();
  $('#fidMetrics').innerHTML=`<div class="metric"><b>Steps seen</b><div class="val">${f.n?f.y+' of '+f.n:'—'}</div><div class="sub">N/A excluded</div></div><div class="metric"><b>Fidelity</b><div class="val">${pct(f.pct)}</div><div class="sub">${f.missed.length?'missed: step'+(f.missed.length===1?' ':'s ')+f.missed.join(', '):'nothing missed'}</div></div>`;
  $('#fidVerdict').innerHTML=f.n===0?'':f.pct>=90?'<div class="verdict v-ok"><b>'+pct(f.pct)+'.</b> The game ran as written; the record for this period counts.</div>':f.pct>=80?'<div class="verdict v-mid"><b>'+pct(f.pct)+'.</b> Close; show the teacher the missed step'+(f.missed.length===1?'':'s')+' and watch again within a week (working convention).</div>':'<div class="verdict v-no"><b>'+pct(f.pct)+'.</b> Below 80: the record from this period is not a test of the system. Model the missed steps and re-score before changing the criterion (working convention).</div>';
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();setType(S.type);renderE();renderM();renderTm();renderFade();renderL();renderFid();renderFl();renderExp();renderMenu();renderBase();renderRule();renderPoster();renderRecord();renderFidelity();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#posterPrintBtn').addEventListener('click',()=>{if(!S.exp.some(e=>e.text.trim())&&!S.type){alert('Enter the expectations or choose an arrangement first; there is no poster yet.');return;}
  document.body.classList.add('gc-poster-only');const off=()=>{document.body.classList.remove('gc-poster-only');window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.cls||'class').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'GC-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`GC-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='GC-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  o.type=Object.keys(TYPES).includes(s.type)?s.type:'';
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n||50).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='v'?(Array.isArray(x&&x.v)?x.v.slice(0,4).map(str):[]).concat(['','','','']).slice(0,4):str(x&&x[f]);});return r;}):null;
  o.exp=arr('exp',['text','looks','nex'],5)||[];o.menu=arr('menu',['item','kind','amt','how'],12)||[];o.teams=arr('teams',['name','members'],4)||[];
  const fade=arr('fade',['crit','date'],FADE.length);if(fade&&fade.length===FADE.length)o.fade=fade;
  o.log=arr('log',['date','ph','crit','v','rw','note'],400)||[];o.log.forEach(r=>{if(!['B','1','2','3','4'].includes(r.ph))r.ph='1';});
  const fid=arr('fid',['in','note'],FID.length);if(fid&&fid.length===FID.length)o.fid=fid;
  o.fl=arr('fl',['date','who','pct','missed'],100)||[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='GC-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved GC-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form GC-1. Nothing was changed.':'That file could not be read as a saved GC-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved GC-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';const n=ncol();
  const cum=tootMode()?tootCum():null,wm=winMode();
  const out=[['Day','Date','Phase','Criterion'].concat(Array.from({length:n},(_,i)=>colName(i))).concat(cum?['Total']:[]).concat(['Met']).concat(wm?['Won']:[]).concat(['Reward','Note'])];
  S.log.forEach((r,i)=>{const m=rowMet(r);out.push([i+1,r.date,r.ph,r.ph==='B'?'':r.crit].concat(r.v.slice(0,n)).concat(cum?[cum[i]?cum[i].cum:'']:[]).concat([m===true?'yes':m===false?'no':'']).concat(wm?[winners(r).map(colName).join(' and ')]:[]).concat([r.rw,r.note]));});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='GC-1_record.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated class?\nEvery sheet is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const fmt=d=>(d.getMonth()+1)+'/'+d.getDate();const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const D=n=>fmt(step(n,-1)),Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  S=blank();S.type='gbg';
  S.meta={cls:'SIMULATED – Room 12',teacher:'Ms. K.',grade:'2',nstud:'22',site:'Elementary school',when:'Math block, 9:15 to 9:45',runs:'The teacher, with a paraeducator keeping the score',bcba:'Joshua Newsome, M.A., BCBA',date:Y(20),start:Y(10),review:Y(0),
    tier:'Class-wide support around one or more students with a BIP',
    problem:'Talking out and out-of-seat behavior through the math block, from most of the class; the teacher stops the lesson 10 to 15 times in half an hour. Two students have individual plans; the rest copy them.',
    plans:'D.R. (TD-1, escape; break card) and M.A. (TD-1, attention; DRA for hand-raising). Both play on their team under the team rule; D.R. keeps the break card and a break is not a foul.',
    goal_txt:'The class works through the math block with the teacher stopping fewer than three times, and raised hands instead of calling out.',
    measure:'Fouls per team per game period',b_who:'J. Newsome and the paraeducator (interobserver agreement 92% on day 2)',b_dates:D(14)+' to '+D(11),b_def:'Talking without a hand up (any audible word to the class or the teacher); out of seat without permission (bottom off the chair for more than 3 seconds); touching others or their things. Counted per team in the 30-minute block.',b_note:'The para tallied by team on a clipboard so the baseline matches the game’s count.',
    dir:'low',crit:'5',unit:'fouls per team',mins:'30',reward:'Five minutes of free choice at the end of the day (the class voted)',rw_when:'At the end of the same day',announce:'The para reads the tally at 9:45; the teacher names the winners; the class claps; nothing is said about a team over the goal.',never:'No marks are removed as a reward or added as a punishment for anything outside the three rules; a losing team is not scolded; the game is not stopped early.',
    g_fouls:'Talking without a hand up\nOut of seat without permission\nTouching others or their things',g_win:'Every team with no more than the criterion number of fouls wins (all teams can win)',g_time:'Every day during the math block, 9:15 to 9:45; a second game in the afternoon from phase 2',g_prize:'A victory tag for the day and five minutes of free choice at 2:40; Friday, the week’s winners pick the class game',g_rec:'the paraeducator, with a tally mark on the board under the team name, in a neutral voice, without stopping the lesson',g_fade:'Phase 1 daily; phase 2 three days a week with the prize at the end of the day; phase 3 unannounced games with the prize on Friday',
    cc_up:'Met by every team on 3 of the last 4 game days (working convention)',cc_step:'1',cc_end:'2',cc_down:'Met on fewer than 2 of the last 4 game days: step back one, score fidelity, re-vote the menu',
    po_title:'Room 12 Expectations',po_days:'5',
    decision:'Criterion stepped from 5 to 4 on '+D(6)+' and to 3 on '+D(2)+', each after 3 of 4 game days met. Phase 2 (three games a week, prize at the end of the day) began '+D(2)+'.',
    notreach:'D.R. cost the Cardinals 3 of their 5 fouls on '+D(9)+'; the break card was re-taught and the fouls fell. No team of one needed so far.',
    sv:'The class asks whether the game is on; both teams clap for each other. Two students said the Cardinals “always lose” in week 1; not said since the criterion moved.',
    f_who:'J. Newsome',f_date:D(1),f_per:'Math block',f_min:'30'};
  S.chk={po_exp:false,po_score:false,po_rules:false};
  S.exp=[{text:'Hands up to talk',looks:'hand raised, voice off until called on',nex:'talking without a hand up'},{text:'Stay in your seat',looks:'bottom on the chair, chair on the floor; a break card is permission',nex:'out of seat without permission'},{text:'Hands and feet to yourself',looks:'hands on your own desk and your own work',nex:'touching others or their things'},{text:'Follow directions the first time',looks:'started within 10 seconds of the direction',nex:''}];
  S.menu=[{item:'Five minutes of free choice at the end of the day',kind:'Activity',amt:'5 minutes',how:'class vote, first choice'},{item:'Music during independent work',kind:'Privilege',amt:'one block',how:'class vote'},{item:'Teacher reads an extra chapter',kind:'Social',amt:'10 minutes',how:'class vote'},{item:'Friday class game (the winners choose)',kind:'Activity',amt:'15 minutes',how:'teacher’s offer for the week'}];
  S.teams=[{name:'Blue Jays',members:'rows 1 and 2 (11 students)'},{name:'Cardinals',members:'rows 3 and 4 (11 students)'}];
  S.fade=[{crit:'5',date:D(10)},{crit:'3',date:D(2)},{crit:'2',date:''},{crit:'2',date:''}];
  const days=[['B','',9,10],['B','',11,9],['B','',8,12],['B','',12,11],
    ['1','5',4,6],['1','5',3,5],['1','5',4,4],['1','5',2,3],
    ['1','4',3,4],['1','4',5,2],['1','4',2,3],['1','4',3,3],
    ['2','3',2,3],['2','3',1,2],['2','3',3,1]];
  S.log=days.map((d,i)=>{const r={date:D(days.length-1-i),ph:d[0],crit:d[1],v:[String(d[2]),String(d[3]),'',''],rw:'',note:''};
    if(d[0]!=='B'){const met=d[2]<=+d[1]&&d[3]<=+d[1];r.rw=met?'Delivered':'Not earned';}
    if(i===4)r.note='first game; rules reviewed twice';if(i===5)r.note='Cardinals: 3 fouls from D.R.; break card re-taught after';if(i===8)r.note='criterion to 4';if(i===9)r.note='fire drill in the block';if(i===12)r.note='criterion to 3; phase 2';return r;});
  S.fid=FID.map((f,i)=>({in:i===4?'No':'Yes',note:i===4?'Fouls recorded neutrally; no praise given to the team under the goal mid-game':i===8?'Free choice at 2:40 for both teams':''}));
  S.fl=[{date:D(9),who:'J. Newsome',pct:'80',missed:'3, 5'},{date:D(4),who:'J. Newsome',pct:'90',missed:'5'}];
  renderAll();setView('design');
  nbhUI.toast('Simulation loaded: '+'a simulated second-grade Good Behavior Game with two teams, four baseline days and eleven game days.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.78 the case: in. The form kept the shared fill, and "How a disruption or an on-task check is defined" takes the
   definitions of the target behaviors Form TB-1 defines (each as its name and definition) when it is empty. Nothing
   typed is replaced. */
(function(){const was=window.__nbhFactsIn;
window.__nbhFactsIn=function(f){const r=was?was.apply(this,arguments):null;let n=(r&&r.filled)||0,k=0;f=f||{};
  if(!was&&window.nbhCase)n+=(window.nbhCase.generic(f,false).filled||0);
  const v=(f.behaviors||[]).filter(b=>b&&!b.isRep&&String(b.label||'').trim()&&String(b.def||'').trim()).slice(0,4).map(b=>String(b.label).trim()+': '+String(b.def).trim().replace(/[.;\s]+$/,'')).join('; ');
  const el=document.querySelector('[data-m="b_def"]');
  if(el&&v&&!String(el.value||'').trim()&&!String(S.meta.b_def||'').trim()){el.value=v;S.meta.b_def=v;el.dispatchEvent(new Event('input',{bubbles:true}));k++;}
  if(k)try{renderAll();}catch(e){}
  return {filled:n+k,note:k?'the definitions from Form TB-1':((r&&r.note)||'')};};
})();
