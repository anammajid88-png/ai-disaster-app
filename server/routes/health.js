'use strict';

const express = require('express');
const { getAiStatus } = require('../services/aiService');
const { SUPPORTED } = require('../utils/language');
const { disasters } = require('../../shared/data/index.cjs');

const router = express.Router();

const startedAt = Date.now();

/**
 * GET /api/health
 *
 * Reports whether the AI provider is usable WITHOUT ever revealing the key.
 * The client uses `ai.configured` to show an honest badge instead of implying
 * that Qwen is working when it is not.
 */
router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    success: true,
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    ai: getAiStatus(),
    languages: SUPPORTED,
    disasterCount: disasters.length,
  });
});

module.exports = router;
