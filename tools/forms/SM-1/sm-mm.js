/* ===== Form SM-1 (v21.66, v21.67): Match the model (sm-mm.js) =====
   A quality standard the student can see: two to four pictures of the finished work at each level (the clean table, the
   half-clean table, the table not done), each with a name, points, what makes it that level and a checklist. The student does
   the task, looks at the work and at the pictures, and picks the one the work looks like (a self-evaluation of a permanent
   product); the teacher picks without seeing the student's choice; when the two match the student earns the bonus and the best
   reward (the matching contingency of Rhode, Morgan & Young, 1983, applied to the quality of a product), one apart the points
   stand without the bonus, far apart the two look at the pictures together. The teacher's checks are thinned as the matches
   hold (the Teach & fade page's ladder).
   (v21.67) A file holds several tasks (S.mm.tasks, S.mm.at the one shown): each task its pictures, rule, record and sheet; a
   v21.66 file with one task opens as the first. Each task also holds rating practice (prac): pictures of other work, each
   tagged with the level it shows (and the trial photos the teacher rated), from which ten questions are drawn; the student
   picks the model each one is like, sees the answer, and the score goes to the practice record, with "9 of 10" as the
   criterion before the student rates the real work.
   The pictures show lowest to best, left to right, numbered 1..n, so the number a student circles is the level's points by
   default; lv[0] stays the best in the data. Per task: task, n, lv (name, pts, desc, chk, icon, img), first, check, move,
   bonus, close, far, rw, photo, log (date, s and t as level places, 0 the best, t -1 when not checked, pts, kind, reward,
   note, a photo of the work), cur (the trial in progress on the iPad), prac (items: img, icon, lv; log: date, right, n).
   The printed sheet (#mmOut) prints alone with Print the model sheet (body.sm-mm-only), one task or every task. */
const MM_NAMES={2:['Like the model','Not yet'],3:['Like the model','Almost','Not yet'],4:['Like the model','Almost','Not yet','Not started']};
const MM_PRAC_N=10,MM_PRAC_CRIT=9;
function mmCur(){return {s:-1,t:-1,ls:false,lt:false,skip:false,img:''};}
function mmBlankLv(n,i){return {name:(MM_NAMES[n]||MM_NAMES[3])[i]||('Level '+(i+1)),pts:n-i,desc:'',chk:'',icon:'',img:''};}
function mmBlankTask(){return {task:'',n:3,lv:[0,1,2].map(i=>mmBlankLv(3,i)),first:'student',check:'all',move:'4 of the last 5 match',bonus:1,close:'self',far:'none',rw:{match:'',close:'',far:''},photo:true,log:[],cur:mmCur(),prac:{items:[],log:[]}};}
function mmBlank(){return {tasks:[mmBlankTask()],at:0};}
function mmT(){const m=S.mm;return m.tasks[m.at]||m.tasks[0];}
const MM_OK_IMG=v=>typeof v==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';
function mmEnsure(){let m=S.mm;if(!m||typeof m!=='object'||Array.isArray(m))m=S.mm=mmBlank();
  if(!Array.isArray(m.tasks)){const one=(m.task!==undefined||m.lv!==undefined)?Object.assign({},m):null;m=S.mm={tasks:one?[one]:[mmBlankTask()],at:0};}   /* a v21.66 file held one task */
  m.tasks=m.tasks.filter(t=>t&&typeof t==='object').slice(0,12);if(!m.tasks.length)m.tasks.push(mmBlankTask());m.at=Math.min(m.tasks.length-1,Math.max(0,Math.round(+m.at)||0));
  m.tasks.forEach(mmEnsureTask);}
function mmEnsureTask(t){const str=v=>v==null||typeof v==='object'?'':String(v);
  t.task=str(t.task);t.n=Math.min(4,Math.max(2,Math.round(+t.n)||3));if(!Array.isArray(t.lv))t.lv=[];
  t.lv=t.lv.slice(0,t.n).map((l,i)=>Object.assign(mmBlankLv(t.n,i),l&&typeof l==='object'?l:{}));while(t.lv.length<t.n)t.lv.push(mmBlankLv(t.n,t.lv.length));
  t.lv.forEach(l=>{l.name=str(l.name);l.pts=Math.max(0,Math.min(99,Math.round(+l.pts)||0));l.desc=str(l.desc);l.chk=str(l.chk);l.icon=str(l.icon);l.img=MM_OK_IMG(l.img);if(l.icon&&!(window.NBH_PICTOS&&NBH_PICTOS[l.icon]))l.icon='';});
  t.first=t.first==='teacher'?'teacher':'student';t.check=['all','half','third','spot'].includes(t.check)?t.check:'all';t.move=str(t.move);
  t.bonus=Math.max(0,Math.min(10,Math.round(+t.bonus)||0));t.close=['self','teach','none'].includes(t.close)?t.close:'self';t.far=t.far==='teach'?'teach':'none';
  if(!t.rw||typeof t.rw!=='object')t.rw={};t.rw={match:str(t.rw.match),close:str(t.rw.close),far:str(t.rw.far)};t.photo=t.photo!==false&&t.photo!=='0'&&t.photo!==0;
  if(!Array.isArray(t.log))t.log=[];const lvN=i=>{i=Math.round(+i);return i>=0&&i<t.n?i:-1;};
  t.log=t.log.filter(r=>r&&typeof r==='object').slice(0,400).map(r=>({d:str(r.d).slice(0,10),s:lvN(r.s),t:lvN(r.t),rw:str(r.rw),note:str(r.note),img:MM_OK_IMG(r.img)}));
  t.log.forEach(r=>{const p=mmPts(r.s,r.t,t);r.pts=p?p.pts:0;r.kind=p?p.kind:'';});
  if(!t.cur||typeof t.cur!=='object')t.cur=mmCur();const c=t.cur;c.s=lvN(c.s);c.t=lvN(c.t);c.ls=!!c.ls&&c.s>=0;c.lt=!!c.lt&&c.t>=0;c.skip=!!c.skip;c.img=MM_OK_IMG(c.img);
  if(!t.prac||typeof t.prac!=='object')t.prac={};if(!Array.isArray(t.prac.items))t.prac.items=[];if(!Array.isArray(t.prac.log))t.prac.log=[];
  t.prac.items=t.prac.items.filter(p=>p&&typeof p==='object').slice(0,40).map(p=>({img:MM_OK_IMG(p.img),icon:(p.icon&&window.NBH_PICTOS&&NBH_PICTOS[p.icon])?String(p.icon):'',lv:lvN(p.lv)<0?t.n-1:lvN(p.lv)})).filter(p=>p.img||p.icon);
  t.prac.log=t.prac.log.filter(r=>r&&typeof r==='object').slice(0,200).map(r=>({d:str(r.d).slice(0,10),right:Math.max(0,Math.min(99,Math.round(+r.right)||0)),n:Math.max(1,Math.min(99,Math.round(+r.n)||MM_PRAC_N))}));}
function mmFromFile(x){return x&&typeof x==='object'&&!Array.isArray(x)?JSON.parse(JSON.stringify(x)):null;}   /* mmEnsure cleans it */
/* the display order: lowest first, numbered 1..n; the number of a level */
function mmOrder(t){const n=(t||mmT()).n;return Array.from({length:n},(_,k)=>n-1-k);}
function mmNum(i,t){return (t||mmT()).n-i;}
/* the points of a trial: the student's place s and the teacher's t (0 the best; -1 not rated) */
function mmPts(s,t,tk){const m=tk||mmT(),lv=m.lv,ok=i=>i>=0&&i<lv.length;if(!ok(s)&&!ok(t))return null;if(!ok(t))return {pts:lv[s].pts,kind:'unchecked'};if(!ok(s))return {pts:lv[t].pts,kind:'teacher'};
  const d=Math.abs(s-t);if(d===0)return {pts:lv[t].pts+m.bonus,kind:'match'};if(d===1)return {pts:m.close==='self'?lv[s].pts:m.close==='teach'?lv[t].pts:0,kind:'close'};return {pts:m.far==='teach'?lv[t].pts:0,kind:'far'};}
const MM_KIND={match:'Match',close:'One apart',far:'Far apart',unchecked:'Not checked',teacher:'Teacher only'};
function mmName(){try{const n=typeof smName==='function'?String(smName()||'').trim():'';if(n)return n;}catch(e){}return String(S.meta.nick||S.meta.client||'').trim()||'You';}
function mmLvName(i,t){const l=(t||mmT()).lv[i];return l?l.name||('Level '+(i+1)):'—';}
function mmTaskName(t,k){return String(t.task||'').trim()||('Task '+(k+1));}
function mmISO(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function mmPicOf(l,cls){const p=pic(l,cls||'mm-im');return p||'';}
function mmRewardOf(kind,t){const m=t||mmT();return kind==='match'?(m.rw.match||'the best reward'):kind==='close'?(m.rw.close||'praise for an honest rating'):kind==='far'?(m.rw.far||'look at the pictures together'):'';}
/* ---- the tasks ---- */
function mmRenderTasks(){const sel=$('#mmTaskSel');if(!sel)return;const m=S.mm;sel.innerHTML=m.tasks.map((t,k)=>'<option value="'+k+'"'+(k===m.at?' selected':'')+'>'+(k+1)+'. '+esc(mmTaskName(t,k))+'</option>').join('');const d=$('#mmTaskDel');if(d)d.disabled=m.tasks.length<2;}
function mmSwitch(k){const m=S.mm;if(k<0||k>=m.tasks.length)return;m.at=k;MM_RUN=null;mmRender();}
/* ---- the editors ---- */
function mmBind(){const m=mmT();$$('.only-mm [data-mm]').forEach(el=>{const k=el.dataset.mm;let v=k.indexOf('rw.')===0?m.rw[k.slice(3)]:m[k];if(k==='photo')v=m.photo?'1':'0';el.value=v==null?'':String(v);});}
function mmRenderLevels(){const el=$('#mmLevels');if(!el)return;const m=mmT();
  el.innerHTML=mmOrder().map(i=>{const l=m.lv[i];return '<div class="mm-lv"><div class="mm-lvh"><b>Picture '+mmNum(i)+'</b> · '+(i===0?'the model, the best':i===m.n-1?'the lowest':'in between')+'</div><div class="mm-pic">'+(mmPicOf(l)||'<span class="mm-noimg">no picture yet</span>')+'</div>'+
    '<div class="mm-row noprint"><button type="button" class="tool" data-mmpick="'+i+'">'+(l.img||l.icon?'Change the picture':'Choose a picture')+'</button></div>'+
    '<label>Name<input data-mml="name" data-i="'+i+'" value="'+esc(l.name)+'"></label><label>Points<input type="number" min="0" max="99" data-mml="pts" data-i="'+i+'" value="'+l.pts+'"></label>'+
    '<label>What makes it this level<textarea rows="2" data-mml="desc" data-i="'+i+'" placeholder="'+(i===0?'no crumbs, no spills, chairs pushed in':i===m.n-1?'crumbs and spills left, chairs out':'wiped, but crumbs in the corners')+'">'+esc(l.desc)+'</textarea></label>'+
    '<label>Checklist under the picture (one line each)<textarea rows="2" data-mml="chk" data-i="'+i+'" placeholder="'+(i===0?'wiped the whole top\nno crumbs on the floor\nchairs pushed in':'')+'">'+esc(l.chk)+'</textarea></label></div>';}).join('');}
/* ---- rating on the iPad: the first rater picks and locks (hidden), the second picks, then the result ---- */
function mmTile(who,i,on,t){const m=t||mmT(),l=m.lv[i];return '<button type="button" class="mm-tile'+(on?' on':'')+'" data-mm'+who+'="'+i+'" aria-pressed="'+(on?'true':'false')+'"><span class="mm-tnum">'+mmNum(i,m)+'</span>'+(mmPicOf(l,'mm-im')||'<span class="mm-noimg">'+mmNum(i,m)+'</span>')+'<b>'+esc(l.name||('Level '+(i+1)))+'</b><span class="mm-tpts">'+l.pts+' point'+(l.pts===1?'':'s')+'</span></button>';}
function mmStage(){const m=mmT(),c=m.cur,first=m.first==='teacher'?'t':'s',second=first==='s'?'t':'s';const done=k=>k==='s'?c.ls:(c.lt||c.skip);return !done(first)?first:!done(second)?second:'done';}
function mmResultHtml(r,s,t){const m=mmT(),name=mmName(),lv=m.lv;if(!r)return '';
  if(r.kind==='match')return '<div class="mm-result match"><b>Match!</b> Both picked <i>'+esc(mmLvName(t))+'</i>: '+lv[t].pts+(m.bonus?' + '+m.bonus+' bonus':'')+' = <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>. Reward: '+esc(mmRewardOf('match'))+'.</div>';
  if(r.kind==='close')return '<div class="mm-result close"><b>One apart.</b> '+esc(name)+' picked <i>'+esc(mmLvName(s))+'</i>; the teacher picked <i>'+esc(mmLvName(t))+'</i>. '+(m.close==='self'?esc(name)+'’s points stand':m.close==='teach'?'The teacher’s points count':'No points this time')+': <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>, no bonus. '+esc(mmRewardOf('close'))+'.</div>';
  if(r.kind==='far')return '<div class="mm-result far"><b>Far apart.</b> '+esc(name)+' picked <i>'+esc(mmLvName(s))+'</i>; the teacher picked <i>'+esc(mmLvName(t))+'</i>. '+(m.far==='teach'?'The teacher’s points count':'No points this time')+': <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>. '+esc(mmRewardOf('far'))+'.</div>';
  if(r.kind==='unchecked')return '<div class="mm-result"><b>Not checked this time.</b> '+esc(name)+'’s rating counts: <i>'+esc(mmLvName(s))+'</i>, <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>.</div>';
  return '<div class="mm-result"><b>The teacher’s rating:</b> <i>'+esc(mmLvName(t))+'</i>, <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>.</div>';}
function mmRenderRate(){const el=$('#mmRate');if(!el)return;const m=mmT(),c=m.cur,name=mmName();
  if(!m.task.trim()&&!m.lv.some(l=>l.img||l.icon)){el.innerHTML='<div class="smr-empty">Name the task and give the models their pictures above; the student then rates here.</div>';return;}
  const st=mmStage();let h='<div class="mm-q"><b>'+esc(m.task||'The task')+'</b>'+(c.img?'<img class="mm-work" src="'+c.img+'" alt="The work">':'')+(m.photo?'<button type="button" class="smr-b" id="mmPhotoBtn">'+(c.img?'Another photo':'Photo of the work')+'</button>':'')+'</div>';
  if(st==='s')h+='<p class="mm-ask">'+esc(name)+', which picture looks like your work?</p><div class="mm-tiles">'+mmOrder().map(i=>mmTile('s',i,c.s===i)).join('')+'</div>'+(c.s>=0?'<div class="tools"><button type="button" class="smr-b pri" id="mmLockS">That one ✓'+(m.first==='student'?' (hide it; the teacher’s turn)':'')+'</button></div>':'');
  else if(st==='t')h+='<p class="mm-ask">'+(m.first==='student'?esc(name)+' has rated (hidden). ':'')+'Teacher: which picture does the work look like?</p><div class="mm-tiles">'+mmOrder().map(i=>mmTile('t',i,c.t===i)).join('')+'</div><div class="tools">'+(c.t>=0?'<button type="button" class="smr-b pri" id="mmLockT">That one ✓'+(m.first==='teacher'?' (hidden; now '+esc(name)+')':'')+'</button>':'')+(m.first==='student'?'<button type="button" class="smr-b" id="mmSkip">Not checking this time ('+esc(name)+'’s rating counts)</button>':'')+'</div>';
  else{const t=c.skip?-1:c.t,r=mmPts(c.s,t);h+='<div class="mm-both">'+(c.s>=0?'<div><span>'+esc(name)+' picked</span>'+mmTile('x',c.s,true)+'</div>':'')+(t>=0?'<div><span>The teacher picked</span>'+mmTile('x',t,true)+'</div>':'')+'</div>'+mmResultHtml(r,c.s,t)+'<div class="tools"><button type="button" class="smr-b pri" id="mmSave">Save this trial</button><button type="button" class="smr-b" id="mmReset">Start over</button></div>';}
  if(st!=='done')h+='<div class="tools"><button type="button" class="smr-b" id="mmReset">Start over</button></div>';
  el.innerHTML=h;}
/* ---- rating practice: which model is this work like? ---- */
let MM_RUN=null;
function mmPracItems(t){t=t||mmT();const out=t.prac.items.map((p,i)=>({img:p.img,icon:p.icon,lv:p.lv,src:'practice',i}));t.log.forEach((r,i)=>{if(r.img&&r.t>=0)out.push({img:r.img,icon:'',lv:r.t,src:'trial',i});});return out;}
function mmPracReady(t){t=t||mmT();const last=t.prac.log[t.prac.log.length-1];return !!(last&&last.right/last.n>=MM_PRAC_CRIT/MM_PRAC_N);}
function mmPracStart(){const t=mmT(),items=mmPracItems(t);if(!items.length)return false;const q=[];let pool=[];
  for(let k=0;k<MM_PRAC_N;k++){if(!pool.length)pool=items.slice().sort(()=>Math.random()-.5);q.push(pool.pop());}
  MM_RUN={q,k:0,right:0,ans:-1,saved:false};mmRenderPrac();return true;}
function mmRenderPrac(){const el=$('#mmPrac');if(!el)return;const t=mmT(),name=mmName(),items=t.prac.items,all=mmPracItems(t),ready=mmPracReady(t);
  let h='<p class="hint">Pictures of other work, each tagged with the model it is like (the teacher rates them when adding them); the trial photos the teacher rated join in. '+esc(name)+' is shown '+MM_PRAC_N+' of them in turn and picks the model each is like; '+MM_PRAC_CRIT+' of '+MM_PRAC_N+' right is the criterion before rating the real work.</p>';
  h+='<div class="mm-pracitems">'+items.map((p,i)=>'<div class="mm-pi"><div class="mm-pipic">'+(mmPicOf(p,'mm-im')||'')+'</div><select data-mmplv="'+i+'" aria-label="The model this picture is like">'+mmOrder(t).map(l=>'<option value="'+l+'"'+(p.lv===l?' selected':'')+'>'+mmNum(l,t)+' '+esc(mmLvName(l,t))+'</option>').join('')+'</select><button type="button" class="x" data-mmpx="'+i+'" title="Remove this practice picture">×</button></div>').join('')+
    '<div class="mm-pi mm-piadd"><button type="button" class="tool" id="mmPracAdd">Add a practice picture</button><span class="hint">'+(all.length?all.length+' picture'+(all.length===1?'':'s')+' to practice with'+(all.length<items.length+1?'':(all.length-items.length?', '+(all.length-items.length)+' from the trials':'')):'none yet')+'</span></div></div>';
  const R=MM_RUN;
  if(R&&R.q.length){const q=R.q[R.k];
    if(R.k>=R.q.length){h+='<div class="mm-result'+(R.right>=MM_PRAC_CRIT?' match':' close')+'"><b>'+R.right+' of '+R.q.length+' right.</b> '+(R.right>=MM_PRAC_CRIT?esc(name)+' is ready to rate the real work.':'Practice again before the real work; look at the pictures that were missed together.')+'</div><div class="tools">'+(R.saved?'<span class="hint">Saved to the practice record.</span>':'<button type="button" class="smr-b pri" id="mmPracSave">Save to the practice record</button>')+'<button type="button" class="smr-b" id="mmPracStart">Practice again</button></div>';}
    else{h+='<div class="mm-prq"><div class="mm-prleft"><div class="mm-prn">Picture '+(R.k+1)+' of '+R.q.length+'</div><div class="mm-prpic">'+(mmPicOf(q,'mm-im')||'')+'</div></div><div class="mm-prright"><p class="mm-ask">'+esc(name)+', which model is this one like?</p><div class="mm-tiles">'+mmOrder(t).map(i=>mmTile('p',i,R.ans===i,t)).join('')+'</div>'+
      (R.ans>=0?'<div class="mm-result'+(R.ans===q.lv?' match':' far')+'">'+(R.ans===q.lv?'<b>Right!</b> It is like picture '+mmNum(q.lv,t)+', <i>'+esc(mmLvName(q.lv,t))+'</i>.':'<b>Not that one.</b> It is like picture '+mmNum(q.lv,t)+', <i>'+esc(mmLvName(q.lv,t))+'</i>. Look at the two together.')+'</div><div class="tools"><button type="button" class="smr-b pri" id="mmPracNext">'+(R.k+1<R.q.length?'Next picture':'See the score')+'</button></div>':'')+'</div></div>';}}
  else h+='<div class="tools"><button type="button" class="smr-b pri" id="mmPracStart"'+(all.length?'':' disabled')+'>Start the practice ('+MM_PRAC_N+' pictures)</button><span class="hint">'+(ready?'The last practice met the criterion: '+esc(name)+' is ready to rate the real work.':t.prac.log.length?'The last practice was '+t.prac.log[t.prac.log.length-1].right+' of '+t.prac.log[t.prac.log.length-1].n+': practice again before the real work.':'No practice yet.')+'</span></div>';
  if(t.prac.log.length)h+='<table class="rt mm-praclog"><thead><tr><th style="width:30%">Date</th><th style="width:30%">Right</th><th>Ready?</th><th class="nx noprint"></th></tr></thead><tbody>'+t.prac.log.map((r,i)=>'<tr><td>'+esc(r.d)+'</td><td>'+r.right+' of '+r.n+'</td><td>'+(r.right/r.n>=MM_PRAC_CRIT/MM_PRAC_N?'<span class="tag ok">yes</span>':'<span class="tag na">not yet</span>')+'</td><td class="nx noprint"><button type="button" class="x" data-mmpdel="'+i+'" title="Remove this practice">×</button></td></tr>').join('')+'</tbody></table>';
  el.innerHTML=h;}
/* ---- the record ---- */
function mmChecked(t){return (t||mmT()).log.filter(r=>r.t>=0&&r.s>=0);}
function mmSuggest(){const m=mmT(),ch=mmChecked(m),last=ch.slice(-5),mt=last.filter(r=>r.s===r.t).length;
  if(ch.length<5)return ch.length+' checked trial'+(ch.length===1?'':'s')+' so far: keep checking every time until five are in.';
  const far=ch.slice(-3).filter(r=>Math.abs(r.s-r.t)>=2).length;if(far>=2)return 'Two of the last three checks were far apart: check every time, and practice rating with the pictures before the next task (Teach & fade).';
  if(mt>=4)return mt+' of the last 5 matched: '+({all:'move the checks to every other time.',half:'move the checks to one time in three, unannounced.',third:'move to surprise checks only.',spot:'the rating stands on its own; keep an occasional surprise check.'}[m.check]);
  return mt+' of the last 5 matched: keep the checks as they are'+(mt<=2?', and praise honest ratings as warmly as high ones':'')+'.';}
function mmRenderLog(){const m=mmT(),tb=$('#mmLog'),met=$('#mmMetrics'),sg=$('#mmSuggest');if(!tb)return;const L=m.log,ch=mmChecked(m),mt=ch.filter(r=>r.s===r.t).length,pts=L.reduce((a,r)=>a+(r.pts||0),0);
  const opt=(v,t)=>'<option value="'+v+'"'+(String(v)===String(t)?' selected':'')+'>';const lvo=(sel,none)=>'<option value="-1"'+(sel<0?' selected':'')+'>'+none+'</option>'+mmOrder().map(i=>opt(i,sel)+mmNum(i)+' '+esc(m.lv[i].name||('Level '+mmNum(i)))+'</option>').join('');
  tb.innerHTML='<thead><tr><th style="width:4%">#</th><th style="width:12%">Date</th><th style="width:13%">'+esc(mmName())+' picked</th><th style="width:13%">Teacher picked</th><th style="width:9%">Result</th><th style="width:7%">Points</th><th style="width:16%">Reward</th><th>Note</th><th style="width:7%">Photo</th><th class="nx noprint"></th></tr></thead><tbody>'+
    (L.length?L.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><input type="date" data-mmr="d" data-i="'+i+'" value="'+esc(r.d)+'"></td><td><select data-mmr="s" data-i="'+i+'">'+lvo(r.s,'—')+'</select></td><td><select data-mmr="t" data-i="'+i+'">'+lvo(r.t,'not checked')+'</select></td>'+
      '<td><span class="tag '+(r.kind==='match'?'ok':r.kind==='close'?'mid':r.kind==='far'?'no':'na')+'">'+(MM_KIND[r.kind]||'—')+'</span></td><td class="num">'+r.pts+'</td><td><input data-mmr="rw" data-i="'+i+'" value="'+esc(r.rw)+'"></td><td><input data-mmr="note" data-i="'+i+'" value="'+esc(r.note)+'"></td>'+
      '<td>'+(r.img?'<img class="mm-thumb" src="'+r.img+'" alt="The work">':'')+'</td><td class="nx noprint"><button type="button" class="x" data-mmdel="'+i+'" title="Remove this trial">×</button></td></tr>').join(''):'<tr><td colspan="10" class="empty2">No trials yet. Rate on the iPad above, or add a row by hand from the paper sheet.</td></tr>')+'</tbody>';
  if(met)met.innerHTML=[['Trials',L.length],['Checked by the teacher',ch.length],['Matches',ch.length?mt+' of '+ch.length+' ('+Math.round(100*mt/ch.length)+'%)':'—'],['Last five checked',ch.length?ch.slice(-5).filter(r=>r.s===r.t).length+' of '+Math.min(5,ch.length)+' matched':'—'],['Points earned',pts],['At the best level (teacher)',ch.length?ch.filter(r=>r.t===0).length+' of '+ch.length:'—']].map(x=>'<div class="metric"><div class="k">'+x[0]+'</div><div class="v">'+x[1]+'</div></div>').join('');
  if(sg)sg.innerHTML=L.length?'<p class="hint mm-sug"><b>Checks:</b> '+esc(mmSuggest())+'</p>':'';mmPlot();}
function mmPlot(){const svg=$('#mmPlot');if(!svg)return;const m=mmT(),L=m.log,n=m.n;if(!L.length){svg.innerHTML='';return;}
  const W=900,H=260,x0=70,x1=880,y0=28,y1=214,xs=i=>L.length===1?(x0+x1)/2:x0+i*(x1-x0)/(L.length-1),ys=l=>y0+l*(y1-y0)/(n-1);let h='';
  for(let l=0;l<n;l++)h+='<line x1="'+x0+'" y1="'+ys(l)+'" x2="'+x1+'" y2="'+ys(l)+'" stroke="#dde3e6"/><text x="'+(x0-8)+'" y="'+(ys(l)+4)+'" text-anchor="end" font-size="11" fill="#4a5560">'+esc(m.lv[l].name||('Level '+(l+1)))+'</text>';
  const tp=L.map((r,i)=>r.t>=0?xs(i)+','+ys(r.t):null).filter(Boolean);if(tp.length>1)h+='<polyline points="'+tp.join(' ')+'" fill="none" stroke="#1d4a77" stroke-width="2"/>';
  L.forEach((r,i)=>{const x=xs(i);if(r.t>=0)h+='<circle cx="'+x+'" cy="'+ys(r.t)+'" r="6" fill="#1d4a77"/>';if(r.s>=0)h+='<rect x="'+(x-6)+'" y="'+(ys(r.s)-6)+'" width="12" height="12" fill="none" stroke="#b9672d" stroke-width="2"/>';
    if(r.kind==='match')h+='<text x="'+x+'" y="'+(y1+22)+'" text-anchor="middle" font-size="13" fill="#2f6b37">✓</text>';else if(r.kind==='far')h+='<text x="'+x+'" y="'+(y1+22)+'" text-anchor="middle" font-size="13" fill="#8a2b2b">×</text>';
    h+='<text x="'+x+'" y="'+(y1+40)+'" text-anchor="middle" font-size="10" fill="#4a5560">'+(i+1)+'</text>';});
  h+='<text x="'+x0+'" y="16" font-size="11" fill="#4a5560">Teacher: filled dots and line. '+esc(mmName())+': hollow squares. Under the trial: ✓ a match, × far apart.</text>';svg.innerHTML=h;}
/* ---- the printed sheet, one task; every task for Print every task ---- */
function mmSheetHtml(m){const name=mmName(),rows=8;const chk=l=>String(l.chk||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
  return '<div class="mm-sheet'+(m.n===4?' mm-four':'')+'"><div class="mm-shead"><div><b class="mm-title">Does it look like the model?</b><div class="mm-task">'+esc(m.task||'The task')+'</div></div><div class="mm-meta">'+esc(name)+' &nbsp;&middot;&nbsp; Date: ______________</div></div>'+
    '<div class="mm-models">'+mmOrder(m).map(i=>{const l=m.lv[i];return '<div class="mm-model"><div class="mm-mnum">'+mmNum(i,m)+'</div><div class="mm-mpic">'+(mmPicOf(l,'mm-mim')||'<span class="mm-noimg">picture</span>')+'</div><div class="mm-mname">'+esc(l.name||('Level '+(i+1)))+'</div><div class="mm-mpts">'+l.pts+' point'+(l.pts===1?'':'s')+'</div>'+(l.desc?'<div class="mm-mdesc">'+esc(l.desc)+'</div>':'')+(chk(l).length?'<div class="mm-mchk">'+chk(l).map(x=>'<div>☐ '+esc(x)+'</div>').join('')+'</div>':'')+'</div>';}).join('')+'</div>'+
    '<div class="mm-rule"><b>The rule.</b> First I pick the picture my work looks like. Then the teacher picks. <b>We match</b> → my points'+(m.bonus?' + '+m.bonus+' bonus':'')+' and '+esc(m.rw.match||'the best reward')+'. <b>One apart</b> → '+(m.close==='self'?'my points, no bonus':m.close==='teach'?'the teacher’s points, no bonus':'no points this time')+(m.rw.close?'; '+esc(m.rw.close):'')+'. <b>Far apart</b> → '+(m.far==='teach'?'the teacher’s points':'no points')+'; '+esc(m.rw.far||'we look at the pictures together')+'. An honest <i>'+esc(mmLvName(m.n-1,m))+'</i> that matches still earns the bonus.</div>'+
    '<table class="mm-grid"><thead><tr><th class="mm-gd">Date</th><th>I think it looks like</th><th>The teacher thinks</th><th class="mm-gm">Match?</th><th class="mm-gp">Points</th><th>Reward / note</th></tr></thead><tbody>'+
    Array.from({length:rows},()=>'<tr><td class="mm-gd"></td><td class="mm-gc">'+mmOrder(m).map(i=>'<span class="mm-circ">'+mmNum(i,m)+'</span>').join('')+'</td><td class="mm-gc">'+mmOrder(m).map(i=>'<span class="mm-circ">'+mmNum(i,m)+'</span>').join('')+'</td><td class="mm-gm">☐ yes &nbsp;☐ no</td><td></td><td></td></tr>').join('')+'</tbody></table>'+
    '<div class="mm-sfoot">Circle the number of the picture your work looks like; the number is the points. Rate your own work first, before the teacher does; the teacher’s checks happen '+({all:'every time',half:'every other time',third:'one time in three',spot:'now and then, as a surprise'}[m.check])+'. Form SM-1, Match the model.</div></div>';}
function mmRenderSheet(all){const el=$('#mmOut');if(!el)return;el.innerHTML=all?S.mm.tasks.map(t=>'<div class="mm-sheetpage">'+mmSheetHtml(t)+'</div>').join(''):mmSheetHtml(mmT());}
function mmRender(){mmEnsure();mmRenderTasks();mmBind();mmRenderLevels();mmRenderRate();mmRenderPrac();mmRenderLog();mmRenderSheet();}
function mmAfter(){mmRenderTasks();mmRenderRate();mmRenderPrac();mmRenderLog();mmRenderSheet();}
function mmOrient(all){return (all?S.mm.tasks.some(t=>t.n===4):mmT().n===4)?'landscape':'portrait';}
function mmPrint(all){mmRenderSheet(all);const back=()=>{window.removeEventListener('afterprint',back);mmRenderSheet();};if(all)window.addEventListener('afterprint',back);printAlone('sm-mm-only',mmOrient(all));}
function mmCsv(){const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';const out=[['Task','Trial','Date','Student','Teacher','Result','Points','Reward','Note']];
  S.mm.tasks.forEach((t,k)=>t.log.forEach((r,i)=>out.push([mmTaskName(t,k),i+1,r.d,r.s>=0?mmLvName(r.s,t):'',r.t>=0?mmLvName(r.t,t):'not checked',MM_KIND[r.kind]||'',r.pts,r.rw,r.note])));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SM-1_match-the-model.csv';document.body.appendChild(a);a.click();a.remove();}
/* ---- events ---- */
(function(){const sec=document.querySelector('.only-mm');if(!sec)return;
  sec.addEventListener('input',e=>{const t=e.target;if(!t.dataset)return;const m=mmT();
    if(t.dataset.mm){const k=t.dataset.mm;if(k==='n'){const n=Math.min(4,Math.max(2,+t.value||3));m.n=n;m.lv=m.lv.slice(0,n);while(m.lv.length<n)m.lv.push(mmBlankLv(n,m.lv.length));mmEnsure();mmRenderLevels();mmAfter();return;}
      if(k.indexOf('rw.')===0)m.rw[k.slice(3)]=t.value;else if(k==='bonus')m.bonus=Math.max(0,Math.min(10,Math.round(+t.value)||0));else if(k==='photo')m.photo=t.value!=='0';else m[k]=t.value;
      if(k==='bonus'||k==='close'||k==='far')mmEnsure();if(k==='task'){mmRenderTasks();mmRenderRate();mmRenderSheet();return;}mmAfter();return;}
    if(t.dataset.mml){const l=m.lv[+t.dataset.i];if(!l)return;const f=t.dataset.mml;l[f]=f==='pts'?Math.max(0,Math.min(99,Math.round(+t.value)||0)):t.value;if(f==='pts')mmEnsure();mmAfter();return;}
    if(t.dataset.mmr){const r=m.log[+t.dataset.i];if(!r)return;const f=t.dataset.mmr;r[f]=f==='s'||f==='t'?+t.value:t.value;if(f==='s'||f==='t'){const p=mmPts(r.s,r.t);r.pts=p?p.pts:0;r.kind=p?p.kind:'';if(f==='t'&&!r.rw)r.rw=mmRewardOf(r.kind);mmRenderLog();}return;}
    if(t.dataset.mmplv!=null){const p=m.prac.items[+t.dataset.mmplv];if(p)p.lv=+t.value;return;}});
  sec.addEventListener('change',e=>{if(e.target.id==='mmTaskSel')mmSwitch(+e.target.value);});
  sec.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const m=mmT(),c=m.cur;
    if(b.id==='mmTaskAdd'){if(S.mm.tasks.length>=12)return;S.mm.tasks.push(mmBlankTask());mmSwitch(S.mm.tasks.length-1);return;}
    if(b.id==='mmTaskDel'){if(S.mm.tasks.length<2)return;const k=S.mm.at,t=S.mm.tasks[k];if((t.task||t.log.length||t.lv.some(l=>l.img||l.icon))&&window.nbhUI&&nbhUI.confirm&&!(await nbhUI.confirm('Remove the task “'+mmTaskName(t,k)+'” with its pictures and its '+t.log.length+' trial'+(t.log.length===1?'':'s')+'?',{ok:'Remove',danger:true})))return;S.mm.tasks.splice(k,1);mmSwitch(Math.max(0,k-1));return;}
    if(b.dataset.mmpick!=null){const i=+b.dataset.mmpick;openPick(m.lv,i,()=>{mmRenderLevels();mmAfter();},480);return;}
    if(b.dataset.mms!=null){c.s=c.s===+b.dataset.mms?-1:+b.dataset.mms;mmRenderRate();return;}
    if(b.dataset.mmt!=null){c.t=c.t===+b.dataset.mmt?-1:+b.dataset.mmt;mmRenderRate();return;}
    if(b.id==='mmLockS'){if(c.s>=0)c.ls=true;mmRenderRate();return;}
    if(b.id==='mmLockT'){if(c.t>=0)c.lt=true;mmRenderRate();return;}
    if(b.id==='mmSkip'){c.skip=true;c.t=-1;mmRenderRate();return;}
    if(b.id==='mmReset'){m.cur=mmCur();mmRenderRate();return;}
    if(b.id==='mmPhotoBtn'){$('#mmPhotoIn').click();return;}
    if(b.id==='mmSave'){const t=c.skip?-1:c.t,p=mmPts(c.s,t);if(!p)return;m.log.push({d:mmISO(),s:c.s,t,pts:p.pts,kind:p.kind,rw:mmRewardOf(p.kind),note:'',img:c.img});m.cur=mmCur();mmAfter();
      if(window.nbhUI&&nbhUI.toast)nbhUI.toast((MM_KIND[p.kind]||'Rated')+': '+p.pts+' point'+(p.pts===1?'':'s')+' written to the record.',{kind:p.kind==='match'?'ok':undefined});return;}
    if(b.id==='mmAdd'){m.log.push({d:mmISO(),s:-1,t:-1,pts:0,kind:'',rw:'',note:'',img:''});mmRenderLog();return;}
    if(b.dataset.mmdel!=null){const i=+b.dataset.mmdel,r=m.log[i];if(!r)return;if(window.nbhUI&&nbhUI.confirm&&!(await nbhUI.confirm('Remove trial '+(i+1)+' from the record?',{ok:'Remove',danger:true})))return;m.log.splice(i,1);mmRenderLog();mmRenderPrac();return;}
    /* the practice */
    if(b.id==='mmPracAdd'){const it={img:'',icon:'',lv:m.n-1};m.prac.items.push(it);openPick(m.prac.items,m.prac.items.length-1,()=>{mmEnsure();mmRenderPrac();},360);return;}
    if(b.dataset.mmpx!=null){m.prac.items.splice(+b.dataset.mmpx,1);mmRenderPrac();return;}
    if(b.id==='mmPracStart'){mmPracStart();return;}
    if(b.dataset.mmp!=null){const R=MM_RUN;if(!R||R.k>=R.q.length||R.ans>=0)return;R.ans=+b.dataset.mmp;if(R.ans===R.q[R.k].lv)R.right++;mmRenderPrac();return;}
    if(b.id==='mmPracNext'){const R=MM_RUN;if(!R||R.ans<0)return;R.k++;R.ans=-1;mmRenderPrac();return;}
    if(b.id==='mmPracSave'){const R=MM_RUN;if(!R||R.k<R.q.length||R.saved)return;m.prac.log.push({d:mmISO(),right:R.right,n:R.q.length});R.saved=true;mmRenderPrac();if(window.nbhUI&&nbhUI.toast)nbhUI.toast('Practice: '+R.right+' of '+R.q.length+' right, written to the practice record.',{kind:R.right>=MM_PRAC_CRIT?'ok':undefined});return;}
    if(b.dataset.mmpdel!=null){m.prac.log.splice(+b.dataset.mmpdel,1);mmRenderPrac();return;}
    if(b.id==='mmCsv'){mmCsv();return;}
    if(b.id==='mmPrint'){mmPrint(false);return;}
    if(b.id==='mmPrintAll'){mmPrint(true);return;}});
  const pin=$('#mmPhotoIn');if(pin)pin.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();
    r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,360/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);mmT().cur.img=c.toDataURL('image/jpeg',0.8);mmRenderRate();};im.src=r.result;};r.readAsDataURL(f);});
  const pb=$('#mmPrintBtn');if(pb)pb.addEventListener('click',()=>mmPrint(false));
})();
/* the simulation's pictures: a drawn lunch table or backpack at each level (no photograph of a real room travels with the form) */
function mmDrawExample(level,seed0){try{const W=480,H=360,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#e9e2d6';x.fillRect(0,0,W,H);x.fillStyle='#d6cbb8';x.fillRect(0,H*0.62,W,H*0.38);   /* wall and floor */
  x.fillStyle='#8a5a3c';x.fillRect(60,120,360,120);x.fillStyle='#6d4530';x.fillRect(60,240,360,14);x.fillRect(80,254,16,80);x.fillRect(384,254,16,80);   /* the table */
  const chair=(cx,out)=>{x.fillStyle='#3f5f8a';x.fillRect(cx,out?262:200,54,out?60:28);x.fillStyle='#2e4a6e';x.fillRect(cx+4,out?322:228,8,out?26:0);x.fillRect(cx+42,out?322:228,8,out?26:0);};
  chair(140,level>=2);chair(290,level>=1);   /* a chair out from level 1, both from level 2 */
  let seed=seed0||7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  const crumbs=level===0?0:level===1?7:26;x.fillStyle='#5a3a1a';for(let i=0;i<crumbs;i++){const px=70+rnd()*340,py=126+rnd()*104;x.beginPath();x.arc(px,py,2.2+rnd()*2.2,0,Math.PI*2);x.fill();}
  if(level>=2){x.fillStyle='rgba(120,160,210,.75)';x.beginPath();x.ellipse(300,170,46,22,0.2,0,Math.PI*2);x.fill();x.fillStyle='#c9c2b4';x.fillRect(120,135,40,28);}   /* a spill and a napkin */
  if(level===1){x.fillStyle='#5a3a1a';for(let i=0;i<9;i++){x.beginPath();x.arc(66+rnd()*18,130+rnd()*100,2.5,0,Math.PI*2);x.fill();}}   /* crumbs in the corner */
  x.fillStyle='#e8e1d3';x.fillRect(190,128,100,16);x.fillStyle='#8a5a3c';if(level===0){x.fillStyle='#b4845c';x.fillRect(80,126,320,8);}   /* the wiped sheen */
  return c.toDataURL('image/jpeg',0.8);}catch(e){return '';}}
function mmDrawBackpack(level,seed0){try{const W=480,H=360,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#eef0ea';x.fillRect(0,0,W,H);x.fillStyle='#d9d4c7';x.fillRect(0,290,W,70);   /* the wall and the floor */
  const rr=(px,py,w,h,r,col)=>{x.fillStyle=col;x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();x.fill();};
  rr(150,70,180,220,34,'#2f6b8f');rr(175,150,130,110,20,'#3f82a8');rr(205,60,70,30,12,'#24536f');   /* the bag, its front pocket, the handle */
  let seed=seed0||3;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  if(level===0){x.fillStyle='#1f4559';x.fillRect(165,78,150,10);}   /* zipped shut */
  if(level>=1){x.fillStyle='#f6f1e4';for(let i=0;i<(level===1?2:5);i++){x.save();x.translate(200+rnd()*100,60+rnd()*20);x.rotate((rnd()-.5)*.8);x.fillRect(-20,-40,40,52);x.restore();}}   /* papers sticking out */
  if(level>=2){x.fillStyle='#c94b3b';x.fillRect(60,250,70,40);x.fillStyle='#e4b23a';x.beginPath();x.arc(400,275,18,0,Math.PI*2);x.fill();x.fillStyle='#f6f1e4';x.fillRect(350,230,40,55);}   /* things on the floor */
  return c.toDataURL('image/jpeg',0.8);}catch(e){return '';}}
/* the simulation's example: a lunch table with ten trials and the checks thinned once, a backpack just begun, practice pictures and scores */
function mmSim(D){const back=n=>{const d=new Date();d.setHours(12,0,0,0);while(n>0){d.setDate(d.getDate()-1);if(d.getDay()%6)n--;}return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};   /* school days back */
  const a=mmBlankTask();a.task='Clean the lunch table';a.n=3;a.lv.forEach((l,i)=>{l.img=mmDrawExample(i);});a.lv[0].desc='No crumbs on the top or the floor, no wet spots, both chairs pushed in';a.lv[0].chk='wiped the whole top\nno crumbs on the floor\nchairs pushed in';
  a.lv[1].desc='Wiped, but crumbs in the corners or one chair out';a.lv[1].chk='wiped the top\ncheck the corners\nboth chairs';a.lv[2].desc='Crumbs and spills still there';a.lv[2].chk='get the cloth\nstart with the top';
  a.check='half';a.bonus=1;a.rw.match='10 minutes of drawing (the reward store)';a.rw.close='praise for an honest rating';a.rw.far='look at the pictures together; rate again tomorrow';
  const T=[[2,2],[1,1],[1,0],[0,0],[2,0],[0,0],[1,1],[0,-1],[0,0],[0,-1]];
  T.forEach((x,i)=>{a.log.push({d:back(T.length-i),s:x[0],t:x[1],pts:0,kind:'',rw:'',note:i===4?'rushed; the teacher showed the corners':'',img:''});});
  a.prac.items=[{img:mmDrawExample(0,11),icon:'',lv:0},{img:mmDrawExample(1,23),icon:'',lv:1},{img:mmDrawExample(2,31),icon:'',lv:2},{img:mmDrawExample(1,47),icon:'',lv:1}];
  a.prac.log=[{d:back(13),right:7,n:10},{d:back(12),right:9,n:10}];
  const b=mmBlankTask();b.task='Pack the backpack';b.n=3;b.lv.forEach((l,i)=>{l.img=mmDrawBackpack(i);});b.lv[0].desc='Folder, lunch box and water bottle inside, zipped shut';b.lv[0].chk='folder in\nlunch box in\nzipped';b.lv[1].desc='Everything in, but not zipped or papers sticking out';b.lv[1].chk='push the papers in\nzip it';b.lv[2].desc='Things still on the floor';b.lv[2].chk='start with the folder';
  b.bonus=1;b.rw.match='first pick of the free-time bin';const U=[[1,1],[0,1],[0,0]];U.forEach((x,i)=>{b.log.push({d:back(U.length-i),s:x[0],t:x[1],pts:0,kind:'',rw:'',note:'',img:''});});
  S.mm={tasks:[a,b],at:0};mmEnsure();S.mm.tasks.forEach(t=>t.log.forEach(r=>{if(!r.rw)r.rw=mmRewardOf(r.kind,t);}));}
window.__mm={pts:mmPts,sim:mmSim,render:mmRender,suggest:mmSuggest,stage:mmStage,ensure:mmEnsure,t:mmT,tasks:()=>S.mm.tasks,switch:mmSwitch,prac:{start:mmPracStart,run:()=>MM_RUN,items:mmPracItems,ready:mmPracReady},print:mmPrint};
