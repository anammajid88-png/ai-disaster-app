'use strict';

/**
 * Typed error for anything that goes wrong while talking to an AI provider.
 * `code` drives both the fallback decision and the user-facing message key,
 * so raw provider text never reaches the browser.
 */
class AiError extends Error {
  constructor(code, message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

const AI_ERROR_CODES = {
  NOT_CONFIGURED: 'AI_NOT_CONFIGURED',
  UNAUTHORIZED: 'AI_UNAUTHORIZED',
  RATE_LIMIT: 'AI_RATE_LIMIT',
  TIMEOUT: 'AI_TIMEOUT',
  UNAVAILABLE: 'AI_UNAVAILABLE',
  NETWORK: 'AI_NETWORK',
  BAD_RESPONSE: 'AI_BAD_RESPONSE',
};

module.exports = { AiError, AI_ERROR_CODES };
