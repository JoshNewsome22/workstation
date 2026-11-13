/* nbh-learn-units-d.js (v26.01): written units of the Learning page, section D (Assisting with behavior assessments),
   units d2 to d4. The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  d2: {
    aim: [
      'Say why preference is assessed, and why a preferred item is only a likely reinforcer.',
      'Run a free-operant, single-stimulus, paired-stimulus and multiple-stimulus assessment as written.',
      'Record choices as they happen and turn them into a ranking.',
      'Keep the assessment safe and neutral.'
    ],
    lesson: [
      { h: 'Why ask, and why not just ask',
        p: ['A reinforcer is found by its effect, and the quickest route to a likely one is to see what the person chooses. Asking parents and staff gives a starting list. It is often wrong about the order, and what a person says they like is not always what they pick.',
            'So the list is tested. A preference assessment offers items in a set way and records choices. The result is a ranking of likely reinforcers. Whether the top item really reinforces is settled later, by whether behavior increases when it follows.',
            'Preferences move. A favorite of last month may be ignored today, so full assessments are repeated, and many plans add a quick choice before each session.'],
        check: { q: 'A preference assessment tells you:',
          opts: ['Which items are certain to be reinforcers.', 'Which items the person chooses, which makes them likely reinforcers.', 'The function of problem behavior.', 'What the person liked last year.'],
          a: 1, why: 'Choice suggests reinforcing value; the effect on behavior confirms it.' } },
      { h: 'Free operant: watch, do not offer',
        p: ['In a free-operant assessment, several items are placed around the room or on a table and the person may use any of them, in any order, for a set time, often five minutes. You ask for nothing and take nothing away. You record how long the person spends with each item.',
            'It is quick, and because nothing is removed it rarely sets off problem behavior. Its weakness is that a person may stay with one item the whole time, which tells you the favorite and little about the rest.'],
        check: { q: 'In a free-operant assessment you record:',
          opts: ['Which of two items is picked.', 'The order in which items are picked from an array.', 'How long the person spends with each item.', 'How many instructions are followed.'],
          a: 2, why: 'Time with each item is the measure.' } },
      { h: 'Single stimulus: one at a time',
        p: ['In a single-stimulus assessment you present one item at a time and record whether the person approaches or uses it, and sometimes for how long. Each item is presented several times, in mixed order.',
            'It suits a person who cannot yet choose between two things. It does not rank well, since a person may accept everything offered.'],
        check: { q: 'For whom is a single-stimulus assessment the best fit?',
          opts: ['A student who cannot yet choose between two items.', 'A student who reads fluently.', 'A student with one clear favorite.', 'A whole class.'],
          a: 0, why: 'It needs no choice between items.' } },
      { h: 'Paired stimulus: two at a time',
        p: ['In a paired-stimulus assessment, also called forced choice, you hold out two items and say, “Pick one.” The person has a few seconds to choose and then has the chosen item briefly. Every item is paired with every other item, and each item’s left and right positions are balanced.',
            'For each item you work out the percentage of its presentations on which it was chosen. That gives a clear ranking from top to bottom. The cost is time: eight items make 28 pairs.',
            'If the person reaches for both, block gently and present again. If neither is chosen in the time the procedure gives, remove both and record no choice.'],
        check: { q: 'In a paired-stimulus assessment, crackers were offered 7 times and chosen 5 times. What is recorded for crackers?',
          opts: ['5 points', '7%', '71% (5 of 7)', 'Rank 5'],
          a: 2, why: 'Times chosen divided by times presented: 5 ÷ 7 is about 71%.' } },
      { h: 'Multiple stimulus: an array',
        p: ['In a multiple-stimulus assessment without replacement (MSWO), five to eight items are set in a row, evenly spaced. You say, “Pick one.” The person has the chosen item briefly, and it is not put back. You move the remaining items along so that positions change, and repeat until all are chosen or nothing more is picked. The whole run is repeated a few times.',
            'The order of choosing is the ranking: first picked ranks highest. It is fast and ranks well, so it is the one most often run before sessions.',
            'With replacement, the chosen item goes back into the array. That shows the favorite clearly and ranks the others poorly.'],
        key: ['Free operant: time with each item.', 'Single stimulus: approach or not.', 'Paired stimulus: percentage of times chosen.', 'MSWO: order of choosing.'],
        check: { q: 'In an MSWO, after the student picks the blocks and has had them for 30 seconds, you:',
          opts: ['Put the blocks back in the row.', 'Take the blocks out of the array, shift the remaining items, and say “Pick one” again.', 'End the assessment.', 'Offer the blocks again at once.'],
          a: 1, why: 'Without replacement: the chosen item leaves the array and the rest are rearranged.' } },
      { h: 'Running it safely and neutrally',
        p: ['Use only the items the supervisor has approved. Food must fit the student’s diet, allergies and swallowing; small parts, cords and anything that could be thrown or swallowed are checked beforehand.',
            'Stay neutral. Space the items evenly at the same distance. Use the same words each time. Do not point, glance at, praise or talk up any item, and do not comment on the choice. Record each choice at once.',
            'Note what else happens: an item refused, problem behavior when an item is taken back, the student reaching outside the array for something else. Hand the ranking and the notes to your supervisor, who decides what is used as a reinforcer.'],
        check: { q: 'During an assessment the student ignores the array and keeps reaching for your phone. You:',
          opts: ['Add the phone to the array.', 'Tell the student off.', 'Stop and declare the assessment failed.', 'Keep to the approved items, note the reaching, and tell your supervisor.'],
          a: 3, why: 'What the student reaches for is valuable information. Adding an unapproved item is not your call.' } }
    ],
    examples: {
      ask: 'Which method is this?',
      intro: 'Eight descriptions. Decide which preference assessment each one is.',
      opts: ['Free operant', 'Single stimulus', 'Paired stimulus', 'Multiple stimulus without replacement'],
      items: [
        { s: 'Six toys are set out around the playroom. For five minutes the observer times how long Asa plays with each.', a: 0, why: 'Free access, with time as the measure.' },
        { s: 'A ball is held out alone. The observer marks whether Bri reaches for it within five seconds.', a: 1, why: 'One item, approach or not.' },
        { s: 'Raisins and a pretzel are held out together. “Pick one.” Later the raisins appear again with a cracker.', a: 2, why: 'Two at a time, each item meeting each other item.' },
        { s: 'Seven items are in a row. The one picked is used for 30 seconds and then left out; the other six are shuffled along.', a: 3, why: 'An array that shrinks as items are chosen.' },
        { s: 'Each of ten items is shown by itself four times, in mixed order.', a: 1, why: 'Always one at a time.' },
        { s: 'Cy stays with the trains for the whole five minutes and touches nothing else. The sheet shows 5:00 for trains and 0:00 for the rest.', a: 0, why: 'A free-operant result: a clear favorite, no ranking of the others.' },
        { s: 'The record lists the order in which items were picked: 1 bubbles, 2 car, 3 book, 4 blocks, 5 puzzle.', a: 3, why: 'Ranking by order of choosing.' },
        { s: 'With five items, the sheet has ten trials, one for each possible pair.', a: 2, why: 'Five items make ten pairs.' }
      ]
    },
    practice: {
      title: 'Run an MSWO',
      intro: 'You are running one round of a multiple-stimulus assessment without replacement with Dita, a simulated student. Read the procedure, then decide.',
      plan: ['Five approved items in a row, evenly spaced: bubbles, car, book, blocks, puzzle.', 'Say “Pick one.” Wait up to 10 seconds.', 'Give 30 seconds with the chosen item, then put it out of sight.', 'Move the item at the left end to the right end, close the gaps, and repeat.', 'If nothing is chosen in 10 seconds, end the round and record the rest as not chosen.'],
      steps: [
        { t: 'Before you start', see: 'The classroom aide offers a bag of jelly sweets to add, “because she loves them”.', opts: ['Add them: the more the better.', 'Thank her, keep to the five approved items, and pass the idea to your supervisor.', 'Swap the puzzle for the sweets.'], a: 1, why: 'Items are approved for safety and diet. A good idea still goes through the supervisor.' },
        { t: 'Trial 1', see: 'You say, “Pick one.” Dita looks at you instead of the items.', opts: ['Tap the bubbles and smile.', 'Say, “You like the bubbles, don’t you?”', 'Wait, saying nothing more, for the 10 seconds.'], a: 2, why: 'A hint from you would be your choice, not hers.' },
        { t: 'Trial 1', see: 'Dita picks up the bubbles.', opts: ['Write “1” beside bubbles, give 30 seconds with them, then put them out of sight.', 'Praise her for a good choice.', 'Let her keep the bubbles for the rest of the round.'], a: 0, why: 'Record at once. Praise is not part of it, and the item leaves the array.' },
        { t: 'Trial 2', see: 'Four items remain: car, book, blocks, puzzle, in that order.', opts: ['Present them as they are.', 'Move the car from the left end to the right end, close the gaps, then say “Pick one.”', 'Put the bubbles back.'], a: 1, why: 'Rotating positions keeps a side preference from deciding the result.' },
        { t: 'Trial 2', see: 'Dita grabs the car and the book together.', opts: ['Let her have both and score a tie.', 'Score whichever she touched first.', 'Block gently, put both back in place, and say “Pick one” again.'], a: 2, why: 'One choice per trial. The procedure is re-presented.' },
        { t: 'Trial 3', see: 'When the 30 seconds with the car end and you reach for it, Dita screams and holds on.', opts: ['Let her keep the car and end the round.', 'Follow what the plan says for problem behavior, complete the removal as trained, and note it on the sheet.', 'Pull harder.'], a: 1, why: 'The response to problem behavior comes from the plan, and the note tells the supervisor the car is hard to give up.' },
        { t: 'Trial 4', see: 'Three items remain. Dita does not pick one within 10 seconds.', opts: ['End the round and record the three as not chosen.', 'Choose for her.', 'Wait until she does, however long it takes.'], a: 0, why: 'The procedure sets the stopping rule. “Not chosen” is a result.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'A preferred item is best described as:', opts: ['A guaranteed reinforcer.', 'A likely reinforcer, to be confirmed by its effect on behavior.', 'A reward.', 'A bribe.'], a: 1, why: 'Preference predicts; the effect confirms.' },
      { q: 'Why are preference assessments repeated?', opts: ['Preferences change over time.', 'The forms expire.', 'To keep staff busy.', 'They are not repeated.'], a: 0, why: 'Value shifts with time and with how much of an item the person has had.' },
      { q: 'In a free-operant assessment the observer:', opts: ['Removes items after each choice.', 'Gives instructions throughout.', 'Records time spent with each freely available item.', 'Offers items two at a time.'], a: 2, why: 'Nothing is asked and nothing is removed.' },
      { q: 'A strength of the free-operant method is that it:', opts: ['Ranks every item precisely.', 'Takes a long time.', 'Needs no observer.', 'Rarely provokes problem behavior, since nothing is taken away.'], a: 3, why: 'There are no removals and no demands.' },
      { q: 'A paired-stimulus assessment with 6 items has how many pairs?', opts: ['6', '12', '15', '36'], a: 2, why: 'Each item meets each of the other five once: 6 × 5 ÷ 2 = 15.' },
      { q: 'In paired stimulus, an item’s score is:', opts: ['The percentage of its presentations on which it was chosen.', 'The time spent with it.', 'Its position in the row.', 'The number of items left.'], a: 0, why: 'Chosen ÷ presented.' },
      { q: 'In an MSWO, the chosen item is:', opts: ['Returned to the array.', 'Removed from the array for the rest of the round.', 'Given for the rest of the session.', 'Replaced with a new item.'], a: 1, why: '“Without replacement.”' },
      { q: 'MSWO results are ranked by:', opts: ['Time with each item.', 'Percentage of approaches.', 'What the teacher reports.', 'The order in which items were chosen.'], a: 3, why: 'First chosen ranks highest.' },
      { q: 'Positions of items are changed between trials in order to:', opts: ['Confuse the student.', 'Keep a preference for one side from deciding the result.', 'Save time.', 'Make the session longer.'], a: 1, why: 'Some people always pick from the same side.' },
      { q: 'During the assessment you should:', opts: ['Praise good choices.', 'Point at your favorite.', 'Stay neutral and use the same words each time.', 'Describe each item with enthusiasm.'], a: 2, why: 'Your behavior must not steer the choice.' },
      { q: 'The student reaches for two items at once. You:', opts: ['Block gently and present again.', 'Give both.', 'End the session.', 'Record both as chosen.'], a: 0, why: 'One choice per trial.' },
      { q: 'Before using food in an assessment you make sure that:', opts: ['It is the cheapest.', 'You like it.', 'It is sweet.', 'It has been approved for this student’s diet, allergies and swallowing.'], a: 3, why: 'Safety comes before preference.' },
      { q: 'Who decides which item will be used as a reinforcer in the plan?', opts: ['The technician.', 'The supervisor.', 'The student’s classmates.', 'The aide.'], a: 1, why: 'You supply the ranking and the notes.' },
      { q: 'A single-stimulus assessment is weak at:', opts: ['Being used with people who cannot choose between two.', 'Showing approach.', 'Ranking items against each other.', 'Being quick to learn.'], a: 2, why: 'Everything offered may be accepted.' }
    ] },
    role: [
      { t: 'Paired stimulus with four items', setup: 'The trainer plays a student. Four items make six pairs. The trainer reaches for both items once and makes no choice once.',
        steps: ['Has the data sheet with the six pairs and left and right positions written out.', 'Holds the items evenly, at the same distance.', 'Says only “Pick one.”', 'Gives brief access to the chosen item and removes it.',
                'Blocks a grab for both and presents again.', 'Records each trial at once, including “no choice”.', 'Works out each item’s percentage and the ranking.'] },
      { t: 'MSWO with five items', setup: 'The trainer plays a student for two rounds and stops choosing after the third item in the second round.',
        steps: ['Sets the five items in a row, evenly spaced.', 'Removes the chosen item from the array after brief access.', 'Rotates the remaining items before each trial.', 'Makes no comment on choices.',
                'Ends the round by the stopping rule.', 'Records the order of choosing and reports the ranking.'] }
    ],
    roleRule: 'Met when each assessment is run once with every step in place and the ranking is correct.',
    discuss: [
      'Have you seen a “favorite” fail as a reinforcer? What do you think happened?',
      'How do you stay neutral with a student you know well?',
      'What would you do if every item on the approved list was refused?'
    ],
    read: [
      'Fisher, W., Piazza, C. C., Bowman, L. G., Hagopian, L. P., Owens, J. C., & Slevin, I. (1992). A comparison of two approaches for identifying reinforcers for persons with severe and profound disabilities. Journal of Applied Behavior Analysis, 25(2), 491–498.',
      'DeLeon, I. G., & Iwata, B. A. (1996). Evaluation of a multiple-stimulus presentation format for assessing reinforcer preferences. Journal of Applied Behavior Analysis, 29(4), 519–533.',
      'Roane, H. S., Vollmer, T. R., Ringdahl, J. E., & Marcus, B. A. (1998). Evaluation of a brief stimulus preference assessment. Journal of Applied Behavior Analysis, 31(4), 605–620.',
      'Pace, G. M., Ivancic, M. T., Edwards, G. L., Iwata, B. A., & Page, T. J. (1985). Assessment of stimulus preference and reinforcer value with profoundly retarded individuals. Journal of Applied Behavior Analysis, 18(3), 249–255.'
    ]
  },

  d3: {
    aim: [
      'Name the main kinds of skill assessment and what each is used for.',
      'Present assessment items exactly as the instructions say, without teaching.',
      'Record each response, help with role-play items and tallies, and leave the scoring decisions to the supervisor.'
    ],
    lesson: [
      { h: 'Kinds of skill assessment',
        p: ['A curriculum-based assessment checks the person against an ordered list of skills, such as early language, play, self-care or daily living, and shows which are present and which come next. The result feeds straight into teaching goals.',
            'A developmental or norm-referenced assessment compares the person with what most people of the same age do. It is often done by interviewing a parent or teacher. A social-skills assessment looks at how the person gets on with others, by rating scales, observation or set-up situations.',
            'Your supervisor chooses the tool, owns the manual, and is responsible for the scores and the goals that come from them.'],
        check: { q: 'An assessment that works through an ordered list of language skills to find which to teach next is:',
          opts: ['A functional analysis', 'A preference assessment', 'A curriculum-based assessment', 'A scatter plot'],
          a: 2, why: 'It checks the person against a sequence of skills.' } },
      { h: 'Probing is not teaching',
        p: ['An assessment item is a probe. You give the instruction once, in the words written, wait the time the instructions set, and record what the person does. You do not prompt, hint, repeat the question, or correct a wrong answer.',
            'That feels unkind for a moment, and it is the opposite. A skill scored as present because you helped will not be taught, and the student will be left without it.',
            'You can keep the student willing. Praise sitting, looking and trying. Mix in easy tasks the student knows, when the instructions allow it. Give breaks. What you may not do is let your praise depend on the answer being right, or it becomes a clue.'],
        key: ['One instruction, as written.', 'Wait the set time.', 'No prompts, no corrections.', 'Praise taking part, not correctness.'],
        check: { q: 'During a probe the student gives a wrong answer. You:',
          opts: ['Say, “No, try again.”', 'Model the right answer.', 'Respond in the same neutral way as for a right answer, and record it.', 'Mark it right, because she knew it yesterday.'],
          a: 2, why: 'Feedback on correctness is teaching, and it tips off the next answers.' } },
      { h: 'Recording',
        p: ['Score each item as it happens, using the codes the assessment gives: usually correct, incorrect, or no response, and sometimes the level of help needed. Write what the student actually said or did when it is unclear, so the supervisor can decide.',
            'Record the conditions too: where it was done, who was there, how the student was that day. A skill may show at the table with you and not on the playground, and the assessment may ask for both.'],
        check: { q: 'The student gives an answer you are not sure counts as correct. You:',
          opts: ['Write down exactly what the student said or did, and let the supervisor score it.', 'Score it correct to be generous.', 'Score it wrong to be safe.', 'Skip the item.'],
          a: 0, why: 'The scoring rule is in the manual, which the supervisor applies.' } },
      { h: 'Role-plays and tallies',
        p: ['Some social-skills items need a set-up: someone says hello, takes a toy, makes a mistake on purpose, or asks for help, and the observer sees what the student does. You may be asked to play that part. Do it as scripted, the same way each time, and do not rescue the student from an awkward silence.',
            'Afterwards you may help to add up scores or copy them onto a summary sheet. Check your arithmetic, and hand over the raw sheets as well. What the totals mean, and which goals follow, are the supervisor’s to say.'],
        check: { q: 'In a social-skills item your script says: “Take the marker the student is using and wait 10 seconds.” The student looks upset and says nothing. You:',
          opts: ['Give the marker back at once and apologize.', 'Prompt, “Say: can I have it back?”', 'End the assessment.', 'Wait the 10 seconds as scripted, then carry on as the script says.'],
          a: 3, why: 'The item measures what the student does unaided. The script will have a way to end the moment kindly.' } }
    ],
    examples: {
      ask: 'Whose job is it?',
      intro: 'Eight tasks that come up during a skill assessment. Decide whether each is the technician’s or the supervisor’s.',
      opts: ['The technician’s, when trained and asked', 'The supervisor’s'],
      items: [
        { s: 'Setting out the picture cards listed for today’s items.', a: 0, why: 'Preparing materials.' },
        { s: 'Choosing which assessment tool to use for a new student.', a: 1, why: 'Selecting the tool is a clinical decision.' },
        { s: 'Presenting each item with the words in the manual and recording the answer.', a: 0, why: 'Administering items under direction.' },
        { s: 'Deciding that a student’s scores mean she needs a language program.', a: 1, why: 'Interpreting results.' },
        { s: 'Playing the part of a peer who asks to join a game, as scripted.', a: 0, why: 'Assisting with role-play items.' },
        { s: 'Writing the goals that follow from the assessment.', a: 1, why: 'Goals come from the supervisor’s interpretation.' },
        { s: 'Adding up the correct answers in each section and writing the totals on the summary sheet.', a: 0, why: 'Helping with the summary.' },
        { s: 'Telling the parents what the results show.', a: 1, why: 'Explaining results belongs to the supervisor.' }
      ]
    },
    practice: {
      title: 'Help with a skill assessment',
      intro: 'You are helping your supervisor assess Emil, a simulated student. Today you present 20 picture-naming items. The instructions: say “What is it?” once, wait 5 seconds, respond “Okay” to every answer, give a token for sitting and looking after every fifth item.',
      steps: [
        { t: 'Item 3', see: 'You show the picture of a spoon. Emil says, “Fork.”', opts: ['“Not quite. Look again.”', '“Okay,” and mark it incorrect.', 'Point to the bowl of the spoon.'], a: 1, why: 'The same neutral word for every answer, and the answer scored as given.' },
        { t: 'Item 5', see: 'Emil has sat and looked at all five pictures. He got two right.', opts: ['Give the token: he sat and looked.', 'Hold the token until he gets more right.', 'Give two tokens, one for each right answer.'], a: 0, why: 'The token is for taking part. Tying it to right answers would turn it into feedback.' },
        { t: 'Item 9', see: 'You show a picture of a couch. Emil says, “Sofa.”', opts: ['Mark it incorrect: the answer sheet says “couch”.', 'Mark it correct without a note.', 'Write “said sofa” beside the item for your supervisor.'], a: 2, why: 'A reasonable answer that is not on the key is a scoring question. Write what he said.' },
        { t: 'Item 12', see: 'Emil does not answer. Five seconds pass.', opts: ['Ask again, more slowly.', 'Say “Okay,” mark “no response,” and go on.', 'Whisper the first sound.'], a: 1, why: 'One instruction and the set wait. “No response” is a result.' },
        { t: 'Afterwards', see: 'Emil’s teacher asks, “How did he do? Is he behind?”', opts: ['“He got 11 of 20, so yes.”', '“He did great!”', '“The supervisor will go through the results with you. I will tell her you asked.”'], a: 2, why: 'A raw score without interpretation misleads, and so does reassurance.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'A curriculum-based assessment compares the person with:', opts: ['Other students in the class.', 'An ordered list of skills.', 'A diagnosis.', 'Their favorite items.'], a: 1, why: 'It shows which skills are present and which come next.' },
      { q: 'A norm-referenced assessment compares the person with:', opts: ['What most people of the same age do.', 'Their own baseline.', 'A list of reinforcers.', 'The plan.'], a: 0, why: 'It is referenced to age norms.' },
      { q: 'During a probe, the instruction is given:', opts: ['As many times as needed.', 'With a hint.', 'Once, as written.', 'In your own words.'], a: 2, why: 'The same conditions for everyone make the result meaningful.' },
      { q: 'Prompting during an assessment item:', opts: ['Helps the student and so is encouraged.', 'Is required after an error.', 'Makes no difference.', 'Makes the student look more skilled than they are.'], a: 3, why: 'The skill would then go untaught.' },
      { q: 'During an assessment, praise is given for:', opts: ['Right answers only.', 'Taking part: sitting, looking, trying.', 'Nothing at all.', 'Fast answers.'], a: 1, why: 'Praise tied to correctness becomes a clue.' },
      { q: 'An unclear answer is best handled by:', opts: ['Writing down exactly what was said or done.', 'Scoring it correct.', 'Scoring it incorrect.', 'Asking the student to choose.'], a: 0, why: 'The supervisor applies the scoring rule.' },
      { q: 'Who chooses the assessment tool?', opts: ['The technician.', 'The parent.', 'The supervisor.', 'The student.'], a: 2, why: 'It is a clinical decision.' },
      { q: 'In a scripted role-play item you:', opts: ['Improvise to make it natural.', 'Help the student through it.', 'Skip it if the student seems shy.', 'Play the part the same way each time, as scripted.'], a: 3, why: 'The set-up has to be the same for the result to mean anything.' },
      { q: 'After tallying scores you:', opts: ['Throw away the raw sheets.', 'Hand over the totals and the raw sheets.', 'Tell the family the totals.', 'Set the goals.'], a: 1, why: 'The supervisor checks and interprets from the raw record.' },
      { q: 'Why note where and with whom an item was assessed?', opts: ['A skill may be present in one setting and not in another.', 'For the timesheet.', 'It is never needed.', 'To compare staff.'], a: 0, why: 'Conditions are part of the result.' }
    ] },
    role: [
      { t: 'Ten probe items', setup: 'The trainer plays a student who gets some right, some wrong, gives one unclear answer and stays silent once.',
        steps: ['Gives each instruction once, in the written words.', 'Waits the set time.', 'Uses the same neutral response for every answer.', 'Gives no prompt or correction.',
                'Praises taking part on the schedule given.', 'Scores each item at once, and writes out the unclear answer.'] }
    ],
    roleRule: 'Met when the ten items are run with every step in place.',
    discuss: [
      'What is the hardest part of not helping, and what do you tell yourself in that moment?',
      'A teacher asks you for the score. What do you say?'
    ],
    read: [
      'Gould, E., Dixon, D. R., Najdowski, A. C., Smith, M. N., & Tarbox, J. (2011). A review of assessments for determining the content of early intensive behavioral intervention programs for autism spectrum disorders. Research in Autism Spectrum Disorders, 5(3), 990–1002.',
      'Padilla, K. L., Weston, R., Morgan, G. B., Lively, P., & O’Guinn, N. (2023). Validity and reliability evidence for assessments based in applied behavior analysis: A systematic review. Behavior Modification, 47(1), 247–288.'
    ]
  },

  d4: {
    aim: [
      'Keep an ABC record and a scatter plot that a supervisor can read patterns from.',
      'Note the conditions around an observation that could affect the result.',
      'Run a condition of a functional analysis exactly as scripted, including its safety rules.',
      'Explain why a functional analysis gives the suspected reinforcer on purpose, for a short time.'
    ],
    lesson: [
      { h: 'ABC recording',
        p: ['In ABC recording you write, for each instance of the behavior, what came just before it, what the person did and what followed, with the time. Some sheets are open, and you write a sentence in each column. Others give boxes to tick: task given, attention elsewhere, item removed; reprimand, task removed, item given, no response.',
            'Record every instance during the observation, including the ones that do not fit what you expect. Use observable words. One row per instance, written at the time.'],
        check: { q: 'An ABC row reads: “10:14. Teacher said ‘Put the tablet away.’ / Screamed, threw tablet on rug. / Teacher said ‘Fine, two more minutes.’” What does the consequence column show?',
          opts: ['The task was removed.', 'The tablet time was extended.', 'The student was ignored.', 'Nothing followed.'],
          a: 1, why: 'What followed was two more minutes with the tablet.' } },
      { h: 'Scatter plots',
        p: ['A scatter plot is a grid: times of day down the side, days across the top. You mark each box in which the behavior happened, sometimes with a different mark for a few or many.',
            'It does not show why the behavior happens. It shows when, and so where to look: always in the half hour before lunch, never on Tuesdays, mostly with one teacher. Your supervisor follows those clues with closer observation.'],
        check: { q: 'What does a scatter plot show?',
          opts: ['The function of the behavior.', 'How long each instance lasted.', 'What the student prefers.', 'When, across times and days, the behavior tends to happen.'],
          a: 3, why: 'It reveals patterns in time, which point to where to look next.' } },
      { h: 'What else was going on',
        p: ['Results depend on conditions, so write them down: who was present, which activity, a change of room or timetable, noise or crowding, a substitute teacher. Note, too, what you were told about the student that day: little sleep, missed breakfast, illness, a change in medication.',
            'You do not need to judge whether any of it mattered. Recording it lets the supervisor see, for example, that the worst three days all followed short nights.'],
        check: { q: 'A parent mentions at drop-off that the student was up most of the night. On the observation sheet you:',
          opts: ['Write nothing: it is not behavior.', 'Cancel the observation yourself.', 'Note it, with the date.', 'Decide the data will not count.'],
          a: 2, why: 'It is a condition that may affect the day’s data, and it is the supervisor’s to weigh.' } },
      { h: 'Functional analysis: testing one thing at a time',
        p: ['Interviews and observation suggest a function. A functional analysis tests it. Short sessions, often 5 to 10 minutes, are run under different conditions, and the rate of the behavior in each is compared.',
            'In the attention condition the adult is busy and gives a brief comment each time the behavior happens. In the escape condition tasks are given and a short break follows the behavior. In the tangible condition a favorite item is taken away and returned briefly after the behavior. In the alone or ignore condition nothing follows the behavior. In the play or control condition the student has attention and favorite things freely and no demands, so little behavior is expected.',
            'The condition in which the behavior is highest points to its function.'],
        key: ['Attention: adult busy; brief attention follows the behavior.', 'Escape: tasks given; a short break follows.', 'Tangible: item withheld; brief return follows.', 'Alone or ignore: nothing follows.', 'Play: everything free; the comparison.'],
        check: { q: 'In which condition is a short break from tasks given after each instance of the behavior?',
          opts: ['Attention', 'Escape', 'Play', 'Alone'],
          a: 1, why: 'The escape condition tests whether getting out of tasks keeps the behavior going.' } },
      { h: 'Why reinforce problem behavior on purpose',
        p: ['It can look backwards: in a test condition you deliberately give the student what the behavior may be working for. The reason is that a few short, controlled sessions can show clearly what months of guessing could not, and a plan built on the right function works faster and with less risk than one built on a guess.',
            'It is done only with the guardian’s consent, designed and overseen by the supervisor, with a safety plan. The behavior is reinforced briefly and at low intensity, sessions are short, and stopping rules say when to end one.'],
        check: { q: 'Why does a functional analysis briefly give the suspected reinforcer after the problem behavior?',
          opts: ['To reward the student.', 'To calm the student down for the day.', 'To see, under controlled conditions, which consequence makes the behavior more likely.', 'Because the technician decides it.'],
          a: 2, why: 'It is a test, and the result guides a plan that matches the function.' } },
      { h: 'Running a session',
        p: ['You run a condition only after your supervisor has trained you on its script, with the supervisor present or reachable as they decide. Set the room as the script says. Do exactly what the script says after the behavior, for exactly as long, and nothing after other behavior. Record each instance as it happens.',
            'Keep the conditions clean. In the attention condition you do not also remove the task. In the escape condition you do not also comment. A mixed session tests nothing.',
            'Know the stopping rules before you start: the level of intensity or the number of instances at which the session ends, and what you do then. When in doubt about safety, stop and call your supervisor.'],
        check: { q: 'You are running the escape condition. The student hits the table, and the script says: “Remove the task for 30 seconds, say nothing.” You:',
          opts: ['Remove the task for 30 seconds and say nothing.', 'Remove the task and say, “I know it is hard.”', 'Keep the task there to see what happens.', 'Remove the task for two minutes so he can calm down.'],
          a: 0, why: 'Comfort would add attention to an escape test, and a longer break changes the size of the consequence.' } }
    ],
    examples: {
      ask: 'Which condition of a functional analysis is this?',
      intro: 'Eight short descriptions of sessions. Decide which condition each one is.',
      opts: ['Attention', 'Escape', 'Tangible', 'Alone or ignore', 'Play (control)'],
      items: [
        { s: 'The adult reads a magazine. Each time the behavior happens she says, “Please don’t do that,” and goes back to reading.', a: 0, why: 'Attention is scarce and follows the behavior.' },
        { s: 'Worksheets are presented one after another. After the behavior, the work is taken away for 30 seconds.', a: 1, why: 'A break from tasks follows the behavior.' },
        { s: 'The student has toys and the adult’s company, and nothing is asked of him.', a: 4, why: 'Everything is freely available; it is the comparison condition.' },
        { s: 'The favorite tablet is on a shelf in view. After the behavior, the student gets it for 30 seconds.', a: 2, why: 'A withheld item is returned after the behavior.' },
        { s: 'The student is in a room with no toys and no interaction; whatever she does, nothing follows. An observer watches through a window.', a: 3, why: 'No social consequences at all: a test for an automatic function.' },
        { s: 'The adult talks with a colleague and turns to the student for a few seconds only after the behavior.', a: 0, why: 'Divided attention, restored briefly after the behavior.' },
        { s: 'The adult gives an instruction every 20 seconds and guides the student through it; the behavior ends the instruction for half a minute.', a: 1, why: 'Demands, with escape after the behavior.' },
        { s: 'The adult plays alongside, comments now and then, and does not react to the behavior.', a: 4, why: 'Attention is free and no demand is made: the control.' }
      ]
    },
    practice: {
      title: 'Run an attention condition',
      intro: 'Your supervisor has trained you to run the attention condition for Gino, a simulated student, and is watching from the next room. Read the script, then decide.',
      plan: ['10 minutes. Gino has two toys he likes a little.', 'Say, “I have some work to do,” sit two meters away, and look at your papers.', 'After each instance of hitting his own leg: say “Don’t do that, you’ll hurt yourself,” and touch his shoulder for 5 seconds. Then back to your papers.', 'Do nothing after any other behavior.', 'Stop the session and call the supervisor if he hits his head, or after 20 instances.'],
      steps: [
        { t: 'Before the session', see: 'Gino’s aide says he had a seizure at the weekend and has been sleepy.', opts: ['Run the session and mention it afterwards.', 'Tell your supervisor before you start.', 'Decide yourself to postpone until next month.'], a: 1, why: 'A health change may affect both safety and the result. The supervisor decides whether to go ahead.' },
        { t: '0:00', see: 'The supervisor says to go ahead. Gino is at the table with the toys.', opts: ['Say, “I have some work to do,” sit two meters away and look at your papers.', 'Play with him for a minute first.', 'Explain to him what the test is for.'], a: 0, why: 'The condition starts with attention withdrawn, as written.' },
        { t: '1:40', see: 'Gino hits his leg.', opts: ['Keep reading: do not reward it.', 'Say, “Don’t do that, you’ll hurt yourself,” touch his shoulder for 5 seconds, then go back to your papers.', 'Sit with him and chat until he is settled.'], a: 1, why: 'The script gives brief attention after the behavior. That is the test.' },
        { t: '3:10', see: 'Gino holds up a toy and says, “Look!”', opts: ['“That’s a nice car!”', 'Smile at him.', 'Keep looking at your papers.'], a: 2, why: 'In this condition attention follows only the behavior being tested. It is hard, and it lasts ten minutes.' },
        { t: '5:30', see: 'Gino hits his leg, then throws a toy at the wall.', opts: ['Give the scripted attention for the hit and do nothing about the throw.', 'Tell him off for throwing.', 'Take the toys away.'], a: 0, why: 'One consequence, for one behavior. Reacting to the throw would muddy the test.' },
        { t: '7:15', see: 'Gino hits the side of his head with his fist.', opts: ['Give the scripted comment and carry on.', 'Ignore it: it is not the leg.', 'Stop the session and call your supervisor.'], a: 2, why: 'A stopping rule has been met. Safety outranks the data.' },
        { t: 'Afterwards', see: 'Your tally shows 9 instances in 7 minutes 15 seconds.', opts: ['Report 9 instances in 7 minutes 15 seconds, and that the session was stopped for a head hit.', 'Report “about 12 in 10 minutes”.', 'Report that the function is attention.'], a: 0, why: 'The count, the actual time and why it ended. The conclusion comes from comparing all the conditions.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'An ABC record holds, for each instance:', opts: ['The student’s mood.', 'What came before, the behavior, and what followed.', 'The function.', 'The reinforcer ranking.'], a: 1, why: 'Antecedent, behavior, consequence.' },
      { q: 'ABC rows are written:', opts: ['At the time, one row per instance.', 'At the end of the week.', 'Only for severe instances.', 'By the student.'], a: 0, why: 'Records made at the time are the reliable ones.' },
      { q: 'A scatter plot helps the supervisor see:', opts: ['Why the behavior happens.', 'What the student likes.', 'When the behavior tends to happen.', 'How well staff follow the plan.'], a: 2, why: 'Patterns across times and days.' },
      { q: 'Which belongs in the notes on conditions?', opts: ['Your opinion of the teacher.', 'Your guess at the function.', 'The student’s diagnosis, repeated daily.', 'A substitute teacher was in the room.'], a: 3, why: 'A change in the surroundings may affect the data.' },
      { q: 'A functional analysis is:', opts: ['An interview.', 'A test of conditions, run one at a time and compared.', 'A rating scale.', 'A preference assessment.'], a: 1, why: 'It is an experiment.' },
      { q: 'In the tangible condition, after the behavior the student gets:', opts: ['A favorite item for a short time.', 'A break from work.', 'A reprimand.', 'Nothing.'], a: 0, why: 'It tests access to items.' },
      { q: 'The play condition is there to:', opts: ['Reward the student afterwards.', 'Teach play.', 'Give a comparison in which little behavior is expected.', 'Test escape.'], a: 2, why: 'It is the control.' },
      { q: 'High rates only in the alone condition suggest a function that is:', opts: ['Attention', 'Escape', 'Tangible', 'Automatic'], a: 3, why: 'The behavior goes on with no social consequence.' },
      { q: 'In the escape condition you must not also:', opts: ['Present tasks.', 'Comment on the behavior.', 'Remove the task after the behavior.', 'Record instances.'], a: 1, why: 'A comment adds attention to an escape test.' },
      { q: 'A functional analysis is run only:', opts: ['With consent, designed and overseen by the supervisor.', 'When the technician thinks it is needed.', 'On Fridays.', 'Without the family knowing.'], a: 0, why: 'Consent, design, training and safety planning are the supervisor’s responsibility.' },
      { q: 'A stopping rule tells you:', opts: ['How to score the session.', 'Which reinforcer to use.', 'When to end a session for safety and what to do next.', 'How long a break lasts.'], a: 2, why: 'It is agreed before the session starts.' },
      { q: 'After a single condition, the technician reports:', opts: ['The function.', 'A recommendation for the plan.', 'Nothing.', 'The count, the time, and anything unusual.'], a: 3, why: 'The function comes from comparing conditions, which is the supervisor’s work.' },
      { q: 'Why is the suspected reinforcer given briefly and in small amounts during a test?', opts: ['To save resources.', 'To show the effect while keeping the behavior, and the risk, as low as possible.', 'Because students prefer it.', 'It is not: it is given freely.'], a: 1, why: 'Short sessions and small consequences limit risk.' },
      { q: 'An instance happens that does not fit the pattern you expected. In the ABC record you:', opts: ['Record it like every other.', 'Leave it out.', 'Mark it as an error.', 'Change the antecedent to fit.'], a: 0, why: 'The odd instance may be the informative one.' }
    ] },
    role: [
      { t: 'ABC recording, live', setup: 'The trainer and a helper (or a video) act out six short moments of “student” behavior with clear antecedents and consequences, and one with no clear antecedent.',
        steps: ['Writes one row per instance, with the time.', 'Writes the antecedent as an event or a situation.', 'Describes the behavior in observable words.', 'Writes what followed, exactly.',
                'Records the instance with no clear antecedent, and says so.', 'Adds no interpretation.'] },
      { t: 'One condition from a script', setup: 'The trainer gives a written script for an escape condition and plays the student, including one behavior the script says to ignore and one that meets the stopping rule.',
        steps: ['Sets the room and materials as the script says.', 'Presents tasks at the pace given.', 'Gives the scripted consequence for the target behavior, for the scripted time, and says nothing extra.',
                'Does nothing after other behavior.', 'Tallies each instance as it happens.', 'Stops at the stopping rule and says whom they would call.', 'Reports count, time and why the session ended.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'How does it feel to give attention after a behavior you want to see less of? What makes it acceptable in a test and not in daily practice?',
      'Which conditions around your students are most often left unrecorded?',
      'What would make you stop a session early, even before a written stopping rule was met?'
    ],
    read: [
      'Iwata, B. A., Dorsey, M. F., Slifer, K. J., Bauman, K. E., & Richman, G. S. (1994). Toward a functional analysis of self-injury. Journal of Applied Behavior Analysis, 27(2), 197–209. (Reprinted from 1982.)',
      'Touchette, P. E., MacDonald, R. F., & Langer, S. N. (1985). A scatter plot for identifying stimulus control of problem behavior. Journal of Applied Behavior Analysis, 18(4), 343–351.',
      'Iwata, B. A., Wallace, M. D., Kahng, S., Lindberg, J. S., Roscoe, E. M., Conners, J., Hanley, G. P., Thompson, R. H., & Worsdell, A. S. (2000). Skill acquisition in the implementation of functional analysis methodology. Journal of Applied Behavior Analysis, 33(2), 181–194.'
    ]
  }
});
