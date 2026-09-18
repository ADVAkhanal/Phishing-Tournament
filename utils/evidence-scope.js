'use strict';

// utils/evidence-scope.js
//
// Canonical evidence-eligibility gate. Every SQL query that produces
// authoritative training / simulation / exercise evidence MUST include
// this filter on the users rows it joins to.
//
// The purpose of the users.is_evidence_eligible column is that there is
// exactly ONE place to change the definition of "eligible for evidence
// aggregation." No route may re-derive that concept from an email
// comparison or from a role check.
//
// - column default is TRUE, so no existing user is silently excluded
// - guest/demo/synthetic accounts are set FALSE by seed.js
// - deactivating a user does NOT touch this flag (deactivation is a
//   separate concern; historical evidence must remain reconstructable)

const IS_EVIDENCE_ELIGIBLE_COLUMN = 'is_evidence_eligible';

const VALID_ALIAS = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Return an AND clause suitable for splicing into an existing WHERE.
 * The alias must be a valid SQL identifier — the caller passes the
 * users-table alias explicitly to keep the intent obvious at the call
 * site (there is often more than one joined users row in a query).
 *
 * Usage:
 *   const scope = evidenceScopeAnd('u');
 *   const rows  = await db.many(`SELECT ... FROM users u WHERE ... ${scope}`);
 *
 * Returns a string beginning with ' AND '.
 */
function evidenceScopeAnd(alias) {
  if (!alias || typeof alias !== 'string' || !VALID_ALIAS.test(alias)) {
    throw new Error('evidenceScopeAnd requires a valid identifier alias');
  }
  return ` AND ${alias}.${IS_EVIDENCE_ELIGIBLE_COLUMN} = true`;
}

/**
 * Same idea for a leading WHERE.
 */
function evidenceScopeWhere(alias) {
  if (!alias || typeof alias !== 'string' || !VALID_ALIAS.test(alias)) {
    throw new Error('evidenceScopeWhere requires a valid identifier alias');
  }
  return ` WHERE ${alias}.${IS_EVIDENCE_ELIGIBLE_COLUMN} = true`;
}

/**
 * Convenience for callers that already have a user object loaded in
 * memory. Defaults to false when the flag is missing, so any user object
 * that was not selected with the column present is safely excluded.
 * Callers that intentionally want the "column not selected" case treated
 * as true must handle that themselves.
 */
function isEvidenceEligible(user) {
  if (!user || typeof user !== 'object') return false;
  return user.is_evidence_eligible === true;
}

module.exports = {
  IS_EVIDENCE_ELIGIBLE_COLUMN,
  evidenceScopeAnd,
  evidenceScopeWhere,
  isEvidenceEligible,
};
