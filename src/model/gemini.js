/**
 * Gemini client for LeeTKOB (PA#3, criterion 4).
 *
 * The API key is read from the environment on the worker only; it is never
 * passed into the sandbox (brief, minimum 9). Free tier is fine (README PA#2).
 *
 * Endpoint: Generative Language API, generateContent, with structured output
 * (responseMimeType + responseSchema) so the verdict is JSON we can validate.
 */

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 20_000;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * @param {{
 *   apiKey: string,
 *   model?: string,
 *   system: string,
 *   user: string,
 *   responseSchema?: unknown,
 *   timeoutMs?: number,
 * }} input
 * @returns {Promise<{ text: string, requestId: string, tokensIn: number, tokensOut: number, latencyMs: number }>}
 */
export async function callGemini(input) {
  const {
    apiKey,
    model = process.env.MODEL_NAME || DEFAULT_MODEL,
    system,
    user,
    responseSchema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = input;

  if (!apiKey) throw new Error('callGemini: missing API key');

  const url = `${BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      ...(responseSchema ? { responseSchema } : {}),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    const err = /** @type {any} */ (error);
    if (err && err.name === 'AbortError') {
      const e = /** @type {any} */ (new Error('callGemini: timeout'));
      e.code = 'TIMEOUT';
      throw e;
    }
    throw error;
  }

  const latencyMs = Date.now() - start;
  const requestId = response.headers.get('x-goog-request-id') ?? '';

  let payload;
  try {
    payload = /** @type {any} */ (await response.json());
  } catch {
    clearTimeout(timer);
    throw new Error(`callGemini: non-JSON response (status ${response.status})`);
  }
  clearTimeout(timer);

  if (!response.ok) {
    const message =
      payload && payload.error && payload.error.message
        ? payload.error.message
        : `HTTP ${response.status}`;
    const e = /** @type {any} */ (new Error(`callGemini: ${message}`));
    e.status = response.status;
    throw e;
  }

  const candidate = payload && payload.candidates && payload.candidates[0];
  const text =
    candidate && candidate.content && Array.isArray(candidate.content.parts)
      ? /** @type {any[]} */ (candidate.content.parts)
          .map((p) => (typeof p.text === 'string' ? p.text : ''))
          .join('')
      : '';

  const usage = payload.usageMetadata ?? {};
  return {
    text,
    requestId: payload.responseId || requestId,
    tokensIn: Number(usage.promptTokenCount ?? 0),
    tokensOut: Number(usage.candidatesTokenCount ?? 0),
    latencyMs,
  };
}
