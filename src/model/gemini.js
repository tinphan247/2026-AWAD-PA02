/**
 * Gemini client for LeeTKOB (PA#3, criterion 4).
 *
 * The API key is read from the environment on the worker only; it is never
 * passed into the sandbox (brief, minimum 9).
 */

/**
 * Call the model. Not implemented yet.
 *
 * @param {{
 *   apiKey: string,
 *   model: string,
 *   system: string,
 *   user: string,
 *   timeoutMs: number,
 * }} _input
 * @returns {Promise<{ text: string, requestId: string, tokensIn: number, tokensOut: number, latencyMs: number }>}
 */
export async function callGemini(_input) {
  void _input;
  throw new Error('callGemini: not implemented');
}
