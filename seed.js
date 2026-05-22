// seed.js — idempotent seed of admin, templates, badges, training modules
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./utils/db');
const { run: migrate } = require('./migrate');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@advcosinc.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMeNow!2026';

const TEMPLATES = require('./seed-data/templates');
const BADGES = require('./seed-data/badges');
const TRAINING = require('./seed-data/training');

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

async function seedTemplates() {
  for (const t of TEMPLATES) {
    const exists = await db.one('SELECT id FROM phishing_templates WHERE name = $1', [t.name]);
    if (exists) continue;
    await db.query(
      `INSERT INTO phishing_templates
        (name, category, subject_line, body_html, body_text, difficulty, red_flags, learning_points, handbook_policy_refs)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        t.name,
        t.category,
        t.subject_line,
        t.body_html,
        t.body_text,
        t.difficulty,
        t.red_flags,
        t.learning_points,
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

async function run() {
  await migrate();
  await ensureAdmin();
  await seedTemplates();
  await seedBadges();
  await seedTraining();
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
