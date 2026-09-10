// migrate.js — idempotent schema migrator
require('dotenv').config();
const db = require('./utils/db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  lockout_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phishing_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject_line VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  red_flags TEXT[],
  learning_points TEXT NOT NULL,
  discussion_questions TEXT[],
  handbook_policy_refs TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NCSC Exercise-in-a-Box style: open-ended reflection captured against a specific
-- learning moment, not just a static paragraph read passively. This is what turns
-- the debrief into real evidence of engagement for AT.L2-3.2.1, not a claim of it.
CREATE TABLE IF NOT EXISTS reflection_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id INTEGER REFERENCES phishing_templates(id),
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_results (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  email_sent_at TIMESTAMP,
  email_opened_at TIMESTAMP,
  link_clicked_at TIMESTAMP,
  credentials_submitted_at TIMESTAMP,
  reported_at TIMESTAMP,
  report_method VARCHAR(50),
  time_to_report_seconds INTEGER,
  outcome VARCHAR(30) CHECK (outcome IN ('reported', 'ignored', 'clicked', 'compromised', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_modules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_html TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20),
  estimated_minutes INTEGER DEFAULT 5,
  points_reward INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  cmmc_control VARCHAR(20),
  handbook_refs TEXT[],
  quiz JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  module_id INTEGER REFERENCES training_modules(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  quiz_score INTEGER,
  passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  campaign_id INTEGER REFERENCES campaigns(id),
  training_id INTEGER REFERENCES training_modules(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  criteria TEXT NOT NULL,
  points_value INTEGER DEFAULT 0,
  tier VARCHAR(20) CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject_line VARCHAR(500),
  sender_address VARCHAR(255),
  reason VARCHAR(255),
  notes TEXT,
  matched_campaign_id INTEGER REFERENCES campaigns(id),
  verdict VARCHAR(20) DEFAULT 'pending' CHECK (verdict IN ('pending', 'true_phish', 'false_positive', 'real_email')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CREATE TABLE IF NOT EXISTS is a no-op on a table that already exists (this app is
-- already deployed), so a brand-new column has to be added explicitly, not just
-- declared in the CREATE TABLE above, or it silently never lands on production.
ALTER TABLE phishing_templates ADD COLUMN IF NOT EXISTS discussion_questions TEXT[];

CREATE INDEX IF NOT EXISTS idx_campaign_results_campaign ON campaign_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_results_user ON campaign_results(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created ON points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_training_completions_user ON training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- NCSC Exercise-in-a-Box style tabletop exercises: a scenario library (objective,
-- roles, sequential injects with open-ended discussion questions — deliberately
-- worded to have no single right answer) plus a session log so running one is
-- itself CMMC AT.L2-3.2.1 evidence, not just a document nobody ever used.
CREATE TABLE IF NOT EXISTS tabletop_exercises (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  scenario_summary TEXT NOT NULL,
  recommended_roles TEXT[] NOT NULL,
  estimated_minutes INTEGER DEFAULT 75,
  injects JSONB NOT NULL,
  cmmc_control VARCHAR(20),
  handbook_refs TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tabletop_sessions (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER REFERENCES tabletop_exercises(id),
  facilitated_by INTEGER REFERENCES users(id),
  session_date DATE NOT NULL,
  participants TEXT[] NOT NULL,
  hot_wash_notes TEXT,
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tabletop_sessions_exercise ON tabletop_sessions(exercise_id);
`;

async function run() {
  // eslint-disable-next-line no-console
  console.log('[migrate] applying schema...');
  await db.query(SCHEMA);
  // eslint-disable-next-line no-console
  console.log('[migrate] done.');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[migrate] failed:', e.message);
      process.exit(1);
    });
}

module.exports = { run };
