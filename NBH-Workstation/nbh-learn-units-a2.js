/* nbh-learn-units-a2.js (v26.01): written units of the Learning page, section A (a5, a6) and section B (Preparing for service
   delivery: b1, b2). The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  a5: {
    aim: [
      'Tell a mand, a tact, an echoic and an intraverbal apart by what comes before the words and what follows them.',
      'Explain why the same word can be four different things to teach.',
      'Reinforce each one as the plan says.'
    ],
    lesson: [
      { h: 'Words are behavior too',
        p: ['Speaking, signing, handing over a picture and pressing a button on a device are all behavior, learned through what comes before and what follows. Skinner sorted this “verbal behavior” not by the words but by what they are for. The sorts are called verbal operants.',
            'A mand is asking. It happens when the person wants something, and it is reinforced by getting that very thing: “Juice” gets juice. A tact is naming. It happens when the person sees, hears, smells or touches something, and it is reinforced by a general response such as praise: seeing a dog and saying “Dog” gets “Yes, a dog!”'],
        key: ['Mand: wants it, asks, gets it.', 'Tact: senses it, names it, gets praise or a nod.'],
        check: { q: 'Lena is thirsty, signs “water”, and is given water. This is a:',
          opts: ['Tact', 'Mand', 'Echoic', 'Intraverbal'],
          a: 1, why: 'She wanted water, asked, and got that very thing.' } },
      { h: 'Repeating and answering',
        p: ['An echoic is repeating what was just heard: the adult says “ball” and the student says “ball”. The words match. Echoics are used as prompts all the time.',
            'An intraverbal is answering or continuing someone else’s words when the words do not match: “What do you drink?” “Water.” “Ready, set …” “Go!” Conversation is mostly intraverbals.',
            'Programs also teach listener skills (following “touch your nose”) and imitation of movements. They are close relatives, taught alongside.'],
        check: { q: 'The aide says, “Twinkle, twinkle, little …” and Omar says, “Star.” This is:',
          opts: ['An intraverbal', 'An echoic', 'A tact', 'A mand'],
          a: 0, why: 'Omar’s word was set off by the aide’s words and does not match them. There is no star in sight, and he is not asking for one.' } },
      { h: 'One word, four things to teach',
        p: ['A student who says “cookie” when he wants one may not be able to say it when shown a cookie, or when asked “What do you eat at snack?” Each is learned separately, so each is a separate target with its own data.',
            'That is why your plan says which operant a target is, and why the reinforcer differs. A mand is reinforced with the thing asked for. A tact, an echoic and an intraverbal are reinforced with praise, a token or whatever the plan sets, not with the thing named.',
            'A mand needs motivation. If the student has just had ten minutes of bubbles, this is the wrong moment to teach asking for bubbles.'],
        check: { q: 'In a mand lesson, Kai says “car”. What follows?',
          opts: ['“Good talking!” and a sticker.', 'The next flashcard.', 'A tickle.', 'The car.'],
          a: 3, why: 'A mand is reinforced by the thing asked for. Praise alone would teach naming, not asking.' } }
    ],
    examples: {
      ask: 'Which verbal operant is this?',
      intro: 'Eight short moments. Decide what the words are doing.',
      opts: ['Mand', 'Tact', 'Echoic', 'Intraverbal'],
      items: [
        { s: 'Ada looks out of the window and says, “Bus!” The aide says, “Yes, the bus is here.”', a: 1, why: 'She names something she sees and gets a general response.' },
        { s: 'The teacher says, “Say ‘apple’.” Bo says, “Apple.”', a: 2, why: 'His word matches what he heard.' },
        { s: 'Cy hands over a picture of a swing and is taken to the swing.', a: 0, why: 'He asks, with a picture, and gets the thing asked for.' },
        { s: '“What is your name?” “Dee.”', a: 3, why: 'A reply to someone else’s words that does not repeat them.' },
        { s: 'Eli smells popcorn in the hall and says, “Popcorn.” The teacher smiles and nods.', a: 1, why: 'A smell sets it off, and the result is social.' },
        { s: 'Flo cannot open her lunch box, says, “Help,” and an adult opens it.', a: 0, why: 'She asks for help and gets help.' },
        { s: '“A cow says …” “Moo.”', a: 3, why: 'A fill-in: the words differ from the ones heard.' },
        { s: 'The therapist signs “more” and Gil copies the sign. Nothing is on offer.', a: 2, why: 'He repeats the model in the same form. With nothing on offer it is not a request.' }
      ]
    },
    practice: {
      title: 'Run a language session',
      intro: 'You are working with Rio, a simulated student, on three targets. Read the plan, then decide.',
      plan: ['Mand “bubbles”: when Rio reaches for the bubbles, model the word once; when he says it, give the bubbles at once.', 'Tact “dog” from a picture: praise and a token for a correct answer.', 'Intraverbal “Ready, set …” “go”: praise and a token.'],
      steps: [
        { t: 'Minute 2', see: 'Rio reaches toward the bubbles on the shelf and looks at you.', opts: ['Hand them over: he clearly wants them.', 'Say “bubbles” once and wait for him to say it.', 'Ask, “What is this?”'], a: 1, why: 'The reach shows he wants them, which is the moment for a mand. The plan gives an echoic model as the prompt.' },
        { t: 'Minute 2', see: 'Rio says, “Bubbles.”', opts: ['Give him the bubbles at once.', 'Say, “Good talking,” and give a token.', 'Ask him to say it three more times first.'], a: 0, why: 'The mand is reinforced by what was asked for, immediately.' },
        { t: 'Minute 6', see: 'You hold up the picture of a dog and ask, “What is it?” Rio says, “Dog.”', opts: ['Give him the bubbles.', 'Praise and a token.', 'Say nothing and show the next picture.'], a: 1, why: 'This is the tact target. Its reinforcer is praise and a token.' },
        { t: 'Minute 9', see: 'You say, “Ready, set …” Rio says, “Go!” Your data sheet has a column for each target.', opts: ['Mark it under “echoic”.', 'Mark it under the mand.', 'Mark it under the intraverbal, and give praise and a token.'], a: 2, why: 'His word completes yours without repeating it. Scoring it in the right column keeps each target’s data clean.' },
        { t: 'Minute 15', see: 'Rio has had the bubbles for several minutes. He pushes them away and looks at the trains.', opts: ['Keep running bubbles trials to reach your number.', 'Hold the bubbles out of reach until he asks.', 'Stop the bubbles trials, note it, and tell your supervisor he was looking at the trains.'], a: 2,
          why: 'Without motivation there is no mand to teach. What he wants now is useful information for the supervisor.' }
      ]
    },
    quiz: { pass: 80, draw: 6, items: [
      { q: 'A mand is reinforced by:', opts: ['Praise.', 'The thing asked for.', 'A token.', 'Nothing.'], a: 1, why: 'That is what makes it asking.' },
      { q: 'A tact is set off by:', opts: ['Something the person senses.', 'Wanting something.', 'Someone else’s words.', 'A model to copy.'], a: 0, why: 'Seeing, hearing, smelling or touching something.' },
      { q: 'In an echoic, the response:', opts: ['Answers a question.', 'Asks for an item.', 'Matches what was just heard.', 'Names a picture.'], a: 2, why: 'The words are the same.' },
      { q: '“What day is it?” “Monday.” This is:', opts: ['A mand', 'A tact', 'An echoic', 'An intraverbal'], a: 3, why: 'Words set off by words, without matching them.' },
      { q: 'A student can ask for a cookie but cannot name one in a picture. This shows that:', opts: ['He is not trying.', 'The operants are learned separately.', 'The picture is poor.', 'He needs a bigger reinforcer.'], a: 1, why: 'Each is its own target.' },
      { q: 'The best moment to teach a mand for a toy is when the student:', opts: ['Has just finished playing with it.', 'Is asleep.', 'Is reaching for it.', 'Has refused it twice.'], a: 2, why: 'A mand needs motivation.' },
      { q: 'Handing over a picture card to get a snack is:', opts: ['A mand, even without speech.', 'Not verbal behavior.', 'A tact.', 'An echoic.'], a: 0, why: 'The form does not matter; the function does.' },
      { q: 'Why does the plan name the operant for each language target?', opts: ['For billing.', 'To make the data sheet longer.', 'It does not matter in practice.', 'Because the prompt and the reinforcer differ for each.'], a: 3, why: 'Teaching and reinforcement are matched to the operant.' }
    ] },
    role: [
      { t: 'Three trials, three operants', setup: 'The trainer plays a student. The trainee runs one mand trial, one tact trial and one intraverbal trial from a short written plan.',
        steps: ['Runs the mand trial only when the “student” shows they want the item.', 'Gives the item asked for, at once.', 'Reinforces the tact and the intraverbal with praise or a token, not with the thing named.', 'Scores each trial under the right target.'] }
    ],
    roleRule: 'Met when the three trials are run with every step in place.',
    discuss: [
      'Why might a child who can name fifty pictures still be unable to ask for a drink?',
      'What do you look for to tell that a student wants something right now?'
    ],
    read: [
      'Skinner, B. F. (1957). Verbal behavior. Appleton-Century-Crofts.',
      'Sundberg, M. L., & Michael, J. (2001). The benefits of Skinner’s analysis of verbal behavior for children with autism. Behavior Modification, 25(5), 698–724.'
    ]
  },

  a6: {
    aim: [
      'Name the phases an intervention moves through: baseline, intervention, generalization and maintenance.',
      'Say what you do, and do not do, in each.',
      'Tell a target that is being acquired from one that is being maintained.'
    ],
    lesson: [
      { h: 'Baseline: measure first',
        p: ['Baseline is the measurement taken before anything is changed. It shows how often, how long or how well the behavior happens now, so that later data have something to be compared with.',
            'In baseline you record, and you respond as people have been responding. You do not start teaching, prompting or reinforcing in the new way, even when you can see what would help. A baseline that already has the intervention mixed into it hides the effect.'],
        check: { q: 'During baseline for a new reading goal, you notice the student would get it right with a small hint. What do you do?',
          opts: ['Give the hint: it helps the student.', 'Record what the student does without the hint, as the baseline procedure says.', 'Skip baseline and start teaching.', 'Give the hint and mark the answer correct.'],
          a: 1, why: 'Baseline measures what the student does before teaching. Hints now would make the starting point look higher than it is.' } },
      { h: 'Intervention: run the plan and watch the data',
        p: ['In the intervention phase the plan is in force. You run it as written and keep measuring in the same way as in baseline, so that the two can be compared on one graph.',
            'A skill being taught now is in acquisition: prompts are in use and reinforcement is frequent. When the student meets the mastery criterion the plan sets, the skill moves on.'],
        check: { q: 'Why is the behavior measured the same way in baseline and in intervention?',
          opts: ['So that a change on the graph reflects the student, not a change in how it was measured.', 'To save paper.', 'Because the funder requires one form.', 'It need not be.'],
          a: 0, why: 'If the measurement changes, nobody can tell what the difference between phases means.' } },
      { h: 'Generalization and maintenance',
        p: ['A skill is not finished when it happens with one adult at one table. Generalization means it happens with other people, in other places, with other materials, and in forms that were not directly taught. It is planned, not hoped for.',
            'Maintenance means the skill is still there after teaching has stopped or reinforcement has been thinned. Mastered targets are checked now and then, with fewer prompts and leaner reinforcement. A maintenance check is a check: you do not re-teach unless the plan says what to do when the skill has slipped.'],
        key: ['Acquisition: being taught now, with prompts and frequent reinforcement.', 'Maintenance: mastered, checked from time to time.'],
        check: { q: 'A mastered target is checked once a week with no prompt. On this week’s check the student gets it wrong. What do you do?',
          opts: ['Prompt until it is right and score it correct.', 'Drop the target.', 'Record the error and follow what the plan says for a failed check, or ask your supervisor.', 'Move it back to acquisition yourself.'],
          a: 2, why: 'The check is data. What follows a failed check is in the plan or is the supervisor’s decision.' } }
    ],
    examples: {
      ask: 'Which phase is this?',
      intro: 'Six moments from one student’s program for asking for a turn. Decide which phase each belongs to.',
      opts: ['Baseline', 'Intervention', 'Generalization', 'Maintenance'],
      items: [
        { s: 'For five days, before any teaching, you count how often Mara asks for a turn at recess.', a: 0, why: 'Measurement before anything is changed.' },
        { s: 'You prompt “My turn, please” at the game table and give the turn at once when she says it.', a: 1, why: 'The plan is in force; the skill is being taught.' },
        { s: 'Mara has met the criterion with you. Now a second adult runs the same game with her in the library.', a: 2, why: 'Another person and another place.' },
        { s: 'A month after teaching ended, you watch one recess and count her requests.', a: 3, why: 'A check that the skill is still there.' },
        { s: 'The game is swapped for a different one she has not played with you.', a: 2, why: 'New materials.' },
        { s: 'You record how Mara gets a turn now (she grabs), and adults respond as they always have.', a: 0, why: 'Nothing has changed yet; you are measuring.' }
      ]
    },
    practice: {
      title: 'One target, start to finish',
      intro: 'You are following one target for Theo, a simulated student: zipping his coat. Decide what to do at each point.',
      steps: [
        { t: 'Week 1, baseline', see: 'Theo struggles with the zip and looks at you. The baseline sheet says: give the instruction once, wait 10 seconds, record, then help him finish without comment.', opts: ['Talk him through each step.', 'Wait 10 seconds, record what he did alone, then help him finish.', 'Do it for him at once.'], a: 1,
          why: 'Baseline shows what he can do alone. Coaching belongs to the next phase.' },
        { t: 'Week 2, intervention', see: 'Teaching has begun. The plan gives a prompt for each step and praise for each one done.', opts: ['Run the prompts and praise as written, and record each step.', 'Keep doing baseline until he improves.', 'Use your own prompts: you know him now.'], a: 0, why: 'The plan is in force, and the measurement stays the same.' },
        { t: 'Week 5', see: 'Theo has zipped his coat alone in three sessions in a row, which is the mastery criterion.', opts: ['Stop recording zipping.', 'Tell your supervisor the criterion has been met.', 'Start a new target of your choice.'], a: 1, why: 'Meeting the criterion is a decision point, and the decision is the supervisor’s.' },
        { t: 'Week 6', see: 'The plan now says: practice with a different coat, and with the classroom aide at home time.', opts: ['It is not needed: he can already do it.', 'Do it only with his own coat.', 'Run it as written and record how he does with the new coat and the new person.'], a: 2, why: 'Generalization is tested and taught on purpose.' },
        { t: 'Week 10', see: 'Monthly check. Theo gets the zip started but cannot pull it up.', opts: ['Record what he did, help him finish, and report the result.', 'Score it correct: he nearly did it.', 'Re-teach it there and then for 20 minutes.'], a: 0, why: 'An honest check tells the supervisor the skill needs attention.' }
      ]
    },
    quiz: { pass: 80, draw: 6, items: [
      { q: 'Baseline data are collected:', opts: ['After the plan has worked.', 'Before the intervention starts.', 'Only when there is a problem.', 'At the end of the year.'], a: 1, why: 'They show the starting point.' },
      { q: 'In baseline you:', opts: ['Start prompting early.', 'Reinforce every attempt.', 'Record, and respond as usual.', 'Skip data on bad days.'], a: 2, why: 'Nothing new is introduced yet.' },
      { q: 'A skill in acquisition is one that:', opts: ['Is being taught now.', 'Was mastered last year.', 'Will never be taught.', 'Is measured only at home.'], a: 0, why: 'Prompts and frequent reinforcement are in use.' },
      { q: 'Generalization means the skill:', opts: ['Is still present after a month.', 'Is done faster.', 'Is done only with the first teacher.', 'Appears with other people, places and materials.'], a: 3, why: 'It carries over beyond the teaching situation.' },
      { q: 'Maintenance means the skill:', opts: ['Needs more prompts.', 'Lasts after teaching stops or reinforcement is thinned.', 'Is being taught for the first time.', 'Is measured in baseline.'], a: 1, why: 'It is still there later.' },
      { q: 'A mastery criterion is:', opts: ['The first correct answer.', 'The technician’s feeling that the student has it.', 'The level of performance the plan sets for moving on.', 'The end of the school year.'], a: 2, why: 'It is written in the plan.' },
      { q: 'When a student meets the mastery criterion, you:', opts: ['Tell your supervisor.', 'Choose the next target.', 'Stop all data.', 'Raise the criterion.'], a: 0, why: 'The next step is the supervisor’s decision.' },
      { q: 'On a maintenance check the student makes an error. You:', opts: ['Hide it.', 'Prompt and score it correct.', 'Remove the target.', 'Record it and follow the plan or ask your supervisor.'], a: 3, why: 'The check has done its job by finding the slip.' }
    ] },
    role: [
      { t: 'Baseline or teaching?', setup: 'The trainer plays a student and hands the trainee first a baseline sheet, then a teaching procedure, for the same simple skill.',
        steps: ['In baseline: gives the instruction as written and no help.', 'In baseline: records what the “student” did alone.', 'In teaching: uses the prompts and reinforcement as written.', 'Records in the same way in both.', 'Says which phase each was and why they differ.'] }
    ],
    roleRule: 'Met when both runs are done with every step in place.',
    discuss: [
      'Why is it hard to hold back help during baseline? What would you say to a colleague who gives hints?',
      'Think of a skill you learned and then lost. What would have kept it?'
    ],
    read: [
      'Stokes, T. F., & Baer, D. M. (1977). An implicit technology of generalization. Journal of Applied Behavior Analysis, 10(2), 349–367.',
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on generalization and maintenance.'
    ]
  },

  b1: {
    aim: [
      'Arrive ready to work: on time, fit, and knowing today’s plan.',
      'Read the plan and the last session’s notes before the session, and ask about anything unclear.',
      'Set out materials and arrange the room so the session can run without stopping.'
    ],
    lesson: [
      { h: 'Yourself',
        p: ['Being ready starts before you arrive. You are on time, rested enough to pay attention for the whole session, dressed for moving and sitting on the floor, with your phone put away.',
            'You are also fit to work. Illness, exhaustion or a personal crisis can affect how safely and how well you serve a student. When that is so, the ethics code expects you to tell your supervisor and sort out what to do, not to push through and hope.'],
        check: { q: 'You slept two hours and feel unable to concentrate. Your first session involves a student who sometimes runs toward the road. What do you do?',
          opts: ['Say nothing and drink coffee.', 'Tell your supervisor before the session and agree what to do.', 'Run the session but skip the data.', 'Cancel by text to the family.'],
          a: 1, why: 'Your condition affects safety. The supervisor decides how the session is covered; contacting the family yourself is not the route.' } },
      { h: 'The plan and the last notes',
        p: ['Before each session, read what you will run: the targets, the procedures, the reinforcers, and what to do when problem behavior happens. Plans change, so read the current one.',
            'Read the notes from the last session as well: what was run, how it went, anything unusual, anything about health or home that could matter today. If the last note says a procedure changed and you have not been trained in the change, ask before the session, not during it.'],
        key: ['What am I teaching today?', 'What do I do if problem behavior happens?', 'What changed since last time?'],
        check: { q: 'Yesterday’s note says, “New prompt procedure for dressing, see the updated plan.” Nobody has shown it to you. You:',
          opts: ['Use the old procedure: it worked.', 'Guess from the wording.', 'Skip dressing today without telling anyone.', 'Ask your supervisor to show you before you run dressing.'],
          a: 3, why: 'You run a procedure only after you have been trained on it. Asking first protects the student and the data.' } },
      { h: 'Materials',
        p: ['Collect what the session needs before the student arrives: teaching materials for each target, the reinforcers the plan names, tokens and board, a timer, and the data sheets or a charged device.',
            'Check the reinforcers. Are they there, do they work, are they safe for this student, and are they within your reach and out of the student’s? A session that stops while you look for the bubbles has lost its pace, and often its calm.'],
        check: { q: 'Five minutes before the session you find the tablet used as a reinforcer has a flat battery. Best choice:',
          opts: ['Start anyway and promise the tablet for later.', 'Use food instead.', 'Put it on charge, check the plan for the other reinforcers it names, and let your supervisor know if none can be used.', 'Cancel the session.'],
          a: 2, why: 'You solve what you can within the plan and report what you cannot. Promises for later are delayed reinforcers, and new reinforcers are not yours to choose.' } },
      { h: 'The room',
        p: ['Arrange the space so that the right behavior is easy. Clear the table of what is not needed. Seat the student where distractions are fewest and where you can reach materials. Remove or put away what could be thrown, swallowed or broken, if the plan or the student’s history calls for it.',
            'Know where the exits, the first-aid kit and the nearest colleague are. At the end, put the room back as you found it.'],
        check: { q: 'Which of these is part of preparing the room?',
          opts: ['Putting tomorrow’s materials on the table too.', 'Sitting the student facing the busy corridor window.', 'Leaving the reinforcers on the student’s side of the table.', 'Clearing away items that are not needed for the session.'],
          a: 3, why: 'Fewer things in reach means fewer distractions and fewer things to throw or grab.' } }
    ],
    examples: {
      ask: 'Ready or not?',
      intro: 'Six technicians, five minutes before a session. Decide whether each is ready to start.',
      opts: ['Ready', 'Not ready'],
      items: [
        { s: 'Has read today’s plan and yesterday’s note; materials, tokens, timer and data sheet are on a shelf within reach.', a: 0, why: 'Plan, notes and materials are all in hand.' },
        { s: 'Has the materials out but has not looked at the plan since last week.', a: 1, why: 'Plans change. The current one has to be read.' },
        { s: 'Knows the plan well; the data tablet is at 3% and the charger is at home.', a: 1, why: 'Without a way to record, the session’s data are at risk. Paper sheets would fix it.' },
        { s: 'Read in the notes that a new procedure started, asked the supervisor, and was shown it this morning.', a: 0, why: 'A change was noticed and training was obtained before running it.' },
        { s: 'Everything is set up; the reinforcers are in a clear box on the student’s chair.', a: 1, why: 'Reinforcers in the student’s reach are no longer the technician’s to deliver.' },
        { s: 'Has a cold, has told the supervisor, and has been cleared to work with a mask as the workplace policy says.', a: 0, why: 'The condition was reported and handled by the supervisor and the policy.' }
      ]
    },
    practice: {
      title: 'Fifteen minutes before the session',
      intro: 'You arrive at school for a session with Pablo, a simulated student. Decide what to do with each of the fifteen minutes.',
      steps: [
        { t: '8:45', see: 'You have the room to yourself. The plan binder and yesterday’s note are on the shelf.', opts: ['Check your messages first.', 'Read today’s targets and procedures, and yesterday’s note.', 'Set out toys and read the plan while Pablo plays.'], a: 1, why: 'Reading comes first: it tells you what to set out.' },
        { t: '8:48', see: 'Yesterday’s note says: “Mom reports he slept badly and has a new medication since Monday.”', opts: ['Make a note to watch for anything different and to include it in today’s record.', 'Decide to go easy and skip the hard targets.', 'Ignore it: it is the family’s business.'], a: 0, why: 'Health changes can affect behavior. You observe and document; changes to the session are the supervisor’s call.' },
        { t: '8:52', see: 'The plan lists puzzle pieces for one target. Two pieces are missing.', opts: ['Use a different puzzle of your own choice and say nothing.', 'Skip the target and write nothing.', 'Look for the pieces; if they cannot be found, run what the plan allows and tell your supervisor what was missing.'], a: 2, why: 'A substitution changes the target. What you could not run, and why, goes in the record.' },
        { t: '8:55', see: 'The table is covered with art supplies from the last class, including scissors.', opts: ['Leave them: Pablo likes art.', 'Clear the table and put the scissors away.', 'Push them to one end.'], a: 1, why: 'A clear table removes distraction and risk.' },
        { t: '8:58', see: 'Pablo will arrive in two minutes. Where do the reinforcers go?', opts: ['In the middle of the table so he can see them.', 'In your bag in the cupboard.', 'Beside you, within your reach and out of his.'], a: 2, why: 'You need to deliver them within seconds, and they should arrive only when earned.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Before each session you read:', opts: ['Only the data sheet.', 'The current plan and the last session’s notes.', 'Nothing, if you know the student.', 'Last month’s report.'], a: 1, why: 'Both can have changed since you last worked.' },
      { q: 'A procedure has changed and you have not been trained on the change. You:', opts: ['Ask your supervisor before running it.', 'Work it out as you go.', 'Use the old version quietly.', 'Ask a classmate of the student.'], a: 0, why: 'Competence comes before service.' },
      { q: 'Reinforcers are best placed:', opts: ['Where the student can help themselves.', 'In another room.', 'In your reach and out of the student’s.', 'In your pocket, unchecked.'], a: 2, why: 'Fast delivery, and only when earned.' },
      { q: 'You are too unwell to keep a student safe. The right step is to:', opts: ['Work anyway.', 'Text the family to cancel.', 'Send a colleague without telling anyone.', 'Tell your supervisor before the session.'], a: 3, why: 'The supervisor arranges what happens.' },
      { q: 'Why is the table cleared before a session?', opts: ['To impress visitors.', 'To lower distraction and risk.', 'Because cleaning is the technician’s main job.', 'It is not needed.'], a: 1, why: 'The room is arranged so that the right behavior is easy.' },
      { q: 'A note says the student started a new medication. You:', opts: ['Tell other families.', 'Change the reinforcers.', 'Watch for anything different and record it.', 'Stop the session.'], a: 2, why: 'It is a variable that may affect progress, and it is confidential.' },
      { q: 'Materials for a target are missing and cannot be found. You:', opts: ['Tell your supervisor and note what could not be run.', 'Invent a similar task.', 'Mark the target as run.', 'End the session early.'], a: 0, why: 'The record must show what was and was not done.' },
      { q: 'Which belongs on your checklist before a session?', opts: ['Posting about your day.', 'Choosing new goals.', 'Rewriting the plan.', 'A working timer and a way to record data.'], a: 3, why: 'Timing and data are needed in almost every procedure.' },
      { q: 'At the end of a session in a shared room you:', opts: ['Leave materials out for next time.', 'Put the room back as you found it.', 'Take the reinforcers home.', 'Lock the student’s file in your car.'], a: 1, why: 'Shared spaces and confidential materials are looked after.' },
      { q: 'Being “fit to work” matters because:', opts: ['It affects how safely and accurately you serve the student.', 'It looks professional.', 'The funder checks.', 'It shortens sessions.'], a: 0, why: 'Attention and judgment are tools of the job.' }
    ] },
    role: [
      { t: 'Set up from a plan in five minutes', setup: 'The trainer gives a one-page plan and a box of mixed materials, and plays the supervisor if asked.',
        steps: ['Reads the targets and the procedure for problem behavior first.', 'Collects only what the plan lists.', 'Places reinforcers in own reach and out of the student’s.', 'Has a timer and a way to record ready.',
                'Clears the table of everything else.', 'Asks about one thing in the plan that is unclear, before starting.'] }
    ],
    roleRule: 'Met when the set-up is finished in five minutes with every step in place.',
    discuss: [
      'What has gone wrong in a session you saw, or ran, that five minutes of preparation would have prevented?',
      'How do you decide that you are not fit to work, and whom do you tell?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.02, 1.06 and 1.09. bacb.com.',
      'Behavior Analyst Certification Board. RBT 2026 40-Hour Training Requirements and Curriculum Outline, section B. bacb.com.'
    ]
  },

  b2: {
    aim: [
      'Build rapport before asking for work, and tell when you have it.',
      'Tell consent from assent, and recognize a student giving assent or taking it back.',
      'Respond to assent withdrawn as the plan says, without force and without dropping the session.'
    ],
    lesson: [
      { h: 'Rapport comes first',
        p: ['A student works best with an adult whose arrival means good things. Building that is called pairing: you spend time with the student giving what they like, joining what they are doing, and asking for very little.',
            'Follow the student’s lead. Hand over pieces of the puzzle, push the swing, comment on the game. Keep instructions and questions rare at first. Demands come in slowly, and easy ones first.'],
        check: { q: 'On your first day with a new student, which is the best start?',
          opts: ['Run the full program to see what he can do.', 'Sit nearby in silence and take notes.', 'Join his play, hand him things he likes and ask for almost nothing.', 'Explain the rules of your sessions.'],
          a: 2, why: 'Pairing yourself with good things makes later teaching possible. Demands on day one pair you with work.' } },
      { h: 'How you know you have it',
        p: ['You can see rapport. The student comes toward you, stays near, looks and smiles, brings you things, and goes along with small requests. You can also see when it is missing: the student moves away when you arrive, turns their back, or problem behavior starts as you sit down.',
            'Rapport is not built once and banked. After a break, an illness or a hard week, give it time again.'],
        check: { q: 'Which of these suggests rapport is in place?',
          opts: ['The student takes your hand and leads you to the toy shelf.', 'The student leaves the table each time you sit down.', 'The student works only when the teacher is watching.', 'The student is silent.'],
          a: 0, why: 'Approach and seeking you out are the clearest signs.' } },
      { h: 'Consent and assent',
        p: ['Consent is the permission a parent or guardian gives, in writing, for assessment and treatment. Your supervisor obtains it. Assent is the student’s own willingness, shown in what they do: coming to the table, reaching for materials, joining in, saying “okay”.',
            'Assent can be taken back at any moment, with or without words: turning or moving away, pushing materials off, saying “no” or “stop”, crying, going limp. A student who cannot speak still tells you clearly.',
            'Respecting assent is part of treating a person with dignity. It also works: teaching that a student takes part in willingly goes further.'],
        key: ['Consent: the guardian’s permission, obtained by the supervisor.', 'Assent: the student’s willingness, shown in behavior, moment by moment.'],
        check: { q: 'A student who does not speak pushes the materials away and turns his chair around. He is:',
          opts: ['Giving consent.', 'Being non-compliant, which should be worked through.', 'Showing nothing, since he said nothing.', 'Withdrawing assent.'],
          a: 3, why: 'Turning away and pushing materials off are ways of saying “no”. Words are not required.' } },
      { h: 'When assent is withdrawn',
        p: ['Pause what you are asking. Do what the plan says for this: it may be to offer a break, a choice, an easier task, or time with something preferred before trying again. Do not hold, block or talk the student back into the task unless a written procedure, which you have been trained in, says so.',
            'Respecting a “no” does not mean the session is over or that work is never asked for. It means the way back to work goes through the student’s willingness. If assent is withdrawn often, or for one task in particular, that is important information: write it down and tell your supervisor, who may change the task, the reinforcers or the pace.'],
        check: { q: 'For the third day, a student leaves the table as soon as the handwriting task comes out, and returns happily for everything else. What matters most?',
          opts: ['Blocking the way so she cannot leave.', 'Telling your supervisor about the pattern and what you did each time.', 'Dropping handwriting from the session yourself.', 'Offering a bigger reward each day.'],
          a: 1, why: 'A pattern around one task tells the supervisor something about that task. Changing or forcing it is not the technician’s decision.' } }
    ],
    examples: {
      ask: 'What is the student showing?',
      intro: 'Eight moments. Decide whether the student is showing assent or taking it back.',
      opts: ['Assent', 'Assent withdrawn'],
      items: [
        { s: 'Ines walks to the table when she sees you and sits down.', a: 0, why: 'Approach and joining in.' },
        { s: 'Jay slides off his chair and lies under the table when the cards come out.', a: 1, why: 'Moving away from the task.' },
        { s: 'Kit picks up the pencil and looks at you.', a: 0, why: 'Reaching for materials and attending.' },
        { s: 'Lou says, “No more,” and covers the worksheet with her arms.', a: 1, why: 'Words and action both say no.' },
        { s: 'Max laughs and holds out his hand for the next piece.', a: 0, why: 'Taking part willingly.' },
        { s: 'Nia goes quiet, looks down, and her hands go limp when you guide them.', a: 1, why: 'Going limp and looking away can be a quiet “no”. Not every withdrawal is loud.' },
        { s: 'Oz says, “Again!” after the first try.', a: 0, why: 'He asks to continue.' },
        { s: 'Pim cries and pulls her hand back when you reach for it.', a: 1, why: 'Distress and pulling away.' }
      ]
    },
    practice: {
      title: 'A first session',
      intro: 'It is your first session with Quinn, a simulated student. The plan for today says: pairing only for the first 20 minutes, then two easy targets. If Quinn turns away or says no: pause, offer a choice of two activities, try again after one minute.',
      steps: [
        { t: 'Minute 1', see: 'Quinn is rolling cars down a ramp and glances at you.', opts: ['Say, “Come and sit at the table.”', 'Sit nearby, roll a car down the ramp, and hand him another.', 'Ask him what color each car is.'], a: 1, why: 'Join what he is doing and add to it. Instructions and questions are demands.' },
        { t: 'Minute 12', see: 'Quinn hands you a car and waits. He has moved closer twice.', opts: ['Take it as a sign of rapport, play on, and keep demands away until minute 20 as planned.', 'Start the targets now: he is ready.', 'Put the cars away to see how he reacts.'], a: 0, why: 'These are good signs, and the plan sets the time. There is no prize for starting early.' },
        { t: 'Minute 21', see: 'You bring out the first target, matching two pictures. Quinn does the first one.', opts: ['Praise him and hand him a car for a moment, as the plan’s reinforcer says.', 'Go straight to the hard version.', 'Say nothing and present ten more.'], a: 0, why: 'Easy work, reinforced at once, keeps you paired with good things.' },
        { t: 'Minute 24', see: 'Quinn pushes the pictures away and turns to the ramp.', opts: ['Turn his chair back and say, “We are not finished.”', 'End the session.', 'Pause, offer the choice of two activities, and try the target again after a minute.'], a: 2, why: 'This is what the plan says for a “no”. It respects him and keeps the session going.' },
        { t: 'After the session', see: 'Quinn withdrew assent twice, both times at the matching task.', opts: ['Leave it out of the note: the session went well overall.', 'Record both moments, what you did, and what happened next.', 'Write, “Non-compliant with matching.”'], a: 1, why: 'The pattern is what the supervisor needs. “Non-compliant” is a label; what he did and what followed are data.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Pairing means:', opts: ['Matching students in twos.', 'Linking yourself with things the student likes before asking for work.', 'Giving two instructions at once.', 'Working with a partner.'], a: 1, why: 'You become a sign that good things are coming.' },
      { q: 'During early pairing, demands should be:', opts: ['Rare and easy.', 'Frequent.', 'Hard, to set expectations.', 'Written down for the student.'], a: 0, why: 'Demands come in slowly.' },
      { q: 'Consent is given by:', opts: ['The student, by taking part.', 'The technician.', 'The parent or guardian, to the supervisor.', 'The teacher.'], a: 2, why: 'It is legal permission for assessment and treatment.' },
      { q: 'Assent is:', opts: ['A signed form.', 'A one-time agreement at the start of the year.', 'The same as consent.', 'The student’s own willingness, shown in behavior.'], a: 3, why: 'It is watched for all the time.' },
      { q: 'A student who cannot speak can withdraw assent by:', opts: ['Nothing: speech is needed.', 'Turning away, pushing materials off or leaving.', 'Only by crying.', 'Asking a peer.'], a: 1, why: 'Behavior says it.' },
      { q: 'When assent is withdrawn, you first:', opts: ['Repeat the instruction louder.', 'Guide the student’s hands.', 'Pause and do what the plan says for it.', 'End services.'], a: 2, why: 'The plan sets the response; force is not it.' },
      { q: 'Assent is withdrawn every day at the same task. You:', opts: ['Report the pattern to your supervisor.', 'Remove the task from the plan.', 'Stop offering breaks.', 'Tell the family the student is stubborn.'], a: 0, why: 'The supervisor may change the task, the pace or the reinforcers.' },
      { q: 'A sign that rapport is missing is that the student:', opts: ['Brings you a toy.', 'Smiles when you arrive.', 'Sits next to you.', 'Moves away when you come near.'], a: 3, why: 'Avoidance is the clearest sign.' },
      { q: 'After a two-week holiday, rapport:', opts: ['Is exactly as it was.', 'May need rebuilding before full demands.', 'No longer matters.', 'Should be tested with hard tasks.'], a: 1, why: 'It is kept up, not banked.' },
      { q: 'Respecting assent means:', opts: ['Never asking for work.', 'Ending the session at the first “no”.', 'Finding the way back to work through the student’s willingness.', 'Letting the student write the plan.'], a: 2, why: 'A pause, a choice, and another try.' }
    ] },
    role: [
      { t: 'Pair, then ask', setup: 'The trainer plays a student who is playing. The trainee has five minutes to build rapport and then present two easy tasks.',
        steps: ['Joins the “student’s” activity instead of starting their own.', 'Gives preferred items freely and comments more than asks.', 'Gives no instruction in the first minutes.', 'Presents an easy task and reinforces it at once.', 'Names two signs of rapport seen in the session.'] },
      { t: 'A “no” without words', setup: 'The trainer plays a student who turns away and pushes materials off during a task. The plan says: pause, offer a choice of two, try again after a minute.',
        steps: ['Notices the withdrawal and stops presenting the task.', 'Does not block, hold or argue.', 'Offers the choice as written.', 'Tries again after the minute.', 'Says what they would write in the note.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'How do the students you know say “no” without words?',
      'Where is the line between encouraging a student and overriding them? Whom would you ask when you are not sure?',
      'What does an adult do that makes you want to work with them?'
    ],
    read: [
      'Morris, C., Detrick, J. J., & Peterson, S. M. (2021). Participant assent in behavior analytic research: Considerations for participants with autism and developmental disabilities. Journal of Applied Behavior Analysis, 54(4), 1300–1316.',
      'Kelly, A. N., Axe, J. B., Allen, R. F., & Maguire, R. W. (2015). Effects of presession pairing on the challenging behavior and academic responding of children with autism. Behavioral Interventions, 30(2), 135–156.'
    ]
  }
});
