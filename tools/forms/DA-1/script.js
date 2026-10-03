const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';
const f1=v=>v==null?'—':(Math.round(v*100)/100).toFixed(2);
const f0=v=>v==null?'—':String(Math.round(v));
const mean=a=>{const b=a.filter(x=>x!=null);return b.length?b.reduce((s,x)=>s+x,0)/b.length:null;};

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

/* ---------------- option sets ---------------- */
const EFFORT=['Low','Medium','High'];
const DIFF=['Below skills','At skills','Above skills','Unknown'];
const NOV=['Familiar','Occasional','Novel'];
const PROMPT=['Vocal only','Vocal, model','Vocal, model, physical','Written or visual','Group, no prompt'];
const PRES=['Materials placed','Page handed over','One-to-one at a table','Small group','Whole class','On a device'];
const CANDO=['Yes','With help','Not yet','Unknown'];
const AFF=['','1 distressed or avoiding','2 reluctant','3 neutral','4 settled','5 calm and engaged'];
const sel=(r,i,f,opts,val,label)=>'<select data-r="'+r+'" data-i="'+i+'" data-f="'+f+'" aria-label="'+esc(label)+'"><option value=""></option>'+opts.map(o=>'<option'+(o===val?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';
const selV=(r,i,f,opts,val,label)=>'<select data-r="'+r+'" data-i="'+i+'" data-f="'+f+'" aria-label="'+esc(label)+'">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+(String(o[0])===String(val)?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';

/* ---------------- state ---------------- */
function blank(){return{meta:{},tasks:[],sess:[],probes:[]};}
let S=blank();
const newTask=()=>({name:'',where:'',len:'',effort:'',diff:'',nov:'',prompt:'',pres:'',cando:'',rating:'',note:''});
const newSess=t=>({t:t==null?'':String(t),date:'',min:S.meta.len||'',given:'',comp:'',lat:'',pb:'',aff:'',note:''});
const newProbe=()=>({a:'',b:'',pick:'',note:''});
function ensure(){
  if(!Array.isArray(S.tasks))S.tasks=[];if(!Array.isArray(S.sess))S.sess=[];if(!Array.isArray(S.probes))S.probes=[];if(!S.meta||typeof S.meta!=='object')S.meta={};
  while(S.tasks.length<3)S.tasks.push(newTask());
}
const sessLen=()=>num(S.meta.len)??5;
const nPer=()=>Math.max(1,Math.min(10,Math.round(num(S.meta.nper)??3)));
const taskName=i=>{const t=S.tasks[i];return t?(t.name||('Task '+(i+1))):'';};

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- inventory ---------------- */
function renderTasks(){
  $('#taskTbl tbody').innerHTML=S.tasks.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="tasks" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="math worksheet, 20 problems" aria-label="Task ${i+1}"></td>
    <td><input data-r="tasks" data-i="${i}" data-f="where" value="${esc(r.where)}" placeholder="classroom, 10:00 block"></td>
    <td><input data-r="tasks" data-i="${i}" data-f="len" value="${esc(r.len)}" style="text-align:center" placeholder="20"></td>
    <td>${sel('tasks',i,'effort',EFFORT,r.effort,'Response effort, task '+(i+1))}</td>
    <td>${sel('tasks',i,'diff',DIFF,r.diff,'Difficulty, task '+(i+1))}</td>
    <td>${sel('tasks',i,'nov',NOV,r.nov,'Novelty, task '+(i+1))}</td>
    <td>${sel('tasks',i,'prompt',PROMPT,r.prompt,'Prompting, task '+(i+1))}</td>
    <td>${sel('tasks',i,'pres',PRES,r.pres,'Presentation, task '+(i+1))}</td>
    <td>${sel('tasks',i,'cando',CANDO,r.cando,'Can the student do task '+(i+1))}</td>
    <td>${sel('tasks',i,'rating',['1','2','3','4','5'],r.rating,'Aversive rating, task '+(i+1))}</td>
    <td><input data-r="tasks" data-i="${i}" data-f="note" value="${esc(r.note)}" placeholder="what the informant said"></td>${delCell('tasks',i,'task')}</tr>`).join('');
}
function renderInv(){
  const el=$('#invVerdict');const T=S.tasks.filter(t=>t.name);
  if(!T.length){el.innerHTML='<div class="verdict v-mid"><b>No tasks yet.</b> List the demands from the schedule; six to eight is a usual set (working convention).</div>';return;}
  const easy=T.filter(t=>num(t.rating)!=null&&num(t.rating)<=2).length,hard=T.filter(t=>num(t.rating)!=null&&num(t.rating)>=4).length;
  const above=T.filter(t=>/Above/.test(t.diff)).length,nov=T.filter(t=>/Novel/.test(t.nov)).length,cant=T.filter(t=>/Not yet/.test(t.cando)).length;
  const miss=T.filter(t=>!t.effort||!t.diff||!t.nov||!t.cando||!t.rating).length;
  const notes=[];
  if(easy<2)notes.push('Only '+easy+' task'+(easy===1?'':'s')+' rated 1 or 2: add at least two the student does readily so the assessment has high-probability demands to compare against and the fading plan has a start.');
  if(!hard)notes.push('No task rated 4 or 5: the informants do not expect any of these to evoke the behavior. Check the hypothesis, or ask for the tasks that were left off because they are avoided.');
  if(above)notes.push(above+' task'+(above===1?' is':'s are')+' above the student’s skills: expect difficulty to be a feature of the ranking (Weeks & Gaylord-Ross, 1981).');
  if(nov)notes.push(nov+' novel task'+(nov===1?'':'s')+': novelty can be its own establishing operation (Smith et al., 1995); a familiar version of the same task would separate the two.');
  if(cant)notes.push(cant+' task'+(cant===1?'':'s')+' the student cannot yet do: problem behavior under them says as much about the skill as about escape; the recommendation will be to teach or to change the materials.');
  if(miss)notes.push(miss+' task'+(miss===1?'':'s')+' with inventory columns still blank; the recommendations use them.');
  const sessions=T.length*nPer(),mins=sessions*sessLen();
  el.innerHTML='<div class="verdict '+(easy>=2&&hard?'v-ok':'v-mid')+'"><b>'+T.length+' task'+(T.length===1?'':'s')+' listed · '+easy+' rated easy (1 or 2), '+hard+' rated hard (4 or 5).</b> At '+nPer()+' session'+(nPer()===1?'':'s')+' of '+sessLen()+' minutes per task the assessment is '+sessions+' sessions, about '+mins+' minutes of session time plus breaks.</div>'+
    (notes.length?'<ul class="reclist">'+notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>':'');
}

/* ---------------- sessions ---------------- */
const taskOpts=(r,i,f,val,label)=>'<select data-r="'+r+'" data-i="'+i+'" data-f="'+f+'" aria-label="'+esc(label)+'"><option value=""></option>'+S.tasks.map((t,k)=>'<option value="'+k+'"'+(String(k)===String(val)?' selected':'')+'>'+(k+1)+' · '+esc(t.name||('Task '+(k+1)))+'</option>').join('')+'</select>';
function sessCalc(r){const g=num(r.given),c=num(r.comp),m=num(r.min),p=num(r.pb),l=num(r.lat),has=g!=null||p!=null||l!=null;
  return{has,comp:g!=null&&g>0&&c!=null?Math.max(0,Math.min(100,c/g*100)):null,rate:m!=null&&m>0&&p!=null?p/m:null,lat:l!=null?l:(m!=null&&m>0&&has&&!(p>0)?m*60:null),hadPb:(p!=null&&p>0)||l!=null,aff:num(r.aff)};}
function renderSess(){
  $('#sessTbl tbody').innerHTML=S.sess.map((r,i)=>{const c=sessCalc(r);
    return `<tr><td class="num">${i+1}</td><td>${taskOpts('sess',i,'t',r.t,'Task, session '+(i+1))}</td>
    <td><input data-r="sess" data-i="${i}" data-f="date" value="${esc(r.date)}"></td>
    <td><input data-r="sess" data-i="${i}" data-f="min" value="${esc(r.min)}" style="text-align:center"></td>
    <td><input data-r="sess" data-i="${i}" data-f="given" value="${esc(r.given)}" style="text-align:center"></td>
    <td><input data-r="sess" data-i="${i}" data-f="comp" value="${esc(r.comp)}" style="text-align:center"></td>
    <td class="num">${pct(c.comp)}</td>
    <td><input data-r="sess" data-i="${i}" data-f="lat" value="${esc(r.lat)}" style="text-align:center" placeholder="none"></td>
    <td><input data-r="sess" data-i="${i}" data-f="pb" value="${esc(r.pb)}" style="text-align:center"></td>
    <td class="num">${f1(c.rate)}</td>
    <td>${selV('sess',i,'aff',AFF.map((a,k)=>[k?String(k):'',a]),r.aff,'Affect, session '+(i+1))}</td>
    <td><input data-r="sess" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('sess',i,'session')}</tr>`;}).join('');
  const n=S.sess.length;$('#orderHint').textContent=n?n+' session'+(n===1?'':'s')+' · '+S.sess.filter(s=>num(s.given)!=null||num(s.pb)!=null||s.lat).length+' with data':'';
}
function updateSessRow(i){const tr=$('#sessTbl tbody').rows[i];if(!tr)return;const c=sessCalc(S.sess[i]);tr.children[6].textContent=pct(c.comp);tr.children[9].textContent=f1(c.rate);}
function renderProbes(){
  $('#probeTbl tbody').innerHTML=S.probes.map((r,i)=>`<tr><td class="num">${i+1}</td><td>${taskOpts('probes',i,'a',r.a,'Task A, probe '+(i+1))}</td><td>${taskOpts('probes',i,'b',r.b,'Task B, probe '+(i+1))}</td>
    <td>${selV('probes',i,'pick',[['',''],['a','Task A'],['b','Task B'],['none','Neither']],r.pick,'Picked, probe '+(i+1))}</td><td><input data-r="probes" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('probes',i,'probe')}</tr>`).join('');
}

/* ---------------- computation ---------------- */
function stats(){
  const n=S.tasks.length;const out=S.tasks.map((t,i)=>({i,t,name:taskName(i),n:0,comp:null,lat:null,rate:null,aff:null,pbN:0,offered:0,picked:0,cls:'',feat:[]}));
  S.tasks.forEach((t,i)=>{const ss=S.sess.filter(s=>String(s.t)===String(i)).map(sessCalc).filter(x=>x.has);const o=out[i];
    o.n=ss.length;if(!ss.length)return;o.comp=mean(ss.map(x=>x.comp));o.lat=mean(ss.map(x=>x.lat));o.rate=mean(ss.map(x=>x.rate));o.aff=mean(ss.map(x=>x.aff));o.pbN=ss.filter(x=>x.hadPb).length;
    const pbShare=o.pbN/ss.length;
    if(pbShare>=0.5||(o.comp!=null&&o.comp<=40))o.cls='low';else if(pbShare<=0.25&&o.comp!=null&&o.comp>=80)o.cls='high';else o.cls='mixed';});
  S.probes.forEach(p=>{const a=out[+p.a],b=out[+p.b];if(p.a!==''&&a){a.offered++;if(p.pick==='a')a.picked++;}if(p.b!==''&&b){b.offered++;if(p.pick==='b')b.picked++;}});
  out.forEach(o=>{const t=o.t,f=[];if(/Above/.test(t.diff))f.push('above skills');if(/Not yet/.test(t.cando))f.push('cannot yet do');if(/With help/.test(t.cando))f.push('needs help');if(/Novel/.test(t.nov))f.push('novel');if(t.effort==='High')f.push('high effort');if(num(t.len)!=null&&num(t.len)>=15)f.push(num(t.len)+' min long');if(/physical/.test(t.prompt))f.push('physical guidance');o.feat=f;});
  const ranked=out.filter(o=>o.n>0).sort((a,b)=>((b.rate??-1)-(a.rate??-1))||((a.lat??1e9)-(b.lat??1e9))||((a.comp??101)-(b.comp??101)));
  ranked.forEach((o,k)=>{o.rank=k+1;});
  return{all:out,ranked};
}
function recommend(R){
  const L=sessLen()*60,low=R.ranked.filter(o=>o.cls==='low'),high=R.ranked.filter(o=>o.cls==='high'),mixed=R.ranked.filter(o=>o.cls==='mixed');
  const rec={fa:[],fade:[],mods:[],flags:[],verdict:null};
  if(!R.ranked.length){rec.verdict=['mid','No sessions yet.','Enter sessions on the Assessment sheet; the ranking and the recommendations appear here.'];return rec;}
  const top=R.ranked[0],bot=R.ranked[R.ranked.length-1];
  const spread=top.rate!=null&&bot.rate!=null&&((bot.rate===0&&top.rate>0)||(bot.rate>0&&top.rate>=2*bot.rate));
  if(!low.length)rec.verdict=['no','Undifferentiated: no task qualified as a low-probability demand.','Problem behavior did not reach half of the sessions for any task and compliance stayed above 40%. Before running a demand condition with these tasks, try longer sessions, faster pacing or the classroom presentation, or check whether the behavior is escape from something other than these demands (Smith et al., 1995).'];
  else if(spread)rec.verdict=['ok','Differentiated: '+esc(top.name)+' evoked the most problem behavior ('+f1(top.rate)+' per minute, mean latency '+f0(top.lat)+' s); '+esc(bot.name)+' the least ('+f1(bot.rate)+' per minute).',low.length+' low-probability and '+high.length+' high-probability demand'+(high.length===1?'':'s')+' identified.'];
  else rec.verdict=['mid','Weak differentiation: '+low.length+' low-probability demand'+(low.length===1?'':'s')+', but the top task’s rate is less than twice the bottom task’s.','Add sessions for the tasks that are close in rank, or widen the set with an easier task, before the ranking is used for fading.'];
  rec.fa=low.slice(0,3);
  if(high.length)rec.fade=high.slice().reverse().concat(mixed.slice().reverse());
  else{rec.fade=R.ranked.slice(-1);rec.fadeNote='No task met the high-probability criterion. Start fading from no demands at all (Pace et al., 1993) and bring '+esc(bot.name)+' in first, as the least evocative task.';}
  rec.terminal=low.slice().reverse();
  low.concat(mixed).forEach(o=>{const t=o.t,m=[];
    if(/Above/.test(t.diff)||/Not yet/.test(t.cando))m.push('Easier materials or prerequisite teaching: the task is '+(/Above/.test(t.diff)?'above the student’s skills':'one the student cannot yet do')+' (Weeks & Gaylord-Ross, 1981; Carr & Durand, 1985). Teach a request for help alongside.');
    if(o.lat!=null&&o.lat>=L/2&&o.pbN>0)m.push('Shorten the task and schedule breaks: problem behavior arrived at a mean of '+f0(o.lat)+' s, in the second half of the session. Set the work period below that latency and give a break on a time schedule, then thin (Smith et al., 1995; Vollmer, Marcus & Ringdahl, 1995).');
    if(o.lat!=null&&o.lat<L/4&&o.pbN>0)m.push('Choice and interspersal: problem behavior arrived within '+f0(o.lat)+' s on average, so the onset of the demand is the problem. Offer a choice of which task or which part first (Dyer, Dunlap & Winterling, 1990) and precede it with a run of high-probability demands'+(high.length?' ('+high.map(h=>esc(h.name)).join(', ')+')':'')+' (Mace et al., 1988; Horner et al., 1991).');
    if(/Novel/.test(t.nov))m.push('Pre-teach and familiarize: the task is novel; run it first without the demand to respond, then with a familiar format (Smith et al., 1995).');
    if(t.effort==='High')m.push('Reduce the response effort: fewer items per page, a different response mode (pointing, a device, dictation), or the task split into parts (Kern et al., 1994).');
    if(t.effort==='Low'&&/^(Below|At) skills/.test(t.diff)&&t.cando==='Yes'&&o.cls==='low')m.push('Change how it is presented or prompted: the task is low effort and within the student’s skills yet still evokes the behavior, so look at the instruction itself, the prompt type and the materials present (Fisher et al., 1998; McComas et al., 2000). Compare the task under a different presentation before treating it as aversive in itself.');
    if(num(t.len)!=null&&num(t.len)>=15&&!m.some(x=>/Shorten/.test(x)))m.push('Shorten the usual block: the task normally runs '+num(t.len)+' minutes; the sessions here were '+sessLen()+'. Expect more behavior at the classroom length, and set the first fading step well below it.');
    if(o.offered&&o.picked/o.offered>=0.5)m.push('Keep it as a choice option: the student picked it in '+o.picked+' of '+o.offered+' probes, so it is less aversive than its rank suggests when the student controls the order.');
    if(!m.length)m.push('No feature on the inventory explains it: compare it under a shorter block, with a choice, and with easy requests interspersed, one change at a time (Dunlap et al., 1991).');
    rec.mods.push({o,m});});
  R.ranked.forEach(o=>{const r=num(o.t.rating);if(r==null)return;if(r>=4&&o.cls==='high')rec.flags.push(esc(o.name)+': rated '+r+' by the informants but came out high-probability in the sessions. Check whether the classroom version differs (length, group, who presents).');if(r<=2&&o.cls==='low')rec.flags.push(esc(o.name)+': rated '+r+' but came out low-probability. The informants may be seeing the task after the student has been taught to tolerate it, or the session format changed it.');});
  return rec;
}

/* ---------------- results ---------------- */
function renderResults(){
  const R=stats(),rec=recommend(R),M=$('#resMetrics'),V=$('#resVerdict'),TB=$('#rankTbl tbody'),O=$('#recOut');
  const nS=S.sess.filter(s=>s.t!==''&&sessCalc(s).has).length,top=R.ranked[0],bot=R.ranked[R.ranked.length-1];
  M.innerHTML=`<div class="metric"><b>Tasks assessed</b><div class="val">${R.ranked.length}</div><div class="sub">of ${S.tasks.filter(t=>t.name).length} on the inventory</div></div>
    <div class="metric"><b>Sessions</b><div class="val">${nS}</div><div class="sub">${S.probes.length} choice probe${S.probes.length===1?'':'s'}</div></div>
    <div class="metric"><b>Most evocative</b><div class="val" style="font-size:16px">${top?esc(top.name):'—'}</div><div class="sub">${top?f1(top.rate)+' per min · latency '+f0(top.lat)+' s':''}</div></div>
    <div class="metric"><b>Least evocative</b><div class="val" style="font-size:16px">${bot?esc(bot.name):'—'}</div><div class="sub">${bot?f1(bot.rate)+' per min · compliance '+pct(bot.comp):''}</div></div>`;
  V.innerHTML='<div class="verdict v-'+rec.verdict[0]+'"><b>'+rec.verdict[1]+'</b> '+rec.verdict[2]+'</div>';
  const clsName={low:'Low-probability demand',high:'High-probability demand',mixed:'Mixed'};
  TB.innerHTML=R.ranked.map(o=>`<tr class="${o.cls==='low'?'top':o.cls==='high'?'hp':''}"><td class="num">${o.rank}</td><td>${esc(o.name)}</td><td class="num">${f1(o.rate)}</td><td class="num">${f0(o.lat)}</td><td class="num">${o.pbN} of ${o.n}</td><td class="num">${pct(o.comp)}</td><td class="num">${o.aff==null?'—':(Math.round(o.aff*10)/10).toFixed(1)}</td><td class="num">${o.offered?o.picked+' of '+o.offered:'—'}</td><td class="num">${esc(o.t.rating||'—')}</td><td>${clsName[o.cls]||''}</td><td>${esc(o.feat.join(', '))}</td></tr>`).join('')+
    R.all.filter(o=>!o.n&&o.t.name).map(o=>`<tr><td class="num">—</td><td>${esc(o.name)}</td><td class="num" colspan="9">no sessions</td></tr>`).join('');
  if(!R.ranked.length){O.innerHTML='';drawChart(R);return;}
  let h='<div class="recbox"><h4>1. Tasks for the demand condition of Form EA-1</h4>';
  h+=rec.fa.length?'<ul class="reclist">'+rec.fa.map(o=>'<li><b>'+esc(o.name)+'</b>: '+f1(o.rate)+' per minute, mean latency '+f0(o.lat)+' s, problem behavior in '+o.pbN+' of '+o.n+' sessions, compliance '+pct(o.comp)+'.</li>').join('')+'</ul><p class="hint">Use these in the demand condition with the pacing, prompting and consequence used here, so the condition tests escape from demands the student does escape from (Roscoe et al., 2009; Call et al., 2009). If more than one is listed, run the condition with the first, or rotate them across sessions and note which was used.</p>':'<p class="hint">None. No task met the low-probability criterion; see the verdict above.</p>';
  h+='</div><div class="recbox"><h4>2. Starting tasks for demand fading (Form TD-1)</h4>';
  h+=rec.fadeNote?'<p class="hint">'+rec.fadeNote+'</p>':'';
  h+='<ul class="reclist">'+rec.fade.map((o,k)=>'<li>Step '+(k+1)+': <b>'+esc(o.name)+'</b> ('+clsName[o.cls].toLowerCase()+'; '+f1(o.rate)+' per minute, compliance '+pct(o.comp)+')</li>').join('')+(rec.terminal.length?'<li>Terminal steps, in order: '+rec.terminal.map(o=>'<b>'+esc(o.name)+'</b>').join(', ')+', each introduced in a short block with the modifications below, and the step held until problem behavior stays low (Pace et al., 1993; Zarcone et al., 1994).</li>':'')+'</ul>';
  h+='<p class="hint">The high-probability demands are also the interspersal set: a run of them before a hard request, or mixed through a hard task (Mace et al., 1988; Horner et al., 1991).</p></div>';
  h+='<div class="recbox"><h4>3. Candidate antecedent modifications, task by task</h4>'+rec.mods.map(x=>'<p style="margin:6px 0 2px;font-family:var(--sans);font-size:12.5px"><b>'+esc(x.o.name)+'</b> (rank '+x.o.rank+', '+clsName[x.o.cls].toLowerCase()+')</p><ul class="reclist">'+x.m.map(m=>'<li>'+m+'</li>').join('')+'</ul>').join('')+'</div>';
  if(rec.flags.length)h+='<div class="recbox"><h4>4. Where the informants and the data disagree</h4><ul class="reclist">'+rec.flags.map(f=>'<li>'+f+'</li>').join('')+'</ul></div>';
  O.innerHTML=h;drawChart(R);
}
async function draftPlan(){
  const R=stats(),rec=recommend(R);if(!R.ranked.length){alert('There are no sessions yet; nothing to draft from.');return;}
  if(S.meta.plan&&!(await nbhUI.confirm('Replace the plan text with a fresh draft?\nThe plan text already written is replaced by a draft from the results.',{ok:'Replace'})))return;
  const strip=s=>String(s).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&rsquo;|’/g,"'");
  const L=[];L.push('Demand assessment, '+(S.meta.client||'student')+(S.meta.dates?', sessions '+S.meta.dates:'')+'. '+R.ranked.length+' tasks, '+S.sess.filter(s=>s.t!=='').length+' sessions of '+sessLen()+' min. Verdict: '+strip(rec.verdict[1]));
  L.push('Demand condition (EA-1): '+(rec.fa.length?rec.fa.map(o=>strip(o.name)).join('; '):'no task qualified; see the Results sheet')+'.');
  L.push('Demand fading (TD-1): start with '+rec.fade.map(o=>strip(o.name)).join(', then ')+(rec.terminal.length?'; terminal steps '+rec.terminal.map(o=>strip(o.name)).join(', then ')+'. Hold each step until problem behavior stays low across sessions (working convention: three consecutive sessions at or below 0.2 per minute) before the next step.':'.'));
  rec.mods.forEach(x=>L.push(strip(x.o.name)+': '+x.m.map(strip).join(' ')));
  if(rec.flags.length)L.push('Informant disagreement: '+rec.flags.map(strip).join(' '));
  if(S.probes.length)L.push('Choice probes: '+R.ranked.filter(o=>o.offered).map(o=>strip(o.name)+' chosen '+o.picked+' of '+o.offered).join('; ')+'.');
  S.meta.plan=L.join('\n\n');bindMeta();
}
function drawChart(R){
  const mode=S.meta.chart||'rate',W=900,H=340,Lm=56,Rg=20,T=22,B=72;const ranked=R.ranked;
  let s='<defs><pattern id="daHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#C8701F"/><line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-width="2.2"/></pattern></defs><rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#fff"/>';
  const label=mode==='rate'?'Mean problem behavior per minute':mode==='lat'?'Mean latency to the first problem behavior (s)':'Mean compliance (%)';
  if(!ranked.length){s+='<text x="'+(W/2)+'" y="'+(H/2)+'" font-size="13" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">No sessions yet</text>';$('#daChart').innerHTML=s;return;}
  const vals=ranked.map(o=>mode==='rate'?o.rate:mode==='lat'?o.lat:o.comp);
  let max=mode==='comp'?100:Math.max(0.5,...vals.map(v=>v||0));if(mode==='lat')max=Math.max(sessLen()*60,...vals.map(v=>v||0));
  const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p;};if(mode==='rate')max=nice(max);
  const n=ranked.length,bw=Math.min(70,(W-Lm-Rg)/n*0.62),X=i=>Lm+(i+0.5)*(W-Lm-Rg)/n,Y=v=>T+(H-T-B)*(1-v/max);
  const ticks=5;for(let k=0;k<=ticks;k++){const v=max*k/ticks;s+='<line x1="'+Lm+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-Rg)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e3e8ea"/><text x="'+(Lm-6)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(mode==='rate'?(Math.round(v*100)/100):Math.round(v))+'</text>';}
  s+='<line x1="'+Lm+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+Lm+'" y1="'+T+'" x2="'+Lm+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  ranked.forEach((o,i)=>{const v=vals[i];if(v==null)return;const x=X(i)-bw/2,y=Y(v),h=Y(0)-y;const col=o.cls==='low'?'#1F5FA8':o.cls==='high'?'url(#daHatch)':'#B9C3CB';   /* v21.36: blue, hatched orange, grey: told apart in grayscale and by every observer */
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,h).toFixed(1)+'" fill="'+col+'" rx="2"><title>'+esc(o.name)+': '+(mode==='rate'?f1(v)+' per min':mode==='lat'?f0(v)+' s':pct(v))+'</title></rect>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(y-5).toFixed(1)+'" font-size="11" text-anchor="middle" fill="#333" font-family="system-ui,sans-serif">'+(mode==='rate'?f1(v):mode==='lat'?f0(v):pct(v))+'</text>';
    const cw=Math.max(12,Math.floor((W-Lm-Rg)/n/6.2)),lines=[];String(o.name).split(/\s+/).forEach(w=>{if(lines.length&&(lines[lines.length-1]+' '+w).length<=cw)lines[lines.length-1]+=' '+w;else lines.push(w);});if(lines.length>3){lines.length=3;lines[2]=lines[2].slice(0,cw-1)+'…';}
    lines.forEach((ln,k)=>{s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(0)+15+13*k)+'" font-size="11" text-anchor="middle" fill="#333" font-family="system-ui,sans-serif">'+esc(ln)+'</text>';});});
  s+='<text x="'+((Lm+W-Rg)/2)+'" y="'+(H-8)+'" font-size="11.5" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+label+' by task, in rank order · blue: low-probability demand · orange, hatched: high-probability demand · grey: mixed</text>';
  $('#daChart').innerHTML=s;
}

/* ---------------- events ---------------- */
let resT=0;function renderResultsSoon(){clearTimeout(resT);resT=setTimeout(()=>{renderMeans();renderResults();},200);}
function renderMeans(){const R=stats();
  $('#meanTbl tbody').innerHTML=R.all.filter(o=>o.t.name||o.n).map(o=>`<tr><td class="num">${o.i+1}</td><td>${esc(o.name)}</td><td class="num">${o.n}</td><td class="num">${pct(o.comp)}</td><td class="num">${f0(o.lat)}</td><td class="num">${o.n?o.pbN+' of '+o.n:'—'}</td><td class="num">${f1(o.rate)}</td><td class="num">${o.aff==null?'—':(Math.round(o.aff*10)/10).toFixed(1)}</td></tr>`).join('');}
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='sess')updateSessRow(+el.dataset.i);
    if(el.dataset.r==='tasks'&&el.dataset.f==='name'){$$('#sessTbl select[data-f="t"],#probeTbl select[data-f="a"],#probeTbl select[data-f="b"]').forEach(s=>{const o=s.options[+el.dataset.i+1];if(o)o.textContent=(+el.dataset.i+1)+' · '+(el.value||('Task '+(+el.dataset.i+1)));});}
    renderResultsSoon();if(el.dataset.r==='tasks')renderInv();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(el.dataset.m==='len'||el.dataset.m==='nper')renderInv();if(el.dataset.m==='len')renderResultsSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;if(el.dataset.r==='tasks')renderInv();renderResultsSoon();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(el.dataset.m==='chart')drawChart(stats());if(el.dataset.m==='len'||el.dataset.m==='nper')renderInv();}
});
$('#addTask').addEventListener('click',()=>{if(S.tasks.length>=12)return;S.tasks.push(newTask());renderTasks();renderSess();renderProbes();renderInv();renderResultsSoon();});
$('#delTask').addEventListener('click',async ()=>{if(S.tasks.length<=1)return;const i=S.tasks.length-1,used=S.sess.some(s=>String(s.t)===String(i))||S.probes.some(p=>String(p.a)===String(i)||String(p.b)===String(i));
  if((S.tasks[i].name||used)&&!(await nbhUI.confirm('Remove the last task?'+(used?'\nThe sessions and choice probes that use it are deleted with it.':''),{ok:'Remove',danger:true})))return;
  S.tasks.pop();S.sess=S.sess.filter(s=>String(s.t)!==String(i));S.probes=S.probes.filter(p=>String(p.a)!==String(i)&&String(p.b)!==String(i));renderTasks();renderSess();renderProbes();renderInv();renderResultsSoon();});
$('#genOrder').addEventListener('click',async ()=>{const T=S.tasks.map((t,i)=>i).filter(i=>S.tasks[i].name);if(T.length<2){alert('Name at least two tasks on the Inventory sheet first.');return;}
  if(S.sess.length&&!(await nbhUI.confirm('Add '+(T.length*nPer())+' sessions?\nThey are added in alternating order after the existing sessions.',{ok:'Add'})))return;
  let prev=S.sess.length?S.sess[S.sess.length-1].t:null;
  for(let b=0;b<nPer();b++){const blockArr=T.slice();for(let k=blockArr.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[blockArr[k],blockArr[j]]=[blockArr[j],blockArr[k]];}
    if(String(blockArr[0])===String(prev)&&blockArr.length>1)[blockArr[0],blockArr[1]]=[blockArr[1],blockArr[0]];
    blockArr.forEach(i=>{S.sess.push(newSess(i));prev=String(i);});}
  renderSess();renderResultsSoon();});
$('#addSess').addEventListener('click',()=>{if(S.sess.length>=200)return;S.sess.push(newSess(null));renderSess();});
$('#delSess').addEventListener('click',async ()=>{if(!S.sess.length)return;const r=S.sess[S.sess.length-1];if((r.given||r.pb||r.lat)&&!(await nbhUI.confirm('Remove the last session?\nIts task, date and scores are deleted.',{ok:'Remove',danger:true})))return;S.sess.pop();renderSess();renderResultsSoon();});
$('#addProbe').addEventListener('click',()=>{if(S.probes.length>=60)return;S.probes.push(newProbe());renderProbes();});
$('#delProbe').addEventListener('click',()=>{if(!S.probes.length)return;S.probes.pop();renderProbes();renderResultsSoon();});
$('#draftPlan').addEventListener('click',draftPlan);
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  if(r==='tasks'){const ns=S.sess.filter(s=>String(s.t)===String(i)).length,np=S.probes.filter(p=>String(p.a)===String(i)||String(p.b)===String(i)).length;
    const has=Object.keys(row).some(k=>row[k]);
    if((has||ns||np)&&!(await nbhUI.confirm('Delete this task?'+(ns||np?'\nThe '+[ns?ns+' session'+(ns===1?'':'s'):'',np?np+' choice probe'+(np===1?'':'s'):''].filter(Boolean).join(' and ')+' that use it will be deleted too; later tasks are renumbered.':''),{ok:'Delete',danger:true})))return;
    S.tasks.splice(i,1);const rk=v=>v===''?'':String(+v>i?+v-1:+v);
    S.sess=S.sess.filter(s=>String(s.t)!==String(i));S.sess.forEach(s=>{s.t=rk(s.t);});
    S.probes=S.probes.filter(p=>String(p.a)!==String(i)&&String(p.b)!==String(i));S.probes.forEach(p=>{p.a=rk(p.a);p.b=rk(p.b);});
    if(!S.tasks.length)S.tasks.push(newTask());renderTasks();renderSess();renderProbes();renderInv();renderMeans();renderResults();}
  else if(r==='sess'){if((row.t!==''||row.date||row.given||row.comp||row.lat||row.pb||row.aff||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe session it holds is deleted.',{ok:'Delete',danger:true})))return;S.sess.splice(i,1);renderSess();renderMeans();renderResults();}
  else if(r==='probes'){if((row.a!==''||row.b!==''||row.pick||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe choice probe it holds is deleted.',{ok:'Delete',danger:true})))return;S.probes.splice(i,1);renderProbes();renderMeans();renderResults();}
}
$('#daPngBtn').addEventListener('click',()=>svgToPng($('#daChart'),graphFile('DA-1',S.meta.client)));

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});if($('#chartSel')&&!S.meta.chart)$('#chartSel').value='rate';}
function renderAll(){ensure();bindMeta();renderTasks();renderInv();renderSess();renderProbes();renderMeans();renderResults();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'DA-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`DA-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='DA-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={};fields.forEach(f=>{r[f]=str(x&&x[f]);});return r;}):[];
  o.tasks=arr('tasks',['name','where','len','effort','diff','nov','prompt','pres','cando','rating','note'],12);
  o.sess=arr('sess',['t','date','min','given','comp','lat','pb','aff','note'],200);
  o.probes=arr('probes',['a','b','pick','note'],60);
  const ok=v=>v===''||(/^\d+$/.test(v)&&+v<o.tasks.length);
  o.sess=o.sess.filter(x=>ok(x.t));o.probes=o.probes.filter(x=>ok(x.a)&&ok(x.b)).map(x=>{if(!['','a','b','none'].includes(x.pick))x.pick='';return x;});
  if(!['','rate','lat','comp'].includes(o.meta.chart))o.meta.chart='';
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='DA-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved DA-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form DA-1. Nothing was changed.':'That file could not be read as a saved DA-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved DA-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Session','Task #','Task','Date','Minutes','Instructions given','Complied','Compliance %','Latency to first PB (s)','PB count','PB per min','Affect (1 to 5)','Note']];
  S.sess.forEach((r,i)=>{const c=sessCalc(r);out.push([i+1,r.t===''?'':+r.t+1,r.t===''?'':taskName(+r.t),r.date,r.min,r.given,r.comp,c.comp==null?'':c.comp.toFixed(1),r.lat,r.pb,c.rate==null?'':c.rate.toFixed(3),r.aff,r.note]);});
  out.push([]);out.push(['Task #','Task','Sessions','Mean compliance %','Mean latency (s)','Sessions with PB','Mean PB per min','Mean affect','Chosen','Offered','Class','Rank']);
  const R=stats();R.all.filter(o=>o.t.name||o.n).forEach(o=>out.push([o.i+1,o.name,o.n,o.comp==null?'':o.comp.toFixed(1),o.lat==null?'':o.lat.toFixed(0),o.pbN,o.rate==null?'':o.rate.toFixed(3),o.aff==null?'':o.aff.toFixed(2),o.picked,o.offered,o.cls,o.rank||'']));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='DA-1_sessions.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('inventory');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated demand assessment?\nEvery sheet is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const w=x.getDay();return w===0||w===6;};
  const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);},D=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate();};
  S=blank();
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'3',setting:'Resource room, one-to-one at a table, with the classroom teacher presenting',target:'Aggression (hitting, kicking or pushing an adult) and throwing materials; Form TB-1 definition',
    hyp:'Escape from academic demands; IA-1 and OB-1 both point to written work in math and language arts, with recess and specials clear',informants:'Ms. R. (classroom teacher); Mr. D. (paraeducator); parent by phone',runner:'J. Newsome (BCBA) recording; Ms. R. presenting the tasks',
    bcba:'Joshua Newsome, M.A., BCBA',date:Y(6),dates:Y(3)+' and '+Y(2),len:'5',nper:'3',pace:'Next instruction as soon as the last is completed or prompted through',prompt:'Three-step: vocal, then model, then physical guidance, about 5 seconds apart',
    conseq:'Brief escape: materials removed for 30 seconds, then the task resumes (the demand-condition contingency)',compdef:'The step is started within 5 seconds of the vocal instruction or the model, before physical guidance',chart:'rate',
    decision:'EA-1 scheduled for next week with the subtraction worksheet in the demand condition; TD-1 to open with fading from the sorting and clean-up tasks',notes:'Session 7 (reading aloud) stopped at 4 minutes under the CR-1 rule; the minutes are entered as run. Mr. D. rated the worksheet a 3; Ms. R. a 5; the 5 is entered.'};
  S.tasks=[
    {name:'Subtraction worksheet with regrouping',where:'Classroom, 10:00 math block',len:'20',effort:'High',diff:'Above skills',nov:'Familiar',prompt:'Vocal, model, physical',pres:'Page handed over',cando:'With help',rating:'5',note:'The worst block of the day by both informants; 20 problems on a page'},
    {name:'Copying sentences (handwriting)',where:'Classroom, 9:15 language arts',len:'15',effort:'High',diff:'At skills',nov:'Familiar',prompt:'Vocal, model',pres:'Page handed over',cando:'Yes',rating:'4',note:'Slow and effortful; grips the pencil hard'},
    {name:'Reading aloud to the teacher',where:'Resource room, 11:00',len:'10',effort:'Medium',diff:'Above skills',nov:'Occasional',prompt:'Vocal only',pres:'One-to-one at a table',cando:'With help',rating:'4',note:'Reads a year below grade; refuses with peers present'},
    {name:'Listening comprehension questions',where:'Classroom, after the read-aloud',len:'8',effort:'Low',diff:'At skills',nov:'Familiar',prompt:'Vocal only',pres:'One-to-one at a table',cando:'Yes',rating:'4',note:'Answers aloud; no writing. Rated hard because it follows the read-aloud'},
    {name:'Clean-up and putting materials away',where:'Every transition',len:'3',effort:'Low',diff:'Below skills',nov:'Familiar',prompt:'Vocal only',pres:'Materials placed',cando:'Yes',rating:'2',note:'Done most days; grumbles'},
    {name:'Sorting and matching on the tablet',where:'Centers, 1:30',len:'10',effort:'Low',diff:'Below skills',nov:'Familiar',prompt:'Written or visual',pres:'On a device',cando:'Yes',rating:'1',note:'Asks for it; the preferred center'}];
  /* [task, min, given, complied, latency, pb, affect] in alternating order over two mornings */
  const rows=[[5,5,12,12,'',0,5],[0,5,10,2,40,6,1],[4,5,10,9,'',0,4],[1,5,9,5,130,3,2],[3,5,10,8,'',0,4],[2,4,8,3,75,4,1],
    [0,5,10,3,55,7,1],[3,5,10,9,'',0,4],[5,5,12,12,'',0,5],[2,5,9,4,110,3,2],[4,5,10,10,'',0,4],[1,5,10,4,165,2,2],
    [2,5,9,3,60,5,1],[4,5,10,8,240,1,3],[1,5,9,5,95,4,2],[5,5,12,11,'',0,5],[0,5,10,2,30,6,1],[3,5,10,9,'',0,4]];
  S.sess=rows.map((r,i)=>({t:String(r[0]),date:D(i<9?3:2),min:String(r[1]),given:String(r[2]),comp:String(r[3]),lat:r[4]===''?'':String(r[4]),pb:String(r[5]),aff:String(r[6]),note:i===5?'Stopped at 4 min under the CR-1 rule':i===7?'Looked away for the last minute':''}));
  const probes=[[0,5,'b'],[1,4,'b'],[2,3,'b'],[0,1,'b'],[4,5,'b'],[1,3,'b'],[0,2,'b'],[2,4,'b'],[3,5,'b'],[1,2,'a']];
  S.probes=probes.map((p,i)=>({a:String(p[0]),b:String(p[1]),pick:p[2],note:i===9?'Took the pencil before Ms. R. finished asking':''}));
  S.meta.plan='';
  renderAll();draftPlan();setView('results');
  nbhUI.toast('Simulation loaded: '+'a simulated assessment of six tasks from a third-grader’s schedule, three 5-minute sessions each.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. The target behavior line takes the first behavior from Form TB-1 with its
   definition, and the hypothesis line the summary statement from Form FS-1. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const b=(f.behaviors||[])[0];
  if(!m.target&&b){m.target=nbhCase.line(b,true);n++;}
  if(!m.hyp&&f.fn&&(f.fn.label||f.fn.key)){m.hyp=(f.fn.statements&&f.fn.statements[0])||f.fn.label;n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;
  if(sel.behaviors.length){m.target=sel.behaviors.map(b=>nbhCase.line(b,true)).join('; ');n++;}
  if(sel.fn){m.hyp=(sel.fn.statements&&sel.fn.statements[0])||sel.fn.label;n++;}
  renderAll();return {filled:n};
};
