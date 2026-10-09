/* ===== Form SM-1 (v21.66): Match the model (sm-mm.js) =====
   A quality standard the student can see: two to four pictures of the finished work at each level (the clean table, the
   half-clean table, the table not done), each with a name, points, what makes it that level and a checklist. The student does
   the task, looks at the work and at the pictures, and picks the one the work looks like (a self-evaluation of a permanent
   product); the teacher picks without seeing the student's choice; when the two match the student earns the bonus and the best
   reward (the matching contingency of Rhode, Morgan & Young, 1983, applied to the quality of a product), one apart the points
   stand without the bonus, far apart the two look at the pictures together. The teacher's checks are thinned as the matches
   hold (the Teach & fade page's ladder). Kept in S.mm: the task and the rule, the levels (lv: name, pts, desc, chk, icon,
   img), the record (log: date, s and t as level places, 0 the best, t -1 when not checked, pts, kind, reward, note, a photo
   of the work) and the trial in progress on the iPad (cur). The printed sheet (#mmOut) prints alone with Print the model
   sheet (body.sm-mm-only). */
const MM_NAMES={2:['Like the model','Not yet'],3:['Like the model','Almost','Not yet'],4:['Like the model','Almost','Not yet','Not started']};
/* the pictures show lowest to best, left to right, numbered 1..n, so the number a student circles is the level's points by default; lv[0] stays the best in the data */
function mmOrder(){const n=S.mm.n;return Array.from({length:n},(_,k)=>n-1-k);}
function mmNum(i){return S.mm.n-i;}
function mmCur(){return {s:-1,t:-1,ls:false,lt:false,skip:false,img:''};}
function mmBlankLv(n,i){return {name:(MM_NAMES[n]||MM_NAMES[3])[i]||('Level '+(i+1)),pts:n-i,desc:'',chk:'',icon:'',img:''};}
function mmBlank(){return {task:'',n:3,lv:[0,1,2].map(i=>mmBlankLv(3,i)),first:'student',check:'all',move:'4 of the last 5 match',bonus:1,close:'self',far:'none',rw:{match:'',close:'',far:''},photo:true,log:[],cur:mmCur()};}
const MM_OK_IMG=v=>typeof v==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';
function mmEnsure(){if(!S.mm||typeof S.mm!=='object'||Array.isArray(S.mm))S.mm=mmBlank();const m=S.mm,str=v=>v==null||typeof v==='object'?'':String(v);
  m.task=str(m.task);m.n=Math.min(4,Math.max(2,Math.round(+m.n)||3));if(!Array.isArray(m.lv))m.lv=[];
  m.lv=m.lv.slice(0,m.n).map((l,i)=>Object.assign(mmBlankLv(m.n,i),l&&typeof l==='object'?l:{}));while(m.lv.length<m.n)m.lv.push(mmBlankLv(m.n,m.lv.length));
  m.lv.forEach(l=>{l.name=str(l.name);l.pts=Math.max(0,Math.min(99,Math.round(+l.pts)||0));l.desc=str(l.desc);l.chk=str(l.chk);l.icon=str(l.icon);l.img=MM_OK_IMG(l.img);if(l.icon&&!(window.NBH_PICTOS&&NBH_PICTOS[l.icon]))l.icon='';});
  m.first=m.first==='teacher'?'teacher':'student';m.check=['all','half','third','spot'].includes(m.check)?m.check:'all';m.move=str(m.move);
  m.bonus=Math.max(0,Math.min(10,Math.round(+m.bonus)||0));m.close=['self','teach','none'].includes(m.close)?m.close:'self';m.far=m.far==='teach'?'teach':'none';
  if(!m.rw||typeof m.rw!=='object')m.rw={};m.rw={match:str(m.rw.match),close:str(m.rw.close),far:str(m.rw.far)};m.photo=m.photo!==false&&m.photo!=='0'&&m.photo!==0;
  if(!Array.isArray(m.log))m.log=[];const lvN=i=>{i=Math.round(+i);return i>=0&&i<m.n?i:-1;};
  m.log=m.log.filter(r=>r&&typeof r==='object').slice(0,400).map(r=>({d:str(r.d).slice(0,10),s:lvN(r.s),t:lvN(r.t),rw:str(r.rw),note:str(r.note),img:MM_OK_IMG(r.img)}));
  m.log.forEach(r=>{const p=mmPts(r.s,r.t);r.pts=p?p.pts:0;r.kind=p?p.kind:'';});
  if(!m.cur||typeof m.cur!=='object')m.cur=mmCur();const c=m.cur;c.s=lvN(c.s);c.t=lvN(c.t);c.ls=!!c.ls&&c.s>=0;c.lt=!!c.lt&&c.t>=0;c.skip=!!c.skip;c.img=MM_OK_IMG(c.img);}
function mmFromFile(x){return x&&typeof x==='object'&&!Array.isArray(x)?JSON.parse(JSON.stringify(x)):null;}   /* mmEnsure cleans it */
/* the points of a trial: the student's place s and the teacher's t (0 the best; -1 not rated) */
function mmPts(s,t){const m=S.mm,lv=m.lv,ok=i=>i>=0&&i<lv.length;if(!ok(s)&&!ok(t))return null;if(!ok(t))return {pts:lv[s].pts,kind:'unchecked'};if(!ok(s))return {pts:lv[t].pts,kind:'teacher'};
  const d=Math.abs(s-t);if(d===0)return {pts:lv[t].pts+m.bonus,kind:'match'};if(d===1)return {pts:m.close==='self'?lv[s].pts:m.close==='teach'?lv[t].pts:0,kind:'close'};return {pts:m.far==='teach'?lv[t].pts:0,kind:'far'};}
const MM_KIND={match:'Match',close:'One apart',far:'Far apart',unchecked:'Not checked',teacher:'Teacher only'};
function mmName(){try{const n=typeof smName==='function'?String(smName()||'').trim():'';if(n)return n;}catch(e){}return String(S.meta.nick||S.meta.client||'').trim()||'You';}
function mmLvName(i){const l=S.mm.lv[i];return l?l.name||('Level '+(i+1)):'—';}
function mmISO(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function mmPicOf(l,cls){const p=pic(l,cls||'mm-im');return p||'';}
function mmRewardOf(kind){const m=S.mm;return kind==='match'?(m.rw.match||'the best reward'):kind==='close'?(m.rw.close||'praise for an honest rating'):kind==='far'?(m.rw.far||'look at the pictures together'):'';}
/* ---- the editors ---- */
function mmBind(){const m=S.mm;$$('.only-mm [data-mm]').forEach(el=>{const k=el.dataset.mm;let v=k.indexOf('rw.')===0?m.rw[k.slice(3)]:m[k];if(k==='photo')v=m.photo?'1':'0';el.value=v==null?'':String(v);});}
function mmRenderLevels(){const el=$('#mmLevels');if(!el)return;const m=S.mm;
  el.innerHTML=mmOrder().map(i=>{const l=m.lv[i];return '<div class="mm-lv"><div class="mm-lvh"><b>Picture '+mmNum(i)+'</b> \u00b7 '+(i===0?'the model, the best':i===m.n-1?'the lowest':'in between')+'</div><div class="mm-pic">'+(mmPicOf(l)||'<span class="mm-noimg">no picture yet</span>')+'</div>'+
    '<div class="mm-row noprint"><button type="button" class="tool" data-mmpick="'+i+'">'+(l.img||l.icon?'Change the picture':'Choose a picture')+'</button></div>'+
    '<label>Name<input data-mml="name" data-i="'+i+'" value="'+esc(l.name)+'"></label><label>Points<input type="number" min="0" max="99" data-mml="pts" data-i="'+i+'" value="'+l.pts+'"></label>'+
    '<label>What makes it this level<textarea rows="2" data-mml="desc" data-i="'+i+'" placeholder="'+(i===0?'no crumbs, no spills, chairs pushed in':i===m.n-1?'crumbs and spills left, chairs out':'wiped, but crumbs in the corners')+'">'+esc(l.desc)+'</textarea></label>'+
    '<label>Checklist under the picture (one line each)<textarea rows="2" data-mml="chk" data-i="'+i+'" placeholder="'+(i===0?'wiped the whole top\nno crumbs on the floor\nchairs pushed in':'')+'">'+esc(l.chk)+'</textarea></label></div>';}).join('');}
/* ---- rating on the iPad: the first rater picks and locks (hidden), the second picks, then the result ---- */
function mmTile(who,i,on){const l=S.mm.lv[i];return '<button type="button" class="mm-tile'+(on?' on':'')+'" data-mm'+who+'="'+i+'" aria-pressed="'+(on?'true':'false')+'"><span class="mm-tnum">'+mmNum(i)+'</span>'+(mmPicOf(l,'mm-im')||'<span class="mm-noimg">'+mmNum(i)+'</span>')+'<b>'+esc(l.name||('Level '+(i+1)))+'</b><span class="mm-tpts">'+l.pts+' point'+(l.pts===1?'':'s')+'</span></button>';}
function mmStage(){const m=S.mm,c=m.cur,first=m.first==='teacher'?'t':'s',second=first==='s'?'t':'s';const done=k=>k==='s'?c.ls:(c.lt||c.skip);return !done(first)?first:!done(second)?second:'done';}
function mmResultHtml(r,s,t){const m=S.mm,name=mmName(),lv=m.lv;if(!r)return '';
  if(r.kind==='match')return '<div class="mm-result match"><b>Match!</b> Both picked <i>'+esc(mmLvName(t))+'</i>: '+lv[t].pts+(m.bonus?' + '+m.bonus+' bonus':'')+' = <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>. Reward: '+esc(mmRewardOf('match'))+'.</div>';
  if(r.kind==='close')return '<div class="mm-result close"><b>One apart.</b> '+esc(name)+' picked <i>'+esc(mmLvName(s))+'</i>; the teacher picked <i>'+esc(mmLvName(t))+'</i>. '+(m.close==='self'?esc(name)+'’s points stand':m.close==='teach'?'The teacher’s points count':'No points this time')+': <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>, no bonus. '+esc(mmRewardOf('close'))+'.</div>';
  if(r.kind==='far')return '<div class="mm-result far"><b>Far apart.</b> '+esc(name)+' picked <i>'+esc(mmLvName(s))+'</i>; the teacher picked <i>'+esc(mmLvName(t))+'</i>. '+(m.far==='teach'?'The teacher’s points count':'No points this time')+': <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>. '+esc(mmRewardOf('far'))+'.</div>';
  if(r.kind==='unchecked')return '<div class="mm-result"><b>Not checked this time.</b> '+esc(name)+'’s rating counts: <i>'+esc(mmLvName(s))+'</i>, <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>.</div>';
  return '<div class="mm-result"><b>The teacher’s rating:</b> <i>'+esc(mmLvName(t))+'</i>, <b>'+r.pts+' point'+(r.pts===1?'':'s')+'</b>.</div>';}
function mmRenderRate(){const el=$('#mmRate');if(!el)return;const m=S.mm,c=m.cur,name=mmName();
  if(!m.task.trim()&&!m.lv.some(l=>l.img||l.icon)){el.innerHTML='<div class="smr-empty">Name the task and give the models their pictures above; the student then rates here.</div>';return;}
  const st=mmStage();let h='<div class="mm-q"><b>'+esc(m.task||'The task')+'</b>'+(c.img?'<img class="mm-work" src="'+c.img+'" alt="The work">':'')+(m.photo?'<button type="button" class="smr-b" id="mmPhotoBtn">'+(c.img?'Another photo':'Photo of the work')+'</button>':'')+'</div>';
  if(st==='s')h+='<p class="mm-ask">'+esc(name)+', which picture looks like your work?</p><div class="mm-tiles">'+mmOrder().map(i=>mmTile('s',i,c.s===i)).join('')+'</div>'+(c.s>=0?'<div class="tools"><button type="button" class="smr-b pri" id="mmLockS">That one ✓'+(m.first==='student'?' (hide it; the teacher’s turn)':'')+'</button></div>':'');
  else if(st==='t')h+='<p class="mm-ask">'+(m.first==='student'?esc(name)+' has rated (hidden). ':'')+'Teacher: which picture does the work look like?</p><div class="mm-tiles">'+mmOrder().map(i=>mmTile('t',i,c.t===i)).join('')+'</div><div class="tools">'+(c.t>=0?'<button type="button" class="smr-b pri" id="mmLockT">That one ✓'+(m.first==='teacher'?' (hidden; now '+esc(name)+')':'')+'</button>':'')+(m.first==='student'?'<button type="button" class="smr-b" id="mmSkip">Not checking this time ('+esc(name)+'’s rating counts)</button>':'')+'</div>';
  else{const t=c.skip?-1:c.t,r=mmPts(c.s,t);h+='<div class="mm-both">'+(c.s>=0?'<div><span>'+esc(name)+' picked</span>'+mmTile('x',c.s,true)+'</div>':'')+(t>=0?'<div><span>The teacher picked</span>'+mmTile('x',t,true)+'</div>':'')+'</div>'+mmResultHtml(r,c.s,t)+'<div class="tools"><button type="button" class="smr-b pri" id="mmSave">Save this trial</button><button type="button" class="smr-b" id="mmReset">Start over</button></div>';}
  if(st!=='done')h+='<div class="tools"><button type="button" class="smr-b" id="mmReset">Start over</button></div>';
  el.innerHTML=h;}
/* ---- the record ---- */
function mmChecked(){return S.mm.log.filter(r=>r.t>=0&&r.s>=0);}
function mmSuggest(){const m=S.mm,ch=mmChecked(),last=ch.slice(-5),mt=last.filter(r=>r.s===r.t).length;
  if(ch.length<5)return ch.length+' checked trial'+(ch.length===1?'':'s')+' so far: keep checking every time until five are in.';
  const far=ch.slice(-3).filter(r=>Math.abs(r.s-r.t)>=2).length;if(far>=2)return 'Two of the last three checks were far apart: check every time, and practice rating with the pictures before the next task (Teach & fade).';
  if(mt>=4)return mt+' of the last 5 matched: '+({all:'move the checks to every other time.',half:'move the checks to one time in three, unannounced.',third:'move to surprise checks only.',spot:'the rating stands on its own; keep an occasional surprise check.'}[m.check]);
  return mt+' of the last 5 matched: keep the checks as they are'+(mt<=2?', and praise honest ratings as warmly as high ones':'')+'.';}
function mmRenderLog(){const m=S.mm,tb=$('#mmLog'),met=$('#mmMetrics'),sg=$('#mmSuggest');if(!tb)return;const L=m.log,ch=mmChecked(),mt=ch.filter(r=>r.s===r.t).length,pts=L.reduce((a,r)=>a+(r.pts||0),0);
  const opt=(v,t)=>'<option value="'+v+'"'+(String(v)===String(t)?' selected':'')+'>';const lvo=(sel,none)=>'<option value="-1"'+(sel<0?' selected':'')+'>'+none+'</option>'+mmOrder().map(i=>opt(i,sel)+mmNum(i)+' '+esc(m.lv[i].name||('Level '+mmNum(i)))+'</option>').join('');
  tb.innerHTML='<thead><tr><th style="width:4%">#</th><th style="width:12%">Date</th><th style="width:13%">'+esc(mmName())+' picked</th><th style="width:13%">Teacher picked</th><th style="width:9%">Result</th><th style="width:7%">Points</th><th style="width:16%">Reward</th><th>Note</th><th style="width:7%">Photo</th><th class="nx noprint"></th></tr></thead><tbody>'+
    (L.length?L.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><input type="date" data-mmr="d" data-i="'+i+'" value="'+esc(r.d)+'"></td><td><select data-mmr="s" data-i="'+i+'">'+lvo(r.s,'—')+'</select></td><td><select data-mmr="t" data-i="'+i+'">'+lvo(r.t,'not checked')+'</select></td>'+
      '<td><span class="tag '+(r.kind==='match'?'ok':r.kind==='close'?'mid':r.kind==='far'?'no':'na')+'">'+(MM_KIND[r.kind]||'—')+'</span></td><td class="num">'+r.pts+'</td><td><input data-mmr="rw" data-i="'+i+'" value="'+esc(r.rw)+'"></td><td><input data-mmr="note" data-i="'+i+'" value="'+esc(r.note)+'"></td>'+
      '<td>'+(r.img?'<img class="mm-thumb" src="'+r.img+'" alt="The work">':'')+'</td><td class="nx noprint"><button type="button" class="x" data-mmdel="'+i+'" title="Remove this trial">×</button></td></tr>').join(''):'<tr><td colspan="10" class="empty2">No trials yet. Rate on the iPad above, or add a row by hand from the paper sheet.</td></tr>')+'</tbody>';
  if(met)met.innerHTML=[['Trials',L.length],['Checked by the teacher',ch.length],['Matches',ch.length?mt+' of '+ch.length+' ('+Math.round(100*mt/ch.length)+'%)':'—'],['Last five checked',ch.length?ch.slice(-5).filter(r=>r.s===r.t).length+' of '+Math.min(5,ch.length)+' matched':'—'],['Points earned',pts],['At the best level (teacher)',ch.length?ch.filter(r=>r.t===0).length+' of '+ch.length:'—']].map(x=>'<div class="metric"><div class="k">'+x[0]+'</div><div class="v">'+x[1]+'</div></div>').join('');
  if(sg)sg.innerHTML=L.length?'<p class="hint mm-sug"><b>Checks:</b> '+esc(mmSuggest())+'</p>':'';mmPlot();}
function mmPlot(){const svg=$('#mmPlot');if(!svg)return;const m=S.mm,L=m.log,n=m.n;if(!L.length){svg.innerHTML='';return;}
  const W=900,H=260,x0=70,x1=880,y0=28,y1=214,xs=i=>L.length===1?(x0+x1)/2:x0+i*(x1-x0)/(L.length-1),ys=l=>y0+l*(y1-y0)/(n-1);let h='';
  for(let l=0;l<n;l++)h+='<line x1="'+x0+'" y1="'+ys(l)+'" x2="'+x1+'" y2="'+ys(l)+'" stroke="#dde3e6"/><text x="'+(x0-8)+'" y="'+(ys(l)+4)+'" text-anchor="end" font-size="11" fill="#4a5560">'+esc(m.lv[l].name||('Level '+(l+1)))+'</text>';
  const tp=L.map((r,i)=>r.t>=0?xs(i)+','+ys(r.t):null).filter(Boolean);if(tp.length>1)h+='<polyline points="'+tp.join(' ')+'" fill="none" stroke="#1d4a77" stroke-width="2"/>';
  L.forEach((r,i)=>{const x=xs(i);if(r.t>=0)h+='<circle cx="'+x+'" cy="'+ys(r.t)+'" r="6" fill="#1d4a77"/>';if(r.s>=0)h+='<rect x="'+(x-6)+'" y="'+(ys(r.s)-6)+'" width="12" height="12" fill="none" stroke="#b9672d" stroke-width="2"/>';
    if(r.kind==='match')h+='<text x="'+x+'" y="'+(y1+22)+'" text-anchor="middle" font-size="13" fill="#2f6b37">✓</text>';else if(r.kind==='far')h+='<text x="'+x+'" y="'+(y1+22)+'" text-anchor="middle" font-size="13" fill="#8a2b2b">×</text>';
    h+='<text x="'+x+'" y="'+(y1+40)+'" text-anchor="middle" font-size="10" fill="#4a5560">'+(i+1)+'</text>';});
  h+='<text x="'+x0+'" y="16" font-size="11" fill="#4a5560">Teacher: filled dots and line. '+esc(mmName())+': hollow squares. Under the trial: ✓ a match, × far apart.</text>';svg.innerHTML=h;}
/* ---- the printed sheet ---- */
function mmRenderSheet(){const el=$('#mmOut');if(!el)return;const m=S.mm,name=mmName();const rows=8;
  const chk=l=>String(l.chk||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
  el.innerHTML='<div class="mm-sheet'+(m.n===4?' mm-four':'')+'"><div class="mm-shead"><div><b class="mm-title">Does it look like the model?</b><div class="mm-task">'+esc(m.task||'The task')+'</div></div><div class="mm-meta">'+esc(name)+' &nbsp;&middot;&nbsp; Date: ______________</div></div>'+
    '<div class="mm-models">'+mmOrder().map(i=>{const l=m.lv[i];return '<div class="mm-model"><div class="mm-mnum">'+mmNum(i)+'</div><div class="mm-mpic">'+(mmPicOf(l,'mm-mim')||'<span class="mm-noimg">picture</span>')+'</div><div class="mm-mname">'+esc(l.name||('Level '+(i+1)))+'</div><div class="mm-mpts">'+l.pts+' point'+(l.pts===1?'':'s')+'</div>'+(l.desc?'<div class="mm-mdesc">'+esc(l.desc)+'</div>':'')+(chk(l).length?'<div class="mm-mchk">'+chk(l).map(x=>'<div>☐ '+esc(x)+'</div>').join('')+'</div>':'')+'</div>';}).join('')+'</div>'+
    '<div class="mm-rule"><b>The rule.</b> First I pick the picture my work looks like. Then the teacher picks. <b>We match</b> → my points'+(m.bonus?' + '+m.bonus+' bonus':'')+' and '+esc(m.rw.match||'the best reward')+'. <b>One apart</b> → '+(m.close==='self'?'my points, no bonus':m.close==='teach'?'the teacher’s points, no bonus':'no points this time')+(m.rw.close?'; '+esc(m.rw.close):'')+'. <b>Far apart</b> → '+(m.far==='teach'?'the teacher’s points':'no points')+'; '+esc(m.rw.far||'we look at the pictures together')+'. An honest <i>'+esc(mmLvName(m.n-1))+'</i> that matches still earns the bonus.</div>'+
    '<table class="mm-grid"><thead><tr><th class="mm-gd">Date</th><th>I think it looks like</th><th>The teacher thinks</th><th class="mm-gm">Match?</th><th class="mm-gp">Points</th><th>Reward / note</th></tr></thead><tbody>'+
    Array.from({length:rows},()=>'<tr><td class="mm-gd"></td><td class="mm-gc">'+mmOrder().map(i=>'<span class="mm-circ">'+mmNum(i)+'</span>').join('')+'</td><td class="mm-gc">'+mmOrder().map(i=>'<span class="mm-circ">'+mmNum(i)+'</span>').join('')+'</td><td class="mm-gm">☐ yes &nbsp;☐ no</td><td></td><td></td></tr>').join('')+'</tbody></table>'+
    '<div class="mm-sfoot">Circle the number of the picture your work looks like; the number is the points. Rate your own work first, before the teacher does; the teacher’s checks happen '+({all:'every time',half:'every other time',third:'one time in three',spot:'now and then, as a surprise'}[m.check])+'. Form SM-1, Match the model.</div></div>';}
function mmRender(){mmEnsure();mmBind();mmRenderLevels();mmRenderRate();mmRenderLog();mmRenderSheet();}
function mmAfter(){mmRenderRate();mmRenderLog();mmRenderSheet();}
function mmOrient(){return S.mm.n===4?'landscape':'portrait';}
function mmCsv(){const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';const out=[['Trial','Date','Student','Teacher','Result','Points','Reward','Note']];
  S.mm.log.forEach((r,i)=>out.push([i+1,r.d,r.s>=0?mmLvName(r.s):'',r.t>=0?mmLvName(r.t):'not checked',MM_KIND[r.kind]||'',r.pts,r.rw,r.note]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SM-1_match-the-model.csv';document.body.appendChild(a);a.click();a.remove();}
/* ---- events ---- */
(function(){const sec=document.querySelector('.only-mm');if(!sec)return;
  sec.addEventListener('input',e=>{const t=e.target;if(!t.dataset)return;const m=S.mm;
    if(t.dataset.mm){const k=t.dataset.mm;if(k==='n'){const n=Math.min(4,Math.max(2,+t.value||3));m.n=n;m.lv=m.lv.slice(0,n);while(m.lv.length<n)m.lv.push(mmBlankLv(n,m.lv.length));mmEnsure();mmRenderLevels();mmAfter();return;}
      if(k.indexOf('rw.')===0)m.rw[k.slice(3)]=t.value;else if(k==='bonus')m.bonus=Math.max(0,Math.min(10,Math.round(+t.value)||0));else if(k==='photo')m.photo=t.value!=='0';else m[k]=t.value;
      if(k==='bonus'||k==='close'||k==='far')mmEnsure();mmAfter();return;}
    if(t.dataset.mml){const l=m.lv[+t.dataset.i];if(!l)return;const f=t.dataset.mml;l[f]=f==='pts'?Math.max(0,Math.min(99,Math.round(+t.value)||0)):t.value;if(f==='pts')mmEnsure();mmAfter();return;}
    if(t.dataset.mmr){const r=m.log[+t.dataset.i];if(!r)return;const f=t.dataset.mmr;r[f]=f==='s'||f==='t'?+t.value:t.value;if(f==='s'||f==='t'){const p=mmPts(r.s,r.t);r.pts=p?p.pts:0;r.kind=p?p.kind:'';if(f==='t'&&!r.rw)r.rw=mmRewardOf(r.kind);mmRenderLog();}return;}});
  sec.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const m=S.mm,c=m.cur;
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
    if(b.dataset.mmdel!=null){const i=+b.dataset.mmdel,r=m.log[i];if(!r)return;if(window.nbhUI&&nbhUI.confirm&&!(await nbhUI.confirm('Remove trial '+(i+1)+' from the record?',{ok:'Remove',danger:true})))return;m.log.splice(i,1);mmRenderLog();return;}
    if(b.id==='mmCsv'){mmCsv();return;}
    if(b.id==='mmPrint'){mmRenderSheet();printAlone('sm-mm-only',mmOrient());return;}});
  const pin=$('#mmPhotoIn');if(pin)pin.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();
    r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,360/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);S.mm.cur.img=c.toDataURL('image/jpeg',0.8);mmRenderRate();};im.src=r.result;};r.readAsDataURL(f);});
  const pb=$('#mmPrintBtn');if(pb)pb.addEventListener('click',()=>{mmRenderSheet();printAlone('sm-mm-only',mmOrient());});
})();
/* the simulation's pictures: a drawn lunch table at each level (no photograph of a real room travels with the form) */
function mmDrawExample(level){try{const W=480,H=360,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#e9e2d6';x.fillRect(0,0,W,H);x.fillStyle='#d6cbb8';x.fillRect(0,H*0.62,W,H*0.38);   /* wall and floor */
  x.fillStyle='#8a5a3c';x.fillRect(60,120,360,120);x.fillStyle='#6d4530';x.fillRect(60,240,360,14);x.fillRect(80,254,16,80);x.fillRect(384,254,16,80);   /* the table */
  const chair=(cx,out)=>{x.fillStyle='#3f5f8a';x.fillRect(cx,out?262:200,54,out?60:28);x.fillStyle='#2e4a6e';x.fillRect(cx+4,out?322:228,8,out?26:0);x.fillRect(cx+42,out?322:228,8,out?26:0);};
  chair(140,level>=2);chair(290,level>=1);   /* a chair out from level 1, both from level 2 */
  let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  const crumbs=level===0?0:level===1?7:26;x.fillStyle='#5a3a1a';for(let i=0;i<crumbs;i++){const px=70+rnd()*340,py=126+rnd()*104;x.beginPath();x.arc(px,py,2.2+rnd()*2.2,0,Math.PI*2);x.fill();}
  if(level>=2){x.fillStyle='rgba(120,160,210,.75)';x.beginPath();x.ellipse(300,170,46,22,0.2,0,Math.PI*2);x.fill();x.fillStyle='#c9c2b4';x.fillRect(120,135,40,28);}   /* a spill and a napkin */
  if(level===1){x.fillStyle='#5a3a1a';for(let i=0;i<9;i++){x.beginPath();x.arc(66+rnd()*18,130+rnd()*100,2.5,0,Math.PI*2);x.fill();}}   /* crumbs in the corner */
  x.fillStyle='#e8e1d3';x.fillRect(190,128,100,16);x.fillStyle='#8a5a3c';if(level===0){x.fillStyle='#b4845c';x.fillRect(80,126,320,8);}   /* the wiped sheen */
  return c.toDataURL('image/jpeg',0.8);}catch(e){return '';}}
/* the simulation's example: a lunch table, ten trials, the checks already thinned once */
function mmSim(D){const m=mmBlank();m.task='Clean the lunch table';m.n=3;m.lv.forEach((l,i)=>{l.img=mmDrawExample(i);});m.lv[0].desc='No crumbs on the top or the floor, no wet spots, both chairs pushed in';m.lv[0].chk='wiped the whole top\nno crumbs on the floor\nchairs pushed in';
  m.lv[1].desc='Wiped, but crumbs in the corners or one chair out';m.lv[1].chk='wiped the top\ncheck the corners\nboth chairs';m.lv[2].desc='Crumbs and spills still there';m.lv[2].chk='get the cloth\nstart with the top';
  m.check='half';m.bonus=1;m.rw.match='10 minutes of drawing (the reward store)';m.rw.close='praise for an honest rating';m.rw.far='look at the pictures together; rate again tomorrow';
  const T=[[2,2],[1,1],[1,0],[0,0],[2,0],[0,0],[1,1],[0,-1],[0,0],[0,-1]];
  const back=n=>{const d=new Date();d.setHours(12,0,0,0);while(n>0){d.setDate(d.getDate()-1);if(d.getDay()%6)n--;}return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};   /* school days back */
  T.forEach((x,i)=>{m.log.push({d:back(T.length-i),s:x[0],t:x[1],pts:0,kind:'',rw:'',note:i===4?'rushed; the teacher showed the corners':'',img:''});});
  S.mm=m;mmEnsure();m.log.forEach(r=>{if(!r.rw)r.rw=mmRewardOf(r.kind);});}
window.__mm={pts:mmPts,sim:mmSim,render:mmRender,suggest:mmSuggest,stage:mmStage,ensure:mmEnsure};
