// routes/admin/users.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../utils/db');
const { requireAdmin, audit } = require('../../middleware/auth');
const { adminWriteLimiter } = require('../../middleware/rateLimiter');
const { EMAIL_RULE, PASSWORD_RULES, body, rejectIfErrors } = require('../../middleware/validator');

const router = express.Router();
router.use(requireAdmin);

const DEPARTMENTS = ['CNC Operations', 'Engineering', 'Admin/HR', 'C-Suite', 'Quality', 'Shipping/Receiving'];

router.get('/', async (req, res, next) => {
  try {
    const users = await db.many(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.department, u.role, u.is_active,
             u.last_login,
             (SELECT COALESCE(SUM(points),0) FROM points_ledger WHERE user_id = u.id)::int AS pts,
             (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id)::int AS badges
      FROM users u
      ORDER BY u.is_active DESC, u.department, u.last_name
    `);
    res.locals.activeNav = 'admin-users';
    res.render('admin/users/index', { title: 'User Management', users, departments: DEPARTMENTS });
  } catch (e) { next(e); }
});

router.post(
  '/new',
  adminWriteLimiter,
  [
    EMAIL_RULE,
    PASSWORD_RULES,
    body('first_name').trim().isLength({ min: 1, max: 100 }),
    body('last_name').trim().isLength({ min: 1, max: 100 }),
    body('department').isIn(DEPARTMENTS),
    body('role').isIn(['admin', 'employee']),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const { email, first_name, last_name, department, role } = req.body;
      const exists = await db.one('SELECT id FROM users WHERE email = $1', [email]);
      if (exists) {
        req.session.flash = { type: 'error', msg: 'A user with that email already exists.' };
        return res.redirect('/admin/users');
      }
      const hash = await bcrypt.hash(req.body.password, 12);
      const r = await db.one(
        `INSERT INTO users (email, password_hash, first_name, last_name, department, role)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [email, hash, first_name, last_name, department, role]
      );
      await audit(req.user.id, 'user_created', { id: r.id, email, role }, req.ip);
      res.redirect('/admin/users');
    } catch (e) { next(e); }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await db.one('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) return res.redirect('/admin/users');

    const points = await db.many(
      `SELECT created_at, points, reason FROM points_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [id]
    );
    const trainings = await db.many(
      `SELECT tm.title, tc.completed_at, tc.quiz_score, tc.passed
       FROM training_completions tc JOIN training_modules tm ON tm.id = tc.module_id
       WHERE tc.user_id = $1 ORDER BY tc.completed_at DESC`,
      [id]
    );
    const sims = await db.many(
      `SELECT c.name, t.name AS template, r.outcome, r.created_at, r.time_to_report_seconds
       FROM campaign_results r JOIN campaigns c ON c.id = r.campaign_id
       LEFT JOIN phishing_templates t ON t.id = c.template_id
       WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );
    const badges = await db.many(
      `SELECT b.name, b.icon, b.tier, ub.earned_at
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1 ORDER BY ub.earned_at DESC`,
      [id]
    );

    res.locals.activeNav = 'admin-users';
    res.render('admin/users/detail', {
      title: `${user.first_name} ${user.last_name}`,
      u: user,
      points, trainings, sims, badges,
      departments: DEPARTMENTS,
    });
  } catch (e) { next(e); }
});

router.post(
  '/:id/update',
  adminWriteLimiter,
  [
    body('first_name').trim().isLength({ min: 1, max: 100 }),
    body('last_name').trim().isLength({ min: 1, max: 100 }),
    body('department').isIn(DEPARTMENTS),
    body('role').isIn(['admin', 'employee']),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      await db.query(
        `UPDATE users SET first_name = $1, last_name = $2, department = $3, role = $4 WHERE id = $5`,
        [req.body.first_name, req.body.last_name, req.body.department, req.body.role, id]
      );
      await audit(req.user.id, 'user_updated', { id }, req.ip);
      res.redirect(`/admin/users/${id}`);
    } catch (e) { next(e); }
  }
);

router.post('/:id/deactivate', adminWriteLimiter, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
    await audit(req.user.id, 'user_deactivated', { id }, req.ip);
    res.redirect('/admin/users');
  } catch (e) { next(e); }
});

router.post('/:id/activate', adminWriteLimiter, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('UPDATE users SET is_active = true, failed_login_attempts = 0, lockout_until = NULL WHERE id = $1', [id]);
    await audit(req.user.id, 'user_reactivated', { id }, req.ip);
    res.redirect('/admin/users');
  } catch (e) { next(e); }
});

router.post(
  '/:id/reset-password',
  adminWriteLimiter,
  PASSWORD_RULES,
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const hash = await bcrypt.hash(req.body.password, 12);
      await db.query('UPDATE users SET password_hash = $1, failed_login_attempts = 0, lockout_until = NULL WHERE id = $2', [hash, id]);
      await audit(req.user.id, 'user_password_reset', { id }, req.ip);
      req.session.flash = { type: 'success', msg: 'Password reset.' };
      res.redirect(`/admin/users/${id}`);
    } catch (e) { next(e); }
  }
);

module.exports = router;
