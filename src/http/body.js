/**
 * Read a request body with a hard byte limit.
 *
 * Contract: docs/contract/post-labs-labId-submissions.md §5.4 step 6. The
 * limit is in bytes of the UTF-8 encoding. Once the limit is crossed the
 * server keeps draining the stream (so the client can read the response) but
 * stops buffering, so memory stays bounded.
 */

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {number} limitBytes
 * @returns {Promise<{ bytes: Buffer | null, tooLarge: boolean }>}
 */
export async function readBody(req, limitBytes) {
  /** @type {Buffer[]} */
  const chunks = [];
  let buffered = 0;
  let tooLarge = false;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    buffered += buffer.length;

    if (buffered > limitBytes) {
      tooLarge = true;
      chunks.length = 0;
    } else if (!tooLarge) {
      chunks.push(buffer);
    }
  }

  if (tooLarge) return { bytes: null, tooLarge: true };
  return { bytes: Buffer.concat(chunks), tooLarge: false };
}
