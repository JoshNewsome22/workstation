/* v21.44 Email it… (nbh-respond.js U.invite): the four forms that build respondent pages open a ready email from the user's own
   mail app. For IA-1 (the FAST, test wording pasted), SV-1, IN-1 and CF-1 with the simulated case: the button is off until the
   page can be built; it opens the dialog with a subject naming the questionnaire and the student's initials only, a message
   carrying the respondent link (respond.html#p=...), Open in Mail makes a mailto: to the address typed (remembered for next
   time); no name of the simulated student appears in the email.  usage: node qa/invite-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const FORMS=['IA-1_Indirect-Functional-Assessment-Protocol_v2026-09','SV-1_Social-Validity_v2026-09','IN-1_Stakeholder-Interview-Record_v2026-09','CF-1_Contextual-Fit-Assessment_v2026-09'];
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  for(const f of FORMS){const id=f.slice(0,4);
    await p.goto(BASE+'/NBH-Workstation/'+f+'.html');await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(800);
    await p.evaluate(()=>{window.__hrefs=[];const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(/^mailto:/.test(this.href)){window.__hrefs.push(this.href);return;}return c.apply(this,arguments);};});
    if(id==='IA-1'){await p.evaluate(()=>document.getElementById('rpBtn').click());await sleep(300);
      ok(id+': Email it is off while the FAST has no wording',await p.evaluate(()=>{const b=document.getElementById('rpMail');b.click();return b.classList.contains('off')&&!document.querySelector('.nbh-inv[open]');}));
      await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();const t=document.getElementById('rpwFast');t.value=Array.from({length:16},(_,i)=>(i+1)+'. Does [the behavior] happen in situation '+(i+1)+'?').join('\n');t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);}
    await p.evaluate(()=>document.getElementById('rpBtn').click());await sleep(400);
    await p.evaluate(()=>{const e=document.getElementById('rpEmail');if(e&&!e.value){e.value='bcba@example.org';e.dispatchEvent(new Event('input',{bubbles:true}));}});
    const name=await p.evaluate(()=>([...document.querySelectorAll('input')].find(i=>/Sample Student/.test(i.value))||{}).value||'');
    await p.evaluate(()=>document.getElementById('rpMail').click());await sleep(400);
    const r=await p.evaluate(()=>{const d=document.querySelector('.nbh-inv');return d?{open:d.open,su:d.querySelector('#nbhInvSu').value,bo:d.querySelector('#nbhInvBo').value}:null;});
    ok(id+': the dialog opens',!!(r&&r.open));if(!r)continue;
    ok(id+': the subject names the questionnaire and initials',/ · [A-Z]\.(?:[A-Z]\.)*$/.test(r.su),r.su);
    ok(id+': the message carries the respondent link',/https?:\/\/\S+\/respond\.html#p=\S+/.test(r.bo));
    ok(id+': no student name or ID in the email',/Sample Student/.test(name)&&!/Sample|Student\b|SIM-000/.test(r.su+r.bo.replace(/#p=\S+/,'')),name);
    await p.fill('.nbh-inv #nbhInvTo','teacher@example.org');await p.click('.nbh-inv button[data-a=mail]');await sleep(200);
    const h=await p.evaluate(()=>window.__hrefs[0]||'');
    ok(id+': Open in Mail makes the mailto',h.indexOf('mailto:teacher@example.org?subject=')===0&&decodeURIComponent(h).indexOf('respond.html#p=')>0,h.length);
    await p.click('.nbh-inv button[data-a=close]');
    ok(id+': the address is remembered',await p.evaluate(()=>localStorage.getItem('nbh-invite-to')==='teacher@example.org'));}
  ok('no script errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
