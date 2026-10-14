/* v21.95 the monthly caseload summary for the supervisor: from the students kept on the device, each as at their last Save
   case, one month at a time; printed landscape or copied for a spreadsheet; names follow the initials setting. Simulated
   students only. Chromium.   usage: node qa/v2195-caseload-test.js  (WS_URL=...) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ym=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
const now=new Date(),thisM=ym(now),lastM=ym(new Date(now.getFullYear(),now.getMonth()-1,15));
async function shell(br,vp,touch,ini){const ctx=await br.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch,userAgent:touch?IPHONE:undefined,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async([thisM,lastM,ini])=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on@nbh'].forEach(k=>localStorage.removeItem(k));if(ini)localStorage.setItem('nbh.caseload.ini','1');}catch(e){}
    const inc=(date,parent,hold)=>({date,time:'10:00',beh:'Hitting',parent:parent?'yes':'no',hold:hold||''});
    const mk=(p,saved,sum,facts)=>({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum,
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'DD-1':{title:'Daily data',snap:{total:1,data:{},own:''}}},facts})});
    const A=mk({client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School',grade:'5'},new Date().toISOString(),{items:[{k:'Overdue',t:'The parent notice for the restraint is overdue',open:'CR-1'}],forms:4},
      {data:{from:thisM+'-01',to:thisM+'-12',days:9,behaviors:[{name:'Hitting',aim:2,aimMet:true,mean:1.5,unit:'per day',direction:'decrease'},{name:'Break card',aim:4,aimMet:false,mean:2,unit:'per day',direction:'increase'}],incidentList:[inc(thisM+'-03',true,'restraint'),inc(thisM+'-09',false,''),inc(lastM+'-20',true,'')],src:'DD-1'},integrity:{obs:[{},{}],overall:84,criterion:90,src:'TI-1'},consent:{date:'2026-08-20',parent:'Sample Parent',src:'IC-1'}});
    const B=mk({client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},new Date(Date.now()-864e5).toISOString(),{items:[],forms:2},
      {data:{from:lastM+'-02',to:lastM+'-28',days:15,behaviors:[{name:'Elopement',aim:0,aimMet:false,mean:0.6,unit:'per day',direction:'decrease'}],incidentList:[inc(lastM+'-05',false,'seclusion'),inc(lastM+'-06',true,'')],src:'DD-1'},integrity:{obs:[{}],overall:95,criterion:90,src:'TI-1'}});
    const C=mk({client:'SIMULATED – Sample Student 2',sid:'SIM-0003',site:'Sample Middle',grade:'7'},new Date(Date.now()-3*864e5).toISOString(),{items:[],forms:1},{});
    await clTx('readwrite',st=>{st.put(A);st.put(B);st.put(C);});await paintBlank();},[thisM,lastM,ini]);
  await sleep(600);return {ctx,page,errs};}
const readTable=page=>page.evaluate(()=>({lead:$('#dlgBody .hp-lead').textContent,month:$('#cmMonth').value,rows:[...document.querySelectorAll('#dlgBody .cm-t tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim()))}));
(async()=>{const br=await chromium.launch();
  try{
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},false,false);
    await page.evaluate(()=>caseloadOpen());await sleep(1000);await page.evaluate(()=>{const k=document.getElementById('clKeep');if(k)k.open=true;});await sleep(200);   /* the tools sit in the fold (v21.92) */
    const btn=await page.evaluate(()=>{const b=document.querySelector('#dlgBody #clMonth');return b&&{disabled:b.disabled,afterRestr:b.previousElementSibling&&b.previousElementSibling.id==='clRestr'};});
    ok('1 the Caseload dialog offers Monthly summary beside the restraint report',btn&&!btn.disabled&&btn.afterRestr,btn);
    await page.click('#clMonth');await sleep(900);
    const t=await readTable(page);
    const m=t.rows.find(r=>r[0]==='Mateo Rivera'),s1=t.rows.find(r=>/^Sample Student$/.test(r[0])),s2=t.rows.find(r=>/Sample Student 2/.test(r[0]));
    ok('2 this month: three students, one row each, in name order',t.month===thisM&&t.rows.length===3&&t.rows[0][0]==='Mateo Rivera'&&!!s1&&!!s2,{month:t.month,rows:t.rows.map(r=>r[0])});
    ok('3 Mateo’s row counts this month’s incidents (2, one a restraint, home told about 1), aims met 1 of 2, integrity 84% below the criterion, consent yes, the last data day, the overdue notice',m&&m[2]==='2'&&m[3]==='1'&&m[4]==='1 of 2'&&m[5]==='1 of 2'&&/^84%/.test(m[6])&&/▼/.test(m[6])&&m[7]==='Yes'&&m[8]===thisM+'-12'&&/^1: /.test(m[9]),m);
    ok('4 a student with nothing this month shows zeros and dashes; a student with no facts shows dashes and no consent',s1&&s1[2]==='0'&&s1[4]==='—'&&s1[5]==='0 of 1'&&s2&&s2[2]==='0'&&s2[5]==='—'&&s2[6]==='—'&&s2[7]==='No'&&s2[8]==='—',{s1,s2});
    ok('5 the lead line sums the month',/3 students kept on this/.test(t.lead)&&/2 incidents \(1 restraint or seclusion; home told about 1\)/.test(t.lead)&&/aims met for 1 of 3 behaviors/.test(t.lead)&&/consent on file for 1 of 3/.test(t.lead)&&/integrity 89.5% on average/.test(t.lead),t.lead);
    await page.selectOption('#cmMonth',lastM);await sleep(900);
    const t2=await readTable(page);const m2=t2.rows.find(r=>r[0]==='Mateo Rivera'),s12=t2.rows.find(r=>/^Sample Student$/.test(r[0]));
    ok('6 last month: the counts move with the month (Mateo 1 incident, home told; the second student 2 with a seclusion)',t2.month===lastM&&m2&&m2[2]==='1'&&m2[3]==='0'&&m2[4]==='1 of 1'&&s12&&s12[2]==='2'&&s12[3]==='1'&&s12[4]==='1 of 2'&&/2 students|3 students/.test(t2.lead)&&/3 incidents \(1 restraint/.test(t2.lead),{m2,s12,lead:t2.lead});
    const txt=await page.evaluate(async()=>{const M=cmMonths();const R=await cmRows(CM.month);return cmText(R,(M.find(x=>x.v===CM.month)||M[0]).t);});
    ok('7 the copy for a spreadsheet is tab-separated with a header, a row per student and totals',txt.split('\n').filter(l=>l.split('\t').length>=8).length===5&&/^Totals\t/m.test(txt)&&/Mateo Rivera\tRoyal Palm School · /.test(txt),{head:txt.split('\n').slice(0,5)});
    const printed=await page.evaluate(()=>{let html='';const wo=window.open;window.open=()=>({document:{open(){},write(h){html+=h;},close(){}},focus(){},print(){}});return new Promise(res=>{document.querySelector('#cmPrint').click();setTimeout(()=>{window.open=wo;res(html);},800);});});
    ok('8 Print writes the summary as a landscape page with the logo, the lead line and the table',/size:landscape/.test(printed)&&/<img src="data:image/.test(printed)&&/Caseload summary: /.test(printed)&&/<table/.test(printed)&&/Mateo Rivera/.test(printed),{len:printed.length});
    const cmd=await page.evaluate(()=>!!CMDS.find(c=>/Caseload summary for the month/.test(c.n)));
    ok('9 the command list carries the monthly summary',cmd);
    ok('10 no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  /* ---- initials on, on a phone ---- */
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},true,true);
    await page.evaluate(()=>clMonthlyOpen());await sleep(1000);
    const t=await readTable(page);const m=await page.evaluate(()=>{const db=$('#dlgBody'),w=db.querySelector('.cm-wrap');return {open:$('#dlg').open,sw:db.scrollWidth,cw:db.clientWidth,wrapScrolls:!!(w&&w.scrollWidth>w.clientWidth)};});
    ok('11 with the initials setting on, the rows carry initials, not names',t.rows.length===3&&t.rows.every(r=>/^[A-Z0-9]\.( [A-Z0-9]\.)*$/.test(r[0])),t.rows.map(r=>r[0]));
    ok('12 phone: the dialog fits; the wide table scrolls inside its own box',m.open&&m.sw<=m.cw+1&&m.wrapScrolls,m);
    ok('13 phone: no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
