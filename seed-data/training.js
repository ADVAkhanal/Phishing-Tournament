// seed-data/training.js — 8 CMMC-aligned training modules
//
// Each module ships ≥500 words of actual training content with shop-floor
// examples, plus a 5-question quiz stored as JSON.

const wrap = (title, body) => `
  <article class="training-content">
    <h1>${title}</h1>
    ${body}
  </article>
`;

module.exports = [
  // ------------------------------------------------------------------
  {
    title: 'Phishing Fundamentals',
    description: "What phishing is, how it works in a manufacturing environment, and the five red flags every Advanced Companies employee should know.",
    category: 'Phishing Awareness',
    difficulty: 'beginner',
    estimated_minutes: 8,
    points_reward: 50,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['6.1', '6.12'],
    content_html: wrap('Phishing Fundamentals', `
      <p class="lead"><b>Phishing</b> is the use of fraudulent email, text message, or phone call to trick you into giving up something valuable — a password, a wire transfer, or just one careless click. It is the single most common way attackers get into a manufacturer's network, and aerospace / defense suppliers like Advanced Machining &amp; Fab. are deliberately targeted.</p>

      <h2>Why phishing works on a shop floor</h2>
      <p>A modern shop floor is busy, time-pressured, and full of legitimate digital noise: tracking updates from carriers, MRP alerts from ProShop, NCRs from QA, RFQs from customers, MFA prompts from Microsoft 365. Attackers know this and craft emails that <em>look like</em> the noise you are already used to ignoring or quickly acting on. They are not after computers — they are after the human in front of the computer.</p>

      <h2>The five red flags</h2>
      <ol>
        <li><b>Urgency.</b> "Within 24 hours." "Before close of business." "Or your account will be suspended." Real systems do not normally talk like this.</li>
        <li><b>Unfamiliar sender domain.</b> Hover your mouse over the sender's name. If the email reads <code>scott.shortess@advcosinc.com</code> but the actual address is <code>scott.shortess.exec@gmail.com</code>, that's a phish.</li>
        <li><b>Mismatched links.</b> Hover over every link before you click. <code>proosh0p-erp.com</code> is not <code>proshoperp.com</code>. <code>microsoft365-secure-signin.com</code> is not <code>microsoft.com</code>.</li>
        <li><b>Unexpected attachment or download.</b> Especially anything ending in <code>.exe</code>, <code>.zip</code>, or a strange document type. Legitimate vendors do not ship firmware as an email attachment.</li>
        <li><b>Out-of-process request.</b> Anything that asks you to skip the normal process — wire money without dual approval, change banking details without a callback, install software without an IT ticket — is suspicious by default.</li>
      </ol>

      <h2>How a real attack looks on our floor</h2>
      <p>Imagine you get an email at 2:47 PM that reads "ProShop password expires in 24 hours — click here to re-validate." You're between jobs, you're tired, the day is almost over, and you don't want to be locked out tomorrow morning. You click. You see what looks like a ProShop login screen. You type your credentials. By the time you finish your shift, an attacker is logged in as you — and from inside the network, they have access to drawings, schedules, and potentially CUI.</p>
      <p>The attacker did not "hack" anything. They <em>asked</em> for your password, and you gave it to them. This is why phishing is the #1 way attackers get into companies like ours.</p>

      <h2>What to do when something feels off</h2>
      <ul>
        <li><b>Slow down.</b> Urgency is the attacker's weapon. Take 30 seconds.</li>
        <li><b>Hover, don't click.</b> Read the actual link.</li>
        <li><b>Verify out-of-band.</b> If "Scott" asks for a wire, call Scott on the phone using a number you already have — not one in the email.</li>
        <li><b>Report it.</b> Use the <a href="/report" class="brand-link">🚨 Report Suspicious Email</a> button. You will be rewarded for reporting even if it turns out to be legitimate. We never punish reporting.</li>
      </ul>

      <h2>Related company policies</h2>
      <p>This module supports two sections of the Advanced Companies Employee Handbook:</p>
      <ul>
        <li><b>§6.1 Computer Security and Copying of Software</b> — your duty to exercise caution with electronic communications and protect company systems.</li>
        <li><b>§6.12 Use of Company Technology</b> — appropriate use of company email and equipment.</li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'Which of these is NOT one of the five core red flags of a phishing email?',
          options: [
            'Manufactured urgency',
            'Unfamiliar sender domain',
            'A typo in the body of the email',
            'A link that goes somewhere different from where it appears',
          ],
          answer: 2,
        },
        {
          q: 'You receive an email claiming your ProShop password expires in 24 hours. The link goes to proosh0p-erp.com. What should you do?',
          options: [
            'Click immediately — losing access would be a disaster',
            'Forward it to a coworker to see what they think',
            'Hover the link, see the suspicious domain, and report it via the Report button',
            'Reply asking the sender to confirm',
          ],
          answer: 2,
        },
        {
          q: 'A phishing email asks you to do something that bypasses normal company process (skip dual approval, install software outside IT). This is:',
          options: [
            'Probably fine if it comes from a manager',
            'A red flag, regardless of who it appears to be from',
            'Acceptable if marked URGENT',
            'Only suspicious if it asks for money',
          ],
          answer: 1,
        },
        {
          q: 'If you accidentally clicked a phishing link and entered your credentials, what should you do?',
          options: [
            'Hope nothing happens',
            'Wait until tomorrow to mention it',
            'Report it to IT immediately so they can revoke your session and force a password reset',
            'Try to log in again to make sure your account still works',
          ],
          answer: 2,
        },
        {
          q: 'PhishGuard rewards reporting suspicious emails. If you report something that turns out to be a real, legitimate message, what happens?',
          options: [
            'You lose points',
            'You still receive points — we never punish reporting',
            'Your name goes on a list of false reporters',
            'Nothing — only correct reports count',
          ],
          answer: 1,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Social Engineering in Manufacturing',
    description: 'Pretexting, vishing, customer/vendor impersonation — how attackers exploit the relationships unique to an aerospace shop.',
    category: 'Social Engineering',
    difficulty: 'intermediate',
    estimated_minutes: 10,
    points_reward: 75,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['6.9', '9.1'],
    content_html: wrap('Social Engineering in Manufacturing', `
      <p class="lead">Social engineering is psychological manipulation. The attacker's tool is not malware — it is <em>you</em>. They study how your company operates, who reports to whom, who your customers are, and which vendors you trust. Then they call, email, or text in a way that fits naturally into your day.</p>

      <h2>Pretexting</h2>
      <p>A pretext is a story the attacker invents to make their request sound normal. On our floor, common pretexts include:</p>
      <ul>
        <li><em>"Hi, this is the Gulfstream procurement team — we need updated certs by 4 PM."</em></li>
        <li><em>"This is FactoryWiz support — we're rolling out a firmware update tonight."</em></li>
        <li><em>"It's the new IT contractor; Randel asked me to push a patch on your workstation."</em></li>
      </ul>
      <p>Notice how each pretext borrows a real customer, real software vendor, or real internal name. Attackers do their homework — they read your website, your LinkedIn page, your trade-show photos.</p>

      <h2>Vishing (voice phishing)</h2>
      <p>The phone is still one of the most effective attack tools because it carries authority and urgency. A vishing call typically follows this pattern: a confident voice, a real name, a plausible reason, and a small ask that escalates. "Can you confirm the model number on the CMM in cell 4? Thanks. While I have you — can you read me the asset tag on the workstation next to it? Great. One more — what's the username your team logs in with on that machine?"</p>

      <h2>Customer impersonation</h2>
      <p>Because we have a small, identifiable customer base — Gulfstream, Bell, the primes downstream of them — attackers can convincingly impersonate buyers. An RFQ that "must be answered by EOD" or a "shipping address update" that arrives during a real ongoing project feels legitimate. <b>Always verify against the actual contact you already have on file, not the address that arrived in this email.</b></p>

      <h2>Vendor impersonation and BEC</h2>
      <p>Business Email Compromise (BEC) is one of the most expensive attack categories in manufacturing. The pattern: an attacker takes over a real vendor's mailbox or registers a look-alike domain. They watch the conversation about an outstanding invoice. At the right moment, they send a polite "Please note our new bank routing information for this payment." If accounting updates the remittance, the money goes to the attacker — not the vendor — and the vendor still expects to be paid. <b>Any change of banking information requires a call-back verification using a phone number from your existing vendor record.</b></p>

      <h2>Defenses</h2>
      <ul>
        <li><b>Trust the process, not the personality.</b> Our purchasing, wire-transfer, and IT-change procedures exist precisely to absorb pressure. If a request asks you to skip a step, that's the test.</li>
        <li><b>Out-of-band verification.</b> Phone &gt; email. A number you already know &gt; a number in the message.</li>
        <li><b>Limit what you say on calls you didn't initiate.</b> Names of vendors, asset tags, ERP versions, network details — none of these are confidential, but together they help an attacker build the next pretext.</li>
        <li><b>Report calls and emails you find suspicious.</b> Even if no information was shared, the data point (someone is probing us) is valuable.</li>
      </ul>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§6.9 Security</b> — duty to report potential security risks to your manager.</li>
        <li><b>§9.1 Confidentiality and Nondisclosure of Trade Secrets</b> — information about customers, vendors, and processes must be shared only on a need-to-know basis.</li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'A caller claims to be from Gulfstream procurement and needs your CAGE code "to fast-track an award." What is the correct response?',
          options: [
            'Read it to them — CAGE codes are not secret',
            'Politely take their name and call back using your existing Gulfstream contact',
            'Forward them to your manager',
            'Ask them to email it instead',
          ],
          answer: 1,
        },
        {
          q: 'An email from a vendor asks you to update their banking info for an upcoming ACH payment. Best practice:',
          options: [
            'Update it — they sent a signed PDF letterhead',
            'Update it but flag it for the next AP audit',
            'Call the vendor on a known number to verify before any change',
            "Reply asking them to send the request again with 'verified' in the subject",
          ],
          answer: 2,
        },
        {
          q: 'Which of the following is a pretext?',
          options: [
            "A confident story the attacker invents to make their request sound normal",
            "An encrypted attachment",
            "A typo in a phishing email",
            "An out-of-office reply",
          ],
          answer: 0,
        },
        {
          q: 'Vishing refers to:',
          options: [
            'Visual phishing via fake screenshots',
            'Phishing over voice / phone calls',
            'Phishing using video meetings',
            'Phishing using virtual reality',
          ],
          answer: 1,
        },
        {
          q: 'What information shared on a "harmless" cold call could later help an attacker?',
          options: [
            'Asset tags on machines',
            'Names of software vendors you use',
            'Names of internal staff and their roles',
            'All of the above',
          ],
          answer: 3,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Recognizing Insider Threats',
    description: 'Spotting the warning signs of insider risk — accidental or malicious — and the supportive way to escalate concerns.',
    category: 'Insider Threat',
    difficulty: 'intermediate',
    estimated_minutes: 9,
    points_reward: 75,
    cmmc_control: 'AT.L2-3.2.3',
    handbook_refs: ['5.10', '6.9', '9.1'],
    content_html: wrap('Recognizing Insider Threats', `
      <p class="lead">An <b>insider threat</b> is risk that comes from someone with legitimate access to our systems, our floor, or our information. Most insider incidents are not malicious — they are accidents, frustration, or carelessness. A small number are deliberate. CMMC requires every cleared / CUI-handling employee to be trained to recognize both.</p>

      <h2>Three categories</h2>
      <ol>
        <li><b>Negligent insider.</b> Means well, but makes mistakes — emails CUI to a personal address to "work over the weekend," writes a password on a sticky note, plugs in a USB stick from a trade show.</li>
        <li><b>Compromised insider.</b> A trusted user whose account has been taken over by an external attacker (usually via phishing). From the system's perspective they look legitimate.</li>
        <li><b>Malicious insider.</b> A person deliberately stealing, sabotaging, or leaking information. Rare, but the highest impact.</li>
      </ol>

      <h2>Behavioral indicators</h2>
      <p>Not every indicator is a confirmed problem — they are <em>signals</em> worth paying attention to:</p>
      <ul>
        <li>Working unusual hours on the floor or remoting in late at night with no project reason</li>
        <li>Asking for access to systems or drawings unrelated to their job</li>
        <li>Plugging personal devices (phones, USB drives) into ERP or controller workstations</li>
        <li>Photographing drawings, tooling, or screens with a personal phone</li>
        <li>Sudden major changes in financial pressure, attitude, or grievance against the company</li>
        <li>Resignation or termination notice followed by unusual download or print activity</li>
        <li>Open complaints about being "underpaid" combined with statements like "they need me more than I need them"</li>
      </ul>

      <h2>Technical indicators</h2>
      <ul>
        <li>Large file transfers to personal email or cloud storage</li>
        <li>Access to file shares the user does not normally touch</li>
        <li>Failed-login spikes on a user account (potentially compromised)</li>
        <li>Disabled antivirus or endpoint protection on a workstation</li>
      </ul>

      <h2>How to escalate — without accusing</h2>
      <p>You are not the investigator. You are the early warning. The right action is to <b>report what you observed, not what you concluded.</b> Example:</p>
      <blockquote>"I noticed Pat plugged a personal USB drive into the QA workstation around 2:30 PM. I wanted to flag it in case that's not allowed."</blockquote>
      <p>That sentence is a fact. It does not call Pat a thief. The IT admin / management can then determine what (if anything) actually happened.</p>

      <h2>What about my own mistakes?</h2>
      <p>If <em>you</em> accidentally emailed CUI to a personal address, clicked a phishing link, or lost a company laptop — <b>report it immediately</b>. Speed of disclosure is the single biggest factor in whether an incident is contained or becomes a breach. Per §6.9, prompt disclosure is part of your security duty, and Advanced Companies does not punish honest reporting of mistakes.</p>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§5.10 Workplace Privacy</b> — limits on what may be photographed or recorded on the floor.</li>
        <li><b>§6.9 Security</b> — duty to advise management of known or potential security risks.</li>
        <li><b>§9.1 Confidentiality and Nondisclosure of Trade Secrets</b> — protection of customer drawings, processes, and CUI.</li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'Which is the MOST common type of insider threat?',
          options: ['Malicious insider', 'Negligent insider', 'Foreign agent', 'Contractor'],
          answer: 1,
        },
        {
          q: 'You see a coworker plug a personal USB stick into the QA workstation. Best action:',
          options: [
            'Confront them and demand they remove it',
            'Ignore it — they probably have a reason',
            'Calmly report what you observed to management or IT, as a factual observation',
            'Post about it in the break-room group chat',
          ],
          answer: 2,
        },
        {
          q: 'Which of the following is a technical indicator of a potentially compromised account?',
          options: [
            'The user took a vacation',
            'Spike in failed logins',
            'The user emailed their manager',
            'The user changed their desktop wallpaper',
          ],
          answer: 1,
        },
        {
          q: 'You accidentally emailed a controlled drawing to your personal Gmail to "work on it tonight." What should you do?',
          options: [
            'Delete the email and hope no one notices',
            "Report it to IT / management immediately — §6.9 requires disclosure of potential risks",
            'Forward it to a coworker for a second opinion',
            'Wait until the next quarterly audit',
          ],
          answer: 1,
        },
        {
          q: 'Reporting a potential insider concern at Advanced Companies is:',
          options: [
            'Discouraged unless you have proof',
            "Punished if you're wrong",
            'Encouraged — you report observations, leadership investigates',
            'Only for HR, not security',
          ],
          answer: 2,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'CUI Handling & Protection',
    description: 'What Controlled Unclassified Information is, how to recognize it, and the rules for storing, transmitting, and disposing of it.',
    category: 'CUI',
    difficulty: 'advanced',
    estimated_minutes: 12,
    points_reward: 100,
    cmmc_control: 'AT.L2-3.2.2',
    handbook_refs: ['6.1', '9.1'],
    content_html: wrap('CUI Handling & Protection', `
      <p class="lead"><b>Controlled Unclassified Information (CUI)</b> is information the U.S. government requires us to safeguard or disseminate only under specific controls — even though it is not classified. As an aerospace / defense supplier, much of what we touch every day is CUI: drawings marked <em>EXPORT CONTROLLED</em>, technical data under ITAR, contract pricing under DFARS, and pre-release component specifications.</p>

      <h2>How to recognize CUI</h2>
      <p>CUI usually carries a banner marking such as:</p>
      <ul>
        <li><code>CUI//SP-EXPT</code> (export-controlled)</li>
        <li><code>CUI//SP-PROCURE</code> (procurement-sensitive)</li>
        <li><code>CUI//SP-PRVCY</code> (privacy)</li>
        <li>Or a plain <code>CUI</code> in the header or footer of the document</li>
      </ul>
      <p>If a customer drawing is marked <em>EXPORT CONTROLLED</em>, treat it as CUI even if the literal word "CUI" is absent. When in doubt, ask QA or the program manager.</p>

      <h2>Storing CUI</h2>
      <ul>
        <li><b>Digital.</b> CUI lives on approved company systems only — never on personal devices, personal cloud accounts, or unencrypted thumb drives.</li>
        <li><b>Paper.</b> CUI in print form is stored in a locked cabinet when not in use, and never left face-up at an unattended desk.</li>
        <li><b>Shop floor.</b> Drawings posted at a machine are still CUI. They are not for photographs, social media, or trade-show props.</li>
      </ul>

      <h2>Transmitting CUI</h2>
      <ul>
        <li><b>Internal email:</b> permitted between approved company addresses on our compliant tenant.</li>
        <li><b>External email:</b> only via the approved encrypted channel (e.g. Microsoft 365 encryption / SFTP / customer-approved portal). Never plain email to a personal address.</li>
        <li><b>USB / removable media:</b> only with encrypted, IT-issued drives.</li>
        <li><b>Physical mail:</b> double-enveloped, with no CUI markings on the outer envelope.</li>
      </ul>

      <h2>Sharing on a need-to-know basis</h2>
      <p>Per §9.1, CUI is shared only with employees whose job requires it. Curiosity is not a need-to-know. A vendor or visitor asking "what does that part go on?" is not a need-to-know.</p>

      <h2>Disposal</h2>
      <ul>
        <li><b>Paper.</b> Cross-cut shredder. No mixing with the regular paper recycling.</li>
        <li><b>Digital.</b> IT-approved sanitization. Returned drives are wiped before disposal.</li>
        <li><b>Hardware.</b> Decommissioned machines and laptops are sanitized or destroyed under an asset-disposal record.</li>
      </ul>

      <h2>If CUI is exposed</h2>
      <p>Immediately notify IT and your manager. Do not try to "clean it up" by deleting evidence — the response team needs a clear picture to assess scope and meet DFARS 252.204-7012's <b>72-hour reporting requirement</b> to DoD if a covered defense information incident occurred.</p>

      <h2>Why this matters</h2>
      <p>CMMC Level 2 exists to protect CUI. A single careless email — a quote PDF forwarded to a personal Gmail, a drawing photographed on a phone — can trigger a reportable incident, suspended contracts, and loss of customer trust. The rules above are not bureaucracy; they are the day-to-day mechanics of being a trusted defense supplier.</p>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§6.1 Computer Security and Copying of Software</b></li>
        <li><b>§9.1 Confidentiality and Nondisclosure of Trade Secrets</b></li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'Which marking indicates the document is CUI?',
          options: ['DRAFT', 'CUI//SP-EXPT', 'INTERNAL USE', 'CONFIDENTIAL FROM SALES'],
          answer: 1,
        },
        {
          q: 'You need to send a CUI drawing to a teammate working from home. The correct method is:',
          options: [
            'Forward it to their personal Gmail so they can open it on the family laptop',
            'Send it via the approved company-encrypted channel to their company account',
            'Text them a photo',
            'Upload it to your personal Dropbox',
          ],
          answer: 1,
        },
        {
          q: 'A vendor visiting the floor asks what aircraft a part goes on. The correct answer is:',
          options: [
            'Tell them — it builds the relationship',
            'Politely decline; that is need-to-know information',
            'Show them the drawing instead',
            "Email them the spec sheet later",
          ],
          answer: 1,
        },
        {
          q: 'You discover an emailed quote with CUI was accidentally cc\'d to an external personal address. What do you do?',
          options: [
            'Delete the email and move on',
            'Quietly ask the recipient to delete it',
            'Notify IT and your manager immediately so DFARS 72-hour reporting can be assessed',
            'Wait until the end of the quarter',
          ],
          answer: 2,
        },
        {
          q: 'Paper CUI is disposed of by:',
          options: ['Regular recycling', 'Cross-cut shredder, separate from regular paper', 'Trash bin', 'Burn barrel out back'],
          answer: 1,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Password Security & MFA',
    description: 'Strong passwords, password managers, and how to use multi-factor authentication without falling for MFA fatigue attacks.',
    category: 'Account Security',
    difficulty: 'beginner',
    estimated_minutes: 7,
    points_reward: 50,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['6.1', '6.12'],
    content_html: wrap('Password Security & MFA', `
      <p class="lead">Your password is the front door to everything we touch — ProShop, email, customer portals, the file shares with CUI on them. A weak or reused password is the cheapest way for an attacker to walk in as you. Multi-factor authentication (MFA) is the deadbolt behind that door.</p>

      <h2>What a strong password looks like</h2>
      <ul>
        <li><b>At least 12 characters.</b> Length matters more than complexity. A 16-character passphrase beats an 8-character "P@ssw0rd1".</li>
        <li><b>Mixed.</b> Uppercase, lowercase, a number, a symbol.</li>
        <li><b>Unique per system.</b> Reusing the same password across ProShop, Microsoft 365, and your personal Amazon means one breach unlocks them all.</li>
        <li><b>Not derived from things public to you.</b> Your kids' names, your truck, your hometown, your favorite team — all guessable.</li>
      </ul>
      <p>One practical approach: a passphrase of four random words plus a number and a symbol. <code>copper-lathe-tundra-river!7</code> is far stronger than <code>Summer2025!</code>.</p>

      <h2>Use a password manager</h2>
      <p>Nobody can memorize a unique 16-character password for 40 systems. A password manager (the company-approved one) generates and stores them so you only have to remember the master password. Talk to IT to get set up.</p>

      <h2>Multi-Factor Authentication (MFA)</h2>
      <p>MFA means signing in requires <em>two</em> things: something you know (password) and something you have (your phone, an authenticator app, or a security key). Even if an attacker steals your password, they cannot log in without the second factor.</p>

      <h3>Approve the prompt — only if you initiated it</h3>
      <p>The most common modern attack against MFA is called <b>MFA fatigue</b>: the attacker already has your password and they hammer the "Approve" prompt on your phone, hoping you tap Approve out of habit or annoyance. <b>Rule:</b> if you did not just type your password into a sign-in screen, you do not tap Approve. Ever.</p>

      <h3>If you receive an MFA prompt out of nowhere</h3>
      <ol>
        <li><b>Deny it.</b></li>
        <li><b>Change your password immediately</b> — your existing password is already compromised.</li>
        <li><b>Tell IT.</b> They need to investigate where the attacker got the password.</li>
      </ol>

      <h2>Where attackers get passwords</h2>
      <ul>
        <li>You reused it on a site that got breached</li>
        <li>You typed it into a phishing page</li>
        <li>It was guessable (Summer2025!, [companyname]2024, etc.)</li>
        <li>It was written on a sticky note visible to a visitor</li>
        <li>Malware on a personal device captured it</li>
      </ul>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§6.1 Computer Security</b></li>
        <li><b>§6.12 Use of Company Technology</b></li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'Which password is strongest?',
          options: ['Summer2025!', 'P@ssw0rd1', 'copper-lathe-tundra-river!7', 'advcosinc2025'],
          answer: 2,
        },
        {
          q: 'You suddenly get an MFA push prompt on your phone but you weren\'t logging in to anything. What should you do?',
          options: [
            'Approve it — must be a glitch',
            'Approve, then change your password',
            'Deny the prompt, change your password, and notify IT',
            'Ignore it and let it time out',
          ],
          answer: 2,
        },
        {
          q: 'Reusing the same password across ProShop, M365, and your personal email is risky because:',
          options: [
            "It isn't risky at all",
            'One breach exposes all of them',
            'It only matters for admin accounts',
            'Passwords are encrypted anyway',
          ],
          answer: 1,
        },
        {
          q: 'A password manager is:',
          options: [
            'A way to write all your passwords in one file',
            'An approved tool for generating and storing unique strong passwords behind a master password',
            'A built-in Windows feature',
            'Only for the IT team',
          ],
          answer: 1,
        },
        {
          q: 'MFA stands for:',
          options: ['Manufacturing Force Approval', 'Multi-Factor Authentication', 'Microsoft File Access', 'Managed File Auditing'],
          answer: 1,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Physical Security on the Shop Floor',
    description: 'Badge discipline, visitor escorts, tailgating, and protecting drawings and tooling on the production floor.',
    category: 'Physical Security',
    difficulty: 'intermediate',
    estimated_minutes: 8,
    points_reward: 75,
    cmmc_control: 'AT.L2-3.2.2',
    handbook_refs: ['6.9', '8.2'],
    content_html: wrap('Physical Security on the Shop Floor', `
      <p class="lead">Cybersecurity ends at the keyboard. The physical security of our facility — who walks in, who walks out, what they see, what they touch — is part of the same protection layer. CMMC, ITAR, and our customer contracts all assume we control the building, not just the network.</p>

      <h2>Badges and access</h2>
      <ul>
        <li><b>Wear your badge visibly</b> when on site. It identifies you to coworkers and to anyone unfamiliar.</li>
        <li><b>Do not lend it.</b> Your badge is tied to you. If a coworker forgot theirs, route them through reception, not your back-door swipe.</li>
        <li><b>Report a lost badge immediately</b> so it can be deactivated.</li>
      </ul>

      <h2>Tailgating</h2>
      <p>Tailgating is when someone walks in behind a badged employee without swiping themselves. It is the #1 physical breach technique, and it works because we are polite. The fix is simple and not rude:</p>
      <blockquote>"Hey — I don't think we've met. Are you here to see someone? Let me walk you to reception."</blockquote>
      <p>Most tailgaters give up the moment they're addressed by name.</p>

      <h2>Visitors</h2>
      <ul>
        <li>All visitors sign in at reception, receive a visitor badge, and are <b>escorted at all times</b>.</li>
        <li>Visitors do not photograph the floor without explicit written authorization.</li>
        <li>Vendors performing maintenance on equipment must be escorted to and from their work area.</li>
      </ul>

      <h2>Drawings and tooling</h2>
      <ul>
        <li>Customer drawings posted at a machine are protected information. Do not photograph, post to social media, or carry them off the floor.</li>
        <li>Tooling marked for a specific program is part of the program's deliverable — treat the toolroom like a controlled area.</li>
        <li>End-of-shift: drawings face down, machines locked, prints filed.</li>
      </ul>

      <h2>Workstations and the clean-desk rule</h2>
      <ul>
        <li>Lock your screen when you step away (<code>Win + L</code>).</li>
        <li>Don't leave CUI prints face-up on a desk visitors can walk past.</li>
        <li>Personal phones / cameras stay off the floor when CUI is in plain view, unless approved.</li>
      </ul>

      <h2>Reporting</h2>
      <p>If something is off — a propped door, an unfamiliar person, a vehicle backing up to a dock without a known driver — say something. Per §6.9 you have an affirmative duty to advise management of potential security risks. The IT admin and shop manager would much rather investigate a non-event than miss a real one.</p>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§6.9 Security</b></li>
        <li><b>§8.2 General Safety</b></li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'A friendly stranger in business casual walks in behind you as you badge into the side door. Correct response:',
          options: [
            "Hold the door — they look like they belong",
            "Politely stop them, ask who they're seeing, and walk them to reception",
            'Ignore them — security is not your job',
            'Confront them aggressively',
          ],
          answer: 1,
        },
        {
          q: 'A vendor needs to maintain a machine on the floor. Per Advanced Companies policy, they should be:',
          options: [
            'Given a permanent badge',
            'Escorted at all times',
            'Allowed to roam if they have a uniform',
            'Asked to wear safety glasses only',
          ],
          answer: 1,
        },
        {
          q: 'You finish a job and walk to lunch. What should you do at your workstation?',
          options: [
            'Leave it as-is, you\'ll be right back',
            'Lock the screen and turn drawings face-down',
            'Log out completely so coworkers cannot use it',
            'Shut down the machine',
          ],
          answer: 1,
        },
        {
          q: 'A coworker forgot their badge and asks you to swipe them through the back door. The right answer is:',
          options: [
            'Swipe them through — you know them',
            "Politely route them through reception so the badge can be re-issued or logged",
            'Loan them yours',
            'Tell them to wait in the parking lot',
          ],
          answer: 1,
        },
        {
          q: 'Can you photograph a customer drawing on a personal phone to "study it later"?',
          options: ['Yes, if you delete it later', 'Yes, if it is not CUI', 'No — drawings are protected information', 'Only on weekends'],
          answer: 2,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Incident Reporting Procedures',
    description: 'Knowing what to report, who to report to, and how fast — including the 72-hour DFARS clock.',
    category: 'Incident Response',
    difficulty: 'intermediate',
    estimated_minutes: 9,
    points_reward: 75,
    cmmc_control: 'AT.L2-3.2.2',
    handbook_refs: ['6.9', '8.2', '8.3'],
    content_html: wrap('Incident Reporting Procedures', `
      <p class="lead">A security incident is anything that <em>could</em> compromise the confidentiality, integrity, or availability of company systems or information. You do not need to be certain — you need to be prompt. Reporting is always the right call.</p>

      <h2>What counts as an incident?</h2>
      <ul>
        <li>You clicked a link in a suspicious email and entered credentials</li>
        <li>A laptop or phone with company data is lost or stolen</li>
        <li>CUI was emailed to a personal address (yours or anyone's)</li>
        <li>An unfamiliar person was found on the floor unescorted</li>
        <li>A USB drive of unknown origin was plugged into a workstation</li>
        <li>A vendor reports they were breached and may have had access to our data</li>
        <li>Your account "behaves weird" — sent mail you didn't send, MFA prompts you didn't trigger, files moved without you doing it</li>
        <li>A wire was sent based on instructions that turned out to be fraudulent</li>
      </ul>

      <h2>Who to tell</h2>
      <ol>
        <li><b>IT Admin</b> — first call, for anything technical (clicked a link, lost a device, suspicious account behavior)</li>
        <li><b>Your manager</b> — for floor-related issues (visitor / badge / physical)</li>
        <li><b>Both</b>, if you are unsure</li>
      </ol>
      <p>Use the <a href="/report" class="brand-link">Report Suspicious Email</a> button for anything phishing-related — it creates an audit-logged record automatically.</p>

      <h2>The 72-hour DFARS clock</h2>
      <p>If our environment touches Covered Defense Information (CUI under a DoD contract) and an incident affects that information, <b>DFARS 252.204-7012(c)</b> requires us to report to DoD via <code>https://dibnet.dod.mil</code> within <b>72 hours</b>. The clock starts when we discover the incident — not when we are certain. This is why speed of reporting matters: every hour spent debating internally is an hour off the response budget.</p>

      <h2>What NOT to do</h2>
      <ul>
        <li><b>Don't try to "clean up" before reporting.</b> Deleting the email, formatting the drive, or hiding the evidence makes investigation harder and may break preservation requirements.</li>
        <li><b>Don't post about it.</b> Not on Slack/Teams general channels, not on LinkedIn, not at lunch. Incident communications are coordinated.</li>
        <li><b>Don't be embarrassed.</b> Phishing succeeds against trained, careful people every day. Speed of disclosure is what differentiates an outcome.</li>
      </ul>

      <h2>What to do</h2>
      <ol>
        <li>Stop using the affected device / account.</li>
        <li>Note the time, what happened, what you saw.</li>
        <li>Tell IT and management.</li>
        <li>Cooperate with the response team.</li>
        <li>Hand over any related evidence (the suspicious email, screenshots, the USB drive).</li>
      </ol>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§6.9 Security</b></li>
        <li><b>§8.2 General Safety</b></li>
        <li><b>§8.3 Reporting of Injuries / Incidents</b></li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'You clicked a phishing link and entered your password. Best first action:',
          options: [
            'Hope it was nothing',
            'Stop using the device and notify IT immediately',
            'Try to log in again to test',
            'Email the attacker and ask them not to use it',
          ],
          answer: 1,
        },
        {
          q: 'Under DFARS 252.204-7012, how long do we have to report a cyber incident affecting Covered Defense Information?',
          options: ['24 hours', '48 hours', '72 hours', '7 days'],
          answer: 2,
        },
        {
          q: 'A coworker found a USB drive in the parking lot and plugged it into a workstation. You should:',
          options: [
            'Tell them next week',
            'Report it to IT immediately — unknown media on a workstation is an incident',
            'Plug it into your own workstation to see what was on it',
            'Throw it away and forget about it',
          ],
          answer: 1,
        },
        {
          q: 'After an incident, what should you NOT do?',
          options: [
            'Report it promptly',
            'Preserve evidence',
            'Delete the suspicious email to clean up your inbox',
            'Cooperate with the response team',
          ],
          answer: 2,
        },
        {
          q: 'A vendor calls to say their environment was breached and they may have had access to our drawings. This is:',
          options: [
            'Their problem, not ours',
            'A reportable incident worth bringing to IT and management immediately',
            'Only relevant at contract renewal',
            'Worth a follow-up next week',
          ],
          answer: 1,
        },
      ],
    },
  },

  // ------------------------------------------------------------------
  {
    title: 'Vendor & Supply Chain Threats',
    description: 'How attackers use vendors, sub-tier suppliers, and third-party software to reach defense manufacturers — and what you can do at every link.',
    category: 'Supply Chain',
    difficulty: 'advanced',
    estimated_minutes: 10,
    points_reward: 100,
    cmmc_control: 'AT.L2-3.2.1',
    handbook_refs: ['2.2', '3.1', '9.1'],
    content_html: wrap('Vendor & Supply Chain Threats', `
      <p class="lead">Some of the biggest cyber incidents of the past decade were not direct attacks. They were <b>supply chain attacks</b> — the attacker compromised a vendor we trusted, then rode that trust into our environment. For an aerospace / defense manufacturer the supply chain is broad: software vendors, raw-material suppliers, calibration labs, freight, IT contractors, even office cleaning crews. Each is a possible vector.</p>

      <h2>The three attack patterns</h2>
      <ol>
        <li><b>Compromised vendor email.</b> Attacker takes over a real vendor's mailbox, watches the conversation about an invoice, then sends a "new banking details" message to redirect the payment. (See: Business Email Compromise.)</li>
        <li><b>Compromised vendor software.</b> Attacker inserts malware into a legitimate software update so that everyone who installs the update gets backdoored. (See: SolarWinds, 3CX, Kaseya.)</li>
        <li><b>Compromised vendor person.</b> A contractor with badge access copies drawings to a personal device. Often unintentional — the contractor wasn't trained the way we train our own staff.</li>
      </ol>

      <h2>What you can do at each link</h2>
      <h3>Purchasing / Accounts Payable</h3>
      <ul>
        <li>Any change to vendor banking information triggers a callback to a known phone number — not the one in the email.</li>
        <li>Two-person approval on any new wire over a defined threshold.</li>
        <li>Watch for invoices that arrive slightly altered (different PO number, different remit-to) — that is exactly what BEC looks like.</li>
      </ul>

      <h3>Engineering / Quality</h3>
      <ul>
        <li>Customer drawings shared to a sub-tier supplier go via the approved encrypted channel, not personal email.</li>
        <li>Sub-tiers receiving CUI are flowed-down the same protection requirements we are required to meet.</li>
      </ul>

      <h3>IT</h3>
      <ul>
        <li>Software updates from vendors are validated where possible, applied from authentic update channels, and rolled out in stages.</li>
        <li>Third-party remote access (cal labs, machine tool vendors) is scoped, logged, and time-limited.</li>
      </ul>

      <h3>Everyone</h3>
      <ul>
        <li>Treat a request "from a vendor" the same way you treat a request from a stranger — verify the channel before acting on it.</li>
        <li>Per §2.2 (Ethics Code), employees do not speak on behalf of Advanced Companies unless authorized. That includes responding to "urgent" vendor requests outside of your role.</li>
        <li>Per §3.1 (Conflicts of Interest), maintain healthy professional distance with vendors — gifts, side arrangements, and over-friendly relationships can be leveraged by attackers.</li>
      </ul>

      <h2>Real-world pattern</h2>
      <p>A common attack against small manufacturers: the attacker breaches a small calibration lab that emails us reports. They wait until a routine cal-report email is expected, then insert a malicious "updated certificate" with a macro-laden Excel file. We open it because we were expecting that email from that vendor. The macro plants a foothold. From there, the attacker pivots to ProShop, drawings, and CUI. The lab did not mean to attack us — they themselves were the first victim.</p>

      <p>The defense at our end: <b>be suspicious of unexpected attachments even from vendors you trust.</b> If a cal report arrives with a macro-enabled spreadsheet, that's the moment to call the lab to confirm before opening.</p>

      <h2>Related company policies</h2>
      <ul>
        <li><b>§2.2 Ethics Code</b></li>
        <li><b>§3.1 Conflicts of Interest</b></li>
        <li><b>§9.1 Confidentiality and Nondisclosure of Trade Secrets</b></li>
      </ul>
    `),
    quiz: {
      pass_score: 80,
      questions: [
        {
          q: 'A trusted vendor sends an email asking AP to update their ACH banking details. Best practice:',
          options: [
            'Update — they signed the email',
            'Update if they include a PDF on their letterhead',
            'Verify with a callback to a known vendor phone number before any change',
            'Forward to a coworker for a second opinion only',
          ],
          answer: 2,
        },
        {
          q: 'A "supply chain attack" is:',
          options: [
            'Hijacking shipping containers',
            'Compromising a trusted vendor (people, email, or software) to reach the target',
            'A union dispute',
            'A counterfeit raw-material issue',
          ],
          answer: 1,
        },
        {
          q: 'Why does sending CUI to a sub-tier supplier via personal email matter, even if "we trust them"?',
          options: [
            "It doesn't matter — they're a partner",
            'It bypasses the contractual flow-down protections required for CUI',
            'It saves time',
            'It is only an issue at contract renewal',
          ],
          answer: 1,
        },
        {
          q: 'A cal lab emails an unexpected macro-enabled spreadsheet labeled "updated certificate." You should:',
          options: [
            'Open it — they are a known vendor',
            'Enable macros and review',
            'Call the lab on a known number to confirm before opening',
            'Forward it to a colleague to open',
          ],
          answer: 2,
        },
        {
          q: 'Per §3.1 (Conflicts of Interest), close personal relationships with vendors can be a security concern because:',
          options: [
            'They cannot — friendships are unrelated to security',
            "They can be leveraged to bypass normal verification ('trust me, just do me a favor')",
            'They cause invoicing errors only',
            'They violate union rules',
          ],
          answer: 1,
        },
      ],
    },
  },
];
