/* Form CR-1's statute summary checked against the 2026 text of s. 1003.573, F.S. (v23.51, review F343): last amended in
   2023; the 2021 breathing and blood flow sentence is not in the current text, and no form says Florida law bars restraint
   that restricts breathing; every pinpoint citation of the section in the forms names a paragraph the 2026 text has; the
   shell's Today line says the school must develop a crisis intervention plan on the second restraint in a semester.
   Simulated data only.
   usage: node qa/cr1-statute-2026-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const cr=await open(file('CR-1_'));
  const g=await cr.evaluate(()=>{const s=document.querySelector('section.only-guide');const row=[...s.querySelectorAll('tr')].find(r=>/^Breathing and blood flow/.test(r.textContent.trim()));
    return {hint:s.querySelector('p.hint').textContent,row:row?row.querySelector('td').textContent:'',all:document.body.textContent,src:(document.querySelector('#crBreath .src')||{}).textContent||''};});
  ok('1 the summary is dated: last amended in 2023, checked against the 2026 text',/\(last amended in 2023\), checked against the 2026 text in October 2026\./.test(g.hint)&&!/retrieved September 2026/.test(g.hint),g.hint);
  ok('2 the breathing row: not in the current text, added in 2021, mechanical restraint barred outright since 2022',/^Not in the current text\. A sentence added in 2021 barred restraint techniques or devices, such as straitjackets, zip ties, handcuffs or tie-downs,/.test(g.row)&&/bars school personnel from mechanical restraint outright \(since 2022\) and says nothing about breathing/.test(g.row)&&!/\(added in 2021\)\./.test(g.row),g.row);
  ok('3 no line on CR-1 says Florida law bars restraint that restricts breathing',!/Florida law (also )?bars restraint/.test(g.all)&&!/published summaries of the law/.test(g.all));
  ok('4 the plan\'s source line names the federal guidance and the district',/^This rule follows the U\.S\. Department of Education.s Restraint and Seclusion: Resource Document \(2012\), principle 7/.test(g.src)&&/District Policy 5\.181/.test(g.src),g.src);
  /* every pinpoint citation names a paragraph the 2026 text has */
  const P=['(1)','(1)(a)','(1)(b)','(1)(c)','(1)(d)','(1)(d)1.','(1)(d)2.','(1)(e)','(1)(f)','(2)','(3)','(3)(a)','(3)(b)','(3)(c)','(3)(d)','(4)','(4)(a)','(4)(b)','(4)(c)','(5)','(6)','(6)(a)','(6)(b)','(6)(c)','(7)','(7)(a)','(7)(b)','(7)(c)','(7)(d)','(8)','(8)(a)','(8)(b)','(8)(c)','(8)(d)'];
  for(let i=1;i<=6;i++)P.push('(4)(a)'+i+'.');'abcdefghij'.split('').forEach(c=>P.push('(4)(a)6.'+c+'.'));
  for(let i=1;i<=3;i++)P.push('(6)(b)'+i+'.');for(let i=1;i<=8;i++)P.push('(7)(b)'+i+'.');'abcdefg'.split('').forEach(c=>P.push('(7)(b)8.'+c+'.'));
  const bad=[];fs.readdirSync(dir).filter(f=>/\.(html|js)$/.test(f)).forEach(f=>{const t=fs.readFileSync(dir+f,'utf8');
    (t.match(/1003\.573 ?\(\d+\)(\([a-z]\))?(\d+\.)?([a-z]\.)?/g)||[]).forEach(m=>{const c=m.replace(/^1003\.573 ?/,'');if(!P.includes(c)&&c!=='(2026)')bad.push(f+': '+m);});});
  ok('5 every pinpoint citation of s. 1003.573 in the forms names a paragraph of the 2026 text',bad.length===0,bad);
  /* the shell's Today line */
  const sh=await open('index.html');
  const t=await sh.evaluate(()=>tdSafety({crisis:{restraints:{semester:2}}}).map(x=>x.t).join(' | '));
  ok('6 Today: on the second restraint the school must develop a crisis intervention plan (the statute), and the team meets (the policy)',/^2 restraints this semester: on the second, the school must develop a crisis intervention plan \(s\. 1003\.573\(6\)\(a\), F\.S\.\), and the IEP or 504 team meets to consider developing or reviewing it \(Policy 5\.181, 9c\)/.test(t),t);
  ok('7 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
