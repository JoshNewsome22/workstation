/* nbh-learn-units.js (v26.00): the written units of the Learning page (learn.html), by the unit ids of nbh-learn.js.
   A unit holds, in the order a learner meets them:
     aim       what the learner will be able to do
     lesson    segments (a heading, paragraphs, sometimes key points), each closed by one check question with its answer
               and the reason: the lesson is taught on the page, not assigned as reading
     watch     the workstation's videos for the unit: core ones (c: 1) and more, each with what to look for
     examples  examples and non-examples to sort, with the reason for each
     practice  a session to run by decisions: what you see, what you do, and why
     quiz      a pool of questions; some are drawn for each attempt; pass at the mark given
     role      role-plays the trainer scores (the trainer plays the student), step by step
     discuss   questions for the discussion the trainer leads
     report    what to tell the supervisor
     read      further reading (reading does not count toward training time)
   The people in every example are invented. Nothing here is about a student or a learner. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
/* the first unit written (v26.00); the others are in nbh-learn-units-*.js, a few to a file, each adding to this list */
Object.assign(window.NBH_LEARN_UNITS, {
  e8: {
    aim: [
      'Say what differential reinforcement is, and tell DRA, DRI, DRO, DRL and functional communication training apart.',
      'Run each one as a plan writes it: what earns the reinforcer, when, and what you do when the problem behavior happens.',
      'Explain what changes when a plan uses extinction and when it does not.',
      'Know what to record and what to tell your supervisor.'
    ],
    lesson: [
      { h: 'Two rules that work together',
        p: ['Differential reinforcement means reinforcing one behavior and not reinforcing another, or reinforcing it less. The plan writes both rules: what earns the reinforcer, and what does not.',
            'It lowers a behavior by making something else pay better. Because it adds reinforcement and takes nothing away, it is usually tried before any procedure that removes something or adds something unpleasant.',
            'Every version of it answers the same three questions. Read the plan until you can answer them without looking.'],
        key: ['What earns the reinforcer?', 'When is it given?', 'What do I do when the problem behavior happens?'],
        check: { q: 'Which sentence describes differential reinforcement?',
          opts: ['A reinforcer is given on a timer, whatever the student is doing.', 'One behavior is reinforced, and the reinforcer is withheld for another.', 'A privilege is taken away after the behavior.', 'Everything the student does is praised.'],
          a: 1, why: 'Differential means different results for different behavior. A reinforcer on a timer whatever the student does is noncontingent reinforcement; taking a privilege away is a punishment procedure.' } },
      { h: 'DRA, DRI and FCT: reinforce a named behavior',
        p: ['In differential reinforcement of alternative behavior (DRA) the plan names a behavior to build: raising a hand, doing the task, asking. That behavior earns the reinforcer. The problem behavior does not earn it, or earns less.',
            'Differential reinforcement of incompatible behavior (DRI) is a DRA whose alternative cannot be done at the same moment as the problem behavior. Sitting in the seat cannot happen together with running around the room.',
            'Functional communication training (FCT) is a DRA whose alternative is a way of communicating: a word, a sign, a card, a button on a device. It earns the very thing the problem behavior used to get. So your supervisor first finds out, with an assessment, what the problem behavior gets; then the request is taught, usually with prompts that are faded.',
            'An alternative only competes if it is easy. It should cost no more effort than the problem behavior and pay at least as fast and as well.'],
        check: { q: 'Dara hits when math begins. Her plan teaches her to hand over a break card, and the card earns a 2-minute break. Which procedure is this?',
          opts: ['DRO', 'DRL', 'Functional communication training', 'Noncontingent reinforcement'],
          a: 2, why: 'The alternative is a communication response (the card) and it earns what hitting used to get (a break from math). That is FCT, one kind of DRA.' } },
      { h: 'DRO: reinforce the absence',
        p: ['In differential reinforcement of other behavior (DRO) the reinforcer is given when the problem behavior has not happened. No particular behavior is asked for in its place.',
            'In an interval DRO the behavior must be absent for the whole interval. In a momentary DRO you look at the moment the interval ends, and the behavior must be absent at that moment.',
            'In a resetting DRO the timer starts over each time the behavior happens. In a non-resetting DRO the timer runs on: that interval’s reinforcer is lost and the next interval starts on time. The intervals can be fixed (always 2 minutes) or variable (2 minutes on average).',
            'Your supervisor sets the first interval from the baseline data, shorter than the usual time between one instance and the next, so the student earns often from the first day. It is lengthened only as the data allow.',
            'A DRO teaches no replacement, and whatever the student happens to be doing when the interval ends is what gets reinforced. That is why many plans add a list of other behaviors that also hold back the reinforcer, or pair the DRO with teaching a skill.'],
        check: { q: 'You are running a 5-minute resetting DRO. At 3:40 the problem behavior happens. What do you do?',
          opts: ['Let the timer run and give the reinforcer at 5:00.', 'Set the timer back to 5:00 and give no reinforcer for this interval.', 'Stop the timer for the rest of the session.', 'Give the reinforcer now so the student calms down.'],
          a: 1, why: 'Resetting means the interval starts over each time the behavior happens. The student earns the reinforcer after the next full 5 minutes without it.' } },
      { h: 'DRL: less of it, not none of it',
        p: ['Some behavior is fine in itself and only happens too often: asking “Is this right?” thirty times a period, calling out answers, sipping water. Differential reinforcement of low rates (DRL) reinforces doing it less.',
            'A full-session DRL gives the reinforcer at the end of the session if the count is at or under the limit. An interval DRL splits the session into intervals, each with its own limit. A spaced-responding DRL reinforces a response only when enough time has passed since the one before.',
            'Its mirror image, differential reinforcement of high rates (DRH), reinforces doing something at or above a set rate.'],
        check: { q: 'Mateo asks “Is this right?” about 30 times a period. His plan: 5 times or fewer in the period earns computer time. Which procedure is this?',
          opts: ['Full-session DRL', 'DRO', 'DRI', 'Spaced-responding DRL'],
          a: 0, why: 'Asking for help is not to be removed, only lowered, and the limit is counted over the whole period. In a DRO, one question would lose the reinforcer.' } },
      { h: 'When the problem behavior happens: with and without extinction',
        p: ['The plan says what you do. In some plans the problem behavior no longer earns its reinforcer at all: that is extinction, and you will meet it in the next unit. Behavior often gets worse for a while before it gets better. Keep to the plan, keep everyone safe, follow the crisis plan if it comes to that, and tell your supervisor the same day.',
            'In other plans extinction is left out, because it would be unsafe or cannot be done in that room. Then the problem behavior still earns something, and the alternative has to pay better: sooner, more of it, or a better kind.',
            'Adding extinction, or dropping it, is never yours to decide. Do what is written, and say what you see.'],
        check: { q: 'A plan says: finishing the task earns a 5-minute break with the tablet; problem behavior earns a 30-second break without it. The student throws the worksheet. What do you do?',
          opts: ['Keep the work in front of her until she is calm.', 'Give the 30-second break without the tablet, as written.', 'Give the 5-minute break with the tablet to calm her.', 'End the session.'],
          a: 1, why: 'This plan has no extinction: the problem behavior still earns a break, only a shorter and poorer one. Keeping the work in place would be escape extinction, which the plan did not choose.' } },
      { h: 'Doing it well',
        p: ['Have the reinforcer in reach before you start. Give it within a few seconds of the behavior or of the timer, every time the schedule calls for it, and say in plain words what earned it: “You asked for a break. Here it is.”',
            'Use a timer you can see. Do not estimate. Record as you go: each reinforcer given, each instance of the problem behavior, each prompt.',
            'Do not bargain during problem behavior. “If you stop screaming you can have the tablet” gives the reinforcer after screaming and teaches that screaming starts the offer.',
            'Longer intervals, more work for each break, fewer prompts: these are your supervisor’s decisions, made from your data.'],
        check: { q: 'A student is screaming. A helper says, “If you stop screaming you can have the tablet,” and hands it over when he stops. Why is this not DRA?',
          opts: ['Because a tablet cannot be a reinforcer.', 'Because the offer and the tablet follow the screaming, and no alternative named in a plan was reinforced.', 'Because DRA never uses items.', 'It is DRA: stopping is the alternative behavior.'],
          a: 1, why: 'The offer arrives during the problem behavior, so screaming is followed by the tablet a moment later. In DRA the reinforcer follows the alternative behavior the plan names, and is not offered in the middle of the problem behavior.' } },
      { h: 'What to tell your supervisor',
        p: ['You see the plan work, or not work, before anyone else does. Tell your supervisor, in observable terms and on the day, when any of these happens.'],
        key: ['The student earns almost every interval or every request: the schedule may be ready to change.', 'The student rarely earns: the interval may be too long or the alternative too hard.',
              'The reinforcer is refused or loses its pull.', 'The problem behavior rises, or a new one appears.', 'You could not run the plan as written, and why.'],
        check: { q: 'For three days the student has earned every interval of a 2-minute DRO. What do you do?',
          opts: ['Lengthen the interval to 4 minutes tomorrow.', 'Report the data to your supervisor, who decides whether to lengthen it.', 'Stop the DRO, since the behavior is gone.', 'Give a smaller reinforcer.'],
          a: 1, why: 'The data are a reason to look at the schedule, and the decision is the supervisor’s. Changing a plan yourself is outside the technician’s role.' } }
    ],
    watch: [
      { k: 'dra_attention', c: 1, look: 'What earns the praise, how soon it comes, and what the teacher does when the off-task behavior happens.' },
      { k: 'dra_escape', c: 1, look: 'The two breaks. Which one goes to the work, and why this plan needs no extinction.' },
      { k: 'dro_resetting', c: 1, look: 'The timer. What sets it back, and what the teacher says when the break is earned.' },
      { k: 'dro_momentary', c: 1, look: 'What the teacher checks at the moment the timer ends, and how the fixed and the variable checks differ.' },
      { k: 'fct-practical-guide-thinning', c: 1, look: 'How the card is prompted before problem behavior starts, how the prompt fades, and how fast each request is honored.' },
      { k: 'fct_thinning_mult', c: 1, look: 'How green and red tell the student when asking will work, and how the red time grows.' },
      { k: 'dra_tangible', look: 'What the coupons are earned for.' },
      { k: 'dra_automatic', look: 'How play earns free time for the behavior itself.' },
      { k: 'dro_class', look: 'The change from whole-interval to momentary checks in a classroom.' },
      { k: 'dro_tokens', look: 'How tokens stand in for the break, and how the student comes to run it.' },
      { k: 'fct_attention', look: 'The one plain reminder, and what follows it.' },
      { k: 'fct_tangible', look: 'The three steps: ask, then wait, then accept “no”.' }
    ],
    examples: {
      ask: 'Which procedure is this?',
      intro: 'Ten short scenes. For each, choose the procedure it shows. Four of them are not differential reinforcement at all: seeing why is half the skill.',
      opts: ['DRA', 'DRI', 'DRO', 'DRL', 'FCT', 'Not differential reinforcement'],
      items: [
        { s: 'For every 3 minutes without picking at her skin, Ines gets a sticker. If she picks, the timer starts again.', a: 2, why: 'The sticker depends on the absence of picking for the interval, and the timer resets: a resetting interval DRO.' },
        { s: 'Kofi leaves his seat and wanders. He now earns a point each time the teacher looks over and he is sitting in his seat.', a: 1, why: 'Sitting in the seat is named and reinforced, and it cannot happen together with wandering: DRI.' },
        { s: 'Lena grabs toys from classmates. She is taught to say “My turn, please.” Saying it gets her the toy; grabbing does not.', a: 4, why: 'The alternative is a request, and it earns what grabbing used to get: functional communication training.' },
        { s: 'A timer sounds every 2 minutes and the teacher gives Omar a minute of attention, whatever he is doing at that moment.', a: 5, why: 'The attention depends on the clock, not on behavior. This is noncontingent reinforcement, an antecedent intervention.' },
        { s: 'Priya calls out answers about 40 times a lesson. If she calls out 10 times or fewer, she picks the closing game.', a: 3, why: 'Calling out is to become less frequent, not to stop, and a count at or under the limit is reinforced: DRL.' },
        { s: 'Sam swears to get the aide’s attention. The aide now praises him whenever he is writing on his worksheet, and gives swearing no response.', a: 0, why: 'Writing is the named alternative and earns the attention; swearing no longer does. He could write and swear at once, so it is DRA and not DRI.' },
        { s: 'While Tomas cries on the floor, a helper says, “Stop crying and I’ll give you the tablet.” He stops and gets it.', a: 5, why: 'The offer comes during the problem behavior and the tablet follows it. No alternative from a plan was reinforced: this is bargaining.' },
        { s: 'At the moment the timer sounds, the teacher looks up. If Wen is not rocking right then, she gets a token.', a: 2, why: 'Only the moment the interval ends is checked: a momentary DRO.' },
        { s: 'Each time Yusuf shouts, he loses a minute of recess.', a: 5, why: 'Something is taken away after the behavior. That is response cost, a punishment procedure, and nothing is reinforced.' },
        { s: 'Zoe bites her hand when she is asked to write. She is prompted to touch a “Help” picture. Touching it brings help at once.', a: 4, why: 'A communication response is prompted and earns what the biting used to bring: FCT.' }
      ]
    },
    practice: {
      nav: 'Run a session', good: 'You ran the plan as written. The quiz is next.', again: 'Run it again. The plan answers every one of these decisions: read it before each choice.',
      title: 'Run a DRO session',
      intro: 'You are the technician. Jonah is a simulated student. Read his plan, then make each decision as the session goes on.',
      plan: ['Behavior: tearing paper (any tear in a worksheet or book).', 'DRO, 2 minutes, resetting. The timer is where Jonah can see it.',
             'Each interval without tearing: one token on his board, at once, with “You kept your paper whole.”', 'Three tokens: 3 minutes of drawing, right away. The DRO timer waits during drawing and starts again at 2:00.',
             'If he tears: take the torn pieces away, say nothing about it, set the timer back to 2:00.', 'Any other unsafe behavior: keep everyone safe, record it, tell your supervisor the same day.'],
      steps: [
        { t: 'Before you start', see: 'Jonah is coming in from recess.', opts: ['Start the timer and fetch the tokens when the first one is needed.', 'Put the tokens, the board, the drawing things and the data sheet in reach, and set the timer to 2:00.', 'Explain the whole plan to Jonah for five minutes.'], a: 1,
          why: 'A token that arrives late is a weaker token. Everything is in reach before the first interval starts.' },
        { t: '2:00', see: 'The timer sounds. Jonah has been writing. No tearing.', opts: ['Give one token now, say “You kept your paper whole,” and start the timer again.', 'Wait until he finishes his sentence, then give the token.', 'Give two tokens, because he also worked hard.'], a: 0,
          why: 'One token, at once, with the words the plan gives, and the next interval starts right away. Extra tokens for working are not in this plan.' },
        { t: '3:10', see: 'Jonah tears a corner off his worksheet.', opts: ['Say, “No tearing. Now you have lost your token.”', 'Let the timer run: it was only a corner.', 'Take the torn piece away without a word and set the timer back to 2:00.'], a: 2,
          why: 'Any tear counts, and the plan says what follows: pieces away, no comment, timer back to 2:00. A reprimand is attention the plan did not write.' },
        { t: '4:20', see: 'Jonah says, “I’m not tearing now. Can I have my token?” The timer shows 0:50 left.', opts: ['Give it: he asked politely.', 'Point to the timer: the token comes when it sounds.', 'Set the timer back to 2:00.'], a: 1,
          why: 'The token is earned by the whole interval. Giving it for asking would reinforce asking. Asking is not tearing, so nothing resets.' },
        { t: '5:10', see: 'The timer sounds. No tearing in this interval. Jonah has his head on the desk and has not worked.', opts: ['Give the token: the rule is no tearing.', 'Hold the token until he works.', 'Set the timer back, because he is off task.'], a: 0,
          why: 'A DRO reinforces the absence of the behavior it names. He met the rule. That he was not working is worth telling your supervisor, who may add a rule for work.' },
        { t: '7:10', see: 'The timer sounds. No tearing. This is his third token.', opts: ['Give the token and keep the drawing for the end of the day.', 'Give the token, then make him finish the worksheet before drawing.', 'Give the token, trade the three tokens for 3 minutes of drawing now, and start the timer at 2:00 afterward.'], a: 2,
          why: 'The exchange is “right away”. A trade that is delayed or has a new condition attached teaches that the tokens are worth less.' },
        { t: '12:40', see: 'Back at work, Jonah tears his page in two, then throws his pencil at the wall. Nobody is hit.', opts: ['Set the timer back for the tear, record both, and tell your supervisor today about the throwing.', 'Take a token away for the throwing.', 'Ignore the throwing and leave it out of the record: it is not the behavior in the plan.'], a: 0,
          why: 'The tear resets the timer. Throwing is not in the DRO rule, and a token fine is not in the plan; it is recorded and reported so the supervisor can decide what the plan needs.' },
        { t: 'After the session', see: 'Jonah earned 11 of 13 intervals, as in the last four sessions. A co-worker says, “Go to 5 minutes tomorrow.”', opts: ['Go to 5 minutes tomorrow.', 'Go to 3 minutes: a smaller step is safe.', 'Give your supervisor the numbers and keep 2 minutes until told otherwise.'], a: 2,
          why: 'The numbers are a good reason to lengthen the interval, and that is the supervisor’s decision. Your part is accurate data, on time.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Differential reinforcement always involves:', opts: ['Reinforcing one behavior and withholding or reducing reinforcement for another.', 'Taking away a preferred item after problem behavior.', 'Giving reinforcers on a timer.', 'Ignoring the student.'], a: 0, why: 'Two rules together: one behavior earns the reinforcer, another does not or earns less.' },
      { q: 'The main difference between DRA and DRO is that:', opts: ['DRA uses tokens and DRO uses praise.', 'DRA names a behavior to reinforce; DRO reinforces the absence of the problem behavior.', 'DRO always includes extinction and DRA never does.', 'DRA is for young children only.'], a: 1, why: 'DRA builds a named behavior. DRO asks only that the problem behavior not happen.' },
      { q: 'What makes a DRA a DRI?', opts: ['The alternative is a spoken request.', 'The alternative cannot be done at the same time as the problem behavior.', 'The reinforcer is given on a variable schedule.', 'The problem behavior is punished.'], a: 1, why: 'Incompatible means the two cannot happen together.' },
      { q: 'What makes a DRA functional communication training?', opts: ['The alternative is a communication response that earns what the problem behavior used to get.', 'It is run during a functional analysis.', 'It uses a timer.', 'The student must speak in sentences.'], a: 0, why: 'A request (a word, sign, card or device) is taught and it earns the same reinforcer. Speech is not required.' },
      { q: 'In a resetting DRO, when the problem behavior happens you:', opts: ['Pause the timer.', 'Start the interval over.', 'Give the reinforcer early.', 'End the session.'], a: 1, why: 'The interval starts again from the beginning each time the behavior happens.' },
      { q: 'In a momentary DRO you give the reinforcer if the behavior:', opts: ['Did not happen during the whole interval.', 'Happened fewer than five times.', 'Is not happening at the moment the interval ends.', 'Happened only once.'], a: 2, why: 'Only the moment the interval ends is checked.' },
      { q: 'DRL is the best match for a behavior that:', opts: ['Is dangerous and must stop at once.', 'Is acceptable but happens too often.', 'Has never happened.', 'Happens only at home.'], a: 1, why: 'DRL lowers a rate; it does not aim at zero.' },
      { q: 'In a spaced-responding DRL, a response is reinforced when:', opts: ['It is the first response of the day.', 'At least a set time has passed since the response before it.', 'The total for the session is under the limit.', 'It follows a prompt.'], a: 1, why: 'The time between responses is what the rule is about.' },
      { q: 'Every 4 minutes without shouting, Ana gets a point. Shouting sets the timer back. This is:', opts: ['DRA', 'Noncontingent reinforcement', 'A resetting DRO', 'DRL'], a: 2, why: 'The point depends on no shouting for the interval, and the timer resets.' },
      { q: 'A plan combines DRA with extinction. On the first days you should be ready for:', opts: ['The problem behavior to stop at once.', 'A temporary increase in the problem behavior.', 'The alternative behavior to disappear.', 'The reinforcer to stop working for good.'], a: 1, why: 'A burst is common when a behavior first stops earning its reinforcer. Keep to the plan, keep people safe, report it.' },
      { q: 'When a DRA is run without extinction, the reinforcement for the alternative behavior should be:', opts: ['The same as for the problem behavior.', 'Slower, so the student learns to wait.', 'Better: sooner, more, or of higher quality.', 'Given only at the end of the day.'], a: 2, why: 'Both behaviors still pay, so the alternative must pay better to win.' },
      { q: 'How soon after the behavior, or after the timer, should the reinforcer come?', opts: ['Within a few seconds.', 'Within about five minutes.', 'At the next break.', 'Whenever the session ends.'], a: 0, why: 'A delay weakens the link between the behavior and its result.' },
      { q: 'Who decides when a DRO interval gets longer?', opts: ['The technician, when the student is doing well.', 'The student.', 'The supervisor, from the data.', 'Whoever runs the session that day.'], a: 2, why: 'Changing a schedule changes the plan. The technician supplies accurate data.' },
      { q: 'A known limit of DRO is that it:', opts: ['Cannot be used in schools.', 'Does not teach a replacement behavior.', 'Needs two adults.', 'Works only with food.'], a: 1, why: 'It reinforces the absence of a behavior. Many plans pair it with teaching a skill.' },
      { q: 'A teacher gives attention every 3 minutes, whatever the student is doing. Why is this not differential reinforcement?', opts: ['Attention is not a reinforcer.', 'The reinforcer does not depend on any behavior.', 'Three minutes is too long.', 'It is: it is a DRO.'], a: 1, why: 'Reinforcement on the clock alone is noncontingent reinforcement.' },
      { q: 'During a DRA session you record:', opts: ['Only the problem behavior.', 'Only what went well.', 'Each reinforcer given, each instance of the problem behavior and each prompt.', 'Nothing until the end of the week.'], a: 2, why: 'The supervisor needs all three to judge the plan and to fade prompts and thin the schedule.' },
      { q: '“Stop kicking and you can have a cookie.” The problem with this is that:', opts: ['Cookies are unhealthy.', 'The offer comes during the problem behavior, so the behavior is followed by the offer and the cookie.', 'It is too generous.', 'There is no problem: it is DRA.'], a: 1, why: 'Bargaining in the middle of problem behavior tends to strengthen starting it.' },
      { q: 'A good alternative behavior for DRA or FCT is one that:', opts: ['Takes a long time to perform.', 'Is harder than the problem behavior.', 'Is easy and quick, and earns the same result.', 'Only the supervisor can prompt.'], a: 2, why: 'The alternative competes only if it costs no more and pays at least as well.' }
    ] },
    role: [
      { t: 'A resetting DRO, six 1-minute intervals', setup: 'The trainer plays the student and shows the behavior in two of the intervals, once near the end of one.',
        steps: ['Has the reinforcer, the timer and the data sheet in reach before starting.', 'Starts the timer as the session starts.', 'Gives the reinforcer within 5 seconds of the timer when the behavior did not happen.',
                'Says what earned it, in the plan’s words.', 'Starts the next interval at once.', 'When the behavior happens: sets the timer back, with no comment and no reinforcer.',
                'Records every interval and every instance.', 'Does not warn, bargain or remind about the reinforcer.'] },
      { t: 'DRA for attention', setup: 'The trainer plays a student who calls out for attention and sometimes raises a hand.',
        steps: ['Gives attention within 5 seconds of each raised hand.', 'Names the behavior in the praise.', 'Gives the calling out the response the plan writes, and nothing more.',
                'Turns back to the student as soon as the hand goes up after calling out.', 'Records each raised hand and each call.'] },
      { t: 'FCT: the break request', setup: 'The trainer plays a student at a hard task who starts to push the work away.',
        steps: ['Prompts the request as the plan says, before problem behavior starts.', 'Honors each request at once.', 'Times the break and ends it as the plan says.',
                'Fades the prompt as the plan says across the trials.', 'When problem behavior happens: does what the plan writes for it.', 'Records each request as prompted or independent.'] }
    ],
    roleRule: 'Met when every step of a role-play is done correctly, without help, in one run. Repeat with feedback until each of the three is met.',
    discuss: [
      'Think of a behavior you have seen at work. What might it get the person? What alternative could get the same thing, and how easy is it by comparison?',
      'When would a DRO be a poor choice? What would you want added to it?',
      'A teacher hands over the reinforcer during problem behavior “to calm him down”. What do you say in the moment, and what do you tell your supervisor?',
      'Withholding attention can feel unkind. What helps you stay with the plan, and what would tell you the plan itself needs a second look?'
    ],
    read: [
      'Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied behavior analysis (3rd ed.). Pearson. The chapter on differential reinforcement.',
      'Vollmer, T. R., & Iwata, B. A. (1992). Differential reinforcement as treatment for behavior disorders: Procedural and functional variations. Research in Developmental Disabilities, 13(4), 393–417.',
      'Tiger, J. H., Hanley, G. P., & Bruzek, J. (2008). Functional communication training: A review and practical guide. Behavior Analysis in Practice, 1(1), 16–23.',
      'Petscher, E. S., Rey, C., & Bailey, J. S. (2009). A review of empirical support for differential reinforcement of alternative behavior. Research in Developmental Disabilities, 30(3), 409–425.',
      'Jessel, J., & Ingvarsson, E. T. (2016). Recent advances in applied research on DRO procedures. Journal of Applied Behavior Analysis, 49(4), 991–995.'
    ]
  }
});
