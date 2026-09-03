'use strict';

const config = require('../config/env');
const logger = require('../utils/logger');
const { detectLanguage } = require('../utils/language');
const { detectDisaster } = require('../utils/disaster');
const { buildSystemPrompt, buildMessages } = require('./promptBuilder');
const { buildFallbackAnswer } = require('./fallbackService');
const qwenProvider = require('./qwenProvider');
const { AiError, AI_ERROR_CODES } = require('./AiError');

/**
 * Orchestrates one assistant turn:
 *
 *   detect language + disaster intent
 *     -> ask the configured AI provider (Qwen)
 *          -> on failure, answer from local verified guidance
 *
 * The route layer never talks to a provider directly, so swapping or adding a
 * model only touches PROVIDERS below.
 */

const PROVIDERS = {
  [qwenProvider.PROVIDER_ID]: qwenProvider,
};

// Translation keys the client turns into a friendly banner. No provider text
// or stack trace is ever sent to the browser.
const NOTICE_KEY = {
  [AI_ERROR_CODES.NOT_CONFIGURED]: 'chat.notice.notConfigured',
  [AI_ERROR_CODES.UNAUTHORIZED]: 'chat.notice.unauthorized',
  [AI_ERROR_CODES.RATE_LIMIT]: 'chat.notice.rateLimit',
  [AI_ERROR_CODES.TIMEOUT]: 'chat.notice.timeout',
  [AI_ERROR_CODES.UNAVAILABLE]: 'chat.notice.unavailable',
  [AI_ERROR_CODES.NETWORK]: 'chat.notice.network',
  [AI_ERROR_CODES.BAD_RESPONSE]: 'chat.notice.badResponse',
};

function resolveProvider() {
  return PROVIDERS[config.ai.provider] || qwenProvider;
}

/**
 * @param {{message:string, language?:string, context?:string, history?:Array}} input
 * @returns {Promise<object>} response payload for POST /api/chat
 */
async function generateAnswer({ message, language, context, history }) {
  const trimmed = String(message || '').trim();

  const detectedLanguage = detectLanguage(trimmed, language);
  const detectedDisaster = detectDisaster(trimmed);

  // A disaster page can pass its own id as `context`; trust it only when the
  // message itself did not clearly point somewhere else.
  const disasterType =
    detectedDisaster.disasterType ||
    (typeof context === 'string' && context.trim() ? context.trim() : null);

  const base = {
    success: true,
    language: detectedLanguage.language,
    script: detectedLanguage.script,
    disasterType,
    urgency: detectedDisaster.urgency,
  };

  const provider = resolveProvider();

  try {
    const systemPrompt = buildSystemPrompt({
      language: detectedLanguage.language,
      script: detectedLanguage.script,
      disasterType,
      urgency: detectedDisaster.urgency,
    });

    const messages = buildMessages({ message: trimmed, history, systemPrompt });

    const completion = await provider.createCompletion(messages, {
      // Emergencies need short answers; general questions may run longer.
      maxTokens: detectedDisaster.urgency === 'high' ? 420 : config.ai.maxTokens,
    });

    return {
      ...base,
      answer: completion.text,
      source: 'ai',
      provider: completion.provider,
      model: completion.model,
      notice: null,
    };
  } catch (error) {
    const aiError =
      error instanceof AiError
        ? error
        : new AiError(AI_ERROR_CODES.UNAVAILABLE, error.message || 'Unknown AI failure');

    // Log the real reason for the operator, scrubbed of any credential.
    if (aiError.code === AI_ERROR_CODES.NOT_CONFIGURED) {
      logger.warn('[ai] Qwen not configured - answering from local guidance.');
    } else {
      logger.error(`[ai] ${aiError.code}: ${aiError.message}`);
    }

    const fallback = buildFallbackAnswer(
      disasterType,
      detectedLanguage.language,
      detectedDisaster.urgency
    );

    return {
      ...base,
      disasterType: fallback.disasterType,
      answer: fallback.text,
      source: 'fallback',
      provider: null,
      model: null,
      notice: {
        code: aiError.code,
        messageKey: NOTICE_KEY[aiError.code] || 'chat.notice.unavailable',
        retryable: aiError.retryable,
      },
    };
  }
}

/** Non-secret status used by /api/health and the client's AI badge. */
function getAiStatus() {
  return {
    provider: config.ai.provider,
    configured: config.ai.isConfigured,
    model: config.ai.isConfigured ? config.ai.model : null,
    fallbackAvailable: true,
  };
}

module.exports = { generateAnswer, getAiStatus };
