/* v21.43 the TK-1 / TE-1 link: the shared core (tools/blocks/nbh-link.js) on its own. It is loaded into a blank page
   with a minimal host and a stub adapter (no form, no network), alone and inside a parent that plays the shell's
   relay. Checks: norm, hash, near, tokSame, readLk (junk, long, wrong types read as off), pack (1800 characters at
   most with six 40-character labels), planOf, boardOf, whoRow, readText (own file, CASE json, .case.html; packet,
   this form's file, another form's file, a case without the partner refused), stateOf for every state, Take/Keep
   exclusivity, the Apply order, a cancelled take, Keep, Undo, the identity block, the file input, Leave, Unlink,
   the ignored counter for spoofed answers, the open message and its fallback, and the phone width.
   usage: node qa/link-core-test.js */
/* the checkout this test runs from (lib.js: WS_ROOT, else the folder above qa/) */
const {chromium,fs,path,ROOT,wire,sleep}=require(__dirname+'/lib.js');
const CORE=fs.readFileSync(path.join(ROOT,'tools/blocks/nbh-link.js'),'utf8');
const HOST='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<style>body{margin:0;padding:16px;font:14px sans-serif;background:#fff}table.rt{border-collapse:collapse;width:100%}table.rt th,table.rt td{border:1px solid #ccc;padding:6px}</style></head>'+
  '<body><main class="sheet"><section><h3>Linked</h3><div id="lkPanel" class="noprint"></div></section></main></body></html>';
/* the stub adapter: a pretend TK-1 with cards, a count, a token, choices and a schedule paragraph */
const STUB=`
window.F={calls:[],confirmAnswer:true,noView:false,afters:0};
F.blank=()=>({meta:{client:'Sam K.',sid:'',lk:''},cards:['','','','','',''],n:'5',tok:'Star',choices:['','','','','',''],sched:''});
F.S=F.blank();
const lab=a=>a.filter(Boolean).join('; ');
function rows(v){const S=F.S,m=S.meta,lk=NBHLink.readLk(m.lk)||{},ci=Number.isInteger(lk.card)?lk.card:0,out=[];
  const sent=v.exWhen?'The exchange: '+v.exWhen+'.':'';
  out.push({key:'sched',what:'Token Economy back',here:S.sched,there:sent,owner:'there',preview:sent,took:'the schedule paragraph',rp:['Token Economy back']});
  const names=v.bk.filter(b=>!/^no$/i.test(b.conf)).map(b=>b.n);
  out.push({key:'menu',what:'Choices',here:lab(S.choices),there:lab(names),owner:'there',pre:['any'],
    same:()=>names.every(n=>S.choices.some(c=>NBHLink.norm(c)===NBHLink.norm(n)||NBHLink.near(c,n))),
    seen:names.map(n=>NBHLink.hash(NBHLink.norm(n))),took:'Choices from the backups',data:names,warn:v.bk.some(b=>/^no$/i.test(b.conf))?'A backup is not a reinforcer on RA-1.':''});
  out.push({key:'tok',what:'Token',here:S.tok,there:v.tokForm,same:(a,b)=>NBHLink.tokSame(b,a),owner:'',can:false,why:'Information only.'});
  const okN=/^\\d+$/.test(v.epN)&&+v.epN>=3&&+v.epN<=10;
  out.push({key:'n',what:'Tokens to earn',here:S.n,there:v.epN,same:(a,b)=>a!==''&&+a===+b,owner:'there',can:okN,why:okN?'':'Not a count the board can print.',
    rp:['Board','Tokens'],took:'tokens to earn '+S.n+' \\u2192 '+v.epN,data:v.epN});
  out.push({key:'card',what:'Target card '+(ci+1),here:S.cards[ci],there:v.beh,owner:'there',can:v.beh.length<=40,why:v.beh.length>40?'Too long for a card.':'',
    choose:{n:6,value:ci,label:'Target card'},took:'target card '+(ci+1),rp:['Targets'],data:ci});
  out.push(NBHLink.whoRow({client:m.client,sid:m.sid},{client:v.client,sid:v.sid},{other:'TE-1',meWhat:'this book'}));
  out.push({info:'Form TE-1 records token loss: none.'});
  return out;}
async function take(r){F.calls.push(r.key);const S=F.S,v=F.view;
  if(r.key==='who'){Object.assign(S.meta,r.fillParts);return;}
  if(r.key==='card'){S.cards[r.data]=v.beh;return;}
  if(r.key==='n'){await new Promise(z=>setTimeout(z,30));if(!F.confirmAnswer)return false;S.n=r.data;return;}
  if(r.key==='menu'){r.data.forEach(n=>{if(S.choices.some(c=>NBHLink.norm(c)===NBHLink.norm(n)||NBHLink.near(c,n)))return;const i=S.choices.indexOf('');if(i>=0)S.choices[i]=n;});return;}
  if(r.key==='sched'){S.sched=r.there;return;}}
F.api=NBHLink.mount({me:'TK-1',other:'TE-1',meWhat:'this book',otherWhat:'the token economy plan',sibling:'TE-1_Token-Economy-Designer_v2026-09.html',host:'#lkPanel',
  get:()=>F.S.meta.lk||'',set:s=>{F.S.meta.lk=s;},view:o=>{if(F.noView)return null;F.view=NBHLink.planOf(o);return F.view;},rows,take,
  snapshot:()=>JSON.stringify(F.S),restore:j=>{F.S=JSON.parse(j);F.api.render();},after:()=>{F.afters++;if(F.api)F.api.render();}});
`;
const TE={form:'TE-1',rev:'2026-09',saved:'2026-10-03T13:58:00.000Z',S:{meta:{client:'Sam K.',sid:'1234',beh:'Sits',epN:'7',tpN:'10',teN:'5',
  tokForm:'Laminated stars on a velcro strip',exWhen:'End of each block, 5 min',lk:''},
  thin:[{d:'9/1/26',w:'',tp:'5',ep:'1',te:'1',crit:''},{d:'10/1/26',w:'',tp:'10',ep:'5',te:'5',crit:''},{d:'',w:'',tp:'',ep:'',te:'',crit:''}],
  bk:[{n:'Tablet, video clips',c:'',cost:'',pref:'',conf:'Yes',note:''},{n:'Fruit chew',c:'',cost:'',pref:'',conf:'',note:''},{n:'Praise',c:'',cost:'',pref:'',conf:'No',note:''},{n:'',c:'',cost:'',pref:'',conf:'',note:''}],aud:{}}};
const te=patch=>{const o=JSON.parse(JSON.stringify(TE));Object.assign(o.S.meta,patch||{});return o;};

let fails=0;const out=[];
function ok(name,cond,extra){out.push((cond?'ok   ':'FAIL ')+name+(cond||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,400)));if(!cond)fails++;}

(async()=>{
  const browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:1100,height:900}});
  const page=await ctx.newPage();const log=[];wire(page,log);
  await page.setContent(HOST);await page.addScriptTag({content:CORE});await page.addScriptTag({content:STUB});

  /* ---- the pure functions ---- */
  const P=await page.evaluate(()=>{const N=NBHLink,r={};
    r.api=Object.keys(N).sort();
    r.norm=[N.norm(' Tablet   VIDEO\n'),N.norm('ﬁsh'),N.norm(null),N.norm(5)];
    r.hash=[N.hash(''),N.hash('a'),N.hash('foobar'),/^[0-9a-f]{8}$/.test(N.hash('é—x'))];
    r.near=[N.near('Tablet','Tablet, video clips'),N.near('Tablet, video clips','tablet'),N.near('Fruit','Fruit chew'),N.near('Puzzle','Puzzle(big)'),
      N.near('Tab','Tab (x)'),N.near('Tablet','Tablets'),N.near('Tablet','TABLET'),N.near('','Tablet'),N.near('Choose','Chooses the next task')];
    r.tok=[N.tokSame('Laminated stars on a velcro strip','Star'),N.tokSame('Laminated stars','Star (drawn)'),N.tokSame('Thumbs-up stickers','Thumbs up'),
      N.tokSame('Gold medals','Gold medal'),N.tokSame('little trophies','Trophy'),N.tokSame('a STAR','Star'),N.tokSame('ticks on a card','Check'),
      N.tokSame('starfish stickers','Star'),N.tokSame('coins','Star'),N.tokSame('','Star'),N.tokSame('stars',''),N.tokSame('Pokemon cards','Pokemon card'),N.tokSame('stars','Sticker','star')];
    r.tokKey=[N.tokKey('ticks on a card'),N.tokKey('Laminated stars'),N.tokKey('little trophies'),N.tokKey('Pokemon cards')];
    const junk=['not json','{"v":1,"on":1','x'.repeat(5000),JSON.stringify({v:1,on:1,took:'y'.repeat(4990)}),'[1]','"str"','5','null','{"v":"1","on":1}','{"v":2,"on":1}','{"on":1}'];
    r.junk=junk.map(s=>[N.readLk(s),N.isOn(s)]);
    r.types=[N.readLk(null),N.readLk(undefined),N.readLk(12),N.readLk({v:1,on:1}),N.isOn('{"v":1,"on":"yes"}'),N.isOn('{"v":1,"on":true}')];
    r.wrong=N.readLk(JSON.stringify({v:1,on:1,card:'3',base:{n:['zz','1'],tok:['0123abcd','89abcdef'],bogus:['0123abcd','89abcdef'],menu:['0123abcd']},board:5,menuSeen:'x',took:7,
      last:{when:'never',via:'x'},rp:'Board',kd:{n:'yesterday'}}));
    r.wrong2=N.readLk(JSON.stringify({v:1,on:1,card:7,last:{when:'2026-10-03T14:05:00Z',via:'shell',file:3,res:'drop table'},board:{n:'x7',tok:9,term:'gold',card:2.5,ch:['a',3],tg:'t'},
      menuSeen:['0123abcd','ZZZZZZZZ','89abcdef'].concat(Array(20).fill('00000000'))}));
    const L40=i=>('Label '+i+' ').padEnd(40,'abcdefghij').slice(0,40);
    const full={v:1,on:1,card:3,last:{when:new Date().toISOString(),via:'file',file:'F'.repeat(120),saved:new Date().toISOString(),res:'look 3',nm:'N'.repeat(160)},
      base:{who:[N.hash('a'),N.hash('b')],card:[N.hash('c'),N.hash('d')],beh:[N.hash('e'),N.hash('f')],n:[N.hash('5'),N.hash('7')],tok:[N.hash('g'),N.hash('h')],menu:[N.hash('i'),N.hash('j')],sched:[N.hash('k'),N.hash('l')]},
      kd:{n:'2026-10-03',tok:'2026-10-03'},menuSeen:Array.from({length:10},(_,i)=>N.hash('m'+i)),took:'T'.repeat(160),rp:['Board','Tokens','Targets','Token Economy back'],rpd:new Date().toISOString(),
      board:{n:'5',tok:L40(0),term:'pic',last:L40(1),card:3,cardLabel:L40(2),ch:[1,2,3,4,5,6].map(L40),tg:[7,8,9,10,11,12].map(L40)}};
    const p1=N.pack(full),b1=N.readLk(p1);
    r.pack1={len:p1.length,on:!!b1&&b1.on,ch:b1&&b1.board.ch.map(s=>s.length),took:!!(b1&&b1.took),base:b1&&Object.keys(b1.base).length};
    const heavy=JSON.parse(JSON.stringify(full));heavy.board.ch=heavy.board.ch.map(()=>'"'.repeat(40));heavy.board.tg=heavy.board.tg.map(()=>'\\'.repeat(40));
    const p2=N.pack(heavy),b2=N.readLk(p2);r.pack2={len:p2.length,on:!!b2&&b2.on,took:!!(b2&&b2.took),base:b2&&Object.keys(b2.base).length};
    const huge=JSON.parse(JSON.stringify(heavy));huge.extra='q'.repeat(3000);const p3=N.pack(huge),b3=N.readLk(p3);r.pack3={len:p3.length,on:!!b3&&b3.on,base:b3&&Object.keys(b3.base).length,card:b3&&b3.card};
    r.small=N.pack({v:1,on:1});
    /* planOf and boardOf */
    r.plan=N.planOf({meta:{client:' Sam ',sid:'1',beh:' Sits ',tpN:'10',epN:' 5 ',teN:'5',tokForm:'stars',exWhen:'End',exDelay:'',loss:'No',lossRule:'',tp:'FR 10',ep:'FR 5',te:'',lk:N.pack({v:1,on:1})},
      thin:[{d:'9/1',ep:'1'},{d:'10/1',ep:' 5 '},{d:'',ep:''}],bk:[{n:' Tablet ',conf:'Yes'},{n:'',conf:'No'},{n:'Chew'},null,'x']});
    r.planEmpty=N.planOf(null);
    r.boardOff=[N.boardOf({meta:{lk:''}}),N.boardOf({meta:{lk:N.pack({v:1,on:0,board:{n:'5'}})}}),N.boardOf({meta:{lk:N.pack({v:1,on:1})}}),N.boardOf(null)];
    r.board=N.boardOf({meta:{client:' Sam ',sid:'1',lk:N.pack({v:1,on:1,board:{n:'5',tok:'Star',term:'ring',last:'Star',card:1,cardLabel:'Sitting',ch:['Tablet'],tg:['Work','Sitting']}})}});
    return r;});
  ok('API: NBHLink exports',['boardOf','hash','mount','near','norm','pack','planOf','readLk','readText','stateOf','tokSame'].every(k=>P.api.includes(k)),P.api);
  ok('norm: NFKC, spaces, case',JSON.stringify(P.norm)===JSON.stringify(['tablet video','fish','','5']),P.norm);
  ok('hash: FNV-1a 8 hex',P.hash[0]==='811c9dc5'&&P.hash[1]==='e40c292c'&&P.hash[2]==='bf9cf968'&&P.hash[3],P.hash);
  ok('near: prefix of 4+ then space, comma or (',JSON.stringify(P.near)===JSON.stringify([true,true,true,true,false,false,false,false,false]),P.near);
  ok('tokSame: name, plural, stem as whole words',JSON.stringify(P.tok)===JSON.stringify([true,true,true,true,true,true,true,false,false,false,false,true,true]),P.tok);
  ok('tokKey: TOKWORD',JSON.stringify(P.tokKey)===JSON.stringify(['check','star','trophy','']),P.tokKey);
  ok('readLk: junk and long strings read as off',P.junk.every(([r,on])=>r===null&&on===false),P.junk);
  ok('readLk: wrong top-level types read as off',P.types.every(x=>x===null||x===false),P.types);
  ok('readLk: wrong field types dropped',P.wrong&&P.wrong.on===1&&P.wrong.card===undefined&&JSON.stringify(P.wrong.base)==='{"tok":["0123abcd","89abcdef"]}'&&!P.wrong.board&&!P.wrong.menuSeen&&!P.wrong.took&&!P.wrong.last&&!P.wrong.rp&&!P.wrong.kd,P.wrong);
  ok('readLk: fields validated',P.wrong2&&P.wrong2.card===undefined&&P.wrong2.last.res===''&&P.wrong2.last.file===''&&P.wrong2.board.n===''&&P.wrong2.board.term==='none'&&P.wrong2.board.card===0&&P.wrong2.board.tok===''&&P.wrong2.board.ch.length===6&&P.wrong2.board.ch[1]===''&&P.wrong2.board.tg.join('')===''&&P.wrong2.menuSeen.length===10&&!P.wrong2.menuSeen.includes('ZZZZZZZZ'),P.wrong2);
  ok('pack: <= 1800 with six 40-character labels, nothing cut',P.pack1.len<=1800&&P.pack1.on===1&&P.pack1.ch.every(n=>n===40)&&P.pack1.base===7,P.pack1);
  ok('pack: heavy labels still <= 1800 and on',P.pack2.len<=1800&&P.pack2.on===1&&P.pack2.base===7&&!P.pack2.took,P.pack2);
  ok('pack: anything too big still <= 1800 and on',P.pack3.len<=1800&&P.pack3.on===1&&P.pack3.base===7&&P.pack3.card===3,P.pack3);
  ok('pack: small record',P.small==='{"v":1,"on":1}',P.small);
  const pl=P.plan;
  ok('planOf: trimmed strings, backups, last thinning step, linked back',pl.client==='Sam'&&pl.beh==='Sits'&&pl.epN==='5'&&pl.tpN==='10'&&pl.tokForm==='stars'&&pl.exDelay===''&&pl.te===''&&
    JSON.stringify(pl.bk)==='[{"n":"Tablet","conf":"Yes"},{"n":"Chew","conf":""}]'&&JSON.stringify(pl.thinLast)==='{"d":"10/1","ep":"5"}'&&pl.linkedBack===true&&
    ['client','sid','beh','tp','tpN','ep','epN','te','teN','exWhen','exDelay','tokForm','loss','lossRule'].every(k=>typeof pl[k]==='string'),pl);
  ok('planOf: empty input',P.planEmpty.beh===''&&P.planEmpty.bk.length===0&&P.planEmpty.thinLast===null&&P.planEmpty.linkedBack===false,P.planEmpty);
  ok('boardOf: null when the link is off or has no board',P.boardOff.every(x=>x===null),P.boardOff);
  ok('boardOf: the board plus client and sid',P.board&&P.board.n==='5'&&P.board.term==='ring'&&P.board.cardLabel==='Sitting'&&P.board.ch.length===6&&P.board.tg[1]==='Sitting'&&P.board.client==='Sam'&&P.board.sid==='1',P.board);

  /* ---- readText ---- */
  const RT=await page.evaluate(TE=>{const N=NBHLink,j=JSON.stringify(TE),r={};
    r.own=N.readText(j,'TE-1_Sam_2026-10-03.json','TE-1','TK-1');
    r.mine=N.readText(JSON.stringify({form:'TK-1',S:{meta:{}}}),'TK-1.json','TE-1','TK-1');
    r.packet=N.readText(JSON.stringify({form:'PACKET',packet:{}}),'p.json','TE-1','TK-1');
    r.sm=N.readText(JSON.stringify({form:'SM-1',S:{}}),'s.json','TE-1','TK-1');
    r.noS=N.readText(JSON.stringify({form:'TE-1',S:[1]}),'x.json','TE-1','TK-1');
    r.garbage=N.readText('hello','x.txt','TE-1','TK-1');
    r.empty=N.readText('','x','TE-1','TK-1');
    const kase={form:'CASE',rev:'2026-09',saved:'2026-10-02T10:00:00Z',packet:{},forms:{'TE-1':{title:'Form TE-1',snap:{total:30,data:{},own:j}},'SM-1':{snap:{own:'{}'}}}};
    r.caseOk=N.readText(JSON.stringify(kase),'CASE_Sam.json','TE-1','TK-1');
    r.caseNo=N.readText(JSON.stringify(Object.assign({},kase,{forms:{'SM-1':{snap:{own:'{}'}}}})),'CASE_Sam.json','TE-1','TK-1');
    r.caseBad=N.readText(JSON.stringify(Object.assign({},kase,{forms:{'TE-1':{snap:{own:'{bad'}}}})),'CASE_Sam.json','TE-1','TK-1');
    const html='<!doctype html><html><body><p>shell</p>\x3cscript type="application/json" id="nbh-case">'+JSON.stringify(kase)+'\x3c/script></body></html>';
    r.caseHtml=N.readText(html,'Sam.case.html','TE-1','TK-1');
    r.htmlNo=N.readText('<!doctype html><html><body id="nbh-embed-forms"></body></html>','ws.html','TE-1','TK-1');
    r.tk=N.readText(JSON.stringify({form:'TK-1',saved:'s',S:{meta:{}}}),'TK-1_x.json','TK-1','TE-1');
    return r;},TE);
  const NO=' Nothing was changed.';
  ok('readText: the partner\'s own file',RT.own.ok&&RT.own.S.meta.beh==='Sits'&&RT.own.saved===TE.saved&&RT.own.file==='TE-1_Sam_2026-10-03.json',RT.own);
  ok('readText: this form\'s own file refused',!RT.mine.ok&&RT.mine.msg==="That file was saved by this form (Form TK-1), not by Form TE-1."+NO,RT.mine);
  ok('readText: packet refused',!RT.packet.ok&&RT.packet.msg==='That file is a student packet, not a file Form TE-1 saved.'+NO,RT.packet);
  ok('readText: another form refused',!RT.sm.ok&&RT.sm.msg==='That file was saved by Form SM-1, not by Form TE-1.'+NO,RT.sm);
  ok('readText: unreadable refused',[RT.noS,RT.garbage,RT.empty,RT.caseBad,RT.htmlNo].every(x=>!x.ok&&x.msg==='That file could not be read as a file Form TE-1 saved.'+NO),[RT.noS,RT.garbage,RT.empty,RT.caseBad,RT.htmlNo]);
  ok('readText: CASE json accepted',RT.caseOk.ok&&RT.caseOk.S.meta.epN==='7'&&RT.caseOk.file==='CASE_Sam.json'&&RT.caseOk.saved===TE.saved,RT.caseOk);
  ok('readText: a case without the partner refused',!RT.caseNo.ok&&RT.caseNo.msg==='That case file holds no Form TE-1.'+NO,RT.caseNo);
  ok('readText: .case.html accepted',RT.caseHtml.ok&&RT.caseHtml.S.meta.beh==='Sits'&&RT.caseHtml.file==='Sam.case.html',RT.caseHtml);
  ok('readText: the TE-1 side reads TK-1',RT.tk.ok&&RT.tk.saved==='s',RT.tk);

  /* ---- stateOf: the seven states, the identity block ---- */
  const ST=await page.evaluate(()=>{const N=NBHLink,h=s=>N.hash(N.norm(s)),o={other:'TE-1'},s=(row,base)=>{const x=N.stateOf(row,base,o);return [x.st,x.label,x.take,x.keep,x.pressed];};
    const R=(here,there,more)=>Object.assign({key:'n',what:'Tokens',here,there,owner:'there',pre:[],can:true},more||{});
    const r={};
    r.s1=s(R('Work','  work '));r.s1f=s(R('5','5.0',{same:(a,b)=>+a===+b}));
    r.s2=s(R('Work',''));r.s2m=s(R('Work','',{mirror:true}));
    r.s3=s(R('','Sits'));r.s3f=s(R('','Sits',{pre:['fill']}));r.s3no=s(R('','Sits',{pre:['fill'],can:false}));
    r.s4=s(R('Work','Sits'),[h('Work'),h('Sits')]);r.s4d=N.stateOf(R('Work','Sits'),[h('Work'),h('Sits')],{other:'TE-1',kd:'3 Oct'}).label;
    r.s5=s(R('Work','Sits'),[h('Work'),h('Stands')]);r.s5h=s(R('Work','Sits',{owner:'here'}),[h('Work'),h('Stands')]);r.s5c=s(R('Work','Sits',{owner:'here',pre:['changed']}),[h('Work'),h('Stands')]);
    r.s6=s(R('Work','Sits'),[h('Play'),h('Sits')]);r.s6m=s(R('Work','Sits',{mirror:true}),[h('Play'),h('Sits')]);
    r.s7=s(R('Work','Sits'));r.s7b=s(R('Work','Sits'),[h('Play'),h('Stands')]);r.s7no=s(R('Work','Sits',{can:false}));r.s7any=s(R('Work','Sits',{pre:['any']}));
    const wb=N.whoRow({client:'Sam K.',sid:'1'},{client:'Jordan B.',sid:'1'},{other:'TE-1',meWhat:'this book'});
    r.block=s(wb);r.blockWhy=wb.why;r.blockNm=wb.nm;r.blockKept=s(wb,[h(wb.here),h(wb.there)]);
    const ws=N.whoRow({client:'Sam K.',sid:'1'},{client:'Sam K.',sid:'2'});r.sidBlock=s(ws);
    const wf=N.whoRow({client:'sam  k.',sid:''},{client:'Sam K.',sid:'SIM-1'});r.fill=s(wf);r.fillParts=wf.fillParts;r.fillTook=wf.took;
    r.same=s(N.whoRow({client:'Sam',sid:'1'},{client:' sam',sid:'1'}));r.onlyHere=s(N.whoRow({client:'Sam',sid:'1'},{client:'',sid:''}));
    return r;});
  ok('state 1 in step (norm-equal, or same())',ST.s1[0]===1&&ST.s1[1]==='in step'&&!ST.s1[2]&&!ST.s1[3]&&ST.s1f[0]===1,[ST.s1,ST.s1f]);
  ok('state 2 only here',ST.s2[0]===2&&ST.s2[1]==='only here'&&!ST.s2[2]&&ST.s2m[1]==='only here; Form TE-1 can take this when it compares',[ST.s2,ST.s2m]);
  ok('state 3 empty here: Take offered, pressed only with fill',ST.s3[0]===3&&ST.s3[2]&&!ST.s3[3]&&ST.s3[4]===''&&ST.s3f[4]==='take'&&!ST.s3no[2]&&ST.s3no[4]==='',[ST.s3,ST.s3f,ST.s3no]);
  ok('state 4 kept different: Take and Keep, nothing pressed',ST.s4[0]===4&&ST.s4[1]==='kept different'&&ST.s4[2]&&ST.s4[3]&&ST.s4[4]===''&&ST.s4d==='kept different (3 Oct)',[ST.s4,ST.s4d]);
  ok('state 5 changed on Form TE-1: Take pressed for owner there (or pre changed)',ST.s5[0]===5&&ST.s5[1]==='changed on Form TE-1'&&ST.s5[4]==='take'&&ST.s5h[4]===''&&ST.s5c[4]==='take',[ST.s5,ST.s5h,ST.s5c]);
  ok('state 6 changed here: offered, not pressed; the partner\'s take promised only for a row it can take (mirror)',ST.s6[0]===6&&ST.s6[1]==='changed here'&&ST.s6m[1]==='changed here; Form TE-1 can take this when it compares'&&ST.s6[2]&&ST.s6[3]&&ST.s6[4]==='',[ST.s6,ST.s6m]);
  ok('state 7 different: Take and Keep, neither pressed',ST.s7[0]===7&&ST.s7[1]==='different'&&ST.s7[2]&&ST.s7[3]&&ST.s7[4]===''&&ST.s7b[0]===7&&!ST.s7no[2]&&ST.s7no[3]&&ST.s7any[4]==='take',[ST.s7,ST.s7b,ST.s7no,ST.s7any]);
  ok('identity: different client or sid blocks',ST.block[0]===0&&!ST.block[2]&&ST.block[3]&&ST.sidBlock[0]===0&&ST.blockWhy==='Form TE-1 names Jordan B. (ID 1); this book names Sam K. (ID 1).'&&ST.blockNm==='Form TE-1 names Jordan B.; this book names Sam K.',[ST.block,ST.blockWhy,ST.blockNm]);
  ok('identity: a confirmed pair reads as kept',ST.blockKept[0]===4,ST.blockKept);
  ok('identity: empty parts are filled, pre-ticked',ST.fill[0]===3&&ST.fill[4]==='take'&&JSON.stringify(ST.fillParts)==='{"sid":"SIM-1"}'&&ST.fillTook==='the student ID',[ST.fill,ST.fillParts]);
  ok('identity: same and only here',ST.same[0]===1&&ST.onlyHere[0]===2,[ST.same,ST.onlyHere]);

  /* ---- the panel, alone ---- */
  const A=async(fn,arg)=>page.evaluate(fn,arg);
  let s=await A(()=>({st:nbhLink.state(),off:!document.querySelector('.lk-off').hidden,on:!document.querySelector('.lk-on').hidden,txt:document.querySelector('.lk-offtxt').textContent,
    btn:document.querySelector('[data-lk="on"]').textContent,css:!!document.getElementById('nbh-link-css')}));
  ok('off by default: the off sentence and Link button',!s.st.on&&s.off&&!s.on&&/^Link this book with Form TE-1, the token economy plan for the same student\./.test(s.txt)&&/Nothing changes on either form without your click\.$/.test(s.txt)&&s.btn==='Link with Form TE-1'&&s.css,s);
  await page.click('[data-lk="on"]');
  s=await A(()=>({st:nbhLink.state(),lk:F.S.meta.lk,vis:['compare','file','beside','unlink'].map(k=>!document.querySelector('[data-lk="'+k+'"]').hidden),sib:document.querySelector('.lk-sib').hidden,
    status:document.querySelector('.lk-status').textContent,role:document.querySelector('.lk-status').getAttribute('role'),next:document.querySelector('.lk-next').textContent}));
  ok('Link: on, not compared yet',s.st.on&&s.lk==='{"v":1,"base":{},"on":1}'&&s.status==='Linked with Form TE-1 · not compared yet.'&&s.role==='status'&&s.next==='Outside the workstation, this book reads Form TE-1 from a file: press Save data on Form TE-1, then Open a file Form TE-1 saved, here.',s);
  ok('alone: Compare and Open beside hidden, file button shown, no sibling link on about:',JSON.stringify(s.vis)==='[false,true,false,true]'&&s.sib===true,s);

  /* compare reads only */
  const before=await A(()=>JSON.stringify(Object.assign({},F.S,{meta:Object.assign({},F.S.meta,{lk:''})})));
  const c1=await A(T=>{const r=nbhLink.compareWith(T,{via:'file',file:'TE-1_Sam_2026-10-03.json'});return {r,rows:nbhLink.rows(),st:nbhLink.state(),
    S:JSON.stringify(Object.assign({},F.S,{meta:Object.assign({},F.S.meta,{lk:''})})),lk:NBHLink.readLk(F.S.meta.lk),
    head:Array.from(document.querySelectorAll('.lk-tbl thead th')).map(t=>t.textContent),wrap:!!document.querySelector('.grid-wrap > table.lk-tbl'),
    info:Array.from(document.querySelectorAll('.lk-info td')).map(t=>t.textContent),status:document.querySelector('.lk-status').textContent};},TE);
  const rk=k=>c1.rows.find(r=>r.key===k)||{};
  ok('compare: S unchanged apart from the link record',c1.r===true&&c1.S===before,{before,after:c1.S});
  ok('compare: only last and the in-step base are written',c1.lk.last.via==='file'&&c1.lk.last.file==='TE-1_Sam_2026-10-03.json'&&c1.lk.last.saved===TE.saved&&JSON.stringify(Object.keys(c1.lk.base))==='["tok"]'&&!c1.lk.took,c1.lk);
  ok('compare: states and pre-ticks',rk('who').st===3&&rk('who').pressed==='take'&&rk('card').st===3&&rk('card').pressed===''&&rk('n').st===7&&rk('n').pressed===''&&rk('tok').st===1&&rk('menu').st===3&&rk('menu').pressed==='take'&&rk('sched').st===3&&rk('sched').pressed==='',c1.rows);
  ok('compare: table in .grid-wrap, headers, information line',c1.wrap&&JSON.stringify(c1.head)==='["What","This book","Form TE-1","State and choice"]'&&c1.info[0]==='Form TE-1 records token loss: none.',c1);
  ok('compare: status counts the items to look at',c1.lk.last.res==='look 5'&&c1.status==='Linked with Form TE-1 · 5 items to look at below.',[c1.lk.last.res,c1.status]);

  /* Take and Keep are exclusive (real clicks) */
  const ap=async k=>A(k=>['take','keep'].map(a=>{const b=document.querySelector('tr[data-key="'+k+'"] button[data-act="'+a+'"]');return b?b.getAttribute('aria-pressed'):null;}),k);
  const x0=await ap('n');
  await page.click('tr[data-key="n"] button[data-act="take"]');const x1=await ap('n');
  await page.click('tr[data-key="n"] button[data-act="keep"]');const x2=await ap('n');
  await page.click('tr[data-key="n"] button[data-act="keep"]');const x3=await ap('n');
  const kl=await A(()=>document.querySelector('tr[data-key="n"] button[data-act="keep"]').textContent);
  ok('Take/Keep: aria-pressed and exclusive',JSON.stringify([x0,x1,x2,x3])==='[["false","false"],["true","false"],["false","true"],["false","false"]]'&&kl==="Keep this book\u2019s",[x0,x1,x2,x3,kl]);
  const nm=await A(()=>Array.from(document.querySelectorAll('tr[data-key="n"] button')).map(b=>b.getAttribute('aria-label')));
  ok('Take/Keep: each button names its row',JSON.stringify(nm)===JSON.stringify(['Take: Tokens to earn','Keep this book\u2019s: Tokens to earn']),nm);
  const tick=await A(()=>{const b=document.querySelector('tr[data-key="who"] button[data-act="take"]');return {p:b.getAttribute('aria-pressed'),before:getComputedStyle(b,'::before').content,legend:document.querySelector('.lk-legend').textContent};});
  ok('a ticked button shows a tick, and the legend says so',tick.p==='true'&&/\u2713/.test(tick.before)&&/^Dark buttons with a \u2713 are ticked\./.test(tick.legend),tick);
  const tokB=await A(()=>document.querySelectorAll('tr[data-key="tok"] button').length);
  ok('a row in step has no buttons',tokB===0,tokB);
  await page.click('tr[data-key="n"] button[data-act="take"]');await page.click('tr[data-key="card"] button[data-act="take"]');await page.click('tr[data-key="sched"] button[data-act="take"]');
  const pre=await A(()=>JSON.stringify(F.S));
  const r1=await A(async()=>{const res=await nbhLink.apply();return {res,calls:F.calls.slice(),S:F.S,lk:NBHLink.readLk(F.S.meta.lk),rows:nbhLink.rows(),st:nbhLink.state(),
    undo:!document.querySelector('.lk-undo').hidden,took:document.querySelector('.lk-took').textContent,rp:document.querySelector('.lk-rp').textContent};});
  ok('Apply: the order who, card, n, menu, sched (rows came in reverse)',JSON.stringify(r1.calls)==='["who","card","n","menu","sched"]',r1.calls);
  ok('Apply: the takes happened',r1.res.taken===5&&r1.S.meta.sid==='1234'&&r1.S.cards[0]==='Sits'&&r1.S.n==='7'&&r1.S.choices.join('|')==='Tablet, video clips|Fruit chew||||'&&r1.S.sched==='The exchange: End of each block, 5 min.',r1.S);
  ok('Apply: bases are the new here and the there',r1.lk.base.n[0]===await A(()=>NBHLink.hash('7'))&&r1.lk.base.n[1]===r1.lk.base.n[0]&&Object.keys(r1.lk.base).length===6,r1.lk.base);
  ok('Apply: menuSeen, took, reprint',r1.lk.menuSeen.length===2&&/^Taken .+: the student ID; target card 1; tokens to earn 5 → 7; Choices from the backups; the schedule paragraph$/.test(r1.lk.took)&&r1.lk.took.length<=160&&
    JSON.stringify(r1.lk.rp)==='["Targets","Board","Tokens","Token Economy back"]'&&/^Reprint: the Targets, Board, Tokens and Token Economy back pages \(changed by the link .+\)\.$/.test(r1.rp)&&r1.took===r1.lk.took,[r1.lk,r1.rp]);
  ok('Apply: the toast, everything in step, Undo offered',r1.st.toast==='5 items taken from Form TE-1. Nothing else changed.'&&r1.rows.every(r=>r.st===1)&&r1.lk.last.res==='step'&&r1.undo&&r1.st.undo,[r1.st,r1.rows]);
  const st1=await A(()=>document.querySelector('.lk-status').textContent);
  ok('status: in step, compared ... with the file ... (saved ...)',/^Linked with Form TE-1 · in step · compared .+ with the file TE-1_Sam_2026-10-03\.json \(saved .+\)\.$/.test(st1),st1);
  /* Undo */
  await page.click('[data-lk="undo"]');
  const u=await A(()=>({S:JSON.stringify(F.S),undo:!document.querySelector('.lk-undo').hidden,table:nbhLink.state().table}));
  ok('Undo restores S exactly and removes the button',u.S===pre&&!u.undo&&!u.table,u);
  /* Undo is withdrawn as soon as the record changes after the take: an edit, or another record opened */
  const uw=await A(async T=>{F.S=F.blank();nbhLink.link();nbhLink.compareWith(T,{via:'file'});await nbhLink.apply();const a=nbhLink.state().undo;
    F.S.meta.client='Someone else';const i=document.createElement('input');document.body.appendChild(i);i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(z=>setTimeout(z,30));
    const b=nbhLink.state().undo,hid=document.querySelector('.lk-undo').hidden,r=nbhLink.undo();i.remove();return {a,b,hid,r,client:F.S.meta.client};},TE);
  ok('Undo: withdrawn by an edit after the take, and the edit stays',uw.a&&!uw.b&&uw.hid&&uw.r===false&&uw.client==='Someone else',uw);
  const uw2=await A(async T=>{F.S=F.blank();nbhLink.link();nbhLink.compareWith(T,{via:'file'});await nbhLink.apply();const a=nbhLink.state().undo;
    F.S=F.blank();F.S.meta.client='Other file';F.S.meta.lk=NBHLink.pack({v:1,on:1,base:{}});nbhLink.render();const r=nbhLink.undo();return {a,b:nbhLink.state().undo,r,client:F.S.meta.client};},TE);
  ok('Undo: withdrawn when the record is replaced (Open data of another file)',uw2.a&&!uw2.b&&uw2.r===false&&uw2.client==='Other file',uw2);
  /* a value typed here after the compare: that row is neither taken nor kept, and is named */
  const sl=await A(async T=>{F.S=F.blank();F.calls=[];nbhLink.link();nbhLink.compareWith(T,{via:'file'});nbhLink.press('n','take');F.S.n='6';
    const res=await nbhLink.apply();const st=nbhLink.state();return {res,calls:F.calls.slice(),n:F.S.n,toast:st.toast,msg:st.msg,row:nbhLink.rows().find(r=>r.key==='n')};},TE);
  ok('Apply: a row changed here after the compare is skipped and named',sl.res.stale===1&&sl.n==='6'&&!sl.calls.includes('n')&&sl.res.taken===2&&
    /Nothing else changed\. Not taken, because this book changed after the compare: Tokens to earn\. The table now shows it as it is\.$/.test(sl.toast)&&/^Not taken/.test(sl.msg)&&sl.row.here==='6',sl);
  /* the took line is cut at an item, never inside a word */
  const tl=await A(async T=>{F.S=F.blank();nbhLink.link();nbhLink.compareWith(T,{via:'file'});['card','n','sched'].forEach(k=>nbhLink.press(k,'take'));
    const rows=nbhLink.rows();await nbhLink.apply();return NBHLink.readLk(F.S.meta.lk).took;},te({exWhen:'x'.repeat(10)}));
  ok('took line: 160 characters at most, whole items',typeof tl==='string'&&tl.length<=160&&/^Taken .+: /.test(tl)&&(!/\u2026$/.test(tl)||/; \u2026$/.test(tl)),tl);

  /* a cancelled take keeps its base; the rest goes in */
  await A(()=>{F.S=F.blank();F.calls=[];nbhLink.link();});
  await A(T=>nbhLink.compareWith(T,{via:'file'}),TE);
  await A(()=>{nbhLink.press('n','take');F.confirmAnswer=false;});
  const r2=await A(async()=>{const res=await nbhLink.apply();return {res,lk:NBHLink.readLk(F.S.meta.lk),n:F.S.n,rows:nbhLink.rows()};});
  ok('a cancelled take: skipped, its base kept, the others taken',r2.res.taken===2&&r2.n==='5'&&!r2.lk.base.n&&r2.lk.base.who&&r2.lk.base.menu&&r2.rows.find(r=>r.key==='n').st===7,r2);
  ok('status: a file with no name',await A(()=>/with a file Form TE-1 saved \(saved .+\)\.$/.test(document.querySelector('.lk-status').textContent)||document.querySelector('.lk-status').textContent));

  /* Keep, then compare again: kept; Form TE-1 changes: changed on Form TE-1, pre-ticked; this book changes: changed here */
  await A(()=>{F.confirmAnswer=true;F.S=F.blank();nbhLink.link();});
  await A(T=>nbhLink.compareWith(T,{via:'file'}),TE);
  const k1=await A(async()=>{nbhLink.press('menu','take');nbhLink.press('who','take');nbhLink.press('n','keep');/* the first two un-press the pre-ticked rows */const res=await nbhLink.apply();return {res,st:nbhLink.state(),lk:NBHLink.readLk(F.S.meta.lk),S:F.S};});
  ok('Keep only: nothing changed, the pair recorded',k1.res.taken===0&&k1.res.kept===1&&k1.st.toast==='1 difference kept. Nothing was changed.'&&k1.S.n==='5'&&k1.lk.kd&&/^\d{4}-\d\d-\d\d$/.test(k1.lk.kd.n)&&!k1.st.undo&&k1.lk.last.res==='look 4'&&!k1.lk.base.who&&!k1.lk.base.menu,k1);
  const k2=await A(T=>{nbhLink.compareWith(T,{via:'file'});return nbhLink.rows().find(r=>r.key==='n');},TE);
  ok('recompare after Keep: kept different (date)',k2.st===4&&/^kept different \(.+\)$/.test(k2.label)&&k2.pressed==='',k2);
  const k3=await A(T=>{nbhLink.compareWith(T,{via:'file'});return nbhLink.rows().find(r=>r.key==='n');},te({epN:'8'}));
  ok('Form TE-1 changed: changed on Form TE-1, pre-ticked',k3.st===5&&k3.label==='changed on Form TE-1'&&k3.pressed==='take',k3);
  const k4=await A(T=>{F.S.n='6';nbhLink.compareWith(T,{via:'file'});return nbhLink.rows().find(r=>r.key==='n');},TE);
  ok('this book changed: changed here, offered, not pressed',k4.st===6&&k4.take&&k4.pressed==='',k4);
  const k5=await A(T=>{nbhLink.compareWith(T,{via:'file'});return nbhLink.rows().find(r=>r.key==='n');},te({epN:'9'}));
  ok('both changed: different',k5.st===7&&k5.pressed==='',k5);

  /* the card buttons */
  const cb=await A(()=>{const b=document.querySelector('tr[data-key="card"] button[data-act="choose"][data-i="2"]');b.click();const r=nbhLink.rows().find(r=>r.key==='card');
    return {what:r.what,card:NBHLink.readLk(F.S.meta.lk).card,p:document.querySelector('tr[data-key="card"] button[data-act="choose"][data-i="2"]').getAttribute('aria-pressed'),n:document.querySelectorAll('tr[data-key="card"] button[data-act="choose"]').length};});
  ok('card buttons 1-6 choose the card',cb.what==='Target card 3'&&cb.card===2&&cb.p==='true'&&cb.n===6,cb);

  /* the identity block */
  await A(()=>{F.S=F.blank();nbhLink.link();});
  const ib0=await A(()=>JSON.stringify(Object.assign({},F.S,{meta:Object.assign({},F.S.meta,{lk:''})})));
  const ib=await A(T=>{nbhLink.compareWith(T,{via:'file'});nbhLink.press('n','take');const st=nbhLink.state(),btn=document.querySelector('tr[data-key="who"] button');
    return {st,dis:document.querySelector('[data-lk="apply"]').disabled,btn:btn.textContent,n:document.querySelectorAll('tr[data-key="who"] button').length,status:document.querySelector('.lk-status').textContent,
      why:document.querySelector('tr.lk-note[data-for="who"]').textContent};},te({client:'Jordan B.',sid:'1234'}));
  ok('identity: Apply disabled, one button, the names',ib.st.blocked&&!ib.st.apply&&ib.dis&&ib.n===1&&ib.btn==='These are the same student'&&ib.why==='Form TE-1 names Jordan B. (ID 1234); this book names Sam K.'&&
    /^Linked with Form TE-1 · for another student\? Form TE-1 names Jordan B\.; this book names Sam K\. · compared .+ with a file Form TE-1 saved \(saved .+\)\.$/.test(ib.status)&&ib.st.res==='who',ib);
  const ib2=await A(async()=>{const r0=await nbhLink.apply();const unchanged=JSON.stringify(Object.assign({},F.S,{meta:Object.assign({},F.S.meta,{lk:''})}));
    document.querySelector('tr[data-key="who"] button').click();const st=nbhLink.state();return {r0,unchanged,st,dis:document.querySelector('[data-lk="apply"]').disabled};});
  ok('identity: nothing written before "These are the same student"; then Apply opens',ib2.r0.taken===0&&ib2.unchanged===ib0&&ib2.st.apply&&!ib2.dis,ib2);
  const ib3=await A(async T=>{await nbhLink.apply();nbhLink.compareWith(T,{via:'file'});return nbhLink.rows().find(r=>r.key==='who');},te({client:'Jordan B.',sid:'1234'}));
  ok('identity: confirmed, the next compare reads kept',ib3.st===4,ib3);

  /* the file input: refusals change nothing, a good file compares */
  await A(()=>{F.S=F.blank();nbhLink.link();});
  const fb=await A(()=>JSON.stringify(F.S));
  await page.setInputFiles('.lk-fileIn',{name:'PACKET_Sam.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'PACKET',packet:{client:'Sam'}}))});await sleep(150);
  const f1=await A(()=>({S:JSON.stringify(F.S),msg:document.querySelector('.lk-msg').textContent,shown:!document.querySelector('.lk-msg').hidden,table:nbhLink.state().table}));
  ok('file input: a packet refused, nothing changed',f1.S===fb&&f1.shown&&f1.msg==='That file is a student packet, not a file Form TE-1 saved. Nothing was changed.'&&!f1.table,f1);
  await page.setInputFiles('.lk-fileIn',{name:'SM-1_Sam.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'SM-1',S:{meta:{}}}))});await sleep(150);
  const f2=await A(()=>({S:JSON.stringify(F.S),msg:document.querySelector('.lk-msg').textContent}));
  ok('file input: another form refused',f2.S===fb&&f2.msg==='That file was saved by Form SM-1, not by Form TE-1. Nothing was changed.',f2);
  await page.setInputFiles('.lk-fileIn',{name:'TE-1_Sam_2026-10-03.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(TE))});await sleep(150);
  const f3=await A(()=>({st:nbhLink.state(),msgHidden:document.querySelector('.lk-msg').hidden,lk:NBHLink.readLk(F.S.meta.lk)}));
  ok('file input: the partner\'s file compares',f3.st.table&&f3.msgHidden&&f3.lk.last.file==='TE-1_Sam_2026-10-03.json'&&f3.lk.last.via==='file',f3);
  /* Leave */
  const lv0=await A(()=>F.S.meta.lk);await page.click('[data-lk="leave"]');
  const lv=await A(()=>({lk:F.S.meta.lk,table:nbhLink.state().table,hidden:document.querySelector('.lk-cmp').hidden}));
  ok('Leave: closes the table, writes nothing',lv.lk===lv0&&!lv.table&&lv.hidden,lv);
  /* no board in a TK-1 file (the view is null) */
  const nv=await A(T=>{F.noView=true;const r=nbhLink.compareWith(T,{via:'file'});F.noView=false;return {r,msg:nbhLink.state().msg};},TE);
  ok('no view: the link-off message',nv.r===false&&nv.msg==="Form TE-1\u2019s link is off, so its file does not name its cards. Turn on Link with Form TK-1 on TE-1\u2019s Setup page, then compare again.",nv);
  /* a record whose result fails the check claims no state; a board count outside 1-10 is dropped */
  const jr=await A(()=>{const keep=F.S.meta.lk;F.S.meta.lk=JSON.stringify({v:1,on:1,last:{when:'2026-10-03T12:00:00Z',res:'look 9999'},board:{n:'0'}});nbhLink.leave();
    const r={status:document.querySelector('.lk-status').textContent,n0:NBHLink.readLk(F.S.meta.lk).board.n,n99:NBHLink.readLk(JSON.stringify({v:1,board:{n:'99'}})).board.n,n10:NBHLink.readLk(JSON.stringify({v:1,board:{n:'10'}})).board.n};F.S.meta.lk=keep;nbhLink.render();return r;});
  ok('junk result: "compared", never "in step"; board.n only 1-10',!/in step/.test(jr.status)&&/^Linked with Form TE-1 \u00b7 compared .+\.$/.test(jr.status)&&jr.n0===''&&jr.n99===''&&jr.n10==='10',jr);
  /* the partner's file is not this form's saved state: its change event does not reach the document (nbh-guard) */
  const gd=await A(T=>new Promise(res=>{let seen=0;const h=e=>{if(e.target&&e.target.classList&&e.target.classList.contains('lk-fileIn'))seen++;};document.addEventListener('change',h,true);
    const fi=document.querySelector('.lk-fileIn'),dt=new DataTransfer();dt.items.add(new File([JSON.stringify(T)],'TE-1_x.json'));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(()=>{document.removeEventListener('change',h,true);const tb=nbhLink.state().table;nbhLink.leave();res({seen,table:tb});},200);}),TE);
  ok('file input: the change stays inside the panel and still compares',gd.seen===0&&gd.table,gd);
  /* smart punctuation is the same student */
  const sp=await A(()=>{const N=NBHLink;return {q:N.norm('Liam O\u2019Brien')===N.norm("Liam O'Brien"),d:N.norm('SIMULATED \u2013 Sample')===N.norm('SIMULATED - Sample'),
    w:N.whoRow({client:'Sam K'},{client:'Sam K.'}).block,w2:N.whoRow({client:'Liam O\u2019Brien'},{client:"Liam O'Brien"}).block,w3:N.whoRow({client:'Sam'},{client:'Jordan'}).block};});
  ok('norm: curly quotes and dashes; a trailing period is the same student',sp.q&&sp.d&&!sp.w&&!sp.w2&&sp.w3,sp);
  /* spoofed answers, alone */
  const ig0=await A(()=>nbhLink.ignored());
  await A(T=>{window.postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own:JSON.stringify(T)}},'*');window.postMessage({nbh:'opened',want:'TE-1',ok:true},'*');window.postMessage({nbh:'facts'},'*');},TE);await sleep(150);
  const ig1=await A(()=>({n:nbhLink.ignored(),table:nbhLink.state().table}));
  ok('alone: an answer or opened from this window is ignored and counted',ig1.n===ig0+2&&!ig1.table,[ig0,ig1]);
  /* Unlink (the confirm is accepted by the test's dialog handler) */
  await page.click('[data-lk="unlink"]');await sleep(100);
  const ul=await A(()=>({lk:F.S.meta.lk,st:nbhLink.state(),off:!document.querySelector('.lk-off').hidden}));
  ok('Unlink: the record removed, off again',ul.lk===''&&!ul.st.on&&ul.off,ul);

  /* phone width: no sideways page scroll with long values */
  await page.setViewportSize({width:390,height:800});
  await A(T=>{F.S=F.blank();F.S.cards[0]='Supercalifragilisticexpialidociousnesses';nbhLink.link();nbhLink.compareWith(T,{via:'file',file:'TE-1_'+'Very_Long_File_Name_'.repeat(6)+'.json'});},
    te({beh:'Places_one_block_in_the_bin_from_the_tray_during_independent_work_without_spaces',exWhen:'End of each independent work block, five minutes, at the desk, with the tablet'}));
  const ph=await A(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,wrap:document.querySelector('.lk-cmp .grid-wrap').scrollWidth}));
  ok('phone width 390: no horizontal page overflow',ph.sw<=ph.cw&&ph.bw<=ph.cw,ph);
  await page.screenshot({path:__dirname+'/out/link-core/phone.png',fullPage:true});

  /* ---- inside a parent that plays the shell ---- */
  const pg=await ctx.newPage();const log2=[];wire(pg,log2);await pg.setViewportSize({width:1100,height:900});
  await pg.setContent('<!doctype html><html><body><iframe id="A" style="width:900px;height:700px"></iframe><iframe id="B"></iframe></body></html>');
  await pg.evaluate(({host,core,stub,own})=>{window.P={mode:'answer',openMode:'ok',asks:[],opens:[],own};
    window.addEventListener('message',ev=>{const d=ev.data;if(!d||typeof d!=='object')return;const A=document.getElementById('A').contentWindow;if(ev.source!==A)return;
      if(d.nbh==='ask'){P.asks.push(d);if(P.mode==='answer')setTimeout(()=>A.postMessage({nbh:'answer',want:d.want,ok:true,title:'Form TE-1',snap:{total:1,data:{},own:P.own}},'*'),40);
        else if(P.mode==='notopen')A.postMessage({nbh:'answer',want:d.want,ok:false,why:'not open'},'*');}
      if(d.nbh==='open'){P.opens.push(d);if(P.openMode==='ok')setTimeout(()=>A.postMessage({nbh:'opened',want:d.want,ok:true},'*'),20);}});
    document.getElementById('B').srcdoc='<p>sibling</p>';
    document.getElementById('A').srcdoc=host.replace('</body>','<script>'+core+'<\/script><script>'+stub+'<\/script></body>');},{host:HOST,core:CORE,stub:STUB,own:JSON.stringify(TE)});
  await sleep(600);
  const fa=await (await pg.$('#A')).contentFrame(),fbr=await (await pg.$('#B')).contentFrame();
  const vis=await fa.evaluate(()=>['compare','file','beside','unlink'].map(k=>!document.querySelector('[data-lk="'+k+'"]').hidden));
  await fa.click('[data-lk="on"]');await sleep(500);
  const sh=await fa.evaluate(()=>({st:nbhLink.state(),lk:NBHLink.readLk(F.S.meta.lk),vis:['compare','file','beside','unlink'].map(k=>!document.querySelector('[data-lk="'+k+'"]').hidden),sib:document.querySelector('.lk-sib').hidden}));
  const asks=await pg.evaluate(()=>P.asks);
  ok('shell: Link compares straight away through the relay',asks.length===1&&asks[0].want==='TE-1'&&sh.st.table&&sh.lk.last.via==='shell'&&sh.lk.last.saved===TE.saved,{asks,sh});
  ok('shell: Compare and Open beside shown, no sibling link',JSON.stringify(sh.vis)==='[true,true,true,true]'&&sh.sib,sh);
  ok('shell: status names the Form TE-1 open in this workstation',/compared .+ with the Form TE-1 open in this workstation\.$|items? to look at below\.$/.test(sh.st.status[0]),sh.st.status);
  /* spoofed answers while waiting */
  await pg.evaluate(()=>{P.mode='hold';});
  await fa.click('[data-lk="compare"]');await sleep(100);
  const w0=await fa.evaluate(()=>({ig:nbhLink.ignored(),waiting:nbhLink.state().waiting,when:NBHLink.readLk(F.S.meta.lk).last.when,dis:document.querySelector('[data-lk="compare"]').disabled}));
  await fbr.evaluate(own=>{parent.frames[0].postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'9'})));await sleep(100);
  await fa.evaluate(own=>{window.postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'9'})));await sleep(100);
  await pg.evaluate(own=>{document.getElementById('A').contentWindow.postMessage({nbh:'answer',want:'GB-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'9'})));await sleep(100);
  const w1=await fa.evaluate(()=>({ig:nbhLink.ignored(),waiting:nbhLink.state().waiting,when:NBHLink.readLk(F.S.meta.lk).last.when}));
  ok('shell: answers from a sibling frame, the form itself, or for another form are ignored and counted',w0.waiting&&w0.dis&&w1.ig===w0.ig+3&&w1.waiting&&w1.when===w0.when,{w0,w1});
  await pg.evaluate(own=>{document.getElementById('A').contentWindow.postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'9'})));await sleep(150);
  const w2=await fa.evaluate(()=>({ig:nbhLink.ignored(),waiting:nbhLink.state().waiting,n:nbhLink.rows().find(r=>r.key==='n')}));
  await pg.evaluate(own=>{document.getElementById('A').contentWindow.postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'4'})));await sleep(150);
  const w3=await fa.evaluate(()=>({ig:nbhLink.ignored(),n:nbhLink.rows().find(r=>r.key==='n')}));
  ok('shell: the parent\'s answer while waiting is taken; a second one is ignored',!w2.waiting&&w2.ig===w1.ig&&w2.n.there==='9'&&w3.ig===w2.ig+1&&w3.n.there==='9',{w2,w3});
  /* a file opened while the relay is still asking wins: the late answer is ignored */
  await pg.evaluate(()=>{P.mode='hold';});
  await fa.click('[data-lk="compare"]');await sleep(100);
  const la0=await fa.evaluate(async own=>{const w=nbhLink.state().waiting;F.S.meta.client='';nbhLink.fromFile(own,'TE-1_late.json');await nbhLink.apply();return {w,ig:nbhLink.ignored(),undo:nbhLink.state().undo};},JSON.stringify(te({epN:'8'})));
  await pg.evaluate(own=>{document.getElementById('A').contentWindow.postMessage({nbh:'answer',want:'TE-1',ok:true,snap:{own}},'*');},JSON.stringify(te({epN:'3'})));await sleep(150);
  const la=await fa.evaluate(()=>({ig:nbhLink.ignored(),undo:nbhLink.state().undo,via:NBHLink.readLk(F.S.meta.lk).last.via,file:NBHLink.readLk(F.S.meta.lk).last.file}));
  ok('shell: a late answer after a file compare is ignored; Undo and the file compare stay',la0.w&&la0.undo&&la.ig===la0.ig+1&&la.undo&&la.via==='file'&&la.file==='TE-1_late.json',{la0,la});
  /* not open */
  await pg.evaluate(()=>{P.mode='notopen';});await fa.click('[data-lk="compare"]');await sleep(150);
  const no=await fa.evaluate(()=>({msg:nbhLink.state().msg,table:nbhLink.state().table}));
  ok('shell: partner not open',no.msg==='Form TE-1 is not open in this workstation. Open it beside this book, or open a file it saved.'&&!no.table,no);
  /* open beside: opened, then a compare 1.5 s later */
  await pg.evaluate(()=>{P.mode='answer';P.openMode='ok';P.asks=[];});
  await fa.click('[data-lk="beside"]');await sleep(300);
  const ob0=await fa.evaluate(()=>nbhLink.state().msg);
  await sleep(1700);
  const ob=await pg.evaluate(()=>({opens:P.opens,asks:P.asks.length}));const ob1=await fa.evaluate(()=>nbhLink.state());
  ok('shell: Open beside sends open, waits, then compares',ob.opens.length===1&&ob.opens[0].want==='TE-1'&&ob.opens[0].beside===true&&/^Form TE-1 is opening beside this book/.test(ob0)&&ob.asks===1&&ob1.table,{ob,ob0,ob1});
  /* no opened reply: the 2 s fallback */
  await pg.evaluate(()=>{P.openMode='none';});await fa.click('[data-lk="beside"]');await sleep(2300);
  const nf=await fa.evaluate(()=>nbhLink.state().msg);
  ok('shell: no opened reply, the fallback text',nf==='This workstation could not open Form TE-1 from here. Pick it from the list of forms.',nf);
  /* an opened reply nobody asked for */
  const og0=await fa.evaluate(()=>nbhLink.ignored());
  await pg.evaluate(()=>{document.getElementById('A').contentWindow.postMessage({nbh:'opened',want:'TE-1',ok:true},'*');});await sleep(100);
  ok('shell: an opened reply while not waiting is ignored',(await fa.evaluate(()=>nbhLink.ignored()))===og0+1);

  /* the file has none of the forbidden strings */
  ok('core: no CF-1, no practice name, no script tag',!/CF-1/.test(CORE)&&!/Newsome Behavioral Health/.test(CORE)&&!/<\/script/i.test(CORE));
  const errs=log.concat(log2).filter(l=>l.type!=='warning');
  ok('no console errors',errs.length===0,errs);
  await browser.close();
  console.log(out.join('\n'));console.log(fails?'FAILED '+fails:'ALL OK ('+out.length+' checks)');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
