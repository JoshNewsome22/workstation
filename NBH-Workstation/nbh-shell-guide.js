/* v26.13 Guide me (the BCBA's request of 11/13: "an interactive mode that starts by asking you a question such as what do you
   need to do today? and then guide you through all the steps of doing it one at a time ... then a next set of questions
   conditionally based on the previous answer").
   The start screen asks "What do you need to do today?". A choice leads to one to four short questions, each chosen by the
   answers before it; a question the open case already answers (consent on file, a function on file) is not asked and is
   named as taken from the case. The answers give a list of steps. The steps then run one at a time in a strip at the foot
   of the work area: what to do, why, and one button that opens the form, the command or the video for it.
   What the guide keeps: the kind of work, the answers chosen and where the steps stand, in this tab's session storage
   (nbh.guide.v1). Nothing about a student is kept by it, and it changes nothing in a form: it opens them. */
(()=>{
if(window.__wsGuide)return;
const $=s=>document.querySelector(s);
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ONE=typeof EMBED!=='undefined'&&EMBED;   /* the one-file edition carries no videos */
const NAME=id=>{const r=ALL.find(x=>x[0]===id);return r?r[1]:id;};
/* a step: a form to open, a command to run, a page of the video viewer, or something done away from the screen */
const f=(id,why,t,key)=>({k:key||id,form:id,t:t||NAME(id),why});
const c=(cmd,t,why,btn)=>({k:'c:'+cmd,cmd,t,why,btn});
const n=(key,t,why)=>({k:'n:'+key,t,why});
const CMD={
  student:()=>{try{foldBar(false);}catch(e){}const i=$('#pClient');if(i){try{i.focus();i.select();}catch(e){}}},
  read:()=>$('#readDoc').click(),save:()=>$('#saveCase').click(),packet:()=>$('#masterPrint').click(),close:()=>$('#closeCase').click(),
  today:()=>todayOpen(),ready:()=>readyOpen(),handover:()=>handoverOpen(),week:()=>endOfWeek(),kit:()=>staffKit(),iep:()=>iepOpen(),rbt:()=>staffStart(),
  videos:()=>window.__wsVideos.open(''),tokens:()=>window.__wsVideos.open('family:token'),gbg:()=>window.__wsVideos.open('gbg'),
  practice:()=>window.__wsVideos.open('page:practice'),explain:()=>window.__wsVideos.open('page:explain'),learn:()=>window.__wsVideos.open('page:learn')};
const VIEWER={videos:1,tokens:1,gbg:1,practice:1,explain:1,learn:1};   /* steps that open the video viewer: left out of the one-file edition */
const YN=[['yes','Yes'],['no','No']];
const Q={
  consent:{k:'consent',t:'Has a parent or guardian signed consent for the assessment?',help:'No assessment beyond the current IEP goes on before consent is on file.',o:[['yes','Yes, it is signed'],['no','Not yet'],['unsure','I am not sure']],auto:F=>F.consent?'yes':undefined,said:'Consent is on file (Form IC-1)'},
  danger:{k:'danger',t:'Can the behavior hurt the student or someone else?',help:'Hitting, biting, self-injury, running from the building, throwing furniture and the like.',o:YN},
  sib:{k:'sib',t:'Does the student hurt their own body?',help:'Hitting their head, biting or scratching themselves, and the like.',o:YN,when:a=>a.danger==='yes'}};
const W={   /* the reasons that repeat */
  ic:'Send or print the consent form now. Assessment waits until it is signed; the date goes in this form.',
  icDate:'Record the date of consent here, so that every form knows it is on file.',
  crNow:'Safety comes first. Write the interim crisis stages now, so that every adult answers dangerous behavior the same way while the assessment runs.',
  rr:'Read what is already known before anyone is interviewed: evaluations, past plans, discipline and attendance, medical notes.',
  tb:'Name the behavior and define it so that two people watching would count the same thing.',
  abc:'Record what came before and after each instance. The form works out how often each consequence follows the behavior.',
  base:'Take baseline data before anything changes: at least three to five days, more if the numbers jump around.',
  fs:'Bring the sources together into one statement of the function. The plan is built from this page.',
  save:'One file holds every form for this student. With Google Drive on, it is kept in your school Drive as well.',
  log:'Add it to the incident log, and mark when home was told.',
  note:'Note what was said and what was agreed. The next steps you write there become reminders.',
  vids:'Pick the videos that match the plan. Each has a short check at the end, and captions in English and Spanish.',
  count:'Record the same drawn scene as a second person and compare. Agreement of 80 percent or better says the definition works.',
  pr:'Record the decision, the date, and when you will look again.'};
const TASKS=[
 {id:'new',g:0,t:'Start with a new student',s:'New student',d:'A referral, or a new name on your caseload',next:['why','data'],
  q:[Q.consent,{k:'docs',t:'Do you have the student’s papers as a file or a photo?',help:'An IEP, an evaluation or the referral. The workstation can read the name, the contacts and the teachers from it.',o:[['yes','Yes'],['no','No, I will type the details']]},Q.danger,Q.sib],
  steps:(a,au)=>[
   c('student','Enter the student once','Type the name, ID, grade and school in the bar at the top. Each form you open takes them from there. If another student is still open, use Close case first: it saves that case and clears the forms.','Go to the name box'),
   a.docs==='yes'&&c('read','Read the details from a document','Choose the PDF, the picture or the pasted text. You check what was read before anything is kept.','Read a document'),
   f('DM-1','The profile holds the contacts, the teachers, the schedule and the status of the plans. Other forms read them from here.'),
   a.consent!=='yes'?f('IC-1',W.ic):!au.consent&&f('IC-1',W.icDate),
   a.danger==='yes'&&f('CR-1',W.crNow),
   a.sib==='yes'&&f('IM-1','Start the injury record today: where, how severe, how often. It is the baseline the plan is judged against, and it tells you when to call for medical help.'),
   f('RR-1',W.rr),f('TB-1',W.tb),c('save','Save the case',W.save,'Save case')]},
 {id:'why',g:0,t:'Find out why a behavior happens',s:'Why a behavior happens',d:'A functional behavior assessment, from consent to the summary',next:['plan'],
  q:[Q.consent,Q.danger,
   {k:'stage',t:'How far is the assessment?',o:[['start','Just starting'],['have','Interviews and observations are done'],['unclear','The results disagree, or the function is still unclear']]},
   {k:'when',t:'Is it known when the behavior happens?',o:[['known','Yes: at certain times, places or activities'],['meals','Yes: at meals. The concern is eating'],['all','No: it seems to happen across the day']],when:a=>a.stage==='start'},
   {k:'lead',t:'What does the behavior seem to get the student?',help:'Your best reading so far. It chooses which assessment comes next.',o:[['escape','Out of work or a demand'],['attention','Attention from adults or peers'],['item','An item or an activity'],['alone','Nothing from others: it happens alone too'],['none','No lead yet']],when:a=>a.stage==='unclear'}],
  steps:(a,au)=>{const L=[];
   if(a.consent!=='yes')L.push(f('IC-1',W.ic));
   if(a.danger==='yes')L.push(f('CR-1',W.crNow));
   if(a.stage==='start'){L.push(f('RR-1',W.rr),f('TB-1',W.tb),
     f('IA-1','Rating scales and questionnaires for the people who know the student. Quick to collect; treat the result as a lead, not as proof.'),
     f('IN-1','Interview the teacher, the aide and the family: what happens just before, just after, and when it never happens.'),
     f('SI-1','Ask the student, at the level they can take part: what is hard, what they want, and whether they agree to the assessment.'));
     if(a.when==='meals')L.push(f('FD-1','Mealtime problems have their own record: what is offered, eaten and refused, and what the adults do. Ask the family to have a doctor rule out a medical cause before any feeding plan.'));
     if(a.when==='all')L.push(f('SP-1','Mark when the behavior happens across the day for a week or two. The pattern shows when to observe.'));
     L.push(f('OB-1','Watch where it happens. Note what the adults and the peers do, not only what the student does.'),f('ABC-1',W.abc),f('DD-1',W.base),f('FS-1',W.fs));}
   if(a.stage==='have')L.push(f('TB-1','Check the definition against what you saw: would two observers count the same thing?'),f('ABC-1',W.abc),f('DD-1',W.base),f('FS-1',W.fs));
   if(a.stage==='unclear'){
     if(a.lead==='alone')L.push(f('ME-1','Behavior that happens alone, or that began suddenly, can come from pain or illness. Record what is known and ask for a medical check before going further.'),f('MS-1','List the medications and any change in dose or timing. Side effects can look like behavior.'));
     if(a.lead==='escape')L.push(f('DA-1','Find which demands set the behavior off and which do not. It tells you what to put in the test and, later, what to teach first.'));
     if(a.lead==='attention'||a.lead==='item')L.push(f('PA-1','Find the items and the kind of attention the student prefers. They are what the test conditions deliver.'));
     if(a.lead==='none')L.push(f('VI-1','Change one thing at a time (the task, the person, the place, the time) to see which one the behavior follows.'));
     L.push(f('EA-1',a.danger==='yes'?'Test the lead under controlled conditions. Because the behavior can hurt someone: keep sessions short, end each one at the first instance or measure a milder behavior that comes before it, and have the crisis plan and a second trained adult in the room.':'Test the lead under controlled conditions: one that should set the behavior off and one that should not, taken in turn until the difference is clear.'),f('FS-1',W.fs));}
   return L;}},
 {id:'plan',g:0,t:'Write or change a behavior plan',s:'Write or change a plan',d:'From the function to the written plan, its goals and the crisis page',next:['train','data'],
  q:[{k:'fn',t:'Is the function of the behavior known?',help:'Why it happens: what it gets the student, or gets the student out of.',o:[['yes','Yes'],['no','Not yet']],auto:F=>F.fn?'yes':undefined,said:'A function is on file (Form FS-1)',go:{no:['why','A plan that does not match the function can make the behavior worse. The assessment comes first.']}},
   {k:'kind',t:'A new plan, or a change to one that is running?',o:[['new','A new plan'],['change','A change to a running plan']]},
   {k:'reason',t:'What is the reason for the change?',o:[['flat','The data are not improving'],['hard','Staff cannot run it as written'],['fade','It works: time to thin or fade it'],['newbx','A new behavior has appeared']],when:a=>a.kind==='change'},
   Object.assign({},Q.danger,{when:a=>a.kind==='new'}),Q.sib],
  steps:(a,au)=>{if(a.kind==='new')return [
     f('FS-1','Read the summary once more: the plan answers this function and no other.'),
     f('PA-1','Find what the student will work for now. Preferences change; last year’s list is a guess.'),
     f('SI-1','Ask the student what they would choose. A plan the student has a say in is kinder and easier to run.'),
     f('TD-1','Build the plan from the function: what to change beforehand, what to teach in place of the behavior, and how adults respond. Each option shows the studies behind it.'),
     f('GB-1','Write the goals and objectives the plan is measured by, in words that can be counted.'),
     f('CR-1',a.danger==='yes'?'Write what adults do at each stage when the behavior becomes dangerous. Staff need this page before the plan starts.':'Every plan has its crisis page, even when a crisis is unlikely: who does what if the behavior escalates.'),
     a.sib==='yes'&&f('IM-1','Set up the injury record so that the plan’s effect on injuries can be seen week by week.'),
     f('CF-1','Check the plan against the room it will run in: the time, the people, the materials. A plan staff cannot run is not a plan.'),
     f('IC-1','The plan needs the parent’s consent as well. Record it here.'),
     c('ready','Check it is ready to start','A last look at what the plan still needs before its first day.','Open Ready to start')];
   if(a.reason==='flat')return [f('DD-1','Look at the graph first: level, trend, and how much the points jump. Say what “not improving” means in numbers.'),f('TI-1','Was the plan run as written? A plan that was not run cannot be judged.'),f('RA-1','Test whether the reward still works. An item the student likes is not always one the student will work for.'),f('FS-1','Read the function against the new data. If it no longer fits, the assessment needs another look.'),f('TD-1','Change one thing at a time, so that the graph can show what it did.'),f('ST-1','Show staff the change before it starts.'),f('PR-1',W.pr)];
   if(a.reason==='hard')return [f('TI-1','See which steps are missed. One hard step is a different problem from a plan nobody follows.'),f('PD-1','Find the reason before retraining: do staff know how, do they have the time and the materials, and does anyone notice when they do it right?'),f('CF-1','Ask the staff what gets in the way in this room.'),f('TD-1','Simplify: a few steps done every time beat a full plan done sometimes.'),f('ST-1','Train the simpler plan to the same standard.'),f('PR-1',W.pr)];
   if(a.reason==='fade')return [f('DD-1','Confirm the gain holds before thinning: several weeks at or near the aim.'),f('SR-1','Thin the schedule in small steps, each held until the data stay steady.'),f('DT-1','Teach waiting: the reward comes a little later at each step.'),f('RM-1','Plan for setbacks: new staff, a break, a change of schedule. Decide now what happens if the behavior returns.'),f('SV-1','Ask the student, the staff and the family whether the result matters to them.'),f('PR-1',W.pr)];
   return [f('TB-1',W.tb),f('ABC-1',W.abc),f('FS-1','Does the new behavior serve the same function? If so, the plan may need one more replacement skill, not a second plan.'),f('TD-1','Add to the plan only what the new behavior needs.'),f('GB-1','Write the goal the new behavior is measured by.'),f('ST-1','Show staff what is new, and have each one practice it once.')];}},
 {id:'system',g:0,t:'Set up a reward system',s:'Set up a reward system',d:'A token board, a point sheet, a class-wide system, or teaching to wait',next:['train','data'],
  q:[{k:'kind',t:'Which kind of system?',o:[['token','A token board for one student'],['points','A point sheet or self-monitoring'],['class','A whole-class system'],['wait','Teaching the student to wait for a reward']]}],
  steps:a=>a.kind==='token'?[f('PA-1','Start with what is worth earning. A token is only worth what it buys.'),c('tokens','Watch: token economies','Three short videos: building the board, the schedules, and running it.','Watch the videos'),f('TE-1','Set the rules: what earns a token, how many buy the reward, and when they are traded in.'),f('TK-1','Make the board itself: the pictures, the spaces, and where the reward is shown.'),f('SR-1','Plan how the price rises as the student succeeds.'),f('ST-1','Train the adults to give tokens the same way.')]:
   a.kind==='points'?[f('SM-1','Set up the sheet: the behaviors in the student’s own words, how often it is marked, and what the points earn.'),f('PA-1','Check what the points should buy.'),f('ST-1','Teach the student and the teacher to mark it the same way; compare their marks at first.'),f('DD-1','Graph the points beside the behavior data.')]:
   a.kind==='class'?[f('GC-1','Choose the kind of group system and its rules. Check that no one student can lose it for everybody.'),c('gbg','Watch: the Good Behavior Game','One class-wide system from start to finish.','Watch the video'),f('PA-1','Ask the class what they would work for.'),f('ST-1','Train the teacher: the rules, the count, the reward, every day the same.')]:
   [f('DT-1','Find how long the student can wait now, then lengthen the wait in small steps with something to do meanwhile.'),f('AD-1','Small rewards often, or a larger one saved up? The form compares the two for this student.'),f('SR-1','Write the steps of the schedule.'),f('ST-1','Train the adults to keep to the wait and what they say during it.')]},
 {id:'train',g:1,t:'Train the people who run the plan',s:'Train staff or family',d:'A teacher, a paraprofessional, an RBT or the family',next:['check','data'],
  q:[{k:'who',t:'Who are you training?',o:[['staff','A teacher or paraprofessional'],['rbt','An RBT'],['family','A parent or caregiver'],['brief','People who see the student now and then: the bus, the cafeteria, a substitute']]},
   {k:'first',t:'The first training on this plan, or a refresher?',o:[['first','The first training'],['again','A refresher']],when:a=>a.who==='staff'||a.who==='rbt'}],
  steps:a=>a.who==='family'?[f('SV-1','Ask the family what matters to them and what they can keep up at home. Start from there.'),f('CT-1','Teach one thing at a time: explain, show, let them try, and praise what went right.'),c('videos','Share a video',W.vids,'Open the videos'),f('HD-1','A simple sheet for home: one or two things to mark, not ten.'),f('CN-1',W.note)]:
   a.who==='brief'?[f('EB-1','One page for people who see the student now and then: what to do, what not to do, and who to call.'),f('CR-1','Give them the crisis page as well. They are often the first adult there.')]:
   a.first==='again'?[f('TI-1','Start from the last integrity check: which steps are missed?'),f('PD-1','Find the reason before retraining: skill, time and materials, or nobody noticing.'),f('ST-1','Retrain only the missed steps: show, practice, feedback.'),c('videos','Show the procedure on video',W.vids,'Open the videos'),f('TI-1','Check again within two weeks.','Treatment Integrity: the next check','TI-1#2')]:
   [f('QS-1','One page that tells staff what to do first. Hand it out before the training, not after.'),c('videos','Show the procedure on video',W.vids,'Open the videos'),f('ST-1','Train to a standard, not to a signature: explain, show, have each person do it, give feedback, and repeat until every step is right.'),f('VS-1','Make the materials the plan calls for before the first day: visuals, choice boards, break cards.'),f('TV-1','For a plan many people will run: script and record a short training video from the case, to show at this training and to new staff later.'),c('kit','Print the staff kit','The data sheet, the point sheet and the quick start for next week, in one print.','Staff kit'),f('TI-1','Plan the first check for the first week: watch the plan being run and score each step.'),a.who==='rbt'&&f('RS-1','Log the training contact in the supervision log.')]},
 {id:'data',g:1,t:'Collect data or read the data',s:'Collect or read data',d:'Set up a data sheet, enter the day, read the graph',next:['review','check'],
  q:[{k:'what',t:'What do you need to do with the data?',o:[['setup','Set up data collection for a behavior'],['enter','Enter data'],['read','Read the graph and decide'],['skill','Take data on a skill being taught'],['practice','Practice counting first'],['home','Send a data sheet home']]},
   {k:'shape',t:'How does the behavior show up?',o:[['count','Separate times you can count'],['lasts','It lasts: the time matters more than the count'],['cant','Too fast or too often to count, or nobody can watch the whole time']],when:a=>a.what==='setup'}],
  steps:a=>a.what==='setup'?[f('TB-1','Data are only as good as the definition. Check that it says what counts and what does not.'),
     a.shape==='cant'&&f('MT-1','Use intervals or time samples: mark whether the behavior happened in each short period. The form helps choose the interval and shows how far the estimate can be off.'),
     f('DD-1',a.shape==='lasts'?'Set the behavior up by duration: how long each time, or the total for the day.':a.shape==='cant'?'Set the behavior up as a percent of intervals and enter each day’s figure.':'Set the behavior up as a count, or as a rate when the time watched changes from day to day.'),
     c('practice','Practice counting with a second person',W.count,'Practice counting'),c('kit','Print the sheets','The data sheet and the point sheet for next week, in one print.','Staff kit')]:
   a.what==='enter'?[f('DD-1','Enter each day while it is fresh. Mark the days with no school or no data: an empty day is not a zero.'),c('week','Close the week','The summary, next week’s sheet and the point sheets in one print.','End of the week')]:
   a.what==='read'?[f('DD-1','Open Graphs & analysis. Read level, trend and how much the points jump, phase by phase, before the sentence under the graph.'),f('TI-1','Check the plan was run on those days.'),f('PR-1','Apply your decision rules. '+W.pr),c('today','See what is due','Today lists what the case needs from you now.','Open Today')]:
   a.what==='practice'?[c('practice','Practice counting',W.count,'Practice counting')]:
   a.what==='skill'?[f('GB-1','Check that the objective says what counts as correct, and when the skill is mastered.'),f('SA-1','Record each trial, or each step of the task: correct, prompted or missed. The form graphs the percent and shows when mastery is met.'),f('ST-1','Check that everyone who teaches the skill prompts and records it the same way.')]:
   [f('HD-1','A simple sheet for home: one or two things to mark, not ten.'),f('CT-1','Show the family how to mark it, and agree when it comes back.')]},
 {id:'check',g:1,t:'Check the plan is run as written',s:'Check the plan is run right',d:'Treatment integrity, and what to do when it is low',next:['review','train'],
  q:[{k:'state',t:'Where are you with the integrity check?',o:[['first','I have not checked yet'],['low','I checked: steps are being missed'],['ok','I checked: it is run well']]}],
  steps:a=>a.state==='low'?[f('TI-1','See which steps are missed and by whom. One hard step is a different problem from a plan nobody follows.'),f('PD-1','Find the reason before retraining: do staff know how, do they have the time and the materials, and does anyone notice when they do it right?'),f('CF-1','Ask whether the plan fits the room it runs in.'),f('ST-1','Retrain the missed steps: show, practice, feedback.'),f('TD-1','If it still cannot be run, simplify the plan.'),f('TI-1','Check again within two weeks.','Treatment Integrity: the next check','TI-1#2')]:
   a.state==='ok'?[f('TI-1','Record the score and set the next check. Checks can be spaced out while the scores stay high.'),f('SV-1','Ask staff how the plan is going for them. High integrity with low acceptance does not last.'),f('PR-1','Note it in the periodic review.')]:
   [f('ST-1','Integrity is fair to measure only after training. Confirm who was trained and to what standard.'),f('TI-1','Watch the plan being run and score each step as done or not. Watch more than once, at different times.'),f('CN-1','Give feedback the same day: what went right first, then one thing to change.')]},
 {id:'review',g:1,t:'Decide whether the plan is working',s:'Is the plan working?',d:'A progress review: keep, change, thin or end',next:['plan','close'],
  q:[{k:'show',t:'What do the data show?',o:[['better','Clearly better'],['flat','No real change'],['worse','Worse'],['unsure','I cannot tell']]},
   {k:'early',t:'Did it get worse right after the plan started?',help:'When a plan stops a behavior from paying off, a short rise in the first days is expected.',o:YN,when:a=>a.show==='worse'}],
  steps:a=>a.show==='better'?[f('DD-1','Confirm it on the graph: a change in level that holds, not two good days.'),f('TI-1','Check the plan was run, so that the gain is the plan’s.'),f('SR-1','Thin the schedule in small steps.'),f('GB-1','Set the next objective: the gain is the new starting point.'),f('RM-1','Plan for setbacks before they come.'),f('SV-1','Ask whether the change matters to the student, the staff and the family.'),f('PR-1',W.pr)]:
   a.show==='flat'?[f('DD-1','Look at level, trend and how much the points jump. Say what would count as a change.'),f('TI-1','First question: was the plan run?'),f('RA-1','Test whether the reward still works. An item the student likes is not always one the student will work for.'),f('FS-1','Read the function again against what you now know.'),f('TD-1','Change one thing at a time.'),f('PR-1',W.pr)]:
   a.show==='unsure'?[f('DD-1','Take more days before deciding, and mark each change of condition on the graph.'),f('MT-1','If the numbers jump because the measure is rough, change the measure.'),c('practice','Check that two people count alike',W.count,'Practice counting'),f('PR-1','Write down what you will look for, and when.')]:
   [f('CR-1','First: check that staff are safe and know the crisis stages.'),f('DD-1','Find when the rise began and what changed on that day.'),
    a.early==='yes'?n('burst','Hold steady through a short rise','If the function is right and the plan is run every time, the rise is often short. Giving in now teaches the stronger behavior. Set a date and a number at which you will stop and change the plan; if anyone is at risk, follow the crisis plan.'):f('ME-1','Rule out illness, pain, poor sleep or a change at home.'),
    a.early!=='yes'&&f('MS-1','Note any medication change in the days before.'),a.early!=='yes'&&f('BC-1','If the behavior got better in one place and worse in another, compare the two settings.'),
    f('TI-1','Check the plan is run every time. A plan run now and then can make a behavior stronger.'),f('FS-1','Read the function again: a plan that makes things worse may be answering the wrong one.'),f('TD-1','Change the plan if the function or the fit is wrong.'),f('PR-1',W.pr)]},
 {id:'meet',g:2,t:'Get ready for a meeting',s:'Get ready for a meeting',d:'An IEP meeting, a parent conference, a team meeting',next:['review'],
  q:[{k:'kind',t:'Which meeting?',o:[['iep','An IEP meeting'],['parent','A parent conference'],['team','A team or consultation meeting']]},{k:'online',t:'Is the meeting online?',o:YN}],
  steps:a=>{const g=f('DD-1',a.online==='yes'?'Open Graphs & analysis and use Share view: one graph on the whole screen, with initials in place of the name.':'Open Graphs & analysis and print or save the graphs you will show.');
   return a.kind==='iep'?[c('iep','Build the IEP meeting packet','Present levels, goals, the plan and progress, drawn from the case and ready to copy or print.','IEP meeting packet'),g,f('GB-1','Check each goal against the data: met, continuing, or to be rewritten.'),f('SV-1','Bring what the family and the teacher said about the plan.'),c('packet','Build the packet','Tick the forms the team needs: one document with a cover and contents.','Build packet'),f('CN-1','After the meeting: '+W.note,'After the meeting: the note')]:
   a.kind==='parent'?[g,f('SV-1','Ask what matters to the family before you show anything.'),f('CT-1','Agree one thing to try at home.'),f('HD-1','Give a simple sheet for it.'),f('CN-1','After the meeting: '+W.note,'After the meeting: the note')]:
   [c('today','See what the case needs','Today lists what is due, what home has not heard, and the aims met.','Open Today'),g,f('TI-1','Bring the integrity scores: the team should know whether the plan was run.'),f('CN-1','After the meeting: '+W.note,'After the meeting: the note')];}},
 {id:'incident',g:2,t:'Record something that happened',s:'Record an incident',d:'A crisis, a restraint, an injury, a medical event',next:['review'],
  q:[{k:'what',t:'What happened?',o:[['crisis','A crisis or dangerous behavior'],['restraint','A restraint or seclusion'],['injury','An injury'],['medical','A seizure or other medical event'],['other','Another incident to log']]}],
  steps:a=>a.what==='crisis'?[f('CR-1','Record the event and debrief with the adults who were there while it is fresh: what set it off, what worked, what to change.'),f('DD-1',W.log),f('CN-1',W.note),f('PR-1','More than one crisis in a short time is a reason to review the plan.')]:
   a.what==='restraint'?[f('CR-1','Record it today: what led to it, how long it lasted, who was there, and any injury. Your district’s rules set who must be told and by when.'),c('today','See what is now due','Today shows the notice to the family as due until it is recorded.','Open Today'),f('IM-1','Check the student for marks or injury and record what you find.'),f('DD-1',W.log),f('PR-1','A restraint is a signal to review the plan and its crisis stages.')]:
   a.what==='injury'?[f('IM-1','Record where the injury is and how severe, with a photo if your permissions allow it.'),f('ME-1','If a nurse or a doctor was involved, record it.'),f('DD-1',W.log),f('CR-1','If it happened during a crisis, record the event and debrief.')]:
   a.what==='medical'?[f('ME-1','Record what was seen, when it began and ended, and who responded.'),f('MS-1','Note any medication change in the days before.'),f('DD-1','Mark the day in the data, so that the graph is read with it in mind.')]:
   [f('ABC-1',W.abc),f('DD-1',W.log)]},
 {id:'super',g:2,t:'Supervise an RBT or trainee',s:'Supervise an RBT',d:'The supervision log, an observation, feedback',next:['train'],
  q:[{k:'what',t:'What do you need to do?',o:[['log','Log a supervision contact'],['observe','Observe and give feedback'],['new','Start with a new RBT or trainee'],['fix','Help someone who is struggling']]}],
  steps:a=>{const log=(t,w)=>c('rbt',t,w,'RBT Supervision Log');
   return a.what==='log'?[log('Open the supervision log','It opens on its own, away from any student’s case. Record the date, the time, what was observed and the feedback.')]:
   a.what==='observe'?[f('TI-1','Score the session step by step while you watch.'),f('ST-1','Mark the skills shown to standard, and the ones to practice.'),log('Log the contact','Record the date, the time and the feedback given.')]:
   a.what==='new'?[log('Start their supervision log','One log for each supervisee, kept apart from the students’ cases.'),c('learn','Assign the training units','The RBT track: 46 units, each with a short test. Their record can be sent to you.','Open Learning'),c('practice','Practice counting together',W.count,'Practice counting'),f('ST-1','Check each skill in person before they work alone.')]:
   [f('PD-1','Find the reason first: skill, time and materials, or nobody noticing when it is done right.'),f('ST-1','Train what is missing: show, practice, feedback.'),c('videos','Assign the matching videos',W.vids,'Open the videos'),log('Log the contact','Record what you saw, what you taught and when you will look again.')];}},
 {id:'learn',g:2,t:'Learn or refresh a procedure',s:'Learn a procedure',d:'Videos, drawn scenes, counting practice, lessons, the research',next:[],
  q:[{k:'what',t:'What would you like to do?',o:[['video','Watch a procedure video'],['explain','Step through a procedure in a drawn scene'],['practice','Practice counting behavior'],['lesson','RBT training units or BCBA study'],['bank','Look up what the research did']]}],
  steps:a=>a.what==='video'?[c('videos','Watch a procedure video',W.vids,'Open the videos')]:a.what==='explain'?[c('explain','Step through a drawn scene','Drag through a procedure moment by moment and see what the adult does at each one.','Open the explainers')]:
   a.what==='practice'?[c('practice','Practice counting',W.count,'Practice counting')]:a.what==='lesson'?[c('learn','Open Learning','The RBT training units and the BCBA study track, with your record.','Open Learning')]:
   [f('TD-1','The bank holds more than 3,000 procedures read from the journals. Search by behavior, function or procedure; “Most evidence first” puts the best-tested at the top.')]},
 {id:'close',g:2,t:'Hand over or close a case',s:'Hand over or close a case',d:'A move, the end of the plan, the end of the year',next:['new'],
  q:[{k:'kind',t:'What is ending?',o:[['move','The student is moving to another school or analyst'],['exit','The student no longer needs the plan'],['year','The school year']]}],
  steps:a=>{const ho=c('handover','Run the hand-over check','It lists what the case is missing before someone else takes it.','Hand-over check'),sv=c('save','Save the case',W.save,'Save case'),pk=c('packet','Build the packet','Tick the forms the next team needs: one document with a cover and contents.','Build packet');
   return a.kind==='move'?[ho,f('PR-1','Write where things stand: what works, what was tried, what comes next.'),f('RM-1','Tell the next team what to expect. A new place often brings a behavior back for a while.'),pk,sv,c('close','Close the case','It saves once more and clears the forms for the next student.','Close case')]:
   a.kind==='exit'?[f('DD-1','Show the data that support ending: the aim met, and held.'),f('RM-1','Plan the follow-up: who watches for a return, and what they do.'),f('SV-1','Ask the student, the staff and the family whether they agree it is time.'),f('PR-1','Record the exit decision and who agreed.'),ho,sv,c('close','Close the case','It saves once more and clears the forms for the next student.','Close case')]:
   [f('PR-1','Summarize the year: where the student began, where things stand, what comes next.'),f('DD-1','Graphs & analysis can compare the school years on one graph.'),f('RM-1','Plan the return: a long break often brings some behavior back.'),ho,pk,sv];}}];
const GROUPS=['A student and a plan','While the plan runs','People, events and you'];
const task=id=>TASKS.find(t=>t.id===id);
/* what the open case already says */
function facts(){let fx={};try{fx=state.facts||{};}catch(e){}let who='';try{who=String(packet().client||'').trim();}catch(e){}
  const used=id=>{try{const st=state.status[id]||(state.pending[id]||{}).status;return !!(st&&st.filled>4);}catch(e){return false;}};
  if(!who)return {student:false,used:()=>false,consent:false,targets:0,fn:false,goals:false,plan:false,crisis:false};
  let cs={on:false};try{cs=csOf(fx);}catch(e){}
  const tg=(fx.behaviors||[]).filter(b=>!b.isRep&&!/replacement|alternative/i.test(b.type||''));
  return {student:true,used,consent:!!cs.on,targets:tg.length,fn:!!(fx.fn&&(fx.fn.key||fx.fn.label)),goals:!!(fx.goals&&((fx.goals.red||[]).length||(fx.goals.acq||[]).length)),plan:!!fx.plan,crisis:!!(fx.crisis&&(fx.crisis.stages||[]).length)};}
function hint(s,F){if(s.cmd==='student')return F.student?'A student is open':'';if(!s.form)return '';const id=s.form;
  if(id==='IC-1'&&F.consent)return 'Consent is on file';if(id==='TB-1'&&F.targets)return F.targets+' target behavior'+(F.targets===1?'':'s')+' defined';
  if(id==='FS-1'&&F.fn)return 'A function is on file';if(id==='GB-1'&&F.goals)return 'Goals are written';if(id==='CR-1'&&F.crisis)return 'Crisis stages are written';
  if(id==='TD-1'&&F.plan)return 'A plan is on file';return F.used(id)?'Started in this case':'';}
/* with a case open: the kind of work the case seems to need next */
function suggest(F){if(!F.student)return null;
  if(!F.consent)return ['new','no consent is on file yet'];if(!F.targets)return ['new','no target behavior is defined yet'];
  if(!F.fn)return ['why','the behavior is defined, and no function is on file yet'];if(!F.plan)return ['plan','a function is on file, and no plan is written yet'];
  if(!F.used('ST-1'))return ['train','a plan is written, and no staff training is recorded'];if(!F.used('TI-1'))return ['check','staff are trained, and no integrity check is recorded'];
  return ['review','the plan is running'];}
/* ---- the state ---- */
const KEY='nbh.guide.v1';
let S=null;   /* {task, a:{answers}, au:{answers taken from the case}, keys:[step keys], i, mark:{key:'d'|'s'}, run, went:{key:1}} */
const keep=()=>{try{if(S)sessionStorage.setItem(KEY,JSON.stringify(S));else sessionStorage.removeItem(KEY);}catch(e){}paintPills();};
function load(){let j=null;try{j=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(e){}const t=j&&task(j.task);if(!t||!j.a||typeof j.a!=='object')return null;
  const a={},au={};t.q.forEach(q=>{const v=j.a[q.k];if(q.o.some(o=>o[0]===v)||(q.go&&v==='anyway')){a[q.k]=v;if(j.au&&j.au[q.k])au[q.k]=1;}});
  const s={task:t.id,a,au,i:0,mark:{},went:{},run:!!j.run,keys:[]};const L=stepsOf(s);s.keys=L.map(x=>x.k);
  if(j.mark&&typeof j.mark==='object')s.keys.forEach(k=>{if(j.mark[k]==='d'||j.mark[k]==='s')s.mark[k]=j.mark[k];});
  s.i=Math.max(0,Math.min(L.length-1,parseInt(j.i,10)||0));if(!L.length)s.run=false;return s;}
function stepsOf(s){const t=task(s.task);let L=[];try{L=(t.steps(s.a,s.au||{})||[]).filter(Boolean);}catch(e){L=[];}
  if(ONE||!window.__wsVideos)L=L.filter(x=>!(x.cmd&&VIEWER[x.cmd]));const seen={};return L.filter(x=>seen[x.k]?false:(seen[x.k]=1));}
/* the questions still to ask, in order: one a case answers is filled in and passed over */
function nextQ(s,F){const t=task(s.task);for(const q of t.q){if(s.a[q.k]!==undefined)continue;if(q.when&&!q.when(s.a))continue;
    const v=q.auto?q.auto(F):undefined;if(v!==undefined){s.a[q.k]=v;s.au[q.k]=1;continue;}return q;}return null;}
const asked=s=>task(s.task).q.filter(q=>s.a[q.k]!==undefined&&!s.au[q.k]);
/* ---- read aloud (v26.14; the BCBA, 11/13: "an option that reads the question to you as you go") ----
   The device's own speech (speechSynthesis): a voice kept on the device is chosen where there is one. What is read is the
   guide's own words: the question, its choices, the step and its reason. The choice is kept on the device
   (nbh.guide.voice). Nothing is read until Read aloud is turned on, and nothing on a page that has just loaded. */
const VK='nbh.guide.voice',CAN=typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined';
let voice=false;try{voice=CAN&&localStorage.getItem(VK)==='1';}catch(e){}
let lastSaid='',saidBy='',primed=false;
function hush(){if(CAN)try{speechSynthesis.cancel();}catch(e){}}
function prime(){if(!voice||primed||!CAN)return;primed=true;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}catch(e){}}   /* inside the tap: an iPhone or iPad lets a page speak only after one */
function say(t,by){lastSaid=t||'';saidBy=by||'dlg';if(!voice||!CAN||!t)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';
    const vs=speechSynthesis.getVoices()||[],v=vs.find(x=>x.localService&&/^en[-_]US/i.test(x.lang))||vs.find(x=>x.localService&&/^en/i.test(x.lang));if(v)u.voice=v;
    primed=true;speechSynthesis.speak(u);}catch(e){}}
function paintVoice(){document.querySelectorAll('[data-gd="voice"],#gdVoice').forEach(b=>b.setAttribute('aria-pressed',voice?'true':'false'));document.querySelectorAll('[data-gd="again"],#gdAgain').forEach(b=>{b.hidden=!voice;});}
function setVoice(on,text,by){voice=!!on&&CAN;try{localStorage.setItem(VK,voice?'1':'0');}catch(e){}paintVoice();if(voice)say(text===undefined?lastSaid:text,by||saidBy);else hush();}
const SPK='<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2h2.3L8 3.5v9L4.8 9.8H2.5z"/><path d="M10.5 6a2.8 2.8 0 0 1 0 4M12.3 4.2a5.3 5.3 0 0 1 0 7.6"/><\/svg>';
const vRow=()=>CAN?'<div class="gd-vrow"><button type="button" class="gd-again" data-gd="again"'+(voice?'':' hidden')+'>Say it again<\/button><button type="button" class="gd-voice" data-gd="voice" aria-pressed="'+(voice?'true':'false')+'" title="Reads each question, its choices and each step to you">'+SPK+'<span>Read aloud<\/span><\/button><\/div>':'';
const list=a=>a.length?' The choices are: '+a.join('. ')+'.':'';
/* ---- the dialog ---- */
const dlg=()=>$('#dlg');
function show(title,html,screen,speak){const d=dlg(),body='<div class="gd" data-gdscreen="'+screen+'">'+vRow()+html+'<\/div>';
  if(d.open){$('#dlgTitle').innerHTML=title;$('#dlgBody').innerHTML=body;$('#dlgBody').scrollTop=0;}else dialog(title,body);
  const b=$('#dlgBody');if(b.scrollHeight>b.clientHeight+2)b.tabIndex=0;else b.removeAttribute('tabindex');
  const first=b.querySelector('[data-gdfocus]')||b.querySelector('.gd button:not(.gd-voice):not(.gd-again)');if(first)try{first.focus();}catch(e){}
  say(speak||'','dlg');}
const isOpen=()=>{const d=dlg();return !!(d&&d.open&&$('#dlgBody .gd'));};
const shut=()=>{const d=dlg();if(d&&d.open)try{d.close();}catch(e){}};
async function fresh(){try{if(typeof gatherFacts==='function')await gatherFacts(false);}catch(e){}return facts();}
async function openTasks(){const F=await fresh(),sg=suggest(F),run=S&&S.run?S:null;let h='';
  if(run){const L=stepsOf(run),t=task(run.task);h+='<div class="gd-sug"><p><b>In hand:<\/b> '+E(t.t)+', step '+(run.i+1)+' of '+L.length+'.<\/p><button type="button" class="primary" data-gd="resume" data-gdfocus>Carry on<\/button><button type="button" data-gd="plan">See the steps<\/button><\/div>';}
  else if(sg){h+='<div class="gd-sug"><p><b>For the case that is open:<\/b> '+E(task(sg[0]).t)+'. In this case, '+E(sg[1])+'.<\/p><button type="button" class="primary" data-gd="task" data-id="'+sg[0]+'" data-gdfocus>Start there<\/button><\/div>';}
  h+='<p class="gd-lead">Choose one. A question or two follows, then the steps come one at a time.<\/p>';
  GROUPS.forEach((g,gi)=>{h+='<h3>'+E(g)+'<\/h3><ul class="gd-list two">'+TASKS.filter(t=>t.g===gi).map(t=>'<li><button type="button" class="gd-opt" data-gd="task" data-id="'+t.id+'"><b>'+E(t.t)+'<\/b><small>'+E(t.d)+'<\/small><\/button><\/li>').join('')+'<\/ul>';});
  show('What do you need to do today?',h,'tasks','What do you need to do today?'+(run?' In hand: '+task(run.task).t+', step '+(run.i+1)+'.':sg?' For the case that is open: '+task(sg[0]).t+'.':'')+list(TASKS.map(t=>t.t)));}
function begin(id){const t=task(id);if(!t)return;S={task:id,a:{},au:{},keys:[],i:0,mark:{},went:{},run:false};keep();ask();}
async function ask(){const F=await fresh(),q=nextQ(S,F),t=task(S.task);keep();if(!q){plan(F);return;}
  const nAsked=asked(S).length;
  let h='<p class="gd-sm">Question '+(nAsked+1)+'<\/p><p class="gd-q" id="gdQ">'+E(q.t)+'<\/p>'+(q.help?'<p class="gd-sm">'+E(q.help)+'<\/p>':'');
  h+='<ul class="gd-list" role="group" aria-labelledby="gdQ">'+q.o.map((o,i)=>'<li><button type="button" class="gd-opt" data-gd="ans" data-k="'+q.k+'" data-v="'+o[0]+'"'+(i?'':' data-gdfocus')+'><b>'+E(o[1])+'<\/b><\/button><\/li>').join('')+'<\/ul>';
  h+='<div class="gd-foot"><button type="button" data-gd="back">Back<\/button><\/div>';
  show(E(t.t),h,'q',q.t+(q.help?' '+q.help:'')+list(q.o.map(o=>o[1])));}
function answer(k,v){const t=task(S.task),q=t.q.find(x=>x.k===k);if(!q||!q.o.some(o=>o[0]===v))return;
  if(q.go&&q.go[v]){const to=task(q.go[v][0]);
    show(E(t.t),'<p class="gd-q">'+E(to.t)+' comes first<\/p><p class="gd-lead">'+E(q.go[v][1])+'<\/p><div class="gd-foot"><button type="button" class="primary" data-gd="task" data-id="'+to.id+'" data-gdfocus>Go to “'+E(to.t)+'”<\/button><button type="button" data-gd="anyway" data-k="'+k+'">Carry on with the plan anyway<\/button><span class="sp"><\/span><button type="button" data-gd="back0">Back<\/button><\/div>','go',to.t+' comes first. '+q.go[v][1]+list(['Go to that guide','Carry on with the plan anyway']));return;}
  S.a[k]=v;delete S.au[k];ask();}
/* Back, in the questions: the last one asked is asked again; from the first, back to the list */
function back(){const A=asked(S);if(!A.length){S=null;keep();openTasks();return;}const last=A[A.length-1],t=task(S.task);
  const i=t.q.indexOf(last);t.q.slice(i).forEach(q=>{delete S.a[q.k];delete S.au[q.k];});ask();}
function said(s){const out=[];task(s.task).q.forEach(q=>{const v=s.a[q.k];if(v===undefined)return;if(s.au[q.k])out.push('<li>Taken from the case: '+E(q.said||q.t)+'.<\/li>');else{const o=q.o.find(x=>x[0]===v);out.push('<li>'+E(q.t)+' <b>'+E(o?o[1]:v==='anyway'?'Not yet: carrying on anyway':v)+'<\/b><\/li>');}});return out.join('');}
function plan(F){F=F||facts();const t=task(S.task),L=stepsOf(S);
  if(!S.run){S.keys=L.map(x=>x.k);S.i=0;S.mark={};S.went={};}keep();
  let h='<ul class="gd-said">'+said(S)+'<\/ul>';
  h+='<p class="gd-lead">'+(L.length===1?'One step.':L.length+' steps, one at a time.')+' Each opens what it needs; the guide stays at the foot of the screen while you work.<\/p>';
  h+='<div class="gd-foot gd-top"><button type="button" class="primary" data-gd="start" data-gdfocus>'+(S.run?'Carry on with step '+(S.i+1):L.length===1?'Start':'Start with step 1')+'<\/button><button type="button" data-gd="redo">Change the answers<\/button><span class="sp"><\/span><button type="button" data-gd="tasks">Something else<\/button>'+(S.run?'<button type="button" data-gd="end">End the guide<\/button>':'')+'<\/div>';
  h+='<ol class="gd-steps">'+L.map((s,i)=>{const m=S.mark[s.k],hi=hint(s,F);return '<li class="'+(m==='d'?'gd-d':m==='s'?'gd-s':'')+(S.run&&i===S.i?' gd-cur':'')+'"><button type="button" data-gd="jump" data-i="'+i+'"'+(S.run&&i===S.i?' aria-current="step"':'')+'><span><b>'+E(s.t)+'<\/b>'+(s.form?'<span class="gd-id">Form '+E(s.form)+'<\/span>':'')+(hi?'<span class="gd-chip">'+E(hi)+'<\/span>':'')+(m==='s'?'<span class="gd-chip">Skipped<\/span>':'')+'<\/span><small>'+E(s.why)+'<\/small><\/button><\/li>';}).join('')+'<\/ol>';
  show(E(t.t),h,'plan',t.t+'. '+(L.length===1?'One step: ':L.length+' steps, one at a time. '+(S.run?'You are at step '+(S.i+1)+': ':'The first is: '))+(L[S.run?S.i:0]||{t:''}).t+'.');}
function finish(){const t=task(S.task),L=stepsOf(S),done=L.filter(s=>S.mark[s.k]==='d').length,sk=L.filter(s=>S.mark[s.k]==='s');
  let h='<p class="gd-q">That was the last step<\/p><p class="gd-lead">'+E(t.t)+': '+done+' of '+L.length+' step'+(L.length===1?'':'s')+' done'+(sk.length?', '+sk.length+' skipped':'')+'.<\/p>';
  if(sk.length)h+='<p class="gd-sm">Skipped: '+sk.map(s=>E(s.t)).join('; ')+'.<\/p>';
  const nx=(t.next||[]).map(task).filter(Boolean);
  if(nx.length)h+='<h3>What often comes next<\/h3><ul class="gd-list">'+nx.map((x,i)=>'<li><button type="button" class="gd-opt" data-gd="task" data-id="'+x.id+'"'+(i?'':' data-gdfocus')+'><b>'+E(x.t)+'<\/b><small>'+E(x.d)+'<\/small><\/button><\/li>').join('')+'<\/ul>';
  h+='<div class="gd-foot"><button type="button" data-gd="tasks">Something else<\/button><span class="sp"><\/span><button type="button" data-gd="shut">Close<\/button><\/div>';
  S=null;keep();paintBar();show('The guide',h,'end','That was the last step. '+(nx.length?'What often comes next: '+nx.map(x=>x.t).join('. ')+'.':''));}
/* ---- the strip ---- */
let bar=null;
function mkBar(){if(bar)return bar;const host=document.querySelector('section.stagew');if(!host)return null;
  bar=document.createElement('div');bar.id='gdBar';bar.hidden=true;bar.setAttribute('role','region');bar.setAttribute('aria-label','Guide: the step in hand');
  bar.innerHTML='<div class="gd-txt"><p class="gd-n"><span id="gdCount"><\/span><button type="button" class="gd-link" id="gdAll">All steps<\/button><button type="button" class="gd-link" id="gdWhyBtn" aria-expanded="false" aria-controls="gdWhy">Why this step<\/button>'+(CAN?'<button type="button" class="gd-link" id="gdVoice" aria-pressed="'+(voice?'true':'false')+'" title="Reads each step and its reason to you">Read aloud<\/button><button type="button" class="gd-link" id="gdAgain"'+(voice?'':' hidden')+'>Say it again<\/button>':'')+'<\/p><div aria-live="polite"><p class="gd-t" id="gdT"><\/p><p class="gd-why" id="gdWhy"><\/p><\/div><\/div>'+
    '<div class="gd-btns"><button type="button" id="gdBack">Back<\/button><button type="button" id="gdGo"><\/button><button type="button" id="gdSkip">Skip<\/button><button type="button" id="gdNext"><\/button><button type="button" id="gdEnd" aria-label="End the guide" title="End the guide">&times;<\/button><\/div>';
  host.appendChild(bar);
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!S)return;prime();
    if(b.id==='gdVoice'){setVoice(!voice,stepText(),'bar');return;}if(b.id==='gdAgain'){say(stepText(),'bar');return;}
    if(b.id==='gdGo'){run(true);return;}if(b.id==='gdNext'){move(1,'d');return;}if(b.id==='gdSkip'){move(1,'s');return;}if(b.id==='gdBack'){move(-1);return;}
    if(b.id==='gdAll'){plan();return;}if(b.id==='gdEnd'){end();return;}
    if(b.id==='gdWhyBtn'){const on=!bar.classList.contains('gd-open');bar.classList.toggle('gd-open',on);b.setAttribute('aria-expanded',on?'true':'false');}});
  return bar;}
const cur=()=>{if(!S||!S.run)return null;const L=stepsOf(S);return L[S.i]||null;};
const goLabel=s=>s.form?'Open Form '+s.form:(s.btn||'Open');
const stepText=()=>{const s=cur();if(!s)return '';const L=stepsOf(S);return 'Step '+(S.i+1)+' of '+L.length+'. '+s.t+(s.form?', Form '+s.form.split('').join(' ').replace(' - ',' ')+'':'')+'. '+s.why;};
let barSaid=null;
function paintBar(){const b=mkBar();if(!b)return;const s=cur();document.body.classList.toggle('gd-run',!!s);if(!s){b.hidden=true;return;}
  const L=stepsOf(S),t=task(S.task),last=S.i===L.length-1,went=!!S.went[s.k]||(s.form&&state.cur===s.form);
  $('#gdCount').innerHTML='<span class="gd-w">'+E(t.s)+': step '+(S.i+1)+' of '+L.length+'<\/span><span class="gd-s">Step '+(S.i+1)+' of '+L.length+'<\/span>';
  $('#gdT').innerHTML=E(s.t)+(s.form?'<span>Form '+E(s.form)+'<\/span>':'');$('#gdWhy').textContent=s.why;
  const go=$('#gdGo'),nx=$('#gdNext');go.hidden=!(s.form||s.cmd);go.innerHTML='<span class="gd-w">'+E(goLabel(s))+'<\/span><span class="gd-s">'+E(s.form?'Open '+s.form:(s.btn||'Open'))+'<\/span>';
  go.classList.toggle('primary',!went&&!go.hidden);nx.classList.toggle('primary',went||go.hidden);
  nx.innerHTML=last?'Done: finish':'<span class="gd-w">Done: next step<\/span><span class="gd-s">Done: next<\/span>';$('#gdBack').disabled=S.i===0;$('#gdSkip').hidden=last;
  b.hidden=false;
  /* a new step is read once: not again when a form opens or the strip is drawn anew, and not on a page that has just loaded */
  const sk=S.task+':'+S.i;if(barSaid===null)barSaid=sk;else if(sk!==barSaid){barSaid=sk;say(stepText(),'bar');}}
function run(byHand){const s=cur();if(!s)return;S.went[s.k]=1;keep();
  try{if(s.form)openForm(s.form);else if(s.cmd&&CMD[s.cmd])CMD[s.cmd]();}catch(e){}
  paintBar();if(byHand){const nx=$('#gdNext');if(nx&&document.activeElement===$('#gdGo')&&!(s.cmd))try{nx.focus();}catch(e){}}}
function move(d,mark){const L=stepsOf(S),s=L[S.i];if(mark&&s)S.mark[s.k]=mark;
  if(d>0&&S.i>=L.length-1){finish();return;}
  S.i=Math.max(0,Math.min(L.length-1,S.i+d));keep();paintBar();
  const now=cur();if(mark==='d'&&now&&now.form){run(false);}   /* "Done: next step" opens the next form; Skip and Back wait for the button */
  const focus=$('#gdGo').hidden||(now&&S.went[now.k])?$('#gdNext'):$('#gdGo');try{focus.focus();}catch(e){}}
function start(){const L=stepsOf(S);if(!L.length){shut();return;}const first=!S.run;S.run=true;keep();shut();barSaid='';paintBar();
  const s=cur();if(first&&s&&s.form)run(false);const b=$('#gdGo').hidden||(s&&S.went[s.k])?$('#gdNext'):$('#gdGo');setTimeout(()=>{try{b.focus();}catch(e){}},60);}
function end(){S=null;barSaid='';hush();keep();paintBar();try{if(window.wsUI&&wsUI.toast)wsUI.toast('The guide is closed. “Guide me” on the start screen opens it again.',{ms:5000});}catch(e){}}
/* the dialog's buttons */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#dlgBody .gd [data-gd]');if(!b)return;const k=b.dataset.gd;prime();
  if(k==='voice'){setVoice(!voice,undefined,'dlg');return;}if(k==='again'){say(lastSaid,'dlg');return;}
  if(k==='task'){begin(b.dataset.id);return;}if(k==='ans'){answer(b.dataset.k,b.dataset.v);return;}if(k==='back'){back();return;}if(k==='back0'){ask();return;}
  if(k==='anyway'){S.a[b.dataset.k]='anyway';delete S.au[b.dataset.k];ask();return;}
  if(k==='start'){start();return;}if(k==='resume'){shut();paintBar();return;}if(k==='plan'){plan();return;}
  if(k==='jump'){const i=parseInt(b.dataset.i,10),L=stepsOf(S);if(!(i>=0&&i<L.length))return;S.i=i;S.run=true;keep();shut();barSaid='';paintBar();const s=cur();if(s&&s.form)run(false);return;}
  if(k==='redo'){const id=S.task;begin(id);return;}if(k==='tasks'){openTasks();return;}if(k==='end'){shut();end();return;}if(k==='shut'){shut();return;}});
/* an answer of "anyway" stands for the question's "no" when the steps are drawn */
/* ---- the ways in ---- */
function paintPills(){const x=$('#gdStart');if(!x)return;const b=x.querySelector('[data-gdopen="resume"]');if(b)b.hidden=!(S&&S.run);}
function mkStart(){const card=$('#blank .card');if(!card||$('#gdStart'))return;const x=document.createElement('div');x.id='gdStart';x.className='gd-start';
  x.innerHTML='<h2 id="gdStartH">What do you need to do today?<\/h2><p>Pick one. A question or two follows, then the workstation takes you through the steps one at a time.<\/p>'+
    '<div class="gd-pills" role="group" aria-labelledby="gdStartH"><button type="button" class="gd-on" data-gdopen="resume" hidden>Carry on with the guide<\/button><button type="button" class="gd-narrow" data-gdopen="list">Show the '+TASKS.length+' kinds of work<\/button>'+TASKS.map(t=>'<button type="button" data-gdopen="'+t.id+'">'+E(t.s)+'<\/button>').join('')+'<\/div>';
  const h=[...card.children].find(el=>el.tagName==='H2');card.insertBefore(x,h||null);card.classList.add('has-gd');
  x.addEventListener('click',e=>{const b=e.target.closest('[data-gdopen]');if(!b)return;const id=b.dataset.gdopen;prime();if(id==='list'){openTasks();return;}if(id==='resume'){paintBar();const g=$('#gdGo');try{(g.hidden?$('#gdNext'):g).focus();}catch(e2){}return;}
    if(S&&S.run&&S.task!==id&&!confirm('A guide is in hand ('+task(S.task).t+'). Start this one instead?'))return;begin(id);});
  paintPills();}
{const pb=document.createElement('button');pb.type='button';pb.id='wsGuideBtn';pb.style.display='none';pb.tabIndex=-1;pb.setAttribute('aria-hidden','true');pb.textContent='Guide me';pb.addEventListener('click',()=>openTasks());document.body.appendChild(pb);}
try{const g=PH_MORE.find(x=>x[0]==='The workstation');if(g)g[1].unshift(['wsGuideBtn','Guide me: what do you need to do today?']);}catch(e){}
try{CMDS.push({k:'guide me guided mode what do i need to do today walk through step by step wizard help me start where do i begin new student fba plan train data meeting incident',n:'Guide me: what do you need to do today?',s:'command',go:()=>openTasks()});}catch(e){}
S=load();if(S&&!S.run)S=null;
if(!S)barSaid='';   /* with no guide in hand at load, the first step shown is read */
try{dlg().addEventListener('close',()=>{if(saidBy==='dlg')hush();});}catch(e){}   /* the dialog closed: what it was reading stops */
mkStart();mkBar();paintBar();
/* the form on screen changes: the strip's main button follows it */
try{const of0=openForm;openForm=function(){const r=of0.apply(this,arguments);try{if(S&&S.run)paintBar();}catch(e){}return r;};}catch(e){}
window.__wsGuide={open:()=>openTasks(),begin,state:()=>S?JSON.parse(JSON.stringify(S)):null,steps:()=>S?stepsOf(S).map(s=>({k:s.k,t:s.t,form:s.form||'',cmd:s.cmd||''})):[],tasks:()=>TASKS.map(t=>t.id),end,
  /* for the tests: every list of steps a task can give, by its answers */
  all:()=>{const out=[];TASKS.forEach(t=>{const rec=(qi,a)=>{const q=t.q.slice(qi).find(x=>a[x.k]===undefined&&(!x.when||x.when(a)));if(!q){out.push({task:t.id,a:Object.assign({},a),steps:stepsOf({task:t.id,a,au:{}}).map(s=>({k:s.k,t:s.t,why:s.why,form:s.form||'',cmd:s.cmd||''}))});return;}
      q.o.forEach(o=>{if(q.go&&q.go[o[0]])return;rec(t.q.indexOf(q)+1,Object.assign({},a,{[q.k]:o[0]}));});};rec(0,{});});return out;}};
})();
