'use strict';

// tests/p0-security.test.js
//
// Node built-in test runner. Invoke with:  npm test
//
// Two categories of assertion:
//   1) Runtime — the fail-closed helpers in utils/bootstrap.js throw when
//      required env vars are missing or below strength thresholds.
//   2) Static — no removed default credential, dev-only fallback string, or
//      hardcoded second-admin identifier survives anywhere in the repo.
//
// The forbidden tokens are represented as concatenations of harmless
// fragments so this test file does not itself become an artifact that
// carries the removed values.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

// ── static scan ─────────────────────────────────────────────────────────────

const FORBIDDEN_TOKENS = [
  // Trivial numeric password that was previously wired as an unconditional
  // second-admin credential. Split so this file does not literalize it.
  ['1', '2', '3', '4', '5'].join(''),
  // The former SESSION_SECRET fallback. Split for the same reason.
  ['dev-only', 'do-not', 'use-in-prod'].join('-'),
  // Removed bootstrap function name.
  'ensureRequestedAdmin',
  // Removed constants.
  'REQUESTED_ADMIN_PASSWORD',
  'REQUESTED_ADMIN_EMAIL',
];

// Walk the repo minus dirs where a hit would be a false positive
// (this test file, cloned dependencies, log output, git internals).
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const skip = new Set(['.git', 'node_modules', 'logs', 'tests']);
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

test('no removed default credential appears anywhere in source', () => {
  const files = walk(REPO);
  const hits = [];
  for (const file of files) {
    let contents;
    try { contents = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const rel = path.relative(REPO, file).replace(/\\/g, '/');
    for (const token of FORBIDDEN_TOKENS) {
      if (contents.includes(token)) hits.push(`${rel} contains a forbidden token`);
    }
  }
  assert.deepEqual(hits, [], `Regressions:\n  ${hits.join('\n  ')}`);
});

test('/health handler does not surface database host or DATABASE_URL flags', () => {
  const src = fs.readFileSync(path.join(REPO, 'server.js'), 'utf8');
  assert.ok(!/databaseUrlHost/.test(src), '/health must not include databaseUrlHost');
  assert.ok(!/hasDatabaseUrl/.test(src), '/health must not include hasDatabaseUrl');
});

test('login page contains no credential hint', () => {
  const src = fs.readFileSync(path.join(REPO, 'views/auth/login.ejs'), 'utf8');
  assert.ok(!/@advcosinc\.com/.test(src), 'login.ejs must not embed a live admin email');
  const triv = ['1', '2', '3', '4', '5'].join('');
  assert.ok(!src.includes(triv), 'login.ejs must not embed a trivial password');
});

// ── runtime — bootstrap.js contract ────────────────────────────────────────

// Load a fresh copy of the module every time so cached env reads do not
// bleed between cases.
function freshBootstrap() {
  const p = require.resolve('../utils/bootstrap');
  delete require.cache[p];
  return require('../utils/bootstrap');
}

function withEnv(overrides, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('resolveSessionSecret throws when SESSION_SECRET is unset', () => {
  withEnv({ SESSION_SECRET: undefined }, () => {
    const { resolveSessionSecret } = freshBootstrap();
    assert.throws(() => resolveSessionSecret(), /SESSION_SECRET is required/);
  });
});

test('resolveSessionSecret throws when SESSION_SECRET is too short', () => {
  withEnv({ SESSION_SECRET: 'x'.repeat(16) }, () => {
    const { resolveSessionSecret } = freshBootstrap();
    assert.throws(() => resolveSessionSecret(), /SESSION_SECRET is required/);
  });
});

test('resolveSessionSecret returns the value when strong', () => {
  const v = 'z'.repeat(64);
  withEnv({ SESSION_SECRET: v }, () => {
    const { resolveSessionSecret } = freshBootstrap();
    assert.equal(resolveSessionSecret(), v);
  });
});

test('resolveAdminBootstrapCredentials throws without ADMIN_EMAIL', () => {
  withEnv({ ADMIN_EMAIL: undefined, ADMIN_PASSWORD: 'p'.repeat(16) }, () => {
    const { resolveAdminBootstrapCredentials } = freshBootstrap();
    assert.throws(() => resolveAdminBootstrapCredentials(), /ADMIN_EMAIL is required/);
  });
});

test('resolveAdminBootstrapCredentials throws without ADMIN_PASSWORD', () => {
  withEnv({ ADMIN_EMAIL: 'someone@example.com', ADMIN_PASSWORD: undefined }, () => {
    const { resolveAdminBootstrapCredentials } = freshBootstrap();
    assert.throws(() => resolveAdminBootstrapCredentials(), /ADMIN_PASSWORD is required/);
  });
});

test('resolveAdminBootstrapCredentials throws when ADMIN_PASSWORD is too short', () => {
  withEnv({ ADMIN_EMAIL: 'someone@example.com', ADMIN_PASSWORD: 'short' }, () => {
    const { resolveAdminBootstrapCredentials } = freshBootstrap();
    assert.throws(() => resolveAdminBootstrapCredentials(), /ADMIN_PASSWORD is required/);
  });
});

test('resolveAdminBootstrapCredentials lowercases email and preserves password', () => {
  const pw = 'q'.repeat(16);
  withEnv({ ADMIN_EMAIL: 'Mixed.Case@Example.COM', ADMIN_PASSWORD: pw }, () => {
    const { resolveAdminBootstrapCredentials } = freshBootstrap();
    const { email, password } = resolveAdminBootstrapCredentials();
    assert.equal(email, 'mixed.case@example.com');
    assert.equal(password, pw);
  });
});

// ── seed.js contract — bootstrap admin path is guarded ─────────────────────

test('seed.js does not reference removed bootstrap helpers or constants', () => {
  const src = fs.readFileSync(path.join(REPO, 'seed.js'), 'utf8');
  assert.ok(!/ensureRequestedAdmin/.test(src));
  assert.ok(!/REQUESTED_ADMIN/.test(src));
  // The admin bootstrap now delegates to utils/bootstrap.js.
  assert.ok(/resolveAdminBootstrapCredentials/.test(src));
  // The bootstrap check must be gated on "no admin exists", not on the
  // presence of a specific email.
  assert.ok(/role\s*=\s*'admin'/.test(src));
});

test('server.js uses resolveSessionSecret and exits on failure', () => {
  const src = fs.readFileSync(path.join(REPO, 'server.js'), 'utf8');
  assert.ok(/resolveSessionSecret\s*\(\s*\)/.test(src));
  assert.ok(/process\.exit\(1\)/.test(src));
});
