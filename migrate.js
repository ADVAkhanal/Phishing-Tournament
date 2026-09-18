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

-- NCSC Exercise-in-a-Box style: open-ended reflection captured against a specific
-- learning moment, not just a static paragraph read passively.
CREATE TABLE IF NOT EXISTS reflection_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  question TEXT NOT NULL,
  response TEXT NOT NULL,
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
  tracking_token VARCHAR(64),
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

-- CREATE TABLE IF NOT EXISTS is a no-op on a table that already exists, so a
-- brand-new column has to be added explicitly via ALTER.
ALTER TABLE phishing_templates ADD COLUMN IF NOT EXISTS discussion_questions TEXT[];
ALTER TABLE campaign_results ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_results_tracking_token ON campaign_results(tracking_token);

CREATE INDEX IF NOT EXISTS idx_campaign_results_campaign ON campaign_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_results_user ON campaign_results(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created ON points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_training_completions_user ON training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Legacy tabletop tables — preserved. Historical rows and the existing
-- /admin/tabletop reading-room view continue to work throughout the
-- v2 build. Do not modify these two.
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

-- =========================================================================
-- Pass 2 additions — evidence-eligibility and the tabletop v2 schema.
-- All additive. No column-type changes on shipped tables. No drops.
-- =========================================================================

-- Evidence-eligibility flag. Existing rows default to TRUE (i.e. treated
-- as authoritative population). Guest/demo accounts are set to FALSE via
-- seed.js. Every evidence-facing SQL query must include this filter; see
-- utils/evidence-scope.js for the single-source helper.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_evidence_eligible BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_users_evidence_eligible ON users(is_evidence_eligible);

-- Canonical scenario identity. Versioning happens in the child table so
-- editing a scenario never mutates a session that already used a prior
-- version.
CREATE TABLE IF NOT EXISTS tabletop_scenarios (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  current_version_id INTEGER,   -- FK added by DO block after versions table exists
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Immutable version snapshot. Sessions reference this row's id, never
-- the parent scenario. status transitions draft → published → deprecated.
CREATE TABLE IF NOT EXISTS tabletop_scenario_versions (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL REFERENCES tabletop_scenarios(id),
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT[] NOT NULL DEFAULT '{}',
  applicable_roles TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER,
  facilitator_guidance TEXT,
  initial_conditions TEXT,
  handbook_refs TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'deprecated')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (scenario_id, version_number)
);

-- Ordered injects belonging to one scenario version. Immutable once the
-- parent version is published. release_condition is written for the V1
-- "manual release only" behavior; the enum leaves room for automatic
-- release conditions to be added later without a migration.
CREATE TABLE IF NOT EXISTS tabletop_scenario_injects (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES tabletop_scenario_versions(id),
  sequence INTEGER NOT NULL,
  release_condition VARCHAR(30) NOT NULL DEFAULT 'manual'
    CHECK (release_condition IN ('manual', 'after_previous', 'after_seconds')),
  release_after_seconds INTEGER,
  participant_content TEXT NOT NULL,
  facilitator_notes TEXT,
  response_deadline_seconds INTEGER,
  expected_considerations TEXT[] NOT NULL DEFAULT '{}',
  discussion_prompts TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (version_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_tabletop_scenario_injects_version
  ON tabletop_scenario_injects(version_id);

-- Assessment-objective mapping. Deliberately structured so today's string
-- format is not permanently baked into scenario JSON. Every mapping must
-- carry a rationale string; empty tags are forbidden by application logic.
CREATE TABLE IF NOT EXISTS tabletop_scenario_control_mappings (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES tabletop_scenario_versions(id),
  framework VARCHAR(40) NOT NULL,
  framework_revision VARCHAR(40) NOT NULL,
  practice_id VARCHAR(60) NOT NULL,
  assessment_objective_id VARCHAR(40),
  mapping_type VARCHAR(20) NOT NULL
    CHECK (mapping_type IN ('supports', 'demonstrates', 'contributes_to')),
  mapping_rationale TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tabletop_scenario_mappings_version
  ON tabletop_scenario_control_mappings(version_id);

-- Circular FK: scenario points at the currently-published version. Gated
-- so re-running the migration does not raise a duplicate-constraint error.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_tabletop_scenarios_current_version'
  ) THEN
    ALTER TABLE tabletop_scenarios
      ADD CONSTRAINT fk_tabletop_scenarios_current_version
      FOREIGN KEY (current_version_id)
      REFERENCES tabletop_scenario_versions(id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END
$do$;

-- v2 session table. Never points at a scenario_id — always at a frozen
-- version. Snapshot columns preserve facilitator identity even if the
-- user is later renamed or deactivated.
CREATE TABLE IF NOT EXISTS tabletop_sessions_v2 (
  id SERIAL PRIMARY KEY,
  scenario_version_id INTEGER NOT NULL REFERENCES tabletop_scenario_versions(id),
  session_label VARCHAR(255),
  facilitator_id INTEGER REFERENCES users(id),
  facilitator_email_at_time VARCHAR(255),
  facilitator_display_at_time VARCHAR(255),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  hot_wash_started_at TIMESTAMP,
  closed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'running', 'hot_wash', 'closed', 'cancelled')),
  app_version VARCHAR(40),
  schema_version VARCHAR(40),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tabletop_sessions_v2_status
  ON tabletop_sessions_v2(status);
CREATE INDEX IF NOT EXISTS idx_tabletop_sessions_v2_scheduled
  ON tabletop_sessions_v2(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tabletop_sessions_v2_facilitator
  ON tabletop_sessions_v2(facilitator_id);

-- Authoritative session population. Snapshot columns preserve who was
-- who at the time — the row remains truthful even after department or
-- role changes or account deactivation. attendance_status carries the
-- six documented reconciliation states.
CREATE TABLE IF NOT EXISTS tabletop_session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES tabletop_sessions_v2(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  external_name VARCHAR(255),
  email_at_time VARCHAR(255),
  display_name_at_time VARCHAR(255),
  department_at_time VARCHAR(100),
  role_at_time VARCHAR(100),
  attendance_status VARCHAR(30) NOT NULL DEFAULT 'required_present'
    CHECK (attendance_status IN
      ('required_present', 'required_absent', 'excused', 'observer', 'optional_present', 'external')),
  notes TEXT,
  frozen_at TIMESTAMP,
  added_by INTEGER REFERENCES users(id),
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tabletop_participants_session
  ON tabletop_session_participants(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tabletop_participants_session_user
  ON tabletop_session_participants(session_id, user_id) WHERE user_id IS NOT NULL;

-- Inject release ledger. The single source of truth for what the room
-- has seen. Every server-side participant query joins through this table
-- and NEVER exposes an unreleased inject.
CREATE TABLE IF NOT EXISTS tabletop_inject_releases (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES tabletop_sessions_v2(id) ON DELETE CASCADE,
  inject_id INTEGER NOT NULL REFERENCES tabletop_scenario_injects(id),
  released_at TIMESTAMP NOT NULL DEFAULT NOW(),
  released_by INTEGER REFERENCES users(id),
  UNIQUE (session_id, inject_id)
);
CREATE INDEX IF NOT EXISTS idx_tabletop_releases_session
  ON tabletop_inject_releases(session_id);

-- Participant responses. Append-only. A correction writes a NEW row with
-- corrects_response_id and correction_reason set; the original row stays
-- intact. Nothing silently overwrites.
CREATE TABLE IF NOT EXISTS tabletop_participant_responses (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES tabletop_sessions_v2(id) ON DELETE CASCADE,
  inject_id INTEGER NOT NULL REFERENCES tabletop_scenario_injects(id),
  respondent_user_id INTEGER REFERENCES users(id),
  respondent_label VARCHAR(255),
  response_type VARCHAR(30) NOT NULL
    CHECK (response_type IN ('team', 'individual', 'facilitator_recorded')),
  response_text TEXT,
  selected_actions TEXT[] NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_by INTEGER REFERENCES users(id),
  corrects_response_id INTEGER REFERENCES tabletop_participant_responses(id),
  correction_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_tabletop_responses_session
  ON tabletop_participant_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_tabletop_responses_inject
  ON tabletop_participant_responses(inject_id);

-- Hot-wash findings. Categorized observation. Findings are NOT corrective
-- actions; a finding may spawn zero, one, or many CAs. Author identity
-- snapshotted for evidence reconstruction.
CREATE TABLE IF NOT EXISTS tabletop_hotwash_findings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES tabletop_sessions_v2(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL
    CHECK (category IN
      ('what_worked', 'what_failed', 'info_missing', 'procedure_unclear', 'tech_failed', 'should_change')),
  finding_text TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_by_display_at_time VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tabletop_findings_session
  ON tabletop_hotwash_findings(session_id);

-- Corrective actions register. Operational only — this is NOT a POA&M.
-- Owner display name snapshotted so the row remains meaningful after a
-- user changes name or leaves the organization.
CREATE TABLE IF NOT EXISTS tabletop_corrective_actions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES tabletop_sessions_v2(id),
  finding_id INTEGER REFERENCES tabletop_hotwash_findings(id),
  description TEXT NOT NULL,
  category VARCHAR(60),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  owner_user_id INTEGER REFERENCES users(id),
  owner_display_at_time VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'blocked', 'closed', 'accepted_exception')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at TIMESTAMP,
  closed_at TIMESTAMP,
  remediation_notes TEXT,
  closure_evidence_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_tabletop_corrective_actions_session
  ON tabletop_corrective_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_tabletop_corrective_actions_status
  ON tabletop_corrective_actions(status);

-- Evidence package rows. One per generation. Artifact bytes are streamed
-- to the caller rather than persisted on ephemeral Railway storage — this
-- table records the manifest and the manifest's own SHA-256 so the audit
-- log entry can reference it deterministically.
CREATE TABLE IF NOT EXISTS tabletop_evidence_packages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES tabletop_sessions_v2(id),
  scenario_version_id INTEGER NOT NULL REFERENCES tabletop_scenario_versions(id),
  generated_by INTEGER REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  app_version VARCHAR(40),
  schema_version VARCHAR(40),
  manifest JSONB NOT NULL,
  manifest_sha256 VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tabletop_evidence_session
  ON tabletop_evidence_packages(session_id);
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
