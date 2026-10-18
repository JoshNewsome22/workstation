/* v22.59 the reinforcer menu the forms take from the case: PA-1's items without its low-preference third, except that an
   item Form RA-1 confirmed as a reinforcer stays whatever its preference (Roscoe, Iwata, & Kahng, 1999), and an item RA-1
   found no reinforcing effect for is left out; one rule (nbhCase.menuItems, in nbh-case-flow.js) for AD-1, CT-1, the Delay
   Tolerance toolkit, TD-1 and VS-1; a case with no RA-1 results gives the menu as before. Simulated data only.
   usage: node qa/v2259-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const MENU=[{name:'Tablet (video)',tier:'HP',rank:1},{name:'Fruit chew',tier:'MP',rank:2},{name:'Music',tier:'HP',rank:3},{name:'Bubbles',tier:'LP',rank:5},{name:'Stickers',tier:'LP',rank:6}];
const RA={items:[{name:'Bubbles',verdict:'Confirmed'},{name:'Music',verdict:'Not supported'},{name:'Stickers',verdict:'Untested'},{name:'Tablet (video)',verdict:'Confirmed'}]};
const F={menu:MENU,reinf:RA},F0={menu:MENU};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async file=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  /* 1-2 the rule itself */
  let p=await open('TD-1_Function-Based-Treatment-Developer_v2026-09.html');
  const r=await p.evaluate(([F,F0])=>{const a=nbhCase.menuItems(F),b=nbhCase.menuItems(F0);return {a:a.map(m=>m.name+':'+(m.ra||'')),gone:a.gone,b:b.map(m=>m.name),bgone:b.gone};},[F,F0]);
  ok('1 the rule: low preference kept when RA-1 confirmed it (Bubbles), left out when untested (Stickers); a high-preference item RA-1 found no effect for is left out (Music) and named',
     r.a.join()==='Tablet (video):Confirmed,Fruit chew:,Bubbles:Confirmed'&&r.gone.join()==='Music',r);
  ok('2 with no RA-1 results the menu is PA-1\'s without its low-preference third, as before',r.b.join()==='Tablet (video),Fruit chew,Music'&&r.bgone.length===0,r);
  /* 3 TD-1's preferred stimuli line */
  const td=await p.evaluate(F=>{window.__nbhFactsIn(F);const e=document.querySelector('[name="m.pref"]');return e?e.value:null;},F);
  ok('3 TD-1: the preferred stimuli name the confirmed low-preference item as such, and the item RA-1 found no effect for',td==='Tablet (video), Fruit chew, Bubbles (low preference, a reinforcer in RA-1) (Form PA-1, most preferred first); left out: Music (no reinforcing effect in Form RA-1)',td);
  await p.close();
  /* 4 CT-1's home reinforcers */
  p=await open('CT-1_Caregiver-Training_v2026-09.html');
  const ct=await p.evaluate(F=>{window.__nbhFactsIn(F);const e=document.querySelector('[data-m="homeR"]');return (typeof S!=='undefined'&&S.meta&&S.meta.homeR)||(e?e.value:null);},F);
  ok('4 CT-1: the home reinforcers to check with the family follow the rule',/Tablet \(video\), Fruit chew, Bubbles$/.test(ct||''),ct);
  await p.close();
  /* 5 the Delay Tolerance toolkit's preferred items */
  p=await open('Delay-Tolerance-Protocol-Toolkit.html');
  const dt=await p.evaluate(F=>{window.__nbhFactsIn(F);return [...document.querySelectorAll('#tbPref tr')].map(tr=>{const i=tr.querySelector('input');return i?i.value:'';}).filter(Boolean);},F);
  ok('5 Delay Tolerance toolkit: the preferred items follow the rule',dt.join()==='Tablet (video),Fruit chew,Bubbles',dt);
  await p.close();
  /* 6 AD-1's reinforcers */
  p=await open('AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html');
  const ad=await p.evaluate(F=>{window.__nbhFactsIn(F);return [...document.querySelectorAll('#tbRf tr')].map(tr=>{const i=tr.querySelector('input');return i?i.value:'';}).filter(Boolean);},F);
  ok('6 AD-1: the reinforcers follow the rule',ad.join()==='Tablet (video),Fruit chew,Bubbles',ad);
  await p.close();
  /* 7 VS-1's choice board */
  p=await open('VS-1_Visual-Supports_v2026-10.html');
  const vs=await p.evaluate(F=>{window.__nbhFactsIn(F);return S.choice.map(o=>o.l).filter(Boolean);},F);
  ok('7 VS-1: the choice board\'s empty cells take the menu by the rule',vs.slice(0,3).join()==='Tablet (video),Fruit chew,Bubbles'&&!vs.includes('Music')&&!vs.includes('Stickers'),vs);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('8 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
