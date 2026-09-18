'use strict';

// Integration and static-scan tests for the Pass 2 schema additions.
// The DB-touching sub-test skips gracefully when DATABASE_URL is not
// configured so the local test suite runs anywhere.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

// ── Static scan of migrate.js ─────────────────────────────────────────────

test('migrate.js references every Pass 2 addition', () => {
  const src = fs.readFileSync(path.join(REPO, 'migrate.js'), 'utf8');
  const expected = [
    // evidence eligibility
    'is_evidence_eligible',
    'idx_users_evidence_eligible',
    // scenario/version/inject/mapping tables
    'tabletop_scenarios',
    'tabletop_scenario_versions',
    'tabletop_scenario_injects',
    'tabletop_scenario_control_mappings',
    // session / participant / release / response tables
    'tabletop_sessions_v2',
    'tabletop_session_participants',
    'tabletop_inject_releases',
    'tabletop_participant_responses',
    // hot-wash / CA / evidence-package tables
    'tabletop_hotwash_findings',
    'tabletop_corrective_actions',
    'tabletop_evidence_packages',
    // structured mapping fields (no hardcoded objective strings anywhere)
    'framework_revision',
    'assessment_objective_id',
    'mapping_rationale',
    // attendance enum
    'required_present',
    'required_absent',
    'excused',
    'observer',
    'optional_present',
    'external',
    // session state enum
    'draft',
    'scheduled',
    'running',
    'hot_wash',
    'closed',
    'cancelled',
    // response types
    'facilitator_recorded',
  ];
  const missing = expected.filter((t) => !src.includes(t));
  assert.deepEqual(missing, [], `missing from migrate.js: ${missing.join(', ')}`);
});

test('legacy tabletop tables preserved (still present in migrate.js)', () => {
  const src = fs.readFileSync(path.join(REPO, 'migrate.js'), 'utf8');
  assert.ok(src.includes('CREATE TABLE IF NOT EXISTS tabletop_exercises'));
  assert.ok(/CREATE TABLE IF NOT EXISTS tabletop_sessions\s*\(/.test(src),
    'legacy tabletop_sessions table must still be created');
});

test('circular FK to current_version_id is created inside a guarded DO block', () => {
  const src = fs.readFileSync(path.join(REPO, 'migrate.js'), 'utf8');
  assert.ok(/DO\s+\$do\$/.test(src), 'expected a DO $do$ ... $do$ block');
  assert.ok(src.includes('fk_tabletop_scenarios_current_version'));
  assert.ok(src.includes('DEFERRABLE INITIALLY DEFERRED'));
});

// ── Static scan of seed.js — guest is evidence-ineligible ────────────────

test('seed.js sets guest is_evidence_eligible=false on insert and correction', () => {
  const src = fs.readFileSync(path.join(REPO, 'seed.js'), 'utf8');
  assert.ok(/is_evidence_eligible[^)]*false/i.test(src),
    'guest insert must include is_evidence_eligible=false');
  assert.ok(/UPDATE users SET is_evidence_eligible = false/i.test(src),
    'seed.js must correct existing guest rows created before the column existed');
});

// ── Integration: apply the schema against a real database ─────────────────

test('integration: schema applies cleanly and Pass 2 objects exist',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { run: migrate } = require('../migrate');
    const db = require('../utils/db');
    await migrate();

    const expectColumn = async (table, column) => {
      const r = await db.one(
        `SELECT 1 AS ok FROM information_schema.columns
         WHERE table_name = $1 AND column_name = $2`,
        [table, column]
      );
      assert.ok(r, `expected column ${table}.${column}`);
    };

    const expectTable = async (t) => {
      const r = await db.one(
        `SELECT 1 AS ok FROM information_schema.tables WHERE table_name = $1`,
        [t]
      );
      assert.ok(r, `expected table ${t}`);
    };

    await expectColumn('users', 'is_evidence_eligible');
    for (const t of [
      'tabletop_scenarios',
      'tabletop_scenario_versions',
      'tabletop_scenario_injects',
      'tabletop_scenario_control_mappings',
      'tabletop_sessions_v2',
      'tabletop_session_participants',
      'tabletop_inject_releases',
      'tabletop_participant_responses',
      'tabletop_hotwash_findings',
      'tabletop_corrective_actions',
      'tabletop_evidence_packages',
    ]) {
      await expectTable(t);
    }
  }
);
