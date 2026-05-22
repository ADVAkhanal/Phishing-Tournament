// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../utils/db');
const logger = require('../utils/logger');
const { audit } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { EMAIL_RULE, rejectIfErrors, body } = require('../middleware/validator');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Sign In', error: null, email: '' });
});

router.post(
  '/login',
  loginLimiter,
  [EMAIL_RULE, body('password').isString().isLength({ min: 1, max: 200 })],
  async (req, res, next) => {
    try {
      const email = (req.body.email || '').toLowerCase().trim();
      const password = req.body.password || '';

      const user = await db.one(
        `SELECT id, email, password_hash, first_name, last_name, role, is_active,
                failed_login_attempts, lockout_until
         FROM users WHERE email = $1`,
        [email]
      );

      if (!user || !user.is_active) {
        await audit(null, 'login_failed', { email, reason: 'unknown_or_inactive' }, req.ip);
        return res.status(401).render('auth/login', {
          title: 'Sign In',
          error: 'Invalid email or password.',
          email,
        });
      }

      if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
        await audit(user.id, 'login_blocked_lockout', { email }, req.ip);
        return res.status(429).render('auth/login', {
          title: 'Sign In',
          error: 'Account temporarily locked. Try again later or contact IT.',
          email,
        });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const maxAttempts = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
        let lockoutUntil = null;
        if (attempts >= maxAttempts) {
          const minutes = parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '15', 10);
          lockoutUntil = new Date(Date.now() + minutes * 60 * 1000);
        }
        await db.query(
          'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
          [attempts, lockoutUntil, user.id]
        );
        await audit(user.id, 'login_failed', { email, attempts }, req.ip);
        return res.status(401).render('auth/login', {
          title: 'Sign In',
          error: lockoutUntil ? 'Too many failed attempts. Account is now locked.' : 'Invalid email or password.',
          email,
        });
      }

      await db.query(
        'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = NOW() WHERE id = $1',
        [user.id]
      );

      req.session.userId = user.id;
      req.session.userRole = user.role;

      await audit(user.id, 'login_success', { email }, req.ip);
      logger.info('user_login', { userId: user.id, email });

      return res.redirect('/dashboard');
    } catch (e) {
      next(e);
    }
  }
);

router.post('/logout', (req, res) => {
  const userId = req.session.userId;
  req.session.destroy(() => {
    if (userId) audit(userId, 'logout', null, req.ip);
    res.clearCookie('phishguard.sid');
    res.redirect('/login');
  });
});

router.get('/logout', (req, res) => {
  // GET fallback for plain links — same behavior
  const userId = req.session.userId;
  req.session.destroy(() => {
    if (userId) audit(userId, 'logout', null, req.ip);
    res.clearCookie('phishguard.sid');
    res.redirect('/login');
  });
});

router.get('/forgot', (req, res) => {
  res.render('auth/forgot', { title: 'Forgot Password' });
});

module.exports = router;
