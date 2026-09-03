'use strict';

const path = require('path');
const fs = require('fs');

// Load .env from the project root exactly once, before anything reads process.env.
// On Vercel the variables come from the platform, so a missing file is not an error.
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFloat = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_model_studio_api_key_here',
  'your_api_key_here',
  'sk-xxxxxxxx',
  'changeme',
]);

const apiKey = (process.env.ALIBABA_API_KEY || '').trim();
const baseUrl = (process.env.ALIBABA_BASE_URL || '').trim().replace(/\/+$/, '');
const model = (process.env.ALIBABA_MODEL || '').trim();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),

  corsOrigins: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 20),
  },

  ai: {
    provider: 'alibaba-qwen',
    apiKey,
    baseUrl,
    model,
    timeoutMs: toInt(process.env.ALIBABA_TIMEOUT_MS, 20_000),
    maxTokens: toInt(process.env.ALIBABA_MAX_TOKENS, 700),
    temperature: toFloat(process.env.ALIBABA_TEMPERATURE, 0.3),
  },
};

/**
 * True only when every credential needed for a real Qwen call is present.
 * When false the app still works: /api/chat answers from local fallback
 * guidance and clearly labels the response source.
 */
config.ai.isConfigured = Boolean(
  apiKey && !PLACEHOLDER_KEYS.has(apiKey.toLowerCase()) && baseUrl && model
);

config.isProduction = config.nodeEnv === 'production';

module.exports = config;
