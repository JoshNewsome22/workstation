/* v22.09 field names inside tables (review F486) and the questionnaire page by keyboard and VoiceOver (F485).
   Every form, with its simulation loaded: no field in a table cell is named by the whole header row run together or by
   the choices of a list, and within a table the names say row and column (so they differ); TB-1's "Socially
   significant?" list and DM-1's contact phone boxes say so. The respondent page: the open answers have their questions
   as names, Yes / No / Sometimes are radio buttons reached by Tab, and each item's choices are named by the question.
   Simulated data only.   usage: node qa/v2209-names-test.js   env ONLY=DM-1,TB-1 */
const {chromium,BASE,sleep,forms,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const only=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const tot={cells:0,whole:0,choices:0,dup:0,named:0},worst=[];const errs=[];let TB=null,DM=null;
  for(const f of forms().filter(x=>!only.length||only.includes(x.id))){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1500);await loadSim(p);await sleep(2200);
    await p.evaluate(()=>{window.scrollTo(0,document.body.scrollHeight);window.dispatchEvent(new Event('resize'));});await sleep(600);
    const r=await p.evaluate(()=>{const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
      const own=n=>{const c=n.cloneNode(true);c.querySelectorAll('input,select,textarea,button,option').forEach(x=>x.remove());return clean(c.textContent);};
      const o={cells:0,whole:0,choices:0,dup:0,named:0,ex:[]};
      document.querySelectorAll('table').forEach(t=>{if(t.closest('.nbh-as-ui,dialog'))return;const hr=t.tHead&&t.tHead.rows.length?t.tHead.rows[t.tHead.rows.length-1]:t.rows[0];if(!hr)return;
        const hcs=[...hr.children].map(c=>own(c)).filter(Boolean);const whole=hcs.length>1?clean(hcs.join('')):'';   /* one heading over the whole table is a right name, not a run-together row */const names=[];
        t.querySelectorAll('td input:not([type=hidden]),td select,td textarea').forEach(el=>{if(!el.offsetParent&&el.type!=='checkbox')return;o.cells++;const a=el.getAttribute('aria-label');if(!a)return;o.named++;names.push(a);
          const row=el.closest('tr');const opts=[...row.querySelectorAll('select')].map(s=>clean([...s.options].map(x=>x.textContent).join('')));
          if(whole&&a.replace(/\s/g,'')===whole.replace(/\s/g,''))o.whole++,o.ex.length<3&&o.ex.push('whole: '+a);
          else if(opts.some(x=>x&&x.replace(/\s/g,'')===a.replace(/\s/g,'')))o.choices++,o.ex.length<3&&o.ex.push('choices: '+a);});
        const seen={};names.forEach(n=>{seen[n]=(seen[n]||0)+1;});o.dup+=names.filter(n=>seen[n]>1).length;});
      return o;});
    for(const k of ['cells','whole','choices','dup','named'])tot[k]+=r[k];
    if(r.whole||r.choices)worst.push(f.id+' '+r.whole+'/'+r.choices+' '+r.ex.join(' | '));
    if(f.id==='TB-1')TB=await p.evaluate(()=>{const th=[...document.querySelectorAll('th')].find(x=>/Socially significant\?/.test(x.textContent));if(!th)return null;const t=th.closest('table');
      return [...t.querySelectorAll('tbody select')].slice(0,6).map(s=>s.getAttribute('aria-label'));});
    if(f.id==='DM-1')DM=await p.evaluate(()=>{const th=[...document.querySelectorAll('th')].find(x=>/^\s*Phone\s*$/.test(x.textContent));if(!th)return null;const t=th.closest('table');
      return [...t.querySelectorAll('tbody input')].slice(0,8).map(s=>s.getAttribute('aria-label')||'(own)');});
    await p.close();}
  console.log('  fields in table cells: '+tot.cells+', named by the script: '+tot.named+', whole header row: '+tot.whole+', choices of a list: '+tot.choices+', sharing a name in their table: '+tot.dup);
  ok('1 no field in a table is named by the whole header row run together or by the choices of a list (all forms)',tot.cells>1000&&tot.whole===0&&tot.choices===0,worst.slice(0,8));
  ok('2 within a table the names say row and column: fewer than 1 in 10 of the named fields share a name',tot.named>0&&tot.dup/tot.named<0.1,{dup:tot.dup,named:tot.named});
  if(!only.length||only.includes('TB-1'))ok('3 TB-1: the candidates\' lists are named for their row and "Socially significant?" or their own column, never "4321"',!!TB&&TB.length>0&&TB.some(a=>/Socially significant\?/.test(a||''))&&!TB.some(a=>/^\d{3,}$/.test(a||'')),TB);
  if(!only.length||only.includes('DM-1'))ok('4 DM-1: a contact\'s phone box says Phone and its row, never "NameRelationshipPhoneNotes"',!!DM&&DM.some(a=>/Phone/.test(a))&&!DM.some(a=>/NameRelationship/.test(a)),DM);
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  /* the respondent page */
  const rp=await ctx.newPage();const rerr=[];rp.on('pageerror',e=>rerr.push(e.message));
  await rp.goto(BASE+'/NBH-Workstation/respond.html');await sleep(800);
  const mounted=await rp.evaluate(()=>{const R=window.NBH_RESPOND;if(!R||!R.mount)return false;const root=document.getElementById('nbhr');root.innerHTML='';
    R.mount(root,{form:'IN-1',inst:'parent',title:'Parent questions',student:'S.S.',scale:{kind:'yn',labels:['Yes','No',null]},items:[{n:1,text:'Does the behavior happen at home (simulated)?'}],
      open:[{id:'q1',label:'What happens just before (simulated)?'},{id:'q2',label:'Does it happen at mealtimes?',type:'yns'}]});return true;});
  await sleep(500);
  const a11y=await rp.evaluate(()=>{const ta=document.querySelector('textarea[maxlength]');const lab=ta&&ta.id&&document.querySelector('label[for="'+ta.id+'"]');
    const yns=document.querySelector('.yns .opts');const rad=yns?[...yns.querySelectorAll('input[type=radio]')]:[];
    const grp=document.querySelector('ol.items .opts');const gl=grp&&grp.getAttribute('aria-labelledby');
    return {ta:lab?lab.textContent:'',yns:rad.length,ynsName:yns&&yns.getAttribute('aria-labelledby')?document.getElementById(yns.getAttribute('aria-labelledby')).textContent:'',item:gl?document.getElementById(gl).textContent:''};});
  let picked='';if(a11y.yns){await rp.evaluate(()=>document.querySelector('.yns .opts input').focus());await rp.keyboard.press('ArrowRight');await sleep(100);picked=await rp.evaluate(()=>{const c=document.querySelector('.yns .opts input:checked');return c?c.value:'';});}
  ok('6 the questionnaire page: the open answer is named by its question, Yes / No / Sometimes are radio buttons the arrow keys pick, and the item\'s choices are named by its question',
    mounted&&/What happens just before/.test(a11y.ta)&&a11y.yns===3&&/mealtimes/.test(a11y.ynsName)&&picked==='No'&&/happen at home/.test(a11y.item)&&!rerr.length,{mounted,a11y,picked,rerr});
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
