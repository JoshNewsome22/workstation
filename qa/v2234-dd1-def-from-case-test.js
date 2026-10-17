/* v22.34 Form DD-1 takes a behavior's definition from Form TB-1 when the row is already there: a target row whose
   definition is empty takes it under "From the case" (before, only a replacement row did, and the picker said "Nothing to
   place"), and on reading the case; a definition written on DD-1 is kept; a cluster's definition comes with its members'
   lines (Included topographies), since it names them "listed below"; a row an older read gave the bare cluster definition
   takes the members too. Also: the three-column field blocks (TB-1's definition cards) have each label above its box on
   screen. iPad-like (touch). Simulated data only.
   usage: node qa/v2234-dd1-def-from-case-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CL_DEF='Contact with another person in one of the member forms listed below (simulated).';
const CL_TOPS='PN - Pinching: skin squeezed between fingers (simulated)\nPU - Pushing: a thrust that moves the person (simulated)';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1200);
  const setup=()=>p.evaluate(({CL_DEF})=>{S=blankState();S.meta.client='Mateo Rivera';
    const mk=(n,d)=>({id:uid('b'),kind:'target',name:n,definition:d,obsLength:'Entire school day',measure:'count',direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Head hitting with hand','Written on DD-1 (simulated).'),mk('Elbow-to-thigh',''),mk('Lower-urgency physical aggression',CL_DEF)];S.rows=[];renderAll();},{CL_DEF});
  const behs=[{label:'Head hitting with hand',def:'From TB-1 (simulated).',type:'Single topography',isRep:false,tops:''},
    {label:'Elbow-to-thigh',def:'Hitting the elbow against the thigh (simulated).',type:'Single topography',isRep:false,tops:''},
    {label:'Lower-urgency physical aggression',def:CL_DEF,type:'Cluster (multiple topographies)',isRep:false,tops:CL_TOPS}];
  const defs=()=>p.evaluate(()=>S.behaviors.map(b=>b.definition));
  await setup();
  const r1=await p.evaluate(b=>window.__nbhFactsPick({behaviors:b,goals:{red:[],acq:[]},facts:{behaviors:b}}),behs);const d1=await defs();
  ok('1 the picker fills an empty target definition (no "Nothing to place")',r1.filled>=1&&d1[1]==='Hitting the elbow against the thigh (simulated).',{r1,d1});
  ok('2 a definition written on DD-1 is kept',d1[0]==='Written on DD-1 (simulated).',d1);
  ok('3 a cluster row holding the bare definition takes its members\' lines',d1[2]===CL_DEF+'\n'+CL_TOPS,d1[2]);
  ok('4 no row added',d1.length===3,d1);
  const dom=await p.evaluate(()=>[...document.querySelectorAll('textarea[data-f=definition]')].map(t=>t.value));
  ok('5 the table on screen shows the definitions',dom[1]==='Hitting the elbow against the thigh (simulated).'&&dom[2].indexOf('PU - Pushing')>0,dom);
  /* reading the case (opening the form in a case) fills the empty one too */
  await setup();
  const r2=await p.evaluate(b=>window.__nbhFactsIn({behaviors:b}),behs);const d2=await defs();
  ok('6 reading the case fills an empty definition and says so',d2[1]==='Hitting the elbow against the thigh (simulated).'&&/TB-1’s definition is now on Elbow-to-thigh/.test(r2.note||''),{r2,d2});
  ok('7 reading the case keeps a written one',d2[0]==='Written on DD-1 (simulated).',d2);
  const r3=await p.evaluate(b=>window.__nbhFactsIn({behaviors:b}),behs);
  ok('8 a second read changes nothing',!r3.filled,r3);
  /* a record made from the case: the cluster's members come with its definition */
  const d4=await p.evaluate(b=>{S=blankState();S.behaviors=['Physical aggression','Self-injury','Property destruction'].map(n=>({id:uid('b'),kind:'target',name:n,definition:'',obsLength:'',measure:'count',direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]}));S.rows=[];
    window.__nbhFactsIn({behaviors:b});return S.behaviors.map(x=>x.definition);},behs);
  ok('9 a new record from the case: the cluster\'s members come with it',d4.length===3&&d4[2]===CL_DEF+'\n'+CL_TOPS,d4);
  /* TB-1's definition card: each label above its box */
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.goto(L.BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html');await sleep(1200);
  const lay=await p2.evaluate(()=>{const c=document.querySelector('#tgtWrap .ident.c3');for(let e=c;e&&e!==document.body;e=e.parentElement)if(getComputedStyle(e).display==='none'){e.hidden=false;e.style.setProperty('display','block','important');}
    return [...c.querySelectorAll(':scope > .f')].map(f=>{const l=f.querySelector(':scope>label').getBoundingClientRect(),b=f.querySelector(':scope>input,:scope>select').getBoundingClientRect();return {above:l.bottom<=b.top+2,w:Math.round(b.width),cw:Math.round(f.getBoundingClientRect().width)};});});
  ok('10 TB-1 definition card: every label sits above its box, and each box spans its column',lay.length===8&&lay.every(x=>x.above&&x.w>=x.cw-2),lay);
  ok('11 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
