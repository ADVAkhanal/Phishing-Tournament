// routes/admin/tabletop.js — NCSC Exercise-in-a-Box style leadership tabletop drills
const express = require('express');
const db = require('../../utils/db');
const { requireAdmin, audit } = require('../../middleware/auth');
const { adminWriteLimiter } = require('../../middleware/rateLimiter');
const { body, rejectIfErrors } = require('../../middleware/validator');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const exercises = await db.many(
      `SELECT e.id, e.title, e.objective, e.estimated_minutes, e.cmmc_control,
              (SELECT COUNT(*) FROM tabletop_sessions WHERE exercise_id = e.id)::int AS times_run,
              (SELECT MAX(session_date) FROM tabletop_sessions WHERE exercise_id = e.id) AS last_run
       FROM tabletop_exercises e
       WHERE e.is_active
       ORDER BY e.id`
    );
    const sessions = await db.many(
      `SELECT s.id, s.session_date, s.participants, e.title AS exercise_title,
              u.first_name, u.last_name
       FROM tabletop_sessions s
       JOIN tabletop_exercises e ON e.id = s.exercise_id
       LEFT JOIN users u ON u.id = s.facilitated_by
       ORDER BY s.session_date DESC, s.id DESC
       LIMIT 20`
    );
    res.locals.activeNav = 'admin-tabletop';
    res.render('admin/tabletop/index', { title: 'Tabletop Exercises', exercises, sessions });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const exercise = await db.one('SELECT * FROM tabletop_exercises WHERE id = $1', [req.params.id]);
    if (!exercise) {
      return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Exercise not found.' });
    }
    // injects is stored as JSONB — node-postgres returns it already parsed.
    const pastSessions = await db.many(
      `SELECT id, session_date, participants, hot_wash_notes, action_items
       FROM tabletop_sessions WHERE exercise_id = $1 ORDER BY session_date DESC`,
      [exercise.id]
    );
    res.locals.activeNav = 'admin-tabletop';
    res.render('admin/tabletop/guide', { title: exercise.title, exercise, pastSessions });
  } catch (e) { next(e); }
});

router.post(
  '/:id/session',
  adminWriteLimiter,
  [
    body('session_date').isISO8601(),
    body('participants').trim().isLength({ min: 1, max: 2000 }),
    body('hot_wash_notes').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
    body('action_items').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
  ],
  rejectIfErrors,
  async (req, res, next) => {
    try {
      const exercise = await db.one('SELECT id, title FROM tabletop_exercises WHERE id = $1', [req.params.id]);
      if (!exercise) {
        return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Exercise not found.' });
      }

      const participants = req.body.participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      // One line per "owner :: description" pair, matching the NCSC hot-wash
      // principle of assigning a named owner to every follow-up, not just a list
      // of observations nobody is accountable for closing out.
      const actionItems = (req.body.action_items || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [owner, ...rest] = line.split('::');
          return rest.length
            ? { owner: owner.trim(), description: rest.join('::').trim(), status: 'open' }
            : { owner: 'Unassigned', description: line, status: 'open' };
        });

      await db.query(
        `INSERT INTO tabletop_sessions
          (exercise_id, facilitated_by, session_date, participants, hot_wash_notes, action_items)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          exercise.id,
          req.user.id,
          req.body.session_date,
          participants,
          req.body.hot_wash_notes || null,
          JSON.stringify(actionItems),
        ]
      );

      await audit(req.user.id, 'tabletop_session_logged', { exerciseId: exercise.id, title: exercise.title, participantCount: participants.length }, req.ip);

      res.redirect(`/admin/tabletop/${exercise.id}`);
    } catch (e) { next(e); }
  }
);

module.exports = router;
