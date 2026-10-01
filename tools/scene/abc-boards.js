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