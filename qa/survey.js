/* Measures how every field, button, table and tab is actually styled in each form (standalone, simulation loaded). */
const L=require('./lib');
const EDITION=process.argv[2]||'NBH-Workstation', OUT=process.argv[3]||'survey.json';
(async()=>{
  const browser=await L.chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const res={};
  for(const f of L.forms(EDITION)){
    const log=[]; const page=await ctx.newPage(); L.wire(page,log);
    await page.goto(`${L.BASE}/${EDITION}/${f.file}`,{waitUntil:'load'}); await L.sleep(800);
    const sim=await L.loadSim(page); await L.sleep(1500);
    const data=await page.evaluate(()=>{
      const cs=e=>getComputedStyle(e); const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
      const ctx=e=>({td:!!e.closest('td,th'),toolbar:!!e.closest('.toolbar'),mast:!!e.closest('.nbh-mast'),tabs:!!e.closest('.nbh-tabs,[role=tablist]'),dialog:!!e.closest('dialog'),noprint:!!e.closest('.noprint')});
      const hid=e=>{let x=e;while(x&&x!==document.body){const s=cs(x);if(s.display==='none'||s.visibility==='hidden')return true;x=x.parentElement;}return false;};
      const out={fields:[],checks:0,radios:0,buttons:[],tables:[],tabs:document.querySelectorAll('[role=tab]').length,sticky:[],wrappers:[],body:{bg:cs(document.body).backgroundColor,htmlbg:cs(document.documentElement).backgroundColor,ff:cs(document.body).fontFamily.split(',')[0],fs:cs(document.body).fontSize},labels:[]};
      document.querySelectorAll('input,select,textarea').forEach(e=>{
        if(e.type==='checkbox'){out.checks++;return;} if(e.type==='radio'){out.radios++;return;}
        if(['hidden','file','button','submit','range','color','image','reset'].includes(e.type))return;
        const s=cs(e),r=e.getBoundingClientRect();
        out.fields.push({tag:e.tagName.toLowerCase(),type:e.type,cls:e.className,id:e.id,vis:vis(e),hid:hid(e),...ctx(e),
          bt:s.borderTopWidth,bb:s.borderBottomWidth,bl:s.borderLeftWidth,br:s.borderRightWidth,bts:s.borderTopStyle,
          bc:s.borderBottomColor,bg:s.backgroundColor,fs:s.fontSize,h:Math.round(r.height),w:Math.round(r.width),
          pt:s.paddingTop,pl:s.paddingLeft,rad:s.borderRadius,ff:s.fontFamily.split(',')[0].replace(/"/g,''),app:s.appearance,ro:e.readOnly,dis:e.disabled,ph:!!e.placeholder,val:!!(e.value&&String(e.value).trim())});
      });
      document.querySelectorAll('button,input[type=button],input[type=submit],a.btn,.btn').forEach(e=>{
        const s=cs(e),r=e.getBoundingClientRect();
        out.buttons.push({tag:e.tagName.toLowerCase(),cls:e.className,id:e.id,txt:(e.textContent||e.value||'').trim().slice(0,28),vis:vis(e),hid:hid(e),...ctx(e),
          bg:s.backgroundColor,col:s.color,bd:s.borderTopWidth+' '+s.borderTopStyle+' '+s.borderTopColor,h:Math.round(r.height),w:Math.round(r.width),fs:s.fontSize,fw:s.fontWeight,rad:s.borderRadius,pad:s.padding,role:e.getAttribute('role'),pressed:e.getAttribute('aria-pressed'),sel:e.getAttribute('aria-selected')});
      });
      document.querySelectorAll('table').forEach(t=>{
        const th=t.querySelector('th'),tds=[...t.querySelectorAll('td')].slice(0,60);
        const tdbg=new Set(tds.map(d=>cs(d).backgroundColor));
        out.tables.push({cls:t.className,id:t.id,vis:vis(t),hid:hid(t),rows:t.rows.length,cols:t.rows[0]?t.rows[0].cells.length:0,thbg:th?cs(th).backgroundColor:null,thfs:th?cs(th).fontSize:null,thcol:th?cs(th).color:null,thfw:th?cs(th).fontWeight:null,thalign:th?cs(th).textAlign:null,
          tdbg:[...tdbg].slice(0,5),tdfs:tds[0]?cs(tds[0]).fontSize:null,tdbd:tds[0]?cs(tds[0]).borderTopWidth+' '+cs(tds[0]).borderTopColor:null,inputs:t.querySelectorAll('input,select,textarea').length,w:Math.round(t.getBoundingClientRect().width),collapse:cs(t).borderCollapse,tnum:cs(t).fontVariantNumeric});
      });
      document.querySelectorAll('*').forEach(e=>{const s=cs(e);if((s.position==='sticky'||s.position==='fixed')&&vis(e))out.sticky.push({tag:e.tagName.toLowerCase(),cls:String(e.className).slice(0,60),id:e.id,pos:s.position,top:s.top,z:s.zIndex,h:Math.round(e.getBoundingClientRect().height)});});
      document.querySelectorAll('.sheet,.nbh-page,main,.page,.wrap,.doc,.paper').forEach(e=>{const s=cs(e),r=e.getBoundingClientRect();out.wrappers.push({tag:e.tagName.toLowerCase(),cls:String(e.className).slice(0,60),id:e.id,w:Math.round(r.width),bg:s.backgroundColor,sh:s.boxShadow.slice(0,60),rad:s.borderRadius,pad:s.padding,mar:s.margin,vis:vis(e)});});
      [...document.querySelectorAll('label')].slice(0,400).forEach(l=>{const s=cs(l);out.labels.push({fs:s.fontSize,col:s.color,fw:s.fontWeight,ff:s.fontFamily.split(',')[0].replace(/"/g,''),td:!!l.closest('td,th')});});
      return out;
    });
    res[f.id]={file:f.file,sim,log,...data};
    await page.close();
    process.stderr.write(f.id+' ');
  }
  await browser.close();
  L.fs.writeFileSync(OUT,JSON.stringify(res));
  /* compact summary */
  const pat=x=>{const n=v=>parseFloat(v)||0;const t=n(x.bt),b=n(x.bb),l=n(x.bl),r=n(x.br);if(t&&b&&l&&r)return 'box';if(!t&&b&&!l&&!r)return 'underline';if(!t&&!b&&!l&&!r)return 'bare';return 'other';};
  for(const [id,d] of Object.entries(res)){
    const g={};d.fields.filter(x=>!x.hid).forEach(x=>{const k=[x.toolbar?'toolbar':x.td?'td':x.tabs?'tabs':'free',x.tag+(x.tag==='input'?':'+x.type:''),pat(x)].join('/');(g[k]=g[k]||{n:0,h:new Set(),fs:new Set(),cls:new Set()});g[k].n++;g[k].h.add(x.h);g[k].fs.add(x.fs);if(g[k].cls.size<4)g[k].cls.add(x.cls.split(' ')[0]||'-');});
    const b={};d.buttons.filter(x=>!x.hid).forEach(x=>{const k=(x.toolbar?'toolbar':x.td?'td':x.tabs?'tabs':x.mast?'mast':'free')+'/'+(x.cls.split(' ').filter(c=>/nbh|primary|danger|tool|rm|tab|seg|sm/.test(c)).join('.')||'-');(b[k]=b[k]||{n:0,h:new Set(),bg:new Set()});b[k].n++;b[k].h.add(x.h);if(b[k].bg.size<3)b[k].bg.add(x.bg);});
    console.log(`\n== ${id} sim=${d.sim} errors=${d.log.length} checks=${d.checks} radios=${d.radios} tabs=${d.tabs} tables=${d.tables.filter(t=>!t.hid).length} sticky=${d.sticky.map(s=>s.tag+'.'+s.cls.split(' ')[0]+'@'+s.top).join(',')} body=${d.body.bg}/${d.body.ff}/${d.body.fs}`);
    console.log('  wrappers: '+d.wrappers.filter(w=>w.vis).map(w=>`${w.tag}.${w.cls.split(' ')[0]}#${w.id} w${w.w} bg${w.bg} pad${w.pad} rad${w.rad}`).slice(0,4).join(' | '));
    Object.entries(g).sort((a,b)=>b[1].n-a[1].n).forEach(([k,v])=>console.log(`  F ${k.padEnd(34)} n=${String(v.n).padStart(4)} h=${[...v.h].sort((a,b)=>a-b).slice(0,6).join(',')} fs=${[...v.fs].join(',')} cls=${[...v.cls].join(',')}`));
    Object.entries(b).sort((a,b)=>b[1].n-a[1].n).forEach(([k,v])=>console.log(`  B ${k.padEnd(34)} n=${String(v.n).padStart(4)} h=${[...v.h].sort((a,b)=>a-b).slice(0,6).join(',')} bg=${[...v.bg].join(' ')}`));
    const tb={};d.tables.filter(t=>!t.hid).forEach(t=>{const k=(t.cls.split(' ')[0]||'-')+' th:'+t.thbg+' td:'+t.tdbg.join('|');(tb[k]=tb[k]||0);tb[k]++;});
    Object.entries(tb).forEach(([k,n])=>console.log(`  T ${k} x${n}`));
  }
})().catch(e=>{console.error(e);process.exit(1);});
