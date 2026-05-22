// utils/export.js — CMMC evidence CSV builder
const db = require('./db');

function esc(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(cols) {
  return cols.map(esc).join(',') + '\n';
}

// Returns a CSV string suitable for download.
async function cmmcEvidence() {
  const lines = [];

  lines.push('# CMMC EVIDENCE EXPORT — PhishGuard Tournament');
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('# Company: Advanced Machining & Fab., Inc.');
  lines.push('# Controls covered: AT.L2-3.2.1, AT.L2-3.2.2, AT.L2-3.2.3');
  lines.push('#');
  lines.push('# This export combines training-completion records, phishing-simulation results,');
  lines.push('# and the corresponding Advanced Companies Employee Handbook policy references.');
  lines.push('#');

  // ---------- Section 1: Training completions ----------
  lines.push('## Section 1 — Training Completions (per user)');
  lines.push(row(['User Email', 'Last Name', 'First Name', 'Department', 'Module', 'CMMC Control', 'Handbook Refs', 'Started At', 'Completed At', 'Quiz Score', 'Passed']));
  const completions = await db.many(`
    SELECT u.email, u.last_name, u.first_name, u.department,
           tm.title, tm.cmmc_control, array_to_string(tm.handbook_refs, '; ') AS refs,
           tc.started_at, tc.completed_at, tc.quiz_score, tc.passed
    FROM training_completions tc
    JOIN users u ON u.id = tc.user_id
    JOIN training_modules tm ON tm.id = tc.module_id
    ORDER BY u.last_name, u.first_name, tm.title
  `);
  for (const c of completions) {
    lines.push(row([
      c.email, c.last_name, c.first_name, c.department,
      c.title, c.cmmc_control, c.refs,
      c.started_at ? c.started_at.toISOString() : '',
      c.completed_at ? c.completed_at.toISOString() : '',
      c.quiz_score, c.passed ? 'YES' : 'NO',
    ]));
  }
  lines.push('');

  // ---------- Section 2: Simulation results ----------
  lines.push('## Section 2 — Phishing Simulation Results (per user / campaign)');
  lines.push(row([
    'User Email', 'Last Name', 'First Name', 'Department',
    'Campaign', 'Template', 'Template Handbook Refs', 'Difficulty',
    'Email Sent', 'Opened', 'Clicked', 'Credentials Submitted',
    'Reported', 'Time to Report (s)', 'Outcome',
  ]));
  const sims = await db.many(`
    SELECT u.email, u.last_name, u.first_name, u.department,
           c.name AS campaign, t.name AS template, array_to_string(t.handbook_policy_refs, '; ') AS refs,
           c.difficulty,
           r.email_sent_at, r.email_opened_at, r.link_clicked_at, r.credentials_submitted_at,
           r.reported_at, r.time_to_report_seconds, r.outcome
    FROM campaign_results r
    JOIN users u ON u.id = r.user_id
    JOIN campaigns c ON c.id = r.campaign_id
    LEFT JOIN phishing_templates t ON t.id = c.template_id
    ORDER BY c.start_date NULLS LAST, u.last_name, u.first_name
  `);
  for (const s of sims) {
    lines.push(row([
      s.email, s.last_name, s.first_name, s.department,
      s.campaign, s.template, s.refs, s.difficulty,
      s.email_sent_at ? s.email_sent_at.toISOString() : '',
      s.email_opened_at ? s.email_opened_at.toISOString() : '',
      s.link_clicked_at ? s.link_clicked_at.toISOString() : '',
      s.credentials_submitted_at ? s.credentials_submitted_at.toISOString() : '',
      s.reported_at ? s.reported_at.toISOString() : '',
      s.time_to_report_seconds || '', s.outcome,
    ]));
  }
  lines.push('');

  // ---------- Section 3: Compliance narrative ----------
  lines.push('## Section 3 — CMMC Compliance Narrative');
  lines.push(row(['Evidence Item', 'CMMC Control', 'Handbook Policy Ref', 'Handbook Section Title']));
  const narrative = [
    ['Phishing Fundamentals Training', 'AT.L2-3.2.1', '§6.1', 'Computer Security and Copying of Software'],
    ['Phishing Fundamentals Training', 'AT.L2-3.2.1', '§6.12', 'Use of Company Technology'],
    ['Social Engineering in Manufacturing', 'AT.L2-3.2.1', '§6.9', 'Security'],
    ['Social Engineering in Manufacturing', 'AT.L2-3.2.1', '§9.1', 'Confidentiality and Nondisclosure of Trade Secrets'],
    ['Recognizing Insider Threats', 'AT.L2-3.2.3', '§6.9', 'Security'],
    ['Recognizing Insider Threats', 'AT.L2-3.2.3', '§9.1', 'Confidentiality and Nondisclosure of Trade Secrets'],
    ['Recognizing Insider Threats', 'AT.L2-3.2.3', '§5.10', 'Workplace Privacy'],
    ['CUI Handling & Protection', 'AT.L2-3.2.2', '§9.1', 'Confidentiality and Nondisclosure of Trade Secrets'],
    ['CUI Handling & Protection', 'AT.L2-3.2.2', '§6.1', 'Computer Security and Copying of Software'],
    ['Password Security & MFA', 'AT.L2-3.2.1', '§6.1', 'Computer Security and Copying of Software'],
    ['Password Security & MFA', 'AT.L2-3.2.1', '§6.12', 'Use of Company Technology'],
    ['Physical Security on the Shop Floor', 'AT.L2-3.2.2', '§6.9', 'Security'],
    ['Physical Security on the Shop Floor', 'AT.L2-3.2.2', '§8.2', 'General Safety'],
    ['Incident Reporting Procedures', 'AT.L2-3.2.2', '§6.9', 'Security'],
    ['Incident Reporting Procedures', 'AT.L2-3.2.2', '§8.2', 'General Safety'],
    ['Incident Reporting Procedures', 'AT.L2-3.2.2', '§8.3', 'Reporting of Injuries / Incidents'],
    ['Vendor & Supply Chain Threats', 'AT.L2-3.2.1', '§9.1', 'Confidentiality and Nondisclosure of Trade Secrets'],
    ['Vendor & Supply Chain Threats', 'AT.L2-3.2.1', '§3.1', 'Conflicts of Interest'],
    ['Vendor & Supply Chain Threats', 'AT.L2-3.2.1', '§2.2', 'Ethics Code'],
  ];
  for (const r of narrative) lines.push(row(r));
  lines.push('');

  // ---------- Section 4: Roster ----------
  lines.push('## Section 4 — Active Roster (proof of population covered)');
  lines.push(row(['Email', 'Last Name', 'First Name', 'Department', 'Role', 'Created At', 'Last Login']));
  const roster = await db.many(`
    SELECT email, last_name, first_name, department, role, created_at, last_login
    FROM users WHERE is_active = true
    ORDER BY department, last_name
  `);
  for (const u of roster) {
    lines.push(row([
      u.email, u.last_name, u.first_name, u.department, u.role,
      u.created_at ? u.created_at.toISOString() : '',
      u.last_login ? u.last_login.toISOString() : '',
    ]));
  }

  return lines.join('');
}

module.exports = { cmmcEvidence };
