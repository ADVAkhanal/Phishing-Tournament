'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
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
} = require('../utils/tabletop-state');

// ── Transition graph ───────────────────────────────────────────────────────

test('allowed transitions match specification', () => {
  assert.equal(canTransition('draft', 'scheduled'), true);
  assert.equal(canTransition('draft', 'cancelled'), true);
  assert.equal(canTransition('scheduled', 'running'), true);
  assert.equal(canTransition('scheduled', 'cancelled'), true);
  assert.equal(canTransition('running', 'hot_wash'), true);
  assert.equal(canTransition('hot_wash', 'closed'), true);
});

test('forbidden transitions match specification', () => {
  const forbidden = [
    ['closed',    'running'],
    ['cancelled', 'running'],
    ['closed',    'draft'],
    ['closed',    'hot_wash'],
    ['hot_wash',  'running'],
    ['running',   'closed'],
    ['draft',     'running'],
    ['draft',     'closed'],
    ['scheduled', 'hot_wash'],
    ['running',   'cancelled'],
    ['running',   'draft'],
    ['hot_wash',  'cancelled'],
  ];
  for (const [from, to] of forbidden) {
    assert.equal(canTransition(from, to), false, `should be forbidden: ${from} -> ${to}`);
  }
});

test('validateTransition throws an actionable error on an illegal move', () => {
  try {
    validateTransition('closed', 'running');
    assert.fail('expected validateTransition to throw');
  } catch (err) {
    assert.match(err.message, /Illegal session transition/);
    assert.equal(err.code, 'ILLEGAL_TRANSITION');
    assert.equal(err.from, 'closed');
    assert.equal(err.to, 'running');
  }
});

test('validateTransition returns the pair on a legal move', () => {
  assert.deepEqual(
    validateTransition('scheduled', 'running'),
    { from: 'scheduled', to: 'running' }
  );
});

test('every session state has an explicit transition list', () => {
  for (const state of Object.values(SESSION_STATES)) {
    assert.ok(Array.isArray(TRANSITIONS[state]), `no transition list for ${state}`);
  }
});

test('unknown states never appear to be transitionable', () => {
  assert.equal(canTransition('made_up', 'running'), false);
  assert.equal(canTransition('running', 'made_up'), false);
});

// ── Runtime gates ──────────────────────────────────────────────────────────

test('inject release is restricted to RUNNING', () => {
  assert.equal(canReleaseInject('running'), true);
  for (const s of ['draft', 'scheduled', 'hot_wash', 'closed', 'cancelled']) {
    assert.equal(canReleaseInject(s), false, `should be false for ${s}`);
  }
});

test('response submission is restricted to RUNNING', () => {
  assert.equal(canSubmitResponse('running'), true);
  for (const s of ['draft', 'scheduled', 'hot_wash', 'closed', 'cancelled']) {
    assert.equal(canSubmitResponse(s), false, `should be false for ${s}`);
  }
});

test('population modification is restricted to pre-RUNNING', () => {
  assert.equal(canModifyPopulation('draft'), true);
  assert.equal(canModifyPopulation('scheduled'), true);
  for (const s of ['running', 'hot_wash', 'closed', 'cancelled']) {
    assert.equal(canModifyPopulation(s), false, `should be false for ${s}`);
  }
});

// ── Coverage aggregation ───────────────────────────────────────────────────

test('computeCoverage on an empty roster returns null coverage', () => {
  const r = computeCoverage([]);
  assert.equal(r.required_applicable, 0);
  assert.equal(r.coverage_pct, null);
  assert.equal(r.total_headcount, 0);
});

test('computeCoverage matches specification example', () => {
  // Required: 12   Present: 10   Absent: 1   Excused: 1   Observers: 2
  // Coverage denominator = present + absent = 11 (excused excluded)
  // Coverage = 10 / 11 = 91%
  const rows = [
    ...Array(10).fill({ attendance_status: 'required_present' }),
    ...Array(1).fill({ attendance_status: 'required_absent' }),
    ...Array(1).fill({ attendance_status: 'excused' }),
    ...Array(2).fill({ attendance_status: 'observer' }),
  ];
  const r = computeCoverage(rows);
  assert.equal(r.required_present, 10);
  assert.equal(r.required_absent, 1);
  assert.equal(r.excused, 1);
  assert.equal(r.observer, 2);
  assert.equal(r.required_applicable, 11);
  assert.equal(r.coverage_pct, 91);
  assert.equal(r.total_headcount, 14);
});

test('excused rows never enter the denominator', () => {
  const r = computeCoverage([
    { attendance_status: 'required_present' },
    { attendance_status: 'required_present' },
    { attendance_status: 'excused' },
    { attendance_status: 'excused' },
    { attendance_status: 'excused' },
  ]);
  assert.equal(r.required_applicable, 2);
  assert.equal(r.coverage_pct, 100);
});

test('optional_present, observer, and external never enter the required denominator', () => {
  const r = computeCoverage([
    { attendance_status: 'required_absent' },
    { attendance_status: 'optional_present' },
    { attendance_status: 'observer' },
    { attendance_status: 'external' },
  ]);
  assert.equal(r.required_applicable, 1);
  assert.equal(r.coverage_pct, 0);
});

test('unknown attendance status values are ignored (never distort a metric)', () => {
  const r = computeCoverage([
    { attendance_status: 'required_present' },
    { attendance_status: 'made_up_status' },
    { attendance_status: null },
    { attendance_status: undefined },
    null,
    undefined,
    {},
  ]);
  assert.equal(r.required_present, 1);
  assert.equal(r.total_headcount, 1);
});

// ── Enum surface ────────────────────────────────────────────────────────────

test('enum objects are frozen', () => {
  assert.throws(() => { SESSION_STATES.NEW_ONE = 'x'; }, TypeError);
  assert.throws(() => { ATTENDANCE_STATUSES.NEW_ONE = 'y'; }, TypeError);
  assert.throws(() => { CA_STATUSES.NEW_ONE = 'z'; }, TypeError);
  assert.throws(() => { MAPPING_TYPES.NEW_ONE = 'q'; }, TypeError);
  assert.throws(() => { RESPONSE_TYPES.NEW_ONE = 'r'; }, TypeError);
  assert.throws(() => { HOTWASH_CATEGORIES.NEW_ONE = 's'; }, TypeError);
});

test('mapping types cover the three documented values only', () => {
  assert.deepEqual(
    Object.values(MAPPING_TYPES).sort(),
    ['contributes_to', 'demonstrates', 'supports']
  );
});

test('attendance statuses cover the six documented values only', () => {
  assert.deepEqual(
    Object.values(ATTENDANCE_STATUSES).sort(),
    ['excused', 'external', 'observer', 'optional_present', 'required_absent', 'required_present']
  );
});

test('CA statuses cover the five documented values only', () => {
  assert.deepEqual(
    Object.values(CA_STATUSES).sort(),
    ['accepted_exception', 'blocked', 'closed', 'in_progress', 'open']
  );
});

test('hot-wash categories cover the six documented values only', () => {
  assert.deepEqual(
    Object.values(HOTWASH_CATEGORIES).sort(),
    ['info_missing', 'procedure_unclear', 'should_change', 'tech_failed', 'what_failed', 'what_worked']
  );
});
