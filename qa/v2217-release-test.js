/* v22.17 the reply box's token and the release steps (review F498, F518). The read token that lists a box's replies goes
   in the body of a POST, not in the web address, so the host's access log never holds it: box.php answers a POST list
   (and still the GET list of a form from before v22.17), and IA-1, DD-1 and the shared reply kit (CF-1, SV-1, IN-1) send
   no token in an address, falling back once to the address only for a box from before v22.17. README.md's release steps
   are whole and point at scripts that are in the repository: tools/build-release.sh, qa/run-release.sh and
   tools/zip-release.sh, which makes both editions' zips (without the recogniser), the reply box's and the relay's.
   Needs php on the PATH.   usage: node qa/v2217-release-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn,spawnSync}=require('child_process');
const OUT=__dirname+'/out/v2217';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.V2217_PORT||8137),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const hex=n=>Array.from({length:n},(_,i)=>'0123456789abcdef'[(i*5+1)%16]).join('');
const sha=t=>require('crypto').createHash('sha256').update(t).digest('hex');
const J=async(u,opt)=>{const r=await fetch(u,opt);let j=null;try{j=await r.json();}catch(e){}return {s:r.status,j};};
const post=(u,o)=>J(u,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(o)});
(async()=>{let php=null,br=null;
  try{
  /* ---- the box ---- */
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','ignore']});
  let ping=null;for(let i=0;i<40&&!ping;i++){await sleep(250);try{const r=await J(BOXURL+'?a=ping');if(r.j&&r.j.ok)ping=r.j;}catch(e){}}
  ok('1 box.php says it takes the token in the body (ping v3, listPost)',!!ping&&ping.v>=3&&ping.listPost===true,ping);
  const B1=hex(32),T1='0123456789abcdef0123456789abcdef';
  await post(BOXURL+'?a=new',{b:B1,t:sha(T1)});
  await post(BOXURL+'?a=put&b='+B1,{v:1,k:{x:'A'.repeat(43),y:'B'.repeat(43)},iv:'A'.repeat(16),ct:'C'.repeat(64)});
  const a=await post(BOXURL+'?a=list&b='+B1,{t:T1}),w=await post(BOXURL+'?a=list&b='+B1,{t:'f'.repeat(32)}),e=await post(BOXURL+'?a=list&b='+B1,{}),g=await J(BOXURL+'?a=list&b='+B1+'&t='+T1);
  ok('2 a POST list with the right token gives the reply; a wrong or missing token is refused (403)',a.s===200&&a.j.count===1&&w.s===403&&e.s===403,{a:a.s,count:a.j&&a.j.count,w:w.s,e:e.s});
  ok('3 the GET list of a form from before v22.17 still answers',g.s===200&&g.j.count===1,{s:g.s});
  /* ---- the forms ---- */
  br=await chromium.launch();const ctx=await br.newContext({serviceWorkers:'block'});
  const lists=[];ctx.on('request',r=>{if(/[?&]a=list/.test(r.url()))lists.push({m:r.method(),url:r.url(),body:r.postData()||''});});
  /* an old box (before v22.17), on a host of its own: a POST list is "wrong token", the GET list answers */
  const OLD='http://old-box.test/box.php';
  await ctx.route(OLD+'**',route=>{const u=new URL(route.request().url()),m=route.request().method(),js=(o,s)=>route.fulfill({status:s||200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(o)});
    if(u.searchParams.get('a')==='list'){if(m==='POST')return js({ok:false,error:'wrong token'},403);return u.searchParams.get('t')===T1?js({ok:true,b:B1,count:0,replies:[]}):js({ok:false,error:'wrong token'},403);}
    return js({ok:true});});
  const F=n=>BASE+'/NBH-Workstation/'+encodeURI(fs.readdirSync(path.join(ROOT,'NBH-Workstation')).find(f=>f.startsWith(n)));
  const res={};
  const ia=await ctx.newPage();await ia.goto(F('IA-1_'));await sleep(1200);
  res.ia=await ia.evaluate(async([u,o,b,t])=>{const x=await __rp.list(u,b,t),y=await __rp.list(o,b,t);return {n:x.count,old:y.count};},[BOXURL,OLD,B1,T1]);
  const dd=await ctx.newPage();await dd.goto(BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1200);
  res.dd=await dd.evaluate(async([u,o,b,t])=>{const x=await __ddStaff.list(u,b,t),y=await __ddStaff.list(o,b,t);return {n:x.count,old:y.count};},[BOXURL,OLD,B1,T1]);
  const cf=await ctx.newPage();await cf.goto(F('CF-1_'));await sleep(1200);
  res.kit=await cf.evaluate(async([u,o,b,t])=>{const S=crypto.subtle,kp=await S.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']),pr=await S.exportKey('jwk',kp.privateKey),pu=await S.exportKey('jwk',kp.publicKey);
    const run=async site=>{let box={id:b,token:t,site,pub:{x:pu.x,y:pu.y},priv:{d:pr.d,x:pr.x,y:pr.y},got:[],held:[]};
      const C=NBH_RESPOND.boxClient({get:()=>box,set:v=>{box=v;},addr:()=>'',paint:()=>{}});const r=await C.fetch({noEnsure:true});return r?{all:r.all,unread:r.unread}:{err:C.last};};
    return {now:await run(u),old:await run(o)};},[BOXURL,OLD,B1,T1]);
  const inAddr=lists.filter(l=>l.url.indexOf(T1)>=0&&!/old-box\.test/.test(l.url)),posts=lists.filter(l=>l.m==='POST'&&!/old-box\.test/.test(l.url));
  ok('4 IA-1, DD-1 and the reply kit list the replies with the token in a POST body, never in the address',res.ia.n===1&&res.dd.n===1&&res.kit.now&&res.kit.now.unread===1&&!inAddr.length&&posts.length>=3&&posts.every(l=>l.body.indexOf(T1)>=0),{res,inAddr:inAddr.map(l=>l.url),posts:posts.length});
  const oldGet=lists.filter(l=>/old-box\.test/.test(l.url)&&l.m==='GET');
  ok('5 with a box from before v22.17 each of them asks once more the old way and gets the list',res.ia.old===0&&res.dd.old===0&&res.kit.old&&res.kit.old.all!==undefined&&oldGet.length===3,{res,oldGet:oldGet.length});
  const src=['NBH-Workstation/nbh-respond.js',path.basename(new URL(F('IA-1_')).pathname),'Daily_Behavior_Data_and_Visual_Analysis.html'].map(f=>fs.readFileSync(path.join(ROOT,f.startsWith('NBH')?f:'NBH-Workstation/'+decodeURI(f)),'utf8'));
  ok('6 no form builds a list address with the token in it any more',src.every(s=>!/a=list&b='\+encodeURIComponent\([^)]*\)\+'&t=|a=list&b="\+encodeURIComponent\(id\)\+"&t=/.test(s)));
  /* ---- the release steps ---- */
  const rd=fs.readFileSync(path.join(ROOT,'README.md'),'utf8'),blk=rd.slice(rd.indexOf('## Making a release'));
  const lines=blk.split('\n').map(l=>l.trim()).filter(l=>/^(bash|python3|node) /.test(l)),dup=lines.filter((l,i)=>lines.indexOf(l)!==i);
  const named=['tools/build-release.sh','qa/run-release.sh','tools/zip-release.sh'];
  ok('7 README\'s release steps name no step twice and point at scripts that are in the repository',!dup.length&&named.every(n=>blk.indexOf(n)>=0&&fs.existsSync(path.join(ROOT,n)))&&/nbh-reply-box-upload\.zip/.test(blk)&&/_speech\.zip/.test(blk),{dup,missing:named.filter(n=>!fs.existsSync(path.join(ROOT,n)))});
  const syn=['tools/build-release.sh','tools/zip-release.sh'].map(f=>spawnSync('bash',['-n',f],{cwd:ROOT}).status);
  const zd=OUT+'/zips';fs.rmSync(zd,{recursive:true,force:true});
  const z=spawnSync('bash',['tools/zip-release.sh',zd],{cwd:ROOT,encoding:'utf8',maxBuffer:1<<26});
  const V=(/WS_REL='(v[^']+)'/.exec(fs.readFileSync(path.join(ROOT,'NBH-Workstation/index.html'),'utf8'))||[])[1];
  const made=fs.existsSync(zd)?fs.readdirSync(zd).sort():[];
  const want=['NBH-Workstation_'+V+'.zip','RPS-Workstation_'+V+'.zip','nbh-relay-upload.zip','nbh-reply-box-upload.zip'];
  const list=f=>spawnSync('unzip',['-Z1',path.join(zd,f)],{encoding:'utf8',maxBuffer:1<<26}).stdout.split('\n').filter(Boolean);
  const rps=made.includes(want[1])?list(want[1]):[],box=made.includes(want[3])?list(want[3]):[];
  ok('8 tools/zip-release.sh makes both editions\' zips (files at the top, no nbh-asr/), the reply box\'s and the relay\'s',syn.every(s=>s===0)&&z.status===0&&want.every(w=>made.includes(w))&&rps.includes('index.html')&&!rps.some(f=>/^nbh-asr\//.test(f))&&box.includes('public_html/reply/box.php'),{syn,status:z.status,err:(z.stderr||'').slice(-300),made,rpsAsr:rps.filter(f=>/nbh-asr/.test(f)).length});
  fs.rmSync(zd,{recursive:true,force:true});
  }catch(e){ok('crashed',false,String(e.stack||e));}
  if(br)await br.close();if(php)php.kill();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
