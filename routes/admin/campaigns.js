// routes/admin/campaigns.js
const express = require('express');
const db = require('../../utils/db');
const { requireAdmin, audit } = require('../../middleware/auth');
const { adminWriteLimiter } = require('../../middleware/rateLimiter');
const { body, rejectIfErrors } = require('../../middleware/validator');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const campaigns = await db.many(`
      SELECT c.id, c.name, c.description, c.status, c.difficulty, c.start_date, c.end_date,
             t.name AS template_name,
             (SELECT COUNT(*) FROM campaign_results WHERE campaign_id = c.id)::int AS targets,
             (SELECT COUNT(*) FROM campaign_results WHERE campaign_id = c.id AND outcome = 'reported')::int AS reported,
             (SELECT COUNT(*) FROM campaign_results WHERE campaign_id = c.id AND outcome IN ('clicked','compromised'))::int AS clicked
      FROM campaigns c
      LEFT JOIN phishing_templates t ON t.id = c.template_id
      ORDER BY c.created_at DESC
    `);
    res.locals.activeNav = 'admin-campaigns';
    res.render('admin/campaigns/index', { title: 'Campaigns', campaigns });
  } catch (e) { next(e); }
});

router.get('/new', async (req, res, next) => {
  try {
    const templates = await db.many('SELECT id, name, difficulty FROM phishing_templates WHERE is_active ORDER BY name');
    const users = await db.many("SELECT id, first_name, last_name, department FROM users WHERE is_active AND role='employee' ORDER BY department, last_name");
    res.locals.activeNav = 'admin-campaigns';
    res.render('admin/campaigns/create', { title: 'New Campaign', templates, users });
  } catch (e) { next(e); }
});

router.post(
  '/new',
  adminWriteLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('template_id').isInt(),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const { name, description, template_id, difficulty, start_date, end_date } = req.body;
      const userIds = [].concat(req.body.user_ids || []).map((v) => parseInt(v, 10)).filter(Number.isInteger);

      const inserted = await db.one(
        `INSERT INTO campaigns (name, description, template_id, difficulty, status, start_date, end_date, created_by)
         VALUES ($1, $2, $3, $4, 'active', $5, $6, $7) RETURNING id`,
        [name, description || null, parseInt(template_id, 10), difficulty,
         start_date ? new Date(start_date) : new Date(),
         end_date ? new Date(end_date) : null,
         req.user.id]
      );

      for (const uid of userIds) {
        await db.query(
          `INSERT INTO campaign_results (campaign_id, user_id, email_sent_at, outcome)
           VALUES ($1, $2, NOW(), 'pending')
           ON CONFLICT (campaign_id, user_id) DO NOTHING`,
          [inserted.id, uid]
        );
      }

      await audit(req.user.id, 'campaign_created', { id: inserted.id, name, targets: userIds.length }, req.ip);
      res.redirect(`/admin/campaigns/${inserted.id}`);
    } catch (e) { next(e); }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const campaign = await db.one(`
      SELECT c.*, t.name AS template_name, t.subject_line, t.body_html, t.red_flags,
             t.learning_points, t.handbook_policy_refs
      FROM campaigns c LEFT JOIN phishing_templates t ON t.id = c.template_id
      WHERE c.id = $1
    `, [id]);
    if (!campaign) return res.redirect('/admin/campaigns');

    const counts = await db.one(`
      SELECT
        COUNT(*) FILTER (WHERE email_sent_at IS NOT NULL)::int AS sent,
        COUNT(*) FILTER (WHERE email_opened_at IS NOT NULL)::int AS opened,
        COUNT(*) FILTER (WHERE link_clicked_at IS NOT NULL)::int AS clicked,
        COUNT(*) FILTER (WHERE credentials_submitted_at IS NOT NULL)::int AS submitted,
        COUNT(*) FILTER (WHERE outcome = 'reported')::int AS reported,
        COUNT(*)::int AS total
      FROM campaign_results WHERE campaign_id = $1
    `, [id]);

    const perUser = await db.many(`
      SELECT u.id, u.first_name, u.last_name, u.department,
             r.email_sent_at, r.email_opened_at, r.link_clicked_at,
             r.credentials_submitted_at, r.reported_at, r.time_to_report_seconds, r.outcome
      FROM campaign_results r JOIN users u ON u.id = r.user_id
      WHERE r.campaign_id = $1
      ORDER BY r.outcome DESC, u.last_name
    `, [id]);

    res.locals.activeNav = 'admin-campaigns';
    res.render('admin/campaigns/detail', { title: campaign.name, campaign, counts, perUser });
  } catch (e) { next(e); }
});

router.post('/:id/result', adminWriteLimiter, async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.user_id, 10);
    const event = req.body.event;
    const allowed = ['opened', 'clicked', 'submitted', 'reset'];
    if (!allowed.includes(event)) return res.redirect(`/admin/campaigns/${campaignId}`);

    if (event === 'opened') {
      await db.query(
        `UPDATE campaign_results SET email_opened_at = COALESCE(email_opened_at, NOW())
         WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, userId]
      );
    } else if (event === 'clicked') {
      await db.query(
        `UPDATE campaign_results
         SET link_clicked_at = COALESCE(link_clicked_at, NOW()),
             outcome = CASE WHEN outcome = 'reported' THEN outcome ELSE 'clicked' END
         WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, userId]
      );
    } else if (event === 'submitted') {
      await db.query(
        `UPDATE campaign_results
         SET credentials_submitted_at = COALESCE(credentials_submitted_at, NOW()),
             link_clicked_at = COALESCE(link_clicked_at, NOW()),
             outcome = 'compromised'
         WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, userId]
      );
    } else if (event === 'reset') {
      await db.query(
        `UPDATE campaign_results
         SET email_opened_at = NULL, link_clicked_at = NULL,
             credentials_submitted_at = NULL, reported_at = NULL,
             time_to_report_seconds = NULL, outcome = 'pending'
         WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, userId]
      );
    }

    await audit(req.user.id, 'campaign_result_updated', { campaignId, userId, event }, req.ip);
    res.redirect(`/admin/campaigns/${campaignId}`);
  } catch (e) { next(e); }
});

router.post('/:id/complete', adminWriteLimiter, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query(`UPDATE campaigns SET status = 'completed', end_date = COALESCE(end_date, NOW()) WHERE id = $1`, [id]);
    // Mark any still-pending as 'ignored'
    await db.query(`UPDATE campaign_results SET outcome = 'ignored' WHERE campaign_id = $1 AND outcome = 'pending'`, [id]);
    await audit(req.user.id, 'campaign_completed', { id }, req.ip);
    res.redirect(`/admin/campaigns/${id}`);
  } catch (e) { next(e); }
});

module.exports = router;
