/* v21.90 a packet printed on an iPad: Safari prints the master print without its page headers and keeps no record of where
   each form starts, so Finish PDF reads the labels the master print carries (white 3 px text made by its style sheet) and adds
   the header, the footer, Page n of N, the contents page numbers and the bookmarks.
   Here Chromium plays Safari: the master print is saved once as Chrome saves it, and once with the @page header boxes turned
   off and every named destination and link taken out of the file (what a Safari PDF lacks). Checked: the labels move nothing
   (the same pages with them and without); a Safari-like PDF is read, finished and comes back with every page headed and
   numbered, the bookmarks and contents numbers on the pages Chrome's own PDF has; a page whose text runs into the margins is
   made a little smaller so the header stays clear; a Chrome PDF is finished as before, without a second header.
   Simulated student only.  usage: node qa/v2190-ipad-pdf-test.js */
const L=require(__dirname+'/lib.js');
const P=require(L.path.join(L.ROOT,'NBH-Workstation','pdf-lib.min.js'));
const OUT=__dirname+'/out/v2190-ipad-pdf';L.fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const FORMS=['DM-1','TB-1','FS-1','DD-1'];
const NOHEAD='@page{@top-left{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-right{content:none}}';
const NOMARK='.mp-cover::before,.mp-sec::before,.mp-cover li::before,.mp-cover li::after{content:none!important}';
async function safariLike(bytes){const d=await P.PDFDocument.load(bytes);const c=d.catalog;
  [P.PDFName.of('Dests'),P.PDFName.of('Names'),P.PDFName.of('Outlines')].forEach(k=>c.delete(k));
  d.getPages().forEach(p=>p.node.delete(P.PDFName.of('Annots')));return Buffer.from(await d.save());}
(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  await ctx.addInitScript(()=>{window.print=function(){};});
  const log=[];const page=await ctx.newPage();L.wire(page,log);
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(800);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  for(const id of FORMS){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000});await L.sleep(900);
    const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);const fr=page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);
    await fr.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}});try{await L.loadSim(fr);}catch(e){}await L.sleep(700);}
  await page.evaluate(ids=>{Object.keys(state.ticked||{}).forEach(k=>state.ticked[k]=false);ids.forEach(id=>state.ticked[id]=true);renderRail();},FORMS);
  const [pop]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#masterPrint').click())]);
  await pop.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await pop.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:180000});await L.sleep(1200);
  const lab=await pop.evaluate(()=>({cover:document.querySelector('.mp-cover').dataset.mk,secs:[...document.querySelectorAll('.mp-sec')].map(s=>s.dataset.mk),toc:[...document.querySelectorAll('.mp-cover li')].map(l=>l.dataset.mk),
    before:getComputedStyle(document.querySelector('.mp-sec'),'::before').content}));
  ok('1 the master print labels its cover (whose packet, the practice), each contents entry and each section',/^NBHPKT;NBHRUN:Mateo%20Rivera%20%20%C2%B7%20%20ID%204471823;NBHPRAC:Newsome%20Behavioral%20Health;$/.test(lab.cover)&&lab.secs.slice().sort().join()===FORMS.map(f=>'NBHSEC:'+f+';').sort().join()&&lab.toc.length===FORMS.length&&/NBHSEC:DM-1;/.test(lab.before),lab);
  await pop.emulateMedia({media:'print'});await L.sleep(400);
  const A=await pop.pdf({preferCSSPageSize:true,printBackground:true});L.fs.writeFileSync(OUT+'/chrome.pdf',A);
  await pop.addStyleTag({content:NOMARK});await L.sleep(300);
  const A0=await pop.pdf({preferCSSPageSize:true,printBackground:true});
  await pop.evaluate(()=>{const s=[...document.querySelectorAll('style')].pop();s.remove();});await pop.addStyleTag({content:NOHEAD});await L.sleep(300);
  const B=await safariLike(await pop.pdf({preferCSSPageSize:true,printBackground:true}));L.fs.writeFileSync(OUT+'/safari-like.pdf',B);
  await pop.addStyleTag({content:'@page{margin:0.18in 0.45in}'});await L.sleep(300);
  const C=await safariLike(await pop.pdf({preferCSSPageSize:true,printBackground:true}));L.fs.writeFileSync(OUT+'/safari-tight.pdf',C);
  /* text of every page, read in the workstation with its own pdf.js */
  const texts=async buf=>page.evaluate(async b64=>{const lib=await pdfjsLoad();const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const pdf=await lib.getDocument({data:bytes}).promise;const out=[];
    for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();const vw=pg.view;
      const big=tc.items.filter(t=>t.str&&t.str.trim()&&Math.hypot(t.transform[2],t.transform[3])>4.5);
      out.push({t:big.map(t=>t.str).join(' ').replace(/\s+/g,' '),H:vw[3],items:big.map(t=>({s:t.str,x:t.transform[4],y:t.transform[5],h:Math.hypot(t.transform[2],t.transform[3])}))});}
    return out;},Buffer.from(buf).toString('base64'));
  const tA=await texts(A),tA0=await texts(A0);
  const strip=s=>s.replace(/NBH[A-Z]+(:[^;]*)?;/g,'').replace(/\s+/g,' ').trim();
  ok('2 the labels move nothing: the same '+tA0.length+' pages, each with the same text, with them and without',tA.length===tA0.length&&tA.every((p,i)=>strip(p.t)===strip(tA0[i].t)),{with:tA.length,without:tA0.length,diff:tA.map((p,i)=>strip(p.t)===strip((tA0[i]||{}).t||'')?null:i).filter(x=>x!==null).slice(0,4)});
  /* Chrome's own: where each form starts */
  const chromeInfo=await page.evaluate(async b64=>{const T=await pdfTools();const i=await T.inspect(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)));return {secs:i.sections.map(s=>[s.id,s.page]),pages:i.pages};},A.toString('base64'));
  /* Finish PDF on the Safari-like file */
  async function finish(buf,name){
    await page.evaluate(()=>{const d=$('#dlg');if(d.open)d.close();$('#bookmarkPdf').click();});await L.sleep(400);
    await page.setInputFiles('#bmFile',{name,mimeType:'application/pdf',buffer:buf});
    await page.waitForFunction(()=>!!document.getElementById('bmSave')||/warnbox/.test((document.getElementById('bmOut')||{}).innerHTML||''),null,{timeout:60000});
    const ui=await page.evaluate(()=>({rows:[...document.querySelectorAll('#bmOut table tr')].slice(1).map(r=>r.textContent),heads:!!document.getElementById('bmHeads')&&document.getElementById('bmHeads').checked,warn:(document.querySelector('#bmOut .warnbox')||{}).textContent||''}));
    if(!(await page.$('#bmSave')))return {ui};
    const [dl]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.evaluate(()=>document.getElementById('bmSave').click())]);
    const bytes=L.fs.readFileSync(await dl.path());L.fs.writeFileSync(OUT+'/'+name.replace('.pdf','')+'-finished.pdf',bytes);
    const note=await page.evaluate(()=>(document.querySelector('#bmOut .note')||{}).textContent||'');
    const outline=await page.evaluate(async b64=>{const T=await pdfTools();return (await T.readOutline(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)))).map(o=>[o.title,o.page]);},bytes.toString('base64'));
    return {ui,bytes,note,outline,name:dl.suggestedFilename()};}
  const F=await finish(B,'packet-ipad.pdf');
  ok('3 a Safari-like PDF: the forms are found by their labels, and the header and footer are offered',F.ui.rows.length===FORMS.length+1&&F.ui.heads&&!F.ui.warn,F.ui);
  ok('4 the finished copy is saved as a new file and says what it did',F.bytes&&/\(finished\)\.pdf$/.test(F.name)&&/the header and footer on all \d+ pages/.test(F.note),{name:F.name,note:F.note});
  const tF=await texts(F.bytes);const N=tF.length;
  const headed=tF.map((p,i)=>p.t.indexOf('Page '+(i+1)+' of '+N)>=0&&/Newsome Behavioral Health/.test(p.t)&&/Mateo Rivera\s+·\s+ID 4471823/.test(p.t)&&/Confidential student record — FERPA protected/.test(p.t));
  ok('5 every one of the '+N+' pages has the practice, the student, the confidentiality line and its own “Page n of '+N+'”',N===tA.length&&headed.every(Boolean),{N,missing:headed.map((h,i)=>h?null:i+1).filter(Boolean).slice(0,5),p1:tF[0]&&tF[0].t.slice(0,200)});
  const want=[['Cover and contents',0]].concat(chromeInfo.secs.map(([id,pg])=>[id,pg]));
  ok('6 the bookmarks land where Chrome’s own PDF has each form start',F.outline.length===want.length&&F.outline.every((o,i)=>o[1]===want[i][1]&&(i===0||o[0].indexOf(want[i][0])===0)),{outline:F.outline,want});
  /* the contents numbers: each section's first page, at the right of its entry */
  const cp=tF[0],nums=chromeInfo.secs.map(([id,pg])=>{const entry=cp.items.find(t=>t.s.indexOf('Form '+id)>=0);const n=cp.items.find(t=>t.s===String(pg+1)&&entry&&Math.abs(t.y-entry.y)<4&&t.x>entry.x+100);return {id,page:pg+1,entry:!!entry,num:!!n};});
  ok('7 the contents page has each form’s page number on its entry’s line',nums.every(n=>n.entry&&n.num),nums);
  /* the header clear of the page's own text */
  /* the header and footer where they belong (not moved or shrunk with the page), and the forms' own text clear of them */
  const HEADR=/^(Newsome Behavioral Health|Mateo Rivera\s+·\s+ID 4471823|Page \d+ of \d+|Confidential student record — FERPA.*)$/;
  const band=p=>p.items.filter(t=>!HEADR.test(t.s)&&(t.y+t.h*0.85>p.H-34||t.y-t.h*0.25<32));
  const placed=p=>p.items.filter(t=>HEADR.test(t.s)).every(t=>/^(Newsome|Mateo)/.test(t.s)?Math.abs(t.y-(p.H-25.1))<1.5&&(t.s[0]!=='N'||Math.abs(t.x-32.4)<1):Math.abs(t.y-(/^Page/.test(t.s)?19.5:19.7))<1.5)&&p.items.filter(t=>HEADR.test(t.s)).length===4;
  const clash=tF.map(p=>band(p).map(t=>t.s.slice(0,30))).map((l,i)=>l.length?[i+1,l.slice(0,3)]:null).filter(Boolean);
  const misplaced=tF.map((p,i)=>placed(p)?null:[i+1,p.items.filter(t=>HEADR.test(t.s)).map(t=>[t.s.slice(0,12),Math.round(t.x),Math.round(t.y)])]).filter(Boolean);
  ok('8 the header and footer sit at the top and bottom of every page, and nothing of the forms’ own text is in their band',!clash.length&&!misplaced.length,{clash:clash.slice(0,4),misplaced:misplaced.slice(0,3)});
  /* a Safari PDF whose pages use nearly all the paper: made a little smaller */
  const G=await finish(C,'packet-tight.pdf');const tG=G.bytes?await texts(G.bytes):[],tC=await texts(C);
  const scaled=/\((\d+) made a little smaller/.exec(G.note||'');
  const clashG=tG.map(p=>band(p).length).reduce((a,b)=>a+b,0),missG=tG.map((p,i)=>placed(p)?null:[i+1,p.items.filter(t=>HEADR.test(t.s)).map(t=>[t.s.slice(0,12),Math.round(t.x),Math.round(t.y)])]).filter(Boolean);
  ok('9 pages that run into the margins are made a little smaller, and the header and footer stay clear of their text',!!scaled&&+scaled[1]>0&&clashG===0&&!missG.length&&tG.length===tC.length,{note:G.note,clashG,missG:missG.slice(0,3),pages:tG.length,was:tC.length});
  /* a Chrome PDF: as before, no second header */
  const K=await finish(A,'packet-chrome.pdf');const tK=K.bytes?await texts(K.bytes):[];
  const twice=tK.filter(p=>(p.t.match(/Page \d+ of \d+/g)||[]).length>1).length;
  ok('10 a Chrome PDF is finished as before: its bookmarks and numbers, no header offered and none added twice',K.ui.rows.length===FORMS.length+1&&!K.ui.heads&&K.bytes&&twice===0&&!/header and footer/.test(K.note),{ui:K.ui,twice,note:K.note});
  ok('11 no page errors',!log.length,log.slice(0,4));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
