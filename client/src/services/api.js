/**
 * The only place the client talks to the backend.
 *
 * There is deliberately no AI SDK and no model URL here: the browser knows
 * nothing about Alibaba Cloud, and the API key lives only on the server.
 */

const API_BASE = import.meta.env.VITE_API_URL || `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/api`;
const REQUEST_TIMEOUT_MS = 30_000;

/** Error carrying a translation key so the UI never shows raw server text. */
export class ApiError extends Error {
  constructor(messageKey, { status = 0, code = 'UNKNOWN' } = {}) {
    super(messageKey);
    this.name = 'ApiError';
    this.messageKey = messageKey;
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('errors.offline', { code: 'OFFLINE' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    // Timeout and connection failure look the same to the user: unreachable.
    throw new ApiError('errors.network', {
      code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK',
    });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.error?.messageKey || 'errors.server', {
      status: response.status,
      code: payload?.error?.code || 'SERVER_ERROR',
    });
  }

  return payload;
}

/**
 * POST /api/chat - the assistant turn.
 * @param {{message:string, language:string, context?:string, history?:Array}} input
 */
export const sendChatMessage = ({ message, language, context, history }) =>
  request('/chat', {
    method: 'POST',
    body: { message, language, context, history },
  });

/** GET /api/health - used for the honest "AI ready / stored guidance" badge. */
export const getHealth = () => request('/health', { timeoutMs: 6000 });
