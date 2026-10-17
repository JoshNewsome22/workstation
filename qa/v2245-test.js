/* v22.45 the parent or guardian from DM-1 (review F464, I231): DM-1's home contact carries the address; the contact's name fills
   IC-1's and TD-1's empty parent box (never a typed one); form 2547's address lines take the address. Simulated people only.
   usage: node qa/v2245-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const HOME={name:'Ana Rivera (simulated)',rel:'Mother',email:'ana.rivera@example.org',addr:'12 Palm Way, West Palm Beach, FL 33401'};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const dm=await ctx.newPage();dm.on('pageerror',e=>errs.push('DM-1: '+e.message));await dm.goto(L.BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(900);
  const h=await dm.evaluate(H=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}return !!e;};
    s('c[0].name',H.name);s('c[0].rel',H.rel);s('c[0].email',H.email);const has=s('c[0].addr',H.addr);s('c[0].rights','Yes');const o=__nbhFactsOut();return {has,home:o&&o.profile&&o.profile.home};},HOME);
  ok('1 DM-1’s home contact carries the address',h.has&&h.home&&h.home.addr===HOME.addr&&h.home.name===HOME.name,h);
  for(const [id,file,sel] of [['IC-1','IC-1_Informed-Consent-FBA-BIP_v2026-09.html','[name="c.parent"]']]){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(900);
    const r=await p.evaluate(({sel,H})=>{nbhCase.apply({profile:{home:H}});const a=document.querySelector(sel).value;
      document.querySelector(sel).value='Typed by hand (simulated)';nbhCase.apply({profile:{home:H}});return {a,b:document.querySelector(sel).value};},{sel,H:HOME});
    ok('2 '+id+': the empty parent box takes the contact; a typed one stays',r.a===HOME.name&&r.b==='Typed by hand (simulated)',r);await p.close();}
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const v=await sh.evaluate(async H=>{state.facts={profile:{home:H}};await pdfTools();const P=PDFLib,doc=await P.PDFDocument.create(),pg=doc.addPage([612,792]),fm=doc.getForm();let y=760;
    ['Student_Address[0]','Student_City[0]','Student_State[0]','Student_Zip[0]','First_Name[0]'].forEach(k=>{const t=fm.createTextField('form1[0].#subform[0].'+k);t.addToPage(pg,{x:20,y:(y-=16),width:200,height:12});});
    const out=await f2547Fill(await doc.save(),{date:'10/16/2026',a1:{},a2:{}});const F=(await P.PDFDocument.load(out)).getForm().getFields(),o={};F.forEach(x=>{o[x.getName().split('.').pop()]=x.getText();});return o;},HOME);
  ok('3 form 2547’s address lines: street, city, state and ZIP from the contact',v['Student_Address[0]']==='12 Palm Way'&&v['Student_City[0]']==='West Palm Beach'&&v['Student_State[0]']==='FL'&&v['Student_Zip[0]']==='33401',v);
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  ok('4 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
