// routes/dashboard.js
const express = require('express');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const points = require('../utils/points');
const resilience = require('../utils/resilience');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [total, monthly] = await Promise.all([
      points.totalForUser(userId),
      points.monthlyForUser(userId),
    ]);

    const badgeCount = await db.one(
      'SELECT COUNT(*)::int AS n FROM user_badges WHERE user_id = $1',
      [userId]
    );

    const recentBadges = await db.many(
      `SELECT b.name, b.icon, b.tier, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC
       LIMIT 5`,
      [userId]
    );

    const top5 = await db.many(
      `SELECT u.id, u.first_name, u.last_name, u.department,
              COALESCE(SUM(p.points),0)::int AS pts
       FROM users u
       LEFT JOIN points_ledger p
         ON p.user_id = u.id
         AND p.created_at >= date_trunc('month', NOW())
       WHERE u.is_active
       GROUP BY u.id
       ORDER BY pts DESC, u.last_name
       LIMIT 5`
    );

    const activity = await db.many(
      `SELECT created_at, reason, points
       FROM points_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    const activeTraining = await db.many(
      `SELECT tm.id, tm.title, tm.cmmc_control, tm.estimated_minutes, tm.points_reward
       FROM training_modules tm
       WHERE tm.is_active
         AND NOT EXISTS (
           SELECT 1 FROM training_completions tc
           WHERE tc.user_id = $1 AND tc.module_id = tm.id AND tc.passed
         )
       ORDER BY tm.id
       LIMIT 3`,
      [userId]
    );

    const learningMoments = await db.many(
      `SELECT c.id AS campaign_id, c.name AS campaign_name, t.name AS template_name,
              t.learning_points, t.red_flags, t.handbook_policy_refs, r.outcome
       FROM campaign_results r
       JOIN campaigns c ON c.id = r.campaign_id
       JOIN phishing_templates t ON t.id = c.template_id
       WHERE r.user_id = $1
         AND r.outcome IN ('clicked', 'compromised')
         AND c.status = 'completed'
       ORDER BY r.created_at DESC
       LIMIT 3`,
      [userId]
    );

    const resScore = await resilience.calculate();
    const rank = points.rankTitle(total);

    res.locals.activeNav = 'dashboard';
    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        total,
        monthly,
        rank,
        badges: badgeCount ? badgeCount.n : 0,
      },
      recentBadges,
      top5,
      activity,
      activeTraining,
      learningMoments,
      resilience: resScore,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
