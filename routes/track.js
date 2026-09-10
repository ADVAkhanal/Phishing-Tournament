// routes/track.js — automatic open/click tracking, GoPhish-inspired
//
// The single biggest gap versus tools like GoPhish: this app has always
// required an admin to manually click "mark opened" / "mark clicked" for
// every target, one at a time (see the "reset"/"opened"/"clicked" buttons in
// admin/campaigns.js). GoPhish tracks both automatically via a 1x1 pixel and
// a unique per-recipient link. This brings that in WITHOUT reversing the
// app's own deliberate architecture decision that it never sends mail itself
// (README ADR) - the admin still sends the simulated email however they
// already do; these routes just auto-record what the recipient does with it.
//
// Deliberately NOT built: a fake credential-entry landing page. GoPhish
// supports that, but asking an employee to type a password into a page -
// even one that immediately reveals itself as fake - trains the exact motion
// this program exists to unlearn, and in a CMMC/defense context isn't worth
// the risk for the marginal signal it would add. Clicking through reveals the
// test immediately; there is no form.
const express = require('express');
const db = require('../utils/db');
const logger = require('../utils/logger');

const router = express.Router();

// 1x1 transparent GIF, well-known bytes - no static asset needed.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  'base64'
);

async function findByToken(token) {
  if (!token || typeof token !== 'string' || token.length > 64) return null;
  return db.one(
    `SELECT r.id, r.campaign_id, r.user_id, r.outcome, r.email_sent_at,
            c.name AS campaign_name, c.status AS campaign_status,
            t.name AS template_name, t.learning_points, t.discussion_questions,
            t.red_flags, t.handbook_policy_refs
     FROM campaign_results r
     JOIN campaigns c ON c.id = r.campaign_id
     JOIN phishing_templates t ON t.id = c.template_id
     WHERE r.tracking_token = $1`,
    [token]
  );
}

// Open tracking pixel. Always returns a valid image regardless of whether the
// token matched anything - a broken image icon in the recipient's inbox would
// itself be a giveaway, and there's nothing useful an attacker-shaped visitor
// could learn from a 1x1 gif either way.
router.get('/o/:token', async (req, res) => {
  try {
    const hit = await findByToken(req.params.token);
    if (hit) {
      await db.query(
        `UPDATE campaign_results SET email_opened_at = COALESCE(email_opened_at, NOW())
         WHERE id = $1`,
        [hit.id]
      );
    }
  } catch (e) {
    logger.error('Open tracking failed', { error: e.message });
  }
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(PIXEL);
});

// Click-through. Records the click, then immediately reveals the test - no
// fake login form, no delay. This is also where the NCSC-style discussion
// question and red-flag debrief (already built for the logged-in dashboard
// flow) gets shown to someone who may not have an active session at all,
// since they arrived straight from an email client.
router.get('/c/:token', async (req, res, next) => {
  try {
    const hit = await findByToken(req.params.token);
    if (!hit) {
      return res.status(404).render('track/not-found', { title: 'Link Expired' });
    }

    await db.query(
      `UPDATE campaign_results
       SET email_opened_at = COALESCE(email_opened_at, NOW()),
           link_clicked_at = COALESCE(link_clicked_at, NOW()),
           outcome = CASE WHEN outcome = 'reported' THEN outcome ELSE 'clicked' END
       WHERE id = $1`,
      [hit.id]
    );

    logger.info('phish_link_clicked', { campaignId: hit.campaign_id, userId: hit.user_id });

    res.render('track/clicked', {
      title: 'Training Exercise',
      templateName: hit.template_name,
      learningPoints: hit.learning_points,
      discussionQuestion: (hit.discussion_questions && hit.discussion_questions[0]) || null,
      redFlags: hit.red_flags || [],
      handbookRefs: hit.handbook_policy_refs || [],
    });
  } catch (e) { next(e); }
});

module.exports = router;
