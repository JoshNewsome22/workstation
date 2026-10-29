/* v24.95 the six forms on an iPad, refined from the BCBA's DM-1 screenshots (10/28). WebKit (Safari's engine) with a
   touch screen at a form's width on a 10.2-inch iPad sideways (1080 px) and at 860 px. Simulated data only.
   1. a row of fields lines up: in every grid of fields on the six forms, the boxes of one row start at the same height;
   2. an example goes once its box holds an entry and comes back when it is emptied (DM-1's Transportation); an
      explanation stays (FLEID's "Florida Education Identifier");
   3. a box the form fills itself reads as a value (DM-1's Age: shaded, no border to type into);
   4. the form's toolbar is one row at 1080 px with the case on it, the case's words and the next sheet's name whole in
      their tooltips; a laptop's toolbar that no step brings to one row gives nothing up;
   5. the sheets' titles in sentence case on screen ("Parents, guardians, and authorized contacts"; IA-1's "Informant
      A: …" keeps its letter), as written while the page prints;
   6. an entry longer than its box widens the box (DM-1's School) until it reads in full;
   7. headings: a section's title 40 px above and 16 below (the sheet's first at the top), a sub-heading 32 and 12;
   8. DM-1 "Same as the contacts above": ticked, the emergency table goes and the paper says so in a line; it is saved
      with the form and comes back with it; unticked, the table prints as before and the line does not;
   9. no page errors.  usage: node qa/fx5-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const file=id=>L.forms().find(x=>x.id===id).file;
(async()=>{const wk=await pw.webkit.launch(),cr=await pw.chromium.launch();const errs=[];
  const sim=async p=>{await L.loadSim(p);await sleep(600);await p.evaluate(()=>{const b=[...document.querySelectorAll('dialog button,[role=dialog] button,[role=alertdialog] button')].find(x=>x.offsetParent&&/^(Replace|Load|OK|Yes)$/i.test(x.textContent.trim()));if(b)b.click();});await sleep(2200);};
  const open=async(ctx,id)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/'+file(id));await sleep(1800);await sim(p);return p;};
  const view=async(p,v)=>{await p.evaluate(v=>{const b=document.querySelector('[data-view="'+v+'"]');if(b)b.click();},v);await sleep(700);};
  const big=await wk.newContext({viewport:{width:1080,height:810},hasTouch:true}),mid=await wk.newContext({viewport:{width:860,height:900},hasTouch:true});
  const pages={};
  /* 1 rows line up, on every sheet of the six forms, at both widths */
  for(const [ctx,w] of [[big,1080],[mid,860]]){const bad=[];let n=0;
    for(const id of ['DM-1','IC-1','RR-1','TB-1','IA-1','IN-1']){const p=await open(ctx,id);if(w===1080)pages[id]=p;
      const views=await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-view]')].map(b=>b.dataset.view))]);
      for(const v of views){await view(p,v);
        const r=await p.evaluate(()=>{const out=[];let n=0;document.querySelectorAll('.fx2-sh .ident').forEach(g=>{if(!g.offsetParent)return;
          const fs=[...g.children].filter(f=>f.offsetParent);const box=f=>[...f.children].find(c=>c.offsetParent&&(/^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName)&&!/checkbox|radio|hidden/.test(c.type)&&!c.classList.contains('nbh-seg-src')||c.classList.contains('nbh-seg')));
          const rows={};fs.forEach(f=>{const b=box(f);if(!b)return;const k=Math.round(f.getBoundingClientRect().top);(rows[k]=rows[k]||[]).push(Math.round(b.getBoundingClientRect().top));});
          Object.values(rows).forEach(t=>{if(t.length<2)return;n++;if(Math.max(...t)-Math.min(...t)>1)out.push(g.className+' '+t.join('/'));});
          if(!g.classList.contains('fx2-al'))out.push('not aligned: '+[...g.children].map(c=>c.className).join(',').slice(0,120));});return {out,n};});
        n+=r.n;r.out.forEach(x=>bad.push(id+' '+v+': '+x));}
      if(w!==1080)await p.close();}
    ok('1 at '+w+' px every row of fields on the six forms lines up ('+n+' rows)',n>20&&!bad.length,bad.slice(0,6));}
  const dm=pages['DM-1'];await view(dm,'student');
  /* 2 examples */
  const eg=await dm.evaluate(async()=>{const t=document.getElementById('sTrans'),f=document.getElementById('sFleid');const h=x=>{const s=[...x.parentElement.querySelectorAll('.fx2-hint')][0];return s?{t:s.textContent,shown:!!s.offsetParent}:null;};
    const set=async v=>{t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));return h(t);};
    const a=await set(''),b=await set('Bus 7'),c=await set('');return {a,b,c,fl:h(f),fv:f.value,desc:t.getAttribute('aria-describedby')};});
  ok('2 an example goes once its box is filled and comes back when emptied; an explanation stays',eg.a&&/^For example/.test(eg.a.t)&&eg.a.shown&&!eg.b.shown&&eg.c.shown&&eg.fl&&eg.fl.shown&&!!eg.fv&&/fx2eg/.test(eg.desc||''),eg);
  /* 3 read-only */
  const ro=await dm.evaluate(()=>{const a=document.getElementById('sAge'),c=getComputedStyle(a),l=getComputedStyle(document.getElementById('sLast'));return {bg:c.backgroundColor,bc:c.borderTopColor,lbg:l.backgroundColor,v:a.value};});
  ok('3 Age reads as a value: shaded, no border',ro.bg!==ro.lbg&&/rgba\(0, 0, 0, 0\)|transparent/.test(ro.bc)&&!!ro.v,ro);
  /* 4 toolbar */
  const tbar=async p=>p.evaluate(async()=>{const g=document.querySelector('.nbh-case-grp');if(g){g.hidden=false;const c=g.querySelector('#nbhCaseBtn');if(c)c.textContent='From the case: 6 behaviors · unknown · 6 goals';}
    window.dispatchEvent(new Event('resize'));await new Promise(r=>setTimeout(r,600));const t=document.querySelector('div.toolbar');
    const g2=[...t.children].filter(x=>x.offsetParent&&x.getBoundingClientRect().height);const tops=g2.map(x=>Math.round(x.getBoundingClientRect().top)),hs=g2.map(x=>Math.round(x.getBoundingClientRect().height));
    const cb=document.getElementById('nbhCaseBtn'),nx=t.querySelector('.nbh-next');
    return {tops,hs,lv:[1,2,3,4,5].filter(i=>t.classList.contains('fx2-tb'+i)).length,title:cb&&cb.title,aria:nx&&nx.getAttribute('aria-label'),w:t.clientWidth};});
  const t1=await tbar(dm);
  ok('4 the toolbar is one row at 1080 px with the case on it; the case and the next sheet whole in their tooltips',Math.max(...t1.tops)-Math.min(...t1.tops)<8&&Math.max(...t1.hs)<60&&/6 goals/.test(t1.title||'')&&/^Next sheet: /.test(t1.aria||''),t1);
  const wide=await cr.newContext({viewport:{width:1300,height:900}});const dw=await wide.newPage();dw.on('pageerror',e=>errs.push('DM-1 1300: '+e.message));await dw.goto(BASE+'/NBH-Workstation/'+file('DM-1'));await sleep(1800);
  const t2=await tbar(dw);ok('4 at 1300 px a toolbar that no step brings to one row gives nothing up',t2.lv===0||Math.max(...t2.tops)-Math.min(...t2.tops)<8,t2);
  /* 5 titles */
  const hd=await dm.evaluate(()=>{const b=[...document.querySelectorAll('#student .bar.nbh-band')].map(x=>x.textContent);fx2Layout.paper(true);const pb=[...document.querySelectorAll('#student .bar.nbh-band')].map(x=>x.textContent);fx2Layout.paper(false);return {b,pb,after:[...document.querySelectorAll('#student .bar.nbh-band')].map(x=>x.textContent)};});
  const ia=await pages['IA-1'].evaluate(()=>[...document.querySelectorAll('.bar.nbh-band')].map(x=>x.textContent).filter(t=>/^Informant/.test(t)));
  ok('5 the sheets\' titles in sentence case on screen, as written on paper',hd.b.includes('Parents, guardians, and authorized contacts')&&hd.pb.includes('Parents, Guardians, and Authorized Contacts')&&hd.after.join()===hd.b.join()&&ia.every(t=>/^Informant [A-Z]\b/.test(t)),{hd,ia});
  /* 6 long entries */
  const lg=await dm.evaluate(async()=>{const s=document.getElementById('sSchool');s.value='Royal Palm Exceptional Student Center (simulated), Building 4';s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));
    return {cls:s.parentElement.className,sw:s.scrollWidth,cw:s.clientWidth};});
  ok('6 an entry longer than its box widens the box until it reads in full',/fx2-w(2|all)/.test(lg.cls)&&lg.sw<=lg.cw+1,lg);
  /* 7 heading spacing */
  const sp=await dm.evaluate(()=>{const m=e=>{const c=getComputedStyle(e);return [Math.round(parseFloat(c.marginTop)),Math.round(parseFloat(c.marginBottom))];};const bands=[...document.querySelectorAll('#student .bar.nbh-band')];
    return {first:m(bands[0]),next:m(bands[1]),sub:m(document.querySelector('#student h3.sub'))};});
  ok('7 headings: a title 40 px above and 16 below (the first at the top), a sub-heading 32 and 12',sp.first[0]<=8&&sp.first[1]===16&&sp.next[0]===40&&sp.next[1]===16&&sp.sub[0]===32&&sp.sub[1]===12,sp);
  /* 8 DM-1 emergency contacts the same as above */
  const es=await dm.evaluate(async()=>{const c=document.getElementById('emSame'),w=document.getElementById('emTbl').closest('.dmwrap'),p=document.getElementById('emSameP');
    const st=()=>({tbl:!!w.offsetParent,line:!!p.offsetParent});const a=st();c.click();await new Promise(r=>setTimeout(r,300));const b=st();const saved=nbhBridge.snapshot();
    c.click();await new Promise(r=>setTimeout(r,300));const d=st();nbhBridge.restoreData(saved);await new Promise(r=>setTimeout(r,500));const e={...st(),ck:c.checked};
    return {a,b,d,e,sv:saved.data['#emSame']};});
  await dm.emulateMedia({media:'print'});await sleep(300);
  const pr1=await dm.evaluate(()=>({tbl:!!document.getElementById('emTbl').offsetParent,line:!!document.getElementById('emSameP').offsetParent,lab:!!document.querySelector('.dm-emsame').offsetParent,txt:document.getElementById('emSameP').textContent}));
  await dm.emulateMedia({media:'screen'});await dm.evaluate(async()=>{document.getElementById('emSame').click();await new Promise(r=>setTimeout(r,300));});await dm.emulateMedia({media:'print'});await sleep(300);
  const pr2=await dm.evaluate(()=>({tbl:!!document.getElementById('emTbl').offsetParent,line:!!document.getElementById('emSameP').offsetParent}));await dm.emulateMedia({media:'screen'});
  ok('8 DM-1 "Same as the contacts above": the table goes and a line says so; saved and restored with the form',es.a.tbl&&!es.a.line&&!es.b.tbl&&es.b.line&&es.sv===true&&es.d.tbl&&!es.d.line&&!es.e.tbl&&es.e.ck,es);
  ok('8 on paper: ticked, the line and no table (and no box to tick); unticked, the table and no line',!pr1.tbl&&pr1.line&&!pr1.lab&&/Same as the contacts above/.test(pr1.txt)&&pr2.tbl&&!pr2.line,{pr1,pr2});
  ok('9 no page errors',!errs.length,errs.slice(0,5));
  await wk.close();await cr.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
