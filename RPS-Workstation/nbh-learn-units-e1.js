/* nbh-learn-units-e1.js (v26.01): written units of the Learning page, section E (Behavior-change interventions), units e1 to e3.
   The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  e1: {
    aim: [
      'Say what procedural integrity is and why outcomes depend on it.',
      'Tell an error of omission from an error of commission.',
      'Check your own session against the plan’s steps, and use feedback from an observation.',
      'Report what keeps you from running a plan as written, instead of adapting it quietly.'
    ],
    lesson: [
      { h: 'The plan on paper and the plan in the room',
        p: ['Procedural integrity, also called treatment integrity or fidelity, is how closely a plan is carried out as it was written. A plan is only as good as its delivery. The same procedure run at 95% of its steps and at 60% are, to the student, two different procedures.',
            'Studies in which steps were left out on purpose show what you would expect: skills are learned more slowly and problem behavior falls less, or not at all. Some errors do outright harm, such as giving the reinforcer after problem behavior some of the time.'],
        check: { q: 'Procedural integrity is:',
          opts: ['How well the student behaves.', 'How closely the plan is carried out as written.', 'How many staff are trained.', 'How often data are graphed.'],
          a: 1, why: 'It is about what the adults do, measured against the written procedure.' } },
      { h: 'Two kinds of error',
        p: ['An error of omission is leaving out something the plan says to do: no praise after a correct answer, a prompt not given, the timer not started, data not taken.',
            'An error of commission is doing something the plan does not say: an extra warning, a second repeat of the instruction, a comment during planned ignoring, a reinforcer for something the plan does not reinforce.',
            'Commission errors are often well meant, which makes them hard to notice in yourself. The extra kind word during a procedure that withholds attention can undo the procedure.'],
        key: ['Omission: a step left out.', 'Commission: something added that the plan does not say.'],
        check: { q: 'The plan says, “Give the instruction once.” The technician gives it, waits two seconds, and gives it again. This is:',
          opts: ['An omission error.', 'Good practice.', 'Correct implementation.', 'A commission error.'],
          a: 3, why: 'Something was added that the plan does not call for.' } },
      { h: 'Why it matters to everyone reading the graph',
        p: ['When progress stalls, the supervisor has to decide whether the procedure is wrong for the student or was never really delivered. Without integrity data they cannot tell, and may throw out a good plan or keep adjusting one that only needed to be run.',
            'It matters between adults too. A student who meets one set of rules with you and another with the afternoon aide is not on a plan. Consistency across people and days is part of the treatment.'],
        check: { q: 'A plan seems not to be working. What should be checked before the plan is changed?',
          opts: ['The student’s attitude.', 'Whether the plan has been carried out as written.', 'The color of the token board.', 'The length of the school day.'],
          a: 1, why: 'A plan that has not been delivered has not been tested.' } },
      { h: 'How it is measured',
        p: ['The plan is broken into its steps on a checklist. An observer, usually your supervisor, watches a session and marks each step done correctly, done incorrectly, or not done, each time there was a chance to do it. The score is the percentage done correctly.',
            'You can use the same checklist on yourself straight after a session. Self-checks are not as accurate as an observer, and they still catch drift early.',
            'Being observed is not an exam on your worth. It is the way the team finds out whether the plan can be run by a real person in a real room. Expect feedback on what you did well and on one or two steps to change, and expect to practice those steps.'],
        check: { q: 'On an integrity checklist, 18 of 20 opportunities were done correctly. The score is:',
          opts: ['18%', '90%', '80%', '2%'],
          a: 1, why: '18 ÷ 20 = 90%.' } },
      { h: 'When you cannot run it as written',
        p: ['Sometimes the plan cannot be followed: the materials are missing, the step takes longer than the timetable allows, the wording is unclear, the room is shared, or you believe a step is not right for the student.',
            'Do not adjust it quietly. A private version of the plan cannot be seen by anyone else, and the data it produces will be read as if they came from the written one. Tell your supervisor what the barrier is. Most plans get better when the people who run them say where they do not fit.',
            'Until the plan is changed, run it as written as far as you safely can, and note what you could not do.'],
        check: { q: 'You think the 10-second wait in a prompting procedure is too long for this student. You:',
          opts: ['Shorten it to 3 seconds: you know the student.', 'Skip the wait.', 'Keep to 10 seconds, and raise it with your supervisor with what you have seen.', 'Ask another technician what they do and copy it.'],
          a: 2, why: 'Your observation may be right, and the supervisor can change the plan for everyone. A private change helps no one read the data.' } }
    ],
    examples: {
      ask: 'What kind of implementation is this?',
      intro: 'A plan says: “After each correct answer: praise within 3 seconds and one token. After problem behavior: no comment; present the next trial.” Decide what each technician did.',
      opts: ['As written', 'Omission error', 'Commission error'],
      items: [
        { s: 'After a correct answer, the technician praises at once and gives a token.', a: 0, why: 'Both parts, in time.' },
        { s: 'After a correct answer, the technician says, “Good,” and gives no token.', a: 1, why: 'The token was left out.' },
        { s: 'After problem behavior, the technician says, “We don’t do that,” and presents the next trial.', a: 2, why: 'A comment was added.' },
        { s: 'After a correct answer, the technician finishes writing and praises 15 seconds later.', a: 1, why: 'Praise within 3 seconds did not happen. A late delivery misses the step as written.' },
        { s: 'After problem behavior, the technician presents the next trial without a word.', a: 0, why: 'Exactly as the plan says.' },
        { s: 'After a correct answer, the technician gives praise, a token and a bonus sticker “for effort”.', a: 2, why: 'The sticker is not in the plan.' },
        { s: 'The session ends with no data recorded for the last ten trials.', a: 1, why: 'Recording is a step, and it was left out.' },
        { s: 'After problem behavior, the technician takes away a token.', a: 2, why: 'Removing tokens is not in this plan.' }
      ]
    },
    practice: {
      title: 'Check your own session',
      intro: 'You have just run a 15-minute session with Hugo, a simulated student, and you go through the plan’s checklist afterwards.',
      planT: 'The checklist',
      plan: ['1. Materials and reinforcers in reach before starting.', '2. Timer set to the DRO interval (3 minutes).', '3. Token given within 5 seconds of each interval without the behavior.', '4. Timer reset, without comment, after each instance.', '5. Exchange at 4 tokens, at once.', '6. Data recorded for every interval.'],
      steps: [
        { t: 'Step 3', see: 'Of 4 intervals earned, you gave the token on time in 3. Once you were writing and gave it about 20 seconds late.', opts: ['Score 4 of 4: he got all his tokens.', 'Score 3 of 4.', 'Score 0 of 4.'], a: 1, why: 'The step is “within 5 seconds”. Honest scoring is the only kind that shows where to improve.' },
        { t: 'Step 4', see: 'After one instance you reset the timer and said, “Oh, Hugo.”', opts: ['Correct: the timer was reset.', 'An omission error.', 'A commission error on this step.'], a: 2, why: 'The reset was right; the comment was added. The step says “without comment”.' },
        { t: 'Step 6', see: 'Two intervals have no entry. You remember roughly what happened.', opts: ['Fill them in now.', 'Leave them blank, mark them as not recorded, and score the step 3 of 5.', 'Score the step as fully done.'], a: 1, why: 'Entries from memory are not data, and the checklist should show the gap.' },
        { t: 'Overall', see: 'You count 17 of 20 opportunities correct.', opts: ['Tell no one: 85% is fine.', 'Note the score and the two weak steps, and mention them to your supervisor.', 'Change the checklist so the steps are easier.'], a: 1, why: 'Self-checks are for catching drift early and for asking for help with the right steps.' },
        { t: 'Next week', see: 'Your supervisor observes and tells you: “Tokens were on time today. You are still commenting after resets. Let’s practice that.”', opts: ['Explain why the comments are kind.', 'Agree, practice the reset with her, and watch for it next session.', 'Say nothing and carry on as before.'], a: 1, why: 'Feedback is acted on. Practice with the supervisor is how a step changes.' },
        { t: 'A barrier', see: 'The exchange at 4 tokens needs the bubbles, which another class borrows every Thursday.', opts: ['On Thursdays, skip the exchange.', 'On Thursdays, promise the bubbles for Friday.', 'Tell your supervisor about Thursdays so the plan or the timetable can be changed.'], a: 2, why: 'A barrier you report can be fixed. One you work around stays hidden.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Another term for procedural integrity is:', opts: ['Interobserver agreement.', 'Treatment fidelity.', 'Social validity.', 'Maintenance.'], a: 1, why: 'Fidelity, treatment integrity and procedural integrity mean the same thing.' },
      { q: 'Leaving out a step the plan requires is an error of:', opts: ['Omission', 'Commission', 'Measurement', 'Judgment'], a: 0, why: 'Something was omitted.' },
      { q: 'Adding a reprimand that the plan does not include is an error of:', opts: ['Omission', 'Recording', 'Commission', 'Sampling'], a: 2, why: 'Something was added.' },
      { q: 'Low integrity makes outcome data:', opts: ['More trustworthy.', 'Unaffected.', 'Easier to graph.', 'Hard to interpret, because the plan was not really in force.'], a: 3, why: 'Nobody can tell whether the procedure itself works.' },
      { q: 'Integrity is usually scored as:', opts: ['The percentage of steps or opportunities done correctly.', 'The number of sessions run.', 'The student’s percent correct.', 'Hours worked.'], a: 0, why: 'Correct ÷ opportunities.' },
      { q: '14 of 16 steps done correctly is about:', opts: ['75%', '88%', '14%', '96%'], a: 1, why: '14 ÷ 16 = 0.875.' },
      { q: 'A self-check after a session is useful because it:', opts: ['Replaces observation by the supervisor.', 'Is always accurate.', 'Catches drift early.', 'Raises the score.'], a: 2, why: 'It is a quick, imperfect early warning.' },
      { q: 'You cannot carry out a step because of the timetable. You:', opts: ['Drop the step.', 'Do it your own way.', 'Tell the family.', 'Tell your supervisor what the barrier is.'], a: 3, why: 'The plan or the conditions can then be changed for everyone.' },
      { q: 'After feedback from an observation, the technician should:', opts: ['Defend each choice.', 'Practice the steps named and apply the change.', 'Wait for the next observation.', 'Ask for a different observer.'], a: 1, why: 'Acting on feedback is part of the role.' },
      { q: 'Why does consistency across staff matter?', opts: ['A student who meets different rules with different adults is not really on one plan.', 'It makes scheduling easier.', 'Funders ask for it.', 'It does not.'], a: 0, why: 'The plan is whatever the student actually experiences.' },
      { q: 'A kind remark during planned ignoring is:', opts: ['Harmless.', 'An omission.', 'A commission error that may weaken the procedure.', 'Required.'], a: 2, why: 'It delivers the attention the procedure is withholding.' },
      { q: 'Who usually conducts integrity observations?', opts: ['The student.', 'The parent.', 'A peer of the student.', 'The supervisor or someone they assign.'], a: 3, why: 'It is part of supervision.' }
    ] },
    role: [
      { t: 'Run it, then score yourself', setup: 'The trainer gives a six-step procedure with a checklist and plays the student. Afterwards the trainee scores their own run, then the trainer shows their score.',
        steps: ['Runs the procedure from the written steps.', 'Scores each step honestly on the checklist straight afterwards.', 'Names any omission and commission errors made.', 'Compares with the trainer’s score without arguing.',
                'Re-runs one weak step correctly after feedback.'] }
    ],
    roleRule: 'Met when the self-score is within one step of the trainer’s and the weak step is then run correctly.',
    discuss: [
      'Which commission error are you most likely to make, and what sets it off?',
      'How do you like to receive feedback, and what makes it hard to hear?',
      'Think of a plan step that does not fit the room it is run in. Who knows about it?'
    ],
    read: [
      'DiGennaro Reed, F. D., Reed, D. D., Baez, C. N., & Maguire, H. (2011). A parametric analysis of errors of commission during discrete-trial training. Journal of Applied Behavior Analysis, 44(3), 611–615.',
      'St. Peter Pipkin, C., Vollmer, T. R., & Sloman, K. N. (2010). Effects of treatment integrity failures during differential reinforcement of alternative behavior: A translational model. Journal of Applied Behavior Analysis, 43(1), 47–70.',
      'Fryling, M. J., Wallace, M. D., & Yassine, J. N. (2012). Impact of treatment integrity on intervention effectiveness. Journal of Applied Behavior Analysis, 45(2), 449–453.'
    ]
  },

  e2: {
    aim: [
      'Tell unconditioned, conditioned and generalized conditioned reinforcers apart.',
      'Establish a new conditioned reinforcer by pairing.',
      'Run a token economy as written: earning, exchange, and the three schedules.',
      'Run a group reward system, and say how the three kinds of group contingency differ.'
    ],
    lesson: [
      { h: 'Reinforcers that are learned',
        p: ['An unconditioned reinforcer needs no learning: food when hungry, water when thirsty, warmth, relief from pain. A conditioned reinforcer became one through experience, by being paired again and again with something that already was a reinforcer. Praise, a thumbs-up, a point and a grade are learned in this way.',
            'A generalized conditioned reinforcer has been paired with many different reinforcers. Money is the plain example, and tokens are the one you will use. Because a token can be traded for many things, it keeps its value even when the student has had enough of any one of them.'],
        key: ['Unconditioned: no learning needed.', 'Conditioned: learned by pairing.', 'Generalized: trades for many things.'],
        check: { q: 'Why does a token usually keep working when a snack has stopped working?',
          opts: ['Tokens are prettier.', 'A token can be exchanged for many different things, so being full of one of them matters less.', 'Tokens are unconditioned reinforcers.', 'Students do not notice tokens.'],
          a: 1, why: 'That is what “generalized” buys.' } },
      { h: 'Making something a reinforcer',
        p: ['Praise does not work for every student at first. To establish it, or a token, or any neutral thing, you pair it with a reinforcer that already works: say the praise and at once give the item, many times, so that the praise comes to signal the item.',
            'With tokens the pairing is the exchange. At the start, one token is handed over and traded immediately for the backup reinforcer. Only when the student takes tokens eagerly and hands them over to trade is the number needed raised.',
            'A conditioned reinforcer that stops being paired loses its strength. Tokens that are never exchanged, or praise that never goes with anything else, fade.'],
        check: { q: 'You are introducing tokens to a student who has never used them. What is the first step?',
          opts: ['Give one token and exchange it at once for the backup reinforcer.', 'Explain the rules and require ten tokens.', 'Give tokens all day and exchange on Friday.', 'Show the token board and wait.'],
          a: 0, why: 'Immediate exchange is the pairing that gives the token its value.' } },
      { h: 'The parts of a token economy',
        p: ['A token economy has target behaviors that earn tokens, the tokens themselves, backup reinforcers the tokens buy, and rules for earning and exchanging.',
            'The tokens should be safe, hard to copy, and easy for you to give in a second. The backups should be things the student wants now, found by a preference assessment, and offered with a choice. The rules should be so clear that the student could explain them.'],
        check: { q: 'Which is a backup reinforcer?',
          opts: ['The star on the token board.', 'The behavior that earns a star.', 'Five minutes with the trampoline, bought with five stars.', 'The rule sheet.'],
          a: 2, why: 'A backup is what tokens are exchanged for.' } },
      { h: 'Three schedules in one system',
        p: ['Three schedules run at once. The token-production schedule says how much behavior earns one token: every correct answer, every third, each two minutes of work. The exchange-production schedule says when trading is allowed: as soon as the board is full, or at set times. The token-exchange schedule is the price list: how many tokens each backup costs.',
            'Teaching starts rich on all three: a token for every response, exchange after very few tokens, low prices. They are thinned one at a time and in small steps, usually the exchange first, so that the student still earns tokens often while learning to wait longer for the trade. Each change is your supervisor’s decision.'],
        check: { q: '“One token for every two math problems” describes which schedule?',
          opts: ['Token exchange (the price).', 'Exchange production (when to trade).', 'Token production (how tokens are earned).', 'None of them.'],
          a: 2, why: 'It says how much behavior produces a token.' } },
      { h: 'Running it',
        p: ['Give the token at once, where the student can see it arrive, and name the behavior: “You raised your hand. Here is your token.” Make the exchange as soon as the schedule says, with the choice of backups the plan offers.',
            'Do not use tokens as threats (“Do you want to lose one?”) and do not hand them out to end problem behavior. Take a token away only if the plan includes response cost and says exactly for what and how many, and never take a student below zero.',
            'Keep the board and the tokens in your control. Record tokens earned and exchanged. Report what you see: the student stops caring about the board, saves tokens and never spends, or always chooses the same backup.'],
        check: { q: 'A student is refusing work. A colleague says, “Tell him he will lose two tokens.” The plan has no response cost. You:',
          opts: ['Say it, but do not take the tokens.', 'Take the two tokens.', 'Give him a token to get started.', 'Follow what the plan says for refusal, and take no tokens.'],
          a: 3, why: 'Threats and fines that the plan does not contain change the system and can make the tokens something to fear.' } },
      { h: 'Group contingencies',
        p: ['A group contingency applies one rule to several students. In an independent group contingency, the rule is the same for all and each student earns for their own behavior: anyone who finishes gets five minutes of free time. In a dependent one, the group’s reward depends on one student or a few: if Sam finishes, the whole table gets free time. In an interdependent one, the group must meet the rule together: free time if the whole class has all its work in.',
            'Interdependent systems bring classmates onto the same side and need few adults. Their risk is pressure on the student who costs the group its reward. Watch for that and report it.'],
        check: { q: '“If every member of the team has homework in, the team earns a point.” This is:',
          opts: ['Interdependent', 'Independent', 'Dependent', 'Not a group contingency'],
          a: 0, why: 'The reward depends on the whole group meeting the rule.' } },
      { h: 'The Good Behavior Game',
        p: ['The Good Behavior Game is an interdependent group contingency. The class is split into teams and a few rules are stated. In the best-known form a team gets a mark each time a member breaks a rule, and every team at or under a set number of marks wins a privilege, so all teams can win.',
            'Your part is to mark calmly and at once, name the rule and not the student more than is needed, keep the tally where everyone can see it, and deliver the privilege as promised. If one student is being blamed by their team, or seems to enjoy sinking it, tell your supervisor: the plan has ways to handle both.'],
        check: { q: 'In the Good Behavior Game, a member of Team B calls out. What do you do?',
          opts: ['Lecture the student in front of the class.', 'Ignore it this once.', 'Put a mark on Team B’s tally and briefly name the rule.', 'Remove the student from the team at once.'],
          a: 2, why: 'A calm, immediate mark with the rule named is the procedure.' } }
    ],
    watch: [
      { k: 'token_build', c: 1, look: 'How the tokens are given their value: the exchange comes first, and then the tokens are tested.' },
      { k: 'token_schedules', c: 1, look: 'The three schedules, and which one is thinned first.' },
      { k: 'token_running', c: 1, look: 'How the exchange is run, what a closed economy is, and how response cost is used when a plan has it.' },
      { k: 'gbg', c: 1, look: 'How the marks are given, what is said, and how more than one team can win.' }
    ],
    examples: {
      ask: 'What kind of reinforcer is this?',
      intro: 'Nine reinforcers. Decide which kind each is.',
      opts: ['Unconditioned', 'Conditioned', 'Generalized conditioned'],
      items: [
        { s: 'A drink of water after running in the heat.', a: 0, why: 'It needs no learning.' },
        { s: 'A sticker that has always been followed by a favorite song.', a: 1, why: 'It gained its value by being paired with one reinforcer.' },
        { s: 'Money.', a: 2, why: 'It can be traded for almost anything.' },
        { s: 'A warm blanket when cold.', a: 0, why: 'Warmth needs no learning.' },
        { s: 'Poker chips that can be exchanged for any of twelve items in the class shop.', a: 2, why: 'Tokens with many backups.' },
        { s: 'The words “Well done,” for a student whose teacher has always said them while handing over a favorite item.', a: 1, why: 'Praise learned through pairing.' },
        { s: 'Food when hungry.', a: 0, why: 'A biological reinforcer.' },
        { s: 'Points on a chart that buy computer time, a walk, a snack or a game.', a: 2, why: 'Exchangeable for many things.' },
        { s: 'The sound of a clicker that has been followed each time by a treat.', a: 1, why: 'A neutral sound paired with one reinforcer.' }
      ]
    },
    practice: {
      title: 'Run a token board',
      intro: 'You work with Iris, a simulated student. Read her plan, then decide.',
      plan: ['One star for each completed task card, given at once with “You finished your card.”', 'Five stars: Iris chooses from the menu (bubbles, 3 minutes of music, a walk to the fountain), right away.', 'No stars are taken away.', 'If Iris refuses a card: wait 30 seconds, then offer it again once. Record it.'],
      steps: [
        { t: 'Card 1', see: 'Iris finishes her first card.', opts: ['Say “Good job” and give the star at the end of the page.', 'Put a star on the board at once and say, “You finished your card.”', 'Give two stars to start her off well.'], a: 1, why: 'One star, immediately, with the words that name what earned it.' },
        { t: 'Card 3', see: 'Iris finishes a card very neatly.', opts: ['Give one star.', 'Give a bonus star for neatness.', 'Give no star, to raise the standard.'], a: 0, why: 'The plan pays one star for a completed card. Bonuses change the schedule.' },
        { t: 'Card 4', see: 'Iris pushes the card away.', opts: ['Say, “Do you want to lose a star?”', 'Take a star off the board.', 'Wait 30 seconds, offer the card again once, and record the refusal.'], a: 2, why: 'The plan says what to do, and it takes no stars away.' },
        { t: 'Card 5', see: 'The fifth star goes on the board. There are four cards left.', opts: ['Finish the last four cards first.', 'Show the menu now and let Iris choose.', 'Choose the bubbles for her: she always likes them.'], a: 1, why: 'The exchange is “right away”, and the choice is hers.' },
        { t: 'The exchange', see: 'Iris chooses music. The speaker is in another room.', opts: ['Fetch it while she waits, and tell your supervisor the menu needs its items in the room.', 'Tell her to choose something else.', 'Promise music tomorrow.'], a: 0, why: 'She earned her choice. The delay is a fault in the set-up, and reporting it fixes it for next time.' },
        { t: 'Next round', see: 'After the music, Iris peels a star off the sheet herself and puts it on the board.', opts: ['Let it stand: she is motivated.', 'Take the star off calmly, keep the stars in your reach, and carry on.', 'End the token system for the day.'], a: 1, why: 'Stars are earned, and the supply stays with you.' },
        { t: 'Later', see: 'For three days Iris has earned five stars quickly and then pushed every menu item away.', opts: ['Raise the price to ten stars.', 'Stop the exchange.', 'Tell your supervisor: the backups may have lost their value.'], a: 2, why: 'Tokens are worth what they buy. A new preference assessment is the supervisor’s call.' },
        { t: 'A change', see: 'Your supervisor updates the plan: exchange now happens at set times, 10:00 and 11:30, with whatever stars Iris has (5 stars per item).', opts: ['Keep exchanging at five stars anyway.', 'Follow the new exchange times, and keep giving a star for each card.', 'Give stars only at 10:00 and 11:30.'], a: 1, why: 'The exchange schedule was thinned; earning stars has not changed.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'An unconditioned reinforcer:', opts: ['Must be taught.', 'Works without any learning history.', 'Is always a token.', 'Is the same as praise.'], a: 1, why: 'Food, water and warmth are examples.' },
      { q: 'A conditioned reinforcer gets its value from:', opts: ['Being paired with existing reinforcers.', 'Its price.', 'Its color.', 'The student’s age.'], a: 0, why: 'Pairing is the mechanism.' },
      { q: 'A generalized conditioned reinforcer:', opts: ['Works for every student.', 'Is unlearned.', 'Has been paired with many different reinforcers.', 'Cannot be exchanged.'], a: 2, why: 'Tokens and money.' },
      { q: 'To establish praise as a reinforcer you:', opts: ['Say it more loudly.', 'Explain to the student that praise is good.', 'Use it alone for a month.', 'Pair it repeatedly with something that already reinforces.'], a: 3, why: 'Pairing gives it value.' },
      { q: 'Tokens that are never exchanged will:', opts: ['Gain value.', 'Lose their value.', 'Become unconditioned.', 'Stay the same.'], a: 1, why: 'The pairing has stopped.' },
      { q: 'The token-exchange schedule is:', opts: ['The price of each backup reinforcer.', 'How tokens are earned.', 'When trading is allowed.', 'The color of the tokens.'], a: 0, why: 'How many tokens each backup costs.' },
      { q: 'When a token economy is first taught:', opts: ['Tokens are rare and prices are high.', 'Exchange happens weekly.', 'Tokens are earned easily and exchanged almost at once.', 'Tokens are removed often.'], a: 2, why: 'Rich schedules first, thinned later.' },
      { q: 'Response cost in a token economy means:', opts: ['The price of a backup.', 'The work needed for a token.', 'The time between exchanges.', 'Taking tokens away after a named behavior, when the plan includes it.'], a: 3, why: 'It is a punishment procedure and must be written in the plan.' },
      { q: 'A token should be given:', opts: ['At the end of the session.', 'Immediately, with the behavior named.', 'When the student asks.', 'Only when the board is nearly full.'], a: 1, why: 'Immediacy and a clear link.' },
      { q: 'In a dependent group contingency, the group’s reward depends on:', opts: ['One student’s or a few students’ behavior.', 'Every student’s behavior.', 'Each student separately.', 'The teacher’s mood.'], a: 0, why: 'One or a few carry the group.' },
      { q: 'In an independent group contingency:', opts: ['The whole class must succeed together.', 'One student earns for all.', 'The same rule applies to all, and each student earns for their own behavior.', 'Nobody earns.'], a: 2, why: 'Same rule, individual earning.' },
      { q: 'The Good Behavior Game is which kind?', opts: ['Independent', 'Dependent', 'Not a group contingency', 'Interdependent'], a: 3, why: 'Teams win or lose together.' },
      { q: 'A risk of interdependent group contingencies is:', opts: ['Too many tokens.', 'Pressure from peers on a student who costs the group its reward.', 'That they need many adults.', 'That they never work.'], a: 1, why: 'Watch for it and report it.' },
      { q: 'Which of these may you change on your own?', opts: ['None of them: prices, schedules and backups are the supervisor’s to change.', 'The price list.', 'The number of tokens per response.', 'The backup menu.'], a: 0, why: 'You report; the supervisor adjusts.' },
      { q: 'A student saves tokens and never spends them. You:', opts: ['Force an exchange.', 'Stop giving tokens.', 'Record it and tell your supervisor.', 'Lower the prices yourself.'], a: 2, why: 'It may mean the backups, the prices or the exchange times need a look.' }
    ] },
    role: [
      { t: 'Introduce tokens, then build to five', setup: 'The trainer plays a student who has never used tokens. A written plan gives the steps: exchange after one token five times, then after two, then run a board of five.',
        steps: ['Has tokens, board and backups in reach.', 'Gives one token and exchanges at once, each of the first five times.', 'Names the behavior with each token.', 'Raises the number only as the plan says.',
                'Offers the choice of backups at each exchange.', 'Takes no token away and makes no threat.', 'Records tokens earned and exchanges made.'] },
      { t: 'The Good Behavior Game, five minutes', setup: 'The trainer and a helper (or two imagined teams) play two teams. Three rules are posted. One “student” breaks a rule twice and a teammate complains about them.',
        steps: ['States the rules and the winning mark before starting.', 'Marks each rule break at once, on the right team.', 'Names the rule calmly, without a lecture.', 'Keeps the tally where everyone can see it.',
                'Announces the result and gives the privilege as promised.', 'Says what they would report about the complaining teammate.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'Where have you seen tokens used as threats? What happened to how the student treated the board?',
      'Why thin the exchange before thinning how tokens are earned?',
      'What would you watch for in a class game to tell that one student is carrying the blame?'
    ],
    read: [
      'Hackenberg, T. D. (2009). Token reinforcement: A review and analysis. Journal of the Experimental Analysis of Behavior, 91(2), 257–286.',
      'Ivy, J. W., Meindl, J. N., Overley, E., & Robson, K. M. (2017). Token economy: A systematic review of procedural descriptions. Behavior Modification, 41(5), 708–737.',
      'Barrish, H. H., Saunders, M., & Wolf, M. M. (1969). Good behavior game: Effects of individual contingencies for group consequences on disruptive behavior in a classroom. Journal of Applied Behavior Analysis, 2(2), 119–124.',
      'Litow, L., & Pumroy, D. K. (1975). A brief review of classroom group-oriented contingencies. Journal of Applied Behavior Analysis, 8(3), 341–347.'
    ]
  },

  e3: {
    aim: [
      'Name the parts of a discrete trial and run one cleanly.',
      'Give the instruction once, wait, and deliver the consequence the plan names.',
      'Correct errors as the plan says, without scolding and without giving the answer away beforehand.',
      'Record every trial and keep the pace brisk.'
    ],
    lesson: [
      { h: 'What a discrete trial is',
        p: ['Discrete-trial teaching breaks a skill into single teaching units, each with a clear start and end. A trial has up to five parts: the instruction, a prompt if one is needed, the student’s response, the consequence, and a short pause before the next trial.',
            'Many trials are run in a short time, so the student gets many chances to practice and many reinforcers. It suits skills that have a clear right answer: matching, naming, following instructions, early reading and number skills.'],
        key: ['Instruction', 'Prompt, if needed', 'Response', 'Consequence', 'Pause between trials'],
        check: { q: 'What makes a trial “discrete”?',
          opts: ['It is done in private.', 'It has a clear beginning and a clear end.', 'It is very short.', 'It uses pictures.'],
          a: 1, why: 'Each trial is a separate unit, from the instruction to the consequence and the pause.' } },
      { h: 'Before the instruction',
        p: ['Have the student’s attention: looking toward you or the materials, hands still. Have the materials set out as the plan says, and the reinforcer ready in your hand.',
            'Set out the materials before you speak, and move the position of the right answer from trial to trial in an unpredictable order. A student who learns “it is always the one on the left” has learned nothing about the pictures.'],
        check: { q: 'Why is the position of the correct card changed from trial to trial?',
          opts: ['To keep the technician awake.', 'To make the task harder for its own sake.', 'So the student learns the card, not its place.', 'It should stay the same.'],
          a: 2, why: 'Otherwise position, not the picture, comes to control the answer.' } },
      { h: 'The instruction',
        p: ['The instruction is the signal that a particular answer will now be reinforced. In technical terms it is the discriminative stimulus. Give it once, clearly, in the words the plan gives: “Touch the dog.”',
            'Do not repeat it, add the student’s name five times, or pile on extra words. Each repeat teaches the student that the first one can be ignored. Some plans vary the wording on purpose, to build flexibility; then vary it as the plan lists.'],
        check: { q: 'You say, “Touch red.” The student does nothing for two seconds. You:',
          opts: ['Say it again, louder.', 'Wait for the response time the plan gives, then do what the plan says for no response.', 'Say, “Come on, touch red, you know red.”', 'Touch red yourself and say “Good.”'],
          a: 1, why: 'One instruction, then the set wait. What follows no response is written in the plan.' } },
      { h: 'The prompt',
        p: ['A prompt is help given with or just after the instruction so that the right answer happens: pointing, modeling, guiding a hand. The plan says which prompt to use and when. A prompted correct answer is recorded as prompted, not as independent.',
            'Watch for prompts you do not mean to give: a glance at the right card, a card placed slightly forward, a hopeful rise in your voice, a hand that hovers. Students find these faster than they learn the task.'],
        check: { q: 'Without noticing, a technician always looks at the correct picture just after giving the instruction. The likely result is that the student:',
          opts: ['Learns the pictures faster.', 'Stops looking at the technician.', 'Is unaffected.', 'Learns to follow the technician’s eyes instead of learning the pictures.'],
          a: 3, why: 'An unintended prompt becomes the thing the student responds to.' } },
      { h: 'The response and the wait',
        p: ['After the instruction, give the student the time the plan sets to begin a response, often 3 to 5 seconds. Three things can happen: a correct answer, an incorrect one, or none.',
            'Decide by the plan’s definition of correct. If the student touches the wrong card and then slides to the right one, most plans count the first touch. Score what happened, not what you hoped.'],
        check: { q: 'The student touches the cat, then quickly moves to the dog, which was the right answer. The plan counts the first response. You score it:',
          opts: ['Correct', 'Incorrect', 'Prompted', 'Not at all'],
          a: 1, why: 'The first response was the cat. Counting self-corrections as correct would reward guessing.' } },
      { h: 'The consequence',
        p: ['A correct answer is followed at once by the reinforcer the plan names, with brief praise that says what was right: “Yes, that is the dog.” New skills are usually reinforced every time.',
            'An incorrect answer or no answer is followed by the plan’s error correction. A common one: without comment, show or prompt the right answer, have the student give it, then present the trial again so the student can answer alone, sometimes after an easy task in between. Keep your face and voice neutral. No “no”, no sigh, no lecture, unless the plan gives you words to say.',
            'Then pause for a second or two, clear or reset the materials, and begin the next trial.'],
        check: { q: 'The student answers wrongly. The plan’s error correction is: “Model the answer, have the student copy it, re-present the trial.” What do you say first?',
          opts: ['“No, that’s wrong.”', '“Try again.”', 'Nothing about the error: you model the right answer.', '“You knew this yesterday.”'],
          a: 2, why: 'The correction is the teaching. Comment on the error adds attention to it and is not in the plan.' } },
      { h: 'Pace and mix',
        p: ['Keep trials moving. Long gaps invite the student to drift, and behavior problems grow in the gaps. A pause of one to three seconds between trials is typical.',
            'Most plans mix easy, mastered tasks among the new ones, so that the student keeps succeeding and earning. Some start a new item in a block on its own and then mix it in with others in random order. Follow the order the plan sets, and mix by a list or by shuffling, not by your own pattern, which students also learn.'],
        check: { q: 'Why are mastered tasks mixed in with new ones?',
          opts: ['To fill time.', 'To keep success and reinforcement frequent while the new material is learned.', 'Because new tasks are unimportant.', 'To avoid recording data.'],
          a: 1, why: 'Frequent success keeps the student working and lowers problem behavior.' } },
      { h: 'Recording',
        p: ['Record each trial as it ends, using the plan’s codes: usually correct and independent, prompted (with the prompt level), incorrect, or no response. A sheet marked only at the end of a run is mostly memory.',
            'The session’s score is usually the percentage of trials answered correctly without a prompt. Report it with the number of trials, and tell your supervisor when a mastery criterion is met or when a target has stalled for the number of sessions the plan names.'],
        check: { q: 'Of 10 trials: 6 correct without a prompt, 3 correct with a prompt, 1 incorrect. The independent score is:',
          opts: ['90%', '30%', '10%', '60%'],
          a: 3, why: 'Six independent correct answers out of ten trials.' } }
    ],
    examples: {
      ask: 'Which part of the trial is in capitals?',
      intro: 'Ten moments from discrete trials. Decide which part of the trial the words in CAPITALS are.',
      opts: ['Instruction', 'Prompt', 'Response', 'Consequence', 'Pause between trials'],
      items: [
        { s: 'THE TECHNICIAN SAYS, “CLAP HANDS.” Jo claps. “Great clapping!”', a: 0, why: 'The signal that begins the trial.' },
        { s: '“Touch the cup.” THE TECHNICIAN POINTS TO THE CUP. Kay touches it.', a: 1, why: 'Help given so that the right answer happens.' },
        { s: '“What is it?” LEX SAYS, “BALL.” “Yes, a ball!” and a token.', a: 2, why: 'What the student does.' },
        { s: '“Match.” Mia puts the sock on the sock. THE TECHNICIAN SAYS, “THAT’S MATCHING!” AND GIVES A TOKEN.', a: 3, why: 'What follows the response.' },
        { s: 'After the token, THE TECHNICIAN CLEARS THE CARDS, WAITS TWO SECONDS AND SETS OUT THE NEXT THREE.', a: 4, why: 'The interval before the next trial.' },
        { s: '“Stand up.” THE TECHNICIAN GENTLY LIFTS AT NED’S ELBOW. Ned stands.', a: 1, why: 'A physical prompt.' },
        { s: '“Give me blue.” Ora hands over red. THE TECHNICIAN SHOWS BLUE, HAS ORA HAND IT OVER, THEN PRESENTS THE TRIAL AGAIN.', a: 3, why: 'An error correction is the consequence for an incorrect response.' },
        { s: 'THE TECHNICIAN HOLDS UP A PICTURE AND ASKS, “WHO IS IT?” Pat says, “Mom.”', a: 0, why: 'The instruction, with its material.' },
        { s: '“Touch your nose.” QUIN TOUCHES HIS EAR.', a: 2, why: 'An incorrect response is still the response.' },
        { s: '“Say ‘cat’.” Rae says, “Cat.” “Nice saying cat!” THE TECHNICIAN MARKS THE SHEET AND LOOKS BACK UP AFTER A MOMENT.', a: 4, why: 'Recording happens in the pause between trials.' }
      ]
    },
    practice: {
      title: 'Run eight trials',
      intro: 'You are teaching Sol, a simulated student, to touch a named picture from three. Read the plan, then decide.',
      plan: ['Instruction: “Touch the (name),” once. Wait up to 5 seconds.', 'Correct: “Yes, the (name)!” and one token, within 2 seconds.', 'Incorrect or no response: say nothing; point to the correct picture; when Sol touches it say “That is the (name)”; then present the trial again. Score the first response.', 'Change the position of the correct picture on every trial. Record each trial.', 'New target: dog. Mastered: ball, cup. Mix about one mastered trial for every two new ones.'],
      steps: [
        { t: 'Trial 1', see: 'The three pictures are laid out. Sol is looking at the window.', opts: ['Give the instruction: he will turn round.', 'Wait until he is looking at you or the pictures, then give the instruction.', 'Say, “Sol. Sol! Look! Touch the dog.”'], a: 1, why: 'An instruction given without attention is likely to be missed, and calling his name over and over is extra talk.' },
        { t: 'Trial 1', see: 'You say, “Touch the dog.” Sol touches the dog.', opts: ['“Yes, the dog!” and a token at once.', 'Nod and move on.', '“Good boy, you are so clever, I knew you could.”'], a: 0, why: 'The plan’s words and the token, within 2 seconds.' },
        { t: 'Trial 2', see: 'You say, “Touch the dog.” Sol touches the cup.', opts: ['“No, that’s the cup.”', 'Say nothing, point to the dog, and when he touches it say, “That is the dog.” Then present the trial again.', 'Move his hand to the dog and give a token.'], a: 1, why: 'The plan’s error correction, with no comment on the error. A token for a corrected answer is not in the plan.' },
        { t: 'Trial 2', see: 'How do you score trial 2?', opts: ['Correct: he touched the dog in the end.', 'Incorrect: his first response was the cup.', 'Leave it blank.'], a: 1, why: 'The first response is scored. The corrected touch was prompted.' },
        { t: 'Trial 3', see: 'You are about to present “dog” again. The dog has been in the middle for the last two trials.', opts: ['Leave it in the middle: he is getting it.', 'Move the dog to a different position before the instruction.', 'Tap the dog as you set it down.'], a: 1, why: 'Position changes every trial, and a tap would be a prompt.' },
        { t: 'Trial 4', see: 'Sol has had two “dog” trials in a row.', opts: ['Keep drilling “dog” until he gets five in a row.', 'Present a mastered one: “Touch the ball.”', 'End the session on a success.'], a: 1, why: 'The plan mixes about one mastered trial for every two new ones.' },
        { t: 'Trial 6', see: 'You say, “Touch the dog.” Five seconds pass. Sol does nothing.', opts: ['Say it again.', 'Wait another ten seconds.', 'Treat it as the plan says for no response: point to the dog, then present the trial again. Score “no response”.'], a: 2, why: 'One instruction, the set wait, then the same correction as for an error.' },
        { t: 'After trial 8', see: 'Your sheet shows, for “dog”: 4 correct, 1 incorrect, 1 no response.', opts: ['Report “dog”: 4 of 6 independent correct, about 67%.', 'Report 100%: he got each one right after the correction.', 'Report that he has mastered “dog”.'], a: 0, why: 'First responses only, with the number of trials. Mastery is judged against the plan’s criterion, over more than one session.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Which is the usual order of a discrete trial?', opts: ['Response, instruction, consequence.', 'Instruction, response, consequence, pause.', 'Consequence, instruction, response.', 'Prompt, consequence, instruction.'], a: 1, why: 'The instruction comes first and the pause closes the trial.' },
      { q: 'The instruction in a trial is also called the:', opts: ['Discriminative stimulus.', 'Reinforcer.', 'Intertrial interval.', 'Error correction.'], a: 0, why: 'It signals that a particular response will be reinforced.' },
      { q: 'The instruction is given:', opts: ['Until the student responds.', 'Twice, to be sure.', 'Once, clearly.', 'In a whisper.'], a: 2, why: 'Repeats teach the student to wait for the second one.' },
      { q: 'An unintended prompt is:', opts: ['A prompt written in the plan.', 'A planned gesture.', 'A reinforcer.', 'Help the technician gives without meaning to, such as a glance at the answer.'], a: 3, why: 'Students learn to follow it instead of the task.' },
      { q: 'A correct answer given after a prompt is recorded as:', opts: ['Independent correct.', 'Prompted.', 'Incorrect.', 'Not recorded.'], a: 1, why: 'The level of help is part of the data.' },
      { q: 'After a correct, independent answer to a new target, you usually:', opts: ['Reinforce at once.', 'Wait to see if it happens again.', 'Say nothing.', 'Correct the student.'], a: 0, why: 'New skills are typically reinforced every time.' },
      { q: 'During error correction your manner is:', opts: ['Stern.', 'Disappointed.', 'Neutral.', 'Excited.'], a: 2, why: 'The correction teaches; emotion adds attention to the error.' },
      { q: 'The pause between trials is usually:', opts: ['A minute or more.', 'Unimportant.', 'As long as the student likes.', 'Short: a second or a few.'], a: 3, why: 'A brisk pace keeps the student engaged.' },
      { q: 'Mixing mastered tasks among new ones is done to:', opts: ['Make data collection harder.', 'Keep success frequent.', 'Slow the session.', 'Avoid the new tasks.'], a: 1, why: 'It maintains skills and keeps reinforcement coming.' },
      { q: 'The student always picks the card on the right. Before blaming the student, check whether:', opts: ['The right answer has been placed on the right too often.', 'The student is tired.', 'The cards are too small.', 'The room is cold.'], a: 0, why: 'A position habit usually comes from how the cards were laid out.' },
      { q: 'A trial is scored:', opts: ['At the end of the session.', 'Only if correct.', 'As it ends.', 'By the student.'], a: 2, why: 'Trial-by-trial recording is the accurate kind.' },
      { q: 'The session score in discrete-trial teaching is usually:', opts: ['The number of tokens.', 'The length of the session.', 'The number of prompts.', 'The percentage of trials correct without a prompt.'], a: 3, why: 'Independent correct ÷ trials.' },
      { q: 'A student self-corrects after a wrong first touch. Unless the plan says otherwise, you score:', opts: ['Correct.', 'The first response: incorrect.', 'Both.', 'Nothing.'], a: 1, why: 'Scoring self-corrections as correct rewards guessing.' },
      { q: 'Before giving the instruction you make sure of:', opts: ['The student’s attention and that materials and reinforcer are ready.', 'Silence in the whole building.', 'The student’s promise to try.', 'Nothing.'], a: 0, why: 'Attention and readiness prevent wasted trials.' },
      { q: 'The plan’s wording for the instruction is “Touch the dog.” You may:', opts: ['Use any wording you like.', 'Add encouragement before it each time.', 'Use the plan’s wording, unless the plan lists variations.', 'Repeat it twice.'], a: 2, why: 'Wording is varied only when the plan says so.' }
    ] },
    role: [
      { t: 'Ten clean trials', setup: 'The trainer plays a student for ten trials of picking a named item from three, giving mostly correct answers. The trainee has a written procedure, three items, tokens and a data sheet.',
        steps: ['Has attention before each instruction.', 'Gives each instruction once, in the written words.', 'Changes the position of the correct item every trial.', 'Reinforces correct answers within 2 seconds, naming what was right.',
                'Gives no unintended prompt (eyes, hand, placement, voice).', 'Pauses briefly and resets between trials.', 'Scores each trial as it ends.'] },
      { t: 'Errors and silence', setup: 'The trainer plays a student who answers wrongly three times, self-corrects once and does not respond twice.',
        steps: ['Waits the full response time without repeating the instruction.', 'Runs the written error correction after each error and each non-response.', 'Says nothing about the error.', 'Re-presents the trial after the correction.',
                'Scores the first response each time.', 'Mixes in a mastered trial as the procedure says.', 'Reports the independent score with the number of trials.'] }
    ],
    roleRule: 'Met when each run is completed with every step in place.',
    discuss: [
      'Which unintended prompt do you think you give? How could a colleague help you find out?',
      'What is hard about saying nothing after an error?',
      'When does discrete-trial teaching fit a skill badly? What would you expect to use instead?'
    ],
    read: [
      'Smith, T. (2001). Discrete trial training in the treatment of autism. Focus on Autism and Other Developmental Disabilities, 16(2), 86–92.',
      'Lovaas, O. I. (1987). Behavioral treatment and normal educational and intellectual functioning in young autistic children. Journal of Consulting and Clinical Psychology, 55(1), 3–9.',
      'Sarokoff, R. A., & Sturmey, P. (2004). The effects of behavioral skills training on staff implementation of discrete-trial teaching. Journal of Applied Behavior Analysis, 37(4), 535–538.'
    ]
  }
});
