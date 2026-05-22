// utils/resilience.js — company resilience score
//
// score = (report_rate * 40) + (training_completion_rate * 30) + ((1 - click_rate) * 30)
// rates are 0..1, displayed 0..100.

const db = require('./db');

async function calculate() {
  const cr = await db.one(`
    SELECT
      COUNT(*) FILTER (WHERE outcome = 'reported')::float AS reported,
      COUNT(*) FILTER (WHERE outcome = 'clicked' OR outcome = 'compromised')::float AS clicked,
      COUNT(*)::float AS total
    FROM campaign_results
    WHERE outcome <> 'pending'
  `);

  const tc = await db.one(`
    SELECT
      (SELECT COUNT(*) FROM training_modules WHERE is_active)::float AS modules,
      (SELECT COUNT(*) FROM users WHERE is_active AND role = 'employee')::float AS users,
      (SELECT COUNT(*) FROM training_completions WHERE passed)::float AS completions
  `);

  const totalSims = cr ? cr.total : 0;
  const reportRate = totalSims > 0 ? cr.reported / totalSims : 0;
  const clickRate = totalSims > 0 ? cr.clicked / totalSims : 0;
  const expected = tc.modules * tc.users;
  const completionRate = expected > 0 ? Math.min(1, tc.completions / expected) : 0;

  const score = Math.round(reportRate * 40 + completionRate * 30 + (1 - clickRate) * 30);

  return {
    score: Math.max(0, Math.min(100, score)),
    reportRate: Math.round(reportRate * 100),
    clickRate: Math.round(clickRate * 100),
    completionRate: Math.round(completionRate * 100),
    totalSimulations: totalSims,
    tier: tierFor(score),
  };
}

function tierFor(score) {
  if (score >= 90) return { label: 'EXCELLENT', color: '#10B981' };
  if (score >= 70) return { label: 'STRONG', color: '#10B981' };
  if (score >= 40) return { label: 'DEVELOPING', color: '#F97316' };
  return { label: 'AT RISK', color: '#EF4444' };
}

module.exports = { calculate, tierFor };
