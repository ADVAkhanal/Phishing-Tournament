// middleware/auth.js — session-based auth + RBAC + audit
const db = require('../utils/db');

async function attachUser(req, res, next) {
  res.locals.user = null;
  if (req.session && req.session.userId) {
    try {
      const u = await db.one(
        `SELECT id, email, first_name, last_name, department, role, created_at, last_login
         FROM users WHERE id = $1 AND is_active = true`,
        [req.session.userId]
      );
      if (u) {
        req.user = u;
        res.locals.user = u;
      } else {
        req.session.destroy(() => {});
      }
    } catch (_) {
      // tolerate transient DB errors during session attach
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Forbidden',
      code: 403,
      message: 'You do not have permission to view this page.',
    });
  }
  next();
}

async function audit(userId, action, details, ipAddress) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [userId || null, action, details ? JSON.stringify(details) : null, ipAddress || null]
    );
  } catch (_) {
    // never let audit failures break a request
  }
}

module.exports = { attachUser, requireAuth, requireAdmin, audit };
