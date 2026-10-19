/* My pictures on Forms TK-1 and TV-1 (v23.33, as Form VS-1 since v23.26, review F289): a file whose pictures came from another
   device's My pictures asks before they join this device's; No keeps them in the student's file only; asked once for each
   picture; a picture already on this device is not asked about. Simulated data only. usage: node qa/pic-ask-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  for(const [id,pre] of [['TK-1','TK-1_'],['TV-1','TV-1_']]){
    /* a file saved on one device, carrying a picture from its My pictures */
    const c1=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p1=await c1.newPage();p1.on('pageerror',e=>errs.push(id+': '+e.message));
    await p1.goto(L.BASE+'/NBH-Workstation/'+file(pre));await sleep(1000);await p1.evaluate(()=>{nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
    const saved=await p1.evaluate(()=>new Promise(res=>{const cv=document.createElement('canvas');cv.width=cv.height=40;const g=cv.getContext('2d');g.fillStyle='#c33';g.fillRect(0,0,40,40);
      S.photos=(S.photos||[]).concat([{id:'p_sim1',lib:'msim1abc',label:'Red toy (simulated)',img:cv.toDataURL('image/png')}]);
      const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
    await c1.close();
    const openOn=async(answer,pre2)=>{const c=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await c.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));
      await p.goto(L.BASE+'/NBH-Workstation/'+file(pre));await sleep(1000);
      await p.evaluate(a=>{window.__ask=[];nbhUI.confirm=async t=>{window.__ask.push(t);return a;};nbhUI.toast=()=>{};},answer);
      if(pre2)await p.evaluate(pre2);
      const open=async()=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'f.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(1400);};
      await open();const a=await p.evaluate(async()=>({ask:window.__ask.slice(),n:(await NBHPIC.all()).length,kept:(S.photos||[]).some(x=>x.lib==='msim1abc')}));
      return {c,p,a,open};};
    const no=await openOn(false);
    ok(id+' 1 a file from another device asks before its picture joins this device’s My pictures; No keeps it in the file only',saved&&no.a.ask.length===1&&/This file carries a picture from another device’s My pictures\./.test(no.a.ask[0])&&no.a.n===0&&no.a.kept,no.a);
    await no.p.evaluate(()=>{renderAll();renderAll();});await sleep(400);const again=await no.p.evaluate(()=>window.__ask.length);
    ok(id+' 2 asked once for the picture, however often the form redraws',again===1,again);
    await no.c.close();
    const yes=await openOn(true);
    ok(id+' 3 Yes adds it to this device’s My pictures',yes.a.ask.length===1&&yes.a.n===1,yes.a);
    await yes.c.close();
  }
  ok('4 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
