// seed-data/templates.js — 12 manufacturing-specific phishing templates
//
// Each template is a *simulation* — the bodies below are designed to look
// realistic so employees can practice spotting red flags. They are not sent
// from this app; the admin distributes them out-of-band and PhishGuard
// tracks who interacted with them.

const wrap = (inner) => `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222;line-height:1.5;">${inner}</div>`;

module.exports = [
  // ---------- BEGINNER ----------
  {
    name: 'ProShop ERP Password Expires',
    category: 'IT Impersonation',
    difficulty: 'beginner',
    subject_line: 'ACTION REQUIRED: Your ProShop ERP password expires in 24 hours',
    body_html: wrap(`
      <p style="background:#003366;color:#fff;padding:10px 14px;font-weight:bold;">ProShop ERP — IT Service Desk</p>
      <p>Hello,</p>
      <p>Our records show that your <b>ProShop ERP</b> password will expire in <b>24 hours</b>. To avoid being locked out of production scheduling, please re-validate your credentials immediately.</p>
      <p><a href="http://proosh0p-erp-login.com/reset" style="background:#0066cc;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Re-validate Password</a></p>
      <p>If you do not act within 24 hours, your account will be suspended and you will not be able to clock in or release jobs.</p>
      <p style="font-size:11px;color:#888;">— ProShop IT Service Desk<br/>This is an automated notice. Do not reply.</p>
    `),
    body_text: 'Your ProShop ERP password expires in 24 hours. Click http://proosh0p-erp-login.com/reset to re-validate.',
    red_flags: [
      'Sender domain is proosh0p-erp.com (zero instead of "o"), not the legitimate proshoperp.com',
      'Manufactured urgency — "24 hours" or you will be "locked out"',
      'Generic greeting ("Hello,") rather than your name',
      'Link goes to an unfamiliar domain, not the internal ProShop URL',
      'Legitimate IT will never email a password-reset link unsolicited — they raise a ticket',
    ],
    learning_points:
      "If you had clicked this link and entered your credentials, it would have violated Section 6.1 (Computer Security) and Section 6.12 (Use of Company Technology) of the Advanced Companies Employee Handbook. Always verify IT requests through official channels.",
    handbook_policy_refs: ['6.1', '6.12'],
  },
  {
    name: 'FedEx Shipment Delayed',
    category: 'Shipping Scam',
    difficulty: 'beginner',
    subject_line: 'FedEx: Your shipment #38291 has been delayed',
    body_html: wrap(`
      <p style="background:#4d148c;color:#ff6600;padding:10px 14px;font-weight:bold;">FedEx Tracking Update</p>
      <p>Dear Customer,</p>
      <p>Your shipment <b>#38291</b> from Advanced Machining could not be delivered due to incomplete recipient information. Please confirm the delivery address within the next <b>12 hours</b> or the package will be returned to sender.</p>
      <p><a href="http://fedex-tracking-update.net/confirm" style="background:#ff6600;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Confirm Delivery Address</a></p>
      <p>Tracking number: <b>38291</b></p>
      <p style="font-size:11px;color:#888;">© FedEx Corporation. All rights reserved.</p>
    `),
    body_text: 'Your FedEx shipment #38291 has been delayed. Confirm delivery at http://fedex-tracking-update.net/confirm',
    red_flags: [
      'Domain fedex-tracking-update.net is not fedex.com',
      'Tracking numbers shown without a real FedEx tracking format (12 digits)',
      '"Dear Customer" instead of your name or the actual recipient',
      'Urgency: "within 12 hours" or the package is returned',
      'Asks you to confirm address — but FedEx already has it from the shipper',
    ],
    learning_points:
      "Shipping scams exploit urgency. Per Section 6.1, employees must exercise caution when interacting with electronic communications. Always verify tracking numbers directly on the carrier's official website.",
    handbook_policy_refs: ['6.1'],
  },
  {
    name: 'HR Open Enrollment Deadline',
    category: 'HR/Benefits Phishing',
    difficulty: 'beginner',
    subject_line: 'HR: Open enrollment deadline tomorrow — action required',
    body_html: wrap(`
      <p style="background:#1d3557;color:#fff;padding:10px 14px;font-weight:bold;">Advanced Companies — Human Resources</p>
      <p>Team,</p>
      <p>This is a reminder that <b>open enrollment closes tomorrow at 5:00 PM</b>. If you do not re-elect your benefits, your medical and dental coverage will default to the lowest tier on January 1.</p>
      <p>Please log in to the benefits portal to make your selections:</p>
      <p><a href="http://advcosinc-benefits-portal.com/login" style="background:#1d3557;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Log in to Benefits Portal</a></p>
      <p>You will be asked to confirm your Social Security number and date of birth for identity verification.</p>
      <p style="font-size:11px;color:#888;">Advanced Companies HR Department</p>
    `),
    body_text: 'Open enrollment closes tomorrow. Log in at http://advcosinc-benefits-portal.com/login and confirm SSN + DOB.',
    red_flags: [
      'Domain advcosinc-benefits-portal.com is not an official Advanced Companies domain',
      'Asks for SSN and DOB — HR will never ask via email link',
      'Urgency: "tomorrow at 5:00 PM"',
      'No specific employee name or known HR contact signed at the bottom',
      'Fear of losing coverage drives impulsive clicking',
    ],
    learning_points:
      "HR-themed phishing exploits your concern about personal benefits. Per Section 6.1, never enter personal information via unexpected email links. Contact HR directly to verify.",
    handbook_policy_refs: ['6.1', '4.5'],
  },

  // ---------- INTERMEDIATE ----------
  {
    name: 'FactoryWiz CNC Firmware Update',
    category: 'OT Targeting',
    difficulty: 'intermediate',
    subject_line: 'FactoryWiz Alert: CNC Machine #7 firmware update required',
    body_html: wrap(`
      <p style="background:#222;color:#ffc107;padding:10px 14px;font-weight:bold;">FactoryWiz Monitoring — URGENT</p>
      <p>Hello Operator,</p>
      <p>Our monitoring system has detected that <b>CNC Machine #7</b> on the Advanced Machining shop floor is running an outdated firmware version (v3.2.1). A critical security patch is now available.</p>
      <p>Please download and install the patch on the operator workstation within the next shift to avoid unscheduled downtime:</p>
      <p><a href="http://factorywiz-patches.com/download/cnc7-fw342.exe" style="background:#ffc107;color:#000;padding:10px 18px;text-decoration:none;border-radius:4px;">Download Firmware Patch (cnc7-fw342.exe)</a></p>
      <p>Estimated install time: 4 minutes. The machine will reboot automatically.</p>
      <p style="font-size:11px;color:#888;">FactoryWiz Support · monitoring@factorywiz-patches.com</p>
    `),
    body_text: 'CNC Machine #7 needs a firmware update. Download cnc7-fw342.exe from http://factorywiz-patches.com',
    red_flags: [
      'Sender domain factorywiz-patches.com differs from the real factorywiz.com',
      'Asks an operator to download and run an .exe — firmware should never come this way',
      'Unsolicited "patch" with no prior ticket',
      'Singles out a specific machine to seem legitimate',
      'Targets shop-floor staff who may not be cyber-savvy',
    ],
    learning_points:
      "Operational Technology phishing targets manufacturing systems. Per Section 6.9 (Security), report any suspicious system communications to IT immediately.",
    handbook_policy_refs: ['6.1', '6.9'],
  },
  {
    name: 'Quality Hold AMF-2847 Nonconformance',
    category: 'Quality System Phishing',
    difficulty: 'intermediate',
    subject_line: '[QUALITY HOLD] Part #AMF-2847 nonconformance — immediate review',
    body_html: wrap(`
      <p style="background:#b71c1c;color:#fff;padding:10px 14px;font-weight:bold;">Quality Department — HOLD NOTICE</p>
      <p>Team,</p>
      <p>A nonconformance has been issued against <b>Part #AMF-2847</b> based on yesterday's CMM inspection. The full report and corrective-action request are attached for immediate review.</p>
      <p><a href="http://advcosinc-quality-portal.net/ncr/AMF-2847.pdf" style="background:#b71c1c;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Open NCR Report (PDF)</a></p>
      <p>This affects an active Gulfstream order. Please respond with your corrective action by EOD.</p>
      <p style="font-size:11px;color:#888;">Quality Assurance · qa@advcosinc-quality-portal.net</p>
    `),
    body_text: 'NCR issued against part AMF-2847. Open report at http://advcosinc-quality-portal.net/ncr/AMF-2847.pdf',
    red_flags: [
      'Domain advcosinc-quality-portal.net is not the company\'s real domain',
      'Customer name (Gulfstream) used to pressure action',
      'Generic team greeting — no specific QA inspector',
      'Link to "PDF" that is hosted on a non-corporate domain',
      'Bypasses the normal NCR ticketing workflow',
    ],
    learning_points:
      "Quality system impersonation creates false urgency. Per Section 6.9, immediately advise your manager of any known or potential security risks.",
    handbook_policy_refs: ['6.9', '8.2'],
  },
  {
    name: 'ANT Solutions Invoice Overdue',
    category: 'Vendor Impersonation',
    difficulty: 'intermediate',
    subject_line: 'Invoice #INV-9823 from ANT Solutions — PAYMENT OVERDUE',
    body_html: wrap(`
      <p style="background:#0d47a1;color:#fff;padding:10px 14px;font-weight:bold;">ANT Solutions Accounts Receivable</p>
      <p>Hello Accounts Payable,</p>
      <p>Our records indicate that invoice <b>#INV-9823</b> for <b>$14,820.00</b> dated 45 days ago remains unpaid. Please remit payment by ACH today to avoid a service interruption on your tooling supply contract.</p>
      <p><b>Updated remittance information:</b></p>
      <p>Bank: First Hudson Trust · Routing: 021000089 · Account: 998200184733</p>
      <p>For questions, reply to <a href="mailto:ar@ant-solutions-billing.com">ar@ant-solutions-billing.com</a>.</p>
      <p style="font-size:11px;color:#888;">ANT Solutions LLC</p>
    `),
    body_text: 'Invoice INV-9823 for $14,820 overdue. New ACH info: Routing 021000089, Account 998200184733.',
    red_flags: [
      'Vendor "ANT Solutions" is plausible but the email comes from ant-solutions-billing.com — not the real vendor domain',
      'Sudden change of banking details — classic BEC fraud pattern',
      'No matching PO referenced',
      'Pressure to "remit today" — bypasses normal AP verification',
      'No phone number for callback verification',
    ],
    learning_points:
      "Vendor impersonation attacks target financial processes. Per Section 2.2 (Ethics Code), verify all payment requests through established channels.",
    handbook_policy_refs: ['9.1', '2.2'],
  },

  // ---------- ADVANCED ----------
  {
    name: 'CEO Wire Transfer (Scott Shortess)',
    category: 'Executive Whaling',
    difficulty: 'advanced',
    subject_line: 'Quick favor — need a wire processed before close of business',
    body_html: wrap(`
      <p>Hi —</p>
      <p>I'm in back-to-back meetings with a new customer and can't take calls. I need you to process a wire to a supplier on my behalf <b>before close of business</b> today. Time-sensitive — they're holding shipment.</p>
      <p>Send me the wire form and I'll reply with the details. Don't loop in anyone else yet — we're still under NDA on this customer.</p>
      <p>Thanks,<br/>Scott<br/>Sent from my iPhone</p>
    `),
    body_text: 'Need a wire processed today. Will send details. Don\'t loop anyone else in. — Scott',
    red_flags: [
      'Sender address looks like Scott\'s name but is a free webmail (e.g. scott.shortess.exec@gmail.com) or a look-alike domain',
      '"Don\'t loop anyone else in" — classic isolation tactic',
      'Urgency: "before close of business"',
      'Mobile signature "Sent from my iPhone" excuses typos and informality',
      'Bypasses dual-approval purchasing controls',
    ],
    learning_points:
      "CEO impersonation attacks exploit trust. Per Section 2.2 (Ethics Code), employees must 'not knowingly misrepresent ADVANCED and will not speak on behalf of ADVANCED unless specifically authorized.' Always verify financial requests through a second channel.",
    handbook_policy_refs: ['2.2', '9.1'],
  },
  {
    name: 'AS9100 Audit Finding',
    category: 'Compliance Urgency',
    difficulty: 'advanced',
    subject_line: 'AS9100 Audit Finding — Immediate corrective action required',
    body_html: wrap(`
      <p style="background:#1b5e20;color:#fff;padding:10px 14px;font-weight:bold;">Certification Body — AS9100 Surveillance</p>
      <p>Dear Quality Manager,</p>
      <p>During this morning's remote review of your AS9100D documentation, our auditor identified a <b>major nonconformance</b> in your record-retention practices. A response is required <b>within 24 hours</b> to avoid an unscheduled on-site audit.</p>
      <p>Download the finding and review the corrective-action template here:</p>
      <p><a href="http://as9100-surveillance-portal.com/finding/AMF-2025-04" style="background:#1b5e20;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Open Finding AMF-2025-04</a></p>
      <p style="font-size:11px;color:#888;">Aerospace Certification Services</p>
    `),
    body_text: 'AS9100 major nonconformance issued. Respond within 24 hours via http://as9100-surveillance-portal.com',
    red_flags: [
      'No actual certification body uses a domain like as9100-surveillance-portal.com',
      'Audits are scheduled — they do not appear "this morning" out of nowhere',
      'Major-nonconformance threats designed to panic the quality manager',
      'Asks the recipient to download a "finding" from a strange domain',
      'No registrar contact, no auditor name, no audit reference matching the registrar of record',
    ],
    learning_points:
      "Audit-themed phishing exploits compliance anxiety. Per Section 6.9, report suspicious communications to IT before taking action.",
    handbook_policy_refs: ['6.9', '9.1'],
  },
  {
    name: 'Gulfstream Procurement RFQ',
    category: 'Customer Impersonation',
    difficulty: 'advanced',
    subject_line: 'Gulfstream Procurement — RFQ Response Needed by EOD',
    body_html: wrap(`
      <p>Hello,</p>
      <p>Gulfstream Procurement is issuing a follow-up <b>RFQ</b> on the bracket family you supplied last quarter. Quotes are due <b>by end of day today</b> — we are short-listing two more suppliers and your current standing is favorable.</p>
      <p>Drawings and the response template are attached on our secure portal:</p>
      <p><a href="http://gulfstream-procurement-portal.com/rfq/AMF-2025-Q2" style="background:#0a3d62;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Open RFQ Package</a></p>
      <p>Please also confirm your current AS9100D certification and reply with your CAGE code so we can fast-track the award.</p>
      <p>Regards,<br/>Procurement Team<br/>Gulfstream Aerospace Corporation</p>
    `),
    body_text: 'RFQ from Gulfstream due EOD. Open package at http://gulfstream-procurement-portal.com',
    red_flags: [
      'Domain gulfstream-procurement-portal.com is not gulfstream.com',
      'No named buyer — just "Procurement Team"',
      'Asks for CAGE code and certification details in reply',
      '"EOD today" deadline that bypasses normal RFQ workflows',
      'Appeals to your desire to win the next bracket order',
    ],
    learning_points:
      "Customer impersonation targets your desire to be responsive. Per Section 9.1 (Confidentiality), sensitive business information should only be shared through verified channels.",
    handbook_policy_refs: ['9.1', '3.1'],
  },

  // ---------- EXPERT ----------
  {
    name: 'DCSA CMMC Assessment Scheduling',
    category: 'Government Impersonation',
    difficulty: 'expert',
    subject_line: 'DCSA Notice: CMMC Assessment Scheduling — Action Required',
    body_html: wrap(`
      <p style="background:#0b3954;color:#fff;padding:10px 14px;font-weight:bold;">Defense Counterintelligence and Security Agency</p>
      <p>To: Authorized Representative, Advanced Machining &amp; Fab., Inc.</p>
      <p>Pursuant to <b>DFARS 252.204-7021</b>, your facility has been selected for a scheduled <b>CMMC Level 2 Assessment</b>. Please complete the attached pre-assessment questionnaire and submit your System Security Plan within <b>five (5) business days</b>.</p>
      <p><a href="http://dcsa-assessment-portal.gov-secure.us/intake/AMF" style="background:#0b3954;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Submit Pre-Assessment Package</a></p>
      <p>Failure to respond within the prescribed window may result in suspension of awarded contracts.</p>
      <p style="font-size:11px;color:#888;">DCSA · Industrial Security Field Operations</p>
    `),
    body_text: 'DCSA CMMC assessment scheduled. Submit SSP within 5 days at http://dcsa-assessment-portal.gov-secure.us',
    red_flags: [
      'Real government domains end in .gov or .mil — gov-secure.us is not legitimate',
      'CMMC assessments are scheduled through your C3PAO, not DCSA',
      'Asks you to upload your System Security Plan to an unknown portal',
      'Threats of contract suspension to drive urgency',
      'No contracting officer or CAGE code referenced',
    ],
    learning_points:
      "Government impersonation is among the most sophisticated attacks. Per Section 6.9, report ANY suspicious government correspondence to IT and management immediately.",
    handbook_policy_refs: ['6.1', '6.9', '9.1'],
  },
  {
    name: 'Microsoft 365 Russia Sign-In',
    category: 'MFA Fatigue',
    difficulty: 'expert',
    subject_line: 'Microsoft 365: Unusual sign-in detected from Russia',
    body_html: wrap(`
      <p style="background:#0078d4;color:#fff;padding:10px 14px;font-weight:bold;">Microsoft Account Team</p>
      <p>We detected an unusual sign-in to your account from a device in <b>Moscow, Russia</b> at 02:14 UTC.</p>
      <p>If this <b>wasn't you</b>, secure your account immediately:</p>
      <p><a href="http://microsoft365-secure-signin.com/verify" style="background:#0078d4;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Secure my account</a></p>
      <p>To verify your identity, approve the prompt sent to your Microsoft Authenticator app.</p>
      <p style="font-size:11px;color:#888;">© Microsoft Corporation</p>
    `),
    body_text: 'Unusual sign-in detected from Russia. Approve the MFA prompt to secure your account.',
    red_flags: [
      'Microsoft never sends MFA approvals via email — they appear in the Authenticator app on a sign-in you actually initiated',
      'Domain microsoft365-secure-signin.com is not microsoft.com',
      '"Approve the prompt" — classic MFA-fatigue language designed to make you tap Approve',
      'Geographic fear (Russia) drives panic clicking',
      'No support phone number or account reference',
    ],
    learning_points:
      "MFA fatigue attacks trick you into approving fake sign-in requests. Per Section 6.1 and 6.12, never approve MFA prompts you did not initiate.",
    handbook_policy_refs: ['6.1', '6.12'],
  },
  {
    name: 'Randel Hamilton CUI File Share',
    category: 'Internal Trust Exploitation',
    difficulty: 'expert',
    subject_line: "Randel Hamilton shared 'CUI Network Diagram v3.pdf' with you",
    body_html: wrap(`
      <p style="background:#34495e;color:#fff;padding:10px 14px;font-weight:bold;">SharePoint — Shared with you</p>
      <p><b>Randel Hamilton</b> has shared a document with you:</p>
      <p style="border:1px solid #ccc;padding:14px;background:#fafafa;">
        📄 <b>CUI Network Diagram v3.pdf</b><br/>
        <span style="color:#666;">Modified 12 minutes ago · 2.4 MB · Confidential</span>
      </p>
      <p><a href="http://advcosinc-sharepoint-share.com/open?id=cui-v3" style="background:#0078d4;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Open document</a></p>
      <p>Message from Randel: "Take a look before the meeting tomorrow — this is the version we'll be presenting to the assessor."</p>
      <p style="font-size:11px;color:#888;">© Microsoft SharePoint</p>
    `),
    body_text: "Randel Hamilton shared CUI Network Diagram v3.pdf with you. Open at http://advcosinc-sharepoint-share.com",
    red_flags: [
      'Domain advcosinc-sharepoint-share.com is not sharepoint.com or your tenant',
      'Uses a real internal name to manufacture trust',
      'Filename ("CUI Network Diagram") designed to trigger curiosity in a CMMC environment',
      "Personal-sounding message you can't verify with the supposed sender",
      'No way to view the file in the regular Microsoft 365 web app',
    ],
    learning_points:
      "Per Section 9.1 (Confidentiality and Nondisclosure of Trade Secrets), access to sensitive information should be limited to a 'need to know' basis. If you receive an unexpected file share, verify with the sender before opening.",
    handbook_policy_refs: ['6.1', '9.1'],
  },
];
