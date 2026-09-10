// seed.js — idempotent seed of admin, templates, badges, training modules
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./utils/db');
const { run: migrate } = require('./migrate');

// TEMPORARY: weak password by explicit request ("for now"). This bypasses the
// app's own stated password policy (12+ chars, upper/lower/digit/symbol) - the
// seed bootstrap path has always written a hash directly rather than going
// through validation, so nothing stops it. Rotate this once real admin
// accounts are in place.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'advancedit@advcosinc.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';

// Guaranteed regardless of what ADMIN_EMAIL/ADMIN_PASSWORD are actually set to
// in the live environment (can't be verified from here) - this specific
// account is what was asked for, so it has to exist independent of whatever
// the env-var-driven bootstrap above resolves to.
const REQUESTED_ADMIN_EMAIL = 'advancedit@advcosinc.com';
const REQUESTED_ADMIN_PASSWORD = '12345';

const GUEST_EMAIL = 'guest@advcosinc.com';

const TEMPLATES = require('./seed-data/templates');
const BADGES = require('./seed-data/badges');
const TRAINING = require('./seed-data/training');
const TABLETOP = require('./seed-data/tabletop');

async function ensureAdmin() {
  const existing = await db.one('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, department, role)
     VALUES ($1, $2, 'Site', 'Admin', 'Admin/HR', 'admin')`,
    [ADMIN_EMAIL, hash]
  );
  // eslint-disable-next-line no-console
  console.log(`[seed] admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

async function ensureRequestedAdmin() {
  const existing = await db.one('SELECT id FROM users WHERE email = $1', [REQUESTED_ADMIN_EMAIL]);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] requested admin already exists: ${REQUESTED_ADMIN_EMAIL}`);
    return;
  }
  const hash = await bcrypt.hash(REQUESTED_ADMIN_PASSWORD, 12);
  await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, department, role)
     VALUES ($1, $2, 'Advanced', 'IT', 'IT', 'admin')`,
    [REQUESTED_ADMIN_EMAIL, hash]
  );
  // eslint-disable-next-line no-console
  console.log(`[seed] requested admin created: ${REQUESTED_ADMIN_EMAIL} / ${REQUESTED_ADMIN_PASSWORD}`);
}

// Shared, no-password Guest account. It has a real (random, unknown) password
// hash so it can never be reached through the normal email/password form -
// the ONLY way in is the dedicated "Continue as Guest" button, which signs in
// by user id directly. role stays 'employee' so it automatically gets exactly
// the non-administrative surface (nav gating and requireAdmin both already
// key off role, nothing extra was needed there).
async function ensureGuest() {
  const existing = await db.one('SELECT id FROM users WHERE email = $1', [GUEST_EMAIL]);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('[seed] guest account already exists');
    return;
  }
  const randomPassword = require('crypto').randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(randomPassword, 12);
  await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, department, role)
     VALUES ($1, $2, 'Guest', 'Visitor', 'Guest', 'employee')`,
    [GUEST_EMAIL, hash]
  );
  // eslint-disable-next-line no-console
  console.log('[seed] guest account created');
}

async function seedTemplates() {
  for (const t of TEMPLATES) {
    const exists = await db.one('SELECT id FROM phishing_templates WHERE name = $1', [t.name]);
    if (exists) {
      // Backfill discussion_questions on templates seeded before this column existed,
      // so a re-run of `npm run seed` upgrades existing rows instead of skipping them.
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
  // Requested admin runs first: if ADMIN_EMAIL happens to already equal this
  // same address, ensureAdmin() below would otherwise win the race and create
  // it with whatever ADMIN_PASSWORD is set to instead of the password that
  // was actually asked for. Running this one first and letting ensureAdmin's
  // own skip-if-exists check see it afterward avoids that without forcing a
  // password reset on every boot (which would undo a real admin's later
  // password change).
  await ensureRequestedAdmin();
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
