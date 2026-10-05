/* ===== Form SM-1 v2 (v21.45): the sheet's design. =====
   S.d holds the design: the look (classic, bright, theme, clean, discreet), the interest theme, the colour, the rating style
   and its points, the word for the adult who rates, the avatar, the "I'm working for" box, the QR code. S.store is the
   reward store (a name, a picture, a price, a tier). "classic" with the rating style "As the sheet type has it" is the form
   as it was before v21.45: an older file opens to exactly the sheet it had. */

/* ---------------- rating styles ---------------- */
/* each level: the glyph's key, its points and its spoken word (the walkthrough reads it); bin marks a two-level style */
const SM_RATES={
  auto:{l:'As the sheet type has it',note:'faces, Yes / No or 0 1 2, as each sheet type had it before'},
  faces2:{l:'Smiles (2)',bin:1,lv:[['fh',1,'smile'],['fs',0,'frown']]},
  faces3:{l:'Smiles (3)',lv:[['fh',2,'smile'],['fn',1,'straight face'],['fs',0,'frown']]},
  thumbs:{l:'Thumbs up / down',bin:1,lv:[['tu',1,'thumbs up'],['td',0,'thumbs down']]},
  pm:{l:'Plus / minus',bin:1,lv:[['t:+',1,'plus'],['t:−',0,'minus']]},
  check:{l:'Check / x',bin:1,lv:[['t:✓',1,'check'],['t:✗',0,'x']]},
  yn:{l:'Yes / No',bin:1,lv:[['w:Yes',1,'yes'],['w:No',0,'no']]},
  p012:{l:'Points 0-1-2',lv:[['t:2',2,'two'],['t:1',1,'one'],['t:0',0,'zero']]},
  s15:{l:'Scale 1 to 5',lv:[['t:5',5,'five'],['t:4',4,'four'],['t:3',3,'three'],['t:2',2,'two'],['t:1',1,'one']]},
  stars3:{l:'Stars, color 0 to 3',count:3,lv:[['st',3,'three stars'],['st',2,'two stars'],['st',1,'one star'],['st',0,'no stars']]},
  color3:{l:'Color: green, yellow, red',lv:[['cg',2,'green'],['cy',1,'yellow'],['cr',0,'red']]},
  pics:{l:'Pictures you choose',lv:null},
  words:{l:'The student’s own words',lv:null}
};
const SM_RATE_ORDER=['auto','faces2','faces3','thumbs','pm','check','yn','p012','s15','stars3','color3','pics','words'];
function smD(){return S.d||(S.d={});}
function smRateKey(){const k=smD().rate;return SM_RATES[k]?k:'auto';}
/* the levels of the chosen style, with the points edited on the Design sheet (rv: "2,1,0") */
function smLevels(k){k=k||smRateKey();const R=SM_RATES[k];if(!R||k==='auto')return null;const d=smD();let lv;
  if(k==='pics'){const keys=String(d.rpics||'happy,calm,sad').split(',').map(x=>x.trim()).filter(Boolean).slice(0,3);lv=keys.map((x,i)=>['p:'+x,keys.length-1-i,(window.NBH_PICTOS&&NBH_PICTOS[x]?NBH_PICTOS[x].l:x).toLowerCase()]);}
  else if(k==='words'){const w=String(d.rwords||'Nailed it|Almost|Not yet').split('|').map(x=>x.trim()).filter(Boolean).slice(0,4);lv=w.map((x,i)=>['w:'+x,w.length-1-i,x]);}
  else lv=R.lv.map(x=>x.slice());
  const rv=String(d.rv||'').split(',').map(x=>num(x));if(rv.length===lv.length&&rv.every(v=>v!=null))lv.forEach((x,i)=>{x[1]=rv[i];});
  return lv;}
function smRateMax(){const lv=smLevels();return lv?Math.max(...lv.map(x=>x[1])):null;}
function smRateBin(){const k=smRateKey();if(k==='auto')return true;const lv=smLevels();return lv&&lv.length===2;}

/* the glyphs: drawn here so they print the same everywhere, and readable in black and white (shape or label, not colour) */
const SM_THUMB='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';
function smGlyph(key,sz,tint){sz=sz||24;const S2='width="'+sz+'" height="'+sz+'"';tint=tint!==false;
  const f=(fill)=>tint?fill:'#fff';
  if(key==='fh'||key==='fs'||key==='fn'){const m=key==='fh'?'M8 14.5q4 4 8 0':key==='fs'?'M8 16.6q4-4 8 0':'M8 15.4h8';
    return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.3" fill="'+f(key==='fh'?'#dff3d8':key==='fs'?'#fde0dc':'#fff4c9')+'" stroke="#333" stroke-width="1.3"/><circle cx="8.6" cy="9.6" r="1.2" fill="#333"/><circle cx="15.4" cy="9.6" r="1.2" fill="#333"/><path d="'+m+'" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/></svg>';}
  if(key==='tu'||key==='td')return '<svg class="g" '+S2+' viewBox="-2 -2 28 28" aria-hidden="true"><path d="'+SM_THUMB+'" fill="'+f(key==='tu'?'#dff3d8':'#fde0dc')+'" stroke="#333" stroke-width="1.2" stroke-linejoin="round"'+(key==='td'?' transform="rotate(180 12 12)"':'')+'/></svg>';
  if(key==='st')return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.2l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" fill="#fff" stroke="#333" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  if(key==='cg'||key==='cy'||key==='cr'){const c={cg:'#7cc56b',cy:'#f5d04a',cr:'#ef7a6a'}[key],l={cg:'G',cy:'Y',cr:'R'}[key];
    return '<svg class="g" '+S2+' viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.3" fill="'+(tint?c:'#fff')+'" stroke="#333" stroke-width="1.3"/><text x="12" y="16.2" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial,sans-serif" fill="#222">'+l+'</text></svg>';}
  if(key.slice(0,2)==='p:'){const k=key.slice(2);return '<span class="g gp" style="width:'+sz+'px;height:'+sz+'px">'+(window.NBH_PICTOS&&NBH_PICTOS[k]?picto(k,''):'')+'</span>';}
  if(key.slice(0,2)==='t:')return '<span class="g gt" style="width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz*.58)+'px">'+esc(key.slice(2))+'</span>';
  if(key.slice(0,2)==='w:')return '<span class="g gw" style="min-width:'+sz+'px;height:'+sz+'px;font-size:'+Math.max(9,Math.round(sz*.42))+'px">'+esc(key.slice(2))+'</span>';
  return '';}
/* one rating cell: the levels side by side to circle; stars are coloured in, as many as earned */
function smRateCell(sz,tint){const lv=smLevels();if(!lv)return '';const k=smRateKey();
  if(SM_RATES[k].count)return '<span class="gset gstars">'+Array.from({length:SM_RATES[k].count},()=>smGlyph('st',sz)).join('')+'</span>';
  return '<span class="gset">'+lv.map(x=>smGlyph(x[0],sz,tint)).join('')+'</span>';}
/* the key: what each level is worth */
function smRateKeyHTML(sz){const lv=smLevels();if(!lv)return '';const k=smRateKey();
  if(SM_RATES[k].count)return '<span class="rkey">'+smGlyph('st',sz||16)+' each star = 1 point</span>';
  return '<span class="rkey">'+lv.map(x=>smGlyph(x[0],sz||16)+' = '+x[1]).join(' &nbsp; ')+'</span>';}

/* ---------------- points ---------------- */
/* the points possible when a rating style is chosen (null keeps the form's own count) */
function smV2Poss(sys,P,T){if(smRateKey()==='auto')return null;const mx=smRateMax();if(mx==null)return null;
  if(sys==='match'){if(smRateBin())return null;return P*T*(mx+smBonus());}
  if(sys==='contract'||sys==='smiley'||sys==='cico')return P*T*mx;
  if(sys==='interval'){const n=num(S.meta.iv_n)||0;return smRateBin()?null:n*mx;}
  return null;}
function smBonus(){const b=num(smD().mbonus);return b==null?1:b;}

/* ---------------- looks and themes ---------------- */
const SM_LOOKS={classic:'Classic (the form’s own sheet)',bright:'Bright (elementary)',theme:'Interest theme',clean:'Clean (middle and high school)',discreet:'Discreet pocket cards (teens)'};
const SM_THEMES={
  sports:{l:'Sports',c:'#256d3b',a:'#ffd84d',t:'Game Plan',tot:'Final score',store:'Prize locker',mid:'Halftime check',goal:'Goal'},
  space:{l:'Space',c:'#2d2f7a',a:'#ffcf4a',t:'Mission Log',tot:'Mission total',store:'Space station store',mid:'Launch check',goal:'Target'},
  animals:{l:'Animals',c:'#a5531c',a:'#f6c26b',t:'Paw-some Day',tot:'Total paws',store:'Treat shop',mid:'Check-in',goal:'Goal'},
  dinos:{l:'Dinosaurs',c:'#2f6b45',a:'#f08a3c',t:'Dino Day',tot:'Dino total',store:'Dino den',mid:'Roar check',goal:'Goal'},
  art:{l:'Art',c:'#7b3fa0',a:'#ff8fb1',t:'Masterpiece Day',tot:'My total',store:'Art supply store',mid:'Midday check',goal:'Goal'},
  music:{l:'Music',c:'#1f4e79',a:'#ff7a59',t:'My Day’s Song',tot:'Total beats',store:'Music shop',mid:'Halfway check',goal:'Goal'},
  vehicles:{l:'Vehicles',c:'#b03a2e',a:'#f4d03f',t:'Road Trip',tot:'Miles today',store:'Garage store',mid:'Pit stop',goal:'Goal'}
};
function smLook(){const l=smD().look;return SM_LOOKS[l]?l:'classic';}
function smTheme(){const t=smD().theme;return SM_THEMES[t]?t:'sports';}
function smAccent(){const d=smD();if(/^#[0-9a-f]{6}$/i.test(d.accent||''))return d.accent;const l=smLook();return l==='theme'?SM_THEMES[smTheme()].c:l==='clean'?'#1d3b5a':l==='discreet'?'#333333':'#1fa3a6';}
function smTeacher(){const w=String(smD().tw||'').trim();return w||'Teacher';}
function smArt(i,sz){const a=(typeof SM_THEME_ART!=='undefined'&&SM_THEME_ART[smTheme()])||[];const s=a[i%Math.max(1,a.length)];return s?'<svg class="art" width="'+sz+'" height="'+sz+'" viewBox="0 0 72 72" aria-hidden="true">'+s+'</svg>':'';}
/* the name on a sheet: the first name on the bright and theme looks, initials on the clean and discreet ones (Design) */
function smName(){const m=S.meta,d=smD();const full=String(m.client||'').trim(),nick=String(m.nick||'').trim();
  const ini=s=>String(s||'').replace(/\(.*?\)/g,'').split(/[\s–-]+/).filter(w=>/^[A-Za-z]/.test(w)).map(w=>w[0].toUpperCase()+'.').join('');
  const mode=d.nm||(['clean','discreet'].includes(smLook())?'ini':'nick');
  if(mode==='full')return full;if(mode==='ini')return ini(full)||ini(nick);return nick||full;}
function smPoss(n){return n===1?'':'s';}
function smAvatar(sz){const d=smD();if(d.avimg)return '<img class="av-img" src="'+d.avimg+'" alt="" style="width:'+sz+'px;height:'+sz+'px">';
  if(d.av&&window.NBH_PICTOS&&NBH_PICTOS[d.av])return '<span class="av-pic" style="width:'+sz+'px;height:'+sz+'px">'+picto(d.av,'')+'</span>';return '';}

/* ---------------- QR code (qrcode-generator, inlined by build.sh) ---------------- */
function smQR(url,sz){if(!url||typeof qrcode!=='function')return '';try{const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),c=sz/(n+2);let r='';
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))r+='M'+((x+1)*c).toFixed(2)+' '+((y+1)*c).toFixed(2)+'h'+c.toFixed(2)+'v'+c.toFixed(2)+'h-'+c.toFixed(2)+'z';
    return '<svg class="qr" width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'" role="img" aria-label="QR code"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/><path d="'+r+'" fill="#111"/></svg>';}catch(e){return '';}}

/* ---------------- the reward store ---------------- */
function smStore(){return (Array.isArray(S.store)?S.store:[]).filter(x=>x&&(String(x.n||'').trim()||x.icon||x.img));}
function smStorePic(o,sz){return o.img?'<img src="'+o.img+'" alt="" style="width:'+sz+'px;height:'+sz+'px;object-fit:cover;border-radius:6px">':(o.icon&&window.NBH_PICTOS&&NBH_PICTOS[o.icon]?'<span class="sp" style="width:'+sz+'px;height:'+sz+'px">'+picto(o.icon,'')+'</span>':'');}
const SM_TIERS={s:'Small',m:'Medium',b:'Big'};
function smStoreHTML(kind){const st=smStore();if(!st.length)return '';const th=SM_THEMES[smTheme()],look=smLook(),d=smD();
  const ttl=look==='theme'?th.store:look==='clean'?'Points to spend':'My reward store';
  const sorted=st.slice().sort((a,b)=>(num(a.p)??1e9)-(num(b.p)??1e9));
  if(kind==='list')return '<div class="v2-box v2-store-list"><h4>'+esc(ttl)+'</h4>'+sorted.map(o=>'<div class="sl"><span>'+esc(o.n||'')+'</span><b>'+esc(o.p||'')+'</b></div>').join('')+(d.bank?'<div class="sl bank"><span>My bank</span><b>____</b></div>':'')+'</div>';
  if(kind==='line')return '<div class="v2-store-line"><b>'+esc(ttl)+':</b> '+sorted.map(o=>esc(o.n||'')+' '+esc(o.p||'')).join(' · ')+'</div>';
  const tiers=d.tiers&&sorted.some(o=>o.tier);
  const tile=o=>'<div class="tile">'+smStorePic(o,look==='theme'?34:40)+'<div class="tn">'+esc(o.n||'')+'</div><span class="pr">'+esc(o.p||'')+'</span></div>';
  let body='';if(tiers){['s','m','b'].forEach(t=>{const g=sorted.filter(o=>(o.tier||'s')===t);if(g.length)body+='<div class="tier"><span class="tl">'+SM_TIERS[t]+'</span>'+g.map(tile).join('')+'</div>';});}
  else body='<div class="tiles">'+sorted.slice(0,8).map(tile).join('')+'</div>';
  return '<div class="v2-box v2-store"><h4>'+esc(ttl)+' <span class="hint2">points needed</span></h4>'+body+(d.bank?'<div class="bank">Points I save go in my bank: ______</div>':'')+'</div>';}

/* ---------------- the model every look draws ---------------- */
const SM_V2_SYS=['match','contract','smiley','cico','interval','rubric'];
function smModel(){const sys=S.sys,T=S.tg,P=smRows(),p=possible(),d=smD(),tw=smTeacher();
  const raters=sys==='match'||sys==='interval'?['me','t']:sys==='rubric'?(S.chk.rubmatch?['me','t']:['me']):sys==='cico'?['t']:['me'];
  let tg=T.map((t,i)=>({word:t.word||('Target '+(i+1)),cue:t.cue||'',pic:pic(t,''),i}));
  if(sys==='interval')tg=[{word:S.meta.iv_q||'Was I working?',cue:'',pic:'',i:0}];
  if(sys==='rubric')tg=[{word:'How I did',cue:'circle my level (the key above)',pic:'',i:0}];   /* one level per period, as the classic rubric sheet */
  const goal=S.meta.goal_txt||(p.need!=null?'Goal: '+p.need+' of '+p.poss:'');
  return {sys,tg,rows:P,raters,p,goal,tw,match:sys==='match'||sys==='interval'||(sys==='rubric'&&S.chk.rubmatch),init:sys==='contract'||sys==='cico'};}
/* the rows: the periods (or the alternate day's), the intervals of a cued-interval sheet */
function smRows(){if(S.sys==='interval'){const n=num(S.meta.iv_n)||10,len=num(S.meta.iv_len)||3,vr=/^Variable/.test(S.meta.iv_timing||'');return Array.from({length:n},(_,i)=>({t:'',label:'Check '+(i+1),sub:vr?'':'minute '+((i+1)*len),pic:''}));}
  const src=smD().alt&&Array.isArray(S.per2)&&S.per2.some(x=>x.label||x.t)?S.per2:S.per;
  return src.map((r,i)=>({t:r.t?fmtHM(r.t):'',label:r.label||('Period '+(i+1)),sub:'',pic:pic(r,'')}));}
/* a rating cell for the sheet type (rubric: the level circles) */
function smCell(sys,sz){if(sys==='rubric'){const n=S.lv.length;return '<span class="gset">'+Array.from({length:n},(_,i)=>smGlyph('t:'+(i+1),sz,false)).join('')+'</span>';}
  if(smRateKey()==='auto'){if(sys==='cico')return '<span class="gset">'+['2','1','0'].map(x=>smGlyph('t:'+x,sz,false)).join('')+'</span>';if(sys==='smiley')return '<span class="gset">'+smGlyph('fh',sz)+'</span>';
    if(sys==='contract')return '<span class="gset">'+smGlyph('t:✓',sz,false)+'</span>';return '<span class="gset">'+smGlyph('fh',sz)+smGlyph('fs',sz)+'</span>';}
  return smRateCell(sz);}
function smKeyLine(m,short){const k=smRateKey();if(m.sys==='rubric')return short?'<span class="rkey">1 to '+S.lv.length+': the levels on the sheet</span>':'<table class="v2-lv">'+S.lv.map((l,i)=>'<tr class="l'+(i+1)+'"><td><b>'+(i+1)+'</b></td><td>'+esc(l.desc)+'</td><td>'+esc(l.pts)+' pt'+(String(l.pts)==='1'?'':'s')+'</td></tr>').join('')+'</table>';
  if(m.sys==='match'&&short){const mm=mp();return smRateBin()?'Same as '+esc(m.tw.toLowerCase())+': yes '+mm.yy+', no '+mm.nn+', different '+mm.yn:esc(m.tw)+'’s rating + '+smBonus()+' if the same';}
  if(m.sys==='match'){const mm=mp();return smRateBin()?'<span class="rkey">Same answer as '+esc(m.tw.toLowerCase())+' = '+mm.yy+' point'+smPoss(mm.yy)+' for yes, '+mm.nn+' for an honest no · different = '+mm.yn+'</span>':'<span class="rkey">'+esc(m.tw)+'’s rating counts · same rating as '+esc(m.tw.toLowerCase())+' = +'+smBonus()+' bonus · '+smRateKeyHTML(14).replace(/^<span class="rkey">|<\/span>$/g,'')+'</span>';}
  if(k==='auto'&&m.sys==='cico')return '<span class="rkey">'+esc(S.meta.ci_key||'2 = met · 1 = with a reminder · 0 = not yet')+'</span>';
  return k==='auto'?'':smRateKeyHTML(15);}

/* ---------------- the four looks ---------------- */
function smV2Sheet(){const look=smLook();if(look==='classic'||!S.sys)return null;
  if(!SM_V2_SYS.includes(S.sys)||(S.chk.weekly&&look!=='discreet'))return null;   /* perf, interlock and weekly sheets: the classic layout in the look's colours */
  const m=smModel();return look==='discreet'?smDiscreet(m):smLookSheet(m,look);}
function smHeadRight(m,look){const d=smD();let h='';
  if(m.p.need!=null)h+='<div class="v2-goal"><span>'+(look==='theme'?esc(SM_THEMES[smTheme()].goal):'My goal')+'</span><b>'+m.p.need+'</b><span>of '+m.p.poss+'</span></div>';
  if(d.wf!==false&&d.wf!=='0')h+='<div class="v2-wf"><span>I’m working for:</span><div class="box">'+(S.meta.sh_reward?esc(S.meta.sh_reward):'<i>draw it or<br>write it here</i>')+'</div></div>';
  return h;}
function smLookSheet(m,look){const d=smD(),th=SM_THEMES[smTheme()],acc=smAccent();const name=smName();
  const rr=m.sys==='match'&&/one reminder/.test(S.meta.t_rem||'');   /* a Yes allows one reminder: the adult tallies them under the rating */
  const many=m.tg.length*m.raters.length,lvn=(smLevels()||[0,0]).length,wide=many*Math.max(2,lvn),sz=look==='clean'?(wide>24?16:19):wide>30?17:wide>20?21:wide>12?25:30;
  const title=smTitle(look),dt=S.meta.sh_date?esc(S.meta.sh_date):'________';
  let h='<div class="v2 look-'+look+(look==='theme'?' theme-'+smTheme():'')+'" style="--acc:'+acc+';--acc2:'+(look==='theme'?th.a:'#f7c948')+'">';
  /* header */
  if(look==='clean')h+='<div class="v2-head"><div><div class="v2-title">'+esc(title)+'</div><div class="v2-sub">'+esc(name)+(S.meta.grade?' · Grade '+esc(S.meta.grade):'')+' · Date '+dt+'</div></div><div class="v2-meta">'+(m.p.need!=null?'Goal <b>'+(m.p.g!=null?pct(m.p.g):'')+'</b> ('+m.p.need+' of '+m.p.poss+')':'')+(d.wf!==false&&d.wf!=='0'?'<br>Working for: <span class="bl" style="min-width:150px">'+esc(S.meta.sh_reward||'')+'</span>':'')+'</div></div><div class="v2-keyline">'+smKeyLine(m)+'</div>';
  else{h+='<div class="v2-head">'+(look==='theme'?smArt(0,58):(smAvatar(70)?'<div class="v2-av">'+smAvatar(64)+'</div>':''))+'<div class="v2-ht"><div class="v2-title">'+esc(title)+'</div><div class="v2-sub">Date '+dt+' &nbsp; '+(m.match?'Me + '+esc(m.tw.toLowerCase())+'. Same answer = points!':m.sys==='cico'?esc(m.tw)+' rates each period.':'I rate each period.')+'</div></div>'+(look==='theme'?smArt(1,50):'')+'<div class="v2-hr">'+smHeadRight(m,look)+'</div></div>';
    const kl=smKeyLine(m);if(kl)h+='<div class="v2-keyline">'+kl+'</div>';}
  /* the table */
  const who=r=>r==='me'?'Me':esc(m.tw);
  h+='<table class="v2-t"><thead><tr><th class="c0" rowspan="'+(m.raters.length>1?2:1)+'">'+(m.sys==='interval'?'Check':look==='clean'?(parseInt(S.meta.grade,10)>=6?'Class':'Period'):'My day')+'</th>'+
    m.tg.map(t=>'<th class="tg" colspan="'+m.raters.length+'">'+(t.pic&&look!=='clean'?'<span class="tp">'+t.pic+'</span>':'')+'<b>'+esc(t.word)+'</b>'+(t.cue?'<small>'+esc(t.cue)+'</small>':'')+'</th>').join('')+
    (m.match?'<th class="mc" rowspan="'+(m.raters.length>1?2:1)+'">Same<br>answer</th>':'')+(m.init?'<th class="mc" rowspan="1">'+esc(m.tw)+'<br>initials</th>':'')+'<th class="pc" rowspan="'+(m.raters.length>1?2:1)+'">'+(look==='theme'?'Points':'My<br>points')+'</th></tr>'+
    (m.raters.length>1?'<tr class="who">'+m.tg.map(()=>m.raters.map(r=>'<th class="'+r+'">'+who(r)+'</th>').join('')).join('')+(m.init?'<th></th>':'')+'</tr>':'')+'</thead><tbody>';
  h+=m.rows.map(r=>'<tr><th class="c0">'+(r.pic&&look!=='clean'?'<span class="rp">'+r.pic+'</span>':'')+'<span class="rl"><b>'+esc(r.label)+'</b>'+(r.t||r.sub?'<small>'+esc(r.t||r.sub)+'</small>':'')+'</span></th>'+
    m.tg.map(()=>m.raters.map(x=>'<td class="'+x+'">'+smCell(m.sys,x==='t'?Math.round(sz*.86):sz)+(x==='t'&&rr?'<div class="rr">R R</div>':'')+'</td>').join('')).join('')+(m.match?'<td class="mc"></td>':'')+(m.init?'<td class="mc"></td>':'')+'<td class="pc"></td></tr>').join('');
  const span=1+m.tg.length*m.raters.length+(m.match?1:0)+(m.init?1:0);
  h+='<tr class="tot"><th colspan="'+span+'">'+(look==='theme'?esc(th.tot):'Today I earned')+'</th><td class="pc">/ '+(m.p.poss||'')+'</td></tr></tbody></table>';
  /* below the table */
  const below=[];const st=smStore();
  if(st.length)below.push(smStoreHTML(look==='clean'?'list':'tiles'));
  if(d.mid)below.push('<div class="v2-box v2-mid"><h4>'+esc(look==='theme'?th.mid:'Midday check')+'</h4>'+esc(d.mid)+'</div>');
  if(d.cstrip&&(S.meta.bc_task||S.meta.bc_rw))below.push(smContractStrip());
  if(d.qr)below.push('<div class="v2-box v2-qr">'+smQR(d.qr,look==='clean'?64:76)+'<div>'+esc(d.qrlab||'Watch how my sheet works')+'</div></div>');
  if(below.length)h+='<div class="v2-below">'+below.join('')+'</div>';
  if(S.chk.eval||S.chk.graph)h+='<div class="extras">'+(S.chk.eval?evalBox():'')+(S.chk.graph?graphStrip():'')+'</div>';
  if(rr)h=h.replace('<div class="v2-keyline">','<div class="v2-keyline"><span class="rkey"><b>R R</b> under '+esc(m.tw.toLowerCase())+'’s rating: one tally per reminder; a Yes allows one.</span> &nbsp; ');
  if(S.chk.home)h+=smTear();
  h+='<div class="v2-foot">'+esc(d.credit===false?'':'Form SM-1')+'</div></div>';
  return h;}
function smTitle(look){if(S.meta.sh_title)return S.meta.sh_title;const nm=smName(),poss=nm?nm+'’s':'My';
  if(look==='theme')return poss+' '+SM_THEMES[smTheme()].t;
  if(look==='clean')return {match:'Self-Monitoring Report',cico:'Daily Progress Report',smiley:'Daily Expectations',contract:'Self-Monitoring Contract',interval:'On-Task Check',rubric:'Daily Point Sheet'}[S.sys]||'Daily Report';
  return poss+' '+({match:'Self & Match Sheet',contract:'Check Sheet',smiley:'Super Sheet',cico:'Daily Report',interval:'On-Task Check',rubric:'Point Sheet'}[S.sys]||'Sheet');}
function smTear(){const full=esc(S.meta.client||'');let t=tearOff();if(full)t=t.replace(full,esc(smName()));return t;}
function smContractStrip(){const m=S.meta;return '<div class="v2-box v2-contract"><h4>My contract</h4><span>'+esc(m.bc_task||'')+(m.bc_how?' ('+esc(m.bc_how)+')':'')+(m.bc_rw?' → '+esc(m.bc_rw)+(m.bc_rwwhen?', '+esc(m.bc_rwwhen):''):'')+'</span><span class="sg">'+esc(smName()||'Student')+' ________ &nbsp; '+esc(m.bc_teacher||smTeacher())+' ________</span></div>';}
/* the discreet look: day cards, initials only, two to six to a page */
function smDiscreet(m){const d=smD(),n=[1,2,4,6].includes(+d.cards)?+d.cards:(S.chk.weekly?6:2);const name=smName();
  const days=S.chk.weekly||n>1?['Monday','Tuesday','Wednesday','Thursday','Friday']:['Today'];
  const short=t=>{const w=String(t.word||'').replace(/^I\s+/i,'');return w.charAt(0).toUpperCase()+w.slice(1);};
  const card=day=>'<div class="dc"><div class="dch"><b>'+esc(day)+'</b><span>'+esc(name)+(m.p.need!=null?' · goal '+m.p.need+'/'+m.p.poss:'')+'</span></div><table><tr><th></th>'+m.rows.map((r,i)=>{const w=r.label.split(/[\s,/]+/)[0];return '<th title="'+esc(r.label)+'">'+(m.rows.length>8?i+1:esc(w.length>9?w.slice(0,8)+'.':w))+'</th>';}).join('')+'</tr>'+
    m.tg.map(t=>m.raters.map(x=>'<tr><td class="gl">'+esc(short(t))+(m.raters.length>1?' <i>('+(x==='me'?'me':esc(m.tw.toLowerCase()))+')</i>':'')+'</td>'+m.rows.map(()=>'<td>'+smCell(m.sys,13)+'</td>').join('')+'</tr>').join('')).join('')+
    '<tr><td class="gl">'+esc(m.tw)+' initials</td>'+m.rows.map(()=>'<td class="in"></td>').join('')+'</tr></table><div class="dcf"><span>Total ____ / '+(m.p.poss||'')+'</span>'+(smStore().length?'<span>Spend ____</span>':'')+'<span>'+smKeyLine(m,true).replace(/<(?!svg|\/svg|path|circle|text|\/text|span|\/span)[^>]+>/g,'')+'</span></div></div>';
  const cards=[];for(let i=0;i<n;i++){if(i===5&&n===6){cards.push('<div class="dc wk"><div class="dch"><b>My week</b><span>'+esc(name)+'</span></div><div class="bars">'+['M','T','W','Th','F'].map(x=>'<div><i></i><span>'+x+'</span></div>').join('')+'</div><div class="dcf"><span>Days at goal ____ / 5</span>'+(S.meta.bc_rw?'<span>'+esc(S.meta.bc_rw)+'</span>':'')+'</div></div>');break;}cards.push(card(days[i%days.length]));}
  let h='<div class="v2 look-discreet" style="--acc:'+smAccent()+'"><div class="dgrid n'+n+'">'+cards.join('')+'</div>'+(smStore().length?smStoreHTML('line'):'')+'<div class="v2-foot">Form SM-1</div></div>';return h;}
