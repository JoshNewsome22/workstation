/* nbh-learn-units-e3.js (v26.01): written units of the Learning page, section E (Behavior-change interventions), units e7, e9
   and e10 (e8 is in nbh-learn-units.js). The shape of a unit is described there. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  e7: {
    aim: [
      'Say what stimulus control is and how discrimination training produces it.',
      'Tell a simple discrimination from a conditional one.',
      'Present an array so that only the intended feature can guide the answer.',
      'Recognize position habits and other faulty control, and report them.'
    ],
    lesson: [
      { h: 'The right behavior at the right time',
        p: ['Much of what we call knowing is doing the right thing in the presence of the right signal: saying “dog” to a dog and not to a cat, crossing on green and not on red. When a behavior happens reliably in the presence of one stimulus and not in the presence of others, it is under stimulus control.',
            'It comes about through differential reinforcement. In the presence of one stimulus the response is reinforced; in the presence of others it is not. The first is called the discriminative stimulus, written SD. The others are called S-delta.'],
        key: ['SD: the response is reinforced when this is present.', 'S-delta: the response is not reinforced when this is present.'],
        check: { q: 'Saying “dog” is reinforced when a dog is shown and not when a cat is shown. The cat is:',
          opts: ['The SD.', 'An S-delta.', 'A reinforcer.', 'A prompt.'],
          a: 1, why: 'In the presence of the cat, saying “dog” is not reinforced.' } },
      { h: 'Simple discriminations',
        p: ['In a simple discrimination, one stimulus is always the signal and the others never are. The student learns to press the green button and never the red one, or to walk when the bell rings.',
            'Teaching it means reinforcing the response every time in the presence of the SD, and never in its absence, over many trials and many examples.'],
        check: { q: 'A student is taught to hang his coat on the hook with his photo and never on any other hook. This is a:',
          opts: ['Simple discrimination.', 'Conditional discrimination.', 'Chain.', 'Preference assessment.'],
          a: 0, why: 'One stimulus, his photo, is always the signal.' } },
      { h: 'Conditional discriminations',
        p: ['In a conditional discrimination the right choice depends on something else that changes from trial to trial. With a cup, a shoe and a ball on the table, the cup is right when you say “cup” and wrong when you say “ball”. Matching a sample works the same way: the sample shown decides which choice is correct.',
            'Most of language and academic work is conditional discrimination, and it is harder to teach, because the student must attend to two things: the instruction or sample, and the choices.'],
        check: { q: 'Three pictures are on the table. “Touch the apple” is the instruction on one trial and “Touch the car” on the next. This is a:',
          opts: ['Simple discrimination.', 'Shaping procedure.', 'Conditional discrimination.', 'Chain.'],
          a: 2, why: 'Which picture is correct depends on the instruction given.' } },
      { h: 'Setting out the array',
        p: ['The student will use any reliable clue. Your job is to leave only one: the feature being taught. So the correct item’s position changes from trial to trial in no pattern. The targets are mixed in an unpredictable order. All the cards are the same size, equally clean, set down in the same way and at the same time.',
            'Follow the plan on how many items are in the array and which ones. Arrays often start small and grow, and the other items are chosen to be easy to tell apart at first and closer later.'],
        check: { q: 'For five trials in a row the correct card has been in the middle. What is the risk?',
          opts: ['The student will get tired.', 'The student may learn “pick the middle” instead of the picture.', 'The cards will wear out.', 'None.'],
          a: 1, why: 'Position is a reliable clue here, and students find reliable clues quickly.' } },
      { h: 'Running the trial',
        p: ['For choosing from an array, the usual order is: get attention, give the instruction or show the sample, then present the choices, or follow the order the plan gives. Wait for the response. Reinforce a correct, independent choice at once. Run the plan’s error correction for a wrong one or none.',
            'Keep your eyes on the student or on a neutral spot, not on the answer. Keep your voice the same for every item. Do not hold the correct card for longer or set it down last.'],
        check: { q: 'Where should your eyes be just after you give the instruction?',
          opts: ['On the correct card.', 'On the data sheet, writing.', 'On the student, or on a neutral spot.', 'On the wrong card, to test the student.'],
          a: 2, why: 'A look at any card is information the student can use, rightly or wrongly.' } },
      { h: 'When control is faulty',
        p: ['Sometimes the data look good and the learning is not what was intended. The student always picks the left side. Or picks whatever was correct on the last trial. Or has learned that the “dog” card has a bent corner. Or answers to one feature only, such as color, when the picture differs in shape as well.',
            'Signs to watch for: scores near chance, a string of answers on one side, success with your cards and failure with new ones, or success with you and failure with a colleague.',
            'When you see one, do not invent a remedy. Write down the pattern and tell your supervisor, who may change the array, the materials or the prompt.'],
        check: { q: 'A student scores 100% with the classroom’s flashcards and near zero with new pictures of the same things. Most likely:',
          opts: ['She has learned something about those particular cards and not the concept.', 'She dislikes the new pictures.', 'The new pictures are wrong.', 'She has mastered the skill.'],
          a: 0, why: 'Control by features of particular cards is faulty control. It shows when new examples are used.' } },
      { h: 'Many examples',
        p: ['“Dog” is not one picture. To respond to dogs in general, a student needs many examples that differ in everything except what makes a dog a dog, and non-examples that are close: a cat, a fox, a toy horse.',
            'So plans rotate several examples of each target and add new ones over time. If the plan gives you five dog pictures, use all five in mixed order, not your favorite. Report which new examples the student gets right the first time: that is the evidence that the concept has formed.'],
        check: { q: 'Why does a plan use many different pictures of “cup”?',
          opts: ['To use up the card stock.', 'To make scoring harder.', 'Because one picture gets boring.', 'So the student responds to cups in general, not to one picture.'],
          a: 3, why: 'Many examples teach the concept and support generalization.' } }
    ],
    examples: {
      ask: 'What is this?',
      intro: 'Ten scenes. Decide whether each shows a simple discrimination, a conditional discrimination, or faulty stimulus control.',
      opts: ['Simple discrimination', 'Conditional discrimination', 'Faulty stimulus control'],
      items: [
        { s: 'Ava lines up when the bell rings and stays seated when it does not.', a: 0, why: 'One signal always sets the occasion for the response.' },
        { s: 'With red, blue and green blocks in front of him, Ben hands over the color he is asked for.', a: 1, why: 'The correct block depends on the instruction.' },
        { s: 'Cy picks the card on the left on every trial and is right about a third of the time.', a: 2, why: 'Position, not the picture, controls the choice.' },
        { s: 'Shown a sample sock, Di finds the matching sock among three items; shown a spoon, she finds the spoon.', a: 1, why: 'Matching to sample: the sample decides the right choice.' },
        { s: 'Eli chooses the “cat” card only when it is the one with the coffee stain.', a: 2, why: 'An accidental feature of one card has become the cue.' },
        { s: 'Fay presses the buzzer when the light is on and not when it is off.', a: 0, why: 'One stimulus, light on, is always the signal.' },
        { s: 'Gus answers correctly whenever the aide glances at the right card, and at chance when she wears sunglasses.', a: 2, why: 'The glance is controlling the response.' },
        { s: 'Asked “What do you drink from?” Hal touches the cup; asked “What do you kick?” he touches the ball.', a: 1, why: 'The question determines which item is correct.' },
        { s: 'Ida always chooses whichever card was right on the trial before.', a: 2, why: 'The previous trial, not the instruction, controls her choice.' },
        { s: 'Jon puts his lunch box on the shelf marked with his name and nowhere else.', a: 0, why: 'His name is always the signal for that response.' }
      ]
    },
    practice: {
      title: 'Teach “touch the …” from three',
      intro: 'You are teaching Kira, a simulated student, to touch a named picture from an array of three. Read the plan, then decide.',
      plan: ['Targets: shoe (new), cup and ball (learned). Three pictures of each.', 'Array of three: one of each target. Positions and the target asked for change every trial, from the order sheet.', 'Instruction first: “Touch the (name).” Then set down the three cards together. Wait 5 seconds.', 'Correct: praise and a token. Error or no response: remove the cards, re-present with a point to the correct one, then run the trial again unprompted.', 'Record each trial: target, position, result.'],
      steps: [
        { t: 'Setting up', see: 'You have nine pictures and an order sheet that lists the target and its position for 12 trials.', opts: ['Follow the order sheet.', 'Make up the order as you go: it is more natural.', 'Ask for “shoe” six times first, then the others.'], a: 0, why: 'A person’s made-up order has patterns. The sheet was built without them.' },
        { t: 'Trial 1', see: 'The sheet says: shoe, on the right.', opts: ['Set down the cards, then say, “Touch the shoe.”', 'Say, “Touch the shoe,” then set down the three cards together, with the shoe on the right.', 'Set the shoe down last, with a little tap.'], a: 1, why: 'The plan gives the order, and all three cards go down in the same way.' },
        { t: 'Trial 3', see: 'You notice you have used the same shoe picture three times because it is on top of the pile.', opts: ['Carry on: it is the clearest one.', 'Rotate through the three shoe pictures.', 'Throw the other two away.'], a: 1, why: 'Several examples are there so that she learns “shoe”, not that one card.' },
        { t: 'Trial 5', see: '“Touch the ball.” Kira reaches for the cup.', opts: ['Say, “No, the ball.”', 'Let her finish the touch, then remove the cards, re-present with a point to the ball, and run the trial again unprompted.', 'Slide the ball toward her hand.'], a: 1, why: 'The written error correction, without comment. Sliding the card is a prompt given in a way the plan does not name.' },
        { t: 'Trial 8', see: 'Looking at your sheet: every error so far was a touch on the left card.', opts: ['Put the correct card on the left more often, to help her.', 'Stop using the left position.', 'Keep to the order sheet and make a note of the pattern for your supervisor.'], a: 2, why: 'Favoring or avoiding a side would teach the habit or hide it. The pattern is information for the supervisor.' },
        { t: 'Trial 10', see: 'A visitor watching says, “She looks at your face before she chooses.”', opts: ['Smile at her to encourage her.', 'Look at a neutral spot after giving the instruction, and note what the visitor saw.', 'Cover your face with the data sheet.'], a: 1, why: 'She may be reading your eyes. Remove the clue and report it.' },
        { t: 'After 12 trials', see: 'Shoe: 2 of 4 correct. Cup: 4 of 4. Ball: 3 of 4, the miss being the left-side error.', opts: ['Report each target with its numbers, and the left-side pattern.', 'Report “9 of 12, 75%” only.', 'Report that she knows cup and ball and not shoe.'], a: 0, why: 'Results by target show where the learning is; the overall figure hides it.' },
        { t: 'Next day', see: 'A colleague runs the same program and gets 100% on shoe. She always holds the correct card a little higher as she sets it down.', opts: ['Copy her method: it works.', 'Say nothing.', 'Tell your supervisor what you saw.'], a: 2, why: 'The scores from the two of you cannot both be true pictures. An unintended prompt explains the difference.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Stimulus control means that a behavior:', opts: ['Is controlled by rewards only.', 'Occurs more in the presence of a particular stimulus than in its absence.', 'Never occurs.', 'Is automatic.'], a: 1, why: 'The stimulus sets the occasion for the behavior.' },
      { q: 'An SD is a stimulus in whose presence a response:', opts: ['Has been reinforced.', 'Is punished.', 'Is never reinforced.', 'Is prompted.'], a: 0, why: 'It signals that reinforcement is available for that response.' },
      { q: 'An S-delta is a stimulus in whose presence a response:', opts: ['Is always reinforced.', 'Is physically prompted.', 'Is not reinforced.', 'Earns a token.'], a: 2, why: 'It signals that the response will not pay.' },
      { q: 'Discrimination training works by:', opts: ['Reinforcing the response in every situation.', 'Punishing errors.', 'Giving free reinforcers.', 'Reinforcing the response in the presence of the SD and not in the presence of other stimuli.'], a: 3, why: 'Differential reinforcement across stimuli.' },
      { q: 'In a conditional discrimination, the correct choice:', opts: ['Is always the same item.', 'Depends on another stimulus, such as the instruction or a sample.', 'Is the item on the left.', 'Is whatever was right last time.'], a: 1, why: 'The instruction or sample changes which choice is right.' },
      { q: 'Matching to sample is an example of:', opts: ['A conditional discrimination.', 'A simple discrimination.', 'Shaping.', 'Chaining.'], a: 0, why: 'The sample determines the correct comparison.' },
      { q: 'The position of the correct item is changed unpredictably so that:', opts: ['The session is longer.', 'The technician stays alert.', 'Position cannot become the cue.', 'The student gets confused.'], a: 2, why: 'Only the feature being taught should predict reinforcement.' },
      { q: 'A student always chooses the right-hand card. This is called:', opts: ['Mastery.', 'Generalization.', 'Maintenance.', 'A position (side) bias.'], a: 3, why: 'A kind of faulty stimulus control.' },
      { q: 'A sign of faulty stimulus control is:', opts: ['Steady progress with new examples.', 'High scores with one adult or one set of cards and low scores with others.', 'Quick answers.', 'Asking for a break.'], a: 1, why: 'Something other than the intended feature is guiding the answer.' },
      { q: 'When you suspect faulty control you:', opts: ['Note the pattern and tell your supervisor.', 'Change the array yourself.', 'Stop the program.', 'Score everything as correct.'], a: 0, why: 'The remedy is the supervisor’s to design.' },
      { q: 'Several examples of each target are used in order to:', opts: ['Fill the binder.', 'Slow learning.', 'Teach the concept and help generalization.', 'Make the cards last.'], a: 2, why: 'The student learns what the examples share.' },
      { q: 'An unintended cue from the adult might be:', opts: ['The written instruction.', 'The token.', 'The data sheet.', 'A glance at the correct card.'], a: 3, why: 'Eyes, hands, placement and voice all leak information.' },
      { q: 'Results of discrimination training are best reported:', opts: ['As one overall percentage.', 'For each target separately.', 'As a duration.', 'Not at all.'], a: 1, why: 'Per-target results show what has and has not been learned.' },
      { q: 'A student correct on the first trial with a brand-new example shows:', opts: ['Evidence that the concept has generalized.', 'Luck only.', 'Faulty control.', 'Prompt dependence.'], a: 0, why: 'First-trial success with new examples is the test.' }
    ] },
    role: [
      { t: 'Twelve trials from an order sheet', setup: 'The trainer plays a student. Three targets, three pictures each, an array of three and an order sheet. The trainer makes two errors and tends to pick the left.',
        steps: ['Follows the order sheet for target and position.', 'Rotates through the examples of each target.', 'Gives the instruction and sets down the cards in the order the plan gives, all cards alike.', 'Keeps eyes off the correct card.',
                'Runs the written error correction.', 'Records target, position and result each trial.', 'Reports results by target and names the left-side pattern.'] },
      { t: 'Spot the leak', setup: 'The trainer runs six trials as the “technician”, deliberately giving three different unintended cues. The trainee watches.',
        steps: ['Identifies at least two of the three cues.', 'Says how each could teach the wrong thing.', 'Says what they would do if they saw a colleague doing it.'] }
    ],
    roleRule: 'Met when the first run has every step in place and at least two cues are identified in the second.',
    discuss: [
      'What accidental clues might your own materials carry?',
      'A student does well with you and poorly with everyone else. What are the possible reasons?',
      'Why is “she got 80%” not enough to know that a discrimination has been learned?'
    ],
    read: [
      'Green, G. (2001). Behavior analytic instruction for learners with autism: Advances in stimulus control technology. Focus on Autism and Other Developmental Disabilities, 16(2), 72–85.',
      'Grow, L., & LeBlanc, L. (2013). Teaching receptive language skills: Recommendations for instructors. Behavior Analysis in Practice, 6(1), 56–75.',
      'Lovaas, O. I., Koegel, R. L., & Schreibman, L. (1979). Stimulus overselectivity in autism: A review of research. Psychological Bulletin, 86(6), 1236–1254.'
    ]
  },

  e9: {
    aim: [
      'Define extinction and say what it looks like for each function of behavior.',
      'Explain why “just ignore it” is right for some behavior and wrong for other behavior.',
      'Name the side effects of extinction and respond to them as the plan says.',
      'Explain why consistency matters more here than anywhere else.'
    ],
    lesson: [
      { h: 'What extinction is',
        p: ['Extinction means that a behavior no longer produces the reinforcer that has kept it going, and as a result it happens less. Nothing is added and nothing is taken away from the student; the payoff simply stops.',
            'It is rarely used alone. A behavior that stops paying needs a replacement that does pay, so plans pair extinction with reinforcement for an alternative, as in the unit on differential reinforcement.'],
        check: { q: 'Extinction is:',
          opts: ['Removing a privilege after the behavior.', 'Reprimanding the behavior.', 'No longer delivering the reinforcer that has maintained the behavior.', 'Sending the student out.'],
          a: 2, why: 'The behavior stops producing what it used to produce.' } },
      { h: 'It depends on the function',
        p: ['What you withhold depends on what the behavior has been getting. For behavior kept going by attention, extinction is giving no attention for it: no words, no eye contact, no change of expression. This is planned ignoring.',
            'For behavior kept going by escape, extinction is not letting the behavior end the task: the instruction stays in place, and the student is helped through it as the plan describes. For behavior kept going by items, the item is not given after the behavior.',
            'For automatically reinforced behavior, extinction would mean stopping the sensation the behavior itself produces, which needs special arrangements that the supervisor designs.'],
        key: ['Attention: no attention follows the behavior.', 'Escape: the behavior does not end or delay the task.', 'Items: the behavior does not produce the item.'],
        check: { q: 'A student screams to get out of handwriting. Which is extinction?',
          opts: ['Ignoring the scream and letting him leave the table.', 'Keeping the handwriting task in place and helping him through it as the plan says.', 'Giving him the tablet to calm down.', 'Talking with him about his feelings until the lesson ends.'],
          a: 1, why: 'The scream has been ending the task. Extinction means it no longer does.' } },
      { h: 'Why “just ignore it” can be exactly wrong',
        p: ['Ignoring is extinction only for behavior that is kept going by attention. If a student throws her book to get out of reading and the adult “ignores” it by turning away, the reading stops. The behavior has been reinforced, not extinguished.',
            'That is why extinction is never chosen by its look. It comes from a functional assessment, it is written into the plan with the guardian’s consent, and you use it only where the plan says and as it says.'],
        check: { q: 'Leo tears up his worksheet to avoid math. The aide looks away and says nothing, and math is over. What has happened?',
          opts: ['Extinction.', 'Positive punishment.', 'Nothing.', 'Tearing has been reinforced by escape from math.'],
          a: 3, why: 'The consequence that maintains the behavior, escape, was delivered.' } },
      { h: 'The extinction burst and other side effects',
        p: ['When a behavior first stops working, it usually gets worse before it gets better: more often, louder, longer. This is an extinction burst. It is a sign that the right reinforcer has been found, and it is temporary if everyone holds to the plan.',
            'New forms may appear, as the student tries what else might work: whining becomes shouting, shouting becomes kicking. This is response variation. There may be crying and aggression.',
            'After the behavior has gone, it may come back briefly after a break, such as a weekend. This is spontaneous recovery. An older behavior that was dealt with long ago may also return if the new, alternative behavior stops paying. This is resurgence.'],
        check: { q: 'On the second day of planned ignoring, a student’s whining doubles and she begins stamping her feet. This is most likely:',
          opts: ['Proof that the plan has failed.', 'Spontaneous recovery.', 'An extinction burst with some response variation.', 'Resurgence.'],
          a: 2, why: 'An early increase and new forms are the expected first effects of extinction.' } },
      { h: 'Consistency, above all',
        p: ['The worst outcome is extinction most of the time. If the behavior pays off now and then, especially at its loudest, the student learns two things: keep going longer, and go louder. Behavior reinforced only occasionally is the hardest of all to get rid of.',
            'So everyone who is with the student has to respond the same way, every time, in every place the plan covers. If you see that this cannot be done, that a colleague or a parent gives in, or that you yourself cannot hold out, tell your supervisor at once. A plan that cannot be carried out consistently should be changed, not attempted.'],
        check: { q: 'During a burst, a teacher gives the student the tablet “just this once” after ten minutes of screaming. The student has most likely learned that:',
          opts: ['Screaming no longer works.', 'Long, loud screaming works.', 'The teacher is kind.', 'Tablets are bad.'],
          a: 1, why: 'Reinforcement at the peak strengthens longer and louder behavior.' } },
      { h: 'Safety and limits',
        p: ['A burst in a behavior that is merely annoying can be waited out. A burst in head-banging, biting or running into the road cannot. For dangerous behavior, plans either do not use extinction or build in protection, and they say exactly when you stop and what you do then.',
            'Before you start, know the plan’s safety steps and whom to call. During a session, a student’s or another person’s safety always comes before the procedure. Afterwards, record what happened and report it the same day.'],
        check: { q: 'During escape extinction, a student begins to hit his head on the table, which is not described in the plan. You:',
          opts: ['Keep the task in place: giving up would reinforce it.', 'Leave the room.', 'Shout at him to stop.', 'Protect him, follow the workplace’s safety and crisis procedures, and contact your supervisor.'],
          a: 3, why: 'Safety outranks the procedure. The supervisor then decides whether the plan can continue.' } },
      { h: 'Staying kind while holding the line',
        p: ['Extinction withholds one specific consequence. It does not mean being cold. You can stay near, calm and ready, and the moment the alternative behavior happens you respond warmly and at once.',
            'Some plans say what comfort may be given during distress without giving the reinforcer itself: a calm presence and a few words, but not the item or the break. Whether that is possible depends on the function. Where attention is what the behavior works for, comfort is the reinforcer. Do what the plan writes, and if it does not say, ask.'],
        check: { q: 'In planned ignoring, what do you do the moment the student uses the alternative behavior, for example raising a hand?',
          opts: ['Give attention at once, warmly.', 'Keep ignoring for a while to be sure.', 'Remind her of the earlier whining.', 'Wait until the end of the lesson.'],
          a: 0, why: 'The plan works by the contrast: nothing for the old behavior, a quick and generous response for the new one.' } }
    ],
    watch: [
      { k: 'ext_ignore', c: 1, look: 'What the teacher withholds, what she goes on doing, and how quickly attention comes for the other behavior.' },
      { k: 'ext_wait', c: 1, look: 'How the task stays in place without argument, and what ends the wait.' },
      { k: 'ext_kind', c: 1, look: 'Which comfort is given, and what is still not given: the item or the break.' }
    ],
    examples: {
      ask: 'Which effect of extinction is this?',
      intro: 'Ten moments after extinction has started. Decide which effect each one shows.',
      opts: ['Extinction burst', 'New forms (response variation)', 'Spontaneous recovery', 'Resurgence'],
      items: [
        { s: 'On the first day that calling out is ignored, Mae calls out twice as often as usual.', a: 0, why: 'A temporary increase right after the reinforcer stops.' },
        { s: 'Whining no longer gets the toy. Ned begins to tug the adult’s sleeve and then to stamp.', a: 1, why: 'Other behavior is tried when the usual one fails.' },
        { s: 'Tantrums at bedtime had stopped for two weeks. After a weekend at his grandparents’, there is one on Monday night.', a: 2, why: 'A brief return after a break.' },
        { s: 'Ola was taught to ask for a break instead of throwing. When a new teacher stops honoring her requests, throwing, gone for months, returns.', a: 3, why: 'An old behavior comes back when the alternative stops paying.' },
        { s: 'The vending machine keeps the coin. You press the button harder and five more times.', a: 0, why: 'More and stronger responding when the expected result does not come.' },
        { s: 'Screaming no longer ends the task. Pax starts to slide off his chair instead.', a: 1, why: 'A new form appears.' },
        { s: 'After the summer holidays, Rae shouts out in class once on the first day back, though she had stopped in June.', a: 2, why: 'The behavior reappears after time away, then fades again if it still does not pay.' },
        { s: 'Sid learned to tap a card for attention in place of hitting. During a week when the card is lost, he begins hitting again.', a: 3, why: 'With the alternative unavailable, the earlier behavior resurges.' },
        { s: 'On day two, crying that used to last 3 minutes lasts 12.', a: 0, why: 'An increase in duration is part of a burst.' },
        { s: 'When pulling hair gets no reaction, Tia tries pinching, which she has never done before.', a: 1, why: 'A new form of behavior in the same situation.' }
      ]
    },
    practice: {
      title: 'Hold a plan through its first week',
      intro: 'You work with Uri, a simulated student whose whining is kept going by adult attention. Read the plan, then decide.',
      plan: ['Whining: no words, no eye contact, no change of expression. Go on with what you were doing.', 'Raising his hand, or saying “Excuse me”: go to him within 5 seconds, warmly.', 'Every adult in the room responds in the same way.', 'If he hits or throws: follow the classroom’s safety procedure and tell the supervisor the same day.', 'Record each whine and each hand raise.'],
      steps: [
        { t: 'Monday', see: 'Uri whines, “Miiiss, look at mine.”', opts: ['Say, “I will come when you ask nicely.”', 'Go on with what you are doing: no words, no look.', 'Give him a stern look.'], a: 1, why: 'A reminder and a stern look are both attention.' },
        { t: 'Monday', see: 'He raises his hand.', opts: ['Go to him within 5 seconds, warmly.', 'Wait a minute, so he learns patience.', 'Say, “See, that wasn’t so hard.”'], a: 0, why: 'The new behavior has to pay at once. A remark about the old one adds nothing.' },
        { t: 'Tuesday', see: 'Whining has doubled, and it is louder.', opts: ['Tell your supervisor the plan is making him worse and stop it.', 'Hold to the plan, record it, and report it today as an increase.', 'Answer the loudest ones only.'], a: 1, why: 'A burst is expected. Answering the loudest ones would teach him to be loud.' },
        { t: 'Tuesday', see: 'The classroom aide, worn down, goes to Uri during a whine and says, “What is it, sweetheart?”', opts: ['Say nothing: she outranks you.', 'Correct her in front of the class.', 'Speak with her afterwards about the plan if that is your place, and tell your supervisor it happened.'], a: 2, why: 'One adult giving in undoes the plan. The supervisor needs to know and can train the team.' },
        { t: 'Wednesday', see: 'Uri whines, then sweeps his pencil case onto the floor.', opts: ['Tell him to pick it up at once.', 'Keep giving no attention for the whine; the pencil case is not a safety matter, so carry on, and record it as a new form.', 'Send him out.'], a: 1, why: 'New forms are expected. This one is not dangerous, and attention for it would make it the new whine.' },
        { t: 'Thursday', see: 'Uri whines, then throws a book that hits a classmate.', opts: ['Ignore it: it is part of the burst.', 'Follow the classroom’s safety procedure, and tell your supervisor today.', 'Give him attention so that he calms down.'], a: 1, why: 'The plan names hitting and throwing as safety matters with their own response.' },
        { t: 'The next Monday', see: 'After four quiet days, Uri whines twice in the first hour back.', opts: ['Conclude that the plan has stopped working.', 'Respond exactly as before, and record it.', 'Go back to answering him.'], a: 1, why: 'A brief return after a break is spontaneous recovery. It fades if nothing changes.' },
        { t: 'The end of the week', see: 'Your record: whines 14, 31, 22, 9, 4, then 2 on the following Monday. Hand raises 3, 5, 9, 12, 15, 14.', opts: ['Report the numbers, the aide’s response on Tuesday, the pencil case and the thrown book.', 'Report “much better” and leave it there.', 'Report only the good days.'], a: 0, why: 'The burst, the lapse in consistency, the new forms and the safety event are all things the supervisor needs.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Extinction reduces behavior by:', opts: ['Adding something unpleasant.', 'No longer delivering the reinforcer that maintained it.', 'Removing a privilege.', 'Teaching a new skill.'], a: 1, why: 'The behavior stops paying.' },
      { q: 'Planned ignoring is extinction for behavior maintained by:', opts: ['Attention', 'Escape', 'Automatic reinforcement', 'Items'], a: 0, why: 'What is withheld is attention.' },
      { q: 'For escape-maintained behavior, extinction means:', opts: ['Turning away from the student.', 'Sending the student out.', 'The behavior no longer ends or delays the task.', 'Giving a break after the behavior.'], a: 2, why: 'The escape is what is withheld.' },
      { q: 'An extinction burst is:', opts: ['A permanent worsening.', 'A sign the wrong function was chosen.', 'A new skill.', 'A temporary increase in the behavior when extinction begins.'], a: 3, why: 'It usually passes if the plan is held.' },
      { q: 'Spontaneous recovery is:', opts: ['The first increase when extinction starts.', 'A brief return of the behavior after time away.', 'A new form of behavior.', 'A side effect of punishment only.'], a: 1, why: 'It appears after a pause and fades if not reinforced.' },
      { q: 'Resurgence is the return of:', opts: ['An earlier behavior when the alternative is no longer reinforced.', 'The reinforcer.', 'The supervisor.', 'Baseline data.'], a: 0, why: 'It shows why the alternative must keep paying.' },
      { q: 'Giving in occasionally during extinction tends to:', opts: ['Speed things up.', 'Make no difference.', 'Make the behavior more persistent and often more intense.', 'End the burst.'], a: 2, why: 'Intermittent reinforcement builds persistence.' },
      { q: 'Extinction is usually combined with:', opts: ['Nothing.', 'More demands.', 'Longer sessions.', 'Reinforcement for an alternative behavior.'], a: 3, why: 'The student needs another way to get the same thing.' },
      { q: 'Ignoring a behavior that is maintained by escape:', opts: ['Is extinction.', 'May reinforce it, because the task goes away.', 'Is punishment.', 'Always works.'], a: 1, why: 'The maintaining consequence is delivered.' },
      { q: 'Who decides whether extinction is used?', opts: ['The supervisor, from an assessment, in a written plan with consent.', 'The technician, in the moment.', 'The classroom aide.', 'Whoever is most annoyed.'], a: 0, why: 'It depends on the function and carries risks that have to be planned for.' },
      { q: 'During planned ignoring you withhold:', opts: ['Everything, for the rest of the day.', 'Food.', 'Attention for the target behavior only.', 'Safety.'], a: 2, why: 'You ignore the behavior, not the student.' },
      { q: 'If dangerous behavior appears during extinction, you:', opts: ['Carry on with the procedure.', 'Wait for the burst to pass.', 'Record it next week.', 'Put safety first, follow the crisis procedure and contact your supervisor.'], a: 3, why: 'Safety outranks the procedure.' },
      { q: 'Response variation during extinction means:', opts: ['The behavior stops.', 'New forms of behavior appear.', 'The reinforcer changes.', 'The data vary.'], a: 1, why: 'The student tries what else might work.' },
      { q: 'A colleague is not following the extinction plan. You:', opts: ['Tell your supervisor.', 'Give up on it too.', 'Report her to the family.', 'Ignore her.'], a: 0, why: 'Inconsistency is the main threat, and training the team is the supervisor’s task.' },
      { q: 'When the alternative behavior occurs during an extinction plan, you:', opts: ['Wait, to avoid spoiling the student.', 'Ignore it too.', 'Reinforce it at once.', 'Mention the earlier problem behavior.'], a: 2, why: 'The contrast between the two responses is what teaches.' }
    ] },
    role: [
      { t: 'Planned ignoring with an alternative', setup: 'The trainer plays a student who whines for attention, escalates in volume, tries a new behavior (tapping the table), and raises a hand twice. A written plan gives the responses.',
        steps: ['Gives no words, eye contact or change of expression for the whining.', 'Carries on with an activity.', 'Holds through the escalation.', 'Gives no attention for the new form, which is not a safety matter.',
                'Goes to the “student” within 5 seconds of a raised hand, warmly.', 'Records whines and hand raises.', 'Names the burst and the new form afterwards.'] },
      { t: 'When to stop', setup: 'The trainer describes or acts three moments during an extinction procedure: louder crying; a new, harmless behavior; and a behavior that could injure. The plan’s safety steps are on a card.',
        steps: ['Holds the procedure through the first two.', 'Stops the procedure at the third and follows the safety steps.', 'Says whom they would contact and when.', 'Says what they would record.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'What makes it hard to hold out during a burst, and what would help you?',
      'Think of a time an adult gave in “just this once”. What did the child do the next time?',
      'Where is the line, for you, between withholding a reinforcer and being unkind? What does a plan need to say for you to be comfortable carrying it out?'
    ],
    read: [
      'Lerman, D. C., & Iwata, B. A. (1996). Developing a technology for the use of operant extinction in clinical settings: An examination of basic and applied research. Journal of Applied Behavior Analysis, 29(3), 345–382.',
      'Lerman, D. C., Iwata, B. A., & Wallace, M. D. (1999). Side effects of extinction: Prevalence of bursting and aggression during the treatment of self-injurious behavior. Journal of Applied Behavior Analysis, 32(1), 1–8.',
      'Iwata, B. A., Pace, G. M., Cowdery, G. E., & Miltenberger, R. G. (1994). What makes extinction work: An analysis of procedural form and function. Journal of Applied Behavior Analysis, 27(1), 131–144.'
    ]
  },

  e10: {
    aim: [
      'Define punishment by its effect and tell positive from negative punishment.',
      'Describe time-out, response cost and overcorrection, and interrupting and redirecting.',
      'Name the side effects of punishment.',
      'State the conditions under which a technician may carry out a punishment procedure, and carry one out exactly as written.'
    ],
    lesson: [
      { h: 'Punishment is defined by what it does',
        p: ['In this field, punishment is not about blame or severity. It is a consequence that follows a behavior and makes that behavior less likely in the future. If the behavior does not decrease, it was not punishment, whatever was intended.',
            'A scolding that is followed by more of the behavior has worked as reinforcement. A quiet, small consequence that is followed by less of it has worked as punishment.'],
        check: { q: 'A consequence is a punisher when:',
          opts: ['It is unpleasant.', 'An adult intends it as one.', 'The behavior it follows decreases.', 'It is delivered sternly.'],
          a: 2, why: 'Like reinforcement, punishment is defined by its effect on future behavior.' } },
      { h: 'Positive and negative',
        p: ['In positive punishment something is added after the behavior and the behavior goes down: a reprimand, a required extra task, a brief block of the movement.',
            'In negative punishment something is taken away and the behavior goes down: a token is removed (response cost), or access to what the student enjoys is removed for a short time (time-out from positive reinforcement).',
            'As with reinforcement, positive and negative mean added and removed. They do not mean good and bad.'],
        key: ['Positive punishment: something is added; the behavior goes down.', 'Negative punishment: something is removed; the behavior goes down.'],
        check: { q: 'Each time Vic swears he loses one token, and swearing decreases. This is:',
          opts: ['Negative punishment.', 'Positive punishment.', 'Negative reinforcement.', 'Extinction.'],
          a: 0, why: 'Something is removed and the behavior goes down. It is called response cost.' } },
      { h: 'The procedures you may meet',
        p: ['Time-out from positive reinforcement removes the student’s access to reinforcers for a short, set time after the behavior. It may be nonexclusionary, where the student stays in the room and loses the activity, the materials or attention for a minute, or exclusionary, where the student moves away from the activity. It only works if the “time-in” is worth staying in. A student who wants to leave the lesson is rewarded by being sent out.',
            'Response cost removes a set amount of something already earned: tokens, points, minutes. Overcorrection has the student repair the effects of the behavior and more (restitution), or practice the correct behavior several times (positive practice).',
            'Each has written rules: for which behavior, how much, how long, what you say, and how it ends.'],
        check: { q: 'A student who dislikes group work is sent to sit alone each time he disrupts it. Disruption increases. Why?',
          opts: ['The time-out was too short.', 'Leaving the group is what he wants, so being sent out reinforces the disruption.', 'He needs a longer time-out.', 'Time-out never works.'],
          a: 1, why: 'Time-out reduces behavior only when it removes something the student wants.' } },
      { h: 'Interrupting and redirecting',
        p: ['For repetitive behavior that is maintained by its own sensation, some plans use response interruption and redirection. At the first sign of the behavior, the adult interrupts it and asks for a few simple responses the student can do, such as answering known questions or following one-step directions, and then returns the student to the activity.',
            'Other plans block a behavior at its first movement, for example the hand going toward the mouth with something that is not food, and redirect to something safe.',
            'These are gentle to look at, and they are still procedures with rules: what counts as the first sign, exactly what you ask, how many responses, and when it ends. Run them as written.'],
        check: { q: 'In interrupting and redirecting, when does the adult act?',
          opts: ['After the behavior has gone on for a minute.', 'At the end of the session.', 'Only when someone complains.', 'At the first sign of the behavior, as the plan defines it.'],
          a: 3, why: 'Early interruption, then the redirection the plan names.' } },
      { h: 'Side effects',
        p: ['Punishment can produce crying, anger and aggression toward the person who delivers it. The student may come to avoid that person, the room or the task, by leaving, hiding or lying. The behavior may drop where it is punished and rise elsewhere. And the student sees an adult solving a problem by imposing something, which is a model.',
            'It also teaches nothing new. A behavior that is suppressed, with no other way to get what it got, tends to return or be replaced by something else.',
            'There is a risk for the adult as well. Punishment often stops behavior on the spot, and that relief makes the adult more likely to use it again, and more of it. This is one reason it is never left to the judgment of the moment.'],
        check: { q: 'Which is a known side effect of punishment?',
          opts: ['Faster learning of new skills.', 'More smiling.', 'Avoidance of the person or place linked with it.', 'Better generalization.'],
          a: 2, why: 'Escape and avoidance are among the best-documented side effects.' } },
      { h: 'When, and by whom',
        p: ['Because of these risks, punishment is considered only when reinforcement-based procedures alone have not been enough, or when the behavior is too dangerous to wait. It is always combined with reinforcement for an alternative behavior.',
            'For you the rules are firm. You carry out a restrictive or punishment-based procedure only when it is written in the behavior plan, the guardian has consented, and your supervisor has checked that you can do it correctly. You do not add consequences of your own: no extra time, no “and you have lost recess too”, no raised voice.',
            'Laws and workplace policies set further limits on anything that restricts a person’s movement or isolates them. Know your workplace’s policy, and never use holding or seclusion that you have not been trained and authorized to use.'],
        check: { q: 'A student has kicked you. The plan lists a one-minute loss of the activity for kicking. A colleague says, “Make it ten minutes, so he learns.” You:',
          opts: ['Make it ten minutes.', 'Make it five, as a compromise.', 'Carry out the one minute as written.', 'Skip it and lecture him instead.'],
          a: 2, why: 'The amount is part of the written procedure. More is not better, and it is not yours to add.' } },
      { h: 'Doing it as written, and reporting',
        p: ['When the plan calls for it, deliver the consequence at once, calmly, in the words the plan gives and no others, every time the behavior occurs. Keep your face and voice neutral. End it exactly as the plan says, and go straight back to chances to earn reinforcement.',
            'Record every use: the time, the behavior, what you did, how long, and how the student responded. Tell your supervisor about side effects, about any time you could not carry it out as written, and about any time you are unsure whether it is still needed. A punishment procedure should show an effect quickly; if it does not, the supervisor needs to know quickly.'],
        check: { q: 'After a one-minute loss of the activity ends, what comes next?',
          opts: ['A talk about what he did wrong.', 'A return to the activity and to chances to earn reinforcement.', 'A second minute, to be sure.', 'An apology demanded from him.'],
          a: 1, why: 'The consequence ends as written, and the student is back where good behavior can pay.' } }
    ],
    watch: [
      { k: 'rird_vocal', c: 1, look: 'How the interruption is done with questions the student can answer, and when play is given back.' },
      { k: 'rird_motor', c: 1, look: 'The one-step directions that are used, how many, and what ends the redirection.' },
      { k: 'rird_pica', look: 'How early the block comes, and what the student is redirected to.' }
    ],
    examples: {
      ask: 'What is this?',
      intro: 'Ten scenes. In each, decide whether it shows positive punishment, negative punishment, or neither.',
      opts: ['Positive punishment', 'Negative punishment', 'Not punishment'],
      items: [
        { s: 'Each time Wes throws a block, the blocks are put away for one minute. Throwing decreases.', a: 1, why: 'Access to the activity is removed and the behavior goes down: time-out from the activity.' },
        { s: 'Each time Xia spills her drink on purpose she wipes the whole table. Spilling decreases.', a: 0, why: 'A task is added and the behavior goes down: overcorrection.' },
        { s: 'Yan is told off each time he hums. He hums more each week.', a: 2, why: 'The behavior increased, so the telling off is not working as punishment.' },
        { s: 'Zoe loses two points for each shove in line. Shoving decreases.', a: 1, why: 'Points are removed and the behavior goes down: response cost.' },
        { s: 'Abe gets no attention for whining, and whining slowly fades.', a: 2, why: 'A reinforcer is withheld. That is extinction: nothing is added or taken away.' },
        { s: 'A firm “No” follows each time Bea reaches for the stove, and reaching decreases.', a: 0, why: 'A reprimand is added and the behavior goes down.' },
        { s: 'Cal is sent out of the lesson he dislikes each time he shouts. Shouting increases.', a: 2, why: 'The behavior went up. Being sent out works here as reinforcement.' },
        { s: 'After Dee scribbles on a desk she cleans that desk and two others. Scribbling on desks stops.', a: 0, why: 'Restitution beyond the damage is added; the behavior decreases.' },
        { s: 'When Eli hits during the game, his turn is skipped. Hitting during games decreases.', a: 1, why: 'A turn is taken away and the behavior goes down.' },
        { s: 'Fen earns a token for each minute of quiet work.', a: 2, why: 'This is reinforcement for another behavior.' }
      ]
    },
    practice: {
      title: 'A written procedure, and nothing more',
      intro: 'You work with Gio, a simulated student. His plan was written by your supervisor, the family has consented, and your supervisor has watched you carry it out. Read it, then decide.',
      plan: ['Tokens: one for each completed task; five tokens buy 3 minutes of the tablet.', 'Spitting: say “No spitting,” in a neutral voice, and remove one token. Nothing else. Never below zero tokens.', 'Hand flapping for more than 3 seconds during work: say his name, ask three known questions (“What is your name? How old are you? What color is this?”), praise the third answer, and return to the task.', 'Record every use of each procedure.'],
      steps: [
        { t: '9:10', see: 'Gio spits on the table. He has three tokens.', opts: ['Say “No spitting,” in a neutral voice and remove one token.', 'Remove all three tokens: spitting is serious.', 'Say, “That’s disgusting. How many times have I told you?” and remove one token.'], a: 0, why: 'One token and three words. More tokens, or more talk, is a different procedure.' },
        { t: '9:12', see: 'Gio cries after losing the token.', opts: ['Give the token back to calm him.', 'Stay calm, give the next task as usual, and note the crying.', 'Remove another token for crying.'], a: 1, why: 'Crying is a side effect to record. The way back is the next chance to earn.' },
        { t: '9:20', see: 'Gio spits again. He has zero tokens.', opts: ['Put him at minus one.', 'Take the tablet away for the day.', 'Say “No spitting.” No token can be removed; record it.'], a: 2, why: 'The plan says never below zero, and it lists no other penalty.' },
        { t: '9:30', see: 'During a worksheet Gio flaps his hands for about 5 seconds.', opts: ['Hold his hands down.', 'Say his name, ask the three known questions, praise the third answer, and return to the task.', 'Remove a token.'], a: 1, why: 'Each behavior has its own procedure. Holding his hands is not in the plan.' },
        { t: '9:31', see: 'He answers the first question and flaps again before the second.', opts: ['Start the three questions again, as your supervisor trained you for this case.', 'Give up for today.', 'Raise your voice.'], a: 0, why: 'The redirection is completed. If training did not cover a case, that is a question for the supervisor, not a place to improvise.' },
        { t: '10:00', see: 'The teacher says, “He spat twice. No recess for him today.”', opts: ['Agree: it backs up the plan.', 'Say that the plan’s consequence for spitting has already been given, and pass her concern to your supervisor.', 'Tell Gio that he has lost recess.'], a: 1, why: 'Extra penalties are not in the plan. The teacher’s concern is real and goes to the supervisor.' },
        { t: 'End of the week', see: 'Spitting: 4, 5, 4, 6, 5 times a day. Gio now hides under the table when the token board comes out.', opts: ['Keep going for another month.', 'Report the numbers and the hiding to your supervisor now.', 'Remove two tokens each time from now on.'], a: 1, why: 'No decrease, and avoidance of the token board: both are reasons for the supervisor to look at the plan at once.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Punishment is defined as a consequence that:', opts: ['Is painful.', 'Decreases the future likelihood of the behavior it follows.', 'Is given by an authority.', 'Is deserved.'], a: 1, why: 'The definition rests on the effect.' },
      { q: 'In positive punishment:', opts: ['Something is added and the behavior decreases.', 'Something is removed and the behavior decreases.', 'Something is added and the behavior increases.', 'The behavior is ignored.'], a: 0, why: 'Positive means added.' },
      { q: 'Response cost is:', opts: ['The effort a response takes.', 'Positive punishment.', 'The removal of a set amount of a reinforcer after the behavior.', 'A kind of extinction.'], a: 2, why: 'It is negative punishment.' },
      { q: 'Time-out is short for time-out from:', opts: ['Work.', 'The classroom.', 'Supervision.', 'Positive reinforcement.'], a: 3, why: 'It works by removing access to reinforcers.' },
      { q: 'Time-out is unlikely to reduce behavior when:', opts: ['It is brief.', 'The student wants to get away from the activity.', 'It is used consistently.', 'The time-in is enjoyable.'], a: 1, why: 'Removal from something disliked is a reward.' },
      { q: 'Overcorrection involves:', opts: ['Repairing the effects of the behavior and more, or practicing the correct behavior repeatedly.', 'Removing tokens.', 'Ignoring.', 'A longer session.'], a: 0, why: 'Restitution and positive practice.' },
      { q: 'A side effect of punishment is:', opts: ['Increased trust.', 'New skills.', 'Emotional responses and aggression.', 'Faster generalization.'], a: 2, why: 'Along with escape and avoidance.' },
      { q: 'A technician may carry out a punishment-based procedure:', opts: ['Whenever behavior is severe.', 'When a teacher asks.', 'When nothing else is to hand.', 'Only when it is in the written plan and the supervisor has verified their competence.'], a: 3, why: 'This is a standard of the RBT Ethics Code.' },
      { q: 'Punishment procedures are always combined with:', opts: ['Longer school days.', 'Reinforcement for an alternative behavior.', 'Extra punishment at home.', 'Nothing.'], a: 1, why: 'Suppression alone teaches nothing.' },
      { q: 'A consequence of your own, added in the moment, is:', opts: ['Outside your role, and not permitted.', 'A sign of initiative.', 'Fine if it is mild.', 'Fine if a parent agrees on the spot.'], a: 0, why: 'Only what is written, consented to and trained.' },
      { q: 'Why can punishment be over-used by adults?', opts: ['It is recommended first.', 'It needs no plan.', 'It often stops behavior at once, which reinforces the adult for using it.', 'It has no side effects.'], a: 2, why: 'The adult’s relief is negative reinforcement.' },
      { q: 'In response interruption and redirection, the adult:', opts: ['Removes tokens.', 'Sends the student out.', 'Ignores the behavior.', 'Interrupts the behavior early and asks for a few simple responses.'], a: 3, why: 'Then the student returns to the activity.' },
      { q: 'A punishment procedure shows no decrease after a week. You:', opts: ['Increase the amount yourself.', 'Report it to your supervisor.', 'Continue indefinitely.', 'Switch to a different punishment.'], a: 1, why: 'A procedure that restricts and does not work has to be reviewed quickly.' },
      { q: 'When delivering a written consequence, your manner is:', opts: ['Calm and neutral, with only the plan’s words.', 'Angry, to show it matters.', 'Apologetic.', 'Playful.'], a: 0, why: 'Emotion adds attention and unpredictability.' },
      { q: 'A student starts to avoid the room where a consequence is used. This is:', opts: ['A sign of success.', 'Unrelated.', 'A side effect to report.', 'Extinction.'], a: 2, why: 'Avoidance of places and people linked with punishment is a known side effect.' }
    ] },
    role: [
      { t: 'Response cost, as written', setup: 'The trainer plays a student on a token board. A written procedure removes one token, with three set words, for one defined behavior. The “student” shows the behavior three times, once at zero tokens, and protests.',
        steps: ['Delivers tokens for work as the plan says.', 'Removes one token at once after the behavior, with the set words in a neutral voice.', 'Adds no other words or penalties.', 'Does not go below zero.',
                'Does not argue with the protest, and presents the next chance to earn.', 'Records each use.'] },
      { t: 'Interrupt and redirect', setup: 'The trainer plays a student who shows a repetitive vocal or motor behavior during play. A written procedure gives the first sign, three questions or directions, and the return to play.',
        steps: ['Acts at the first sign, as defined.', 'Uses the questions or directions the procedure lists.', 'Completes the set number of responses.', 'Praises as written and returns the “student” to play.',
                'Uses no physical hold.', 'Records each use.'] }
    ],
    roleRule: 'Met when each run is completed with every step in place.',
    discuss: [
      'How would you answer a colleague who says, “He needs a real consequence”?',
      'What would tell you that a consequence in a plan has become something the student fears?',
      'Which rules does your workplace have about holding or isolating a student? Where are they written?'
    ],
    read: [
      'Lerman, D. C., & Vorndran, C. M. (2002). On the status of knowledge for using punishment: Implications for treating behavior disorders. Journal of Applied Behavior Analysis, 35(4), 431–464.',
      'Ahearn, W. H., Clark, K. M., MacDonald, R. P. F., & Chung, B. I. (2007). Assessing and treating vocal stereotypy in children with autism. Journal of Applied Behavior Analysis, 40(2), 263–275.',
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standard 2.05. bacb.com.'
    ]
  }
});
