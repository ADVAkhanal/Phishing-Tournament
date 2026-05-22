// utils/points.js — atomic points-ledger writes + helpers
const db = require('./db');

const REASONS = {
  REPORT_CORRECT: 'Reported a phishing simulation correctly',
  REPORT_FALSE_POSITIVE: 'Reported (false positive — still rewarded)',
  TRAINING_COMPLETE: 'Completed a training module',
  TRAINING_QUIZ_90: 'Bonus: scored 90% or higher on quiz',
  FIRST_TO_REPORT: 'Bonus: first to report a campaign',
  STREAK_5_DAY: 'Bonus: 5-day reporting streak',
  PERFECT_MONTH: 'Bonus: perfect month (0 clicks, 100% report rate)',
  BADGE_EARNED: 'Badge earned',
};

const AMOUNTS = {
  REPORT_CORRECT: 100,
  REPORT_FALSE_POSITIVE: 50,
  TRAINING_COMPLETE: 50,
  TRAINING_QUIZ_90: 25,
  FIRST_TO_REPORT: 75,
  STREAK_5_DAY: 100,
  PERFECT_MONTH: 200,
};

async function award(userId, points, reason, opts = {}) {
  await db.query(
    `INSERT INTO points_ledger (user_id, points, reason, campaign_id, training_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, points, reason, opts.campaignId || null, opts.trainingId || null]
  );
}

async function totalForUser(userId) {
  const r = await db.one('SELECT COALESCE(SUM(points), 0)::int AS total FROM points_ledger WHERE user_id = $1', [userId]);
  return r ? r.total : 0;
}

async function monthlyForUser(userId) {
  const r = await db.one(
    `SELECT COALESCE(SUM(points), 0)::int AS total
     FROM points_ledger
     WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
    [userId]
  );
  return r ? r.total : 0;
}

function rankTitle(total) {
  if (total >= 5000) return 'Phish Marshal';
  if (total >= 2500) return 'Threat Hunter';
  if (total >= 1000) return 'Sentinel';
  if (total >= 500) return 'Watchstander';
  if (total >= 200) return 'Apprentice';
  return 'Recruit';
}

module.exports = { award, totalForUser, monthlyForUser, rankTitle, REASONS, AMOUNTS };
