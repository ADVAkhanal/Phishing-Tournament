// middleware/csrf.js — csurf, with the token exposed to every view
const csurf = require('csurf');

const csrfProtection = csurf({
  cookie: false, // session-backed
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

function csrfWithLocals(req, res, next) {
  csrfProtection(req, res, (err) => {
    if (err) return next(err);
    res.locals.csrfToken = req.csrfToken();
    next();
  });
}

module.exports = csrfWithLocals;
