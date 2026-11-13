/* nbh-learn-units-e2.js (v26.01): written units of the Learning page, section E (Behavior-change interventions), units e4 to e6.
   The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  e4: {
    aim: [
      'Say what makes teaching naturalistic and how it differs from discrete-trial teaching.',
      'Set up the surroundings so that the student has reasons to communicate.',
      'Wait for the student to start, prompt a little more, and reinforce with the natural result.',
      'Keep play as play while still teaching and recording.'
    ],
    lesson: [
      { h: 'Teaching inside ordinary life',
        p: ['Naturalistic teaching happens in the flow of play, meals, routines and lessons, using what the student wants at that moment. The student leads, the adult follows and builds on it, and the reinforcer is the natural result of the behavior: asking for the swing gets a push.',
            'Incidental teaching and natural environment teaching are two names you will hear. They differ in detail and share the essentials: the learner’s interest starts the exchange, the materials and places vary, and what is learned is useful there and then.'],
        check: { q: 'In naturalistic teaching, the reinforcer for saying “push” at the swing is:',
          opts: ['A token.', 'A sticker.', 'Being pushed on the swing.', 'A break from the swing.'],
          a: 2, why: 'The result follows naturally from what was asked for.' } },
      { h: 'Why use it',
        p: ['Skills taught at a table often stay at the table. Skills taught where they are needed, with real consequences, are more likely to show up again in ordinary life. Because the student is already interested, there is usually less problem behavior and less need for added rewards.',
            'It does not replace discrete-trial teaching. Some skills need many quick practice trials first. Most programs use both, and move skills from the table into daily routines.'],
        check: { q: 'A main reason for teaching in natural situations is that it:',
          opts: ['Promotes generalization to everyday life.', 'Needs no planning.', 'Uses no reinforcement.', 'Is always faster.'],
          a: 0, why: 'What is learned in the natural setting is already under the control of natural cues and consequences.' } },
      { h: 'Setting up the surroundings',
        p: ['You cannot follow a lead that never comes, so the room is arranged to invite one. Put favorite things in sight and out of reach, on a shelf or in a clear box with a tight lid. Give a little at a time: three crackers, not the packet. Offer a choice. Leave out a piece that is needed: the paper without the crayons. Pause in a familiar routine and wait: “Ready, set …”.',
            'These are invitations, not traps. If the student gets upset instead of communicating, make it easier, and tell your supervisor.'],
        check: { q: 'Which of these sets up a chance to communicate?',
          opts: ['Leaving all the toys loose on the floor.', 'Handing over the whole bag of snacks.', 'Doing every step of the routine for the student.', 'Putting the bubbles on a shelf where the student can see them and not reach them.'],
          a: 3, why: 'Wanting something that needs another person’s help is a reason to ask.' } },
      { h: 'Wait for the start',
        p: ['Then watch and wait. An initiation can be a word, and it can also be a reach, a look from the item to you, a hand pulling yours, or a sound. That is your opening.',
            'Waiting is the hard part. Adults fill silences with questions: “What do you want? Do you want the car? Say car.” Each question takes the lead back. Count to five in your head before you do anything.'],
        check: { q: 'A student looks at the juice on the counter, then at you. What has just happened?',
          opts: ['Nothing yet.', 'An initiation you can build on.', 'Problem behavior.', 'A prompt.'],
          a: 1, why: 'Looking from the item to a person is a request without words, and the opening for teaching.' } },
      { h: 'Ask for a little more',
        p: ['When the student has shown what they want, prompt a response one small step beyond what they do now. For a student who reaches, model the word: “Juice.” For one who says “juice”, model “More juice” or wait with an expectant look. The plan says which target and which prompt.',
            'Ask once or twice, not five times. If the better response does not come, model it and give the item anyway. The student must not learn that communicating leads to a quiz.'],
        check: { q: 'A student who uses single words says, “Ball,” looking at the ball in your hands. The plan’s target is two words. You:',
          opts: ['Give the ball at once, in silence.', 'Hold the ball until he says a full sentence.', 'Model “Throw ball,” wait a moment, and give the ball when he tries it, or after one more model.', 'Ask, “What color is the ball?”'],
          a: 2, why: 'One step beyond what he does now, with a model, and without making him wait long for the ball.' } },
      { h: 'Reinforce with what was asked for',
        p: ['Give what the student communicated about, at once, and say it back as you do: “Juice! Here is your juice.” The natural result is the reinforcer, so praise or tokens are usually not needed and can get in the way.',
            'Then go back to play. Take your turn, comment on what the student is doing, and let several minutes of ordinary fun pass before the next teaching moment. A good rule is more comments than questions.'],
        check: { q: 'After a successful request you should:',
          opts: ['Give the item at once and carry on playing.', 'Ask for the same request five more times.', 'Give a token instead of the item.', 'Move to the table for trials.'],
          a: 0, why: 'The item is the reinforcer, and play continues.' } },
      { h: 'Recording without spoiling it',
        p: ['Naturalistic teaching still has targets and data. A common sheet is a tally: each opportunity, and whether the response was independent, prompted or absent. A wrist counter or a small card in your pocket keeps your hands and eyes free.',
            'Write the totals as soon as the activity ends. If recording is pulling you out of the play, tell your supervisor: the measure can be simplified.'],
        check: { q: 'During play you saw 8 opportunities to request. The student asked alone 3 times, with a model 4 times, and not at all once. You record:',
          opts: ['8 requests.', '7 correct.', 'Nothing: it was play.', '3 independent, 4 prompted, 1 no response, of 8 opportunities.'],
          a: 3, why: 'The level of help is what shows progress over time.' } }
    ],
    examples: {
      ask: 'Which kind of teaching is this?',
      intro: 'Ten short scenes. Decide whether each is discrete-trial teaching or naturalistic teaching.',
      opts: ['Discrete-trial teaching', 'Naturalistic teaching'],
      items: [
        { s: 'At the table, the technician lays out three cards and says, “Touch the apple.” A correct touch earns a token.', a: 0, why: 'A set instruction, set materials and an added reinforcer.' },
        { s: 'At snack, Abe reaches for the crackers. The aide says, “Cracker,” Abe says, “Cracker,” and gets one.', a: 1, why: 'His reach started it, and the cracker is the natural result.' },
        { s: 'Twenty trials of “Clap hands” in ten minutes, each followed by praise and a sticker.', a: 0, why: 'Many quick trials with a set instruction.' },
        { s: 'During block play, Bel holds up a block. The adult says, “On top!” Bel says, “Top,” and the adult helps her place it.', a: 1, why: 'She led, and the result follows from the play.' },
        { s: 'The paints are out and the brushes are missing. Cal looks around and signs “brush”. He is handed one.', a: 1, why: 'The surroundings were arranged to invite a request.' },
        { s: '“What color?” with a red card, ten times in a row, with a token for each right answer.', a: 0, why: 'Repeated instructed trials.' },
        { s: 'At the door, the teacher pauses with her hand on the handle. Dov says, “Open,” and she opens it.', a: 1, why: 'A pause in a routine, and the door opening is the reinforcer.' },
        { s: 'The technician holds up flashcards one at a time and records plus or minus for each.', a: 0, why: 'Trial-by-trial instruction and scoring.' },
        { s: 'On the playground, Eve pulls the adult toward the slide. The adult says, “Slide?” Eve says, “Slide,” and they go.', a: 1, why: 'Her interest set the topic and the place.' },
        { s: 'Fen sorts 30 picture cards into two piles at the desk, with praise after each correct one.', a: 0, why: 'A structured task with added praise for each response.' }
      ]
    },
    practice: {
      title: 'Snack time',
      intro: 'You are with Gus, a simulated student, at snack. His plan: target is one-word requests, spoken or signed. Arrange for requests; wait 5 seconds; if none, model the word once; give the item for any attempt. No more than one model per opportunity.',
      steps: [
        { t: 'Setting up', see: 'You have a bowl of grapes, a cup, and a jug of juice.', opts: ['Pour a full cup and put the grapes in front of him.', 'Keep the jug and the bowl beside you, in sight, and give him an empty cup.', 'Hide everything in the cupboard.'], a: 1, why: 'He can see what he wants and needs you to get it. Hidden items give him nothing to ask about.' },
        { t: 'Minute 1', see: 'Gus looks at the jug, then holds out his cup toward you.', opts: ['Wait 5 seconds to see whether a word or sign comes.', 'Say, “What do you want? Juice? Say juice. Juice!”', 'Pour the juice at once.'], a: 0, why: 'He has started. The plan gives him 5 seconds before any model.' },
        { t: 'Minute 1', see: 'Five seconds pass. He keeps holding out the cup.', opts: ['Keep waiting until he speaks.', 'Model “Juice” once.', 'Take the cup away.'], a: 1, why: 'One model, as the plan says.' },
        { t: 'Minute 1', see: 'Gus says, “Ju.”', opts: ['“No, say it properly: juice.”', 'Model again and wait.', '“Juice!” and pour a little.'], a: 2, why: 'The plan reinforces any attempt. A little juice means there will be another opportunity soon.' },
        { t: 'Minute 3', see: 'His cup is empty. He signs “more” without looking at you.', opts: ['Pour: he asked.', 'Wait until he looks at you.', 'Tell him to use his words.'], a: 0, why: 'The target is a one-word request, spoken or signed, and he made one. Eye contact is not in this plan.' },
        { t: 'Minute 5', see: 'Gus is eating grapes happily. You have run four opportunities in five minutes.', opts: ['Hold the grapes back to get more requests.', 'Ask him to name the colors of the grapes.', 'Eat and chat alongside him for a while before the next opportunity.'], a: 2, why: 'Snack has to stay snack. Requests come from wanting, not from pressure.' },
        { t: 'Minute 8', see: 'You move the grapes out of reach. Gus cries and pushes his cup off the table.', opts: ['Give the grapes to stop the crying.', 'Follow his plan for problem behavior; when he is calm, make the next opportunity easier. Tell your supervisor.', 'End snack as a consequence.'], a: 1, why: 'The set-up asked too much just then. Giving the grapes for crying would teach crying; ending snack is not in the plan.' },
        { t: 'Afterwards', see: 'Six opportunities: 2 independent, 3 after a model, 1 none (the crying).', opts: ['Record “5 of 6”.', 'Record 2 independent, 3 prompted, 1 no response, and the crying when the grapes were moved.', 'Record nothing: it was only snack.'], a: 1, why: 'The split by level of help, and the incident, are what the supervisor needs.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Naturalistic teaching is led mainly by:', opts: ['A fixed list of trials.', 'The student’s interest in the moment.', 'The clock.', 'The data sheet.'], a: 1, why: 'The learner’s motivation starts each teaching moment.' },
      { q: 'The reinforcer in naturalistic teaching is usually:', opts: ['The natural result of the response.', 'A token.', 'A sweet unrelated to the activity.', 'Nothing.'], a: 0, why: 'Asking for the car gets the car.' },
      { q: 'Putting a favorite toy in a clear box the student cannot open is meant to:', opts: ['Punish the student.', 'Keep the toy clean.', 'Create a reason to ask for help.', 'End play.'], a: 2, why: 'It arranges the surroundings for a request.' },
      { q: 'After arranging the opportunity, the adult first:', opts: ['Asks, “What do you want?”', 'Models the word three times.', 'Gives the item.', 'Waits and watches for the student to start.'], a: 3, why: 'The lead has to come from the student.' },
      { q: 'An initiation can be:', opts: ['Only a spoken word.', 'A reach, a look, a gesture, a sound or a word.', 'Only a full sentence.', 'Only a sign.'], a: 1, why: 'Any behavior directed at getting something from another person.' },
      { q: 'When prompting a better response, you ask for:', opts: ['One small step beyond what the student does now.', 'A full sentence every time.', 'The same thing as last year.', 'Silence.'], a: 0, why: 'A small step keeps success likely.' },
      { q: 'If the better response does not come after the model, you:', opts: ['Withhold the item for the rest of the day.', 'Repeat the prompt until it does.', 'Give the item anyway and try again at the next opportunity.', 'End the activity.'], a: 2, why: 'Communicating must keep paying off.' },
      { q: 'A good balance in play is:', opts: ['All questions.', 'Only instructions.', 'Silence.', 'More comments than questions.'], a: 3, why: 'Comments keep you a play partner and leave the lead with the student.' },
      { q: 'Compared with table teaching, skills taught naturalistically are more likely to:', opts: ['Stay in one room.', 'Generalize to daily life.', 'Need tokens.', 'Be forgotten.'], a: 1, why: 'They were learned under natural cues and consequences.' },
      { q: 'Data in naturalistic teaching are usually:', opts: ['A tally of opportunities and responses by level of help.', 'Not collected.', 'Percent of intervals.', 'Collected by the student.'], a: 0, why: 'Independent, prompted, or no response.' },
      { q: 'A student becomes upset each time an item is placed out of reach. You:', opts: ['Keep doing it until he asks.', 'Stop all teaching for good.', 'Make the opportunity easier and tell your supervisor.', 'Give tokens for crying less.'], a: 2, why: 'The invitation has become too hard and needs adjusting.' },
      { q: 'Giving a small portion at snack is done so that:', opts: ['The student eats less.', 'Food is saved.', 'The meal ends sooner.', 'There are more chances to ask for more.'], a: 3, why: 'Each small portion is a new opportunity.' },
      { q: 'Discrete-trial and naturalistic teaching are:', opts: ['Rivals: a program uses only one.', 'Often used together.', 'The same thing.', 'Both outdated.'], a: 1, why: 'Skills are often built at the table and carried into routines.' },
      { q: 'During naturalistic teaching the plan’s targets:', opts: ['Still guide what you prompt and record.', 'Are ignored.', 'Are chosen by the technician on the spot.', 'Are kept secret.'], a: 0, why: 'It is planned teaching in a natural setting.' }
    ] },
    role: [
      { t: 'Five minutes of play with three opportunities', setup: 'The trainer plays a student with toys the trainee has been told the “student” likes. Target: one-word requests. The trainee arranges the opportunities.',
        steps: ['Arranges the surroundings before play: something in sight and out of reach, something in small portions.', 'Joins the play and comments more than asks.', 'Waits about 5 seconds after an initiation.', 'Gives one model at most.',
                'Gives the item at once for an attempt, saying the word back.', 'Lets play continue between opportunities.', 'Tallies independent, prompted and no response.'] },
      { t: 'When the invitation backfires', setup: 'The trainer plays a student who cries when a toy is put on the shelf.',
        steps: ['Does not hand the toy over for crying.', 'Follows the written response to problem behavior.', 'Makes the next opportunity easier.', 'Says what they would tell the supervisor.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'Why is waiting so hard for adults? What helps you wait?',
      'Think of one routine in your day with a student. Where could a pause create an opportunity?',
      'When does naturalistic teaching turn into a quiz, and how can you tell from the student?'
    ],
    read: [
      'Hart, B., & Risley, T. R. (1975). Incidental teaching of language in the preschool. Journal of Applied Behavior Analysis, 8(4), 411–420.',
      'Sundberg, M. L., & Partington, J. W. (1998). Teaching language to children with autism or other developmental disabilities. Behavior Analysts, Inc.',
      'Schreibman, L., Dawson, G., Stahmer, A. C., Landa, R., Rogers, S. J., McGee, G. G., Kasari, C., Ingersoll, B., Kaiser, A. P., Bruinsma, Y., McNerney, E., Wetherby, A., & Halladay, A. (2015). Naturalistic developmental behavioral interventions: Empirically validated treatments for autism spectrum disorder. Journal of Autism and Developmental Disorders, 45(8), 2411–2428.'
    ]
  },

  e5: {
    aim: [
      'Say what a task analysis is and why its steps stay in a fixed order.',
      'Run forward chaining, backward chaining and total-task chaining as written.',
      'Record each step by the level of help given.',
      'Handle an error in the middle of a chain.'
    ],
    lesson: [
      { h: 'Task analysis',
        p: ['Washing hands, packing a bag and making a sandwich are each a string of small actions. A task analysis writes the string down as steps, in order, each small enough to teach and clear enough to score: “turn on the cold tap”, “wet both hands”.',
            'Your supervisor writes it, by watching someone do the task, doing it themselves, and fitting it to the student: a student who struggles gets more and smaller steps. You follow the steps as written, in the same order every time, and so does everyone else who teaches the task.'],
        check: { q: 'A task analysis is:',
          opts: ['A test of how fast a task is done.', 'A list of reinforcers.', 'A complex skill written as an ordered list of small steps.', 'A summary of data.'],
          a: 2, why: 'It turns one big skill into teachable steps.' } },
      { h: 'Why it is called a chain',
        p: ['In a learned routine each step does two jobs. Finishing it is the signal to begin the next step, and it rewards the step just done. Wet hands are the cue for soap. That is why the order must not change: change the order and the cues are gone.',
            'The whole chain is held together by what happens at the end: clean hands, a packed bag, something to eat. Chaining is the set of methods for building that string step by step.'],
        check: { q: 'In a chain, completing one step:',
          opts: ['Ends the routine.', 'Signals the next step and reinforces the one just done.', 'Has no effect on the next step.', 'Must be followed by a token.'],
          a: 1, why: 'Each step’s result is the cue for the next.' } },
      { h: 'Forward chaining',
        p: ['In forward chaining you teach the first step first. The student does step 1, with prompts that are faded, and is reinforced. You then complete or guide the rest. When step 1 is mastered, the student does steps 1 and 2 before the reinforcer, then 1, 2 and 3, and so on to the end.',
            'It follows the natural order and lets the student start the routine alone from the first day. Its cost is that the natural result of the task comes late, after steps the adult did.'],
        check: { q: 'In forward chaining, which step is taught first?',
          opts: ['The first step.', 'The last step.', 'The hardest step.', 'All steps at once.'],
          a: 0, why: 'Teaching starts at the beginning of the chain and adds steps in order.' } },
      { h: 'Backward chaining',
        p: ['In backward chaining you do, or guide, every step but the last, and the student does the last step. The reinforcer is immediate and natural: the zip reaches the top, the sandwich is ready. When the last step is mastered, the student does the last two, then the last three, moving back toward the start.',
            'Every teaching trial ends with the student finishing the job, which is why it is often chosen for students who give up easily or for tasks with a satisfying end.'],
        check: { q: 'In backward chaining of a six-step task, on the first day the student:',
          opts: ['Does step 1 and the adult does the rest.', 'Does all six steps with help where needed.', 'Watches the adult do all six.', 'Does step 6 after the adult has done or guided steps 1 to 5.'],
          a: 3, why: 'The last step is taught first, so the student always finishes the task.' } },
      { h: 'Total-task chaining',
        p: ['In total-task chaining the student goes through every step on every trial. You give the least help needed at each step, and fade it step by step as the student learns.',
            'It suits students who can already do several of the steps or who can imitate well, and tasks that are not too long. Every step gets practice every time. Sessions take longer, and there are more places to make an error.',
            'Which method is used is your supervisor’s decision, and the plan will say.'],
        key: ['Forward: first step first.', 'Backward: last step first.', 'Total task: every step, every time, with help where needed.'],
        check: { q: 'A student can already do half the steps of a short routine without help. Which method does a plan most often choose?',
          opts: ['Backward chaining', 'Forward chaining', 'Total-task chaining', 'No teaching is needed'],
          a: 2, why: 'With many steps already in place, practicing the whole task with help at the weak steps is efficient.' } },
      { h: 'Running a session',
        p: ['Set out the materials in the same way each time. Give the instruction for the whole task once: “Wash your hands.” Do not name each step aloud unless the plan uses spoken prompts, or your voice becomes part of the chain.',
            'On the step being taught, prompt as the plan says and reinforce as it says. On the steps you complete, guide briskly and without fuss, so that the student experiences the whole routine in order.',
            'If the student makes an error or stalls, do not let the wrong action run on into the next step. Stop gently, go back to the start of that step, and prompt it through.'],
        check: { q: 'While washing hands, the student reaches for the towel before rinsing off the soap. You:',
          opts: ['Let it go: he will notice.', 'Interrupt gently, bring his hands back, and prompt the rinse.', 'Start the whole routine again from the tap.', 'End the session.'],
          a: 1, why: 'An error left to run becomes part of the chain. Going back to the step, not the whole routine, is the usual correction.' } },
      { h: 'Recording',
        p: ['The data sheet lists the steps. For each step, on each trial, you mark the level of help: independent, or the prompt used. The summary is usually the percentage of steps done independently, and the sheet also shows which steps are stuck.',
            'In a baseline or a probe, the plan may ask you to give no help at all. Some probes stop at the first step the student cannot do; others let you do that step yourself, out of the student’s sight, and continue so that every step is tested. Do whichever the plan names.'],
        check: { q: 'Of 8 steps, the student did 5 alone, 2 with a gesture and 1 with physical help. The independent score is:',
          opts: ['88%', '38%', '63%', '100%'],
          a: 2, why: '5 of 8 steps were independent: 62.5%, about 63%.' } }
    ],
    watch: [
      { k: 'chain_hw_forward', c: 1, look: 'Which step is the training step, how the rest is guided, and when the next step is added.' },
      { k: 'chain_hw_backward', c: 1, look: 'How the adult takes the student through the early steps, and what the student does alone at the end.' },
      { k: 'chain_hw_total', c: 1, look: 'How little help is given at each step, and how the help differs from step to step.' },
      { k: 'chain_forward', look: 'The same forward method on a different task.' },
      { k: 'chain_backward', look: 'The same backward method on a different task.' }
    ],
    examples: {
      ask: 'Which chaining method is this?',
      intro: 'Nine teaching sessions. Decide which method each one uses.',
      opts: ['Forward chaining', 'Backward chaining', 'Total-task chaining'],
      items: [
        { s: 'The adult puts on Ari’s shoe and tightens the laces. Ari pulls the last loop tight.', a: 1, why: 'The student does only the final step.' },
        { s: 'Bo is prompted through every step of making toast, with as little help as each step needs.', a: 2, why: 'All steps, every time.' },
        { s: 'Cam picks up her toothbrush alone and is praised. The adult guides the rest of brushing.', a: 0, why: 'The first step is the student’s; the adult finishes.' },
        { s: 'This week Dan does the last two steps of setting the table on his own; last week it was only the last one.', a: 1, why: 'Steps are being added from the end backward.' },
        { s: 'Eli now does steps 1, 2 and 3 of logging in before he is reinforced; the teacher completes the rest.', a: 0, why: 'Steps are added in order from the start.' },
        { s: 'On every trial Flo attempts each of the seven steps of washing hands, and the data sheet shows a prompt level for all seven.', a: 2, why: 'Every step is practiced and scored on each trial.' },
        { s: 'The adult builds a five-piece puzzle up to the last piece; Gil puts in the last piece and cheers.', a: 1, why: 'He completes the task with the final step.' },
        { s: 'Hana opens her locker alone. The aide then helps her take out books, close it and walk to class.', a: 0, why: 'The first step is trained, and the rest is helped.' },
        { s: 'Ike follows a picture list for packing his bag, doing each step himself, with a point from the teacher at two of them.', a: 2, why: 'The whole task, with help only where needed.' }
      ]
    },
    practice: {
      title: 'Teach a chain backward',
      intro: 'You are teaching Juno, a simulated student, to pack her bag at the end of the day, by backward chaining. Read the plan, then decide.',
      plan: ['Steps: 1 take the bag from the hook; 2 open the zip; 3 put in the folder; 4 put in the lunch box; 5 close the zip; 6 put the bag on her back.', 'Training step this week: step 6. Guide steps 1 to 5 hand over hand, briskly, without talking.', 'At step 6: wait 3 seconds; if needed, point to the straps. Praise when the bag is on.', 'Move to steps 5 and 6 after three sessions in a row with step 6 done alone.', 'Instruction, once: “Pack your bag.”'],
      steps: [
        { t: 'Start', see: 'It is home time. Juno is at her hook.', opts: ['Say, “Pack your bag,” once.', 'Say, “First get your bag, then open it, then …”', 'Wait for her to work out what to do.'], a: 0, why: 'One instruction for the whole task. Naming the steps would make your voice a link in the chain.' },
        { t: 'Steps 1 to 5', see: 'You are guiding her through the early steps.', opts: ['Let her try each one alone first.', 'Describe each step as you go.', 'Guide them hand over hand, quickly and quietly.'], a: 2, why: 'This week only step 6 is being taught. The rest is done with her so that she meets the steps in order.' },
        { t: 'Step 4', see: 'While you guide the lunch box in, Juno picks up the folder again and starts to take it out.', opts: ['Gently stop her hand and guide the folder back in before going on.', 'Let her: she is exploring.', 'Start again from the hook.'], a: 0, why: 'A wrong action is stopped at once and the step is set right, without restarting the whole chain.' },
        { t: 'Step 6', see: 'The bag is zipped and standing in front of her. She looks at you.', opts: ['Lift the bag onto her back.', 'Wait 3 seconds.', 'Say, “Put it on.”'], a: 1, why: 'The plan gives her 3 seconds before any help.' },
        { t: 'Step 6', see: 'Three seconds pass. She does not move.', opts: ['Point to the straps.', 'Put her arms through for her.', 'Repeat, “Pack your bag.”'], a: 0, why: 'The point is the prompt the plan names.' },
        { t: 'Step 6', see: 'Juno puts the bag on her back.', opts: ['Praise her now, and record step 6 as “gesture prompt”.', 'Praise her and record step 6 as independent.', 'Say nothing: she needed a prompt.'], a: 0, why: 'She is praised for finishing, and the data show the help she had.' },
        { t: 'Three sessions later', see: 'Juno has done step 6 alone in three sessions in a row.', opts: ['Start step 1 next: she is ready for more.', 'Tell your supervisor the criterion is met; the plan’s next training steps are 5 and 6.', 'Stop guiding steps 1 to 5.'], a: 1, why: 'The plan adds the step before the last. The supervisor confirms the move.' },
        { t: 'Next week', see: 'Step 5 (close the zip) is now a training step too. Juno closes it halfway and puts the bag on.', opts: ['Count it: nearly closed.', 'Take the bag off, bring her back to the zip, prompt it closed, then let her put the bag on.', 'Close it for her without comment and record it as independent.'], a: 1, why: 'The step is finished properly before the chain goes on, and it is recorded as prompted.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Who writes the task analysis?', opts: ['The technician, during the session.', 'The supervisor.', 'The student.', 'It is copied from another student’s plan.'], a: 1, why: 'It is fitted to the student and the task.' },
      { q: 'The steps of a chain are taught in a fixed order because:', opts: ['Each step’s completion is the cue for the next.', 'It looks tidy.', 'The funder requires it.', 'Students dislike change.'], a: 0, why: 'Change the order and the cues are lost.' },
      { q: 'In forward chaining, the adult:', opts: ['Does the first steps and the student the last.', 'Does nothing.', 'Completes or guides the steps after the training step.', 'Teaches all steps at once.'], a: 2, why: 'The student does the first steps; the adult finishes.' },
      { q: 'A main advantage of backward chaining is that:', opts: ['It needs no prompts.', 'It takes no time.', 'The student never makes errors.', 'Every trial ends with the student completing the task and meeting its natural result.'], a: 3, why: 'The natural reinforcer follows the student’s own step.' },
      { q: 'In total-task chaining the student:', opts: ['Does only the last step.', 'Attempts every step on every trial.', 'Watches a video only.', 'Does only the first step.'], a: 1, why: 'All steps, with help where needed.' },
      { q: 'The instruction for the whole chain is given:', opts: ['Once, at the start.', 'Before every step.', 'After the last step.', 'Never.'], a: 0, why: 'Step-by-step talk becomes part of the chain unless the plan intends spoken prompts.' },
      { q: 'An error in the middle of a chain is handled by:', opts: ['Letting it pass.', 'Ending the session.', 'Stopping gently, going back to that step and prompting it.', 'Starting a different task.'], a: 2, why: 'Errors left alone get chained in.' },
      { q: 'Chaining data are usually recorded:', opts: ['As one mark for the whole task.', 'As a duration.', 'At the end of the week.', 'Step by step, with the level of help.'], a: 3, why: 'The sheet shows which steps are stuck.' },
      { q: 'Of 10 steps, 7 were independent. The score is:', opts: ['7%', '70%', '30%', '17%'], a: 1, why: '7 ÷ 10.' },
      { q: 'A student gives up quickly on long tasks. Which method lets each trial end in success from the first day?', opts: ['Backward chaining', 'Forward chaining', 'No chaining', 'Extinction'], a: 0, why: 'The student finishes the task every time.' },
      { q: 'During a probe the plan says to give no help. The student stops at step 3. You:', opts: ['Prompt step 3.', 'Give hints.', 'Do what the plan says for a probe: stop there, or complete the step out of sight and continue.', 'Score every step as correct.'], a: 2, why: 'Probes measure what the student does alone, and plans differ on how they go on.' },
      { q: 'In backward chaining, the next step to become a training step is:', opts: ['The first step.', 'Chosen at random.', 'The hardest.', 'The step just before the ones already mastered at the end.'], a: 3, why: 'Teaching moves back toward the start.' },
      { q: 'Naming every step aloud while the student works can cause:', opts: ['Faster learning with no cost.', 'The student to depend on your voice to move from step to step.', 'Better hygiene.', 'Nothing.'], a: 1, why: 'A spoken cue becomes part of the chain and then has to be faded.' },
      { q: 'A student needs more and smaller steps than the task analysis has. You:', opts: ['Tell your supervisor what you see.', 'Rewrite the steps yourself.', 'Skip the hard steps.', 'Stop teaching the task.'], a: 0, why: 'The task analysis is fitted to the student by the supervisor.' },
      { q: 'On the steps the adult completes in forward or backward chaining, the adult should:', opts: ['Teach them too.', 'Explain them at length.', 'Guide briskly, without fuss.', 'Leave them undone.'], a: 2, why: 'The student meets the whole routine in order while effort goes to the training step.' }
    ] },
    role: [
      { t: 'Forward chaining, one training step', setup: 'The trainer plays a student. A six-step task analysis (for example, setting a place at a table) is given, with step 1 as the training step and a prompt procedure.',
        steps: ['Sets out materials the same way as the plan shows.', 'Gives one instruction for the whole task.', 'Prompts step 1 as written and reinforces it.', 'Guides the remaining steps briskly and quietly.',
                'Corrects an out-of-order action at the step where it happens.', 'Records step 1 by level of help.'] },
      { t: 'Total task with a data sheet', setup: 'The trainer plays a student who does some steps alone, needs a gesture at two and stalls at one. The trainee has a least-to-most prompt list.',
        steps: ['Lets the “student” try each step before helping.', 'Gives the least help that works at each step.', 'Does not name steps aloud unless the prompt list says to.', 'Records every step with its level of help.',
                'Works out the percentage of independent steps.', 'Names the step most in need of attention.'] }
    ],
    roleRule: 'Met when each run is completed with every step in place.',
    discuss: [
      'Think of a routine you teach. Which step do students get stuck on, and what does the task analysis say there?',
      'When have you seen an adult’s voice become part of a routine? How was it faded?',
      'Why might backward chaining suit a student who has learned to give up?'
    ],
    read: [
      'Spooner, F., & Spooner, D. (1984). A review of chaining techniques: Implications for future research and practice. Education and Training of the Mentally Retarded, 19(2), 114–124.',
      'Slocum, S. K., & Tiger, J. H. (2011). An assessment of the efficiency of and child preference for forward and backward chaining. Journal of Applied Behavior Analysis, 44(4), 793–805.',
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on chaining.'
    ]
  },

  e6: {
    aim: [
      'Tell response prompts from stimulus prompts, and name the common kinds of each.',
      'Run least-to-most prompting, most-to-least prompting and time delay as written.',
      'Fade prompts on the plan’s schedule so that the natural cue takes over.',
      'Notice prompt dependence, and record the level of help on every trial.'
    ],
    lesson: [
      { h: 'What a prompt is for',
        p: ['A prompt is extra help that gets the right response to happen in the presence of the cue that should, in the end, control it. The student who cannot yet read “exit” is shown where to go; the aim is that the word alone will do.',
            'So every prompt is temporary. It is put in to prevent errors and get the response reinforced, and it is taken out, step by step, until the natural cue works alone. That handing over is called transfer of stimulus control.'],
        check: { q: 'The purpose of a prompt is to:',
          opts: ['Do the task for the student.', 'Get the right response to occur so it can be reinforced, until the natural cue works alone.', 'Punish errors.', 'Keep the student busy.'],
          a: 1, why: 'A prompt is a bridge to independent responding, and it is meant to be removed.' } },
      { h: 'Response prompts',
        p: ['A response prompt is something you do. A verbal prompt is a spoken hint or instruction: “Turn the tap.” A gestural prompt is a point, a nod or a look. A model shows the action for the student to copy. A physical prompt guides the student’s body, partly (a touch at the elbow) or fully (hand over hand).',
            'They are usually ranked from least to most intrusive in about that order, though the order differs between students. Physical guidance is used with care, never against resistance, and only as the plan describes.'],
        check: { q: 'The aide points to the soap. This is a:',
          opts: ['Verbal prompt', 'Model prompt', 'Physical prompt', 'Gestural prompt'],
          a: 3, why: 'A point is a gesture.' } },
      { h: 'Stimulus prompts',
        p: ['A stimulus prompt changes the materials, not what you do. The correct card is placed nearer (a position prompt), made bigger or brighter, or marked: a colored dot on the right key, a dotted line to trace, a picture next to a word.',
            'Stimulus prompts are faded too. Stimulus fading removes the added feature bit by bit: the dot gets paler, the dotted line thinner, the correct card moves back into line with the others.'],
        check: { q: 'The letters of the student’s name are printed in thick dashes to trace, and the dashes are made lighter each week. This is:',
          opts: ['A stimulus prompt, with stimulus fading.', 'A gestural prompt.', 'Most-to-least physical prompting.', 'Not a prompt.'],
          a: 0, why: 'The materials carry the help, and the help is thinned gradually.' } },
      { h: 'Least-to-most prompting',
        p: ['In least-to-most prompting the student first gets a chance to respond alone. If no correct response comes within the set wait, you give the least intrusive prompt, wait again, then the next one up, until the response occurs.',
            'It never gives more help than is needed and shows what the student can do alone. Its cost is errors and waiting on the way up, so it suits skills the student partly has.'],
        check: { q: 'In least-to-most prompting, what happens first on each trial?',
          opts: ['A full physical prompt.', 'A model.', 'A chance to respond without help.', 'The reinforcer.'],
          a: 2, why: 'Help is added only after the student has had the chance to respond alone.' } },
      { h: 'Most-to-least prompting',
        p: ['In most-to-least prompting you start with the amount of help that makes the response certain, often full physical guidance, and reduce it over trials or sessions as the plan’s criteria are met: full physical, partial physical, model, gesture, none.',
            'Because the student rarely gets it wrong, it is one form of errorless teaching, and it suits new skills and students who are upset by errors. Its risk is staying at a high level of help too long.'],
        check: { q: 'Most-to-least prompting is often chosen for a brand-new skill because it:',
          opts: ['Is quicker to write down.', 'Keeps errors few while the skill is first learned.', 'Uses no prompts.', 'Tests what the student knows.'],
          a: 1, why: 'Certain success early, with the help thinned afterwards.' } },
      { h: 'Time delay',
        p: ['Time delay fades a prompt by time instead of by kind. At first the prompt comes together with the instruction, a zero-second delay, so the response is certain. Then a pause is put between the instruction and the prompt. In constant time delay the pause is fixed, for example 4 seconds. In progressive time delay it grows little by little.',
            'The student can beat the prompt by answering in the pause, and answers given before the prompt are the ones that show learning. Many plans reinforce those more generously than prompted answers.'],
        key: ['Least-to-most: try alone, then add help.', 'Most-to-least: start with sure help, then thin it.', 'Time delay: the same prompt, later and later.'],
        check: { q: 'In a constant 4-second time delay, the student answers correctly 2 seconds after the instruction. You:',
          opts: ['Give the prompt anyway.', 'Wait the full 4 seconds before reinforcing.', 'Ignore it: it came too early.', 'Reinforce it and score it as independent.'],
          a: 3, why: 'An answer before the prompt is the goal of the procedure.' } },
      { h: 'Fading, and prompt dependence',
        p: ['Prompts fade on the plan’s criteria: for example, “after two sessions at 90% with a gesture, move to no prompt”. Move down when the criterion is met, and move back up one level when errors return, as the plan says. Do not stay at a comfortable level because the session goes smoothly there.',
            'A student who waits for the prompt, looks at your hand, or answers only after help has become prompt dependent. It usually means the prompts were not faded, or were given too soon. Tell your supervisor; the plan can add a delay, change the prompt, or reinforce unprompted answers more.',
            'On every trial, record the level of help. Without it, a student who needs full guidance and one who needs none look the same on the graph.'],
        check: { q: 'Before every answer, a student looks at the technician’s hand and waits. This suggests:',
          opts: ['Prompt dependence.', 'Mastery.', 'Defiance.', 'A need for more prompts.'],
          a: 0, why: 'The prompt, not the natural cue, has come to control the response.' } }
    ],
    watch: [
      { k: 'prompt_ltm', c: 1, look: 'The wait before each prompt, and the order in which help is added.' },
      { k: 'prompt_mtl', c: 1, look: 'Where the help starts, and what has to happen before it is reduced.' },
      { k: 'prompt_delay', c: 1, look: 'The trials with the prompt at once, and what changes when the wait is added.' }
    ],
    examples: {
      ask: 'Which kind of prompt is this?',
      intro: 'Ten moments. Decide which kind of prompt is being used.',
      opts: ['Verbal', 'Gestural', 'Model', 'Physical', 'Stimulus (in the materials)'],
      items: [
        { s: 'The aide says, “Pick up the spoon.”', a: 0, why: 'A spoken instruction for the step.' },
        { s: 'The teacher claps and says, “Do this.”', a: 2, why: 'The action is shown for the student to copy.' },
        { s: 'The technician places her hand over Kai’s and helps him pull the zip up.', a: 3, why: 'Full physical guidance.' },
        { s: 'The correct picture is placed two inches closer to Lea than the other two.', a: 4, why: 'A position prompt in the materials.' },
        { s: 'The aide nods toward the coat hook.', a: 1, why: 'A nod is a gesture.' },
        { s: 'The “on” switch has a green sticker on it.', a: 4, why: 'An added feature of the material.' },
        { s: '“The first sound is ‘mmm’ …”', a: 0, why: 'A spoken hint.' },
        { s: 'A light touch on Mo’s elbow as he reaches for the tap.', a: 3, why: 'Partial physical help.' },
        { s: 'The technician taps the correct card with one finger.', a: 1, why: 'A point or tap is a gesture.' },
        { s: 'The teacher washes her own hands at the next sink while Nia watches and then copies.', a: 2, why: 'A demonstration to imitate.' }
      ]
    },
    practice: {
      title: 'Least-to-most, step by step',
      intro: 'You are teaching Otto, a simulated student, to wipe the table after snack. Read the plan, then decide.',
      plan: ['Instruction: “Wipe the table,” once.', 'Wait 5 seconds at each level before adding help.', 'Levels: 1 no help; 2 gesture (point to the cloth or the table); 3 model (wipe once yourself); 4 partial physical (touch at the wrist).', 'Reinforce a correct response at any level with praise; an independent one with praise and a token.', 'Record the level at which the correct response happened.'],
      steps: [
        { t: 'Trial 1', see: 'You say, “Wipe the table.” Otto looks at the cloth.', opts: ['Point to the cloth at once.', 'Wait 5 seconds.', 'Say it again.'], a: 1, why: 'Level 1 is no help, for the full wait.' },
        { t: 'Trial 1', see: 'Five seconds pass. Otto has not moved.', opts: ['Take his wrist.', 'Wipe the table yourself.', 'Point to the cloth, and wait 5 seconds.'], a: 2, why: 'The next level up is the gesture.' },
        { t: 'Trial 1', see: 'Otto picks up the cloth and wipes the table.', opts: ['Praise and a token.', 'Praise, and record “gesture”.', 'Say nothing: he needed help.'], a: 1, why: 'A prompted correct response earns praise. The token is kept for independent ones.' },
        { t: 'Trial 2', see: 'Next day. You give the instruction, and Otto starts wiping within 2 seconds.', opts: ['Praise and a token, and record “independent”.', 'Praise only, to be consistent with yesterday.', 'Point anyway, to make sure.'], a: 0, why: 'Independent responses get the larger reinforcer. A prompt nobody needs would teach him to wait for it.' },
        { t: 'Trial 3', see: 'Instruction given. Five seconds: nothing. You point; five seconds: nothing.', opts: ['Repeat the point.', 'Go straight to the wrist.', 'Model one wipe, and wait 5 seconds.'], a: 2, why: 'Levels are taken in order: after the gesture comes the model.' },
        { t: 'Trial 4', see: 'A colleague says, “Just do hand over hand from the start. It is quicker.”', opts: ['Do that: sessions are short.', 'Keep to the plan’s least-to-most order, and mention her idea to your supervisor if Otto is making many errors.', 'Stop prompting at all.'], a: 1, why: 'Starting with the most help is a different procedure. The choice belongs to the plan.' },
        { t: 'Week 2', see: 'In the last six trials Otto has waited without moving until you point, every time, then wiped at once.', opts: ['Keep pointing: it works.', 'Tell your supervisor: he may be waiting for the prompt.', 'Stop giving the token.'], a: 1, why: 'A steady wait for the same prompt is the picture of prompt dependence.' },
        { t: 'Week 2', see: 'How do you report the six trials?', opts: ['“6 of 6 correct.”', '“He is not trying.”', '“6 of 6 correct at the gesture level, none independent; he waited for the point each time.”'], a: 2, why: 'Correct without the level of help would hide exactly what the supervisor needs to see.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'A response prompt is:', opts: ['A change in the materials.', 'Something the teacher does to help the response occur.', 'A reinforcer.', 'A data code.'], a: 1, why: 'Verbal, gestural, model and physical prompts.' },
      { q: 'A stimulus prompt is:', opts: ['A change or addition to the materials.', 'A spoken hint.', 'Hand-over-hand help.', 'A demonstration.'], a: 0, why: 'Position, size, color, added marks.' },
      { q: 'Which is usually the most intrusive?', opts: ['A gesture.', 'A verbal hint.', 'Full physical guidance.', 'A model.'], a: 2, why: 'It involves moving the student’s body.' },
      { q: 'Least-to-most prompting begins each trial with:', opts: ['The most help.', 'A model.', 'A reinforcer.', 'A chance to respond without help.'], a: 3, why: 'Help is added only as needed.' },
      { q: 'Most-to-least prompting begins with:', opts: ['No help.', 'Enough help to make the response certain.', 'A test.', 'A break.'], a: 1, why: 'Then the help is reduced.' },
      { q: 'Errorless teaching aims to:', opts: ['Keep errors to a minimum while a skill is learned.', 'Punish every error.', 'Let the student learn from many mistakes.', 'Avoid reinforcement.'], a: 0, why: 'Prompts are arranged so the right response is the likely one.' },
      { q: 'In progressive time delay, the pause before the prompt:', opts: ['Stays at zero.', 'Is always 4 seconds.', 'Grows gradually.', 'Shrinks.'], a: 2, why: 'Constant delay stays fixed; progressive delay lengthens.' },
      { q: 'A zero-second delay means the prompt is given:', opts: ['Never.', 'After the reinforcer.', 'Five seconds after the instruction.', 'At the same time as the instruction.'], a: 3, why: 'The first trials make the response certain.' },
      { q: 'Transfer of stimulus control means that:', opts: ['The prompt becomes permanent.', 'The natural cue comes to control the response in place of the prompt.', 'The student controls the teacher.', 'The reinforcer changes.'], a: 1, why: 'That is the point of fading.' },
      { q: 'Stimulus fading is:', opts: ['Gradually removing an added feature of the materials.', 'Reducing physical help.', 'Waiting longer.', 'Dimming the lights.'], a: 0, why: 'The dot gets paler; the card moves back into line.' },
      { q: 'A sign of prompt dependence is that the student:', opts: ['Answers before the prompt.', 'Refuses all help.', 'Waits for the prompt before responding.', 'Works faster each day.'], a: 2, why: 'The prompt has become the cue.' },
      { q: 'When prompts are faded depends on:', opts: ['The technician’s mood.', 'The day of the week.', 'The student’s age.', 'The criteria written in the plan.'], a: 3, why: 'Fading follows data and written criteria.' },
      { q: 'Many plans give a larger reinforcer for:', opts: ['Prompted responses.', 'Independent responses.', 'Errors.', 'Slow responses.'], a: 1, why: 'Paying more for independence helps the prompt fade.' },
      { q: 'Why record the prompt level on each trial?', opts: ['So that progress toward independence can be seen.', 'To fill the sheet.', 'It is optional.', 'To compare students.'], a: 0, why: '“Correct” alone hides how much help was needed.' },
      { q: 'Physical prompts are used:', opts: ['Whenever it is quicker.', 'Against resistance if needed.', 'Only as the plan describes, and never against resistance.', 'Never.'], a: 2, why: 'They are the most intrusive and need the most care.' }
    ] },
    role: [
      { t: 'Least-to-most with four levels', setup: 'The trainer plays a student learning a simple action (for example, putting a cup on a shelf), responding at different levels across six trials, once before any prompt.',
        steps: ['Gives the instruction once.', 'Waits the set time at each level.', 'Adds help in the written order, one level at a time.', 'Gives the larger reinforcer for the independent response.',
                'Gives no prompt when none is needed.', 'Records the level for every trial.'] },
      { t: 'Constant time delay', setup: 'The trainer plays a student naming five pictures. Two trials at zero delay, then a 4-second delay. The “student” answers before the prompt on some trials, waits on others and makes one error.',
        steps: ['Gives the prompt together with the instruction on the zero-delay trials.', 'Waits the full 4 seconds on the delay trials, silently.', 'Reinforces answers given before the prompt and scores them independent.', 'Gives the prompt after 4 seconds and scores those prompted.',
                'Handles the error as the procedure says.', 'Reports independent and prompted separately.'] }
    ],
    roleRule: 'Met when each run is completed with every step in place.',
    discuss: [
      'Which prompt do you over-use? What would it take to hold it back for five seconds?',
      'Why might a student who is upset by mistakes do better with most-to-least prompting?',
      'How do you guide a student physically in a way that respects them?'
    ],
    read: [
      'Libby, M. E., Weiss, J. S., Bancroft, S., & Ahearn, W. H. (2008). A comparison of most-to-least and least-to-most prompting on the acquisition of solitary play skills. Behavior Analysis in Practice, 1(1), 37–43.',
      'Touchette, P. E., & Howard, J. S. (1984). Errorless learning: Reinforcement contingencies and stimulus control transfer in delayed prompting. Journal of Applied Behavior Analysis, 17(2), 175–188.',
      'MacDuff, G. S., Krantz, P. J., & McClannahan, L. E. (2001). Prompts and prompt-fading strategies for people with autism. In C. Maurice, G. Green, & R. M. Foxx (Eds.), Making a difference: Behavioral intervention for autism (pp. 37–50). PRO-ED.'
    ]
  }
});
