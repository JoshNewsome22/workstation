/* v22.12 the build and the release run (review F507, I258, F505). The tools reproduce the shipped forms exactly
   (tools/check-build.py), so a rebuild changes nothing and no device downloads a form again for nothing; the two blocks
   added by hand (DM-1's home contact, DD-1's Log it now) sit where the polish build leaves them; patch-guard.py, which
   would remove the nbh-ui block, refuses to run. Every test in the written release run (qa/release-list.txt) exists,
   says pass or fail by its exit code, and needs nothing from one machine's scratch folder; the debugging scripts are
   out of the tests' folder. No browser.   usage: node qa/v2212-build-test.js */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const ROOT=process.env.WS_ROOT||path.join(__dirname,'..');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const run=(cmd,args)=>spawnSync(cmd,args,{cwd:ROOT,encoding:'utf8',maxBuffer:1<<26});
const cb=run('python3',['tools/check-build.py']);
ok('1 the tools reproduce the shipped forms exactly (tools/check-build.py)',cb.status===0,(cb.stdout+cb.stderr).trim().slice(-600));
const W=path.join(ROOT,'NBH-Workstation');
const dm=fs.readFileSync(path.join(W,fs.readdirSync(W).find(f=>f.startsWith('DM-1_'))),'utf8'),dd=fs.readFileSync(path.join(W,'Daily_Behavior_Data_and_Visual_Analysis.html'),'utf8');
const above=(s,id)=>{const m=new RegExp('<script id="'+id+'">[\\s\\S]*?</script>\\n<style id="nbh-polish-css"').exec(s);return !!m;};
ok('2 DM-1\'s and DD-1\'s blocks added by hand sit just above the polish block, where the polish build leaves them',above(dm,'dm-v2195')&&above(dd,'dd-v2194'));
const form=fs.readdirSync(W).find(f=>f.startsWith('CF-1_'));const before=fs.readFileSync(path.join(W,form),'utf8');
const pg=run('python3',['tools/blocks/patch-guard.py','tools/blocks/nbh-guard.html','NBH-Workstation/'+form]);
ok('3 patch-guard.py refuses to run on the shipped forms (it would remove the nbh-ui block) and changes nothing',pg.status!==0&&/retired/.test(pg.stderr+pg.stdout)&&fs.readFileSync(path.join(W,form),'utf8')===before,{status:pg.status,out:(pg.stderr+pg.stdout).slice(0,200)});
const list=fs.readFileSync(path.join(__dirname,'release-list.txt'),'utf8').split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>l.split(/\s+/).pop());
const missing=list.filter(t=>!fs.existsSync(path.join(__dirname,t+'.js')));
ok('4 the written release run lists '+list.length+' tests, every one of them in qa/',list.length>=150&&!missing.length&&list.includes('v2212-build-test'),{missing});
const src=t=>{try{return fs.readFileSync(path.join(__dirname,t+'.js'),'utf8');}catch(e){return '';}};
const noexit=list.filter(t=>!/process\.exit|exitCode/.test(src(t)));
ok('5 every test in the release run says pass or fail by its exit code',!noexit.length,{noexit});
const scratch=list.filter(t=>/\/tmp\/claude|scratchpad\//.test(src(t).replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'')));
ok('6 no test in the release run reads from one machine\'s scratch folder (the before-copies are in qa/data/)',!scratch.length&&['CF-1_before-v21.39.html','SV-1_before-v21.39.html','IN-1_before-v21.40.html'].every(f=>fs.existsSync(path.join(__dirname,'data',f))),{scratch});
const dbg=fs.readdirSync(__dirname).filter(f=>/(-dbg\d*|-tmp)\.js$/.test(f));
ok('7 the debugging scripts are in qa/probes/, not among the tests',!dbg.length&&fs.existsSync(path.join(__dirname,'probes','tb1-dbg.js')),{dbg});
const sh=run('bash',['-n','qa/run-release.sh']),rr=fs.readFileSync(path.join(__dirname,'run-release.sh'),'utf8');
ok('8 the release runner (qa/run-release.sh) reads the list, runs each test, and writes a summary naming the commit',sh.status===0&&/qa\/release-list\.txt/.test(rr)&&/git rev-parse --short HEAD/.test(rr)&&/exit=\$code/.test(rr),sh.stderr);
console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;
