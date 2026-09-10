// routes/admin/reports.js — Executive Report for CEO/directors
//
// Distinct from Analytics (an operational dashboard for whoever runs the
// program day to day) and from the raw CMMC evidence CSV (assessor-facing,
// row-per-record). This is a one-page, print-ready summary built for someone
// who wants the headline numbers and the two or three things that need a
// decision, not a database export.
const express = require('express');
const db = require('../../utils/db');
const { requireAdmin, audit } = require('../../middleware/auth');
const resilience = require('../../utils/resilience');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const resScore = await resilience.calculate();

    const headcount = await db.one(
      `SELECT COUNT(*)::int AS n FROM users WHERE is_active AND role = 'employee'`
    );

    const simsSummary = await db.one(`
      SELECT COUNT(*)::int AS total_targets,
             COUNT(*) FILTER (WHERE outcome = 'reported')::int AS reported,
             COUNT(*) FILTER (WHERE outcome IN ('clicked','compromised'))::int AS clicked,
             ROUND(AVG(time_to_report_seconds) FILTER (WHERE time_to_report_seconds IS NOT NULL))::int AS avg_report_seconds
      FROM campaign_results WHERE outcome <> 'pending'
    `);

    const campaignsRun = await db.one(
      `SELECT COUNT(*)::int AS n FROM campaigns WHERE status = 'completed'`
    );

    // 6-month trend — same shape as the operational Analytics page, kept as its
    // own query here rather than a shared import: this route and Analytics have
    // different audiences and are allowed to diverge without one breaking the other.
    const monthlyTrend = await db.many(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW()) - interval '5 months',
          date_trunc('month', NOW()),
          interval '1 month'
        )::date AS m
      )
      SELECT to_char(months.m, 'Mon YYYY') AS label,
             COALESCE(SUM(CASE WHEN cr.outcome = 'reported' THEN 1 ELSE 0 END), 0)::int AS reported,
             COALESCE(SUM(CASE WHEN cr.outcome IN ('clicked','compromised') THEN 1 ELSE 0 END), 0)::int AS clicked,
             COALESCE(COUNT(cr.id) FILTER (WHERE cr.outcome <> 'pending'), 0)::int AS total
      FROM months
      LEFT JOIN campaign_results cr ON date_trunc('month', cr.created_at) = months.m
      GROUP BY months.m ORDER BY months.m
    `);

    // Worst-first so leadership sees where attention is actually needed first;
    // the framing in the view stays constructive, not a public shame list.
    const byDept = await db.many(`
      SELECT u.department,
             COUNT(DISTINCT u.id)::int AS members,
             COUNT(cr.id) FILTER (WHERE cr.outcome IN ('clicked','compromised'))::int AS clicks,
             COUNT(cr.id) FILTER (WHERE cr.outcome = 'reported')::int AS reports,
             COUNT(cr.id) FILTER (WHERE cr.outcome <> 'pending')::int AS total,
             ROUND(
               100.0 * COUNT(cr.id) FILTER (WHERE cr.outcome = 'reported') /
               NULLIF(COUNT(cr.id) FILTER (WHERE cr.outcome <> 'pending'), 0)
             )::int AS report_rate
      FROM users u
      LEFT JOIN campaign_results cr ON cr.user_id = u.id
      WHERE u.is_active AND u.role = 'employee'
      GROUP BY u.department
      ORDER BY report_rate ASC NULLS LAST, u.department
    `);

    const trainingByModule = await db.many(`
      SELECT tm.title, tm.cmmc_control,
             COUNT(tc.id) FILTER (WHERE tc.passed)::int AS passed,
             (SELECT COUNT(*) FROM users WHERE is_active AND role = 'employee')::int AS expected
      FROM training_modules tm
      LEFT JOIN training_completions tc ON tc.module_id = tm.id
      WHERE tm.is_active
      GROUP BY tm.id, tm.title, tm.cmmc_control
      ORDER BY tm.id
    `);
    const overallTrainingRate = (() => {
      const totalExpected = trainingByModule.reduce((s, m) => s + m.expected, 0);
      const totalPassed = trainingByModule.reduce((s, m) => s + m.passed, 0);
      return totalExpected > 0 ? Math.round((100 * totalPassed) / totalExpected) : 0;
    })();

    const topPerformers = await db.many(`
      SELECT u.first_name, u.last_name, u.department,
             COALESCE(SUM(p.points), 0)::int AS pts
      FROM users u
      LEFT JOIN points_ledger p ON p.user_id = u.id
      WHERE u.is_active AND u.role = 'employee'
      GROUP BY u.id
      ORDER BY pts DESC, u.last_name
      LIMIT 5
    `);

    const badgeCount = await db.one(`SELECT COUNT(*)::int AS n FROM user_badges`);

    const tabletopSummary = await db.one(`
      SELECT COUNT(*)::int AS sessions_run, MAX(session_date) AS last_run
      FROM tabletop_sessions
    `);
    const tabletopExerciseCount = await db.one(`SELECT COUNT(*)::int AS n FROM tabletop_exercises WHERE is_active`);
    const allSessions = await db.many(`SELECT action_items FROM tabletop_sessions`);
    const openActionItems = [];
    for (const s of allSessions) {
      for (const item of s.action_items || []) {
        if (item.status !== 'closed') openActionItems.push(item);
      }
    }

    const cmmcControls = [
      { control: 'AT.L2-3.2.1', title: 'Security Awareness' },
      { control: 'AT.L2-3.2.2', title: 'Role-Based Training' },
      { control: 'AT.L2-3.2.3', title: 'Insider Threat Awareness' },
    ];

    await audit(req.user.id, 'executive_report_viewed', {}, req.ip);

    res.locals.activeNav = 'admin-reports';
    res.render('admin/reports/executive', {
      title: 'Executive Report',
      generatedAt: new Date(),
      resScore,
      headcount: headcount.n,
      simsSummary,
      campaignsRun: campaignsRun.n,
      monthlyTrend,
      byDept,
      trainingByModule,
      overallTrainingRate,
      topPerformers,
      badgeCount: badgeCount.n,
      tabletopSummary,
      tabletopExerciseCount: tabletopExerciseCount.n,
      openActionItems,
      cmmcControls,
    });
  } catch (e) { next(e); }
});

module.exports = router;
