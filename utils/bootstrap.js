'use strict';

// utils/bootstrap.js
//
// Single source of truth for "fail closed" secret resolution.
// Every process that needs SESSION_SECRET or ADMIN_* credentials MUST route
// through this module. Nothing here substitutes a default. If a required
// value is missing or too weak, we throw with an actionable message and let
// the caller decide whether to exit.
//
// Kept side-effect free so it can be unit-tested without booting the app.

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Return `name` from the environment, requiring at least `minLength` chars.
 * Never substitutes a default. Never logs the resolved value.
 */
function requireEnvSecret(name, opts = {}) {
  const { minLength = 1 } = opts;
  const raw = process.env[name];
  if (raw && raw.length >= minLength) return raw;
  const detail = minLength > 1 ? ` (minimum ${minLength} characters)` : '';
  const err = new Error(
    `[bootstrap] ${name} is required${detail}. ` +
    `Set it before starting the application. No default value will be substituted.`
  );
  err.code = 'BOOTSTRAP_MISSING_SECRET';
  err.envVar = name;
  throw err;
}

/**
 * Return `name` from the environment, non-empty after trim.
 * Never substitutes a default. Never logs the resolved value.
 */
function requireEnvValue(name) {
  const raw = process.env[name];
  if (raw && raw.trim().length > 0) return raw.trim();
  const err = new Error(`[bootstrap] ${name} is required.`);
  err.code = 'BOOTSTRAP_MISSING_ENV';
  err.envVar = name;
  throw err;
}

/**
 * SESSION_SECRET must be at least 32 characters. Rationale: 32 chars of
 * random hex is 128 bits of entropy, which is the minimum below which a
 * signed cookie stops being meaningfully forge-resistant. This threshold
 * is the same one referenced by the README example generator.
 */
function resolveSessionSecret() {
  return requireEnvSecret('SESSION_SECRET', { minLength: 32 });
}

/**
 * Only consulted on a truly fresh database, in seed.js, and only when we
 * are about to CREATE the first admin row. Once any admin exists the
 * seed path does not call this function, which means an existing
 * production deployment does not need these variables set at all and
 * a live admin password is never overwritten by a boot script.
 */
function resolveAdminBootstrapCredentials() {
  const email = requireEnvValue('ADMIN_EMAIL').toLowerCase();
  const password = requireEnvSecret('ADMIN_PASSWORD', { minLength: 12 });
  return { email, password };
}

module.exports = {
  IS_PRODUCTION,
  requireEnvSecret,
  requireEnvValue,
  resolveSessionSecret,
  resolveAdminBootstrapCredentials,
};
