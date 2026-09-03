'use strict';

const express = require('express');
const rateLimit = require('../middleware/rateLimit');
const { validateChatRequest } = require('../middleware/validateChat');
const { generateAnswer } = require('../services/aiService');

const router = express.Router();

/**
 * POST /api/chat
 *
 * Body:    { message, language?, context?, history? }
 * Returns: { success, answer, language, disasterType, source, notice, ... }
 *
 * `source` is "ai" for a real Qwen answer and "fallback" for stored guidance,
 * so the UI can always tell the user where the answer came from.
 */
router.post('/', rateLimit(), validateChatRequest, async (req, res, next) => {
  try {
    const result = await generateAnswer(req.chat);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
