/* v25.67 the change since baseline, as a reader would state it (the case home's graphs and the caseload's chips): a percent
   of baseline for a count or a rate; points for a measure that is itself a percent; the amount itself when the baseline is
   under 1 or the percent is over 300. Simulated numbers only. */
const L=Object.assign({},require(__dirname+'/lib.js'),{fs:require('fs'),path:require('path')});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(!c&&i!==undefined?'  '+JSON.stringify(i):''));if(!c)fails++;};
(async()=>{const errs=[];
 try{/* the two functions as the shell has them (they live inside the case home's own scope) */
  const src=L.fs.readFileSync(L.path.join(__dirname,'..','NBH-Workstation','index.html'),'utf8');
  const a=src.indexOf("const pctTxt=p=>"),b=src.indexOf("\n",src.indexOf("const chgTxt=s=>"));
  const lines=src.slice(a,src.indexOf("\n",src.indexOf("return pctTxt(s.pct);};",a))+1);
  const chgTxt=new Function(lines+';return chgTxt;')();
  const s=(base,last5,unit,measure)=>({base,last5,unit:unit||'occurrences',measure:measure||'',pct:base?(last5-base)/base*100:null});
  const r={cut:chgTxt(s(10,1)),rise:chgTxt(s(0.3,10.8)),pctm:chgTxt(s(27,41,'% of demands')),big:chgTxt(s(2,9)),dur:chgTxt(s(0.5,6,'minutes','duration')),none:chgTxt(s(0,3))};
  ok('1 a count cut from 10 to 1 a day reads -90%',r.cut==='−90%',r);
  ok('2 a behavior taught from 0.3 to 10.8 a day reads +10.5 a day, not +3173%',r.rise==='+10.5 a day',r);
  ok('3 a percent measure from 27% to 41% reads +14 pts',r.pctm==='+14 pts',r);
  ok('4 from 2 to 9 a day (+350%) reads +7 a day',r.big==='+7 a day',r);
  ok('5 minutes from 0.5 to 6 read +5.5 min a day',r.dur==='+5.5 min a day',r);
  ok('6 no baseline mean of 0 makes a change',r.none==='',r);
  ok('7 no page errors',errs.length===0,errs);
 }catch(e){ok('run',false,String(e&&e.stack||e));}
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
