function eaMarker(k,x,y,col,hollow){
  const f=hollow?'#fff':col,s=4.4,a=' fill="'+f+'" stroke="'+col+'" stroke-width="1.5"';
  if(k===1)return '<rect x="'+(x-s).toFixed(1)+'" y="'+(y-s).toFixed(1)+'" width="'+(2*s)+'" height="'+(2*s)+'"'+a+'/>';
  if(k===2)return '<polygon points="'+x+','+(y-s-1).toFixed(1)+' '+(x+s+1).toFixed(1)+','+(y+s).toFixed(1)+' '+(x-s-1).toFixed(1)+','+(y+s).toFixed(1)+'"'+a+'/>';
  if(k===3)return '<polygon points="'+x+','+(y-s-1).toFixed(1)+' '+(x+s+1).toFixed(1)+','+y+' '+x+','+(y+s+1).toFixed(1)+' '+(x-s-1).toFixed(1)+','+y+'"'+a+'/>';
  return '<circle cx="'+x+'" cy="'+y+'" r="'+s+'"'+a+'/>';
}
function eaT(x,y,t,c,a){return '<text class="'+(c||'bx-l')+'" x="'+x+'" y="'+y+'"'+(a?' text-anchor="'+a+'"':'')+'>'+t+'</text>';}
function raLadder(L){
  const from=L.from||0,r=L.r.slice(from,from+10);let g='';
  r.forEach((v,i)=>{const k=from+i,done=k<L.done,cur=k===L.done&&L.n!=null;
    g+='<g class="lc'+(done?' ld':'')+(cur?' lcur':'')+'" transform="translate('+(i*49)+' 0)"><rect class="lb" x="0" y="0" width="45" height="40" rx="3"/>'+
      '<text class="lt" x="22.5" y="14" text-anchor="middle">FR '+v+'</text>'+
      (done?'<path class="lk" d="M14 25 l6 6 l11 -12"/>':cur?'<text class="ln" x="22.5" y="32" text-anchor="middle">'+L.n+' of '+v+'</text>':'')+'</g>';});
  return g;
}
/* ---- the board: RA-1's tables and plots, drawn the way the form draws them (open markers for the
   control, one filled shape per stimulus; hatched bars for control break points) ---- */
function raMk(k,x,y,filled){const r=4.2,c=filled?'bx-mf':'bx-mo',f=v=>(+v).toFixed(1);
  if(k===1)return '<rect class="'+c+'" x="'+f(x-r)+'" y="'+f(y-r)+'" width="'+(2*r)+'" height="'+(2*r)+'"/>';
  if(k===2)return '<polygon class="'+c+'" points="'+f(x)+','+f(y-r-1)+' '+f(x+r+1)+','+f(y)+' '+f(x)+','+f(y+r+1)+' '+f(x-r-1)+','+f(y)+'"/>';
  if(k===3)return '<polygon class="'+c+'" points="'+f(x)+','+f(y-r-1)+' '+f(x+r+1)+','+f(y+r)+' '+f(x-r-1)+','+f(y+r)+'"/>';
  return '<circle class="'+c+'" cx="'+f(x)+'" cy="'+f(y)+'" r="'+r+'"/>';}
function raAxes(x0,y0,w,h,ymax,ticks,lab){let g='';
  ticks.forEach(v=>{const y=(y0+h-v/ymax*h).toFixed(1);g+='<line class="bx-g" x1="'+x0+'" y1="'+y+'" x2="'+(x0+w)+'" y2="'+y+'"/>'+eaT(x0-5,(+y+3.5).toFixed(1),String(v),'bx-s','end');});
  g+='<line class="bx-ax" x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+(y0+h)+'"/><line class="bx-ax" x1="'+x0+'" y1="'+(y0+h)+'" x2="'+(x0+w)+'" y2="'+(y0+h)+'"/>';
  if(lab)g+='<text class="bx-s" text-anchor="middle" transform="translate('+(x0-25)+' '+(y0+h/2)+') rotate(-90)">'+lab+'</text>';
  return g;}
/* a session plot: series [{k (marker), ctl, pts:[[session index, value]]}] */
function raPlot(ser,o){const n=o.n,X=i=>o.x0+(i+0.5)*o.w/n,Y=v=>o.y0+o.h-Math.min(v,o.ymax)/o.ymax*o.h;
  let g=raAxes(o.x0,o.y0,o.w,o.h,o.ymax,o.ticks,o.lab);
  ser.forEach(s=>{let d='';s.pts.forEach((p,j)=>{d+=(j?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)+' ';});
    g+='<path class="bx-ln'+(s.ctl?' bx-lc':'')+'" d="'+d.trim()+'"/>'+s.pts.map(p=>raMk(s.ctl?0:s.k,X(p[0]),Y(p[1]),!s.ctl)).join('');});
  (o.xl||[]).forEach(i=>{g+=eaT(X(i).toFixed(1),o.y0+o.h+12,String(i+1),'bx-s','middle');});
  return g;}
function raKey(items,x,y){let g='',cx=x;items.forEach(it=>{g+=raMk(it[0],cx+4,y-4,!it[1])+eaT(cx+12,y,it[2],'bx-s');cx+=22+it[2].length*5.7;});return g;}
/* 45-degree hatching inside a bar, drawn as lines so that no pattern id is needed */
function raHatch(x,y,w,h){let g='<rect class="bx-hb" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'"/>';
  for(let s=5;s<w+h;s+=5){const a1=Math.max(0,s-h),a2=Math.min(w,s);
    g+='<line class="bx-hl" x1="'+(x+a1).toFixed(1)+'" y1="'+(y+h-(s-a1)).toFixed(1)+'" x2="'+(x+a2).toFixed(1)+'" y2="'+(y+h-(s-a2)).toFixed(1)+'"/>';}
  return g+'<rect class="bx-ho" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'"/>';}
/* the worked example the walkthrough reads: RA-1's own simulated student, with fixed numbers; sessions in
   a counterbalanced order (the tests enter the same sessions into the form and check what it computes) */
const RA_SO={ctl:[[0,1.2],[6,0.8],[11,1.0],[13,0.6]],a:[[1,2.0],[4,2.2],[10,2.4],[15,2.2]],b:[[3,1.8],[5,2.0],[8,2.0],[14,2.2]],c:[[2,1.0],[7,1.2],[9,0.8],[12,1.4]]};
function raBoard(k){
  const T=eaT,R=(x,y,w,h,c)=>'<rect class="'+c+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>';
  const L=(x1,y1,x2,y2,c)=>'<line class="'+(c||'bx-g')+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>';
  const rows=(cols,data,y0,dy,cls)=>data.map((r,ri)=>r.map((c,ci)=>c===''?'':T(cols[ci],y0+ri*dy,c,(cls&&cls[ci])||'bx-l')).join('')+L(0,y0+ri*dy-14,480,y0+ri*dy-14)).join('');
  const head=(cols,h1,h2,y)=>h1.map((t,i)=>T(cols[i],y,t,'bx-s')+(h2&&h2[i]?T(cols[i],y+12,h2[i],'bx-s'):'')).join('');
  if(k==='q3')return T(6,14,'The question the plan needs answered decides the design','bx-t')+
    [['Will this stimulus reinforce at all?','Single operant','the absolute effect'],['Which of these stimuli should the plan use?','Concurrent operants','the relative effect'],
     ['How much work will this stimulus support?','Progressive ratio','potency: the break point']].map((r,i)=>{const y=46+i*36;
      return (i?L(0,y-20,480,y-20):'')+T(6,y,'“'+r[0]+'”','bx-l')+T(292,y,'→','bx-v')+T(310,y,r[1],'bx-v')+T(310,y+14,r[2],'bx-s');}).join('')+
    T(6,150,'Test the stimulus under the conditions of the plan.','bx-c');
  if(k==='stim'){const cols=[6,40,154,262,314];
    return T(6,14,'Setup: Stimuli Under Test, from PA-1','bx-t')+head(cols,['Code','Stimulus (exact','Type','PA-1','Magnitude, portion,'],['','form delivered)','','rank / %','or access rule'],34)+
      rows(cols,[['A','Tablet (video)','Leisure item','92','20 s access'],['B','Fruit chew','Edible','71','one piece'],['C','Praise + high five','Social / attention','46','brief praise statement']],72,22,['bx-v','bx-l','bx-s','bx-l','bx-l'])+
      T(6,146,'The labels written here feed every other sheet.','bx-s');}
  if(k==='so'){const o={x0:34,y0:40,w:292,h:96,n:16,ymax:3,ticks:[0,1,2,3],lab:'per minute',xl:[0,3,7,11,15]};
    return T(6,14,'Single operant: responses per minute by session','bx-t')+raKey([[0,1,'Control'],[0,0,'Tablet (video)'],[1,0,'Fruit chew'],[2,0,'Praise + high five']],6,30)+
      raPlot([{ctl:1,pts:RA_SO.ctl},{k:0,pts:RA_SO.a},{k:1,pts:RA_SO.b},{k:2,pts:RA_SO.c}],o)+
      T(344,54,'Mean per minute','bx-s')+[['Tablet (video)','2.2'],['Fruit chew','2.0'],['Praise + high five','1.1'],['Control','0.9']].map((r,i)=>T(344,72+i*17,r[0],'bx-s')+T(478,72+i*17,r[1],'bx-v','end')).join('')+
      T(344,146,'Sessions 1 to 16','bx-s');}
  if(k==='sosum'){const cols=[4,124,172,210,266,318,390];
    return T(6,14,'Single operant: the Condition Summary','bx-t')+head(cols,['Condition','Sessions','Mean','Range','Ratio to','Overlap','Reinforcement'],['','','rate','','control','with control','effect'],32)+
      rows(cols,[['Control','4','0.9','0.6–1.2','—','—',''],['Tablet (video)','4','2.2','2.0–2.4','2.44','0%','Clear'],['Fruit chew','4','2.0','1.8–2.2','2.22','0%','Clear'],['Praise + high five','4','1.1','0.8–1.4','1.22','75%','None']],
        66,20,['bx-l','bx-l','bx-l','bx-l','bx-l','bx-l','bx-v'])+
      T(6,146,'Clear = ratio ≥ 2 and no overlap across at least 3 sessions per condition','bx-s');}
  if(k==='flat'){const o={x0:34,y0:40,w:250,h:96,n:8,ymax:6,ticks:[0,2,4,6],lab:'per minute',xl:[0,3,7]};
    return T(6,14,'The control as high as the stimulus','bx-t')+raKey([[0,1,'Control'],[1,0,'Fruit chew']],6,30)+
      raPlot([{ctl:1,pts:[[0,4.2],[3,3.8],[4,4.4],[7,4.0]]},{k:1,pts:[[1,4.0],[2,4.4],[5,3.8],[6,4.2]]}],o)+
      T(300,56,'Mean: control 4.1,','bx-l')+T(300,72,'fruit chew 4.1','bx-l')+T(300,94,'Ratio to control 1.00','bx-v')+T(300,110,'Overlap 100%: None','bx-v')+
      T(300,134,'The materials, and','bx-c')+T(300,148,'not the stimulus?','bx-c');}
  if(k==='prob'){const o={x0:34,y0:40,w:250,h:96,n:8,ymax:4,ticks:[0,2,4],lab:'per minute',xl:[0,3,7]},y12=(40+96-1.2/4*96);
    return T(6,14,'One stimulus session at the control’s highest rate','bx-t')+raKey([[0,1,'Control'],[0,0,'The stimulus']],6,30)+
      raPlot([{ctl:1,pts:[[0,1.0],[3,0.8],[4,1.2],[7,0.6]]},{k:0,pts:[[1,2.0],[2,2.6],[5,1.2],[6,2.8]]}],o)+
      L(34,y12.toFixed(1),284,y12.toFixed(1),'bx-cl')+T(288,(y12+4).toFixed(1),'1.2','bx-c')+
      T(318,56,'Ratio to control 2.39','bx-l')+T(318,72,'Overlap 25%','bx-l')+T(318,96,'Effect: Probable','bx-v')+T(318,120,'Clear needs no','bx-s')+T(318,134,'overlap at all','bx-s');}
  if(k==='plan'){let g=T(6,14,'Concurrent operants, seen from above','bx-t');
    g+=R(12,28,232,104,'bx-tb');
    [['A','Tablet'],['B','Fruit chew'],['','Control']].forEach((s,i)=>{const cx=52+i*76;g+=R(cx-19,40,38,30,'bx-st')+(s[0]?T(cx,60,s[0],'bx-v','middle'):'')+T(cx,86,s[1],'bx-s','middle')+T(cx,104,'LMR'[i],'bx-v','middle');});
    g+=R(98,114,60,10,'bx-tr')+'<circle class="bx-seat" cx="128" cy="144" r="9"/>'+T(144,148,'Student','bx-s');
    g+=T(270,36,'Session','bx-s')+T(330,36,'Option A position','bx-s');
    ['L','M','R','M','R','L'].forEach((p,i)=>{g+=T(288,54+i*16,String(i+1),'bx-l','middle')+T(378,54+i*16,p,'bx-v','middle');});
    return g+T(270,152,'Rotated every session','bx-c');}
  if(k==='alloc'){const cols=[4,94,144,200,262,348,400];
    return T(6,14,'Concurrent operants: the Allocation Summary','bx-t')+head(cols,['Option','Sessions','Total','Mean %','Sessions with','Position','Relative'],['','','responses','allocation','most responses','effect','standing'],32)+
      rows(cols,[['Tablet (video)','6','57','79%','6 of 6','None','Preferred'],['Fruit chew','6','12','17%','0 of 6','n/a','Not chosen'],['Control','6','3','4%','0 of 6','n/a','Not chosen']],66,20,['bx-l','bx-l','bx-l','bx-l','bx-l','bx-l','bx-v'])+
      T(6,130,'A stimulus that is “not chosen” here can still be a reinforcer;','bx-l')+T(6,146,'that is the single-operant question.','bx-l');}
  if(k==='posb'){let g=T(6,14,'Option A’s share, by where its station stood','bx-t');const Y=v=>136-v*0.96;
    [0,50,100].forEach(v=>{g+=L(40,Y(v),250,Y(v))+T(35,Y(v)+3.5,v+'%','bx-s','end');});g+=L(40,40,40,136,'bx-ax')+L(40,136,250,136,'bx-ax');
    [['L',90],['M',62],['R',30]].forEach((b,i)=>{const x=64+i*64;g+=R(x,Y(b[1]).toFixed(1),30,(136-Y(b[1])).toFixed(1),'bx-bt')+T(x+15,149,b[0],'bx-v','middle')+T(x+15,(Y(b[1])-4).toFixed(1),b[1]+'%','bx-s','middle');});
    return g+T(276,58,'Left 90%, right 30%:','bx-l')+T(276,74,'a change of 60 points','bx-l')+T(276,98,'Position effect: Suspected','bx-v')+T(276,122,'flagged above 40 points','bx-s');}
  if(k==='bp'||k==='one'){const one=k==='one';
    const grp=one?[['Tablet',[7],0],['Fruit chew',[9],0]]:[['Control',[3,1,3],1],['Tablet',[17,15,17],0],['Fruit chew',[9,7,9],0],['Praise',[1,3,1],0]];
    const n=grp.reduce((a,gr)=>a+gr[1].length,0),x0=34,y0=38,w=one?150:292,h=96,ymax=20,X=i=>x0+(i+0.5)*w/n,Y=v=>y0+h-v/ymax*h,bw=Math.min(24,w/n*0.7);
    let g=T(6,14,one?'One progressive-ratio session each':'Break point by session, grouped by condition','bx-t')+raAxes(x0,y0,w,h,ymax,[0,10,20],'break point');let i=0;
    grp.forEach(gr=>{const i0=i;gr[1].forEach(v=>{const x=X(i)-bw/2,y=Y(v);g+=gr[2]?raHatch(x,y,bw,y0+h-y):R(x.toFixed(1),y.toFixed(1),bw.toFixed(1),(y0+h-y).toFixed(1),'bx-bt');i++;});
      g+=T(((X(i0)+X(i-1))/2).toFixed(1),y0+h+12,gr[0],'bx-s','middle');});
    if(one)return g+T(210,62,'Tablet (video): 7','bx-l')+T(210,78,'Fruit chew: 9','bx-l')+T(210,104,'A single break point is unstable:','bx-v')+T(210,120,'2–3 sessions per stimulus, and a','bx-s')+T(210,134,'control, in a counterbalanced order','bx-s');
    return g+T(344,54,'Mean break point','bx-s')+[['Tablet (video)','16.3'],['Fruit chew','8.3'],['Control','2.3'],['Praise + high five','1.7']].map((r,j)=>T(344,72+j*17,r[0],'bx-s')+T(478,72+j*17,r[1],'bx-v','end')).join('')+
      T(344,146,'Control bars hatched','bx-s');}
  if(k==='bpsum'){const cols=[4,40,170,230,310,380];
    return T(6,14,'Progressive ratio: the Break-Point Summary','bx-t')+head(cols,['Rank','Condition','Sessions','Mean break','Range','Potency'],['','','','point','',''],32)+
      rows(cols,[['1','Tablet (video)','3','16.3','15–17','High'],['2','Fruit chew','3','8.3','7–9','High'],['3','Control','3','2.3','1–3',''],['4','Praise + high five','3','1.7','1–3','Low']],
        66,20,['bx-l','bx-l','bx-l','bx-v','bx-l','bx-v'])+
      T(6,146,'Potency with the plan ratio at FR 5; the control carries no label','bx-s');}
  if(k==='pot'||k==='pot10'){const ten=k==='pot10',lad=[1,3,5,7,9,11,13,15,17,19],cx=i=>8+i*46+21;
    let g=T(6,14,ten?'The same break points, with a plan ratio of FR 10':'Potency: steps of the progression above the control','bx-t');
    const px=ten?8+5*46-2:cx(2);g+=T(px,33,ten?'plan ratio FR 10':'plan ratio FR 5','bx-c','middle');
    lad.forEach((v,i)=>{g+=R(8+i*46,38,42,22,!ten&&i===2?'bx-cell bx-cellp':'bx-cell')+T(cx(i),53,'FR '+v,'bx-s','middle');});
    if(ten)g+=L(px,36,px,64,'bx-pl');
    g+=T(cx(1),80,'Control 2.3','bx-l','middle')+T(cx(1),96,'Praise 1.7: Low','bx-v','middle');
    g+=T(cx(4),80,'Fruit chew 8.3','bx-l','middle')+T(cx(4),96,'+3 steps: '+(ten?'Moderate':'High'),'bx-v','middle');
    g+=T(cx(8),80,'Tablet (video) 16.3','bx-l','middle')+T(cx(8),96,'+7 steps: High','bx-v','middle');
    return g+T(6,132,'High: 3 or more steps above control, and above the plan ratio','bx-s')+T(6,146,'Moderate: 1 step or more above control, not High · Low: under 1 step','bx-s');}
  if(k==='verd'){let g=T(6,14,'Summary: reinforcer verdicts, plan ratio FR 5','bx-t');
    [['Tablet (video)','PA-1 92 · SO 2.44 Clear · CO 79% Preferred · PR 16.3 High','Confirmed'],['Fruit chew','PA-1 71 · SO 2.22 Clear · CO 17% Not chosen · PR 8.3 High','Confirmed'],
     ['Praise + high five','PA-1 46 · SO 1.22 None · CO — · PR 1.7 Low','Not supported']].forEach((r,i)=>{const y=38+i*34;
      g+=(i?L(0,y-15,480,y-15):'')+T(6,y,r[0],'bx-v')+T(6,y+14,r[1],'bx-s')+T(478,y+7,r[2],r[2]==='Not supported'?'bx-v bx-nof':'bx-v bx-okf','end');});
    return g+T(6,146,'Confirmed (plan ratio entered): SO Clear, PR High, or SO Probable with PR Moderate','bx-s');}
  if(k==='pa'){const X=v=>40+(v-40)/60*200,Y=v=>136-v/20*96;let g=T(6,14,'PA-1 percentage against the break point','bx-t');
    g+=raAxes(40,40,200,96,20,[0,10,20],'break point');[40,70,100].forEach(v=>{g+=T(X(v),153,v+'%','bx-s','middle');});
    g+=L(40,Y(2.3).toFixed(1),240,Y(2.3).toFixed(1),'bx-cl')+T(244,(Y(2.3)+4).toFixed(1),'control','bx-c');
    g+=raMk(0,X(92),Y(16.3),1)+T((X(92)-9).toFixed(1),(Y(16.3)-7).toFixed(1),'Tablet','bx-s','end');
    g+=raMk(1,X(71),Y(8.3),1)+T((X(71)-9).toFixed(1),(Y(8.3)-7).toFixed(1),'Fruit chew','bx-s','end');
    g+=raMk(2,X(46),Y(1.7),1)+T((X(46)+9).toFixed(1),(Y(1.7)-8).toFixed(1),'Praise','bx-s');
    return g+T(300,56,'92 → 16.3','bx-l')+T(300,72,'71 → 8.3','bx-l')+T(300,88,'46 → 1.7','bx-l')+T(300,108,'The same order here','bx-v')+T(300,126,'DeLeon et al. (2009): higher','bx-s')+T(300,139,'paired-choice rank, larger break','bx-s')+T(300,152,'point in 10 of 12 comparisons','bx-s');}
  if(k==='hpl'){const cols=[4,150,270,380];
    return T(6,14,'Ranked first three weeks ago; potency now','bx-t')+head(cols,['Stimulus','MSWO rank','Mean break','Potency'],['','(3 weeks ago)','point',''],32)+
      rows(cols,[['Fruit chew','1','2.3','Low'],['Tablet (video)','2','16.3','High'],['Control','','2.3','']],66,20,['bx-l','bx-l','bx-l','bx-v'])+
      T(6,130,'Plan ratio FR 5. The fruit chew does not rise above control.','bx-s')+T(6,146,'Preference and potency are separate questions.','bx-c');}
  if(k==='retest'){let g=T(6,14,'The tablet, six weeks into the plan','bx-t');const Y=v=>136-v/20*96;
    g+=raAxes(40,40,150,96,20,[0,10,20],'break point');
    g+=R(66,Y(16.3).toFixed(1),30,(136-Y(16.3)).toFixed(1),'bx-bt')+T(81,150,'Assessment','bx-s','middle')+R(134,Y(7).toFixed(1),30,(136-Y(7)).toFixed(1),'bx-bt')+T(149,150,'Week 6','bx-s','middle');
    g+=T(81,(Y(16.3)-4).toFixed(1),'16.3','bx-s','middle')+T(149,(Y(7)-4).toFixed(1),'7','bx-s','middle');
    return g+T(220,52,'Brief MSWO: still ranked first','bx-l')+T(220,76,'Falling break point, stable preference:','bx-l')+T(220,92,'satiation or a magnitude problem','bx-v')+
      T(220,118,'A falling preference rank instead:','bx-s')+T(220,132,'a need to rotate stimuli','bx-s')+T(220,148,'(practice rules of RA-1)','bx-s');}
  if(k==='enough')return T(6,14,'No stopping rule: the sheets’ minimums are floors','bx-t')+
    T(6,40,'Single operant, reversal','bx-v')+T(180,40,'alternate phases until the effect replicates','bx-l')+
    T(6,62,'Single operant, labels','bx-v')+T(180,62,'Clear needs at least 3 sessions per condition','bx-l')+
    T(6,84,'Concurrent operants','bx-v')+T(180,84,'positions rotated every session','bx-l')+
    T(6,106,'Progressive ratio','bx-v')+T(180,106,'2–3 sessions per stimulus, and a control','bx-l')+
    T(6,132,'A single break point is unstable.','bx-c')+T(6,148,'The analyst decides from stability across sessions.','bx-s');
  if(k==='recs')return T(6,14,'Recommendations for the Behavior Plan','bx-t')+
    T(6,36,'Reinforcer(s) selected and why','bx-s')+T(6,51,'Tablet access, the reinforcer of record; fruit chew a usable back-up','bx-l')+
    T(6,72,'Schedule and magnitude supported by the data','bx-s')+T(6,87,'FR 5 with 20-s tablet access','bx-l')+
    T(6,108,'Reinforcers to rotate or reserve','bx-s')+T(6,123,'Alternate tablet and fruit chew across sessions','bx-l')+
    T(6,146,'Praise alone did not function as a reinforcer.','bx-c');
  if(k==='sign')return T(6,14,'Before the summary is signed','bx-t')+
    T(6,36,'Re-test trigger','bx-s')+T(6,51,'Response rate below 60% of the assessment level for 3 consecutive days;','bx-l')+T(6,66,'each new schedule step','bx-l')+
    T(6,88,'Interobserver agreement (design, sessions, %)','bx-s')+T(6,103,'Second observer on 33% of sessions, all three conditions','bx-l')+
    T(6,124,'Problem behavior across sessions (summary)','bx-s')+
    T(6,146,'BCBA · Teacher or implementer · Parent or guardian informed','bx-v');
  return '';
}