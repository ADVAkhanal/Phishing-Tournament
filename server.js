// server.js — PhishGuard Tournament main entry
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const db = require('./utils/db');
const logger = require('./utils/logger');
const csrf = require('./middleware/csrf');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const leaderboardRoutes = require('./routes/leaderboard');
const trainingRoutes = require('./routes/training');
const reportRoutes = require('./routes/report');
const adminCampaigns = require('./routes/admin/campaigns');
const adminTemplates = require('./routes/admin/templates');
const adminAnalytics = require('./routes/admin/analytics');
const adminUsers = require('./routes/admin/users');
const apiExport = require('./routes/api/export');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);

// Trust Railway / proxy headers (required for secure cookies behind a TLS terminator).
app.set('trust proxy', 1);

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helmet — CSP allows our specific CDNs (Tailwind, Google Fonts, Chart.js).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.tailwindcss.com',
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Body parsers
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Static assets
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// Sessions — backed by Postgres so they survive restarts and rollouts.
app.use(
  session({
    store: new PgStore({
      pool: db.pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    name: 'phishguard.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-do-not-use-in-prod',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_MINUTES * 60 * 1000,
    },
  })
);

// Locals available to every view
app.use((req, res, next) => {
  res.locals.HANDBOOK_URL =
    process.env.HANDBOOK_URL ||
    'https://advanced-company-handbook.up.railway.app/Advanced_Handbook_Dashboard.html';
  res.locals.companyName = 'Advanced Machining & Fab., Inc.';
  res.locals.companyShort = 'Advanced Companies';
  res.locals.companyTagline = 'Partners in Manufacturing & Distribution';
  res.locals.appName = 'PhishGuard Tournament';
  res.locals.tagline = 'Precision Security. Zero Tolerance for Threats.';
  res.locals.year = new Date().getFullYear();
  res.locals.activeNav = '';
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use(attachUser);
app.use(csrf);

// Health check (Railway healthcheckPath)
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
  } catch (e) {
    logger.error('Health check DB failure', { error: e.message });
    res.status(503).json({ status: 'degraded', error: 'database unavailable' });
  }
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/training', trainingRoutes);
app.use('/report', reportRoutes);
app.use('/admin/campaigns', adminCampaigns);
app.use('/admin/templates', adminTemplates);
app.use('/admin/analytics', adminAnalytics);
app.use('/admin/users', adminUsers);
app.use('/api/export', apiExport);

// Root → dashboard or login
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  return res.redirect('/login');
});

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    code: 404,
    message: "The page you're looking for doesn't exist.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token rejected', { ip: req.ip, path: req.path });
    return res.status(403).render('error', {
      title: 'Forbidden',
      code: 403,
      message: 'Your session expired or the request could not be verified. Please reload and try again.',
    });
  }
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).render('error', {
    title: 'Server Error',
    code: 500,
    message: 'Something went wrong. The incident has been logged.',
  });
});

async function start() {
  try {
    await db.query('SELECT 1');
    logger.info('Database connected');
  } catch (e) {
    logger.error('Database connection failed at startup', { error: e.message });
  }

  app.listen(PORT, () => {
    logger.info(`PhishGuard Tournament listening on port ${PORT}`);
  });
}

start();

module.exports = app;
