// routes/reflection.js — NCSC-style open-ended debrief capture
//
// This is the one-question, thirty-second version of the discussion-question
// principle behind NCSC tabletop exercises, applied to the individual employee
// learning loop instead of a leadership session: reflection captured as real
// evidence of engagement, not just a paragraph the employee may or may not read.
const express = require('express');
const db = require('../utils/db');
const { requireAuth, audit } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');
const { body, rejectIfErrors } = require('../middleware/validator');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  reportLimiter,
  [
    body('campaign_id').isInt({ min: 1 }),
    body('response').trim().isLength({ min: 1, max: 1000 }),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const campaignId = parseInt(req.body.campaign_id, 10);

      // Confirm this campaign actually produced a learning moment for this user —
      // don't let someone post a reflection against a campaign they were never
      // targeted by.
      const eligible = await db.one(
        `SELECT c.id FROM campaign_results r
         JOIN campaigns c ON c.id = r.campaign_id
         WHERE r.user_id = $1 AND c.id = $2 AND r.outcome IN ('clicked','compromised')`,
        [req.user.id, campaignId]
      );
      if (!eligible) {
        return res.status(400).render('error', { title: 'Not eligible', code: 400, message: 'No matching learning moment found for this campaign.' });
      }

      const template = await db.one(
        `SELECT t.discussion_questions FROM campaigns c
         JOIN phishing_templates t ON t.id = c.template_id
         WHERE c.id = $1`,
        [campaignId]
      );
      const question = (template && template.discussion_questions && template.discussion_questions[0]) || 'Reflection';

      await db.query(
        `INSERT INTO reflection_responses (user_id, campaign_id, question, response)
         VALUES ($1,$2,$3,$4)`,
        [req.user.id, campaignId, question, req.body.response]
      );

      await audit(req.user.id, 'reflection_submitted', { campaignId }, req.ip);

      req.session.flash = { type: 'success', msg: 'Thanks — your reflection was recorded.' };
      res.redirect('/dashboard');
    } catch (e) { next(e); }
  }
);

module.exports = router;
