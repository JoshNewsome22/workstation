/* nbh-learn-units-a.js (v26.01): written units of the Learning page, section A (Introduction to applied behavior analysis),
   units a1 to a4. The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  a1: {
    aim: [
      'Say in plain words what applied behavior analysis is and what the service is for.',
      'Name what makes a service behavior-analytic: it measures behavior, follows written procedures and lets the data decide.',
      'Say who does what on the team, and where the technician’s role ends.'
    ],
    lesson: [
      { h: 'A science of behavior, put to use',
        p: ['Applied behavior analysis (ABA) uses what is known about how behavior is learned to change behavior that matters in a person’s life. Behavior is anything a person does: speaking, writing, hitting, waiting, washing hands.',
            'Behavior is learned through what happens around it: what comes before it and what follows it. Change those, and behavior changes. That is the whole idea, and the rest of this training fills it in.',
            '“Applied” means the goals are chosen because they matter to the person and the people around them: communicating, learning, looking after oneself, staying safe, having more choices. A goal that only makes an adult’s day easier is not a good enough reason.'],
        check: { q: 'Which goal is “applied” in this sense?',
          opts: ['A student sits silent all day because it is easier for staff.', 'A student stops a harmless habit that one adult dislikes.', 'A student learns to ask for help instead of hitting.', 'A student memorizes a list that nobody will ever use.'],
          a: 2, why: 'Asking for help gives the student a way to get what they need and makes hitting unnecessary. It matters to the student, not only to the adults.' } },
      { h: 'What makes a service behavior-analytic',
        p: ['Since 1968 the field has described itself by seven features. Three of them shape every session you will run.',
            'It is behavioral: what the person does is observed and measured, not guessed at. It is technological: the procedure is written so clearly that another trained person could run it the same way. It is analytic and effective: the data show whether the procedure is working, and the plan changes when it is not.',
            'The others are that the goals are applied, that the procedures rest on the principles of behavior, and that the change lasts and shows up in other places and with other people (generality).'],
        key: ['Measure what the person does.', 'Run the procedure as it is written.', 'Let the data decide.'],
        check: { q: 'A plan is written so clearly that a new technician runs it exactly as the last one did. Which feature is this?',
          opts: ['Technological', 'Applied', 'Generality', 'Effective'],
          a: 0, why: 'Technological means the procedure is described well enough to be repeated by someone else.' } },
      { h: 'Who does what',
        p: ['A behavior analyst (a BCBA, or a BCaBA working under one) assesses, writes the plan, decides when it changes, and trains and supervises the people who carry it out.',
            'A behavior technician carries out the plan as written, records data, and tells the supervisor what they see. The technician does not design or change plans, choose goals, or carry out assessments alone.',
            'Families, teachers and other professionals are part of the team. Their questions and worries go to the supervisor, and it is your job to pass them on. Through all of it, the person you work with is treated with dignity and has a say in what happens to them.'],
        check: { q: 'A teacher asks you to add a new consequence to a student’s plan, starting today. What do you do?',
          opts: ['Add it: the teacher knows the student best.', 'Refuse and say the plan is none of the teacher’s business.', 'Add it for one day to see if it works.', 'Say you will take it to your supervisor, and do so the same day.'],
          a: 3, why: 'Plans change through the supervisor. The teacher’s idea may be a good one, and passing it on promptly is part of your role.' } }
    ],
    examples: {
      ask: 'Does this fit a behavior-analytic service?',
      intro: 'Six short scenes from a school. For each, decide whether it fits a behavior-analytic service.',
      opts: ['It fits', 'It does not fit'],
      items: [
        { s: 'Staff count how many times Mia asks for help each day and put the numbers on a graph.', a: 0, why: 'Behavior is observed, counted and displayed. That is the “behavioral” feature at work.' },
        { s: 'A helper decides that Leo “is just lazy” and stops running his program.', a: 1, why: '“Lazy” is a label, not something anyone measured, and a technician does not stop a plan.' },
        { s: 'The plan lists each step of the teaching procedure and the words to say.', a: 0, why: 'A written, repeatable procedure is what “technological” means.' },
        { s: 'A new reward chart is started because a staff member saw it online. No data are taken.', a: 1, why: 'Without data nobody can tell whether it works, and it did not come from the plan.' },
        { s: 'After two weeks without progress on the graph, the supervisor revises the plan.', a: 0, why: 'The data showed the procedure was not effective, and the plan changed because of them.' },
        { s: 'A technician changes the prompt she uses because the written one “felt awkward”.', a: 1, why: 'The procedure is no longer the one that was written. If a step is awkward, the technician tells the supervisor.' }
      ]
    },
    practice: {
      title: 'Your first week',
      intro: 'Four moments from a first week as a technician. Choose what you do in each.',
      steps: [
        { t: 'Monday', see: 'You are handed a plan for a student you have never met. Nobody has trained you on it.', opts: ['Ask your supervisor for training on the plan before you run it.', 'Read it twice and start.', 'Run only the parts you understand.'], a: 0,
          why: 'A technician provides a service only after the supervisor has confirmed they can do it. Asking is the right start.' },
        { t: 'Tuesday', see: 'At pick-up a parent asks, “Why does he bite? Is it his diagnosis?”', opts: ['Give your best guess: you see him every day.', 'Say that the supervisor is the one to answer that, describe what you do in sessions, and pass the question on.', 'Say you are not allowed to talk to parents.'], a: 1,
          why: 'Explaining why behavior happens is assessment, which is the supervisor’s work. You can say what you do, and you make sure the question reaches the supervisor.' },
        { t: 'Wednesday', see: 'One goal on a plan reads “sits quietly for the whole day”. You wonder whom it helps.', opts: ['Skip that goal.', 'Rewrite it as “takes part in class”.', 'Keep running the plan and raise your question with your supervisor.'], a: 2,
          why: 'Goals should matter to the student. Your doubt is worth raising, and the decision about the goal is the supervisor’s.' },
        { t: 'Friday', see: 'You find Wednesday’s data sheet blank. The session was busy.', opts: ['Fill it in from memory.', 'Copy Tuesday’s numbers.', 'Tell your supervisor the data are missing, and leave the sheet as it is.'], a: 2,
          why: 'Invented data are worse than missing data: decisions would be made from numbers that never happened.' }
      ]
    },
    quiz: { pass: 80, draw: 6, items: [
      { q: 'Applied behavior analysis is best described as:', opts: ['A way of talking about feelings.', 'Using what is known about how behavior is learned to change behavior that matters.', 'A set of rewards and punishments.', 'A diagnosis.'], a: 1, why: 'It is a science of learning put to practical use on goals that matter to the person.' },
      { q: '“Behavior” in this field means:', opts: ['Only problem behavior.', 'Only what a person says.', 'Anything a person does.', 'A person’s character.'], a: 2, why: 'Speaking, writing, waiting and hitting are all behavior.' },
      { q: 'A goal is “applied” when it:', opts: ['Matters to the person and those around them.', 'Is easy to measure.', 'Makes sessions shorter.', 'Was used with another student.'], a: 0, why: 'Applied refers to social significance.' },
      { q: 'Who writes and changes the behavior plan?', opts: ['The technician.', 'The classroom aide.', 'Whoever runs the session.', 'The behavior analyst who supervises the case.'], a: 3, why: 'The supervisor assesses, writes the plan and decides on changes.' },
      { q: 'The technician’s main work is to:', opts: ['Diagnose.', 'Choose goals.', 'Carry out the plan as written, record data and report.', 'Train the family alone.'], a: 2, why: 'Implementation, data and reporting are the technician’s role.' },
      { q: 'Why are data taken in every session?', opts: ['To fill time.', 'So that decisions rest on what happened, not on impressions.', 'Because funders like paper.', 'To grade the student.'], a: 1, why: 'The data show whether the plan is working.' },
      { q: 'A parent tells you something that worries them about the plan. You:', opts: ['Keep it to yourself.', 'Change the plan.', 'Tell them it is not your job.', 'Pass it to your supervisor the same day.'], a: 3, why: 'Concerns from the team go to the supervisor, promptly.' },
      { q: '“Generality” means that a change in behavior:', opts: ['Lasts, and shows up with other people and in other places.', 'Happens only in the clinic.', 'Is the same for every student.', 'Was produced by a general rule.'], a: 0, why: 'A skill that appears only with one adult in one room is not finished.' }
    ] },
    role: [
      { t: 'Explain your job to a parent in one minute', setup: 'The trainer plays a parent who asks, “So what is it you actually do with my child?”',
        steps: ['Says what the service is in plain words, with no jargon.', 'Says that they carry out the plan the supervisor wrote.', 'Says that data are taken in each session and why.',
                'Says who decides on changes and who answers questions about the reasons for behavior.', 'Is respectful, and asks whether the parent has questions.'] }
    ],
    roleRule: 'Met when every step is done in one run, without help.',
    discuss: [
      'Think of a goal you have seen written for a student. Whom did it serve most: the student, or the adults?',
      'What would you say to a colleague who describes ABA as “just giving rewards”?'
    ],
    read: [
      'Baer, D. M., Wolf, M. M., & Risley, T. R. (1968). Some current dimensions of applied behavior analysis. Journal of Applied Behavior Analysis, 1(1), 91–97.',
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. Chapter 1.'
    ]
  },

  a2: {
    aim: [
      'Describe a moment of behavior as what came before, what the person did, and what followed.',
      'Tell a stimulus from a response, and an antecedent from a consequence.',
      'Describe what you see without adding a reason or a feeling.'
    ],
    lesson: [
      { h: 'Stimulus and response',
        p: ['A response is one instance of behavior: one raised hand, one word, one throw. A stimulus is anything in the surroundings that a person can sense: a spoken instruction, a worksheet, a noise, a smile, a timer sounding.',
            'Behavior does not happen in empty space. It happens among stimuli, and it changes them: the hand goes up, and the teacher comes over.'],
        check: { q: 'The teacher says, “Line up.” Dev walks to the door. Which is the stimulus?',
          opts: ['Dev walking to the door.', 'Dev’s wish to go outside.', 'The teacher’s words, “Line up.”', 'Dev being a good listener.'],
          a: 2, why: 'The instruction is an event in the surroundings that Dev can hear. Walking to the door is the response. Wishes and labels are not things anyone observed.' } },
      { h: 'Before, behavior, after',
        p: ['The unit of analysis has three parts. The antecedent is what is present or happens just before the behavior. The behavior is what the person does. The consequence is what follows it.',
            'This is the three-term contingency, often written A-B-C. “Consequence” here does not mean a penalty. It means whatever follows: attention, an item, a task taken away, nothing at all.',
            'The consequence changes how likely the behavior is the next time the antecedent is there. That is how behavior is learned.'],
        key: ['Antecedent: just before.', 'Behavior: what the person does.', 'Consequence: what follows.'],
        check: { q: 'A worksheet is put on Ana’s desk. She tears it. The worksheet is taken away. What is the consequence?',
          opts: ['The worksheet being put on the desk.', 'The worksheet being taken away.', 'Ana tearing it.', 'Ana being frustrated.'],
          a: 1, why: 'The consequence is what follows the behavior: the work was removed. The worksheet arriving is the antecedent.' } },
      { h: 'Why the order matters',
        p: ['The same behavior can sit in very different sequences. Shouting that follows “Time for math” and is followed by being sent out is one thing. Shouting that happens when the teacher is talking to someone else, and is followed by the teacher coming over, is another.',
            'Your supervisor works out what the sequences mean. Your part is to see them and write them down in order, as they happened.'],
        check: { q: 'Why does a technician record what happened just before and just after a behavior?',
          opts: ['Because the supervisor uses the sequence to work out why the behavior happens.', 'To prove the student did it on purpose.', 'To decide on a punishment.', 'It is not needed: only the behavior matters.'],
          a: 0, why: 'The pattern of antecedents and consequences is the raw material of a functional assessment.' } },
      { h: 'Say what you saw',
        p: ['An observable description says what a camera would record: “He pushed the book off the desk and said ‘no’.” It leaves out reasons (“because he was angry”), labels (“he was defiant”) and guesses about what is inside (“he wanted attention”).',
            'A good test: could two people who watched the same moment agree on your sentence? If it needs a mind reader, rewrite it.'],
        check: { q: 'Which sentence is observable?',
          opts: ['She was upset about the change.', 'She was being manipulative.', 'She had a meltdown.', 'She dropped to the floor and cried for two minutes.'],
          a: 3, why: 'Dropping to the floor and crying for two minutes can be seen and timed. The others are interpretations.' } }
    ],
    examples: {
      ask: 'Which part of the sequence is the words in capitals?',
      intro: 'Each scene has one part in CAPITALS. Decide whether it is the antecedent, the behavior or the consequence.',
      opts: ['Antecedent', 'Behavior', 'Consequence'],
      items: [
        { s: 'THE BELL RINGS. Noor puts her books in her bag. The teacher says, “Thank you, Noor.”', a: 0, why: 'The bell comes just before the behavior.' },
        { s: 'The aide says, “Write your name.” Sam writes it. THE AIDE GIVES HIM A STICKER.', a: 2, why: 'The sticker follows the behavior.' },
        { s: 'A peer takes Eli’s car. ELI SCREAMS. The peer gives the car back.', a: 1, why: 'Screaming is what Eli did.' },
        { s: 'The teacher turns to help another student. Ravi taps his pencil loudly. THE TEACHER COMES BACK TO RAVI.', a: 2, why: 'The teacher returning follows the tapping.' },
        { s: 'THE TABLET IS PUT AWAY. Lila cries. The tablet stays away.', a: 0, why: 'The tablet being put away is what happened just before the crying.' },
        { s: 'The cafeteria gets loud. KAI COVERS HIS EARS AND WALKS OUT. An adult follows him.', a: 1, why: 'Covering his ears and walking out is the behavior.' },
        { s: 'The teacher asks a question. June raises her hand. THE TEACHER CALLS ON JUNE.', a: 2, why: 'Being called on follows the raised hand.' }
      ]
    },
    practice: {
      title: 'Write the ABC record',
      intro: 'You are observing Tomas, a simulated student, and filling in an ABC record for your supervisor. Choose the best entry each time.',
      ask: 'Which entry do you write?',
      word: 'Entry',
      steps: [
        { t: '9:05', see: 'The teacher hands out a writing task. Tomas pushes his paper to the floor. The teacher picks it up and moves on to the next student.', ask: 'What do you write for the behavior?',
          opts: ['Was defiant about writing.', 'Pushed his paper to the floor.', 'Did not want to work.'], a: 1, why: 'Only the second entry says what he did. The others are a label and a guess.' },
        { t: '9:05', see: 'The same moment.', ask: 'What do you write for the antecedent?',
          opts: ['Teacher handed out a writing task.', 'Tomas was in a bad mood.', 'Teacher picked the paper up.'], a: 0, why: 'The task being handed out came just before. Picking the paper up came after.' },
        { t: '9:20', see: 'The teacher is helping another student. Tomas calls out, “Miss! Miss!” four times. The teacher says, “One minute, Tomas.”', ask: 'What do you write for the consequence?',
          opts: ['Tomas was ignored.', 'Teacher was busy.', 'Teacher said, “One minute, Tomas.”'], a: 2, why: 'The teacher did respond: she spoke to him. Write what followed, exactly.' },
        { t: '9:40', see: 'Nothing unusual happened before it that you could see. Tomas put his head on the desk for three minutes.', ask: 'What do you write for the antecedent?',
          opts: ['He was probably tired.', 'Nothing observed: he was at his desk during independent work.', 'Leave it blank.'], a: 1, why: 'Say what the situation was and that you saw no clear event. A blank cannot be told apart from a forgotten entry.' },
        { t: 'After the session', see: 'A colleague says, “Just write that he does it all for attention.”', ask: 'What do you do?',
          opts: ['Write it: it will save the supervisor time.', 'Add it as your own opinion on every row.', 'Hand in the record as observed. The pattern is for the supervisor to read.'], a: 2,
          why: 'Deciding what the behavior is for is assessment. Your record is valuable because it holds only what happened.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'A response is:', opts: ['A feeling.', 'One instance of behavior.', 'A reason for behavior.', 'Anything in the surroundings.'], a: 1, why: 'One raised hand is one response.' },
      { q: 'A stimulus is:', opts: ['Something in the surroundings a person can sense.', 'Always a reward.', 'A thought.', 'A type of behavior.'], a: 0, why: 'Instructions, objects, sounds and other people’s actions are stimuli.' },
      { q: 'In the three-term contingency, the antecedent is:', opts: ['What follows the behavior.', 'The behavior itself.', 'What is present or happens just before the behavior.', 'The student’s mood.'], a: 2, why: 'A comes before B.' },
      { q: '“Consequence” in this field means:', opts: ['A punishment.', 'A reward.', 'A warning.', 'Whatever follows the behavior.'], a: 3, why: 'It can be attention, an item, a task removed, or nothing.' },
      { q: 'A peer laughs after Omar makes a noise. The laughing is the:', opts: ['Antecedent.', 'Consequence.', 'Behavior.', 'Setting.'], a: 1, why: 'It follows the behavior.' },
      { q: 'Which is an observable description?', opts: ['He was anxious.', 'He was seeking attention.', 'He left his seat and walked to the door.', 'He lost control.'], a: 2, why: 'It can be seen and agreed on by two observers.' },
      { q: 'Consequences matter because they:', opts: ['Change how likely the behavior is next time.', 'Show who is in charge.', 'End the session.', 'Explain feelings.'], a: 0, why: 'Behavior is strengthened or weakened by what follows it.' },
      { q: 'You saw no clear event before a behavior. In the antecedent column you write:', opts: ['Nothing.', 'A likely reason.', 'What you would have expected.', 'What the situation was, and that no clear event was observed.'], a: 3, why: 'The situation is information, and the reader knows you did not skip the column.' },
      { q: 'Who works out why a behavior happens from the ABC records?', opts: ['The technician.', 'The supervisor.', 'The classroom teacher alone.', 'The student’s peers.'], a: 1, why: 'Interpreting the pattern is assessment.' },
      { q: 'A good test of an observable sentence is whether:', opts: ['It sounds professional.', 'It is short.', 'Two people who watched would agree on it.', 'It explains the behavior.'], a: 2, why: 'Agreement between observers is the point of observable language.' }
    ] },
    role: [
      { t: 'Describe a moment in A-B-C order', setup: 'The trainer acts out three short moments as a student (or shows three short clips). After each, the trainee says what happened.',
        steps: ['Names the antecedent as an event or a situation, not a mood.', 'Describes the behavior in words a camera would record.', 'Names what followed, exactly.',
                'Adds no reason, label or feeling.', 'Says so when no clear antecedent was seen.'] }
    ],
    roleRule: 'Met when all three moments are described with every step in place.',
    discuss: [
      'Which words do people at your workplace use that sound like descriptions but are really labels? How would you rewrite them?',
      'Think of one behavior you saw this week. What came just before it, and what followed?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. Chapter 2.',
      'Bijou, S. W., Peterson, R. F., & Ault, M. H. (1968). A method to integrate descriptive and experimental field studies at the level of data and empirical concepts. Journal of Applied Behavior Analysis, 1(2), 175–191.'
    ]
  },

  a3: {
    aim: [
      'Define reinforcement by its effect, and tell positive from negative reinforcement.',
      'Deliver a reinforcer well: at once, every time the plan says, in the amount and kind the plan says.',
      'Tell continuous from intermittent schedules, and ratio from interval schedules.',
      'Notice when a reinforcer has lost its pull, and say so.'
    ],
    lesson: [
      { h: 'Reinforcement is defined by what it does',
        p: ['Reinforcement happens when a consequence follows a behavior and the behavior becomes more likely in the future. Nothing is a reinforcer because it is nice, costly or intended as one. It is a reinforcer only if the behavior it follows goes up.',
            'So a sticker may reinforce one student’s work and do nothing for another’s. A reprimand, meant to stop a behavior, may reinforce it if the behavior goes up afterwards.'],
        check: { q: 'A teacher gives a point every time Ida finishes a task. Over two weeks Ida finishes no more tasks than before. The points are:',
          opts: ['A reinforcer, because they were given as a reward.', 'A punisher.', 'Not working as a reinforcer for finishing tasks.', 'Negative reinforcement.'],
          a: 2, why: 'The behavior did not increase, so by definition no reinforcement took place. The supervisor needs to know.' } },
      { h: 'Positive and negative',
        p: ['In positive reinforcement something is added after the behavior and the behavior goes up: praise, a token, a turn with a toy.',
            'In negative reinforcement something is taken away or avoided after the behavior and the behavior goes up: the hard task is removed, the noise stops, the demand is put off. Negative does not mean bad, and it is not punishment. Both kinds make behavior more likely.',
            'Much problem behavior is kept going by negative reinforcement: it gets the person out of something. Much good teaching uses it too: asking for a break ends the work for a while.'],
        key: ['Positive: something is added. Behavior goes up.', 'Negative: something is removed or avoided. Behavior goes up.'],
        check: { q: 'Ben says, “Break, please,” and the worksheet is taken away for two minutes. He asks more often from then on. This is:',
          opts: ['Positive reinforcement.', 'Negative reinforcement.', 'Punishment.', 'Extinction.'],
          a: 1, why: 'The work was removed after he asked, and asking increased. Removal plus an increase is negative reinforcement.' } },
      { h: 'How you deliver it',
        p: ['Four things decide how strongly a reinforcer works. Immediacy: within a few seconds of the behavior. Contingency: only after the behavior, not at other times. Magnitude: how much. Quality: how good, to this person, right now.',
            'The plan sets these, and you keep to them. A reinforcer that arrives late may strengthen whatever the student did in between. One that is also handed out for free loses its link with the behavior.',
            'What a person wants changes through the day. After a snack, food pulls less; after an hour without the tablet, the tablet pulls more. Your supervisor plans for this, and you can see it first.'],
        check: { q: 'Zara reads a sentence correctly. The aide finishes writing a note and praises her 40 seconds later, while Zara is looking out of the window. The weakness is:',
          opts: ['Magnitude.', 'Quality.', 'Variety.', 'Immediacy.'],
          a: 3, why: 'After 40 seconds the praise follows looking out of the window, not reading.' } },
      { h: 'Schedules',
        p: ['A schedule says which responses are reinforced. On a continuous schedule every correct response is. It is used to teach something new. On an intermittent schedule only some are. It is used to keep a learned behavior going, and behavior learned this way lasts longer.',
            'A ratio schedule counts responses: fixed ratio 3 (FR 3) reinforces every third response; variable ratio 3 (VR 3) reinforces after three on average. An interval schedule uses time: fixed interval 2 minutes (FI 2) reinforces the first response after two minutes have passed; variable interval 2 (VI 2) does so after two minutes on average.',
            'Moving from a rich schedule to a leaner one is called thinning. It is done in small steps, and it is the supervisor’s decision.'],
        check: { q: 'A student earns a token after every fifth math problem. Which schedule is this?',
          opts: ['FR 5', 'VR 5', 'FI 5', 'Continuous'],
          a: 0, why: 'A fixed number of responses, five, earns the reinforcer.' } },
      { h: 'When it stops working',
        p: ['Tell your supervisor when a reinforcer is refused, handed back, used for a moment and dropped, or when the behavior it follows is fading. Tell them too when the student asks for something else again and again.',
            'Do not swap the reinforcer or raise the amount yourself. Preference assessments, which you will learn to run, are how the team finds what works now.'],
        check: { q: 'For three sessions Milo has pushed away the crackers he used to work for. What do you do?',
          opts: ['Offer more crackers each time.', 'Switch to candy.', 'Record it and tell your supervisor.', 'Stop using reinforcement.'],
          a: 2, why: 'The data and your report let the supervisor decide, usually with a new preference assessment.' } }
    ],
    examples: {
      ask: 'What is this?',
      intro: 'Eight scenes. In each, decide whether it shows positive reinforcement, negative reinforcement, or no reinforcement at all.',
      opts: ['Positive reinforcement', 'Negative reinforcement', 'Not reinforcement'],
      items: [
        { s: 'Each time Aya raises her hand the teacher calls on her. She raises her hand more and more.', a: 0, why: 'Attention is added after the behavior, and the behavior increases.' },
        { s: 'When Cole whines during spelling he is sent to the hall. He whines more in spelling as the weeks go by.', a: 1, why: 'Spelling is removed after whining, and whining increases.' },
        { s: 'Fay gets a sticker for each page. She does no more pages than before.', a: 2, why: 'The behavior did not increase, so the sticker is not acting as a reinforcer.' },
        { s: 'Gus puts on his headphones and the hallway noise stops. He reaches for them sooner each day.', a: 1, why: 'Noise is removed by the behavior, and the behavior increases.' },
        { s: 'Hana is told off each time she hums. She hums more each week.', a: 0, why: 'Something is added (the telling off) and humming goes up. Meant as a reprimand, it works as reinforcement.' },
        { s: 'Ivan asks for help; the aide comes and shows him the step. He asks for help more often.', a: 0, why: 'Help and attention are added, and asking increases.' },
        { s: 'Every ten minutes the class gets a stretch break, whatever anyone is doing.', a: 2, why: 'The break does not depend on any behavior, so nothing in particular is reinforced.' },
        { s: 'Jo finishes five problems and the rest of the page is crossed off. She finishes the first five faster each day.', a: 1, why: 'Work is removed after the behavior, and the behavior strengthens.' }
      ]
    },
    practice: {
      title: 'Deliver reinforcement as the plan says',
      intro: 'You are teaching Nell, a simulated student, to name colors. Read the plan, then decide.',
      plan: ['New colors (red, blue): praise and one token for every correct answer.', 'Learned colors (green, yellow): praise and one token for every third correct answer.', 'Give the token within 3 seconds, with the words “Yes, that is …”.', 'Five tokens: 2 minutes with the bubbles.'],
      steps: [
        { t: 'Trial 1', see: 'You hold up red. Nell says, “Red.”', opts: ['Praise and one token at once.', 'Praise only: save the tokens.', 'Wait for two more correct answers.'], a: 0, why: 'Red is a new color, and new colors are on a continuous schedule.' },
        { t: 'Trial 4', see: 'You hold up green. Nell says, “Green.” It is her first correct “green” since her last token for a learned color.', opts: ['Praise and a token.', 'Go on to the next trial without a token: learned colors earn one for every third correct answer.', 'Take a token away.'], a: 1, why: 'Green is on FR 3. A neutral “next one” keeps the pace; the token comes on the third.' },
        { t: 'Trial 9', see: 'Nell says “Blue” correctly. Your tokens have slid under the folder and it takes you 15 seconds to find one.', opts: ['Give it when you find it, and say nothing.', 'Give two tokens to make up for the delay.', 'Praise at once, give the token as soon as you have it, and put the tokens in reach before the next trial.'], a: 2,
          why: 'Praise can still be immediate. The fix is to have materials in reach; extra tokens are not in the plan.' },
        { t: 'Trial 14', see: 'Nell has five tokens.', opts: ['Keep going: she is on a roll.', 'Trade the tokens for 2 minutes with the bubbles now.', 'Let her choose something bigger.'], a: 1, why: 'The exchange is part of the schedule. Delaying it weakens the tokens.' },
        { t: 'Trial 20', see: 'For the second day, Nell pushes the bubbles away when she earns them.', opts: ['Record it and tell your supervisor today.', 'Give her your phone instead.', 'Skip the exchange from now on.'], a: 0, why: 'The reinforcer may have lost its value. Choosing a new one is the supervisor’s decision.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'A consequence is a reinforcer when:', opts: ['The adult intends it as a reward.', 'The student smiles.', 'The behavior it follows increases.', 'It costs money.'], a: 2, why: 'Reinforcement is defined by its effect on future behavior.' },
      { q: 'In negative reinforcement:', opts: ['Something is removed or avoided and the behavior increases.', 'Something unpleasant is added and the behavior decreases.', 'A reward is taken away.', 'The behavior is ignored.'], a: 0, why: 'Removal plus an increase.' },
      { q: 'A student screams and is taken out of the noisy assembly. Screaming at assemblies increases. This is:', opts: ['Positive reinforcement.', 'Punishment.', 'Extinction.', 'Negative reinforcement.'], a: 3, why: 'The noise and the assembly were removed, and the behavior went up.' },
      { q: 'Praise 5 minutes after the behavior is weak mainly because of:', opts: ['Magnitude.', 'Immediacy.', 'Quality.', 'Schedule.'], a: 1, why: 'The longer the delay, the weaker the link.' },
      { q: 'A continuous schedule is used mostly to:', opts: ['Teach a new behavior.', 'Keep an old behavior going for years.', 'Save reinforcers.', 'Reduce problem behavior.'], a: 0, why: 'Every correct response is reinforced while the behavior is being learned.' },
      { q: 'A token after an average of four correct answers is:', opts: ['FR 4', 'FI 4', 'VR 4', 'Continuous'], a: 2, why: 'A number of responses that varies around four.' },
      { q: 'The first response after 3 minutes have passed is reinforced, every time. This is:', opts: ['VR 3', 'FI 3', 'FR 3', 'VI 3'], a: 1, why: 'A fixed amount of time, then the first response.' },
      { q: 'Thinning a schedule means:', opts: ['Giving larger reinforcers.', 'Stopping reinforcement at once.', 'Changing the reinforcer.', 'Moving step by step to less frequent reinforcement.'], a: 3, why: 'It is done gradually and decided by the supervisor.' },
      { q: 'Right after lunch, a snack works less well as a reinforcer. This is because:', opts: ['The student is being difficult.', 'The value of a reinforcer changes with how much of it the person has just had.', 'Snacks are never reinforcers.', 'The schedule is wrong.'], a: 1, why: 'Having had plenty lowers the pull of more.' },
      { q: 'A reinforcer that is also given freely at other times loses strength because of weak:', opts: ['Contingency.', 'Magnitude.', 'Immediacy.', 'Variety.'], a: 0, why: 'It no longer depends on the behavior.' },
      { q: 'A reprimand is followed by more of the behavior. The reprimand is working as:', opts: ['Punishment.', 'Negative reinforcement.', 'Positive reinforcement.', 'Extinction.'], a: 2, why: 'Something was added and the behavior increased.' }
    ] },
    role: [
      { t: 'Reinforce on two schedules', setup: 'The trainer plays a student answering simple questions. New items are on a continuous schedule, learned items on FR 3, with a token board.',
        steps: ['Has tokens and the board in reach before starting.', 'Gives praise and a token within 3 seconds for every correct new item.', 'Gives a token on every third correct learned item, and not before.',
                'Names what earned the token.', 'Makes the exchange as soon as the board is full.', 'Keeps a tally of correct answers and tokens.'] }
    ],
    roleRule: 'Met when a run of 15 trials has every step in place, without help.',
    discuss: [
      'Think of something you do to make an unpleasant thing stop. Is that behavior stronger now than it was a year ago?',
      'Why might praise work for one student and not for another?',
      'What would you look for to tell that a reinforcer is losing its value during a session?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapters on positive reinforcement, negative reinforcement and schedules.',
      'Vollmer, T. R., & Hackenberg, T. D. (2001). Reinforcement contingencies and social reinforcement: Some reciprocal relations between basic and applied research. Journal of Applied Behavior Analysis, 34(2), 241–253.'
    ]
  },

  a4: {
    aim: [
      'Name the four common functions of behavior and say what each one gets the person.',
      'Explain why the same behavior can have different functions for different people.',
      'Say who identifies the function and what the technician contributes.'
    ],
    lesson: [
      { h: 'Behavior works for the person',
        p: ['Problem behavior is learned in the same way as any other behavior: it keeps happening because of what follows it. The function of a behavior is the kind of consequence that keeps it going.',
            'Asking “What is this behavior for?” is more useful than asking “What is wrong with this child?” It points to something that can be changed: teach another way to get the same thing.'],
        check: { q: 'The “function” of a behavior is:',
          opts: ['Its shape: what it looks like.', 'How often it happens.', 'The kind of consequence that keeps it going.', 'The diagnosis behind it.'],
          a: 2, why: 'Function is about what the behavior gets or gets rid of.' } },
      { h: 'The four common functions',
        p: ['Attention: the behavior brings another person’s eyes, words or touch, pleasant or not. Tangible: it brings an item or an activity. Escape or avoidance: it ends, delays or prevents something, usually a task, a demand or a place. Automatic: the behavior produces its own result, a feeling or a relief, without anyone else doing anything.',
            'The first two are positive reinforcement delivered by other people, the third is negative reinforcement, and the fourth needs no other person at all.'],
        key: ['Attention', 'Items or activities (tangible)', 'Escape or avoidance', 'Automatic'],
        check: { q: 'When asked to write, Pia slides under the table, and the writing is put off until later. Sliding under the table most likely has which function?',
          opts: ['Attention', 'Escape', 'Tangible', 'Automatic'],
          a: 1, why: 'What follows is that the task is delayed. That is escape.' } },
      { h: 'Same behavior, different function',
        p: ['Two students scream. For one, screaming brings the teacher over. For the other, it gets him sent out of math. They look alike and need different plans. A plan that gives the first student attention for asking would do nothing for the second.',
            'One behavior can also have more than one function, and the function can differ between settings. That is why plans are written for one person, from that person’s assessment.'],
        check: { q: 'Why does a plan for one student’s hitting often fail when copied for another student who hits?',
          opts: ['Hitting is always automatic.', 'Plans cannot be copied by law.', 'The second student is older.', 'The two students’ hitting may be kept going by different consequences.'],
          a: 3, why: 'A plan matches the function, and the function belongs to the person, not to the form of the behavior.' } },
      { h: 'Who finds the function',
        p: ['Your supervisor identifies the function through a functional assessment: interviews, direct observation, and sometimes a functional analysis, in which conditions are tested one at a time.',
            'You help by recording what happened before and after, by running the conditions exactly as written when you are asked to, and by not deciding the function yourself. A confident guess that is wrong sends the plan the wrong way.'],
        check: { q: 'You are fairly sure a student’s shouting is “for attention”. What do you do with that idea?',
          opts: ['Tell your supervisor what you have observed, as sequences of events.', 'Start ignoring the shouting.', 'Tell the family it is for attention.', 'Write “attention-seeking” on the data sheet.'],
          a: 0, why: 'Your observations are useful. The conclusion, and any change to how adults respond, comes from the supervisor’s assessment.' } }
    ],
    examples: {
      ask: 'Which function fits best?',
      intro: 'Eight scenes. In each, what follows the behavior is given. Choose the function that fits best.',
      opts: ['Attention', 'Tangible', 'Escape', 'Automatic'],
      items: [
        { s: 'While the teacher helps others, Rosa drops her pencil again and again. Each time, the teacher walks over and talks to her.', a: 0, why: 'What follows is the teacher’s attention.' },
        { s: 'In the shop, Sol cries at the checkout until he is given a sweet.', a: 1, why: 'Crying is followed by an item.' },
        { s: 'When the timer signals clean-up, Tai runs to the other side of the room, and an adult tidies for him.', a: 2, why: 'The demand is avoided.' },
        { s: 'Alone in the reading corner, with nobody near, Uma rocks back and forth.', a: 3, why: 'No one else is involved; the behavior produces its own result.' },
        { s: 'Vik grabs the tablet from a classmate and gets to play until an adult notices.', a: 1, why: 'Grabbing gets him the item.' },
        { s: 'Wren swears in class; classmates laugh and look at her.', a: 0, why: 'Peers’ attention follows.' },
        { s: 'During fire drills, Xan covers his ears and hums loudly. He does this whether or not anyone is near.', a: 3, why: 'It happens regardless of other people, and it changes what he hears.' },
        { s: 'Yara puts her head down when a test is handed out, and the teacher says she can do it tomorrow.', a: 2, why: 'The test is put off.' }
      ]
    },
    practice: {
      title: 'Help with a functional assessment',
      intro: 'Your supervisor is assessing why Dana, a simulated student, tears her work. You are asked to help. Decide what to do at each point.',
      steps: [
        { t: 'Week 1', see: 'You are given an ABC sheet for Dana’s tearing and asked to complete it for five days.', opts: ['Record each instance as it happens: what came before, what she did, what followed.', 'Fill it in at the end of the week from memory.', 'Record only the days when tearing was bad.'], a: 0,
          why: 'Records made at the time, for every instance, are the ones the pattern can be read from.' },
        { t: 'Week 1', see: 'On Wednesday, tearing happens when no task was given. It does not fit what you expected.', opts: ['Leave it out: it confuses the picture.', 'Record it like the others.', 'Change the antecedent to “task given”.'], a: 1,
          why: 'The instance that does not fit may be the most informative one.' },
        { t: 'Week 2', see: 'The classroom aide says, “She does it to get out of work. Let’s just make her finish every time.”', opts: ['Agree and start today.', 'Say that the assessment is not finished, keep to the current plan, and tell your supervisor what the aide suggested.', 'Tell the aide she is wrong.'], a: 1,
          why: 'Changing how adults respond in the middle of an assessment muddies it, and the change may be wrong.' },
        { t: 'Week 3', see: 'Your supervisor sets up a short test: in one condition you give a task and remove it for 30 seconds if Dana tears. The script says to say nothing else.', opts: ['Add a gentle “No tearing” each time.', 'Follow the script exactly.', 'Remove the task for longer if she seems upset.'], a: 1,
          why: 'Each condition tests one consequence. Anything you add changes what is being tested.' },
        { t: 'Week 3', see: 'During the test Dana tears a page and then bites her hand hard.', opts: ['Follow the safety instructions your supervisor gave for the session, and tell your supervisor at once.', 'Keep going: the script does not mention biting.', 'End all sessions for the week on your own.'], a: 0,
          why: 'Safety comes first, and every test has stopping rules. The supervisor decides what happens next.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Which of these is one of the four common functions?', opts: ['Defiance', 'Frustration', 'Escape', 'Immaturity'], a: 2, why: 'The four are attention, tangible, escape and automatic.' },
      { q: 'A behavior with an automatic function:', opts: ['Produces its own reinforcing result without another person.', 'Is done without thinking.', 'Cannot be changed.', 'Always involves machines.'], a: 0, why: 'No one else has to do anything for the behavior to pay off.' },
      { q: 'A reprimand follows calling out, and calling out increases. The likely function is:', opts: ['Escape', 'Attention', 'Automatic', 'Tangible'], a: 1, why: 'A reprimand is attention.' },
      { q: 'A student bites when the swing is taken away and gets it back. The function is most likely:', opts: ['Attention', 'Automatic', 'Escape', 'Tangible'], a: 3, why: 'Biting brings the activity back.' },
      { q: 'Escape-maintained behavior is kept going by:', opts: ['Positive reinforcement', 'Negative reinforcement', 'Punishment', 'Nothing'], a: 1, why: 'Something unwanted is removed, delayed or avoided.' },
      { q: 'Two students do the same thing for different reasons. This shows that:', opts: ['One of them is pretending.', 'The assessment was wrong.', 'Function cannot be told from what a behavior looks like.', 'Functions do not matter.'], a: 2, why: 'Form and function are separate.' },
      { q: 'Who identifies the function of a behavior?', opts: ['The supervisor, through a functional assessment.', 'The technician, from experience.', 'The teacher, by voting.', 'Nobody: it cannot be known.'], a: 0, why: 'It is an assessment task.' },
      { q: 'The technician’s part in a functional assessment includes:', opts: ['Choosing the function.', 'Explaining the results to the family alone.', 'Changing the plan as results come in.', 'Recording antecedents and consequences and running conditions as written.'], a: 3, why: 'Accurate records and faithful procedures.' },
      { q: 'Why is knowing the function useful?', opts: ['It tells you whom to blame.', 'The person can be taught another way to get the same result.', 'It replaces data collection.', 'It makes the behavior stop at once.'], a: 1, why: 'Plans that match the function teach a replacement.' },
      { q: 'A behavior happens at the same rate whether or not anyone is in the room. This suggests:', opts: ['Attention', 'Tangible', 'Automatic', 'Escape'], a: 2, why: 'It does not depend on what other people do.' }
    ] },
    role: [
      { t: 'From a scene to a report', setup: 'The trainer acts out four short scenes, one for each function. After each, the trainee reports it as they would to a supervisor.',
        steps: ['Says what came before, what the student did and what followed.', 'Uses observable words.', 'Does not name a function as a fact.', 'Says what they would record on the ABC sheet.'] }
    ],
    roleRule: 'Met when all four scenes are reported with every step in place.',
    discuss: [
      'Think of something you do that works to get you out of a task. How did you learn it?',
      'Why is it tempting to name the function yourself, and what can go wrong when you do?'
    ],
    read: [
      'Iwata, B. A., Dorsey, M. F., Slifer, K. J., Bauman, K. E., & Richman, G. S. (1994). Toward a functional analysis of self-injury. Journal of Applied Behavior Analysis, 27(2), 197–209. (Reprinted from 1982.)',
      'Hanley, G. P., Iwata, B. A., & McCord, B. E. (2003). Functional analysis of problem behavior: A review. Journal of Applied Behavior Analysis, 36(2), 147–185.'
    ]
  }
});
