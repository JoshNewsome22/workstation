const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'–':(Math.round(v*10)/10).toFixed(0)+'%';
const NONE='–';
const unq=s=>String(s==null?'':s).trim().replace(/^["\u201c\u201d]+/,'').replace(/["\u201c\u201d]+$/,'');

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- the three faces: no external images ---- */
const FACE_FILL=['#f0cfcf','#f3e8c6','#c9e6c6'],FACE_MOUTH=['M7.5 16.5 q4.5 -4.5 9 0','M7.5 15.5 h9','M7.5 14.5 q4.5 4.5 9 0'];
const face=(k,cls)=>'<svg class="'+(cls||'face')+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="'+FACE_FILL[k-1]+'" stroke="#333" stroke-width="1.4"/><circle cx="8.5" cy="10" r="1.4" fill="#333"/><circle cx="15.5" cy="10" r="1.4" fill="#333"/><path d="'+FACE_MOUTH[k-1]+'" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SCALES={feel:['Not good','OK','Good'],agree:['Not really','A little','Yes'],want:['A little','Some','A lot']};
function facepick(cur,labels,attrs){return '<span class="facepick" '+attrs+'>'+[1,2,3].map(k=>'<button type="button" data-k="'+k+'" class="'+(String(cur)===String(k)?'on':'')+'" aria-pressed="'+(String(cur)===String(k))+'" aria-label="'+esc(labels[k-1])+'">'+face(k,'')+esc(labels[k-1])+'</button>').join('')+'</span>';}

/* ---- the interview items: a reading version and a younger version ---- */
const ITEMS=[
  {id:'like',box:'qLike',read:'What do you like to do at school, and outside school? What are you good at?',young:'What do you like to do? What are you good at?',hint:'Start here. Everyone has an answer to this one, and it tells you what the plan can use.',fq:'How do you feel about school most days?',fl:'feel'},
  {id:'before',box:'qBefore',read:'Think about the last time it happened. What was going on right before?',young:'What happens right before?',hint:'Use the student&rsquo;s word for the behavior. Ask about the last time, not about &ldquo;usually&rdquo;.',fq:'How do you feel right before it happens?',fl:'feel'},
  {id:'after',box:'qAfter',read:'What usually happens after? What do the adults do, and what do the other students do?',young:'What happens after?',hint:'Both the adults and the peers. Then: &ldquo;And then what?&rdquo;',fq:'How do you feel after?',fl:'feel'},
  {id:'rather',box:'qRather',read:'At that moment, what would you rather be doing, or rather have?',young:'What would you rather do instead?',hint:'The answer is the first draft of the replacement behavior and the reinforcer.',fq:'If you could do that instead, how would that be?',fl:'feel'},
  {id:'upset',box:'qUpset',read:'When you are upset, what helps you calm down? What makes it worse?',young:'What helps when you feel upset?',hint:'Both halves. &ldquo;What makes it worse&rdquo; is the list of things staff will stop doing.',fq:'Does it help?',fl:'agree'},
  {id:'who',box:'qWho',read:'Who at school helps you most? Who would you go to if something was wrong?',young:'Who helps you at school?',hint:'Named people. They are who should ask for assent and run the first sessions.',fq:'Is it easy to ask them for help?',fl:'agree'},
  {id:'change',box:'qChange',read:'If you could change one thing about school, what would it be?',young:'What do you want to change at school?',hint:'',fq:'',fl:''},
  {id:'goal',box:'qGoal',read:'What is a goal you have for yourself this year? Say it the way you would say it to a friend.',young:'What do you want to get better at?',hint:'Written in the student&rsquo;s words. Form GB-1 can carry it as the student&rsquo;s goal beside the plan&rsquo;s.',fq:'Do you think you can do it?',fl:'agree'},
  {id:'reward',box:'qReward',read:'What would be worth working for? What would you like to earn, and who would you like to hear it from?',young:'What would you like to earn?',hint:'Things, activities, time with someone, a message home. Form PA-1 tests the list.',fq:'How much do you want it?',fl:'want'}
];
/* v21.44 (B5): who hears what the student says, read aloud before the first question; a reading and a younger
   version, shown in the version chosen. The first line opens, the last asks, the rest are the points. Review this wording. */
const CONF={read:['Before we start, I want you to know who will hear what you tell me.',
  'I will write down what you say. The adults on your team at school and your parent or guardian may read it. It helps us make school better for you.',
  'This is not about getting you in trouble. I will not share what you say with other students.',
  'There are a few things I cannot keep private. If you tell me that someone is hurting you, or that you might hurt yourself or someone else, I have to tell people whose job is to keep you safe. That could be the school counselor or the principal, or sometimes people outside school whose job is to protect children. The law and school rules say I must. If that happens, I will try to tell you first.',
  'Do you have any questions about that?'],
 young:['Before we start, here is who hears what you tell me.',
  'I will write down what you say. Your teachers and the grown-ups who take care of you at home may read it. It helps them make school better for you.',
  'This is not to get you in trouble.',
  'If you tell me someone is hurting you, or that you might hurt yourself or someone else, I have to tell a grown-up whose job is to keep kids safe. That is a rule I have to follow.',
  'Do you want to ask me anything about that?']};
function renderConf(){const L=CONF[young()?'young':'read'];
  $('#siConfText').innerHTML='<p class="say">'+esc(L[0])+'</p><ul class="say">'+L.slice(1,-1).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p class="say">'+esc(L[L.length-1])+'</p>';}
/* what the student says happens before and after, each tagged with the function it points to */
const FN={att:'attention',esc:'escape',tan:'tangible',auto:'automatic'};
const BEF=[
  {id:'b_hard',f:'esc',read:'I am given work that is too hard, too long or boring',young:'The work is hard or boring'},
  {id:'b_told',f:'esc',read:'Someone tells me what to do, or corrects me',young:'Someone tells me what to do'},
  {id:'b_stop',f:'tan',read:'I have to stop something I like, or I am told no',young:'I have to stop something fun, or I hear no'},
  {id:'b_want',f:'tan',read:'Someone else has something I want',young:'Someone has what I want'},
  {id:'b_alone',f:'att',read:'No one is paying attention to me; the adults are busy with others',young:'Nobody is paying attention to me'},
  {id:'b_peer',f:'att',read:'A classmate bothers me or teases me',young:'Someone bothers me'},
  {id:'b_noise',f:'auto',read:'It is loud, crowded or bright, or I am tired or hungry',young:'It is too loud, or I am tired'},
  {id:'b_bored',f:'auto',read:'Nothing in particular; it happens when I am alone or there is nothing to do',young:'Nothing is happening'}
];
const AFT=[
  {id:'a_talk',f:'att',read:'An adult comes over and talks to me',young:'A grown-up comes and talks to me'},
  {id:'a_look',f:'att',read:'Classmates look at me or laugh',young:'Kids look at me or laugh'},
  {id:'a_out',f:'esc',read:'I get out of the work, or it gets shorter or easier',young:'I do not have to do the work'},
  {id:'a_sent',f:'esc',read:'I get sent out of the room or to the office',young:'I get sent out'},
  {id:'a_get',f:'tan',read:'I get the thing, or I get to keep it',young:'I get the thing'},
  {id:'a_do',f:'tan',read:'I get to do what I wanted',young:'I get to do what I wanted'},
  {id:'a_calm',f:'auto',read:'Nothing changes around me; it just feels better or calmer',young:'It just feels better'},
  {id:'a_lose',f:'',read:'I get in trouble, or I lose points or a privilege',young:'I get in trouble'}
];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{},iv:{},hard:[],ab:[],wb:[],al:[],pc:[],pr:[]};}
let S=blank();
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};if(!S.iv||typeof S.iv!=='object')S.iv={};
  ['hard','ab','wb','al','pc','pr'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  ITEMS.forEach(it=>{if(!S.iv[it.id]||typeof S.iv[it.id]!=='object')S.iv[it.id]={a:'',s:''};});
  while(S.hard.length<3)S.hard.push(hardRow());while(S.ab.length<3)S.ab.push({beh:'',ex:''});while(S.wb.length<3)S.wb.push({beh:'',ex:''});
  while(S.al.length<3)S.al.push(alRow());while(S.pc.length<3)S.pc.push({name:'',words:'',rank:'',say:''});while(S.pr.length<3)S.pr.push(prRow());
  if(!S.meta.ver)S.meta.ver='read';
}
const hardRow=()=>({act:'',rate:'',hard:false,long:false,boring:false,noisy:false,people:false,note:''});
const alRow=()=>({date:'',sess:'',got:'',wmin:'',changed:'',note:''});
const prRow=()=>({date:'',a:'',b:'',chose:'',note:''});

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function setVer(v){S.meta.ver=v==='young'?'young':'read';document.body.classList.toggle('ver-young',S.meta.ver==='young');$$('#verSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ver===S.meta.ver)));$('#verPrint').textContent=S.meta.ver==='young'?'Younger student version (faces)':'Reading version (middle and high school)';}
$$('#verSeg button').forEach(b=>b.addEventListener('click',()=>{setVer(b.dataset.ver);renderConf();renderItems();renderHard();renderLists();renderSummary();}));
const young=()=>S.meta.ver==='young';
const wordFor=o=>young()?o.young:o.read;

/* ---------------- the interview ---------------- */
function renderItems(){
  ITEMS.forEach(it=>{const v=S.iv[it.id];const beh=S.meta.beh?S.meta.beh:'it';
    const q=(young()?it.young:it.read).replace(/\bit happened\b/,beh==='it'?'it happened':beh+' happened').replace(/\bit happens\b/,beh==='it'?'it happens':beh+' happens');
    $('#'+it.box).innerHTML='<div class="qcard"><p class="q">'+esc(q)+(it.hint?'<small>'+it.hint+'</small>':'')+'</p>'+
      (it.fq?'<div class="faces for-young"><span class="fq">'+esc(it.fq)+'</span>'+facepick(v.s,SCALES[it.fl],'data-iv="'+it.id+'"')+'</div>':'')+
      '<textarea data-ivt="'+it.id+'" rows="2" data-nbh-nowording placeholder="in the student&rsquo;s words" aria-label="'+esc(q)+'">'+esc(v.a)+'</textarea></div>';});
}
function renderHard(){
  $('#hardTbl tbody').innerHTML=S.hard.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="hard" data-i="'+i+'" data-f="act" value="'+esc(r.act)+'" placeholder="Math, after lunch, the bus"></td>'+
    '<td class="for-young">'+facepick(r.rate,SCALES.feel,'data-hard="'+i+'"')+'</td>'+
    ['hard','long','boring','noisy','people'].map(f=>'<td class="ck"><input type="checkbox" data-r="hard" data-i="'+i+'" data-f="'+f+'"'+(r[f]?' checked':'')+' aria-label="'+f+' row '+(i+1)+'"></td>').join('')+
    '<td><input data-r="hard" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'"></td>'+delCell('hard',i)+'</tr>').join('');
}
function renderLists(){
  const mk=(list,box)=>{$('#'+box).innerHTML=list.map(o=>'<label class="ck"><input type="checkbox" data-c="'+o.id+'"'+(S.chk[o.id]?' checked':'')+'><span>'+esc(wordFor(o))+(o.f?'<span class="tag">'+FN[o.f]+'</span>':'<span class="tag">not counted</span>')+'</span></label>').join('');};
  mk(BEF,'befList');mk(AFT,'aftList');
}
function hypothesis(){
  const c={att:0,esc:0,tan:0,auto:0};const bef=BEF.filter(o=>S.chk[o.id]),aft=AFT.filter(o=>S.chk[o.id]);
  bef.concat(aft).forEach(o=>{if(o.f)c[o.f]++;});
  const order=Object.keys(c).filter(k=>c[k]>0).sort((a,b)=>c[b]-c[a]);const top=order.filter(k=>c[k]===c[order[0]]);
  return{c,bef,aft,order,top};
}
function hypLine(){
  const h=hypothesis(),v=S.iv,beh=S.meta.beh||'the behavior';
  if(!h.bef.length&&!h.aft.length&&!v.before.a&&!v.after.a)return '';
  const low=s=>/^I\b/.test(s)?s:s.charAt(0).toLowerCase()+s.slice(1);
  let s='Student&rsquo;s report (SI-1'+(S.meta.date?', '+esc(S.meta.date):'')+'): ';
  s+='before '+esc(beh)+', '+(h.bef.length?h.bef.map(o=>low(o.read)).join('; '):(v.before.a?'&ldquo;'+esc(v.before.a)+'&rdquo;':'nothing marked'))+'. ';
  s+='Afterwards, '+(h.aft.length?h.aft.map(o=>low(o.read)).join('; '):(v.after.a?'&ldquo;'+esc(v.after.a)+'&rdquo;':'nothing marked'))+'. ';
  if(h.order.length)s+='What the student names points to <b>'+h.top.map(k=>FN[k]).join(' and ')+'</b> ('+h.order.map(k=>FN[k]+' '+h.c[k]).join(', ')+').';
  else s+='Nothing the student marked carries a function tag.';
  if(v.rather.a)s+=' Would rather: &ldquo;'+esc(unq(v.rather.a))+'&rdquo;';
  return s;
}
function renderHyp(){
  const h=hypothesis();
  $('#hypMetrics').innerHTML=Object.keys(FN).map(k=>'<div class="metric"><b>'+FN[k]+'</b><div class="val">'+h.c[k]+'</div><div class="sub">lines the student marked</div></div>').join('');
  const line=hypLine();
  $('#hypOut').innerHTML=line?'<div class="hypline"><b>The student&rsquo;s hypothesis, as reported</b>'+line+'</div><p class="hint">Copy this line into Form FS-1 under the student interview. It is not a function; it is what the student said.</p>':'<div class="verdict v-mid">No lines marked yet. The summary line is written from the before and after boxes once the student has answered.</div>';
}

/* ---------------- assent ---------------- */
function renderAB(){
  $('#abTbl tbody').innerHTML=S.ab.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="ab" data-i="'+i+'" data-f="beh" value="'+esc(r.beh)+'" placeholder="Says yes or nods when asked; picks up the materials; walks to the table"></td><td><input data-r="ab" data-i="'+i+'" data-f="ex" value="'+esc(r.ex)+'"></td>'+delCell('ab',i)+'</tr>').join('');
  $('#wbTbl tbody').innerHTML=S.wb.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="wb" data-i="'+i+'" data-f="beh" value="'+esc(r.beh)+'" placeholder="Says no or stop; pushes the materials away; turns away for more than 10 seconds; covers ears"></td><td><input data-r="wb" data-i="'+i+'" data-f="ex" value="'+esc(r.ex)+'"></td>'+delCell('wb',i)+'</tr>').join('');
}
function renderAL(){
  $('#alTbl tbody').innerHTML=S.al.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="al" data-i="'+i+'" data-f="date" value="'+esc(r.date)+'"></td><td><input data-r="al" data-i="'+i+'" data-f="sess" value="'+esc(r.sess)+'"></td>'+
    '<td><select data-r="al" data-i="'+i+'" data-f="got" aria-label="Assent obtained, session '+(i+1)+'"><option value=""></option><option'+(r.got==='Y'?' selected':'')+'>Y</option><option'+(r.got==='N'?' selected':'')+'>N</option></select></td>'+
    '<td><input data-r="al" data-i="'+i+'" data-f="wmin" value="'+esc(r.wmin)+'" style="text-align:center"></td><td><input data-r="al" data-i="'+i+'" data-f="changed" value="'+esc(r.changed)+'"></td><td><input data-r="al" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'"></td>'+delCell('al',i,'session')+'</tr>').join('');
}
const isSess=r=>!!(r.date||r.sess||r.got);
const isWd=r=>r.got==='N'||num(r.wmin)!=null;
function assentStats(){
  const rows=S.al.filter(isSess),n=rows.length,w=rows.filter(isWd).length,got=rows.filter(r=>r.got==='Y').length;
  const last=rows.slice(-10),wl=last.filter(isWd).length;let run=0;for(let i=rows.length-1;i>=0&&isWd(rows[i]);i--)run++;
  const thr=num(S.meta.a_thr)==null?25:num(S.meta.a_thr);
  return{n,w,got,share:n?w/n*100:null,nl:last.length,wl,shareL:last.length?wl/last.length*100:null,run,thr};
}
function renderAssent(){
  const a=assentStats();
  $('#alMetrics').innerHTML='<div class="metric"><b>Sessions logged</b><div class="val">'+a.n+'</div><div class="sub">'+a.got+' with assent at the start</div></div>'+
    '<div class="metric"><b>Withdrawals</b><div class="val">'+a.w+'</div><div class="sub">declined, or withdrew during the session</div></div>'+
    '<div class="metric"><b>Share with withdrawal</b><div class="val">'+pct(a.share)+'</div><div class="sub">last '+a.nl+' sessions: '+pct(a.shareL)+'</div></div>'+
    '<div class="metric"><b>Review threshold</b><div class="val">'+a.thr+'%</div><div class="sub">working convention; '+a.run+' in a row now</div></div>';
  let v='';
  if(!a.n)v='<div class="verdict v-mid">No sessions logged yet. Log every session, including the ones where assent was not obtained.</div>';
  else if(a.share>a.thr||a.run>=3)v='<div class="verdict v-no">Withdrawal in '+pct(a.share)+' of sessions'+(a.run>=3?', and '+a.run+' sessions in a row':'')+', above the '+a.thr+'% working convention. Review the procedure with the student and the case BCBA: what is being asked, how long, with whom, and what the student would rather do. Repeat the preference page before the next session. Each withdrawal was honored on the day; the question now is the plan.</div>';
  else if(a.w>0)v='<div class="verdict v-mid">Withdrawal in '+pct(a.share)+' of sessions ('+a.w+' of '+a.n+'), at or below the '+a.thr+'% working convention. Check that each row says what was changed; a withdrawal with nothing changed is a missed signal.</div>';
  else v='<div class="verdict v-ok">Assent obtained and kept in every logged session ('+a.n+'). Keep asking at the start of each session and at each new activity.</div>';
  $('#assentVerdict').innerHTML=v;
}

/* ---------------- preference ---------------- */
function renderPC(){
  $('#pcTbl tbody').innerHTML=S.pc.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="pc" data-i="'+i+'" data-f="name" value="'+esc(r.name)+'" placeholder="Break card (FCT); first-then schedule; token board"></td><td><input data-r="pc" data-i="'+i+'" data-f="words" value="'+esc(r.words)+'" placeholder="&ldquo;the break card&rdquo;"></td><td><input data-r="pc" data-i="'+i+'" data-f="rank" value="'+esc(r.rank)+'" style="text-align:center"></td><td><input data-r="pc" data-i="'+i+'" data-f="say" value="'+esc(r.say)+'"></td>'+delCell('pc',i,'component')+'</tr>').join('');
}
const compName=i=>{const c=S.pc[+i];return c?(c.words||c.name||('Component '+(+i+1))):'';};
function renderPR(){
  const opts=sel=>'<option value=""></option>'+S.pc.map((c,i)=>(c.name||c.words)?'<option value="'+i+'"'+(String(sel)===String(i)?' selected':'')+'>'+esc((i+1)+'. '+(c.words||c.name))+'</option>':'').join('');
  $('#prTbl tbody').innerHTML=S.pr.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="pr" data-i="'+i+'" data-f="date" value="'+esc(r.date)+'"></td>'+
    '<td><select data-r="pr" data-i="'+i+'" data-f="a" aria-label="Offered A, choice '+(i+1)+'">'+opts(r.a)+'</select></td><td><select data-r="pr" data-i="'+i+'" data-f="b" aria-label="Offered B, choice '+(i+1)+'">'+opts(r.b)+'</select></td>'+
    '<td><select data-r="pr" data-i="'+i+'" data-f="chose" aria-label="Chose, choice '+(i+1)+'"><option value=""></option>'+['A','B','Neither'].map(x=>'<option'+(r.chose===x?' selected':'')+'>'+x+'</option>').join('')+'</select></td>'+
    '<td><input data-r="pr" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'"></td>'+delCell('pr',i,'choice')+'</tr>').join('');
}
function prefStats(){
  const st=S.pc.map((c,i)=>({i,name:c.words||c.name,off:0,ch:0,rank:num(c.rank)}));
  S.pr.forEach(r=>{if(r.a===''||r.b===''||!r.chose)return;const A=st[+r.a],B=st[+r.b];if(!A||!B)return;A.off++;B.off++;if(r.chose==='A')A.ch++;if(r.chose==='B')B.ch++;});
  const used=st.filter(s=>s.name);used.forEach(s=>{s.p=s.off?s.ch/s.off*100:null;});
  const byChoice=used.filter(s=>s.off).slice().sort((a,b)=>b.p-a.p||b.ch-a.ch);
  const offers=S.pr.filter(r=>r.a!==''&&r.b!==''&&r.chose).length;
  const top=byChoice[0]&&byChoice[0].off>=3&&byChoice[0].p>=66.6?byChoice[0]:null;
  const least=byChoice.length>1?byChoice[byChoice.length-1]:null;
  return{used,byChoice,offers,top,least};
}
function renderPref(){
  const p=prefStats();
  if(!p.used.length){$('#prefOut').innerHTML='<div class="verdict v-mid">List the plan&rsquo;s components first.</div>';return;}
  let s='<div class="grid-wrap"><table class="rt" id="prefTbl"><thead><tr><th>Component</th><th>Times offered</th><th>Times chosen</th><th>Chosen</th><th>Rank by choice</th><th>Stated rank</th></tr></thead><tbody>';
  p.used.forEach(c=>{const rk=p.byChoice.findIndex(x=>x.i===c.i);s+='<tr><td>'+esc((c.i+1)+'. '+c.name)+'</td><td class="num">'+c.off+'</td><td class="num">'+c.ch+'</td><td class="num">'+pct(c.p)+'</td><td class="num">'+(rk>=0?rk+1:NONE)+'</td><td class="num">'+(c.rank==null?NONE:c.rank)+'</td></tr>';});
  s+='</tbody></table></div>';
  if(!p.offers)s+='<div class="verdict v-mid">No choices recorded yet. Offer pairs until the same component is chosen most of the time; three offers of each is the working minimum.</div>';
  else if(p.top){const dis=p.top.rank!=null&&p.top.rank!==1;s+='<div class="verdict v-ok">Preferred: <b>'+esc(p.top.name)+'</b>, chosen '+p.top.ch+' of '+p.top.off+' times offered ('+pct(p.top.p)+'), over '+p.offers+' choices.'+(p.least&&p.least.p<=33.4?' Least chosen: '+esc(p.least.name)+' ('+pct(p.least.p)+').':'')+(dis?' The student&rsquo;s stated rank puts it at '+p.top.rank+'; choice and report disagree, so ask again and go with what the student does.':'')+'</div>';}
  else s+='<div class="verdict v-mid">'+p.offers+' choices recorded; no component yet chosen on two thirds or more of at least three offers (working convention). Keep offering pairs, and vary which side each one is shown on.</div>';
  $('#prefOut').innerHTML=s;
}

/* ---------------- the summary page ---------------- */
function renderSummary(){
  const m=S.meta,v=S.iv,a=assentStats(),p=prefStats();const q=s=>s?'<p class="quote">&ldquo;'+esc(unq(s))+'&rdquo;</p>':'<p class="quote" style="color:#777">not answered</p>';
  const faceOf=k=>k?face(+k):'';
  const modes=[['m_verbal','spoke'],['m_point','pointed'],['m_written','wrote'],['m_device','device or typed'],['m_aloud','questions read aloud'],['m_breaks','took a break']].filter(x=>S.chk[x[0]]).map(x=>x[1]).join(', ');
  let s='<div class="s-title">Student Interview, Assent and Treatment Preference: Summary</div><div class="s-grid">'+
    [['Student',m.client],['ID',m.sid],['Grade',m.grade],['Age',m.age],['Interviewed by',(m.asker||'')+(m.role?' ('+m.role+')':'')],['Where',m.where],['Date',m.date],['How the student answered',modes||NONE],['Version',m.ver==='young'?'younger student (faces)':'reading'],['Case BCBA',m.bcba]].map(x=>'<div><b>'+x[0]+':</b> '+esc(x[1]||NONE)+'</div>').join('')+'</div>';
  /* v21.44 (B5): whether the student heard who reads the answers before the first question */
  s+='<p><b>Who hears the answers:</b> '+(S.chk.conf_read?'read aloud to the student before the first question ('+(m.ver==='young'?'younger':'reading')+' version).':'<b>not recorded as read aloud</b> before the first question.')+(m.conf_say?' The student said: &ldquo;'+esc(unq(m.conf_say))+'&rdquo;':'')+'</p>';
  s+='<h3>What the student said</h3>';
  s+='<p><b>Likes and does well:</b></p>'+q(v.like.a);
  const hard=S.hard.filter(r=>r.act);
  if(hard.length)s+='<p><b>Hard classes or activities:</b> '+hard.map(r=>esc(r.act)+(young()&&r.rate?' '+faceOf(r.rate):'')+(['hard','long','boring','noisy','people'].filter(f=>r[f]).length?' (too '+['hard','long'].filter(f=>r[f]).concat(['boring','noisy','people'].filter(f=>r[f]).map(f=>f==='people'?'the people':f)).join(', ').replace('too boring','boring').replace('too noisy','noisy').replace('too the people','the people')+')':'')).join('; ')+'.</p>';
  const line=hypLine();
  s+='<div class="hyp"><b>Student&rsquo;s hypothesis (for FS-1):</b> '+(line||'not yet written; the before and after boxes are empty')+'</div>';
  s+='<p><b>Would rather:</b></p>'+q(v.rather.a)+'<p><b>What helps when upset, and what makes it worse:</b></p>'+q(v.upset.a)+'<p><b>Who helps:</b></p>'+q(v.who.a);
  s+='<p><b>Wants to change:</b></p>'+q(v.change.a)+'<p><b>Goal in the student&rsquo;s words:</b></p>'+q(v.goal.a)+'<p><b>Worth working for:</b></p>'+q(v.reward.a);
  if(young()){const fs=ITEMS.filter(it=>it.fq&&v[it.id].s).map(it=>esc(it.fq)+' '+faceOf(v[it.id].s)+' '+esc(SCALES[it.fl][+v[it.id].s-1]));if(fs.length)s+='<p><b>Faces:</b> '+fs.join(' &bull; ')+'</p>';}
  s+='<h3>Assent</h3>';
  s+='<p><b>Asked how:</b> '+esc(m.a_ask||NONE)+' <b>By:</b> '+esc(m.a_who||NONE)+' <b>When:</b> '+esc(m.a_when||NONE)+(m.a_scope?' <b>Applies to:</b> '+esc(m.a_scope):'')+'</p>';
  const ab=S.ab.filter(r=>r.beh),wb=S.wb.filter(r=>r.beh);
  s+='<p><b>Assent looks like:</b> '+(ab.length?ab.map(r=>esc(r.beh)).join('; '):NONE)+'</p><p><b>Withdrawal looks like:</b> '+(wb.length?wb.map(r=>esc(r.beh)).join('; '):NONE)+'</p>';
  const steps=[['w_pause','pause'],['w_choice','offer a choice'],['w_end','end the session if still no'],['w_note','note it'],['w_tell','tell the BCBA'],['w_nolose','nothing is lost for saying no']].filter(x=>S.chk[x[0]]).map(x=>x[1]).join(', ');
  s+='<p><b>When withdrawn:</b> '+(steps||NONE)+(m.w_steps?'. '+esc(m.w_steps):'')+'</p>';
  s+='<p><b>Log so far:</b> '+a.n+' sessions, '+a.w+' with withdrawal ('+pct(a.share)+'; threshold '+a.thr+'%, a working convention'+(a.n&&(a.share>a.thr||a.run>=3)?'; <b>review due</b>':'')+').</p>';
  s+='<h3>Treatment preference</h3>';
  if(p.used.length){s+='<table class="st"><tr><th>Component</th><th>Offered</th><th>Chosen</th><th>%</th><th>Stated rank</th></tr>'+p.used.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+c.off+'</td><td>'+c.ch+'</td><td>'+pct(c.p)+'</td><td>'+(c.rank==null?NONE:c.rank)+'</td></tr>').join('')+'</table>';
    s+='<p><b>Result:</b> '+(p.top?'preferred '+esc(p.top.name)+', chosen '+p.top.ch+' of '+p.top.off+' offers.':(p.offers?p.offers+' choices recorded; no clear preference yet.':'no choices recorded yet.'))+'</p>';}
  else s+='<p>No components listed yet.</p>';
  if(m.p_say)s+='<p><b>About the plan:</b></p>'+q(m.p_say);
  if(m.p_change)s+='<p><b>Changed because of it:</b> '+esc(m.p_change)+'</p>';
  if(m.p_next)s+='<p><b>Repeat on:</b> '+esc(m.p_next)+'</p>';
  s+='<div class="s-foot"><div>Student <span class="bl"></span></div><div>Interviewer <span class="bl"></span></div><div>Case BCBA <span class="bl"></span></div><div>Date <span class="bl"></span></div></div>';
  $('#sumOut').innerHTML=s;
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();setVer(S.meta.ver);bindMeta();renderConf();renderItems();renderHard();renderLists();renderHyp();renderAB();renderAL();renderAssent();renderPC();renderPR();renderPref();renderSummary();}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.ivt!==undefined){S.iv[el.dataset.ivt].a=el.value;renderHyp();renderSummary();return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'&&el.tagName!=='SELECT'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='al')renderAssent();else if(el.dataset.r==='pc'){renderPref();if(el.dataset.f==='name'||el.dataset.f==='words')renderPRSoon();}else if(el.dataset.r==='pr')renderPref();
    renderSumSoon();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(el.dataset.m==='beh')renderItemsSoon();if(el.dataset.m==='a_thr')renderAssent();renderSumSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.type==='checkbox'?el.checked:el.value;
    if(el.dataset.r==='al')renderAssent();if(el.dataset.r==='pr')renderPref();renderSummary();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderHyp();renderSummary();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderSummary();}
});
document.addEventListener('click',e=>{const b=e.target.closest('.facepick button');if(!b)return;const g=b.parentNode,k=b.dataset.k;
  let cur;if(g.dataset.iv!==undefined){cur=S.iv[g.dataset.iv];cur.s=cur.s===k?'':k;}else if(g.dataset.hard!==undefined){cur=S.hard[+g.dataset.hard];cur.rate=cur.rate===k?'':k;}else return;
  const now=g.dataset.iv!==undefined?cur.s:cur.rate;$$('button',g).forEach(x=>{x.classList.toggle('on',x.dataset.k===now);x.setAttribute('aria-pressed',String(x.dataset.k===now));});renderSummary();});
let sumT=0,prT=0,itT=0;function renderSumSoon(){clearTimeout(sumT);sumT=setTimeout(renderSummary,250);}
function renderPRSoon(){clearTimeout(prT);prT=setTimeout(renderPR,400);}
function renderItemsSoon(){clearTimeout(itT);itT=setTimeout(()=>{renderItems();renderHyp();},400);}
const addRow=(k,mk,max,fn)=>()=>{if(S[k].length>=max)return;S[k].push(mk());fn();};
const delRow=(k,min,fn)=>()=>{if(S[k].length<=min)return;S[k].pop();fn();};
$('#addH').addEventListener('click',addRow('hard',hardRow,12,()=>{renderHard();renderSummary();}));$('#delH').addEventListener('click',delRow('hard',1,()=>{renderHard();renderSummary();}));
$('#addAB').addEventListener('click',addRow('ab',()=>({beh:'',ex:''}),8,renderAB));$('#delAB').addEventListener('click',delRow('ab',1,()=>{renderAB();renderSummary();}));
$('#addWB').addEventListener('click',addRow('wb',()=>({beh:'',ex:''}),8,renderAB));$('#delWB').addEventListener('click',delRow('wb',1,()=>{renderAB();renderSummary();}));
$('#addAL').addEventListener('click',addRow('al',alRow,200,renderAL));$('#delAL').addEventListener('click',delRow('al',1,()=>{renderAL();renderAssent();renderSummary();}));
$('#addPC').addEventListener('click',addRow('pc',()=>({name:'',words:'',rank:'',say:''}),8,()=>{renderPC();renderPR();}));$('#delPC').addEventListener('click',delRow('pc',1,()=>{renderPC();renderPR();renderPref();renderSummary();}));
$('#addPR').addEventListener('click',addRow('pr',prRow,60,renderPR));$('#delPR').addEventListener('click',delRow('pr',1,()=>{renderPR();renderPref();renderSummary();}));
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  const has={hard:x=>x.act||x.note||x.rate||['hard','long','boring','noisy','people'].some(f=>x[f]),ab:x=>x.beh||x.ex,wb:x=>x.beh||x.ex,al:x=>x.date||x.sess||x.got||x.wmin||x.changed||x.note,pc:x=>x.name||x.words||x.rank||x.say,pr:x=>x.date||x.a!==''||x.b!==''||x.chose||x.note}[r];if(!has)return;
  let msg='Delete this row?\nWhat was entered in it is deleted.';const n=r==='pc'?S.pr.filter(p=>String(p.a)===String(i)||String(p.b)===String(i)).length:0;
  if(n)msg='Delete this component?\n'+n+' choice'+(n===1?'':'s')+' that offered it will lose that side; later components are renumbered.';
  if((has(row)||n)&&!(await nbhUI.confirm(msg,{ok:'Delete',danger:true})))return;S[r].splice(i,1);
  if(r==='pc')S.pr.forEach(p=>['a','b'].forEach(k=>{if(p[k]==='')return;const v=+p[k];if(v===i)p[k]='';else if(v>i)p[k]=String(v-1);}));
  if(!S[r].length)S[r].push({hard:hardRow,ab:()=>({beh:'',ex:''}),wb:()=>({beh:'',ex:''}),al:alRow,pc:()=>({name:'',words:'',rank:'',say:''}),pr:prRow}[r]());
  ({hard:()=>{renderHard();renderSummary();},ab:()=>{renderAB();renderSummary();},wb:()=>{renderAB();renderSummary();},al:()=>{renderAL();renderAssent();renderSummary();},pc:()=>{renderPC();renderPR();renderPref();renderSummary();},pr:()=>{renderPR();renderPref();renderSummary();}})[r]();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#sumPrintBtn').addEventListener('click',()=>{renderSummary();document.body.classList.add('si-sum-only');
  const off=()=>{document.body.classList.remove('si-sum-only');window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'SI-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`SI-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='SI-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const iv=obj('iv');ITEMS.forEach(it=>{const x=iv[it.id]&&typeof iv[it.id]==='object'?iv[it.id]:{};o.iv[it.id]={a:str(x.a),s:['1','2','3'].includes(str(x.s))?str(x.s):''};});
  const arr=(k,fields,n,bools)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={};fields.forEach(f=>{r[f]=(bools||[]).includes(f)?!!(x&&x[f]):str(x&&x[f]);});return r;}):[];
  o.hard=arr('hard',['act','rate','hard','long','boring','noisy','people','note'],12,['hard','long','boring','noisy','people']);o.hard.forEach(r=>{if(!['1','2','3'].includes(r.rate))r.rate='';});
  o.ab=arr('ab',['beh','ex'],8);o.wb=arr('wb',['beh','ex'],8);
  o.al=arr('al',['date','sess','got','wmin','changed','note'],200);o.al.forEach(r=>{if(!['Y','N'].includes(r.got))r.got='';});
  o.pc=arr('pc',['name','words','rank','say'],8);
  o.pr=arr('pr',['date','a','b','chose','note'],60);o.pr.forEach(r=>{if(!/^\d+$/.test(r.a)||+r.a>=o.pc.length)r.a='';if(!/^\d+$/.test(r.b)||+r.b>=o.pc.length)r.b='';if(!['A','B','Neither'].includes(r.chose))r.chose='';});
  o.meta.ver=o.meta.ver==='young'?'young':'read';
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='SI-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved SI-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form SI-1. Nothing was changed.':'That file could not be read as a saved SI-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved SI-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Record','#','Date','Session or offered A','Assent obtained or offered B','Withdrawn at minute or chose','What was changed or note','Note']];
  S.al.filter(isSess).forEach((r,i)=>out.push(['Assent log',i+1,r.date,r.sess,r.got,r.wmin,r.changed,r.note]));
  S.pr.filter(r=>r.a!==''||r.b!==''||r.chose).forEach((r,i)=>out.push(['Choice',i+1,r.date,compName(r.a),compName(r.b),r.chose,r.note,'']));
  prefStats().used.forEach((c,i)=>out.push(['Component result',i+1,'',c.name,'offered '+c.off,'chosen '+c.ch,c.p==null?'':c.p.toFixed(1)+'%','stated rank '+(c.rank==null?'':c.rank)]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='SI-1_assent-and-preference.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('interview');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated interview?\nThe interview, assent plan and preference record are filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const fmt=d=>(d.getMonth()+1)+'/'+d.getDate();const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const D=n=>fmt(step(n,-1)),Y=n=>{const d=step(n,-1);return (d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);};
  S=blank();
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'6',age:'11',beh:'when I walk out',asker:'Joshua Newsome, M.A., BCBA',role:'Case BCBA, with Ms. Ortiz (school counselor) sitting in',where:'Counseling office; the student chose it over the conference room',date:Y(14),mins:'35',lang:'English',paware:'Yes',bcba:'Joshua Newsome, M.A., BCBA',ver:'read',
    a_ask:'At the start of each session: "Do you want to do this with me now, or come back after lunch?" shown on two cards (now / later). During the session: "Keep going, or stop?" at each new task.',a_explain:'"We will practice asking for a break and then do about ten minutes of math. You can stop any time and nothing bad happens. You can earn drawing time."',a_who:'Ms. Ortiz for the first week, then Mr. Patel (math) once the student has met him in the office',a_when:'At the start of every session, and again at each change of task',a_scope:'Assessment and treatment sessions',a_rev:Y(13),
    w_steps:'1. "Okay, we can stop." Stop the task at once. 2. Offer the two cards: a different task, or a break. 3. If neither is taken within a minute, end the session and walk the student back. 4. Write the minute and what was changed. 5. Try again at the next scheduled time, not sooner.',w_change:'Shorter task (5 minutes), a different problem set, or a different adult; after two withdrawals in a row, the BCBA sits in on the next session',a_thr:'25',
    p_say:'"The break card is fine. I do not want the points thing where everyone can see it."',p_change:'The token board moved from the wall to a folder the student keeps. The first-then schedule stays (the teacher needs it for the class), explained to the student with the reason; the student agreed to try it for two weeks.',p_next:'At the first plan review (PR-1), or sooner if two withdrawals fall in one week',
    conf_say:'"So my mom will see it? Okay. Ms. Ortiz can stay."'};
  S.chk={conf_read:true,m_verbal:true,m_written:true,m_breaks:true,b_hard:true,b_told:true,b_peer:true,a_out:true,a_sent:true,a_talk:true,w_pause:true,w_choice:true,w_end:true,w_note:true,w_tell:true,w_nolose:true};
  const iv={like:'Drawing, mostly comics. Basketball at recess. I am good at remembering things people say. Science is okay when we do the experiments.',
    before:'Math, usually. Mr. Patel hands out the worksheet and it is like forty problems. Or Jaden says something about me and I am already mad.',
    after:'I walk out and go to the bathroom or the stairs. Then Ms. Ortiz comes and finds me and we talk. Sometimes I get sent to the office and I do not have to go back to math that day.',
    rather:'Do ten problems, not forty. Or do them on the computer. Not be in the same group as Jaden.',
    upset:'Walking helps. Being left alone for a few minutes helps. People following me and talking makes it worse. Being told to calm down makes it worse.',
    who:'Ms. Ortiz. Coach D at recess. Not the office.',
    change:'Smaller math worksheets. And people not saying "calm down" at me.',
    goal:'Get through math class without leaving, most days. Pass math.',
    reward:'Drawing time. A note home to my mom saying I did good, she would like that. Not candy.'};
  Object.keys(iv).forEach(k=>{S.iv[k]={a:iv[k],s:''};});S.iv.like.s='2';S.iv.before.s='1';S.iv.after.s='2';S.iv.rather.s='3';S.iv.upset.s='3';S.iv.who.s='3';S.iv.goal.s='2';S.iv.reward.s='3';
  S.hard=[{act:'Math (period 4)',rate:'1',hard:true,long:true,boring:false,noisy:false,people:true,note:'"Forty problems. And Jaden is in my group."'},
    {act:'Transition after lunch',rate:'2',hard:false,long:false,boring:false,noisy:true,people:true,note:'"The hallway is loud and everybody pushes."'},
    {act:'Reading (silent reading block)',rate:'2',hard:false,long:true,boring:true,noisy:false,people:false,note:'"Twenty-five minutes of just sitting."'},
    {act:'Science, when it is notes',rate:'2',hard:false,long:false,boring:true,noisy:false,people:false,note:'"Experiments are fine. Notes are not."'}];
  S.ab=[{beh:'Says "yes", "okay" or "sure", or picks the "now" card',ex:'Picked "now" and sat down at the table without being asked, '+D(9)},{beh:'Picks up the pencil or the materials within 30 seconds of the task being set out',ex:'Started problem 1 within 10 seconds'},{beh:'Stays at the table and answers questions about the task',ex:'Asked "which ones do I do" and started'}];
  S.wb=[{beh:'Says "no", "stop", "I am done" or "I want to go back"',ex:'"I am done" at minute 7, '+D(5)},{beh:'Stands up and moves toward the door, or picks the "later" card',ex:'Stood up and went to the door on '+D(8)},{beh:'Puts head down or turns the chair away for more than 30 seconds',ex:'Turned away after the second worksheet page'},{beh:'Pushes the materials away',ex:'Not yet seen in a session'}];
  S.al=[[D(12),'Baseline math probe, office','Y','','',''],[D(11),'Baseline math probe, office','Y','','',''],[D(10),'FCT teaching: break card, office','Y','','',''],[D(9),'FCT teaching: break card, office','Y','','',''],
    [D(8),'FCT + 10 math problems, office','Y','9','Task cut to 5 problems; break taken; came back','Stood up at the door; chose the break card when offered'],[D(7),'FCT + 10 math problems, office','Y','','',''],
    [D(6),'FCT + 10 problems, back of math room','N','','Moved to the office instead; session run there','Picked "later" at the door of the math room; said Jaden was looking'],[D(5),'FCT + 10 problems, back of math room','Y','7','Problem set changed to the computer version','"I am done"; finished 6 of 10 on the computer'],
    [D(4),'FCT + 10 problems, back of math room','Y','','','Jaden moved to another group this week'],[D(3),'FCT + 15 problems, math room','Y','','',''],[D(2),'FCT + 15 problems, math room','Y','','',''],[D(1),'FCT + 15 problems, math room, Mr. Patel running it','Y','','','']].map(r=>({date:r[0],sess:r[1],got:r[2],wmin:r[3],changed:r[4],note:r[5]}));
  S.pc=[{name:'Break card (FCT): ask for a 3-minute walk, up to 3 per class',words:'the break card',rank:'1',say:'"That is fine. Better than leaving."'},{name:'Shortened worksheet (10 problems, then choice of 5 more)',words:'the short worksheet',rank:'2',say:'"Yes. Ten is fine."'},
    {name:'Token board for staying in class, exchanged for drawing time',words:'the points thing',rank:'4',say:'"Not on the wall. Everyone sees it."'},{name:'First-then schedule on the desk',words:'the first-then card',rank:'3',say:'"I do not need it but okay."'}];
  S.pr=[[D(13),'0','2','A','Cards and a one-minute demonstration of each'],[D(13),'1','3','A','Cards'],[D(13),'0','1','A','Cards; "the card, because then I can go"'],[D(13),'2','3','B','Cards; "not the wall thing"'],[D(12),'1','2','A','After a 2-minute try of each'],[D(12),'0','3','A','After a 2-minute try'],[D(12),'3','1','B','Sides swapped'],[D(12),'2','0','B','Sides swapped; "the card"'],[D(12),'1','0','Neither','"Both are okay"']].map(r=>({date:r[0],a:r[1],b:r[2],chose:r[3],note:r[4]}));
  renderAll();setView('interview');
  nbhUI.toast('Simulation loaded: '+'a simulated sixth-grader’s interview, an assent log of twelve sessions and nine paired choices.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. The interview records the behavior in the student's own words, so nothing is
   filled in on its own; the picker puts the team's label in when the interviewer wants it there. */
window.__nbhFactsIn=function(f){return {filled:0,note:'the interview keeps the behavior in the student’s words'};};
window.__nbhFactsPick=function(sel){const b=sel.behaviors[0];if(!b)return {filled:0};S.meta.beh=b.label;renderAll();return {filled:1};};
