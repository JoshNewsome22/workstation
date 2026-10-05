/* v21.44 The respondent links' dictionaries (nbh-respond.js, short links): the wording the forms put into a respondent link,
   collected once from the forms, so a link carries only what differs (the case's details, any wording the user changed).
   Each form's respondent dialog is run with the simulated case, the student's name left as "the student" and the behavior
   fields empty, over every instrument, respondent and round it offers; the payloads it builds are cut into their pieces
   (each piece of wording once), and the pieces become that form's dictionary. IA-1's own item wording is pasted by the user
   and is left out (only its instructions, scales and open questions are taken; its WEFA open questions are left out too).
   The dictionaries are FROZEN: a link made with dictionary N must open for as long as respond.html is in use, so this writes
   a new version file (vN.json) only when asked for one, and nbh-respond.js carries every version.
   usage: node tools/respond-dict/make.js N     (needs the workstation served: WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/../../qa/lib.js');const fs=require('fs'),path=require('path');
const N=+process.argv[2];if(!(N>0)){console.log('usage: node tools/respond-dict/make.js N');process.exit(1);}
const OUT=path.join(__dirname,'v'+N+'.json');if(fs.existsSync(OUT)){console.log(OUT+' exists: dictionaries are frozen; make a new version');process.exit(1);}
const LIMIT=24000;   /* bytes of a dictionary (deflate looks back 32 KB; the rest is for the link's own text) */
const FORMS={a:'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09',n:'IN-1_Stakeholder-Interview-Record_v2026-09',s:'SV-1_Social-Validity_v2026-09',c:'CF-1_Contextual-Fit-Assessment_v2026-09'};
const CASE=new Set(['student','beh','behs','def','email','bcba','due','photo','name','pron','sig','video','word']);
function pieces(p,form){const out=[];
  for(const [k,v] of Object.entries(p)){if(CASE.has(k))continue;if(form==='a'&&(k==='items'||(k==='open'&&p.inst==='wefa')))continue;
    if(Array.isArray(v))v.forEach(x=>out.push(JSON.stringify(x)));
    else out.push(JSON.stringify(k)+':'+JSON.stringify(v));}
  /* the frame of the payload: its keys in order, the long values left out */
  out.push(JSON.stringify(Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof v==='string'&&v.length>40||typeof v==='object'?'':v]))).replace(/""/g,''));
  return out;}
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1180,height:820}});const dict={};
  for(const [id,f] of Object.entries(FORMS)){
    await page.goto(BASE+'/NBH-Workstation/'+f+'.html');await sleep(1200);
    await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(800);
    await page.evaluate(()=>{window.__pl=[];const o=NBH_RESPOND.payloadToHash;NBH_RESPOND.payloadToHash=function(p){window.__pl.push(JSON.parse(JSON.stringify(p)));return o.apply(this,arguments);};
      const w=['rpwFast','rpwQabf','rpwMas','rpwPbq','rpwWefa'];const n={rpwFast:16,rpwQabf:25,rpwMas:16,rpwPbq:15,rpwWefa:18};
      w.forEach(k=>{const t=document.getElementById(k);if(t&&!t.value.trim()){t.value=Array.from({length:n[k]},(_,i)=>(i+1)+'. item '+(i+1)).join('\n');t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));}});
      document.getElementById('rpBtn').click();
      const set=(i,v)=>{const e=document.getElementById(i);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};
      set('rpEmail','x@example.org');set('rpNick','the student');set('rpBeh','');set('rpBehName','');set('rpWord','the behavior');set('rpName','');});
    await sleep(300);
    const combos=await page.evaluate(()=>{const sel=['rpInst','rpRole','rpRound'].map(i=>document.getElementById(i)).filter(Boolean);
      let c=[{}];sel.forEach(s=>{c=c.flatMap(o=>[...s.options].map(op=>Object.assign({},o,{[s.id]:op.value})));});return c;});
    const boxes=await page.evaluate(()=>['rpOpen','rpConfirm','rpFx'].filter(i=>document.getElementById(i)));
    for(const c of combos)for(const b of [true,false]){
      await page.evaluate(([c,boxes,b])=>{for(const [k,v] of Object.entries(c)){const e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}
        boxes.forEach(i=>{const e=document.getElementById(i);if(e.checked!==b){e.checked=b;e.dispatchEvent(new Event('change',{bubbles:true}));}});
        const m=document.getElementById('rpMail');m.click();const d=document.querySelector('.nbh-inv[open]');if(d)d.close();},[c,boxes,b]);await sleep(60);}
    const pls=await page.evaluate(()=>window.__pl);
    /* each piece once, the most used last (nearest the link's text, where deflate finds it soonest) */
    const count=new Map();pls.forEach(p=>pieces(p,id).forEach(x=>count.set(x,(count.get(x)||0)+1)));
    let list=[...count.entries()].sort((a,b)=>a[1]-b[1]||a[0].length-b[0].length).map(e=>e[0]);
    let s=list.join('');while(Buffer.byteLength(s)>LIMIT){list.shift();s=list.join('');}
    dict[id]=s;console.log(id,f.slice(0,4),pls.length+' payloads',count.size+' pieces',Buffer.byteLength(s)+' bytes');}
  await br.close();
  fs.writeFileSync(OUT,JSON.stringify({version:N,made:'v21.44',forms:Object.fromEntries(Object.entries(FORMS).map(([k,f])=>[k,f.slice(0,4)])),dict},null,1)+'\n');console.log('wrote',OUT);})();
