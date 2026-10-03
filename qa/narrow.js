/* narrow.js: text blocks that wrap well short of the room they have, on every view of every form. */
const L=require('./lib');
const BASE=process.argv[2]||L.BASE, only=(process.argv[3]||'').split(',').filter(Boolean);
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const out={};
  for(const f of L.forms()){
    if(only.length&&!only.includes(f.id))continue;
    const page=await ctx.newPage(); L.wire(page,[]);
    await page.goto(`${BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(page); await L.sleep(1200);
    const views=await page.evaluate(()=>{const seg=[...document.querySelectorAll('#viewSeg button, .toolbar .seg button')];if(seg.length)return {sel:'#viewSeg button, .toolbar .seg button',n:seg.length};const t=document.querySelectorAll('[role=tab]');return {sel:'[role=tab]',n:t.length};});
    const found=[];
    for(let i=0;i<Math.max(1,Math.min(views.n,12));i++){
      if(views.n){const els=await page.$$(views.sel); if(els[i]) await els[i].click({force:true}).catch(()=>{}); await L.sleep(350);}
      const r=await page.evaluate(()=>{
        const res=[]; const cs=e=>getComputedStyle(e);
        document.querySelectorAll('p,li,dd,dt,div,figcaption,blockquote,small,h2,h3,h4,label,span').forEach(el=>{
          if(!el.offsetParent||el.closest('.toolbar,dialog,table,svg,.nbh-mast,.nbh-pm'))return;
          const txt=(el.textContent||'').trim(); if(txt.length<110)return;
          const s=cs(el); if(!/block|list-item|flow-root/.test(s.display))return;
          for(const c of el.children){ if(!/^(A|B|I|EM|STRONG|SPAN|KBD|CODE|BR|SMALL|SUB|SUP|ABBR|MARK|U|Q|CITE|TIME)$/.test(c.tagName))return; }
          const r=el.getBoundingClientRect(); const p=el.parentElement; const ps=cs(p);
          const room=p.clientWidth-parseFloat(ps.paddingLeft)-parseFloat(ps.paddingRight);
          const lh=parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.4;
          if(r.height<lh*1.6)return;                       // one line: not wrapping
          if(room>0&&r.width<0.72*room) res.push({w:Math.round(r.width),room:Math.round(room),pd:ps.display,mw:s.maxWidth,cls:(el.className||'').toString().slice(0,30),tag:el.tagName,t:txt.slice(0,70)});
        });
        return res;
      });
      r.forEach(x=>found.push({view:i,...x}));
    }
    out[f.id]=found; await page.close();
    process.stderr.write(f.id+':'+found.length+' ');
  }
  await browser.close();
  L.fs.writeFileSync('narrow.json',JSON.stringify(out,null,1));
  console.log('\n');
  for(const [id,list] of Object.entries(out)){ if(!list.length)continue; console.log('== '+id+' ('+list.length+')'); const seen=new Set(); list.forEach(x=>{const k=x.cls+'|'+x.pd+'|'+x.mw; if(seen.has(k))return; seen.add(k); console.log(`   v${x.view} ${x.tag}.${x.cls||'-'} w${x.w}/${x.room} parent:${x.pd} max:${x.mw} :: ${x.t}`);}); }
})().catch(e=>{console.error(e);process.exit(1);});
