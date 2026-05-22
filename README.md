# PhishGuard Tournament

Gamified phishing-awareness and security-training platform for **Advanced Machining & Fab., Inc.** (dba *Advanced Companies*), a precision aerospace/defense manufacturer in Owasso, OK pursuing **CMMC Level 2** certification.

PhishGuard Tournament is the operational complement to the [Advanced Companies Employee Handbook Dashboard](https://advanced-company-handbook.up.railway.app/Advanced_Handbook_Dashboard.html). Together the two apps form one unified internal security platform: the handbook codifies policy, PhishGuard exercises and measures it.

> "Precision Security. Zero Tolerance for Threats."

---

## What it does

- **Phishing simulation tracker.** Logs who was targeted, who opened, who clicked, and who reported each simulated phish. (The app does **not** send mail itself — it is the system of record around whatever delivery mechanism the admin uses.)
- **Gamified learning loop.** Points, badges, streaks, and a monthly leaderboard turn vigilance into a positive habit. Reporting is *always* rewarded — including false positives — so no employee is ever shamed.
- **Role-based training center.** Eight CMMC-aligned training modules with quizzes, certificates, and cross-references to the employee handbook.
- **CMMC evidence export.** Generates a clean, timestamped CSV mapping every training completion and simulation outcome to NIST 800-171 controls **AT.L2-3.2.1, 3.2.2, 3.2.3** and the corresponding employee-handbook policy sections — assessor-ready.

---

## CMMC compliance mapping

| Control | Title | How PhishGuard satisfies it |
| --- | --- | --- |
| **AT.L2-3.2.1** | Security Awareness | Recurring phishing simulations, awareness training modules, monthly leaderboard, audit log of every interaction |
| **AT.L2-3.2.2** | Role-Based Training | CUI, shop-floor physical security, and incident-reporting modules; quiz completion records per user; department breakdowns |
| **AT.L2-3.2.3** | Insider Threat Awareness | Dedicated insider-threat module, badge, and quiz; insider-threat-themed simulation templates |

---

## Handbook integration mapping

Every training module and phishing template links back to the relevant section(s) of the Advanced Companies Employee Handbook so employees see the *policy basis* behind each lesson.

| Training Module | CMMC | Handbook §§ |
| --- | --- | --- |
| Phishing Fundamentals | AT.L2-3.2.1 | 6.1, 6.12 |
| Social Engineering in Manufacturing | AT.L2-3.2.1 | 6.9, 9.1 |
| Recognizing Insider Threats | AT.L2-3.2.3 | 6.9, 9.1, 5.10 |
| CUI Handling & Protection | AT.L2-3.2.2 | 9.1, 6.1 |
| Password Security & MFA | AT.L2-3.2.1 | 6.1, 6.12 |
| Physical Security on the Shop Floor | AT.L2-3.2.2 | 6.9, 8.2 |
| Incident Reporting Procedures | AT.L2-3.2.2 | 8.2, 8.3, 6.9 |
| Vendor & Supply Chain Threats | AT.L2-3.2.1 | 9.1, 3.1, 2.2 |

---

## Quick start — Railway deployment

1. **Create a Postgres database** in your Railway project (`Add Service → Database → PostgreSQL`). Railway auto-injects `DATABASE_URL`.
2. **Deploy this repo** (`Add Service → GitHub Repo → ADVAkhanal/Phishing-Tournament`).
3. **Set environment variables** from `.env.example`. At minimum: `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `HANDBOOK_URL`.
4. **Open the service URL** and log in with the admin credentials from step 3. The schema migrates and seeds itself on first boot via the `postinstall` script.

That's it. Railway's healthcheck on `/health` will confirm the service is up.

---

## Local development (5 steps)

```bash
# 1. install
npm install

# 2. create .env from the template and fill in DATABASE_URL + SESSION_SECRET
cp .env.example .env

# 3. migrate schema
npm run migrate

# 4. seed templates, badges, training modules, admin user
npm run seed

# 5. run
npm run dev
```

Then open <http://localhost:3000> and log in as the admin.

---

## Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | 64-char random string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `NODE_ENV` | yes | `production` enables secure cookies |
| `PORT` | no | Defaults to 3000 |
| `ADMIN_EMAIL` | yes | Bootstrap admin email |
| `ADMIN_PASSWORD` | yes | Bootstrap admin password (changeable in-app) |
| `HANDBOOK_URL` | yes | URL to the Advanced Companies Employee Handbook Dashboard — wired into the navbar, footer, and every "Related Policies" reference |
| `SESSION_TIMEOUT_MINUTES` | no | Default 30 |
| `LOGIN_MAX_ATTEMPTS` | no | Default 5 |
| `LOGIN_LOCKOUT_MINUTES` | no | Default 15 |

---

## Architecture decision records

- **No ORM.** Direct `pg` with parameterized queries. Eight tables, a solo IT operator, and CMMC audit constraints make a transparent SQL surface the right call — there is no ambiguity about what the app does at the DB layer.
- **EJS, not React.** Server-rendered templates, no build step, no transpiler, no node_modules-in-the-browser. One person can read, edit, and ship this app indefinitely.
- **Tailwind via CDN.** Avoids a build pipeline. The custom CSS in `public/css/custom.css` carries the brand palette so the page still has identity if the CDN is blocked.
- **Sessions in Postgres.** `connect-pg-simple` keeps sessions durable across deploys and lets us forensically audit session activity from the same database that holds everything else.
- **Helmet + CSP, csurf, express-rate-limit, bcrypt(12), express-validator.** Layered defense — none of these are optional in a CMMC environment.
- **Audit log first.** Every state-changing action writes to `audit_log` (JSONB details + IP). This is the table an assessor will read.

---

## Security hardening

- bcrypt(12) password hashes
- CSRF tokens on every POST/PUT/DELETE
- Helmet with strict Content-Security-Policy
- `httpOnly`, `secure`, `sameSite=lax` session cookies
- Rate limiter on `/login` (5 attempts / 15 min, then lockout)
- Password policy: 12+ chars, upper, lower, digit, symbol
- Parameterized queries everywhere — no string interpolation into SQL
- Output-encoded EJS templates (no `<%- %>` for user-supplied content)
- 30-minute idle session timeout
- `winston-daily-rotate-file` for log retention

---

## Project structure

```
phishguard/
├── server.js              # Express entry
├── migrate.js             # Idempotent schema
├── seed.js                # Templates, badges, training modules, admin
├── middleware/            # auth, csrf, rate limiter, validator
├── routes/                # Public + admin + api
├── views/                 # EJS templates
├── public/                # CSS, JS, images
├── utils/                 # db, logger, points, badges, resilience, export
└── logs/                  # winston daily-rotate output
```

---

## License

UNLICENSED — internal use by Advanced Machining & Fab., Inc. only.
