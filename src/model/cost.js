/**
 * Cost arithmetic for the semantic-constraint model (PA#3, criterion 4).
 *
 * The free tier bills 0 USD, but the call log still records the list price so
 * `PA3.md` can show a cost per lab and a projection for 80 submissions.
 * Prices are USD per one million tokens (Google, paid tier, 2026-11).
 */

/** @typedef {{ input: number, output: number }} Price */

/** @type {Price} */
const DEFAULT_PRICE = { input: 0.3, output: 2.5 };

/** @type {Readonly<Record<string, Price>>} */
export const PRICING_USD_PER_MILLION = Object.freeze({
  'gemini-2.5-flash': DEFAULT_PRICE,
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
});

/**
 * List-price cost of one call, rounded to six decimals so a JSONL log stays
 * readable. Unknown models fall back to the 2.5-flash price instead of
 * silently reporting 0.
 *
 * @param {{
 *   model: string,
 *   tokensIn: number,
 *   tokensOut: number,
 *   pricing?: Readonly<Record<string, Price>>,
 * }} input
 * @returns {number}
 */
export function callCostUsd({ model, tokensIn, tokensOut, pricing = PRICING_USD_PER_MILLION }) {
  const price = pricing[model] ?? DEFAULT_PRICE;
  const cost = (tokensIn / 1_000_000) * price.input + (tokensOut / 1_000_000) * price.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * @typedef {{ tokensIn: number, tokensOut: number, costUsd: number }} CallUsage
 */

/**
 * Sum the calls of one lab.
 *
 * @param {CallUsage[]} calls
 * @returns {{ calls: number, tokensIn: number, tokensOut: number, costUsd: number }}
 */
export function summarizeLabCost(calls) {
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;

  for (const call of calls) {
    tokensIn += call.tokensIn;
    tokensOut += call.tokensOut;
    costUsd += call.costUsd;
  }

  return {
    calls: calls.length,
    tokensIn,
    tokensOut,
    costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
  };
}
