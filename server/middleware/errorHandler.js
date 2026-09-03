'use strict';

const logger = require('../utils/logger');
const config = require('../config/env');

/** 404 for unknown /api routes. */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', messageKey: 'errors.notFound', path: req.originalUrl },
  });
}

/**
 * Last-resort error handler.
 * The user gets a translation key; the stack trace stays on the server and is
 * scrubbed of credentials before being logged.
 */
function errorHandler(error, req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500;

  logger.error(`[${req.method} ${req.originalUrl}]`, error.stack || error.message);

  const payload = {
    success: false,
    error: { code: 'SERVER_ERROR', messageKey: 'errors.server' },
  };

  // Malformed JSON bodies are a client mistake, not a server crash.
  if (error.type === 'entity.parse.failed') {
    payload.error = { code: 'INVALID_JSON', messageKey: 'errors.invalidRequest' };
    return res.status(400).json(payload);
  }

  if (!config.isProduction) {
    payload.error.debug = logger.scrub(error.message);
  }

  return res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
