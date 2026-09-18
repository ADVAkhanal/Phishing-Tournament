// seed.js — idempotent seed of admin, guest, templates, badges, training, tabletop
//
// Bootstrap admin behavior:
//   - If ANY user with role='admin' exists (active or not), the bootstrap
//     path is a no-op. Live admin passwords are never overwritten here.
//   - If the database has zero admin rows, the very first boot resolves
//     ADMIN_EMAIL + ADMIN_PASSWORD via utils/bootstrap.js (fail closed) and
//     creates one admin row. That is the only path this file writes credentials.
//
// There is no hardcoded fallback account. There is no reassertion loop.
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./utils/db');
const { run: migrate } = require('./migrate');
const { resolveAdminBootstrapCredentials } = require('./utils/bootstrap');

const GUEST_EMAIL = 'guest@advcosinc.com';

const TEMPLATES = require('./seed-data/templates');
const BADGES = require('./seed-data/badges');
const TRAINING = require('./seed-data/training');
const TABLETOP = require('./seed-data/tabletop');

/**
 * Create the initial admin ONLY when no admin row exists (active or not).
 * We look at all admins, not just active ones, so deactivating every admin
 * cannot trigger an unwanted re-bootstrap on next deploy.
 */
async function ensureAdmin() {
  const anyAdmin = await db.one(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );
  if (anyAdmin) {
    // eslint-disable-next-line no-console
    console.log('[seed] admin account already present — bootstrap skipped');
    return;
  }

  // Only now — when we are certain we are about to create the first admin —
  // do we consult the environment. This lets long-running installations run
  // without ADMIN_* env vars set, while a fresh install fails closed with
  // a clear error naming the missing variable.
  let email;
  let password;
  try {
    ({ email, password } = resolveAdminBootstrapCredentials());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    throw e;
  }

  const hash = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, department, role)
     VALUES ($1, $2, 'Site', 'Admin', 'Admin/HR', 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [email, hash]
  );
  // eslint-disable-next-line no-console
  console.log('[seed] bootstrap admin created');
}

/**
 * Guest is a demonstration/read-around account. It has a random unknown
 * password so the email/password form cannot reach it — the only way in is
 * the dedicated "Continue as Guest" flow in routes/auth.js.
 *
 * Pass 2: the guest row is created with is_evidence_eligible=false and
 * the flag is corrected on every boot for existing installations that
 * were seeded before the column existed. All evidence-facing queries
 * must consult utils/evidence-scope.js — no scattered email comparisons.
 */
async function ensureGuest() {
  const existing = await db.one(
    'SELECT id, is_evidence_eligible FROM users WHERE email = $1',
    [GUEST_EMAIL]
  );
  if (existing) {
    if (existing.is_evidence_eligible !== false) {
      await db.query(
        `UPDATE users SET is_evidence_eligible = false WHERE id = $1`,
        [existing.id]
      );
      // eslint-disable-next-line no-console
      console.log('[seed] guest account corrected: is_evidence_eligible=false');
    } else {
      // eslint-disable-next-line no-console
      console.log('[seed] guest account already exists');
    }
    return;
  }
  const randomPassword = require('crypto').randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(randomPassword, 12);
  await db.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, department, role, is_evidence_eligible)
     VALUES ($1, $2, 'Guest', 'Visitor', 'Guest', 'employee', false)`,
    [GUEST_EMAIL, hash]
  );
  // eslint-disable-next-line no-console
  console.log('[seed] guest account created (is_evidence_eligible=false)');
}

async function seedTemplates() {
  for (const t of TEMPLATES) {
    const exists = await db.one('SELECT id FROM phishing_templates WHERE name = $1', [t.name]);
    if (exists) {
      // Backfill discussion_questions on templates seeded before this column existed.
      if (t.discussion_questions && t.discussion_questions.length) {
        await db.query(
          `UPDATE phishing_templates SET discussion_questions = $1
           WHERE name = $2 AND (discussion_questions IS NULL OR array_length(discussion_questions, 1) IS NULL)`,
          [t.discussion_questions, t.name]
        );
      }
      continue;
    }
    await db.query(
      `INSERT INTO phishing_templates
        (name, category, subject_line, body_html, body_text, difficulty, red_flags, learning_points, discussion_questions, handbook_policy_refs)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        t.name,
        t.category,
        t.subject_line,
        t.body_html,
        t.body_text,
        t.difficulty,
        t.red_flags,
        t.learning_points,
        t.discussion_questions || null,
        t.handbook_policy_refs,
      ]
    );
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] phishing templates ensured (${TEMPLATES.length})`);
}

async function seedBadges() {
  for (const b of BADGES) {
    const exists = await db.one('SELECT id FROM badges WHERE name = $1', [b.name]);
    if (exists) continue;
    await db.query(
      `INSERT INTO badges (name, description, icon, criteria, points_value, tier)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [b.name, b.description, b.icon, b.criteria, b.points_value, b.tier]
    );
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] badges ensured (${BADGES.length})`);
}

async function seedTraining() {
  for (const m of TRAINING) {
    const exists = await db.one('SELECT id FROM training_modules WHERE title = $1', [m.title]);
    if (exists) continue;
    await db.query(
      `INSERT INTO training_modules
        (title, description, content_html, category, difficulty, estimated_minutes, points_reward, cmmc_control, handbook_refs, quiz)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        m.title,
        m.description,
        m.content_html,
        m.category,
        m.difficulty,
        m.estimated_minutes,
        m.points_reward,
        m.cmmc_control,
        m.handbook_refs,
        JSON.stringify(m.quiz),
      ]
    );
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] training modules ensured (${TRAINING.length})`);
}

async function seedTabletop() {
  for (const ex of TABLETOP) {
    const exists = await db.one('SELECT id FROM tabletop_exercises WHERE title = $1', [ex.title]);
    if (exists) continue;
    await db.query(
      `INSERT INTO tabletop_exercises
        (title, objective, scenario_summary, recommended_roles, estimated_minutes, injects, cmmc_control, handbook_refs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        ex.title,
        ex.objective,
        ex.scenario_summary,
        ex.recommended_roles,
        ex.estimated_minutes,
        JSON.stringify(ex.injects),
        ex.cmmc_control,
        ex.handbook_refs,
      ]
    );
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] tabletop exercises ensured (${TABLETOP.length})`);
}

async function run() {
  await migrate();
  await ensureAdmin();
  await ensureGuest();
  await seedTemplates();
  await seedBadges();
  await seedTraining();
  await seedTabletop();
  // eslint-disable-next-line no-console
  console.log('[seed] complete.');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[seed] failed:', e.message);
      process.exit(1);
    });
}

module.exports = { run };
