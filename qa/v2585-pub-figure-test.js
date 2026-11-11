/* v25.85 (the BCBA, 11/11, with a picture of a Publication graph on an iPad: "Can you fix this?") The Publication figure
   (nbhPub.figure, the same code in Form DD-1 and Form EA-1).
   A  a change line's label: to the right of its line when it fits there; to the left of it when it does not (the line used
      to run through the words); two labels do not sit on each other; only with no room on either side does it sit over the
      line, and then the line starts below the words.
   B  the data points of a long series: smaller than the space between sessions, so they do not merge into a bar; a short
      series keeps the 2.5 pt point.
   C  the two forms carry the same figure code.
   Invented data only. usage: node qa/v2585-pub-figure-test.js */
const fs=require('fs'),path=require('path');
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const DIR=path.join(__dirname,'..','NBH-Workstation');
const DD=L.forms().find(f=>f.id==='DD-1').file,EA=L.forms().find(f=>f.id==='EA-1').file;
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(DD));await sleep(1500);
  /* one figure: n sessions, all zero but one, and change lines with labels */
  const fig=(n,events)=>p.evaluate(([n,events])=>{const pts=[];for(let i=0;i<n;i++)pts.push({i,y:i===Math.floor(n/2)?1:0,title:''});
    const f=nbhPub.figure({ratio:'2:3',nSlots:n,xTitle:'School days',xLabel:i=>String(i+1),zero:false,caption:'',label:'Test',
      panels:[{yTitle:'Occurrences per day',top:5,step:1,series:[{name:'A',sym:0,dash:0,segs:[pts],pts}],singles:[],vlines:[],labels:[{s0:-0.5,s1:n-0.5,text:'Baseline'}],crit:[],tmarks:[],bmarks:[],events}]});
    const d=new DOMParser().parseFromString(f.svg,'image/svg+xml');const host=document.createElement('div');host.style.cssText='position:absolute;left:0;top:0';host.innerHTML=f.svg;document.body.appendChild(host);
    const labs=[...host.querySelectorAll('text.pub-evl')].map(t=>{const b=t.getBBox();return {x0:b.x,x1:b.x+b.width,y0:b.y,y1:b.y+b.height,over:t.getAttribute('data-over')==='1',text:t.textContent};});
    const lines=[...host.querySelectorAll('line.pub-ev')].map(l=>({x:+l.getAttribute('x1'),y1:+l.getAttribute('y1'),y2:+l.getAttribute('y2')}));
    const cs=[...host.querySelectorAll('circle')].map(c=>({x:+c.getAttribute('cx'),r:+c.getAttribute('r'),sw:+c.getAttribute('stroke-width')}));
    host.remove();return {W:f.W,pw:f.pw,labs,lines,cs};},[n,events]);
  const crossed=r=>r.labs.some((b,k)=>r.lines.some(l=>l.x>b.x0-0.2&&l.x<b.x1+0.2&&l.y1<b.y1-0.5));
  const LONG='A long label for a change inside the condition';
  let r=await fig(62,[{s:50.5,text:LONG}]);
  ok('A1 a long label near the right edge is set to the left of its line; the line does not run through it',r.labs.length===1&&r.labs[0].x1<r.lines[0].x&&!r.labs[0].over&&!crossed(r)&&r.labs[0].x0>=0,r.labs.concat(r.lines));
  r=await fig(62,[{s:5.5,text:LONG}]);
  ok('A2 near the left edge it stays to the right of its line',r.labs.length===1&&r.labs[0].x0>r.lines[0].x&&!crossed(r)&&r.labs[0].x1<=r.W,r.labs.concat(r.lines));
  r=await fig(62,[{s:30.5,text:'First change'},{s:33.5,text:'Second change'}]);
  const a=r.labs[0],b=r.labs[1];
  ok('A3 two change lines close together: the labels do not sit on each other, and no line runs through a label',r.labs.length===2&&(a.x1<=b.x0||b.x1<=a.x0)&&!crossed(r),r.labs.concat(r.lines));
  r=await fig(12,[{s:5.5,text:LONG+', far too long for a figure this narrow to hold on either side of its line'}]);
  ok('A4 no room on either side: the label is marked as over the line, and the line starts below the words',r.labs.length===1&&r.labs[0].over&&r.lines[0].y1>=r.labs[0].y1-2.5&&!crossed(r),r.labs.concat(r.lines));
  r=await fig(62,[]);
  const gap=r.pw/62,c0=r.cs[0];
  ok('B1 62 sessions: each point with its outline is narrower than the space between sessions, and not under 1.3 pt',r.cs.length===62&&c0.r>=1.3&&c0.r<2.5&&2*c0.r+c0.sw<gap&&r.cs.every(c=>c.r===c0.r),{gap,c0});
  r=await fig(12,[]);
  ok('B2 12 sessions: the point keeps its 2.5 pt and its outline',r.cs.length===12&&r.cs[0].r===2.5&&r.cs[0].sw===0.8,r.cs[0]);
  r=await fig(200,[]);
  ok('B3 200 sessions: the point stops shrinking at 1.3 pt',r.cs.length===200&&r.cs[0].r===1.3,r.cs[0]);
  await p.close();
  const blk=s=>{const i=s.indexOf('var nbhPub=(function(){'),j=s.indexOf('function sizeLine(fig,ratio,unit)',i);return i<0||j<0?null:s.slice(i,j);};
  const A=blk(fs.readFileSync(path.join(DIR,DD),'utf8')),B=blk(fs.readFileSync(path.join(DIR,EA),'utf8'));
  ok('C Form DD-1 and Form EA-1 carry the same figure code',!!A&&A===B,{a:A&&A.length,b:B&&B.length});
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
