/* nbh-learn-units-g2.js (v26.01): written units of the Learning page, section G (Ethics), units g4 to g6.
   The shape of a unit is described in nbh-learn-units.js. The people in every example are invented.
   The RBT Ethics Code (2.0) of the Behavior Analyst Certification Board is described in the workstation's own words
   and cited by standard number; the code itself, at bacb.com, is the authority. */
window.NBH_LEARN_UNITS = window.NBH_LEARN_UNITS || {};
Object.assign(window.NBH_LEARN_UNITS, {
  g4: {
    aim: [
      'Apply the code’s three confidentiality standards to speech, messages, pictures and social media.',
      'Share only what is necessary in work communication.',
      'Make only true and accurate statements about your qualifications and your services.',
      'Use the RBT title, and the BACB’s and your employer’s materials, only as allowed.'
    ],
    lesson: [
      { h: 'Three standards on confidentiality',
        p: ['Unit F1 dealt with records and the law. Here is the same duty as the ethics code states it, in three parts. First: protect the confidentiality and privacy of clients, of their families and others with a stake in the service, and of people in your workplace, by following what the BACB, your employer and the law each require.',
            'Second: share no identifying information about clients on social media or websites. Photographs, video and written details are all named. Third: discuss confidential client information only under your supervisor’s direction, unless the law allows it for a valid reason such as protecting someone from harm; and in work emails, messages and notes, include only the client information that is necessary.'],
        key: ['Protect confidentiality and privacy, as the BACB, the employer and the law require', 'No identifying client information on social media or websites', 'Discuss it only under the supervisor’s direction; share only what is necessary'],
        check: { q: 'Whose confidentiality does the code ask you to protect?',
          opts: ['Clients only.', 'Clients, stakeholders and others in the workplace.', 'Only clients under 18.', 'Only those who ask.'],
          a: 1, why: 'Families and colleagues are covered as well as the client.' } },
      { h: 'Only what is necessary',
        p: ['Before you send a message about a student, ask three questions. Does this person have a role that needs it? Is this the approved channel? Is every detail needed for the purpose? An email to a teacher about tomorrow’s schedule does not need the diagnosis, the family’s circumstances or last week’s incident.',
            'Use initials or the identifier your workplace sets in subject lines and file names. Check the recipient before you press send; the wrong “Maria” in an address book is one of the commonest breaches there is. Do not forward a thread without reading what is lower down in it.'],
        check: { q: 'You are emailing the art teacher to say that a student will arrive ten minutes late on Thursdays. Which belongs in the message?',
          opts: ['The new arrival time, and nothing more about him.', 'His diagnosis, so that she understands.', 'A summary of his behavior plan.', 'The reason: a family court appointment.'],
          a: 0, why: 'The purpose needs only the time. Everything else is unnecessary disclosure.' } },
      { h: 'Social media',
        p: ['The rule has no exceptions for good intentions. A proud post about a student’s first word, a photograph with the face covered by an emoji, a “client of the day” story with a nickname, a video in a closed group for technicians: each shares identifying information on a platform, and each is forbidden.',
            'A family’s own permission does not change your obligation as a technician; if a workplace wishes to publish anything, that is a matter for the organization, with written consent, and not for your personal account. The same care applies to complaints: venting about “a parent” or “a kid” online can identify them to anyone who knows where you work.',
            'Asking for help is also covered. Posting a case description in a forum to ask what others would do is a discussion of confidential information that your supervisor has not directed. Bring the question to supervision.'],
        check: { q: 'A parent says, “Go ahead and post that video of him, I don’t mind!” You:',
          opts: ['Post it: she has consented.', 'Post it without his name.', 'Thank her and explain that you never share anything about the students you work with on your own accounts.', 'Post it to a private group only.'],
          a: 2, why: 'The standard binds the technician whatever a parent offers. Publication, if any, is the organization’s decision with written consent.' } },
      { h: 'Honest statements about yourself',
        p: ['The code forbids false, misleading or exaggerated statements about your qualifications or your services. That covers a résumé, an online profile, an introduction at a meeting, and what you let others believe.',
            'Accurate: “Registered Behavior Technician, certified in 2026; I carry out behavior plans under the supervision of a BCBA.” Not accurate: “behavior therapist specializing in autism”, “ABA provider”, “trained in” a method after one workshop, or listing the certification while it is inactive or before you have passed.',
            'If your status changes, your statements change the same day. A lapsed or inactive certification may not be presented as active anywhere.'],
        check: { q: 'You have finished the 40-hour training and booked the examination. Your online profile may say:',
          opts: ['“RBT”.', '“RBT (pending)”.', '“Completed a 40-hour behavior technician training”.', '“Certified behavior therapist”.'],
          a: 2, why: 'It is true and claims nothing more. The title belongs only to those who hold the active certification.' } },
      { h: 'Honest statements about the service',
        p: ['Do not promise results. “He’ll be talking by summer”, “ABA will fix this”, “this always works” are claims no one can honestly make, and they are not yours to make even when they are cautious: prognosis and expected outcomes belong to the supervisor.',
            'Do not speak for your employer or for the field in public, online or to the press, unless you have been asked to. Do not run down other professionals or other approaches to families. If a family asks what you think of another treatment, the answer is, “That’s a good question for” your supervisor.'],
        check: { q: 'A mother asks, “Will he ever go to a regular school?” The honest answer within your role is:',
          opts: ['“Yes, definitely.”', '“I can’t know that, and it’s a question I’d like you to ask” your supervisor. “What I can tell you is what he did today.”', '“Probably not.”', '“Children like him usually do.”'],
          a: 1, why: 'No promise, no prediction, a referral to the supervisor, and the facts you do have.' } },
      { h: 'Titles and other people’s materials',
        p: ['“RBT” and “Registered Behavior Technician” are certification marks owned by the BACB. Use them exactly, only while your certification is active, and never to imply that the BACB endorses you or a product.',
            'The code also protects intellectual property. Examination questions may never be collected, shared, described or sought, before or after you sit. Your employer’s materials, such as program books, data systems and training content, are not yours to copy, post or take to another job. Give credit when you use someone’s work.'],
        check: { q: 'After the examination, a friend who sits next week asks which questions came up. You:',
          opts: ['Tell her the ones you remember.', 'Tell her only the hard ones.', 'Tell her nothing about the content, and suggest she study the test content outline.', 'Post them in a study group.'],
          a: 2, why: 'Sharing examination content is cheating under the code and misuse of the BACB’s property; it can cost both of you the certification.' } }
    ],
    examples: {
      ask: 'Is this acceptable?',
      intro: 'Ten statements, posts and messages. Decide whether each is acceptable under the code.',
      opts: ['Acceptable', 'Not acceptable'],
      items: [
        { s: 'A profile that reads: “Registered Behavior Technician. I work under BCBA supervision at a school program.”', a: 0, why: 'True and exact, with no client information.' },
        { s: 'A post: “So proud of my little guy at Maple Elementary, he used his talker to ask for juice today!”', a: 1, why: 'Identifying details about a client on social media.' },
        { s: 'A message to the supervisor on the approved system: “J.R., 10:15 today: left the room twice, 3 min and 5 min. Can we talk before Thursday?”', a: 0, why: 'The approved channel, initials, and only what is needed.' },
        { s: 'A résumé line: “Behavior analyst (RBT)”.', a: 1, why: 'Misleading: an RBT is not a behavior analyst.' },
        { s: 'A technician tells a family, “I’ve seen this program cure kids.”', a: 1, why: 'An exaggerated claim and a promise of results.' },
        { s: 'In a forum for technicians: “Has anyone got tips for a 9-year-old non-speaking client in my town’s only middle school who bites?”', a: 1, why: 'Confidential information discussed without the supervisor’s direction, with identifying detail.' },
        { s: 'A post: “Grateful for a job where I learn something every day.”', a: 0, why: 'About yourself, with nothing about any client.' },
        { s: 'An email to a teacher that copies in the whole staff list, describing a student’s incident.', a: 1, why: 'Sent to people with no need to know.' },
        { s: 'A technician whose certification went inactive last month still signs notes “RBT”.', a: 1, why: 'The title may be used only while the certification is active.' },
        { s: 'Asked by a parent about a diet she read about, the technician says, “I don’t know enough to say. I’ll ask” the supervisor “to talk with you.”', a: 0, why: 'Honest about the limits of role and knowledge.' }
      ]
    },
    practice: {
      title: 'Before you press send',
      intro: 'Six things you are about to say, send or post. Choose the version that keeps the code.',
      ask: 'Which do you choose?',
      steps: [
        { t: 'An email', see: 'You need to tell the music teacher that Bram will use headphones in her class from Monday.', opts: ['“Bram has sensory processing problems from his autism and melts down with noise, so the plan says headphones.”', '“From Monday Bram will wear headphones in music. Please let him keep them on. Questions to” the supervisor.', '“See the attached full behavior plan.”'], a: 1, why: 'What she needs in order to do her part, and where to take questions.' },
        { t: 'A group chat', see: 'The staff group chat is on a personal messaging app. A colleague asks, “How did Bram do after lunch?”', opts: ['Answer in the chat.', 'Answer with his initials.', 'Reply, “I’ll put it in the system,” and use the approved channel.'], a: 2, why: 'Client information stays off unapproved apps, initials or not.' },
        { t: 'A photograph', see: 'Bram has built a remarkable tower. You would like his mother to see it.', opts: ['Photograph it on your phone and text her.', 'Use the method your workplace has approved for sharing with families, or tell her about it at pick-up.', 'Post it to your story with his face cropped out.'], a: 1, why: 'Personal phones and public stories are not approved routes.' },
        { t: 'Your profile', see: 'You are updating your professional profile. You passed the examination last week, and no supervisor has added you yet.', opts: ['“RBT, active.”', '“Passed the RBT examination; certification inactive until a supervisor is on record.”', '“Board certified.”'], a: 1, why: 'Accurate about the status as it stands today.' },
        { t: 'A conversation', see: 'At a family gathering your aunt asks, “What’s the worst kid you work with?”', opts: ['Tell a story without the name.', '“I can’t talk about the children. I can tell you what the work is like in general.”', 'Tell it, and ask her to keep it to herself.'], a: 1, why: 'Stories identify people, and they are not yours to tell.' },
        { t: 'A recommendation', see: 'A parent asks, “You’re so good with him. Could you write a review of the company online and mention how well he’s done?”', opts: ['Write it, with his first name only.', 'Write it without his name.', 'Decline kindly: you never write publicly about the students you serve. Mention the request to your supervisor.'], a: 2, why: 'A public statement about a client’s progress is identifying information and a claim about results.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'Identifying information about clients on social media is:', opts: ['Allowed with a parent’s spoken permission.', 'Never shared by the technician.', 'Allowed in closed groups.', 'Allowed if the face is hidden.'], a: 1, why: 'Standard 2.09 has no such exceptions.' },
      { q: 'Confidential client information is discussed:', opts: ['Only under the supervisor’s direction, unless the law allows it for a valid reason.', 'With any colleague.', 'With friends, without names.', 'Whenever it helps the technician.'], a: 0, why: 'Standard 2.10.' },
      { q: 'In job-related communication you share:', opts: ['Everything, for completeness.', 'Nothing at all.', 'Only the client information that is necessary.', 'Whatever the recipient asks for.'], a: 2, why: 'The minimum for the purpose.' },
      { q: 'A valid reason the law may allow for disclosure is:', opts: ['A neighbor’s interest.', 'A good story.', 'A colleague’s curiosity.', 'Protecting the client or others from harm.'], a: 3, why: 'The example the code itself gives.' },
      { q: 'Posting a case in an online forum to ask for advice is:', opts: ['Good professional practice.', 'A discussion of confidential information not directed by your supervisor.', 'Fine without the name.', 'Required for hard cases.'], a: 1, why: 'Questions about services go to the supervisor.' },
      { q: 'Statements about your qualifications must not be:', opts: ['False, misleading or exaggerated.', 'Modest.', 'Brief.', 'Written down.'], a: 0, why: 'Standard 1.05.' },
      { q: 'Before passing the examination, a person may describe themselves as:', opts: ['An RBT.', 'An RBT in training with full privileges.', 'Having completed the 40-hour training.', 'A behavior analyst.'], a: 2, why: 'True, and no more.' },
      { q: 'While a certification is inactive, the title “RBT” is:', opts: ['Used as usual.', 'Used with an asterisk.', 'Used on notes only.', 'Not used to present oneself as an active RBT.'], a: 3, why: 'No practice, billing or representation while inactive.' },
      { q: 'A parent asks whether the program will make her child “normal”. The technician:', opts: ['Promises it will.', 'Makes no promise and refers the question to the supervisor.', 'Says it will not.', 'Changes the subject.'], a: 1, why: 'No guarantees, and prognosis is the supervisor’s.' },
      { q: 'Sharing examination questions with a friend is:', opts: ['Cheating and misuse of the BACB’s intellectual property.', 'Helpful.', 'Allowed after you pass.', 'Allowed in private.'], a: 0, why: 'Standards 3.03 and 3.05.' },
      { q: 'Your employer’s program materials are:', opts: ['Yours to keep and share.', 'Public.', 'The employer’s property, not to be copied or posted without permission.', 'Free to sell.'], a: 2, why: 'Intellectual property of others is respected.' },
      { q: 'Employers and supervisors who ask for your credentials receive:', opts: ['Whatever looks best.', 'Nothing.', 'An estimate.', 'A current and accurate set.'], a: 3, why: 'Standard 1.05.' },
      { q: 'Before sending a message with client information, you check:', opts: ['Only the spelling.', 'The recipient, the channel and whether each detail is needed.', 'Nothing: speed matters.', 'That it is long enough.'], a: 1, why: 'Three questions that prevent most breaches.' }
    ] },
    role: [
      { t: 'Three requests', setup: 'The trainer plays, in turn: a parent offering permission to post a video; a relative of the trainee asking for a story about work; a friend asking what was on the examination.',
        steps: ['Declines the post kindly, naming the rule as their own.', 'Tells no story, with or without names.', 'Shares nothing about examination content.', 'Stays friendly in all three.'] }
    ],
    roleRule: 'Met when all three requests are handled with every step in place.',
    discuss: [
      'Look at your own profiles together. Is anything about your work or qualifications inaccurate, or about a client at all?',
      'Which channels has your workplace approved for client information, and which are people actually using?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.05, 2.08, 2.09, 2.10, 3.03 and 3.05. bacb.com.',
      'O’Leary, P. N., Miller, M. M., Olive, M. L., & Kelly, A. N. (2017). Blurred lines: Ethical implications of social media for behavior analysts. Behavior Analysis in Practice, 10(1), 45–51.'
    ]
  },

  g5: {
    aim: [
      'Say what culture is, and why it bears on every part of a behavior program.',
      'Tell cultural humility from the idea of having “learned” a culture.',
      'Notice your own assumptions, and ask, with respect, when you do not know.',
      'Bring to your supervisor any point where a plan and a family’s ways do not fit.'
    ],
    lesson: [
      { h: 'What culture is',
        p: ['Culture is the set of ways a group of people has learned to live together: language and ways of speaking, what is polite and what is rude, how children are raised and by whom, food, dress, faith, how time is kept, what is celebrated, how disability and help are understood. Everyone has several, from family, region, religion, generation, profession and more.',
            'In behavior-analytic terms, culture is a history of what a community has reinforced and discouraged. It decides which behaviors a family values, which they find shameful, and what they will actually do when you have left the house. A plan that ignores it may be well designed and never carried out.'],
        check: { q: 'Why does culture matter to a behavior plan?',
          opts: ['It does not: behavior follows the same laws everywhere.', 'Only for translation.', 'It shapes which goals matter to the family and which procedures they can and will use.', 'Only for holidays.'],
          a: 2, why: 'The principles are general; what counts as an important behavior and an acceptable procedure is not.' } },
      { h: 'Humility',
        p: ['No one “masters” another culture, and a list of facts about a group will be wrong about the family in front of you. Cultural humility is a stance you keep for a whole career: I know my own ways are one set among many; I do not know yours; I will ask, listen and adjust.',
            'It has three working parts. Keep examining your own assumptions. Treat the family as the experts on their own life. And notice the power you carry as the professional in the room, which makes it hard for families to tell you that something does not suit them.'],
        check: { q: 'Which statement shows cultural humility?',
          opts: ['“I had a family from that country before, so I know how they are.”', '“I treat everyone exactly the same, so culture doesn’t come into it.”', '“I’m not sure how your family does mealtimes. Would you show me?”', '“They should adapt to how we do things here.”'],
          a: 2, why: 'It assumes nothing and asks the people who know.' } },
      { h: 'Your own lens',
        p: ['The code asks you to evaluate your own biases and your ability to work with people of diverse needs and backgrounds, and to get any training you need under your supervisor’s direction. That begins with seeing that your own “normal” is cultural too.',
            'Common places where a technician’s normal is mistaken for the standard: eye contact as a sign of attention or honesty; independence in eating, sleeping and dressing at a certain age; children speaking up to adults; punctuality to the minute; first names with adults; praise that is loud and public; who in the family makes decisions.',
            'A useful question when something a family does strikes you as wrong: is this unsafe, or is it only unfamiliar? If it is unfamiliar, your reaction is information about you.'],
        check: { q: 'A seven-year-old is spoon-fed by his grandmother at every meal, as is usual in his family. Your first thought is that this is “babying” him. That thought is:',
          opts: ['A clinical finding to record.', 'A sign of your own expectations about independence, to notice and set aside.', 'A reason to tell the grandmother to stop.', 'Evidence of neglect.'],
          a: 1, why: 'It is unfamiliar, not unsafe. Whether self-feeding becomes a goal is for the family and the supervisor.' } },
      { h: 'In the session',
        p: ['Learn and use names as the family says them; ask how to pronounce them and how each adult wishes to be addressed. Follow the house: shoes, where you sit, greetings, who is spoken to first. Ask before bringing food, pictures, music or toys that might clash with diet, faith or values.',
            'Look at your materials: do the pictures, stories and examples include people and things this child knows? Choose reinforcers and praise that fit; some children and families find loud public praise uncomfortable.',
            'When you and the family do not share a language well, do not get by with a sibling or a child as interpreter, and do not guess. Tell your supervisor, who arranges proper interpretation and translated materials.'],
        check: { q: 'A mother nods and says “yes, yes” to everything, but the home practice is never done. English is her second language. The best next step is to:',
          opts: ['Record that the family is not compliant.', 'Speak more loudly and slowly.', 'Ask her ten-year-old to translate the plan.', 'Tell your supervisor that language may be a barrier, so that an interpreter can be arranged.'],
          a: 3, why: 'Agreement out of politeness, or without full understanding, is not consent or training. The supervisor arranges proper interpretation.' } },
      { h: 'When the plan and the family do not fit',
        p: ['Sometimes a goal or a procedure runs against a family’s ways: a plan that requires eye contact where it is disrespectful toward elders; edible reinforcers during a fast; a sleep plan that assumes a child sleeps alone; a session set during prayers.',
            'It is not your part to override the family, nor to quietly drop the step. Tell your supervisor what you have noticed, in the family’s words where you can. Good plans are changed by this kind of information; a plan the family cannot live with will not last.',
            'The exception is safety and the law: a practice that harms a child is reported whatever its origin. Your supervisor and the mandated-reporting procedure guide you.'],
        check: { q: 'The plan uses small sweets as reinforcers. The family is fasting this month and the father looks uneasy when you bring them out. You:',
          opts: ['Carry on: the plan says sweets.', 'Put them away for today, use other reinforcers the plan lists, and tell your supervisor today.', 'Explain to him that the plan is scientific.', 'Stop the sessions for the month.'],
          a: 1, why: 'You respect what you see, stay inside the plan’s options, and get the plan adjusted by the person who can adjust it.' } },
      { h: 'Fairness, always',
        p: ['The code forbids harassment and discrimination, and asks for equitable and inclusive behavior toward everyone, whatever their age, disability, ethnicity, gender identity or expression, immigration status, marital or relationship status, national origin, race, religion, sexual orientation or socioeconomic status.',
            'In practice: the same effort, patience and courtesy in a crowded flat as in a large house; no jokes or remarks about any group, in sessions or the staff room; no assumptions about what a family can afford, understand or achieve. If you find that you cannot work fairly with a particular family, that is a matter to take to your supervisor honestly and early.'],
        check: { q: 'A colleague often mimics the accent of a student’s father when the family is not present. You:',
          opts: ['Laugh along: he can’t hear.', 'Ignore it.', 'Say that it is not all right, and raise it with your supervisor if it continues.', 'Tell the father.'],
          a: 2, why: 'Demeaning conduct toward a stakeholder breaches the code whether or not he hears it.' } }
    ],
    examples: {
      ask: 'Is this a responsive way to act?',
      intro: 'Eight moments in homes and classrooms. Decide whether the technician is being culturally responsive.',
      opts: ['Responsive', 'Not responsive'],
      items: [
        { s: 'The technician asks, “How do you say his name? I want to get it right,” and writes down the sounds.', a: 0, why: 'Names matter, and asking shows respect.' },
        { s: 'The technician shortens a student’s name to something easier for her to say.', a: 1, why: 'A person’s name is not the technician’s to change.' },
        { s: 'Seeing shoes by the door, the technician takes hers off without being asked.', a: 0, why: 'Following the house.' },
        { s: 'The technician tells a mother that co-sleeping is “a bad habit” that must stop.', a: 1, why: 'A personal and cultural judgment presented as professional advice, and outside the role.' },
        { s: 'The technician notices that every picture card shows foods the student has never eaten, and mentions it to her supervisor.', a: 0, why: 'Materials that fit the child’s world; raised through the right route.' },
        { s: 'The technician assumes a family will not manage the home data sheet because they are poor.', a: 1, why: 'An assumption from socioeconomic status.' },
        { s: 'The technician reports to her supervisor that the grandfather, not the parents, makes the family’s decisions, and should be at the meeting.', a: 0, why: 'Learning how this family works, and passing it on.' },
        { s: 'The technician insists on “look at me” before every instruction, though the family has said that children do not stare at adults.', a: 1, why: 'A conflict with the family’s ways that should go to the supervisor, not be pressed.' }
      ]
    },
    practice: {
      title: 'A first month in a new home',
      intro: 'You begin work in the home of Chidi, a simulated student, and his family, whose ways are new to you.',
      steps: [
        { t: 'Day 1', see: 'His father introduces himself with a long name you did not catch.', opts: ['Call him “Dad”.', 'Ask him to say it again, repeat it back, and ask how he would like to be addressed.', 'Avoid using his name.'], a: 1, why: 'A minute spent on names is repaid for a year.' },
        { t: 'Day 3', see: 'An elderly aunt sits in on the session and corrects Chidi sharply when he errs, which interferes with the procedure.', opts: ['Ask her to leave the room.', 'Carry on as best you can, stay courteous, and tell your supervisor what happened so it can be discussed with the family.', 'Tell her she is doing it wrong.'], a: 1, why: 'Directing an elder in her own home is not your place. The supervisor works it out with the family.' },
        { t: 'Week 2', see: 'The plan’s goal is for Chidi to say “no, thank you” to adults. His mother winces each time, and says quietly that children do not refuse elders.', opts: ['Explain that self-advocacy is important.', 'Stop running the program without telling anyone.', 'Tell your supervisor today what she said, in her words.'], a: 2, why: 'A possible clash between a goal and the family’s values is exactly what the supervisor needs to hear.' },
        { t: 'Week 3', see: 'The family offers you a plate at a festival meal. Your workplace’s policy allows you to accept a small amount of food offered in a home.', opts: ['Refuse flatly.', 'Accept a small portion with thanks, as the policy allows.', 'Accept and ask for some to take home.'], a: 1, why: 'Within policy, and respectful of hospitality. Where the policy says no, a warm refusal with the reason.' },
        { t: 'Week 3', see: 'You catch yourself thinking, “This house is chaos. No wonder he can’t focus.”', opts: ['Write it in the note.', 'Notice it as your own reaction, ask yourself what you actually observed, and bring the question to supervision if it persists.', 'Share it with a colleague for a laugh.'], a: 1, why: 'The code asks you to evaluate your own biases. What goes in a note is what was observed.' },
        { t: 'Week 4', see: 'His mother asks you, in halting English, to explain a letter from the school about his placement.', opts: ['Explain it as best you can.', 'Tell her you are not the right person to explain it, and ask your supervisor today to arrange for it to be explained in her language.', 'Tell her not to worry about it.'], a: 1, why: 'Outside your role, and she needs a proper interpreter, not a guess.' }
      ]
    },
    quiz: { pass: 80, draw: 8, items: [
      { q: 'Culture includes:', opts: ['Only ethnicity.', 'Only language.', 'Shared, learned ways of living: language, child-rearing, faith, food, values and more.', 'Only religion.'], a: 2, why: 'And every person belongs to several.' },
      { q: 'Cultural humility is best described as:', opts: ['A continuing stance of self-examination and learning from families.', 'Memorizing facts about groups.', 'Treating everyone identically.', 'A one-day training.'], a: 0, why: 'A lifelong practice, not a finished skill.' },
      { q: 'The code asks technicians to work on cultural responsiveness:', opts: ['Alone.', 'Directly with their supervisor.', 'Only if a family complains.', 'Only after certification renewal.'], a: 1, why: 'Standard 1.07.' },
      { q: 'The code asks technicians to actively evaluate:', opts: ['The family’s finances.', 'Their colleagues’ beliefs.', 'The supervisor’s culture.', 'Their own biases and their ability to work with people of diverse backgrounds.'], a: 3, why: 'And to get any training needed.' },
      { q: 'A useful question when a family practice seems wrong to you is:', opts: ['“How do I stop this?”', '“Is it unsafe, or only unfamiliar?”', '“Who can I tell about this?”', '“Why are they like this?”'], a: 1, why: 'Unfamiliar is information about you; unsafe is reported.' },
      { q: 'When a plan’s goal conflicts with a family’s values, you:', opts: ['Tell your supervisor.', 'Drop the goal quietly.', 'Insist on the goal.', 'Argue with the family.'], a: 0, why: 'The supervisor can adjust the plan with the family.' },
      { q: 'A family and technician do not share a language well. Interpretation should be:', opts: ['Done by the client’s sibling.', 'Skipped.', 'Arranged properly through the supervisor.', 'Done with gestures.'], a: 2, why: 'Children and guesses are not interpreters.' },
      { q: 'Harassment and discrimination are:', opts: ['Allowed in private.', 'A matter of opinion.', 'Only an employment issue.', 'Forbidden by the code.'], a: 3, why: 'Standard 1.08.' },
      { q: 'Which is a culturally loaded assumption?', opts: ['Children need food.', 'Eye contact shows that a child is listening.', 'Hitting causes pain.', 'Data should be accurate.'], a: 1, why: 'In many communities, looking at an adult’s eyes is disrespectful.' },
      { q: 'A harmful practice is:', opts: ['Reported through the proper procedure, whatever its cultural origin.', 'Excused if it is traditional.', 'Ignored to keep rapport.', 'Posted online.'], a: 0, why: 'Safety and the law come first.' },
      { q: 'You realize you are less patient with one family than with others. You:', opts: ['Hide it.', 'Ask to be moved without giving a reason.', 'Raise it honestly with your supervisor.', 'Blame the family.'], a: 2, why: 'Biases that may affect services are addressed and documented.' }
    ] },
    role: [
      { t: 'A first visit', setup: 'The trainer plays a parent in a home whose customs the trainee does not know, and at one point shows discomfort with part of the plan.',
        steps: ['Asks how to say names and how each adult wishes to be addressed.', 'Asks about the house: shoes, where to work, anything to avoid.', 'Notices the discomfort and asks about it openly and gently.', 'Does not defend the plan or change it.', 'Says they will tell their supervisor, and what they will say.'] }
    ],
    roleRule: 'Met when the visit is done once with every step in place.',
    discuss: [
      'Which of your own “normal” ways did you only recognize as cultural when you met a family who did things differently?',
      'Look through your teaching materials together. Whose world do the pictures show?',
      'Which families on your caseload might be finding it hard to tell you that something does not suit them?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.07, 1.08 and 1.09. bacb.com.',
      'Fong, E. H., Catagnus, R. M., Brodhead, M. T., Quigley, S., & Field, S. (2016). Developing the cultural awareness skills of behavior analysts. Behavior Analysis in Practice, 9(1), 84–94.',
      'Wright, P. I. (2019). Cultural humility in the practice of applied behavior analysis. Behavior Analysis in Practice, 12(4), 805–809.'
    ]
  },

  g6: {
    aim: [
      'Describe professional conduct in daily terms: reliability, presentation, communication, composure.',
      'Receive feedback well, and act on it.',
      'Recognize when your own condition or circumstances may affect your work, and act.',
      'Know the routes for reporting harm, rights violations and misconduct.'
    ],
    lesson: [
      { h: 'Reliable',
        p: ['The code asks you to be accountable and to follow through on your commitments, and, when you cannot meet one, to work with your supervisor in the client’s best interest. For a student, a technician who arrives on time, prepared, every scheduled day is part of the treatment; cancelled and shortened sessions are lost teaching.',
            'When you will be late or absent, tell the people your workplace names as early as you can, never by simply not appearing. When you plan to leave a job, give proper notice so that the student can be handed over; walking away from a caseload harms the people on it.'],
        check: { q: 'You wake up ill and cannot work today. The professional step is to:',
          opts: ['Send a message to the family an hour after the session should have begun.', 'Go in anyway and say nothing.', 'Notify the people your workplace names, as early as possible, by the route it sets.', 'Ask a friend to cover for you.'],
          a: 2, why: 'Early notice through the proper route lets the session be covered or rescheduled.' } },
      { h: 'How you present',
        p: ['During every work activity, sessions, training and supervision alike, conduct is professional. Dress as your workplace asks and as the work needs: able to sit on the floor, run and be pulled at, safely. Keep your phone away except for work. Keep your language clean and your voice even.',
            'With families and school staff: courteous, discreet, not drawn into gossip or taking sides. With the student: calm when they are not. If you feel your own anger rising in a hard moment, that is the time to follow the plan most exactly, ask for help as your workplace allows, and talk to your supervisor afterwards.'],
        check: { q: 'During a session the student is working independently for five minutes. You:',
          opts: ['Check your personal messages.', 'Keep observing and recording, as the plan says.', 'Chat with the aide about the weekend.', 'Step out for a call.'],
          a: 1, why: 'Session time belongs to the student, and independent work is still observed.' } },
      { h: 'Taking feedback',
        p: ['Feedback is the main way a technician improves, and the code makes acting on it an obligation: you take action to improve your performance following feedback from supervisors. How you receive it also decides how much of it you will be given.',
            'A sequence that works. Listen to the end without explaining. Ask a question if any part is unclear: “Can you show me the timing you mean?” Restate it: “So: prompt within two seconds, and praise the first response.” Say thank you. Do it at the next opportunity. Later, ask: “Is that closer?”',
            'It is normal to feel a sting. Excuses, arguing, silence and tears that close the conversation all teach the supervisor to say less next time, which leaves you worse off. If you believe the feedback is mistaken, say so calmly, with what you observed, and ask how to check.'],
        key: ['Listen', 'Ask to understand', 'Restate', 'Thank', 'Do it', 'Follow up'],
        check: { q: 'Your supervisor says, “Your praise came several seconds late on most trials.” Which response is best?',
          opts: ['“The room was noisy.”', '“Nobody ever told me.”', '“Okay.” (and nothing more)', '“Thanks. So praise within a second or two of the response? Could you watch my next five trials?”'],
          a: 3, why: 'It restates the correction and asks for a check, which is how the change gets made.' } },
      { h: 'When you are not at your best',
        p: ['The code asks you to be aware that your own challenges, such as health, mental health, legal, financial or relationship troubles, and your own biases may affect your ability to do the work. If they may, you take steps and document them: a plan of care, telling your supervisor, stepping back from clients until it is resolved, and in some cases reporting to the BACB.',
            'This is not a demand to be invulnerable. It is a demand to notice. Signs worth acting on: you are short-tempered with students; you make errors you did not make before; you dread particular sessions; you have come to work unfit through exhaustion, illness or substances.',
            'Looking after yourself is therefore part of the job: sleep, breaks, a life outside work, and using the support your workplace offers. Telling a supervisor early that you are struggling is a professional act.'],
        check: { q: 'For two weeks you have been sleeping badly because of a family crisis, and yesterday you snapped at a student. You:',
          opts: ['Push on and hope it passes.', 'Tell your supervisor what is happening and work out a plan together.', 'Call in sick without explanation for a month.', 'Blame the student in the note.'],
          a: 1, why: 'The code asks you to act when a personal challenge may affect services, and to document it.' } },
      { h: 'Protecting clients',
        p: ['Two duties stand above loyalty to colleagues or employer. First, mandated reporting: you must know your local law and your workplace’s procedure for reporting suspected abuse or neglect, and follow them without delay. You report a reasonable suspicion; you do not investigate or wait for proof.',
            'Second, the code requires you to act when you learn that a client’s legal rights are being violated or that a client is at risk of harm: report it to your supervisor, follow your organization’s policies, and document what you did. In some cases the authorities, a licensing board or the BACB must be contacted.',
            'Examples: restraint or seclusion used outside a plan or the law; food, toileting or contact with family withheld as punishment; a student left unsupervised; humiliation; a plan carried out in a way that injures.'],
        check: { q: 'You see a staff member shut a student alone in a storage room “to calm down”, which is not in any plan. You:',
          opts: ['Assume there is a reason.', 'Wait to see if it happens again.', 'Make sure the student is safe, report it at once to your supervisor and as your organization’s policy requires, and document it.', 'Mention it at the next monthly meeting.'],
          a: 2, why: 'A risk of harm and a possible rights violation: immediate protection, report and record.' } },
      { h: 'Misconduct by others',
        p: ['When you suspect that a colleague, or a supervisor, has broken the code, the order is as in unit G1: bring it to your supervisor first (or, if it concerns your supervisor, to the person your workplace names), and document each step with dates. If it is not resolved, go to the appropriate authority; a breach of the BACB’s codes that remains unresolved with your supervisor’s support is reported to the BACB.',
            'Reporting in good faith is a duty, not disloyalty, and retaliation against someone who reports is itself misconduct. Keep to facts you observed, keep it confidential, and do not conduct your own investigation.',
            'The same honesty applies to yourself. The code lists events you must self-report to the BACB within 30 days; unit H2 covers them.'],
        check: { q: 'You report a concern in good faith and it turns out there was an innocent explanation. You have:',
          opts: ['Committed misconduct.', 'Done what the code asks.', 'Damaged your career.', 'Breached confidentiality.'],
          a: 1, why: 'The duty is to raise a reasonable concern through the right route, not to be certain.' } }
    ],
    examples: {
      ask: 'What kind of response to feedback is this?',
      intro: 'Nine responses to a supervisor’s feedback. Decide whether each helps the technician improve.',
      opts: ['Helps: a professional response', 'Gets in the way'],
      items: [
        { s: '“Could you show me once more how you block that? I want to copy it exactly.”', a: 0, why: 'A request for a model.' },
        { s: '“That’s not how my last supervisor did it.”', a: 1, why: 'A deflection. A real question about the difference would be fine, asked as a question.' },
        { s: '“So I should wait the full five seconds before prompting. Got it. Will you check me on Thursday?”', a: 0, why: 'Restates and arranges follow-up.' },
        { s: 'Nodding, then running the procedure the same way the next day.', a: 1, why: 'Agreement without action.' },
        { s: '“I think I did deliver the token each time; could we look at the data sheet together?”', a: 0, why: 'A calm disagreement with a way to check.' },
        { s: '“He was having a bad day, anyone would have struggled.”', a: 1, why: 'An excuse that closes the topic.' },
        { s: '“Thank you. That’s hard to hear, and it’s useful.”', a: 0, why: 'Honest and open.' },
        { s: 'Complaining to colleagues afterwards that the supervisor is picky.', a: 1, why: 'Unprofessional, and it changes nothing.' },
        { s: 'Asking, a week later, “Is my timing better now?”', a: 0, why: 'Seeking feedback on the change.' }
      ]
    },
    practice: {
      title: 'A hard week',
      intro: 'Seven moments in one week. Choose the professional response.',
      steps: [
        { t: 'Monday 7:10', see: 'Your car will not start. Your session begins at 8:00.', opts: ['Arrive when you can and explain then.', 'Call the number your workplace sets now, say when you expect to arrive, and follow what you are told.', 'Message the student’s mother on her personal phone.'], a: 1, why: 'Early notice by the proper route.' },
        { t: 'Monday 10:00', see: 'Your supervisor observes and says, “You gave three instructions before he had a chance to answer the first.”', opts: ['“He wasn’t listening.”', '“One instruction, then wait. Could you count for me on the next ten?”', 'Say nothing and look at the floor.'], a: 1, why: 'Restated, and a check requested.' },
        { t: 'Tuesday', see: 'The classroom aide starts telling you gossip about the student’s parents’ divorce.', opts: ['Listen: it may be useful.', 'Say kindly that you would rather not talk about the family, and change the subject.', 'Add what you know.'], a: 1, why: 'Discretion, and confidentiality for stakeholders.' },
        { t: 'Wednesday', see: 'The student spits in your face. You feel a flash of real anger.', opts: ['Tell him sharply exactly what you think.', 'Follow the plan’s response exactly, keep your voice even, and talk with your supervisor afterwards about how it affected you.', 'Walk out of the room and leave him alone.'], a: 1, why: 'The plan is the guide when feelings run high; the feeling goes to supervision. Leaving a student unsupervised is unsafe.' },
        { t: 'Thursday', see: 'You notice a colleague’s data sheets for a session are filled in before the session has begun.', opts: ['Say nothing: perhaps she is efficient.', 'Tell your supervisor what you saw and when, and write it down.', 'Photograph the sheets and send them to other staff.'], a: 1, why: 'A reasonable concern, raised with the supervisor, documented, and kept confidential.' },
        { t: 'Friday morning', see: 'You have had four hours of sleep a night all week and nearly fell asleep at the wheel on the way in.', opts: ['Drink more coffee and carry on.', 'Tell your supervisor before your first session that you are not fit to work safely, and agree what to do.', 'Run shorter sessions and record full ones.'], a: 1, why: 'A condition that may affect safe service is acted on. Recording sessions that were not run would be falsification.' },
        { t: 'Friday afternoon', see: 'A student tells you his stepfather “locks him in the cupboard at night”.', opts: ['Ask him many questions to be sure.', 'Promise to keep it secret.', 'Listen, tell him he did right to say so, and follow the mandated-reporting procedure and inform your supervisor today.'], a: 2, why: 'A reasonable suspicion is reported at once. You do not investigate or promise secrecy.' }
      ]
    },
    quiz: { pass: 80, draw: 10, items: [
      { q: 'When you cannot meet a work commitment, the code asks you to:', opts: ['Say nothing.', 'Work with your supervisor to address it in the client’s best interest.', 'Find your own replacement.', 'Resign.'], a: 1, why: 'Standard 1.02.' },
      { q: 'Professional conduct is expected:', opts: ['During all work activities, including training and supervision.', 'Only with clients.', 'Only when observed.', 'Only on site.'], a: 0, why: 'Standard 2.03.' },
      { q: 'After feedback from a supervisor, the code requires that you:', opts: ['Agree politely.', 'Explain your reasons.', 'Take action to improve your performance.', 'Ask for it in writing.'], a: 2, why: 'Acting on feedback is the obligation.' },
      { q: 'A good first response to corrective feedback is to:', opts: ['Explain what went wrong.', 'Point out what the supervisor missed.', 'Stay silent.', 'Listen, and restate what you will change.'], a: 3, why: 'Listening and restating show that the message arrived.' },
      { q: 'If you believe feedback is mistaken, you:', opts: ['Ignore it.', 'Say so calmly, with what you observed, and ask how to check.', 'Complain to colleagues.', 'Agree and do nothing.'], a: 1, why: 'Honest and professional disagreement.' },
      { q: 'Personal challenges that may affect your services should be:', opts: ['Addressed with steps such as a care plan or telling your supervisor, and documented.', 'Hidden.', 'Shared with families.', 'Ignored unless someone complains.'], a: 0, why: 'Standard 1.09.' },
      { q: 'A mandated report is made when you have:', opts: ['Proof.', 'A confession.', 'A reasonable suspicion of abuse or neglect.', 'The parents’ permission.'], a: 2, why: 'You report suspicion; you do not investigate.' },
      { q: 'You become aware that a client’s legal rights are being violated. You:', opts: ['Stay out of it.', 'Tell the client to complain.', 'Wait for the annual review.', 'Report to your supervisor, follow organization policy and document it.'], a: 3, why: 'Standard 2.07; authorities may also need to be contacted.' },
      { q: 'A suspected ethics violation by a colleague is first:', opts: ['Posted online.', 'Brought to your supervisor and documented.', 'Reported to the family.', 'Ignored.'], a: 1, why: 'Supervisor first, with a record.' },
      { q: 'A violation of the BACB’s codes that is not resolved with your supervisor’s support is:', opts: ['Reported to the BACB.', 'Dropped.', 'Settled privately.', 'Left for someone else.'], a: 0, why: 'As the code’s introduction sets out.' },
      { q: 'During a session, your personal phone is:', opts: ['Used when the student is busy.', 'On the table, face up.', 'Put away unless it is needed for work.', 'Used for music.'], a: 2, why: 'The session is the student’s time.' },
      { q: 'Leaving a job without notice, with students on your caseload:', opts: ['Is your right and has no ethical side.', 'Is the employer’s problem only.', 'Is fine if you are unhappy.', 'Harms clients; commitments are to be honored or handed over properly.'], a: 3, why: 'Follow-through on commitments protects continuity of care.' },
      { q: 'Reporting a concern in good faith that proves unfounded is:', opts: ['Misconduct.', 'What the code asks of you.', 'Defamation.', 'A reason for discipline.'], a: 1, why: 'The duty is to raise reasonable concerns properly.' },
      { q: 'When your anger rises during a session, you:', opts: ['Follow the plan exactly, stay even, and take it to supervision afterwards.', 'Let the student know how you feel.', 'End the session and leave the student.', 'Ignore the plan.'], a: 0, why: 'The plan protects the student and you.' }
    ] },
    role: [
      { t: 'Receive feedback', setup: 'The trainer watches the trainee run a short simulated procedure, then gives one piece of praise and two specific corrections, one of them debatable.',
        steps: ['Listens without interrupting or explaining.', 'Asks a question to understand at least one point.', 'Restates what they will change.', 'Raises the debatable point calmly, with what they observed.', 'Thanks the trainer and asks to be checked again.', 'Runs the procedure again with the corrections in place.'] },
      { t: 'Report what you saw', setup: 'The trainer gives a written scenario in which a client was put at risk by a staff member, and plays the supervisor.',
        steps: ['Says what they did to make the client safe.', 'Reports facts: what, who, when, where.', 'Gives no opinion of the person’s character.', 'Asks what else policy requires.', 'Says what they will document.'] }
    ],
    roleRule: 'Met when each role-play is done once with every step in place.',
    discuss: [
      'Think of feedback you took badly. What would you do differently now?',
      'What is your workplace’s mandated-reporting procedure? Whom do you call, and what do you write?',
      'What are your own early signs that you are not at your best?'
    ],
    read: [
      'Behavior Analyst Certification Board. RBT Ethics Code (2.0). Standards 1.02, 1.09, 2.01, 2.03 and 2.07, and the introduction. bacb.com.',
      'Ehrlich, R. J., Nosik, M. R., Carr, J. E., & Wine, B. (2020). Teaching employees how to receive feedback: A preliminary investigation. Journal of Organizational Behavior Management, 40(1–2), 19–29.'
    ]
  }
});
