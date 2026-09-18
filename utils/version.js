'use strict';

// utils/version.js
//
// Stable identifiers stamped onto sessions and evidence packages so an
// assessor (or a future maintainer) can determine exactly which build
// and schema shape produced a given artifact.
//
// SCHEMA_VERSION is a manually-maintained short label. Bump it when
// migrate.js changes in a way that affects evidence semantics.

const pkg = require('../package.json');

module.exports = {
  APP_VERSION: pkg.version,
  SCHEMA_VERSION: '2026-09-18-pass2',
};
