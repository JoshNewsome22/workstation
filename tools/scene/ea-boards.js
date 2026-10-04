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
      [null,'Alone / No interaction','Door open; adult at a distance, not interacting','None'],['#3f8a4f','Play (control)','Colored placemat: e.g., green','Highly preferred items from PA-1']];
    let g=T(8,14,'Conditions: each card’s signal and materials','bx-t');
    C.forEach((r,i)=>{const y=42+i*32;g+=r[0]?'<rect x="8" y="'+(y-10)+'" width="14" height="14" rx="2" fill="'+r[0]+'"/>':'<rect x="8.5" y="'+(y-9.5)+'" width="13" height="13" rx="2" fill="#fff" stroke="#54676f" stroke-dasharray="2 2"/>';
      g+=T(30,y,r[1],'bx-v')+T(180,y,r[2],'bx-l')+T(30,y+14,'Materials: '+r[3],'bx-s');});return g;}
  /* the enhancement sprint (B2): true alone is chosen on Setup & safety only after three steps */
  if(k==='aloneTrue'){const box=y=>'<rect x="12" y="'+(y-10)+'" width="11" height="11" fill="#fff" stroke="#182e43"/>';
    return T(8,14,'True alone: only after three steps on Setup & safety','bx-t')+
    box(42)+T(30,42,'1  Policy check: the district’s, the agency’s and the state’s rules','bx-l')+T(46,56,'on seclusion and isolation allow it for this student and place','bx-s')+
    box(78)+T(30,78,'2  The stop-or-step-in rule: when to stop, who steps in, and how','bx-l')+
    box(100)+T(30,100,'3  How the student is watched: without a break, through a window','bx-l')+T(46,114,'or on a live video feed','bx-s')+
    T(8,138,'The door is never locked or held shut. Until all three are done,','bx-v')+T(8,153,'the form keeps the condition supervised.','bx-v');}
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