/* nbh-learn-units-h.js (v26.01): written units of the Learning page, section H (the certification itself), units h1 and h2.
   The shape of a unit is described in nbh-learn-units.js. The people in every example are invented.
   The requirements described are those of the RBT Handbook of the Behavior Analyst Certification Board as it stood
   in late 2026, in the workstation's own words. They change; the handbook at bacb.com is the authority, and fees are
   left out here on purpose because they change most often. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  h1: {
    aim: [
      'Say what this training gives you and what it does not.',
      'Put the steps from training to active certification in order, with their time limits.',
      'Describe the examination: its length, its content areas and its rules.',
      'Prepare honestly and sensibly.'
    ],
    lesson: [
      { h: 'What you have when you finish here',
        p: ['Completing this training gives you one of the things the Behavior Analyst Certification Board (BACB) requires of an applicant: a certificate of a 40-hour training, signed by the trainer responsible for it. It is not a certification, it does not allow you to call yourself an RBT, and the BACB does not provide, approve or recommend any particular training.',
            'The training has its own time rule. The 40 hours must be completed in no fewer than 5 days and no more than 180 days, counting both the first and the last day. This page keeps that count for you on My record.'],
        check: { q: 'After finishing the 40-hour training, you may call yourself:',
          opts: ['An RBT.', 'A provisional RBT.', 'Someone who has completed a 40-hour behavior technician training.', 'BACB approved.'],
          a: 2, why: 'The training is one requirement among several. The title comes only with the active certification.' } },
      { h: 'The steps, in order',
        p: ['First, eligibility: you must be at least 18 and have completed high school or the equivalent, and you must pass a criminal background check and an abuse registry check, each no more than 180 days before you pay for your application. A certified person, called the Attesting Certificant, confirms these on a BACB form.',
            'Second, the 40-hour training. Third, after the training, the Initial Competency Assessment: an assessor watches you perform the tasks on the BACB’s assessment and signs it. It must be completed no more than 90 days before you submit your application.',
            'Fourth, the application, made in your own BACB account, with the training certificate, the attestation and the competency assessment uploaded. Fifth, once the application is approved, you schedule and sit the examination at a testing center. Sixth, after you pass, a qualified supervisor adds you as a supervisee in the BACB’s system; only then is the certification active.'],
        key: ['Eligibility: age, education, background and registry checks', '40-hour training (5 to 180 days)', 'Initial Competency Assessment (after training; within 90 days before applying)', 'Application in your BACB account', 'Examination', 'A supervisor adds you: active'],
        check: { q: 'The Initial Competency Assessment is completed:',
          opts: ['Before the 40-hour training.', 'After the examination.', 'At any time in the last five years.', 'After the 40-hour training and no more than 90 days before the application.'],
          a: 3, why: 'It follows the training and must be recent when you apply.' } },
      { h: 'The examination',
        p: ['The examination is taken on a computer at an authorized testing center, in English. You have 90 minutes for 85 multiple-choice questions, each with four options and one right answer. 75 of them are scored; 10 are unscored questions being tried out, and you cannot tell which.',
            'The questions follow the RBT Test Content Outline (3rd edition): data collection and graphing, 13 scored questions; behavior assessment, 8; behavior acquisition, 19; behavior reduction, 14; documentation and reporting, 10; ethics, 11. All questions count equally, and the result is pass or fail on the whole, not by area.',
            'You are given the result at the center. If you do not pass, you submit a retake application in your account and must wait 7 days before the next attempt; the handbook sets a limit on attempts within the year your authorization lasts.'],
        check: { q: 'How many questions on the examination count toward your result?',
          opts: ['85', '75', '100', '40'],
          a: 1, why: '75 are scored; 10 more are unscored and cannot be told apart.' } },
      { h: 'Preparing, and the rules',
        p: ['The BACB’s advice is plain: study the Test Content Outline, and the materials from your training and your competency assessment. It endorses no study guide. On this page, the map of each unit shows the outline’s task codes; the quizzes can be retaken, and your record shows which units you passed narrowly.',
            'Study by doing. For each task in the outline, can you define it, recognize an example, and say what you would do? The two largest areas are behavior acquisition and behavior reduction: together, 33 of the 75 scored questions.',
            'The code forbids cheating or helping others cheat on the competency assessment or the examination, and forbids collecting, using or passing on examination content. People who offer “real questions” are offering you a way to lose the certification. After you sit, you say nothing to anyone about what was asked.',
            'After you pass, the certification begins as inactive. You may not practice, bill or use the title until your supervisor has added you in the BACB’s system and the registry shows you as active.'],
        check: { q: 'A website sells “actual questions from this year’s RBT exam”. You:',
          opts: ['Buy them: everyone does.', 'Do not use them, and study the Test Content Outline instead.', 'Buy them and share them with your study group.', 'Use only the free sample.'],
          a: 1, why: 'Using or distributing examination content is a violation that can end a certification before it starts.' } }
    ],
    examples: {
      ask: 'Is this statement right?',
      intro: 'Eight statements about the path to certification. Decide whether each is right.',
      opts: ['Right', 'Not right'],
      items: [
        { s: '“I finished the 40 hours in three very long days, so I am done.”', a: 1, why: 'The training must take at least 5 days.' },
        { s: '“My background check was two months ago, so it is still within the limit.”', a: 0, why: 'It must be no more than 180 days before paying for the application.' },
        { s: '“I did my competency assessment before I started the training, to save time.”', a: 1, why: 'It comes after the training.' },
        { s: '“The examination has 85 questions and I get 90 minutes.”', a: 0, why: 'Of the 85, 75 are scored.' },
        { s: '“I passed yesterday, so I can start seeing clients as an RBT today.”', a: 1, why: 'The certification is inactive until a supervisor has added you.' },
        { s: '“If I fail, I have to wait a week before I can try again.”', a: 0, why: 'A retake application, and a 7-day wait.' },
        { s: '“The BACB approved this training course.”', a: 1, why: 'The BACB does not approve, provide or recommend trainings. A training is designed to meet its requirements and offered independently.' },
        { s: '“Ethics is one of the content areas on the examination.”', a: 0, why: '11 of the 75 scored questions.' }
      ]
    },
    practice: {
      title: 'Plan the dates',
      intro: 'Dara, a simulated trainee, is planning her path. Help her check each date.',
      ask: 'What is the answer?',
      steps: [
        { t: 'The training', see: 'Dara began the training on March 1 and wants to finish as fast as the rule allows.', ask: 'What is the earliest day she can complete it?', opts: ['March 3', 'March 5', 'March 6'], a: 1, why: 'At least 5 days, counting the first and the last: March 1, 2, 3, 4, 5.' },
        { t: 'The far limit', see: 'Life intervenes, and Dara studies slowly.', ask: 'How long does she have from her first day to finish the 40 hours?', opts: ['90 days', '180 days, counting the first and last day', 'One year'], a: 1, why: 'No more than 180 days.' },
        { t: 'The assessment', see: 'Dara finishes the training on May 10. Her assessor is free on May 2 or May 20.', ask: 'Which date can be used?', opts: ['May 2', 'May 20', 'Either'], a: 1, why: 'The Initial Competency Assessment comes after the training is complete.' },
        { t: 'Applying', see: 'The assessment is signed on May 20. Dara thinks of applying in October.', ask: 'Will the assessment still count?', opts: ['Yes', 'No: it must be within 90 days before the application', 'Only with a letter'], a: 1, why: 'By October more than 90 days will have passed. She should apply by mid-August, or the assessment must be done again.' },
        { t: 'After passing', see: 'Dara passes on July 8. Her employer schedules her first client for July 9. Her supervisor has not yet added her in the BACB’s system.', ask: 'May she work as an RBT on July 9?', opts: ['Yes', 'Yes, if she does not bill', 'No: not until she is added and shows as active'], a: 2, why: 'An inactive certification cannot be used in any way.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'The 40-hour training must be completed in:', opts: ['Any length of time.', 'At least 5 and at most 180 days.', 'Exactly 40 days.', 'At most 30 days.'], a: 1, why: 'Both the first and last day are counted.' },
      { q: 'An applicant must be at least:', opts: ['18 years old, with a high school education or the equivalent.', '21, with a college degree.', '16.', '18, with a bachelor’s degree.'], a: 0, why: 'The handbook’s eligibility requirements.' },
      { q: 'The background and abuse registry checks must be no more than:', opts: ['30 days old.', 'One year old.', '180 days before paying for the application.', 'Five years old.'], a: 2, why: 'And they are attested by a certified person.' },
      { q: 'The Initial Competency Assessment is done:', opts: ['Online, alone.', 'Before training.', 'By the family.', 'With an assessor, after the training.'], a: 3, why: 'An assessor observes and signs.' },
      { q: 'The examination allows:', opts: ['60 minutes.', '90 minutes.', '3 hours.', 'Unlimited time.'], a: 1, why: 'For 85 questions.' },
      { q: 'The content area with the most scored questions is:', opts: ['Behavior acquisition.', 'Ethics.', 'Behavior assessment.', 'Documentation and reporting.'], a: 0, why: '19 of 75.' },
      { q: 'The examination result is:', opts: ['A percentage by area.', 'A letter grade.', 'Pass or fail on the whole examination.', 'Sent by post after a month.'], a: 2, why: 'And it is given at the center.' },
      { q: 'After a failed attempt you must wait:', opts: ['24 hours.', '30 days.', '6 months.', '7 days, after submitting a retake application.'], a: 3, why: 'As the handbook sets out.' },
      { q: 'Immediately after passing, the certification is:', opts: ['Active.', 'Inactive until a supervisor adds you as a supervisee.', 'Provisional for a year.', 'Active for 30 days.'], a: 1, why: 'No practice until it is active.' },
      { q: 'Sharing what was on the examination is:', opts: ['A violation of the code.', 'Helpful to friends.', 'Allowed after 7 days.', 'Allowed in general terms.'], a: 0, why: 'Examination content may not be collected, used or distributed.' }
    ] },
    role: [
      { t: 'Explain your path', setup: 'The trainer plays a new employer who asks, “So are you an RBT now? When can you start?” The trainee has finished the training and nothing else.',
        steps: ['States accurately what has been completed.', 'Does not use the title.', 'Lists the remaining steps in order.', 'Says that work as an RBT begins only when the certification is active with a supervisor on record.'] }
    ],
    roleRule: 'Met when the explanation is given once with every step in place.',
    discuss: [
      'Which content areas of the examination do you feel least ready for? Which units will you repeat?',
      'Who will be your assessor and your supervisor, and what are the dates?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Handbook. bacb.com. Read the sections on eligibility, applying and the examination in full, in the current version.',
      'Behavior Analyst Certification Board. RBT Test Content Outline (3rd ed.). bacb.com.'
    ]
  },

  h2: {
    aim: [
      'Tell an active certification from an inactive or expired one, and say what each allows.',
      'Meet and document the monthly supervision requirement.',
      'Know what must be reported to the BACB, to your supervisor, and how fast.',
      'Describe how the certification is renewed.'
    ],
    lesson: [
      { h: 'Active, inactive, expired',
        p: ['Anyone can look you up on the BACB’s public registry, which shows your status and your supervisor. Active means you may practice, bill and use the title. Inactive means you may do none of those.',
            'A certification is inactive when no qualified supervisor is on record for you; during the reinstatement period after a missed renewal date; while a sanction is in place; or when you have asked for voluntary inactive status, which is available for up to two years to someone who is taking a break. Expired means the reinstatement period has run out: to return, you would meet the requirements then in force, apply again and retake the examination.',
            'The ethics code adds two habits. Check your BACB account regularly, monthly is the example it gives, to see that your details are right. And if your status changes, tell your supervisor within 24 hours and stop doing what the new status does not allow.'],
        check: { q: 'Your supervisor leaves the organization and removes you as a supervisee. No one else has added you. You:',
          opts: ['Carry on: it is an administrative detail.', 'Carry on, but do not sign notes.', 'May not practice, bill or use the title until a qualified supervisor is on record.', 'Have 30 days of grace.'],
          a: 2, why: 'With no supervisor on record the certification is inactive, immediately.' } },
      { h: 'Supervision, month by month',
        p: ['Unit G2 set out the requirement: at least 5% of your service hours supervised in each calendar month; at least two real-time, face-to-face contacts; observation of you with a client in at least one; at least one individual, the other individual or a small group of two to ten technicians. It applies at each organization where you work.',
            'You and your supervisor both keep the documentation, for at least seven years: the days and times you provided services, the dates and length of supervision, its format, the dates you were observed, and who supervised. The workstation’s RBT Supervision Log holds these.',
            'If you find the requirement is not being met, the handbook’s instruction is to report it to the BACB and to work out with your supervisor how to meet it from now on. Substantial non-compliance can end a certification. If you are not practicing, monthly supervision is not required, though the other requirements remain.'],
        check: { q: 'For how long must supervision records be kept?',
          opts: ['Until the next renewal.', 'One year.', 'At least seven years, by both technician and supervisor.', 'They need not be kept.'],
          a: 2, why: 'Even after the supervisory relationship has ended.' } },
      { h: 'What you must report',
        p: ['To the BACB, within 30 days of the event or of learning of it: events that could affect your ability to work safely or to meet the BACB’s requirements. The code lists legal charges and what follows from them; investigations by an employer, a government agency, an educational institution or a funder that name you; disciplinary actions by any of those, including suspension or dismissal for cause; and a physical or mental condition, or substance use, that may impair your ability to provide services safely. The handbook gives detail, including things that need not be reported, such as parking tickets and family court matters. When unsure, it advises reporting.',
            'Also to the BACB, within 30 days: changes to your name, address or email. And at once: any information you gave the BACB that you find was inaccurate.',
            'To your supervisor: any notice or required action you receive from the BACB, immediately; a change in your status, within 24 hours; and anything false or inaccurate you have given your supervisor or employer, as soon as you know.'],
        key: ['To the BACB within 30 days: charges, investigations, disciplinary actions, impairing conditions', 'To the BACB within 30 days: changes to your personal details', 'To your supervisor within 24 hours: a change of status', 'To your supervisor at once: any notice from the BACB'],
        check: { q: 'Your employer opens an investigation into a complaint that names you. You believe you did nothing wrong. You:',
          opts: ['Wait for the outcome before telling the BACB.', 'Self-report to the BACB within 30 days of learning of it.', 'Report only if you are found at fault.', 'Resign, so that it lapses.'],
          a: 1, why: 'Investigations naming you are reported when you learn of them, not when they conclude.' } },
      { h: 'Renewal',
        p: ['For anyone certified or recertified in 2026 or later, the certification runs in two-year cycles. In each cycle you must earn 12 professional development units. They can come from your organization’s in-service training on behavior-analytic service delivery, given by a certified behavior analyst there and not about one client’s program; from events run by the BACB’s authorized continuing education providers; or from behavior-analytic university courses. Each needs its documentation, entered in your BACB account.',
            'Supervision does not count as professional development, and the same event cannot be used for both. Units cannot be made up after the date or carried into the next cycle, and repeating the same training does not count again.',
            'The recertification application opens in your account within 45 days before your date, once the units are entered. Miss the date and the certification goes inactive, with a 30-day reinstatement period and a late fee, during which you may not practice. Miss that, and it expires.',
            'Requirements change, as they did in 2026. Read the current handbook each year, and keep your email address current so that the BACB’s notices reach you.'],
        check: { q: 'Which of these counts toward the 12 professional development units?',
          opts: ['Your monthly supervision meetings.', 'Training on one client’s new program.', 'An in-service training on prompting, given by your organization’s BCBA, with the BACB’s form completed.', 'The same workshop you counted last cycle.'],
          a: 2, why: 'General behavior-analytic training with documentation. Supervision, client-specific training and repeats do not count.' } }
    ],
    examples: {
      ask: 'Must this be self-reported to the BACB?',
      intro: 'Eight events in a technician’s life. Decide, from the code and the handbook, whether each must be self-reported to the BACB. When truly unsure, the handbook’s advice is to report.',
      opts: ['Yes: within 30 days', 'No'],
      items: [
        { s: 'You are charged with assault after an incident outside work.', a: 0, why: 'Legal charges are named in the code.' },
        { s: 'You receive a parking ticket.', a: 1, why: 'The handbook lists parking tickets among things that need not be reported.' },
        { s: 'Your employer dismisses you for falsifying session notes.', a: 0, why: 'A termination for cause, in response to an ethics violation.' },
        { s: 'You are laid off because the program lost its funding.', a: 1, why: 'A layoff that involves no ethics violation need not be reported.' },
        { s: 'A funder opens an investigation that names you, after a complaint about billing.', a: 0, why: 'Investigations naming you are reported within 30 days of learning of them.' },
        { s: 'You and your spouse begin divorce proceedings.', a: 1, why: 'Family court matters are listed as not reportable.' },
        { s: 'You move house and change your email address.', a: 0, why: 'Personal details in the BACB account are updated within 30 days.' },
        { s: 'You develop a health condition that is making it unsafe for you to work with clients, and you have no effective plan of care.', a: 0, why: 'A condition that impairs safe service delivery is reported.' }
      ]
    },
    practice: {
      title: 'Two years as a technician',
      intro: 'Follow Emre, a simulated technician, through a first cycle.',
      steps: [
        { t: 'Month 1', see: 'Emre has passed the examination. His employer says, “Start Monday; we’ll sort out the supervisor paperwork later.”', opts: ['Start Monday.', 'Explain that he cannot practice until a supervisor has added him and the registry shows him active, and ask for that to be done first.', 'Start, but sign as “technician”.'], a: 1, why: 'Inactive means no practice at all, whatever title is used.' },
        { t: 'Month 4', see: 'In the last week of the month Emre’s log shows 3 hours of supervision against 90 hours of service.', opts: ['Leave it: the supervisor is busy.', 'Tell his supervisor now that 1.5 more hours are needed this month.', 'Add 1.5 hours to an earlier entry.'], a: 1, why: '5% of 90 is 4.5 hours. He speaks while there is time; a false entry would be a serious violation.' },
        { t: 'Month 9', see: 'Emre receives an email from the BACB headed “RBT Supervision Audit”.', opts: ['Ignore it: probably routine.', 'Answer it himself and not trouble his supervisor.', 'Share it with his supervisor immediately and respond together.'], a: 2, why: 'The code asks that any required action from the BACB be shared with the supervisor at once.' },
        { t: 'Month 14', see: 'Emre moves to a new town and takes a second job with another organization.', opts: ['Update his address with the BACB within 30 days, and make sure he is supervised at both organizations.', 'Nothing needs doing.', 'Tell only his new employer.'], a: 0, why: 'Personal details within 30 days; supervision requirements apply at each organization.' },
        { t: 'Month 20', see: 'Emre has 7 professional development units entered. His supervisor says, “Your supervision hours will cover the rest.”', opts: ['Agree.', 'Point out, kindly, that supervision cannot count, and plan 5 more units from eligible events before the date.', 'Enter last year’s workshop a second time.'], a: 1, why: '12 units, none from supervision, none repeated, all within the cycle.' },
        { t: 'Month 23', see: 'The recertification application has opened in his account.', opts: ['Submit it now, well before the date.', 'Wait until the day after the date: there is a 30-day period anyway.', 'Wait for a reminder by post.'], a: 0, why: 'After the date the certification is inactive, he cannot practice, and a late fee applies.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'With an inactive certification you may:', opts: ['Practice but not bill.', 'Not practice, bill or represent yourself as an active RBT.', 'Practice under another title.', 'Practice for 30 days.'], a: 1, why: 'Inactive allows none of the three.' },
      { q: 'A certification with no supervisor on record is:', opts: ['Inactive.', 'Active.', 'Expired.', 'Suspended for a year.'], a: 0, why: 'It becomes active again when a qualified supervisor adds you.' },
      { q: 'A change in your certification status must be reported to your supervisor within:', opts: ['30 days.', 'A week.', '24 hours.', 'The month.'], a: 2, why: 'Standard 3.07.' },
      { q: 'Events such as legal charges or an investigation naming you are self-reported to the BACB within:', opts: ['24 hours.', '7 days.', 'One year.', '30 days.'], a: 3, why: 'Of the event, or of learning of it.' },
      { q: 'A notice from the BACB is:', opts: ['Kept private.', 'Shared with your supervisor immediately.', 'Answered after the next supervision cycle.', 'Ignored if you disagree.'], a: 1, why: 'Standard 3.06.' },
      { q: 'For those certified in 2026 or later, each cycle lasts:', opts: ['Two years, with 12 professional development units.', 'One year, with no requirements.', 'Five years.', 'Six months.'], a: 0, why: 'As the handbook sets out.' },
      { q: 'Which counts as professional development?', opts: ['Monthly supervision.', 'Training on one client’s plan.', 'An event from an authorized continuing education provider, with documentation.', 'Reading alone, undocumented.'], a: 2, why: 'One of the three eligible types.' },
      { q: 'If you miss the recertification date, you have:', opts: ['No way back.', 'A year to renew.', 'Nothing to do: it renews itself.', 'A 30-day reinstatement period with a late fee, during which you may not practice.'], a: 3, why: 'After that, the certification expires.' },
      { q: 'After expiry, returning requires:', opts: ['A phone call.', 'Meeting the current requirements, reapplying and retaking the examination.', 'Paying the late fee.', 'A supervisor’s letter.'], a: 1, why: 'The certification has to be earned again.' },
      { q: 'You discover that you gave the BACB inaccurate information. You:', opts: ['Contact the BACB immediately to correct it.', 'Wait for an audit.', 'Hope it is not noticed.', 'Tell a colleague.'], a: 0, why: 'Standard 3.02.' },
      { q: 'Voluntary inactive status can last up to:', opts: ['30 days.', 'Six months.', 'Two years.', 'Ten years.'], a: 2, why: 'For a technician who is taking a break, requested before the date is missed.' }
    ] },
    role: [
      { t: 'A status question', setup: 'The trainer plays an employer who asks the trainee to keep seeing clients for “just two weeks” while a replacement supervisor is found.',
        steps: ['Says clearly that without a supervisor on record they may not practice, bill or use the title.', 'Does not agree to work under another title.', 'Asks what can be done to get a qualified supervisor on record.', 'Says what they will document and whom they will tell.'] }
    ],
    roleRule: 'Met when the conversation is held once with every step in place.',
    discuss: [
      'Look yourself (or your trainer) up on the BACB’s registry. What does it show?',
      'Where will you keep your own supervision records for seven years?',
      'Which professional development would be most useful to you in your first cycle?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Handbook. bacb.com. Read the sections on certification maintenance, self-reporting, recertification and the inactive policy in full, in the current version.',
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Section 3. bacb.com.'
    ]
  }
});
