// routes/api/export.js — CMMC evidence CSV download (admin only)
const express = require('express');
const { requireAdmin, audit } = require('../../middleware/auth');
const exporter = require('../../utils/export');

const router = express.Router();
router.use(requireAdmin);

router.get('/cmmc', async (req, res, next) => {
  try {
    const csv = await exporter.cmmcEvidence();
    const filename = `phishguard-cmmc-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
    await audit(req.user.id, 'cmmc_export', { filename }, req.ip);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) { next(e); }
});

module.exports = router;
