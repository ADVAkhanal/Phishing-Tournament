// seed-data/tabletop.js — NCSC Exercise-in-a-Box style tabletop exercises
//
// Structure and facilitation model taken directly from NCSC's own guidance
// (https://www.ncsc.gov.uk/section/exercise-in-a-box/tabletop-exercises and
// https://www.ncsc.gov.uk/guidance/effective-steps-to-cyber-exercise-creation):
//
//   - Discussion questions are deliberately worded to have NO single right answer.
//     The point is to surface how the team would actually reason it out under
//     pressure, not to test recall of a policy document.
//   - Recommended roles match NCSC's own list: a senior leader who can make real
//     business/IT decisions, a technical responder, a communications advisor, and
//     a scribe. Four different people, four different blind spots.
//   - Every exercise carries explicit EXERCISE-EXERCISE-EXERCISE framing so nobody
//     in the room, or copied on a "send this to the team" email during the drill,
//     mistakes a rehearsal for a real incident.
//   - NCSC is explicit that exercising should stress-test EXISTING response plans,
//     not invent them live. If a facilitator runs one of these and finds Advanced
//     Companies has no answer to a basic question ("who has the authority to take
//     a production system offline?"), that gap is itself the most valuable output
//     of the session — write it down as an action item, don't paper over it.

module.exports = [
  {
    title: 'A Ransomware Attack Delivered by a Phishing Email',
    objective:
      'Evaluate how well the organization is protected against phishing-delivered ransomware, and how it would actually respond and recover if one succeeded. Adapted directly from the NCSC Exercise in a Box scenario of the same name.',
    scenario_summary:
      'A shop-floor employee reports that files on a shared production drive have unusual extensions and a ransom note has appeared. It is not yet known how far the infection has spread or whether ProShop ERP or CAD/CAM data is affected.',
    recommended_roles: [
      'Senior leader — someone who can make real business and IT decisions in the room',
      'Cyber security engineer / IT lead — technical knowledge of the actual defenses in place',
      'Communications advisor — internal and external communications, including customers and DIBCAC/primes if CUI may be affected',
      'Scribe — captures decisions, gaps, and open questions verbatim for the hot-wash',
    ],
    estimated_minutes: 90,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['6.9', '8.2', '8.3'],
    injects: [
      {
        stage: 1,
        narrative:
          "9:14 AM. A machine operator calls the IT help desk: files on the shared 'Production' drive have new .locked extensions and a ransom note text file has appeared in several folders. They noticed because a work-instruction PDF they needed wouldn't open.",
        discussion_questions: [
          'Who is the first person this call should actually reach at Advanced Companies today — not who the org chart says, but who would genuinely pick up?',
          'What is the very first technical action that person would take, and could they take it without asking permission from someone who might not be reachable for an hour?',
          'How would you know, in the first ten minutes, whether this is contained to one folder or actively spreading?',
        ],
      },
      {
        stage: 2,
        narrative:
          '9:40 AM. IT confirms the encryption is spreading — it has now reached a second shared drive. Nobody has identified patient zero yet, but three employees mention receiving an odd "FactoryWiz firmware update" email yesterday.',
        discussion_questions: [
          'Do you pull the affected machines off the network immediately, even if it interrupts active production jobs? Who has the authority to make that call, and are they in the room right now?',
          'If CUI-scoped systems are anywhere near the spreading infection, what does your notification clock actually look like — and who starts it?',
          'What do you tell the machine operators on the floor in the next 15 minutes, given they don\'t need the technical details but do need to know what NOT to do?',
        ],
      },
      {
        stage: 3,
        narrative:
          '11:00 AM. The spread is contained to two file shares, neither of which appears to hold CUI, but ProShop ERP access is intermittent because a shared drive it references is now offline. A production customer calls asking why their order status page hasn\'t updated since yesterday.',
        discussion_questions: [
          'What do you tell that customer? Is there a version of the truth that is both honest and doesn\'t create unnecessary alarm — and who is authorized to say it?',
          'At what point, if any, does this become something you report externally (cyber insurance, law enforcement, a prime contractor)? Who makes that call and what would they need to know first?',
          'Backups: does anyone in this room actually know how recent the last verified-restorable backup of the affected drives is? If not, that answer alone is worth writing down as an action item.',
        ],
      },
      {
        stage: 4,
        narrative:
          '3:00 PM. IT believes the ransomware entered via the "FactoryWiz firmware update" phishing email that three employees received and one employee clicked, though none appear to have run the attached file. The affected drives are being restored from backup.',
        discussion_questions: [
          'The employee who clicked came forward voluntarily an hour into this. What message does the org\'s reaction to that send to the next person who clicks something and isn\'t sure?',
          'What would need to be true about your phishing simulation program for this exact email to have already been something employees recognized on sight?',
          "What's the one process gap this exercise just exposed that nobody in this room knew about before today?",
        ],
      },
    ],
  },
  {
    title: 'Supply Chain Compromise via a Vendor Phishing Email',
    objective:
      'Test how the organization would detect and respond to a compromise introduced through a trusted supplier or subcontractor relationship — directly relevant to AS9100D clause 8.4 supplier controls and CMMC flow-down obligations.',
    scenario_summary:
      'A long-standing tooling vendor\'s email account has been compromised. The attacker is using it to send a convincing invoice-fraud email to Accounts Payable, and separately to request access to a shared project folder that may contain drawings covered under an ITAR-restricted contract.',
    recommended_roles: [
      'Senior leader — someone empowered to pause a vendor payment or a contract deliverable',
      'Cyber security engineer / IT lead',
      'Communications advisor — for contacting the vendor and, if needed, the affected customer/prime',
      'Scribe',
    ],
    estimated_minutes: 75,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['9.1', '3.1', '2.2'],
    injects: [
      {
        stage: 1,
        narrative:
          'Accounts Payable receives an email from ANT Solutions, a real and current tooling vendor, requesting updated ACH remittance details for an outstanding invoice. The email address matches what AP has on file for prior correspondence.',
        discussion_questions: [
          "What's the actual verification step AP would take before changing banking details on file — and does everyone in AP know it, or only the most experienced person?",
          'If the answer is "call the vendor to confirm," whose phone number do they call — the one in the email signature, or one already on file from before? Does that distinction matter here, and would AP know why?',
        ],
      },
      {
        stage: 2,
        narrative:
          'Separately, the same vendor account emails an engineer asking to be re-added to a shared drawing folder "since I lost access after our system upgrade." The folder contains drawings covered under an ITAR-restricted program.',
        discussion_questions: [
          "This request sounds mundane — a lost-access ticket, not an attack. What's the actual process for verifying a re-access request before it's granted, and would it have caught this?",
          'If access were granted and drawings were exposed, who needs to be told, how fast, and under what regulatory clock (ITAR, DFARS, contract-specific)? Does anyone in this room know that clock off the top of their head?',
        ],
      },
      {
        stage: 3,
        narrative:
          "The vendor calls Advanced Companies directly, confused — they never sent either email. Their own IT confirms their email account was compromised roughly a week ago. It is unknown what else may have gone out from that account to other customers of theirs, or been received from it by Advanced Companies in the past week.",
        discussion_questions: [
          "How far back would you look for other suspicious correspondence from this vendor, and who actually does that search?",
          "This vendor passed your supplier qualification process. What would need to change about that process, if anything, given what just happened — and is that a fair thing to ask of a vendor who was themselves a victim?",
          "What's the one thing you'd tell every other vendor-facing employee tomorrow morning, in one sentence, based on what happened here?",
        ],
      },
    ],
  },
  {
    title: 'Executive Wire-Fraud Attempt (Business Email Compromise)',
    objective:
      'Test the organization\'s resistance to executive impersonation targeting a wire transfer — one of the most common and highest-impact attacks against small and mid-sized manufacturers.',
    scenario_summary:
      'An employee in Accounting receives an urgent, informally-worded email that appears to be from a company executive, requesting a same-day wire transfer to a new supplier account and explicitly asking that no one else be looped in yet.',
    recommended_roles: [
      'Senior leader — ideally the actual executive whose identity is commonly impersonated in these attacks, to discuss it from their own perspective',
      'Someone from Accounting/Finance who would realistically receive this request',
      'Communications advisor',
      'Scribe',
    ],
    estimated_minutes: 60,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['2.2', '9.1'],
    injects: [
      {
        stage: 1,
        narrative:
          'An Accounting employee receives an email that looks like it\'s from a senior executive: informal tone, sent "from my iPhone," asking for a wire to be processed before end of day for a supplier holding a shipment, and explicitly saying not to loop anyone else in yet because they\'re "still under NDA."',
        discussion_questions: [
          'What is it about this specific request — the isolation instruction, the urgency, the informality — that would make someone pause, versus just comply because it appears to come from someone senior?',
          'Does Accounting have a real, working "second channel" verification step for wire requests above a certain dollar amount? If yes, would it survive a request that explicitly asks to bypass it?',
        ],
      },
      {
        stage: 2,
        narrative:
          'The employee tries calling the executive\'s cell phone to confirm and gets voicemail. A follow-up email arrives minutes later: "Sorry, in a meeting, can\'t talk — just process it, I\'ll explain later."',
        discussion_questions: [
          'A voicemail and a fast follow-up email that anticipates your hesitation — does that increase or decrease your suspicion, and why might it do the opposite of what you\'d expect?',
          'What is the actual, specific point at which this employee is empowered to simply say no and wait, even under this pressure? Is that point written down anywhere, or does it live only in this room\'s heads right now?',
        ],
      },
      {
        stage: 3,
        narrative:
          'The employee escalates instead of processing the wire. It turns out to be fraudulent — the real executive never sent it. Leadership later learns this is the third such attempt against the company this year; the first two succeeded for a combined $40,000.',
        discussion_questions: [
          'If the first two attempts succeeded, what changed between then and now that made this one fail — was it a process change, or did this one employee just get lucky?',
          'Should the two successful attempts from earlier this year have been treated as a pattern worth a company-wide notice at the time? What would that notice have said?',
          'What is this exercise\'s single most important takeaway for someone who was not in the room today?',
        ],
      },
    ],
  },
];
