// middleware/validator.js — express-validator helpers
const { body, validationResult } = require('express-validator');

const PASSWORD_RULES = body('password')
  .isString()
  .isLength({ min: 12 })
  .withMessage('Password must be at least 12 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const EMAIL_RULE = body('email').isEmail().withMessage('Valid email required').normalizeEmail();

const STR = (field, opts = {}) =>
  body(field).trim().isString().isLength({ min: opts.min || 1, max: opts.max || 500 });

function rejectIfErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.validationErrors = errors.array();
    if (req.session) req.session.flash = { type: 'error', msg: errors.array().map((e) => e.msg).join(' · ') };
    return res.redirect(req.get('Referrer') || '/');
  }
  next();
}

module.exports = { PASSWORD_RULES, EMAIL_RULE, STR, rejectIfErrors, body, validationResult };
