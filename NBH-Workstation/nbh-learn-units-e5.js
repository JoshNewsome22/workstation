/* nbh-learn-units-e5.js (v26.01): written units of the Learning page, section E (Behavior-change interventions), units e14 and
   e15. The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  e14: {
    aim: [
      'Say what self-monitoring is and why it can change behavior by itself.',
      'Teach a student to notice and record their own behavior, with examples and non-examples.',
      'Run accuracy checks and reinforce honest recording.',
      'Fade your part as the plan says.'
    ],
    lesson: [
      { h: 'The student keeps the data',
        p: ['In self-monitoring the student watches for a behavior of their own and records it: a tick each time a hand is raised, a yes or no for “Was I working?” when a timer sounds, a tally of problems finished.',
            'It hands the student a tool that goes wherever they go, needs no adult standing by, and belongs to them. It is part of a wider group of skills called self-management, in which people arrange their own cues, records and rewards.'],
        check: { q: 'In self-monitoring, who records the behavior?',
          opts: ['The technician.', 'The teacher.', 'The student.', 'A classmate.'],
          a: 2, why: 'The student observes and records their own behavior.' } },
      { h: 'Why recording changes behavior',
        p: ['Simply noticing and writing down your own behavior tends to change it in the wanted direction. This is called reactivity. People who log what they eat often eat a little less; a student who ticks a box each time she starts a task on time begins to start on time more often.',
            'The effect is stronger when the student also has a goal and a reward for meeting it, and it lasts longer when the recording is accurate. So a full program has four parts: recording, a goal, reinforcement, and checks on accuracy.'],
        key: ['Recording', 'A goal', 'Reinforcement', 'Accuracy checks'],
        check: { q: 'Behavior often improves when a person starts to record it. This effect is called:',
          opts: ['Reactivity', 'Extinction', 'Satiation', 'Resurgence'],
          a: 0, why: 'The act of self-observation itself changes the behavior.' } },
      { h: 'What the student needs',
        p: ['A definition in the student’s own words, short enough to hold in mind: “Working means my eyes are on my page and my pencil is moving.” A simple way to record: a card on the desk, a wrist counter, a sheet with boxes. And a cue for when to record: after each task, or when a timer or a tactile prompter signals.',
            'The plan gives all three. The form should take a second to mark and should not draw other students’ eyes.'],
        check: { q: 'Which definition is best for a student’s self-monitoring card?',
          opts: ['“Demonstrating appropriate academic engagement behaviors.”', '“Being good.”', '“Eyes on my work, pencil moving.”', '“Not being off task or disruptive or out of area.”'],
          a: 2, why: 'Short, in the student’s words, and something they can check in a glance.' } },
      { h: 'Teaching it',
        p: ['Self-monitoring is taught like any other skill: explain, show, practice, give feedback. Say what the behavior is and why recording it helps. Act out clear examples and clear non-examples and have the student say which is which. Then act out some near the edge.',
            'Next the student practices recording, first on your behavior, then on their own, in short, easy sessions. Praise correct recording straight away. Only when the recording is accurate do you take it into the real lesson.'],
        check: { q: 'When teaching a student to self-monitor “working”, why do you act out non-examples as well as examples?',
          opts: ['To embarrass the student.', 'So the student learns where “working” ends, and can score the unclear moments.', 'To fill the time.', 'Non-examples are not needed.'],
          a: 1, why: 'Accurate recording depends on knowing what does not count.' } },
      { h: 'Checking accuracy, and what to reinforce',
        p: ['From time to time you record the same behavior at the same moments, without the student seeing your sheet. Afterwards the two records are compared. This is a matching check.',
            'Reinforce the match. A student who honestly marks “no, I was not working” and matches your record has done exactly what was asked, and earns the reward for accuracy. If only “yes” marks were rewarded, the student would learn to mark “yes”.',
            'The reward for meeting the goal, such as working at 8 of 10 signals, is separate, and the plan says how the two fit together.'],
        check: { q: 'At a matching check, the student has marked “no” for three of ten signals, and your record agrees with all ten. What do you reinforce?',
          opts: ['Nothing: three were “no”.', 'Only the seven “yes” marks.', 'You tell him to mark “yes” next time.', 'The accurate recording, as the plan says for a match.'],
          a: 3, why: 'Honest recording is the skill. Rewarding only “yes” marks would teach false ones.' } },
      { h: 'Fading yourself out',
        p: ['The purpose is independence, so your part shrinks by the plan’s steps: matching checks become less frequent and unannounced, the timer’s signals are spaced out, the goal rises, the reward comes later or becomes something the student arranges.',
            'Keep watching the real behavior as well as the card. If the card says all is well and the classroom says otherwise, or if the student stops using the card, tell your supervisor: the checks may have been faded too fast, or the reward may have lost its value.'],
        check: { q: 'After checks were reduced to once a week, the student’s card shows “yes” every time, while the teacher reports he is rarely working. You:',
          opts: ['Trust the card.', 'Take the card away as a punishment.', 'Tell your supervisor what the card shows and what the teacher reports.', 'Start checking every signal again on your own.'],
          a: 2, why: 'The mismatch is the important information. Changing the schedule of checks is the supervisor’s decision.' } }
    ],
    examples: {
      ask: 'Which part of a self-monitoring program is this?',
      intro: 'Eight moments from self-monitoring programs. Decide which part each one shows.',
      opts: ['Self-recording', 'An accuracy (matching) check', 'A goal', 'Reinforcement'],
      items: [
        { s: 'When her wristband buzzes, Ana ticks “yes” or “no” for “I was working”.', a: 0, why: 'She records her own behavior at the cue.' },
        { s: 'At the end of the lesson the aide lays her own sheet beside Ben’s and they count the boxes that agree.', a: 1, why: 'Two records are compared.' },
        { s: 'Written on Cal’s card: “Today: 8 of 10 yes.”', a: 2, why: 'A target to reach.' },
        { s: 'Dee’s marks matched the teacher’s on 9 of 10 signals, so she chooses the closing game.', a: 3, why: 'A reward for accurate recording.' },
        { s: 'Eli makes a tally mark each time he finishes a math problem.', a: 0, why: 'He counts his own behavior.' },
        { s: 'Without telling Fay which day, the teacher records along with her once this week.', a: 1, why: 'An unannounced check on accuracy.' },
        { s: 'Gus reached 8 “yes” marks and takes five minutes of computer time.', a: 3, why: 'A reward for meeting the goal.' },
        { s: 'Hana and the technician agree that tomorrow she will aim for one more “yes” than today.', a: 2, why: 'The goal is being set.' }
      ]
    },
    practice: {
      title: 'Teach a student to keep her own record',
      intro: 'You are teaching Lia, a simulated student, to self-monitor working during independent math. Read the plan, then decide.',
      plan: ['Lia’s definition: “Eyes on my work, pencil moving, or hand up for help.”', 'A tactile timer signals every 2 minutes for 20 minutes (10 signals). At each, Lia ticks yes or no on her card.', 'Teach first: explain, act out examples and non-examples, practice in a short session.', 'Matching: you record at the same signals. 8 or more of 10 matching: one point. Goal: 7 or more “yes”: one more point. Two points: she chooses from her menu.', 'After 5 sessions with 8 or more matching, check every other session, without notice.'],
      steps: [
        { t: 'Teaching', see: 'You have explained the card. What next?', opts: ['Send her to the lesson to try it.', 'Act out some moments, working and not working, and have her say which each is.', 'Read the definition to her five times.'], a: 1, why: 'Examples and non-examples, with her judging them, build accurate recording.' },
        { t: 'Teaching', see: 'You act out looking at the page with the pencil still, daydreaming. Lia says, “Working.”', opts: ['Agree, to keep her confident.', 'Say, “Look at the pencil: it is not moving. That one is a no,” and act out another like it.', 'Tell her she is wrong and move on.'], a: 1, why: 'The moments near the edge are where teaching is needed. Feedback is specific, then she tries again.' },
        { t: 'Session 1, signal 3', see: 'The timer signals. Lia is looking out of the window. She glances at you, then ticks “yes”.', opts: ['Say, “That was a no, Lia.”', 'Record “no” on your own sheet and say nothing until the check.', 'Tick “no” on her card for her.'], a: 1, why: 'You record independently. The comparison comes at the end, not in the middle of the lesson.' },
        { t: 'Session 1, the check', see: 'Your sheets agree on 7 of 10. Lia has 8 “yes” marks; you have 6.', opts: ['Give both points: she tried.', 'No match point; go through the three that differ with her, kindly. The goal point depends on what the plan counts: ask your supervisor if it does not say.', 'Give the goal point, since her card says 8.'], a: 1, why: 'The match was 7, under 8. Whose record decides the goal point is a detail the plan must settle, and you ask, not guess.' },
        { t: 'Session 2, the check', see: 'Lia has marked 5 “yes” and 5 “no”. Your sheet agrees on all 10.', opts: ['One point for matching. No goal point today. Praise the honest recording.', 'No points: she was only working half the time.', 'Two points, to encourage her.'], a: 0, why: 'Accuracy earned its point. The goal was not met, and the plan keeps the two apart.' },
        { t: 'Session 4', see: 'A classmate leans over and says, “What’s that card?” Lia hides it and stops ticking.', opts: ['Tell the classmate to mind his own business.', 'Carry on with your own record, and tell your supervisor the card draws attention.', 'Take over the recording for her.'], a: 1, why: 'A tool that embarrasses the student will not be used. The supervisor can change its form.' },
        { t: 'Session 6', see: 'Lia has matched 8 or more in five sessions in a row.', opts: ['Keep checking every session: it is working.', 'Stop checking altogether.', 'Move to checks every other session, without notice, as the plan says, and tell your supervisor the criterion was met.'], a: 2, why: 'Fading follows the plan’s step. Staying at full checking keeps her dependent on you.' },
        { t: 'Session 9', see: 'On an unannounced check, the match is 5 of 10, and her card shows all “yes”.', opts: ['Say nothing and hope it improves.', 'Record the result, give no match point, and report to your supervisor that accuracy has dropped since checks were thinned.', 'Tell her she has been lying.'], a: 1, why: 'The data tell the supervisor the fading may have been too fast. An accusation helps nobody.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Self-monitoring means that the student:', opts: ['Is watched through a camera.', 'Observes and records their own behavior.', 'Chooses their own goals without adults.', 'Grades classmates.'], a: 1, why: 'The student is observer and recorder.' },
      { q: 'Reactivity in self-monitoring refers to:', opts: ['The behavior changing because it is being self-recorded.', 'The student’s anger at being asked to record.', 'A reaction to medication.', 'The timer’s sound.'], a: 0, why: 'Recording itself tends to move the behavior.' },
      { q: 'A good self-monitoring definition is:', opts: ['Long and technical.', 'Written for the supervisor only.', 'Short and in the student’s words.', 'Kept secret from the student.'], a: 2, why: 'The student must be able to apply it in a glance.' },
      { q: 'A cue for when to record might be:', opts: ['The end of the school year.', 'A reprimand.', 'Another student’s behavior.', 'A timer or tactile prompter that signals at intervals.'], a: 3, why: 'The cue tells the student when to look at their own behavior.' },
      { q: 'A matching check compares:', opts: ['Two students’ cards.', 'The student’s record with an adult’s record of the same moments.', 'Today with last week.', 'The card with the plan.'], a: 1, why: 'It measures the accuracy of the self-record.' },
      { q: 'At a matching check, what is reinforced?', opts: ['Agreement between the two records, even when the marks are “no”.', 'Only “yes” marks.', 'Neat handwriting.', 'Nothing.'], a: 0, why: 'Accuracy is the skill being built.' },
      { q: 'Rewarding only the “yes” marks on a student’s card is likely to:', opts: ['Improve accuracy.', 'Have no effect.', 'Lead the student to mark “yes” whatever happened.', 'End the program.'], a: 2, why: 'The mark, not the behavior or its accuracy, is what would be paid.' },
      { q: 'Self-monitoring is taught by:', opts: ['Handing over the card.', 'A lecture.', 'A warning.', 'Explaining, showing examples and non-examples, practice and feedback.'], a: 3, why: 'It is a skill like any other.' },
      { q: 'As the student becomes accurate, accuracy checks are:', opts: ['Increased.', 'Made less frequent and unannounced, as the plan says.', 'Stopped at once.', 'Given to a classmate to do.'], a: 1, why: 'The adult’s part is faded.' },
      { q: 'The card and the classroom disagree. You:', opts: ['Tell your supervisor.', 'Trust the card.', 'Stop the program.', 'Change the goal.'], a: 0, why: 'A mismatch means accuracy or motivation needs attention.' },
      { q: 'During the lesson, the adult’s own record is kept:', opts: ['Where the student can copy it.', 'On the board.', 'Out of the student’s view until the comparison.', 'By the student.'], a: 2, why: 'Otherwise the check is not independent.' },
      { q: 'The main purpose of self-monitoring is:', opts: ['To save staff time only.', 'To punish.', 'To replace all teaching.', 'To build the student’s independence in managing their own behavior.'], a: 3, why: 'The tool travels with the student.' },
      { q: 'A self-monitoring form should be:', opts: ['Large and colorful so everyone can see.', 'Quick to mark and discreet.', 'Complicated.', 'Kept by the teacher.'], a: 1, why: 'A form that draws attention will not be used.' },
      { q: 'Who decides the goal, the reward and the schedule of checks?', opts: ['The supervisor, in the plan.', 'The technician, each day.', 'The classmate.', 'Nobody.'], a: 0, why: 'You teach, check and report.' }
    ] },
    role: [
      { t: 'Teach the card', setup: 'The trainer plays a student who is new to self-monitoring. The trainee has a card, a short definition and a timer, and five minutes.',
        steps: ['Explains what the behavior is and why recording helps, in plain words.', 'Acts out clear examples and non-examples and has the “student” judge each.', 'Acts out two unclear moments and gives specific feedback.', 'Has the “student” practice recording at the timer.',
                'Praises accurate recording at once.'] },
      { t: 'A matching check', setup: 'The trainer plays a student through ten signals, working at some and not at others, and marks one moment wrongly on purpose. The trainee records independently.',
        steps: ['Records at each signal without showing the sheet.', 'Says nothing about the student’s marks during the session.', 'Compares the two records afterwards and counts agreements.', 'Reinforces the match as the plan says, including honest “no” marks.',
                'Goes through the disagreement kindly and specifically.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'Have you ever kept a record of something you do: steps, spending, sleep? What happened to the behavior?',
      'Why is it hard to reward a student for honestly recording a bad day?',
      'How would you make a card that a teenager would be willing to use in class?'
    ],
    read: [
      'Briesch, A. M., & Chafouleas, S. M. (2009). Review and analysis of literature on self-management interventions to promote appropriate classroom behaviors (1988–2008). School Psychology Quarterly, 24(2), 106–118.',
      'Koegel, L. K., Koegel, R. L., Hurley, C., & Frea, W. D. (1992). Improving social skills and disruptive behavior in children with autism through self-management. Journal of Applied Behavior Analysis, 25(2), 341–353.',
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on self-management.'
    ]
  },

  e15: {
    aim: [
      'Say what a crisis is, what a crisis plan contains, and why you learn it before you need it.',
      'Recognize the stages of an escalation and what helps at each.',
      'Prompt a calming routine at the first signs, as it was taught when calm.',
      'Put safety first at the peak, use only procedures you are trained and authorized to use, and report accurately afterwards.',
      'Know your workplace’s steps for medical and other emergencies.'
    ],
    lesson: [
      { h: 'Crisis, and the plan for it',
        p: ['A crisis is behavior, or an event, that puts someone at immediate risk of serious harm: a student hitting his head on the floor, attacking another child, running toward a road; a seizure; choking.',
            'A student whose behavior can reach that point has a written crisis or safety plan, made by the supervisor with the family and the school. It lists what tends to set the behavior off, the early signs, what to do at each stage, who is called, and what happens afterwards. Your workplace also has general emergency procedures.',
            'A crisis is the worst moment to read a plan for the first time. You learn it beforehand, practice it, and know where the written copy is.'],
        check: { q: 'When should you first read a student’s crisis plan?',
          opts: ['During the first crisis.', 'After the first crisis.', 'Before you work with the student.', 'Only if your supervisor is away.'],
          a: 2, why: 'There is no time to read in an emergency, and safety depends on everyone acting the same way.' } },
      { h: 'Escalation has stages',
        p: ['Serious episodes rarely come from nowhere. A common pattern runs: calm; a trigger; early signs of agitation, such as pacing, a tight face, a change in voice, refusing; acceleration, with arguing, threats and pushing limits; the peak, where the dangerous behavior happens; de-escalation; and recovery.',
            'The earlier in this sequence you act, the more choices you have and the gentler they are. At the peak there is only safety. So the most useful crisis skill is noticing the early signs your student’s plan lists and responding to them at once.'],
        key: ['Calm', 'Trigger', 'Early signs', 'Acceleration', 'Peak', 'De-escalation', 'Recovery'],
        check: { q: 'At which stage do you have the most options for preventing harm?',
          opts: ['At the peak.', 'During recovery.', 'After the incident report.', 'At the early signs.'],
          a: 3, why: 'Early, there is still room to reduce demands, offer a calming routine or change the situation.' } },
      { h: 'At the early signs',
        p: ['Do what the plan says for this stage. Typical steps: lower your voice and use few words; give space and stand at an angle, not squarely in front; reduce or pause demands if the plan allows it; offer a choice or a break; prompt the calming routine or the communication response the student has been taught.',
            'What does not help: raised voices, crowding, long explanations, arguing about who is right, threats of consequences, an audience. These push the sequence forward.',
            'Some plans do not pause the demand, because pausing would teach that early signs end work. This is why you follow the student’s own plan and not a general rule.'],
        check: { q: 'A student begins pacing and muttering, which his plan lists as early signs. The plan says: “Offer the calm-down card; few words; give space.” You:',
          opts: ['Tell him firmly to sit down or lose recess.', 'Quietly hold out the calm-down card, say little, and step back.', 'Call the class’s attention to him.', 'Explain at length why he should calm down.'],
          a: 1, why: 'The plan’s steps for this stage, carried out calmly. Threats and lectures tend to escalate.' } },
      { h: 'Calming routines are taught when calm',
        p: ['Slow belly breathing, tensing and releasing muscles, going to an agreed calm-down place: these are skills, and nobody learns a skill in the middle of a storm. They are taught and practiced when the student is calm, many times, with reinforcement, until they are easy.',
            'Then, at the first signs, you give the prompt that was practiced: “Let’s breathe,” or a point to the plan card. If the student uses the routine, that is reinforced as the plan says.',
            'A routine that has not been practiced will not appear under stress, and prompting it at the peak is too late.'],
        check: { q: 'Why are calming routines practiced when the student is already calm?',
          opts: ['It keeps sessions pleasant.', 'A skill has to be learned before it can be used under stress.', 'It is easier to schedule.', 'They do not need practice.'],
          a: 1, why: 'Under stress people can only do what is already well learned.' } },
      { h: 'At the peak: safety',
        p: ['When dangerous behavior is happening, the only goals are that nobody is hurt and that it ends. Teaching stops. Follow the plan: call for help in the way your workplace sets; move other students away; move objects that could be thrown or used to injure; give the student space where that is safe; keep yourself between the student and danger where you can, with a way out behind you.',
            'Say very little, in a calm voice. Do not reason, bargain or threaten.',
            'Physical holds, restraint and seclusion are restricted by law and by workplace policy. You use them only if you hold the current training your workplace requires, the student’s plan and policy authorize it, and there is no safer way to prevent serious injury. Anything else you do not do, even with good intentions: untrained holds injure people.'],
        check: { q: 'A student is throwing chairs. You have no training in physical holds. What do you do?',
          opts: ['Call for help as your workplace sets, move the other students out, and keep at a safe distance.', 'Hold him from behind.', 'Shut him alone in a cupboard.', 'Shout at him to stop.'],
          a: 0, why: 'Help, distance and clearing the room are what an untrained person does. Holds and seclusion without training and authorization are dangerous and not permitted.' } },
      { h: 'Coming down, and recovery',
        p: ['After the peak the student is often tired, quiet, tearful or ashamed, and still easily set off again. Keep things low: space, quiet, a simple and familiar activity when the plan says so, water, a check for injuries.',
            'This is not the time for a talk about what happened, an apology on demand, or the consequence. It is also not the time for a big comforting reward that the plan does not list, which could come to follow the crisis. The plan says how and when the student returns to the routine.'],
        check: { q: 'Ten minutes after a serious episode, the student is sitting quietly with his head down. A colleague wants him to apologize to the class now. You:',
          opts: ['Agree: it teaches responsibility.', 'Make him write lines instead.', 'Follow the plan’s recovery steps, and suggest that any talk waits as the plan says.', 'Give him a big treat for calming down.'],
          a: 2, why: 'Demands and attention on the incident straight after it can restart it. The plan sets what happens and when.' } },
      { h: 'Afterwards: record and report',
        p: ['The same day, write the incident report your workplace uses. Stick to what could be seen and heard, in order: what was happening before, the first signs, what the student did, what each adult did, how long it lasted, any injury or damage, who was told. No opinions and no blame.',
            'Tell your supervisor at once, by the route your workplace sets. If anyone was hurt, if any physical procedure was used, or if you suspect abuse or neglect, there are legal duties with deadlines; your supervisor and workplace policy tell you what they are, and you are personally responsible for knowing how to make a mandated report where your role requires it.',
            'A debrief afterwards is not a search for someone to blame. It asks what the early signs were, what worked, and what the plan should change.'],
        check: { q: 'Which sentence belongs in an incident report?',
          opts: ['“He was furious and out of control.”', '“The teacher handled it badly.”', '“At 10:42 he threw two chairs toward the window; no one was hit; the class left the room at 10:43.”', '“He did it on purpose to get out of math.”'],
          a: 2, why: 'Times, actions and outcomes that could be observed. The others are judgments or guesses.' } },
      { h: 'Medical and other emergencies',
        p: ['Know your workplace’s procedure for the emergencies that can happen to anyone: a seizure, choking, a severe allergic reaction, a fall, a student leaving the building, a fire or lockdown. Know where the first-aid kit, the emergency medication and the phone are, who the first-aiders are, and how to call for help.',
            'Read the health information you are given for each student you work with: allergies, seizure plans, medication. Keep your own first-aid training current if your workplace requires it. After any medical event, record it and report it the same day; your supervisor decides what else is needed.'],
        check: { q: 'A student you work with has a seizure plan on file. When should you know what it says?',
          opts: ['When he has a seizure.', 'Before you work with him.', 'It is the nurse’s concern only.', 'At the annual review.'],
          a: 1, why: 'The first minutes matter, and the plan tells you what to do in them.' } }
    ],
    watch: [
      { k: 'calm_breath', c: 1, look: 'How the breathing is taught when calm, and the short prompt used at the first signs.' },
      { k: 'calm_muscle', c: 1, look: 'The order of the muscle groups, and when the routine is counted as learned.' },
      { k: 'calm_plan', c: 1, look: 'The student’s own list of early signs, the agreed place, and the practice log.' }
    ],
    examples: {
      ask: 'Which stage is this?',
      intro: 'Ten moments from one student’s day. Decide which stage of an escalation each belongs to.',
      opts: ['Calm', 'Early signs', 'Peak', 'Recovery'],
      items: [
        { s: 'Ray is working on a puzzle and chatting with the aide.', a: 0, why: 'Engaged and settled.' },
        { s: 'Ray’s jaw is tight, he taps his foot fast and answers in one word.', a: 1, why: 'Signs of agitation that his plan lists.' },
        { s: 'Ray overturns the table and swings at the aide.', a: 2, why: 'The dangerous behavior itself.' },
        { s: 'Ray sits on the floor with his back to the wall, breathing hard, saying nothing.', a: 3, why: 'After the peak: quiet, tired, still fragile.' },
        { s: 'Ray pushes his worksheet a few inches away and says, “I’m not doing this,” under his breath.', a: 1, why: 'Refusal and muttering, before anything dangerous.' },
        { s: 'Ray is practicing his belly breathing with the technician and earning a token for it.', a: 0, why: 'Calming skills are practiced when he is calm.' },
        { s: 'Ray is kicking the door and screaming.', a: 2, why: 'At its height.' },
        { s: 'Ray accepts a cup of water and looks at a book in the quiet corner.', a: 3, why: 'Returning to baseline.' },
        { s: 'Ray paces at the back of the room and keeps looking at the door.', a: 1, why: 'Early signs: time to act as the plan says.' },
        { s: 'Ray throws a stapler across the room.', a: 2, why: 'Dangerous behavior is happening.' }
      ]
    },
    practice: {
      title: 'Follow a crisis plan',
      intro: 'You work with Sana, a simulated student. You have read and practiced her crisis plan. Read the summary, then decide.',
      plan: ['Early signs: covers her ears, rocks, says “too loud”.', 'At early signs: few words; offer the breathing prompt (“Let’s breathe”) and her headphones; she may go to the reading corner without asking.', 'If she hits herself or others: press the call button; another adult takes the class to the library; move furniture away; keep 2 meters away; say only “You are safe.” Physical procedures: trained crisis team only.', 'Recovery: quiet, water, a book. No talk about the incident. Return to the timetable when she has been calm for 10 minutes.', 'Afterwards: incident report the same day; tell the supervisor at once.'],
      steps: [
        { t: 'Monday, a calm moment', see: 'Sana is settled and has ten free minutes.', opts: ['Leave her be: do not stir things up.', 'Run the practice of belly breathing that her plan schedules, with praise.', 'Talk with her about last week’s incident.'], a: 1, why: 'The routine is built up when she is calm, so that it is there when she needs it.' },
        { t: 'Tuesday 10:10', see: 'The class is getting loud. Sana covers her ears and starts to rock.', opts: ['Say, “Sana, you need to cope with noise. Take your hands down.”', 'Say, “Let’s breathe,” hold out her headphones, and step back.', 'Wait to see whether it passes.'], a: 1, why: 'Her early signs, and the plan’s response to them: few words, the practiced prompt, the headphones.' },
        { t: '10:11', see: 'Sana takes the headphones, breathes slowly twice and walks to the reading corner.', opts: ['Call her back: she did not ask.', 'Let her go, and note that she used the routine.', 'Follow her and praise her loudly in front of the class.'], a: 1, why: 'Her plan lets her go without asking. Whatever reinforcement the plan lists is given quietly.' },
        { t: 'Thursday 13:30', see: 'A fire alarm test goes off without warning. Sana screams and begins hitting her head with her fist.', opts: ['Hold her wrists.', 'Press the call button, signal the other adult to take the class out, and move the chairs away from her.', 'Tell her firmly to stop.'], a: 1, why: 'The plan’s peak steps. You are not on the trained crisis team, so you do not hold her.' },
        { t: '13:31', see: 'Help is on its way. Sana is on the floor, still hitting her head, less hard.', opts: ['Kneel close and hug her.', 'Explain that the alarm was only a test.', 'Stay 2 meters away, say “You are safe” calmly, and watch.'], a: 2, why: 'Distance and four words. Touch and explanations can restart the peak.' },
        { t: '13:40', see: 'The crisis team has come and gone without needing to hold her. Sana is sitting up, quiet and pale.', opts: ['Ask her why she did it.', 'Offer water and a book, keep the room quiet, and start timing 10 calm minutes.', 'Take her straight back to math.'], a: 1, why: 'Recovery as the plan writes it. Questions and demands wait.' },
        { t: '13:55', see: 'Sana has a red mark on her forehead.', opts: ['It will fade: leave it out of the report.', 'Have it looked at by the person your workplace names, and record it.', 'Put ice on it yourself and tell no one.'], a: 1, why: 'An injury is assessed by whoever your workplace assigns, and it is always documented.' },
        { t: '14:30', see: 'You write the incident report.', opts: ['“Sana had a huge meltdown because of the stupid alarm.”', '“13:30 unannounced alarm test. Sana screamed and hit her forehead with her right fist, about 15 times in 2 minutes. Call button pressed 13:30; class left 13:31; crisis team arrived 13:33; no hold used. Calm from 13:40. Red mark on forehead, seen by the nurse 13:58.”', '“Incident occurred. Handled as per plan.”'], a: 1, why: 'Times, actions, counts, outcome and who was involved, with no opinion.' },
        { t: '14:45', see: 'You call your supervisor. What else is worth saying?', opts: ['Nothing: the report covers it.', 'That the alarm test came without warning, and that on Tuesday the early-sign steps worked.', 'That the school is to blame.'], a: 1, why: 'What set it off and what worked are what the plan can be improved from.' }
      ]
    },
    quiz: { pass: 80, draw: 12, items: [
      { q: 'A crisis is best defined as behavior or an event that:', opts: ['Is annoying.', 'Puts someone at immediate risk of serious harm.', 'Breaks a class rule.', 'Happens every day.'], a: 1, why: 'Immediate risk of serious harm.' },
      { q: 'A student’s crisis plan is written by:', opts: ['The supervisor, with the family and the school.', 'The technician, after the first incident.', 'The student’s classmates.', 'Nobody: it is improvised.'], a: 0, why: 'It is designed in advance and you carry it out.' },
      { q: 'The best time to act to prevent a crisis is:', opts: ['At the peak.', 'During recovery.', 'At the early signs.', 'The next day.'], a: 2, why: 'Early action has the most and the gentlest options.' },
      { q: 'At the early signs, a helpful response is to:', opts: ['Raise your voice.', 'Stand close and block the way.', 'Explain at length.', 'Use few words, give space and follow the plan’s steps.'], a: 3, why: 'Calm, brief, spacious.' },
      { q: 'Calming routines are taught:', opts: ['During the peak.', 'When the student is calm, with practice and reinforcement.', 'Only after an incident.', 'By handing out a leaflet.'], a: 1, why: 'A routine must be well learned to be available under stress.' },
      { q: 'At the peak of a crisis, the goal is:', opts: ['Safety.', 'Teaching a replacement behavior.', 'Finishing the task.', 'Getting an apology.'], a: 0, why: 'Teaching resumes later.' },
      { q: 'Physical holds or restraint may be used by a technician:', opts: ['Whenever a student is aggressive.', 'When a teacher asks.', 'Only with current training, authorization in the plan and policy, and no safer way to prevent serious injury.', 'Never, under any circumstances, anywhere.'], a: 2, why: 'They are tightly restricted, and what is allowed depends on training, plan, policy and law.' },
      { q: 'During the peak, how much should you say?', opts: ['As much as needed to reason with the student.', 'Nothing at all, ever.', 'Whatever comes to mind.', 'Very little, calmly.'], a: 3, why: 'Words add stimulation; a few calm ones are enough.' },
      { q: 'Right after the peak, you should avoid:', opts: ['Quiet.', 'Demanding an explanation or an apology.', 'Offering water.', 'Checking for injuries.'], a: 1, why: 'Demands about the incident can restart it.' },
      { q: 'An incident report is written:', opts: ['The same day, in observable terms.', 'When there is time, from memory.', 'Only if someone complains.', 'With your opinion of who was at fault.'], a: 0, why: 'Prompt and factual.' },
      { q: 'Which belongs in an incident report?', opts: ['“He was being manipulative.”', '“She always does this.”', '“At 9:15 she bit her left hand twice; the skin was not broken.”', '“I think the plan is useless.”'], a: 2, why: 'What was seen, when, and the outcome.' },
      { q: 'After a crisis, you inform:', opts: ['Other families.', 'Nobody.', 'Social media.', 'Your supervisor, at once, by the route your workplace sets.'], a: 3, why: 'Reporting is immediate and goes through the proper line.' },
      { q: 'If you suspect a student is being abused or neglected, you:', opts: ['Investigate it yourself.', 'Follow the mandated-reporting requirements that apply to you, with your supervisor’s support.', 'Wait for proof.', 'Ask the parents first.'], a: 1, why: 'Mandated reporting is a legal duty; you report a suspicion and do not investigate.' },
      { q: 'A debrief after an incident is meant to:', opts: ['Find what the early signs were, what worked and what to change.', 'Assign blame.', 'Punish the student.', 'Fill in a form only.'], a: 0, why: 'It improves the plan.' },
      { q: 'You should know a student’s medical emergency plan (allergy, seizure):', opts: ['When the emergency happens.', 'Never: it is private.', 'Before you work with the student.', 'After a year.'], a: 2, why: 'You may be the adult present in the first minutes.' },
      { q: 'A big unplanned treat right after a crisis could:', opts: ['Help the student trust you.', 'Have no effect.', 'Shorten recovery.', 'Come to follow, and so strengthen, the crisis behavior.'], a: 3, why: 'What follows a behavior can reinforce it, so recovery follows the plan.' },
      { q: 'When positioning yourself near an agitated student, you:', opts: ['Stand squarely in front, close.', 'Stand at an angle, at a distance, with a way out behind you.', 'Block the door.', 'Turn your back.'], a: 1, why: 'A non-threatening stance that keeps you safe.' }
    ] },
    role: [
      { t: 'Respond at the early signs', setup: 'The trainer plays a student showing the early signs listed on a short crisis plan (card provided), then either settling or accelerating in words. No physical contact is role-played.',
        steps: ['Notices the early signs and names them afterwards.', 'Lowers voice and uses few words.', 'Gives space and stands at an angle.', 'Gives the prompt for the calming routine as the card says.',
                'Does not argue, threaten or explain at length.', 'Says what they would do next if the behavior became dangerous: call for help, clear others, keep distance.'] },
      { t: 'The report afterwards', setup: 'The trainer describes or shows a two-minute simulated incident. The trainee writes an incident report on the workplace’s form (or a blank sheet) and says who is told.',
        steps: ['Writes what happened before, the early signs, the behavior, what adults did, and how it ended, in order.', 'Uses times, counts and observable words.', 'Records any injury or damage and who saw to it.', 'Leaves out opinions and blame.',
                'Names whom they would notify and when.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place. Physical procedures are not practiced in this unit: they need the certified crisis training your workplace uses.',
    discuss: [
      'What are the early signs of the students you know? Would a new colleague recognize them?',
      'What do you notice in your own body and voice when a situation heats up? What helps you stay slow?',
      'Where are the call button, the first-aid kit and the written crisis plans in your building?',
      'After a hard incident, what do you need, and who can you ask?'
    ],
    read: [
      'Colvin, G., & Scott, T. M. (2015). Managing the cycle of acting-out behavior in the classroom (2nd ed.). Corwin.',
      'Luiselli, J. K. (2009). Physical restraint of people with intellectual disability: A review of implementation reduction and elimination procedures. Journal of Applied Research in Intellectual Disabilities, 22(2), 126–134.',
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 2.01, 2.05 and 2.07. bacb.com.'
    ]
  }
});
