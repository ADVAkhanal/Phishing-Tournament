// routes/training.js
const express = require('express');
const db = require('../utils/db');
const { requireAuth, audit } = require('../middleware/auth');
const points = require('../utils/points');
const badges = require('../utils/badges');
const { body } = require('../middleware/validator');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.many(`
      SELECT tm.id, tm.title, tm.description, tm.category, tm.difficulty,
             tm.estimated_minutes, tm.points_reward, tm.cmmc_control, tm.handbook_refs,
             tc.passed, tc.completed_at, tc.quiz_score
      FROM training_modules tm
      LEFT JOIN LATERAL (
        SELECT passed, completed_at, quiz_score
        FROM training_completions
        WHERE user_id = $1 AND module_id = tm.id
        ORDER BY created_at DESC LIMIT 1
      ) tc ON true
      WHERE tm.is_active
      ORDER BY tm.id
    `, [req.user.id]);

    res.locals.activeNav = 'training';
    res.render('training/index', { title: 'Training Center', modules: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.redirect('/training');

    const module = await db.one(
      'SELECT * FROM training_modules WHERE id = $1 AND is_active = true',
      [id]
    );
    if (!module) return res.redirect('/training');

    // record start
    await db.query(
      `INSERT INTO training_completions (user_id, module_id, started_at)
       SELECT $1, $2, NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM training_completions
         WHERE user_id = $1 AND module_id = $2 AND completed_at IS NULL
       )`,
      [req.user.id, id]
    );

    const lastCompletion = await db.one(
      `SELECT * FROM training_completions
       WHERE user_id = $1 AND module_id = $2 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1`,
      [req.user.id, id]
    );

    res.locals.activeNav = 'training';
    res.render('training/module', {
      title: module.title,
      module,
      quiz: module.quiz || { questions: [], pass_score: 80 },
      lastCompletion,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/quiz', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const module = await db.one('SELECT id, quiz, title, points_reward FROM training_modules WHERE id = $1', [id]);
    if (!module) return res.redirect('/training');

    const quiz = module.quiz || { questions: [], pass_score: 80 };
    const answers = req.body.answers || {};
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const submitted = parseInt(answers[`q${i}`], 10);
      if (submitted === q.answer) correct += 1;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= (quiz.pass_score || 80);

    await db.query(
      `INSERT INTO training_completions (user_id, module_id, started_at, completed_at, quiz_score, passed)
       VALUES ($1, $2, NOW(), NOW(), $3, $4)`,
      [req.user.id, id, score, passed]
    );

    if (passed) {
      await points.award(req.user.id, module.points_reward, points.REASONS.TRAINING_COMPLETE, { trainingId: id });
      if (score >= 90) {
        await points.award(req.user.id, points.AMOUNTS.TRAINING_QUIZ_90, points.REASONS.TRAINING_QUIZ_90, { trainingId: id });
      }
      await badges.evaluate(req.user.id);
      await audit(req.user.id, 'training_completed', { module: module.title, score }, req.ip);
    } else {
      await audit(req.user.id, 'training_failed_quiz', { module: module.title, score }, req.ip);
    }

    res.render('training/result', {
      title: passed ? 'Training Passed' : 'Try Again',
      module,
      quiz,
      answers,
      score,
      passed,
      correct,
      total: quiz.questions.length,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/certificate', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const module = await db.one('SELECT * FROM training_modules WHERE id = $1', [id]);
    const completion = await db.one(
      `SELECT * FROM training_completions
       WHERE user_id = $1 AND module_id = $2 AND passed
       ORDER BY completed_at DESC LIMIT 1`,
      [req.user.id, id]
    );
    if (!module || !completion) return res.redirect(`/training/${id}`);
    res.render('training/certificate', {
      title: 'Certificate of Completion',
      module,
      completion,
      user: req.user,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
