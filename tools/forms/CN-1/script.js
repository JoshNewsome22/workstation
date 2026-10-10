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

const TYPES=['Observation','Consultation','Training','Direct session','Parent meeting','IEP or team meeting','Phone or video call','Record review'];
const TCAT=[['t_obs','Observation'],['t_cons','Consultation'],['t_train','Training'],['t_direct','Direct service'],['t_meet','Meeting'],['t_doc','Documentation'],['t_travel','Travel']];
const NFIELDS=['date','start','end','type','setting','present','plan','purpose','data_forms','data_rate','data_goal','data_unit','data_dir','observed','integ','integ_date','integ_note','problems','recs','changes','authority','training','materials','t_obs','t_cons','t_train','t_direct','t_meet','t_doc','t_travel','sig','sig_date','written'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},notes:[]};}
let S=blank(),cur=0;
function newNote(){const n={};NFIELDS.forEach(f=>{n[f]='';});n.plan=S.meta.plan||'';n.sig=S.meta.bcba||'';n.next=[{what:'',who:'',when:'',done:false}];return n;}
function ensure(){if(!S.meta||typeof S.meta!=='object')S.meta={};if(!Array.isArray(S.notes))S.notes=[];if(!S.notes.length)S.notes.push(newNote());
  S.notes.forEach(n=>{if(!Array.isArray(n.next))n.next=[];if(!n.next.length)n.next.push({what:'',who:'',when:'',done:false});['start','end'].forEach(f=>{const h=toHM24(n[f]);if(h)n[f]=h;});});
  if(cur>=S.notes.length)cur=S.notes.length-1;if(cur<0)cur=0;}
function note(){ensure();return S.notes[cur];}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- time and date ---------------- */
function toMin(s){const m=/^\s*(\d{1,2})(?::(\d{2}))?\s*([aApP])?/.exec(String(s||''));if(!m)return null;let h=+m[1],mi=m[2]?+m[2]:0;if(h>24||mi>59)return null;const ap=(m[3]||'').toLowerCase();if(ap==='p'&&h<12)h+=12;if(ap==='a'&&h===12)h=0;return h*60+mi;}
function duration(n){const a=toMin(n.start),b=toMin(n.end);if(a==null||b==null)return null;let d=b-a;if(d<=0&&!/^\s*\d{2}:\d{2}\s*$/.test(String(n.end||''))&&!/[aApP]/.test(n.end||''))d+=720;return d>0&&d<=1440?d:null;}
function parseDate(s){const m=/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/.exec(String(s||'').trim());if(!m)return null;let y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000;const d=new Date(y,+m[1]-1,+m[2]);return isNaN(d)?null:d;}
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function monthKey(s){const d=parseDate(s);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):'';}
function monthLabel(k){if(!k)return 'Undated';const [y,m]=k.split('-');return MON[+m-1]+' '+y;}
const hrs=m=>m==null?'—':(m/60).toFixed(2);
const fmtDur=m=>m==null?'—':(m>=60?Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m+' min').trim();
function catSum(n){let s=0,any=false;TCAT.forEach(([k])=>{const v=num(n[k]);if(v!=null){s+=v;any=true;}});return any?s:null;}
function rateCheck(n){const r=num(n.data_rate),g=num(n.data_goal);if(r==null||g==null)return null;const up=n.data_dir==='up';const met=up?r>=g:r<=g;const close=!met&&g!==0&&Math.abs(r-g)/Math.abs(g)<=0.25;return{r,g,met,close,up};}
function integCheck(n){const v=num(n.integ);if(v==null)return null;return{v,lvl:v>=90?'ok':v>=80?'mid':'no'};}
function nxStatus(st){if(st.done)return 'done';const d=parseDate(st.when);if(!d)return 'open';const t=new Date();t.setHours(0,0,0,0);return d<t?'overdue':'open';}

/* ---------------- the note editor ---------------- */
function renderNoteSel(){const s=$('#noteSel');s.innerHTML=S.notes.map((n,i)=>`<option value="${i}"${i===cur?' selected':''}>${i+1}. ${esc(n.date||'(no date)')}${n.type?' · '+esc(n.type):''}${n.setting?' · '+esc(n.setting.slice(0,28)):''}</option>`).join('');}
function bindNote(){const n=note();$$('[data-n]').forEach(el=>{el.value=n[el.dataset.n]||'';});}
function renderNx(){const n=note();$('#nxTbl tbody').innerHTML=n.next.map((st,i)=>`<tr><td class="num">${i+1}</td><td><input data-x="what" data-i="${i}" value="${esc(st.what)}" placeholder="e.g., Ms. R. runs the break-card step at every demand; para collects TI-1 on Thursday"></td><td><input data-x="who" data-i="${i}" value="${esc(st.who)}"></td><td><input data-x="when" data-i="${i}" value="${esc(st.when)}" placeholder="m/d/yy"></td><td class="num"><input type="checkbox" data-x="done" data-i="${i}"${st.done?' checked':''} aria-label="Step ${i+1} done"></td>${delCell('nx',i,'step')}</tr>`).join('');}
function renderComputed(){
  const n=note(),d=duration(n);$('#durOut').value=d==null?'':fmtDur(d)+' ('+d+' min)';
  const rc=rateCheck(n),R=$('#rateOut');R.innerHTML=rc?'<div class="verdict '+(rc.met?'v-ok':rc.close?'v-mid':'v-no')+'" style="margin:6px 0 0">'+(rc.met?'Meets the goal':rc.close?'Close to the goal (within 25%)':'Not at the goal')+': '+rc.r+' against '+rc.g+(n.data_unit?' '+esc(n.data_unit):'')+(rc.up?' (higher is better)':' (lower is better)')+'.</div>':'';
  const ic=integCheck(n),I=$('#integOut');I.innerHTML=ic?'<div class="verdict v-'+ic.lvl+'" style="margin:6px 0 0">Integrity '+pct(ic.v)+': '+(ic.lvl==='ok'?'the plan is being run as written (90% and above, working convention).':ic.lvl==='mid'?'a retraining step is due on the missed steps (80% to 89%, working convention).':'the plan is not being run as written; recommendations should address implementation before the plan (below 80%, working convention).')+'</div>':'';
  const cs=catSum(n),T=$('#timeOut');if(cs==null&&d==null)T.innerHTML='';else if(cs==null)T.innerHTML='<p class="hint">Duration '+fmtDur(d)+'; no time by category entered yet.</p>';else if(d==null)T.innerHTML='<p class="hint">Categories add to '+cs+' min; enter start and end times to compare.</p>';else{const diff=cs-d;T.innerHTML='<div class="verdict '+(Math.abs(diff)<=5?'v-ok':'v-mid')+'">Categories add to '+cs+' min against a duration of '+d+' min'+(Math.abs(diff)<=5?'.':' ('+(diff>0?cs-d+' min more than the visit; travel or documentation outside the start-to-end span should be noted':d-cs+' min of the visit are not in any category')+').')+'</div>';}
  const out=[];if(!n.date)out.push('The note has no date.');if(d==null)out.push('Start and end times are needed for the duration and the hours log.');if(!n.type)out.push('Choose the type of contact.');if(!n.present)out.push('Say who was present.');
  if(n.changes&&!/^\s*(none|no change)/i.test(n.changes)&&(!n.authority||/^No change/.test(n.authority)))out.push('A change to the plan is recorded without its authority.');
  if(n.recs&&!n.next.some(s=>s.what))out.push('Recommendations were given but no next step has an owner and a date.');
  if(!n.sig)out.push('The note is not signed.');
  $('#noteVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+esc(x)+'</div>').join('')+'</div>':(n.date?'<div class="verdict v-ok"><b>Complete.</b> Dated, timed, typed, attended, signed; changes carry their authority and recommendations their next step.</div>':'');
  renderNoteOut();
}
function renderNoteOut(){
  const n=note(),m=S.meta,d=duration(n),rc=rateCheck(n),ic=integCheck(n),cs=catSum(n);
  const P=(label,v,pre)=>'<h4>'+label+'</h4>'+(v&&String(v).trim()?'<p>'+esc(v)+'</p>':'<p class="cn-empty">none recorded</p>');
  const nx=n.next.filter(s=>s.what);
  $('#noteOut').innerHTML='<div class="cn-title">Consultation and Session Note'+(n.type?': '+esc(n.type):'')+'</div>'+
    '<div class="cn-head"><div><b>Student</b>'+esc(m.client||'')+(m.sid?' ('+esc(m.sid)+')':'')+'</div><div><b>Date</b>'+esc(n.date||'')+'</div><div><b>Time</b>'+esc(fmtHM(n.start||''))+(n.end?' to '+esc(fmtHM(n.end)):'')+(d!=null?' ('+fmtDur(d)+')':'')+'</div><div><b>Setting</b>'+esc(n.setting||'')+'</div><div><b>School</b>'+esc(m.school||'')+'</div><div><b>BCBA</b>'+esc(m.bcba||'')+'</div><div style="grid-column:1/-1"><b>Present</b>'+esc(n.present||'')+'</div><div style="grid-column:1/-1"><b>Plan in force</b>'+esc(n.plan||m.plan||'')+(n.purpose?' &nbsp; <b>Purpose</b>'+esc(n.purpose):'')+'</div></div>'+
    '<h4>Data reviewed</h4><p>'+(n.data_forms?esc(n.data_forms):'<span class="cn-empty">none recorded</span>')+(rc?'<br>Rate '+rc.r+' against goal '+rc.g+(n.data_unit?' '+esc(n.data_unit):'')+': '+(rc.met?'meets the goal':rc.close?'close to the goal':'not at the goal')+(rc.up?' (higher is better).':' (lower is better).'):'')+'</p>'+
    P('What was seen',n.observed)+
    '<h4>Integrity observed (Form TI-1)</h4><p>'+(ic?pct(ic.v)+(n.integ_date?' on '+esc(n.integ_date):'')+(n.integ_note?'; '+esc(n.integ_note):''):'<span class="cn-empty">no integrity observation at this contact</span>')+'</p>'+
    P('Problems identified',n.problems)+P('Recommendations given',n.recs)+
    '<h4>Changes made to the plan</h4><p>'+(n.changes?esc(n.changes):'<span class="cn-empty">none</span>')+(n.authority?'<br><b>Authority:</b> '+esc(n.authority):'')+'</p>'+
    P('Training delivered',n.training)+P('Materials left',n.materials)+
    '<h4>Next steps</h4>'+(nx.length?'<table class="cn-t"><thead><tr><th style="width:55%">What</th><th>Who</th><th style="width:14%">By when</th><th style="width:10%">Status</th></tr></thead><tbody>'+nx.map(s=>'<tr><td>'+esc(s.what)+'</td><td>'+esc(s.who)+'</td><td>'+esc(s.when)+'</td><td>'+nxStatus(s)+'</td></tr>').join('')+'</tbody></table>':'<p class="cn-empty">none recorded</p>')+
    '<h4>Time by category</h4><p>'+(cs!=null?TCAT.filter(([k])=>num(n[k])!=null).map(([k,l])=>l+' '+num(n[k])+' min').join(' · ')+' · total '+cs+' min'+(d!=null?' (visit '+d+' min)':''):'<span class="cn-empty">not recorded</span>')+'</p>'+
    '<div class="cn-sig"><span>Signed: <span class="bl">'+esc(n.sig||'')+'</span></span><span>Date: <span class="bl" style="min-width:120px">'+esc(n.sig_date||'')+'</span></span></div>'+
    '<div class="cn-foot"><span>'+(n.written&&n.written!==n.date?'Note written on '+esc(n.written)+'. ':'')+'Confidential student record; retain with the behavior file.</span><span>Form CN-1 · Note '+(cur+1)+' of '+S.notes.length+'</span></div>';
}
function renderNote(){renderNoteSel();bindNote();renderNx();renderComputed();}

/* ---------------- the log ---------------- */
function noteRows(){return S.notes.map((n,i)=>({n,i,d:parseDate(n.date),dur:duration(n),mk:monthKey(n.date)})).sort((a,b)=>(a.d&&b.d)?b.d-a.d:a.d?-1:b.d?1:b.i-a.i);}
function renderLogFilters(){const t=$('#logType'),mo=$('#logMonth');const tv=t.value,mv=mo.value;
  t.innerHTML='<option value="">All types</option>'+TYPES.map(x=>'<option'+(x===tv?' selected':'')+'>'+x+'</option>').join('');
  const months=[...new Set(S.notes.map(n=>monthKey(n.date)))].sort().reverse();
  mo.innerHTML='<option value="">All months</option>'+months.map(k=>'<option value="'+k+'"'+(k===mv?' selected':'')+'>'+monthLabel(k)+'</option>').join('');}
function renderLog(){
  renderLogFilters();const q=($('#logSearch').value||'').toLowerCase(),ty=$('#logType').value,mo=$('#logMonth').value;
  const R=noteRows().filter(r=>(!ty||r.n.type===ty)&&(!mo||r.mk===mo)&&(!q||NFIELDS.some(f=>String(r.n[f]||'').toLowerCase().includes(q))||r.n.next.some(s=>(s.what+' '+s.who).toLowerCase().includes(q))));
  $('#logCount').textContent=R.length+' of '+S.notes.length+' note'+(S.notes.length===1?'':'s');
  $('#logTbl tbody').innerHTML=R.map(r=>{const n=r.n,rc=rateCheck(n),ic=integCheck(n),open=n.next.filter(s=>s.what&&!s.done),od=open.filter(s=>nxStatus(s)==='overdue').length;
    return '<tr class="open'+(r.i===cur?' cur':'')+'" data-open="'+r.i+'" tabindex="0" role="button" aria-label="Open note '+(r.i+1)+'"><td class="num">'+(r.i+1)+'</td><td>'+esc(n.date)+'</td><td>'+esc(n.type)+'</td><td class="num">'+(r.dur==null?'—':r.dur)+'</td><td>'+esc(n.setting)+'</td><td>'+esc(n.present)+'</td><td class="num">'+(rc?rc.r+' / '+rc.g:'—')+'</td><td class="num">'+(ic?pct(ic.v):'—')+'</td><td>'+esc((n.problems||'').split('\n')[0].slice(0,90))+(n.changes&&!/^\s*none/i.test(n.changes)?'<br><b>Change:</b> '+esc(n.changes.slice(0,80)):'')+'</td><td class="num">'+(open.length?open.length+' open'+(od?' ('+od+' overdue)':''):n.next.some(s=>s.what)?'done':'—')+'</td></tr>';}).join('')||'<tr><td colspan="10" class="hint">No notes match.</td></tr>';
  /* metrics */
  const all=noteRows(),tot=all.reduce((s,r)=>s+(r.dur||0),0);const now=new Date(),thisK=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const thisM=all.filter(r=>r.mk===thisK).reduce((s,r)=>s+(r.dur||0),0);const changes=all.filter(r=>r.n.changes&&!/^\s*none/i.test(r.n.changes)).length;
  const openAll=[].concat(...S.notes.map(n=>n.next.filter(s=>s.what&&!s.done)));const od=openAll.filter(nxStatus).filter(s=>nxStatus(s)==='overdue').length;
  const unsigned=S.notes.filter(n=>n.date&&!n.sig).length,untimed=S.notes.filter(n=>n.date&&duration(n)==null).length;
  $('#logMetrics').innerHTML=`<div class="metric"><b>Notes</b><div class="val">${S.notes.filter(n=>n.date||n.type).length}</div><div class="sub">${unsigned?unsigned+' unsigned · ':''}${untimed?untimed+' without times':'all timed'}</div></div>
    <div class="metric"><b>Hours, all notes</b><div class="val">${hrs(tot)}</div><div class="sub">from start and end times</div></div>
    <div class="metric"><b>Hours, ${monthLabel(thisK)}</b><div class="val">${hrs(thisM)}</div><div class="sub">${S.meta.service?esc(S.meta.service.slice(0,60)):'this month'}</div></div>
    <div class="metric"><b>Plan changes</b><div class="val">${changes}</div><div class="sub">notes recording a change</div></div>
    <div class="metric"><b>Open next steps</b><div class="val">${openAll.length}</div><div class="sub">${od?od+' overdue':'none overdue'}</div></div>`;
  /* hours by month and type */
  const months=[...new Set(all.map(r=>r.mk))].sort().reverse();const types=TYPES.filter(t=>S.notes.some(n=>n.type===t));if(S.notes.some(n=>!n.type))types.push('');
  let h='<thead><tr><th>Month</th>'+types.map(t=>'<th>'+(t||'(no type)')+'</th>').join('')+'<th>Total</th><th>Notes</th></tr></thead><tbody>';
  months.forEach(k=>{const rows=all.filter(r=>r.mk===k);h+='<tr><td class="lk">'+monthLabel(k)+'</td>'+types.map(t=>{const m=rows.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0);return '<td class="num">'+(m?hrs(m):'—')+'</td>';}).join('')+'<td class="num"><b>'+hrs(rows.reduce((s,r)=>s+(r.dur||0),0))+'</b></td><td class="num">'+rows.length+'</td></tr>';});
  h+='<tr class="tot"><td>All months</td>'+types.map(t=>'<td class="num">'+hrs(all.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0))+'</td>').join('')+'<td class="num">'+hrs(tot)+'</td><td class="num">'+all.length+'</td></tr>';
  const cats=TCAT.map(([k,l])=>[l,S.notes.reduce((s,n)=>s+(num(n[k])||0),0)]).filter(x=>x[1]);
  if(cats.length)h+='<tr><td class="lk">By category</td><td colspan="'+(types.length+2)+'">'+cats.map(c=>c[0]+' '+hrs(c[1])+' h').join(' · ')+' · '+hrs(cats.reduce((s,c)=>s+c[1],0))+' h in all</td></tr>';
  $('#hoursTbl').innerHTML=h+'</tbody>';
  /* open steps */
  const ops=[];S.notes.forEach((n,i)=>n.next.forEach(s=>{if(s.what&&!s.done)ops.push({i,n,s,st:nxStatus(s),d:parseDate(s.when)});}));ops.sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:0);
  $('#openTbl tbody').innerHTML=ops.map(o=>'<tr class="open" data-open="'+o.i+'" tabindex="0" role="button" aria-label="Open note '+(o.i+1)+'"><td>'+esc(o.n.date||('note '+(o.i+1)))+'</td><td>'+esc(o.s.what)+'</td><td>'+esc(o.s.who)+'</td><td>'+esc(o.s.when)+'</td><td class="num">'+(o.st==='overdue'?'<b style="color:#8E2A2A">overdue</b>':'open')+'</td></tr>').join('')||'<tr><td colspan="5" class="hint">No open steps.</td></tr>';
}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.n!==undefined){note()[el.dataset.n]=el.value;renderComputed();if(el.dataset.n==='date'||el.dataset.n==='type'||el.dataset.n==='setting')renderNoteSelSoon();return;}
  if(el.dataset.x!==undefined&&el.type!=='checkbox'){note().next[+el.dataset.i][el.dataset.x]=el.value;renderNoteOutSoon();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderNoteOutSoon();}
  if(el.id==='logSearch')renderLog();
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.n!==undefined){note()[el.dataset.n]=el.value;renderComputed();renderNoteSel();return;}
  if(el.dataset.x!==undefined){note().next[+el.dataset.i][el.dataset.x]=el.type==='checkbox'?el.checked:el.value;renderComputed();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderNoteOut();}
  if(el.id==='logType'||el.id==='logMonth')renderLog();
});
document.addEventListener('click',e=>{const tr=e.target.closest('tr[data-open]');if(!tr)return;cur=+tr.dataset.open;renderNote();setView('note');});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const tr=e.target.closest&&e.target.closest('tr[data-open]');if(!tr||e.target.tagName==='INPUT')return;cur=+tr.dataset.open;renderNote();setView('note');});
let selT=0,outT=0;function renderNoteSelSoon(){clearTimeout(selT);selT=setTimeout(renderNoteSel,400);}function renderNoteOutSoon(){clearTimeout(outT);outT=setTimeout(renderComputed,300);}
$('#noteSel').addEventListener('change',e=>{cur=+e.target.value;renderNote();});
$('#newNote').addEventListener('click',()=>{if(S.notes.length>=400)return;S.notes.push(newNote());cur=S.notes.length-1;renderNote();$('[data-n="date"]').focus();});
$('#dupNote').addEventListener('click',()=>{if(S.notes.length>=400)return;const o=note(),n=newNote();['type','setting','present','plan','purpose','sig'].forEach(f=>{n[f]=o[f];});S.notes.push(n);cur=S.notes.length-1;renderNote();$('[data-n="date"]').focus();});
$('#delNote').addEventListener('click',async ()=>{const n=note(),k=cur;if((n.date||n.observed||n.problems)&&!(await nbhUI.confirm('Delete note '+(k+1)+' ('+(n.date||'no date')+')?\nThe note and its next steps are deleted; this cannot be undone.',{ok:'Delete',danger:true})))return;S.notes.splice(k,1);cur=Math.max(0,k-1);renderNote();});
$('#addNx').addEventListener('click',()=>{if(note().next.length>=12)return;note().next.push({what:'',who:'',when:'',done:false});renderNx();});
$('#delNx').addEventListener('click',async ()=>{const nx=note().next;if(nx.length<=1)return;if(nx[nx.length-1].what&&!(await nbhUI.confirm('Remove the last step?\nThe next step, its owner and its date are deleted.',{ok:'Remove',danger:true})))return;nx.pop();renderNx();renderComputed();});
async function rowDel(r,i){
  if(r==='nx'){const nx=note().next,st=nx[i];if(!st)return;if((st.what||st.who||st.when)&&!(await nbhUI.confirm('Delete this row?\nThe next step it holds is deleted.',{ok:'Delete',danger:true})))return;nx.splice(i,1);if(!nx.length)nx.push({what:'',who:'',when:'',done:false});renderNx();renderComputed();}
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});}
function renderAll(){ensure();bindMeta();renderNote();renderLog();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='log')renderLog();}));

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#notePrintBtn').addEventListener('click',()=>{const n=note();if(!n.date&&!n.type){alert('This note is empty; there is nothing to print yet.');return;}
  document.body.classList.add('cn-note-only');
  const st=document.createElement('style');st.id='cnNotePage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('cn-note-only');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'CN-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`CN-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='CN-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v);
  if(s.meta&&typeof s.meta==='object'&&!Array.isArray(s.meta))Object.keys(s.meta).forEach(k=>{o.meta[k]=str(s.meta[k]);});
  o.notes=Array.isArray(s.notes)?s.notes.slice(0,400).map(x=>{const n={};NFIELDS.forEach(f=>{n[f]=str(x&&x[f]);});if(!TYPES.includes(n.type))n.type='';
    n.next=Array.isArray(x&&x.next)?x.next.slice(0,12).map(y=>({what:str(y&&y.what),who:str(y&&y.who),when:str(y&&y.when),done:!!(y&&y.done)})):[];return n;}):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='CN-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved CN-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form CN-1. Nothing was changed.':'That file could not be read as a saved CN-1 form. Nothing was changed.');return;}
    const prev=S;S=next;cur=0;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved CN-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const head=['#','Date','Start','End','Minutes','Type','Setting','Present','Plan in force','Purpose','Data reviewed','Rate','Goal','Unit','Direction','Observed','Integrity %','Integrity date','Integrity note','Problems','Recommendations','Changes','Authority','Training','Materials','Next steps','Observation min','Consultation min','Training min','Direct min','Meeting min','Documentation min','Travel min','Signed','Date signed','Written on'];
  const out=[head];noteRows().reverse().forEach(r=>{const n=r.n;out.push([r.i+1,n.date,n.start,n.end,r.dur==null?'':r.dur,n.type,n.setting,n.present,n.plan,n.purpose,n.data_forms,n.data_rate,n.data_goal,n.data_unit,n.data_dir==='up'?'higher is better':'lower is better',n.observed,n.integ,n.integ_date,n.integ_note,n.problems,n.recs,n.changes,n.authority,n.training,n.materials,n.next.filter(s=>s.what).map(s=>s.what+' ('+s.who+(s.when?', by '+s.when:'')+(s.done?', done':'')+')').join('; '),n.t_obs,n.t_cons,n.t_train,n.t_direct,n.t_meet,n.t_doc,n.t_travel,n.sig,n.sig_date,n.written]);});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='CN-1_log.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();cur=0;renderAll();setView('note');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nSix notes over five weeks are filled in as a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const day=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()-1);return d;};
  const Y=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);const fwd=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x;};
  S=blank();cur=0;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',school:'Lincoln Elementary, Riverside USD',bcba:'Joshua Newsome, M.A., BCBA',plan:'BIP v2, dated '+Y(day(45))+' (Form TD-1)',service:'4 hours a month of consultation under the district contract; parent consent on IC-1 dated '+Y(day(60)),goal:'Elopement from the classroom (TB-1); goal under 1 per day for 4 school weeks (GB-1)'};
  const sig='Joshua Newsome, M.A., BCBA';
  const mk=(o)=>{const n=newNote();Object.assign(n,o);n.sig=sig;n.sig_date=n.sig_date||n.date;n.plan=n.plan||S.meta.plan;return n;};
  const d1=day(33),d2=day(26),d3=day(19),d4=day(14),d5=day(7),d6=day(2);
  S.notes=[
    mk({date:Y(d1),start:'9:00 am',end:'10:30 am',type:'Observation',setting:'Room 12 (Ms. R.) and the hallway',present:'Ms. R. (teacher), J. Ortiz (paraeducator), the student',purpose:'First observation under BIP v2; TI-1 taken',
      data_forms:'Daily Behavior Data '+Y(fwd(d1,-7))+' to '+Y(fwd(d1,-1))+'; TI-1 of this date',data_rate:'2.4',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Three elopements in 90 minutes, all within a minute of an independent-work direction. The break card was on the desk but was not offered before the direction on any of the three; on the second, Ms. R. followed to the hallway and talked for about two minutes before the return. The para delivered praise at the planned rate during the carpet activity.',
      integ:'62',integ_date:Y(d1),integ_note:'Steps 2 (offer the card before the direction) and 5 (silent return) missed on every opportunity',
      problems:'The antecedent step is not being run: the card is present but not offered.\nThe hallway conversation is attention after elopement, which is the function the FBA found.',
      recs:'Re-train steps 2 and 5 with the teacher and the para before any change to the plan.\nMove the card prompt into the direction itself (“work time: card or start”).',
      changes:'none',authority:'No change to the plan',training:'Fifteen minutes after the observation: modeled step 2 twice with the para as the student, Ms. R. rehearsed it three times with feedback; silent return practiced once (Form ST-1).',materials:'TI-1 checklist for the para to score on Thursday; a second break card for the hallway',
      t_obs:'60',t_cons:'15',t_train:'15',t_doc:'20',t_travel:'25',
      next:[{what:'Para scores TI-1 on Ms. R. during one independent-work block',who:'J. Ortiz',when:Y(fwd(d1,3)),done:true},{what:'Phone check on the TI-1 score and the week’s count',who:'J. Newsome',when:Y(fwd(d1,7)),done:true}]}),
    mk({date:Y(d2),start:'3:15 pm',end:'3:40 pm',type:'Phone or video call',setting:'By phone',present:'Ms. R. (teacher)',purpose:'Follow-up on the retraining and the week’s data',
      data_forms:'Daily Behavior Data '+Y(fwd(d2,-6))+' to '+Y(fwd(d2,-1))+'; para’s TI-1 of '+Y(fwd(d1,3)),data_rate:'1.6',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Ms. R. reports offering the card before each direction since the retraining; the para’s TI-1 scored 88%, with the silent return missed once. Count down to 8 for the week from 12.',
      integ:'88',integ_date:Y(fwd(d1,3)),integ_note:'Step 5 missed once (para’s score)',problems:'Return from the hallway still draws a sentence or two from Ms. R. on the harder days.',recs:'Keep the plan as written for two more weeks before judging it; the para scores TI-1 again next week.',changes:'none',authority:'No change to the plan',training:'',materials:'',
      t_cons:'25',t_doc:'10',next:[{what:'Para scores TI-1 again',who:'J. Ortiz',when:Y(fwd(d2,5)),done:true}]}),
    mk({date:Y(d3),start:'8:30 am',end:'10:00 am',type:'Observation',setting:'Room 12 and specials (art)',present:'Ms. R. (teacher), J. Ortiz (paraeducator), Mr. K. (art teacher), the student',purpose:'Second observation; generalization to specials',
      data_forms:'Daily Behavior Data '+Y(fwd(d3,-7))+' to '+Y(fwd(d3,-1))+'; TI-1 of this date',data_rate:'1.2',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'One elopement in 90 minutes, from art, where no card was available and Mr. K. had not been briefed. In Room 12 the card was offered before every direction (6 of 6) and the one request for a break was honored within 10 seconds.',
      integ:'94',integ_date:Y(d3),integ_note:'Room 12 only; art not scored',problems:'The plan does not travel to specials: no card, no briefing.',recs:'Add specials to the plan with a card kept by the art teacher and a one-page brief (Form EB-1).',
      changes:'Specials added to the settings covered by the plan; a break card kept at the art-room door; Mr. K. briefed with EB-1.',authority:'Within the adjustments the plan already allows (BCBA)',training:'Ten minutes with Mr. K.: the card, the honor-within-10-seconds rule, the silent return (instruction and one model).',materials:'EB-1 brief for art, music and PE; a laminated card for each',
      t_obs:'60',t_cons:'20',t_train:'10',t_doc:'20',t_travel:'25',next:[{what:'Brief music and PE with EB-1',who:'Ms. R.',when:Y(fwd(d3,4)),done:true},{what:'Parent meeting to review the first month',who:'J. Newsome',when:Y(d4),done:true}]}),
    mk({date:Y(d4),start:'2:30 pm',end:'3:10 pm',type:'Parent meeting',setting:'Conference room; father by video',present:'Ms. Alvarez (mother), Mr. Alvarez (father, by video), Ms. R. (teacher)',purpose:'Monthly review with the family',
      data_forms:'Daily Behavior Data for the month; home tally sheet (HD-1) weeks 1 to 3',data_rate:'1.0',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Family reports the same pattern at homework; the home tally shows 2 to 3 a day in week 1 and 0 to 1 in week 3 after the timer went in. Parents asked whether the card could be used at home.',
      problems:'',recs:'Use the same card at homework with the honor rule; keep the home tally sheet going for four more weeks.',changes:'none at school; a home version of the break-card step added to the family plan (HD-1 setup)',authority:'Parent or guardian consent obtained (Form IC-1)',training:'Fifteen minutes with the parents: the card, the honor rule, the silent return; mother rehearsed twice.',materials:'Two break cards for home; HD-1 sheets for four weeks',
      t_meet:'40',t_doc:'15',t_travel:'25',next:[{what:'Send the home graph by text every Friday',who:'J. Newsome',when:Y(fwd(d4,3)),done:true}]}),
    mk({date:Y(d5),start:'1:00 pm',end:'2:00 pm',type:'IEP or team meeting',setting:'Conference room',present:'IEP team: Ms. Alvarez (mother), Ms. R., Ms. T. (case manager), Dr. P. (school psychologist), J. Newsome',purpose:'Annual IEP; BIP review',
      data_forms:'Monthly summary graph; TI-1 scores to date (62, 88, 94, 91)',data_rate:'0.8',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Team reviewed the month: rate down from 2.4 to 0.8 per day with integrity above 90% for three weeks. Goal met for two weeks, not yet the four the plan requires.',
      problems:'',recs:'Hold the plan as written until the four-week criterion is met, then begin thinning the card prompt (PR-1).',changes:'none',authority:'IEP team decision (meeting of this date)',training:'',materials:'',
      t_meet:'60',t_doc:'20',t_travel:'25',next:[{what:'Periodic plan review on PR-1 when four weeks under goal are reached',who:'J. Newsome',when:Y(fwd(d5,21)),done:false}]}),
    mk({date:Y(d6),start:'10:00 am',end:'10:45 am',type:'Consultation',setting:'Room 12, planning period',present:'Ms. R. (teacher), J. Ortiz (paraeducator)',purpose:'Data check and thinning plan',
      data_forms:'Daily Behavior Data '+Y(fwd(d6,-7))+' to '+Y(fwd(d6,-1))+'; para’s TI-1 of '+Y(fwd(d6,-3)),data_rate:'0.6',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Third week under goal. Para’s TI-1 at 91%; the missed step was the praise rate during independent work.',integ:'91',integ_date:Y(fwd(d6,-3)),integ_note:'Praise rate below the planned 1 per 2 minutes in one block',
      problems:'Praise is thinning on its own before the plan says to.',recs:'Keep praise at the planned rate until the PR-1 review; the thinning step is written there, not improvised.',changes:'none',authority:'No change to the plan',training:'Five-minute reminder with a timer app for the praise interval.',materials:'Interval timer set to 2 minutes on the para’s phone',
      t_cons:'35',t_train:'5',t_doc:'10',t_travel:'25',next:[{what:'Para scores TI-1 during independent work',who:'J. Ortiz',when:Y(fwd(d6,4)),done:false},{what:'Confirm week four under goal and schedule PR-1',who:'J. Newsome',when:Y(fwd(d6,7)),done:false}]})
  ];
  cur=S.notes.length-1;renderAll();setView('log');
  nbhUI.toast('Simulation loaded: '+'a simulated case of six notes over five weeks, with next steps, time by category and the hours log.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. The "primary target and goal" line is composed from the first behavior on
   Form TB-1 and the reduction objective on Form GB-1 that names it. */
function nbhCnGoalLine(behs,red){
  const b=behs[0];const l=b?b.label.toLowerCase():'';
  const r=red.find(x=>x.beh&&l&&(x.beh.toLowerCase().indexOf(l.slice(0,12))>=0||l.indexOf(x.beh.toLowerCase().slice(0,12))>=0))||(!b&&red[0])||null;
  if(!b&&!r)return '';
  return (b?b.label:r.beh)+(r&&r.tgt?'; goal: no '+(r.ml||'more')+' than '+r.tgt+(r.crit?' over '+r.crit+' consecutive measurements':'')+' (Form GB-1)':'');
}
/* v21.75 the note starts from Form DD-1's week summary: the data reviewed, the first reduction target against its aim, what
   the week looked like against the last (each behavior, the incidents, the phase changes, what the team decided) and the
   latest Form TI-1 observation, into the empty fields of the note open; "Start from the week summary" does it again. */
let nbhCnCase=null;
const nbhCnMd=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?(+m[2])+'/'+(+m[3])+'/'+m[1].slice(2):String(iso||'');};
function nbhCnWeek(f){const d=f&&f.data,w=d&&d.week,ti=f&&f.integrity,out={};if(!w&&!ti)return out;
  if(w){const fri=(()=>{const p=w.mon.split('-');const x=new Date(+p[0],+p[1]-1,+p[2]+4,12);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');})();
    out.data_forms='Daily Behavior Data (Form DD-1), week of '+nbhCnMd(w.mon)+' to '+nbhCnMd(fri)+(ti&&ti.obs.length?'; TI-1 of '+nbhCnMd(ti.obs[ti.obs.length-1].date):'');
    const L=['The week of '+nbhCnMd(w.mon)+' ('+w.days+' day'+(w.days===1?'':'s')+' recorded), against the week before:'];
    w.rows.forEach(r=>{if(r.now==='\u2014'&&r.last==='\u2014')return;L.push('- '+r.name+': '+r.now+(r.last&&r.last!=='\u2014'?', the week before '+r.last:'')+(r.change&&r.change!=='\u2014'?' ('+r.change+')':'')+'.');});
    L.push('Incidents logged: '+(w.incidents||'none')+'.');
    (w.phases||[]).forEach(p=>L.push('Phase change '+nbhCnMd(p.date)+': '+(p.type==='full'?'full phase change':'conditional change')+(p.label?', '+p.label:'')+'.'));
    if(w.decided)L.push('The team decided: '+w.decided.replace(/\n+/g,'; ')+'.');
    out.observed=L.join('\n');
    const t=(d.behaviors||[]).find(b=>b.kind==='target'&&b.aim!=null&&b.cur);
    if(t){out.data_rate=String(t.cur.mean);out.data_goal=String(t.aim);out.data_unit=t.measure==='count'?'a day ('+t.name.toLowerCase()+', '+t.curName+')':(t.unit||'');out.data_dir=t.direction==='increase'?'up':'';}}
  if(ti&&ti.obs.length){const o=ti.obs[ti.obs.length-1];out.integ=String(o.pct);out.integ_date=nbhCnMd(o.date);out.integ_note='Form TI-1, '+(o.type?o.type.toLowerCase()+' ':'')+'observation; '+ti.obs.length+' in the record, '+ti.overall+'% overall.';}
  return out;}
function nbhCnPlace(force){const n=note(),v=nbhCnWeek(nbhCnCase);let k=0;
  /* on its own the case fills only a note being written now: undated, or dated in or after the week it summarises */
  const w=nbhCnCase&&nbhCnCase.data&&nbhCnCase.data.week;if(!force&&w&&n.date){const d=parseDate(n.date),p=w.mon.split('-');if(!d||d<new Date(+p[0],+p[1]-1,+p[2]))return 0;}
  Object.keys(v).forEach(f=>{if(!v[f])return;if(!force&&String(n[f]||'').trim())return;if(force&&String(n[f]||'').trim()&&f!=='observed'&&f!=='data_forms')return;
    if(force&&f==='observed'&&String(n[f]||'').trim()&&n[f].indexOf(v[f])<0){n[f]=v[f]+'\n'+n[f];k++;return;}if(n[f]!==v[f]){n[f]=v[f];k++;}});
  return k;}
function nbhCnBtn(){let b=document.getElementById('cnWeek');const has=!!(nbhCnCase&&((nbhCnCase.data&&nbhCnCase.data.week)||nbhCnCase.integrity));
  if(!b){const at=document.getElementById('dupNote');if(!at)return;b=document.createElement('button');b.className='tool';b.id='cnWeek';b.type='button';b.textContent='Start from the week summary';
    b.title='Fills the data reviewed, what was seen and the integrity from Form DD-1\u2019s week summary and Form TI-1; the observation goes above what is written there';at.parentNode.insertBefore(b,at.nextSibling);
    b.addEventListener('click',()=>{const k=nbhCnPlace(true);renderNote();nbhUI.toast(k?'The week summary is in this note.':'This note already holds the week summary.',k?{kind:'ok'}:undefined);});}
  b.style.display=has?'':'none';}
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;nbhCnCase=f||null;nbhCnBtn();
  if(!m.goal){const t=nbhCnGoalLine(f.behaviors||[],(f.goals&&f.goals.red)||[]);if(t){m.goal=t;n++;}}
  n+=nbhCnPlace(false);
  if(n)renderAll();return {filled:n};
};
nbhCnBtn();
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const t=nbhCnGoalLine(sel.behaviors,sel.goals.red);if(t){m.goal=t;n++;}
  if(n)renderAll();return {filled:n};
};

/* v21.35 what is due: the open next steps of every note, by their dates, for the workstation's due line */
window.__nbhDue=function(){const out=[];(S.notes||[]).forEach(n=>(n.next||[]).forEach(x=>{if(x.done||!x.when||!x.what)return;out.push({what:(x.what+(x.who?' ('+x.who+')':'')).slice(0,60).trim(),date:x.when});}));return out;};
