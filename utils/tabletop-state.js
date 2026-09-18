'use strict';

// utils/tabletop-state.js
//
// Centralized primitives for the tabletop session state machine and the
// participant-population reconciliation. Pure functions; no I/O; safe to
// unit-test in isolation.
//
// Route handlers and the session engine (Pass 3) MUST route their
// transition and eligibility checks through this module. If you find
// yourself re-checking `session.status === 'running'` inline, use the
// helper here instead so the invariant lives in one place.

// ── Enumerations ───────────────────────────────────────────────────────────

const SESSION_STATES = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  HOT_WASH: 'hot_wash',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
});

const ATTENDANCE_STATUSES = Object.freeze({
  REQUIRED_PRESENT: 'required_present',
  REQUIRED_ABSENT: 'required_absent',
  EXCUSED: 'excused',
  OBSERVER: 'observer',
  OPTIONAL_PRESENT: 'optional_present',
  EXTERNAL: 'external',
});

const CA_STATUSES = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  CLOSED: 'closed',
  ACCEPTED_EXCEPTION: 'accepted_exception',
});

const MAPPING_TYPES = Object.freeze({
  SUPPORTS: 'supports',
  DEMONSTRATES: 'demonstrates',
  CONTRIBUTES_TO: 'contributes_to',
});

const RESPONSE_TYPES = Object.freeze({
  TEAM: 'team',
  INDIVIDUAL: 'individual',
  FACILITATOR_RECORDED: 'facilitator_recorded',
});

const HOTWASH_CATEGORIES = Object.freeze({
  WHAT_WORKED: 'what_worked',
  WHAT_FAILED: 'what_failed',
  INFO_MISSING: 'info_missing',
  PROCEDURE_UNCLEAR: 'procedure_unclear',
  TECH_FAILED: 'tech_failed',
  SHOULD_CHANGE: 'should_change',
});

// ── Transition graph ───────────────────────────────────────────────────────
//
// Deliberately narrow. Any reactivation of a cancelled or closed session
// must go through an explicit, audited administrative correction path,
// which is NOT part of the ordinary state machine.

const TRANSITIONS = Object.freeze({
  draft:     Object.freeze(['scheduled', 'cancelled']),
  scheduled: Object.freeze(['running', 'cancelled']),
  running:   Object.freeze(['hot_wash']),
  hot_wash:  Object.freeze(['closed']),
  closed:    Object.freeze([]),
  cancelled: Object.freeze([]),
});

function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

function validateTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`Illegal session transition: ${from} → ${to}`);
    err.code = 'ILLEGAL_TRANSITION';
    err.from = from;
    err.to = to;
    throw err;
  }
  return { from, to };
}

// ── Runtime-state gates ────────────────────────────────────────────────────

function canReleaseInject(sessionStatus) {
  return sessionStatus === SESSION_STATES.RUNNING;
}

function canSubmitResponse(sessionStatus) {
  return sessionStatus === SESSION_STATES.RUNNING;
}

// Population may be modified only before the session begins RUNNING.
// After that the roster is frozen; changes require a documented
// administrative correction path (modeled in Pass 3, not here).
function canModifyPopulation(sessionStatus) {
  return sessionStatus === SESSION_STATES.DRAFT
      || sessionStatus === SESSION_STATES.SCHEDULED;
}

// ── Coverage aggregation ───────────────────────────────────────────────────
//
// Pure. Given a list of participant rows with `.attendance_status`, return
// the counts an assessor cares about and the deterministic coverage ratio.
//
// Denominator rules (documented so a future assessor can trace the number):
//   - REQUIRED_APPLICABLE = required_present + required_absent
//   - excused is NEVER in the denominator (rationale: they had a
//     legitimate reason to miss the exercise; counting them against
//     coverage would be misleading)
//   - observer, optional_present, external NEVER contribute to the
//     required denominator (they are not required participants)
//   - coverage_pct = null when the denominator is 0 (no divide-by-zero
//     hidden by a spurious "0%")
//   - total_headcount includes every categorized row for display
//
// Unknown/malformed attendance_status values are ignored — they cannot
// silently distort a compliance number.

function computeCoverage(rows) {
  const buckets = {
    required_present: 0,
    required_absent: 0,
    excused: 0,
    observer: 0,
    optional_present: 0,
    external: 0,
  };
  for (const row of rows) {
    const key = row && row.attendance_status;
    if (buckets[key] === undefined) continue;
    buckets[key] += 1;
  }
  const requiredApplicable = buckets.required_present + buckets.required_absent;
  const coveragePct = requiredApplicable === 0
    ? null
    : Math.round((buckets.required_present / requiredApplicable) * 100);
  return {
    ...buckets,
    required_applicable: requiredApplicable,
    coverage_pct: coveragePct,
    total_headcount:
      buckets.required_present + buckets.required_absent +
      buckets.excused + buckets.observer +
      buckets.optional_present + buckets.external,
  };
}

module.exports = {
  SESSION_STATES,
  ATTENDANCE_STATUSES,
  CA_STATUSES,
  MAPPING_TYPES,
  RESPONSE_TYPES,
  HOTWASH_CATEGORIES,
  TRANSITIONS,
  canTransition,
  validateTransition,
  canReleaseInject,
  canSubmitResponse,
  canModifyPopulation,
  computeCoverage,
};
