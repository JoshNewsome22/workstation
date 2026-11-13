/* nbh-learn-units-c.js (v26.01): written units of the Learning page, section C (Data collection and graphing), units c1 to c4.
   The shape of a unit is described in nbh-learn-units.js. The people in every example are invented. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  c1: {
    aim: [
      'Say what an operational definition is and what a good one contains.',
      'Score behavior by the definition, not by your impression.',
      'Report instances the definition does not settle, without rewriting it yourself.'
    ],
    lesson: [
      { h: 'Two people, one count',
        p: ['If you count 12 “outbursts” and a colleague counts 4 in the same hour, neither number can be used. The usual cause is not carelessness. It is that each of you carries a different idea of what an outburst is.',
            'An operational definition settles it. It says, in observable terms, exactly what counts as an instance of the behavior, so that two people watching the same moment would score it the same way.'],
        check: { q: 'What is an operational definition for?',
          opts: ['To explain why the behavior happens.', 'To make sure different observers count the same thing.', 'To describe the student’s personality.', 'To set the consequence.'],
          a: 1, why: 'It makes the measurement repeatable from one observer to the next.' } },
      { h: 'What a good one has',
        p: ['A good definition is objective: it names what can be seen or heard, not what is felt or intended. It is clear: someone new could read it and use it. It is complete: it says where the behavior begins and ends, and it gives examples and non-examples for the cases near the edge.',
            'Compare “is aggressive” with “hits, kicks or pushes another person with enough force to make a sound or move them; does not include high-fives or bumping in a crowded line”. The second can be counted.'],
        key: ['Objective: seen or heard.', 'Clear: a stranger could use it.', 'Complete: where it starts and stops, examples and non-examples.'],
        check: { q: 'Which definition is the most usable?',
          opts: ['“Off task: not paying attention.”', '“Off task: being disrespectful of learning time.”', '“Off task: eyes away from the work or the teacher for more than 5 seconds; does not include looking at a neighbor’s page when told to share.”', '“Off task: when he is distracted.”'],
          a: 2, why: 'It says what to look for, sets a time, and deals with an edge case.' } },
      { h: 'Starts, stops and edges',
        p: ['For a behavior that lasts, the definition says when one instance ends and the next begins: “a new instance is scored after 10 seconds without crying”. Without that, one long episode can be counted as one or as fifteen.',
            'Non-examples matter as much as examples. They are the cases an honest observer would hesitate over. A definition that has thought about them saves you the hesitation.'],
        check: { q: 'A definition of “out of seat” says: “bottom not touching the chair for more than 3 seconds; not scored when the teacher has sent the student somewhere.” The teacher asks Dee to fetch a book. Do you score it?',
          opts: ['Yes: her bottom left the chair.', 'Yes, but only once.', 'No: the definition excludes it.', 'Only if she takes a long time.'],
          a: 2, why: 'The non-example covers exactly this case.' } },
      { h: 'Using it',
        p: ['The supervisor writes the definition, usually with the teacher and family. You learn it before you record, keep a copy with the data sheet, and score by it even when your impression says otherwise.',
            'When something happens that the definition does not settle, do not decide quietly and move on. Note what happened, score it as best the definition allows, and tell your supervisor. The definition may need another line. Changing it is their job, because every change makes the data before and after harder to compare.'],
        check: { q: 'A student does something the definition does not clearly include or exclude. You:',
          opts: ['Add your own rule and use it from now on.', 'Stop recording that behavior.', 'Count it on bad days and not on good ones.', 'Note what happened and tell your supervisor.'],
          a: 3, why: 'A private rule makes your data differ from everyone else’s, and nobody knows.' } }
    ],
    examples: {
      ask: 'Can it be counted as written?',
      intro: 'Eight descriptions taken from referral forms. Decide whether each is observable and measurable as it stands.',
      opts: ['Observable and measurable', 'Not as written'],
      items: [
        { s: 'Throws materials at least one arm’s length from where they were.', a: 0, why: 'It can be seen and has a boundary.' },
        { s: 'Has a bad attitude toward adults.', a: 1, why: 'An attitude cannot be seen. What does he do?' },
        { s: 'Says words on the class’s list of swear words, loud enough to be heard from 2 meters.', a: 0, why: 'It can be heard, and the list and the distance set the edges.' },
        { s: 'Gets overwhelmed in the cafeteria.', a: 1, why: 'A state inside the student. What happens when she is “overwhelmed”?' },
        { s: 'Leaves the classroom without permission, both feet past the door frame.', a: 0, why: 'It can be seen, with a clear start.' },
        { s: 'Is unmotivated in reading.', a: 1, why: 'Motivation is an explanation, not a behavior.' },
        { s: 'Bites own hand or arm so that teeth touch skin.', a: 0, why: 'It can be seen, and “teeth touch skin” separates it from mouthing a sleeve.' },
        { s: 'Does not respect personal space.', a: 1, why: 'Too open: how close, for how long, with whom?' }
      ]
    },
    practice: {
      title: 'Score by the definition',
      intro: 'You are counting “aggression” for Marco, a simulated student. Read the definition, then score each moment.',
      planT: 'The definition',
      plan: ['Aggression: hitting, kicking or pushing another person, with enough force to make a sound or to move the person.', 'Includes hits that land on a person’s bag or clothing while worn.', 'Does not include high-fives, tagging in a game, or bumping while lining up.', 'Does not include throwing objects (counted separately).'],
      ask: 'Do you score aggression?',
      word: 'Moment',
      steps: [
        { t: '10:02', see: 'Marco slaps a classmate’s arm. You hear it from across the room.', opts: ['Yes', 'No', 'Only if the classmate cries'], a: 0, why: 'A hit with enough force to make a sound.' },
        { t: '10:10', see: 'In a tag game, Marco touches a peer’s shoulder and runs.', opts: ['Yes', 'No', 'Yes, half a point'], a: 1, why: 'Tagging in a game is a named non-example.' },
        { t: '10:25', see: 'Marco kicks the backpack a classmate is wearing. The classmate stumbles forward.', opts: ['No: he kicked a bag, not a person.', 'Yes: the bag was being worn and the person was moved.', 'Score it as throwing.'], a: 1, why: 'The definition includes hits on a bag while worn, and the person was moved.' },
        { t: '10:31', see: 'Marco throws an eraser. It hits a classmate’s head.', opts: ['Yes', 'No: score it under throwing objects.', 'Score both.'], a: 1, why: 'Throwing is counted separately. The definition is explicit, whatever the result felt like.' },
        { t: '10:40', see: 'Marco raises his fist at a classmate and holds it there, then lowers it.', opts: ['Yes: it was threatening.', 'No. Note what happened and tell your supervisor: the definition has no line for threats.', 'Yes, on days when he has already hit.'], a: 1,
          why: 'Nobody was touched, so it is not aggression as defined. It still matters, and the supervisor may want it counted on its own.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'An operational definition describes behavior in terms that are:', opts: ['Emotional.', 'Observable and measurable.', 'Medical.', 'General.'], a: 1, why: 'What can be seen or heard and counted.' },
      { q: 'A “complete” definition:', opts: ['Says where the behavior starts and stops and covers the edge cases.', 'Is at least a page long.', 'Lists every student who does it.', 'Names the function.'], a: 0, why: 'Boundaries, examples and non-examples.' },
      { q: 'Which word belongs in an operational definition?', opts: ['Frustrated', 'Defiant', 'Kicks', 'Lazy'], a: 2, why: 'Kicking can be seen.' },
      { q: 'Non-examples are included to:', opts: ['Make the definition longer.', 'List good behavior.', 'Confuse new staff.', 'Settle the cases an observer would hesitate over.'], a: 3, why: 'They mark the edge of the definition.' },
      { q: 'Who writes and changes the definition?', opts: ['The technician.', 'The supervisor.', 'The student.', 'Whoever is recording.'], a: 1, why: 'Changes affect how all the data compare.' },
      { q: 'Your impression is that a moment “felt aggressive”, but it does not meet the definition. You:', opts: ['Score it anyway.', 'Score half.', 'Do not score it, and note it if it seems important.', 'Rewrite the definition.'], a: 2, why: 'The definition decides; notes carry the rest.' },
      { q: 'Two observers get very different counts. The first thing to check is:', opts: ['Whether they are using the same definition in the same way.', 'Who is more senior.', 'The student’s mood.', 'The weather.'], a: 0, why: 'Differing private definitions are the usual cause.' },
      { q: '“A new instance is scored after 10 seconds without crying” tells you:', opts: ['How loud crying must be.', 'Why the student cries.', 'How to respond.', 'When one instance ends and the next begins.'], a: 3, why: 'It separates one occurrence from the next.' },
      { q: 'Why not improve a definition yourself when you see a gap?', opts: ['You are not clever enough.', 'Data scored under different rules cannot be compared, and nobody would know the rule changed.', 'It takes too long.', 'Definitions never have gaps.'], a: 1, why: 'Consistency over time and across people is the point.' },
      { q: 'The best place for the definition during a session is:', opts: ['In the office.', 'In your memory only.', 'With the data sheet.', 'On the student’s desk.'], a: 2, why: 'It is there when a doubtful case comes up.' }
    ] },
    role: [
      { t: 'Score from a definition', setup: 'The trainer gives a written definition and acts out eight short moments, some clear, some at the edge, one the definition does not settle.',
        steps: ['Reads the definition before starting and keeps it in view.', 'Scores the clear instances correctly.', 'Leaves the non-examples unscored.', 'Notes the unsettled case instead of inventing a rule.', 'Says what they would tell the supervisor about it.'] }
    ],
    roleRule: 'Met when all eight moments are scored as the definition requires.',
    discuss: [
      'Pick a word your team uses for a behavior (“meltdown”, “shutdown”, “refusal”). What would each of you count?',
      'Think of a behavior you record now. Which case would you hesitate over?'
    ],
    read: [
      'Hawkins, R. P., & Dobes, R. W. (1977). Behavioral definitions in applied behavior analysis: Explicit or implicit? In B. C. Etzel, J. M. LeBlanc, & D. M. Baer (Eds.), New developments in behavioral research (pp. 167–188). Erlbaum.',
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on selecting and defining target behaviors.'
    ]
  },

  c2: {
    aim: [
      'Say what decisions are made from your data, and what goes wrong when the data are unreliable.',
      'Name the common sources of error and how to guard against each.',
      'Explain why running the plan as written matters to the data.'
    ],
    lesson: [
      { h: 'What the data are for',
        p: ['Every decision about a plan is made from data: keep going, change the procedure, thin the reinforcement, move to the next skill, stop. The supervisor, the family and the school all look at the same graph.',
            'If the numbers are wrong, the decisions are wrong. A procedure that is not working is kept for months because the sheet says it is. A procedure that is working is dropped. A family is told about progress that is not there. The student pays for each of these.'],
        check: { q: 'What is the main risk of unreliable data?',
          opts: ['The technician looks careless.', 'The graph is untidy.', 'Decisions about the student’s plan are made from a false picture.', 'Sessions take longer.'],
          a: 2, why: 'Data exist to guide decisions. Wrong data guide them wrongly.' } },
      { h: 'Where errors come from',
        p: ['Most error is ordinary. You record at the end from memory. The materials were not ready. The definition has drifted in your head since you learned it. You expect improvement, so you see it. You like the student, or are tired of the behavior, and it colors what you count.',
            'The student may also act differently when watched, and you may record differently when your supervisor is in the room. None of this makes you dishonest. It makes you human, and it is why the guards below are routine.'],
        key: ['Record at the moment, not afterwards.', 'Score by the written definition.', 'Have the tools in your hand before you start.', 'Leave an honest gap; never fill one in.'],
        check: { q: 'After a hectic session you realize you did not record the last 20 minutes. You:',
          opts: ['Estimate from memory so the sheet is complete.', 'Mark the 20 minutes as not recorded and tell your supervisor.', 'Copy the first 20 minutes.', 'Throw the sheet away.'],
          a: 1, why: 'An honest gap can be worked around. An invented number looks exactly like a real one and cannot.' } },
      { h: 'Checks on the data, and on the plan',
        p: ['From time to time a second person records the same session independently, and the two records are compared. This is interobserver agreement. It is a check on the measurement system, not a test of you, and low agreement usually leads to a clearer definition or more practice.',
            'There is a second half to this. Data only tell you about the plan if the plan was actually run. If reinforcement was delivered late, steps were skipped or the timer was guessed, a flat graph says nothing about whether the procedure works. So when you could not run something as written, say so in the record. That is as much a part of honest data as the count.'],
        check: { q: 'The graph shows no improvement. Before the plan is judged a failure, what must be known?',
          opts: ['Whether the plan was being run as written.', 'Whether the student likes the technician.', 'What the weather was.', 'Nothing: the graph is enough.'],
          a: 0, why: 'A plan that was not carried out as written has not really been tested.' } }
    ],
    examples: {
      ask: 'Does this protect the data or threaten them?',
      intro: 'Six habits. Decide whether each protects the data or threatens them.',
      opts: ['Protects the data', 'Threatens the data'],
      items: [
        { s: 'A tally counter on the wrist, clicked at each instance.', a: 0, why: 'Recording at the moment, with a tool in hand.' },
        { s: 'Writing the totals in the car after the session.', a: 1, why: 'Memory is the weakest recorder.' },
        { s: 'Rounding the count up a little on days the student “seemed worse”.', a: 1, why: 'An impression is being added to the count.' },
        { s: 'Re-reading the definition with the supervisor every month.', a: 0, why: 'It guards against the definition drifting.' },
        { s: 'Writing “no data 10:00 to 10:15, fire drill” on the sheet.', a: 0, why: 'An honest gap with its reason.' },
        { s: 'Recording carefully when the supervisor visits and loosely on other days.', a: 1, why: 'The data then describe the visits, not the student.' }
      ]
    },
    practice: {
      title: 'Keep the data honest',
      intro: 'Four moments from a week of recording for Sana, a simulated student.',
      steps: [
        { t: 'Monday', see: 'Your clicker is missing. The session starts in a minute.', opts: ['Count in your head.', 'Draw a tally grid on paper and mark it as you go.', 'Skip the count today and average it later.'], a: 1, why: 'A tally on paper is still a record made at the moment.' },
        { t: 'Tuesday', see: 'A second observer joins to record alongside you. She whispers, “I got six so far, you?”', opts: ['Compare now and adjust to match.', 'Say you will compare at the end, and keep recording on your own.', 'Let her record alone.'], a: 1, why: 'Agreement means something only if the two records were made independently.' },
        { t: 'Wednesday', see: 'Sana’s counts have fallen all week and you are pleased. Today she has a hard morning. You catch yourself thinking that one or two of those “did not really count”.', opts: ['Leave them out: the trend is real.', 'Score every instance that meets the definition.', 'Count them as half.'], a: 1, why: 'Wanting the plan to work is the most common bias there is. The definition, not the hope, decides.' },
        { t: 'Thursday', see: 'You were alone with three students and gave Sana’s reinforcer late or not at all for half the session.', opts: ['Record the behavior and note that the reinforcement was not delivered as planned.', 'Record the behavior only: the rest is not data.', 'Record nothing today.'], a: 0, why: 'Whoever reads today’s number needs to know the plan was not really in force.' }
      ]
    },
    quiz: { pass: 80, draw: 6, items: [
      { q: 'Data are collected mainly so that:', opts: ['Staff look busy.', 'Decisions about the plan rest on what happened.', 'The student can be graded.', 'There is something to file.'], a: 1, why: 'Decisions follow the data.' },
      { q: 'Interobserver agreement compares:', opts: ['Two students.', 'Morning and afternoon.', 'Two observers’ independent records of the same session.', 'The plan and the data.'], a: 2, why: 'It checks the measurement system.' },
      { q: 'Observer drift means that:', opts: ['The observer’s use of the definition changes over time.', 'The observer moves around the room.', 'The student changes seats.', 'The session runs late.'], a: 0, why: 'The definition in your head slides away from the written one.' },
      { q: 'A gap in the data should be:', opts: ['Filled with the average.', 'Filled from memory.', 'Hidden.', 'Marked as a gap, with the reason.'], a: 3, why: 'An honest gap can be handled; an invented number cannot be found.' },
      { q: 'Expecting a student to improve can lead you to:', opts: ['Record more carefully.', 'Record fewer instances than happened.', 'Use the definition more strictly.', 'Nothing: expectations do not affect recording.'], a: 1, why: 'Expectation bias.' },
      { q: 'Poor procedural fidelity means that:', opts: ['The data sheet was lost.', 'The student did not attend.', 'The plan was not carried out as written.', 'Two observers disagreed.'], a: 2, why: 'Fidelity is about how closely the plan was followed.' },
      { q: 'If the plan was not run as written, the data from that session:', opts: ['Say little about whether the plan works.', 'Are more accurate.', 'Should be doubled.', 'Prove the plan failed.'], a: 0, why: 'The procedure was not really tested.' },
      { q: 'The best time to record an instance of behavior is:', opts: ['At the end of the day.', 'Once a week.', 'When the supervisor asks.', 'As it happens.'], a: 3, why: 'Every minute of delay adds error.' }
    ] },
    role: [
      { t: 'Record with a second observer', setup: 'The trainer and the trainee both record the same five-minute sample (the workstation’s Practice counting, or a live role-play) without talking, then compare.',
        steps: ['Has the definition and a recording tool ready before the start.', 'Records each instance as it happens.', 'Does not look at the other record until the end.', 'Works out the agreement with the trainer.', 'Names one likely reason for each disagreement.'] }
    ],
    roleRule: 'Met when the sample is recorded with every step in place. The agreement figure itself is for discussion, not a pass mark.',
    discuss: [
      'When have you been tempted to tidy up a number? What was the pressure?',
      'How would you tell your supervisor that you could not run the plan as written today?'
    ],
    read: [
      'Kazdin, A. E. (1977). Artifact, bias, and complexity of assessment: The ABCs of reliability. Journal of Applied Behavior Analysis, 10(1), 141–150.',
      'Vollmer, T. R., Sloman, K. N., & St. Peter Pipkin, C. (2008). Practical implications of data reliability and treatment integrity monitoring. Behavior Analysis in Practice, 1(2), 4–11.'
    ]
  },

  c3: {
    aim: [
      'Record count, duration, latency and the time between responses.',
      'Choose the measure the plan asks for and say why it fits the behavior.',
      'Use a clicker, a tally and a timer without losing the session.'
    ],
    lesson: [
      { h: 'Continuous measurement',
        p: ['Continuous measurement records every instance of the behavior for the whole observation. Nothing is sampled, so nothing is missed. It is the most accurate kind of measurement and the one to use whenever one person can manage it.',
            'There are four things you can record about each instance: that it happened (count), how long it lasted (duration), how long it took to start (latency), and how long passed since the last one (interresponse time).'],
        check: { q: 'What makes a measurement “continuous”?',
          opts: ['It is taken all year.', 'Every instance during the observation is recorded.', 'It uses a stopwatch.', 'It is taken by two people.'],
          a: 1, why: 'Every instance, for the whole observation.' } },
      { h: 'Count',
        p: ['Count, often called frequency, is the number of times the behavior happened: 7 hand raises, 3 hits. It suits behavior that has a clear start and end and takes about the same time each time.',
            'A count means little without the time it was taken over. Seven call-outs in 10 minutes is not seven in a whole day. So always write the start and end time, and the count is usually turned into a rate: count divided by time.',
            'Count is a poor fit when instances vary greatly in length, or when the behavior happens so fast that no one could keep up.'],
        check: { q: 'For which behavior is a count the best fit?',
          opts: ['Crying that lasts from 10 seconds to 20 minutes.', 'Staying on task.', 'How long it takes to start work.', 'Throwing a pencil.'],
          a: 3, why: 'A throw is brief and has a clear start and end. The others are about time.' } },
      { h: 'Duration',
        p: ['Duration is how long the behavior lasts, from its start to its end. Use it when the length is what matters: a tantrum, time out of the room, time spent working.',
            'You can record the duration of each instance, or the total for the session. Per instance tells more. A count of “1 tantrum” hides whether it was one minute or forty.',
            'Start the timer at the onset the definition names and stop it at the offset it names. If the definition says a tantrum ends after 10 seconds of quiet, the timer stops then, not at the first pause.'],
        check: { q: 'Zed left the classroom twice today: once for 30 seconds and once for 25 minutes. Which measure shows what matters?',
          opts: ['Count: 2.', 'Duration.', 'Latency.', 'Interresponse time.'],
          a: 1, why: 'Two exits sound small; 25 minutes out of class is the real picture.' } },
      { h: 'Latency and interresponse time',
        p: ['Latency is the time from a signal to the start of the behavior: from “Line up” to the first step toward the door. Use it when the problem is being slow to start, or when a fast start is the goal.',
            'Interresponse time (IRT) is the time from the end of one instance to the start of the next. Use it when the spacing matters: a student who eats too fast, or who asks the same question again within seconds.',
            'For both you need the same thing: a timer started at a clearly defined moment and stopped at another.'],
        key: ['Latency: signal to start.', 'Interresponse time: end of one to start of the next.'],
        check: { q: 'The teacher says, “Open your books.” Eleven seconds later Amy opens hers. The 11 seconds is:',
          opts: ['Latency', 'Duration', 'Interresponse time', 'Rate'],
          a: 0, why: 'From the instruction to the start of the response.' } },
      { h: 'Doing it while you teach',
        p: ['Have the tool in your hand before the session: a clicker or tally for counts, a timer you can start and stop without looking for durations and latencies. Write the start time first.',
            'Record at the moment. If you are also teaching and cannot keep up, do not guess. Tell your supervisor, who can change the measure, shorten the observation or add a second person. A simpler system used accurately beats an ideal one used badly.'],
        check: { q: 'You are running a teaching program and also counting a behavior that happens about 40 times an hour. You keep losing count. You:',
          opts: ['Estimate at the end.', 'Stop teaching to count.', 'Tell your supervisor the system is not workable as it is.', 'Count only the big ones.'],
          a: 2, why: 'The supervisor can change the measurement. An estimate dressed as a count misleads everyone.' } }
    ],
    examples: {
      ask: 'Which measure fits best?',
      intro: 'Eight things a team wants to know. Choose the measure that answers each best.',
      opts: ['Count or rate', 'Duration', 'Latency', 'Interresponse time'],
      items: [
        { s: 'How many times does Abe raise his hand in a lesson?', a: 0, why: 'Brief, separate events.' },
        { s: 'How long does Bea stay with independent work before stopping?', a: 1, why: 'The length of the behavior.' },
        { s: 'How long after “Time to clean up” does Cal begin?', a: 2, why: 'Signal to start.' },
        { s: 'Dot takes bites with almost no pause; the goal is 15 seconds between bites.', a: 3, why: 'The spacing between responses.' },
        { s: 'How long do Edd’s tantrums last?', a: 1, why: 'Their length is the concern.' },
        { s: 'How many words does Fin read correctly per minute?', a: 0, why: 'A count over time: a rate.' },
        { s: 'After the bell, how long before Gia is in her seat?', a: 2, why: 'From the bell to the response.' },
        { s: 'Hal asks, “When is lunch?” again and again; the plan wants at least 5 minutes between askings.', a: 3, why: 'Time between one instance and the next.' }
      ]
    },
    practice: {
      title: 'Record one session',
      intro: 'You are observing Ivy, a simulated student, from 9:00 to 9:30. Use the log to answer.',
      planT: 'What happened',
      plan: ['9:02 called out', '9:05 teacher said “Start your worksheet”; Ivy picked up her pencil at 9:05 and 40 seconds', '9:09 called out', '9:10 left her seat; back at 9:13', '9:17 called out', '9:20 left her seat; back at 9:21', '9:26 called out'],
      ask: 'What do you record?',
      word: 'Question',
      steps: [
        { t: 'Count', see: 'How many call-outs?', opts: ['3', '4', '6'], a: 1, why: 'At 9:02, 9:09, 9:17 and 9:26.' },
        { t: 'Rate', see: 'What is the rate of calling out?', opts: ['4 per hour', '4 in 30 minutes, or 8 per hour', '0.4 per minute'], a: 1, why: 'Four in half an hour is eight an hour. The time is always part of the answer.' },
        { t: 'Duration', see: 'What is the total time out of seat?', opts: ['2 minutes', '3 minutes', '4 minutes'], a: 2, why: 'Three minutes (9:10 to 9:13) and one minute (9:20 to 9:21).' },
        { t: 'Duration', see: 'What is the duration of each time out of seat?', opts: ['3 minutes and 1 minute', '2 minutes each', '4 minutes'], a: 0, why: 'Recording each one shows they were not alike.' },
        { t: 'Latency', see: 'What was the latency to start the worksheet?', opts: ['5 minutes', '40 seconds', '9:05'], a: 1, why: 'From the instruction at 9:05 to picking up the pencil 40 seconds later.' },
        { t: 'Interresponse time', see: 'How long passed between the first call-out and the second?', opts: ['2 minutes', '9 minutes', '7 minutes'], a: 2, why: 'From 9:02 to 9:09. A call-out is brief, so its end and its start are the same moment here.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Frequency (count) is:', opts: ['How long a behavior lasts.', 'The number of times a behavior happens.', 'The time before it starts.', 'A percentage of intervals.'], a: 1, why: 'A tally of instances.' },
      { q: 'Rate is:', opts: ['Count divided by time.', 'Time divided by count.', 'The longest instance.', 'The same as duration.'], a: 0, why: 'For example, 6 per hour.' },
      { q: 'Duration is measured from:', opts: ['The instruction to the start.', 'One instance to the next.', 'The start of the behavior to its end.', 'The start of the session.'], a: 2, why: 'Onset to offset.' },
      { q: 'Latency is measured from:', opts: ['The end of one response to the start of the next.', 'The start of the behavior to its end.', 'The start of the day.', 'A signal to the start of the behavior.'], a: 3, why: 'Signal to response.' },
      { q: 'Interresponse time is:', opts: ['The time between the end of one instance and the start of the next.', 'The total session time.', 'The time to respond to an instruction.', 'The average duration.'], a: 0, why: 'The gap between responses.' },
      { q: 'A count is a poor measure when:', opts: ['The behavior is brief.', 'The behavior is easy to see.', 'Instances differ greatly in length.', 'The session is short.'], a: 2, why: 'One long and one short instance both count as one.' },
      { q: 'Why write the start and end time with a count?', opts: ['Habit.', 'So the count can be read as a rate and compared across sessions of different lengths.', 'For payroll.', 'It is not needed.'], a: 1, why: 'Ten in ten minutes and ten in a day are different.' },
      { q: 'Continuous measurement is preferred because it:', opts: ['Is quickest.', 'Needs no tools.', 'Can be done from memory.', 'Records every instance, so nothing is missed.'], a: 3, why: 'It is the most accurate.' },
      { q: 'A student takes 4 minutes to begin after each instruction. The useful measure is:', opts: ['Latency', 'Count', 'Interresponse time', 'Duration of work'], a: 0, why: 'Slow to start is a latency problem.' },
      { q: 'Total duration was 12 minutes over 3 tantrums. The mean duration is:', opts: ['12 minutes', '36 minutes', '4 minutes', '3 minutes'], a: 2, why: 'Twelve divided by three.' },
      { q: 'The definition says a tantrum ends after 10 seconds of quiet. The student pauses for 4 seconds and starts again. You:', opts: ['Stop the timer and start a new tantrum.', 'Keep the timer running: it is the same tantrum.', 'Subtract 4 seconds.', 'Stop recording.'], a: 1, why: 'The offset the definition names has not been reached.' },
      { q: 'You cannot keep up with the count while teaching. You:', opts: ['Guess.', 'Count on some days only.', 'Stop teaching.', 'Tell your supervisor so the system can be changed.'], a: 3, why: 'An unworkable system is the supervisor’s to fix.' }
    ] },
    role: [
      { t: 'Count and time at once', setup: 'The trainer plays a student for five minutes: several brief behaviors to count, one lasting behavior to time, and one instruction to take a latency from.',
        steps: ['Writes the start time before beginning.', 'Clicks or tallies each instance as it happens.', 'Starts and stops the timer at the onset and offset the definition names.', 'Takes the latency from the end of the instruction to the start of the response.', 'Writes the end time and reports count, rate, duration and latency.'] }
    ],
    roleRule: 'Met when the count is within one of the trainer’s and the times within 5 seconds.',
    discuss: [
      'Which behaviors at your workplace are counted when their length is what matters?',
      'What makes recording hard while you are also teaching, and what has helped?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on measuring behavior.',
      'LeBlanc, L. A., Raetz, P. B., Sellers, T. P., & Carr, J. E. (2016). A proposed model for selecting measurement procedures for the assessment and treatment of problem behavior. Behavior Analysis in Practice, 9(1), 77–83.'
    ]
  },

  c4: {
    aim: [
      'Record with partial interval, whole interval and momentary time sampling.',
      'Say which way each one leans: over or under the true amount.',
      'Report the result as a percentage of intervals, and never as a count.'
    ],
    lesson: [
      { h: 'Sampling instead of catching everything',
        p: ['Sometimes continuous measurement cannot be done: the behavior has no clear start and end, it happens too fast to count, or you have a group to teach. Discontinuous measurement divides the observation into equal intervals and records one thing for each.',
            'It gives an estimate, not the true amount. The three methods differ in the rule for marking an interval, and each one leans in a known direction.'],
        check: { q: 'Discontinuous measurement gives:',
          opts: ['An exact count.', 'An estimate based on intervals.', 'The duration of each instance.', 'Nothing useful.'],
          a: 1, why: 'It samples, and what it gives is an estimate.' } },
      { h: 'Partial interval',
        p: ['In partial-interval recording you mark the interval if the behavior happened at any time during it, even for a second. One instance or ten, the mark is the same.',
            'Because a moment is enough, it overestimates how much of the time the behavior fills. It is used mostly for behavior to be reduced: an estimate that leans high will not hide a problem.'],
        check: { q: 'The interval is 10 seconds. The student hums for 1 second at the start of it. In partial-interval recording you:',
          opts: ['Leave it blank: it was too short.', 'Mark half.', 'Wait to see whether it happens again.', 'Mark the interval.'],
          a: 3, why: 'Any occurrence within the interval earns the mark.' } },
      { h: 'Whole interval',
        p: ['In whole-interval recording you mark the interval only if the behavior went on for all of it, from the first second to the last. A break of one second leaves it unmarked.',
            'It underestimates the true amount, so it is used for behavior to be increased, such as staying on task or playing with others. If the percentage rises under so strict a rule, the gain is real.'],
        check: { q: 'In whole-interval recording of “on task”, the student works for 9 of the 10 seconds and looks away for 1. You:',
          opts: ['Mark it: nearly all of it.', 'Do not mark it.', 'Mark it as 90%.', 'Extend the interval.'],
          a: 1, why: 'The behavior must fill the whole interval.' } },
      { h: 'Momentary time sampling',
        p: ['In momentary time sampling you look only at the instant each interval ends, and mark whether the behavior is happening at that instant. What happened during the rest of the interval is not recorded.',
            'It lets you teach between looks, so it is the method for busy rooms and for watching several students. It can lean either way, and it misses behavior that is brief and rare. With short intervals and behavior that lasts, it tracks the true amount well.',
            'Whichever method the plan names, the result is the number of marked intervals divided by all intervals, as a percentage. It is never “she did it 12 times”: an interval mark is not a count.'],
        key: ['Partial: at any time in the interval. Leans high.', 'Whole: for all of the interval. Leans low.', 'Momentary: at the instant the interval ends.'],
        check: { q: 'Partial-interval data show hitting in 12 of 30 intervals. How do you report it?',
          opts: ['She hit 12 times.', 'She hit for 12 minutes.', 'Hitting occurred in 40% of intervals.', 'She hit 40 times.'],
          a: 2, why: 'Twelve of thirty is 40% of intervals. The number of hits is unknown.' } }
    ],
    examples: {
      ask: 'Which method is being used?',
      intro: 'Eight descriptions. Decide which method each one is.',
      opts: ['Partial interval', 'Whole interval', 'Momentary time sampling'],
      items: [
        { s: 'A timer vibrates every 2 minutes. The teacher glances up and marks whether Jon is in his seat at that instant.', a: 2, why: 'Only the instant the interval ends is observed.' },
        { s: 'For each 15-second interval, the observer marks “yes” if rocking happened at all.', a: 0, why: 'Any occurrence earns the mark.' },
        { s: 'For each 30-second interval, a plus is given only if Kim was writing for the entire 30 seconds.', a: 1, why: 'The behavior must fill the interval.' },
        { s: 'Every 5 minutes an aide looks at each of four students in turn and notes who is working at that moment.', a: 2, why: 'A look at the end of each interval, for several students.' },
        { s: 'The plan wants to be sure not to underrate how often swearing occurs, and marks an interval for a single word.', a: 0, why: 'A single moment marks the interval; the estimate leans high.' },
        { s: 'The goal is to increase quiet reading. An interval is credited only when reading never stopped.', a: 1, why: 'A strict rule for behavior to be built up.' },
        { s: 'A 10-second interval is marked because Lee tapped the desk once at second 7.', a: 0, why: 'One occurrence within the interval.' },
        { s: 'At each chime the observer notes whether Mo is talking with a peer right then. What happened between chimes is not recorded.', a: 2, why: 'Only the moment of the chime.' }
      ]
    },
    practice: {
      title: 'Score six intervals three ways',
      intro: 'Nico, a simulated student, is observed for six 10-second intervals. The log shows when he was out of his seat. Score it as each method requires.',
      planT: 'Out of seat',
      plan: ['Interval 1 (0 to 10 s): out for the whole interval.', 'Interval 2 (10 to 20 s): out from second 10 to second 13, then seated.', 'Interval 3 (20 to 30 s): seated throughout.', 'Interval 4 (30 to 40 s): seated until second 38, then out, and still out at second 40.', 'Interval 5 (40 to 50 s): out for the whole interval.', 'Interval 6 (50 to 60 s): out until second 52, then seated.'],
      ask: 'What is the result?',
      word: 'Question',
      steps: [
        { t: 'Partial interval', see: 'How many of the six intervals are marked?', opts: ['2', '4', '5'], a: 2, why: 'Out of seat happened at some time in intervals 1, 2, 4, 5 and 6.' },
        { t: 'Whole interval', see: 'How many of the six intervals are marked?', opts: ['2', '3', '5'], a: 0, why: 'Only intervals 1 and 5 were filled from start to finish.' },
        { t: 'Momentary time sampling', see: 'You look at the last instant of each interval. How many are marked?', opts: ['2', '3', '5'], a: 1, why: 'He was out of seat at the end of intervals 1, 4 and 5.' },
        { t: 'The true amount', see: 'He was out of seat for about 27 of the 60 seconds, or 45%. Which method came closest?', opts: ['Partial interval, at 83%', 'Whole interval, at 33%', 'Momentary time sampling, at 50%'], a: 2, why: 'Partial leaned high and whole leaned low, as they do. Momentary sampling landed nearest.' },
        { t: 'Reporting', see: 'How do you write the partial-interval result?', opts: ['Out of seat 5 times.', 'Out of seat in 83% of intervals (5 of 6), partial interval, 10-second intervals.', 'Out of seat for 50 seconds.'], a: 1, why: 'A percentage of intervals, with the method and the interval length so the reader knows how to take it.' },
        { t: 'Next week', see: 'A colleague prefers whole interval and offers to switch the sheet for you.', opts: ['Agree: it is less work.', 'Use both on alternate days.', 'Keep the method the plan names, and pass the suggestion to your supervisor.'], a: 2, why: 'Numbers from different methods cannot share a graph. Changing the method is the supervisor’s decision.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'In partial-interval recording, an interval is marked when the behavior:', opts: ['Fills the whole interval.', 'Happens at any time in the interval.', 'Is happening at the last instant.', 'Happens at least three times.'], a: 1, why: 'A moment is enough.' },
      { q: 'Partial-interval recording tends to:', opts: ['Overestimate how much of the time the behavior fills.', 'Underestimate it.', 'Give an exact count.', 'Measure latency.'], a: 0, why: 'A one-second instance marks the whole interval.' },
      { q: 'Whole-interval recording tends to:', opts: ['Overestimate.', 'Count instances.', 'Underestimate.', 'Be used for brief behavior.'], a: 2, why: 'Any break leaves the interval unmarked.' },
      { q: 'Whole-interval recording is usually chosen for behavior to be:', opts: ['Reduced.', 'Ignored.', 'Counted.', 'Increased.'], a: 3, why: 'A strict rule makes gains believable.' },
      { q: 'In momentary time sampling you observe:', opts: ['The whole interval.', 'Only the instant each interval ends.', 'The first second of each interval.', 'Every other interval.'], a: 1, why: 'A look at the end of the interval.' },
      { q: 'A teacher who must run a class and collect data on staying seated would most likely use:', opts: ['Duration of every instance.', 'Whole interval.', 'Momentary time sampling.', 'Interresponse time.'], a: 2, why: 'It asks for one look per interval.' },
      { q: 'Momentary time sampling is weakest for behavior that is:', opts: ['Brief and rare.', 'Long-lasting.', 'Easy to see.', 'Frequent and long.'], a: 0, why: 'A short behavior is unlikely to be happening at the instant of the look.' },
      { q: 'Interval data are reported as:', opts: ['A count of instances.', 'A rate per minute.', 'Total duration.', 'A percentage of intervals.'], a: 3, why: 'Marked intervals divided by all intervals.' },
      { q: 'A behavior was marked in 9 of 36 intervals. That is:', opts: ['9%', '25%', '36%', '4 times'], a: 1, why: 'Nine divided by thirty-six.' },
      { q: 'Why can interval marks not be read as a count?', opts: ['Because one mark may stand for one instance or many.', 'Because intervals are too long.', 'Because they are percentages already.', 'They can.'], a: 0, why: 'The number of instances inside an interval is not recorded.' },
      { q: 'Halfway through the month, the method is changed from partial to whole interval. The graph will show:', opts: ['A real improvement.', 'No change.', 'A drop that comes from the method, not from the student.', 'A rise.'], a: 2, why: 'Whole interval gives lower figures for the same behavior.' }
    ] },
    role: [
      { t: 'Interval recording, live', setup: 'The trainer plays a student for three minutes while a timer marks 10-second intervals. The trainee records partial interval; then the three minutes are repeated with momentary time sampling.',
        steps: ['Has the sheet and the interval timer ready before starting.', 'Marks each interval by the rule for the method in use.', 'Does not go back and change earlier intervals.', 'Works out the percentage of intervals.', 'Reports the method and the interval length with the result.'] }
    ],
    roleRule: 'Met when both recordings agree with the trainer’s on at least 16 of the 18 intervals.',
    discuss: [
      'Why might a school team prefer momentary time sampling even though it is less exact?',
      'What would you say to a parent who reads “40% of intervals” as “40 times”?'
    ],
    read: [
      'Powell, J., Martindale, A., & Kulp, S. (1975). An evaluation of time-sample measures of behavior. Journal of Applied Behavior Analysis, 8(4), 463–469.',
      'Fiske, K., & Delmolino, L. (2012). Use of discontinuous methods of data collection in behavioral intervention: Guidelines for practitioners. Behavior Analysis in Practice, 5(2), 77–81.'
    ]
  }
});
