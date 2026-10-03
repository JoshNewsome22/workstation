const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';

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

/* ---------------- constants ---------------- */
const CODES=[{c:'I',label:'Independent (correct, no prompt)',kind:'ind'},{c:'G',label:'Gestural prompt',kind:'pr'},{c:'V',label:'Verbal or model prompt',kind:'pr'},{c:'P',label:'Partial physical prompt',kind:'pr'},{c:'F',label:'Full physical prompt',kind:'pr'},{c:'–',label:'Error or no response',kind:'err'}];
const KINDS={ind:'independent',pr:'prompted',err:'error'};
const PHASES=[['B','Baseline / probe'],['T','Teaching'],['M','Maintenance']];
const PHNAME={B:'baseline',T:'teaching',M:'maintenance'};
const PRTYPES=['Maintenance','Generalization'];
const PRDIMS=['Same as training','People','Setting','Materials','Time of day','Instruction wording','Other'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{},codes:CODES.map(x=>({c:x.c,label:x.label,kind:x.kind})),sess:[],steps:[],tas:[],probes:[]};}
let S=blank();
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  if(!Array.isArray(S.codes))S.codes=[];if(!Array.isArray(S.sess))S.sess=[];if(!Array.isArray(S.steps))S.steps=[];if(!Array.isArray(S.tas))S.tas=[];if(!Array.isArray(S.probes))S.probes=[];
  if(S.codes.length<2)S.codes=CODES.map(x=>({c:x.c,label:x.label,kind:x.kind}));
  while(S.steps.length<3)S.steps.push({text:''});
  S.sess.forEach(s=>{if(!Array.isArray(s.tr))s.tr=[];});S.tas.forEach(s=>{if(!Array.isArray(s.lv))s.lv=[];});
}
const ntr=()=>Math.max(1,Math.min(50,Math.round(num(S.meta.ntr)??10)));
const mc=()=>({pct:num(S.meta.mc_pct)??90,n:Math.max(1,Math.round(num(S.meta.mc_n)??3)),inst:Math.max(1,Math.round(num(S.meta.mc_inst)??2))});
function kindOf(c){if(!c)return '';const k=S.codes.find(x=>x.c===c);return k?k.kind:'pr';}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- statistics ---------------- */
function sessStats(s){const n=ntr();let sc=0,ind=0,cor=0;for(let i=0;i<n;i++){const c=s.tr[i]||'';if(!c)continue;sc++;const k=kindOf(c);if(k==='ind'){ind++;cor++;}else if(k==='pr')cor++;}
  const f=s.tr[0]||'';return{sc,ind,cor,pi:sc?ind/sc*100:null,pc:sc?cor/sc*100:null,first:f,firstInd:kindOf(f)==='ind'};}
function taStats(s){let sc=0,ind=0,cor=0;S.steps.forEach((st,i)=>{const c=s.lv[i]||'';if(!c)return;sc++;const k=kindOf(c);if(k==='ind'){ind++;cor++;}else if(k==='pr')cor++;});
  return{sc,ind,cor,pi:sc?ind/sc*100:null,pc:sc?cor/sc*100:null,first:'',firstInd:false};}
function stepMastered(i){const scored=S.tas.filter(s=>s.lv[i]);if(scored.length<2)return false;const last=scored.slice(-2);return last.every(s=>kindOf(s.lv[i])==='ind');}
function stepLast(i){const scored=S.tas.filter(s=>s.lv[i]);return scored.length?scored[scored.length-1].lv[i]:'';}
function curStep(){const o=num(S.meta.ta_cur);if(o!=null&&o>=1&&o<=S.steps.length)return{i:Math.round(o)-1,how:'set by hand'};
  const t=S.meta.ch_type;if(t==='total')return{i:-1,how:'total-task: every step each session'};
  const m=S.steps.map((s,i)=>stepMastered(i));
  if(t==='backward'){for(let i=m.length-1;i>=0;i--)if(!m[i])return{i,how:'backward chaining: the last step not yet mastered'};return{i:-2,how:'every step mastered'};}
  for(let i=0;i<m.length;i++)if(!m[i])return{i,how:(t==='forward'?'forward chaining: ':'')+'the first step not yet mastered'};return{i:-2,how:'every step mastered'};}
function srcIsTA(){const g=S.meta.g_src;if(g==='steps')return true;if(g==='trials')return false;return S.meta.format==='ta';}
function series(){const ta=srcIsTA();const arr=ta?S.tas:S.sess;return arr.map((s,i)=>{const st=ta?taStats(s):sessStats(s);return{i,date:s.date||'',ph:s.ph||'',inst:(s.inst||'').trim(),note:s.note||'',...st};});}

/* ---------------- codes ---------------- */
function renderCodes(){
  $('#codeTbl tbody').innerHTML=S.codes.map((c,i)=>`<tr><td><input data-r="codes" data-i="${i}" data-f="c" value="${esc(c.c)}" style="text-align:center;font-weight:600" aria-label="Code ${i+1}"></td><td><input data-r="codes" data-i="${i}" data-f="label" value="${esc(c.label)}" aria-label="Meaning of code ${i+1}"></td><td><select data-r="codes" data-i="${i}" data-f="kind" aria-label="What code ${i+1} counts as">${Object.keys(KINDS).map(k=>`<option value="${k}"${c.kind===k?' selected':''}>${KINDS[k]}</option>`).join('')}</select></td>${delCell('codes',i,'code')}</tr>`).join('');
  const key=S.codes.map(c=>`<span><b>${esc(c.c)}</b>${esc(c.label)}</span>`).join('');$('#codeKey').innerHTML=key;$('#codeKey2').innerHTML=key;
}
$('#addCode').addEventListener('click',()=>{if(S.codes.length>=10)return;S.codes.push({c:'',label:'',kind:'pr'});renderCodes();renderGrids();});
$('#delCode').addEventListener('click',async ()=>{if(S.codes.length<=2)return;const c=S.codes[S.codes.length-1];if((c.c||c.label)&&!(await nbhUI.confirm('Remove the last code?\nIts letter and label are deleted from the hierarchy.',{ok:'Remove',danger:true})))return;S.codes.pop();renderCodes();renderGrids();});
function cellSel(r,i,f,v,label){const k=kindOf(v);return `<select class="cell" data-r="${r}" data-i="${i}" data-f="${f}" aria-label="${esc(label)}"><option value=""></option>${S.codes.map(c=>`<option value="${esc(c.c)}"${c.c===v?' selected':''}>${esc(c.c)}</option>`).join('')}${v&&!S.codes.some(c=>c.c===v)?`<option value="${esc(v)}" selected>${esc(v)}</option>`:''}</select>`;}
const kcls=v=>{const k=kindOf(v);return k?' class="k-'+k+'"':'';};

/* ---------------- trial grid ---------------- */
function headRows(arr,r,label){const n=arr.length;
  let h='<thead><tr><th class="lk">Session</th>'+arr.map((s,i)=>'<th>'+(i+1)+' <button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this session" aria-label="Delete session '+(i+1)+'" style="padding:1px 4px;font-size:14px">&times;</button></th>').join('')+'</tr></thead><tbody>';
  h+='<tr><td class="lk">Date</td>'+arr.map((s,i)=>`<td><input class="dt" data-r="${r}" data-i="${i}" data-f="date" value="${esc(s.date)}" aria-label="${label} ${i+1} date" placeholder="m/d"></td>`).join('')+'</tr>';
  h+='<tr><td class="lk">Phase</td>'+arr.map((s,i)=>`<td><select data-r="${r}" data-i="${i}" data-f="ph" aria-label="${label} ${i+1} phase"><option value=""></option>${PHASES.map(p=>`<option value="${p[0]}"${s.ph===p[0]?' selected':''}>${p[0]}</option>`).join('')}</select></td>`).join('')+'</tr>';
  h+='<tr><td class="lk">Instructor</td>'+arr.map((s,i)=>`<td><input data-r="${r}" data-i="${i}" data-f="inst" value="${esc(s.inst)}" aria-label="${label} ${i+1} instructor" placeholder="JN"></td>`).join('')+'</tr>';
  return h;}
function renderTr(){
  const t=$('#trTbl'),n=ntr();if(!S.sess.length){t.innerHTML='<tbody><tr><td class="lk">No sessions yet. Add a session; the first two are usually baseline probes (phase B).</td></tr></tbody>';return;}
  let h=headRows(S.sess,'sess','Session');
  for(let k=0;k<n;k++){h+='<tr'+(k===0?' class="first"':'')+'><td class="lk">Trial '+(k+1)+(k===0?'<small>first trial</small>':'')+'</td>'+S.sess.map((s,i)=>'<td'+kcls(s.tr[k]||'')+'>'+cellSel('tr',i,String(k),s.tr[k]||'','Session '+(i+1)+' trial '+(k+1))+'</td>').join('')+'</tr>';}
  const st=S.sess.map(sessStats);
  h+='<tr class="sum"><td class="lk">Independent</td>'+st.map(x=>'<td>'+(x.sc?x.ind+'/'+x.sc:'—')+'</td>').join('')+'</tr>';
  h+='<tr class="sum"><td class="lk">% independent</td>'+st.map(x=>'<td>'+pct(x.pi)+'</td>').join('')+'</tr>';
  h+='<tr class="sum"><td class="lk">% correct (any prompt)</td>'+st.map(x=>'<td>'+pct(x.pc)+'</td>').join('')+'</tr>';
  h+='<tr class="sum"><td class="lk">First trial</td>'+st.map(x=>'<td'+(x.first?' class="k-'+kindOf(x.first)+'"':'')+'>'+(x.first?esc(x.first):'—')+'</td>').join('')+'</tr>';
  h+='<tr><td class="lk">Note</td>'+S.sess.map((s,i)=>`<td class="note"><input data-r="sess" data-i="${i}" data-f="note" value="${esc(s.note)}" aria-label="Session ${i+1} note" placeholder="prompt level, delay, change"></td>`).join('')+'</tr></tbody>';
  t.innerHTML=h;
  const M=$('#trMetrics'),T=st.filter((x,i)=>S.sess[i].ph==='T'&&x.pi!=null),last=st.filter(x=>x.pi!=null).slice(-1)[0],f5=st.filter(x=>x.first).slice(-5),fi=f5.filter(x=>x.firstInd).length;
  M.innerHTML=`<div class="metric"><b>Sessions</b><div class="val">${S.sess.length}</div><div class="sub">${S.sess.filter(s=>s.ph==='B').length} baseline · ${S.sess.filter(s=>s.ph==='T').length} teaching · ${S.sess.filter(s=>s.ph==='M').length} maintenance</div></div>
    <div class="metric"><b>Latest session</b><div class="val">${last?pct(last.pi):'—'}</div><div class="sub">independent${last?' · '+pct(last.pc)+' correct with prompts':''}</div></div>
    <div class="metric"><b>Teaching mean</b><div class="val">${T.length?pct(T.reduce((a,x)=>a+x.pi,0)/T.length):'—'}</div><div class="sub">${T.length} teaching session${T.length===1?'':'s'}</div></div>
    <div class="metric"><b>First trial independent</b><div class="val">${f5.length?fi+' of '+f5.length:'—'}</div><div class="sub">last ${f5.length||5} sessions with a first trial scored</div></div>`;
}
$('#addS').addEventListener('click',()=>{if(S.sess.length>=60)return;const prev=S.sess[S.sess.length-1];S.sess.push({date:'',ph:prev?prev.ph:'B',inst:prev?prev.inst:'',tr:[],note:''});renderTr();renderGraph();});
$('#delS').addEventListener('click',async ()=>{if(!S.sess.length)return;const s=S.sess[S.sess.length-1];if((s.date||s.tr.some(x=>x))&&!(await nbhUI.confirm('Remove the last session?\nIts date and scores are deleted.',{ok:'Remove',danger:true})))return;S.sess.pop();renderTr();renderGraph();});

/* ---------------- task analysis ---------------- */
function renderSteps(){
  const cs=curStep();
  $('#stepTbl tbody').innerHTML=S.steps.map((s,i)=>{const m=stepMastered(i),l=stepLast(i);const cur=cs.i===i||cs.i===-1;
    return `<tr${cur?' class="cur"':''}><td class="num">${i+1}</td><td class="st"><input data-r="steps" data-i="${i}" data-f="text" value="${esc(s.text)}" aria-label="Step ${i+1}" placeholder="Turns on the water"></td><td class="num">${m?'<span style="color:#2F6B37;font-weight:600">mastered</span>':cur?'<b>training step</b>':l?'last: '+esc(l):'—'}</td>${delCell('steps',i,'step')}</tr>`;}).join('');
  const t=$('#taTbl');if(!S.tas.length){t.innerHTML='<tbody><tr><td class="lk">No sessions yet. Add a session to score each step.</td></tr></tbody>';}
  else{let h=headRows(S.tas,'tas','TA session');
    S.steps.forEach((st,k)=>{h+='<tr'+(cs.i===k?' class="cur"':'')+'><td class="st">'+(k+1)+'. '+esc(st.text||('Step '+(k+1)))+(cs.i===k?' <b>(training)</b>':'')+'</td>'+S.tas.map((s,i)=>'<td'+kcls(s.lv[k]||'')+'>'+cellSel('lv',i,String(k),s.lv[k]||'','TA session '+(i+1)+' step '+(k+1))+'</td>').join('')+'</tr>';});
    const x=S.tas.map(taStats);
    h+='<tr class="sum"><td class="st">Steps independent</td>'+x.map(y=>'<td>'+(y.sc?y.ind+'/'+y.sc:'—')+'</td>').join('')+'</tr>';
    h+='<tr class="sum"><td class="st">% of steps independent</td>'+x.map(y=>'<td>'+pct(y.pi)+'</td>').join('')+'</tr>';
    h+='<tr class="sum"><td class="st">% correct (any prompt)</td>'+x.map(y=>'<td>'+pct(y.pc)+'</td>').join('')+'</tr>';
    h+='<tr><td class="st">Note</td>'+S.tas.map((s,i)=>`<td class="note"><input data-r="tas" data-i="${i}" data-f="note" value="${esc(s.note)}" aria-label="TA session ${i+1} note" placeholder="training step, prompt level"></td>`).join('')+'</tr></tbody>';
    t.innerHTML=h;}
  const x=S.tas.map(taStats),last=x.filter(y=>y.pi!=null).slice(-1)[0],mast=S.steps.filter((s,i)=>stepMastered(i)).length;
  $('#taMetrics').innerHTML=`<div class="metric"><b>Steps</b><div class="val">${S.steps.length}</div><div class="sub">${mast} mastered (independent on the last two scored sessions)</div></div>
    <div class="metric"><b>Current training step</b><div class="val">${cs.i>=0?cs.i+1:cs.i===-1?'all':cs.i===-2?'done':'—'}</div><div class="sub">${esc(cs.how)}</div></div>
    <div class="metric"><b>Latest session</b><div class="val">${last?pct(last.pi):'—'}</div><div class="sub">of steps independent${last?' · '+pct(last.pc)+' correct with prompts':''}</div></div>
    <div class="metric"><b>Sessions</b><div class="val">${S.tas.length}</div><div class="sub">${S.tas.filter(s=>s.ph==='B').length} baseline · ${S.tas.filter(s=>s.ph==='T').length} teaching · ${S.tas.filter(s=>s.ph==='M').length} maintenance</div></div>`;
}
$('#addStep').addEventListener('click',()=>{if(S.steps.length>=30)return;S.steps.push({text:''});renderSteps();renderTaSheet();});
$('#delStep').addEventListener('click',async ()=>{if(S.steps.length<=1)return;const s=S.steps[S.steps.length-1];if(s.text&&!(await nbhUI.confirm('Remove the last step?\nIts text and its scores in the task-analysis sessions are deleted.',{ok:'Remove',danger:true})))return;S.steps.pop();renderSteps();renderTaSheet();renderGraph();});
$('#addTS').addEventListener('click',()=>{if(S.tas.length>=60)return;const prev=S.tas[S.tas.length-1];S.tas.push({date:'',ph:prev?prev.ph:'B',inst:prev?prev.inst:'',lv:[],note:''});renderSteps();renderGraph();});
$('#delTS').addEventListener('click',async ()=>{if(!S.tas.length)return;const s=S.tas[S.tas.length-1];if((s.date||s.lv.some(x=>x))&&!(await nbhUI.confirm('Remove the last session?\nIts date and step scores are deleted.',{ok:'Remove',danger:true})))return;S.tas.pop();renderSteps();renderGraph();});

/* ---------------- probes ---------------- */
function probeRows(){const m=mc();return S.probes.map(p=>{const n=num(p.n),k=num(p.k);const pc=n&&k!=null?k/n*100:null;return{...p,nn:n,kk:k,pc,pass:pc==null?null:pc>=m.pct};});}
function renderPr(){
  $('#prTbl tbody').innerHTML=probeRows().map((p,i)=>`<tr><td class="num">${i+1}</td><td><input data-r="probes" data-i="${i}" data-f="date" value="${esc(p.date)}" aria-label="Probe ${i+1} date"></td>
    <td><select data-r="probes" data-i="${i}" data-f="type" aria-label="Probe ${i+1} type"><option value=""></option>${PRTYPES.map(t=>`<option${p.type===t?' selected':''}>${t}</option>`).join('')}</select></td>
    <td><select data-r="probes" data-i="${i}" data-f="dim" aria-label="Probe ${i+1} dimension"><option value=""></option>${PRDIMS.map(t=>`<option${p.dim===t?' selected':''}>${t}</option>`).join('')}</select></td>
    <td><input data-r="probes" data-i="${i}" data-f="desc" value="${esc(p.desc)}" aria-label="Probe ${i+1} condition"></td>
    <td><input data-r="probes" data-i="${i}" data-f="n" value="${esc(p.n)}" style="text-align:center" aria-label="Probe ${i+1} trials"></td>
    <td><input data-r="probes" data-i="${i}" data-f="k" value="${esc(p.k)}" style="text-align:center" aria-label="Probe ${i+1} independent"></td>
    <td class="num">${pct(p.pc)}</td><td class="num">${p.pass==null?'—':p.pass?'<span style="color:#2F6B37;font-weight:600">pass</span>':'<span style="color:#8E2A2A;font-weight:600">below</span>'}</td>
    <td><input data-r="probes" data-i="${i}" data-f="note" value="${esc(p.note)}" aria-label="Probe ${i+1} note"></td>${delCell('probes',i,'probe')}</tr>`).join('');
  const R=probeRows(),m=mc(),mt=R.filter(p=>p.type==='Maintenance'&&p.pc!=null),gn=R.filter(p=>p.type==='Generalization'&&p.pc!=null);
  const dims={};gn.forEach(p=>{const d=p.dim||'Other';if(!dims[d])dims[d]={n:0,pass:0};dims[d].n++;if(p.pass)dims[d].pass++;});
  const dk=Object.keys(dims);
  $('#prMetrics').innerHTML=`<div class="metric"><b>Maintenance probes</b><div class="val">${mt.length?mt.filter(p=>p.pass).length+' of '+mt.length:'—'}</div><div class="sub">passed at ${m.pct}%${mt.length?' · latest '+pct(mt[mt.length-1].pc):''}</div></div>
    <div class="metric"><b>Generalization dimensions probed</b><div class="val">${dk.length}</div><div class="sub">${dk.length?dk.map(d=>d+' '+dims[d].pass+'/'+dims[d].n).join(' · '):'people, setting, materials, time'}</div></div>
    <div class="metric"><b>Generalization probes</b><div class="val">${gn.length?gn.filter(p=>p.pass).length+' of '+gn.length:'—'}</div><div class="sub">passed</div></div>`;
  const v=$('#prVerdict');if(!R.length){v.innerHTML='<div class="verdict v-mid"><b>No probes yet.</b> After mastery, probe maintenance on the schedule above and generalization across each dimension in the plan.</div';return;}
  const fails=R.filter(p=>p.pass===false),untested=['People','Setting','Materials','Time of day'].filter(d=>!dims[d]);
  if(fails.length)v.innerHTML='<div class="verdict v-no"><b>'+fails.length+' probe'+(fails.length===1?'':'s')+' below criterion.</b> '+esc(fails.map(p=>(p.type||'probe')+(p.dim?' ('+p.dim+')':'')+' on '+(p.date||'?')+' at '+pct(p.pc)).join('; '))+'. Teach in that condition with the same procedure and re-probe.</div>';
  else v.innerHTML='<div class="verdict v-ok"><b>Every scored probe at or above '+m.pct+'%.</b>'+(untested.length?' Not yet probed: '+untested.join(', ')+'.':' All four dimensions probed.')+'</div>';
}
$('#addPr').addEventListener('click',()=>{if(S.probes.length>=60)return;S.probes.push({date:'',type:S.probes.length?'Generalization':'Maintenance',dim:'',desc:'',n:String(ntr()),k:'',note:''});renderPr();});
$('#delPr').addEventListener('click',async ()=>{if(!S.probes.length)return;const p=S.probes[S.probes.length-1];if((p.date||p.k)&&!(await nbhUI.confirm('Remove the last probe?\nIts date and result are deleted.',{ok:'Remove',danger:true})))return;S.probes.pop();renderPr();});
async function rowDel(r,i){
  if(r==='codes'){const c=S.codes[i];if(!c)return;if(S.codes.length<=2){alert('The hierarchy keeps at least two codes; edit this one instead.');return;}
    const used=!!c.c&&(S.sess.some(s=>s.tr.includes(c.c))||S.tas.some(s=>s.lv.includes(c.c)));
    if((c.c||c.label)&&!(await nbhUI.confirm('Delete this code?'+(used?'\nCells scored with it keep the letter but count as prompted until a code with that letter exists again.':''),{ok:'Delete',danger:true})))return;
    S.codes.splice(i,1);renderCodes();renderGrids();}
  else if(r==='sess'||r==='tas'){const s=S[r][i];if(!s)return;const cells=(r==='sess'?s.tr:s.lv).some(x=>x);
    if((s.date||s.note||cells)&&!(await nbhUI.confirm('Delete this session?'+(cells?'\nIts scores go with it; later sessions move left.':''),{ok:'Delete',danger:true})))return;
    S[r].splice(i,1);if(r==='sess')renderTr();else renderSteps();renderGraph();}
  else if(r==='steps'){const s=S.steps[i];if(!s)return;const scored=S.tas.filter(t=>t.lv[i]).length;
    if((s.text||scored)&&!(await nbhUI.confirm('Delete this step?'+(scored?'\nIts scores in '+scored+' task-analysis session'+(scored===1?'':'s')+' will be removed; later steps move up.':''),{ok:'Delete',danger:true})))return;
    S.steps.splice(i,1);S.tas.forEach(t=>{if(t.lv.length>i)t.lv.splice(i,1);});
    const o=num(S.meta.ta_cur);if(o!=null){const k=Math.round(o)-1;if(k===i)S.meta.ta_cur='';else if(k>i)S.meta.ta_cur=String(k);$$('[data-m="ta_cur"]').forEach(x=>{x.value=S.meta.ta_cur;});}
    if(!S.steps.length)S.steps.push({text:''});renderSteps();renderTaSheet();renderGraph();}
  else if(r==='probes'){const p=S.probes[i];if(!p)return;if((p.date||p.k||p.desc||p.note)&&!(await nbhUI.confirm('Delete this row?\nThe probe it holds is deleted.',{ok:'Delete',danger:true})))return;S.probes.splice(i,1);renderPr();}
}
$('#saPngBtn').addEventListener('click',()=>svgToPng($('#saPlot'),graphFile('SA-1',S.meta.client)));

/* ---------------- graph and decisions ---------------- */
function renderGraph(){
  const R=series(),m=mc(),ta=srcIsTA(),v=$('#graphVerdict'),M=$('#graphMetrics'),RU=$('#graphRules');
  const scored=R.filter(r=>r.pi!=null),B=scored.filter(r=>r.ph==='B'),T=scored.filter(r=>r.ph==='T'),MT=scored.filter(r=>r.ph==='M');
  const bm=B.length?B.reduce((a,r)=>a+r.pi,0)/B.length:null,tm=T.length?T.reduce((a,r)=>a+r.pi,0)/T.length:null;
  const win=T.slice(-m.n),atCrit=win.length>=m.n&&win.every(r=>r.pi>=m.pct),insts=new Set(win.map(r=>r.inst).filter(Boolean));
  const firstOk=!S.chk.mc_first||ta||win.every(r=>r.firstInd);
  const rules=[];let state='mid';
  if(!scored.length){v.innerHTML='<div class="verdict v-mid"><b>No sessions scored yet.</b> Enter the baseline probes as phase B and the teaching sessions as phase T; the graph and the rules read the '+(ta?'task-analysis':'trial')+' grid.</div>';M.innerHTML='';RU.innerHTML='';draw(R,m);return;}
  if(bm!=null&&bm>=m.pct&&!T.length){rules.push(['no','Baseline mean '+pct(bm)+' is already at the criterion: the skill is in the repertoire under these conditions. Choose a harder target or move this one to maintenance.']);state='no';}
  if(atCrit&&insts.size>=m.inst&&firstOk){rules.push(['ok','Mastered: '+m.n+' consecutive teaching sessions at or above '+m.pct+'% with '+insts.size+' instructor'+(insts.size===1?'':'s')+' ('+[...insts].join(', ')+'). Move to the maintenance phase, thin the reinforcement schedule as written on the Setup page, and run the probes.']);state='ok';}
  else if(atCrit&&!firstOk){rules.push(['mid','The last '+m.n+' teaching sessions are at criterion but not every one began with an independent first trial, which the criterion requires. Continue until the first trials hold.']);}
  else if(atCrit){rules.push(['mid','The last '+m.n+' teaching sessions are at criterion with '+(insts.size?insts.size+' instructor'+(insts.size===1?'':'s'):'no instructor initials entered')+'; the criterion asks for '+m.inst+'. '+(insts.size?'A session run by a second instructor is needed before the skill is called mastered.':'Enter the initials in the instructor row.')]);}
  else if(T.length>=5){const l5=T.slice(-5),gain=l5[4].pi-l5[0].pi,any=l5.some(r=>r.pi>=m.pct);
    if(!any&&gain<10){rules.push(['no','No change over the last 5 teaching sessions ('+l5.map(r=>pct(r.pi)).join(', ')+'): change the procedure rather than continue it. Options in order: check the reinforcer (Form PA-1), change the prompt level or delay, change the error correction, cut the trials per session or the target set. Write the change on the session note.']);state='no';}
    else rules.push(['mid','Progressing: the last 5 teaching sessions ran '+l5.map(r=>pct(r.pi)).join(', ')+'. Continue; '+(m.n-win.filter(r=>r.pi>=m.pct).length>0?'the criterion needs '+m.n+' consecutive sessions at '+m.pct+'%.':'the criterion is within reach.')]);}
  else if(T.length)rules.push(['mid',T.length+' teaching session'+(T.length===1?'':'s')+' so far: no decision until five.']);
  else rules.push(['mid','Baseline only ('+B.length+' probe'+(B.length===1?'':'s')+', mean '+pct(bm)+'). Begin teaching when two probes are in (working convention).']);
  if(T.length>=3&&S.meta.hier==='ltm'){const l3=T.slice(-3),pcm=l3.reduce((a,r)=>a+(r.pc||0),0)/3;if(pcm<50){rules.push(['no','Errors: the last 3 teaching sessions average '+pct(pcm)+' correct even with prompts under least-to-most prompting. Consider most-to-least or a delayed prompt (Libby et al., 2008; Touchette & Howard, 1984).']);if(state!=='ok')state='no';}}
  if(MT.length){const lm=MT[MT.length-1];if(lm.pi<m.pct){rules.push(['no','Maintenance session on '+(lm.date||'?')+' at '+pct(lm.pi)+', below the criterion: run booster teaching sessions and re-probe.']);if(state!=='ok')state='no';}else rules.push(['ok','Maintenance holding: latest maintenance session '+pct(lm.pi)+'.']);}
  if(!ta){const f=T.filter(r=>r.first).slice(-5);if(f.length>=3){const fi=f.filter(r=>r.firstInd).length;rules.push([fi>=f.length-1?'ok':'mid','First-trial check: '+fi+' of the last '+f.length+' teaching sessions began with an independent response'+(fi<f.length-1?'; the first-trial record would say the skill is weaker than the full record does.':'.')]);}}
  M.innerHTML=`<div class="metric"><b>Baseline mean</b><div class="val">${pct(bm)}</div><div class="sub">${B.length} probe session${B.length===1?'':'s'}</div></div>
    <div class="metric"><b>Teaching mean</b><div class="val">${pct(tm)}</div><div class="sub">${T.length} session${T.length===1?'':'s'} · latest ${T.length?pct(T[T.length-1].pi):'—'}</div></div>
    <div class="metric"><b>At criterion</b><div class="val">${win.filter(r=>r.pi>=m.pct).length} of ${m.n}</div><div class="sub">last ${m.n} teaching sessions at ${m.pct}%</div></div>
    <div class="metric"><b>Instructors in the window</b><div class="val">${insts.size}</div><div class="sub">of ${m.inst} required${insts.size?' · '+[...insts].join(', '):''}</div></div>`;
  v.innerHTML='<div class="verdict v-'+state+'"><b>'+scored.length+' session'+(scored.length===1?'':'s')+' scored ('+(ta?'task analysis':'trial grid')+').</b> '+esc(rules[0][1])+'</div>';
  RU.innerHTML='<ul style="font-family:var(--sans);font-size:12.5px;margin:4px 0 4px 18px">'+rules.map(r=>'<li>'+esc(r[1])+'</li>').join('')+'</ul><p class="hint">The rules (criterion of '+m.pct+'% across '+m.n+' sessions and '+m.inst+' instructors; no change over 5 sessions with less than a 10-point gain; 50% correct under least-to-most; booster when maintenance falls below criterion) are this form’s working conventions, set on the Setup page and in the Guide.</p>';
  draw(R,m);
}
function draw(R,m){
  const W=900,H=350,L=56,Rg=20,T=22,B=70,n=Math.max(R.length,10);const X=i=>L+(i+0.5)*(W-L-Rg)/n,Y=v=>T+(H-T-B)*(1-v/100);
  let s='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#fff"/>';
  [0,25,50,75,100].forEach(p=>{s+='<line x1="'+L+'" y1="'+Y(p)+'" x2="'+(W-Rg)+'" y2="'+Y(p)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(p)+4)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+p+'%</text>';});
  s+='<line x1="'+L+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  /* the mastery line */
  s+='<line x1="'+L+'" y1="'+Y(m.pct).toFixed(1)+'" x2="'+(W-Rg)+'" y2="'+Y(m.pct).toFixed(1)+'" stroke="#2F6B37" stroke-width="1.5" stroke-dasharray="6 4"/><text x="'+(W-Rg-4)+'" y="'+(Y(m.pct)+13).toFixed(1)+'" font-size="11" text-anchor="end" fill="#2F6B37" font-family="system-ui,sans-serif">mastery '+m.pct+'%</text>';
  /* phase changes */
  let prev=null;R.forEach((r,i)=>{if(prev!==null&&r.ph&&r.ph!==prev){const x=X(i)-(W-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+T+'" x2="'+x.toFixed(1)+'" y2="'+Y(0)+'" stroke="#182e43" stroke-dasharray="4 4"/><text x="'+(x+4).toFixed(1)+'" y="'+(T+12)+'" font-size="11" fill="#182e43" font-family="system-ui,sans-serif">'+esc(PHNAME[r.ph]||r.ph)+'</text>';}if(r.ph)prev=r.ph;});
  if(R.length&&R[0].ph)s+='<text x="'+(L+4)+'" y="'+(T+12)+'" font-size="11" fill="#182e43" font-family="system-ui,sans-serif">'+esc(PHNAME[R[0].ph]||R[0].ph)+'</text>';
  const path=(key,color,w)=>{let d='';R.forEach((r,i)=>{if(r[key]==null||(i>0&&R[i-1].ph!==r.ph&&r.ph)){if(r[key]!=null){d+='|M'+X(i).toFixed(1)+' '+Y(r[key]).toFixed(1)+' ';}else d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(r[key]).toFixed(1)+' ';});
    d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="'+color+'" stroke-width="'+w+'"/>';});};
  if(S.chk.showCorrect)path('pc','#9aa9ad',1.5);
  path('pi','#2f5568',2);
  R.forEach((r,i)=>{if(r.pi!=null)s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(r.pi).toFixed(1)+'" r="4.5" fill="'+(r.ph==='B'?'#fff':r.pi>=m.pct?'#2F6B37':'#2f5568')+'" stroke="#2f5568" stroke-width="1.5"/>';
    if(S.chk.showCorrect&&r.pc!=null)s+='<rect x="'+(X(i)-2.5).toFixed(1)+'" y="'+(Y(r.pc)-2.5).toFixed(1)+'" width="5" height="5" fill="#9aa9ad"/>';
    if(S.chk.showFirst&&r.first)s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+26)+'" font-size="10" text-anchor="middle" fill="'+(r.firstInd?'#2F6B37':'#8E2A2A')+'" font-family="system-ui,sans-serif">'+esc(r.first)+'</text>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+14)+'" font-size="10" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(String(r.date||r.i+1).slice(0,6))+'</text>';});
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(H-18)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">Percent independent per session: filled green at or above the mastery line, hollow in baseline; dashed verticals mark phase changes</text>';
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(H-5)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(S.chk.showCorrect?'Gray squares: percent correct with prompts included. ':'')+(S.chk.showFirst?'Code under each date: the first trial of that session.':'')+'</text>';
  $('#saPlot').innerHTML=s;
}

/* ---------------- blank sheets ---------------- */
function sheetHead(title,ta){const m=S.meta;
  return `<div class="bs-title">${esc(title)}</div><div class="bs-grid"><div><b>Student:</b> ${esc(m.client||'________________')}</div><div><b>Program:</b> ${esc(m.program||'________________')}</div><div><b>Goal (GB-1):</b> ${esc(m.goal||'')}</div><div><b>Format:</b> ${ta?'Task-analysis chaining'+(m.ch_type?' ('+esc({forward:'forward',backward:'backward',total:'total-task'}[m.ch_type]||m.ch_type)+')':''):esc({dtt:'Discrete-trial teaching',net:'Natural environment teaching',ta:'Task-analysis chaining'}[m.format]||'')}</div><div><b>Prompting:</b> ${esc({ltm:'least-to-most',mtl:'most-to-least',gg:'graduated guidance',ctd:'constant time delay',ptd:'progressive time delay'}[m.hier]||'')}${m.delay?'; delay: '+esc(m.delay):''}</div><div><b>Criterion:</b> ${esc(mc().pct)}% across ${esc(mc().n)} sessions, ${esc(mc().inst)} instructors</div></div>
    <div class="bs-line"><b>Target:</b> ${esc(m.skill||'')}${m.def?' <b>Correct:</b> '+esc(m.def):''}${m.lat?' ('+esc(m.lat)+')':''}</div>
    <div class="bs-line"><b>S<sup>D</sup>:</b> ${esc(m.sd||'')}</div>
    ${m.ec?'<div class="bs-line"><b>Error correction:</b> '+esc(m.ec)+'</div>':''}${m.sr?'<div class="bs-line"><b>Reinforcement:</b> '+esc(m.sr)+(m.sr_prompt?' · prompted: '+esc(m.sr_prompt):'')+'</div>':''}
    <div class="bs-key"><b>Codes:</b> ${S.codes.map(c=>'<span><b>'+esc(c.c)+'</b>'+esc(c.label)+'</span>').join('')}</div>`;}
function sheetFoot(){return '<div class="bs-foot"><span>Score the response to the S<sup>D</sup> before any correction. Phase: B baseline/probe, T teaching, M maintenance.</span><span>Form SA-1 · '+esc(S.meta.program||'')+'</span></div>';}
function renderTrialSheet(){const cols=Math.max(1,Math.min(20,Math.round(num(S.meta.bs_cols)??10))),n=ntr();
  let h=sheetHead('Trial Sheet')+'<table class="bs"><thead><tr><th class="l">Session</th>'+Array.from({length:cols},(_,i)=>'<th>'+(i+1)+'</th>').join('')+'</tr></thead><tbody>';
  ['Date','Instructor','Phase'].forEach(l=>{h+='<tr class="hd"><td class="l">'+l+'</td>'+'<td></td>'.repeat(cols)+'</tr>';});
  for(let k=0;k<n;k++)h+='<tr'+(k===0?' class="first"':'')+'><td class="l">Trial '+(k+1)+'</td>'+'<td></td>'.repeat(cols)+'</tr>';
  ['Independent','% independent','% correct'].forEach(l=>{h+='<tr class="sum"><td class="l">'+l+'</td>'+'<td></td>'.repeat(cols)+'</tr>';});
  h+='<tr class="hd"><td class="l">Note</td>'+'<td></td>'.repeat(cols)+'</tr></tbody></table>'+sheetFoot();
  $('#trialSheet').innerHTML=h;}
function renderTaSheet(){const cols=Math.max(1,Math.min(16,Math.round(num(S.meta.ta_cols)??8)));
  let h=sheetHead('Task-Analysis Sheet',true)+'<table class="bs"><thead><tr><th class="step">Step</th>'+Array.from({length:cols},(_,i)=>'<th>'+(i+1)+'</th>').join('')+'</tr></thead><tbody>';
  ['Date','Instructor','Phase'].forEach(l=>{h+='<tr class="hd"><td class="step"><b>'+l+'</b></td>'+'<td></td>'.repeat(cols)+'</tr>';});
  S.steps.forEach((s,k)=>{h+='<tr><td class="step">'+(k+1)+'. '+esc(s.text||'')+'</td>'+'<td></td>'.repeat(cols)+'</tr>';});
  ['Steps independent','% of steps independent','Training step'].forEach(l=>{h+='<tr class="sum"><td class="step">'+l+'</td>'+'<td></td>'.repeat(cols)+'</tr>';});
  h+='</tbody></table>'+sheetFoot();
  $('#taSheet').innerHTML=h;}

/* ---------------- setup verdict ---------------- */
function renderSetup(){const m=S.meta,miss=[];
  if(!m.skill)miss.push('the target skill');if(!m.def)miss.push('the definition of a correct response');if(!m.sd)miss.push('the S<sup>D</sup>');if(!m.format)miss.push('the teaching format');if(!m.hier&&m.format!=='ta')miss.push('the prompt hierarchy');if(!m.ec)miss.push('the error-correction procedure');if(!m.sr)miss.push('the reinforcement schedule');if(!m.mc_pct&&!m.mc_n)miss.push('the mastery criterion (defaults of 90% and 3 sessions apply)');
  const v=$('#setupVerdict');if(!m.skill&&!m.sd&&!m.format){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The blank sheets print what is entered here, so write the S<sup>D</sup> and the definition before the first session.</div>';return;}
  v.innerHTML=miss.length?'<div class="verdict v-mid"><b>Still missing:</b> '+miss.join(', ')+'. Two instructors cannot run the same trial until these are written.</div>':'<div class="verdict v-ok"><b>The program is written.</b> Criterion '+mc().pct+'% across '+mc().n+' sessions with '+mc().inst+' instructors; '+({dtt:'discrete-trial',net:'natural environment',ta:'task-analysis'}[m.format]||'')+' teaching'+(m.hier?' with '+({ltm:'least-to-most',mtl:'most-to-least',gg:'graduated guidance',ctd:'constant time delay',ptd:'progressive time delay'}[m.hier])+' prompting':'')+'. Print the blank sheet and start with two baseline probes.</div>';}

/* ---------------- input ---------------- */
function renderGrids(){renderTr();renderSteps();renderTrialSheet();renderTaSheet();renderGraph();}
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(r==='tr'){S.sess[i].tr[+f]=el.value;return;}if(r==='lv'){S.tas[i].lv[+f]=el.value;return;}
    S[r][i][f]=el.value;
    if(r==='codes'){renderCodes();}
    if(r==='probes'&&(f==='n'||f==='k')){renderPrSoon();}
    if(r==='steps'){renderTaSheetSoon();}
    return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;S.meta[k]=el.value;$$('[data-m="'+k+'"]').forEach(x=>{if(x!==el)x.value=el.value;});
    if(k==='ntr'||k==='bs_cols'||k==='ta_cols'||k==='ta_cur'){renderSoon();}else if(/^(mc_|format|hier|delay|ch_type|skill|def|sd|lat|ec|sr|client|program|goal)/.test(k)){renderSheetsSoon();}}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(el.type==='checkbox'){S[r][i][f]=el.checked;return;}
    if(r==='tr'){S.sess[i].tr[+f]=el.value;const td=el.closest('td');td.className=kindOf(el.value)?'k-'+kindOf(el.value):'';renderTrSoon();return;}
    if(r==='lv'){S.tas[i].lv[+f]=el.value;const td=el.closest('td');td.className=kindOf(el.value)?'k-'+kindOf(el.value):'';renderTaSoon();return;}
    S[r][i][f]=el.value;
    if(r==='sess'){renderTrSoon();}if(r==='tas'){renderTaSoon();}if(r==='codes'){renderCodes();renderGrids();}if(r==='probes'){renderPr();}
    return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderGraph();}
  if(el.dataset.m!==undefined){const k=el.dataset.m;S.meta[k]=el.value;$$('[data-m="'+k+'"]').forEach(x=>{if(x!==el)x.value=el.value;});renderSetup();renderGraph();if(k==='format'||k==='ch_type'||k==='hier'||k==='g_src'){renderSteps();renderTrialSheet();renderTaSheet();}}
});
let tA=0,tB=0,tC=0,tD=0,tE=0;
function renderTrSoon(){clearTimeout(tA);tA=setTimeout(()=>{renderTr();renderGraph();},200);}
function renderTaSoon(){clearTimeout(tB);tB=setTimeout(()=>{renderSteps();renderGraph();},200);}
function renderPrSoon(){clearTimeout(tC);tC=setTimeout(renderPr,250);}
function renderSoon(){clearTimeout(tD);tD=setTimeout(()=>{renderGrids();renderSetup();},300);}
function renderSheetsSoon(){clearTimeout(tE);tE=setTimeout(()=>{renderTrialSheet();renderTaSheet();renderSetup();renderGraph();},300);}
function renderTaSheetSoon(){clearTimeout(tE);tE=setTimeout(()=>{renderTaSheet();renderSteps();},300);}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();renderCodes();renderTr();renderSteps();renderPr();renderTrialSheet();renderTaSheet();renderSetup();renderGraph();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
function printSheet(cls){document.body.classList.add(cls);
  const st=document.createElement('style');st.id='saSheetPage';st.textContent='@media print{@page{size:letter landscape;margin:0.5in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove(cls);st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);}
$('#trialSheetBtn').addEventListener('click',()=>printSheet('sa-print-trial'));
$('#taSheetBtn').addEventListener('click',()=>{if(!S.steps.some(s=>s.text)){alert('Write the steps of the task analysis first; the sheet lists them.');return;}printSheet('sa-print-ta');});
$('#saveBtn').addEventListener('click',()=>{
  const nm=((S.meta.client||'student')+'_'+(S.meta.program||'program')).replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'SA-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`SA-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='SA-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const strs=(a,n)=>Array.isArray(a)?a.slice(0,n).map(str):[];
  o.codes=Array.isArray(s.codes)?s.codes.slice(0,10).map(x=>({c:str(x&&x.c),label:str(x&&x.label),kind:['ind','pr','err'].includes(x&&x.kind)?x.kind:'pr'})):[];
  o.sess=Array.isArray(s.sess)?s.sess.slice(0,60).map(x=>({date:str(x&&x.date),ph:['B','T','M'].includes(x&&x.ph)?x.ph:'',inst:str(x&&x.inst),tr:strs(x&&x.tr,50),note:str(x&&x.note)})):[];
  o.steps=Array.isArray(s.steps)?s.steps.slice(0,30).map(x=>({text:str(x&&x.text)})):[];
  o.tas=Array.isArray(s.tas)?s.tas.slice(0,60).map(x=>({date:str(x&&x.date),ph:['B','T','M'].includes(x&&x.ph)?x.ph:'',inst:str(x&&x.inst),lv:strs(x&&x.lv,30),note:str(x&&x.note)})):[];
  o.probes=Array.isArray(s.probes)?s.probes.slice(0,60).map(x=>({date:str(x&&x.date),type:str(x&&x.type),dim:str(x&&x.dim),desc:str(x&&x.desc),n:str(x&&x.n),k:str(x&&x.k),note:str(x&&x.note)})):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='SA-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved SA-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form SA-1. Nothing was changed.':'That file could not be read as a saved SA-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved SA-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Sheet','#','Date','Phase or type','Instructor or dimension','Condition','Codes','Scored','Independent','% independent','% correct','First trial','Note']];
  S.sess.forEach((s,i)=>{const x=sessStats(s);out.push(['Trials',i+1,s.date,s.ph,s.inst,'',s.tr.slice(0,ntr()).join(' '),x.sc,x.ind,x.pi==null?'':x.pi.toFixed(1),x.pc==null?'':x.pc.toFixed(1),x.first,s.note]);});
  S.tas.forEach((s,i)=>{const x=taStats(s);out.push(['Task analysis',i+1,s.date,s.ph,s.inst,'',S.steps.map((st,k)=>s.lv[k]||'').join(' '),x.sc,x.ind,x.pi==null?'':x.pi.toFixed(1),x.pc==null?'':x.pc.toFixed(1),'',s.note]);});
  probeRows().forEach((p,i)=>{out.push(['Probe',i+1,p.date,p.type,p.dim,p.desc,'',p.n,p.k,p.pc==null?'':p.pc.toFixed(1),'',p.pass==null?'':p.pass?'pass':'below',p.note]);});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SA-1_'+(S.meta.program||'program').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated program?\nEvery page is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const fmt=d=>(d.getMonth()+1)+'/'+d.getDate();const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const D=n=>fmt(step(n,-1)),Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  S=blank();
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',program:'Break request (FCT), Program 2',goal:'GB-1 goal 3: asks for a break with the card on 90% of opportunities across 3 sessions and 2 adults',
    plan:'BIP dated '+Y(28)+' (Form TD-1): replacement skill 1, the break card replaces leaving the area',setting:'Resource room table; general education classroom from the probes on',teachers:'J. Newsome (JN); Ms. R., classroom teacher (MR); paraeducator (KP) for probes',bcba:'Joshua Newsome, M.A., BCBA',date:Y(27),start:Y(26),review:Y(0),
    skill:'Hands the break card to the adult when a non-preferred task is presented',def:'Within 5 s of the task being placed and the instruction given, picks up the card and places it in the adult’s hand or on the adult’s side of the table. Reaching for the card without releasing it, pushing the task away, or no response within 5 s is scored as an error.',
    sd:'The adult places the task on the desk, with the break card at the top right corner, and says “Time to work.”',lat:'within 5 s of the instruction',materials:'Break card (laminated, 3 by 5 in., red border); three non-preferred tasks (cutting, tracing, sorting); timer',prereq:'Attends to the adult at the table; tolerates the task on the table for 10 s; picks up and releases a card on request (probed '+Y(27)+')',
    mc_pct:'90',mc_n:'3',mc_inst:'2',mc_sets:'2',mc_why:'A communication skill the plan depends on: 90% across 3 sessions with both adults, then probed with the paraeducator',
    format:'dtt',ch_type:'forward',ntr:'10',hier:'mtl',delay:'0 for sessions 1 to 3 of teaching, then 2 s',iti:'3 to 5 s',
    fade:'Most-to-least: full physical, partial physical, verbal model, then independent. Drop one level after a session at or above 80% correct at the current level; go back one level after two sessions under 50% (working conventions). From the verbal level on, wait 2 s before the prompt.',
    probe_rule:'No prompts, no error correction; the task stays for 10 s and is then removed; praise for sitting only; 10 trials',
    ec:'Remove the materials, re-present the Sᴰ, prompt the correct response, then move on',ec_note:'The prompt is at the level last used; the corrected trial keeps its original code; a 30-s break follows the prompted hand-over',
    sr:'FR 1 (continuous) during acquisition: the 2-minute break at once, timer on the table (Form SR-1); after mastery, the break request is honored every time but the break shortens to 1 minute and work resumes with a token for returning',
    sr_prompt:'Praise and a 30-s break, so the independent hand-over pays more than the prompted one',reinforcer:'Escape from the task, the function identified on Form FS-1; a short break is the reinforcer the behavior already earned',mix:'Two mastered tacts (“cup”, “ball”) interspersed each session as easy trials',
    gen_plan:'Two instructors from teaching session 4 (JN and MR alternate); three task sets rotated; the card moved to the student’s desk pocket after mastery; probes with the paraeducator in the classroom, in the afternoon, and with a new worksheet (Stokes & Baer, 1977: sufficient exemplars and common stimuli)',
    bs_cols:'10',ta_cols:'8',ta_cur:'',g_src:'',
    decision:Y(2)+': mastered (sessions 9 to 11 at 90, 90 and 100% with JN and MR). Moved to maintenance; schedule thinned as written; probes begun.',change:'2-s delay added before the verbal prompt from teaching session 7 (the note on session 9 is the first session fully at the delayed level)',next:'GB-1 goal 3, objective 2: the card used in the classroom during independent work with Ms. R., then the paraeducator',
    mt_sched:'1 week, 2 weeks, 1 month after mastery, then monthly (working convention)',gen_dims:'People: paraeducator (KP), parent. Settings: classroom desk, cafeteria table. Materials: new worksheets, the iPad task. Time: afternoon block.',
    pr_fail:'Teach in the probed condition with the same procedure for up to 3 sessions; add the condition to the training rotation; re-probe a week after it reaches criterion',closed:''};
  S.chk={mc_first:false,showCorrect:true,showFirst:true};
  const tr=['––––––––––','–––I––––––','FFIFPFPIFP','PIPFIPPIPP','PIIPVIIPIV','IVIIPIVIIV','IIVIIVIIIV','IIIVIIIVII','IIIIVIIIII','IIIIIIII–I','IIIIIIIIII','IIIII–IIII'];
  const ph=['B','B','T','T','T','T','T','T','T','T','T','M'],inst=['JN','JN','JN','JN','JN','MR','JN','MR','JN','MR','JN','MR'];
  const notes=['probe: card on the table, no prompts','probe','full physical from the start (most-to-least)','partial physical','partial physical; verbal model on the last trials','faded to verbal model; MR’s first session','verbal model with a 2-s delay','2-s delay','first session at criterion','at criterion with MR','mastered: 3 sessions at or above 90% with JN and MR','maintenance, 1 week after mastery; break shortened to 1 minute'];
  S.sess=tr.map((t,i)=>({date:D(tr.length-1-i+2),ph:ph[i],inst:inst[i],tr:Array.from(t),note:notes[i]}));
  S.steps=['Turns on the water','Wets both hands','Pumps the soap once','Rubs hands together for 10 s (front, back, between fingers)','Rinses both hands','Turns off the water','Pulls one paper towel','Dries hands and drops the towel in the bin'].map(t=>({text:t}));
  const lv=['–I––I–––','PIFFIFPF','VIFFIFPF','IIPFIFPF','IIVFIFPF','IIIPIFPF','IIIVIVPF','IIIIIVPF'];
  const tph=['B','T','T','T','T','T','T','T'],tin=['JN','JN','MR','JN','MR','JN','MR','JN'];
  const tnotes=['probe: the whole chain, no prompts','step 1 taught (partial physical); later steps prompted through','step 1 verbal model','step 1 independent; step 3 taught','step 3 verbal model','step 3 independent; step 4 taught','step 4 verbal model','step 4 independent once; step 6 prompted through at verbal'];
  S.tas=lv.map((t,i)=>({date:D(lv.length-1-i+1),ph:tph[i],inst:tin[i],lv:Array.from(t),note:tnotes[i]}));
  S.probes=[{date:D(1),type:'Maintenance',dim:'Same as training',desc:'Resource room table, JN, task set 1, one week after mastery',n:'10',k:'9',note:'held without the timer'},
    {date:D(1),type:'Generalization',dim:'People',desc:'Paraeducator (KP) at the resource room table, task set 1',n:'10',k:'8',note:'two no-responses in the first three trials; KP had the card on the left'},
    {date:D(0),type:'Generalization',dim:'Setting',desc:'Classroom desk during independent work, MR',n:'10',k:'9',note:'card in the desk pocket'},
    {date:D(0),type:'Generalization',dim:'Materials',desc:'New worksheet (math), JN',n:'10',k:'10',note:''}];
  renderAll();setView('graph');
  nbhUI.toast('Simulation loaded: '+'a simulated break-request (FCT) program taught by discrete trials with most-to-least prompting.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. The program's skill, goal and discriminative stimulus come from the first
   acquisition objective on Form GB-1 (or the paired replacement named on Form TB-1), and the reinforcer
   line from the ranked menu on Form PA-1; the picker puts a chosen objective or behavior in their place. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const acq=((f.goals&&f.goals.acq)||[])[0],b=(f.behaviors||[])[0];
  if(acq){if(!m.skill){m.skill=acq.beh;n++;}if(!m.goal){m.goal='Form GB-1 acquisition objective: '+acq.text;n++;}if(!m.sd&&acq.cond){m.sd=acq.cond;n++;}}
  else if(b&&b.rep&&!m.skill){m.skill=b.rep;n++;}
  if(!m.reinforcer&&(f.menu||[]).length){m.reinforcer=nbhCase.menuLine(f.menu,3)+' (ranked on Form PA-1)';n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const acq=sel.goals.acq[0],b=sel.behaviors[0];
  if(acq){m.skill=acq.beh;m.goal='Form GB-1 acquisition objective: '+acq.text;if(acq.cond)m.sd=acq.cond;n++;}
  else if(b){m.skill=b.rep||b.label;if(b.def&&!b.rep)m.def=b.def;n++;}
  if(sel.menu.length){m.reinforcer=sel.menu.map(x=>x.name).join('; ')+' (ranked on Form PA-1)';n++;}
  renderAll();return {filled:n};
};
