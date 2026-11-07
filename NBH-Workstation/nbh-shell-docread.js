/* nbh-shell-docread.js: the workstation's Read a document (v21.67), moved out of index.html at v25.68 so the page keeps
   within its size budget. index.html loads it by a script tag (id nbh-docread) where the block was, so it runs at the same
   moment and finds the same page. It is the workstation's own (not a form's): the offline copy lists it with the files
   index.html loads (tools/pwa-sw.py finds the tag), the school edition copies it with the folder (tools/build-rps.py), and
   the one-file edition is to carry it inline (tools/build-single.py, as it does nbh-media.js). */
/* ===================== Read a document (v21.67) =====================
   A student's details come on paper: the school's information printout, the IEP's cover page, a plan. Rather than type
   them again, the bar's Read a document takes a PDF, a picture (a photo, a screenshot) or pasted text, finds the details
   in it and offers each one, with the line it was read from, for the bar and Form DM-1 (and target behaviors found in a
   plan for the case). Everything happens on this device: a PDF with its own text is read by PDF.js (nbh-doc/), a scanned
   page or a picture by Tesseract (nbh-ocr/), both kept with the workstation and saved for offline use; nothing is sent
   anywhere, and the text is kept only while the dialog is open. The one-file edition, and a folder opened from a drive,
   take pasted text (the iPad's Live Text copies it from any photo or PDF); the readers need the website or the app.
   The matcher: nbhDocRead.parse(text) -> {fields:[{k,label,value,raw,seen,to,ok,note}], behaviors:[{label,def,isRep}]}.
   A label is known by its aliases (longest first); what follows it on the line, up to the next label, is its value, or
   the next line when the label stands alone; a label followed by one space counts only when the value has the field's
   shape (a date, a grade, an ID, a name). Values are shaped for the form: dates to YYYY-MM-DD, grades to the list,
   sex, ELL, interpreter, eligibility, placement, diploma, yes/no to Form DM-1's choices. */
const nbhDocRead=(()=>{
  const F=[
    {k:'name',label:'Student',al:'student name|name of (?:the )?student|student(?:\'s|\u2019s)? (?:legal |full )?name|child(?:\'s|\u2019s)? name|legal name|full name|learner|pupil|student|name',kind:'name',to:['bar:client','DM-1:s.first','DM-1:s.last']},
    {k:'last',label:'Last name',al:'last name|surname|family name',kind:'text',to:['DM-1:s.last']},
    {k:'first',label:'First name',al:'first name|given name',kind:'text',to:['DM-1:s.first']},
    {k:'pref',label:'Preferred name',al:'preferred name|nickname|goes by|known as|preferred',kind:'text',to:['DM-1:s.pref']},
    {k:'dob',label:'Date of birth',al:'date of birth|birth date|birthdate|birthday|d\\.?o\\.?b\\.?|born',kind:'date',to:['DM-1:s.dob']},
    {k:'sex',label:'Sex',al:'sex|gender',kind:'sex',to:['DM-1:s.sex']},
    {k:'pron',label:'Pronouns',al:'pronouns?',kind:'text',to:['DM-1:s.pron']},
    {k:'sid',label:'Student ID',al:'student (?:id|identification) (?:number|no\\.?|#)|student (?:id|number|no\\.?|#)|local (?:id|student id)|district (?:id|student id)|id (?:number|no\\.?|#)|student id|id',kind:'id',to:['bar:sid','DM-1:s.sid']},
    {k:'fleid',label:'FLEID',al:'fleid|florida education identifier|state (?:student )?id(?: number)?|state identifier',kind:'id',to:['DM-1:s.fleid']},
    {k:'school',label:'School',al:'school name|name of school|school of (?:enrollment|attendance)|enrolled school|current school|attending school|zoned school|campus|school',kind:'school',to:['bar:site','DM-1:s.school']},
    {k:'grade',label:'Grade',al:'grade level|current grade|grade|gr\\.',kind:'grade',to:['bar:grade','DM-1:s.grade']},
    {k:'room',label:'Classroom / teacher',al:'teacher name|homeroom teacher|classroom teacher|teacher|homeroom|classroom|room',kind:'text',to:['DM-1:s.room']},
    {k:'enroll',label:'Enrolled',al:'enrollment date|date (?:of )?enroll(?:ed|ment)|date enrolled|entry date|date of entry|enrolled (?:on|since)|enrolled',kind:'date',to:['DM-1:s.enroll']},
    {k:'prior',label:'Previous school',al:'previous school|prior school|last school|former school|transferred from',kind:'text',to:['DM-1:s.prior']},
    {k:'trans',label:'Transportation',al:'transportation|bus (?:number|no\\.?|#|route)|bus',kind:'text',to:['DM-1:s.trans']},
    {k:'lang',label:'Home language',al:'home language|primary language|native language|first language|language spoken at home|language at home|parent language|student language|preferred oral language|preferred written language|language',kind:'text',to:['DM-1:s.lang']},
    {k:'interp',label:'Interpreter',al:'interpreter (?:needed|required)|interpreter',kind:'interp',to:['DM-1:s.interp']},
    {k:'ell',label:'ELL',al:'ell status|ell code|english language learner|esol(?: status)?|lep status|ell|lep',kind:'ell',to:['DM-1:s.ell']},
    {k:'eth',label:'Race / ethnicity',al:'single ethnicity|race/ethnicity|race / ethnicity|race and ethnicity|ethnicity|race',kind:'eth',to:['DM-1:s.eth']},
    {k:'medicaid',label:'Medicaid',al:'medicaid (?:id|number|no\\.?|#)|medicaid',kind:'text',to:['DM-1:s.medicaid']},
    {k:'elig',label:'Primary exceptionality',al:'primary (?:exceptionality|disability|eligibility|ese program)|exceptionality|eligibility category|disability category|primary ese|eligibility|disability',kind:'elig',to:['DM-1:p.elig']},
    {k:'elig2',label:'Secondary exceptionality',al:'secondary (?:exceptionality|disability|eligibility)|other exceptionalit(?:y|ies)',kind:'text',to:['DM-1:p.elig2']},
    {k:'eligdate',label:'Initial eligibility date',al:'initial eligibility(?: date)?|eligibility date|date of (?:initial )?eligibility|initial placement date',kind:'date',to:['DM-1:p.eligdate']},
    {k:'iepdate',label:'Current IEP date',al:'iep (?:meeting )?date|current iep(?: date)?|date of (?:the )?iep|iep (?:dated|developed|written)|iep start(?: date)?|plan date|meeting date',kind:'date',to:['DM-1:p.iepdate']},
    {k:'annual',label:'Annual review due',al:'annual review(?: due| date)?|iep (?:annual )?review(?: due| date)?|iep due(?: date)?|next (?:iep|annual review)(?: date)?|iep end(?: date)?|review date|iep expires?',kind:'date',to:['DM-1:p.annual']},
    {k:'reeval',label:'Reevaluation due',al:'re-?evaluation(?: due| date)?|next re-?eval(?:uation)?(?: date)?|re-?eval due|reevaluation|re-?eval',kind:'date',to:['DM-1:p.reeval']},
    {k:'place',label:'Placement',al:'placement|educational setting|service delivery(?: model)?|lre|setting',kind:'place',to:['DM-1:p.place']},
    {k:'matrix',label:'Matrix',al:'matrix of services(?: level| score)?|matrix(?: level| score)?|cost factor',kind:'matrix',to:['DM-1:p.matrix']},
    {k:'diploma',label:'Diploma option',al:'diploma (?:option|track|type)|diploma',kind:'diploma',to:['DM-1:p.diploma']},
    {k:'p504',label:'504 plan',al:'section 504(?: plan)?|504 plan|504',kind:'yesno',to:['DM-1:p.p504']},
    {k:'esy',label:'ESY',al:'extended school year|esy',kind:'yesno',to:['DM-1:p.esy']},
    {k:'allergy',label:'Allergies',al:'allerg(?:y|ies)',kind:'text',to:['DM-1:h.allergy']},
    {k:'diet',label:'Diet',al:'diet(?:ary)? (?:restrictions?|needs?)|diet',kind:'text',to:['DM-1:h.diet']},
    {k:'pcp',label:'Physician',al:'primary care (?:physician|provider|doctor)|physician|pediatrician|doctor|pcp',kind:'text',to:['DM-1:h.pcp']},
    {k:'psy',label:'Psychiatrist / therapist',al:'psychiatrist|psychologist|therapist|counselor',kind:'text',to:['DM-1:h.psy']},
    {k:'cond',label:'Medical conditions',al:'medical (?:conditions?|history|diagnos[ei]s|concerns)|health (?:conditions?|concerns)|diagnos[ei]s|conditions?',kind:'text',to:['DM-1:h.cond']},
    {k:'vh',label:'Vision / hearing',al:'vision/hearing|vision / hearing|vision and hearing|vision(?: screening)?|hearing(?: screening)?',kind:'text',to:['DM-1:h.vh']},
    {k:'strengths',label:'Strengths',al:'strengths?',kind:'text',to:['DM-1:pf.strengths']},
    {k:'interests',label:'Interests',al:'interests?|preferred activities|likes',kind:'text',to:['DM-1:pf.interests']},
    {k:'bcba',label:'BCBA',al:'case bcba|bcba name|behavior analyst|bcba',kind:'text',to:['bar:bcba']},
    {k:'holder',label:'Rights held by',al:'educational rights(?: held by| holder)?|rights (?:held by|holder)|parental rights',kind:'holder',to:['DM-1:r.holder']},
    /* labels read so that their values are not taken for another field's; nothing is placed from them */
    {k:'skip',label:'',al:'former or maiden(?: name)?|maiden name|suffix|location of birth|country of birth|birth date verification|date entered united(?: states)?(?: school)?|resident status|residence county|proof of residence|has custody alert|custody alert|first custody contact|second custody contact|parent/guardian(?: name)?|parent / guardian(?: name)?|parent name|guardian name|mother(?:\'s|\u2019s)? name|father(?:\'s|\u2019s)? name|mother|father|guardian|parent|emergency contact|contact name|contact|phone(?: number)?|telephone|cell|email|address|zip|city|case manager|nurse|examiner|evaluator|author|prepared by|signature|date|age|relationship|former or maiden name|maiden name|former name|suffix|original enter grade|enter grade|entry grade|military family student|grandmother|grandfather|aunt|uncle|sibling|brother|sister|stepmother|stepfather|custody contact|custody alert|resident status|residence county|location of birth|country of birth|security pin|student pin|marital status|survey date',kind:'skip',to:[]}
  ];
  const BY={};F.forEach(f=>{BY[f.k]=f;});
  /* every alias, longest first, so that "student id number" wins over "student id" and "student"; a space is any run of
     spaces; the match ends at a word's end */
  const topSplit=al=>{const out=[];let d=0,cur='';for(const c of al){if(c==='(')d++;else if(c===')')d--;if(c==='|'&&!d){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
  const alts=[];F.forEach(f=>topSplit(f.al).forEach(a=>alts.push({a,k:f.k,re:new RegExp('^(?:'+a.replace(/ /g,'[ \\t]+')+')$','i')})));
  alts.sort((x,y)=>y.a.length-x.a.length);
  const LBL=new RegExp('(^|[\\s(\\[\\u2022\\u00b7*|,;?\\u2013\\u2014\\u201c\\u201d"-])('+alts.map(x=>x.a.replace(/ /g,'[ \\t]+')).join('|')+')(?![a-z0-9])([ \\t]*[:\\uff1a=;][ \\t]*|[ \\t]*[\\-\\u2013\\u2014][ \\t]+|[ \\t]{2,}|[ \\t]+|$)','ig');
  const keyOf=s=>{const t=s.replace(/\s+/g,' ');for(const x of alts){if(x.re.test(t))return x.k;}return 'skip';};
  const STRICT={date:/^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\.? \d{1,2},? \d{4})/,grade:/^(\d{1,2}(?:st|nd|rd|th)?|k|kg|pk|pre-?k|kindergarten)(?![a-z0-9])/i,
    id:/^[A-Z]?\d[\dA-Z\-]{3,}$/i,sex:/^(m|f|male|female|boy|girl)$/i,yesno:/^(y|yes|n|no|x)$/i,matrix:/^25[1-5]$/,
    name:/^(?!.*\b(?:Information|Record|Report|Profile|Data|Form|Summary|Plan|Services|Details|Demographics|Sheet|Name|Number|ID|Date|School|Grade|Services|Support|Team|Meeting|Review)\b)([A-Z][A-Za-z'\u2019\-]+,\s*[A-Z][A-Za-z'\u2019\-]+|[A-Z][a-z'\u2019\-]+(?:\s+[A-Z]\.?)?\s+[A-Z][A-Za-z'\u2019\-]+)$/,
    school:/^[A-Z][\w.&'\u2019 \-]{2,60}\b(School|Academy|Center|Centre|Elementary|Middle|High|Campus|Prep|Institute)\b/,ell:/^(ly|lf|lz|zz|ln|lp)$/i};
  const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>{y=+y;m=+m;d=+d;if(!(m>=1&&m<=12&&d>=1&&d<=31&&y>=1900&&y<=2100))return '';return y+'-'+pad(m)+'-'+pad(d);};
  const year2=y=>{if(String(y).length===4)return +y;const yy=+y,now=new Date().getFullYear()%100;return (yy<=now?2000:1900)+yy;};
  function toISO(s){
    s=String(s||'');let m;
    if((m=s.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/)))return iso(m[1],m[2],m[3]);
    if((m=s.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)))return iso(year2(m[3]),m[1],m[2]);
    if((m=s.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/))&&MON[m[1].slice(0,3).toLowerCase()])return iso(m[3],MON[m[1].slice(0,3).toLowerCase()],m[2]);
    if((m=s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/))&&MON[m[2].slice(0,3).toLowerCase()])return iso(m[3],MON[m[2].slice(0,3).toLowerCase()],m[1]);
    return '';
  }
  function grade(v){const s=String(v||'').trim().toLowerCase();let m;
    if(/^(pre-?k|pk|vpk|prek|pre-?kindergarten)/.test(s))return 'PK';
    if(/^(k|kg|kindergarten|kinder)(?![a-z])/.test(s))return 'K';
    if(/transition|18\s*[-\u2013]\s*22|post-?secondary|adult/.test(s))return 'Transition (18\u201322)';
    if(/ungraded|un-graded/.test(s))return 'Ungraded';
    if((m=s.match(/(\d{1,2})(?:st|nd|rd|th)?(?![\d\/.\-])/))){const n=+m[1];if(n>=1&&n<=12)return String(n);if(n===0)return 'K';}
    return '';}
  const first=(s,pairs,dflt)=>{const t=String(s||'').toLowerCase();for(const p of pairs){if(p[0].test(t))return p[1];}return dflt===undefined?'':dflt;};
  const SEX=[[/^\s*(m|male|boy)(?![a-z])/,'Male'],[/^\s*(f|female|girl)(?![a-z])/,'Female']];
  const YN=[[/^\s*(y|yes|x|\u2713|\u2714|true|eligible|receives?)(?![a-z])/,'Yes'],[/^\s*(n|no|none|false|not|n\/a)(?![a-z])/,'No']];
  const ELL=[[/\b(ly|active|current)\b|^\s*(y|yes)(?![a-z])/,'ELL: active'],[/\b(lf|monitor(?:ed|ing)?|former|exited)\b/,'ELL: monitored'],[/\b(lz|zz|ln|lp|no|not|none|n\/a)\b/,'Not ELL']];
  const INTERP=[[/sign|asl/,'Yes: sign'],[/written|translat/,'Yes: written translation'],[/^\s*(n|no|none|not)(?![a-z])/,'No'],[/^\s*(y|yes|needed|required|spoken)(?![a-z])|[a-z]{3,}/,'Yes: spoken']];
  const ELIG=[[/autis|\basd\b/,'Autism Spectrum Disorder'],[/intellectual|\bind\b|\bid\b|\bimh?\b/,'Intellectual Disability'],[/emotional|behaviou?ral disab|\bebd\b|\be\/?bd\b|\bed\b/,'Emotional/Behavioral Disability'],[/other health|\bohi\b/,'Other Health Impairment'],[/specific learning|learning disab|\bsld\b/,'Specific Learning Disability'],[/language impair|\bli\b/,'Language Impairment'],[/speech|\bsi\b/,'Speech Impairment'],[/developmental(?:ly)? delay|\bdd\b/,'Developmental Delay'],[/deaf|hard of hearing|hearing impair|\bdhh\b|\bhi\b/,'Deaf or Hard of Hearing'],[/dual sensory|deaf-?blind/,'Dual Sensory Impairment'],[/visual|\bvi\b|blind/,'Visual Impairment'],[/orthopedic|\boi\b/,'Orthopedic Impairment'],[/traumatic brain|\btbi\b/,'Traumatic Brain Injury']];
  const PLACE=[[/center school|ese center|special day school|separate school/,'ESE center school'],[/self-?contained|separate class|special class/,'Separate class (self-contained)'],[/resource/,'Resource'],[/general ed|gen\.? ed|regular (?:class|ed)|inclusion|mainstream|with supports?|consult/,'General education with supports'],[/hospital|homebound|home instruction/,'Hospital / homebound']];
  const DIPLOMA=[[/access|\bfaa\b|alternate|modified/,'Access Points (FAA)'],[/standard|regular|general/,'Standard diploma'],[/not yet|tbd|undetermined|to be determined/,'Not yet determined']];
  const HOLDER=[[/both parents|parents\b|shared/,'Both parents (shared)'],[/surrogate/,'Surrogate parent'],[/guardian advocate/,'Guardian advocate (F.S. 393.12)'],[/legal guardian|guardian/,'Legal guardian'],[/supported decision/,'Adult student with supported decision-making'],[/adult student|self|student/,'Adult student (18+)'],[/parent|mother|father/,'Parent (one)']];
  const SUFFIX=/^(jr|sr|ii|iii|iv|v)\.?$/i;
  const cap=s=>s===s.toUpperCase()&&/[A-Z]/.test(s)?s.toLowerCase().replace(/(^|[\s\-'\u2019])([a-z])/g,(m,a,b)=>a+b.toUpperCase()):s;
  /* "Doe, John A" or "John A. Doe" or "DOE JOHN" -> {first, last} */
  function splitName(v){
    let s=cap(String(v||'').replace(/\s+/g,' ').trim()),firstN='',lastN='';
    if(s.indexOf(',')>=0){const p=s.split(',');lastN=p[0].trim();firstN=p.slice(1).join(',').trim();}
    else{const w=s.split(' ').filter(x=>!SUFFIX.test(x));if(w.length>=2){lastN=w[w.length-1];firstN=w.slice(0,-1).join(' ');}else firstN=s;}
    firstN=firstN.split(' ').filter(x=>!SUFFIX.test(x)).filter((x,i)=>i===0||!/^[A-Z]\.?$/.test(x)).join(' ');   /* the middle initial stays off the first name */
    /* a legal name lists every given name ("Rivera, Mateo Josue"): the first goes to the bar, all of them to Form DM-1 */
    const given=firstN.split(' ')[0]||'';
    return {first:firstN,last:lastN,given,full:(given+' '+lastN).trim()};
  }
  /* a text value ends at a gap or at an unknown label ("Phone:") */
  const cutText=v=>String(v||'').split(/[ \t]{2,}/)[0].replace(/\s+[A-Z][A-Za-z\/ ]{0,24}:\s.*$/,'').replace(/[\s,;:\-\u2013]+$/,'').trim();
  function shape(f,raw){
    const v=String(raw||'').trim();
    switch(f.kind){
      case 'date':{const d=toISO(v);return d?{value:d,ok:true}:{value:v,ok:false,note:'not read as a date'};}
      case 'grade':{const g=grade(v);return g?{value:g,ok:true}:{value:v,ok:false,note:'not one of the grades'};}
      case 'sex':{const s=first(v,SEX);return s?{value:s,ok:true}:{value:v,ok:false,note:'not Male or Female'};}
      case 'yesno':{const s=first(v,YN);return s?{value:s,ok:true}:{value:'',ok:false};}   /* v22.30 not answered: nothing (a side menu's "504 Info") */
      case 'ell':{const s=first(v,ELL);return s?{value:s,ok:true}:{value:v,ok:false,note:'not an ELL status'};}
      case 'interp':{const s=first(v,INTERP);return s?{value:s,ok:true}:{value:v,ok:false,note:'not one of the choices'};}
      case 'elig':{const s=first(v,ELIG);return s?{value:s,ok:true}:{value:v,ok:false,note:'not one of the eligibilities'};}
      case 'place':{const s=first(v,PLACE);return s?{value:s,ok:true}:{value:'',ok:false};}   /* v22.30 a heading under the label ("Removal from Programs ...") is not a placement */
      case 'diploma':{const s=first(v,DIPLOMA);return s?{value:s,ok:true}:{value:'',ok:false};}
      case 'holder':{const s=first(v,HOLDER);return s?{value:s,ok:true}:{value:v,ok:false,note:'not one of the choices'};}
      case 'matrix':{const m=v.match(/\b(25[1-5])\b/);return m?{value:m[1],ok:true}:{value:v,ok:false,note:'not 251 to 255'};}
      case 'id':{const s=cutText(v).replace(/^[#:\s]+/,'').split(/\s+/)[0]||'';return s?{value:s,ok:/\d/.test(s)}:{value:'',ok:false};}
      case 'eth':{const q=v.match(/^(hispanic or latino|white|black or african american|asian|american indian or alaska native|native hawaiian or other pacific islander)\s+(yes|no)(?![a-z])/i);
        if(q)return q[2].toLowerCase()==='yes'?{value:q[1],ok:true}:{value:'',ok:false};   /* "Race: White  No" is a question answered No: nothing to place */
        const s=cutText(v).slice(0,120);return {value:s,ok:!!s};}
      case 'name':{const s=cutText(v);const n=splitName(s);return n.last?{value:n.full,ok:true,first:n.first,last:n.last,given:n.given}:{value:s,ok:!!s,note:'one name only',first:n.first,last:'',given:n.given};}
      default:{const s=cutText(v).slice(0,300);if(/^(?:yes|no)(?:\s+(?:yes|no))+$/i.test(s))return {value:'',ok:false};   /* v22.30 a choice not ticked in the text ("Yes  No") */
        return {value:s,ok:!!s};}
    }
  }
  /* the labels on a line, each with what follows it; a label with no separator counts only with a value of its shape,
     and a label standing at the end of a line only at the line's start or after a gap */
  function hits(line){
    const out=[];LBL.lastIndex=0;let m;
    while((m=LBL.exec(line))){
      const k=keyOf(m[2]),sep=m[3]||'',start=m.index+m[1].length,end=m.index+m[0].length;
      const type=/[:\uff1a=;\-\u2013\u2014]/.test(sep)?'colon':sep.length>=2?'gap':sep.length===1?'one':'eol';
      out.push({k,start,end,type,text:m[2],str:type==='colon'?3:type==='one'?1:2});
      LBL.lastIndex=start+m[2].length;   /* the search goes on from the label's end: its separator may be the next label's boundary */
    }
    return out;
  }
  function valid(h,line,next){
    const f=BY[h.k],before=line.slice(0,h.start);
    /* a label with a colon counts anywhere; one followed by a gap or ending the line only where it stands on its own
       (the line's start, after a gap, after a bullet or a bracket), so "Royal Palm School  Student Information" has no
       label in it; one followed by a single space only with a value of its shape */
    const alone=h.start===0||/[ \t]{2,}$/.test(before)||/[(\[\u2022\u00b7*|,;?]\s*$/.test(before)||/^[ \t]*[\u2022\u00b7*?\-\u2013]\s*$/.test(before);
    if(h.type==='colon')return true;
    if(h.type==='gap'||h.type==='eol')return alone;
    const re=STRICT[f&&f.kind];if(!re)return false;
    return re.test(next);
  }
  /* v22.30 what a screenshot of a student information system adds to its lines: the info and arrow icons read as
     "\u00a9", "\u00ae", "\u00a5" and the like, the "?" help marks between a label and the next, a quotation mark for a required
     field's asterisk, and the page's side menu ("Child Safety", "504 Info", ...) read at the head of the lines beside it */
  const JUNK=/[\u00a9\u00ae\u20ac\u00a3\u00a5\u00a2\u00a7\u2122]/g;
  const SIDE=/^(?:\[\s*[A-Za-z0-9]{1,3}\s*[\]|]\s*|[A-Z]{1,3}\s+)?(?:primary info|child safety|504 info|aice summary|academic history|addresses (?:&|and) contacts|adult ed|alternative ed|applicant|athletics|behavior|career academies|choice options|classified|comments log|dop|demographics|ese|esol|elementary report card|enrollment|fees and fines|form responses|filter fields\.*)(?=[ \t]{2,}|$)/i;
  function lines(text){
    let L=String(text||'').replace(/\r/g,'').replace(/\t/g,'  ').replace(/[|\u2502]/g,'  ').replace(/[\u00a0]/g,' ').replace(JUNK,'  ').split('\n')
      .map(l=>l.replace(/[\u201c\u201d"](?=[A-Za-z])/g,'').replace(/(^|[ \t]{2,})\?(?=[ \t]{2,}|$)/g,'$1').replace(/[ \t]+$/,'').replace(/^[ \t]*[\u2022\u00b7*?]\s*/,''));
    if(L.filter(l=>SIDE.test(l.trim())).length>=4)L=L.map(l=>l.trim().replace(SIDE,'').replace(/^[ \t]*[\u2022\u00b7*?]\s*/,''));
    return L;
  }
  function parse(text,cols){
    const L=lines(text),found={},order=[],used=new Set();
    /* v22.25 an Edit Contact dialog's First Name, Last Name and Language are the contact's, not the student's: the
       student's details are read only from above it */
    const dlg=L.findIndex(l=>/^\s*(?:edit|add|new) contact\b(?:\s*:?\s*$|\s+you\b)/i.test(l));
    /* v22.27 nor from a Schedule's or an Enrollment's table (its headings are labels, its cells not the student's details) */
    const en=enrollment(L),sc=schedule(L),bp=bacbSup(L),end=bp?0:Math.min(dlg<0?L.length:dlg,en?en.at:L.length,sc?sc.at:L.length);
    for(let i=0;i<end;i++){
      const line=L[i];if(!line.trim())continue;
      const hs=hits(line).filter(h=>{const rest=line.slice(h.end,(hits(line).find(x=>x.start>h.end)||{start:line.length}).start).trim();return valid(h,line,rest);});
      for(let j=0;j<hs.length;j++){
        const h=hs[j],nextStart=j+1<hs.length?hs[j+1].start:line.length;
        let raw=line.slice(h.end,nextStart).trim(),seen=line.trim(),from=i;
        const f=BY[h.k];
        if(!raw&&f&&f.kind!=='skip'&&(h.type==='colon'||h.type==='eol')&&i+1<L.length){
          /* the value on the next line (a table's label above its value): a short line with no label and no colon of its own (an
             empty field followed by the next field is not a value), of the field's shape where it has one */
          const n=L[i+1].trim(),re=STRICT[f.kind];
          if(n&&n.length<=80&&!/[:\uff1a=]/.test(n)&&!hits(L[i+1]).some(x=>valid(x,L[i+1],L[i+1].slice(x.end).trim()))&&(!re||re.test(n))){raw=n;seen=line.trim()+' / '+n;from=i+1;used.add(i+1);}
        }
        if(h.k==='skip'||!raw)continue;
        const sh=shape(f,raw);if(!sh.value)continue;
        const cur=found[h.k];
        if(cur&&(cur.ok||!sh.ok)&&cur.str>=h.str)continue;   /* the first reading stands, unless a later one has a surer label (a colon), or the first was not of the field's shape and this one is */
        if(!cur)order.push(h.k);
        found[h.k]=Object.assign({k:f.k,label:f.label,to:f.to.slice(),raw,seen:seen.slice(0,160),line:from,str:h.str},sh);
      }
    }
    /* a first or last name read on its own wins over the split of the whole name */
    if(found.name){if(found.first){found.name.first=found.first.value;found.name.to=found.name.to.filter(t=>t!=='DM-1:s.first');}if(found.last){found.name.last=found.last.value;found.name.to=found.name.to.filter(t=>t!=='DM-1:s.last');}
      found.name.value=(((found.first?found.first.value:(found.name.given||found.name.first))||'')+' '+(found.name.last||'')).trim();}
    else if(found.first||found.last){const full=((found.first||{}).value||'')+' '+((found.last||{}).value||'');found.name={k:'name',label:'Student',to:['bar:client'],value:full.trim(),raw:full.trim(),seen:((found.first||found.last).seen),ok:true,first:(found.first||{}).value||'',last:(found.last||{}).value||''};order.unshift('name');}
    /* v22.25 a page with no labels for them still names its student in the system's badge ("Rivera, Mateo" over "4471823 - 03") */
    const bd=badge(L);
    if(bd&&!found.name){const n=splitName(bd.name);found.name={k:'name',label:'Student',to:BY.name.to.slice(),value:n.full,raw:bd.name,seen:bd.name+' / '+L[bd.idLine].trim(),line:bd.line,str:1,ok:true,first:n.first,last:n.last,given:n.given};order.unshift('name');}
    if(bd&&!found.sid){found.sid={k:'sid',label:'Student ID',to:BY.sid.to.slice(),value:bd.sid,raw:bd.sid,seen:L[bd.idLine].trim(),line:bd.idLine,str:1,ok:true};order.splice(order.indexOf('name')+1,0,'sid');}
    /* v22.27 the Enrollment and Schedule pages: the school now, its grade and date, the schools before; the homeroom */
    const add=(k,value,raw,seen)=>{if(found[k]||!value)return;const f=BY[k],sh=shape(f,raw);if(!sh.value)return;found[k]=Object.assign({k,label:f.label,to:f.to.slice(),raw,seen:String(seen||'').slice(0,160),str:1},sh);order.push(k);};
    if(en&&en.now){add('school',en.now.school,en.now.school,en.seen);add('grade',en.now.grade,en.now.grade,en.seen);add('enroll',en.now.from,en.now.from,en.seen);}
    if(en&&en.prior){add('prior',en.prior,en.prior,'Enrollment: '+en.n+(en.n===1?' school':' schools')+' before');if(found.prior)found.prior.value=en.prior.slice(0,300);}
    if(sc&&sc.room)add('room',sc.room,sc.room,'Schedule: the homeroom');
    if(bd&&bd.grade&&!found.grade)add('grade',bd.grade,bd.grade,L[bd.idLine].trim());
    /* v22.30 race and ethnicity asked one question each ("Ethnicity: Hispanic or Latino  No", "Race: White  Yes"), or the
       one code ("Single Ethnicity  W - White"): the races answered Yes, and whether Hispanic or Latino */
    {const RC=[[/^hispanic/,'H'],[/^white/,'White'],[/^black/,'Black or African American'],[/^asian/,'Asian'],[/^american indian/,'American Indian or Alaska Native'],[/^native hawaiian/,'Native Hawaiian or Other Pacific Islander']];
      const yes=[],seen=[];let hisp='';
      for(let i=0;i<end;i++){const re=/\b(?:ethnicity|race)\s*:\s*([A-Za-z][A-Za-z ,]*?)[ ,]*[ \t]+(yes|ves|yos|no|n0)(?![a-z])/gi;let m;
        while((m=re.exec(L[i]))){const w=m[1].toLowerCase().trim(),a=/^y|^v/i.test(m[2]),r=RC.find(x=>x[0].test(w));if(!r)continue;seen.push(m[0].trim());
          if(r[1]==='H')hisp=a?'yes':'no';else if(a&&!yes.includes(r[1]))yes.push(r[1]);}}
      let v='';
      if(yes.length||hisp)v=yes.join(', ')+(hisp==='yes'?(yes.length?'; ':'')+'Hispanic or Latino':hisp==='no'&&yes.length?'; not Hispanic or Latino':'');
      if(!v){const sl=L.slice(0,end).map(l=>l.match(/single ethnicity[ \t]+(?:[A-Z][ \t]*)?[-\u2013][ \t]*([A-Za-z][A-Za-z ]{2,40}?)(?:[ \t]{2,}|$)/i)).find(Boolean);if(sl){v=cap(sl[1].trim().replace(/\b[a-z]/g,c=>c.toUpperCase()));seen.push(sl[0].trim());}}
      if(v){if(!found.eth)order.push('eth');found.eth={k:'eth',label:BY.eth.label,to:BY.eth.to.slice(),raw:v,value:v,seen:seen.join(' / ').slice(0,160),str:3,ok:true};}}
    /* v22.30 an IEP's sentences (Florida's, as a district's IEP system prints them): the next annual review and
       reevaluation, the eligibilities, where the services are received, ESY, a standard diploma deferred, the bus needs */
    {const T=L.slice(0,end).join('\n'),D='(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})',g=(re)=>{const m=T.match(re);return m;};let m;
      const put=(k,v,seen,force)=>{if(!v)return;const f=BY[k],sh=shape(f,v);if(!sh.value)return;if(found[k]&&!force)return;if(!found[k])order.push(k);found[k]=Object.assign({k,label:f.label,to:f.to.slice(),raw:v,seen:String(seen).replace(/\s+/g,' ').slice(0,160),str:3},sh);};
      if((m=g(new RegExp('next required annual review[^:\\n]{0,40}:\\s*'+D,'i'))))put('annual',m[1],m[0],true);
      if((m=g(new RegExp('next scheduled re-?evaluation[^:\\n]{0,40}:\\s*'+D,'i'))))put('reeval',m[1],m[0],true);
      if((m=g(/program eligibilit(?:y|ies)(?:\(ies\))?\s*:\s*([^\n]+)/i))){const e=m[1].split(/\s*[,;]\s*/).map(x=>x.trim()).filter(Boolean);put('elig',e[0],m[0],true);if(e.length>1)put('elig2',e.slice(1).join(', '),m[0],true);}
      if((m=g(/receives his\/her educational services in an?\s*:?\s*([^\n]+)/i)))put('place',m[1],m[0],true);
      if((m=g(/this student is (not )?in need of extended school year services/i)))put('esy',m[1]?'No':'Yes',m[0],true);
      if((m=g(/deferring receipt of a standard high school diploma[^\n]*?\b(yes|no)\b/i))&&/yes/i.test(m[1]))put('diploma','Standard',m[0]+' (deferred)',true);
      if((m=g(/specific "?transportation needs"? include:?\s*\n((?:\s*[\u25aa\u2022\u25cf\-*][^\n]+\n?){1,8})/i))){const b=m[1].split('\n').map(x=>x.replace(/^\s*[\u25aa\u2022\u25cf\-*]\s*/,'').trim()).filter(Boolean);put('trans','Yes: '+b.join('; '),'Specific Transportation Needs: '+b.join('; '),true);}}
    const fields=order.map(k=>found[k]);
    if(bp)return {fields:[],behaviors:[],lines:L.length,contacts:[],student:null,team:[],dropped:0,rbts:bp.rbts,rbtsPast:bp.past};   /* a supervisor's page: no student on it */
    return {fields,behaviors:behaviors(L.slice(0,end)),lines:L.length,contacts:contacts(cols||text,text),student:bd,team:sc?sc.team:[],dropped:sc?sc.dropped:0};
  }
  /* target behaviors in a plan: "Target behavior 1: Aggression", "Behavior: Hitting – any instance of ...", a
     Definition line after; a replacement behavior keeps its kind */
  function behaviors(L){
    const out=[],seen=new Set();
    for(let i=0;i<L.length;i++){
      const line=L[i].trim();
      const m=line.match(/^(?:(target|problem|challenging|interfering|replacement|alternative|desired)\s+)?behaviou?rs?\s*(?:#\s*)?(?:\d{1,2})?\s*[:\uff1a\-\u2013\u2014]\s*(.+)$/i);
      if(!m)continue;
      const isRep=/replacement|alternative|desired/i.test(m[1]||'');
      let label=m[2].trim(),def='';
      const dm=label.match(/^(.{2,60}?)\s*(?:[:\uff1a]|\s[\-\u2013\u2014]\s|\(|\bis defined as\b|\bdefined as\b|\bmeans\b|\bis any\b)\s*(.{10,})$/i);
      if(dm){label=dm[1].trim();def=dm[2].replace(/^(?:as|that)\s+/i,'').replace(/\)$/,'').trim();}
      for(let j=i+1;j<L.length&&j<=i+3;j++){
        const n=L[j].trim();if(!n)continue;
        const d2=n.match(/^(?:operational\s+)?definition\s*[:\uff1a\-\u2013\u2014]\s*(.+)$/i);
        if(d2){def=def||d2[1].trim();break;}
        if(/^(?:(?:target|problem|replacement|alternative|desired)\s+)?behaviou?r/i.test(n)||hits(L[j]).some(h=>h.start===0&&h.type==='colon'))break;
        if(!def&&n.length>=30&&(new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(n)||/^(any|defined|occurs|includes|instances?|each)/i.test(n))){def=n;break;}
      }
      label=label.replace(/[\s.;:,\-\u2013]+$/,'');
      if(label.length<2||label.length>80||!/[a-z]/i.test(label)||/^(yes|no|none|n\/?a|current|active|see|n|y)$/i.test(label))continue;
      const key=label.toLowerCase();if(seen.has(key))continue;seen.add(key);
      out.push({label,def:def.slice(0,600),isRep,src:'document'});
    }
    return out;
  }
  /* v22.25 the student's contacts, as a student information system lists them: cards headed "Address" (the student's
     addresses, each with its "Contacts at this Address": "#1 - Last, First") and "Contact #3" (a name, "(No Address)"
     or an address, a phone table, the relationship at the card's foot), or the Edit Contact dialog (First Name, Last
     Name, Relationship, Email, a Type / Number table of phones). The cards are read one after the other: a picture's
     words are put back into their cards by where they stand (drCardsOfOcr), pasted text comes card after card. Each
     contact: {n,name,rel,relRaw,phone,phone2,email,addr,lang,note,seen}; the relationship is put in Form DM-1's words,
     the record's own word kept in the note when DM-1 words it otherwise ("Listed as Cousin"). */
  const RELS=[[/step[\s\-]?(?:mother|father|parent|mom|dad)/,'Stepparent'],[/guardian advocate/,'Guardian advocate'],[/grand|abuel/,'Grandparent'],
    [/foster/,'Foster parent'],[/surrogate/,'Surrogate parent'],[/legal guardian|^guardian$/,'Legal guardian'],
    [/^(?:(?:biological|birth|adoptive) )?(?:mother|mom|madre)$/,'Mother'],[/^(?:(?:biological|birth|adoptive) )?(?:father|dad|padre)$/,'Father'],
    [/god ?(?:mother|father|parent)|padrino|madrina|friend|neighbou?r/,'Family friend'],[/brother|sister|sibling/,'Adult sibling'],
    [/aunt|uncle|cousin|niece|nephew|relative|in-law|\bt[ií][ao]\b|\bprim[ao]\b/,'Other relative'],
    [/case ?manager|case ?worker|\bdcf\b|social worker|agency/,'Case manager (agency)'],[/group home|residential|facility/,'Other'],
    [/\baide\b|nanny|baby-?sitter|\bsitter\b|care ?giver|day ?care|provider|\bnurse\b|^other$/,'Other']];
  const RELWORD=/^(?:parent|parent\/guardian|guardian)$/;
  /* a relationship as the record words it ("Grandmother", "Home Health Aide"): a short line of words */
  /* v22.30 the icons after a name or a relationship ("Aunt  \u2709 \u26a0", read as "= /\\ &" or "=X A &&"), and a lone mark
     inside a name ("Ortiz, :  Carmen") */
  const deIcon=s=>String(s||'').replace(/(^|\s)[^\w\s(),'\u2019.\-]{1,3}(?=\s|$)/g,'$1').replace(/(?:\s+(?:\S*[^A-Za-z\s'\u2019.,)]\S*|[A-Za-z]|[a-z]{2,3}))+\s*$/,'').replace(/\s+/g,' ').trim();
  const relOf=s=>{s=deIcon(String(s||'').split(/[ \t]{2,}/)[0].replace(/\s*[-\u2013\u2014:]\s*\d.*$/,''));const t=s.toLowerCase().replace(/\s+/g,' ').trim();if(!t||t.length>32||!/^[a-záéíóúñ '\/\-]+$/.test(t))return null;
    for(const r of RELS){if(r[0].test(t))return {rel:r[1],raw:cap(String(s).trim())};}return RELWORD.test(t)?{rel:'',raw:cap(String(s).trim())}:null;};
  const PH=/\(?\b(\d{3})\)?[\s.\-]{0,3}(\d{3})[\s.\-]{0,3}(\d{4})\b/g;
  const phone=m=>'('+m[1]+') '+m[2]+'-'+m[3];
  const NAMEC=/^([A-Z][A-Za-z'’\-]+(?: [A-Z][A-Za-z'’\-]+)?)\s*,\s*([A-Z][A-Za-z'’\-.]+(?: [A-Z][A-Za-z'’\-.]*){0,2})$/;
  const NAMEF=/^([A-Z][a-z'’\-]+(?: [A-Z]\.?)?(?: [A-Z][A-Za-z'’\-]+){1,2})$/;
  const STREET=/^\d+[A-Za-z]?\s+(?=.*[A-Za-z]{2})/,UNIT=/^(?:apt|apartment|unit|ste|suite|lot|bldg|building|#)\.?\s*\S+$/i,CITY=/^[A-Za-z][A-Za-z .'\-]+,\s*[A-Z]{2}\.?\s+\d{5}(?:-\d{4})?$/;
  const EMAIL=/[\w.+\-]+@[\w\-]+(?:\.[\w\-]+)+/;
  const HEAD=/^(?:contact\s*#\s*(\d{1,2})|(?:mailing |home |physical |residence )?address(?:\s*#?\s*\d)?|(edit|add|new) contact(?:\s+you\b.*)?)\s*:?$/i;
  const STOP=/^(?:linked users|no records found|demographic|enrollment|schedule|attendance|save|cancel|delete)\b/i;
  /* phones in a card's lines: a number the card's narrow cell broke after the dash ("(561) 555-" over "0170") is joined */
  function phonesIn(T){
    const t=T.slice(),out=[];
    for(let i=0;i<t.length;i++){const m=t[i].match(/\(?\b\d{3}\)?[\s.\-]{0,3}\d{3}\s*[\-.]\s*$/);if(!m)continue;
      for(let j=i+1;j<=i+4&&j<t.length;j++){const k=t[j].match(/(^|\s)(\d{4})(?=\s|$)/);if(k){t[i]=t[i].replace(/\s*$/,'')+k[2];t[j]=(t[j].slice(0,k.index)+t[j].slice(k.index+k[0].length)).trim();break;}}}
    t.forEach((l,i)=>{let m;PH.lastIndex=0;while((m=PH.exec(l))){const ty=(l+' '+(t[i+1]||'')).match(/\b(cell|mobile|home|work|business|other)\b/i);out.push({p:phone(m),type:ty?ty[1].toLowerCase():''});}});
    return out.filter((x,i,a)=>a.findIndex(y=>y.p===x.p)===i);
  }
  const PH1=/\(?\b\d{3}\)?[\s.\-]{0,3}\d{3}[\s.\-]{0,3}\d{4}\b/;
  /* an address: a street line, then its unit and its "CITY, ST 12345" line */
  const addrOf=T=>{const a=[];for(const l of T){const s=l.split(/\s{2,}/)[0].trim();
    if(!a.length){if(STREET.test(s)&&!PH1.test(s))a.push(s);continue;}
    if(UNIT.test(s)||CITY.test(s)||/^[A-Za-z][A-Za-z .'\-]+,\s*[A-Z]{2}\b/.test(s)){a.push(s);if(CITY.test(s))break;}else break;}
    return a.join(', ').replace(/\s+/g,' ');};
  /* v22.30 a contact kept under an agency's name ("Sunrise Group Home, Dana Lee"): the person, with the agency after */
  const ORG=/\b(?:center|centre|home|homes|agency|services|group|inc|llc|foundation|house|care|facility|residence)\b/i;
  const nameOf=s=>{const t=deIcon(s);if(NAMEC.test(t)||NAMEF.test(t)){const n=splitName(t);return n.last?(n.first+' '+n.last).trim():'';}
    const o=t.match(/^([A-Z][A-Za-z'\u2019&.\-]*(?: [A-Za-z'\u2019&.\-]+){1,5}),\s*([A-Z][a-z'\u2019\-]+(?: [A-Z][a-z'\u2019\-]+){1,2})$/);
    if(o&&ORG.test(o[1]))return o[2]+' ('+cap(o[1])+')';return '';};
  function contacts(text,page){
    const L=lines(text).map(l=>l.trim()),cards=[];let cur=null;
    L.forEach(l=>{const m=l.replace(/^[^A-Za-z#]+(?=contact|address)/i,'').match(HEAD);if(m){cur={head:l,n:m[1]?+m[1]:0,dlg:!!m[2],T:[]};cards.push(cur);return;}if(STOP.test(l)){cur=null;return;}if(cur&&l)cur.T.push(l);});
    const out=[];
    const put=c=>{if(!c.name)return;const same=out.find(o=>(c.n&&o.n===c.n)||o.name.toLowerCase()===c.name.toLowerCase());
      if(same){Object.keys(c).forEach(k=>{if(c[k]&&!same[k])same[k]=c[k];});return;}out.push(c);};
    cards.forEach(cd=>{
      const T=cd.T;
      if(cd.dlg){   /* the dialog: labels over their values, or a label and its value side by side */
        const V={},KEY=[[/^first name$/i,'first'],[/^last name$/i,'last'],[/^(?:contact )?name$/i,'name'],[/^relationship(?: to student)?$/i,'rel'],[/^e-?mail(?: address)?$/i,'email'],[/^(?:preferred |home )?language$/i,'lang'],[/^address$/i,'addr']];
        const keyOf2=s=>{for(const k of KEY){if(k[0].test(s.trim()))return k[1];}return /^(middle name|suffix|contact'?s? priority|priority|type|number|custody|emergency|lives with|mailing|pickup restricted)$/i.test(s.trim())?'-':'';};
        for(let i=0;i<T.length;i++){const segs=T[i].split(/\s{2,}/),ks=segs.map(keyOf2);
          if(ks.every(Boolean)&&i+1<T.length){const nx=T[i+1].split(/\s{2,}/);if(!nx.map(keyOf2).some(Boolean)){if(nx.length===segs.length)ks.forEach((k,j)=>{if(k!=='-'&&!V[k])V[k]=nx[j].trim();});else if(segs.length===1&&ks[0]!=='-'&&!V[ks[0]])V[ks[0]]=T[i+1].trim();i++;continue;}}
          segs.forEach(s=>{const m=s.match(/^([A-Za-z' \-]{3,24}):\s*(.+)$/);if(m){const k=keyOf2(m[1]);if(k&&k!=='-'&&!V[k])V[k]=m[2].trim();}});}
        if(!V.name&&!V.first&&!V.last){const PHD=/^(?:title\b.*|first name|middle name|last name|suffix|nickname)$/i;
          /* the name boxes side by side under the heading (Title, First, Middle, Last; an empty one shows its pale
             placeholder, or nothing), the panel beside them ("Options") left out */
          const SIDEW=/^(?:options|custody|emergency|pick ?up|hide contact.*|contacts?)$/i;
          for(let i=0;i<Math.min(4,T.length);i++){const sg=T[i].split(/[ \t]{2,}/).map(x=>x.trim()).filter(x=>x&&!SIDEW.test(x));
            const nm2=sg.filter(x=>!PHD.test(x));if(nm2.length<2||nm2.length>4||!nm2.every(x=>/^[A-Z][A-Za-z'\u2019.\- ]{0,40}$/.test(x)&&!/\d|@/.test(x)))continue;
            V.first=nm2[0];V.last=nm2.length>1?nm2[nm2.length-1]:'';if(nm2.length>2)V.middle=nm2.slice(1,-1).join(' ');
            if(!V.rel){let c0='';for(let j=i+1;j<Math.min(i+6,T.length);j++){const t2=T[j].split(/[ \t]{2,}/)[0].trim();if(!t2||SIDEW.test(t2)||/^e-?mail$/i.test(t2)||EMAIL.test(t2))continue;if(relOf(t2)){c0=t2;break;}if(!c0)c0=t2;}V.rel=c0;}break;}}
        if(V.last&&V.first&&(ORG.test(V.last)||(V.middle&&/\s/.test(V.last))))V.name=(V.first+(V.middle?' '+V.middle:''))+' ('+cap(V.last)+')';   /* an agency kept as the last name */
        const nm=V.name||((V.first||'')+' '+(V.last||'')).trim(),r=relOf(V.rel),ph=phonesIn(T),em=(V.email||T.join(' ')).match(EMAIL);
        put({n:0,name:nm?(NAMEC.test(nm)?nameOf(nm):nm):'',rel:r?r.rel:'',relRaw:r?r.raw:(V.rel||''),phone:(ph[0]||{}).p||'',phone2:(ph[1]||{}).p||'',email:em?em[0]:'',addr:V.addr||addrOf(T),lang:V.lang||'',seen:cd.head+': '+T.slice(0,4).join(' / ')});
        return;
      }
      if(cd.n){   /* a contact's card */
        let nm='',at=-1;for(let i=0;i<Math.min(3,T.length);i++){nm=nameOf(T[i]);if(nm){at=i;break;}}
        if(!nm)return;
        let r=null;for(let i=T.length-1;i>at;i--){r=relOf(T[i]);if(r)break;}
        const ph=phonesIn(T),em=T.join(' ').match(EMAIL),ad=/^\(?no address\)?$/i.test(T[at+1]||'')?'':addrOf(T.slice(at+1,(i=>i<0?T.length:i)(T.findIndex(l=>/^contact details/i.test(l)))));
        put({n:cd.n,name:nm,rel:r?r.rel:'',relRaw:r?r.raw:'',phone:(ph[0]||{}).p||'',phone2:(ph[1]||{}).p||'',email:em?em[0]:'',addr:ad,lang:'',seen:(cd.n>=90?'Contact card':'Contact #'+cd.n)+': '+T.slice(0,2).join(' / ')});
        return;
      }
      /* an address card: the address, its phone, and the contacts who live there */
      const k=T.findIndex(l=>/^contacts?\s+at\s+this\s+(?:[.,:;]\s+)?address/i.test(l));if(k<0)return;
      const ad=addrOf(T.slice(0,k)),ph=phonesIn(T.slice(0,k));
      for(let i=k+1;i<T.length;i++){const m=T[i].match(/^#\s*(\d{1,2})\s*[\-–—]?\s*(.+)$/);if(!m)continue;const nm=nameOf(m[2]);if(!nm)continue;   /* v22.30 the dash and the icons after the name may be read apart */
        const r=relOf(T[i+1]||'');
        put({n:+m[1],name:nm,rel:r?r.rel:'',relRaw:r?r.raw:'',phone:(ph[0]||{}).p||'',phone2:'',email:'',addr:ad,lang:'',seen:'Address card: '+T[i]});}
    });
    out.forEach(c=>{c.note=c.relRaw&&c.relRaw.toLowerCase()!==String(c.rel).toLowerCase()?'Listed as '+c.relRaw:'';});
    /* v22.30 the address of an address's own window ("Physical Address": the street, then city, state and ZIP in their
       boxes) for the contacts listed at it */
    if(page&&/physical address/i.test(page)&&/contacts? at this address/i.test(page)){const P=lines(page).map(l=>l.trim()),k=P.findIndex(l=>/^physical address/i.test(l));
      let a='';for(let i=k+1;i>0&&i<Math.min(k+8,P.length);i++){const s0=P[i].split(/[ \t]{2,}/)[0];if(STREET.test(s0)&&!PH1.test(s0)){a=s0;   /* the city, state and ZIP a line or a few below, in their own boxes or as one */
        for(let j=i+1;j<Math.min(i+6,P.length);j++){const c=P[j].split(/[ \t]{2,}/).map(x=>x.trim());
          if(c.length>=3&&/^[A-Z][A-Za-z .'\-]+$/.test(c[0])&&/^[A-Z]{2}$/.test(c[1])&&/^\d{5}/.test(c[2])){a+=', '+c[0]+', '+c[1]+' '+c[2].slice(0,5);break;}if(CITY.test(c[0])){a+=', '+c[0];break;}}break;}}
      if(a)out.forEach(c=>{if(!c.addr)c.addr=a;});}
    /* v22.30 an IEP's cover names the parent: "Parent Name: ...", "Parent Phone Number: ..." */
    if(page&&!out.length){const P=lines(page),pn=P.map(l=>l.match(/^\s*parent(?:\/guardian)?(?:'s)? name\s*:\s*(.+)$/i)).find(Boolean),pp=P.map(l=>l.match(/^\s*parent(?:\/guardian)?(?:'s)? (?:phone|telephone)(?: number)?\s*:\s*(.+)$/i)).find(Boolean);
      if(pn){const all=pn[1]+' '+(pp?pp[1]:''),nm0=pn[1].split(/\s+parent(?:\/guardian)?(?:'s)?\s+(?:phone|telephone|e-?mail|address|cell)\b/i)[0].trim(),nm=nameOf(nm0)||nm0;
        const pt=(all.match(/parent(?:\/guardian)?(?:'s)?\s+(?:phone|telephone)(?: number)?\s*:\s*([\d()\-. ]{10,16})/i)||[])[1]||(pp?pp[1]:''),d=String(pt).replace(/\D/g,''),em=all.match(EMAIL);
        if(nm&&nm.length<=60)out.push({n:0,name:nm,rel:'',relRaw:'Parent',phone:d.length===10?'('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6):'',phone2:'',email:em?em[0]:'',addr:'',lang:'',seen:pn[0].trim().slice(0,160),note:'Listed as Parent'});}}
    out.forEach(c=>{if(c.n>=90)c.n=0;});
    return out.sort((a,b)=>(a.n||99)-(b.n||99));
  }
  /* v22.30 the BACB portal's Supervision page: the supervisor's RBTs, "Current" (name, certification number, the
     supervisee's credential, a requirements coordinator, the date supervision started, status) and "History" (left out).
     -> {rbts:[{name,cert,cred,rc,from,status}], past} or null */
  function bacbSup(L){
    const h=L.findIndex(l=>/supervisee name/i.test(l)&&/certification number/i.test(l));if(h<0)return null;
    const rbts=[];let past=0,inHist=false;
    for(let i=h+1;i<L.length&&i<h+80;i++){const l=L[i].trim();if(/^history\b/i.test(l)){inHist=true;continue;}
      const m=l.match(/^(?:[^A-Za-z]*\s)?([A-Z][A-Za-z'\u2019.\-]+(?:\s[A-Z][A-Za-z'\u2019.\-]+){0,3}),?\s{2,}((?:RBT|BCaBA|BCBA)\s*-\s*\d{2}\s*-\s*\d{3,7}|\d-\d{2}-\d{4,6})\s{2,}(RBT|BCaBA|BCBA)\b(.*)$/);
      if(!m)continue;if(inHist){past++;continue;}
      const rest=m[4],dt=rest.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/),st=rest.match(/\b(active|inactive|pending)\b/i),rc=rest.trim().split(/\s{2,}/);
      rbts.push({name:m[1],cert:m[2].replace(/\s+/g,''),cred:m[3],rc:rc[1]&&!/^n\/?a$/i.test(rc[1])?rc[1]:'',from:dt?toISO(dt[1]):'',status:st?cap(st[1].toLowerCase()).replace(/^./,c=>c.toUpperCase()):'',seen:l.slice(0,160)});}
    return rbts.length?{rbts,past}:null;}
  /* the student the page belongs to, from the student information system's badge: "Rivera, Mateo" over "4471823 - 03" */
  /* v22.30 the badge's close button read as "x" before the name and its menu arrow as "v" after; its ID a line or three
     below, past the page title and the photo */
  function badge(L){for(let i=0;i<Math.min(10,L.length-1);i++){const a=L[i].split(/\s{2,}/).map(x=>x.replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g,'').replace(/^[xX]\s+/,'').replace(/\s+[vV]$/,'').trim()).find(x=>NAMEC.test(x));if(!a)continue;
    for(let j=i+1;j<=i+4&&j<L.length;j++){const b=L[j].split(/\s{2,}/).map(x=>x.trim().replace(/^[A-Za-z]{1,3}\s+(?=\d)/,'')).find(x=>/^\d{5,10}\s*[-–]\s*(?:\d{1,2}|KG|PK)\b/.test(x));
      if(b){const m=b.match(/^(\d{5,10})\s*[-–]\s*(\d{1,2}|KG|PK)\b/);return {name:a,sid:m[1],grade:m[2],line:i,idLine:j};}}}return null;}
  /* v22.27 a student information system's Schedule page: each class's row (Period, Term, Subject, Course, "Section -
     Teacher (seats)", Days, Room, Enrolled, Dropped). A class dropped is left out. The teachers become Form DM-1's team:
     the homeroom teacher the classroom teacher (with the classes they teach and the room), a therapy's teacher its
     provider (language or speech therapy: the speech-language pathologist, also on the Related Services row), the other
     teachers by their class (art, PE, music: Other). -> {team:[{name,role,inv,svc,svcFreq}], room} */
  const TEACH=/\b[A-Za-z0-9]{2,6}\s*[-–]\s*([A-Z][A-Za-z'’.\-]+(?:\s+[A-Z][A-Za-z'’.\-]+){1,3})\s*\(\s*\d+\s*\/\s*\d+\s*\)/;
  const DAYN={M:'Mon',T:'Tue',W:'Wed',H:'Thu',R:'Thu',F:'Fri'};
  const days=d=>d==='MTWHF'||d==='MTWRF'?'daily':d.split('').map(c=>DAYN[c]).filter(Boolean).join(', ');
  const KIND=[[/thrpy|therapy|speech|\blang(?:uage)?\b.*\bth/i,'Speech-language pathologist',0,'speech-language therapy'],[/occupational|\bot\b/i,'Occupational therapist',1,'occupational therapy'],[/physical th|\bpt\b/i,'Physical therapist',2,'physical therapy'],
    [/counsel/i,'School counselor / social worker',3,'counseling'],[/homeroom/i,'Classroom teacher',-1,'homeroom']];
  const tcase=s=>s.replace(/[A-Za-z]+/g,w=>w.length<=2?w.toUpperCase():w[0].toUpperCase()+w.slice(1).toLowerCase());
  const courseName=s=>tcase(String(s||'').replace(/\s*\([0-9A-Z]{4,}\)?.*$/,'').replace(/[….]+$/,'').replace(/\s+[vV~=@]+$/,'').trim());
  function schedule(L){
    const h=L.findIndex(l=>/\bperiod\b/i.test(l)&&/\bcourse\b/i.test(l));if(h<0)return null;
    const rows=[];
    for(let i=h+1;i<L.length&&i<h+60;i++){const l=L[i].replace(/[▼▾@]/g,'  ').replace(/'?\u00a5\|?/g,'  ').replace(/\[(?=[A-Za-z])/g,'  ').replace(/[\[\]]/g,'  ');const m=l.match(TEACH);if(!m)continue;
      const before=l.slice(0,m.index),after=l.slice(m.index+m[0].length);
      const segs=before.split(/\s{2,}/).map(x=>x.replace(/(?:\s*[vV~=@|]+)+$/,'').replace(/^[\[\]\s|1Il]+(?=[A-Z])/,'').replace(/^[A-Z]{1,2}\s+(?=(?:period|homeroom|therapy)\b)/i,'').trim()).filter(x=>x&&!/^[\[\]|1Il]+$/.test(x)&&!/^[=~\-_|.,:;—–]+$/.test(x)&&(x.match(/[A-Za-z]/g)||[]).length>=3);
      const course=courseName(segs.length?segs[segs.length-1].replace(/^.*?\b(?:Grade|Courses)\s*[vV]?\s+(?=[A-Z])/,''):''),period=(segs[0]||'').replace(/[vV]+$/,'').trim();
      const dm=after.match(/(?:^|\s)([MTWHFR]{1,6})[vV]?(?=\s|$)/),rm=after.match(/\b(\d{4,5}[A-Z]{0,2})\b/),
        span=rm?after.slice(rm.index+rm[0].length).split(/[A-Za-z]/)[0]:'',dt=span.match(/\d{1,2}\/\d{1,2}\/\d{4}/g)||[];
      rows.push({teacher:cap(m[1]),course,period,days:dm?dm[1]:'',room:rm?rm[1]:'',from:dt[0]||'',dropped:dt[1]||'',seen:l.trim().slice(0,160)});}
    if(!rows.length)return null;
    const live=rows.filter(r=>!r.dropped),byT=[];
    live.forEach(r=>{let t=byT.find(x=>x.name===r.teacher);if(!t){t={name:r.teacher,rows:[]};byT.push(t);}t.rows.push(r);});
    const team=byT.map(t=>{
      const all=t.rows.map(r=>r.course+' '+r.period).join(' ');let kind=null;for(const k of KIND){if(k[0].test(all)){kind=k;break;}}
      const home=t.rows.find(r=>/homeroom|\bhmrm\b|\d{4}hmrm/i.test(r.period+' '+r.course+' '+r.seen)),rooms=[...new Set(t.rows.map(r=>r.room).filter(Boolean))];
      const what=[...new Set(t.rows.map(r=>/homeroom/i.test(r.course)?'Homeroom':r.course).filter(Boolean))].join(', ');
      const dd=[...new Set(t.rows.map(r=>days(r.days)).filter(Boolean))].join('; '),since=t.rows.map(r=>r.from).filter(Boolean).sort((a,b)=>toISO(a)<toISO(b)?-1:1)[0]||'';
      const now=new Date(),today=iso(now.getFullYear(),now.getMonth()+1,now.getDate());   /* the local date, not the world clock's */
      const sinceTxt=since&&toISO(since)>today?', from '+since:since?', since '+since:'';
      return {name:t.name,role:home?'Classroom teacher':kind?kind[1]:'Other',inv:(what+(dd?', '+dd:'')+(rooms.length?', room '+rooms.join(', '):'')+sinceTxt).slice(0,200),
        svc:kind&&kind[2]>=0?kind[2]:-1,svcFreq:kind&&kind[2]>=0?(dd==='daily'?'Daily':dd?'Weekly ('+dd+')':''):'',seen:'Schedule: '+t.rows.length+(t.rows.length===1?' class':' classes')};});
    const hr=team.find(t=>t.role==='Classroom teacher'),hrRow=live.find(r=>/homeroom|hmrm/i.test(r.period+' '+r.course+' '+r.seen));
    return {at:h,team,dropped:rows.length-live.length,room:hr?(hrRow&&hrRow.room?'Room '+hrRow.room+', ':'')+hr.name:''};
  }
  /* v22.27 the Enrollment page: one row a school and year (Year, School, Grade Level, Enrollment Date, Enrollment Code, Drop
     Date, Drop Code). The row with no drop date is the school now (its grade and date of enrollment); the schools before
     it, most recent first, a summer's or a temporary assignment left out, are the previous schools. */
  function enrollment(L){
    const h=L.findIndex(l=>/\byear\b/i.test(l)&&/\bschool\b/i.test(l)&&/enrol?lment date|grade level/i.test(l));if(h<0)return null;
    const rows=[];
    for(let i=h+1;i<L.length&&i<h+40;i++){const l=L[i].replace(/\s=\s/g,'  ').replace(/\s+/g,' ');
      const m=l.match(/\b(\d{4})\s*-\s*(\d{4})\s+(.+?)\s+(PK|KG|K|\d{1,2})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:\(([A-Z0-9]{2,4})\)\s*(.*?))?(?:\s(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:\(([A-Z0-9]{2,4})\)\s*(.*))?)?$/);
      if(!m)continue;
      const raw=m[3].trim(),name=raw.replace(/\s*-\s*[A-Z]?\d{3,4}[A-Z]?\s*-\s*[A-Z]{1,5}$/,'').trim();
      rows.push({year:m[1]+'–'+m[2],school:name,grade:m[4],from:m[5],to:m[8]||'',skip:/^xsummer|summer\b|temporary assignment/i.test(name),seen:L[i].trim().slice(0,160)});}
    if(!rows.length)return null;
    const now=rows.find(r=>!r.to&&!r.skip)||null;
    const past=[];rows.filter(r=>r!==now&&!r.skip&&(!now||r.school!==now.school)).forEach(r=>{const p=past.find(x=>x.school===r.school);
      if(p){if(toISO(r.from)<toISO(p.from))p.from=r.from;if(toISO(r.to)>toISO(p.to))p.to=r.to;}else past.push({school:r.school,from:r.from,to:r.to});});
    past.sort((a,b)=>toISO(a.from)<toISO(b.from)?1:-1);
    return {at:h,now,prior:past.map(p=>p.school+' ('+p.from+(p.to?'–'+p.to:'')+')').join('; '),n:past.length,seen:now?now.seen:rows[0].seen};
  }
  return {parse,contacts,schedule,enrollment,toISO,grade,splitName,relOf,fields:F};
})();

/* ---- the dialog ---- */
const DR={text:'',cols:'',res:null,worker:null,pdf:null};
const DR_ROLES=['','Parent','BCBA','Behavioral Health Professional (BHP)','Behavior Intervention Associate (BIA)','Classroom teacher','Fine arts teacher','Paraprofessional','ESE contact / case manager','ESE coordinator','School psychologist','Speech-language pathologist','Occupational therapist','Physical therapist','School nurse','School counselor / social worker','Administrator','District behavior support','Bus driver / aide','Transportation leadership','Home ABA provider','Psychiatrist / prescriber','Pediatrician','Outside therapist / counselor','Agency case manager (DCF, APD)','Group home manager','Other'];   /* Form DM-1's team roles */
const DR_REL=['','Mother','Father','Stepparent','Grandparent','Legal guardian','Foster parent','Surrogate parent','Guardian advocate','Adult sibling','Other relative','Family friend','Case manager (agency)','Other'];   /* Form DM-1's list */
const drCan=()=>!EMBED&&/^https?:$/.test(location.protocol);   /* the readers: the website or the app, not the one-file edition or a drive */
function drProg(t){const p=$('#drProg');if(!p)return;p.hidden=!t;p.textContent=t||'';}
function drOpen(){
  DR.text='';DR.cols='';DR.res=null;
  dialog('Read a document',
    '<p class="dr-intro">The document is read here, on this device; nothing leaves it. The student\u2019s details it finds are listed for you to check, each with the line it was read from. <b>Place</b> puts the ticked ones into the bar and Form DM-1, into empty fields unless you say otherwise, and target behaviors found in a plan into the case.</p>'+
    '<div class="dr-src">'+
    (drCan()?'<div class="dr-file"><label class="dr-pick"><input type="file" id="drFile" accept="application/pdf,image/*"> <span>Choose a PDF or a picture</span></label>'+
      '<span class="dr-hint">A PDF with its own text is read at once. A scanned page, a photo or a screenshot is read by the text recognizer kept with the workstation: a few seconds a page, and the first picture loads it (about 7 MB, then kept offline).</span></div>'
      :'<div class="dr-file"><span class="dr-hint">'+(EMBED?'This one-file edition reads pasted text.':'Opened from a drive, the workstation reads pasted text.')+' To read a PDF or a picture itself, open the workstation from its website or the installed app.</span></div>')+
    '<div class="dr-paste"><textarea id="drText" rows="5" placeholder="Or paste the text here. On the iPad: open the picture or PDF, press and hold on its text, Select All, Copy."></textarea>'+
    '<div class="dr-acts"><button type="button" id="drRead" class="primary">Read the text</button></div></div></div>'+
    '<div id="drProg" class="dr-prog" hidden></div><div id="drOut"></div>');
  $('#drRead').addEventListener('click',()=>{const t=$('#drText').value;if(!t.trim()){alert('Paste the document\u2019s text first.');return;}drShow(t,'the pasted text');});
  const fi=$('#drFile');if(fi)fi.addEventListener('change',()=>{const f=fi.files&&fi.files[0];if(f)drFile(f);});
}
/* v22.30 the ticked RBTs into Form RS-1: the one open, or opened here when no student's case is on screen */
async function drRbtPlace(){const res=DR.res;if(!res||!res.rbts)return;
  const list=res.rbts.map((r,i)=>{if(!($('#drOut [data-drb="'+i+'"]')||{}).checked)return null;const v=f=>(($('#drOut [data-drbf="'+f+'"][data-i="'+i+'"]')||{}).value||'').trim();return {name:v('name'),cert:v('cert'),cred:v('cred'),from:v('from')};}).filter(x=>x&&x.name);
  if(!list.length){wsUI.toast('No RBT is ticked.',{kind:'warn'});return;}
  if(!state.frames['RS-1']){const p=packet();if(String(p.client||'').trim()||String(p.sid||'').trim()){await wsUI.alert('Open the RBT Supervision Log first (Caseload, Staff records), then read the page again.\nThe RBTs are kept apart from the students\u2019 cases.');return;}
    try{const L=await clList()||[],r=L.find(isStaffRec);if(r&&!Object.keys(state.frames).length){await caseloadGo(r.key,'RS-1');}else openForm('RS-1');}catch(e){openForm('RS-1');}}
  let fn=null;for(let k=0;k<80&&!fn;k++){const fr=state.frames['RS-1'];try{fn=fr&&fr.contentWindow&&fr.contentWindow.__nbhAddRbts;}catch(e){}if(!fn)await new Promise(z=>setTimeout(z,250));}
  if(!fn){wsUI.toast('Form RS-1 did not open in time; try Add to Form RS-1 again.',{kind:'warn'});return;}
  const r=fn(list);try{$('#dlg').close();}catch(e){}openForm('RS-1');
  wsUI.toast((r.added?r.added+(r.added===1?' RBT added':' RBTs added'):'')+(r.added&&r.updated?', ':'')+(r.updated?r.updated+' completed':'')+' in Form RS-1 ('+r.total+' in the log). Save case keeps it.',{kind:'ok',ms:7000});}
async function drFile(file){
  $('#drOut').innerHTML='';DR.cols='';
  try{
    let text='';
    if(/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name))text=await drPdf(file);
    else if(/^image\//.test(file.type)||/\.(png|jpe?g|gif|webp|bmp|heic|tiff?)$/i.test(file.name))text=await drImage(file);
    else{alert('Choose a PDF or a picture (PNG, JPEG, HEIC).');return;}
    drProg('');
    drShow(text,file.name,DR.cols);
  }catch(e){drProg('');$('#drOut').innerHTML='<p class="dr-err">The file could not be read: '+esc(e&&e.message||e)+'. Paste its text instead.</p>';}
}
async function drPdfLib(){
  /* v22.30 the PDF library reads a page's text as a stream it walks with "for await", which Safari on the iPad cannot do
     (a stream there cannot be walked that way): the text of every page failed, and every page was read as a picture,
     slowly. The stream is given the means here */
  if(window.ReadableStream&&!ReadableStream.prototype[Symbol.asyncIterator]){
    try{Object.defineProperty(ReadableStream.prototype,Symbol.asyncIterator,{configurable:true,writable:true,value:async function*(){const r=this.getReader();try{for(;;){const x=await r.read();if(x.done)return;yield x.value;}}finally{try{r.releaseLock();}catch(e){}}}});}catch(e){}}
  if(!DR.pdf){const lib=await import(new URL('nbh-doc/pdf.min.js',location.href).href);lib.GlobalWorkerOptions.workerSrc=new URL('nbh-doc/pdf.worker.min.js',location.href).href;DR.pdf=lib;}
  return DR.pdf;
}
/* the text of a page, line by line: items on one height make a line, a wide gap between two a column break */
function drLinesOf(items){
  const rows=[];
  items.forEach(it=>{if(!it.str||!it.transform)return;const y=it.transform[5],x=it.transform[4];let r=rows.find(r=>Math.abs(r.y-y)<=3);if(!r){r={y,items:[]};rows.push(r);}r.items.push({x,w:it.width||0,s:it.str});});
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{r.items.sort((a,b)=>a.x-b.x);let s='',end=null;r.items.forEach(it=>{if(end!==null){const gap=it.x-end;s+=gap>12?'  ':(gap>1.5&&!/\s$/.test(s)&&!/^\s/.test(it.s)?' ':'');}s+=it.s;end=it.x+it.w;});return s;}).join('\n');
}
async function drPdf(file){
  drProg('Opening the PDF\u2026');
  const lib=await drPdfLib();
  const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,disableAutoFetch:true}).promise;
  const N=Math.min(doc.numPages,60);let text='';   /* v22.30 the whole document (an IEP runs to 30 pages), not its first 8 */
  for(let p=1;p<=N;p++){
    drProg('Reading page '+p+' of '+N+'\u2026');
    const page=await doc.getPage(p);let t='';
    try{t=drLinesOf(await drPageItems(page));}catch(e){t='';}
    if(t.replace(/[^A-Za-z]/g,'').length<40){   /* a scanned page: drawn and read as a picture */
      const vp=page.getViewport({scale:2}),c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
      await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
      t=await drOcr(c,'page '+p+' of '+N);
    }
    text+=t+'\n';
  }
  if(doc.numPages>N)text+='\n';
  try{await doc.destroy();}catch(e){}
  return text;
}
/* a page's text items, read from the library's stream with a reader (the way every browser can) */
async function drPageItems(page){const rd=page.streamTextContent({}).getReader(),items=[];for(;;){const x=await rd.read();if(x.done)break;if(x.value&&x.value.items)items.push(...x.value.items);}return items;}
async function drImage(file){
  drProg('Opening the picture\u2026');
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();img.src=url;await img.decode();
    /* small text reads better larger; a camera's picture is brought down to a size the recognizer handles */
    const w=img.naturalWidth,h=img.naturalHeight;let sc=1;if(w<1400)sc=Math.min(2.5,1400/w);if(w*sc>2600)sc=2600/w;
    const c=document.createElement('canvas');c.width=Math.round(w*sc);c.height=Math.round(h*sc);
    const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
    return await drOcr(c,'the picture');
  }finally{URL.revokeObjectURL(url);}
}
function drScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('the text recognizer did not load ('+src+')'));document.head.appendChild(s);});}
async function drOcr(canvas,what){
  if(!window.Tesseract){drProg('Loading the text recognizer\u2026');await drScript('nbh-ocr/tesseract.min.js');}
  if(!DR.worker){
    drProg('Starting the text recognizer\u2026');
    DR.worker=await Tesseract.createWorker('eng',1,{workerPath:'nbh-ocr/worker.min.js',corePath:'nbh-ocr/tesseract-core-simd-lstm.wasm.js',langPath:'nbh-ocr',gzip:true,workerBlobURL:false,
      logger:m=>{if(m&&m.status==='recognizing text'&&DR.what)drProg('Reading '+DR.what+'\u2026 '+Math.round((m.progress||0)*100)+'%');}});
  }
  DR.what=what;drProg('Reading '+what+'\u2026');
  let r=await DR.worker.recognize(canvas,{},{text:true,blocks:true});
  /* v22.30 a window whose boxes cannot be edited (a student information system's Edit Contact or address window) shows
     their contents in pale grey, which the recognizer passes over, reading only the labels: such a page is read again
     with every shade darkened, and that reading is kept */
  const t1=drLinesOfOcr(r&&r.data)||(r&&r.data&&r.data.text)||'';
  if(/edit contact|do not have permission to edit|physical address|mailing address/i.test(t1)){
    drProg('Reading '+what+' again, for the pale text\u2026');
    try{const r2=await DR.worker.recognize(drDarken(canvas),{},{text:true,blocks:true});if(r2&&r2.data)r=r2;}catch(e){}}
  DR.what='';
  DR.cols=(DR.cols?DR.cols+'\n\n':'')+drCardsOfOcr(r&&r.data);
  return drLinesOfOcr(r&&r.data)||(r&&r.data&&r.data.text)||'';
}
/* the picture in grey with its shades stretched: pale grey text (and anything darker) becomes black, the pale tints of
   rows and boxes white */
function drDarken(src){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);
  const im=g.getImageData(0,0,c.width,c.height),d=im.data;
  for(let i=0;i<d.length;i+=4){const l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2],v=l>=235?255:l<=150?0:Math.round((l-150)*3);d[i]=d[i+1]=d[i+2]=v;}
  g.putImageData(im,0,0);return c;}
/* the recognizer's words with their places: a gap wider than two letters between two words on a line is a column break
   (a label's cell and its value's, a value and the next label), kept as a double space for the matcher, as a PDF's is */
function drLinesOfOcr(data){
  const blocks=data&&data.blocks;if(!Array.isArray(blocks)||!blocks.length)return '';
  const out=[];
  blocks.forEach(b=>(b.paragraphs||[]).forEach(p=>(p.lines||[]).forEach(l=>{const ws=(l.words||[]).filter(w=>w&&w.text&&w.bbox).sort((a,b)=>a.bbox.x0-b.bbox.x0);if(!ws.length)return;
    let s='',prev=null;ws.forEach(w=>{if(prev){const cw=Math.max(4,((prev.bbox.x1-prev.bbox.x0)/Math.max(1,prev.text.length)+(w.bbox.x1-w.bbox.x0)/Math.max(1,w.text.length))/2);s+=w.bbox.x0-prev.bbox.x1>2.2*cw?'  ':' ';}s+=w.text;prev=w;});
    out.push(s);})));
  return out.join('\n');
}
/* v22.25 a page of cards side by side (a student information system's Addresses & Contacts: "Address", "Contact #3", four
   to a row) is read across, card after card, so each card's lines come out mixed with its neighbours'. Here the words
   are put back into their cards by place: each card's heading marks its column and its row, every word below a heading
   and right of it (up to the next heading) is that card's, and the cards are written out one after the other. '' when
   the page has no such cards. */
function drCardsOfOcr(data){
  const blocks=data&&data.blocks;if(!Array.isArray(blocks)||!blocks.length)return '';
  const words=[],segs=[];
  blocks.forEach(b=>(b.paragraphs||[]).forEach(p=>(p.lines||[]).forEach(l=>{const ws=(l.words||[]).filter(w=>w&&w.text&&w.bbox).sort((a,b)=>a.bbox.x0-b.bbox.x0);let sg=null,prev=null;
    ws.forEach(w=>{words.push(w);const cw=prev?Math.max(4,((prev.bbox.x1-prev.bbox.x0)/Math.max(1,prev.text.length)+(w.bbox.x1-w.bbox.x0)/Math.max(1,w.text.length))/2):0;
      if(!sg||w.bbox.x0-prev.bbox.x1>2.2*cw){sg={x0:w.bbox.x0,x1:w.bbox.x1,y0:w.bbox.y0,y1:w.bbox.y1,t:w.text};segs.push(sg);}else{sg.t+=' '+w.text;sg.x1=w.bbox.x1;sg.y0=Math.min(sg.y0,w.bbox.y0);sg.y1=Math.max(sg.y1,w.bbox.y1);}prev=w;});})));
  /* v22.30 a card's lines are made from its own words (a line of the picture can run across two cards with too narrow a
     gap between them to be a column break), and the recognizer's marks before a heading ("& Contact #7") are passed over */
  const lineOf=(x0,x1,y0,y1)=>{const mine=words.filter(w=>w.bbox.x0>=x0&&w.bbox.x0<x1&&w.bbox.y0>=y0&&w.bbox.y0<y1).sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0);
    const ls=[];mine.forEach(w=>{const h=w.bbox.y1-w.bbox.y0,last=ls[ls.length-1];if(last&&Math.abs(last.y-w.bbox.y0)<h*0.6)last.w.push(w);else ls.push({y:w.bbox.y0,w:[w]});});
    return ls.map(l=>{l.w.sort((a,b)=>a.bbox.x0-b.bbox.x0);let t='',prev=null;l.w.forEach(w=>{if(prev){const cw=Math.max(4,((prev.bbox.x1-prev.bbox.x0)/Math.max(1,prev.text.length)+(w.bbox.x1-w.bbox.x0)/Math.max(1,w.text.length))/2);t+=w.bbox.x0-prev.bbox.x1>2.2*cw?'  ':' ';}t+=w.text;prev=w;});return t;});};
  const HD=/^(?:contact\s*#\s*\d{1,2}|address)$/i,clean=t=>t.trim().replace(/^[^A-Za-z#]+(?=contact|address)/i,'');
  const heads=segs.filter(g=>HD.test(clean(g.t))).sort((a,b)=>a.y0-b.y0);
  const rows=[];heads.forEach(h=>{const r=rows.find(r=>Math.abs(r.y-h.y0)<Math.max(8,h.y1-h.y0));if(r)r.h.push(h);else rows.push({y:h.y0,h:[h]});});
  if(heads.length>=2&&rows.some(r=>r.h.length>1)){
    const cards=[];
    rows.forEach((r,ri)=>{r.h.sort((a,b)=>a.x0-b.x0);const tol=Math.max(6,(r.h[0].y1-r.h[0].y0));
      const yEnd=ri+1<rows.length?rows[ri+1].y-tol/2:(ri?r.y+(r.y-rows[ri-1].y)*1.1:Infinity);
      r.h.forEach((h,ci)=>{const x0=h.x0-tol,x1=ci+1<r.h.length?r.h[ci+1].x0-tol:Infinity;
        const ls=lineOf(x0,x1,h.y1-1,yEnd);cards.push([clean(h.t)].concat(ls).join('\n'));});});
    return cards.join('\n\n');
  }
  /* v22.30 the page scrolled so that the top row's headings are gone: the cards' columns are found from what cards hold
     (an address, "Contacts at this Address", "Contact Details:", "(No Address)", a "Last, First" name), each
     column read down and cut into cards at a heading or after the relationship at a card's foot; a card without its
     heading is named by what it holds */
  const ANC=/^(?:\d+[A-Za-z]?\s+\S.*|[A-Za-z .'\-]+,\s*[A-Z]{2}\.?\s+\d{5}.*|contacts? at this address|contact details:?|\(?no address\)?|#\s*\d{1,2}\s*[-\u2013\u2014].*|[A-Z][A-Za-z'\u2019\-]+,\s*[A-Z][A-Za-z'\u2019\-]+.*)$/i;   /* a phone is not one: a contact's table puts it mid-card */
  const anc=segs.filter(g=>ANC.test(clean(g.t))&&!/[a-z]{3,}\.(?:com|org)/i.test(g.t)).sort((a,b)=>a.x0-b.x0);if(anc.length<4)return '';
  const W=Math.max(...words.map(w=>w.bbox.x1)),gap=W*0.06,cl=[];anc.forEach(g=>{const c=cl[cl.length-1];if(c&&g.x0-c.x<gap){c.n++;}else cl.push({x:g.x0,n:1});});
  const cols=cl.filter(c=>c.n>=2);if(cols.length<2)return '';
  const y0=Math.min(...anc.map(g=>g.y0))-4,stop=segs.find(g=>/^linked (?:users|students)\b/i.test(clean(g.t))&&g.y0>y0),y1=stop?stop.y0-2:Infinity;
  const rel=window.nbhDocRead&&nbhDocRead.relOf,cards=[];let k=0;
  cols.forEach((c,ci)=>{const tol=gap/3,ls=lineOf(c.x-tol,ci+1<cols.length?cols[ci+1].x-tol:Infinity,y0,y1);let cur=[];
    const end=()=>{if(!cur.length)return;const T=cur.slice();cur=[];
      if(HD.test(clean(T[0]))){T[0]=clean(T[0]);cards.push(T.join('\n'));return;}
      if(T.some(l=>/^contacts?\s+at\s+this\s+(?:[.,:;]\s+)?address/i.test(l.trim())))cards.push(['Address'].concat(T).join('\n'));
      else if(T.slice(0,3).some(l=>/^[A-Z][A-Za-z'\u2019\-]+,\s*[A-Z]/.test(l.trim())))cards.push(['Contact #'+(90+(k++))].concat(T).join('\n'));};
    ls.forEach(l=>{const t=l.trim();if(!t)return;if(HD.test(clean(t))){end();cur.push(t);return;}cur.push(t);if(rel&&rel(t)&&cur.length>2)end();});end();});
  return cards.length?cards.join('\n\n'):'';
}
function drShow(text,from,cols){
  DR.text=text;const res=DR.res=nbhDocRead.parse(text,cols);
  const out=$('#drOut');if(!out)return;
  const haveBeh=!!(state.facts&&(state.facts.behaviors||[]).length&&(state.facts.src||{}).behaviors!=='document');
  const cons=res.contacts||[];
  if(res.rbts&&res.rbts.length){   /* v22.30 the BACB portal's supervisees, for Form RS-1 */
    out.innerHTML='<p class="dr-found"><b>'+res.rbts.length+(res.rbts.length===1?' RBT':' RBTs')+'</b> you supervise, read from '+esc(from)+' (the BACB portal\u2019s Supervision page'+(res.rbtsPast?'; '+res.rbtsPast+' in its History left out':'')+'). Untick what is wrong, or correct it.</p>'+
      '<table class="dr-tbl dr-ctbl"><thead><tr><th></th><th>Name</th><th>Certification number</th><th>Credential</th><th>Supervision started</th><th>Read from</th></tr></thead><tbody>'+
      res.rbts.map((r,i)=>'<tr><td><input type="checkbox" data-drb="'+i+'" checked aria-label="Add '+esc(r.name)+'"></td><td><input type="text" data-drbf="name" data-i="'+i+'" value="'+esc(r.name)+'"></td><td><input type="text" data-drbf="cert" data-i="'+i+'" value="'+esc(r.cert)+'"></td><td><input type="text" data-drbf="cred" data-i="'+i+'" value="'+esc(r.cred)+'"></td><td><input type="date" data-drbf="from" data-i="'+i+'" value="'+esc(r.from)+'">'+(r.status&&r.status!=='Active'?'<small class="dr-note">'+esc(r.status)+'</small>':'')+'</td><td class="dr-seen">'+esc(r.seen)+'</td></tr>').join('')+'</tbody></table>'+
      '<p class="hint">Each one ticked becomes a supervisee in Form RS-1 (the RBT Supervision Log): one already there by name or number is completed, not added again. Nothing goes to the student\u2019s bar or forms.</p>'+
      '<div class="dr-act"><button type="button" class="primary" id="drRbtPlace">Add to Form RS-1</button></div>';
    $('#drRbtPlace').addEventListener('click',drRbtPlace);return;}
  if(!res.fields.length&&!res.behaviors.length&&!cons.length&&!(res.team||[]).length){out.innerHTML='<p class="dr-none">Nothing recognisable in '+esc(from)+' ('+res.lines+' lines read). The details are read from their labels: Student name, Date of birth, Student ID, Grade, School, Teacher, and the IEP\u2019s; contacts from a student information system\u2019s Addresses &amp; Contacts page or its Edit Contact window. '+(text.trim()?'':'The text was empty: a picture of a page needs the text recognizer, which needs the website or the app.')+'</p>';return;}
  let h='<p class="dr-found">'+(res.fields.length||!cons.length?'<b>'+res.fields.length+(res.fields.length===1?' detail':' details')+'</b> read from '+esc(from):'<b>'+cons.length+(cons.length===1?' contact':' contacts')+'</b> read from '+esc(from))+(res.behaviors.length?', and '+res.behaviors.length+(res.behaviors.length===1?' target behavior':' target behaviors'):'')+(cons.length&&res.fields.length?', and '+cons.length+(cons.length===1?' contact':' contacts'):'')+((res.team||[]).length?', and '+res.team.length+(res.team.length===1?' teacher':' teachers'):'')+'. Untick what is wrong, or correct it.</p>';
  /* v22.25 a page for another student than the case on screen */
  const onBar=($('#pClient')||{}).value||'',pg=res.student?nbhDocRead.splitName(res.student.name):null;
  if(pg&&onBar.trim()&&pg.last&&onBar.toLowerCase().indexOf(pg.last.toLowerCase())<0)h+='<p class="dr-warn">This page is for <b>'+esc(pg.full)+'</b>; the case on screen is <b>'+esc(onBar)+'</b>. Check before placing.</p>';
  if(res.fields.length)h+='<table class="dr-tbl"><thead><tr><th></th><th>Detail</th><th>Value</th><th>Goes to</th><th>Read from</th></tr></thead><tbody>';
  res.fields.forEach((f,i)=>{
    const to=f.to.map(t=>t.split(':')[0]).filter((x,k,a)=>a.indexOf(x)===k).map(x=>x==='bar'?'the bar':'Form '+x).join(', ')||'\u2014';
    h+='<tr'+(f.ok?'':' class="off"')+'><td><input type="checkbox" data-dr="'+i+'"'+(f.ok?' checked':'')+' aria-label="Place '+esc(f.label)+'"></td><td>'+esc(f.label)+'</td><td><input type="text" data-drv="'+i+'" value="'+esc(f.value)+'">'+(f.note?'<small class="dr-note">'+esc(f.note)+'</small>':'')+'</td><td>'+esc(to)+'</td><td class="dr-seen">'+esc(f.seen)+'</td></tr>';
  });
  if(res.fields.length)h+='</tbody></table>';
  if(cons.length){   /* v22.25 the contacts, for Form DM-1's Contacts */
    h+='<div class="dr-con"><b>Contacts</b> <small class="dr-note">for Form DM-1\u2019s Contacts, in the record\u2019s order; one already there by the same name is completed, not added again</small>';
    h+='<table class="dr-tbl dr-ctbl"><thead><tr><th></th><th>Name</th><th>Relationship</th><th>Phone</th><th>Address, email</th><th>Read from</th></tr></thead><tbody>';
    cons.forEach((c,i)=>{
      h+='<tr><td><input type="checkbox" data-drc="'+i+'" checked aria-label="Place contact '+esc(c.name)+'"></td><td><input type="text" data-drcf="name" data-i="'+i+'" value="'+esc(c.name)+'"></td>'+
        '<td><select data-drcf="rel" data-i="'+i+'">'+DR_REL.map(r=>'<option'+(r===c.rel?' selected':'')+'>'+esc(r)+'</option>').join('')+'</select>'+(c.note?'<small class="dr-note">'+esc(c.note)+'</small>':'')+'</td>'+
        '<td><input type="text" data-drcf="phone" data-i="'+i+'" value="'+esc(c.phone)+'">'+(c.phone2?'<input type="text" data-drcf="phone2" data-i="'+i+'" value="'+esc(c.phone2)+'" aria-label="Alternate phone">':'')+'</td>'+
        '<td><input type="text" data-drcf="addr" data-i="'+i+'" value="'+esc(c.addr)+'" placeholder="address">'+(c.email?'<input type="text" data-drcf="email" data-i="'+i+'" value="'+esc(c.email)+'" aria-label="Email">':'')+(c.lang?'<small class="dr-note">Language: '+esc(c.lang)+'</small>':'')+'</td>'+
        '<td class="dr-seen">'+esc(c.seen)+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  const team=res.team||[];
  if(team.length){   /* v22.27 the teachers from a Schedule page, for Form DM-1's Team and Providers */
    h+='<div class="dr-con"><b>Team</b> <small class="dr-note">from the schedule, for Form DM-1\u2019s Team and Providers'+(res.dropped?' (a class dropped is left out)':'')+'; a teacher already there by name is completed, not added again</small>';
    h+='<table class="dr-tbl dr-ctbl"><thead><tr><th></th><th>Name</th><th>Role</th><th>Involvement</th><th>Read from</th></tr></thead><tbody>';
    team.forEach((t,i)=>{
      h+='<tr><td><input type="checkbox" data-drt="'+i+'" checked aria-label="Place '+esc(t.name)+'"></td><td><input type="text" data-drtf="name" data-i="'+i+'" value="'+esc(t.name)+'"></td>'+
        '<td><select data-drtf="role" data-i="'+i+'">'+DR_ROLES.map(r=>'<option'+(r===t.role?' selected':'')+'>'+esc(r)+'</option>').join('')+'</select>'+(t.svc>=0?'<small class="dr-note">also on Related Services</small>':'')+'</td>'+
        '<td><textarea data-drtf="inv" data-i="'+i+'" rows="2" aria-label="Involvement">'+esc(t.inv)+'</textarea></td><td class="dr-seen">'+esc(t.seen)+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  if(res.behaviors.length){
    h+='<div class="dr-beh"><b>Target behaviors</b>'+(haveBeh?' <small class="dr-note">(the case already holds the targets from Form TB-1; these are left out unless ticked)</small>':'')+'<div>';
    res.behaviors.forEach((b,i)=>{h+='<label class="dr-bl"><input type="checkbox" data-drb="'+i+'"'+(haveBeh?'':' checked')+'> <b>'+esc(b.label)+'</b>'+(b.isRep?' <small>(replacement)</small>':'')+(b.def?'<small class="dr-def">'+esc(b.def)+'</small>':'')+'</label>';});
    h+='</div></div>';
  }
  h+='<div class="dr-acts"><label class="dr-over"><input type="checkbox" id="drOver"> Replace what the bar and the form already hold</label><button type="button" id="drPlace" class="primary">Place in the bar and Form DM-1</button></div>';
  out.innerHTML=h;
  $('#drPlace').addEventListener('click',drPlace);
}
async function drPlace(){
  const res=DR.res;if(!res)return;
  const over=!!$('#drOver').checked,bar={},dm={},tick=[];
  res.fields.forEach((f,i)=>{
    const c=$('#drOut [data-dr="'+i+'"]');if(!c||!c.checked)return;
    const v=String(($('#drOut [data-drv="'+i+'"]')||{}).value||'').trim();if(!v)return;
    tick.push(f);
    f.to.forEach(t=>{const [where,key]=t.split(':');
      if(where==='bar'){bar[key]=v;}
      else if(f.k==='name'){const n=f.value===v?f:nbhDocRead.splitName(v);if(key==='s.first'&&n.first)dm[key]=n.first;if(key==='s.last'&&n.last)dm[key]=n.last;}
      else dm[key]=v;});
  });
  const behs=res.behaviors.filter((b,i)=>{const c=$('#drOut [data-drb="'+i+'"]');return c&&c.checked;});
  /* v22.25 the ticked contacts, as corrected */
  const cons=(res.contacts||[]).map((c,i)=>{const t=$('#drOut [data-drc="'+i+'"]');if(!t||!t.checked)return null;const o={name:'',rel:'',phone:'',phone2:'',email:'',addr:'',lang:c.lang||'',note:c.note||''};
    document.querySelectorAll('#drOut [data-drcf][data-i="'+i+'"]').forEach(e=>{o[e.dataset.drcf]=String(e.value||'').trim();});return o.name?o:null;}).filter(Boolean);
  /* v22.27 the ticked teachers */
  const team=(res.team||[]).map((t,i)=>{const c=$('#drOut [data-drt="'+i+'"]');if(!c||!c.checked)return null;const o={name:'',role:'',inv:'',sb:'Yes',svc:t.svc,svcFreq:t.svcFreq};
    document.querySelectorAll('#drOut [data-drtf][data-i="'+i+'"]').forEach(e=>{o[e.dataset.drtf]=String(e.value||'').trim();});return o.name?o:null;}).filter(Boolean);
  if(!tick.length&&!behs.length&&!cons.length&&!team.length){alert('Tick at least one detail to place.');return;}
  const rep={bar:[],kept:[],dm:null,beh:0};
  /* the bar */
  const BAR={client:'#pClient',sid:'#pSid',grade:'#pGrade',site:'#pSite',bcba:'#pBcba'};
  Object.keys(bar).forEach(k=>{const el=$(BAR[k]);if(!el)return;if(el.value.trim()===bar[k])return;if(el.value.trim()&&!over){rep.kept.push(k);return;}
    el.value=bar[k];el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));rep.bar.push(k);});
  if(typeof paintSum==='function')paintSum();
  /* Form DM-1, opened if it is not */
  if(Object.keys(dm).length||cons.length||team.length){
    if(!state.frames['DM-1'])openForm('DM-1',true);
    const t0=Date.now();while(!state.status['DM-1']&&Date.now()-t0<15000)await new Promise(r=>setTimeout(r,120));
    rep.dm=await grab('DM-1','fill',{fields:dm,over,contacts:cons,team},8000);
  }
  /* the case: target behaviors from a plan, when the forms hold none */
  if(behs.length){
    const t1=Date.now();while(factsBusy&&Date.now()-t1<6000)await new Promise(r=>setTimeout(r,100));   /* a gather under way would write over them */
    const f=Object.assign({},state.facts||{});f.src=Object.assign({},f.src||{});
    f.behaviors=behs.map(b=>({label:b.label,def:b.def||'',ex:'',nex:'',type:b.isRep?'replacement':'',isRep:!!b.isRep,fn:'',fnKey:'',dim:'',unit:'',rep:'',ctx:'',src:'document'}));
    f.src.behaviors='document';f.when=new Date().toISOString();
    setFacts(f,true);rep.beh=behs.length;
  }
  /* the details reach the other open forms as the packet does */
  Object.values(state.frames).forEach(fr=>{if(fr!==state.frames['DM-1'])pushPacketTo(fr);});
  setTimeout(()=>Object.values(state.frames).forEach(fr=>ask(fr,'status')),400);
  try{$('#dlg').close();}catch(e){}
  const bits=[],kept=[];
  if(rep.bar.length)bits.push(rep.bar.length+' in the bar');
  const rc=rep.dm&&rep.dm.cons||{},rt=rep.dm&&rep.dm.team||{},cput=(rep.dm&&rep.dm.put||[]).filter(k=>/^(?:c|t|sv)\[/.test(k)).length;
  if(rep.dm&&(rep.dm.put||[]).length-cput)bits.push(((rep.dm.put||[]).length-cput)+' in Form DM-1');
  if(rc.added||rc.completed)bits.push((rc.added?rc.added+(rc.added===1?' contact':' contacts')+' added':'')+(rc.added&&rc.completed?', ':'')+(rc.completed?rc.completed+(rc.completed===1?' contact':' contacts')+' completed':'')+' in Form DM-1');
  if(rt.added||rt.completed)bits.push((rt.added?rt.added+(rt.added===1?' team member':' team members')+' added':'')+(rt.added&&rt.completed?', ':'')+(rt.completed?rt.completed+(rt.completed===1?' team member':' team members')+' completed':'')+' in Form DM-1');
  if(rt.svc)bits.push(rt.svc+(rt.svc===1?' related service':' related services')+' given a provider');
  if(rt.full)kept.push(rt.full+(rt.full===1?' teacher':' teachers')+' (Form DM-1\u2019s team holds '+rt.max+' at most)');
  if(rep.beh)bits.push(rep.beh+(rep.beh===1?' target behavior':' target behaviors')+' to the case');
  if(rep.kept.length)kept.push(rep.kept.length+' in the bar');
  if(rep.dm&&(rep.dm.kept||[]).length)kept.push(rep.dm.kept.length+' in Form DM-1');
  let msg=bits.length?'Placed: '+bits.join('; ')+'.':'Nothing new to place.';
  if(kept.length)msg+=' Left as they were: '+kept.join(', ')+' (tick Replace to change them).';
  if(!rep.dm&&(Object.keys(dm).length||cons.length||team.length))msg+=' Form DM-1 did not answer: open it and try again.';
  if(rc.full)msg+=' '+rc.full+(rc.full===1?' contact was':' contacts were')+' not placed: Form DM-1 holds '+rc.max+' at most.';
  if(rep.dm&&(rep.dm.none||[]).length)msg+=' Not taken by the form: '+rep.dm.none.length+'.';
  if(rep.dm&&(rep.dm.put||[]).length)msg+=' Check Form DM-1.';
  wsUI.toast(msg,{ms:9000});
  if(state.frames['DM-1']&&state.cur!=='DM-1')openForm('DM-1',true);
}
$('#readDoc').addEventListener('click',drOpen);
