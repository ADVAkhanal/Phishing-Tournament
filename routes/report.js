// routes/report.js
const express = require('express');
const db = require('../utils/db');
const { requireAuth, audit } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');
const points = require('../utils/points');
const badges = require('../utils/badges');
const { body, rejectIfErrors } = require('../middleware/validator');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.locals.activeNav = 'report';
  res.render('report', { title: 'Report Suspicious Email', result: null });
});

router.post(
  '/',
  requireAuth,
  reportLimiter,
  [
    body('subject_line').trim().isLength({ min: 1, max: 500 }),
    body('sender_address').trim().isLength({ min: 1, max: 255 }),
    body('reason').trim().isLength({ min: 1, max: 255 }),
    body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const { subject_line, sender_address, reason, notes } = req.body;

      // Try to match against an active campaign by subject substring.
      const match = await db.one(
        `SELECT c.id AS campaign_id, t.id AS template_id, t.subject_line, t.learning_points
         FROM campaigns c
         JOIN phishing_templates t ON t.id = c.template_id
         WHERE c.status = 'active'
           AND (
             position(lower(t.subject_line) in lower($1)) > 0
             OR position(lower($1) in lower(t.subject_line)) > 0
           )
         ORDER BY c.created_at DESC
         LIMIT 1`,
        [subject_line]
      );

      let verdict = 'pending';
      let awarded = 0;
      let feedback = null;

      if (match) {
        verdict = 'true_phish';
        awarded = points.AMOUNTS.REPORT_CORRECT;

        // Update campaign_result for this user
        const result = await db.one(
          'SELECT id, email_sent_at FROM campaign_results WHERE campaign_id = $1 AND user_id = $2',
          [match.campaign_id, req.user.id]
        );

        let ttr = null;
        if (result && result.email_sent_at) {
          ttr = Math.max(0, Math.floor((Date.now() - new Date(result.email_sent_at).getTime()) / 1000));
        }

        await db.query(
          `INSERT INTO campaign_results (campaign_id, user_id, reported_at, report_method, time_to_report_seconds, outcome)
           VALUES ($1, $2, NOW(), 'in-app', $3, 'reported')
           ON CONFLICT (campaign_id, user_id)
           DO UPDATE SET reported_at = EXCLUDED.reported_at,
                         report_method = EXCLUDED.report_method,
                         time_to_report_seconds = COALESCE(campaign_results.time_to_report_seconds, EXCLUDED.time_to_report_seconds),
                         outcome = CASE WHEN campaign_results.outcome IN ('clicked', 'compromised')
                                        THEN campaign_results.outcome
                                        ELSE 'reported' END`,
          [match.campaign_id, req.user.id, ttr]
        );

        // First-to-report bonus
        const firstReportRow = await db.one(
          `SELECT user_id FROM campaign_results
           WHERE campaign_id = $1 AND outcome = 'reported'
           ORDER BY reported_at ASC LIMIT 1`,
          [match.campaign_id]
        );
        if (firstReportRow && firstReportRow.user_id === req.user.id) {
          await points.award(req.user.id, points.AMOUNTS.FIRST_TO_REPORT, points.REASONS.FIRST_TO_REPORT, { campaignId: match.campaign_id });
          awarded += points.AMOUNTS.FIRST_TO_REPORT;
        }

        feedback = {
          ok: true,
          headline: 'Great catch — you spotted an active simulation!',
          detail: match.learning_points,
          pointsAwarded: awarded,
        };
      } else {
        // Reward reporting even if no match — never punish.
        verdict = 'false_positive';
        awarded = points.AMOUNTS.REPORT_FALSE_POSITIVE;
        feedback = {
          ok: false,
          headline: "Thanks for reporting — we couldn't match this to an active simulation.",
          detail: "IT will review it. If it turns out to be a real phishing attempt, you protected the company. If it's legitimate, no harm done — we always reward reporting.",
          pointsAwarded: awarded,
        };
      }

      await db.query(
        `INSERT INTO user_reports (user_id, subject_line, sender_address, reason, notes, matched_campaign_id, verdict, points_awarded)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [req.user.id, subject_line, sender_address, reason, notes || null, match ? match.campaign_id : null, verdict, awarded]
      );

      await points.award(req.user.id, awarded, verdict === 'true_phish' ? points.REASONS.REPORT_CORRECT : points.REASONS.REPORT_FALSE_POSITIVE);

      const earnedBadges = await badges.evaluate(req.user.id);
      feedback.badges = earnedBadges;

      await audit(req.user.id, 'report_submitted', { subject_line, sender_address, verdict, awarded }, req.ip);

      res.locals.activeNav = 'report';
      res.render('report', { title: 'Report Suspicious Email', result: feedback });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
