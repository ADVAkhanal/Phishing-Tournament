// utils/badges.js — badge evaluation and awarding
const db = require('./db');
const points = require('./points');

async function awardBadge(userId, badgeName) {
  const badge = await db.one('SELECT id, points_value FROM badges WHERE name = $1', [badgeName]);
  if (!badge) return null;
  const existing = await db.one('SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2', [userId, badge.id]);
  if (existing) return null;
  await db.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [userId, badge.id]);
  if (badge.points_value > 0) {
    await points.award(userId, badge.points_value, `Badge earned: ${badgeName}`);
  }
  return badge;
}

// Re-evaluate badge eligibility after a user action. Idempotent.
async function evaluate(userId) {
  const awarded = [];

  const reportCount = await db.one(
    `SELECT COUNT(*)::int AS n FROM user_reports WHERE user_id = $1`,
    [userId]
  );
  if (reportCount && reportCount.n >= 1) {
    const r = await awardBadge(userId, 'First Line of Defense');
    if (r) awarded.push('First Line of Defense');
  }
  if (reportCount && reportCount.n >= 5) {
    const r = await awardBadge(userId, 'Eagle Eye');
    if (r) awarded.push('Eagle Eye');
  }

  const speed = await db.one(
    `SELECT MIN(time_to_report_seconds) AS fastest
     FROM campaign_results
     WHERE user_id = $1 AND reported_at IS NOT NULL`,
    [userId]
  );
  if (speed && speed.fastest !== null && speed.fastest <= 60) {
    const r = await awardBadge(userId, 'Speed Demon');
    if (r) awarded.push('Speed Demon');
  }

  const trainings = await db.one(
    `SELECT
       (SELECT COUNT(*) FROM training_modules WHERE is_active)::int AS total,
       (SELECT COUNT(DISTINCT module_id) FROM training_completions WHERE user_id = $1 AND passed)::int AS passed
    `,
    [userId]
  );
  if (trainings && trainings.total > 0 && trainings.passed >= trainings.total) {
    const r = await awardBadge(userId, 'Security Scholar');
    if (r) awarded.push('Security Scholar');
  }

  const cuiPerfect = await db.one(
    `SELECT 1 FROM training_completions tc
     JOIN training_modules tm ON tm.id = tc.module_id
     WHERE tc.user_id = $1 AND tm.title = 'CUI Handling & Protection' AND tc.quiz_score = 100
     LIMIT 1`,
    [userId]
  );
  if (cuiPerfect) {
    const r = await awardBadge(userId, 'CUI Protector');
    if (r) awarded.push('CUI Protector');
  }

  const insiderDone = await db.one(
    `SELECT 1 FROM training_completions tc
     JOIN training_modules tm ON tm.id = tc.module_id
     WHERE tc.user_id = $1 AND tm.title = 'Recognizing Insider Threats' AND tc.passed
     LIMIT 1`,
    [userId]
  );
  if (insiderDone) {
    const r = await awardBadge(userId, 'Insider Threat Sentinel');
    if (r) awarded.push('Insider Threat Sentinel');
  }

  const shopFloorTitles = [
    'Physical Security on the Shop Floor',
    'Social Engineering in Manufacturing',
  ];
  const shopPassed = await db.one(
    `SELECT COUNT(*)::int AS n
     FROM training_completions tc
     JOIN training_modules tm ON tm.id = tc.module_id
     WHERE tc.user_id = $1 AND tc.passed AND tm.title = ANY($2)`,
    [userId, shopFloorTitles]
  );
  if (shopPassed && shopPassed.n >= shopFloorTitles.length) {
    const r = await awardBadge(userId, 'Shop Floor Guardian');
    if (r) awarded.push('Shop Floor Guardian');
  }

  const streak = await calculateReportStreak(userId);
  if (streak >= 5) {
    const r = await awardBadge(userId, 'On Fire');
    if (r) awarded.push('On Fire');
  }

  return awarded;
}

async function calculateReportStreak(userId) {
  const rows = await db.many(
    `SELECT DISTINCT date_trunc('day', created_at)::date AS d
     FROM user_reports
     WHERE user_id = $1
     ORDER BY d DESC
     LIMIT 30`,
    [userId]
  );
  if (!rows.length) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < rows.length; i++) {
    const target = new Date(today);
    target.setDate(today.getDate() - i);
    const have = rows.some((r) => r.d.getTime() === target.getTime());
    if (have) streak += 1;
    else break;
  }
  return streak;
}

module.exports = { awardBadge, evaluate, calculateReportStreak };
