/* nbh-learn-units-f.js (v26.01): written units of the Learning page, section F (Service delivery documentation and reporting),
   units f1 to f4. The shape of a unit is described in nbh-learn-units.js. The people in every example are invented.
   Laws are named as examples from the United States; the unit says throughout that the workplace's policy and the
   supervisor are the source for what applies. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  f1: {
    aim: [
      'Say what counts as confidential information about the people you serve.',
      'Share information only with those who need it for their work, under your supervisor’s direction.',
      'Store, carry and dispose of records as your workplace requires.',
      'Recognize a breach and report it at once.'
    ],
    lesson: [
      { h: 'What is confidential',
        p: ['Nearly everything you learn about a student through your work is confidential: the name, the diagnosis, the behavior plan, the data, photographs and video, what the family tells you, and the plain fact that the student receives services at all.',
            'Information can identify a person without a name. “The boy in third grade at Oak Street who bites” is enough for anyone who knows the school. Initials, a first name with a detail, or a photograph taken from behind can all point to one child.'],
        check: { q: 'Which of these is confidential?',
          opts: ['Only the diagnosis.', 'Only the written plan.', 'Only what the family asks you to keep private.', 'All of it, including the fact that the student receives services.'],
          a: 3, why: 'The duty covers everything learned in the course of the work, and identity itself.' } },
      { h: 'Where the rules come from',
        p: ['Three sources apply at once. The law: in the United States, health privacy law covers information held by health-care providers and insurers, and education privacy law covers school records; states and other countries have their own. Your workplace’s policies, which turn the law into daily procedures. And the RBT Ethics Code, which requires you to protect confidentiality and privacy, never to share identifying information on social media or websites, and to discuss confidential information only under your supervisor’s direction.',
            'You are not expected to interpret statutes. You are expected to know your workplace’s policy, follow it, and ask your supervisor whenever you are unsure whether something may be shared.'],
        check: { q: 'You are not sure whether a piece of information about a student may be shared with a new therapist who has phoned you. You:',
          opts: ['Share it: she is a professional.', 'Ask your supervisor before sharing anything.', 'Share only the diagnosis.', 'Ask the student.'],
          a: 1, why: 'Sharing outside the team needs the guardian’s permission, which the supervisor handles.' } },
      { h: 'Need to know',
        p: ['Inside the team, share only what a person needs in order to do their part, with the people who have a role in the student’s program. The classroom teacher needs to know how to respond to the behavior. The parent of another child, the school secretary and your own family do not need to know anything.',
            'Outside the team, nothing is shared without the guardian’s written permission. That includes other professionals, relatives who are not guardians, and people who say they have a right to know. Refer every such request to your supervisor.',
            'There are limits to confidentiality that protect people: a report of suspected abuse or neglect, an emergency in which someone’s safety is at risk, a court’s order. Your supervisor and workplace policy guide you through these.'],
        check: { q: 'A student’s grandmother, who is not the guardian, stops you at pick-up and asks how he did today and what his diagnosis is. You:',
          opts: ['Tell her: she is family.', 'Tell her about today and not the diagnosis.', 'Say kindly that you cannot share information, and that she is welcome to ask the parents or the supervisor.', 'Give her the supervisor’s notes.'],
          a: 2, why: 'Without the guardian’s permission, nothing is shared, however reasonable the person and the question.' } },
      { h: 'Talking',
        p: ['Most breaches are spoken. Do not discuss students in corridors, staff rooms where others can hear, lifts, cafés, cars with other passengers, or at home. Do not tell a story “without names” to friends: details identify people, and the story is not yours.',
            'When you must talk about a student, choose a private place and the right listener. On the phone, check who is on the line and who can overhear you. In front of the student, speak to them, not about them.'],
        check: { q: 'Two colleagues are talking about a student’s home life in the school cafeteria. The right thing to do is to:',
          opts: ['Join in quietly.', 'Suggest moving the conversation somewhere private, or stopping it.', 'Listen but say nothing.', 'Add what you know.'],
          a: 1, why: 'Others can hear. Helping colleagues keep confidentiality is part of protecting the student.' } },
      { h: 'Paper, devices and pictures',
        p: ['Keep records where your workplace says: in a locked place, or in the approved electronic system. Data sheets are not left on desks, in unlocked cars or in a bag at a café. Carry only what you need for the day.',
            'Use only approved devices and accounts. Personal phones, personal email and ordinary text messages are not for student information unless your workplace has approved a secure way. Do not take photographs or video of students on your own phone. Lock screens. Never share a password.',
            'When records are no longer needed, they are destroyed in the way the workplace sets, usually shredding. The recycling bin is not it.'],
        check: { q: 'You want to show your supervisor how a student holds his pencil. You:',
          opts: ['Take a quick photograph on your own phone and text it.', 'Describe it, or use the recording method your workplace has approved, with the consent on file.', 'Post it in the staff group chat.', 'Email it from your personal account.'],
          a: 1, why: 'Images of students need consent and an approved, secure route. A personal phone and a text message are neither.' } },
      { h: 'Social media, and when something goes wrong',
        p: ['Never post anything that could identify a student or a family: no names, no photographs, no work samples, no “funny thing a kid said today” with details, no check-in at a family’s home. This holds in private groups and after you have left the job.',
            'If you lose a data sheet, send a message to the wrong person, leave a file open, or realize you said too much, tell your supervisor at once. A breach reported in the first hour can often be contained. One that is hidden cannot, and hiding it is a second failing.'],
        check: { q: 'You realize you left a student’s data binder on the bus an hour ago. You:',
          opts: ['Wait to see whether it turns up.', 'Recreate the data from memory and say nothing.', 'Tell your supervisor now.', 'Report it at the end of the week.'],
          a: 2, why: 'Prompt reporting lets the workplace act: contacting the bus company, informing the family, meeting any legal duty.' } }
    ],
    examples: {
      ask: 'Does this protect confidentiality?',
      intro: 'Ten everyday moments. Decide whether each protects the student’s confidentiality or breaches it, or risks doing so.',
      opts: ['It protects confidentiality', 'A breach, or a risk of one'],
      items: [
        { s: 'Data sheets are locked in the cabinet before you leave the room.', a: 0, why: 'Stored as required.' },
        { s: 'You tell your partner at dinner about “this kid, no names, who lives over the bakery and screams in the mornings”.', a: 1, why: 'The details identify him, and the story is not yours to tell.' },
        { s: 'A teacher asks in the corridor how the plan is going, and you say, “Let’s step into the office.”', a: 0, why: 'A private place, and a person with a need to know.' },
        { s: 'You text a colleague a photo of a student’s work, with his name on it, from your own phone.', a: 1, why: 'A personal device, an ordinary message, an identifying image.' },
        { s: 'A new therapist calls to ask for the behavior plan, and you refer her to your supervisor.', a: 0, why: 'Requests from outside go through the supervisor and the guardian’s permission.' },
        { s: 'The data clipboard is left face up on a table in the cafeteria while you fetch water.', a: 1, why: 'Anyone passing can read it.' },
        { s: 'You shred last year’s duplicate data sheets in the office shredder, as the policy says.', a: 0, why: 'Proper disposal.' },
        { s: 'You post in a closed professional group: “My 7-year-old client at Lincoln Elementary finally said his first word!”', a: 1, why: 'Age and school identify the child, and identifying information never goes on social media.' },
        { s: 'You log out of the shared computer before leaving it.', a: 0, why: 'No one else can open the record.' },
        { s: 'Another parent asks why you follow one particular boy around, and you say, “He has autism and needs help.”', a: 1, why: 'A diagnosis and the fact of services were disclosed to someone with no right to them.' }
      ]
    },
    practice: {
      title: 'A week of small decisions',
      intro: 'Six moments from an ordinary week. Choose what you do.',
      steps: [
        { t: 'Monday', see: 'A classroom volunteer asks, “What’s wrong with Timo? Why does he have an aide?”', opts: ['“He has a behavior plan for aggression.”', '“I can’t talk about any student, but the teacher can tell you what volunteers need to know.”', '“Ask his mother, she’s lovely.”'], a: 1, why: 'Nothing about the student is shared, and she is pointed to the person who decides what volunteers are told.' },
        { t: 'Tuesday', see: 'Timo’s teacher, who carries out part of the plan, asks what to do when he pushes the table.', opts: ['Refuse: it is confidential.', 'Tell her the response the plan gives for that, as your supervisor has arranged for the team.', 'Give her the whole file to read at home.'], a: 1, why: 'She has a role in the plan and needs that part. The whole file at home is more than she needs, in an unsafe place.' },
        { t: 'Wednesday', see: 'You finish at one school and drive to the next with a binder of data on the passenger seat. You want to stop for lunch.', opts: ['Leave it on the seat: you will be ten minutes.', 'Take it with you, or lock it out of sight as your workplace’s policy says.', 'Leave it under your coat.'], a: 1, why: 'Records in a car are a known way to lose them. The policy says how they are carried.' },
        { t: 'Thursday', see: 'A friend who knows you work at the school sends a message: “Is the Rivera boy in your program? His mum is in my book club.”', opts: ['“Yes, but keep it quiet.”', '“I can’t say.” (which she will take as a yes)', '“I never talk about who I do or don’t work with.”'], a: 2, why: 'A flat rule, applied to everyone, gives nothing away. Even confirming that someone is served is a breach.' },
        { t: 'Friday morning', see: 'You find that yesterday you emailed your session note to the wrong parent.', opts: ['Email the wrong parent, asking her to delete it, and leave it there.', 'Tell your supervisor at once.', 'Hope she does not open it.'], a: 1, why: 'This is a breach with duties attached. The supervisor and the workplace decide who is contacted and how.' },
        { t: 'Friday afternoon', see: 'Timo tells you his father hit him with a belt last night, and you see a mark on his arm.', opts: ['Promise him you will tell nobody.', 'Follow your workplace’s mandated-reporting procedure today, and inform your supervisor.', 'Phone his father to ask about it.'], a: 1, why: 'Protecting a child outranks confidentiality. You report a suspicion; you do not investigate, and you do not promise secrecy.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Confidential information includes:', opts: ['Only medical records.', 'Anything that identifies a person as receiving services, and what you learn in serving them.', 'Only what is written down.', 'Only what the supervisor marks as confidential.'], a: 1, why: 'The duty is broad.' },
      { q: 'A person can be identified:', opts: ['By details, even without a name.', 'Only by full name.', 'Only by a photograph of the face.', 'Only by an ID number.'], a: 0, why: 'A school, an age and a detail are often enough.' },
      { q: '“Need to know” means sharing:', opts: ['Everything with everyone at the workplace.', 'Nothing with anyone.', 'Only what a person needs to do their part in the student’s program.', 'Whatever is asked for.'], a: 2, why: 'The minimum necessary, to those with a role.' },
      { q: 'Information goes to someone outside the team only:', opts: ['If they are a professional.', 'If they seem trustworthy.', 'If they are a relative.', 'With the guardian’s written permission, handled by the supervisor.'], a: 3, why: 'Consent comes first.' },
      { q: 'The RBT Ethics Code says identifying information about clients on social media is:', opts: ['Allowed in private groups.', 'Never allowed.', 'Allowed with initials.', 'Allowed after the case closes.'], a: 1, why: 'There is no exception for closed groups or the passage of time.' },
      { q: 'You may discuss confidential client information:', opts: ['Under your supervisor’s direction, or where the law allows for a valid reason such as protecting someone from harm.', 'With friends, without names.', 'With any school employee.', 'Whenever it would help.'], a: 0, why: 'This is the code’s standard.' },
      { q: 'The best place to discuss a student’s program is:', opts: ['The corridor.', 'The cafeteria.', 'A private space, with someone who has a role in it.', 'A group chat.'], a: 2, why: 'Private and with the right listener.' },
      { q: 'Student photographs on your personal phone are:', opts: ['Fine if deleted later.', 'Fine if the student agrees.', 'Fine if the face is hidden.', 'Not allowed unless your workplace has approved the method and consent is on file.'], a: 3, why: 'Images need consent and a secure, approved route.' },
      { q: 'Old records are disposed of by:', opts: ['Putting them in the recycling.', 'The method your workplace sets, such as shredding.', 'Taking them home.', 'Leaving them in the classroom.'], a: 1, why: 'Disposal is part of keeping records safe.' },
      { q: 'You discover a breach of confidentiality that you caused. You:', opts: ['Report it to your supervisor immediately.', 'Fix it quietly.', 'Wait to see whether anyone notices.', 'Tell the family yourself and no one else.'], a: 0, why: 'The workplace has duties it can meet only if it knows.' },
      { q: 'A limit to confidentiality is:', opts: ['Curiosity.', 'A request from a neighbor.', 'A mandated report of suspected abuse or neglect.', 'A relative’s concern.'], a: 2, why: 'Protecting a person from harm overrides it, by law.' },
      { q: 'A parent asks for a copy of the full record. You:', opts: ['Print it for them.', 'Refuse and say it is secret.', 'Email it from your phone.', 'Refer the request to your supervisor.'], a: 3, why: 'Access to records follows a procedure the supervisor manages.' },
      { q: 'Passwords to the data system are:', opts: ['Shared with trusted colleagues.', 'Never shared.', 'Written on the binder.', 'The same for everyone.'], a: 1, why: 'Each person’s access is their own.' },
      { q: 'After you leave a job, the duty of confidentiality:', opts: ['Continues.', 'Ends.', 'Lasts one year.', 'Depends on how you left.'], a: 0, why: 'What you learned remains confidential.' }
    ] },
    role: [
      { t: 'Three people who ask', setup: 'The trainer plays, in turn, a curious parent of another child, a relative who is not the guardian, and a teacher on the student’s team. Each asks about the student.',
        steps: ['Shares nothing with the other parent, politely, and without confirming that the student is served.', 'Shares nothing with the relative, and points them to the guardians or the supervisor.', 'Moves the conversation with the teacher to a private place.', 'Gives the teacher only what her role needs.',
                'Says what they would tell the supervisor afterwards.'] }
    ],
    roleRule: 'Met when all three conversations are handled with every step in place.',
    discuss: [
      'Where in your workplace are students most often talked about where others can hear?',
      'What would you say to a friend who asks about your work in a way that makes it hard to refuse?',
      'Which of your own habits with phones and paper would you change after this unit?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 2.08, 2.09 and 2.10. bacb.com.',
      'Cavalari, R. N. S., Gillis, J. M., Kruser, N., & Romanczyk, R. G. (2015). Digital communication and records in service provision and supervision: Regulation and practice. Behavior Analysis in Practice, 8(2), 176–189.'
    ]
  },

  f2: {
    aim: [
      'Say what a session note is for and who reads it.',
      'Include what a note needs: when, where, who, what was done, what the student did, anything unusual.',
      'Write in objective language, with numbers.',
      'Write it on time, correct it properly, and never record what did not happen.'
    ],
    lesson: [
      { h: 'Why a note is written',
        p: ['A session note is the record that a service was delivered and what happened in it. Your supervisor reads it to follow the case between visits. The next technician reads it to know where to start. The family, the school, a funder or an auditor may read it. In a dispute, it may be read by a court.',
            'So a note has to make sense to someone who was not there, perhaps years later. The working rule in every service profession is the same: if it is not documented, it did not happen.'],
        check: { q: 'Who might read your session note?',
          opts: ['Only you.', 'Only your supervisor.', 'Your supervisor, colleagues, the family, a funder or an auditor.', 'Nobody: it is a formality.'],
          a: 2, why: 'It is part of the student’s record, with many possible readers.' } },
      { h: 'What goes in',
        p: ['The details differ by workplace and funder, and yours will have a form. The usual contents are: the date, the start and end time and the place; who was present; which programs and procedures were run; how the student responded, with the data; any problem behavior, with what came before it, what happened and what you did; anything unusual about the day; anything the family or teacher told you; and your name, credential and signature.',
            'Notes do not repeat the whole plan and do not contain other students’ names.'],
        key: ['When, where, who', 'What was run', 'How the student responded, with numbers', 'Behavior and how it was handled', 'Anything unusual; anything reported to you', 'Your name and credential'],
        check: { q: 'Which of these does not belong in a session note?',
          opts: ['The start and end time.', 'The data for each program run.', 'The name of another student who was in the room.', 'What the parent reported at drop-off.'],
          a: 2, why: 'Another student’s identity is that student’s confidential information.' } },
      { h: 'Objective language',
        p: ['Write what a camera and a microphone would have recorded. “He threw the pencil at 10:15 and left his seat for 3 minutes” is objective. “He was angry and defiant” is your interpretation; another reader cannot check it, and it may be wrong.',
            'Three habits help. Use action words: said, hit, completed, left, cried. Use numbers: 8 of 10, 3 minutes, twice. And when you report what someone told you, say who and quote or attribute it: “Mother reported that he slept about four hours.”',
            'Leave out feelings you guess at, labels, sarcasm, blame and anything about the family’s character. If you believe something matters and you did not observe it, tell your supervisor directly.'],
        check: { q: 'Which sentence is objective?',
          opts: ['“She had a rough session and did not want to be there.”', '“She was lazy today.”', '“She completed 4 of 10 trials, pushed the materials away 6 times and said ‘no’ each time.”', '“Mom obviously did not give her breakfast.”'],
          a: 2, why: 'Actions and counts that anyone present would agree on.' } },
      { h: 'Specific and complete',
        p: ['“Ran programs, good session” tells the reader nothing. “Ran matching (9 of 10 independent), requesting (6 requests, 4 independent) and hand washing (5 of 7 steps independent). No problem behavior” takes ten more seconds and can be used.',
            'Completeness matters as much. If a program was not run, say so and why. If the session ended early or started late, record the real times and the reason. A note that looks tidier than the session was is a false note.'],
        check: { q: 'One of the three planned programs was not run because the materials were missing. In the note you:',
          opts: ['Leave it out.', 'Write that it was not run, and why.', 'Write that it was run, with yesterday’s data.', 'Write “all programs run”.'],
          a: 1, why: 'The reader needs to know what was not done, and the supervisor needs to know about the materials.' } },
      { h: 'On time',
        p: ['Write the note on the day of the session, as soon after it as your workplace requires. Memory fades within hours, and notes written days later from memory are less accurate however careful you are.',
            'If a note is late, it is written and marked as a late entry with the date it was actually written. It is never dated back to look as though it was written on time.'],
        check: { q: 'You forgot to write Tuesday’s note and it is now Thursday. You:',
          opts: ['Write it and date it Tuesday.', 'Skip it.', 'Write it now, mark it as a late entry with today’s date, and tell your supervisor.', 'Copy Wednesday’s note.'],
          a: 2, why: 'A late entry that says it is late is honest. A backdated note is falsification.' } },
      { h: 'Corrections',
        p: ['Everyone makes mistakes in notes. What matters is how they are corrected. On paper: one line through the error so it can still be read, the correction beside it, your initials and the date. No correction fluid, no scribbling out, no torn pages. In an electronic system: use its correction or addendum function, which keeps the original.',
            'Never change someone else’s note, and never change your own after it has been submitted without using the proper method. A record whose history cannot be seen cannot be trusted.'],
        check: { q: 'You wrote “12 trials” and it should be “10 trials”, on a paper note. You:',
          opts: ['Cover it with correction fluid.', 'Draw one line through it, write 10, and add your initials and the date.', 'Tear out the page and rewrite it.', 'Leave it: it is close enough.'],
          a: 1, why: 'The original stays readable, and the correction is identified and dated.' } },
      { h: 'Honesty',
        p: ['A note states what happened and nothing else. Writing up a session that did not take place, lengthening the times, recording data that were not collected, or signing for another person is falsification. Where notes support billing, it is also fraud, with legal consequences for you and for the organization.',
            'The ethics code requires accurate documentation, including data and billing records. If you are ever asked to record something untrue, or to change a record improperly, do not do it; tell your supervisor, and if the request comes from your supervisor, go to the next person your workplace names.'],
        check: { q: 'A session ended 20 minutes early because the student was ill. A colleague says, “Just put the full hour, it’s easier for billing.” You:',
          opts: ['Put the full hour.', 'Put the full hour and note that the student was ill.', 'Leave the times blank.', 'Record the real times and the reason.'],
          a: 3, why: 'The real times are the only ones that may be recorded. Anything else is a false record and may be billing fraud.' } }
    ],
    examples: {
      ask: 'Is this sentence objective?',
      intro: 'Ten sentences from session notes. Decide whether each is objective or subjective.',
      opts: ['Objective', 'Subjective'],
      items: [
        { s: '“Asked for a break 3 times using his card; each request was honored.”', a: 0, why: 'Actions and a count.' },
        { s: '“Was in a terrible mood all morning.”', a: 1, why: 'A mood is an interpretation.' },
        { s: '“Cried for 4 minutes after the tablet was put away (10:20 to 10:24).”', a: 0, why: 'A behavior with its duration and what came before.' },
        { s: '“Clearly did not get enough sleep.”', a: 1, why: 'A guess about a cause.' },
        { s: '“Father reported at drop-off that she woke at 4:00 a.m.”', a: 0, why: 'A report, attributed to its source.' },
        { s: '“Was being manipulative to get out of work.”', a: 1, why: 'A label and an intention nobody observed.' },
        { s: '“Named 8 of 10 pictures without a prompt.”', a: 0, why: 'A count of observed responses.' },
        { s: '“Had a great session!”', a: 1, why: 'A judgment with no information in it.' },
        { s: '“Hit the table with an open hand twice during writing; no one was touched.”', a: 0, why: 'What happened, how often and with what result.' },
        { s: '“The teacher does not seem to care about the plan.”', a: 1, why: 'An opinion about a person, which does not belong in a note.' }
      ]
    },
    practice: {
      title: 'Write today’s note',
      intro: 'You have just finished a session with Vera, a simulated student. Choose how each part of the note should read.',
      ask: 'Which do you write?',
      word: 'Part',
      steps: [
        { t: 'Time', see: 'The session was booked for 9:00 to 10:00. Vera arrived at 9:10 and you finished at 10:00.', opts: ['9:00 to 10:00', '9:10 to 10:00; started late: Vera arrived at 9:10.', '1 hour'], a: 1, why: 'The real times, with the reason for the difference.' },
        { t: 'Programs', see: 'You ran matching and requesting. You did not run dressing, because the practice coat was missing.', opts: ['“Ran all programs.”', '“Ran matching and requesting.”', '“Ran matching and requesting. Dressing not run: practice coat missing.”'], a: 2, why: 'What was run, what was not, and why.' },
        { t: 'Data', see: 'Matching: 9 of 10 correct, all without prompts. Requesting: 7 requests, 5 without a model.', opts: ['“Matching 9/10 independent. Requesting: 7 requests, 5 independent, 2 after a model.”', '“Did well on both.”', '“Matching 90%, requesting fine.”'], a: 0, why: 'Numbers, with the level of help.' },
        { t: 'Behavior', see: 'At 9:40, when you put the bubbles away, Vera screamed and lay on the floor for about 2 minutes. You followed the plan: no comment, waited, then offered her request card.', opts: ['“Had a tantrum over the bubbles but got over it.”', '“9:40: when the bubbles were put away, screamed and lay on the floor, about 2 minutes. Response as in plan: no comment; request card offered when quiet; she handed it over.”', '“One incident, handled.”'], a: 1, why: 'What came before, what she did, how long, and what you did.' },
        { t: 'Something you were told', see: 'At drop-off Vera’s mother said, “She has been pulling at her ear since yesterday.”', opts: ['Leave it out: it is medical.', '“Possible ear infection.”', '“Mother reported at drop-off that Vera has been pulling at her ear since yesterday.”'], a: 2, why: 'You record what was reported and by whom. A diagnosis is not yours to make.' },
        { t: 'An opinion', see: 'You think the aide’s talking during the session distracted Vera.', opts: ['Write, “The aide ruined the session by chatting.”', 'Write what you observed: “An adult conversation took place 2 meters away from 9:20 to 9:35,” and raise your concern with your supervisor.', 'Write nothing and say nothing.'], a: 1, why: 'The observable fact goes in the note. The concern about a colleague goes to the supervisor.' },
        { t: 'An error', see: 'After submitting the electronic note you notice you typed “8 of 10” for matching.', opts: ['Leave it.', 'Ask a colleague with editing rights to overwrite it.', 'Use the system’s correction or addendum function to record the right figure.'], a: 2, why: 'The correction is made by you, in the way that keeps the history.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'A session note is:', opts: ['An optional courtesy.', 'Part of the student’s record of services.', 'A private diary.', 'Only for billing.'], a: 1, why: 'It documents that the service was delivered and what happened.' },
      { q: '“If it is not documented, …”', opts: ['“… it did not happen.”', '“… it does not matter.”', '“… it can be added next month.”', '“… the supervisor will remember.”'], a: 0, why: 'The record is what others can rely on.' },
      { q: 'A note should be written:', opts: ['At the end of the week.', 'When the supervisor asks.', 'On the day of the session, as your workplace requires.', 'Before the session.'], a: 2, why: 'Accuracy falls quickly with delay.' },
      { q: 'Objective writing describes:', opts: ['What you felt.', 'What the student must have been thinking.', 'What you would have liked to happen.', 'What could be seen and heard.'], a: 3, why: 'Observable events.' },
      { q: 'Which is the most useful sentence?', opts: ['“Good session.”', '“6 of 8 steps of hand washing independent; prompted at soap and at turning off the tap.”', '“Hand washing is coming along.”', '“Worked on hand washing.”'], a: 1, why: 'It gives numbers and where help was needed.' },
      { q: 'Information a parent gives you is written as:', opts: ['A report, attributed to the parent.', 'A fact you observed.', 'Your own conclusion.', 'Nothing: it is hearsay.'], a: 0, why: '“Mother reported that …”' },
      { q: 'A late note is:', opts: ['Dated as though it was written on time.', 'Not written.', 'Written, and marked as a late entry with the real date.', 'Written by someone else.'], a: 2, why: 'Honest lateness, not backdating.' },
      { q: 'An error on a paper note is corrected with:', opts: ['Correction fluid.', 'Heavy scribbling.', 'A new page, with the old one thrown away.', 'One line through it, the correction, your initials and the date.'], a: 3, why: 'The original remains readable.' },
      { q: 'Recording a session that did not take place is:', opts: ['A shortcut.', 'Falsification, and where it supports billing, fraud.', 'Acceptable if the session is made up later.', 'The supervisor’s responsibility only.'], a: 1, why: 'It is a false record with legal consequences.' },
      { q: 'A program was not run today. The note should:', opts: ['Say so, with the reason.', 'Omit it.', 'Show the last session’s data.', 'Say “all programs run”.'], a: 0, why: 'What was not done is information too.' },
      { q: 'Which word signals subjective writing?', opts: ['“Completed”', '“Said”', '“Seemed”', '“Left”'], a: 2, why: '“Seemed” introduces an impression.' },
      { q: 'Your opinion about a colleague’s conduct belongs:', opts: ['In the session note.', 'On social media.', 'In a message to the family.', 'In a conversation with your supervisor.'], a: 3, why: 'The note holds observed facts; concerns go to the supervisor.' },
      { q: 'You are asked to change a record to show something that did not happen. You:', opts: ['Do it once.', 'Refuse, and report it to your supervisor or to the next person your workplace names.', 'Do it and add a private note.', 'Ask the family what they prefer.'], a: 1, why: 'Accurate documentation is an ethical and a legal duty.' },
      { q: 'A note is signed with:', opts: ['Your name and credential.', 'The supervisor’s name.', 'Initials of whoever is available.', 'Nothing.'], a: 0, why: 'The writer is identified.' }
    ] },
    role: [
      { t: 'From a session to a note', setup: 'The trainer plays a student for a five-minute simulated session with one program, one incident and one remark from a “parent”. The trainee then writes the note on the workplace’s form or a blank sheet, in ten minutes.',
        steps: ['Records the date, the real start and end time, the place and who was present.', 'Names what was run and gives the data with the level of help.', 'Describes the incident: before, behavior, duration, response.', 'Attributes the parent’s remark to the parent.',
                'Uses no labels, guesses or opinions.', 'Signs with name and credential.'] }
    ],
    roleRule: 'Met when the note has every step in place and the trainer, who was there, finds nothing in it that did not happen.',
    discuss: [
      'Read one of your own recent notes as if you were a stranger. What would you not understand?',
      'Which subjective words do you reach for most? What would you write instead?',
      'What makes notes late where you work, and what would fix it?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.01, 2.02 and 3.02. bacb.com.',
      'Luna, O., & Rapp, J. T. (2019). Using a checklist to increase objective session note writing: Preliminary results. Behavior Analysis in Practice, 12(3), 622–626.'
    ]
  },

  f3: {
    aim: [
      'Name the kinds of event, apart from the plan, that can change a student’s behavior and progress.',
      'Record them in objective terms, with their source and date.',
      'Tell what must be reported at once from what goes in the day’s note.',
      'Stay inside your role: no diagnosing, no advice on medication.'
    ],
    lesson: [
      { h: 'Why they matter',
        p: ['A graph shows that something changed. It cannot show why. A sudden rise in problem behavior might mean the plan is failing, or that the student has an ear infection, a new medication, a week of broken sleep or a substitute teacher.',
            'Your supervisor can only tell these apart if someone has written them down. You are the person who sees the student most and hears most from families and teachers, so that someone is usually you.'],
        check: { q: 'Why does the supervisor need to know that a student started a new medication last week?',
          opts: ['Out of curiosity.', 'So that changes in the data are not put down to the plan when they may have another cause.', 'So the technician can adjust the dose.', 'It is not relevant.'],
          a: 1, why: 'Decisions about the plan depend on knowing what else changed.' } },
      { h: 'What to watch for',
        p: ['Health: illness, pain, injury, dental trouble, seizures, allergies, constipation, changes in eating or drinking. Sleep: short or broken nights, changes in routine. Medication: a new one, a stopped one, a changed dose or time, a missed dose, possible side effects such as drowsiness or agitation.',
            'Home and life: a house move, a new baby, a parent away, a bereavement, a change of carer. School and timetable: a substitute teacher, a new classroom, an assembly, a holiday, a changed bus, other therapies starting or stopping.',
            'You do not need to judge whether it mattered. If it is a change, and you saw it or were told it, record it.'],
        key: ['Health and pain', 'Sleep and eating', 'Medication', 'Home', 'Timetable and people'],
        check: { q: 'Which of these should be recorded as something that might affect progress?',
          opts: ['A substitute teacher for the week.', 'The color of the student’s shirt.', 'Your own weekend plans.', 'The brand of the data sheet.'],
          a: 0, why: 'A change of adult in the room changes routines and responses.' } },
      { h: 'How to record it',
        p: ['Write what you observed, or what you were told and by whom, with the date: “Mother reported on 11/3 that the evening dose was moved to 6 p.m.” “Slept at his desk from 10:10 to 10:25.” “Limping; said ‘foot hurts’ twice.”',
            'Do not turn it into a diagnosis or an explanation: not “has an ear infection”, not “regressing because of the divorce”. And do not advise the family about health or medication, however sure you feel. “That sounds like something for his doctor, and I will let my supervisor know” is the whole of your part.'],
        check: { q: 'A parent says, “The new pills make him so sleepy. Should I skip the morning one?” You:',
          opts: ['Say yes, if he is sleepy.', 'Say no, never skip a dose.', 'Say that is a question for the prescriber, record what she reported, and tell your supervisor today.', 'Suggest halving it.'],
          a: 2, why: 'Advice on medication is outside your role and competence. Passing it on promptly is inside it.' } },
      { h: 'How fast',
        p: ['Some things cannot wait for the note. Report at once, by phone or whatever your workplace sets: an injury or a possible injury, a seizure, signs of a serious reaction, a student who cannot be roused, any sign of abuse or neglect, a student who has left the building, a medication error you know of.',
            'Most other things go in the same day’s note, with a direct message to the supervisor if the change is large: a new medication, a week of poor sleep, a move. Small routine changes go in the note alone.',
            '“In a timely manner” means soon enough for the information to be used. A medication change reported three weeks later has already cost three weeks of data that nobody could read properly.'],
        check: { q: 'A student falls from the climbing frame and holds her wrist. She says she is fine. You:',
          opts: ['Note it in tomorrow’s record.', 'Follow the workplace’s injury procedure now and inform your supervisor.', 'Say nothing: she says she is fine.', 'Bandage it and carry on.'],
          a: 1, why: 'A possible injury is reported at once and assessed by whoever the workplace names.' } }
    ],
    examples: {
      ask: 'How fast does this need to be reported?',
      intro: 'Eight things you might see or hear. Decide whether each needs reporting at once, or belongs in today’s note.',
      opts: ['Report at once', 'Record in today’s note (with a message to the supervisor if it is a large change)'],
      items: [
        { s: 'The student has a seizure lasting about a minute.', a: 0, why: 'A medical event: emergency procedure and immediate report.' },
        { s: 'The teacher mentions there will be a substitute tomorrow.', a: 1, why: 'A timetable change worth recording.' },
        { s: 'You see bruises in the shape of fingers on the student’s upper arm.', a: 0, why: 'A possible sign of abuse: the mandated-reporting procedure, today.' },
        { s: 'Father says the family moved house at the weekend.', a: 1, why: 'A large change at home: note it and tell the supervisor.' },
        { s: 'The student’s lips are swelling after snack and he is scratching his neck.', a: 0, why: 'A possible allergic reaction: act and report immediately.' },
        { s: 'Mother reports that he has slept about five hours a night this week.', a: 1, why: 'Recorded, attributed and dated.' },
        { s: 'The student is missing from the playground and the gate is open.', a: 0, why: 'A safety emergency.' },
        { s: 'The student ate none of his lunch today.', a: 1, why: 'A change in eating, recorded for the day.' }
      ]
    },
    practice: {
      title: 'A week with Wim',
      intro: 'Five moments in a week with Wim, a simulated student. Decide what you do with what you learn.',
      steps: [
        { t: 'Monday', see: 'Wim’s aunt drops him off and says, “He started something new for his attention on Saturday. A white pill, in the mornings.”', opts: ['Look the pill up and tell her about side effects.', 'Record: “Aunt reported 11/9 that a new morning medication was started Saturday 11/7,” and tell your supervisor today.', 'Wait to see whether it makes a difference before mentioning it.'], a: 1, why: 'Recorded with its source and dates, and reported while it is still useful.' },
        { t: 'Tuesday', see: 'Wim is quieter than usual, and twice puts his head on the desk for about five minutes.', opts: ['Write, “Drowsy from the new medication.”', 'Write, “Head on desk 9:40 to 9:45 and 10:20 to 10:26; spoke less than usual (4 requests; usual is about 15).”', 'Leave it out: quiet is good.'], a: 1, why: 'What you saw, with times and numbers. The link to the medication is for others to judge.' },
        { t: 'Wednesday', see: 'Problem behavior is at zero for the second day. The teacher says, “The plan is finally working!”', opts: ['Agree and tell the family.', 'Record the data, and make sure your supervisor has the medication change and the drowsiness alongside them.', 'Stop the plan: it is no longer needed.'], a: 1, why: 'Two things changed at once. The supervisor needs both to read the graph.' },
        { t: 'Thursday', see: 'At snack Wim gags, turns pale and vomits.', opts: ['Clean up and carry on with the session.', 'Follow the workplace’s illness procedure, and report to your supervisor now.', 'Note it at the end of the week.'], a: 1, why: 'A health event during the session is acted on and reported at once.' },
        { t: 'Friday', see: 'Wim’s mother asks, “Do you think it is the pill? Should we go back to the old one?”', opts: ['“Yes, I would stop it.”', '“No, give it time.”', '“I can’t advise on that. I have written down what I saw this week, and my supervisor has it. The prescriber is the person to ask.”'], a: 2, why: 'You offer your observations through the proper route, and leave the medical question with the prescriber.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Variables that might affect progress are reported so that:', opts: ['The technician can change the plan.', 'The supervisor can interpret the data correctly.', 'The family can be judged.', 'The file is thicker.'], a: 1, why: 'Without them, changes on the graph may be misread.' },
      { q: 'Which is such a variable?', opts: ['A change in medication.', 'The technician’s handwriting.', 'The size of the classroom clock.', 'The supervisor’s schedule.'], a: 0, why: 'Medication changes can alter behavior, sleep and appetite.' },
      { q: 'Information from a parent is recorded:', opts: ['As your own observation.', 'Not at all.', 'With who said it and when.', 'Only if you agree with it.'], a: 2, why: '“Mother reported on (date) that …”' },
      { q: 'A technician asked for advice about a medication should:', opts: ['Give their best advice.', 'Search online and report back.', 'Tell the parent to stop it.', 'Refer the parent to the prescriber and inform the supervisor.'], a: 3, why: 'It is outside the technician’s role and competence.' },
      { q: 'Which is written correctly?', opts: ['“Has an ear infection.”', '“Pulled at her left ear 6 times; cried when it was touched.”', '“In pain, poor thing.”', '“Probably teething.”'], a: 1, why: 'Observations, not a diagnosis.' },
      { q: 'Which must be reported at once?', opts: ['A possible injury.', 'A substitute teacher next week.', 'A new lunch box.', 'A haircut.'], a: 0, why: 'Safety and health events are immediate.' },
      { q: '“In a timely manner” means:', opts: ['At the annual review.', 'When you remember.', 'Soon enough for the information to be used.', 'Only if asked.'], a: 2, why: 'Late information cannot guide decisions already made.' },
      { q: 'You are unsure whether a change at home is relevant. You:', opts: ['Leave it out.', 'Ask the student.', 'Decide for yourself.', 'Record it and let the supervisor judge.'], a: 3, why: 'Recording costs little; missing it can cost weeks.' },
      { q: 'A student sleeps through part of a session. The note says:', opts: ['“Lazy today.”', '“Slept from 10:10 to 10:25.”', '“Bored.”', 'Nothing.'], a: 1, why: 'What was observed, with times.' },
      { q: 'Signs that may point to abuse or neglect are:', opts: ['Reported through the mandated-reporting procedure, without delay.', 'Investigated by you first.', 'Discussed with the parents first.', 'Left for the teacher.'], a: 0, why: 'You report a suspicion; you do not investigate.' },
      { q: 'Problem behavior drops sharply in the same week that a medication starts. The data should be:', opts: ['Credited to the plan.', 'Discarded.', 'Reported together with the medication change.', 'Hidden until things are clearer.'], a: 2, why: 'Two changes at once have to be seen together.' }
    ] },
    role: [
      { t: 'Take it down and pass it on', setup: 'The trainer plays a parent at drop-off who mentions three things in passing: a changed medication time, a bad night, and a question about whether to skip a dose. Then the trainer plays the supervisor on the phone.',
        steps: ['Listens without advising.', 'Answers the medication question by referring to the prescriber.', 'Writes each item with its source and date, in the parent’s terms.', 'Reports to the “supervisor” briefly: what was reported, what was observed.',
                'Offers no diagnosis or explanation.'] }
    ],
    roleRule: 'Met when the conversation and the report have every step in place.',
    discuss: [
      'What have families told you in passing that turned out to matter?',
      'How do you decline to give advice without seeming unhelpful?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Test Content Outline (3rd ed.), task E.3. bacb.com.',
      'Valdovinos, M. G., & Kennedy, C. H. (2004). A behavior-analytic conceptualization of the side effects of psychotropic medication. The Behavior Analyst, 27(2), 231–238.'
    ]
  },

  f4: {
    aim: [
      'Recognize the situations in which you seek direction from your supervisor.',
      'Decide how fast: now, today, or at the next meeting.',
      'Give a short, complete report: the situation, what you observed, what you did, what you need.',
      'Take concerns and suggestions from families, teachers and others to your supervisor without promising or arguing.'
    ],
    lesson: [
      { h: 'Asking is part of the job',
        p: ['You practice under a supervisor who is responsible for all the work you do. That is how the certification is built, and it means that asking is not a weakness or an interruption. It is the mechanism by which a plan stays safe and fits the student.',
            'The ethics code puts it as a duty: questions and concerns that you or others have about your services go to your supervisor.'],
        check: { q: 'Why is asking your supervisor for direction part of the technician’s role?',
          opts: ['Because technicians are not trusted.', 'Because the supervisor is responsible for the technician’s work, and the plan’s safety depends on it.', 'To fill supervision time.', 'It is not: good technicians do not need to ask.'],
          a: 1, why: 'The model of practice is close, ongoing supervision.' } },
      { h: 'When to ask',
        p: ['Ask when you do not understand a procedure, or it does not cover what is happening. When you cannot carry out a step as written. When you are asked to do something you have not been trained to do. When the data look wrong: a sudden change, or data you could not collect. When something happens that could affect safety.',
            'Ask also when two adults give you different instructions, when a family member or teacher wants a change, when you see or suspect something unethical, and when you made a mistake.',
            'What you do not do is fill the gap yourself and mention it later, or not at all.'],
        key: ['Unclear, uncovered or impossible steps', 'Untrained tasks', 'Odd or missing data', 'Safety', 'Conflicting instructions; requests for change', 'Ethical concerns; your own mistakes'],
        check: { q: 'The teacher tells you to stop giving tokens during reading. The plan says to give them. You:',
          opts: ['Stop: it is her classroom.', 'Carry on and say nothing to anyone.', 'Tell her you will raise it with your supervisor today, follow the plan meanwhile unless that is unsafe, and contact your supervisor.', 'Give half the tokens.'],
          a: 2, why: 'Conflicting instructions are resolved by the supervisor, quickly, not by the technician choosing a side.' } },
      { h: 'How fast',
        p: ['Sort what comes up into three speeds. Now: anything about immediate safety, a medical event, a possible mandated report, or a procedure you must run today and do not know how to. Phone, or use whatever urgent route your workplace sets, and if you cannot reach your supervisor use the backup the workplace names.',
            'Today: things that affect the next session or the reading of the data, such as a request for a change, a step you could not run, a large change at home. Send a message or put it clearly in the note.',
            'At the next meeting: questions about why a procedure is built as it is, ideas, things you would like to learn. Keep a running list, so they are not lost.'],
        check: { q: 'You are about to run a new procedure for the first time this afternoon and realize you were never shown one of its steps. How fast?',
          opts: ['Next supervision meeting.', 'Now, before the session.', 'After you have tried it.', 'Never: work it out.'],
          a: 1, why: 'You may not run what you have not been trained to run, and the session is today.' } },
      { h: 'The chain of command',
        p: ['Your first contact is your supervisor: the RBT Supervisor or RBT Requirements Coordinator responsible for your work on that case. Your workplace also names who comes next, such as a clinical director, when your supervisor cannot be reached or when the concern is about your supervisor.',
            'Follow that order. Going straight to the family, to a teacher’s head, or to a colleague’s opinion in place of your supervisor leaves the person responsible for the plan out of the decision.'],
        check: { q: 'You have an urgent question, and your supervisor does not answer the phone. You:',
          opts: ['Ask the classroom aide what she would do.', 'Decide yourself.', 'Contact the backup person your workplace names.', 'Wait until next week.'],
          a: 2, why: 'The workplace’s chain of command exists for exactly this.' } },
      { h: 'Saying it well',
        p: ['A supervisor may be reading your message between two other cases. Make it short and complete, in four parts. The situation: who, where, when. What you observed, with numbers. What you did. What you need: a decision, training, a call.',
            'For example: “Ana, classroom, today 10:15. During the new time-delay program she waited for the prompt on 10 of 10 trials. I ran it as written. Should I continue tomorrow, or would you like to see it first?”',
            'Afterwards, write down that you asked, what you were told and when, and do it. If the answer does not come, ask again.'],
        check: { q: 'Which message is the most useful to a supervisor?',
          opts: ['“Call me when you can.”', '“Things went badly with Ben today.”', '“Ben, 9:30 today, gym: left the building by the side door during the transition; found at the gate after 2 minutes; unharmed. Followed the elopement steps. Can we review the transition plan before tomorrow?”', '“The school is a mess.”'],
          a: 2, why: 'Situation, observation, action taken, and what is needed.' } },
      { h: 'Carrying other people’s concerns',
        p: ['Parents, teachers, aides and other therapists will tell you what they think of the plan: it is too strict, too soft, not working, working at school and not at home; they would like to try something else. These are valuable, and they are not yours to answer.',
            'Listen fully. Thank them. Do not defend the plan, argue, agree to a change, or promise what your supervisor will do. Say that you will pass it on, write it down as closely to their words as you can, and tell your supervisor the same day. If the supervisor gives you an answer to take back, take it back.',
            'People stop offering concerns to someone who brushes them off, and then the plan loses its best source of information.'],
        check: { q: 'A father says, “This ignoring business is cruel. I want it stopped.” You:',
          opts: ['Explain why planned ignoring works.', 'Agree to stop it.', 'Tell him the supervisor decides, and leave it there.', 'Listen, thank him, say you will tell your supervisor today, write down what he said, and do so.'],
          a: 3, why: 'His concern is heard and delivered, without you defending or changing the plan.' } }
    ],
    examples: {
      ask: 'How fast does this go to your supervisor?',
      intro: 'Nine things that come up. Decide how fast each goes to your supervisor.',
      opts: ['Now', 'Today', 'At the next meeting'],
      items: [
        { s: 'A student has bitten another child and broken the skin.', a: 0, why: 'A safety and injury matter.' },
        { s: 'You wonder why the plan uses momentary and not whole-interval DRO.', a: 2, why: 'A question about design: for supervision.' },
        { s: 'A parent asks for the reward to be changed from food to stickers.', a: 1, why: 'A request for a change: passed on the same day.' },
        { s: 'You are asked to run a feeding procedure you have never been trained in, in an hour.', a: 0, why: 'You may not run it untrained, and it is due today.' },
        { s: 'You would like to learn more about preference assessments.', a: 2, why: 'A training interest for your list.' },
        { s: 'You could not collect data for the last three sessions because the sheet has changed and you do not understand it.', a: 1, why: 'A data problem that affects the next session.' },
        { s: 'A student tells you something that suggests he is being harmed at home.', a: 0, why: 'A possible mandated report.' },
        { s: 'The teacher suggests moving the session to the afternoons.', a: 1, why: 'A suggestion from the team: passed on the same day.' },
        { s: 'You noticed that your token-giving is sometimes late and want tips.', a: 2, why: 'Feedback and practice at supervision.' }
      ]
    },
    practice: {
      title: 'What do you do with it?',
      intro: 'Seven moments with Xan, a simulated student, and the adults around him.',
      steps: [
        { t: 'Monday 9:00', see: 'The plan says, “Use the three-step prompt.” You have not heard of it.', opts: ['Use the prompting you know.', 'Ask a colleague and copy her.', 'Contact your supervisor before running that part.'], a: 2, why: 'A step you were not trained on is not run until you are.' },
        { t: 'Monday 14:00', see: 'Xan’s speech therapist says, “You should stop prompting so fast. Give him ten seconds.” The plan says five.', opts: ['Change to ten: she is the speech expert.', 'Thank her, keep to five, and tell your supervisor today what she suggested.', 'Tell her the plan is not her business.'], a: 1, why: 'A suggestion from another provider is carried to the supervisor, who may well take it up.' },
        { t: 'Tuesday', see: 'For three sessions Xan’s correct answers have dropped from about 80% to about 30%.', opts: ['Wait for the weekly meeting.', 'Make the task easier yourself.', 'Message your supervisor today with the numbers.'], a: 2, why: 'A sudden change in the data is not kept for a week, and not fixed privately.' },
        { t: 'Wednesday', see: 'You realize that yesterday you ran the wrong version of a program.', opts: ['Say nothing: no harm done.', 'Tell your supervisor today, and note it on yesterday’s record in the proper way.', 'Quietly change yesterday’s data sheet.'], a: 1, why: 'Mistakes are reported and documented. A hidden one distorts the data and the trust.' },
        { t: 'Thursday', see: 'Xan’s mother says, “The teacher told me you people are making him worse.” She is upset.', opts: ['“That is not true, and the teacher should not say that.”', 'Listen, thank her for telling you, say you will let your supervisor know today so that she can talk with her, and do so.', '“Maybe she is right.”'], a: 1, why: 'You neither defend nor concede. You make sure the concern reaches the person who can answer it.' },
        { t: 'Friday 11:00', see: 'Xan climbs onto the window ledge. You get him down safely. Your supervisor’s phone goes to voicemail.', opts: ['Leave it until Monday.', 'Leave a voicemail and contact the backup your workplace names; write the incident report today.', 'Tell the teacher and consider it reported.'], a: 1, why: 'A safety event is reported now, through the chain of command, and documented.' },
        { t: 'Friday 15:00', see: 'You write to your supervisor about the window ledge.', opts: ['“Scary day with Xan. Call me.”', '“Xan, 11:00, classroom: climbed onto the window ledge during free time; I guided him down by the plan’s steps within about 20 seconds; unharmed. Window was locked. Left you a voicemail 11:05; spoke to the director 11:10. Incident report filed. Could we look at free time before Monday?”', '“Xan is becoming dangerous.”'], a: 1, why: 'Situation, observation, action and request, with the record of whom you told.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'A technician’s questions about their services go to:', opts: ['The family.', 'Their supervisor.', 'Whoever is nearest.', 'An online forum.'], a: 1, why: 'The supervisor is responsible for the work.' },
      { q: 'You are asked to do something you have not been trained to do. You:', opts: ['Tell your supervisor before doing it.', 'Try your best.', 'Watch a video and proceed.', 'Refuse and say nothing more.'], a: 0, why: 'Competence comes first, and the supervisor arranges the training.' },
      { q: 'Which needs your supervisor now?', opts: ['A question about theory.', 'An idea for a new reinforcer.', 'A student has been injured.', 'A wish for more training.'], a: 2, why: 'Safety is immediate.' },
      { q: 'Questions about why a procedure is designed as it is are best raised:', opts: ['In the middle of a session.', 'With the family.', 'Never.', 'At the next supervision meeting, from your running list.'], a: 3, why: 'They are not urgent, and they are worth asking.' },
      { q: 'If your supervisor cannot be reached in an urgent situation, you:', opts: ['Decide alone.', 'Contact the next person in your workplace’s chain of command.', 'Ask the student’s parent.', 'Wait.'], a: 1, why: 'The workplace names a backup.' },
      { q: 'A good report to a supervisor contains:', opts: ['The situation, what you observed, what you did and what you need.', 'How you feel about it.', 'A complaint about colleagues.', 'As little as possible.'], a: 0, why: 'Short and complete.' },
      { q: 'A teacher suggests a change to the plan. You:', opts: ['Make the change.', 'Explain why she is wrong.', 'Thank her and pass the suggestion to your supervisor promptly.', 'Ignore it.'], a: 2, why: 'Suggestions from the team are carried, not judged, by the technician.' },
      { q: 'When a parent criticizes the plan, you should not:', opts: ['Listen.', 'Write down the concern.', 'Tell the supervisor.', 'Argue, or promise a change.'], a: 3, why: 'Neither defending nor conceding is your part.' },
      { q: 'Two adults give you conflicting instructions about a procedure. You:', opts: ['Follow the more senior one.', 'Follow the plan where it is safe, and get it resolved by your supervisor promptly.', 'Follow whichever is easier.', 'Do neither.'], a: 1, why: 'The supervisor resolves conflicts about the plan.' },
      { q: 'You made an error in a session. You:', opts: ['Report it to your supervisor.', 'Keep it to yourself.', 'Change the data to hide it.', 'Blame the student.'], a: 0, why: 'Honesty about errors is an ethical duty and keeps the data readable.' },
      { q: 'After receiving direction from your supervisor, you:', opts: ['Do what you think best anyway.', 'Wait for it in writing before doing anything.', 'Note what you were told and when, and carry it out.', 'Forget it.'], a: 2, why: 'A record of the direction, and follow-through.' },
      { q: 'A concern about your own supervisor’s conduct is raised with:', opts: ['Nobody.', 'The student’s family.', 'Social media.', 'The next person your workplace names, such as the supervisor’s manager.'], a: 3, why: 'The chain of command provides for this.' },
      { q: 'Data you could not collect for several sessions should be:', opts: ['Estimated.', 'Reported promptly, so the system can be fixed.', 'Left blank without comment.', 'Mentioned at the annual review.'], a: 1, why: 'Missing data affect decisions now.' },
      { q: 'Why does it matter to pass on families’ concerns quickly?', opts: ['The plan’s fit and the family’s trust both depend on it.', 'It does not.', 'To keep families quiet.', 'For the record only.'], a: 0, why: 'They are a main source of information about how the plan works in real life.' }
    ] },
    role: [
      { t: 'A parent with a complaint', setup: 'The trainer plays a parent who is unhappy with part of the plan and presses for a promise that it will be changed.',
        steps: ['Listens without interrupting.', 'Thanks the parent.', 'Does not defend the plan or argue.', 'Does not promise or agree to a change.',
                'Says they will tell the supervisor today, and writes down the concern in the parent’s words.'] },
      { t: 'Thirty seconds to your supervisor', setup: 'The trainer gives a written scenario (a data change, a safety event or a request from a teacher) and plays the supervisor on the phone, with thirty seconds to spare.',
        steps: ['States who, where and when.', 'Gives what was observed, with numbers.', 'Says what they did.', 'Says what they need.', 'Repeats back the direction given, and says where they will note it.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'What stops people from asking their supervisor? Which of those reasons apply to you?',
      'Think of a concern someone gave you that never reached the right person. What happened next?',
      'How would you raise a disagreement with your supervisor about a plan?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.06, 2.02 and 2.06. bacb.com.',
      'Sellers, T. P., Valentino, A. L., & LeBlanc, L. A. (2016). Recommended practices for individual supervision of aspiring behavior analysts. Behavior Analysis in Practice, 9(4), 274–286.'
    ]
  }
});
