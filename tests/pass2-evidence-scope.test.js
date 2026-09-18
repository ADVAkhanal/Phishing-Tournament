'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  IS_EVIDENCE_ELIGIBLE_COLUMN,
  evidenceScopeAnd,
  evidenceScopeWhere,
  isEvidenceEligible,
} = require('../utils/evidence-scope');

test('canonical column name is exported', () => {
  assert.equal(IS_EVIDENCE_ELIGIBLE_COLUMN, 'is_evidence_eligible');
});

test('evidenceScopeAnd builds an AND clause with the given alias', () => {
  assert.equal(evidenceScopeAnd('u'), ' AND u.is_evidence_eligible = true');
  assert.equal(evidenceScopeAnd('users'), ' AND users.is_evidence_eligible = true');
});

test('evidenceScopeWhere builds a WHERE clause with the given alias', () => {
  assert.equal(evidenceScopeWhere('u'), ' WHERE u.is_evidence_eligible = true');
});

test('scope builders reject invalid identifiers (no injection surface)', () => {
  for (const bad of ['', 'has spaces', "bob'; DROP TABLE users;--", '1abc', null, undefined, '  ']) {
    assert.throws(() => evidenceScopeAnd(bad), /valid identifier/);
    assert.throws(() => evidenceScopeWhere(bad), /valid identifier/);
  }
});

test('isEvidenceEligible defaults to false when the flag is not selected', () => {
  // Fail-closed: if the caller did not select the column, we do not assume
  // eligibility. Callers that intentionally want the loose interpretation
  // must handle that themselves.
  assert.equal(isEvidenceEligible({}), false);
  assert.equal(isEvidenceEligible({ is_evidence_eligible: true }), true);
  assert.equal(isEvidenceEligible({ is_evidence_eligible: false }), false);
  assert.equal(isEvidenceEligible(null), false);
  assert.equal(isEvidenceEligible(undefined), false);
});
