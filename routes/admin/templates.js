// routes/admin/templates.js
const express = require('express');
const db = require('../../utils/db');
const { requireAdmin, audit } = require('../../middleware/auth');
const { adminWriteLimiter } = require('../../middleware/rateLimiter');
const { body, rejectIfErrors } = require('../../middleware/validator');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const templates = await db.many(`
      SELECT id, name, category, subject_line, difficulty, handbook_policy_refs, is_active
      FROM phishing_templates ORDER BY difficulty, name
    `);
    res.locals.activeNav = 'admin-templates';
    res.render('admin/templates/index', { title: 'Template Library', templates });
  } catch (e) { next(e); }
});

router.get('/new', (req, res) => {
  res.locals.activeNav = 'admin-templates';
  res.render('admin/templates/editor', {
    title: 'New Template',
    template: null,
    mode: 'new',
  });
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tpl = await db.one('SELECT * FROM phishing_templates WHERE id = $1', [id]);
    if (!tpl) return res.redirect('/admin/templates');
    res.locals.activeNav = 'admin-templates';
    res.render('admin/templates/editor', { title: tpl.name, template: tpl, mode: 'edit' });
  } catch (e) { next(e); }
});

router.post(
  '/save',
  adminWriteLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('category').trim().isLength({ min: 1, max: 100 }),
    body('subject_line').trim().isLength({ min: 1, max: 500 }),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('body_html').isString().isLength({ min: 1, max: 50000 }),
    body('body_text').optional({ checkFalsy: true }).isString().isLength({ max: 20000 }),
    body('learning_points').isString().isLength({ min: 1, max: 4000 }),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const id = req.body.id ? parseInt(req.body.id, 10) : null;
      const flagsArr = (req.body.red_flags || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const refsArr = (req.body.handbook_policy_refs || '').split(',').map((s) => s.trim()).filter(Boolean);

      if (id) {
        await db.query(
          `UPDATE phishing_templates
           SET name = $1, category = $2, subject_line = $3, body_html = $4, body_text = $5,
               difficulty = $6, red_flags = $7, learning_points = $8, handbook_policy_refs = $9
           WHERE id = $10`,
          [
            req.body.name, req.body.category, req.body.subject_line, req.body.body_html, req.body.body_text || '',
            req.body.difficulty, flagsArr, req.body.learning_points, refsArr, id,
          ]
        );
        await audit(req.user.id, 'template_updated', { id }, req.ip);
      } else {
        const r = await db.one(
          `INSERT INTO phishing_templates
           (name, category, subject_line, body_html, body_text, difficulty, red_flags, learning_points, handbook_policy_refs)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [
            req.body.name, req.body.category, req.body.subject_line, req.body.body_html, req.body.body_text || '',
            req.body.difficulty, flagsArr, req.body.learning_points, refsArr,
          ]
        );
        await audit(req.user.id, 'template_created', { id: r.id }, req.ip);
      }
      res.redirect('/admin/templates');
    } catch (e) { next(e); }
  }
);

router.post('/:id/toggle', adminWriteLimiter, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('UPDATE phishing_templates SET is_active = NOT is_active WHERE id = $1', [id]);
    await audit(req.user.id, 'template_toggled', { id }, req.ip);
    res.redirect('/admin/templates');
  } catch (e) { next(e); }
});

module.exports = router;
