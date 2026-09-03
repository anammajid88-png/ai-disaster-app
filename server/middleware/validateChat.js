'use strict';

const { SUPPORTED } = require('../utils/language');

/**
 * Validates POST /api/chat input before any AI call is made.
 *
 * Rejects empty and oversized messages, normalises the language code and
 * strips history entries that are not plain user/assistant text, so nothing
 * unexpected can reach the prompt builder.
 */

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ENTRIES = 12;

const fail = (res, code, messageKey, status = 400) =>
  res.status(status).json({ success: false, error: { code, messageKey } });

function validateChatRequest(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(res, 'INVALID_BODY', 'errors.invalidRequest');
  }

  if (typeof body.message !== 'string' || !body.message.trim()) {
    return fail(res, 'EMPTY_MESSAGE', 'errors.emptyMessage');
  }

  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return fail(res, 'MESSAGE_TOO_LONG', 'errors.messageTooLong', 413);
  }

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY_ENTRIES)
        .filter(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            (entry.role === 'user' || entry.role === 'assistant') &&
            typeof entry.content === 'string' &&
            entry.content.trim()
        )
        .map((entry) => ({ role: entry.role, content: entry.content }))
    : [];

  req.chat = {
    message: body.message.trim(),
    language: SUPPORTED.includes(body.language) ? body.language : undefined,
    context: typeof body.context === 'string' ? body.context.slice(0, 60) : undefined,
    history,
  };

  return next();
}

module.exports = { validateChatRequest, MAX_MESSAGE_LENGTH };
