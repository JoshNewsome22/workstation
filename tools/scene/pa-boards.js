const EA_COL=['#182e43','#76a2a3','#9b4e15','#54676f','#a0c9c3','#8e2a2a'];
function eaMarker(k,x,y,col,hollow){
  const f=hollow?'#fff':col,s=4.4,a=' fill="'+f+'" stroke="'+col+'" stroke-width="1.5"';
  if(k===1)return '<rect x="'+(x-s).toFixed(1)+'" y="'+(y-s).toFixed(1)+'" width="'+(2*s)+'" height="'+(2*s)+'"'+a+'/>';
  if(k===2)return '<polygon points="'+x+','+(y-s-1).toFixed(1)+' '+(x+s+1).toFixed(1)+','+(y+s).toFixed(1)+' '+(x-s-1).toFixed(1)+','+(y+s).toFixed(1)+'"'+a+'/>';
  if(k===3)return '<polygon points="'+x+','+(y-s-1).toFixed(1)+' '+(x+s+1).toFixed(1)+','+y+' '+x+','+(y+s+1).toFixed(1)+' '+(x-s-1).toFixed(1)+','+y+'"'+a+'/>';
  return '<circle cx="'+x+'" cy="'+y+'" r="'+s+'"'+a+'/>';
}
function eaT(x,y,t,c,a){return '<text class="'+(c||'bx-l')+'" x="'+x+'" y="'+y+'"'+(a?' text-anchor="'+a+'"':'')+'>'+t+'</text>';}
/* the legend row under a board's title, as the Sessions view draws it under its graph */
function eaLegend(ser,x,y){let g='',cx=x;ser.forEach((s,si)=>{g+=eaMarker(s.k==null?si:s.k,cx+4,y-4,EA_COL[si%EA_COL.length],!!s.ctl)+eaT(cx+13,y,s.n,'bx-s');cx+=26+s.n.length*6.2;});return g;}
/* a multielement graph: data paths [{n,ys,k,ctl}] in rotation order; o: {x0,y0,w,h,ymax,ticks,ucl,lcl,lab} */
function eaGraph(ser,o){
  const x0=o.x0||40,y0=o.y0||40,w=o.w||290,h=o.h||104,ymax=o.ymax||12;
  const n=o.n||ser.reduce((m,s)=>Math.max(m,s.ys.length*ser.length),0);
  const X=i=>x0+(i-0.5)*w/n,Y=v=>y0+h-Math.min(v,ymax)/ymax*h;
  let g='';
  (o.ticks||[0,ymax/2,ymax]).forEach(v=>{g+='<line class="bx-g" x1="'+x0+'" y1="'+Y(v).toFixed(1)+'" x2="'+(x0+w)+'" y2="'+Y(v).toFixed(1)+'"/>'+eaT(x0-5,(Y(v)+3.5).toFixed(1),String(v),'bx-s','end');});
  g+='<line class="bx-ax" x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+(y0+h)+'"/><line class="bx-ax" x1="'+x0+'" y1="'+(y0+h)+'" x2="'+(x0+w)+'" y2="'+(y0+h)+'"/>';
  if(o.ucl!=null)g+='<line class="bx-cl" x1="'+x0+'" y1="'+Y(o.ucl).toFixed(1)+'" x2="'+(x0+w)+'" y2="'+Y(o.ucl).toFixed(1)+'"/>'+eaT(x0+w+4,(Y(o.ucl)-1).toFixed(1),'UCL','bx-c');
  if(o.lcl!=null)g+='<line class="bx-cl bx-lo" x1="'+x0+'" y1="'+Y(o.lcl).toFixed(1)+'" x2="'+(x0+w)+'" y2="'+Y(o.lcl).toFixed(1)+'"/>'+eaT(x0+w+4,(Y(o.lcl)+9).toFixed(1),'LCL','bx-c');
  ser.forEach((s,si)=>{const col=EA_COL[si%EA_COL.length],xs=s.ys.map((v,i)=>s.x0!=null?s.x0+i:i*ser.length+si+1);
    let d='';s.ys.forEach((v,i)=>{d+=(i?'L':'M')+X(xs[i]).toFixed(1)+' '+Y(v).toFixed(1);});
    g+='<path class="bx-sr" d="'+d+'" stroke="'+col+'"/>'+s.ys.map((v,i)=>eaMarker(s.k==null?si:s.k,+X(xs[i]).toFixed(1),+Y(v).toFixed(1),col,!!s.ctl)).join('');});
  if(o.lab)g+='<text class="bx-s" text-anchor="middle" transform="translate('+(x0-26)+' '+(y0+h/2)+') rotate(-90)">'+o.lab+'</text>';
  return g;
}
/* the worked example the walkthrough reads (rates per minute, four 10-min series); the test
   enters the same sessions into the form and checks the numbers the board quotes */
const EA_ME=[{n:'Attention',ys:[0.4,0.2,0.5,0.3]},{n:'Demand',ys:[8.6,10.2,8.3,9.5]},{n:'Alone / No interaction',ys:[0.1,0,0,0.1]},{n:'Play (control)',ys:[0.3,0.5,0.2,0.6],ctl:1}];
const EA_UN=[{n:'Attention',ys:[2.8,3.1,2.6,3.3]},{n:'Demand',ys:[3.0,2.7,3.4,2.9]},{n:'Alone / No interaction',ys:[3.2,2.9,3.0,3.1]},{n:'Play (control)',ys:[2.9,3.2,3.0,2.8],ctl:1}];
const EA_LO=[{n:'Attention',ys:[2.4,2.5,2.4,2.6]},{n:'Demand',ys:[0.1,0.1,0.1,0.1]},{n:'Alone / No interaction',ys:[0,0,0,0]},{n:'Play (control)',ys:[2.0,2.1,2.0,2.1],ctl:1}];
const EA_LAT=[{n:'Attention',ys:[600,540,600,600]},{n:'Demand',ys:[45,30,62,41]},{n:'Alone / No interaction',ys:[600,600,600,480]},{n:'Play (control)',ys:[600,600,540,600],ctl:1}];
function eaBoard(k){
  const T=eaT,R=(x,y,w,h,c)=>'<rect class="'+c+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>';
  const note=(x,y,lines)=>lines.map((l,i)=>T(x,y+i*14,l[0],l[1]||'bx-s')).join('');
  if(k==='me')return T(8,14,'Sessions & graph: the worked example, four series','bx-t')+eaLegend(EA_ME,8,32)+
    eaGraph(EA_ME,{ymax:12,ticks:[0,4,8,12],lab:'per minute'})+note(356,62,[['Each condition is','bx-l'],['one data path;','bx-l'],['the control is','bx-l'],['drawn hollow.','bx-l'],['Demand is high','bx-v'],['in every series.','bx-v']]);
  if(k==='crit')return T(8,14,'Interpretation: criterion lines from Play (control)','bx-t')+T(8,31,'Play (control): mean 0.40 · SD 0.16 · UCL 0.56 · LCL 0.24','bx-v')+
    eaGraph(EA_ME,{ymax:12,ticks:[0,4,8,12],ucl:0.56,lcl:0.24,lab:'per minute'})+note(368,62,[['UCL = mean + 1 SD','bx-l'],['LCL = mean − 1 SD','bx-l'],['LCL at 0 when'],['the SD exceeds'],['the mean']]);
  if(k==='zoom'){const L=40,W=270,H=104,y0=40,Y=v=>y0+H-v/1.2*H,dx=W/16;let g=T(8,14,'The bottom of the same graph, stretched','bx-t')+T(8,31,'Demand is off this scale: all four of its points lie above the UCL.','bx-s');
    [0,0.4,0.8,1.2].forEach(v=>{g+='<line class="bx-g" x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(L+W)+'" y2="'+Y(v).toFixed(1)+'"/>'+T(L-5,(Y(v)+3.5).toFixed(1),v.toFixed(1),'bx-s','end');});
    g+='<line class="bx-ax" x1="'+L+'" y1="'+y0+'" x2="'+L+'" y2="'+(y0+H)+'"/><line class="bx-ax" x1="'+L+'" y1="'+(y0+H)+'" x2="'+(L+W)+'" y2="'+(y0+H)+'"/>';
    g+='<line class="bx-cl" x1="'+L+'" y1="'+Y(0.56).toFixed(1)+'" x2="'+(L+W)+'" y2="'+Y(0.56).toFixed(1)+'"/>'+T(L+W+4,(Y(0.56)+3.5).toFixed(1),'UCL 0.56','bx-c');
    g+='<line class="bx-cl bx-lo" x1="'+L+'" y1="'+Y(0.24).toFixed(1)+'" x2="'+(L+W)+'" y2="'+Y(0.24).toFixed(1)+'"/>'+T(L+W+4,(Y(0.24)+3.5).toFixed(1),'LCL 0.24','bx-c');
    [0,2,3].forEach(si=>{const s=EA_ME[si],col=EA_COL[si];let d='';s.ys.forEach((v,i)=>{d+=(i?'L':'M')+(L+(i*4+si+0.5)*dx).toFixed(1)+' '+Y(v).toFixed(1);});
      g+='<path class="bx-sr" d="'+d+'" stroke="'+col+'"/>'+s.ys.map((v,i)=>eaMarker(si,+(L+(i*4+si+0.5)*dx).toFixed(1),+Y(v).toFixed(1),col,!!s.ctl)).join('');});
    return g+note(376,62,[['Attention: u 0, l 1','bx-l'],['u − l = −1','bx-v'],['',''],['Alone: u 0, l 4','bx-l'],['u − l = −4','bx-v']]);}
  if(k==='table'){const rows=[['Condition','n','Mean','u','l','u − l','n / 2','Rule'],['Attention','4','0.35','0','1','−1','2.0','not met'],['Demand','4','9.15','4','0','4','2.0','met'],['Alone / No interaction','4','0.05','0','4','−4','2.0','not met']];
    const xs=[8,176,204,248,272,298,340,384];let g=T(8,14,'Interpretation: the criteria table','bx-t')+T(8,31,'Play (control): n 4 · mean 0.40 · SD 0.16 · UCL 0.56 · LCL 0.24','bx-s');
    rows.forEach((r,ri)=>{const y=52+ri*21;if(ri)g+='<line class="bx-g" x1="6" y1="'+(y-14)+'" x2="440" y2="'+(y-14)+'"/>';r.forEach((c,ci)=>{g+=T(xs[ci],y,c,ri===0?'bx-s':(ci===7?(c==='met'?'bx-ok':'bx-no'):'bx-l'));});});
    return g+T(8,150,'Differentiated: Demand meets the rule (u − l = 4 of n = 4).','bx-v bx-okf');}
  if(k==='undiff')return T(8,14,'Undifferentiated: nothing clears the lines','bx-t')+eaLegend(EA_UN,8,32)+
    eaGraph(EA_UN,{ymax:6,ticks:[0,2,4,6],ucl:3.12,lcl:2.83,lab:'per minute'})+note(368,62,[['UCL 3.12','bx-l'],['LCL 2.83','bx-l'],['',''],['No test condition'],['meets the rule.'],['Alone is high, and'],['so is the control.']]);
  if(k==='lomag')return T(8,14,'Rule met, magnitude low','bx-t')+eaLegend(EA_LO,8,32)+
    eaGraph(EA_LO,{ymax:4,ticks:[0,2,4],ucl:2.10,lcl:2.00,lab:'per minute'})+note(368,62,[['Attention: u − l = 4','bx-l'],['mean 2.48','bx-l'],['control mean 2.05','bx-l'],['',''],['2.48 is under','bx-v'],['1.5 × 2.05','bx-v']]);
  if(k==='ladder')return T(8,14,'Undifferentiated: the next steps, in order','bx-t')+
    T(10,40,'1  The extended alone / no-interaction screen','bx-l')+T(26,54,'Querim et al. (2013)','bx-s')+
    T(10,74,'2  A pairwise test of the strongest candidate','bx-l')+T(26,88,'Iwata et al. (1994); Iwata & Dozier (2008)','bx-s')+
    T(10,108,'3  Establishing operations modified from interview data','bx-l')+
    T(10,128,'4  Only then a synthesized analysis (Hanley et al., 2014)','bx-l')+T(10,150,'Each step goes in the log as a new phase.','bx-v');
  if(k==='alone5'||k==='alone5x'){const up=k==='alone5',ys=up?[3.4,3.8,3.1,3.6,3.5]:[2.4,1.5,0.8,0.3,0.1];
    return T(8,14,'Ext. alone: five consecutive 5-min sessions','bx-t')+T(8,31,'phase label: Ext. alone','bx-s')+eaGraph([{n:'Alone',ys,k:2,x0:1}],{ymax:5,ticks:[0,2.5,5],n:5,w:250,lab:'per minute'})+
      (up?note(312,62,[['Persists across all five:','bx-v'],['automatic reinforcement','bx-l'],['indicated','bx-l'],['(Querim et al., 2013)']]):
        note(312,62,[['Falls across the five:','bx-v'],['a social function,','bx-l'],['to be tested next','bx-l'],['(Querim et al., 2013)']]));}
  if(k==='lat')return T(8,14,'Latency to first response (s): shorter is stronger','bx-t')+eaLegend(EA_LAT,8,32)+
    eaGraph(EA_LAT,{ymax:660,ticks:[0,300,600],ucl:611,lcl:559,lab:'seconds'})+note(368,62,[['Inverted: points','bx-l'],['below the LCL count','bx-l'],['',''],['Demand: 4 of 4','bx-v'],['below 559 s','bx-v']]);
  if(k==='trial'){const rows=[['Attention',10,20],['Demand',10,10],['Tangible',10,80],['Ignore',0,10]];let g=T(8,14,'Trial-based log: % of trials with the target','bx-t');
    const Y=v=>136-v*0.96;
    [0,50,100].forEach(v=>{g+='<line class="bx-g" x1="40" y1="'+Y(v)+'" x2="330" y2="'+Y(v)+'"/>'+T(35,Y(v)+3.5,v+'%','bx-s','end');});
    g+='<line class="bx-ax" x1="40" y1="36" x2="40" y2="136"/><line class="bx-ax" x1="40" y1="136" x2="330" y2="136"/>';
    rows.forEach((r,i)=>{const x=56+i*70;g+=R(x,Y(r[1]),20,136-Y(r[1]),'bx-bc')+R(x+22,Y(r[2]),20,136-Y(r[2]),'bx-bt')+T(x+21,149,r[0],'bx-s','middle');});
    return g+R(346,42,11,9,'bx-bc')+T(362,50,'control segment','bx-l')+R(346,60,11,9,'bx-bt')+T(362,68,'test segment','bx-l')+note(346,96,[['Tangible: 80% of','bx-v'],['test segments,','bx-v'],['10% of control','bx-v'],['compared by eye']]);}
  if(k==='iisca'){const S=[{n:'Synthesized test',ys:[5.8,6.4,5.2,6.9,6.1]},{n:'Matched control',ys:[0.2,0,0.4,0.2,0],ctl:1,k:1}];
    return T(8,14,'IISCA: the synthesized test against its matched control','bx-t')+eaLegend(S,8,32)+eaGraph(S,{ymax:8,ticks:[0,4,8],lab:'per minute'})+
      note(356,62,[['Alternated, starting','bx-l'],['with the control,','bx-l'],['to a clear difference','bx-l'],['',''],['Which contingency:','bx-v'],['isolated tests','bx-v']]);}
  if(k==='prec')return T(8,14,'Precursor FA: the precursor, per minute','bx-t')+eaLegend(EA_ME,8,32)+
    eaGraph(EA_ME,{ymax:12,ticks:[0,4,8,12],lab:'screams / min'})+note(356,62,[['Read with the same','bx-l'],['criteria as any','bx-l'],['session log','bx-l'],['',''],['Head hits: counted','bx-v'],['with Target; rare','bx-v']]);
  if(k==='ioa')return T(8,14,'Interpretation: Agreement and Fidelity Obtained','bx-t')+
    T(8,40,'Sessions with IOA','bx-s')+T(8,62,'25%','bx-big')+T(8,77,'4 of 16; standard ≥ 20% per condition','bx-s')+
    T(250,40,'Mean IOA','bx-s')+T(250,62,'89.5%','bx-big')+T(250,77,'standard ≥ 80%','bx-s')+
    T(8,102,'By condition','bx-s')+T(8,118,'Attention: 100% · Demand: 0% · Alone / No interaction: 0% ·','bx-l')+T(8,133,'Play (control): 0%','bx-l')+T(8,152,'Three conditions have no agreement sessions at all.','bx-v bx-nof');
  if(k==='ivl'){const o1=[1,0,2,0,0,1],o2=[0,1,2,0,1,0];let g=T(8,14,'Two records of one minute, in 10-s intervals','bx-t');
    const cell=(x,y,v,ok)=>R(x,y,32,20,ok?'bx-ca':'bx-cd')+T(x+16,y+14,String(v),'bx-l','middle');
    g+=T(8,44,'Data collector','bx-s')+T(8,70,'Second observer','bx-s');
    o1.forEach((v,i)=>{g+=cell(104+i*36,30,v,v===o2[i])+cell(104+i*36,56,o2[i],v===o2[i]);});
    g+=T(330,44,'green: the same','bx-s')+T(330,58,'red: different','bx-s');
    return g+T(8,98,'Total count','bx-l')+T(200,98,'4 and 4: 100%','bx-v')+T(8,114,'Exact count per interval','bx-l')+T(200,114,'2 of 6 intervals: 33%','bx-v')+
      T(8,130,'Interval-by-interval','bx-l')+T(200,130,'2 of 6 intervals: 33%','bx-v')+T(8,146,'Proportional (smaller / larger)','bx-l')+T(200,146,'0, 0, 1, 1, 0, 0: mean 33%','bx-v');}
  if(k==='conds'){const C=[['#b8433a','Attention','Colored placemat or shirt: e.g., red','Two or three moderately preferred items'],['#2f5fa3','Demand','Colored placemat: e.g., blue','Tasks at the student’s instructional level'],
      [null,'Alone / No interaction','Empty room or therapist facing away','None'],['#3f8a4f','Play (control)','Colored placemat: e.g., green','Highly preferred items from PA-1']];
    let g=T(8,14,'Conditions: each card’s signal and materials','bx-t');
    C.forEach((r,i)=>{const y=42+i*32;g+=r[0]?'<rect x="8" y="'+(y-10)+'" width="14" height="14" rx="2" fill="'+r[0]+'"/>':'<rect x="8.5" y="'+(y-9.5)+'" width="13" height="13" rx="2" fill="#fff" stroke="#54676f" stroke-dasharray="2 2"/>';
      g+=T(30,y,r[1],'bx-v')+T(180,y,r[2],'bx-l')+T(30,y+14,'Materials: '+r[3],'bx-s');});return g;}
  if(k==='tang')return T(8,14,'Before a tangible condition goes into the analysis','bx-t')+
    T(8,40,'Add it only when the indirect and descriptive assessments','bx-l')+T(8,55,'indicate that tangible delivery follows the behavior:','bx-l')+
    '<rect x="12" y="68" width="11" height="11" fill="#fff" stroke="#182e43"/>'+T(30,78,'Form IA-1 (indirect)','bx-l')+'<rect x="182" y="68" width="11" height="11" fill="#fff" stroke="#182e43"/>'+T(200,78,'Form ABC-1 (descriptive)','bx-l')+
    T(8,106,'Rooker et al. (2011) examined false positives in the','bx-l')+T(8,121,'tangible condition: include tangible items with care.','bx-l')+
    T(8,148,'In EA-1’s templates, Tangible is one of the trial-based conditions.','bx-s');
  if(k==='decide')return T(8,14,'Before a function goes in the report','bx-t')+
    T(8,40,'✓  Rule met: u − l ≥ n / 2, and the mean at least 1.5 × the control mean','bx-l')+
    T(8,59,'✓  Flags for visual review read: trend, exposures, variable control','bx-l')+
    T(8,78,'✓  The pattern survives visual inspection for trend and consistency','bx-l')+
    T(8,97,'✓  Second analyst (independent interpretation) / date','bx-l')+
    '<rect x="8" y="114" width="11" height="11" fill="#182e43"/>'+T(26,124,'Function identified; proceed to function-based treatment design','bx-v')+T(26,138,'(treatment-design sheet)','bx-s');
  if(k==='log'){const rows=[['1','Attention','FA','10','3'],['2','Demand','FA','10','86'],['3','Alone / No interaction','FA','10','1'],['4','Play (control)','FA','10','3'],['5','Attention','FA','10','·']];
    const xs=[10,36,190,232,270];let g=T(8,14,'Sessions & graph: the log, one row per session','bx-t');
    ['#','Condition','Phase','Min','Count'].forEach((h,i)=>{g+=T(xs[i],36,h,'bx-s');});
    rows.forEach((r,ri)=>{const y=56+ri*19;g+='<line class="bx-g" x1="6" y1="'+(y-13)+'" x2="316" y2="'+(y-13)+'"/>';r.forEach((c,ci)=>{g+=T(xs[ci],y,c,ri===4?'bx-v':'bx-l');});});
    return g+note(336,56,[['Sessions 1 to 4:','bx-l'],['one of each','bx-l'],['condition, series 1','bx-l'],['',''],['Session 5 starts','bx-v'],['series 2','bx-v']]);}
  return '';
}
const PA_ALT='The assessment table: the therapist, the student and the data collector';
const PA_NAME={tab:'Tablet (video)',bub:'Bubbles',ball:'Squeeze ball',book:'Picture book',mus:'Musical toy',blk:'Blocks',
  fish:'Goldfish crackers',fruit:'Fruit snack',pretz:'Pretzel',juice:'Apple juice',tube:'Vibrating tube',chew:'Chewy necklace'};
const PA_KEYS=Object.keys(PA_NAME);
/* each object stands on its own base line (y = 0), centred on x = 0, about 30 wide */
function paIcon(k,v){
  const bowl=(inner)=>inner+'<path d="M-14 -11 L14 -11 Q13 0 0 0 Q-13 0 -14 -11 Z" fill="#fff" stroke="#93aead" stroke-width="1.2"/><path d="M-12 -8 Q0 -5 12 -8" fill="none" stroke="#dbe5e3" stroke-width="1"/>';
  /* the tablet stands on the table; in a hand it has no stand */
  if(k==='tab'&&v==='held')return '<rect x="-15" y="-23" width="30" height="23" rx="3" fill="#182e43"/><rect x="-12" y="-20" width="24" height="17" rx="1" fill="#a0c9c3"/><path d="M-3 -16 L4 -11.5 L-3 -7 Z" fill="#fff"/>';
  if(k==='tab')return '<path d="M-7 0 L-3 -8 L3 -8 L7 0 Z" fill="#8a9aa2"/><rect x="-15" y="-31" width="30" height="23" rx="3" fill="#182e43"/><rect x="-12" y="-28" width="24" height="17" rx="1" fill="#a0c9c3"/><path d="M-3 -24 L4 -19.5 L-3 -15 Z" fill="#fff"/>';
  if(k==='bub')return '<rect x="-6" y="-21" width="12" height="21" rx="3" fill="#cfeaf3" stroke="#4f8499" stroke-width="1"/><rect x="-6" y="-14" width="12" height="6" fill="#d9577f"/><rect x="-4" y="-25" width="8" height="4" rx="1" fill="#d9577f"/><path d="M0 -25 L0 -30" stroke="#4f8499" stroke-width="1.5"/><circle cx="0" cy="-34" r="4" fill="none" stroke="#4f8499" stroke-width="1.5"/>';
  if(k==='ball'){let s='';for(let i=0;i<12;i++){const a=i*Math.PI/6;s+='<circle cx="'+(11*Math.cos(a)).toFixed(1)+'" cy="'+(-12+11*Math.sin(a)).toFixed(1)+'" r="2.6" fill="#7fb236"/>';}
    return s+'<circle cx="0" cy="-12" r="11" fill="#8cc63f" stroke="#5b8a1f" stroke-width="1"/><circle cx="-4" cy="-15" r="1.7" fill="#5b8a1f"/><circle cx="3" cy="-16" r="1.7" fill="#5b8a1f"/><circle cx="-1" cy="-9" r="1.7" fill="#5b8a1f"/><circle cx="5" cy="-8" r="1.7" fill="#5b8a1f"/><path d="M-7 -17 q3 -4 8 -4" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>';}
  if(k==='book'){
    if(v==='open')return '<path d="M0 -3 L-16 -7 L-16 -28 L0 -24 Z" fill="#fff" stroke="#b8433a" stroke-width="1.6"/><path d="M0 -3 L16 -7 L16 -28 L0 -24 Z" fill="#fff" stroke="#b8433a" stroke-width="1.6"/><circle cx="-8" cy="-19" r="3" fill="#e8b737"/><path d="M3 -10 L8 -19 L13 -12 Z" fill="#3f8a4f"/>';
    return '<rect x="-11" y="-27" width="22" height="27" rx="2" fill="#b8433a"/><rect x="-11" y="-27" width="4" height="27" fill="#8e2a2a"/><rect x="-5" y="-22" width="13" height="11" fill="#fff"/><circle cx="4" cy="-19" r="2" fill="#e8b737"/><path d="M-5 -11 L-1 -16 L3 -11 Z" fill="#3f8a4f"/>';}
  if(k==='mus')return '<rect x="-13" y="-19" width="26" height="16" fill="#d9713a"/><path d="M-13 -18 L-6.5 -4 L0 -18 L6.5 -4 L13 -18" fill="none" stroke="#fff" stroke-width="1.3"/><rect x="-13" y="-4" width="26" height="4" fill="#8a4219"/><ellipse cx="0" cy="-19" rx="13" ry="4" fill="#f4ead8" stroke="#8a4219" stroke-width="1"/><path d="M-4 -22 L-14 -34 M5 -22 L15 -33" stroke="#8a6a3a" stroke-width="2" stroke-linecap="round"/>';
  if(k==='blk')return '<rect x="-15" y="-13" width="14" height="13" fill="#2f5fa3"/><rect x="1" y="-13" width="14" height="13" fill="#e8b737"/><rect x="-7" y="-26" width="14" height="13" fill="#b8433a"/><path d="M-15 -13 h14 M1 -13 h14 M-7 -26 h14" stroke="#fff" stroke-width="1.2" opacity=".55"/>';
  if(k==='fish')return bowl('<g fill="#f08a24"><ellipse cx="-6" cy="-13" rx="4.6" ry="2.7"/><path d="M-2 -13 l3.2 -2.6 l0 5.2 z"/><ellipse cx="4" cy="-15" rx="4.6" ry="2.7"/><path d="M8 -15 l3.2 -2.6 l0 5.2 z"/><ellipse cx="-1" cy="-17.5" rx="4.2" ry="2.5"/><path d="M3 -17.5 l3 -2.4 l0 4.8 z"/></g>');
  if(k==='fruit')return bowl('<circle cx="-7" cy="-13" r="3.4" fill="#d64545"/><circle cx="0" cy="-15" r="3.4" fill="#4caf50"/><circle cx="7" cy="-13" r="3.4" fill="#8e44ad"/><circle cx="-3" cy="-18" r="3.2" fill="#f39c12"/><circle cx="4" cy="-19" r="3" fill="#d64545"/>');
  if(k==='pretz')return bowl('<g fill="none" stroke="#9c6a2e" stroke-width="2.6"><path d="M-10 -12 q-2 -9 5 -8 q6 1 1 8 M-4 -12 q7 -9 11 -3 q2 5 -4 3"/><path d="M-2 -17 q3 -6 8 -3"/></g>');
  if(k==='juice')return '<rect x="-8" y="-24" width="16" height="24" rx="1.5" fill="#f2d35b" stroke="#b7950b" stroke-width="1"/><circle cx="0" cy="-11" r="4.5" fill="#d64545"/><path d="M0 -15.5 q1 -3 3 -3" fill="none" stroke="#3f8a4f" stroke-width="1.4"/><path d="M4 -24 L7 -33" stroke="#e05a4a" stroke-width="2" stroke-linecap="round"/>';
  if(k==='tube')return '<rect x="-5" y="-30" width="10" height="30" rx="5" fill="#7b61a8"/><rect x="-5" y="-13" width="10" height="3" fill="#fff" opacity=".7"/><rect x="-5" y="-21" width="10" height="2" fill="#fff" opacity=".45"/>';
  if(k==='chew')return '<ellipse cx="0" cy="-24" rx="10" ry="9" fill="none" stroke="#54676f" stroke-width="1.6"/><rect x="-6" y="-17" width="12" height="17" rx="5" fill="#2e9c8a"/><path d="M-4 -12 h8 M-4 -8 h8 M-4 -4 h8" stroke="#fff" stroke-width="1.2" opacity=".75"/>';
  return '';
}
const PA_RING='<rect class="ring" x="-20" y="-40" width="40" height="44" rx="7"/>';
/* where slot i of n stands: in the side view along the table, and in the plan across it */
function paRowX(n,i){if(n===1)return 466;if(n===2)return [410,480][i];const sp=Math.min(33,170/(n-1));return 442+(i-(n-1)/2)*sp;}
function paPlanX(n,i){if(n===1)return 545;const sp=n===2?84:Math.min(38,208/(n-1));return 545+(i-(n-1)/2)*sp;}
/* the object in the student's hand: where it sits relative to the hand, and its tilt */
const PA_HOLD={tab:[-6,5,-10],bub:[-4,12,-6],ball:[-4,9,0],book:[-6,12,-8],juice:[-4,12,-6],tube:[-3,13,-18],chew:[-2,9,-24],fish:[0,6,0],fruit:[0,6,0],pretz:[0,6,0],mus:[-4,10,0],blk:[-4,10,0]};

/* ---- the board: the form's own tables and graphs, for the worked example the walkthrough reads.
   The numbers are what the form computes for these entries; the test enters them into the form. ---- */
const PA_EX={
  pool:['Tablet (video)','Bubbles','Squeeze ball','Picture book','Musical toy','Blocks'],
  informant:['1','3','5','6','2','4'],
  src:'Teacher interview',
  /* paired stimulus: the seed-1 list for these six, each pair once; the student picks by this order,
     except on trial 3 (psNeither, by index), where no selection comes within the window */
  psNeither:[2],
  psOrder:['Tablet (video)','Bubbles','Squeeze ball','Musical toy','Picture book','Blocks'],
  psList:[['Musical toy','Tablet (video)'],['Tablet (video)','Blocks'],['Blocks','Picture book'],['Squeeze ball','Tablet (video)'],['Picture book','Musical toy'],
    ['Musical toy','Bubbles'],['Musical toy','Blocks'],['Bubbles','Blocks'],['Squeeze ball','Bubbles'],['Tablet (video)','Picture book'],['Squeeze ball','Musical toy'],
    ['Blocks','Squeeze ball'],['Bubbles','Picture book'],['Tablet (video)','Bubbles'],['Picture book','Squeeze ball']],
  ps:[['Tablet (video)','5','5','100%','HP'],['Bubbles','5','4','80%','HP'],['Squeeze ball','5','3','60%','MP'],['Musical toy','5','2','40%','MP'],['Picture book','5','0','0%','LP'],['Blocks','5','0','0%','LP']],
  psSide:{L:'50%',Ln:'7 of 14',R:'50%',Rn:'7 of 14',bias:'None',none:'7%'},
  /* MSWO: five sessions, the item chosen at each trial (No selection ends session 4) */
  ms:[['Tablet (video)','Bubbles','Squeeze ball','Musical toy','Picture book','Blocks'],['Tablet (video)','Squeeze ball','Bubbles','Musical toy','Blocks','Picture book'],
    ['Bubbles','Tablet (video)','Squeeze ball','Picture book','Musical toy','Blocks'],['Tablet (video)','Bubbles','Musical toy','Squeeze ball','Picture book','No selection'],
    ['Tablet (video)','Bubbles','Squeeze ball','Musical toy','Picture book','Blocks']],
  msOut:[['Tablet (video)','6','5','83%','1.2','HP'],['Bubbles','10','5','50%','2.0','MP'],['Squeeze ball','15','5','33%','3.0','LP'],['Musical toy','20','5','25%','4.0','LP'],['Picture book','25','5','20%','5.0','LP'],['Blocks','29','4','14%','5.8','LP']],
  /* free operant: two 300-s sessions, seconds engaged with each item (pool order) */
  fo:[['150','160'],['60','70'],['40','50'],['10','20'],['90','70'],['10','0']],
  foOut:[['Tablet (video)',52,'HP'],['Musical toy',27,'MP'],['Bubbles',22,'MP'],['Squeeze ball',15,'LP'],['Picture book',5,'LP'],['Blocks',2,'LP']],
  /* single stimulus: five trials per item, A / N / R and seconds engaged of a 30-s access */
  ss:[[['A','29'],['A','28'],['A','30'],['A','27'],['A','29']],[['A','26'],['A','25'],['A','20'],['A','24'],['A','23']],[['A','15'],['A','18'],['N',''],['A','12'],['A','16']],
      [['A','10'],['R',''],['N',''],['N',''],['A','8']],[['A','6'],['A','8'],['A','5'],['A','7'],['A','6']],[['N',''],['N',''],['A','5'],['R',''],['N','']]],
  ssOut:[['Tablet (video)','5','100%','28.6','95%','HP'],['Bubbles','5','100%','23.6','79%','HP'],['Musical toy','5','100%','6.4','21%','HP'],['Squeeze ball','5','80%','15.3','51%','HP'],['Picture book','5','40%','9.0','30%','MP'],['Blocks','5','20%','5.0','17%','LP']],
  /* ecological: the practical attributes (pool order) and the fit the form computes */
  attrs:[['Y','Long','Moderate','One','Y','Yes','Unrestricted'],['Y','Moderate','Low','None','Y','Some','None'],['Y','Moderate','Low','None','Y','Some','None'],['Y','Moderate','Low','None','Y','Some','None'],['Y','Moderate','Low','None','Y','Some','None'],['Y','Moderate','Low','None','Y','Some','None']],
  fit:['43% Poor','86% Good','86% Good','86% Good','86% Good','86% Good'],
  /* the combined hierarchy on Summary, in the order the form lists it */
  sum:[['Tablet (video)','1','100%','83%','52%','1.0 (3)','HP','43% Poor'],['Bubbles','3','80%','50%','22%','2.3 (3)','HP','86% Good'],['Squeeze ball','5','60%','33%','15%','3.3 (3)','MP','86% Good'],
    ['Musical toy','2','40%','25%','27%','3.3 (3)','MP','86% Good'],['Picture book','6','0%','20%','5%','5.0 (3)','LP','86% Good'],['Blocks','4','0%','14%','2%','6.0 (3)','LP','86% Good']],
  methods:'Paired stimulus, MSWO, Free operant',
  ioa:[['Paired stimulus','1','14','1','93% OK'],['MSWO / MSW','2','11','1','92% OK'],['Free operant','1','25','5','83% OK']],
  /* competing stimulus assessment: hand mouthing, % of 10-s intervals. A 300-s session has 30 of them,
     so every session's percentage is one the runner can write: a whole number of intervals of 30 */
  csaPool:['Vibrating tube','Chewy necklace','Tablet (video)','Squeeze ball','Picture book','Bubbles'],
  csaCtrl:['63','57','60'],
  csa:[['87','3','93','7','90','5'],['80','7','83','10','83','10'],['93','50','97','53','95','53'],['60','23','63','20','63','23'],['30','50','27','47','30','50'],['47','30','40','33','45','33']],
  csaOut:[['Vibrating tube','90%','5%','92%','HC'],['Chewy necklace','82%','9%','86%','HC'],['Tablet (video)','95%','52%','14%','HP, not competing'],
    ['Squeeze ball','62%','22%','64%','Partly competing'],['Picture book','29%','49%','19%','Not competing'],['Bubbles','44%','32%','48%','Not competing']],
  /* monitoring: eight brief MSWOs (top three) and twelve uses of the tablet */
  stab:[['2026-09-01','Tablet (video)','Bubbles','Squeeze ball'],['2026-09-04','Tablet (video)','Bubbles','Squeeze ball'],['2026-09-08','Tablet (video)','Squeeze ball','Bubbles'],['2026-09-11','Tablet (video)','Bubbles','Squeeze ball'],
    ['2026-09-15','Bubbles','Tablet (video)','Musical toy'],['2026-09-18','Bubbles','Musical toy','Tablet (video)'],['2026-09-22','Bubbles','Musical toy','Squeeze ball'],['2026-09-25','Musical toy','Bubbles','Squeeze ball']],
  mon:{lat:['2','3','2','2','3','2','5','6','8','9','11','12'],eng:['28','29','27','28','29','28','20','16','13','11','9','7'],rate:['4.5','4.4','4.6','4.5','4.3','4.6','4.2','3.8','3.5','3.0','2.6','2.4'],
    rej:[0,0,0,0,0,0,0,0,0,0,1,1],sign:['None','None','None','None','None','None','Slow to approach','Slow to approach','Slow to approach','Stops early','Pushes away / refuses','Pushes away / refuses'],note:{8:'Had tablet at lunch'}},
  monFlags:['Latency to approach doubled: 2.3 s to 8.5 s (first vs. last half of entries).','Engagement fell by half: 28 s to 13 s.','2 rejections in the last 5 uses.','Signs recorded on 5 of the last 5 uses: Slow to approach, Stops early, Pushes away / refuses.']
};
const PA_CAT={HP:'pb-hp',MP:'pb-mp',LP:'pb-lp'};
const PA_BW=464;   /* the width of the board's writing area */
function paT(x,y,t,c,a){return '<text class="'+(c||'pb-l')+'" x="'+x+'" y="'+y+'"'+(a?' text-anchor="'+a+'"':'')+'>'+t+'</text>';}
function paRule(x1,y,x2,c){return '<line class="'+(c||'pb-g')+'" x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'"/>';}
/* a table: cols [[x, anchor]], a header (a cell may be two lines), rows of cells; a cell may be
   [text, class]; o.hl marks one row, o.cls picks a cell's class */
function paTable(y0,cols,head,rows,o){
  o=o||{};const rh=o.rh||20,w=o.w||PA_BW;let g='';
  head.forEach((h,ci)=>{const lines=[].concat(h);if(lines.length===1&&o.hl2)lines.unshift('');lines.forEach((l,li)=>{if(l)g+=paT(cols[ci][0],y0+li*11,l,'pb-h',cols[ci][1]);});});
  const hy=y0+(o.hl2?11:0)+6;g+=paRule(0,hy,w,'pb-ax');
  rows.forEach((r,ri)=>{const y=hy+16+ri*rh;
    if(o.hl&&o.hl===[].concat(r[0])[0])g+='<rect class="pb-hl" x="-4" y="'+(y-13)+'" width="'+(w+8)+'" height="'+(rh-2)+'" rx="2"/>';
    else if(ri)g+=paRule(0,y-14,w);
    r.forEach((c,ci)=>{if(ci>=cols.length)return;const cell=[].concat(c);const cls=cell[1]||PA_CAT[cell[0]]||(o.cls&&o.cls(ri,ci,cell[0]))||'pb-l';g+=paT(cols[ci][0],y,cell[0],cls,cols[ci][1]);});});
  return g;
}
/* horizontal bars over width w from x0; o.max, o.ref (a dashed line), o.ticks */
function paBars(x0,y0,w,rows,o){
  o=o||{};let g='';const rh=o.rh||21,max=o.max||100;
  if(o.ticks!==false)[0,25,50,75,100].forEach(v=>{const x=x0+v/100*w;g+='<line class="pb-g" x1="'+x+'" y1="'+(y0-4)+'" x2="'+x+'" y2="'+(y0+rows.length*rh)+'"/>'+paT(x,y0+rows.length*rh+12,String(v*max/100),'pb-s','middle');});
  rows.forEach((r,i)=>{const y=y0+i*rh,bw=Math.max(1,r.v/max*w);g+=paT(x0-8,y+12,r.l,r.lc||'pb-l','end')+'<rect class="'+(r.c||'pb-b1')+'" x="'+x0+'" y="'+(y+2)+'" width="'+bw.toFixed(1)+'" height="'+(rh-7)+'"/>'+
    paT(x0+bw+6,y+12,r.t!=null?r.t:r.v+'%',r.tc||'pb-v');});
  if(o.ref!=null){const x=x0+o.ref/max*w;g+='<line class="pb-ref" x1="'+x+'" y1="'+(y0-8)+'" x2="'+x+'" y2="'+(y0+rows.length*rh)+'"/>'+paT(x+4,y0-10,o.refT||'','pb-c');}
  return g;
}
/* the brief-MSWO rank graph: dates across, rank 1 to 3 and "out" down */
function paRankGraph(n,x0,y0,w,h){
  const S=PA_EX.stab.slice(0,n),items=['Tablet (video)','Bubbles','Squeeze ball','Musical toy'].filter(it=>S.some(r=>r.slice(1).includes(it)));
  const col={'Tablet (video)':'#182e43','Bubbles':'#76a2a3','Squeeze ball':'#9b4e15','Musical toy':'#7d6b98'};
  const X=i=>x0+(n===1?w/2:i*w/(n-1)),Y=r=>y0+(r-1)*h/3;let g='';
  [1,2,3,4].forEach(r=>{g+='<line class="pb-g" x1="'+x0+'" y1="'+Y(r)+'" x2="'+(x0+w)+'" y2="'+Y(r)+'"/>'+paT(x0-8,Y(r)+4,r===4?'out':String(r),'pb-s','end');});
  S.forEach((r,i)=>{const m=/^\d{4}-(\d\d)-(\d\d)$/.exec(r[0]);g+=paT(X(i),y0+h+17,(+m[1])+'/'+(+m[2]),'pb-s','middle');});
  items.forEach(it=>{let d='';const pts=S.map((r,i)=>{const rk=r.indexOf(it);return [X(i),Y(rk<1?4:rk)];});pts.forEach((p,i)=>{d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);});
    g+='<path class="pb-ln" d="'+d+'" stroke="'+col[it]+'"/>'+pts.map(p=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.4" fill="'+col[it]+'"/>').join('');});
  let lx=0;items.forEach(it=>{g+='<rect x="'+lx+'" y="'+(y0+h+27)+'" width="11" height="11" fill="'+col[it]+'"/>'+paT(lx+15,y0+h+37,it,'pb-s');lx+=30+it.length*5.6;});
  return g;
}
function paBoard(k){
  const E=PA_EX,T=paT,W=PA_BW;
  if(k==='raisd')return T(0,14,'Indirect: Structured Informant Interview','pb-t')+T(0,32,'Record names of specific stimuli, not categories.','pb-s')+
    paTable(50,[[0],[176],[326]],['Category',['Specific stimuli the','informant names'],['What the student does','when present or removed']],[
      ['Foods and drinks','Goldfish, apple juice','Asks at snack time'],['Toys, objects, manipulatives','Bubbles, squeeze ball','Protests when removed'],
      ['Visual','Videos on the tablet','Protests when it ends'],['Auditory','Musical toy, singing','Smiles, rocks'],
      ['Social','Praise from the teacher','Looks up, smiles']],{rh:22,hl2:true,cls:(ri,ci)=>ci===0?'pb-v':'pb-l'})+
    T(0,198,'The informant nominates; the direct assessment ranks.','pb-v pb-okf');
  if(k==='pool')return T(0,14,'Indirect: Stimulus Pool for Direct Assessment','pb-t')+
    paTable(34,[[8,'middle'],[26],[152],[240],[W,'end']],['#',['Stimulus','(exact form presented)'],'Type',['Source of','nomination'],['Informant','rank']],
      E.pool.map((p,i)=>[String(i+1),p,'Leisure item',E.src,E.informant[i]]),{rh:21,hl2:true,cls:(ri,ci)=>ci===1?'pb-v':'pb-l'})+
    T(0,190,'5–8 stimuli is typical.','pb-s')+T(0,206,'The informant’s rank is recorded for comparison only.','pb-s');
  if(k==='pre'){const row=(y,lab,cells,n,p)=>{let g=T(0,y,lab,'pb-v');cells.split('').forEach((c,i)=>{g+='<rect class="'+(c==='+'?'pb-cp':'pb-cm')+'" x="'+(i*19)+'" y="'+(y+6)+'" width="16" height="17" rx="2"/>'+T(8+i*19,y+19,c==='+'?'+':'−',c==='+'?'pb-cpt':'pb-l','middle');});
      return g+T(240,y+19,n,'pb-l','middle')+T(316,y+19,p,'pb-l','middle')+T(W,y+19,'Passed','pb-hp','end');};
    return T(0,14,'Guide: Prerequisite Check for Pictorial or Verbal Formats','pb-t')+T(0,32,'10 picture–object (or word–object) matching trials in each direction','pb-s')+
      T(0,56,'Direction · trial outcomes','pb-h')+T(240,56,'Correct','pb-h','middle')+T(316,56,'% correct','pb-h','middle')+T(W,56,'Passed (≥ 90%)','pb-h','end')+paRule(0,62,W,'pb-ax')+
      row(80,'Picture (or word) → object','++++++++++','10 / 10','100%')+row(124,'Object → picture (or word)','+++++++-++','9 / 10','90%')+
      T(0,172,'Format cleared for use:','pb-l')+T(136,172,'Pictorial','pb-v')+T(0,192,'The trial count and the 90% criterion are working conventions.','pb-s')+
      T(0,208,'Clevenger and Graff (2005): both directions may be prerequisites.','pb-s');}
  if(k==='psList'){const L=E.psList;let g=T(0,14,'Paired Stimulus: the Trial List, Seed 1','pb-t')+T(0,32,'15 pairs × 1 = 15 trials for 6 stimuli; sides counterbalanced, order shuffled','pb-s');
    const col=(x0,a,b)=>{let s=T(x0+8,54,'#','pb-h','middle')+T(x0+24,54,'Left','pb-h')+T(x0+124,54,'Right','pb-h')+paRule(x0,60,x0+222,'pb-ax');
      for(let i=a;i<b;i++){const y=76+(i-a)*16;s+=T(x0+8,y,String(i+1),'pb-s','middle')+T(x0+24,y,L[i][0],'pb-l')+T(x0+124,y,L[i][1],'pb-l');}return s;};
    return g+col(0,0,8)+col(240,8,15);}
  if(k==='psBias')return T(0,14,'Paired Stimulus: Selections by Side','pb-t')+T(0,32,'The student takes the left-hand item on almost every trial','pb-s')+
    paBars(120,62,280,[{l:'Left selections',v:93,t:'93%  (14 of 15)',c:'pb-b1'},{l:'Right selections',v:7,t:'7%  (1 of 15)',c:'pb-b2'}],{rh:30,ref:75,refT:'75%'})+
    T(0,150,'Side bias:','pb-l')+T(64,150,'Suspected','pb-lp')+T(132,150,'hierarchy may reflect position','pb-s')+
    T(0,178,'≥ 75% of selections to one side flags bias:','pb-s')+T(0,194,'the hierarchy reflects position, not preference.','pb-s');
  if(k==='psRank')return T(0,14,'Paired-Stimulus Hierarchy','pb-t')+paTable(38,[[12,'middle'],[34],[212,'middle'],[278,'middle'],[352,'middle'],[W,'end']],['Rank','Stimulus','Presented','Selected','% selected','Category'],
      E.ps.map((r,i)=>[String(i+1)].concat(r)),{rh:19,cls:(ri,ci)=>ci===1?'pb-v':'pb-l'})+
    T(0,175,'Left selections '+E.psSide.L+' ('+E.psSide.Ln+') · Right '+E.psSide.R+' ('+E.psSide.Rn+') · Side bias '+E.psSide.bias,'pb-v')+
    T(0,192,'No selection '+E.psSide.none+' of scored trials: trial 3, scored Neither','pb-s')+
    T(0,208,'HP ≥ 80% of presentations selected, MP 40–79%, LP < 40% (working conventions)','pb-s');
  if(k==='ssRank')return T(0,14,'Single-Stimulus Hierarchy','pb-t')+paTable(38,[[12,'middle'],[32],[150,'middle'],[200,'middle'],[274,'middle'],[354,'middle'],[W,'end']],
      ['Rank','Stimulus','Trials',['%','approach'],['Mean','engagement (s)'],['%','engagement'],'Category'],E.ssOut.map((r,i)=>[String(i+1)].concat(r)),{rh:19,hl2:true,cls:(ri,ci)=>ci===1?'pb-v':'pb-l'})+
    T(0,190,'Three items at 100% approach, ranked by % engagement: 95%, 79%, 21%','pb-v pb-okf')+T(0,207,'HP ≥ 80% approach, MP 40–79%, LP < 40% (working conventions)','pb-s');
  if(k==='msRank')return T(0,14,'MSWO Hierarchy: Five Sessions','pb-t')+paTable(38,[[12,'middle'],[32],[186,'middle'],[248,'middle'],[314,'middle'],[380,'middle'],[W,'end']],
      ['Rank','Stimulus',['Times','available'],['Times','selected'],['%','selected'],['Mean','position'],'Category'],E.msOut.map((r,i)=>[String(i+1)].concat(r)),{rh:19,hl2:true,cls:(ri,ci)=>ci===1?'pb-v':'pb-l'})+
    T(0,190,'% selected = times selected ÷ times available × 100','pb-v')+T(0,207,'HP ≥ 80%, MP 40–79%, LP < 40% (working conventions)','pb-s');
  if(k==='msGrid'){const S=E.ms;let g=T(0,14,'MSWO: the Item Chosen at Each Trial','pb-t')+T(0,32,'Session 4 ended at trial 6: no selection within 30 s','pb-s');
    g+=T(0,56,'Trial','pb-h');S.forEach((s,j)=>{g+=T(40+j*85,56,'Session '+(j+1),'pb-h');});g+=paRule(0,62,W,'pb-ax');
    for(let t=0;t<6;t++){const y=80+t*19;g+=T(12,y,String(t+1),'pb-s','middle');S.forEach((s,j)=>{const v=s[t];g+=T(40+j*85,y,v==='Tablet (video)'?'Tablet':v==='No selection'?'No selection':v,v==='No selection'?'pb-lp':'pb-l');});}
    return g+T(0,202,'“Tablet” is Tablet (video).','pb-s');}
  if(k==='foRank'||k==='foDom'||k==='foLow'){
    const rows=k==='foRank'?E.foOut.map(r=>({l:r[0],v:r[1],t:r[1]+'%  '+r[2],c:r[2]==='HP'?'pb-b1':r[2]==='MP'?'pb-b2':'pb-b3'})):
      k==='foDom'?[['Tablet (video)',84],['Bubbles',4],['Squeeze ball',3],['Musical toy',3],['Picture book',2],['Blocks',1]].map(r=>({l:r[0],v:r[1],c:r[1]>=50?'pb-b1':'pb-b3'})):
      [['Tablet (video)',16],['Bubbles',12],['Squeeze ball',9],['Musical toy',7],['Picture book',5],['Blocks',3]].map(r=>({l:r[0],v:r[1],t:r[1]+'%  LP',c:'pb-b3'}));
    return T(0,14,k==='foLow'?'Free Operant: Every Item Under 20%':'Free Operant: % of the Session Engaged','pb-t')+T(0,32,k==='foDom'?'One item absorbs the session':'Mean of two 5-min sessions','pb-s')+
      paBars(104,54,280,rows,{rh:20,ref:70,refT:'70%'})+T(0,202,'HP ≥ 50% of the session engaged, MP 20–49%, LP < 20% (working conventions)','pb-s');}
  if(k==='ecoSet')return T(0,14,'Ecological: Settings and Routines Inventory','pb-t')+
    paTable(36,[[0],[122],[164],[258],[W,'end']],['Setting / routine','Time',['Staff','(ratio)'],['Competing stimuli','present'],['Demand','level']],[
      ['Morning work','8:15','1:3','Peers talking; window','High'],['Math centers','9:00','1:2 with para','Peer with own iPad','High'],['Lunch / recess','11:30','1:6','Swings; other students','Low'],
      ['Specials','13:00','1:8','Noise; group activity','Moderate'],['Structured session','14:00','1:1','None','Moderate']],{rh:21,hl2:true,cls:(ri,ci)=>ci===0?'pb-v':'pb-l'})+
    T(0,176,'Each row also names the reinforcers naturally available','pb-s')+T(0,192,'and the choice opportunities.','pb-s');
  if(k==='ecoMat'){const m=[['N','N','A','Y','Y','3 / 5']].concat(E.pool.slice(1).map(()=>['Y','Y','Y','Y','Y','5 / 5']));
    return T(0,14,'Ecological: Where Each Stimulus Can Be Delivered','pb-t')+T(0,32,'Y as assessed · A with adaptation · N not deliverable in that setting','pb-s')+
      paTable(56,[[0],[146,'middle'],[204,'middle'],[264,'middle'],[320,'middle'],[380,'middle'],[W,'end']],['Stimulus',['Morning','work'],['Math','centers'],['Lunch /','recess'],'Specials',['Structured','session'],'Usable'],
        E.pool.map((p,i)=>[p].concat(m[i])),{rh:19,hl2:true,cls:(ri,ci,v)=>ci===0?'pb-v':v==='N'?'pb-lp':v==='A'?'pb-mp':'pb-l'});}
  if(k==='ecoFit'){const A=E.attrs;
    return T(0,14,'Ecological: Practical Attributes and Fit','pb-t')+
      paTable(36,[[0],[130,'middle'],[192,'middle'],[250,'middle'],[300,'middle'],[362,'middle'],[W,'end']],['Stimulus',['Access','time'],['Satiation','risk'],['Staff','needed'],['Inter-','feres'],['Free access','outside'],'Fit'],
        E.pool.map((p,i)=>[p,A[i][1],A[i][2],A[i][3],A[i][5],A[i][6],E.fit[i]]),{rh:19,hl2:true,hl:'Tablet (video)',cls:(ri,ci)=>ci===0?'pb-v':ri===0&&ci>0?'pb-lp':ci===6?'pb-hp':'pb-l'})+
      T(0,190,'Portable and age-appropriate: Y for all six. Fit: Good ≥ 75%,','pb-s')+T(0,205,'Fair 50–74%, Poor < 50% (working convention).','pb-s');}
  if(k==='ecoObs')return T(0,14,'Ecological: In-Context Observation','pb-t')+T(0,32,'Total seconds approached in free time; orange: not in the pool','pb-s')+
    paBars(178,52,190,[{l:'Tablet (video)',v:380,t:'380 s (2×)',c:'pb-b1'},{l:'Musical toy',v:90,t:'90 s (1×)',c:'pb-b1'},{l:'Bubbles',v:60,t:'60 s (1×)',c:'pb-b1'},
      {l:'Sitting with J. (not in pool)',v:300,t:'300 s (1×)',c:'pb-b4'},{l:'Swing (not in pool)',v:240,t:'240 s (1×)',c:'pb-b4'}],{rh:22,max:400,ticks:false})+
    T(0,182,'Items outside the pool are candidates for the next pool.','pb-v pb-okf');
  if(k==='csaTbl'){const cc=v=>v==='HC'?'pb-hp':v==='Partly competing'?'pb-mp':'pb-lp';
    return T(0,14,'Competing Stimulus Assessment: Hand Mouthing','pb-t')+
      paTable(38,[[0],[176,'middle'],[238,'middle'],[300,'middle'],[W,'end']],['Stimulus','Mean eng','Mean PB','Reduction','Category'],
        [['Control (no items)','—','60%','—','']].concat(E.csaOut.map(r=>[r[0],r[1],r[2],r[3],[r[4],cc(r[4])]])),{rh:18,cls:(ri,ci)=>ci===0?'pb-v':'pb-l'})+
      T(0,191,'HC: the target down ≥ 80% from the control mean (modal published criterion);','pb-s')+T(0,206,'engagement reported alongside; Partly competing 50–79% (working convention)','pb-s');}
  if(k==='sumTbl'||k==='sumTblMT'||k==='sumTblFit')
    return T(0,14,'Summary: Combined Hierarchy','pb-t')+T(0,32,'Methods completed: '+E.methods,'pb-s')+
      paTable(56,[[0],[118,'middle'],[164,'middle'],[214,'middle'],[264,'middle'],[322,'middle'],[378,'middle'],[W,'end']],['Stimulus',['Informant','rank'],['PS %','selected'],['MSWO %','selected'],['FO %','engaged'],['Mean rank','(direct)'],'Composite','Fit'],
        E.sum,{rh:19,hl2:true,hl:k==='sumTblMT'?'Musical toy':k==='sumTblFit'?'Tablet (video)':null,cls:(ri,ci,v)=>ci===0?'pb-v':ci===7?(/Poor/.test(v)?'pb-lp':/Fair/.test(v)?'pb-mp':'pb-hp'):'pb-l'})+
      T(0,205,'Composite: HP top third of the pool, MP middle, LP bottom (conventions)','pb-s');
  if(k==='sumFig'){let g=T(0,14,'Methods Compared by Stimulus','pb-t')+T(0,32,'Selection % and duration % are compared by rank, not by value','pb-s');
    const cols=[['PS %sel','#182e43',2],['MSWO %sel','#9b4e15',3],['FO %eng','#54676f',4]];
    [0,25,50,75,100].forEach(v=>{const x=104+v*3.1;g+='<line class="pb-g" x1="'+x+'" y1="44" x2="'+x+'" y2="178"/>'+paT(x,190,String(v),'pb-s','middle');});
    E.sum.forEach((r,i)=>{const y=46+i*22;g+=T(96,y+13,r[0],'pb-l','end');cols.forEach((c,j)=>{g+='<rect x="104" y="'+(y+j*6)+'" width="'+Math.max(1,parseFloat(r[c[2]])*3.1).toFixed(1)+'" height="5" fill="'+c[1]+'"/>';});});
    let lx=104;cols.forEach(c=>{g+='<rect x="'+lx+'" y="197" width="11" height="11" fill="'+c[1]+'"/>'+T(lx+15,207,c[0],'pb-s');lx+=96;});return g;}
  if(k==='rankVs'){const L=['Tablet (video)','Bubbles','Squeeze ball','Musical toy','Picture book','Blocks'],M=['Tablet (video)','Squeeze ball','Musical toy','Picture book','Blocks','Bubbles'];
    const Y=i=>66+i*22,xa=150,xb=320;let g=T(0,14,'Another Student: Two Methods, Two Orders','pb-t')+T(0,32,'Rank in each method, 1 at the top','pb-s')+T(xa,52,'Paired stimulus','pb-h','end')+T(xb,52,'MSWO','pb-h');
    L.forEach((it,i)=>{const j=M.indexOf(it),hot=it==='Bubbles';g+='<line class="'+(hot?'pb-ref':'pb-g')+'" x1="'+(xa+6)+'" y1="'+(Y(i)-4)+'" x2="'+(xb-6)+'" y2="'+(Y(j)-4)+'"'+(hot?'':' style="stroke:#93aead;stroke-width:1.4"')+'/>'+
      T(xa,Y(i),(i+1)+'  '+it,hot?'pb-lp':'pb-l','end');});
    M.forEach((it,j)=>{g+=T(xb,Y(j),(j+1)+'  '+it,it==='Bubbles'?'pb-lp':'pb-l');});
    return g+T(0,206,'Bubbles: second in paired stimulus, last in MSWO','pb-v');}
  if(k==='ioa')return T(0,14,'Summary: Interobserver Agreement by Method','pb-t')+
    paTable(32,[[0],[196,'middle'],[272,'middle'],[356,'middle'],[W,'end']],['Method',['Sessions','with IOA'],'Agreements','Disagreements',['%','agreement']],
      [['Single stimulus','','','','']].concat(E.ioa).concat([['SS engagement','','','',''],['Competing stimulus','','','',''],['In-context observation','','','','']]),{rh:17,hl2:true,cls:(ri,ci,v)=>ci===0?'pb-v':/OK/.test(v)?'pb-hp':'pb-l'})+
    T(0,190,'Trial by trial (selection methods) or interval by interval (duration, CSA).','pb-s')+T(0,206,'80% is the working minimum for a hierarchy written into a plan.','pb-s');
  if(k==='stab')return T(0,14,'Monitoring: Rank on Each Brief MSWO','pb-t')+T(0,32,'Four logs: the same three items, the same #1','pb-s')+paRankGraph(4,40,56,280,96)+
    T(352,74,'Stable:','pb-v')+T(352,92,'Tablet (video) #1','pb-l')+T(352,108,'on all four','pb-l');
  if(k==='stab2')return T(0,14,'Monitoring: Rank on Each Brief MSWO','pb-t')+T(0,32,'Eight logs: the tablet slides, then leaves the top three','pb-s')+paRankGraph(8,40,56,280,96)+
    T(344,66,'LEFT THE TOP 3','pb-h')+T(344,84,'Tablet (video)','pb-lp')+T(344,100,'two consecutive','pb-s')+T(344,128,'ENTERED THE TOP 3','pb-h')+T(344,146,'Musical toy','pb-v');
  if(k==='monFlags')return T(0,14,'Monitoring: Tablet (video): Shifted','pb-t')+T(0,32,'Twelve uses logged; the first half of the entries against the last half','pb-s')+
    T(0,58,'•','pb-lp')+T(12,58,'Latency to approach doubled: 2.3 s to 8.5 s','pb-l')+T(0,80,'•','pb-lp')+T(12,80,'Engagement fell by half: 28 s to 13 s','pb-l')+
    T(0,102,'•','pb-lp')+T(12,102,'2 rejections in the last 5 uses','pb-l')+T(0,124,'•','pb-lp')+T(12,124,'Signs recorded on 5 of the last 5 uses','pb-l')+
    T(0,152,'1 of the last 5 notes mention a meal, free access, or late-session timing:','pb-s')+T(0,168,'rule out a motivating-operation effect before acting on the flags.','pb-s')+
    T(0,196,'Watch: one flag. Shifted: two or more flags.','pb-v');
  if(k==='monRules')return T(0,14,'Monitoring: Decision Rules for a Shift','pb-t')+
    T(0,42,'Check the motivating operation first','pb-v')+T(0,58,'a meal, free access at home, late in a long session','pb-s')+
    T(0,84,'Watch','pb-v')+T(0,100,'one flag: continue; next brief MSWO; rotate in a second HP item','pb-s')+
    T(0,126,'Shifted','pb-v')+T(0,142,'two or more flags, or out of the top three twice running','pb-s')+
    T(0,168,'Effect in doubt','pb-v')+T(0,184,'hierarchy stable but response rates fall: RA-1 on the top two','pb-s')+T(0,205,'Habituation: vary or alternate two items','pb-s');
  return '';
}
function screenSVG(k){
  const T=(x,y,t,c,a)=>'<text class="'+(c||'sx-l')+'" x="'+x+'" y="'+y+'"'+(a?' text-anchor="'+a+'"':'')+'>'+t+'</text>';
  const R=(x,y,w,h,c)=>'<rect class="'+c+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>';
  const V=(x,y1,y2,c)=>'<line class="'+(c||'sx-g')+'" x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'"/>';
  if(k==='caution')return T(12,24,'Read this before the graphs','sx-t')+T(12,48,'Nothing was manipulated: no reinforcement')+T(12,64,'effect can be shown here. Frequent is not')+T(12,80,'the same as contingent.')+T(12,102,'Rank hypotheses. Design the FA.','sx-v sx-teal');
  if(k==='bars')return T(12,20,'p(C|B) against the base rate','sx-t')+
    T(12,43,'Demand removed/avoided')+R(152,32,36,8,'sx-b1')+R(152,42,2.4,8,'sx-b2')+T(194,41,'30%','sx-v')+T(160,50,'2%','sx-s')+
    T(12,75,'Given staff attention')+R(152,64,34,8,'sx-b1')+R(152,74,26,8,'sx-b2')+T(192,73,'28%','sx-v')+T(184,82,'22%','sx-s')+
    R(12,95,9,9,'sx-b1')+T(25,103,'given the behavior','sx-s')+R(128,95,9,9,'sx-b2')+T(141,103,'no-behavior windows','sx-s');
  if(k==='space'){const X=v=>(22+v*90).toFixed(1),Y=v=>(104-v*90).toFixed(1);
    const pt=(x,y,n,c)=>'<circle class="'+c+'" cx="'+X(x)+'" cy="'+Y(y)+'" r="4.5"/>'+T((+X(x)+6).toFixed(1),(+Y(y)-5).toFixed(1),n,'sx-n');
    return '<line class="sx-ax" x1="22" y1="104" x2="114" y2="104"/><line class="sx-ax" x1="22" y1="104" x2="22" y2="12"/><line class="sx-g" x1="22" y1="104" x2="112" y2="14"/>'+
      T(24,11,'p(C|B)','sx-s')+T(116,110,'p(C|no B)','sx-s','end')+
      pt(0.017,0.304,'1','sx-pe')+pt(0.217,0.283,'2','sx-pa')+pt(0.25,0.043,'3','sx-pa')+
      T(126,24,'1 Demand removed/avoided','sx-l')+T(138,37,'above the diagonal','sx-s')+
      T(126,58,'2 Given staff attention','sx-l')+T(138,71,'near the diagonal','sx-s')+
      T(126,92,'3 Given peer attention','sx-l')+T(138,105,'below the diagonal','sx-s');}
  if(k==='q'){const c=142,g=[.2,.43,.6].map(v=>V(c+v*100,26,96)+V(c-v*100,26,96)).join('');
    return T(12,18,'Yule’s Q, from −1 to +1','sx-t')+g+V(c,24,98,'sx-ax')+
      R(c,33,93,10,'sx-pe')+T(c-6,42,'Demand removed','sx-l','end')+T(c+97,42,'0.93','sx-v')+
      R(c,57,17,10,'sx-pa')+T(c-6,66,'Staff attention','sx-l','end')+T(c+21,66,'0.17','sx-v')+
      R(c-76,81,76,10,'sx-pa')+T(c+6,90,'Peer attention','sx-l')+T(c-80,90,'−0.76','sx-v','end')+
      T(12,108,'dashed guides at |Q| = .20, .43, .60','sx-s');}
  if(k==='thin')return T(12,20,'Faded bars are thin','sx-t')+
    T(12,38,'Reprimand or correction delivered')+R(12,43,150,10,'sx-pa sx-dim')+T(168,52,'Q = 1.00 · thin','sx-v')+
    T(12,70,'Demand removed/avoided')+R(12,75,140,10,'sx-pe')+T(158,84,'Q = 0.93','sx-v')+
    T(12,104,'6 incidents, 0 no-behavior windows: an empty cell','sx-s');
  if(k==='opp')return T(12,20,'Adjusted for opportunity','sx-t')+
    T(12,38,'Escape/avoidance, with a demand in place')+R(12,43,124,11,'sx-pe')+V(103,40,58,'sx-mk')+T(142,52,'82% (28/34)','sx-v')+
    T(12,72,'Attention, with an attention EO in place')+R(12,77,150,11,'sx-pa sx-dim')+V(129,74,92,'sx-mk')+T(168,86,'100% (1/1) · thin','sx-v')+
    T(12,106,'dashed marker: the figure across all incidents','sx-s');
  if(k==='prec')return T(12,20,'Precursors: p(response | target)','sx-t')+
    T(12,36,'Verbal refusal')+R(12,40,59,9,'sx-pr')+V(40,37,52,'sx-mk')+T(76,48,'39%  likely','sx-v')+
    T(12,64,'Pushing materials away')+R(12,68,46,9,'sx-pr')+V(32,65,80,'sx-mk')+T(63,76,'30%  likely','sx-v')+
    T(12,92,'Repetitive motor')+R(12,96,23,9,'sx-pa')+V(43,93,108,'sx-mk')+T(48,104,'15%','sx-v')+
    T(272,106,'dashed: its own base rate','sx-s','end');
  if(k==='fa')return T(12,20,'Function established by FA:','sx-t')+T(12,36,'escape/avoidance','sx-t')+
    T(12,62,'not therapeutic','sx-big sx-red')+T(12,82,'61% delivered after the behavior','sx-l')+T(12,98,'5% delivered in no-behavior windows','sx-l')+T(272,98,'Q 0.93','sx-v','end');
  if(k==='rank')return T(12,22,'A ranking of hypotheses','sx-t')+T(12,46,'1  Escape/avoidance: test first in the FA')+
    T(12,64,'2  Attention: Q 0.35 against a 63% base rate')+T(12,98,'Not a function statement for the plan','sx-v sx-red');
  return '';
}