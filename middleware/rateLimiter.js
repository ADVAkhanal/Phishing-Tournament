// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const LOGIN_MAX = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const LOGIN_LOCKOUT_MIN = parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '15', 10);

const loginLimiter = rateLimit({
  windowMs: LOGIN_LOCKOUT_MIN * 60 * 1000,
  max: LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP. Please try again later.',
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many report submissions. Slow down.',
});

const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, reportLimiter, adminWriteLimiter };
