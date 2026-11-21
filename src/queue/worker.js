/**
 * Worker loop: poll the queue, judge one submission at a time in a sandbox,
 * run hard rules then the model, and store verdicts (PA#3, criterion 2 and 4).
 */

/**
 * @param {{ pollIntervalMs?: number, workerId?: string }} [_options]
 * @returns {Promise<void>}
 */
export async function runWorker(_options = {}) {
  void _options;
  throw new Error('runWorker: not implemented');
}
