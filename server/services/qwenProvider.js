'use strict';

const config = require('../config/env');
const logger = require('../utils/logger');
const { AiError, AI_ERROR_CODES } = require('./AiError');

/**
 * Alibaba Cloud Model Studio (Qwen) provider.
 *
 * Talks to the OpenAI-compatible /chat/completions endpoint using the native
 * fetch of Node 18+, so no SDK and no extra dependency is required.
 *
 * The provider is intentionally a thin, swappable module: it receives a plain
 * messages array and returns plain text. Adding another model later means
 * adding a sibling file with the same `createCompletion` signature and
 * registering it in aiService.js - no UI change.
 */

const PROVIDER_ID = 'alibaba-qwen';

function classifyHttpError(status, body) {
  if (status === 401 || status === 403) {
    return new AiError(
      AI_ERROR_CODES.UNAUTHORIZED,
      `Model Studio rejected the credentials (HTTP ${status}).`,
      { status }
    );
  }
  if (status === 429) {
    return new AiError(AI_ERROR_CODES.RATE_LIMIT, 'Model Studio rate limit reached.', {
      status,
      retryable: true,
    });
  }
  if (status >= 500) {
    return new AiError(AI_ERROR_CODES.UNAVAILABLE, `Model Studio is unavailable (HTTP ${status}).`, {
      status,
      retryable: true,
    });
  }
  // 400-level: usually a bad model name or malformed request.
  return new AiError(
    AI_ERROR_CODES.BAD_RESPONSE,
    `Model Studio rejected the request (HTTP ${status}): ${logger.scrub(body).slice(0, 300)}`,
    { status }
  );
}

async function readBodySafely(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

/**
 * @param {Array<{role:string, content:string}>} messages
 * @param {{maxTokens?:number, temperature?:number, signal?:AbortSignal}} [options]
 * @returns {Promise<{text:string, model:string, provider:string, usage:object|null}>}
 */
async function createCompletion(messages, options = {}) {
  const { apiKey, baseUrl, model, timeoutMs, maxTokens, temperature, isConfigured } = config.ai;

  if (!isConfigured) {
    throw new AiError(AI_ERROR_CODES.NOT_CONFIGURED, 'Qwen credentials are not configured.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || maxTokens,
        temperature: options.temperature ?? temperature,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AiError(AI_ERROR_CODES.TIMEOUT, `Qwen request timed out after ${timeoutMs}ms.`, {
        retryable: true,
      });
    }
    throw new AiError(AI_ERROR_CODES.NETWORK, `Could not reach Model Studio: ${error.message}`, {
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw classifyHttpError(response.status, await readBodySafely(response));
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new AiError(AI_ERROR_CODES.BAD_RESPONSE, 'Model Studio returned a non-JSON body.');
  }

  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new AiError(AI_ERROR_CODES.BAD_RESPONSE, 'Model Studio returned an empty answer.');
  }

  return {
    text: text.trim(),
    model: payload.model || model,
    provider: PROVIDER_ID,
    usage: payload.usage || null,
  };
}

module.exports = { PROVIDER_ID, createCompletion };
