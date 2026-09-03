'use strict';

const config = require('../config/env');

// Anything matching these patterns is masked before it can reach a log line.
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._-]{8,}/gi,
];

/**
 * Removes credentials from any value before it is printed.
 * The live API key is redacted even if it is accidentally interpolated
 * into an error message by a dependency.
 */
function scrub(value) {
  let text =
    typeof value === 'string' ? value : (() => {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })();

  if (config.ai.apiKey && config.ai.apiKey.length > 4) {
    text = text.split(config.ai.apiKey).join('[REDACTED_API_KEY]');
  }
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, '[REDACTED]');
  }
  return text;
}

const stamp = () => new Date().toISOString();

const write = (stream, level, args) => {
  const message = args.map(scrub).join(' ');
  stream(`[${stamp()}] [${level}] ${message}`);
};

module.exports = {
  info: (...args) => write(console.log, 'info', args),
  warn: (...args) => write(console.warn, 'warn', args),
  error: (...args) => write(console.error, 'error', args),
  debug: (...args) => {
    if (!config.isProduction) write(console.log, 'debug', args);
  },
  scrub,
};
