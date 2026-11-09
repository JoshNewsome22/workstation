/* v25.70 the graphs of Form DD-1 and Form EA-1 (research GRAPHS.md gaps 1, 2, 4, 7, 8; NEXT2 #5, #6; the BCBA's approval of
   11/8). Simulated data only (the forms' own simulations, "SIMULATED – Sample Student").
   1  Publication: the switch beside the graphs, Colour by default; Publication draws black and white only, a symbol for each
      series, no gridlines or shading, the condition labels at the top and the caption below; y:x 2:3 (5:8, 3:4 by choice); the
      frame follows the number of days; Save as SVG (in points), Print figure (the figure alone); back to Colour draws the
      same graphs as before; the choice is on the device, not in the record.
   2  Colour-vision safe: the palettes tested under protan, deutan (and for EA-1 tritan and grayscale) simulation; direct labels
      for alternating conditions and EA-1's conditions in place of the legend.
   3  A sentence and a table under each graph; the sentence is the graph's accessible name; it never judges. In Publication
      the sentence prints under each graph (DD-1 and EA-1; the BCBA, 11/9); in Colour it stays screen only.
   4  The iPad: a tap within 22 px shows the date, value, phase and condition; a double tap and a pinch zoom the days; Reset.
   5  What this design can show (A-B, reversal, the multielement FA); // breaks after a gap of more than 7 school days, the
      path not joined across; the days and sessions with a second observer marked.
   6  Screen only: the new text, controls and zoom are not on paper (in Colour, the sentence too); no page errors.
   usage: node qa/v2570-graphs-test.js   (WS_URL: the server) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const DD=BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html',EA=BASE+'/NBH-Workstation/EA-1_Experimental-Analysis-Protocol_v2026-09.html';
/* the colour-vision check (Machado, Oliveira & Fernandes, 2009, severity 1; CIELAB D65; delta E 1976) */
const MAT={protan:[[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],deutan:[[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],tritan:[[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]]};
const lin=c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);
const lab=([r,g,b])=>{[r,g,b]=[r,g,b].map(v=>Math.min(1,Math.max(0,v)));const X=(0.4124*r+0.3576*g+0.1805*b)/0.95047,Y=0.2126*r+0.7152*g+0.0722*b,Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883,f=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;return [116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))];};
const sim=(h,k)=>{const l=[1,3,5].map(i=>lin(parseInt(h.slice(i,i+2),16)/255));if(k==='normal')return lab(l);if(k==='gray'){const Y=0.2126*l[0]+0.7152*l[1]+0.0722*l[2];return lab([Y,Y,Y]);}return lab(MAT[k].map(r=>r[0]*l[0]+r[1]*l[1]+r[2]*l[2]));};
const worst=(P,k)=>{let m=1e9;for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=sim(P[i],k),b=sim(P[j],k);m=Math.min(m,Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));}return m;};
const contrast=h=>{const l=[1,3,5].map(i=>lin(parseInt(h.slice(i,i+2),16)/255)),Y=0.2126*l[0]+0.7152*l[1]+0.0722*l[2];return 1.05/(Y+0.05);};
(async()=>{const br=await chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,acceptDownloads:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(DD);await sleep(900);await p.evaluate(()=>{try{localStorage.removeItem('nbh.graphs.v1');}catch(e){}});await p.goto(DD);await sleep(900);
  await p.evaluate(()=>loadExample());await sleep(800);
  /* ---------------- 1 Publication ---------------- */
  const c0=await p.evaluate(()=>({sw:!!document.getElementById('ddGStyle'),pressed:(document.querySelector('#ddGStyle [aria-pressed="true"]')||{}).textContent,
    pub:document.querySelectorAll('#resultsOut svg.ddpub').length,n:document.querySelectorAll('#resultsOut .behavior-report .chartbox svg.graph').length,
    svgs:[...document.querySelectorAll('#resultsOut svg.graph')].map(s=>s.outerHTML.replace(/ aria-label="[^"]*"/,'')),state:JSON.stringify(S),
    order:(()=>{const a=document.getElementById('ddGStyle'),b=document.getElementById('resultsOut');return a&&a.nextElementSibling===b;})()}));
  ok('1 the switch sits just above the graphs, Colour (default) pressed, every graph in colour',c0.sw&&c0.order&&c0.pressed==='Colour (default)'&&c0.pub===0&&c0.n>=6,{sw:c0.sw,order:c0.order,pressed:c0.pressed,pub:c0.pub,n:c0.n});
  const tapBtn=async sel=>{const e=await p.$(sel);await e.scrollIntoViewIfNeeded();await e.click();await sleep(500);};
  await tapBtn('#ddGStyle [data-gs-style="pub"]');
  const pb=await p.evaluate(()=>{const L=[...document.querySelectorAll('#resultsOut .behavior-report .chartbox svg.graph')],col=new Set();
    document.querySelectorAll('#resultsOut svg.ddpub *').forEach(e=>['fill','stroke'].forEach(a=>{const v=e.getAttribute(a);if(v&&v!=='none')col.add(v.toLowerCase());}));
    const f=__dd2570.G.fig[S.behaviors[0].id];
    return {all:L.length,pub:L.filter(s=>s.classList.contains('ddpub')).length,col:[...col],grid:document.querySelectorAll('#resultsOut svg.ddpub [stroke="#DCE3E7"],#resultsOut svg.ddpub .dd-shade').length,
      labels:[...document.querySelectorAll('#resultsOut svg.ddpub')][0].querySelectorAll('.pub-lab').length,cap:[...[...document.querySelectorAll('#resultsOut svg.ddpub')][0].querySelectorAll('.pub-cap')].map(t=>t.textContent).join(' '),
      font:[...document.querySelectorAll('#resultsOut svg.ddpub')][0].getAttribute('font-family'),w:[...document.querySelectorAll('#resultsOut svg.ddpub')][0].getAttribute('width'),
      ratio:f?f.ph/f.pw:0,pw:f?f.pw:0,syms:new Set([...document.querySelectorAll('#resultsOut svg.ddpub')].flatMap(s=>[...s.querySelectorAll('circle,rect,polygon')].map(e=>e.tagName))).size,
      key:getComputedStyle(document.querySelector('#resultsOut .behavior-report .legend')).display,ls:localStorage.getItem('nbh.graphs.v1'),state:JSON.stringify(S),pressed:(document.querySelector('#ddGStyle [aria-pressed="true"]')||{}).textContent,
      size:(document.querySelector('.dd-pubsize')||{}).textContent||''};});
  ok('1 Publication: every graph drawn in the journal style, black and white only (no colour, no gridlines or shading)',pb.pub===pb.all&&pb.all>=6&&pb.col.every(c=>/^(#000|#fff|#000000|#ffffff|transparent)$/.test(c))&&pb.grid===0,{pub:pb.pub,all:pb.all,col:pb.col,grid:pb.grid});
  ok('1 the condition labels at the top, the caption below ("Figure 1. ... Participant SS"), Arial, sized in points',pb.labels===2&&/^Figure 1\. Occurrences per day of physical aggression across school days in Baseline and BIP \+ FCT, Participant SS\./.test(pb.cap)&&/Arial/.test(pb.font)&&/pt$/.test(pb.w),{labels:pb.labels,cap:pb.cap,font:pb.font,w:pb.w});
  ok('1 y:x 2:3 by default, and the frame follows the days (20 days: 240 pt wide, 12 pt a day); the size line says so',Math.abs(pb.ratio-2/3)<0.01&&Math.abs(pb.pw-240)<0.5&&/Proportions 2:3 \(y:x\) · 20 school days/.test(pb.size),{ratio:pb.ratio,pw:pb.pw,size:pb.size});
  ok('1 the colour key steps aside; the choice is on this device only (the record is the same)',pb.key==='none'&&pb.ls==='{"style":"pub"}'&&pb.state===c0.state&&pb.pressed==='Publication',{key:pb.key,ls:pb.ls,same:pb.state===c0.state});
  for(const [r,v] of [['5:8',0.625],['3:4',0.75]]){await tapBtn(`#ddGStyle [data-gs-ratio="${r}"]`);const q=await p.evaluate(()=>{const f=__dd2570.G.fig[S.behaviors[0].id];return f.ph/f.pw;});ok(`1 proportions ${r}: the plot is y:x ${v}`,Math.abs(q-v)<0.01,q);}
  await tapBtn('#ddGStyle [data-gs-ratio="2:3"]');
  /* the frame follows N: 8 days, the narrowest frame (150 pt), still 2:3 */
  const few=await p.evaluate(()=>{const A=__dd2570.G.args[S.behaviors[0].id],R=A.rows.slice(0,8),C=buildConditions().map(c=>Object.assign({},c,{rowIdx:c.rowIdx.filter(i=>i<8)})).filter(c=>c.rowIdx.length);
    const f=__dd2570.pubChart(A.beh,R,C,C.map(c=>analyzeCondition(c,A.beh,R)));return {pw:f.pw,r:f.ph/f.pw,n:f.nSlots};});
  ok('1 a short record is not stretched: 8 days draw 150 pt wide (not 340), at 2:3',few.n===8&&Math.abs(few.pw-150)<0.5&&Math.abs(few.r-2/3)<0.01,few);
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.evaluate(()=>document.querySelector('#resultsOut [data-g70="svg"]').click())]);
  let svgTxt='';if(dl){const fp=await dl.path();svgTxt=require('fs').readFileSync(fp,'utf8');}
  ok('1 Save as SVG: a vector file in points, named with initials only, with the caption',!!dl&&/^DD-1_figure_SS_Physical_aggression_\d{4}-\d\d-\d\d\.svg$/.test(dl.suggestedFilename())&&/^<\?xml/.test(svgTxt)&&/<svg[^>]* width="\d+pt"/.test(svgTxt)&&/Figure 1\./.test(svgTxt)&&!/SIMULATED|Sample Student/.test(svgTxt),{name:dl&&dl.suggestedFilename(),head:svgTxt.slice(0,160)});
  const pr=await p.evaluate(()=>{let seen=null;const keep=window.print;window.print=()=>{seen={cls:document.body.className.indexOf('nbh-pubprint')>-1,svg:document.querySelectorAll('#nbhPubPrint svg.ddpub').length};};
    document.querySelector('#resultsOut [data-g70="print"]').click();window.print=keep;window.dispatchEvent(new Event('afterprint'));return {seen,after:document.body.classList.contains('nbh-pubprint')};});
  ok('1 Print figure: the figure alone goes to the printer, then the page is as it was',pr.seen&&pr.seen.cls&&pr.seen.svg===1&&!pr.after,pr);
  await p.emulateMedia({media:'print'});
  const pp=await p.evaluate(()=>{const s=document.querySelector('#resultsOut svg.ddpub');return {w:getComputedStyle(s).width,vb:s.viewBox.baseVal.width,sw:getComputedStyle(document.getElementById('ddGStyle')).display};});await p.emulateMedia({media:'screen'});
  ok('1 on paper a Publication figure prints at its size in points (1 pt a unit) and the switch is not printed',Math.abs(parseFloat(pp.w)-pp.vb*96/72)<1.5&&pp.sw==='none',pp);
  /* the paired graph and the stacked view */
  await p.evaluate(()=>{S.settings.stack=true;renderResults();});await sleep(500);
  const st=await p.evaluate(()=>{const s=document.querySelector('.dd-stack svg.ddpub');return s?{tiers:s.querySelectorAll('.pub-tier').length,dog:s.querySelectorAll('.pub-dog').length}:null;});
  ok('1 the stacked view in Publication: one panel a tier, named at its right, with the stepped phase line',st&&st.tiers>=6&&st.dog>=1,st);
  await p.evaluate(()=>{S.settings.stack=false;renderResults();});await sleep(300);
  await tapBtn('#ddGStyle [data-gs-style="colour"]');
  const back=await p.evaluate(()=>({svgs:[...document.querySelectorAll('#resultsOut svg.graph')].map(s=>s.outerHTML.replace(/ aria-label="[^"]*"/,'')),ls:localStorage.getItem('nbh.graphs.v1')}));
  ok('1 back to Colour: the same graphs, mark for mark, and nothing kept on the device',back.svgs.length===c0.svgs.length&&back.svgs.every((s,i)=>s===c0.svgs[i])&&back.ls===null,{n:[back.svgs.length,c0.svgs.length],diff:back.svgs.findIndex((s,i)=>s!==c0.svgs[i]),ls:back.ls});
  /* ---------------- 2 colour-vision safe ---------------- */
  const pal=await p.evaluate(()=>PALETTE.slice());
  const pw=['normal','protan','deutan'].map(k=>worst(pal,k));
  ok('2 DD-1\'s palette: no two of its 8 colours closer than 8.5 (CIELAB) for normal, protan or deutan vision, each 4.5:1 on white',pw.every(v=>v>=8.5)&&pal.every(h=>contrast(h)>=4.5),{pal,pw:pw.map(v=>v.toFixed(1))});
  await p.evaluate(()=>{S.settings.alt=true;renderResults();});await sleep(500);
  const alt=await p.evaluate(()=>({dl:document.querySelectorAll('#resultsOut .dd-altdl text').length,key:document.querySelectorAll('#resultsOut .dd-altdl-key').length,svg:document.querySelectorAll('#resultsOut .behavior-report .chartbox svg.graph').length}));
  ok('2 alternating conditions: each condition named at the end of its path, in place of the legend\'s lines',alt.dl>=2&&alt.key>=1,alt);
  await p.evaluate(()=>{S.settings.alt=false;renderResults();});await sleep(400);
  /* ---------------- 3 a sentence and a table ---------------- */
  const s3=await p.evaluate(()=>{const s=document.querySelector('#resultsOut .dd-gsum'),g=document.querySelector('#resultsOut .behavior-report .chartbox svg.graph');return {s:s?s.textContent:'',aria:g.getAttribute('aria-label'),all:[...document.querySelectorAll('#resultsOut .dd-gsum')].map(e=>e.textContent).join(' ')};});
  ok('3 the sentence: "Physical aggression: Baseline mean 10 occurrences (6 days); BIP + FCT mean 2.14 (14 days); the last 5 days are all below the Baseline range (8 to 12)."',/^Physical aggression: Baseline mean 10 occurrences \(6 days\); BIP \+ FCT mean 2\.14 \(14 days\); the last 5 days are all below the Baseline range \(8 to 12\)\./.test(s3.s),s3.s);
  ok('3 it is the graph\'s accessible name, and no sentence judges (effective, mastered, success, fail, improve)',s3.aria.indexOf('Line graph of Physical aggression. Physical aggression: Baseline mean 10')===0&&!/effective|mastered|success|fail|improv/i.test(s3.all),{aria:s3.aria});
  await tapBtn('#resultsOut [data-g70="table"]');
  const t3=await p.evaluate(()=>{const w=document.querySelector('#resultsOut .dd-gtab:not([hidden])');const b=document.querySelector('#resultsOut [data-g70="table"]');return w?{n:w.querySelectorAll('tbody tr').length,h:[...w.querySelectorAll('thead th')].map(t=>t.textContent).join('|'),r14:w.querySelectorAll('tbody tr')[13].textContent,exp:b.getAttribute('aria-expanded'),cap:w.querySelector('caption').textContent}:null;});
  ok('3 Show as table: every day, with its condition, the change in effect, the value and notes',t3&&t3.n===20&&t3.h==='Day|Date|Condition|Change in effect|Value|Notes'&&/BIP \+ FCTMedication change/.test(t3.r14)&&t3.exp==='true',t3);
  /* ---------------- 4 the iPad ---------------- */
  await p.evaluate(()=>{const s=document.querySelector('#resultsOut .chartbox svg.graph');s.scrollIntoView({block:'center'});});await sleep(300);
  const pt=await p.evaluate(()=>{const s=document.querySelector('#resultsOut .chartbox svg.graph'),P=__dd2570.G.pts[s.getAttribute('data-dd-b')][13],m=s.getScreenCTM();return {x:m.a*P.cx+m.e,y:m.d*P.cy+m.f};});
  const tipOf=()=>p.evaluate(()=>{const t=document.getElementById('ddPtTip');return t&&t.classList.contains('on')?t.innerText:'';});
  await p.evaluate(()=>{const t=document.getElementById('ddPtTip');if(t)t.classList.remove('on');});
  await p.touchscreen.tap(pt.x,pt.y-36);await sleep(250);const far=await tipOf();await sleep(450);
  await p.touchscreen.tap(pt.x+14,pt.y-15);await sleep(250);const tip=await tipOf();
  ok('4 a tap within 22 px of a point (a 44 px target) shows its date, value, phase and condition; one farther away shows nothing',!far&&/^\w{3}, \w+ \d+, \d{4}\nPhysical aggression: 2 occurrences\nPhase: BIP \+ FCT\nCondition: Medication change \(since /.test(tip),{far,tip});
  await sleep(500);
  await p.touchscreen.tap(pt.x,pt.y);await sleep(110);await p.touchscreen.tap(pt.x,pt.y);await sleep(600);
  const z1=await p.evaluate(()=>({z:Object.values(__dd2570.G.zoom)[0]||null,txt:(document.querySelector('.dd-zoomctl:not([hidden]) .dd-zoomtxt')||{}).textContent||'',zoomed:document.querySelectorAll('#resultsOut svg.graph[data-zoom]').length}));
  ok('4 a double tap zooms the days around it (half of them), and says so',z1.z&&z1.z[1]-z1.z[0]===10&&z1.z[0]<=13&&z1.z[1]>=13&&z1.zoomed===1&&/^Zoomed: .* \(11 of 20 days; the lines are for the days shown\)/.test(z1.txt),z1);
  const cdp=await ctx.newCDPSession(p);const c=await p.evaluate(()=>{const r=document.querySelector('#resultsOut .chartbox svg.graph').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  const tp=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  await tp('touchStart',[[c.x-40,c.y],[c.x+40,c.y]]);for(let k=1;k<=6;k++)await tp('touchMove',[[c.x-40-k*20,c.y],[c.x+40+k*20,c.y]]);await tp('touchEnd',[]);await sleep(500);
  const z2=await p.evaluate(()=>Object.values(__dd2570.G.zoom)[0]||null);
  ok('4 a pinch zooms further (to no fewer than 4 days)',z2&&z2[1]-z2[0]>=4&&z2[1]-z2[0]<10,z2);
  const rz=await p.evaluate(()=>{const b=document.querySelector('.dd-zoomctl:not([hidden]) [data-g70="reset"]'),r=b.getBoundingClientRect();b.click();return {h:r.height,z:JSON.stringify(__dd2570.G.zoom),left:document.querySelectorAll('#resultsOut svg.graph[data-zoom]').length};});
  ok('4 Reset zoom (44 px tall) puts every day back',rz.h>=44&&rz.z==='{}'&&rz.left===0,rz);
  const sizes=await p.evaluate(()=>[...document.querySelectorAll('#ddGStyle button,#resultsOut [data-g70]')].map(b=>{const r=b.getBoundingClientRect();return Math.min(r.width,r.height);}).filter(v=>v>0));
  ok('4 every new control is a 44 px target',sizes.length>=10&&sizes.every(v=>v>=43.5),sizes.filter(v=>v<43.5));
  /* ---------------- 5 the design, breaks in time, IOA days ---------------- */
  const d5=await p.evaluate(()=>[...document.querySelectorAll('#resultsOut .dd-dcheck')].map(e=>e.textContent)[0]||'');
  ok('5 What this design can show: an A-B design, said neutrally, with what to add',/A-B design: can show a change after the plan started\. It can't show that the plan caused it \(a functional relation\)\. To show that, add a return to baseline/.test(d5)&&/Phase changes: 1/.test(d5)&&/fewest 6/.test(d5)&&!/meets|fails|weak|strong/i.test(d5),d5);
  /* a record with a two-week break (12 school days) and a second observer on three days; then a return to baseline */
  const gap=await p.evaluate(()=>{const R=sortedRows();const shift=(iso,n)=>{const d=new Date(iso+'T12:00:00');let k=n;while(k>0){d.setDate(d.getDate()+1);if(d.getDay()%6)k--;}return localISO(d);};
    for(let i=R.length-1;i>=12;i--)R[i].date=shift(R[i].date,12);const b=S.behaviors[0];[2,8,15].forEach(i=>{R[i].ioa={[b.id]:String(Number(R[i].values[b.id])||0)};});renderResults();
    const s=document.querySelector('#resultsOut .behavior-report .chartbox svg.graph'),brk=s.querySelectorAll('.dd-brk'),pl=s.querySelector('.dd-brk');
    const bx=pl?+pl.querySelector('rect').getAttribute('x')+4:0,join=[...s.querySelectorAll('polyline')].filter(l=>{const xs=l.getAttribute('points').trim().split(/\s+/).map(q=>+q.split(',')[0]);return Math.min(...xs)<bx&&Math.max(...xs)>bx&&l.getAttribute('stroke')===b.color;}).length;
    return {brk:brk.length,n:pl?pl.getAttribute('data-brk'):'',join,ioa:s.querySelectorAll('.dd-ioa-mk').length,hint:(document.querySelector('#resultsOut .dd-brk-h')||{}).textContent||'',key:document.querySelectorAll('#resultsOut .dd-ioa-key').length,
      row:[...document.querySelectorAll('#resultsOut .dd-gtab-t tbody tr')].map(r=>r.textContent).find(t=>/after a break/.test(t))||''};});
  ok('5 a break of 12 school days: // across the time axis, and the data path is not joined across it',gap.brk===1&&gap.n==='12'&&gap.join===0&&/^\/\/ on the time axis: 12 school days between .* \(more than 7\)\. The data path is not joined across it\./.test(gap.hint),gap);
  ok('5 the three days with a second observer are marked, with a key',gap.ioa===3&&gap.key>=1,gap);
  await tapBtn('#ddGStyle [data-gs-break="15"]');
  const g15=await p.evaluate(()=>({brk:document.querySelectorAll('#resultsOut .dd-brk').length,ls:localStorage.getItem('nbh.graphs.v1')}));
  ok('5 the break is a setting (7 by default; 15 here leaves a 12-day gap joined), kept on the device',g15.brk===0&&g15.ls==='{"breakDays":15}',g15);
  await tapBtn('#ddGStyle [data-gs-break="7"]');
  await tapBtn('#ddGStyle [data-gs-style="pub"]');
  const gp=await p.evaluate(()=>{const s=document.querySelector('#resultsOut svg.ddpub');return {brk:s.querySelectorAll('.pub-brk').length,ioa:s.querySelectorAll('.pub-ioa').length,cap:[...s.querySelectorAll('.pub-cap')].map(t=>t.textContent).join(' ')};});
  ok('5 in Publication too: the //, the IOA days, and the caption gives the IOA',gp.brk===1&&gp.ioa===3&&/IOA on 3 of 20 days \(15%\)/.test(gp.cap)&&/\/\/: more than 7 school days/.test(gp.cap),gp);
  await tapBtn('#ddGStyle [data-gs-style="colour"]');
  const rev=await p.evaluate(()=>{const R=sortedRows();R[16].phaseType='full';R[16].phaseLabel='Baseline';renderResults();return [...document.querySelectorAll('#resultsOut .dd-dcheck')].map(e=>e.textContent)[0]||'';});
  ok('5 a return to baseline is read as a reversal, with the 4 phases it needs',/^What this design can showReversal \(a condition repeated\): can show a functional relation .* It needs at least 4 phases \(A-B-A-B\)\./.test(rev)&&/Phase changes: 2 \(3 or more for a reversal\)/.test(rev)&&/IOA: a second observer in 2 of 3 conditions/.test(rev),rev);
  /* ---------------- 6 screen only ---------------- */
  await p.emulateMedia({media:'print'});
  const pr6=await p.evaluate(()=>['#ddGStyle','#resultsOut .dd-gsum','#resultsOut .dd-dcheck','#resultsOut .dd-graphsave'].map(s=>{const e=document.querySelector(s);return e?getComputedStyle(e).display:'absent';}));
  await p.emulateMedia({media:'screen'});
  ok('6 the switch, the sentence, the design check and the buttons are not on paper',pr6.every(d=>d==='none'),pr6);
  /* in Publication the sentence prints under each graph, in the figure's type; the switch, design check and buttons do not */
  await tapBtn('#ddGStyle [data-gs-style="pub"]');await p.emulateMedia({media:'print'});
  const pp6=await p.evaluate(()=>{const R=[...document.querySelectorAll('#resultsOut .behavior-report')].filter(r=>r.querySelector('.chartbox svg.ddpub[data-dd-b]'));
    return {n:R.length,rows:R.map(r=>{const g=r.querySelector('.chartbox svg.ddpub'),s=r.querySelector('.dd-gsum-pub');if(!s)return {missing:true};const cs=getComputedStyle(s);
      return {d:cs.display,pt:cs.fontSize,under:!!(g.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING)&&s.getBoundingClientRect().top>=g.getBoundingClientRect().bottom-1,np:s.classList.contains('noprint')||s.classList.contains('no-print'),t:s.textContent,a:g.getAttribute('aria-label')||''};}),
      other:['#ddGStyle','#resultsOut .dd-dcheck','#resultsOut .dd-graphsave','#resultsOut .dd-pubsize'].map(q=>{const e=document.querySelector(q);return e?getComputedStyle(e).display:'absent';})};});
  await p.emulateMedia({media:'screen'});
  ok('6 Publication: the sentence prints under each of the '+pp6.n+' graphs (9 pt, the words the figure is named by); the switch, design check and buttons still do not',pp6.n>=3&&pp6.rows.every(r=>!r.missing&&r.d==='block'&&r.pt==='12px'&&r.under&&!r.np&&r.t&&r.a.indexOf(r.t)>-1)&&/^Physical aggression: Baseline mean 10 occurrences/.test(pp6.rows[0].t)&&pp6.other.every(d=>d==='none'||d==='absent'),pp6);
  await tapBtn('#ddGStyle [data-gs-style="colour"]');
  const cl6=await p.evaluate(()=>[...document.querySelectorAll('#resultsOut .dd-gsum')].map(s=>s.className));
  ok('6 back in Colour the sentence is screen only again',cl6.length>=3&&cl6.every(c=>/\bnoprint\b/.test(c)&&!/dd-gsum-pub/.test(c)),cl6);
  await ctx.close();

  /* ---------------- EA-1 ---------------- */
  const c2=await br.newContext({viewport:{width:820,height:1180},hasTouch:true,acceptDownloads:true});const e=await c2.newPage();e.on('pageerror',x=>errs.push('EA-1 '+x.message));e.on('dialog',d=>d.accept().catch(()=>{}));
  await e.goto(EA);await sleep(1300);
  await e.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape';document.getElementById('simBtn').click();});await sleep(2000);
  await e.evaluate(()=>eaAPI.setView('sessions'));await sleep(500);
  const ea0=await e.evaluate(()=>{const s=document.querySelector('#sessFig svg');return {sw:!!(document.getElementById('sessFig').previousElementSibling||{}).classList&&document.getElementById('sessFig').previousElementSibling.classList.contains('nbh-gs'),
    dl:[...s.querySelectorAll('.ea-dl')].map(t=>t.textContent),legend:document.getElementById('sessLegend').hidden,aria:s.getAttribute('aria-label'),role:s.getAttribute('role'),
    sum:(document.querySelector('#sessFig .ea-gsum')||{}).textContent||'',ioa:s.querySelectorAll('.ea-ioa-mk').length,dc:(document.querySelector('#sessFig .ea-dcheck')||{}).textContent||''};});
  ok('EA-1 2 the condition names at the right ends of their paths in place of the legend',ea0.dl.length===4&&ea0.dl.includes('Demand')&&ea0.legend===true,ea0);
  const cols=await e.evaluate(()=>{const s=document.documentElement.innerHTML.match(/const COLORS=(\[[^\]]+\])/);return s?JSON.parse(s[1].replace(/'/g,'"')):[];});
  const cw=['normal','protan','deutan','tritan','gray'].map(k=>worst(cols,k));
  ok('EA-1 2 its six condition colours: no two closer than 8.5 for normal, protan, deutan or tritan vision or in grayscale',cols.length===6&&cw.every(v=>v>=8.5),{cols,cw:cw.map(v=>v.toFixed(1))});
  ok('EA-1 3 the sentence under the graph is its accessible name and names the highest mean descriptively',ea0.role==='img'&&/^Line graph: Experimental analysis: .*Attention mean 0\.18 \(4 sessions\); Demand mean 2\.35 \(4 sessions\).*; the highest mean is in Demand\.$/.test(ea0.aria)&&ea0.sum&&ea0.aria.indexOf(ea0.sum)>-1,ea0);
  await e.evaluate(()=>document.querySelector('#sessFig [data-e70="table"]').click());await sleep(250);
  const et=await e.evaluate(()=>{const w=document.getElementById('eaGTab-sessFig');return w&&!w.hidden?{n:w.querySelectorAll('tbody tr').length,io:[...w.querySelectorAll('tbody tr')].filter(r=>/second observer, agreement/.test(r.textContent)).length}:null;});
  ok('EA-1 3 Show as table: every session, with the second observer\'s agreement where there was one',et&&et.n===16&&et.io===4,et);
  ok('EA-1 5 the sessions with a second observer marked (4); What this design can show for the multielement analysis',ea0.ioa===4&&/Multielement functional analysis: can show which test condition, if any, keeps responding above the control/.test(ea0.dc)&&/A control condition: Play \(control\)/.test(ea0.dc),ea0);
  /* a break: sessions 9 to 16 moved three weeks on */
  const eb=await e.evaluate(()=>{const add=(v,n)=>{const m=/^(\d+)\/(\d+)\/(\d+)$/.exec(v);const d=new Date(+m[3],+m[1]-1,+m[2],12);let k=n;while(k>0){d.setDate(d.getDate()+1);if(d.getDay()%6)k--;}return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();};
    for(let i=8;i<16;i++){const el=document.querySelector(`[name="s[${i}].d"]`);el.value=add(el.value,15);}eaAPI.renderGraph();const s=document.querySelector('#sessFig svg');
    return {brk:s.querySelectorAll('.ea-brk').length,paths:[...s.querySelectorAll('path.series')].map(p=>(p.getAttribute('d').match(/M/g)||[]).length),hint:(document.querySelector('#sessFig .ea-brk-h')||{}).textContent||''};});
  ok('EA-1 5 a gap of more than 7 school days between sessions 8 and 9: // on the axis, and no path across it',eb.brk===1&&eb.paths.every(n=>n>=2)&&/^\/\/ on the session axis: \d+ school days between sessions 8 and 9/.test(eb.hint),eb);
  await e.evaluate(()=>document.querySelector('.nbh-gs [data-gs-style="pub"]').click());await sleep(500);
  const ep=await e.evaluate(()=>{const s=document.querySelector('#sessFig svg.ddpub');if(!s)return null;const col=new Set();s.querySelectorAll('*').forEach(x=>['fill','stroke'].forEach(a=>{const v=x.getAttribute(a);if(v&&v!=='none')col.add(v.toLowerCase());}));
    return {col:[...col],open:s.querySelectorAll('circle[fill="#fff"]').length,dl:s.querySelectorAll('.pub-dl').length,brk:s.querySelectorAll('.pub-brk').length,cap:[...s.querySelectorAll('.pub-cap')].map(t=>t.textContent).join(' '),
      size:(document.querySelector('#sessFig .ea-pubsize')||{}).textContent||'',legend:document.getElementById('sessLegend').hidden,bar:document.querySelectorAll('#sessFig [data-e70]').length};});
  ok('EA-1 1 Publication: black and white, the control open, the names at the path ends, the // and the caption below',ep&&ep.col.every(c=>/^(#000|#fff|transparent)$/.test(c))&&ep.open===4&&ep.dl===4&&ep.brk===1&&/^Figure 1\. Responses per minute across sessions in the Attention, Demand, Alone \/ No interaction and Play \(control\) conditions, Participant SS\./.test(ep.cap)&&/^Proportions 2:3 \(y:x\) · 16 sessions/.test(ep.size)&&ep.bar===3,ep);
  await e.emulateMedia({media:'print'});
  const eq=await e.evaluate(()=>{const s=document.querySelector('#sessFig .ea-gsum-pub'),g=document.querySelector('#sessFig svg.ddpub');if(!s||!g)return null;const cs=getComputedStyle(s);
    return {d:cs.display,pt:cs.fontSize,under:s.getBoundingClientRect().top>=g.getBoundingClientRect().bottom-1,t:s.textContent,n:document.querySelectorAll('#sessFig .ea-gsum').length,bar:getComputedStyle(document.querySelector('#sessFig .ea-pubbar')).display};});
  await e.emulateMedia({media:'screen'});
  ok('EA-1 3 Publication: the sentence is under the figure and prints with it (9 pt); the buttons do not',eq&&eq.n===1&&eq.d==='block'&&eq.pt==='12px'&&eq.under&&/^Experimental analysis: .*Demand mean 2\.35 \(4 sessions\).*; the highest mean is in Demand\.$/.test(eq.t)&&eq.bar==='none',eq);
  await e.evaluate(()=>document.querySelector('.nbh-gs [data-gs-style="colour"]').click());await sleep(400);
  await e.emulateMedia({media:'print'});
  const ec=await e.evaluate(()=>{const s=document.querySelector('#sessFig .ea-gsum');return s?{d:getComputedStyle(s).display,pub:s.classList.contains('ea-gsum-pub')}:null;});
  await e.emulateMedia({media:'screen'});
  ok('EA-1 6 in Colour the sentence stays screen only',ec&&ec.d==='none'&&!ec.pub,ec);
  ok('EA-1 back to Colour',await e.evaluate(()=>!document.querySelector('#sessFig svg.ddpub')&&!!document.querySelector('#sessFig svg .series')),'');
  await c2.close();
  ok('no page errors',!errs.length,errs.slice(0,5));
 }catch(err){ok('the run finished',false,String(err&&err.stack||err).slice(0,500));}
 await br.close();console.log(fails?`RESULT: ${fails} failed`:'RESULT: all passed');process.exit(fails?1:0);})();
