/* nbh-learn-units-c2.js (v26.01): written units of the Learning page, section C (c5 to c7) and the first unit of section D
   (Assisting with behavior assessments: d1). The shape of a unit is described in nbh-learn-units.js. The people in every
   example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  c5: {
    aim: [
      'Say what a permanent product is and when it can stand in for watching the behavior.',
      'Collect and label products so they can be scored later.',
      'Know what a product cannot tell you.'
    ],
    lesson: [
      { h: 'Measure what the behavior leaves behind',
        p: ['Some behavior leaves a lasting result: a finished worksheet, a made bed, a stack of sorted cards, a torn book, a mark on the skin. Permanent-product recording measures that result instead of watching the behavior as it happens.',
            'You count or score the product: problems completed, words written, items put away, pages torn. Photographs and saved work are products too.'],
        check: { q: 'Which of these is measured as a permanent product?',
          opts: ['How long a student cried.', 'How many times a student called out.', 'How many math problems are finished on the page.', 'How quickly a student lined up.'],
          a: 2, why: 'The finished problems are still there after the behavior is over.' } },
      { h: 'Why it is useful',
        p: ['Nobody has to watch. You can teach while the work gets done and score it afterwards. The product can be checked again, and a second person can score the same product, which makes agreement checks easy.',
            'For this to work, the product must come only from the behavior you care about, and each instance must leave a product. A clean desk measures tidying only if nobody else tidied it.'],
        check: { q: 'What is the main practical advantage of permanent-product recording?',
          opts: ['It explains why the behavior happened.', 'The observer does not have to be present while the behavior occurs.', 'It works for every behavior.', 'It needs no definition.'],
          a: 1, why: 'The result waits to be measured.' } },
      { h: 'What it cannot tell you',
        p: ['A product does not show who made it, how, or with how much help. A completed worksheet may have been done alone, with prompts, or by a classmate. So note the conditions: alone or helped, how long was given, who was there.',
            'It also misses behavior that leaves nothing behind, such as shouting. And products get lost, tidied away or thrown out. Collect them at once, label them with the date, the student’s code and the task, and store them where the workplace’s privacy rules say.'],
        check: { q: 'You collect a fully completed worksheet from a student’s desk. Before scoring it as independent work, what do you need to know?',
          opts: ['Whether the student likes the subject.', 'The student’s reading level.', 'Nothing: the worksheet speaks for itself.', 'Whether anyone helped, and how.'],
          a: 3, why: 'The product looks the same whether or not help was given.' } }
    ],
    examples: {
      ask: 'Can this be measured as a permanent product?',
      intro: 'Six things a team wants to measure. Decide whether a permanent product would do.',
      opts: ['Yes, by its product', 'No, it has to be observed'],
      items: [
        { s: 'The number of envelopes stuffed in a work session.', a: 0, why: 'The stuffed envelopes can be counted afterwards.' },
        { s: 'How often a student interrupts the teacher.', a: 1, why: 'An interruption leaves nothing behind.' },
        { s: 'Whether the dishwasher was loaded correctly.', a: 0, why: 'The loaded rack can be checked against a list.' },
        { s: 'How long a student takes to answer a greeting.', a: 1, why: 'A latency has to be timed as it happens.' },
        { s: 'The number of spelling words written correctly on a test.', a: 0, why: 'The written test remains.' },
        { s: 'Pages torn out of library books during free time, when only this student uses the reading corner.', a: 0, why: 'The torn pages remain, and the condition makes it likely they are this student’s.' }
      ]
    },
    practice: {
      title: 'Collect and score products',
      intro: 'You are measuring independent work for Oli, a simulated student, by the worksheets he completes during a 20-minute period.',
      steps: [
        { t: 'End of the period', see: 'Oli’s worksheet is on his desk. The class is packing up.', opts: ['Collect it now and write the date and task on it.', 'Leave it: you can find it tomorrow.', 'Ask Oli how many he did.'], a: 0, why: 'Products disappear. Collected and labeled at once, it can be scored at any time.' },
        { t: 'Scoring', see: '14 of 20 problems are attempted; 11 are correct.', opts: ['Record “most done”.', 'Record 14 attempted, 11 correct, of 20.', 'Record 11.'], a: 1, why: 'Attempted and correct are different things, and the supervisor may want both.' },
        { t: 'A doubt', see: 'The aide mentions she “got him started” on the first three.', opts: ['Score all 14 as independent.', 'Throw the sheet away.', 'Note that the first three were helped, and score them as the plan says for prompted work.'], a: 2, why: 'The product alone hides the help. The note keeps the record true.' },
        { t: 'The next day', see: 'The worksheet is complete, in handwriting that is not Oli’s.', opts: ['Score it: the product is complete.', 'Do not score it as his work, note what you found, and tell your supervisor.', 'Compare with other students’ sheets and confront them.'], a: 1, why: 'A product must come from the behavior being measured. Finding out what happened is not yours to pursue alone.' }
      ]
    },
    quiz: { pass: 80, draw: 6, items: [
      { q: 'Permanent-product recording measures:', opts: ['Behavior as it happens.', 'The lasting result of behavior.', 'Feelings about work.', 'Time between responses.'], a: 1, why: 'What the behavior leaves behind.' },
      { q: 'A good candidate for permanent-product recording is:', opts: ['Words spelled correctly on a page.', 'Eye contact.', 'Shouting.', 'Waiting.'], a: 0, why: 'The page remains.' },
      { q: 'A limit of permanent products is that they do not show:', opts: ['How many were completed.', 'Whether the work is correct.', 'The date.', 'Who did the work or how much help was given.'], a: 3, why: 'The conditions have to be noted separately.' },
      { q: 'Interobserver agreement is easy with products because:', opts: ['Nobody checks them.', 'They are always correct.', 'Two people can score the same product at different times.', 'They need no definition.'], a: 2, why: 'The product stays the same for both scorers.' },
      { q: 'As soon as you collect a product you:', opts: ['Label it with the date and the task.', 'Give it back.', 'Show it to other families.', 'Score it from memory later.'], a: 0, why: 'Unlabeled products cannot be matched to a session.' },
      { q: 'A clean table is a poor measure of a student’s tidying when:', opts: ['The table is large.', 'Someone else may have tidied it.', 'The student is fast.', 'It is after lunch.'], a: 1, why: 'The product must come only from the behavior.' },
      { q: 'A photograph of a completed puzzle is:', opts: ['Not data.', 'A duration measure.', 'A permanent product.', 'A latency.'], a: 2, why: 'A lasting record of the result.' },
      { q: 'Products that hold a student’s name are stored:', opts: ['In your car.', 'On the classroom wall.', 'At home.', 'Where the workplace’s privacy rules say.'], a: 3, why: 'They are part of the student’s confidential record.' }
    ] },
    role: [
      { t: 'Score a stack of work', setup: 'The trainer hands over five pieces of “student” work and a scoring rule, and answers as the classroom aide if asked.',
        steps: ['Labels each piece with the date and the task.', 'Scores each by the rule.', 'Asks whether help was given before scoring as independent.', 'Records attempted and correct separately.', 'Says where the pieces will be stored.'] }
    ],
    roleRule: 'Met when all five pieces are scored correctly with every step in place.',
    discuss: [
      'Which of the behaviors you measure now leave a product you could use instead?',
      'What could go wrong if you relied on a product without knowing how it was made?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on measuring behavior, the section on measurement by permanent product.'
    ]
  },

  c6: {
    aim: [
      'Turn a session’s raw numbers into a rate, a mean duration or a percentage.',
      'Choose the summary that matches the measure.',
      'Report a summary with what it was measured over.'
    ],
    lesson: [
      { h: 'Why summarize',
        p: ['Raw tallies cannot be compared when sessions differ in length or in the number of chances given. Twelve correct answers out of 12 is not the same as 12 out of 40. A summary puts each session on the same footing so that sessions can share a graph.',
            'The plan says which summary to report. Your part is to work it out correctly and to write down what it was based on.'],
        check: { q: 'Why is “8 call-outs” on Monday hard to compare with “8 call-outs” on Tuesday?',
          opts: ['They are the same, so there is nothing to compare.', 'The sessions may have been different lengths.', 'Call-outs cannot be counted.', 'Tuesday is later in the week.'],
          a: 1, why: 'Without the time, a count cannot be compared. A rate can.' } },
      { h: 'Rate',
        p: ['Rate is the count divided by the time: 8 call-outs in 20 minutes is 0.4 per minute, or 24 per hour. Choose the unit that gives a readable number and keep to it from session to session.',
            'To change per minute into per hour, multiply by 60. Use the time the student was actually observed: if 10 minutes of the hour were spent out of the room, the observation was 50 minutes.'],
        check: { q: 'A student raised her hand 6 times in a 30-minute lesson. What is the rate per hour?',
          opts: ['3 per hour', '6 per hour', '12 per hour', '180 per hour'],
          a: 2, why: 'Six in half an hour is twelve in an hour.' } },
      { h: 'Mean duration',
        p: ['Mean duration is the total time divided by the number of instances. Three tantrums of 2, 4 and 9 minutes total 15 minutes; the mean is 5 minutes.',
            'A mean can hide a spread. Report the number of instances with it, and the longest when the plan asks: “3 tantrums, mean 5 minutes, longest 9”. Latencies are summarized in the same way.'],
        check: { q: 'Four episodes lasted 1, 2, 2 and 7 minutes. What is the mean duration?',
          opts: ['2 minutes', '3 minutes', '4 minutes', '12 minutes'],
          a: 1, why: 'The total is 12 minutes; divided by 4 episodes, 3 minutes.' } },
      { h: 'Percentage',
        p: ['A percentage is the part divided by the whole, times 100. For teaching trials it is correct answers divided by trials: 14 of 20 is 70%. For interval data it is marked intervals divided by all intervals. For “percentage of opportunities” it is the times the student did it divided by the times there was a chance to.',
            'Two cautions. Count only independent correct answers as correct, unless the plan says to count prompted ones, and say which you did. And be careful with small numbers: 1 of 2 is 50%, but it is not much evidence. Always give the numbers behind a percentage.'],
        key: ['Rate = count ÷ time.', 'Mean duration = total time ÷ number of instances.', 'Percentage = part ÷ whole × 100.'],
        check: { q: 'In 25 trials a student answered 15 correctly on her own and 5 correctly with a prompt. The plan counts independent answers only. What do you report?',
          opts: ['80%', '60% independent (15 of 25); 5 more with a prompt', '20 correct', '15%'],
          a: 1, why: 'Fifteen of twenty-five is 60%. The prompted ones are reported apart.' } }
    ],
    examples: {
      ask: 'Which summary fits?',
      intro: 'Eight sets of raw data. Decide which summary should be reported for each.',
      opts: ['Rate', 'Mean duration', 'Percentage'],
      items: [
        { s: '18 words read correctly in a 1-minute timing.', a: 0, why: 'A count over time.' },
        { s: 'Out of 10 chances to greet a peer, she greeted 7 times.', a: 2, why: 'Part of a whole: percentage of opportunities.' },
        { s: 'Three episodes of crying: 4, 6 and 11 minutes.', a: 1, why: 'Times to be averaged.' },
        { s: 'Marked in 9 of 30 intervals.', a: 2, why: 'Interval data are a percentage of intervals.' },
        { s: '24 instances of hand flapping in a 40-minute observation.', a: 0, why: 'A count that needs its time.' },
        { s: '16 of 20 sight words correct.', a: 2, why: 'Correct out of total trials.' },
        { s: 'Latencies to begin work of 20, 45 and 25 seconds.', a: 1, why: 'Latencies are averaged like durations.' },
        { s: '5 hits between 9:00 and 11:30.', a: 0, why: 'A count over two and a half hours.' }
      ]
    },
    practice: {
      title: 'Summarize a session',
      intro: 'Work out each summary from the raw numbers on the data sheet for Pia, a simulated student.',
      ask: 'What do you report?',
      word: 'Calculation',
      steps: [
        { t: 'Rate', see: '9 call-outs in a 45-minute class.', opts: ['9 per hour', '12 per hour', '5 per hour'], a: 1, why: 'Nine in three quarters of an hour: 9 ÷ 0.75 = 12 per hour.' },
        { t: 'Percentage correct', see: '17 independent correct answers in 20 trials.', opts: ['17%', '85%', '80%'], a: 1, why: '17 ÷ 20 = 0.85.' },
        { t: 'Mean duration', see: 'Out of the room three times: 2 minutes, 3 minutes and 10 minutes.', opts: ['5 minutes', '3 minutes', '15 minutes'], a: 0, why: 'Fifteen minutes in total, divided by three.' },
        { t: 'Percentage of intervals', see: 'On task in 21 of 28 intervals.', opts: ['21%', '49%', '75%'], a: 2, why: '21 ÷ 28 = 0.75.' },
        { t: 'Observed time', see: '6 instances between 10:00 and 11:00, but Pia was at the nurse from 10:20 to 10:40.', opts: ['6 per hour', '9 per hour', '4 per hour'], a: 1, why: 'She was observed for 40 minutes: 6 ÷ 40 × 60 = 9 per hour.' },
        { t: 'Small numbers', see: 'Only 2 trials were run today because of an assembly. Pia got 1 right.', opts: ['Report 50% and nothing else.', 'Report 1 of 2 trials, with the reason so few were run.', 'Report nothing.'], a: 1, why: 'The percentage alone would mislead. The numbers and the reason let the reader weigh it.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Rate is worked out as:', opts: ['Time ÷ count', 'Count ÷ time', 'Count × time', 'Count ÷ trials'], a: 1, why: 'For example, 10 in 5 minutes is 2 per minute.' },
      { q: '15 instances in 30 minutes is a rate of:', opts: ['0.5 per minute', '2 per minute', '15 per minute', '45 per hour'], a: 0, why: '15 ÷ 30 = 0.5 per minute, or 30 per hour.' },
      { q: 'Mean duration is:', opts: ['The longest instance.', 'The count ÷ the time.', 'The total time ÷ the number of instances.', 'The total time.'], a: 2, why: 'An average length.' },
      { q: 'Durations of 3, 5 and 10 minutes have a mean of:', opts: ['5 minutes', '18 minutes', '10 minutes', '6 minutes'], a: 3, why: '18 ÷ 3 = 6.' },
      { q: '12 correct out of 16 trials is:', opts: ['75%', '12%', '60%', '80%'], a: 0, why: '12 ÷ 16 = 0.75.' },
      { q: 'A behavior was marked in 6 of 24 intervals:', opts: ['6%', '24%', '25%', '40%'], a: 2, why: '6 ÷ 24 = 0.25.' },
      { q: 'A percentage should be reported with:', opts: ['Nothing else.', 'The numbers it was worked out from.', 'The student’s age.', 'The weather.'], a: 1, why: '“70% (14 of 20)” tells the reader how much it rests on.' },
      { q: 'Unless the plan says otherwise, “correct” means:', opts: ['Correct with any amount of help.', 'Attempted.', 'Correct on the second try.', 'Correct without a prompt.'], a: 3, why: 'Independent answers show what the student can do alone.' },
      { q: 'To change a rate per minute into a rate per hour:', opts: ['Divide by 60.', 'Add 60.', 'Multiply by 60.', 'Do nothing.'], a: 2, why: 'There are 60 minutes in an hour.' },
      { q: 'A student was observed for 20 of the 30 minutes. The rate uses:', opts: ['20 minutes.', '30 minutes.', '10 minutes.', '50 minutes.'], a: 0, why: 'Only the time actually observed.' },
      { q: '“1 of 2 correct, 50%” deserves caution because:', opts: ['50% is a fail.', 'The arithmetic is wrong.', 'Percentages cannot be used for trials.', 'Two trials are very little evidence.'], a: 3, why: 'Small numbers swing wildly.' }
    ] },
    role: [
      { t: 'From the sheet to the summary', setup: 'The trainer hands over a completed data sheet holding a count with times, three durations and a block of trials with prompts marked.',
        steps: ['Works out the rate with the observed time.', 'Works out the mean duration and gives the number of instances.', 'Works out the percentage of independent correct answers.', 'Reports prompted answers separately.', 'Writes each summary with the numbers behind it.'] }
    ],
    roleRule: 'Met when all three summaries are correct and written with their numbers.',
    discuss: [
      'When has a percentage misled you or someone you know?',
      'Which of your current data sheets would be clearer with a different summary?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on measuring behavior.'
    ]
  },

  c7: {
    aim: [
      'Name the parts of a line graph and enter a session’s data point correctly.',
      'Describe a data path by its level, its trend and its variability.',
      'Know which changes to report to your supervisor, and report them promptly.'
    ],
    lesson: [
      { h: 'The parts of a line graph',
        p: ['Most behavior data are shown on a line graph. Time runs along the bottom (sessions or dates). The measure runs up the side (count, rate, percentage, minutes), with its label. Each session is one data point, and the points are joined by a line called the data path.',
            'A vertical line marks a change of phase or condition, such as the move from baseline to intervention, with a label above each phase. Points are not joined across a phase line. Bar graphs are used to compare totals or averages, for example the mean of each phase.'],
        check: { q: 'What does a vertical line on a line graph usually show?',
          opts: ['A missing session.', 'A change of phase or condition.', 'The student’s birthday.', 'The goal.'],
          a: 1, why: 'It separates what came before a change from what came after.' } },
      { h: 'Entering data',
        p: ['Enter the point as soon as the session is summarized, the same day where you can. A graph that is two weeks behind cannot guide anyone.',
            'Put the point at the right date and the right value, in the right phase. If a session was missed, leave the date empty and do not join the points across it. If something unusual happened (a substitute teacher, illness, a fire drill), note it on the graph or in the record as your workplace does.'],
        check: { q: 'The student was absent on Wednesday. On the graph you:',
          opts: ['Enter zero.', 'Enter Tuesday’s value again.', 'Leave Wednesday empty and do not join the line across it.', 'Enter the average.'],
          a: 2, why: 'A zero would say the behavior did not happen. Nothing was measured, and the graph should show that.' } },
      { h: 'Reading it: level, trend, variability',
        p: ['Level is where the points sit: high, middle or low on the scale. Trend is the direction they are heading: rising, falling or flat. Variability is how much they bounce from point to point.',
            'A good or bad trend depends on the goal. A rising line is good news for words read and bad news for hitting. Look at several points, not one: a single high day is a day, not a trend.'],
        key: ['Level: how high.', 'Trend: which way.', 'Variability: how bouncy.'],
        check: { q: 'Over eight sessions, a student’s correct answers were 20, 30, 35, 45, 50, 60, 65 and 75 percent. The data show:',
          opts: ['A flat trend.', 'A falling trend.', 'High variability with no trend.', 'A rising trend.'],
          a: 3, why: 'Each point is higher than the one before.' } },
      { h: 'What to report',
        p: ['You see the graph first, so you are the early warning. Tell your supervisor, without waiting for the next meeting, when you see any of these: a sudden jump or drop; a trend going the wrong way over several sessions; no progress over the number of sessions the plan names; points that have begun to bounce widely; or a mastery criterion that has been met.',
            'Describe what you see in plain terms: “Hitting has risen in each of the last four sessions, from 2 to 9.” The decision about what it means and what to change is your supervisor’s.'],
        check: { q: 'For five sessions in a row a skill has stayed between 40% and 45%, and the plan says to review after five sessions without progress. You:',
          opts: ['Tell your supervisor now.', 'Wait for the monthly meeting.', 'Change the prompt.', 'Give it another five sessions.'],
          a: 0, why: 'The plan’s own review point has been reached. Reporting it is your part; changing the procedure is not.' } }
    ],
    examples: {
      ask: 'What does the data path show?',
      intro: 'Eight runs of session data. Decide how each is best described.',
      opts: ['Rising trend', 'Falling trend', 'Flat and steady', 'Highly variable'],
      items: [
        { s: 'Hits per day: 9, 8, 8, 6, 5, 3, 2.', a: 1, why: 'Each point is at or below the one before.' },
        { s: 'Percent correct: 50, 52, 50, 49, 51, 50.', a: 2, why: 'The points stay within a few percent.' },
        { s: 'Minutes on task: 3, 5, 6, 9, 12, 14.', a: 0, why: 'A steady climb.' },
        { s: 'Call-outs per hour: 2, 14, 3, 12, 1, 15.', a: 3, why: 'The points swing widely from session to session.' },
        { s: 'Requests per session: 0, 1, 1, 3, 4, 6, 8.', a: 0, why: 'Going up.' },
        { s: 'Tantrum minutes: 20, 18, 21, 19, 20, 19.', a: 2, why: 'Level is high and it is not moving.' },
        { s: 'Percent of intervals out of seat: 60, 55, 45, 40, 30, 20.', a: 1, why: 'Going down.' },
        { s: 'Words read per minute: 30, 12, 34, 9, 31, 14.', a: 3, why: 'Large swings, no clear direction.' }
      ]
    },
    practice: {
      title: 'Keep a graph and read it',
      intro: 'You keep the graph for Rafa, a simulated student. The measure is aggression per day; the plan began on session 6 after five baseline sessions.',
      steps: [
        { t: 'Session 6', see: 'The first day of the intervention: 7 instances. Baseline ended yesterday at 8.', opts: ['Join today’s point to yesterday’s.', 'Draw the phase line between sessions 5 and 6, label the new phase, and do not join across the line.', 'Start a new graph.'], a: 1, why: 'The phase line and its label show where the change was made; the data path breaks there.' },
        { t: 'Session 9', see: 'Rafa was away. A colleague suggests entering 0, “since he did not hit anyone”.', opts: ['Leave session 9 empty and break the line.', 'Enter 0.', 'Enter the average of 8 and 10.'], a: 0, why: 'No observation is not the same as no behavior.' },
        { t: 'Session 12', see: 'Since the plan began: 7, 6, 6, (away), 4, 3, 2.', opts: ['Describe it as a falling trend and keep running the plan.', 'Stop the plan: it has worked.', 'Change the reinforcer to speed things up.'], a: 0, why: 'A falling trend toward the goal. Reading it is your part; ending or changing a plan is not.' },
        { t: 'Session 15', see: 'The last three points are 2, 9 and 11. There is a substitute teacher this week.', opts: ['Wait a week to see whether it settles.', 'Tell your supervisor today: the numbers, and the change of teacher.', 'Erase the high points as untypical.'], a: 1, why: 'A sudden rise is exactly what to report at once, with anything that changed. Data are never erased.' },
        { t: 'Session 15', see: 'How do you word the report?', opts: ['“He is getting worse again.”', '“The plan has stopped working.”', '“Aggression went from 2 to 9 to 11 over the last three sessions. A substitute teacher started on the first of those days.”'], a: 2, why: 'Numbers and observable facts. The meaning is for the supervisor to work out.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'On a line graph, the horizontal axis usually shows:', opts: ['The measure.', 'Time: sessions or dates.', 'The student’s name.', 'The goal.'], a: 1, why: 'Time runs along the bottom.' },
      { q: 'The vertical axis shows:', opts: ['The measure of the behavior.', 'The days of the week.', 'The observer.', 'The phase labels.'], a: 0, why: 'Count, rate, percentage or duration.' },
      { q: 'A phase-change line is:', opts: ['A line joining the points.', 'The goal line.', 'A vertical line where a condition changed.', 'The bottom axis.'], a: 2, why: 'It separates phases.' },
      { q: 'Data points are joined:', opts: ['Across phase lines.', 'Across missed sessions.', 'Never.', 'Within a phase, between sessions that follow one another.'], a: 3, why: 'The path breaks at a phase line and at a gap.' },
      { q: 'Trend describes:', opts: ['How high the points are.', 'The direction the points are heading.', 'How much they bounce.', 'The number of points.'], a: 1, why: 'Rising, falling or flat.' },
      { q: 'Variability describes:', opts: ['How much the points differ from one another.', 'The direction of the data.', 'The label on the axis.', 'The phase.'], a: 0, why: 'A bouncy path is variable.' },
      { q: 'A rising trend is:', opts: ['Always good.', 'Always bad.', 'Good or bad depending on the goal for that behavior.', 'Meaningless.'], a: 2, why: 'Up is good for skills and bad for problem behavior.' },
      { q: 'A session was not run. On the graph you:', opts: ['Enter zero.', 'Repeat the last value.', 'Enter the mean.', 'Leave it empty.'], a: 3, why: 'Nothing was measured.' },
      { q: 'Data should be graphed:', opts: ['At the end of the term.', 'Promptly, the same day where possible.', 'Only when asked.', 'When there is good news.'], a: 1, why: 'A current graph can guide decisions.' },
      { q: 'You notice problem behavior has doubled over three sessions. You:', opts: ['Tell your supervisor promptly.', 'Wait to see.', 'Change the plan.', 'Stop graphing.'], a: 0, why: 'You are the early warning.' },
      { q: 'Which is the best report of a change?', opts: ['“Something is off.”', '“She hates the new schedule.”', '“Out-of-seat rose from 20% to 55% of intervals this week.”', '“It is not working.”'], a: 2, why: 'It gives the measure and the numbers.' }
    ] },
    role: [
      { t: 'Plot and describe', setup: 'The trainer gives a part-finished graph and five new sessions of data, including one missed session and one phase change.',
        steps: ['Plots each point at the right session and value.', 'Leaves the missed session empty and breaks the line.', 'Draws and labels the phase line and does not join across it.', 'Describes level, trend and variability in each phase.', 'Says what, if anything, they would report today, in numbers.'] }
    ],
    roleRule: 'Met when the graph is correct and the description has every step.',
    discuss: [
      'How current are the graphs where you work? What gets in the way?',
      'Think of a time a graph surprised you. What had your impression been?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on constructing and interpreting graphic displays of behavioral data.',
      'Kubina, R. M., Kostewicz, D. E., Brennan, K. M., & King, S. A. (2017). A critical review of line graphs in behavior analytic journals. Educational Psychology Review, 29(3), 583–598.'
    ]
  },

  d1: {
    aim: [
      'Say what preference, skill and functional assessments are each for.',
      'Say what a technician does in an assessment and what stays with the supervisor.',
      'Explain why an assessment is run exactly as written.'
    ],
    lesson: [
      { h: 'Three questions',
        p: ['Before a plan is written, three questions need answers. What will this person work for? What can they do now, and what do they need to learn? Why does the problem behavior happen?',
            'Each question has its own kind of assessment: a preference assessment, a skill assessment and a functional assessment. None is done once and filed. Preferences shift from week to week, skills grow, and the reasons for behavior can change.'],
        check: { q: 'Which assessment answers the question, “What will this student work for?”',
          opts: ['Functional assessment', 'Skill assessment', 'Preference assessment', 'Medical assessment'],
          a: 2, why: 'A preference assessment finds items and activities likely to work as reinforcers.' } },
      { h: 'Preference and skill assessments',
        p: ['A preference assessment offers items or activities in a set way and records what the person chooses or stays with. It produces a ranking, which is a good guess at what will reinforce. You will run these yourself.',
            'A skill assessment finds what the person can already do and what comes next. Some follow a curriculum of skills in order; some compare with what children do at each age; some look at one area, such as social skills. The supervisor chooses the tool, runs or directs it, and turns the result into goals. You may present the tasks, record the answers and help to tally.'],
        check: { q: 'A supervisor wants to know which early language skills a student has and which to teach next. This calls for a:',
          opts: ['Skill assessment', 'Preference assessment', 'Functional analysis', 'Scatter plot'],
          a: 0, why: 'It maps what the student can do and what is missing.' } },
      { h: 'Functional assessment',
        p: ['A functional assessment asks what a problem behavior gets the person. It has three levels. Indirect: interviews and rating scales with people who know the student. Descriptive: watching and recording the behavior where it happens, with what came before and after. Functional analysis: testing conditions one at a time to see which one makes the behavior more likely.',
            'You are most likely to help with the descriptive part, by keeping ABC records and scatter plots, and to run sessions of a functional analysis under close direction.'],
        key: ['Preference: what will they work for?', 'Skill: what can they do, and what is next?', 'Functional: what does the behavior get them?'],
        check: { q: 'Recording what happens before and after each tantrum in the classroom is part of a:',
          opts: ['Preference assessment', 'Skill assessment', 'Curriculum review', 'Functional assessment'],
          a: 3, why: 'It is the descriptive part of a functional assessment.' } },
      { h: 'Your part, and why the script matters',
        p: ['In every assessment the supervisor chooses the method, trains you, interprets the results and explains them to the family. You prepare the materials, follow the procedure, record accurately and report anything that might have affected the result: illness, a bad night, a noisy room, a new person present.',
            'An assessment is a measurement. Extra hints in a skill assessment make the student look more able than they are, and goals are then set too high. A comforting word in the wrong condition of a functional analysis blurs the result. Being kind to the student means getting a true answer.'],
        check: { q: 'During a skill assessment the student hesitates, and you could easily hint at the answer. The instructions say to give no help. You:',
          opts: ['Hint: she nearly has it.', 'Follow the instructions and record what she does.', 'Skip the item.', 'Mark it correct and move on.'],
          a: 1, why: 'The assessment has to show what she can do alone, so that teaching starts in the right place.' } }
    ],
    examples: {
      ask: 'Which kind of assessment is this?',
      intro: 'Eight activities. Decide which kind of assessment each belongs to.',
      opts: ['Preference assessment', 'Skill assessment', 'Functional assessment'],
      items: [
        { s: 'Two toys are held out at a time, and the one the student reaches for is recorded.', a: 0, why: 'It records choices among items.' },
        { s: 'The teacher fills in a rating scale about when and where hitting happens.', a: 2, why: 'An indirect functional assessment.' },
        { s: 'The student is asked to name 20 pictures with no help, and each answer is scored.', a: 1, why: 'It finds what the student can do.' },
        { s: 'A grid of the school day is marked each time screaming occurs, to see when it clusters.', a: 2, why: 'A scatter plot, part of a descriptive assessment.' },
        { s: 'The student is left with eight activities for five minutes, and the time spent with each is recorded.', a: 0, why: 'A free-operant preference assessment.' },
        { s: 'A checklist of dressing steps is scored as the student gets ready for recess.', a: 1, why: 'It assesses a self-care skill step by step.' },
        { s: 'In short sessions, a task is given and removed for 30 seconds after each instance of the behavior, and the rate is compared with a play condition.', a: 2, why: 'A condition of a functional analysis.' },
        { s: 'Parents are asked which snacks and games their child likes best.', a: 0, why: 'An interview about preferences.' }
      ]
    },
    practice: {
      title: 'Whose job is it?',
      intro: 'Five moments during a week of assessments for Sami, a simulated student. Decide what you do.',
      steps: [
        { t: 'Monday', see: 'Your supervisor hands you a preference-assessment procedure and a box of items, and shows you how to run it.', opts: ['Run it as shown and record each choice.', 'Add Sami’s favorite sweet, which is not in the box.', 'Ask Sami which he likes and write that down instead.'], a: 0, why: 'The procedure and the items were chosen for a reason. Suggestions go to the supervisor.' },
        { t: 'Tuesday', see: 'During a skill assessment, Sami answers an item wrongly and looks at you.', opts: ['Say, “Try again, you know this.”', 'Give the neutral response the instructions name, and score the answer as given.', 'Change his answer to the right one on the sheet.'], a: 1, why: 'Feedback and second tries are teaching, and this is measurement.' },
        { t: 'Wednesday', see: 'Sami’s mother asks, “So, why does he run out of class? What did you find?”', opts: ['Tell her what you think.', 'Say that the supervisor will go through the results with her, and pass on that she asked.', 'Show her the raw data sheets.'], a: 1, why: 'Interpreting and explaining results is the supervisor’s work.' },
        { t: 'Thursday', see: 'A fire drill interrupts an observation, and Sami is unsettled for the rest of it.', opts: ['Record as usual and say nothing.', 'Discard the sheet.', 'Record, and note the fire drill and its timing on the sheet.'], a: 2, why: 'The supervisor needs to know what may have affected the result.' },
        { t: 'Friday', see: 'You think the functional assessment is pointing to escape, and you could start giving Sami more breaks.', opts: ['Start the breaks: it cannot hurt.', 'Keep to the current plan until the supervisor writes the new one.', 'Stop giving any breaks, to test your idea.'], a: 1, why: 'Acting on a half-finished assessment changes the very thing being measured, and the idea may be wrong.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'A preference assessment is used to find:', opts: ['The function of a behavior.', 'Items and activities likely to work as reinforcers.', 'A diagnosis.', 'The student’s reading level.'], a: 1, why: 'It ranks what the person chooses.' },
      { q: 'A skill assessment tells the team:', opts: ['What the person can do now and what to teach next.', 'Why problem behavior happens.', 'Which reinforcer to use.', 'How many staff are needed.'], a: 0, why: 'It maps strengths and gaps.' },
      { q: 'A functional assessment asks:', opts: ['What the person likes.', 'How old the person is.', 'What the problem behavior gets the person.', 'What the person can read.'], a: 2, why: 'It looks for the consequences that keep the behavior going.' },
      { q: 'An interview with a teacher about a behavior is which level of functional assessment?', opts: ['Functional analysis', 'Descriptive', 'Preference', 'Indirect'], a: 3, why: 'Information from people, not from direct observation.' },
      { q: 'ABC recording in the classroom is which level?', opts: ['Indirect', 'Descriptive', 'Functional analysis', 'Skill'], a: 1, why: 'Direct observation in the natural setting.' },
      { q: 'A functional analysis:', opts: ['Tests conditions one at a time to see which makes the behavior more likely.', 'Is an interview.', 'Is a preference ranking.', 'Is done by the family alone.'], a: 0, why: 'It is an experiment, run under the supervisor’s direction.' },
      { q: 'Who interprets assessment results and explains them to the family?', opts: ['The technician.', 'The classroom aide.', 'The supervisor.', 'Whoever collected the data.'], a: 2, why: 'Interpretation is the supervisor’s role.' },
      { q: 'Giving extra hints during a skill assessment leads to:', opts: ['A kinder assessment.', 'Faster sessions.', 'Nothing of importance.', 'Goals set too high, because the student looks more able than they are.'], a: 3, why: 'The starting point is wrong.' },
      { q: 'Why are preference assessments repeated?', opts: ['Preferences change.', 'To fill time.', 'Because the first is always wrong.', 'They are not repeated.'], a: 0, why: 'What reinforces today may not next month.' },
      { q: 'During an assessment the student seems unwell. You:', opts: ['Ignore it.', 'Note it and tell your supervisor, since it may affect the result.', 'Double the session length.', 'Change the procedure.'], a: 1, why: 'Conditions that may have affected the result are part of the record.' }
    ] },
    role: [
      { t: 'Run a short assessment from a script', setup: 'The trainer gives a one-page script for a ten-item skill probe and plays a student who hesitates, looks for hints and gets some wrong.',
        steps: ['Sets out the materials the script lists.', 'Presents each item with the words the script gives.', 'Gives no hint and no second try.', 'Responds to right and wrong answers in the same neutral way.', 'Scores each answer as it is given.', 'Names one thing that might have affected the result.'] }
    ],
    roleRule: 'Met when the ten items are run with every step in place.',
    discuss: [
      'Why is it hard to withhold help during an assessment? What makes it easier?',
      'A parent asks you for results. What can you say that is honest and still leaves the explanation to the supervisor?'
    ],
    read: [
      'Hanley, G. P., Iwata, B. A., & McCord, B. E. (2003). Functional analysis of problem behavior: A review. Journal of Applied Behavior Analysis, 36(2), 147–185.',
      'Gould, E., Dixon, D. R., Najdowski, A. C., Smith, M. N., & Tarbox, J. (2011). A review of assessments for determining the content of early intensive behavioral intervention programs for autism spectrum disorders. Research in Autism Spectrum Disorders, 5(3), 990–1002.'
    ]
  }
});
