// routes/leaderboard.js
const express = require('express');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const scope = req.query.scope === 'all' ? 'all' : 'month';
    const dept = req.query.dept && req.query.dept !== 'all' ? req.query.dept : null;

    const timeClause = scope === 'month'
      ? "AND p.created_at >= date_trunc('month', NOW())"
      : '';

    const deptClause = dept ? 'AND u.department = $1' : '';
    const params = dept ? [dept] : [];

    const rows = await db.many(`
      SELECT u.id, u.first_name, u.last_name, u.department,
             COALESCE(SUM(p.points), 0)::int AS pts,
             (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id)::int AS badges,
             (SELECT COUNT(*) FROM user_reports WHERE user_id = u.id)::int AS reports
      FROM users u
      LEFT JOIN points_ledger p ON p.user_id = u.id ${timeClause}
      WHERE u.is_active AND u.role = 'employee' ${deptClause}
      GROUP BY u.id
      ORDER BY pts DESC, u.last_name
    `, params);

    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1, isMe: r.id === req.user.id }));

    const departments = await db.many(`
      SELECT department, COALESCE(SUM(p.points), 0)::int AS pts,
             COUNT(DISTINCT u.id)::int AS members
      FROM users u
      LEFT JOIN points_ledger p ON p.user_id = u.id ${timeClause}
      WHERE u.is_active AND u.role = 'employee'
      GROUP BY department
      ORDER BY pts DESC
    `);

    const allDepts = await db.many(`
      SELECT DISTINCT department FROM users
      WHERE is_active AND role = 'employee' ORDER BY department
    `);

    const champion = ranked[0] || null;

    res.locals.activeNav = 'leaderboard';
    res.render('leaderboard', {
      title: 'Leaderboard',
      scope,
      dept,
      ranked,
      departments,
      allDepts: allDepts.map((d) => d.department),
      champion,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
