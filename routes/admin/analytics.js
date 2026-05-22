// routes/admin/analytics.js
const express = require('express');
const db = require('../../utils/db');
const { requireAdmin } = require('../../middleware/auth');
const resilience = require('../../utils/resilience');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const res_ = await resilience.calculate();

    const monthly = await db.many(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW()) - interval '5 months',
          date_trunc('month', NOW()),
          interval '1 month'
        )::date AS m
      )
      SELECT to_char(months.m, 'Mon') AS label,
             COALESCE(SUM(CASE WHEN cr.outcome = 'reported' THEN 1 ELSE 0 END), 0)::int AS reported,
             COALESCE(SUM(CASE WHEN cr.outcome IN ('clicked','compromised') THEN 1 ELSE 0 END), 0)::int AS clicked,
             COALESCE(COUNT(cr.id) FILTER (WHERE cr.outcome <> 'pending'), 0)::int AS total
      FROM months
      LEFT JOIN campaign_results cr
        ON date_trunc('month', cr.created_at) = months.m
      GROUP BY months.m
      ORDER BY months.m
    `);

    const training = await db.many(`
      SELECT tm.title AS label,
             COUNT(tc.id) FILTER (WHERE tc.passed)::int AS passed,
             (SELECT COUNT(*) FROM users WHERE is_active AND role='employee')::int AS expected
      FROM training_modules tm
      LEFT JOIN training_completions tc ON tc.module_id = tm.id
      WHERE tm.is_active
      GROUP BY tm.id, tm.title
      ORDER BY tm.id
    `);

    const byDept = await db.many(`
      SELECT u.department,
             ROUND(AVG(CASE WHEN cr.outcome = 'reported' THEN 100.0
                            WHEN cr.outcome IN ('clicked','compromised') THEN 0.0
                            ELSE NULL END))::int AS avg_score,
             COUNT(cr.id) FILTER (WHERE cr.outcome IN ('clicked','compromised'))::int AS clicks,
             COUNT(cr.id) FILTER (WHERE cr.outcome = 'reported')::int AS reports,
             COUNT(DISTINCT u.id)::int AS members
      FROM users u
      LEFT JOIN campaign_results cr ON cr.user_id = u.id
      WHERE u.is_active AND u.role = 'employee'
      GROUP BY u.department
      ORDER BY u.department
    `);

    const heatmap = await db.many(`
      SELECT u.department, c.difficulty,
             COUNT(*) FILTER (WHERE cr.outcome IN ('clicked','compromised'))::int AS bad,
             COUNT(*) FILTER (WHERE cr.outcome <> 'pending')::int AS total
      FROM campaign_results cr
      JOIN users u ON u.id = cr.user_id
      JOIN campaigns c ON c.id = cr.campaign_id
      GROUP BY u.department, c.difficulty
    `);

    res.locals.activeNav = 'admin-analytics';
    res.render('admin/analytics', {
      title: 'Analytics',
      resilience: res_,
      monthly,
      training,
      byDept,
      heatmap,
    });
  } catch (e) { next(e); }
});

module.exports = router;
