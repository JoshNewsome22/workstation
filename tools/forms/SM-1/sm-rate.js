/* ===== Form SM-1 (v21.46): rating on the iPad. =====
   The Rate page: at the end of each period the student taps a rating for each target instead of circling it, the adult taps
   theirs where the system has a match (Self & Match, cued intervals, the rubric with the teacher matching), and the points,
   the match and the goal follow as they tap. A day is kept in S.days under its date (yyyy-mm-dd): the ratings by cell
   ("period_target": the level's place in the rating style, 0 the highest), the reminders by period, the reward worked for and
   the one chosen, a note, and when it was finished. Finish the day writes the day to the Record as one row (updated, not
   repeated, if it is finished again). The Student screen fills the iPad with the student's part; holding the adult's button
   (and the PIN, when one is set) opens the adult's part. A cue timer for cued intervals, a chime when a period ends, read
   aloud by the iPad's own voice, and a printed day report. Everything stays in the form's file on this device.

   How the points are counted, the same as on paper:
   - one rater (contract, expectations, check-in/check-out): the points of the level tapped;
   - Self & Match, a two-level style: the Match Points table (System page): both yes, both no, student yes and adult no,
     student no and adult yes; a style with more levels: the adult's level plus the bonus when the two are the same;
   - cued intervals and the rubric with the adult matching: the adult's level;
   - a period the adult does not rate (the matching ladder thins the matching to a sample): the student's rating counts as
     if it were matched, as Rhode, Morgan and Young (1983) did once matching was faded. */

const SMR_SYS=['match','contract','smiley','cico','interval','rubric'];
const SMR={date:'',sel:-1,mode:'me',modeSet:false,kid:false,ac:null,wl:null,cue:false,cueAt:0,cueLen:0,begun:-2,hold:0,tick:0};
function smRISO(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function smRDateOf(iso){const p=String(iso).split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function smRLong(iso){try{return smRDateOf(iso).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});}catch(e){return iso;}}
function smRShort(iso){const d=smRDateOf(iso);return (d.getMonth()+1)+'/'+d.getDate();}
function smREmpty(){return {alt:false,me:{},t:{},rem:{},wf:'',rw:'',spent:'',note:'',fin:'',sig:''};}
function smREnsure(){if(!S.days||typeof S.days!=='object'||Array.isArray(S.days))S.days={};}
function smRDay(iso,make){smREnsure();iso=iso||SMR.date;if(!S.days[iso]&&make)S.days[iso]=smREmpty();return S.days[iso]||null;}
function smRAny(day){return !!day&&(Object.keys(day.me).length+Object.keys(day.t).length)>0;}
function smRHM(d){d=d||new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

/* ---------------- the levels, the rows and the points ---------------- */
/* the levels tapped on this sheet: the rating style chosen on the Design page, or the sheet type's own (as on paper) */
function smRLv(){const sys=S.sys;
  if(sys==='rubric')return S.lv.map((l,i)=>['t:'+(i+1),num(l.pts)||0,String(l.desc||'').trim()||'level '+(i+1)]);
  const lv=smLevels();if(lv)return lv;
  if(sys==='cico')return [['t:2',2,'2'],['t:1',1,'1'],['t:0',0,'0']];
  if(sys==='contract')return [['t:✓',1,'done'],['t:✗',0,'not yet']];
  if(sys==='smiley')return [['fh',1,'smile'],['fs',0,'not yet']];
  return [['fh',1,'yes'],['fs',0,'no']];}
function smRModel(day){const sys=S.sys;if(!SMR_SYS.includes(sys))return null;const m=smModel(),lv=smRLv(),bin=lv.length===2;
  let rows;if(sys==='interval')rows=m.rows.map(r=>({t:'',label:r.label,sub:r.sub,pic:''}));
  else{const src=day&&day.alt&&S.per2.some(x=>x.label||x.t)?S.per2:S.per;rows=src.map((r,i)=>({t:toHM24(r.t),label:r.label||('Period '+(i+1)),sub:r.t?fmtHM(r.t):'',pic:pic(r,'')}));}
  const mm=mp(),bonus=smBonus(),mx=Math.max(...lv.map(x=>x[1]));
  const maxc=sys==='match'?(bin?Math.max(mm.yy,mm.nn,mm.yn,mm.ny):mx+bonus):mx;
  return {sys,lv,bin,raters:m.raters,rows,tg:m.tg,tw:m.tw,maxc,mm,bonus,match:m.raters.length>1};}
function smRSig(M){return M.sys+'|'+M.lv.map(x=>x[0]).join(',')+'|'+M.rows.length+'|'+M.tg.length;}
function smRVal(M,day,r,t){const k=r+'_'+t,ok=v=>Number.isInteger(v)&&v>=0&&v<M.lv.length;const a=ok(day.me[k])?day.me[k]:null,b=ok(day.t[k])?day.t[k]:null;
  let p=0,done=false;
  if(M.raters.length===1){const v=M.raters[0]==='me'?a:b;if(v!=null){p=M.lv[v][1];done=true;}}
  else if(M.sys==='match'&&M.bin){if(a!=null){done=true;const q=M.mm;p=b==null?(a===0?q.yy:q.nn):a===0?(b===0?q.yy:q.yn):(b===0?q.ny:q.nn);}}
  else if(M.sys==='match'){if(a!=null){done=true;p=b!=null?M.lv[b][1]+(a===b?M.bonus:0):M.lv[a][1];}else if(b!=null)p=0;}
  else if(a!=null||b!=null){done=a!=null;p=M.lv[b!=null?b:a][1];}
  return {a,b,p,done,both:a!=null&&b!=null,same:a!=null&&b!=null&&a===b};}
function smRTotals(M,day){let pts=0,m=0,n=0,wait=0;const tp=M.tg.map(()=>0);
  M.rows.forEach((r,ri)=>M.tg.forEach((t,ti)=>{const v=smRVal(M,day,ri,ti);pts+=v.p;tp[ti]+=v.p;if(v.both){n++;if(v.same)m++;}if(M.match&&v.a!=null&&v.b==null)wait++;}));
  const poss=M.rows.length*M.tg.length*M.maxc,g=num(S.meta.goal),need=g!=null&&poss?Math.ceil(poss*g/100):null,per=M.rows.length*M.maxc;
  return {pts,poss,need,g,m,n,wait,tp:tp.map(x=>per?Math.round(x/per*100):'')};}
/* whose rating the buttons set: the student's or the adult's; a one-rater sheet has only that rater (the adult may correct the student's) */
function smRWho(M){return M.raters.length===1?M.raters[0]:SMR.mode;}
function smRRowDone(M,day,ri,who){return M.tg.every((t,ti)=>day[who][ri+'_'+ti]!=null);}
function smRRowAny(M,day,ri,who){return M.tg.some((t,ti)=>day[who][ri+'_'+ti]!=null);}
/* the period to rate now: the first one already begun that is not rated yet, else the next one not rated */
function smRNow(M,day){const who=smRWho(M);
  if(M.sys==='interval'){const i=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,who));return i<0?M.rows.length-1:i;}
  const today=SMR.date===smRISO(),hm=smRHM();const begun=M.rows.map((r,i)=>i).filter(i=>!today||!M.rows[i].t||M.rows[i].t<=hm);
  const un=begun.find(i=>!smRRowDone(M,day,i,who));if(un!=null)return un;
  const f=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,who));return f>=0?f:begun.length?begun[begun.length-1]:0;}   /* all begun ones rated: the next one */
function smRBank(){if(!smD().bank)return null;let b=0;Object.keys(S.days||{}).sort().forEach(k=>{const d=S.days[k];if(!d.fin)return;const M=smRModel(d);if(!M)return;b+=smRTotals(M,d).pts-(num(d.spent)||0);});return b;}

/* ---------------- drawing ---------------- */
function smRG(M,i,sz){const x=M.lv[i];const R=SM_RATES[smRateKey()];
  if(x[0]==='st'&&R&&R.count){const n=R.count,f=n-i;return '<span class="gstars">'+Array.from({length:n},(_,j)=>{const s=smGlyph('st',Math.round(sz*.6));return j<f?s.replace('fill="#fff"','fill="#f5c518"'):s;}).join('')+'</span>';}
  return smGlyph(x[0],sz);}
function smRWord(M,i){const w=String(M.lv[i][2]||'');return w.charAt(0).toUpperCase()+w.slice(1);}
function smRStu(){return smName()||'Student';}
function smRRender(){const host=$('#smRate');if(!host)return;smREnsure();if(!SMR.date)SMR.date=smRISO();
  const acc=smAccent();host.style.setProperty('--acc',acc);
  if(!S.sys){host.innerHTML='<div class="smr-empty">Choose the system on the System page first; the student then rates it here.</div>';return;}
  const day=smRDay()||smREmpty(),M=smRModel(day);
  if(!M){host.innerHTML='<div class="smr-empty">The '+({perf:'performance count',interlock:'interlocking session'}[S.sys]||'')+' sheet is kept on paper. Rating on the iPad works with Self &amp; Match, the contract, expectations and earns, check-in/check-out, cued intervals and the rubric point sheet.</div>';return;}
  if(SMR.sel<0||SMR.sel>=M.rows.length)SMR.sel=smRNow(M,day);
  if(!SMR.kid&&!SMR.modeSet&&M.raters.length===1&&M.raters[0]==='t')SMR.mode='t';   /* check-in/check-out: the adult rates */
  const T=smRTotals(M,day),kid=SMR.kid,teach=SMR.mode==='t';
  let h='';
  /* the top: who, the date, the mode, the day's buttons */
  h+='<div class="smr-top"><div class="smr-who">'+(smAvatar(46)||'')+'<b>'+esc(smName()?smName()+'’s day':'My day')+'</b>'+
    (kid?'<span class="smr-date">'+esc(smRLong(SMR.date))+'</span>':'<input type="date" id="smRDate" value="'+esc(SMR.date)+'" aria-label="The day rated">')+'</div>';
  if(!kid)h+='<div class="smr-modes" role="group" aria-label="Who is rating">'+(M.raters.includes('me')||M.raters.length===1?'<button type="button" data-rmode="me" aria-pressed="'+!teach+'">'+esc(smRStu())+(M.raters[0]==='t'&&M.raters.length===1?' sees':' rates')+'</button>':'')+'<button type="button" data-rmode="t" aria-pressed="'+teach+'">'+esc(M.tw)+(M.raters.includes('t')?' rates':' checks')+'</button></div>'+
    '<div class="smr-acts"><button type="button" class="smr-b pri" id="smRKid">Student screen</button><button type="button" class="smr-b" id="smRFin"'+(smRAny(day)?'':' disabled')+'>'+(day.fin?'Finish again':'Finish the day')+'</button><button type="button" class="smr-b" id="smRPrint"'+(smRAny(day)?'':' disabled')+'>Print the day</button></div>';
  else h+='<div class="smr-kidbar">'+(teach?'<button type="button" class="smr-b" data-rmode="me">Back to '+esc(smRStu())+'</button><button type="button" class="smr-b" id="smRKidOff">Leave the student screen</button>':'<button type="button" class="smr-hold" id="smRHold" aria-label="'+esc(M.tw)+': press and hold">'+esc(M.tw)+'<i></i></button>')+'</div>';
  h+='</div>';
  if(day.sig&&day.sig!==smRSig(M)&&smRAny(day))h+='<div class="smr-warn">This day was rated on a sheet that has changed since (the system, the rating style, the periods or the targets). Its ratings are shown on the sheet as it is now: check them before you finish the day.</div>';
  if(!kid&&S.per2.some(x=>x.label||x.t)&&S.sys!=='interval')h+='<div class="smr-alt" role="group" aria-label="Today’s schedule"><span>Today’s schedule:</span><button type="button" data-ralt="0" aria-pressed="'+!day.alt+'">Regular</button><button type="button" data-ralt="1" aria-pressed="'+!!day.alt+'">Second schedule</button></div>';
  /* the goal */
  const st=smStore(),wfI=st.find(o=>o.n&&o.n===day.wf),wfP=wfI?num(wfI.p):null,bank=smRBank();
  const W=v=>Math.max(0,Math.min(100,T.poss?v/T.poss*100:0)).toFixed(1)+'%';
  h+='<div class="smr-goal"><div class="smr-gl"><span><b class="big">'+T.pts+'</b> point'+smPoss(T.pts)+' '+(T.need!=null?(T.pts>=T.need?'<span class="smr-met">Goal reached!</span>':'· '+(T.need-T.pts)+' more to my goal of '+T.need):'of '+T.poss)+'</span>'+
    (bank!=null?'<span class="smr-bank">In my bank: <b>'+bank+'</b></span>':'')+'</div><div class="smr-bar'+(wfP!=null&&wfP!==T.need&&wfP<=T.poss?' rw':'')+'" role="img" aria-label="'+T.pts+' of '+T.poss+' points'+(T.need!=null?', goal '+T.need:'')+'"><div class="smr-fill" style="width:'+W(T.pts)+'"></div>'+
    (T.need!=null?'<div class="smr-mk" style="left:'+W(T.need)+'"><span>goal '+T.need+'</span></div>':'')+(wfP!=null&&wfP!==T.need&&wfP<=T.poss?'<div class="smr-mk rw" style="left:'+W(wfP)+'"><span>'+esc(wfI.n)+' '+wfP+'</span></div>':'')+'</div>'+
    (teach&&T.wait?'<div class="smr-wait">'+T.wait+' rating'+smPoss(T.wait)+' not matched yet: '+(T.wait===1?'it counts':'they count')+' as the student rated, until you rate '+(T.wait===1?'it':'them')+'.</div>':'')+'</div>';
  /* what the student is working for */
  if(st.length){h+='<div class="smr-wf"><b>'+(day.fin?'I chose:':'I’m working for:')+'</b><div class="smr-tiles">'+st.map((o,i)=>{const p=num(o.p),on=day.fin?o.n===day.rw:o.n===day.wf,can=!day.fin||p==null||p<=T.pts+(bank!=null?bank:0);
      return '<button type="button" class="smr-tile'+(on?' on':'')+(can?'':' dim')+'" data-rwf="'+i+'" aria-pressed="'+on+'">'+smStorePic(o,kid?54:38)+'<span>'+esc(o.n||'')+'</span>'+(o.p?'<i>'+esc(o.p)+'</i>':'')+'</button>';}).join('')+'</div></div>';}
  else if(S.meta.sh_reward)h+='<div class="smr-wf"><b>I’m working for:</b> '+esc(S.meta.sh_reward)+'</div>';
  /* the period card */
  h+=smRCard(M,day,T);
  /* the day at a glance */
  if(!kid||teach)h+=smRGrid(M,day,T);
  if(kid){h+='<div class="smr-foot">'+esc(smRLong(SMR.date))+' · Form SM-1</div>';}
  else{h+=smRSettings(M)+smRDays();}
  host.innerHTML=h;
  if(SMR.cue)smRCount();}
function smRCard(M,day,T){const ri=SMR.sel,row=M.rows[ri],who=smRWho(M),teach=SMR.mode==='t',kid=SMR.kid;
  const ro=M.raters.length===1&&M.raters[0]==='t'&&!teach;   /* check-in/check-out: the student sees the adult's ratings */
  const sz=kid?64:44;
  let h='<div class="smr-card" id="smRCard"><div class="smr-ph"><button type="button" class="nav" data-rgo="-1" aria-label="Previous period"'+(ri>0?'':' disabled')+'>&lsaquo;</button>'+
    '<div class="smr-pt">'+(row.pic?'<span class="rpic">'+row.pic+'</span>':'')+'<span><b>'+esc(row.label)+'</b>'+(row.sub?'<small>'+esc(row.sub)+'</small>':'')+'</span><button type="button" class="smr-say" data-rsay="p" aria-label="Read it aloud">'+smRSpk()+'</button></div>'+
    '<button type="button" class="nav" data-rgo="1" aria-label="Next period"'+(ri<M.rows.length-1?'':' disabled')+'>&rsaquo;</button></div>';
  h+='<div class="smr-dots" role="group" aria-label="Periods">'+M.rows.map((r,i)=>'<button type="button" data-rsel="'+i+'" class="'+(smRRowDone(M,day,i,who)?'done':smRRowAny(M,day,i,who)?'half':'')+(i===ri?' cur':'')+'" aria-label="'+esc(r.label)+(smRRowDone(M,day,i,who)?', rated':'')+'"'+(i===ri?' aria-current="true"':'')+'></button>').join('')+'</div>';
  if(M.sys==='interval'&&!SMR.kid||M.sys==='interval'&&teach)h+=smRCueBar();
  if(ro)h+='<p class="smr-note">'+esc(M.tw)+' rates each period on this sheet.</p>';
  else if(teach&&M.raters.length===1)h+='<p class="smr-note">'+esc(smRStu())+' rates this sheet; a tap here corrects the rating.</p>';
  M.tg.forEach((t,ti)=>{const v=smRVal(M,day,ri,ti),cur=who==='me'?v.a:v.b;
    h+='<div class="smr-q"><div class="smr-qw">'+(t.pic?'<span class="tpic">'+t.pic+'</span>':'')+'<span><b>'+esc(t.word)+'</b>'+(t.cue?'<small>'+esc(t.cue)+'</small>':'')+'</span><button type="button" class="smr-say" data-rsay="'+ti+'" aria-label="Read it aloud">'+smRSpk()+'</button></div>';
    h+='<div class="smr-opts" role="group" aria-label="'+esc(t.word)+'">'+M.lv.map((x,i)=>'<button type="button" class="smr-o'+(cur===i?' on':'')+'" data-rt="'+ti+'" data-rl="'+i+'" aria-pressed="'+(cur===i)+'"'+(ro?' disabled':'')+'>'+smRG(M,i,sz)+'<span>'+esc(smRWord(M,i))+'</span></button>').join('')+'</div>';
    /* the match, once both have rated (the adult sees the student's rating first only when the Settings say so) */
    if(M.match){let r='';const nm=esc(smRStu()),tw=esc(M.tw);
      if(teach){if(v.a==null)r='<span class="smr-mute">'+nm+' has not rated this yet.</span>';else if(v.b==null&&!smD().rshow)r='<span class="smr-mute">'+nm+' has rated. Rate it yourself to see the match.</span>';else r=nm+': '+smRG(M,v.a,22)+' '+esc(smRWord(M,v.a));}
      else if(v.b!=null)r=tw+': '+smRG(M,v.b,22)+' '+esc(smRWord(M,v.b));
      if(v.both)r+=v.same?' <b class="smr-same">Same answer! +'+v.p+'</b>':' <b class="smr-diff">Different answers'+(v.p?': '+v.p+' point'+smPoss(v.p):'')+'</b>';
      if(r)h+='<div class="smr-stu">'+r+'</div>';}
    h+='</div>';});
  /* reminders (the adult's tally) and the period's points */
  const pp=M.tg.reduce((s,t,ti)=>s+smRVal(M,day,ri,ti).p,0),rem=day.rem[ri]||0;
  h+='<div class="smr-end">';
  if(teach&&M.raters.includes('t'))h+='<div class="smr-rem"><span>Reminders this period</span><button type="button" data-rrem="-1" aria-label="One less"'+(rem?'':' disabled')+'>&minus;</button><b aria-live="polite">'+rem+'</b><button type="button" data-rrem="1" aria-label="One more">+</button></div>';
  const done=smRRowDone(M,day,ri,who);
  if(done&&!ro){const waitT=!teach&&M.match&&!smRRowDone(M,day,ri,'t');h+='<div class="smr-done">'+(waitT?'All rated! Show '+esc(M.tw.toLowerCase())+'.':'This period: <b>'+pp+'</b> point'+smPoss(pp)+'.')+'</div>';}
  if(ri<M.rows.length-1&&(done||ro))h+='<button type="button" class="smr-b pri smr-next" data-rgo="1">Next: '+esc(M.rows[ri+1].label)+' &rsaquo;</button>';
  h+='</div>';
  if(teach&&!SMR.kid)h+='<label class="smr-nl">Note for the day <textarea data-rnote rows="2" placeholder="What happened, what helped (prints on the day report)">'+esc(day.note)+'</textarea></label>';
  return h+'</div>';}
function smRSpk(){return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';}
function smRGrid(M,day,T){const who=r=>r==='me'?esc(smRStu()):esc(M.tw);const two=M.raters.length>1;
  let h='<div class="smr-grid"><table><thead><tr><th rowspan="'+(two?2:1)+'">'+(M.sys==='interval'?'Check':'Period')+'</th>'+M.tg.map(t=>'<th colspan="'+M.raters.length+'">'+esc(t.word)+'</th>').join('')+'<th rowspan="'+(two?2:1)+'">R</th><th rowspan="'+(two?2:1)+'">Points</th></tr>'+
    (two?'<tr>'+M.tg.map(()=>M.raters.map(r=>'<th class="w">'+who(r)+'</th>').join('')).join('')+'</tr>':'')+'</thead><tbody>';
  M.rows.forEach((r,ri)=>{let p=0;h+='<tr class="'+(ri===SMR.sel?'cur':'')+'" data-rsel="'+ri+'"><th>'+esc(r.label)+(r.sub?' <small>'+esc(r.sub)+'</small>':'')+'</th>'+M.tg.map((t,ti)=>{const v=smRVal(M,day,ri,ti);p+=v.p;return M.raters.map(x=>{const l=x==='me'?v.a:v.b;return '<td class="'+(v.both?(v.same?'sm':'df'):'')+'">'+(l!=null?smRG(M,l,18):'<span class="smr-blank">·</span>')+'</td>';}).join('');}).join('')+'<td>'+(day.rem[ri]?'R'.repeat(Math.min(5,day.rem[ri])):'')+'</td><td class="p">'+(smRRowAny(M,day,ri,M.raters[0])||smRRowAny(M,day,ri,'t')?p:'')+'</td></tr>';});
  h+='<tr class="tot"><th colspan="'+(1+M.tg.length*M.raters.length+1)+'">Today'+(M.match&&T.n?' · same answer '+T.m+' of '+T.n+' ('+Math.round(T.m/T.n*100)+'%)':'')+'</th><td class="p">'+T.pts+' / '+T.poss+'</td></tr></tbody></table></div>';
  return h;}
function smRCueBar(){const iv=num(S.meta.iv_len)||3,vr=/^Variable/.test(S.meta.iv_timing||'');
  return '<div class="smr-cue">'+(SMR.cue?'<span>Next check in <b id="smRCount">…</b></span><button type="button" class="smr-b" id="smRCueOff">Stop the cue timer</button>':'<button type="button" class="smr-b pri" id="smRCueOn">Start the cue timer</button><span class="smr-mute">a cue every '+(vr?'about ':'')+iv+' minute'+smPoss(iv)+(vr?' (variable)':'')+': '+(smD().rcue==='flash'?'the screen flashes':'a chime and the screen flashes')+'</span>')+'</div>';}
function smRSettings(M){const d=smD();
  return '<details class="smr-set"><summary>Settings for rating on the iPad</summary>'+
    (M.match?'<label class="ck"><input type="checkbox" data-d="rshow"'+(d.rshow?' checked':'')+'> Show '+esc(M.tw.toLowerCase())+' the student’s rating before '+esc(M.tw.toLowerCase())+' rates (off: the match stays independent)</label>':'')+
    '<label class="ck"><input type="checkbox" data-d="rspeak"'+(d.rspeak?' checked':'')+'> Read each period’s questions aloud when it opens, and the rating tapped (the iPad’s own voice)</label>'+
    (M.sys!=='interval'?'<label class="ck"><input type="checkbox" data-d="rchime"'+(d.rchime?' checked':'')+'> Chime when a period ends and open it for rating (the times on the schedule; the iPad stays awake while the Rate page or the Student screen is open)</label>':
     '<label>The cue <select data-d="rcue"><option value=""'+(d.rcue!=='flash'?' selected':'')+'>A soft chime and the screen flashes</option><option value="flash"'+(d.rcue==='flash'?' selected':'')+'>The screen flashes, no sound (for a quiet room)</option></select></label>')+
    '<label>PIN for '+esc(M.tw.toLowerCase())+'’s part on the Student screen <input data-d="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" value="'+esc(d.pin||'')+'" placeholder="none" style="width:8em"></label>'+
    '<p class="hint">On the Student screen the student sees only their part. '+esc(M.tw)+'’s part opens by holding '+esc(M.tw.toLowerCase())+'’s button for a second, and the PIN when one is set: it keeps the student on their part; it is not a lock on the file.</p></details>';}
function smRDays(){const ks=Object.keys(S.days||{}).filter(k=>smRAny(S.days[k])).sort().reverse();if(!ks.length)return '';
  return '<div class="smr-days"><h3>Days rated on the iPad</h3><table><thead><tr><th>Day</th><th>Points</th><th>Goal</th><th>Same answer</th><th>Reward</th><th></th></tr></thead><tbody>'+ks.map(k=>{const d=S.days[k],M=smRModel(d);if(!M)return '';const T=smRTotals(M,d);
    return '<tr'+(k===SMR.date?' class="cur"':'')+'><td>'+esc(smRLong(k))+(d.fin?'':' <i>(not finished)</i>')+'</td><td>'+T.pts+' / '+T.poss+'</td><td>'+(T.need==null?'—':T.pts>=T.need?'met':'not met')+'</td><td>'+(M.match&&T.n?T.m+' of '+T.n:'—')+'</td><td>'+esc(d.rw||'')+'</td><td class="b"><button type="button" class="smr-b" data-ropen="'+k+'">Open</button><button type="button" class="smr-b" data-rprint="'+k+'">Print</button><button type="button" class="smr-b" data-rdel="'+k+'" aria-label="Delete '+esc(smRLong(k))+'">Delete</button></td></tr>';}).join('')+'</tbody></table></div>';}

/* ---------------- the printed day report ---------------- */
function smRPage(iso){const day=S.days[iso];const M=smRModel(day);if(!M)return '';const T=smRTotals(M,day),two=M.raters.length>1,acc=smAccent();
  const who=r=>r==='me'?esc(smRStu()):esc(M.tw);
  let h='<div class="pg sm2-pg smr-pg" style="--acc:'+acc+'"><h2>'+esc(smName()?smName()+'’s day':'The day')+': '+esc(smRLong(iso))+'</h2><p class="sub">'+esc(S.meta.client||'')+(S.meta.client?' · ':'')+'rated on the iPad'+(day.fin?', finished '+esc(new Date(day.fin).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})):', not finished')+' · '+esc(({match:'Self & Match',contract:'Contract',smiley:'Expectations and earns',cico:'Check-in / check-out',interval:'Cued intervals',rubric:'Rubric point sheet'})[M.sys])+'</p>';
  h+='<table class="smr-ptab"><thead><tr><th rowspan="'+(two?2:1)+'">'+(M.sys==='interval'?'Check':'Period')+'</th>'+M.tg.map(t=>'<th colspan="'+M.raters.length+'">'+esc(t.word)+'</th>').join('')+(two?'<th rowspan="2">Same</th>':'')+'<th rowspan="'+(two?2:1)+'">Reminders</th><th rowspan="'+(two?2:1)+'">Points</th></tr>'+(two?'<tr>'+M.tg.map(()=>M.raters.map(r=>'<th>'+who(r)+'</th>').join('')).join('')+'</tr>':'')+'</thead><tbody>';
  M.rows.forEach((r,ri)=>{let p=0,sm=0,bo=0;h+='<tr><th>'+esc(r.label)+(r.sub?'<br><small>'+esc(r.sub)+'</small>':'')+'</th>'+M.tg.map((t,ti)=>{const v=smRVal(M,day,ri,ti);p+=v.p;if(v.both){bo++;if(v.same)sm++;}return M.raters.map(x=>{const l=x==='me'?v.a:v.b;return '<td>'+(l!=null?smRG(M,l,20)+'<span class="w">'+esc(smRWord(M,l))+'</span>':'—')+'</td>';}).join('');}).join('')+
    (two?'<td>'+(bo?sm+' of '+bo:'—')+'</td>':'')+'<td>'+(day.rem[ri]||'')+'</td><td class="p">'+p+'</td></tr>';});
  h+='</tbody></table><div class="smr-sum"><div><b>'+T.pts+' of '+T.poss+'</b> points ('+(T.poss?Math.round(T.pts/T.poss*100):0)+'%)</div><div>'+(T.need!=null?'Goal '+T.need+' ('+pct(T.g)+'): <b>'+(T.pts>=T.need?'met':'not met')+'</b>':'No goal set')+'</div>'+
    (M.match?'<div>Same answer: <b>'+(T.n?T.m+' of '+T.n+' ('+Math.round(T.m/T.n*100)+'%)':'—')+'</b></div>':'')+(day.wf?'<div>Working for: <b>'+esc(day.wf)+'</b></div>':'')+(day.rw?'<div>Reward chosen: <b>'+esc(day.rw)+'</b></div>':'')+'</div>';
  if(M.tg.length>1)h+='<p class="sub">By target: '+M.tg.map((t,i)=>esc(t.word)+' '+T.tp[i]+'%').join(' · ')+'</p>';
  if(day.note)h+='<div class="box"><b>Note:</b> '+esc(day.note)+'</div>';
  h+='<div class="smr-sig"><span>'+esc(M.tw)+' ____________________</span><span>Parent or guardian ____________________</span><span>Date ________</span></div><div class="smr-pf">Form SM-1 · rated on the iPad</div></div>';
  return h;}

/* ---------------- sound, voice, wake, the cue timer ---------------- */
function smRAudio(){try{if(!SMR.ac){const C=window.AudioContext||window.webkitAudioContext;if(C){SMR.ac=new C();const b=SMR.ac.createBuffer(1,1,22050),s=SMR.ac.createBufferSource();s.buffer=b;s.connect(SMR.ac.destination);s.start(0);}}if(SMR.ac&&SMR.ac.state==='suspended')SMR.ac.resume();}catch(e){}}
function smRChime(){if(smD().rcue==='flash'&&S.sys==='interval')return;smRAudio();const C=SMR.ac;if(!C)return;
  try{const t=C.currentTime;[[659.25,0],[987.77,.22]].forEach(([f,d])=>{const o=C.createOscillator(),g=C.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t+d);g.gain.exponentialRampToValueAtTime(0.22,t+d+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.9);o.connect(g);g.connect(C.destination);o.start(t+d);o.stop(t+d+1);});}catch(e){}}
function smRFlash(){const c=$('#smRCard');if(!c)return;c.classList.remove('smr-flash');void c.offsetWidth;c.classList.add('smr-flash');setTimeout(()=>c.classList.remove('smr-flash'),1800);}
function smRSay(text){try{if(!window.speechSynthesis||!text)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=0.95;speechSynthesis.speak(u);}catch(e){}}
function smRSayPeriod(M){const r=M.rows[SMR.sel];if(!r)return;smRSay(r.label+'. '+M.tg.map(t=>t.word).join('. '));}
async function smRWake(on){try{if(on){if(!SMR.wl&&navigator.wakeLock&&document.visibilityState==='visible'){SMR.wl=await navigator.wakeLock.request('screen');SMR.wl.addEventListener&&SMR.wl.addEventListener('release',()=>{SMR.wl=null;});}}
  else if(SMR.wl&&!SMR.kid&&!SMR.cue&&!document.body.classList.contains('view-rate')){const w=SMR.wl;SMR.wl=null;await w.release();}}catch(e){SMR.wl=null;}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(SMR.kid||SMR.cue||document.body.classList.contains('view-rate')&&smD().rchime))smRWake(true);});
function smRCueNext(){const avg=(num(S.meta.iv_len)||3)*60000,vr=/^Variable/.test(S.meta.iv_timing||'');return vr?avg*(1/3+Math.random()*4/3):avg;}
function smRCount(){const el=$('#smRCount');if(!el)return;const s=Math.max(0,Math.round((SMR.cueAt-Date.now())/1000));el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function smRTick(){const on=SMR.kid||document.body.classList.contains('view-rate');if(!on||!S.sys)return;
  if(SMR.cue){if(Date.now()>=SMR.cueAt){SMR.cueAt=Date.now()+smRCueNext();const day=smRDay()||smREmpty(),M=smRModel(day);if(M){const i=M.rows.findIndex((r,ri)=>!smRRowDone(M,day,ri,'me'));if(i>=0)SMR.sel=i;else SMR.cue=false;}
      smRRender();smRChime();smRFlash();if(M&&smD().rspeak)smRSayPeriod(M);}else smRCount();return;}
  if(smD().rchime&&S.sys!=='interval'&&SMR.date===smRISO()){const day=smRDay()||smREmpty(),M=smRModel(day);if(!M)return;const hm=smRHM();let k=-1;M.rows.forEach((r,i)=>{if(r.t&&r.t<=hm)k=i;});
    if(SMR.begun===-2){SMR.begun=k;return;}
    if(k>SMR.begun){const ended=k-1;SMR.begun=k;if(ended>=0&&!smRRowDone(M,day,ended,smRWho(M))){SMR.sel=ended;smRRender();smRChime();smRFlash();nbhUI.toast('Time to rate '+M.rows[ended].label+'.',{kind:'ok'});if(smD().rspeak)smRSayPeriod(M);}}}}
SMR.tick=setInterval(smRTick,1000);

/* ---------------- the Student screen ---------------- */
/* the page behind the Student screen is made inert, so a keyboard or VoiceOver stays on the student's part */
let SMR_INERT=[];
function smRInert(on){SMR_INERT.forEach(e=>{e.inert=false;});SMR_INERT=[];if(!on)return;
  for(let n=$('#smRWrap');n&&n.parentElement&&n!==document.body;n=n.parentElement)for(const sib of n.parentElement.children)if(sib!==n&&!sib.inert&&!/^(SCRIPT|STYLE|LINK|DIALOG)$/.test(sib.tagName)&&sib.id!=='smRFx'){sib.inert=true;SMR_INERT.push(sib);}}
function smRKid(on){SMR.kid=on;document.body.classList.toggle('smr-kid',on);SMR.mode='me';SMR.sel=-1;smRInert(on);
  try{if(on){const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(f){const p=f.call(el);if(p&&p.catch)p.catch(()=>{});}}
    else if(document.fullscreenElement||document.webkitFullscreenElement){const f=document.exitFullscreen||document.webkitExitFullscreen;if(f){const p=f.call(document);if(p&&p.catch)p.catch(()=>{});}}}catch(e){}
  smRWake(on);smRRender();const w=$('#smRWrap');if(w){w.scrollTop=0;if(on)try{w.scrollIntoView({block:'start'});}catch(e){}}if(!on)setView('rate');}
function smRGate(){const pin=String(smD().pin||'').replace(/\D/g,'');if(!pin){SMR.mode='t';smRRender();return;}
  let d=$('#smRPin');if(!d){d=document.createElement('dialog');d.id='smRPin';d.className='smr-pin';document.body.appendChild(d);}
  let v='';const draw=()=>{d.innerHTML='<p>'+esc(smTeacher())+'’s PIN</p><div class="smr-pd">'+Array.from({length:pin.length},(_,i)=>'<i class="'+(i<v.length?'on':'')+'"></i>').join('')+'</div><div class="smr-pk">'+[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':'<button type="button" data-k="'+k+'">'+k+'</button>').join('')+'</div><button type="button" class="smr-b" data-k="x">Cancel</button>';};
  draw();d.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;if(k==='x'){d.close();return;}if(k==='⌫')v=v.slice(0,-1);else if(v.length<pin.length)v+=k;draw();
    if(v.length===pin.length){if(v===pin){d.close();SMR.mode='t';smRRender();}else{v='';d.classList.add('no');setTimeout(()=>{d.classList.remove('no');draw();},450);}}};
  if(d.showModal)d.showModal();else d.setAttribute('open','');}
document.addEventListener('pointerdown',e=>{if(e.target.closest('#smRate'))smRAudio();const h=e.target.closest('#smRHold');if(!h)return;h.classList.add('holding');clearTimeout(SMR.hold);SMR.hold=setTimeout(()=>{h.classList.remove('holding');smRGate();},1000);});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,e=>{if(!SMR.hold)return;const h=$('#smRHold');if(h&&(t!=='pointerleave'||e.target===h)){h.classList.remove('holding');clearTimeout(SMR.hold);SMR.hold=0;}},true));

/* ---------------- taps ---------------- */
function smRSet(ti,l){const day=smRDay(SMR.date,true),M=smRModel(day),who=smRWho(M),k=SMR.sel+'_'+ti;const before=smRTotals(M,day).pts;
  if(!day.sig)day.sig=smRSig(M);if(day[who][k]===l)delete day[who][k];else day[who][k]=l;
  const T=smRTotals(M,day);smRRender();
  if(smD().rspeak&&day[who][k]===l)smRSay(smRWord(M,l));
  if(T.need!=null&&before<T.need&&T.pts>=T.need&&!day.fin)smRParty(T);}
function smRParty(T){let fx=$('#smRFx');if(!fx){fx=document.createElement('div');fx.id='smRFx';document.body.appendChild(fx);}
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,C=['#f5c518','#e5484d','#1f6fd1','#3fa34d','#f08c00','#7b3fa0'];
  let c='';if(!calm)for(let i=0;i<70;i++)c+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+C[i%C.length]+';animation-delay:'+(Math.random()*.8).toFixed(2)+'s;animation-duration:'+(1.8+Math.random()*1.4).toFixed(2)+'s;transform:rotate('+Math.round(Math.random()*360)+'deg)"></i>';
  fx.innerHTML='<div class="smr-conf">'+c+'</div><div class="smr-party" role="status"><div class="smr-pbig">'+smGlyph('st',84).replace('fill="#fff"','fill="#f5c518"')+'</div><b>'+(smName()?esc(smName())+', you':'You')+' reached your goal!</b><span>'+T.pts+' points today</span><button type="button" class="smr-b pri" id="smRFxOk">Yay!</button></div>';
  fx.hidden=false;smRChime();clearTimeout(SMR.fx);SMR.fx=setTimeout(()=>{fx.hidden=true;},7000);}
async function smRFinish(){const day=smRDay();if(!smRAny(day))return;const M=smRModel(day),T=smRTotals(M,day),met=T.need!=null&&T.pts>=T.need;
  if(!(await nbhUI.confirm('Finish '+smRLong(SMR.date)+'?\n'+T.pts+' of '+T.poss+' points'+(T.need!=null?(met?': the goal is met.':': the goal ('+T.need+') is not met.'):'.')+(T.wait?'\n'+T.wait+' rating'+smPoss(T.wait)+' not matched count as the student rated.':'')+'\nThe day goes into the Record as one row'+(day.fin?' (its row is updated)':'')+'.',{ok:'Finish the day'})))return;
  const row={date:smRShort(SMR.date),ph:curPhase(),goal:S.meta.goal||'',pts:String(T.pts),poss:String(T.poss),m:M.match?String(T.m):'',n:M.match?String(T.n):'',met,tgp:['match','contract','smiley','cico'].includes(M.sys)?T.tp.join(','):'',
    note:'Rated on the iPad'+(day.note?': '+day.note.replace(/\s+/g,' ').slice(0,200):''),src:'ipad:'+SMR.date};
  let i=S.log.findIndex(r=>r.src==='ipad:'+SMR.date);
  if(i<0){const j=S.log.findIndex(r=>!r.src&&String(r.date||'').trim()===row.date);if(j>=0&&(await nbhUI.confirm('The Record already has a row for '+row.date+', entered by hand. Replace it with the day rated on the iPad?\nCancel keeps it and adds a row.',{ok:'Replace'})))i=j;}
  if(i>=0)S.log[i]=Object.assign({},S.log[i],row);else S.log.push(row);
  day.fin=new Date().toISOString();renderL();renderRecord();smRRender();
  nbhUI.toast('The day is in the Record: '+T.pts+' of '+T.poss+' points'+(T.need!=null?(met?', goal met.':', goal not met.'):'.')+(smStore().length?' Tap the reward chosen.':''),{kind:'ok'});}
document.addEventListener('click',async e=>{const t=e.target;if(t.closest('#smRFxOk')){$('#smRFx').hidden=true;return;}
  if(!t.closest('#smRate'))return;smRAudio();const day0=smRDay()||smREmpty(),M=smRModel(day0);let b;
  if((b=t.closest('[data-rl]'))&&M){smRSet(+b.dataset.rt,+b.dataset.rl);return;}
  if((b=t.closest('[data-rgo]'))&&M){SMR.sel=Math.max(0,Math.min(M.rows.length-1,SMR.sel+(+b.dataset.rgo)));smRRender();if(smD().rspeak&&SMR.mode==='me')smRSayPeriod(M);return;}
  if((b=t.closest('[data-rsel]'))&&M){SMR.sel=+b.dataset.rsel;smRRender();return;}
  if((b=t.closest('[data-rsay]'))&&M){const k=b.dataset.rsay;if(k==='p')smRSayPeriod(M);else{const q=M.tg[+k];smRSay(q.word+(q.cue?'. '+q.cue:''));}return;}
  if((b=t.closest('[data-rmode]'))){SMR.mode=b.dataset.rmode;SMR.modeSet=true;smRRender();return;}
  if((b=t.closest('[data-rrem]'))){const d=smRDay(SMR.date,true),r=SMR.sel;d.rem[r]=Math.max(0,Math.min(99,(d.rem[r]||0)+(+b.dataset.rrem)));if(!d.rem[r])delete d.rem[r];smRRender();return;}
  if((b=t.closest('[data-ralt]'))){const d=smRDay(SMR.date,true),v=b.dataset.ralt==='1';if(d.alt===v)return;
    if(smRAny(d)&&!(await nbhUI.confirm('Change today’s schedule? The ratings already tapped stay with the period in the same place on the other schedule.',{ok:'Change'})))return;d.alt=v;SMR.sel=-1;smRRender();return;}
  if((b=t.closest('[data-rwf]'))){const o=smStore()[+b.dataset.rwf];if(!o)return;const d=smRDay(SMR.date,true);
    if(d.fin){const same=d.rw===o.n;d.rw=same?'':o.n;d.spent=same||!smD().bank?'':(o.p||'');}else d.wf=d.wf===o.n?'':o.n;smRRender();return;}
  if(t.closest('#smRKid')){smRKid(true);return;}
  if(t.closest('#smRKidOff')){smRKid(false);return;}
  if((b=t.closest('#smRHold'))&&e.detail===0){smRGate();return;}   /* a keyboard press opens it at once */
  if(t.closest('#smRFin')){smRFinish();return;}
  if(t.closest('#smRPrint')){smExtraPrint(smRPage(SMR.date),'landscape');return;}
  if(t.closest('#smRCueOn')){smRAudio();SMR.cue=true;SMR.cueAt=Date.now()+smRCueNext();smRWake(true);smRRender();return;}
  if(t.closest('#smRCueOff')){SMR.cue=false;smRWake(false);smRRender();return;}
  if((b=t.closest('[data-ropen]'))){SMR.date=b.dataset.ropen;SMR.sel=-1;smRRender();$('#smRate').scrollIntoView({block:'start'});return;}
  if((b=t.closest('[data-rprint]'))){smExtraPrint(smRPage(b.dataset.rprint),'landscape');return;}
  if((b=t.closest('[data-rdel]'))){const k=b.dataset.rdel;if(!(await nbhUI.confirm('Delete the ratings of '+smRLong(k)+'? Its row in the Record is deleted with them.',{ok:'Delete',danger:true})))return;
    delete S.days[k];const i=S.log.findIndex(r=>r.src==='ipad:'+k);if(i>=0)S.log.splice(i,1);renderL();renderRecord();smRRender();return;}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='smRDate'){if(/^\d{4}-\d{2}-\d{2}$/.test(el.value)){SMR.date=el.value;SMR.sel=-1;SMR.begun=-2;}smRRender();return;}
  if(el.closest&&el.closest('#smRate')&&el.dataset.d!==undefined){if(el.dataset.d==='pin'){smD().pin=String(el.value).replace(/\D/g,'').slice(0,6);}smRRender();}});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.rnote!==undefined){const d=smRDay(SMR.date,true);d.note=el.value.slice(0,2000);}});
document.addEventListener('keydown',e=>{if(!SMR.kid)return;if(e.key==='Escape'&&SMR.mode==='t'){smRKid(false);}});

/* ---------------- hooks: the views, a saved file, the simulation ---------------- */
const smRSetView0=setView;
setView=function(v){smRSetView0(v);if(v==='rate'){SMR.sel=-1;SMR.begun=-2;SMR.modeSet=false;smRRender();if(smD().rchime)smRWake(true);}else smRWake(false);};
const smRRenderAll0=renderAll;
renderAll=function(){smREnsure();smRRenderAll0();smRRender();};
function smRFromFile(s,o){o.days={};const D=s&&s.days&&typeof s.days==='object'&&!Array.isArray(s.days)?s.days:{};
  const str=(v,n)=>v==null||typeof v==='object'?'':String(v).slice(0,n);
  const cells=v=>{const r={};if(v&&typeof v==='object'&&!Array.isArray(v))Object.keys(v).slice(0,800).forEach(c=>{if(/^\d{1,2}_\d$/.test(c)&&Number.isInteger(v[c])&&v[c]>=0&&v[c]<10)r[c]=v[c];});return r;};
  Object.keys(D).slice(0,1000).forEach(k=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(k))return;const x=D[k];if(!x||typeof x!=='object'||Array.isArray(x))return;
    const rem={};if(x.rem&&typeof x.rem==='object'&&!Array.isArray(x.rem))Object.keys(x.rem).slice(0,60).forEach(c=>{if(/^\d{1,2}$/.test(c)&&Number.isInteger(x.rem[c])&&x.rem[c]>0&&x.rem[c]<100)rem[c]=x.rem[c];});
    o.days[k]={alt:!!x.alt,me:cells(x.me),t:cells(x.t),rem,wf:str(x.wf,120),rw:str(x.rw,120),spent:str(x.spent,8).replace(/[^\d.]/g,''),note:str(x.note,2000),fin:/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(str(x.fin,40))?str(x.fin,40):'',sig:str(x.sig,400)};});
  if(o.d)o.d.pin=String(o.d.pin||'').replace(/\D/g,'').slice(0,6);if(o.d&&!o.d.pin)delete o.d.pin;
  if(o.d&&o.d.rcue&&o.d.rcue!=='flash')delete o.d.rcue;
  return o;}
const smRFromFile0=fromFile;
fromFile=function(d){const o=smRFromFile0(d);if(!o)return o;return smRFromFile(d.S,o);};
/* the simulation: the first three periods of today rated on the iPad, one rating different, two reminders */
function smRSim(){const iso=smRISO();S.days={};
  S.days[iso]={alt:false,me:{'0_0':0,'0_1':0,'0_2':0,'1_0':0,'1_1':1,'1_2':0,'2_0':0,'2_1':0,'2_2':0},t:{'0_0':0,'0_1':0,'0_2':0,'1_0':0,'1_1':1,'1_2':0,'2_0':0,'2_1':1,'2_2':0},
    rem:{'1':1,'2':2},wf:'Feed the class fish',rw:'',spent:'',note:'',fin:'',sig:''};
  SMR.date=iso;SMR.sel=-1;}
